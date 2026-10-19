// Writes content/issues.json (a static snapshot of the open GitHub Issues used as articles),
// the static article pages in notes/ and sitemap.xml.
// Run by .github/workflows/sync-articles.yml (uses the workflow's GITHUB_TOKEN, so no rate limit).
// Local re-build without the network: SYNC_OFFLINE=1 node .github/scripts/sync-articles.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { buildNotes, slugFor } from './build-notes.mjs';

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const offline = process.env.SYNC_OFFLINE === '1';
if (!repo && !offline) throw new Error('GITHUB_REPOSITORY is not set');

let issues;
if (offline) {
  issues = JSON.parse(await readFile('content/issues.json', 'utf8'));
} else {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/issues?state=open&sort=created&direction=desc&per_page=100`,
    { headers: { Accept: 'application/vnd.github+json', ...(token && { Authorization: `Bearer ${token}` }) } }
  );
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
  issues = (await res.json())
    .filter((i) => !i.pull_request)
    .map((i) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      created_at: i.created_at,
      updated_at: i.updated_at,
      html_url: i.html_url,
      user: { login: i.user?.login },
      labels: i.labels.map((l) => ({ name: l.name })),
      body: i.body || '',
    }));
}
// Stable per-article URL slug (used by the static page notes/<slug>.html and by the article list links)
for (const i of issues) i.slug = slugFor(i.number, i.title);

await writeFile('content/issues.json', JSON.stringify(issues, null, 2) + '\n');
console.log(`Wrote ${issues.length} articles`);

await buildNotes(issues);
console.log(`Wrote ${issues.length} static pages in notes/`);

// sitemap.xml: home, articles list and every article (kept in sync with the issues)
const BASE = 'https://matthewnguyen.dev';
const today = new Date().toISOString().slice(0, 10);
const entry = (loc, lastmod, changefreq, priority) =>
  `  <url>\n    <loc>${loc.replace(/&/g, '&amp;')}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entry(`${BASE}/`, today, 'weekly', '1.0') +
  entry(`${BASE}/articles.html`, issues[0]?.created_at.slice(0, 10) || today, 'weekly', '0.8') +
  issues.map((i) => entry(`${BASE}/notes/${i.slug}.html`, (i.updated_at || i.created_at).slice(0, 10), 'monthly', '0.7')).join('') +
  '</urlset>\n';
await writeFile('sitemap.xml', sitemap);
console.log('Wrote sitemap.xml');
