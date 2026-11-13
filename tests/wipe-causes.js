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
  /* (Nov 13, Main: since the played-on rule this pull is read past its early call: 8 died, 3 to Gloombomb, 2 to Dreadmarch, 1 to Coalesced Venom, and no one cause clears the bar.
     Flex's standing rule: biggest first, then what added up) */
  ['HWFBkCyc6JNazQrK', 16, 'dead', /^Gloombomb killed 3 of the 8 who died, then Dreadmarch 2 and Coalesced Venom 1, and too few were left for the intermission\.$/, [],
    'Oct 21 pull 16: 8 died to different things, Gloombomb the most (3). It read "Deaths from different mistakes added up, and too few were left for the intermission"'],
  /* (Nov 13, Main: checked against the raw log. The Wail at 4:59 feared 16; Kargaryen, Urgdragon and Hobbz died at 5:01.0 with no killing hit, 59 to 76 yards from the middle of the
     room: feared off the edge. Deadly Venom is Zaffia's own poison) */
  ['agt6jMTyZBYvVzAP', 17, 'kick', /^An unkicked Wail of Terror feared 16 players, and 3 ran off the edge\.$/, [],
    'Nov 11 pull 16: three players feared off the edge by the unkicked Wail of Terror at 4:59. It read "2 died while feared (Deadly Venom)"'],
];
module.exports = function (o) {
  const { H, E, W, say, report, findFile, readJ } = o, nm = (p) => String(p || '').split('-')[0];
  const SITE = H.site(['raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT'], { store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {} });
  const rootOf = (r) => { const ci = SITE.cutInfo(r), c0 = ci && ci.call ? ci.call : ci, cut = c0 && c0.auto ? c0.t : null; return E.rootCause(r, c0 && c0.auto ? { cut, why: c0.why, at: c0.at, mn: c0.mn, ms: c0.ms } : { cut }); };
  /* (How it went, as the page builds it: the real call, the real root, every kept mistake and death) */
  let CH = null; try { CH = H.site(['raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT', 'deathHit', 'deathHitId', 'MECH_FAM', 'mechFams', 'chainTitleFits', 'deathBrief', 'collapseFrom', 'wipeRoot', 'wipeChain'],
    { store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {}, WROOT: new WeakMap(), dbfReset: (it) => !!it && !it.kill && it.duration != null && it.duration < 15 /* (the page also asks the boss's health; none of these pulls is a reset) */, deathVerdict: () => null, keptMistakes: (r) => r.mistakes || [], keptDeaths: (r) => r.deaths || [] }); } catch (e) { say('named wipe causes', 'crash', 'How it went could not be read: ' + e.message); }
  let n = 0;
  for (const [code, fight, cat, re, notBy, what] of NAMED) {
    const rep = report(code), ef = findFile(code + '_' + fight + '.json'), it = rep && rep.items.get(fight); if (!it || !ef) continue; /* (not in this log library) */
    let ev = readJ(ef); if (!Array.isArray(ev)) ev = ev.events; const r = E.analyze(it, W.translate(it, ev), {}); ev = null; if (!r.item) r.item = it; n++;
    const where = it.boss + ' ' + (it.diff || '') + ' pull ' + it.pull + ' (' + code + ':' + fight + ')', rc = rootOf(r);
    if (!rc || rc.cat !== cat || !re.test(rc.short || '')) say(where, 'root', what + '. Now: ' + (rc ? rc.name + ' — "' + rc.short + '"' : 'no cause'));
    for (const b of notBy) if (rc && (rc.by || []).includes(b)) say(where, 'root', 'Why we wiped names ' + b + ' as the cause again (' + what + ')');
    if (fight === 2 && code === 'agt6jMTyZBYvVzAP' && CH) { /* (Nov 13, Main: How it went never drops a death the root cause names: Tyralien at 7:38 and Vandagos at 8:54, even past the 9-row cap) */
      let ch = null; try { ch = CH.wipeChain(r); } catch (e) { say(where, 'chain', 'How it went crashed: ' + e.message); } const rows = (ch && ch.items) || [], has = (who, t) => rows.some((x) => Math.abs(x.t - t) <= 2 && String(x.txt || '').indexOf(who) >= 0);
      if (ch && (!has('Tyralien', 458.9) || !has('Vandagos', 534.3))) say(where, 'chain', 'How it went drops a death the root cause names (Tyralien at 7:38, Vandagos at 8:54): its rows are ' + rows.map((x) => E.fmtT(x.t) + ' ' + String(x.txt || '').slice(0, 40)).join(' | '));
      if (ch && rows.length > 9) say(where, 'chain', 'How it went has ' + rows.length + ' rows: the cap is 9'); }
    if (fight === 17 && code === 'agt6jMTyZBYvVzAP' && CH) { /* (Nov 13, Main: the rows under the cause say what happened: Kargaryen, Urgdragon and Hobbz went off the edge at 5:01 with no killing hit; never "died to Deadly Venom") */
      let ch = null; try { ch = CH.wipeChain(r); } catch (e) { say(where, 'chain', 'How it went crashed: ' + e.message); } const rows = (ch && ch.items) || [], at501 = rows.filter((x) => Math.abs(x.t - 301) <= 1 && /off the edge/.test(String(x.txt || '')));
      if (ch && (at501.length !== 1 || !['Kargaryen', 'Urgdragon', 'Hobbz'].every((nmE) => at501[0].txt.indexOf(nmE) >= 0))) say(where, 'chain', 'How it went doesn\'t say Kargaryen, Urgdragon and Hobbz went off the edge at 5:01 in one row: ' + rows.filter((x) => Math.abs(x.t - 301) <= 2).map((x) => '"' + x.txt + '"').join(', '));
      if (ch && rows.some((x) => /died to (Deadly Venom|Dreadful Presence|Retaliatory Malice)/.test(String(x.txt || '')) && /Kargaryen|Urgdragon|Hobbz|Schooty/.test(x.txt) && x.t <= 301.5)) say(where, 'chain', 'How it went names a hit for a player who went off the edge with no killing hit: ' + rows.filter((x) => x.t >= 299 && x.t <= 301.5).map((x) => '"' + x.txt + '"').join(', ')); }
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
