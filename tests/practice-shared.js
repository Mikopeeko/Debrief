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
      else if (/\b\d{1,2}:\d{2}\b/.test(c.innerHTML.replace(/<[^>]*>/g, ' '))) bad('the death card shows a clock time ("' + ((/<span class="pg-k">([^<]*)</.exec(c.innerHTML) || [])[1] || '') + '"); look C, Nov 16 (Flex: "remove the timestamps"): only the end report keeps times (check N)');
      else if (!/Her Caustic Waves hit you/.test(c.innerHTML) || /A Viper was up/.test(c.innerHTML)) bad('the death card blames "' + ((/<p>([^<]*)<\/p>/.exec(c.innerHTML) || [])[1] || '') + '"; a wave hit you 1 s before, and a damage-moment line is never what killed you (check M)');
      d.at(30, 'r3', { seed: 3 }); g = d.G; g.adds = g.adds.filter((a) => a.kind !== 'viper'); g.log.push({ t: g.t - 20, kind: 'bite', text: 'Mother\'s Wrath bit you: you were in her reach.' }); g.debs.venom = { until: g.t + 5, n: 2 };
      c = die(); if (!c || !/Caustic Venom \(2 stacks\)/.test(c.innerHTML)) bad('dying 20 s after your last mistake with 2 stacks of Caustic Venom, the death card says "' + (c ? ((/<p>([^<]*)<\/p>/.exec(c.innerHTML) || [])[1] || '') : '') + '"; it should name the venom (check M)');
    } catch (x) { bad('the death reason check crashed: ' + x.message + ' (check M)'); }
    // L. End the run shows the result; Keep going stays
    try { d.at(30, 'r3', { seed: 3 }); const c = die(); const h = c ? c.innerHTML : ''; if (!/Keep going/.test(h)) bad('the death card has no Keep going (check L)');
      const btn = c && c.querySelector('.pg-again'); if (!btn || typeof btn.onclick !== 'function') bad('the death card\'s second button does nothing (check L)');
      else { btn.onclick(); const e = R.card().innerHTML; if (!/pg-end/.test(e) || /pg-setup/.test(e)) bad('the death card\'s second button opens ' + (/pg-setup/.test(e) ? 'the setup card with no result' : 'no result screen') + ': a death ends with the grade and your mistakes (check L)');
        else { if (!/stopped early/.test(e)) bad('a run ended at 0:30 from the death card doesn\'t say it stopped early (check L)'); if (/\b\d{1,2}:\d\d\b/.test(e.replace(/<[^>]*>/g, ' '))) bad('the end screen shows a clock time (Flex, Nov 17: "dont put timestamps in the ending"; check L)'); if (!/<b>You died<\/b>/.test(e)) bad('the result screen\'s list leaves out your death (check L)'); if (/A clean run|Every wave dodged/.test(e)) bad('a run ended by a death reads as a clean run (check L)'); } } } catch (x) { bad('the death card check crashed: ' + x.message + ' (check L)'); }
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
      if (/stopped early/.test(e)) bad('a run played to its end says it stopped early (check J)'); if (/\b\d{1,2}:\d\d\b/.test(e.replace(/<[^>]*>/g, ' '))) bad('the end screen shows a clock time (Flex, Nov 17: "dont put timestamps in the ending"; check J)');
    } catch (x) { bad('the end card check crashed: ' + x.message + ' (check J)'); }
  }
}
// N. Look C "Minimal" (Flex, Nov 16: "Yes, go with C", after "The prompts dont feel like a guide through the fight at all", "I also think the UI could look
//    more polished and put together", "just make sure the wording is clear, not jumbled and easy to understand", "clean up the setup interface and remove the
//    timestamps"), for every part:
//    N1. the screen has the fight path (in the boss-mod bars' place, .pg-timers), the result chips, the coach card, and the NOW line with NEXT under it above the
//        dock; the coach card's words are "Name (Short instruction)", one sentence of what happens, and a job, with no clock time or second count.
//    N2. in a played run of each part the path names the coming step and the next one and ticks the done ones, the coach card comes before a new mechanic
//        with its title, what happens and YOUR JOB, never for something that isn't a mechanic, and the NOW line always has an order.
//    N3. nothing written on the screen over a played run of each part, nor the setup card it opens with, has a clock time or a second count. Before look C her
//        frame ran the fight clock ("2:05"), her cast bar counted down ("Venom beam  2.6"), the boss-mod bars counted ("4.3", "12"), the tags on your frame
//        counted their seconds and the hotbar its cooldowns, and phase 3's Start list read "6:12 · Onto her quarter".
//    N4. phase 1's setup card and Start list have no clock time, and the shared setup card strips one from any part's words.
//    Each failed on the commit before (08a45c58): run lookC(null, say, oldPracticeJs).
function lookLoad(H, pj) {
  H = H || require('./site-helpers.js'); const fs = require('fs'), vm = require('vm'), SRC = path.join(__dirname, '..', 'src'), rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n');
  // (a page that writes down every word put on it: each element is known by the selectors that found it, and every textContent / innerHTML set is kept)
  const W = [], node = (p, last) => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : k === Symbol.iterator ? function* () {} : k === 'dataset' ? (t.ds || (t.ds = {})) : k === 'style' ? (t.st || (t.st = {})) : node(p, k)),
    set: (t, k, v) => { if (k === 'textContent' || k === 'innerHTML' || k === 'innerText') W.push({ at: p, v: String(v) }); return true; }, apply: (t, th, a) => node(last === 'querySelector' || last === 'querySelectorAll' ? (p + ' ' + a[0]).slice(-160) : p) });
  const GJ = rd('guides.js'), fromGuides = ['GDZ_ROLE', 'GDZ_RAID', 'gdzName', 'UX', 'UX_MEL', 'UX_HOME', 'UX_ZONE', 'UL_EDGE', 'UL_FB', 'GDZ_FLOOR', 'UL_EGGS', 'UL_RIM', 'UL_SOAK', 'UL_CMK', 'UL_PAT'].map((n) => H.grab(n, GJ)).join('\n');
  const win = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
  class Img { constructor() { this.complete = false; this.naturalWidth = 0; } }
  const ctx = vm.createContext({ document: node(''), window: win, navigator: node(''), performance, Image: Img, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, E: { CLASSES: {} }, console, MouseEvent: function () {} });
  vm.runInContext(H.grab('esc') + '\n' + H.grab('guideSlug') + '\n' + fromGuides + '\n' + (pj || rd('practice.js')) + '\n' + rd('practice3d.js') + '\n' + rd('practice-p2.js') + '\n' + rd('practice-int.js') + '\n' + rd('practice-p3.js') +
    '\nthis.PG_PARTS = PG_PARTS; this.PG_COACH = typeof PG_COACH === "undefined" ? null : PG_COACH; this.pgNoClock = typeof pgNoClock === "undefined" ? null : pgNoClock;', ctx);
  return { W, ctx, win, open: (pk) => { vm.runInContext('pgOpen(null, "Ula\'tek", "m"' + (pk ? ', "' + pk + '"' : '') + ')', ctx); return win.__pgDbg; } };
}
function lookC(H, say, pj) {
  const bad = (t) => say("Ula'tek practice game (shared rules)", 'bad', t + ' (look C, Nov 16, check N)');
  const CLOCK = /\b\d{1,2}:\d{2}\b/, SECS = /\b\d+(?:\.\d+)?\s?s\b/, TENTHS = /\b\d+\.\d\b/, timey = (x) => CLOCK.test(x) || SECS.test(x) || TENTHS.test(x);
  const plain = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const TITLE = /^[A-Z][^()]{1,40} \([A-Z][^()]{2,60}\)$/, ONE = /^[A-Z][^.!?]*[.!?]$/, NOT_MECH = /^(Back to her|Gates open|Your gate opens|Rawlings boil|Be on her quarter|Wardens die|Defensive \(Q\))$/;
  let L; try { L = lookLoad(H, pj); } catch (e) { bad('the game didn\'t load for the look check: ' + e.message); return; }
  const { W, ctx } = L;
  // N1. the pieces, and the coach card's own words
  { const d = L.open(), h = d && typeof d.html === 'function' ? d.html() : '', has = (c) => new RegExp('class="(?:[^"]*\\s)?' + c + '(?:\\s[^"]*)?"').test(h), at = (c) => h.search(new RegExp('class="(?:[^"]*\\s)?' + c + '(?:\\s[^"]*)?"'));
    [['pg-path', 'the fight path'], ['pg-timers', 'the fight path in the boss-mod bars\' place (.pg-timers, which the 3D labels keep out of)'], ['pg-res', 'the result chips'], ['pg-coach', 'the coach card'], ['pg-nowt', 'the NOW line'], ['pg-nx', 'the NEXT line']].forEach(([c, w]) => { if (!has(c)) bad('the screen has no ' + w + ' (.' + c + ')'); });
    if (has('pg-nowt') && !(at('pg-nowt') < at('pg-nx') && at('pg-nx') < at('pg-ufs'))) bad('the NOW line, then NEXT, don\'t sit above the dock (your frame, the hotbar, your target)');
    if (!/\.pg-coach/.test(require('fs').readFileSync(path.join(__dirname, '..', 'src', 'practice3d.js'), 'utf8'))) bad('the 3D labels don\'t keep out of the coach card (practice3d.js CRN)');
    const C = ctx.PG_COACH; if (!C) bad('there are no coach card words (PG_COACH)');
    else Object.entries(C).forEach(([k, e]) => { if (!TITLE.test(e.t || '')) bad('the coach card for ' + k + ' is titled "' + e.t + '"; the rule is "Name (Short instruction)"'); if (!ONE.test(e.w || '')) bad('the coach card for ' + k + ' says "' + e.w + '"; one plain sentence of what happens');
      if (!(e.j || e.jf)) bad('the coach card for ' + k + ' has no job of its own for when the game has none'); [e.t, e.w, e.j, e.jf].forEach((x) => { if (x && (timey(x) || /went wrong/i.test(x))) bad('the coach card for ' + k + ' says "' + x + '"'); }); });
    const nc = ctx.pgNoClock; if (typeof nc !== 'function') bad('the setup card has no way to drop a part\'s clock times (pgNoClock)');
    else [['6:12 · Onto her quarter', 'Onto her quarter'], ['6:12 - Onto her quarter', 'Onto her quarter'], ['Group Soak 2 7:46', 'Group Soak 2'], ['You soak Group Soak 2 at 7:46.', 'You soak Group Soak 2.'], ['The first bite (6:32)', 'The first bite'], ['Egg left · Right Soak #1', 'Egg left · Right Soak #1']].forEach(([a, b]) => { const g = nc(a); if (g !== b) bad('the setup card turns "' + a + '" into "' + g + '", not "' + b + '"'); }); }
  // N2 + N3. a played run of each part: the autopilot plays it, the screen is drawn every quarter second, and every word written on it is read
  const PARTS = Object.keys(ctx.PG_PARTS["Ula'tek"] || {}), seen = new Map(), note = (where, x) => { const k = where + '|' + x; if (!seen.has(k)) seen.set(k, where + ': "' + String(x).slice(0, 120) + '"'); };
  for (const pk of PARTS) {
    const W0 = W.length; let d; try { d = L.open(pk === 'm' ? null : pk); } catch (e) { bad('the ' + pk + ' part didn\'t open: ' + e.message); continue; }
    const name = ((ctx.PG_PARTS["Ula'tek"] || {})[pk] || {}).name || pk, tag = ' (' + name + ')';
    try { d.at(0, d.role.id, { seed: 3 }); } catch (e) { bad('the ' + name + ' run didn\'t start: ' + e.message); continue; }
    ['pathView', 'coach', 'nowHtml', 'nextHtml'].forEach((f) => { if (typeof d[f] !== 'function') bad('the test can\'t read the screen\'s ' + ({ pathView: 'fight path', coach: 'coach card', nowHtml: 'NOW line', nextHtml: 'NEXT line' })[f] + ' (window.__pgDbg.' + f + ')' + tag); });
    const S = d.S, G = d.G; let named = 0, ticked = 0, cards = new Map(), noNow = 0, frames = 0, nexts = 0;
    while (G.t < S.end - 0.3) { d.step(5); try { d.frame(); d.warnsNow(); } catch (e) { bad('drawing the screen crashed at ' + G.t.toFixed(1) + tag + ': ' + e.message); break; } frames++;
      const pv = typeof d.pathView === 'function' ? d.pathView() : null; if (pv && pv.steps[0] && pv.steps[0].st === 'now' && pv.steps[0].name && (!pv.steps[1] || pv.steps[1].st === 'next')) named++; if (pv && pv.done.length) ticked++;
      const c = typeof d.coach === 'function' ? d.coach() : null; if (c && !cards.has(c.k + c.at)) cards.set(c.k + c.at, c);
      if (typeof d.nowHtml === 'function' && !plain(d.nowHtml())) noNow++; if (typeof d.nextHtml === 'function' && plain(d.nextHtml())) nexts++; }
    if (typeof d.pathView !== 'function' || named < frames * 0.5) bad('the fight path names the coming step and the next one in only ' + named + ' of ' + frames + ' moments' + tag);
    if (!ticked) bad('the fight path never ticks a done step' + tag);
    if (typeof d.coach !== 'function' || !cards.size) bad('no coach card came before a mechanic in the whole run' + tag);
    cards.forEach((c) => { if (NOT_MECH.test(c.name)) bad('a coach card came for "' + c.name + '", which isn\'t a mechanic' + tag);
      if (!TITLE.test(c.title || '') || !ONE.test(c.what || '') || !c.job) bad('the coach card before "' + c.name + '" reads "' + c.title + '" / "' + c.what + '" / your job "' + c.job + '"' + tag); });
    if (typeof d.nowHtml !== 'function' || noNow > frames * 0.05) bad('the NOW line was empty in ' + noNow + ' of ' + frames + ' moments' + tag);
    if (typeof d.nextHtml !== 'function' || !nexts) bad('the NEXT line never showed' + tag);
    // (every word written on the screen: no clock time, no count of seconds; the cast bar, the tags under your frame and the hotbar's buttons no numbers at all
    //  (stacks on a tag are "×2"), the fight path only its "3 of 31 done")
    W.slice(W0).forEach(({ at, v }) => { const x = plain(v); if (!x || /\.pg-cds\b/.test(at)) return; /* (your countdown alerts count on purpose: Flex, Nov 17, '"Break tether in 20s" and it slowly counts down'; check S10) */ if (timey(x)) note('a clock time or a count of seconds on the screen' + tag + ' at "' + at.trim() + '"', x);
      if ((/\.pg-cdn\b|\.pg-clk\b/.test(at) && /\d/.test(x)) || (/\.pg-cast\b/.test(at) && /\s\d+(?:\.\d+)?$/.test(x))) note('a number counting down on her cast bar, a button or a clock' + tag + ' at "' + at.trim() + '"', x); /* ("Interrupted (Melee 2)" is a name) */
      if (/\.pg-debs\b/.test(at) && /\d/.test(plain(v.replace(/<span class="pg-tag pg-jtag"[^>]*>[^<]*<\/span>/g, '')).replace(/×\d+/g, ''))) note('seconds on the tags under your frame' + tag, x); /* (your job's own tag may say "Right Soak #1") */
      if (/\.pg-timers\b/.test(at) && /\d/.test(x.split(name).join('').replace(/\b\d+ of \d+ done\b/g, ''))) note('a number on the fight path (other than "3 of 31 done")' + tag, x); });
  }
  [...seen.values()].slice(0, 10).forEach((m) => bad('Flex, Nov 16, "remove the timestamps": ' + m));
  // N4. phase 1's setup card and its Start list
  { const d = L.open(), PJ = pj || require('fs').readFileSync(path.join(__dirname, '..', 'src', 'practice.js'), 'utf8'), st = (/const START = (\[\[[^;]*\]\]);/.exec(PJ) || [])[1] || '';
    (st.match(/'[^']*'/g) || []).forEach((x) => { if (timey(x)) bad('phase 1\'s Start list reads ' + x); });
    for (const jb of [{ role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] }, { role: 'h', egg: null, soak: [2, 2], fb: [0, 0] }, { role: 'm', egg: 'm1', soak: [1, 1], fb: [0, 0] }]) { d.myJob = jb; const x = plain(d.panel()); if (timey(x)) bad('phase 1\'s setup card reads "' + x.slice(0, 140) + '"'); } }
}
// S. The simple screen (Flex, Nov 17, after playing it: "Youre expecting someone to read 3 sentences, and execute the mechanic within 3 seconds. The prompts on
//    the screen should be simple more like 'DPS your egg, then pick it up'"; of the coach card, "i dont think we need these"; "Make sure the instructions and text
//    is clear and not jumbled"). A 37-run playtest found the NOW line changing 50-78 times in phase 1, 81 of its 156 lines over 9 words, and the calls, the coach
//    card and the NOW line giving different orders at once.
//    S1. over a played run of each part as each role, the NOW line is one short command: at most 9 words, one sentence, no "Then:", no how-to-press.
//    S2. it holds: a new line comes at least 2 s after the last unless it's something to do now (PG_URGENT).
//    S3. no coach card and no call boxes on screen; a call's order goes into the NOW line, the mechanic's name dropped ("Your egg: wait next to its gold circle!"
//        -> "Wait next to your egg's gold circle!").
//    S4. the green done chip only for something you did; an order or a "not yet" goes to the middle, short, with no tick.
//    Each failed on the commit before (3cbf6ad0 plus phase 3's fixes).
function simpleScreen(H, say, pj) {
  const bad = (t) => say("Ula'tek practice game (shared rules)", 'bad', t + ' (the simple screen, Nov 17, check S)'), vm = require('vm'), fs = require('fs');
  const plain = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/\s+([,!.?])/g, '$1').trim();
  const PJ = pj || fs.readFileSync(path.join(__dirname, '..', 'src', 'practice.js'), 'utf8');
  let L; try { L = lookLoad(H, pj); } catch (e) { bad('the game didn\'t load: ' + e.message); return; }
  const { W, ctx } = L; let URG = null, short = null, callShort = null; try { URG = vm.runInContext('PG_URGENT', ctx); short = vm.runInContext('pgShort', ctx); callShort = vm.runInContext('pgCallShort', ctx); } catch (e) { bad('the screen has no short-line rules (PG_URGENT, pgShort, pgCallShort)'); return; }
  // S1 + S2
  const long = new Map(), flick = new Map(), PARTS = Object.keys(ctx.PG_PARTS["Ula'tek"] || {});
  for (const pk of PARTS) { const d0 = L.open(pk === 'm' ? null : pk), S0 = d0.P2 ? d0.P2.setup : d0.setupApi(), name = ctx.PG_PARTS["Ula'tek"][pk].name;
    for (const r of S0.roles) { const jb = S0.jobs(r)[0][0], d = L.open(pk === 'm' ? null : pk), su = d.P2 ? d.P2.setup : d.setupApi(); su.set(r, jb); const slot = d.P2 ? d.P2.slotOf(d.P2.pick) : d.jobSlot(), tag = ' (' + name + ', ' + r + ' ' + jb + ')';
      try { d.at(0, slot, { seed: 3 }); } catch (e) { bad('the run didn\'t start' + tag + ': ' + e.message); continue; }
      const G = d.G, S = d.S; let prev = '', prevT = -9, n = 0;
      while (G.t < S.end - 0.3 && n++ < 4000) { d.step(5); try { d.frame(); d.warnsNow(); } catch (e) { bad('drawing crashed' + tag + ': ' + e.message); break; } const now = plain(d.nowHtml());
        if (now.replace(/[!.]+$/, '') === prev.replace(/[!.]+$/, '')) { prev = now; continue; } const w = now ? now.split(/\s+/).length : 0;
        if (w > 9 || /[.!?]\s+[A-Z]/.test(now) || /\bThen:|press Tab|keep pressing 1|\(Tab|\(melee/i.test(now)) long.set(now, now + tag);
        if (prev && now && !URG.test(now) && prev.replace(/[!.]+$/, '') !== now.replace(/[!.]+$/, '') && G.t - prevT < 2 - 0.3) flick.set(prev + '>' + now, '"' + prev + '" then "' + now + '" ' + (G.t - prevT).toFixed(2) + ' s apart' + tag);
        prev = now; prevT = G.t; } } }
  if (long.size) bad(long.size + ' NOW lines aren\'t one short command (9 words at most, one sentence, no "Then:", no how-to-press), e.g. "' + [...long.values()].slice(0, 4).join('" / "') + '"');
  if (flick.size) bad('the NOW line changes again within 2 s without anything urgent (' + flick.size + ' times), e.g. ' + [...flick.values()].slice(0, 3).join('; '));
  // S3
  if (!/\.pg \.pg-coach, \.pg \.pg-coach\.on, \.pg \.pg-warn \.pg-al \{ display: none !important; \}/.test(PJ)) bad('the coach card or the call boxes can still show (no CSS hiding .pg-coach and .pg-warn .pg-al)');
  { const cd = (/const coachDraw = \(t\) => \{[^\n]*/.exec(PJ) || [''])[0]; if (!cd || /coachNow\(/.test(cd)) bad('coachDraw still draws the coach card (Flex: "i dont think we need these")'); }
  [['Your egg: wait next to its gold circle!', 'Wait next to your egg\'s gold circle!'], ['Your coil: soak the first one to appear!', 'Soak the first coil to appear!'], ['Call of the Serpent: Dodge the falling eggs! Eight land all over the stone.', 'Dodge the falling eggs!']].forEach(([a, b]) => { const g = callShort(a); if (g !== b) bad('the NOW line says the call "' + a + '" as "' + g + '", not "' + b + '"'); });
  [['Break your egg: Tab, then 1. Then: walk over it.', 'DPS your egg'], ['Kill the Rawlings: press Tab, then keep pressing 1 (melee: get close)', 'Kill the Rawlings'], ['Good spot. Keep hitting the Rawlings.', 'Keep hitting the Rawlings'], ['Wait: let it pass, then go.', 'Wait for the wave to pass']].forEach(([a, b]) => { const g = short(a); if (g !== b) bad('the NOW line says "' + a + '" as "' + g + '", not "' + b + '"'); });
  // S4
  { void W; const say0 = (/  const say = \(text, bad\) => \{[^\n]*/.exec(PJ) || [''])[0]; if (!/PG_DONE\.test/.test(say0)) bad('every float that isn\'t a mistake still becomes a green done chip ("Not open yet: hit it" got a tick)');
    const dm = /const PG_DONE = (\/.*\/);/.exec(PJ), doneRx = dm ? new Function('return ' + dm[1])() : null; /* (inside pgOpen: read from the source) */
    if (!doneRx) bad('there is no list of what counts as done (PG_DONE)');
    else { ['Egg picked up.', 'Soaked: your egg broke (a Rawling).', 'Kicked: Vicious Echoes interrupted.', 'Tether broken on time.', 'Rawling killed.'].forEach((x) => { if (!doneRx.test(x)) bad('"' + x + '" doesn\'t get the green done chip'); });
      ['Not open yet: hit it (Tab, then 1).', 'Kick is on cooldown.', 'Its shell is still up: hit it (Tab, then 1) to break it.', 'The tank taunted the Viper: kill it with the raid!', 'Back by her: burn the heart.'].forEach((x) => { if (doneRx.test(x)) bad('"' + x + '" gets the green done chip, as if done'); }); } }
  // S6. every monster with a name bar over its head has its health, so the bar goes down as it's hit (Flex, Nov 17, of phase 1's Wretch: "wretch nameplate
  //     health isnt going down in p1"; its target entry had no hp, so the bar stayed full). The kinds are the ones practice3d.js puts a plate on.
  { const P3J = fs.readFileSync(path.join(__dirname, '..', 'src', 'practice3d.js'), 'utf8'), km = /if \(!o \|\| !o\.p \|\| !\/([^/]+)\/i\.test\(String\(o\.kind/.exec(P3J), MOB = km ? new RegExp(km[1], 'i') : /rawling|viper|wretch|warden|clutch|shriek|^ds|doom|rav/i, miss = new Map();
    for (const pk of PARTS) { const d = L.open(pk === 'm' ? null : pk); try { d.at(0, d.role.id, { seed: 3 }); } catch (e) { continue; } const G = d.G, S = d.S; let n = 0;
      while (G.t < S.end - 0.3 && n++ < 4000) { d.step(10); (d.tgts() || []).forEach((o) => { if (MOB.test(String(o.kind || '')) && (!(o.max > 0) || !Number.isFinite(o.hp))) miss.set(pk + o.kind, ctx.PG_PARTS["Ula'tek"][pk].name + ': ' + o.name); }); } }
    if (miss.size) bad('a monster\'s name bar has no health to show, so it stays full: ' + [...miss.values()].join(', ') + ' (check S6)'); }
  // S5. the setup card's switches and lists: a tidy two by two grid, the lists flat in their frames (Flex, Nov 17, of the row 'Hints on | Normal speed | Look [Auto (your class or role)]' with 'Start [The pull]' alone on a second row: 'weird formatting/glitches')
  if (!/\.pg-chips \{ display: grid; grid-template-columns: 1fr 1fr;/.test(PJ) || !/\.pg-chip select \{[^}]*background: transparent;/.test(PJ)) bad('the setup card\'s Hints, Speed, Class and Start wrap unevenly, or the lists sit as boxes inside their frames (check S5)');
  // (Flex, Nov 17, via Main: "visual glitch on the drop downs. looks weird. also no one knows what look means rename it class": the site's refine look forces a
  //  border, a background, round corners and 32px on every select with !important, one rule through :is(#view, #main), so the game's flat lists lost to it)
  // (Main, Nov 17: the fix must only reach the game's own card and change nothing in the site's shared dropdown look: the Design studio owns it. The site's two
  //  shared select rules, exactly as they were on Nov 17, and every game rule that touches a select inside @layer defaultTheme scoped to .pg-card)
  { const SH = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'), A = 'html:not([data-theme]) body.refine :is(#view, #main) select { background-color: rgba(255,255,255,.03) !important; }',
      B = 'html:not([data-theme]) body.refine :is(.btn, select, .seg > button, .gb-auk > button) {\n    min-height: 32px !important;\n    border: 1px solid var(--line2) !important;\n    border-radius: 4px !important;\n    background: var(--raised) !important;';
    if (!SH.includes(A) || !SH.replace(/\r\n/g, '\n').includes(B)) bad('the site\'s shared dropdown rules in src/shell.html changed (the game\'s fix must not touch them; the Design studio owns them) (check S5)');
    (PJ.match(/@layer defaultTheme \{[^\n]*/g) || []).forEach((r) => { if (/select/.test(r) && !/\.pg\.pg \.pg-card /.test(r)) bad('a game rule inside the site\'s defaultTheme layer reaches selects outside the game\'s card: ' + r.slice(0, 120) + ' (check S5)'); }); }
  if (!/>Class <select class="pg-look"/.test(PJ) || />Look <select/.test(PJ)) bad('the figure list on the start card is still called "Look", not "Class" (check S5)');
  if (!/:is\(#view, #main, #app\) \.pg\.pg \.pg-card \.pg-chips \.pg-chip select, \.pg\.pg \.pg-card \.pg-chips \.pg-chip select \{ border: 0 !important;[^}]*background-color: transparent !important;[^}]*min-height: 0 !important;/.test(PJ)
    || !/@layer defaultTheme \{ html:not\(\[data-theme\]\) body\.refine :is\(#view, #main, #app\) \.pg\.pg \.pg-card \.pg-chips \.pg-chip select \{ border: 0 !important;[^}]*min-height: 0 !important;/.test(PJ)) bad( /* (the site's rule sits in @layer defaultTheme, and a layered !important beats any unlayered one: the override must be in that layer too) */'the start card\'s lists keep the site\'s own border and background inside their frames (the site\'s rule wins with !important through #view): a box in a box (check S5)');
  // S7. boss-mod bars down the left, not the fight path's diamonds across the top (Flex, Nov 17: "can you change this back into the boss mods style bars on the left
  //     side of the screen?"): each bar its spell's icon, its name and a fill that empties, no numbers; drawn in a played run of each part
  if (!/el\.innerHTML = barsHtml\(V\)/.test(PJ) || !/\.pg \.pg-timers \{ position: absolute; left: 14px; top: 30%;[^}]*flex-direction: column;/.test(PJ)) bad('the coming mechanics aren\'t boss-mod bars down the left (check S7)');
  { const W1 = W.length; for (const pk of PARTS) { const d = L.open(pk === 'm' ? null : pk); try { d.at(40, d.role.id, { seed: 3 }); d.frame(); } catch (e) { /* (a part that starts later) */ } }
    const hs = W.slice(W1).filter((w) => /\.pg-timers/.test(w.at)).map((w) => w.v); if (!hs.some((h) => /class="pgb[ "]/.test(h) && /class="pgb-ic"/.test(h) && /class="pgb-bar"/.test(h))) bad('no boss-mod bar (icon, name, fill) was drawn in any part (check S7)');
    hs.forEach((h) => { const x = h.replace(/<[^>]*>/g, ' ').replace(/&#?[a-z0-9]+;/gi, ' '); if (/\d/.test(x)) bad('a boss-mod bar shows a number: "' + x.replace(/\s+/g, ' ').trim().slice(0, 80) + '" (check S7)'); }); }
  // S9. phase 2's tethers (Flex, Nov 17, via Main: "The tether break alerts in p2 are kind of confusing. Its not clear if youre the early break or the late break
  //     with the 5. The on screen alert changes a lot during that section"; the guide, 131 kills: one breaks alone first, about 8 s later the five together): from
  //     the moment the tethers land the NOW line says which break is yours ("You break first, alone" / "You break second, with the 5") and holds it, then the walk
  //     to the edge (naming it again), then "Break now"; at most 5 changes from the landing to just after your break. Before: "Stay within 20 yards of the Warden"
  //     with the rest cut off, flipping with "Hit the Warden" every second.
  { let T2 = null; try { T2 = vm.runInContext('PG_P2_T', ctx); } catch (e) { T2 = null; }
    if (!T2 || !ctx.PG_PARTS["Ula'tek"].m2) bad('phase 2 isn\'t loaded for the tether check (check S9)');
    else for (const [teth, role, side, want] of [['solo', 'r', 'E', /break first/i], ['five', 'm', 'W', /with the 5/i]]) {
      const d = L.open('m2'); d.P2.pick = { side, role, egg: null, mal: 0, cry: 0, teth }; const me = d.P2.slotOf(d.P2.pick), tb = teth === 'solo' ? T2.solo : T2.five, tag = ' (' + teth + ', ' + role + ' on the ' + side + ' ledge)';
      try { d.at(T2.fangs - 12, me, { seed: 3 }); } catch (e) { bad('the tether run didn\'t start' + tag + ': ' + e.message + ' (check S9)'); continue; }
      let prev = null, changes = 0, named = 0, samples = 0, broke = false, cdBad = null, cdN = 0, cdNow = false; const W2 = W.length;
      while (d.G.t < tb + 1.5) { d.step(2); d.frame(); const t = d.G.t, now = plain(d.nowHtml()), k = now.replace(/[!.]+$/, '');
        if (t >= T2.fangs + 0.5) { if (prev !== null && k !== prev) changes++; prev = k; }
        if (t >= T2.fangs + 3 && t < tb - 5.5) { samples++; if (want.test(now)) named++; } if (t >= tb && t < tb + 1 && /^Break now/.test(now)) broke = true;
        // (S10. the countdown alert (Flex, Nov 17: '"Break tether in 20s" and it slowly counts down'): from the landing to your break, "Break tether in Ns" with N the
        //  whole seconds left, then "Break tether now!" until you're out)
        const al = typeof d.P2.alerts === 'function' ? (d.P2.alerts(t) || []).map((a) => a.text) : null, th = d.G.p2.teth[me];
        if (!al) cdBad = cdBad || 'phase 2 gives no countdown alerts (P2.alerts)';
        else if (t >= T2.fangs + 0.2 && t < tb - 0.05 && th && th.br == null) { const m = /^Break tether in (\d+)s$/.exec(al[0] || ''); if (!m || +m[1] !== Math.ceil(tb - t - 1e-6)) cdBad = cdBad || 'at ' + (t - T2.fangs).toFixed(1) + ' s after the landing the alert reads "' + (al[0] || 'nothing') + '", not "Break tether in ' + Math.ceil(tb - t - 1e-6) + 's"'; else cdN++; }
        else if (t >= tb && t < tb + 1 && al.includes('Break tether now!')) cdNow = true; }
      if (!samples || named < samples * 0.6) bad('while tethered the NOW line names your break in only ' + named + ' of ' + samples + ' moments' + tag + ' (check S9)');
      if (changes > 5) bad('the NOW line changes ' + changes + ' times from the tethers landing to your break' + tag + ' (5 at most; check S9)');
      if (!broke) bad('the NOW line doesn\'t say "Break now" as your break comes' + tag + ' (check S9)');
      if (cdBad || !cdN) bad('the tether countdown: ' + (cdBad || 'never showed') + tag + ' (check S10)');
      if (!cdNow && !(d.G.p2.teth[me] && d.G.p2.teth[me].br != null && d.G.p2.teth[me].br <= tb + 0.3)) bad('no "Break tether now!" alert at your break' + tag + ' (check S10)');
      if (!W.slice(W2).some((w) => /\.pg-cds/.test(w.at) && /Break tether in \d+s/.test(w.v))) bad('the countdown alert isn\'t drawn on the screen (.pg-cds)' + tag + ' (check S10)'); } }
  // S11. the sound cues (Flex, Nov 17: "Would it be a difficult task to improve the sound alerts", "Yes, improve sounds"): a sound for each meaning (your job, now,
  //      dodge, a raid-wide call, tick, go, done right, a mistake); the tether countdown ticks on 3, 2 and 1 and sounds "go" at "Break tether now!"; the NOW line
  //      turning to a dodge sounds the dodge alarm; Loud, Soft and Off on the button and M, every sound (the mechanic sounds too) through the one volume.
  { const SK = ['you', 'now', 'dodge', 'call', 'tick', 'go', 'ok', 'bad'], cue = (/const CUE = \{[\s\S]*?\} \};/.exec(PJ) || [''])[0];
    SK.forEach((k) => { if (!new RegExp('\\b' + k + ': \\(c, t\\) =>').test(cue)) bad('the "' + k + '" cue has no sound of its own (check S11)'); });
    if (!/const SND_VOL = \{ loud: 1, soft: 0\.4, off: 0 \};/.test(PJ) || !/const sndNext = \(\) => sndSet\(sndLvl === 'loud' \? 'soft' : sndLvl === 'soft' \? 'off' : 'loud'\);/.test(PJ) || !/KeyM'\) \{ sndNext\(\); return; \}/.test(PJ) || !/onclick = \(e\) => \{ e\.stopPropagation\(\); sndNext\(\);/.test(PJ)) bad('the sound has no Loud, Soft and Off on its button and M (check S11)');
    if (/g\.connect\(c\.destination\)/.test(PJ) || !/actx\.pgOut\.connect\(actx\.destination\)/.test(PJ)) bad('a sound skips the one volume (check S11)');
    let T2 = null; try { T2 = vm.runInContext('PG_P2_T', ctx); } catch (e) { T2 = null; }
    if (T2) { const d = L.open('m2'); d.P2.pick = { side: 'E', role: 'r', egg: null, mal: 0, cry: 0, teth: 'solo' }; const me = d.P2.slotOf(d.P2.pick); d.at(T2.fangs - 12, me, { seed: 3 }); L.win.__pgSndLog = [];
      while (d.G.t < T2.solo + 1.5) { d.step(2); d.frame(); } const lg = L.win.__pgSndLog; L.win.__pgSndLog = null;
      const ticks = lg.filter((q) => q.k === 'tick' && q.t >= T2.solo - 3.6 && q.t < T2.solo), go = lg.some((q) => q.k === 'go' && q.t >= T2.solo - 0.2 && q.t < T2.solo + 1.5);
      if (ticks.length !== 3 || !go) bad('the tether countdown sounds ' + ticks.length + ' ticks before the break' + (go ? '' : ' and no "go"') + ' (3, 2, 1, then go; check S11)');
      // (each sound once: live, every tick played twice (the tether's bar and its alert both counted) and "go", the "now" call and a dodge alarm stacked within half a second)
      const dup = lg.filter((q, i) => lg.slice(i + 1).some((r) => r.k === q.k && (q.k === 'tick' ? r.t - q.t < 0.45 : q.k === 'go' ? r.t - q.t < 0.95 : false)));
      const pile = lg.filter((q) => (q.k === 'now' || q.k === 'dodge') && lg.some((g0) => g0.k === 'go' && q.t >= g0.t && q.t - g0.t < 0.95));
      if (dup.length || pile.length) bad('the tether break sounds twice or piles up: ' + dup.concat(pile).map((q) => q.k + '@' + q.t.toFixed(1)).join(' ') + ' (check S11)'); }
    { const d = L.open(); d.at(0, d.role.id, { seed: 3 }); L.win.__pgSndLog = []; while (d.G.t < 60) { d.step(2); d.frame(); } const lg = L.win.__pgSndLog; L.win.__pgSndLog = null;
      if (!lg.some((q) => q.k === 'dodge')) bad('the NOW line turned to a dodge in phase 1\'s first minute without the dodge alarm (check S11)'); } }
  // S8. the result screen's list, said simply (Flex, Nov 17: "this screen at the end of the run needs to be simplified a bit and easier to understand", "no dont
  //     just do the top 3", "just make the explanations simplified"): every mistake stays; each line one sentence with no asides in brackets or percentages, its tip
  //     the one thing to do. Run on the rows of Flex's screenshot.
  { let H0 = null, T0 = null; try { H0 = vm.runInContext('pgEndHead', ctx); T0 = vm.runInContext('pgEndTip', ctx); } catch (e) { /* (none) */ }
    if (!H0 || !T0 || !/const rows = G\.log\.map\(\(m\) => \{ const b = pgEndHead\(m\.text\); return \{ t: m\.t, b, s: pgEndTip\(m\.tip, b\) \}; \}\)/.test(PJ)) bad('the result screen lists the mistakes and tips as the game logs them, not said simply (check S8)');
    else { [['Rawlings were up: you were on them 0% of the time.', 'Each broken egg leaves a Rawling: press Tab to pick one, then keep pressing 1 until they die.', 'Rawlings were up: you weren\'t hitting them', 'Kill the Rawlings before they boil'],
      ['Caustic Waves from a small tail hit you.', 'A small tail rising at the edge fires a short fan of three waves 2.4 s later, on the same lines every pull: step out of their red lanes.', 'Caustic Waves from a small tail hit you', 'Step out of the red lanes'],
      ['A wave touched your egg: a Viper hatched (Putrid Membrane on the whole raid).', 'Carrying an egg, a wave hatches it: dodge every one.', 'A wave touched your egg: a Viper hatched', 'With an egg, dodge every wave'],
      ['The Wretch was going down: you were on it 0% of the time.', 'Help kill each Wretch before its third bubble: press Tab to pick it, then keep pressing 1.', 'The Wretch was going down: you weren\'t hitting it', 'Kill each Wretch before its third bubble'],
      ['Clutches were up: you were on them 0% of the time.', 'The Warden\'s Clutches hatch Rawlings: press Tab to pick one, then keep pressing 1.', 'Clutches were up: you weren\'t hitting them', 'Kill the Clutches before they hatch'],
      ['The Doomscales were up: you were on them 0% of the time.', 'Tab picks a Weakened Doomscale: hit them from behind or beside (their frontal goes at the tank), and kill them evenly.', 'The Doomscales were up: you weren\'t hitting them', 'Hit the Doomscales from behind or the side, and kill them evenly'],
      ['No defensive for the last four slams. You pressed Q too early: it was still cooling down.', 'Save Q for the back-to-back slams: it takes a minute and a half to come back.', 'No defensive for the last four slams', 'Save your defensive for the back-to-back slams']].forEach(([h, t, wh, wt]) => {
      const gh = H0(h), gt = T0(t, gh); if (gh !== wh || gt !== wt) bad('the result screen says "' + h + '" / "' + t + '" as "' + gh + '" / "' + gt + '", not "' + wh + '" / "' + wt + '" (check S8)'); });
      // (the tips are for the real fight, not the practice game's keys: Flex, Nov 17, "the tips should be in game tips not the practice game" of "Target them with Tab, then press 1")
      ['press Tab to pick one, then keep pressing 1 until they die.', 'Press Q (defensive) as the slams start.', 'Kick it: press E when the bar starts.', 'Sprint (Shift) to the cauldron.'].forEach((t) => { const g = T0(t, 'x'); if (/\bTab\b|press(?:ing)? 1\b|\bQ\b|\bE\b|\bShift\b/.test(g)) bad('a result-screen tip names a practice key: "' + g + '" (check S8)'); }); } }
}
module.exports = (H, say) => { checks(H, say); lookC(H, say); simpleScreen(H, say); }; module.exports.lookC = lookC; module.exports.lookLoad = lookLoad; module.exports.simpleScreen = simpleScreen;
if (require.main === module) {
  process.chdir(__dirname); let n = 0; const t0 = Date.now(); const pr = (a, b, t) => { n++; console.log('✗ ' + t); }; checks(null, pr); lookC(null, pr); simpleScreen(null, pr);
  console.log(n ? n + ' problem(s)' : 'practice game, shared rules: all checks pass', '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)'); process.exitCode = n ? 1 : 0;
}
