// Debrief: Cloudflare Worker.
// Serves the app and fetches Warcraft Logs data with YOUR API key, so visitors (and the desktop app) just paste a link.
// Required secrets (Worker > Settings > Variables and Secrets): WCL_CLIENT_ID and WCL_CLIENT_SECRET.
// Answers are cached at Cloudflare, so a pull someone already opened doesn't use your API allowance again.
// It only runs the app's own fixed queries (below), never one a visitor sends, so it can't be used as a free proxy for
// your key; and each visitor gets a fair share of the uncached requests (FAIR).

const REPORT_Q = __REPORT_Q__;
const EVENTS_Q = __EVENTS_Q__;
const RANK_Q = __RANK_Q__;
const TEAM_INFO_Q = __TEAM_INFO_Q__;
const TEAM_REPORTS_Q = __TEAM_REPORTS_Q__;
const NIGHT_Q = __NIGHT_Q__;
const DEATHS_Q = __DEATHS_Q__;
const APP_HTML = __HTML__;

let token = null;
async function getToken(env) {
  if (token && token.exp > Date.now()) return token.v;
  if (!env.WCL_CLIENT_ID || !env.WCL_CLIENT_SECRET) throw new Error('This site is missing its Warcraft Logs API key (WCL_CLIENT_ID / WCL_CLIENT_SECRET).');
  const r = await fetch('https://www.warcraftlogs.com/oauth/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(env.WCL_CLIENT_ID + ':' + env.WCL_CLIENT_SECRET), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error('Warcraft Logs rejected this site\'s API key (' + r.status + ').');
  token = { v: j.access_token, exp: Date.now() + Math.max(60, (j.expires_in || 3600) - 300) * 1000 };
  return token.v;
}
async function gql(env, query, variables) {
  const r = await fetch('https://www.warcraftlogs.com/api/v2/client', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + (await getToken(env)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (r.status === 429) throw new Error('Warcraft Logs is rate limiting this site right now. Try again in a few minutes.');
  const j = await r.json().catch(() => ({}));
  if (j.errors && j.errors.length) throw new Error(j.errors.map((e) => e.message).join('; '));
  if (!r.ok) throw new Error('Warcraft Logs answered ' + r.status + '.');
  return j.data;
}
// (the desktop app calls this site from its own window, so answers say any page may read them; they're public data)
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' };
const json = (obj, status, maxAge) => new Response(JSON.stringify(obj), {
  status: status || 200,
  headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': maxAge ? 'public, max-age=' + maxAge : 'no-store' },
});

// Fair use: each visitor (by IP) gets up to FAIR requests a minute that aren't already cached. Kept per server
// instance, so it's a soft limit, enough to stop one person (or a script) using up the hourly allowance for everyone.
const FAIR = 90, seen = new Map();
function fair(ip) {
  const now = Date.now(), w = seen.get(ip);
  if (!w || now - w.t > 60000) { seen.set(ip, { t: now, n: 1 }); if (seen.size > 5000) seen.clear(); return true; }
  return ++w.n <= FAIR;
}

const CODE = /^[A-Za-z0-9]{8,32}$/;
const num = (v) => { const n = parseFloat(v); return n === n ? n : null; };
// every route: what it needs from the address, its query and variables, how long to keep the answer, and what to return
const ROUTES = {
  '/api/report': { q: () => REPORT_Q, v: (p) => (CODE.test(p.get('code') || '') ? { code: p.get('code') } : null), age: 120, // (short: a live report keeps getting new pulls)
    out: (d, v) => { const rep = d && d.reportData && d.reportData.report; return rep || { error: 'Report ' + v.code + ' was not found or is private.', status: 404 }; } },
  '/api/events': { q: () => EVENTS_Q, age: 86400,
    v: (p) => { const code = p.get('code') || '', fight = parseInt(p.get('fight'), 10), s = num(p.get('s')), e = num(p.get('e')); return CODE.test(code) && fight >= 0 && s >= 0 && e > s ? { code, fid: [fight], s, e } : null; },
    out: (d) => { const ev = d.reportData.report.events; return { data: typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data, nextPageTimestamp: ev.nextPageTimestamp }; } },
  '/api/rankings': { q: () => RANK_Q, age: 3600, // (parses for one kill: damage or healing)
    v: (p) => { const code = p.get('code') || '', fight = parseInt(p.get('fight'), 10); return CODE.test(code) && fight >= 0 ? { code, fid: [fight], m: p.get('m') === 'hps' ? 'hps' : 'dps' } : null; },
    out: (d) => { const rk = d && d.reportData && d.reportData.report && d.reportData.report.rankings; return typeof rk === 'string' ? JSON.parse(rk) : rk || {}; } },
  // a Warcraft Logs team or guild, by its number or by region, server and name (the Progress page's team import)
  '/api/team': { q: () => TEAM_INFO_Q, age: 86400,
    v: (p) => { const id = parseInt(p.get('id'), 10); if (id > 0) return { id }; const name = p.get('name'), srv = p.get('srv'), reg = p.get('reg'); return name && srv && /^[A-Za-z]{2}$/.test(reg || '') ? { name, srv, reg } : null; },
    out: (d) => (d && d.guildData && d.guildData.guild) || { error: 'Warcraft Logs has no team or guild at that link.', status: 404 } },
  '/api/teamreports': { q: () => TEAM_REPORTS_Q, age: 600, // (new nights show up within 10 minutes)
    v: (p) => { const id = parseInt(p.get('id'), 10), page = parseInt(p.get('page'), 10) || 1; return id > 0 && page >= 1 && page <= 20 ? { id, page } : null; },
    out: (d) => d.reportData.reports },
  '/api/night': { q: () => NIGHT_Q, age: 600, v: (p) => (CODE.test(p.get('code') || '') ? { code: p.get('code') } : null),
    out: (d, v) => (d && d.reportData && d.reportData.report) || { error: 'Report ' + v.code + ' was not found or is private.', status: 404 } },
  '/api/deaths': { q: () => DEATHS_Q, age: 600,
    v: (p) => { const code = p.get('code') || '', s = num(p.get('s')), e = num(p.get('e')); return CODE.test(code) && s >= 0 && e > s ? { code, s, e } : null; },
    out: (d) => { const ev = d.reportData.report.events; return { data: typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data, nextPageTimestamp: ev.nextPageTimestamp }; } },
};

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), route = ROUTES[url.pathname];
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (route) {
      const v = route.v(url.searchParams);
      if (!v) return json({ error: "That request is missing something (a report code, fight or time range)." }, 400);
      const cache = caches.default, key = new Request(url.toString(), { method: 'GET' });
      const hit = await cache.match(key);
      if (hit) return hit;
      if (!fair(req.headers.get('CF-Connecting-IP') || 'x')) return json({ error: 'Too many requests at once. Wait a minute and try again.' }, 429);
      try {
        const out = route.out(await gql(env, route.q(), v), v);
        if (out && out.error) return json({ error: out.error }, out.status || 400);
        const res = json(out, 200, route.age);
        ctx.waitUntil(cache.put(key, res.clone()));
        return res;
      } catch (err) {
        return json({ error: String(err && err.message || err) }, 502);
      }
    }
    return new Response(APP_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
  },
};
