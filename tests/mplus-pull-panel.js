// Mythic+ Route, the panel beside the map for a picked pull, in tabs (Nov 16, Flex with a picture of the long stack: "I think this whole section could use
// a makeover in the pull by pull(not the replay video)"). This runs the tabs' own code and fails if: the panel is one long stack again, a tab with
// nothing in it shows, a fold inside a tab can be shut, the tab picked stops following you from pull to pull, or a player's row under Players loses
// the hover with their pull. contradictions.js runs it on every build. Each part fails on the page before it.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusPullPanel(say) {
  const bad = (m) => say('Mythic+ Route', 'the pull panel in tabs', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src/mptab.js or src/shell.html'); return; }
  if (s.indexOf("mpxPanes([['play', 'Play by play', mpxFeed(o)], ['ppl', 'Players', ") < 0 || s.indexOf("['foe', 'Enemies', ") < 0 || s.indexOf("['tip', 'Tips', o.plan ?") < 0) bad('the panel beside the map is one long stack again, not Play by play, Players, Enemies and Tips ("this whole section could use a makeover")');
  if (s.indexOf("'<p class=\"mpx-ck\">More about this pull</p>' + open1(") >= 0) bad('"More about this pull" with its folds is back in the pull panel');
  const line = (n) => { const m = s.match(new RegExp('\\nconst ' + n + ' = [^\\n]*')); if (!m) throw new Error('src/mptab.js has no ' + n); return m[0]; };
  let X; try { X = vm.runInNewContext(line('mpxPanes') + line('mpxOpenAll') + '\n({ mpxPanes, mpxOpenAll })'); } catch (e) { bad('the pull panel\'s tabs no longer run by themselves: ' + String(e.message).slice(0, 120)); return; }
  const h = X.mpxPanes([['play', 'Play by play', '<ol><li>0:01</li></ol>'], ['ppl', 'Players', '<div>x</div>'], ['foe', 'Enemies', '<details class="mpt-cfd" data-cf="p"><summary>e</summary></details>'], ['tip', 'Tips', '  ']]);
  const tabs = (h.match(/data-mpxpt="(\w+)"/g) || []).map((x) => x.slice(12, -1)).join(',');
  if (tabs !== 'play,ppl,foe') bad('the tabs for a pull with no tips are "' + tabs + '", not Play by play, Players and Enemies (an empty tab must not show)');
  if ((h.match(/class="mpx-pane"/g) || []).length !== 3) bad('each tab no longer has its own view');
  const o = X.mpxOpenAll('<details class="mpt-cfd" data-cf="d" open data-auto="1"><summary>a</summary></details><details class="mpt-cfd" data-cf="p"><summary>b</summary></details>');
  if ((o.match(/ open>/g) || []).length !== 2 || /data-auto/.test(o)) bad('a fold inside a tab can be shut or starts shut');
  if (s.indexOf("const want = MP.mpxPt || 'play';") < 0 || s.indexOf("MP.mpxPt = t.dataset.mpxpt; mpxPtApply();") < 0 || s.indexOf("sel.classList.toggle('one', !!sm); try { mpxPtApply(); }") < 0) bad('the tab you pick no longer stays as you step through the pulls, or a pull opens on no tab');
  if (s.indexOf("#mptCM .mpx-pane[data-p=\"ppl\"] :is(.gbx-r, .mpt-mkr:not(.mpt-mkh), .mpt-mcf)[data-who]") < 0) bad('a player\'s row under Players no longer has the hover with their pull');
  const k = css.lastIndexOf('/* Mythic+ Route, the panel beside the map for a picked pull (Nov 16'); const b = k < 0 ? '' : css.slice(k);
  if (k < 0 || b.indexOf('#mptCM .mpt-mc > .mpx-pt { position: sticky !important; top: 0 !important;') < 0 || b.indexOf('#mptCM .mpt-mc > .mpx-pane[hidden] { display: none !important; }') < 0) bad('the pull panel\'s tabs no longer stay in view, or a hidden tab\'s view still shows');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ pull panel: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
