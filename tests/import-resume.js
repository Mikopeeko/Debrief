// A paused team import carries on right after the import it paused for (Nov 14, the raid-night rehearsal, Wolfthorn on a first visit:
// the team's nights stopped after 9 of 37 reports when Flex's character was read first. autoCheck skips a team tried in the last 10 minutes,
// so for 10 minutes Home said "Not pulled yet" on 7 killed Mythic bosses and the Raid review banner said "Wolfthorn · 1/10 Mythic").
// The page's own importAfter, run in Node with stand-ins. contradictions.js runs it on every build.
'use strict';
module.exports = function importResume(H, say) {
  const bad = (m) => say('Home', 'team import', m);
  let o; const ran = [], auto = [];
  const S = { importNext: null, importResume: null, progBusy: null };
  const G = [{ gid: 'c103132319', kind: 'char' }, { gid: 'g772787', kind: 'team' }, { gid: 'g796679', kind: 'team', last: 1 }];
  try { o = H.site(['importAfter'], { S, groups: () => G, progRun: (g) => { ran.push(g.gid); }, autoCheck: (g) => { auto.push(g.gid); } }); }
  catch (e) { bad('the step that runs the next import (importAfter) is gone from ui.js: ' + e.message); return; }
  // 1. the character is picked while the team is read: the team pauses (importResume) and the character goes next
  S.importNext = 'c103132319'; S.importResume = 'g772787';
  const a = o.importAfter(G[1]);
  if (a !== 'next' || ran[0] !== 'c103132319') bad('a character picked while the team was read is not read next (got ' + a + ', ran ' + ran.join(',') + ')');
  // 2. the character is done: the paused team carries on at once, not after autoCheck's 10 minutes
  const b = o.importAfter(G[0]);
  if (b !== 'resume' || ran[1] !== 'g772787') bad('the paused team import is not picked up right after the character (got ' + b + ', ran ' + ran.join(',') + '; autoCheck: ' + auto.join(',') + '): Home would say "Not pulled yet" on killed bosses for 10 minutes');
  if (S.importResume) bad('the paused import is still marked paused after it was picked up again');
  // 3. the page code still marks an import that pauses, and Raid review's "read the team now" path still queues the team
  const UI = H.UI;
  if (!/if \(S\.importYield === g\.gid\) \{ S\.importYield = null; S\.importResume = g\.gid;/.test(UI)) bad('an import that pauses for another one is no longer marked to carry on (S.importResume)');
  if (!/S\.progBusy === \(GS && GS\.char\)\) \{ S\.importNext = g\.gid; S\.importYield = S\.progBusy; \}/.test(UI)) bad('the sign-in setup\'s team read pauses the character but no longer queues the team next');
  if (!/setTimeout\(\(\) => importAfter\(g\), 400\)/.test(UI)) bad('progRun no longer calls importAfter when an import ends');
};
