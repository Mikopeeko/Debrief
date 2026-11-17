// Raid review, the three mock-ups Flex picked (Nov 17, Flex: "Build my mock picks", after the Raid review deep dive). It fails if:
// 1. scores (option B, one slim strip): Summary's numbers lose the solid letter after them, a score number and its letter stop sharing one colour
//    (the deep dive's top find: an amber C over a green 80, a green A over a purple 94), the raid grade goes back to the one outlined ring, or the S
//    gold goes back to the gold that read like the amber C;
// 2. checklist (option C, only what needs work is open): the four boxes come back over the lists, Fix first can point at a check that passed (it
//    said "Fix first: Rotation 90" next to "Goal: 80 or more"), passed checks stop folding into one "Also passed" line, a list header stops
//    showing its own score, the lines stop being plain sentences, or the card's grade cut-offs drift from GRADES;
// 3. Graphs (option B, slim top, chart kept): the banner stops folding into the thin strip on Graphs, or the chart grows back to 230 px (only 6
//    of 20 raiders showed on the first screen; now 18).
// contradictions.js runs it on every build. Each part fails on 1a0674af.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function raidReviewPicks(say) {
  const bad = (m) => say('Raid review', 'the mock picks, Nov 17', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src: ' + e.message); return; }
  const has = (t, why, src) => { if ((src || s).indexOf(t) < 0) bad(why); };
  // 1. scores
  has(`'</b>' + (v != null ? '<span class="grade sm g-' + letterOf(v) + ' sc5-gl">' + letterOf(v) + '</span>' : '')`, '1. Summary\'s scores lost the solid letter after each number');
  const ring = (s.match(/const rcbRing = [^\n]*/) || [''])[0];
  if (!/rcb-gt/.test(ring) || !/gradeChip\(L, true\)/.test(ring) || /<svg/.test(ring)) bad('1. the raid grade is an outlined ring again, not the solid tile every other grade is');
  if (css.indexOf('--gS: #ffd84a;') < 0) bad('1. the S gold is the old one again, which read like the amber C');
  for (const L of 'SABCDF') { const re = new RegExp('html body #view#view \\.sc5-v\\[data-g="' + L + '"\\][^{]*\\.rcb-tr \\.rcb-v\\[data-g="' + L + '"\\][^{]*\\{ color: var\\(--g' + L + '\\) !important; \\}'); if (!re.test(css)) bad('1. a ' + L + ' score number no longer takes its letter\'s colour on Summary and the Report card (an amber C over a green 80)'); }
  // 2. checklist
  has('function rvcCard()', '2. the checklist no longer folds to what needs work');
  has(".rqc-under.rvc .r437-tiles, ", '2. the four boxes are back over the lists (they said the same as the list headers)', css);
  has("pick = misses.find((x) => x.fix) || misses.slice().sort((a, b) => a.pc - b.pc)[0]", '2. Fix first can point at a check that passed again ("Fix first: Rotation 90", goal 80)');
  has("if (k === 'miss' && !/bonus/i.test(", '2. Fix first can pick a check that did not miss');
  has("'<b class=\"rvc-k\">Also passed:</b> '", '2. passed checks no longer fold into one Also passed line');
  has("<b class=\"rvc-sc\" data-g=\"' + L + '\">' + sk + '<small> out of 100</small></b>", '2. a list header no longer shows its own score');
  const G0 = (s.match(/const GRADES = (\[[^\n;]*\]);/) || [])[1], G1 = (s.match(/const RVC_G = (\[[^\n]*?\]\]),/) || [])[1];
  if (!G0 || !G1 || G0.replace(/\s/g, '') !== G1.replace(/\s/g, '')) bad('2. the checklist\'s grade cut-offs (RVC_G) no longer match GRADES');
  let SAY; try { SAY = new Function('return ' + (s.match(/const RVC_SAY = (\(sec, nm, val\) => \{[\s\S]*?default: return ''; \} \});/) || [])[1])(); } catch (e) { SAY = null; }
  if (!SAY) bad('2. the checklist\'s sentences could not be read'); else {
    const want = [['Ready to raid', 'Flask', '32 of 35', 'You missed your flask in 3 pulls. Use one every pull.'], ['Ready to raid', 'Food', '34 of 35', 'You missed food in 1 pull. Eat before every pull.'],
      ['Performance', 'Combat potion', '20 of 22 chances', 'You missed 2 chances to drink one. Drink one each time it\'s ready.'], ['Staying alive', 'Close calls answered', '33 of 34 pulls, every close call answered', 'You pressed something every time you sat low in 33 of 34 pulls.']];
    for (const [sec, nm, val, w] of want) { const got = SAY(sec, nm, val); if (got !== w) bad('2. ' + nm + ' "' + val + '" reads "' + got + '", not the plain sentence "' + w + '"'); } }
  // 3. Graphs
  has("const rvgOn = () => { const on = !!document.querySelector('.tabbar .tab.on[data-t=\"perf\"]')", '3. Graphs no longer folds the banner into the thin strip');
  has('html body.rvg.snv-on #bossHead header.fight { display: none !important; }', '3. the boss banner shows on Graphs again (6 of 20 raiders on the first screen)', css);
  has('H = narrow ? 210 : wpx ? 160 : 150,', '3. Graphs\' chart is 230 px tall again');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Raid review mock picks, Nov 17: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
