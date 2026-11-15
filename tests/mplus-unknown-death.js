// A Mythic+ death with no named hit read "died to unknown" (the Design studio, Nov 14, 3d3f8a78, on Flex's Kings' Rest +19: it fixed the
// Summary's line to "a hit the log doesn't name", and flagged that the pull card's "How they died" line, its play by play and the timeline
// still said "unknown", on the website and the Companion app's card alike).
// This fails if any death line falls back to the word "unknown" again, and checks the shared wording. contradictions.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function unknownDeath(say) {
  const bad = (m) => say('Mythic+ deaths', 'unknown hit', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js'); return; }
  const left = s.match(/d\.to \|\| 'unknown'/g);
  if (left) bad('a death line still falls back to "unknown" (' + left.length + ' place(s)); use mpDTo(d.to)');
  const line = (s.match(/\nconst mpDTo = [^\n]*/) || [])[0];
  if (!line) { bad('src/mptab.js has no mpDTo (the shared words for a death the log gives no hit for)'); return; }
  const f = vm.runInNewContext(line + '\nmpDTo');
  if (f('unknown') !== 'a hit the log doesn\'t name' || f('') !== 'a hit the log doesn\'t name' || f(undefined) !== 'a hit the log doesn\'t name') bad('a death with no named hit doesn\'t read "a hit the log doesn\'t name"');
  if (f('Smashing Charge') !== 'Smashing Charge') bad('a named hit no longer keeps its name');
};
