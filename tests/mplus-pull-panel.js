// Mythic+ Route: the picked pull's head in the side panel, slimmer (Nov 16, Flex of that panel: "this section still feels like it needs work", then "giving
// you creative freedom with whats displayed in that section and how its displayed"). The head took 267 of the panel's 485 px and left the play by play three
// rows. This fails if the head's numbers go back to boxes, the moments go back to a block of sentences in the side panel, a moment's tag loses its short words,
// its colour or its sentence on hover, or a buff or debuff tag stops saying how many of them were removed ("2 of 12 purged").
// contradictions.js runs it on every build. Each part fails on f606fcdd.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function mplusPullPanel(say) {
  const bad = (m) => say('Mythic+ Route', 'the picked pull\'s head', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src: ' + e.message); return; }
  if (s.indexOf("<div class=\"mpx-tg\" aria-label=\"What else happened\">' + more.map(([c, ic, t, sh, st]) => '<span class=\"mpx-t1 mpx-t1-' + (st || c) + '\" tabindex=\"0\"' + mpT1(t) + '>") < 0) bad('the moments are no longer short tags with their sentence on hover');
  if (s.indexOf("esc(b.spell) + ': ' + (b.removed || 0) + ' of ' + b.on + ' purged', (b.removed || 0) >= b.on ? 'ok' : 'x']") < 0) bad('an enemy buff\'s tag no longer says how many of them were purged, green when all were');
  if (s.indexOf("esc(b.spell) + ': ' + (b.removed || 0) + ' of ' + b.on + ' dispelled', (b.removed || 0) >= b.on ? 'ok' : 'x']") < 0) bad('a debuff\'s tag no longer says how many were dispelled');
  if (s.indexOf("'Lust ' + (lu.t < p.s ? mpMM(p.s - lu.t) + ' before' : 'at ' + mpMM(lu.t - p.s)), 'l']") < 0) bad('Lust\'s tag no longer says when');
  const a = css.indexOf('/* The picked pull\'s head in the side panel beside the map, slimmer'), z = a < 0 ? -1 : css.indexOf('</style>', a), blk = a < 0 || z < 0 ? '' : css.slice(a, z);
  if (!blk) { bad('the slimmer head\'s look is gone'); return; }
  const V = 'html:not(.mpcard) body #view#view#view #mptCM#mptCM#mptCM .mpt-mside .mpt-mc .mpx-sum > ', has = (sel, decl, why) => { const i = blk.indexOf(V + sel + ' {'); if (i < 0 || blk.indexOf(decl, i) < 0 || blk.indexOf(decl, i) > blk.indexOf('}', i)) bad(why); };
  has('.mpx-cf > .mpx-f1', 'background: none !important;', 'the head\'s numbers are boxes again (they took a third of the panel)');
  has(':is(p.mpx-ck, ul.mpx-ce)', 'display: none !important;', 'the moments are a block of sentences in the side panel again');
  has('.mpx-tg > .mpx-t1-ok', 'border-color: rgba(69,193,92,.45) !important;', 'a buff all purged is no longer a green tag');
  has('.mpx-tg > .mpx-t1-x', 'border-color: rgba(232,162,58,.5) !important;', 'a buff left on enemies is no longer an amber tag');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ picked pull head: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
