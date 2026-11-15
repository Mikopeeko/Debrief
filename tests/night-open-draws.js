// Opening a pull builds its page once, not three times (the raid-night rehearsal, Nov 14, walking Wolfthorn Thu Nov 12 Ula'tek pull 13 as a raider:
// report Gax3AkbyFRXmdrgQ fight 23). Measured on a practice copy in headless Chrome, never signed in (Nov 15): the page was built 3 times behind
// the loading card and showed after 11.9 s on a PC and 11.8 s on a phone. The first draw asked for the top guilds' rates, the pull's own numbers
// and the guild's history; the pace and curve lists were asked for only by the second draw, once the guild's history was in; and every answer
// built the whole page again. Now every list is asked for when the pull is picked (livePrefetch), the page waits for them while the pull is read
// (liveSettled), and behind the loading card one redraw covers anything later. Measured after, same night and practice-copy setup: built once,
// shown after 8.8 s and 7.0 s on a PC (11.9 s and 11.7 s before), 9.3 s and 9.9 s on a phone (11.8 s and 12.9 s before), the page's text unchanged.
// This runs the page's own select0, liveRedraw, holdWait and list fetchers from src/ui.js with a stand-in Warcraft Logs that answers at the
// speeds measured that night, a stand-in clock, and a stand-in draw that asks for the lists the way Debriefing does (each draw costs 1.5 s of the
// clock, about what one took that night). It fails if opening the pull builds the page more than MAX_DRAWS times, on a PC or a phone, or if a list
// that comes in very late is lost. contradictions.js runs it on every build.
'use strict';
module.exports = async function nightOpenDraws(H, say, src) {
  const bad = (m) => say("Wolfthorn Thu Nov 12 Ula'tek pull 13", 'night open draws', m);
  const vm = require('vm'), MAX_DRAWS = 1, READ_MS = 3000, DRAW_MS = 1500;
  const NEED = ['LIVE_T', 'livePending', 'liveRedraw', 'holdWait', 'select0', 'RATE_CAL', 'RATE_LIVE', 'rateUniq', 'rateLive', 'F378', 'PACE_NERF', 'GHIST', 'guildHist', 'ghState', 'PACE_LIVE', 'paceCV', 'CURVE_LIVE', 'curveRef', 'CAL381', 'cal381'];
  const NEW = ['LIVE_INF', 'liveTrack', 'livePrefetch', 'liveSettled', 'curveFetch', 'RATEK_RAW', 'ratekFetch', 'cal381Of']; /* (Nov 15; an older page has none of them) */
  const parts = [];
  const UIS = src || H.UI, SEL = UIS.replace('async function select0(', 'function select0('); /* (grab reads plain functions: select0 is async) */
  for (const n of NEED) { try { parts.push(n === 'select0' ? 'async ' + H.grab(n, SEL) : H.grab(n, src)); } catch (e) { bad('could not read ' + n + ' out of src/ui.js: ' + e.message); return; } }
  for (const n of NEW) { try { parts.push(H.grab(n, src)); } catch (e) { /* (not there: the old page) */ } }
  const code = parts.join('\n') + '\n({ select0, liveRedraw, holdWait, GHIST, RATE_LIVE, PACE_LIVE, CURVE_LIVE, CAL381 })';

  /* one pull opened from a link, on a PC or a phone; slow: the guild's history answers this late (ms) */
  async function open(phone, slowGuild, o2) { const O = o2 || {}, READ = O.read || READ_MS;
    let T = 0, seq = 0; const Q = [];
    const st = (fn, ms) => { const id = ++seq; Q.push({ id, at: T + Math.max(0, +ms || 0), fn }); return id; };
    const ct = (id) => { const i = Q.findIndex((q) => q.id === id); if (i >= 0) Q.splice(i, 1); };
    class FakeDate extends Date {} FakeDate.now = () => T;
    const answer = (ms, v) => new Promise((res) => st(() => res(v), ms));
    const n = 120, phases = [{ start: 0, end: n, name: 'P1' }], at = Date.parse('2026-11-01T00:00:00Z');
    const RECS = Array.from({ length: 20 }, (_, i) => ({ c: 'K' + i, f: 1, h: 4, at, ph: [[2e6 + i * 1e4, 5e5, 3e5, 0, 300 + i]] }));
    const CURVES = [1, 2, 3, 4, 5].map((v) => ({ c: 'CURVEKILL' + v, h: 4, ph: [[0, n]], step: 1000, dps: new Array(n).fill(v * 1e6), hps: new Array(n).fill(v * 1e5), dtps: new Array(n).fill(v * 1e5) }));
    const it = { boss: "Ula'tek", diffId: 16, id: 3492, pull: 13, kind: 'boss', gid: 772787, wallMs: Date.parse('2026-11-13T03:00:00Z'), wcl: { code: 'Gax3AkbyFRXmdrgQ', fight: 23 } };
    const rep = { item: it, duration: n, dmgS: new Array(n).fill(2e6), healS: new Array(n).fill(5e5), takenS: new Array(n).fill(3e5), module: { phases }, players: new Map() };
    const WCL = { HOSTED: true, rateRecs: () => answer(860, { recs: RECS }), rateKill: () => answer(860, { ph: [{ s: 0, e: n, dps: 2e6, hps: 5e5, dtps: 3e5 }] }),
      guildProg: () => answer(slowGuild || O.guild || 1880, { pulls: 3, pl: [[at, 60], [at + 6e5, 40], [at + 12e5, 30]] }), paceRecs: () => answer(O.pace || 1220, { recs: RECS.concat(RECS) }),
      curveRecs: () => answer(1130, { recs: CURVES }), killGuild: () => answer(1640, { name: 'Hokoreu' }) };
    const S = { tab: 'audit', scope: 'pull', index: { bosses: [] }, item: null, rep: null };
    const draws = [], saves = []; let hold = false, drawn = false, holdT0 = 0, lastDraw = 0, shownAt = null;
    const ctx = vm.createContext({ S, WCL, Date: FakeDate, setTimeout: st, clearTimeout: ct, console, Map, Set, Promise, Math, JSON, Array, Object, Number, String, isFinite,
      document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null }, window: { scrollY: 0, scrollTo: () => {} },
      RATE_BASE: {}, PROG_CURVE: {}, WCL_DIFF_OF: { 16: 5, 15: 4, 14: 3 }, paceCurve: () => ({ g: 1 }), nightOf: (t) => String(Math.floor(t / 864e5)), nightLabel: () => 'Thu', healersOf: () => 4,
      ldOn: () => !drawn, holding: () => hold, phoneish: () => phone, bufStart: () => {}, bufEnd: () => {}, liveSave: () => { saves.push(T); }, liveRestore: () => {}, gnShared: () => {}, parsesFor: () => null,
      prevOf: () => ({}), syncUrl: () => {}, ITEMS: [], $: () => ({ innerHTML: '' }), loadCard: () => '', esc: String, prevEarly: () => Promise.resolve(), CACHE: new Map(), bgFetch: () => {},
      getRep: () => answer(READ, rep), HOLD_0: 0 });
    ctx.holdStart = () => { hold = true; holdT0 = T; ctx.HOLD_0 = T; };
    let P; try { P = vm.runInContext(code, ctx); } catch (e) { bad('the page code would not load: ' + e.message); return null; }
    /* (a draw asks for the lists the way Debriefing does: the rate tiles (rateLive), the per-raid scale (cal381), the Pulls tile (the guild's
       history first, and the pace list only once that's in), and the tiles' charts (the curves) once a tile has its comparison list) */
    ctx.renderMain = () => { draws.push({ t: T, hold }); drawn = true; const r = S.rep, key = it.boss + '|' + it.diffId;
      try { ctx.rateLive(it); } catch (e) { bad('rateLive threw: ' + e.message); }
      try { ctx.cal381(r); } catch (e) { bad('cal381 threw: ' + e.message); }
      try { ctx.guildHist(it); if (ctx.ghState(it) !== 'loading') ctx.paceCV(it); } catch (e) { bad('the Pulls tile lists threw: ' + e.message); }
      try { if (P.RATE_LIVE.get(key)) ctx.curveRef(r, 'dps', phases, n); } catch (e) { bad('curveRef threw: ' + e.message); }
      T += DRAW_MS; lastDraw = T; };
    for (const k of ['rateLive', 'cal381', 'guildHist', 'ghState', 'paceCV', 'curveRef']) ctx[k] = vm.runInContext(k, ctx);
    /* (the hold card goes when the page has been still for 0.4 s and holdWait has nothing to wait for, or after 6.5 s (13 s on a phone), as bufTick) */
    const tick = () => { if (!hold) return; const el = T - holdT0; if (el >= (phone ? 13000 : 6500) || (T - lastDraw >= 400 && !P.holdWait(el))) { hold = false; shownAt = T; return; } st(tick, 100); };
    const flush = () => new Promise((r) => setImmediate(r));
    let opened; try { opened = P.select0(it); } catch (e) { bad('select0 threw: ' + e.message); return null; }
    Promise.resolve(opened).catch((e) => bad('select0 failed: ' + e.message));
    let ticking = false;
    for (let guard = 0; guard < 20000; guard++) { await flush(); await flush(); if (hold && !ticking) { ticking = true; st(tick, 100); }
      Q.sort((a, b) => a.at - b.at || a.id - b.id); const q = Q[0]; if (!q || q.at > 30000) break; Q.shift(); if (q.at > T) T = q.at; try { q.fn(); } catch (e) { bad('a timer threw: ' + e.message); } }
    return { draws, shownAt, saves, ghist: [...P.GHIST.values()].some((v) => v && v.pl) };
  }

  for (const phone of [false, true]) {
    const where = phone ? 'on a phone' : 'on a PC', o = await open(phone, 0); if (!o) return;
    if (o.draws.length > MAX_DRAWS) bad('opening the pull ' + where + ' builds the whole page ' + o.draws.length + ' times (at ' + o.draws.map((d) => (d.t / 1000).toFixed(1) + ' s').join(', ') + '); it should be built ' + MAX_DRAWS + ' time once the comparison lists are in');
    if (!o.draws.length) bad('opening the pull ' + where + ' never drew the page');
    /* (a pull already saved on this browser reads in 0.5 s: the page waits for the lists, still one draw) */
    const saved = await open(phone, 0, { read: 500 }); if (!saved) return;
    if (saved.draws.length > MAX_DRAWS) bad('opening a pull already saved on this browser ' + where + ' builds the whole page ' + saved.draws.length + ' times; it should wait for the comparison lists and be built ' + MAX_DRAWS + ' time');
    /* (two lists past the wait, a moment apart, behind the loading card while its time for the lists lasts: one redraw for both, not one each. Only a
       phone has time left after its draw: on a PC the 3 s wait before the draw and the draw itself use up the 4 s the card waits for the lists) */
    if (phone) { const two = await open(phone, 0, { read: 500, guild: 8100, pace: 8700 }); if (!two) return;
      if (two.draws.length > MAX_DRAWS + 1) bad('with two lists coming in late behind the loading card ' + where + ', the page is built ' + two.draws.length + ' times; one redraw should cover both'); }
    /* (Nov 15, Main's review: a list later than every wait holds the loading card once, not twice: the time the page waited for it before its draw counts
       against the card's own wait for the lists (4 s on a PC, 9 s on a phone, in all). It held the card up to 3 + 4 s (6 + 9 s on a phone)) */
    { const cap = phone ? 9000 : 4000, slow = await open(phone, 15000); if (!slow) return;
      if (slow.shownAt == null || slow.shownAt - READ_MS > cap + DRAW_MS + 1000) bad('with the guild\'s history 15 s late ' + where + ', the loading card stayed ' + (slow.shownAt == null ? 'up' : ((slow.shownAt - READ_MS) / 1000).toFixed(1) + ' s') + ' after the pull was read; the lists get ' + cap / 1000 + ' s in all, plus the draw'); }
    /* (one list lands after the draw while another is still coming past the card's limit: the first is drawn while the card is still up, never
       dropped when the card goes (Nov 15 review: held back to wait for the rest, it could miss the card's end and stay off a phone's page)) */
    const gAt = phone ? 7000 : 3800, held = await open(phone, 0, { read: 500, guild: gAt, pace: 40000 }); if (!held) return;
    if (!held.draws.some((d) => d.t >= gAt && d.hold)) bad('with the guild\'s history landing after the first draw and the pace list still coming ' + where + ', the history was not drawn before the page showed (draws at ' + held.draws.map((d) => (d.t / 1000).toFixed(1) + ' s' + (d.hold ? '' : ' after it showed')).join(', ') + ')');
    if (held.draws.length > MAX_DRAWS + 1) bad('with one list late and one later still ' + where + ', the page is built ' + held.draws.length + ' times');
    /* (a list that comes in very late, after the card is gone: still shown, by one more draw on a PC, kept for the next draw on a phone) */
    const late = await open(phone, 15000); if (!late) return;
    if (late.draws.length > MAX_DRAWS + 1) bad('with the guild\'s history 15 s late, opening the pull ' + where + ' builds the page ' + late.draws.length + ' times');
    if (!late.ghist) bad('with the guild\'s history 15 s late ' + where + ', it never reached the page\'s list');
    else if (!phone && !late.draws.some((d) => d.t >= 15000)) bad('with the guild\'s history 15 s late on a PC, the page never showed it (no draw after it came in)');
    else if (phone && !late.saves.some((t) => t >= 15000)) bad('with the guild\'s history 15 s late on a phone, it wasn\'t kept for the next draw');
  }
};
