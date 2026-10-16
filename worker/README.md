# Counter Worker

## Purpose
Stores the site-wide visit and heart counters shown in every page footer.

## Why it is designed this way
Cloudflare Workers + KV: free, and unlike Supabase/Render/Heroku-style free tiers it never pauses or deletes data after inactivity. KV increments are not atomic; acceptable for a low-traffic portfolio.

## Links to other domains
Called by `js/stats.js` (visits, hearts) and `js/reactions.js` (per-article reactions) via `COUNTER_API`. After changing `index.js` run `npx wrangler deploy` again.

## Read before changing
- Deploy: `cd worker && npx wrangler login && npx wrangler kv namespace create VISIT_COUNTERS`, paste the id into `wrangler.toml`, then `npx wrangler deploy`.
- Put the resulting `https://portfolio-counter.<account>.workers.dev` URL into `COUNTER_API` in `js/stats.js`.
- Writes are restricted to `ALLOWED_ORIGINS` in `index.js`; update it if the domain changes.
