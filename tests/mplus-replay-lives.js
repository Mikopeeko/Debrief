// Mythic+ replay, an enemy's lives (Nov 16, Flex on the Golden Serpent's Animated Gold, with a picture of seven at 100%: "each time they spawn, we kill
// them. Then more spawn, and the old ones come back and we kill all of them"), and the play by play's filters ("clicking these filters doesnt do
// anything"). This runs mrpLives on enemies shaped like his key's (an add first seen 57 s into the boss, dead at 263, back at 323, dead at 335; a trash
// pack there when its pull began) and fails if an add shows before it spawned, a revived one doesn't come back, a pack stops standing there from the
// pull's start, or the play by play's lines are shown with a rule stronger than the filters' hide rules again. contradictions.js runs it on every build.
// Each part fails on f1a37e49.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusReplayLives(say) {
  const bad = (m) => say('Mythic+ replay', 'enemy lives and the filters', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src/mptab.js or src/shell.html'); return; }
  const a0 = s.indexOf('\nconst mrpLives = '), b0 = s.indexOf('\nconst MRP = { st: null };', a0);
  if (a0 < 0 || b0 < 0) { bad('the replay has no lives for an enemy: an add that dies and comes back shows once, from its pull\'s start ("each time they spawn, we kill them ... the old ones come back")'); }
  else { let F; try { F = vm.runInNewContext(s.slice(a0, b0) + '\nmrpLives'); } catch (e) { bad('mrpLives no longer runs by itself: ' + String(e.message).slice(0, 120)); }
    if (F) { const arr = (pairs) => { const a = []; for (const [t, hp] of pairs) a[t] = [0, 0, 0, hp]; return a; };
      const gold = arr([[258, 94], [260, 48], [262, 10], [263, 0], [323, 100], [330, 40], [335, 0]]), L = F(gold, { h: 258, t: 263 }, { s: 201, e: 400 });
      if (JSON.stringify(L) !== '[[258,263],[323,335]]') bad('an Animated Gold (seen at 258 s, dead at 263, back at 323, dead at 335) has the lives ' + JSON.stringify(L) + ', not [[258,263],[323,335]]');
      const pack = arr([[12, 100], [15, 60], [20, 0]]), L2 = F(pack, { h: 12, t: 20 }, { s: 9, e: 30 });
      if (JSON.stringify(L2) !== '[[9,20]]') bad('a pack there when its pull began (pull at 9 s, hit at 12, dead at 20) has the lives ' + JSON.stringify(L2) + ', not [[9,20]]: it must stand there from the pull\'s start');
      const odd = arr([[50, 600782], [52, 80], [54, 70]]), L3 = F(odd, { h: 52, t: 60 }, { s: 50, e: 70 });
      if (JSON.stringify(L3) !== '[[50,60]]') bad('a reading over 100% starts or ends a life (got ' + JSON.stringify(L3) + ')'); } }
  if (s.indexOf("const foes = (R.units || []).map((u, ix) => { const a = (R.ntk || {})[u.g] || [], lv = mrpLives(a, u, P[u.k])") < 0) bad('the replay\'s enemies no longer take their lives from mrpLives');
  if (s.indexOf("const on = o.lv && o.lv.length > 1 ? o.lv.some(([a1, b1]) => T >= a1 - 0.5 && T <= b1) : T >= o.s - 0.5 && T <= o.e, soon = !on && !o.sp && pi < 0") < 0) bad('an enemy that came back is not shown in each of its lives, or an add that spawned mid-pull shows faint before the pull');
  if (/#mptCM \.mpt-mside \.mpx-fl2 > li \{ display: block/.test(css)) bad('the play by play\'s lines are shown with a rule stronger than the filters\' hide rules: the filters do nothing ("clicking these filters doesnt do anything")');
  if (css.indexOf('#mptCM .mpt-mside .mpx-fl2 > li * { text-indent: 0 !important; }') < 0) bad('a block inside a play-by-play line takes the hanging indent again, so its words sit under the times ("formatting bugs")');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ replay lives: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
