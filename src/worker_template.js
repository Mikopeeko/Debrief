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
const CHAR_INFO_Q = __CHAR_INFO_Q__;
const CHAR_REPORTS_Q = __CHAR_REPORTS_Q__;
const CHAR_RANK_Q = __CHAR_RANK_Q__;
const TEAM_RANK_Q = __TEAM_RANK_Q__;
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
// the same request, its reply kept as text (not parsed): an error reply is short, so only a short one is looked inside
async function gqlText(env, query, variables) {
  const r = await fetch('https://www.warcraftlogs.com/api/v2/client', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + (await getToken(env)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (r.status === 429) throw new Error('Warcraft Logs is rate limiting this site right now. Try again in a few minutes.');
  if (!r.ok) throw new Error('Warcraft Logs answered ' + r.status + '.');
  const txt = await r.text();
  if (txt.length < 4000 && /"errors"\s*:/.test(txt)) { let m = 'Warcraft Logs refused the request.'; try { m = JSON.parse(txt).errors.map((e) => e.message).join('; '); } catch (e) { /* keep the plain message */ } throw new Error(m); }
  return txt;
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
  // (short: a report being live logged keeps getting new pulls, and following one live asks every 30 seconds)
  '/api/report': { q: () => REPORT_Q, v: (p) => (CODE.test(p.get('code') || '') ? { code: p.get('code') } : null), age: (p) => (p.get('live') ? 20 : 120),
    out: (d, v) => { const rep = d && d.reportData && d.reportData.report; return rep || { error: 'Report ' + v.code + ' was not found or is private.', status: 404 }; } },
  // (raw: the big downloads pass Warcraft Logs' reply straight through, unparsed, which keeps the Worker's CPU time tiny)
  '/api/events': { q: () => EVENTS_Q, age: 86400, raw: true,
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
  // a Warcraft Logs character, and the reports they're in (the Progress page's "your own progress")
  '/api/char': { q: () => CHAR_INFO_Q, age: 86400,
    v: (p) => { const id = parseInt(p.get('id'), 10); if (id > 0) return { id }; const name = p.get('name'), srv = p.get('srv'), reg = p.get('reg'); return name && srv && /^[A-Za-z]{2}$/.test(reg || '') ? { name, srv, reg } : null; },
    out: (d) => (d && d.characterData && d.characterData.character) || { error: 'Warcraft Logs has no character at that link.', status: 404 } },
  '/api/charreports': { q: () => CHAR_REPORTS_Q, age: 600,
    v: (p) => { const id = parseInt(p.get('id'), 10), page = parseInt(p.get('page'), 10) || 1; return id > 0 && page >= 1 && page <= 5 ? { id, page } : null; },
    out: (d) => (d && d.characterData && d.characterData.character && d.characterData.character.recentReports) || { error: 'Warcraft Logs has no character with that number.', status: 404 } },
  // a character's rankings on one difficulty, damage or healing, one spec or their best (the character page's "Your rankings")
  '/api/charrank': { q: () => CHAR_RANK_Q, age: 1800,
    v: (p) => { const id = parseInt(p.get('id'), 10), d = parseInt(p.get('d'), 10), s = p.get('s'); return id > 0 && [1, 3, 4, 5].includes(d) && (!s || /^[A-Za-z ]{3,20}$/.test(s)) ? { id, d, m: p.get('m') === 'hps' ? 'hps' : 'dps', s: s || null } : null; },
    out: (d) => { const z = d && d.characterData && d.characterData.character && d.characterData.character.zoneRankings; return (typeof z === 'string' ? JSON.parse(z) : z) || { error: 'No rankings for that character.', status: 404 }; } },
  // a team's or guild's world, region and server rankings this tier (the team page's "Team rankings")
  '/api/teamrank': { q: () => TEAM_RANK_Q, age: 3600,
    v: (p) => { const id = parseInt(p.get('id'), 10), z = parseInt(p.get('z'), 10); return id > 0 && z > 0 && z < 1000 ? { id, z } : null; },
    out: (d) => (d && d.guildData && d.guildData.guild) || { error: 'Warcraft Logs has no rankings for that team.', status: 404 } },
  '/api/night': { q: () => NIGHT_Q, age: 600, v: (p) => (CODE.test(p.get('code') || '') ? { code: p.get('code') } : null),
    out: (d, v) => (d && d.reportData && d.reportData.report) || { error: 'Report ' + v.code + ' was not found or is private.', status: 404 } },
  '/api/deaths': { q: () => DEATHS_Q, age: 600, raw: true,
    v: (p) => { const code = p.get('code') || '', s = num(p.get('s')), e = num(p.get('e')); return CODE.test(code) && s >= 0 && e > s ? { code, s, e } : null; },
    out: (d) => { const ev = d.reportData.report.events; return { data: typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data, nextPageTimestamp: ev.nextPageTimestamp }; } },
};

// (the pull downloads also answer at /api/fightlog: ad blockers' tracking lists block addresses ending in "/api/events",
// which broke the site in a browser with one; /api/events stays for pages and desktop apps still asking there)
ROUTES['/api/fightlog'] = ROUTES['/api/events'];

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
        const age = typeof route.age === 'function' ? route.age(url.searchParams) : route.age;
        if (route.raw) {
          const res = new Response(await gqlText(env, route.q(), v), { headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=' + age } });
          ctx.waitUntil(cache.put(key, res.clone()));
          return res;
        }
        const out = route.out(await gql(env, route.q(), v), v);
        if (out && out.error) return json({ error: out.error }, out.status || 400);
        const res = json(out, 200, age);
        ctx.waitUntil(cache.put(key, res.clone()));
        return res;
      } catch (err) {
        return json({ error: String(err && err.message || err) }, 502);
      }
    }
    return new Response(APP_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
  },
};
