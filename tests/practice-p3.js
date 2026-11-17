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
//   Q. the spot maps (Flex, Nov 16: "visual maps that lets them select the spot is best, you should use the plans maps", "make sure the maps are placed
//      properly it looks off", "clicking on your coil hides no egg", "maybe randomize their assignments"): phase 3 gives the setup screen no maps, or
//      Your bite group's three circles (Group Soak 1, 2, 3) or Your Shrieker's two spots aren't where the game itself stacks each bite and hatches
//      each Shrieker (read from pgP3Script as she rises north-east, and turned with her on the other three), or they aren't drawn there on the Plan's
//      map of the broken platform; the buttons under the tabs change from tab to tab; a role doesn't start with every mechanic it can take (melee
//      and ranged: a group, a kick and one red circle; healers: a group) or a pick saved before the maps isn't brought up to that; a click on a group,
//      a Shrieker, No soak, No kick or Random doesn't give exactly that job with every set still three soakers and each Shrieker one kicker, or gives a
//      healer a kick; the role defaults don't play clean; or a melee on Group Soak 1 (6:42 to about 7:02) still gets a Viper from the far clutch of
//      6:52, which they can't reach in time (the raid covers the clutches while you're on your own soak; before: "hatched a Viper", seed 1).
//      The review of the maps (Nov 16) adds: Your Shrieker's spots and the gold You aren't where the game has you kick, each Shrieker where her tank
//      holds it as its Vicious Echoes starts, played on all four first quarters (they sat on the hatch spots, 41 to 48 yards off, and the held spots
//      didn't turn with her, up to 4 yards off on the other quarters); the autopilot on a picked group doesn't stand in that group's circle, or on a
//      picked Shrieker doesn't kick it from where the map shows it; the Plan page behind doesn't draw each spot's own circle at the same MX/MY; a
//      healer has a Your Shrieker tab with nothing to pick, or a click on a group does nothing for a healer whose tab was left on Your Shrieker;
//      "No kick" saved with a group comes back with a kick (it did on every load); an old "Never" red circle isn't brought up to one.
//   CB. the cast bars over the Shriekers' heads (Flex, Nov 16: "The interupts are impossible to track/see. The monsters should have cast bars over their
//      heads"): a Vicious Echoes with no bar over its Shrieker, off it, not filling with its 3 s, yours when it isn't your kick (or not when it is), a bar
//      before or after the cast (but the red "Interrupted" just after a kick), or a number in the words over its Shrieker.
//   RS. the release sweep, Nov 16: your arrow at Circling Prey leads you over the hole in the middle (or shows only 2.5 s into the cast) and you're broken
//      under; a soaker on the gold ring gets "Your Volatile Purge waves headed through N raiders" with the waves touching nobody, or a raider a wave rolls over
//      isn't counted; a Group Soak 3 player is told to press Q at the 3rd Circling Prey, so it's cooling down for their soak; the small tails' line names
//      red lanes the game doesn't draw; the bar under your target's frame shows her cast instead of your Shrieker's Vicious Echoes, or no "Interrupted".
//      The release check, Nov 16 (RS6): "Press Q (defensive) as it lands" or "Circling Prey lands: Q" at a Circling Prey while Q is still cooling down then.
//   PA. the prompts audit, Nov 16 (Flex: "Lets improve the curated experience as the game guides players onto what they need to do next", "All 10", then "i feel
//      like the game confuses people saying timestamps"): PA1 a player who walks where the arrow points is hit by a wave (all four of the audit's runs were, at 7:13,
//      8:03 and 9:36), or the arrow points at the second gateway before it opens; PA2 a small tails pair or a soaker's Purge has no call for you, or the job line
//      doesn't say to dodge a wave due on your spot (or says it in a gap, or loses to your soak); PA3 your arrow stops short of the ring drawn there, or the gateway
//      doesn't take you inside its ring; PA4 your soak, red circle or kick walk is named late (the audit: 1.2 s before the circles); PA5 a job line, NEXT line,
//      call, floor label, setup or start-card sentence or float says a clock time or a count of seconds, a job line runs past 12 words or says "Next: X in N s";
//      PA9 a call isn't "Mechanic: order" with a verb first, or is gold (yours) without you/your or the other way round; PA6 the gateway's bar or label outlives
//      the gateway, or the bar isn't at the game's own check; PA7 a Fester Burst call comes after its job line; PA8 nothing marks your Shrieker, or your soak or
//      kick has two bars; PA10 no "Press Q now" in your soak or before a Circling Prey lands, or the Q button doesn't light then.
//   RV. the review of those fixes (Nov 16, played by players who do as the screen says): RV-A the NEXT line doesn't reach the screen (practice.js reads nextText),
//      "Your Shrieker" doesn't survive the 3D view's monster health bars, or a call isn't marked me to match mine; RV1 a soaker inside both red circles but off the
//      gold ring is told to walk in, gets the arrow, or is never told to press Q; RV2 "Hold still", "Stay" or "Wait" with the arrow pointing, or "Hold still ... now"
//      before the waves leave; RV3 a job line flips back within a second, or (melee Group Soak 2, seed 3) three lines or an arrow blink within a second, or "Wait
//      here"; RV4 a player who moves only when the arrow shows is broken under or left in the venom at Circling Prey, "Off her quarter: good. Stack with the raid
//      here" far from the raid, or no line and arrow in the venom; RV5 no dodge line by a red circle that isn't yours, or Mother's Wrath's line names "the red
//      circle" as her reach; RV6 "Walk to the gold ring now" to a target already on it; RV7 her waves called later than 1 s into her cast, their red lanes later,
//      or the job line naming them sooner; RV8 the standing line held against the heart, or NEXT saying the heart under a line that does; RV9 the wording list,
//      "Soak here" hidden with hints off, and clock times on the Start list.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src'), rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n');
function stub() { const f = function () { return stub(); }; return new Proxy(f, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : k === Symbol.iterator ? function* () {} : stub()), set: () => true, apply: () => stub() }); }
// (opt.maps: the Plan's map maker too (ulSvg and its pieces), so the setup screen draws its spot maps; opt.store: a browser storage with these saves)
function load(H, part, opt) {
  H = H || require('./site-helpers.js'); opt = opt || {};
  const GJ = rd('guides.js'), fromGuides = ['GDZ_ROLE', 'GDZ_RAID', 'gdzName', 'UX', 'UX_MEL', 'UX_HOME', 'UX_ZONE', 'UL_EDGE', 'UL_FB', 'GDZ_FLOOR', 'UL_EGGS'].concat(opt.maps ? ['POM_DEF', 'POM_MK', 'UL_VB', 'ulSvg', 'UL_BROKEN'] : []).map((n) => H.grab(n, GJ)).join('\n') + (opt.maps ? '\nconst UL_PAGES = {};' : '');
  const win = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} }, st = opt.store;
  class Img { constructor() { this.complete = false; this.naturalWidth = 0; } }
  const ctx = vm.createContext({ document: stub(), window: win, navigator: stub(), performance, Image: Img, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, localStorage: st ? { getItem: (k) => (k in st ? st[k] : null), setItem: (k, v) => { st[k] = String(v); }, removeItem: (k) => { delete st[k]; } } : stub(), E: { CLASSES: {} }, console, MouseEvent: function () {} });
  vm.runInContext(H.grab('esc') + '\n' + fromGuides + '\n' + rd('practice.js') + '\n' + rd('practice3d.js') + '\n' + rd('practice-p2.js') + '\n' + rd('practice-p3.js') +
    '\nthis.PG_P3 = PG_P3; this.PG_P3_T = PG_P3_T; this.pgP3Script = pgP3Script; this.pgP3Jobs = pgP3Jobs; this.pgP3Mask = pgP3Mask; this.pgP3Floor = pgP3Floor; this.pgP3Q = pgP3Q; this.pgP3R = pgP3R; this.pgP3Held = pgP3Held; this.PG_PARTS = PG_PARTS; this.pg3dShapes = pg3dShapes; this.pgPart = pgPart;', ctx);
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
    const mid = dbg.S.F2(P.mel, 0); for (let i = 0; i < 140; i++) { dbg.pos = mid.slice(); dbg.stepOwn(1); } if (!dbg.log.some((x) => /Volatile Purge (burst on|waves hit) \d+ raider/.test(x))) bad('a Purge burst in the middle of the raid isn\'t a mistake (its burst or its waves): ' + dbg.log.join(' | ') + ' (check E)');
    // (Vicious Echoes not kicked by its kicker)
    const pkK = { role: 'r', soak: 0, bite: 'no', kick: 1 }; dbg.P2.pick = pkK; const meK = dbg.P2.slotOf(pkK); dbg.at(520, meK, { seed: 3 }); for (let i = 0; i < 260; i++) dbg.stepOwn(1);
    if (!dbg.log.some((x) => /didn't kick Vicious Echoes/.test(x))) bad('the Shrieker 1 kicker who never kicks gets no mistake: ' + dbg.log.join(' | ') + ' (check E)');
    dbg.at(526.95, meK, { seed: 3 }); const sh = dbg.G.p3.sh.sh1; dbg.pos = [sh.x + 4, sh.y]; dbg.kick(); if (dbg.G.p3.kick.sh1 !== meK) bad('pressing E by Shrieker 1 in its Vicious Echoes cast doesn\'t kick it (check E)');
  } catch (e) { bad('the mistakes crashed the game: ' + e.message + ' (check E)'); } finally { reset(); }
  // (the start card's "Your job in short": four plain lines naming the quarters and Circling Prey, your soak, your kick, the waves, the bubble and the heart)
  try { dbg.P2.pick = { role: 'm', soak: 2, bite: 'random', kick: 1 }; const sh = typeof dbg.P2.short === 'function' ? dbg.P2.short() : '', li = (sh.match(/<li>/g) || []).length;
    if (!/^<ul class="pg-short">/.test(sh) || li !== 4) bad('phase 3\'s "your job in short" isn\'t a pg-short list of four lines (' + li + ', check F)');
    /* (no clock time after the soak since the prompts audit, Nov 16: it said "2nd Serpent's Bite (7:46)") */
    else if (!/Circling Prey/.test(sh) || !/2nd Serpent(?:'|&#39;)s Bite/.test(sh) || !/Shrieker 1/.test(sh) || !/heart/.test(sh)) bad('phase 3\'s "your job in short" doesn\'t name Circling Prey, the picked soak, the kick and the heart: ' + sh.replace(/<[^>]+>/g, ' | ') + ' (check F)'); }
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
      if (dbg.P2.dpsNames(DL) !== 'the clutches, the Rawlings, the Wretch, the Shriekers, the heart') bad('the end card names the moments "' + dbg.P2.dpsNames(DL) + '" (check I)'); }
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
  if (!/if \(P2 && !(P2\.dodges|\(typeof P2\.dodges === 'function' \? P2\.dodges\(b\.id, t\) : P2\.dodges\))\) return \{ T, fast \}/.test(PJ)) /* (phase 2 asks for it on the platform only, Nov 15: a function of the raider and the time) */ bad('practice.js\'s shared dodge no longer serves phase 3 (P2.dodges, check F)');
  if (!/'\?practice' \+ \(P2 \? '=' \+ \(P2\.part \|\| 2\)/.test(PJ)) bad('practice.js lost the score link\'s ?practice=3 (check F)');
  // (the shared one-screen setup (Nov 15, Flex via Main: "still too complex and confusing"): phase 3 gives it a role, then one job in plain words)
  { const su = dbg.P2.setup; if (!/const SETUP = P2 \? P2\.setup/.test(PJ) || !su || !Array.isArray(su.roles)) bad('phase 3 gives the shared setup screen no setup (P2.setup, check F)');
    else { const saved = dbg.P2.pick; try { su.roles.forEach((r) => su.jobs(r).forEach(([v, label]) => { su.set(r, v); const nw = su.now(), pk = dbg.P2.pick, me = dbg.P2.slotOf(pk), d = ctx.pgP3Jobs(3, me, pk);
      if (nw.role !== r || nw.job !== v) bad('the setup\'s "' + label + '" for ' + r + ' comes back as ' + nw.role + ' ' + nw.job + ' (check F)');
      if ([1, 2, 3].some((n) => Object.keys(d.J).filter((id) => d.J[id].sk.includes(n)).length !== 3) || [1, 2].some((k) => Object.keys(d.J).filter((id) => d.J[id].kick === k).length !== 1)) bad('the setup\'s "' + label + '" for ' + r + ' loses a soaker or a kicker (check F)');
      if (v[0] === 's' && !d.J[me].sk.includes(+v[1])) bad('the setup\'s "' + label + '" doesn\'t make you that set\'s soaker (check F)'); if (v[0] === 'k' && d.J[me].kick !== +v[1]) bad('the setup\'s "' + label + '" doesn\'t make you that Shrieker\'s kicker (check F)');
      if (!/^You /.test(su.say() || '')) bad('the setup\'s sentence for "' + label + '" is "' + su.say() + '" (check F)'); })); } finally { dbg.P2.pick = saved; } } }
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
  // K. the independent review's findings (Nov 15, before the first push), each played or read here so it can't come back:
  try {
    const PJ2 = rd('practice.js'), P3S = rd('practice-p3.js');
    // (a soaker's own Volatile Purge waves hit them while they walked to their spot: every 2nd-bite soaker died at 8:11 on three of four first quarters)
    if (!/w\.from === me \|\| !inWave\(w, t, x, y\)/.test(PJ2) || !/w\.from !== b\.id/.test(PJ2)) bad('a soaker\'s own Volatile Purge waves can hit them again, or the bots dodge their own (practice.js w.from, check K)');
    for (const q of [3, 0]) { const pk = { role: 'r', soak: 2, bite: 'no', kick: 0 }; dbg.P2.pick = pk; const r = dbg.sim(dbg.P2.slotOf(pk), true, false, seedFor(ctx, q)); if (r.deaths.length || r.log.some((x) => /Volatile Purge hit you/.test(x))) bad('the 2nd bite\'s soaker (her first quarter ' + P.QN[q] + ') is hit by a Purge wave or dies: ' + r.log.concat(r.deaths).join(' | ') + ' (check K)'); }
    // (a player who stepped clockwise at Circling Prey was praised, then routed across the quarter she was breaking)
    { const pk = { role: 'r', soak: 0, bite: 'no', kick: 0 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), seed = seedFor(ctx, 0); dbg.at(434, me, { seed }); const Qs = dbg.S.Qs; dbg.pos = ctx.pgP3R([20, 20], Qs[3]); dbg.stepOwn(1);
      const T0 = dbg.job(me).T; if (ctx.pgP3Q(T0[0], T0[1]) === Qs[0] && dbg.P2.onPlat(T0[0], T0[1])) bad('a player who stepped clockwise at Circling Prey is routed back across her breaking quarter (check K)');
      if (/Off her quarter: good/.test(dbg.P2.jobText())) bad('a player who stepped clockwise at Circling Prey is told "good" (check K)'); }
    // (Mother's Wrath: a melee stand spot sat in her reach, with no warning or arrow)
    { const pk = { role: 'm', soak: 0, bite: 'no', kick: 0 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(383, me, { seed: 3 }); const wr = dbg.S.wrath[0];
      const inReach = Object.keys(dbg.G.bots).filter((id) => id[0] === 'm' && hyp([dbg.G.bots[id].x, dbg.G.bots[id].y], wr.p) < 5.7); if (inReach.length) bad('melee stand in her reach as Mother\'s Wrath starts (' + inReach.join(' ') + ', check K)');
      /* (its words since the review, Nov 16: "her reach (the red circle)" read as the bite's red circle) */
      dbg.pos = wr.p.slice(); dbg.stepOwn(1); if (!/^Mother's Wrath: step out of the red circle in front of her\./.test(dbg.P2.jobText())) bad('standing in her reach during Mother\'s Wrath, the screen doesn\'t say to step out (check K)');
      if (!dbg.P2.upNext(375).concat(dbg.P2.upNext(383)).some((u) => /Mother's Wrath/.test(u.text))) bad('Mother\'s Wrath isn\'t in "what\'s next" (check K)'); }
    // (one tap on Healer wiped a saved kick and red circle; a soaker with "Yes, once" wasn't told about the red circle)
    dbg.P2.pick = { role: 'h', soak: 3, bite: 'yes', kick: 2 }; if (dbg.P2.pick.kick !== 2 || dbg.P2.pick.bite !== 'yes') bad('picking Healer still wipes the saved kick and red circle (check K)'); if (/Kick/.test(dbg.P2.role().job)) bad('a healer still plays a kick (check K)');
    dbg.P2.pick = { role: 'r', soak: 1, bite: 'yes', kick: 0 }; if (!/red circle will land on you/.test(dbg.P2.short())) bad('a soaker who picked "Yes, once" isn\'t told a red circle will land on them (check K)');
    // (the drain cleared a three-soaker bite in 11 s; the kills take 13)
    { dbg.P2.pick = PK0; dbg.sim(dbg.P2.slotOf(PK0), true, false, 3); const b = dbg.S.bites[0], st = dbg.G.p3.bite[0], cl = st && st.done ? st.done - b.land : null; if (cl == null || cl < 12.3 || cl > 14.2) bad('three soakers clear the 1st bite ' + (cl == null ? 'never' : cl.toFixed(1) + ' s') + ' after it lands; the kills take 13 (check K)'); }
    // (the Wretch was dragged from 7:29; the kills leave it until 7:34 and have it at its bubble about 7:40; it died 2.6 s early)
    { dbg.at(T.womb + 24, dbg.P2.slotOf(PK0), { seed: 3 }); const w = dbg.G.p3.wr; if (!w || hyp([w.x, w.y], dbg.S.wretch.p0) > 0.5) bad('the Wretch moves before 25 s after it lands; on all 17 kills it stays put until then (check K)');
      /* (its death time is health-driven now: check L) */ }
    // (the second gateway: the screen offered it to everyone, the arrow only to ranged and healers)
    { const pk = { role: 'm', soak: 0, bite: 'no', kick: 0 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.gate2w - 0.3, me, { seed: 3 }); const g2 = dbg.S.gates.find((g) => g.k === 2); for (let i = 0; i < 12; i++) { dbg.pos = dbg.S.F2([18, 18], 1); dbg.stepOwn(1); } /* (from before the autopilot would take it, then held on her second quarter) */
      if (g2 && hyp(dbg.job(me).T, g2.p) > 3) bad('a melee on her second quarter at 8:07 isn\'t sent to the gateway the screen offers (check K)'); }
    // (3D: a ring whose radius changes each frame made a new ring every frame; the floor had half-yard slits; foam showed in the hole; waders floated)
    if (/h\.ring\([^;]*\(t - /.test(P3S)) bad('a 3D ring in phase 3 still changes size every frame (a new ring each frame: use h.grow, check K)');
    if (!/cells\(\(c\) => M\.q\[c\] === k, 0, true\)/.test(P3S) || !/M\.ck\[c\] === p/.test(P3S) || !/position\.y = WY \+ 0\.03/.test(P3S)) bad('phase 3\'s 3D floor lost its whole-cell quarters, its fords over the cracks or its cover over the old platform (check K)');
    // (the texts: Vicious Echoes' cast bar hides under her waves' cast, so the kick is told by the pink glow; the gateway counts are the logs')
    if (/cast bar/.test(P3S.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ''))) bad('a phase 3 text still points at a cast bar that her waves\' cast can hide (check K)');
    if (!/onto her first quarter \(5 of 17 kills/.test(P3S) || !/second Circling Prey \(7 of 17/.test(P3S)) bad('the header\'s gateway counts aren\'t the logs\' (5 and 7 of 17, check K)');
  } catch (e) { bad('the review\'s checks crashed: ' + e.message + ' (check K)'); } finally { reset(); }
  // L. the mechanics audit (Nov 15, the phase 1 chat's read of every part; Flex: "if this skips any part of the fight that requires mechanical execution
  //    its not good enough", "add spawns being missed"): before it, every phase 3 add left on a timer whatever you did, the default job had no kick, a missed
  //    Vicious Echoes didn't tick, Circling Prey 2 and 3 had no defensive prompt, and the last burn had no debris
  try {
    const P3S = rd('practice-p3.js'), pkR = { role: 'r', soak: 0, bite: 'no', kick: 0 }; dbg.P2.pick = pkR; const meR = dbg.P2.slotOf(pkR);
    // (the clutches: health, broken into Rawlings that stay until killed; a whole one at the end of its gestation hatches a Viper)
    dbg.at(388, meR, { seed: 3 }); const cl = dbg.P2.tgts(dbg.G.t).find((o) => o.kind === 'clutch'); if (!cl || !(cl.max > 0) || !(cl.hp > 0)) bad('a gripped clutch has no health bar (check L)');
    else { const h0 = dbg.G.p3.cl[cl.key].hp; dbg.P2.hit(cl.key); if (!(dbg.G.p3.cl[cl.key] && dbg.G.p3.cl[cl.key].hp < h0)) bad('hitting a clutch doesn\'t hurt it (check L)'); }
    { const r = dbg.sim(meR, true, false, 3), raw = (dbg.G.dpsM && dbg.G.dpsM.list || []).filter((m) => m.kind === 'rawling'); if (r.log.some((x) => /hatched a Viper/.test(x))) bad('the autopilot, hitting the clutches, still lets one hatch a Viper: ' + r.log.join(' | ') + ' (check L)'); if (!raw.length) bad('broken clutches leave no Rawlings to kill (check L)'); }
    { const st = dbg.sim(meR, false, false, 3).log.join(' | '); if (!/Slithering Clutch wasn't broken in time/.test(st)) bad('with you hitting nothing, every clutch still breaks in time; the far one, gripped in last, should hatch a Viper (check L)'); }
    if (/t >= c\.gone|c\.hatch/.test(P3S)) bad('a clutch still leaves on a timer (check L)');
    // (the Shriekers and the Wretch: health; the Wretch's third bubble when it lives; Acidic Expulsion on the raid)
    dbg.at(519, meR, { seed: 3 }); const sh = dbg.P2.tgts(dbg.G.t).filter((o) => o.kind === 'shrieker'); if (sh.length !== 2 || sh.some((o) => !(o.max > 0))) bad('the Shriekers have no health bars (check L)'); if (!dbg.G.debs.acid || dbg.G.debs.acid.until <= dbg.G.t) bad('no Acidic Expulsion on the raid once the Shriekers are up (check L)');
    { dbg.sim(meR, true, false, 3); const wd = dbg.G.p3.wrDead, sd = Object.values(dbg.G.p3.shDead); if (!wd || wd < 495 || wd > 516) bad('the Wretch dies at ' + (wd ? clkS(wd) : 'never') + ' with you on it; the kills kill it 8:27 to 8:32 (check L)'); if (sd.length !== 2 || sd.some((x) => x < 515 || x > 540)) bad('the Shriekers die at ' + sd.map(clkS).join(', ') + ' with you on them; the kills kill them about 8:49 to 8:53 (check L)'); }
    { const st = dbg.sim(meR, false, false, 3).log.join(' | '); if (!/Wretch lived to its third bubble/.test(st)) bad('with nobody but the bots on the Wretch, it never reaches its third bubble (check L)'); if (dbg.G.p3.wrDead && dbg.G.p3.wrDead < 525) bad('the bots alone kill the Wretch by ' + clkS(dbg.G.p3.wrDead) + ': your hits don\'t matter (check L)'); }
    // (kicks: the default job for melee and ranged; a missed Vicious Echoes ticks)
    { const su = dbg.P2.setup; if (su && (su.jobs('m')[0][0][0] !== 'k' || su.jobs('r')[0][0][0] !== 'k')) bad('a Shrieker kick isn\'t the default job for melee and ranged (check L)'); if (!/A\.has\('echo'\)\) G\.hp -=/.test(P3S)) bad('a missed Vicious Echoes doesn\'t tick (check L)'); if (!/const due = range\(A\.me\) && kickables\(t\)/.test(P3S)) bad('the E button no longer lights up while your kick is due (check L)'); }
    // (Circling Prey 2 and 3: press Q; the last burn's debris)
    { const pk = { role: 'r', soak: 0, bite: 'no', kick: 0 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.prey[1] + 6, me, { seed: 3 }); dbg.pos = dbg.S.F2([14, 14], 2); dbg.stepOwn(1); if (!/Press Q/.test(dbg.P2.jobText())) bad('at the 2nd Circling Prey, off her quarter, the screen doesn\'t say to press Q: ' + dbg.P2.jobText() + ' (check L)'); }
    if (!script({ seed: 3 }).impacts.some((m) => m.name === 'Falling Debris' && m.at > T.heart)) bad('no Falling Debris in the last heart burn (check L)');
  } catch (e) { bad('the mechanics audit\'s checks crashed: ' + e.message + ' (check L)'); } finally { reset(); }
  // M. the call line (Main, Nov 15, 0441260f: at most two calls show at once, one that says "you" or "your" first, and one that waited 4 s drops). Phase
  //    3's calls about your job (your red circle, your soak, your kick, Circling Prey) say you/your so they're never the ones dropped; timer-only facts
  //    (Toxic Womb, Rage of the Shackled, the second gateway on its own) have no call; every call fits on one line. Played on the real call line
  try { const ME = /\b(you|your)\b/i;
    for (const [pk, seed] of [[{ role: 'm', soak: 0, bite: 'no', kick: 1 }, 3], [{ role: 'r', soak: 1, bite: 'no', kick: 0 }, seedFor(ctx, 1)], [{ role: 'r', soak: 0, bite: 'yes', kick: 2 }, 5], [{ role: 'h', soak: 3, bite: 'no', kick: 0 }, seedFor(ctx, 2)]]) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), tag = ' (' + JSON.stringify(pk) + ', seed ' + seed + ', check M)'; dbg.at(T.start - 1, me, { seed }); const S = dbg.S, G = dbg.G, W = S.warns.filter((w) => w.t >= T.start - 1);
      W.filter((w) => w.text.length > 56).forEach((w) => bad('a phase 3 call runs past one line (' + w.text.length + ' letters): "' + w.text + '"' + tag));
      W.filter((w) => /^(Toxic Womb|Rage of the Shackled|A gateway to the next quarter)/.test(w.text)).forEach((w) => bad('a timer-only fact still has a call (the boss-mod bar has it): "' + w.text + '"' + tag));
      /* (since the prompts audit, Nov 16: yours is called as her cast starts, and the kick calls name the gold ring, not a clock time) */
      const mine = []; S.bites.forEach((b) => { if (b.tg.includes(me)) mine.push([b.b0, /lands on you/, 'your red circle']); else if (S.job[me].sk.includes(b.i + 1)) mine.push([b.b0, /^Serpent's Bite: walk to your gold ring/, 'your soak']); });
      if (S.job[me].kick) mine.push([T.shriek, /^Shriekers: kick your Shrieker \(gold ring\)/, 'your kick'], [T.echoes, /^Vicious Echoes: kick your Shrieker now/, 'kick now']); T.prey.forEach((p) => mine.push([p, /^Circling Prey/, 'Circling Prey']));
      mine.forEach(([at, re, what]) => { const w = W.find((q) => Math.abs(q.t - at) < 0.01 && re.test(q.text)); if (!w) bad('no call for ' + what + ' at ' + clkS(at) + tag); else if (!ME.test(w.text)) bad('the call for ' + what + ' doesn\'t say you/your, so it can be dropped: "' + w.text + '"' + tag); });
      const shown = new Set((G.lastWarn && G.lastWarn.all) || []); /* (the opening call shows as the jump lands) */ G.warnQ = []; G.lastWarn = null; for (let k = 0; T.start - 1 + k * 0.05 < S.end; k++) { G.t = T.start - 1 + k * 0.05; const L = dbg.warnsNow(); if (L) L.all.forEach((x) => shown.add(x)); }
      W.filter((w) => ME.test(w.text) && !shown.has(w.text)).forEach((w) => bad('"' + w.text + '" (' + clkS(w.t) + ') never shows on the call line' + tag)); }
  } catch (e) { bad('the call line check crashed: ' + e.message + ' (check M)'); } finally { reset(); }
  // N. your kick (Flex, Nov 15: "The bots arent giving the player any opportunity to interupt, there should be at least one spot where the player is asked
  //    to interupt"). Your hits and the raid's killed your Shrieker at 8:44 to 8:46, before its Vicious Echoes (8:46.8), so only the bots' Shrieker was ever
  //    kicked. Both live through the cast now (as on every kill), and every melee and ranged pick but "no kick" carries a kick
  try {
    for (const [pk, seed] of [[{ role: 'r', soak: 0, bite: 'no', kick: 2 }, 1], [{ role: 'm', soak: 0, bite: 'no', kick: 1 }, 5], [{ role: 'r', soak: 1, bite: 'no', kick: 2 }, 3]]) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.sim(me, true, false, seed); const G = dbg.G;
      if (!Object.values(G.p3.kick).includes(me)) bad('playing ' + JSON.stringify(pk) + ' (seed ' + seed + '), you never kick: kicks ' + JSON.stringify(G.p3.kick) + ', Shriekers died ' + JSON.stringify(G.p3.shDead) + ' (check N)');
      Object.entries(G.p3.shDead).forEach(([k, at]) => { if (at < T.echoes + 0.3 && G.p3.kick[k] == null) bad('Shrieker ' + k + ' died at ' + clkS(at) + ', before its Vicious Echoes (' + clkS(T.echoes) + '), unkicked (check N)'); }); }
    const su = dbg.P2.setup; if (!su) bad('no start card to check the kick picks (check N)'); else for (const r of ['m', 'r']) su.jobs(r).forEach(([v, label]) => { su.set(r, v); const p = dbg.P2.pick, me = dbg.P2.slotOf(p), J = ctx.pgP3Jobs(3, me, p).J;
      if (v !== 'none' && !(p.kick && J[me].kick)) bad('the ' + r + ' pick "' + label + '" has no Shrieker kick (check N)'); if (v === 'none' && (p.kick || !/no kick/.test(label))) bad('the ' + r + ' pick without a kick doesn\'t say "no kick": "' + label + '" (check N)'); });
  } catch (e) { bad('the kick check crashed: ' + e.message + ' (check N)'); } finally { reset(); }
  // P. Main's playtest, Nov 15 (Flex: "Yes, send them"): the bite's end is about 1.2 million since Nov 6 (0.6 a circle), not 2; the calls no longer say "rings" (the fans
  //    themselves wait for measured directions); and "burn the heart" walked a melee into the last bite's red circles at 9:43, which still sit by the heart as it opens
  try {
    const P3S = rd('practice-p3.js'); if (/2 million/.test(P3S.replace(/1\.2 million/g, ''))) bad('phase 3 still says the bite\'s end is 2 million; since Nov 6 it\'s about 1.2 million (check P)');
    const S3 = script({ seed: 3 }); /* (the tails' fans wait for measured directions: see the note in src/practice-p3.js) */
    if (S3.warns.some((w) => /rings/.test(w.text))) bad('a phase 3 call still says the small tails send rings (check P)');
    const pk = { role: 'm', soak: 0, bite: 'no', kick: 1 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.heart + 0.2, me, { seed: 3 }); const b2 = dbg.G.p3.bite[2];
    dbg.G.p3.bite[2] = { v: {}, by: new Set(), done: null }; /* (the last bite still draining as the heart opens) */
    if (dbg.P2.dpsCat(dbg.G.t) === 'heart') bad('the heart\'s damage moment starts while the last bite\'s red circles still sit by it: it pulls the melee into them (check P)');
    if (!/Wait outside the red circles/.test(dbg.P2.jobText())) bad('as the heart opens with the last red circles still draining, the job says "' + dbg.P2.jobText() + '", not to wait outside them (check P)');
    dbg.G.p3.bite[2] = b2;
  } catch (e) { bad('the playtest fixes check crashed: ' + e.message + ' (check P)'); } finally { reset(); }
  // Q. the spot maps (the header has the list)
  try {
    const M = dbg.P2.setup && dbg.P2.setup.maps, FN = ['tabs', 'page', 'hot', 'pick', 'extras', 'extra', 'random', 'role', 'say', 'sub'];
    if (!M || FN.some((f) => typeof M[f] !== 'function')) bad('phase 3 gives the setup screen no spot maps (setup.maps with ' + FN.join(', ') + '; Flex, Nov 16: "visual maps that lets them select the spot", check Q)');
    else {
      // (where the game puts each one: the script itself, as she rises on the north-east quarter; and the same spots turned with her on the other three)
      const S0 = script({ seed: 7, q1: 0 }), qOf = (p) => ctx.pgP3Q(p[0], p[1]), set = (r) => { dbg.P2.pick = { role: 'r', soak: 1, bite: 'yes', kick: 2, v: 2 }; M.role(r); };
      const tabsOf = (r) => { set(r); return (M.tabs() || []).map((x) => x.join(':')).join(' | '); };
      for (const r of ['m', 'r']) { const tq = tabsOf(r); if (tq !== 'bite:Your soak group | shriek:Your Shrieker') bad('the setup\'s tabs for a ' + r + ' are "' + tq + '", not Your soak group and Your Shrieker (check Q)'); }
      { const tq = tabsOf('h'); if (tq !== 'bite:Your soak group') bad('a healer\'s setup tabs are "' + tq + '": a Your Shrieker tab with nothing to pick (healers have no kick), not just Your soak group (the review, Nov 16, check Q)'); }
      // (no made-up map: the Plan has no phase 3 map, so every tab is buttons (page null). Flex, Nov 16, on a map drawn on the broken platform: "where did this
      //  come from? Theres no map like this in the plan section of my website", "the soak assignments are just who stands in the soaks", "the soaks are not
      //  spread out on mythic")
      set('r'); if (['bite', 'shriek'].some((k) => M.page(k) != null)) bad('phase 3 still draws a map for its picks; the Plan has none, so they\'re buttons (check Q)');
      const hb = M.hot('bite'), hs = M.hot('shriek'), S1 = script({ seed: 1, q1: 0 });
      if (hb.map((h) => h.id + ':' + h.lab).join() !== 'g1:Group Soak 1,g2:Group Soak 2,g3:Group Soak 3') bad('Your soak group offers ' + hb.map((h) => h.lab).join(', ') + ', not Group Soak 1, 2 and 3 (check Q)');
      /* (the notes name which bite, never a clock time: the prompts audit, Nov 16) */
      S0.bites.forEach((b, i) => { const h = hb[i]; if (h && h.note !== ['1st', '2nd', '3rd'][i] + ' bite') bad('Group Soak ' + (i + 1) + ' says "' + h.note + '"; it\'s the ' + ['1st', '2nd', '3rd'][i] + ' bite (check Q)');
        if (qOf(b.stack) !== S0.Qs[b.n] || !ctx.pgP3Floor(b.stack[0], b.stack[1], [1, 1, 1, 1], 1)) bad('the game stacks bite ' + (i + 1) + ' off her quarter or off the stone (check Q)'); });
      // (Mythic: each bite's three soakers stand together in its two stacked red circles, never spread)
      for (let seed = 1; seed <= 6; seed++) script({ seed }).bites.forEach((b, i) => { if (!b.stack || b.so.length !== 3) bad('bite ' + (i + 1) + ' (seed ' + seed + ') has ' + b.so.length + ' soakers on one stack, not three (check Q)'); });
      if (hs.map((h) => h.id + ':' + h.lab + ':' + h.note).join() !== 's1:Shrieker 1:kick (E),s2:Shrieker 2:kick (E)') bad('Your Shrieker offers ' + hs.map((h) => h.lab + ' (' + h.note + ')').join(', ') + ', not Shrieker 1 and 2, kicked with E (check Q)');
      if (S0.shriekers.some((s) => qOf(s.p0) === S0.Qs[S0.stepAt(T.shriek)])) bad('a Shrieker hatches on her quarter; the kills have them on the two broken ones (check Q)');
      // (each Shrieker's spot is where you kick it: where the game has it as its Vicious Echoes starts (8:46.8), played on every first quarter and turned back
      //  to her north-east frame. Before the review (Nov 16) the spots sat on the hatch spots, 41 and 48 yards off, and the held spots didn't turn with her)
      for (const q of [0, 1, 2, 3]) { const pk = { role: 'r', soak: 0, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; dbg.at(T.echoes + 0.1, dbg.P2.slotOf(pk), { seed: seedFor(ctx, q) });
        [1, 2].forEach((k) => { const s = dbg.G.p3.sh['sh' + k], h = ctx.pgP3Held(S1, k, T.echoes); if (!s || !h) { bad('no Shrieker ' + k + ' to measure as Vicious Echoes starts (her first quarter ' + P.QN[q] + ', check Q)'); return; }
          const at = ctx.pgP3R([s.x, s.y], 4 - dbg.S.q1), d = hyp(at, h); if (d > 1) bad('Shrieker ' + k + ' is ' + d.toFixed(1) + ' yards from its held spot (pgP3Held, turned with her) as you kick it (her first quarter ' + P.QN[q] + ', check Q)'); }); }
      for (let q = 1; q < 4; q++) { const S2 = script({ seed: 5, q1: q }); S2.bites.forEach((b, i) => { if (hyp(ctx.pgP3R(S0.bites[i].stack, q), b.stack) > 1.5) bad('as she rises on the ' + P.QN[q] + ' quarter, bite ' + (i + 1) + ' stacks ' + hyp(ctx.pgP3R(S0.bites[i].stack, q), b.stack).toFixed(1) + ' yards from the map\'s spot turned with her (check Q)'); });
        S2.shriekers.forEach((s, i) => { if (hyp(ctx.pgP3R(S0.shriekers[i].p0, q), s.p0) > 1.5) bad('as she rises on the ' + P.QN[q] + ' quarter, Shrieker ' + s.k + ' hatches away from the map\'s spot turned with her (check Q)'); }); }
      set('h'); if (M.hot('shriek').length) bad('a healer can pick a Shrieker to kick; healers have no kick in Midnight (check Q)');
      // (a melee who left the setup on Your Shrieker, then picked Healer: that tab is gone, and a click on a group must still take it)
      set('m'); M.tab = 'shriek'; M.role('h'); M.pick(M.tab, 'g3'); if (dbg.P2.pick.soak !== 3) bad('a healer whose map was left on Your Shrieker clicks Group Soak 3 and gets ' + JSON.stringify(dbg.P2.pick) + ' (the review, Nov 16, check Q)'); M.tab = 'bite';
      // (defaults: every mechanic the role can take, from a fresh start and from a pick saved before the maps)
      const L0 = load(H, 'm3'), P0 = L0.dbg.P2.pick; if (!(P0.soak && P0.kick && P0.bite === 'yes')) bad('a fresh start isn\'t every mechanic: ' + JSON.stringify(P0) + ' (a group, a kick and one red circle, check Q)');
      ['m', 'h', 'r'].forEach((r) => { L0.dbg.P2.setup.maps.role(r); const p = L0.dbg.P2.pick, me = L0.dbg.P2.slotOf(r === 'h' ? { ...p, kick: 0, bite: 'no' } : p), J = ctx.pgP3Jobs(3, me, r === 'h' ? { ...p, kick: 0, bite: 'no' } : p).J[me];
        if (!J.sk.length || (r !== 'h' && (!J.kick || p.bite !== 'yes'))) bad('a ' + r + ' from a fresh start plays ' + JSON.stringify(J) + ' (' + JSON.stringify(p) + '): not every mechanic it can take (check Q)'); });
      { const st = { 'wla-pg-job3': JSON.stringify({ role: 'm', soak: 0, bite: 'random', kick: 1 }) }, p = load(H, 'm3', { store: st }).dbg.P2.pick; if (p.soak !== 2 || p.kick !== 1 || p.bite !== 'yes') bad('a melee "Kick a Shrieker" saved before the maps comes back as ' + JSON.stringify(p) + ', not Group Soak 2, Shrieker 1 and one red circle (check Q)');
        const st2 = { 'wla-pg-job3': JSON.stringify({ role: 'r', soak: 0, bite: 'yes', kick: 0, v: 2 }) }, p2 = load(H, 'm3', { store: st2 }).dbg.P2.pick; if (p2.soak || p2.kick) bad('"No soak" and "No kick", saved with the maps, aren\'t remembered: ' + JSON.stringify(p2) + ' (check Q)');
        // (the review, Nov 16: "No kick" with a group came back with a kick on every load; an old "Never" kept the red circle off, with no button to bring it back)
        for (const sv of [{ role: 'r', soak: 1, bite: 'yes', kick: 0, v: 2 }, { role: 'm', soak: 3, bite: 'yes', kick: 0, v: 2 }]) { const p3 = load(H, 'm3', { store: { 'wla-pg-job3': JSON.stringify(sv) } }).dbg.P2.pick; if (p3.kick || p3.soak !== sv.soak) bad('"No kick" saved with Group Soak ' + sv.soak + ' comes back as ' + JSON.stringify(p3) + ' (check Q)'); }
        { const p4 = load(H, 'm3', { store: { 'wla-pg-job3': JSON.stringify({ role: 'r', soak: 0, bite: 'no', kick: 1 }) } }).dbg.P2.pick; if (p4.bite !== 'yes' || p4.soak !== 1 || p4.kick !== 1) bad('a ranged "Never" saved before the maps comes back as ' + JSON.stringify(p4) + ', not a group, the kick and one red circle (the maps have no red circle button, check Q)'); } }
      // (every click: exactly that job, every set three soakers, each Shrieker one kicker, a healer never kicks, one red circle in a set you don't soak)
      for (const r of ['m', 'r', 'h']) for (const g of [0, 1, 2, 3]) for (const k of r === 'h' ? [0] : [0, 1, 2]) {
        set(r); if (g) M.pick('bite', 'g' + g); else M.extra('nosoak'); if (r !== 'h') { if (k) M.pick('shriek', 's' + k); else M.extra('nokick'); }
        const p = dbg.P2.pick, e = r === 'h' ? { ...p, kick: 0, bite: 'no' } : p, me = dbg.P2.slotOf(e), tag = ' (' + r + ', group ' + g + ', kick ' + k + ', check Q)';
        if (p.role !== r || p.soak !== g || (r !== 'h' && p.kick !== k)) { bad('clicking group ' + g + ' and Shrieker ' + k + ' as ' + r + ' picks ' + JSON.stringify(p) + tag); continue; }
        if (me[0] !== r || me === 'm4') bad('the pick plays as ' + me + ', not a ' + r + ' off the grips' + tag);
        for (let seed = 1; seed <= 4; seed++) { const d = ctx.pgP3Jobs(seed, me, e), J = d.J;
          if (J[me].sk.join() !== (g ? String(g) : '')) { bad('you soak sets ' + JSON.stringify(J[me].sk) + ', not ' + (g || 'none') + tag); break; }
          if (J[me].kick !== (r === 'h' ? 0 : k)) { bad('you kick Shrieker ' + J[me].kick + ', not ' + (r === 'h' ? 'none' : k) + tag); break; }
          if ([1, 2, 3].some((n) => Object.keys(J).filter((id) => J[id].sk.includes(n)).length !== 3) || [1, 2].some((s) => Object.keys(J).filter((id) => J[id].kick === s).length !== 1)) { bad('a set loses a soaker or a Shrieker its kicker' + tag); break; }
          const red = d.tg.map((L, i) => (L.includes(me) ? i + 1 : 0)).filter(Boolean); if (r === 'h' ? red.length : red.length !== 1 || red[0] === g) { bad('you get red circles in sets ' + JSON.stringify(red) + ' (seed ' + seed + ')' + tag); break; } }
        const sy = M.say(); if (!/^You [^.]*\.$/.test(sy) || /went wrong/.test(sy)) bad('the maps\' sentence isn\'t one plain sentence: "' + sy + '"' + tag); if (M.sub().length > 40) bad('the Play button\'s line runs long: "' + M.sub() + '"' + tag); }
      // (🎲 Random: any group, and any Shrieker for melee and ranged; never a kick played by a healer)
      for (const r of ['m', 'r', 'h']) { set(r); const gs = new Set(), ks = new Set(); for (let i = 0; i < 60; i++) { M.random(); const p = dbg.P2.pick; gs.add(p.soak); ks.add(r === 'h' ? 0 : p.kick); }
        if (gs.size !== 3 || [...gs].some((x) => ![1, 2, 3].includes(x))) bad('Random gives a ' + r + ' groups ' + [...gs].join(', ') + ', not any of the three (check Q)'); if (r !== 'h' && (ks.size !== 2 || ks.has(0))) bad('Random gives a ' + r + ' Shriekers ' + [...ks].join(', ') + ' (check Q)');
        if (r === 'h' && /Kick/.test(dbg.P2.role().job)) bad('Random gives a healer a kick (check Q)'); }
      // (drawn: buttons, no map and no picture; your pick lit; the same buttons under both tabs)
      try { const L1 = load(H, 'm3', { maps: true }), su = L1.dbg.setupApi(), M1 = su && su.maps;
        if (!M1) bad('the setup screen has no picks with the Plan\'s map maker loaded (check Q)');
        else for (const r of ['m', 'r', 'h']) { M1.role(r); const rows = {}, tabs = M1.tabs().map((x) => x[0]);
          for (const tab of tabs) { M1.tab = tab; const html = L1.dbg.panel(), row = (/<div class="pg-seg pg-sptab"[^>]*>([\s\S]*?)<\/div>/.exec(html) || [])[1] || '';
            rows[tab] = [...row.matchAll(/<button[^>]*data-(mt|mr|mx)="([^"]*)"[^>]*>([^<]*)<\/button>/g)].map((m) => m[1] + ':' + m[2] + ':' + m[3]).join(' | ');
            if (/pg-spmap|<image |fullbreak/.test(html)) bad('Your ' + (tab === 'bite' ? 'soak group' : 'Shrieker') + ' still shows a map for a ' + r + ' (check Q)');
            const want = M1.hot(tab), btn = [...html.matchAll(/<button type="button" data-mh="([^"]*)"([^>]*)><span class="pg-spn">([^<]*)<\/span>(?:<span class="pg-spt">([^<]*)<\/span>)?<\/button>/g)];
            if (!want.length || btn.map((m) => m[1] + ':' + m[3] + ':' + (m[4] || '')).join() !== want.map((h) => h.id + ':' + h.lab + ':' + h.note).join()) bad('the ' + tab + ' buttons for a ' + r + ' are "' + btn.map((m) => m[3]).join(', ') + '", not ' + want.map((h) => h.lab).join(', ') + ' (check Q)');
            if (btn.filter((m) => / class="on"/.test(m[2])).map((m) => m[1]).join() !== want.filter((h) => h.on).map((h) => h.id).join()) bad('the lit ' + tab + ' button for a ' + r + ' isn\'t your pick (check Q)'); }
          if (r !== 'h' && (!rows.bite || rows.bite.replace(/mt:(bite|shriek)/g, 'mt') !== String(rows.shriek).replace(/mt:(bite|shriek)/g, 'mt'))) bad('the buttons under the tabs change from Your soak group to Your Shrieker for a ' + r + ': "' + rows.bite + '" then "' + rows.shriek + '" (Flex, Nov 16: "clicking on your coil hides no egg", check Q)');
          if (!/mr:1:/.test(rows.bite) || !/mx:nosoak:No soak/.test(rows.bite) || (r !== 'h') !== /mx:nokick:No kick/.test(rows.bite)) bad('the buttons for a ' + r + ' are "' + rows.bite + '", not Random, No soak' + (r !== 'h' ? ' and No kick' : '') + ' (check Q)'); } }
      catch (e) { bad('drawing the setup\'s picks crashed: ' + e.message + ' (check Q)'); }
      // (the role defaults play clean; a melee on Group Soak 1 gets no Viper from the far clutch it can't reach (seed 1 hatched one before Nov 16))
      for (const [pk, seed, why] of [[{ role: 'm', soak: 2, bite: 'yes', kick: 1, v: 2 }, 3, 'the melee default'], [{ role: 'r', soak: 1, bite: 'yes', kick: 2, v: 2 }, 3, 'the ranged default'], [{ role: 'm', soak: 1, bite: 'yes', kick: 2, v: 2 }, 1, 'a melee on Group Soak 1']]) {
        dbg.P2.pick = pk; const r = dbg.sim(dbg.P2.slotOf(pk), true, false, seed); if (r.log.length) bad(why + ' (' + JSON.stringify(pk) + ', seed ' + seed + ') doesn\'t play clean: ' + r.log.join(' | ') + ' (check Q)'); }
      // (what a pick does in the game, played by the autopilot on another first quarter each time and turned back to the map's frame: on Group Soak g it stands
      //  in that group's circle and is counted a soaker; on Shrieker k it kicks that one, within its reach of the map's spot)
      const back = (p) => ctx.pgP3R(p, 4 - dbg.S.q1), XY = (p) => ({ x: p[0], y: p[1] });
      for (const [r, g, q] of [['r', 1, 1], ['m', 2, 2], ['h', 3, 3]]) { const pk = { role: r, soak: g, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), h = XY(S1.bites[g - 1].stack); dbg.at(T.start + 0.1, me, { seed: seedFor(ctx, q) });
        const b = dbg.S.bites[g - 1]; let n = 0, inn = 0; while (dbg.G.t < b.end + 0.5 && !(dbg.G.p3.bite[g - 1] && dbg.G.p3.bite[g - 1].done)) { dbg.step(1); if (dbg.G.t >= b.land + 1) { n++; if (hyp(back([dbg.G.x, dbg.G.y]), [h.x, h.y]) <= P.BITE) inn++; } }
        const st = dbg.G.p3.bite[g - 1]; if (!n || inn / n < 0.9 || !st || !st.by.has(me)) bad('the autopilot on Group Soak ' + g + ' (' + r + ', her first quarter ' + P.QN[q] + ') stands in that group\'s circle on the map ' + (n ? Math.round(inn / n * 100) : 0) + '% of the soak' + (st && st.by.has(me) ? '' : ' and isn\'t counted a soaker') + ' (check Q)'); }
      for (const [r, k, q] of [['m', 1, 3], ['r', 2, 1], ['m', 2, 0], ['r', 1, 2]]) { const pk = { role: r, soak: 0, bite: 'no', kick: k, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), h = XY(ctx.pgP3Held(S1, k, T.echoes)); dbg.at(T.echoes - 0.2, me, { seed: seedFor(ctx, q) });
        while (dbg.G.t < T.echoes + T.echoCast + 0.2 && dbg.G.p3.kick['sh' + k] == null) dbg.step(1); const by = dbg.G.p3.kick['sh' + k], d = hyp(back([dbg.G.x, dbg.G.y]), [h.x, h.y]);
        if (by !== me || d > P.KICK[r]) bad('the autopilot on Shrieker ' + k + ' (' + r + ', her first quarter ' + P.QN[q] + ') ' + (by === me ? 'kicks it ' + d.toFixed(1) + ' yards from the map\'s spot, past its ' + P.KICK[r] + '-yard reach' : 'doesn\'t kick it (kicked by ' + by + ')') + ' (check Q)'); }
      M.tab = 'bite'; }
  } catch (e) { bad('the spot maps check crashed: ' + e.message + ' (check Q)'); } finally { reset(); }
  // CB. the cast bars over the Shriekers' heads (Nov 16, Flex: "The interupts are impossible to track/see. The monsters should have cast bars over their
  //     heads i think to make it more visually clear theres something that needs to be interrupted", then "I appreceate the time stamps and everything on the
  //     fight, but remember this is intended to be training wheels for people to do the fight"). Before it Vicious Echoes showed as a pink glow and a label,
  //     and the target frame's bar showed it grey, as nothing to kick, under her waves' cast. Played step by step on several seeds and jobs (a melee on
  //     Shrieker 1, a ranged on Shrieker 2, a healer, a ranged with no kick), once with the kicks landing and once with both kickers held off so the casts
  //     run to their end: each Shrieker's cast has one bar over it (within 0.5 yd) through its 3 s, filling with it (within 0.05), yours exactly when it's
  //     your kick (never a healer's), in reach exactly when you are; none before or after the cast but the red "Interrupted" for about 0.8 s after a kick;
  //     and pg3dShapes draws a 'cast' for each bar, just over the Shrieker's head, with no number in any words over it.
  try {
    if (typeof dbg.P2.castBars !== 'function') bad('phase 3 has no cast bars over the Shriekers (castBars): Vicious Echoes shows only as a pink glow, and grey on your target\'s frame (check CB)');
    else {
      const errs = [], note = (m) => { if (errs.length < 10 && !errs.includes(m)) errs.push(m); };
      for (const [pk, seed] of [[{ role: 'm', soak: 0, bite: 'no', kick: 1, v: 2 }, 3], [{ role: 'r', soak: 0, bite: 'no', kick: 2, v: 2 }, seedFor(ctx, 0)], [{ role: 'h', soak: 0, bite: 'no', kick: 0, v: 2 }, seedFor(ctx, 2)], [{ role: 'r', soak: 1, bite: 'no', kick: 0, v: 2 }, seedFor(ctx, 1)]]) for (const hold of [false, true]) {
        dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), rg = P.KICK[me[0]] || 0, tag = pk.role + (pk.kick ? ' on Shrieker ' + pk.kick : '') + ' (seed ' + seed + (hold ? ', kicks held' : '') + ')';
        const A3 = { get G() { return dbg.G; }, get S() { return dbg.S; }, me, bossAt: dbg.P2.bossAt, tailAt: dbg.P2.tailAt, rl: (id) => id[0], nm: (id) => id, clsC: () => null, P2: dbg.P2 };
        dbg.at(T.echoes - 1, me, { seed }); const S = dbg.S, kt = {}, seen = new Set(), full = new Set(), kseen = new Set(); let n = 0;
        const kickers = (e) => Object.keys(S.job).filter((id) => S.job[id].kick === e.k);
        while (dbg.G.t < T.echoes + T.echoCast + 2) { const G = dbg.G, t0 = G.t; let own = false;
          if (hold) S.echoes.forEach((e) => { if (t0 >= e.t0 - 0.2 && t0 <= e.t1 && !G.p3.kick[e.sh]) kickers(e).forEach((id) => { if (id === me) own = true; else G.p3.stun[id] = t0 + 0.2; }); });
          if (hold && own) dbg.stepOwn(1); else dbg.step(1); G.hp = 100; n++;
          const t = G.t, bars = dbg.P2.castBars(t);
          S.echoes.forEach((e) => { const k = G.p3.kick[e.sh]; if (k && k !== 'none' && kt[e.sh] == null) kt[e.sh] = t; }); /* (a kick lands at the end of the step it's in) */
          bars.forEach((b) => { if (!S.echoes.some((e) => e.sh === b.key)) note(tag + ': a bar "' + b.key + '" at ' + clkS(t) + ' that is no Vicious Echoes'); if (b.caster !== b.key) note(tag + ': ' + b.key + '\'s bar names ' + b.caster);
            if (!(b.h >= 5.6)) note(tag + ': ' + b.key + '\'s bar sits ' + b.h + ' yards up, in the Shrieker\'s head (at least 5.6)'); if (/\d/.test(String(b.name))) note(tag + ': a bar\'s words have a number in them: "' + b.name + '"'); if (b.mine && !rg) note(tag + ': a healer\'s bar says it\'s their kick'); });
          S.echoes.forEach((e) => { const bs = bars.filter((b) => b.key === e.sh), s = G.p3.sh[e.sh], p = s ? [s.x, s.y] : null, k = G.p3.kick[e.sh], at = clkS(t) + ' (' + (t - e.t0).toFixed(2) + ' s in)';
            if (k && k !== 'none') { const a = t - kt[e.sh];
              if (a >= 0.02 && a <= 0.75 && p) { if (bs.length !== 1 || bs[0].state !== 'kicked') note(tag + ': ' + e.sh + ' kicked ' + a.toFixed(2) + ' s ago shows ' + (bs.length ? bs.map((b) => b.state).join(', ') : 'no bar') + ', not one red "Interrupted"'); else kseen.add(e.sh); }
              else if (a > 0.85 && bs.length) note(tag + ': ' + e.sh + '\'s bar is still up ' + a.toFixed(2) + ' s after its kick'); return; }
            if (t > e.t0 + 0.02 && t < e.t1 - 0.02 && !k && p) { const f = (t - e.t0) / (e.t1 - e.t0), b = bs[0];
              if (bs.length !== 1) { note(tag + ': ' + e.sh + ' has ' + bs.length + ' bars over it at ' + at + ', in its cast, not one'); return; }
              if (b.state !== 'cast') note(tag + ': ' + e.sh + '\'s bar at ' + at + ' is "' + b.state + '", not casting');
              if (Math.hypot(b.x - p[0], b.y - p[1]) > 0.5) note(tag + ': ' + e.sh + '\'s bar is ' + Math.hypot(b.x - p[0], b.y - p[1]).toFixed(1) + ' yd off its Shrieker at ' + at);
              if (!(Math.abs(b.f - f) <= 0.05)) note(tag + ': ' + e.sh + '\'s bar is ' + Math.round(b.f * 100) + '% full at ' + at + '; its cast is ' + Math.round(f * 100) + '% gone');
              const mine = !!rg && !!S.job[me] && S.job[me].kick === e.k, near = !!rg && Math.hypot(p[0] - G.x, p[1] - G.y) <= rg;
              if (b.mine !== mine) note(tag + ': ' + e.sh + '\'s bar ' + (mine ? 'doesn\'t say it\'s your kick, and it is' : 'says it\'s your kick, and it isn\'t') + ' (' + at + ')');
              if (b.near !== near) note(tag + ': ' + e.sh + '\'s bar says you\'re ' + (b.near ? 'in' : 'out of') + ' reach at ' + at + ', and you\'re ' + (near ? 'in' : 'out of') + ' it');
              seen.add(e.sh); if (f >= 0.9) full.add(e.sh); }
            else if ((t < e.t0 - 0.02 || t > e.t1 + 0.02 || k === 'none') && bs.length) note(tag + ': ' + e.sh + ' has a bar at ' + clkS(t) + ', outside its cast (' + clkS(e.t0) + ' to ' + clkS(e.t1) + ')'); });
          if (bars.length && n % 3 === 0) { const L3 = ctx.pg3dShapes(A3, t);
            bars.forEach((b) => { if (!L3.some((s) => s.k === 'cast' && s.key === b.key && s.state === b.state && s.x === b.x && s.y === b.y)) note(tag + ': pg3dShapes draws no cast bar for ' + b.key + ' at ' + clkS(t));
              const lb = L3.find((s) => s.k === 'label' && Math.hypot(s.x - b.x, s.y - b.y) < 0.6 && /\d/.test(s.text || '')); if (lb) note(tag + ': "' + lb.text + '" floats over ' + b.caster + ' with its cast bar at ' + clkS(t) + ' (training wheels: no seconds)'); }); } }
        if (seen.size < 2) note(tag + ': only ' + seen.size + ' of the two Vicious Echoes had a bar');
        if (hold && full.size < 2) note(tag + ': with the kicks held only ' + full.size + ' bars filled to the end of their cast');
        if (!hold && kseen.size < 1) note(tag + ': no red "Interrupted" bar was seen after the kicks landed'); }
      errs.forEach((m) => bad('the cast bars: ' + m + ' (check CB)')); }
  } catch (e) { bad('the cast bars crashed phase 3: ' + e.message + ' (check CB)'); } finally { reset(); }
  // RS. the release sweep, Nov 16 (Flex: "im trying to have this game in a released state for today, so i just need it to really work and be functional").
  //     RS1 (p30): your arrow at Circling Prey pointed straight at the next quarter's spot, over the hole in the middle, and only from 2.5 s into the cast; a
  //     player who walked along it stopped at the stone's edge and was broken under at 7:20 (healer seed 13, ranged on Shrieker 2 seed 5). Followed step by
  //     step here, it shows from the start of the cast and gets you off her quarter every time.
  try { const errs = [], note = (m) => { if (errs.length < 8 && !errs.includes(m)) errs.push(m); };
    for (const [pk, seed, pis] of [[{ role: 'h', soak: 0, bite: 'no', kick: 0, v: 2 }, 13, [0, 2]], [{ role: 'r', soak: 0, bite: 'no', kick: 2, v: 2 }, 5, [0, 1]], [{ role: 'r', soak: 0, bite: 'no', kick: 2, v: 2 }, 2, [0]], [{ role: 'h', soak: 0, bite: 'no', kick: 0, v: 2 }, 10, [0]], [{ role: 'm', soak: 0, bite: 'no', kick: 1, v: 2 }, 4, [2]]]) for (const pi of pis) { /* (her first quarter north-east, south-west, north-west, south-east) */
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), tag = pk.role + ' (seed ' + seed + '), Circling Prey ' + (pi + 1); dbg.at(T.prey[pi] - 0.05, me, { seed }); const G = dbg.G, S = dbg.S, n0 = dbg.log.length; let early = null;
      if (ctx.pgP3Q(G.x, G.y) !== S.Qs[pi]) { note(tag + ': you aren\'t on her quarter as the cast starts, so there\'s nothing to follow'); continue; }
      /* (from the prompts audit, Nov 16, the arrow waits while a wave crosses your way, and the job line says so: "Wait: let it pass, then go." (phase 1's words since
         the review, Nov 16), or a dodge) */
      while (G.t < S.hit[pi] + 0.3) { const h = dbg.hint(); if (early == null && G.t >= T.prey[pi] + 0.2) early = !!h || /^Wait:|gap/.test(dbg.P2.jobText()); if (h) dbg.walkTo(h.T); dbg.stepOwn(1); G.hp = 100; }
      const L = dbg.log.slice(n0); if (L.some((x) => /destroyed her quarter with you on it|venom off the platform/.test(x))) note(tag + ': walking where the arrow points: ' + L.join(' | '));
      if (!early && pi !== 1) note(tag + ': no arrow 0.2 s into the cast, with you on the quarter she breaks'); } /* (at the 2nd it shows the gateway, in the raid's stack: often under 2.5 yards, so no arrow) */
    errs.forEach((m) => bad('the arrow at Circling Prey: ' + m + ' (the release sweep, Nov 16, check RS1)'));
  } catch (e) { bad('the arrow at Circling Prey crashed: ' + e.message + ' (check RS1)'); } finally { reset(); }
  //     RS2 (p31): "Your Volatile Purge waves headed through N raiders" for a soaker standing on the gold ring whose waves touched nobody (healer Group Soak 3,
  //     seed 21: "headed through 6"): the lanes were judged as they showed, against where everyone stood and where each bot was walking. Scored now on what
  //     the waves really touch (the shape your own wave hits use), so the ring-stander is clean and a raider a wave rolls over still counts.
  try { const onW = (w, t, p) => { if (t < w.t0 || t > w.t1) return false; const a = w.deg * Math.PI / 180, u = Math.cos(a), v = Math.sin(a), el = t - w.t0, rx = p[0] - (w.x + u * w.v * el), ry = p[1] - (w.y + v * w.v * el), s1 = rx * u + ry * v; return Math.abs(ry * u - rx * v) <= w.w / 2 + 0.7 && s1 >= -w.d / 2 - 0.7 && s1 <= w.d / 2 + 3.7; };
    const pk = { role: 'h', soak: 3, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk);
    { dbg.at(T.bite[2] - 1, me, { seed: 21 }); const G = dbg.G, S = dbg.S, n0 = dbg.log.length, touched = new Set(); let onRing = 0;
      while (G.t < S.end - 0.01) { const pu = G.p3.purge.find((q) => q.who.includes(me) && G.t < q.burst + 2.1); if (pu && pu.spot[me]) { dbg.walkTo(pu.spot[me]); dbg.stepOwn(1); if (G.t >= pu.burst - 1.5 && G.t < pu.burst && hyp([G.x, G.y], pu.spot[me]) < 0.5) onRing++; } else dbg.step(1); G.hp = 100;
        S.waves.forEach((w) => { if (w.kind === 'purge' && w.from === me) Object.keys(G.bots).forEach((id) => { if (id !== me && onW(w, G.t, [G.bots[id].x, G.bots[id].y])) touched.add(id); }); }); }
      const L = dbg.log.slice(n0).filter((x) => /Volatile Purge waves/.test(x));
      if (!onRing) bad('the Group Soak 3 healer (seed 21) never stood on their gold ring for the Purge, so the waves check tested nothing (check RS2)');
      else if (L.length && !touched.size) bad('a soaker on the gold ring gets "' + L.join(' | ') + '" with their waves touching nobody (healer Group Soak 3, seed 21; the release sweep, Nov 16, check RS2)'); }
    { dbg.at(T.bite[2] - 1, me, { seed: 21 }); const G = dbg.G, S = dbg.S, n0 = dbg.log.length; let w = null, held = null;
      while (G.t < S.end - 0.01) { dbg.step(1); G.hp = 100; if (!w) { w = S.waves.find((x) => x.kind === 'purge' && x.from === me) || null; const q = w && G.p3.purge.find((z) => z.who.includes(me)); if (w) held = Object.keys(G.bots).find((id) => id !== me && !(q && q.who.includes(id))); }
        if (w && held && G.t <= w.t1) { const a = w.deg * Math.PI / 180; G.bots[held].x = w.x + Math.cos(a) * 8; G.bots[held].y = w.y + Math.sin(a) * 8; } }
      if (!w) bad('the Group Soak 3 healer (seed 21) sent no Purge waves (check RS2)');
      else if (!dbg.log.slice(n0).some((x) => /Your Volatile Purge waves hit \d+ raiders?\./.test(x))) bad('a raider held in the way of your Purge wave isn\'t counted: ' + dbg.log.slice(n0).join(' | ') + ' (the release sweep, Nov 16, check RS2)'); }
  } catch (e) { bad('the Purge waves check crashed: ' + e.message + ' (check RS2)'); } finally { reset(); }
  //     RS3 (p32): "Press Q (defensive) as it lands" at the 3rd Circling Prey for a Group Soak 3 player, whose Q (90 s) was then still cooling down for their
  //     soak's drain: "without a defensive" at 9:42 (healer seed 3 from 9:00, pressing Q when told). Now they're told to save it for the soak; everyone else,
  //     and Group Soak 3 at the 2nd (it's back by 9:41), still press it.
  try { const pk = { role: 'h', soak: 3, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk);
    { dbg.at(T.start, me, { seed: 3 }); dbg.ff(540); const G = dbg.G, S = dbg.S, n0 = dbg.log.length, said = new Set(); let up = false;
      /* (since the prompts audit, Nov 16: "Press Q (defensive) now!" in the last second too, so any line in the cast counts) */
      while (G.t < S.end - 0.01) { const t = G.t, jt = dbg.P2.jobText(); if (t >= T.prey[2] && t < S.hit[2] && (/^Off her quarter/.test(jt) || /Press Q/.test(jt))) said.add(jt.replace(/^Off her quarter: good\.\s*/, ''));
        if (t >= T.prey[2] && t < S.hit[2] && dbg.P2.upNext(t).some((u) => /lands: Q/.test(u.text))) up = true;
        if (t >= S.hit[2] - 0.5 && t < S.hit[2] - 0.45 && /Press Q as it lands/.test(jt) && t - G.def >= 90) { G.def = t; G.debs.def = { until: t + 8, n: 1 }; } /* (as you would: Q as she lands) */
        dbg.step(1); G.hp = 100; }
      const ss = [...said].join(' / ');
      if (dbg.log.slice(n0).some((x) => /without a defensive/.test(x))) bad('a Group Soak 3 healer from 9:00 who presses Q when the screen says takes the end of the 3rd bite without one: ' + dbg.log.slice(n0).join(' | ') + ' (the release sweep, Nov 16, check RS3)');
      if (/Press Q/.test(ss) || !/Save your defensive \(Q\) for your soak\./.test(ss)) bad('at the 3rd Circling Prey a Group Soak 3 player is told "' + ss + '", with their Q still cooling down at their soak (check RS3)');
      if (up) bad('"What\'s next" says "Circling Prey lands: Q" at the 3rd Circling Prey to a Group Soak 3 player (check RS3)'); }
    for (const [pk2, pi] of [[pk, 1], [{ role: 'r', soak: 0, bite: 'no', kick: 0, v: 2 }, 2]]) { dbg.P2.pick = pk2; const me2 = dbg.P2.slotOf(pk2); dbg.at(T.prey[pi] + 6, me2, { seed: 3 }); dbg.pos = dbg.S.F2([14, 14], pi + 1); dbg.stepOwn(1);
      if (!/Press Q as it lands\./.test(dbg.P2.jobText())) bad('at Circling Prey ' + (pi + 1) + ' ' + (pk2.soak ? 'a Group Soak ' + pk2.soak : 'a') + ' ' + pk2.role + ' with Q back in time isn\'t told to press it: ' + dbg.P2.jobText() + ' (check RS3)'); }
  } catch (e) { bad('the Circling Prey Q check crashed: ' + e.message + ' (check RS3)'); } finally { reset(); }
  //     RS4 (p33): the job line said to step out of the small tails' red lanes; the game draws none for them (rings of waves, no warning strip).
  //     (since the prompts audit, Nov 16, the line shows when their waves will reach your spot: stood here where one will)
  try { const pk = { role: 'r', soak: 0, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; dbg.at(T.tails[0] + 2.4, dbg.P2.slotOf(pk), { seed: 3 }); const G = dbg.G, S = dbg.S; let seen = '';
    const tw = S.waves.find((w) => w.kind === 'tail' && Math.abs(w.t0 - G.t) < 0.06), al = dbg.P2.alive(G.t);
    if (tw) for (let k = 0; k < tw.n && !seen; k++) for (const R of [12, 18, 24, 30]) { const a = tw.ph + k * 2 * Math.PI / tw.n, p = [tw.x + Math.cos(a) * R, tw.y + Math.sin(a) * R]; if (!ctx.pgP3Floor(p[0], p[1], al, 1)) continue; dbg.pos = p; dbg.stepOwn(1); const jt = dbg.P2.jobText(); if (/Small tails/.test(jt)) { seen = jt; break; } }
    if (!seen) bad('the small tails\' job line never shows (check RS4)'); else if (/red lanes/.test(seen) && S.waves.filter((w) => w.kind === 'tail').every((w) => !w.warn)) bad('the job line says "' + seen + '"; the small tails\' waves show no red lanes (the release sweep, Nov 16, check RS4)');
  } catch (e) { bad('the small tails\' line check crashed: ' + e.message + ' (check RS4)'); } finally { reset(); }
  //     RS5 (flow2): the bar under your target's frame showed her cast whatever you'd picked: your Shrieker read "Caustic Waves" through most of your kick, its
  //     Vicious Echoes grey, with no "Interrupted (you)" after it (ranged on Shrieker 2, seed 3). Now, as in phase 2: your target's Vicious Echoes, gold to
  //     kick (grey for a healer), then "Interrupted" for a moment; her cast with nothing of your target's.
  try { if (typeof dbg.P2.castOf !== 'function') bad('phase 3 has no castOf: the bar under your target\'s frame shows her cast whatever you\'ve picked (the release sweep, Nov 16, check RS5)');
    else { const errs = [], note = (m) => { if (errs.length < 8 && !errs.includes(m)) errs.push(m); };
      for (const [pk, seed, hold] of [[{ role: 'r', soak: 0, bite: 'no', kick: 2, v: 2 }, 3, false], [{ role: 'm', soak: 0, bite: 'no', kick: 1, v: 2 }, 5, false], [{ role: 'r', soak: 0, bite: 'no', kick: 2, v: 2 }, 7, true], [{ role: 'h', soak: 0, bite: 'no', kick: 0, v: 2 }, 3, false]]) {
        dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), k = 'sh' + (pk.kick || 2), tag = pk.role + ' on ' + k + ' (seed ' + seed + (hold ? ', the kick held' : '') + ')'; dbg.at(T.echoes - 0.3, me, { seed }); const G = dbg.G, S = dbg.S, e = S.echoes.find((q) => q.sh === k); let kt = null, sawK = false, sawI = false;
        while (G.t < e.t1 + 1.5) { if (hold) dbg.stepOwn(1); else dbg.step(1); G.hp = 100; dbg.tgt = k; const t = G.t, c = dbg.P2.castOf(t), by = G.p3.kick[k], rd2 = c ? '"' + c.name + '"' + (c.intr ? '' : c.kick ? ' (kick)' : ' (grey)') : 'nothing'; if (by && by !== 'none' && kt == null) kt = t;
          if (!G.p3.sh[k]) continue;
          if (t > e.t0 + 0.02 && t < e.t1 - 0.02 && !by) { if (!c || c.name !== 'Vicious Echoes' || !!c.kick !== (pk.role !== 'h') || c.intr) note(tag + ': ' + (t - e.t0).toFixed(2) + ' s into its Vicious Echoes the bar reads ' + rd2); else sawK = true; }
          else if (kt != null && t - kt >= 0.02 && t - kt <= 0.85) { if (!c || !c.intr || (by === me ? c.name !== 'Interrupted (you)' : !/^Interrupted \(.+\)$/.test(c.name))) note(tag + ': ' + (t - kt).toFixed(2) + ' s after the kick (by ' + by + ') the bar reads ' + rd2); else sawI = true; }
          else if (kt != null && t - kt > 1) { const her = S.casts.find((q) => q.who === 'boss' && t >= q.t0 && t <= q.t1); if (her && (!c || c.name !== her.name)) note(tag + ': after the kick the bar reads ' + rd2 + ', not her ' + her.name); } }
        if (!sawK) note(tag + ': the bar never shows its Vicious Echoes'); if (!hold && !sawI) note(tag + ': no "Interrupted" on the bar after the kick'); if (hold && kt != null) note(tag + ': held, and still kicked (by ' + G.p3.kick[k] + ')'); }
      { dbg.tgt = null; const t = dbg.G.t, her = dbg.S.casts.find((q) => q.who === 'boss' && t >= q.t0 && t <= q.t1), c = dbg.P2.castOf(t); if (her && (!c || c.name !== her.name)) note('with nothing picked the bar reads ' + (c ? '"' + c.name + '"' : 'nothing') + ', not her ' + her.name); }
      errs.forEach((m) => bad('the bar under your target\'s frame: ' + m + ' (the release sweep, Nov 16, check RS5)')); }
  } catch (e) { bad('the target frame\'s bar check crashed: ' + e.message + ' (check RS5)'); } finally { reset(); }
  //     RS6 (the release check, Nov 16): "Press Q (defensive) as it lands" and "Circling Prey lands: Q" showed while Q was still cooling down at the landing,
  //     and pressing it then did nothing: a Group Soak 2 melee whose Q went on their soak at 7:58 was told to press it at 8:11 (back at 9:28; seed 3 from 7:35),
  //     and a ranged who pressed it at 8:11 as told was told again at 9:12 (back at 9:41; seed 3). RS3 checks it's still asked for when Q is back in time.
  try { for (const [pk, pi, q8] of [[{ role: 'm', soak: 2, bite: 'no', kick: 0, v: 2 }, 1, false], [{ role: 'r', soak: 0, bite: 'no', kick: 0, v: 2 }, 2, true]]) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), tag = pk.role + (pk.soak ? ' on Group Soak ' + pk.soak : ' with no soak') + ', Circling Prey ' + (pi + 1) + ' (seed 3)'; dbg.at(T.start, me, { seed: 3 }); dbg.ff(455); const G = dbg.G, S = dbg.S, said = new Set(), up = new Set();
      while (G.t < S.hit[pi] - 0.1) { if (q8 && G.t >= S.hit[1] - 0.5 && G.t - G.def >= 90) { G.def = G.t; G.debs.def = { until: G.t + 8, n: 1 }; } /* (Q at 8:11, as told) */
        if (G.t >= T.prey[pi]) { const jt = dbg.P2.jobText(); if (/^Off her quarter|Press Q/.test(jt)) said.add(jt); dbg.P2.upNext(G.t).forEach((u) => { if (/lands: Q/.test(u.text)) up.add(u.text); }); } dbg.step(1); }
      if (!(G.def + 90 > S.hit[pi])) bad(tag + ': Q isn\'t cooling down at the landing, so this tests nothing (check RS6)');
      else { if ([...said].some((x) => /Press Q/.test(x))) bad(tag + ': the screen says "' + [...said].join(' / ') + '" with Q cooling down until ' + clkS(G.def + 90) + ' (the release check, Nov 16, check RS6)');
        if (up.size) bad(tag + ': "What\'s next" says "Circling Prey lands: Q" with Q cooling down until ' + clkS(G.def + 90) + ' (the release check, Nov 16, check RS6)'); } }
  } catch (e) { bad('the Q-on-cooldown check crashed: ' + e.message + ' (check RS6)'); } finally { reset(); }
  // PA. the prompts audit, Nov 16 (Flex: "Lets improve the curated experience as the game guides players onto what they need to do next. I think the alerts and
  //     training wheels could be better in terms of the on screen prompts", then "All 10"; and "i feel like the game confuses people saying timestamps"). Each
  //     names the audit's own run it came from. hyp, script, T and P as above.
  const SHAPES = (t) => { const L = { labels: [], rings: [] }; dbg.P2.shapes(t, () => {}, { disc() {}, grow() {}, ring: (x, y, r, c) => L.rings.push({ x, y, r, c }), label: (x, y, h, text, c) => L.labels.push({ x, y, text, c }) }); return L; };
  //     PA1 (fix 1, the arrow walks you into danger): a player who walks wherever the arrow points (and lets the autopilot play the rest) was hit in all four of the
  //     audit's runs: melee seed 3 at 8:03 and 9:36, ranged seed 3 at 7:13, 8:03 and 9:36, healer seed 8 and ranged seed 11 at 7:13 (the small tails at the first
  //     Circling Prey, her waves on the way to the gateway before it opened, her 4th waves back to the third bite's gold ring). No hit may follow an arrow step now.
  try { const errs = [], HITS = /Caustic Waves hit you|Falling Debris landed on you|Purge hit you/;
    for (const [pk, seed] of [[{ role: 'm', soak: 2, kick: 1, bite: 'yes', v: 2 }, 3], [{ role: 'r', soak: 1, kick: 2, bite: 'yes', v: 2 }, 3], [{ role: 'h', soak: 3, kick: 2, bite: 'yes', v: 2 }, 8], [{ role: 'r', soak: 1, kick: 2, bite: 'yes', v: 2 }, 11]]) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.start, me, { seed }); const G = dbg.G, S = dbg.S; let led = -9;
      while (G.t < S.end - 0.01) { const h = dbg.hint(), n0 = dbg.log.length; if (h) { led = G.t; dbg.walkTo(h.T); dbg.stepOwn(1); } else dbg.step(1); G.hp = 100;
        dbg.log.slice(n0).forEach((x) => { if (HITS.test(x) && G.t - led <= 1.5 && errs.length < 8) errs.push(pk.role + ' seed ' + seed + ': ' + x + ' (walking where the arrow pointed)'); }); } }
    errs.forEach((m) => bad('the arrow walks you into danger: ' + m + ' (the prompts audit, Nov 16, check PA1)'));
    // (the second gateway: no arrow and "wait", not "now", until it opens; then the arrow and "go through now". Before: the arrow pointed at it from 8:03.1 through
    //  her waves, and the line said "now" and "wait" together)
    // (stood round it, 3.5 yards off, from 8:03.6 to 8:06.9: where her wave or the small tails will reach you the line says to dodge, elsewhere to wait)
    const pk = { role: 'r', soak: 0, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.prey[1] + 0.5, me, { seed: 3 }); const g2 = dbg.S.gates.find((g) => g.k === 2);
    if (!g2) bad('no second gateway to check (check PA1)'); else { let waited = 0; const lines = new Set();
      for (let k = 0; dbg.G.t < g2.t0 - 0.1; k++) { const a = (k % 8) * Math.PI / 4, p = [g2.p[0] + Math.cos(a) * 3.5, g2.p[1] + Math.sin(a) * 3.5]; if (!dbg.P2.onPlat(p[0], p[1])) { dbg.stepOwn(1); continue; } dbg.pos = p; dbg.stepOwn(1); dbg.G.hp = 100; const h0 = dbg.hint(), j0 = dbg.P2.jobText(); lines.add(j0);
        if (h0 && hyp(h0.T, g2.p) < 3) { bad('at ' + clkS(dbg.G.t) + ' the arrow points at the second gateway, which opens at 8:07 once her waves pass (the audit, ranged seed 3: hit at 8:03; check PA1)'); break; }
        if (/wait/i.test(j0) && /\bnow\b/i.test(j0)) { bad('by the second gateway the job line says "' + j0 + '": "wait" and "now" in one line (check PA1)'); break; } if (/^Wait by the gateway/.test(j0)) waited++; }
      if (!waited) bad('by the second gateway before it opens the job line never says to wait by it: ' + [...lines].join(' / ') + ' (check PA1)');
      while (dbg.G.t < g2.t0 + 0.1) dbg.stepOwn(1); let opened = false; const said1 = new Set(); /* (from each side, 4 yards off: one with nothing crossing your way gets the arrow and "go through") */
      for (let k = 0; k < 8 && !opened; k++) { const a = k * Math.PI / 4, p = [g2.p[0] + Math.cos(a) * 4, g2.p[1] + Math.sin(a) * 4]; if (!dbg.P2.onPlat(p[0], p[1]) || ctx.pgP3Q(p[0], p[1]) !== dbg.S.Qs[1]) continue; dbg.pos = p; dbg.G.p3.hp = null; const h1 = dbg.hint(), j1 = dbg.P2.jobText(); said1.add(j1); if (h1 && hyp(h1.T, g2.p) < 1 && /^Go through the gateway/.test(j1)) opened = true; }
      if (!opened) bad('as the second gateway opens, no arrow to it and "go through" from any side: ' + [...said1].join(' / ') + ' (check PA1)');
      if (!dbg.S.warns.some((w) => Math.abs(w.t - g2.t0) < 0.01 && /^Gateway open: go through/.test(w.text))) bad('no "Gateway open" call as the second gateway opens (check PA1)'); }
  } catch (e) { bad('the arrow-follower check crashed: ' + e.message + ' (check PA1)'); } finally { reset(); }
  //     PA2 (fix 2, dodges with no words): every small tails pair has a call, the last (9:39) too; the soakers' Purge waves get a call for everyone else as their red
  //     lanes show (the second biggest phase 3 killer on the 116 kills had none); and the job line names the danger when a wave will reach your spot, says nothing
  //     of it in a gap, and wins over your soak (the audit's 9:33: "stay on the gold ring" while her waves crossed it).
  try { const S3 = script({ seed: 3, me: 'r1', pick: null });
    T.tails.forEach((b0) => { if (!S3.warns.some((w) => Math.abs(w.t - (b0 + 0.4)) < 0.01 && /^Small tails: step/.test(w.text))) bad('the small tails at ' + clkS(b0) + ' have no call (the audit: the last pair at 9:39.5 had none, check PA2)'); });
    { const pk = { role: 'r', soak: 0, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.start, me, { seed: 3 }); const G = dbg.G, S = dbg.S, bursts = new Set();
      while (G.t < S.end - 0.01) { dbg.step(1); G.hp = 100; G.p3.purge.forEach((q) => { if (!q.who.includes(me)) bursts.add(+q.burst.toFixed(3)); }); }
      if (bursts.size < 3) bad('only ' + bursts.size + ' Volatile Purges to check the call for (check PA2)');
      bursts.forEach((b) => { if (!S.warns.some((w) => Math.abs(w.t - (b - 1.5)) < 0.06 && /^Soakers' waves: keep out of the red lanes/.test(w.text))) bad('no "Soakers\' waves" call for the Purge bursting at ' + clkS(b) + ' (the audit: nothing for anyone not soaking, check PA2)'); }); }
    // (her waves: a spot her wall will roll over, and one in a gap beside it, 1 s after they leave her)
    { const pk = { role: 'm', soak: 0, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), w0 = T.waves[1] + T.wavesCast; dbg.at(w0 + 0.5, me, { seed: 3 }); const S = dbg.S, w = S.waves.find((q) => q.kind === 'her3' && Math.abs(q.t0 - w0) < 0.01), al = dbg.P2.alive(dbg.G.t);
      const a = w.deg * Math.PI / 180, u = [Math.cos(a), Math.sin(a)], v = [-Math.sin(a), Math.cos(a)], el = dbg.G.t - w.t0; let hitS = null, gapS = null;
      for (const ahead of [14, 18, 22, 26]) for (let z = -38.5; z <= 38.5 && !(hitS && gapS); z += 5.5) { const p = [w.x + u[0] * (w.v * el + ahead) + v[0] * z, w.y + u[1] * (w.v * el + ahead) + v[1] * z]; if (!ctx.pgP3Floor(p[0], p[1], al, 1.5)) continue; /* (cres: the wall's solid stretches; the gaps are between them) */ const onWall = w.cres.some(([g0, g1]) => z >= g0 + 1.2 && z <= g1 - 1.2), inGap = !w.cres.some(([g0, g1]) => z >= g0 - 1.5 && z <= g1 + 1.5); if (onWall && !hitS) hitS = p; if (inGap && !gapS) gapS = p; }
      if (!hitS || !gapS) bad('no spot to stand in her 2nd waves\' path (check PA2)');
      else { dbg.pos = hitS; dbg.stepOwn(1); const j1 = dbg.P2.jobText(); if (!/^Her waves: step/.test(j1)) bad('standing where her waves will roll over you in about a second, the job line says "' + j1 + '" (check PA2)');
        dbg.pos = gapS; dbg.stepOwn(1); dbg.G.p3.jl = null; const j2 = dbg.P2.jobText(); if (/step/.test(j2) && /Her waves/.test(j2)) bad('standing in a gap in her waves, the job line still says "' + j2 + '" (check PA2)'); } }
    // (the soakers' Purge waves on you, a non-soaker; your gold ring crossed by her 4th waves during the 3rd bite (healer, Group Soak 3, seed 3))
    { const pk = { role: 'r', soak: 0, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.bite[0] + 5, me, { seed: 3 }); const G = dbg.G, S = dbg.S; while (G.t < S.end && !S.waves.some((w) => w.kind === 'purge' && w.t0 > G.t)) dbg.step(1);
      const PW = S.waves.filter((w) => w.kind === 'purge' && w.t0 > G.t); if (!PW.length) bad('no Purge waves to stand in (check PA2)'); else { let said = '', tried = 0;
        for (const pw of PW) { const a = pw.deg * Math.PI / 180; for (const R of [3, 6, 9]) { const p = [pw.x + Math.cos(a) * R, pw.y + Math.sin(a) * R]; if (!dbg.P2.onPlat(p[0], p[1])) continue; tried++; dbg.pos = p; dbg.G.p3.hp = null; said = dbg.P2.jobText(); if (/^Soakers' waves: step/.test(said)) break; } if (/^Soakers' waves: step/.test(said)) break; }
        if (!tried) said = '(no lane over the stone)';
        if (!/^Soakers' waves: step/.test(said)) bad('standing in a soaker\'s Purge lane as it shows, the job line says "' + said + '" (check PA2)'); } }
    { const pk = { role: 'h', soak: 3, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.bite[2] + 6.5, me, { seed: 3 }); const G = dbg.G, S = dbg.S, b = S.bites[2]; let said = '';
      while (G.t < T.waves[3] + T.wavesCast + 5) { dbg.pos = b.stack.slice(); dbg.stepOwn(1); G.hp = 100; const jt = dbg.P2.jobText(); if (/Her waves: step into a gap, then back/.test(jt)) { said = jt; break; } }
      if (!said) bad('on the 3rd bite\'s gold ring as her 4th waves cross it, the job line never says to step into a gap and back (the audit, 9:33.6: it kept "stand on the gold ring", check PA2)'); }
  } catch (e) { bad('the dodge words check crashed: ' + e.message + ' (check PA2)'); } finally { reset(); }
  //     PA3 (fix 3, the arrow stops short of where the game counts you): your arrow's ring (ob.r) is the ring drawn there, at the gateway, your soak spot and your Purge
  //     spot, and the gateway takes you anywhere inside its drawn ring.
  // (a spot on the quarter the raid landed on, d yards from the gateway onto her quarter)
  const offGate = (g1, d) => { for (let k = 0; k < 16; k++) { const p = [g1.p[0] + Math.cos(k * Math.PI / 8) * d, g1.p[1] + Math.sin(k * Math.PI / 8) * d]; if (ctx.pgP3Q(p[0], p[1]) === P.land && dbg.P2.onPlat(p[0], p[1])) return p; } return null; };
  try { const pk = { role: 'r', soak: 1, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), seed = seedFor(ctx, 1); dbg.at(T.start + 0.05, me, { seed }); const g1 = dbg.S.gates.find((g) => g.k === 1);
    if (!g1) bad('no gateway onto her quarter to check (check PA3)'); else { const p8 = offGate(g1, 8); dbg.walkTo(null); while (dbg.G.t < g1.t0 + 0.1) { dbg.pos = p8; dbg.stepOwn(1); } const ob = dbg.job(me).ob, R = SHAPES(dbg.G.t).rings.find((r) => hyp([r.x, r.y], g1.p) < 0.1 && r.c === '#f3c969');
      if (!ob || !R || Math.abs(ob.r - R.r) > 0.01) bad('your arrow to the gateway stops at ' + (ob ? ob.r : 'none') + ' yards, its gold ring is drawn at ' + (R ? R.r : 'none') + ' (check PA3)');
      else { const pin = offGate(g1, R.r - 0.05); dbg.pos = pin; dbg.stepOwn(2); if (!dbg.G.p3.used[me + 'g1']) bad('standing inside the gateway\'s gold ring (' + (R.r - 0.05).toFixed(2) + ' yards from it) doesn\'t take you through (check PA3)'); } }
    dbg.at(T.bite[0] + 0.5, me, { seed: 3 }); const b = dbg.S.bites[0]; dbg.pos = [b.stack[0] + 15, b.stack[1]]; if (!dbg.P2.onPlat(b.stack[0] + 15, b.stack[1])) dbg.pos = [b.stack[0], b.stack[1] - 15]; dbg.stepOwn(1);
    { const ob = dbg.job(me).ob, R = SHAPES(dbg.G.t).rings.find((r) => hyp([r.x, r.y], b.stack) < 0.1 && r.c === '#f3c969'); if (!ob || !R || Math.abs(ob.r - R.r) > 0.01) bad('your arrow to your soak stops at ' + (ob ? ob.r : 'none') + ' yards, its gold ring is drawn at ' + (R ? R.r : 'none') + ' (check PA3)'); }
    while (dbg.G.t < b.end && !(dbg.G.p3.purge.some((q) => q.who.includes(me)))) { dbg.pos = b.stack.slice(); dbg.stepOwn(1); dbg.G.hp = 100; } const pu = dbg.G.p3.purge.find((q) => q.who.includes(me));
    if (!pu) bad('no Purge for the soaker to check (check PA3)'); else { const ob = dbg.job(me).ob, sp = pu.spot[me], R = SHAPES(dbg.G.t).rings.find((r) => hyp([r.x, r.y], sp) < 0.1 && r.c === '#f3c969'); if (!ob || !R || Math.abs(ob.r - R.r) > 0.01) bad('your arrow to your Purge spot stops at ' + (ob ? ob.r : 'none') + ' yards, its gold ring is drawn at ' + (R ? R.r : 'none') + ' (check PA3)'); }
  } catch (e) { bad('the arrow radius check crashed: ' + e.message + ' (check PA3)'); } finally { reset(); }
  //     PA4 (fix 4, the arrow and the step show up too late): your soak and your red circle are named as her cast starts, 5.5 s before the circles land, with the
  //     arrow, the gold ring and a call (the audit: 1.2 s before, and the autopilot arrived 1.4 s late); your kick's walk 5 s before its cast.
  try { for (const [pk, seed, what] of [[{ role: 'r', soak: 1, bite: 'no', kick: 0, v: 2 }, 3, 'soak'], [{ role: 'm', soak: 0, bite: 'yes', kick: 0, v: 2 }, 3, 'red circle']]) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.start, me, { seed }); const b = dbg.S.bites.find((q) => q.so.includes(me) || q.tg.includes(me)); if (!b) { bad('no ' + what + ' to check (check PA4)'); continue; }
      dbg.at(b.b0 + 0.2, me, { seed }); let far = null; for (const d of [16, 20, 12]) for (let k = 0; k < 8 && !far; k++) { const p = [b.stack[0] + Math.cos(k * Math.PI / 4) * d, b.stack[1] + Math.sin(k * Math.PI / 4) * d]; if (dbg.P2.onPlat(p[0], p[1]) && dbg.P2.alive(dbg.G.t)[ctx.pgP3Q(p[0], p[1])]) far = p; }
      dbg.pos = far || dbg.pos; dbg.G.p3.hp = null; const jt = dbg.P2.jobText(), h = dbg.hint(), L = SHAPES(dbg.G.t);
      /* (the 2nd bite comes in the Wretch's first bubble: "Get in the bubble: stand on your gold ring", its stack inside the bubble) */
      if (!/^Walk to (your|the) gold ring now|^Get in the bubble: stand on your gold ring/.test(jt)) bad('0.2 s into her Serpent\'s Bite cast, your ' + what + '\'s job line says "' + jt + '" (the audit: named 1.2 s before the landing, check PA4)');
      if (!h || hyp(h.T, b.stack) > 0.5) bad('0.2 s into her Serpent\'s Bite cast, no arrow to your ' + what + '\'s gold ring (check PA4)');
      if (!L.rings.some((r) => hyp([r.x, r.y], b.stack) < 0.1 && r.c === '#f3c969')) bad('0.2 s into her Serpent\'s Bite cast, your ' + what + '\'s gold ring isn\'t drawn (check PA4)');
      if (!dbg.S.warns.some((w) => Math.abs(w.t - b.b0) < 0.01 && w.mine && /walk to (your|the) gold ring/.test(w.text))) bad('no call for your ' + what + ' as her cast starts (check PA4)'); }
    /* (4.9 s before: her waves' cast starts 0.2 s later, so nothing to dodge yet) */
    const pk = { role: 'm', soak: 0, bite: 'no', kick: 1, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.echoes - 4.9, me, { seed: 3 }); const s = dbg.G.p3.sh.sh1;
    if (!s) bad('no Shrieker 1 for the kick walk (check PA4)'); else { let p = null; for (let k = 0; k < 12 && !p; k++) { const q = [s.x + Math.cos(k * Math.PI / 6) * 16, s.y + Math.sin(k * Math.PI / 6) * 16]; if (dbg.P2.onPlat(q[0], q[1]) && dbg.P2.alive(dbg.G.t)[ctx.pgP3Q(q[0], q[1])]) p = q; }
      dbg.pos = p; dbg.G.p3.hp = null; const jt = dbg.P2.jobText(), h = dbg.hint(); if (!/^Walk to your Shrieker/.test(jt)) bad('4 s before your kick, 16 yards from your Shrieker, the job line says "' + jt + '" (check PA4)');
      if (!h || hyp(h.T, [s.x, s.y]) > P.KICK.m) bad('4 s before your kick, out of reach, no arrow into your reach of your Shrieker (check PA4)'); }
  } catch (e) { bad('the early step check crashed: ' + e.message + ' (check PA4)'); } finally { reset(); }
  //     PA5, PA9 and the rule (fixes 5 and 9, and Flex: "i feel like the game confuses people saying timestamps"): played through on four jobs, every job line is one
  //     order of 12 words or fewer, never "Next: X in N s" or another raider's timer, and no job line, NEXT line, call or floor label has a clock time or a count of
  //     seconds; the setup and start-card sentences, the Play button's line and the floats neither. Every call reads "Mechanic: order" with a verb first, and is
  //     marked yours (gold) exactly when it says you or your.
  try { const BAD = /\b\d{1,2}:\d{2}\b|\b\d+(?:\.\d+)?\s?s\b|\bseconds?\b|\b\d+\.\d+\b|\d\s?%/, VERB = /^(stack|go|hit|walk|stand|step|get|move|wait|kick|burn|keep|take|kill)\b/i, seen = new Map(), add = (kind, x) => { if (x && !seen.has(kind + '|' + x)) seen.set(kind + '|' + x, [kind, x]); };
    for (const [pk, seed] of [[{ role: 'm', soak: 2, kick: 1, bite: 'yes', v: 2 }, 3], [{ role: 'r', soak: 1, kick: 2, bite: 'yes', v: 2 }, seedFor(ctx, 1)], [{ role: 'h', soak: 3, kick: 0, bite: 'no', v: 2 }, 8], [{ role: 'm', soak: 0, kick: 0, bite: 'no', v: 2 }, seedFor(ctx, 0)]]) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.start, me, { seed }); const G = dbg.G, S = dbg.S; let k = 0;
      /* (the NEXT line by the name practice.js reads, nextText: under nextLine only it never showed (the review, Nov 16, check RV-A)) */
      while (G.t < S.end - 0.01) { dbg.step(1); G.hp = 100; if (k++ % 5) continue; const j = dbg.P2.jobText(); add('job line', j); add('NEXT line', typeof dbg.P2.nextText === 'function' ? dbg.P2.nextText() : ''); if (pk.role === 'h' && /\bkick\b|Vicious Echoes/i.test(j)) add('a healer\'s job line about a kick', j); SHAPES(G.t).labels.forEach((l) => add('floor label', l.text)); }
      /* (yours by its mark: one that says you or your is marked yours, and one marked yours says so, but for "Gateway open: go through now!", your own step in the
         audit's words (the review, Nov 16: "go through your gateway now" said it twice)) */
      S.warns.forEach((w) => { add('call', w.text); if (!/^[A-Z][^:!?]{2,39}: /.test(w.text) || !VERB.test(w.text.replace(/^[^:]*:\s*/, ''))) add('a call that isn\'t "Mechanic: order"', w.text); const says = /\b(you|your)\b/i.test(w.text); if (says ? !w.mine : (!!w.mine && !/^Gateway open: /.test(w.text))) add('a call marked ' + (w.mine ? 'yours with no you/your' : 'not yours that says you/your'), w.text); }); }
    const su = dbg.P2.setup; su.roles.forEach((r) => su.jobs(r).forEach(([v, label]) => { su.set(r, v); add('setup sentence', su.say()); add('setup button', label); add('job under your name', dbg.P2.role().job); add('start card', dbg.P2.short().replace(/<[^>]+>/g, ' ')); add('start card', dbg.P2.asg().replace(/<[^>]+>/g, ' ')); add('start card', dbg.P2.card().replace(/<[^>]+>/g, ' ')); }));
    const M = su.maps; ['m', 'r', 'h'].forEach((r) => { M.role(r); M.tabs().forEach(([k, lab]) => { add('setup tab', lab); M.hot(k).forEach((o) => { add('setup button', o.lab + ' ' + o.note); add('setup button', o.title); M.pick(k, o.id); add('setup sentence', M.say()); add('Play button line', M.sub()); }); }); M.extras().forEach(([, lab]) => add('setup button', lab)); });
    const errs = [], note = (m) => { if (errs.length < 14) errs.push(m); else if (errs.length === 14) errs.push('(and more)'); };
    seen.forEach(([kind, x]) => { if (/^(job line|NEXT line|call|floor label|setup sentence|setup button|setup tab|job under your name|start card|Play button line)$/.test(kind)) { if (BAD.test(x)) note('a ' + kind + ' says a clock time or a count of seconds: "' + x + '" (Flex, Nov 16: "i feel like the game confuses people saying timestamps", check PA5)'); if (kind === 'job line' && (/\bNext:/.test(x) || x.split(/\s+/).length > 12)) note('a job line isn\'t one short order: "' + x + '" (the prompts audit, Nov 16, check PA5)'); }
      else note(kind + ': "' + x + '" (the prompts audit, Nov 16, check PA9)'); });
    errs.forEach((m) => bad(m));
    // (the floats and the words over the floor in the source: no clock or count goes into A.say, h.label, warn or a job line; the end card's mistakes may name the time)
    const SRC3 = rd('practice-p3.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/[^\n]*/g, '$1'), args = (fn) => { const out = []; let i = 0; while ((i = SRC3.indexOf(fn, i)) >= 0) { let d = 0, j = i + fn.indexOf('('); for (; j < SRC3.length; j++) { if (SRC3[j] === '(') d++; else if (SRC3[j] === ')' && --d === 0) break; } out.push(SRC3.slice(i, j + 1)); i = j; } return out; };
    ['A.say(', 'h.label(', ' warn(', 'say(\''].forEach((fn) => args(fn).forEach((a) => { if (/clk\(|Math\.ceil|toFixed|\d:\d\d|' s\b|\d s\b/.test(a)) bad('src/practice-p3.js puts a clock time or a count on screen: ' + a.slice(0, 140) + ' (Flex, Nov 16, check PA5)'); }));
  } catch (e) { bad('the words check crashed: ' + e.message + ' (check PA5)'); } finally { reset(); }
  //     PA6, PA7 and PA8 (fixes 6, 7 and 8): the gateway's bar ends where the game checks you're on her quarter, and it and the gateway's label go once you're through
  //     (the audit: "Gateway closes" at 6:40, "You weren't on her quarter" at 6:24, both still up after you'd gone through); each Fester Burst call fires with its job
  //     line, 2.5 s before its cast (the second gave 2 s); your Shrieker has a gold ring and "Your Shrieker" over it (both plates read "Blightscale Shrieker" from
  //     8:31), the other doesn't; one bar each for your soak and your kick, by their own names.
  try { const pk = { role: 'r', soak: 0, bite: 'no', kick: 2, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), seed = seedFor(ctx, 1); dbg.at(T.start + 0.05, me, { seed }); const S = dbg.S;
    if (S.timers.some((q) => /Gateway closes/.test(q.name)) || !S.timers.some((q) => q.name === 'Be on her quarter' && Math.abs(q.t - (T.clu[0] + 2)) < 0.01)) bad('the gateway\'s bar isn\'t "Be on her quarter" at ' + clkS(T.clu[0] + 2) + ', where the game checks it (check PA6)');
    while (dbg.G.t < T.clu[0] && !dbg.G.p3.used[me + 'g1']) dbg.step(1); if (!dbg.G.p3.used[me + 'g1']) bad('the autopilot never took the gateway (check PA6)');
    else { dbg.step(4); if ((dbg.mods() || []).some((b) => /Be on her quarter|Gateway/.test(b.name))) bad('the gateway\'s bar is still up after you went through (check PA6)'); if (SHAPES(dbg.G.t).labels.some((l) => /^Gateway/.test(l.text))) bad('the gateway\'s floor label is still up after you went through (check PA6)'); }
    dbg.at(T.start + 0.05, me, { seed }); { const g1 = dbg.S.gates.find((g) => g.k === 1), p8 = g1 && offGate(g1, 8); dbg.walkTo(null); while (dbg.G.t < T.clu[0] - 3.5) { if (p8) dbg.pos = p8; dbg.stepOwn(1); } }
    const jh = dbg.P2.jobText(); if (!/^Hurry/.test(jh)) bad('4 s before the clutches land, not yet through the gateway, the job line says "' + jh + '" (check PA6)');
    S.wretch.fb.forEach((q) => { if (!dbg.S.warns.some((w) => Math.abs(w.t - (q.t0 - 2.5)) < 0.01 && /^Fester Burst: get in the bubble/.test(w.text))) bad('the Fester Burst cast at ' + clkS(q.t0) + ' isn\'t called 2.5 s before, with its job line (check PA7)'); });
    dbg.at(T.shriek + 3, me, { seed: 3 }); const L = SHAPES(dbg.G.t), s2 = dbg.G.p3.sh.sh2, s1 = dbg.G.p3.sh.sh1;
    if (!s2 || !L.rings.some((r) => hyp([r.x, r.y], [s2.x, s2.y]) < 0.1 && r.c === '#f3c969')) bad('your Shrieker has no gold ring under it (the audit, 8:31 to 8:47: nothing said which one was yours, check PA8)');
    if (s1 && L.rings.some((r) => hyp([r.x, r.y], [s1.x, s1.y]) < 0.1 && r.c === '#f3c969')) bad('the other Shrieker has a gold ring too (check PA8)');
    if (!s2 || !L.labels.some((l) => l.text === 'Your Shrieker' && hyp([l.x, l.y], [s2.x, s2.y]) < 0.1)) bad('no "Your Shrieker" over yours (check PA8)');
    const pkS = { role: 'r', soak: 1, bite: 'no', kick: 2, v: 2 }; dbg.P2.pick = pkS; const meS = dbg.P2.slotOf(pkS); dbg.at(T.bite[0] - 4, meS, { seed: 3 }); const names = (dbg.mods() || []).map((b) => b.name);
    if (!names.includes('Your soak') || names.includes('Serpent\'s Bite')) bad('your soak\'s bars read "' + names.join(', ') + '": one bar, "Your soak" (the audit: "Your soak: bite 1" next to "Serpent\'s Bite", check PA8)');
    dbg.at(T.echoes - 8, meS, { seed: 3 }); const nk = (dbg.mods() || []).map((b) => b.name); if (!nk.includes('Your kick') || nk.includes('Vicious Echoes')) bad('your kick\'s bars read "' + nk.join(', ') + '": one bar, "Your kick" (check PA8)');
  } catch (e) { bad('the gateway, bubble and Shrieker check crashed: ' + e.message + ' (check PA6-8)'); } finally { reset(); }
  //     PA10 (fix 10, no "now" for two-step moves and Q): Q's moment is said and the Q button lights: in your soak as the circles drop under 15% (the job line said
  //     "Press Q just before they drain" for 13 s), and in the last second of Circling Prey 2 off her quarter with Q back.
  try { const pk = { role: 'r', soak: 1, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.bite[0] + 4, me, { seed: 3 }); const G = dbg.G, b = dbg.S.bites[0]; let said = '';
    while (G.t < b.end && !(G.p3.bite[0] && G.p3.bite[0].done)) { dbg.pos = b.stack.slice(); dbg.stepOwn(1); G.hp = 100; const st = G.p3.bite[0], v = st ? Math.max(...b.tg.map((id) => st.v[id] || 0)) : 100; if (v < 12 && v > 0) { said = dbg.P2.jobText(); break; } }
    if (!/^Press Q now/.test(said)) bad('in your soak with the circles under 15%, the job line says "' + said + '", not "Press Q now" (check PA10)');
    const pk2 = { role: 'r', soak: 0, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk2; const me2 = dbg.P2.slotOf(pk2); dbg.at(T.prey[1] + 2, me2, { seed: 3 }); const sp = dbg.S.F2([14, 14], 2);
    while (dbg.G.t < dbg.S.hit[1] - 0.8) { dbg.pos = sp; dbg.stepOwn(1); dbg.G.hp = 100; } const jq = dbg.P2.jobText(); if (!/^Press Q now/.test(jq)) bad('0.8 s before the 2nd Circling Prey lands, off her quarter with Q back, the job line says "' + jq + '" (check PA10)');
    const P3S = rd('practice-p3.js'); if (!/const qb = A\.\$\('\.pg-act\[data-a="def"\]'\)[^\n]*qNow\(t\)[^\n]*boxShadow/.test(P3S)) bad('the Q button no longer lights up at Q\'s "now" (hud, check PA10)');
  } catch (e) { bad('the Q check crashed: ' + e.message + ' (check PA10)'); } finally { reset(); }
  // RV. the review of the prompts audit's fixes (Nov 16: a skeptic played them with players who do as the screen says, on the game branch). Each fails on the commit
  //     before (bc75ad8c) and names the run it came from. SP: a spot on the standing stone.
  const SP = (p) => !!p && dbg.P2.onPlat(p[0], p[1]) && dbg.P2.alive(dbg.G.t)[ctx.pgP3Q(p[0], p[1])] === 1, fresh = () => { dbg.G.p3.hp = null; dbg.G.p3.jl = null; dbg.G.p3.dg = null; dbg.G.p3.wb = null; };
  //     RV-A (on the game branch): practice.js reads the NEXT line as P2.nextText, and phase 3 gave only nextLine, so it never showed; the 3D view puts a monster's name
  //     on its health bar and drops the labels round it, so "Your Shrieker" never showed; practice.js finds your calls by their me mark, and phase 3 set only mine.
  try { const pk = { role: 'r', soak: 1, bite: 'no', kick: 2, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.bite[0] - 6, me, { seed: 3 }); dbg.P2.jobText(); const nl = dbg.P2.nextLine(), shown = dbg.next();
    if (!nl) bad('no NEXT line 6 s before your soak to check (check RV-A)'); else if (shown !== nl) bad('the NEXT line on screen is "' + shown + '"; phase 3 says "' + nl + '" (practice.js reads P2.nextText: the review, Nov 16, check RV-A)');
    dbg.at(T.echoes - 6, me, { seed: 3 }); const G = dbg.G, s1 = G.p3.sh.sh1, s2 = G.p3.sh.sh2, L3 = ctx.pg3dShapes(dbg.v3a, G.t), named = (s) => L3.filter((q) => (q.k === 'plate' || q.k === 'label') && (q.name || q.text) === 'Your Shrieker' && Math.hypot(q.x - s.x, q.y - s.y) < 1);
    if (!s2 || hyp([s2.x, s2.y], [G.x, G.y]) > 45) bad('your Shrieker isn\'t within 45 yards 6 s before your kick, so its health bar isn\'t drawn and this tests nothing (check RV-A)');
    else { if (!named(s2).length) bad('the 3D view says nothing is your Shrieker: "Your Shrieker" over it is dropped for its health bar, which reads "' + ((L3.find((q) => q.k === 'plate' && q.mob && Math.hypot(q.x - s2.x, q.y - s2.y) < 1) || {}).name || 'nothing') + '" (the review, Nov 16, check RV-A)'); if (s1 && named(s1).length) bad('the 3D view calls the other Shrieker yours too (check RV-A)'); }
    dbg.at(560, me, { seed: 3 }); const odd = dbg.S.warns.filter((w) => typeof w.me !== 'boolean' || w.me !== !!w.mine || dbg.myCall(w) !== (w.me ? 1 : 0));
    if (odd.length) bad(odd.length + ' calls aren\'t marked me: true or false to match mine (practice.js finds your calls by me: the review, Nov 16), e.g. "' + odd[0].text + '" (check RV-A)');
  } catch (e) { bad('the game branch\'s hooks check crashed: ' + e.message + ' (check RV-A)'); } finally { reset(); }
  //     RV1: a soaker is counted inside both 7-yard red circles, not just on the 2.5-yard gold ring. Standing 4 yards from the gold ring (3.0 and 4.7 from the two
  //     targets), counted, the review's soaker was told "Walk into the red circles (gold ring)" with the arrow up the whole soak, never "Press Q now", and took the
  //     end without a defensive (ranged Group Soak 1, seed 3, 6:55). Here they stand there, press Q when told, and are told to stay.
  try { const pk = { role: 'r', soak: 1, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.bite[0] + 6, me, { seed: 3 }); const G = dbg.G, S = dbg.S, b = S.bites[0], tg = b.tg.map((id) => [G.bots[id].x, G.bots[id].y]);
    let p = null; for (let k = 0; k < 16 && !p; k++) { const q = [b.stack[0] + Math.cos(k * Math.PI / 8) * 4, b.stack[1] + Math.sin(k * Math.PI / 8) * 4]; if (SP(q) && tg.every((c) => hyp(c, q) < 6.2)) p = q; }
    if (!p) bad('no spot 4 yards from the 1st bite\'s gold ring inside both red circles (check RV1)');
    else { const said = new Set(), n0 = dbg.log.length; let arrows = 0, pressed = false;
      while (G.t < b.end && !(G.p3.bite[0] && G.p3.bite[0].done)) { dbg.pos = p; dbg.stepOwn(1); G.hp = 100; if (G.p3.bite[0] && G.p3.bite[0].done) break; const jt = dbg.P2.jobText(), h = dbg.hint(); said.add(jt); if (h && !h.wait) arrows++; if (/^Press Q now/.test(jt) && G.t - G.def >= 90) { G.def = G.t; G.debs.def = { until: G.t + 8, n: 1 }; pressed = true; } }
      const st = G.p3.bite[0], ss = [...said].join(' / ');
      if (!st || !st.by.has(me)) bad('standing 4 yards off the gold ring inside both red circles isn\'t counted as a soak, so this tests nothing (check RV1)');
      else { if ([...said].some((x) => /^Walk into the red circles|^Walk to your gold ring/.test(x)) || arrows) bad('a soaker inside both red circles, 4 yards off the gold ring, is told "' + ss + '"' + (arrows ? ' with the arrow up ' + (arrows * 0.05).toFixed(1) + ' s' : '') + ' (the review, Nov 16, ranged Group Soak 1, seed 3, check RV1)');
        if (!pressed) bad('a soaker inside both red circles, off the gold ring, is never told "Press Q now": ' + ss + ' (check RV1)');
        if (dbg.log.slice(n0).some((x) => /without a defensive/.test(x))) bad('a soaker off the gold ring who presses Q when told still takes the end without a defensive (6:55, check RV1)'); } }
  } catch (e) { bad('the off-centre soak check crashed: ' + e.message + ' (check RV1)'); } finally { reset(); }
  //     RV2 and RV3, played by players who do as they're told (walk where the arrow points, not while the floor says Wait; step aside when the line says dodge; else
  //     stand): RV2 no "Hold still", "Stay" or "Wait" line while the arrow points ("Hold still: your Purge waves go out now" with the arrow 3 to 7 yards, melee Group
  //     Soak 2 seeds 3 and 9 at 8:03, healer Group Soak 3 seed 2 at 9:46.6; "your Purge is bursting" with the Circling Prey arrow 17 to 23 yards); RV3 no job line flips
  //     back within a second, and for the review's melee on Group Soak 2 (seed 3) no three lines and no arrow blinking off and on within a second (12 flips in a
  //     second at 8:00, "Wait here" and "Move one quarter left now" taking turns at 7:12 for ranged seed 11 and melee seed 5). The floor's "Wait" is phase 1's line.
  const DODGE = /^(Her waves|Small tails|Soakers' waves|Brown circle|Mother's Wrath|Step into a gap|Red circles|Step out of the venom)/;
  const obey = (pk, seed) => { dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.start, me, { seed }); const G = dbg.G, S = dbg.S, chg = [], tog = [], dis = []; let last = null, on = false;
    while (G.t < S.end - 0.01) { const h = dbg.hint(), jt = dbg.P2.jobText(), ar = !!h && !h.wait; if (ar !== on) { tog.push(G.t); on = ar; } if (jt !== last) { chg.push([G.t, jt]); last = jt; }
      if (ar && /^(Hold still|Stay|Wait)/.test(jt)) dis.push(clkS(G.t) + ': "' + jt + '" with the arrow ' + h.d.toFixed(1) + ' yards');
      if (ar) { dbg.walkTo(h.T); dbg.stepOwn(1); } else if (DODGE.test(jt)) dbg.step(1); else { dbg.walkTo(null); dbg.stepOwn(1); } G.hp = 100; }
    return { chg, tog, dis }; };
  try { const errs = [], note = (m) => { if (errs.length < 10 && !errs.includes(m)) errs.push(m); };
    for (const [pk, seed] of [[{ role: 'm', soak: 2, kick: 1, bite: 'yes', v: 2 }, 3], [{ role: 'm', soak: 2, kick: 1, bite: 'yes', v: 2 }, 9], [{ role: 'h', soak: 3, kick: 0, bite: 'no', v: 2 }, 2], [{ role: 'r', soak: 1, kick: 2, bite: 'yes', v: 2 }, 11], [{ role: 'm', soak: 0, kick: 0, bite: 'no', v: 2 }, 5]]) {
      const R = obey(pk, seed), tag = pk.role + (pk.soak ? ' on Group Soak ' + pk.soak : ' with no soak') + ' (seed ' + seed + ')', named = pk.role === 'm' && pk.soak === 2 && seed === 3;
      R.dis.slice(0, 2).forEach((x) => note(tag + ' at ' + x + ' (check RV2)'));
      R.chg.forEach(([t, x]) => { if (/^Hold still\b.*\bnow\b|is bursting/.test(x)) note(tag + ' at ' + clkS(t) + ': "' + x + '" (its waves leave after the burst: "soon", check RV2)'); if (/^Wait here/.test(x)) note(tag + ' at ' + clkS(t) + ': "' + x + '": the floor\'s "Wait" is where you\'re going, so phase 1\'s "Wait: let it pass, then go." (check RV3)'); });
      for (let i = 2; i < R.chg.length; i++) if (R.chg[i][0] - R.chg[i - 2][0] < 1) { const tri = '"' + R.chg[i - 2][1] + '", "' + R.chg[i - 1][1] + '", "' + R.chg[i][1] + '"';
        if (R.chg[i][1] === R.chg[i - 2][1]) note(tag + ': the job line flips back within a second at ' + clkS(R.chg[i - 2][0]) + ': ' + tri + ' (the review, Nov 16, check RV3)'); else if (named) note(tag + ': three job lines within a second at ' + clkS(R.chg[i - 2][0]) + ': ' + tri + ' (the review: 12 flips in a second at 8:00, check RV3)'); }
      if (named) for (let i = 2; i < R.tog.length; i++) if (R.tog[i] - R.tog[i - 2] < 1) { note(tag + ': the arrow blinks off and on within a second at ' + clkS(R.tog[i - 2]) + ' (the review: 11 blinks at 8:00, check RV3)'); break; } }
    errs.forEach((m) => bad('a player doing as told: ' + m));
  } catch (e) { bad('the do-as-told check crashed: ' + e.message + ' (check RV2-3)'); } finally { reset(); }
  //     RV4: at Circling Prey the arrow went as soon as you stepped off her quarter, still on the crack's crossing, 17 to 19 yards from the raid, with "Off her
  //     quarter: good. Stack with the raid here."; the crossing turns to venom as her quarter sinks, so a player who moves only when the arrow shows was in the venom
  //     (melee Group Soak 2 seed 3 at 7:20.9, ranged Group Soak 1 seed 3 at 9:12.9), and nothing said to get out. Now the arrow and "Keep going" stay until you're with
  //     the raid, and the venom has a line and an arrow to the stone.
  try { const errs = []; let kept = 0;
    for (const [pk, seed, pi] of [[{ role: 'm', soak: 2, kick: 1, bite: 'yes', v: 2 }, 3, 0], [{ role: 'r', soak: 1, kick: 2, bite: 'yes', v: 2 }, 3, 2], [{ role: 'h', soak: 0, kick: 0, bite: 'no', v: 2 }, 5, 1]]) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), tag = pk.role + ' (seed ' + seed + '), Circling Prey ' + (pi + 1); dbg.at(T.prey[pi] - 0.05, me, { seed }); const G = dbg.G, S = dbg.S, n0 = dbg.log.length, c = S.F2(me[0] === 'm' ? P.mel : me[0] === 'h' ? P.heal : P.rng, pi + 1);
      if (ctx.pgP3Q(G.x, G.y) !== S.Qs[pi]) { errs.push(tag + ': you aren\'t on her quarter as the cast starts, so this tests nothing'); continue; }
      while (G.t < S.hit[pi] + 8) { const h = dbg.hint(), jt = dbg.P2.jobText(); if (/^Keep going: join the raid/.test(jt)) kept++;
        if (/^Off her quarter: good\. Stack with the raid here/.test(jt) && hyp([G.x, G.y], c) > 8 && errs.length < 6) errs.push(tag + ': "' + jt + '" ' + hyp([G.x, G.y], c).toFixed(1) + ' yards from the raid\'s stack at ' + clkS(G.t));
        if (h && !h.wait) dbg.walkTo(h.T); else dbg.walkTo(null); dbg.stepOwn(1); G.hp = 100; }
      const L = dbg.log.slice(n0).filter((x) => /venom off the platform|destroyed her quarter/.test(x)); if (L.length) errs.push(tag + ', moving only when the arrow shows: ' + L.join(' | '));
      if (hyp([G.x, G.y], c) > 8) errs.push(tag + ': ' + hyp([G.x, G.y], c).toFixed(1) + ' yards from the raid\'s stack once she\'s up again, moving only when the arrow shows'); }
    if (!kept && !errs.length) errs.push('"Keep going: join the raid on this quarter." never showed, off her quarter on the crossing');
    { const pk = { role: 'r', soak: 0, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; dbg.at(T.bite[0] - 4, dbg.P2.slotOf(pk), { seed: 3 }); const v = dbg.S.her(0); dbg.pos = v; fresh();
      if (dbg.P2.onPlat(v[0], v[1])) errs.push('her corner is on the stone, so the venom line tests nothing'); else { const jt = dbg.P2.jobText(), h = dbg.hint(); if (jt !== 'Step out of the venom onto the stone.' || !h || !SP(h.T)) errs.push('in the venom the job line says "' + jt + '"' + (h && SP(h.T) ? '' : ', with no arrow to the stone')); } }
    errs.forEach((m) => bad('the arrow at Circling Prey: ' + m + ' (the review, Nov 16, check RV4)'));
  } catch (e) { bad('the crossing check crashed: ' + e.message + ' (check RV4)'); } finally { reset(); }
  //     RV5 and RV6: a melee with no job 2 to 5 yards from a red circle at the 1st and 3rd bites was told "Stack with the raid and hit what's up" (into a soak that
  //     isn't theirs, and a Purge); at the 2nd "Mother's Wrath: step out of her reach (the red circle)" read as the bite's circle. A red circle's target already on the
  //     gold ring before it lands was told "Walk to the gold ring now" with no arrow (melee seed 3 at 9:26, ranged seeds 11 and 6 at 7:45).
  try { const errs = [], pk = { role: 'm', soak: 0, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk);
    for (const bi of [0, 2]) { dbg.at(T.bite[bi] + 6, me, { seed: 3 }); const b = dbg.S.bites[bi], tp = b.tg.map((id) => [dbg.G.bots[id].x, dbg.G.bots[id].y]); let q = null;
      for (const r of [3, 4, 5, 2.5]) for (let k = 0; k < 16 && !q; k++) { const p = [tp[0][0] + Math.cos(k * Math.PI / 8) * r, tp[0][1] + Math.sin(k * Math.PI / 8) * r]; if (SP(p) && !dbg.S.wrath.some((w) => hyp(p, w.p) < 7.5)) q = p; }
      if (!q) { errs.push('no spot by the ' + (bi + 1) + (bi ? 'rd' : 'st') + ' bite\'s red circle'); continue; } dbg.pos = q; fresh(); const jt = dbg.P2.jobText(); if (jt !== 'Step out of the red circles: soakers only!') errs.push('with no job, ' + hyp(q, tp[0]).toFixed(1) + ' yards from a red circle at the ' + (bi + 1) + (bi ? 'rd' : 'st') + ' bite, the job line says "' + jt + '"'); }
    { dbg.at(T.wrath[1] + 1, me, { seed: 3 }); const wr = dbg.S.wrath[1], b = dbg.S.bites[1], tp = b.tg.map((id) => [dbg.G.bots[id].x, dbg.G.bots[id].y]); let q = null;
      for (const r of [2, 3, 4, 5]) for (let k = 0; k < 16 && !q; k++) { const p = [wr.p[0] + Math.cos(k * Math.PI / 8) * r, wr.p[1] + Math.sin(k * Math.PI / 8) * r]; if (SP(p) && tp.every((c) => hyp(p, c) > P.BITE + 1.5)) q = p; }
      if (!q) errs.push('no spot in her reach clear of the 2nd bite\'s red circles'); else { dbg.pos = q; fresh(); const jt = dbg.P2.jobText(); if (jt !== 'Mother\'s Wrath: step out of the red circle in front of her.') errs.push('in her reach at Mother\'s Wrath, clear of the red circles, the job line says "' + jt + '"'); } }
    /* (the review's melee on Group Soak 2 with a red circle, seed 3: it's the 3rd bite's, at 9:25, out of any bubble) */
    { const pk2 = { role: 'm', soak: 2, bite: 'yes', kick: 1, v: 2 }; dbg.P2.pick = pk2; const me2 = dbg.P2.slotOf(pk2); dbg.at(T.start, me2, { seed: 3 }); const b = dbg.S.bites.find((q) => q.tg.includes(me2));
      if (!b) errs.push('no red circle for the melee who picked one'); else { dbg.at(b.b0 + 1, me2, { seed: 3 }); dbg.pos = b.stack.slice(); fresh(); const jt = dbg.P2.jobText(), h = dbg.hint(); if (jt !== 'Stay on the gold ring: your red circle lands soon.' || (h && !h.wait)) errs.push('on the gold ring before your red circle lands, the job line says "' + jt + '"' + (h && !h.wait ? ' with an arrow' : '')); } }
    errs.forEach((m) => bad('red circles: ' + m + ' (the review, Nov 16, check RV5-6)'));
  } catch (e) { bad('the red circles check crashed: ' + e.message + ' (check RV5-6)'); } finally { reset(); }
  //     RV7: her waves were called 2.2 s before they left her, after a job line that warned 4.5 s ahead, and "out of the red" came before any red was drawn (melee seed 3:
  //     the line at 9:32.3, the call at 9:33.4). Now the call and the red lanes come 1 s into her cast, and the job line never sooner.
  try { const S3 = script({ seed: 3 }); T.waves.forEach((w0) => { if (!S3.warns.some((w) => Math.abs(w.t - (w0 + 1)) < 0.01 && /^Her waves: /.test(w.text))) bad('her waves cast at ' + clkS(w0) + ' aren\'t called 1 s into her cast (the review, Nov 16, check RV7)');
      const wv = S3.waves.find((q) => q.kind === 'her3' && Math.abs(q.t0 - (w0 + T.wavesCast)) < 0.01); if (!wv || Math.abs(wv.t0 - wv.warn - (w0 + 1)) > 0.01) bad('her waves cast at ' + clkS(w0) + ' show their red lanes from ' + (wv ? clkS(wv.t0 - (wv.warn || 0)) : 'never') + ', not 1 s into her cast, with their call (check RV7)'); });
    const pk = { role: 'm', soak: 0, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), w0 = T.waves[1]; dbg.at(w0 + 1.1, me, { seed: 3 }); const wv = dbg.S.waves.find((q) => q.kind === 'her3' && Math.abs(q.t0 - (w0 + T.wavesCast)) < 0.01), a = wv.deg * Math.PI / 180, u = [Math.cos(a), Math.sin(a)], v = [-Math.sin(a), Math.cos(a)]; let spot = null;
    /* (her corner is in the venom: the stone starts about 11 yards along her wall's way; a spot there is reached about 0.35 s after the wall leaves her) */
    for (const s of [11, 11.5, 12, 12.5, 13]) for (const z of [-16.5, -5.5, 16.5, 5.5, -27.5, 27.5]) { if (spot) break; const p = [wv.x + u[0] * s + v[0] * z, wv.y + u[1] * s + v[1] * z]; if (!ctx.pgP3Floor(p[0], p[1], dbg.P2.alive(dbg.G.t), 1)) continue; dbg.pos = p; fresh(); if (/^Her waves/.test(dbg.P2.jobText())) spot = p; }
    if (!spot) bad('no spot her 2nd waves reach just after they leave her, named 1.1 s into her cast (check RV7)');
    else { dbg.at(w0 + 0.6, me, { seed: 3 }); dbg.pos = spot; fresh(); const jt = dbg.P2.jobText(); if (/Her waves/.test(jt)) bad('0.6 s into her cast, before its call and its red lanes, the job line already says "' + jt + '" (the review, Nov 16, check RV7)'); }
  } catch (e) { bad('her waves\' timing check crashed: ' + e.message + ' (check RV7)'); } finally { reset(); }
  //     RV8: the standing line "Stack with the raid and hit what's up" was held 2.5 s against the heart: it opened at 9:43.6 and "Burn the heart" showed at 9:45.1
  //     (melee seed 3). And NEXT said "Then: burn the heart." under "Wait outside the red circles, then burn the heart."
  try { const pk = { role: 'm', soak: 0, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.heart - 5, me, { seed: 3 }); let jt = '', waitSeen = false, twice = null;
    while (dbg.G.t < T.heart + 0.3) { dbg.step(1); dbg.G.hp = 100; jt = dbg.P2.jobText(); const nt = [dbg.next(), dbg.P2.nextLine()].find((x) => /burn the heart/i.test(x)); if (/^Wait outside the red circles/.test(jt)) waitSeen = true; if (/burn the heart/i.test(jt) && nt && !twice) twice = 'NEXT says "' + nt + '" under "' + jt + '"'; }
    if (twice) bad(twice + ' (the review, Nov 16, check RV8)');
    if (!waitSeen) bad('"Wait outside the red circles, then burn the heart." never showed, so the NEXT check tests nothing (check RV8)');
    if (!/heart/i.test(jt)) bad('0.3 s after the heart opens the job line still says "' + jt + '" (the review, Nov 16: held until 9:45.1, check RV8)');
  } catch (e) { bad('the heart line check crashed: ' + e.message + ' (check RV8)'); } finally { reset(); }
  //     RV9, the review's wording list and the clock times it agreed to drop: "Gateway open: go through now!"; the clutches' last set is two; "at each Fester Burst";
  //     with hints off (storage blocked, as here) your soak's "Soak here" stays on the floor, no arrow drawn; the Start list without clock times ("8:23 · The Shriekers").
  try { const S3 = script({ seed: 3 }); if (!S3.warns.some((w) => w.text === 'Gateway open: go through now!')) bad('the second gateway\'s call isn\'t "Gateway open: go through now!" (the review, Nov 16, check RV9)');
    const A0 = dbg.P2.asg().replace(/<[^>]+>/g, ' '); if (/Three times, one lands on each quarter/.test(A0) || !/two come with the Shriekers/i.test(A0)) bad('the start card still says the clutches land three times, one on each quarter; the last set is two, with the Shriekers (check RV9)');
    if (!/at each Fester Burst/.test(dbg.P2.short())) bad('the start card\'s short list doesn\'t say when to get in the Wretch\'s bubble: "at each Fester Burst" (check RV9)');
    const bs = (dbg.P2.starts || []).filter(([, n]) => /\d:\d\d/.test(n)); if (bs.length) bad('the Start list still shows clock times: ' + bs.map((x) => '"' + x[1] + '"').join(', ') + ' (the review, Nov 16, agreed: the names are enough, check RV9)');
    const pk = { role: 'r', soak: 1, bite: 'no', kick: 0, v: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.bite[0] + 0.5, me, { seed: 3 }); const b = dbg.S.bites[0]; let far = null; for (let k = 0; k < 16 && !far; k++) { const q = [b.stack[0] + Math.cos(k * Math.PI / 8) * 15, b.stack[1] + Math.sin(k * Math.PI / 8) * 15]; if (SP(q)) far = q; }
    /* (the job line first, as the screen does every frame) */
    dbg.hints = false; try { dbg.pos = far; dbg.stepOwn(1); dbg.P2.jobText(); const L = SHAPES(dbg.G.t); if (dbg.hint()) bad('hints off, and the arrow still shows (check RV9)'); else if (!L.labels.some((l) => l.text === 'Soak here' && hyp([l.x, l.y], b.stack) < 0.1)) bad('with hints off and no arrow drawn, your soak\'s "Soak here" is gone from the floor (it read the browser\'s saved switch, not the game\'s: the review, Nov 16, check RV9)'); } finally { dbg.hints = true; }
  } catch (e) { bad('the wording check crashed: ' + e.message + ' (check RV9)'); } finally { reset(); }
  // H. phase 1 and phase 2, with this file loaded
  try { const L1 = load(H); if (L1.dbg.P2) bad('phase 1 opens with a later part switched on (check H)'); const r1 = L1.dbg.sim('r3', true, false, 3); if (!L1.dbg.S || L1.dbg.S.end !== 165 || !r1) bad('phase 1 no longer plays to 2:45 with phase 3 loaded (check H)'); }
  catch (e) { bad('phase 1 crashed with phase 3 loaded: ' + e.message + ' (check H)'); }
  try { const L2 = load(H, 'm2'); if (!L2.dbg.P2 || L2.dbg.P2.part !== 2 || (typeof L2.dbg.P2.dodges === 'function' ? L2.dbg.P2.dodges('r1', 200) : L2.dbg.P2.dodges)) bad('phase 2 opens as part ' + (L2.dbg.P2 && L2.dbg.P2.part) + ' or with the shared dodge on (check H)'); else { const r2 = L2.dbg.sim(L2.dbg.P2.slotOf(L2.dbg.P2.pick), true, false, 3); if (!r2 || L2.dbg.S.end !== 318) bad('phase 2 no longer plays to 5:18 with phase 3 loaded (check H)'); } }
  catch (e) { bad('phase 2 crashed with phase 3 loaded: ' + e.message + ' (check H)'); }
}

module.exports = checks; module.exports.load = load;
if (require.main === module) {
  let n = 0; const t0 = Date.now(); checks(null, (a, b, t) => { n++; console.log('✗ ' + t); });
  console.log(n ? n + ' problem(s)' : 'practice game, phase 3: all checks pass', '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
  if (process.argv.includes('--audit')) { const { dbg } = load(null, 'm3'); dbg.P2.pick = { role: 'r', soak: 0, bite: 'no', kick: 0 }; for (let seed = 1; seed <= 16; seed++) { const a = dbg.audit(false, seed); console.log('seed ' + seed + ' (her first quarter ' + dbg.S.q1 + '): ' + (a.length ? '\n  ' + a.join('\n  ') : 'clean')); } }
  process.exitCode = n ? 1 : 0;
}
