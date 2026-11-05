// Wipe check stories (analysis step 1, Nov 5): each picked wipe as a short story in time order, for Flex's marking page (/?wipecheck on
// a practice link). Only what happened (deaths, the moments that went wrong, phases, battle res), never the engine's own guess at the cause.
//   node tests/wipecheck-stories.js <folder> <out.json> code:fight,code:fight,...
// <folder> holds <code>_<fight>.json (the pull's Warcraft Logs events) and rep_<code>.json (its report). Upload the result with
//   npx wrangler r2 object put debrief-nights/practice-wipecheck/stories.json --file <out.json> --content-type application/json --remote
'use strict';
const fs = require('fs'), path = require('path');
const H = require('./site-helpers.js'), E = H.E, W = require(path.join(__dirname, '..', 'src', 'wcl.js'));
const SITE = H.site(['PROGRESS', 'phSize', 'phShare', 'encLeft', 'shortBoss', 'bossAtV', 'progressOf', 'wclProg', 'pullProg', 'pullPct', 'wipeCharges']);
const [dir, out, list] = process.argv.slice(2);
if (!dir || !out || !list) { console.log('usage: node tests/wipecheck-stories.js <folder> <out.json> code:fight,...'); process.exit(1); }
const T = E.fmtT, nm = (n) => String(n || '').split('-')[0];
const andL = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const reps = new Map(), stories = [];
for (const key of list.split(',').filter(Boolean)) {
  const [code, fight] = key.split(':');
  if (!reps.has(code)) { let r = JSON.parse(fs.readFileSync(path.join(dir, 'rep_' + code + '.json'), 'utf8')); r = r.data || (r.reportData ? r.reportData.report : r); reps.set(code, { r, items: H.pullItems(code, r, W) }); }
  const { items } = reps.get(code), it = items.get(+fight);
  let ev = JSON.parse(fs.readFileSync(path.join(dir, code + '_' + fight + '.json'), 'utf8')); if (!Array.isArray(ev)) ev = ev.events;
  const r = E.analyze(it, W.translate(it, ev), {}); ev = null; if (!r.item) r.item = it; SITE.CACHE.set(it, r);
  const n = it.size || 20, pl = [...r.players.values()], col = new Map(pl.map((p) => [p.name, p.color || ''])), guidN = new Map(pl.map((p) => [p.guid, p.name]));
  const L = [];
  // phases
  for (const ph of ((r.module && !r.module.error && r.module.phases) || []).slice(1)) L.push({ t: ph.start, k: 'phase', txt: (/^Int/i.test(ph.name) ? 'The intermission' : 'Phase ' + String(ph.name).replace(/^P(\d+).*$/, '$1')) + ' started.' });
  // deaths, up to half the raid down (then one line for the rest)
  const ds = (r.deaths || []).slice().sort((a, b) => a.t - b.t); let half = null;
  ds.forEach((d, i) => { if (half == null && i + 1 >= Math.ceil(n / 2)) half = d.t; });
  const shown = ds.filter((d) => half == null || d.t <= half + 2), rest = ds.length - shown.length;
  for (const d of shown) L.push({ t: d.t, k: 'death', who: nm(d.player), c: col.get(d.player) || '', txt: nm(d.player) + ' died to ' + (d.ability || d.killer || 'something') + '.' });
  if (half != null) L.push({ t: half, k: 'half', txt: 'Half the raid was dead (' + Math.ceil(n / 2) + ' of ' + n + ').' });
  if (rest > 0) L.push({ t: ds[ds.length - 1].t, k: 'rest', txt: rest + ' more died after that, the last at ' + T(ds[ds.length - 1].t) + '.' });
  // battle res
  const rz = (r.rezzes || []).filter((x) => x.t > 1).sort((a, b) => a.t - b.t);
  rz.forEach((x, i) => { const left = SITE.wipeCharges(x.t, n, i + 1); L.push({ t: x.t, k: 'rez', txt: nm(guidN.get(x.by) || x.by) + ' used a battle res on ' + nm(guidN.get(x.guid) || x.guid) + ' (' + (left ? left + ' left' : 'none left') + ').' }); });
  // the moments that went wrong: serious ones, one line per mechanic and moment (several players in one line)
  const ms = (r.mistakes || []).filter((q) => q.severity === 'High' && !/^(death|assigned cooldown)$/i.test(q.mechanic) && (half == null || q.t <= half + 5)).sort((a, b) => a.t - b.t), mg = [];
  for (const q of ms) { const g = mg.find((x) => x.m === q.mechanic && q.t - x.t1 <= 6); if (g) { g.t1 = q.t; if (q.player !== 'Raid' && !g.who.includes(nm(q.player))) g.who.push(nm(q.player)); } else mg.push({ m: q.mechanic, t: q.t, t1: q.t, who: q.player === 'Raid' ? [] : [nm(q.player)], d: q.detail }); }
  for (const g of mg.slice(0, 6)) {
    const d = String(g.d || '').replace(/ for [\d,.]+[KM]?(?=[\s.,;)]|$)/g, '').replace(/ \(with [^)]*\)/, '').replace(/\s+/g, ' ').trim(), many = g.who.length > 1;
    const what = many ? d.replace(/their ghost touched another ghost/i, 'their ghosts touched').replace(/^(Their|Was|Took|Got|Stood|Died|Picked|Hit)\b/, (w) => w.toLowerCase()) : d;
    L.push({ t: g.t, k: 'mistake', mech: g.m.replace(/^./, (c) => c.toUpperCase()), txt: g.who.length ? (many ? andL(g.who) + ': ' + what : g.who[0] + ': ' + what.replace(/^./, (c) => c.toLowerCase())) : d });
  }
  L.push({ t: it.duration, k: 'end', txt: 'The pull ended with the ' + (SITE.bossAtV(SITE.pullPct(it)) || 'boss alive') + '.' });
  L.sort((a, b) => a.t - b.t || (a.k === 'end') - (b.k === 'end'));
  const pg = SITE.progressOf(r), wall = new Date(it.wallMs);
  stories.push({ id: key, boss: it.boss, pull: it.pull, date: wall.toLocaleDateString('en-US', { timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric' }),
    dur: T(it.duration), phase: pg && pg.phase ? pg.phase : '', health: SITE.bossAtV(SITE.pullPct(it)), deaths: ds.length, lines: L.map((x) => Object.assign({}, x, { t: T(Math.max(0, x.t)) })) });
  console.log(key, it.boss, 'pull', it.pull, stories[stories.length - 1].date, T(it.duration), stories[stories.length - 1].health, L.length, 'lines');
}
fs.writeFileSync(out, JSON.stringify({ made: new Date().toISOString(), stories }, null, 1));
console.log('wrote', stories.length, 'stories to', out);
