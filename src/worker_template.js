// Debrief: Cloudflare Worker.
// Serves the app and fetches Warcraft Logs data with YOUR API key, so visitors (and the desktop app) just paste a link.
// Required secrets (Worker > Settings > Variables and Secrets): WCL_CLIENT_ID and WCL_CLIENT_SECRET.
// Optional: GITHUB_TOKEN, which switches on "Report a problem" (reports become issues on the project's GitHub).
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
const TEAM_LATEST_Q = __TEAM_LATEST_Q__;
const CHAR_LATEST_Q = __CHAR_LATEST_Q__;
const CHAR_RANK_Q = __CHAR_RANK_Q__;
const TEAM_RANK_Q = __TEAM_RANK_Q__;
const CHAR_LOOK_Q = __CHAR_LOOK_Q__;
const TOPRANK_Q = __TOPRANK_Q__;
const TOPAB_Q = __TOPAB_Q__;
const APP_HTML = __HTML__;
/*TOPSPEC*/

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
// (180: a Mythic night is ~500 page downloads, so at 90 the first person to open one waited 6 minutes or more; cached ones
// don't count, so everyone after them is quick either way)
const FAIR = 180, seen = new Map();
function fair(ip) {
  const now = Date.now(), w = seen.get(ip);
  if (!w || now - w.t > 60000) { seen.set(ip, { t: now, n: 1 }); if (seen.size > 5000) seen.clear(); return true; }
  return ++w.n <= FAIR;
}

const CODE = /^[A-Za-z0-9]{8,32}$/;
const num = (v) => { const n = parseFloat(v); return n === n ? n : null; };
// every route: what it needs from the address, its query and variables, how long to keep the answer, and what to return
const ROUTES = {
  // (short: a report being live logged keeps getting new pulls, and following one live asks every 15 seconds)
  '/api/report': { q: () => REPORT_Q, v: (p) => (CODE.test(p.get('code') || '') ? { code: p.get('code') } : null), age: (p) => (p.get('live') ? 15 : 120),
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
  // a team's or character's newest report, for "Live now" on their page (kept 30 seconds, so a raid shows up as it starts;
  // everyone looking at the same team shares the one answer)
  '/api/teamlatest': { q: () => TEAM_LATEST_Q, age: 30, v: (p) => { const id = parseInt(p.get('id'), 10); return id > 0 ? { id } : null; }, out: (d) => d.reportData.reports },
  '/api/charlatest': { q: () => CHAR_LATEST_Q, age: 30, v: (p) => { const id = parseInt(p.get('id'), 10); return id > 0 ? { id } : null; },
    out: (d) => (d && d.characterData && d.characterData.character && d.characterData.character.recentReports) || { error: 'Warcraft Logs has no character with that number.', status: 404 } },
  // a character's rankings on one difficulty, damage or healing, one spec or their best (the character page's "Your rankings")
  '/api/charrank': { q: () => CHAR_RANK_Q, age: 1800,
    v: (p) => { const id = parseInt(p.get('id'), 10), d = parseInt(p.get('d'), 10), s = p.get('s'); return id > 0 && [1, 3, 4, 5].includes(d) && (!s || /^[A-Za-z ]{3,20}$/.test(s)) ? { id, d, m: p.get('m') === 'hps' ? 'hps' : 'dps', s: s || null } : null; },
    out: (d) => { const z = d && d.characterData && d.characterData.character && d.characterData.character.zoneRankings; return (typeof z === 'string' ? JSON.parse(z) : z) || { error: 'No rankings for that character.', status: 404 }; } },
  // a team's or guild's world, region and server rankings this tier (the team page's "Team rankings")
  '/api/teamrank': { q: () => TEAM_RANK_Q, age: 3600,
    v: (p) => { const id = parseInt(p.get('id'), 10), z = parseInt(p.get('z'), 10); return id > 0 && z > 0 && z < 1000 ? { id, z } : null; },
    out: (d) => (d && d.guildData && d.guildData.guild) || { error: 'Warcraft Logs has no rankings for that team.', status: 404 } },
  // a character's look: their realm and Blizzard number, for Blizzard's pictures of them (the character page and cards).
  // (text: Warcraft Logs' copy of their Armory profile is about 1 MB, so it isn't unpacked; both are at its very start)
  '/api/charlook': { q: () => CHAR_LOOK_Q, age: 604800, text: true,
    v: (p) => { const id = parseInt(p.get('id'), 10); return id > 0 ? { id } : null; },
    out: (t) => { const m = t.slice(0, 6000).replace(/\\\//g, '/').match(/"global":\{"_links":\{"self":\{"href":"https:\/\/(\w+)\.api\.blizzard\.com\/profile\/wow\/character\/([^/"]+)\/[^"]*"\}\},"id":(\d+)/);
      return { look: m ? m[1] + '/character/' + m[2] + '/' + (+m[3] % 256) + '/' + m[3] : null }; } },
  // the top 3 players of a spec on a boss and their spells (Graphs' player card): a few queries in one, kept a day
  '/api/topspec': { age: 86400, run: (env, v) => topSpecOf((q, vars) => gql(env, q, vars), v),
    v: (p) => { const e = parseInt(p.get('e'), 10), d = parseInt(p.get('d'), 10), c = p.get('c') || '', s = p.get('s') || ''; return e > 0 && [3, 4, 5].includes(d) && /^[A-Za-z]{4,15}$/.test(c) && /^[A-Za-z]{3,20}$/.test(s) ? { e, c, s, d, m: p.get('m') === 'hps' ? 'hps' : 'dps', n: 8 } : null; } }, // (8: Compare keeps the 3 best on your hero tree)
  // one page (100) of a spec's rankings on a boss, slimmed (Compare's "Search for a player"), kept a day
  '/api/specrank': { age: 86400, run: (env, v) => specRanksOf((q, vars) => gql(env, q, vars), v),
    v: (p) => { const e = parseInt(p.get('e'), 10), d = parseInt(p.get('d'), 10), c = p.get('c') || '', s = p.get('s') || '', pg = parseInt(p.get('p'), 10) || 1; return e > 0 && [3, 4, 5].includes(d) && /^[A-Za-z]{4,15}$/.test(c) && /^[A-Za-z]{3,20}$/.test(s) && pg >= 1 && pg <= 20 ? { e, c, s, d, m: p.get('m') === 'hps' ? 'hps' : 'dps', p: pg } : null; } },
  // 20 kills of a boss from one page of the fastest, with who played what (Compare's "Raids like yours"), kept a day
  '/api/topkills': { age: 86400, run: (env, v) => topKillsOf((q, vars) => gql(env, q, vars), v),
    v: (p) => { const e = parseInt(p.get('e'), 10), d = parseInt(p.get('d'), 10), pg = parseInt(p.get('p'), 10) || 1; return e > 0 && [3, 4, 5].includes(d) && pg >= 1 && pg <= 40 ? { e, d, p: pg, n: 20 } : null; } },
  // the pulls and nights a guild needed for its first kill of a boss (Compare): history, so kept a week
  '/api/guildprog': { age: 604800, run: (env, v) => guildProgOf((q, vars) => gql(env, q, vars), v),
    v: (p) => { const g = parseInt(p.get('g'), 10), e = parseInt(p.get('e'), 10), d = parseInt(p.get('d'), 10), t = num(p.get('t')); return g > 0 && e > 0 && [3, 4, 5].includes(d) && t > 1.6e12 ? { g, e, d, t } : null; } },
  '/api/night': { q: () => NIGHT_Q, age: 600, v: (p) => (CODE.test(p.get('code') || '') ? { code: p.get('code') } : null),
    out: (d, v) => (d && d.reportData && d.reportData.report) || { error: 'Report ' + v.code + ' was not found or is private.', status: 404 } },
  '/api/deaths': { q: () => DEATHS_Q, age: 600, raw: true,
    v: (p) => { const code = p.get('code') || '', s = num(p.get('s')), e = num(p.get('e')); return CODE.test(code) && s >= 0 && e > s ? { code, s, e } : null; },
    out: (d) => { const ev = d.reportData.report.events; return { data: typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data, nextPageTimestamp: ev.nextPageTimestamp }; } },
};

// "Report a problem" (the site's form): files it as an issue on the project's private GitHub, with the page it came
// from. Needs the GITHUB_TOKEN secret: a fine-grained token for this one repository, with Issues: read and write.
// Limits: 3 reports per visitor in 10 minutes and 40 an hour in all (per server instance, so soft), short texts only,
// only from the site's own pages, and a hidden field that bots fill in.
const BUG_REPO = 'Mikopeeko/Debrief', bugSeen = new Map();
let bugHour = { t: 0, n: 0 };
async function fileBug(req, env, url) {
  if (!env.GITHUB_TOKEN) return json({ error: 'Reporting isn\'t switched on yet.' }, 503);
  if (req.headers.get('Origin') !== url.origin) return json({ error: 'Reports can only be sent from the Debrief website.' }, 403);
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'That report was empty.' }, 400); }
  if (!b || typeof b !== 'object') return json({ error: 'That report was empty.' }, 400);
  if (b.website) return json({ ok: true }); // (a bot filled in the hidden field: say thanks and drop it)
  const text = String(b.text || '').trim().slice(0, 4000), name = String(b.name || '').trim().slice(0, 60);
  if (text.length < 10) return json({ error: 'Please say a little more about what went wrong.' }, 400);
  const ip = req.headers.get('CF-Connecting-IP') || 'x', now = Date.now();
  let w = bugSeen.get(ip); if (!w || now - w.t > 600000) { w = { t: now, n: 0 }; bugSeen.set(ip, w); if (bugSeen.size > 2000) bugSeen.clear(); }
  if (w.n >= 3) return json({ error: 'You\'ve sent a few reports just now. Please wait a few minutes before sending another.' }, 429);
  if (now - bugHour.t > 3600000) bugHour = { t: now, n: 0 };
  if (bugHour.n >= 40) return json({ error: 'A lot of reports came in just now. Please try again in a little while.' }, 429);
  w.n++; bugHour.n++;
  // (no @mentions, links stay plain text in a quote, and the page details go in a small table)
  const clean = (v) => String(v).replace(/@/g, '@​').replace(/\|/g, '/').replace(/[\r\n]+/g, ' ').slice(0, 300);
  const ctx = b.ctx && typeof b.ctx === 'object' && !Array.isArray(b.ctx) ? b.ctx : {};
  const rows = Object.entries(ctx).slice(0, 15).map(([k, v]) => '| ' + clean(k) + ' | ' + (Array.isArray(v) ? v.slice(0, 5).map(clean).join('<br>') : clean(v)) + ' |');
  const first = text.split(/\r?\n/)[0].replace(/\s+/g, ' ').replace(/@/g, '@​');
  const title = '[site] ' + (first.length > 80 ? first.slice(0, 79) + '…' : first);
  const body = text.replace(/@/g, '@​').split(/\r?\n/).map((l) => '> ' + l).join('\n') + '\n\n' + (name ? '**From:** ' + clean(name) + '\n\n' : '') +
    (rows.length ? '| | |\n|---|---|\n' + rows.join('\n') + '\n\n' : '') + '_Sent with the website\'s Report a problem form._';
  try {
    const r = await fetch('https://api.github.com/repos/' + BUG_REPO + '/issues', { method: 'POST', body: JSON.stringify({ title, body }),
      headers: { Authorization: 'Bearer ' + env.GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'debrief-site', 'Content-Type': 'application/json' } });
    if (!r.ok) return json({ error: 'The report couldn\'t be sent right now (GitHub answered ' + r.status + ').' }, 502);
    const j = await r.json().catch(() => ({}));
    return json({ ok: true, n: j.number || null });
  } catch (err) { return json({ error: 'The report couldn\'t be sent right now. Please try again in a minute.' }, 502); }
}
// (the page, with the report form switched on once the GitHub key is set, and Suggest an idea once the Discord bot's is)
const HTML_FLAGS = {};
const appHtml = (env) => { const k = (env.GITHUB_TOKEN ? 'r' : '') + (env.DISCORD_BOT_TOKEN ? 'i' : '');
  return HTML_FLAGS[k] || (HTML_FLAGS[k] = APP_HTML.replace('window.WLA_HOSTED = true;', 'window.WLA_HOSTED = true;' + (env.GITHUB_TOKEN ? ' window.WLA_REPORT = true;' : '') + (env.DISCORD_BOT_TOKEN ? ' window.WLA_IDEAS = true;' : ''))); };

// (the pull downloads also answer at /api/fightlog: ad blockers' tracking lists block addresses ending in "/api/events",
// which broke the site in a browser with one; /api/events stays for pages and desktop apps still asking there)
ROUTES['/api/fightlog'] = ROUTES['/api/events'];

// The Discord bot ("Debrief", in the Debrief server). Needs the DISCORD_BOT_TOKEN secret (the bot's key, with the
// Message Content intent on) and DEBRIEF_KV. Every 10 minutes (the cron):
// - each new #bug-reports post becomes an issue on the project's GitHub (the same list Report a problem fills), gets the
//   Working on it tag, a short "got it" reply, an area tag when it only had Website, and a question when it has no pull;
// - when that issue is closed, the post gets Fixed (or Can't reproduce) and a reply saying so;
// - once a day (9 am Central) a summary goes to #moderator-only: new bugs and ideas, unanswered questions, look-alikes.
// "Suggest an idea" on the site (/api/idea) opens a post in #suggestions.
const GUILD = '1561476082643771394', FORUM_BUGS = '1561538061366599782', FORUM_IDEAS = '1561481557959643156', FORUM_QS = '1561477989919891588';
const snowAt = (id) => Number((BigInt(id) >> 22n) + 1420070400000n);
async function dc(env, path, opt = {}, tries = 0) {
  const r = await fetch('https://discord.com/api/v10' + path, { method: opt.method || 'GET', body: opt.body ? JSON.stringify(opt.body) : undefined,
    headers: { Authorization: 'Bot ' + env.DISCORD_BOT_TOKEN, 'Content-Type': 'application/json', 'User-Agent': 'DiscordBot (' + SITE + ', 1)' } });
  if (r.status === 429 && tries < 3) { const j = await r.json().catch(() => ({})); await new Promise((ok) => setTimeout(ok, Math.min(5000, (j.retry_after || 1) * 1000))); return dc(env, path, opt, tries + 1); }
  if (!r.ok) throw new Error('Discord answered ' + r.status + ' on ' + path);
  return r.status === 204 ? null : r.json();
}
async function gh(env, path, opt = {}) {
  const r = await fetch('https://api.github.com/repos/' + BUG_REPO + path, { method: opt.method || 'GET', body: opt.body ? JSON.stringify(opt.body) : undefined,
    headers: { Authorization: 'Bearer ' + env.GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'debrief-site', 'Content-Type': 'application/json' } });
  if (!r.ok) throw new Error('GitHub answered ' + r.status + ' on ' + path);
  return r.json();
}
const say = (env, ch, content) => dc(env, '/channels/' + ch + '/messages', { method: 'POST', body: { content, allowed_mentions: { parse: [] } } });
const tagOf = (tags, name) => { const t = (tags || []).find((x) => x.name.toLowerCase() === name.toLowerCase()); return t ? t.id : null; };
// (which part of the site a post is about, from its words: for the tag and the GitHub label)
const AREAS = [['Assignments', /\b(nsrt|notes?|assignments?|assigned)\b/i], ['Rotation', /\b(rotation|talents?|opener|priority|burst window)\b/i],
  ['Graphs', /\b(graphs?|charts?|meters?|dps|hps)\b/i], ['Teams', /\b(team|guild|rankings?|my page|character|roster|raid nights?)\b/i],
  ['Mechanics', /\b(soaks?|maps?|mechanics?|debriefing|wipe|deaths?|kicks?|interrupts?|avoidable|frontal|nymrissa|kith'?ix|ula'?tek|vashnik|nek'?zali|explorers|sszorak|guillotine|coiled altar|twin fangs|sentinels)\b/i]];
const areasIn = (s) => AREAS.filter(([, re]) => re.test(s)).map(([a]) => a);
async function runBugs(env) {
  let st = await env.DEBRIEF_KV.get('dc-bugs', 'json'), dirty = false;
  const act = await dc(env, '/guilds/' + GUILD + '/threads/active'), all = act.threads || [];
  const posts = all.filter((t) => t.parent_id === FORUM_BUGS && !(t.flags & 2)); // (not the pinned how-to)
  if (!st) { st = { t: {}, open: [], fixed: [] }; for (const t of posts) st.t[t.id] = 0; await env.DEBRIEF_KV.put('dc-bugs', JSON.stringify(st)); return all; } // (first run: posts from before the bot stay as they are)
  const forum = await dc(env, '/channels/' + FORUM_BUGS), tags = forum.available_tags || [], working = tagOf(tags, 'Working on it');
  for (const t of posts.filter((x) => !(x.id in st.t)).slice(0, 5)) {
    st.t[t.id] = 0; dirty = true;
    const m = await dc(env, '/channels/' + t.id + '/messages/' + t.id).catch(() => null), text = (m && m.content) || '';
    const files = ((m && m.attachments) || []).map((a) => a.url), tagNames = (t.applied_tags || []).map((id) => (tags.find((x) => x.id === id) || {}).name).filter(Boolean);
    const areas = areasIn(t.name + ' ' + text), who = m && m.author ? (m.author.global_name || m.author.username) : 'someone';
    const body = text.replace(/@/g, '@​').split(/\r?\n/).map((l) => '> ' + l).join('\n') + '\n\n**From:** ' + who.replace(/@/g, '@​') + ' on Discord' +
      (tagNames.length ? '\n**Tags:** ' + tagNames.join(', ') : '') + (files.length ? '\n**Pictures:**\n' + files.map((u) => '- ' + u).join('\n') : '') +
      '\n\nhttps://discord.com/channels/' + GUILD + '/' + t.id + '\n\n_Copied from #bug-reports by the Debrief bot. Closing this issue tells the post it\'s fixed._';
    const issue = await gh(env, '/issues', { method: 'POST', body: { title: '[discord] ' + t.name.slice(0, 90), body, labels: ['bug', 'discord', ...areas.map((a) => a.toLowerCase())] } });
    st.t[t.id] = issue.number; st.open.push([t.id, issue.number]);
    // (tags: Working on it, plus the area its words point to when they only picked Website)
    const keep = new Set(t.applied_tags || []); if (working) keep.add(working);
    const onlySite = tagNames.every((n) => ['website', 'working on it'].includes(n.toLowerCase()));
    if (onlySite && areas.length) { const a = tagOf(tags, areas[0]); if (a) keep.add(a); }
    await dc(env, '/channels/' + t.id, { method: 'PATCH', body: { applied_tags: [...keep].slice(0, 5) } }).catch(() => {});
    const noPull = !/https?:\/\/|pull\s*#?\d+|\bp\d+\b/i.test(text) && !files.length;
    await say(env, t.id, 'Thanks, got it! This is on our list now, and we\'ll post here when it\'s fixed.' +
      (noPull ? '\nTo help us find it fast: which pull was it? Paste the Debrief or Warcraft Logs link, or say the boss and pull number. A screenshot helps too.' : ''));
  }
  // (closed on GitHub: Fixed, or Can't reproduce when it was closed as not planned)
  const still = [];
  for (const [tid, n] of st.open) {
    const is = await gh(env, '/issues/' + n).catch(() => null);
    if (!is || is.state !== 'closed') { still.push([tid, n]); continue; }
    dirty = true; const nope = is.state_reason === 'not_planned';
    const th = await dc(env, '/channels/' + tid).catch(() => null); if (!th) continue;
    const keep = new Set((th.applied_tags || []).filter((id) => id !== working)), done = tagOf(tags, nope ? 'Can\'t reproduce' : 'Fixed'); if (done) keep.add(done);
    await dc(env, '/channels/' + tid, { method: 'PATCH', body: { archived: false, applied_tags: [...keep].slice(0, 5) } }).catch(() => {});
    await say(env, tid, nope ? 'We couldn\'t make this happen on our side, so we\'re closing it for now. If it happens again, reply here with the pull link and we\'ll look again.'
      : 'Fixed! It\'s in the latest update. Thanks for reporting it. See what changed: <' + SITE + '/?patchnotes>').catch(() => {});
    st.fixed = [...(st.fixed || []), [tid, Date.now(), nope ? 0 : 1]].slice(-50);
  }
  if (st.open.length !== still.length) st.open = still;
  if (dirty) await env.DEBRIEF_KV.put('dc-bugs', JSON.stringify(st));
  return all;
}
// (two titles that share most of their words: maybe the same bug)
const words = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(' ').filter((w) => w.length > 2 && !/^(the|and|for|not|but|with|when|was|are|isn't|doesn't|on|in|it|my|of)$/.test(w)));
const alike = (a, b) => { const x = words(a), y = words(b); if (!x.size || !y.size) return 0; let n = 0; for (const w of x) if (y.has(w)) n++; return n / Math.min(x.size, y.size); };
async function runDigest(env, now, all) {
  const d = new Date(now), day = d.toISOString().slice(0, 10);
  if (d.getUTCHours() !== 14 || (await env.DEBRIEF_KV.get('dc-digest')) === day) return;
  await env.DEBRIEF_KV.put('dc-digest', day);
  const chans = await dc(env, '/guilds/' + GUILD + '/channels'), mod = chans.find((c) => c.name === 'moderator-only'); if (!mod) return;
  const since = now - 864e5, link = (t) => '<#' + t.id + '>';
  const bugs = all.filter((t) => t.parent_id === FORUM_BUGS && !(t.flags & 2)), ideas = all.filter((t) => t.parent_id === FORUM_IDEAS && !(t.flags & 2));
  const newBugs = bugs.filter((t) => snowAt(t.id) > since), newIdeas = ideas.filter((t) => snowAt(t.id) > since);
  const quiet = all.filter((t) => t.parent_id === FORUM_QS && !(t.flags & 2) && !t.message_count && snowAt(t.id) < now - 36e5);
  const st = (await env.DEBRIEF_KV.get('dc-bugs', 'json')) || { open: [], fixed: [] };
  const fixed = (st.fixed || []).filter(([, at]) => at > since);
  const pairs = []; for (let i = 0; i < bugs.length; i++) for (let j = i + 1; j < bugs.length; j++) if (alike(bugs[i].name, bugs[j].name) >= 0.6) pairs.push(link(bugs[i]) + ' and ' + link(bugs[j]));
  const sec = (h, a) => (a.length ? '\n**' + h + '**\n' + a.slice(0, 10).map((x) => '• ' + x).join('\n') + (a.length > 10 ? '\n• and ' + (a.length - 10) + ' more' : '') : '');
  let msg = '**Good morning! Here\'s the last day on the Discord.**' +
    sec('New bug reports (' + newBugs.length + ')', newBugs.map(link)) + sec('New ideas (' + newIdeas.length + ')', newIdeas.map((t) => link(t) + (t.message_count ? ' · ' + t.message_count + ' replies' : ''))) +
    sec('Questions nobody has answered yet', quiet.map(link)) + sec('Maybe the same bug', pairs) + sec('Closed since yesterday', fixed.map(([tid, , ok]) => '<#' + tid + '>' + (ok ? ' (fixed)' : ' (couldn\'t reproduce)'))) +
    '\nBugs still open: **' + (st.open || []).length + '**';
  if (!newBugs.length && !newIdeas.length && !quiet.length && !fixed.length) msg = '**Good morning!** A quiet day: no new bugs, ideas or unanswered questions. Bugs still open: **' + (st.open || []).length + '**';
  await say(env, mod.id, msg.slice(0, 1990));
}
async function discordJobs(env, now) {
  if (!env.DISCORD_BOT_TOKEN || !env.DEBRIEF_KV || !env.GITHUB_TOKEN) return;
  const all = await runBugs(env);
  await runDigest(env, now, all);
}
// "Suggest an idea" (the site's form): a new post in #suggestions, under the area picked. Same limits as Report a problem.
async function fileIdea(req, env, url) {
  if (!env.DISCORD_BOT_TOKEN) return json({ error: 'Ideas aren\'t switched on yet.' }, 503);
  if (req.headers.get('Origin') !== url.origin) return json({ error: 'Ideas can only be sent from the Debrief website.' }, 403);
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'That idea was empty.' }, 400); }
  if (!b || typeof b !== 'object') return json({ error: 'That idea was empty.' }, 400);
  if (b.website) return json({ ok: true });
  const text = String(b.text || '').trim().slice(0, 1800), name = String(b.name || '').trim().slice(0, 60), area = String(b.area || '').slice(0, 30);
  if (text.length < 10) return json({ error: 'Please say a little more about your idea.' }, 400);
  const ip = req.headers.get('CF-Connecting-IP') || 'x', now = Date.now();
  let w = bugSeen.get('i' + ip); if (!w || now - w.t > 600000) { w = { t: now, n: 0 }; bugSeen.set('i' + ip, w); }
  if (w.n >= 3) return json({ error: 'You\'ve sent a few ideas just now. Please wait a few minutes before sending another.' }, 429);
  if (now - bugHour.t > 3600000) bugHour = { t: now, n: 0 };
  if (bugHour.n >= 40) return json({ error: 'A lot came in just now. Please try again in a little while.' }, 429);
  w.n++; bugHour.n++;
  try {
    const forum = await dc(env, '/channels/' + FORUM_IDEAS), tags = forum.available_tags || [];
    const tag = tagOf(tags, area) || tagOf(tags, 'Website') || (tags[0] && tags[0].id);
    const first = text.split(/\r?\n/)[0].replace(/\s+/g, ' ');
    const t = await dc(env, '/channels/' + FORUM_IDEAS + '/threads', { method: 'POST', body: { name: first.length > 90 ? first.slice(0, 89) + '…' : first, applied_tags: tag ? [tag] : [],
      message: { content: text + '\n\n*Sent from the website' + (name ? ' by ' + name.replace(/[@*_`~|]/g, '') : '') + '. React with 👍 if you want it too.*', allowed_mentions: { parse: [] } } } });
    return json({ ok: true, url: 'https://discord.com/channels/' + GUILD + '/' + t.id });
  } catch (err) { return json({ error: 'The idea couldn\'t be sent right now. Please try again in a minute.' }, 502); }
}

// Patch notes to Discord: every 10 minutes (the cron in wrangler.toml), when the site's newest Patch notes day hasn't
// been announced yet, post one line with @everyone and a link that opens the page. Needs the DISCORD_PATCH_WEBHOOK
// secret (the #patch-notes channel's webhook link) and the DEBRIEF_KV store, which remembers the last day announced.
// One post a day at most: lines added later the same day go on the page quietly.
const SITE = 'https://debrief.james-m-nemecek.workers.dev';
function newestNotes() {
  const i = APP_HTML.indexOf('const PATCH_NOTES = ['); if (i < 0) return null;
  const m = /\{ d: '(\d{4}-\d\d-\d\d)'(?:, t: '((?:[^'\\]|\\.)*)')?/.exec(APP_HTML.slice(i, i + 4000));
  return m ? { d: m[1], t: m[2] ? m[2].replace(/\\'/g, "'") : '' } : null;
}
async function announcePatch(env) {
  if (!env.DISCORD_PATCH_WEBHOOK || !env.DEBRIEF_KV) return;
  const p = newestNotes(); if (!p) return;
  const last = await env.DEBRIEF_KV.get('patch-announced'); if (last && last >= p.d) return;
  const day = new Date(p.d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const content = '@everyone New patch notes on Debrief for ' + day + (p.t ? ': **' + p.t + '**' : '') + '. See what\'s new and what we fixed: ' + SITE + '/?patchnotes';
  const r = await fetch(env.DISCORD_PATCH_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, username: 'Debrief', allowed_mentions: { parse: ['everyone'] } }) });
  if (r.ok) await env.DEBRIEF_KV.put('patch-announced', p.d);
}

export default {
  async scheduled(ev, env, ctx) { ctx.waitUntil(Promise.allSettled([announcePatch(env), discordJobs(env, ev.scheduledTime || Date.now())]).then((r) => r.forEach((x) => { if (x.status === 'rejected') console.warn('Cron:', x.reason && x.reason.message); }))); },
  async fetch(req, env, ctx) {
    const url = new URL(req.url), route = ROUTES[url.pathname];
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/api/idea') return req.method === 'POST' ? fileIdea(req, env, url) : json({ error: 'Send ideas with the website\'s form.' }, 405);
    if (url.pathname === '/api/bug') return req.method === 'POST' ? fileBug(req, env, url) : json({ error: 'Send reports with the website\'s form.' }, 405);
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
        const out = route.run ? await route.run(env, v) : route.out(route.text ? await gqlText(env, route.q(), v) : await gql(env, route.q(), v), v);
        if (out && out.error) return json({ error: out.error }, out.status || 400);
        const res = json(out, 200, age);
        ctx.waitUntil(cache.put(key, res.clone()));
        return res;
      } catch (err) {
        return json({ error: String(err && err.message || err) }, 502);
      }
    }
    return new Response(appHtml(env), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
  },
};
