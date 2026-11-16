// Mythic+ Route's makeover (Nov 16, Flex: "Can we give the route tab the same kind of makeover treatment and polishing?", then of the mock: "Yes, build it",
// "im not sure about the timeline at the bottom though, seems redundant"). It fails if any of these go:
// - the score's banner in The key's style (Flex, later the same day: "I think the banner at the top of routes above the map is weakly designed", then "yea much
//   better"): the dungeon's art, the grade as a solid badge, each part with its game icon and a number coloured by how it did, the weakest part as one line;
// - the extra Whole key button shows while nothing is picked;
// - the map stops filling its frame (16:10, no dark bands), or the side panel stops being as tall as the map;
// - the old You vs Fast run lane shows on the website again;
// - the mistakes lose their coloured edges;
// - a picked pull's summary stops being the side panel's head, or the panel on top comes back on Route;
// - a picked pull stops saying when it started.
// contradictions.js runs it on every build. Each part fails on f3870219.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function mplusRouteLook(say) {
  const bad = (m) => say('Mythic+ Route', 'the makeover', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src: ' + e.message); return; }
  const a = css.indexOf("/* Route's makeover (Nov 16"), z = a < 0 ? -1 : css.indexOf('</style>', a), blk = a < 0 || z < 0 ? '' : css.slice(a, z); /* (the last block of the last style; it holds an @media, so not up to the first closing brace) */
  if (!blk) { bad('Route\'s makeover is gone (Flex, Nov 16: "Can we give the route tab the same kind of makeover treatment and polishing?")'); return; }
  const V = 'html:not(.mpcard) body #view#view#view #mptCM#mptCM ', has = (sel, decl, why) => { const i = blk.indexOf(sel + ' {'); if (i < 0 || blk.indexOf(decl, i) < 0 || blk.indexOf(decl, i) > blk.indexOf('}', i)) bad(why); };
  // (the score's banner in The key's own style (Nov 16, Flex: "I think the banner at the top of routes above the map is weakly designed", then of the mock:
  // "yea much better"); it replaced the boxes of ce985802. Each part fails on 9bdc7932)
  if (s.indexOf("<div class=\"mprs mrs-ban' + (L ? ' mrs-g' + L : '') + '\" role=\"group\" aria-label=\"The route score\">' + (art ? '<i class=\"mprs-art\"") < 0) bad('the route score is no longer a banner like The key\'s, with the dungeon\'s art behind it');
  if (s.indexOf("const MRS_IC = { time: 'inv_misc_pocketwatch_01', pace: 'ability_rogue_sprint', plan: 'inv_scroll_03', count: 'achievement_bg_killxenemies_generalsroom', lust: 'spell_nature_bloodlust' };") < 0 || s.indexOf("<img src=\"' + whIcon(MRS_IC[p.k] || 'inv_misc_questionmark') + '\"") < 0) bad('a part of the route score lost its game icon');
  if (s.indexOf("(L ? '<b class=\"mrs-gb g-' + L + '\">' + L + '</b>' : '')") < 0) bad('the route score\'s letter is no longer a badge where The key\'s keystone sits');
  if (s.indexOf("'<div class=\"mrs-ts\">' + tiles + '</div></div><div class=\"mrs-wk\">' + mrsTake(R, M, cls) +") < 0 || s.indexOf("<b class=\"mrs-tkp\">Weakest: ' + w.label + '</b> ' + w.why") < 0) bad('the weakest part is no longer one line under the banner, its tag first ("Weakest: Pull plan"), with Why these points at its end');
  has(V + '.mrs-x .mprs-up > b.mrs-gb', 'background: var(--gc) !important;', 'the route score\'s letter is no longer solid in its grade\'s colour');
  has(V + '.mrs-x > .mprs.mrs-gC', '--gc: var(--gC);', 'the route banner no longer takes its grade\'s colour');
  has(V + '.mrs-x .mprs-s.mrs-g > span > b', 'color: var(--good) !important;', 'a well-scored part\'s number is no longer green');
  has(V + '.mrs-x .mprs-s.mrs-y > span > b', 'color: var(--warn) !important;', 'a part that slipped is no longer amber');
  has(V + '.mrs.mrs-x', 'container: mpsb / inline-size !important;', 'the route banner no longer folds like The key\'s on a narrow screen');
  if (/\.mrs\.mrs-b \.mrs-t\.mrs-g \{ border-top-color/.test(blk)) bad('the old boxes\' rules are back (the banner replaced them)');
  has(V.trim() + ':not(.mpx-one) .mpt-mbar > .mpx-wk', 'display: none !important;', 'the extra Whole key button shows again while nothing is picked (the stepper already says Whole key)');
  has(V.trim() + ':not(.mpx-one) .mpt-mbar > .mpt-mstep', 'margin-left: auto !important;', 'the stepper and Replay jump to the left while nothing is picked (found while building it, Nov 16: hiding Whole key took their push to the right)');
  if (!/@media \(min-width: 901px\) \{[\s\S]*?\.mpt-mwrap > \.mpt-mdtm \{ aspect-ratio: 16 \/ 10 !important;[\s\S]*?\.mpt-mside \{ contain: size !important; align-self: stretch !important;/.test(blk)) bad('the map no longer fills its frame at its own 16:10 (dark bands above and below it), or the side panel is no longer as tall as the map');
  has(V + '.mpt-mleft > .mpt-mstrip', 'display: none !important;', 'the old You vs Fast run lane is back under the map on the website (Flex, Nov 16: "seems redundant")');
  has(V + '#mpxAllM details.mpx-dk:is(#mpxKdeath, #mpxKclose, #mpxKkick, #mpxKcc)', 'border-left-color: var(--bad) !important;', 'deaths, close calls and kicks lost their red edge in the mistakes');
  has(V + '#mpxAllM p.mpx-ok', 'border-left: 3px solid var(--good) !important;', 'Clean lost its green edge');
  has('html:not(.mpcard)[data-mpv="rt"] body #view#view#view #mptBody#mptBody#mptBody#mptBody#mptBody#mptBody#mptBody > #mpxSel', 'display: none !important;', 'the picked pull\'s panel is back on top of Route (it is the side panel\'s head now)');
  has(V + '.mpt-mside .mpt-mc .mpx-sum', 'display: block !important;', 'a picked pull\'s summary is no longer the head of the side panel');
  has(V + '.mpt-mside .mpt-mc .mpx-sum > :is(p.mpx-ck:first-of-type, .mpx-cw)', 'display: none !important;', 'a picked pull\'s mistakes show twice in the side panel (the play by play has them)');
  if (s.indexOf("const CK0 = MPC_ON ? null : mpClock(RR), facts = '<div class=\"mpx-cf\">' + fact('Lasted', mpMM(p.dur), CK0 ? 'from ' + mpMM(CK0.tv(p.s)) : ''") < 0) bad('a picked pull no longer says when it started (under Lasted), which the lane under the map used to show');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ Route makeover: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
