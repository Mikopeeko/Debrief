// Mythic+ Summary: Where your time went merged into the run (Nov 16, Flex of its panel: "how can we reformat this to fit the page? It feels a little lost",
// then "or could we simplify it and merge it into the timeline?"). This runs mpxLossHtml on a made-up key and fails if:
// - a stretch that lost time stops being a bracket at its pulls' place on the run, with the time it lost;
// - the brackets stop being coloured by size (red a minute or more, amber 20 s, grey less);
// - a bracket's hover stops giving why and its Next time (without the row's ⓘ), or a click stops showing it on the map;
// - a row with no pulls (standing) or a deaths row gets a bracket (the deaths have their own marks; its bracket sat on top of the 1:30 one).
// It also fails if the page stops merging the panel: the list kept for the brackets, the painter run before the grade and one thing (on the page's open and
// on The key's redraw), the grade and one thing going into The key's foot, a link to the panel going there, the panel hidden only when merged, or the
// foot's look. contradictions.js runs it on every build. Each part fails on 0ccd42e7.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusRunWhy(say) {
  const bad = (m) => say('Mythic+ Summary', 'where the time went, on the run', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src: ' + e.message); return; }
  if (s.indexOf('\nfunction mpxLossHtml(') < 0) { bad('Where your time went is not on the run (Flex, Nov 16: "or could we simplify it and merge it into the timeline?")'); return; }
  const fn = (n) => { const a = s.indexOf('\nfunction ' + n + '('); let i = s.indexOf('{', a), d = 0; for (; i < s.length; i++) { const c = s[i]; if (c === '{') d++; else if (c === '}' && --d === 0) break; } return s.slice(a, i + 1); };
  let LH; try { LH = vm.runInNewContext('const esc = (x) => String(x).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), mpMM = (v) => Math.floor(v / 60) + ":" + String(Math.round(v % 60)).padStart(2, "0"), mpT1 = (h) => " data-tt=\\"" + esc(h) + "\\"", mpPNs = (R, a) => "pulls " + a.join(", ");\n' + fn('mpxLossHtml') + '\n({ mpxLossHtml })', {}).mpxLossHtml; }
  catch (e) { bad('the run\'s brackets no longer read by themselves: ' + String(e.message).slice(0, 140)); return; }
  const L = [{ c: 'trash', ps: [2, 3], s: 90, t: 'Trash between A and B', d: 'You took 2 pulls there.', nt: '<p class="mpt-nt"><b>Next time</b> More damage here: <b class="mpt-nm" style="color:#C69B6D">Rage</b> was furthest behind. <span class="ds-i mpt-i" tabindex="0" data-tt="&lt;b&gt;x&lt;/b&gt;">ⓘ</span></p>' },
    { c: 'boss', ps: [5], s: 40, t: 'King Dazar', d: 'Your fight took 3:29, theirs 2:49.' }, { c: 'boss', ps: [1], s: 16, t: 'Golden Serpent', d: '' }, { c: 'stand', s: 30, t: 'Standing between pulls', d: 'x' }, { c: 'death', ps: [3], s: 15, t: '2 deaths', d: 'y' }];
  const BX = { 1: [10, 20], 2: [25, 30], 3: [31, 40], 5: [80, 90] };
  let h = ''; try { h = LH({}, L, (k) => BX[k] || null); } catch (e) { bad('the run\'s brackets crashed on a made-up key: ' + String(e.message).slice(0, 140)); return; }
  const B = h.split('<button ').slice(1);
  if (B.length !== 3) bad('the run has ' + B.length + ' brackets for 3 stretches with pulls (standing has none; deaths have their own marks on the run, Nov 16: a deaths bracket sat on top of the 1:30 one)');
  else {
    if (B[0].indexOf('class="mpgl-l mpgl-lx-n" style="left:25.00%;width:15.00%"') < 0 || B[0].indexOf('<span>+1:30</span>') < 0) bad('a stretch that lost 1:30 is not a red bracket over its pulls with "+1:30": ' + B[0].slice(0, 120));
    if (B[1].indexOf('mpgl-lx-s') < 0 || B[2].indexOf('mpgl-lx-q') < 0) bad('the brackets are not coloured by size (amber from 20 s, grey under)');
    if (B[0].indexOf('data-mpps="2,3"') < 0 || B[0].indexOf('data-mpl="pulls 3, 4"') < 0) bad('a bracket no longer shows its stretch on the map when clicked');
    const tt = (/data-tt="([^"]*)"/.exec(B[0]) || [])[1] || '';
    if (tt.indexOf('Next time') < 0 || tt.indexOf('More damage here') < 0 || tt.indexOf('ds-i') >= 0 || tt.indexOf('1:30 behind the fast run') < 0) bad('a bracket\'s hover no longer says why and its Next time (without the row\'s ⓘ)');
  }
  // the page's wiring
  if (s.indexOf('slice(0, 6); })(); R._went = went;') < 0) bad('the stretches that lost time are no longer kept for the run\'s brackets');
  if (s.indexOf('mpxRowOn(); mpxWhyPaint(); mpxTwPaint();') < 0 || s.indexOf('requestAnimationFrame(() => { try { mpxWhyPaint(); mpxTwPaint(); }') < 0) bad('the merge no longer runs before the grade and the one thing, on the page\'s open and when The key is redrawn');
  if (s.indexOf("sec = document.querySelector('#mptCD .mpsb > .mpx-why') || (cc && cc.querySelector('section.mpt-fx'));") < 0) bad('the grade and the one thing no longer go to The key\'s foot when the panel is merged');
  if (s.indexOf("c = c0 && c0.classList.contains('mpx-merged') ? document.querySelector('#mptCD .mpx-why') || c0 : c0;") < 0) bad('a link to Where your time went no longer goes to The key\'s foot when the panel is merged');
  if (s.indexOf("on = !!(bar && (R._went || []).length); if (cc) cc.classList.toggle('mpx-merged', on);") < 0) bad('the panel is merged when it is not "Where your X went" ("What gets you +N" stays its own panel)');
  for (const [sel, why] of [['#mptBody#mptBody#mptBody#mptBody#mptBody#mptBody#mptBody > #mptCC.mpx-merged { display: none !important; }', 'the merged panel still shows under The key'], ['#mptCD .mpgl-lb > .mpgl-l.mpgl-lx-n { color: #ff8f87 !important; }', 'a bracket of a minute or more is not red'], ['#mptCD .mpx-why .mpx-twme {', 'the one thing has no look in The key\'s foot'], ['#mptCD .mpx-why .mpx-twg {', 'the grade has no look in The key\'s foot']]) if (css.indexOf(sel) < 0) bad(why);
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ where the time went, on the run: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
