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
async function api(path) {
  const r = await fetch(API_BASE + path);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || ('The server answered ' + r.status));
  return j;
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
  fights{id encounterID name difficulty kill startTime endTime size keystoneLevel fightPercentage bossPercentage lastPhase lastPhaseIsIntermission}
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
      pull: pulls[k], run: null, wallMs: rep.startTime + f.startTime, wcl: { code, fight: f.id, start: f.startTime, end: f.endTime, actors, abilities, encounterID: f.encounterID, rawDiff: diffId } };
  });
  // (endMs: the time of the report's last event, which keeps moving while someone live logs it)
  return { title: rep.title, zone: rep.zone && rep.zone.name, bosses, runs: [], dungeons, endMs: rep.endTime || null };
}

// ---------- a team's reports: every raid night as short pull summaries (saved progress), no event downloads ----------
// A Warcraft Logs team or guild page link ("…/guild/id/772787" or "…/guild/us/zuljin/Wolfthorn") names the team; its
// reports are listed 100 a page; a night's pulls come from its fight list (result, how far, length, roster) plus one
// deaths query for the whole report. (Hosted: the site has a route for each of these queries.)
const TEAM_INFO_Q = `query($id:Int,$name:String,$srv:String,$reg:String){guildData{guild(id:$id,name:$name,serverSlug:$srv,serverRegion:$reg){id name type server{name slug region{slug}}}}}`;
const TEAM_REPORTS_Q = `query($id:Int!,$page:Int!){reportData{reports(guildID:$id,limit:100,page:$page){last_page data{code title startTime endTime zone{id name} guildTag{name}}}}}`;
const NIGHT_Q = `query($code:String!){reportData{report(code:$code){title startTime endTime
  fights(killType:Encounters){id encounterID name difficulty kill startTime endTime size fightPercentage bossPercentage lastPhase lastPhaseIsIntermission friendlyPlayers}
  masterData{actors(type:"Player"){id name}}}}}`;
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
  return { id: g.id, name: g.name, team: g.type === 1, server: g.server ? g.server.name + (g.server.region ? ' (' + g.server.region.slug.toUpperCase() + ')' : '') : '' };
}
async function teamReports(creds, id) {
  let out = [], page = 1, last = 1;
  do { const rr = HOSTED ? await api('/api/teamreports?id=' + id + '&page=' + page) : (await gql(creds, TEAM_REPORTS_Q, { id, page })).reportData.reports; out = out.concat(rr.data || []); last = rr.last_page || 1; page++; } while (page <= last && page <= 20);
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
  for (let s = s0; s != null && s < e0;) { const ev = HOSTED ? await api('/api/deaths?code=' + enc(code) + '&s=' + s + '&e=' + e0) : (await gql(creds, DEATHS_Q, { code, s, e: e0 })).reportData.report.events; for (const e of ev.data || []) if (e.type === 'death') deaths.push(e); s = ev.nextPageTimestamp; }
  const pulls = fights.map((f) => {
    const mine = new Set(f.friendlyPlayers || []), dd = deaths.filter((e) => e.fight === f.id && mine.has(e.targetID)).sort((a, b) => a.timestamp - b.timestamp), diffId = WCL_DIFF[f.difficulty];
    return { fight: f.id, at: rep.startTime + f.startTime, boss: f.name, id: f.encounterID, diffId, diff: DIFF_NAME[diffId], dur: (f.endTime - f.startTime) / 1000, kill: !!f.kill,
      endPct: f.kill ? 0 : f.fightPercentage != null ? f.fightPercentage : null, endBoss: f.kill ? 0 : f.bossPercentage != null ? f.bossPercentage : null,
      endPhase: f.kill || !f.lastPhase ? null : f.lastPhaseIsIntermission ? 'Intermission' : 'P' + f.lastPhase,
      players: [...mine].map((i) => names.get(i)).filter(Boolean), deaths: dd.length, first: dd.length ? names.get(dd[0].targetID) || null : null };
  });
  return { title: rep.title, pulls };
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
    if (HOSTED) ev = await api('/api/events?code=' + encodeURIComponent(w.code) + '&fight=' + w.fight + '&s=' + s + '&e=' + e);
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
    p.catch(() => PENDING.delete(key));
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

function translate(item, events) {
  const w = item.wcl, actors = w.actors, abil = w.abilities, out = [];
  const guid = (id, inst) => {
    const a = actors.get(id);
    if (!a || id == null || id < 0) return '0000000000000000';
    if (a.type === 'Player') return 'Player-0-' + id;
    if (a.type === 'Pet') return 'Pet-0-0-0-0-' + (a.gameID || 0) + '-' + id;
    return 'Creature-0-0-0-0-' + (a.gameID || 0) + '-' + id + '-' + (inst || 1);
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
    // (an NPC's power too, where WoW writes it: type, current and max, pipe-separated, e.g. Sszorak's rage on his casts;
    // players' stay empty as before)
    const who2 = actors.get(side === 1 ? e.sourceID : e.targetID), cr = has && who2 && who2.type !== 'Player' && Array.isArray(e.classResources) && e.classResources.length ? e.classResources : null;
    const pw = cr ? [cr.map((c) => c.type | 0).join('|'), cr.map((c) => c.amount | 0).join('|'), cr.map((c) => c.max | 0).join('|')] : [0, 0, 0];
    return [has ? who : '0000000000000000', '0000000000000000', hp, mx, 0, 0, 0, 0, 0, 0, pw[0], pw[1], pw[2], 0, x, y, e.mapID || 0, fc.toFixed(4), 0].join(',');
  };
  const add = (e, body) => out.push(stamp(e.timestamp) + body);
  out.push(stamp(w.start) + 'ENCOUNTER_START,' + w.encounterID + ',' + q(item.boss) + ',' + w.rawDiff + ',' + item.size + ',0');
  // pets first, so their damage is credited to their owner
  for (const a of actors.values()) if (a.type === 'Pet' && a.petOwner != null)
    out.push(stamp(w.start) + 'SPELL_SUMMON,' + unit(a.petOwner) + ',' + unit(a.id) + ',0,"Summon",0x1');
  for (const e of events) {
    const ab = e.abilityGameID;
    switch (e.type) {
      case 'combatantinfo': {
        const ones = new Array(23).fill(1).join(',');
        add(e, 'COMBATANT_INFO,' + guid(e.sourceID) + ',' + ones + ',' + (e.specID || 0) + ',[],(),[],[]');
        break;
      }
      case 'damage': {
        const amt = e.amount || 0, ok = e.overkill > 0 ? e.overkill : -1, abs = e.absorbed || 0, crit = e.hitType === 2 ? '1' : 'nil';
        const suffix = [amt, amt + abs, ok, 1, 0, 0, abs, crit, 'nil', 'nil', 'ST'].join(',');
        if (ab === 1) add(e, 'SWING_DAMAGE,' + src(e) + ',' + dst(e) + ',' + adv(e, 1) + ',' + suffix);
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
      case 'cast':
        add(e, 'SPELL_CAST_SUCCESS,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + adv(e, 1));
        break;
      case 'begincast':
        add(e, 'SPELL_CAST_START,' + src(e) + ',' + dst(e) + ',' + spell(ab));
        break;
      case 'applybuff': case 'applydebuff':
        add(e, 'SPELL_AURA_APPLIED,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + (e.type === 'applybuff' ? 'BUFF' : 'DEBUFF'));
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
      case 'interrupt':
        add(e, 'SPELL_INTERRUPT,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + spell(e.extraAbilityGameID));
        break;
      case 'dispel':
        add(e, 'SPELL_DISPEL,' + src(e) + ',' + dst(e) + ',' + spell(ab) + ',' + spell(e.extraAbilityGameID) + ',DEBUFF');
        break;
      case 'death':
        add(e, 'UNIT_DIED,0000000000000000,nil,0x80000000,0x80000000,' + dst(e) + ',0');
        break;
    }
  }
  out.push(stamp(w.end) + 'ENCOUNTER_END,' + w.encounterID + ',' + q(item.boss) + ',' + w.rawDiff + ',' + item.size + ',' + (item.kill ? 1 : 0) + ',' + Math.round((w.end - w.start)));
  return out.join('\n');
}

root.WCL = { HOSTED, REPORT_Q, EVENTS_Q, RANK_Q, TEAM_INFO_Q, TEAM_REPORTS_Q, NIGHT_Q, DEATHS_Q, parseLink, loadReport, loadEvents, loadRankings, isSaved, translate, BASE, parseTeamLink, teamInfo, teamReports, nightPulls };
if (typeof module !== 'undefined') module.exports = root.WCL;
})(typeof window !== 'undefined' ? window : globalThis);
