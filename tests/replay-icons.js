// The Timeline replay's Ula'tek adds (Nov 13, Flex: "can you make sure the adds on ulatek get proper icons instead of random shapes on the map replay").
// Before this, the awake Blightscale Wretch, the Doomscale Warden, the Weakened Doomscales and the Blightscale Shrieker fell through to the plain purple
// diamond every add without a look of its own gets, and the Rawlings were a green squiggle. The adds listed below are every Ula'tek unit with positions on
// a real Mythic kill (qjtwZK46aFRB28pm fight 11, read from the log library on Nov 13). Every one must be drawn as itself (her tail, the heart, the Wretch's
// womb, the egg clutches) or with its own game icon in the add ring, and an icon needs a drawn stand-in for when Wowhead's picture can't load.
// Runs on every build (tests/contradictions.js); `node tests/replay-icons.js` runs it alone.
'use strict';
module.exports = function replayIcons(H, say) {
  const vm = require('vm'), UI = H.UI, bad = (t) => say("Ula'tek replay", 'icons', t);
  let K;
  try { K = vm.runInNewContext(H.grab('UL_ICONS') + '\n' + H.grab('ulKind') + '\n' + H.grab('ulIconFb') + '\n({ UL_ICONS, ulKind, ulIconFb })'); }
  catch (e) { bad("the replay has no icons for Ula'tek's adds (" + e.message + '): they are plain shapes again'); return; }
  // (the adds the replay draws: RX's Ula'tek entry)
  const m = /ul: true, adds: (\[[^\]]*\])/.exec(UI), adds = m ? vm.runInNewContext(m[1]) : null;
  if (!adds) { bad("the replay's Ula'tek entry has no adds list"); return; }
  const SEEN = ['Gore Rattle', 'Blightscale Rawling', 'Blightscale Wretch', 'Doomscale Warden', 'Weakened Doomscale', 'Blightscale Shrieker', 'Venomous Heart', 'Blightscale Clutch', 'Slithering Clutch'];
  for (const n of SEEN) if (!adds.includes(n)) bad(n + " is not on the replay's add list, so the replay leaves it out");
  const OWN = new Set(['womb', 'heart', 'hopen', 'tail', 'ghost', 'clutch', 'slither']); /* (drawn as the thing itself) */
  const sids = new Map();
  for (const n of new Set(adds.concat(SEEN))) for (const [ft, wake] of [[5, 0], [40, 0], [40, null], [300, 0]]) {
    const k = K.ulKind(n, ft, n === 'Blightscale Wretch' ? wake : null, [{ a: 290, e: 310 }]);
    if (!k) { bad(n + ' falls back to a plain shape at ' + ft + ' s'); continue; }
    if (k === 'icon') {
      const L = K.UL_ICONS[n], fb = K.ulIconFb(L.fb, 50, 50, L.r);
      if (!(L.sid > 0)) bad(n + ' has no game icon');
      if (!(L.r > 0)) bad(n + "'s icon has no size");
      if (!L.legend) bad(n + ' has no line in the Key');
      if (!/<(path|circle|polygon|ellipse)\b/.test(fb)) bad(n + " has no drawn stand-in for when its icon can't load");
      if (sids.has(L.sid) && sids.get(L.sid) !== n) bad(n + ' and ' + sids.get(L.sid) + ' share one icon, so they look the same');
      sids.set(L.sid, n);
    } else if (!OWN.has(k)) bad(n + ' is drawn as "' + k + '", which the replay has no drawing for');
  }
  if (K.ulKind('Blightscale Wretch', 5, 0, []) !== 'womb' || K.ulKind('Blightscale Wretch', 25, 0, []) !== 'icon') bad('the Wretch is no longer its womb for 20 s and then its icon');
  // (the page draws an icon kind with the shared add ring and the stand-in under it, and the replay's map kit hands it addIcon)
  if (!UI.includes("if (K === 'icon') { var L = UL_ICONS[p.name], fb = ulIconFb(L.fb, x, y, L.r * k);") || !UI.includes("w.addIcon(x, y, L, '', k, fb)")) bad('the replay no longer draws the icon of an add whose kind is icon');
  if (!/window\.dbtMapKit = function \(\) \{ return \{[^\n]*addIcon: addIcon/.test(UI)) bad("the replay's map kit no longer hands it addIcon");
  if (!UI.includes('function addIcon(x, y, look, title, k, under) {') || !UI.includes("fill=\"#2a1418\"/>' + (under || '')")) bad('addIcon no longer draws the stand-in under the icon');
  // (what addIcon really draws: the ring, the stand-in, then the game icon as a proper <image> tag (Nov 13: a lost space wrote "<imagedata-sid", which
  // drops the icon of every add on every map, Twin Fangs and The Coiled Altar too))
  try { const AI = vm.runInNewContext(H.grab('addIcon') + '; addIcon', { iconHref: () => 'https://example.invalid/x.jpg' }), L = K.UL_ICONS['Blightscale Wretch'];
    const out = AI(10, 10, L, 'Blightscale Wretch', 1, K.ulIconFb(L.fb, 10, 10, L.r)), iS = out.indexOf('<image data-sid="' + L.sid + '" href="https://example.invalid/x.jpg"'), fS = out.indexOf('<polygon');
    if (iS < 0) bad('addIcon no longer writes a proper <image> tag for the game icon, so no add icon shows on any map');
    else if (!(fS >= 0 && fS < iS)) bad('the drawn stand-in is no longer under the game icon');
  } catch (e) { bad('addIcon could not be run: ' + e.message); }
};
if (require.main === module) {
  const H = require('./site-helpers.js'); let n = 0;
  module.exports(H, (where, kind, t) => { n++; console.log('Contradiction: ' + where + ' (' + kind + '): ' + t); });
  console.log(n ? n + " problem(s) with the Ula'tek replay's add icons" : "Ula'tek replay add icons: OK"); process.exit(n ? 1 : 0);
}
