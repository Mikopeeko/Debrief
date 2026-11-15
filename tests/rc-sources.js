// Every Report card row reads its number from its home tab (Nov 12, Flex: "so really every section in report card is just pulling and compiling data from
// other parts of the site this way", "Yes, do it"). The card (rqcOf) and each home call the same function over the same pulls; RC_SRC names each home.
// (The numbers themselves, every raider against every home: window.__wla.rcSrcCheck() on a practice link, as checks 16 and 21 do for Mechanics and Rotation.)
'use strict';
module.exports = function rcSources(H, say) {
  const U = H.UI, grab = (n) => { try { return H.grab(n); } catch (e) { return ''; } }, card = grab('rqcOf');
  if (!card || !grab('RC_SRC')) { say('the page code', 'report card', 'the Report card has no named sources (RC_SRC)'); return; }
  // (row, the card's read, the home's read)
  const T = [
    ['Ready to raid (flask, food, oil, rune, enchants, gems, item level)', 'rdyRows(prepNight(NR, nm))', [grab('coachKitHtml'), 'rdyRows(prepNight(K.reps, K.name))']],
    ['Healthstone or health potion; Close calls answered', 'kitNight(NR, nm)', [grab('coachKitHtml'), 'kitFromK(K, K.name)']],
    ['Big defensives (tanks)', 'tankDefNight(NR, nm)', [grab('coachKitHtml'), 'tankDefNight(K.reps, K.name)']],
    ['Big cooldowns', 'cdNight(NR, nm)', [U, "{ const CN = o.P0 ? cdNight(SPC_REPS && SPC_REPS.length ? SPC_REPS : o.per.map((x) => x.r), o.P0.name) : null;"]],
    ['Externals', 'extNight(NR, nm)', [grab('coachKitHtml'), 'extNight(K.reps, K.name)']],
    ['Deaths on you, Defensive before dying', 'deathsOf(a.per.map((g) => g.r), nm)', [grab('gbDeathOk'), 'v.on']],
    ['Damage / Healing', 'estParses(a.per.map((g) => g.r), kind377)', [U, 'const gbPrs = (k) =>']]];
  for (const [row, cardRead, [home, homeRead]] of T) { if (!card.includes(cardRead)) say('the page code', 'report card', row + ': the card no longer reads its home (expected "' + cardRead + '")'); if (!home || !home.includes(homeRead)) say('the page code', 'report card', row + ': its home tab no longer shows the same count (expected "' + homeRead + '")'); }
  if (!/async function perfNight\([\s\S]{0,2500}?bossReps\(it, still, [^;]*?, true\); if \(!got/.test(U)) say('the page code', 'report card', 'the Rotation tab no longer reads the whole night, so it can count fewer pulls than the Report card');
  if (!card.includes("const cr = (k, x) => (x.f != null && k !== 'mech' && !x.bonus ? pc(x) : mk(x))")) say('the page code', 'report card', 'a graded row no longer counts the % it shows (Flex: "score matching the %")');
  if (!grab('cdNight').includes('cdUseRows(')) say('the page code', 'report card', 'Big cooldowns: the card\'s count isn\'t Graphs\' cdUseRows');
  if (!grab('cardOf').includes('extChances(r, p)')) say('the page code', 'report card', 'the per-pull card counts externals its own way again (extChances)');
  // (each card row names its home: src on every row the card adds; the info rows too)
  const nAdd = (card.match(/add\('(prep|alive|kit|perf)'/g) || []).length, nSrc = (card.match(/\.src = RC_SRC\.|o\.src = RC_SRC\./g) || []).length;
  if (nSrc < 9) say('the page code', 'report card', 'only ' + nSrc + ' of the card\'s ' + nAdd + ' row adds name a source');
};
