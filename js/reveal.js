/**
 * Portfolio - "Written on the page" scroll reveal (all pages).
 * Text is split into words that are wiped in left-to-right when its block scrolls into view;
 * visible blocks are written one after another in reading order (top to bottom). Boxes open
 * top to bottom, highlighter marks and underlines are drawn after the words.
 * Only uses IntersectionObserver + CSS transitions (no scroll listeners) to stay smooth.
 * Content rendered later (articles list, markdown body) is picked up by a MutationObserver on
 * <main>; code that replaces a unit's text can call `window.pageReveal.refresh(el)`.
 * Disabled for prefers-reduced-motion and when IntersectionObserver is missing.
 */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // `?noreveal` switches the effect off, handy for A/B comparing scroll performance.
  if (reduce || !('IntersectionObserver' in window) || /[?&]noreveal\b/.test(location.search)) return;

  const TEXT_UNITS = [
    // Home page
    '.hero-greeting .note', '.hero-title', '.hero-subtitle', '.hero-desc',
    '.sec-title', '.sec h3', '.sec p', '.sec li', '.sec .tag', '.sec .note',
    '.sec .fill', '.sec .when',
    // Articles list, article detail & page intros
    'header h1', 'header p', 'header .note',
    'main h1', 'main h2', 'main h3', 'main h4', 'main p', 'main li', 'main blockquote',
    'main .article-meta', 'main .article-tags', '.empty-notes',
  ].join(',');
  const BOXES = '.rbox.card, .notebook-card, .contact-card, .article-card, .empty-notes';
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'SVG', 'INPUT', 'BUTTON', 'TEXTAREA', 'PRE']);

  const isMobile = () => window.matchMedia('(max-width: 768px), ((hover: none) and (pointer: coarse))').matches;

  // On mobile devices, pages are vertically longer and users scroll much faster with flick gestures.
  // Word intervals, queue waits, and paragraph duration caps are tuned faster for mobile,
  // while desktop timing remains completely untouched.
  const getTiming = () => {
    const m = isMobile();
    return {
      wordDelay: m ? 10 : 22,        // ms between words (flowing wave on desktop vs brisk pace on mobile)
      maxUnitTime: m ? 650 : 1700,   // ms: cap on very long paragraphs so they never drag
      boxTime: m ? 160 : 300,        // ms for box fade-in
      maxWait: m ? 180 : 700,        // ms: longest a block waits for the pen before starting
      leadTime: m ? 120 : 250,       // ms: base buffer for text finish
      queueHandoff: m ? 0.35 : 0.6,  // fraction of duration before next block can start
      finishDelay: m ? 400 : 900,    // ms before unwrapping spans
      wholeTime: m ? 280 : 600,      // ms for filtered title reveal
    };
  };

  const wrapWords = (unit) => {
    const nodes = [];
    const walker = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        for (let p = n.parentNode; p && p !== unit.parentNode; p = p.parentNode) {
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

    const timing = getTiming();
    const step = Math.min(timing.wordDelay, timing.maxUnitTime / Math.max(count, 1));
    unit.style.setProperty('--step', step + 'ms');
    unit.dataset.rvTime = String(Math.round(count * step));
  };

  const unwrapWords = (unit) => {
    unit.querySelectorAll('.rv-w').forEach((w) => w.replaceWith(document.createTextNode(w.textContent)));
    unit.normalize();
    unit.classList.remove('rv', 'rv-on', 'rv-whole', 'rv-fin');
  };

  const finish = (unit) => {
    if (!unit.isConnected || !unit.classList.contains('rv-on') || unit.classList.contains('rv-fin')) return;
    if (unit.classList.contains('rv-whole')) { unit.classList.add('rv-fin'); return; }
    unit.querySelectorAll('.rv-w').forEach((w) => w.replaceWith(document.createTextNode(w.textContent)));
    unit.normalize();
    unit.classList.add('rv-fin');
  };

  // Everything that becomes visible is written in reading order (top to bottom, left to right),
  // one block after another, instead of all at once. `queueEnd` is the time the pen is free again.
  let queueEnd = 0;

  const io = new IntersectionObserver((entries) => {
    const now = performance.now();
    const timing = getTiming();
    entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) ||
                      (a.boundingClientRect.left - b.boundingClientRect.left))
      .forEach((e) => {
        const el = e.target;
        io.unobserve(el);
        const isBox = el.classList.contains('rv-box');
        const duration = isBox ? timing.boxTime : (parseInt(el.dataset.rvTime, 10) || 0) + timing.leadTime;
        const start = Math.min(Math.max(now, queueEnd), now + timing.maxWait);
        el.style.setProperty('--base', Math.round(start - now) + 'ms');
        // Boxes only delay what follows slightly; text hands the pen over a bit early.
        queueEnd = start + (isBox ? duration * 0.4 : duration * timing.queueHandoff);
        el.classList.add('rv-on');
        // Once the block is fully written, drop the per-word spans again so long articles do not
        // keep hundreds of clipped inline-blocks (extra paint work) while scrolling.
        if (!isBox) {
          setTimeout(() => finish(el), Math.round(start - now) + (parseInt(el.dataset.rvTime, 10) || 0) + timing.finishDelay);
        }
      });
  }, { rootMargin: isMobile() ? '0px 0px 40px 0px' : '0px 0px -60px 0px', threshold: 0.01 });

  const isWrapped = (unit) => unit.classList.contains('rv') &&
    (unit.classList.contains('rv-whole') || unit.classList.contains('rv-fin') || unit.querySelector('.rv-w'));

  /** Prepares every not-yet-prepared unit, box and doodle under `root` for reveal. */
  const scan = (root = document) => {
    const all = Array.from(root.querySelectorAll(TEXT_UNITS));
    // Keep only outermost units so a unit never contains another one.
    const units = all.filter((el) => !all.some((o) => o !== el && o.contains(el)) &&
                                     !el.closest('nav, .heart-widget, .doodle-toolbar, .footer-bar'));
    units.forEach((u) => {
      if (isWrapped(u)) return;
      if (u.classList.contains('rv')) unwrapWords(u); // text was replaced after wrapping
      if (!u.textContent.trim()) return;
      if (getComputedStyle(u).filter !== 'none') {
        // Filtered blocks (titles) are revealed as a single piece, see .rv-whole in the CSS.
        u.classList.add('rv', 'rv-whole');
        u.dataset.rvTime = String(getTiming().wholeTime);
      } else {
        wrapWords(u);
        u.classList.add('rv');
      }
      io.observe(u);
    });
    root.querySelectorAll(BOXES).forEach((b) => {
      if (b.classList.contains('rv-box')) return;
      b.classList.add('rv-box');
      io.observe(b);
    });
    root.querySelectorAll('.sec .dd.abs').forEach((d) => {
      if (d.classList.contains('rv-doodle')) return;
      d.classList.add('rv-doodle');
      io.observe(d);
    });
  };

  document.documentElement.classList.add('rv-ready');
  scan();

  // Pick up content rendered later (article cards, markdown body, filter re-renders).
  const main = document.querySelector('main');
  if (main) {
    let queued = false;
    new MutationObserver((mutations) => {
      const relevant = mutations.some((m) => Array.from(m.addedNodes).some(
        (n) => n.nodeType === 1 && !n.classList.contains('rv-w')));
      if (!relevant || queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; scan(main); });
    }).observe(main, { childList: true, subtree: true });
  }

  window.pageReveal = {
    scan,
    /** Re-write a unit whose text was replaced by other scripts. */
    refresh(el) {
      if (!el) return;
      unwrapWords(el);
      scan(el.parentNode || document);
    },
  };
})();
