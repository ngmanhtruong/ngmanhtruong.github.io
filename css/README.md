# CSS Domain

## Purpose
Defines all visual styles, custom color properties, typography rules, hand-drawn wobbly box simulations, paper textures, and responsive breakpoints for the notebook-themed portfolio website.

## Why it is designed this way
The aesthetic mimics an authentic handwritten notebook (complete with binder holes, double red margin rule, graph paper grid, yellow adhesive tape, and ink displacement effects). It relies on native CSS pseudo-elements and SVG filters rather than raster images to ensure crisp scaling on high-DPI displays, zero asset latency, and effortless color tweaking via CSS variables.

## Links to other domains
- Included by [`index.html`](file:///Users/apple/Documents/projects/portfolio/index.html) to style the DOM.
- Targets SVG filters (`#wob`, `#wob2`, `#ink`) defined in the hidden SVG container in `index.html`.
- Controlled dynamically in part by [`js/main.js`](file:///Users/apple/Documents/projects/portfolio/js/main.js) (e.g. `.nav a.active`, `.back-to-top.visible`).

## Read before changing
- The `--ml` (margin-left) CSS variable coordinates both the left padding of `.pg` and the absolute positioning of the double red margin line (`.pg::before`) and binder holes (`.pg::after`). Adjusting one without testing the others will break the page alignment.
- The `.rbox` class utilizes `::before` and `::after` with slight rotations and the `#wob` SVG filter to render hand-drawn borders; do not override these pseudo-elements carelessly.
- The `.stickwrap` relies on `position: sticky; top: 14px; height: 0;` and `.pg` having `overflow-x: clip;` (not `hidden`) to ensure sticky positioning remains active throughout scrolling. The red pushpin is rendered via `.stick::before`. Sections utilize `scroll-margin-top: 96px;` to offset the height of the sticky note.
- The pencil cursor hotspot is set to `2 32` so the graphite tip precisely aligns with mouse clicks and canvas coordinate drawing. Canvas uses `mix-blend-mode: multiply` so graphite blends naturally into textured paper.
