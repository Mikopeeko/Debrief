// Mythic+ enemy portraits on the Route map and in the replay (Nov 16, Flex: "Can we use those portraits on the maps and the replay"; they are Wowhead's
// thumbnails of each enemy's own model, loaded at runtime, never bundled). This fails if the replay's enemies lose their portraits (or a failed one
// stops falling back to the plain circle), the clips stop following the floor's size, or the website's Route map goes back to portraits on Elites only
// until zoomed in. contradictions.js runs it on every build. Each part fails on the page before it.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function mplusEnemyPortraits(say) {
  const bad = (m) => say('Mythic+ portraits', 'on the map and in the replay', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src/mptab.js or src/shell.html'); return; }
  if (s.indexOf("const pic = mpNpcPic(o.u.id) || (o.boss ? mpBossPic(o.n) : ''); if (pic) c.classList.add('pic');") < 0 || s.indexOf("clip-path=\"url(#mrpPc' + (o.boss ? 3 : 1) + ')\" onerror=\"this.parentNode.classList.remove(\\'pic\\');this.remove()\"") < 0) bad('the replay\'s enemies are plain circles again, or a portrait that fails to load leaves no circle ("Can we use those portraits on the maps and the replay")');
  if (s.indexOf('<defs><clipPath id="mrpPc1"><circle r="1"></circle></clipPath><clipPath id="mrpPc3">') < 0 || s.indexOf("if (c1) c1.setAttribute('r', (1.5 * y).toFixed(2)); if (c3) c3.setAttribute('r', (3 * y).toFixed(2));") < 0) bad('the replay\'s portrait clips no longer match an enemy\'s and a boss\'s circle on each floor');
  if (s.indexOf("svg.querySelectorAll(z >= 1.5 || !MPC_ON ? '.mpt-ep image[data-href]' : '.mpt-epe image[data-href]')") < 0 || css.indexOf('.mpt-mdt svg .mpt-ep { display: inline !important; }') < 0) bad('the website\'s Route map shows portraits on Elites only until zoomed in again');
  if (css.indexOf('.mrp-e.pic > circle { fill: none !important; stroke: #e5534b !important; }') < 0) bad('a replay enemy with a portrait lost its ring, or its circle covers the portrait');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ enemy portraits: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
