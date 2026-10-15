Read `instructions.md`, `docs/CODEMAP.md` and the 5 most recent entries of `docs/SESSION_LOG.md` before starting any task in this repo.

If the task touches a domain, read its entry in `docs/DECISIONS.md` first.

# Portfolio — Matthew Nguyen

A personalized, notebook-styled portfolio website for Matthew Nguyen, Senior Software Engineer from Ho Chi Minh City.

## Tech Stack & Architecture
- Pure semantic HTML5, modern CSS3 (Custom properties, SVG filters, Flexbox/Grid), and vanilla JavaScript.
- Zero-dependency client-side markdown loader for articles in `content/`.
- Full-page freehand drawing canvas with synthetic Web Audio pencil scratching sound.
- Design source & reference: `Portfolio-html/Main.dc.html`.

## Hard Constraints
- Preserve the authentic hand-drawn / notebook aesthetic: grid lines, binder holes, red margin rules, yellow tape, and SVG distortion filters (`#wob`, `#wob2`, `#ink`, `#paper`).
- Zero build step required: must run out-of-the-box in any standard browser or static web server.
- All code, comments, docstrings, and documentation files must be written in English.
- External links must always open safely in a new tab (`target="_blank"` with `rel="noopener noreferrer"`).
- Freehand pencil doodle canvas must not prevent clicking links, buttons, or interacting with form inputs.
