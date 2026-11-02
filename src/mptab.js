// ---------- The Mythic+ tab (Nov 1, Flex: "a Mythic Plus tab to analyze the key run top to bottom ... mechanical execution and failures,
// pull to pull failures, interrupt failures ... a root analysis ... comparing it against top runs or faster runs of the same level") ----------
// The Design studio's round 3, approved ("Looks good"): the banner, What gets you +N ranked by seconds on the timer, slim tiles, Where you fell
// behind (your pulls on the key's timer next to a fast run, then why, stretch by stretch), pull by pull, casts and kicks, deaths and players.
// (the build puts this file inside ui.js's scope, after the guides)
// - The key: a Warcraft Logs report's key (WCL.loadReport lists them as S.index.keys), its events written as WoW writes a key (wcl.js) and
//   read by the PC app's own reader, companion/mplus.js (DBF_MPLUS): the same pulls, deaths, kicks, casts that went off and timer.
// - The fast run: the fastest timed run of the same dungeon and level this season with a public log (Warcraft Logs' speed rankings, through
//   /api/mpfast, kept a day), read the same way. Until it's in, or when there's none, the tab shows without it: never made-up numbers.
// - Players: each one's damage or healing a second against the players of the same spec in the 10 fastest runs.
// - Routes on a map are step 3 (researched apart).
const MP = { item: null, R: {}, busy: new Map(), fast: {}, fastR: {}, err: {}, local: new Map() };
const mpKeys = () => (S.index && S.index.keys) || [];
const mpK = (it) => (it.wcl ? it.wcl.code + ':' + it.wcl.fight : it.shr ? 's:' + it.shr.id + ':' + it.shr.n : 'f:' + it.startMs + ':' + it.startByte);
const mpLc = (s) => String(s || '').toLowerCase().replace(/[’`]/g, '\'');
// (each dungeon's Warcraft Logs encounter, for the fast runs of a key read from a log on this PC or a shared night (Nov 1): zone 55, Midnight Season 2)
const MP_WCLID = { 'altar of fangs': 12993, 'den of nalorakk': 12825, 'kings\' rest': 61762, 'murder row': 12813, 'ruby life pools': 112521, 'temple of sethraliss': 61877, 'the blinding vale': 12859, 'voidscar arena': 12923 };
// (keys from a log on this PC, or from a shared night (Nov 1, Flex: "yea do those two"): the log reader's keys as the tab's items, kept as the
// same objects from one look at the log to the next. A key of a minute or less is one started and reset)
function mpLocalKeys(runs) {
  return (runs || []).filter((r) => r && r.kind === 'run' && (r.shr || r.endByte > r.startByte) && (r.duration || 0) > 60).map((r) => {
    const k = r.shr ? 's:' + r.shr.id + ':' + r.shr.n : 'f:' + r.startMs + ':' + r.startByte; let it = MP.local.get(k);
    if (!it || it.endByte !== r.endByte) { it = { ...r, kind: 'run', id: MP_WCLID[mpLc(r.boss)] || 0, timed: !!r.kill, keyMs: r.timeMs || null, up: 0,
      wallMs: r.wallMs != null ? r.wallMs : r.startMs + new Date(r.startMs).getTimezoneOffset() * 60000 }; MP.local.set(k, it); } /* (log times are the PC's own clock, read as UTC) */
    return it; });
}
const mpMM = (s) => { const neg = s < 0; s = Math.round(Math.abs(s)); return (neg ? '−' : '') + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const mpCC = (cls) => ((E.CLASSES || {})[cls] || [])[1] || 'var(--text)';
const mpWho = (R, n) => { const p = (R.people || []).find((x) => x.name === n); return '<b class="mpt-nm" style="color:' + (p ? mpCC(p.cls) : 'var(--text)') + '">' + esc(n) + '</b>'; };
const MP_ROLE = { tank: '<svg viewBox="0 0 16 16" class="mpt-ro" aria-hidden="true"><path d="M8 1.5 13.5 3.6v4.1c0 3.2-2.4 5.6-5.5 6.8C4.9 13.3 2.5 10.9 2.5 7.7V3.6Z"/></svg>', healer: '<svg viewBox="0 0 16 16" class="mpt-ro" aria-hidden="true"><path d="M6.3 2h3.4v4.3H14v3.4H9.7V14H6.3V9.7H2V6.3h4.3Z"/></svg>', dps: '<svg viewBox="0 0 16 16" class="mpt-ro" aria-hidden="true"><path d="M12.8 1.6 14.4 3.2 6.9 10.7l1.1 1.1-1.2 1.2-1.6-1.6-2.4 2.4-1.3-1.3 2.4-2.4-1.6-1.6 1.2-1.2 1.1 1.1Z"/></svg>' };
const MP_ORDER = ['tank', 'healer', 'dps'], mpByRole = (a, b) => MP_ORDER.indexOf(a.role) - MP_ORDER.indexOf(b.role);
const mpSpecId = (spec, cls) => { for (const [id, s] of Object.entries(E.SPECS || {})) if (s[0] === spec && s[1] === cls) return +id; return 0; };
const mpNorm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
// (the tab: only when the open report has a key)
const MP_TICO = '<svg class="tab-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4.5"/><path d="M12.5 12h9M18.5 12v3.5M15.5 12v2.5"/></svg>';
function mpTabHtml(on) { if (!mpKeys().length) return ''; on = !!on; const tt = 'Your Mythic+ key, top to bottom: what gets you a level up, where you fell behind a fast run, every pull, kick and death';
  return '<button class="tab mpt-tab' + (on ? ' on' : '') + '" data-t="mplus" role="tab" aria-selected="' + on + '" data-tt="' + esc(tt) + '" aria-description="' + esc(tt) + '">' + MP_TICO + 'Mythic+</button>'; }
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.mpt-tab'); if (!b) return; e.preventDefault(); e.stopPropagation(); mpOpen(); }, true);
// (a key picked in the report's list of keys)
document.addEventListener('change', (e) => { const s = e.target; if (!s || s.id !== 'mptPick') return; const it = mpKeys()[+s.value]; if (it) mpOpen(it); });
function mpKeyName(it) { return it.boss + ' +' + it.level + ' · ' + (it.keyMs ? mpMM(it.keyMs / 1000) : 'left early') + (it.keyMs ? (it.timed ? ' · Timed +' + (it.up || mpUp(it)) : ' · Over time') : ''); }
// (levels up from the time and the dungeon's timer (companion/mplus.js), for a key from a log, which has no count of its own)
const mpUp = (it) => { const m = (window.DBF_MPTIMER || {})[mpLc(it.boss)], s = (it.keyMs || 0) / 1000; if (!m || !s) return 1; const P = m * 60; return s <= P * 0.6 ? 3 : s <= P * 0.8 ? 2 : s <= P ? 1 : 0; };

// ---------- reading a key: its events, written as WoW writes a key, then the app's own reader ----------
async function mpRead(it, onStep) {
  const k = mpK(it); if (MP.R[k]) return MP.R[k];
  if (MP.busy.has(k)) { const p0 = MP.busy.get(k); if (onStep) p0.on = onStep; return p0; }
  const p = (async () => {
    await new Promise((r) => setTimeout(r, 0)); /* (p exists from here on) */
    let text;
    if (it.wcl) {
      const est = Math.max(20000, it.duration * 210); /* (about 210 events a second in a key, from a +12 on Warcraft Logs) */
      const ev = await WCL.loadEvents(S.wclCreds, it, (n) => { if (p.on) p.on('Downloading the key…', Math.min(0.9, 0.9 * n / est)); }); /* (page text never names Warcraft Logs: Flex's rule, Oct 19) */
      if (p.on) p.on('Reading the key…', 0.92);
      text = (await WCL.translateAsync(it, ev, () => new Promise((r) => setTimeout(r, 0)))).join('\n');
    } else { /* (a key from a log on this PC or a shared night: its own lines, Nov 1) */
      if (p.on) p.on(it.shr ? 'Downloading the key…' : 'Reading the key from your log…', 0.3);
      text = it.shr ? await shrText(it) : FH.dir ? await fhText(it.startByte, it.endByte) : await S.file.slice(it.startByte, it.endByte).text();
      if (p.on) p.on('Reading the key…', 0.85);
    }
    await new Promise((r) => setTimeout(r, 30));
    const R = window.DBF_MPLUS ? window.DBF_MPLUS(text, E) : null;
    if (!R || !R.pulls || !R.pulls.length) throw new Error('This key has no pulls Debrief could read.');
    await new Promise((r) => setTimeout(r, 0));
    try { mpScan(it, R, text); } catch (e) { console.error(e); R.route = null; } /* (the route, Lust and big cooldowns, from the same lines) */
    MP.R[k] = R; return R;
  })();
  p.on = onStep; MP.busy.set(k, p); p.then(() => MP.busy.delete(k), () => MP.busy.delete(k));
  return p;
}
// (the fast run: the fastest public timed run of this dungeon and level, not this key itself; a report that won't open is skipped)
function mpFastRun(it) {
  const lk = it.id + ':' + it.level;
  if (!MP.fast[lk]) MP.fast[lk] = WCL.mpFast(S.wclCreds, { e: it.id, l: it.level }).catch((e) => ({ error: e.message, runs: [] }));
  return MP.fast[lk].then(async (L) => {
    const med = L.med || 0, cand = (L.runs || []).filter((r) => !(it.wcl && r.code === it.wcl.code && r.fight === it.wcl.fight)).sort((a, b) => Math.abs(a.dur - med) - Math.abs(b.dur - med)).slice(0, 3); /* (a typical fast run: the public one closest to the middle of the 20 fastest (Nov 1, the Design studio's audit)) */
    for (const c of cand) {
      const fk = c.code + ':' + c.fight;
      if (!MP.fastR[fk]) MP.fastR[fk] = (async () => { const rep = await WCL.loadReport(S.wclCreds, c.code), fit = (rep.runs || []).find((x) => x.wcl.fight === c.fight); if (!fit || !fit.keyMs) throw new Error('not a finished key'); return { it: fit, R: await mpRead(fit) }; })();
      try { const got = await MP.fastR[fk]; if (got.R && got.R.run.clock) return { list: L, pick: c, it: got.it, R: got.R }; } catch (e) { /* (the next fastest) */ }
    }
    return { list: L, pick: null, R: null };
  });
}

// ---------- the page ----------
function mpOpen(it) {
  const keys = mpKeys(); if (!it) it = MP.item && keys.includes(MP.item) ? MP.item : keys[keys.length - 1]; if (!it) return;
  if (S.page === 'pull' && S.item) PROG_BACK = S.item; /* (the raid you came from stays one tab away) */
  MP.item = it; S.page = 'mplus'; mpCss();
  for (const id of ['#list', '#bossHead', '#bossPick']) { const el = $(id); if (el) el.innerHTML = ''; }
  { const oa = $('#oaTop'); if (oa) { oa.innerHTML = ''; oa.hidden = true; } }
  $('#main').innerHTML = pgTabBar(null) + '<section id="view" class="mpt-page"><div class="mpt">' + mpShareHtml(it) + mpPickHtml(it) + '<div id="mptBody"></div></div></section>';
  { const nav = $('#main .pg-tabbar nav'); if (nav && !nav.querySelector('.mpt-tab')) nav.insertAdjacentHTML('beforeend', mpTabHtml()); const t = nav && nav.querySelector('.mpt-tab'); if (t) { t.classList.add('on'); t.setAttribute('aria-selected', 'true'); } }
  try { navNote(); } catch (e) { /* (no address) */ } window.scrollTo(0, 0);
  const k = mpK(it), body = () => (MP.item === it && S.page === 'mplus' ? $('#mptBody') : null);
  if (MP.R[k]) { mpDraw(); return; }
  const b0 = body(); if (b0) b0.innerHTML = '<div class="mpt-load">' + loadCard('Opening your key', 'Downloading the key…', 0, 'mptLd') + '</div>';
  delete MP.err[k];
  mpRead(it, (line, frac) => { const b = body(); if (b && typeof loadSet === 'function') loadSet(b, line, frac); }).then(() => { if (body()) mpDraw(); })
    .catch((err) => { MP.err[k] = err.message; const b = body(); if (b) b.innerHTML = '<div class="mpt-err"><b>Couldn\'t read this key.</b> ' + esc(err.message) + '</div>'; });
}
// (Share, for a key read from a log on this PC (Nov 1): the same share as a raid night, keys and all, so the link opens on the Mythic+ tab)
function mpShareHtml(it) { if (!it || it.wcl || it.shr || typeof shrOk !== 'function' || !shrOk()) return '';
  const v = shrSaved(), left = shrMine().filter((b) => !(v && v.sent[shrIdent(b)])).length, done = v && !left;
  return '<div class="mpt-shr"><span><b>' + (done ? 'Shared' : 'Share this key') + '</b> ' + (done ? 'Anyone with the link can see it. Copy the link to send it.' : 'Read from your PC, so this page\'s address won\'t open for anyone else. Get a link anyone can open, on a PC or phone.') + '</span>' +
    '<button class="btn sm' + (done ? '' : ' primary') + '" type="button" data-shr="1">' + (done ? 'Copy link' : 'Share') + '</button></div>'; }
function mpPickHtml(it) { const keys = mpKeys(); if (keys.length < 2) return '';
  return '<div class="mpt-pick"><label for="mptPick">' + keys.length + ' keys in this report</label><select id="mptPick">' + keys.map((x, i) => '<option value="' + i + '"' + (x === it ? ' selected' : '') + '>' + esc(mpKeyName(x)) + '</option>').join('') + '</select></div>'; }
function mpDraw() {
  const it = MP.item, R = it && MP.R[mpK(it)], b = $('#mptBody'); if (!R || !b || S.page !== 'mplus') return;
  const fx = MP.fastOf && MP.fastOf.k === mpK(it) ? MP.fastOf : null;
  const was = [...b.querySelectorAll('details.mpt-fold[open]')].map((d) => d.id); /* (a section you opened stays open when the fast run arrives) */
  b.innerHTML = mpHtml(it, R, fx);
  for (const id of was) { const d = document.getElementById(id); if (d) d.open = true; }
  try { refreshIcons(); } catch (e) { /* (icons load later) */ }
  try { mpLabelFit(); } catch (e) { /* (labels stay as drawn) */ }
  mpJbTop();
  if (!fx) { const mine = it; MP.fastOf = { k: mpK(it), wait: true };
    mpFastRun(it).then((F) => { if (MP.item !== mine) return; MP.fastOf = { k: mpK(mine), ...F }; mpDraw(); }).catch(() => { if (MP.item !== mine) return; MP.fastOf = { k: mpK(mine), R: null, list: null }; mpDraw(); }); }
}
// (the address: ?report=…&fight=…&tab=mplus opens this key again)
async function mpGo(code, fight) {
  if (S.wclCode !== code || !S.index) { let creds = null; try { creds = await wclCreds(); } catch (e) { creds = null; } await openWcl({ code, fight }, creds); return; }
  const it = mpKeys().find((x) => x.wcl.fight === fight); if (it) mpOpen(it); else home();
}
const mpWantTab = (code) => { try { return RQ.get('tab') === 'mplus' && RQ.get('report') === code; } catch (e) { return false; } };

// ---------- the numbers ----------
// (the key's timer: it starts after the countdown, and each death adds its penalty where it happened (15 s at +12 on Flex's keys, measured
// from the time WoW wrote at the end); tv(t) is the timer at a moment of the log)
function mpClock(R) { const ck = R.run.clock; if (!ck) return null;
  const D = R.pulls.flatMap((p) => p.deaths.map((d) => d.t)).sort((a, b) => a - b), pen = D.length ? ck.deathCost / D.length : 0;
  let T0 = R.run.end + ck.deathCost - ck.time; if (!(T0 >= 0 && T0 <= 30)) T0 = 10;
  return { ck, pen, T0, tv: (t) => t - T0 + pen * D.filter((x) => x < t).length }; }
// (stretches: from the start (or a boss) to the next boss: the pulls in it, the time fighting, the deaths and the time between pulls)
function mpStretches(R, C) { const P = R.pulls, out = []; let from = C.T0, fromName = 'Start', fi = 0;
  P.forEach((b, bi) => { if (!b.boss || b.kill === false) return; /* (a boss you wiped on, or reset, is part of the stretch to its kill) */ const ps = P.slice(fi, bi + 1), d = ps.reduce((a, p) => a + p.deaths.length, 0), fight = ps.reduce((a, p) => a + p.dur, 0), wall = b.e - from;
    const tr = ps.filter((p) => !p.boss); /* (trash and the boss apart (the Design studio's hard-key pass): at +19 the boss fights are a big share of the key) */
    out.push({ name: fromName + ' → ' + b.boss, boss: b.boss, n: ps.length, nt: tr.length, fight, trash: tr.reduce((a, p) => a + p.dur, 0), bossT: fight - tr.reduce((a, p) => a + p.dur, 0), tries: ps.length - tr.length, d, pen: d * C.pen, stand: Math.max(0, wall - fight), t: wall + d * C.pen, first: ps[0].n, last: b.n, at: C.tv(b.e) }); from = b.e; fromName = b.boss; fi = bi + 1; });
  return out; }
// (a wipe: the whole group dead within 45 seconds; its deaths, from the first one, and which death started it)
function mpWipe(p, n) { const dd = p.deaths.slice().sort((a, b) => a.t - b.t);
  for (let i = 0; i < dd.length; i++) { const w = dd.filter((d, j) => j >= i && d.t <= dd[i].t + 45); if (new Set(w.map((d) => d.who)).size >= n) return { first: dd[i], list: w }; }
  return null; }
// (what gets you the next level: each fix's seconds on the timer, biggest first. A wipe: every death in it. Deaths to the same spell. A
// must-kick cast that went off with a kick ready and killed someone. Casts that went off without killing anyone save casts, not seconds)
function mpFixes(R, C, all) {
  const P = R.pulls, n = Math.max(1, (R.people || []).length), pen = Math.round(C.pen) || 15, out = [], used = new Set();
  const roleOf = (w) => ((R.people || []).find((p) => p.name === w) || {}).role || '';
  for (const p of P) { const wp = mpWipe(p, n); if (!wp) continue;
    const dd = wp.list; dd.forEach((d) => used.add(d)); const f = wp.first, tank = roleOf(f.who) === 'tank';
    out.push({ s: dd.length * pen, t: 'Don\'t wipe on ' + (p.boss ? esc(p.boss) : 'pull ' + p.n), plus: 'plus the run back',
      d: (tank ? 'Your tank ' : '') + mpWho(R, f.who) + ' died first, to <b class="mpt-ab">' + esc(f.to) + '</b>' + (f.defs ? '.' : ', with <b class="mpt-bad">no defensive</b>.') + ' Everyone else was dead ' + Math.max(1, Math.round(dd[dd.length - 1].t - f.t)) + ' s later.' }); }
  // (a must-kick cast and the deaths it caused: the same spell from the same kind of enemy, in a pull where it went off with a kick ready)
  const thr = new Map(); for (const p of P) for (const t of p.through) { const k = t.spell + '|' + t.mob, o = thr.get(k) || { spell: t.spell, mob: t.mob, n: 0, pulls: new Set() }; o.n++; o.pulls.add(p.n); thr.set(k, o); }
  const by = new Map(), rest = []; for (const p of P) for (const d of p.deaths) { if (used.has(d) || !d.to || d.to === 'unknown') { if (!used.has(d)) rest.push({ ...d, pull: p.n }); continue; } const k = thr.get(d.to + '|' + d.from), key = k && k.pulls.has(p.n) ? 'k|' + d.to + '|' + d.from : 'd|' + d.to, o = by.get(key) || { to: d.to, k: key[0] === 'k' ? k : null, list: [] }; o.list.push({ ...d, pull: p.n }); by.set(key, o); }
  for (const o of by.values()) { const names = [...new Set(o.list.map((d) => d.who))], killed = names.map((w) => mpWho(R, w)).join(' and '), times = o.list.length;
    if (o.k) { o.k.done = true; const pl = [...o.k.pulls]; out.push({ s: times * pen, t: 'Kick ' + esc(o.to) + (pl.length === 1 ? ' in pull ' + pl[0] : ''), d: 'It went off ' + plural(o.k.n, 'time') + ' with a kick ready, and killed ' + killed + (times > names.length ? ' ' + (times === 2 ? 'twice' : times + ' times') : '') + '.' }); }
    else if (times >= 2) out.push({ s: times * pen, t: plural(times, 'death') + ' to ' + esc(o.to), d: 'Who died: ' + o.list.map((d) => mpWho(R, d.who) + ' <span class="mpt-m">(pull ' + d.pull + ')</span>').join(', ') + '. Each death put ' + pen + ' s on the timer.' });
    else rest.push(...o.list); }
  out.sort((a, b) => b.s - a.s);
  // (Lust that missed your biggest pulls (Nov 1): only when it's clear in the log: no Lust went on a boss or on either of your two biggest trash
  // pulls (what they counted toward the 100%, else the damage the group took). It saves time we can't measure, so no seconds)
  { const L = R.lust || [], rt = R.route && R.route.ok ? R.route : null, trash = P.map((p, k) => ({ p, k, v: rt ? rt.pulls[k].add : (R.taken || [])[k] || 0 })).filter((x) => !x.p.boss).sort((a, b) => b.v - a.v), top = trash.slice(0, 2);
    const amt = (x) => (rt ? Math.round(100 * x.v / rt.full) + '% of the enemies' : Math.round(x.v / 1e6) + 'M damage taken');
    if (L.length && top.length && top[0].v > 0 && !L.some((l) => P[l.pull] && (P[l.pull].boss || top.some((x) => x.k === l.pull)))) {
      const on = L.map((l) => { const x = trash.find((y) => y.k === l.pull); return 'pull ' + P[l.pull].n + (x ? ' (' + amt(x) + ')' : ''); });
      out.push({ s: 0, ns: 'timing', t: 'Lust on your biggest pulls', d: 'Lust went on ' + on.join(' and ') + '. Your biggest pull was pull ' + top[0].p.n + ' (' + amt(top[0]) + ').' }); } }
  // (then must-kick casts that went off without killing anyone: fewer casts, not seconds)
  const wiped = new Set(P.filter((p) => mpWipe(p, n)).map((p) => p.n));
  const bySp = new Map(); for (const p of P) for (const t of p.through) { const k = thr.get(t.spell + '|' + t.mob); if (!k || k.done) continue; const o = bySp.get(t.spell) || { spell: t.spell, n: 0, pulls: new Map() }; o.n++; o.pulls.set(p.n, (o.pulls.get(p.n) || 0) + 1); bySp.set(t.spell, o); }
  for (const k of [...bySp.values()].filter((x) => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 2)) { const pl = [...k.pulls.keys()], [bp, bn] = [...k.pulls].sort((a, b) => b[1] - a[1])[0];
    out.push({ s: 0, ns: 'fewer casts', t: 'Kick ' + esc(k.spell), d: 'It went off ' + plural(k.n, 'time') + ' with a kick ready' + (pl.length === 1 && wiped.has(bp) ? ', all in the pull ' + bp + ' wipe' : pl.length > 1 && bn * 2 >= k.n && wiped.has(bp) ? ', ' + bn + ' of them in the pull ' + bp + ' wipe' : pl.length <= 3 ? ', in ' + (pl.length === 1 ? 'pull ' : 'pulls ') + pl.join(', ').replace(/, (\d+)$/, ' and $1') : ', across ' + pl.length + ' pulls') + '.' }); }
  // (last, the deaths left, one to each cause, as one line)
  const more = out.some((x) => x.s > 0); /* ("more" only after other deaths above it) */
  if (rest.length) out.push({ s: rest.length * pen, t: more ? (rest.length === 1 ? 'One more death' : plural(rest.length, 'more death')) : (rest.length === 1 ? 'One death' : plural(rest.length, 'death')), d: rest.sort((a, b) => a.t - b.t).map((d) => mpWho(R, d.who) + ' to <b class="mpt-ab">' + esc(d.to || 'unknown') + '</b> <span class="mpt-m">(pull ' + d.pull + ')</span>').join(', ') + '.' });
  return all ? out : out.slice(0, 3); }

// ---------- the parts, top to bottom ----------
function mpHtml(it, R, fx) {
  const C = mpClock(R), ck = C && C.ck, run = R.run, F = fx && fx.R ? fx.R : null, FC = F ? mpClock(F) : null, waiting = !fx || fx.wait;
  const date = it.wallMs ? new Date(it.wallMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const pull = (n) => R.pulls.find((p) => p.n === n);
  // the banner
  /* (the cushion (the Design studio's hard-key pass): the time under the limit you beat, amber under 90 s; over time, by how much, in red) */
  const sp = (v) => (v < 60 ? Math.round(v) + ' s' : mpMM(v)), lim = ck ? (ck.up === 3 ? ck.par * 0.6 : ck.up === 2 ? ck.par * 0.8 : ck.par) : 0;
  const pill = run.left || !run.timeMs ? '<span class="mpt-pill">Left early</span>' : ck && ck.up === 0 ? '<span class="mpt-pill mpt-b">' + sp(ck.time - ck.par) + ' over</span>' : ck ? '<span class="mpt-pill ' + (lim - ck.time < 90 ? 'mpt-a' : 'mpt-g') + '">Timed +' + ck.up + ' · ' + sp(lim - ck.time) + ' to spare</span>' : run.timed ? '<span class="mpt-pill mpt-g">Timed</span>' : '<span class="mpt-pill mpt-b">Over time</span>';
  const ban = '<div class="mpt-ban"><div class="mpt-kb">+' + run.level + '</div><div class="mpt-bt"><p class="mpt-k">Mythic+' + (date ? ' · ' + esc(date) : '') + '</p><h1>' + esc(run.dungeon || it.boss) + '</h1><div class="mpt-pills">' + pill +
    (ck ? '<span class="mpt-pill">' + mpMM(ck.time) + ' of ' + mpMM(ck.par) + '</span>' : run.timeMs ? '<span class="mpt-pill">' + mpMM(run.timeMs / 1000) + '</span>' : '') + '</div></div>' +
    '<div class="mpt-grp">' + R.people.slice().sort(mpByRole).map((p) => '<span class="mpt-gm" style="color:' + mpCC(p.cls) + '"' + mpT1(esc(p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || ''))) + '>' + (MP_ROLE[p.role] || '') + '<b>' + esc(p.name) + '</b></span>').join('') + '</div></div>';
  if (!C) return ban + '<p class="mpt-note">' + (run.left || !run.timeMs ? 'This key was left before the end, so there\'s no timer to judge. Everything that happened is below.' : 'Debrief doesn\'t know this dungeon\'s timer yet. Everything that happened is below.') + '</p>' + mpJumpBar(R, false) + mpRouteHtml(R, null, false) + mpPulls(R, null, null, null) + mpCasts(R) + mpPlayers(R, fx, waiting);
  // what gets you the next level
  const T = ck.time, P = ck.par, lv = ck.up, tgt = lv === 0 ? P : lv === 1 ? P * 0.8 : lv === 2 ? P * 0.6 : null, need = tgt != null ? Math.max(1, Math.round(T - tgt)) : 0; /* (as the timer shows it: 24:06 against 24:00 is 6 s) */
  const head = lv === 0 ? 'What gets you in time' : lv === 3 ? 'What would save the most time' : 'What gets you +' + (lv + 1);
  const FIX = mpFixes(R, C);
  let verdict = '';
  if (tgt != null && FIX.length) { const ok = FIX.filter((f) => f.s >= need).length;
    if (FIX[0].s >= need && FIX[1] && FIX[1].s >= need) verdict = (ok === 2 ? 'Either of the first two' : 'Any one of these') + ' would have done it.';
    else if (FIX[0].s >= need) verdict = 'The first one alone would have done it.';
    else { let sum = 0, k = 0; for (const f of FIX) { sum += f.s; k++; if (sum >= need) break; }
      verdict = sum >= need ? 'The first ' + k + ' together would have done it.' : ck.deathCost >= need ? 'Together these save ' + mpMM(sum) + ', and no deaths at all would have done it.' : ck.deathCost ? 'Even with no deaths, you\'d be ' + plural(need - ck.deathCost, 'second') + ' short. The rest is pace' + (F ? ': see where you fell behind, below.' : '.') : 'The time is in the pace' + (F ? ': see where you fell behind, below.' : '.'); } }
  // (the next level out of reach (the Design studio's hard-key pass, Flex: "Yes, send them"): more seconds needed than every death cost, so the box
  // says where the gap to the typical fast run went instead: the trash and the boss of each stretch, the standing between pulls, and the deaths and
  // kicks, all by seconds; only gaps of 15 s or more. They add up to the gap: the stretch times split into trash, boss, standing and deaths)
  const fT0 = FC ? FC.ck.time : null, far = tgt != null && F && FC && need > ck.deathCost && T - fT0 > 60;
  const went = !far ? null : (() => { const ST = mpStretches(R, C), FS = mpStretches(F, FC), fBy = new Map(FS.map((s) => [s.boss, s])), L = [];
    for (const s of ST) { const f = fBy.get(s.boss); if (!f) continue; const where = s.name.startsWith('Start → ') ? 'Trash before ' + esc(s.boss) : 'Trash between ' + esc(s.name.split(' → ')[0]) + ' and ' + esc(s.boss);
      if (s.trash - f.trash >= 15) L.push({ s: s.trash - f.trash, t: where, d: 'You took ' + plural(s.nt, 'pull') + ' there, the fast run took ' + f.nt + '. Your trash took ' + mpMM(s.trash) + ', theirs took ' + mpMM(f.trash) + '.' });
      if (s.bossT - f.bossT >= 15) L.push({ s: s.bossT - f.bossT, t: esc(s.boss), d: 'Your fight took ' + mpMM(s.bossT) + (s.tries > 1 ? ' over ' + s.tries + ' pulls' : '') + ', theirs took ' + mpMM(f.bossT) + '.' }); }
    if (ck.between - FC.ck.between >= 15) L.push({ s: ck.between - FC.ck.between, t: 'Standing between pulls', d: 'You stood still for ' + mpMM(ck.between) + ' between pulls, the fast run for ' + mpMM(FC.ck.between) + '.' });
    for (const f of mpFixes(R, C, true)) L.push(f);
    return L.filter((x) => x.s >= 15 || !x.s).sort((a, b) => b.s - a.s).slice(0, 6); })();
  // (a thin bar under the lead: the gap split into longer fighting, standing between pulls and deaths, each with its hover, a key under it and
  // no words inside (they'd be cut off on a phone). The three add up to the gap: the fighting is what's left after the other two)
  const sbar = (() => { if (!went) return ''; const gap = T - fT0, dD = ck.deathCost - FC.ck.deathCost, dS = ck.between - FC.ck.between;
    const all = [['f', 'Longer fighting', gap - dD - dS, 'You took ' + plural(R.pulls.length, 'pull') + ', the fast run took ' + F.pulls.length + '.'],
      ['s', 'Standing between pulls', dS, 'You stood still for ' + mpMM(ck.between) + ' between pulls, the fast run for ' + mpMM(FC.ck.between) + '.'],
      ['d', 'Deaths', dD, 'Your ' + plural(ck.deaths, 'death') + ' put ' + mpMM(ck.deathCost) + ' on the timer.' + (FC.ck.deathCost ? ' The fast run\'s put ' + mpMM(FC.ck.deathCost) + '.' : '')]];
    const parts = all.filter((x) => x[2] >= 1), less = all.filter((x) => x[2] <= -1); /* (one you did better than the fast run: in the key, green, so the numbers add up to the gap) */
    const sum = parts.reduce((a, x) => a + x[2], 0); if (!sum) return '';
    return '<div class="mpt-sbar">' + parts.map(([k, l, s, d]) => '<i class="mpt-sb-' + k + '" tabindex="0" style="width:' + (100 * s / sum).toFixed(1) + '%"' + mpT1('<b>' + l + ': ' + mpMM(s) + '</b><br>' + d) + '></i>').join('') + '</div>' +
      '<div class="mpt-sk">' + parts.map(([k, l, s]) => '<span><i class="mpt-sb-' + k + '"></i>' + l + ' <b>' + mpMM(s) + '</b></span>').join('') +
      less.map(([k, l, s, d]) => '<span tabindex="0"' + mpT1('<b>' + l + ': ' + mpMM(s) + '</b><br>' + d) + '>' + l + ' <b class="mpt-g">' + mpMM(s) + '</b></span>').join('') + '</div>'; })();
  const fixes = went ? '<section class="mpt-fx"><div class="mpt-fxh"><h2>Where your ' + mpMM(T - fT0) + ' went</h2>' + mpInfo('The ' + mpMM(T - fT0) + ' you were behind the fast run, split by cause. Hover a piece of the bar for more.') +
    '<span>A typical fast run took <b>' + mpMM(fT0) + '</b>. You needed to be <b>' + mpMM(need) + '</b> faster ' + (lv === 0 ? 'to time it' : 'for +' + (lv + 1)) + (ck.deathCost ? ', and your deaths only cost <b>' + mpMM(ck.deathCost) + '</b>.' : ', and you had no deaths.') + '</span></div>' + sbar +
    went.map((f, i) => '<div class="mpt-fxr"><span class="mpt-fxn">' + (i + 1) + '</span><div><b class="mpt-fxt">' + f.t + '</b><p>' + f.d + '</p></div><span class="mpt-fxs">' + (f.s ? '<b class="mpt-bad">' + mpMM(f.s) + '</b><small>' + (f.plus || 'on the timer') + '</small>' : '<b class="mpt-m">' + f.ns + '</b>') + '</span></div>').join('') + '</section>' :
    '<section class="mpt-fx"><div class="mpt-fxh"><h2>' + head + '</h2><span>' + (tgt != null ? 'You needed <b>' + plural(need, 'second') + '</b>.' + (verdict ? ' ' + verdict : '') : 'You got +3. These would still save time.') + '</span></div>' +
    (FIX.length ? FIX.map((f, i) => '<div class="mpt-fxr"><span class="mpt-fxn">' + (i + 1) + '</span><div><b class="mpt-fxt">' + f.t + '</b><p>' + f.d + '</p></div><span class="mpt-fxs">' + (f.s ? '<b class="mpt-g">−' + mpMM(f.s) + '</b><small>' + (f.plus || 'on the timer') + '</small>' : '<b class="mpt-m">' + f.ns + '</b>') + '</span></div>').join('')
      : '<p class="mpt-none">No deaths, and no must-kick cast went off with a kick ready. The time is in the pulls and the walking between them' + (F ? ': see where you fell behind below.' : '.') + '</p>') + '</section>';
  // slim tiles
  const thN = R.pulls.reduce((a, p) => a + p.through.length, 0), fT = FC ? FC.ck.time : null;
  const tile = (k, v, sub, cls) => '<div class="mpt-tile"><p class="mpt-k">' + k + '</p><b class="' + (cls || '') + '">' + v + '</b><span>' + sub + '</span></div>';
  /* (four tiles (the "easier on the eyes" round): deaths and standing are in the top box and the stretch rows, so Lust takes their place) */
  const LU = R.lust || [];
  const tiles = '<div class="mpt-tiles">' + tile('Time', mpMM(T), ck.up === 0 ? '<span class="mpt-bad">' + sp(T - P) + ' over</span>' : '<span class="' + (lim - T < 90 ? 'mpt-a' : 'mpt-g') + '">' + sp(lim - T) + ' to spare</span>') +
    tile('Behind a typical fast run', F ? (T - fT >= 0 ? mpMM(T - fT) : mpMM(fT - T) + ' ahead') : waiting ? '…' : '—', F ? 'it took ' + mpMM(fT) : waiting ? 'finding a fast run' : 'no fast run found', F && T - fT > 0 ? 'mpt-bad' : '') +
    tile('Casts that went off', String(thN), 'with a kick ready') +
    tile('Lust', LU.length ? plural(LU.length, 'time') : 'None', LU.length ? esc([...new Set(LU.map((l) => mpPullName(R, l.pull)))].join(', ')) : 'no Lust this key', LU.length ? 'mpt-lu' : 'mpt-m') + '</div>';
  return ban + mpJumpBar(R, true) + fixes + tiles + mpBehind(R, C, F, FC, fx, waiting) + mpRouteHtml(R, F, waiting) + mpPulls(R, C, F, FC) + mpCasts(R) + mpPlayers(R, fx, waiting);
}
// (the jump bar under the banner (the Design studio's round 4): it sticks under the site's tab bar while you scroll)
const mpJumpBar = (R, tl) => '<nav class="mpt-jb" aria-label="Jump to">' + [tl ? ['mptTl', 'Timeline'] : null, R.route ? ['mptRoute', 'Route'] : null, ['mptPulls', 'Pulls'], ['mptKicks', 'Kicks'], ['mptPlayers', 'Players']].filter(Boolean).map(([id, l]) => '<button type="button" data-mptj="' + id + '">' + l + '</button>').join('') + '</nav>';
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-mptj]'); if (!b) return; e.preventDefault(); const s = document.getElementById(b.dataset.mptj); if (!s) return;
  if (s.tagName === 'DETAILS') s.open = true; /* (a folded section opens first) */ s.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
// (what "a typical fast run" is, for the line under the timeline and the hovers: the middle of the 20 fastest, or of as many as there are)
const mpTypical = (R, fx) => { const n = (fx && fx.list && fx.list.n) || 0; return 'the middle of this season\'s ' + (n >= 20 || !n ? '20' : n) + ' fastest timed +' + R.run.level + ' ' + esc(R.run.dungeon) + ' runs' + (n && n < 20 ? ' (only ' + n + ' so far)' : ''); };
const mpPullName = (R, k) => { const p = R.pulls[k]; return p ? (p.boss ? p.boss : 'pull ' + p.n) : ''; };
// (a player's big cooldowns over the key (Nov 1): how many, and how many went on the 3 biggest trash pulls, by what they counted toward the 100%
// or else the damage the group took; the hover lists each one's pulls)
function mpCdLine(R, p) {
  if (!(R.cdWho || []).includes(p.name)) return '';
  const l = (R.cds || {})[p.name] || [], rt = R.route && R.route.ok ? R.route : null, big = new Set(R.pulls.map((q, k) => ({ q, k, v: rt ? rt.pulls[k].add : (R.taken || [])[k] || 0 })).filter((x) => !x.q.boss).sort((a, b) => b.v - a.v).slice(0, 3).map((x) => x.k));
  const by = new Map(); for (const x of l) by.set(x.spell, (by.get(x.spell) || []).concat(mpPullName(R, x.pull)));
  const on = l.filter((x) => big.has(x.pull)).length;
  return ' · <span tabindex="0"' + mpT1(l.length ? '<b>Big cooldowns</b><br>' + [...by].map(([s, ps]) => '<b>' + esc(s) + '</b>: ' + esc([...new Set(ps)].join(', '))).join('<br>') : 'No big cooldown pressed.') + '>' + plural(l.length, 'big cooldown') + (l.length && big.size ? ', ' + on + ' on the 3 biggest pulls' : '') + '</span>';
}
// (a section: its title, one plain headline sentence, then the body. Pulls, Kicks and Players start folded to that sentence with a Show pill;
// a chart's title has a small ⓘ. The Design studio's "easier on the eyes" round, Flex: "i dont know what im looking at looking at the charts,
// maybe giving them some tooltips". Hovers use the site's own look: data-tt, shown on hover, focus or a tap)
const mpT1 = (h) => ' data-tt="' + esc(h) + '"';
const mpInfo = (t) => '<span class="ds-i mpt-i" tabindex="0" role="note" aria-label="How to read it"' + mpT1(t) + '>ⓘ</span>';
const mpSec = (t, line, body, id, o) => { o = o || {}; const h = '<h2>' + t + '</h2>' + (o.tip ? mpInfo(o.tip) : '') + (line ? '<span class="mpt-hl">' + line + '</span>' : '');
  return o.fold ? '<details class="mpt-sec mpt-fold"' + (id ? ' id="' + id + '"' : '') + '><summary class="mpt-sh">' + h + '<span class="mpt-chev" aria-hidden="true"></span></summary><div class="mpt-fb">' + body + '</div></details>'
    : '<section class="mpt-sec"' + (id ? ' id="' + id + '"' : '') + '><div class="mpt-sh">' + h + '</div>' + body + '</section>'; };
// (where you fell behind: one timeline on the key's timer, your pulls next to a fast run, then why, stretch by stretch)
function mpBehind(R, C, F, FC, fx, waiting) {
  const ck = C.ck, ST = mpStretches(R, C), FS = F ? mpStretches(F, FC) : [], fBy = new Map(FS.map((s) => [s.boss, s]));
  const W0 = Math.max(ck.par, ck.time, FC ? FC.ck.time : 0) * 1.03, X = (s) => (100 * Math.max(0, s) / W0).toFixed(2) + '%', W = (s) => (100 * Math.max(0, s) / W0).toFixed(2) + '%';
  const blocks = [], dticks = [];
  for (const p of R.pulls) { const dd = p.deaths.slice().sort((a, b) => a.t - b.t); let s0 = p.s;
    for (const d of dd) { blocks.push({ x: C.tv(s0), w: d.t - s0, p }); dticks.push({ x: C.tv(d.t), d }); s0 = d.t; }
    blocks.push({ x: C.tv(s0), w: p.e - s0, p }); }
  const CP = ST.map((s, i) => ({ boss: s.boss, you: i === ST.length - 1 && R.pulls[R.pulls.length - 1].boss === s.boss ? ck.time : s.at, fast: fBy.has(s.boss) ? fBy.get(s.boss).at : null }));
  if (F && CP.length && FS.length && FS[FS.length - 1].boss === CP[CP.length - 1].boss) CP[CP.length - 1].fast = FC.ck.time;
  /* (every piece has its hover (the "easier on the eyes" round)) */
  const youLane = '<div class="mpt-lt">' + blocks.map((b) => '<i class="mpt-blk' + (b.p.boss ? ' mpt-bo' : '') + '" style="left:' + X(b.x) + ';width:' + W(b.w) + '"' + mpT1(b.p.boss ? '<b>' + esc(b.p.boss) + '</b>: ' + mpMM(b.p.dur) + (b.p.kill === false ? ', not killed.' : '.') : '<b>Pull ' + b.p.n + '</b>: ' + mpMM(b.p.dur) + ' of trash.') + '></i>').join('') +
    dticks.map((t) => '<i class="mpt-dth" style="left:' + X(t.x) + ';width:' + W(C.pen) + '"' + mpT1('<b>' + esc(t.d.who) + ' died</b>' + (t.d.to && t.d.to !== 'unknown' ? ' to ' + esc(t.d.to) : '') + ': +' + Math.round(C.pen) + ' s on the timer.') + '></i>').join('') +
    CP.map((c) => '<span class="mpt-cp" style="left:' + X(c.you) + '"' + mpT1('<b>' + esc(c.boss) + ' down</b> at ' + mpMM(c.you) + (c.fast != null ? ', ' + (c.you >= c.fast ? mpMM(c.you - c.fast) + ' behind' : mpMM(c.fast - c.you) + ' ahead of') + ' the fast run.' : '.')) + '><i></i></span>').join('') +
    (R.lust || []).map((l) => '<i class="mpt-lst" style="left:' + X(C.tv(l.t)) + '"' + mpT1('<b>Lust</b>' + (l.spell ? ' (' + esc(l.spell) + ')' : '') + ', ' + esc(mpPullName(R, l.pull)) + '.') + '></i>').join('') + '</div>'; /* (each Lust where it went out (Nov 1)) */
  const fastLane = F ? '<div class="mpt-lt"><i class="mpt-fbar" style="width:' + W(FC.ck.time) + '"' + mpT1('<b>A typical fast run</b>: ' + mpTypical(R, fx) + '. It finished at ' + mpMM(FC.ck.time) + '.') + '></i>' + CP.filter((c) => c.fast != null).map((c) => '<span class="mpt-cp mpt-f" style="left:' + X(c.fast) + '"' + mpT1('<b>' + esc(c.boss) + ' down</b> at ' + mpMM(c.fast) + ' in the fast run.') + '><i></i></span>').join('') + '</div>'
    : '<div class="mpt-lt mpt-lt0"><span>' + (waiting ? 'Finding a typical fast run…' : 'No public fast run at this level yet.') + '</span></div>';
  const marks = '<div class="mpt-mk">' + [[0.6, '+3'], [0.8, '+2'], [1, '+1']].map(([f, l]) => '<span style="left:' + X(ck.par * f) + '"' + mpT1('Finish before <b>' + mpMM(ck.par * f) + '</b> for ' + l + '.') + '>' + l + ' · ' + mpMM(ck.par * f) + '</span>').join('') + '</div>';
  const lines = [0.6, 0.8, 1].map((f) => '<i class="mpt-vl" style="left:' + X(ck.par * f) + '"></i>').join('');
  let lastX = -99, row = 0, rows = 1; const rowOf = CP.map((c) => { const x = 100 * c.you / W0; row = x - lastX < 13 ? 1 - row : 0; lastX = x; rows = Math.max(rows, row + 1); return row; }); /* (bosses close together: their labels take turns on two rows) */
  const gapRow = '<div class="mpt-gp" style="--mpt-gph:' + 40 * rows + 'px">' + CP.map((c, i) => '<span style="left:' + X(c.you) + ';--mpt-gpt:' + 40 * rowOf[i] + 'px"><b>' + esc(c.boss) + '</b>' + mpMM(c.you) + (c.fast != null ? ' · <b class="' + (i === CP.length - 1 && c.you > c.fast ? 'mpt-bad' : '') + '">' + (c.you >= c.fast ? mpMM(c.you - c.fast) + ' behind' : mpMM(c.fast - c.you) + ' ahead') + '</b>' : '') + '</span>').join('') + '</div>';
  const timeline = '<div class="mpt-tl"><div class="mpt-tlg">' + marks + '<div class="mpt-lanes">' + lines + '<div class="mpt-ln"><span class="mpt-ll">You</span>' + youLane + '</div><div class="mpt-ln"><span class="mpt-ll"' + mpT1('<b>A typical fast run</b>: ' + mpTypical(R, fx) + '.') + '>Fast run</span>' + fastLane + '</div></div>' + gapRow + '</div>' +
    '<div class="mpt-key"><span><i class="mpt-k1"></i>Pull</span><span><i class="mpt-k2"></i>Boss</span>' + (C.pen ? '<span><i class="mpt-k3"></i>Death (+' + Math.round(C.pen) + ' s)</span>' : '') + (F ? '<span><i class="mpt-k4"></i>Fast run</span>' : '') + '<span><i class="mpt-kd"></i>Boss down</span>' + ((R.lust || []).length ? '<span><i class="mpt-kl"></i>Lust</span>' : '') + '</div></div>';
  // why, stretch by stretch: one number a cell, the difference from the fast run, with both in its hover; only the worst one coloured (the
  // "easier on the eyes" round). Without a fast run, your own numbers
  const dv = (v) => { v = Math.round(v); return v > 0 ? '+' + mpMM(v) : v < 0 ? mpMM(v) : 'same'; }, dn = (v) => (v > 0 ? '+' + plural(v, 'pull') : v < 0 ? '−' + plural(-v, 'pull') : 'same');
  const yf = (a, b) => 'You: ' + a + '.<br>Fast run: ' + b + '.', dth = (n, pen) => (n ? plural(n, 'death') + ', ' + mpMM(pen) + ' on the timer' : 'no deaths');
  const why = '<div class="mpt-wyh"><span>Stretch</span><span>Time</span><span>Pulls</span><span>Trash</span><span>Boss</span><span>Deaths</span><span>Standing</span></div>' + ST.map((s) => { const f = fBy.get(s.boss);
    const diffs = f ? [['n', (s.n - f.n) * 40], ['trash', s.trash - f.trash], ['boss', s.bossT - f.bossT], ['d', s.pen - f.pen], ['stand', s.stand - f.stand]] : [], worst = diffs.sort((a, b) => b[1] - a[1])[0]; /* (a pull counts as 40 s, as in the studio's picture) */
    const c = (k, mine, d, tip) => { const l = { t: 'Time', n: 'Pulls', trash: 'Trash', boss: 'Boss', d: 'Deaths', stand: 'Standing' }[k];
      return '<span class="mpt-c" data-l="' + l + '"' + (f ? ' tabindex="0"' + mpT1('<b>' + l + '</b><br>' + tip) : '') + '><b class="' + (worst && worst[0] === k && worst[1] > 20 ? 'mpt-bad' : '') + '">' + (f ? d : mine) + '</b></span>'; };
    return '<div class="mpt-wyr"><span class="mpt-sn">' + esc(s.name) + '<small>' + (s.first === s.last ? 'pull ' + s.first : 'pulls ' + s.first + '–' + s.last) + '</small></span>' +
      c('t', mpMM(s.t), f && dv(s.t - f.t), f && yf(mpMM(s.t), mpMM(f.t))) + c('n', String(s.n), f && dn(s.n - f.n), f && yf(plural(s.n, 'pull'), plural(f.n, 'pull'))) +
      c('trash', mpMM(s.trash), f && dv(s.trash - f.trash), f && yf(mpMM(s.trash), mpMM(f.trash))) +
      c('boss', mpMM(s.bossT) + (s.tries > 1 ? ' <small class="mpt-m">(' + s.tries + ' pulls)</small>' : ''), f && dv(s.bossT - f.bossT), f && yf(mpMM(s.bossT) + (s.tries > 1 ? ' over ' + s.tries + ' pulls' : ''), mpMM(f.bossT))) +
      c('d', s.d ? s.d + ' · ' + mpMM(s.pen) : '0', f && dv(s.pen - f.pen), f && yf(dth(s.d, s.pen), dth(f.d, f.pen))) + c('stand', mpMM(s.stand), f && dv(s.stand - f.stand), f && yf(mpMM(s.stand), mpMM(f.stand))) + '</div>'; }).join('') +
    (F ? '<p class="mpt-sm">Each number is the difference from the fast run. Hover or tap one for both times.</p>' : '');
  // (the headline, and one sentence under the rows: where most of the gap is, and what made it up there)
  let sum = '', line = '';
  if (F) { const gaps = ST.map((s) => { const f = fBy.get(s.boss); return f ? { s, f, g: s.t - f.t } : null; }).filter(Boolean).sort((a, b) => b.g - a.g), top = gaps[0];
    if (top && top.g > 15) { const s = top.s, f = top.f, bits = [], first = s.name.startsWith('Start → ');
      if (s.n > f.n) bits.push('took ' + plural(s.n - f.n, 'more pull')); if (s.trash - f.trash > 20) bits.push('spent ' + mpMM(s.trash - f.trash) + ' longer on trash'); if (s.bossT - f.bossT > 20) bits.push('spent ' + mpMM(s.bossT - f.bossT) + ' longer on ' + esc(s.boss)); if (s.pen - f.pen > 0) bits.push('lost ' + mpMM(s.pen - f.pen) + ' to ' + plural(s.d, 'death')); if (s.stand - f.stand > 20) bits.push('stood still ' + mpMM(s.stand - f.stand) + ' longer');
      line = 'You fell furthest behind ' + (first ? 'before <b>' + esc(s.boss) + '</b>' : 'after <b>' + esc(s.name.split(' → ')[0]) + '</b>') + ': <b class="mpt-bad">' + mpMM(top.g) + '</b>.';
      sum = 'Most of the gap, <b>' + mpMM(top.g) + '</b>, is ' + (first ? 'before <b>' + esc(s.boss) + '</b>' : 'between <b>' + esc(s.name).replace(' → ', '</b> and <b>') + '</b>') + '.' + (bits.length ? ' There you ' + bits.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.' : ''); }
    else line = 'You kept pace with the fast run all the way.'; }
  else { const top = ST.slice().sort((a, b) => b.t - a.t)[0]; if (top) line = 'Your longest stretch was ' + (top.name.startsWith('Start → ') ? 'from the start to <b>' + esc(top.boss) + '</b>' : 'from <b>' + esc(top.name).replace(' → ', '</b> to <b>') + '</b>') + ': <b>' + mpMM(top.t) + '</b>.'; }
  const pk = fx && fx.pick, at = pk && pk.at ? new Date(pk.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const src = F ? '<p class="mpt-ex">The fast run is a typical one: ' + mpTypical(R, fx) + (at ? ' (' + esc(at) + ')' : '') + '.</p>' : '';
  return mpSec('Where you fell behind', line, timeline + why + (sum ? '<p class="mpt-why">' + sum + '</p>' : '') + src, 'mptTl',
    { tip: F || waiting ? '<b>How to read it</b><br>Your key and a typical fast run on the same timer, left to right. Where your line runs longer, you were slower. Hover any piece for what it is.' : '<b>How to read it</b><br>Your key on its timer, left to right. Hover any piece for what it is.' });
}
// (one Pulls list (Nov 1, the Design studio's round 4, Flex: "Yes, build both"): pull by pull, the route's side by side and the deaths in one
// list, grouped by stretch (up to each boss kill), with the fast run's pulls in that stretch beside it. A row opens for its deaths in order, what
// went off with a kick ready, Lust and big cooldowns. Enemies something summoned (a Magma Totem, a player's guardian) aren't counted in what you
// pulled. Each row is #mpt-pull-N for the map's dots, and MP.pinfo has each pull's card)
function mpGroups(P) { const out = []; let cur = { from: '', to: '', ps: [] }; for (const p of P) { cur.ps.push(p); if (p.boss && p.kill !== false) { cur.to = p.boss; out.push(cur); cur = { from: p.boss, to: '', ps: [] }; } } if (cur.ps.length) out.push(cur); return out; }
const mpWhat = (R2, p, k) => { if (p.boss) return esc(p.boss); const sum = R2.summoned || new Set(), all = p.mobs || [], mine = all.filter((m) => !sum.has(m[0])), mobs = mine.length ? mine : all, cnt = mobs.reduce((a, m) => a + m[1], 0);
  return plural(cnt, 'enemy').replace('enemys', 'enemies') + ': ' + mobs.slice(0, k || 3).map((m) => esc(m[0]) + (m[1] > 1 ? ' ×' + m[1] : '')).join(', ') + (mobs.length > (k || 3) ? ' and ' + (mobs.length - (k || 3)) + ' more' : ''); };
function mpPulls(R, C, F, FC) {
  const n = Math.max(1, (R.people || []).length), roleOf = (w) => ((R.people || []).find((p) => p.name === w) || {}).role || '';
  const rt = R.route && R.route.ok ? R.route : null, frt = F && F.route && F.route.ok && rt && F.route.full === rt.full ? F.route : null;
  const fmt = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '') + '%';
  let acc = 0; const tot = R.pulls.map((p, k) => (acc += rt ? rt.pulls[k].add : 0, acc));
  const ST = C ? mpStretches(R, C) : [], FS = F && FC ? mpStretches(F, FC) : [], sBy = new Map(ST.map((s) => [s.boss, s])), fsBy = new Map(FS.map((s) => [s.boss, s]));
  const FG = F ? new Map(mpGroups(F.pulls).map((g) => [g.to, g])) : new Map(), tv = (t) => (C ? C.tv(t) : t);
  MP.pinfo = {};
  let opened = false;
  const row = (p) => { const i = R.pulls.indexOf(p);
    // (quiet tags (the "easier on the eyes" round): sentence case, a small dot, no box; red for deaths, yellow for Lust, grey for the rest.
    // Three at most, then "+N" with the rest in its hover)
    const tg = (txt, cls, tip) => '<span class="mpt-tg' + (cls ? ' ' + cls : '') + '"' + (tip ? mpT1(tip) : '') + '>' + txt + '</span>';
    const dd = p.deaths.slice().sort((a, b) => a.t - b.t), wp = mpWipe(p, n), wipe = !!wp, tags = [];
    /* (Lust and big cooldowns on this pull (Nov 1): who pressed one, of the players whose spec's big cooldowns the Rotation tab knows) */
    const lu = (R.lust || []).filter((l) => l.pull === i), cdu = Object.entries(R.cds || {}).map(([nm, l]) => [nm, l.filter((x) => x.pull === i)]).filter(([, l]) => l.length), cdn = (R.cdWho || []).length;
    const cdList = cdu.length ? cdu.map(([nm, l]) => '<b>' + esc(nm) + '</b>: ' + esc([...new Set(l.map((x) => x.spell))].join(', '))).join('<br>') : 'Nobody pressed a big cooldown.';
    if (wipe) tags.push(tg('Wipe', 'mpt-tb')); else if (dd.length) tags.push(tg(plural(dd.length, 'death'), 'mpt-tb'));
    if (p.boss && p.kill === false && !wipe) tags.push(tg('Not killed', 'mpt-tb'));
    if (lu.length) tags.push(tg('Lust', 'mpt-tl'));
    if (p.through.length) tags.push(tg(plural(p.through.length, 'cast') + ' went off'));
    if (cdn && cdu.length < cdn) tags.push(tg(cdu.length + ' of ' + cdn + ' big cooldowns', 'mpt-tcd', '<b>Big cooldowns this pull</b><br>' + cdList)); /* (only when someone didn't press theirs (the hard-key pass)) */
    for (const b of (p.ebuffs || []).filter((x) => x.on > 0).slice(0, 2)) tags.push(tg(esc(b.spell) + ' ×' + b.on, '', '<b>' + esc(b.spell) + '</b> went on ' + plural(b.on, 'enemy').replace('enemys', 'enemies') + '.'));
    const shown = tags.length > 3 ? tags.slice(0, 3).concat(tg('+' + (tags.length - 3), 'mpt-tm', tags.slice(3).map((x) => x.replace(/<[^>]+>/g, '')).join('<br>'))) : tags;
    const lead = wp ? wp.first : null, tk = lead && roleOf(lead.who) === 'tank';
    const th = new Map(); for (const t of p.through) th.set(t.spell, (th.get(t.spell) || 0) + 1);
    const miss = (R.cdWho || []).filter((nm) => !cdu.some(([x]) => x === nm));
    const body = (dd.length ? '<p><b>' + (wipe ? 'The wipe, in order:' : 'Deaths, in order:') + '</b></p><ol>' + dd.map((d, j) => '<li><span class="mpt-m">' + mpMM(d.t - p.s) + ' in:</span> ' + mpWho(R, d.who) + (d === lead && tk ? ' ' + tg('tank, first', 'mpt-tb') : '') + ' died to <b class="mpt-ab">' + esc(d.to) + '</b>' + (d.from ? ' <span class="mpt-m">(from ' + esc(d.from) + ')</span>' : '') + '. ' + (d.defs ? 'Used ' + plural(d.defs, 'defensive') + '.' : '<b class="mpt-bad">No defensive used.</b>') + '</li>').join('') + '</ol>' : '') +
      (th.size ? '<p>' + [...th].map(([s, k]) => '<b class="mpt-ab">' + esc(s) + '</b> went off ' + (k === 1 ? 'once' : k + ' times')).join(', ') + ' with a kick ready.</p>' : '') +
      (lu.length ? '<p><b class="mpt-lu">Lust</b>' + (lu[0].spell ? ' (' + esc(lu[0].spell) + ')' : '') + ' went out ' + lu.map((l) => (l.t < p.s ? mpMM(p.s - l.t) + ' before the pull' : mpMM(l.t - p.s) + ' in')).join(' and ') + '.</p>' : '') +
      /* (one short sentence; who pressed what is in its hover) */
      (cdn ? '<p class="mpt-cdl" tabindex="0"' + mpT1('<b>Big cooldowns this pull</b><br>' + cdList) + '>' + (!miss.length ? 'Everyone pressed a big cooldown.' : !cdu.length ? 'Nobody pressed a big cooldown.' : miss.map((nm) => mpWho(R, nm)).join(', ').replace(/, ([^,]*)$/, ' and $1') + ' didn\'t press one.') + '</p>' : '');
    const open = !opened && wipe; if (open) opened = true;
    const what = p.boss ? (p.kill === false ? '<span class="mpt-bad">Not killed</span>' : '<span class="mpt-g">Killed</span>') : mpWhat(R, p);
    const add = rt ? rt.pulls[i].add : 0, forces = rt && add ? '+' + fmt(100 * add / rt.full) + ' <small>' + fmt(100 * tot[i] / rt.full) + '</small>' : '';
    MP.pinfo[p.n] = { t: p.boss ? esc(p.boss) : 'Pull ' + p.n, at: mpMM(tv(p.s)) + ' to ' + mpMM(tv(p.e)), len: mpMM(p.dur), add: rt && add ? '+' + fmt(100 * add / rt.full) : '', tot: rt ? fmt(100 * tot[i] / rt.full) : '',
      mobs: p.boss ? (p.kill === false ? 'Boss · not killed' : 'Boss · killed') : mpWhat(R, p, 4), tags: tags.filter((x) => !/mpt-tcd/.test(x)).map((x) => x.replace(/ data-tt="[^"]*"/, '')).join(''), dd: dd.slice(0, 3).map((d) => esc(d.who) + ' died to ' + esc(d.to)) };
    const head = '<span class="mpt-pn">' + (p.boss ? esc(p.boss) : 'Pull ' + p.n) + '</span><span class="mpt-pm">' + what + '</span><span class="mpt-pt">' + mpMM(p.dur) + '</span><span class="mpt-pf">' + forces + '</span><span class="mpt-pc">' + (shown.join('') || '<span class="mpt-m">clean</span>') + '</span>';
    return '<details id="mpt-pull-' + p.n + '" data-n="' + p.n + '" class="mpt-pr' + (p.boss ? ' mpt-boss' : '') + '"' + (open ? ' open' : '') + (body ? '' : ' data-empty') + '><summary>' + head + '</summary>' + (body ? '<div class="mpt-pd">' + body + '</div>' : '') + '</details>';
  };
  const G = mpGroups(R.pulls), tdN = R.pulls.reduce((a, p) => a + p.deaths.length, 0);
  const groups = G.map((g) => { const s = sBy.get(g.to), f = fsBy.get(g.to), fg = FG.get(g.to);
    const head = '<div class="mpt-sgh"><b>' + esc((g.from || 'Start') + ' → ' + (g.to || 'the end')) + '</b><span>' + [s ? mpMM(s.t) : '', f ? 'fast run ' + mpMM(f.t) : '', s && f ? '<b class="' + (s.t - f.t > 60 ? 'mpt-bad' : '') + '">' + (s.t >= f.t ? mpMM(s.t - f.t) + ' slower' : mpMM(f.t - s.t) + ' faster') + '</b>' : ''].filter(Boolean).join(' · ') + '</span></div>';
    const fast = fg ? '<div class="mpt-fp"><p class="mpt-k">Fast run here</p>' + fg.ps.map((q) => { const k = F.pulls.indexOf(q), a = frt ? frt.pulls[k].add : 0; return '<div class="mpt-fpr' + (q.boss ? ' mpt-bo' : '') + '"><span>' + (q.boss ? esc(q.boss) + (a ? ', with trash' : '') : mpWhat(F, q, 2)) + '</span><b>' + (a ? '+' + fmt(100 * a / frt.full) : '') + '</b></div>'; }).join('') + '</div>' : '';
    return '<div class="mpt-sg">' + head + '<div class="mpt-sgb' + (fast ? '' : ' mpt-sgb1') + '"><div>' + g.ps.map(row).join('') + '</div>' + fast + '</div></div>'; }).join('');
  const wipes = R.pulls.filter((p) => mpWipe(p, n)).map((p) => (p.boss ? esc(p.boss) : 'pull ' + p.n));
  return mpSec('Pulls', 'You took <b>' + plural(R.pulls.length, 'pull') + '</b>' + (wipes.length ? ' and wiped on <b class="mpt-bad">' + wipes.join(' and ') + '</b>.' : tdN ? ', with <b class="mpt-bad">' + plural(tdN, 'death') + '</b>.' : ' with no deaths.'),
    '<div class="mpt-plh' + (F ? '' : ' mpt-plh1') + '"><span>Pull</span><span>What you pulled</span><span>Time</span><span>' + (rt ? 'Forces' : '') + '</span><span>What happened</span></div>' + groups +
    '<p class="mpt-sm">Click a pull for who died, what went off with a kick ready, and when Lust went out. Summoned enemies aren\'t counted.</p>', 'mptPulls', { fold: true });
}
// (casts and kicks: what went off with a kick ready, by spell and pull, and who stopped casts)
function mpCasts(R) {
  const thru = new Map(); for (const p of R.pulls) for (const t of p.through) { const k = t.spell + '|' + t.mob, o = thru.get(k) || { spell: t.spell, mob: t.mob, n: 0, pulls: new Map() }; o.n++; o.pulls.set(p.n, (o.pulls.get(p.n) || 0) + 1); thru.set(k, o); }
  const TH = [...thru.values()].sort((a, b) => b.n - a.n), thN = TH.reduce((a, t) => a + t.n, 0);
  const who = R.people.filter((p) => p.kicks + p.stops > 0).sort((a, b) => b.kicks + b.stops - a.kicks - a.stops), mx = Math.max(1, ...who.map((p) => p.kicks + p.stops));
  const left = '<div><p class="mpt-k">Went off with a kick ready</p>' + (TH.length ? TH.map((t) => '<div class="mpt-kr"><span><b class="mpt-ab">' + esc(t.spell) + '</b><small>' + esc(t.mob) + '</small></span><span class="mpt-m">' + [...t.pulls].map(([n, c]) => 'pull ' + n + (c > 1 ? ' ×' + c : '')).join(', ') + '</span><b>' + t.n + '×</b></div>').join('') : '<p class="mpt-none">Nothing on the must-kick list went off while someone\'s kick was ready.</p>') +
    /* (kick when you can (Nov 1, companion/mplus.js 790983f; Flex okayed): a pack's spam, from 8 or more enemies or 6 or more casts in 10 s.
       Too many to stop them all, so it's never a mistake and never in the counts above: one quiet line each, how many you kicked) */
    ((R.spam || []).length ? '<p class="mpt-k mpt-ksh">Kick when you can</p>' + R.spam.map((x) => '<div class="mpt-kr mpt-ks" tabindex="0"' + mpT1('<b>' + esc(x.spell) + '</b> comes from a pack: ' + x.casts + ' casts from ' + plural(x.enemies, 'enemy').replace('enemys', 'enemies') + '. That\'s too many to stop them all. Every one you kick or stop helps, and one that goes off isn\'t a mistake.') + '><span><b>' + esc(x.spell) + '</b><small>' + esc(x.mob) + (x.enemies > 1 ? ' · ' + plural(x.enemies, 'enemy').replace('enemys', 'enemies') : '') + '</small></span><span class="mpt-m">kicked ' + x.kicked + ' of ' + x.casts + (x.stopped ? ', stopped ' + x.stopped + ' more' : '') + '</span><b></b></div>').join('') : '') + '</div>';
  const right = '<div><p class="mpt-k">Who stopped casts</p>' + (who.length ? who.map((p) => '<div class="mpt-kr2">' + mpWho(R, p.name) + '<span class="mpt-bar"><i style="width:' + (100 * (p.kicks + p.stops) / mx).toFixed(0) + '%"></i></span><span class="mpt-m">' + plural(p.kicks, 'kick') + ' · ' + plural(p.stops, 'stop') + '</span></div>').join('') : '<p class="mpt-none">No kicks or stops in this key.</p>') +
    '<p class="mpt-sm">A stop is a stun, knockback or other crowd control that cut a cast short. Healers have no kick in Midnight, except Restoration Shamans.</p></div>';
  const t0 = TH[0];
  return mpSec('Casts and kicks', t0 ? '<b class="mpt-ab">' + esc(t0.spell) + '</b> went off <b>' + (t0.n === 1 ? 'once' : t0.n + ' times') + '</b> with a kick ready.' : 'Nothing on the must-kick list went off with a kick ready.', '<div class="mpt-two">' + left + right + '</div>', 'mptKicks', { fold: true });
}
// (players: damage or healing a second with a bar, against the players of the same spec in the 10 fastest runs, and deaths, defensives
// and avoidable hits)
function mpPlayers(R, fx, waiting) {
  const ppl = R.people.slice().sort(mpByRole), mxD = Math.max(1, ...ppl.filter((p) => p.role !== 'healer').map((p) => p.dps)), runs = (fx && fx.list && fx.list.runs) || [];
  const vs = (p) => { const heal = p.role === 'healer', a = []; for (const r of runs) for (const m of r.ppl || []) if (m.a && mpNorm(m.s) === mpNorm(p.spec) && mpNorm(m.c) === mpNorm(p.cls) && (m.r === 'healer') === heal) a.push(m.a);
    if (!a.length) return null; a.sort((x, y) => x - y); const avg = a.length % 2 ? a[a.length >> 1] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2, mine = heal ? p.hps : p.dps; return { pct: Math.round(100 * (mine - avg) / avg), n: a.length, avg }; }; /* (the middle one, like the typical fast run) */
  const rows = ppl.map((p) => { const heal = p.role === 'healer', v = vs(p), sid = mpSpecId(p.spec, p.cls), ic = typeof NDZ_SPECIC !== 'undefined' && NDZ_SPECIC[sid] ? NDZ_SPECIC[sid] : 'inv_misc_questionmark';
    const vtxt = v ? '<span class="mpt-vs ' + (v.pct < -10 ? 'mpt-bad' : v.pct > 0 ? 'mpt-g' : '') + '" tabindex="0"' + mpT1('Against ' + esc(plural(v.n, p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || ''))) + ' in the fastest runs with a public log: the middle one does <b>' + Math.round(v.avg / 1000) + 'k ' + (heal ? 'HPS' : 'DPS') + '</b>.') + '>' + (v.pct >= 0 ? v.pct + '% ahead' : -v.pct + '% behind') + '</span>'
      : '<span class="mpt-vs mpt-m">' + (waiting ? '…' : runs.length ? 'no ' + esc(p.spec) + ' in the fast runs' : '—') + '</span>';
    return '<div class="mpt-pl"><span class="mpt-si"><img src="' + whIcon(ic) + '" alt="" loading="lazy" onerror="this.remove()"></span><span class="mpt-pw">' + mpWho(R, p.name) + '<small>' + esc(p.spec) + '</small></span>' +
      '<span class="mpt-pv"><b>' + Math.round((heal ? p.hps : p.dps) / 1000) + 'k</b><small>' + (heal ? 'HPS' : 'DPS') + '</small></span><span class="mpt-bar"><i style="width:' + (heal ? 100 : 100 * p.dps / mxD).toFixed(0) + '%"></i></span>' + vtxt +
      '<span class="mpt-m">' + plural(p.deaths, 'death') + ' · ' + plural(p.defs, 'defensive') + ' · ' + plural(p.avoid, 'avoidable hit') + mpCdLine(R, p) + '</span></div>'; }).join('');
  // (the headline: whether everyone pressed their big cooldowns, and who was furthest behind their spec)
  const never = (R.cdWho || []).filter((nm) => !((R.cds || {})[nm] || []).length), V = ppl.map((p) => ({ p, v: vs(p) })).filter((x) => x.v), low = V.slice().sort((a, b) => a.v.pct - b.v.pct)[0];
  const line = [(R.cdWho || []).length ? (never.length ? never.map((nm) => mpWho(R, nm)).join(', ').replace(/, ([^,]*)$/, ' and $1') + ' never pressed a big cooldown.' : 'Everyone pressed their big cooldowns.') : '',
    low ? (low.v.pct < 0 ? mpWho(R, low.p.name) + ' was furthest behind their spec (<b class="mpt-bad">' + -low.v.pct + '%</b>).' : 'Everyone was ahead of the middle player of their spec.') : ''].filter(Boolean).join(' ') || 'DPS and HPS over the whole key.';
  return mpSec('Players', line, rows + (runs.length ? '<p class="mpt-sm">Each compared with the middle player of the same spec in the 20 fastest runs.</p>' : ''), 'mptPlayers', { fold: true });
}

// ---------- your route (step 3, Nov 1; the Design studio's route mockup, Flex: "Yes, the map dots"; enemy counts from Raider.IO, Flex's pick) ----------
// Each dungeon's 100%, its map pictures (Wowhead's, by zone: floor 0 is <zone>.jpg, floor 1 is <zone>-1.jpg, in the game's own floor order,
// UiMapGroupMember.FloorIndex), its floors (uiMapID, the game's name, and the floor's corners in game coordinates: minX, maxX, minY, maxY, from
// UiMapAssignment, 12.1.5.70688, both on wago.tools) and how much one kill of each enemy counts (NPC ID: count; from Raider.IO's run details of
// the top runs and Flex's own, Nov 1; 0 is left out). Ruby Life Pools' counts are incomplete in Raider.IO (several of its enemies say 0), so a
// finished key there adds up under 100% and the tab leaves its counts out.
const MP_ROUTE = {
  'altar of fangs': { full: 817, zone: 16865, floors: [[2588, 'Sacrificial Approach', 1414.58, 2008.33, 1662.5, 2552.08], [2589, 'Mutation Chambers', 1043.75, 1470.83, 1756.25, 2395.83], [2590, 'Altar of Fangs', 960, 1560, 1627.5, 2527.5]],
    n: { 261550: 1, 261552: 5, 261553: 5, 261554: 25, 261557: 7, 261560: 7, 261573: 30, 262011: 25, 263109: 25, 263112: 1, 270306: 25, 271453: 5 } },
  'den of nalorakk': { full: 729, zone: 16368, floors: [[2564, 'Dreamer\'s Passage', 4395, 4535, -5015, -4805], [2514, 'The Foraging', 4014.58, 4764.58, -5856.25, -4731.25], [2513, 'The Heart of Rage', 4500, 5129.17, -5350, -4406.25]],
    n: { 241808: 8, 241813: 5, 241814: 7, 241816: 7, 241869: 28, 241872: 9, 241874: 5, 241876: 7, 241911: 7, 244889: 35, 245139: 7, 245143: 5, 245145: 6, 245146: 25, 245190: 5, 245752: 7, 245855: 25, 250478: 50 } },
  'kings\' rest': { full: 608, zone: 9526, floors: [[1004, 'Kings\' Rest', -1240.31, -679.68, 2440, 3280.94]],
    n: { 133935: 22, 134157: 5, 134158: 25, 134174: 20, 134251: 10, 134331: 25, 134739: 25, 135167: 22, 135192: 5, 135204: 7, 135231: 25, 135239: 7, 137473: 10, 137474: 25, 137478: 25, 137484: 25, 137485: 7, 137486: 25, 137487: 10, 137969: 15, 137989: 1, 270502: 7 } },
  'murder row': { full: 655, zone: 16091, floors: [[2433, 'Murder Row', 8633.33, 8952.08, -5106.25, -4629.17], [2435, 'The Illicit Rain', 8850, 9000, -4895, -4670], [2434, 'Augurs\' Terrace', 8554.17, 9250, -5502.08, -4458.33]],
    n: { 234849: 2, 235257: 1, 235261: 5, 235265: 25, 235267: 5, 235268: 7, 235322: 35, 235465: 25, 236071: 25, 236073: 3, 236082: 6, 236084: 7, 236085: 1, 236091: 3, 236893: 2, 236897: 7, 236902: 12, 236905: 30, 252529: 35, 255604: 6 } },
  'ruby life pools': { full: 551, zone: 14063, floors: [[2095, 'Infusion Chambers', 1335, 1685, -450, 75], [2094, 'Ruby Overlook', 1345.83, 1868.75, -602.08, 181.25]],
    n: { 187897: 30, 187969: 5, 188011: 5, 188067: 7, 188244: 25, 190207: 7, 197535: 30, 197697: 40, 197698: 48, 197982: 5, 198047: 25 } },
  'temple of sethraliss': { full: 687, zone: 9527, floors: [[1038, 'Temple of Sethraliss', 3187.5, 3937.5, 2789.58, 3916.67], [1043, 'Atrium of Sethraliss', 3760.42, 4285.42, 3185.42, 3972.92]],
    n: { 134364: 7, 134599: 7, 134600: 7, 134602: 7, 134616: 5, 134629: 25, 134686: 16, 134691: 5, 134990: 7, 134991: 25, 135007: 25, 135562: 7, 135846: 5, 136076: 25, 136250: 25, 139110: 5, 139422: 7, 139425: 7, 265057: 5, 268317: 5, 269227: 5 } },
  'the blinding vale': { full: 686, zone: 16359, floors: [[2500, 'The Blinding Vale', 916.67, 1675, 1202.08, 2341.67]],
    n: { 245336: 7, 245339: 6, 245345: 7, 245346: 20, 245410: 1, 245460: 7, 245473: 5, 245484: 7, 245513: 25, 245527: 1, 246871: 22, 249756: 60, 254850: 25 } },
  'voidscar arena': { full: 738, zone: 16425, floors: [[2574, 'Halls of Spite', 4358.33, 4691.67, -705.01, -204.99], [2572, 'Voidscar Arena', 4368.75, 4718.75, -720.83, -195.83], [2573, 'Domanaar\'s Ascent', 4716.67, 5312.5, -912.5, -18.75]],
    n: { 238883: 7, 241496: 7, 243766: 7, 243835: 5, 243983: 4, 243985: 5, 243988: 4, 243996: 4, 244260: 25, 244309: 25, 244708: 7, 245950: 65, 249461: 5, 249590: 8, 249603: 5, 249608: 5, 252053: 25, 252072: 25, 252508: 1, 263228: 25, 267545: 40, 267546: 40, 268184: 30 } },
};
// (one pass over the key's own lines (Nov 1), the same for a report, a log on this PC and a shared night:
// - the route: each enemy that died counts once (its NPC ID is in its GUID), for the pull it died in or after; each pull's spot is the middle
//   (median) of its enemies' positions (the advanced block: x and y at its end less 5 and 4, the floor at less 3), on the floor most of them stood
//   on. Checked: Flex's Voidscar Arena +12 adds up to 803 (108.8%), the same as Raider.IO's own list of that run
// - Lust: a Bloodlust-type buff landing on the group (Time Warp, ID 80353, on Flex's +19 of Oct 10); within 20 s is the same Lust
// - big cooldowns: each player's casts of their spec's big cooldowns, the Rotation tab's own list (GEN_SPECS[spec].cds)
// - damage taken: what enemies did to the group, each pull)
const MP_LUST = /^(bloodlust|heroism|time warp|primal rage|fury of the aspects|harrier's cry)$|drums/i;
function mpScan(it, R, text) {
  const T = MP_ROUTE[mpLc(R.run.dungeon || it.boss)], P = R.pulls, N = P.length, ADV = 19, NPC = /^(Creature|Vehicle)-/;
  const ui = T ? new Set(T.floors.map((f) => f[0])) : new Set(), pts = P.map(() => ({ x: [], y: [], u: [] })), add = P.map(() => 0), taken = P.map(() => 0), seen = new Set(), lustT = [], cast = {}, summoned = new Set();
  R.summoned = summoned;
  // (a minute or longer only: Colossus Smash, on the Arms list, isn't a big cooldown. Healers also get the engine's healing cooldowns (Aura
  // Mastery, Tranquility, Revival…, CD_NAMES), less Lust and the movement ones: some healer specs have no list on the Rotation tab)
  const HEAL_CD = [...((E.CD_NAMES && E.CD_NAMES.values()) || [])].map(mpLc).filter((n) => !MP_LUST.test(n) && !/^(stampeding roar|wind rush totem|blessing of protection)$/.test(n));
  const cdOf = new Map(); for (const p of R.people || []) { const g = typeof GEN_SPECS !== 'undefined' ? GEN_SPECS[p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || '')] : null, s = new Set();
    for (const c of (g && g.cds) || []) { if (c.cd && c.cd < 60) continue; s.add(mpLc(c.n)); for (const nm of c.names || []) s.add(mpLc(nm)); }
    if (p.role === 'healer') for (const n of HEAL_CD) s.add(n);
    if (s.size) cdOf.set(p.name, s); }
  const pullAt = (t) => { for (let i = N - 1; i >= 0; i--) if (t >= P[i].s - 2) return i; return 0; };
  const short = (n) => String(n || '').replace(/-.*$/, ''), num = (x) => { const v = +x; return v === v ? v : 0; };
  let t0 = null, pi = 0, i = 0;
  while (i < text.length) {
    let j = text.indexOf('\n', i); if (j < 0) j = text.length; const line = text.substring(i, j); i = j + 1;
    const ts = E.parseTs(line); if (!ts) continue; if (t0 == null) t0 = ts.ms; const t = (ts.ms - t0) / 1000;
    const c = line.indexOf(',', ts.body); if (c < 0) continue; const ev = line.substring(ts.body, c);
    if (ev === 'UNIT_DIED') { if (!T) continue; const f = E.split(line, c + 1), g = f[4]; if (!NPC.test(g || '') || f[8] === '1' || seen.has(g)) continue; seen.add(g); const v = T.n[+g.split('-')[5]]; if (v) add[pullAt(t)] += v; continue; }
    if (ev === 'SPELL_SUMMON') { const f = E.split(line, c + 1); if (f[5]) summoned.add(f[5]); continue; } /* (summoned: not counted in "what you pulled" (round 4)) */
    if (ev === 'SPELL_AURA_APPLIED') { if (line.indexOf('BUFF', c) < 0) continue; const f = E.split(line, c + 1); if (f[11] === 'BUFF' && String(f[4]).startsWith('Player-') && MP_LUST.test(f[9])) lustT.push([t, f[9]]); continue; }
    const dmg = ev === 'SPELL_DAMAGE' || ev === 'SPELL_PERIODIC_DAMAGE' || ev === 'SWING_DAMAGE' || ev === 'RANGE_DAMAGE';
    if (!dmg && ev !== 'SPELL_CAST_SUCCESS') continue;
    const f = E.split(line, c + 1);
    if (ev === 'SPELL_CAST_SUCCESS' && String(f[0]).startsWith('Player-')) { const nm = short(f[1]), s = cdOf.get(nm); if (s && s.has(mpLc(f[9]))) { const l = cast[nm] = cast[nm] || []; if (!l.some((x) => x[1] === f[9] && t - x[0] < 5)) l.push([t, f[9]]); } } /* (one press, even if the log writes it twice) */
    const adv = ev === 'SWING_DAMAGE' ? 8 : 11; if (f.length < adv + ADV) continue;
    if (dmg && NPC.test(f[0] || '') && String(f[4]).startsWith('Player-')) taken[pullAt(t)] += num(f[adv + ADV]);
    if (T && NPC.test(f[adv] || '')) { const u = +f[adv + 16]; if (ui.has(u)) { while (pi < N - 1 && t > P[pi].e) pi++; if (t >= P[pi].s && t <= P[pi].e) { const q = pts[pi]; q.x.push(+f[adv + 14]); q.y.push(+f[adv + 15]); q.u.push(u); } } }
  }
  // (a Lust or a cooldown pressed just before a pull counts for that pull: the pull it's in, else the next one starting within 15 s, else the one before)
  const pullFor = (t) => { for (let k = 0; k < N; k++) if (t >= P[k].s - 1 && t <= P[k].e + 1) return k; for (let k = 0; k < N; k++) if (P[k].s > t && P[k].s - t <= 15) return k; return pullAt(t); };
  lustT.sort((a, b) => a[0] - b[0]); R.lust = []; for (const [t, sp] of lustT) if (!R.lust.length || t - R.lust[R.lust.length - 1].t > 20) R.lust.push({ t, pull: pullFor(t), spell: String(sp || '').replace(/^"|"$/g, '') });
  // (a "big" cooldown pressed more often than once every 50 s in this key isn't one in this build: Flex's +19 Arms Warrior pressed Bladestorm,
  // ID 446035, every 20 to 40 s. Dropped by what the log shows)
  R.cds = {}; for (const [nm, l] of Object.entries(cast)) { const bySp = new Map(); for (const x of l) bySp.set(x[1], (bySp.get(x[1]) || []).concat(x[0]));
    const keep = new Set([...bySp].filter(([, ts]) => { if (ts.length < 3) return true; const g = ts.slice(1).map((t, k) => t - ts[k]).sort((a, b) => a - b); return g[g.length >> 1] >= 50; }).map(([s]) => s));
    R.cds[nm] = l.filter((x) => keep.has(x[1])).map(([t, sp]) => ({ t, spell: sp, pull: pullFor(t) })); }
  R.cdWho = [...cdOf.keys()]; R.taken = taken;
  if (!T) { R.route = null; return; }
  const med = (a) => { const s = a.slice().sort((p, q) => p - q); return s[s.length >> 1]; };
  const out = P.map((p, k) => { const q = pts[k], cn = {}; for (const u of q.u) cn[u] = (cn[u] || 0) + 1; const top = Object.entries(cn).sort((a, b) => b[1] - a[1])[0]; if (!top) return { n: p.n, add: add[k], ui: null };
    const u = +top[0], xs = q.x.filter((x, m) => q.u[m] === u), ys = q.y.filter((x, m) => q.u[m] === u); return { n: p.n, add: add[k], ui: u, x: med(xs), y: med(ys) }; });
  const total = add.reduce((a, v) => a + v, 0), done = !!R.run.timeMs && !R.run.left;
  R.route = { full: T.full, zone: T.zone, floors: T.floors, pulls: out, total, ok: !done || total >= T.full * 0.99 };
}
function mpRouteHtml(R, F, waiting) {
  const rt = R.route; if (!rt || !rt.pulls.length) return '';
  const fr = F && F.route && F.route.full === rt.full ? F.route : null, ok = rt.ok && (!fr || fr.ok);
  const pc = (v) => 100 * v / rt.full, fmt = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '') + '%';
  const cum = (rr, RR) => { let t = 0; return rr.pulls.map((q, i) => { t += q.add; const p = RR.pulls[i]; return { ...q, p, boss: p.boss && p.kill !== false ? p.boss : null, tot: pc(t), wipe: !!mpWipe(p, Math.max(1, (RR.people || []).length)) }; }); };
  const Y = cum(rt, R), Fa = fr ? cum(fr, F) : null, yEnd = pc(rt.total), fEnd = fr ? pc(fr.total) : 0, done = !!R.run.timeMs && !R.run.left;
  const what = (q) => (q.p.boss ? esc(q.p.boss) + (q.p.kill === false ? ' (not killed)' : '') : (q.p.mobs || []).slice(0, 3).map((m) => (m[1] > 1 ? m[1] + ' ' : '') + esc(m[0])).join(', ') + ((q.p.mobs || []).length > 3 ? ' and ' + (q.p.mobs.length - 3) + ' more' : ''));
  // four plain lines
  const lines = [];
  if (ok) {
    const cross = Y.findIndex((q) => q.tot >= 99.95);
    if (cross > 0 && pc(Y[cross].add) - (100 - Y[cross - 1].tot) > 2) lines.push('<b>You reached ' + fmt(Y[cross - 1].tot) + ' after pull ' + Y[cross - 1].n + '.</b> Pull ' + Y[cross].n + ' added ' + fmt(pc(Y[cross].add)) + ' when you needed ' + fmt(100 - Y[cross - 1].tot) + '.');
    else if (cross >= 0) lines.push('<b>Pull ' + Y[cross].n + ' took you to 100%.</b>');
    else lines.push('<b>You reached ' + fmt(yEnd) + '</b> before the key ended.');
    if (Fa) { const segs = (L) => { const out = []; let from = '', acc = 0, k = 0; for (const q of L) { if (!q.p.boss) k++; acc += pc(q.add); if (q.boss) { out.push({ from, to: q.boss, f: acc, k }); from = q.boss; acc = 0; k = 0; } } return out; };
      const fs = new Map(segs(Fa).map((s) => [s.to, s])), pairs = segs(Y).map((s) => ({ s, f: fs.get(s.to) })).filter((x) => x.f && x.s.k + x.f.k > 0).sort((a, b) => Math.abs(b.s.k - b.f.k) - Math.abs(a.s.k - a.f.k) || Math.abs(b.s.f - b.f.f) - Math.abs(a.s.f - a.f.f));
      const pr = pairs[0]; if (pr && (pr.s.k !== pr.f.k || Math.abs(pr.s.f - pr.f.f) >= 5)) lines.push('<b>' + (pr.s.from ? 'Between ' + esc(pr.s.from) + ' and ' + esc(pr.s.to) : 'Before ' + esc(pr.s.to)) + ' you got ' + fmt(pr.s.f) + ' in ' + plural(pr.s.k, 'pull') + '.</b> The fast run got ' + fmt(pr.f.f) + ' in ' + plural(pr.f.k, 'pull') + '.'); }
    if (done) lines.push('<b>' + (yEnd > 100.5 ? 'You ended at ' + fmt(yEnd) + ' enemy forces.' : 'You ended right on 100% enemy forces.') + '</b>' + (Fa ? (fEnd > 100.5 ? ' The fast run ended at ' + fmt(fEnd) + '.' : ' The fast run ended right on 100%.') : ''));
    const big = Y.filter((q) => !q.p.boss).sort((a, b) => b.add - a.add)[0], fbig = Fa ? Fa.filter((q) => !q.p.boss).sort((a, b) => b.add - a.add)[0] : null;
    if (big) lines.push('<b>Your biggest pull was pull ' + big.n + ': ' + fmt(pc(big.add)) + ' in ' + mpMM(big.p.dur) + '.</b>' + (fbig ? ' The fast run\'s biggest was ' + fmt(pc(fbig.add)) + ' in ' + mpMM(fbig.p.dur) + '.' : ''));
  } else lines.push('The enemy counts for ' + esc(R.run.dungeon) + ' aren\'t complete yet, so this shows where you pulled, without how much each pull counted.');
  // two strips: each pull a piece as wide as what it counted, bosses a gold mark, past 100% striped red
  const SC = Math.max(106, yEnd + 2, fEnd + 2), X = (v) => (100 * v / SC).toFixed(2) + '%';
  // (each boss's name, and a short one (its first word) for when names would touch: mpLabelFit places them once the page is drawn)
  const strip = (L, cls, end) => { let prev = 0; const fr = cls === 'mpt-sf'; return '<div class="mpt-strip ' + cls + '">' + L.map((q) => { const w = q.tot - prev;
    let s = w > 0.05 ? '<i class="mpt-sp" style="left:' + X(prev) + ';width:' + X(w) + '"' + mpT1('<b>' + (fr ? 'Fast run, pull ' : 'Pull ') + q.n + '</b>: +' + fmt(w) + ' enemy forces, ' + fmt(q.tot) + ' total.<br><span class="sub">' + what(q) + '</span>') + '><b>' + (w >= 2.4 ? q.n : '') + '</b></i>' : '';
    if (q.boss) s += '<i class="mpt-sbm" style="left:' + X(q.tot) + '"' + mpT1('<b>' + esc(q.boss) + ' down</b> at ' + fmt(q.tot) + ' enemy forces' + (fr ? ' in the fast run.' : '.')) + '><em data-f="' + esc(q.boss) + '" data-s="' + esc(q.boss.replace(/^The /, '').split(/[ ,]/)[0]) + '">' + esc(q.boss) + '</em></i>';
    prev = q.tot; return s; }).join('') + (end > 100 ? '<u style="left:' + X(100) + ';width:' + X(end - 100) + '"' + mpT1('<b>Extra enemies past 100%</b>: ' + fmt(end - 100) + (fr ? ' the fast run didn\'t need to kill.' : ' you didn\'t need to kill.')) + '></u>' : '') + '<i class="mpt-s100" style="left:' + X(100) + '"></i></div>'; };
  const strips = ok ? '<h3 class="mpt-h3 mpt-h3a">How much each pull added toward 100% enemy forces' + mpInfo('<b>How to read it</b><br>Each piece is one pull. The wider it is, the more of the dungeon\'s enemies it cleared. 100% finishes the key. Hover a piece for its pull.') + '</h3><div class="mpt-fz"><div class="mpt-fzk">' + [0, 25, 50, 75].map((v) => '<span style="left:' + X(v) + '">' + v + '%</span>').join('') + '<span class="mpt-r100" style="left:' + X(100) + '">100%</span></div>' +
    '<div class="mpt-row"><span class="mpt-rll">You</span>' + strip(Y, 'mpt-sy', yEnd) + '<span class="mpt-end">' + fmt(yEnd) + '</span></div>' +
    (Fa ? '<div class="mpt-row"><span class="mpt-rll"' + mpT1('<b>A typical fast run</b>: the same one as in Where you fell behind.') + '>Fast run</span>' + strip(Fa, 'mpt-sf', fEnd) + '<span class="mpt-end">' + fmt(fEnd) + '</span></div>' : '<div class="mpt-row"><span class="mpt-rll">Fast run</span><span class="mpt-strip0">' + (waiting ? 'Finding a typical fast run…' : 'No public fast run at this level yet.') + '</span></div>') +
    '<div class="mpt-key"><span><i class="mpt-k1"></i>Your pulls (number inside)</span>' + (Fa ? '<span><i class="mpt-k4"></i>Fast run\'s pulls</span>' : '') + '<span><i class="mpt-k2 mpt-kbar"></i>Boss</span><span><i class="mpt-kover"></i>Over 100%: extra you didn\'t need</span></div></div>' : '';
  // on the map: one picture per floor, your pulls numbered in order on a dashed path, the fast run's as small grey dots
  const at = (f, q) => [Math.max(2, Math.min(98, 100 * (f[5] - q.y) / (f[5] - f[4]))), Math.max(2, Math.min(98, 100 * (f[3] - q.x) / (f[3] - f[2])))];
  // (dots closer than a dot's width are nudged apart (the Design studio's audit: pulls 6, 7 and 11 piled up in The Blinding Vale); the
  // path still runs through the real spots, and a short line joins a nudged dot to its spot. Worked out at the small map's size, 400 by 267)
  const spread = (P) => { const W = 400, H = 267, D = 23, q = P.map(([x, y]) => [x * W / 100, y * H / 100]);
    for (let it = 0; it < 40; it++) { let moved = false; for (let i = 0; i < q.length; i++) for (let j = i + 1; j < q.length; j++) { let dx = q[j][0] - q[i][0], dy = q[j][1] - q[i][1], d = Math.hypot(dx, dy); if (d >= D) continue; moved = true; if (d < 0.01) { dx = 1; dy = 0.4; d = Math.hypot(dx, dy); } const k = (D - d) / 2 / d; q[i][0] -= dx * k; q[i][1] -= dy * k; q[j][0] += dx * k; q[j][1] += dy * k; }
      for (const p of q) { p[0] = Math.max(12, Math.min(W - 12, p[0])); p[1] = Math.max(12, Math.min(H - 12, p[1])); } if (!moved) break; }
    return q.map(([x, y]) => [100 * x / W, 100 * y / H]); };
  const maps = rt.floors.map((f, i) => ({ f, i, mine: Y.filter((q) => q.ui === f[0] && q.x != null), fast: Fa ? Fa.filter((q) => q.ui === f[0] && q.x != null) : [] })).filter((m) => m.mine.length || m.fast.length).map((m) => {
    const path = (L, cls) => (L.length > 1 ? '<polyline class="' + cls + '" points="' + L.map((q) => at(m.f, q).join(',')).join(' ') + '"/>' : '');
    const real = m.mine.map((q) => at(m.f, q)), shown = spread(real), lead = real.map((r, j) => (Math.hypot((r[0] - shown[j][0]) * 4, (r[1] - shown[j][1]) * 2.67) > 3 ? '<line class="mpt-pl2" x1="' + r[0].toFixed(1) + '" y1="' + r[1].toFixed(1) + '" x2="' + shown[j][0].toFixed(1) + '" y2="' + shown[j][1].toFixed(1) + '"/>' : '')).join('');
    return '<figure class="mpt-fl"><div class="mpt-mp"><img src="https://wow.zamimg.com/images/wow/maps/enus/original/' + rt.zone + (m.i ? '-' + m.i : '') + '.jpg" alt="" loading="lazy" onerror="this.remove()">' +
      '<svg class="mpt-rl" viewBox="0 0 100 100" preserveAspectRatio="none">' + path(m.fast, 'mpt-pf') + path(m.mine, 'mpt-py') + lead + '</svg>' +
      m.fast.map((q) => { const [x, y] = at(m.f, q); return '<span class="mpt-fdot" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%"' + mpT1('<b>Fast run, pull ' + q.n + '</b>' + (ok && q.add ? ': +' + fmt(pc(q.add)) + ' enemy forces.' : '') + '<br><span class="sub">' + what(q) + '</span>') + '></span>'; }).join('') +
      m.mine.map((q, j) => { const [x, y] = shown[j]; return '<span class="mpt-dot' + (q.p.boss ? ' mpt-bo' : '') + (q.wipe ? ' mpt-wp' : '') + '" data-n="' + q.n + '" role="button" tabindex="0" aria-label="' + esc('Pull ' + q.n + ': ' + what(q).replace(/<[^>]+>/g, '')) + '" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%">' + q.n + '</span>'; }).join('') + /* (its card on hover or tap; a click opens the pull below (round 4)) */
      '</div><figcaption><b>' + esc(m.f[1]) + '</b>' + (m.mine.length ? ' · ' + (m.mine.length === 1 ? 'pull ' + m.mine[0].n : 'pulls ' + m.mine[0].n + '–' + m.mine[m.mine.length - 1].n) : '') + '</figcaption></figure>'; });
  const map = maps.length ? '<h3 class="mpt-h3">On the map' + mpInfo('<b>How to read it</b><br>Where each pull happened. Blue dots are you, in order' + (Fa ? '; grey dots are the fast run' : '') + '. Click a dot to open that pull.') + '</h3><div class="mpt-maps">' + maps.join('<span class="mpt-arr">›</span>') + '</div><div class="mpt-key"><span><i class="mpt-k1 mpt-kdot"></i>Your pull, in order</span><span><i class="mpt-k2 mpt-kdot"></i>Boss</span><span><i class="mpt-k1 mpt-kdot mpt-kwp"></i>A wipe</span>' + (Fa ? '<span><i class="mpt-k4 mpt-kdot"></i>Fast run\'s pulls</span>' : '') + '<span>Hover a dot for its pull, click it to open the pull below; click the map to make it bigger</span></div>' : '';
  /* (the side-by-side table moved into Pulls, beside each stretch (round 4)) */
  const credit = ok ? '<p class="mpt-ex">Enemy counts from <a href="https://raider.io" target="_blank" rel="noopener">Raider.IO</a>. The dots show where each pull happened, from your log.</p>' : '<p class="mpt-ex">The dots show where each pull happened, from your log.</p>';
  const say = '<ul class="mpt-say">' + lines.map((l) => '<li>' + l + '</li>').join('') + '</ul>';
  /* (one floor: its map beside the lines and strips, not alone in a row (the Design studio's audit)) */
  return mpSec('Your route', 'You pulled <b>' + plural(R.pulls.length, 'time') + '</b>' + (F ? '; the fast run pulled <b>' + F.pulls.length + '</b>.' : '.'), (maps.length === 1 ? '<div class="mpt-rt1"><div>' + say + strips + '</div><div>' + map + '</div></div>' : say + strips + map) + credit, 'mptRoute');
}
// (a map grows to twice its size on click, and back (Flex's rule: maps stay small and grow only on click); one at a time)
document.addEventListener('click', (e) => { const mp = e.target.closest && e.target.closest('.mpt-mp'); if (!mp) return; const fl = mp.closest('.mpt-fl'), big = !fl.classList.contains('mpt-big');
  document.querySelectorAll('.mpt-fl.mpt-big').forEach((x) => x.classList.remove('mpt-big')); document.querySelectorAll('.mpt-zoom').forEach((x) => x.classList.remove('mpt-zoom'));
  if (big) { fl.classList.add('mpt-big'); for (const p of [mp.closest('.mpt-maps'), mp.closest('.mpt-rt1')]) if (p) p.classList.add('mpt-zoom'); } mpLabelFit(); });
// (the boss names on the strips never touch (the Design studio's audit): each goes in the first place it fits, its full name close to the
// strip, then one row further out, then its short name, else only on hover. Measured on the page, so it suits any width; again on resize)
function mpLabelFit() {
  for (const st of document.querySelectorAll('.mpt .mpt-strip')) {
    const row = st.closest('.mpt-row'), ems = [...st.querySelectorAll('.mpt-sbm em')], placed = [[], []]; let far = false;
    for (const em of ems) {
      em.classList.remove('mpt-r1', 'mpt-hd'); em.textContent = em.dataset.f;
      const tryAt = (txt, r) => { em.textContent = txt; const b = em.getBoundingClientRect(); if (!b.width) return true; if (placed[r].some(([l, rr]) => b.left < rr + 8 && b.right > l - 8)) return false; placed[r].push([b.left, b.right]); if (r) { em.classList.add('mpt-r1'); far = true; } return true; };
      if (!(tryAt(em.dataset.f, 0) || tryAt(em.dataset.f, 1) || tryAt(em.dataset.s, 0) || tryAt(em.dataset.s, 1))) { em.classList.add('mpt-hd'); em.textContent = em.dataset.f; }
    }
    if (row) row.classList.toggle(st.classList.contains('mpt-sf') ? 'mpt-row2d' : 'mpt-row2u', far);
  }
}
let MP_RSZ = 0; window.addEventListener('resize', () => { clearTimeout(MP_RSZ); MP_RSZ = setTimeout(() => { if (S.page === 'mplus') { mpLabelFit(); mpJbTop(); } }, 150); });
// (the jump bar sticks just under the site's own tab bar, which sticks to the top too)
function mpJbTop() { const tb = document.querySelector('#main > .tabbar'), m = document.querySelector('#view .mpt'); if (m) m.style.setProperty('--mpt-jbt', (tb ? tb.offsetHeight : 0) + 'px'); }
// (the maps you can use (round 4, Flex: "it might also be nice if you could interact with the maps and it display information"): hover a dot, or tap
// it on a phone, for its pull's card (MP.pinfo); click it to open that pull in the list below, which flashes; hover a pull for its dot. The card
// keeps on screen and hides on scroll; a click on the map anywhere else still makes it bigger)
let MP_CARD = null, MP_PT = '';
function mpCardEl() { if (!MP_CARD || !document.body.contains(MP_CARD)) { MP_CARD = document.createElement('div'); MP_CARD.className = 'mpt-card'; MP_CARD.hidden = true; document.body.appendChild(MP_CARD); } return MP_CARD; }
function mpHl(n) { document.querySelectorAll('.mpt-dot.mpt-hl, .mpt-pr.mpt-hl').forEach((x) => x.classList.remove('mpt-hl')); if (!n) return;
  document.querySelectorAll('.mpt-dot[data-n="' + n + '"]').forEach((x) => x.classList.add('mpt-hl')); const r = document.getElementById('mpt-pull-' + n); if (r) r.classList.add('mpt-hl'); }
function mpCardShow(dot) { const p = (MP.pinfo || {})[dot.dataset.n]; if (!p) return; const c = mpCardEl();
  c.innerHTML = '<div class="mpt-ch"><b>' + p.t + '</b><span>' + p.len + '</span></div><p class="mpt-ct">' + p.at + (p.add ? ' · <b>' + p.add + '</b> forces, ' + p.tot + ' total' : '') + '</p><p class="mpt-cm">' + p.mobs + '</p>' +
    (p.tags ? '<div class="mpt-cg">' + p.tags + '</div>' : '') + (p.dd.length ? '<p class="mpt-cd">' + p.dd.join('<br>') + '</p>' : '') + '<p class="mpt-cs">' + (MP_PT === 'touch' ? 'Tap again' : 'Click') + ' to open this pull below</p>';
  c.hidden = false; c.dataset.n = dot.dataset.n; const r = dot.getBoundingClientRect(), w = c.offsetWidth, h = c.offsetHeight;
  let y = r.top - h - 10; if (y < 8) y = r.bottom + 10; if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8);
  c.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))) + 'px'; c.style.top = Math.round(y) + 'px'; mpHl(dot.dataset.n); }
function mpCardHide() { if (MP_CARD) { MP_CARD.hidden = true; MP_CARD.dataset.n = ''; } mpHl(0); }
document.addEventListener('pointerdown', (e) => { MP_PT = e.pointerType || ''; }, true);
document.addEventListener('mouseover', (e) => { if (S.page !== 'mplus' || MP_PT === 'touch') return; const t = e.target; if (!t.closest) return;
  const d = t.closest('.mpt-dot'); if (d) { mpCardShow(d); return; }
  const s = t.closest('.mpt-pr > summary'); if (s) { if (MP_CARD) MP_CARD.hidden = true; mpHl(s.parentNode.dataset.n); return; }
  if ((MP_CARD && !MP_CARD.hidden) || document.querySelector('.mpt-hl')) mpCardHide(); });
document.addEventListener('click', (e) => { const d = e.target.closest && e.target.closest('.mpt-dot'); if (!d) return; e.preventDefault(); e.stopPropagation();
  if (MP_PT === 'touch' && (!MP_CARD || MP_CARD.hidden || MP_CARD.dataset.n !== d.dataset.n)) { mpCardShow(d); return; } /* (a phone: the first tap shows the card) */
  mpCardHide(); const row = document.getElementById('mpt-pull-' + d.dataset.n); if (!row) return;
  const sec = row.closest('details.mpt-fold'); if (sec) sec.open = true; /* (Pulls starts folded) */
  row.open = true; row.scrollIntoView({ behavior: 'smooth', block: 'center' }); row.classList.add('mpt-flash'); setTimeout(() => row.classList.remove('mpt-flash'), 1400); }, true);
document.addEventListener('keydown', (e) => { if (e.key !== 'Enter' || !e.target.classList || !e.target.classList.contains('mpt-dot')) return; e.target.click(); });
window.addEventListener('scroll', () => { if (MP_CARD && !MP_CARD.hidden) mpCardHide(); }, { passive: true });

// ---------- the look (the Design studio's round 3; site colours, so the themes apply) ----------
function mpCss() { if (document.getElementById('mpt-css')) return; const st = document.createElement('style'); st.id = 'mpt-css'; st.textContent = MP_CSS; document.head.appendChild(st); }
const MP_CSS = `
.mpt{--mpt-soft:#d6d1c6;--mpt-badT:#ff8f87;--mpt-goodT:#7ee08f;--mpt-ab:#c39bff;--mpt-you:#5b8def;--mpt-lane:#191d26;--mpt-fast:#5d6577;max-width:1180px;margin:0 auto;padding:0 0 80px;font:15px/1.5 var(--body)}
.mpt .mpt-g{color:var(--mpt-goodT)} .mpt .mpt-bad{color:var(--mpt-badT)} .mpt .mpt-m{color:var(--muted)} .mpt .mpt-ab{color:var(--mpt-ab)} .mpt .mpt-nm{font-weight:700}
.mpt .mpt-k{margin:0;font:700 12.5px var(--head);letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
.mpt-pick{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 0 0;font:600 13.5px var(--body);color:var(--muted)}
.mpt-pick select{max-width:100%;background:var(--raised);border:1px solid var(--line2);border-radius:4px;padding:5px 8px;color:var(--text);font:600 13.5px var(--body)}
.mpt-load{padding:30px 0}
.mpt-err,.mpt-note{margin:18px 0;padding:12px 14px;border-left:3px solid var(--mpt-badT);color:var(--mpt-soft)}
.mpt-note{border-left-color:var(--line2)}
.mpt-ban{position:relative;display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:20px 0;border-bottom:1px solid var(--line)}
.mpt-kb{width:68px;height:68px;border-radius:4px;display:grid;place-items:center;font:700 30px var(--head);color:var(--gold);border:2px solid color-mix(in srgb,var(--gold) 60%,transparent);background:color-mix(in srgb,var(--gold) 8%,transparent);flex:none}
.mpt-bt h1{margin:1px 0 6px;font:700 34px/1 var(--head)}
.mpt-pills{display:flex;gap:8px;flex-wrap:wrap}
.mpt-pill{font:700 13px var(--head);letter-spacing:.04em;padding:2px 10px;border-radius:999px;border:1px solid var(--line2);color:var(--mpt-soft)}
.mpt-pill.mpt-g{border-color:rgba(126,224,143,.45);background:rgba(126,224,143,.07)}
.mpt-pill.mpt-b{color:var(--mpt-badT);border-color:rgba(255,143,135,.45)}
.mpt-pill.mpt-a{color:#f2c46b;border-color:rgba(242,196,107,.5);background:rgba(242,196,107,.07)}
.mpt-grp{margin-left:auto;display:flex;gap:14px;flex-wrap:wrap}
.mpt-gm{display:inline-flex;align-items:center;gap:5px;font:600 14px var(--body)}
.mpt-gm b{font-weight:700}
.mpt-ro{width:13px;height:13px;fill:currentColor;opacity:.85;flex:none}
.mpt-fx{margin:20px 0 0;padding:4px 0 4px 18px;border-left:3px solid var(--gold)}
.mpt-fxh{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:6px}
.mpt-fxh h2{margin:0;font:700 22px var(--head);color:var(--gold)}
.mpt-fxh span{font:500 15px var(--body);color:var(--mpt-soft)}
.mpt-fxr{display:grid;grid-template-columns:28px minmax(0,1fr) 130px;gap:12px;align-items:start;padding:10px 0;border-top:1px solid var(--line)}
.mpt-fxh + .mpt-fxr{border-top:0}
.mpt-fxn{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--gold) 14%,transparent);color:var(--gold);font:700 13.5px var(--head);margin-top:2px}
.mpt-fxt{font:700 18px var(--head)}
.mpt-fxr p{margin:1px 0 0;color:var(--mpt-soft);font-size:15px}
.mpt-fxs{text-align:right}
.mpt-fxs b{display:block;font:700 22px var(--head)}
.mpt-fxs small{font:500 12.5px var(--body);color:var(--faint)}
.mpt-none{margin:6px 0;color:var(--muted)}
.mpt-tiles{display:flex;margin-top:22px;padding:12px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.mpt-tile{flex:1;min-width:0;padding:0 16px;border-left:1px solid var(--line)}
.mpt-tile:first-child{border-left:0;padding-left:0}
.mpt-tile > b{display:block;font:700 22px/1.15 var(--head);margin:1px 0}
.mpt-tile span{font:500 13px var(--body);color:var(--muted);white-space:nowrap}
.mpt-sec{margin-top:32px;scroll-margin-top:calc(var(--mpt-jbt,0px) + 58px)}
.mpt-jb{position:sticky;top:var(--mpt-jbt,0px);z-index:5;display:flex;gap:6px;padding:8px 0;background:color-mix(in srgb,var(--bg) 94%,transparent);backdrop-filter:blur(6px);border-bottom:1px solid var(--line);overflow-x:auto;scrollbar-width:none}
.mpt-jb button{font:600 13.5px var(--head);letter-spacing:.04em;color:var(--muted);background:none;padding:4px 12px;border-radius:999px;border:1px solid var(--line2);white-space:nowrap;cursor:pointer}
.mpt-jb button:hover{color:var(--text);border-color:var(--faint)}
.mpt-sh{display:flex;align-items:baseline;gap:6px 12px;margin-bottom:12px;flex-wrap:wrap}
.mpt-sh h2{margin:0;font:700 22px var(--head)}
.mpt-sh .mpt-hl{font:500 15px var(--body);color:var(--mpt-soft)} .mpt-sh .mpt-hl b{color:var(--text)} .mpt-sh .mpt-hl b.mpt-bad{color:var(--mpt-badT)} .mpt-sh .mpt-hl b.mpt-ab{color:var(--mpt-ab)}
.mpt .mpt-i{align-self:center;width:20px;height:20px;font-size:12px}
.mpt .mpt-a{color:#f2c46b} .mpt-tile b.mpt-m{color:var(--muted)}
/* (folded sections (the "easier on the eyes" round): the title, the headline sentence and a Show pill; a click opens it) */
.mpt-fold{margin-top:22px;border-top:1px solid var(--line2)}
.mpt-fold > summary{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:baseline;column-gap:14px;margin:0;padding:12px 2px;cursor:pointer;list-style:none}
.mpt-fold > summary::-webkit-details-marker{display:none}
.mpt-fold > summary:hover h2{color:var(--gold)}
.mpt-fold[open] > summary{margin-bottom:6px}
.mpt-chev{align-self:center;font:600 13px var(--head);letter-spacing:.05em;color:var(--muted);border:1px solid var(--line2);border-radius:999px;padding:1px 12px;white-space:nowrap}
.mpt-chev::before{content:"Show"} .mpt-fold[open] > summary .mpt-chev::before{content:"Hide"}
.mpt-fold > summary:hover .mpt-chev{color:var(--text);border-color:var(--faint)}
.mpt-fb{padding:0 0 6px}
/* (the split bar in "Where your M:SS went": thin, no words inside, a key under it) */
.mpt-sbar{display:flex;height:10px;border-radius:5px;overflow:hidden;margin:10px 0 6px}
.mpt-sbar i{display:block;min-width:4px;cursor:help;box-shadow:inset -2px 0 0 var(--bg)} .mpt-sbar i:last-child{box-shadow:none} .mpt-sbar i:hover,.mpt-sbar i:focus{filter:brightness(1.2);outline:none}
.mpt-sb-f{background:#7d9be8} .mpt-sb-s{background:#e8b45a} .mpt-sb-d{background:#e57068}
.mpt-sk{display:flex;gap:6px 18px;flex-wrap:wrap;font:500 13.5px var(--body);color:var(--muted);margin-bottom:6px} .mpt-sk b{color:var(--text)}
.mpt-sk i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}
/* (the pieces with a hover) */
.mpt-blk,.mpt-dth,.mpt-lst,.mpt-cp,.mpt-fbar,.mpt-mk span,.mpt-sp,.mpt-sbm,.mpt-strip u,.mpt-fdot,.mpt-c[data-tt],.mpt-vs[data-tt],.mpt-ll[data-tt]{cursor:help}
.mpt-blk:hover,.mpt-sp:hover,.mpt-fbar:hover{filter:brightness(1.2)}
.mpt-cdl{text-decoration:underline dotted var(--faint);text-underline-offset:3px;cursor:help;width:fit-content}
.mpt-h3 .mpt-i{display:inline-grid;margin-left:8px;vertical-align:2px}
.mpt-h3.mpt-h3a{margin:22px 0 4px}
.mpt-tl{margin-left:84px}
.mpt-mk{position:relative;height:18px}
.mpt-mk span{position:absolute;transform:translateX(-50%);font:700 12px var(--body);color:var(--muted);white-space:nowrap}
.mpt-lanes{position:relative}
.mpt-vl{position:absolute;top:0;bottom:0;width:1.5px;background:rgba(236,232,223,.16)}
.mpt-ln{position:relative;display:flex;align-items:center;height:34px;margin-left:-84px}
.mpt-ll{width:84px;flex:none;font:700 14px var(--head)}
.mpt-lt{position:relative;flex:1;height:16px;border-radius:4px;background:var(--mpt-lane)}
.mpt-lt0{background:none;display:flex;align-items:center}
.mpt-lt0 span{font:500 13px var(--body);color:var(--faint)}
.mpt-blk{position:absolute;top:0;bottom:0;background:var(--mpt-you);border-radius:2px;box-shadow:inset -1px 0 0 var(--bg)}
.mpt-blk.mpt-bo{background:var(--gold)}
.mpt-dth{position:absolute;top:-3px;bottom:-3px;background:var(--bad);border-radius:2px;min-width:2px}
.mpt-fbar{position:absolute;left:0;top:4px;bottom:4px;border-radius:4px;background:var(--mpt-fast)}
.mpt-cp{position:absolute;top:50%;transform:translate(-50%,-50%)}
.mpt-cp i{display:block;width:11px;height:11px;transform:rotate(45deg);background:var(--text);border:2px solid var(--bg)}
.mpt-gp{position:relative;height:var(--mpt-gph,40px);margin-top:4px}
.mpt-gp span{position:absolute;top:var(--mpt-gpt,0);transform:translateX(-50%);font:500 12.5px/1.3 var(--body);color:var(--muted);text-align:center;white-space:nowrap}
.mpt-gp span:last-child{transform:translateX(-80%)}
.mpt-gp b{display:block;color:var(--text);font-weight:700}
.mpt-key{display:flex;gap:16px;flex-wrap:wrap;margin:6px 0 0 84px;font:500 12.5px var(--body);color:var(--faint)}
.mpt-key i{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.mpt-k1{background:var(--mpt-you)} .mpt-k2{background:var(--gold)} .mpt-k3{background:var(--bad)} .mpt-k4{background:var(--mpt-fast)} .mpt-kd{background:var(--text);transform:rotate(45deg) scale(.8)}
.mpt-wyh,.mpt-wyr{display:grid;grid-template-columns:minmax(0,1.5fr) repeat(6,minmax(0,1fr));gap:12px;align-items:center;padding:9px 0}
.mpt-wyh{margin-top:18px;font:700 12px var(--head);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line)}
.mpt-wyr{border-bottom:1px solid var(--line)}
.mpt-sn{font:700 15px var(--head)}
.mpt-sn small{display:block;font:500 12.5px var(--body);color:var(--muted)}
.mpt-c b{display:block;font:700 16px var(--head);font-variant-numeric:tabular-nums}
.mpt-c small{font:500 12.5px var(--body);color:var(--faint)}
.mpt-why{margin:12px 0 0;color:var(--mpt-soft)}
.mpt-ex{margin:6px 0 0;font:500 13px var(--body);color:var(--faint)}
.mpt-plh,.mpt-pr summary,.mpt-sum{display:grid;grid-template-columns:100px minmax(0,1fr) 46px 96px 230px;gap:12px;align-items:baseline;padding:8px 6px}
.mpt-plh{margin-right:270px} .mpt-plh.mpt-plh1{margin-right:0}
.mpt-pf{font:700 14px var(--head);white-space:nowrap;font-variant-numeric:tabular-nums} .mpt-pf small{font:500 12px var(--body);color:var(--faint);margin-left:3px}
.mpt-sg{margin-top:14px;border-top:1px solid var(--line2)}
.mpt-sgh{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;padding:9px 6px 6px}
.mpt-sgh > b{font:700 16px var(--head)} .mpt-sgh span{font:500 13.5px var(--body);color:var(--muted)}
.mpt-sgb{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:20px} .mpt-sgb.mpt-sgb1{grid-template-columns:minmax(0,1fr)}
.mpt-fp{padding:6px 0 0 14px;border-left:1px solid var(--line)}
.mpt-fp .mpt-k{margin-bottom:4px}
.mpt-fpr{display:flex;gap:10px;justify-content:space-between;align-items:baseline;padding:4px 0;font:500 13px var(--body);color:var(--muted)}
.mpt-fpr.mpt-bo span{color:var(--gold);font-weight:700}
.mpt-fpr b{color:var(--mpt-soft);font:700 13px var(--head);white-space:nowrap}
.mpt-pr[data-empty] summary{cursor:default}
.mpt-pr.mpt-hl > summary{background:rgba(91,141,239,.10)}
.mpt-pr.mpt-flash > summary{background:color-mix(in srgb,var(--gold) 22%,transparent)}
.mpt-dot{cursor:pointer;transition:transform .12s}
.mpt-dot.mpt-hl{transform:translate(-50%,-50%) scale(1.3);z-index:3;outline:3px solid rgba(236,232,223,.85);outline-offset:1px}
.mpt-card{position:fixed;z-index:60;width:270px;background:var(--panel);border:1px solid color-mix(in srgb,var(--gold) 45%,transparent);border-radius:4px;padding:9px 11px;font:500 12.5px/1.4 var(--body);color:var(--text);box-shadow:0 12px 30px rgba(0,0,0,.6);pointer-events:none}
.mpt-card[hidden]{display:none}
.mpt-ch{display:flex;justify-content:space-between;align-items:baseline;gap:10px} .mpt-ch b{font:700 15px var(--head)} .mpt-ch span{color:var(--muted);font-weight:600}
.mpt-ct{margin:3px 0;color:#d6d1c6} .mpt-ct b{color:var(--text)}
.mpt-cm{margin:0 0 6px;color:var(--muted)}
.mpt-cg{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:5px}
.mpt-card .mpt-cg{gap:3px 12px}
.mpt-cd{margin:0;color:#ff8f87}
.mpt-cs{margin:6px 0 0;font-size:12px;color:var(--faint)}
.mpt-plh{font:700 12px var(--head);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line)}
.mpt-pr{border-bottom:1px solid var(--line)}
.mpt-pr summary{cursor:pointer;list-style:none}
.mpt-pr summary::-webkit-details-marker{display:none}
.mpt-pr summary:hover{background:rgba(255,255,255,.025)}
.mpt-pn{font:700 15px var(--head)}
.mpt-pr.mpt-boss .mpt-pn{color:var(--gold)}
.mpt-pm{font:500 13.5px var(--body);color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpt-pt{font:700 15px var(--head);font-variant-numeric:tabular-nums}
.mpt-pc{display:flex;gap:3px 14px;flex-wrap:wrap}
/* (quiet tags (the "easier on the eyes" round): sentence case, a small dot in front, no box; red for deaths and wipes, yellow for Lust) */
.mpt-tg{display:inline-flex;align-items:center;gap:5px;font:500 13px var(--body);color:var(--muted);white-space:nowrap}
.mpt-tg::before{content:"";width:6px;height:6px;border-radius:50%;background:#6c7381;flex:none}
.mpt-tg.mpt-tb{color:#ff8f87} .mpt-tg.mpt-tb::before{background:#e5534b}
.mpt-tg.mpt-tm::before{display:none} .mpt-tg[data-tt]{cursor:help}
.mpt-pg{font:500 13px var(--body);color:var(--faint);text-align:right}
.mpt-pd{padding:2px 6px 12px 130px;color:var(--mpt-soft);font-size:14.5px}
.mpt-pd p{margin:4px 0}
.mpt-pd ol{margin:4px 0;padding-left:20px}
.mpt-sm{margin:8px 0 0;font:500 13px var(--body);color:var(--faint)}
.mpt-two{display:grid;grid-template-columns:1.2fr 1fr;gap:34px}
.mpt-two .mpt-k{margin-bottom:4px}
.mpt-kr{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) 40px;gap:12px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--line);font:500 14px var(--body)}
.mpt-kr small{display:block;font:500 12.5px var(--body);color:var(--muted)}
.mpt-kr > b{text-align:right}
.mpt-ksh{margin-top:16px!important} .mpt-ks{color:var(--muted);cursor:help} .mpt-ks b{color:var(--mpt-soft);font-weight:600}
.mpt-kr2{display:grid;grid-template-columns:120px minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font:500 14px var(--body)}
.mpt-kr2 .mpt-nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpt-bar{height:6px;border-radius:3px;background:var(--raised);position:relative;overflow:hidden}
.mpt-bar i{position:absolute;left:0;top:0;bottom:0;background:#7d8698;border-radius:3px}
.mpt-dg{display:grid;grid-template-columns:120px minmax(0,1fr);gap:12px;padding:8px 0;border-bottom:1px solid var(--line)}
.mpt-dp{color:var(--muted);font:600 13.5px var(--body)}
.mpt-dr{display:grid;grid-template-columns:120px minmax(0,1fr) 120px;gap:12px;align-items:baseline;font:500 14px var(--body);padding:1px 0}
.mpt-dr .mpt-nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpt-pl{display:grid;grid-template-columns:34px 140px 110px minmax(80px,1fr) 130px minmax(0,1.5fr);gap:14px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font:500 14px var(--body)}
.mpt-si{width:32px;height:32px;border-radius:4px;overflow:hidden;background:var(--raised);box-shadow:0 0 0 1px #000}
.mpt-si img{width:100%;height:100%;display:block}
.mpt-pw{min-width:0}
.mpt-pw .mpt-nm{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpt-pw small,.mpt-pv small{display:block;font:500 12.5px var(--body);color:var(--muted)}
.mpt-pv b{font:700 17px var(--head)}
.mpt-vs{font:700 14px var(--body)}
.mpt-say{margin:0 0 18px;padding:0 0 0 18px;border-left:3px solid var(--gold);list-style:none}
.mpt-say li{padding:5px 0;color:var(--mpt-soft);font-size:15.5px}
.mpt-say b{color:var(--text)}
.mpt-fz{margin-left:84px;margin-right:56px}
.mpt-fzk{position:relative;height:18px;margin-bottom:14px} /* (room for the boss names close above your strip) */
.mpt-fzk span{position:absolute;transform:translateX(-50%);font:600 12px var(--body);color:var(--faint)}
.mpt-fzk .mpt-r100{color:var(--text);font-weight:700}
.mpt-s100{position:absolute;top:-5px;bottom:-5px;width:2px;margin-left:-1px;background:rgba(236,232,223,.5);pointer-events:none}
.mpt-sbm em.mpt-r1{top:-29px} .mpt-sf .mpt-sbm em.mpt-r1{top:auto;bottom:-29px} .mpt-sbm em.mpt-hd{display:none}
.mpt-row.mpt-row2u{margin-top:30px} .mpt-row.mpt-row2d{margin-bottom:32px} /* (32: it meets the key's 16 px margin, which it would otherwise swallow) */
.mpt-row{position:relative;display:flex;align-items:center;height:42px;margin-left:-84px;margin-right:-56px}
.mpt-rll{width:84px;flex:none;font:700 14px var(--head)}
.mpt-end{width:56px;flex:none;text-align:right;font:700 15px var(--head)}
.mpt-strip{position:relative;flex:1;height:24px;border-radius:4px;background:var(--mpt-lane)}
.mpt-strip0{flex:1;font:500 13px var(--body);color:var(--faint)}
.mpt-sp{position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;border-right:2px solid var(--bg);overflow:hidden}
.mpt-sy .mpt-sp{background:var(--mpt-you)} .mpt-sf .mpt-sp{background:#7d8698}
.mpt-sp b{font:700 12px var(--head);color:#0f1117}
.mpt-sbm{position:absolute;top:-6px;bottom:-6px;width:0;border-left:3px solid var(--gold)}
.mpt-sbm em{position:absolute;top:-16px;left:-2px;font:700 11px var(--head);font-style:normal;color:var(--gold);white-space:nowrap}
.mpt-sf .mpt-sbm em{top:auto;bottom:-16px}
.mpt-strip u{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(135deg,rgba(229,83,75,.85) 0 4px,rgba(229,83,75,.45) 4px 8px);text-decoration:none;border-radius:0 4px 4px 0}
.mpt-fz .mpt-key{margin:16px 0 0}
.mpt-kbar{width:3px!important} .mpt-kover{background:repeating-linear-gradient(135deg,rgba(229,83,75,.85) 0 3px,rgba(229,83,75,.45) 3px 6px)}
.mpt-kdot{border-radius:50%!important} .mpt-kwp{box-shadow:0 0 0 2px var(--bad)}
.mpt-h3{margin:26px 0 10px;font:700 17px var(--head);color:var(--mpt-soft)}
.mpt-maps{display:flex;align-items:center;gap:8px}
.mpt-arr{flex:none;font:700 22px var(--head);color:var(--faint)}
.mpt-fl{margin:0;flex:1;min-width:0;max-width:400px} /* (small maps, never one big map: a one-floor dungeon's map is as big as one of three) */
.mpt-mp{position:relative;border:1px solid var(--line);border-radius:4px;overflow:hidden;background:#14171e;aspect-ratio:1024/683}
.mpt-mp img{display:block;width:100%;height:100%;object-fit:fill;filter:saturate(.8) brightness(.85)}
.mpt-rl{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.mpt-rl polyline{fill:none;vector-effect:non-scaling-stroke}
.mpt-rl .mpt-py{stroke:var(--mpt-you);stroke-width:2.2;stroke-dasharray:5 4}
.mpt-rl .mpt-pf{stroke:#c3c8d2;stroke-opacity:.55;stroke-width:1.5;stroke-dasharray:2 3}
.mpt-dot{position:absolute;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;background:var(--mpt-you);color:#fff;font:700 12px var(--head);display:grid;place-items:center;border:2px solid #0f1117;box-shadow:0 2px 6px rgba(0,0,0,.6);cursor:default}
.mpt-dot.mpt-bo{background:var(--gold);color:#0f1117}
.mpt-dot.mpt-wp{box-shadow:0 0 0 3px var(--bad),0 2px 6px rgba(0,0,0,.6)}
.mpt-fdot{position:absolute;transform:translate(-50%,-50%);width:9px;height:9px;border-radius:50%;background:#c3c8d2;border:1.5px solid #0f1117;opacity:.85}
.mpt-fl figcaption{margin-top:5px;font:500 13px var(--body);color:var(--muted)}
.mpt-fl figcaption b{color:var(--text)}
.mpt-sbh,.mpt-sbr{display:grid;grid-template-columns:28px minmax(0,1fr) 92px minmax(0,1fr) 92px;gap:10px;align-items:baseline;padding:7px 0}
.mpt-sbh{font:700 12px var(--head);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line)}
.mpt-sbr{border-bottom:1px solid var(--line);font:500 13.5px var(--body)}
.mpt-sn2{font:700 14px var(--head);color:var(--faint)}
.mpt-sw{color:var(--mpt-soft)}
.mpt-sw.mpt-bo{color:var(--gold);font-weight:700}
.mpt-sv{font:700 14px var(--head);text-align:right}
.mpt-sv small{font:500 12px var(--body);color:var(--faint);margin-left:4px}
.mpt-ex a{color:inherit}
.mpt-lst{position:absolute;top:-7px;bottom:-7px;width:3px;margin-left:-1.5px;background:#ffd166;border-radius:2px;box-shadow:0 0 0 1px var(--bg)} /* (Lust: the Design studio's yellow (round 4)) */
.mpt-kl{background:#ffd166;width:4px!important}
.mpt-tg.mpt-tl{color:#ffd166} .mpt-tg.mpt-tl::before{background:#ffd166}
.mpt-lu{color:#ffd166}
.mpt-shr{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:14px;padding:9px 0 9px 14px;border-left:3px solid var(--line2);font:500 13.5px var(--body);color:var(--muted)}
.mpt-shr b{color:var(--text);margin-right:6px}
.mpt-shr span{flex:1;min-width:220px}
.mpt-rl .mpt-pl2{stroke:#fff;stroke-opacity:.75;stroke-width:1.2;vector-effect:non-scaling-stroke}
.mpt-mp{cursor:zoom-in} .mpt-fl.mpt-big .mpt-mp{cursor:zoom-out}
.mpt-maps.mpt-zoom{flex-wrap:wrap} .mpt-maps.mpt-zoom .mpt-arr{display:none}
.mpt-fl.mpt-big{max-width:800px;flex:0 0 100%}
.mpt-rt1{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:28px;align-items:start}
.mpt-rt1 .mpt-h3{margin-top:0}
.mpt-rt1.mpt-zoom{grid-template-columns:minmax(0,1fr)}
@media (max-width:860px){
  .mpt-rt1{grid-template-columns:minmax(0,1fr)}
  .mpt-fold > summary{grid-template-columns:minmax(0,1fr) auto;row-gap:4px}
  .mpt-fold > summary h2{grid-column:1;grid-row:1} .mpt-fold > summary .mpt-chev{grid-column:2;grid-row:1} .mpt-fold > summary .mpt-hl{grid-column:1 / -1;grid-row:2}
  .mpt-fz{margin-left:64px;margin-right:46px} .mpt-row{margin-left:-64px;margin-right:-46px} .mpt-rll{width:64px} .mpt-end{width:46px}
  .mpt-sp b{font-size:10.5px}
  .mpt-maps{flex-direction:column;align-items:stretch}
  .mpt-fl,.mpt-fl.mpt-big{max-width:none;flex:none}
  .mpt-arr{display:none}
  .mpt-dot{width:20px;height:20px;font-size:11px}
  .mpt-sbh{display:none}
  .mpt-sbr{grid-template-columns:24px minmax(0,1fr) auto;row-gap:2px}
  .mpt-sbr > span:nth-child(4){grid-column:2}
  .mpt-sbr > span:nth-child(5){grid-column:3}
  .mpt-grp{margin-left:0}
  .mpt-fxr{grid-template-columns:28px minmax(0,1fr);row-gap:2px}
  .mpt-fxs{grid-column:2;text-align:left}
  .mpt-fxs b{display:inline;font-size:18px;margin-right:6px}
  .mpt-tiles{flex-wrap:wrap;row-gap:12px}
  .mpt-tile{flex:1 1 45%;border-left:0;padding:0}
  .mpt-tile span{white-space:normal}
  .mpt-tl{margin-left:64px} .mpt-ln{margin-left:-64px} .mpt-ll{width:64px} .mpt-key{margin-left:0}
  .mpt-mk span{font-size:11px}
  .mpt-gp{height:auto;display:flex;flex-direction:column;gap:2px;margin-left:-64px}
  .mpt-gp span,.mpt-gp span:last-child{position:static;transform:none;text-align:left}
  .mpt-gp b{display:inline;margin-right:6px}
  .mpt-wyh{display:none}
  .mpt-wyr{grid-template-columns:repeat(3,minmax(0,1fr));row-gap:8px}
  .mpt-wyr .mpt-sn{grid-column:1 / -1}
  .mpt-c::before{content:attr(data-l);display:block;font:700 11px var(--head);letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
  .mpt-plh{display:none}
  .mpt-pr summary,.mpt-sum{grid-template-columns:minmax(0,1fr) auto;row-gap:3px}
  .mpt-pr .mpt-pt{grid-column:2;grid-row:1;text-align:right}
  .mpt-pm,.mpt-pc{grid-column:1 / -1}
  .mpt-pf{grid-column:1 / -1} .mpt-pf:empty{display:none}
  .mpt-pg{display:none}
  .mpt-pd{padding-left:6px}
  .mpt-sgb{grid-template-columns:minmax(0,1fr);gap:6px}
  .mpt-fp{border-left:0;border-top:1px dashed var(--line);padding:8px 6px 4px}
  .mpt-two{grid-template-columns:1fr}
  .mpt-dg{grid-template-columns:1fr}
  .mpt-dr{grid-template-columns:auto 1fr;row-gap:1px}
  .mpt-dr > span:nth-child(3){grid-column:1 / -1}
  .mpt-pl{grid-template-columns:34px minmax(0,1fr) auto;row-gap:4px}
  .mpt-pl .mpt-bar{display:none}
  .mpt-pl > .mpt-vs{grid-column:2 / -1}
  .mpt-pl > span:last-child{grid-column:1 / -1}
}
`;
