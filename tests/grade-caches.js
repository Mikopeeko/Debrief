// A grade's kept answers belong to the pulls they were worked out from (Main's review of the night open speed and grade order work, Nov 15; found while
// pinning down Wolfthorn Thu Nov 12 Ula'tek pull 11, report Gax3AkbyFRXmdrgQ fight 21). Five holes, each checked here with the page's own code from
// src/ui.js and stand-in pulls:
//  1. A Rotation page counted Potions and Big cooldowns over SPC_REPS, whatever the Rotation tab last drew, even when Summary or the Report card was
//     grading one pull: the grade changed with what Rotation showed last (from Nov 12). Now spcNightReps uses SPC_REPS only while the tab draws.
//  2. Big cooldowns kept per "report:pull", and pulls are numbered per boss: two bosses' pull 1 shared one answer. Now each pull is report:boss:difficulty:pull.
//  3. A pull's Power Infusion result was kept per wipe cut only, though it reads the boss's other loaded pulls: the load-order bug, still live for priests.
//  4. Summary's kept grades (up to 36) held their pulls past the memory limit (14 pulls on a phone) and across a new report. Now they go with their pulls.
//  5. Summary's night key had no report, so another night's five scores could stand in. Now the report is in it.
// (The loading card waiting twice for a slow list is checked in tests/night-open-draws.js.) contradictions.js runs this on every build.
'use strict';
module.exports = function gradeCaches(H, say, src) {
  const bad = (m) => say("Wolfthorn Thu Nov 12 Ula'tek pull 11", 'grade caches', m), vm = require('vm'), U = src || H.UI;
  const has = (n) => { try { H.grab(n, src); return true; } catch (e) { return false; } }, code = (names) => names.filter(has).map((n) => H.grab(n, src)).join('\n');
  const rep = (boss, id, pull, code0) => ({ item: { boss, id, diffId: 16, pull, wcl: { code: code0 || 'CODE', fight: id * 100 + pull } }, players: new Map() });
  /* (1) the pulls a Rotation page counts Potions and Big cooldowns over */
  if (/potNight\(SPC_REPS|cdNight\(SPC_REPS/.test(U)) bad('a Rotation page still counts Potions or Big cooldowns over SPC_REPS (whatever the Rotation tab drew last), not the pulls being graded');
  if (!has('spcNightReps')) bad('there is no spcNightReps: a grade reads the pulls the Rotation tab drew last');
  else { const a = rep('A', 1, 11), b = rep('A', 1, 12), c = rep('A', 1, 13), ctx = vm.createContext({ SPC_DRAW: false, SPC_REPS: [b, c] });
    let f = null; try { f = vm.runInContext(H.grab('spcNightReps', src) + '\nspcNightReps', ctx); } catch (e) { bad('spcNightReps would not load: ' + e.message); }
    if (f) { const o = { per: [{ r: a }] }, g1 = f(o); ctx.SPC_DRAW = true; const g2 = f(o);
      if (g1.length !== 1 || g1[0] !== a) bad('grading pull 11 while the Rotation tab last drew pulls 12 and 13, Potions and Big cooldowns count over ' + g1.map((r) => 'pull ' + r.item.pull).join(', '));
      if (g2[0] !== b) bad('while the Rotation tab draws, Potions and Big cooldowns no longer count over the pulls it shows'); } }
  /* (2) Big cooldowns per pull: two bosses' pull 1 in one report */
  { const A1 = rep('A', 1, 1), B1 = rep('B', 2, 1), CACHE = new Map([[A1.item, A1], [B1.item, B1]]);
    const ctx = vm.createContext({ CACHE, CDN_C: new Map(), deathCutN: () => 2, cdUseRows: (reps) => [{ p: { name: 'X' }, used: reps[0].item.boss === 'A' ? 1 : 2, poss: 2, f: 0.5, cds: new Map() }] });
    let P = null; try { P = vm.runInContext(code(['repKey', 'bossLoaded', 'repsLoaded', 'cdNight']) + '\n({ cdNight })', ctx); } catch (e) { bad('cdNight would not load: ' + e.message); }
    if (P) { let x = null, y = null; try { x = P.cdNight([A1], 'X'); y = P.cdNight([B1], 'X'); } catch (e) { bad('cdNight threw: ' + e.message); }
      if (x && y && (x.used !== 1 || y.used !== 2)) bad('Big cooldowns for boss B\'s pull 1 came back as boss A\'s pull 1 (' + y.used + ' of ' + y.poss + '): pulls are numbered per boss, and the kept answer is shared'); } }
  /* (3) Power Infusion per pull, kept per set of loaded pulls */
  if (!has('piKeep')) bad('there is no piKeep: a pull\'s Power Infusion result is kept by wipe cut only, so a priest\'s check keeps the first set of loaded pulls');
  else { const r11 = rep('A', 1, 11), r12 = rep('A', 1, 12), CACHE = new Map([[r11.item, r11]]), ctx = vm.createContext({ CACHE, cutT: () => 100 });
    let P = null; try { P = vm.runInContext(code(['repKey', 'bossLoaded', 'piKeep']) + '\n({ piKeep, bossLoaded })', ctx); } catch (e) { bad('piKeep would not load: ' + e.message); }
    if (P) { r11._pi = { ct: 100, nl: P.bossLoaded('A') }; const k1 = P.piKeep(r11); CACHE.set(r12.item, r12); const k2 = P.piKeep(r11);
      if (!k1) bad('a pull\'s Power Infusion result is never kept'); if (k2) bad('pull 12 loaded, and pull 11\'s Power Infusion result was kept from before it'); }
    if (!/if \(piKeep\(r\)\) return r\._pi;/.test(U) || !/r\._pi = \{ ct: cutT\(r\), nl: bossLoaded\(r\.item\.boss\)/.test(U)) bad('piPull doesn\'t keep its result per set of loaded pulls (piKeep, nl)'); }
  /* (4) Summary's kept grades let go with their pulls: the memory limit, a new report */
  if (!has('sum5Prune')) bad('there is no sum5Prune: Summary\'s kept grades hold their pulls past the memory limit and across a new report');
  else { const A1 = rep('A', 1, 1), B1 = rep('B', 2, 1), B2 = rep('B', 2, 2), CACHE = new Map([[A1.item, A1], [B1.item, B1], [B2.item, B2]]);
    const ctx = vm.createContext({ CACHE, PL_MEMO: [], cacheCap: () => 2, S: { item: B2.item }, deathCutN: () => 2, pickKey325: () => 'all' });
    let P = null; try { P = vm.runInContext(code(['SPC_REPS', 'SUM5_D', 'sum5Prune', 'cacheTrim']) + '\n({ SUM5_D, SUM5_LAST, cacheTrim, sp: () => SPC_REPS, setSp: (v) => { SPC_REPS = v; } })', ctx); } catch (e) { bad('cacheTrim or sum5Prune would not load: ' + e.message); }
    if (P) { const DA = { c: { reps: [A1] }, N: {} }, DB = { c: { reps: [B1] }, N: {} }; P.SUM5_D.set('a', DA); P.SUM5_LAST.set('a', { D: DA }); P.SUM5_D.set('b', DB); P.SUM5_LAST.set('b', { D: DB });
      try { P.cacheTrim(); } catch (e) { bad('cacheTrim threw: ' + e.message); }
      if (CACHE.has(A1.item)) bad('the stand-in memory limit didn\'t let boss A\'s pull go');
      else if (P.SUM5_LAST.has('a') || P.SUM5_D.has('a')) bad('the memory limit let boss A\'s pull go, but Summary still keeps a grade that holds it');
      if (!P.SUM5_LAST.has('b')) bad('Summary\'s grade of a pull still loaded was dropped');
      P.setSp([B1, B2]); CACHE.clear(); const C1 = rep('C', 3, 1, 'OTHER'); CACHE.set(C1.item, C1); try { P.cacheTrim(); } catch (e) { bad('cacheTrim threw: ' + e.message); }
      if (P.SUM5_LAST.size || P.SUM5_D.size) bad('another report opened, and Summary still keeps the last night\'s grades');
      if (P.sp().length) bad('another report opened, and the Rotation tab\'s last pulls (SPC_REPS) are still held'); } }
  /* (5) Summary's keys name the report */
  if (!has('sum5Key0')) bad('there is no sum5Key0: Summary\'s night key has no report, so another night\'s five scores can stand in');
  else { const ctx = vm.createContext({ deathCutN: () => 2, pickKey325: () => 'all' }); let k = null; try { k = vm.runInContext(H.grab('sum5Key0', src) + '\nsum5Key0', ctx); } catch (e) { bad('sum5Key0 would not load: ' + e.message); }
    if (k) { const a = rep('A', 1, 5, 'NOV11'), b = rep('A', 1, 5, 'NOV12');
      if (k(a.item, false) === k(b.item, false)) bad('two nights of the same boss get the same Summary key on All pulls (' + k(a.item, false) + ')');
      if (k(a.item, true) === k(b.item, true)) bad('two nights\' pull 5 of the same boss get the same Summary key'); }
    if (!/sum5Prune\(\); const dk0 = sum5Key0\(it, one\)/.test(U)) bad('sum5Scan doesn\'t use sum5Key0 (and sum5Prune) for its keys'); }
};
