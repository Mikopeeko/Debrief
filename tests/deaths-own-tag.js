// The death tag says "Own death", never "You" (Nov 15, Flex's pick; found by the Nov 14 raid-night rehearsal on Wolfthorn's Thu Nov 12 Ula'tek night).
// The bug: Graphs > Deaths put a red "You" right after another raider's name ("Raiyvenz · You"), so it read as if it meant the viewer. Its hover said
// "You: 3 Caustic Waves hits right before you died". Flex picked "Own death" (Main, Nov 15): the tag reads "Own death", the hover "Own death: 3 Caustic Waves
// hits right before they died", and "Not counted" stays. tests/deaths-check.js checks the real deaths' words with the log library; this one needs nothing.
// Run by tests/contradictions.js on every build.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function deathsOwnTag(H, say) {
  const bad = (m) => say('Deaths', 'own death tag', m);
  let B = null; try { B = H.site(['DEATH_BUCKET']).DEATH_BUCKET; } catch (e) { bad('could not read DEATH_BUCKET out of ui.js: ' + e.message); return; }
  if (!B || B.you !== 'Own death') bad('the tag on a death with proof reads "' + (B && B.you) + '", not "Own death" (Flex, Nov 15: "You" beside another raider\'s name read as the viewer)');
  if (!B || B.none !== 'Not counted') bad('the tag on the other deaths reads "' + (B && B.none) + '", not "Not counted"');
  // (the hover: the verdict's say is the tag, then the proof said of the player, "they died", whoever reads it)
  const UI = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'), m = /const say = DEATH_BUCKET\[bucket\] \+ ': ' \+ \(why === 'own' \? proofOf\('(\w+)'\)/.exec(UI);
  if (!m) bad('the death\'s hover line is no longer built from DEATH_BUCKET and proofOf: check it still reads "Own death: ... right before they died"');
  else if (m[1] !== 'they') bad('the death\'s hover says "right before ' + m[1] + ' died", not "they" (it shows beside any raider\'s name)');
  // (the Debriefing timeline and the Timeline replay: a red skull and "Their mistake" come from the verdict, never from searching the words for "own".
  //  Before Nov 15 they searched the hover words: "You: 4 Axegrinder hits..." never matched, so every death read grey "Not their fault", and "Own death"
  //  would have matched by accident, as would a spell named Crown in a Not counted line)
  const txt = UI.match(/\/own\/i?\.test\([^)]*word[^)]*\)/g); if (txt) bad('a death\'s colour still comes from searching its words for "own": ' + txt.join(', '));
  if (!/word: x\.word \|\| '', own: \/\^\(own\|ready\|on\|half\)\$\/\.test\(x\.k \|\| ''\)/.test(UI)) bad('the Debriefing\'s death moments no longer carry the verdict\'s own-death flag (own), so the skull\'s colour has nothing to read');
};
