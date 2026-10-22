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

// ---- one recipe per boss mechanic (the research, Oct 21: notes/Guides/Debrief in game - mechanic lines research.md) ----
// Each reads the rows the website's check already built and returns one sentence: the problem first, need against did, when and
// who; a clean mechanic in a few words with the number that proves it. null keeps the generic line. Keyed by the check's title.
const andList = (l) => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1]);
const capF = (s) => String(s || '').replace(/^./, (c) => c.toUpperCase());
const ctxt = (c) => (!c ? '' : c.p ? c.p : c.ps ? c.ps.join(', ') : c.txt != null ? plain(c.txt) : '');
const isHurt = (c) => !!(c && (c.bad || c.warn));
const rowsOf = (gs) => gs.flatMap((g) => (g.rows || []).map((r) => ({ g, r })));
const tOf = (r) => { const c = r.find((x) => x && x.t != null); return c ? c.t : null; };
const at = (r) => (tOf(r) != null ? ' at ' + mmss(tOf(r)) : '');
const allN = (n, noun) => (n === 2 ? 'Both ' + noun : 'All ' + n + ' ' + noun);
const RECIPES = {
  // The Coiled Altar
  'Venom orbs': ({ rows }) => {
    const live = rows.filter((r) => !/no frontal/i.test(ctxt(r[2]))), bad = rows.filter((r) => r.some(isHurt));
    if (!bad.length) return live.length > 1 ? allN(live.length, 'Deluges') + ' clean: 5 to 6 orbs per frontal.' : live.length ? 'Clean: 5 to 6 orbs per frontal.' : null;
    const r = bad[0], sub = (r[2] && r[2].sub) || '', sv = [...sub.matchAll(/Sever (\d): (\d+)/g)].map((m) => 'Sever ' + m[1] + ' hit ' + m[2]);
    const plan = (sub.match(/plan: ([^·]+)/) || [])[1], why = /clean/i.test(ctxt(r[3])) ? '' : ctxt(r[3]);
    const planT = plan ? plan.replace(/\s*\(hits empty ground\)/, '').replace(/ each/, '').replace(/\s*\((\d+) at most\)/, ', $1 at most').trim() : '';
    return (rows.length > 1 ? bad.length + ' of ' + rows.length + ' went wrong. ' : '') + ctxt(r[0]).replace('#', '') + at(r) + ': ' + (sv.length ? sv.join(', ') : ctxt(r[2])) + (why ? ', ' + why : '') + (planT ? ' (plan: ' + planT + ')' : '') + '.';
  },
  'Guillotine': ({ rows }) => {
    const it = rows.map((r) => ({ r, name: ((r[1] && r[1].sub) || 'soak').replace(' · ', ', '), n: parseInt(ctxt(r[2]), 10), need: parseInt(((r[2] && r[2].sub) || '').replace(/\D/g, ''), 10) || 5, bad: isHurt(r[2]), target: r[4] && r[4].p, died: (r[6] && r[6].ps) || [] }));
    const bad = it.filter((x) => x.bad || x.died.length);
    if (!bad.length) return it.length > 1 ? allN(it.length, 'soaks') + ' had 5 or more (' + it.map((x) => x.n).join(', ') + ').' : it.length ? 'Soaked with ' + it[0].n + '.' : null;
    const x = bad[0];
    return (it.length > 1 ? bad.length + ' of ' + it.length + ' went wrong. ' : '') + capF(x.name) + at(x.r) + ': ' + x.n + ' in the circle (needs ' + x.need + ')' + (x.died.length ? ', ' + andList(x.died.map((n) => '@' + n)) + ' died' : '') + (x.target ? '. Target @' + x.target : '') + '.';
  },
  'Tank frontals': ({ rows }) => {
    if (!rows.length || !rows[0][2] || !rows[0][2].p) return null;
    const bad = rows.filter((r) => r.some(isHurt));
    if (!bad.length) return rows.length > 1 ? allN(rows.length, 'frontals') + ' taken right: a defensive on every stack 2.' : 'Taken right.';
    const line = (r) => '@' + (r[2].p || '?') + at(r) + ': ' + ctxt(r[3]) + ' with ' + (ctxt(r[4]) || 'nothing up') + (/died/i.test(ctxt(r[5])) ? ', died' : !/nothing/i.test(ctxt(r[4])) ? ' (plan: a defensive and two externals)' : '');
    return bad.length + ' of ' + rows.length + ' went wrong. ' + bad.slice(0, 2).map(line).join('. ') + '.';
  },
  'Phase changes': ({ rows, flag, t, T, dur }) => {
    const ts = rows.map((r) => { const nm = ctxt(r[0]), tt = r[1] && r[1].t; if (!nm || tt == null) return ''; const ph = nm.split(/\s*→\s*/)[0], st = ctxt(r[3]).match(/^(\d+) Venom Rupture \(plan (\d+) to (\d+)\)/);
      return /→/.test(nm) ? ph + ' pushed at ' + mmss(tt) + (st ? ' at ' + st[1] + ' stacks (plan ' + st[2] + '-' + st[3] + ')' : '') : ph + ' began at ' + mmss(tt); }).filter(Boolean);
    return ts.length ? (flag === 'ok' ? 'Done right. ' : String(t).replace(/([^.!?])$/, '$1.') + ' ') + ts.join(', ') + '.' : 'Still in P1 when the pull ended (' + mmss(Math.min(T, dur)) + ').';
  },
  'Dreadmarch': ({ gs }) => {
    if (!gs.length) return null;
    const all = rowsOf(gs), badG = gs.filter((g) => g.bad || g.warn);
    if (!badG.length) return (gs.length > 1 ? allN(gs.length, 'Dreadmarches') + ' done right' : 'Done right') + ': no ghosts touched, every soul fragment picked up.';
    const col = all.filter((x) => /collision/i.test(ctxt(x.r[0]))), grave = all.filter((x) => /Gravebound death/i.test(ctxt(x.r[0])));
    const missed = all.filter((x) => /^Soul Sever$/i.test(ctxt(x.r[0]))).reduce((a, x) => a + (parseInt(ctxt(x.r[3]), 10) || 0), 0), p = [];
    if (col.length) p.push(col.length + (col.length === 1 ? ' ghost collision' : ' ghost collisions'));
    if (grave.length) p.push(grave.length + ' Gravebound ' + (grave.length === 1 ? 'death' : 'deaths') + ' (soul fragments not picked up)');
    if (missed) p.push(missed + (missed === 1 ? ' ghost' : ' ghosts') + ' missed by Soul Sever');
    const f = all.find((x) => x.r.some((c) => c && c.bad)), who = f ? (f.r[2] && f.r[2].ps ? andList(f.r[2].ps.map((n) => '@' + n)) + (/collision/i.test(ctxt(f.r[0])) ? "'s ghosts touched" : '') : f.r[2] && f.r[2].p ? '@' + f.r[2].p + (/Gravebound/.test(ctxt(f.r[0])) ? ' died to Gravebound' : ' ' + ctxt(f.r[3])) : ctxt(f.r[3])) : '';
    return badG.length + ' of ' + gs.length + ' went wrong: ' + (p.length ? andList(p) : plain(badG[0].sub)) + '.' + (f ? ' First: ' + plain(f.g.title).replace('#', '') + at(f.r) + ', ' + who + '.' : '');
  },
  'Soulcoiler adds': ({ gs }) => {
    if (!gs.length) return null;
    const all = rowsOf(gs), wails = all.filter((x) => /Wail of Terror/.test(ctxt(x.r[0]))), thr = wails.filter((x) => !/kicked/i.test(ctxt(x.r[3])));
    const malice = gs.reduce((a, g) => a + (parseInt((plain(g.sub || '').match(/(\d+) deaths? to Retaliatory Malice/) || [])[1], 10) || 0), 0);
    const alive = all.filter((x) => /^Soulcoiler \d+$/.test(ctxt(x.r[0])) && /alive/i.test(ctxt(x.r[3]))), bad = gs.filter((g) => g.bad || g.warn), p = [];
    if (!bad.length) return (gs.length > 1 ? allN(gs.length, 'sets') : 'The set') + ' dead in time, every Wail kicked (' + wails.length + ' kicks).';
    if (thr.length) p.push(thr.length + (thr.length > 1 ? ' Wails' : ' Wail') + ' got through (first' + at(thr[0].r) + ')');
    if (malice) p.push(malice + (malice === 1 ? ' death' : ' deaths') + ' to Retaliatory Malice');
    if (alive.length) p.push(alive.length + (alive.length > 1 ? ' adds' : ' add') + ' still alive');
    return bad.length + ' of ' + gs.length + ' sets went wrong: ' + (p.length ? andList(p) : plain(bad[0].sub)) + '.';
  },
  'Gloombombs': ({ gs }) => {
    if (!gs.length) return null;
    const all = rowsOf(gs), bad = gs.filter((g) => g.bad || g.warn), p = [];
    if (!bad.length) return (gs.length > 1 ? allN(gs.length, 'sets') : 'The set') + ': every bomb on the adds, every Spirit Shield broken.';
    const unb = all.filter((x) => /shield/i.test(ctxt(x.r[0])) && /not broken/i.test(ctxt(x.r[3]))), clips = all.filter((x) => /clip/i.test(ctxt(x.r[0])));
    const miss = gs.reduce((a, g) => { const m = plain(g.sub || '').match(/(\d+) of (\d+) on this set/); return a + (m ? +m[2] - +m[1] : 0); }, 0);
    if (unb.length) p.push(unb.length + (unb.length > 1 ? ' Spirit Shields' : ' Spirit Shield') + ' not broken');
    if (miss) p.push(miss + (miss > 1 ? ' bombs' : ' bomb') + ' off the adds');
    if (clips.length) p.push(andList([...new Set(clips.map((x) => '@' + ctxt(x.r[2])))]) + ' clipped by someone else\'s bomb (first' + at(clips[0].r) + ')');
    return bad.length + ' of ' + gs.length + ' sets went wrong: ' + (p.length ? andList(p) : plain(bad[0].sub)) + '.';
  },
  'Eternal Nightfall': ({ rows }) => {
    if (!rows.length) return null;
    const spare = (r) => parseFloat((ctxt(r[3]).match(/\(([\d.]+) s to spare/) || [])[1]);
    const fail = rows.filter((r) => /not broken|finished/i.test(ctxt(r[3]) + ' ' + ctxt(r[5])));
    if (fail.length) return capF(ctxt(fail[0][0])) + at(fail[0]) + ': not broken, the cast finished.' + (rows.length > 1 ? ' ' + (rows.length - fail.length) + ' of ' + rows.length + ' stopped.' : '');
    const tight = rows.filter((r) => spare(r) < 1.5);
    if (tight.length) return capF(ctxt(tight[0][0])) + at(tight[0]) + ' broke with only ' + spare(tight[0]) + ' s to spare.';
    const s = rows.map(spare).filter((x) => !isNaN(x));
    return (rows.length > 1 ? allN(rows.length, 'shields') + ' broken' : 'The shield was broken') + ' and kicked' + (s.length ? ' (' + s.map((x) => x + ' s').join(', ') + ' to spare)' : '') + '.';
  },
  'Intermission (Stop the fragments)': ({ rows }) => {
    if (!rows.length) return null;
    const thr = rows.filter((r) => /^Round/i.test(ctxt(r[0])) && /\d/.test(ctxt(r[3])) && !/none/i.test(ctxt(r[3]))), over = rows.filter((r) => isHurt(r[2])), peak = Math.max(...rows.map((r) => parseInt(ctxt(r[2]), 10) || 0)), p = [];
    if (!thr.length && !over.length) return 'No fragment got through, every soak round within plan (peak ' + peak + ' stacks).';
    if (thr.length) p.push(capF(ctxt(thr[0][0]).toLowerCase()) + at(thr[0]) + ': ' + ctxt(thr[0][3]) + ' to Zul\'jan');
    if (over.length) { const r = over[0], cds = /cooldowns:/.test((r[2] && r[2].sub) || ''); p.push(capF(ctxt(r[0]).toLowerCase()) + at(r) + ': ' + ctxt(r[2]) + (cds ? ' (plan up to 10 with cooldowns)' : ' with no cooldowns (plan 3 to 5)')); }
    return p.join('. ') + '.' + (thr.length ? '' : ' No fragment got through.');
  },
  'Venomfang': ({ rows }) => {
    if (!rows.length || !rows[0][1] || !rows[0][1].p) return null;
    const s = rows.map((r) => ({ r, v: parseFloat(ctxt(r[2])) })).filter((x) => !isNaN(x.v)).sort((a, b) => b.v - a.v), late = rows.filter((r) => r.some(isHurt)).length;
    if (!s.length) return null;
    if (!late) return (rows.length > 1 ? allN(rows.length, 'dispelled') : 'Dispelled') + ' in time (slowest ' + s[0].v + ' s).';
    const w = s[0];
    return 'Slowest: @' + w.r[1].p + ', ' + w.v + ' s' + at(w.r) + (w.r[3] && w.r[3].p ? ' (dispelled by @' + w.r[3].p + ')' : '') + '. ' + (rows.length - late) + ' of ' + rows.length + ' in time.';
  },
  // every boss
  'Interrupts': ({ rows, gs }) => {
    const all = rows.length ? rows : rowsOf(gs).map((x) => x.r); if (!all.length) return null;
    const thr = all.filter((r) => r.some((c) => c && c.bad));
    if (!thr.length) return (all.length > 1 ? allN(all.length, 'kicked') : 'Kicked') + '.';
    return thr.length + ' got through: ' + andList(thr.slice(0, 2).map((r) => (ctxt(r[1]) || 'a cast') + at(r))) + (thr.length > 2 ? ' and ' + (thr.length - 2) + ' more' : '') + '. ' + (all.length - thr.length) + ' of ' + all.length + ' kicked.';
  },
};

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
    // (Healthstone and health potion as one line: shorter to send and one line less on the card. A Healthstone only counts when a
    // Warlock made them or someone used one)
    const stoneOn = ps.some((q) => q.cls === 'WARLOCK' || (q.cons && q.cons.healthstone.length)), used = [];
    if (stones.length) used.push('Healthstone at ' + times(stones)); if (pots.length) used.push((used.length ? 'potion' : 'Health potion') + ' at ' + times(pots));
    P.surv.push([used.length ? 'ok' : 'info', stones.length && stones[0].id ? String(stones[0].id) : pots.length && pots[0].id ? String(pots[0].id) : stoneOn ? 'inv_stone_04' : 'inv_alchemy_70_red',
      used.length ? used.join(', ') + (stoneOn && !stones.length ? '. No Healthstone.' : !pots.length ? '. No potion.' : '.') : stoneOn ? 'No Healthstone or potion used.' : 'No health potion used.']);
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
  for (const m of mist) { if (!m.player) continue; const k = m.mechanic; if (!byMech.has(k)) byMech.set(k, { k, sev: 0, who: new Map(), id: m.id, fix: m.fix, fixRaid: m.player === 'Raid', n: 0, what: m.player === 'Raid' ? plain(m.detail || '') : '' }); const g = byMech.get(k); g.sev = Math.max(g.sev, SEV[m.severity] || 1); g.who.set(m.player, (g.who.get(m.player) || 0) + 1); g.n++; if (m.fix && (!g.fix || (g.fixRaid && m.player !== 'Raid'))) { g.fix = m.fix; g.fixRaid = m.player === 'Raid'; } /* (the fix of a named player's mistake, not of a raid-wide one with the same name) */ if (/\b(hit|walked into|stood|clipped|took|caught)\b/i.test(m.detail || '')) g.hit = true;
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
    if (!ws.length) { raid.bad.push([g.sev >= 3 ? 'bad' : 'warn', g.id ? String(g.id) : '', g.k, shortTo((g.what ? sentences(g.what)[0].replace(/\.$/, '') + (g.n > 1 ? (/\)$/.test(sentences(g.what)[0].replace(/\.$/, '')) ? ', ' + g.n + ' times.' : ' (' + g.n + ' times).') : '.') : 'Happened ' + (g.n === 1 ? 'once.' : g.n + ' times.')) + fix, 230)]); continue; }
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
      // (a recipe for this mechanic, from the research (notes/Guides/Debrief in game - mechanic lines research.md): its most useful
      // fact first, need against did, when and who. Without one, or if it can't read the rows, the generic line above stays)
      const rc = RECIPES[plain(sec.title)] || RECIPES[plain(sec.title).replace(/\s*\(.*\)$/, '')];
      if (rc) { try { const x = rc({ sec, rows, gs, flag, t, mmss, cellTxt, rowLine, hurt, rowBad, T, dur: rep.duration || 0 }); if (x) t = x; } catch (e) { /* keep the generic line */ } }
      raid.mech.push([flag, sec.spell && sec.spell[0] ? String(sec.spell[0]) : '', plain(sec.title), shortTo(t.replace(/\s*\(see How it works\)/gi, '').replace(/\.\./g, '.').trim(), 230)]);
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
  // (the raid lead's word after the pull (the user's ask, Oct 22: "brief summaries as if you are the raid lead explaining why we
  // wiped"): how far we got, what broke it, the two biggest fixes with who and what to do, and the next pull. "We", short sentences.
  // A death in 2 s or less isn't on the player; a slow one with a defensive or Healthstone still ready is)
  raid.lead = '';
  try {
    // (a fix's first word goes lower case after a colon, unless it's a mechanic's name: "Gloombomb targets move...")
    const names0 = new Set([].concat(...top.map((x) => String(x.k).split(/\s+/)), ...raid.mech.map((x) => String(x[2]).split(/[\s()]+/))));
    const Ld = [], first1 = (s) => (sentences(s || '')[0] || '').trim(), nm = (n) => String(n).split('-')[0];
    const low = (s) => { const t = String(s || '').replace(/\.$/, ''), w = t.split(/\s+/)[0]; return names0.has(w) ? t : t.replace(/^./, (c) => c.toLowerCase()); };
    Ld.push(first1(raid.story) || (b.kill ? 'Boss down on pull ' + b.pull + '. Nice work, everyone.' : 'We wiped' + (pr && pr.label ? ' at ' + String(pr.label).split(',')[0] : '') + '.'));
    if (!b.kill && b.id !== 990001) {
      const ds = allDeaths, wave = (d) => ds.filter((x) => Math.abs(x.t - d.t) <= 5), d0 = ds[0];
      if (d0 && wave(d0).length >= 4) {
        const w = wave(d0), by = new Map(); for (const d of w) { const a = d.ability || 'something'; by.set(a, (by.get(a) || 0) + 1); }
        const ab = [...by].sort((x, y) => y[1] - x[1])[0];
        Ld.push('It fell apart at ' + mmss(d0.t) + ': ' + w.length + ' of us died within seconds, ' + (ab[1] === w.length ? 'all' : 'most') + ' to ' + ab[0] + '.');
      } else if (d0) {
        const own = mist.find((m) => m.player === d0.player && m.t >= d0.t - 10 && m.t <= d0.t + 0.5 && (m.severity !== 'Low' || String(m.mechanic).toLowerCase() === String(d0.ability || '').toLowerCase()));
        const kit = d0.reactable && (d0.available || []).length ? ' with ' + andList(d0.available.slice(0, 2)) + ' still ready' : '';
        Ld.push('It started at ' + mmss(d0.t) + ' when @' + nm(d0.player) + ' died to ' + (d0.ability || 'something') + (own ? ', and that one was avoidable' : kit || (d0.reactable === false ? ', too fast for anyone to react' : '')) + '.');
        const later = ds.find((d) => d.t > d0.t + 5 && wave(d).length >= 4);
        if (later) Ld.push('Then ' + wave(later).length + ' of us went down within seconds at ' + mmss(later.t) + '.');
      } else { const f = raid.mech.find((x) => x[0] === 'bad'); Ld.push(f ? 'Nobody died before the wipe, but ' + f[2].replace(/\s*\(.*\)$/, '') + ' failed.' : 'Nobody died before the wipe.'); }
    }
    const nx1 = first1(raid.next);
    for (const g of top.filter((x) => x.fix && first1(x.fix) !== nx1).slice(0, 2)) {
      const ws = [...g.who.keys()].filter((n) => real.has(n)), who = !ws.length ? '' : ws.length === 1 ? '@' + nm(ws[0]) : ws.length + ' of us';
      Ld.push(g.k + (g.hit ? ' hit ' + (who || 'us') : who ? ' went wrong for ' + who : ' went wrong') + ': ' + low(first1(g.fix)) + '.');
    }
    let nx = String(raid.next || '').replace(/^Kill! /, ''); if (nx.length > 70 && /: /.test(nx)) nx = nx.split(': ')[0] + (/^Next time$/i.test(nx.split(': ')[0]) ? ': ' + nx.split(': ')[1].split(': ')[0] : ''); /* (the short part: the Next pull box has the rest) */
    if (nx && !(b.kill && /^Clean pull/i.test(nx))) Ld.push(b.kill ? nx : 'Next pull: ' + low(nx).replace(/^./, (c) => c.toUpperCase()) + '.');
    raid.lead = Ld.filter(Boolean).join(' ').replace(/\.\./g, '.');
  } catch (e) { raid.lead = ''; }
  // ("You:" for each player: their death, else their first mistake, else their biggest slip, else a clean pull)
  for (const P of players) {
    const d = P.boss.find((x) => x[0] === 'dead'), skip = /^(ability_rogue_sprint|ability_kick|spell_holy_dispelmagic)$/;
    const mm = [...new Set(P.boss.filter((x) => (x[0] === 'bad' || x[0] === 'warn') && !skip.test(x[1] || '')).map((x) => String(x[2]).split(':')[0]))], sl = P.slips.filter((x) => x[0] === 'bad' || x[0] === 'warn').length;
    const bits = []; if (mm.length) bits.push(mm.length + (mm.length === 1 ? ' boss mistake' : ' boss mistakes') + ' (' + andList(mm.slice(0, 2)) + (mm.length > 2 ? ' and more' : '') + ')'); if (sl) bits.push(sl + (sl === 1 ? ' rotation tip' : ' rotation tips'));
    P.lead = (d ? (String(d[2]).match(/^You died at [\d:]+/) || ['You died'])[0] + '. ' : '') + (bits.length ? capF(andList(bits)) + ' below.' : d ? 'Nothing else to fix from you.' : 'Clean pull from you. Same again.');
  }
  // (the Next pull fix isn't said again at the end of a top mistake)
  if (raid.next) raid.bad = raid.bad.map((x) => { const f = ' Fix: ' + raid.next; return String(x[3]).endsWith(f) ? [x[0], x[1], x[2], x[3].slice(0, -f.length)] : x; });
  return { h, players, raid };
};
})();
