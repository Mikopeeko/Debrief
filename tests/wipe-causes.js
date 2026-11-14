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
  /* (Nov 13, Flex on this pull: "He died as he was carrying it, and i ran into it right as he died". Komo's purple carry ended at his death, 7:57.5; the burst came at 7:58.7 with
     Flëxørçïst's green 5.3 yards from where Komo fell and the other green carrier clear of it) */
  ['Gax3AkbyFRXmdrgQ', 5, 'orbs', /^Komo died carrying a purple orb, and it dropped where they fell\. Flëxørçïst's green orb ran into it and set off Venom Rupture\.$/, [],
    'Nov 12 pull 3, 7:58: the purple orb dropped as Komo died and Flëxørçïst\'s green ran into it. It read "No one was carrying it: it was a dropped orb on the ground"'],
  /* (Nov 13, Main, from the answer key: this pull's cause was already right; it is here for the killing hit of one of its deaths, below) */
  ['agt6jMTyZBYvVzAP', 9, 'guil', /^The Guillotine soak was short, so Execution hit the raid\.$/, [], 'Nov 11 pull 8: a Guillotine soak with 3 of 5, Grim Execution killed the raid'],
];
/* The hit that killed a player, as the death list shows it (d.kill): [code, fight, player, second, the hit, what it read before]. Warcraft Logs' death event names it. */
const KILLS = [
  ['agt6jMTyZBYvVzAP', 4, 'Hobbz', 221.9, 'Retaliatory Malice', 'Nov 11 pull 3, 3:41: Hobbz died to Retaliatory Malice. It read Malevolent Resonance, his last tick (the ghosts touched 10 s earlier)'],
  ['agt6jMTyZBYvVzAP', 9, 'Fourinches', 449.5, 'Grim Execution', 'Nov 11 pull 8, 7:29: Fourinches died to Grim Execution with six others. It read Malevolent Resonance (the ghosts touched 1 s before)'],
  /* (Nov 13, Main: a death with no killing hit gets its own label, never the last tick) */
  ['agt6jMTyZBYvVzAP', 17, 'Hobbz', 301.0, 'Fell off the edge', 'Nov 11 pull 16, 5:01: Hobbz was feared off the edge and no hit killed him. It read Deadly Venom, a raider\'s own poison that ticked on him 0.1 s before'],
  ['agt6jMTyZBYvVzAP', 17, 'Schooty', 299.0, 'Fell off the edge', 'Nov 11 pull 16, 4:59: Schooty walked off the edge in control and no hit killed him. It read Dreadful Presence, the last thing that ticked on him'],
  ['agt6jMTyZBYvVzAP', 6, 'Komo', 234.0, 'Dreadmarch', 'Nov 11 pull 5, 3:54: Komo was mind controlled off the edge. It read Fel Armor, his own spell ticking for 0'],
  ['agt6jMTyZBYvVzAP', 3, 'Schooty', 83.0, 'Fell off the edge', 'Nov 11 pull 2, 1:23: Schooty went off the edge, 77 yards from the middle, with health left and no killing hit. It read Venom Rupture, his last tick'],
];
/* A row of the Avoidable damage table: [code, fight, group, player, what the row must read, what it read before]. */
const ROWS = [
  ['agt6jMTyZBYvVzAP', 4, 'Noxious Ground', 'Fourinches', '18 s in it', 'Nov 11 pull 3: Fourinches stood in Noxious Ground for 18 ticks (four of them fully shielded). It read "14 s in it"'],
  /* (Nov 13, Main, from the answer key: an Axegrinder hit is the debuff landing, also when a shield soaks it whole; it was a gap of more than 1.5 s between damage ticks) */
  ['Gax3AkbyFRXmdrgQ', 5, 'Axegrinder', 'Vandagos', '13 hits', 'Nov 12 pull 3: the Axegrinder debuff landed on Vandagos 13 times (three of them fully shielded: 1:02, 1:56, 1:57). It read "9 hits"'],
];
/* A player's total on one pull: [code, fight, player, 'damage' or 'healing', at least, at most, what it read before]. */
const METERS = [
  ['agt6jMTyZBYvVzAP', 2, 'Schooty', 'damage', 124e6, 127.5e6, 'Nov 11 pull 1: Schooty did 126M with the 15.1M that went into Veil of Twilight, as Warcraft Logs counts it. It read 111M'],
  ['agt6jMTyZBYvVzAP', 2, 'Zaffia', 'healing', 13.9e6, 14.05e6, 'Nov 11 pull 1: Zaffia healed 13.97M with Cheat Death\'s 1,684,159 absorb. It read 12.29M'],
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
    if (code === 'Gax3AkbyFRXmdrgQ' && fight === 5 && rc && JSON.stringify((rc.orbBy || []).slice().sort()) !== JSON.stringify(['Flëxørçïst', 'Komo'])) say(where, 'root', 'the dropped purple orb\'s cause names ' + ((rc.orbBy || []).join(', ') || 'nobody') + ': it is Komo (it dropped as he died) and Flëxørçïst (his green ran into it)');
    for (const [rc0, rf, grp, who, txt, was] of ROWS) { if (rc0 !== code || rf !== fight) continue; const gg = ((((r.module && r.module.sections) || []).find((x) => x.id === 'avoid') || {}).groups || []).find((x) => x.title === grp), row = gg && (gg.rows || []).find((x) => nm((x[0] || {}).p) === who);
      if (!row || (row[1] || {}).txt !== txt) say(where, 'avoid', was + '. Now: ' + (row ? '"' + (row[1] || {}).txt + '"' : 'no row'));
      else if ((row[1] || {}).bad || (row[1] || {}).warn) say(where, 'avoid', who + '\'s ' + grp + ' row is coloured now: the colour is judged on the older count (the ticks that did damage; for an axe, the gaps between ticks), as the top raids\' line was measured'); }
    for (const [mc, mf, who, what, lo, hi, was] of METERS) { if (mc !== code || mf !== fight) continue; const p = [...r.players.values()].find((x) => nm(x.name) === who), v = p ? (what === 'damage' ? p.damage : p.healing) : null;
      if (v == null || v < lo || v > hi) say(where, 'meters', was + '. Now: ' + (v == null ? 'no such player' : Math.round(v).toLocaleString('en-US'))); }
    for (const [kc, kf, who, at, hit, was] of KILLS) { if (kc !== code || kf !== fight) continue; const d = (r.deaths || []).find((x) => nm(x.player) === who && Math.abs(x.t - at) <= 1.5);
      if (!d || String(d.kill || '') !== hit) say(where, 'deaths', was + '. Now: ' + (d ? '"' + d.kill + '"' : 'no such death')); }
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
