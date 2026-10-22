// Debrief Companion: turns one read pull into the short recap the addon shows.
// Everything comes from Debrief's own engine and Rotation checks (the same words as the website), cut down to a card.
(() => {
'use strict';
const DIFFN = { 0: 'Practice', 14: 'Normal', 15: 'Heroic', 16: 'Mythic', 17: 'LFR', 233: 'Mythic' };
const mmss = (s) => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const kfmt = (v) => v >= 1e6 ? (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'm' : Math.round(v / 1000) + 'k';
const plain0 = (h) => String(h == null ? '' : h).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
// (no guide or site names on the card: "Wowhead: ..." and "(Wowhead and Icy Veins)" come out)
const plain = (h) => plain0(h).replace(/\s*\([^()]*(Wowhead|Icy Veins|SimulationCraft|SimC|Raidbots|Archon)[^()]*\)/g, '')
  .replace(/(^|[.!?]\s+)(Both guides|Wowhead|Icy Veins|SimulationCraft|SimC)( and (Icy Veins|Wowhead|SimulationCraft))?:\s*([a-z])?/g, (m, a, b, c, d, e) => a + (e ? e.toUpperCase() : ''))
  .replace(/\s+/g, ' ').trim();
const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const sentences = (s) => (plain(s).match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || []).map((x) => x.trim()).filter(Boolean);
const shortTo = (s, n) => { s = plain(s); if (s.length <= n) return s; const cut = s.slice(0, n); const i = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(', ')); return (i > 40 ? cut.slice(0, i) : cut.replace(/\s+\S*$/, '')) + (i > 40 && cut[i] === '.' ? '.' : '…'); };
const SEV = { High: 3, Medium: 2, Low: 1 };
const flagOf = (sev) => (SEV[sev] || 1) >= 3 ? 'bad' : 'warn';
// per log: each player's number on each pull, for "vs last pull" and "best"
const HIST = window.DBF_HIST = window.DBF_HIST || new Map();

function spellId(W, name) { if (!name) return ''; const id = W.E.SPELLID.get(String(name).toLowerCase()); return id ? String(id) : ''; }
function outOf(rep, p) {
  const heal = p.role === 'healer', arr = heal ? p.healS : p.dmgS; let s = 0;
  if (arr && arr.length) for (const x of arr) s += x || 0; else s = heal ? (p.healing || 0) + (p.absorbs || 0) : (p.damage || 0);
  return s / Math.max(1, rep.duration || 1);
}
// a Rotation check as one short line: "Divine Toll uses: 5 of 7. It sat ready for 78 seconds in all."
function slipLine(c) {
  const v = plain(c.v).replace(/(\d+)\s*\/\s*(\d+)/, '$1 of $2');
  let rest = sentences(c.sub).filter((s) => !/\b(below|above|listed)\b/i.test(s) && !/^Debrief checked/.test(s)); // (pointers to the website's own lists don't fit on a card)
  if (rest.length && /^(You pressed it|You followed|You were casting for|You cast |You had |Debrief checked)/.test(rest[0]) && rest.length > 1) rest = rest.slice(1);
  let t = plain(c.label) + (v ? ': ' + v : '') + '.';
  if (c.k === 'apl' && /%$/.test(v)) t = 'Rotation priority: ' + v + ' of your casts were the best button to press.';
  if (rest.length) t += ' ' + rest[0];
  return shortTo(t, 150);
}
// (melee has no spell of its own: a sword icon, by its file name)
const deathIcon = (d) => d.abilityId === 1 || /^melee$/i.test(d.ability || '') ? 'inv_sword_04' : d.abilityId ? String(d.abilityId) : '';
// The wipe filter (the website's own): on a wipe, stop counting at the Nth death, since what comes after is the wipe, not
// the plan. The card picks the number (Stop at − n +), so the recap is built once per number: 0 (off, the whole pull) to 8.
const cutTime = (rep, n) => { const ds = (rep.deaths || []).slice().sort((a, b) => a.t - b.t); return n && ds.length >= n ? ds[n - 1].t : Infinity; };
const before = (t, T) => t == null || t <= T + 0.05;
// the module's results with everything after the cutoff removed (the website's cutModule): timed rows, sets, phases after it
function cutModule(m, T) {
  if (!isFinite(T)) return m;
  const rowT = (row) => { const c = row.find((x) => x && x.t != null); return c ? c.t : null; };
  const sections = m.sections.map((s) => ({ ...s, rows: (s.rows || []).filter((row) => before(rowT(row), T)),
    groups: (s.groups || []).flatMap((g) => { if (g.recut) { const c = g.recut(T); return c ? [{ ...c, recut: g.recut }] : []; }
      return before(g.t, T) ? [{ ...g, sub: g.cutSub ? g.cutSub(T) : g.sub, rows: (g.rows || []).filter((row) => before(rowT(row), T)) }] : []; }) }));
  return { ...m, sections, phases: (m.phases || []).filter((p) => p.start <= T).map((p) => ({ ...p, end: Math.min(p.end, T) })) };
}

window.DBF_BUILD = (b, rep, same, W, L) => {
  // (Rotation checks are the whole pull: worked out once, shared by every version)
  const memo = new Map(), W2 = Object.assign({}, W, { specRun: (...a) => { const k = a[0] + '|' + a[2]; if (!memo.has(k)) memo.set(k, W.specRun(...a)); return memo.get(k); } });
  const m = buildOne(b, rep, same, W2, L, 0), nd = (rep.deaths || []).length;
  if (b.kill || b.id === 990001 || !nd) return m; // (a kill or a dummy always counts in full)
  m.cuts = [m]; for (let n = 1; n <= Math.min(8, nd); n++) m.cuts.push(buildOne(b, rep, same, W2, L, n));
  return m;
};
function buildOne(b, rep, same, W, L, cutN) {
  const T = cutTime(rep, cutN);
  const pr = W.progressOf ? W.progressOf(rep) : null;
  const pct = b.id === 990001 ? '' : b.kill ? 0 : pr && pr.left != null ? Math.round(pr.left) : ''; // (a practice pull on a dummy has no boss health)
  const allDeaths = (rep.deaths || []).filter((d) => before(d.t, T)).sort((a, c) => a.t - c.t), roleOf = new Map([...rep.players.values()].map((p) => [p.name, p.role]));
  // (deaths have their own lines; a tank's notes on hits tanks take on purpose aren't mistakes)
  const mist = [].concat(rep.mistakes || [], (rep.module && !rep.module.error && rep.module.mistakes) || []).filter((m) => m && m.mechanic !== 'Death' && !/only a note/i.test(m.detail || '') && !(m.tankJudged && roleOf.get(m.player) === 'tank') && before(m.t, T));
  const h = { boss: b.boss, diff: DIFFN[b.diffId] || b.diff || '', pull: b.pull, kill: !!b.kill, pct, dur: mmss(b.duration || rep.duration),
    where: b.kill || b.id === 990001 ? '' : pr && pr.phase ? String(pr.phase).replace(/^P(\d)$/, 'Phase $1') : '', deaths: (rep.deaths || []).length };

  // ---- each player ----
  const key = L.name + '|' + b.id + '|' + b.diffId; if (!HIST.has(key)) HIST.set(key, new Map());
  const H = HIST.get(key), mine = new Map();
  const ps = [...rep.players.values()].filter((p) => p.name && !/^Player-/.test(p.name) && p.specName);
  for (const p of ps) mine.set(p.name, outOf(rep, p));
  H.set(b.pull, mine);
  // (earlier pulls on this boss that were read but never sent still count for "vs last pull" and "best")
  for (const q of same || []) { if (q === b || H.has(q.pull)) continue; const x = L.reps.get(q.startByte); if (!x || !x.rep) continue;
    const mm = new Map(); for (const p of x.rep.players.values()) if (p.name && p.specName) mm.set(p.name, outOf(x.rep, p)); H.set(q.pull, mm); }
  const rankIn = (p) => { const grp = ps.filter((q) => (p.role === 'healer' ? q.role === 'healer' : q.role === 'dps')); if (p.role === 'tank' || grp.length < 2) return '';
    const v = mine.get(p.name), n = grp.filter((q) => mine.get(q.name) > v).length + 1; return ord(n) + ' of ' + grp.length + (p.role === 'healer' ? ' healers' : ' DPS'); };
  const players = [];
  for (const p of ps) {
    const v = mine.get(p.name), prevPulls = [...H.keys()].filter((n) => n < b.pull).sort((x, y) => y - x);
    const last = prevPulls.find((n) => H.get(n).has(p.name));
    const lastV = last != null ? H.get(last).get(p.name) : null;
    let best = null, bp = null; for (const n of prevPulls) { const x = H.get(n).get(p.name); if (x != null && (best == null || x > best)) { best = x; bp = n; } }
    const P = { name: p.name, cls: p.cls || '', spec: p.specName, role: p.role || 'dps', unit: p.role === 'healer' ? 'HPS' : 'DPS', v: kfmt(v),
      d: lastV ? Math.round(100 * (v - lastV) / lastV) : null, vs: last != null ? last : '', best: best != null ? kfmt(best) : '', bp: bp != null ? bp : '', rank: rankIn(p), icon: p.specIcon || '', slips: [], boss: [], surv: [], next: '' };
    // Rotation: the three checks that cost the most (the website's "focus"), or what went right
    let x = null; try { x = W.specRun(p.specName, [rep], p.name, true); } catch (e) { x = null; }
    const tips = [];
    if (x && x.checks) {
      const focus = x.checks.filter((c) => c.st === 'bad' || c.st === 'warn').sort((a, c) => (c.cost || 0) - (a.cost || 0) || (a.st === 'bad' ? -1 : 0) + (c.st === 'bad' ? 1 : 0) || (c.share || 0) - (a.share || 0)).slice(0, 5); // (up to 5: the card shows 1 to 5, as each raider picks)
      for (const c of focus) { P.slips.push([c.st, spellId(W, c.ic), slipLine(c)]); if (c.tip) tips.push(plain(c.tip)); }
      if (!focus.length) { const good = x.checks.filter((c) => c.st === 'ok').slice(0, 2); for (const c of good) P.slips.push(['ok', spellId(W, c.ic), shortTo(plain(c.label) + ': ' + plain(c.v).replace(/(\d+)\s*\/\s*(\d+)/, '$1 of $2') + '.', 120)]); }
    }
    // Boss mechanics: their own mistakes on this pull, then their death
    const own = mist.filter((m) => m.player === p.name).sort((a, c) => (SEV[c.severity] || 0) - (SEV[a.severity] || 0) || a.t - c.t);
    const seen = new Set();
    for (const m of own) { if (seen.has(m.mechanic)) continue; seen.add(m.mechanic); if (P.boss.length >= 5) break;
      P.boss.push([flagOf(m.severity), m.id ? String(m.id) : '', shortTo(m.mechanic + ': ' + plain(m.detail || ''), 150)]); if (m.fix) tips.push(sentences(m.fix)[0]); }
    const dd = allDeaths.filter((d) => d.player === p.name)[0];
    const ready = dd && dd.reactable && (dd.available || []).length ? ' You still had ' + dd.available.slice(0, 3).join(', ').replace(/, ([^,]*)$/, ' and $1') + ' ready.' : '';
    if (dd) P.boss.push(['dead', deathIcon(dd), 'You died at ' + mmss(dd.t) + (dd.ability ? ' to ' + dd.ability : '') + '.' + (!b.kill && rep.duration - dd.t < 8 ? ' The pull was already lost.' : ready)]);
    // (more about your boss play: avoidable damage and where you rank, your kicks and dispels)
    const avo = p.avoidable || 0;
    if (avo > 0) { const ra = ps.filter((q) => (q.avoidable || 0) > avo).length + 1, big = ps.length >= 6;
      P.boss.push([big && ra <= 3 ? 'warn' : 'ok', 'ability_rogue_sprint', 'Avoidable damage taken: ' + kfmt(avo) + (big ? ', ' + ord(ra) + ' most in the raid.' : '.')]); }
    else if (ps.length >= 6 && !own.length) P.boss.push(['ok', 'ability_rogue_sprint', 'No avoidable damage taken. Nice dodging.']);
    if (p.interrupts > 0) P.boss.push(['ok', 'ability_kick', 'Interrupts: ' + p.interrupts + '.']);
    if (p.dispels > 0) P.boss.push(['ok', 'spell_holy_dispelmagic', 'Dispels: ' + p.dispels + '.']);
    // (survival: your defensives, Healthstone and health potion, and a close call you could have answered)
    const defs = (p.defs || []).filter((d) => d.possible > 0);
    if (defs.length) {
      const usedN = defs.reduce((a, d) => a + Math.min(d.uses.length, d.possible), 0);
      P.surv.push([usedN === 0 && (rep.duration || 0) > 60 ? 'warn' : 'ok', defs[0].id ? String(defs[0].id) : '', shortTo('Defensives: ' + defs.map((d) => d.name + ' ' + Math.min(d.uses.length, d.possible) + ' of ' + d.possible).join(', ') + '.', 160)]);
    }
    const stones = (p.cons && p.cons.healthstone) || [], pots = (p.cons && p.cons.healpot) || [];
    const times = (l) => l.slice(0, 3).map((x) => mmss(x.t)).join(', ').replace(/, ([^,]*)$/, ' and $1');
    if (ps.some((q) => q.cls === 'WARLOCK' || (q.cons && q.cons.healthstone.length))) P.surv.push([stones.length ? 'ok' : 'info', stones.length && stones[0].id ? String(stones[0].id) : 'inv_stone_04', stones.length ? 'Healthstone: used at ' + times(stones) + '.' : 'Healthstone: not used.']);
    P.surv.push([pots.length ? 'ok' : 'info', pots.length && pots[0].id ? String(pots[0].id) : 'inv_alchemy_70_red', pots.length ? 'Health potion: used at ' + times(pots) + '.' : 'Health potion: not used.']);
    const missed = (p.closeCalls || []).filter((c) => c.judged && !c.def && !c.stone && !c.pot && c.kitAvail && before(c.tl, T));
    if (missed.length) {
      // (name what was still ready: a Healthstone only when a Warlock made them or someone used one)
      const c = missed[0], hasStone = ps.some((q) => q.cls === 'WARLOCK' || (q.cons && q.cons.healthstone.length)) && !stones.some((u) => u.t < c.t - 2), hasPot = !pots.some((u) => u.t < c.t - 2);
      const kit = hasStone && hasPot ? 'a Healthstone and a potion' : hasStone ? 'a Healthstone' : 'a potion';
      P.surv.push(['warn', hasStone ? 'inv_stone_04' : 'inv_alchemy_70_red', 'You dropped to ' + Math.round(c.low * 100) + '% at ' + mmss(c.tl) + ' and pressed nothing, with ' + kit + ' still ready.' + (missed.length > 1 ? ' It happened ' + (missed.length - 1) + ' more time' + (missed.length > 2 ? 's.' : '.') : '')]);
    }
    P.next = tips[0] || (P.slips.length && P.slips.every((s) => s[0] === 'ok') && !own.length ? 'Clean pull from you. Same again.' : '');
    players.push(P);
  }
  players.sort((a, c) => (a.role === c.role ? 0 : a.role === 'tank' ? -1 : c.role === 'tank' ? 1 : a.role === 'healer' ? -1 : 1) || a.name.localeCompare(c.name));

  // ---- the raid: top 3 mistakes with names, who died, the next pull ----
  const byMech = new Map();
  for (const m of mist) { if (!m.player) continue; const k = m.mechanic; if (!byMech.has(k)) byMech.set(k, { k, sev: 0, who: new Map(), id: m.id, fix: m.fix, n: 0 }); const g = byMech.get(k); g.sev = Math.max(g.sev, SEV[m.severity] || 1); g.who.set(m.player, (g.who.get(m.player) || 0) + 1); g.n++; if (!g.fix && m.fix) g.fix = m.fix; }
  const top = [...byMech.values()].sort((a, c) => c.sev * c.who.size - a.sev * a.who.size || c.n - a.n).slice(0, 5);
  const raid = { bad: [], died: [], more: '', next: '' };
  const real = new Set(ps.map((p) => p.name));
  for (const g of top) {
    // (a raid-wide mistake has no one to name)
    const names = [...g.who].filter(([n]) => real.has(n)).sort((a, c) => c[1] - a[1]).map(([n, k]) => '@' + n + (k > 1 ? ' ' + k : ''));
    if (!names.length) { raid.bad.push([g.sev >= 3 ? 'bad' : 'warn', g.id ? String(g.id) : '', g.k, shortTo(g.n + (g.n === 1 ? ' time. ' : ' times. ') + (g.fix ? sentences(g.fix)[0] : ''), 190)]); continue; }
    const lead = names.length === 1 ? '' : names.length + ' players. ';
    raid.bad.push([g.sev >= 3 ? 'bad' : 'warn', g.id ? String(g.id) : '', g.k, shortTo(lead + (names.length > 4 ? names.slice(0, 4).join(', ') + ' and ' + (names.length - 4) + ' more.' : names.join(', ') + '.') + (g.fix ? ' ' + sentences(g.fix)[0] : ''), 190)]);
  }
  // (deaths that mattered: the first few, before the wipe was called)
  const D = allDeaths; const show = D.slice(0, 8);
  for (const d of show) { const p = [...rep.players.values()].find((q) => q.name === d.player); raid.died.push([mmss(d.t), d.player, (p && p.cls) || '', deathIcon(d), d.ability || 'Unknown']); }
  const extra = D.length - show.length;
  if (extra > 0) raid.more = '+' + extra + ' more by ' + h.dur + '.';
  else if (b.kill && !D.length) raid.more = 'Nobody died.';
  // (how each mechanic went, one line each, from the fight audit: worst first)
  raid.mech = [];
  if (rep.module && !rep.module.error) {
    const full = rep.module.sections || [], secs = isFinite(T) ? cutModule(rep.module, T).sections : full;
    for (const sec of secs) {
      if (sec.id === 'avoid' || sec.info || !sec.title) continue; // (avoidable damage has its own lines; "shown, not judged" isn't graded)
      const gs = sec.groups || [], n = gs.length, bad = gs.filter((g) => g.bad).length, warn = gs.filter((g) => !g.bad && g.warn).length;
      // (cut by the wipe filter: a mechanic that lost rows or sets is graded on what's left, and its whole-pull summary isn't used)
      const was = full.find((x) => x.id === sec.id), changed = was && (was.rows || []).length + (was.groups || []).length !== (sec.rows || []).length + gs.length;
      if (changed && !(sec.rows || []).length && !n) continue; // (nothing of it happened before the cutoff)
      const cells = (sec.rows || []).flat().filter(Boolean), verdict = changed ? (cells.some((x) => x.bad) ? 'bad' : cells.some((x) => x.warn) ? 'warn' : n ? '' : 'ok') : sec.verdict;
      const flag = verdict === 'bad' || bad ? 'bad' : verdict === 'warn' || warn ? 'warn' : 'ok';
      const worst = gs.find((g) => g.bad) || gs.find((g) => g.warn);
      let t = n > 1 ? (n - bad - warn) + ' of ' + n + ' done right. ' : '';
      if (worst) t += plain(worst.title) + (worst.sub ? ': ' + plain(worst.sub) : '.');
      else { const said = changed ? [] : sentences(sec.summary || '').filter((x) => !/^It shows|How it works|against the plan|\bmaps?\b|\brows?\b|\bchart\b|\btable\b|\bbelow\b/i.test(x)); t += said[0] || (n > 1 && flag === 'ok' ? '' : { ok: 'Done right.', warn: 'Some mistakes.', bad: 'Went wrong.' }[flag]); } // (the website's own words about its page don't fit on a card)
      // (phase changes: when each phase was pushed, in the pull's own time (the user's ask, Oct 21: "P1 pushed at 2:19"))
      if (sec.id === 'push') {
        const ts = (sec.rows || []).map((row) => { const nm = row[0] && row[0].txt, at = row[1] && row[1].t; if (!nm || at == null) return '';
          const ph = String(nm).split(/\s*→\s*/)[0]; return /→/.test(nm) ? ph + ' pushed at ' + mmss(at) : ph + ' began at ' + mmss(at); }).filter(Boolean);
        if (ts.length) t = (t.trim() ? t.trim().replace(/([^.!?])$/, '$1.') + ' ' : '') + ts.join(', ') + '.';
      }
      raid.mech.push([flag, sec.spell && sec.spell[0] ? String(sec.spell[0]) : '', plain(sec.title), shortTo(t.replace(/\s*\(see How it works\)/gi, '').trim(), 210)]);
    }
    const rank = { bad: 0, warn: 1, ok: 2 }; raid.mech.sort((a, c) => rank[a[0]] - rank[c[0]]); raid.mech = raid.mech.slice(0, 12);
  }
  raid.next = b.kill ? (top.length ? 'Kill! Next time: ' + (sentences(top[0].fix || '')[0] || 'clean up ' + top[0].k + '.') : 'Kill! Clean pull.') : (top.length && top[0].fix ? sentences(top[0].fix)[0] : 'Same plan, cleaner.');
  return { h, players, raid };
};
})();
