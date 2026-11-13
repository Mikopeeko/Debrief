// Summary's five scores are the Report card's raid numbers (Nov 13, Flex: "I wish there was just a way to make a score for it, and the information be in
// the tooltip"; built from Main's mock and checked on the Nov 11 Coiled Altar night, agt6jMTyZBYvVzAP: Report card 81 · 64 · 93 · 95 · 99).
// Summary's tiles (sum5Tiles) and the Report card's banner and raid tiles (rcbBanner, rcbRaid) all read raidCardNums. This check runs the page's own
// code on a made-up raid of three and fails when the two pages would show different numbers or colours. contradictions.js runs it on every build.
'use strict';
module.exports = function summaryScores(H, say) {
  const bad = (m) => say('the page code', 'summary scores', m), grab = (n) => { try { return H.grab(n); } catch (e) { return ''; } };
  // (the wiring: one function on both pages)
  if (!grab('rcbBanner').includes('raidCardNums(c).night')) bad('the Report card\'s raid grade no longer comes from raidCardNums, so Summary\'s Night score can differ from it');
  if (!grab('rcbRaid').includes('raidCardNums(c)[k]')) bad('the Report card\'s raid tiles no longer come from raidCardNums, so Summary\'s scores can differ from them');
  if (!/async function sum5Load\([\s\S]{0,2000}?raidCardNums\(c\)/.test(H.UI)) bad('Summary\'s scores no longer come from raidCardNums');
  if (!grab('sum5Draw').includes('sum5Tiles(N')) bad('Summary no longer draws its scores with sum5Tiles');
  if (!/Math\.round\(v\)/.test(grab('rcbRing'))) bad('the Report card\'s raid grade ring no longer shows the rounded score');
  // (the numbers: a made-up raid of three; Bo has no checklist grade (his card score stands in), and nobody but Ana and Cy has a Mechanics score)
  const data = [{ p: { name: 'Ana', color: '#fff' }, score: 70 }, { p: { name: 'Bo', color: '#fff' }, score: 66 }, { p: { name: 'Cy', color: '#fff' }, score: 90 }];
  const pct = new Map([[data[0], 83.4], [data[1], null], [data[2], 96.6]]);
  const rows = [{ a: data[0], perf: 64.4, mech: 93.5, alive: 95.5, prep: 99.2 }, { a: data[1], perf: 71, mech: null, alive: 88.4, prep: 100 }, { a: data[2], perf: 55.5, mech: 90, alive: 100, prep: 97 }];
  const F = { rm: 90.2 }, B = { rows, rk: {}, rkRole: {} };
  let X; try {
    X = H.site(['GRADES', 'letterOf', 'raidBlend', 'RCB_SUBJ', 'rcbQ', 'raidCardNums', 'rcbRaid', 'SUM5', 'sum5Tiles'], { rcnFacts: () => F, rcbFacts: () => B, rqcOf: (c, F0, a) => ({ pct: pct.get(a) }),
      gradeChip: (L) => '<i class="gc">' + L + '</i>', rcbIc: () => '', whIcon: () => '', capS: (s) => s, rcbI: () => '', esc: (s) => String(s) });
  } catch (e) { bad('could not read the score code out of ui.js: ' + e.message); return; }
  const c = { data, reps: [] }, N = X.raidCardNums(c), card = X.rcbRaid(c, F), sum = X.sum5Tiles(N, null);
  const cardV = {}, sumV = {};
  for (const m of card.matchAll(/<span>([^<]+)<\/span><i class="gc">(\w)<\/i><\/div><b class="[^"]*">(\d+)<\/b>/g)) cardV[m[1]] = { v: +m[3], g: m[2] };
  for (const m of sum.matchAll(/<span class="sc5-k">([^<]+)<\/span><b class="sc5-v"(?: data-g="(\w)")?>([^<]+)<\/b>/g)) sumV[m[1]] = { v: +m[3], g: m[2] };
  for (const l of ['Performance', 'Mechanics', 'Staying alive', 'Ready to raid']) {
    const a = cardV[l], b = sumV[l];
    if (!a || !b) { bad(l + ': ' + (!a ? 'the Report card' : 'Summary') + ' shows no score'); continue; }
    if (a.v !== b.v) bad(l + ': Summary shows ' + b.v + ' where the Report card shows ' + a.v);
    if (a.g !== b.g) bad(l + ': Summary colours it as ' + b.g + ' where the Report card says ' + a.g); }
  // (the raid grade: half the raiders' grades (a checklist grade, else the card score), half the raid's mechanics score)
  const want = Math.round(0.5 * ((83.4 + 66 + 96.6) / 3) + 0.5 * 90.2);
  if (!sumV['Night score'] || sumV['Night score'].v !== want) bad('Night score: Summary shows ' + (sumV['Night score'] ? sumV['Night score'].v : 'nothing') + ' where the Report card\'s raid grade is ' + want);
  if (sumV.Mechanics && sumV.Mechanics.v !== 92) bad('Mechanics: a raider with no Mechanics score should be left out of the average (92), not counted as 0');
  // (the hovers (Nov 13, Flex: "can we make the tooltips from these look nicer", after "display only"): every number and word the old tiles had stays in a
  // hover, each hover's big number is its tile's in the same colour, and Ready to raid counts who met each one)
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  let Y; try {
    Y = H.site(['GRADES', 'letterOf', 'sc5Hd', 'sc5Rw', 'sum5Tips'], { esc, plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's'),
      RQC_WEIGHTS: [['perf', 40, 0, 'Performance'], ['mech', 30, 0, 'Mechanics'], ['alive', 20, 0, 'Staying alive'], ['prep', 10, 0, 'Ready to raid']],
      rqcOf: () => ({ rows: { prep: [{ l: 'Flask', s: 'ok' }, { l: 'Food', s: 'bad' }, { l: 'Gems', s: 'na' }] } }) });
  } catch (e) { bad('could not read the hover code out of ui.js: ' + e.message); return; }
  const O = { pulls: { v: '203', s: 'Kill ≈ pull 220', c: '' }, 'raid dps': { v: '3.68M rDPS', s: '7% ahead of guilds like us', c: 'g' }, 'boss damage': { v: '3.53M DPS', s: '74% ahead of guilds like us', c: 'g' },
    hps: { v: '2.04M HPS', s: '5% less healing than guilds like us', c: '' }, 'combat potions': { v: '34 of 38', s: '4 missed', c: 'b' }, dtps: { v: '1.50M DTPS', s: '14% less taken than guilds like us', c: 'g' },
    'avoidable damage': { v: '28.61M', s: '15% less taken than guilds like us', c: 'g' }, deaths: { v: '1', s: 'none their fault', c: '' }, healthstones: { v: 'None missed', s: 'pressed every time it was needed', c: '' },
    defensives: { v: '', s: '4 raiders press too few', c: 'b' } };
  const TN = { night: 79, perf: 73, mech: 93, alive: 99, prep: 55 }, TT = Y.sum5Tips({ N: { ...TN, n: 20, F: {} }, c: { data: [{}], reps: [1] } }, O, true, false), all = Object.values(TT).join('');
  for (const [k, o] of Object.entries(O)) for (const w of [o.v, o.s]) if (w && !all.includes(esc(w))) bad('the hovers lost "' + w + '" (' + k + '); every number the old tiles had stays in a hover');
  for (const [k, v] of Object.entries(TN)) if (!(TT[k] || '').includes('<b data-g="' + Y.letterOf(v) + '">' + v + '</b>')) bad('the ' + k + ' hover does not show its tile\'s ' + v + ' in its colour');
  if (!/<span>Flask<\/span><b class="g">1 of 1<\/b>/.test(TT.prep) || !/<span>Food<\/span><b class="b">0 of 1<\/b>/.test(TT.prep) || /Gems/.test(TT.prep)) bad('the Ready to raid hover no longer counts who met each one (green when all did, amber when not, skipped when it does not apply)');
  if (!/<span>Defensives<\/span><b class="b">4 raiders press too few<\/b>/.test(TT.alive)) bad('a line with only words (Defensives) lost its words or its colour in the hover');
};
