// Debrief: Cloudflare Worker.
// Serves the app and fetches Warcraft Logs reports with YOUR API key, so visitors just paste a link.
// Required secrets (Worker > Settings > Variables and Secrets): WCL_CLIENT_ID and WCL_CLIENT_SECRET.
// Reports are cached at Cloudflare, so a pull someone already opened doesn't use your API limit again.

const REPORT_Q = __REPORT_Q__;
const EVENTS_Q = __EVENTS_Q__;
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
const json = (obj, status, maxAge) => new Response(JSON.stringify(obj), {
  status: status || 200,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': maxAge ? 'public, max-age=' + maxAge : 'no-store' },
});

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname === '/api/report' || url.pathname === '/api/events' || url.pathname === '/api/rankings') {
      const code = url.searchParams.get('code') || '';
      if (!/^[A-Za-z0-9]{8,32}$/.test(code)) return json({ error: "That doesn't look like a Warcraft Logs report code." }, 400);
      const cache = caches.default, key = new Request(url.toString(), { method: 'GET' });
      const hit = await cache.match(key);
      if (hit) return hit;
      try {
        let res;
        if (url.pathname === '/api/report') {
          const d = await gql(env, REPORT_Q, { code });
          const rep = d && d.reportData && d.reportData.report;
          if (!rep) return json({ error: 'Report ' + code + ' was not found or is private.' }, 404);
          res = json(rep, 200, 120); // short: a live report keeps getting new pulls
        } else if (url.pathname === '/api/rankings') {
          // (parses for one kill: damage or healing)
          const fight = parseInt(url.searchParams.get('fight'), 10), m = url.searchParams.get('m') === 'hps' ? 'hps' : 'dps';
          if (!(fight >= 0)) return json({ error: 'Bad fight.' }, 400);
          const d = await gql(env, 'query($code:String!,$fid:[Int]!,$m:ReportRankingMetricType){reportData{report(code:$code){rankings(fightIDs:$fid,playerMetric:$m)}}}', { code, fid: [fight], m });
          const rk = d && d.reportData && d.reportData.report && d.reportData.report.rankings;
          res = json(typeof rk === 'string' ? JSON.parse(rk) : rk || {}, 200, 3600);
        } else {
          const fight = parseInt(url.searchParams.get('fight'), 10), s = parseFloat(url.searchParams.get('s')), e = parseFloat(url.searchParams.get('e'));
          if (!(fight >= 0) || !(s >= 0) || !(e > s)) return json({ error: 'Bad fight or time range.' }, 400);
          const d = await gql(env, EVENTS_Q, { code, fid: [fight], s, e });
          const ev = d.reportData.report.events;
          res = json({ data: typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data, nextPageTimestamp: ev.nextPageTimestamp }, 200, 86400);
        }
        ctx.waitUntil(cache.put(key, res.clone()));
        return res;
      } catch (err) {
        return json({ error: String(err && err.message || err) }, 502);
      }
    }
    return new Response(APP_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
  },
};
