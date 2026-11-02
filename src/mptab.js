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
const MP = { item: null, R: {}, busy: new Map(), fast: {}, fastR: {}, err: {} };
const mpKeys = () => (S.index && S.index.keys) || [];
const mpK = (it) => it.wcl.code + ':' + it.wcl.fight;
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
function mpKeyName(it) { return it.boss + ' +' + it.level + ' · ' + (it.keyMs ? mpMM(it.keyMs / 1000) : 'left early') + (it.keyMs ? (it.timed ? ' · Timed +' + it.up : ' · Over time') : ''); }

// ---------- reading a key: its events, written as WoW writes a key, then the app's own reader ----------
async function mpRead(it, onStep) {
  const k = mpK(it); if (MP.R[k]) return MP.R[k];
  if (MP.busy.has(k)) { const p0 = MP.busy.get(k); if (onStep) p0.on = onStep; return p0; }
  const p = (async () => {
    const est = Math.max(20000, it.duration * 210); /* (about 210 events a second in a key, from a +12 on Warcraft Logs) */
    const ev = await WCL.loadEvents(S.wclCreds, it, (n) => { if (p.on) p.on('Downloading the key from Warcraft Logs…', Math.min(0.9, 0.9 * n / est)); });
    if (p.on) p.on('Reading the key…', 0.92);
    const lines = await WCL.translateAsync(it, ev, () => new Promise((r) => setTimeout(r, 0)));
    await new Promise((r) => setTimeout(r, 30));
    const R = window.DBF_MPLUS ? window.DBF_MPLUS(lines.join('\n'), E) : null;
    if (!R || !R.pulls || !R.pulls.length) throw new Error('This key has no pulls Debrief could read.');
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
    const cand = (L.runs || []).filter((r) => !(r.code === it.wcl.code && r.fight === it.wcl.fight)).slice(0, 3);
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
  $('#main').innerHTML = pgTabBar(null) + '<section id="view" class="mpt-page"><div class="mpt">' + mpPickHtml(it) + '<div id="mptBody"></div></div></section>';
  { const nav = $('#main .pg-tabbar nav'); if (nav && !nav.querySelector('.mpt-tab')) nav.insertAdjacentHTML('beforeend', mpTabHtml()); const t = nav && nav.querySelector('.mpt-tab'); if (t) { t.classList.add('on'); t.setAttribute('aria-selected', 'true'); } }
  try { navNote(); } catch (e) { /* (no address) */ } window.scrollTo(0, 0);
  const k = mpK(it), body = () => (MP.item === it && S.page === 'mplus' ? $('#mptBody') : null);
  if (MP.R[k]) { mpDraw(); return; }
  const b0 = body(); if (b0) b0.innerHTML = '<div class="mpt-load">' + loadCard('Opening your key', 'Downloading the key from Warcraft Logs…', 0, 'mptLd') + '</div>';
  delete MP.err[k];
  mpRead(it, (line, frac) => { const b = body(); if (b && typeof loadSet === 'function') loadSet(b, line, frac); }).then(() => { if (body()) mpDraw(); })
    .catch((err) => { MP.err[k] = err.message; const b = body(); if (b) b.innerHTML = '<div class="mpt-err"><b>Couldn\'t read this key.</b> ' + esc(err.message) + '</div>'; });
}
function mpPickHtml(it) { const keys = mpKeys(); if (keys.length < 2) return '';
  return '<div class="mpt-pick"><label for="mptPick">' + keys.length + ' keys in this report</label><select id="mptPick">' + keys.map((x, i) => '<option value="' + i + '"' + (x === it ? ' selected' : '') + '>' + esc(mpKeyName(x)) + '</option>').join('') + '</select></div>'; }
function mpDraw() {
  const it = MP.item, R = it && MP.R[mpK(it)], b = $('#mptBody'); if (!R || !b || S.page !== 'mplus') return;
  const fx = MP.fastOf && MP.fastOf.k === mpK(it) ? MP.fastOf : null;
  b.innerHTML = mpHtml(it, R, fx);
  try { refreshIcons(); } catch (e) { /* (icons load later) */ }
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
    out.push({ name: fromName + ' → ' + b.boss, boss: b.boss, n: ps.length, fight, d, pen: d * C.pen, stand: Math.max(0, wall - fight), t: wall + d * C.pen, first: ps[0].n, last: b.n, at: C.tv(b.e) }); from = b.e; fromName = b.boss; fi = bi + 1; });
  return out; }
// (a wipe: the whole group dead within 45 seconds; its deaths, from the first one, and which death started it)
function mpWipe(p, n) { const dd = p.deaths.slice().sort((a, b) => a.t - b.t);
  for (let i = 0; i < dd.length; i++) { const w = dd.filter((d, j) => j >= i && d.t <= dd[i].t + 45); if (new Set(w.map((d) => d.who)).size >= n) return { first: dd[i], list: w }; }
  return null; }
// (what gets you the next level: each fix's seconds on the timer, biggest first. A wipe: every death in it. Deaths to the same spell. A
// must-kick cast that went off with a kick ready and killed someone. Casts that went off without killing anyone save casts, not seconds)
function mpFixes(R, C) {
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
  // (then must-kick casts that went off without killing anyone: fewer casts, not seconds)
  const wiped = new Set(P.filter((p) => mpWipe(p, n)).map((p) => p.n));
  const bySp = new Map(); for (const p of P) for (const t of p.through) { const k = thr.get(t.spell + '|' + t.mob); if (!k || k.done) continue; const o = bySp.get(t.spell) || { spell: t.spell, n: 0, pulls: new Map() }; o.n++; o.pulls.set(p.n, (o.pulls.get(p.n) || 0) + 1); bySp.set(t.spell, o); }
  for (const k of [...bySp.values()].filter((x) => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 2)) { const pl = [...k.pulls.keys()], [bp, bn] = [...k.pulls].sort((a, b) => b[1] - a[1])[0];
    out.push({ s: 0, ns: 'fewer casts', t: 'Kick ' + esc(k.spell), d: 'It went off ' + plural(k.n, 'time') + ' with a kick ready' + (pl.length === 1 && wiped.has(bp) ? ', all in the pull ' + bp + ' wipe' : pl.length > 1 && bn * 2 >= k.n && wiped.has(bp) ? ', ' + bn + ' of them in the pull ' + bp + ' wipe' : pl.length <= 3 ? ', in ' + (pl.length === 1 ? 'pull ' : 'pulls ') + pl.join(', ').replace(/, (\d+)$/, ' and $1') : ', across ' + pl.length + ' pulls') + '.' }); }
  // (last, the deaths left, one to each cause, as one line)
  if (rest.length) out.push({ s: rest.length * pen, t: rest.length === 1 ? 'One more death' : plural(rest.length, 'more death'), d: rest.sort((a, b) => a.t - b.t).map((d) => mpWho(R, d.who) + ' to <b class="mpt-ab">' + esc(d.to || 'unknown') + '</b> <span class="mpt-m">(pull ' + d.pull + ')</span>').join(', ') + '.' });
  return out.slice(0, 3); }

// ---------- the parts, top to bottom ----------
function mpHtml(it, R, fx) {
  const C = mpClock(R), ck = C && C.ck, run = R.run, F = fx && fx.R ? fx.R : null, FC = F ? mpClock(F) : null, waiting = !fx || fx.wait;
  const date = it.wallMs ? new Date(it.wallMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const pull = (n) => R.pulls.find((p) => p.n === n);
  // the banner
  const pill = run.left || !run.timeMs ? '<span class="mpt-pill">Left early</span>' : run.timed ? '<span class="mpt-pill mpt-g">Timed · +' + ((ck && ck.up) || it.up || 1) + '</span>' : '<span class="mpt-pill mpt-b">Over time</span>';
  const ban = '<div class="mpt-ban"><div class="mpt-kb">+' + run.level + '</div><div class="mpt-bt"><p class="mpt-k">Mythic+' + (date ? ' · ' + esc(date) : '') + '</p><h1>' + esc(run.dungeon || it.boss) + '</h1><div class="mpt-pills">' + pill +
    (ck ? '<span class="mpt-pill">' + mpMM(ck.time) + ' of ' + mpMM(ck.par) + '</span>' : run.timeMs ? '<span class="mpt-pill">' + mpMM(run.timeMs / 1000) + '</span>' : '') + '</div></div>' +
    '<div class="mpt-grp">' + R.people.slice().sort(mpByRole).map((p) => '<span class="mpt-gm" style="color:' + mpCC(p.cls) + '" title="' + esc(p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || '')) + '">' + (MP_ROLE[p.role] || '') + '<b>' + esc(p.name) + '</b></span>').join('') + '</div></div>';
  if (!C) return ban + '<p class="mpt-note">' + (run.left || !run.timeMs ? 'This key was left before the end, so there\'s no timer to judge. Everything that happened is below.' : 'Debrief doesn\'t know this dungeon\'s timer yet. Everything that happened is below.') + '</p>' + mpPulls(R, null) + mpCasts(R) + mpDeaths(R, null) + mpPlayers(R, fx, waiting);
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
  const fixes = '<section class="mpt-fx"><div class="mpt-fxh"><h2>' + head + '</h2><span>' + (tgt != null ? 'You needed <b>' + plural(need, 'second') + '</b>.' + (verdict ? ' ' + verdict : '') : 'You got +3. These would still save time.') + '</span></div>' +
    (FIX.length ? FIX.map((f, i) => '<div class="mpt-fxr"><span class="mpt-fxn">' + (i + 1) + '</span><div><b class="mpt-fxt">' + f.t + '</b><p>' + f.d + '</p></div><span class="mpt-fxs">' + (f.s ? '<b class="mpt-g">−' + mpMM(f.s) + '</b><small>' + (f.plus || 'on the timer') + '</small>' : '<b class="mpt-m">' + f.ns + '</b>') + '</span></div>').join('')
      : '<p class="mpt-none">No deaths, and no must-kick cast went off with a kick ready. The time is in the pulls and the walking between them' + (F ? ': see where you fell behind below.' : '.') + '</p>') + '</section>';
  // slim tiles
  const thN = R.pulls.reduce((a, p) => a + p.through.length, 0), fT = FC ? FC.ck.time : null;
  const tile = (k, v, sub, cls) => '<div class="mpt-tile"><p class="mpt-k">' + k + '</p><b class="' + (cls || '') + '">' + v + '</b><span>' + sub + '</span></div>';
  const tiles = '<div class="mpt-tiles">' + tile('Time', mpMM(T), 'of ' + mpMM(P)) +
    tile('Behind a fast run', F ? (T - fT >= 0 ? mpMM(T - fT) : mpMM(fT - T) + ' ahead') : waiting ? '…' : '—', F ? 'fast run ' + mpMM(fT) : waiting ? 'finding a fast run' : 'no fast run found', F && T - fT > 0 ? 'mpt-bad' : '') +
    tile('Lost to deaths', mpMM(ck.deathCost), plural(ck.deaths, 'death'), ck.deathCost ? 'mpt-bad' : '') +
    tile('Standing between pulls', mpMM(ck.between), F ? 'fast run ' + mpMM(FC.ck.between) : 'between ' + plural(R.pulls.length, 'pull')) +
    tile('Casts that went off', String(thN), 'with a kick ready') + '</div>';
  return ban + fixes + tiles + mpBehind(R, C, F, FC, fx, waiting) + mpPulls(R, C) + mpCasts(R) + mpDeaths(R, C) + mpPlayers(R, fx, waiting);
}
const mpSec = (t, sub, body) => '<section class="mpt-sec"><div class="mpt-sh"><h2>' + t + '</h2>' + (sub ? '<span>' + sub + '</span>' : '') + '</div>' + body + '</section>';
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
  const youLane = '<div class="mpt-lt">' + blocks.map((b) => '<i class="mpt-blk' + (b.p.boss ? ' mpt-bo' : '') + '" style="left:' + X(b.x) + ';width:' + W(b.w) + '" title="' + esc((b.p.boss || 'Pull ' + b.p.n) + ' · ' + mpMM(b.p.dur)) + '"></i>').join('') +
    dticks.map((t) => '<i class="mpt-dth" style="left:' + X(t.x) + ';width:' + W(C.pen) + '" title="' + esc(t.d.who + ' died to ' + t.d.to + ': +' + Math.round(C.pen) + ' s') + '"></i>').join('') +
    CP.map((c) => '<span class="mpt-cp" style="left:' + X(c.you) + '"><i></i></span>').join('') + '</div>';
  const fastLane = F ? '<div class="mpt-lt"><i class="mpt-fbar" style="width:' + W(FC.ck.time) + '"></i>' + CP.filter((c) => c.fast != null).map((c) => '<span class="mpt-cp mpt-f" style="left:' + X(c.fast) + '"><i></i></span>').join('') + '</div>'
    : '<div class="mpt-lt mpt-lt0"><span>' + (waiting ? 'Finding the fastest timed +' + R.run.level + ' on Warcraft Logs…' : 'No public fast run at this level yet.') + '</span></div>';
  const marks = '<div class="mpt-mk">' + [[0.6, '+3'], [0.8, '+2'], [1, '+1']].map(([f, l]) => '<span style="left:' + X(ck.par * f) + '">' + l + ' · ' + mpMM(ck.par * f) + '</span>').join('') + '</div>';
  const lines = [0.6, 0.8, 1].map((f) => '<i class="mpt-vl" style="left:' + X(ck.par * f) + '"></i>').join('');
  let lastX = -99, row = 0, rows = 1; const rowOf = CP.map((c) => { const x = 100 * c.you / W0; row = x - lastX < 13 ? 1 - row : 0; lastX = x; rows = Math.max(rows, row + 1); return row; }); /* (bosses close together: their labels take turns on two rows) */
  const gapRow = '<div class="mpt-gp" style="--mpt-gph:' + 40 * rows + 'px">' + CP.map((c, i) => '<span style="left:' + X(c.you) + ';--mpt-gpt:' + 40 * rowOf[i] + 'px"><b>' + esc(c.boss) + '</b>' + mpMM(c.you) + (c.fast != null ? ' · <b class="' + (i === CP.length - 1 && c.you > c.fast ? 'mpt-bad' : '') + '">' + (c.you >= c.fast ? mpMM(c.you - c.fast) + ' behind' : mpMM(c.fast - c.you) + ' ahead') + '</b>' : '') + '</span>').join('') + '</div>';
  const timeline = '<div class="mpt-tl"><div class="mpt-tlg">' + marks + '<div class="mpt-lanes">' + lines + '<div class="mpt-ln"><span class="mpt-ll">You</span>' + youLane + '</div><div class="mpt-ln"><span class="mpt-ll">Fast run</span>' + fastLane + '</div></div>' + gapRow + '</div>' +
    '<div class="mpt-key"><span><i class="mpt-k1"></i>Pull</span><span><i class="mpt-k2"></i>Boss</span>' + (C.pen ? '<span><i class="mpt-k3"></i>Death (+' + Math.round(C.pen) + ' s)</span>' : '') + (F ? '<span><i class="mpt-k4"></i>Fast run</span>' : '') + '<span><i class="mpt-kd"></i>Boss down</span></div></div>';
  // why, stretch by stretch: only the worst number in a row coloured
  const why = '<div class="mpt-wyh"><span>Stretch</span><span>Time</span><span>Pulls</span><span>Fighting</span><span>Deaths</span><span>Standing</span></div>' + ST.map((s) => { const f = fBy.get(s.boss);
    const diffs = f ? [['n', (s.n - f.n) * 60], ['fight', s.fight - f.fight], ['d', s.pen - f.pen], ['stand', s.stand - f.stand]] : [], worst = diffs.sort((a, b) => b[1] - a[1])[0];
    const c = (k, y, fv) => '<span class="mpt-c" data-l="' + { n: 'Pulls', fight: 'Fighting', d: 'Deaths', stand: 'Standing' }[k] + '"><b class="' + (worst && worst[0] === k && worst[1] > 20 ? 'mpt-bad' : '') + '">' + y + '</b>' + (f ? '<small>fast ' + fv + '</small>' : '') + '</span>';
    return '<div class="mpt-wyr"><span class="mpt-sn">' + esc(s.name) + '<small>' + (s.first === s.last ? 'pull ' + s.first : 'pulls ' + s.first + '–' + s.last) + '</small></span><span class="mpt-c" data-l="Time"><b>' + mpMM(s.t) + '</b>' + (f ? '<small>' + (s.t > f.t + 5 ? mpMM(s.t - f.t) + ' slower' : s.t < f.t - 5 ? mpMM(f.t - s.t) + ' faster' : 'on pace') + '</small>' : '') + '</span>' +
      c('n', s.n, f && f.n) + c('fight', mpMM(s.fight), f && mpMM(f.fight)) + c('d', s.d ? s.d + ' · ' + mpMM(s.pen) : '0', f && f.d) + c('stand', mpMM(s.stand), f && mpMM(f.stand)) + '</div>'; }).join('');
  let sum = '';
  if (F) { const gaps = ST.map((s) => { const f = fBy.get(s.boss); return f ? { s, f, g: s.t - f.t } : null; }).filter(Boolean).sort((a, b) => b.g - a.g), top = gaps[0];
    if (top && top.g > 15) { const s = top.s, f = top.f, bits = [];
      if (s.n > f.n) bits.push(plural(s.n - f.n, 'pull') + ' more than the fast run'); if (s.fight - f.fight > 20) bits.push(mpMM(s.fight - f.fight) + ' longer fighting'); if (s.d) bits.push(plural(s.d, 'death') + ' (' + mpMM(s.pen) + ')'); if (s.stand - f.stand > 20) bits.push(mpMM(s.stand - f.stand) + ' more standing');
      sum = 'Most of the gap is ' + (s.name.startsWith('Start → ') ? 'from the start to <b>' + esc(s.boss) + '</b>' : 'between <b>' + esc(s.name).replace(' → ', '</b> and <b>') + '</b>') + ': ' + mpMM(top.g) + (bits.length ? ', with ' + bits.join(', ').replace(/, ([^,]*)$/, ' and $1') : '') + '. '; }
    const st = ck.between - FC.ck.between; sum += st <= 30 ? 'Your time standing between pulls is close to the fast run\'s.' : 'You stood ' + mpMM(st) + ' longer between pulls than the fast run.'; }
  else { const top = ST.slice().sort((a, b) => b.t - a.t)[0]; if (top) sum = 'Your longest stretch is ' + (top.name.startsWith('Start → ') ? 'from the start to <b>' + esc(top.boss) + '</b>' : 'from <b>' + esc(top.name).replace(' → ', '</b> to <b>') + '</b>') + ': ' + mpMM(top.t) + ' on the timer.'; }
  const pk = fx && fx.pick, at = pk && pk.at ? new Date(pk.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const src = F ? '<p class="mpt-ex">The fast run is the fastest timed +' + R.run.level + ' ' + esc(R.run.dungeon) + ' on Warcraft Logs this season with a public log' + (at ? ' (' + esc(at) + ')' : '') + ', read the same way as yours.</p>' : '';
  return mpSec('Where you fell behind', F ? 'your key and a fast run on the same timer' : 'your key on its timer', timeline + why + (sum ? '<p class="mpt-why">' + sum + '</p>' : '') + src);
}
// (pull by pull: what was pulled, how long, what happened, and the standing after; a pull with something in it opens)
function mpPulls(R, C) {
  const n = Math.max(1, (R.people || []).length), roleOf = (w) => ((R.people || []).find((p) => p.name === w) || {}).role || '';
  let opened = false;
  const rows = R.pulls.map((p, i) => {
    const mobs = p.mobs || [], cnt = mobs.reduce((a, m) => a + m[1], 0), next = R.pulls[i + 1], gap = next ? next.s - p.e : 0;
    const what = (p.boss ? '' : plural(cnt, 'enemy').replace('enemys', 'enemies') + ': ') + mobs.filter((m) => !p.boss || m[0] !== p.boss).slice(0, 3).map((m) => esc(m[0]) + (m[1] > 1 ? ' ×' + m[1] : '')).join(', ') + (mobs.length > 3 ? ' and ' + (mobs.length - 3) + ' more' : '');
    const dd = p.deaths.slice().sort((a, b) => a.t - b.t), wp = mpWipe(p, n), wipe = !!wp, tags = [];
    if (wipe) tags.push('<span class="mpt-tg mpt-tb">Wipe</span>'); else if (dd.length) tags.push('<span class="mpt-tg mpt-tb">' + plural(dd.length, 'death') + '</span>');
    if (p.boss && p.kill === false && !wipe) tags.push('<span class="mpt-tg mpt-tb">Not killed</span>');
    if (p.through.length) tags.push('<span class="mpt-tg">' + plural(p.through.length, 'cast') + ' went off</span>');
    for (const b of (p.ebuffs || []).filter((x) => x.on > 0).slice(0, 2)) tags.push('<span class="mpt-tg" title="' + esc(b.spell + ' went on ' + plural(b.on, 'enemy').replace('enemys', 'enemies') + ' (from your log)') + '">' + esc(b.spell) + ' ×' + b.on + '</span>');
    const lead = wp ? wp.first : null, tk = lead && roleOf(lead.who) === 'tank';
    const th = new Map(); for (const t of p.through) th.set(t.spell, (th.get(t.spell) || 0) + 1);
    const body = (dd.length ? '<p><b>' + (wipe ? 'The wipe, in order:' : 'Deaths, in order:') + '</b></p><ol>' + dd.map((d, j) => '<li><span class="mpt-m">' + mpMM(d.t - p.s) + ' in</span> ' + mpWho(R, d.who) + (d === lead && tk ? ' <span class="mpt-tg mpt-tb">tank, first</span>' : '') + ' died to <b class="mpt-ab">' + esc(d.to) + '</b>' + (d.from ? ' <span class="mpt-m">(' + esc(d.from) + ')</span>' : '') + (d.defs ? ' · ' + plural(d.defs, 'defensive') + ' used' : ' · <b class="mpt-bad">no defensive</b>') + '</li>').join('') + '</ol>' : '') +
      (th.size ? '<p>' + [...th].map(([s, k]) => '<b class="mpt-ab">' + esc(s) + '</b> went off ' + (k === 1 ? 'once' : k + ' times')).join(', ') + ' with a kick ready.</p>' : '');
    const open = !opened && wipe; if (open) opened = true;
    const head = '<span class="mpt-pn">' + (p.boss ? esc(p.boss) : 'Pull ' + p.n) + '</span><span class="mpt-pm">' + what + '</span><span class="mpt-pt">' + mpMM(p.dur) + '</span><span class="mpt-pc">' + (tags.join('') || '<span class="mpt-m">clean</span>') + '</span><span class="mpt-pg">' + (gap > 0.5 ? '+' + Math.round(gap) + ' s' : '') + '</span>';
    return body ? '<details class="mpt-pr' + (p.boss ? ' mpt-boss' : '') + '"' + (open ? ' open' : '') + '><summary>' + head + '</summary><div class="mpt-pd">' + body + '</div></details>' : '<div class="mpt-pr mpt-pr0' + (p.boss ? ' mpt-boss' : '') + '"><div class="mpt-sum">' + head + '</div></div>';
  }).join('');
  return mpSec('Pull by pull', plural(R.pulls.length, 'pull') + ' · click one for what happened', '<div class="mpt-plh"><span>Pull</span><span>What you pulled</span><span>Time</span><span>What happened</span><span title="Standing before the next pull">Then</span></div>' + rows);
}
// (casts and kicks: what went off with a kick ready, by spell and pull, and who stopped casts)
function mpCasts(R) {
  const thru = new Map(); for (const p of R.pulls) for (const t of p.through) { const k = t.spell + '|' + t.mob, o = thru.get(k) || { spell: t.spell, mob: t.mob, n: 0, pulls: new Map() }; o.n++; o.pulls.set(p.n, (o.pulls.get(p.n) || 0) + 1); thru.set(k, o); }
  const TH = [...thru.values()].sort((a, b) => b.n - a.n), thN = TH.reduce((a, t) => a + t.n, 0);
  const who = R.people.filter((p) => p.kicks + p.stops > 0).sort((a, b) => b.kicks + b.stops - a.kicks - a.stops), mx = Math.max(1, ...who.map((p) => p.kicks + p.stops));
  const left = '<div><p class="mpt-k">Went off with a kick ready</p>' + (TH.length ? TH.map((t) => '<div class="mpt-kr"><span><b class="mpt-ab">' + esc(t.spell) + '</b><small>' + esc(t.mob) + '</small></span><span class="mpt-m">' + [...t.pulls].map(([n, c]) => 'pull ' + n + (c > 1 ? ' ×' + c : '')).join(', ') + '</span><b>' + t.n + '×</b></div>').join('') : '<p class="mpt-none">Nothing on the must-kick list went off while someone\'s kick was ready.</p>') + '</div>';
  const right = '<div><p class="mpt-k">Who stopped casts</p>' + (who.length ? who.map((p) => '<div class="mpt-kr2">' + mpWho(R, p.name) + '<span class="mpt-bar"><i style="width:' + (100 * (p.kicks + p.stops) / mx).toFixed(0) + '%"></i></span><span class="mpt-m">' + plural(p.kicks, 'kick') + ' · ' + plural(p.stops, 'stop') + '</span></div>').join('') : '<p class="mpt-none">No kicks or stops in this key.</p>') +
    '<p class="mpt-sm">A stop is a stun, knockback or other crowd control that cut a cast short. Healers have no kick in Midnight, except Restoration Shamans.</p></div>';
  return mpSec('Casts and kicks', thN ? plural(thN, 'cast') + ' went off with a kick ready' : 'nothing on the must-kick list got through', '<div class="mpt-two">' + left + right + '</div>');
}
// (deaths, grouped by pull)
function mpDeaths(R, C) {
  const n = Math.max(1, (R.people || []).length), all = R.pulls.filter((p) => p.deaths.length), tot = all.reduce((a, p) => a + p.deaths.length, 0);
  const body = all.map((p) => { const ds = p.deaths.slice().sort((a, b) => a.t - b.t), wipe = !!mpWipe(p, n);
    return '<div class="mpt-dg"><span class="mpt-dp">' + (p.boss ? esc(p.boss) : 'Pull ' + p.n) + (wipe ? ' · <b class="mpt-bad">wipe</b>' : p.boss && p.kill === false ? ' · not killed' : '') + '</span><div>' + ds.map((d) => '<div class="mpt-dr">' + mpWho(R, d.who) + '<span>died to <b class="mpt-ab">' + esc(d.to) + '</b>' + (d.from ? ' <span class="mpt-m">(' + esc(d.from) + ')</span>' : '') + '</span><span class="' + (d.defs ? 'mpt-m' : 'mpt-bad') + '">' + (d.defs ? plural(d.defs, 'defensive') : 'no defensive') + '</span></div>').join('') + '</div></div>'; }).join('');
  return mpSec('Deaths', tot ? plural(tot, 'death') + (C && C.ck.deathCost ? ' · ' + mpMM(C.ck.deathCost) + ' on the timer' : '') : 'nobody died', body || '<p class="mpt-none">Nobody died this key.</p>');
}
// (players: damage or healing a second with a bar, against the players of the same spec in the 10 fastest runs, and deaths, defensives
// and avoidable hits)
function mpPlayers(R, fx, waiting) {
  const ppl = R.people.slice().sort(mpByRole), mxD = Math.max(1, ...ppl.filter((p) => p.role !== 'healer').map((p) => p.dps)), runs = (fx && fx.list && fx.list.runs) || [];
  const vs = (p) => { const heal = p.role === 'healer', a = []; for (const r of runs) for (const m of r.ppl || []) if (m.a && mpNorm(m.s) === mpNorm(p.spec) && mpNorm(m.c) === mpNorm(p.cls) && (m.r === 'healer') === heal) a.push(m.a);
    if (!a.length) return null; const avg = a.reduce((s, x) => s + x, 0) / a.length, mine = heal ? p.hps : p.dps; return { pct: Math.round(100 * (mine - avg) / avg), n: a.length, avg }; };
  const rows = ppl.map((p) => { const heal = p.role === 'healer', v = vs(p), sid = mpSpecId(p.spec, p.cls), ic = typeof NDZ_SPECIC !== 'undefined' && NDZ_SPECIC[sid] ? NDZ_SPECIC[sid] : 'inv_misc_questionmark';
    const vtxt = v ? '<span class="mpt-vs ' + (v.pct < -10 ? 'mpt-bad' : v.pct > 0 ? 'mpt-g' : '') + '" title="' + esc('Against ' + plural(v.n, p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || '')) + ' in the 10 fastest runs: ' + Math.round(v.avg / 1000) + 'k a second on average') + '">' + (v.pct >= 0 ? v.pct + '% ahead' : -v.pct + '% behind') + '</span>'
      : '<span class="mpt-vs mpt-m">' + (waiting ? '…' : runs.length ? 'no ' + esc(p.spec) + ' in the fast runs' : '—') + '</span>';
    return '<div class="mpt-pl"><span class="mpt-si"><img src="' + whIcon(ic) + '" alt="" loading="lazy" onerror="this.remove()"></span><span class="mpt-pw">' + mpWho(R, p.name) + '<small>' + esc(p.spec) + '</small></span>' +
      '<span class="mpt-pv"><b>' + Math.round((heal ? p.hps : p.dps) / 1000) + 'k</b><small>' + (heal ? 'healing a second' : 'damage a second') + '</small></span><span class="mpt-bar"><i style="width:' + (heal ? 100 : 100 * p.dps / mxD).toFixed(0) + '%"></i></span>' + vtxt +
      '<span class="mpt-m">' + plural(p.deaths, 'death') + ' · ' + plural(p.defs, 'defensive') + ' · ' + plural(p.avoid, 'avoidable hit') + '</span></div>'; }).join('');
  return mpSec('Players', runs.length ? 'each against players of the same spec in the 10 fastest runs' : 'damage and healing a second over the whole key', rows);
}

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
.mpt-sec{margin-top:32px}
.mpt-sh{display:flex;align-items:baseline;gap:12px;margin-bottom:12px;flex-wrap:wrap}
.mpt-sh h2{margin:0;font:700 22px var(--head)}
.mpt-sh span{font:500 13.5px var(--body);color:var(--muted)}
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
.mpt-wyh,.mpt-wyr{display:grid;grid-template-columns:minmax(0,1.5fr) repeat(5,minmax(0,1fr));gap:12px;align-items:center;padding:9px 0}
.mpt-wyh{margin-top:18px;font:700 12px var(--head);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line)}
.mpt-wyr{border-bottom:1px solid var(--line)}
.mpt-sn{font:700 15px var(--head)}
.mpt-sn small{display:block;font:500 12.5px var(--body);color:var(--muted)}
.mpt-c b{display:block;font:700 16px var(--head);font-variant-numeric:tabular-nums}
.mpt-c small{font:500 12.5px var(--body);color:var(--faint)}
.mpt-why{margin:12px 0 0;color:var(--mpt-soft)}
.mpt-ex{margin:6px 0 0;font:500 13px var(--body);color:var(--faint)}
.mpt-plh,.mpt-pr summary,.mpt-sum{display:grid;grid-template-columns:110px minmax(0,1fr) 50px 250px 46px;gap:14px;align-items:baseline;padding:8px 6px}
.mpt-plh{font:700 12px var(--head);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line)}
.mpt-pr{border-bottom:1px solid var(--line)}
.mpt-pr summary{cursor:pointer;list-style:none}
.mpt-pr summary::-webkit-details-marker{display:none}
.mpt-pr summary:hover{background:rgba(255,255,255,.025)}
.mpt-pn{font:700 15px var(--head)}
.mpt-pr.mpt-boss .mpt-pn{color:var(--gold)}
.mpt-pm{font:500 13.5px var(--body);color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpt-pt{font:700 15px var(--head);font-variant-numeric:tabular-nums}
.mpt-pc{display:flex;gap:6px;flex-wrap:wrap}
.mpt-tg{font:700 11.5px var(--head);letter-spacing:.05em;text-transform:uppercase;padding:0 7px;border-radius:4px;border:1px solid var(--line2);color:var(--muted);white-space:nowrap}
.mpt-tg.mpt-tb{color:var(--mpt-badT);border-color:rgba(255,143,135,.45)}
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
@media (max-width:860px){
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
  .mpt-pg{display:none}
  .mpt-pd{padding-left:6px}
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
