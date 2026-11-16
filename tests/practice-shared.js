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
  let dbg, dbg3; try { dbg = load(H).dbg; dbg3 = load(H, 'm3').dbg; } catch (e) { bad('the game didn\'t load: ' + e.message + ' (check A)'); return; }
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
}
module.exports = checks;
if (require.main === module) {
  process.chdir(__dirname); let n = 0; const t0 = Date.now(); checks(null, (a, b, t) => { n++; console.log('✗ ' + t); });
  console.log(n ? n + ' problem(s)' : 'practice game, shared rules: all checks pass', '(' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)'); process.exitCode = n ? 1 : 0;
}
