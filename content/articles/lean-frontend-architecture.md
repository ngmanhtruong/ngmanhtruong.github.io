---
title: "Lean Front-End Architecture: Shipping Less JS, Getting More Speed"
slug: "lean-frontend-architecture"
date: "Sep 28, 2026"
readTime: "4 min read"
tags: ["Front-end", "Performance", "Web Standards", "CSS"]
summary: "Why modern web development doesn't always need 300kB of runtime JavaScript to look incredible and feel fluid."
author: "Matthew Nguyen"
---

# Lean Front-End Architecture: Shipping Less JS, Getting More Speed

Every year, JavaScript bundles grow larger. Developers import multi-megabyte frameworks, utility libraries, and UI component kits to build static landing pages and portfolio websites.

When designing this notebook portfolio, I deliberately set a rule: **Zero client runtime overhead. 100% native web standards.**

---

## 1. What SVG Filters Can Do Without Canvas Runtimes

The organic, wobbly, hand-drawn aesthetic of this site is entirely driven by native SVG displacement filters:

```html
<filter id="wob">
  <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="4" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
</filter>
```

By pointing regular CSS borders and strokes to `#wob` and `#wob2`, the browser computes the distorted raster in GPU memory. There are no heavy JavaScript animation loops or canvas rendering engines burning your laptop's battery.

---

## 2. Resource Stewardship

A good software engineer respects the user's device:

- **Bandwidth:** Users on mobile networks shouldn't wait 10 seconds for vendor bundles to download.
- **Battery Life:** Idle pages shouldn't burn CPU cycles polling or re-rendering unnecessarily.
- **Longevity:** A semantic HTML5 site built on web standards will render identically in 2036.

---

## 3. The Takeaway

Before reaching for `npm install`, ask yourself: *Can standard CSS and semantic HTML solve this elegantly?*

More often than not, the answer is a resounding yes.
