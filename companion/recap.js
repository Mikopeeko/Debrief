// Debrief Companion: turns one read pull into the short recap the addon shows.
// Everything comes from Debrief's own engine and Rotation checks (the same words as the website), cut down to a card.
(() => {
'use strict';
const DIFFN = { 0: 'Practice', 14: 'Normal', 15: 'Heroic', 16: 'Mythic', 17: 'LFR', 233: 'Mythic' };
const mmss = (s) => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const kfmt = (v) => v >= 1e6 ? (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'm' : Math.round(v / 1000) + 'k';
const plain0 = (h) => String(h == null ? '' : h).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
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
  // (the Debriefing summary reads the engine's own wipe filter: each version sets it, and it's put back after)
  let was = null; try { was = W.getCut ? W.getCut() : null; } catch (e) { was = null; }
  try {
    const m = buildOne(b, rep, same, W2, L, 0), nd = (rep.deaths || []).length;
    if (b.kill || b.id === 990001 || !nd) return m; // (a kill or a dummy always counts in full)
    m.cuts = [m]; for (let n = 1; n <= Math.min(8, nd); n++) m.cuts.push(buildOne(b, rep, same, W2, L, n));
    return m;
  } finally { try { if (W.setCut && was != null) W.setCut(was); } catch (e) { /* fine */ } }
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
      d: lastV ? Math.round(100 * (v - lastV) / lastV) : null, vs: last != null ? last : '', best: best != null ? kfmt(best) : '', bp: bp != null ? bp : '', rank: rankIn(p), icon: p.specIcon || '', slips: [], boss: [], surv: [], tiles: [], next: '', next2: '' };
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
    // (the Detailed card (the user's ask, Oct 21: a bigger card that fits more): a second tip, and three small number tiles:
    // avoidable damage and your place, your kicks or dispels against the raid's, and your death)
    P.next2 = tips.slice(1).find((x) => x && x !== P.next) || '';
    const heal = p.role === 'healer', mineK = (heal ? p.dispels : p.interrupts) || 0, raidK = ps.reduce((a, q) => a + ((heal ? q.dispels : q.interrupts) || 0), 0);
    const avRank = ps.filter((q) => (q.avoidable || 0) > avo).length + 1;
    P.tiles = [
      ['Avoidable damage', avo > 0 ? kfmt(avo) : '0', avo > 0 ? ord(avRank) + ' most of ' + ps.length : 'Nice dodging', avo > 0 && ps.length >= 6 && avRank <= 3 ? 'warn' : 'ok'],
      [heal ? 'Dispels' : 'Interrupts', String(mineK), 'raid: ' + raidK, 'ok']];
    players.push(P);
  }
  players.sort((a, c) => (a.role === c.role ? 0 : a.role === 'tank' ? -1 : c.role === 'tank' ? 1 : a.role === 'healer' ? -1 : 1) || a.name.localeCompare(c.name));

  // ---- the raid: top 3 mistakes with names, who died, the next pull ----
  const byMech = new Map();
  for (const m of mist) { if (!m.player) continue; const k = m.mechanic; if (!byMech.has(k)) byMech.set(k, { k, sev: 0, who: new Map(), id: m.id, fix: m.fix, fixRaid: m.player === 'Raid', n: 0 }); const g = byMech.get(k); g.sev = Math.max(g.sev, SEV[m.severity] || 1); g.who.set(m.player, (g.who.get(m.player) || 0) + 1); g.n++; if (m.fix && (!g.fix || (g.fixRaid && m.player !== 'Raid'))) { g.fix = m.fix; g.fixRaid = m.player === 'Raid'; } /* (the fix of a named player's mistake, not of a raid-wide one with the same name) */ if (/\b(hit|walked into|stood|clipped|took|caught)\b/i.test(m.detail || '')) g.hit = true;
    /* (the damage it cost each player, from the mistake's own words: "for 1,065,271 avoidable damage") */ const dm = String(m.detail || '').match(/\bfor ([\d,]{4,})/); if (dm) { g.dmg = g.dmg || new Map(); g.dmg.set(m.player, (g.dmg.get(m.player) || 0) + +dm[1].replace(/,/g, '')); } }
  const top = [...byMech.values()].sort((a, c) => c.sev * c.who.size - a.sev * a.who.size || c.n - a.n).slice(0, 5);
  const raid = { bad: [], died: [], more: '', next: '' };
  const real = new Set(ps.map((p) => p.name));
  for (const g of top) {
    // (a raid-wide mistake has no one to name)
    // (worded as a sentence (the user's note, Oct 21: "not worded well"): "Hit @Jangokin 2 times. Fix: Only the tank belongs in
    // front of the boss." / "Hit 11 players: @Dashtoswirly (3), @Optt (2), @Urgdragon, @Shockabunga and 7 more." / "Hit @Schooty
    // and @Huservoker, 2 times each.")
    const fix = g.fix ? ' Fix: ' + sentences(g.fix)[0] : '';
    // (with the damage each took (the user's idea, Oct 21), the most hurt first: "Hit 17 players: @Larryg 1.1m, @Flëxørçïst 1.07m, ...")
    const dmgOf = (n) => (g.dmg && g.dmg.get(n)) || 0, withDmg = !!g.dmg;
    const ws = [...g.who].filter(([n]) => real.has(n)).sort((a, c) => (withDmg ? dmgOf(c[0]) - dmgOf(a[0]) : 0) || c[1] - a[1]);
    if (!ws.length) { raid.bad.push([g.sev >= 3 ? 'bad' : 'warn', g.id ? String(g.id) : '', g.k, shortTo('Happened ' + (g.n === 1 ? 'once.' : g.n + ' times.') + fix, 190)]); continue; }
    const same = ws.every(([, k]) => k === ws[0][1]), shown = ws.slice(0, 4).map(([n, k]) => '@' + n + (withDmg && dmgOf(n) && ws.length > 1 ? ' ' + kfmt(dmgOf(n)) : !same && k > 1 ? ' (' + k + ')' : ''));
    const one = ws.length === 1 && withDmg && dmgOf(ws[0][0]) ? ', for ' + kfmt(dmgOf(ws[0][0])) : ''; /* ("Hit @Earthday 2 times, for 555k.") */
    const list = ws.length > 4 ? shown.join(', ') + ' and ' + (ws.length - 4) + ' more' : shown.length > 1 ? shown.slice(0, -1).join(', ') + ' and ' + shown[shown.length - 1] : shown[0];
    const times = same && ws[0][1] > 1 ? (ws.length > 1 ? ', ' + ws[0][1] + ' times each' : ' ' + ws[0][1] + ' times') : '';
    const lead = g.hit ? 'Hit ' : 'Went wrong for '; // (not every mistake is a hit: a ghost too far from the clump, a missed soak)
    raid.bad.push([g.sev >= 3 ? 'bad' : 'warn', g.id ? String(g.id) : '', g.k, shortTo(lead + (ws.length > 4 ? ws.length + ' players' + times + ': ' + list : list + times + one) + '.' + fix, 230)]);
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
    // (one table row as a short sentence: what (its first cell, and anyone named), when, then only the parts that went wrong:
    // "Deluge #3 at 1:27: 5 + 6 orbs, too many at once.")
    const real = new Set(ps.map((p) => p.name));
    const cellTxt = (c) => (!c ? '' : c.p ? (real.has(c.p) ? '@' + c.p : c.p) : c.ps ? c.ps.map((n) => (real.has(n) ? '@' + n : n)).join(', ') : c.txt != null ? plain(c.txt) : '');
    const hurt = (c) => c && (c.bad || c.warn);
    const rowBad = (row) => row.some(hurt);
    // (the subject: the row's own label when it leads the row (Deluge #3), else the first player named; other players come after
    // with their column, "(dispelled by @Urgdragon)"; a short wrong part gets its column, "in circle: 0", "removed after: 4.5 s")
    const dull = /^(clean|lived|—|-|ok|done right|yes|no)$/i;
    const rowLine = (row, cols) => {
      const col = (c) => String((cols || [])[row.indexOf(c)] || '').toLowerCase();
      const tc = row.find((c) => c && c.t != null && c.txt == null && !c.p && !c.ps);
      const lead = row[0] && row[0] !== tc && !hurt(row[0]) && !row[0].p && !row[0].ps && cellTxt(row[0]) && !dull.test(cellTxt(row[0])) ? cellTxt(row[0]) : '';
      const names = row.filter((c) => c && (c.p || c.ps) && cellTxt(c)), subj = lead || (names[0] ? cellTxt(names[0]) : '');
      const others = names.filter((c) => lead || c !== names[0]).map((c) => (col(c) && !/^(player|who|tank)$/.test(col(c)) ? col(c) + ' ' : '') + cellTxt(c));
      const wrong = row.filter((c) => hurt(c) && !c.p && !c.ps && cellTxt(c) && !dull.test(cellTxt(c))).map((c) => { const v = cellTxt(c), k = col(c);
        return k && (v.length <= 12 || /^\d/.test(v)) && !k.split(/\s|\//).some((w) => w && v.toLowerCase().includes(w)) && !/^(result|when|)$/.test(k) ? k + ': ' + v : v; }).join(', ');
      return (subj || (tc ? 'At' : '')) + (tc ? (subj ? ' at ' : ' ') + mmss(tc.t) : '') + (wrong ? (subj || tc ? ': ' : '') + wrong : '') + (others.length ? ' (' + others.join(', ') + ')' : '') + '.';
    };
    const empty = (g) => /no adds seen|not reached|nothing to check|didn't happen/i.test(plain(g.title) + ' ' + plain(g.sub || '') + ' ' + (g.rows || []).flat().map(cellTxt).join(' '));
    for (const sec of secs) { try { /* (a line that can't be worded never breaks the card: a plain line instead) */
      if (sec.info || !sec.title) continue; // ("shown, not judged" isn't graded)
      const rows = sec.rows || [], gs0 = sec.groups || [];
      if (sec.id === 'avoid') {
        // (avoidable damage: each source that hurt, how many hits on how many players, and who took the most)
        const inTop = new Set(raid.bad.map((x) => String(x[2]).toLowerCase())), base = (t) => plain(t).replace(/\s*\(.*\)$/, '').toLowerCase();
        for (const g of gs0.filter((x) => (x.bad || x.warn) && !inTop.has(base(x.title))).slice(0, 3)) {
          const nums = (plain(g.sub || '').match(/\d+ hits? on \d+ players?/) || [''])[0], died = (g.rows || []).filter((r) => r.some((c) => c && c.bad && /died/i.test(cellTxt(c)))).length;
          const most = (g.rows || []).slice(0, 3).map((r) => cellTxt(r[0]) + ' ' + (cellTxt(r[1]).match(/\d+/) || [''])[0]).filter((x) => x.trim()).join(', ');
          raid.mech.push([g.bad ? 'bad' : 'warn', spellId(W, plain(g.title).replace(/\s*\(.*\)$/, '')), plain(g.title), shortTo((nums ? nums.replace(/^1 hits/, '1 hit') + (died ? ', ' + died + (died === 1 ? ' death' : ' deaths') : '') + '. ' : '') + (most ? 'Most: ' + most + '.' : ''), 210)]);
        }
        continue;
      }
      const gs = gs0.filter((g) => !empty(g));
      if (gs0.length && !gs.length && !rows.length) continue; // (nothing of it happened this pull, e.g. no adds)
      // (cut by the wipe filter: a mechanic that lost rows or sets is graded on what's left)
      const was = full.find((x) => x.id === sec.id), changed = was && (was.rows || []).length + (was.groups || []).length !== rows.length + gs0.length;
      if (changed && !rows.length && !gs0.length) continue; // (nothing of it happened before the cutoff)
      const badG = gs.filter((g) => g.bad || g.warn), badR = rows.filter(rowBad);
      const verdict = changed ? (rows.flat().some((c) => c && c.bad) ? 'bad' : rows.flat().some((c) => c && c.warn) ? 'warn' : '') : sec.verdict;
      const flag = verdict === 'bad' || gs.some((g) => g.bad) ? 'bad' : verdict === 'warn' || badG.length || badR.length ? 'warn' : 'ok';
      let t;
      if (badG.length) {
        // (sets: the first that went wrong, and what went wrong in it)
        const g = gs.find((x) => x.bad) || badG[0], r = (g.rows || []).find(rowBad);
        t = (gs.length > 1 ? badG.length + ' of ' + gs.length + ' went wrong. ' : '') + plain(g.title) + (g.t != null ? ' at ' + mmss(g.t) : '') + ': ' + (r ? rowLine(r, sec.cols).replace(/^.*?: /, '') : plain(g.sub || 'went wrong.'));
      } else if (badR.length) {
        // (rows: the first that went wrong; two if there's room)
        t = (rows.length > 1 ? badR.length + ' of ' + rows.length + ' went wrong. ' : '') + ((l) => (l.some((x) => /: /.test(x)) ? l.filter((x) => /: /.test(x)) : l))(badR.map((r) => rowLine(r, sec.cols))).slice(0, 2).join(' ') /* (rows that say what went wrong) */;
      } else if (flag !== 'ok') {
        t = sentences(sec.summary || '').filter((x) => !/^(It shows|For each|Each row|How it works)/i.test(x))[0] || 'Some mistakes.';
      } else {
        const n = gs.length || rows.length;
        t = n > 2 ? 'All ' + n + ' done right.' : n === 2 ? 'Both done right.' : 'Done right.';
      }
      // (phase changes: when each phase was pushed, in the pull's own time (the user's ask, Oct 21: "P1 pushed at 2:19"))
      if (sec.id === 'push') {
        const ts = rows.map((row) => { const nm = row[0] && row[0].txt, at = row[1] && row[1].t; if (!nm || at == null) return '';
          const ph = String(nm).split(/\s*→\s*/)[0]; return /→/.test(nm) ? ph + ' pushed at ' + mmss(at) : ph + ' began at ' + mmss(at); }).filter(Boolean);
        t = ts.length ? (flag === 'ok' ? 'Done right. ' : t.replace(/([^.!?])$/, '$1.') + ' ') + ts.join(', ') + '.' : 'Still in P1 when the pull ended (' + mmss(Math.min(T, rep.duration || 0)) + ').';
      }
      raid.mech.push([flag, sec.spell && sec.spell[0] ? String(sec.spell[0]) : '', plain(sec.title), shortTo(t.replace(/\s*\(see How it works\)/gi, '').replace(/\.\./g, '.').trim(), 210)]);
    } catch (e) { raid.mech.push([sec.verdict === 'bad' ? 'bad' : sec.verdict === 'warn' ? 'warn' : 'ok', sec.spell && sec.spell[0] ? String(sec.spell[0]) : '', plain(sec.title || ''), { bad: 'Went wrong.', warn: 'Some mistakes.' }[sec.verdict] || 'Done right.']); } }
    const rank = { bad: 0, warn: 1, ok: 2 }; raid.mech.sort((a, c) => rank[a[0]] - rank[c[0]]); raid.mech = raid.mech.slice(0, 16); /* (every mechanic, and avoidable damage on top) */
  }
  raid.next = b.kill ? (top.length ? 'Kill! Next time: ' + (sentences(top[0].fix || '')[0] || 'clean up ' + top[0].k + '.') : 'Kill! Clean pull.') : (top.length && top[0].fix ? sentences(top[0].fix)[0] : 'Same plan, cleaner.');
  // (the Debriefing tab's own words (the user's ask, Oct 21: the card should show what Debriefing shows): four raid numbers, the pull
  // phase by phase, the fix for next pull, and what's better and worse than last pull)
  raid.tiles = []; raid.story = ''; raid.better = ''; raid.worse = '';
  if (b.id !== 990001) {
    const fails = raid.mech.filter((x) => x[0] === 'bad').length, slips = raid.mech.filter((x) => x[0] === 'warn').length, okN = raid.mech.length - fails - slips;
    let dps = null; try { if (W.setCut) W.setCut(cutN); const A = W.dbfStats ? W.dbfStats(rep) : null; dps = A ? A.dps : null; } catch (e) { dps = null; }
    const first = allDeaths[0];
    raid.tiles = [
      ['Result', b.kill ? 'Kill' : pr && pr.label ? String(pr.label).split(',')[0] /* (the first boss: "P3 · Zul'jan 44%"; The pull has the rest) */ : pct !== '' ? pct + '%' : 'Wipe', h.dur + (b.kill ? ' · kill' : ' · wipe'), b.kill ? 'ok' : ''],
      ['Deaths', String(allDeaths.length), first ? 'first at ' + mmss(first.t) + ' (' + first.player.split('-')[0] + ')' : 'nobody died', allDeaths.length ? 'bad' : 'ok'],
      ['Mechanics', okN + ' clean', slips + ' with mistakes · ' + fails + ' failed', fails ? 'bad' : slips ? 'warn' : 'ok'],
      ['Raid damage', dps ? kfmt(dps) : '—', 'a second', '']];
    try {
      if (W.dbfPull) {
        const prevQ = (same || []).filter((q) => q !== b && q.pull < b.pull).sort((x, y) => y.pull - x.pull).map((q) => L.reps.get(q.startByte)).find((x) => x && x.rep);
        const prev = prevQ ? prevQ.rep : null, pp = prev && W.progressOf ? W.progressOf(prev) : null;
        const delta = pr && pp && pr.left != null && pp.left != null ? pp.left - pr.left : null;
        const D = W.dbfPull({ r: rep, prev, isKey: false, isBest: false, delta, nowLab: (pr && pr.label) || '', prevLab: (pp && pp.label) || '', cd: { ok: 0, n: 0 }, one: null });
        const grab = (html, re) => { const x = String(html || '').match(re); return x ? plain(x[1]) : ''; };
        if (D && !D.reset) {
          raid.story = grab(D.story, /<p>([\s\S]*?)<\/p>/);
          const nx = grab(D.slim, /dbr-nx"><b>Next pull:<\/b>([\s\S]*?)<\/p>/); if (nx && !b.kill) raid.next = nx;
          raid.better = grab(D.slim, /dbr-up"><span>[^<]*<\/span>([\s\S]*?)<\/p>/);
          raid.worse = grab(D.slim, /dbr-dn"><span>[^<]*<\/span>([\s\S]*?)<\/p>/);
        }
      }
    } catch (e) { /* the summary is extra: the card works without it */ }
  }
  // (the Next pull fix isn't said again at the end of a top mistake)
  if (raid.next) raid.bad = raid.bad.map((x) => { const f = ' Fix: ' + raid.next; return String(x[3]).endsWith(f) ? [x[0], x[1], x[2], x[3].slice(0, -f.length)] : x; });
  return { h, players, raid };
};
})();
