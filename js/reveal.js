/**
 * Portfolio - "Written on the page" scroll reveal.
 * Text is split into words that are wiped in left-to-right (like pencil strokes) when its
 * block scrolls into view; boxes sweep open, highlighter marks and underlines draw afterwards.
 * Only uses IntersectionObserver + CSS transitions (no scroll listeners) to stay smooth.
 * Disabled for prefers-reduced-motion and when IntersectionObserver is missing.
 */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  const TEXT_UNITS = [
    '.hero-greeting .note', '.hero-title', '.hero-subtitle', '.hero-desc',
    '.sec-title', '.sec h3', '.sec p', '.sec li', '.sec .tag', '.sec .note',
    '.sec .fill', '.sec .when',
  ].join(',');
  const BOXES = '.rbox.card, .notebook-card, .contact-card';
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'SVG', 'INPUT', 'BUTTON', 'TEXTAREA']);
  const MAX_WORD_DELAY = 45;   // ms between words
  const MAX_UNIT_TIME = 900;   // ms: long paragraphs speed up so they never drag

  const wrapWords = (unit) => {
    const nodes = [];
    const walker = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        for (let p = n.parentNode; p && p !== unit; p = p.parentNode) {
          if (SKIP_TAGS.has(p.nodeName.toUpperCase())) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);

    let count = 0;
    const pieces = nodes.map((node) => {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const span = document.createElement('span');
        span.className = 'rv-w';
        span.textContent = part;
        span.style.setProperty('--i', count++);
        frag.appendChild(span);
      });
      return [node, frag];
    });
    pieces.forEach(([node, frag]) => node.parentNode.replaceChild(frag, node));

    const step = Math.min(MAX_WORD_DELAY, MAX_UNIT_TIME / Math.max(count, 1));
    unit.style.setProperty('--step', step + 'ms');
  };

  const allUnits = Array.from(document.querySelectorAll(TEXT_UNITS));
  // Keep only outermost units so a unit never contains another one.
  const units = allUnits.filter((el) => !allUnits.some((o) => o !== el && o.contains(el)));
  const boxes = Array.from(document.querySelectorAll(BOXES));
  const doodles = Array.from(document.querySelectorAll('.sec .dd.abs'));

  document.documentElement.classList.add('rv-ready');
  units.forEach((u) => { wrapWords(u); u.classList.add('rv'); });
  boxes.forEach((b) => b.classList.add('rv-box'));
  doodles.forEach((d) => d.classList.add('rv-doodle'));

  const io = new IntersectionObserver((entries) => {
    let n = 0;
    entries.filter((e) => e.isIntersecting).forEach((e) => {
      const el = e.target;
      io.unobserve(el);
      // Stagger items that enter the viewport in the same batch.
      el.style.setProperty('--base', (n++ * 120) + 'ms');
      el.classList.add('rv-on');
      if (el.classList.contains('rv-box')) {
        el.addEventListener('transitionend', function done(ev) {
          if (ev.target !== el || ev.propertyName !== 'clip-path') return;
          el.classList.add('rv-done'); // drop clip-path so hover scale/rotate is never clipped
          el.removeEventListener('transitionend', done);
        });
      }
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.01 });

  [...units, ...boxes, ...doodles].forEach((el) => io.observe(el));
})();
