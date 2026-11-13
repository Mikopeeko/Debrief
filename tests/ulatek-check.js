// Ula'tek accuracy checks (Nov 13; Flex: "I care about accuracy", "they keep coming back seems to be my biggest issue").
// The night: Wolfthorn's Nov 12 Mythic progression, report Gax3AkbyFRXmdrgQ, fights 11 to 23 (pulls 1 to 13, all wipes in phase 1). Every wipe was read
// against the raw log and against 20 top Mythic kills. Each check below names the bug it guards and the pull it came from; all of them fail on the code
// before 2026-11-13. The build runs pulls 1, 7 and 12 (contradictions.js QUICK); `node tests/contradictions.js --all` runs all 13.
//   A. The hit that killed a player is never one the whole raid takes (Mephitic Thrash outside the slam, a Spectral Coil's shared hit, Necrotic Vapors, an
//      egg's own Noxious Shell) when a hit they could avoid landed in their last 5 s or dealt the blow. (Pulls 7 to 10 read "Mephitic Thrash killed 10".)
//   B. Toxic Incubation taken by a player who isn't a tank is a raid mistake and turns its card red. (Pull 1: two damage dealers took it, the card read good.)
//   C. A Fester Burst that caught 5 or more players outside the Wretch's bubble has its own raid line. (Pulls 2, 7, 10, 11: 12 to 15 outside, no line.)
//   D. Nobody is told to "get more soakers" for a circle with 6 or more, and a death in a fully soaked circle isn't that player's Spectral Coils mistake.
//      (Pulls 2 and 12: 7 soakers a circle, as top kills have.)
//   E. The root cause is never a Viper's line for deaths to the waves. (Pull 11: "Viper hatched hit the raid, and Jangokin, Volkovod, Komo and 1 more died".)
//   F. Each of the 13 wipes keeps the root cause the raw log shows.
//   G. How it went: the deaths in one row share the hit that killed them. (Pull 12: "Shockabunga and Urgdragon died to Noxious Splash".)
'use strict';
module.exports = function ulatekCheck(NIGHT_R, H, say) {
  const E = H.E, T = E.fmtT, nm = (p) => String(p || '').split('-')[0], lc = (x) => String(x || '').toLowerCase();
  const SITE = H.site(['raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT'], { store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {} });
  const rootOf = (r) => { let ci = null; try { ci = SITE.cutInfo(r); } catch (e) { ci = null; } const c0 = ci && ci.call ? ci.call : ci, cut = c0 && c0.auto ? c0.t : null; return E.rootCause(r, c0 && c0.auto ? { cut, why: c0.why, at: c0.at, mn: c0.mn, ms: c0.ms } : { cut }); };
  const CH = H.site(['deathHit', 'deathHitId', 'MECH_FAM', 'mechFams', 'chainTitleFits', 'deathBrief', 'collapseFrom', 'wipeChain'], { deathVerdict: () => null, cutInfo: (r) => SITE.cutInfo(r), cutT: (r) => SITE.cutT(r), wipeRoot: (r) => rootOf(r),
    keptMistakes: (r) => { const c = SITE.cutT(r); return (r.mistakes || []).filter((m) => m.t <= c + 0.5); }, keptDeaths: (r) => { const c = SITE.cutT(r); return (r.deaths || []).filter((d) => d.t <= c + 0.5); } });
  const SHARED = /^(mephitic thrash|spectral coils|necrotic vapors|noxious shell|stone venom)$/i;
  // F. the Nov 12 night, by fight: the root cause's name, and words its sentence must carry
  /* (Nov 13, round 2, Flex: "blames the right person": pull 3 names Tyralious, 33 yards from her new spot with Vandagos in the beam; pull 5 Vandagos, 17 yards from the new tail with Tyralious on her;
     pulls 7 and 10 say who the Wretch was on) */
  const WANT = { 11: ['Toxic Incubation', /Volkovod and Shockabunga took the Toxic Incubation beam at 0:15 instead of a tank/], 12: ['Caustic Waves', /died to Caustic Waves/], 13: ['Unchecked Rage', /^Tyralious was \d+ yards from Ula'tek \(the other tank was soaking the beam\)/],
    14: ['Caustic Waves', /2 of them were carrying eggs, so 2 Vipers hatched/], 15: ['Rattler Slam', /^Vandagos was \d+ yards from the tail \(the other tank had Ula'tek\)/], 16: ['Rattler Slam', /^Vandagos \(a tank\) died at 1:32/], 17: ['Fester Burst', /was on Vandagos, 12 yards from the tail, inside Mephitic Thrash's 35 yards/],
    18: ['Fester Burst', /6 players were outside the Blightscale Wretch's bubble/], 19: ['Noxious Splash', /Egg carriers Boltzzx and Schooty came within 3 yards/], 20: ['Fester Burst', /was on Phartsy, who isn't a tank, 16 yards from the tail/], 21: ['Caustic Waves', /Jangokin, Volkovod and Komo died to Caustic Waves/],
    22: ['Noxious Splash', /5 Vipers hatched/], 23: ['Blightscale Vipers', /Dragooned's egg/] };
  let n = 0;
  for (const [code, reps] of NIGHT_R) for (const r of reps) { const it = r.item; if (!it || it.boss !== "Ula'tek") continue; n++;
    const pull = "Ula'tek " + it.diff + ' pull ' + it.pull + ' (' + code + ':' + (it.wcl && it.wcl.fight) + ')', mythic = it.diff === 'Mythic', role = (g) => ((r.players && r.players.get(g)) || {}).role || '', secs = (r.module && r.module.sections) || [], sec = (id) => secs.find((s) => s.id === id);
    // A. the hit that killed them
    for (const d of r.deaths || []) { if (!SHARED.test(d.kill || '')) continue; const mx = (r.pMax && r.pMax.get(d.guid)) || 0, hits = (d.recap || []).filter((e) => !e.heal && e.t >= d.t - 5 && e.t <= d.t + 0.2);
      if (lc(d.kill) === 'mephitic thrash') { const th = hits.filter((e) => lc(e.spell) === 'mephitic thrash').map((e) => e.t); if (th.some((t, i) => i && t - th[i - 1] <= 0.6)) continue; } /* (caught in the tail's slam: theirs) */
      const av = hits.filter((e) => e.spell && e.amount > 0 && !SHARED.test(e.spell) && !/^(melee|toxic burn)$/i.test(e.spell)), big = mx ? av.filter((e) => e.amount >= 0.15 * mx).sort((a, b) => b.amount - a.amount)[0] : null, last = (d.recap || []).filter((e) => !e.heal).pop();
      const better = big || (last && av.includes(last) ? last : null);
      if (better) say(pull, 'ulatek', nm(d.player) + ' at ' + T(d.t) + ' reads as killed by ' + d.kill + ', a hit the whole raid takes, though ' + better.spell + ' hit them in their last 5 s (check A)'); }
    if (mythic) {
      // B. the beam is a tank's
      const incS = sec('incub'), incM = (r.mistakes || []).filter((m) => m.player === 'Raid' && /^toxic incubation$/i.test(m.mechanic || '') && / instead of a tank/.test(m.detail || ''));
      for (const row of (incS && incS.rows) || []) { const who = (row[1] && row[1].ps) || [], nt = who.filter((w) => { const p = [...r.players.values()].find((q) => nm(q.name) === nm(w)); return p && p.role !== 'tank'; });
        if (nt.length && (incS.verdict !== 'bad' || !incM.some((m) => Math.abs(m.t - row[0].t) < 3))) say(pull, 'ulatek', 'Toxic Incubation at ' + T(row[0].t) + ' was taken by ' + nt.join(' and ') + ', not a tank, but the card reads ' + incS.verdict + (incM.length ? '' : ' and there is no raid line') + ' (check B)'); }
      // C. a bubble most of the raid missed
      const fx = (r.ulFx && r.ulFx.fester) || [], fbM = (r.mistakes || []).filter((m) => m.player === 'Raid' && /^fester burst$/i.test(m.mechanic || '') && / outside the Blightscale Wretch/.test(m.detail || ''));
      const wr = sec('wretch'); for (const m of fbM) { const o = /^(\d+) players? w/.exec(m.detail || ''); if (!o || +o[1] < 5) say(pull, 'ulatek', 'the Fester Burst line at ' + T(m.t) + ' counts fewer than 5 outside (check C)'); if (wr && wr.verdict !== 'bad') say(pull, 'ulatek', 'a Fester Burst caught ' + (o ? o[1] : 'many') + ' players outside the bubble at ' + T(m.t) + ' but the Wretch card reads ' + wr.verdict + ' (check C)'); }
      { const av = sec('avoid'), g = av && (av.groups || []).find((x) => /^fester burst/i.test(x.title || x.label || '')); const outN = new Map();
        for (const d of r.deaths || []) for (const e of (d.recap || [])) if (!e.heal && lc(e.spell) === 'fester burst' && e.amount > 0.15 * ((r.pMax && r.pMax.get(d.guid)) || 1e12) && role(d.guid) !== 'tank') { const k = Math.round(e.t); outN.set(k, (outN.get(k) || new Set()).add(d.guid)); }
        for (const [k, s] of outN) { const tot = s.size + (outN.get(k - 1) ? outN.get(k - 1).size : 0); if (s.size >= 5 && !fbM.some((m) => Math.abs(m.t - k) <= 2)) say(pull, 'ulatek', s.size + ' players who died had taken a Fester Burst at about ' + T(k) + ', but no raid line says the raid was outside the bubble (check C)'); } }
      // L. Someone else's mistake is never the victim's. (Pull 1: Komo and Urgdragon read "hit by Caustic Waves and died to it" for waves from a beam two damage dealers took;
      //    pulls 7, 10, 11: 13 players each flagged for a Fester Burst with the Wretch held inside Mephitic Thrash's reach.)
      for (const b of incM) { const bad = (r.mistakes || []).filter((m) => m.player !== 'Raid' && !m.others && /^caustic waves$/i.test(m.mechanic || '') && m.t >= b.t - 0.5 && m.t <= b.t + 12); if (bad.length) say(pull, 'ulatek', bad.map((m) => nm(m.player)).join(' and ') + ' carry a Caustic Waves mistake for waves from the beam ' + ((/^(.+?) took the Toxic Incubation beam/.exec(b.detail) || [])[1] || 'a player who isn\'t a tank') + ' took at ' + T(b.t) + ' (check L)'); }
      for (const m of fbM) { if (!/The Wretch was \d+ yards from the tail/.test(m.detail || '')) continue; const g = sec('avoid') && (sec('avoid').groups || []).find((x) => (x.names || []).includes('fester burst')), caught = ((g && g.judge) || []).filter((j) => (j.ts || []).some((t) => t >= m.t - 1 && t <= m.t + 1.5));
        if (caught.length) say(pull, 'ulatek', caught.length + ' players are each flagged for the Fester Burst at ' + T(m.t) + ', though the Wretch was held inside Mephitic Thrash\'s reach and nobody could stand in its bubble (check L)');
        if (!/ It was on [^.]+\./.test(m.detail || '')) say(pull, 'ulatek', 'the Fester Burst line at ' + T(m.t) + ' doesn\'t say who the Wretch was on (check M)'); }
      // M. Whose melee range it was. (Pulls 3, 5, 6, 9: "nobody was in melee range" named nobody; the log shows which tank was free and how far away.)
      for (const m of (r.mistakes || []).filter((x) => x.player === 'Raid' && /^(unchecked rage|rattler slam)$/i.test(x.mechanic || ''))) { const tk = [...r.players.values()].filter((p) => p.role === 'tank'), line = (r.mistakes || []).find((x) => x.player !== 'Raid' && x.mechanic === m.mechanic && Math.abs(x.t - m.t) <= 3 && /^Wasn't in melee range of /.test(x.detail || ''));
        if (line && !tk.some((p) => p.name === line.player)) say(pull, 'ulatek', nm(line.player) + ', who isn\'t a tank, is named for ' + m.mechanic + ' at ' + T(m.t) + ' (check M)'); }
      // N. A Viper is its carrier's when their egg broke just before it shows in the log. (Pull 13: Schooty and Volkovod touched at 2:12, and both Vipers read "an egg on the ground, nobody picked it up";
      //    pulls 1 and 7: an egg 4 to 5 yards from the beam, broken by its waves, read the same.)
      { const carr = new Map(); for (const g of (sec('eggs') || {}).groups || []) for (const row of g.rows || []) { const p = row[1] && row[1].p; if (p) carr.set(nm(p), (carr.get(nm(p)) || 0) + 1); }
        const gnd = (r.mistakes || []).filter((m) => /^viper hatched$/i.test(m.mechanic || '') && m.player === 'Raid' && /or one the log doesn't tie to a carrier/.test(m.detail || ''));
        for (const m of gnd) { const d = (r.deaths || []).filter((x) => x.t >= m.t - 5 && x.t <= m.t - 1 && carr.has(nm(x.player)) && !(r.mistakes || []).some((y) => /^viper hatched$/i.test(y.mechanic || '') && y.player === x.player && Math.abs(y.t - x.t) <= 6)); const sp = (r.mistakes || []).filter((y) => /^noxious splash$/i.test(y.mechanic || '') && y.t >= m.t - 5 && y.t <= m.t - 1 && !(r.mistakes || []).some((z) => /^viper hatched$/i.test(z.mechanic || '') && z.player === y.player && Math.abs(z.t - y.t) <= 6));
          if (sp.length) say(pull, 'ulatek', 'the Viper at ' + T(m.t) + ' reads "an egg on the ground", but ' + nm(sp[0].player) + ' was hit by Noxious Splash ' + (m.t - sp[0].t).toFixed(1) + ' s before and has no Viper of their own (check N)'); } }
      if (code === 'Gax3AkbyFRXmdrgQ' && it.wcl && it.wcl.fight === 23 && !['Schooty', 'Volkovod'].every((n0) => (r.mistakes || []).some((m) => /^viper hatched$/i.test(m.mechanic || '') && nm(m.player) === n0 && /Noxious Splash/.test(m.detail || '') && m.t > 130 && m.t < 137))) say(pull, 'ulatek', 'the Vipers at 2:13 and 2:14 should be Schooty\'s and Volkovod\'s eggs (they touched at 2:12), not eggs on the ground (check N)');
      if (code === 'Gax3AkbyFRXmdrgQ' && it.wcl && (it.wcl.fight === 11 || it.wcl.fight === 17) && !(r.mistakes || []).some((m) => /^viper hatched$/i.test(m.mechanic || '') && m.t > 16 && m.t < 18.5 && /soaked Toxic Incubation: its waves broke it/.test(m.detail || ''))) say(pull, 'ulatek', 'the Viper at 0:17 hatched from an egg a few yards from the beam as its waves went out; it reads as an egg nobody picked up (check N)');
      // D. a full soak
      for (const m of r.mistakes || []) { if (!/^spectral coils$/i.test(m.mechanic || '')) continue; const k = /\((\d+) soakers? in that circle/.exec(m.detail || ''); if (!k || +k[1] < 6) continue;
        if (/more soakers/i.test(m.fix || '')) say(pull, 'ulatek', nm(m.player) + '\'s Spectral Coils line at ' + T(m.t) + ' says "get more soakers" for a circle with ' + k[1] + ' (top kills soak with 7) (check D)');
        if (m.severity === 'High' && m.player !== 'Raid') say(pull, 'ulatek', nm(m.player) + ' has a serious Spectral Coils mistake for dying in a fully soaked circle (' + k[1] + ' soakers) at ' + T(m.t) + ' (check D)'); } }
    if (it.kill) continue;
    let rc = null; try { rc = rootOf(r); } catch (e) { say(pull, 'ulatek', 'the root cause crashed: ' + e.message); continue; } if (!rc) continue;
    // D. (the root cause's own advice)
    if (/more soakers/i.test(rc.next || '') && /with (both circles|the circle) fully soaked/.test(rc.short || '')) say(pull, 'ulatek', 'the root cause says the circles were fully soaked and still says "get more soakers" (check D)');
    { const m = /the circles? had ([\d a-z:,]+?)\.?$/i.exec(String(rc.short || '').split(/\. /)[0]); if (mythic && m && /more soakers/i.test(rc.next || '')) { const ks = (m[1].match(/\b(\d+)(?= soakers?| at )/g) || []).map(Number); if (ks.length && ks.every((k) => k >= 6)) say(pull, 'ulatek', 'the root cause asks for more soakers with ' + ks.join(' and ') + ' in the circles (check D)'); } }
    // E. a Viper's line is not the waves' cause; and no raid-wide hit is the root unless players stood in the slam
    if (/Viper hatched hit the raid/i.test(rc.short || '')) say(pull, 'ulatek', 'the root cause reads "' + rc.short + '" (check E)');
    if (/^(mephitic thrash|necrotic vapors)$/i.test(rc.name || '')) { const slam = (sec('thrash') && (sec('thrash').rows || []).some((x) => x[1] && x[1].bad && Math.abs(x[0].t - rc.t) <= 4)); if (!slam) say(pull, 'ulatek', 'the root cause is ' + rc.name + ', a hit the whole raid takes, with nobody caught in the slam (check A)'); }
    // F. the Nov 12 night's own answers
    if (code === 'Gax3AkbyFRXmdrgQ' && it.wcl && WANT[it.wcl.fight]) { const [name, re] = WANT[it.wcl.fight]; if (rc.name !== name || !re.test(rc.short || '')) say(pull, 'ulatek', 'the root cause should be ' + name + ' (' + re.source.replace(/\\/g, '') + '), it reads "' + rc.name + ': ' + rc.short + '" (check F)'); }
    // G. How it went: one row, one hit
    let ch = null; try { ch = CH.wipeChain(r); } catch (e) { say(pull, 'ulatek', 'How it went crashed: ' + e.message); }
    for (const x of (ch && ch.items) || []) { const dz = x.dz || []; if (dz.length < 2) continue; const hk = new Set(dz.map((d) => lc(CH.deathHit(d)))); if (hk.size > 1) say(pull, 'ulatek', 'How it went at ' + T(x.t) + ' says "' + x.txt + '", but those deaths were to ' + [...hk].join(' and ') + ' (check G)'); }
  }
  // ---- the page's own words (they run with or without the log library) ----
  const fs = require('fs'), path = require('path'), SRC = path.join(__dirname, '..', 'src'), GD = fs.readFileSync(path.join(SRC, 'guides.js'), 'utf8'), WK = fs.readFileSync(path.join(SRC, 'worker_template.js'), 'utf8');
  // P. No stray control characters in the page's code. (Nov 13: the rule that names who failed a job, rcBy, and How it went's "this row is about deaths" test were written with a
  //    backspace character where \b was meant, so on nine bosses no wipe ever said "Caused by <player>" for a raid line, whatever the log proved.)
  for (const f of ['engine.js', 'ui.js', 'guides.js', 'wcl.js', 'shell.html', 'worker_template.js', 'mptab.js', 'sidenav.js']) { let s = ''; try { s = fs.readFileSync(path.join(SRC, f), 'utf8'); } catch (e) { continue; }
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); if (c < 32 && c !== 9 && c !== 10 && c !== 13) { say('the page code', 'ulatek', 'src/' + f + ' line ' + s.slice(0, i).split('\n').length + ' has a control character (code ' + c + ') in "' + s.slice(Math.max(0, i - 20), i + 20).replace(/[\x00-\x1f]/g, '?') + '": a \\b or \\f lost its backslash (check P)'); break; } } }
  { const EN = fs.readFileSync(path.join(SRC, 'engine.js'), 'utf8'); if (!EN.includes('/\\b(missed|didn\'t|did not|failed|forgot|never|no kick|wasn\'t|without)\\b/i')) say('the page code', 'ulatek', 'rcBy\'s rule for who failed a job has changed or lost its word boundaries (check P)'); }
  // H. Why we wiped: the root cause's own Next time always shows. (Pull 2: hidden because How it went opened on another mechanic; an older gap on every boss.)
  if (!H.SH.includes("ln.classList.remove('rwd-gone'); ln.dataset.rc = '1'") || !H.SH.includes("if (l.dataset.rc !== '1') l.classList.add('rwd-gone')")) say('the page code', 'ulatek', 'the root cause\'s Next time can be hidden again when How it went opens on another mechanic (check H)');
  // I. The Mythic guide says where the second Wretch is held and which tank takes each beam. (Pulls 7, 10, 11: held 12 to 24 yards from the tail; 10 of 10 top kills held it by her,
  //    46 to 53 yards from the tail. The guide said the off tank "takes the tail and the Wretch".)
  if (/then takes the tail and the Wretch;/.test(GD)) say('the page code', 'ulatek', 'the Mythic guide\'s tank line says the off tank takes the tail and the Wretch again, which puts the second Wretch by the tail (check I)');
  if (!/holds the second Wretch in front of her, 45 yards or more from the new tail/.test(GD) || !/Second Wretch \(1:12\): its first bubble is at 1:48, 2 seconds after Mephitic Thrash/.test(GD)) say('the page code', 'ulatek', 'the Mythic guide no longer says where the second Wretch is held (by her, 45 yards or more from the new tail) (check I)');
  if (!/soaks the second venom \(1:24\) and goes straight to the new tail/.test(GD)) say('the page code', 'ulatek', 'the Mythic guide no longer says which tank soaks the second venom beam (check I)');
  // J. Coil order: the coil that appears first is soaked first (Flex, Nov 11), with where it has landed as the hint; the Plan names both beams' tanks.
  if (/The right-hand coil always goes first/.test(H.UI) || /the right-hand coil slams first:/.test(GD)) say('the page code', 'ulatek', 'the coil order reads as a fixed side again ("the right-hand coil always goes first"), not "the coil that appears first" (check J)');
  if (!/The second beam \(1:24\) goes to the other tank/.test(H.UI)) say('the page code', 'ulatek', 'the Plan\'s beam job no longer says who takes the second beam (check J)');
  // K. The quiz's question counts match the numbers the Worker gives Discord's preview.
  { const a = GD.indexOf('const GDZ_QUIZ = {'), b = GD.indexOf('const gdzQuizOf'); let Q = null; try { Q = require('vm').runInNewContext(GD.slice(a, b) + ';GDZ_QUIZ'); } catch (e) { say('the page code', 'ulatek', 'the quiz could not be read: ' + e.message); }
    const u = Q && Q["Ula'tek"], wm = /'ulatek\/mythic': (\d+), 'ulatek\/heroic': (\d+)/.exec(WK);
    if (u && wm && (u.m.length !== +wm[1] || u.h.length !== +wm[2])) say('the page code', 'ulatek', 'the Ula\'tek quiz has ' + u.m.length + ' Mythic and ' + u.h.length + ' Heroic questions, the Worker\'s QUIZ_PAGES says ' + wm[1] + ' and ' + wm[2] + ' (check K)');
    if (u && !u.m.some((q) => /second Wretch/i.test(q.q || '') && /45 yards or more from the new tail/.test((q.a || [])[0] || ''))) say('the page code', 'ulatek', 'the Mythic quiz has no question on where the second Wretch is held (check K)'); }
  return n;
};
