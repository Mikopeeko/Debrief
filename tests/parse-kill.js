// A kill with real Warcraft Logs numbers, next to the site's own count (Nov 13, Main, after damage done began counting what an enemy's shield absorbed).
// Warcraft Logs' damage a second for each raider on the Nov 12 Coiled Altar kill (Gax3AkbyFRXmdrgQ, fight 9; read from its rankings on Nov 13) and their real parse.
// The site must count the same damage (within 1.5%: it read 4% to 11% low before shields counted), and its estimate for the whole kill must land on the real parse
// (within 5 points, for raiders who lived: the estimate counts time alive, a real parse the whole fight). Warcraft Logs' percentiles drift as more guilds kill the
// boss, so the parse half is checked loosely. Run by tests/contradictions.js with --all.
'use strict';
const KILLS = [
  { code: 'Gax3AkbyFRXmdrgQ', fight: 9, what: 'Nov 12 The Coiled Altar kill',
    /* name: [Warcraft Logs' damage a second, the real parse, lived the whole kill] */
    dps: { Schooty: [222764, 45, true], Komo: [285126, 65, true], Fourinches: [317588, 90, true], Zaffia: [270052, 63, true], Volkovod: [243231, 73, true], Larryg: [239629, 31, true], Dashtoswirly: [238603, 41, true],
      Jangokin: [219434, 39, true], Kargaryen: [245385, 27, true], Shockabunga: [232148, 47, true], Boltzzx: [203519, 9, true], Raiyvenz: [221268, 11, false], Dragooned: [241419, 42, false] } },
];
module.exports = function (o) {
  const { H, E, W, say, report, findFile, readJ } = o, nm = (p) => String(p || '').split('-')[0]; let X = null;
  try { X = H.site(['raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT', 'PARSE_PCT', 'PARSE_TAB', 'PHASE_FAC', 'parseAt', 'phFacOf', 'deadSpans', 'specKeyOf', 'estPull', 'estCombine'],
    { store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {} }); } catch (e) { say('parse on a kill', 'crash', 'the estimate code could not be read: ' + e.message); return 0; }
  let n = 0;
  for (const k of KILLS) { const rep = report(k.code), ef = findFile(k.code + '_' + k.fight + '.json'), it = rep && rep.items.get(k.fight); if (!it || !ef) continue; /* (not in this log library) */
    let ev = readJ(ef); if (!Array.isArray(ev)) ev = ev.events; const r = E.analyze(it, W.translate(it, ev), {}); ev = null; if (!r.item) r.item = it; n++;
    const where = k.what + ' (' + k.code + ':' + k.fight + ')', est = X.estCombine([X.estPull(r, 'dmg')]), byN = new Map([...est].map(([a, v]) => [nm(a), v]));
    for (const [who, [wcl, real, lived]] of Object.entries(k.dps)) { const p = [...r.players.values()].find((x) => nm(x.name) === who); if (!p) { say(where, 'parse', who + ' is not in the kill'); continue; }
      const ours = p.damage / r.duration, off = ours / wcl - 1;
      if (Math.abs(off) > 0.015) say(where, 'parse', who + '\'s damage a second is ' + Math.round(ours).toLocaleString('en-US') + ', Warcraft Logs has ' + wcl.toLocaleString('en-US') + ' (' + (off * 100).toFixed(1) + '%): damage done is counted another way than Warcraft Logs again (shields?)');
      const e = byN.get(who); if (lived && (!e || e.pct == null || Math.abs(e.pct - real) > 5)) say(where, 'parse', who + '\'s estimated parse on the kill is ' + (e && e.pct != null ? e.pct : 'missing') + ', the real one is ' + real); } }
  return n;
};
