/**
 * Portfolio - Page-turn transition between the notebook (index), articles list and an article.
 * Pure progressive enhancement on top of cross-document View Transitions (`@view-transition` in
 * css/style.css): this file only tells the browser which way the page is turning
 * (forward = deeper into the notebook, back = towards the cover). Browsers without support
 * (e.g. Firefox) simply navigate normally.
 */
(function () {
  const rank = (pathname) => (/\/article(\.html)?$/.test(pathname) ? 2 : /\/articles(\.html)?$/.test(pathname) ? 1 : 0);

  const typeFor = (fromUrl, toUrl) => {
    const from = new URL(fromUrl);
    const to = new URL(toUrl);
    if (to.hash) return null;                       // anchor jumps (e.g. #contact) must not be animated
    if (from.pathname === to.pathname) return null; // same page
    return rank(to.pathname) > rank(from.pathname) ? 'page-forward' : 'page-back';
  };

  const apply = (vt, fromUrl, toUrl) => {
    if (!vt) return;
    const type = typeFor(fromUrl, toUrl);
    if (!type) { vt.skipTransition(); return; }
    if (vt.types && vt.types.add) vt.types.add(type);
  };

  // Outgoing page
  window.addEventListener('pageswap', (e) => {
    const act = e.activation;
    if (!e.viewTransition || !act || !act.from || !act.entry) return;
    apply(e.viewTransition, act.from.url, act.entry.url);
  });

  // Incoming page
  window.addEventListener('pagereveal', (e) => {
    const act = window.navigation && window.navigation.activation;
    if (!e.viewTransition || !act || !act.from || !act.entry) return;
    apply(e.viewTransition, act.from.url, act.entry.url);
  });
})();
