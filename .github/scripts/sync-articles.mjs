// Writes content/issues.json: a static snapshot of the open GitHub Issues used as articles.
// Run by .github/workflows/sync-articles.yml (uses the workflow's GITHUB_TOKEN, so no rate limit).
import { writeFile } from 'node:fs/promises';

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!repo) throw new Error('GITHUB_REPOSITORY is not set');

const res = await fetch(
  `https://api.github.com/repos/${repo}/issues?state=open&sort=created&direction=desc&per_page=100`,
  { headers: { Accept: 'application/vnd.github+json', ...(token && { Authorization: `Bearer ${token}` }) } }
);
if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);

const issues = (await res.json())
  .filter((i) => !i.pull_request)
  .map((i) => ({
    number: i.number,
    title: i.title,
    state: i.state,
    created_at: i.created_at,
    html_url: i.html_url,
    user: { login: i.user?.login },
    labels: i.labels.map((l) => ({ name: l.name })),
    body: i.body || '',
  }));

await writeFile('content/issues.json', JSON.stringify(issues, null, 2) + '\n');
console.log(`Wrote ${issues.length} articles`);

// sitemap.xml: home, articles list and every article (kept in sync with the issues)
const BASE = 'https://matthewnguyen.vercel.app';
const today = new Date().toISOString().slice(0, 10);
const entry = (loc, lastmod, changefreq, priority) =>
  `  <url>\n    <loc>${loc.replace(/&/g, '&amp;')}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entry(`${BASE}/`, today, 'weekly', '1.0') +
  entry(`${BASE}/articles.html`, issues[0]?.created_at.slice(0, 10) || today, 'weekly', '0.8') +
  issues.map((i) => entry(`${BASE}/article.html?slug=${i.number}`, i.created_at.slice(0, 10), 'monthly', '0.6')).join('') +
  '</urlset>\n';
await writeFile('sitemap.xml', sitemap);
console.log('Wrote sitemap.xml');
