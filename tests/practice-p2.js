// The Ula'tek practice game's phase 2 (src/practice-p2.js, Nov 15; Flex: "can another chat start working on the next phase of the fight", then
// "only build the 3d version for now"), run in Node the same way tests/practice-game.js runs phase 1: the real game code with a do-nothing page.
// Runs on every build (tests/contradictions.js); `node tests/practice-p2.js` runs it alone (`--audit` prints the bots' audit for more runs).
// This fails if:
//   A. the clock isn't the measured Mythic one (notes/Guides/Bosses/8 Ula'tek.md, "After phase 1, measured": Hatching Doom 2:54, Wardens 2:55,
//      Malice 3:03, Grasping Fangs 3:16, Wardens dead 3:37 to 3:40, Falling Debris 3:50, 4:30 and 5:17, Doomscales 4:27, Anguished Cry 4:35, 4:53
//      and 5:09, Rage of the Shackled 4:48, heart open 4:55): the check reads those times out of the notes themselves;
//   B. Grasping Fangs isn't six tethers, three a ledge, on anyone (tanks too), one solo break 14 to 18 s before the five (measured);
//   C. a bot slips: off the stone, in Falling Debris or a frontal, off their ledge or not back for the heart, by a protected egg, a tether broken
//      off the count, a kick missed, two egg carriers within 3 yards, an egg not in the cauldron. (Found while building it, Nov 15: the Doomscales'
//      kickers stood just out of reach, so a missed Anguished Cry stunned the raid into the 5:14 and 5:17 debris; the egg carriers walked straight
//      across the east ledge's venom inlet at y 26 to 40; two carriers' rings touched where the far egg's path passed the near one; the shared dodge
//      gave up at a circle's rim. Each played as a slip here before its fix.)
//   D. your picked job isn't the one you play, or a job is lost or done twice when it's swapped in. (Found while building it, Nov 15: a regex typo,
//      /^nd+$/, gave your picked small egg to another raider and left you with none.) The autopilot plays two picked jobs clean.
//   E. the mistakes don't land: no crossing, a missed Malice, a tether broken early, Warden's Protection, the big egg before the small ones, or a
//      clean run doesn't score 100;
//   F. the part isn't on the start card's Part switch, `?practice=2` doesn't open it, or build.ps1 doesn't check and read src/practice-p2.js;
//   G. the 3D view doesn't draw phase 2's own shapes where its hits are (the tether's 25 yards, the eggs' 7, the cauldron's 9, the frontal's 14);
//   H. phase 1 changes with this file loaded (the part hook stays off for it).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src'), rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n');
function stub() { const f = function () { return stub(); }; return new Proxy(f, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : k === Symbol.iterator ? function* () {} : stub()), set: () => true, apply: () => stub() }); }
function load(H, part) {
  H = H || require('./site-helpers.js');
  const GJ = rd('guides.js'), fromGuides = ['GDZ_ROLE', 'GDZ_RAID', 'gdzName', 'UX', 'UX_MEL', 'UX_HOME', 'UX_ZONE', 'UL_EDGE', 'UL_FB', 'GDZ_FLOOR', 'UL_EGGS'].map((n) => H.grab(n, GJ)).join('\n');
  const win = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
  class Img { constructor() { this.complete = false; this.naturalWidth = 0; } }
  const ctx = vm.createContext({ document: stub(), window: win, navigator: stub(), performance, Image: Img, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, localStorage: stub(), E: { CLASSES: {} }, console, MouseEvent: function () {} });
  vm.runInContext(H.grab('esc') + '\n' + fromGuides + '\n' + rd('practice.js') + '\n' + rd('practice3d.js') + '\n' + rd('practice-p2.js') + '\nthis.pgP2Script = pgP2Script; this.pgP2Jobs = pgP2Jobs; this.PG_P2 = PG_P2; this.PG_P2_T = PG_P2_T; this.PG_PARTS = PG_PARTS; this.pg3dShapes = pg3dShapes; this.pgP2Floor = pgP2Floor;', ctx);
  vm.runInContext('pgOpen(null, "Ula\'tek", "m"' + (part ? ', "' + part + '"' : '') + ')', ctx);
  return { dbg: win.__pgDbg, ctx };
}
const clkS = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const SERIOUS = /off the platform|in Falling Debris|in a Desperate Thrash|not on their ledge|not back by her|protected egg|off the count|not kicked|two carriers|not in by/;

function checks(H, say) {
  const bad = (t) => say("Ula'tek practice game, phase 2", 'phase 2', t);
  let L; try { L = load(H, 'm2'); } catch (e) { bad('the game would not run phase 2 in the test (' + e.message + ')'); return; }
  const { dbg, ctx } = L, T = ctx.PG_P2_T, P = ctx.PG_P2, script = ctx.pgP2Script, hyp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  if (!dbg || !dbg.P2) { bad('opening the phase 2 part gives no phase 2 game (PG_PARTS["Ula\'tek"].m2 with its mod, check F)'); return; }
  // A. the clock, against the notes' own measured times
  const notes = fs.readFileSync(path.join(__dirname, '..', 'notes', 'Guides', 'Bosses', "8 Ula'tek.md"), 'utf8'), sec = (m) => +m[1] * 60 + +m[2];
  const clockLine = (notes.split('\n').find((l) => l.startsWith('**The Mythic clock after phase 1')) || '');
  const want = (what, re, got, tol) => { const m = re.exec(clockLine); if (!m) { bad('the notes no longer say ' + what + ' in "After phase 1, measured" (check A)'); return; } const exp = m.slice(1).reduce((a, v, i, arr) => (i % 2 ? a : a.concat([+arr[i] * 60 + +arr[i + 1]])), []);
    if (got.length !== exp.length || got.some((v, i) => Math.abs(v - exp[i]) > (tol || 0.6))) bad(what + ' at ' + got.map(clkS).join(', ') + ' in the game; the measured clock has ' + exp.map(clkS).join(', ') + ' (check A)'); };
  const S = script({ seed: 3, east: false });
  want('Hatching Doom', /Hatching Doom (\d):(\d\d)/, [T.doom]); want('the Wardens', /Wardens up (\d):(\d\d)/, [T.wardens]); want('their first Malice', /their Malice (\d):(\d\d)/, [S.malice[0].t0]);
  want('Grasping Fangs', /Grasping Fangs (\d):(\d\d)/, [T.fangs]); want('Rage of the Shackled', /Rage of the Shackled (\d):(\d\d), heart open/, [S.casts.find((c) => c.name === 'Rage of the Shackled').t0]);
  want('the heart', /heart open (\d):(\d\d)/, [T.heart], 0.6); want('Anguished Cry', /Anguished Cry three times, about (\d):(\d\d), (\d):(\d\d) and (\d):(\d\d)/, [...new Set(S.cries.map((c) => c.t0))]);
  want('the Weakened Doomscales', /Weakened Doomscales up about (\d):(\d\d)/, [T.dsUp], 1);
  { const m = /Falling Debris \| also falls three times in stage 2 \(about (\d):(\d\d), (\d):(\d\d) and (\d):(\d\d)\)/.exec(notes); if (!m) bad('the notes no longer give stage 2\'s Falling Debris times (check A)');
    else { const exp = [sec(m), sec([0, m[3], m[4]]), sec([0, m[5], m[6]])], firsts = exp.map((e) => S.impacts.filter((q) => q.name === 'Falling Debris' && Math.abs(q.at - e) < 1.5).length); if (firsts.some((n) => !n)) bad('stage 2\'s Falling Debris doesn\'t fall at ' + exp.map(clkS).join(', ') + ' (circles near each: ' + firsts.join(', ') + ', check A)'); } }
  { const m = /Wardens dead about (\d):(\d\d) to (\d):(\d\d)/.exec(clockLine); if (m && (T.wdie < sec(m) - 0.5 || T.wdie > sec([0, m[3], m[4]]) + 0.5)) bad('the Wardens die at ' + clkS(T.wdie) + '; top kills kill them ' + m[1] + ':' + m[2] + ' to ' + m[3] + ':' + m[4] + ' (check A)'); }
  if (T.doomEnd - T.doom !== 90) bad('the big eggs get ' + (T.doomEnd - T.doom) + ' s to be picked up; Hatching Doom is 90 s (spell 1306862, check A)');
  // B. the tethers, over 40 runs
  let tanks = 0; for (let seed = 1; seed <= 40; seed++) { const J = ctx.pgP2Jobs(seed, null, null), ids = Object.keys(J).filter((id) => J[id].teth), solo = ids.filter((id) => J[id].teth === 'solo');
    if (ids.length !== 6 || ids.filter((id) => J[id].side === 'E').length !== 3 || solo.length !== 1) { bad('Grasping Fangs gives ' + ids.length + ' tethers (' + ids.filter((id) => J[id].side === 'E').length + ' east) and ' + solo.length + ' solo on seed ' + seed + '; Mythic has six, three a ledge, one breaking alone (check B)'); break; }
    if (ids.some((id) => id[0] === 't')) tanks++; }
  if (!tanks) bad('no tank got a tether in 40 runs; on top kills they land on any role, tanks too (check B)');
  if (T.five - T.solo < 14 || T.five - T.solo > 18) bad('the five break ' + (T.five - T.solo) + ' s after the solo; top kills break them 14 to 18 s apart (check B)');
  // C. the bots, played: a raider with no egg, no kick and no tether as you, so every job is a bot's
  const free = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' };
  try { dbg.P2.pick = free; for (const [east, seed] of [[false, 3], [true, 5], [false, 11], [true, 14]]) { dbg.at(166.05, dbg.P2.slotOf(free), { east, seed }); dbg.audit(east, seed).filter((x) => SERIOUS.test(x)).forEach((x) => bad('a bot slips: ' + x + ' (she is ' + (east ? 'east' : 'west') + ', seed ' + seed + ', check C)')); } }
  catch (e) { bad('the bots\' audit crashed: ' + e.message + ' (check C)'); }
  // D. your picked job
  try {
    const pk = { side: 'W', role: 'm', egg: 'n4', mal: 1, cry: 1, teth: 'solo' }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk);
    if (!/^m[4-7]$/.test(me)) bad('a west melee pick plays as ' + me + ', not one of the west half\'s melee (check D)');
    const r = dbg.sim(me, true, false, 3), J = dbg.S.job, j = J[me];
    if (j.egg !== 4 || j.mal !== 1 || j.cry !== 1 || j.teth !== 'solo') bad('the picked job (west, small egg 4, the 1st Malice, Doomscale 1\'s cries, the solo break) plays as ' + JSON.stringify(j) + ' (check D)');
    // (a melee who picks the 2nd Malice and the solo break, or the 3rd and the five, is told on the card: they can't kick from the end of a tether)
    dbg.P2.pick = { side: 'W', role: 'm', egg: 'n4', mal: 2, cry: 1, teth: 'solo' }; if (!/Heads up: the 2nd Malice/.test(dbg.P2.clash())) bad('a melee picking the 2nd Malice and the solo break isn\'t told they clash (check D)');
    dbg.P2.pick = { side: 'W', role: 'r', egg: 'n4', mal: 2, cry: 1, teth: 'solo' }; if (dbg.P2.clash()) bad('a ranged kicker (30 yards) is told the 2nd Malice clashes with the solo break (check D)');
    ['E', 'W'].forEach((s) => { const ids = Object.keys(J).filter((id) => J[id].side === s), n = (k, v) => ids.filter((id) => J[id][k] === v).length;
      for (let e = 1; e <= P.eggs[s].length; e++) if (n('egg', e) !== 1) bad('small egg ' + e + ' on the ' + s + ' ledge has ' + n('egg', e) + ' carriers after the pick (check D)');
      ['far', 'close'].forEach((w) => { if (n('big', w) !== 1) bad('the ' + w + ' big egg on the ' + s + ' ledge has ' + n('big', w) + ' carriers after the pick (check D)'); });
      [1, 2, 3].forEach((k) => { if (n('mal', k) !== 1) bad('Malice ' + k + ' on the ' + s + ' ledge has ' + n('mal', k) + ' kickers after the pick (check D)'); });
      if (ids.filter((id) => J[id].teth).length !== 3) bad('the ' + s + ' ledge has ' + ids.filter((id) => J[id].teth).length + ' tethers after the pick, not 3 (check D)'); });
    if (Object.keys(J).filter((id) => J[id].teth === 'solo').length !== 1) bad('the pick leaves ' + Object.keys(J).filter((id) => J[id].teth === 'solo').length + ' solo breakers (check D)');
    if (r.log.length) bad('the autopilot playing a west melee carrier with two kicks and the solo break makes mistakes: ' + r.log.join(' | ') + ' (check D)');
    const pk2 = { side: 'E', role: 'h', egg: 'far', mal: 0, cry: 0, teth: 'five' }; dbg.P2.pick = pk2; const me2 = dbg.P2.slotOf(pk2), r2 = dbg.sim(me2, true, true, 7), j2 = dbg.S.job[me2];
    if (j2.big !== 'far' || j2.egg || j2.teth !== 'five') bad('the far big egg with a tether (one of the five) plays as ' + JSON.stringify(j2) + ' (check D)');
    if (r2.log.length) bad('the autopilot playing the far big egg (a healer, one of the five) makes mistakes: ' + r2.log.join(' | ') + ' (check D)');
    if (dbg.grade().sc !== 100) bad('a clean run scores ' + dbg.grade().sc + ', not 100 (check E)');
  } catch (e) { bad('the picked job crashed the game: ' + e.message + ' (check D)'); }
  // E. the mistakes
  try {
    const pk = { side: 'E', role: 'm', egg: 'n2', mal: 1, cry: 0, teth: 'none' }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk);
    const still = dbg.sim(me, false, false, 3).log.join(' | ');
    if (!/never crossed to your ledge/.test(still)) bad('standing still on the platform isn\'t a mistake ("never crossed"): ' + still + ' (check E)');
    if (!/didn't kick Malice \(3:03\)/.test(still)) bad('the 3:03 Malice kicker who never kicks gets no mistake: ' + still + ' (check E)');
    if (!(dbg.grade().sc < 80)) bad('standing still all of phase 2 scores ' + dbg.grade().sc + ' (check E)');
    dbg.at(183.5, me, { east: false, seed: 3 }); const W = dbg.G.p2.wd.E; dbg.pos = [W[0] - 3, W[1] - 3]; dbg.kick(); if (dbg.G.p2.kick.mE1 !== me) bad('pressing E by the Warden in its 3:03 Malice cast doesn\'t kick it (check E)');
    dbg.at(200, me, { east: false, seed: 3 }); const e0 = dbg.G.eggs.find((e) => e.side === 'E'); dbg.pos = [e0.x - 3, e0.y]; dbg.step(2); if (!dbg.log.some((x) => /Warden's Protection/.test(x))) bad('standing 3 yards from an egg while its Warden lives isn\'t a mistake (check E)');
    const pkT = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'five' }; dbg.P2.pick = pkT; const meT = dbg.P2.slotOf(pkT); dbg.at(205, meT, { east: false, seed: 3 }); const WT = dbg.G.p2.wd.E;
    dbg.pos = [WT[0] + 20, WT[1] - 20]; dbg.step(3); if (!dbg.log.some((x) => /broke your tether early/.test(x))) bad('one of the five walking out of their tether at 3:25 isn\'t "broke your tether early": ' + dbg.log.join(' | ') + ' (check E)');
    const pkB = { side: 'E', role: 'h', egg: 'far', mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pkB; const meB = dbg.P2.slotOf(pkB); dbg.at(232, meB, { east: false, seed: 3 }); const B = dbg.S.big.find((b) => b.side === 'E' && b.which === 'far');
    dbg.pos = [B.x, B.y]; dbg.step(2); if (!dbg.log.some((x) => /big egg with small eggs still out/.test(x))) bad('picking up the big egg at 3:52, with the small eggs still out, isn\'t a mistake: ' + dbg.log.join(' | ') + ' (check E)');
  } catch (e) { bad('the mistakes crashed the game: ' + e.message + ' (check E)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // F. the wiring
  const PJ = rd('practice.js'), GJ = rd('guides.js'), BP = rd('build.ps1');
  if (!ctx.PG_PARTS["Ula'tek"].m2 || ctx.PG_PARTS["Ula'tek"].m2.d !== 'm' || typeof ctx.PG_PARTS["Ula'tek"].m2.mod !== 'function') bad('phase 2 isn\'t a Mythic part of Ula\'tek with its own mod in PG_PARTS (check F)');
  if (!/pg-part/.test(PJ) || !/pgOpen\(root, boss, d, b\.dataset\.v/.test(PJ)) bad('the start card has no Part switch that opens phase 2 (check F)');
  if (!/pgN = \(\/\[\?&#\]practice=\(\\d\)\//.test(GJ) || !/pgOpen\(r, S\.gdzBoss, S\.gdzDiff, pk\)/.test(GJ)) bad('`?practice=2` on the guide no longer opens phase 2 (check F)');
  if (!BP.includes("'practice-p2.js'") || !BP.includes("(& $read 'practice-p2.js')")) bad('build.ps1 no longer checks src/practice-p2.js or puts it into the page (check F)');
  if (!/if \(v === '3d' \|\| P2\) view\(true\)/.test(PJ)) bad('phase 2 doesn\'t open in 3D (Flex: 3D only, check F)');
  // G. 3D: phase 2's own shapes, where the hits are
  try {
    const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'five' }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), kinds = new Set(), A = { get G() { return dbg.G; }, get S() { return dbg.S; }, me, bossAt: dbg.P2.bossAt, tailAt: dbg.P2.tailAt, rl: (id) => id[0], nm: (id) => id, clsC: () => null, P2: dbg.P2 };
    const at = (t0) => { dbg.at(t0, me, { east: false, seed: 3 }); return ctx.pg3dShapes(A, dbg.G.t); };
    let L0 = at(200); L0.forEach((s) => kinds.add(s.k));
    const W = dbg.G.p2.wd.E; if (!L0.some((s) => s.k === 'ring' && Math.abs(s.r - P.TETHER) < 0.01 && hyp([s.x, s.y], W) < 0.01)) bad('in 3D your tether doesn\'t show its ' + P.TETHER + '-yard break ring round the Warden (check G)');
    if (!L0.some((s) => s.k === 'ring' && Math.abs(s.r - P.WARD) < 0.01)) bad('in 3D the eggs\' ' + P.WARD + '-yard Warden\'s Protection rings are gone (check G)');
    if (!L0.some((s) => s.k === 'ring' && Math.abs(s.r - P.THROW) < 0.01 && hyp([s.x, s.y], dbg.S.pits.E) < 0.01)) bad('in 3D the cauldron\'s ' + P.THROW + '-yard ring isn\'t where it takes the eggs (check G)');
    at(176).forEach((s) => kinds.add(s.k)); at(262).forEach((s) => kinds.add(s.k)); const LF = at(271.5); LF.forEach((s) => kinds.add(s.k)); at(300).forEach((s) => kinds.add(s.k));
    const fan = LF.find((s) => s.k === 'fan'); if (!fan || Math.abs(fan.r - P.FAN.r) > 0.01) bad('in 3D the Doomscale\'s frontal isn\'t drawn at its ' + P.FAN.r + ' yards (check G)');
    ['gate', 'warden', 'tether', 'cauldron', 'begg', 'dscale', 'fan', 'heart'].forEach((k) => { if (!kinds.has(k)) bad('the 3D view draws no "' + k + '" in phase 2 (check G)'); });
    const P3 = rd('practice3d.js'); if (!/A\.P2\.shapes\(t, P,/.test(P3) || !/P2K && P2K\.put\(s, t\)/.test(P3) || !/typeof pg3dP2 === 'function'/.test(P3)) bad('practice3d.js no longer hands phase 2 its shapes and pieces (check G)');
  } catch (e) { bad('the 3D shapes crashed on phase 2: ' + e.message + ' (check G)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // H. phase 1, with this file loaded
  try { const L1 = load(H); if (L1.dbg.P2) bad('phase 1 opens with the phase 2 part switched on (check H)'); const r1 = L1.dbg.sim('r3', true, false, 3); if (!L1.dbg.S || L1.dbg.S.end !== 165 || !r1) bad('phase 1 no longer plays to 2:45 with phase 2 loaded (check H)'); }
  catch (e) { bad('phase 1 crashed with phase 2 loaded: ' + e.message + ' (check H)'); }
}

module.exports = checks; module.exports.load = load;
if (require.main === module) {
  let n = 0; const t0 = Date.now(); checks(null, (a, b, t) => { n++; console.log('✗ ' + t); });
  console.log(n ? n + ' problem(s)' : 'practice game, phase 2: all checks pass', '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
  if (process.argv.includes('--audit')) { const { dbg } = load(null, 'm2'); dbg.P2.pick = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; for (let seed = 1; seed <= 16; seed++) for (const east of [false, true]) { const a = dbg.audit(east, seed); console.log('seed ' + seed + (east ? ' E' : ' W') + ': ' + (a.length ? '\n  ' + a.join('\n  ') : 'clean')); } }
  process.exitCode = n ? 1 : 0;
}
