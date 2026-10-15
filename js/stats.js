/**
 * Portfolio - Footer visit counter & heart button.
 * Counts one visit per browser session; the heart is a persistent per-browser toggle.
 * Degrades gracefully (button still toggles locally) when the API is not configured/reachable.
 */
const COUNTER_API = ''; // e.g. 'https://portfolio-counter.<account>.workers.dev'

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.heart-widget');
  if (!root) return;

  const btn = root.querySelector('.heart-btn');
  const visitsEl = root.querySelector('.visits-count');
  const heartsEl = root.querySelector('.hearts-count');
  const store = {
    get: (s, k) => { try { return s.getItem(k); } catch (_) { return null; } },
    set: (s, k, v) => { try { s.setItem(k, v); } catch (_) {} },
  };
  let liked = store.get(localStorage, 'portfolio-hearted') === '1';

  const render = (stats) => {
    btn.classList.toggle('liked', liked);
    btn.setAttribute('aria-pressed', String(liked));
    if (stats) {
      visitsEl.textContent = stats.visits.toLocaleString();
      heartsEl.textContent = stats.hearts.toLocaleString();
      root.querySelector('.hearts-unit').textContent = stats.hearts === 1 ? 'heart' : 'hearts';
      root.querySelector('.hearts-line').hidden = false;
      root.querySelector('.visit-label').hidden = false;
    }
  };

  const call = async (path, body) => {
    if (!COUNTER_API) return null;
    try {
      const res = await fetch(COUNTER_API + path, body === undefined ? undefined : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.ok ? await res.json() : null;
    } catch (_) { return null; }
  };

  render(null);
  if (!COUNTER_API) return;

  const counted = store.get(sessionStorage, 'portfolio-visited') === '1';
  (counted ? call('/stats') : call('/visit', {})).then((stats) => {
    if (!counted && stats) store.set(sessionStorage, 'portfolio-visited', '1');
    render(stats);
  });

  btn.addEventListener('click', async () => {
    liked = !liked;
    store.set(localStorage, 'portfolio-hearted', liked ? '1' : '0');
    render(null);
    btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    const stats = await call('/heart', { on: liked });
    if (stats) render(stats);
  });
});
