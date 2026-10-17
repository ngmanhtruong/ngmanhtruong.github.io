# Matthew Nguyen — Portfolio Website

A personal portfolio website featuring an authentic handwritten notebook aesthetic, built with clean, modern semantic HTML5, CSS3, and vanilla ES6 JavaScript.

## 📖 Overview

The site is styled to look like an open, lined notebook with:
- Ruled paper grid background with vignette shading.
- Double red margin rule and punched binder holes.
- SVG turbulence displacement filters (`#wob`, `#wob2`, `#ink`, `#paper`) producing organic, hand-drawn lines, borders, and ink bleeding effects.
- Playful hand-drawn doodle icons (laptop, cup, rocket, airplane, trophies, AI agent, diamond, etc.).
- **Interactive Pencil Cursor & Canvas**: Visitors can doodle freely anywhere on the page with realistic graphite strokes.
- **Pencil Scratch Sound**: Real-time synthesized graphite-on-paper sound effect generated via Web Audio API, dynamically modulated by cursor velocity.
- **Articles & Notes**: Dedicated technical thoughts section powered by portable Markdown files and catalog metadata.
- Subtle micro-interactions, pinned sticky navigation note with 3D red pushpin, active scroll spy, and interactive checklists.

## 🚀 Live Preview / Local Development

Since this site is built purely with standard web technologies, there are zero build steps or package installations required.

To run locally:
```bash
# Recommended: Python 3 server that disables browser caching, so edits show up immediately
python3 scripts/serve.py 8000

# Plain Python 3 server (browsers may keep serving stale CSS/JS; use a hard reload, Cmd+Shift+R)
python3 -m http.server 8000

# Or with Node.js (npx serve):
npx serve .
```

Then open `http://localhost:8000` in your web browser.

## 📂 Project Structure

```text
├── index.html          # Semantic HTML5 entry point (Main Portfolio)
├── articles.html       # Articles & Thoughts index page
├── article.html        # Article detail reader with markdown parser
├── content/
│   ├── articles.json   # Article catalog index
│   ├── articles/       # Markdown source articles (.md)
│   └── README.md       # Content domain documentation
├── css/
│   ├── style.css       # Complete notebook & doodle styles, custom properties & responsive rules
│   └── README.md       # CSS domain documentation
├── js/
│   ├── main.js         # Navigation, scroll-spy, checklist interactivity, back-to-top
│   ├── pencil-draw.js  # Pencil cursor, full-page drawing canvas, Web Audio sound engine
│   ├── articles.js     # Article catalog loader and client-side markdown parser
│   └── README.md       # JS domain documentation
├── docs/
│   ├── CODEMAP.md      # Code map of domains and entry points
│   ├── DECISIONS.md    # Architecture and technical design records
│   └── SESSION_LOG.md  # Session activity history
├── Portfolio-html/     # Original reference design mockup
├── CLAUDE.md           # Product constraints and agent guidelines
└── instructions.md     # Cross-project conventions
```

## 🛠️ Tech Stack

- **HTML5**: Semantic tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`).
- **CSS3**: Custom Properties, SVG displacement filters, Flexbox, Grid, CSS animations.
- **JavaScript (ES6+)**: Web Audio API (synthetic sound), Canvas 2D (freehand drawing), IntersectionObserver (ScrollSpy), Fetch API.
- **Typography**: Google Fonts (*Caveat*, *Patrick Hand*, *Reenie Beanie*).
