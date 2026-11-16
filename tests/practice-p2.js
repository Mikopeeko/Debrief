// The Ula'tek practice game's phase 2 (src/practice-p2.js, Nov 15; Flex: "can another chat start working on the next phase of the fight", then
// "only build the 3d version for now"), run in Node the same way tests/practice-game.js runs phase 1: the real game code with a do-nothing page.
// Runs on every build (tests/contradictions.js); `node tests/practice-p2.js` runs it alone (`--audit` prints the bots' audit for more runs).
// This fails if:
//   A. the clock isn't the measured Mythic one (notes/Guides/Bosses/8 Ula'tek.md, "After phase 1, measured": Hatching Doom 2:54, Wardens 2:55,
//      Malice 3:03, Grasping Fangs 3:16, Wardens dead 3:37 to 3:40, Falling Debris 3:50, 4:30 and 5:17, Doomscales 4:27, Anguished Cry 4:35, 4:53
//      and 5:09, Rage of the Shackled 4:48, heart open 4:55): the check reads those times out of the notes themselves;
//   B. Grasping Fangs isn't six tethers, three a ledge, on anyone (tanks too), one solo break about 8 s after the tethers land and 8 s before the
//      five (Main, Nov 15, all 131 library Mythic kills: the solo a median 8.3 s after the landing, the five 16.7 s; the game had the solo at 3:18.5,
//      2.5 s after the landing, from the notes' "14 to 18 s", which was counted from the landing, not the solo);
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
//   H. phase 1 changes with this file loaded (the part hook stays off for it);
//   I. the damage moments (Flex, Nov 15): the Warden, the Doomscales and the heart at their times (any Viper first), Tab and a click work, the
//      autopilot hits each in four jobs, standing still misses all three, and the end card names them.
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
  // (Flex, Nov 15: "the big egg locations are wrong, well the close one is": 10 top Mythic kills in the log library pick the big eggs up at each
  // ledge's two far ends, about (±56.5, -84.5) and (±56.5, 86.5) in the guide's yards (ARENAS cx 0, cy 1553.1); the close one had sat 16 yards
  // from the far one, near the cauldron. The cauldron: the big eggs go in about (±105, 0), the guide's pit)
  [['far', -84.5], ['close', 86.5]].forEach(([w, y]) => ['E', 'W'].forEach((s) => { const b = S.big.find((q) => q.side === s && q.which === w), want = [s === 'E' ? 56.5 : -56.5, y];
    if (!b || hyp([b.x, b.y], want) > 3) bad('the ' + w + ' big egg on the ' + s + ' ledge is at ' + (b ? b.x.toFixed(0) + ', ' + b.y.toFixed(0) : 'nowhere') + '; top kills pick it up at ' + want.join(', ') + ' (check A)'); }));
  ['E', 'W'].forEach((s) => { if (hyp(S.pits[s], [s === 'E' ? 106 : -106, 0]) > 4) bad('the ' + s + ' cauldron is at ' + S.pits[s].join(', ') + '; top kills throw the eggs in about ' + (s === 'E' ? 106 : -106) + ', 0 (check A)'); });
  if (T.throwAt < 226 || T.throwAt > 236) bad('the small eggs go in at ' + clkS(T.throwAt) + '; top kills put them in 3:46 to 3:56 (check A)');
  if (T.bigUp < 244 || T.bigUp > 263) bad('the big eggs are picked up at ' + clkS(T.bigUp) + '; top kills pick them up 4:04 to 4:23 (check A)');
  // (Flex, Nov 15: "i think the first healer picks it up right away, and the second one is delayed". The 30 fastest Mythic kills: the melee take the
  // south eggs first, about 4:06 to 4:10; the healers the north ones after, the first a median 4:13, the second a median 2.5 s later (middle half 1.3
  // to 4.7). Before: all four at 4:14)
  if (!script({ seed: 1 }).bigAt) bad('the big eggs have no pickup times of their own: all four at once, not the south ones first and the two healers 2.5 s apart (check A)');
  else { const firsts = new Set(); for (let seed = 1; seed <= 20; seed++) { const B = script({ seed }).bigAt, n =[B.E.close, B.W.close].sort((a, b) => a - b), sth = Math.max(B.E.far, B.W.far);
      firsts.add(B.E.close < B.W.close ? 'E' : 'W'); if (sth > n[0] - 2) { bad('the south big eggs (' + clkS(sth) + ') aren\'t picked up before the north ones (' + clkS(n[0]) + ') on seed ' + seed + '; top kills take the south ones first (check A)'); break; }
      if (n[1] - n[0] < 1.3 || n[1] - n[0] > 4.7) { bad('the two healers pick up their north eggs ' + (n[1] - n[0]).toFixed(1) + ' s apart on seed ' + seed + '; top kills: a median 2.5 s, middle half 1.3 to 4.7 (check A)'); break; }
      if ([B.E.far, B.W.far, B.E.close, B.W.close].some((x) => x < 246 || x > 263)) { bad('a big egg is picked up outside 4:06 to 4:23 on seed ' + seed + ' (check A)'); break; } }
    if (firsts.size < 2) bad('the same ledge\'s healer always picks up first over 20 runs; it should vary (check A)');
    dbg.P2.pick = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; dbg.sim(dbg.P2.slotOf(dbg.P2.pick), false, false, 6);
    dbg.S.big.forEach((B, i) => { const at = dbg.G.p2.big[i].at, want = dbg.S.bigAt[B.side][B.which]; if (at == null || at < want - 0.1 || at > want + 3) bad('the ' + (B.which === 'far' ? 'south' : 'north') + ' big egg on the ' + B.side + ' ledge is picked up at ' + (at == null ? 'never' : clkS(at)) + '; its time is ' + clkS(want) + ' (check A)'); }); }
  if (T.doomEnd - T.doom !== 90) bad('the big eggs get ' + (T.doomEnd - T.doom) + ' s to be picked up; Hatching Doom is 90 s (spell 1306862, check A)');
  // (Flex, Nov 15: "im fairly confident they [healers] are usually the ones assigned to pick up the big eggs". The 30 fastest Mythic kills in the log
  // library: the north big egg is a healer's on 45 of 46, the south one a melee's on 45 of 74; healers carry 6% of the small eggs, tanks about one
  // each. Before: a healer took each ledge's south egg, all four healers carried small eggs, and the tanks none)
  { const J0 = ctx.pgP2Jobs(3, null, null);
    ['E', 'W'].forEach((s) => { const ids = Object.keys(J0).filter((id) => J0[id].side === s), north = ids.find((id) => J0[id].big === 'close'), south = ids.find((id) => J0[id].big === 'far');
      if (!north || north[0] !== 'h') bad('the ' + s + ' ledge\'s north big egg goes to ' + north + '; top kills give it to a healer (45 of 46, check B)');
      if (!south || south[0] !== 'm') bad('the ' + s + ' ledge\'s south big egg goes to ' + south + '; top kills give it to a mobile melee most (check B)');
      const hs = ids.filter((id) => id[0] === 'h' && J0[id].egg), tk = ids.filter((id) => id[0] === 't' && J0[id].egg);
      if (hs.length) bad('healers carry small eggs on the ' + s + ' ledge (' + hs.join(' ') + '); top kills give healers 6% of them (check B)');
      if (tk.length !== 1) bad('the ' + s + ' ledge\'s tank carries ' + tk.length + ' small eggs; top kills give each tank about one (check B)'); }); }
  // B. the tethers, over 40 runs
  let tanks = 0; for (let seed = 1; seed <= 40; seed++) { const J = ctx.pgP2Jobs(seed, null, null), ids = Object.keys(J).filter((id) => J[id].teth), solo = ids.filter((id) => J[id].teth === 'solo');
    if (ids.length !== 6 || ids.filter((id) => J[id].side === 'E').length !== 3 || solo.length !== 1) { bad('Grasping Fangs gives ' + ids.length + ' tethers (' + ids.filter((id) => J[id].side === 'E').length + ' east) and ' + solo.length + ' solo on seed ' + seed + '; Mythic has six, three a ledge, one breaking alone (check B)'); break; }
    if (ids.some((id) => id[0] === 't')) tanks++; }
  if (!tanks) bad('no tank got a tether in 40 runs; on top kills they land on any role, tanks too (check B)');
  // (the tethers land at 3:16 on the game's clock, about 1.4 s before the logs' cast event at 3:17.4, so the solo sits about 8.3 + 1.4 s after it)
  if (T.five - T.solo < 6 || T.five - T.solo > 10) bad('the five break ' + (T.five - T.solo) + ' s after the solo; top kills break them about 8 s apart (middle half 7.5 to 9.2, check B)');
  if (T.solo - T.fangs < 7.5 || T.solo - T.fangs > 12) bad('the solo breaks ' + (T.solo - T.fangs) + ' s after the tethers land; top kills break it about 8 s after (middle half 6.9 to 9.3 from the cast event, check B)');
  if (T.five - T.fangs < 15.5 || T.five - T.fangs > 19.5) bad('the five break ' + (T.five - T.fangs) + ' s after the tethers land; top kills break them about 17 s after (check B)');
  if (/break alone at 3:18|solo break is at 3:18|at 3:18, alone/.test(rd('practice-p2.js'))) bad('a text still puts the solo break at 3:18 (check B)');
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
    // (a melee who picks the 3rd Malice and one of the five is told on the card: they can't kick from the end of a tether. The solo walks out at 3:26,
    // between the 2nd and 3rd Malice, so the 2nd Malice and the solo break go together, for melee too (Main, Nov 15))
    dbg.P2.pick = { side: 'W', role: 'm', egg: 'n4', mal: 3, cry: 1, teth: 'five' }; if (!/Heads up: the 3rd Malice/.test(dbg.P2.clash())) bad('a melee picking the 3rd Malice and one of the five isn\'t told they clash (check D)');
    dbg.P2.pick = { side: 'W', role: 'm', egg: 'n4', mal: 2, cry: 1, teth: 'solo' }; if (dbg.P2.clash()) bad('a melee picking the 2nd Malice (3:18) and the solo break (3:26) is told they clash; they don\'t (check D)');
    dbg.P2.pick = { side: 'W', role: 'r', egg: 'n4', mal: 3, cry: 1, teth: 'five' }; if (dbg.P2.clash()) bad('a ranged kicker (30 yards) is told the 3rd Malice clashes with the five (check D)');
    // (and played: a west melee with the 2nd Malice and the solo break kicks at 3:18, then breaks alone on the count, clean)
    { const pkM = { side: 'W', role: 'm', egg: 'n4', mal: 2, cry: 1, teth: 'solo' }; dbg.P2.pick = pkM; const rM = dbg.sim(dbg.P2.slotOf(pkM), true, false, 3); if (rM.log.length) bad('a west melee with the 2nd Malice and the solo break, played by the autopilot, makes mistakes: ' + rM.log.join(' | ') + ' (check D)'); }
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
    // (the review, Nov 15: your walk to the end of the tether started 2.8 s before the break, the bots' pace; you walk slower while tethered, so an
    // east melee in the five, following the arrow, broke late at 3:36, and starting at 3:36 left the tether unbreakable in time)
    const pk3 = { side: 'E', role: 'm', egg: 'far', mal: 1, cry: 1, teth: 'five' }; dbg.P2.pick = pk3; const me3 = dbg.P2.slotOf(pk3), r3 = dbg.sim(me3, true, false, 2);
    if (r3.log.some((x) => /tether late/.test(x))) bad('an east melee in the five, played by the autopilot (the same way the arrow points), breaks late: ' + r3.log.join(' | ') + ' (check D)');
    // (Nov 15, the wider audit: the solo break played by the autopilot (and so the arrow) walked out round the Warden from a ranged spot and broke at
    // 3:22, after the count's 3:21.5)
    const pkS = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'solo' }; dbg.P2.pick = pkS; const meS = dbg.P2.slotOf(pkS), rS = dbg.sim(meS, true, false, 9);
    if (rS.log.some((x) => /tether (late|early)/.test(x))) bad('the solo break, played by the autopilot from a ranged spot (the way the arrow points), misses the count: ' + rS.log.join(' | ') + ' (check D)');
    dbg.P2.pick = pk3;
    dbg.at(216.2, me3, { east: false, seed: 2 }); const th3 = dbg.G.p2.teth[me3]; if (th3 && th3.br == null) bad('starting at "3:36 · The small eggs" as one of the five leaves your tether unbroken past the count (check D)');
    // (the review, Nov 15: a melee who picked the 3rd Malice with a random tether was sometimes dealt one of the five, and kept both, which can't be done)
    const pk4 = { side: 'E', role: 'm', egg: 'n4', mal: 3, cry: 1, teth: 'random' }, me4 = dbg.P2.slotOf(pk4); let both = 0;
    for (let seed = 1; seed <= 60; seed++) { const J4 = ctx.pgP2Jobs(seed, me4, pk4); if (J4[me4].teth === 'five' && J4[me4].mal === 3) both++; }
    if (both) bad('a melee with the 3rd Malice and a random tether keeps both when dealt one of the five (' + both + ' of 60 seeds); that kick should go to someone free (check D)');
  } catch (e) { bad('the picked job crashed the game: ' + e.message + ' (check D)'); }
  // E. the mistakes
  try {
    const pk = { side: 'E', role: 'm', egg: 'n2', mal: 1, cry: 0, teth: 'none' }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk);
    const stillR = dbg.sim(me, false, false, 3), still = stillR.log.join(' | ');
    // (the review, Nov 15: an unkicked Malice did 13 a tick; the notes measure about 650k a player a tick, close to half a raider's health, so
    // six ticks kill: the run that never kicks the 3:03 Malice dies in its channel)
    if (!stillR.deaths.some((c) => c >= '3:05' && c <= '3:11')) bad('missing the 3:03 Malice kick doesn\'t kill you in its channel (deaths: ' + (stillR.deaths.join(', ') || 'none') + '); its ticks are about 650k each (check E)');
    if (!/never crossed to your ledge/.test(still)) bad('standing still on the platform isn\'t a mistake ("never crossed"): ' + still + ' (check E)');
    if (!/didn't kick Malice \(3:03\)/.test(still)) bad('the 3:03 Malice kicker who never kicks gets no mistake: ' + still + ' (check E)');
    if (!(dbg.grade().sc < 80)) bad('standing still all of phase 2 scores ' + dbg.grade().sc + ' (check E)');
    // (the review, Nov 15: an east-half raider who walked into the west gate landed beside the west ledge's own gate, which sent them straight back,
    // and on and on, with a "wrong gate" mistake every tick)
    dbg.at(167.5, me, { east: false, seed: 3 }); const gw = dbg.S.gates.find((g) => g.side === 'W' && !g.back); dbg.pos = gw.p.slice(); dbg.step(20);
    const wrongN = dbg.log.filter((x) => /You took the west gate/.test(x)).length; if (wrongN !== 1 || dbg.G.p2.where[me] !== 'L' || dbg.G.p2.wside[me] !== 'W') bad('the wrong gate gives ' + wrongN + ' mistakes in a second and leaves you ' + dbg.G.p2.where[me] + ' ' + dbg.G.p2.wside[me] + '; it should be one mistake, on the west ledge (check E)');
    // (the review, Nov 15: the words said "the purple ring", but in 3D your own gate is the gold one, the purple one the other half's)
    if (/purple ring/.test(rd('practice-p2.js'))) bad('a text still calls your gate "the purple ring"; in 3D yours is gold (check E)');
    dbg.at(183.5, me, { east: false, seed: 3 }); const W = dbg.G.p2.wd.E; dbg.pos = [W[0] - 3, W[1] - 3]; dbg.kick(); if (dbg.G.p2.kick.mE1 !== me) bad('pressing E by the Warden in its 3:03 Malice cast doesn\'t kick it (check E)');
    dbg.at(200, me, { east: false, seed: 3 }); const e0 = dbg.G.eggs.find((e) => e.side === 'E'); dbg.pos = [e0.x - 3, e0.y]; dbg.step(2); if (!dbg.log.some((x) => /Warden's Protection/.test(x))) bad('standing 3 yards from an egg while its Warden lives isn\'t a mistake (check E)');
    const pkT = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'five' }; dbg.P2.pick = pkT; const meT = dbg.P2.slotOf(pkT); dbg.at(205, meT, { east: false, seed: 3 }); const WT = dbg.G.p2.wd.E;
    dbg.pos = [WT[0] + 20, WT[1] - 20]; dbg.step(3); if (!dbg.log.some((x) => /broke your tether early/.test(x))) bad('one of the five walking out of their tether at 3:25 isn\'t "broke your tether early": ' + dbg.log.join(' | ') + ' (check E)');
    const pkB = { side: 'E', role: 'h', egg: 'far', mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pkB; const meB = dbg.P2.slotOf(pkB); dbg.at(232, meB, { east: false, seed: 3 }); const B = dbg.S.big.find((b) => b.side === 'E' && b.which === 'far');
    dbg.pos = [B.x, B.y]; dbg.step(2); if (!dbg.log.some((x) => /big egg with small eggs still out/.test(x))) bad('picking up the big egg at 3:52, with the small eggs still out, isn\'t a mistake: ' + dbg.log.join(' | ') + ' (check E)');
  } catch (e) { bad('the mistakes crashed the game: ' + e.message + ' (check E)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // (the start card's "Your job in short" (Nov 15, Flex: "improve the setup screens. Still a little convoluted"): three or four plain lines for the
  // picked job, naming your ledge, your egg and kicks, your tether and the heart)
  try { dbg.P2.pick = { side: 'W', role: 'm', egg: 'close', mal: 2, cry: 1, teth: 'five' }; const sh = typeof dbg.P2.short === 'function' ? dbg.P2.short() : '', li = (sh.match(/<li>/g) || []).length;
    if (!/^<ul class="pg-short">/.test(sh) || li < 3 || li > 4) bad('phase 2\'s "your job in short" isn\'t a pg-short list of three or four lines (' + li + ', check F)');
    else if (!/West ledge/.test(sh) || !/north big egg/.test(sh) || !/2nd Malice \(3:18\)/.test(sh) || !/out with the five at 3:34/.test(sh) || !/heart/.test(sh)) bad('phase 2\'s "your job in short" doesn\'t name the picked ledge, egg, kick, tether and the heart: ' + sh.replace(/<[^>]+>/g, ' | ') + ' (check F)'); }
  catch (e) { bad('phase 2\'s "your job in short" crashed: ' + e.message + ' (check F)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // S. the shared setup screen (Nov 15, Flex via Main: "fix the setup menus ... still too complex and confusing"): phase 2 hands the card `setup` (roles,
  //    2 to 4 plain jobs a role with the default first, now/set/say), and a job set there is the one the run plays: Kick Malice gives you the 1st Malice,
  //    Kick the Cry a Doomscale's Cries, a big egg the healer's north one or the melee's south one, the tether at random; healers get no kick or small egg
  try { const su = dbg.P2.setup;
    if (!su || typeof su.now !== 'function' || typeof su.jobs !== 'function' || typeof su.set !== 'function' || typeof su.say !== 'function') bad('phase 2 gives the setup screen no setup (roles, now, jobs, set, say) (check S)');
    else {
      if (JSON.stringify(su.roles) !== '["m","r","h"]') bad('phase 2\'s setup roles are ' + JSON.stringify(su.roles) + ', not melee, ranged and healer (check S)');
      su.roles.forEach((r) => { const J0 = su.jobs(r); if (J0.length < 2 || J0.length > 4) bad('phase 2\'s setup offers ' + J0.length + ' jobs to ' + r + ' (2 to 4, check S)');
        if (r === 'h' && J0.some(([v]) => v === 'mal' || v === 'cry' || v === 'egg')) bad('phase 2\'s setup offers a healer a kick or a small egg (Midnight healers have no kick; healers carry no small eggs on the kills) (check S)');
        J0.forEach(([v, label]) => { su.set(r, v); const nw = su.now(), pk = dbg.P2.pick, me = dbg.P2.slotOf(pk);
          if (nw.role !== r || nw.job !== v) bad('phase 2\'s setup set ' + r + '/' + v + ' but now() says ' + nw.role + '/' + nw.job + ' (check S)');
          if (pk.teth !== 'random') bad('phase 2\'s setup gives ' + r + '/' + v + ' a fixed tether (' + pk.teth + '), not a random one like the real fight (check S)');
          if (dbg.P2.role().id !== me || me[0] !== r) bad('phase 2\'s setup ' + r + '/' + v + ' plays as ' + dbg.P2.role().id + ' (check S)');
          const say = su.say(); if (!/^[A-Z].*\.$/.test(say) || /\. [A-Z]/.test(say) || /went wrong/i.test(say)) bad('phase 2\'s setup sentence for ' + r + '/' + v + ' isn\'t one plain sentence: ' + say + ' (check S)');
          dbg.at(166.05, me, { east: false, seed: 3 }); const j = dbg.S.job[me], want = { mal: j.mal === 1 && !j.egg && !j.big, cry: j.cry > 0 && !j.mal && !j.egg && !j.big, egg: j.egg > 0 && !j.big && !j.mal && !j.cry, big: j.big === (r === 'h' ? 'close' : 'far') && !j.mal && !j.cry, none: !j.egg && !j.big && !j.mal && !j.cry }[v];
          if (!want) bad('phase 2\'s setup ' + r + '/' + v + ' (' + label + ') plays a run with the job ' + JSON.stringify(j) + ' (check S)'); }); });
      su.set('r', 'egg'); if (su.now().job !== 'egg') bad('phase 2\'s setup doesn\'t keep the default ranged small egg (check S)');
      su.set('h', 'mal'); if (su.now().job !== 'big') bad('phase 2\'s setup takes a kick job for a healer instead of the default (check S)'); } }
  catch (e) { bad('phase 2\'s setup crashed: ' + e.message + ' (check S)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // I. hitting the right thing (Nov 15, Flex: "can we look at adding the dps mechanics in"): your ledge's Warden while it lives, the Weakened
  //    Doomscales from 4:29, the heart from 4:55, any Viper first; Tab or a click picks, melee 5 yards, others 40; a moment mostly on it counts, a
  //    miss is one line, the end card says "Right target: N of M". (Before: phase 2 had no targets; Tab did nothing in it)
  try {
    const pkI = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pkI; const meI = dbg.P2.slotOf(pkI);
    [[200, 'warden'], [275, 'ds'], [300, 'heart']].forEach(([t0, cat]) => { dbg.at(t0, meI, { east: false, seed: 3 }); const c = dbg.P2.dpsCat(dbg.G.t), L0 = dbg.P2.tgts(dbg.G.t);
      if (c !== cat) bad('at ' + clkS(t0) + ' the damage moment is ' + c + ', not ' + cat + ' (check I)'); if (!L0.some((o) => o.kind === cat)) bad('at ' + clkS(t0) + ' there is no ' + cat + ' to pick (check I)'); });
    for (const [pk, east] of [[{ side: 'E', role: 'm', egg: 'n4', mal: 1, cry: 1, teth: 'none' }, true], [{ side: 'W', role: 'm', egg: null, mal: 0, cry: 2, teth: 'none' }, false], [{ side: 'W', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }, true], [{ side: 'E', role: 'h', egg: 'close', mal: 0, cry: 0, teth: 'random' }, false]]) {
      dbg.P2.pick = pk; const r = dbg.sim(dbg.P2.slotOf(pk), true, east, 4), DL = (dbg.G.dpsM && dbg.G.dpsM.list) || [], tag = pk.side + ' ' + pk.role + (east ? ', she is east' : ', she is west');
      ['warden', 'ds', 'heart'].forEach((k) => { const m = DL.find((q) => q.kind === k); if (!m || m.fr < 0.5) bad('the autopilot (' + tag + ') isn\'t on the ' + k + ' for its moment (' + (m ? Math.round(m.fr * 100) + '%' : 'no moment') + ', check I)'); });
      if (r.log.some((x) => /was up|were up|was open/.test(x))) bad('the autopilot (' + tag + ') misses a damage moment: ' + r.log.join(' | ') + ' (check I)');
      if (!(dbg.G.hits >= 20)) bad('the autopilot (' + tag + ') pressed 1 only ' + (dbg.G.hits || 0) + ' times in phase 2; a moment counts only while you keep pressing (check I)');
      if (dbg.P2.dpsNames(DL) !== 'the Warden, the Doomscales, the heart') bad('the end card names the moments "' + dbg.P2.dpsNames(DL) + '" (check I)'); }
    dbg.P2.pick = pkI; const st = dbg.sim(meI, false, false, 4).log.join(' | ');
    ['The Warden was up', 'The Doomscales were up', 'The heart was open'].forEach((x) => { if (!st.includes(x)) bad('standing still all phase, "' + x + '" isn\'t in the mistakes (check I)'); });
    // (Nov 15, the press-to-cast attack: a moment counts only while you keep pressing 1; the job line says so, as phase 1's does)
    dbg.P2.pick = pkI; dbg.at(200, meI, { east: false, seed: 3 }); dbg.G.tgt = null; const hint = dbg.P2.jobText(); if (!/Tab to pick it, then keep pressing 1 to hit it/.test(hint)) bad('at 3:20 with no target, phase 2\'s job line reads "' + hint + '"; it should say Tab to pick the Warden, then keep pressing 1 (check I)');
    const PJ0 = rd('practice.js'); if (/e\.code === 'Tab' && !P2/.test(PJ0) || /const dpsStep = \(t, dt\) => \{ if \(P2\) return/.test(PJ0) || /const pickTgtAt = \(p\) => \{ if \(P2/.test(PJ0)) bad('Tab, a click or the damage tally is still off in phase 2 (check I)');
  } catch (e) { bad('the damage moments crashed phase 2: ' + e.message + ' (check I)'); }
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
    // (the review, Nov 15: a click on a ledge's outer stone did nothing, since the 3D view dropped any floor click past 140 yards, phase 1's platform's size)
    const far = []; for (let x = 120; x <= 165; x += 5) for (let y = -60; y <= 60; y += 10) if (ctx.pgP2Floor(x, y) && Math.hypot(x, y) > 140) far.push([x, y]);
    const P3 = rd('practice3d.js'), lim = /Math\.hypot\(p\.x, p\.z\) > \(A\.P2 \? (\d+) : 140\)/.exec(P3); if (far.length && (!lim || far.some((q) => Math.hypot(q[0], q[1]) > +lim[1]))) bad('in 3D a click on a ledge\'s outer stone (' + far.length + ' spots past 140 yards, e.g. ' + far[0].join(', ') + ') doesn\'t walk you there (check G)');
    if (!/A\.P2\.shapes\(t, P,/.test(P3) || !/P2K && P2K\.put\(s, t\)/.test(P3) || !/typeof pg3dP2 === 'function'/.test(P3)) bad('practice3d.js no longer hands phase 2 its shapes and pieces (check G)');
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
