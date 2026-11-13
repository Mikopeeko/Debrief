// Why we wiped, named pulls: each one is read like the page reads it (the real wipe call from cutInfo, then E.rootCause with the call's reason) and must name the cause the raid
// lead and the raw log agree on. Every entry says the night, the pull and what it read before the fix. Run by tests/contradictions.js with --all; the answer key
// (tests/answer-key.js) holds the same causes and runs on every build.
//   [code, fight, cat, short (a RegExp the one-line cause must match), notBy (names the cause must not blame), what it read before]
'use strict';
const NAMED = [
  /* (Nov 13, Main, from the answer key: Wail of Terror got off at 3:26 and feared 18 with Gloombombs out; the bombs went off in the raid 1.5 s later and hit 7 extra players, ghosts
     touched, and 10 of the 15 who died in the next 16 s died to that. The call (the wipe line) came 3.6 s after the Wail) */
  ['agt6jMTyZBYvVzAP', 4, 'kick', /^An unkicked Wail of Terror feared 18 players with Gloombombs out\. The bombs went off in the raid and ghosts touched, and \d+ died\.$/, [],
    'Nov 11 pull 3: the unkicked Wail of Terror at 3:26 with Gloombombs out. It read "Phase 2 push" from the four deaths before the call'],
  /* (Nov 13, Main: the 3:38 Soul Sever killed the tank, Vandagos, on stack 2 (Tyralien didn't taunt) and four who stood in it. The wave's first death was a Dreadful Presence
     death 1.1 s earlier, so the missed taunt fell outside the window) */
  ['agt6jMTyZBYvVzAP', 6, 'frontal', /^Tyralien didn't taunt before Soul Sever: Vandagos took it on stack 2 and died\. Soul Sever also killed 4 who stood in it\.$/, [],
    'Nov 11 pull 5: the Soul Sever at 3:38 with Tyralien\'s missed taunt. It read "Too many individual mistakes" (and "Dreadmarch" before the call moved onto the hit)'],
  /* (the same pattern on Oct 22, found by reading every saved wipe before and after: the Wail at 3:31 feared 19, Boltzzx's Gloombomb went off in the raid at 3:33 and killed four at once) */
  ['bcA9kw3mxHKzr4fR', 10, 'kick', /^An unkicked Wail of Terror feared 19 players with Gloombombs out\. The bombs went off in the raid, and \d+ died\.$/, [],
    'Oct 22 pull 6: the unkicked Wail of Terror at 3:31 with Gloombombs out. It read "Gloombomb (Add Bombs)": "Soul fragments weren\'t picked up, or Gloombombs missed the adds"'],
  /* (Nov 13, Main: "the root is the missed kick". The unkicked Wail at 7:33 feared Tyralien, a tank, into Death's Embrace; he was never brought back, so Vandagos took every
     Blighted Sever alone and died to his fourth at 8:54. And: never name a dead player) */
  ['agt6jMTyZBYvVzAP', 2, 'kick', /^An unkicked Wail of Terror feared the raid, and Tyralien, a tank, died to Death's Embrace\. With no other tank, Vandagos took every Blighted Sever alone and died on stack 4\./, ['Tyralien'],
    'Nov 11 pull 1: the missed kick at 7:33 that killed the other tank. It read "Tyralien didn\'t taunt before Blighted Sever", 75 s after Tyralien died'],
];
module.exports = function (o) {
  const { H, E, W, say, report, findFile, readJ } = o, nm = (p) => String(p || '').split('-')[0];
  const SITE = H.site(['raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT'], { store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {} });
  const rootOf = (r) => { const ci = SITE.cutInfo(r), c0 = ci && ci.call ? ci.call : ci, cut = c0 && c0.auto ? c0.t : null; return E.rootCause(r, c0 && c0.auto ? { cut, why: c0.why, at: c0.at, mn: c0.mn, ms: c0.ms } : { cut }); };
  let n = 0;
  for (const [code, fight, cat, re, notBy, what] of NAMED) {
    const rep = report(code), ef = findFile(code + '_' + fight + '.json'), it = rep && rep.items.get(fight); if (!it || !ef) continue; /* (not in this log library) */
    let ev = readJ(ef); if (!Array.isArray(ev)) ev = ev.events; const r = E.analyze(it, W.translate(it, ev), {}); ev = null; if (!r.item) r.item = it; n++;
    const where = it.boss + ' ' + (it.diff || '') + ' pull ' + it.pull + ' (' + code + ':' + fight + ')', rc = rootOf(r);
    if (!rc || rc.cat !== cat || !re.test(rc.short || '')) say(where, 'root', what + '. Now: ' + (rc ? rc.name + ' — "' + rc.short + '"' : 'no cause'));
    for (const b of notBy) if (rc && (rc.by || []).includes(b)) say(where, 'root', 'Why we wiped names ' + b + ' as the cause again (' + what + ')');
    if (fight === 2) { /* (the rows behind it: no taunt row on the dead tank, and the tank left alone isn't blamed for the stacks) */
      const bad = (r.mistakes || []).filter((m) => nm(m.player) === 'Tyralien' && /didn't taunt/i.test(m.detail || '') && m.t > 460);
      if (bad.length) say(where, 'taunt', 'Tyralien is named for a missed taunt at ' + E.fmtT(bad[0].t) + ', but he died at 7:38 and was never brought back');
      const own = (r.mistakes || []).filter((m) => nm(m.player) === 'Vandagos' && /blighted sever/i.test(m.mechanic || '') && m.t > 500 && /on stack [34]/.test(m.detail || ''));
      if (!own.length || own.some((m) => !m.others || !/the other tank, Tyralien, was dead/.test(m.detail || ''))) say(where, 'taunt', 'Vandagos\'s third and fourth Blighted Sever stacks count against him again, with the other tank dead: ' + own.map((m) => '"' + m.detail + '"').join(', ')); }
    if (fight === 6) { /* (Nov 12, Flex: "Why does it like to blame soul sever individual deaths for wipes": with no missed taunt, the same Sever deaths are each player's own, never the root) */
      const keep = r.mistakes; r.mistakes = keep.filter((m) => !/didn't taunt/i.test(m.detail || '')); let rc2 = null; try { rc2 = rootOf(r); } finally { r.mistakes = keep; }
      if (rc2 && rc2.cat === 'frontal') say(where, 'root', 'Soul Sever deaths with no missed taunt are the wipe\'s root cause again: "' + rc2.short + '"'); }
  }
  return n;
};
