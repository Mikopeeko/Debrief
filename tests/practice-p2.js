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
//   M. the setup's spot maps (Flex, Nov 16) aren't phase 2's: Your side, Small egg (the Plan's Side Egg Pickups page), Big egg and Kicks, every spot where the
//      game puts it, the same buttons on every tab, every role on every mechanic it can take by default, Random only what the role can take, and each pick the
//      job the run plays (with the Plan's map pieces out of src/guides.js: load(H, 'm2', { maps: true })).
//   M2. the review of those maps (Nov 16): a Doomscale off its Kicks spot when your big egg goes in late, or its spot's words putting all three of its Cries
//      there (the next two come by her); a ranged who doesn't start on Malice or can't take the south big egg (in M).
//   CB. the cast bars over the casters you can kick (Flex, Nov 16: "The interupts are impossible to track/see. The monsters should have cast bars over their
//      heads"): a Malice or an Anguished Cry with no bar over its caster, off its caster, not filling with its kick window, yours when it isn't your kick (or
//      not when it is), a bar before or after the window (but the red "Interrupted" just after a kick), or seconds on the words over its caster.
//   RS. the release sweep (Nov 16): a backup kick handed to a player whose own kick is due inside the 15 s cooldown (or the autopilot kicking on cooldown, or a
//      cast counted once a step), E kicking your target's cast before your own, the arrow on a big egg before its pickup time or on a closed small egg, waiting
//      spots on the carriers' lanes, a bot picking up beside you, a big egg's cauldron spot 8 yards in, a melee's damage moment out of reach, or a missed
//      Malice still ticking on you after "Keep going" (revive).
//   PR. the prompts audit (Nov 16; Flex: "the alerts and training wheels could be better in terms of the on screen prompts", "All 10", then "i feel like the
//      game confuses people saying timestamps"): a clock time or a seconds count in anything you read but the bars and the mistake lines (played, and in the
//      file's words); your small egg opening while its Warden lives; the gate, your big egg or your lane spot counting you somewhere other than the ring drawn;
//      no arrow before the tethers, your Malice or your Doomscale; a kick pushing "Back to her" off the job line; the big eggs' count while you're far, or a
//      kick spent out of reach; a call landing on your kick, or none as the heart opens; the Wardens' and the tethers' calls not yours; a call not "Mechanic:
//      order" or gold when it isn't yours; no "now" for your kick, the five's Q or the small eggs; the arrow through a circle about to land; the debris shown
//      late, a green swirl misnamed, no line for a small tail's wave about to cross you, or your lane spot drawn while you're still up your lane.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src'), rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n');
function stub() { const f = function () { return stub(); }; return new Proxy(f, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : k === Symbol.iterator ? function* () {} : stub()), set: () => true, apply: () => stub() }); }
// (the Plan's maps out of src/guides.js, in the file's order: what ulSvg draws the Plan's pages with, and the line that files them as Plan shows them. In the site
//  they share the game's scope; in Node the game runs without them (no ulSvg, so the setup keeps its job row) unless a check asks: load(H, 'm2', { maps: true }))
const MAP_BITS = ['POM_DEF', 'POM_MK', 'UL_RIM', 'UL_SOAK', 'UL_GC', 'UL_MKI', 'UL_CMK', 'UL_PAT', 'UL_VB', 'UL_CSP', 'ulSoaks', 'UL_PAGES', 'ulSvg', 'ulFester'];
function load(H, part, o) {
  H = H || require('./site-helpers.js');
  const GJ = rd('guides.js'), fromGuides = ['GDZ_ROLE', 'GDZ_RAID', 'gdzName', 'UX', 'UX_MEL', 'UX_HOME', 'UX_ZONE', 'UL_EDGE', 'UL_FB', 'GDZ_FLOOR', 'UL_EGGS'].map((n) => H.grab(n, GJ)).join('\n') +
    (o && o.maps ? '\n' + MAP_BITS.map((n) => H.grab(n, GJ)).join('\n') + '\n' + ((/^UL_PAGES\.burst = [^\n]*/m.exec(GJ) || [''])[0]) : '');
  const win = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
  class Img { constructor() { this.complete = false; this.naturalWidth = 0; } }
  const ctx = vm.createContext({ document: stub(), window: win, navigator: stub(), performance, Image: Img, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, localStorage: stub(), E: { CLASSES: {} }, console, MouseEvent: function () {} });
  // (o.said: the floats and the big calls are kept in window.__said as the screen shows them, for check PR; practice.js's own say and bigCall, read in place)
  let PJ = rd('practice.js'); if (o && o.said) { const a = 'const bigCall = (text, c) => {', b = 'const say = (text, bad) => {'; win.__saidHook = PJ.includes(a) && PJ.includes(b);
    PJ = PJ.replace(a, a + ' (window.__said = window.__said || []).push({ t: G ? G.t : 0, k: "big", text });').replace(b, b + ' (window.__said = window.__said || []).push({ t: G ? G.t : 0, k: bad ? "bad" : "ok", text });'); }
  vm.runInContext(H.grab('esc') + '\n' + fromGuides + '\n' + PJ + '\n' + rd('practice3d.js') + '\n' + rd('practice-p2.js') + '\nthis.pgP2Script = pgP2Script; this.pgP2Jobs = pgP2Jobs; this.PG_P2 = PG_P2; this.PG_P2_T = PG_P2_T; this.PG_PARTS = PG_PARTS; this.pg3dShapes = pg3dShapes; this.pgP2Floor = pgP2Floor;', ctx);
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
  want('Hatching Doom', /Hatching Doom (\d):(\d\d)/, [T.doom]); want('the Wardens', /Wardens up (\d):(\d\d)/, [T.wardens]); want('their first Malice', /their Malice (\d):(\d\d)/, [Math.min(...S.malice.map((m) => m.t0))], 1);
  want('Grasping Fangs', /Grasping Fangs (\d):(\d\d)/, [T.fangs]); want('Rage of the Shackled', /Rage of the Shackled (\d):(\d\d), heart open/, [S.casts.find((c) => c.name === 'Rage of the Shackled').t0]);
  want('the heart', /heart open (\d):(\d\d)/, [T.heart], 0.6);
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
      firsts.add(B.E.close < B.W.close ? 'E' : 'W'); /* (the south ones now go up when their ledge's two south small eggs are grabbed: check K) */
      if (n[1] - n[0] < 1.3 || n[1] - n[0] > 4.7) { bad('the two healers pick up their north eggs ' + (n[1] - n[0]).toFixed(1) + ' s apart on seed ' + seed + '; top kills: a median 2.5 s, middle half 1.3 to 4.7 (check A)'); break; }
      if ([B.E.far, B.W.far, B.E.close, B.W.close].some((x) => x < 246 || x > 263)) { bad('a big egg is picked up outside 4:06 to 4:23 on seed ' + seed + ' (check A)'); break; } }
    if (firsts.size < 2) bad('the same ledge\'s healer always picks up first over 20 runs; it should vary (check A)');
    dbg.P2.pick = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; dbg.sim(dbg.P2.slotOf(dbg.P2.pick), true, false, 6);
    // (the Cries, from that run: each Doomscale's, 7.8 s after it climbs out and every 15.8 s; on the kills, about 4:35, 4:53 and 5:09 over the four)
    { const C = [1, 2, 3].map((i) => dbg.S.cries.filter((c) => c.i === i).map((c) => c.t0).sort((a, b) => a - b)), md = C.map((L) => L[Math.floor(L.length / 2)]); want('Anguished Cry', /Anguished Cry three times, about (\d):(\d\d), (\d):(\d\d) and (\d):(\d\d)/, md, 5);
      if (C.some((L) => L.length !== 4)) bad('a played run has ' + C.map((L) => L.length).join('/') + ' first, second and third Cries; four Doomscales cast three each (check A)'); }
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
    // (Nov 15, the kills: ONE Malice a Warden, 3:03.9, before the tethers at 3:16: no pick clashes any more)
    dbg.P2.pick = { side: 'W', role: 'm', egg: 'n4', mal: 1, cry: 1, teth: 'five' }; if (dbg.P2.clash()) bad('a melee with the Malice and one of the five is told they clash; the one Malice comes before the tethers (check D)');
    // (and played: a west melee with the 2nd Malice and the solo break kicks at 3:18, then breaks alone on the count, clean)
    { const pkM = { side: 'W', role: 'm', egg: 'n4', mal: 2, cry: 1, teth: 'solo' }; dbg.P2.pick = pkM; const rM = dbg.sim(dbg.P2.slotOf(pkM), true, false, 3); if (rM.log.length) bad('a west melee with the 2nd Malice and the solo break, played by the autopilot, makes mistakes: ' + rM.log.join(' | ') + ' (check D)'); }
    ['E', 'W'].forEach((s) => { const ids = Object.keys(J).filter((id) => J[id].side === s), n = (k, v) => ids.filter((id) => J[id][k] === v).length;
      for (let e = 1; e <= P.eggs[s].length; e++) if (n('egg', e) !== 1) bad('small egg ' + e + ' on the ' + s + ' ledge has ' + n('egg', e) + ' carriers after the pick (check D)');
      ['far', 'close'].forEach((w) => { if (n('big', w) !== 1) bad('the ' + w + ' big egg on the ' + s + ' ledge has ' + n('big', w) + ' carriers after the pick (check D)'); });
      if (n('mal', 1) !== 1 || ids.some((id) => J[id].mal > 1)) bad('the ' + s + ' ledge has ' + n('mal', 1) + ' Malice kickers after the pick; one Warden casts one Malice (check D)');
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
    // (Nov 15, the kills: the tanks kicked 33 of the 60 Malices on the 30 fastest kills, and the plan's kick line starts with the tank: with no pick of
    // yours each ledge's Malice is its tank's; picked, it's yours and the tank's no more)
    { const J0 = ctx.pgP2Jobs(3, null, null); ['E', 'W'].forEach((s) => { const k = Object.keys(J0).filter((id) => J0[id].side === s && J0[id].mal); if (k.length !== 1 || k[0][0] !== 't') bad('the ' + s + ' ledge\'s Malice goes to ' + k.join(' ') + '; its tank kicks it unless you take it (check D)'); });
      const pk4 = { side: 'E', role: 'm', egg: 'n4', mal: 1, cry: 1, teth: 'random' }, me4 = dbg.P2.slotOf(pk4); let off = 0; for (let seed = 1; seed <= 30; seed++) { const J4 = ctx.pgP2Jobs(seed, me4, pk4); if (J4[me4].mal !== 1 || Object.keys(J4).filter((id) => J4[id].side === 'E' && J4[id].mal).length !== 1) off++; }
      if (off) bad('taking the Malice with a random tether leaves it with someone else, or two kickers, on ' + off + ' of 30 seeds (check D)'); }
  } catch (e) { bad('the picked job crashed the game: ' + e.message + ' (check D)'); }
  // E. the mistakes
  try {
    const pk = { side: 'E', role: 'm', egg: 'n2', mal: 1, cry: 0, teth: 'none' }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk);
    const stillR = dbg.sim(me, false, false, 3), still = stillR.log.join(' | ');
    // (the review, Nov 15: an unkicked Malice did 13 a tick; the notes measure about 650k a player a tick, close to half a raider's health, so
    // six ticks kill: the run that never kicks the 3:03 Malice dies in its channel)
    if (!stillR.deaths.some((c) => c >= '3:05' && c <= '3:13')) bad('missing the 3:03 Malice kick doesn\'t kill you in its channel (deaths: ' + (stillR.deaths.join(', ') || 'none') + '); its ticks are about 650k each (check E)');
    if (!/never crossed to your ledge/.test(still)) bad('standing still on the platform isn\'t a mistake ("never crossed"): ' + still + ' (check E)');
    if (!/didn't kick Malice \(3:0[34]\)/.test(still)) bad('the 3:03 Malice kicker who never kicks gets no mistake: ' + still + ' (check E)');
    if (!(dbg.grade().sc < 80)) bad('standing still all of phase 2 scores ' + dbg.grade().sc + ' (check E)');
    // (the review, Nov 15: an east-half raider who walked into the west gate landed beside the west ledge's own gate, which sent them straight back,
    // and on and on, with a "wrong gate" mistake every tick)
    dbg.at(167.5, me, { east: false, seed: 3 }); const gw = dbg.S.gates.find((g) => g.side === 'W' && !g.back); dbg.pos = gw.p.slice(); dbg.step(20);
    const wrongN = dbg.log.filter((x) => /You took the west gate/.test(x)).length; if (wrongN !== 1 || dbg.G.p2.where[me] !== 'L' || dbg.G.p2.wside[me] !== 'W') bad('the wrong gate gives ' + wrongN + ' mistakes in a second and leaves you ' + dbg.G.p2.where[me] + ' ' + dbg.G.p2.wside[me] + '; it should be one mistake, on the west ledge (check E)');
    // (the review, Nov 15: the words said "the purple ring", but in 3D your own gate is the gold one, the purple one the other half's)
    if (/purple ring/.test(rd('practice-p2.js'))) bad('a text still calls your gate "the purple ring"; in 3D yours is gold (check E)');
    dbg.at(T.malice + 1.2, me, { east: false, seed: 3 }); const W = dbg.G.p2.wd.E; dbg.pos = [W[0] - 3, W[1] - 3]; dbg.kick(); if (dbg.G.p2.kick.mE1 !== me) bad('pressing E by the Warden in its 3:03 Malice cast doesn\'t kick it (check E)');
    dbg.at(200, me, { east: false, seed: 3 }); const e0 = dbg.G.eggs.find((e) => e.side === 'E'); dbg.pos = [e0.x - 1.5, e0.y]; dbg.step(2); if (!dbg.log.some((x) => /Warden's Protection/.test(x))) bad('standing on an egg while its Warden lives isn\'t a mistake (check E)');
    const pkT = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'five' }; dbg.P2.pick = pkT; const meT = dbg.P2.slotOf(pkT); dbg.at(205, meT, { east: false, seed: 3 }); const WT = dbg.G.p2.wd.E;
    dbg.pos = [WT[0] + 20, WT[1] - 20]; dbg.step(3); if (!dbg.log.some((x) => /broke your tether early/.test(x))) bad('one of the five walking out of their tether at 3:25 isn\'t "broke your tether early": ' + dbg.log.join(' | ') + ' (check E)');
    const pkB = { side: 'E', role: 'h', egg: 'far', mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pkB; const meB = dbg.P2.slotOf(pkB); dbg.at(232, meB, { east: false, seed: 3 }); const B = dbg.S.big.find((b) => b.side === 'E' && b.which === 'far');
    dbg.pos = [B.x, B.y]; dbg.step(2); if (!dbg.log.some((x) => /big egg with small eggs still out/.test(x))) bad('picking up the big egg at 3:52, with the small eggs still out, isn\'t a mistake: ' + dbg.log.join(' | ') + ' (check E)');
  } catch (e) { bad('the mistakes crashed the game: ' + e.message + ' (check E)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // (the start card's "Your job in short" (Nov 15, Flex: "improve the setup screens. Still a little convoluted"): three or four plain lines for the
  // picked job, naming your ledge, your egg and kicks, your tether and the heart)
  try { dbg.P2.pick = { side: 'W', role: 'm', egg: 'close', mal: 1, cry: 1, teth: 'five' }; const sh = typeof dbg.P2.short === 'function' ? dbg.P2.short() : '', li = (sh.match(/<li>/g) || []).length;
    if (!/^<ul class="pg-short">/.test(sh) || li < 3 || li > 4) bad('phase 2\'s "your job in short" isn\'t a pg-short list of three or four lines (' + li + ', check F)');
    /* (Nov 16, the prompts audit: no clock times on the card any more (Flex: "i feel like the game confuses people saying timestamps"), so the kick and the
       tether are named without their 3:03 and 3:34) */
    else if (!/West ledge/.test(sh) || !/north big egg/.test(sh) || !/Malice/.test(sh) || !/out with the five/.test(sh) || !/heart/.test(sh)) bad('phase 2\'s "your job in short" doesn\'t name the picked ledge, egg, kick, tether and the heart: ' + sh.replace(/<[^>]+>/g, ' | ') + ' (check F)'); }
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
  // M. the spot maps (Flex, Nov 16: "visual maps that lets them select the spot is best, you should use the plans maps so its something familiar ... Customizable,
  //    but not crazy confusing", "maybe randomize their assignments", then on phase 1's first maps "make sure the maps are placed properly it looks off" and
  //    "clicking on your coil hides no egg"): phase 2 hands the card setup.maps (practice.js's contract). Your side (both ledges, the spot your gate lands you on),
  //    Small egg (the Plan's own Side Egg Pickups page for your ledge, eggs 1 to 8 where the game lays them), Big egg (the south one a melee's or a ranged's,
  //    the north one a healer's, where the game lays them), Kicks (the Warden where it casts Malice and the two Weakened Doomscales by the Plan's markers, Moon
  //    and Cross west, Skull and Diamond east, where their tank holds them on the ledge; no Kicks for healers, no kick in Midnight). The same buttons on every
  //    tab; every role starts on every mechanic it can take (a melee kicks Malice and a Cry and carries, a ranged too, a healer carries the north big egg); Random
  //    picks only what the role can take; every pick, Random, No egg and a new role is the job the run plays. (Before: no maps, one job from a row of tiles)
  try { const Mb = (m) => bad(m + ' (check M)'), MM = dbg.P2.setup && dbg.P2.setup.maps, FN = ['tabs', 'page', 'hot', 'pick', 'extras', 'extra', 'random', 'role', 'say', 'sub'];
    if (!MM || FN.some((f) => typeof MM[f] !== 'function')) Mb('phase 2\'s setup has no spot maps (setup.maps with ' + FN.join(', ') + '): no Your side, Small egg, Big egg or Kicks maps to pick your spots on (Flex, Nov 16)');
    else {
      if (/pg-sprow/.test(dbg.panel())) Mb('without the Plan\'s maps (no ulSvg, as in Node) phase 2\'s setup draws the Spots row instead of keeping its job row');
      const GM = load(H, 'm2', { maps: true }), D = GM.dbg, M = D.P2.setup.maps, MK = { E: ['Skull', 'Diamond'], W: ['Moon', 'Cross'] };
      // (a fresh browser: a ranged with a small egg who kicks Malice and a Cry, the tether at random)
      { const p0 = D.P2.pick; if (p0.role !== 'r' || !/^n\d$/.test(p0.egg || '') || p0.mal !== 1 || !p0.cry || p0.teth !== 'random') Mb('a first visit starts as ' + JSON.stringify(p0) + '; a ranged starts on a small egg, Malice and a Doomscale\'s Cries, the tether at random (every mechanic it can take)'); }
      const PX = (x) => +(340 + x * 2.083).toFixed(1), PY = (y) => +(240 - (y + 0.9) * 2.083).toFixed(1), attr = (tag, a) => { const m = new RegExp('\\s' + a + '="([^"]*)"').exec(tag); return m ? m[1] : null; };
      const svgs = (P) => { const s = String(P), i = s.indexOf('class="pg-spmap"'); return i < 0 ? [] : [...s.slice(i).matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)].map((m) => m[0]); };
      const hotIn = (P) => [...String(svgs(P)[1] || '').matchAll(/<circle\b[^>]*\bclass="pg-hs[^"]*"[^>]*>/g)].map(([t]) => ({ id: attr(t, 'data-mh'), cx: +attr(t, 'cx'), cy: +attr(t, 'cy'), r: +attr(t, 'r'), on: /class="pg-hs[^"]*\bon\b/.test(t) }));
      const btnIn = (P) => [...String(P).matchAll(/<button\b[^>]*\bdata-m([trx])="([^"]*)"[^>]*>([^<]*)<\/button>/g)].map((m) => m[1] + ':' + m[2] + ':' + m[3]);
      const youIn = (svg) => (String(svg).match(/>You<\/text>/g) || []).length;
      const DEF = { m: { egg: 'far', mal: 1, cry: 1 }, r: { egg: 'n6', mal: 1, cry: 1 }, h: { egg: 'close', mal: 0, cry: 0 } }, TABS = { m: 'side,egg,big,kick', r: 'side,egg,big,kick', h: 'side,big' };
      const S3 = GM.ctx.pgP2Script({ seed: 3, east: false }), slotJob = (pk) => { D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(166.05, me, { east: false, seed: 3 }); return { me, j: D.S.job[me] }; };
      // (where the game puts each kick's caster: the Warden as its Malice starts; each Doomscale where its tank holds it on the ledge, just before the tank takes it
      // back to her at 4:38.5 (and its first Anguished Cry there, on this run whose big eggs go in on the count); its name on the target frame)
      const at = {}, cry1 = {}; for (const s of ['E', 'W']) { const pk = { side: s, role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(166.05, me, { east: false, seed: 3 }); const G = D.G, S = D.S;
        while (G.t < 300 && !(at[s + 'mal'] && at[s + 'cry1'] && at[s + 'cry2'])) { D.step(1); const t = G.t, m = S.malice.find((q) => q.side === s && q.k === 1); if (!at[s + 'mal'] && m && t >= m.t0 && G.p2.wd[s]) at[s + 'mal'] = G.p2.wd[s].slice();
          [1, 2].forEach((k) => { const c = S.cries.find((q) => q.ds === 'ds' + s + k && q.i === 1), d = G.p2.ds['ds' + s + k]; if (!cry1[s + k] && c && d && t >= c.t0) { cry1[s + k] = [d.x, d.y]; const nm = (D.P2.tgts(t).find((q) => q.key === 'ds' + s + k) || {}).name || '';
            if (nm.indexOf('(' + MK[s][k - 1] + ')') < 0) Mb('in the game the ' + s + ' ledge\'s Doomscale ' + k + ' is "' + nm + '" on your target frame; the Kicks map calls it the ' + MK[s][k - 1] + ' Doomscale (the Plan\'s marker)'); }
            if (!at[s + 'cry' + k] && d && t >= 278.55) at[s + 'cry' + k] = [d.x, d.y]; }); } }
      ['E', 'W'].forEach((s) => [1, 2].forEach((k) => { const a = at[s + 'cry' + k], c = cry1[s + k]; if (!a || !c || Math.hypot(a[0] - c[0], a[1] - c[1]) > 1) Mb('on a run whose big eggs go in on the count the ' + MK[s][k - 1] + ' Doomscale casts its first Anguished Cry at ' + (c ? c.map((v) => v.toFixed(1)).join(', ') : 'nowhere') + ', not where its tank holds it (' + (a ? a.map((v) => v.toFixed(1)).join(', ') : 'nowhere') + ')'); }));
      for (const role of ['m', 'r', 'h']) for (const side of ['E', 'W']) { const tag = ' (' + role + ', ' + side + ' ledge)';
        D.P2.pick = { side, role, ...DEF[role], teth: 'random' }; const tabs = M.tabs().map((q) => q[0]).join(','); if (tabs !== TABS[role]) Mb('the tabs are ' + tabs + tag + '; they should be ' + TABS[role] + ' (a healer has no small egg and no kick; a ranged takes the south big egg on 15 of 74 kills)');
        let B0 = null;
        for (const [key] of M.tabs()) { M.tab = key; const P = D.panel(), B = btnIn(P), sv = svgs(P), V = sv.map((s) => attr(s.slice(0, s.indexOf('>')), 'viewBox')), vb = (V[0] || '').split(' ').map(Number), HS = M.hot(key), drawn = hotIn(P), tg = ' on ' + key + tag;
          if (!/class="pg-srow pg-sprow"><span class="pg-sl">Spots<\/span>/.test(P) || !new RegExp('data-mt="' + key + '" class="on"').test(P)) { Mb('the setup shows no Spots row with ' + key + ' lit' + tag); continue; }
          if (B0 && B.join('|') !== B0) Mb('the Spots row\'s buttons change between the tabs (' + B0 + ', then ' + B.join('|') + ')' + tag + ' (Flex: "clicking on your coil hides no egg")'); B0 = B.join('|');
          if (!B.includes('r:1:🎲 Random') || !B.includes('x:noegg:No egg')) Mb('the Spots row has ' + B.join(', ') + tg + '; 🎲 Random and No egg belong on every tab');
          if (V.length !== 2 || V[0] !== V[1]) Mb('the spots aren\'t laid over the map in its own frame (' + V.join(' and ') + ')' + tg);
          if (drawn.map((d) => d.id).join(',') !== HS.map((h) => h.id).join(',')) Mb('the spots drawn (' + drawn.map((d) => d.id).join(', ') + ') aren\'t the ones you can pick (' + HS.map((h) => h.id).join(', ') + ')' + tg);
          HS.forEach((h) => { const d = drawn.find((q) => q.id === h.id); if (!d || Math.abs(d.cx - PX(h.x)) > 0.1 || Math.abs(d.cy - PY(h.y)) > 0.1) Mb('the ' + h.id + ' spot is drawn off its place' + tg);
            if (vb.length === 4 && (PX(h.x) - h.r * 2.083 < vb[0] - 0.5 || PX(h.x) + h.r * 2.083 > vb[0] + vb[2] + 0.5 || PY(h.y) - h.r * 2.083 < vb[1] - 0.5 || PY(h.y) + h.r * 2.083 > vb[1] + vb[2] + 0.5)) Mb('the ' + h.id + ' spot runs off the edge of its map' + tg); });
          const want = (id) => { if (key === 'side') { const g = S3.gates.find((q) => !q.back && q.side === id); return g && g.to; } if (key === 'egg') { const e = S3.eggs.find((q) => q.side === side && 'n' + q.n === id); return e && [e.x, e.y]; }
            if (key === 'big') { const b = S3.big.find((q) => q.side === side && q.which === id); return b && [b.x, b.y]; } return at[side + id]; };
          HS.forEach((h) => { const w = want(h.id); if (!w || Math.hypot(h.x - w[0], h.y - w[1]) > (key === 'kick' ? 1 : 0.5)) Mb('the ' + h.id + ' spot is at ' + h.x.toFixed(1) + ', ' + h.y.toFixed(1) + tg + '; the game puts it at ' + (w ? w.map((v) => v.toFixed(1)).join(', ') : 'nowhere') + ' (Flex: "make sure the maps are placed properly")'); });
          const ids = HS.map((h) => h.id).sort().join(','), wantIds = { side: 'E,W', egg: S3.eggs.filter((q) => q.side === side).map((q) => 'n' + q.n).sort().join(','), big: role === 'h' ? 'close' : 'far', kick: 'cry1,cry2,mal' }[key];
          if (ids !== wantIds) Mb('the ' + key + ' map offers ' + ids + tg + '; it should offer ' + wantIds + ' (the kills: a melee or a ranged takes a small egg or the south big egg, a healer the north big egg)');
          const lit = HS.filter((h) => h.on).map((h) => h.id).sort().join(','), litWant = { side, egg: /^n/.test(DEF[role].egg) ? DEF[role].egg : '', big: /^n/.test(DEF[role].egg) ? '' : DEF[role].egg, kick: (DEF[role].cry ? ['cry' + DEF[role].cry] : []).concat(DEF[role].mal ? ['mal'] : []).sort().join(',') }[key];
          if (lit !== litWant) Mb('the ' + key + ' map lights ' + (lit || 'nothing') + tg + '; your picks are ' + (litWant || 'none there'));
          const yn = youIn(sv[1]), yw = key === 'side' || (key === 'egg' && /^n/.test(DEF[role].egg)) || (key === 'big' && !/^n/.test(DEF[role].egg)) ? 1 : 0; if (yn !== yw) Mb('the ' + key + ' map draws the gold You ' + yn + ' times' + tg + '; once on your spot, or not at all where you have none');
          if (key === 'egg' && !new RegExp('aria-label="' + (side === 'W' ? 'Left' : 'Right') + ' ledge"').test(sv[0] || '')) Mb('Small egg isn\'t the Plan\'s own Side Egg Pickups page for the ' + side + ' ledge');
          if (key === 'kick' && MK[side].some((m) => (sv[0] || '').indexOf('<title>The ' + m + ' Doomscale</title>') < 0)) Mb('the Kicks map doesn\'t mark the ' + MK[side].join(' and ') + ' Doomscales' + tag); }
        const say = M.say(), sub = M.sub(); if (!/^[A-Z].*\.$/.test(say) || /\. [A-Z]/.test(say) || /went wrong/i.test(say)) Mb('the setup sentence isn\'t one plain sentence' + tag + ': ' + say);
        if (DEF[role].cry && say.indexOf(MK[side][DEF[role].cry - 1]) < 0) Mb('the setup sentence doesn\'t name your Doomscale\'s marker' + tag + ': ' + say);
        if (sub.length > 60 || sub.indexOf(side === 'E' ? 'East' : 'West') < 0) Mb('the Play button\'s line "' + sub + '" isn\'t short or doesn\'t name your ledge' + tag);
        // (each role's default, played by the autopilot: kicks land, the eggs go in, the tether on the count; only a damage moment may slip)
        if (side === 'E') for (const [east, seed] of [[false, 5], [true, 3]]) { D.P2.pick = { side, role, ...DEF[role], teth: 'random' }; const r = D.sim(D.P2.slotOf(D.P2.pick), true, east, seed), L0 = r.log.filter((x) => !/were up: you were on/.test(x));
          if (L0.length || r.deaths.length) Mb('the autopilot playing the ' + role + ' default (' + JSON.stringify(DEF[role]) + ', seed ' + seed + ') makes mistakes: ' + L0.concat(r.deaths.map((x) => 'died ' + x)).join(' | ')); } }
      // (every pick is the job the run plays; a pick a role can't take does nothing)
      D.P2.pick = { side: 'E', role: 'm', ...DEF.m, teth: 'random' }; M.pick('side', 'W'); M.pick('egg', 'n3'); M.pick('kick', 'cry2');
      { const { me, j } = slotJob(D.P2.pick); if (j.side !== 'W' || j.egg !== 3 || j.big || j.mal !== 1 || j.cry !== 2 || !j.teth || me[0] !== 'm') Mb('a melee who picks the west ledge, small egg 3 and the Cross Doomscale (Malice on) plays ' + me + ' ' + JSON.stringify(j)); }
      M.pick('big', 'far'); M.pick('kick', 'mal'); { const { j } = slotJob(D.P2.pick); if (j.big !== 'far' || j.egg || j.mal) Mb('a melee who picks the south big egg and turns Malice off plays ' + JSON.stringify(j)); }
      M.extra('noegg'); { const { j } = slotJob(D.P2.pick); if (j.egg || j.big) Mb('No egg still plays an egg: ' + JSON.stringify(j)); } M.extra('noegg'); if (D.P2.pick.egg !== 'far') Mb('No egg pressed again gives a melee ' + D.P2.pick.egg + ', not the south big egg back');
      D.P2.pick = { side: 'E', role: 'h', ...DEF.h, teth: 'random' }; M.pick('kick', 'mal'); M.pick('kick', 'cry1'); M.pick('egg', 'n2'); M.pick('big', 'far'); { const { j } = slotJob(D.P2.pick); if (j.mal || j.cry || j.egg || j.big !== 'close') Mb('a healer can pick a kick, a small egg or the south big egg: plays ' + JSON.stringify(j)); }
      D.P2.pick = { side: 'E', role: 'r', ...DEF.r, teth: 'random' }; M.pick('big', 'far'); M.pick('kick', 'mal'); M.pick('kick', 'cry1'); { const { j } = slotJob(D.P2.pick); if (j.big !== 'far' || j.egg || j.mal || j.cry) Mb('a ranged who picks the south big egg and drops Malice and the Cry plays ' + JSON.stringify(j)); }
      M.pick('big', 'close'); if (D.P2.pick.egg === 'close') Mb('a ranged can pick the north big egg (a healer\'s on 45 of 46 kills)');
      // (a new role keeps your ledge and an egg it can carry, and starts on that role's kicks)
      D.P2.pick = { side: 'W', role: 'm', egg: 'n4', mal: 1, cry: 2, teth: 'random' }; M.role('r'); const pR = D.P2.pick; M.role('h'); const pH = D.P2.pick; M.role('m'); const pM = D.P2.pick;
      if (pR.side !== 'W' || pR.egg !== 'n4' || pR.mal !== 1 || pR.cry !== 2) Mb('melee to ranged gives ' + JSON.stringify(pR) + '; the ledge, small egg 4, Malice and the Cross Doomscale stay (a ranged kicks Malice too)');
      if (pH.egg !== 'close' || pH.mal || pH.cry) Mb('ranged to healer gives ' + JSON.stringify(pH) + '; a healer carries the north big egg and has no kick');
      if (pM.egg !== 'far' || pM.mal !== 1 || pM.cry !== 1) Mb('healer to melee gives ' + JSON.stringify(pM) + '; a melee starts on the south big egg, Malice and a Cry');
      // (🎲 Random, for people with no plan yet: only what the role can take, both ledges, both Doomscales, never no egg)
      for (const role of ['m', 'r', 'h']) { D.P2.pick = { side: 'E', role, ...DEF[role], teth: 'random' }; const seen = new Set();
        for (let i = 0; i < 60; i++) { M.random(); const p = D.P2.pick; seen.add(p.side); seen.add(p.egg === 'far' || p.egg === 'close' ? p.egg : p.egg ? 'small' : 'none'); seen.add('c' + p.cry);
          const ok = p.teth === 'random' && (role === 'h' ? p.egg === 'close' && !p.mal && !p.cry : (/^n[1-8]$/.test(p.egg) || p.egg === 'far') && (p.cry === 1 || p.cry === 2) && p.mal === 1) && !(p.side === 'W' && p.egg === 'n8');
          if (!ok) { Mb('🎲 Random gives a ' + role + ' ' + JSON.stringify(p) + ', which isn\'t a spot set it can take (with every mechanic: Malice too for a melee or a ranged)'); break; } }
        const need = ['E', 'W'].concat(role === 'h' ? [] : ['c1', 'c2', 'small', 'far']); if (need.some((x) => !seen.has(x))) Mb('🎲 Random for a ' + role + ' never gives ' + need.filter((x) => !seen.has(x)).join(', ') + ' in 60 tries'); }
      // M2. the review (Nov 16) of these maps. (1) The Kicks map's Doomscales stand where their tank holds them on the ledge on EVERY run, also when your own
      //     big egg goes in late (the defaults now: a melee's south egg, a healer's north one) and their first Cry comes as the tank walks off, 12 yards away
      //     (the build's note said "where each casts its first Anguished Cry ... every run", true only when the eggs go in on the count); the spot's words say
      //     the next two Cries come by her. (2) A ranged starts on Malice too and can take the south big egg (above). Before: a ranged's default had no Malice
      //     and no Big egg tab, and the Doomscale's words gave its three Cries at that spot
      { const M2b = (m) => bad(m + ' (check M2)'), hs = {}; ['E', 'W'].forEach((s) => { D.P2.pick = { side: s, role: 'm', ...DEF.m, teth: 'random' }; M.hot('kick').forEach((h) => { hs[s + h.id] = h; }); });
        ['E', 'W'].forEach((s) => [1, 2].forEach((k) => { const h = hs[s + 'cry' + k]; if (!h || !/ by her\b/.test(h.title) || h.title.indexOf(MK[s][k - 1]) < 0) M2b('the ' + MK[s][k - 1] + ' Doomscale\'s spot says "' + (h && h.title) + '"; it should say its first Cry comes there and the next two by her, where its tank takes it'); }));
        for (const [pk, east, seed] of [[{ side: 'E', role: 'm', ...DEF.m }, false, 5], [{ side: 'W', role: 'h', ...DEF.h }, false, 1], [{ side: 'W', role: 'm', ...DEF.m, cry: 2 }, true, 4]]) { D.P2.pick = { ...pk, teth: 'random' }; D.at(278.6, D.P2.slotOf(D.P2.pick), { east, seed });
          D.S.ds.forEach((d) => { const c = D.G.p2.ds[d.id], h = hs[d.side + 'cry' + d.k]; if (!c || !h || Math.hypot(c.x - h.x, c.y - h.y) > 0.5) M2b('at 4:38.6, just before its tank takes it back to her, the ' + MK[d.side][d.k - 1] + ' Doomscale stands at ' + (c ? c.x.toFixed(1) + ', ' + c.y.toFixed(1) : 'nowhere') + '; the Kicks map puts it at ' + (h ? h.x.toFixed(1) + ', ' + h.y.toFixed(1) : 'nowhere') + ' (you as ' + pk.role + ' with ' + pk.egg + ', seed ' + seed + ')'); }); } }
    } }
  catch (e) { bad('phase 2\'s spot maps crashed: ' + e.message + ' (check M)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // I. hitting the right thing (Nov 15, Flex: "can we look at adding the dps mechanics in"): your ledge's Warden while it lives, the Weakened
  //    Doomscales from 4:29, the heart from 4:55, any Viper first; Tab or a click picks, melee 5 yards, others 40; a moment mostly on it counts, a
  //    miss is one line, the end card says "Right target: N of M". (Before: phase 2 had no targets; Tab did nothing in it)
  try {
    const pkI = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pkI; const meI = dbg.P2.slotOf(pkI);
    [[186, 'clutch'], [191, 'rawling'], [212, 'warden'], [275, 'ds'], [300, 'heart']].forEach(([t0, cat]) => { dbg.at(t0, meI, { east: false, seed: 3 }); const c = dbg.P2.dpsCat(dbg.G.t), L0 = dbg.P2.tgts(dbg.G.t);
      if (c !== cat) bad('at ' + clkS(t0) + ' the damage moment is ' + c + ', not ' + cat + ' (check I)'); if (!L0.some((o) => o.kind === cat)) bad('at ' + clkS(t0) + ' there is no ' + cat + ' to pick (check I)'); });
    for (const [pk, east] of [[{ side: 'E', role: 'm', egg: 'n4', mal: 1, cry: 1, teth: 'none' }, true], [{ side: 'W', role: 'm', egg: null, mal: 0, cry: 2, teth: 'none' }, false], [{ side: 'W', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }, true], [{ side: 'E', role: 'h', egg: 'close', mal: 0, cry: 0, teth: 'random' }, false]]) {
      dbg.P2.pick = pk; const r = dbg.sim(dbg.P2.slotOf(pk), true, east, 4), DL = (dbg.G.dpsM && dbg.G.dpsM.list) || [], tag = pk.side + ' ' + pk.role + (east ? ', she is east' : ', she is west');
      // (Flex, Nov 15: healers stay simple, dodge and follow their spots: no damage moments for a healer)
      if (pk.role === 'h') { if (DL.length || r.log.some((x) => /was up|were up|was open/.test(x))) bad('a healer (' + tag + ') still gets damage moments: ' + (DL.map((m) => m.kind).join(', ') || r.log.join(' | ')) + '; healers only dodge and follow their spots (check I)'); continue; }
      ['clutch', 'rawling', 'warden', 'ds', 'heart'].forEach((k) => { const m = DL.find((q) => q.kind === k); if (!m || m.fr < 0.5) bad('the autopilot (' + tag + ') isn\'t on the ' + k + ' for its moment (' + (m ? Math.round(m.fr * 100) + '%' : 'no moment') + ', check I)'); });
      if (r.log.some((x) => /was up|were up|was open/.test(x))) bad('the autopilot (' + tag + ') misses a damage moment: ' + r.log.join(' | ') + ' (check I)');
      if (!(dbg.G.hits >= 20)) bad('the autopilot (' + tag + ') pressed 1 only ' + (dbg.G.hits || 0) + ' times in phase 2; a moment counts only while you keep pressing (check I)');
      if (dbg.P2.dpsNames(DL) !== 'the Warden, the Clutches, the Rawlings, the Doomscales, the heart') bad('the end card names the moments "' + dbg.P2.dpsNames(DL) + '" (check I)'); }
    dbg.P2.pick = pkI; const st = dbg.sim(meI, false, false, 4).log.join(' | ');
    ['The Warden was up', 'The Doomscales were up', 'The heart was open'].forEach((x) => { if (!st.includes(x)) bad('standing still all phase, "' + x + '" isn\'t in the mistakes (check I)'); });
    // (Nov 15, the press-to-cast attack: a moment counts only while you keep pressing 1; the job line says so, as phase 1's does)
    dbg.P2.pick = pkI; dbg.at(212, meI, { east: false, seed: 3 }); dbg.G.tgt = null; const hint = dbg.P2.jobText(); if (!/Tab to pick it, then keep pressing 1 to hit it/.test(hint)) bad('at 3:20 with no target, phase 2\'s job line reads "' + hint + '"; it should say Tab to pick the Warden, then keep pressing 1 (check I)');
    const PJ0 = rd('practice.js'); if (/e\.code === 'Tab' && !P2/.test(PJ0) || /const dpsStep = \(t, dt\) => \{ if \(P2\) return/.test(PJ0) || /const pickTgtAt = \(p\) => \{ if \(P2/.test(PJ0)) bad('Tab, a click or the damage tally is still off in phase 2 (check I)');
  } catch (e) { bad('the damage moments crashed phase 2: ' + e.message + ' (check I)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // K. the adds and the kicks, as on the kills (Nov 15; Flex: "if this skips any part of the fight that requires mechanical execution its not good
  //    enough", "i still dont see good interupt mechanics", "theres also add spawns being missed"; the 30 fastest Mythic kills in the log library,
  //    checked on 130 and the 26 phase 2 wipes). Before: three Malices a Warden at 3:03, 3:18 and 3:33, kicked 0.2 s into every bar; no Writhing
  //    Gestation or Clutches; Rawlings that left after 8 s and couldn't be hit; Wardens and Doomscales on a clock with no health; all four Doomscales
  //    up at 4:27.5 casting at once with a 2 s bar; no Revenge; no Ravenous Doomscale; a kick only visible to the kicker
  try {
    const Q = '\''; /* (the apostrophe in this check's messages: it was never defined, so a failing line here crashed the check instead of naming the problem; found Nov 16, the prompts audit) */
    const free = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = free; const meF = dbg.P2.slotOf(free);
    // (one Malice a Warden: 3:03.9 and the other Warden's 1.0 s later, a 1.5 s bar and a 6 s channel; a bot kicks it 0.45 to 0.8 s in)
    const S0 = script({ seed: 3 }), mt = S0.malice.map((m) => m.t0).sort((a, b) => a - b);
    if (S0.malice.length !== 2 || Math.abs(mt[0] - 183.9) > 0.3 || Math.abs(mt[1] - mt[0] - 1) > 0.2 || S0.malice.some((m) => Math.abs(m.ch - m.t0 - 1.5) > 0.01 || Math.abs(m.t1 - m.t0 - 7.5) > 0.01)) bad('the Wardens cast ' + S0.malice.length + ' Malices at ' + mt.map(clkS).join(', ') + '; on the kills each casts one, 3:03.9 and 1.0 s apart, a 1.5 s bar and a 6 s channel (check K)');
    const shG = S0.casts.filter((c) => /Writhing Gestation/.test(c.name)), shM = S0.casts.filter((c) => /Shadow Molt/.test(c.name));
    if (shG.length !== 2 || shG.some((c) => Math.abs(c.t0 - 180.1) > 0.3 || Math.abs(c.t1 - c.t0 - 3) > 0.01) || shM.some((c) => Math.abs(c.t0 - 176.6) > 0.3 || Math.abs(c.t1 - c.t0 - 3) > 0.01)) bad('the Wardens\' Shadow Molt (3:56.6) and Writhing Gestation (3:00.1), 3 s casts each, aren\'t on the kills\' clock (check K)');
    // (a played run: the Clutches, 2 east and 3 west, turn 0.3 s after the Gestation and die to the raid in under 12 s; each leaves a Rawling on its
    // spot; every small egg in a cauldron leaves one there; the Wardens die about 3:38; the Doomscales climb out 1 s after their eggs go in)
    dbg.at(166.05, meF, { east: false, seed: 3 }); const seenR = new Set(), clDead = {}; let rawN = 0, rawAt = 0, t1Seen = 0;
    while (dbg.G.t < 318) { dbg.step(1); const G = dbg.G; G.adds.forEach((a) => { if (a.own && !seenR.has(a)) { seenR.add(a); rawN++; if (a.t1 != null) t1Seen++; const cl = Object.values(G.p2.cl).find((c) => c.dead != null && Math.abs(c.dead - G.t) < 0.06 && hyp([c.x, c.y], [a.x, a.y]) < 0.5); if (cl) clDead[cl.id] = 1; else if (hyp([a.x, a.y], G.p2 && dbg.S.pits[a.side]) < 6) rawAt++; } }); }
    const G = dbg.G, cls = Object.values(G.p2.cl), set1 = cls.filter((c) => c.set === 1);
    if (set1.filter((c) => c.side === 'E').length !== 2 || set1.filter((c) => c.side === 'W').length !== 3 || set1.some((c) => c.born < 183.2 || c.born > 184))
      bad('the Clutches: ' + set1.map((c) => c.side + '@' + clkS(c.born)).join(' ') + '; on the kills the Warden\'s Writhing Gestation turns 2 east and 3 west at about 3:03.4 (check K)');
    if (cls.some((c) => c.dead == null || c.dead - c.born > 12 || c.hatched)) bad('a Clutch lived past 12 s or hatched: ' + cls.map((c) => c.id + ' ' + (c.dead == null ? 'alive' : (c.dead - c.born).toFixed(1) + ' s')).join(', ') + '; the kills kill them in about 6.9 s (check K)');
    if (Object.keys(clDead).length !== cls.length) bad('only ' + Object.keys(clDead).length + ' of ' + cls.length + ' dead Clutches left a Rawling on their spot (200 of 202 on the kills, check K)');
    if (rawAt !== 19) bad(rawAt + ' Rawlings came out of the cauldrons; one comes out for each of the 15 north and 4 south small eggs (check K)');
    if (rawN < 20 || t1Seen) bad(rawN + ' Rawlings in a run (' + t1Seen + ' leaving on their own); the kills have 24 a pull and kill every one (check K)');
    if (G.adds.some((a) => a.own)) bad('Rawlings were still up at 5:18 (the raid kills them in about 21 s, check K)');
    ['E', 'W'].forEach((s) => { const d = G.p2.wdead[s]; if (d == null || d < 214 || d > 223) bad('the ' + s + ' Warden died at ' + (d == null ? 'never' : clkS(d)) + '; the raid kills it about 3:38 (3:36 to 3:41 on the kills, check K)'); });
    const D = Object.entries(G.p2.dsS); if (D.length !== 4) bad(D.length + ' Weakened Doomscales climbed out; one comes from each of the four big eggs (check K)');
    D.forEach(([id, st]) => { const B = dbg.S.big.findIndex((b) => b.side === id[2] && b.which === (id[3] === '1' ? 'far' : 'close')), inAt = G.p2.dsAt[id] - 1;
      if (G.p2.big[B].state !== 'in' || Math.abs(st.up - inAt - 1) > 0.06) bad(id + ' climbed out at ' + clkS(st.up) + ', not 1.0 s after its egg went in (check K)');
      const cr = dbg.S.cries.filter((c) => c.ds === id).map((c) => +(c.t0 - st.up).toFixed(1)); if (cr.join() !== '7.8,23.6,39.4') bad(id + '\'s Cries come ' + cr.join(', ') + ' s after it climbs out; on the kills 7.8 s, then every 15.8 s (check K)');
      if (dbg.S.cries.some((c) => c.ds === id && !c.rev && Math.abs(c.t1 - c.t0 - 2.5) > 0.01)) bad(id + '\'s Cry bar isn\'t 2.5 s (2.50 to 2.52 on the kills, check K)');
      if ((st.dead == null && st.hp > 0.15) || (st.dead != null && st.dead < 300)) /* (on the kills they die 5:06 to 5:25, a median 5:12; the part ends at 5:18) */ bad(id + ' died at ' + (st.dead == null ? 'never' : clkS(st.dead)) + '; the kills kill them about 5:12, all four within a few seconds (check K)'); });
    // (Revenge: the first to die gives the rest +100%: a Cry that starts after it takes 1.25 s)
    if (G.p2.rev == null || !D.some(([, st]) => st.rev === G.p2.rev)) bad('no Doomscale got Revenge when the first one died (30 of 30 kills, check K)');
    if (dbg.S.cries.some((c) => c.t0 > G.p2.rev && G.p2.dsS[c.ds].dead > c.t0 && Math.abs(c.t1 - c.t0 - 1.25) > 0.01)) bad('a Cry after Revenge doesn\'t take 1.25 s (check K)');
    // (the bots kick a moment into the bar, not 0.2 s: Malice 0.45 to 0.8 s, a Cry 0.65 to 1.15 s)
    if (G.p2.intr.length < 0) bad('no kicks were seen (check K)');
    { const kt = []; dbg.at(166.05, meF, { east: false, seed: 5 }); while (dbg.G.t < 318) { dbg.step(1); dbg.G.p2.intr.forEach((q) => { if (!kt.some((x) => x.key === q.key)) { const c = dbg.S.malice.find((m) => 'm' + m.side + m.k === q.key) || dbg.S.cries.find((x) => 'c' + x.ds + x.i === q.key); if (c) kt.push({ key: q.key, d: q.t - c.t0, who: q.who }); } }); }
      const bots = kt.filter((x) => x.who !== meF), lo = bots.filter((x) => x.d < 0.4), hi = bots.filter((x) => x.d > 2.3), md = bots.map((x) => x.d).sort((p, q) => p - q)[Math.floor(bots.length / 2)]; /* (the kills: a median 0.6 s for Malice and 0.9 s for a Cry, as late as 2.3 s when a kicker is still walking up) */ if (!bots.length || lo.length || hi.length || !(md >= 0.6 && md <= 1.2)) bad('the bots kick ' + bots.map((x) => x.key + ' +' + x.d.toFixed(2)).join(', ') + '; on the kills Malice is kicked about 0.6 s in, a Cry about 0.9 s (check K)'); }
    // (you see every kick: an "Interrupted" label stands over the caster with who kicked it; your target's bar shows its cast, gold when you can kick it)
    dbg.at(T.malice + 0.2, meF, { east: false, seed: 3 }); const mF = dbg.S.malice.slice().sort((a, b) => a.t0 - b.t0)[0].side; dbg.G.tgt = 'wd' + mF; const cb = dbg.P2.castOf(dbg.G.t); if (!cb || !/Malice/.test(cb.name) || !cb.kick) bad('your target\'s bar during its Malice reads ' + (cb ? cb.name + (cb.kick ? ' (kick)' : '') : 'nothing') + '; it should show Malice, gold to kick (check K)');
    for (let i = 0; i < 40 && !dbg.G.p2.intr.some((q) => q.caster === 'wd' + mF); i++) dbg.step(1); const iq = dbg.G.p2.intr.find((q) => q.caster === 'wd' + mF); dbg.G.tgt = 'wd' + mF; const cb2 = dbg.P2.castOf(dbg.G.t);
    if (!iq) bad('the west Warden\'s Malice was kicked with no Interrupted label over it (check K)'); else if (!cb2 || !cb2.intr || !/Interrupted/.test(cb2.name)) bad('your target\'s bar doesn\'t say "Interrupted" after its Malice is kicked (' + (cb2 ? cb2.name : 'nothing') + ', check K)');
    { const A3 = { get G() { return dbg.G; }, get S() { return dbg.S; }, me: meF, bossAt: dbg.P2.bossAt, tailAt: dbg.P2.tailAt, rl: (id) => id[0], nm: (id) => id, clsC: () => null, P2: dbg.P2 }; const L3 = ctx.pg3dShapes(A3, dbg.G.t);
      /* (since the cast bars, Nov 16: the Warden's bar turns red and says "Interrupted", in place of the old floating label; check CB plays them all) */
      if (!L3.some((s) => s.k === 'cast' && s.caster === 'wd' + mF && s.state === 'kicked' && typeof ctx.pg3dCastLook === 'function' && ctx.pg3dCastLook(s).text === 'Interrupted')) bad('in 3D no red "Interrupted" bar stands over the kicked Warden (check K)'); }
    // (the backup: once a run a damage dealer with no kick of their own is the backup for a cast on their ledge and is told; a healer never)
    dbg.P2.pick = free; const rB = dbg.sim(meF, true, false, 4); if (!dbg.G.p2.bk || dbg.G.p2.kick[dbg.G.p2.bk.key] !== meF) bad('a ranged with no kick, played by the autopilot, is never the backup kicker, or doesn\'t kick it (' + JSON.stringify(dbg.G.p2.bk) + ', check K)');
    if (rB.log.length) bad('the backup run makes mistakes: ' + rB.log.join(' | ') + ' (check K)');
    const stB = dbg.sim(meF, false, false, 4); if (dbg.G.p2.bk && !stB.log.some((x) => /You were the backup and didn't kick/.test(x))) bad('a backup kick you don\'t press isn\'t a mistake (check K)');
    const pkH = { side: 'E', role: 'h', egg: null, mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pkH; dbg.sim(dbg.P2.slotOf(pkH), true, false, 4); if (dbg.G.p2.bk) bad('a healer was made the backup kicker; healers have no kick in Midnight (check K)');
    // (a Warden nobody helps lives on: a damage dealer standing still on its ledge lets it reach its second Writhing Gestation, more eggs turn)
    dbg.P2.pick = free; dbg.at(176, meF, { east: false, seed: 3 }); dbg.pos = [92, 30]; for (let i = 0; i < 1100; i++) { dbg.stepOwn(1); dbg.pos = [92, 30]; } const w2 = Object.values(dbg.G.p2.cl).filter((c) => c.set === 3 && c.side === 'E');
    if (!w2.length || !dbg.log.some((x) => /second Writhing Gestation/.test(x))) bad('a damage dealer who never hits the Warden doesn\'t let it reach its second Writhing Gestation (dead at ' + (dbg.G.p2.wdead.E ? clkS(dbg.G.p2.wdead.E) : 'never') + ', ' + w2.length + ' more Clutches, check K)');
    // (a Clutch left 20 s hatches a Viper; a Rawling left 35.5 s casts Acidic Expulsion: a hit and a stacking damage over time, and a mistake)
    dbg.at(183.5, meF, { east: false, seed: 3 }); const P0 = { c: P.CPACE, r: P.RPACE }; P.CPACE = 0;
    try { dbg.pos = [92, 30]; for (let i = 0; i < 440; i++) { dbg.stepOwn(1); dbg.pos = [92, 30]; } } finally { P.CPACE = P0.c; }
    if (!dbg.G.adds.some((a) => a.kind === 'viper') || !Object.values(dbg.G.p2.cl).some((c) => c.hatched)) bad('a Clutch nobody kills for 20 s doesn\'t hatch a Viper (check K)');
    dbg.at(183.5, meF, { east: false, seed: 3 }); P.RPACE = { warden: 0, eggs: 0, ds: 0 };
    try { dbg.pos = [92, 30]; for (let i = 0; i < 900; i++) { dbg.stepOwn(1); dbg.pos = [92, 30]; } } finally { P.RPACE = P0.r; }
    if (!dbg.log.some((x) => /cast Acidic Expulsion/.test(x)) || !(dbg.G.debs.acid && dbg.G.debs.acid.n >= 1)) bad('a Rawling nobody kills for 35.5 s doesn\'t cast Acidic Expulsion on you (check K)');
    // (Rawlings can be hit: in your targets with their health; your hits take it down; they stay until killed)
    dbg.at(192, meF, { east: false, seed: 3 }); const rt = dbg.P2.tgts(dbg.G.t).find((o) => o.kind === 'rawling'); if (!rt || !(rt.max > 0) || !(rt.hp > 0)) bad('a Rawling at 3:12 isn\'t a target with its health (check K)');
    else { const a = dbg.G.adds.find((q) => q.id === rt.key), h0 = a.hp; dbg.P2.hit(rt.key); ctx.__h = 0; if (a.hp !== h0) {} }
    // (a big egg left until Hatching Doom ends: a Ravenous Doomscale stands up there and its Dread Roar, 9 s later, stuns you)
    const pkR = { side: 'E', role: 'h', egg: 'far', mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pkR; const meR = dbg.P2.slotOf(pkR); dbg.at(240, meR, { east: false, seed: 3 }); dbg.pos = [96, 9];
    for (let i = 0; i < 700; i++) { dbg.stepOwn(1); dbg.pos = [96, 9]; } const rv = dbg.G.p2.rav[0];
    if (!rv || Math.abs(rv.t - 264) > 0.2 || !dbg.S.casts.some((c) => /Dread Roar/.test(c.name) && Math.abs(c.t0 - 270.5) < 0.3)) bad('a big egg left until 4:24 doesn\'t raise a Ravenous Doomscale with its Dread Roar 6.5 s later (check K)');
    if (!dbg.log.some((x) => /Ravenous Doomscale stood up/.test(x))) bad('the big egg left until 4:24 isn\'t a wipe mistake naming the Ravenous Doomscale (check K)');
    // (Flex, Nov 16: "when the raid goes to the opposite side theres two more small eggs that need to be broken out. The eggs also need to be broken out on the
    // first side of p2 as well"; the 30 fastest kills: the north eggs' Hardened shields break about 3:22, each egg breaks open about 6 s after the Warden dies;
    // the south eggs are broken out about 4:15.6 and carried in; the south big egg goes up as soon as they're grabbed; a ledge's two big eggs go in together,
    // a median 0.2 s apart. Before: the north eggs opened on a timer 0.7 s after the Warden, the south eggs turned into Clutches, the big eggs went in 4 to 6 s apart)
    dbg.P2.pick = free; dbg.at(166.05, meF, { east: false, seed: 3 }); let shOff = null, grab = {}, bigUp = {}, bigIn = {};
    while (dbg.G.t < 290) { dbg.step(1); const G = dbg.G, t = G.t; if (shOff == null && G.eggs.some((e) => !e.south && e.state === 'floor') && G.eggs.filter((e) => !e.south && e.state === 'floor').every((e) => e.hs === 0)) shOff = t; /* (the Hardened shield's share is e.hs since the prompts audit, Nov 16: practice.js wore down e.shp on your own egg) */
      ['E', 'W'].forEach((sd) => { const se = G.eggs.filter((e) => e.south && e.side === sd); if (grab[sd] == null && se.length === 2 && se.every((e) => e.state !== 'floor')) grab[sd] = t;
        dbg.S.big.forEach((B, i) => { if (B.side !== sd) return; const st = G.p2.big[i]; if (st.state === 'held' && bigUp[sd + B.which] == null) bigUp[sd + B.which] = t; if (st.state === 'in' && bigIn[sd + B.which] == null) bigIn[sd + B.which] = t; }); }); }
    if (shOff == null || shOff < 198 || shOff > 207) bad('the north eggs' + Q + ' Hardened shields come off at ' + (shOff == null ? 'never' : clkS(shOff)) + '; the raid breaks them about 3:22 (check K)');
    { const wd = dbg.G.p2.wdead.E, op = dbg.G.eggs.filter((e) => !e.south && e.side === 'E' && e.wd != null).map((e) => e.shell - wd); if (!op.length || Math.min(...op) < 2 || Math.max(...op) > 8.5 || op.sort((a, b) => a - b)[Math.floor(op.length / 2)] < 4) bad('the north eggs break open ' + op.map((x) => x.toFixed(1)).join(', ') + ' s after the Warden dies; the kills: a median 6.0, middle half 3.8 to 7.4 (check K)'); }
    ['E', 'W'].forEach((sd) => { if (grab[sd] == null || grab[sd] < 250 || grab[sd] > 262) bad('the ' + sd + ' ledge' + Q + 's two south small eggs are grabbed at ' + (grab[sd] == null ? 'never' : clkS(grab[sd])) + '; the raid breaks them out about 4:15.6 (check K)');
      else if (bigUp[sd + 'far'] == null || bigUp[sd + 'far'] - grab[sd] > 2.6 || bigUp[sd + 'far'] < grab[sd]) bad('the ' + sd + ' south big egg goes up at ' + (bigUp[sd + 'far'] == null ? 'never' : clkS(bigUp[sd + 'far'])) + ', not as soon as the south small eggs are grabbed (' + clkS(grab[sd]) + ', check K)');
      if (bigIn[sd + 'far'] == null || bigIn[sd + 'close'] == null || Math.abs(bigIn[sd + 'far'] - bigIn[sd + 'close']) > 1 || bigIn[sd + 'far'] < 265 || bigIn[sd + 'far'] > 270) bad('the ' + sd + ' ledge' + Q + 's big eggs go in at ' + [bigIn[sd + 'far'], bigIn[sd + 'close']].map((x) => (x == null ? 'never' : clkS(x))).join(' and ') + '; on the kills they go in together on a count (check K)'); });
    if (Object.values(dbg.G.p2.cl).some((c) => c.set === 2)) bad('the south eggs still turned into Clutches though the raid broke them out first (check K)');
    // (Flex, Nov 16: "Yes, do that": both of a ledge\'s big eggs drop in on one count, within a second, about 4:28 (the kills: south 4:28.0, north 4:29.2, 22 of 30
    // within 2 s), on every run; a player carrying one gets the count as a boss-mod bar (and a 3, 2, 1 call))
    { let off = []; for (const [east, seed] of [[true, 5], [false, 11], [true, 14]]) { dbg.at(166.05, meF, { east, seed }); const inT = {}; while (dbg.G.t < 280) { dbg.step(1); dbg.S.big.forEach((B, i) => { if (dbg.G.p2.big[i].state === 'in' && inT[B.side + B.which] == null) inT[B.side + B.which] = dbg.G.t; }); }
        ['E', 'W'].forEach((sd) => { const a = inT[sd + 'far'], b = inT[sd + 'close']; if (a == null || b == null || Math.abs(a - b) > 1 || a < 265 || a > 270) off.push(sd + ' seed ' + seed + ': ' + [a, b].map((x) => (x == null ? 'never' : clkS(x))).join('/')); }); }
      if (off.length) bad('a ledge\'s two big eggs don\'t go in together about 4:28: ' + off.join(', ') + ' (check K)');
      const pkB2 = { side: 'W', role: 'h', egg: 'close', mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pkB2; dbg.at(259, dbg.P2.slotOf(pkB2), { east: false, seed: 3 }); if (!dbg.upNext().some((q) => /Your big egg: in together/.test(q.text))) bad('carrying the north big egg, your boss-mod bars have no "Your big egg: in together" count (check K)'); dbg.P2.pick = free; }
    // (and the north healer runs alone: nobody within 15 yards at the pickup (30 of 30 kills))
    { dbg.at(166.05, meF, { east: false, seed: 3 }); let alone = null; while (dbg.G.t < 262 && alone == null) { dbg.step(1); const i = dbg.S.big.findIndex((b) => b.side === 'E' && b.which === 'close'), st = dbg.G.p2.big[i]; if (st.state === 'held') { const p = [dbg.G.bots[st.who].x, dbg.G.bots[st.who].y]; alone = Object.keys(dbg.G.bots).filter((id) => id !== st.who && Math.hypot(dbg.G.bots[id].x - p[0], dbg.G.bots[id].y - p[1]) < 15).length; } }
      if (alone !== 0) bad('the north big egg' + Q + 's healer has ' + alone + ' raiders within 15 yards at the pickup; on the kills they run there alone (check K)'); }
    // (picking the south big egg up before the south small eggs are grabbed turns them into Clutches, and it\'s a mistake)
    { const pkF = { side: 'E', role: 'm', egg: 'far', mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pkF; const meFar = dbg.P2.slotOf(pkF); dbg.at(240, meFar, { east: false, seed: 3 }); const B = dbg.S.big.find((b) => b.side === 'E' && b.which === 'far'); dbg.pos = [B.x, B.y]; dbg.stepOwn(4);
      if (!dbg.log.some((x) => /small eggs still out/.test(x))) bad('picking up the south big egg before the south small eggs are grabbed isn\'t a mistake (check K)'); dbg.stepOwn(20); if (!Object.values(dbg.G.p2.cl).some((c) => c.set === 2)) bad('the south small eggs don\'t turn into Clutches when the south big egg goes up first (check K)'); }
    // (Flex, Nov 15: "Make the player always get one of the grasping fangs, randomize if its the early break or 5 break": with a random tether you get one
    // every run, the solo or one of the five, both over a few seeds, and the raid still has six, three a ledge, one solo)
    { const pkT2 = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }, meT2 = dbg.P2.slotOf(pkT2), kinds = new Set(); let none = 0, shape = 0;
      for (let seed = 1; seed <= 24; seed++) { const J5 = ctx.pgP2Jobs(seed, meT2, pkT2), tt = Object.keys(J5).filter((id) => J5[id].teth); if (!J5[meT2].teth) none++; else kinds.add(J5[meT2].teth);
        if (tt.length !== 6 || tt.filter((id) => J5[id].side === 'E').length !== 3 || tt.filter((id) => J5[id].teth === 'solo').length !== 1) shape++; }
      if (none) bad('with a random tether you got none on ' + none + ' of 24 runs; Flex: the player always gets one (check K)'); if (kinds.size < 2) bad('with a random tether you only ever got ' + [...kinds].join('') + '; it should be the solo or one of the five at random (check K)');
      if (shape) bad('forcing your tether broke the raid\'s six (three a ledge, one solo) on ' + shape + ' of 24 runs (check K)'); }
    // (Flex, Nov 15: "the health bars in p2 arent moving": your target's frame shows the Warden's health falling as the raid hits it, and after your hit)
    { dbg.P2.pick = free; dbg.at(190, meF, { east: false, seed: 3 }); dbg.G.tgt = 'wdE'; const f1 = dbg.tf(); dbg.stepOwn(60); dbg.G.tgt = 'wdE'; const f2 = dbg.tf(); dbg.P2.hit('wdE'); const f3 = dbg.tf();
      const tg = dbg.P2.tgts(dbg.G.t).find((o) => o.key === 'wdE'); if (!tg || !(tg.hpFr > 0 && tg.hpFr < 1)) bad('the Warden as a target gives no health (hpFr) at 3:13 (check K)');
      if (!f1 || !f2 || !f3 || f1.pct == null || !(f2.pct < f1.pct) || !(f3.pct < f2.pct)) bad('your target frame\'s Warden health doesn\'t fall (' + [f1, f2, f3].map((q) => (q && q.pct != null ? q.pct.toFixed(1) : '-')).join(' → ') + '): over 3 s, then after your hit (check K)'); }
    // (Flex, Nov 15: "the big egg thats closest to the group gets picked up right away ... The delayed egg is the far away one". The 20 fastest kills: at
    // 4:05 every half stands at its ledge's south end, so the south egg is the near one, picked up first on 13 of 18 ledges (median 4:16.7, the north one
    // 4:19.4). The game: the half waits by the south egg, the south egg goes first)
    { dbg.P2.pick = free; dbg.at(245, meF, { east: false, seed: 3 }); ['E', 'W'].forEach((s) => { const ids = Object.keys(dbg.S.job).filter((id) => id !== meF && dbg.S.job[id].side === s && !dbg.S.job[id].big), xs = ids.map((id) => dbg.G.bots[id]), c = [xs.reduce((a, b) => a + b.x, 0) / xs.length, xs.reduce((a, b) => a + b.y, 0) / xs.length];
      const sB = dbg.S.big.find((b) => b.side === s && b.which === 'far'), nB = dbg.S.big.find((b) => b.side === s && b.which === 'close'); if (!(hyp(c, [sB.x, sB.y]) < hyp(c, [nB.x, nB.y]))) bad('at 4:05 the ' + s + ' half stands nearer its north big egg; on the kills every half is at the south end, by the south egg (check K)'); }); }
    // (the rest of the audit's list, Nov 15: the heart burn's small tails (Gore Rattle pairs fire about 4:52.8 and 5:05.5 from measured edge spots, three
    // waves each), Virulent Spit (a green swirl on each ledge every 20 s from 3:23, landing 6.5 s later; the 1st and 3rd on your ledge under you), and
    // no attacking while stunned. Before: none of the three, and a stunned player still hit)
    { const S2 = script({ seed: 3 }); const spots = [[[39, -39], [0, -56], [0, 57]], [[40, 40], [-40, -39], [-40, 40], [55, 0]]];
      if (S2.tails.length !== 2 || S2.tails.some((q, k) => Math.abs(q.at - T.rattle[k]) > 0.01 || !spots[k].some((p) => hyp(p, [q.x, q.y]) < 0.5)) || S2.waves.filter((w) => w.kind === 'tail').length !== 6) bad('the heart burn\'s small tails: ' + S2.tails.map((q) => clkS(q.at) + ' at ' + q.x + ',' + q.y).join('; ') + '; the kills have a pair at 4:52.8 and 5:05.5 at measured edge spots, three waves each (check K)'); }
    dbg.P2.pick = free; dbg.at(166.05, meF, { east: false, seed: 3 }); while (dbg.G.t < 272) dbg.step(1); const sp = dbg.S.impacts.filter((m) => m.name === 'Virulent Spit');
    if (sp.length !== 8 || T.spit.some((at) => sp.filter((m) => Math.abs(m.at - at - 6.5) < 0.1).length !== 2)) bad(sp.length + ' Virulent Spit swirls landing at ' + [...new Set(sp.map((m) => clkS(m.at)))].join(', ') + '; one a ledge every 20 s from 3:23, landing 6.5 s later (check K)');
    dbg.at(203, meF, { east: false, seed: 3 }); const px = [dbg.G.x, dbg.G.y]; for (let i = 0; i < 160; i++) { dbg.stepOwn(1); dbg.pos = px; } if (!dbg.log.some((x) => /Virulent Spit landed on you/.test(x))) bad('the 3:23 Virulent Spit under you lands with no mistake when you stand still (check K)');
    for (const [east, seed] of [[false, 3], [true, 5]]) { dbg.P2.pick = free; dbg.at(166.05, meF, { east, seed }); const wv = dbg.audit(east, seed).filter((x) => /Caustic Waves|Virulent Spit/.test(x)); if (wv.length) bad('the bots stand in the small tails\' waves or the spit: ' + wv.join(' | ') + ' (seed ' + seed + ', check K)'); }
    { dbg.P2.pick = free; dbg.at(275, meF, { east: false, seed: 3 }); dbg.G.tgt = null; dbg.G.debs.stun = { until: dbg.G.t + 5, n: 1 }; dbg.G.gcd0 = -99; const h0 = dbg.G.hits || 0; dbg.atk(); if ((dbg.G.hits || 0) !== h0) bad('a stunned player can still attack (check K)'); }
    // (Main's playtest, Nov 15: Melee / South big egg let a cauldron Rawling live 35 s (Acidic Expulsion at 4:34, grade 76): the raid slowed for the hits of a
    // player who was walking to the south egg. Now the raid waits on your hits only while you're free and near, and cleaves the last Rawlings with the Doomscales)
    for (const [side, east, seed] of [['E', false, 3], ['E', true, 7], ['W', false, 5]]) { const pkS2 = { side, role: 'm', egg: 'far', mal: 0, cry: 0, teth: 'random' }; dbg.P2.pick = pkS2; const rS2 = dbg.sim(dbg.P2.slotOf(pkS2), true, east, seed);
      if (rS2.log.some((x) => /Acidic Expulsion/.test(x))) bad('Melee / South big egg (' + side + ' ledge, seed ' + seed + '), played by the autopilot, lets a Rawling reach Acidic Expulsion: ' + rS2.log.join(' | ') + ' (check K)'); }
    if (/small tail[^']*\bring/i.test(rd('practice-p2.js')) || !/a short fan of three waves/.test(rd('practice-p2.js'))) bad('the small tails\' words don\'t say a short fan of waves (check K)');
    // (no damage moment while you carry an egg; after a start-at, the Rawlings up then are still up)
    const pkC = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pkC; const meC = dbg.P2.slotOf(pkC); dbg.at(232, meC, { east: false, seed: 3 }); if (dbg.G.eggs.some((e) => e.who === meC && e.state === 'held') && dbg.P2.dpsCat(dbg.G.t)) bad('carrying your egg you\'re asked to hit ' + dbg.P2.dpsCat(dbg.G.t) + '; carrying it is your job then (check K)');
    dbg.P2.pick = free; const tg = dbg.ff ? null : null; dbg.at(166.05, meF, { east: false, seed: 3 }); while (dbg.G.t < 240) dbg.step(1); const nUp = dbg.G.adds.filter((a) => a.own).length; dbg.G.adds = []; dbg.P2.ff(); if (nUp && dbg.G.adds.filter((a) => a.own).length !== nUp) bad('after a start-at the ' + nUp + ' Rawlings up then are gone (check K)');
  } catch (e) { bad('the adds and kicks crashed phase 2: ' + e.message + ' (check K)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // CB. the cast bars over the casters you can kick (Nov 16, Flex: "The interupts are impossible to track/see. The monsters should have cast bars over their
  //     heads i think to make it more visually clear theres something that needs to be interrupted", then "I appreceate the time stamps and everything on the
  //     fight, but remember this is intended to be training wheels for people to do the fight"). Before it Malice and Anguished Cry showed as a ring on the
  //     floor with a label counting seconds, and on your target's frame only while you had that caster targeted. Played step by step on several seeds and
  //     jobs (a melee on Malice, a melee and a ranged on a Cry, a healer, a ranged with no kick), once with the kicks landing and once with every kicker held
  //     off so each cast runs to its end: every Malice and Cry has one bar over its caster (within 0.5 yd) through its kick window (Malice: its bar and the
  //     0.9 s of its channel you can still kick in), filling with it (within 0.05), yours exactly when it's your kick (your plan's or the backup's; never a
  //     healer's), in reach exactly when you are; none before or after the window but the red "Interrupted" for about 0.8 s after a kick; and pg3dShapes
  //     draws a 'cast' for each bar, just over its caster's head, with no number in any words over that caster.
  try {
    if (typeof dbg.P2.castBars !== 'function') bad('phase 2 has no cast bars over its casters (castBars): Malice and Anguished Cry still show as a ring on the floor with seconds, and on your target\'s frame only while you have that caster targeted (check CB)');
    else {
      const errs = [], note = (m) => { if (errs.length < 10 && !errs.includes(m)) errs.push(m); }, HEAD = { w: 7, d: 4.5 };
      const wins = (S) => S.malice.map((m) => ({ key: 'm' + m.side + m.k, caster: 'wd' + m.side, t0: m.t0, t1: m.by, side: m.side, mal: true, dk: 1 }))
        .concat(S.cries.filter((c) => c.t1 > c.t0).map((c) => ({ key: 'c' + c.ds + c.i, caster: c.ds, t0: c.t0, t1: c.t1, side: c.side, mal: false, dk: c.dk })));
      const posOf = (G, w) => (w.mal ? G.p2.wd[w.side] || null : G.p2.ds[w.caster] ? [G.p2.ds[w.caster].x, G.p2.ds[w.caster].y] : null);
      const kicker = (G, S, me, w) => (G.p2.bk && G.p2.bk.key === w.key ? me : Object.keys(S.job).find((id) => S.job[id].side === w.side && (w.mal ? S.job[id].mal === 1 : S.job[id].cry === w.dk)) || null);
      const runs = [[{ side: 'E', role: 'm', egg: null, mal: 1, cry: 0, teth: 'none' }, 3, false], [{ side: 'W', role: 'm', egg: null, mal: 0, cry: 1, teth: 'none' }, 5, true], [{ side: 'E', role: 'h', egg: null, mal: 0, cry: 0, teth: 'none' }, 8, false],
        [{ side: 'W', role: 'r', egg: null, mal: 0, cry: 2, teth: 'none' }, 6, true], [{ side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }, 4, false]];
      for (const [pk, seed, east] of runs) for (const hold of [false, true]) {
        dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), rg = P.KICK[me[0]] || 0, tag = pk.role + (pk.mal ? ' on Malice' : pk.cry ? ' on Cry ' + pk.cry : '') + ' (seed ' + seed + (hold ? ', kicks held' : '') + ')';
        const A3 = { get G() { return dbg.G; }, get S() { return dbg.S; }, me, bossAt: dbg.P2.bossAt, tailAt: dbg.P2.tailAt, rl: (id) => id[0], nm: (id) => id, clsC: () => null, P2: dbg.P2 };
        dbg.at(T.malice - 0.6, me, { east, seed }); const S = dbg.S, seen = new Set(), full = new Set(), kseen = new Set(); let n = 0;
        while (dbg.G.t < T.end - 0.1) { const G = dbg.G, t0 = G.t, live = wins(S).filter((w) => t0 >= w.t0 - 0.2 && t0 <= w.t1 && !G.p2.kick[w.key]); let own = false;
          /* (held: every kicker but you stunned through the window, and you don't press E, so each cast runs to its end) */
          if (hold) live.forEach((w) => { const who = kicker(G, S, me, w); if (who === me) own = true; else if (who) G.p2.stun[who] = t0 + 0.2; });
          if (hold && own) dbg.stepOwn(1); else dbg.step(1); G.hp = 100; n++;
          const t = G.t, bars = dbg.P2.castBars(t), W = wins(S);
          bars.forEach((b) => { const w = W.find((q) => q.key === b.key); if (!w) note(tag + ': a bar "' + b.key + '" at ' + clkS(t) + ' that is no Malice or Cry');
            else { if (b.caster !== w.caster) note(tag + ': ' + b.key + '\'s bar names ' + b.caster + ', not its caster ' + w.caster); if (!(b.h >= HEAD[w.caster[0]])) note(tag + ': ' + b.key + '\'s bar sits ' + b.h + ' yards up, in its caster\'s head (at least ' + HEAD[w.caster[0]] + ')'); }
            if (/\d/.test(String(b.name))) note(tag + ': a bar\'s words have a number in them: "' + b.name + '"'); if (b.mine && !rg) note(tag + ': a healer\'s bar says it\'s their kick'); });
          W.forEach((w) => { const bs = bars.filter((b) => b.key === w.key), p = posOf(G, w), k = G.p2.kick[w.key], at = clkS(t) + ' (' + (t - w.t0).toFixed(2) + ' s in)';
            if (k && k !== 'none') { const iq = G.p2.intr.find((q) => q.key === w.key), a = iq ? t - iq.t : 99;
              if (a >= 0.02 && a <= 0.75 && p) { if (bs.length !== 1 || bs[0].state !== 'kicked') note(tag + ': ' + w.key + ' kicked ' + a.toFixed(2) + ' s ago shows ' + (bs.length ? bs.map((b) => b.state).join(', ') : 'no bar') + ', not one red "Interrupted"'); else kseen.add(w.key); }
              else if (a > 0.85 && bs.length) note(tag + ': ' + w.key + '\'s bar is still up ' + a.toFixed(2) + ' s after its kick'); return; }
            if (t > w.t0 + 0.02 && t < w.t1 - 0.02 && !k && p) { const f = (t - w.t0) / (w.t1 - w.t0), b = bs[0];
              if (bs.length !== 1) { note(tag + ': ' + w.key + ' has ' + bs.length + ' bars over it at ' + at + ', in its kick window, not one'); return; }
              if (b.state !== 'cast') note(tag + ': ' + w.key + '\'s bar at ' + at + ' is "' + b.state + '", not casting');
              if (Math.hypot(b.x - p[0], b.y - p[1]) > 0.5) note(tag + ': ' + w.key + '\'s bar is ' + Math.hypot(b.x - p[0], b.y - p[1]).toFixed(1) + ' yd off its caster at ' + at);
              if (!(Math.abs(b.f - f) <= 0.05)) note(tag + ': ' + w.key + '\'s bar is ' + Math.round(b.f * 100) + '% full at ' + at + '; its kick window is ' + Math.round(f * 100) + '% gone');
              const mine = !!rg && kicker(G, S, me, w) === me, near = !!rg && Math.hypot(p[0] - G.x, p[1] - G.y) <= rg;
              if (b.mine !== mine) note(tag + ': ' + w.key + '\'s bar ' + (mine ? 'doesn\'t say it\'s your kick, and it is' : 'says it\'s your kick, and it isn\'t') + ' (' + at + ')');
              if (b.near !== near) note(tag + ': ' + w.key + '\'s bar says you\'re ' + (b.near ? 'in' : 'out of') + ' reach at ' + at + ', and you\'re ' + (near ? 'in' : 'out of') + ' it');
              seen.add(w.key); if (f >= 0.9) full.add(w.key); }
            else if ((t < w.t0 - 0.02 || t > w.t1 + 0.02 || k === 'none') && bs.length) note(tag + ': ' + w.key + ' has a bar at ' + clkS(t) + ', outside its kick window (' + clkS(w.t0) + ' to ' + clkS(w.t1) + ')'); });
          if (bars.length && n % 5 === 0) { const L3 = ctx.pg3dShapes(A3, t);
            bars.forEach((b) => { if (!L3.some((s) => s.k === 'cast' && s.key === b.key && s.state === b.state && s.x === b.x && s.y === b.y)) note(tag + ': pg3dShapes draws no cast bar for ' + b.key + ' at ' + clkS(t));
              const lb = L3.find((s) => s.k === 'label' && Math.hypot(s.x - b.x, s.y - b.y) < 0.6 && /\d/.test(s.text || '')); if (lb) note(tag + ': "' + lb.text + '" floats over ' + b.caster + ' with its cast bar at ' + clkS(t) + ' (training wheels: no seconds)'); }); } }
        const mal = [...seen].filter((k) => k[0] === 'm').length, cry = [...seen].filter((k) => k[0] === 'c').length;
        if (mal < 2 || cry < 6) note(tag + ': only ' + mal + ' Malice and ' + cry + ' Cry bars were seen; both Malices and the Cries should have one');
        if (hold && ([...full].filter((k) => k[0] === 'm').length < 2 || [...full].filter((k) => k[0] === 'c').length < 6)) note(tag + ': with the kicks held only ' + full.size + ' bars filled to the end of their window (' + [...full].join(' ') + ')');
        if (!hold && kseen.size < 2) note(tag + ': only ' + kseen.size + ' red "Interrupted" bars were seen after the kicks landed'); }
      errs.forEach((m) => bad('the cast bars: ' + m + ' (check CB)')); }
  } catch (e) { bad('the cast bars crashed phase 2: ' + e.message + ' (check CB)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // RS. the release sweep, Nov 16 (Flex: "im trying to have this game in a released state for today, so i just need it to really work and be functional"). Each
  //     failed on the code before its fix:
  //     - the backup kick went to a player whose own kick came within the kick's 15 s cooldown: both of a ledge's Doomscales cast their Cry together, so the
  //       default melee and ranged job (Malice and a Cry) always lost a Cry; and the autopilot's own kicks ignored the cooldown, so no check saw it;
  //     - E went to your target's cast before your own: on the Doomscales (your damage target the other one) it kicked the other Cry and let yours through;
  //     - the Go-here arrow sat on your big egg from 16 s before its pickup time: walking there picked it up with the small eggs still out;
  //     - the small eggs' waiting spots sat on the other carriers' lanes (0.4 yards from one) and the arrow put you on your closed egg beside them: carriers
  //       splashed with you on Melee East egg 5 and Ranged West egg 2 every run;
  //     - your big egg's cauldron spot was 8 yards in, and the marker goes 2.5 yards from its spot: you could stop outside the 9-yard ring;
  //     - a melee's Rawling and Doomscale moments came on 8 and 12 yards out (the reach is 5 past the add's edge), while the job held them off for the debris;
  //     - a missed Malice kept ticking on you after "Keep going" (phase 2 had no revive).
  try { const rs = (m) => bad(m + ' (the release sweep, Nov 16, check RS)');
    // (the backup and the kick cooldown)
    for (const [pk, seed, east] of [[{ side: 'W', role: 'r', egg: 'n6', mal: 1, cry: 2, teth: 'random' }, 8, true], [{ side: 'E', role: 'm', egg: 'far', mal: 1, cry: 1, teth: 'random' }, 2, false]]) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), r = dbg.sim(me, true, east, seed), G = dbg.G, S = dbg.S, j = S.job[me], b = G.p2.bk, tag = pk.side + ' ' + pk.role + ' seed ' + seed;
      const own = S.malice.filter((m) => m.side === j.side && j.mal).map((m) => ['m' + m.side + m.k, m.t0]).concat(S.cries.filter((c) => c.side === j.side && c.dk === j.cry).map((c) => ['c' + c.ds + c.i, c.t0]));
      const clash = b && own.find(([k, t0]) => k !== b.key && t0 > b.t - 0.3 && t0 < b.t + 15); if (clash) rs('the default job (' + tag + ') was made the backup for ' + b.key + ' at ' + clkS(b.t) + ' with its own kick ' + clash[0] + ' at ' + clkS(clash[1]) + ', inside the 15 s cooldown: one of the two always goes through');
      if (r.log.some((x) => /kick/.test(x))) rs('the autopilot playing the default job (' + tag + ') misses a kick: ' + r.log.join(' | ')); }
    { const pk = { side: 'E', role: 'm', egg: null, mal: 1, cry: 0, teth: 'none' }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(170, me, { east: false, seed: 3 }); const m = dbg.S.malice.find((q) => q.side === 'E');
      dbg.at(m.t0 - 1, me, { east: false, seed: 3 }); dbg.step(80); if (dbg.G.p2.kick.mE1 !== me || !(dbg.G.p2.kickCd >= m.t0 && dbg.G.p2.kickCd <= m.by)) rs('the autopilot\'s Malice kick (' + dbg.G.p2.kick.mE1 + ') doesn\'t put its kick on cooldown (kickCd ' + dbg.G.p2.kickCd + ')');
      dbg.at(m.t0 - 1, me, { east: false, seed: 3 }); dbg.G.p2.kickCd = dbg.G.t - 5; dbg.step(80); if (dbg.G.p2.kick.mE1 === me) rs('the autopilot kicked Malice with its kick on cooldown (used 5 s before): its kicks skip the 15 s cooldown, so the checks never see a clash'); }
    // (a free ranged on an odd seed is the backup on its second chance: each cast counts once, not once a 0.05 s step (which made it the first cast's)
    { const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.sim(me, true, false, 5); const b = dbg.G.p2.bk;
      if (!b || b.key === 'mE1') rs('a ranged with no kick on an odd seed is the backup for ' + (b ? b.key + ', its first chance' : 'nothing') + '; each cast counts once, so it should be its second'); }
    // (E: your own kick first)
    { const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 1, teth: 'none' }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(166.05, me, { east: false, seed: 3 }); while (dbg.G.t < 300 && !dbg.S.cries.some((c) => c.ds === 'dsE2' && c.i === 1)) dbg.step(20);
      const c1 = dbg.S.cries.find((c) => c.ds === 'dsE1' && c.i === 1), c2 = dbg.S.cries.find((c) => c.ds === 'dsE2' && c.i === 1); dbg.at(c1.t0 - 0.4, me, { east: false, seed: 3 }); while (dbg.G.t < Math.max(c1.t0, c2.t0) + 0.3) dbg.stepOwn(1);
      const kb = dbg.P2.castBars(dbg.G.t); if (!kb.some((q) => q.key === 'cdsE11' && q.near) || !kb.some((q) => q.key === 'cdsE21' && q.near)) rs('the test lost its setup: both east Doomscales\' first Cries should be casting in your reach at ' + clkS(dbg.G.t));
      else { dbg.G.tgt = 'dsE2'; dbg.kick(); if (dbg.G.p2.kick.cdsE11 !== me) rs('with the other Doomscale your target, E kicked ' + (Object.keys(dbg.G.p2.kick).filter((k) => k[0] === 'c' && dbg.G.p2.kick[k] === me).join(' ') || 'nothing') + ', not your own Anguished Cry (cdsE11)'); } }
    // (the arrow for a big egg)
    for (const [pk, seed] of [[{ side: 'E', role: 'h', egg: 'close', mal: 0, cry: 0, teth: 'none' }, 1], [{ side: 'W', role: 'm', egg: 'far', mal: 0, cry: 0, teth: 'none' }, 2]]) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(240, me, { east: false, seed }); const B = dbg.S.big.find((q) => q.side === pk.side && q.which === pk.egg), bi = dbg.S.big.indexOf(B), on = [];
      while (dbg.G.t < 262 && dbg.G.p2.big[bi].state === 'floor') { dbg.step(4); const at = dbg.S.bigAt[pk.side][pk.egg]; if (dbg.G.t < at - 0.7) { const jb = dbg.P2.job(me, dbg.G.t); if (jb.ob && hyp(jb.ob.p, [B.x, B.y]) < 3) on.push(clkS(dbg.G.t)); } }
      if (on.length) rs('the Go-here arrow sits on your ' + (pk.egg === 'far' ? 'south' : 'north') + ' big egg at ' + on.slice(0, 3).join(', ') + ', before its pickup time: walking there picks it up with the small eggs still out');
      const st = dbg.G.p2.big[bi]; if (st.state === 'held' && st.who === me) { const jb = dbg.P2.job(me, dbg.G.t); if (!jb.ob || hyp(jb.ob.p, dbg.S.pits[pk.side]) > P.THROW - 2.5) rs('your big egg\'s spot by the cauldron is ' + (jb.ob ? hyp(jb.ob.p, dbg.S.pits[pk.side]).toFixed(1) : '?') + ' yards from its centre; the marker goes 2.5 yards from it, so stopping there can leave you outside the ' + P.THROW + '-yard ring'); }
      else rs('the autopilot didn\'t pick up its ' + pk.egg + ' big egg by 4:22 (' + st.state + ')'); }
    // (the small eggs: the waiting spots, the arrow, and no carrier splashing with you)
    { const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.wdie - 2, me, { east: false, seed: 3 }); const G = dbg.G, S = dbg.S, off = [];
      while (G.t < 232 && (G.p2.wd.E || G.p2.wd.W)) dbg.step(1); dbg.step(4); /* (both Wardens just dead: every egg still closed, its carrier at its waiting spot) */
      ['E', 'W'].forEach((s) => { const E = S.eggs.filter((q) => q.side === s), gap = (q) => { const o = Math.max(0, S.lane[s].indexOf(q.n)); return [(s === 'E' ? 1 : -1) * (120 - o * 3.8), 34]; }, segD = (p, a, c) => { const vx = c[0] - a[0], vy = c[1] - a[1], u = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy))); return Math.hypot(p[0] - a[0] - vx * u, p[1] - a[1] - vy * u); };
        G.eggs.filter((e) => e.side === s && !e.south && e.state === 'floor' && e.id && e.id !== me && G.t < e.shell - 0.9).forEach((e) => { const jb = dbg.P2.job(e.id, G.t), w = jb.ob && jb.ob.p; if (!w) { off.push(s + ' egg ' + e.n + ': no spot'); return; }
          const eg = Math.min(...E.map((q) => hyp(w, [q.x, q.y]))), ln = Math.min(...E.filter((q) => q.n !== e.n).map((q) => segD(w, [q.x, q.y], gap(q)))); if (eg < 3.5 || ln < 2.5) off.push(s + ' egg ' + e.n + ' waits ' + eg.toFixed(1) + ' yd from an egg, ' + ln.toFixed(1) + ' from a lane'); }); });
      if (off.length) rs('the small eggs\' waiting spots sit by the eggs or on the other carriers\' lanes (3.6 yards from every egg, off the lanes): ' + off.join('; ')); }
    for (const [pk, seeds] of [[{ side: 'E', role: 'm', egg: 'n5', mal: 1, cry: 1, teth: 'random' }, [1, 2]], [{ side: 'W', role: 'r', egg: 'n2', mal: 1, cry: 1, teth: 'random' }, [1]]]) for (const seed of seeds) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.wdie - 1, me, { east: seed % 2 === 0, seed }); const G = dbg.G, e = G.eggs.find((q) => q.id === me), was = new Map(G.eggs.map((q) => [q, q.state])), tag = pk.side + ' ' + pk.role + ' egg ' + e.n + ', seed ' + seed; let onEgg = 0, near = 99;
      while (G.t < T.throwAt + 4) { dbg.step(1); const soon = e.state === 'held' || (e.state === 'floor' && G.t >= e.shell - 1 && hyp([G.x, G.y], [e.x, e.y]) < 4);
        if (e.state === 'floor' && G.t < e.shell - 0.9) { const jb = dbg.P2.job(me, G.t); if (jb.ob && hyp(jb.ob.p, [e.x, e.y]) < 2.5) onEgg++; }
        G.eggs.forEach((q) => { if (was.get(q) === 'floor' && q.state === 'held' && q.who !== me && soon) near = Math.min(near, hyp([G.bots[q.who].x, G.bots[q.who].y], [G.x, G.y])); was.set(q, q.state); }); }
      if (onEgg) rs('the Go-here arrow puts you (' + tag + ') on your egg while it\'s closed, beside the other carriers\' lanes, for ' + (onEgg / 20).toFixed(1) + ' s; it should show your waiting spot until it opens');
      if (near < 3.6) rs('a bot picked up its egg ' + near.toFixed(1) + ' yards from you (' + tag + ') as you were about to pick up yours');
      if (dbg.log.some((x) => /3-yard circle/.test(x))) rs('the autopilot carrying its egg (' + tag + ') splashes with a bot carrier: ' + dbg.log.filter((x) => /3-yard circle/.test(x)).join(' | ')); }
    // (a melee's damage moments, in reach only, once the Warden is dead)
    for (const [pk, seed, east] of [[{ side: 'W', role: 'm', egg: 'far', mal: 0, cry: 0, teth: 'random' }, 6, true], [{ side: 'E', role: 'm', egg: 'far', mal: 1, cry: 1, teth: 'random' }, 7, false]]) {
      dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(T.wdie + 4, me, { east, seed }); const G = dbg.G, tag = pk.side + ' melee, seed ' + seed, R = { rawling: 1.1, clutch: 1.4, ds: 2.6 }, far = [];
      while (G.t < 318) { dbg.step(1); const c = dbg.P2.dpsCat(G.t); if (!R[c] || G.p2.wd[pk.side]) continue; if (!dbg.P2.tgts(G.t).some((o) => o.kind === c && o.side === pk.side && hyp(o.p, [G.x, G.y]) < 5 + R[c] + 0.01)) far.push(clkS(G.t) + ' ' + c); }
      if (far.length) rs('a melee (' + tag + ') has a damage moment with nothing of it in reach (5 yards past its edge): ' + [...new Set(far)].slice(0, 4).join(', '));
      const r = dbg.sim(me, true, east, seed); if (r.log.some((x) => /were up|was up/.test(x))) rs('the autopilot melee (' + tag + '), following its job, misses a damage moment: ' + r.log.join(' | ')); }
    // (Keep going after a death: a missed Malice's ticks left stop on you)
    { const pk = { side: 'E', role: 'm', egg: null, mal: 1, cry: 0, teth: 'none' }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk); dbg.at(170, me, { east: false, seed: 3 }); const m = dbg.S.malice.find((q) => q.side === 'E');
      dbg.at(m.t0 - 1, me, { east: false, seed: 3 }); while (dbg.G.t < m.ch + 2.5) dbg.stepOwn(1);
      if (dbg.G.p2.kick.mE1 !== 'none') rs('the test lost its setup: the 3:03 Malice should be missed (' + dbg.G.p2.kick.mE1 + ')');
      else if (typeof dbg.P2.revive !== 'function') rs('phase 2 has no revive(): after "Keep going" a missed Malice keeps ticking on you (about half your health a tick) and kills you again');
      else { dbg.G.hp = 100; dbg.G.debs = {}; dbg.P2.revive(); while (dbg.G.t < m.t1 + 1) dbg.stepOwn(1); if (dbg.G.hp < 99) rs('after "Keep going" (revive) a missed Malice still ticks on you: health ' + Math.round(dbg.G.hp)); } }
  } catch (e) { bad('the release sweep checks crashed phase 2: ' + e.message + ' (check RS)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // PR. the prompts audit (Nov 16; Flex: "Lets improve the curated experience as the game guides players onto what they need to do next. I think the alerts and
  //     training wheels could be better in terms of the on screen prompts", then "All 10", then "i feel like the game confuses people saying timestamps"). Each
  //     part failed on the code before its fix:
  //     - clock times and second counts in what you read: the job line ("Next: Virulent Spit in 11 s", "Go to it at 4:01"), the calls ("in together at 3:56",
  //       "Kick Malice in 1 s"), the floats, the floor labels ("Desperate Thrash 2.6", "Your big egg · 41 s"), the start card ("Grasping Fangs (3:16)", "2:46 ·
  //       The split"). The bars count; the report and the mistake lines may say when a mistake happened;
  //     - your small egg read "Shell broken: walk over your egg" at 2:48.6 and could be picked up on the ledge with its Warden alive;
  //     - where the game counts you wasn't the ring drawn: your gate took you inside 2.4 yards and your big egg inside 2.2 (the arrow goes away at 2.5, the egg's
  //       ring is 3), and your lane spot 8 yards from the cauldron left you outside its 9-yard ring;
  //     - no arrow before the tethers (a ranged at the landing, 26 yards out, broke as they landed), before your Malice (a melee 18 yards off), or back to the
  //       cauldron for a Cry kicker;
  //     - a kick due pushed "Back to her: walk into your gate" off the job line;
  //     - the big eggs' 3, 2, 1 ran while you were 40 yards out; E pressed with your cast out of reach was spent on another Doomscale's nothing;
  //     - the Clutches' call came 0.5 s before your Malice; nothing called the heart as it opened;
  //     - "Wardens down: pick up your egg" at a fixed 3:38.3 for everyone; the tether calls to players with no tether;
  //     - calls not "Mechanic: order" ("Clutches! Kill...", "Solo break!"), and "your" (gold) on calls that weren't yours;
  //     - no "now" for your kick (it said "in 1 s"), the five's Q or the small eggs going in;
  //     - the arrow drawn straight through circles about to land;
  //     - the debris shown 2 s ahead, a green swirl called "Falling Debris" (and someone else's 6 yards off), nothing when a small tail's wave was about to
  //       cross you, and your lane spot drawn 28 yards from the arrow while you were still up your lane.
  try { const pr = (m) => bad(m + ' (the prompts audit, Nov 16, check PR)');
    const LP = load(H, 'm2', { said: true }), D = LP.dbg, win = LP.ctx.window, P2C = LP.ctx.PG_P2, T2 = LP.ctx.PG_P2_T, L2 = (s, p) => (s === 'E' ? [p[0], p[1]] : [-p[0], p[1]]);
    if (!win.__saidHook) pr('the check can\'t read the floats and the big calls: practice.js\'s say or bigCall changed shape');
    const NUM = /\b\d{1,2}:\d\d\b|\b\d+(?:\.\d+)?\s?s\b|\b\d+\.\d+\b|\b\d…/, found = new Map(), note = (where, x) => { const s = String(x || '').replace(/<[^>]*>/g, ' '); if (NUM.test(s) && !found.has(s)) found.set(s, where); };
    const said = () => (win.__said || []).splice(0);
    const labels = (t) => { const L = []; D.P2.shapes(t, () => {}, { ring() {}, disc() {}, label(x, y, z, text) { L.push(text); } }); return L; };
    // (1) played: three jobs as a player who walks to the job's spot, presses E when the line says "now" and hits the right thing; one standing still
    const runs = [[{ side: 'E', role: 'm', egg: 'far', mal: 1, cry: 1, teth: 'five' }, 5, true, 1], [{ side: 'W', role: 'h', egg: 'close', mal: 0, cry: 0, teth: 'random' }, 1, false, 1],
      [{ side: 'E', role: 'r', egg: 'n6', mal: 1, cry: 1, teth: 'solo' }, 3, false, 1], [{ side: 'W', role: 'r', egg: 'n2', mal: 1, cry: 2, teth: 'five' }, 2, true, 0]], played = [];
    for (const [pk, seed, east, follow] of runs) { D.P2.pick = pk; const me = D.P2.slotOf(pk); D.hints = true; D.at(166.05, me, { east, seed }); said(); const G = D.G, S = D.S, fl = []; let n = 0;
      while (G.t < S.end - 0.05) { const t = G.t;
        if (n % 5 === 0) { note('the job line', D.P2.jobText()); note('the NEXT line', D.P2.nextText && D.P2.nextText()); D.hint(); labels(t).forEach((x) => note('a floor label', x)); D.P2.tgts(t).forEach((o) => note('a target\'s name', o.name)); D.P2.castBars(t).forEach((b) => note('a cast bar', b.name)); }
        if (follow && n % 2 === 0) { const j = D.job(me); D.walkTo(j.T); if (/now \(E\)/.test(D.P2.jobText())) D.kick(); const c = D.P2.dpsCat(t); if (c) { const o = D.P2.tgts(t).filter((q) => (c === 'heart' ? q.key === 'heart' : q.kind === c)).sort((a, b) => Math.hypot(a.p[0] - G.x, a.p[1] - G.y) - Math.hypot(b.p[0] - G.x, b.p[1] - G.y))[0]; if (o) D.tgt = o.key; D.atk(); } }
        D.stepOwn(1); n++; said().forEach((q) => fl.push(q)); }
      const logged = new Set(G.log.map((m) => m.text)); fl.filter((q) => !logged.has(q.text)).forEach((q) => note(q.k === 'big' ? 'a big call' : 'a float', q.text)); S.warns.forEach((w) => note('a call', w.text));
      played.push({ pk, seed, me, S, fl, follow, warns: S.warns.slice() }); }
    // (and the cards: the setup sentence for every job, the maps' words, the start card's tabs, the rundown, "your job in short", the start list, the end line)
    { const su = D.P2.setup, M = su && su.maps; su.roles.forEach((r) => su.jobs(r).forEach(([v]) => { su.set(r, v); note('the setup sentence', su.say()); if (M) { note('the maps\' sentence', M.say()); note('the Play button\'s line', M.sub()); M.tabs().forEach(([k]) => M.hot(k).forEach((h) => note('a map spot\'s words', h.title))); }
        note('the rundown', D.P2.asg()); note('your job in short', D.P2.short());
        const box = { innerHTML: '' }; D.P2.bind(box, () => {}); ['egg', 'kick', 'teth'].forEach((tab) => { box.onclick({ target: { closest: () => ({ dataset: { p2tab: tab }, disabled: false }) }, detail: 1 }); note('the start card', box.innerHTML.replace(/<svg[\s\S]*?<\/svg>/g, ' ')); }); }));
      ['random', 'solo', 'five', 'none'].forEach((tt) => { D.P2.pick = { side: 'E', role: 'm', egg: 'far', mal: 1, cry: 1, teth: tt }; note('the rundown', D.P2.asg()); note('your job in short', D.P2.short()); if (M) note('the maps\' sentence', M.say()); });
      D.P2.starts.forEach(([, nm]) => note('the start list', nm)); note('the end card', D.P2.clean); }
    if (found.size) pr('clock times or second counts in what you read (the bars count): ' + [...found].slice(0, 8).map(([s, w]) => w + ' "' + s + '"').join('; ') + (found.size > 8 ? ' and ' + (found.size - 8) + ' more' : ''));
    // (and in the file's own words, so a line no run reaches can't bring one back: every quoted string with a clock time or a "N s" count, outside the mistake
    //  lines (they may say when a mistake happened), the bots' audit and the comments)
    { const src0 = rd('practice-p2.js').replace(/\/\*[\s\S]*?\*\//g, '').split('\n'), a0 = src0.findIndex((l) => /^ {2}const auditStep = /.test(l)), a1 = src0.findIndex((l, i) => i > a0 && /^ {2}const shapes = /.test(l)), off = [];
      const src = src0.filter((l, i) => !/^\s*\/\//.test(l) && (a0 < 0 || a1 < 0 || i < a0 || i >= a1)); /* (the bots' audit, auditStep, is for the build's checks, not the screen) */
      src.forEach((l) => { if (/A\.mistake\(|ravenous\(B|missed\.push\(/.test(l)) return; (l.match(/'(?:[^'\\\n]|\\.)*'/g) || []).forEach((q) => { if (/\b\d{1,2}:\d\d\b|(?<![\w-])\d+(?:\.\d+)?\s?s\b/.test(q) || /^'\s?s[.)!:]?'$|^' s[ .)]/.test(q)) off.push(q); }); });
      if (off.length) pr('src/practice-p2.js still has words with a clock time or a seconds count in them: ' + off.slice(0, 6).join(', ')); }
    // (2) every call "Mechanic: order", and "your" (gold) only on the calls that are yours (marked you); the kick, the five's Q and the small eggs' "now"
    played.forEach(({ pk, warns, fl, S, me, follow }) => { const tag = ' (' + pk.role + ' on the ' + pk.side + ' ledge)';
      warns.forEach((w) => { if (!/^[^:!?]{3,40}: \S/.test(w.text)) pr('the call "' + w.text + '" isn\'t "Mechanic: order"' + tag); if (/\byour?\b/i.test(w.text) !== !!w.you) pr('the call "' + w.text + '" ' + (w.you ? 'is marked yours with no "your" in it' : 'says "your" (gold) but isn\'t yours') + tag); });
      if (pk.mal && follow) { const m =S.malice.find((q) => q.side === pk.side && q.k === 1), big = fl.filter((q) => q.k === 'big');
        if (!big.some((q) => /^Malice: press E now/.test(q.text) && q.t >= m.t0 - 0.01 && q.t <= m.t0 + 0.5)) pr('no "Malice: press E now" call as your Malice\'s bar starts' + tag + ' (it said "in 1 s", before it)');
        if (big.some((q) => /\bin \d+ s\b/.test(q.text))) pr('a kick call still counts seconds' + tag); }
      if (pk.teth === 'five' && follow && !fl.some((q) => q.k === 'big' && /press Q.*now/.test(q.text))) pr('the five\'s break has no "press Q ... now" call' + tag);
      if (pk.egg && pk.egg[0] === 'n' && !warns.some((w) => Math.abs(w.t - T2.throwAt) < 0.01 && /now/.test(w.text))) pr('a small egg\'s carrier gets no "now" call as the small eggs go in' + tag); });
    // (3) where the game counts you is the ring drawn: your gate inside 2.8 yards (its ring), your big egg inside 3, your lane spot near enough the cauldron
    { const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(166.5, me, { east: false, seed: 3 }); while (D.G.t < T2.gate + 0.3) D.stepOwn(1);
      const g = D.S.gates.find((q) => !q.back && q.side === 'E'), rings = []; D.P2.shapes(D.G.t, () => {}, { ring(x, y, r) { if (Math.hypot(x - g.p[0], y - g.p[1]) < 0.01) rings.push(r); }, disc() {}, label() {} });
      if (!(P2C.GATE > 2.5) || !rings.length || rings.some((r) => Math.abs(r - P2C.GATE) > 0.01)) pr('your gate\'s ring is drawn at ' + rings.join('/') + ' yards and it takes you inside ' + P2C.GATE + '; the two should match, wider than the arrow\'s 2.5');
      D.pos = [g.p[0] + 2.6, g.p[1]]; D.stepOwn(2); if (D.G.p2.where[me] !== 'L') pr('standing 2.6 yards from your gate\'s middle, inside its drawn ring, doesn\'t take you across (the arrow goes away at 2.5)'); }
    { const pk = { side: 'E', role: 'h', egg: 'close', mal: 0, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(250, me, { east: false, seed: 3 }); const at = D.S.bigAt.E.close; D.at(at - 1, me, { east: false, seed: 3 });
      const bi = D.S.big.findIndex((b) => b.side === 'E' && b.which === 'close'), B = D.S.big[bi], pit = D.S.pits.E, u = Math.hypot(pit[0] - B.x, pit[1] - B.y);
      while (D.G.t < at + 0.1) D.stepOwn(1); D.pos = [B.x + (pit[0] - B.x) / u * 2.7, B.y + (pit[1] - B.y) / u * 2.7]; D.stepOwn(2);
      if (D.G.p2.big[bi].state !== 'held' || D.G.p2.big[bi].who !== me) pr('standing 2.7 yards from your big egg at its pickup time, inside its drawn 3-yard ring, doesn\'t pick it up (' + D.G.p2.big[bi].state + ')'); }
    { const pk = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(T2.throwAt - 3, me, { east: false, seed: 3 }); const e = D.G.eggs.find((q) => q.id === me);
      if (!e || e.state !== 'held') pr('the check lost its setup: your small egg should be in your hands at 3:53 (' + (e && e.state) + ')');
      else { D.pos = [100, 50]; const north = labels(D.G.t); D.pos = [100, 15]; const jb = D.job(me), south = labels(D.G.t), pit = D.S.pits.E;
        if (!jb.ob || Math.hypot(jb.ob.p[0] - pit[0], jb.ob.p[1] - pit[1]) > P2C.THROW - 2.5) pr('your lane spot is ' + (jb.ob ? Math.hypot(jb.ob.p[0] - pit[0], jb.ob.p[1] - pit[1]).toFixed(1) : '?') + ' yards from the cauldron\'s middle; the arrow goes away 2.5 yards short of it, which can leave you outside the ' + P2C.THROW + '-yard ring');
        if (north.includes('Your lane spot') || !south.includes('Your lane spot')) pr('"Your lane spot" is drawn by the cauldron while you are still up your lane (the arrow on the lane\'s gap), or not once you are past it'); } }
    // (4) the arrow and the line from when the step is named: within 20 yards of the Warden before the tethers, into reach before your Malice, back to the cauldron
    { const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(189, me, { east: false, seed: 3 }); D.pos = L2('E', P2C.land); const W = D.G.p2.wd.E, jb = D.job(me), jt = D.P2.jobText();
      if (!jb.ob || Math.hypot(jb.ob.p[0] - W[0], jb.ob.p[1] - W[1]) > 19 || !/within 20 yards of the Warden/.test(jt)) pr('at 3:09, 27 yards from the Warden where the gate lands you, the arrow (' + (jb.ob ? 'to ' + Math.hypot(jb.ob.p[0] - W[0], jb.ob.p[1] - W[1]).toFixed(0) + ' yards from it' : 'none') + ') and the line ("' + jt + '") don\'t send you within 20 yards before the tethers'); }
    { const pk = { side: 'E', role: 'm', egg: null, mal: 1, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(170, me, { east: false, seed: 3 }); const m = D.S.malice.find((q) => q.side === 'E' && q.k === 1);
      D.at(m.t0 - 4, me, { east: false, seed: 3 }); const W = D.G.p2.wd.E; D.pos = [W[0] + 12, W[1] - 14]; const jb = D.job(me), jt = D.P2.jobText();
      if (!jb.ob || Math.hypot(jb.ob.p[0] - W[0], jb.ob.p[1] - W[1]) > P2C.KICK.m - 2.5 || !/^Your kick is next: get close to the Warden/.test(jt)) pr('4 s before your Malice, 18 yards from the Warden, the arrow (' + (jb.ob ? Math.hypot(jb.ob.p[0] - W[0], jb.ob.p[1] - W[1]).toFixed(1) + ' yards from it' : 'none') + ') and the line ("' + jt + '") don\'t take a melee into reach'); }
    { const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 1, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(240, me, { east: false, seed: 3 }); const up = D.S.ds.find((d) => d.id === 'dsE1').up;
      D.at(up - 9.5, me, { east: false, seed: 3 }); D.pos = L2('E', P2C.swait); const jb = D.job(me), jt = D.P2.jobText(), K = L2('E', P2C.dsKick);
      if (!jb.ob || Math.hypot(jb.ob.p[0] - K[0], jb.ob.p[1] - K[1]) > 4 || !/^Back to the cauldron: your Skull Doomscale/.test(jt)) pr('9.5 s before your Doomscale climbs out, a Cry kicker at the south end gets ' + (jb.ob ? 'an arrow ' + Math.hypot(jb.ob.p[0] - K[0], jb.ob.p[1] - K[1]).toFixed(0) + ' yards from the kick spot' : 'no arrow') + ' and the line "' + jt + '", not "Back to the cauldron" with the arrow'); }
    // (5) the way back first: a kick due in 3 s doesn't push "Back to her" off the line
    { const pk = { side: 'E', role: 'm', egg: null, mal: 0, cry: 1, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(250, me, { east: false, seed: 3 }); D.at(D.S.home[me] + 0.3, me, { east: false, seed: 3 });
      const c = D.S.cries.find((q) => q.ds === 'dsE1' && q.t0 > D.G.t), t = D.G.t; if (D.G.p2.where[me] !== 'L' || !c) pr('the check lost its setup: on the ledge at your way back with a Cry still to come (' + D.G.p2.where[me] + ')');
      else { c.t0 = t + 3; c.t1 = t + 5.5; const jt = D.P2.jobText(); if (!/^Back to her: walk into your gate/.test(jt)) pr('on the ledge at your way back, with your kick 3 s away, the job line reads "' + jt + '", not "Back to her: walk into your gate"'); } }
    // (6) no count while you're far, and no kick spent out of reach
    { const pk = { side: 'E', role: 'h', egg: 'close', mal: 0, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(250, me, { east: false, seed: 3 }); const bin = D.S.bigIn.E; D.at(bin - 9, me, { east: false, seed: 3 });
      const bi = D.S.big.findIndex((b) => b.side === 'E' && b.which === 'close'), p = [D.G.x, D.G.y]; if (D.G.p2.big[bi].state !== 'held' || Math.hypot(p[0] - D.S.pits.E[0], p[1] - D.S.pits.E[1]) < 20) pr('the check lost its setup: your north big egg should be in your hands, 20 or more yards out, 9 s before the count (' + D.G.p2.big[bi].state + ')');
      else { said(); let jt = ''; while (D.G.t < bin + 1) { D.pos = p; D.stepOwn(1); if (!jt && D.G.t >= bin + 0.5) jt = D.P2.jobText(); } const big = said().filter((q) => q.k === 'big').map((q) => q.text);
        if (big.some((x) => /\d…|in together now|in: now/.test(x))) pr('carrying your big egg 20+ yards from the cauldron you still get the count: ' + big.join(' | '));
        if (!/sprint/i.test(jt)) pr('carrying your big egg outside the ring as they go in, the line reads "' + jt + '", not to sprint into the ring'); } }
    { const pk = { side: 'E', role: 'm', egg: null, mal: 0, cry: 1, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(250, me, { east: false, seed: 3 }); while (D.G.t < 300 && !D.S.cries.some((q) => q.ds === 'dsE1')) D.step(10);
      const c = D.S.cries.find((q) => q.ds === 'dsE1' && q.i === 1); D.at(c.t0 + 0.1, me, { east: false, seed: 3 }); const d1 = D.G.p2.ds.dsE1, d2 = D.G.p2.ds.dsE2;
      if (!d1 || !d2 || D.G.p2.kick.cdsE11) pr('the check lost its setup: both east Doomscales up and your first Cry not yet kicked at ' + clkS(D.G.t));
      else { Object.keys(D.G.p2.kick).length; D.S.cries.filter((q) => q.ds === 'dsE2').forEach((q) => { D.G.p2.kick['c' + q.ds + q.i] = 'x'; }); const ux = d2.x - d1.x, uy = d2.y - d1.y, ul = Math.hypot(ux, uy) || 1; D.pos = [d2.x + ux / ul * 6, d2.y + uy / ul * 6]; said(); const cd0 = D.G.p2.kickCd; D.kick(); const s1 = said().map((q) => q.text).join(' | ');
        if (D.G.p2.kickCd !== cd0 || !/Too far from the casting Doomscale/.test(s1)) pr('pressing E 6 yards from the other Doomscale, your own Cry casting out of reach, spends the kick (' + s1 + ')'); } }
    // (7) the Clutches' call waits for your Malice; the heart's call as it opens; no practice.js "Rawlings!" teaching call in phase 2
    { const pk = { side: 'E', role: 'm', egg: null, mal: 1, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(170, me, { east: false, seed: 3 }); const m = D.S.malice.find((q) => q.side === 'E' && q.k === 1), cl = D.S.warns.find((w) => /^Clutches/.test(w.text));
      if (!cl || cl.t < m.by) pr('the Clutches\' call comes at ' + (cl ? clkS(cl.t) : 'no time') + ', inside your Malice kick (' + clkS(m.t0) + ' to ' + clkS(m.by) + ')');
      if (!D.S.warns.some((w) => Math.abs(w.t - T2.heart) < 0.01 && /^Heart open: /.test(w.text))) pr('no call as the heart opens (' + clkS(T2.heart) + ')');
      if (D.S.warns.some((w) => Math.abs(w.t - T2.rage) < 0.01 && /burn the heart/.test(w.text))) pr('the Rage call still says "burn the heart" 6.5 s before it opens');
      if (D.G.taught !== true) pr('practice.js\'s once-a-run "Rawlings! Press Tab" call is still on in phase 2: it names the Clutches "Rawlings" and can land on your Malice'); }
    // (8) which one is yours: the Warden's call when your own Warden dies, for your job; the tether calls only to whoever has that tether
    for (const [pk, want] of [[{ side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'none' }, /^Warden dead: wait by your egg/], [{ side: 'E', role: 'm', egg: 'far', mal: 0, cry: 0, teth: 'none' }, /your big egg comes later/], [{ side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }, /^Warden dead: kill the Rawlings/]]) {
      D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(210, me, { east: false, seed: 3 }); while (D.G.t < 240 && D.G.p2.wdead.E == null) D.step(1); D.step(4); const wd = D.G.p2.wdead.E, w = D.S.warns.find((q) => /^Warden/.test(q.text));
      if (!w || !want.test(w.text) || Math.abs(w.t - wd - 0.05) > 0.11) pr('your Warden died at ' + (wd == null ? 'never' : clkS(wd)) + '; its call ("' + (w ? w.text + '" at ' + clkS(w.t) : 'none"') + ') should come then, worded for your job (' + want + ')');
      if (D.S.warns.some((q) => /Wardens down/.test(q.text))) pr('the fixed "Wardens down" call for everyone is still there'); }
    { for (const [tt, yes, no] of [['none', null, /Solo break|^The five|^Your tether/], ['solo', /^Solo break: /, /^The five/], ['five', /^The five: /, /^Solo break/]]) { const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: tt }; D.P2.pick = pk; D.at(166.05, D.P2.slotOf(pk), { east: false, seed: 3 });
        if (D.S.warns.some((w) => no.test(w.text)) || (yes && !D.S.warns.some((w) => yes.test(w.text)))) pr('with ' + (tt === 'none' ? 'no tether' : tt === 'solo' ? 'the solo break' : 'one of the five') + ' the tether calls are: ' + D.S.warns.filter((w) => /tether|Solo|five/i.test(w.text)).map((w) => w.text).join(' | ')); } }
    // (9) the arrow never leads through a circle about to land: no arrow, and the line says to wait
    { const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(166.5, me, { east: false, seed: 3 }); while (D.G.t < T2.gate + 0.1) D.stepOwn(1); D.pos = [0, 0];
      const g = D.S.gates.find((q) => !q.back && q.side === 'E'), j0 = D.job(me); D.S.impacts.push({ x: g.p[0] / 2, y: g.p[1] / 2, r: 4, t0: D.G.t, at: D.G.t + 1.5, name: 'Falling Debris', dmg: 0, color: '#c8a36a', tip: '' }); const j1 = D.job(me), jt = D.P2.jobText(); D.S.impacts.pop();
      if (!j0.ob) pr('the check lost its setup: walking to your gate at 2:47 there should be an arrow');
      else if (j1.ob || !/^Wait: let the brown circles land, then go\.$/.test(jt)) pr('with a brown circle landing in 1.5 s between you and your gate the arrow ' + (j1.ob ? 'still points through it' : 'goes') + ' and the line reads "' + jt + '", not "Wait: let the brown circles land, then go."'); }
    // (10) the dodges in words, in time: the debris 3.5 s ahead, a green swirl by its own name and only when it's on you, a small tail's wave about to cross you
    { const S0 = script({ seed: 3, east: false }), deb = S0.impacts.filter((q) => q.name === 'Falling Debris' && T2.debris.some((d) => q.at >= d - 0.05 && q.at <= d + 1.2));
      if (!deb.length || deb.some((q) => q.at - q.t0 < 3.5 - 0.01)) pr('the Falling Debris circles show ' + Math.min(...deb.map((q) => q.at - q.t0)).toFixed(1) + ' s before they land; 3.5 s gives a walker time to step out');
      if (T2.debris.some((d) => !S0.warns.some((w) => Math.abs(w.t - (d - 3.5)) < 0.01 && /^Falling Debris: step out/.test(w.text)))) pr('the Falling Debris call doesn\'t come with the circles, 3.5 s before they land'); }
    { const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(T2.spit[0] + 3.5, me, { east: false, seed: 3 }); const m = D.S.impacts.find((q) => q.name === 'Virulent Spit' && Math.abs(q.at - T2.spit[0] - 6.5) < 0.1 && q.x > 0);
      if (!m) pr('the check lost its setup: no green swirl on the east ledge at 3:27');
      else { D.pos = [m.x, m.y]; const on = D.P2.jobText(); D.pos = [m.x + m.r + 2, m.y]; const off = D.P2.jobText();
        if (on !== 'Virulent Spit: step out of the green swirl!') pr('standing in a green swirl about to land, the line reads "' + on + '", not "Virulent Spit: step out of the green swirl!"');
        if (/Virulent Spit|Falling Debris/.test(off)) pr('2 yards outside a green swirl, the line still says to step out: "' + off + '"'); } }
    { const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(T2.rattle[0] - 0.3, me, { east: false, seed: 3 }); const w = D.S.waves.find((q) => q.kind === 'tail'), a = w.deg * Math.PI / 180;
      D.pos = [w.x + Math.cos(a) * w.v * 2.5, w.y + Math.sin(a) * w.v * 2.5]; const jt = D.P2.jobText(); if (jt !== 'Small tails: step out of the red lane!') pr('standing in a small tail\'s red lane 2.8 s before its wave reaches you, the line reads "' + jt + '"'); }
    // (11) your small egg stays shut while its Warden lives: no "Shell broken", no pickup on the ledge
    { const pk = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'none' }; D.P2.pick = pk; const me = D.P2.slotOf(pk); D.at(171, me, { east: false, seed: 3 }); said(); const e = D.G.eggs.find((q) => q.id === me);
      while (D.G.t < 205 && D.G.p2.wdead.E == null) { D.pos = [e.x + 0.5, e.y]; D.stepOwn(1); } const fl = said().map((q) => q.text);
      if (e.state !== 'floor' || fl.some((x) => /Shell broken/.test(x))) pr('standing on your small egg from 2:51 with its Warden alive ' + (e.state !== 'floor' ? 'picked it up (' + e.state + ')' : 'said "Shell broken"') + ': it stays shielded until the Warden dies'); }
  } catch (e) { bad('the prompts audit\'s checks crashed phase 2: ' + e.message + ' (check PR)'); }
  finally { try { dbg.P2.pick = { side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' }; } catch (e) { /* (no part) */ } }
  // F. the wiring
  const PJ = rd('practice.js'), GJ = rd('guides.js'), BP = rd('build.ps1');
  if (!ctx.PG_PARTS["Ula'tek"].m2 || ctx.PG_PARTS["Ula'tek"].m2.d !== 'm' || typeof ctx.PG_PARTS["Ula'tek"].m2.mod !== 'function') bad('phase 2 isn\'t a Mythic part of Ula\'tek with its own mod in PG_PARTS (check F)');
  if (!/pg-part/.test(PJ) || !/pgOpen\(root, boss, d, b\.dataset\.v/.test(PJ)) bad('the start card has no Part switch that opens phase 2 (check F)');
  if (!/pgN = \(\/\[\?&#\]practice=\(\\d\)\//.test(GJ) || !/pgOpen\(r, S\.gdzBoss, S\.gdzDiff, pk\)/.test(GJ)) bad('`?practice=2` on the guide no longer opens phase 2 (check F)');
  if (!BP.includes("'practice-p2.js'") || !BP.includes("(& $read 'practice-p2.js')")) bad('build.ps1 no longer checks src/practice-p2.js or puts it into the page (check F)');
  if (!/view\(true\); \/\* \(Flex, Nov 15: 3D only/.test(PJ)) bad('phase 2 doesn\'t open in 3D (Flex: 3D only, check F)');
  // G. 3D: phase 2's own shapes, where the hits are
  try {
    const pk = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'five' }; dbg.P2.pick = pk; const me = dbg.P2.slotOf(pk), kinds = new Set(), A = { get G() { return dbg.G; }, get S() { return dbg.S; }, me, bossAt: dbg.P2.bossAt, tailAt: dbg.P2.tailAt, rl: (id) => id[0], nm: (id) => id, clsC: () => null, P2: dbg.P2 };
    const at = (t0) => { dbg.at(t0, me, { east: false, seed: 3 }); return ctx.pg3dShapes(A, dbg.G.t); };
    let L0 = at(200); L0.forEach((s) => kinds.add(s.k));
    const W = dbg.G.p2.wd.E; if (!L0.some((s) => s.k === 'ring' && Math.abs(s.r - P.TETHER) < 0.01 && hyp([s.x, s.y], W) < 0.01)) bad('in 3D your tether doesn\'t show its ' + P.TETHER + '-yard break ring round the Warden (check G)');
    if (!L0.some((s) => s.k === 'ring' && Math.abs(s.r - P.WARD) < 0.01)) bad('in 3D the eggs\' ' + P.WARD + '-yard Warden\'s Protection rings are gone (check G)');
    if (!L0.some((s) => s.k === 'ring' && Math.abs(s.r - P.THROW) < 0.01 && hyp([s.x, s.y], dbg.S.pits.E) < 0.01)) bad('in 3D the cauldron\'s ' + P.THROW + '-yard ring isn\'t where it takes the eggs (check G)');
    at(176).forEach((s) => kinds.add(s.k)); at(262).forEach((s) => kinds.add(s.k)); at(186).forEach((s) => kinds.add(s.k)); const LF = (() => { dbg.at(280, me, { east: false, seed: 3 }); while (dbg.G.t < 305 && !dbg.G.p2.fan.some((q) => dbg.G.t >= q.t0 + 0.5)) dbg.step(1); return ctx.pg3dShapes(A, dbg.G.t); })(); /* (the first frontal, whenever its Doomscale has settled by its tank and its half has crossed back) */ LF.forEach((s) => kinds.add(s.k)); at(300).forEach((s) => kinds.add(s.k));
    const fan = LF.find((s) => s.k === 'fan'); if (!fan || Math.abs(fan.r - P.FAN.r) > 0.01) bad('in 3D the Doomscale\'s frontal isn\'t drawn at its ' + P.FAN.r + ' yards (check G)');
    ['gate', 'warden', 'tether', 'cauldron', 'begg', 'dscale', 'fan', 'heart', 'clutch', 'arc'].forEach((k) => { if (!kinds.has(k)) bad('the 3D view draws no "' + k + '" in phase 2 (check G)'); });
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
