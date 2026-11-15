// The Ula'tek practice game's phase 3 (src/practice-p3.js, Nov 15; Flex: "have a new chat start building phase 3 as well"), run in Node the same way
// tests/practice-p2.js runs phase 2: the real game code with a do-nothing page. Runs on every build (tests/contradictions.js); `node tests/practice-p3.js`
// runs it alone (`--audit` prints the bots' audit for more runs).
// This fails if:
//   A. the clock isn't the measured Mythic one: the notes' "After phase 1, measured" clock (her Call 6:17 landing 6:21, Mother's Wrath 6:27, 7:52 and
//      9:00, Serpent's Bite 6:37, 7:41 and 9:25, her waves 7:02, 7:57, 8:47 and 9:31, the Wretch 7:09 and its bubble 7:45, Circling Prey 7:12, 8:03 and
//      9:04, the beam 7:15, the Shriekers 8:30, Rage of the Shackled 9:37), read out of the notes themselves; and the 17 top Mythic kills since the Nov
//      6 hotfix (C:/Users/james/DebriefLogs, Nov 15): the heart 9:43.6, the kill 9:51, the bites' 5 s cast and 15 s venom, Circling Prey's 8 s cast;
//   B. the counts or places aren't the logs': two red circles a set on one melee and one ranged DPS (48 of 51 sets; never a tank or healer), three
//      soakers (36 of 51), 10 Slithering Clutches (4 at 6:22, 4 at 6:52, 2 at 8:30; the notes' "20 a kill" counted each clutch twice), two Shriekers,
//      her four corners (33.4, 31.4) (-33.1, 32.7) (-33.5, -32) (32.8, -32) moving counter-clockwise from any first quarter, the whole raid stacked on her
//      quarter (the guide's picture had ranged and healers on the next one), the bites stacked at (10.2, 30.3), (26.8, 16.1) and (23.5, 24.9) and the
//      heart at (29, 28) in her frame, the Wretch landing on the quarter across from hers;
//   C. a bot slips: on her quarter as Circling Prey lands, outside the bubble, a bite turned to stone, a Vicious Echoes not kicked, not on her quarter
//      as phase 3 begins, the off tank out of the beam, her tank out of her reach, off the stone. (Found while building it, Nov 15: her waves' 3-yard
//      gaps left nowhere to stand, so the bots fled across the central hole into the venom; a raider who brushed a red circle for one step was taken as
//      a soaker; a bot in a crack forgot which quarter it came from and walked straight over the hole; the gateway onto her quarter closed at 6:21,
//      before a player could reach it after the countdown.)
//   D. your picked job isn't the one you play, or a soak set or a Shrieker loses or doubles its job when it's swapped in; "Yes, once" doesn't give you
//      exactly one red circle in a set you don't soak, "Never" gives you one; the autopilot doesn't play picked jobs clean;
//   E. the mistakes don't land: standing still (late onto her quarter, a soak missed so the bite turns to stone, Fester Burst, her quarter breaking
//      under you), a red circle not walked to the stack, a soak without a defensive, a Purge burst in the raid, an unkicked Vicious Echoes, a soak
//      that isn't yours; or a clean run doesn't score 100;
//   F. the part isn't on the start card's Part switch, `?practice=3` doesn't open it, build.ps1 doesn't check and read src/practice-p3.js after
//      practice-p2.js, or practice.js and practice3d.js lose their small phase 3 hooks (the shared dodge, the start card's line, the score link's
//      `?practice=3`, the 3D kit with the platform it hides);
//   G. the 3D view doesn't draw phase 3's own shapes where its hits are (the bites' 7 yards, the Purge's 5, the bubble's 10, the heart's 4.5, the four
//      quarters sinking as they break, the gateways, the clutches, the Shriekers);
//   H. phase 1 or phase 2 changes with this file loaded;
//   I. the damage moments: the clutches once gripped in, the Wretch, the Shriekers and the heart at their times; the autopilot hits each, standing
//      still misses them, a soaker busy with their soak isn't told they missed one, and the end card names them;
//   J. the floor isn't the broken platform's: four quarters, the cracks between two standing quarters wadeable, a quarter gone once she breaks it.
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
  vm.runInContext(H.grab('esc') + '\n' + fromGuides + '\n' + rd('practice.js') + '\n' + rd('practice3d.js') + '\n' + rd('practice-p2.js') + '\n' + rd('practice-p3.js') +
    '\nthis.PG_P3 = PG_P3; this.PG_P3_T = PG_P3_T; this.pgP3Script = pgP3Script; this.pgP3Jobs = pgP3Jobs; this.pgP3Mask = pgP3Mask; this.pgP3Floor = pgP3Floor; this.pgP3Q = pgP3Q; this.pgP3R = pgP3R; this.PG_PARTS = PG_PARTS; this.pg3dShapes = pg3dShapes; this.pgPart = pgPart;', ctx);
  vm.runInContext('pgOpen(null, "Ula\'tek", "m"' + (part ? ', "' + part + '"' : '') + ')', ctx);
  return { dbg: win.__pgDbg, ctx };
}
const clkS = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const SERIOUS = /on her quarter at Circling Prey|outside the bubble|turned to stone|not kicked|not on her quarter at 6:23|not in the beam|out of her reach|off the platform/;
const PK0 = { role: 'r', soak: 1, bite: 'random', kick: 0 };
// (seeds that give each first quarter: her first quarter comes from the run's seed)
const seedFor = (ctx, q) => { for (let s = 1; s < 200; s++) if (ctx.pgP3Script({ seed: s }).q1 === q) return s; return 1; };

function checks(H, say) {
  const bad = (t) => say("Ula'tek practice game, phase 3", 'phase 3', t);
  let L; try { L = load(H, 'm3'); } catch (e) { bad('the game would not run phase 3 in the test (' + e.message + ')'); return; }
  const { dbg, ctx } = L, T = ctx.PG_P3_T, P = ctx.PG_P3, script = ctx.pgP3Script, hyp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  if (!dbg || !dbg.P2 || dbg.P2.part !== 3) { bad('opening the phase 3 part gives no phase 3 game (PG_PARTS["Ula\'tek"].m3 with its mod, check F)'); return; }
  const reset = () => { try { dbg.P2.pick = PK0; } catch (e) { /* (no part) */ } };
  // A. the clock, against the notes' own measured times
  const notes = fs.readFileSync(path.join(__dirname, '..', 'notes', 'Guides', 'Bosses', "8 Ula'tek.md"), 'utf8');
  const clockLine = (notes.split('\n').find((l) => l.startsWith('**The Mythic clock after phase 1')) || '');
  const want = (what, re, got, tol) => { const m = re.exec(clockLine); if (!m) { bad('the notes no longer say ' + what + ' in "After phase 1, measured" (check A)'); return; } const exp = m.slice(1).reduce((a, v, i, arr) => (i % 2 ? a : a.concat([+arr[i] * 60 + +arr[i + 1]])), []);
    if (got.length !== exp.length || got.some((v, i) => Math.abs(v - exp[i]) > (tol || 0.6))) bad(what + ' at ' + got.map(clkS).join(', ') + ' in the game; the measured clock has ' + exp.map(clkS).join(', ') + ' (check A)'); };
  const S = script({ seed: 3 }), cs = (n) => S.casts.filter((c) => c.name === n).map((c) => c.t0);
  want('her Call of the Serpent', /her Call of the Serpent (\d):(\d\d), lands (\d):(\d\d)/, [cs('Call of the Serpent')[0], cs('Call of the Serpent')[0] + 4]);
  want('the second and third Call', /second Call (\d):(\d\d).*· Call (\d):(\d\d), two Shriekers/, [cs('Call of the Serpent')[1], cs('Call of the Serpent')[2]]);
  want('Mother\'s Wrath', /lands \d:\d\d \(phase 3\) · Mother's Wrath (\d):(\d\d).*· Mother's Wrath (\d):(\d\d).*· Mother's Wrath (\d):(\d\d)/, S.wrath.map((w) => w.at));
  want('Serpent\'s Bite', /Serpent's Bite (\d):(\d\d).*· Serpent's Bite (\d):(\d\d).*· Serpent's Bite (\d):(\d\d)/, S.bites.map((b) => b.b0));
  want('her waves', /her waves (\d):(\d\d).*· her waves (\d):(\d\d).*· her waves (\d):(\d\d).*· her waves (\d):(\d\d)/, cs('Caustic Waves'));
  want('the third Wretch', /third Wretch (\d):(\d\d)/, [S.wretch.land]); want('the Wretch\'s bubble', /Wretch's bubble (\d):(\d\d)/, [S.wretch.fb[0].at]);
  want('Circling Prey', /Circling Prey (\d):(\d\d).*· Circling Prey (\d):(\d\d).*· Circling Prey (\d):(\d\d)/, cs('Circling Prey'));
  want('the beam', /beam (\d):(\d\d) · Serpent's Bite/, [cs('Toxic Incubation')[0]]); want('the Shriekers', /two Shriekers (\d):(\d\d)/, [S.shriekers[0].up]);
  want('Rage of the Shackled', /Rage of the Shackled (\d):(\d\d)\. The intermission/, [cs('Rage of the Shackled')[0]]);
  if (Math.abs(T.heart - 583.6) > 0.5) bad('the heart opens at ' + clkS(T.heart) + '; the 17 kills open it at 9:43.6 (check A)');
  if (Math.abs(T.end - 591.4) > 1) bad('the part ends at ' + clkS(T.end) + '; the 17 kills end at 9:50 to 9:52 (check A)');
  if (T.biteCast !== 5 || T.venom !== 15 || T.preyCast !== 8 || T.wavesCast !== 4.5) bad('a cast is the wrong length: the bite ' + T.biteCast + ' s (5), its venom ' + T.venom + ' s (15), Circling Prey ' + T.preyCast + ' s (8), her waves ' + T.wavesCast + ' s (4.5) (check A)');
  // B. the counts and places
  { let tgBad = 0, soBad = 0, cl = null; const qs = new Set();
    for (let seed = 1; seed <= 40; seed++) { const S2 = script({ seed }); qs.add(S2.q1); S2.bites.forEach((b) => { const r = b.tg.map((id) => id[0]).sort().join(''); if (r !== 'mr') tgBad++; if (b.so.length !== 3) soBad++; }); const n = [0, 1, 2].map((ci) => S2.clutches.filter((c) => c.ci === ci).length).join(','); if (cl == null) cl = n; else if (cl !== n) cl = 'varies'; }
    if (tgBad) bad(tgBad + ' bite sets in 40 runs aren\'t one melee and one ranged DPS; since the Nov 6 hotfix the two red circles land on a melee and a ranged (48 of 51 sets, check B)');
    if (soBad) bad(soBad + ' bite sets in 40 runs don\'t have three soakers; top kills clear them with three (36 of 51 sets, check B)');
    if (cl !== '4,4,2') bad('the Calls bring ' + cl + ' Slithering Clutches; the 17 kills have 4 at 6:22, 4 at 6:52 and 2 at 8:30 (10 a kill, check B)');
    if (qs.size !== 4) bad('her first quarter is only ever ' + [...qs].join(', ') + ' in 40 runs; on the kills it is any of the four (check B)'); }
  [[0, [33.4, 31.4]], [1, [-33.1, 32.7]], [2, [-33.5, -32]], [3, [32.8, -32]]].forEach(([k, p]) => { if (hyp(P.her[k], p) > 1) bad('her ' + P.QN[k] + ' corner is at ' + P.her[k].join(', ') + '; the kills have her at ' + p.join(', ') + ' (check B)'); });
  if (S.Qs.some((q, n) => n && q !== (S.Qs[n - 1] + 1) % 4)) bad('her quarters go ' + S.Qs.join(' > ') + '; she moves counter-clockwise, one quarter each Circling Prey (check B)');
  if (S.shriekers.length !== 2) bad(S.shriekers.length + ' Shriekers; every kill has two at 8:30 (check B)');
  [[0, [10.2, 30.3]], [1, [26.8, 16.1]], [2, [23.5, 24.9]]].forEach(([i, p]) => { if (hyp(P.stack[i], p) > 1.5) bad('bite ' + (i + 1) + ' stacks at ' + P.stack[i].join(', ') + ' in her frame; the kills stack it at ' + p.join(', ') + ' (check B)'); });
  if (hyp(P.heart, [29, 28]) > 1.5) bad('the heart is at ' + P.heart.join(', ') + ' in her frame; the kills have it at 29, 28 (check B)');
  if (ctx.pgP3Q(...S.wretch.p0) !== (S.Qs[0] + 2) % 4) bad('the Wretch lands on quarter ' + ctx.pgP3Q(...S.wretch.p0) + ', not the one across from hers (' + (S.Qs[0] + 2) % 4 + '), as on all 17 kills (check B)');
  // (the whole raid on her quarter: the guide's picture had ranged and healers on the next one; the kills have all 20 on hers)
  try { dbg.P2.pick = PK0; dbg.at(395, dbg.P2.slotOf(PK0), { seed: 3 }); const q = dbg.S.Qs[0], off = Object.keys(dbg.G.bots).filter((id) => id !== dbg.role.id && ctx.pgP3Q(dbg.G.bots[id].x, dbg.G.bots[id].y) !== q);
    if (off.length) bad('at 6:35 ' + off.length + ' raiders aren\'t on her quarter (' + off.join(' ') + '); on the kills the whole raid stacks on it (check B)'); } catch (e) { bad('the raid\'s spots crashed: ' + e.message + ' (check B)'); }
  // J. the floor
  { const M = ctx.pgP3Mask(), n = [0, 1, 2, 3].map((k) => M.q.filter((v) => v === k).length), cracks = M.ck.filter((v) => v >= 0).length;
    if (n.some((v) => v < 500)) bad('the broken platform\'s quarters are ' + n.join(', ') + ' yards of stone; each is about 800 (check J)');
    if (cracks < 60) bad('only ' + cracks + ' yards of crack can be waded between quarters (check J)');
    P.cross.forEach((c, p) => { if (!ctx.pgP3Floor(c[0], c[1], [1, 1, 1, 1])) bad('the crossing between quarters ' + p + ' and ' + (p + 1) % 4 + ' (' + c.join(', ') + ') isn\'t wadeable while both stand (check J)'); const al = [1, 1, 1, 1]; al[p] = 0; if (ctx.pgP3Floor(c[0], c[1], al)) bad('the crossing ' + c.join(', ') + ' is still wadeable with quarter ' + p + ' gone (check J)'); });
    P.her.forEach((h, k) => { if (ctx.pgP3Floor(h[0], h[1], [1, 1, 1, 1])) bad('her ' + P.QN[k] + ' corner (' + h.join(', ') + ') is on the stone; she stands in the venom at the corner (check J)'); });
    try { dbg.at(445, dbg.P2.slotOf(PK0), { seed: 3 }); const q0 = dbg.S.Qs[0], c = ctx.pgP3R([20, 20], q0); if (dbg.P2.onPlat(c[0], c[1])) bad('her first quarter is still stone after the first Circling Prey (check J)'); } catch (e) { bad('the floor after Circling Prey crashed: ' + e.message + ' (check J)'); } }
  // C. the bots, played: a raider with no soak, no red circle and no kick as you, so every job is a bot's
  const free = { role: 'r', soak: 0, bite: 'no', kick: 0 };
  try { dbg.P2.pick = free; for (const q of [0, 1, 2, 3]) { const seed = seedFor(ctx, q); dbg.audit(false, seed).filter((x) => SERIOUS.test(x)).forEach((x) => bad('a bot slips: ' + x + ' (her first quarter ' + P.QN[q] + ', seed ' + seed + ', check C)')); } }
  catch (e) { bad('the bots\' audit crashed: ' + e.message + ' (check C)'); } finally { reset(); }
  // D. your picked job
  try {
    const pk = { role: 'm', soak: 2, bite: 'no', kick: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk);
    if (me[0] !== 'm' || me === 'm4') bad('a melee pick plays as ' + me + ', not a melee off the grips (check D)');
    // (the jobs are dealt by pgP3Jobs before the fight: read them straight from it, the same deal the script makes)
    const jb = ctx.pgP3Jobs(3, me, pk), J = jb.J, j = J[me];
    if (!j.sk.includes(2) || j.kick !== 2) bad('the picked job (the 2nd bite, Shrieker 2) plays as ' + JSON.stringify(j) + ' (check D)');
    [1, 2, 3].forEach((n) => { const k = Object.keys(J).filter((id) => J[id].sk.includes(n)).length; if (k !== 3) bad('bite ' + n + ' has ' + k + ' soakers after the pick, not 3 (check D)'); });
    [1, 2].forEach((k) => { const c = Object.keys(J).filter((id) => J[id].kick === k).length; if (c !== 1) bad('Shrieker ' + k + ' has ' + c + ' kickers after the pick, not 1 (check D)'); });
    for (let seed = 1; seed <= 30; seed++) if (ctx.pgP3Jobs(seed, me, pk).tg.some((L) => L.includes(me))) { bad('"Never" still gives you a red circle (seed ' + seed + ', check D)'); break; }
    if (script({ seed: 3, me, pick: pk }).bites.some((b) => b.tg.includes(me))) bad('"Never" still gives you a red circle in the fight (check D)');
    for (const pk2 of [{ role: 'r', soak: 3, bite: 'yes', kick: 1 }, { role: 'm', soak: 0, bite: 'yes', kick: 0 }]) { dbg.P2.pick = pk2; const me2 = dbg.P2.slotOf(pk2); for (let seed = 1; seed <= 12; seed++) { const d2 = ctx.pgP3Jobs(seed, me2, pk2), mine = d2.tg.map((L, i) => (L.includes(me2) ? i + 1 : 0)).filter(Boolean);
      if (mine.length !== 1 || d2.J[me2].sk.includes(mine[0])) { bad('"Yes, once" gives ' + JSON.stringify(pk2) + ' ' + mine.length + ' red circles on seed ' + seed + (mine[0] && d2.J[me2].sk.includes(mine[0]) ? ', in a set they soak' : '') + ' (check D)'); break; } } }
    for (const [pk3, seed] of [[{ role: 'r', soak: 1, bite: 'no', kick: 0 }, 3], [{ role: 'h', soak: 3, bite: 'no', kick: 0 }, seedFor(ctx, 0)], [{ role: 'r', soak: 0, bite: 'random', kick: 2 }, seedFor(ctx, 2)]]) {
      dbg.P2.pick = pk3; const r = dbg.sim(dbg.P2.slotOf(pk3), true, false, seed); if (r.log.length) bad('the autopilot playing ' + JSON.stringify(pk3) + ' (seed ' + seed + ') makes mistakes: ' + r.log.join(' | ') + ' (check D)'); else if (dbg.grade().sc !== 100) bad('a clean run scores ' + dbg.grade().sc + ', not 100 (check E)'); }
  } catch (e) { bad('the picked job crashed the game: ' + e.message + ' (check D)'); } finally { reset(); }
  // E. the mistakes
  try {
    const pk = { role: 'r', soak: 1, bite: 'no', kick: 0 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), seed = seedFor(ctx, 1);
    const st = dbg.sim(me, false, false, seed).log.join(' | ');
    if (!/weren't on her quarter when phase 3 began/.test(st)) bad('standing still where the raid landed isn\'t "not on her quarter": ' + st + ' (check E)');
    if (!/didn't soak Serpent's Bite 1/.test(st)) bad('the 1st bite\'s soaker who never soaks gets no mistake: ' + st + ' (check E)');
    if (!/outside the Wretch's bubble/.test(st)) bad('standing still through Fester Burst isn\'t a mistake: ' + st + ' (check E)');
    if (!/destroyed her quarter with you on it/.test(st)) bad('staying on the quarter she breaks isn\'t a mistake (she starts north-west; the raid lands south-east, her third): ' + st + ' (check E)');
    if (!(dbg.grade().sc < 60)) bad('standing still all of phase 3 scores ' + dbg.grade().sc + ' (check E)');
    // (your red circle, not walked to the stack: the soakers stand there, so it runs out and turns you to stone)
    const pkT = { role: 'm', soak: 0, bite: 'yes', kick: 0 }; dbg.P2.pick = pkT; const meT = dbg.P2.slotOf(pkT); dbg.at(395, meT, { seed: 3 }); const bT = dbg.S.bites.find((b) => b.tg.includes(meT));
    if (!bT) bad('"Yes, once" gave no red circle to test with (check E)'); else { dbg.at(bT.land - 0.5, meT, { seed: 3 }); const away = dbg.S.F2([18, 4], bT.n); dbg.pos = away; for (let i = 0; i < 340; i++) { dbg.pos = away; dbg.stepOwn(1); }
      if (!dbg.log.some((x) => /Serpent's Bite ran out uncleared/.test(x))) bad('a red circle left where it landed, away from the stack, doesn\'t turn to stone: ' + dbg.log.join(' | ') + ' (check E)'); }
    // (a soak without a defensive; a soak that isn't yours)
    dbg.P2.pick = { role: 'r', soak: 0, bite: 'no', kick: 0 }; const meX = dbg.P2.slotOf(dbg.P2.pick); dbg.at(402.4, meX, { seed: 3 }); const b1 = dbg.S.bites[0]; for (let i = 0; i < 400 && !(dbg.G.p3.bite[0] && dbg.G.p3.bite[0].done); i++) { dbg.pos = b1.stack.slice(); dbg.stepOwn(1); }
    if (!dbg.log.some((x) => /without being one of its soakers/.test(x))) bad('standing in a red circle that isn\'t yours isn\'t a mistake: ' + dbg.log.join(' | ') + ' (check E)');
    if (!dbg.log.some((x) => /without a defensive/.test(x))) bad('soaking to the end without a defensive isn\'t a mistake: ' + dbg.log.join(' | ') + ' (check E)');
    const mid = dbg.S.F2(P.mel, 0); for (let i = 0; i < 140; i++) { dbg.pos = mid.slice(); dbg.stepOwn(1); } if (!dbg.log.some((x) => /Volatile Purge burst on \d+ raider/.test(x))) bad('a Purge burst on the stack spot, in the raid, isn\'t a mistake: ' + dbg.log.join(' | ') + ' (check E)');
    // (Vicious Echoes not kicked by its kicker)
    const pkK = { role: 'r', soak: 0, bite: 'no', kick: 1 }; dbg.P2.pick = pkK; const meK = dbg.P2.slotOf(pkK); dbg.at(520, meK, { seed: 3 }); for (let i = 0; i < 260; i++) dbg.stepOwn(1);
    if (!dbg.log.some((x) => /didn't kick Vicious Echoes/.test(x))) bad('the Shrieker 1 kicker who never kicks gets no mistake: ' + dbg.log.join(' | ') + ' (check E)');
    dbg.at(526.95, meK, { seed: 3 }); const sh = dbg.G.p3.sh.sh1; dbg.pos = [sh.x + 4, sh.y]; dbg.kick(); if (dbg.G.p3.kick.sh1 !== meK) bad('pressing E by Shrieker 1 in its Vicious Echoes cast doesn\'t kick it (check E)');
  } catch (e) { bad('the mistakes crashed the game: ' + e.message + ' (check E)'); } finally { reset(); }
  // (the start card's "Your job in short": four plain lines naming the quarters and Circling Prey, your soak, your kick, the waves, the bubble and the heart)
  try { dbg.P2.pick = { role: 'm', soak: 2, bite: 'random', kick: 1 }; const sh = typeof dbg.P2.short === 'function' ? dbg.P2.short() : '', li = (sh.match(/<li>/g) || []).length;
    if (!/^<ul class="pg-short">/.test(sh) || li !== 4) bad('phase 3\'s "your job in short" isn\'t a pg-short list of four lines (' + li + ', check F)');
    else if (!/Circling Prey/.test(sh) || !/2nd Serpent(?:'|&#39;)s Bite \(7:46\)/.test(sh) || !/Shrieker 1/.test(sh) || !/heart/.test(sh)) bad('phase 3\'s "your job in short" doesn\'t name Circling Prey, the picked soak, the kick and the heart: ' + sh.replace(/<[^>]+>/g, ' | ') + ' (check F)'); }
  catch (e) { bad('phase 3\'s "your job in short" crashed: ' + e.message + ' (check F)'); } finally { reset(); }
  // I. the damage moments
  try {
    const pkI = { role: 'r', soak: 0, bite: 'no', kick: 0 }; dbg.P2.pick = pkI; const meI = dbg.P2.slotOf(pkI);
    [[389, 'clutch'], [458, 'wretch'], [522, 'shrieker'], [586, 'heart']].forEach(([t0, cat]) => { dbg.at(t0, meI, { seed: 3 }); const c = dbg.P2.dpsCat(dbg.G.t), L0 = dbg.P2.tgts(dbg.G.t);
      if (c !== cat) bad('at ' + clkS(t0) + ' the damage moment is ' + c + ', not ' + cat + ' (check I)'); if (!L0.some((o) => o.kind === cat)) bad('at ' + clkS(t0) + ' there is no ' + cat + ' to pick (check I)'); });
    for (const [pk, seed] of [[{ role: 'm', soak: 0, bite: 'no', kick: 1 }, 3], [{ role: 'r', soak: 0, bite: 'no', kick: 2 }, seedFor(ctx, 0)], [{ role: 'h', soak: 0, bite: 'no', kick: 0 }, seedFor(ctx, 2)]]) {
      dbg.P2.pick = pk; const r = dbg.sim(dbg.P2.slotOf(pk), true, false, seed), DL = (dbg.G.dpsM && dbg.G.dpsM.list) || [], tag = JSON.stringify(pk) + ' seed ' + seed;
      ['clutch', 'wretch', 'shrieker', 'heart'].forEach((k) => { const m = DL.filter((q) => q.kind === k); if (!m.length || m.some((q) => q.fr < 0.5)) bad('the autopilot (' + tag + ') isn\'t on the ' + k + ' for its moment (' + (m.length ? m.map((q) => Math.round(q.fr * 100) + '%').join(' ') : 'no moment') + ', check I)'); });
      if (r.log.some((x) => /was up|were up|was open/.test(x))) bad('the autopilot (' + tag + ') misses a damage moment: ' + r.log.join(' | ') + ' (check I)');
      if (dbg.P2.dpsNames(DL) !== 'the clutches, the Wretch, the Shriekers, the heart') bad('the end card names the moments "' + dbg.P2.dpsNames(DL) + '" (check I)'); }
    dbg.P2.pick = pkI; const st = dbg.sim(meI, false, false, 3).log.join(' | ');
    ['The clutches were up', 'The Wretch was up', 'The Shriekers were up'].forEach((x) => { if (!st.includes(x)) bad('standing still all phase, "' + x + '" isn\'t in the mistakes (check I)'); });
    // (a soaker on the 2nd bite (7:46 to 8:05) isn't told they missed the Wretch then)
    const pkS = { role: 'm', soak: 2, bite: 'no', kick: 0 }; dbg.P2.pick = pkS; dbg.at(470, dbg.P2.slotOf(pkS), { seed: 3 }); if (dbg.P2.dpsCat(dbg.G.t)) bad('a melee on the 2nd bite\'s soak at 7:50 has a damage moment (' + dbg.P2.dpsCat(dbg.G.t) + '); their job has them elsewhere (check I)');
  } catch (e) { bad('the damage moments crashed phase 3: ' + e.message + ' (check I)'); } finally { reset(); }
  // F. the wiring
  const PJ = rd('practice.js'), P3J = rd('practice3d.js'), GJ = rd('guides.js'), BP = rd('build.ps1');
  const part3 = ctx.PG_PARTS["Ula'tek"].m3; if (!part3 || part3.d !== 'm' || typeof part3.mod !== 'function' || part3.name !== 'Phase 3') bad('phase 3 isn\'t a Mythic part of Ula\'tek called "Phase 3" with its own mod in PG_PARTS (check F)');
  if (!/pgN = \(\/\[\?&#\]practice=\(\\d\)\//.test(GJ) || !/pgPart\(S\.gdzBoss, S\.gdzDiff \+ n\)/.test(GJ) || ctx.pgPart("Ula'tek", 'm3') !== part3) bad('`?practice=3` on the guide no longer opens phase 3 (check F)');
  if (!BP.includes("'practice-p2.js', 'practice-p3.js'") || !BP.includes("(& $read 'practice-p2.js') + \"`n\" + (& $read 'practice-p3.js')")) bad('build.ps1 no longer checks src/practice-p3.js or puts it into the page right after practice-p2.js (check F)');
  if (!/if \(P2 && !P2\.dodges\) return \{ T, fast \}/.test(PJ)) bad('practice.js\'s shared dodge no longer serves phase 3 (P2.dodges, check F)');
  if (!/esc\(P2\.lead \|\|/.test(PJ) || !/'\?practice' \+ \(P2 \? '=' \+ \(P2\.part \|\| 2\)/.test(PJ)) bad('practice.js lost phase 3\'s start card line or the score link\'s ?practice=3 (check F)');
  { const k = /pg3dP3\(\{([^}]*)\}\)/.exec(P3J); if (!k) bad('practice3d.js no longer builds phase 3\'s 3D pieces (pg3dP3, check F)');
    else k[1].split(',').map((x) => x.trim()).filter((x) => /^[A-Za-z_]\w*$/.test(x)).forEach((n) => { if (!new RegExp('(?:\\b(?:const|let|var)\\s+|,\\s*)' + n + '\\s*=').test(P3J)) bad('phase 3\'s 3D kit is handed "' + n + '", which the 3D view doesn\'t declare (check F)'); });
    if (!/A\.P2\.part === 3/.test(P3J) || !/m\.name = 'pg-rim'/.test(P3J) || !/\bplat \}\)/.test(P3J)) bad('practice3d.js no longer hands phase 3 the platform to hide (plat, the named rim, check F)'); }
  // G. 3D: phase 3's own shapes, where the hits are
  try {
    const pk = { role: 'r', soak: 1, bite: 'no', kick: 0 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), kinds = new Set(), A = { get G() { return dbg.G; }, get S() { return dbg.S; }, me, bossAt: dbg.P2.bossAt, tailAt: dbg.P2.tailAt, rl: (id) => id[0], nm: (id) => id, clsC: () => null, P2: dbg.P2 };
    // (one run, walked forward: the shapes at each moment)
    dbg.at(374.9, me, { seed: 3 }); const at = (t0) => { while (dbg.G.t < t0 - 1e-6) dbg.step(1); const L0 = ctx.pg3dShapes(A, dbg.G.t); L0.forEach((s) => kinds.add(s.k)); return L0; };
    let L0 = at(375); if (!L0.some((s) => s.k === 'gate')) bad('in 3D the gateway onto her quarter isn\'t drawn (check G)');
    at(384);
    L0 = at(406); const tg = dbg.S.bites[0].tg.map((id) => [dbg.G.bots[id].x, dbg.G.bots[id].y]); if (!tg.every((p) => L0.some((s) => s.k === 'ring' && Math.abs(s.r - P.BITE) < 0.01 && hyp([s.x, s.y], p) < 0.01))) bad('in 3D the red circles aren\'t drawn at their ' + P.BITE + ' yards on their targets (check G)');
    while (dbg.G.t < 418 && !(dbg.G.p3.bite[0] && dbg.G.p3.bite[0].done)) dbg.step(1); L0 = at(dbg.G.t + 1); if (!L0.some((s) => s.k === 'ring' && Math.abs(s.r - P.PURGE) < 0.01)) bad('in 3D the Volatile Purge isn\'t drawn at its ' + P.PURGE + ' yards (check G)');
    L0 = at(445); if (!L0.some((s) => s.k === 'qsink' && s.q === dbg.S.Qs[0] && s.f > 0)) bad('in 3D her first quarter doesn\'t sink once she breaks it (check G)');
    L0 = at(464); if (!L0.some((s) => s.k === 'dome' && Math.abs(s.r - P.FB) < 0.01)) bad('in 3D the Wretch\'s bubble isn\'t drawn at its ' + P.FB + ' yards (check G)');
    at(486); at(520);
    L0 = at(586); if (!L0.some((s) => s.k === 'ring' && Math.abs(s.r - 4.5) < 0.01 && hyp([s.x, s.y], dbg.S.heart) < 0.01)) bad('in 3D the heart isn\'t drawn where it\'s hit, 4.5 yards round (check G)');
    ['qsink', 'gate', 'clutch', 'shrieker', 'wretch', 'dome', 'heart', 'boss'].forEach((k) => { if (!kinds.has(k)) bad('the 3D view draws no "' + k + '" in phase 3 (check G)'); });
  } catch (e) { bad('the 3D shapes crashed on phase 3: ' + e.message + ' (check G)'); } finally { reset(); }
  // H. phase 1 and phase 2, with this file loaded
  try { const L1 = load(H); if (L1.dbg.P2) bad('phase 1 opens with a later part switched on (check H)'); const r1 = L1.dbg.sim('r3', true, false, 3); if (!L1.dbg.S || L1.dbg.S.end !== 165 || !r1) bad('phase 1 no longer plays to 2:45 with phase 3 loaded (check H)'); }
  catch (e) { bad('phase 1 crashed with phase 3 loaded: ' + e.message + ' (check H)'); }
  try { const L2 = load(H, 'm2'); if (!L2.dbg.P2 || L2.dbg.P2.part !== 2 || L2.dbg.P2.dodges) bad('phase 2 opens as part ' + (L2.dbg.P2 && L2.dbg.P2.part) + ' or with the shared dodge on (check H)'); else { const r2 = L2.dbg.sim(L2.dbg.P2.slotOf(L2.dbg.P2.pick), true, false, 3); if (!r2 || L2.dbg.S.end !== 318) bad('phase 2 no longer plays to 5:18 with phase 3 loaded (check H)'); } }
  catch (e) { bad('phase 2 crashed with phase 3 loaded: ' + e.message + ' (check H)'); }
}

module.exports = checks; module.exports.load = load;
if (require.main === module) {
  let n = 0; const t0 = Date.now(); checks(null, (a, b, t) => { n++; console.log('✗ ' + t); });
  console.log(n ? n + ' problem(s)' : 'practice game, phase 3: all checks pass', '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
  if (process.argv.includes('--audit')) { const { dbg } = load(null, 'm3'); dbg.P2.pick = { role: 'r', soak: 0, bite: 'no', kick: 0 }; for (let seed = 1; seed <= 16; seed++) { const a = dbg.audit(false, seed); console.log('seed ' + seed + ' (her first quarter ' + dbg.S.q1 + '): ' + (a.length ? '\n  ' + a.join('\n  ') : 'clean')); } }
  process.exitCode = n ? 1 : 0;
}
