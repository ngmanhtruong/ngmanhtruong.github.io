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




