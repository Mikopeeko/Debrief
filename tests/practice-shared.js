// The practice game's shared egg, area attack and Viper rules (src/practice.js), played in Node, for every part that uses them. Flex, Nov 15:
//  A. "the eggs should be attackable", "The eggs have to be damaged to break the shield in order to get picked up": your egg lands with a Hardened shell
//     (5 health, the raid chips 0.4 a second); walking over it does nothing until your hits break it; with the autopilot hitting it opens in about 3.6 s.
//  B. "the player should get an AOE ability" with "a short cooldown": 2 hits everything within 8 yards of your target, then cools down 8 s.
//  C. "if a viper hatches the tank should taunt it and then the group kills it": the off tank taunts it 2 s after it hatches, it stops stinging you, it
//     crawls to the tank and the raid kills it there.
// The release sweep, Nov 16 (Flex: "im trying to have this game in a released state for today, so i just need it to really work and be functional"):
//  F. Noxious Splash counts against you only when YOUR step takes you inside another carrier's 3 yards, and a carrier's own step never takes it inside 3.6
//     yards of you while you both carry (the sweep: in the intermission a carrier walked onto its spot inside your ring as soon as you took a small step,
//     7 runs in 192 with a step a second, 45 in 192 with a wobble, all ending in a death; phase 1 and 2 the same code). Stepping away from a carrier that's
//     already close never splashes; walking straight into one still does, and the words say you walked in (they said the other carrier "came inside your
//     3-yard circle"); a raider doesn't pick its egg up inside 3.6 yards of you while you carry yours.
//  G. you pick your egg up anywhere in its gold 2.8-yard ring (it was 2.2: stopped inside the ring, "Pick up your egg now" until "You never picked up your egg").
//  H. starting after your last coil (2:18), the fast-forward doesn't leave you holding an egg with nothing left to break it in.
//  I. the job line under your name has no compass word (the quadrants turn with her dive: "left (west)" was wrong for the 1:20 egg).
//  J. the result screen's "Right target" names the kinds of moment it counts (always "the Rawlings, the heart", with your egg and the Wretch in the count).
//  K. the setup card says a healer with an egg plays the ranged egg job (it played exactly like ranged and said nothing).
//  L. the death card: End the run shows the result screen with your grade, your mistakes and the death (Start over went to the setup card with no result);
//     Keep going stays (a death still costs 20) and lets the part clear what was still hurting you (P2.revive: a missed Malice killed you twice).
//  M. the death card names what killed you: the newest hit by its time, never a damage-moment line (it said "A Viper was up: you were on it 0%" for a
//     death 15 s later from Caustic Venom), else the poison on you.
// Run: node tests/practice-shared.js
'use strict';
const path = require('path');
// (a page that remembers, for checks L and M: each element keeps the children it was asked for, with their onclick, and requestAnimationFrame queues the
//  frame, so a check can die, read the card and press its buttons. The other loaders' page forgets everything)
function recLoad(H, part) {
  H = H || require('./site-helpers.js'); const fs = require('fs'), vm = require('vm'), SRC = path.join(__dirname, '..', 'src'), rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n');
  const stub = () => { const f = function () { return stub(); }; return new Proxy(f, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : k === Symbol.iterator ? function* () {} : stub()), set: () => true, apply: () => stub() }); };
  const made = [], el = () => { const kids = new Map(), o = { innerHTML: '', className: '', textContent: '', style: {}, dataset: {}, isConnected: true, kids }, cl = { add() {}, remove() {}, toggle() {}, contains: (c) => String(o.className).split(/\s+/).includes(c) };
    const p = new Proxy(o, { get: (t, k) => (k in t ? t[k] : k === 'classList' ? cl : k === 'querySelector' ? (s) => { if (!kids.has(s)) kids.set(s, el()); return kids.get(s); } : k === 'querySelectorAll' ? () => [] : stub()), set: (t, k, v) => { if (k === 'innerHTML') kids.clear(); t[k] = v; return true; } }); made.push(p); return p; };
  const raf = [], doc = new Proxy({}, { get: (t, k) => (k === 'createElement' ? () => el() : stub()) }), GJ = rd('guides.js');
  const fromGuides = ['GDZ_ROLE', 'GDZ_RAID', 'gdzName', 'UX', 'UX_MEL', 'UX_HOME', 'UX_ZONE', 'UL_EDGE', 'UL_FB', 'GDZ_FLOOR', 'UL_EGGS', 'UL_RIM', 'UL_SOAK', 'UL_CMK', 'UL_PAT'].map((n) => H.grab(n, GJ)).join('\n');
  const win = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
  class Img { constructor() { this.complete = false; this.naturalWidth = 0; } }
  const ctx = vm.createContext({ document: doc, window: win, navigator: stub(), performance, Image: Img, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: (f) => raf.push(f), cancelAnimationFrame: (i) => { if (i) raf[i - 1] = null; }, localStorage: stub(), E: { CLASSES: {} }, console, MouseEvent: function () {} });
  vm.runInContext(H.grab('esc') + '\n' + H.grab('guideSlug') + '\n' + fromGuides + '\n' + rd('practice.js') + '\n' + rd('practice3d.js') + '\n' + rd('practice-p2.js') + '\n' + rd('practice-int.js'), ctx);
  vm.runInContext('pgOpen(null, "Ula\'tek", "m"' + (part ? ', "' + part + '"' : '') + ')', ctx);
  let cur = 0, now = 1000; const frames = (n) => { while (n-- > 0 && cur < raf.length) { const f = raf[cur++]; if (f) f(now += 50); else n++; } };
  const card = () => { const o = made.find((e) => e.kids.has('.pg-card')); return o ? o.kids.get('.pg-card') : null; };
  return { dbg: win.__pgDbg, win, frames, card };
}
function checks(H, say) {
  const bad = (t) => say("Ula'tek practice game (shared rules)", 'bad', t);
  const { load } = require('./practice-p3.js');
  let dbg, dbg3, win; try { const L1 = load(H); dbg = L1.dbg; win = L1.ctx.window; dbg3 = load(H, 'm3').dbg; } catch (e) { bad('the game didn\'t load: ' + e.message + ' (check A)'); return; }
  const G = () => dbg.G, steps = (n) => dbg.stepOwn(n);
  // A. your egg's shell
  try {
    const r = dbg.sim('r3', true, false, 3), mine = G().eggs.filter((e) => e.id === 'r3');
    if (!mine.length || mine.some((e) => !e.shpMax)) bad('your egg lands with no shell to break (check A)');
    mine.forEach((e) => { const open = e.shell - e.land; if (!(open > 1 && open < 6)) bad('with the autopilot hitting it, your egg (set ' + (e.set + 1) + ') opened ' + open.toFixed(1) + ' s after landing; about 3.6 s, as on the kills (check A)'); });
    if (r && r.log && r.log.length) bad('the autopilot carrying an egg makes mistakes: ' + r.log.join(' | ') + ' (check A)');
    dbg.at(8, 'r3', { seed: 3 }); const e = G().eggs.find((q) => q.id === 'r3' && q.set === 0); while (G().t < e.land + 3) steps(1);
    if (!(e.state === 'floor' && e.shp > 0)) bad('3 s after it landed with nobody hitting it, your egg\'s shell is gone (' + e.state + ', ' + e.shp + '); the raid alone takes about 12 s (check A)');
    G().x = e.x; G().y = e.y; steps(10); if (e.state !== 'floor') bad('walking over your egg picked it up with its shell still up (check A)');
    if (!(dbg.tgts() || []).some((o) => o.kind === 'egg' && o.max)) bad('your egg with its shell up isn\'t a target with health (Tab can\'t pick it) (check A)');
    G().tgt = 'egg'; for (let i = 0; i < 4 && e.shp > 0; i++) { G().gcd0 = -99; dbg.atk(); steps(2); }
    steps(4); if (e.state !== 'held' || e.who !== 'r3') bad('four hits (with the raid\'s chip) didn\'t break your egg\'s shell and let you pick it up: ' + e.state + ', shell ' + (e.shp == null ? '-' : e.shp.toFixed(2)) + ' (check A)');
  } catch (x) { bad('the egg shell check crashed: ' + x.message + ' (check A)'); }
  // B. the area attack
  try {
    dbg.at(30, 'r3', { seed: 3 }); const g = G(), t = g.t, three = [0, 1, 2].map((i) => ({ kind: 'rawling', x: g.x + 4 + i, y: g.y + 1, born: t }));
    g.adds.push(...three); g.aoe0 = -99; g.gcd0 = -99; g.tgt = null;
    const ok = dbg.aoe(); if (!ok) bad('2 (the area attack) did nothing with three Rawlings beside you (check B)');
    else { const hit = three.filter((a) => a.hp != null && a.hp <= 2.01).length; if (hit < 3) bad('the area attack hit ' + hit + ' of three Rawlings standing together; it hits everything within 8 yards of your target (check B)'); }
    g.gcd0 = -99; const again = dbg.aoe(); if (again) bad('the area attack works twice in a row; it cools down 8 s (check B)');
    steps(170); const cd = dbg.dps() ? dbg.dps().aoeCd : null; if (cd !== 0) bad('8.5 s later the area attack still isn\'t ready (' + cd + ') (check B)');
    const h = dbg.html(); if (!/data-a="aoe"/.test(h) || !/<b>2<\/b>/.test(h)) bad('no area attack button (2) on the action bar (check B)');
    dbg3.P2.pick = { role: 'r', soak: 0, bite: 'no', kick: 2 }; dbg3.sim(dbg3.P2.slotOf(dbg3.P2.pick), true, false, 3); if (!((dbg3.G.aoeFx || []).length)) bad('the autopilot never presses 2 in phase 3, where the clutches come in four at a time (check B)');
  } catch (x) { bad('the area attack check crashed: ' + x.message + ' (check B)'); }
  // C. the tank taunts a Viper
  try {
    dbg.at(30, 'r3', { seed: 3 }); const g = G(), t = g.t, v = { kind: 'viper', x: g.x + 1.5, y: g.y, born: t }; g.adds.push(v); const tk = dbg.S.herTank(t) === 't1' ? 't2' : 't1';
    steps(50); if (v.tank !== tk) bad('2.5 s after a Viper hatched, the off tank (' + tk + ') hasn\'t taunted it (' + v.tank + ') (check C)');
    const st = v.sting, d0 = Math.hypot(v.x - g.bots[tk].x, v.y - g.bots[tk].y); steps(40);
    if (v.sting !== st) bad('the taunted Viper still stings you (check C)'); if (g.adds.includes(v) && Math.hypot(v.x - g.bots[tk].x, v.y - g.bots[tk].y) > Math.max(2.5, d0 - 3)) bad('the taunted Viper doesn\'t go to the tank (check C)');
    while (g.t < t + 14 && g.adds.includes(v)) steps(5); if (g.adds.includes(v)) bad('the raid hasn\'t killed the taunted Viper 14 s after it hatched (check C)');
  } catch (x) { bad('the taunt check crashed: ' + x.message + ' (check C)'); }
  // D. sounds like a boss mod (Flex, Nov 15: "I think sound alerts or sound ques are going to be a good addition", "Players are used to sound ques with boss
  //    mods so thats a great way to simulate it"): tones only, played through a pretend speaker here. A call about you pings (880 then 1320 Hz), a "now"
  //    call beeps (square), other calls blip; 3-2-1 before your own bar; a buzz for a mistake; nothing when muted or for the autopilot
  try { const played = []; class FakeAC { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } createOscillator() { const o = { type: '', frequency: { value: 0 }, connect() {}, start() { played.push({ f: o.frequency.value, type: o.type }); }, stop() {} }; return o; }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; } resume() { return Promise.resolve(); } }
    win.AudioContext = FakeAC; const fs0 = () => played.map((p) => p.f), call = (text) => { const g = G(); played.length = 0; dbg.S.warns.splice(g.warnI, 0, { t: g.t - 0.01, text, c: '#fff' }); g.warnQ = []; g.lastWarn = null; dbg.warnsNow(); return fs0(); };
    dbg.snd(true); dbg.at(30, 'r3', { seed: 3 });
    const you = call('Your coil: soak it!'); if (!(you.includes(880) && you.includes(1320))) bad('a call about you plays no ping (' + you.join(',') + ') (check D)');
    call('Kick now: your Shrieker\'s Vicious Echoes (E)!'); if (!played.some((p) => p.type === 'square')) bad('a "now" call plays no quick beeps (check D)');
    const other = call('Mephitic Thrash: out of her tail\'s 35 yards!'); if (!other.includes(660)) bad('another call plays no blip (' + other.join(',') + ') (check D)');
    const bar = (dbg.mods() || []).find((q) => /^Your\b/.test(q.name) && q.at > G().t); if (!bar) bad('no "Your ..." boss-mod bar to count down (check D)'); else { played.length = 0; G().t = bar.at - 2.9; dbg.cdn(); if (!fs0().includes(740)) bad('no countdown beep 3 s before "' + bar.name + '" ends (check D)'); }
    dbg.at(20, 'r3', { seed: 3 }); played.length = 0; if (dbg.hatchMine() && !fs0().includes(155)) bad('a mistake plays no buzz (check D)');
    dbg.snd(false); const muted = call('Your coil: soak it!'); if (muted.length) bad('muted, a call still plays a sound (check D)'); played.length = 0; dbg.snd(true); if (!fs0().includes(988)) bad('turning sound back on plays no chime (check D)');
    played.length = 0; dbg.sim('r3', true, false, 1); if (played.length) bad('the autopilot\'s run plays ' + played.length + ' sounds; it should play none (check D)');
    { const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'practice.js'), 'utf8'); if (!/class=\\"pg-snd on\\"|class="pg-snd on"/.test(src) || !/e\.code === 'KeyM'\) \{ sndSet\(!sndOn\)/.test(src) || !/M: sound/.test(src)) bad('no Sound button by the 2D | 3D switch, no M key, or no "M: sound" on the keys line (check D)'); }
  } catch (x) { bad('the sound check crashed: ' + x.message + ' (check D)'); } finally { try { delete win.AudioContext; } catch (e) { /* (none) */ } }
  // E. egg holders (Flex, Nov 15: "maybe the egg holders should try to avoid the player just a little, without making it super super easy but they tend to
  //    pause and then move a lot faster than the player and will run right into me if im in their path"): a raider holding an egg walks at your speed
  //    (7 yd/s), faster only to get out of a wave; with your egg held and you right in its path it sidesteps a little
  try {
    dbg.at(20, 'r3', { seed: 3 }); const g = G(), mine = g.eggs.find((e) => e.who === 'r3' && e.state === 'held'); if (!mine) bad('at 0:20 you hold no egg, so the egg holders can\'t be checked (check E)');
    let n = 0, quick = 0; const last = {}, fastAt = {}; const held = () => g.eggs.filter((e) => e.state === 'held' && e.who && e.who !== 'r3').map((e) => e.who);
    held().forEach((id) => { last[id] = [g.bots[id].x, g.bots[id].y]; });
    while (g.t < 39) { steps(1); held().forEach((id) => { const b = g.bots[id], p = last[id]; if (p) { const v = Math.hypot(b.x - p[0], b.y - p[1]) / 0.05; if (v > 0.5) { n++; if (b.rush != null && Math.abs(b.rush - g.t) <= 0.051) (fastAt[id] = fastAt[id] || []).push(g.t); if (v > 8.6 && !(b.rush != null && Math.abs(b.rush - g.t) <= 0.051)) quick++; } } last[id] = [b.x, b.y]; }); }
    // (one Sprint is one burst, even with a stop inside its 3 s: since Nov 16 a carrier holds on its ring, the Plan's place, and can reach it mid-Sprint, stand
    //  a moment, then move on in the same Sprint. A second burst starting within 3 s of the first is that same Sprint, not a new one)
    Object.entries(fastAt).forEach(([id, L]) => { const bursts = []; L.forEach((x) => { const q = bursts[bursts.length - 1]; if (q && (x - q[1] <= 0.3 || x - q[0] <= 3.05)) q[1] = x; else bursts.push([x, x]); });
      bursts.forEach((q, i) => { if (q[1] - q[0] > 3.2) bad(id + ' ran fast for ' + (q[1] - q[0]).toFixed(1) + ' s holding an egg; Sprint lasts 3 s (check E)'); if (i && q[0] - bursts[i - 1][0] < 29.5) bad(id + ' sprinted again ' + (q[0] - bursts[i - 1][0]).toFixed(1) + ' s after the last; Sprint comes back every 30 s (check E)'); }); });
    if (!n) bad('no egg holder walked between 0:20 and 0:39, so their speed can\'t be checked (check E)'); else if (quick / n > 0.02) bad('egg holders ran faster than you (over 8.6 yd/s, not dodging) on ' + Math.round(100 * quick / n) + '% of their steps; they walk at your 7 yd/s, faster only for a wave or a soak due (check E)');
    // the sidestep: find an egg holder on the move, stand 4.5 yd ahead of it on its path with your egg, and watch it step aside
    dbg.at(20, 'r3', { seed: 3 }); let side = null; for (let k = 0; k < 400 && !side; k++) { const g2 = G(), before = {}; held().forEach((id) => { before[id] = [g2.bots[id].x, g2.bots[id].y]; }); steps(1);
      for (const id of held()) { const b = g2.bots[id], p = before[id]; if (!p) continue; const vx = b.x - p[0], vy = b.y - p[1], v = Math.hypot(vx, vy) / 0.05; if (v > 5 && v < 7.2) { side = { id, ux: vx / Math.hypot(vx, vy), uy: vy / Math.hypot(vx, vy), x0: b.x, y0: b.y }; break; } } }
    if (!side) bad('no egg holder walked steadily between 0:20 and 0:40 to check the sidestep (check E)');
    else { const g3 = G(), b = g3.bots[side.id]; g3.x = side.x0 + side.ux * 4.5; g3.y = side.y0 + side.uy * 4.5; steps(6);
      const off = Math.abs(side.ux * (b.y - side.y0) - side.uy * (b.x - side.x0)), dMe = Math.hypot(b.x - g3.x, b.y - g3.y);
      if (off < 0.3) bad('an egg holder walking at you (you hold your egg, 4.5 yd ahead) didn\'t step aside: ' + off.toFixed(2) + ' yd off its line after 0.3 s (check E)');
      if (dMe < 3) bad('an egg holder walked into your 3-yard ring (' + dMe.toFixed(1) + ' yd) while you stood in its path (check E)'); }
  } catch (x) { bad('the egg holder check crashed: ' + x.message + ' (check E)'); }
  const hy = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), splashes = (L) => L.filter((l) => /3-yard circle/.test(l));
  // F. who closed the gap (the release sweep, Nov 16). In the intermission (loaded as tests/practice-int.js loads it): you stand on another carrier's spot as
  //    the coils are called, it walks up to your ring and stops, then you walk past it, never straight at it (70 degrees off). The sweep's runs: Melee
  //    Yellow, pattern 1 (Star), seed 4; Ranged Blue, pattern 1, seed 2; Ranged Purple, pattern 2, seed 1. Before: it walked on to its spot inside your
  //    ring and both eggs burst on your score, 2 yards apart
  try {
    const { load: loadInt } = require('./practice-int.js'), di = loadInt(H, 'mint').dbg, F = (m) => bad(m + ' (check F)'); let tried = 0;
    for (const [pk, seed] of [[{ role: 'm', team: 'Y', egg: true, pat: 1 }, 4], [{ role: 'r', team: 'B', egg: true, pat: 1 }, 2], [{ role: 'r', team: 'P', egg: true, pat: 2 }, 1]]) {
      di.P2.pick = pk; const me = di.P2.slotOf(); di.at(333, me, { seed, east: false }); di.walkTo(null); const g = di.G, cars = g.eggs.filter((e) => e.state === 'held' && e.who && e.who !== me).map((e) => e.who);
      if (!g.eggs.some((e) => e.who === me && e.state === 'held') || !cars.length) continue; tried++;
      const id = cars[0], b = g.bots[id], T = di.job(id).T, u = [b.x - T[0], b.y - T[1]], ul = Math.hypot(u[0], u[1]) || 1, v0 = g.vipers, who = JSON.stringify(pk) + ' seed ' + seed;
      di.pos = [T[0], T[1]]; b.x = T[0] + u[0] / ul * 6; b.y = T[1] + u[1] / ul * 6; let mn = 99; for (let i = 0; i < 30; i++) { di.stepOwn(1); mn = Math.min(mn, hy(b, g)); }
      if (mn < 3.59) F(who + ': standing on ' + id + '\'s spot, it came ' + mn.toFixed(2) + ' yards from you; a carrier stops 3.6 yards out');
      const a = Math.atan2(b.y - g.y, b.x - g.x) + 70 * Math.PI / 180; di.walkTo([g.x + Math.cos(a) * 5, g.y + Math.sin(a) * 5]); mn = 99;
      for (let i = 0; i < 16; i++) { if (i === 6) di.walkTo(null); di.stepOwn(1); mn = Math.min(mn, hy(b, g)); }
      if (g.vipers > v0 || splashes(di.log).length) F(who + ': walking past ' + id + ' (never at it) burst both eggs: ' + (splashes(di.log)[0] || g.vipers - v0 + ' Vipers'));
      if (mn < 3.3) F(who + ': ' + id + ' walked to ' + mn.toFixed(2) + ' yards from you while you walked past it; its own step never takes it inside 3.6 yards of you'); }
    if (!tried) F('no run held two eggs at 5:33 in the intermission, so who closes the gap can\'t be checked');
    // walking straight into a carrier still splashes, and says you walked in (the same set-up: it waits on your ring, then you walk at it)
    { di.P2.pick = { role: 'r', team: 'B', egg: true, pat: 1 }; const me = di.P2.slotOf(); di.at(333, me, { seed: 2, east: false }); di.walkTo(null); const g = di.G, e = g.eggs.find((q) => q.state === 'held' && q.who && q.who !== me);
      if (e) { const b = g.bots[e.who], T = di.job(e.who).T, u = [b.x - T[0], b.y - T[1]], ul = Math.hypot(u[0], u[1]) || 1, v0 = g.vipers; di.pos = [T[0], T[1]]; b.x = T[0] + u[0] / ul * 6; b.y = T[1] + u[1] / ul * 6; di.stepOwn(30);
        for (let i = 0; i < 30 && g.vipers === v0; i++) { di.walkTo([b.x, b.y]); di.stepOwn(1); }
        const sp = splashes(di.log); if (g.vipers === v0) F('walking straight into ' + e.who + ' (both carrying) never splashed');
        else if (!sp.length || !/^\d+:\d+ You walked into \S+ \d+'s 3-yard circle/.test(sp[0])) F('walking into a carrier says "' + (sp[0] || '') + '"; it should say you walked into their 3-yard circle (it blamed them: "came inside your 3-yard circle")'); } }
    // phase 1: a carrier already 2.5 yards from you (on its spot), you step straight away: never a splash (before: any step of yours with a carrier inside 3
    // yards burst both eggs, a step away included). 0:25 seed 7, 2:05 seeds 3 and 5
    let t1 = 0; for (const [t0, seed] of [[25, 7], [125, 3], [125, 5]]) { dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; dbg.at(t0, 'r3', { seed }); dbg.walkTo(null); const g = G();
      const cars = g.eggs.filter((e) => e.state === 'held' && e.who && e.who !== 'r3').map((e) => e.who), id = cars.find((c) => { const T = dbg.job(c).T; return cars.every((o) => o === c || Math.hypot(g.bots[o].x - T[0], g.bots[o].y - T[1]) > 8); });
      if (!id || !g.eggs.some((e) => e.who === 'r3' && e.state === 'held')) continue; t1++; const b = g.bots[id], T = dbg.job(id).T; let u = [b.x - T[0], b.y - T[1]], ul = Math.hypot(u[0], u[1]); if (ul < 0.5) { u = [-T[0], -T[1]]; ul = Math.hypot(u[0], u[1]) || 1; }
      dbg.pos = [T[0], T[1]]; b.x = T[0] + u[0] / ul * 2.5; b.y = T[1] + u[1] / ul * 2.5; const v0 = g.vipers; dbg.walkTo([g.x - u[0] / ul * 3, g.y - u[1] / ul * 3]); steps(8);
      if (g.vipers > v0) F('phase 1 ' + Math.floor(t0 / 60) + ':' + String(t0 % 60).padStart(2, '0') + ' seed ' + seed + ': stepping straight away from ' + id + ' (2.5 yards off, carrying too) burst both eggs: ' + (splashes(dbg.log)[0] || '')); }
    if (!t1) F('no phase 1 run had a carrier on its own to step away from');
    // a raider doesn't pick its egg up beside you while you carry yours (you hold an egg 1 yard from its egg as it opens); it does once you've gone
    for (const seed of [3, 5]) { dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; dbg.at(10.2, 'r3', { seed }); dbg.walkTo(null); const g = G(), mine = g.eggs.find((e) => e.id === 'r3' && e.set === 0); mine.state = 'held'; mine.who = 'r3';
      const e2 = g.eggs.find((e) => e.set === 0 && e.id !== 'r3' && e.state === 'floor' && g.bots[e.id]); if (!e2) { F('no raider\'s egg on the floor at 0:10, seed ' + seed); continue; } const b = g.bots[e2.id], u = [b.x - e2.x, b.y - e2.y], ul = Math.hypot(u[0], u[1]) || 1;
      dbg.pos = [e2.x - u[0] / ul, e2.y - u[1] / ul]; let close = false; while (g.t < e2.shell + 3) { steps(1); if (hy(b, e2) < 2.5 && g.t >= e2.shell + 0.3) close = true; }
      if (close && e2.state === 'held') F('seed ' + seed + ': ' + e2.id + ' picked its egg up while you stood 1 yard from it carrying yours');
      dbg.walkTo([g.x - u[0] / ul * 9, g.y - u[1] / ul * 9]); steps(40); if (e2.state !== 'held') F('seed ' + seed + ': once you walked off, ' + e2.id + ' still hadn\'t picked its egg up (' + e2.state + ')'); }
  } catch (x) { bad('the splash check crashed: ' + x.message + ' (check F)'); }
  // G. your egg's pickup ring (the release sweep, Nov 16: Healer r1 seed 2 and Melee m1 seed 3 stood 2.4 yards off, inside the 2.8-yard gold ring)
  try { for (const seed of [2, 3]) { dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; dbg.at(8, 'r3', { seed }); dbg.walkTo(null); const g = G(), e = g.eggs.find((q) => q.id === 'r3' && q.set === 0);
      while (g.t < e.land + 0.2) steps(1); e.shp = 0; e.shell = g.t; dbg.pos = [e.x + 2.5, e.y]; steps(3);
      if (e.state !== 'held') bad('seed ' + seed + ': standing 2.5 yards from your open egg, inside its 2.8-yard gold ring, didn\'t pick it up (' + e.state + ') (check G)'); } } catch (x) { bad('the pickup check crashed: ' + x.message + ' (check G)'); }
  // H. starting after your last coil (the release sweep, Nov 16: Ranged r5 on Left Soak #2, seed 21, Start 2:18: your second egg still in your hands, "Break it in
  //    your coil soak" with no coil left). Your 1:20 egg is whole at 2:17.6 (the fast-forward's autopilot missed the 2:17 coil, as it did in 12 of 408 runs)
  try { dbg.myJob = { role: 'r', egg: 'r5', soak: [2, 2], fb: [0, 0] }; const slot = dbg.jobSlot(); dbg.at(137.6, slot, { seed: 21 }); const e = G().eggs.find((q) => q.id === slot && q.set === 1); e.state = 'held'; e.who = slot; dbg.ff(138);
    if (e.state !== 'gone') bad('starting at 2:18 with no coil left for your egg, you hold it (' + e.state + '); it breaks in your last coil (check H)');
    dbg.at(129, slot, { seed: 21 }); const e2 = G().eggs.find((q) => q.id === slot && q.set === 1); e2.state = 'held'; e2.who = slot; dbg.ff(130); if (e2.state !== 'held') bad('starting at 2:10, your egg was taken from you with the 2:17 coil still to come (check H)');
  } catch (x) { bad('the fast-forward check crashed: ' + x.message + ' (check H)'); }
  // I. the job line under your name (the release sweep, Nov 16: "Egg carrier, left (west) ..." all pull, while the 1:20 egg landed north)
  try { for (const [role, egg] of [['m', 'm1'], ['r', 'r3'], ['r', 'r4'], ['r', 'r1'], ['h', 'r2']]) { dbg.myJob = { role, egg, soak: [1, 1], fb: [0, 0] }; const j = dbg.jobRole().job; if (/\b(west|east|south|north)\b/i.test(j)) bad('the job line reads "' + j + '": the quadrants turn with her dive, so no compass word (check I)'); }
  } catch (x) { bad('the job line check crashed: ' + x.message + ' (check I)'); }
  // K. a healer with an egg (the release sweep, Nov 16: it plays exactly like ranged with the same egg)
  try { dbg.myJob = { role: 'h', egg: 'r1', soak: [1, 1], fb: [0, 0] }; const su = dbg.setupApi(), a = su.say(), b = su.maps ? su.maps.say() : '';
    if (!/Healers carry the same eggs as ranged/.test(a) || (su.maps && !/Healers carry the same eggs as ranged/.test(b))) bad('the setup card doesn\'t say a healer with an egg plays the ranged egg job: "' + a + '" / "' + b + '" (check K)');
    dbg.myJob = { role: 'r', egg: 'r1', soak: [1, 1], fb: [0, 0] }; if (/Healers/.test(su.say())) bad('the healers\' line shows for a ranged pick (check K)');
  } catch (x) { bad('the healer card check crashed: ' + x.message + ' (check K)'); } finally { dbg.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; }
  // J, L and M on a page that remembers its cards
  let R; try { R = recLoad(H); } catch (x) { bad('the game didn\'t load on the remembering page: ' + x.message + ' (checks J, L, M)'); }
  if (R) {
    const d = R.dbg, die = () => { d.G.hp = -1; d.play(); R.frames(2); return R.card(); };
    // M. the death card's reason
    try { d.myJob = { role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }; d.at(30, 'r3', { seed: 3 }); let g = d.G; g.adds = g.adds.filter((a) => a.kind !== 'viper');
      g.log.push({ t: g.t - 1, kind: 'wave', text: 'Her Caustic Waves hit you.', tip: 'Dodge.' }); g.log.push({ t: g.t - 12, kind: 'dps', text: 'A Viper was up: you were on it 0% of the time.', tip: 'Vipers are deadly.' });
      let c = die(); if (!c || !/You died/.test(c.innerHTML)) bad('no death card at hp 0 (check M)');
      else if (!/Her Caustic Waves hit you/.test(c.innerHTML) || /A Viper was up/.test(c.innerHTML)) bad('the death card blames "' + ((/<p>([^<]*)<\/p>/.exec(c.innerHTML) || [])[1] || '') + '"; a wave hit you 1 s before, and a damage-moment line is never what killed you (check M)');
      d.at(30, 'r3', { seed: 3 }); g = d.G; g.adds = g.adds.filter((a) => a.kind !== 'viper'); g.log.push({ t: g.t - 20, kind: 'bite', text: 'Mother\'s Wrath bit you: you were in her reach.' }); g.debs.venom = { until: g.t + 5, n: 2 };
      c = die(); if (!c || !/Caustic Venom \(2 stacks\)/.test(c.innerHTML)) bad('dying 20 s after your last mistake with 2 stacks of Caustic Venom, the death card says "' + (c ? ((/<p>([^<]*)<\/p>/.exec(c.innerHTML) || [])[1] || '') : '') + '"; it should name the venom (check M)');
    } catch (x) { bad('the death reason check crashed: ' + x.message + ' (check M)'); }
    // L. End the run shows the result; Keep going stays
    try { d.at(30, 'r3', { seed: 3 }); const c = die(); const h = c ? c.innerHTML : ''; if (!/Keep going/.test(h)) bad('the death card has no Keep going (check L)');
      const btn = c && c.querySelector('.pg-again'); if (!btn || typeof btn.onclick !== 'function') bad('the death card\'s second button does nothing (check L)');
      else { btn.onclick(); const e = R.card().innerHTML; if (!/pg-end/.test(e) || /pg-setup/.test(e)) bad('the death card\'s second button opens ' + (/pg-setup/.test(e) ? 'the setup card with no result' : 'no result screen') + ': a death ends with the grade and your mistakes (check L)');
        else { if (!/stopped at 0:30/.test(e)) bad('a run ended at 0:30 from the death card doesn\'t say where it stopped (check L)'); if (!/<b>You died<\/b>/.test(e)) bad('the result screen\'s list leaves out your death (check L)'); if (/A clean run|Every wave dodged/.test(e)) bad('a run ended by a death reads as a clean run (check L)'); } } } catch (x) { bad('the death card check crashed: ' + x.message + ' (check L)'); }
    try { const RI = recLoad(H, 'mint'), di = RI.dbg; di.P2.pick = { role: 'r', team: 'P', egg: false, pat: 1 }; const me = di.P2.slotOf(); di.at(330, me, { seed: 3 }); const P2o = di.P2, had = Object.prototype.hasOwnProperty.call(P2o, 'revive'), old = P2o.revive; let rv = 0;
      P2o.revive = function () { rv++; return typeof old === 'function' ? old.apply(this, arguments) : undefined; };
      try { di.G.hp = -1; di.play(); RI.frames(2); const c = RI.card(), go = c && c.querySelector('.pg-go'); if (!c || !/You died/.test(c.innerHTML) || !go || typeof go.onclick !== 'function') bad('no Keep going on the intermission\'s death card (check L)');
        else { go.onclick(); if (rv !== 1) bad('Keep going didn\'t ask the part to clear what was still hurting you (P2.revive: a missed Malice\'s last ticks killed you a second time 3 s later, phase 2 seeds 1 and 4) (check L)'); if (di.G.hp !== 100) bad('Keep going didn\'t put you back at full health (check L)'); } }
      finally { if (had) P2o.revive = old; else delete P2o.revive; } } catch (x) { bad('the Keep going check crashed: ' + x.message + ' (check L)'); }
    // J. the result screen's "Right target" (the release sweep, Nov 16: Melee egg m2, Left Soak #2, seed 1: "2 of 6 moments (the Rawlings, the heart)" for your egg,
    //    the Rawlings, the Wretch, your egg, the Rawlings, the heart)
    try { d.myJob = { role: 'm', egg: 'm2', soak: [2, 2], fb: [0, 0] }; const slot = d.jobSlot(); d.at(1, slot, { seed: 1 }); const end = d.S.end; d.at(end - 0.3, slot, { seed: 1 }); d.play(); R.frames(30);
      const e = R.card().innerHTML, m = /Right target: <b>[^<]*<\/b> moments \(([^)]*)\)/.exec(e), kinds = new Set(d.dpsList().map((q) => q.kind)), want = { egg: 'your egg', rawling: 'the Rawlings', wretch: 'the Wretch', heart: 'the heart', viper: 'the Vipers' };
      if (!m) bad('the end card at ' + end + ' s has no "Right target" line (check J)');
      else Object.entries(want).forEach(([k, w]) => { if (kinds.has(k) !== m[1].includes(w)) bad('"Right target" lists "' + m[1] + '" for moments of ' + [...kinds].join(', ') + ' (check J)'); });
      if (/stopped at/.test(e)) bad('a run played to its end says it stopped early (check J)');
    } catch (x) { bad('the end card check crashed: ' + x.message + ' (check J)'); }
  }
}
module.exports = checks;
if (require.main === module) {
  process.chdir(__dirname); let n = 0; const t0 = Date.now(); checks(null, (a, b, t) => { n++; console.log('✗ ' + t); });
  console.log(n ? n + ' problem(s)' : 'practice game, shared rules: all checks pass', '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)'); process.exitCode = n ? 1 : 0;
}
