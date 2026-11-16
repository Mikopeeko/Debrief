// The practice game's shared egg, area attack and Viper rules (src/practice.js), played in Node, for every part that uses them. Flex, Nov 15:
//  A. "the eggs should be attackable", "The eggs have to be damaged to break the shield in order to get picked up": your egg lands with a Hardened shell
//     (5 health, the raid chips 0.4 a second); walking over it does nothing until your hits break it; with the autopilot hitting it opens in about 3.6 s.
//  B. "the player should get an AOE ability" with "a short cooldown": 2 hits everything within 8 yards of your target, then cools down 8 s.
//  C. "if a viper hatches the tank should taunt it and then the group kills it": the off tank taunts it 2 s after it hatches, it stops stinging you, it
//     crawls to the tank and the raid kills it there.
// Run: node tests/practice-shared.js
'use strict';
const path = require('path');
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
}
module.exports = checks;
if (require.main === module) {
  process.chdir(__dirname); let n = 0; const t0 = Date.now(); checks(null, (a, b, t) => { n++; console.log('✗ ' + t); });
  console.log(n ? n + ' problem(s)' : 'practice game, shared rules: all checks pass', '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)'); process.exitCode = n ? 1 : 0;
}
