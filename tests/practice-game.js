// The Ula'tek practice game (src/practice.js), run in Node: the fight script and the 19 bots, with the page's screen stood in for by a do-nothing stub,
// so a check reads exactly what the game plays. Runs on every build (tests/contradictions.js); `node tests/practice-game.js` runs the checks alone and
// prints the bot audit for a few runs.
// The checks (Nov 15, Main held the game against the measured Mythic clock in notes/Guides/Bosses/8 Ula'tek.md, "Mythic phase 1, measured"):
//   A. The fight clock is the measured one. (The off tank's venom beam ran at 0:07 instead of 0:15 to 0:19, the second at 1:16 while she was still diving
//      instead of 1:24 to 1:28, the second bubble at 1:14 instead of 1:10, and the start card named bubbles at 1:14 and 2:22.)
//   B. Her tail, and the coils that rise beside it, are on either side in set 1 (west or east, about even) and south in set 2, and either coil can come first:
//      team 1 takes the first to appear (Flex: "whichever appears first is the one gets soaked"). (The tail and its coils were always west, the same coil first.)
//   C. One tank takes all 5 beam impacts; the tank who took the first Mother's Wrath soaks the second beam and takes the new tail; at 1:48 the second Wretch
//      is held 17 to 22 yards in front of her new spot, 46 to 53 from the new tail, with the raid in its bubble through the Thrash. (The off tank took both
//      beams and held the second Wretch 26 yards from her; her first tank stayed on her after the dive.)
//   D. Your own job without a team plan (Flex, Nov 15): three rows, role, egg area and one coil team; see check D below.
//   E. Hints of what's coming next for you, and an arrow to where your job wants you (Flex, Nov 15); see check E below.
//   F. The start card, tidy: your job, your job in short, Start; the rundown and the options folded away (Flex, Nov 15); see check F below.
//   G. Hitting the right thing: the Rawlings, the heart, a Viper; Tab picks a target (Flex, Nov 15); see check G below.
//   H. Attacking you can see: 1 attacks, adds die, the game keeps the keyboard, and the dive and wave calls name the right side (Flex, Nov 15); see check H.
//   I. The mechanics play like the raid: her waves' halves on the floor, the venom beam, the egg ring warning, one call at a time, your coil's timer; see check I.
//   J. A raider's screen (Flex, Nov 15): your frame and your target's in the bottom stack, spell-icon buttons with keys, the target's health, boss-mod bars; see check J.
//   N. Boss-mod alerts (Flex, Nov 16): icon, a short order in big letters, the spell under it, a countdown, gold for you; see check N.
//   M. Sounds you can feel (Flex, Nov 16): waves, slams, the bubble, the sweep, landings, Vipers, her roar, and your attacks by role; see check M.
//   L. Main's playtest (Nov 15): bot carriers keep clear of you, melee reach the heart, calls clear on the game's clock, the small tails' measured fan; see L.
//   K. Every mechanic (Flex, Nov 15): adds stay until killed and the raid helps, Rawlings boil, slams and the sweep hit everyone, splash bursts both eggs; see check K.
//   O. Spot maps (Flex, Nov 16): Your egg and Your coil on the Plan's own maps, the spots where the Plan puts you and the game drops your egg, your role's spots
//      only, 🎲 Random and No egg in the same place on both tabs, every pick the job the game plays; see check O.
//   P. The release sweep (Nov 16): the Go-here arrow in time for the bubble at your walking speed, out of a coil that slams first, never on phase 2's shielded
//      egg, and the job line on your coil before a later bubble; see check P.
//   Q. The release check (Nov 16): phase 2's Go-here arrow stays off your small egg until its Warden is dead, also before the Wardens rise; see check Q.
//   R. The prompts audit (Nov 16): no clock times or second counts in what you read, the arrow round danger and only gone where the game counts you, words for
//      every dodge, the job line's order, which coil is yours, "Mechanic: ORDER" calls, wait then cross for her waves; see check R.
//   T. The review of the prompts fixes (Nov 16): the job line agrees with the arrow (Wait, now, Stay), NEXT never repeats NOW, calls keep their whole order, 12
//      words at most, one name per thing, and the checks R left out; see check T.
//   S. Mistakes on screen (Nov 16): no clock time and no second count in a mistake's float or on the death card, in any part; see check S.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src');

// (a stand-in for the page: every element, canvas and call answers with another stand-in, and reads as 0 in a sum)
function stub() {
  const f = function () { return stub(); };
  return new Proxy(f, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : k === Symbol.iterator ? function* () {} : stub()), set: () => true, apply: () => stub() });
}
// (the Plan's maps out of src/guides.js, in the file's order: what ulSvg draws the Plan's pages with, and the line that files the pages as Plan shows them.
//  In the site they share the game's scope; in Node the game runs without them (no ulSvg, so the setup keeps its job row) unless a check asks: load(H, pj, { maps: true }))
const MAP_BITS = ['POM_DEF', 'POM_MK', 'UL_RIM', 'UL_SOAK', 'UL_GC', 'UL_MKI', 'UL_CMK', 'UL_PAT', 'UL_VB', 'UL_EGGS', 'UL_CSP', 'ulSoaks', 'UL_PAGES', 'ulSvg', 'ulFester'];
function load(H, pj, o) {
  H = H || require('./site-helpers.js');
  const PJ = pj || fs.readFileSync(path.join(SRC, 'practice.js'), 'utf8'), GJ = fs.readFileSync(path.join(SRC, 'guides.js'), 'utf8');
  const fromGuides = ['GDZ_ROLE', 'GDZ_RAID', 'gdzName', 'UX', 'UX_MEL', 'UX_HOME', 'UX_ZONE', 'UL_EDGE', 'UL_FB'].map((n) => H.grab(n, GJ)).join('\n') +
    (o && o.maps ? '\n' + MAP_BITS.map((n) => H.grab(n, GJ)).join('\n') + '\n' + ((/^UL_PAGES\.burst = [^\n]*/m.exec(GJ) || [''])[0]) : '');
  const win = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
  class Img { constructor() { this.complete = false; this.naturalWidth = 0; } }
  const ctx = vm.createContext({ document: stub(), window: win, navigator: stub(), performance, Image: Img, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, localStorage: stub(), E: { CLASSES: {} }, console });
  vm.runInContext(H.grab('esc') + '\n' + fromGuides + '\n' + PJ + '\nthis.pgUlScript = pgUlScript; this.PG_UL = PG_UL; this.UX_ZONE = UX_ZONE; this.UL_EDGE = UL_EDGE;', ctx);
  vm.runInContext('pgOpen(null, "Ula\'tek", "m")', ctx);
  return { dbg: win.__pgDbg, script: ctx.pgUlScript, PG_UL: ctx.PG_UL, PJ, ctx };
}

function checks(H, say, pj) {
  const bad = (t) => say("Ula'tek practice game", 'game', t), clk = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') + (Math.abs(s - Math.round(s)) > 0.05 ? '.' + Math.round((s % 1) * 10) : ''), near = (a, b) => Math.abs(a - b) <= 0.5;
  let G0; try { G0 = load(H, pj); } catch (e) { bad('the game would not run in the test (' + e.message + ')'); return; }
  const { dbg, script, PG_UL, PJ } = G0, hyp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  // A. the clock
  const S = script({ seed: 3, east: false }), want = (what, got, exp) => { if (got.length !== exp.length || got.some((v, i) => !near(v, exp[i]))) bad(what + ' at ' + got.map(clk).join(', ') + '; the measured clock has ' + exp.map(clk).join(', ') + ' (check A)'); };
  want('the eggs are called', S.eggSets.map((e) => e.cast), [1, 71]);
  want('the Wretches land', S.wretches.map((w) => w.land), [3, 72]); want('the Wretches wake', S.wretches.map((w) => w.awake), [23, 92]);
  want('the venom beams\' impacts are', S.beams.flatMap((b) => b.hits || [b.t0]), [15, 16, 17, 18, 19, 84, 85, 86, 87, 88]);
  want('the beams\' waves leave', [...new Set(S.waves.filter((w) => w.kind === 'incub').map((w) => w.t0))], [15, 16, 17, 18, 19, 84, 85, 86, 87, 88]);
  want('Mother\'s Wrath bites', S.wrath.map((w) => w.at), [27, 97]); want('the bubbles go off', S.bubbles.map((b) => b.at), [39, 70, 108, 140]);
  want('the coils slam', S.soaks.map((q) => q.at), [40, 43, 134, 137]); want('Mephitic Thrash lands', S.thrash.map((q) => q.at), [49, 106]);
  want('her waves start', [...new Set(S.waves.filter((w) => w.kind === 'her').map((w) => w.t0))].filter((t, i, a) => !a.some((u) => u < t && t - u < 7)), [56, 113]);
  want('she dives', [S.dive.t0], [77]);
  if (/1:14|2:22/.test(PJ)) bad('the start card names bubbles at 1:14 or 2:22 (check A; since the prompts audit, Nov 16, it names no clock times at all: check R0)');
  // B. the sides
  const runs = Array.from({ length: 40 }, (_, i) => script({ seed: i + 1 })), tE = runs.filter((r) => r.tailEast).length, f0 = runs.filter((r) => r.first && r.first[0]).length, f1 = runs.filter((r) => r.first && r.first[1]).length;
  if (tE < 10 || tE > 30) bad('her tail rose east in ' + tE + ' of 40 runs; it should be west or east about evenly (check B)');
  if (f0 < 10 || f0 > 30 || f1 < 10 || f1 > 30) bad('the same coil comes first nearly every run (set 1: the other one in ' + f0 + ' of 40, set 2: ' + f1 + '); either can appear first (check B)');
  if (JSON.stringify(script({ seed: 9 }).soaks.map((q) => [q.x, q.y])) !== JSON.stringify(script({ seed: 9 }).soaks.map((q) => [q.x, q.y]))) bad('the same seed gives a different run, so a run can\'t be replayed (check B)');
  for (const r of runs) { const tl1 = r.thrash[0], tl2 = r.thrash[1], c = r.soaks;
    if (Math.abs(tl1.y) > 5 || Math.abs(Math.abs(tl1.x) - 41) > 2 || (tl1.x > 0) !== !!r.tailEast) { bad('in set 1 her tail is at ' + tl1.x.toFixed(0) + ', ' + tl1.y.toFixed(0) + ', not on the west or east edge (seed ' + r.seed + ', check B)'); break; }
    if (tl2.y > -35 || Math.abs(tl2.x) > 5) { bad('in set 2 her tail is at ' + tl2.x.toFixed(0) + ', ' + tl2.y.toFixed(0) + ', not south after her turn (seed ' + r.seed + ', check B)'); break; }
    if (c.some((q) => hyp([q.x, q.y], q.set ? [tl2.x, tl2.y] : [tl1.x, tl1.y]) > 22)) { bad('a coil rises away from her tail (seed ' + r.seed + ', check B)'); break; }
    if (hyp(r.bubbles[0].p, [c[0].x, c[0].y]) > 7) { bad('the first bubble isn\'t on the first coil\'s circle (seed ' + r.seed + ', check B)'); break; }
    if (c[0].t0 >= c[1].t0) { bad('the first coil doesn\'t appear before the second (check B)'); break; } }
  if (/the first slam, 0:41|the second slam, 0:44/.test(PJ) || !/first coil to appear/.test(PJ)) bad('the start card names a coil by its slam order and time, not "the first coil to appear" (check B)');
  // C. the tanks and the second Wretch (script)
  const [b1, b2] = S.beams;
  if (!b1 || !b2 || b1.tank !== 't2' || b2.tank !== 't1') bad('the beams go to ' + (b1 && b1.tank) + ' and ' + (b2 && b2.tank) + '; the off tank takes the first, the tank who took the first Mother\'s Wrath the second (check C)');
  else if (!S.wrath[0] || S.wrath[0].tank !== b2.tank || S.herTank(S.dive.surf) !== b1.tank) bad('the tank who took the first Mother\'s Wrath doesn\'t soak the second beam, or the other tank doesn\'t have her after the dive (check C)');
  // (played: two runs with different sides; the bots' audit, the beam's tank at each impact, the new tail, and the second Wretch at 1:48 with the raid on it)
  const SERIOUS = /off their soak|soaked both|outside the bubble|in the tail's sweep|in her reach|beam tank|her tank|two carriers|under a landing egg|off the platform/;
  for (const [east, seed, more] of [[false, 3, { tailEast: true, first: [true, false] }], [true, 5, { tailEast: false, first: [false, true] }]]) {
    const tag = ' (she surfaces ' + (east ? 'east' : 'west') + ', tail ' + (more.tailEast ? 'east' : 'west') + ' in set 1)';
    let a; try { a = dbg.audit(east, seed, more); } catch (e) { bad('the bots\' audit crashed' + tag + ': ' + e.message); continue; }
    a.filter((x) => SERIOUS.test(x)).forEach((x) => bad('a bot slips: ' + x + tag + ' (check C)'));
    try { dbg.at(83.9, 'r4', { east, seed, ...more }); } catch (e) { bad('the game crashed playing to 1:24' + tag + ': ' + e.message); continue; }
    const Sx = dbg.S, G = dbg.G, B2 = Sx.beams[1]; let thrashIn = null, w108 = null;
    while (G.t < 108.2) { const t0 = G.t; dbg.step(1); const t = G.t, cr = (x) => x > t0 && x <= t;
      (B2.hits || []).forEach((h) => { if (cr(h)) { const tk = G.bots[B2.tank]; if (!tk || hyp([tk.x, tk.y], B2.at) > 3) bad('the second beam\'s impact at ' + clk(h) + ' missed its tank' + tag + ' (check C)'); Object.keys(G.bots).filter((id) => id !== B2.tank && id !== 'r4').forEach((id) => { if (hyp([G.bots[id].x, G.bots[id].y], B2.at) < 2) bad(id + ' stood in the second beam at ' + clk(h) + tag + ' (check C)'); }); } });
      if (cr(106)) { const w = G.wr.w2; if (w) thrashIn = Object.values(G.bots).filter((b) => b.id !== 'r4' && hyp([b.x, b.y], [w.x, w.y]) <= 10).length + (hyp([G.x, G.y], [w.x, w.y]) <= 10 ? 1 : 0); }
      if (cr(108)) w108 = G.wr.w2 ? [G.wr.w2.x, G.wr.w2.y] : null;
      if (cr(100)) { const tl = (Sx.FT || Sx.F)(PG_UL.tail, t), t1 = G.bots[B2.tank] || G.bots.t1; if (hyp([t1.x, t1.y], tl) > 12) bad('the tank who soaked the second beam is ' + hyp([t1.x, t1.y], tl).toFixed(0) + ' yards from the new tail at 1:40' + tag + ' (check C)'); } }
    if (!w108) { bad('the second Wretch isn\'t up at 1:48' + tag + ' (check C)'); continue; }
    const dHer = hyp(w108, Sx.dive.to), dTail = hyp(w108, (Sx.FT || Sx.F)(PG_UL.tail, 108));
    if (dHer < 17 || dHer > 22 || dTail < 46 || dTail > 53) bad('at 1:48 the second Wretch is ' + dHer.toFixed(0) + ' yards from her and ' + dTail.toFixed(0) + ' from the new tail; top kills hold it 17 to 22 from her, 46 to 53 from the tail' + tag + ' (check C)');
    if (!(thrashIn >= 17)) bad('only ' + thrashIn + ' raiders are in the second Wretch\'s bubble as the Thrash lands at 1:46; top kills have 17 to 20' + tag + ' (check C)');
  }
  // D. Your own job, without a team plan (Nov 15, Flex: "letting the player pick their assignment", then "its a bit overkill"): three rows, your role,
  //    your egg area and one coil team. Your egg area picks your place, your team holds (an egg carrier soaks with their egg zone's team in both sets,
  //    the plan's Egg Clear map (Flex, Nov 16: "it should be 4 and 4"); before, every carrier took the first coil in set 1), both teams stay even, your bubble spot is picked for you, and the run plays that job clean. (Before: three tabs, two maps and
  //    numbered bubble spots; before that, only three fixed jobs.)
  if (!Object.getOwnPropertyDescriptor(dbg, 'myJob') || typeof dbg.jobSlot !== 'function' || typeof dbg.panel !== 'function') { bad('there is no way to pick your own job without a team plan (check D)'); return; }
  const sizes = (S2) => [0, 1].map((st) => S2.soaks.filter((q) => q.set === st).map((q) => q.group.length).join('/')).join(' and '), base = sizes(script({ seed: 3, east: false }));
  try {
    // (Flex via Main, Nov 15: "fix the setup menus in the game ... They are still too complex and confusing": two rows now, your role and your job, one
    //  sentence, one big Play; the old three rows (role, egg area, coil team) with a map and a coil picture are gone)
    const P = dbg.panel(), rows = (P.match(/class="pg-srow"/g) || []).length, rt = (P.match(/data-sr="/g) || []).length, jt = (P.match(/data-sj="/g) || []).length;
    if (rows !== 2 || rt !== 3 || jt !== 3 || /data-j[rec]=|<details|<svg/.test(P) || !/class="pg-say"/.test(P)) bad('the setup isn\'t two rows (three roles, three jobs) and one sentence: ' + rows + ' rows, ' + rt + ' roles, ' + jt + ' jobs' + (/data-j[rec]=/.test(P) ? ', the old three-row picker' : '') + (/<details|<svg/.test(P) ? ', a fold or a picture' : '') + ' (check D)');
    { const SU = dbg.setupApi && dbg.setupApi(); if (!SU) bad('the card has no setup for the part (check D)');
      else { SU.set('h', 'c2'); const a = SU.now(); if (a.role !== 'h' || a.job !== 'c2' || dbg.myJob.egg !== null || dbg.myJob.soak[1] !== 2) bad('picking Healer, Second coil gives ' + JSON.stringify(a) + ' and ' + JSON.stringify(dbg.myJob) + ' (check D)');
        SU.set('m', 'egg'); if (dbg.myJob.egg !== 'm1' || dbg.myJob.soak[0] !== 1 || SU.now().job !== 'egg') bad('picking Melee, Egg carrier doesn\'t give the egg by her on the first coil: ' + JSON.stringify(dbg.myJob) + ' (check D)');
        if (!/It lands by her/.test(dbg.panel())) bad('the sentence for a melee egg carrier doesn\'t say where the egg lands (check D)'); } }
    dbg.myJob = { role: 'h', egg: 'm2', soak: [2, 2], fb: [0, 0] }; if (dbg.jobSlot() !== 'm2') bad('picking the egg area by her puts you in ' + dbg.jobSlot() + ', not a carrier\'s place there (check D)');
    const r = dbg.sim('m2', true, false, 3), S2 = dbg.S, team = (st) => S2.soaks.filter((q) => q.set === st && q.group.includes('m2')).map((q) => q.k + 1).join(',');
    if (team(0) !== '1' || team(1) !== '1') bad('the egg carrier by her (m2) plays as team ' + (team(0) || 'none') + ', then ' + (team(1) || 'none') + '; a carrier soaks with their egg zone\'s team in both sets, and by her is Right Soak #1 (the plan\'s Egg Clear map) (check D)');
    if (sizes(S2) !== base) bad('picking a coil team leaves the teams at ' + sizes(S2) + ' instead of ' + base + ' (check D)');
    r.log.filter((x) => /missed your coil soak|Soul Constrictor|Fester Burst/.test(x)).forEach((x) => bad('the picked job, played by the autopilot: ' + x + ' (check D)'));
    if (!/picked for you/.test(dbg.asg('m2'))) bad('the start card doesn\'t say your bubble spot is picked for you (check D)');
    // (the review, Nov 15: a carrier going from the bubble to the coil that slams a second later hurries; it walked, missed the 0:40 coil and carried two eggs)
    dbg.at(39.15, 'm2', { east: false, seed: 3, tailEast: false, first: [false, false] }); const k1 = dbg.S.soaks.find((q) => q.set === 0 && q.k === 0);
    const slow = k1.group.filter((id) => id !== 'm2').map((id) => ({ id, j: dbg.job(id), b: dbg.G.bots[id] })).filter((o) => hyp(o.j.T, [o.b.x, o.b.y]) > 1.5 && !o.j.fast);
    if (slow.length) bad(slow.map((o) => o.id).join(', ') + ' walk from the 0:39 bubble to the coil that slams at 0:40; they should hurry (check D)');
    dbg.myJob = { role: 'r', egg: null, soak: [2, 2], fb: [0, 0] }; const slot = dbg.jobSlot(); dbg.sim(slot, false, false, 3); const S4 = dbg.S;
    if (slot !== 'r7' || !S4.soaks.every((q) => (q.k === 1) === q.group.includes(slot))) bad('a ranged job with no egg on coil team 2 plays as ' + slot + ' on other teams (check D)');
    // (Flex, Nov 15: "pressing these doesnt change the image": what the card shows follows your coil; since the one-screen setup it's the sentence)
    if (!/You soak the second coil to appear/.test(dbg.panel())) bad('picking the second coil does not change the sentence on the setup (check D)');
    dbg.myJob = { role: 'r', egg: null, soak: [1, 1], fb: [0, 0] }; if (!/You soak the first coil to appear/.test(dbg.panel())) bad('picking the first coil does not change the sentence on the setup (check D)');
    // (Main, Nov 15: the job line read "coil team 1, then 1": one team says it once, two say "then team 2")
    if (/then 1$|, then 1\b/.test(dbg.jobRole().job) || !/coil team 1$/.test(dbg.jobRole().job)) bad('the job line reads "' + dbg.jobRole().job + '"; with one team it should end "coil team 1" (check D)');
    dbg.myJob = { role: 'r', egg: 'r6', soak: [1, 1], fb: [0, 0] }; if (!/coil team 2$/.test(dbg.jobRole().job)) bad('the right inner egg carrier reads "' + dbg.jobRole().job + '"; it should end "coil team 2": the right zone\'s carriers are Left Soak #2 in both sets, whatever they pick (the plan\'s Egg Clear map, Nov 16) (check D)');
  } catch (e) { bad('the picked job crashed the game: ' + e.message + ' (check D)'); }
  finally { dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; }
  // E. Hints (Nov 15, Flex: "maybe having some warnings on screen of whats coming next to help the player a bit"): the next things for you with their
  //    time, and an arrow to where your job wants you (into the bubble when it's due), gone when hints are off. (Before: only the general timers.)
  if (typeof dbg.hint !== 'function' || typeof dbg.upNext !== 'function') { bad('the game shows no hints of what\'s coming next for you (check E)'); return; }
  try {
    dbg.at(35.5, 'r3', { east: false, seed: 3 }); const up = dbg.upNext() || [], b1 = dbg.S.bubbles[0];
    if (!up.some((u) => /Wretch's bubble/.test(u.text) && Math.abs(u.at - b1.at) < 0.1) || !up.some((u) => /Your coil/.test(u.text))) bad('at 0:35 the "coming up" line reads ' + JSON.stringify(up.map((u) => u.text)) + '; it should name the bubble at 0:39 and your coil (check E)');
    if (up.length > 3) bad('the "coming up" line lists ' + up.length + ' things; three at most, or it clutters (check E)');
    dbg.pos = [25, -20]; const h = dbg.hint();
    if (!h || !(h.d > 2.5) || hyp(h.fin || h.T, b1.p) > 10.5) bad('far from the bubble at 0:35, the hint arrow ' + (h ? 'points ' + hyp(h.fin || h.T, b1.p).toFixed(0) + ' yards from the bubble' : 'isn\'t there') + ' (check E)');
    dbg.hints = false; if (dbg.hint()) bad('with hints off, the arrow still shows (check E)'); dbg.hints = true;
    // (Flex, Nov 15: "the move here thing should only be for specific mechanics ... where to stand for things like soaks, not how to dodge waves")
    dbg.at(58, 'r3', { east: false, seed: 3 }); dbg.pos = [20, -20]; const hw = dbg.hint(); if (hw) bad('during her waves at 0:58 the "Go here" arrow shows (' + hw.what + '); it is only for where to stand: soaks, bubbles, your egg (check E)');
    if (!/if \(j\.ob\) \{ T = spotIn\(j\.ob, me\) \|\| j\.ob\.p\.slice\(\); what = 'spot'; \} else if \(eg\)/.test(PJ) || /dodge\(b, j\.T, t, j\.fast, j\.ob\)/.test(PJ)) bad('the "Go here" arrow still follows dodges, not only where to stand (check E)');
  } catch (e) { bad('the hints crashed the game: ' + e.message + ' (check E)'); }
  finally { try { dbg.hints = true; } catch (e) { /* (no hints) */ } }
  // F. The start card, tidy (Nov 15, Flex: "can you improve the setup screens. Still a little convoluted"): your job, your job in short (four lines at
  //    most), then Start; the fight's rundown and the options folded away, one click from it, never gone. (Before: a nine-item list, speed, hints,
  //    start time and the keys all open at once.)
  if (typeof dbg.short !== 'function') { bad('the start card has no "your job in short" (check F)'); return; }
  const shortLines = (x) => (String(x).match(/<li>/g) || []).length, sh = dbg.short('r3'), shNo = dbg.short('r7');
  if (shortLines(sh) < 3 || shortLines(sh) > 4 || !/egg/.test(sh) || !/Coil team/.test(sh) || !/bubble/.test(sh)) bad('"your job in short" for an egg carrier has ' + shortLines(sh) + ' lines and should say the egg, the coil team and the bubble in three or four (check F)');
  if (!/No egg/.test(shNo)) bad('"your job in short" for a raider with no egg doesn\'t say so (check F)');
  // (Flex via Main, Nov 15: "still too complex and confusing": one screen, no folding: the part, your role, your job, one sentence, one big Play that says
  //  what you'll play and is ready at once ("just play"), then hints, speed and where to start as three small chips, then the keys)
  if (/<details class="pg-(more|opts)"/.test(PJ)) bad('the setup still folds things away ("What happens in the fight" or "Options"); it is one screen now (check F)');
  if (!/class="pg-btn pg-go pg-play"><b>▶ Play<\/b><span class="pg-psub">' \+ esc\(playSub\(\)\)/.test(PJ)) bad('the setup has no big Play button that says what you\'ll play (check F)');
  if (!/class="pg-chip pg-hint"/.test(PJ) || !/class="pg-chip pg-spd"/.test(PJ) || !/class="pg-chip pg-atw">Start <select class="pg-at"/.test(PJ)) bad('hints, speed and where to start aren\'t three small chips under Play (check F)');
  if (!/const SETUP = P2 \? P2\.setup \|\| null : \{/.test(PJ)) bad('a later part can\'t give the card its own setup (P2.setup) (check F)');
  // (the intermission chat, Nov 15: its part has no kick, but the keys line said "E: kick" for every later part)
  if (!/\(P2 && P2\.acts && P2\.acts\(\) \? ' · E: kick' : ''\)/.test(PJ)) bad('the keys line says "E: kick" for a part with no Kick button (check F)');
  // G. Hitting the right thing (Nov 15, Flex: "include dps mechanics ... very simplified version", "just let the player get the idea of what they need to do
  //    and when"): the Rawlings after each coil soak, the heart while it's open, a Viper the moment it hatches; Tab or a click picks a target; a moment spent
  //    mostly on the right thing counts, a miss is one line in the report. (Before: nothing to hit.)
  if (typeof dbg.dpsList !== 'function' || typeof dbg.tgts !== 'function') { bad('the game has nothing to hit: no damage moments (check G)'); return; }
  try {
    dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] };
    const r1 = dbg.sim('r3', true, false, 3), kinds = dbg.dpsList().map((m) => m.kind);
    if (!kinds.includes('rawling') || !kinds.includes('heart')) bad('a full run had the damage moments ' + JSON.stringify(kinds) + '; it should have the Rawlings after the coils and the heart (check G)');
    r1.log.filter((x) => /were up:|was open:|was up:/.test(x)).forEach((x) => bad('the autopilot, on the right target, still got: ' + x + ' (check G)'));
    dbg.at(146, 'r3', { east: false, seed: 3 }); const h = dbg.tgts().find((o) => o.key === 'heart');
    if (!h) bad('the heart is not a target while it is open at 2:26 (check G)');
    else { dbg.tgt = 'heart'; const v = dbg.dps(); if (!v || v.cat !== 'heart' || !v.right.some((o) => o.key === 'heart') || !v.cur || v.cur.key !== 'heart') bad('at 2:26 the game does not show the heart as the right thing to hit, or picking it does not stick (check G)'); }
    // (a raider who stays on Ula'tek through the heart burn gets one line for it)
    dbg.tgt = 'boss'; const n0 = dbg.G.log.length; dbg.stepOwn(Math.ceil((dbg.S.end - dbg.G.t) / 0.05) + 1);
    if (!dbg.G.log.slice(n0).some((m) => m.kind === 'dps' && /^The heart was open: you were on it \d+% of the time\.$/.test(m.text))) bad('a raider who stays on Ula\'tek through the heart burn gets no line for the heart (check G)');
    if (!/Tab: target/.test(PJ)) bad('the keys line does not say Tab picks a target (check G)');
    // (Flex, Nov 15: "Wheres the damage button i dont see it": a Target button on the action bar, clickable, gold when something needs hitting)
    if (!/class="pg-act pg-tab" data-a="tgt"/.test(PJ) || !/tb\.onclick = \(\) => \{ if \(G && !paused\) cycleTgt\(\); \}/.test(PJ) || !/tb\.classList\.toggle\('hot', hot\)/.test(PJ)) bad('there is no Target button on the action bar that picks a target and glows when something needs hitting (check G)');
  } catch (e) { bad('the damage moments crashed the game: ' + e.message + ' (check G)'); }
  // H. Attacking you can see (Nov 15, Flex: "ok but how do you do damage...?", "there needs to be a clear instruction thats how you attack", "pressing 1
  //    closes the game"): 1 attacks (picking the right target first if you have none), Rawlings die when you finish them, your hits on the heart count,
  //    the game tells you once how to attack, and the site's own keys never see the game's (1 switched the guide to Heroic and closed it). Also the
  //    wrong-way calls the review found: she surfaces where the run says, and after the dive her waves name the half they really come down first.
  if (typeof dbg.atk !== 'function') { bad('there is no way to attack: no 1 · Attack (check H)'); return; }
  try {
    if (!/document\.addEventListener\('keydown', kd, true\)/.test(PJ) || !/e\.stopPropagation\(\); if \(\/\^\[0-9\]\$\/\.test\(e\.key\)/.test(PJ)) bad('the game doesn\'t keep the keyboard while it is open: the site\'s number keys can still switch pages and close it (check H)');
    if (!/e\.code === 'Digit1' \|\| e\.code === 'Numpad1'\)\) \{ e\.preventDefault\(\); atkKey\(\)/.test(PJ) || !/class="pg-act pg-atk" data-a="atk"/.test(PJ) || !/Tab: target · 1: attack/.test(PJ)) bad('1 isn\'t the attack key, or there is no 1 · Attack button, or the keys line doesn\'t say so (check H)');
    dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; dbg.at(40.6, 'r3', { east: false, seed: 3 }); dbg.tgt = null; dbg.G.gcd0 = null; dbg.G.taught = false; /* (the autopilot's last press cools down first) */
    const raw0 = dbg.G.adds.filter((a) => a.kind === 'rawling').length, on = dbg.atk(), picked = dbg.tgt, k0 = dbg.G.kills || 0;
    if (!raw0) bad('no Rawlings are up at 0:40.6 after the first coil slam, so there is nothing to attack (check H)');
    else if (!on || !picked || !/^a\d+$/.test(picked)) bad('pressing 1 with nothing picked doesn\'t pick a Rawling and attack it (check H)');
    else { const h1 = dbg.G.hits || 0; dbg.atk(); if ((dbg.G.hits || 0) !== h1) bad('pressing 1 twice at once hits twice: each press is one hit with a 1 s cooldown, like a spell (check H)');
      for (let i = 0; i < 8; i++) { dbg.stepOwn(21); dbg.atk(); } /* (Flex: "like you keep pressing it") */
      if (!((dbg.G.kills || 0) > k0) || dbg.G.adds.some((a) => a.id === picked)) bad('pressing 1 eight times on a Rawling doesn\'t kill it (check H)'); else if (raw0 > 1 && (dbg.G.kills || 0) - k0 < 2) bad('after killing a Rawling the next press doesn\'t move on to the next one (check H)'); if (!dbg.G.taught) bad('the game never says how to attack when the first Rawlings come (check H)'); }
    dbg.at(147, 'r3', { east: false, seed: 3 }); dbg.tgt = 'heart'; dbg.G.gcd0 = null; dbg.G.heartHits = 0; for (let i = 0; i < 6; i++) { dbg.atk(); dbg.stepOwn(21); }
    if (!(dbg.G.heartHits >= 6)) bad('pressing 1 six times a second apart on the heart gave ' + dbg.G.heartHits + ' hits; each ready press should hit (check H)');
    const runs = Array.from({ length: 12 }, (_, i) => script({ seed: i + 21 }));
    for (const r of runs) { const sw = r.warns.find((w) => /surfaces/.test(w.text)); if (!sw || Math.abs(sw.t - r.dive.surf) > 0.05 || !/where the bubbles were/.test(sw.text) || /\b(east|west|north|south)\b/i.test(sw.text)) { bad('the call as she surfaces reads "' + (sw && sw.text) + '"; it should point at the bubbles, with no compass word (the prompts audit, Nov 16; seed ' + r.seed + ', check H)'); break; }
      const wg = r.wings[1], hw = r.waves.filter((w) => w.kind === 'her' && Math.abs(w.t0 - (wg.t + 6)) < 0.1), ax = hw.reduce((a, w) => a + w.x, 0) / hw.length - r.dive.to[0], ay = hw.reduce((a, w) => a + w.y, 0) / hw.length - r.dive.to[1], real = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? 'WEST' : 'EAST') : (ay < 0 ? 'SOUTH' : 'NORTH');
      if (wg.first !== real) { bad('after the dive her first waves come down the ' + real + ' half but the call says ' + wg.first + ' (seed ' + r.seed + ', check H)'); break; } }
  } catch (e) { bad('attacking crashed the game: ' + e.message + ' (check H)'); }
  // I. The mechanics play like the raid (Nov 15, the improvement pass Flex said yes to): her waves light the half hit first red and the safe half green, then
  //    swap; the venom beam gets a call, a timer and red lanes before its side waves, and standing in it is your mistake (Wolfthorn's pull 1); your egg ring
  //    warns before another carrier touches it (pulls 9, 12, 13); calls that land together share one line; at 1:41 the call says run to the second Wretch
  //    (pulls 7, 8, 10); the timers show only your coil.
  if (typeof dbg.halves !== 'function' || typeof dbg.eggWarn !== 'function') { bad('the improvement pass is missing: no floor halves for her waves, no egg ring warning (check I)'); return; }
  try {
    dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; dbg.at(52, 'r3', { east: false, seed: 3 }); const h1 = dbg.halves();
    if (!h1 || h1.red !== 1 || h1.first !== dbg.S.wings[0].first) bad('while she pulls her wing back at 0:52 the floor doesn\'t light the half hit first (check I)');
    dbg.stepOwn(200); const h2 = dbg.halves(); if (!h2 || !h2.swap || h2.red !== -1) bad('after her first wave has gone by, the floor doesn\'t swap to "cross behind it" (check I)');
    if (!/const hv = A\.halves \? A\.halves\(\) : null; if \(hv\)/.test(fs.readFileSync(path.join(SRC, 'practice3d.js'), 'utf8'))) bad('the 3D view doesn\'t light the halves of the floor for her waves (check I)');
    const S0 = script({ seed: 3, east: false }), inc = S0.waves.filter((w) => w.kind === 'incub');
    if (!inc.length || inc.some((w) => !(w.warn > 0))) bad('the venom beam\'s side waves come with no red lane before them (check I)');
    if (!S0.warns.some((w) => /Venom beam/.test(w.text) && Math.abs(w.t - 13) < 0.1) || !S0.timers.some((q) => q.name === 'Venom beam' && Math.abs(q.t - 15) < 0.1)) bad('the venom beam at 0:15 has no call and no timer (check I)');
    dbg.at(15.2, 'r3', { east: false, seed: 3 }); { const bm = dbg.S.beams[0], tk = dbg.G.bots[bm.tank]; dbg.pos = [(bm.from[0] + tk.x) / 2, (bm.from[1] + tk.y) / 2]; } const n0 = dbg.G.log.length; dbg.stepOwn(6);
    if (!dbg.G.log.slice(n0).some((m) => /You stood in the venom beam/.test(m.text))) bad('standing in the venom beam, between the image and the off tank, is not a mistake (check I)');
    dbg.at(30, 'r3', { east: false, seed: 3 }); const other = dbg.G.eggs.find((e) => e.state === 'held' && e.who && e.who !== 'r3');
    if (!dbg.G.eggs.some((e) => e.who === 'r3' && e.state === 'held') || !other) bad('at 0:30 you or the other carriers hold no egg, so the ring warning can\'t be checked (check I)');
    // (Nov 15: Noxious Splash stays at 3 yards. A move to 4.3, read from where 21 logged splashes landed, was undone: the phase 3 chat's scan of all 170
    //  Mythic pulls found carriers 4 to 6 yards apart for about 80 minutes of pair time with no splash, and under 3 yards almost never. The 21 were the
    //  burst landing a moment after the touch, both still moving. Noxious Shell 1307612 is 3 yards)
    if (!/const b = G\.bots\[e\.who\]; if \(b && Math\.hypot\(x - b\.x, y - b\.y\) < 3\)/.test(PJ)) bad('Noxious Splash isn\'t at 3 yards (the 170-pull scan: carriers stand 4 to 6 yards apart safely) (check I)');
    else { const b = dbg.G.bots[other.who], lv = (d) => { b.x = dbg.G.x + d; b.y = dbg.G.y; return dbg.eggWarn(); }; if (lv(3.2) !== 2 || lv(4.5) !== 1 || lv(5.5) !== 1 || lv(9) !== 0) bad('your egg ring doesn\'t turn red within 3.5 yards of another carrier, orange within 6 and clear beyond (check I; orange from 6 since the prompts audit, Nov 16)'); }
    if (!S0.warns.some((w) => /run to the Wretch in front of her/i.test(w.text) && Math.abs(w.t - 101) < 0.1)) bad('at 1:41 there is no call to run to the second Wretch in front of her (check I)');
    if (!/calls that come within 1\.5 s of each other share one line/.test(PJ)) bad('calls that land together still cover each other (check I)');
    dbg.at(125, 'r3', { east: false, seed: 3 }); const th = (dbg.timers ? dbg.timers() : []).join(' | '); if (!/Your coil/.test(th) || /Coil slam/.test(th)) bad('the timers at 2:05 read "' + th + '": they should show only your coil, as "Your coil" (check I)');
  } catch (e) { bad('the improvement pass crashed the game: ' + e.message + ' (check I)'); }
  // J. A raider's screen (Nov 15, Flex: "the UI needs to look more like what a wow raider UI would look like. Player healthbar and target bar in the middle,
  //    hotbars with spells on them for the attack/sprint/defensive. Boss mods. Etc." and "theres also no healthbar for the target"): your frame and your
  //    target's side by side in the bottom stack, between your job and the action bar, her cast bar under the target; each button a spell icon (the attack's
  //    is your role's) with its key; the target frame shows the target's health (an add's drops as you hit it and the bar flashes; Ula'tek, her tail and a
  //    Wretch their own) and says "No target" and "Out of range"; the boss mods are one list of bars, five at most, soonest first, the same thing once; the
  //    Mistakes counter is off the action bar, by the clock under the minimap. (Before: your frame top left, no target health, text buttons, "coming up"
  //    chips in the job box, Mistakes a button on the bar, the minimap top left.)
  if (typeof dbg.html !== 'function' || typeof dbg.tf !== 'function' || typeof dbg.mods !== 'function' || typeof dbg.deco !== 'function') { bad('the screen isn\'t laid out like a raider\'s UI: no target frame with its health, no boss-mod bars, no spell icons on the action bar (check J)'); return; }
  try {
    // (an element's inside, by one of its classes, counting its own tag's opens and closes)
    const part = (h, cls) => { if (h == null) return null; const m = new RegExp('<(\\w+)\\b[^>]*\\bclass="(?:[^"]*\\s)?' + cls + '(?:\\s[^"]*)?"[^>]*>').exec(h); if (!m) return null;
        const st = m.index + m[0].length, re = new RegExp('<(/?)' + m[1] + '\\b[^>]*>', 'g'); re.lastIndex = st; let dp = 1, q; while ((q = re.exec(h))) { if (q[1]) { if (--dp === 0) return h.slice(st, q.index); } else dp++; } return null; },
      at = (h, cls) => (h == null ? -1 : h.search(new RegExp('class="(?:[^"]*\\s)?' + cls + '(?:\\s[^"]*)?"'))), has = (h, cls) => at(h, cls) >= 0;
    const H0 = dbg.html(), bot = part(H0, 'pg-bot'), row = part(bot, 'pg-ufs'), acts = part(H0, 'pg-acts');
    if (!row || !has(row, 'pg-me') || !has(row, 'pg-tf') || at(row, 'pg-me') > at(row, 'pg-tf')) bad('your frame and your target\'s frame don\'t sit side by side in the bottom stack, yours on the left (check J)');
    if (!bot || !has(bot, 'pg-job') || !(at(bot, 'pg-job') < at(bot, 'pg-ufs') && at(bot, 'pg-ufs') < at(bot, 'pg-acts'))) bad('the bottom stack isn\'t your job, then the two frames, then the action bar (check J)');
    if (!has(part(row, 'pg-tfc'), 'pg-cast') || has(part(H0, 'pg-bossf'), 'pg-cast')) bad('her cast bar isn\'t under the target frame (check J)');
    if (!has(part(row, 'pg-me'), 'pg-hp') || !has(part(row, 'pg-me'), 'pg-debs') || !has(part(row, 'pg-tf'), 'pg-bar')) bad('your frame lost its health bar or debuffs, or the target frame has no health bar (check J)');
    const tr = part(H0, 'pg-tr'); if (!has(tr, 'pg-mini') || !has(tr, 'pg-vw') || !has(tr, 'pg-bossf') || !has(part(tr, 'pg-bossf'), 'pg-clk') || at(tr, 'pg-mini') > at(tr, 'pg-bossf')) bad('the minimap, the 2D | 3D switch and her boss frame (with the clock) aren\'t together top right, the minimap first (check J)');
    if (!acts || has(acts, 'pg-mis') || !has(tr, 'pg-mis') || !has(H0, 'pg-mc')) bad('the Mistakes counter is still on the action bar (or gone): it belongs top right by the clock (check J)');
    if (has(part(H0, 'pg-job'), 'pg-up')) bad('the "coming up" chips are still in the job box; the boss-mod bars show them now (check J)');
    // (every button: a spell icon by name and a key in its corner; phase 2's Kick gets its icon too)
    const want = { tgt: 'ability_hunter_markedfordeath', atk: 'spell_fire_firebolt02', sprint: 'ability_rogue_sprint', def: 'spell_holy_divineprotection' }, btn = [...String(acts).matchAll(/<div class="pg-act(?: [^"]*)?" data-a="(\w+)"[^>]*>([\s\S]*?)<\/div>/g)];
    if (Object.keys(want).some((a) => !btn.some((m) => m[1] === a))) bad('the action bar has ' + btn.map((m) => m[1]).join(', ') + '; it should have Target, Attack, Sprint and Defensive (check J)');
    btn.forEach(([, a, inner]) => { if (a === 'pause') { if (!inner.includes('<b>Space</b>')) bad('the Pause button has no Space in its corner (check J)'); return; } /* (Pause isn't a spell: its own drawn icon, Nov 17) */ const ic = (/<img class="pg-ai" data-ic="([a-z0-9_]+)"/.exec(inner) || [])[1], kb = (/<b>([^<]+)<\/b>/.exec(inner) || [])[1];
      if (!ic || (want[a] && ic !== want[a])) bad('the ' + a + ' button\'s spell icon is ' + (ic || 'missing') + (want[a] ? '; it should be ' + want[a] : '') + ' (check J)'); if (!kb) bad('the ' + a + ' button has no key in its corner (check J)'); });
    if (!/^<div class="pg-act" data-a="kick"><img class="pg-ai" data-ic="ability_kick" alt=""><b>E<\/b>/.test(dbg.deco('<div class="pg-act" data-a="kick"><b>E</b><span>Kick</span><i></i></div>'))) bad('phase 2\'s Kick button doesn\'t get its spell icon (check J)');
    if (!/typeof loadOfficial === 'function'/.test(PJ) || !/wow\.zamimg\.com\/images\/wow\/icons\/large\/' \+ n \+ '\.jpg', 'https:\/\/render\.worldofwarcraft\.com\/us\/icons\/56\//.test(PJ)) bad('the action bar\'s icons don\'t load with the site\'s loader, or without it from Wowhead with Blizzard\'s as backup (check J)');
    // (the attack's icon is your role's)
    dbg.myJob = { role: 'h', egg: null, soak: [1, 1], fb: [0, 0] }; dbg.at(20, dbg.jobSlot(), { east: false, seed: 3 }); if (dbg.atkIc !== 'spell_holy_searinglight') bad('a healer\'s Attack button shows ' + dbg.atkIc + ', not the healer\'s spell_holy_searinglight (check J)');
    dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; dbg.at(40.6, 'r3', { east: false, seed: 3 }); if (dbg.atkIc !== 'spell_fire_firebolt02') bad('a ranged Attack button shows ' + dbg.atkIc + ' after playing a healer, not spell_fire_firebolt02 (check J)');
    // (the target frame: nothing, an add hit twice, Ula'tek, her tail, a Wretch, out of range)
    dbg.tgt = null; const f0 = dbg.tf(); if (!f0 || !f0.none || f0.name !== 'No target') bad('with nothing targeted the target frame doesn\'t say "No target" (check J)');
    const add = dbg.tgts().filter((o) => o.max && o.hp >= 2)[0];
    if (!add) bad('no add with health to spare is up at 0:40.6 after the first coil, so the target frame can\'t be checked (check J)');
    else { dbg.pos = [add.p[0] + 3, add.p[1]]; dbg.tgt = add.key; dbg.G.gcd0 = null; const f1 = dbg.tf(), fl0 = dbg.tfFlash;
      if (!f1 || f1.none || f1.name !== add.name || Math.abs(f1.pct - add.hp / add.max * 100) > 0.5) bad('with ' + add.name + ' targeted the target frame reads ' + JSON.stringify(f1) + ' (check J)');
      dbg.atk(); const f2 = dbg.tf(); if (!f1 || !f2 || f2.name !== add.name || !(f2.pct < f1.pct - 1)) bad('hitting ' + add.name + ' doesn\'t drop its health on the target frame (' + (f1 && f1.pct) + '% to ' + (f2 && f2.pct) + '%) (check J)');
      if (!(dbg.tfFlash > fl0)) bad('a hit doesn\'t flash the target frame\'s bar (check J)'); }
    dbg.tgt = 'boss'; const fb = dbg.tf(); if (!fb || fb.name !== 'Ula\'tek' || fb.pct == null || Math.abs(fb.pct - dbg.G.bossHp) > 0.01) bad('with Ula\'tek targeted the target frame reads ' + JSON.stringify(fb) + ', not her ' + dbg.G.bossHp.toFixed(1) + '% (check J)');
    dbg.tgt = 'tail'; const ft = dbg.tf(); if (!ft || ft.name !== 'Gore Rattle' || ft.pct == null || Math.abs(ft.pct - dbg.G.bossHp) > 0.01) bad('with her tail targeted the target frame doesn\'t show her health (they are all her) (check J)');
    const wr = dbg.tgts().find((o) => o.kind === 'wretch'), w1 = dbg.S.wretches.find((w) => wr && w.id === wr.key);
    if (wr && w1) { dbg.tgt = wr.key; const fw = dbg.tf(), exp = (w1.dies - dbg.G.t) / (w1.dies - w1.awake) * 100; if (!fw || fw.pct == null || Math.abs(fw.pct - exp) > 0.5) bad('with the Wretch targeted the target frame reads ' + JSON.stringify(fw) + ', not its ' + exp.toFixed(0) + '% by the clock (check J)'); }
    dbg.tgt = 'boss'; dbg.pos = [0, -33]; const fr = dbg.tf(); if (!fr || fr.range !== false) bad('far from Ula\'tek the target frame doesn\'t say out of range (check J)'); if (!/'Out of range'/.test(PJ)) bad('the target frame never says "Out of range" (check J)');
    // (the boss mods: one list, five at most, soonest first, the same thing once, the hints only when hints are on)
    dbg.at(10, 'r3', { east: false, seed: 3 });
    for (const T of [10, 35.5, 52, 100, 125, 146]) { if (dbg.G.t < T) dbg.step(Math.round((T - dbg.G.t) / 0.05)); const M = dbg.mods() || [], tag = ' at ' + clk(dbg.G.t) + ' (check J)';
      if (!M.length) bad('there are no boss-mod bars' + tag); if (M.length > 5) bad('the boss mods show ' + M.length + ' bars; five at most' + tag);
      if (M.some((b, i) => i && b.at < M[i - 1].at)) bad('the boss-mod bars aren\'t soonest first: ' + M.map((b) => b.name + ' ' + clk(b.at)).join(', ') + tag);
      if (new Set(M.map((b) => b.name)).size !== M.length || M.some((b, i) => M.some((c, j) => j > i && b.sp && b.sp === c.sp && Math.abs(b.at - c.at) <= 1.5))) bad('the boss mods show the same thing twice: ' + M.map((b) => b.name + ' ' + clk(b.at)).join(', ') + tag);
      if (M.some((b) => !(b.left > 0) || !/^#[0-9a-f]{3,8}$/i.test(b.c))) bad('a boss-mod bar has no time left or no colour' + tag); }
    dbg.at(35.5, 'r3', { east: false, seed: 3 }); const M1 = dbg.mods() || [], bub = M1.find((b) => /Wretch's bubble/.test(b.name)), coil = M1.filter((b) => /coil/i.test(b.name) && Math.abs(b.at - 40) < 0.6);
    if (!bub || bub.sp !== 'Fester Burst') bad('at 0:35 the boss mods don\'t show the bubble with Fester Burst\'s icon: ' + M1.map((b) => b.name + ' (' + b.sp + ')').join(', ') + ' (check J)');
    if (coil.length !== 1 || coil[0].sp !== 'Spectral Coils') bad('at 0:35 your coil shows ' + coil.length + ' time(s) in the boss mods, or without Spectral Coils\' icon; once (check J)');
    dbg.hints = false; const M2 = dbg.mods() || []; dbg.hints = true;
    if (M2.some((b) => !(dbg.timers() || []).includes(b.name)) || !M2.some((b) => /^Your coil/.test(b.name)) || !M2.some((b) => b.name === "Wretch's bubble")) bad('with hints off the boss mods aren\'t the plain timers: ' + M2.map((b) => b.name).join(', ') + ' (check J)');
    // (review of the new screen, Nov 15, measured in Chrome with the site's own CSS: ".pg-me { align-items: flex-start }" (Home's "Which one is you?") made
    //  your frame only as wide as its words, 197 px next to the target's 250; body.refine's 4 px corners on every button and the Plan page's "#main .pg-bar"
    //  (in the site's defaultTheme layer, where only a rule in the same layer wins) rounded the close button, the 2D | 3D switch and every health bar; at
    //  740 px wide Mistakes stuck out 21 px past the 150 px minimap column; six debuffs ran 9 px into the Target button; the boss mods' built-in icons were rounded)
    { const SHt = (H || require('./site-helpers.js')).SH || '', rule = (sel) => ((new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{([^}]*)\\}').exec(PJ) || [])[1] || ''), uc = rule('.pg .pg-ucol');
      if (/(^|[\s}])\.pg-me \{[^}]*align-items/.test(SHt) && !/align-items: ?stretch/.test(uc)) bad('your frame\'s column doesn\'t say align-items: stretch, so the site\'s ".pg-me { align-items: flex-start }" shrinks your frame to its words (check J)');
      if (!/:is\(\.pg-x, \.pg-vw button, \.pg-bar\) \{ ?border-radius: ?0 !important/.test(PJ) || (/#main :is\([^)]*\.pg-bar\)[^{]*\{[^}]*border-radius/.test(SHt) && !/@layer defaultTheme \{ ?html body #main \.pg\.pg \.pg-in \.pg-bar \{ ?border-radius: ?0 !important/.test(PJ))) bad('the close button, the 2D | 3D switch or the health bars take the site\'s rounded corners (body.refine\'s buttons, the Plan page\'s "#main .pg-bar" in its defaultTheme layer): the screen keeps square edges (check J)');
      if (!/\.pg-tmi \.icw svg rect \{ ?rx: ?0/.test(PJ)) bad('the boss mods\' built-in icons keep their rounded corners until the real icon loads (check J)');
      if (!/flex-wrap: ?wrap/.test(rule('.pg .pg-trow'))) bad('the 2D | 3D switch and Mistakes don\'t wrap in the narrow minimap column: Mistakes sticks out past the minimap at 740 px wide (check J)');
      if (!/min-height: ?104px/.test(uc) || /(^|[^-])height: ?104px/.test(uc)) bad('your frame\'s column has a fixed height, so a long row of debuffs runs into the action bar instead of lifting the frames (check J)'); }
    // (Flex, Nov 15: "the health bars in p2 arent moving": a later part's targets carry no health, so the target frame sat full. It reads a part's hpFr and,
    //  for any add in G.adds, that add's own health)
    if (!/else if \(o\.hpFr != null\) pct = o\.hpFr \* 100; else if \(ad\) \{ const mx = ADD_HP\[ad\.kind\] \|\| 3; pct = Math\.max\(0, ad\.hp == null \? mx : ad\.hp\) \/ mx \* 100; \}/.test(PJ) || !/const ad = !o\.max && o\.hpFr == null \? G\.adds\.find\(\(q\) => q\.id === o\.key\) : null;/.test(PJ)) bad('the target frame can\'t show a later part\'s health (hpFr) or an add\'s own health when the part lists it without max: phase 2\'s bars never move (check J)');
    // (Main, Nov 15, phase 3 at 7:10 and 8:25 in 3D: four to six calls shared one line, ran to two lines and under the minimap and the boss frame. At most
    //  two show at once, the one about you first; the rest wait their turn, and one that waited 4 s is dropped (the boss-mod bars have it). The line stays
    //  between the bars on the left and the minimap column on the right)
    if (typeof dbg.warnsNow !== 'function') bad('the call line can\'t be checked (dbg.warnsNow) (check J)');
    else { dbg.at(30, 'r3'); const S0 = dbg.S, G0 = dbg.G, t = G0.t, six = ['Circling Prey: move one quarter left!', 'Fester Burst: into the Wretch\'s bubble!', 'Serpent\'s Bite: soakers in!', 'A gateway to the next quarter is up', 'Her waves: find the gap!', 'Your coil: soak it!'].map((text, i) => ({ t: t - 0.01, text, c: '#fff', i }));
      S0.warns.splice(G0.warnI, 0, ...six); G0.warnQ = []; G0.lastWarn = null; const L1 = dbg.warnsNow();
      if (!L1 || L1.n > 2) bad('six calls landing together show ' + (L1 ? L1.n : 0) + ' at once on the call line; two at most (check J)');
      else { if (!/^Your coil/.test(L1.all[0])) bad('with six calls at once, the one about you isn\'t first: "' + L1.all[0] + '" (check J)');
        const L2 = dbg.warnsNow(); if (L2.n > 2 || L2.all.join() !== L1.all.join()) bad('a full call line takes more calls straight away; the rest should wait their turn (check J)');
        dbg.stepOwn(48); const L3 = dbg.warnsNow(); if (!L3 || L3.all.join() === L1.all.join() || L3.n > 2) bad('2.4 s later the waiting calls don\'t get their turn (check J)');
        dbg.stepOwn(100); dbg.warnsNow(); if ((dbg.G.warnQ || []).some((w) => six.some((x) => x.text === w.text))) bad('a call that waited more than 4 s is still queued; it should drop (the boss-mod bars have it) (check J)'); } }
    { const wr = (/\.pg-warn \{([^}]*)\}/.exec(PJ) || [])[1] || ''; if (/left: ?0[;\s]/.test(wr) || !/left: ?\d{3}px/.test(wr) || !/right: ?\d{3}px/.test(wr)) bad('the call line spans the whole width, under the boss-mod bars and the minimap; it stays between them (check J)'); }
    // (review of the 3D attacks, Nov 15: "Start at 2:18" fast-forwards with the autopilot pressing 1, and its last hit was still in the air when the game
    //  began: a glowing bolt sat frozen at your hand through the 3-2-1, or a melee slash hung mid-swing. The jump clears the hits like everything else)
    if (typeof dbg.ff !== 'function') bad('no way to check the "Start at" jump (dbg.ff) (check J)');
    else for (const id of ['r1', 'm1', 'h1']) { dbg.at(130, id); dbg.ff(138.2); const fx = (dbg.dps() || {}).fx || []; if (fx.length) bad('after "Start at 2:18" as ' + id + ' ' + fx.length + ' hit(s) from the fast-forward are still in the air (check J)'); }
    // (Flex, Nov 15, playing the test copy: "If a viper spawns though it needs to be killed", "it shouldnt just vanish": a Viper left on its own 8 s after it
    //  hatched. It stays until it's killed, and its Petrifying Sting lands on you as it hatches (no healing on you while it lasts). Since Flex's "if a viper
    //  hatches the tank should taunt it and then the group kills it" (Nov 15) the off tank taunts it 2 s in: it stops stinging you, goes to the tank, and
    //  the raid wears it down there (tests/practice-shared.js C plays the taunt too))
    if (typeof dbg.hatchMine !== 'function') bad('a Viper still leaves on its own 8 s after it hatches; it should stay until you kill it (Flex, Nov 15) (check J)');
    else { dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; dbg.at(20, 'r3'); dbg.tgt = null; const vs = () => dbg.G.adds.filter((a) => a.kind === 'viper'), n0 = vs().length;
      if (!dbg.hatchMine()) bad('no egg of yours to hatch at 0:20, so the Viper can\'t be checked (check J)');
      else { dbg.stepOwn(60); const V = vs(), v = V[V.length - 1];
        if (V.length !== n0 + 1) bad('3 s after it hatched, the Viper is gone though nobody killed it (Flex: "it shouldnt just vanish") (check J)');
        else { if (!v.tank || v.tank === 'r3') bad('3 s after it hatched, no tank has taunted the Viper (Flex: "the tank should taunt it") (check J)');
          if (!(dbg.G.debs.sting && dbg.G.debs.sting.n >= 1)) bad('the Viper\'s Petrifying Sting doesn\'t land on you as it hatches (check J)');
          if (v.hp == null || v.hp >= 5) { dbg.stepOwn(120); if (vs().includes(v) && !(v.hp < 5)) bad('the taunted Viper\'s health doesn\'t go down: the raid should be killing it on the tank (check J)'); }
          const k = (dbg.tgts().find((o) => o.kind === 'viper') || {}).key; dbg.tgt = k; for (let i = 0; i < 8 && vs().length > n0; i++) { dbg.atk(); dbg.stepOwn(21); }
          if (vs().length > n0) bad('pressing 1 on the Viper doesn\'t kill it (check J)'); } } }
  } catch (e) { bad('the raider\'s screen crashed the game: ' + e.message + ' (check J)'); }
  finally { try { dbg.hints = true; dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; } catch (e) { /* (no job) */ } }
  // K. Every mechanic (Nov 15, Flex: "if this skips any part of the fight that requires mechanical execution its not good enough", "theres also add spawns
  //    being missed"): the mechanics audit (each gap checked twice against the guide's measured clocks and engine.js) found phase 1's adds leaving on their
  //    own, a splash bursting only your egg, slams and the tail's sweep hurting only the people in them, and more. Each line below names its gap.
  try {
    const K = (m) => bad(m + ' (check K)'); dbg.hints = true; dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] };
    // Rawlings stay until they die, the raid wears them down (before: gone 9 s after the soak, nobody hit them)
    dbg.at(44, 'r3'); const raw = () => dbg.G.adds.filter((a) => a.kind === 'rawling'), n0 = raw().length;
    if (!n0) K('no Rawlings are up at 0:44, after the first coil soaks');
    else { dbg.stepOwn(160); const n8 = raw().length; if (!n8) K('8 s on, every Rawling is gone; they stay until they are killed'); else if (n8 >= n0) K('the raid doesn\'t wear the Rawlings down (' + n0 + ' at 0:44, ' + n8 + ' 8 s later)'); }
    if (raw().some((a) => a.t1 != null)) K('a Rawling still has a time to leave on its own (t1)');
    // a Rawling alive 25 s boils: Acidic Expulsion on you, a boss-mod bar before it
    dbg.at(44, 'r3'); { const a = raw()[0]; if (a) { a.born = dbg.G.t - 20; const up = dbg.upNext() || []; if (!up.some((u) => u.text === 'Rawlings boil')) K('the boss mods don\'t warn "Rawlings boil" while a Rawling is up');
      a.born = dbg.G.t - 26; a.hp = 99; dbg.stepOwn(2); if (!a.boil) K('a Rawling alive 25 s doesn\'t boil (Boiling Venom)'); if (!dbg.log.some((x) => /boiled/.test(x))) K('a boiling Rawling isn\'t in the report'); } }
    // (phase 2 chat, Nov 15: a part that runs its own Rawlings from its own kills marks them own; the shared wear-down and boil leave them alone. Acidic
    //  Expulsion starts 35 s after a Rawling spawns, measured 35.3 to 35.6 s on the 30 fastest kills)
    { dbg.at(44, 'r3'); const o = { kind: 'rawling', x: dbg.G.x + 30, y: dbg.G.y, born: dbg.G.t - 30, hp: 3, own: true }; dbg.G.adds.push(o); dbg.stepOwn(20);
      if (o.boil || o.hp !== 3) K('the shared wear-down or boil touched a part\'s own Rawling (own: true)'); dbg.G.adds = dbg.G.adds.filter((a) => a !== o); }
    if (!/a\.boil && !a\.own && a\.born != null && G\.t - a\.born >= 35/.test(PJ)) K('a boiling Rawling\'s Acidic Expulsion doesn\'t wait for 35 s after it spawns, or counts a part\'s own Rawlings');
    // every coil slam hits the whole raid, smaller the more soak (before: only the soakers took it)
    { dbg.at(39.6, 'r7'); const g1 = dbg.S.soaks.find((q) => q.set === 0 && q.k === 0); if (g1 && !g1.group.includes('r7')) { dbg.pos = [g1.x + 25, g1.y]; const h0 = dbg.G.hp; dbg.stepOwn(10); if (!(dbg.G.hp < h0 - 3)) K('a raider outside the first coil takes nothing from its slam; every slam hits the whole raid'); } }
    // the tail's sweep hits everyone, with its DoT (before: only inside 35 yards)
    { const th = dbg.S.thrash[0]; dbg.at(th.at - 0.3, 'r7'); dbg.pos = [th.x + 50 * Math.sign(th.x || 1), th.y]; dbg.stepOwn(10); if (!(dbg.G.debs.thrash && dbg.G.debs.thrash.until > dbg.G.t)) K('outside her tail\'s 35 yards the sweep leaves no hit and DoT (Mephitic Thrash hits the whole raid)'); }
    // the sweep inside 35 yards hatches a carried egg; the beam's side waves hatch an egg on the floor; a splash bursts both eggs; dying with an egg leaves a real Viper
    if (!/Mephitic Thrash hit your egg inside her tail/.test(PJ)) K('Mephitic Thrash inside 35 yards doesn\'t hatch a carried egg');
    if (/w\.kind !== 'incub' && inWave\(w, t, e\.x, e\.y\)/.test(PJ)) K('the venom beam\'s side waves still pass over an egg on the floor without hatching it (Wolfthorn pulls 1 and 7)');
    if (!/both eggs hatched/.test(PJ) || !/G\.adds\.push\(\{ kind: 'viper', x: b\.x \+ 1, y: b\.y \+ 1, born: t \}\)/.test(PJ)) K('Noxious Splash bursts only your egg; it bursts both');
    if (!/deb\('putrid', 20, true\); G\.adds\.push\(\{ kind: 'viper', x: G\.x \+ 1\.5, y: G\.y - 1, born: G\.t \}\); G\.log\.push\(\{ t: G\.t, kind: 'viper', text: 'You died holding your egg/.test(PJ)) K('dying with your egg says a Viper hatched but none is there when you keep going');
    if (/deb\('putrid', 30/.test(PJ)) K('Putrid Membrane still lasts 30 s; it is 20 s since the Nov 6 hotfix');
    // the second Wretch dies before phase 1 ends (before its third bubble); each Wretch's last 10 s are a moment to help kill it
    { const W = dbg.S.wretches; if (!W.every((w) => w.dies < 165)) K('a Wretch never dies in phase 1 (the second must die before its third bubble)');
      dbg.at(W[0].dies - 5, 'r3'); const dv = dbg.dps(); if (!dv || dv.cat !== 'wretch') K('5 s before the first Wretch dies there is no "Kill the Wretch" moment (it reads ' + (dv && dv.cat) + ')'); }
  } catch (e) { bad('the mechanics crashed the game: ' + e.message + ' (check K)'); }
  finally { try { dbg.hints = true; dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; } catch (e) { /* (no job) */ } }
  // L. Main's playtest of every part, role and job (Nov 15, 3bff3e05, Flex: "Yes, send them"), the phase 1 and shared fixes:
  //    1. as the melee egg carrier, Ranged 5's spot at 0:31 was 0.8 yards from yours and it walked into you: both eggs hatched and you died at 0:40 on every
  //       run (and stepping out of one carrier's ring pushed you into another's at 2:07). 2. melee stood at home in the heart burn, out of reach: "you were on
  //       it 0% of the time". 3. phase 1 opened in 2D (checked in tests/practice-3d.js). 4. a call stayed up 13 s after its moment. 5. the small tails fired
  //       three random lines 20 to 65 degrees apart, not the measured short fan, and the pair at 0:37.8 was missing.
  try {
    const L = (m) => bad(m + ' (check L)');
    for (const [role, egg, east, seed] of [['m', 'm1', false, 3], ['m', 'm1', true, 7], ['m', 'm1', false, 11], ['r', 'r3', false, 3]]) { dbg.myJob = { role, egg, soak: [1, 1], fb: [0, 0] }; const slot = dbg.jobSlot(), r = dbg.sim(slot, true, east, seed), sp = r.log.filter((x) => /carrying too/.test(x));
      if (sp.length || r.deaths.length) L('following the plan as the ' + (role === 'm' ? 'melee' : 'ranged') + ' egg carrier (' + slot + ', seed ' + seed + '): ' + (sp[0] || 'died at ' + r.deaths.join(', '))); }
    // (Flex, Nov 16: "its impossible to walk into another egg carrier now. Thats part of the fight people need to practice": the fix above made carriers step
    //  back from you and moved their spots away from wherever you stood. They keep clear of your PLANNED spot; walk into one and both eggs hatch)
    if (typeof dbg.walkTo !== 'function') L('there is no way to walk the player in the check (dbg.walkTo)');
    else { dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; dbg.at(30, 'r3'); const G0 = dbg.G, other = G0.eggs.find((e) => e.state === 'held' && e.who && e.who !== 'r3'), b = other && G0.bots[other.who];
      if (!b || !G0.eggs.some((e) => e.who === 'r3' && e.state === 'held')) L('at 0:30 you or another carrier hold no egg, so walking into a carrier can\'t be checked');
      else { const v0 = G0.vipers; for (let i = 0; i < 80 && dbg.G.vipers === v0; i++) { dbg.walkTo([b.x, b.y]); dbg.stepOwn(1); } if (!(dbg.G.vipers > v0)) L('walking straight into another egg carrier never splashes: the carrier keeps stepping away'); } }
    for (const [east, seed] of [[false, 3], [true, 7]]) { dbg.myJob = { role: 'm', egg: null, soak: [2, 2], fb: [0, 0] }; dbg.sim(dbg.jobSlot(), true, east, seed); const H = dbg.dpsList().filter((m) => m.kind === 'heart');
      if (!H.length || H.some((m) => m.fr < 0.5)) L('a melee following the plan is on the heart ' + H.map((m) => Math.round(m.fr * 100) + '%').join(', ') + ' of the burn; their spot must be in reach'); }
    dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; dbg.at(30, 'r3'); { const G0 = dbg.G, S0 = dbg.S, t = G0.t; S0.warns.splice(G0.warnI, 0, { t: t - 0.01, text: 'Circling Prey: move one quarter left, you have 8 s!', c: '#fff' }); G0.warnQ = []; G0.lastWarn = null;
      const a = dbg.warnsNow(); if (!a || !a.items || a.items[0].by == null || Math.abs(a.items[0].by - (t + 8)) > 0.1) L('a call that says "you have 8 s" doesn\'t know when its 8 s end');
      dbg.stepOwn(60); const m = dbg.warnsNow(); if (!m || !m.all.some((x) => /Circling Prey/.test(x))) L('a call that gives you 8 s is gone after 3 s; it stays up while its seconds count down');
      dbg.stepOwn(120); const b = dbg.warnsNow(); if (b && b.all.some((x) => /Circling Prey/.test(x))) L('a call is still up after its 8 s ran out (9:05\'s Circling Prey was still on screen at 9:18)'); }
    { dbg.at(30, 'r3'); const W = dbg.S.waves.filter((w) => w.kind === 'tail'), g = new Map(); W.forEach((w) => { const k = w.x.toFixed(1) + ',' + w.y.toFixed(1) + ',' + w.t0; (g.get(k) || g.set(k, []).get(k)).push(w.deg); });
      [...g.entries()].forEach(([k, D]) => { const sp = Math.max(...D) - Math.min(...D); if (D.length !== 3 || sp > 46) L('a small tail at ' + k + ' fires ' + D.length + ' waves ' + sp.toFixed(0) + ' degrees across; the measured fan is three, about 15 degrees apart'); });
      if (!W.some((w) => Math.abs(w.t0 - 37.8) < 0.05)) L('the two small tails at 0:37.8, just before the first coils, are missing');
      if (/three waves 2\.4 s later: step out|small tails' rings/i.test(PJ)) L('the small tails are still described as random waves or rings'); }
  } catch (e) { bad('the playtest fixes crashed the game: ' + e.message + ' (check L)'); }
  finally { try { dbg.hints = true; dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; } catch (e) { /* (no job) */ } }
  // N. Boss-mod alerts (Flex, Nov 16: "I think the alerts need some work", then "Yes" to the mock): each call an alert with the spell's icon, a short order in
  //    big letters, the spell and the rest under it, a live countdown; gold when it's about you, the call's colour otherwise; two at most, the second smaller
  try { const N = (m) => bad(m + ' (check N)'); if (typeof dbg.alerts !== 'function') N('the calls aren\'t drawn as alerts (dbg.alerts)');
    else { dbg.at(30, 'r3'); const t = dbg.G.t, h = dbg.alerts([{ text: 'Fester Burst: into the Wretch\'s bubble, you have 4 s!', c: '#d8f22f', by: t + 4, me: true }, { text: 'Caustic Waves: wait on the east half, then cross behind the first wave.', c: '#9be13a', by: null }]);
      const al = h.split('<div class="pg-al').slice(1); if (al.length !== 2) N('two calls didn\'t make two alerts');
      else { if (!/^ you"/.test(al[0]) || !/--c:#f3c969/.test(al[0])) N('a call about you isn\'t gold');
        if (!/<b class="pg-alo">into the Wretch&#39;s bubble<\/b>/.test(al[0]) && !/<b class="pg-alo">into the Wretch's bubble<\/b>/.test(al[0])) N('the order isn\'t the short part after the spell: ' + (/pg-alo">([^<]*)/.exec(al[0]) || [])[1]);
        if (!/<span class="pg-ald">Fester Burst<\/span>/.test(al[0])) N('the spell isn\'t named under the order');
        if (/class="pg-aln"/.test(al[0])) N('a call that gives you 4 s shows a countdown number; the boss-mod bars count (Flex, Nov 16: "i feel like the game confuses people saying timestamps")');
        if (!/^ small"/.test(al[1]) || !/--c:#9be13a/.test(al[1]) || !/pg-alo">wait on the east half<\/b>/.test(al[1]) || !/Caustic Waves · then cross behind the first wave/.test(al[1])) N('the second alert isn\'t smaller, in its own colour, with a short order and the rest under it'); }
      if (!/class="pg-ali"/.test(h)) N('the alerts have no icon box'); } } catch (e) { bad('the alerts crashed: ' + e.message + ' (check N)'); }
  // M. Sounds you can feel (Flex, Nov 16: "Maybe try to include some sounds of what some mechanics might feel like or add attack sounds as well if you can"):
  //    made in the browser from noise and tones (no sound files, never a voice), quiet, never for the autopilot, each wired to its moment
  { const M = (m) => bad(m + ' (check M)'), kinds = ['wave', 'slam', 'pop', 'sweep', 'thud', 'hiss', 'zip', 'roar', 'fire', 'holy', 'slash', 'whirl'];
    const fx = (/const FX = \{([\s\S]*?)\};\n/.exec(PJ) || [])[1] || ''; kinds.forEach((k) => { if (!new RegExp('\\b' + k + ': \\(c, t\\) =>').test(fx)) M('there is no "' + k + '" sound'); });
    if (!/const feel = \(k\) => \{ if \(!sndOn \|\| window\.__pgAuto \|\| !FX\[k\]\) return;/.test(PJ)) M('the sounds play for the autopilot, or ignore the Sound / M switch');
    if (/\.(mp3|ogg|wav)\b|speechSynthesis|new Audio\(/.test(PJ)) M('the game uses a sound file or a voice; sounds are made in the browser, never a voice');
    [[/const hitTgt = \(o, t, quiet\) => \{ if \(!quiet\) feel\(rl\(me\) === 'm' \? 'slash' : rl\(me\) === 'h' \? 'holy' : 'fire'\);/, 'your attack (by role)'], [/feel\('whirl'\); \(G\.aoeFx/, 'the area attack'],
      [/inWave\(w, t, x, y, 5\)\) \{ G\.done\.add\('ws' \+ i\); feel\('wave'\);/, 'a wave passing you'], [/if \(!crossed\(s\.at\)\) return; feel\('slam'\);/, 'a coil\'s slam'], [/if \(c\) feel\('pop'\);/, 'the Wretch\'s bubble'],
      [/if \(!crossed\(th\.at\)\) return; feel\('sweep'\);/, 'the tail\'s sweep'], [/feel\('thud'\)/, 'something landing near you'], [/const hatch = \(e, why, tip\) => \{ feel\('hiss'\);/, 'a Viper hatching'], [/feel\('zip'\); hurt\(8\);/, 'a Viper\'s sting'], [/feel\('roar'\)/, 'her dive and the heart']]
      .forEach(([re, what]) => { if (!re.test(PJ)) M('no sound for ' + what); }); }
  // O. The spot maps (Flex, Nov 16: "visual maps that lets them select the spot is best, you should use the plans maps so its something familiar ... Customizable,
  //    but not crazy confusing", "Maybe include an option for people who dont have assignments yet maybe randomize their assignments", then on phase 1's first
  //    maps "make sure the maps are placed properly it looks off", "clicking on your coil hides no egg" and "The plans layout is just general locations not exact
  //    egg spots remember"): under your role a Spots row, Your egg and Your coil, drawn with the Plan's own maps (ulSvg of UL_PAGES, here out of src/guides.js),
  //    with 🎲 Random and No egg in the same place on both tabs. Each egg spot is where the Plan's "Pick up eggs" map puts that carrier (pulled onto the stone),
  //    and the game drops that slot's egg in the same quadrant, the inner spot's nearer the middle; a ranged or healer sees the left, right and far spots, a melee
  //    the two by her; the coil spots are the Plan's own soak circles, with you drawn in yours; every pick, Random, No egg and a new role is the job the game plays.
  //    In Node without the Plan's map pieces the setup keeps its job row (check D holds that path). (Before: no maps, only the job row: Egg carrier, First coil,
  //    Second coil.)
  try { const O = (m) => bad(m + ' (check O)'), SU0 = dbg.setupApi && dbg.setupApi();
    if (!SU0 || !SU0.maps || typeof SU0.maps.hot !== 'function' || typeof SU0.maps.page !== 'function') O('the setup has no spot maps (its maps): no Your egg and Your coil maps to pick your spots on (Flex, Nov 16)');
    else {
      if (/pg-sprow/.test(dbg.panel())) O('without the Plan\'s maps (no ulSvg, as in Node) the setup still draws the Spots row instead of keeping the job row');
      let GM = null; try { GM = load(H, pj, { maps: true }); } catch (e) { O('the game would not run with the Plan\'s map pieces from src/guides.js (' + e.message + ')'); }
      const D = GM && GM.dbg, M = D && D.setupApi() && D.setupApi().maps;
      if (GM && !M) O('with the Plan\'s maps loaded the setup has no spot maps');
      else if (GM) try {
        const PX = (x) => 340 + x * 2.083, PY = (y) => 240 - (y + 0.9) * 2.083, YX = (X) => (X - 340) / 2.083, YY = (Y) => (240 - Y) / 2.083 - 0.9; /* (room yards on the Plan's maps, as ulSvg draws them) */
        const EGG = { m: ['m1', 'm2'], r: ['r5', 'r3', 'r6', 'r4', 'r1', 'r2'], h: ['r5', 'r3', 'r6', 'r4', 'r1', 'r2'] }, WHO = { m: 'a melee', r: 'a ranged', h: 'a healer' };
        const QS = [['melee', ['m1', 'm2']], ['left', ['r5', 'r3']], ['right', ['r6', 'r4']], ['far', ['r1', 'r2']]]; /* (the Plan's egg areas and the game's slots, the centre (inner) carrier first, as the game reads a team plan) */
        const quad = (p) => Math.round(Math.atan2(p[1], p[0]) / (Math.PI / 2)) & 3; /* (the Plan's quadrants, cut by its two diagonal lines: 0 right, 1 by her, 2 left, 3 far) */
        const attr = (tag, a) => { const m = new RegExp('\\s' + a + '="([^"]*)"').exec(tag); return m ? m[1] : null; };
        const svgs = (P) => { const s = String(P), i = s.indexOf('class="pg-spmap"'); return i < 0 ? [] : [...s.slice(i).matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)].map((m) => m[0]); }; /* (the Plan's map, then the spots laid over it) */
        const hotIn = (P) => [...String(svgs(P)[1] || '').matchAll(/<circle\b[^>]*\bclass="pg-hs[^"]*"[^>]*>/g)].map(([t]) => ({ id: attr(t, 'data-mh'), cx: +attr(t, 'cx'), cy: +attr(t, 'cy'), on: /class="pg-hs[^"]*\bon\b/.test(t) }));
        const btnIn = (P) => [...String(P).matchAll(/<button\b[^>]*\bdata-m([trx])="([^"]*)"[^>]*>([^<]*)<\/button>/g)].map((m) => m[1] + ':' + m[2] + ':' + m[3]);
        const youIn = (svg) => { const out = []; let i = -1; while ((i = svg.indexOf('>You</text>', i + 1)) >= 0) { const cs = [...svg.slice(svg.lastIndexOf('<g', i), i).matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)"[^>]*\sfill="([^"]+)"/g)].filter((m) => m[3] !== '#000'); if (cs.length) { const c = cs[cs.length - 1]; out.push({ cx: +c[1], cy: +c[2], fill: c[3] }); } } return out; };
        // (the setup: your role, the Spots row and one sentence; the same buttons in the same place on both tabs, the map and its spots in one frame)
        D.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; M.tab = 'egg'; const Pe = D.panel(); M.tab = 'coil'; const Pc = D.panel(); M.tab = 'egg';
        for (const [P, k, lab] of [[Pe, 'egg', 'Your egg'], [Pc, 'coil', 'Your coil']]) { const B = btnIn(P), V = svgs(P).map((s) => attr(s.slice(0, s.indexOf('>')), 'viewBox'));
          if (!/class="pg-srow pg-sprow"><span class="pg-sl">Spots<\/span>/.test(P) || !B.includes('t:egg:Your egg') || !B.includes('t:coil:Your coil') || !new RegExp('data-mt="' + k + '" class="on"').test(P)) O('showing ' + lab + ', the setup has no Spots row with Your egg and Your coil tabs, ' + lab + ' lit');
          if (!B.includes('r:1:🎲 Random') || !B.includes('x:noegg:No egg')) O('showing ' + lab + ', the Spots row has ' + (B.join(', ') || 'no buttons') + '; 🎲 Random and No egg belong on both tabs');
          if ((P.match(/data-sr="/g) || []).length !== 3 || /data-sj="|<details/.test(P) || (P.match(/class="pg-say"/g) || []).length !== 1) O('showing ' + lab + ', the setup isn\'t your role (three buttons), the Spots row and one sentence');
          if (V.length !== 2 || !V[0] || V[0] !== V[1]) O('showing ' + lab + ', the spots aren\'t laid over the Plan\'s map in its own frame (view boxes ' + V.join(' and ') + '), so they sit off what they mark'); }
        if (btnIn(Pe).join('|') !== btnIn(Pc).join('|')) O('the Spots row\'s buttons change between the tabs (' + btnIn(Pe).join(', ') + ', then ' + btnIn(Pc).join(', ') + '); they stay in the same place (Flex: "clicking on your coil hides no egg")');
        // (Your egg: where the Plan's own "Pick up eggs" map puts each carrier, drawn with a name in each place and read back; a ranged or healer gets the left,
        //  right and far spots, a melee the two by her; yours lit, with the gold You on it)
        const ez = { melee: [], left: [], right: [], far: [], backup: [] }; QS.forEach(([z, ids]) => { ez[z] = ids.map((id) => 'P' + id); });
        const plan = String(vm.runInContext('ulSvg', GM.ctx)(vm.runInContext('UL_PAGES', GM.ctx).eggs[0], { ez, shields: [], teams: [[], []], ce: [[], []], cf: [[], []], trans: [], side: { L: {}, R: {} } }, new Map(), {})), planAt = {};
        QS.forEach(([, ids]) => ids.forEach((id) => { const i = plan.indexOf('<title>P' + id + '</title>'), cs = i < 0 ? [] : [...plan.slice(plan.lastIndexOf('<g', i), i).matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)"/g)]; if (cs.length) { const c = cs[cs.length - 1]; planAt[id] = [YX(+c[1]), YY(+c[2])]; } }));
        if (Object.keys(planAt).length !== 8) O('the Plan\'s "Pick up eggs" map drew ' + Object.keys(planAt).length + ' of the eight carriers, so the egg spots can\'t be held to it');
        const spotAt = {};
        for (const [role, egg] of [['r', 'r3'], ['h', 'r1'], ['m', 'm1']]) { D.myJob = { role, egg, soak: [1, 1], fb: [0, 0] }; M.tab = 'egg';
          const HS = M.hot('egg'), ids = HS.map((h) => h.id).sort().join(','), want = EGG[role].slice().sort().join(','), P = D.panel(), drawn = hotIn(P), you = youIn(svgs(P)[1] || '');
          if (ids !== want) O(WHO[role] + ' sees the egg spots ' + ids + '; ' + (role === 'm' ? 'a melee takes only the two by her (m1, m2)' : 'a ranged or healer takes the left, right and far ones (' + want + ')'));
          if (drawn.map((d) => d.id).sort().join(',') !== ids) O('the egg spots drawn for ' + WHO[role] + ' (' + drawn.map((d) => d.id).join(', ') + ') aren\'t the ones it can pick (' + ids + ')');
          HS.forEach((h) => { spotAt[h.id] = [h.x, h.y]; const pa = planAt[h.id], pw = pa && GM.PG_UL.inward(pa), d = drawn.find((q) => q.id === h.id);
            if (pw && Math.hypot(h.x - pw[0], h.y - pw[1]) > 0.15) O('the ' + h.id + ' egg spot is at ' + h.x.toFixed(1) + ', ' + h.y.toFixed(1) + '; the Plan\'s "Pick up eggs" map puts that carrier at ' + pa.map((v) => v.toFixed(1)).join(', ') + (Math.hypot(pa[0] - pw[0], pa[1] - pw[1]) > 0.05 ? ' (' + pw.map((v) => v.toFixed(1)).join(', ') + ' on the stone)' : '') + ' (Flex: "make sure the maps are placed properly")');
            if (!GM.PG_UL.onPlat(h.x, h.y)) O('the ' + h.id + ' egg spot is off the stone');
            if (!d || Math.abs(d.cx - PX(h.x)) > 0.1 || Math.abs(d.cy - PY(h.y)) > 0.1) O('the ' + h.id + ' egg spot is drawn at ' + (d ? d.cx + ', ' + d.cy : 'nowhere') + ' on the map, not at its place ' + PX(h.x).toFixed(1) + ', ' + PY(h.y).toFixed(1));
            if (!!h.on !== (h.id === egg) || !!h.you !== (h.id === egg) || (d && d.on !== (h.id === egg))) O('the ' + h.id + ' egg spot is ' + (h.on ? 'lit' : 'not lit') + ' for ' + WHO[role] + ' who carries the ' + egg + ' egg'); });
          const mine = HS.find((h) => h.id === egg); if (!mine || you.length !== 1 || you[0].fill !== '#f3c969' || Math.abs(you[0].cx - PX(mine.x)) > 0.1 || Math.abs(you[0].cy - PY(mine.y)) > 0.1) O('on Your egg the gold You isn\'t drawn once, on your spot (' + WHO[role] + ' carrying ' + egg + ')'); }
        // (the game drops each slot's egg in its spot's quadrant, the inner spot's egg nearer the middle than the outer one's: the run played, and four more seeds)
        D.at(12, 'r3', { east: false, seed: 3 }); const floor = D.G.eggs.filter((e) => e.set === 0 && e.state !== 'floor'); if (floor.length) O('at 0:12 the first eggs ' + floor.map((e) => e.id).join(', ') + ' aren\'t lying on the floor');
        for (const [tag, S1] of [['the run played', D.S]].concat([5, 8, 13, 21].map((sd) => ['seed ' + sd, GM.script({ seed: sd, east: sd % 2 === 0 })]))) { const at = (id) => { const e = S1.eggSets[0].eggs.find((q) => q.id === id); return e ? [e.x, e.y] : [0, 0]; };
          const out = Object.keys(spotAt).filter((id) => quad(at(id)) !== quad(spotAt[id])); if (out.length) { O('in the first set (' + tag + ') the game drops the ' + out.join(', ') + ' egg(s) outside the quadrant their map spot is in'); break; }
          const flip = QS.filter(([, [a, b]]) => Math.hypot(...at(a)) >= Math.hypot(...at(b))).map(([z]) => z); if (flip.length) { O('in the first set (' + tag + ') the inner spot\'s egg lands no nearer the middle than the outer one\'s (' + flip.join(', ') + ')'); break; } }
        // (both sets, 300 runs each way: every egg in its own quadrant (set 2 turned back by her dive), the inner one nearer the middle, none on a beam spot or
        //  the beam tank's walk. The map review, Nov 16: an egg kept off them turned up to 60 degrees, and set 2's inner eggs landed in the next quadrant on 667
        //  of 2000 runs)
        { const segD = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], u = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy || 1))); return Math.hypot(p[0] - a[0] - vx * u, p[1] - a[1] - vy * u); };
          const QI = { right: 0, melee: 1, left: 2, far: 3 }, PU = GM.PG_UL, bk = (p, d) => { const a = -d * Math.PI / 180; return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)]; }; let bad2 = null;
          for (let sd = 1; sd <= 300 && !bad2; sd++) for (const east of [false, true]) { const S2 = GM.script({ seed: sd, east });
            S2.eggSets.forEach((st, si) => { if (bad2) return; for (const e of st.eggs) { const p = bk([e.x, e.y], st.rot), z = PU.eggQ[e.id][0];
                if (quad(p) !== QI[z]) { bad2 = 'set ' + (si + 1) + ' (seed ' + sd + (east ? ', east' : '') + ') drops the ' + e.id + ' egg outside its ' + z + ' quadrant'; return; }
                if (S2.beams.some((bm) => Math.hypot(e.x - bm.at[0], e.y - bm.at[1]) < 8) || (si === 1 && S2.beams[1] && segD([e.x, e.y], [0, 34], S2.beams[1].at) < 6)) { bad2 = 'set ' + (si + 1) + ' (seed ' + sd + ') drops the ' + e.id + ' egg on a beam spot or the beam tank\'s walk'; return; } }
              for (const [, [a, b]] of QS) { const A = st.eggs.find((q) => q.id === a), B = st.eggs.find((q) => q.id === b); if (A && B && Math.hypot(A.x, A.y) >= Math.hypot(B.x, B.y)) { bad2 = 'set ' + (si + 1) + ' (seed ' + sd + ') drops the inner ' + a + ' egg no nearer the middle than ' + b; return; } } }); }
          if (bad2) O(bad2); }
        // (each egg carrier starts, waits (0:08) and holds its egg (0:20) on its ring, the Plan's place for that egg. The map review, Nov 16: the game held them on
        //  another guide's zone-defence spots, 4 to 20 yards from the ring)
        for (const [role, ids] of [['m', EGG.m], ['r', EGG.r]]) for (const id of ids) { D.myJob = { role, egg: id, soak: [1, 1], fb: [0, 0] }; M.tab = 'egg'; const h = M.hot('egg').find((q) => q.id === id), slot = D.jobSlot(); if (!h) continue;
          for (const [t, what] of [[0.05, 'starts'], [8, 'waits at 0:08'], [20, 'holds its egg at 0:20']]) { D.at(t, slot, { seed: 3, east: false }); const d = Math.hypot(D.G.x - h.x, D.G.y - h.y);
            if (d > 2) { O('the ' + id + ' carrier ' + what + ' ' + d.toFixed(1) + ' yards from its ring on Your egg (the Plan\'s place for that egg)'); break; } } }
        // (Your coil: the Plan's own two soak circles, Right Soak #1 the first coil to appear; yours lit, and you drawn once, in gold, INSIDE your circle, as the
        //  game stands you in your coil: an egg carrier on the Plan's numbered spot, anyone else in its middle. The review, Nov 16: without an egg You sat in the
        //  Plan's list under the circle, 22 yards from its middle, while the game stands you within 3 yards of the coil's middle. And the coil you pick is the one
        //  the game plays, read off its run: an egg carrier takes the first coil in set 1 whatever it picks, so on Left Soak #2 the sentence says so (it said
        //  "pick it up, then soak Left Soak #2" while the game stood you in the first coil))
        M.tab = 'coil';
        for (const [egg, tm] of [['r3', 1], ['r3', 2], [null, 1], [null, 2]]) { D.myJob = { role: 'r', egg, soak: [tm, tm], fb: [0, 0] };
          const HS = M.hot('coil'), P = D.panel(), [pg, hs] = svgs(P), drawn = hotIn(P), circ = [...String(pg || '').matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"/g)].map((m) => [+m[1], +m[2], +m[3]]), tag = ' (' + (egg ? 'an egg carrier' : 'no egg') + ' on Soak #' + tm + ')';
          if (HS.map((h) => h.id).join(',') !== 't1,t2' || HS.some((h) => !h.big) || drawn.length !== 2) { O('Your coil\'s spots are ' + HS.map((h) => h.id).join(', ') + '; they should be the two soak circles, Right Soak #1 and Left Soak #2' + tag); continue; }
          if (!/first coil to appear/.test(HS[0].title) || !/Left Soak #2/.test(HS[1].title)) O('Your coil\'s spots read "' + HS.map((h) => h.title).join('" and "') + '"; Right Soak #1 takes the first coil to appear, Left Soak #2 the next');
          HS.forEach((h) => { if (!circ.some(([x, y, r]) => Math.abs(x - PX(h.x)) < 0.15 && Math.abs(y - PY(h.y)) < 0.15 && Math.abs(r - h.r * 2.083) < 0.15)) O('the ' + h.id + ' coil spot isn\'t on the Plan map\'s own soak circle' + tag);
            const d = drawn.find((q) => q.id === h.id); if (!d || Math.abs(d.cx - PX(h.x)) > 0.1 || Math.abs(d.cy - PY(h.y)) > 0.1) O('the ' + h.id + ' coil spot is drawn off its circle' + tag); });
          const eff = egg ? 1 : tm, /* (r3, the left quadrant's outer egg: Right Soak #1 on the plan's Egg Clear map, whatever you pick) */ mine = HS.find((h) => h.id === 't' + eff), other = HS.find((h) => h.id !== 't' + eff), you = youIn(String(pg || '')).concat(youIn(String(hs || '')));
          if (!mine.on || other.on) O('Your coil lights ' + (HS.filter((h) => h.on).map((h) => h.id).join(', ') || 'nothing') + tag);
          if (you.length !== 1 || you[0].fill !== '#f3c969') O('Your coil draws ' + (you.length === 1 ? 'you, but not in gold' : you.length + ' You tokens') + '; it draws you once, in gold' + tag);
          else { const yx = YX(you[0].cx), yy = YY(you[0].cy), yd = Math.hypot(yx - mine.x, yy - mine.y);
            if (yd >= mine.r) O('Your coil draws you at ' + yx.toFixed(1) + ', ' + yy.toFixed(1) + ', ' + yd.toFixed(1) + ' yards from the middle of your circle (radius ' + mine.r + '): outside it, while the game stands you in your coil' + tag); }
          // (the game's own run: which coil this job soaks in each set, and the sentence saying the same)
          const slot = D.jobSlot(); D.at(0.05, slot, { seed: 3 }); const kk = [0, 1].map((si) => { const q = D.S.soaks.find((s) => s.set === si && s.group.includes(slot)); return q ? q.k + 1 : 0; }), say = M.say();
          if (kk[0] !== eff || kk[1] !== eff) O('the game has you on coil ' + kk[0] + ' in the first set and ' + kk[1] + ' in the second; it should be Soak #' + eff + ' in both (' + (egg ? 'your egg zone\'s team on the plan\'s Egg Clear map' : 'your pick') + ')' + tag);
          if (/second set/.test(say) || !(eff === 2 ? /Left Soak #2/ : /Right Soak #1/).test(say)) O('the sentence reads "' + say + '" while the game has you on coil ' + kk[0] + ' in the first set and ' + kk[1] + ' in the second' + tag); }
        M.tab = 'egg';
        // (each pick is the job the game plays)
        D.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] };
        M.pick('egg', 'r6'); if (D.myJob.egg !== 'r6' || D.jobSlot() !== 'r6' || D.myJob.role !== 'r' || D.myJob.soak.join() !== '2,2') O('picking the right inner egg spot gives ' + JSON.stringify(D.myJob) + ', not the r6 egg with your role kept and its zone\'s coil, Left Soak #2 (the plan\'s Egg Clear map, Nov 16)');
        M.pick('coil', 't2'); if (D.myJob.soak.join() !== '2,2' || D.myJob.egg !== 'r6') O('picking Left Soak #2 gives ' + JSON.stringify(D.myJob) + ', not coil team 2 with your egg kept');
        if (!/coil team 2$/.test(D.jobRole().job)) O('the right inner egg carrier plays "' + D.jobRole().job + '"; the right zone\'s carriers are coil team 2 in both sets (the plan\'s Egg Clear map)');
        if (!/Left Soak #2/.test(M.say()) || !/Left Soak #2/.test(M.sub()) || !/right/i.test(M.sub())) O('after picking the right egg and Left Soak #2, the sentence or the Play button doesn\'t say so: "' + M.say() + '", "' + M.sub() + '"');
        { D.at(20, D.jobSlot(), { seed: 3 }); const e = D.G.eggs.find((q) => q.set === 0 && q.who === 'r6' && q.state === 'held'); /* (the game's own run, on its autopilot: the egg you pick is the one you carry) */
          if (!e || e.id !== 'r6' || quad([e.x, e.y]) !== 0) O('after picking the right inner egg spot the game\'s run has you holding ' + (e ? 'the ' + e.id + ' egg from ' + e.x.toFixed(0) + ', ' + e.y.toFixed(0) : 'no egg') + ' at 0:20; you carry the r6 egg, from the right quadrant'); }
        M.extra('noegg'); { const lit = (M.extras().find((q) => q[0] === 'noegg') || [])[2];
          D.at(20, D.jobSlot(), { seed: 3 }); if (D.G.eggs.some((q) => q.who === D.jobSlot())) O('with No egg the game\'s run still hands you an egg');
          if (D.myJob.egg !== null || D.jobSlot() !== 'r7' || D.myJob.soak.join() !== '2,2' || !lit) O('No egg gives ' + JSON.stringify(D.myJob) + (lit ? '' : ' and isn\'t lit') + '; it should drop your egg and keep your coil');
          if (M.hot('egg').some((h) => h.on || h.you)) O('with No egg an egg spot is still lit');
          if (!/coil team 2$/.test(D.jobRole().job) || /then/.test(D.jobRole().job)) O('no egg on Left Soak #2 plays "' + D.jobRole().job + '"; it should be coil team 2');
          if (!/^No egg/.test(M.say()) || !/^No egg/.test(M.sub())) O('with No egg the sentence or the Play button doesn\'t say so: "' + M.say() + '", "' + M.sub() + '"'); }
        M.pick('coil', 't1'); if (D.myJob.soak.join() !== '1,1' || D.myJob.egg !== null) O('picking Right Soak #1 with no egg gives ' + JSON.stringify(D.myJob));
        M.pick('egg', 'r2'); if (D.myJob.egg !== 'r2' || D.jobSlot() !== 'r2' || D.myJob.soak.join() !== '2,2' || /* (the far zone's coil: Left Soak #2) */ (M.extras().find((q) => q[0] === 'noegg') || [])[2]) O('picking an egg spot after No egg gives ' + JSON.stringify(D.myJob) + ' (No egg should go dark)');
        // (a new role keeps the spots it can take and moves the rest)
        D.myJob = { role: 'r', egg: 'r3', soak: [2, 2], fb: [0, 0] }; M.role('h'); if (D.myJob.role !== 'h' || D.myJob.egg !== 'r3' || D.myJob.soak.join() !== '2,2') O('switching Ranged to Healer gives ' + JSON.stringify(D.myJob) + '; a healer can keep the same egg and coil');
        M.role('m'); if (D.myJob.role !== 'm' || !EGG.m.includes(D.myJob.egg) || D.myJob.soak.join() !== '2,2') O('switching to Melee gives ' + JSON.stringify(D.myJob) + '; a melee takes an egg by her and keeps the coil');
        M.role('r'); if (D.myJob.role !== 'r' || !EGG.r.includes(D.myJob.egg) || D.myJob.soak.join() !== '2,2') O('switching Melee to Ranged gives ' + JSON.stringify(D.myJob) + '; a ranged takes a left, right or far egg and keeps the coil');
        // (🎲 Random, for people with no plan yet: an egg spot your role can take and a coil, never the same every time)
        for (const role of ['m', 'r', 'h']) { const eggs = new Set(), teams = new Set(); D.myJob = { role, egg: null, soak: [1, 1], fb: [0, 0] };
          for (let i = 0; i < 60; i++) { M.random(); const j = D.myJob; eggs.add(j.egg); teams.add(j.soak.join());
            if (j.role !== role || !EGG[role].includes(j.egg) || !/^(1,1|2,2)$/.test(j.soak.join())) { O('🎲 Random gave ' + WHO[role] + ' ' + JSON.stringify(j) + ': ' + (j.role !== role ? 'a different role' : !j.egg ? 'no egg (every role takes every mechanic it can)' : !EGG[role].includes(j.egg) ? 'an egg spot ' + WHO[role] + ' can\'t take' : 'no coil team')); break; } }
          if (eggs.size < 2 || teams.size < 2) O('🎲 Random for ' + WHO[role] + ' gives the same every time (eggs ' + [...eggs].join(', ') + '; coils ' + [...teams].join(' and ') + ')'); }
      } catch (e) { O('the spot maps crashed: ' + e.message); }
      finally { try { if (D) D.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; if (M) M.tab = 'egg'; } catch (e) { /* (no job) */ } }
    }
  } catch (e) { bad('the spot maps crashed the game: ' + e.message + ' (check O)'); }
  releaseSweep(H, bad, pj, clk, hyp);
  releaseCheck(H, bad, pj, clk, hyp);
  promptsAudit(H, bad, pj, null, clk, hyp);
  reviewChecks(H, bad, pj, clk, hyp);
  mistakeTimes(H, bad, pj);
}

// (phase 2 the way tests/practice-p2.js loads it: practice.js, practice3d.js and practice-p2.js in one scope, opened on its part; pj: practice.js's text, for a check
//  run against older code)
function loadP2(H, pj) {
  H = H || require('./site-helpers.js'); const rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n'), GJ = rd('guides.js');
  const fromGuides = ['GDZ_ROLE', 'GDZ_RAID', 'gdzName', 'UX', 'UX_MEL', 'UX_HOME', 'UX_ZONE', 'UL_EDGE', 'UL_FB', 'GDZ_FLOOR', 'UL_EGGS'].map((n) => H.grab(n, GJ)).join('\n');
  const win = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
  class Img { constructor() { this.complete = false; this.naturalWidth = 0; } }
  const ctx = vm.createContext({ document: stub(), window: win, navigator: stub(), performance, Image: Img, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, localStorage: stub(), E: { CLASSES: {} }, console, MouseEvent: function () {} });
  vm.runInContext(H.grab('esc') + '\n' + fromGuides + '\n' + (pj || rd('practice.js')) + '\n' + rd('practice3d.js') + '\n' + rd('practice-p2.js'), ctx);
  vm.runInContext('pgOpen(null, "Ula\'tek", "m", "m2")', ctx);
  return { dbg: win.__pgDbg, ctx };
}

// P. The release sweep, Nov 16 (Flex: "im trying to have this game in a released state for today, so i just need it to really work and be functional"): the
//    Go-here arrow and the job line say where to stand, and standing there is safe. Each failed on the code before its fix:
//    - the arrow for the Wretch's bubble came 6 s before it popped (timed for the bots, who run 9.8 yards a second; you walk 7): a ranged with no egg who walked
//      where it pointed from the far side of the room reached the 0:39 bubble late, Fester Burst (the job line, 8 s before, was in time);
//    - after your 2:14 coil the arrow pointed at the 2:20 bubble's middle, 8 yards inside the 2:17 coil: walking there took its slam;
//    - from 2:12 the job line called the 2:20 bubble over your coil, so the first coil's soakers walked off it to the Wretch and missed the 2:14 slam, and the
//      second coil's never read "Your coil ... slams";
//    - in phase 2 the arrow pointed at your small egg from 2:55 till the Warden died (the job gives no spot there, so it fell back on your egg on the floor):
//      Warden's Protection, your tether broken early at 3:16, Malice out of a ranged's kick reach. (Phase 1's egg, with only its shell up, keeps its arrow.)
function releaseSweep(H, bad, pj, clk, hyp) {
  const P = (m) => bad(m + ' (the release sweep, Nov 16, check P)'), PJ = pj || fs.readFileSync(path.join(SRC, 'practice.js'), 'utf8'), HOOK = 'window.__pgDbg = { ';
  // (the game with its job line readable: the debug hook gets jobText, as the screen's job box shows it)
  if (!PJ.includes(HOOK)) { P('the test can\'t read the job line: no "' + HOOK + '" in src/practice.js'); return; }
  let dbg; try { dbg = load(H, PJ.replace(HOOK, HOOK + 'jobText: () => jobText(), ')).dbg; } catch (e) { P('the game would not run for the arrow checks (' + e.message + ')'); return; }
  try {
    // (the 0:39 bubble from the far side: Ranged, No egg, first coil, her tail west. You stand at your start till the job line calls it, then follow the arrow)
    { dbg.myJob = { role: 'r', egg: null, soak: [1, 1], fb: [0, 0] }; const slot = dbg.jobSlot(); dbg.at(30.9, slot, { east: false, seed: 1, tailEast: false }); const G = dbg.G, q = dbg.S.bubbles[0]; dbg.pos = [30, 12]; let first = null;
      while (G.t < 39.3) { const h = dbg.hint(); if (h && first == null) first = G.t; dbg.walkTo(h ? h.T : null); dbg.stepOwn(1); }
      const w = G.wr[q.w], dW = w ? hyp([G.x, G.y], [w.x, w.y]) : 99, burst = dbg.log.filter((m) => /^0:39 Fester Burst/.test(m));
      if (first == null || first > 31.5 || burst.length) P('a ranged with no egg ' + hyp([30, 12], q.p).toFixed(0) + ' yards from the 0:39 bubble gets its arrow ' + (first == null ? 'never' : 'at ' + clk(first)) + ' (the job line calls it at 0:31) and, walking where it points, ends ' + dW.toFixed(1) + ' yards from the Wretch' + (burst.length ? ': ' + burst[0] : '')); }
    // (the second coils, the first coil's soaker: Ranged, No egg, first coil, seed 1. In your coil to its 2:14 slam, then where the arrow points)
    { dbg.myJob = { role: 'r', egg: null, soak: [1, 1], fb: [0, 0] }; const slot = dbg.jobSlot(); dbg.at(131.9, slot, { east: false, seed: 1 }); const G = dbg.G, S = dbg.S, mine = S.soaks.find((q) => q.set === 1 && q.group.includes(slot)), other = S.soaks.find((q) => q.set === 1 && !q.group.includes(slot));
      if (!mine || !other || !(mine.at < other.at)) P('the test lost its setup: Ranged, No egg on the first coil should soak the 2:14 coil, before the other');
      else { let jl = ''; while (G.t < 135.6) { dbg.pos = [mine.x, mine.y]; if (!jl && G.t >= 132.5) jl = dbg.jobText(); dbg.stepOwn(1); }
        if (!/^Stand in your coil until it slams|^Small tail: step out of its red lane, stay in your circle/.test(jl)) P( /* (the words since the review of Nov 16: 12 at most, the small tail's lane named) */'at 2:12.5, your coil slamming at ' + clk(mine.at) + ', the job line reads "' + jl + '"; it should be your coil\'s line, not the 2:20 bubble\'s');
        const j2 = dbg.jobText(); if (!/outside the (first|second) coil|stay out of the (first|second) coil|^Small tail: /i.test(j2)) P('at 2:15.6, your coil done and the other slamming at ' + clk(other.at) + ' inside the bubble, the job line reads "' + j2 + '"; it should say to stay out of the other coil');
        const h = dbg.hint(), inB = hyp([G.x, G.y], S.bubbles[3].p) <= 9 && hyp([G.x, G.y], [other.x, other.y]) > other.r + 1; /* (no arrow when you already stand where the bubble counts you, outside that coil: the prompts audit, Nov 16) */ if (h ? hyp(h.T, [other.x, other.y]) <= other.r + 1 : !inB) P('at 2:15.6 the arrow ' + (h ? 'points ' + hyp(h.T, [other.x, other.y]).toFixed(1) + ' yards from the middle of the coil that slams at ' + clk(other.at) + ' (its circle is ' + other.r + ')' : 'isn\'t there') + '; it should lead into the bubble outside that coil');
        let tg = h ? h.T : null; while (G.t < other.at + 0.2) { const hh = dbg.hint(); if (hh) tg = hh.T; dbg.walkTo(tg); dbg.stepOwn(1); } /* (onto the ring the arrow points at, as you would) */
        dbg.log.filter((m) => /^2:1[5-7] Soul Constrictor/.test(m)).forEach((m) => P('walking where the arrow points after your 2:14 coil: ' + m)); } }
    // (the second coils, the second coil's soaker: Ranged, No egg, second coil, seed 1)
    { dbg.myJob = { role: 'r', egg: null, soak: [2, 2], fb: [0, 0] }; const slot = dbg.jobSlot(); dbg.at(134.5, slot, { east: false, seed: 1 }); const mine = dbg.S.soaks.find((q) => q.set === 1 && q.group.includes(slot)), jl = dbg.jobText();
      if (!mine || !/^Stand in your coil until it slams|^Get in your gold coil now|^Step onto the gold ring in your coil|^Small tail: step out of its red lane, stay in your circle/.test(jl)) P( /* (the words since the review of Nov 16; in your coil off the arrow's spot, step onto its ring) */'at 2:14.5, your coil slamming at ' + (mine ? clk(mine.at) : '?') + ', the job line reads "' + jl + '"; it should be your coil\'s line, not the 2:20 bubble\'s'); }
    // (phase 1's egg with its shell up keeps its arrow: go to it and hit it)
    { dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; const slot = dbg.jobSlot(); dbg.at(12, slot, { east: false, seed: 3 }); const e = dbg.G.eggs.find((q) => q.id === slot && q.state === 'floor'), n = e ? Math.hypot(e.x, e.y) || 1 : 1;
      if (e) { dbg.pos = [e.x - e.x / n * 10, e.y - e.y / n * 10]; const h = dbg.hint(); if (!h || h.what !== 'egg' || hyp(h.T, [e.x, e.y]) > 0.5) P('in phase 1, 10 yards from your egg with its shell up (0:12), the arrow ' + (h ? 'points at ' + h.what : 'isn\'t there') + '; it should lead to your egg'); }
      else P('the test lost its setup: the r3 egg should be on the floor at 0:12'); }
  } catch (e) { P('the arrow checks crashed the game: ' + e.message); }
  finally { try { dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; } catch (e) { /* (no job) */ } }
  // (phase 2: your small egg while its Warden lives; the autopilot plays your job, the arrow read each half second)
  try { const D2 = loadP2(H, pj).dbg;
    if (!D2 || !D2.P2) P('phase 2 didn\'t open for the arrow check');
    else for (const [pk, seed, east] of [[{ side: 'E', role: 'r', egg: 'n6', mal: 1, cry: 1, teth: 'random' }, 3, false], [{ side: 'W', role: 'm', egg: 'n4', mal: 1, cry: 1, teth: 'random' }, 2, true]]) {
      D2.P2.pick = pk; const me2 = D2.P2.slotOf(pk); D2.hints = true; D2.at(176, me2, { east, seed }); const G2 = D2.G, on = [];
      while (G2.t < 240 && G2.p2.wd[pk.side]) { const h = D2.hint(), e = G2.eggs.find((q) => q.id === me2 && q.state === 'floor'); if (h && e && hyp(h.T, [e.x, e.y]) < 3) on.push(G2.t); D2.step(10); }
      if (on.length) P('in phase 2 (' + (pk.role === 'r' ? 'Ranged' : 'Melee') + ' ' + (pk.side === 'E' ? 'East' : 'West') + ', small egg ' + pk.egg.slice(1) + ', seed ' + seed + ') the Go-here arrow points at your egg while its Warden lives, from ' + clk(on[0]) + ' to ' + clk(on[on.length - 1]) + ': standing there is Warden\'s Protection, and out of your tether and kick'); }
  } catch (e) { P('the phase 2 arrow check crashed: ' + e.message); }
}

// Q. The release check, Nov 16 (the skeptic's pass over check P's fixes): the Go-here arrow on phase 2's small egg before its Warden has died. Check P's fix kept
//    the arrow off the egg while its Warden lived, but the Wardens rise at 2:55, and from 2:47.7 there was no living Warden yet: the arrow pointed at your egg
//    90 yards away across the venom while the job line said to walk into your gate, and on the ledge led you off toward it. (practice.js's phase 1 shell code
//    wears the phase 2 egg's shell down by 2:48.5, so the egg reads as open.) An egg held by something else gets the arrow only once its Warden is dead.
function releaseCheck(H, bad, pj, clk, hyp) {
  const Q = (m) => bad(m + ' (the release check, Nov 16, check Q)');
  try { const D2 = loadP2(H, pj).dbg;
    if (!D2 || !D2.P2) { Q('phase 2 didn\'t open for the egg arrow check'); return; }
    [[{ side: 'E', role: 'r', egg: 'n6', mal: 1, cry: 1, teth: 'random' }, 3, false, 232], [{ side: 'W', role: 'm', egg: 'n4', mal: 1, cry: 1, teth: 'random' }, 2, true, 176]].forEach(([pk, seed, east, upTo]) => {
      D2.P2.pick = pk; const me2 = D2.P2.slotOf(pk), tag = (pk.role === 'r' ? 'Ranged' : 'Melee') + ' ' + (pk.side === 'E' ? 'East' : 'West') + ', small egg ' + pk.egg.slice(1) + ', seed ' + seed; D2.hints = true; D2.at(166, me2, { east, seed });
      const G2 = D2.G, on = [], after = [];
      while (G2.t < upTo) { const h = D2.hint(), e = G2.eggs.find((q) => q.id === me2 && q.state === 'floor'); if (h && e && hyp(h.T, [e.x, e.y]) < 3) (G2.p2.wdead[pk.side] == null ? on : after).push(G2.t); D2.step(5); }
      if (on.length) Q('in phase 2 (' + tag + ') the Go-here arrow points at your small egg before its Warden is dead, from ' + clk(on[0]) + ' to ' + clk(on[on.length - 1]) + ' (the Wardens rise at 2:55): across the venom while the job line says to walk into your gate');
      if (upTo > 230 && !after.length) Q('in phase 2 (' + tag + ') the Go-here arrow never leads to your small egg once its Warden is dead (to ' + clk(upTo) + ')'); });
  } catch (e) { Q('the phase 2 egg arrow check crashed: ' + e.message); }
}

// R. The prompts audit, Nov 16 (Flex: "Lets improve the curated experience as the game guides players onto what they need to do next. I think the alerts and
//    training wheels could be better in terms of the on screen prompts", then "All 10", then mid-run: "i feel like the game confuses people saying timestamps").
//    Each failed on the code before the fix (run promptsAudit with the old practice.js and practice3d.js as pj and p3j):
//    R0. no clock time and no second count in anything you read while playing (your job, NEXT, the calls, the floats, the floor labels, the start card): the job
//        line read "Fester Burst in 6.3 s", "Next: Coil slam 2 in 3 s", the floor "Into the bubble · 2.0", the card "at 0:39, 1:10, 1:48 and 2:20", a call a
//        big countdown number. The result screen keeps the time a mistake happened (since the review of Nov 16 the floats and the death card don't: check S).
//    R1. the arrow walked you into danger: a Soak #2 player who followed it took the first coil's slam at 0:40 (and the 2:14 one in the second set), then Soul
//        Constrictor; a carrier walked into another carrier's ring. It bends round them now, or says Wait.
//    R2. dodges had no words: small tails (no job line, no call, the bar merged into "Her waves"), an egg falling on a raider who carries none (hit at 0:10 and
//        1:21), and its circle showed only 2.5 s before.
//    R3. the arrow stopped short of where the game counts you, or ended where it doesn't (inside the coil that isn't yours).
//    R4. the arrow came too late: from 1.6 s before you needed to move, the second egg none until it landed, melee none to the heart.
//    R5. the job line picked the wrong thing: "Next: Coil slam 2 in 3 s" to the first coil's soakers (the other team's coil), and "Kill the Rawlings ... get close"
//        to a melee with them in the tail's sweep.
//    R6. a false line: phase 2's egg read "Shell broken" and opened at 2:48.5 under its Warden's shield.
//    R7. a teaching call covered a step due now: "Rawlings! Press Tab..." as a Soak #2 healer's coil slammed at 0:43; and no call when the heart opened.
//    R8. the coil call didn't say which one is yours ("team 1 takes the first coil to appear", white, the same for both teams).
//    R9. the big line wasn't the order ("only the tank stands in it", "eggs incoming") and a call went gold because it said "you".
//    R10. her waves had no "now": one line for 14 s, nothing at the swap, compass words for halves the camera turns.
function promptsAudit(H, bad, pj, p3j, clk, hyp) {
  const R = (m) => bad(m + ' (the prompts audit, Nov 16, check R)'), rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8'), PJ = pj || rd('practice.js'), P3J = p3j || rd('practice3d.js'), HOOK = 'window.__pgDbg = { ';
  if (!PJ.includes(HOOK)) { R('the test can\'t read the job line: no "' + HOOK + '" in src/practice.js'); return; }
  let L0; try { L0 = load(H, PJ.replace(HOOK, HOOK + 'jobText: () => jobText(), defQ: () => defKey(), ')); vm.runInContext(P3J + '\nthis.pg3dShapes = pg3dShapes;', L0.ctx); } catch (e) { R('the game would not run for the prompts checks (' + e.message + ')'); return; }
  const dbg = L0.dbg, ctx = L0.ctx, PG_UL = L0.PG_UL, job = (role, egg, soak) => ({ role, egg, soak: [soak, soak], fb: [0, 0] });
  const CLOCK = /\b\d{1,2}:\d{2}\b/, SECS = /\b\d+(?:\.\d+)?\s?s\b/, TENTHS = /\b\d+\.\d\b/, timey = (x) => CLOCK.test(x) || SECS.test(x) || TENTHS.test(x);
  const strip = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&#39;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  // (the 3D floor's words, read with the game's own window on itself when it gives one, else a stand-in built from what the debug hook has)
  const A3 = () => dbg.v3a || { G: dbg.G, S: dbg.S, me: dbg.role.id, nm: (id) => id, rl: (id) => id[0], clsC: () => null, hint: () => dbg.hint(), spot: () => null, target: null,
    bossAt: (t) => ({ p: t < dbg.S.dive.gone ? PG_UL.boss.slice() : dbg.S.dive.to, up: t < dbg.S.dive.gone || t >= dbg.S.dive.surf }), tailAt: (t) => ({ p: dbg.S.FT(PG_UL.tail, t), up: true }) };
  const labels = (t) => { try { return ctx.pg3dShapes(A3(), t).filter((s) => s.k === 'label').map((s) => s.text); } catch (e) { return ['(pg3dShapes crashed: ' + e.message + ')']; } };
  try {
    // R0. timestamps: four whole runs, read every quarter second
    const seen = new Map(), note = (where, x) => { if (x && timey(x) && !seen.has(where + x)) seen.set(where + x, where + ': "' + x + '"'); };
    if (typeof dbg.said !== 'function') R('the test can\'t read the floats (dbg.said), so it can\'t check them for clock times');
    for (const [jb, seed, east] of [[job('r', 'r3', 1), 3, false], [job('h', null, 2), 3, false], [job('m', null, 1), 1, true], [job('m', 'm1', 2), 7, false]]) {
      dbg.myJob = jb; const slot = dbg.jobSlot(); dbg.hints = true; dbg.at(0.05, slot, { seed, east }); const G = dbg.G, n0 = dbg.said ? dbg.said().length : 0; let keys = 0;
      while (G.t < 164.8) { note('the job line', dbg.jobText()); if (dbg.next) note('the NEXT line', dbg.next());
        const w = dbg.warnsNow(); if (w && w.items) { const h = dbg.alerts(w.items); note('a call', strip(h)); if (/class="pg-aln"/.test(h)) note('a call\'s countdown', 'a number counting down: ' + strip(h) + ' 9 s'); }
        // (Q and 2 pressed by hand, as a player would: dbg.step runs the autopilot, which keeps the floats for your defensive and your area attack quiet, so a
        //  "Defensive: half damage for 8 s." or "Area attack is cooling down: 6 s." came back unseen. The review of the prompts fixes, Nov 16)
        if (keys < 2 && G.t >= (keys ? 100 : 20)) { keys++; if (dbg.defQ) dbg.defQ(); const o = (dbg.tgts() || []).find((q) => q.kind !== 'tail') || (dbg.tgts() || [])[0]; if (o) { dbg.tgt = o.key; dbg.pos = [o.p[0] + (o.r || 1) + 1, o.p[1]]; } G.gcd0 = -99; dbg.aoe(); dbg.aoe(); }
        labels(G.t).forEach((x) => note('the floor', x)); dbg.step(5); }
      // (every float, mistakes too: since the review of Nov 16 a mistake's float has no time either (check S); only the result screen keeps when)
      if (dbg.said) { const fl = dbg.said().slice(n0); fl.forEach((x) => note('a float', x.text)); if (!fl.some((x) => /^Defensive/.test(x.text)) || !fl.some((x) => /^Area attack/.test(x.text))) R('the test lost its setup: pressing Q and 2 twice by hand said ' + JSON.stringify(fl.filter((x) => /Defensive|Area attack|Too far/.test(x.text)).map((x) => x.text)) + '; it should float your defensive and your area attack cooling down (R0)'); } }
    { const SU = dbg.setupApi(); for (const jb of [job('r', 'r3', 1), job('h', null, 2), job('m', 'm1', 2), job('r', null, 1)]) { dbg.myJob = jb; const slot = dbg.jobSlot();
      [dbg.panel(), dbg.short(slot), dbg.asg(slot), SU && SU.say(), SU && SU.maps && SU.maps.say(), SU && SU.maps && SU.maps.sub()].forEach((x) => strip(x).split(/(?<=[.!?])\s+/).forEach((y) => note('the start card', y))); }
      const st = (/const START = (\[\[[^;]*\]\]);/.exec(PJ) || [])[1] || ''; (st.match(/'[^']*'/g) || []).forEach((x) => note('the Start list', x.slice(1, -1))); }
    if (/label\([^;\n]*toFixed\(/.test((/const draw = \(\) => \{[\s\S]*?\n {2}\};/.exec(PJ) || [''])[0])) note('the 2D floor', 'a label with a countdown (toFixed) 2.0');
    [...seen.values()].slice(0, 8).forEach((m) => R('Flex, Nov 16, "i feel like the game confuses people saying timestamps": ' + m + ' has a clock time or a second count (R0)'));
    // R1. follow the arrow: Soak #2 into the first set's bubble and coil, Soak #1 after its 2:14 coil, a carrier into the bubble; nothing that isn't yours
    for (const [jb, seed, more, T0, T1, tag] of [[job('h', null, 2), 3, {}, 30.5, 43.6, 'a Soak #2 healer, 0:30 to 0:43'], [job('r', null, 2), 2, { first: [true, false] }, 30.5, 43.6, 'a Soak #2 ranged, the other coil first'], [job('r', null, 1), 1, {}, 131.9, 137.5, 'a Soak #1 ranged after the 2:14 coil'], [job('m', 'm1', 1), 2, {}, 30.5, 40.5, 'the melee egg carrier'], [job('r', 'r6', 1), 5, {}, 30.5, 40.5, 'a ranged egg carrier']]) {
      dbg.myJob = jb; const slot = dbg.jobSlot(); dbg.hints = true; dbg.at(T0, slot, { seed, east: false, ...more }); const G = dbg.G, n0 = G.log.length; let tg = null;
      while (G.t < T1) { const h = dbg.hint(); tg = h && !h.wait ? h.T : null; dbg.walkTo(tg); dbg.stepOwn(1); G.hp = 100; } /* (as a player would: walk where it points, stand while it says Wait) */
      G.log.slice(n0).filter((m) => /Soul Constrictor|carrying too|missed your coil|Fester Burst: you were outside/.test(m.text)).forEach((m) => R('following the arrow as ' + tag + ' (seed ' + seed + '): ' + clk(m.t) + ' ' + m.text + ' (R1)')); }
    // R2. dodges with words: a small tail's lanes over you, an egg falling on you; the small tails' own bar and call; the falling egg's circle 3 s ahead
    { dbg.myJob = job('h', null, 1); const slot = dbg.jobSlot(); dbg.at(55.4, slot, { seed: 3, east: false }); const S = dbg.S, w = S.waves.find((q) => q.kind === 'tail' && q.t0 > 56.5 && q.t0 < 60);
      if (!w) R('the test lost its setup: no small tail between 0:56.5 and 1:00 (R2)');
      else { dbg.step(Math.round((w.t0 - 1 - dbg.G.t) / 0.05)); const a = w.deg * Math.PI / 180; let p = null; for (let d = 12; d <= 34 && !p; d += 1) { const q = [w.x + Math.cos(a) * d, w.y + Math.sin(a) * d]; if (PG_UL.onPlat(q[0], q[1]) && Math.hypot(q[0], q[1]) < 30) p = q; }
        if (p) { dbg.pos = p; const j = dbg.jobText(); if (!/small tail/i.test(j)) R('standing in a small tail\'s red lane 1 s before it fires (' + clk(dbg.G.t) + '), the job line reads "' + j + '"; it should say to step into a gap (R2)'); } }
      if (!S.warns.some((q) => /^Small tails: /.test(q.text))) R('the small tails have no call (R2)');
      dbg.hints = true; dbg.at(54, slot, { seed: 3, east: false }); const M = dbg.mods() || [], st = M.find((b) => b.name === 'Small tails'), hw = M.find((b) => /^Her waves/.test(b.name) || /Caustic Waves$/.test(b.name));
      if (!st || (hw && st.sp === hw.sp)) R('at 0:54 the small tails have no boss-mod bar of their own (' + M.map((b) => b.name + ' [' + b.sp + ']').join(', ') + '): it shares Her waves\' key and the de-dupe hides it (R2)'); }
    { dbg.myJob = job('h', null, 1); const slot = dbg.jobSlot(); dbg.at(6.5, slot, { seed: 3, east: false }); const e = dbg.G.eggs.find((q) => q.state === 'air' && q.land > 7.2);
      if (!e) R('the test lost its setup: no egg in the air at 0:06.5 (R2)'); else { dbg.step(Math.round((e.land - 2.6 - dbg.G.t) / 0.05)); dbg.pos = [e.x + 1, e.y]; const j = dbg.jobText(); if (!/egg is falling on you/i.test(j)) R('a healer with no egg stands under a falling egg 2.6 s before it lands; the job line reads "' + j + '" (R2)');
        const sh = ctx.pg3dShapes(A3(), e.land - 2.8); if (!sh.some((s) => s.k === 'disc' && Math.abs(s.x - e.x) < 1e-6 && Math.abs(s.y - e.y) < 1e-6 && Math.abs(s.r - 4) < 1e-6)) R('a falling egg\'s 4-yard circle isn\'t on the floor 2.8 s before it lands; it shows from 3 s (R2)'); } }
    // R3 + R4. the arrow from when the step is named, gone only where the game counts you
    { const walkIn = (tag, ok) => { const G = dbg.G; let gone = null; for (let i = 0; i < 400; i++) { const h = dbg.hint(); if (!h) { gone = [G.x, G.y]; break; } const d = Math.hypot(h.T[0] - G.x, h.T[1] - G.y), s = Math.min(0.25, d); dbg.pos = [G.x + (h.T[0] - G.x) / d * s, G.y + (h.T[1] - G.y) / d * s]; }
        if (!gone) R(tag + ': walking along the arrow, it never goes away (R3)'); else { const why = ok(gone); if (why) R(tag + ': the arrow went away at ' + gone.map((v) => v.toFixed(1)).join(', ') + ', ' + why + ' (R3)'); } };
      for (const [jb, seed, more, T, tag] of [[job('h', null, 2), 3, {}, 34.5, 'Soak #2 at the 0:39 bubble'], [job('r', null, 1), 1, {}, 31.2, 'Soak #1 at the 0:39 bubble'], [job('h', null, 2), 4, { first: [true, true] }, 133, 'Soak #2 at the 2:17 coil']]) {
        dbg.myJob = jb; const slot = dbg.jobSlot(); dbg.at(T, slot, { seed, east: false, ...more }); const S = dbg.S, t = dbg.G.t, q = S.bubbles.find((b) => b.at > t), mine = S.soaks.find((s) => s.group.includes(slot) && s.at > t), bub = q && q.at < mine.at;
        const fromT = bub ? Math.min(q.t0 - 2, q.at - 8) : mine.cast - 0.5, c0 = bub ? q.p : [mine.x, mine.y], n0 = Math.hypot(c0[0], c0[1]) || 1; dbg.pos = [c0[0] - c0[0] / n0 * 20, c0[1] - c0[1] / n0 * 20]; /* (20 yards in from it, toward the middle) */
        if (t >= fromT + 0.1 && !dbg.hint()) R(tag + ': 20 yards from it at ' + clk(t) + ', named at ' + clk(fromT) + ', there is no arrow (R4)');
        walkIn(tag, (p) => { const oth = S.soaks.filter((s) => !s.group.includes(slot) && s.at >= dbg.G.t && s.at <= (bub ? q.at + 2 : mine.at + 4) && (bub || s.set === mine.set)); const o = oth.find((s) => Math.hypot(p[0] - s.x, p[1] - s.y) <= s.r);
          return o ? 'inside the coil that isn\'t yours (slams ' + clk(o.at) + ')' : bub ? (Math.hypot(p[0] - q.p[0], p[1] - q.p[1]) > 10 ? 'outside the bubble' : '') : Math.hypot(p[0] - mine.x, p[1] - mine.y) > mine.r ? 'outside your coil' : ''; }); }
      dbg.myJob = job('r', 'r3', 1); dbg.at(71.5, 'r3', { seed: 5, east: false }); { const e = dbg.G.eggs.find((q) => q.id === 'r3' && q.state === 'air'); if (!e) R('the test lost its setup: r3\'s second egg isn\'t in the air at 1:11.5 (R4)'); else { if (dbg.G.t < e.land - 8) dbg.step(Math.round((e.land - 7.6 - dbg.G.t) / 0.05)); const h = dbg.hint(); if (!h || hyp(h.fin || h.T, [e.x, e.y]) > 8) R('7.6 s before your second egg lands (' + clk(e.land) + ') there is no arrow to it (R4)'); } }
      dbg.myJob = job('m', null, 2); const ms = dbg.jobSlot(); dbg.at(143.5, ms, { seed: 3, east: false }); dbg.pos = [0, -20]; { const h = dbg.hint(); if (!h) R('a melee 30 yards from the heart at 2:23.5 gets no arrow to her edge (R4)'); }
      dbg.myJob = job('r', 'r3', 1); dbg.at(12, 'r3', { seed: 3, east: false }); { const e = dbg.G.eggs.find((q) => q.id === 'r3' && q.state === 'floor'); if (e) { dbg.pos = [e.x + 6, e.y]; walkIn('your egg at 0:12', (p) => (Math.hypot(p[0] - e.x, p[1] - e.y) > 2.8 ? 'outside its 2.8-yard pickup ring' : '')); } } }
    // R5. the job line: the first coil's soakers after their slam, a melee with the Rawlings in the tail's sweep
    { dbg.myJob = job('h', null, 1); const slot = dbg.jobSlot(); dbg.at(40.4, slot, { seed: 3, east: false }); const o = dbg.S.soaks.find((s) => s.set === 0 && !s.group.includes(slot)), J = [];
      for (let i = 0; i < 9; i++) { dbg.pos = i ? [o.x + Math.cos(i * 0.8) * 4, o.y + Math.sin(i * 0.8) * 4] : [o.x, o.y]; J.push(dbg.jobText()); } /* (a few spots in it: a small tail's lane over one says dodge first) */
      if (!J.some((j) => /stay out of the second coil/i.test(j)) || J.some((j) => /^Next:/.test(j))) R('a Soak #1 healer standing in the second coil at 0:40.4 reads "' + J[0] + '"; it should say to stay out of it, it\'s the other team\'s (R5)'); }
    { dbg.myJob = job('m', null, 1); const slot = dbg.jobSlot(); dbg.at(41.5, slot, { seed: 3, east: false }); const th = dbg.S.thrash[0], G = dbg.G; dbg.pos = [th.x > 0 ? -30 : 30, 0]; dbg.tgt = null;
      const inS = G.adds.filter((a) => a.kind === 'rawling' && Math.hypot(a.x - th.x, a.y - th.y) < th.r).length; if (!inS) R('the test lost its setup: no Rawling in the tail\'s sweep at 0:41.5 (R5)');
      else { const j = dbg.jobText(); if (!/wait/i.test(j) || /get close/i.test(j)) R('a melee at 0:41.5, with the Rawlings in the 0:49 tail sweep, reads "' + j + '"; it should say to wait and hit them after (R5)'); } }
    // R7 + R8. the teaching call waits for your coil; the heart's call as it opens; the coil call says which is yours, in gold
    { dbg.myJob = job('h', null, 2); const slot = dbg.jobSlot(); dbg.at(40.2, slot, { seed: 3, east: false }); dbg.G.taught = false; dbg.stepOwn(16); const early = dbg.G.taught; dbg.stepOwn(70);
      if (early || !dbg.G.taught) R('a Soak #2 healer\'s "how to attack" call ' + (early ? 'shows at 0:41, 2 s before its own coil slams at 0:43' : 'never shows after its coil') + ' (R7)');
      if (!dbg.S.warns.some((w) => Math.abs(w.t - 145.5) < 0.05 && /heart/i.test(w.text))) R('no call as the heart opens at 2:25.5 (R7)');
      const cw = dbg.S.warns.find((w) => Math.abs(w.t - 36) < 0.05 && /coil/i.test(w.text)), rv = (id) => { if (!cw) return null; const p = typeof cw.per === 'function' ? cw.per(id) : null; return p ? { ...cw, ...p } : cw; };
      const a1 = rv(dbg.S.soaks[0].group.find((id) => id[0] !== 't')), a2 = rv(dbg.S.soaks[1].group.find((id) => id[0] !== 't'));
      if (!a1 || !a2 || a1.text === a2.text || !dbg.myCall || !dbg.myCall(a1) || !dbg.myCall(a2) || !/first/i.test(a1.text) || !/second/i.test(a2.text)) R('the 0:36 coil call reads "' + (a1 && a1.text) + '" for Soak #1 and "' + (a2 && a2.text) + '" for Soak #2; each should say which coil is theirs, in gold (R8)'); }
    // R9. "Mechanic: ORDER", the order big and verb first; gold only when marked as yours
    const R9 = new Set();
    { const VERB = /^(get|stay|run|stand|dodge|wait|cross|soak|hit|step|watch|face|kill|break|pick|go|keep|walk|carry|move|press|turn|take|let|stack|spread|kick)\b/i; dbg.at(1, 'r3', { seed: 3, east: false });
      const ids = ['r3', 'h2', 'm4', 'r1']; dbg.S.warns.forEach((w) => ids.forEach((id) => { const p = typeof w.per === 'function' ? w.per(id) : null, x = p ? { ...w, ...p } : w, m = /^([^:!?]{3,40}):\s*(.+)$/.exec(x.text);
        const ord = m ? m[2].replace(/,?\s*you have \d+ s\b/i, '').split(/[!.](?:\s|$)/)[0] : ''; if (!m || !VERB.test(ord.trim())) R9.add('"' + x.text + '"'); })); }
    [...R9].slice(0, 6).forEach((m) => R('the call ' + m + ' isn\'t "Mechanic: ORDER" with the order (verb first) after the colon (R9)'));
    { const h = dbg.alerts([{ text: 'Venom beam: stay out of the line, you have 4 s!', c: '#ff8f87', by: dbg.G.t + 4 }]); if (/class="pg-al you/.test(h) || /--c:#f3c969/.test(h)) R('a call goes gold because it says "you"; gold is only for one marked as yours (R9)'); }
    // R10. her waves: wait in the green half, then cross now
    { dbg.myJob = job('r', null, 1); const slot = dbg.jobSlot(); dbg.at(53, slot, { seed: 3, east: false }); const wg = dbg.S.wings[0], d = wg.d1, safe = [-d[0] * 14, -d[1] * 14];
      dbg.pos = safe; let j = dbg.jobText(); if (!/wait in the green half/i.test(j)) R('in the safe half at 0:53, before her first waves, the job line reads "' + j + '" (R10)');
      if (!dbg.S.warns.some((w) => Math.abs(w.t - (wg.t + 10.5)) < 0.05 && /\bnow\b/i.test(w.text) && /cross/i.test(w.text))) R('no "cross now" call as the floor swaps behind her first wave (R10)');
      dbg.step(Math.round((wg.t + 10.8 - dbg.G.t) / 0.05)); dbg.pos = safe; j = dbg.jobText(); if (!/cross|green half/i.test(j) || /\b(west|east|north|south)\b/i.test(j)) R('still in the half her second waves come down, as the floor swaps, the job line reads "' + j + '"; it should say cross into the green half now (R10)'); }
  } catch (e) { R('the prompts checks crashed: ' + e.stack); }
  finally { try { dbg.hints = true; dbg.myJob = job('r', 'r3', 1); } catch (e) { /* (no job) */ } }
  // R6. phase 2: your small egg stays shut under its Warden's shield, with no "Shell broken"
  try { const D2 = loadP2(H, pj).dbg; if (!D2 || !D2.P2) R('phase 2 didn\'t open for the egg shell check');
    else { const pk = { side: 'E', role: 'r', egg: 'n6', mal: 1, cry: 1, teth: 'random' }; D2.P2.pick = pk; const me2 = D2.P2.slotOf(pk); D2.at(166, me2, { east: false, seed: 3 }); const G2 = D2.G, n0 = D2.said ? D2.said().length : 0; let open = null;
      // (your own steps, not the autopilot's: dbg.step keeps the "Shell broken" float quiet, so this check could never fail. And the egg given a shell as phase 2's
      //  had one (e.shp; it keeps its shield in e.hs since the merge), so the check still reads practice.js's guard, eggLocked. The review of the prompts fixes, Nov 16)
      { const e0 = G2.eggs.find((q) => q.id === me2 && q.state === 'floor'); if (!e0 || !e0.lock) R('the test lost its setup: phase 2\'s small egg isn\'t on the floor under its Warden\'s shield at 2:46 (R6)'); else e0.shp = 1; }
      while (G2.t < 214) { const e = G2.eggs.find((q) => q.id === me2 && q.state === 'floor'); if (e && G2.p2.wdead && G2.p2.wdead[pk.side] == null && G2.t > 172 && e.shell <= G2.t && open == null) open = G2.t; D2.stepOwn(5); G2.hp = 100; }
      if (open != null) R('phase 2\'s small egg opens at ' + clk(open) + ' while its Warden still lives (this file\'s shell code wore its shell down under the shield) (R6)');
      if (D2.said && D2.said().slice(n0).some((x) => /Shell broken/.test(x.text))) R('phase 2 says "Shell broken" while your egg is still under its Warden\'s shield (R6)'); } }
  catch (e) { R('the phase 2 egg shell check crashed: ' + e.message); }
}

// T. The review of the prompts fixes, Nov 16 (the skeptic's read of check R's fixes, "review p1"). Each failed on the code before its fix, bc75ad8c (T9 to T13
//    guard fixes of the prompts audit that check R left unguarded: they fail on the code before it, 08a45c58~1):
//    T1. a line stayed up 2.5 s whatever it said, so "Wait: let it pass, then go." stayed with the arrow back and "Go here" on the floor (a Soak #2 healer at
//        1:04, seed 3; a melee carrier on Soak #2 at 1:04.6, seed 7). Wait is never held now, and nothing is held over a Wait.
//    T2. "Get in your gold coil now!" and "Get in the yellow bubble now!" while the floor said Wait (2:14.1, a melee carrier on Soak #2, seed 7; 0:36, r6, seed 5).
//    T3. "Stay in the yellow bubble", "Stand in your coil" and "Wait outside the first coil" with the arrow still pointing away, up to 27 yards: the job line
//        used its own, bigger circles. It uses the arrow's own test now; in the circle but off the arrow's spot it says to step onto its gold ring.
//    T4. NEXT named the step you were on whenever a dodge, wave or target line had the job line ("Then: get in the yellow bubble" to a healer standing in it).
//    T5. a call's order cut at its comma, the rest on the small line: "STAY OUT OF THE FIRST ONE" for Soak #2's coil, "FACE HER NEW SPOT".
//    T6. big calls that weren't "Mechanic: Order" ("A Viper hatched! Kill it now: ...", "This ring is your egg's 3 yards. ..."), and the ring call not gold.
//    T7. job lines over 12 words ("Stand in your coil (the first to appear) until it slams. Your egg breaks there.", 15).
//    T8. one name per thing: "it's the other team's" next to "it isn't yours" and the floor's "Not yours"; "Her wave:" next to the bar's "Her waves"; a small
//        tail's "clear side" of nothing.
//    T9. walking where the arrow points never walks you into a wave (R1 counted no wave hits).
//    T10. the 2:16 bubble call waits for a Soak #2 player's 2:17 coil.
//    T11. the how-to-attack call names what is up (it said "Rawlings!" with a Viper or the heart up).
//    T12. the floor says "Not yours" over the coil that isn't yours and "Your coil" over yours.
//    T13. the floats as you break your egg and pick it up give no order ("Shell broken: walk over your egg to pick it up" talked over the job line).
//    T14. "Too close to ...'s egg" came and went three times in 0.7 s at 0:38 as r3 stood 3.6 yards from another carrier; it holds till 4.2 yards now.
//    T15. "Her waves: cross into the green half now!" went to players already in it.
function reviewChecks(H, bad, pj, clk, hyp, p3j) {
  const T = (m) => bad(m + ' (the review of the prompts fixes, Nov 16, check T)'), rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8'), PJ = pj || rd('practice.js'), HOOK = 'window.__pgDbg = { ';
  if (!PJ.includes(HOOK)) { T('the test can\'t read the job line: no "' + HOOK + '" in src/practice.js'); return; }
  // (the job line as the screen shows it, after hud()'s hold, and whether NEXT names the step NOW is on)
  const XH = 'jobText: () => jobText(), shownJob: () => { hud(true); return G.jobShow ? G.jobShow.text : \'\'; }, shownDodge: () => !!G.jobShow && G.jobShow.r === \'a\', nextIsNow: () => { if (typeof curStep !== \'function\' || typeof stepSay !== \'function\') return false; const c = curStep(G.t), n = nextText(jobPick()); return !!c && !!n && n === stepSay(c); }, ';
  let L0; try { L0 = load(H, PJ.replace(HOOK, HOOK + XH)); vm.runInContext((p3j || rd('practice3d.js')) + '\nthis.pg3dShapes = pg3dShapes;', L0.ctx); } catch (e) { T('the game would not run for the review checks (' + e.message + ')'); return; }
  const dbg = L0.dbg, ctx = L0.ctx, job = (role, egg, soak) => ({ role, egg, soak: [soak, soak], fb: [0, 0] }), WAIT = 'Wait: let it pass, then go.';
  const STAND = /^(Stay in the yellow bubble|Stand in your coil|Wait outside the|Wait here)/, NOW = /\bnow[.!]$/, words = (s) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  const VERB = /^(get|stay|run|stand|dodge|wait|cross|soak|hit|step|watch|turn|kill|break|pick|go|keep|walk|carry|move|press|take|let|stack|spread|kick)\b/i, unesc = (s) => String(s || '').replace(/&#39;/g, '\'').replace(/&amp;/g, '&');
  const sub = (tag, f) => { try { f(); } catch (e) { T('the ' + tag + ' check crashed: ' + e.message); } };
  const fmt = (x) => { const m = /^([^:!?]{3,40}):\s*(.+)$/.exec(x || ''), ord = m ? m[2].split(/[!.](?:\s|$)/)[0].trim() : ''; return !!m && VERB.test(ord); };
  const BIG = [...PJ.matchAll(/bigCall\('((?:[^'\\]|\\.)*)'(?:,\s*'([^']*)')?/g)].map((m) => [m[1].replace(/\\'/g, '\''), m[2] || '']), lines = new Map(), saw = (x, where) => { if (x && !lines.has(x)) lines.set(x, where); };
  const A3 = () => dbg.v3a || { G: dbg.G, S: dbg.S, me: dbg.role.id, nm: (id) => id, rl: (id) => id[0], clsC: () => null, hint: () => dbg.hint(), spot: () => null, target: null, bossAt: () => ({ p: L0.PG_UL.boss.slice(), up: true }), tailAt: (t) => ({ p: dbg.S.FT(L0.PG_UL.tail, t), up: true }) };
  try {
    // T1 to T4 and T9: walk where the arrow points, stand while it says Wait, and read the screen every step
    const got = new Map(), put = (k, m) => { if (!got.has(k)) got.set(k, m); };
    // (each job's walks in one run: the autopilot plays the gaps between them)
    const RUNS = [[job('h', null, 2), 3, [[30.5, 44], [58, 72], [127, 138]], 'a Soak #2 healer'], [job('m', 'm1', 2), 7, [[30.5, 44], [58, 72], [127, 138]], 'a melee carrier on Soak #2'],
      [job('r', 'r6', 1), 5, [[30.5, 41]], 'the r6 carrier'], [job('h', null, 1), 4, [[127, 138]], 'a Soak #1 healer'], [job('r', 'r3', 1), 3, [[30.5, 41]], 'the r3 carrier']];
    for (const [jb, seed, wins, tag] of RUNS) { dbg.myJob = jb; const slot = dbg.jobSlot(); dbg.hints = true; dbg.at(wins[0][0], slot, { seed, east: false }); const G = dbg.G, id = tag + ' (seed ' + seed + ')';
     for (const [T0, T1] of wins) { while (G.t < T0 - 1e-6) dbg.step(1); let dodged = -99;
      while (G.t < T1) { const h0 = dbg.hint(), walking = !!h0 && !h0.wait; dbg.walkTo(walking ? h0.T : null); const nl = G.log.length; dbg.stepOwn(1); G.hp = 100;
        // (T9: a wave that hits you as you walk where the arrow points, with no dodge line in the last 1.5 s: the arrow walked you into it unwarned. A wave that
        //  would have hit you standing still too is the dodge line's job, and this walker only follows the arrow)
        if (walking && G.t - dodged > 1.5) G.log.slice(nl).forEach((m) => { if (/Caustic Waves/.test(m.text)) put('t9' + id + m.t, 'walking where the arrow points, with no dodge line, ' + id + ' took "' + m.text + '" at ' + clk(m.t) + ' (T9)'); });
        const sh = dbg.shownJob(), h = dbg.hint(), arrow = !!h && !h.wait, at = id + ' at ' + clk(G.t); saw(sh, at); if (dbg.shownDodge()) dodged = G.t;
        if (sh === WAIT && arrow) put('t1' + id, at + ': the job line holds "' + WAIT + '" with the arrow back, "Go here" ' + h.d.toFixed(1) + ' yards away (T1)');
        if (NOW.test(sh) && h && h.wait) put('t2' + id + sh, at + ': "' + sh + '" while the floor says Wait (T2)');
        if (STAND.test(sh) && arrow) put('t3' + id + sh.slice(0, 14), at + ': "' + sh + '" while the arrow points ' + h.d.toFixed(1) + ' yards away (T3)');
        if (dbg.nextIsNow()) put('t4' + id, at + ': NEXT reads "' + dbg.next() + '" under "' + sh + '", the step you\'re on (T4)'); } } }
    // (T2 off the walks too: round your step's spot while it's due, wherever the floor says Wait the job line says it, never "now": the healer's second coil at
    //  0:40.4, seed 3, and the 0:39 bubble at 0:36.1, seed 4, both read "now" under a Wait 0.5 s apart on the old code)
    for (const [jb, seed, kind, T0] of [[job('h', null, 2), 3, 'coil', 40.4], [job('h', null, 2), 4, 'bubble', 36.1]]) { dbg.myJob = jb; const slot = dbg.jobSlot(); dbg.at(T0, slot, { seed, east: false });
      const G = dbg.G, S = dbg.S, st = kind === 'coil' ? S.soaks.find((s) => s.group.includes(slot) && s.at > G.t) : S.bubbles.find((q) => q.at > G.t), c = kind === 'coil' ? [st.x, st.y] : st.p; let w = 0;
      for (let k = 0; k < 4; k++) { for (let r = 12; r <= 32; r += 4) for (let i = 0; i < 16; i++) { const p = [c[0] + Math.cos(i * Math.PI / 8) * r, c[1] + Math.sin(i * Math.PI / 8) * r]; if (!L0.PG_UL.onPlat(p[0], p[1])) continue; dbg.pos = p; const h = dbg.hint(); if (!h || !h.wait) continue;
        w++; const j = dbg.jobText(); if (NOW.test(j)) put('t2' + kind + slot + seed, 'a Soak #2 healer (seed ' + seed + ') ' + p.map((v) => v.toFixed(0)).join(', ') + ' from the middle at ' + clk(G.t) + ', your ' + kind + ' due: "' + j + '" while the floor says Wait (T2)'); } dbg.stepOwn(5); }
      if (!w) T('the test lost its setup: no spot round the ' + kind + ' at ' + clk(T0) + ' (seed ' + seed + ') where the floor says Wait (T2)'); }
    ['t1', 't2', 't3', 't4', 't9'].forEach((k) => [...got.entries()].filter(([q]) => q.startsWith(k)).slice(0, 3).forEach(([, m]) => T(m)));
    // T5. every call's order whole on the big line (worked out for each role, and for her waves' call, where you stand)
    sub('T5', () => { dbg.at(1, 'r3', { seed: 3, east: false }); const cut = new Set(), ids = ['r3', 'h2', 'm4', 'r1', 't1'], pts = [undefined, { x: 30, y: 0 }, { x: -30, y: 0 }, { x: 0, y: 30 }, { x: 0, y: -30 }];
      const whole = (text, c) => { const m = /^([^:!?]{3,40}):\s*(.+)$/.exec(text); if (!m) return; const want = m[2].replace(/,?\s*you have \d+ s\b/i, '').trim().split(/[!.](?:\s|$)/)[0].trim(), big = unesc(dbg.alertTexts([{ text, c, by: null }])[0].order); if (big !== want) cut.add('"' + text + '" shows "' + big + '" in big letters and the rest under it'); };
      dbg.S.warns.forEach((w) => ids.forEach((id) => pts.forEach((p) => { const q = typeof w.per === 'function' ? w.per(id, p) : null; if (q !== false) whole((q && q.text) || w.text, w.c); })));
      BIG.forEach(([x, c]) => whole(x, c)); [...cut].slice(0, 6).forEach((m) => T('the call ' + m + ' (T5)')); });
    // T6. phase 1's own big calls, "Mechanic: Order"; the Viper's as it hatches
    sub('T6', () => { if (BIG.length < 2) T('the test can\'t find phase 1\'s big calls (bigCall(\'...\')) in src/practice.js (T6)');
      BIG.forEach(([x]) => { if (!fmt(x)) T('the big call "' + x + '" isn\'t "Mechanic: Order" with the order, verb first, after the colon (T6)'); });
      dbg.myJob = job('r', 'r3', 1); dbg.at(12, 'r3', { seed: 3, east: false }); dbg.G.lastWarn = null; if (!dbg.hatchMine()) T('the test lost its setup: r3 has no egg to hatch at 0:12 (T6)');
      else { const w = dbg.G.lastWarn, x = w && w.all ? w.all[0] : ''; if (!fmt(x)) T('as a Viper hatches the big call reads "' + x + '"; it should be "Mechanic: Order" (T6)'); } });
    // T13 + T6's ring call: break your egg and pick it up by hand; the floats give no order, and the ring's call is "Mechanic: Order" in gold, yours
    sub('T13', () => { dbg.myJob = job('r', 'r3', 1); dbg.at(8, 'r3', { seed: 3, east: false }); const G = dbg.G, e = G.eggs.find((q) => q.id === 'r3' && q.set === 0), n0 = dbg.said().length;
      if (!e) T('the test lost its setup: r3 has no first egg at 0:08 (T13)');
      else { while (G.t < e.land + 0.3) dbg.stepOwn(1); G.x = e.x; G.y = e.y; G.tgt = 'egg'; for (let i = 0; i < 12 && e.state === 'floor'; i++) { G.gcd0 = -99; dbg.atk(); dbg.stepOwn(6); G.hp = 100; } dbg.stepOwn(4);
        const fl = dbg.said().slice(n0).map((x) => x.text), w = G.lastWarn, ring = w && w.items ? w.items.find((it) => /ring/i.test(it.text)) : null;
        if (e.state !== 'held') T('the test lost its setup: hitting r3\'s egg at 0:1x by hand didn\'t let it pick the egg up (' + e.state + ') (T13)');
        else { fl.filter((x) => /^(Shell broken|Egg picked up)/.test(x) && /:\s*\S/.test(x)).forEach((x) => T('the float "' + x + '" gives an order, over the job line (T13)'));
          if (!ring || !fmt(ring.text) || !dbg.myCall(ring)) T('picking up your egg, the ring\'s call reads "' + (ring ? ring.text : (w && w.all || []).join(' | ')) + '"' + (ring && !dbg.myCall(ring) ? ', not gold' : '') + '; it should be "Mechanic: Order", gold, yours (T6)'); } } });
    // T7 + T8: forced spots for lines the walks don't reach
    sub('T7 and T8', () => { dbg.myJob = job('r', 'r3', 1); dbg.at(25, 'r3', { seed: 3, east: false }); saw(dbg.jobText(), 'r3 carrying at 0:25');
      dbg.at(39.2, 'r3', { seed: 3, east: false }); const sp = dbg.stepSpot(); if (sp) { dbg.pos = sp.T; dbg.G.eggs.forEach((e) => { const b = e.state === 'held' && e.who && e.who !== 'r3' ? dbg.G.bots[e.who] : null; if (b && hyp([b.x, b.y], sp.T) < 6) { b.x += 20; } }); /* (the other carriers out of the way: this reads the coil's own line) */ const j = dbg.jobText(); saw(j, 'r3 on its coil spot at 0:39.2'); if (!/^Stand in your coil/.test(j)) T('the test lost its setup: r3 on its spot in its coil at 0:39.2 reads "' + j + '" (T7)'); }
      dbg.myJob = job('m', null, 1); const ms = dbg.jobSlot(); dbg.at(102.5, ms, { seed: 3, east: false }); const th = dbg.S.thrash[1]; dbg.pos = [th.x * 0.6, th.y * 0.6]; { const j = dbg.jobText(); saw(j, 'a melee by her tail at 1:42.5'); if (!/^Run to the Wretch/.test(j)) T('the test lost its setup: a melee by her tail at 1:42.5, the 1:48 bubble stacking, reads "' + j + '" (T7)'); }
      // (her waves' lane over you, 1 s before the first wave reaches you)
      dbg.myJob = job('r', null, 1); const rs = dbg.jobSlot(); dbg.at(54.5, rs, { seed: 3, east: false }); { const w = dbg.S.waves.find((q) => q.kind === 'her' && q.t0 >= 55), a = w ? w.deg * Math.PI / 180 : 0; let j = '';
        for (let k = 0.5; k <= 2.5 && !/^Her wave/.test(j); k += 0.25) { const d = w.v * (dbg.G.t + k - w.t0) + 1, p = [w.x + Math.cos(a) * d, w.y + Math.sin(a) * d]; if (!L0.PG_UL.onPlat(p[0], p[1])) continue; dbg.pos = p; j = dbg.jobText(); }
        saw(j, 'in her waves\' lane at 0:54.5'); if (!/^Her waves: /.test(j)) T('in her waves\' lane just before they reach you, the job line reads "' + j + '"; it should start "Her waves:", the bar\'s and the call\'s name (T8)'); }
      // (a small tail's lane over you in your coil: a Soak #1 healer, the second coils)
      dbg.myJob = job('h', null, 1); const hs = dbg.jobSlot(); let tl = '';
      dbg.at(130.5, hs, { seed: 3, east: false }); for (let T0 = 130.5; T0 <= 133.5 && !tl; T0 += 0.5) { while (dbg.G.t < T0 - 1e-6) dbg.step(1); const s = dbg.S.soaks.find((q) => q.group.includes(hs) && q.at > T0); if (!s) break;
        for (let r = 0; r <= 8 && !tl; r += 2) for (let i = 0; i < 12 && !tl; i++) { dbg.pos = [s.x + Math.cos(i * Math.PI / 6) * r, s.y + Math.sin(i * Math.PI / 6) * r]; const j = dbg.jobText(); if (/^Small tail: /.test(j) && /circle/.test(j)) tl = j; } }
      if (!tl) T('the test lost its setup: no small tail\'s lane over a Soak #1 healer in its 2:14 coil (T8)'); else { saw(tl, 'a small tail over your coil'); if (/clear side/.test(tl) || !/red lane/.test(tl)) T('a small tail\'s lane over you in your coil reads "' + tl + '"; it should name the red lane to step out of (T8)'); }
      // (the coil that isn't yours: one name for it)
      dbg.myJob = job('h', null, 1); const h1 = dbg.jobSlot(); dbg.at(40.4, h1, { seed: 3, east: false }); const o = dbg.S.soaks.find((s) => s.set === 0 && !s.group.includes(h1)), J = [];
      for (let i = 0; i < 9; i++) { dbg.pos = i ? [o.x + Math.cos(i * 0.8) * 4, o.y + Math.sin(i * 0.8) * 4] : [o.x, o.y]; J.push(dbg.jobText()); }
      if (J.some((j) => /other team/.test(j)) || !J.some((j) => /it isn't yours/.test(j))) T('standing in the coil that isn\'t yours at 0:40.4 reads "' + (J.find((j) => /coil/.test(j)) || J[0]) + '"; it should say "it isn\'t yours", as the floor\'s "Not yours" (T8)');
      [...lines.entries()].filter(([x]) => words(x) > 12).slice(0, 6).forEach(([x, where]) => T('the job line "' + x + '" (' + where + ') has ' + words(x) + ' words; 12 at most (T7)')); });
    // T10. the 2:16 bubble call waits for a Soak #2 player's 2:17 coil
    sub('T10', () => { dbg.myJob = job('h', null, 2); const slot = dbg.jobSlot(); dbg.at(135.5, slot, { seed: 4, east: false }); dbg.G.warnQ = []; dbg.G.lastWarn = null; /* (at() fast-forwards with one warns() at the end, which queues every call so far: clear them) */ const G = dbg.G, mine = dbg.S.soaks.find((s) => s.set === 1 && s.group.includes(slot)); let first = null;
      while (G.t < 139.5 && first == null) { dbg.stepOwn(1); G.hp = 100; const w = dbg.warnsNow(); if (w && w.all && w.all.some((x) => /^Fester Burst: get in the bubble/.test(x))) first = G.t; }
      if (!mine || mine.at < 136.5) T('the test lost its setup: a Soak #2 healer should soak the 2:17 coil (T10)'); else if (first == null || first < mine.at - 0.3) T('the 2:20 bubble\'s call shows at ' + (first == null ? 'no time before 2:19.5' : clk(first)) + ', before a Soak #2 healer\'s coil slams at ' + clk(mine.at) + '; it should wait for it (T10)');
      // (T11 on the same run: the how-to-attack call with the heart open)
      while (G.t < 146.5) dbg.step(1); G.taught = false; G.lastWarn = null; dbg.stepOwn(2);
      const x = G.lastWarn && G.lastWarn.all ? G.lastWarn.all[0] : ''; if (!/heart/i.test(x)) T('with the heart open at 2:26.5, the how-to-attack call reads "' + x + '"; it should name the heart (T11)'); });
    // T11. the how-to-attack call names what is up: a Viper, and phase 2's own adds
    sub('T11', () => { let x = ''; dbg.myJob = job('r', 'r3', 1); dbg.at(12, 'r3', { seed: 3, east: false }); dbg.hatchMine(); dbg.G.taught = false; dbg.G.lastWarn = null; dbg.stepOwn(2); x = dbg.G.lastWarn && dbg.G.lastWarn.all ? dbg.G.lastWarn.all[0] : '';
      if (!/Viper/.test(x) || /Rawling/.test(x)) T('with a Viper up at 0:12, the how-to-attack call reads "' + x + '"; it should name the Viper (T11)');
      // (phase 2, its own add from its DPS_SAY lines: "Rawlings! Press Tab..." with the Warden up, over "Kick Malice")
      const D2 = loadP2(H, pj).dbg, pk = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'none' }; D2.P2.pick = pk; const me2 = D2.P2.slotOf(pk); D2.at(186, me2, { east: false, seed: 3 }); D2.G.taught = false; D2.G.lastWarn = null; D2.stepOwn(2);
      x = D2.G.lastWarn && D2.G.lastWarn.all ? D2.G.lastWarn.all[0] : ''; if (!/Warden|Doomscale|Clutch/.test(x) || /Rawling/.test(x)) T('in phase 2 at 3:06 the how-to-attack call reads "' + x + '"; it should name phase 2\'s own add up, the Warden, the Clutches or the Doomscales (T11)'); });
    // T12. "Not yours" and "Your coil" on the floor
    sub('T12', () => { dbg.myJob = job('h', null, 1); const slot = dbg.jobSlot(); dbg.at(39.7, slot, { seed: 3, east: false }); let L = []; /* (both coils are up from 0:39.4 till the first slams) */ try { L = ctx.pg3dShapes(A3(), dbg.G.t).filter((s) => s.k === 'label'); } catch (e) { T('pg3dShapes crashed: ' + e.message + ' (T12)'); }
      const mine = dbg.S.soaks.find((s) => s.set === 0 && s.group.includes(slot)), oth = dbg.S.soaks.find((s) => s.set === 0 && !s.group.includes(slot)), near = (s, txt) => L.some((q) => q.text === txt && Math.hypot(q.x - s.x, q.y - s.y) < 1);
      if (!near(oth, 'Not yours') || !near(mine, 'Your coil')) T('at 0:39.7 the floor over the coils reads ' + JSON.stringify(L.filter((q) => /coil|yours|soak/i.test(q.text)).map((q) => q.text)) + '; "Your coil" over yours and "Not yours" over the other (T12)'); });
    // T14. the ring warning holds till you're 4.2 yards clear
    sub('T14', () => { dbg.myJob = job('r', 'r3', 1); dbg.at(30, 'r3', { seed: 3, east: false }); const G = dbg.G, other = G.eggs.find((e) => e.state === 'held' && e.who && e.who !== 'r3');
      if (!other || !G.eggs.some((e) => e.who === 'r3' && e.state === 'held')) T('the test lost its setup: no two carriers at 0:30 (T14)');
      else { const b = G.bots[other.who], at = (d) => { b.x = G.x + d; b.y = G.y; G.mv = null; G.still = true; return /^Too close/.test(dbg.jobText()); }, seq = [3.5, 3.8, 3.5, 3.9, 4.5].map(at);
        if (seq.join() !== 'true,true,true,true,false') T('another carrier at 3.5, 3.8, 3.5, 3.9 then 4.5 yards: "Too close" reads ' + seq.map((v) => (v ? 'on' : 'off')).join(', ') + '; it should stay up, not come and go, till 4.2 yards (T14)');
        at(3.5); for (let i = 0; i < 24; i++) { b.x = G.x + 3.8; b.y = G.y; dbg.stepOwn(1); G.hp = 100; } if (at(3.8)) T('a carrier settled 3.8 yards from you keeps "Too close" up after 1.2 s; it holds a second, not for good (T14)'); } });
    // T15. "cross now" only to players still in the half her second waves come down
    sub('T15', () => { dbg.myJob = job('r', null, 1); const slot = dbg.jobSlot(); dbg.at(1, slot, { seed: 3, east: false }); const wg = dbg.S.wings[0], d = wg.d1, cw = dbg.S.warns.find((w) => Math.abs(w.t - (wg.t + 10.5)) < 0.05 && /cross/i.test(w.text));
      dbg.at(wg.t + 10.2, slot, { seed: 3, east: false }); const G = dbg.G; G.warnQ = []; G.lastWarn = null; let seen = '';
      while (G.t < wg.t + 12) { dbg.pos = [d[0] * 14, d[1] * 14]; dbg.stepOwn(1); G.hp = 100; const w = dbg.warnsNow(); if (w && w.all) seen += w.all.join(' | ') + ' | '; } /* (already across: in the half her first waves have passed) */
      if (/cross into the green half now/i.test(seen)) T('a player already in the green half as her waves swap gets "Her waves: cross into the green half now!" (T15)');
      const still = cw && typeof cw.per === 'function' ? cw.per(slot, { x: -d[0] * 14, y: -d[1] * 14 }) : null; if (!cw || (still && !/cross into the green half now/i.test(still.text))) T('a player still in the half her second waves come down no longer gets "cross into the green half now" (T15)'); });
  } catch (e) { T('the review checks crashed: ' + e.stack); }
  finally { try { dbg.hints = true; dbg.myJob = job('r', 'r3', 1); } catch (e) { /* (no job) */ } }
}

// S. No clock time and no second count in a mistake while you play, in any part (Flex, Nov 16: "i feel like the game confuses people saying timestamps"): the
//    float as it happened and the death card read "You didn't kick Malice (3:04): it hit everyone every second for 6 s.", the card under the time of the death,
//    "3:09". Played runs of all four parts, each mistake as its float showed it and on a death card read back from the card; the result screen keeps when.
function mistakeTimes(H, bad, pj) {
  const SB = (m) => bad(m + ' (mistakes on screen, Nov 16, check S)'); H = H || require('./site-helpers.js');
  const rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n'), GJ = rd('guides.js'), CLOCK = /\b\d{1,2}:\d{2}\b/, SECS = /\b\d+(?:\.\d+)?\s?s\b/, timey = (x) => CLOCK.test(x) || SECS.test(x);
  const fromGuides = ['GDZ_ROLE', 'GDZ_RAID', 'gdzName', 'UX', 'UX_MEL', 'UX_HOME', 'UX_ZONE', 'UL_EDGE', 'UL_FB', 'GDZ_FLOOR', 'UL_EGGS', 'UL_RIM', 'UL_SOAK', 'UL_CMK', 'UL_PAT'].map((n) => H.grab(n, GJ)).join('\n');
  const strip = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&#39;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  // (a page that remembers what it's given, as tests/practice-shared.js's recLoad, with all four parts: the death card is read back from the card itself)
  const page = (part) => { const made = [], el = () => { const kids = new Map(), o = { innerHTML: '', className: '', textContent: '', style: {}, dataset: {}, isConnected: true, kids }, cl = { add() {}, remove() {}, toggle() {}, contains: (c) => String(o.className).split(/\s+/).includes(c) };
      const p = new Proxy(o, { get: (t, k) => (k in t ? t[k] : k === 'classList' ? cl : k === 'querySelector' ? (s) => { if (!kids.has(s)) kids.set(s, el()); return kids.get(s); } : k === 'querySelectorAll' ? () => [] : stub()), set: (t, k, v) => { if (k === 'innerHTML') kids.clear(); t[k] = v; return true; } }); made.push(p); return p; };
    const raf = [], doc = new Proxy({}, { get: (t, k) => (k === 'createElement' ? () => el() : stub()) }), win = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
    class Img { constructor() { this.complete = false; this.naturalWidth = 0; } }
    const ctx = vm.createContext({ document: doc, window: win, navigator: stub(), performance, Image: Img, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: (f) => raf.push(f), cancelAnimationFrame: (i) => { if (i) raf[i - 1] = null; }, localStorage: stub(), E: { CLASSES: {} }, console, MouseEvent: function () {} });
    vm.runInContext(H.grab('esc') + '\n' + H.grab('guideSlug') + '\n' + fromGuides + '\n' + (pj || rd('practice.js')) + '\n' + rd('practice3d.js') + '\n' + rd('practice-p2.js') + '\n' + rd('practice-int.js') + '\n' + rd('practice-p3.js'), ctx);
    vm.runInContext('pgOpen(null, "Ula\'tek", "m"' + (part ? ', "' + part + '"' : '') + ')', ctx);
    let cur = 0, now = 1000; const frames = (n) => { while (n-- > 0 && cur < raf.length) { const f = raf[cur++]; if (f) f(now += 50); else n++; } };
    return { dbg: win.__pgDbg, frames, card: () => { const o = made.find((e) => e.kids.has('.pg-card')); return o ? o.kids.get('.pg-card') : null; } }; };
  // (each part played twice standing still, the most mistakes; phase 1's carrier and Soak #2 melee, phase 2's both ledges, the intermission's egg teams, phase 3's soakers)
  const PARTS = [[null, 'phase 1', [['r3', 3], ['m1', 7]]], ['m2', 'phase 2', [[{ side: 'E', role: 'r', egg: 'n6', mal: 1, cry: 1, teth: 'random' }, 3], [{ side: 'W', role: 'm', egg: 'n4', mal: 1, cry: 1, teth: 'solo' }, 2]]],
    ['mint', 'the intermission', [[{ role: 'r', team: 'P', egg: true, pat: 2 }, 4], [{ role: 'm', team: 'Y', egg: true, pat: 1 }, 5]]], ['m3', 'phase 3', [[{ role: 'r', soak: 1, bite: 'random', kick: 0 }, 3], [{ role: 'm', soak: 2, bite: 'random', kick: 1 }, 5]]]];
  const found = new Map(); let timed = 0;
  for (const [part, name, runs] of PARTS) { let P; try { P = page(part); } catch (e) { SB('the game would not open ' + name + ' for the check (' + e.message + ')'); continue; }
    const d = P.dbg, logs = new Map();
    for (const [pk, seed] of runs) { try { let id = pk; if (part) { d.P2.pick = pk; id = d.P2.slotOf(pk); } const n0 = d.said().length; d.sim(id, false, false, seed);
      d.said().slice(n0).forEach((x) => { if (timey(x.text)) found.set(name + '|f|' + x.text, name + ', the float "' + x.text + '"'); }); d.G.log.forEach((m) => { if (!logs.has(m.text)) logs.set(m.text, m); }); } catch (e) { SB(name + ' crashed in a played run (' + e.message + ')'); } }
    if (logs.size < 3) { SB('the test lost its setup: ' + name + '\'s played runs made ' + logs.size + ' mistakes to read'); continue; }
    if ([...logs.values()].some((m) => timey(m.text + ' ' + (m.tip || '')))) timed++;
    // (each one as the newest hit, so it is what the death card says killed you)
    // (the death doesn't move the clock, so each goes in a hair after anything already there, and comes out again after its card)
    const G = d.G; for (const m of logs.values()) { G.adds = G.adds.filter((a) => a.kind !== 'viper'); const q = { t: G.t + 0.005, kind: 'x', text: m.text, tip: m.tip }; G.log.push(q); G.hp = -1; d.play(); P.frames(2); const c = P.card(), h = c ? c.innerHTML : ''; G.log.splice(G.log.indexOf(q), 1);
      if (!/You died/.test(h)) { found.set(name + '|nocard', name + ': no death card came up to read'); break; } const w = strip(h).replace(/\s*Keep going\s*End the run\s*$/, '');
      if (w.indexOf(strip(m.text).slice(0, 12)) < 0 && w.indexOf(strip(m.text).replace(/\s*\(\d+:\d{2}\)/g, '').slice(0, 12)) < 0) { found.set(name + '|wrong', name + ': the death card read "' + w + '" for "' + m.text + '", so the test can\'t read each mistake on it'); break; }
      if (timey(w)) found.set(name + '|c|' + m.text, name + ', the death card "' + w + '"'); } }
  PARTS.forEach(([, name]) => [...found.entries()].filter(([k]) => k.startsWith(name + '|')).slice(0, 4).forEach(([k, m]) => SB(m + (/\|(nocard|wrong)$/.test(k) ? '' : ' has a clock time or a second count'))));
  if (timed < 2) SB('the test lost its setup: only ' + timed + ' part(s) made a mistake with a time in the result screen\'s words, so the screen\'s clean-up is hardly tried');
}

module.exports = checks; module.exports.load = load; module.exports.promptsAudit = promptsAudit; module.exports.stub = stub; module.exports.releaseSweep = releaseSweep; module.exports.releaseCheck = releaseCheck; module.exports.reviewChecks = reviewChecks; module.exports.mistakeTimes = mistakeTimes;

if (require.main === module) {
  let n = 0; const t0 = Date.now(); checks(null, (a, b, t) => { n++; console.log('✗ ' + t); });
  console.log(n ? n + ' problem(s)' : 'practice game: all checks pass', '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
  if (process.argv.includes('--audit')) { const { dbg } = load(); for (const [east, seed] of [[false, 3], [true, 3], [false, 11], [true, 29]]) { const a = dbg.audit(east, seed), S = dbg.S; console.log('east ' + east + ' seed ' + seed + ' tail ' + (S.tailEast ? 'east' : 'west') + ' first ' + JSON.stringify(S.first) + ': ' + (a.length ? '\n  ' + a.join('\n  ') : 'clean')); } }
  process.exitCode = n ? 1 : 0;
}
