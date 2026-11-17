// Mythic+ page, the four things holding it back (Nov 17, Flex: "do these as well", of my list after rating the tab 7.5/10; and of Graphs' chart: "the
// charts in graphs look like they were made in 1985, not smooth and modern looking"). It fails if:
// 1. "Big cooldowns not pressed" can name the healer again (it named his healer on pulls 5 and 11, where he pressed Avenging Wrath; Rotation already says a
//    healer's cooldowns go out when the group needs them);
// 2. the page stops saying once what "fast run", "spec" and "top" mean;
// 3. a grade letter's colour stops following good and bad (S gold, A green, B teal, C amber, D orange, F red);
// 4. Graphs' chart goes back to its old look (and, of the first try: "Do you see how the chart lines are jagged and not smooth? Can you smooth them out"): jagged, flat steps at every point, solid fills, dashed markers, boss names on the baseline, small axis text.
// contradictions.js runs it on every build. Each part fails on fd869c63.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function mplusFourNov17(say) {
  const bad = (m) => say('Mythic+ page', 'the four things, Nov 17', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src: ' + e.message); return; }
  const has = (t, why) => { if (s.indexOf(t) < 0) bad(why); };
  has("&& (((RR.people || []).find((p) => p.name === nm) || {}).role || 'dps') !== 'healer');", '1. "Big cooldowns not pressed" can name the healer again');
  has("const mpxHow = (F) => (F ? '<p class=\"mpx-how\"><b>How we compare</b><span><em>Fast run</em> the middle of the 20 fastest keys", '2. the page no longer says what "fast run", "spec" and "top" mean');
  has("ticks.join('') + '</div></div>' + (typeof mpxHow === 'function' ? mpxHow(F) : '') + '</section>'; }", '2. "How we compare" is no longer at the foot of the run');
  if (css.indexOf('--gS: #e6b450; --gA: #45c15c; --gB: #3fc7b4; --gC: #e8a23a; --gD: #f0803c; --gF: #ef6b63;') < 0) bad('3. a grade letter\'s colour no longer follows good and bad (a green C read as good, an orange S as trouble)');
  has('for (let j = -12; j <= 12; j++) { const q = i + j; if (q < 0 || q >= N) continue; const wt = Math.exp(-(j * j) / 40);', '4. Graphs\' chart is jagged again (smoothing)');
  has(`stop-opacity=".62"/><stop offset="1" stop-color="' + l.c + '" stop-opacity=".1"/>`, '4. Graphs\' layers are solid blocks again (no fade)');
  has(`y="' + (T0 - 10) + '" font-size="12" font-weight="600" fill="#e6c27a">`, '4. boss names sit on the chart\'s baseline again (not in the strip above it)');
  if (/function mpgChart[\s\S]{0,9000}stroke-dasharray="3 3"/.test(s)) bad('4. Graphs\' markers are dashed lines again');
  if (/function mpgChart[\s\S]{0,9000}font-size="10\.5"/.test(s)) bad('4. Graphs\' axis or labels are under 12 px again');
  has('m[i] = dl[i - 1] * dl[i] <= 0 ? 0 : (dl[i - 1] + dl[i]) / 2;', '4. the Graphs lines are drawn with a flat step at every point again (jagged; Flex: "Can you smooth them out")');
  has('kp = (_, i) => i % 3 === 0 || i === N - 1', '4. the Graphs lines use every other point again (more wiggles)');
  if (css.indexOf('.mpx-how') < 0) bad('2. "How we compare" has no look');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ four things, Nov 17: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
