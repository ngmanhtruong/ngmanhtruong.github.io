/**
 * Portfolio - Pencil Cursor & Freehand Doodle Canvas with Audio
 * Features:
 * 1. Realistic custom pencil cursor with tip hotspot alignment.
 * 2. Full-page canvas allowing visitors to doodle freely anywhere on the notebook.
 * 3. Synthetic Web Audio API pencil scratching sound modulated by drawing speed.
 * 4. Notebook-styled mini toolbar for pencil colors, highlighter, eraser, and mute.
 */

class PencilDoodleEngine {
  constructor() {
    this.svg = null;
    this.currentPath = null;
    this.currentD = '';
    this.isDrawing = false;
    this.points = [];
    
    // Audio engine state
    this.audioCtx = null;
    this.noiseNode = null;
    this.filterNode = null;
    this.gainNode = null;
    this.isAudioMuted = false;
    this.soundPlaying = false;
    this.lastMoveTime = 0;
    this.lastMovePos = { x: 0, y: 0 };
    
    // Tool settings
    this.currentColor = '#36384a'; // Graphite pencil
    this.currentTool = 'pencil';   // 'pencil', 'blue', 'red', 'highlighter'
    this.lineWidth = 2.8;
    this.isHighlighter = false;
    
    this.init();
  }

  init() {
    this.setupPencilCursor();
    this.setupDrawingLayer();
    this.setupToolbar();
    this.setupEventListeners();
  }

  /**
   * Injects the SVG pencil cursor into CSS.
   */
  setupPencilCursor() {
    // SVG of an authentic wooden hexagonal pencil with graphite tip at bottom-left (2, 30)
    const pencilSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" fill="none">
        <!-- Shadow -->
        <path d="M4 31 L30 5" stroke="rgba(0,0,0,0.15)" stroke-width="6" stroke-linecap="round"/>
        <!-- Pencil Body (Yellow) -->
        <path d="M11 23 L25 9 L28 12 L14 26 Z" fill="#e6b83b" stroke="#36384a" stroke-width="1.2"/>
        <path d="M12.5 24.5 L26.5 10.5 L27.2 11.2 L13.2 25.2 Z" fill="#f5ce58"/>
        <!-- Eraser Ferrule (Silver) -->
        <path d="M25 9 L28 12 L29.5 10.5 L26.5 7.5 Z" fill="#cbd5e1" stroke="#36384a" stroke-width="1"/>
        <!-- Eraser (Pink) -->
        <path d="M26.5 7.5 L29.5 10.5 L31 9 L28 6 Z" fill="#f472b6" stroke="#36384a" stroke-width="1"/>
        <!-- Sharpened Wood Collar -->
        <path d="M11 23 L14 26 L4 30 Z" fill="#eed9b3" stroke="#36384a" stroke-width="1"/>
        <!-- Graphite Tip -->
        <path d="M6 28 L8 29.5 L2 32 Z" fill="#26283a"/>
        <circle cx="2" cy="32" r="1.5" fill="#1e202e"/>
      </svg>
    `.trim().replace(/\s+/g, ' ');

    const cursorUrl = `url("data:image/svg+xml,${encodeURIComponent(pencilSvg)}") 2 32, auto`;
    
    const style = document.createElement('style');
    style.id = 'pencil-cursor-styles';
    style.textContent = `
      html, body, .pg {
        cursor: ${cursorUrl} !important;
      }
      a, button, input, label, select, textarea, .btn, .lk, .enjoy-item, .nav a {
        cursor: ${cursorUrl} !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Creates lightweight, hardware-accelerated vector SVG overlay for doodles.
   * Eliminates memory bloat, tile-rasterization latency, and white screen during scrolling.
   */
  setupDrawingLayer() {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.id = 'doodle-layer';
    this.svg.setAttribute('aria-hidden', 'true');
    this.svg.style.position = 'absolute';
    this.svg.style.top = '0';
    this.svg.style.left = '0';
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.pointerEvents = 'none';
    this.svg.style.zIndex = '15';
    this.svg.style.overflow = 'visible';

    document.body.appendChild(this.svg);
  }

  /**
   * Initializes Web Audio API for synthetic pencil scratch sound.
   */
  initAudio() {
    if (this.audioCtx) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();

      // Create white noise buffer for continuous pencil friction
      const bufferSize = this.audioCtx.sampleRate * 2;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Textured paper friction profile
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.45;
      }

      this.noiseNode = this.audioCtx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      // Bandpass filter centered around 2800Hz (the scrape resonance of graphite on paper)
      this.filterNode = this.audioCtx.createBiquadFilter();
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.value = 2800;
      this.filterNode.Q.value = 3.2;

      // Highpass to eliminate low rumble
      const highpass = this.audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 1100;

      // Master gain for dynamic velocity modulation
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(highpass);
      highpass.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.noiseNode.start(0);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  playScratchSound(speed = 1) {
    if (this.isAudioMuted || !this.gainNode || !this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;
    // Modulate volume and frequency according to movement speed
    const normalizedSpeed = Math.min(Math.max(speed / 18, 0.15), 1.0);
    const targetGain = 0.08 * normalizedSpeed;
    const targetFreq = 2400 + normalizedSpeed * 900;

    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.linearRampToValueAtTime(targetGain, now + 0.03);

    if (this.filterNode) {
      this.filterNode.frequency.cancelScheduledValues(now);
      this.filterNode.frequency.linearRampToValueAtTime(targetFreq, now + 0.03);
    }
    
    this.soundPlaying = true;
  }

  stopScratchSound() {
    if (!this.gainNode || !this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.05);
    this.soundPlaying = false;
  }

  /**
   * Sets up mouse & touch listeners.
   */
  setupEventListeners() {
    const getPageCoords = (e) => {
      const pageX = e.pageX !== undefined ? e.pageX : (e.touches && e.touches[0] ? e.touches[0].pageX : 0);
      const pageY = e.pageY !== undefined ? e.pageY : (e.touches && e.touches[0] ? e.touches[0].pageY : 0);
      return { x: pageX, y: pageY };
    };

    const startDrawing = (e) => {
      // Allow interaction with links, buttons, inputs, toolbar widgets
      if (e.target.closest('a, button, input, label, select, textarea, .doodle-toolbar')) {
        return;
      }
      
      // Initialize audio on first user gesture
      this.initAudio();

      this.isDrawing = true;
      const { x, y } = getPageCoords(e);
      this.points = [{ x, y }];
      this.lastMovePos = { x, y };
      this.lastMoveTime = performance.now();

      // Create new SVG path for this stroke
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');

      if (this.isHighlighter) {
        path.setAttribute('stroke', '#d3ec45');
        path.setAttribute('stroke-width', '18');
        path.setAttribute('stroke-linecap', 'square');
        path.setAttribute('stroke-linejoin', 'bevel');
        path.setAttribute('opacity', '0.42');
      } else {
        path.setAttribute('stroke', this.currentColor);
        path.setAttribute('stroke-width', '2.8');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('opacity', '0.85');
      }

      this.currentD = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      path.setAttribute('d', this.currentD);
      this.svg.appendChild(path);
      this.currentPath = path;

      this.playScratchSound(0.5);
    };

    const moveDrawing = (e) => {
      if (!this.isDrawing || !this.currentPath) return;

      const { x, y } = getPageCoords(e);
      const now = performance.now();
      const dt = now - this.lastMoveTime || 16;
      const dist = Math.hypot(x - this.lastMovePos.x, y - this.lastMovePos.y);
      if (dist < 2.5) return;

      const speed = dist / (dt / 16);
      this.lastMoveTime = now;
      this.lastMovePos = { x, y };
      this.points.push({ x, y });

      // Smooth path using midpoint quadratic bézier curves
      const pPrev = this.points[this.points.length - 2];
      const midX = (pPrev.x + x) / 2;
      const midY = (pPrev.y + y) / 2;
      this.currentD += ` Q ${pPrev.x.toFixed(1)} ${pPrev.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
      this.currentPath.setAttribute('d', this.currentD);

      this.playScratchSound(speed);
    };

    const stopDrawing = () => {
      if (!this.isDrawing) return;
      if (this.currentPath && this.points.length > 1) {
        const lastPt = this.points[this.points.length - 1];
        this.currentD += ` L ${lastPt.x.toFixed(1)} ${lastPt.y.toFixed(1)}`;
        this.currentPath.setAttribute('d', this.currentD);
      }
      this.isDrawing = false;
      this.currentPath = null;
      this.points = [];
      this.stopScratchSound();
    };

    window.addEventListener('mousedown', startDrawing);
    window.addEventListener('mousemove', moveDrawing);
    window.addEventListener('mouseup', stopDrawing);
    window.addEventListener('mouseleave', stopDrawing);

    // Touch support for tablet / mobile pencils
    window.addEventListener('touchstart', (e) => {
      if (e.target.closest('a, button, input, label, select, textarea, .doodle-toolbar')) return;
      startDrawing(e);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      moveDrawing(e);
    }, { passive: true });

    window.addEventListener('touchend', stopDrawing);
  }

  /**
   * Clears all doodles from the notebook page.
   */
  clearCanvas() {
    if (!this.svg) return;
    this.svg.innerHTML = '';
  }

  /**
   * Floating doodle toolbar widget.
   */
  setupToolbar() {
    const toolbar = document.createElement('aside');
    toolbar.className = 'doodle-toolbar rbox minimized';
    toolbar.setAttribute('aria-label', 'Notebook Drawing Tools');
    toolbar.innerHTML = `
      <div class="toolbar-header">
        <span class="hw" style="font-size:22px;color:var(--red)">✏️ Doodle</span>
        <button class="tool-btn toggle-btn" title="Expand toolbar" aria-label="Toggle toolbar">+</button>
      </div>
      <div class="toolbar-body">
        <div class="color-picker">
          <button class="color-btn active" data-color="#36384a" data-tool="pencil" title="Graphite Pencil" style="background:#36384a"></button>
          <button class="color-btn" data-color="#1f40a8" data-tool="blue" title="Blue Pen" style="background:#1f40a8"></button>
          <button class="color-btn" data-color="#9b2c3a" data-tool="red" title="Red Pen" style="background:#9b2c3a"></button>
          <button class="color-btn" data-color="#d3ec45" data-tool="highlighter" title="Highlighter" style="background:#d3ec45;border:1px solid #b5cc29"></button>
        </div>
        <div class="action-buttons">
          <button class="tool-btn clear-btn" title="Clear all drawings (Eraser)">🧽 Clear</button>
        </div>
      </div>
    `;

    document.body.appendChild(toolbar);

    // Toolbar styling
    const style = document.createElement('style');
    style.textContent = `
      .doodle-toolbar {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 900;
        background: #faf6ea;
        padding: 8px 12px;
        border-radius: 4px;
        box-shadow: 0 4px 14px rgba(70,50,10,0.18);
        border: 1.5px solid var(--pencil);
        user-select: none;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .doodle-toolbar.minimized .toolbar-body {
        display: none;
      }
      .toolbar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .toolbar-body {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .color-picker {
        display: flex;
        gap: 8px;
      }
      .color-btn {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        transition: transform 0.15s ease, border-color 0.15s ease;
      }
      .color-btn.active {
        transform: scale(1.15);
        border-color: #26283a;
        box-shadow: 0 0 0 1px white inset;
      }
      .action-buttons {
        display: flex;
        gap: 6px;
      }
      .tool-btn {
        background: rgba(255,255,255,0.7);
        border: 1px solid var(--pencil);
        border-radius: 3px;
        font-family: 'Patrick Hand', cursive;
        font-size: 15px;
        padding: 2px 8px;
        color: var(--ink);
        cursor: pointer;
        transition: background 0.15s;
      }
      .tool-btn:hover {
        background: rgba(211,236,69,0.4);
      }
      @media (max-width: 640px) {
        .doodle-toolbar {
          left: 12px;
          bottom: 12px;
        }
      }
    `;
    document.head.appendChild(style);

    // Color button handlers
    const colorBtns = toolbar.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tool = btn.dataset.tool;
        if (tool === 'highlighter') {
          this.isHighlighter = true;
          this.currentColor = '#d3ec45';
        } else {
          this.isHighlighter = false;
          this.currentColor = btn.dataset.color;
          this.lineWidth = 2.8;
        }
      });
    });

    // Clear canvas button
    toolbar.querySelector('.clear-btn').addEventListener('click', () => {
      this.clearCanvas();
    });

    // Minimize toggle button
    const toggleBtn = toolbar.querySelector('.toggle-btn');
    toggleBtn.addEventListener('click', () => {
      const isMin = toolbar.classList.toggle('minimized');
      toggleBtn.textContent = isMin ? '+' : '−';
      toggleBtn.title = isMin ? 'Expand toolbar' : 'Minimize toolbar';
    });
  }
}

// Automatically instantiate when DOM is ready.
// Skipped on touch-only devices: finger scrolling would leave stray pencil strokes.
document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
  window.pencilDoodle = new PencilDoodleEngine();
});
