# Content Domain

## Purpose
Houses written articles, technical thoughts, and catalog metadata for the portfolio's Articles section and Article Detail views.

## Why it is designed this way
Articles are stored as clean, portable Markdown files (`.md`) with YAML frontmatter headers (title, date, reading time, tags, summary). This allows them to be served statically from this repository or effortlessly synced with external headless CMS services (e.g., GitHub Raw, Dev.to API, Contentful, or static hosting) with zero vendor lock-in.

## Links to other domains
- Read by [`js/articles.js`](file:///Users/apple/Documents/projects/portfolio/js/articles.js) to populate [`articles.html`](file:///Users/apple/Documents/projects/portfolio/articles.html) and [`article.html`](file:///Users/apple/Documents/projects/portfolio/article.html).
- Catalog indexed via [`content/articles.json`](file:///Users/apple/Documents/projects/portfolio/content/articles.json).

## Read before changing
- The `slug` in `articles.json` must exactly match the filename in `articles/` without `.md`.
- Frontmatter keys (`title`, `slug`, `date`, `readTime`, `tags`, `summary`, `author`) must be preserved for compatibility with the client-side parser.
- When using GitHub Issues CMS (Option 1.1), `GITHUB_CMS_CONFIG` in `js/articles.js` specifies `owner` and `repo`. Articles created as open GitHub Issues automatically populate the site. Local files serve as instant fallback if the GitHub repo is not reachable.
