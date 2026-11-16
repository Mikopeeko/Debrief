// Mythic+ pull plan: one meaning of "pulls", and a fragment never counts against the pull plan (the fresh reviewers, Nov 15, on Flex's +19 Kings' Rest of Sep 25,
// report dtMfgnRvDwBLPCKZ fight 2: Pull 7 lasted 0:08 and gave no count, yet the Route score read "You took 3 more pulls than the fast run (11 against 8)" and
// the stretch line "the fast run took this in 4 pulls, you took 6"; the Route stepper read "The Council of Tribes · 13 of 15", the bosses counted as pulls).
// This runs the page's own Route score (mrsModel), stretches (mpStretches) and stepper words (mpStepOf) on that key's pulls and counts, and fails if: the 0:08
// pull with no count counts against the pull plan, the score leaves it out without saying so, the fast run's own fragment is read another way, a key with no
// count table or no fast run loses a pull, the stretch still counts it, or the stepper counts bosses as pulls. contradictions.js runs it on every build.
// Each part fails on the page as it was before the fix.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusPullPlan(say) {
  const bad = (m) => say('Mythic+ Route', 'pull plan', m);
  let s, ui; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js or src/ui.js'); return; }
  const line = (src, n, k) => { const m = src.match(new RegExp('\\n(?:const|function) ' + n + '\\b')); if (!m) throw new Error('src has no ' + n); const L = src.slice(m.index + 1).split('\n'), out = [];
    for (const l of L) { out.push(l); if (k ? out.length >= k : /;\s*(?:\/\*.*\*\/)?\s*$/.test(l)) break; } return '\n' + out.join('\n'); };
  const fn = (n) => { const a = s.indexOf('\nfunction ' + n + '('); if (a < 0) throw new Error('src/mptab.js has no function ' + n); let i = s.indexOf('{', a), d = 0; for (; i < s.length; i++) { const c = s[i]; if (c === '{') d++; else if (c === '}' && --d === 0) break; } return s.slice(a, i + 1); };
  let X; try { X = vm.runInNewContext('const esc = (x) => String(x == null ? "" : x);' + line(ui, 'plural') + line(s, 'mpMM') + line(s, 'mpCap') + line(s, 'mpAnd') + line(s, 'mpNo') + line(s, 'mpPN') + line(s, 'mpPNs') + line(s, 'mpPullName') +
    '\n' + fn('mpClock') + '\n' + fn('mpChains') + line(s, 'mpChainN') + line(s, 'mpDone', 3) + line(s, 'MP_FRAG_S') + line(s, 'mpFrag') + line(s, 'mpPlan') + line(s, 'mpFragSay') + line(s, 'mpFragNote') + line(s, 'mpStepOf') +
    '\n' + fn('mpStretches') + '\n' + fn('mrsModel') + '\n({ mrsModel, mpStretches, mpClock, mpStepOf })'); } catch (e) { bad('the Route score no longer runs by itself (mrsModel, mpStretches, mpFrag, mpStepOf): ' + String(e.message).slice(0, 140)); return; }
  const mk = (L, adds, clock, end) => ({ run: { end, timeMs: clock.time * 1000, clock }, people: [], lust: [], pulls: L.map(([a, b, boss], i) => ({ n: i + 1, s: a, e: b, dur: b - a, boss: boss || '', kill: boss ? true : null, deaths: [] })),
    route: { ok: true, full: 100, total: adds.reduce((x, y) => x + y, 0), pulls: adds.map((add) => ({ add })) } });
  /* (the key's 15 pulls and the count each gave, as Debrief lists them: Pull 7 is 752 to 760.4 s with no count; Pull 11 lasted 1:30 with no count and is a real pull) */
  const KP = [[19.1, 108.8], [108.8, 186.9], [201.3, 399.8, 'The Golden Serpent'], [416.6, 484.4], [490.6, 546.1], [551.5, 619.3], [624.4, 702.8], [752, 760.4], [766.7, 897.4], [898.8, 1081.4, 'Mchimba the Embalmer'], [1093, 1166], [1168.6, 1277.2], [1278.2, 1527.9, 'The Council of Tribes'], [1554.9, 1644.4], [1654.2, 1863.1, 'King Dazar']];
  const KA = [5.3, 22, 5.9, 7.4, 8.2, 5.8, 8.7, 0, 9.9, 2.5, 11.8, 8.4, 6.1, 0, 0];
  const key = () => mk(KP, KA, { par: 1980, time: 1885, up: 1, deathCost: 30, between: 168 }, 1863.1);
  const FP = [[15, 110], [112, 180], [190, 380, 'The Golden Serpent'], [395, 470], [480, 560], [570, 660], [670, 760], [770, 940, 'Mchimba the Embalmer'], [955, 1090], [1110, 1340, 'The Council of Tribes'], [1355, 1440], [1450, 1540, 'King Dazar']];
  const fast = (frag) => { const L = FP.slice(), A = L.map((x) => (x[2] ? 3 : 8.4)); if (frag) { L.splice(4, 0, [471, 478]); A.splice(4, 0, 0); } return mk(L, A, { par: 1980, time: 1550, up: 2, deathCost: 15, between: 140 }, 1545); };
  const plan = (R, F) => X.mrsModel(R, F ? { R: F } : null).parts.find((p) => p.k === 'plan') || {};
  { const p = plan(key(), fast()); if (p.v !== '10 pulls' || p.pts !== 14 || String(p.why).indexOf('(10 against 8)') < 0) bad('the 0:08 pull with no count (Pull 7) still counts against the pull plan: "' + p.v + '", ' + p.pts + ' of 20, "' + p.why + '" (it read "11 against 8")');
    else if (p.why.indexOf('Pull 7 isn’t counted: it lasted 0:08 and gave no count.') < 0) bad('the Route score leaves Pull 7 out without saying so: "' + p.why + '"'); }
  { const p = plan(key(), fast(true)); if (String(p.why).indexOf('(10 against 8)') < 0 || p.why.indexOf('The fast run’s pull 4 isn’t counted') < 0) bad('the fast run’s own short pull with no count is not read the same way as yours: "' + p.why + '"'); }
  { const R2 = key(); R2.route = null; const p = plan(R2, fast()); if (p.v !== '11 pulls') bad('a key with no count table leaves a pull out of its pull plan: "' + p.v + '"'); }
  { const p = plan(key(), null); if (p.v !== '11 pulls') bad('with no fast run to compare, the Pull plan tile no longer counts every pull the page lists: "' + p.v + '"'); }
  { const R = key(), ST = X.mpStretches(R, X.mpClock(R)), F = fast(), FS = X.mpStretches(F, X.mpClock(F)); if (!ST[1] || ST[1].n !== 5 || ST[1].nt !== 5 || !FS[1] || FS[1].n !== 4) bad('the stretch from The Golden Serpent to Mchimba still counts the 0:08 pull (it read "the fast run took this in 4 pulls, you took 6"): ' + (ST[1] || {}).n); }
  { const R = key(), a = 'The Council of Tribes' + X.mpStepOf(R, R.pulls[12]), b = 'Pull 3' + X.mpStepOf(R, R.pulls[3]); if (a !== 'The Council of Tribes · boss 3 of 4' || b !== 'Pull 3 of 11') bad('the Route stepper counts bosses as pulls again: "' + a + '", "' + b + '" (it read "The Council of Tribes · 13 of 15")'); }
  if (s.indexOf("li.dataset.lab + (li.dataset.of || '')") < 0 || s.indexOf('data-of="') < 0 || s.indexOf('esc(mpStepOf(q.RR, q.p))') < 0) bad('the Route stepper no longer says a pull’s place among its own kind');
  if (s.indexOf('const yq = mpPlan(R, yp), fq = mpPlan(F, fp), yN = yq.length, fN = fq.length') < 0 || s.indexOf('mpChainN(R, mpPlan(R, yp))') < 0 || s.split("plural(mpPlan(R, R.pulls).length, 'pull')").length !== 3) bad('a place that sets your pulls against the fast run’s ("Pull bigger", "You pulled N times", "You took N pulls, the fast run took M") no longer reads the pull plan’s pulls');
};
