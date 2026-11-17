// Home, the ranks beside the team's name (Nov 17, Flex: "the all rankings can actually be removed from the home tab it has all that info right next
// to the team name. Can you color code the stats based on how warcraftlogs does it?"). It fails if the All rankings button comes back, its box can open
// again, the chips lose Warcraft Logs' colours, the team's ranks stop keeping their colours, or the colour styles go missing.
// contradictions.js runs it on every build. It fails on 52711846.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function homeRankings(say) {
  const bad = (m) => say('Home', 'rank chips, Nov 17', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src: ' + e.message); return; }
  if (s.indexOf('id="pgRkT"') >= 0) bad('the All rankings button is back on Home (Flex, Nov 17: "the all rankings can actually be removed")');
  if (s.indexOf("id=\"pgRk\"' + (S.pgRkOpen ? '' : ' hidden')") >= 0) bad('the All rankings box can open again');
  if (s.indexOf("const c = (k) => (r && r.q && r.q[k] ? ' class=\"trv ' + r.q[k] + '\"' : '');") < 0 || s.indexOf("'<span class=\"pgc\">World <b' + c('w') + '>'") < 0) bad('the rank chips lost Warcraft Logs\' colours');
  if (s.indexOf('q: { w: q(pr.worldRank), r: q(pr.regionRank), s: q(pr.serverRank), sp: q(sp.worldRank) }') < 0) bad('the team\'s ranks stopped keeping their colours, so the chips come up plain');
  if (css.indexOf('html body #main .pgc b.trv.q2 { color: #52d65a !important; }') < 0) bad('the rank chips\' colour styles are missing');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Home rank chips, Nov 17: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
