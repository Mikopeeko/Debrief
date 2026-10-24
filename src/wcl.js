(function (root) {
'use strict';
// Warcraft Logs reports: fetched through the local helper (server.ps1), then translated into
// combat-log lines in the retail V22 layout so the normal analysis engine can read them.
const BASE = Date.UTC(2026, 0, 1);
const WCL_DIFF = { 1: 17, 3: 14, 4: 15, 5: 16, 10: 8 }; // Warcraft Logs difficulty -> in-game difficulty ID

function parseLink(s) {
  s = String(s || '').trim();
  const m = s.match(/reports\/([A-Za-z0-9]{8,32})/) || s.match(/^([A-Za-z0-9]{12,32})$/);
  if (!m) return null;
  const f = s.match(/[#&?]fight=(\d+)/);
  return { code: m[1], fight: f ? +f[1] : null };
}

// Hosted (the Cloudflare Worker holds the API key): plain GET endpoints, no credentials in the browser. The desktop app
// isn't served by the site, so it sets WLA_API to the site's address and asks there.
const HOSTED = typeof window !== 'undefined' && !!window.WLA_HOSTED;
const API_BASE = (typeof window !== 'undefined' && window.WLA_API) || '';
// A dropped connection, a reply cut off halfway, or the site being busy (5xx, 429) is tried again, up to 4 tries. The
// retries skip the browser's own saved copy (cache: 'reload'): a broken copy kept by one browser (it happened in Chrome
// while Edge was fine) would otherwise fail the same way every time. The message keeps the browser's own reason.
const TRIES = 4, wait = (i) => new Promise((res) => setTimeout(res, 1000 * (i + 1)));
async function api(path) {
  let last = null;
  for (let i = 0; i < TRIES; i++) {
    let r = null, j, read = false;
    try { r = await fetch(API_BASE + path, i ? { cache: 'reload' } : undefined); read = true; j = await r.json(); }
    catch (e) { const why = String((e && e.message) || e).slice(0, 80);
      last = r && !r.ok ? new Error('The server answered ' + r.status + ' (tried ' + TRIES + ' times). Click the pull again in a minute.')
        : new Error((read ? 'The download from the Debrief site was cut off' : 'Couldn\'t reach the Debrief site') + ' (tried ' + TRIES + ' times: ' + why + '). Check your connection, then click the pull again.' + (read ? '' : ' If you use an ad blocker or privacy extension, allow this site in it.'));
      await wait(i); continue; }
    if (r.ok && !j.error) { try { window.dispatchEvent(new Event('wla-wcl-up')); } catch (e) { /* not a page */ } return j; }
    last = new Error(j.error || ('The server answered ' + r.status));
    // (Warcraft Logs out of service (Oct 21): no point trying again in a second; the page shows a bar saying so)
    if (j.down || /^Warcraft Logs is down/.test(String(j.error || ''))) { last.down = true; try { window.dispatchEvent(new Event('wla-wcl-down')); } catch (e) { /* not a page */ } throw last; }
    if (!(r.status >= 500 || r.status === 429)) throw last;
    // (too many requests at once: the site counts a minute at a time, so a quick retry would only be refused again)
    await (r.status === 429 ? new Promise((res) => setTimeout(res, 10000 * (i + 1))) : wait(i));
  }
  throw last;
}
// The site passes Warcraft Logs' own reply straight through for the big downloads (events, deaths); older cached answers
// are the events alone. Either way: { data, nextPageTimestamp }.
function evOf(j) {
  if (j && j.errors && j.errors.length) throw new Error(j.errors.map((e) => e.message).join('; '));
  const ev = j && j.data && j.data.reportData ? j.data.reportData.report && j.data.reportData.report.events : j;
  if (!ev) throw new Error('That report was not found or is private.');
  return ev;
}

let token = null, tokenP = null;
function getToken(id, secret) {
  if (token && token.exp > Date.now()) return Promise.resolve(token.v);
  // parallel downloads share one token request
  if (!tokenP) tokenP = newToken(id, secret).finally(() => { tokenP = null; });
  return tokenP;
}
// Network hiccups (connection dropped, timeouts, Warcraft Logs' 5xx) are retried, up to 3 tries.
const flaky = (r, j) => r.status >= 500 && !/\(401\)|\(403\)|invalid_client/i.test(j.error || '');
async function post(url, opts) {
  let r, j;
  for (let i = 0; i < 3; i++) {
    try { r = await fetch(url, opts); j = await r.json().catch(() => ({})); } catch (e) { r = { ok: false, status: 599 }; j = { error: e.message }; }
    if (r.ok || !flaky(r, j)) break;
    await new Promise((res) => setTimeout(res, 800 * (i + 1)));
  }
  return { r, j };
}
async function newToken(id, secret) {
  const { r, j } = await post('/wcl/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, secret }) });
  if (!r.ok || !j.access_token) {
    // only a real rejection is about the ID/secret; anything else is the connection
    if (flaky(r, j)) throw new Error("Couldn't reach Warcraft Logs (tried 3 times). Check your connection and try again." + (j.error ? ' (' + j.error + ')' : ''));
    throw new Error('Warcraft Logs refused the client ID or secret' + (j.error ? ': ' + j.error : '.'));
  }
  token = { v: j.access_token, exp: Date.now() + Math.max(60, (j.expires_in || 3600) - 120) * 1000 };
  return token.v;
}
async function gql(creds, query, variables) {
  const t = await getToken(creds.id, creds.secret);
  const { r, j } = await post('/wcl/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ query, variables }) });
  if (!r.ok) throw new Error('Warcraft Logs request failed' + (j.error ? ': ' + j.error : ' (' + r.status + ').'));
  if (j.errors && j.errors.length) throw new Error(j.errors.map((e) => e.message).join('; '));
  return j.data;
}

const REPORT_Q = `query($code:String!){reportData{report(code:$code){title startTime endTime zone{name}
  fights{id encounterID name difficulty kill startTime endTime size keystoneLevel fightPercentage bossPercentage lastPhase lastPhaseIsIntermission friendlyPlayers}
  masterData{actors{id name type subType server petOwner gameID} abilities{gameID name type}}}}}`;
const EVENTS_Q = `query($code:String!,$fid:[Int]!,$s:Float!,$e:Float!){reportData{report(code:$code){
  events(fightIDs:$fid,startTime:$s,endTime:$e,limit:10000,includeResources:true){data nextPageTimestamp}}}}`;

// Parses for one fight (Warcraft Logs ranks kills only): name -> { pct, amount }, for damage ('dps') or healing ('hps').
const RANK_Q = `query($code:String!,$fid:[Int]!,$m:ReportRankingMetricType){reportData{report(code:$code){rankings(fightIDs:$fid,playerMetric:$m)}}}`;
async function loadRankings(creds, item, metric) {
  const w = item && item.wcl; if (!w || !item.kill) return new Map();
  let j;
  if (HOSTED) j = await api('/api/rankings?code=' + encodeURIComponent(w.code) + '&fight=' + w.fight + '&m=' + metric);
  else { const d = await gql(creds, RANK_Q, { code: w.code, fid: [w.fight], m: metric }); j = d && d.reportData && d.reportData.report && d.reportData.report.rankings; }
  const data = ((typeof j === 'string' ? JSON.parse(j) : j) || {}).data || [], out = new Map();
  for (const f of data) for (const role of Object.values(f.roles || {})) for (const c of role.characters || []) if (c && c.name && c.rankPercent != null) out.set(c.name, { pct: c.rankPercent, amount: c.amount });
  return out;
}

// The top players of one spec on one boss (Warcraft Logs' rankings, damage or healing), and each one's spells: their
// share, hits, crits and casts. For the player card's comparison on Graphs (plain numbers, no advice). The site keeps the
// answer a day. v: { e: encounter, c: class, s: spec (Warcraft Logs' names, no spaces), d: difficulty, m: 'dps' | 'hps', n }
const TOPRANK_Q = `query($e:Int!,$c:String!,$s:String!,$d:Int!,$m:CharacterRankingMetricType){worldData{encounter(id:$e){characterRankings(className:$c,specName:$s,difficulty:$d,metric:$m,page:1)}}}`;
const TOPAB_Q = `query($c:String!,$f:[Int]!,$x:String,$t:TableDataType){reportData{report(code:$c){fights(fightIDs:$f){startTime endTime}
  d:table(fightIDs:$f,dataType:$t,viewBy:Ability,filterExpression:$x) k:table(fightIDs:$f,dataType:Casts,viewBy:Ability,filterExpression:$x)}}}`;
// <topspec> (the Worker runs this same function: build.ps1 copies it there)
async function topSpecOf(run, v) {
  const P = (x) => (typeof x === 'string' ? JSON.parse(x) : x);
  const rk = await run(TOPRANK_Q, { e: v.e, c: v.c, s: v.s, d: v.d, m: v.m }), R = P(rk && rk.worldData && rk.worldData.encounter && rk.worldData.encounter.characterRankings);
  const top = ((R && R.rankings) || []).slice(0, v.n || 3); if (!top.length) return { n: 0, who: [], ab: [] };
  const one = async (t) => { const nm = String(t.name).replace(/'/g, "\\'");
    const d = await run(TOPAB_Q, { c: t.report.code, f: [t.report.fightID], x: "source.name = '" + nm + "' or source.owner.name = '" + nm + "'", t: v.m === 'hps' ? 'Healing' : 'DamageDone' });
    const rep = d.reportData.report, f = rep.fights[0], dur = Math.max(1, (f.endTime - f.startTime) / 1000), dd = P(rep.d).data.entries || [], kk = P(rep.k).data.entries || [];
    const tot = dd.reduce((s, e) => s + (e.total || 0), 0) || 1, casts = new Map(kk.map((e) => [e.name, e.total || 0]));
    return { who: { name: t.name, server: t.server ? t.server.name : '', region: t.server ? t.server.region : '', amount: Math.round(t.amount), dur: Math.round(dur), code: t.report.code, fight: t.report.fightID },
      ab: dd.map((e) => ({ name: e.name, id: e.guid, share: (e.total || 0) / tot, hits: (e.hitCount || 0) + (e.tickCount || 0), crits: (e.critHitCount || 0) + (e.critTickCount || 0), total: e.total || 0, casts: casts.get(e.name) || 0, dur })) }; };
  const all = (await Promise.all(top.map((t) => one(t).catch(() => null)))).filter(Boolean), got = all.slice(0, 3); // (the top 3 for Graphs; all of them, up to 8, for Compare)
  // (each spell over the players: share and casts a minute averaged (0 for one who didn't use it), crit and average hit over all their hits together)
  const by = new Map();
  for (const g of got) for (const a of g.ab) { let o = by.get(a.name); if (!o) by.set(a.name, o = { name: a.name, id: a.id, share: 0, cpm: 0, hits: 0, crits: 0, total: 0 });
    o.share += a.share / got.length; o.cpm += 60 * a.casts / a.dur / got.length; o.hits += a.hits; o.crits += a.crits; o.total += a.total; }
  return { n: got.length, who: got.map((g) => g.who), ab: [...by.values()].map((o) => ({ name: o.name, id: o.id, share: +o.share.toFixed(4), cpm: +o.cpm.toFixed(2), crit: o.hits ? +(o.crits / o.hits).toFixed(3) : null, avg: o.hits ? Math.round(o.total / o.hits) : null }))
    .sort((a, b) => b.share - a.share).slice(0, 30),
    // (each of them on their own too, for Compare's "against one top raider": their 25 biggest spells, the same numbers)
    per: all.map((g) => ({ name: g.who.name, who: g.who, ab: g.ab.slice().sort((a, b) => b.share - a.share).slice(0, 25).map((a) => ({ name: a.name, id: a.id, share: +a.share.toFixed(4), cpm: +(60 * a.casts / a.dur).toFixed(2),
      crit: a.hits ? +(a.crits / a.hits).toFixed(3) : null, avg: a.hits ? Math.round(a.total / a.hits) : null })) })) };
}
// Kills of one boss, fastest first (Warcraft Logs' speed rankings, 50 a page), with who played what in each and their
// damage (healers: healing) a second, for Compare's "Raids like yours". 20 kills from the page asked for; each kill's
// players come from its own rankings (small: no gear), 5 kills a request. v: { e, d, p: page }
const TOPKILL_Q = `query($e:Int!,$d:Int!,$p:Int){worldData{encounter(id:$e){fightRankings(difficulty:$d,metric:speed,page:$p)}}}`;
async function topKillsOf(run, v) {
  const P = (x) => (typeof x === 'string' ? JSON.parse(x) : x);
  const fr = await run(TOPKILL_Q, { e: v.e, d: v.d, p: v.p || 1 }), R = P(fr && fr.worldData && fr.worldData.encounter && fr.worldData.encounter.fightRankings) || {};
  const all = R.rankings || [], per = all.length, top = all.map((t, i) => ({ t, rank: ((v.p || 1) - 1) * 50 + i + 1 }))
    .filter(({ t }) => t.report && /^[A-Za-z0-9]{8,32}$/.test(t.report.code) && t.report.fightID > 0).slice(0, v.n || 20);
  const chunks = []; for (let i = 0; i < top.length; i += 5) chunks.push(top.slice(i, i + 5));
  const ppl = (d, h) => { const D = ((P(d) || {}).data || [])[0], H = ((P(h) || {}).data || [])[0]; if (!D || !D.roles) return null;
    const hps = new Map(((H && H.roles && H.roles.healers && H.roles.healers.characters) || []).map((c) => [c.name, c.amount]));
    const out = []; for (const [rk, role] of [['tanks', 'tank'], ['healers', 'healer'], ['dps', 'dps']]) for (const c of (D.roles[rk] && D.roles[rk].characters) || [])
      out.push({ n: c.name, c: c.class, s: c.spec, r: role, a: Math.round(role === 'healer' ? hps.get(c.name) || 0 : c.amount || 0) });
    return { ppl: out, guild: D.guild || null, deaths: D.deaths }; };
  const got = await Promise.all(chunks.map(async (ch) => {
    const q = 'query{reportData{' + ch.map(({ t }, i) => { const f = t.report.fightID | 0; return 'k' + i + ':report(code:"' + t.report.code + '"){d:rankings(fightIDs:[' + f + '],playerMetric:dps) h:rankings(fightIDs:[' + f + '],playerMetric:hps)}'; }).join(' ') + '}}';
    let d; try { d = await run(q, {}); } catch (e) { return []; }
    return ch.map(({ t, rank }, i) => { const x = d && d.reportData && d.reportData['k' + i], o = x && ppl(x.d, x.h); if (!o || !o.ppl.length) return null;
      const g = t.guild || o.guild || {}, sv = t.server || g.server || {};
      return { rank, gid: g.id || null, guild: g.name || '', server: sv.name || '', region: sv.region || '', dur: Math.round((t.duration || 0) / 1000), deaths: t.deaths != null ? t.deaths : o.deaths, code: t.report.code, fight: t.report.fightID, at: t.report.startTime || 0, ppl: o.ppl }; }).filter(Boolean);
  }));
  return { page: v.p || 1, more: !!R.hasMorePages, per, kills: got.flat() };
}
// How many pulls and nights a guild needed to kill a boss the first time: its reports of the boss's raid up to a day
// after the kill in the rankings (that kill may be a later, faster one), every pull of the boss on that difficulty, the
// same pull logged by two members counted once (starts within 20 s), and a night as a day (a raid past midnight stays
// one night: days start at 06:00 UTC). v: { g: guild, e, d, t: the ranked kill's report start (ms) }
const GUILDPROG_Q = `query($g:Int!,$z:Int,$e:Int!,$d:Int!,$end:Float,$p:Int!){reportData{reports(guildID:$g,zoneID:$z,endTime:$end,limit:100,page:$p){has_more_pages data{startTime fights(encounterID:$e,difficulty:$d){kill startTime}}}}}`;
const ENCZONE_Q = `query($e:Int!){worldData{encounter(id:$e){zone{id}}}}`;
async function guildProgOf(run, v) {
  const z = await run(ENCZONE_Q, { e: v.e }), zone = z && z.worldData && z.worldData.encounter && z.worldData.encounter.zone ? z.worldData.encounter.zone.id : null;
  const at = [];
  for (let p = 1; p <= 4; p++) {
    const d = await run(GUILDPROG_Q, { g: v.g, z: zone, e: v.e, d: v.d, end: v.t + 86400000, p }), R = d && d.reportData && d.reportData.reports; if (!R) break;
    for (const rep of R.data || []) for (const f of rep.fights || []) at.push({ t: rep.startTime + f.startTime, kill: !!f.kill });
    if (!R.has_more_pages) break;
  }
  at.sort((a, b) => a.t - b.t);
  const pulls = []; for (const x of at) { const l = pulls[pulls.length - 1]; if (l && x.t - l.t < 20000) { l.kill = l.kill || x.kill; continue; } pulls.push({ ...x }); }
  const k = pulls.findIndex((x) => x.kill); if (k < 0) return { pulls: pulls.length, nights: null, kill: null };
  const days = new Set(pulls.slice(0, k + 1).map((x) => Math.floor((x.t - 21600000) / 86400000)));
  return { pulls: k + 1, nights: days.size, kill: pulls[k].t, first: pulls[0].t };
}
// One page (100) of a spec's rankings on a boss, slimmed for Compare's "Search for a player": who, where, their kill, and
// their talents (only the numbers, so the page can tell their hero tree). v: { e, c, s, d, m, p }
const SPECRANK_Q = `query($e:Int!,$c:String!,$s:String!,$d:Int!,$m:CharacterRankingMetricType,$p:Int){worldData{encounter(id:$e){characterRankings(className:$c,specName:$s,difficulty:$d,metric:$m,page:$p,includeCombatantInfo:true)}}}`;
async function specRanksOf(run, v) {
  const P = (x) => (typeof x === 'string' ? JSON.parse(x) : x);
  const rk = await run(SPECRANK_Q, { e: v.e, c: v.c, s: v.s, d: v.d, m: v.m, p: v.p || 1 }), R = P(rk && rk.worldData && rk.worldData.encounter && rk.worldData.encounter.characterRankings) || {};
  const list = (R.rankings || []).filter((t) => t && t.name && t.report && t.report.code).map((t, i) => ({ rank: ((v.p || 1) - 1) * 100 + i + 1, name: t.name, server: t.server ? t.server.name : '', region: t.server ? t.server.region : '',
    guild: t.guild ? t.guild.name : '', amount: Math.round(t.amount || 0), code: t.report.code, fight: t.report.fightID, tal: (t.talents || []).map((x) => x.talentID).filter(Boolean) }));
  return { page: v.p || 1, more: !!R.hasMorePages, list };
}
// One ranked player's spells on their kill, for Compare's "Top 100 average" (the page reads a few players spread through
// the group and averages them): each spell's total and casts, and the fight's length. v: { c: report code, f: fight, n: name, m }
async function playerAbOf(run, v) {
  const P = (x) => (typeof x === 'string' ? JSON.parse(x) : x), nm = String(v.n).replace(/'/g, "\\'");
  const d = await run(TOPAB_Q, { c: v.c, f: [v.f], x: "source.name = '" + nm + "' or source.owner.name = '" + nm + "'", t: v.m === 'hps' ? 'Healing' : 'DamageDone' });
  const rep = d.reportData.report, f = rep.fights[0], dd = P(rep.d).data.entries || [], kk = P(rep.k).data.entries || [], casts = new Map(kk.map((e) => [e.name, e.total || 0]));
  return { dur: Math.round(Math.max(1, (f.endTime - f.startTime) / 1000)), ab: dd.map((e) => ({ name: e.name, id: e.guid, total: e.total || 0, casts: casts.get(e.name) || 0 })),
    cast: kk.map((e) => ({ name: e.name, id: e.guid, n: e.total || 0 })) }; // (every spell they cast, cooldowns too, for casts a minute and cooldown uses)
}
// </topspec>
async function topSpec(creds, v) {
  if (HOSTED) return api('/api/topspec?e=' + v.e + '&c=' + encodeURIComponent(v.c) + '&s=' + encodeURIComponent(v.s) + '&d=' + v.d + '&m=' + v.m + '&v=4'); // (v=4: the top 8, each with their own spells and their kill's report and fight)
  return topSpecOf((q, vars) => gql(creds, q, vars), v);
}
async function topKills(creds, v) {
  if (HOSTED) return api('/api/topkills?e=' + v.e + '&d=' + v.d + '&p=' + v.p + '&v=2'); // (v=2: answers with each guild's number)
  return topKillsOf((q, vars) => gql(creds, q, vars), v);
}
async function specRanks(creds, v) {
  if (HOSTED) return api('/api/specrank?e=' + v.e + '&c=' + encodeURIComponent(v.c) + '&s=' + encodeURIComponent(v.s) + '&d=' + v.d + '&m=' + v.m + '&p=' + v.p);
  return specRanksOf((q, vars) => gql(creds, q, vars), v);
}
async function playerAb(creds, v) {
  if (HOSTED) return api('/api/plab?c=' + v.c + '&f=' + v.f + '&n=' + encodeURIComponent(v.n) + '&m=' + v.m + '&v=2'); // (v=2: with every spell they cast)
  return playerAbOf((q, vars) => gql(creds, q, vars), v);
}
async function guildProg(creds, v) {
  if (HOSTED) return api('/api/guildprog?g=' + v.g + '&e=' + v.e + '&d=' + v.d + '&t=' + v.t);
  return guildProgOf((q, vars) => gql(creds, q, vars), v);
}

// (other guilds' pulls on a boss for the pace chart, kept up to date by the site (Oct 23); the desktop app has the built-in snapshot only)
async function paceRecs(v) { if (!HOSTED) return null; return api('/api/pace?e=' + v.e + '&d=' + v.d); }
async function curveRecs(v) { if (!HOSTED) return null; return api('/api/curves?e=' + v.e + '&d=' + v.d); } /* (the top kills' curves for the two-line charts (Oct 23)) */
async function rateRecs(v) { if (!HOSTED) return null; return api('/api/rates?e=' + v.e + '&d=' + v.d); }

async function loadReport(creds, code, live) {
  let rep;
  if (HOSTED) rep = await api('/api/report?code=' + encodeURIComponent(code) + (live ? '&live=1' : '')); // (live: the site keeps it 20 seconds, not 2 minutes)
  else { const d = await gql(creds, REPORT_Q, { code }); rep = d && d.reportData && d.reportData.report; }
  if (!rep) throw new Error('Report ' + code + ' was not found or is private.');
  const actors = new Map(rep.masterData.actors.map((a) => [a.id, a]));
  const abilities = new Map(rep.masterData.abilities.map((a) => [a.gameID, a]));
  const pulls = {};
  // (raids only: a Mythic+ key or any 5-player dungeon boss is left out)
  const dungeon = (f) => !!f.keystoneLevel || f.difficulty === 10 || (f.size > 0 && f.size <= 5);
  const dungeons = rep.fights.filter((f) => f.encounterID > 0 && dungeon(f)).length;
  const bosses = rep.fights.filter((f) => f.encounterID > 0 && !dungeon(f)).map((f) => {
    const diffId = WCL_DIFF[f.difficulty] || f.difficulty;
    const k = f.encounterID + ':' + diffId; pulls[k] = (pulls[k] || 0) + 1;
    return { kind: 'boss', id: f.encounterID, boss: f.name, diffId, diff: f.keystoneLevel ? '+' + f.keystoneLevel : ({ 14: 'Normal', 15: 'Heroic', 16: 'Mythic', 17: 'LFR', 8: 'Mythic+' }[diffId] || 'Difficulty ' + diffId),
      size: f.size || 20, startMs: BASE + f.startTime, kill: !!f.kill, endPct: f.kill ? 0 : (f.fightPercentage != null ? f.fightPercentage : null), result: f.kill ? 'Kill' : 'Wipe', duration: (f.endTime - f.startTime) / 1000,
      // (the phase it ended in, as the app names them: Warcraft Logs counts stages and intermissions apart, so its "phase 3"
      // is Stage Three, and that phase's boss health: the app's whole-encounter progress needs both)
      endPhase: f.kill || !f.lastPhase ? null : f.lastPhaseIsIntermission ? 'Intermission' : 'P' + f.lastPhase, endBoss: f.kill ? 0 : f.bossPercentage != null ? f.bossPercentage : null,
      // (roster: the pull's players before it's opened, so a new note can be matched to every pull of the night)
      roster: (f.friendlyPlayers || []).map((i) => (actors.get(i) || {}).name).filter(Boolean),
      pull: pulls[k], run: null, wallMs: rep.startTime + f.startTime, wcl: { code, fight: f.id, start: f.startTime, end: f.endTime, actors, abilities, encounterID: f.encounterID, rawDiff: diffId } };
  });
  // (endMs: the time of the report's last event, which keeps moving while someone live logs it)
  return { title: rep.title, zone: rep.zone && rep.zone.name, bosses, runs: [], dungeons, endMs: rep.endTime || null };
}

// ---------- a team's reports: every raid night as short pull summaries (saved progress), no event downloads ----------
// A Warcraft Logs team or guild page link ("…/guild/id/772787" or "…/guild/us/zuljin/Wolfthorn") names the team; its
// reports are listed 100 a page; a night's pulls come from its fight list (result, how far, length, roster) plus one
// deaths query for the whole report. (Hosted: the site has a route for each of these queries.)
const TEAM_INFO_Q = `query($id:Int,$name:String,$srv:String,$reg:String){guildData{guild(id:$id,name:$name,serverSlug:$srv,serverRegion:$reg){id name type faction{name} server{name slug region{slug}}}}}`;
const TEAM_REPORTS_Q = `query($id:Int!,$page:Int!){reportData{reports(guildID:$id,limit:100,page:$page){last_page data{code title startTime endTime zone{id name} guildTag{name}}}}}`;
const NIGHT_Q = `query($code:String!){reportData{report(code:$code){title startTime endTime
  fights(killType:Encounters){id encounterID name difficulty kill startTime endTime size fightPercentage bossPercentage lastPhase lastPhaseIsIntermission friendlyPlayers}
  masterData{actors(type:"Player"){id name subType server}}}}}`;
const DEATHS_Q = `query($code:String!,$s:Float!,$e:Float!){reportData{report(code:$code){events(startTime:$s,endTime:$e,dataType:Deaths,limit:10000){data nextPageTimestamp}}}}`;
const DIFF_NAME = { 14: 'Normal', 15: 'Heroic', 16: 'Mythic', 17: 'LFR' };
function parseTeamLink(s) {
  s = String(s || '').trim();
  let m = s.match(/guild\/id\/(\d+)/) || s.match(/^(\d{3,10})$/); if (m) return { id: +m[1] };
  m = s.match(/guild\/([a-z]{2})\/([^/?#]+)\/([^/?#]+)/i); if (m) return { reg: m[1].toUpperCase(), srv: decodeURIComponent(m[2]), name: decodeURIComponent(m[3]) };
  return null;
}
const enc = encodeURIComponent;
async function teamInfo(creds, link) {
  let g;
  if (HOSTED) g = await api('/api/team?' + (link.id ? 'id=' + link.id : 'name=' + enc(link.name) + '&srv=' + enc(link.srv) + '&reg=' + enc(link.reg)));
  else { const d = await gql(creds, TEAM_INFO_Q, link.id ? { id: link.id } : { name: link.name, srv: link.srv, reg: link.reg }); g = d && d.guildData && d.guildData.guild; }
  if (!g) throw new Error('Warcraft Logs has no team or guild at that link.');
  return { id: g.id, name: g.name, team: g.type === 1, faction: (g.faction && g.faction.name) || null, server: g.server ? g.server.name + (g.server.region ? ' (' + g.server.region.slug.toUpperCase() + ')' : '') : '' };
}
async function teamReports(creds, id) {
  let out = [], page = 1, last = 1;
  do { const rr = HOSTED ? await api('/api/teamreports?id=' + id + '&page=' + page) : (await gql(creds, TEAM_REPORTS_Q, { id, page })).reportData.reports; out = out.concat(rr.data || []); last = rr.last_page || 1; page++; } while (page <= last && page <= 20);
  return out;
}
// ---------- a character's reports: your own progress, every raid you were in (any team, guild or group) ----------
// A Warcraft Logs character link ("…/character/us/zuljin/name" or "…/character/id/83269381") names the character; its
// reports are listed 100 a page, newest first. (Hosted: the site has a route for each.)
const CHAR_INFO_Q = `query($id:Int,$name:String,$srv:String,$reg:String){characterData{character(id:$id,name:$name,serverSlug:$srv,serverRegion:$reg){id name classID guilds{id name} server{name slug region{slug}}}}}`;
const CHAR_REPORTS_Q = `query($id:Int!,$page:Int!){characterData{character(id:$id){recentReports(limit:100,page:$page){last_page data{code title startTime endTime zone{id name} guild{id name}}}}}}`;
// (the newest few reports, for "Live now" on your team's page: the site keeps them 30 seconds, not ten minutes. A few, with
// who uploaded each, because several raiders can log the same night and yours should win)
const TEAM_LATEST_Q = `query($id:Int!){reportData{reports(guildID:$id,limit:5){data{code title startTime endTime zone{id name} owner{id name}}}}}`;
const CHAR_LATEST_Q = `query($id:Int!){characterData{character(id:$id){recentReports(limit:5){data{code title startTime endTime zone{id name} guild{id name} owner{id name}}}}}}`;
async function latestReports(creds, g) {
  const ch = g.kind === 'char', rr = HOSTED ? await api('/api/' + (ch ? 'charlatest' : 'teamlatest') + '?id=' + g.id)
    : ch ? ((await gql(creds, CHAR_LATEST_Q, { id: g.id })).characterData.character || {}).recentReports : (await gql(creds, TEAM_LATEST_Q, { id: g.id })).reportData.reports;
  return (rr && rr.data) || [];
}
function parseCharLink(s) {
  s = String(s || '').trim();
  let m = s.match(/character\/id\/(\d+)/); if (m) return { id: +m[1] };
  m = s.match(/character\/([a-z]{2})\/([^/?#]+)\/([^/?#]+)/i); if (m) return { reg: m[1].toUpperCase(), srv: decodeURIComponent(m[2]), name: decodeURIComponent(m[3]) };
  return null;
}
async function charInfo(creds, link) {
  let c;
  if (HOSTED) c = await api('/api/char?' + (link.id ? 'id=' + link.id : 'name=' + enc(link.name) + '&srv=' + enc(link.srv) + '&reg=' + enc(link.reg)));
  else { const d = await gql(creds, CHAR_INFO_Q, link.id ? { id: link.id } : { name: link.name, srv: link.srv, reg: link.reg }); c = d && d.characterData && d.characterData.character; }
  if (!c) throw new Error('Warcraft Logs couldn\'t find that character. Check the name and the realm.');
  // (classID: Warcraft Logs' own class number, alphabetical: 1 Death Knight, 2 Druid … 11 Warrior, then 12 Demon Hunter and
  // 13 Evoker; for the card's colour and icon)
  const CLS = [null, 'DEATHKNIGHT', 'DRUID', 'HUNTER', 'MAGE', 'MONK', 'PALADIN', 'PRIEST', 'ROGUE', 'SHAMAN', 'WARLOCK', 'WARRIOR', 'DEMONHUNTER', 'EVOKER'];
  return { id: c.id, name: c.name, cls: CLS[c.classID] || null, guild: (c.guilds && c.guilds[0] && c.guilds[0].name) || null, server: c.server ? c.server.name + (c.server.region ? ' (' + c.server.region.slug.toUpperCase() + ')' : '') : '' };
}
// a character's rankings this tier on one difficulty (Warcraft Logs numbers: 1 LFR, 3 Normal, 4 Heroic, 5 Mythic), for
// damage ('dps') or healing ('hps'), on one spec or their best: { bestPerformanceAverage, medianPerformanceAverage, allStars,
// rankings: [{ encounter: { name }, rankPercent, medianPercent, totalKills, spec, bestAmount, fastestKill }] }
const CHAR_RANK_Q = `query($id:Int!,$d:Int,$m:CharacterPageRankingMetricType,$s:String){characterData{character(id:$id){zoneRankings(difficulty:$d,metric:$m,specName:$s)}}}`;
async function charRankings(creds, id, diff, metric, spec) {
  let j;
  if (HOSTED) j = await api('/api/charrank?id=' + id + '&d=' + diff + '&m=' + metric + (spec ? '&s=' + enc(spec) : ''));
  else { const d = await gql(creds, CHAR_RANK_Q, { id, d: diff, m: metric, s: spec || null }); j = d && d.characterData && d.characterData.character && d.characterData.character.zoneRankings; }
  return (typeof j === 'string' ? JSON.parse(j) : j) || null;
}
// a team's or guild's rankings this tier (Mythic, 20 players): progress (how far, how soon) and speed, each world, region and
// server, with Warcraft Logs' colour for it; and its faction. zone: the tier's zone (53, The Venomous Abyss)
const TEAM_RANK_Q = `query($id:Int!,$z:Int){guildData{guild(id:$id){faction{name} zoneRanking(zoneId:$z){progress(size:20){worldRank{number color} regionRank{number color} serverRank{number color}} speed(size:20){worldRank{number color} regionRank{number color} serverRank{number color}}}}}}`;
async function teamRankings(creds, id, zone) {
  if (HOSTED) return api('/api/teamrank?id=' + id + '&z=' + zone);
  const d = await gql(creds, TEAM_RANK_Q, { id, z: zone }); return (d && d.guildData && d.guildData.guild) || null;
}
// a character's look: Blizzard's own pictures of them (the full-body render from the Armory and a face portrait), at an
// address made from their realm and Blizzard number, both in Warcraft Logs' copy of their Armory profile. Returns the
// part that names them, "us/character/thrall/49/237905457" (RENDER + it + '-main-raw.png' or '-avatar.jpg'), or null.
// (Hosted: the profile is about 1 MB, so the site reads only its start and sends back that one line.)
const CHAR_LOOK_Q = `query($id:Int!){characterData{character(id:$id){gameData}}}`;
const RENDER = 'https://render.worldofwarcraft.com/';
async function charLook(creds, id) {
  if (HOSTED) { const j = await api('/api/charlook?id=' + id); return (j && j.look) || null; }
  const d = await gql(creds, CHAR_LOOK_Q, { id }), gd = d && d.characterData && d.characterData.character && d.characterData.character.gameData;
  const g = gd && (typeof gd === 'string' ? JSON.parse(gd) : gd).global; if (!g || !g.id || !g.realm || !g.realm.slug) return null;
  const reg = ((g._links && g._links.self && g._links.self.href) || '').match(/^https:\/\/(\w+)\.api\.blizzard/);
  return (reg ? reg[1] : 'us') + '/character/' + g.realm.slug + '/' + (g.id % 256) + '/' + g.id;
}
// (newest first: paging stops once a whole page is older than `since`, or after 5 pages, as far back as Warcraft Logs
// lists a character's reports)
async function charReports(creds, id, since) {
  let out = [], page = 1, last = 1;
  do { const rr = HOSTED ? await api('/api/charreports?id=' + id + '&page=' + page) : (await gql(creds, CHAR_REPORTS_Q, { id, page })).characterData.character.recentReports;
    const d = rr.data || []; out = out.concat(d); last = rr.last_page || 1; page++;
    if (since && d.length && d.every((x) => x.endTime < since)) break; } while (page <= last && page <= 5);
  return out;
}
// one night's boss pulls: { at (wall-clock ms), boss, id, diffId, diff, dur, kill, endPct, endBoss, endPhase, players, deaths, first, fight }
async function nightPulls(creds, code) {
  const rep = HOSTED ? await api('/api/night?code=' + enc(code)) : ((d) => d && d.reportData && d.reportData.report)(await gql(creds, NIGHT_Q, { code }));
  if (!rep) throw new Error('Report ' + code + ' was not found or is private.');
  const names = new Map((rep.masterData.actors || []).map((a) => [a.id, a.name]));
  const fights = (rep.fights || []).filter((f) => f.encounterID > 0 && DIFF_NAME[WCL_DIFF[f.difficulty]]);
  if (!fights.length) return { title: rep.title, pulls: [] };
  // (deaths for the whole report in one go, then split by fight: players only, in order)
  const s0 = Math.min(...fights.map((f) => f.startTime)), e0 = Math.max(...fights.map((f) => f.endTime)), deaths = [];
  for (let s = s0; s != null && s < e0;) { const ev = HOSTED ? evOf(await api('/api/deaths?code=' + enc(code) + '&s=' + s + '&e=' + e0)) : (await gql(creds, DEATHS_Q, { code, s, e: e0 })).reportData.report.events; for (const e of ev.data || []) if (e.type === 'death') deaths.push(e); s = ev.nextPageTimestamp; }
  const pulls = fights.map((f) => {
    const mine = new Set(f.friendlyPlayers || []), dd = deaths.filter((e) => e.fight === f.id && mine.has(e.targetID)).sort((a, b) => a.timestamp - b.timestamp), diffId = WCL_DIFF[f.difficulty];
    return { fight: f.id, at: rep.startTime + f.startTime, boss: f.name, id: f.encounterID, diffId, diff: DIFF_NAME[diffId], dur: (f.endTime - f.startTime) / 1000, kill: !!f.kill,
      endPct: f.kill ? 0 : f.fightPercentage != null ? f.fightPercentage : null, endBoss: f.kill ? 0 : f.bossPercentage != null ? f.bossPercentage : null,
      endPhase: f.kill || !f.lastPhase ? null : f.lastPhaseIsIntermission ? 'Intermission' : 'P' + f.lastPhase,
      players: [...mine].map((i) => names.get(i)).filter(Boolean), deaths: dd.length, first: dd.length ? names.get(dd[0].targetID) || null : null };
  });
  // (each player's class, as the game's token like PALADIN or DEATHKNIGHT, and server: for "Which one is you?" on a team)
  const who = {}; for (const a of rep.masterData.actors || []) if (a.name) who[a.name] = [a.subType ? String(a.subType).toUpperCase().replace(/\s+/g, '') : null, a.server || null];
  return { title: rep.title, pulls, who };
}

// ---------- pull downloads: saved on this PC, fetched in parallel time slices ----------
// A finished pull never changes, so its events are kept in IndexedDB and reopen instantly after a refresh.
const DB_NAME = 'wla-pulls', DB_STORE = 'events';
let dbP = null;
function db() {
  if (!dbP) dbP = new Promise((res) => {
    try {
      const rq = indexedDB.open(DB_NAME, 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore(DB_STORE);
      rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null);
    } catch (e) { res(null); }
  });
  return dbP;
}
// Long pulls are saved in parts: the browser refuses any single saved value over ~133 MB, and a 10-minute
// Mythic pull is ~500,000 events (~140 MB). The pull's own key then holds { parts: n } and the events live under
// key#0, key#1, ...
const PART = 100000;
async function dbGet(k) {
  const d = await db(); if (!d) return null;
  const one = (key) => new Promise((res) => { try { const rq = d.transaction(DB_STORE).objectStore(DB_STORE).get(key); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => res(null); } catch (e) { res(null); } });
  const v = await one(k);
  if (!v || Array.isArray(v) || !v.parts) return v;
  const parts = await Promise.all(Array.from({ length: v.parts }, (_, i) => one(k + '#' + i)));
  return parts.every(Array.isArray) ? [].concat(...parts) : null; // a missing part: treat the pull as not saved
}
async function isSaved(item) {
  const d = await db(); if (!d || !item.wcl) return false;
  const k = item.wcl.code + ':' + item.wcl.fight;
  return new Promise((res) => { try { const rq = d.transaction(DB_STORE).objectStore(DB_STORE).count(k); rq.onsuccess = () => res(rq.result > 0); rq.onerror = () => res(false); } catch (e) { res(false); } });
}
async function dbPut(k, v) {
  const d = await db(); if (!d) return;
  try {
    const tx = d.transaction(DB_STORE, 'readwrite'), st = tx.objectStore(DB_STORE);
    if (v.length <= PART) st.put(v, k);
    else { const n = Math.ceil(v.length / PART); for (let i = 0; i < n; i++) st.put(v.slice(i * PART, (i + 1) * PART), k + '#' + i); st.put({ parts: n }, k); }
    tx.onerror = tx.onabort = () => console.warn('Could not save pull ' + k + ' on this PC:', tx.error && tx.error.message);
  } catch (e) { /* storage full or off: just don't save */ }
}

async function fetchSlice(creds, w, s, e, last, onPage) {
  const out = [];
  while (s != null && s < e) {
    let ev;
    // (/api/fightlog, not /api/events: ad blockers block addresses ending in /api/events as tracking)
    if (HOSTED) ev = evOf(await api('/api/fightlog?code=' + encodeURIComponent(w.code) + '&fight=' + w.fight + '&s=' + s + '&e=' + e));
    else { const d = await gql(creds, EVENTS_Q, { code: w.code, fid: [w.fight], s, e }); ev = d.reportData.report.events; }
    const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
    // slice ends overlap by a millisecond; keep each event in exactly one slice
    for (const x of data) if (last || x.timestamp < e) out.push(x);
    s = ev.nextPageTimestamp;
    if (onPage) onPage(data.length);
  }
  return out;
}

const PENDING = new Map(); // one download per pull, shared by the view and the pre-loader
function loadEvents(creds, item, onPage) {
  const w = item.wcl, key = w.code + ':' + w.fight;
  let p = PENDING.get(key);
  if (!p) {
    p = (async () => {
      const saved = await dbGet(key);
      if (saved) return saved;
      // one slice per minute of fight, at most 4 downloading at once
      const n = Math.max(1, Math.min(4, Math.ceil((w.end - w.start) / 60000)));
      const step = (w.end - w.start) / n;
      let got = 0;
      const tick = (k) => { got += k; if (p.onPage) p.onPage(got); };
      const parts = await Promise.all(Array.from({ length: n }, (_, i) => fetchSlice(creds, w, w.start + Math.round(step * i), i === n - 1 ? w.end : w.start + Math.round(step * (i + 1)), i === n - 1, tick)));
      // fight-start events (player gear and talents) only belong at the start of the pull
      const all = parts[0];
      for (const part of parts.slice(1)) for (const x of part) if (x.type !== 'combatantinfo' && x.type !== 'encounterstart') all.push(x);
      dbPut(key, all);
      return all;
    })();
    // (a finished download is let go once it's back: it's saved on this PC by then, and keeping every pull's events in
    // memory (100+ MB for a long Mythic pull) crashed the tab after a few dozen pulls; the analysis keeps what it needs)
    p.then(() => setTimeout(() => { if (PENDING.get(key) === p) PENDING.delete(key); }, 0), () => PENDING.delete(key));
    PENDING.set(key, p);
  }
  if (onPage) p.onPage = onPage;
  return p;
}

// ---------- translation into combat-log lines ----------
const pad = (n, w) => String(n).padStart(w || 2, '0');
function stamp(ms) {
  const d = new Date(BASE + ms);
  return (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + '/' + d.getUTCFullYear() + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + pad(d.getUTCMilliseconds(), 3) + '-0  ';
}
const q = (s) => '"' + String(s).replace(/"/g, "'") + '"';

// (translateSteps writes the lines in steps, stopping every few thousand events: translate runs it straight through and
// joins the lines; translateAsync lets the page breathe (pause) every ~30 ms and hands back the lines, for analyzeAsync)
function translate(item, events) { const g = translateSteps(item, events); let s; do s = g.next(); while (!s.done); return s.value.join('\n'); }
async function translateAsync(item, events, pause) {
  const g = translateSteps(item, events); let t = Date.now();
  for (;;) { const s = g.next(); if (s.done) return s.value; if (Date.now() - t > 30) { await pause(); t = Date.now(); } }
}
function* translateSteps(item, events) {
  const w = item.wcl, actors = w.actors, abil = w.abilities, out = [];
  // Warcraft Logs numbers the copies of an add 1, 2, 3... and gives a new copy the number of one that has died, so two
  // adds can share a number (read on Nek'zali's Restless Amani). A number starts a new life with its first event over a
  // second after its death, so every add keeps a GUID of its own, as in a real log (a corpse brought back is a new life).
  const life = new Map(), dead = new Map(); let curT = 0;
  const lifeOf = (id, inst) => { const k = id + ':' + (inst || 1), d = dead.get(k); if (d != null && curT > d + 1000) { life.set(k, (life.get(k) || 0) + 1); dead.delete(k); } return life.get(k) || 0; };
  const guid = (id, inst) => {
    const a = actors.get(id);
    if (!a || id == null || id < 0) return '0000000000000000';
    if (a.type === 'Player') return 'Player-0-' + id;
    if (a.type === 'Pet') return 'Pet-0-0-0-0-' + (a.gameID || 0) + '-' + id;
    return 'Creature-0-0-0-0-' + (a.gameID || 0) + '-' + id + '-' + ((inst || 1) + 1000 * lifeOf(id, inst));
  };
  const nm = (id) => { const a = actors.get(id); if (!a) return 'nil'; return q(a.type === 'Player' && a.server ? a.name + '-' + a.server : a.name); };
  const flags = (id) => { const a = actors.get(id); return !a ? '0x80000000' : a.type === 'Player' ? '0x512' : a.type === 'Pet' ? '0x1112' : '0xa48'; };
  const mark = (m) => (m > 0 && m <= 8 ? '0x' + (1 << (m - 1)).toString(16) : '0x0');
  const unit = (id, inst, m) => guid(id, inst) + ',' + nm(id) + ',' + flags(id) + ',' + mark(m);
  const src = (e) => unit(e.sourceID, e.sourceInstance, e.sourceMarker);
  const dst = (e) => unit(e.targetID, e.targetInstance, e.targetMarker);
  const spell = (id) => { const a = abil.get(id) || {}; return id + ',' + q(a.name || ('Spell ' + id)) + ',0x' + ((a.type | 0) || 1).toString(16); };
  // 19-field advanced block; resources belong to the source (resourceActor 1) or the target (2).
  const adv = (e, side) => {
    const has = e.hitPoints != null && (e.resourceActor === side || (!e.resourceActor && side === 2));
    const who = side === 1 ? guid(e.sourceID, e.sourceInstance) : guid(e.targetID, e.targetInstance);
    // written the way WoW writes them: positionX (north) = WCL y, positionY (west) = -WCL x
    const x = has && e.y != null ? (e.y / 100).toFixed(2) : '0', y = has && e.x != null ? (-e.x / 100).toFixed(2) : '0';
    const hp = has ? e.hitPoints : 0, mx = has ? (e.maxHitPoints || 0) : 0;
    // facing too: WoW's is radians from north toward west (checked on a local log: casters face their target), Warcraft
    // Logs' is hundredths of a radian, turned so that WoW's = -(WCL's) - 90° (checked against where Caustic Waves landed)
    const fc = has && e.facing != null ? (((-e.facing / 100 - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) : 0;
    // (the unit's power too, where WoW writes it: type, current and max, pipe-separated, e.g. Sszorak's rage on his casts,
    // or a healer's mana on theirs: Warcraft Logs sends it with every cast, so the healers' mana chart works for reports)
    const cr = has && Array.isArray(e.classResources) && e.classResources.length ? e.classResources : null;
    // (and the cast's cost, where WoW writes it after the power: what a healer spent their mana on)
    const pw = cr ? [cr.map((c) => c.type | 0).join('|'), cr.map((c) => c.amount | 0).join('|'), cr.map((c) => c.max | 0).join('|'), cr.map((c) => c.cost | 0).join('|')] : [0, 0, 0, 0];
    return [has ? who : '0000000000000000', '0000000000000000', hp, mx, 0, 0, 0, 0, 0, 0, pw[0], pw[1], pw[2], pw[3], x, y, e.mapID || 0, fc.toFixed(4), 0].join(',');
  };
  const add = (e, body) => out.push(stamp(e.timestamp) + body);
  out.push(stamp(w.start) + 'ENCOUNTER_START,' + w.encounterID + ',' + q(item.boss) + ',' + w.rawDiff + ',' + item.size + ',0');
  // pets first, so their damage is credited to their owner
  for (const a of actors.values()) if (a.type === 'Pet' && a.petOwner != null)
    out.push(stamp(w.start) + 'SPELL_SUMMON,' + unit(a.petOwner) + ',' + unit(a.id) + ',0,"Summon",0x1');
  let n = 0;
  for (const e of events) {
    if (!(++n & 4095)) yield;
    const ab = e.abilityGameID; curT = e.timestamp;
    switch (e.type) {
      case 'combatantinfo': {
        const ones = new Array(23).fill(1).join(',');
        add(e, 'COMBATANT_INFO,' + guid(e.sourceID) + ',' + ones + ',' + (e.specID || 0) + ',[],(),[],[' + (e.auras || []).filter((a) => a && a.ability).map((a) => guid(a.source != null ? a.source : e.sourceID) + ',' + a.ability + ',' + (a.stacks || 1)).join(',') + ']'); /* (the pull-start auras, e.g. Devotion Aura (Oct 23)) */
        break;
      }
      case 'damage': {
        const amt = e.amount || 0, ok = e.overkill > 0 ? e.overkill : -1, abs = e.absorbed || 0, crit = e.hitType === 2 ? '1' : 'nil';
        const suffix = [amt, e.unmitigatedAmount > 0 ? e.unmitigatedAmount : amt + abs, ok, 1, 0, 0, abs, crit, 'nil', 'nil', 'ST'].join(','); /* (the hit before mitigation, when Warcraft Logs has it: Graphs' Mitigation tab (Oct 23)) */
        // (a support line: the share of the supported player's hit that an Evoker's buff gave, sourced to the Evoker. Written the way the game
        // writes it, the hitter's damage with the buff's spell and the Evoker's GUID last, so the parser credits the Evoker and takes it off the hitter)
        if (e.subtractsFromSupportedActor && e.supportID != null) add(e, (e.tick ? 'SPELL_PERIODIC_DAMAGE_SUPPORT,' : 'SPELL_DAMAGE_SUPPORT,') + unit(e.supportID, e.supportInstance) + ',' + dst(e) + ',' + spell(ab) + ',' + adv(e, 2) + ',' + suffix + ',' + guid(e.sourceID, e.sourceInstance));
        else if (ab === 1) add(e, 'SWING_DAMAGE,' + src(e) + ',' + dst(e) + ',' + adv(e, 1) + ',' + suffix);
        else add(e, (e.tick ? 'SPELL_PERIODIC_DAMAGE,' : 'SPELL_DAMAGE,') + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + adv(e, 2) + ',' + suffix);
        break;
      }
      case 'heal': {
        const amt = e.amount || 0, oh = e.overheal || 0;
        add(e, (e.tick ? 'SPELL_PERIODIC_HEAL,' : 'SPELL_HEAL,') + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + adv(e, 2) + ',' + [amt, amt + oh, oh, e.absorbed || 0, e.hitType === 2 ? '1' : 'nil'].join(','));
        break;
      }
      case 'absorbed':
        add(e, 'SPELL_ABSORBED,' + unit(e.attackerID, e.attackerInstance) + ',' + dst(e) + ',' + spell(e.extraAbilityGameID || 1) + ',' + src(e) + ',' + spell(ab) + ',' + (e.amount || 0) + ',' + (e.amount || 0) + ',nil');
        break;
      // a heal eaten by a heal absorb (e.g. Tainted Blood), as WoW writes it: the absorb's owner, the player with it,
      // the absorb, then the healer and the heal, then the amount eaten (checked against a local log)
      case 'healabsorbed':
        add(e, 'SPELL_HEAL_ABSORBED,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + unit(e.healerID) + ',' + spell(e.extraAbilityGameID || 1) + ',' + (e.amount || 0) + ',' + (e.amount || 0));
        break;
      // (Warcraft Logs marks a cast the player didn't press, a proc like Reclamation or Shattered Souls, as fake: a FAKE
      // at the end of the line, so the Casts view can leave it out; auto attacks are their own spell, Melee)
      case 'cast':
        add(e, 'SPELL_CAST_SUCCESS,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + adv(e, 1) + (e.fake ? ',FAKE' : ''));
        break;
      // (a summon: who summoned what, e.g. a Warlock's Wild Imps and Dreadstalkers, for the spec checks)
      case 'summon':
        add(e, 'SPELL_SUMMON,' + src(e) + ',' + dst(e) + ',' + spell(ab));
        break;
      case 'begincast':
        add(e, 'SPELL_CAST_START,' + src(e) + ',' + dst(e) + ',' + spell(ab));
        break;
      // a unit gaining power, as WoW writes it: the amount (what came while they were full included), what came while they
      // were full, the power type and its max (for the Resources view)
      case 'resourcechange':
        add(e, (e.tick ? 'SPELL_PERIODIC_ENERGIZE,' : 'SPELL_ENERGIZE,') + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + adv(e, e.resourceActor || 2) + ',' + [e.resourceChange || 0, e.waste || 0, e.resourceChangeType || 0, e.maxResourceAmount || 0].join(','));
        break;
      case 'applybuff': case 'applydebuff':
        add(e, 'SPELL_AURA_APPLIED,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + (e.type === 'applybuff' ? 'BUFF' : 'DEBUFF'));
        break;
      case 'refreshbuff': case 'refreshdebuff':
        add(e, 'SPELL_AURA_REFRESH,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + (e.type === 'refreshbuff' ? 'BUFF' : 'DEBUFF'));
        break;
      case 'applybuffstack': case 'applydebuffstack':
        add(e, 'SPELL_AURA_APPLIED_DOSE,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + (e.type === 'applybuffstack' ? 'BUFF' : 'DEBUFF') + ',' + (e.stack || 0));
        break;
      case 'removebuff': case 'removedebuff':
        add(e, 'SPELL_AURA_REMOVED,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + (e.type === 'removebuff' ? 'BUFF' : 'DEBUFF'));
        break;
      case 'removebuffstack': case 'removedebuffstack':
        add(e, 'SPELL_AURA_REMOVED_DOSE,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + (e.type === 'removebuffstack' ? 'BUFF' : 'DEBUFF') + ',' + (e.stack || 0));
        break;
      // (an empowered spell let go, as WoW writes it: the rank it was charged to, e.g. Dream Breath at rank 1)
      case 'empowerend':
        add(e, 'SPELL_EMPOWER_END,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + (e.empowermentLevel || 0));
        break;
      case 'interrupt':
        add(e, 'SPELL_INTERRUPT,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + spell(e.extraAbilityGameID));
        break;
      case 'dispel':
        add(e, 'SPELL_DISPEL,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + spell(e.extraAbilityGameID) + ',DEBUFF');
        break;
      case 'resurrect': // (battle rezzes, for the wipe call (Oct 23))
        add(e, 'SPELL_RESURRECT,' + src(e) + ',' + dst(e) + ',' + spell(ab));
        break;
      case 'death': {
        add(e, 'UNIT_DIED,0000000000000000,nil,0x80000000,0x80000000,' + dst(e) + ',' + (e.feign ? 1 : 0)); // (Feign Death: Warcraft Logs marks it; the engine skips it (Oct 20: a hunter's 16 "deaths"))
        const a = actors.get(e.targetID), k = e.targetID + ':' + (e.targetInstance || 1);
        if (a && a.type !== 'Player' && a.type !== 'Pet' && !dead.has(k)) dead.set(k, e.timestamp); // (its number's next life starts after this)
        break; }
    }
  }
  out.push(stamp(w.end) + 'ENCOUNTER_END,' + w.encounterID + ',' + q(item.boss) + ',' + w.rawDiff + ',' + item.size + ',' + (item.kill ? 1 : 0) + ',' + Math.round((w.end - w.start)));
  return out;
}

root.WCL = { HOSTED, paceRecs, rateRecs, curveRecs, TOPRANK_Q, TOPAB_Q, TOPKILL_Q, topSpec, topKills, guildProg, specRanks, playerAb, WCL_DIFF, REPORT_Q, EVENTS_Q, RANK_Q, TEAM_INFO_Q, TEAM_REPORTS_Q, NIGHT_Q, DEATHS_Q, CHAR_INFO_Q, CHAR_REPORTS_Q, CHAR_RANK_Q, charRankings, CHAR_LOOK_Q, charLook, RENDER, TEAM_RANK_Q, teamRankings, parseLink, loadReport, loadEvents, loadRankings, isSaved, translate, translateAsync, BASE, parseTeamLink, teamInfo, teamReports, nightPulls, parseCharLink, charInfo, charReports, TEAM_LATEST_Q, CHAR_LATEST_Q, latestReports };
if (typeof module !== 'undefined') module.exports = root.WCL;
})(typeof window !== 'undefined' ? window : globalThis);
