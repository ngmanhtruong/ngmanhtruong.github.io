/**
 * Visitor & heart counter — Cloudflare Worker backed by Workers KV.
 *
 * Why Cloudflare: free tier, no sleeping and no inactivity-based pausing/deletion,
 * which suits a low-traffic portfolio.
 *
 * Endpoints (JSON, CORS limited to ALLOWED_ORIGINS):
 *   GET  /stats          -> { visits, hearts }
 *   POST /visit          -> increments visits, returns stats
 *   POST /heart          -> body { on: boolean } adds/removes one heart, returns stats
 *   GET  /reactions?post=ID        -> { love, clap, learned, disagree, confusing } counts for one article
 *   POST /reaction  { post, type, on } -> adds/removes one reaction, returns the counts
 */
const REACTION_TYPES = ['love', 'clap', 'learned', 'disagree', 'confusing'];
const POST_ID = /^[a-z0-9-]{1,64}$/i;

const ALLOWED_ORIGINS = [
  'https://matthewnguyen.vercel.app',
  'https://ngmanhtruong.github.io',
];

// Local development (any port) may READ the counters so you can see them while building,
// but never write: the front-end skips POSTs on localhost and the Worker rejects them anyway.
const isLocalDev = (origin) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

const readCount = async (kv, key) => parseInt((await kv.get(key)) || '0', 10) || 0;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin);          // may write (POST)
    const mayRead = allowed || isLocalDev(origin);
    const cors = {
      'Access-Control-Allow-Origin': mayRead ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors },
      });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const { pathname } = new URL(request.url);
    const stats = async () => ({
      visits: await readCount(env.VISIT_COUNTERS, 'visits'),
      hearts: await readCount(env.VISIT_COUNTERS, 'hearts'),
    });

    if (request.method === 'GET' && pathname === '/stats') return json(await stats());

    // Writes only from the real site (browsers always send Origin on cross-origin POST).
    if (request.method === 'POST' && !allowed) return json({ error: 'forbidden' }, 403);

    if (request.method === 'POST' && pathname === '/visit') {
      await env.VISIT_COUNTERS.put('visits', String((await readCount(env.VISIT_COUNTERS, 'visits')) + 1));
      return json(await stats());
    }

    if (request.method === 'POST' && pathname === '/heart') {
      let on = true;
      try { on = (await request.json()).on !== false; } catch (_) {}
      const next = Math.max(0, (await readCount(env.VISIT_COUNTERS, 'hearts')) + (on ? 1 : -1));
      await env.VISIT_COUNTERS.put('hearts', String(next));
      return json(await stats());
    }

    const reactionCounts = async (post) => {
      const counts = {};
      for (const t of REACTION_TYPES) counts[t] = await readCount(env.VISIT_COUNTERS, `rx:${post}:${t}`);
      return counts;
    };

    if (request.method === 'GET' && pathname === '/reactions') {
      const post = new URL(request.url).searchParams.get('post') || '';
      if (!POST_ID.test(post)) return json({ error: 'bad post' }, 400);
      return json(await reactionCounts(post));
    }

    if (request.method === 'POST' && pathname === '/reaction') {
      let body = {};
      try { body = await request.json(); } catch (_) {}
      const { post = '', type = '' } = body;
      if (!POST_ID.test(String(post)) || !REACTION_TYPES.includes(type)) return json({ error: 'bad request' }, 400);
      const key = `rx:${post}:${type}`;
      const next = Math.max(0, (await readCount(env.VISIT_COUNTERS, key)) + (body.on === false ? -1 : 1));
      await env.VISIT_COUNTERS.put(key, String(next));
      return json(await reactionCounts(post));
    }

    return json({ error: 'not found' }, 404);
  },
};
