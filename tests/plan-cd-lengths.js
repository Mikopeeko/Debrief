// Plan knows every Paladin cooldown it plans (Nov 14, the raid-night rehearsal: opening Wolfthorn's Plan logged "Plan: no cooldown length for
// Lay on Hands / Divine Shield / Divine Protection / Blessing of Freedom, so it isn't checked", so those were never checked, and Holy's
// Unbreakable Spirit (30% off) never applied). Lengths are the 12.1.5 tooltips: Lay on Hands 10 min, Divine Shield 5 min, Divine Protection 1 min,
// Blessing of Freedom 25 s. The page's own ndzCdBack0, run in Node. contradictions.js runs it on every build.
'use strict';
module.exports = function planCdLengths(H, say) {
  const bad = (m) => say('Plan', 'cooldown lengths', m);
  let o; const warned = [];
  try { o = H.site(['NDZ_CDRECH', 'NDZ_CDWARN', 'ndzCdBack0', 'NDZ_CDBYSPEC'], { RCD_CD: {}, console: { warn: (m) => warned.push(m), log() {} } }); }
  catch (e) { bad('could not read the cooldown lookup out of ui.js: ' + e.message); return; }
  const want = { 'Lay on Hands': 600, 'Divine Shield': 300, 'Divine Protection': 60, 'Blessing of Freedom': 25 };
  for (const [n, s] of Object.entries(want)) { const got = o.ndzCdBack0(n); if (got !== s) bad(n + ' is ' + got + ' s in Plan, not its tooltip\'s ' + s + ' s'); }
  if (warned.length) bad('Plan still warns: ' + warned.join(' | '));
  // Holy Paladin (spec 65) with Unbreakable Spirit: 7:00, 3:30 and 0:42
  const hp = o.NDZ_CDBYSPEC[65] || {};
  for (const [n, s] of [['Lay on Hands', 420], ['Divine Shield', 210], ['Divine Protection', 42]]) { const got = o.ndzCdBack0(n) + (hp[n] || 0); if (got !== s) bad('a Holy Paladin\'s ' + n + ' is ' + got + ' s, not ' + s + ' s with Unbreakable Spirit'); }
};
