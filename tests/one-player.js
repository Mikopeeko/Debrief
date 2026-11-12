// One player's mechanics, checks 9 to 13 of the contradiction check (Nov 12; the guide: notes/Guides/Contradiction check - how it works.md).
// Flex: "in a perfect world, report card would just be pulling the information from summary, report card shouldnt need to analyze anything if
// summary already did it". For every saved night, boss and player, with the page's own code:
//   9. Summary with one player picked: a mechanic row's pulls with mistakes are exactly the pulls whose lines name that player ("Not one
//      person", another player and the ones a mechanic killed don't count), and its words ("Failed · 2 of 4") match those pulls.
//  10. The Report card's Mechanics say what Summary says: the same rows, words, pulls, and flags (Failed ✕, Some mistakes ! or •, Done right ✓).
//      Avoidable damage keeps its own group, and only avoidable hits go in it (a fight check's own mistake is a Summary row).
//  11. No line with an empty slot: "Someone's and one ghosts touched at", "at ,", "for damage", a doubled word.
//  12. Trend words agree with the pulls: no "Getting worse" when the last pulls had no mistakes or fewer than before, no "Getting better" when more.
//  13. What wiped us most, with a player picked: no "0 wipes" rows, no "The other N wipes had no single cause." line.
// It runs against older page code too (it then reads that code's own pieces), so it shows what it would have caught.
'use strict';
module.exports = function onePlayer(NIGHT_R, H, say) {
  const has = (n) => { try { H.grab(n); return true; } catch (e) { return false; } };
  const NEW = has('rcMechRows') && has('mxKind') && has('mechListOf');
  const base0 = ['esc', 'lpAnd', 'andList', 'plural', 'cellTxt', 'rowSay', 'rowText', 'cutModule', 'phSlices', 'lvlJudge', 'avLimAt', 'mechForPlayer', 'mechAcross', 'mxFlag', 'mxTrend', 'secSpec', 'secSpecd', 'NKG', 'NK346', 'NK283', 'nkWord283', 'TOP_MECH', 'topMechOf', 'mechJudge', 'mechTally'];
  const NAMES = base0.concat(NEW ? ['ROW_DIED', 'whoRx', 'rowWho', 'mechRepsFor', 'mechPhRows', 'mechListOf', 'mechGist', 'mechWhy', 'RCM', 'rcMechRows', 'mxKind'] : []);
  const X = H.site(NAMES, { cutT: () => Infinity, keptMistakes: (r) => r.mistakes || [], spellIcon: () => '' });
  /* (and again with a wipe call in every pull, at 60% of it: a set's flag must come from the rows left at the call (Nov 12: Gloombomb pull 6)) */
  const CUT = (r) => (r.duration || 0) * 0.6, X2 = H.site(NAMES, { cutT: CUT, keptMistakes: (r) => (r.mistakes || []).filter((m) => m.t <= CUT(r) + 0.5), spellIcon: () => '' });
  // (older code: All pulls' kind of a mistake was a closure inside nightMechC; read it out of the source)
  const kindOf = NEW ? X.mxKind : (() => { const a = H.UI.indexOf('  const rw2Kind = (t) => {'), b = H.UI.indexOf('  const rw2Facts', a); if (a < 0 || b < 0) return () => '';
    const body = H.UI.slice(a, b).replace(/^\s*const rw2Kind = /, 'return ').trim().replace(/;$/, ''); const f = new Function('rw2Names', body); return (t, rx) => f(rx)(t); })();
  const lo = (n) => String(n || '').split('-')[0];
  const BAD = [[/\bsomeone's\b/i, '"someone\'s"'], [/\ba player's,? (?:or|and) a player's\b/i, '"a player\'s or a player\'s"'],[/(?:\band|,)\s+one\s+ghosts?\b/i, '"one ghost" with its name missing'], [/\bat\s*[,.;:]|\bat\s*$/i, 'a time missing ("at ," / "at.")'], [/\bfor (?:avoidable )?damage\b/i, '"for damage" with its number missing'], [/\b([A-Za-z]{3,})\s+\1\b/i, 'a doubled word']];
  const text = (where, who, t) => { const s = String(t || ''); for (const [re, what] of BAD) { const m = re.exec(s); if (m && !/\b(that that|had had)\b/i.test(m[0])) { say(where, 'one player', who + ': ' + what + ' in "' + s.slice(Math.max(0, m.index - 50), m.index + 50) + '"'); return; } } };
  // (whose mistake a flagged row is, written out again here: the names its line gives outside brackets, less the ones it only says it killed;
  //  else its flagged player cells; names only in brackets are details, so the row's own player ("Soul Sever missed 5 ghosts (A's, B's…)" is
  //  the tank's aim); else its first player; else nobody)
  const DIED = /^\s*[\p{L}'’-]+(?: \d+:\d\d)?(?:\s*(?:,|and)\s*[\p{L}'’-]+(?: \d+:\d\d)?)*,?\s+died\s*$/u;
  const culprits = (s, row, g, rx) => { const fl = row.filter((c) => c && (c.bad || c.warn)); if (!fl.length) return [];
    let line = String(X.rowSay(row) || (g && g.title ? g.title + ', ' : '') + X.rowText(s, row)).replace(/<[^>]+>/g, '');
    const vic = new Set(); for (const c of fl) { if (c.txt != null && DIED.test(String(c.txt))) { for (const n of String(c.txt).match(rx) || []) vic.add(n); line = line.split(String(c.txt)).join(' '); }
      else if (!c.txt && (c.p || c.ps) && /^died$/i.test(String((s.cols || [])[row.indexOf(c)] || ''))) for (const n of c.p ? [c.p] : c.ps) vic.add(lo(n)); }
    let out = line; for (let i = 0; i < 3; i++) out = out.replace(/\([^()]*\)/g, ' ');
    const L = [...new Set(out.match(rx) || [])]; if (L.length) return L.filter((n) => !vic.has(n));
    const nm = fl.filter((c) => c.p || c.ps).flatMap((c) => (c.p ? [c.p] : c.ps)).map(lo); if (nm.length) return [...new Set(nm)];
    if ((line.match(rx) || []).length) { const own = row.find((c) => c && c.p); return own ? [lo(own.p)] : []; }
    const first = row.find((c) => c && c.t == null && !c.map && !c.maps && !c.more); return first && first.p ? [lo(first.p)] : []; };
  // (Summary's rows for one player, from the page's own pieces; older code builds them inline the same way)
  const sumRows = (reps, name, Xv) => { Xv = Xv || X; if (NEW) return Xv.mechListOf(reps, name);
    const mReps = reps.map((r) => (!r.module || r.module.error || !r.module.sections ? r : [...r.players.values()].some((x) => x.name === name) ? { ...r, module: Xv.mechForPlayer(r.module, name, r).m } : { ...r, module: { ...r.module, sections: [] } }));
    const domPh = (x) => (x.ph.size ? [...x.ph].sort((a, b) => b[1] - a[1])[0][0] : null);
    return Xv.mechAcross(mReps).flatMap((x) => { const d = domPh(x); if (x.perPh.size < 2) return [{ x, per: x.per, ph: d, split: false }]; return [...x.perPh].map(([pn, per]) => ({ x, per, ph: pn, split: true })); })
      .filter((o) => o.x.id !== 'avoid' && o.x.id !== 'deaths' && [...o.per.values()].some((p) => p.st !== 'na'))
      .map((o) => { const pts = reps.map((r) => { const p = o.per.get(r.item.pull); return { p: r.item.pull, st: p ? p.st : 'na', v: p && p.sc != null ? Math.round(p.sc) : null }; }); return { ...o, pts, flag: X.mxFlag(pts) }; }); };
  const labelOf = (o) => String(X.secSpecd({ title: o.x.title, spell: o.x.spell }).title).replace(/\s*\(.*$/, '').trim() + (o.split && o.ph ? ' · ' + o.ph : '');
  // 12a. the trend words on made-up pulls (Main's case: the last five clean, the score lower)
  { const P = (st, v) => ({ st, v }), ok = Array.from({ length: 11 }, (x, i) => P('ok', i < 6 ? 100 : 80)), say1 = X.mxTrend(ok, -20);
    if (/Getting worse/.test(say1)) say('trend words', 'one player', 'the last 5 pulls were clean, and the trend says "' + say1 + '"');
    const up = [P('bad', 0), P('bad', 0), P('ok', 100), P('ok', 100), P('ok', 100), P('ok', 100), P('warn', 90), P('warn', 90), P('warn', 90), P('warn', 90), P('warn', 90)], say2 = X.mxTrend(up, 15);
    if (/Getting better/.test(say2)) say('trend words', 'one player', 'the last 5 pulls had more mistakes than before, and the trend says "' + say2 + '"'); }
  { const P = (st) => ({ st }), a = X.mxFlag([P('bad'), P('bad'), P('ok')]), b = X.mxFlag([P('warn'), P('warn')], 'times'), c = X.mxFlag([P('warn'), P('bad'), P('warn')]);
    for (const [g, want] of [[a, /^Failed · 2 of 3 pulls it came up$/], [b, /^Mistakes every time · 2 of 2 times$/], [c, /^Mistakes every time · 3 of 3 pulls it came up$/]]) if (!g || !want.test(g.t)) say('flag words', 'one player', 'a flag reads "' + (g && g.t) + '"'); }
  // 13. What wiped us most with a player picked (shell.html's script reads the coach box on the page, so its code is checked)
  { const sh = H.SH, a = sh.indexOf('var W1 = wipL.map('), b = sh.indexOf('\n', a), w1 = a < 0 ? '' : sh.slice(a, b);
    if (!/\.filter\(function \(x\) \{ return x\.w > 0; \}\)/.test(w1)) say('What wiped us most', 'one player', 'its rows can say "0 wipes" (the coach\'s own tips, with a player picked)');
    if (!/if \(NW && oth > 0 && !oneP\b/.test(sh)) say('What wiped us most', 'one player', 'with a player picked it still says "The other N wipes had no single cause."'); }
  for (const [code, reps0] of NIGHT_R) { const byB = new Map(); for (const r of reps0) { if (!r.module || r.module.error) continue; const k = r.item.boss + ' ' + r.item.diff; const l = byB.get(k) || []; l.push(r); byB.set(k, l); }
    for (const [bk, l] of byB) { const reps = l.slice().sort((u, v) => u.item.pull - v.item.pull), where0 = 'night ' + code + ', ' + bk;
      const ns = [...new Set(reps.flatMap((r) => [...r.players.values()].map((p) => lo(p.name))))].filter((n) => n.length > 2).sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const rx = ns.length ? new RegExp('(?<![\\p{L}\\p{N}])(' + ns.join('|') + ')(?![\\p{L}\\p{N}])', 'gu') : /$^/g, rxK = ns.length ? new RegExp('(' + ns.join('|') + ')', 'g') : null;
      // 11. every flagged line of the night as All pulls' Mistakes list says it (the raid view and every player's)
      for (const r of reps) for (const s of r.module.sections || []) for (const [row, g] of (s.rows || []).map((x) => [x, null]).concat(...(s.groups || []).map((g) => (g.rows || []).map((x) => [x, g])))) {
        if (!row.some((c) => c && (c.bad || c.warn))) continue; const line = X.rowSay(row) || (g ? g.title + ', ' : '') + X.rowText(s, row); text(where0, s.title + ', pull ' + r.item.pull, kindOf(line, rxK)); }
      const players = [...new Map(reps.flatMap((r) => [...r.players.values()]).filter((p) => p.name && !/^Player-/.test(p.name)).map((p) => [p.name, p])).values()];
      for (const p of players) { const me = lo(p.name), where = where0 + ' · ' + me, mine = reps.filter((r) => [...r.players.values()].some((q) => q.name === p.name)); if (!mine.length) continue;
        const SR = sumRows(reps, p.name);
        // 9. each row's pulls with mistakes are the pulls whose lines name them (with and without a wipe call), and its words match those pulls
        for (const [Xv, cutF, tg] of [[X2, CUT, ' (with a wipe call at 60% of each pull)'], [X, null, '']]) for (const o of (Xv === X ? SR : sumRows(reps, p.name, X2))) { const own = o.pts.filter((q) => q.st === 'bad' || q.st === 'warn').map((q) => q.p);
          const want = []; for (const r of mine) { const mod = cutF ? Xv.cutModule(r.module, cutF(r)).m : r.module, s = (mod.sections || []).find((q) => q.id === o.x.id); if (!s) continue; const sl = o.split ? Xv.phSlices(mod, s).get(o.ph) : s; if (!sl) continue;
            const rows = (sl.rows || []).map((x) => [x, null]).concat(...(sl.groups || []).map((g) => (g.rows || []).map((x) => [x, g]))); if (rows.some(([row, g]) => culprits(s, row, g, rx).includes(me))) want.push(r.item.pull); }
          const lab = labelOf(o), a1 = own.filter((q) => !want.includes(q)), a2 = want.filter((q) => !own.includes(q));
          if (a1.length) say(where, 'one player', 'Summary counts ' + lab + ' against them in pull' + (a1.length > 1 ? 's ' : ' ') + a1.join(', ') + ', where its lines don\'t name them' + tg);
          if (a2.length) say(where, 'one player', 'Summary misses ' + lab + ' in pull' + (a2.length > 1 ? 's ' : ' ') + a2.join(', ') + ', where its lines name them' + tg); }
        // 14. a mechanic anyone can walk into (its fine rows list its targets, never this player) counts every pull it came up while they were
        //     alive, never only the pulls it hit them (Nov 12, Flex: "why does this say i got a 0% on those mechanics?", the tank frontal "2 of 2")
        if (NEW) { const fl = (row) => row.some((c) => c && (c.bad || c.warn)), nmd = (c) => c && (c.p || (c.ps && c.ps.length) || (c.pt && c.pt.length)), isMe = (c) => c && (c.p === p.name || (c.ps || []).includes(p.name) || (c.pt || []).some((y) => y[0] === p.name));
          const fineAny = new Set(), fineMe = new Set(); for (const r of reps) for (const s of r.module.sections || []) for (const row of (s.rows || []).concat(...(s.groups || []).map((g) => g.rows || []))) if (!fl(row)) { if (row.some(nmd)) fineAny.add(s.id); if (row.some(isMe)) fineMe.add(s.id); }
          for (const o of SR) { if (!fineAny.has(o.x.id) || fineMe.has(o.x.id)) continue; const Y = o.pts.filter((q) => q.st !== 'na').length, lab = labelOf(o); let want = 0;
            for (const r of mine) { const s = (r.module.sections || []).find((q) => q.id === o.x.id); if (!s) continue; const sl = o.split ? X.phSlices(r.module, s).get(o.ph) : s; if (!sl) continue; const dead = Math.min(Infinity, ...(r.deaths || []).filter((d) => d.player === p.name).map((d) => d.t));
              const ts = (sl.groups || []).map((g) => g.t).concat((sl.rows || []).map((row) => { const c = row.find((q) => q && q.t != null); return c ? c.t : null; })).filter((v) => v != null), unT = (sl.groups || []).some((g) => g.t == null) || (sl.rows || []).some((row) => !row.some((c) => c && c.t != null)), named = (sl.rows || []).concat(...(sl.groups || []).map((g) => g.rows || [])).some((row) => row.some(isMe) || culprits(s, row, null, rx).includes(me));
              if (ts.some((t) => t < dead) || unT || named) want++; }
            if (Y !== want) say(where, 'one player', lab + ' is a mechanic anyone can walk into, so it counts the ' + want + ' pulls it came up while they were alive, but it reads "of ' + Y + '"'); } }
        for (const o of SR) { const own = o.pts.filter((q) => q.st === 'bad' || q.st === 'warn').map((q) => q.p), J = o.pts.filter((q) => q.st !== 'na'), lab = labelOf(o);
          const m = /^(Failed|Some mistakes|Mistakes every time|Done right) · (\d+) of (\d+) pulls it came up$/.exec((o.flag || {}).t || ''), nb = J.filter((q) => q.st === 'bad').length;
          // 15. the flag says what its count counts, never "every pull" (Nov 12, Flex: "it says 2 of 2 pulls, but there were 19 pulls no?", "'mistakes in every pull' very misleading")
          { const t = (o.flag || {}).t || ''; if (/every pull/i.test(t) || /\d+ of \d+\s*$/.test(t)) say(where, 'one player', lab + ' reads "' + t + '": a bare count, or "every pull"'); }
          if (!m || +m[3] !== J.length || +m[2] !== { Failed: nb, 'Some mistakes': own.length, 'Mistakes every time': own.length, 'Done right': J.length - own.length }[m[1]]) say(where, 'one player', lab + ' reads "' + ((o.flag || {}).t || '') + '", but it came up in ' + J.length + ' pulls with mistakes of theirs in ' + own.length);
          // 12b. its trend words, the way the row draws them
          const Jv = o.pts.filter((q) => q.v != null), th = Math.max(2, Math.floor(Jv.length / 3)), avg = (L) => L.reduce((s0, q) => s0 + q.v, 0) / L.length, mv = Jv.length >= 4 ? Math.round(avg(Jv.slice(-th))) - Math.round(avg(Jv.slice(0, th))) : 0, tw = X.mxTrend(o.pts, mv);
          if (tw) { const l5 = Jv.slice(-5), E0 = Jv.slice(0, -5), wr = (L) => L.filter((q) => q.st === 'bad' || q.st === 'warn').length / Math.max(1, L.length);
            if (/Getting worse/.test(tw) && (!wr(l5) || (E0.length && wr(l5) < wr(E0)))) say(where, 'one player', lab + ' says "' + tw + '", but the last pulls had ' + (wr(l5) ? 'fewer mistakes than before' : 'no mistakes'));
            if (/Getting better/.test(tw) && E0.length && wr(l5) > wr(E0)) say(where, 'one player', lab + ' says "' + tw + '", but the last pulls had more mistakes than before'); } }
        // 10. the Report card's Mechanics for them say the same
        const per = mine.map((r) => ({ r, p }));
        let RC; if (NEW) RC = X.rcMechRows(per, p); else { const { mm } = X.mechTally(per, p.name); RC = [...mm].map(([k, o]) => ({ l: k, grp: 'sum', ph: '', pulls: [...o.s].sort((u, v) => u - v), note: '' })); }
        const SL = new Map(SR.map((o) => [labelOf(o), o])), RL = new Map(RC.filter((y) => y.grp === 'sum').map((y) => [String(y.l).replace(/\s*\(.*$/, '') + (y.ph ? ' · ' + y.ph : ''), y]));
        for (const [lab, o] of SL) { const y = RL.get(lab), own = o.pts.filter((q) => q.st === 'bad' || q.st === 'warn').map((q) => q.p); if (!y) { if (own.length) say(where, 'one player', 'Summary lists ' + lab + ' (' + o.flag.t + '), the Report card doesn\'t'); continue; }
          if (String(y.pulls || []) !== String(own)) say(where, 'one player', lab + ': Summary has mistakes in pulls ' + (own.join(', ') || 'none') + ', the Report card in ' + ((y.pulls || []).join(', ') || 'none'));
          if (NEW && String(y.note || '').indexOf(o.flag.t) !== 0) say(where, 'one player', lab + ': Summary reads "' + o.flag.t + '", the Report card "' + y.note + '"');
          if (NEW && ({ bad: ['bad'], warn: ['w', 'n'], ok: ['ok'] }[o.flag.c] || []).indexOf(y.s) < 0) say(where, 'one player', lab + ': Summary\'s ' + o.flag.c + ' flag is ' + y.s + ' on the Report card'); }
        for (const [lab, y] of RL) if (!SL.has(lab) && (y.pulls || []).length) say(where, 'one player', 'the Report card lists ' + lab + ' (pulls ' + y.pulls.join(', ') + '), Summary doesn\'t');
        { const avN = new Set(mine.flatMap((r) => (r.mistakes || []).filter((m) => m.avoidRule).map((m) => m.mechanic))); /* (a fight check's own mistake is a Summary row: it never goes under Avoidable damage too) */
          for (const y of RC.filter((q) => q.grp === 'avoid')) if ((y.pulls || []).length && !avN.has(y.l)) say(where, 'one player', y.l + ' is under Avoidable damage on the Report card, but it is a fight check (Summary lists it)'); }
        // 11. the Report card's sentences for them
        if (NEW) for (const y of RC) { text(where, 'Report card ' + y.l, y.why); text(where, 'Report card ' + y.l, y.note); } } } }
};
