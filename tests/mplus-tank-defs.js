// Mythic+, a tank's own defensives out of the play by play and the replay's As it happens (Nov 16, Flex with a picture of the Defensives filter full of
// the tank's Frenzied Regeneration and Barkskin: "Tank defensives should be ignored i think, they use them non stop"). This runs mpxTankDef and fails if a
// tank's own defensive is kept, a tank's external or anyone else's defensive is dropped, or either list stops leaving them out. contradictions.js runs
// it on every build. Each part fails on the page before it.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusTankDefs(say) {
  const bad = (m) => say('Mythic+ tank defensives', 'left out of the lists', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js'); return; }
  const m = s.match(/\nconst mpxTankDef = [^\n]*/), e = s.match(/\nconst MPX_EXT = [^\n]*/);
  if (!m || !e) { bad('a tank\'s own defensives are no longer told apart ("Tank defensives should be ignored i think, they use them non stop")'); return; }
  let F; try { F = vm.runInNewContext('const mpLc = (x) => String(x || "").toLowerCase();' + e[0] + m[0] + '\nmpxTankDef'); } catch (x) { bad('mpxTankDef no longer runs by itself: ' + String(x.message).slice(0, 120)); return; }
  const RR = { people: [{ name: 'Sornarjr', role: 'tank' }, { name: 'Flex', role: 'healer' }] };
  if (!F(RR, 'Sornarjr', 'Frenzied Regeneration')) bad('a tank\'s Frenzied Regeneration is still listed');
  if (F(RR, 'Flex', 'Divine Shield')) bad('a healer\'s defensive is left out');
  if (F(RR, 'Sornarjr', 'Blessing of Sacrifice')) bad('a tank\'s external on someone else is left out');
  if (s.indexOf("for (const x of p.defs || []) { if (!MPC_ON && mpxTankDef(RR, x.who, x.name)) continue;") < 0) bad('the play by play lists a tank\'s own defensives again');
  if (s.indexOf("quiet: true, tk: mpxTankDef(R, x.who, x.name),") < 0 || s.indexOf(".filter((e) => e.t >= from && !e.tk)") < 0) bad('the replay\'s As it happens lists a tank\'s own defensives again');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ tank defensives: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
