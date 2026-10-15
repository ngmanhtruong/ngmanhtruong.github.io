# JavaScript Domain

## Purpose
Provides client-side interactivity across three core modules:
1. `main.js`: Smooth scrolling, sticky navigation active indicator (ScrollSpy), interactive checkboxes, and back-to-top button.
2. `pencil-draw.js`: Custom SVG pencil cursor, lightweight vector SVG doodle overlay, floating drawing toolbar, and synthetic Web Audio pencil scratching sound.
3. `articles.js`: Asynchronous article catalog loader and client-side markdown-to-HTML parser.

## Why it is designed this way
Implemented with zero external dependencies in native ECMAScript 6+. Designed with progressive enhancement in mind: if JavaScript is disabled or fails to load, the core portfolio content, links, anchors, and layouts remain 100% accessible and readable. Doodling uses SVG vector paths with quadratic Bézier interpolation to maintain 0MB VRAM footprint and buttery-smooth 60-120 FPS scrolling without canvas bitmap limits. Audio uses the Web Audio API to synthesize friction noise dynamically without network requests.

## Links to other domains
- Loaded by [`index.html`](file:///Users/apple/Documents/projects/portfolio/index.html), [`articles.html`](file:///Users/apple/Documents/projects/portfolio/articles.html), and [`article.html`](file:///Users/apple/Documents/projects/portfolio/article.html).
- Reads Markdown files and JSON catalog from the `content/` domain.
- Interacts with classes defined in [`css/style.css`](file:///Users/apple/Documents/projects/portfolio/css/style.css).

## Read before changing
- The scroll-spy tracks section positions with `requestAnimationFrame` throttling, using `getBoundingClientRect().top <= 150` with bottom viewport detection, applying `.on` and `.active` classes to dynamically render the wavy red underline on the active section link.
- In `pencil-draw.js`, drawing event listeners ignore clicks originating from `a, button, input, label, select, textarea, .doodle-toolbar` so native interactions and links remain responsive.
- Audio synthesis initializes on the first user interaction to comply with browser autoplay policies.

