// Entombed Sentinels' Toxic Droplets never showed a droplet taken "with an immunity" on a Warcraft Logs report.
// Found in the quiet-bug hunt (Nov 15, overnight) by checking Mythic Sentinels pulls from the log library (report RanbCzckZWDQqXg7 fight 11
// was one). Since the first checkpoint (c4b25dc3, Oct 16) the engine only counted a droplet's miss as an immunity, which is what a game log
// writes. Warcraft Logs writes an immunity as a hit of 0 with nothing absorbed (hitType 10), and wcl.js turns that into a SPELL_DAMAGE of 0,
// never a SPELL_MISSED, so on reports the droplet counted as a normal pickup and the blue "immunity" flash never showed.
// This builds a tiny Mythic Sentinels pull as Warcraft Logs events (one droplet set: Aria takes hers with an immunity, Kesh takes his for 375k,
// Tyr's is all eaten by a shield), runs it through the site's own wcl.js and engine.js, and reads the Toxic Droplets section.
// Aria's row must say "1 (1 immune)" and the set "(1 with an immunity)"; a hit a shield took whole is not an immunity. No log library needed.
'use strict';
const path = require('path');
module.exports = function quietSentinelsDropletImmune(say) {
  const where = 'Entombed Sentinels', bad = (m) => say(where, 'droplets', m);
  let E, W; try { E = require(path.join(__dirname, '..', 'src', 'engine.js')); W = require(path.join(__dirname, '..', 'src', 'wcl.js')); } catch (e) { bad('could not load src/engine.js or src/wcl.js: ' + e.message); return; }
  const P = (id, name, sub) => [id, { id, name, type: 'Player', subType: sub, server: 'Realm' }];
  const actors = new Map([P(1, 'Aria', 'Paladin'), P(2, 'Kesh', 'Mage'), P(3, 'Tyr', 'Warrior'),
    [10, { id: 10, name: "Breath of Ula'tek", type: 'NPC', subType: 'Boss', gameID: 600001 }], [11, { id: 11, name: "Blood of Ula'tek", type: 'NPC', subType: 'Boss', gameID: 600002 }]]);
  const A = (gameID, name, type) => [gameID, { gameID, name, type: type || 8 }];
  const abilities = new Map([A(1284434, 'Toxic Droplets'), A(1284451, 'Toxic Droplets'), A(116, 'Frostbolt', 16)]);
  const item = { kind: 'boss', id: 3603, boss: 'Entombed Sentinels', diffId: 16, diff: 'Mythic', size: 20, startMs: W.BASE + 1000, kill: false, result: 'Wipe', duration: 60, pull: 1, run: null,
    wcl: { code: 'qbdrop', fight: 1, start: 1000, end: 61000, actors, abilities, encounterID: 3603, rawDiff: 16 } };
  const at = (id, x, y) => ({ resourceActor: id, hitPoints: 900000, maxHitPoints: 1000000, x, y });
  const ev = [
    { timestamp: 1001, type: 'combatantinfo', sourceID: 1, specID: 65 }, { timestamp: 1001, type: 'combatantinfo', sourceID: 2, specID: 64 }, { timestamp: 1001, type: 'combatantinfo', sourceID: 3, specID: 73 },
    { timestamp: 2000, type: 'damage', sourceID: 2, targetID: 10, abilityGameID: 116, hitType: 1, amount: 100000, absorbed: 0, resourceActor: 2, hitPoints: 900000000, maxHitPoints: 1000000000, x: 100000, y: -50000 },
    { timestamp: 2000, type: 'damage', sourceID: 2, targetID: 11, abilityGameID: 116, hitType: 1, amount: 100000, absorbed: 0, resourceActor: 2, hitPoints: 900000000, maxHitPoints: 1000000000, x: 100000, y: -50000 },
    { timestamp: 10000, type: 'cast', sourceID: 10, targetID: -1, abilityGameID: 1284434 }, // (Breath of Ula'tek casts Toxic Droplets)
    { timestamp: 12000, type: 'damage', sourceID: 10, targetID: 1, abilityGameID: 1284451, hitType: 10, amount: 0, ...at(1, 100100, -50000) }, // (Aria: Divine Shield up, a hit of 0, nothing absorbed)
    { timestamp: 12500, type: 'damage', sourceID: 10, targetID: 2, abilityGameID: 1284451, hitType: 1, amount: 375000, absorbed: 0, ...at(2, 100300, -50200) }, // (Kesh: a normal pickup)
    { timestamp: 13000, type: 'damage', sourceID: 10, targetID: 3, abilityGameID: 1284451, hitType: 1, amount: 0, absorbed: 375000, ...at(3, 100500, -50400) }, // (Tyr: a shield ate it all, not an immunity)
  ];
  let r; try { r = E.analyze(item, W.translate(item, ev), {}); } catch (e) { bad('a small Sentinels pull from Warcraft Logs no longer reads: ' + e.message); return; }
  const sec = ((r.module && r.module.sections) || []).find((s) => s.id === 'droplets');
  if (!sec || !sec.groups || !sec.groups.length) { bad('a Warcraft Logs pull with a Toxic Droplets cast shows no Toxic Droplets section'); return; }
  const g = sec.groups[0], rowOf = (nm) => (g.rows || []).find((x) => x[0] && x[0].p === nm), cell = (nm) => { const x = rowOf(nm); return x && x[2] ? String(x[2].txt) : null; };
  if (cell('Aria') !== '1 (1 immune)') bad('a droplet taken with an immunity on a Warcraft Logs report doesn\'t show as immune: Aria\'s row reads "' + cell('Aria') + '", not "1 (1 immune)"');
  if (!/\(1 with an immunity\)/.test(String(g.sub || ''))) bad('the droplet set doesn\'t say one was taken with an immunity on a Warcraft Logs report: "' + g.sub + '"');
  if (cell('Kesh') !== '1') bad('a normal droplet pickup reads "' + cell('Kesh') + '", not "1"');
  if (cell('Tyr') !== '1') bad('a droplet a shield took whole counts as an immunity: Tyr\'s row reads "' + cell('Tyr') + '", not "1"');
  if (!/^3 stepped on by 3 players\b/.test(String(g.sub || ''))) bad('the droplet set should count 3 droplets stepped on by 3 players; it reads "' + g.sub + '"');
};
if (require.main === module) { const P = []; module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c)); console.log(P.length ? P.join('\n') : 'quiet-sentinels-droplet-immune: passes'); process.exitCode = P.length ? 1 : 0; }
