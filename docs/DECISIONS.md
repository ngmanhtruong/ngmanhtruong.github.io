# Architectural Decisions

## 2026-10-15 — Standalone Semantic Static Web Architecture

Reason: The reference mockup in `Portfolio-html/` relies on a runtime component (`support.js`, `vendor/react.js`, `vendor/react-dom.js`) intended only as an artboard preview tool. For production, converting this into clean semantic HTML5, modular CSS, and vanilla ES6 JavaScript ensures instantaneous loading, zero bundling overhead, perfect SEO, and standard web accessibility while faithfully preserving all visual values and doodle aesthetics.
Accepted trade-off: Dynamic framework features (like SSR or component hydration) are omitted in favor of static reliability and minimal maintenance.
Related domain: Root, `css/`, `js/`

## 2026-10-15 — Preservation of SVG Filters and CSS Doodle Engine

Reason: The handwritten notebook aesthetic depends heavily on SVG displacement map filters (`#wob`, `#wob2`, `#ink`, `#paper`) and custom CSS pseudo-elements for rotated borders, ragged tape, and circled text. Implementing these natively via CSS and inline SVG definitions maintains the visual identity without introducing raster image dependencies or performance lags.
Accepted trade-off: SVG filters require modern browser support (Chrome, Safari, Firefox, Edge all fully support SVG filters on HTML elements).
Related domain: `css/`, Root

## 2026-10-15 — Sticky Yellow Note Navigation with 3D Red Pushpin

Reason: Updated to match designer's revised layout in `Portfolio-html/Main.dc.html`. Pinned navigation bar is styled as a yellow sticky note (`.stick`) with a 3D red pushpin (`.stick::before`) at `top: 14px` using CSS `position: sticky;`. An active section tracking spy dynamically applies the red wavy underline (`.on::after`) when scrolling into sections (`#about`, `#skills`, `#work`, `#projects`, `#school`, `#contact`).
Accepted trade-off: `scroll-margin-top: 96px` added to `.sec` so internal links do not get concealed behind the pinned sticky note.
Related domain: `css/`, `js/`, Root

## 2026-10-15 — Custom Pencil Cursor, Full-Page Canvas Doodling, and Synthetic Audio

Reason: Visitors can use an authentic wooden pencil cursor to doodle freehand anywhere across the notebook page. Synthetic friction noise is generated in real-time via the Web Audio API (white noise through dual bandpass/highpass filters modulated by cursor speed) rather than loading external audio files, ensuring instant playback, zero network overhead, and natural velocity modulation.
Accepted trade-off: Audio requires a user gesture (first click) before unmuting in compliance with browser autoplay security policies.
Related domain: `js/`, `css/`, Root

## 2026-10-15 — Headless Markdown Articles Architecture

Reason: Articles are stored as plain Markdown files (`content/articles/*.md`) with an index catalog (`content/articles.json`). This provides 100% portability, enables free hosting on GitHub Pages/Vercel/Netlify, allows syncing from external headless CMS or GitHub Raw without vendor lock-in, and renders cleanly using a zero-dependency client-side parser.
Accepted trade-off: Client-side parsing occurs on initial load for detail pages, mitigated by prerendered static cards on the index listing.
Related domain: `content/`, `js/`, Root

## 2026-10-15 — GitHub Issues Headless CMS Integration (Zero-Code Publishing)

Reason: Selected Option 1.1 to empower the author to create and edit articles on GitHub Issues directly via web or mobile app without modifying portfolio code or redeploying. Module `js/articles.js` fetches issues from GitHub REST API, caches them in `localStorage` for 5 minutes to respect rate limits, and falls back seamlessly to local files if the repository is offline or unconfigured.
Accepted trade-off: GitHub unauthenticated public API limit is 60 requests/hour per client IP, safely addressed by the 5-minute localStorage cache.
Related domain: `js/`, `content/`, Root

## 2026-10-15 — Elimination of Scroll Lag and White Flash (Vector Doodle & Hardware Tiling)

Reason: Fast scrolling on Retina displays caused severe frame drops and white screen flashes due to three compounding bottlenecks: (1) A fixed full-screen SVG overlay with live `feTurbulence` (3 octaves) combined with `mix-blend-mode: multiply` invalidated the entire viewport compositor on every scroll tick; (2) A full-document 2D canvas scaled by DPR created a ~180MB uncompressed bitmap exceeding browser texture limits; (3) Unthrottled scroll listeners repeatedly executed `getBoundingClientRect()` calls. Replacing the giant canvas with a lightweight vector SVG overlay (`<svg id="doodle-layer">`) using midpoint Bézier interpolation reduced VRAM to 0MB, while caching the paper grain as a 160x160 hardware `<pattern id="paper-tile">` inside `.pg` and RAF-throttling scroll handlers restored a consistent 60-120 FPS without whiteout.
Accepted trade-off: Doodles are stored as SVG vector paths rather than bitmap pixels, which offers superior resolution, infinite zoom clarity, and negligible memory consumption.
Related domain: `js/`, `css/`, Root

## 2026-10-15 — Two-Tier Article Filtering (Categories & Dynamic Topic Tags)

Reason: Visitors require an intuitive way to explore articles by format (`Random Thoughts`, `Technicals`, `Opinions`) as well as by granular topics (`#AI`, `#Architecture`, `#Performance`, `#CSS`, etc.). Articles are classified into three primary categories via GitHub Issue labels, while all remaining labels form an interactive topic tag cloud. Hand-drawn notebook tabs with dynamic badge counters and clickable tag pills allow multi-dimensional filtering, synced directly with browser URL parameters (`?type=...&tag=...`) for shareability.
Accepted trade-off: Dynamic client-side filtering runs in real-time on the cached articles catalog, which is fast and responsive with zero server-side querying required.
Related domain: `js/`, `css/`, Root




## 2026-10-15 — Visit Counter & Heart Button (Cloudflare Worker + KV)

Reason: The footer heart is now a clickable button with a site-wide hearts count and visit count. A visit is counted automatically once per browser session (no heart needed; refreshes/page changes in the same session do not inflate it); the heart is a per-browser toggle stored in localStorage. Backend is a Cloudflare Worker with KV (`worker/`) because it is free and never pauses or deletes data from inactivity, unlike Supabase/Render free tiers. The frontend (`js/stats.js`) hides counts and still works locally when `COUNTER_API` is empty or unreachable.
Accepted trade-off: KV increments are not atomic (rare lost updates under concurrent traffic) and counts are not bot-proof; fine for a low-traffic portfolio.
Related domain: `worker/`, `js/`, `css/`, Root

## 2026-10-15 — Articles Served From a Static Snapshot Kept in Sync by GitHub Actions

Reason: Fetching issues straight from the public GitHub API in each visitor's browser is limited to 60 requests/hour per IP, and many visitors (including the author) share IPs (e.g. Cloudflare ranges). Those browsers got HTTP 403 and fell back to the 4 built-in local articles even though 6 issues existed. `.github/workflows/sync-articles.yml` now rewrites `content/issues.json` on every issue event (using the workflow's own token), commits it, and Vercel redeploys; `js/articles.js` reads that file first. The live API is only a fallback.
Accepted trade-off: A new or edited issue appears after the Action commit and Vercel deploy (typically under a minute or two) instead of instantly. Run the workflow manually (Actions tab, "Run workflow") to resync.
Related domain: `js/`, `content/`, `.github/`

## 2026-10-17 — Page-Turn Transitions via Cross-Document View Transitions

Reason: Moving between notebook, articles list and an article should feel like turning a page. Cross-document View Transitions (`@view-transition { navigation: auto; }`) animate screenshots of the old/new pages, so the heavy SVG filters are not touched and there is no new dependency or build step. `js/page-flip.js` adds the `page-forward` / `page-back` transition type; CSS rotates the old page around the left binder (forward) or turns the previous one back in (back). The nav note keeps its own `view-transition-name` so it does not flip.
Accepted trade-off: Only Chromium and Safari 18.2+ animate; other browsers (Firefox) navigate normally. Anchor links (`#contact`), same-page navigation and `prefers-reduced-motion` are not animated.
Related domain: `css/`, `js/`, root HTML pages
