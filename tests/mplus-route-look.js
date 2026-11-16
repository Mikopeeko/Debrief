// Mythic+ Route's makeover (Nov 16, Flex: "Can we give the route tab the same kind of makeover treatment and polishing?", then of the mock: "Yes, build it",
// "im not sure about the timeline at the bottom though, seems redundant"). It fails if any of these go:
// - the score's banner: a solid grade badge, the banner edged in the grade's colour, tiles with coloured top edges;
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
  has(V + '.mrs.mrs-b .mrs-l .rcb-ring > span > b', 'background: var(--gc) !important;', 'the route score\'s letter is no longer a solid badge in its grade\'s colour');
  has(V + '.mrs.mrs-b:has(.mrs-l b.g-C)', '--gc: var(--gC);', 'the score banner no longer takes its grade\'s colour');
  has(V + '.mrs.mrs-b', 'border-left: 4px solid var(--gc) !important;', 'the score banner lost its edge in the grade\'s colour');
  has(V + '.mrs.mrs-b .mrs-t.mrs-g', 'border-top-color: var(--good) !important;', 'a well-scored part\'s tile lost its green top edge');
  has(V + '.mrs.mrs-b .mrs-t.mrs-y', 'border-top-color: var(--warn) !important;', 'a part that slipped lost its amber top edge');
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
