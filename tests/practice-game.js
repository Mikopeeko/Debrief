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
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src');

// (a stand-in for the page: every element, canvas and call answers with another stand-in, and reads as 0 in a sum)
function stub() {
  const f = function () { return stub(); };
  return new Proxy(f, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : k === Symbol.iterator ? function* () {} : stub()), set: () => true, apply: () => stub() });
}
function load(H, pj) {
  H = H || require('./site-helpers.js');
  const PJ = pj || fs.readFileSync(path.join(SRC, 'practice.js'), 'utf8'), GJ = fs.readFileSync(path.join(SRC, 'guides.js'), 'utf8');
  const fromGuides = ['GDZ_ROLE', 'GDZ_RAID', 'gdzName', 'UX', 'UX_MEL', 'UX_HOME', 'UX_ZONE', 'UL_EDGE', 'UL_FB'].map((n) => H.grab(n, GJ)).join('\n');
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
  if (!/0:39, 1:10, 1:48 and 2:20/.test(PJ) || /1:14|2:22/.test(PJ)) bad('the start card\'s bubble times don\'t read 0:39, 1:10, 1:48 and 2:20 (check A)');
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
  //    your egg area and one coil team. Your egg area picks your place, your team holds (egg carriers take the first coil in set 1, where the bubble
  //    sits on it), both teams stay even, your bubble spot is picked for you, and the run plays that job clean. (Before: three tabs, two maps and
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
    if (team(0) !== '1' || team(1) !== '2') bad('an egg carrier on coil team 2 plays as team ' + (team(0) || 'none') + ', then ' + (team(1) || 'none') + '; carriers take the first coil in set 1 (in the Wretch\'s bubble), then team 2 (check D)');
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
    dbg.myJob = { role: 'r', egg: 'r3', soak: [2, 2], fb: [0, 0] }; if (!/coil team 1, then team 2$/.test(dbg.jobRole().job)) bad('a carrier on team 2 reads "' + dbg.jobRole().job + '"; it should end "coil team 1, then team 2" (check D)');
  } catch (e) { bad('the picked job crashed the game: ' + e.message + ' (check D)'); }
  finally { dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; }
  // E. Hints (Nov 15, Flex: "maybe having some warnings on screen of whats coming next to help the player a bit"): the next things for you with their
  //    time, and an arrow to where your job wants you (into the bubble when it's due), gone when hints are off. (Before: only the general timers.)
  if (typeof dbg.hint !== 'function' || typeof dbg.upNext !== 'function') { bad('the game shows no hints of what\'s coming next for you (check E)'); return; }
  try {
    dbg.at(35.5, 'r3', { east: false, seed: 3 }); const up = dbg.upNext() || [], b1 = dbg.S.bubbles[0];
    if (!up.some((u) => /Bubble/.test(u.text) && Math.abs(u.at - b1.at) < 0.1) || !up.some((u) => /Your coil/.test(u.text))) bad('at 0:35 the "coming up" line reads ' + JSON.stringify(up.map((u) => u.text)) + '; it should name the bubble at 0:39 and your coil (check E)');
    if (up.length > 3) bad('the "coming up" line lists ' + up.length + ' things; three at most, or it clutters (check E)');
    dbg.pos = [25, -20]; const h = dbg.hint();
    if (!h || !(h.d > 2.5) || hyp(h.T, b1.p) > 10.5) bad('far from the bubble at 0:35, the hint arrow ' + (h ? 'points ' + hyp(h.T, b1.p).toFixed(0) + ' yards from the bubble' : 'isn\'t there') + ' (check E)');
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
    for (const r of runs) { const sw = r.warns.find((w) => /She surfaces on the/.test(w.text)); if (!sw || !sw.text.includes(r.east ? 'EAST' : 'WEST')) { bad('the dive warning reads "' + (sw && sw.text) + '" but she comes up ' + (r.east ? 'east' : 'west') + ' (seed ' + r.seed + ', check H)'); break; }
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
    else { const b = dbg.G.bots[other.who], lv = (d) => { b.x = dbg.G.x + d; b.y = dbg.G.y; return dbg.eggWarn(); }; if (lv(3.2) !== 2 || lv(4.5) !== 1 || lv(9) !== 0) bad('your egg ring doesn\'t turn red within 3.5 yards of another carrier, orange within 5 and clear beyond (check I)'); }
    if (!S0.warns.some((w) => /Run to the second Wretch/.test(w.text) && Math.abs(w.t - 101) < 0.1)) bad('at 1:41 there is no call to run to the second Wretch in front of her (check I)');
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
    btn.forEach(([, a, inner]) => { const ic = (/<img class="pg-ai" data-ic="([a-z0-9_]+)"/.exec(inner) || [])[1], kb = (/<b>([^<]+)<\/b>/.exec(inner) || [])[1];
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
    dbg.at(35.5, 'r3', { east: false, seed: 3 }); const M1 = dbg.mods() || [], bub = M1.find((b) => /Bubble/.test(b.name)), coil = M1.filter((b) => /coil/i.test(b.name) && Math.abs(b.at - 40) < 0.6);
    if (!bub || bub.sp !== 'Fester Burst') bad('at 0:35 the boss mods don\'t show the bubble with Fester Burst\'s icon: ' + M1.map((b) => b.name + ' (' + b.sp + ')').join(', ') + ' (check J)');
    if (coil.length !== 1 || coil[0].sp !== 'Spectral Coils') bad('at 0:35 your coil shows ' + coil.length + ' time(s) in the boss mods, or without Spectral Coils\' icon; once (check J)');
    dbg.hints = false; const M2 = dbg.mods() || []; dbg.hints = true;
    if (M2.some((b) => /^Bubble: get in$/.test(b.name)) || !M2.some((b) => b.name === 'Your coil') || !M2.some((b) => b.name === 'Fester Burst')) bad('with hints off the boss mods aren\'t the plain timers: ' + M2.map((b) => b.name).join(', ') + ' (check J)');
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
    else { dbg.at(30, 'r3'); const t = dbg.G.t, h = dbg.alerts([{ text: 'Fester Burst: into the Wretch\'s bubble, you have 4 s!', c: '#d8f22f', by: t + 4 }, { text: 'Caustic Waves: wait on the east half, then cross behind the first wave.', c: '#9be13a', by: null }]);
      const al = h.split('<div class="pg-al').slice(1); if (al.length !== 2) N('two calls didn\'t make two alerts');
      else { if (!/^ you"/.test(al[0]) || !/--c:#f3c969/.test(al[0])) N('a call about you isn\'t gold');
        if (!/<b class="pg-alo">into the Wretch&#39;s bubble<\/b>/.test(al[0]) && !/<b class="pg-alo">into the Wretch's bubble<\/b>/.test(al[0])) N('the order isn\'t the short part after the spell: ' + (/pg-alo">([^<]*)/.exec(al[0]) || [])[1]);
        if (!/<span class="pg-ald">Fester Burst<\/span>/.test(al[0])) N('the spell isn\'t named under the order');
        if (!/<em class="pg-aln">4<\/em>/.test(al[0])) N('a call that gives you 4 s shows no countdown');
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
}

module.exports = checks; module.exports.load = load; module.exports.stub = stub;

if (require.main === module) {
  let n = 0; const t0 = Date.now(); checks(null, (a, b, t) => { n++; console.log('✗ ' + t); });
  console.log(n ? n + ' problem(s)' : 'practice game: all checks pass', '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
  if (process.argv.includes('--audit')) { const { dbg } = load(); for (const [east, seed] of [[false, 3], [true, 3], [false, 11], [true, 29]]) { const a = dbg.audit(east, seed), S = dbg.S; console.log('east ' + east + ' seed ' + seed + ' tail ' + (S.tailEast ? 'east' : 'west') + ' first ' + JSON.stringify(S.first) + ': ' + (a.length ? '\n  ' + a.join('\n  ') : 'clean')); } }
  process.exitCode = n ? 1 : 0;
}
