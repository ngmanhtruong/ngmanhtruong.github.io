/**
 * Portfolio - Article reactions.
 * Four reaction buttons under each article. Counts live in the counter Worker (worker/);
 * which reactions this reader picked is remembered in localStorage and can be toggled off.
 * Works offline/without the API: buttons still toggle locally, counts are just hidden.
 */
window.articleReactions = {
  init(postId) {
    const root = document.getElementById('article-reactions');
    if (!root || !postId) return;
    const post = String(postId);
    const api = typeof COUNTER_API !== 'undefined' ? COUNTER_API : '';
    const key = `portfolio-rx:${post}`;

    let mine = [];
    try { mine = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
    const save = () => { try { localStorage.setItem(key, JSON.stringify(mine)); } catch (_) {} };

    const buttons = Array.from(root.querySelectorAll('.rx-btn'));
    const render = (counts) => {
      buttons.forEach((b) => {
        const type = b.dataset.type;
        const on = mine.includes(type);
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
        if (counts && typeof counts[type] === 'number') {
          b.querySelector('.rx-count').textContent = counts[type] > 0 ? counts[type].toLocaleString() : '';
        }
      });
    };

    const call = async (path, body) => {
      if (!api) return null;
      if (body !== undefined && typeof COUNTER_READ_ONLY !== 'undefined' && COUNTER_READ_ONLY) return null;
      try {
        const res = await fetch(api + path, body === undefined ? undefined : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return res.ok ? await res.json() : null;
      } catch (_) { return null; }
    };

    root.hidden = false;
    render(null);
    call(`/reactions?post=${encodeURIComponent(post)}`).then((c) => c && render(c));

    buttons.forEach((b) => b.addEventListener('click', async () => {
      const type = b.dataset.type;
      const on = !mine.includes(type);
      mine = on ? mine.concat(type) : mine.filter((t) => t !== type);
      save();
      // Optimistic count update so the button reacts instantly.
      const countEl = b.querySelector('.rx-count');
      const shown = parseInt((countEl.textContent || '0').replace(/\D/g, ''), 10) || 0;
      if (api) countEl.textContent = Math.max(0, shown + (on ? 1 : -1)) || '';
      render(null);
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
      const counts = await call('/reaction', { post, type, on });
      if (counts) render(counts);
    }));
  },
};
