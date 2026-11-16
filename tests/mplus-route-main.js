// Mythic+, Route is the key page's main page (Nov 16, Flex: "i feel like the route tab should just be the main page, and the debrief tab gets deleted",
// "the pull by pull is already built in the [route] tab when you click on each pull", "Maybe the section above the rotation/replay could be the summary
// for what you have selected. Either all pulls, or the single pull", "I think the key feature of the mythic+ section is absolutely the route section";
// and of the replay: "remove the movement lines they provide nothing useful", "have the map zoomed in on the group during the replay").
// This fails if: the tabs are not Route | Players | Graphs with Route first, an old Debrief or mistakes link stops opening Route, the pull-by-pull table
// comes back on the website, Route opens on a pull instead of the whole key, the top of Route stops following the pick (the whole key's summary or the
// picked pull's summary), the stepper loses its Whole key stop or the Whole key button, the pull card's summary part stops being one box (the top shows
// it, the panel beside the map hides it), every mistake leaves the panel beside the map, or the replay draws the line walked again or zooms back out.
// contradictions.js runs it on every build. Each part fails on 84f3d043.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusRouteMain(say) {
  const bad = (m) => say('Mythic+ Route', 'Route is the main page', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src/mptab.js or src/shell.html'); return; }
  const one = (n) => { const m = s.match(new RegExp('\\nconst ' + n + ' = [^\\n]*?;')); if (!m) throw new Error('src/mptab.js has no ' + n); return m[0].trim(); };
  let T; try { T = vm.runInNewContext([one('MPX_VIEWS'), one('MPX_OLD'), s.match(/\nconst MPX_TABS = [^\n]*?;/)[0]].join('\n') + '\n({ MPX_VIEWS, MPX_OLD, MPX_TABS })'); } catch (e) { bad('the key\'s tab lists no longer read by themselves: ' + String(e.message).slice(0, 140)); return; }
  // 1. the tabs
  if (T.MPX_TABS.map((x) => x[1]).join(' | ') !== 'Route | Players | Graphs') bad('the tab row is "' + T.MPX_TABS.map((x) => x[1]).join(' | ') + '", not Route | Players | Graphs');
  if ((T.MPX_VIEWS[0] || [])[0] !== 'map' || T.MPX_VIEWS.some(([v]) => v === 'deb')) bad('Route is not the first view, or Debrief is a view again');
  for (const v of ['deb', 'mis', 'run']) if (T.MPX_OLD[v] !== 'map') bad('an old link with &mpv=' + v + ' no longer opens Route');
  if (s.indexOf("mpxView(MP.cv || 'map'); }") < 0) bad('the key no longer opens on Route');
  // 2. the whole key's summary, no pull-by-pull table on the website
  { const i = s.indexOf('\nfunction mpxDeb(R, fx) {'), j = s.indexOf('\nconst mpxDebPaint', i); const body = i < 0 ? '' : s.slice(i, j);
    if (!body || /mpxPbp\(/.test(body.replace(/\/\*[\s\S]*?\*\//g, ''))) bad('the key pull by pull is back on the website (picking a pull on Route tells each pull)');
    if (body.indexOf("id=\"mptCD\">' + gl + top + '</div>' : ''") < 0) bad('the whole key\'s summary (The key, in short and Next key) is no longer one box for the top of Route'); }
  // 3. Route opens on the whole key; the top follows the pick
  if (s.indexOf('function mpMapAutoGo(now, quiet) { if (!MPC_ON) return false;') < 0) bad('the website picks a pull by itself again, so Route opens on a pull, not the whole key');
  for (const f of ['function mpMapWhole() {', 'function mpxSelPaint() { if (MPC_ON) return;', "mpZoomTo(box, 1, null); if (!MPC_ON) mpxSelPaint(); }", "try { mpxBh(); mpxBhFold(); mpxSelPaint(); mpxAllMove();"]) if (s.indexOf(f) < 0) bad('the top of Route no longer follows the pick (missing: ' + f.slice(0, 60) + ')');
  if (s.indexOf("sel.classList.toggle('one', !!sm);") < 0 || s.indexOf("cm.classList.toggle('mpx-one', !!sm);") < 0) bad('the top of Route no longer switches between the whole key and the picked pull');
  // 4. the stepper's Whole key stop and button
  if (s.indexOf("if (!MPC_ON && !sli && p >= 0 && (k < 0 || k >= n)) { mpMapWhole(); return; }") < 0) bad('stepping past the first or the last pull no longer goes back to the whole key');
  if (s.indexOf('data-mwhole="1" aria-pressed="true">Whole key</button>') < 0 || s.indexOf("(MPC_ON ? 'Pick a pull' : 'Whole key')") < 0) bad('the map\'s bar has no Whole key button, or the stepper does not say Whole key');
  // 5. the pull card's summary part is one box: the top shows it, the panel beside the map hides it
  if (s.indexOf("return '<div class=\"mpx-sum\"><div class=\"mpt-mch mpx-ch\">'") < 0 || s.indexOf("'</ul>' : '') + '</div>' + /* (Nov 16: the end of the summary part") < 0) bad('the pull card\'s summary part is not one box any more');
  const blk = css.slice(css.indexOf('/* Mythic+, Route is the main page (Nov 16'));
  if (css.indexOf('/* Mythic+, Route is the main page (Nov 16') < 0) { bad('the look of Route as the main page is gone from src/shell.html'); return; }
  for (const r of ['#mptCM .mpt-mside .mpx-sum { display: none !important; }', '#mpxSel.one > #mptCD', '#mpxSel:not(.one) > .mpx-selp { display: none !important; }', '#mptCM.mpx-one > .mrs', '[data-mpv="map"] body #view#view#view #mptBody#mptBody#mptBody#mptBody#mptBody > :is(#mpxSel, #mptCD, #mptCA) { display: block !important; }']) if (blk.indexOf(r) < 0) bad('a rule of the top of Route is gone: ' + r.slice(0, 70));
  if (css.lastIndexOf('/* Mythic+, Route is the main page (Nov 16') < css.lastIndexOf('<style')) bad('the look of Route as the main page is not in the page\'s last style');
  // 6. every mistake beside the map with the whole key picked
  if (s.indexOf("const sc = document.querySelector('#mptCM .mpt-mdtv[data-v=\"you\"] .mpt-mcard'); if (sc) { if (ca.parentNode !== sc) sc.appendChild(ca); }") < 0) bad('every mistake is no longer in the panel beside the map with the whole key picked');
  // 6b. its rows read right there: the phone's layout at every width (Flex, Nov 16, with a picture of the Deaths list one word a line: "formatting bugs")
  { const k = css.lastIndexOf('/* Mythic+, every mistake in the narrow panel beside Route\'s map (Nov 16'), b2 = k < 0 ? '' : css.slice(k);
    if (k < 0 || b2.indexOf('#mptCM .mpt-mcard #mptCA :is(.mpx-r:not(.mpx-rd), .mpx-rd > summary, .mpx-sp .mpx-r:not(.mpx-rd)) { grid-template-columns: 46px minmax(0,1fr) auto !important;') < 0 || b2.indexOf('#mptCM .mpt-mcard #mptCA .mpx-dr { grid-template-columns: 30px minmax(0,1fr) 10px !important; }') < 0 || b2.indexOf('#mptCM .mpt-mcard #mptCA .mpx-r :is(.mpx-w, .mpx-o) { grid-column: 2 / -1 !important; }') < 0) bad('every mistake\'s rows keep their full-width columns in the narrow panel beside the map, so a death reads one word a line (Flex, Nov 16: "formatting bugs")'); }
  // 7. the replay: no line walked, zoomed in on the group
  if (/\.mrp-walk'\)\.setAttribute\('points'/.test(s)) bad('the replay draws the line walked again (Flex, Nov 16: "remove the movement lines they provide nothing useful")');
  { const m = /\nconst MRP_VIEW_YD = (\d+);/.exec(s); if (!m || +m[1] > 80 || s.indexOf('st.vw = Math.min(D.W, (MRP_ZS[MRP.zi | 0] || MRP_VIEW_YD) * st.ppy);') < 0) bad('the replay\'s camera shows more than 80 yards across again (Flex, Nov 16: "have the map zoomed in on the group during the replay"; it was 130)'); }
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ Route is the main page: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
