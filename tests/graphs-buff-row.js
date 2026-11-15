// Raid review's Graphs: opening or closing a Buffs row threw "ReferenceError: S is not defined", so the open row wasn't remembered
// (the Design studio, Nov 14, in a headless page while copying the tab for Mythic+; it was on the live site too). The toggle listener (window.__g8bo)
// sat after the end of ui.js's big closure, where the page's state S doesn't exist.
// This finds where ui.js's closure ends (the first "})();" line where the file so far is a whole program) and fails if the listener is after it.
// contradictions.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function graphsBuffRow(say) {
  const bad = (m) => say('Graphs', 'Buffs row', m);
  let L; try { L = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8').split('\n'); } catch (e) { bad('could not read src/ui.js'); return; }
  let end = null;
  for (let i = 0; i < L.length; i++) if (/^\}\)\(\);?\s*$/.test(L[i])) { try { new vm.Script(L.slice(0, i + 1).join('\n')); end = i + 1; break; } catch (e) { /* (still inside) */ } }
  const at = L.findIndex((l) => l.includes('window.__g8bo = 1')) + 1;
  if (!at) { bad('could not find the Buffs row listener (window.__g8bo) in src/ui.js'); return; }
  if (!end) { bad('could not find where ui.js\'s closure ends'); return; }
  if (at > end) bad('the Buffs row listener is outside ui.js\'s closure (line ' + at + ', the closure ends at ' + end + '), so opening a row throws "S is not defined"');
};
