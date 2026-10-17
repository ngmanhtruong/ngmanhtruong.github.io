# Session Log

## 2026-10-15 — Initial Setup & Production Website Implementation

Done:
- Analyzed `Portfolio-html/` design reference mockup, typography, color palette, responsive rules, and SVG filters.
- Established project conventions (`CLAUDE.md`, `docs/CODEMAP.md`, `docs/DECISIONS.md`).
- Implemented production website with `index.html`, `css/style.css`, and `js/main.js`.
Decisions: See entries in `docs/DECISIONS.md`.
## 2026-10-15 — Sticky Navigation Redesign Implementation

Done:
- Analyzed newly revised `Portfolio-html/Main.dc.html` with pinned yellow note navigation and 3D red pushpin.
- Updated `index.html` structure with `.stickwrap` and `.stick` navigation elements.
- Implemented CSS styles in `css/style.css` for `.stickwrap`, `.stick` (yellow sticky paper with gradient & drop shadow), `.stick::before` (spherical red pushpin), and `.nav a.on::after` (wavy red underline).
- Added `scroll-margin-top: 96px` to `.sec` so sections align perfectly below the pinned note when navigated.
- Updated scroll-spy tracking in `js/main.js` using real-time viewport bounding rect coordinates to apply `.on` and `.active` classes on scroll.
Decisions: See `docs/DECISIONS.md`.
Unfinished / needs the user: None.

## 2026-10-15 — AI Section, Headless Articles System, and Pencil Doodle Engine

Done:
- Integrated new AI engineering card ("A Sr. engineer in the age of AI agents") with 4 feature pillars and SVG doodle symbols (`#d-agent`, `#d-diamond`).
- Updated navigation bar (`width: 730px`) and hero actions with "Articles" and "My thoughts" buttons.
- Created `articles.html` and `article.html` for technical essays, reading from Markdown files (`content/articles/*.md`) and catalog metadata (`content/articles.json`).
- Implemented `js/articles.js` with client-side Markdown rendering and dynamic catalog loading.
- Implemented `js/pencil-draw.js`: custom SVG wooden pencil cursor with tip hotspot alignment, full-page drawing canvas, floating doodle tool widget (graphite, blue pen, red pen, highlighter, clear eraser), and real-time synthetic pencil scratch sound using the Web Audio API.
- Integrated GitHub Issues Headless CMS (Option 1.1) in `js/articles.js` with 5-minute localStorage cache and fallback support, enabling authoring via GitHub Issues without editing codebase.
- Removed public "Edit / Comment on GitHub" link from `article.html` as requested by user.
- Removed mute button from the floating doodle toolbar in `js/pencil-draw.js` as requested by user.
- Configured floating doodle toolbar to be minimized by default (`+` expand toggle).
Decisions: See `docs/DECISIONS.md`.
Unfinished / needs the user: None. Ready for user feedback.

## 2026-10-15 — Fix High-Speed Scroll Lag and White Screen

Done:
- Diagnosed root causes of scrolling lag and white flashes:
  1. `position: fixed` `.paper-overlay` with `mix-blend-mode: multiply` and live `feTurbulence` (3 octaves) invalidated compositor on every frame and choked CPU raster threads.
  2. `#doodle-canvas` sized to full document (8400px * DPR = ~180MB uncompressed bitmap) exceeded hardware texture budgets, triggering WebKit context drops and Chromium tile checkerboarding.
  3. Unthrottled scroll listeners in `js/main.js` called `getBoundingClientRect()` repeatedly on scroll ticks.
- Fixed paper texture overlay: Converted `#paper` filter to a 160x160 tile with `stitchTiles="stitch"`, wrapped in SVG `<pattern id="paper-tile">`, and placed inside `.pg` as `position: absolute;` so it GPU-tiles once and scrolls as a unified layer.
- Replaced giant 2D canvas in `js/pencil-draw.js` with vector SVG drawing overlay (`<svg id="doodle-layer">`) using midpoint quadratic Bézier curve interpolation (`Q`), reducing VRAM from ~180MB to 0MB.
- Throttled `initScrollSpy` and `initBackToTop` using `requestAnimationFrame` (RAF tick) to eliminate layout thrashing.
- Added `will-change: transform;` to `.stickwrap` for independent GPU layer promotion.
Decisions: See `docs/DECISIONS.md`.
Unfinished / needs the user: None. Ready for user feedback.

## 2026-10-15 — Push to GitHub and Migrate Articles to Issues CMS

Done:
- Initialized local Git repository with `.gitignore` and default branch `main`.
- Connected remote `origin` to `https://github.com/ngmanhtruong/portfolio-v2.git`.
- Configured `GITHUB_CMS_CONFIG.repo = 'portfolio-v2'` in `js/articles.js`.
- Pushed complete portfolio codebase to `origin/main`.
- Created 12 custom category labels on `ngmanhtruong/portfolio-v2` (`AI`, `Engineering`, `Architecture`, `Productivity`, `Front-end`, `Performance`, `Web Standards`, `CSS`, `Metaverse`, `WebGL`, `Unity`, `GraphQL`).
- Converted and published all 3 portfolio articles as live GitHub Issues with formatted markdown, titles, and labels:
  - Issue #1: *Lessons from Building Metaverse and Real-time Web Experiences*
  - Issue #2: *Lean Front-End Architecture: Shipping Less JS, Getting More Speed*
  - Issue #3: *How I Work With AI Coding Agents as a Senior Engineer*
- Verified GitHub REST API endpoint successfully delivers the 3 articles for client-side rendering.
Decisions: See `docs/DECISIONS.md`.
Unfinished / needs the user: None. All tasks completed.

## 2026-10-15 — Two-Tier Article Filtering (Categories & Dynamic Topic Tags)

Done:
- Created 3 primary format labels on GitHub repository `ngmanhtruong/portfolio-v2`: `Technicals`, `Opinions`, `Random Thoughts`.
- Labeled existing GitHub issues accordingly and published Issue #4 (*Why Physical Notebooks & Doodles Still Beat Digital Note Apps in 2026*) under `Random Thoughts`.
- Extended `js/articles.js` with `normalizeArticle()`, separating primary format categories (`Technicals`, `Opinions`, `Random Thoughts`) from secondary topic tags (`#AI`, `#Architecture`, `#Performance`, etc.).
- Implemented `initArticlesPage()` controller in `js/articles.js` managing:
  - 4 Category Tab buttons with dynamic live article counters.
  - Interactive Topic Tag Cloud with tag counters and `Clear filter` button.
  - Bidirectional card filtering (clicking card category badges or card tags updates filters instantly).
  - Notebook-styled empty state for filter combinations with zero matches.
  - URL query parameter synchronization (`?type=...&tag=...`) for deep linking and sharing.
- Updated `articles.html` and `article.html` with category badges and interactive tag links.
- Styled filter bar, tabs, pills, counters, and badges in `css/style.css` matching notebook paper aesthetic.
Decisions: See `docs/DECISIONS.md`.
Unfinished / needs the user: None. Ready for user feedback.

## 2026-10-15 — Untrack and Ignore Design Mockups Folder (Portfolio-html)

Done:
- Added `Portfolio-html/` to `.gitignore`.
- Removed `Portfolio-html/` from Git index cache (`git rm -r --cached Portfolio-html`) while preserving all files locally on disk.
- Committed and pushed changes to `origin/main` on `ngmanhtruong/portfolio-v2`.
- Verified `Portfolio-html` is completely removed from remote repository contents.
Decisions: See `docs/DECISIONS.md`.
Unfinished / needs the user: None. All tasks completed.





## 2026-10-15 — Mobile UI Optimization (Doodle Off on Touch, Compact Nav)

Done:
- `js/pencil-draw.js`: doodle engine (drawing layer, toolbar, audio) is no longer created on touch-only devices (`(hover: none) and (pointer: coarse)`), so scrolling never leaves pencil strokes and the toolbar no longer covers content.
- `css/style.css` (≤768px): sticky nav now takes real space (no overlap with the logo) and is a single horizontally scrollable row; smaller back-to-top button on ≤640px.
- Verified at 375px: no horizontal overflow, nav and hero render cleanly.
Decisions: Doodle disabled by device capability (not screen width) so narrow desktop windows keep drawing.
Unfinished / needs the user: Lower sections and articles pages were not visually re-checked at mobile width; the changes are not committed or deployed yet.

## 2026-10-15 — Footer Heart Button & Visit Counter

Done:
- Added `worker/` (Cloudflare Worker + KV: `/stats`, `/visit`, `/heart`, origin-restricted writes) and `js/stats.js`.
- Footer heart on all 3 pages is now a labelled button ("N hearts · tap to leave one") with "N visits so far".
- Tested worker logic and UI against a local mock.
Decisions: See `docs/DECISIONS.md`.
Unfinished / needs the user: Deploy the Worker (see `worker/README.md`) and set `COUNTER_API` in `js/stats.js`; until then counts stay hidden.

## 2026-10-15 — Mobile Nav Trim & Pushpin Clipping Fix

Done:
- Removed `overflow-x: auto` from the mobile sticky nav (it clipped the top half of the red pushpin).
- On ≤640px, Skills/Projects/School links (`.nav-minor`) are hidden; About, Work, Contact, Articles remain, evenly spaced with no scrolling.
Unfinished / needs the user: Not pushed yet; Worker deploy pending (see previous entry).

## 2026-10-15 — Scroll "Handwriting" Reveal

Done:
- Added `js/reveal.js` and `.rv-*` styles in `css/style.css` (home page only): text blocks are split into words and wiped in left-to-right with a stagger when scrolled into view; cards sweep open; highlighter, `.u`/`.lk` underlines, circles, bullets and section-title underline draw after the words; floating doodles fade in.
- Respects `prefers-reduced-motion`, no-JS, and print.
Unfinished / needs the user: Not pushed. Articles pages are not animated (dynamic content); not tested on a real phone.

## 2026-10-15 — Reveal Order: Top to Bottom, Left to Right

Done:
- `js/reveal.js` now writes visible blocks one after another in reading order (queue with `queueEnd`) instead of all at once; words keep a constant ~32ms pace.
- Card boxes now open top to bottom (was a left-to-right sweep) before their text is written.
Unfinished / needs the user: Not pushed.

## 2026-10-15 — Reveal on Articles & Article Detail

Done:
- Generalized `js/reveal.js` (selectors, `scan()`, MutationObserver on `<main>`, `window.pageReveal.refresh`) and loaded it on `articles.html` and `article.html`.
- Article cards open as boxes and are written in reading order; the article detail card, meta line, tags and rendered markdown body are written the same way (code blocks `pre` are left instant).
- `article.html` calls `pageReveal.refresh()` after filling meta/tags so the real text is written, not the placeholders.
Unfinished / needs the user: Not pushed. Tested on desktop only; GitHub API 403s locally fall back to local markdown (expected).

## 2026-10-15 — Card Summaries as Plain Text & Rate-Limit Fallback

Done:
- `js/articles.js`: card summaries are now built from markdown via `markdownToPlainText()`/`makeSummary()` (no `**`, `#`, backticks, links, list markers; headings and code blocks skipped; cut at a word boundary). Summary is HTML-escaped when rendered.
- Root cause of "4 posts on desktop, 6 on phone": unauthenticated GitHub API limit (60 req/h per IP) returned 403, so the desktop fell back to the 4 built-in local articles. On API failure the last cached GitHub catalog (any age) is now used before the local files. Cache key bumped to `portfolio_articles_cache_v2`.
Unfinished / needs the user: Not pushed. A desktop whose cache was never filled and whose IP is rate-limited still falls back to local files; a token-free fix would be a build/serverless proxy.

## 2026-10-15 — Smoother Reveal (less repaint, flowing wave)

Done:
- Stutter causes found in the CSS: (1) cards animated with `clip-path` forced the wobbly filtered borders (`#wob`) to be re-rasterized every frame; (2) words inside filtered titles (`#ink`) re-ran `feTurbulence` per frame; (3) per-word 0.22s wipes at 32ms steps looked like discrete pops; (4) long waits for the pen queue.
- Cards now fade/slide in with `opacity` + `translate` only (compositor friendly); filtered blocks (titles) are written as one piece (`.rv-whole`) instead of word by word; words use a longer overlapping wipe (0.45s, 22ms step) with a small rise; queue waits shortened (max 700ms).
Unfinished / needs the user: Frame rate was not measured (the in-app browser throttles animation frames while hidden); please judge on a real browser/phone. Tune `WORD_DELAY` / `MAX_WAIT` in `js/reveal.js`.

## 2026-10-15 — Doodle Drawing Is Opt-In on Desktop

Done:
- `js/pencil-draw.js`: drawing is off by default (`this.enabled`); a "Draw: off/on" button in the toolbar header toggles it. The pencil cursor (`html.doodle-on`) and stroke capture apply only while on, so pages scroll, select text and click normally by default. State is not persisted (always starts off).
- `article.html` footer hint now tells visitors to switch on "Draw".
Unfinished / needs the user: Not pushed.

## 2026-10-15 — Fix "Only 4 Articles" on the Deployed Site

Done:
- Root cause: browser calls to the unauthenticated GitHub API were rate limited (403) on shared IPs, so the site showed the 4 built-in articles instead of the 6 issues.
- Added `.github/scripts/sync-articles.mjs` + `.github/workflows/sync-articles.yml` generating `content/issues.json`; generated the first snapshot (6 articles) with the local authenticated `gh`.
- `js/articles.js`: `fetchFromGitHub()` reads the snapshot first, then the live API; extracted `issuesToArticles()`.
Decisions: See `docs/DECISIONS.md`.
Unfinished / needs the user: Push; then check the Actions tab runs on a new issue (the push needs a token with `workflow` scope; GitHub may ask to enable Actions).

## 2026-10-15 — Article Detail: Title, Heading Layout, Inline Code

Done:
- `article.html`: issue bodies have no `# Title` line, so the detail page now prepends the issue title as the H1 when the markdown does not start with one (local files keep theirs).
- `js/articles.js` renderer: headings, rules, blockquotes and lists are now surrounded by blank lines, so text right after `## Heading` becomes its own paragraph instead of flowing next to the inline-block heading; ordered lists now wrap in `<ol>`; inline code content is HTML-escaped (`<feTurbulence>` was being parsed as a tag); CRLF is normalized; the leading `**Labels:** ...` line is hidden (tags are already shown) in both body and card summary; owner-authored issues show "Matthew Nguyen" instead of the GitHub login.
Unfinished / needs the user: Not pushed.

## 2026-10-15 — Article Detail Lag (Mitigations)

Done:
- Measured: JS main-thread work is negligible (no long tasks, ~0ms layout for 473 words), so the lag is paint/compositing. The in-app browser throttles frames, so real FPS could not be measured here.
- Mitigations: (1) the tall article card (~3000px) no longer applies the `#wob` SVG filter to its two border pseudo-elements (`.article-detail-wrap > .rbox::before/::after`), the most expensive raster in the page; (2) `js/reveal.js` unwraps the per-word spans once a block has finished writing (`rv-fin`), so long articles do not keep hundreds of clipped inline-blocks; (3) `?noreveal` URL flag disables the reveal for A/B testing.
Unfinished / needs the user: Confirm on the real browser/phone; if still laggy, record DevTools Performance while scrolling `article.html?id=6` and compare with `&noreveal`.

## 2026-10-15 — Added Koncierge Plus & Knowledge Base Management (KBTGVN)

Done: Added two bullets under the KBTGVN job in `index.html`: Koncierge Plus (hotel management website) and Knowledge Base Management (Confluence replacement for docs, instructions and guidelines across KBTG).
Unfinished / needs the user: Optional links/status/tech stack. Not pushed.

## 2026-10-16 — Mobile Polish, Notes Heading, Article Reactions

Done:
- Mobile (<=640px): tighter header/hero/section spacing; `.page-intro` on articles.
- `js/main.js`: `initHashAnchor()` re-aligns to `#hash` after fonts/load (iOS jumped to the wrong spot for `index.html#contact` coming from articles).
- Section numbers vanishing on scroll (iOS): titles under SVG filter no longer keep clip-path/transition after the reveal (`rv-fin`), and touch devices fade instead of clip-wipe. Could not reproduce on a real iPhone; please confirm.
- Articles heading is now "My Notes & Thoughts." with intro about learning/thinking/improving for now and for later; page title/meta updated.
- New `js/reactions.js` + worker endpoints `/reactions` and `/reaction` (4 reactions: love, insight, clap, learned); per-reader picks in localStorage, toggle off allowed.
Unfinished / needs the user: Redeploy the Worker (`cd worker && npx wrangler deploy`) for reactions to count; until then buttons work locally without counts. Not pushed.

## 2026-10-16 — Reaction Set Changed

Done: Reactions are now Loved it, Well said, Learned something (positive) plus Not convinced and Lost me (constructive negatives); "Made me think" was removed. Worker `REACTION_TYPES` updated (old `insight` counts are simply ignored).
Unfinished / needs the user: Redeploy the Worker (`cd worker && npx wrangler deploy`) or the two new reactions are rejected with 400. Not pushed.

## 2026-10-17 — Project Screenshots (Torn-Paper Photos) & TR Store

Done:
- Added the TR Store card (trstore.vn) at the top of Projects.
- Captured hero screenshots with headless Chrome for 9 sites (TR Store, Acecook, The Untold Story, Tet Wishes, Memecoin page, Bahi, Snake game, Portfolio v1, Wedding page) into `assets/projects/*.webp` (640px wide, 7-37 KB each).
- Cards with a screenshot (`.has-shot`) show it bottom-right as a taped, torn-edge photo (`.proj-shot`: clip-path torn edge, tape strip, drop shadow, slight rotation; links to the site).
Unfinished / needs the user: Screenshots for Wattsup (site unreachable), Nan LMS (access denied for bots), Koncierge Plus, KBM (internal), Dili D.I.S.C (SSL error), Films Info (API error at capture time). Send them as 16:10 images and they will be added. The wedding and portfolio-v1 shots show personal photos; remove them if unwanted. Not pushed.

## 2026-10-17 — Temporarily Hide Bahi and Dili D.I.S.C

Done: Wrapped the two project cards in HTML comments (`<!-- Temporarily hidden: ... -->`) in `index.html`; remove the comment markers to restore them. `assets/projects/bahi.webp` is kept. Not pushed.

## 2026-10-17 — Nan LMS and KBM Screenshots

Done: Added the author-supplied screenshots (`assets/projects/nanlms.webp`, `kbm.webp`, 640px wide) to the Nan LMS and Internal Confluence (KBM) cards as torn-paper photos. Not pushed.
Unfinished / needs the user: Screenshots still missing for Wattsup EVBike and Koncierge Plus.

## 2026-10-17 — Nan LMS Name

Done: Added "(Hooyoung)" after Nan LMS in the KBTGVN work bullet and the project card title. Not pushed.

## 2026-10-17 — Repository Renamed to ngmanhtruong.github.io

Done: The GitHub repo was renamed by the author to `ngmanhtruong/ngmanhtruong.github.io`. Updated `origin`, `GITHUB_CMS_CONFIG.repo` in `js/articles.js` and the issue URLs in `content/issues.json`. The sync workflow uses `GITHUB_REPOSITORY`, so it needs no change. Earlier log entries keep the old name (history).
Unfinished / needs the user: Check that Vercel is still linked to the renamed repo, and that GitHub Pages is not unintentionally enabled for this `*.github.io` repo. Not pushed.

## 2026-10-17 — Films Info Screenshot

Done: Added the author-supplied Trending Movies screenshot (`assets/projects/filmsinfo.webp`, 640px wide, 32 KB) to the Films Info card. Not pushed.

## 2026-10-17 — Counters Hidden on the github.io Site

Done: After the repo was renamed to `ngmanhtruong.github.io`, GitHub Pages serves the site at https://ngmanhtruong.github.io too. The counter Worker only allowed `https://matthewnguyen.vercel.app` (CORS), so browsers on the github.io origin were blocked and `js/stats.js` hid the counts (API itself fine: 40 visits, 22 hearts). Added `https://ngmanhtruong.github.io` to `ALLOWED_ORIGINS` in `worker/index.js`.
Unfinished / needs the user: Redeploy the Worker (`cd worker && npx wrangler deploy`). Not pushed.

## 2026-10-17 — Hand-Drawn Borders for Article Filters, Cards, Detail and Reactions

Done:
- Article filters: the 4 category tabs use two crossing, rotated, wobbly stroke pairs (red when active/hover); the topic box and empty state use wobbly dashed outlines; tag pills, card tags and reaction buttons use a loose irregular pencil loop (`::before`, fill moved onto the loop so no rectangular background shows); the category badge uses crossing strokes.
- Reactions: the dashed divider above them is a wobbly pseudo-element line.
- Article detail card: the full-size filtered pseudo borders (laggy on a ~3000px card) are replaced by four thin `.rbox-edge` elements with `#wob-h` / `#wob-v` filters (margins on one axis so 2-3px lines are not clipped), so the border is hand-drawn again at a tiny filter area. Blockquotes lost their ruler-straight left border.
Unfinished / needs the user: Judge scroll smoothness of article detail on a real device (use `?noreveal` to compare). Not pushed.

## 2026-10-17 — svgdoodles.com Icons for Filters, Badges and Reactions

Done: Replaced the emoji icons in the 4 category tabs, the category badges (cards + detail) and the 5 reaction buttons with hand-drawn SVGs from svgdoodles.com, embedded as `<symbol>`s in `articles.html` / `article.html` (`.doodle-ic` in `css/style.css`; icons inherit the text colour: blue, red when active/selected). Mapping is listed in `assets/README.md`. The site states the doodles are free to use in websites/apps; it has no formal license page, so credit is kept in `assets/README.md`.
Unfinished / needs the user: Optionally add a visible credit line in the page footer. Not pushed.

## 2026-10-17 — Page-Turn Transition

Done: Added `js/page-flip.js` (loaded in the head of all 3 pages) and the `@view-transition` / `page-turn-*` CSS. Verified in the in-app browser that index -> articles gets `page-forward` and articles -> index gets `page-back`. The visual animation itself could not be watched (the in-app browser renders slowly), so timing/feel needs a look on a real browser.
Tuning knobs in `css/style.css`: duration 0.75s (0.55s at <=640px), easing, `perspective(2400px)`, end angle -100deg, shadow in the `page-turn-away` / `page-turn-in` keyframes. Not pushed.

## 2026-10-17 — Inline Style Cleanup & Color Variables

Done:
- Removed all 139 inline `style=""` attributes from `index.html`, `articles.html`, `article.html` and the markup built in `js/articles.js` (card, empty state, markdown renderer). Repeated patterns became utilities (`.mt-*`, `.fs-*`, `.col-*`, `.rot-*`, `.wob2`...), one-offs became semantic classes (`.about-grid`, `.page-title`, `.article-sheet`, `.empty-*`...), and the 25 hand-placed floating doodles are now positioned in CSS per section (`#about > .dd.abs:nth-of-type(n)`). Markdown body elements are styled under `.article-content`.
- Colors: `:root` now holds RGB triplets (`--red-rgb`, `--blue-rgb`, `--lime-rgb`, ...) and named one-off tokens (`--sticky`, `--pin-light`, `--paper-bright`...); 67 `rgba(...)` and 11 hex literals in `css/style.css` now use them. `--paper/--ink/--red/--blue/--pencil` derive from the triplets.
- Verified with before/after full-page screenshots (headless Chrome, desktop and narrow): home page identical (apart from the live visit counter), articles list identical, article detail identical on desktop. On narrow screens the articles/article header now uses the same 8px top padding as the home page (the old inline `padding-top:24px` was overriding the mobile rule), shifting the page up 16px: intended.
Unfinished / needs the user: `js/pencil-draw.js` still injects a small `<style>` with a few literal colors for its toolbar. Not pushed.

## 2026-10-17 — Meta-Engineering Article Discussion & 3D Note Favicon

Done:
- Conducted interactive dialogue exploring the project's AI-first methodology, three-tier memory architecture (`instructions.md`, `CLAUDE.md`, `docs/`), human-in-the-loop architectural control, and the Dual-Agent Rule for security (independent adversarial auditing).
- Authored a concise 3-minute article (~650 words) titled *"Stop Letting AI Agents Wreck Your Codebase: Architecture, Memory, and the Dual-Agent Rule"* and exported it to `/Users/apple/Downloads/stop-letting-ai-agents-wreck-your-codebase.md`.
- Updated website favicon across `index.html`, `articles.html`, and `article.html` to `assets/note-svg.svg`.
- Optimized scroll handwriting reveal speed specifically for mobile/touch devices (`js/reveal.js`, `css/style.css`): faster word intervals (10ms vs 22ms), capped paragraph duration (650ms vs 1700ms), shorter queue handoff (180ms vs 700ms), snappier CSS transitions (0.25s vs 0.45s), and earlier IntersectionObserver rootMargin (40px pre-trigger); desktop timing remains 100% unchanged.
Unfinished / needs the user: None. Not pushed.


## 2026-10-17 — Section Order & Notebook Card on Mobile

Done:
- `index.html`: sections are now About (01), Skills (02), Projects (03), School & achievements (04), Work experience (05), Say hi (06). Banner comments and `.n` numbers renumbered, nav note links reordered (Me?, Skills, Projects, Cert, Work, Contact) and the scroll-spy `ids` in `js/main.js` follow the new document order.
- `css/style.css` (<=640px): `.notebook-card-wrapper` is hidden, which hides the "My Notebook" card (name, subject, class, city) and the small doodle row under it.
Unfinished / needs the user: The section title still reads "School & achievements" (nav label "Cert"); rename if you prefer "Education & Certificates". Not pushed.

## 2026-10-17 — Fix: Hero/Section Titles Never Appearing on Desktop Chrome

Done: Reproduced the report (hero title `hw ink hero-title rv rv-whole` stayed at opacity 0 on desktop). Root cause: `.rv-whole` titles started with `clip-path: inset(... 100% ...)` (fully clipped) and are IntersectionObserver targets; Chromium treats a fully clipped target as not intersecting, so `rv-on` was never added. Touch devices were unaffected because they used a clip-free variant. `.rv-whole` now uses opacity + a small `translate` rise on every device (no clip-path), with a comment in `css/style.css` warning not to clip IO targets. Verified the hero title and the Projects title turn on when in view.
Unfinished / needs the user: Titles that are skipped over by a jump (e.g. `#contact` anchor) appear when you scroll back up to them; this is by design of the scroll reveal. Not pushed.

## 2026-10-17 — Merge About, Move Skills and "Things I Enjoy"

Done:
- About: the "What I do, in a nutshell" list now lives inside the AI card ("A Sr. engineer in the age of AI agents"), after the intro line and before the four feature columns (two columns on wide screens). The old two-column About grid and its lead paragraph were removed, along with the unused `.about-grid/.col-340/.col-420` CSS.
- "Things I enjoy" moved into the hero: a new `.hero-bottom` row splits in half, buttons (See my projects / Say hi / My thoughts) on the left and the card on the right. At <=768px the hero copy is hidden and a second copy (`.enjoy-mobile`) appears between Work and Skills, so the phone order ends: enjoy -> skills -> contact.
- Sections are now About (01), Projects (02), School & achievements (03), Work (04), Skills (05), Say hi (06); nav note order (Me?, Projects, Cert, Work, Skills, Contact) and the scroll-spy `ids` follow.
Unfinished / needs the user: Further trimming candidates if wanted: "Lean on resources" and "Faster page loads" overlap; the commented-out hero description. Not pushed.

## 2026-10-17 — Doodles in Skill Cards

Done: Each of the 4 skill cards got a `.skill-doodles` pair in its empty bottom-right corner (existing `d-*` symbols, 76px + 54px, slight rotations): Front-end laptop + cursor, Back-end & data diamond + spiral, Blockchain rocket + star, Tools & cloud cloud + cup. Pure decoration (`aria-hidden`, `pointer-events: none`). Not pushed.
