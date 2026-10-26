// Picture plan (Oct 26): the Worker hands over a boss room's render (RaidPlan's CDN won't let a page copy its pictures into a canvas)
const fs = require('fs'), path = require('path'), dir = process.argv[2];
const f = path.join(dir, 'worker_template.js'); let s = fs.readFileSync(f, 'utf8'); if (s.includes('\r')) throw new Error('CR');
const R = (a, b) => { const c = s.split(a).length - 1; if (c !== 1) throw new Error('count ' + c + ': ' + a.slice(0, 80)); s = s.replace(a, b); };
R("    if (url.pathname === '/api/ratelimit') return rateLimitRoute(req, env, url); /* (the site key's real allowance, Oct 26) */\n",
  "    if (url.pathname === '/api/ratelimit') return rateLimitRoute(req, env, url); /* (the site key's real allowance, Oct 26) */\n" +
  "    if (url.pathname.startsWith('/api/art/')) return roomArt(url, ctx); /* (a boss room's picture for Plan's pictures, Oct 26) */\n");
R('async function rateLimitRoute(req, env, url) {',
  "// Plan's pictures (Oct 26) draw the boss's room into a picture you can copy. The room renders come from RaidPlan's CDN, which doesn't let\n" +
  "// a page copy its pictures, so this fetches only those map files (one fixed folder, a plain file name) and keeps them a week.\n" +
  "async function roomArt(url, ctx) {\n" +
  "  const f = url.pathname.slice('/api/art/'.length); if (!/^[\\w.-]{1,80}\\.(?:jpg|png|webp)$/.test(f)) return new Response('Not a room picture.', { status: 400 });\n" +
  "  const cache = caches.default, key = new Request('https://art.debriefme.io/' + f), hit = await cache.match(key); if (hit) return hit;\n" +
  "  const r = await fetch('https://cdn.raidplan.io/raid/wow.venomabyss/map/' + f); if (!r.ok) return new Response('No such room picture.', { status: 404 });\n" +
  "  const out = new Response(r.body, { headers: { 'content-type': r.headers.get('content-type') || 'image/jpeg', 'cache-control': 'public, max-age=604800' } });\n" +
  "  ctx.waitUntil(cache.put(key, out.clone())); return out;\n" +
  "}\n" +
  'async function rateLimitRoute(req, env, url) {');
fs.writeFileSync(f, s); console.log('ppart ok');
