// A key left early showed its "Left early" pill as a strip across the whole banner (the Design studio, Nov 14, on Raid review's sibling layout,
// 0c940e99; it was like that on the live site and on the Companion app's card too). The pill's class was mpt-rl, the same name as the route map's
// line, which is drawn absolute and full size (".mpt-rl{position:absolute;inset:0;width:100%;height:100%}"). The pill now has its own class name.
// This fails if the banner's result pill shares a class with the route line again. contradictions.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function leftEarlyPill(say) {
  const bad = (m) => say('Mythic+ banner', 'Left early', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js'); return; }
  const m = s.match(/run\.left \|\| !run\.timeMs \? \['Left early', '([\w-]+)'\]/); /* (the banner's pill; the key list has its own short 'l') */
  if (!m) { bad('could not find the "Left early" pill in src/mptab.js'); return; }
  const cls = m[1], line = /\.mpt-rl\{position:absolute;inset:0;width:100%;height:100%/.test(s);
  if (cls === 'mpt-rl' && line) bad('the "Left early" pill uses the route line\'s class (mpt-rl), so it stretches across the whole banner');
  if (!new RegExp('\\.mpt-res\\.' + cls + '\\{').test(s)) bad('the "Left early" pill (' + cls + ') lost its grey colour');
};
