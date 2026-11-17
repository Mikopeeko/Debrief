// The Ula'tek practice game's intermission (src/practice-int.js, Nov 15; Flex: "i think we forgot to do the intermission with the coil soaks"),
// run in Node the same way tests/practice-p2.js runs phase 2: the real game code with a do-nothing page.
// Runs on every build (tests/contradictions.js); `node tests/practice-int.js` runs it alone (`--audit` prints the bots' audit for more runs).
// This fails if:
//   A. the clock isn't the measured Mythic one: her Call 5:19 (4 s), the eggs 5:24.1, the eight slams (17 top Mythic kills since the Nov 6 hotfix:
//      5:36.5, 5:38.5, 5:42.5, 5:44.5, 5:48.5, 5:50.4, 5:52.5, 5:54.5, each coil rising 4 s before), the Shattering 6:09.4; the notes' own clock line
//      (notes/Guides/Bosses/8 Ula'tek.md, "After phase 1, measured": intermission Call 5:19, eight Spectral Coils 5:37 ... 5:55) within 0.7 s;
//   B. the coils don't follow the guide's plan: the three slam orders and who soaks each (UL_PAT, the table the Plan reads), the soak spots (UL_SOAK,
//      within 3 yards of where the 17 kills' soakers stood), the coils at the rim (UL_RIM), the guide card's three teams (a tank, a healer and 5
//      melee; a tank, a healer and 4 ranged; the rest), each team's slams as the kills' Soul Constrictor split them (1-4-6 / 2-5-8 / 3-7 on Star and
//      Triangle, 1-4-7 / 2-5-8 / 3-6 on Cross), or an egg lands inside a soak circle (found while building it, Nov 15: a carrier's egg inside
//      another team's circle kept them from it until too late);
//   C. a bot slips: off the stone, under a landing egg, off its soak, in another team's slam, two carriers within 3 yards (found while building it:
//      a late carrier got its egg handed over from afar right beside another carrier; she east, seed 3: two eggs 8 yards apart trapped a tank,
//      who stepped out of one into the other), an egg not broken by the last slam, a slam with under 5
//      soakers, in the middle or on a crack or thrown into the venom at the Shattering;
//   D. your picked job isn't the one you play (your team, your egg), or a team loses or gains a raider or an egg in the swap. The autopilot plays
//      picked jobs clean on all three patterns;
//   E. the mistakes don't land: a missed soak, an egg never picked up or never broken, no defensive for the back-to-back slams, Soul Constrictor,
//      the middle, a crack or the edge at the Shattering; or a clean run doesn't score 100;
//   F. the part isn't between Phase 2 and Phase 3 on the start card's Part switch, `?practice=int` doesn't open it, build.ps1 doesn't check and read
//      src/practice-int.js, the shared hooks are gone (the score link, the boss-mod egg icon, no side ledges in 3D), or the one-screen setup
//      (your role, then your team) doesn't pick the job you play;
//   G. the 3D view doesn't draw the part where its hits are (the soak's 10 yards, the coil at the rim, the cracks' 3.5, her burst's 8, the
//      diamond line), or "Go here" still points after the Shattering (found while building it);
//   H. phase 1 or phase 2 change with this file loaded;
//   I. the damage moments: the Rawlings only once the coils are done (the raid kills them then: measured 5:55 to 6:12) and until her bubbles show,
//      any Viper at once; the autopilot hits them as ranged and as melee (found while building it: a melee never walked over to them), standing
//      still misses them;
//   J. the independent review (Nov 15): the egg hint and the egg mistake follow one rule (carriers sent to their soak, then told they never picked
//      their egg up); carriers never stuck on another egg's berth; melee never told to hold while the Rawlings still count; the defensive's cue
//      covers all four slams; she comes up at one quarter's outer corner (17 kills: never the middle); a carried egg in the venom hatches; the
//      boss-mod bars don't give the pattern away or the wrong icon; the hints after the Shattering, the clean-run text and "pick one" are true;
//   K. the raid markers aren't the game's floating shapes (Flex, Nov 15: "make the markers have the floating marker shape like in game"): all eight
//      at the rim in 3D, each its own shape and colour (a 10-point star, a 12-point cross, a 4-point diamond, a 3-point triangle, a skull with eye
//      sockets, a crescent moon), drawn here and never Blizzard's art, floating over the stone through the part's own 3D kit (kit3d);
//   L. Noxious Splash at 3 yards and the egg shells: carriers splash inside each other's 3-yard ring, the game's rule everywhere (the phase 3 chat's
//      re-scan of 170 Mythic pulls, Nov 15: carriers stood 4 to 6 yards apart for about 80 minutes without a splash; the 21 logged splashes were
//      measured after the burst landed, so a 4.3-yard edge was pushed at 7055f8ec and undone). The part sets no splash of its own and the words say
//      3 yards; and (Flex, Nov 15: "The eggs have to be damaged to break the shield") your egg's shell is up until you hit it, with a hint that says so;
//      and the calmer egg carriers are on (Flex, Nov 15: "Yes, turn them on": a bot holding an egg walks at your speed and steps round you), with the
//      egg plan timing the walk to the soak at 7 yards a second, so no carrier misses its soak (the bots' audit, check C);
//   M. the unit frames don't look like Flex's own UI (Nov 15: "the player/target/boss frames should look more like this", his screenshot): your frame
//      left of the hotbar and your target's right of it on one row (narrow screens: the frames side by side, the bar under them), one flat bar each with
//      the name inside on the left and "735K | 100%" on the right, your class (or role) colour, the target's target after a ">", the boss's name in its bar.
//   N. the spot maps (Flex, Nov 16: "visual maps that lets them select the spot ... use the plans maps so its something familiar", "make sure the maps are
//      placed properly it looks off", "clicking on your coil hides no egg", "maybe randomize their assignments"): with the Plan's maps loaded the setup
//      shows them, on the Plan's own Groups page (Intermission Positions); Your group offers exactly the teams your role is on in the guide's plan, each
//      ring where the game has that team wait (16 yards out by its marker), and You where the game stands you; Your egg offers exactly the teams whose plan
//      has your role carry an egg, each circle round where the game drops that team's eggs (200 runs); the Plan's labels stay off the spots; every role
//      carries an egg where its team has one, by default and after a role change, No egg turns it off and on; 🎲 Random gives a team your role is on
//      with its egg; the same buttons on both tabs; what you pick is what you play. (Before Nov 16 the intermission had no maps: a row of job buttons.)
//      The review (Nov 16): the eggs drawn on Your egg sit on real landings (they were on a made-up ring, one 3.6 yards from anywhere a Purple egg lands),
//      You sits on one of yours, your own egg lands in your circle, and the autopilot plays every pick the map offers clean.
//   O. the release sweep (Nov 16): your egg still on the floor after your last soak and the game sends you to pick it up, or charges it twice ("never went
//      into a soak" and "still in your hands", or its Viper on a crack); the 5:45 start loses the Rawlings from slams 1 to 4, or a melee is scored on
//      Rawlings it couldn't reach yet (from 5:45, and from a last soak across the room); a Rawling boiling is charged to you; with Q pressed early in the
//      part the line says "Press Q now", What's next shows "Defensive (Q)", or the mistake doesn't say Q was still cooling down.
//   P. the prompts audit (Nov 16; Flex: "the alerts and training wheels could be better in terms of the on screen prompts", then "All 10"), its ten fixes
//      as they touch this part: 1 the arrow walks you through another team's live coil or another carrier's ring (it bends round now); 2 a falling egg,
//      another team's coil, another carrier's ring, the cracks and the edge get words (and the red strips a "Crack" label); 3 the arrow goes away exactly
//      where the game counts you (your soak's 10 yards, the gold ring's 4) and never says "Go here" while the line says stay; 4 the arrow from the moment
//      the line names the place (your egg's gold circle from the start, your team's spot, a melee's Rawling), and a player who only follows the arrow and
//      the lines plays clean on nine jobs (every melee carrier was "on it 28%"); 5 Q after the move line, never "Next: X in N s"; 6 nothing false (the
//      ranged told to kill the Rawlings before the gold ring, "Egg shells are breaking" at 5:31, a "Your egg opens" bar while you break it, two bars for
//      one egg); 7 the Rawlings call with its job line; 8 the pattern call names YOUR first soak, one label a circle; 9 every centre call "Mechanic: Order",
//      gold only for your own job; 10 Q's "now" (the line and the glowing button). And Flex's rule (Nov 16: "i feel like the game confuses people saying
//      timestamps"): no clock time or second count in any job line, centre call, floor label, start card, setup sentence, Play line or Start list.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src'), rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n');
function stub() { const f = function () { return stub(); }; return new Proxy(f, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : k === Symbol.iterator ? function* () {} : stub()), set: () => true, apply: () => stub() }); }
function load(H, part, extra) {
  H = H || require('./site-helpers.js');
  const GJ = rd('guides.js'), fromGuides = ['GDZ_ROLE', 'GDZ_RAID', 'gdzName', 'UX', 'UX_MEL', 'UX_HOME', 'UX_ZONE', 'UL_EDGE', 'UL_FB', 'GDZ_FLOOR', 'UL_EGGS', 'UL_RIM', 'UL_SOAK', 'UL_CMK', 'UL_PAT'].map((n) => H.grab(n, GJ)).join('\n');
  const win = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
  class Img { constructor() { this.complete = false; this.naturalWidth = 0; } }
  const ctx = vm.createContext({ document: stub(), window: win, navigator: stub(), performance, Image: Img, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, localStorage: stub(), E: { CLASSES: {} }, console, MouseEvent: function () {} });
  vm.runInContext(H.grab('esc') + '\n' + fromGuides + '\n' + rd('practice.js') + '\n' + rd('practice3d.js') + '\n' + rd('practice-p2.js') + '\n' + (extra || '') + '\n' + rd('practice-int.js') +
    '\nthis.pgIntScript = pgIntScript; this.pgIntJobs = pgIntJobs; this.pgIntSlot = pgIntSlot; this.PG_INT = PG_INT; this.PG_INT_T = PG_INT_T; this.PG_PARTS = PG_PARTS; this.pg3dShapes = pg3dShapes; this.UL_PAT = UL_PAT; this.UL_SOAK = UL_SOAK; this.UL_RIM = UL_RIM; this.pgIntKb = pgIntKb; this.pg3dInt = pg3dInt; this.pgIntMarkDraw = pgIntMarkDraw; this.pgIntMk = pgIntMk;', ctx);
  if (part !== null) vm.runInContext('pgOpen(null, "Ula\'tek", "m"' + (part ? ', "' + part + '"' : '') + ')', ctx);
  return { dbg: win.__pgDbg, ctx };
}
const clkS = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') + (s % 1 ? '.' + Math.round((s % 1) * 10) : '');
const SERIOUS = /off the platform|under a landing egg|off their soak|soaked both|two carriers|another team's slam|on a crack|thrown into the venom|in a crack|egg not broken|only \d soakers/;
// (measured on the 17 top Mythic kills since the Nov 6 hotfix: the medians of the 16 on the clock; where each spot's soakers stood (their middle))
const MEAS = { call: 319.0, callL: 323.0, land: 324.1, slams: [336.49, 338.5, 342.46, 344.47, 348.48, 350.44, 352.49, 354.49], lead: 4.0, shatter: 369.45,
  soak: { SSW: [-8.6, -23.2], NNE: [8.9, 25.7], WNW: [-24.7, 10], ESE: [23.1, -10], NNW: [-9.4, 25.4], SSE: [11.7, -22.2], WSW: [-21, -9], ENE: [23.2, 11.9] },
  split: { 1: ['1-4-6', '2-5-8', '3-7'], 2: ['1-4-6', '2-5-8', '3-7'], 3: ['1-4-7', '2-5-8', '3-6'] } };

function checks(H, say) {
  const bad = (t) => say("Ula'tek practice game, intermission", 'intermission', t);
  let L; try { L = load(H, 'mint'); } catch (e) { bad('the game would not run the intermission in the test (' + e.message + ')'); return; }
  const { dbg, ctx } = L, T = ctx.PG_INT_T, P = ctx.PG_INT, script = ctx.pgIntScript, hyp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  if (!dbg || !dbg.P2 || dbg.P2.part !== 'int') { bad('opening the intermission part gives no intermission game (PG_PARTS["Ula\'tek"].mint with its mod, check F)'); return; }
  // A. the clock
  const S = script({ seed: 3, east: false, pat: 1 });
  const near = (what, got, want, tol) => { if (Math.abs(got - want) > tol) bad(what + ' at ' + clkS(got) + ' in the game; top kills: ' + clkS(want) + ' (check A)'); };
  const call = S.casts.find((c) => c.name === 'Call of the Serpent'); if (!call) bad('her Call of the Serpent isn\'t cast (check A)'); else { near('her Call of the Serpent', call.t0, MEAS.call, 0.3); near('her Call landing', call.t1, MEAS.callL, 0.3); }
  near('the eggs landing', Math.min(...S.eggSets[0].eggs.map((e) => e.land)), MEAS.land, 0.3); if (Math.max(...S.eggSets[0].eggs.map((e) => e.land)) > 325) bad('the eggs land until ' + clkS(Math.max(...S.eggSets[0].eggs.map((e) => e.land))) + '; top kills: all by 5:24.8 (check A)');
  if (S.eggSets[0].eggs.length !== 8) bad(S.eggSets[0].eggs.length + ' eggs fall; top kills: 8 (check A)');
  if (S.soaks.length !== 8) bad(S.soaks.length + ' coils; top kills: 8 (check A)'); else S.soaks.forEach((s, n) => { near('slam ' + (n + 1), s.at, MEAS.slams[n], 0.15); near('coil ' + (n + 1) + ' rising', s.t0, MEAS.slams[n] - MEAS.lead, 0.2); });
  near('the Shattering', T.shatter, MEAS.shatter, 0.3); if (T.end < T.shatter + 1.5 || T.end > 373) bad('the part ends at ' + clkS(T.end) + '; phase 3 takes over at 6:12, just after the Shattering (check A)');
  { const notes = fs.readFileSync(path.join(__dirname, '..', 'notes', 'Guides', 'Bosses', "8 Ula'tek.md"), 'utf8'), line = notes.split('\n').find((l) => l.startsWith('**The Mythic clock after phase 1')) || '';
    const m = /intermission Call (\d):(\d\d)/.exec(line), c = /eight Spectral Coils ((?:\d:\d\d(?:, | and |\s·)?)+)/.exec(line);
    if (!m) bad('the notes no longer give the intermission Call in "After phase 1, measured" (check A)'); else if (call) near('her Call (the notes)', call.t0, +m[1] * 60 + +m[2], 0.7);
    if (!c) bad('the notes no longer give the eight intermission coils in "After phase 1, measured" (check A)'); else { const exp = (c[1].match(/\d:\d\d/g) || []).map((x) => +x.split(':')[0] * 60 + +x.split(':')[1]); if (exp.length !== 8) bad('the notes give ' + exp.length + ' intermission coils (check A)'); else S.soaks.forEach((s, n) => near('slam ' + (n + 1) + ' (the notes)', s.at, exp[n], 0.7)); } }
  // B. the guide's plan
  const GJ = rd('guides.js'), gm = /const G = myth \? \[(\[[^\]]+\]), (\[[^\]]+\]), (\[[^\]]+\])\]/.exec(GJ);
  if (!gm) bad('the guide\'s intermission card no longer lists its three Mythic teams (const G = myth ? [...], check B)');
  else ['Y', 'P', 'B'].forEach((g, i) => { const ids = gm[i + 1].match(/'(\w\d)'/g).map((x) => x.slice(1, -1)); if (ids.join() !== P.team[g].join()) bad('the ' + P.TN[g] + ' team is ' + P.team[g].join(' ') + ' in the game; the guide\'s card has ' + ids.join(' ') + ' (check B)'); });
  { const n = (g, r) => P.team[g].filter((id) => id[0] === r).length; if (n('Y', 't') !== 1 || n('Y', 'h') !== 1 || n('Y', 'm') !== 5 || n('P', 't') !== 1 || n('P', 'h') !== 1 || n('P', 'r') !== 4 || n('B', 'h') !== 2 || n('B', 't') !== 0) bad('the teams aren\'t a tank, a healer and 5 melee; a tank, a healer and 4 ranged; two healers and the rest (the guide\'s plan, check B)'); }
  [1, 2, 3].forEach((pat) => { const Sp = script({ seed: 5, pat }), PAT = ctx.UL_PAT[pat - 1];
    Sp.soaks.forEach((s, n) => { if (s.spot !== PAT[n][0] || s.team !== PAT[n][1]) bad('pattern ' + pat + ' slam ' + (n + 1) + ' is ' + s.spot + ' (' + s.team + ') in the game; the guide\'s table has ' + PAT[n].join(' (') + ') (check B)');
      if (hyp([s.x, s.y], ctx.UL_SOAK[s.spot]) > 0.01) bad('pattern ' + pat + ' slam ' + (n + 1) + ' isn\'t on the guide\'s soak spot for ' + s.spot + ' (check B)'); if (hyp([s.x, s.y], MEAS.soak[s.spot]) > 3.5) bad('the ' + s.spot + ' soak is ' + hyp([s.x, s.y], MEAS.soak[s.spot]).toFixed(1) + ' yards from where top kills soak it (check B)');
      if (hyp(s.rim, ctx.UL_RIM[s.spot]) > 0.01) bad('the coil for ' + s.spot + ' doesn\'t rise at the guide\'s rim spot (check B)'); if (s.r !== 10) bad('a soak is ' + s.r + ' yards; 10 (check B)'); });
    const got = ['Y', 'P', 'B'].map((g) => Sp.soaks.map((s, n) => (s.team === g ? n + 1 : 0)).filter(Boolean).join('-')).sort(), want = MEAS.split[pat].slice().sort();
    if (got.join() !== want.join()) bad('pattern ' + pat + '\'s teams soak ' + got.join(' / ') + '; the kills\' Soul Constrictor splits them ' + want.join(' / ') + ' (check B)');
    const blue = Sp.soaks.filter((s) => s.team === 'B').length; if (blue !== 2) bad('Blue soaks ' + blue + ' times on pattern ' + pat + '; only twice (the guide, check B)'); });
  for (let seed = 1; seed <= 40; seed++) { const Sx = script({ seed }); const e = Sx.eggSets[0].eggs.find((q) => Object.values(ctx.UL_SOAK).some((s) => hyp([q.x, q.y], s) < 9.5)); if (e) { bad('seed ' + seed + ': ' + e.id + '\'s egg lands inside a soak circle at ' + e.x.toFixed(1) + ', ' + e.y.toFixed(1) + ' (check B)'); break; } }
  // C. the bots
  const free = { role: 'r', team: 'B', egg: false, pat: 0 }; const auditRuns = [];
  try { dbg.P2.pick = free; for (const [east, seed] of [[false, 3], [true, 3], [true, 5], [false, 6], [true, 8], [false, 11], [true, 19], [false, 20], [true, 26]]) { const a = dbg.audit(east, seed); auditRuns.push(dbg.S.pat); a.filter((x) => SERIOUS.test(x)).forEach((x) => bad('a bot slips: ' + x + ' (pattern ' + dbg.S.pat + ', seed ' + seed + ', check C)')); }
    for (const [pat, seed] of [[2, 4], [1, 29], [1, 39], [3, 16], [3, 29], [3, 40], [2, 13], [1, 7], [3, 22]]) { dbg.P2.pick = { ...free, pat }; auditRuns.push(pat); dbg.audit(false, seed).filter((x) => SERIOUS.test(x)).forEach((x) => bad('a bot slips: ' + x + ' (pattern ' + pat + ', seed ' + seed + ', check C; the review found carriers stuck on another egg\'s berth here)')); }
    dbg.P2.pick = free;
    if (new Set(auditRuns).size < 3) bad('the bots\' audit only played patterns ' + [...new Set(auditRuns)].join(', ') + ' (check C)'); }
  catch (e) { bad('the bots\' audit crashed: ' + e.message + ' (check C)'); }
  // D. your picked job
  try { for (const role of ['m', 'r', 'h']) for (const team of ['Y', 'P', 'B']) for (const egg of [true, false]) { const pk = { role, team, egg, pat: 2 }, me = ctx.pgIntSlot(pk), J = ctx.pgIntJobs(me, pk);
      if (me[0] !== role) bad('picking ' + role + ' plays ' + me + ' (check D)');
      if (J.team[me] !== team) bad('picking the ' + P.TN[team] + ' team as ' + role + ' plays ' + me + ' on ' + P.TN[J.team[me]] + ' (check D)');
      if (J.carry.has(me) !== egg) bad('picking ' + (egg ? 'an egg' : 'no egg') + ' (' + role + ', ' + P.TN[team] + ') gives ' + me + (J.carry.has(me) ? ' an egg' : ' none') + ' (check D)');
      const sz = ['Y', 'P', 'B'].map((g) => J.list[g].length).join('/'); if (sz !== '7/6/7') bad('after your pick (' + role + ', ' + P.TN[team] + ', ' + (egg ? 'egg' : 'no egg') + ') the teams are ' + sz + '; 7/6/7 (check D)');
      if (J.carry.size !== 8) bad('after your pick there are ' + J.carry.size + ' egg carriers; 8 (check D)');
      if (Object.keys(J.team).length !== 20) bad('after your pick ' + Object.keys(J.team).length + ' raiders have a team (check D)'); }
    for (const [pk, east, seed] of [[{ role: 'm', team: 'Y', egg: true, pat: 1 }, false, 4], [{ role: 'r', team: 'P', egg: true, pat: 3 }, true, 6], [{ role: 'h', team: 'B', egg: false, pat: 2 }, false, 7], [{ role: 'r', team: 'Y', egg: true, pat: 3 }, true, 9], [{ role: 'm', team: 'B', egg: true, pat: 2 }, false, 12],
      [{ role: 'r', team: 'B', egg: true, pat: 3 }, false, 7], [{ role: 'r', team: 'B', egg: true, pat: 3 }, false, 12], [{ role: 'r', team: 'B', egg: true, pat: 3 }, false, 14], [{ role: 'm', team: 'Y', egg: true, pat: 2 }, false, 9], [{ role: 'm', team: 'Y', egg: true, pat: 2 }, false, 10], [{ role: 'r', team: 'Y', egg: true, pat: 3 }, false, 3]]) { /* (the review's egg cases: the hint led to the soak, then 'never picked up') */
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(); const r = dbg.sim(me, true, east, seed);
      if (dbg.S.job.team[me] !== pk.team || dbg.S.job.carry.has(me) !== pk.egg) bad('the game plays ' + me + ' on ' + P.TN[dbg.S.job.team[me]] + (dbg.S.job.carry.has(me) ? ' with an egg' : ' without one') + ' for the pick ' + JSON.stringify(pk) + ' (check D)');
      if (r.log.length || r.deaths.length) bad('the autopilot playing ' + JSON.stringify(pk) + ' (seed ' + seed + ') makes mistakes: ' + r.log.concat(r.deaths.map((d) => 'died ' + d)).join(' | ') + ' (check D)');
      else if (dbg.grade().sc !== 100) bad('a clean run scores ' + dbg.grade().sc + ', not 100 (check E)'); } }
  catch (e) { bad('your picked job crashed: ' + e.message + ' (check D)'); }
  // E. the mistakes
  try { dbg.P2.pick = { role: 'r', team: 'P', egg: true, pat: 2 }; const me = dbg.P2.slotOf(), r = dbg.sim(me, false, false, 4), lg = r.log.join(' | ');
    [[/missed your coil soak/, 'a missed soak'], [/Your egg never went into a soak/, 'an egg never picked up'], [/No defensive for the last four slams/, 'no defensive for the back-to-back slams'], [/on a crack|threw you into the venom/, 'the Shattering where you stood']].forEach(([re, w]) => { if (!re.test(lg)) bad('standing still doesn\'t log ' + w + ': ' + lg + ' (check E)'); });
    // (the Shattering, three spots: the middle, a crack, the edge; and the diamond line clean)
    const shat = (p) => { dbg.at(T.shatter - 0.6, me, { seed: 4 }); dbg.G.log = []; dbg.G.x = p[0]; dbg.G.y = p[1]; for (let i = 0; i < 20; i++) dbg.stepOwn(1); return dbg.log.join(' | '); };
    if (!/stood on a crack/.test(shat([2, 3]))) bad('standing in the middle, where the cracks cross, as it shatters isn\'t a mistake (check E)');
    if (!/stood on a crack/.test(shat([1.5, -20]))) bad('standing on a crack line as it shatters isn\'t a mistake (check E)');
    if (!/threw you into the venom/.test(shat([20, -27]))) bad('standing at the edge as the knockback comes isn\'t a mistake (check E)');
    { const g = ctx.pgIntKb ? null : null; void g; const l = shat([9, -21.7]); if (l) bad('the diamond line, inside, isn\'t safe at the Shattering: ' + l + ' (check E)'); }
    // (Soul Constrictor: in another team's slam just before your own; and an egg carried past the last slam)
    dbg.P2.pick = { role: 'r', team: 'P', egg: false, pat: 2 }; const m2 = dbg.P2.slotOf(); dbg.at(T.slams[2] - 0.4, m2, { seed: 4 }); const s3 = dbg.S.soaks[2], s4 = dbg.S.soaks[3]; dbg.G.log = []; dbg.G.x = s3.x; dbg.G.y = s3.y; for (let i = 0; i < 12; i++) dbg.stepOwn(1);
    dbg.G.x = s4.x; dbg.G.y = s4.y; while (dbg.G.t < s4.at + 0.2) dbg.stepOwn(1); if (!/Soul Constrictor/.test(dbg.log.join(' | '))) bad('taking another team\'s slam and then your own isn\'t a Soul Constrictor mistake: ' + dbg.log.join(' | ') + ' (check E)');
    dbg.P2.pick = { role: 'r', team: 'P', egg: true, pat: 2 }; const m3 = dbg.P2.slotOf(); dbg.at(T.slams[0] - 6, m3, { seed: 4 }); const myE = dbg.G.eggs.find((e) => e.id === m3); if (myE && myE.state !== 'held') { myE.state = 'held'; myE.who = m3; }
    dbg.G.log = []; dbg.G.x = 0; dbg.G.y = 12; while (dbg.G.t < T.slams[7] + 0.5) dbg.stepOwn(1); if (!/still in your hands after the last slam/.test(dbg.log.join(' | '))) bad('an egg never carried into a soak isn\'t a mistake: ' + dbg.log.join(' | ') + ' (check E)'); }
  catch (e) { bad('the mistakes crashed: ' + e.message + ' (check E)'); }
  // F. the wiring
  try { const PJ = rd('practice.js'), P3 = rd('practice3d.js'), BP = rd('build.ps1'), keys = Object.keys(ctx.PG_PARTS["Ula'tek"]);
    if (keys.join() !== 'm,m2,mint') bad('the Part switch reads ' + keys.join(', ') + '; Phase 1, Phase 2, Intermission (check F)');
    const L3 = load(H, null, 'PG_PARTS["Ula\'tek"].m3 = { name: "Phase 3", d: "m", end: 600, roles: [{ id: "r1", name: "Ranged", job: "x" }], mod: () => null };'); const k3 = Object.keys(L3.ctx.PG_PARTS["Ula'tek"]).join();
    if (k3 !== 'm,m2,mint,m3') bad('with phase 3 read first, the Part switch reads ' + k3 + '; the intermission goes between phase 2 and phase 3 (check F)');
    const part = ctx.PG_PARTS["Ula'tek"].mint; if (!part || part.d !== 'm' || typeof part.mod !== 'function' || part.name !== 'Intermission') bad('the intermission isn\'t a Mythic part of Ula\'tek named Intermission with its own mod (check F)');
    if (!/\/\[\?&#\]practice=\(int\)\\b\//.test(GJ) || !/pgOpen\(r, S\.gdzBoss, S\.gdzDiff, pk\)/.test(GJ)) bad('`?practice=int` on the guide no longer opens the intermission (check F)');
    if (!BP.includes("'practice-int.js'") || !BP.includes("(& $read 'practice-int.js')")) bad('build.ps1 no longer checks src/practice-int.js or puts it into the page (check F)');
    if (BP.indexOf("(& $read 'practice-int.js')") < BP.indexOf("(& $read 'practice-p2.js')")) bad('build.ps1 reads src/practice-int.js before src/practice-p2.js (check F)');
    if (!/'=' \+ \(P2\.part \|\| 2\)/.test(PJ)) bad('the score link no longer says which part (\'?practice=\' + P2.part, check F)');
    if (!/A\.P2 && !A\.P2\.flat3d && typeof pg3dP2 === 'function'/.test(P3)) bad('practice3d.js builds phase 2\'s side ledges for the intermission (flat3d, check F)');
    if (!/P2 && P2\.part === 2 \? 'Hatching Doom'/.test(PJ)) bad('the boss-mod bars give the intermission\'s eggs phase 2\'s Hatching Doom icon (check F)');
    if (!/view\(true\); \/\* \(Flex, Nov 15: 3D only/.test(PJ)) bad('the intermission doesn\'t open in 3D (check F)');
    const sh = dbg.P2.short(), li = (sh.match(/<li>/g) || []).length; if (li !== 4) bad('"your job in short" isn\'t four lines (' + li + ', check F)');
    dbg.P2.pick = { role: 'r', team: 'Y', egg: true, pat: 2 }; const s2 = dbg.P2.short().replace(/<[^>]+>/g, ' | '); if (!/Yellow team, pattern 2/.test(s2) || !/2nd at Circle, the 5th at Star and the 8th at Skull/.test(s2) || !/Carry an egg/.test(s2) || !/Press Q/.test(s2) || !/Diamond marker/.test(s2)) bad('"your job in short" doesn\'t name the team, its soaks, the egg, the defensive and where to end (by the Diamond marker; it said "the diamond line" until the prompts audit, Nov 16): ' + s2 + ' (check F)');
    // (the one-screen setup, Nov 15: your role, then your job (your team, and an egg for some): the guide's teams, 2 to 6 jobs a role, one sentence. Nov 16,
    // Flex: "maybe leave it as an option for ranged just in case groups do it that way": a ranged may also take Yellow, with or without an egg)
    const su = dbg.P2.setup; if (!su || typeof su.now !== 'function' || typeof su.jobs !== 'function' || typeof su.set !== 'function' || typeof su.say !== 'function') bad('the intermission gives the setup screen no setup (roles, now, jobs, set, say; check F)');
    else { if (JSON.stringify(su.roles) !== '["m","r","h"]') bad('the setup\'s roles are ' + JSON.stringify(su.roles) + ' (check F)');
      su.roles.forEach((r) => { const J0 = su.jobs(r); if (J0.length < 2 || J0.length > 6) bad('the setup offers ' + J0.length + ' jobs to ' + r + ' (2 to 6, check F)');
        J0.forEach(([v, lab]) => { su.set(r, v); const nw = su.now(), pk = dbg.P2.pick, me = dbg.P2.slotOf(), J = ctx.pgIntJobs(me, pk);
          if (nw.role !== r || nw.job !== v) bad('picking ' + r + ' / ' + lab + ' shows ' + nw.role + ' / ' + nw.job + ' (check F)');
          if (me[0] !== r || J.team[me] !== v[0] || J.carry.has(me) !== /e$/.test(v)) bad('picking ' + r + ' / ' + lab + ' plays ' + me + ' on ' + J.team[me] + (J.carry.has(me) ? ' with an egg' : '') + ' (check F)');
          if (!P.team[v[0]].some((id) => id[0] === r) && !(r === 'r' && v[0] === 'Y')) bad('the setup offers ' + r + ' the ' + P.TN[v[0]] + ' team, which has no ' + r + ' in the guide\'s plan (check F)');
          const say = su.say(); if (!new RegExp(P.TM[v[0]]).test(say) || !/Diamond marker/.test(say) || !/Press Q/.test(say) || !/No kicks/.test(say) || /egg/.test(say) !== /e$/.test(v)) bad('the setup\'s sentence for ' + r + ' / ' + lab + ' doesn\'t name the mark, the egg, the defensive and the diamond line: ' + say + ' (check F)'); }); });
      su.set('r', 'B'); } }
  catch (e) { bad('the wiring check crashed:' + e.message + ' (check F)'); }
  // G. the 3D shapes
  try { dbg.P2.pick = { role: 'r', team: 'B', egg: false, pat: 2 }; const me = dbg.P2.slotOf(), A = { get G() { return dbg.G; }, get S() { return dbg.S; }, me, bossAt: dbg.P2.bossAt, tailAt: dbg.P2.tailAt, rl: (id) => id[0], nm: (id) => id, clsC: () => null, P2: dbg.P2 };
    const at = (t0) => { dbg.at(t0, me, { seed: 4 }); return ctx.pg3dShapes(A, dbg.G.t); };
    const s3 = dbg.S.soaks[2], L1 = at(s3.at - 1); if (!L1.some((s) => s.k === 'ring' && Math.abs(s.r - 10) < 0.01 && hyp([s.x, s.y], [s3.x, s3.y]) < 0.01)) bad('in 3D your soak isn\'t drawn at its 10 yards where it hits (check G)');
    if (!L1.some((s) => s.k === 'stail' && hyp([s.x, s.y], s3.rim) < 0.01)) bad('in 3D the coil doesn\'t rise at the rim (check G)');
    const L2 = at(T.bubbles + 2); if (!L2.some((s) => s.k === 'rect' && Math.abs(s.w1 - P.CRACK) < 0.01)) bad('in 3D the crack lines aren\'t shown before the Shattering at their ' + P.CRACK + ' yards (check G)');
    if (!L2.some((s) => s.k === 'fizz' && hyp([s.x, s.y], dbg.S.dive.to) < 0.01)) bad('in 3D her bubbles aren\'t shown at the corner where she comes up (check G)');
    if (L2.some((s) => s.k === 'ring' && Math.hypot(s.x, s.y) < 0.01)) bad('in 3D a ring still marks the middle as where she comes up; she comes up at a corner (check G)');
    const ga = [Math.cos(P.GA * Math.PI / 180) * P.GATHER, Math.sin(P.GA * Math.PI / 180) * P.GATHER]; if (!L2.some((s) => s.k === 'ring' && Math.abs(s.r - P.SPREAD) < 0.01 && hyp([s.x, s.y], ga) < 0.01)) bad('in 3D the diamond line spot isn\'t shown (check G)');
    const L3 = at(T.shatter + 1); if (!L3.some((s) => s.k === 'rect' && s.c === '#24481c')) bad('in 3D the cracks don\'t turn to venom after the Shattering (check G)');
    if (dbg.job(me).ob) bad('"Go here" still points after the Shattering (check G)'); }
  catch (e) { bad('the 3D shapes crashed on the intermission: ' + e.message + ' (check G)'); }
  // J. the independent review's fixes (Nov 15)
  try { const Q = Object.values(P.Q), seen = new Set(); for (let seed = 1; seed <= 40; seed++) { const Sx = script({ seed }); if (!Q.some((c) => hyp(c, Sx.dive.to) < 0.01)) { bad('seed ' + seed + ': she comes up at ' + Sx.dive.to.join(', ') + ', not at a quarter\'s outer corner (17 kills: always a corner, check J)'); break; } seen.add(Sx.q1); }
    if (seen.size < 4) bad('over 40 runs she comes up at only ' + [...seen].join(', ') + '; all four corners (the kills: north-east 3, north-west 5, south-west 4, south-east 5, check J)');
    dbg.P2.pick = { role: 'r', team: 'B', egg: false, pat: 2 }; const me = dbg.P2.slotOf(); dbg.at(T.shatter + 0.5, me, { seed: 4 }); if (hyp(dbg.P2.bossAt(dbg.G.t).p, dbg.S.dive.to) > 0.01) bad('after the Shattering she isn\'t at the corner her bubbles showed (check J)');
    if (!(T.defCue + 8 > T.slams[7]) || T.defCue > T.slams[4] - 0.5) bad('the defensive\'s cue (' + clkS(T.defCue) + ') doesn\'t let its 8 s cover all four slams (' + clkS(T.slams[4]) + ' to ' + clkS(T.slams[7]) + ', check J)');
    { const w = dbg.S.warns.find((x) => /^Back-to-back slams: /.test(x.text)); if (!w || Math.abs(w.t - T.defCue) > 0.05) bad('the defensive\'s call ("Back-to-back slams: Press Q (your defensive) now!", "Personals now" until the prompts audit, Nov 16) isn\'t at the defensive\'s cue (check J)'); }
    if (dbg.S.timers.some((x) => /^Coil slam \d$/.test(x.name))) bad('the boss-mod timers include each coil by number, which shows your own before the pattern is called (check J)');
    dbg.P2.pick = { role: 'r', team: 'P', egg: true, pat: 1 }; const mc = dbg.P2.slotOf(); dbg.at(T.call + 2, mc, { seed: 4 }); const mods = dbg.mods(); const eb = mods.find((b) => /egg/i.test(b.name)); if (!eb || eb.sp !== 'Call of the Serpent' || mods.some((b) => b.sp === 'Grasping Fangs')) bad('the egg\'s boss-mod bar doesn\'t take Call of the Serpent\'s icon: ' + JSON.stringify(mods.map((b) => [b.name, b.sp])) + ' (check J)');
    // (a carried egg on a crack as it shatters hatches a Viper)
    dbg.at(T.shatter - 0.6, mc, { seed: 4 }); { const e = dbg.G.eggs.find((q) => q.id === mc); e.state = 'held'; e.who = mc; } dbg.G.log = []; dbg.G.x = 1.5; dbg.G.y = -20; for (let i = 0; i < 20; i++) dbg.stepOwn(1);
    if (!/Your egg went into the venom with you: a Viper hatched/.test(dbg.log.join(' | ')) || !dbg.G.adds.some((a) => a.kind === 'viper')) bad('a carried egg that falls into the crack venom doesn\'t hatch a Viper: ' + dbg.log.join(' | ') + ' (check J)');
    // (after the Shattering: in the venom off the edge it says so, and never 'Well done' after a Shattering mistake; standing in the venom isn't charged twice)
    dbg.P2.pick = { role: 'r', team: 'B', egg: false, pat: 2 }; dbg.at(T.shatter - 0.6, me, { seed: 4 }); dbg.G.x = 24; dbg.G.y = -24; for (let i = 0; i < 30; i++) dbg.stepOwn(1);
    { const tx = dbg.P2.jobText(); if (!/in the venom/.test(tx) || /Well done/.test(tx)) bad('in the venom off the edge after the Shattering the hint says: ' + tx + ' (check J)'); const h0 = dbg.G.hp; dbg.G.x = 0.5; dbg.G.y = 36; dbg.G.kb = null; dbg.G.hp = 90; for (let i = 0; i < 20; i++) dbg.stepOwn(1); if (90 - dbg.G.hp > 12) bad('off the stone on a crack line after the Shattering you lose ' + (90 - dbg.G.hp).toFixed(1) + ' health a second: the venom is charged twice (check J)'); void h0; }
    // (Rawlings: the moment ends as her bubbles show, the hint never says to kill Rawlings that aren't there, and 'pick one')
    dbg.at(T.bubbles + 0.5, me, { seed: 4 }); if (dbg.dps().cat === 'rawling') bad('the Rawlings still count as a damage moment once her bubbles show (everyone holds the line then, check J)');
    dbg.at(T.gather - 1, me, { seed: 4 }); dbg.G.adds = []; dbg.stepOwn(30); if (/Rawlings/.test(dbg.P2.jobText())) bad('with no Rawlings left the hint still says to kill them: ' + dbg.P2.jobText() + ' (check J)');
    { const w = (dbg.P2.jobText() || ''); if (/Kill the Rawlings: press Tab to pick it/.test(w)) bad('the Rawling hint says "pick it": ' + w + ' (check J)'); }
    for (const [pat, seed] of [[2, 5], [2, 7], [2, 8], [3, 8], [3, 11]]) { dbg.P2.pick = { role: 'm', team: 'Y', egg: true, pat }; const r = dbg.sim(dbg.P2.slotOf(), true, false, seed); if (r.log.some((l) => /Rawlings were up/.test(l))) bad('the melee autopilot (Yellow, egg, pattern ' + pat + ', seed ' + seed + ') holding the line as told is scored off the Rawlings: ' + r.log.join(' | ') + ' (check J)'); }
    // (the clean-run text only says what this job did)
    dbg.P2.pick = { role: 'h', team: 'B', egg: false, pat: 0 }; if (/egg/.test(dbg.P2.clean) || /pattern/.test(dbg.P2.clean)) bad('the clean-run text for a job with no egg mentions an egg or a pattern choice: ' + dbg.P2.clean + ' (check J)');
    dbg.P2.pick = { role: 'r', team: 'P', egg: true, pat: 0 }; if (!/egg/.test(dbg.P2.clean)) bad('the clean-run text for an egg carrier doesn\'t mention the egg (check J)');
    // (a late pickup broken in a later soak is not 'never picked up', nor 'still in your hands')
    dbg.P2.pick = { role: 'r', team: 'P', egg: true, pat: 2 }; const ml = dbg.P2.slotOf(); dbg.at(T.slams[3] + 0.5, ml, { seed: 3 }); { const e = dbg.G.eggs.find((q) => q.id === ml); e.state = 'floor'; e.who = null; e.shell = Math.min(e.shell, dbg.G.t - 1); }
    dbg.G.log = []; while (dbg.G.t < T.end - 0.1) dbg.step(1); if (dbg.log.some((l) => /never went into a soak|still in your hands/.test(l))) bad('a late pickup broken in a later soak is still a mistake: ' + dbg.log.join(' | ') + ' (check J)'); }
  catch (e) { bad('the review\'s checks crashed: ' + e.message + ' (check J)'); }
  // K. the floating raid markers
  try { dbg.P2.pick = { role: 'r', team: 'B', egg: false, pat: 2 }; const me = dbg.P2.slotOf(), A = { get G() { return dbg.G; }, get S() { return dbg.S; }, me, bossAt: dbg.P2.bossAt, tailAt: dbg.P2.tailAt, rl: (id) => id[0], nm: (id) => id, clsC: () => null, P2: dbg.P2 };
    dbg.at(330, me, { seed: 4 }); const L = ctx.pg3dShapes(A, dbg.G.t).filter((s) => s.k === 'wmark'), NM = ['Skull', 'Circle', 'Star', 'Cross', 'Square', 'Triangle', 'Diamond', 'Moon'];
    if (L.length !== 8 || NM.some((n) => !L.some((s) => s.nm === n))) bad('in 3D the floating raid markers aren\'t all eight: ' + L.map((s) => s.nm).join(', ') + ' (check K)');
    if (L.some((s) => Math.abs(Math.hypot(s.x, s.y) - 33) > 0.01)) bad('a floating raid marker isn\'t at the rim, 33 yards out (check K)');
    // (each shape's outline, on a recording canvas)
    const rec = () => { const c = { n: {} }; return new Proxy(c, { get: (o, k) => (k === 'n' ? o.n : k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : (...a) => { o.n[k] = (o.n[k] || 0) + 1; }), set: () => true }); };
    const pts = (nm, bg) => { const g = rec(); ctx.pgIntMarkDraw(g, nm, 64, 64, 50, bg); return g.n; };
    [['Star', 10], ['Cross', 12], ['Diamond', 4], ['Triangle', 3]].forEach(([nm, n]) => { const c = pts(nm); if ((c.moveTo || 0) + (c.lineTo || 0) !== n || !c.fill || !c.stroke) bad('the ' + nm + ' marker isn\'t its ' + n + '-point shape with a fill and a rim (' + JSON.stringify(c) + ', check K)'); });
    { const c = pts('Skull'); if ((c.fill || 0) < 4) bad('the Skull marker has no eye sockets and nose (' + JSON.stringify(c) + ', check K)'); }
    { const c = pts('Moon', '#000'), c2 = pts('Moon'); if ((c.fill || 0) < 2 || (c.arc || 0) < 2 || (c2.fill || 0) < 2) bad('the Moon marker isn\'t a crescent (' + JSON.stringify(c) + ', check K)'); }
    { const c = pts('Square'), c2 = pts('Circle'); if (!c.rect || !c2.arc) bad('the Square or Circle marker isn\'t its shape (check K)'); }
    // (the part's own 3D kit floats them: a sprite for each marker over its spot, bobbing, with a glow)
    if (typeof dbg.P2.kit3d !== 'function') bad('the intermission brings no 3D kit for its floating markers (kit3d, check K)');
    else { const made = []; class Spr { constructor(m) { this.material = m; this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.scale = { set() {} }; made.push(this); } }
      const K = { T: { Sprite: Spr, SpriteMaterial: function (o) { Object.assign(this, o); } }, keep: (x) => x, ctex: (c) => ({ c }), canvas: (w, h, fn) => { fn(rec(), w, h); return {}; }, pool: (mk) => { const P0 = []; return () => P0[0] || (P0[0] = mk()); }, baseY: () => 0, glw: () => {} };
      const kit = dbg.P2.kit3d(K); if (!kit || typeof kit.put !== 'function' || typeof kit.frame !== 'function') bad('the intermission\'s 3D kit has no put and frame (check K)');
      else { const ok = kit.put({ k: 'wmark', x: 12, y: -30, nm: 'Star', c: '#ffd23b' }, 1), sp = made[made.length - 1];
        if (!ok || !sp || Math.abs(sp.position.x - 12) > 1e-9 || Math.abs(sp.position.z - 30) > 1e-9 || sp.position.y < 2.5 || sp.position.y > 4.5) bad('the 3D kit doesn\'t float the Star over its spot, about 3.4 yards up (check K)');
        if (kit.put({ k: 'disc', x: 0, y: 0, r: 1 }, 1)) bad('the 3D kit takes shapes that aren\'t its markers (check K)'); } }
    if (!/A\.P2 && A\.P2\.kit3d \? A\.P2\.kit3d\(\{[^}]*canvas, ctex/.test(rd('practice3d.js'))) bad('practice3d.js no longer hands a part\'s kit3d its pieces (canvas and ctex for the markers, check K)'); }
  catch (e) { bad('the floating markers crashed: ' + e.message + ' (check K)'); }
  // L. the measured splash and the egg shells
  try { if (dbg.P2.splash != null) bad('the intermission sets its own Noxious Splash distance (' + dbg.P2.splash + '); the real edge is the game\'s 3 yards (170 pulls: 4 to 6 yards apart never splashed, check L)');
    if (dbg.P2.calmCarriers !== true) bad('the intermission\'s egg carriers aren\'t the calmer ones (calmCarriers; Flex: "Yes, turn them on", check L)');
    if (!/pgDist\(\[e\.x, e\.y\], \[ns\.x, ns\.y\]\) - \(ns\.r - 2\)\) \/ 7 \+ 0\.4/.test(rd('practice-int.js'))) bad('the egg plan times the walk to the soak faster than a calm carrier walks (7 yards a second, check L)');
    if (dbg.P2.eggShells !== true) bad('the intermission\'s eggs have no Hardened shell to break (eggShells, check L)');
    { const src = rd('practice-int.js'); if (/about 4 yards|SPLASH/.test(src) || !/Keep 3 yards from other carriers/.test(src) || !/3 yards from other carriers\. The slam breaks it/.test(src)) bad('the carriers\' words don\'t give the 3 yards (or still say about 4, check L)'); }
    dbg.P2.pick = { role: 'r', team: 'P', egg: true, pat: 2 }; const me = dbg.P2.slotOf(); dbg.at(T.land + 0.6, me, { seed: 4 }); const e = dbg.G.eggs.find((q) => q.id === me);
    if (!e || !(e.shp > 0)) bad('your egg lands without a shell to break (check L)'); else { const tx = dbg.P2.jobText(); if (!/Break your egg|break it/.test(tx)) bad('with your egg\'s shell up the hint doesn\'t say to hit it: ' + tx + ' (check L)'); }
    dbg.G.log = []; while (dbg.G.t < T.slams[0]) dbg.step(1); { const e2 = dbg.G.eggs.find((q) => q.id === me); if (!e2 || e2.state === 'floor') bad('the autopilot didn\'t break its egg\'s shell and pick it up by the first slam (check L)'); } }
  catch (e) { bad('the splash and shells check crashed: ' + e.message + ' (check L)'); }
  // M. the unit frames like Flex's UI
  try { const PJ = rd('practice.js'), rule = (sel) => ((new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{([^}]*)\\}').exec(PJ) || [])[1] || '');
    if (!/grid-template-areas: "job job job" "me acts tf"/.test(rule('.pg .pg-bot'))) bad('the bottom row isn\'t your frame, the hotbar, then your target\'s (Flex\'s UI, check M)');
    if (!/display: contents/.test(rule('.pg .pg-bot > .pg-ufs'))) bad('the two frames can\'t join the hotbar\'s row (.pg-ufs must be display: contents, more specific than its flex rule, check M)');
    if (!/"job job" "me tf" "acts acts"/.test(PJ)) bad('on a narrow screen the frames don\'t stack above the hotbar (check M)');
    if (!/'K \| ' \+ hp \+ '%'/.test(PJ) || !/const PG_HP_K = 735;/.test(PJ)) bad('your frame doesn\'t read "735K | 100%" as Flex\'s does (check M)');
    if (!/height: 28px/.test(rule('.pg .pg-uf .pg-bar')) || !/position: absolute/.test(rule('.pg .pg-uf .pg-nm'))) bad('the frames aren\'t one flat bar with the name inside (check M)');
    if (!/content: attr\(data-n\)/.test(PJ) || !/class="pg-bar pg-bhp" data-n=/.test(PJ)) bad('the boss\'s name isn\'t in its bar (check M)');
    if (!/class="pg-tot"/.test(PJ) || !/tot: tot \?/.test(PJ)) bad('the target frame doesn\'t show its target after a ">" (check M)');
    dbg.P2.pick = { role: 'r', team: 'B', egg: false, pat: 2 }; const me = dbg.P2.slotOf(); dbg.at(T.slams[7] + 1, me, { seed: 4 }); const ra = dbg.G.adds.find((a) => a.kind === 'rawling'); if (ra) { dbg.tgt = ra.id; const f = dbg.tf(); if (!f || f.none || f.tot !== null) bad('a Rawling target shows a target of its own: ' + JSON.stringify(f) + ' (check M)'); } }
  catch (e) { bad('the frames check crashed: ' + e.message + ' (check M)'); }
  // N. the spot maps (Flex, Nov 16)
  try { const HH = H || require('./site-helpers.js'), ex = ['POM_DEF', 'POM_MK', 'UL_GC', 'UL_VB', 'UL_PAGES', 'ulSvg'].map((n) => HH.grab(n, GJ)).join('\n');
    const LM = load(HH, 'mint', ex), dm = LM.dbg, M = dm.P2 && dm.P2.setup && dm.P2.setup.maps, PK = () => dm.P2.pick, FN = ['tabs', 'page', 'hot', 'pick', 'extras', 'extra', 'random', 'role', 'say', 'sub'];
    if (!M || FN.some((k) => typeof M[k] !== 'function')) bad('the intermission gives the setup no spot maps (setup.maps with ' + FN.join(', ') + '; Flex, Nov 16: "visual maps that lets them select the spot", check N)');
    else {
      const pHas = (r) => ['Y', 'P', 'B'].filter((g) => P.team[g].some((id) => id[0] === r)), pEggs = (r) => ['Y', 'P', 'B'].filter((g) => P.team[g].some((id) => id[0] === r && P.carry.includes(id)));
      // (Flex, Nov 16, on the map: "theres no yellow group assignments", then "maybe leave it as an option for ranged just in case groups do it that way": a ranged
      // may also take Yellow, with an egg; melee and healers keep the plan's teams)
      const has = (r) => (r === 'r' ? ['Y', 'P', 'B'] : pHas(r)), eggs = (r) => (r === 'r' ? ['Y', 'P', 'B'].filter((g) => g === 'Y' || pEggs(r).includes(g)) : pEggs(r));
      const X = (x) => +(340 + x * 2.083).toFixed(1), Y = (y) => +(240 - (y + 0.9) * 2.083).toFixed(1), S0 = script({ seed: 4 }), pkS = (j) => { dm.P2.pick = { pat: 0, ...j }; };
      // (the setup screen shows them, on the Plan's own Groups page: its eight coil circles)
      pkS({ role: 'r', team: 'P', egg: true }); M.tab = 'grp'; const html = dm.panel();
      if (!/pg-sprow/.test(html) || !/data-mh="P"/.test(html) || /data-sj=/.test(html)) bad('with the Plan\'s maps loaded the setup screen doesn\'t show the spot maps: ' + html.replace(/<[^>]+>/g, ' ').slice(0, 160) + ' (check N)');
      Object.entries(ctx.UL_SOAK).forEach(([k, s]) => { if (!html.includes('cx="' + X(s[0]) + '" cy="' + Y(s[1]) + '" r="16.7"')) bad('Your group isn\'t the Plan\'s Groups map: its ' + k + ' coil circle is missing (UL_PAGES.trans[0], check N)'); });
      // (each role: the teams it's on in the guide's plan, where the game has them wait; Your egg only where its plan has it carry one; every pick plays as shown)
      for (const r of ['m', 'r', 'h']) { pkS({ role: r === 'm' ? 'r' : 'm', team: 'B', egg: false }); M.role(r); const H0 = M.hot('grp'), rings = H0.filter((h) => !h.you);
        if (rings.map((h) => h.id).join() !== has(r).join()) bad('Your group offers ' + r + ' the teams ' + rings.map((h) => h.id).join(', ') + '; the guide\'s plan has ' + r + ' on ' + has(r).join(', ') + ' (check N)');
        rings.forEach((h) => { const d = hyp([h.x, h.y], S0.pre[h.id]); if (d > 0.01) bad('the ' + P.TN[h.id] + ' ring on Your group is ' + d.toFixed(1) + ' yards from where the game has that team wait (check N)'); });
        if (H0.filter((h) => h.you).length !== 1) bad('Your group doesn\'t show You once (' + r + ', check N)');
        const tabs = M.tabs().map((q) => q[0]).join(); if (tabs !== (eggs(r).length ? 'grp,egg' : 'grp')) bad('the map tabs for ' + r + ' are ' + tabs + (eggs(r).length ? '; Your group and Your egg' : '; Your group only (healers carry no egg)') + ' (check N)');
        if (eggs(r).length && M.hot('egg').filter((h) => h.big).map((h) => h.id).join() !== eggs(r).join()) bad('Your egg offers ' + r + ' the teams ' + M.hot('egg').filter((h) => h.big).map((h) => h.id).join(', ') + '; the plan has ' + r + ' carry in ' + eggs(r).join(', ') + ' (check N)');
        if (!eggs(r).length && M.extras().length) bad('a healer gets a No egg button (check N)');
        for (const g of has(r)) for (const egg of eggs(r).includes(g) ? [true, false] : [false]) { M.tab = 'grp'; M.pick('grp', g); if (!!PK().egg !== egg) M.extra('noegg'); const pk = PK();
          if (pk.team !== g || pk.egg !== egg || pk.role !== r) { bad('picking ' + P.TN[g] + (egg ? ' with an egg' : '') + ' on the map as ' + r + ' gives ' + JSON.stringify(pk) + ' (check N)'); continue; }
          // (the card redraws after every click and asks the job list (setup.now); it must keep the map's pick. Nov 16 on the test copy: a ranged's Yellow click
          // went back to Purple, the old fixed list had no Yellow for ranged)
          dm.P2.setup.now(); if (PK().team !== g || PK().egg !== egg || !dm.P2.setup.jobs(r).some((o) => o[0] === g + (egg ? 'e' : ''))) { bad('the card\'s redraw turns the map\'s pick (' + r + ', ' + P.TN[g] + (egg ? ', egg' : '') + ') into ' + JSON.stringify(PK()) + ' (check N)'); continue; }
          const me = dm.P2.slotOf(); dm.at(320, me, { seed: 4 }); const want = dm.job(me).T, you = M.hot('grp').find((h) => h.you);
          if (!you || hyp([you.x, you.y], want) > 0.01) bad('You on the map isn\'t where the game stands you while your team waits (' + r + ', ' + P.TN[g] + (egg ? ', egg' : '') + ': ' + (you ? you.x.toFixed(1) + ', ' + you.y.toFixed(1) : 'none') + ' on the map, ' + want.map((v) => v.toFixed(1)).join(', ') + ' in the game, check N)');
          if (dm.S.job.team[me] !== g || dm.S.job.carry.has(me) !== egg) bad('the map\'s pick (' + r + ', ' + P.TN[g] + (egg ? ', egg' : '') + ') plays ' + me + ' on ' + P.TN[dm.S.job.team[me]] + (dm.S.job.carry.has(me) ? ' with an egg' : ' without one') + ' (check N)');
          const say = M.say(), sub = M.sub(); if (!say.includes(P.TM[g]) || /egg/.test(say) !== egg || !/Diamond marker/.test(say) || (say.match(/\. /g) || []).length || !sub.includes(P.TN[g] + ' team')) bad('the map\'s sentence or Play line for ' + r + ', ' + P.TN[g] + (egg ? ', egg' : '') + ' doesn\'t say the mark, the egg and the diamond line in one sentence: ' + say + ' / ' + sub + ' (check N)');
          // (the review, Nov 16: what the map picks is what you play: your own egg lands in your team's circle on Your egg (150 runs), and the autopilot plays the
          // pick clean (every soak of your team, your egg broken in one), on each pattern in turn)
          if (egg) { const h = M.hot('egg').find((q) => q.big && q.id === g); let n = 0, inn = 0, worst = 0; for (let seed = 2001; seed <= 2150; seed++) { const e = script({ seed, me, pick: pk }).eggSets[0].eggs.find((q) => q.id === me); if (!e) continue; n++; const d = hyp([e.x, e.y], [h.x, h.y]) - h.r; if (d <= 0) inn++; worst = Math.max(worst, d); }
            if (!n || inn / n < 0.8 || worst > 3) bad('as ' + r + ' on ' + P.TN[g] + ' with an egg, your own egg lands in the circle on Your egg ' + (n ? Math.round(inn / n * 100) : 0) + '% of the time (the farthest ' + worst.toFixed(1) + ' yards out, check N)'); }
          { const pt = 1 + (r.charCodeAt(0) + g.charCodeAt(0) + (egg ? 1 : 0)) % 3; dm.P2.pick = { ...pk, pat: pt }; const sr = dm.sim(me, true, pt === 2, 5 + pt); dm.P2.pick = pk;
            if (sr.log.length || sr.deaths.length) bad('the autopilot playing the map\'s pick (' + r + ', ' + P.TN[g] + (egg ? ', egg' : '') + ', pattern ' + pt + ') makes mistakes: ' + sr.log.concat(sr.deaths.map((d) => 'died ' + d)).join(' | ') + ' (check N)'); } } }
      // (Your egg: each circle round where the game drops that team's eggs, 200 runs it never worked from; its eggs drawn in it, as many as the team carries)
      const by = { Y: [], P: [], B: [] }; for (let seed = 1001; seed <= 1200; seed++) { const Sx = script({ seed }); Sx.eggSets[0].eggs.forEach((e) => by[Sx.job.team[e.id]].push([e.x, e.y])); }
      const AR = {}; pkS({ role: 'r', team: 'P', egg: true }); M.hot('egg').filter((h) => h.big).forEach((h) => { AR[h.id] = h; }); pkS({ role: 'm', team: 'Y', egg: true }); M.hot('egg').filter((h) => h.big).forEach((h) => { AR[h.id] = h; });
      ['Y', 'P', 'B'].forEach((g) => { const h = AR[g]; if (!h) { bad('Your egg has no circle for the ' + P.TN[g] + ' team (check N)'); return; } const L0 = by[g], inn = L0.filter((p) => hyp(p, [h.x, h.y]) <= h.r).length / L0.length, out = Math.max(...L0.map((p) => hyp(p, [h.x, h.y]) - h.r));
        if (!h.big || inn < 0.9 || out > 3.5) bad('the ' + P.TN[g] + ' circle on Your egg holds ' + Math.round(inn * 100) + '% of where the game drops that team\'s eggs (200 runs; the farthest ' + out.toFixed(1) + ' yards outside it, check N)'); });
      pkS({ role: 'r', team: 'P', egg: true }); { const n = (M.page('egg').svg.match(/<title>An egg<\/title>/g) || []).length, want = eggs('r').reduce((a, g) => a + P.team[g].filter((id) => P.carry.includes(id)).length, 0); if (n !== want) bad('Your egg draws ' + n + ' eggs for a ranged; ' + want + ', every egg of ' + eggs('r').join(', ') + ' (check N)'); }
      // (the eggs drawn on Your egg sit where the game really drops that team's eggs, and You on one of yours, in your team's circle; no You without an egg.
      // The review, Nov 16: they were drawn on a made-up ring round the circle's middle, one 3.6 yards from anywhere a Purple egg lands, and You on that middle)
      for (const [r, g] of [['m', 'Y'], ['r', 'Y'], ['r', 'P'], ['r', 'B']]) { pkS({ role: r, team: g, egg: true }); const sv = M.page('egg').svg, HS = M.hot('egg'), C = HS.filter((h) => h.big), you = HS.filter((h) => h.you), mine = C.find((h) => h.id === g), E0 = [], re = /<ellipse cx="([\d.-]+)" cy="([\d.-]+)" rx="[\d.]+" ry="[\d.]+" fill="#e8dc96"/g; let m;
        while ((m = re.exec(sv))) E0.push([(+m[1] - 340) / 2.083, (240 - +m[2]) / 2.083 - 0.9]);
        E0.forEach((p) => { const h = C.slice().sort((a, b) => hyp(p, [a.x, a.y]) - hyp(p, [b.x, b.y]))[0], d = Math.min(...by[h.id].map((q) => hyp(p, q))); if (d > 1) bad('an egg drawn on Your egg (' + r + ') sits ' + d.toFixed(1) + ' yards from anywhere the game drops a ' + P.TN[h.id] + ' egg, at ' + p.map((v) => v.toFixed(1)).join(', ') + ' (check N)'); });
        if (!mine || you.length !== 1 || !E0.some((p) => hyp(p, [you[0].x, you[0].y]) < 0.5) || hyp([you[0].x, you[0].y], [mine.x, mine.y]) > mine.r) bad('You on Your egg (' + r + ', ' + P.TN[g] + ') isn\'t on one of the ' + P.TN[g] + ' eggs drawn in its circle (check N)');
        pkS({ role: r, team: g, egg: false }); if (M.hot('egg').some((h) => h.you)) bad('You shows on Your egg without an egg (' + r + ', ' + P.TN[g] + ', check N)'); }
      // (the Plan's labels never on a spot you click)
      for (const [r, key] of [['m', 'grp'], ['m', 'egg'], ['r', 'grp'], ['r', 'egg'], ['h', 'grp']]) { pkS({ role: r, team: has(r)[0], egg: true }); const sv = M.page(key).svg, HS = M.hot(key), re = /<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)" rx="[\d.]+" fill="#0b0d11" fill-opacity="\.88"/g; let m;
        while ((m = re.exec(sv))) { const b = [+m[1], +m[2], +m[1] + +m[3], +m[2] + +m[4]]; const hit = HS.find((h) => { const cx = X(h.x), cy = Y(h.y), nx = Math.max(b[0], Math.min(cx, b[2])), ny = Math.max(b[1], Math.min(cy, b[3])); return Math.hypot(nx - cx, ny - cy) < h.r * 2.083; });
          if (hit) bad('a label of the Plan\'s map sits on the ' + P.TN[hit.id] + ' spot you click (' + r + ', ' + key + ', check N)'); } }
      // (every mechanic by default: a new role carries an egg where its team has one; it keeps the team it can be on, else goes where it carries)
      for (const [from, r, team, egg] of [[{ role: 'h', team: 'Y' }, 'm', 'Y', true], [{ role: 'h', team: 'P' }, 'r', 'P', true], [{ role: 'h', team: 'P' }, 'm', 'Y', true], [{ role: 'h', team: 'B' }, 'r', 'B', true], [{ role: 'h', team: 'B' }, 'm', 'B', false], [{ role: 'm', team: 'Y', egg: true }, 'h', 'Y', false], [{ role: 'm', team: 'Y', egg: true }, 'r', 'Y', true], [{ role: 'r', team: 'P', egg: false }, 'm', 'Y', false]]) {
        pkS({ egg: false, ...from }); M.role(r); const pk = PK(); if (pk.role !== r || pk.team !== team || pk.egg !== egg) bad('switching ' + JSON.stringify(from) + ' to ' + r + ' gives ' + JSON.stringify(pk) + '; ' + P.TN[team] + (egg ? ' with its egg' : ' without an egg') + ' (check N)'); }
      { const L1 = load(HH, 'mint', ex); const p0 = L1.dbg.P2.pick; if (p0.role !== 'r' || p0.team !== 'P' || !p0.egg) bad('a first visit plays ' + JSON.stringify(p0) + '; every mechanic a ranged can do (Purple, with an egg) (check N)'); }
      // (No egg off and on; a team you click keeps it off; a melee on Blue, whose plan has no melee egg, gets Yellow's)
      pkS({ role: 'r', team: 'B', egg: true }); M.extra('noegg'); if (PK().egg || PK().team !== 'B') bad('No egg doesn\'t turn your egg off (check N)'); M.pick('grp', 'P'); if (PK().egg) bad('after No egg, picking another team brings the egg back (check N)');
      M.extra('noegg'); if (!PK().egg || PK().team !== 'P') bad('No egg pressed again doesn\'t give your egg back (check N)');
      pkS({ role: 'm', team: 'B', egg: false }); M.extra('noegg'); if (PK().team !== 'Y' || !PK().egg) bad('a melee on Blue pressing No egg off isn\'t moved to Yellow with its egg: ' + JSON.stringify(PK()) + ' (check N)');
      pkS({ role: 'r', team: 'P', egg: false }); M.pick('egg', 'B'); if (PK().team !== 'B' || !PK().egg) bad('clicking Blue on Your egg doesn\'t make you Blue\'s carrier: ' + JSON.stringify(PK()) + ' (check N)');
      // (a healer's click with Your egg left open still picks the team)
      pkS({ role: 'r', team: 'P', egg: true }); M.tab = 'egg'; M.role('h'); M.pick(M.tab, 'B'); if (PK().team !== 'B') bad('a healer\'s click on Your group after Your egg was open picks nothing (check N)');
      pkS({ role: 'h', team: 'Y', egg: false }); M.tab = 'egg'; M.pick(M.tab, 'P'); if (PK().team !== 'P') bad('a healer\'s click picks nothing while Your egg is the tab remembered (check N)');
      // (🎲 Random: a team your role is on, with its egg where it has one; every such team comes up)
      for (const r of ['m', 'r', 'h']) { const seen = new Set(); pkS({ role: r, team: has(r)[0], egg: false }); for (let i = 0; i < 80; i++) { M.random(); const pk = PK(); seen.add(pk.team);
          if (pk.role !== r || !has(r).includes(pk.team) || pk.egg !== eggs(r).includes(pk.team)) { bad('🎲 Random as ' + r + ' gives ' + JSON.stringify(pk) + ' (check N)'); break; } }
        if (seen.size !== has(r).length) bad('🎲 Random as ' + r + ' only ever gives ' + [...seen].join(', ') + ' (check N)'); }
      // (the same buttons on both tabs, before and after a click: Flex, "clicking on your coil hides no egg")
      for (const r of ['m', 'r']) { pkS({ role: r, team: eggs(r)[0], egg: true }); const btns = (t) => { M.tab = t; const L2 = []; const re = /<button[^>]*data-m([trx])="([^"]*)"[^>]*>([^<]*)<\/button>/g; let m; const h2 = dm.panel(); while ((m = re.exec(h2))) L2.push(m[1] + ':' + m[2] + ':' + m[3]); return L2.join(' | '); };
        const a = btns('grp'), b = btns('egg'); M.pick('egg', eggs(r)[0]); const c = btns('egg'), d = btns('grp');
        if (!/x:noegg:No egg/.test(a) || a !== b || b !== c || c !== d) bad('the map\'s buttons change between tabs (' + r + '): ' + [a, b, c, d].join(' / ') + ' (check N)'); } } }
  catch (e) { bad('the spot maps crashed: ' + e.message + ' (check N)'); }
  // H. phase 1 and phase 2, with this file loaded
  try { const L1 = load(H); if (L1.dbg.P2) bad('phase 1 opens with a later part switched on (check H)'); const r1 = L1.dbg.sim('r3', true, false, 3); if (!L1.dbg.S || L1.dbg.S.end !== 165 || !r1) bad('phase 1 no longer plays to 2:45 with the intermission loaded (check H)');
    const L2 = load(H, 'm2'); if (!L2.dbg.P2 || L2.dbg.P2.part !== 2 || L2.dbg.S.end !== 318) bad('phase 2 no longer opens as itself with the intermission loaded (check H)'); }
  catch (e) { bad('phase 1 or 2 crashed with the intermission loaded: ' + e.message + ' (check H)'); }
  // I. the damage moments
  try { dbg.P2.pick = { role: 'r', team: 'B', egg: false, pat: 2 }; const me = dbg.P2.slotOf(); dbg.at(T.slams[3] + 0.3, me, { seed: 4 });
    if (!dbg.G.adds.some((a) => a.kind === 'rawling')) bad('no Rawling comes out of an egg broken in a soak (check I)'); else if (dbg.tgts().length && dbg.dps().cat) bad('the Rawlings are a damage moment during the coils (the raid kills them once the coils are done, check I)');
    dbg.at(T.slams[7] + 1.5, me, { seed: 4 }); if (dbg.dps().cat !== 'rawling') bad('the Rawlings aren\'t the damage moment once the coils are done (check I)');
    for (const pk of [{ role: 'r', team: 'B', egg: false, pat: 1 }, { role: 'm', team: 'Y', egg: true, pat: 1 }, { role: 'm', team: 'Y', egg: false, pat: 3 }]) { dbg.P2.pick = pk; const r = dbg.sim(dbg.P2.slotOf(), true, false, 4), DL = dbg.dpsList();
      if (!DL.some((m) => m.kind === 'rawling')) bad('the autopilot as ' + JSON.stringify(pk) + ' had no Rawling moment (check I)'); else if (DL.some((m) => m.fr < 0.5)) bad('the autopilot as ' + JSON.stringify(pk) + ' was on the Rawlings under half the time: ' + r.log.join(' | ') + ' (check I)'); }
    dbg.P2.pick = { role: 'r', team: 'B', egg: false, pat: 1 }; const st = dbg.sim(dbg.P2.slotOf(), false, false, 4); if (!st.log.some((l) => /Rawlings were up/.test(l))) bad('standing still doesn\'t miss the Rawlings (check I)');
    if (dbg.P2.dpsNames([{ kind: 'rawling' }]) !== 'the Rawlings') bad('the end card doesn\'t name the Rawlings (check I)'); }
  catch (e) { bad('the damage moments crashed: ' + e.message + ' (check I)'); }
  // O. the release sweep (Nov 16)
  try { const rawN = () => dbg.G.adds.filter((a) => a.kind === 'rawling').length;
    // (one run as the game plays it: from 5:18, skipped ahead to `start` as the start card does, then your own steps (`player`) or the autopilot's)
    const play = (pk, o) => { dbg.P2.pick = pk; const me = dbg.P2.slotOf(); dbg.at(T.start, me, { east: !!o.east, seed: o.seed }); if (o.start) dbg.ff(o.start); let n = 0;
      while (dbg.G.t < dbg.S.end - 1e-9 && n++ < 5000) { if (o.player) { o.player(me); dbg.stepOwn(1); } else dbg.step(1); if (o.each) o.each(me); if (dbg.G.hp <= 0) dbg.G.hp = 100; } return me; };
    // (your egg still on the floor after your last soak: the line said "Pick up your egg now: walk over it" and the arrow led there (for a melee, from 5:55 too);
    // doing it added "Your egg was still in your hands after the last slam" on top of "Your egg never went into a soak". Blue ranged and Yellow melee with an egg,
    // pattern 1, seed 1: soak only, then follow the job)
    for (const pk of [{ role: 'r', team: 'B', egg: true, pat: 1 }, { role: 'm', team: 'Y', egg: true, pat: 1 }]) { const said = []; let mid = null;
      play(pk, { seed: 1, player: (me) => { const t = dbg.G.t, S0 = dbg.S, last = S0.soaks.filter((s) => s.group.includes(me)).pop();
        if (t <= last.at + 0.1) { const ns = S0.soaks.find((s) => s.group.includes(me) && s.at >= t - 0.15); dbg.walkTo(ns && t >= S0.soaks[0].cast ? [ns.x, ns.y] : S0.pre[S0.job.team[me]]); return; }
        const tx = dbg.P2.jobText(), e = dbg.G.eggs.find((q) => q.id === me && q.state === 'floor'), h = dbg.hint(); if (/Pick up your egg/.test(tx)) said.push(tx);
        if (e && h && hyp(h.T, [e.x, e.y]) < 1) said.push('the arrow points at your egg at ' + clkS(Math.round(t * 10) / 10)); if (!mid && e && t > last.at + 0.5) mid = tx;
        dbg.walkTo(dbg.job(me).T); } });
      const lg = dbg.log.join(' | '), who = pk.role === 'm' ? 'Yellow melee' : 'Blue ranged';
      if (said.length) bad('your soaks done and your egg on the floor, the game still sends you to it: ' + said[0] + ' (the release sweep, Nov 16, ' + who + ', pattern 1, seed 1; check O)');
      else if (!/leave your egg/.test(mid || '')) bad('your soaks done and your egg on the floor, the line doesn\'t say to leave it: ' + mid + ' (' + who + ', check O)');
      if (!/never went into a soak/.test(lg) || /still in your hands/.test(lg)) bad('an egg left on the floor till your last soak isn\'t one egg mistake: ' + lg + ' (the release sweep, Nov 16, ' + who + '; check O)'); }
    // (picked up anyway after "never went into a soak", it isn't "still in your hands" too; left on a crack as the platform shatters, its Viper still hatches
    // but isn't a second mistake)
    for (const pick of [true, false]) { const pk = { role: 'r', team: 'B', egg: true, pat: 1 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(); dbg.at(T.slams[6] - 2, me, { seed: 1 }); const last = dbg.S.soaks.filter((s) => s.group.includes(me)).pop(), e = dbg.G.eggs.find((q) => q.id === me);
      Object.assign(e, { state: 'floor', who: null, x: 1, y: -14, shell: dbg.G.t - 1, shp: 0 }); dbg.G.log = []; dbg.G.x = last.x; dbg.G.y = last.y; dbg.walkTo(null); while (dbg.G.t < last.at + 1) dbg.stepOwn(1);
      if (pick) { dbg.G.x = e.x; dbg.G.y = e.y; dbg.stepOwn(4); } else { dbg.G.x = 9; dbg.G.y = -21.7; } while (dbg.G.t < (pick ? T.slams[7] + 0.5 : T.shatter + 1)) dbg.stepOwn(1);
      const eg = dbg.G.log.filter((m) => m.kind === 'egg' || m.kind === 'viper'), vp = dbg.G.adds.some((a) => a.kind === 'viper');
      if (pick && (e.state !== 'held' || eg.length !== 1)) bad('your egg picked up after "never went into a soak" gives ' + eg.length + ' egg mistakes: ' + eg.map((m) => m.text).join(' | ') + ' (one; the release sweep, Nov 16; check O)');
      if (!pick && (eg.length !== 1 || !vp)) bad('your egg left on a crack after "never went into a soak" gives ' + eg.length + ' egg mistakes' + (vp ? '' : ' and no Viper') + ': ' + eg.map((m) => m.text).join(' | ') + ' (one, and its Viper still hatches; the release sweep, Nov 16; check O)'); }
    // (a melee scored on Rawlings it couldn't reach: the 5:45 start cleared every Rawling from slams 1 to 4, and the last few died about 2 s into the moment;
    // Yellow melee, pattern 3, seed 15 was on them 0%. And from 5:18, a Yellow melee with an egg on pattern 2 (last soak at Skull, across the room) was scored
    // from 5:55 on Rawlings 20 yards away: 43 to 49%)
    { const pk = { role: 'm', team: 'Y', egg: false, pat: 3 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(); dbg.at(345, me, { seed: 15 }); const n0 = rawN(); dbg.at(T.start, me, { seed: 15 }); dbg.ff(345); const n1 = rawN();
      if (!n0 || n1 !== n0) bad('starting at 5:45 leaves ' + n1 + ' Rawlings; ' + n0 + ' are up at 5:45 in a run from 5:18 (the release sweep, Nov 16; check O)');
      play(pk, { seed: 15, start: 345 }); if (dbg.log.some((l) => /Rawlings were up/.test(l))) bad('the melee autopilot from 5:45 (Yellow, pattern 3, seed 15) is scored off the Rawlings: ' + dbg.log.join(' | ') + ' (the release sweep, Nov 16; check O)');
      for (const seed of [11, 12, 15]) { play({ role: 'm', team: 'Y', egg: true, pat: 2 }, { seed }); if (dbg.log.some((l) => /Rawlings were up/.test(l))) bad('the melee autopilot (Yellow, egg, pattern 2, seed ' + seed + ', last soak across the room) is scored on Rawlings it couldn\'t reach yet: ' + dbg.log.join(' | ') + ' (the release sweep, Nov 16; check O)'); } }
    // (a Rawling boiling at 6:03.5, just after the moment ends, charged to you while you pressed 1 all along: the raid only starts on them at 5:50.4.
    // Yellow melee with an egg, pattern 2, seed 1; a Yellow healer, pattern 1, seed 12)
    for (const [pk, seed] of [[{ role: 'm', team: 'Y', egg: true, pat: 2 }, 1], [{ role: 'h', team: 'Y', egg: false, pat: 1 }, 12]]) { play(pk, { seed }); const b = dbg.G.log.find((m) => m.kind === 'boil');
      if (b) bad('a Rawling boiling is your mistake (' + JSON.stringify(pk) + ', seed ' + seed + '): ' + b.text + ' (the release sweep, Nov 16; check O)'); }
    // (Q pressed at 5:24: the line still said "Press Q now" from 5:46.6 with 65 s of cooldown left, What's next showed "Defensive (Q)", and the mistake didn't
    // say why. Purple ranged with an egg, pattern 2, seed 3)
    { const pk = { role: 'r', team: 'P', egg: true, pat: 2 }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(); dbg.at(324.5, me, { seed: 3 }); dbg.G.def = dbg.G.t; dbg.G.log = [];
      while (dbg.G.t < T.defFrom - 0.5) dbg.step(1); const un = dbg.upNext().map((x) => x.text); if (un.some((x) => /Defensive/.test(x))) bad('with Q cooling down What\'s next still shows ' + un.join(', ') + ' (the release sweep, Nov 16; check O)');
      while (dbg.G.t < T.defCue + 0.5) dbg.step(1); const tx = dbg.P2.jobText(); if (/Press Q now/.test(tx) || !/cooling down/.test(tx)) bad('with Q cooling down the line says: ' + tx + ' (the release sweep, Nov 16; check O)');
      while (dbg.G.t < T.defBy + 0.5) dbg.step(1); if (!dbg.log.some((l) => /No defensive for the last four slams\. You pressed Q too early: it was still cooling down\./.test(l))) bad('Q pressed at 5:24 gives: ' + dbg.log.join(' | ') + '; the mistake should say Q was pressed too early, with no clock time (the release sweep, Nov 16, and the review of the prompts audit; check O)'); } }
  catch (e) { bad('the release sweep\'s checks crashed: ' + e.message + ' (check O)'); }
  // P. the prompts audit (Nov 16; Flex: "the alerts and training wheels could be better in terms of the on screen prompts", then "All 10"; mid-run: "i feel
  // like the game confuses people saying timestamps")
  try { const G = () => dbg.G, put = (p) => { dbg.G.x = p[0]; dbg.G.y = p[1]; }, hint = () => dbg.hint(), jt = () => dbg.P2.jobText() || '', onP = (p) => dbg.P2.onPlat(p[0], p[1]);
    const segNear = (a, b, c) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / L2)); return hyp([a[0] + dx * u, a[1] + dy * u], c); };
    const labelsAt = (t) => { const L0 = []; dbg.P2.shapes(t, () => {}, { disc() {}, ring() {}, grow() {}, label: (x, y, h, text, c) => L0.push({ x, y, text, c }) }); return L0; };
    const at = (t, pk, seed) => { dbg.P2.pick = pk; const me = dbg.P2.slotOf(); dbg.at(t, me, { seed: seed || 4 }); return me; }, tk = (t) => clkS(Math.round(t * 10) / 10);
    const CLOCK = /\b\d{1,2}:\d\d\b/, SECS = /\b\d+(?:\.\d+)?\s?s\b/, DEC = /\b\d+\.\d+\b/, timey = (s) => CLOCK.test(s) || SECS.test(s) || DEC.test(s);
    const SEEN = new Set(), LAB = new Set(), WARN = new Set();
    // (an arrow-follower: walks only where the arrow points, picks the nearest right target (as Tab does) and keeps pressing 1 while the target line asks,
    // presses Q when the job line says so)
    const follow = (pk, seed, east, each) => { dbg.P2.pick = pk; const me = dbg.P2.slotOf(); dbg.at(T.start, me, { seed, east }); let n = 0, died = false;
      while (G().t < T.end - 0.01 && n++ < 3000) { const h = hint(), dv = dbg.dps(), line = jt(), g = G(); dbg.walkTo(h ? h.T : null);
        if (dv && dv.cat && dv.right.length && !(dv.cur && dv.inRange && dv.right.some((o) => o.key === dv.cur.key))) dbg.tgt = dv.right.slice().sort((a, b) => hyp(a.p, [g.x, g.y]) - hyp(b.p, [g.x, g.y]))[0].key;
        if (dv && dv.cat && dv.inRange && dv.cd <= 0) { dbg.atk(); if (!(dv.aoeCd > 0)) dbg.aoe(); }
        if (/Press Q/.test(line) && g.t - g.def >= 90) g.def = g.t;
        if (each) each(me, h, line, n); dbg.stepOwn(1); if (G().hp <= 0) { died = true; G().hp = 100; } }
      dbg.S.warns.forEach((w) => WARN.add(w.text)); return died; };
    // fixes 1, 3, 4, 5 and 6 as one player meets them: a player who only follows the arrow and the lines plays clean on every job (the arrow came only as
    // the egg landed: "Your egg's shell was up: you were on it 28%" for every melee carrier); the arrow never says "Go here" while the line says stay (it
    // did for 8.5 to 26 s a run); it never walks you through another team's live coil
    for (const [pk, seed, east] of [[{ role: 'm', team: 'Y', egg: true, pat: 1 }, 7, false], [{ role: 'm', team: 'Y', egg: true, pat: 2 }, 4, false], [{ role: 'm', team: 'Y', egg: true, pat: 3 }, 5, false], [{ role: 'r', team: 'P', egg: true, pat: 2 }, 4, false],
      [{ role: 'r', team: 'P', egg: true, pat: 3 }, 6, true], [{ role: 'h', team: 'B', egg: false, pat: 1 }, 4, false], [{ role: 'r', team: 'B', egg: true, pat: 1 }, 3, false], [{ role: 'm', team: 'B', egg: true, pat: 2 }, 12, false], [{ role: 'h', team: 'Y', egg: false, pat: 2 }, 3, true]]) {
      const tag = JSON.stringify(pk) + ', seed ' + seed; let stayGo = null, cross = null;
      const died = follow(pk, seed, east, (me, h, line, n) => { SEEN.add(line); const t = G().t, p0 = [G().x, G().y]; if (n % 8 === 0) labelsAt(t).forEach((l) => LAB.add(l.text));
        if (h && /^(Stay|Good spot)/.test(line) && !stayGo) stayGo = tk(t) + ' "' + line + '" with "Go here · ' + Math.round(h.d) + ' yd"';
        if (h && !cross) dbg.S.soaks.forEach((s) => { if (!s.group.includes(me) && t >= s.t0 && t <= s.at && hyp(p0, [s.x, s.y]) > s.r + 1 && segNear(p0, h.T, [s.x, s.y]) < s.r - 0.5) cross = tk(t) + ', through the ' + P.TN[s.team] + ' soak'; }); });
      if (dbg.log.length || died) bad('a player who only follows the arrow and the lines (' + tag + ') ' + (died ? 'dies' : 'makes mistakes') + ': ' + dbg.log.join(' | ') + ' (the prompts audit, Nov 16: the arrow came only as the egg landed, "Your egg\'s shell was up: you were on it 28%" for every melee carrier; check P, fix 4)');
      if (stayGo) bad('the arrow says "Go here" while the job line says stay (' + tag + '): ' + stayGo + ' (the prompts audit, Nov 16: "Go here · 5 yd" for 8.5 to 26 s a run; check P, fix 3)');
      if (cross) bad('the arrow walks you through another team\'s coil before it slams (' + tag + '): ' + cross + ' (the prompts audit, Nov 16; check P, fix 1)'); }
    // fix 1: the arrow bends round another team's live coil and round another carrier's ring (it was a straight line through both)
    { let found = 0; for (const pat of [1, 2, 3]) for (const team of ['Y', 'P', 'B']) { if (found) break; const pk = { role: 'h', team, egg: false, pat }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(); dbg.at(T.start, me, { seed: 4 });
        for (const ns of dbg.S.soaks.filter((s) => s.group.includes(me))) { if (found) break; const t = ns.t0 + 0.3; for (const s of dbg.S.soaks) { if (s.group.includes(me) || t < s.t0 || t > s.at - 1) continue; const d = hyp([s.x, s.y], [ns.x, ns.y]) || 1, u = [(s.x - ns.x) / d, (s.y - ns.y) / d];
          /* (you just past the other team's circle, on the far side from your soak, so the straight line to your soak runs through it) */ let p = null; for (const k of [2.5, 3, 4, 5]) for (const l of [0, 1.5, -1.5]) { const q = [s.x + u[0] * (s.r + k) - u[1] * l, s.y + u[1] * (s.r + k) + u[0] * l]; if (!p && onP(q) && segNear(q, [ns.x, ns.y], [s.x, s.y]) < s.r - 2) p = q; } if (!p) continue;
          at(t, pk); put(p); const h = hint(); found = 1; if (!h || segNear(p, h.T, [s.x, s.y]) < s.r || hyp(h.T, [s.x, s.y]) < s.r) bad('the arrow to your soak at ' + ctx.pgIntMk(ns.spot) + ' runs through the ' + P.TN[s.team] + ' coil before it slams (' + (h ? 'it points at ' + h.T.map((v) => v.toFixed(1)).join(', ') : 'no arrow') + '; pattern ' + pat + ', ' + P.TN[team] + ' at ' + tk(t) + '; the prompts audit, Nov 16: a straight line from you; check P, fix 1)'); break; } } }
      if (!found) bad('the arrow-bend check found no other team\'s coil between you and your soak to test with (check P, fix 1)'); }
    { const pk = { role: 'r', team: 'P', egg: true, pat: 2 }, me = at(T.slams[0] - 4 + 0.3, pk), e = G().eggs.find((q) => q.id === me); Object.assign(e, { state: 'held', who: me });
      const c = G().eggs.find((q) => q.id !== me && q.id && G().bots[q.id]); G().eggs.forEach((q) => { if (q !== e && q !== c) q.state = 'gone'; }); c.state = 'gone';
      const ns = dbg.S.soaks.find((s) => s.group.includes(me)), d0 = hyp([ns.x, ns.y], [0, 0]) || 1, p = [-ns.x / d0 * 6, -ns.y / d0 * 6]; put(p); const h0 = hint();
      if (!h0) bad('no arrow to your soak from the middle of the room (check P, fix 1)'); else { const mid = [(p[0] + h0.T[0]) / 2, (p[1] + h0.T[1]) / 2]; Object.assign(c, { state: 'held', who: c.id }); G().bots[c.id].x = mid[0]; G().bots[c.id].y = mid[1];
        const h1 = hint(); if (!h1 || segNear(p, h1.T, mid) < 3) bad('carrying your egg, the arrow runs straight through another carrier\'s 3-yard ring (the prompts audit, Nov 16; check P, fix 1)'); } }
    // fix 2: dodges with words: an egg about to land on you (and the arrow out of it), another team's coil with you in it, another carrier's ring, the cracks
    // and the edge (with a "Crack" label on the red strips)
    { const pk = { role: 'h', team: 'B', egg: false, pat: 1 }; at(T.land - 2, pk); const eg = G().eggs.find((q) => q.state === 'air'); put([eg.x, eg.y]); const tx = jt(), h = hint();
      if (!/egg is landing on you/.test(tx)) bad('standing where an egg lands, 2 s before, the line says: ' + tx + ' (the prompts audit, Nov 16: falling eggs had no words; check P, fix 2)');
      if (!h || hyp(h.T, [eg.x, eg.y]) < 4.7) bad('standing where an egg lands, the arrow doesn\'t lead out of its circle (check P, fix 2)');
      const so = dbg.S.soaks.find((s) => !s.group.includes(dbg.P2.slotOf())), me = at(so.t0 + 1, pk); void me; put([so.x, so.y]); if (!/isn't yours/.test(jt())) bad('standing in another team\'s coil as it rises, the line says: ' + jt() + ' (check P, fix 2)');
      at(T.bubbles + 2, pk); put([1.5, -20]); if (!/Step off the crack/.test(jt())) bad('standing on a crack after her bubbles show, the line says: ' + jt() + ' (the prompts audit, Nov 16: "To the diamond line now" wherever you stood; check P, fix 2)');
      put([20, -27]); if (!/edge/.test(jt())) bad('standing at the edge after her bubbles show, the line says: ' + jt() + ' (check P, fix 2)');
      if (labelsAt(G().t).filter((l) => l.text === 'Crack').length < 2) bad('the red crack strips have no "Crack" label (the prompts audit, Nov 16; check P, fix 2)'); }
    { const pk = { role: 'r', team: 'P', egg: true, pat: 2 }, me = at(T.slams[0] - 6, pk), e = G().eggs.find((q) => q.id === me); Object.assign(e, { state: 'held', who: me }); put([0, 12]);
      const c = G().eggs.find((q) => q.id !== me && q.id && G().bots[q.id]); Object.assign(c, { state: 'held', who: c.id }); G().bots[c.id].x = 3; G().bots[c.id].y = 12;
      if (!/^Step away from .*'s egg/.test(jt())) bad('carrying your egg 3 yards from another carrier, the line says: ' + jt() + ' (the prompts audit, Nov 16: practice.js\'s "Too close" line never ran in the intermission; check P, fix 2)'); }
    // fix 3: the arrow goes away exactly where the game counts you (inside your soak's 10 yards; on the gold ring's 4), and the line says stay there
    { const pk = { role: 'h', team: 'B', egg: false, pat: 1 }, me = at(339, pk), ns = dbg.S.soaks.find((s) => s.group.includes(me)), d0 = hyp([ns.x, ns.y], [0, 0]), u = [-ns.x / d0, -ns.y / d0];
      put([ns.x + u[0] * 8.5, ns.y + u[1] * 8.5]); if (hint() || !/^Stay in your soak/.test(jt())) bad('8.5 yards inside your soak (10) the arrow ' + (hint() ? 'still says "Go here"' : 'is gone') + ' and the line says: ' + jt() + ' (the prompts audit, Nov 16: "In your 1st soak at Circle: stay inside until it slams (5.0 s)" with "Go here · 5 yd"; check P, fix 3)');
      put([ns.x + u[0] * 11.5, ns.y + u[1] * 11.5]); if (!hint() || !/^Get into your soak/.test(jt())) bad('outside your soak the arrow or the line doesn\'t send you in: ' + jt() + ' (check P, fix 3)');
      at(T.bubbles + 1, pk); const ga = [Math.cos(P.GA * Math.PI / 180) * P.GATHER, Math.sin(P.GA * Math.PI / 180) * P.GATHER]; put([ga[0] + 3.5, ga[1]]); if (hint() || !/^Good spot/.test(jt())) bad('3.5 yards inside the gold ring (4) the arrow ' + (hint() ? 'still shows' : 'is gone') + ' and the line says: ' + jt() + ' (check P, fix 3)');
      put([ga[0] + 6, ga[1] + 6]); if (!hint() || !/^Go to the gold ring/.test(jt())) bad('off the gold ring the arrow or the line doesn\'t send you there: ' + jt() + ' (check P, fix 3)'); }
    // fix 4: the arrow from the moment the line names the place: beside your egg's gold circle from the start (not from its landing), your team's spot, and
    // for a melee the nearest Rawling once the coils are done
    { const me = at(T.start + 0.5, { role: 'm', team: 'Y', egg: true, pat: 1 }); void me; if (!hint() || !/^Run to your egg's gold circle/.test(jt())) bad('at the start an egg carrier has ' + (hint() ? 'an arrow' : 'no arrow') + ' and the line: ' + jt() + ' (the prompts audit, Nov 16: no arrow until the egg landed, 37 to 47 yards away; check P, fix 4)');
      at(T.start + 0.5, { role: 'h', team: 'B', egg: false, pat: 1 }); put([20, 20]); if (!hint() || !/^Go to your team's spot by Square/.test(jt())) bad('at the start a healer far from its team has ' + (hint() ? 'an arrow' : 'no arrow') + ' and the line: ' + jt() + ' (check P, fix 4)');
      at(T.gather + 0.5, { role: 'm', team: 'Y', egg: false, pat: 1 }); const RL = G().adds.filter((a) => a.kind === 'rawling'); if (!RL.length) bad('no Rawlings at 5:55.5 to test the melee arrow with (check P, fix 4)');
      else { const far = [[-25, 20], [25, 20], [-25, -15], [25, -15]].sort((a, b) => Math.min(...RL.map((r) => hyp(b, [r.x, r.y]))) - Math.min(...RL.map((r) => hyp(a, [r.x, r.y]))))[0]; put(far); if (!hint() || !/Rawlings/.test(jt())) bad('a melee far from the Rawlings once the coils are done has ' + (hint() ? 'an arrow' : 'no arrow') + ' and the line: ' + jt() + ' (the prompts audit, Nov 16: melee got no arrow toward them; check P, fix 4)'); } }
    // fix 5: Q after the move line, never instead of it; never another player's timer or "Next: X in N s"
    { const pk = { role: 'm', team: 'Y', egg: false, pat: 1 }; at(351, pk); G().def = -1e9; const tx = jt(); if (!/gold ring.*Press Q/.test(tx)) bad('your soaks done at 5:51 with Q unpressed, the line says: ' + tx + ' (the prompts audit, Nov 16: "Press Q now: personals" replaced "head for the diamond line"; check P, fix 5)');
      const nx = [...SEEN].filter((s) => /^Next: /.test(s)); if (nx.length) bad('the job line reads out a timer: ' + nx[0] + ' (check P, fix 5)'); }
    // fix 6: lines that said something false: the ranged told to kill the Rawlings before the gold ring; "Egg shells are breaking" gold to everyone at 5:31;
    // a "Your egg opens" bar while its shell is up for you to break
    { at(T.gather + 0.5, { role: 'r', team: 'P', egg: false, pat: 1 }); put([-15, 10]); const tx = jt(); if (!/^Go to the gold ring/.test(tx)) bad('a ranged off the gold ring once the coils are done reads: ' + tx + ' (the prompts audit, Nov 16: "Kill the Rawlings, then go to the diamond line", the reverse of the plan; check P, fix 6)');
      const w = dbg.S.warns.find((x) => Math.abs(x.t - T.gather) < 1); if (!w || !/^Coils done: Go to the gold ring/.test(w.text)) bad('the ranged\'s Rawlings call is: ' + (w && w.text) + ' (check P, fix 6)');
      if (dbg.S.warns.some((x) => /shells are breaking/i.test(x.text) || Math.abs(x.t - T.shell0) < 0.05)) bad('a call still says the egg shells are breaking at 5:31 (the prompts audit, Nov 16: your shell is up until you hit it; check P, fix 6)');
      at(T.land + 1, { role: 'm', team: 'Y', egg: true, pat: 1 }); const mb = dbg.mods().map((b) => b.name); if (mb.some((n) => /opens/.test(n))) bad('with your egg\'s shell up for you to break, the bars show ' + mb.join(', ') + ' (it jumped 13, 10, 6, 2 as you hit; check P, fix 6)');
      const me2 = at(T.call + 2, { role: 'm', team: 'Y', egg: true, pat: 1 }), e2 = G().eggs.find((q) => q.id === me2), m2 = dbg.mods().filter((b) => Math.abs(b.at - e2.land) < 1.5);
      if (m2.length !== 1) bad('your egg\'s landing has ' + m2.length + ' boss-mod bars: ' + m2.map((b) => b.name).join(', ') + ' (one, yours: "Your egg lands" stood next to "Call of the Serpent"; the prompts audit, Nov 16; check P, fix 6)'); }
    // fix 7: the Rawlings call fires with the job line, not after it
    { const w = dbg.S.warns.find((x) => /Rawlings/.test(x.text)); if (!w || w.t > T.gather + 1e-6) bad('the Rawlings call comes ' + (w ? ((w.t - T.gather) * 1000).toFixed(0) + ' ms after' : 'never, nor with') + ' the job line that sends you to them (the prompts audit, Nov 16; check P, fix 7)'); }
    // fix 8: the pattern call names YOUR first soak (it said "Triangle first" to a Yellow player whose first soak is at Circle); your own circle has no team
    // label, the others' have their team's without "(yours)"
    { const me = at(T.slams[1] - 1, { role: 'm', team: 'Y', egg: false, pat: 2 }), f = dbg.S.soaks.find((s) => s.group.includes(me)), w = dbg.S.warns.find((x) => Math.abs(x.t - dbg.S.soaks[0].cast) < 0.01 && /Spectral Coils/.test(x.text));
      if (!w || !w.text.includes('your soak at ' + ctx.pgIntMk(f.spot))) bad('the pattern call doesn\'t name your first soak (' + ctx.pgIntMk(f.spot) + '): ' + (w && w.text) + ' (the prompts audit, Nov 16: big "Triangle first" for Yellow on pattern 2; check P, fix 8)');
      const L0 = labelsAt(G().t), mineL = L0.filter((l) => hyp([l.x, l.y], [f.x, f.y]) < 0.01 && /team/.test(l.text)); if (mineL.length || L0.some((l) => /\(yours\)|Spectral Coil/.test(l.text))) bad('the floor labels your own soak by team, or still says "(yours)" or "Spectral Coil": ' + L0.map((l) => l.text).join(' ; ') + ' (the prompts audit, Nov 16: up to 11 labels; check P, fix 8)'); }
    // fix 9: centre calls "Mechanic: Order", the order capitalised in the big line; gold only for the calls about your own job
    { at(T.start + 0.2, { role: 'r', team: 'P', egg: true, pat: 2 }); const W = dbg.S.warns;
      W.forEach((w) => { if (!/^[A-Z][^:!?]{2,39}: [A-Z]/.test(w.text)) bad('a centre call isn\'t "Mechanic: Order" with the order capitalised: ' + w.text + ' (the prompts audit, Nov 16: "go to your team\'s mark", "eight eggs incoming"; check P, fix 9)'); });
      const gold = (w) => /class="pg-al you/.test(dbg.alerts([Object.assign({}, w)])); /* (the whole call, its me mark too: practice.js goes by the mark, not by "your" in the words, since the merge, Nov 16) */
      [[T.defCue, true, 'the defensive (Q)'], [dbg.S.soaks[0].cast, true, 'your first soak'], [T.start, true, 'your egg'], [T.call, false, 'the falling eggs (raid-wide)'], [T.bubbles, false, 'the Shattering (raid-wide)'], [T.shatter, false, 'the Shattering (raid-wide)']].forEach(([t0, want, what]) => {
        const L0 = W.filter((w) => Math.abs(w.t - t0) < 0.01); if (!L0.length) bad('no call for ' + what + ' (check P, fix 9)');
        L0.forEach((w) => { if (gold(w) !== want) bad('the call for ' + what + ' is ' + (want ? 'not gold' : 'gold') + ': ' + w.text + ' (the prompts audit, Nov 16: the only key-press call was white, "Personals now"; check P, fix 9)'); }); }); }
    // fix 10: Q's "now": at the cue the line adds "Press Q" after the move line and the Q button glows; once pressed, neither
    { at(T.defCue + 0.2, { role: 'h', team: 'B', egg: false, pat: 1 }); G().def = -1e9; const tx = jt();
      if (!/\. Press Q/.test(tx) || !(dbg.P2.qGlow && dbg.P2.qGlow())) bad('at the defensive\'s cue the line is "' + tx + '" and the Q button ' + (dbg.P2.qGlow && dbg.P2.qGlow() ? 'glows' : 'doesn\'t glow') + ' (the prompts audit, Nov 16: no "now" moment for Q; check P, fix 10)');
      G().def = G().t; if (/Press Q/.test(jt()) || (dbg.P2.qGlow && dbg.P2.qGlow())) bad('after pressing Q the line or the button still asks for it (check P, fix 10)'); }
    // Flex's rule (Nov 16, "i feel like the game confuses people saying timestamps"): no clock time and no second count in anything the player reads from this
    // part: job lines, centre calls, floor labels, the start card, the setup's sentences, the Play line, the Start list (the bars count; the report may say
    // when a mistake happened)
    { const SET = new Set(); const sv = dbg.P2.pick;
      for (const [role, team, egg] of [['m', 'Y', true], ['m', 'B', false], ['r', 'P', true], ['r', 'B', false], ['h', 'Y', false], ['h', 'B', false]]) for (const pat of [0, 2]) { dbg.P2.pick = { role, team, egg, pat };
        [dbg.P2.short(), dbg.P2.asg(), dbg.P2.card().replace(/<svg[\s\S]*?<\/svg>/g, ' ')].forEach((h) => SET.add(h.replace(/<[^>]+>/g, ' | ')));
        const su = dbg.P2.setup, M = su && su.maps; if (su) SET.add(su.say()); if (M) { SET.add(M.say()); SET.add(M.sub()); ['grp', 'egg'].forEach((k) => M.hot(k).forEach((x) => SET.add(x.title || ''))); }
        SET.add(dbg.P2.role().job); SET.add(dbg.P2.clean); }
      dbg.P2.pick = sv; dbg.P2.starts.forEach(([, n]) => SET.add(n));
      (rd('practice-int.js').match(/A\.say\('(?:[^'\\]|\\.)*'/g) || []).forEach((s) => SET.add(s));
      const all = [['job line', SEEN], ['centre call', WARN], ['floor label', LAB], ['start card or setup', SET]];
      all.forEach(([what, S0]) => { const hit = [...S0].filter((s) => s && timey(s)); if (hit.length) bad('a ' + what + ' says a clock time or counts seconds: "' + hit.slice(0, 3).join('" / "') + '"' + (hit.length > 3 ? ' and ' + (hit.length - 3) + ' more' : '') + ' (Flex, Nov 16: "i feel like the game confuses people saying timestamps"; the prompts audit; check P)'); });
      if (SEEN.size < 25 || LAB.size < 6 || WARN.size < 7) bad('the timestamp scan saw too little to judge (' + SEEN.size + ' job lines, ' + LAB.size + ' labels, ' + WARN.size + ' calls; check P)');
      const src = rd('practice-int.js'), body = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); return i >= 0 && j > i ? src.slice(i, j) : ''; }, jb = body('const dodgeLine = ', 'const upNext = ');
      if (!jb || /clk\(|toFixed\(|Math\.ceil\(/.test(jb)) bad('the job line\'s code formats a clock time or a count again (clk, toFixed or Math.ceil in jobText; check P)'); } }
  catch (e) { bad('the prompts audit\'s checks crashed: ' + e.message + ' (check P)'); }
  // Q. the review of the prompts audit (Nov 16, night): what a skeptic found playing the commit headless. Each fails on the commit before it.
  try { const G = () => dbg.G, put = (p) => { dbg.G.x = p[0]; dbg.G.y = p[1]; }, hint = () => dbg.hint(), jt = () => dbg.P2.jobText() || '', onP = (p) => dbg.P2.onPlat(p[0], p[1]);
    const segNear = (a, b, c) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / L2)); return hyp([a[0] + dx * u, a[1] + dy * u], c); };
    const at = (t, pk, seed) => { dbg.P2.pick = pk; const me = dbg.P2.slotOf(); dbg.at(t, me, { seed: seed || 4 }); return me; }, CLOCK = /\b\d{1,2}:\d\d\b/, words = (s) => s.trim().split(/\s+/).length;
    const run = (until) => { let k = 0; while (G().t < until && k++ < 20000) { dbg.stepOwn(1); if (G().hp <= 0) G().hp = 100; } }; /* (you idle, no autopilot; a death can't freeze the loop) */
    // 1. inside another team's live coil, the arrow led on through its middle (bend() skips a circle you stand in) while the line said to step out: it must
    //    end beyond its edge and lead outward, 5 yards in and on its 10.5-11 yard rim
    { let n = 0; for (const pat of [1, 2]) for (const team of ['Y', 'P', 'B']) { const pk = { role: 'h', team, egg: false, pat }; dbg.P2.pick = pk; const me0 = dbg.P2.slotOf(); dbg.at(T.start, me0, { seed: 4 });
        const s = dbg.S.soaks.find((q) => !q.group.includes(me0) && q.at - 1.6 > T.land + 1); if (!s) continue; const me = at(s.at - 1.6, pk); void me; const d0 = hyp([s.x, s.y], [0, 0]) || 1, u = [-s.x / d0, -s.y / d0];
        for (const k of [5, 10.7]) { const p = [s.x + u[0] * (s.r - (k === 5 ? 5 : s.r - k)), s.y + u[1] * (s.r - (k === 5 ? 5 : s.r - k))]; if (!onP(p)) continue; put(p); G().eggs.forEach((q) => { if (q.state === 'air') q.state = 'floor'; }); const h = hint(), c = [s.x, s.y]; n++;
          if (!h || hyp(h.T, c) < s.r + 1 || segNear(p, h.T, c) < hyp(p, c) - 0.05) bad('inside the ' + P.TN[s.team] + ' coil (' + hyp(p, c).toFixed(1) + ' yards from its middle, pattern ' + pat + ', ' + P.TN[team] + '), the arrow ' + (h ? 'ends ' + hyp(h.T, c).toFixed(1) + ' yards from its middle and comes ' + segNear(p, h.T, c).toFixed(1) + ' close' : 'is missing') + ': it must lead out past its edge (the review, Nov 16: it ran through the middle, Soul Constrictor; check Q1)');
          if (!/isn't yours/.test(jt())) bad('inside the ' + P.TN[s.team] + ' coil (' + hyp(p, c).toFixed(1) + ' yards in), the line says: ' + jt() + ' (the review, Nov 16: nothing said so on its 10.5-11 yard rim; check Q1)'); } }
      if (n < 4) bad('the coil-escape check found only ' + n + ' spots to test (check Q1)'); }
    // 2. 4.85 yards from an egg landing in 2 s, the arrow to your team's spot crossed its 4-yard impact (bend() sees eggs 6 s ahead, 5 yards round; the
    //    get-out step only 3 s and 4.7)
    { const pk = { role: 'h', team: 'B', egg: false, pat: 1 }; let tried = 0; for (let i = 0; i < 8 && !tried; i++) { const me = at(T.land - 2, pk, 3); void me; const eg = G().eggs.filter((q) => q.state === 'air')[i]; if (!eg) break;
        const sp = dbg.S.pre.B, d = hyp([eg.x, eg.y], sp) || 1, p = [eg.x + (eg.x - sp[0]) / d * 4.85, eg.y + (eg.y - sp[1]) / d * 4.85]; if (!onP(p) || d < 8) continue; put(p); const h = hint(); tried = 1;
        if (h && segNear(p, h.T, [eg.x, eg.y]) < 4) bad('4.85 yards from an egg landing in 2 s, the arrow passes ' + segNear(p, h.T, [eg.x, eg.y]).toFixed(1) + ' yards from its middle, inside its 4-yard impact (the review, Nov 16; check Q2)'); }
      if (!tried) bad('the landing-egg arrow check found no egg to test with (check Q2)'); }
    // 3. no clock time in a mistake: each shows on screen as it happens ("No defensive for the last four slams (5:48 to 5:54)", "its shell broke at 5:28")
    { const seen = []; for (const [pk, seed] of [[{ role: 'r', team: 'P', egg: true, pat: 2 }, 3], [{ role: 'm', team: 'Y', egg: true, pat: 1 }, 5], [{ role: 'h', team: 'B', egg: false, pat: 3 }, 7]]) { at(T.start, pk, seed);
        run(T.end - 0.05); G().log.forEach((m) => seen.push(m.text || '')); } /* (the text the float shows; dbg.log puts the time in front, as the report does) */
      const hit = seen.filter((s) => CLOCK.test(s)); if (hit.length) bad('a mistake shown on screen says a clock time: "' + hit.slice(0, 3).join('" / "') + '" (Flex, Nov 16: "i feel like the game confuses people saying timestamps"; the review; check Q3)');
      if (seen.length < 3) bad('the mistake scan saw only ' + seen.length + ' mistakes from three idle runs (check Q3)'); }
    // 4. the pattern call sent a carrier to its soak while the line said to break its egg first: the two agree
    { const pk = { role: 'r', team: 'P', egg: true, pat: 2 }; let c0 = 0, eggSeen = 0;
      for (let seed = 1; seed <= 6; seed++) { const me = at(T.start, pk, seed); c0 = dbg.S.soaks[0].cast; run(c0 - 1); const e = G().eggs.find((q) => q.id === me); if (!e || e.state !== 'floor') continue;
        put([e.x + 1, e.y]); run(c0 + 0.05); const w = dbg.S.warns.find((x) => Math.abs(x.t - c0) < 0.01 && /^Spectral Coils:/.test(x.text)), tx = jt(), eggF = /^(Break|Run to|Pick up|Wait by) your egg/.test(tx); if (eggF) eggSeen++;
        if (eggF !== !!(w && /Get your egg, then your soak at/.test(w.text))) bad('as the coils are called, a carrier beside its unbroken egg hears "' + (w && w.text) + '" while the line says "' + tx + '" (seed ' + seed + '; the review, Nov 16: Purple ranged, pattern 2, sent to Triangle while told to break its egg; check Q4)'); }
      if (!eggSeen) bad('no carrier beside its unbroken egg was told to break it first as the coils were called, so the call\'s egg wording went untested (check Q4)');
      at(T.start, { role: 'h', team: 'B', egg: false, pat: 2 }, 3); run(c0 + 0.05); const w2 = dbg.S.warns.find((x) => Math.abs(x.t - c0) < 0.01 && /^Spectral Coils:/.test(x.text));
      if (!w2 || !/: Go to your soak at /.test(w2.text)) bad('without an egg the pattern call is: ' + (w2 && w2.text) + ' (check Q4)'); }
    // 5. the Q prompt and glow came 0.4 s before its call: a call fires with its line or before it
    { at(T.defCue - 0.3, { role: 'h', team: 'B', egg: false, pat: 1 }); G().def = -1e9; if (/Press Q/.test(jt()) || (dbg.P2.qGlow && dbg.P2.qGlow())) bad('0.3 s before the defensive\'s call the line says "' + jt() + '" or Q glows (the review, Nov 16; check Q5)'); }
    // 6. "Go to your team's spot by Square" while standing on it (the arrow gone): wait there
    { at(T.start + 0.5, { role: 'h', team: 'B', egg: false, pat: 1 }); put(dbg.S.pre.B); const tx = jt(); if (!new RegExp('^Wait by ' + P.TM.B + ' with your team').test(tx)) bad('standing on your team\'s spot before the eggs land, the line says: ' + tx + ' (the review, Nov 16; check Q6)'); }
    // 7. "Step out of the white circle" 0.5 s before the circle is drawn (practice3d.js draws a landing egg's circle from 2.5 s)
    { const pk = { role: 'h', team: 'B', egg: false, pat: 1 }; at(T.start, pk, 4); const eg0 = G().eggs.filter((q) => q.state === 'air').sort((a, b) => a.land - b.land)[0], i0 = G().eggs.indexOf(eg0);
      at(eg0.land - 2.8, pk, 4); let eg = G().eggs[i0]; put([eg.x, eg.y]); G().eggs.forEach((q) => { if (q !== eg && q.state === 'air' && q.land - G().t <= 2.5) q.state = 'floor'; });
      if (/landing on you|your egg's circle/.test(jt())) bad('2.8 s before an egg lands, before its circle shows, the line says: ' + jt() + ' (the review, Nov 16; check Q7)');
      at(eg0.land - 2.2, pk, 4); eg = G().eggs[i0]; put([eg.x, eg.y]); if (!/landing on you|your egg's circle/.test(jt())) bad('2.2 s before an egg lands on you, the line says: ' + jt() + ' (check Q7)'); }
    // 8. the waiting line ran to 17-20 words ("... Then: run to your first soak when it lights up gold."): 12 at most
    { const c0 = (pk) => { const me = at(T.start, pk, 4), c = dbg.S.soaks[0].cast; at(c - 1.5, pk, 4); return me; };
      const me = c0({ role: 'h', team: 'B', egg: false, pat: 1 }); void me; put(dbg.S.pre.B); const a = jt();
      const me2 = c0({ role: 'r', team: 'P', egg: true, pat: 2 }), e = G().eggs.find((q) => q.id === me2); Object.assign(e, { state: 'held', who: me2 }); G().eggs.forEach((q) => { if (q !== e && q.state === 'held') q.state = 'gone'; }); put(dbg.S.pre.P); const b = jt();
      [a, b].forEach((s) => { if (!/^Wait by /.test(s) || words(s) > 12) bad('the waiting line is "' + s + '" (' + words(s) + ' words; the review, Nov 16: 12 at most; check Q8)'); }); }
    // 9. the start card's words: "Last, her bubbles show" and "by the Diamond marker, halfway out" (the gold ring is two-thirds out, inside the marker)
    { const sv = dbg.P2.pick; for (const team of ['Y', 'P', 'B']) { dbg.P2.pick = { role: 'h', team, egg: false, pat: 0 }; const tx = (dbg.P2.short() + dbg.P2.asg()).replace(/<[^>]+>/g, ' ');
        if (/halfway out|Last, her/.test(tx) || !/gold ring, just inside the Diamond marker/.test(tx)) bad('the start card says "halfway out" or "Last, her", or doesn\'t name the gold ring by the Diamond marker (the review, Nov 16; check Q9)'); } dbg.P2.pick = sv; } }
  catch (e) { bad('the review\'s checks crashed: ' + e.message + ' (check Q)'); }
}

module.exports = checks; module.exports.load = load;
if (require.main === module) {
  let n = 0; const t0 = Date.now(); checks(null, (a, b, t) => { n++; console.log('✗ ' + t); });
  console.log(n ? n + ' problem(s)' : 'practice game, intermission: all checks pass', '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
  if (process.argv.includes('--audit')) { const { dbg } = load(null, 'mint'); dbg.P2.pick = { role: 'r', team: 'B', egg: false, pat: 0 }; for (let seed = 1; seed <= 30; seed++) for (const east of [false, true]) { const a = dbg.audit(east, seed); console.log('seed ' + seed + (east ? ' E' : ' W') + ' pattern ' + dbg.S.pat + ': ' + (a.length ? '\n  ' + a.join('\n  ') : 'clean')); } }
  process.exitCode = n ? 1 : 0;
}
