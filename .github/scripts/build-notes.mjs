// Pre-renders every article (GitHub Issue) to a plain static page: notes/<number>-<slug>.html
//
// Why: the article body would otherwise exist only after JavaScript fetches and renders it,
// which search engines handle slowly. The static pages carry the full text, <title>, description,
// canonical and BlogPosting JSON-LD, and load LESS JavaScript than the dynamic article.html
// (no articles.js / markdown renderer).
//
// The page shell is taken from article.html (so design changes made there carry over) and the
// markdown renderer is the very same code the browser uses (js/articles.js, run in a vm sandbox).
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import vm from 'node:vm';

const BASE = 'https://matthewnguyen.vercel.app';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** "6" + "Investigating Scroll Jank: SVG feTurbulence…" -> "6-investigating-scroll-jank-svg-feturbulence" */
export function slugFor(number, title) {
  const base = String(title)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const words = base.split('-');
  let out = '';
  for (const w of words) { if ((out + '-' + w).length > 60 && out) break; out = out ? out + '-' + w : w; }
  return `${number}-${out || 'note'}`;
}

async function loadManager() {
  const code = await readFile('js/articles.js', 'utf8');
  const noop = () => {};
  const ctx = vm.createContext({
    window: {}, console, URLSearchParams, location: { search: '' },
    document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    fetch: async () => ({ ok: false }),
  });
  vm.runInContext(code + '\n;globalThis.__AM = ArticlesManager;', ctx);
  return new ctx.__AM();
}

export async function buildNotes(issues) {
  const mgr = await loadManager();
  const template = await readFile('article.html', 'utf8');
  const articles = mgr.issuesToArticles(issues);
  await mkdir('notes', { recursive: true });
  const keep = new Set();

  for (const a of articles) {
    const issue = issues.find((i) => i.number === a.id);
    const slug = issue.slug || slugFor(a.id, a.title);
    const file = `${slug}.html`;
    keep.add(file);
    const url = `${BASE}/notes/${file}`;
    const desc = esc((a.summary || '').slice(0, 300));
    const title = esc(`${a.title} — Matthew Nguyen`);
    const published = new Date(issue.created_at).toISOString();
    const modified = new Date(issue.updated_at || issue.created_at).toISOString();

    const ld = {
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: a.title, description: a.summary || '', url, mainEntityOfPage: url,
      image: `${BASE}/assets/og-image.jpg`,
      author: { '@type': 'Person', name: 'Matthew Nguyen', url: `${BASE}/` },
      publisher: { '@type': 'Person', name: 'Matthew Nguyen', url: `${BASE}/` },
      keywords: [...a.tags, a.typeLabel].join(', '), inLanguage: 'en',
      datePublished: published, dateModified: modified,
    };
    const head = `<title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="author" content="Matthew Nguyen">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <meta name="theme-color" content="#faf6ea">
  <link rel="canonical" href="${url}">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Matthew Nguyen — Portfolio">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${BASE}/assets/og-image.jpg">
  <meta property="article:published_time" content="${published}">
  <meta property="article:modified_time" content="${modified}">
  <meta property="article:author" content="Matthew Nguyen">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${BASE}/assets/og-image.jpg">

  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>

  `;

    let html = template;
    const t0 = html.indexOf('<title>'), t1 = html.indexOf('<!-- Favicon');
    if (t0 < 0 || t1 < 0) throw new Error('article.html: <title> / Favicon marker not found');
    html = html.slice(0, t0) + head + html.slice(t1);

    // The static page does not need the markdown renderer / article loader.
    html = html.replace('  <script src="./js/articles.js" defer></script>\n', '');

    // Root-absolute URLs (the page lives in /notes/)
    html = html
      .replace(/(src|href)="\.\/(js|css)\//g, '$1="/$2/')
      .replace(/href="assets\//g, 'href="/assets/')
      .replace(/href="(index|articles)\.html/g, 'href="/$1.html');

    const must = (needle) => { if (!html.includes(needle)) throw new Error(`article.html is missing: ${needle}`); };
    must('<span id="article-date">Loading date...</span>');
    must('<span id="article-readtime">Reading time</span>');
    must('<span id="article-author" class="blue">Matthew Nguyen</span>');
    must('<p class="note loading-note">Loading note from markdown...</p>');
    must('<div id="article-tags-container" class="article-tags mt-36"></div>');
    must('<section id="article-reactions" class="reactions" aria-label="Reactions" hidden>');

    const markdown = a.body || '';
    const hasTitle = /^\s*(---[\s\S]*?---\s*)?#\s/.test(markdown);
    const bodyHtml = mgr.renderMarkdownToHtml(hasTitle ? markdown : `# ${esc(a.title)}\n\n${markdown}`);

    const badge = `\n            <a id="article-detail-type-badge" class="article-type-badge ${esc(a.typeClass)}" href="/articles.html?type=${encodeURIComponent(a.type)}" title="View all ${esc(a.typeLabel)} notes">${a.typeIcon} ${esc(a.typeLabel)}</a>`;
    html = html
      .replace('<span id="article-date">Loading date...</span>', `<span id="article-date">${esc(a.date)}</span>`)
      .replace('<span id="article-readtime">Reading time</span>', `<span id="article-readtime">${esc(a.readTime)}</span>`)
      .replace('<span id="article-author" class="blue">Matthew Nguyen</span>', `<span id="article-author" class="blue">By ${esc(a.author)}</span>${badge}`)
      .replace('<p class="note loading-note">Loading note from markdown...</p>', () => bodyHtml)
      .replace('<div id="article-tags-container" class="article-tags mt-36"></div>',
        `<div id="article-tags-container" class="article-tags mt-36">${a.tags.map((t) => `<a href="/articles.html?tag=${encodeURIComponent(t)}" class="article-tag" title="Browse notes tagged #${esc(t)}">#${esc(t)}</a>`).join('')}</div>`);

    // Replace the dynamic loader with a tiny script that only wires up the reactions.
    const s0 = html.indexOf('\n  <script>\n    document.addEventListener(\'DOMContentLoaded\'');
    const s1 = html.lastIndexOf('</script>');
    if (s0 < 0 || s1 < 0) throw new Error('article.html: inline loader script not found');
    html = html.slice(0, s0) + `\n  <script>\n    document.addEventListener('DOMContentLoaded', function () {\n      if (window.articleReactions) window.articleReactions.init(${JSON.stringify(String(a.id))});\n    });\n  ` + html.slice(s1);

    await writeFile(`notes/${file}`, html);
  }

  // Drop pages of articles that no longer exist (closed/deleted issues)
  for (const f of await readdir('notes')) {
    if (f.endsWith('.html') && !keep.has(f)) await rm(`notes/${f}`);
  }
  return articles.map((a) => ({ number: a.id, slug: (issues.find((i) => i.number === a.id).slug) || slugFor(a.id, a.title) }));
}
