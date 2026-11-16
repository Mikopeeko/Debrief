// Mythic+ close calls in words that can't be misread (Nov 16, Flex with a picture of four close calls: "Im confused on the wording here. 'No defensive
// up' meaning one wasnt available? or they didnt have one active at the time. because then below it says i had divine protection ready"). A close call
// is a big hit that left someone under 15% with no defensive active; the line then says whether one was off cooldown ("X was ready but not pressed") or
// none was ("No defensive was ready"). This fails if a website line says "no defensive up" or a bare "was ready" again, or sends people to the Debrief
// tab, which is gone. contradictions.js runs it on every build. Each part fails on the page before it.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function mplusCloseWords(say) {
  const bad = (m) => say('Mythic+ close calls', 'the wording', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js'); return; }
  const want = [["sec('close', 'left under 15% health by a big hit, with no defensive active',", 'every mistake\'s close calls title'],
    ["' was ready but not pressed</span>' : 'No defensive was ready'", 'every mistake\'s close call rows'],
    ["' was ready but not pressed.</span>' : 'A close call: no defensive was ready.'", 'a pull\'s close calls'],
    ["esc(c.ready[0]) + ' was ready but not pressed' : 'no defensive was ready')", 'the play by play\'s close calls'],
    ["'information: big hits that left ' + them + ' under 15% with no defensive active'", 'the Report card\'s Close calls row'],
    ["with no defensive active. Each close call is on Route, in its pull.</p>'", 'the Graphs note']];
  for (const [w, where] of want) if (s.indexOf(w) < 0) bad(where + ' no longer says plainly whether a defensive was ready ("Im confused on the wording here")');
  for (const old of ["' was ready</span>' : 'No defensive up'", "'A close call: no defensive was up.'", "' was ready' : 'no defensive up')", "Each close call is on Debrief", "'Next key on Debrief,"]) if (s.indexOf(old) >= 0) bad('an old line is back: ' + old.slice(0, 60));
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ close call words: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
