// The death rule, applied to the raw facts of one pull (Nov 13; Main's proof-only rule, Flex: "yes"). No site code.
// A death counts against a player only BEFORE the wipe and only WITH PROOF:
//   1. a mistake of their own was part of what killed them: its hit was the killing hit, or its hits in their last 4 s were damage they'd have
//      lived without (more than the killing blow's overkill, and a tenth of their health). In a mass death (3 or more to one hit at once) only
//      the killing hit itself counts. Never while feared or mind controlled.
//   3. walked off the edge: no killing hit, in control (not feared or mind controlled), no knockback in their last 3 s (Main, Nov 13).
//   2. 2 s or more at or under 35% health with their own defensive or Healthstone ready. Whether it "would have saved them" needs a model of
//      each button, which a log alone can't settle, so the key marks these "low" and unsure.
// Before the wipe = fewer than a quarter of the raid had died before them, and it is not after the moment the pull was lost (roots.js: cause.t).
// What counts as a player's own mistake on The Coiled Altar (what they dodge with their own feet): Axegrinder, Noxious Ground, a tank frontal
// on a non-tank, Widow's Kiss / Death's Embrace (not running out), Malevolent Resonance (their ghost touched another), and their own soul
// fragments (Gravebound from their own Gloombomb or their own frontal). Raid damage is nobody's mistake (Venom Rupture, Coalesced Venom,
// Dreadful Presence, Spirit Erasure, Fangs, Retaliatory Malice, Eternal Nightfall, an Execution, the boss's melee).
'use strict';
const OWN_CA = new Set(['Axegrinder', 'Noxious Ground', "Widow's Kiss", "Death's Embrace", 'Malevolent Resonance']),
  FRONTAL = new Set(['Sever', 'Soul Sever', 'Blighted Sever']), NEARORB = new Set(['Volatile Venom', 'Mutagenic Venom']);
const T = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
function deathVerdicts(pull, cause, known) {
  const size = pull.size || 20, q = Math.ceil(size / 4), ca = pull.ca || {}, U = pull.ula, out = [], OWN = OWN_CA;
  for (const d of pull.deaths) {
    const prior = pull.deaths.filter((x) => x !== d && x.t < d.t - 0.05).length;
    const lost = cause && cause.t != null ? cause.t : null, afterQ = !pull.kill && prior >= q, afterLost = lost != null && d.t > lost + 0.75;
    const v = { when: afterQ || afterLost ? 'after' : 'before', whenWhy: afterQ ? prior + ' had died before them (a quarter of the raid is ' + q + ')' : afterLost ? 'after the pull was lost at ' + T(lost) : prior + ' dead before them', verdict: 'none', proof: null, sure: true };
    if (cause && cause.cat === 'reset') { v.fact = 'a reset pull: nothing in it counts'; out.push(v); continue; }
    const cc = d.mc ? 'mind controlled' : d.feared ? 'feared' : null, mass = (d.mass || 1) >= 3, kb = d.killedBy;
    // Ula'tek (the Ula'tek chat's rulings, Nov 13). A player's own: Caustic Waves they could dodge (not the waves off a beam taken inside the raid),
    // Fester Burst when the Wretch's bubble could be reached (roots.js: festerNotReachable), Noxious Splash (both carriers), the slam of Mephitic
    // Thrash (its second hit within half a second; the raid-wide hit never counts), and Rattler Slam for a tank. Never the carried egg's own
    // Noxious Shell, a coil soak, or the raid-wide hits.
    const beamNear = U && (U.beams || []).find((b) => b.nonTanks.length && d.t >= b.t - 0.5 && d.t <= b.t + 7), festerOff = U && cause && cause.festerNotReachable && (U.festerBursts || []).some((b) => b.t > 100 && d.t >= b.t - 0.5 && d.t <= b.t + 6);
    if (U && d.twice && d.twice['Mephitic Thrash'] && d.last4) d.last4['Mephitic Thrash (the slam)'] = [d.twice['Mephitic Thrash'], 1];
    const ownU = (n) => (n === 'Caustic Waves' && !beamNear) || (n === 'Fester Burst' && !festerOff) || n === 'Noxious Splash' || n === 'Mephitic Thrash (the slam)' || (n === 'Rattler Slam' && d.role === 'tank');
    const own = (n) => (U ? ownU(n) : OWN.has(n) || (FRONTAL.has(n) && d.role !== 'tank'));
    if (v.when === 'before') {
      const carried = (list) => (list || []).some((c) => c[1] === d.player && c[0] <= d.t + 0.1 && c[0] + c[2] >= d.t - 4);
      // 1a. their own soul fragments killed them (never when a fragment came from someone else's Gloombomb)
      if (kb === 'Gravebound' && !cc) { const g = (ca.gravebound || []).filter((x) => x.player === d.player && x.t <= d.t + 0.2 && x.t >= d.t - 20).pop(), sr = g && g.src;
        if (g && sr) { const mine = sr.ownBomb + sr.frontal, n3 = 3 * (mine + sr.othersBomb), from = [sr.ownBomb ? 'their own Gloombomb' : '', sr.frontal ? 'a tank frontal' : '', sr.othersBomb ? sr.othersBomb + ' Gloombomb' + (sr.othersBomb > 1 ? 's' : '') + ' that were someone else\'s' : ''].filter(Boolean).join(' and ');
          if (mine && !sr.othersBomb) { v.verdict = 'you'; v.proof = { k: 'mistake', mech: 'Gravebound', names: ['Gravebound', 'soul fragments'], say: 'their own soul fragments (' + g.picked + ' of ' + n3 + ' picked up, from ' + from + ')' }; }
          else if (mine) { /* (Main, Nov 13: only their own fragments are proof. They had 3 a source of their own; a death when the timer ran out is theirs if they picked up fewer than that, a death to a pickup is theirs if it was one of their own) */
            const nOwn = 3 * mine, ranOut = g.for >= 12.5, theirs = ranOut ? g.picked < nOwn : g.picked <= nOwn;
            if (theirs) { v.verdict = 'you'; v.proof = { k: 'mistake', mech: 'Gravebound', names: ['Gravebound', 'soul fragments'], say: 'their own soul fragments (' + g.picked + ' of ' + n3 + ' picked up; ' + nOwn + ' were their own, from ' + from + ')' }; }
            else v.fact = 'picked up as many fragments as were their own (' + g.picked + ' of ' + n3 + '); the rest came from someone else\'s Gloombomb (' + from + ')'; }
          else v.fact = 'Gravebound from ' + from + ' (' + g.picked + ' of ' + n3 + ' picked up)'; } }
      // 1b. a tank who died to the frontal on their own turn (stack 1); on a later stack the swap was missed, which is not theirs
      if (v.verdict === 'none' && FRONTAL.has(kb) && d.role === 'tank' && !cc) { const f = (ca.frontals || []).filter((x) => Math.abs(x.t - d.t) < 1.5 && x.tanks.includes(d.player)).pop(), st = f && f.stacks ? f.stacks[d.player] : null;
        const prev = (ca.frontals || []).filter((x) => x.t < d.t - 1.5 && d.t - x.t < 50 && x.tanks.includes(d.player) && x.tanks.length > 1).pop();
        if (st === 1) { v.verdict = 'you'; v.proof = { k: 'mistake', mech: kb, names: [kb], say: 'took the ' + kb + ' on their own turn (stack 1) and it killed them' }; }
        else if (prev) { v.verdict = 'you'; v.proof = { k: 'mistake', mech: kb, names: [kb], say: 'took the ' + kb + ' on stack ' + st + ': they had also stood in ' + prev.tanks.filter((x) => x !== d.player).join(', ') + '\'s ' + prev.spell + ' at ' + T(prev.t) }; }
        else v.fact = 'took the ' + kb + ' on stack ' + (st || '2 or more') + ': there was no swap'; }
      // 1c. a mistake of their own in their last 4 s (an orb carrier's ring counts only for someone who wasn't carrying that colour)
      if (v.verdict === 'none' && !cc && !v.fact) { const l4 = d.last4 || {}, ownN = (n) => own(n) || (n === 'Mutagenic Venom' && !carried(ca.purplePickups)) || (n === 'Volatile Venom' && !carried(ca.greenPickups));
        const mineNames = Object.keys(l4).filter(ownN), sum = mineNames.reduce((a, n) => a + l4[n][0], 0), n = mineNames.reduce((a, x) => a + l4[x][1], 0);
        const isKill = kb && ownN(kb), enough = !mass && sum > (d.overkill || 0) && sum >= 0.1 * (d.maxHp || 1e12);
        if (mineNames.length && (isKill || enough)) { const top = mineNames.sort((a, b) => l4[b][0] - l4[a][0])[0]; v.verdict = 'you'; v.proof = { k: 'mistake', mech: isKill ? kb : top, names: mineNames.slice(), say: mineNames.map((x) => l4[x][1] + ' ' + x + ' hit' + (l4[x][1] === 1 ? '' : 's') + ' (' + Math.round(l4[x][0] / 1000) + 'k' + (x === kb ? ', the killing hit' : '') + ')').join(' and ') + ' in their last 4 s' };
          if (/Widow's Kiss|Death's Embrace/.test(v.proof.mech)) { v.sure = false; v.note = 'theirs unless the axe was dropped on the raid'; } }
        else { const ring = ['Mutagenic Venom', 'Volatile Venom'].filter((x) => l4[x] && !ownN(x)); if (ring.length) v.fact = 'carried ' + (ring[0] === 'Mutagenic Venom' ? 'a purple' : 'a green') + ' orb: its ring hits its carrier too (died to ' + (kb || 'no killing hit') + ')'; } }
      // 2. sat low with something ready
      if (v.verdict === 'none' && !cc && !mass && (d.lowFor || 0) >= 2) { const ready = (known[d.player] || []).filter((n) => { const u = (d.used || {})[n]; return u == null || d.t - u >= (known.__cd[n] || 1e9); });
        if (ready.length) { v.verdict = 'low'; v.sure = false; v.proof = { k: 'low', secs: d.lowFor, ready, say: d.lowFor + ' s at or under 35% with ' + ready.slice(0, 3).join(', ') + ' not on cooldown (whether it would have saved them is the site\'s call)' }; } }
      // 3. walked off the edge (The Coiled Altar's room: its middle is 0, 1158.6 and its edge about 46 yd out). In control, with no knockback in
      //    the last 3 s. Two or more off the edge within 3 s of each other is the raid jumping to reset: not counted (Main, Nov 13). Carrying an
      //    orb doesn't make running off the platform part of the job (Schooty, Nov 11 pull 2).
      const farOf = (x) => Math.round(Math.max(0, ...[x.pos].concat(x.path4 || []).filter(Boolean).map((p) => Math.hypot(p[0], p[1] - 1158.6))));
      if (v.verdict === 'none' && !kb && !cc && pull.ca && farOf(d) > 50) { const far = farOf(d), others = pull.deaths.filter((x) => x !== d && !x.killedBy && farOf(x) > 50 && Math.abs(x.t - d.t) <= 3);
        if (others.length) v.fact = others.length + ' more went off the edge within 3 s (' + others.map((x) => x.player).join(', ') + '): the raid jumping to reset, not counted';
        else if (!d.knock3) { v.verdict = 'you'; v.proof = { k: 'edge', mech: 'walked off the edge', names: ['walked off the edge', 'off the edge', 'edge'], say: 'walked off the edge in control (' + far + ' yd from the middle, no killing hit, no knockback in their last 3 s)' }; }
        else v.fact = 'knocked off the platform (' + far + ' yd from the middle, an axe in their last 3 s)'; }
      if (U && v.verdict === 'none') { const circle = (U.coils || []).find((c) => c.soakers.includes(d.player) && d.t >= c.t - 1 && d.t <= c.t + 8);
        if (beamNear && beamNear.nonTanks.includes(d.player) && /^Toxic (Incubation|Burn)$/.test(kb || '')) { v.fact = 'the beam went through them: the off tank was not in its line'; v.sure = true; delete v.note; } /* (Main, Nov 13: settled, not counted) */
        else if (kb === 'Caustic Waves' && beamNear) v.fact = 'waves off a beam taken inside the raid (' + beamNear.nonTanks.join(' and ') + ' took it, not a tank)';
        else if (kb === 'Fester Burst' && festerOff) v.fact = 'the Wretch\'s bubble could not be reached (held inside the Thrash\'s 35 yards)';
        else if (kb === 'Spectral Coils' && circle && circle.soakers.length >= 6) v.fact = 'a soaker in a full coil soak (' + circle.soakers.length + ' in the circle)';
        else if (d.last4 && d.last4['Noxious Shell'] && !v.fact && !mass) v.fact = 'died carrying an egg; its own Noxious Shell is not a mistake (died to ' + (kb || 'no killing hit') + ')'; }
      if (v.verdict === 'none' && v.sure && !cc && !mass && (d.lowFor || 0) >= 2) { v.sure = false; v.note = 'sat ' + d.lowFor + ' s at or under 35%; whether something was ready that would have saved them is for the site to judge'; }
      if (v.verdict === 'none') v.fact = v.fact || (cc ? cc + ' when they died' : mass ? 'a mass death (' + d.mass + ' to ' + kb + ' at once)' : kb ? 'no mistake of theirs in the last 4 s (died to ' + kb + ')' : 'no killing hit');
      if (/Guillotine$/.test(kb || '')) { const g = (ca.guillotines || []).filter((x) => x.t <= d.t + 0.5 && d.t - x.t < 12).pop(); const tgt = !g || g.target === d.player; if (tgt) { v.sure = false; v.note = 'the Guillotine target\'s rule is still being written'; } else { v.verdict = 'none'; v.proof = null; v.sure = true; delete v.note; } if (g && v.verdict === 'none') v.fact = (tgt ? 'the ' + g.spell + ' target' : 'a soaker of the ' + g.spell + ': a soaker who dies in the soak is not counted') + ' (' + g.soakers.length + ' soaked)'; }

      if (pull.kill && pull.len - d.t <= 20) { v.sure = false; v.note = 'in the kill\'s last 20 s'; }
    } else v.fact = v.whenWhy;
    out.push(v);
  }
  return out;
}
module.exports = { deathVerdicts };
