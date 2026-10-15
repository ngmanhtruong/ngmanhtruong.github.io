---
title: "Lessons from Building Metaverse and Real-time Web Experiences"
slug: "building-interactive-metaverse-web"
date: "Aug 15, 2026"
readTime: "6 min read"
tags: ["Metaverse", "WebGL", "Unity", "GraphQL"]
summary: "Reflections on bridging Unity 3D with React and Next.js for virtual sports arenas and real-time runner tracking."
author: "Matthew Nguyen"
---

# Lessons from Building Metaverse and Real-time Web Experiences

During my time working on Raramuri and Agoran, we took on an ambitious challenge: bringing immersive virtual marathon running tracks into the web browser, allowing thousands of global spectators to follow runners in real-time.

Here are the key lessons learned from bridging WebGL/Unity with modern front-end web stacks.

---

## 1. The Boundary Between Canvas and DOM

A common mistake in WebGL applications is trying to render everything—including complex menus, modal forms, and social feeds—inside the WebGL canvas.

We found that the ideal split was:
- **Inside Canvas:** The 3D running track, runner avatars, camera physics, and spatial lighting.
- **Inside DOM (React/HTML):** Leaderboards, participant stats, real-time commentary feeds, and interactive control widgets.

This ensured screen reader accessibility, natural mobile touch scrolling, and crisp vector typography.

---

## 2. High-Frequency State Synchronization

Marathon runners stream positional telemetry every few milliseconds. Pushing every update through standard React state updates caused severe reconciliation bottlenecks.

**The Solution:**
- Bypassed React state for high-frequency position updates.
- Used direct WebGL buffer mutations and WebSockets with binary payloads.
- Kept React state strictly for low-frequency events (e.g. lap completion, leaderboard ranking changes).

---

## 3. Keep Exploring

Building interactive, playful web experiences reminds us of what makes the internet magical. Whether it's a 3D metaverse marathon or a notebook portfolio with a pencil drawing cursor, great software puts a smile on people's faces.
