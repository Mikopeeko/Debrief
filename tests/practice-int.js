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
//      src/practice-int.js, or the shared hooks are gone (the lead line, the score link, no "E: kick" without a kick, no side ledges in 3D);
//   G. the 3D view doesn't draw the part where its hits are (the soak's 10 yards, the coil at the rim, the cracks' 3.5, her burst's 8, the
//      diamond line), or "Go here" still points after the Shattering (found while building it);
//   H. phase 1 or phase 2 change with this file loaded;
//   I. the damage moments: the Rawlings only once the coils are done (the raid kills them then: measured 5:55 to 6:12), any Viper at once; the
//      autopilot hits them as ranged and as melee (found while building it: a melee never walked over to them), standing still misses them.
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
    '\nthis.pgIntScript = pgIntScript; this.pgIntJobs = pgIntJobs; this.pgIntSlot = pgIntSlot; this.PG_INT = PG_INT; this.PG_INT_T = PG_INT_T; this.PG_PARTS = PG_PARTS; this.pg3dShapes = pg3dShapes; this.UL_PAT = UL_PAT; this.UL_SOAK = UL_SOAK; this.UL_RIM = UL_RIM; this.pgIntKb = pgIntKb;', ctx);
  if (part !== null) vm.runInContext('pgOpen(null, "Ula\'tek", "m"' + (part ? ', "' + part + '"' : '') + ')', ctx);
  return { dbg: win.__pgDbg, ctx };
}
const clkS = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') + (s % 1 ? '.' + Math.round((s % 1) * 10) : '');
const SERIOUS = /off the platform|under a landing egg|off their soak|soaked both|two carriers|another team's slam|in the middle as|on a crack|thrown into the venom|in a crack|egg not broken|only \d soakers/;
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
    for (const [pk, east, seed] of [[{ role: 'm', team: 'Y', egg: true, pat: 1 }, false, 4], [{ role: 'r', team: 'P', egg: true, pat: 3 }, true, 6], [{ role: 'h', team: 'B', egg: false, pat: 2 }, false, 7], [{ role: 'r', team: 'Y', egg: true, pat: 3 }, true, 9], [{ role: 'm', team: 'B', egg: true, pat: 2 }, false, 12]]) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(); const r = dbg.sim(me, true, east, seed);
      if (dbg.S.job.team[me] !== pk.team || dbg.S.job.carry.has(me) !== pk.egg) bad('the game plays ' + me + ' on ' + P.TN[dbg.S.job.team[me]] + (dbg.S.job.carry.has(me) ? ' with an egg' : ' without one') + ' for the pick ' + JSON.stringify(pk) + ' (check D)');
      if (r.log.length || r.deaths.length) bad('the autopilot playing ' + JSON.stringify(pk) + ' (seed ' + seed + ') makes mistakes: ' + r.log.concat(r.deaths.map((d) => 'died ' + d)).join(' | ') + ' (check D)');
      else if (dbg.grade().sc !== 100) bad('a clean run scores ' + dbg.grade().sc + ', not 100 (check E)'); } }
  catch (e) { bad('your picked job crashed: ' + e.message + ' (check D)'); }
  // E. the mistakes
  try { dbg.P2.pick = { role: 'r', team: 'P', egg: true, pat: 2 }; const me = dbg.P2.slotOf(), r = dbg.sim(me, false, false, 4), lg = r.log.join(' | ');
    [[/missed your coil soak/, 'a missed soak'], [/never picked up your egg/, 'an egg never picked up'], [/No defensive for the last four slams/, 'no defensive for the back-to-back slams'], [/on a crack|middle of the platform|threw you into the venom/, 'the Shattering where you stood']].forEach(([re, w]) => { if (!re.test(lg)) bad('standing still doesn\'t log ' + w + ': ' + lg + ' (check E)'); });
    // (the Shattering, three spots: the middle, a crack, the edge; and the diamond line clean)
    const shat = (p) => { dbg.at(T.shatter - 0.6, me, { seed: 4 }); dbg.G.log = []; dbg.G.x = p[0]; dbg.G.y = p[1]; for (let i = 0; i < 20; i++) dbg.stepOwn(1); return dbg.log.join(' | '); };
    if (!/burst up under you/.test(shat([2, 3]))) bad('standing in the middle as she bursts up isn\'t a mistake (check E)');
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
    if (!/P2\.lead \|\|/.test(PJ)) bad('the start card no longer takes a part\'s own lead line (P2.lead, check F)');
    if (!/'=' \+ \(P2\.part \|\| 2\)/.test(PJ)) bad('the score link no longer says which part (\'?practice=\' + P2.part, check F)');
    if (!/P2 && P2\.acts\(\) \? ' · E: kick'/.test(PJ)) bad('the keys line says "E: kick" for a part with no kick (check F)');
    if (!/A\.P2 && !A\.P2\.flat3d && typeof pg3dP2 === 'function'/.test(P3)) bad('practice3d.js builds phase 2\'s side ledges for the intermission (flat3d, check F)');
    if (!/P2 && P2\.part === 2 \? 'Hatching Doom'/.test(PJ)) bad('the boss-mod bars give the intermission\'s eggs phase 2\'s Hatching Doom icon (check F)');
    if (!/if \(v === '3d' \|\| P2\) view\(true\)/.test(PJ)) bad('the intermission doesn\'t open in 3D (check F)');
    const sh = dbg.P2.short(), li = (sh.match(/<li>/g) || []).length; if (li !== 4) bad('"your job in short" isn\'t four lines (' + li + ', check F)');
    dbg.P2.pick = { role: 'r', team: 'Y', egg: true, pat: 2 }; const s2 = dbg.P2.short().replace(/<[^>]+>/g, ' | '); if (!/Yellow team, pattern 2/.test(s2) || !/2nd at Circle, the 5th at Star and the 8th at Skull/.test(s2) || !/Carry an egg/.test(s2) || !/Press Q/.test(s2) || !/diamond line/.test(s2)) bad('"your job in short" doesn\'t name the team, its soaks, the egg, the defensive and the diamond line: ' + s2 + ' (check F)');
    if (!dbg.P2.lead || !/5:18/.test(dbg.P2.lead)) bad('the start card\'s lead line doesn\'t say the clock starts at 5:18 (check F)'); }
  catch (e) { bad('the wiring check crashed: ' + e.message + ' (check F)'); }
  // G. the 3D shapes
  try { dbg.P2.pick = { role: 'r', team: 'B', egg: false, pat: 2 }; const me = dbg.P2.slotOf(), A = { get G() { return dbg.G; }, get S() { return dbg.S; }, me, bossAt: dbg.P2.bossAt, tailAt: dbg.P2.tailAt, rl: (id) => id[0], nm: (id) => id, clsC: () => null, P2: dbg.P2 };
    const at = (t0) => { dbg.at(t0, me, { seed: 4 }); return ctx.pg3dShapes(A, dbg.G.t); };
    const s3 = dbg.S.soaks[2], L1 = at(s3.at - 1); if (!L1.some((s) => s.k === 'ring' && Math.abs(s.r - 10) < 0.01 && hyp([s.x, s.y], [s3.x, s3.y]) < 0.01)) bad('in 3D your soak isn\'t drawn at its 10 yards where it hits (check G)');
    if (!L1.some((s) => s.k === 'stail' && hyp([s.x, s.y], s3.rim) < 0.01)) bad('in 3D the coil doesn\'t rise at the rim (check G)');
    const L2 = at(T.bubbles + 2); if (!L2.some((s) => s.k === 'rect' && Math.abs(s.w1 - P.CRACK) < 0.01)) bad('in 3D the crack lines aren\'t shown before the Shattering at their ' + P.CRACK + ' yards (check G)');
    if (!L2.some((s) => s.k === 'ring' && Math.abs(s.r - P.MID) < 0.01 && Math.hypot(s.x, s.y) < 0.01)) bad('in 3D her burst\'s ' + P.MID + ' yards in the middle aren\'t shown (check G)');
    const ga = [Math.cos(P.GA * Math.PI / 180) * P.GATHER, Math.sin(P.GA * Math.PI / 180) * P.GATHER]; if (!L2.some((s) => s.k === 'ring' && Math.abs(s.r - P.SPREAD) < 0.01 && hyp([s.x, s.y], ga) < 0.01)) bad('in 3D the diamond line spot isn\'t shown (check G)');
    const L3 = at(T.shatter + 1); if (!L3.some((s) => s.k === 'rect' && s.c === '#24481c')) bad('in 3D the cracks don\'t turn to venom after the Shattering (check G)');
    if (dbg.job(me).ob) bad('"Go here" still points after the Shattering (check G)'); }
  catch (e) { bad('the 3D shapes crashed on the intermission: ' + e.message + ' (check G)'); }
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
}

module.exports = checks; module.exports.load = load;
if (require.main === module) {
  let n = 0; const t0 = Date.now(); checks(null, (a, b, t) => { n++; console.log('✗ ' + t); });
  console.log(n ? n + ' problem(s)' : 'practice game, intermission: all checks pass', '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
  if (process.argv.includes('--audit')) { const { dbg } = load(null, 'mint'); dbg.P2.pick = { role: 'r', team: 'B', egg: false, pat: 0 }; for (let seed = 1; seed <= 30; seed++) for (const east of [false, true]) { const a = dbg.audit(east, seed); console.log('seed ' + seed + (east ? ' E' : ' W') + ' pattern ' + dbg.S.pat + ': ' + (a.length ? '\n  ' + a.join('\n  ') : 'clean')); } }
  process.exitCode = n ? 1 : 0;
}
