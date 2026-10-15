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
 */
const ALLOWED_ORIGINS = [
  'https://matthewnguyen.vercel.app',
  'http://localhost:4173',
  'http://localhost:3000',
];

const readCount = async (kv, key) => parseInt((await kv.get(key)) || '0', 10) || 0;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
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

    return json({ error: 'not found' }, 404);
  },
};
