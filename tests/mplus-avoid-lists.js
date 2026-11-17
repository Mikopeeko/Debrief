// Mythic+ avoidable hits, measured (Nov 16, Flex: "Yes, fix it next", after the fresh-eyes review found every Kings' Rest player at "0 avoidable": the
// dungeon's list had one spell). It fails if:
// - a dungeon loses a dodge measured on Nov 16 (the 4 fastest +18s of each dungeon) or its free hits (the most 9 in 10 of those top players took);
// - a spell whose casts hit every non-tank at once (Gilded Destruction) is counted as avoidable;
// - a hit top players also take a few of stops being judged as a big hit (only a pure dodge skips that), or the free hits' damage counts as avoidable damage;
// - the key stops naming its tracked dodges, or the page stops using them (the Avoidable column's hover, "–" when a dungeon isn't tracked, a green tick in
//   Know this dungeon when nobody took more than top players do).
// contradictions.js runs it on every build. Each part fails on 88cdfb4e.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function mplusAvoidLists(say) {
  const bad = (m) => say('Mythic+ page', 'avoidable hits, measured', m);
  let r, s; try { r = fs.readFileSync(path.join(__dirname, '..', 'companion', 'mplus.js'), 'utf8'); s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read the key reader or the tab: ' + e.message); return; }
  const a = r.indexOf('const LISTS = {'), z = a < 0 ? -1 : r.indexOf('\n};', a); if (a < 0 || z < 0) { bad('the key reader has no LISTS'); return; }
  let L; try { L = new Function('return ' + r.slice(a + 'const LISTS = '.length, z + 2))(); } catch (e) { bad('the key reader\'s LISTS no longer read by themselves: ' + e.message); return; }
  const want = { "kings' rest": [['Suppression Slam', 0], ['Spit Gold', 5], ['Burn Corruption', 2], ['Quaking Leap', 4]], 'murder row': [['Legion Strike', 0], ['Fire Bomb', 3]], 'voidscar arena': [['Void Cascade', 0], ['Unstable Singularity', 0]],
    'altar of fangs': [['Regurgitate', 0], ['Axegrinder', 0], ['Septic Spatter', 3]], 'the blinding vale': [['Lightmaw Beams', 2], ['Lightsower Dash', 1], ['Belch Spores', 1], ["Lightwarden's Blight", 1], ['Fan of Thorns', 0]], 'ruby life pools': [['Molten Boulder', 0], ['Roaring Firebreath', 0]] };
  for (const [d, list] of Object.entries(want)) { const x = L[d]; if (!x) { bad(d + ' has no list'); continue; }
    for (const [sp, fr] of list) { if (!(x.dodge || []).includes(sp)) bad(d + ': ' + sp + ' is no longer counted as avoidable (measured Nov 16)'); if (((x.free || {})[sp] || 0) !== fr) bad(d + ': ' + sp + '\'s free hits are ' + ((x.free || {})[sp] || 0) + ', not ' + fr + ' (the most 9 in 10 top players took, Nov 16)'); } }
  for (const [d, sp] of [["kings' rest", 'Gilded Destruction'], ['voidscar arena', 'Poison Splash'], ['voidscar arena', 'Dark Bloom'], ['ruby life pools', 'Hailburst']]) if (((L[d] || {}).dodge || []).includes(sp)) bad(d + ': ' + sp + ' is counted as avoidable, but its casts hit every non-tank at once in the fast runs (it can\'t be dodged)');
  if (r.indexOf("if (LIST && LIST.dodge.has(lc(x[4])) && !(LIST.free.get(lc(x[4])) > 0)) continue;") < 0) bad('a hit top players also take a few of (Quaking Leap) is skipped as a big hit, as if it were a pure dodge');
  if (r.indexOf("if (!(lastHit.get(k) > x[0] - 1.6)) { cntHit.set(k, counts(x)); if (cntHit.get(k)) { a.n++;") < 0 || r.indexOf('if (cntHit.get(k)) a.dmg += x[3]; }') < 0) bad('avoidable damage adds the free hits too (found on the test copy, Nov 16: one counted Burn Corruption showed the damage of all three, 746k)');
  if (r.indexOf("dodge: ((LISTS[lc(run.dungeon || '')] || {}).dodge || []).concat((LISTS[lc(run.dungeon || '')] || {}).pool || []) };") < 0) bad('the key no longer names its tracked dodges');
  if (s.indexOf("['Avoidable', (R.dodge || []).length ? 'Hits top players dodge: ' + mpAnd(R.dodge.map((s) => esc(s)))") < 0) bad('the Avoidable column\'s hover no longer says which hits it counts');
  if (s.indexOf("R.dodge && !R.dodge.length ? '<span class=\"mpbn-n mpbn-z\" tabindex=\"0\"' + mpT1('Not tracked for this dungeon yet.')") < 0) bad('a dungeon with no dodge list shows a clean 0 in Avoidable, not "–"');
  if (s.indexOf("if (!st && DG.has(k)) { st = 'y'; r.push('no more hits than top players take'); }") < 0) bad('Know this dungeon no longer ticks a tracked dodge nobody took past top players');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ avoidable hits, measured: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
