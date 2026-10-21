// Debrief Companion: turns one read pull into the short recap the addon shows.
// Everything comes from Debrief's own engine and Rotation checks (the same words as the website), cut down to a card.
(() => {
'use strict';
const DIFFN = { 14: 'Normal', 15: 'Heroic', 16: 'Mythic', 17: 'LFR', 233: 'Mythic' };
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
function deathsOf(W, rep) {
  let l = rep.deaths || [];
  try { const k = W.keptDeaths && W.keptDeaths(rep); if (Array.isArray(k) && k.length) l = k; } catch (e) { /* use all */ }
  return l.slice().sort((a, b) => a.t - b.t);
}

window.DBF_BUILD = (b, rep, same, W, L) => {
  const pr = W.progressOf ? W.progressOf(rep) : null;
  const pct = b.kill ? 0 : pr && pr.left != null ? Math.round(pr.left) : '';
  const allDeaths = deathsOf(W, rep), roleOf = new Map([...rep.players.values()].map((p) => [p.name, p.role]));
  // (deaths have their own lines; a tank's notes on hits tanks take on purpose aren't mistakes)
  const mist = [].concat(rep.mistakes || [], (rep.module && !rep.module.error && rep.module.mistakes) || []).filter((m) => m && m.mechanic !== 'Death' && !/only a note/i.test(m.detail || '') && !(m.tankJudged && roleOf.get(m.player) === 'tank'));
  const h = { boss: b.boss, diff: DIFFN[b.diffId] || b.diff || '', pull: b.pull, kill: !!b.kill, pct, dur: mmss(b.duration || rep.duration),
    where: b.kill ? '' : pr && pr.phase ? String(pr.phase).replace(/^P(\d)$/, 'Phase $1') : '', deaths: (rep.deaths || []).length };

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
      d: lastV ? Math.round(100 * (v - lastV) / lastV) : null, vs: last != null ? last : '', best: best != null ? kfmt(best) : '', bp: bp != null ? bp : '', rank: rankIn(p), icon: p.specIcon || '', slips: [], boss: [], next: '' };
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
    for (const m of own) { if (seen.has(m.mechanic)) continue; seen.add(m.mechanic); if (P.boss.length >= 3) break;
      P.boss.push([flagOf(m.severity), m.id ? String(m.id) : '', shortTo(m.mechanic + ': ' + plain(m.detail || ''), 150)]); if (m.fix) tips.push(sentences(m.fix)[0]); }
    const dd = (rep.deaths || []).filter((d) => d.player === p.name).sort((a, c) => a.t - c.t)[0];
    if (dd) P.boss.push(['dead', deathIcon(dd), 'You died at ' + mmss(dd.t) + (dd.ability ? ' to ' + dd.ability : '') + '.' + (!b.kill && rep.duration - dd.t < 8 ? ' The pull was already lost.' : '')]);
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
  const extra = (rep.deaths || []).length - show.length;
  if (extra > 0) raid.more = '+' + extra + ' more by ' + h.dur + '.';
  else if (b.kill && !D.length) raid.more = 'Nobody died.';
  raid.next = b.kill ? (top.length ? 'Kill! Next time: ' + (sentences(top[0].fix || '')[0] || 'clean up ' + top[0].k + '.') : 'Kill! Clean pull.') : (top.length && top[0].fix ? sentences(top[0].fix)[0] : 'Same plan, cleaner.');
  return { h, players, raid };
};
})();
