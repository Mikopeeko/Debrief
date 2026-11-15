// Entombed Sentinels' "Blood pool" check could never flag anyone, but the site said it checked it (quiet-bug hunt, Nov 15, overnight).
// The rule and the Avoidable damage line were keyed to spell 1284208. In all 262 saved Sentinels pulls that ID shows up only as one aura the
// Blood of Ula'tek takes off itself, never as damage, so nothing ever matched; the boss card still listed "Blood pool" under avoidable damage.
// Main's ruling (Nov 15): keep the rule (never remove unasked), mark it notChecked so the page says "not checked yet", change no grade, and
// measure it later from a real pull (notes/Entombed Sentinels research.md, Fix queue). This fails if the rule is gone, if it's still keyed to
// 1284208 alone without the notChecked mark, or if the boss card or the Avoidable damage explainer claims Blood pool is checked.
// When someone measures it and keys it to the real hit, drop notChecked and update this check with the pull it was measured on.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function quietBloodPool(say, H) {
  const bad = (m) => say('Entombed Sentinels', 'blood pool', m);
  if (!H) H = require('./site-helpers.js');
  const pk = (H.E.PACKS || []).find((p) => p.encounter === 'Entombed Sentinels');
  if (!pk) { bad('no Entombed Sentinels rule pack'); return; }
  const rule = pk.rules.find((r) => r.type === 'avoidable' && /^blood pool$/i.test(r.name || ''));
  if (!rule) { bad('the Blood pool rule is gone; keep it, marked not checked yet, until it is measured (Main, Nov 15)'); return; }
  const onlyAura = (rule.spellIds || []).length && rule.spellIds.every((id) => id === 1284208);
  if (onlyAura && !rule.notChecked) bad('Blood pool is keyed to 1284208, an aura the Blood of Ula\'tek takes off itself that never deals damage, and isn\'t marked notChecked, so the site claims a check that can\'t fire');
  if (rule.notChecked) {
    /* (the boss card: a notChecked rule is never in the checked list) */
    let card = '';
    try { card = H.site(['andList', 'fpbMore']).fpbMore('Entombed Sentinels'); } catch (e) { bad('the boss card text would not build: ' + e.message); return; }
    const m = /avoidable damage \(([^)]*)\)/.exec(card), listed = m ? m[1] : '';
    const checked = listed.split(';')[0];
    if (/blood pool/i.test(checked)) bad('the boss card lists Blood pool as checked: "' + card + '"');
    if (!/blood pool not checked yet/i.test(card)) bad('the boss card doesn\'t say Blood pool isn\'t checked yet: "' + card + '"');
    /* (the Avoidable damage explainer) */
    const ES = fs.readFileSync(path.join(__dirname, '..', 'src', 'engine.js'), 'utf8');
    const ex = (/\n\s*avoid: '((?:[^'\\]|\\.)*)'/.exec(ES.slice(ES.indexOf("droplets: 'The Breath of Ula"))) || [])[1] || '';
    if (/and standing in a blood pool\./i.test(ex)) bad('the Avoidable damage explainer still says standing in a blood pool is judged');
  }
};
