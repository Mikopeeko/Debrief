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
// (each fold remembered per viewer (the quick read): the sections, Stretch by stretch, the route fold and Show N more. In this browser only;
// without storage the page opens folded, as drawn)
const MP_FOLDK = 'mpt-folds';
const mpFoldGet = () => { try { return JSON.parse(localStorage.getItem(MP_FOLDK) || '{}') || {}; } catch (e) { return {}; } };
const mpFoldSet = (id, v) => { try { const m = mpFoldGet(); m[id] = v; localStorage.setItem(MP_FOLDK, JSON.stringify(m)); } catch (e) { /* (not kept) */ } };
function mpFoldRestore() { const m = mpFoldGet();
  for (const [id, v] of Object.entries(m)) { const d = document.getElementById(id); if (!d) continue; if (d.tagName === 'DETAILS') d.open = !!v; else if (id === 'mptMoreRows') mpMoreSet(!!v); } }
const mpMoreSet = (v) => { const box = document.getElementById('mptMoreRows'), b = document.querySelector('[data-mptmore]'); if (!box || !b) return; box.hidden = !v; b.textContent = v ? 'Show fewer' : 'Show ' + b.dataset.mptmore + ' more'; };
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-mptmore]'); if (!b) return; const box = document.getElementById('mptMoreRows'); if (!box) return; const v = box.hidden; mpMoreSet(v); mpFoldSet('mptMoreRows', v); });
document.addEventListener('toggle', (e) => { const d = e.target; if (!d || !d.closest || !d.closest('.mpt')) return; if (d.id && /^mpt/.test(d.id)) mpFoldSet(d.id, d.open); if (d.open && d.querySelector('.mpt-strip')) try { mpLabelFit(); } catch (x) { /* (labels as drawn) */ } }, true);
function mpDraw() {
  const it = MP.item, R = it && MP.R[mpK(it)], b = $('#mptBody'); if (!R || !b || S.page !== 'mplus') return;
  const fx = MP.fastOf && MP.fastOf.k === mpK(it) ? MP.fastOf : null;
  const was = [...b.querySelectorAll('details[id][open]')].map((d) => d.id); /* (a section you opened stays open when the fast run arrives) */
  b.innerHTML = mpHtml(it, R, fx);
  mpFoldRestore(); for (const id of was) { const d = document.getElementById(id); if (d) d.open = true; }
  try { refreshIcons(); } catch (e) { /* (icons load later) */ }
  try { mpLabelFit(); } catch (e) { /* (labels stay as drawn) */ }
  mpJbTop();
  if (!fx) { const mine = it; MP.fastOf = { k: mpK(it), wait: true };
    mpFastRun(it).then((F) => { if (MP.item !== mine) return; MP.fastOf = { k: mpK(mine), ...F }; mpDraw(); }).catch(() => { if (MP.item !== mine) return; MP.fastOf = { k: mpK(mine), R: null, list: null }; mpDraw(); }); }
  mpPrevRate(it, R);
}
// (the rating before this key, for "+15.2 rating" (Nov 2, Main's check and the studio's audit): a night shared before keys kept their end
// rating has it only inside the key before's own lines, so that key is read in the background, once, and the banner redrawn. A night's first
// key has nothing before it, so it keeps "471 points". Keys from a report have no rating in their lines at all)
function mpPrevRate(it, R) {
  if (!it || it.wcl || !R.rateAfter) return;
  const keys = mpKeys(), i = keys.indexOf(it); if (i < 1) return;
  for (let j = i - 1; j >= 0 && j >= i - 2; j--) { const k = keys[j], r = MP.R[mpK(k)];
    if (k.rateAfter || (r && r.rateAfter)) return; /* (already known) */
    if (r) continue; /* (read, but left early: no rating there; try the one before) */
    if (k.wcl || MP.busy.has(mpK(k))) return;
    mpRead(k).then(() => { if (MP.item === it && S.page === 'mplus') mpDraw(); }).catch(() => { /* (the banner keeps its points) */ });
    return; }
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
// (chains (Nov 2, the Design studio's audit of the pull split): packs pulled with under 5 s between them, the fight going on, count as one pull
// for what a player judges by the pull: big cooldowns, Lust, the waits and how many pulls you took. Each pack keeps its own row. A boss is its
// own chain. Returns each pull's chain number; kept on the key)
function mpChains(RR) { if (RR._ch) return RR._ch; const P = RR.pulls, id = []; let c = -1;
  P.forEach((p, i) => { const q = P[i - 1]; id.push(i && !p.boss && !q.boss && p.s - q.e < 5 ? c : ++c); });
  return (RR._ch = id); }
const mpChainOf = (RR, i) => { const ch = mpChains(RR); return RR.pulls.map((p, j) => j).filter((j) => ch[j] === ch[i]); };
const mpChainN = (RR, ps) => { const ch = mpChains(RR); return new Set(ps.map((p) => ch[RR.pulls.indexOf(p)])).size; };
// ("17 packs in 11 pulls", or "12 pulls" when every pack was its own pull; short: "15 in 9" for the fast run after yours)
const mpPacks = (RR, short) => { const n = RR.pulls.length, c = mpChainN(RR, RR.pulls); return c === n ? plural(n, 'pull') : short ? n + ' packs in ' + c : n + ' packs in ' + c + ' pulls'; };
// (stretches: from the start (or a boss) to the next boss: the pulls in it, the time fighting, the deaths and the time between pulls)
function mpStretches(R, C) { const P = R.pulls, out = []; let from = C.T0, fromName = 'Start', fi = 0;
  P.forEach((b, bi) => { if (!b.boss || b.kill === false) return; /* (a boss you wiped on, or reset, is part of the stretch to its kill) */ const ps = P.slice(fi, bi + 1), d = ps.reduce((a, p) => a + p.deaths.length, 0), fight = ps.reduce((a, p) => a + p.dur, 0), wall = b.e - from;
    const tr = ps.filter((p) => !p.boss); /* (trash and the boss apart (the Design studio's hard-key pass): at +19 the boss fights are a big share of the key) */
    out.push({ name: fromName + ' → ' + b.boss, boss: b.boss, n: mpChainN(R, ps), nt: mpChainN(R, tr), packs: tr.length, /* (pulls counted by chain, packs as they are) */ fight, trash: tr.reduce((a, p) => a + p.dur, 0), bossT: fight - tr.reduce((a, p) => a + p.dur, 0), tries: ps.length - tr.length, d, pen: d * C.pen, stand: Math.max(0, wall - fight), t: wall + d * C.pen, first: ps[0].n, last: b.n, at: C.tv(b.e) }); from = b.e; fromName = b.boss; fi = bi + 1; });
  return out; }
// (a wipe: the whole group dead within 45 seconds; its deaths, from the first one, and which death started it)
function mpWipe(p, n) { const dd = p.deaths.slice().sort((a, b) => a.t - b.t);
  for (let i = 0; i < dd.length; i++) { const w = dd.filter((d, j) => j >= i && d.t <= dd[i].t + 45); if (new Set(w.map((d) => d.who)).size >= n) return { first: dd[i], list: w }; }
  return null; }
// (group DPS (Nov 2, the Design studio's spec, Flex: "Yes, build it"): the whole group's damage a second WHILE FIGHTING. pull.dmg is each
// player's damage a second over pull.dur (companion/mplus.js), so a pull's is their sum, and a stretch weights each pull by its length. Never the
// whole run's: a slower run always shows less. Against the fast run, extra fighting splits in two that add up exactly: lower damage (the time
// you'd save at its damage a second) and more to kill (the rest: more enemy health on your route; negative when you had less))
const mpGd = (p) => Object.values(p.dmg || {}).reduce((a, v) => a + v, 0);
const mpGrp = (ps) => { let D = 0, T = 0; for (const p of ps) { D += mpGd(p) * p.dur; T += p.dur; } return { D, T, r: T ? D / T : 0 }; };
const mpSplit = (y, f) => (y.T && f.T && f.r ? { low: y.T - y.D / f.r, more: y.D / f.r - f.T } : null);
const mpGF = (v) => (v >= 1e6 ? (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'm' : Math.round(v / 1e3) + 'k');
// (the polish pass's size rule for seconds behind: 60 s or more red, 20 to 59 amber, under 20 grey, ahead green)
const mpSz = (s) => (s >= 60 ? 'mpt-bad' : s >= 20 ? 'mpt-a' : s <= -1 ? 'mpt-g' : 'mpt-m');
// (and for "% behind": 5% or less, or ahead, green; 6 to 15% amber; more red)
const mpVs = (pct) => (pct >= -5 ? 'mpt-g' : pct >= -15 ? 'mpt-a' : 'mpt-bad');
const mpInSt = (RR, s) => RR.pulls.filter((p) => p.n >= s.first && p.n <= s.last);
// (a trash or boss row in "Where your time went": its two causes, the bigger first, then both groups' DPS there)
function mpGdTags(R, F, yp, fp, trash, ypAll, fpAll) {
  const y = mpGrp(yp), f = mpGrp(fp), sp = mpSplit(y, f); if (!sp) return '';
  const pc = (a, b) => Math.round(100 * Math.abs(a / b - 1));
  /* (the count line: the whole stretch, boss pull too, the same numbers as the route's own line) */
  const rt = R.route && R.route.ok ? R.route : null, frt = F.route && F.route.ok && rt && F.route.full === rt.full ? F.route : null;
  const share = (RR, rr, ps) => Math.round(100 * ps.reduce((a, p) => a + ((rr.pulls[RR.pulls.indexOf(p)] || {}).add || 0), 0) / rr.full);
  const cnt = trash && frt && ypAll ? ' In this stretch your route took ' + share(R, rt, ypAll) + '% of the enemy forces; the fast run\'s took ' + share(F, frt, fpAll) + '%.' : '';
  const more = sp.more >= 1 ? ['More to kill ' + mpMM(sp.more), sp.more, '<b>More to kill</b><br>Your group did ' + pc(y.D, f.D) + '% more damage in all here.' + cnt, '']
    : sp.more <= -1 ? ['Less to kill ' + mpMM(sp.more), -sp.more, '<b>Less to kill</b><br>Your group did ' + pc(y.D, f.D) + '% less damage in all here.' + cnt, 'mpt-m'] : null;
  const yN = mpChainN(R, yp), fN = mpChainN(F, fp), many = trash && yN > fN ? ' You pulled ' + yN + ' times; the fast run ' + (fN === 1 ? 'pulled it all at once' : 'pulled ' + fN + ' times') + ', so every AoE hit more enemies.' : '';
  const low = sp.low >= 1 ? ['Lower damage ' + mpMM(sp.low), sp.low, '<b>Lower damage</b><br>Your group did ' + pc(y.r, f.r) + '% less damage a second here.' + many, '']
    : sp.low <= -1 ? ['Higher damage ' + mpMM(sp.low), -sp.low, '<b>Higher damage</b><br>Your group did ' + pc(y.r, f.r) + '% more damage a second here.', 'mpt-m'] : null;
  const parts = [more, low].filter(Boolean).sort((a, b) => b[1] - a[1]);
  return '<p class="mpt-gt">' + parts.map(([t, , tip, c]) => '<span class="mpt-gtc' + (c ? ' ' + c : '') + '" tabindex="0"' + mpT1(tip) + '>' + t + '</span>').concat('Group DPS ' + mpGF(y.r) + ' · fast run ' + mpGF(f.r)).join(' · ') + '</p>';
}
// ("Next time" (Nov 2, the Design studio's next-time-and-waits.md, Flex: "and yes thats fine"): a green label and one to three plain sentences
// under a row, only facts from the two logs, yours and the typical fast run's. No line on deaths)
const mpNT = (s) => (s ? '<p class="mpt-nt"><b>Next time</b> ' + s + '</p>' : '');
const mpAnd = (a) => a.join(', ').replace(/, ([^,]*)$/, ' and $1');
const mpCnt = (RR, p) => { const sum = RR.summoned || new Set(); return (p.mobs || []).filter((m) => !sum.has(m[0])).reduce((a, m) => a + m[1], 0); };
const mpWhere = (s) => (s.name.startsWith('Start → ') ? 'before ' + esc(s.boss) : 'between ' + esc(s.name.split(' → ')[0]) + ' and ' + esc(s.boss));
// (a trash stretch: lead with the bigger cause (the studio's audit). More to kill: where the fast run got its count instead. Fewer, bigger
// pulls only when the fast run took at least 2 fewer pulls there (by chain), quoting its biggest pack)
function mpNextTrash(R, F, s, f, ST, fBy) {
  const yp = mpInSt(R, s).filter((p) => !p.boss), fp = mpInSt(F, f).filter((p) => !p.boss); if (!fp.length || !yp.length) return '';
  const sp = mpSplit(mpGrp(yp), mpGrp(fp)); if (!sp) return '';
  const yN = mpChainN(R, yp), fN = mpChainN(F, fp), fewer = yN - fN >= 2, out = [];
  const chSize = (RR, ps) => { const ch = mpChains(RR), m = new Map(); for (const p of ps) { const c = ch[RR.pulls.indexOf(p)]; m.set(c, (m.get(c) || 0) + mpCnt(RR, p)); } return [...m.values()]; };
  const yc = chSize(R, yp), fBig = Math.max(...fp.map((p) => mpCnt(F, p)));
  const pullLine = 'Pull it in fewer, bigger pulls. The fast run took it in ' + plural(fN, 'pull') + ', its biggest pack ' + fBig + ' enemies; you took ' + yN + (yc.length > 1 ? ' pulls of ' + Math.min(...yc) + ' to ' + Math.max(...yc) : '') + '.';
  if (sp.low > sp.more) { if (fewer) out.push(pullLine + ' Every AoE hits more enemies in a bigger pull.'); else { const g = mpGapLine(R, F, yp, fp); if (g) out.push(g); } }
  else { const rt = R.route && R.route.ok ? R.route : null, frt = F.route && F.route.ok && rt && F.route.full === rt.full ? F.route : null;
    if (frt) { const share = (RR, rr, ps) => 100 * ps.reduce((a, p) => a + ((rr.pulls[RR.pulls.indexOf(p)] || {}).add || 0), 0) / rr.full; let best = null;
      for (const s2 of ST) { const f2 = s2 !== s && fBy.get(s2.boss); if (!f2) continue; const ys = share(R, rt, mpInSt(R, s2)), fs = share(F, frt, mpInSt(F, f2)); if (fs - ys >= 5 && (!best || fs - ys > best.d)) best = { s2, ys, fs, d: fs - ys }; }
      if (best) out.push('Take more of the count before ' + esc(best.s2.boss) + '. The fast run got ' + Math.round(best.fs) + '% ' + mpWhere(best.s2) + ', you got ' + Math.round(best.ys) + '%, so it needed less here.'); }
    if (fewer) out.push(pullLine); }
  const lu = (RR, ps) => (RR.lust || []).some((l) => ps.includes(RR.pulls[l.pull])); /* (Lust only when the fast run used it here and you didn't) */
  if (lu(F, fp) && !lu(R, yp)) out.push('The fast run used Lust here; you didn\'t.');
  return mpNT(out.join(' '));
}
// (a boss where lower damage is the bigger part: the one or two biggest gaps against the fast run's same spec, or tank against tank and healer
// against healer. Never against a player's own key average: a boss is always lower than AoE trash. Trash uses the same line when the pulls
// were already as big as the fast run's)
function mpNextBoss(R, F, yp, fp) {
  const sp = mpSplit(mpGrp(yp), mpGrp(fp)); if (!sp || sp.low <= sp.more || sp.low < 1) return '';
  return mpNT(mpGapLine(R, F, yp, fp));
}
function mpGapLine(R, F, yp, fp) {
  const rate = (ps, nm) => { let D = 0, T = 0; for (const p of ps) { D += ((p.dmg || {})[nm] || 0) * p.dur; T += p.dur; } return T ? D / T : 0; }, gaps = [];
  for (const p of R.people || []) { let m = (F.people || []).find((q) => q.spec === p.spec && q.cls === p.cls), lab = m ? 'the fast run\'s ' + esc(p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || '')) : '';
    if (!m && p.role !== 'dps') { m = (F.people || []).find((q) => q.role === p.role); lab = 'the fast run\'s ' + p.role; }
    if (!m) continue; const mine = rate(yp, p.name), theirs = rate(fp, m.name); if (theirs - mine > 0) gaps.push({ p, mine, theirs, lab, g: theirs - mine }); }
  const top = gaps.sort((a, b) => b.g - a.g).slice(0, 2); if (!top.length) return '';
  return 'The biggest damage gap' + (top.length > 1 ? 's were ' : ' was ') + mpAnd(top.map((x) => mpWho(R, x.p.name))) + '. ' + top.map((x) => mpWho(R, x.p.name) + ' did ' + mpGF(x.mine) + ' here; ' + x.lab + ' did ' + mpGF(x.theirs) + '.').join(' ');
}
// (a kick row: the most of that caster in one pull, and whose kick was ready when it went off)
function mpNextKick(R, sp) {
  const L = []; for (const p of R.pulls) for (const t of p.through || []) if (t.spell === sp) L.push({ p, t }); if (!L.length) return '';
  const mob = L[0].t.mob, out = []; let most = 0, at = [];
  for (const p of new Set(L.map((x) => x.p))) { const c = ((p.mobs || []).find((m) => m[0] === mob) || [0, 0])[1]; if (c > most) { most = c; at = [p]; } else if (c && c === most) at.push(p); }
  if (most >= 2) out.push('Put one kicker on each ' + esc(mob) + ': ' + (at.length === 1 ? 'pull ' : 'pulls ') + mpAnd(at.map((p) => String(p.n))) + ' had ' + most + '.');
  const cnt = new Map(); for (const x of L) for (const n of x.t.ready || []) cnt.set(n, (cnt.get(n) || 0) + 1);
  const tw = (k) => (k === 1 ? 'once' : k === 2 ? 'twice' : k + ' times'), arr = [...cnt].sort((a, b) => b[1] - a[1]);
  /* (names with the same count together, most first: "Ayáme had a kick ready 5 times, Hansso and Éobrocas 4 times and Horoba 3 times") */
  const grp = []; for (const [n, k] of arr) { const g = grp.find((x) => x.k === k); if (g) g.n.push(n); else grp.push({ k, n: [n] }); }
  if (grp.length) out.push(grp.length === 1 ? mpAnd(grp[0].n.map((n) => mpWho(R, n))) + (grp[0].n.length > 1 ? ' each' : '') + ' had a kick ready ' + tw(grp[0].k) + ' when ' + esc(sp) + ' went off.'
    : mpAnd(grp.map((g, i) => mpAnd(g.n.map((n) => mpWho(R, n))) + (i ? ' ' : ' had a kick ready ') + tw(g.k))) + ' when ' + esc(sp) + ' went off.');
  return mpNT(out.join(' '));
}
// (your longest waits between pulls, inside Standing between pulls: up to 4, longest first, each with what explains it (a death in the pull
// before, Lust or big cooldowns going out at the pull), then the fast run's longest, then "Pull sooner" for 10 s or more with nothing to explain it)
function mpWaits(R, F) {
  const gaps = (RR) => RR.pulls.slice(1).map((p, i) => ({ p, prev: RR.pulls[i], g: p.s - RR.pulls[i].e })).filter((x) => x.g >= 5).sort((a, b) => b.g - a.g) /* (real gaps only: under 5 s the next pack was chained on) */;
  const G = gaps(R).slice(0, 4); if (!G.length) return { h: '', nt: '' };
  const nm = (p) => (p.boss ? esc(p.boss) : 'pull ' + p.n);
  const note = (x) => { const dd = [...new Set(x.prev.deaths.map((d) => d.who))], lu = (R.lust || []).filter((l) => l.t >= x.prev.e && l.t <= x.p.s + 5);
    const cds = Object.entries(R.cds || {}).flatMap(([n, l]) => l.filter((c) => c.t >= x.prev.e && c.t <= x.p.s + 5).map((c) => [n, c.spell])), bits = [];
    if (dd.length) bits.push(mpAnd(dd.map((w) => mpWho(R, w))) + ' had died in ' + nm(x.prev) + '.');
    if (lu.length || cds.length) bits.push(lu.length && cds.length ? 'Lust and ' + plural(cds.length, 'big cooldown') + ' went out at the pull.' : lu.length ? 'Lust went out at the pull.' : cds.length === 1 ? mpWho(R, cds[0][0]) + ' pressed ' + esc(cds[0][1]) + ' at the pull.' : plural(cds.length, 'big cooldown') + ' went out at the pull.');
    x.free = !bits.length; return bits.join(' ') || 'No death, and no big cooldown at the pull.'; };
  const FG = F ? gaps(F)[0] : null, mx = Math.max(...G.map((x) => x.g), FG ? FG.g : 0);
  const row = (lab, g, n, cls) => '<div class="mpt-wt' + (cls ? ' ' + cls : '') + '"><span>' + lab + '</span><div><i><u style="width:' + (100 * g / mx).toFixed(0) + '%"></u></i><small>' + n + '</small></div><b>' + mpMM(g) + '</b></div>';
  let h = '<div class="mpt-wts"><p class="mpt-k">Your longest waits</p>' + G.map((x) => row('Before ' + nm(x.p), x.g, note(x))).join('');
  if (FG) h += row('Fast run\'s longest', FG.g, 'Before its ' + nm(FG.p) + '.', 'mpt-wtf');
  const free = G.filter((x) => x.free && x.g >= 10).map((x) => x.p);
  return { h: h + '</div>', nt: !free.length ? '' : mpNT('Pull sooner before ' + (free.every((p) => !p.boss) ? (free.length === 1 ? 'pull ' : 'pulls ') + mpAnd(free.map((p) => String(p.n))) : mpAnd(free.map(nm))) + '. Nobody was dead and no big cooldown went out when you pulled.') }; /* (the list, and its Next time line apart: the quick read shows the line, the list on a click) */
}
// (what gets you the next level: each fix's seconds on the timer, biggest first. A wipe: every death in it. Deaths to the same spell. A
// must-kick cast that went off with a kick ready and killed someone. Casts that went off without killing anyone save casts, not seconds)
function mpFixes(R, C, all) {
  const P = R.pulls, n = Math.max(1, (R.people || []).length), pen = Math.round(C.pen) || 15, out = [], used = new Set();
  const roleOf = (w) => ((R.people || []).find((p) => p.name === w) || {}).role || '';
  for (const p of P) { const wp = mpWipe(p, n); if (!wp) continue;
    const dd = wp.list; dd.forEach((d) => used.add(d)); const f = wp.first, tank = roleOf(f.who) === 'tank';
    out.push({ c: 'death', s: dd.length * pen, t: 'Don\'t wipe on ' + (p.boss ? esc(p.boss) : 'pull ' + p.n), plus: 'plus the run back',
      d: (tank ? 'Your tank ' : '') + mpWho(R, f.who) + ' died first, to <b class="mpt-ab">' + esc(f.to) + '</b>' + (f.defs ? '.' : ', with <b class="mpt-bad">no defensive</b>.') + ' Everyone else was dead ' + Math.max(1, Math.round(dd[dd.length - 1].t - f.t)) + ' s later.' }); }
  // (a must-kick cast and the deaths it caused: the same spell from the same kind of enemy, in a pull where it went off with a kick ready)
  const thr = new Map(); for (const p of P) for (const t of p.through) { const k = t.spell + '|' + t.mob, o = thr.get(k) || { spell: t.spell, mob: t.mob, n: 0, pulls: new Set() }; o.n++; o.pulls.add(p.n); thr.set(k, o); }
  const by = new Map(), rest = []; for (const p of P) for (const d of p.deaths) { if (used.has(d) || !d.to || d.to === 'unknown') { if (!used.has(d)) rest.push({ ...d, pull: p.n }); continue; } const k = thr.get(d.to + '|' + d.from), key = k && k.pulls.has(p.n) ? 'k|' + d.to + '|' + d.from : 'd|' + d.to, o = by.get(key) || { to: d.to, k: key[0] === 'k' ? k : null, list: [] }; o.list.push({ ...d, pull: p.n }); by.set(key, o); }
  for (const o of by.values()) { const names = [...new Set(o.list.map((d) => d.who))], killed = names.map((w) => mpWho(R, w)).join(' and '), times = o.list.length;
    if (o.k) { o.k.done = true; const pl = [...o.k.pulls]; out.push({ c: 'kick', sp: o.to, mob: o.k.mob, s: times * pen, t: 'Kick ' + esc(o.to) + (pl.length === 1 ? ' in pull ' + pl[0] : ''), d: 'It went off ' + plural(o.k.n, 'time') + ' with a kick ready, and killed ' + killed + (times > names.length ? ' ' + (times === 2 ? 'twice' : times + ' times') : '') + '.' }); }
    else if (times >= 2) out.push({ c: 'death', s: times * pen, t: plural(times, 'death') + ' to ' + esc(o.to), d: 'Who died: ' + o.list.map((d) => mpWho(R, d.who) + ' <span class="mpt-m">(pull ' + d.pull + ')</span>').join(', ') + '. Each death put ' + pen + ' s on the timer.' });
    else rest.push(...o.list); }
  out.sort((a, b) => b.s - a.s);
  // (Lust that missed your biggest pulls (Nov 1): only when it's clear in the log: no Lust went on a boss or on either of your two biggest trash
  // pulls (what they counted toward the 100%, else the damage the group took). It saves time we can't measure, so no seconds)
  /* (by chain since the pull split (the studio's audit): packs pulled one after another, the fight going on, are one pull here) */
  { const L = R.lust || [], rt = R.route && R.route.ok ? R.route : null, ch = mpChains(R), byC = new Map();
    P.forEach((p, k) => { if (p.boss) return; const o = byC.get(ch[k]) || { ks: [], v: 0 }; o.ks.push(k); o.v += rt ? rt.pulls[k].add : (R.taken || [])[k] || 0; byC.set(ch[k], o); });
    const trash = [...byC.values()].sort((a, b) => b.v - a.v), top = trash.slice(0, 2), nm = (x) => (x.ks.length > 1 ? 'pulls ' + P[x.ks[0]].n + '–' + P[x.ks[x.ks.length - 1]].n : 'pull ' + P[x.ks[0]].n);
    const amt = (x) => (rt ? Math.round(100 * x.v / rt.full) + '% of the enemies' : Math.round(x.v / 1e6) + 'M damage taken');
    if (L.length && top.length && top[0].v > 0 && !L.some((l) => P[l.pull] && (P[l.pull].boss || top.some((x) => x.ks.includes(l.pull))))) {
      const on = L.map((l) => { const x = trash.find((y) => y.ks.includes(l.pull)); return x ? nm(x) + ' (' + amt(x) + ')' : 'pull ' + P[l.pull].n; });
      out.push({ c: 'lust', s: 0, ns: 'timing', t: 'Lust on your biggest pulls', d: 'Lust went on ' + on.join(' and ') + '. Your biggest pull was ' + nm(top[0]) + ' (' + amt(top[0]) + ').' }); } }
  // (then must-kick casts that went off without killing anyone: fewer casts, not seconds)
  const wiped = new Set(P.filter((p) => mpWipe(p, n)).map((p) => p.n));
  const bySp = new Map(); for (const p of P) for (const t of p.through) { const k = thr.get(t.spell + '|' + t.mob); if (!k || k.done) continue; const o = bySp.get(t.spell) || { spell: t.spell, n: 0, pulls: new Map() }; o.n++; o.pulls.set(p.n, (o.pulls.get(p.n) || 0) + 1); bySp.set(t.spell, o); }
  for (const k of [...bySp.values()].filter((x) => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 2)) { const pl = [...k.pulls.keys()], [bp, bn] = [...k.pulls].sort((a, b) => b[1] - a[1])[0];
    out.push({ c: 'kick', sp: k.spell, n: k.n, s: 0, ns: 'fewer casts', t: 'Kick ' + esc(k.spell), d: 'It went off ' + plural(k.n, 'time') + ' with a kick ready' + (pl.length === 1 && wiped.has(bp) ? ', all in the pull ' + bp + ' wipe' : pl.length > 1 && bn * 2 >= k.n && wiped.has(bp) ? ', ' + bn + ' of them in the pull ' + bp + ' wipe' : pl.length <= 3 ? ', in ' + (pl.length === 1 ? 'pull ' : 'pulls ') + pl.join(', ').replace(/, (\d+)$/, ' and $1') : ', across ' + pl.length + ' pulls') + '.' }); }
  // (last, the deaths left, one to each cause, as one line)
  const more = out.some((x) => x.s > 0); /* ("more" only after other deaths above it) */
  if (rest.length) out.push({ c: 'death', s: rest.length * pen, t: more ? (rest.length === 1 ? 'One more death' : plural(rest.length, 'more death')) : (rest.length === 1 ? 'One death' : plural(rest.length, 'death')), d: rest.sort((a, b) => a.t - b.t).map((d) => mpWho(R, d.who) + ' to <b class="mpt-ab">' + esc(d.to || 'unknown') + '</b> <span class="mpt-m">(pull ' + d.pull + ')</span>').join(', ') + '.' });
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
    (ck ? '<span class="mpt-pill">' + mpMM(ck.time) + ' of ' + mpMM(ck.par) + '</span>' : run.timeMs ? '<span class="mpt-pill">' + mpMM(run.timeMs / 1000) + '</span>' : '') +
    /* (the key's rating points, with how the points work in its hover (Nov 2, what Season 2 Mythic+ knows)) */
    (() => { const rp = mpRating(R, ck, it); if (!rp) return ''; const tt = ' tabindex="0"' + mpT1(rp.tip);
      return rp.gain != null ? (rp.gain ? '<span class="mpt-pill mpt-g mpt-rg"' + tt + '>+' + (Math.round(rp.gain * 10) / 10).toFixed(1) + ' rating</span>' : '<span class="mpt-pill mpt-rn"' + tt + '>No rating change</span>')
        : '<span class="mpt-pill mpt-rp"' + tt + '>' + (rp.est ? '~' : '') + Math.round(rp.pts) + ' points</span>'; })() + '</div>' +
    /* (its affixes, each with a plain hover) */
    ((run.affixes || []).some((a) => MP_AFFIX[a]) ? '<div class="mpt-afx">' + run.affixes.filter((a) => MP_AFFIX[a]).map((a) => '<span class="mpt-af" tabindex="0"' + mpT1('<b>' + esc(MP_AFFIX[a][0]) + '</b><br>' + esc(MP_AFFIX[a][1])) + '>' + esc(MP_AFFIX[a][0]) + '</span>').join('') + '</div>' : '') + '</div>' +
    '<div class="mpt-grp">' + R.people.slice().sort(mpByRole).map((p) => '<span class="mpt-gm" style="color:' + mpCC(p.cls) + '"' + mpT1(esc(p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || ''))) + '>' + (MP_ROLE[p.role] || '') + '<b>' + esc(p.name) + '</b></span>').join('') + '</div></div>';
  if (!C) return mpChap('mptC1', 'The key', '', ban + '<p class="mpt-note">' + (run.left || !run.timeMs ? 'This key was left before the end, so there\'s no timer to judge. Everything that happened is below.' : 'Debrief doesn\'t know this dungeon\'s timer yet. Everything that happened is below.') + '</p>') + mpJumpBar(R, false) +
    mpChap('mptC3', 'Route and pulls', '', mpRPFold(R, null, mpRouteHtml(R, null, false) + mpPulls(R, null, null, null))) + mpChap('mptC4', 'Your group', 'kicks, deaths and each player', mpCasts(R) + mpPlayers(R, fx, waiting)) + mpChap('mptC5', 'Know this dungeon', 'for your next key', mpKnowHtml(R, true));
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
      const yp = mpInSt(R, s), fp = mpInSt(F, f); /* (each row's group DPS tags: more to kill and lower damage) */
      if (s.trash - f.trash >= 15) L.push({ c: 'trash', s: s.trash - f.trash, t: where, d: 'You took ' + plural(s.nt, 'pull') + ' there, the fast run took ' + f.nt + '. Your trash took ' + mpMM(s.trash) + ', theirs took ' + mpMM(f.trash) + '.', g: mpGdTags(R, F, yp.filter((p) => !p.boss), fp.filter((p) => !p.boss), true, yp, fp), nt: mpNextTrash(R, F, s, f, ST, fBy) });
      if (s.bossT - f.bossT >= 15) L.push({ c: 'boss', s: s.bossT - f.bossT, t: esc(s.boss), d: 'Your fight took ' + mpMM(s.bossT) + (s.tries > 1 ? ' over ' + s.tries + ' pulls' : '') + ', theirs took ' + mpMM(f.bossT) + '.', g: mpGdTags(R, F, yp.filter((p) => p.boss), fp.filter((p) => p.boss), false), nt: mpNextBoss(R, F, yp.filter((p) => p.boss), fp.filter((p) => p.boss)) }); }
    if (ck.between - FC.ck.between >= 15) L.push({ c: 'stand', s: ck.between - FC.ck.between, t: 'Standing between pulls', d: 'You stood still for ' + mpMM(ck.between) + ' between pulls, the fast run for ' + mpMM(FC.ck.between) + '.', ...((w) => ({ g: w.h, nt: w.nt }))(mpWaits(R, F)) });
    for (const f of mpFixes(R, C, true)) L.push(f);
    return L.filter((x) => x.s >= 15 || !x.s).sort((a, b) => b.s - a.s).slice(0, 6); })();
  // (a thin bar under the lead: the gap split into longer fighting, standing between pulls and deaths, each with its hover, a key under it and
  // no words inside (they'd be cut off on a phone). The three add up to the gap: the fighting is what's left after the other two)
  // (the quick read (Nov 2, the Design studio's quick-read.md, Flex: "theres almost too much information… its a lot of alot"): a row shows its
  // title, one Next time line (a death row: who died, plainly) and its time; the explanation and the tags open on a click (▸ turns ▾). Three rows,
  // then "Show N more". Nothing is gone: it's one click away)
  const fxRow = (f, i, fix) => { const nt = f.nt || (f.c === 'kick' && f.sp ? mpNextKick(R, f.sp) : '') || (f.c === 'death' ? '<p class="mpt-nt mpt-ntd">' + f.d + '</p>' : '');
    const more = (f.c === 'death' ? '' : '<p>' + f.d + '</p>') + (f.g || ''), badge = '<span class="mpt-fxn mpt-c-' + (f.c || 'none') + '">' + (i + 1) + '</span>';
    const right = '<span class="mpt-fxs">' + (f.s ? (fix ? '<b class="mpt-g">−' + mpMM(f.s) + '</b>' : '<b class="' + mpSz(f.s) + '">' + mpMM(f.s) + '</b>') + '<small>' + (f.plus || 'on the timer') + '</small>' : f.n ? '<b class="mpt-ab">' + f.n + '</b><small>went off</small>' : '<b class="mpt-m">' + f.ns + '</b>') + '</span>';
    return more ? '<details class="mpt-fxd"><summary class="mpt-fxr">' + badge + '<div><b class="mpt-fxt">' + f.t + '</b>' + nt + '</div>' + right + '</summary><div class="mpt-fxm">' + more + '</div></details>'
      : '<div class="mpt-fxr">' + badge + '<div><b class="mpt-fxt mpt-fxt0">' + f.t + '</b>' + nt + '</div>' + right + '</div>'; };
  const fxRows = (L, fix) => L.slice(0, 3).map((f, i) => fxRow(f, i, fix)).join('') + (L.length > 3 ? '<div class="mpt-fxmore" id="mptMoreRows" hidden>' + L.slice(3).map((f, i) => fxRow(f, i + 3, fix)).join('') + '</div><button type="button" class="mpt-fxbtn" data-mptmore="' + (L.length - 3) + '">Show ' + (L.length - 3) + ' more</button>' : '');
  let gLine = '';
  const sbar = (() => { if (!went) return ''; const gap = T - fT0, dD = ck.deathCost - FC.ck.deathCost, dS = ck.between - FC.ck.between;
    /* (with group DPS, the longer fighting is two pieces: more to kill and lower damage, from the pulls themselves) */
    const yG = mpGrp(R.pulls), fG = mpGrp(F.pulls), spl = mpSplit(yG, fG), dp = spl ? Math.round(100 * (yG.r / fG.r - 1)) : 0, pc = (a, b) => Math.round(100 * Math.abs(a / b - 1));
    const fight = spl ? [['fm', 'More to kill', spl.more, 'Your group did ' + pc(yG.D, fG.D) + '% ' + (yG.D >= fG.D ? 'more' : 'less') + ' damage in all while fighting. You took ' + plural(R.pulls.length, 'pull') + ', the fast run took ' + F.pulls.length + '.', 'Less to kill'],
      ['fl', 'Lower damage', spl.low, 'Your group did ' + mpGF(yG.r) + ' damage a second while fighting, the fast run ' + mpGF(fG.r) + '.', 'Higher damage']]
      : [['f', 'Longer fighting', gap - dD - dS, 'You took ' + plural(R.pulls.length, 'pull') + ', the fast run took ' + F.pulls.length + '.', 'Shorter fighting']];
    const all = fight.concat([['s', 'Standing between pulls', dS, 'You stood still for ' + mpMM(ck.between) + ' between pulls, the fast run for ' + mpMM(FC.ck.between) + '.', 'Standing between pulls'],
      ['d', 'Deaths', dD, 'Your ' + plural(ck.deaths, 'death') + ' put ' + mpMM(ck.deathCost) + ' on the timer.' + (FC.ck.deathCost ? ' The fast run\'s put ' + mpMM(FC.ck.deathCost) + '.' : ''), 'Deaths']]);
    const parts = all.filter((x) => x[2] >= 1), less = all.filter((x) => x[2] <= -1); /* (one you did better than the fast run: in the key, green, so the numbers add up to the gap) */
    const sum = parts.reduce((a, x) => a + x[2], 0); if (!sum) return '';
    const line = !spl ? '' : (Math.abs(dp) <= 7 ? 'Your group\'s damage was close to the fast run\'s: ' + (dp ? Math.abs(dp) + '% ' + (dp < 0 ? 'less' : 'more') + ' a second' : 'the same a second') + ' while fighting.' : 'Your group did ' + Math.abs(dp) + '% ' + (dp < 0 ? 'less' : 'more') + ' damage a second than the fast run while fighting.') + ' ' +
      /* (the studio's audit: when lower damage is the cause and the route had less or about as much to kill, the cost first, then the route) */
      (spl.low > spl.more && spl.more < 15 ? 'That cost ' + mpMM(spl.low) + '. Your route was fine: you had ' + (spl.more <= -1 ? 'less' : 'about as much') + ' to kill ' + (spl.more <= -1 ? 'than' : 'as') + ' the fast run.'
        : spl.low <= 0 ? 'Your damage was higher, so your extra fighting was more to kill.' : spl.more >= spl.low ? 'Most of your extra fighting was more to kill.' : 'Most of your extra fighting was lower damage.');
    return '<div class="mpt-sbar">' + parts.map(([k, l, s, d]) => '<i class="mpt-sb-' + k + '" tabindex="0" style="width:' + (100 * s / sum).toFixed(1) + '%"' + mpT1('<b>' + l + ': ' + mpMM(s) + '</b><br>' + d) + '></i>').join('') + '</div>' +
      '<div class="mpt-sk">' + parts.map(([k, l, s]) => '<span><i class="mpt-sb-' + k + '"></i>' + l + ' <b>' + mpMM(s) + '</b></span>').join('') +
      less.map(([k, , s, d, nl]) => '<span tabindex="0"' + mpT1('<b>' + nl + ': ' + mpMM(s) + '</b><br>' + d) + '>' + nl + ' <b class="mpt-g">' + mpMM(s) + '</b></span>').join('') + '</div>' +
      ((gLine = line), ''); })(); /* (the quick read: the line moved into the box's ⓘ; the bar's hover and the Group DPS tile say it too) */
  const fixes = went ? '<section class="mpt-fx"><div class="mpt-fxh"><h2>Where your ' + mpMM(T - fT0) + ' went</h2>' + mpInfo('The ' + mpMM(T - fT0) + ' you were behind the fast run, split by cause. Hover a piece of the bar for more.' + (gLine ? '<br><br>' + gLine : '') + '<br><br>Click a row for the numbers behind it.') +
    '<span>A typical fast run took <b>' + mpMM(fT0) + '</b>. You needed to be <b>' + mpMM(need) + '</b> faster ' + (lv === 0 ? 'to time it' : 'for +' + (lv + 1)) + (ck.deathCost ? ', and your deaths only cost <b>' + mpMM(ck.deathCost) + '</b>.' : ', and you had no deaths.') + '</span></div>' + sbar +
    /* (the polish pass: each badge in its cause's colour, the seconds by size (60 s red, 20 s amber, less grey), a kick by how often it went off) */
    fxRows(went, false) + '</section>' :
    '<section class="mpt-fx"><div class="mpt-fxh"><h2>' + head + '</h2><span>' + (tgt != null ? 'You needed <b>' + plural(need, 'second') + '</b>.' + (verdict ? ' ' + verdict : '') : 'You got +3. These would still save time.') + '</span></div>' +
    (FIX.length ? fxRows(FIX, true)
      : '<p class="mpt-none">No deaths, and no must-kick cast went off with a kick ready. The time is in the pulls and the walking between them' + (F ? ': see where you fell behind below.' : '.') + '</p>') + '</section>';
  // slim tiles
  const thN = R.pulls.reduce((a, p) => a + p.through.length, 0), fT = FC ? FC.ck.time : null;
  const tile = (k, v, sub, cls, tip) => '<div class="mpt-tile"' + (tip ? ' tabindex="0"' + mpT1(tip) : '') + '><p class="mpt-k">' + k + '</p><b class="' + (cls || '') + '">' + v + '</b><span>' + sub + '</span></div>';
  /* (four tiles (the "easier on the eyes" round): deaths and standing are in the top box and the stretch rows, so Lust takes their place;
     group DPS joined them (Nov 2)) */
  const LU = R.lust || [], yG = mpGrp(R.pulls), fGr = F ? mpGrp(F.pulls) : null, gdp = fGr && fGr.r ? Math.round(100 * (yG.r / fGr.r - 1)) : null;
  const tiles = '<div class="mpt-tiles">' + tile('Time', mpMM(T), ck.up === 0 ? '<span class="mpt-bad">' + sp(T - P) + ' over</span>' : '<span class="' + (lim - T < 90 ? 'mpt-a' : 'mpt-g') + '">' + sp(lim - T) + ' to spare</span>') +
    tile('Behind a typical fast run', F ? (T - fT >= 0 ? mpMM(T - fT) : mpMM(fT - T) + ' ahead') : waiting ? '…' : '—', F ? 'it took ' + mpMM(fT) : waiting ? 'finding a fast run' : 'no fast run found', F && T - fT > 0 ? 'mpt-bad' : '') +
    (yG.r ? tile('Group DPS', mpGF(yG.r), gdp == null ? 'while fighting' : gdp ? Math.abs(gdp) + '% ' + (gdp < 0 ? 'less' : 'more') + ' than the fast run' : 'the same as the fast run', '',
      '<b>Group DPS</b><br>Your whole group\'s damage a second while fighting. Walking and standing don\'t count.' + (fGr ? ' The fast run: ' + mpGF(fGr.r) + '.' : '')) : '') +
    tile('Casts that went off', String(thN), 'with a kick ready', thN ? 'mpt-bad' : 'mpt-g') + /* (red above 0, green at 0: the polish pass) */
    tile('Lust', LU.length ? plural(LU.length, 'time') : 'None', LU.length ? esc([...new Set(LU.map((l) => mpPullName(R, l.pull)))].join(', ')) : 'no Lust this key', LU.length ? 'mpt-lu' : 'mpt-m') + '</div>';
  /* (the tiles moved up under the banner, so the result is read first (the chapters round; it changes the round-3 order Flex approved, and he
     saw it in the mock)) */
  const behind = F ? (T - fT > 5 ? 'bad' : T - fT < -5 ? 'good' : '') : '';
  /* (the quick read: chapter 2 is "Fix these first"; chapter 3 is one sentence with the route and the pulls a click away) */
  return mpChap('mptC1', 'The key', '', ban + tiles) + mpJumpBar(R, true) + mpChap('mptC2', 'Fix these first', F ? 'against a typical fast run' : '', fixes + mpBehind(R, C, F, FC, fx, waiting), behind) +
    mpChap('mptC3', 'Route and pulls', '', mpRPFold(R, F, mpRouteHtml(R, F, waiting) + mpPulls(R, C, F, FC))) + mpChap('mptC4', 'Your group', 'kicks, deaths and each player', mpCasts(R) + mpPlayers(R, fx, waiting)) + mpChap('mptC5', 'Know this dungeon', 'for your next key', mpKnowHtml(R, true));
}
// (five chapters (Nov 2, the Design studio's chapters.md, Flex: "the page is lacking depth. Maybe find a way to separate the information so its
// more readable in sections", then "does it have depth like my other pages do?"): each one the site's own panel, the finish Debriefing's panels
// have, opening with a small grey label and a sub-line; a 6 px square only when the chapter has a verdict (behind red, ahead green))
const mpChap = (id, k, sub, body, dot) => (body ? '<div class="mpt-chap" role="region" aria-label="' + k + '" id="' + id + '"><p class="mpt-chk' + (dot ? ' mpt-chk-' + dot : '') + '">' + k + (sub ? '<span>' + sub + '</span>' : '') + '</p>' + body + '</div>' : ''); /* (a div: the site's type scale resizes text in a section inside a section) */
// (the jump bar between chapter 1 and 2 (the Design studio's round 4, by chapter since Nov 2): it sticks under the site's tab bar while you scroll)
// (chapter 3 in the quick read: one sentence, how many packs and pulls and where you reached 100%, then the route and the pulls a click away)
function mpRPFold(R, F, inner) {
  const rt = R.route && R.route.ok ? R.route : null; let reach = '';
  if (rt) { let t = 0; for (let k = 0; k < rt.pulls.length; k++) { t += rt.pulls[k].add; if (t >= rt.full * 0.9995) { const nx = R.pulls.slice(k + 1).find((p) => p.boss), pv = R.pulls.slice(0, k).reverse().find((p) => p.boss); /* (by boss, not pull number: the Pulls list numbers packs) */
        reach = ' You reached 100% ' + (R.pulls[k].boss ? 'at ' + esc(R.pulls[k].boss) : nx ? 'before ' + esc(nx.boss) : pv ? 'after ' + esc(pv.boss) : 'in pack ' + R.pulls[k].n) + '.'; break; } } }
  const line = 'You took <b>' + mpPacks(R) + '</b>' + (F ? '; the fast run took <b>' + mpPacks(F, true) + '</b>.' : '.') + reach;
  return '<p class="mpt-rpl">' + line + '</p><details class="mpt-sub" id="mptRP"><summary>Show the route, maps and every pull</summary>' + inner + '</details>';
}
const mpJumpBar = (R, tl) => '<nav class="mpt-jb" aria-label="Jump to">' + [tl ? ['mptC2', 'Fix these first'] : null, ['mptC3', 'Route and pulls'], ['mptC4', 'Your group'], MP_KNOW[mpLc(R.run.dungeon)] ? ['mptC5', 'Dungeon'] : null].filter(Boolean).map(([id, l]) => '<button type="button" data-mptj="' + id + '">' + l + '</button>').join('') + '</nav>';
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-mptj]'); if (!b) return; e.preventDefault(); const s = document.getElementById(b.dataset.mptj); if (!s) return;
  if (s.tagName === 'DETAILS') s.open = true; /* (a folded section opens first) */
  else { const f = s.querySelectorAll(':scope > details.mpt-fold'); if (f.length === 1 && s.children.length === 2) f[0].open = true; } /* (a chapter that's one folded part, Know this dungeon, opens it) */
  s.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
// (what "a typical fast run" is, for the line under the timeline and the hovers: the middle of the 20 fastest, or of as many as there are)
const mpTypical = (R, fx) => { const n = (fx && fx.list && fx.list.n) || 0; return 'the middle of this season\'s ' + (n >= 20 || !n ? '20' : n) + ' fastest timed +' + R.run.level + ' ' + esc(R.run.dungeon) + ' runs' + (n && n < 20 ? ' (only ' + n + ' so far)' : ''); };
const mpPullName = (R, k) => { const p = R.pulls[k]; return p ? (p.boss ? p.boss : 'pull ' + p.n) : ''; };
// (a player's big cooldowns over the key (Nov 1): how many, and how many went on the 3 biggest trash pulls, by what they counted toward the 100%
// or else the damage the group took; the hover lists each one's pulls)
function mpCdLine(R, p) {
  if (!(R.cdWho || []).includes(p.name)) return '';
  /* (the 3 biggest pulls by chain: packs pulled one after another count as one pull (the studio's audit of the pull split)) */
  const l = (R.cds || {})[p.name] || [], rt = R.route && R.route.ok ? R.route : null, ch = mpChains(R), byC = new Map();
  R.pulls.forEach((q, k) => { if (q.boss) return; const o = byC.get(ch[k]) || { ks: [], v: 0 }; o.ks.push(k); o.v += rt ? rt.pulls[k].add : (R.taken || [])[k] || 0; byC.set(ch[k], o); });
  const big = new Set([...byC.values()].sort((a, b) => b.v - a.v).slice(0, 3).flatMap((x) => x.ks));
  const by = new Map(); for (const x of l) by.set(x.spell, (by.get(x.spell) || []).concat(mpPullName(R, x.pull)));
  const on = l.filter((x) => big.has(x.pull)).length;
  return ' · <span tabindex="0"' + mpT1(l.length ? '<b>Big cooldowns</b><br>' + [...by].map(([s, ps]) => '<b>' + esc(s) + '</b>: ' + esc([...new Set(ps)].join(', '))).join('<br>') : 'No big cooldown pressed.') + '>' + plural(l.length, 'big cooldown') + (l.length && big.size ? ', ' + on + ' on the 3 biggest pulls' : '') + '</span>';
}
// (a section: its title, one plain headline sentence, then the body. Pulls, Kicks and Players start folded to that sentence with a Show pill;
// a chart's title has a small ⓘ. The Design studio's "easier on the eyes" round, Flex: "i dont know what im looking at looking at the charts,
// maybe giving them some tooltips". Hovers use the site's own look: data-tt, shown on hover, focus or a tap)
const mpT1 = (h) => ' data-tt="' + esc(h) + '"';
const mpInfo = (t) => '<span class="ds-i mpt-i" tabindex="0" role="note" aria-label="How to read it"' + mpT1(t) + '>ⓘ</span>';
const mpSec = (t, line, body, id, o) => { o = o || {}; const h = (o.noTitle ? '' : '<h2>' + t + '</h2>') + (o.tip ? mpInfo(o.tip) : '') + (line ? '<span class="mpt-hl">' + line + '</span>' : ''); /* (noTitle: a chapter with this one part says its name already) */
  return o.fold ? '<details class="mpt-sec mpt-fold"' + (id ? ' id="' + id + '"' : '') + '><summary class="mpt-sh' + (o.noTitle ? ' mpt-sh0' : '') + '">' + h + '<span class="mpt-chev" aria-hidden="true"></span></summary><div class="mpt-fb">' + body + '</div></details>'
    : '<section class="mpt-sec"' + (id ? ' id="' + id + '"' : '') + '><div class="mpt-sh">' + h + '</div>' + body + '</section>'; };
// (where you fell behind: one timeline on the key's timer, your pulls next to a fast run, then why, stretch by stretch)
function mpBehind(R, C, F, FC, fx, waiting) {
  const ck = C.ck, ST = mpStretches(R, C), FS = F ? mpStretches(F, FC) : [], fBy = new Map(FS.map((s) => [s.boss, s]));
  const W0 = Math.max(ck.par, ck.time, FC ? FC.ck.time : 0) * 1.03, X = (s) => (100 * Math.max(0, s) / W0).toFixed(2) + '%', W = (s) => (100 * Math.max(0, s) / W0).toFixed(2) + '%';
  const CP = ST.map((s, i) => ({ boss: s.boss, you: i === ST.length - 1 && R.pulls[R.pulls.length - 1].boss === s.boss ? ck.time : s.at, fast: fBy.has(s.boss) ? fBy.get(s.boss).at : null }));
  if (F && CP.length && FS.length && FS[FS.length - 1].boss === CP[CP.length - 1].boss) CP[CP.length - 1].fast = FC.ck.time;
  // (one lane's pieces: its pulls (split at each death), bosses in gold, each death as its time on the timer, each Lust. The fast run's lane is
  // drawn the same way, faded (the Design studio, Flex: "why use different graphics for the fast run? Wouldnt a true comparison show the same
  // one?" then "ok well fix it then"); every piece has its hover (the "easier on the eyes" round))
  const lane = (RR, CC, fr) => { const blocks = [], dticks = [], pre = fr ? 'Fast run, ' : '';
    for (const p of RR.pulls) { const dd = p.deaths.slice().sort((a, b) => a.t - b.t); let s0 = p.s;
      for (const d of dd) { blocks.push({ x: CC.tv(s0), w: d.t - s0, p }); dticks.push({ x: CC.tv(d.t), d }); s0 = d.t; }
      blocks.push({ x: CC.tv(s0), w: p.e - s0, p }); }
    return blocks.map((b) => '<i class="mpt-blk' + (b.p.boss ? ' mpt-bo' : '') + '" style="left:' + X(b.x) + ';width:' + W(b.w) + '"' + mpT1(b.p.boss ? '<b>' + pre + esc(b.p.boss) + '</b>: ' + mpMM(b.p.dur) + (b.p.kill === false ? ', not killed.' : '.') : '<b>' + (fr ? pre + 'pull ' : 'Pull ') + b.p.n + '</b>: ' + mpMM(b.p.dur) + ' of trash.') + '></i>').join('') +
      dticks.map((t) => '<i class="mpt-dth" style="left:' + X(t.x) + ';width:' + W(CC.pen) + '"' + mpT1('<b>' + (fr ? 'Fast run: ' : '') + esc(t.d.who) + ' died</b>' + (t.d.to && t.d.to !== 'unknown' ? ' to ' + esc(t.d.to) : '') + ': +' + Math.round(CC.pen) + ' s on the timer.') + '></i>').join('') +
      (RR.lust || []).map((l) => '<i class="mpt-lst" style="left:' + X(CC.tv(l.t)) + '"' + mpT1('<b>' + (fr ? 'Fast run\'s Lust' : 'Lust') + '</b>' + (l.spell ? ' (' + esc(l.spell) + ')' : '') + ', ' + esc(mpPullName(RR, l.pull)) + '.') + '></i>').join(''); }; /* (each Lust where it went out (Nov 1)) */
  const youLane = '<div class="mpt-lt">' + lane(R, C, false) +
    CP.map((c) => '<span class="mpt-cp" style="left:' + X(c.you) + '"' + mpT1('<b>' + esc(c.boss) + ' down</b> at ' + mpMM(c.you) + (c.fast != null ? ', ' + (c.you >= c.fast ? mpMM(c.you - c.fast) + ' behind' : mpMM(c.fast - c.you) + ' ahead of') + ' the fast run.' : '.')) + '><i></i></span>').join('') + '</div>';
  const fDia = F ? CP.filter((c) => c.fast != null).map((c) => '<span class="mpt-cp mpt-f" style="left:' + X(c.fast) + '"' + mpT1('<b>Fast run: ' + esc(c.boss) + ' down</b> at ' + mpMM(c.fast) + '.') + '><i></i></span>').join('') : '';
  /* (the grey bar only when the fast run's pulls can't be read) */
  const fastLane = F && (F.pulls || []).length ? '<div class="mpt-lt mpt-ltf">' + lane(F, FC, true) + fDia + '</div>'
    : F ? '<div class="mpt-lt"><i class="mpt-fbar" style="width:' + W(FC.ck.time) + '"' + mpT1('<b>A typical fast run</b>: ' + mpTypical(R, fx) + '. It finished at ' + mpMM(FC.ck.time) + '. Its pulls couldn\'t be read.') + '></i>' + fDia + '</div>'
    : '<div class="mpt-lt mpt-lt0"><span>' + (waiting ? 'Finding a typical fast run…' : 'No public fast run at this level yet.') + '</span></div>';
  const fNote = F && (F.pulls || []).length ? ' It finished at ' + mpMM(FC.ck.time) + '. Same colours as yours, faded.' + (!(F.lust || []).length ? ' Lust isn\'t shown for the fast run: none was found in its log.' : '') : '';
  const marks = '<div class="mpt-mk">' + [[0.6, '+3'], [0.8, '+2'], [1, '+1']].map(([f, l]) => '<span style="left:' + X(ck.par * f) + '"' + mpT1('Finish before <b>' + mpMM(ck.par * f) + '</b> for ' + l + '.') + '>' + l + ' · ' + mpMM(ck.par * f) + '</span>').join('') + '</div>';
  const lines = [0.6, 0.8, 1].map((f) => '<i class="mpt-vl" style="left:' + X(ck.par * f) + '"></i>').join('');
  let lastX = -99, row = 0, rows = 1; const rowOf = CP.map((c) => { const x = 100 * c.you / W0; row = x - lastX < 13 ? 1 - row : 0; lastX = x; rows = Math.max(rows, row + 1); return row; }); /* (bosses close together: their labels take turns on two rows) */
  const gapRow = '<div class="mpt-gp" style="--mpt-gph:' + 40 * rows + 'px">' + CP.map((c, i) => '<span style="left:' + X(c.you) + ';--mpt-gpt:' + 40 * rowOf[i] + 'px"><b>' + esc(c.boss) + '</b>' + mpMM(c.you) + (c.fast != null ? ' · <b class="' + (i === CP.length - 1 && c.you > c.fast ? 'mpt-bad' : '') + '">' + (c.you >= c.fast ? mpMM(c.you - c.fast) + ' behind' : mpMM(c.fast - c.you) + ' ahead') + '</b>' : '') + '</span>').join('') + '</div>';
  const timeline = '<div class="mpt-tl"><div class="mpt-tlg">' + marks + '<div class="mpt-lanes">' + lines + '<div class="mpt-ln"><span class="mpt-ll">You</span>' + youLane + '</div><div class="mpt-ln"><span class="mpt-ll"' + mpT1('<b>A typical fast run</b>: ' + mpTypical(R, fx) + '.' + fNote) + '>Fast run</span>' + fastLane + '</div></div>' + gapRow + '</div>' +
    '<div class="mpt-key"><span><i class="mpt-k1"></i>Pull</span><span><i class="mpt-k2"></i>Boss</span>' + (C.pen ? '<span><i class="mpt-k3"></i>Death (+' + Math.round(C.pen) + ' s)</span>' : '') + (F ? ((F.pulls || []).length ? '<span><i class="mpt-k1 mpt-kf"></i>Fast run (faded)</span>' : '<span><i class="mpt-k4"></i>Fast run</span>') : '') + '<span><i class="mpt-kd"></i>Boss down</span>' + ((R.lust || []).length ? '<span><i class="mpt-kl"></i>Lust</span>' : '') + '</div></div>';
  // why, stretch by stretch: one number a cell, the difference from the fast run, with both in its hover; only the worst one coloured (the
  // "easier on the eyes" round). Without a fast run, your own numbers
  const dv = (v) => { v = Math.round(v); return v > 0 ? '+' + mpMM(v) : v < 0 ? mpMM(v) : 'same'; }, dn = (v) => (v > 0 ? '+' + plural(v, 'pull') : v < 0 ? '−' + plural(-v, 'pull') : 'same');
  const yf = (a, b) => 'You: ' + a + '.<br>Fast run: ' + b + '.', dth = (n, pen) => (n ? plural(n, 'death') + ', ' + mpMM(pen) + ' on the timer' : 'no deaths');
  const why = '<div class="mpt-wyh"><span>Stretch</span><span>Time</span><span>Pulls</span><span>Trash</span><span>Boss</span><span>Deaths</span><span>Standing</span></div>' + ST.map((s) => { const f = fBy.get(s.boss);
    /* (the polish pass: every cell by the size rule, "same" grey; pulls +1 amber, +2 or more red, fewer green. It replaces "only the worst
       cell coloured") */
    const sz = (v) => (Math.round(v) === 0 ? 'mpt-m' : mpSz(Math.round(v))), szN = (v) => (v >= 2 ? 'mpt-bad' : v === 1 ? 'mpt-a' : v < 0 ? 'mpt-g' : 'mpt-m');
    const c = (k, mine, d, tip, cls) => { const l = { t: 'Time', n: 'Pulls', trash: 'Trash', boss: 'Boss', d: 'Deaths', stand: 'Standing' }[k];
      return '<span class="mpt-c" data-l="' + l + '"' + (f ? ' tabindex="0"' + mpT1('<b>' + l + '</b><br>' + tip) : '') + '><b class="' + (f ? cls : '') + '">' + (f ? d : mine) + '</b></span>'; };
    return '<div class="mpt-wyr"><span class="mpt-sn">' + esc(s.name) + '<small>' + (s.first === s.last ? 'pull ' + s.first : 'pulls ' + s.first + '–' + s.last) + '</small></span>' +
      c('t', mpMM(s.t), f && dv(s.t - f.t), f && yf(mpMM(s.t), mpMM(f.t)), f && sz(s.t - f.t)) + c('n', String(s.n), f && dn(s.n - f.n), f && yf(plural(s.n, 'pull'), plural(f.n, 'pull')), f && szN(s.n - f.n)) +
      c('trash', mpMM(s.trash), f && dv(s.trash - f.trash), f && yf(mpMM(s.trash), mpMM(f.trash)), f && sz(s.trash - f.trash)) +
      c('boss', mpMM(s.bossT) + (s.tries > 1 ? ' <small class="mpt-m">(' + s.tries + ' pulls)</small>' : ''), f && dv(s.bossT - f.bossT), f && yf(mpMM(s.bossT) + (s.tries > 1 ? ' over ' + s.tries + ' pulls' : ''), mpMM(f.bossT)), f && sz(s.bossT - f.bossT)) +
      c('d', s.d ? s.d + ' · ' + mpMM(s.pen) : '0', f && dv(s.pen - f.pen), f && yf(dth(s.d, s.pen), dth(f.d, f.pen)), f && sz(s.pen - f.pen)) + c('stand', mpMM(s.stand), f && dv(s.stand - f.stand), f && yf(mpMM(s.stand), mpMM(f.stand)), f && sz(s.stand - f.stand)) + '</div>'; }).join('') +
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
  /* (the quick read: the lanes and their key stay; the stretch table and its sentences fold under "Stretch by stretch") */
  return mpSec('Where you fell behind', line, timeline + '<details class="mpt-sub" id="mptStr"><summary>Stretch by stretch</summary>' + why + (sum ? '<p class="mpt-why">' + sum + '</p>' : '') + src + '</details>', 'mptTl',
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
  const GB = (() => { const best = R.pulls.filter((q) => !q.boss).sort((a, b) => mpGd(b) - mpGd(a))[0]; return { max: Math.max(1, ...R.pulls.map(mpGd)), best, v: best ? mpGd(best) : 0 }; })(); /* (the bars' scale: the key's best pull) */
  let opened = false;
  const row = (p) => { const i = R.pulls.indexOf(p);
    // (quiet tags (the "easier on the eyes" round): sentence case, a small dot, no box; red for deaths, yellow for Lust, grey for the rest.
    // Three at most, then "+N" with the rest in its hover)
    const tg = (txt, cls, tip) => '<span class="mpt-tg' + (cls ? ' ' + cls : '') + '"' + (tip ? mpT1(tip) : '') + '>' + txt + '</span>';
    const dd = p.deaths.slice().sort((a, b) => a.t - b.t), wp = mpWipe(p, n), wipe = !!wp, tags = [];
    /* (Lust and big cooldowns on this pull (Nov 1): who pressed one, of the players whose spec's big cooldowns the Rotation tab knows) */
    /* (big cooldowns by chain (the studio's audit of the pull split): one pressed anywhere in a chain counts for every pack in it; judged on the
       chain's first pack, and never on a chain under 45 s) */
    const ci = mpChainOf(R, i), first = ci[0] === i, cDur = ci.reduce((a, k) => a + R.pulls[k].dur, 0), cName = ci.length > 1 ? 'pulls ' + R.pulls[ci[0]].n + '–' + R.pulls[ci[ci.length - 1]].n : 'this pull';
    /* (a player who never pressed a big cooldown all key is said once, in Players, not on every pull) */
    const cdAct = (R.cdWho || []).filter((nm) => ((R.cds || {})[nm] || []).length);
    const lu = (R.lust || []).filter((l) => l.pull === i), cdu = Object.entries(R.cds || {}).filter(([nm]) => cdAct.includes(nm)).map(([nm, l]) => [nm, l.filter((x) => ci.includes(x.pull))]).filter(([, l]) => l.length), cdn = cdAct.length;
    const cdList = cdu.length ? cdu.map(([nm, l]) => '<b>' + esc(nm) + '</b>: ' + esc([...new Set(l.map((x) => x.spell))].join(', '))).join('<br>') : 'Nobody pressed a big cooldown.';
    if (wipe) tags.push(tg('Wipe', 'mpt-tb')); else if (dd.length) tags.push(tg(plural(dd.length, 'death'), 'mpt-tb'));
    if (p.boss && p.kill === false && !wipe) tags.push(tg('Not killed', 'mpt-tb'));
    if (lu.length) tags.push(tg('Lust', 'mpt-tlu'));
    if (p.through.length) tags.push(tg(plural(p.through.length, 'cast') + ' went off'));
    if (cdn && cdu.length < cdn && first && cDur >= 45) tags.push(tg(cdu.length + ' of ' + cdn + ' big cooldowns', 'mpt-tcd', '<b>Big cooldowns, ' + cName + '</b><br>' + cdList)); /* (only when someone didn't press theirs (the hard-key pass)) */
    for (const b of (p.ebuffs || []).filter((x) => x.on > 0).slice(0, 2)) tags.push(tg(esc(b.spell) + ' ×' + b.on, '', '<b>' + esc(b.spell) + '</b> went on ' + plural(b.on, 'enemy').replace('enemys', 'enemies') + '.'));
    const shown = tags.length > 3 ? tags.slice(0, 3).concat(tg('+' + (tags.length - 3), 'mpt-tm', tags.slice(3).map((x) => x.replace(/<[^>]+>/g, '')).join('<br>'))) : tags;
    const lead = wp ? wp.first : null, tk = lead && roleOf(lead.who) === 'tank';
    // (danger levels (Nov 2, companion/mplus.js 97af928, the Design studio's table): high misses are mistakes, each charged to one ready kick
    // (`who`); medium misses (`minor`) are a quiet note, not a mistake; low ones are only in Kicks)
    const bySp = (list) => { const m = new Map(); for (const t of list) { const o = m.get(t.spell) || { n: 0, who: new Map() }; o.n++; if (t.who) o.who.set(t.who, (o.who.get(t.who) || 0) + 1); m.set(t.spell, o); } return [...m]; };
    const times = (k) => (k === 1 ? 'once' : k === 2 ? 'twice' : k + ' times'), th = bySp(p.through), mi = bySp(p.minor || []);
    const miss = cdAct.filter((nm) => !cdu.some(([x]) => x === nm));
    const body = (dd.length ? '<p><b>' + (wipe ? 'The wipe, in order:' : 'Deaths, in order:') + '</b></p><ol>' + dd.map((d, j) => '<li><span class="mpt-m">' + mpMM(d.t - p.s) + ' in:</span> ' + mpWho(R, d.who) + (d === lead && tk ? ' ' + tg('tank, first', 'mpt-tb') : '') + ' died to <b class="mpt-ab">' + esc(d.to) + '</b>' + (d.from ? ' <span class="mpt-m">(from ' + esc(d.from) + ')</span>' : '') + '. ' + (d.defs ? 'Used ' + plural(d.defs, 'defensive') + '.' : '<b class="mpt-bad">No defensive used.</b>') + '</li>').join('') + '</ol>' : '') +
      th.map(([s, o]) => '<p><b class="mpt-ab">' + esc(s) + '</b> went off ' + times(o.n) + ' with a kick ready.' + (o.who.size ? ' <span class="mpt-m">Whose kick was ready:</span> ' + [...o.who].map(([w, k]) => mpWho(R, w) + (k > 1 ? ' ×' + k : '')).join(', ') + '.' : '') + '</p>').join('') +
      mi.map(([s, o]) => '<p class="mpt-mi"><b>' + esc(s) + '</b> went off ' + times(o.n) + ' with a kick ready. Worth a kick, but not a mistake.</p>').join('') +
      (lu.length ? '<p><b class="mpt-lu">Lust</b>' + (lu[0].spell ? ' (' + esc(lu[0].spell) + ')' : '') + ' went out ' + lu.map((l) => (l.t < p.s ? mpMM(p.s - l.t) + ' before the pull' : mpMM(l.t - p.s) + ' in')).join(' and ') + '.</p>' : '') +
      /* (one short sentence; who pressed what is in its hover) */
      (cdn ? '<p class="mpt-cdl" tabindex="0"' + mpT1('<b>Big cooldowns, ' + cName + '</b><br>' + cdList) + '>' + (!miss.length ? 'Everyone pressed a big cooldown.' : !cdu.length ? 'Nobody pressed a big cooldown.' : miss.map((nm) => mpWho(R, nm)).join(', ').replace(/, ([^,]*)$/, ' and $1') + ' didn\'t press one.') + '</p>' : '');
    const open = !opened && wipe; if (open) opened = true;
    const what = p.boss ? (p.kill === false ? '<span class="mpt-bad">Not killed</span>' : '<span class="mpt-g">Killed</span>') : mpWhat(R, p);
    const add = rt ? rt.pulls[i].add : 0, forces = rt && add ? '+' + fmt(100 * add / rt.full) + ' <small>' + fmt(100 * tot[i] / rt.full) + '</small>' : rt ? '<span class="mpt-m">+0%</span>' : ''; /* (+0% grey, never a blank cell) */
    MP.pinfo[p.n] = { t: p.boss ? esc(p.boss) : 'Pull ' + p.n, at: mpMM(tv(p.s)) + ' to ' + mpMM(tv(p.e)), len: mpMM(p.dur), add: rt && add ? '+' + fmt(100 * add / rt.full) : '', tot: rt ? fmt(100 * tot[i] / rt.full) : '',
      mobs: p.boss ? (p.kill === false ? 'Boss · not killed' : 'Boss · killed') : mpWhat(R, p, 4), tags: tags.filter((x) => !/mpt-tcd/.test(x)).map((x) => x.replace(/ data-tt="[^"]*"/, '')).join(''), dd: dd.slice(0, 3).map((d) => esc(d.who) + ' died to ' + esc(d.to)) };
    /* (group DPS, pull by pull (Flex: "group dps pull by pull would be helpful as well"): the value and a bar scaled to the key's best pull,
       trash blue and bosses gold. No red or green: the size of the pull drives it) */
    const gd = mpGd(p), nE = (p.mobs || []).filter((m) => !(R.summoned || new Set()).has(m[0])).reduce((a, m) => a + m[1], 0);
    const gdc = gd ? '<span class="mpt-pgd' + (p.boss ? ' mpt-bo' : '') + '" tabindex="0"' + mpT1('<b>Group DPS: ' + mpGF(gd) + '</b><br>Your whole group\'s damage a second in this ' + (p.boss ? 'boss fight' : 'pull') + (nE > 1 ? ', with ' + nE + ' enemies' : '') + '.' + (GB.best ? ' Your best trash pull: ' + mpGF(GB.v) + ' (pull ' + GB.best.n + ').' : '')) + '><b>' + mpGF(gd) + '</b><i><u style="width:' + Math.min(100, 100 * gd / GB.max).toFixed(0) + '%"></u></i></span>' : '<span class="mpt-pgd"></span>';
    const head = '<span class="mpt-pn">' + (p.boss ? esc(p.boss) : 'Pull ' + p.n) + '</span><span class="mpt-pm">' + what + '</span><span class="mpt-pt">' + mpMM(p.dur) + '</span><span class="mpt-pf">' + forces + '</span>' + gdc + '<span class="mpt-pc">' + (shown.join('') || '<span class="mpt-m">clean</span>') + '</span>';
    /* (a pack pulled while the last one was still dying: a thin line joins the two rows (the studio's audit of the pull split)) */
    const chn = !first ? '<i class="mpt-chm" tabindex="0"' + mpT1('Pulled while the last pack was still dying.') + '></i>' : '';
    return '<details id="mpt-pull-' + p.n + '" data-n="' + p.n + '" class="mpt-pr' + (p.boss ? ' mpt-boss' : '') + (!first ? ' mpt-chn' : '') + '"' + (open ? ' open' : '') + (body ? '' : ' data-empty') + '><summary>' + chn + head + '</summary>' + (body ? '<div class="mpt-pd">' + body + '</div>' : '') + '</details>';
  };
  const G = mpGroups(R.pulls), tdN = R.pulls.reduce((a, p) => a + p.deaths.length, 0);
  const groups = G.map((g) => { const s = sBy.get(g.to), f = fsBy.get(g.to), fg = FG.get(g.to);
    const head = '<div class="mpt-sgh"><b>' + esc((g.from || 'Start') + ' → ' + (g.to || 'the end')) + '</b><span>' + [s ? mpMM(s.t) : '', f ? 'fast run ' + mpMM(f.t) : '', s && f ? '<b class="' + (s.t - f.t > 60 ? 'mpt-bad' : '') + '">' + (s.t >= f.t ? mpMM(s.t - f.t) + ' slower' : mpMM(f.t - s.t) + ' faster') + '</b>' : ''].filter(Boolean).join(' · ') + '</span></div>';
    const fast = fg ? '<div class="mpt-fp"><p class="mpt-k">Fast run here</p>' + fg.ps.map((q) => { const k = F.pulls.indexOf(q), a = frt ? frt.pulls[k].add : 0; const g2 = mpGd(q); return '<div class="mpt-fpr' + (q.boss ? ' mpt-bo' : '') + '"><span>' + (q.boss ? esc(q.boss) + (a ? ', with trash' : '') : mpWhat(F, q, 2)) + '</span>' +
      (g2 ? '<em class="mpt-fgd' + (q.boss ? ' mpt-bo' : '') + '" tabindex="0"' + mpT1('<b>Fast run\'s group DPS: ' + mpGF(g2) + '</b><br>Its whole group\'s damage a second in this ' + (q.boss ? 'boss fight' : 'pull') + '.') + '>' + mpGF(g2) + '<i><u style="width:' + Math.min(100, 100 * g2 / GB.max).toFixed(0) + '%"></u></i></em>' : '') + '<b>' + (a ? '+' + fmt(100 * a / frt.full) : '') + '</b></div>'; }).join('') + '</div>' : '';
    return '<div class="mpt-sg">' + head + '<div class="mpt-sgb' + (fast ? '' : ' mpt-sgb1') + '"><div>' + g.ps.map(row).join('') + '</div>' + fast + '</div></div>'; }).join('');
  const wipes = R.pulls.filter((p) => mpWipe(p, n)).map((p) => (p.boss ? esc(p.boss) : 'pull ' + p.n));
  return mpSec('Pulls', 'You took <b>' + mpPacks(R) + '</b>' + (wipes.length ? ' and wiped on <b class="mpt-bad">' + wipes.join(' and ') + '</b>.' : tdN ? ', with <b class="mpt-bad">' + plural(tdN, 'death') + '</b>.' : ' with no deaths.'),
    '<div class="mpt-plh' + (F ? '' : ' mpt-plh1') + '"><span>Pull</span><span>What you pulled</span><span>Time</span><span>' + (rt ? 'Forces' : '') + '</span><span>Group DPS</span><span>What happened</span></div>' + groups +
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
    ((R.spam || []).length ? '<p class="mpt-k mpt-ksh">Low danger: kick when you can</p>' + R.spam.map((x) => '<div class="mpt-kr mpt-ks" tabindex="0"' + mpT1('<b>' + esc(x.spell) + '</b> is low danger: ' + x.casts + ' casts from ' + plural(x.enemies, 'enemy').replace('enemys', 'enemies') + '. Every one you kick or stop helps, and one that goes off isn\'t a mistake.') + '><span><b>' + esc(x.spell) + '</b><small>' + esc(x.mob) + (x.enemies > 1 ? ' · ' + plural(x.enemies, 'enemy').replace('enemys', 'enemies') : '') + '</small></span><span class="mpt-m">kicked ' + x.kicked + ' of ' + x.casts + (x.stopped ? ', stopped ' + x.stopped + ' more' : '') + '</span><b></b></div>').join('') : '') + '</div>';
  const right = '<div><p class="mpt-k">Who stopped casts</p>' + (who.length ? who.map((p) => '<div class="mpt-kr2">' + mpWho(R, p.name) + '<span class="mpt-bar"><i class="mpt-cc" style="width:' + (100 * (p.kicks + p.stops) / mx).toFixed(0) + '%;background:' + mpCC(p.cls) + '"></i></span><span class="mpt-m">' + plural(p.kicks, 'kick') + ' · ' + plural(p.stops, 'stop') + '</span></div>').join('') : '<p class="mpt-none">No kicks or stops in this key.</p>') +
    '<p class="mpt-sm">A stop is a stun, knockback or other crowd control that cut a cast short. Healers have no kick in Midnight, except Restoration Shamans.</p></div>';
  const t0 = TH[0];
  return mpSec('Casts and kicks', t0 ? '<b class="mpt-ab">' + esc(t0.spell) + '</b> went off <b>' + (t0.n === 1 ? 'once' : t0.n + ' times') + '</b> with a kick ready.' : 'Nothing on the must-kick list went off with a kick ready.', '<div class="mpt-two">' + left + right + '</div>', 'mptKicks', { fold: true });
}
// (players: damage or healing a second with a bar, against the players of the same spec in the 10 fastest runs, and deaths, defensives
// and avoidable hits)
// (a healer's damage, in time: worth T × r_h / (r − r_h) seconds of fighting, with T the fighting time, r the group's damage a second while
// fighting and r_h the healer's. When that's more than the time the key was timed with, a line says so: "was worth", never "you'd have failed")
const mpHealT = (R, p) => { const y = mpGrp(R.pulls); let D = 0; for (const q of R.pulls) D += ((q.dmg || {})[p.name] || 0) * q.dur; const rh = y.T ? D / y.T : 0; return { rh, worth: y.r > rh && rh ? y.T * rh / (y.r - rh) : 0 }; };
function mpHealWorth(R, p) {
  const ck = R.run.clock; if (!ck || !(ck.up > 0)) return '';
  const lim = ck.up === 3 ? ck.par * 0.6 : ck.up === 2 ? ck.par * 0.8 : ck.par, spare = lim - ck.time, h = mpHealT(R, p);
  if (!(h.worth > spare && spare > 0)) return '';
  return '<p class="mpt-hw" tabindex="0"' + mpT1('<b>Healer damage</b><br>' + esc(p.name) + ' did ' + mpGF(h.rh) + ' damage a second while fighting. Without it, the same fighting would have taken about ' + mpMM(h.worth) + ' longer.') + '>' + mpWho(R, p.name) + '\'s damage timed this key: it was worth <b>' + mpMM(h.worth) + '</b> of fighting, and you had <b>' + mpMM(spare) + '</b> to spare.</p>';
}
function mpPlayers(R, fx, waiting) {
  const ppl = R.people.slice().sort(mpByRole), mxD = Math.max(1, ...ppl.filter((p) => p.role !== 'healer').map((p) => p.dps)), runs = (fx && fx.list && fx.list.runs) || [];
  /* (healers lead with DPS (the studio's healer-dps.md, Flex: "healer DPS is more important than their HPS in keys"): against the same spec's DPS
     in the fast runs when they have it, else their HPS, as before) */
  const vs = (p) => { const heal = p.role === 'healer', same = (m) => mpNorm(m.s) === mpNorm(p.spec) && mpNorm(m.c) === mpNorm(p.cls) && (m.r === 'healer') === heal;
    let a = [], dps = true; for (const r of runs) for (const m of r.ppl || []) if (same(m) && (heal ? m.d : m.a)) a.push(heal ? m.d : m.a);
    if (heal && !a.length) { dps = false; for (const r of runs) for (const m of r.ppl || []) if (same(m) && m.a) a.push(m.a); }
    if (!a.length) return null; a.sort((x, y) => x - y); const avg = a.length % 2 ? a[a.length >> 1] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2, mine = dps ? p.dps : p.hps; return { pct: Math.round(100 * (mine - avg) / avg), n: a.length, avg, u: dps ? 'DPS' : 'HPS' }; }; /* (the middle one, like the typical fast run) */
  const rows = ppl.map((p) => { const heal = p.role === 'healer', v = vs(p), sid = mpSpecId(p.spec, p.cls), ic = typeof NDZ_SPECIC !== 'undefined' && NDZ_SPECIC[sid] ? NDZ_SPECIC[sid] : 'inv_misc_questionmark';
    const vtxt = v ? '<span class="mpt-vs ' + mpVs(v.pct) + '" tabindex="0"' + mpT1('Against ' + esc(plural(v.n, p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || ''))) + ' in the fastest runs with a public log: the middle one does <b>' + Math.round(v.avg / 1000) + 'k ' + v.u + '</b>.') + '>' + (v.pct >= 0 ? v.pct + '% ahead' : -v.pct + '% behind') + '</span>'
      : '<span class="mpt-vs mpt-m">' + (waiting ? '…' : runs.length ? 'no ' + esc(p.spec) + ' in the fast runs' : '—') + '</span>';
    return '<div class="mpt-pl"><span class="mpt-si"><img src="' + whIcon(ic) + '" alt="" loading="lazy" onerror="this.remove()"></span><span class="mpt-pw">' + mpWho(R, p.name) + '<small>' + esc(p.spec) + '</small></span>' +
      '<span class="mpt-pv"><b>' + Math.round(p.dps / 1000) + 'k</b><small>' + (heal ? 'DPS · ' + Math.round(p.hps / 1000) + 'k HPS' : 'DPS') + '</small></span><span class="mpt-bar"><i class="mpt-cc" style="width:' + Math.min(100, 100 * p.dps / mxD).toFixed(0) + '%;background:' + mpCC(p.cls) + '"></i></span>' + vtxt +
      '<span class="mpt-m">' + plural(p.deaths, 'death') + ' · ' + plural(p.defs, 'defensive') + ' · ' + plural(p.avoid, 'avoidable hit') + mpCdLine(R, p) + '</span></div>' + (heal ? mpHealWorth(R, p) : ''); }).join('');
  // (the headline: whether everyone pressed their big cooldowns, and who was furthest behind their spec)
  const never = (R.cdWho || []).filter((nm) => !((R.cds || {})[nm] || []).length), V = ppl.map((p) => ({ p, v: vs(p) })).filter((x) => x.v), low = V.slice().sort((a, b) => a.v.pct - b.v.pct)[0];
  const line = [(R.cdWho || []).length ? (never.length ? never.map((nm) => mpWho(R, nm)).join(', ').replace(/, ([^,]*)$/, ' and $1') + ' never pressed a big cooldown.' : 'Everyone pressed their big cooldowns.') : '',
    low ? (low.v.pct < 0 ? mpWho(R, low.p.name) + ' was furthest behind their spec (<b class="mpt-bad">' + -low.v.pct + '%</b>).' : 'Everyone was ahead of the middle player of their spec.') : '',
    ppl.filter((p) => p.role === 'healer' && mpHealWorth(R, p)).map((p) => mpWho(R, p.name) + '\'s damage timed this key.').join(' ')].filter(Boolean).join(' ') || 'DPS and HPS over the whole key.';
  // (your group, overall (Flex: "and overall"), on top in a player row's look: its DPS while fighting, against the typical fast run, then
  // trash and bosses apart; your own numbers only until the fast run is in)
  const F = fx && fx.R, yG = mpGrp(R.pulls), fG = F ? mpGrp(F.pulls) : null, half = (RR, b) => mpGrp(RR.pulls.filter((q) => !!q.boss === b));
  let grp = '';
  if (yG.r) { const dp = fG && fG.r ? Math.round(100 * (yG.r / fG.r - 1)) : null, fC = F && F.run.clock ? mpClock(F) : null;
    const vsg = dp == null ? '<span class="mpt-vs mpt-m">' + (waiting ? '…' : '—') + '</span>' : '<span class="mpt-vs ' + mpVs(dp) + '" tabindex="0"' + mpT1('Against the typical fast run' + (fC ? ' (' + mpMM(fC.ck.time) + ')' : '') + ': its group did <b>' + mpGF(fG.r) + '</b> DPS while fighting.') + '>' + (dp < 0 ? -dp + '% behind' : dp + '% ahead') + '</span>';
    const tb = (b) => { const y = half(R, b), f = F ? half(F, b) : null; return y.r ? (b ? 'Bosses ' : 'Trash ') + mpGF(y.r) + (f && f.r ? ' (fast run ' + mpGF(f.r) + ')' : '') : ''; };
    grp = '<div class="mpt-pl mpt-plg"><span class="mpt-si mpt-gi" aria-hidden="true"><svg viewBox="0 0 16 16"><circle cx="8" cy="5" r="2.6"/><circle cx="3.6" cy="7" r="2"/><circle cx="12.4" cy="7" r="2"/><path d="M3.5 14c0-2.7 2-4.4 4.5-4.4s4.5 1.7 4.5 4.4Z"/></svg></span>' +
      '<span class="mpt-pw"><b class="mpt-nm">Your group</b><small>while fighting</small></span><span class="mpt-pv"><b>' + mpGF(yG.r) + '</b><small>DPS</small></span><span class="mpt-bar mpt-barg"><i style="width:100%"></i></span>' + vsg +
      '<span class="mpt-m">' + [tb(false), tb(true)].filter(Boolean).join(' · ') + '</span></div>'; }
  return mpSec('Players', line, grp + rows + (runs.length ? '<p class="mpt-sm">Each compared with the middle player of the same spec in the 20 fastest runs.</p>' : ''), 'mptPlayers', { fold: true });
}

// ---------- what Season 2 Mythic+ knows (Nov 2, Flex: "use your new knowledge to make this page even better", creative freedom) ----------
// From notes/Guides/Mythic+ Season 2 - master guide.md: each dungeon's boss plans and trash tips (the guides' boss strategies, Aug 27 / Oct 2),
// the kick, dispel and purge lists checked on Flex's keys, and the paths. Page text never names a guide (Flex's rule).
// (marks, for the polish pass: [[spell]] in the spell colour, **name** for enemies and stats in bold white)
const MP_KNOW = {
  'altar of fangs': { b: [
    ['Rav\'i', ['Tank it away from the **Fresh Meat** it drops.', 'Spread for [[Triple Shot]].', 'Dodge the [[Regurgitate]] cone.', 'Soak during [[Ssscavenging]].']],
    ['The Writhing Coil', ['Kick [[Toxic Atrophy]]: it casts three in a row.', 'Dodge [[Burrowing Charge]].', '[[Death Rattle]]: everyone runs away, or the group wipes.', '[[Uncoil]] splits it into 5. AoE them.']],
    ['Zul\'jan', ['Soak all four beams.', '[[Ritual Venom]] kills when it runs out: soak a line.', 'One [[Boneslicer]] soak clears every [[Ritual Venom]] stack.', 'Dodge the [[Axegrinder]] glaives.']]],
    t: ['Click every totem in the first area.', 'A short stun or kite resets a **Ravenous Descendant**\'s fast attacks.', 'CC [[Evolve]] on the **High Evolutionists**.', 'Break the **Empowered High Evolutionist**\'s shield fast.', 'The **Ascendant Serpent** after the second boss must die.'],
    k: ['Piercing Hiss', 'Toxic Atrophy', 'Mass Envenom'], d: ['Paralyzing Shots', 'Regurgitate', 'Envenom'], p: ['Ravenous Claws'] },
  'murder row': { b: [
    ['Kystia Manaheart', ['Kill the add: the boss takes less damage while it lives.', 'Dispel [[Corroding Spittle]].', 'CC the **Mirror Images**.', 'Burst during [[Destabilized]].']],
    ['Zaen Bladesorrow', ['[[Killing Spree]] needs big healing.', 'Spread for [[Fire Bomb]].', 'Blow up the first **Fel Barrel** with the first bombs. Hide behind the second for [[Murder in a Row]].']],
    ['Xanthuux the Annihilator', ['Kite the boss around the edge.', '[[Legion Strike]] is a tank cone.', 'Put the thrown axe in melee.']],
    ['Lithiel Cinderfury', ['Kite the **Infernal**.', 'Kill the **Vilefiend** before the ring.', 'Stack close for [[Fingers of Gul\'dan]].', 'Take the **Gateway** through the ring.']]],
    t: ['**Fel Crystals** in the first area can be handed in for buffs.', 'Kick [[Fel Rage]]: it\'s a big damage reduction.'],
    k: ['Fel Missiles', 'Seduction', 'Felstorm', 'Fel Rage', 'Health Funnel', 'Chaos Bolt'], d: ['Corroding Spittle', 'Heartstop Poison', 'Curse of Doom'], p: ['Back to Work!'] },
  'den of nalorakk': { b: [
    ['The Hoardmonger', ['Soak the mushrooms.', 'Dodge [[Earthshatter Slam]].', 'Watch the [[Ravenous Bellow]] knockback.']],
    ['Sentinel of Winter', ['Stand in the eye of the storm.', 'Dispel [[Glacial Torment]].', 'Kill the adds, then soak where they die.', 'Tank it on an add\'s body to stop the push.']],
    ['Nalorakk', ['Put [[Echoing Maul]] at the edge.', 'Hide behind **Zul\'jarra**\'s shield for [[Overwhelming Onslaught]].', 'The tank soaks [[Forceful Slam]].', 'Soak the bears for [[Fury of the War God]].']]],
    t: ['Pull **Spirit of Hunger** one at a time.', 'The second area has small lieutenants that are good for count.'],
    k: ['Scavenge', 'Healing Breeze', 'Frigid Roar', 'Winter\'s Shroud', 'Arc Lightning'], d: ['Insatiable Hunger', 'Toxic Spores', 'Cryo Surge', 'Glacial Torment'], p: ['Mother\'s Wrath', 'Bestial Wrath'] },
  'the blinding vale': { b: [
    ['Lightblossom Trinity', ['Soak by stepping into the flower, not in front of it.', 'Spread for [[Thornblade]].', 'Avoid [[Fan of Thorns]]. Dodge [[Lightsower Dash]].']],
    ['Ikuzz the Light Hunter', ['Watch the [[Verdant Stomp]] knockback.', 'Kill the add to break the roots.', 'Run from [[Bloodthirsty Gaze]].']],
    ['Lightwarden Ruia', ['Spread for [[Lightfire]].', 'Heal [[Grievous Thrash]] to full to remove it.', '[[Pulverizing Strikes]] locks onto 3 players: stand still.']],
    ['Ziekket', ['Soak the orbs for a damage buff, but watch your health.', 'Kill the adds.', 'Aim [[Concentrated Lightbeam]] at their bodies.']]],
    t: ['You can go left or right.', 'Break **Lightgorged Lashers**\' shields: they heal while it\'s up.', '**Sporeblight Belchers** are dangerous.'],
    k: ['Light Bolt Volley', 'Light Bolt', 'Disorienting Screech', 'Warden\'s Wrath', 'Lightspore Shot'], d: ['Bloodthorn Roots'], p: [] },
  'voidscar arena': { b: [
    ['Taz\'Rah', ['Every player gets a [[Nether Dash]] line: dodge the other lines.', 'Dodge the [[Dark Bloom]] orbs.']],
    ['Atroxus', ['Kill the add.', 'Dodge [[Poison Splash]].']],
    ['Charonus', ['Kite the orbs into a singularity. Ping which one each player takes.', 'Dodge [[Cosmic Crash]].', 'Run around the boss for [[Void Cascade]].']]],
    t: ['Your first path gives a buff for the whole key: left for **Versatility**, right for **Mastery**.', 'Tank **Brutok** facing a wall.', 'Burst the **Protective Turtle** when its shield drops.', 'Kill whatever a **Devouring Brutalizer** tries to eat.'],
    k: ['Demoralizing Shout', 'Shadowbolt Volley', 'Violent Sand', 'Mad Shriek', 'Mending Void'], d: ['Melt Armor', 'Corrosive Essence'], p: ['Bolster'] },
  'ruby life pools': { b: [
    ['Melidrussa Chillworn', ['Dodge [[Hailburst]]\'s bombs.', 'Stay out of the middle in [[Chillstorm]].', 'Kick [[Frigid Shard]]. Break [[Frost Overload]]\'s shield.']],
    ['Kokia Blazehoof', ['Kill the summoned add and kick its [[Blaze Volley]].', 'Dodge [[Molten Boulder]].', 'Tank defensive for [[Searing Blows]].']],
    ['Kyrakka and Erkhart Stormvein', ['Kill the dragon first.', 'Dodge [[Roaring Firebreath]].', 'Stop casting before [[Interrupting Cloudburst]].', '[[Stormslam]]: tank defensive, and it can be dispelled.']]],
    t: ['Most groups pull a lot before the first boss.', '**Defier Draghar** must die.', '[[Living Bomb]] can be dispelled.'],
    k: ['Ice Shield', 'Frigid Shard', 'Fiery Blast', 'Blaze Volley'], d: ['Cold Claws', 'Rolling Thunder', 'Stormslam'], p: ['Blaze of Glory', 'Stormcloud Barrier'] },
  'kings\' rest': { b: [
    ['The Golden Serpent', ['Don\'t let the adds reach the boss.', 'Drop the [[Spit Gold]] puddles away.', 'Big healing for [[Serpentine Gust]].']],
    ['Mchimba the Embalmer', ['Free trapped players fast: click the right coffin.', 'Drop [[Burn Corruption]] away.', 'Kick the adds.']],
    ['The Council of Tribes', ['Kill the **Explosive Totem** fast.', 'Stack for [[Barrel Through]].', 'Kick [[Poison Nova]].']],
    ['Dazar, the First King', ['Kick [[Deathly Roar]].', 'Stay out of the front in [[Gilded Destruction]], and move off the spears.', 'Spread for [[Quaking Leap]].']]],
    t: ['You need every mob for count.', 'A purge kills a **Minion of Zul** instantly.', 'The second boss room can be two pulls, one per side.', 'Kill **Healing Tide Totems** fast in the hallway to the third boss.'],
    k: ['Hex Volley', 'Bind Soul', 'Unholy Mending', 'Wretched Discharge', 'Hex', 'Poison Nova', 'Deathly Roar'], d: ['Lingering Fluid', 'Putrid Seekers', 'Savage Maul'], p: ['Bound by Shadow', 'Ancestral Fury', 'Bestial Berserk', 'Captain\'s Bulwark', 'Unholy Mending'] },
  'temple of sethraliss': { b: [
    ['Adderis and Aspix', ['Don\'t get pushed too far by [[Gale Force]].', 'Save your knockback: a group soak comes right after.', 'Swap targets when one is immune.']],
    ['Merektha', ['Break the snake stun with CC. A blue arrow shows who gets it.', 'Keep moving in [[Thunder Spit]].', 'Kill the hatchlings. Dodge [[Burrow]].']],
    ['Galvazzt', ['Soak the beams.', 'Move the boss out of [[Induction]].']],
    ['Avatar of Sethraliss', ['Damage dealers soak the purple zones, within 4.5 seconds.', 'Drop [[Latent Hex]] away.', 'Don\'t heal the boss.']]],
    t: ['You need a fair amount of extra trash for count.', '**Sand-Sworn Riders** are deadly.', 'CC the **Temple Disruptors** so the orb follows you.'],
    k: ['Poisoned Cheap Shot', 'Addle Mind', 'Poison Spit', 'Essence Disruption', 'Flame Shock'], d: ['Cytotoxin', 'Imbued Conduction'], p: ['Accumulate Charge'] },
};
const mpKm = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, '<b class="mpt-ab">$1</b>').replace(/\*\*(.+?)\*\*/g, '<b class="mpt-kw">$1</b>');
// (the key's affixes, from its start line: the ID and a plain hover)
const MP_AFFIX = {
  165: ['Lindormi\'s Guidance', 'Some enemies are marked and weaker. Deaths cost no time.'],
  148: ['Ascendant', 'About every minute, 10 orbs cast. Stop each with a kick, stun, knockback or purge for haste and speed. Missed ones make the enemies stronger.'],
  158: ['Voidbound', 'A Void Emissary makes nearby enemies tougher. Swap to it, stop its casts and kill it for versatility and faster cooldowns.'],
  160: ['Devour', 'Every player gets a healing absorb for 15 seconds. Heal through it or dispel it for crit and health. Missed ones make the enemies stronger.'],
  10: ['Fortified', 'Trash has 20% more health and does 20% more damage.'],
  9: ['Tyrannical', 'Bosses have 25% more health and do 15% more damage.'],
  147: ['Xal\'atath\'s Guile', 'Every death adds 15 seconds to the timer.'],
};
// (a key's rating points: the number WoW wrote in the log when there is one, else worked out from +12 up: 15 points a level, plus up to 15 for
// speed, full at 60% of the timer (checked on Raider.IO's own scores: a +12 at 80.3% is 372.4, a +19 at 99% 470.5). Over time: not shown)
const mpPts = (lv, sec, par) => 365 + 15 * (lv - 12) + 15 * Math.max(0, Math.min(1, (1 - sec / par) / 0.4));
// (what the key gained (the polish pass, Flex: "Wouldnt it be better to put how many i gained from the run?"): the rating WoW wrote at the end
// of this key, less the one at the end of the key before it from the same log or night. Unknown before: the key's points, as before)
const mpRate1 = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
function mpRating(R, ck, it) {
  const run = R.run, lv = run.level, exact = run.score && run.score > 0 ? run.score : null;
  if (!ck || (!exact && (lv < 12 || ck.up === 0))) return null;
  const pts = exact || mpPts(lv, ck.time, ck.par), est = !exact, f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const up = lv >= 12 && ck.up > 0 ? mpPts(lv + 1, ck.par, ck.par) : null, upLine = up ? 'A +' + (lv + 1) + ' just in time is worth about ' + Math.round(up) + ', ' + Math.round(up - pts) + ' more than this key.' : '';
  const after = R.rateAfter || (it && it.rateAfter) || null, keys = mpKeys(), i = it ? keys.indexOf(it) : -1;
  let before = null; for (let j = i - 1; j >= 0 && before == null; j--) { const k = keys[j], r = MP.R[mpK(k)]; before = k.rateAfter || (r && r.rateAfter) || null; }
  const dn = esc(String(run.dungeon || '').replace(/^The /, ''));
  if (exact && after && before) { const gain = after - before;
    if (gain >= 0.05) return { gain, pts, tip: '<b>+' + f1(gain) + ' rating</b><br>This key scored ' + f1(pts) + ', your best ' + dn + '. Your rating went from ' + mpRate1(before) + ' to ' + mpRate1(after) + '.' + (upLine ? '<br>' + upLine : '') };
    return { gain: 0, pts, tip: '<b>No rating change</b><br>This key scored ' + f1(pts) + '. Your best ' + dn + ' scored more, so your rating stayed at ' + mpRate1(after) + '.' + (upLine ? '<br>' + upLine : '') }; }
  const lines = [(est ? 'About <b>' + Math.round(pts) + '</b>' : 'This key gave <b>' + f1(pts) + '</b>') + ' points toward your rating, if it\'s your best run in this dungeon.'];
  if (up) lines.push('From +12, each key level is worth 15 points. Finishing faster adds up to 15 more, full at 60% of the timer.', upLine);
  return { pts, est, tip: '<b>Rating points</b><br>' + lines.join('<br>') };
}
// (know this dungeon: each boss's plan, the trash tips, and what to kick, dispel and purge, with how often each must-kick went off with a kick
// ready in this key: high danger red, medium grey. Folded at the end, like the other reference parts)
function mpKnowHtml(R, inCh) {
  const K = MP_KNOW[mpLc(R.run.dungeon)]; if (!K) return '';
  const off = new Map(); for (const p of R.pulls) for (const t of (p.through || []).concat(p.minor || [])) off.set(mpLc(t.spell), (off.get(mpLc(t.spell)) || 0) + 1);
  const TB = new Map(Object.entries(R.tiers || {}).map(([s, v]) => [mpLc(s), v])), SP = new Map((R.spam || []).map((x) => [mpLc(x.spell), x]));
  const tier = (s) => TB.get(mpLc(s)) || 'high', list = (a) => a.map((s) => esc(s)).join(', ').replace(/, ([^,]*)$/, ' and $1');
  /* (a low-danger spell never counts as gone off: its line says how many you kicked instead) */
  const kicks = K.k.map((s) => { const n = off.get(mpLc(s)) || 0, tr = tier(s), sp = SP.get(mpLc(s));
    return '<li><b class="mpt-ab">' + esc(s) + '</b>' + (tr === 'low' ? ' <span class="mpt-m">low danger' + (sp ? ': kicked ' + sp.kicked + ' of ' + sp.casts : '') + '</span>'
      : n ? ' <span class="' + (tr === 'high' ? 'mpt-bad' : 'mpt-m') + '">went off ' + (n === 1 ? 'once' : n + ' times') + ' with a kick ready' + (tr === 'high' ? '' : ' (' + tr + ' danger)') + '</span>' : ' <span class="mpt-g">never went off</span>') + '</li>'; }).join('');
  /* (the polish pass: spells in the spell colour, enemies and stats in bold; trash across the full width in two columns, its title trash blue) */
  const bosses = K.b.map(([n, l]) => '<div class="mpt-kb2"><h4>' + esc(n) + '</h4><ul>' + l.map((x) => '<li>' + mpKm(x) + '</li>').join('') + '</ul></div>').join('');
  const body = '<div class="mpt-know">' + bosses + '<div class="mpt-kb2 mpt-ktr"><h4>Trash</h4><ul>' + K.t.map((x) => '<li>' + mpKm(x) + '</li>').join('') + '</ul></div></div>' +
    '<div class="mpt-kl3"><div><p class="mpt-k">Kick</p><ul>' + kicks + '</ul></div>' + (K.d.length ? '<div><p class="mpt-k">Dispel</p><p>' + list(K.d) + '</p></div>' : '') + (K.p.length ? '<div><p class="mpt-k">Purge or soothe</p><p>' + list(K.p) + '</p></div>' : '') + '</div>' +
    '<p class="mpt-sm">Healers have no kick in Midnight, except Restoration Shamans.</p>';
  const W = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'], cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return mpSec('Know this dungeon', '<b>' + cap(W[K.b.length] || String(K.b.length)) + ' bosses</b>, <b>' + (W[K.k.length] || K.k.length) + ' spells to kick</b>, and a plan for each boss.', body, 'mptKnow', { fold: true, noTitle: !!inCh });
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
    if (ev === 'CHALLENGE_MODE_END') { const f = E.split(line, c + 1); R.rateAfter = num(f[5]) || null; continue; } /* (the player's rating after the key, as WoW wrote it (Nov 2)) */
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
  return mpSec('Your route', 'You took <b>' + mpPacks(R) + '</b>' + (F ? '; the fast run took <b>' + mpPacks(F, true) + '</b>.' : '.'), (maps.length === 1 ? '<div class="mpt-rt1"><div>' + say + strips + '</div><div>' + map + '</div></div>' : say + strips + map) + credit, 'mptRoute');
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
  for (let d = row.parentElement && row.parentElement.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true; /* (Pulls and the route fold start folded) */
  row.open = true; row.scrollIntoView({ behavior: 'smooth', block: 'center' }); row.classList.add('mpt-flash'); setTimeout(() => row.classList.remove('mpt-flash'), 1400); }, true);
document.addEventListener('keydown', (e) => { if (e.key !== 'Enter' || !e.target.classList || !e.target.classList.contains('mpt-dot')) return; e.target.click(); });
window.addEventListener('scroll', () => { if (MP_CARD && !MP_CARD.hidden) mpCardHide(); }, { passive: true });

// ---------- the look (the Design studio's round 3; site colours, so the themes apply) ----------
function mpCss() { if (document.getElementById('mpt-css')) return; const st = document.createElement('style'); st.id = 'mpt-css'; st.textContent = MP_CSS; document.head.appendChild(st); }
const MP_CSS = `
.mpt{--mpt-soft:#d6d1c6;--mpt-badT:#ff8f87;--mpt-goodT:#7ee08f;--mpt-ab:#c39bff;--mpt-you:#7d9be8;--mpt-lane:#191d26;--mpt-fast:#5d6577;max-width:1180px;margin:0 auto;padding:0 0 80px;font:15px/1.5 var(--body)}
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
.mpt-fx{margin:0;padding:0} /* (no edge bar: Design rules, the chapters round) */
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
.mpt-sb-f{background:#7d9be8} .mpt-sb-s{background:#95a0ab} .mpt-sb-d{background:#e57068} /* (standing grey: gold is the boss colour (the polish pass)) */
.mpt-sb-fm{background:#7d9be8} .mpt-sb-fl{background:rgb(178,200,250)} /* (group DPS: more to kill, lower damage) */
/* (the polish pass: one colour = one meaning. Trash blue, boss gold, standing grey, deaths red, kicks purple, Lust yellow) */
.mpt-fxn.mpt-c-trash{background:rgba(125,155,232,.16);color:#7d9be8} .mpt-fxn.mpt-c-stand,.mpt-fxn.mpt-c-none{background:rgba(149,160,171,.16);color:#95a0ab}
.mpt-fxn.mpt-c-death{background:rgba(229,112,104,.16);color:#e57068} .mpt-fxn.mpt-c-kick{background:rgba(195,155,255,.16);color:#c39bff} .mpt-fxn.mpt-c-lust{background:rgba(255,209,102,.14);color:#ffd166}
.mpt .mpt-cc{opacity:.85} .mpt .mpt-kw{color:var(--text);font-weight:700}
.mpt-ktr{grid-column:1 / -1} .mpt-kb2.mpt-ktr h4{color:#7d9be8} .mpt-ktr ul{columns:2;column-gap:28px} .mpt-ktr li{break-inside:avoid}
@media (max-width:600px){ .mpt-ktr ul{columns:1} }
.mpt-pill.mpt-rg{cursor:help} .mpt-pill.mpt-rn{color:var(--muted);cursor:help}
/* ("Next time", the waits and healer damage (the studio's next-time-and-waits.md and healer-dps.md)) */
.mpt .mpt-nt{margin:6px 0 0!important;font:500 13.5px/1.45 var(--body)!important;color:var(--mpt-soft)!important} .mpt-nt > b:first-child{color:var(--mpt-goodT);font-weight:700;margin-right:4px}
.mpt-wts{margin-top:8px;display:grid;gap:2px} .mpt-wts .mpt-k{margin-bottom:2px}
.mpt-wt{display:grid;grid-template-columns:108px minmax(0,1fr) 40px;gap:4px 12px;align-items:start;padding:4px 0;font:500 13px var(--body)}
.mpt-wt > span{color:var(--mpt-soft)} .mpt-wt > b{font:700 14px var(--head);text-align:right;font-variant-numeric:tabular-nums}
.mpt-wt i{display:block;height:6px;margin-top:6px;border-radius:3px;background:var(--mpt-lane);overflow:hidden} .mpt-wt u{display:block;height:100%;background:#95a0ab;border-radius:3px;text-decoration:none}
.mpt-wt small{display:block;margin-top:3px;font:500 12.5px var(--body);color:var(--muted)}
.mpt-wt.mpt-wtf{opacity:.6}
.mpt-hw{margin:2px 0 8px 48px;padding:6px 0;font:500 14px var(--body);color:var(--mpt-soft);cursor:help} .mpt-hw b{color:var(--mpt-goodT)}
@media (max-width:600px){ .mpt-hw{margin-left:0} .mpt-wt{grid-template-columns:84px minmax(0,1fr) 36px} }
.mpt-gl{margin:2px 0 6px;font:500 14px var(--body);color:var(--mpt-soft)}
.mpt-gt{margin:4px 0 0!important;font:500 13px var(--body)!important;color:var(--muted)!important}
.mpt-gtc{color:var(--mpt-soft);text-decoration:underline dotted var(--faint);text-underline-offset:3px;cursor:help} .mpt-gtc.mpt-m{color:var(--muted)}
.mpt-pgd{display:grid;gap:3px;align-content:start;cursor:help} .mpt-pgd b{font:700 14px var(--head);font-variant-numeric:tabular-nums}
.mpt-pgd i,.mpt-fgd i{display:block;width:64px;max-width:100%;height:4px;border-radius:2px;background:var(--mpt-lane);overflow:hidden}
.mpt-pgd u,.mpt-fgd u{display:block;height:100%;background:var(--mpt-you);border-radius:2px;text-decoration:none} .mpt-pgd.mpt-bo u,.mpt-fgd.mpt-bo u{background:var(--gold)}
.mpt-fgd{display:grid;gap:2px;font:600 12.5px var(--head);font-style:normal;color:var(--muted);cursor:help} .mpt-fgd u{opacity:.55}
.mpt-fpr > span:first-child{flex:1;min-width:0}
.mpt-plg{border-bottom:1px solid var(--line2)} .mpt-gi{display:grid;place-items:center;background:color-mix(in srgb,var(--gold) 12%,transparent)} .mpt-gi svg{width:20px;height:20px;fill:var(--gold)}
.mpt-bar.mpt-barg i{background:var(--mpt-you)} /* (blue: gold means boss (the studio's audit)) */ .mpt-tile[data-tt]{cursor:help}
.mpt-sk{display:flex;gap:6px 18px;flex-wrap:wrap;font:500 13.5px var(--body);color:var(--muted);margin-bottom:6px} .mpt-sk b{color:var(--text)}
.mpt-sk i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}
/* (the pieces with a hover) */
.mpt-blk,.mpt-dth,.mpt-lst,.mpt-cp,.mpt-fbar,.mpt-mk span,.mpt-sp,.mpt-sbm,.mpt-strip u,.mpt-fdot,.mpt-c[data-tt],.mpt-vs[data-tt],.mpt-ll[data-tt]{cursor:help}
.mpt-blk:hover,.mpt-sp:hover,.mpt-fbar:hover{filter:brightness(1.2)}
.mpt-ltf .mpt-blk,.mpt-ltf .mpt-dth,.mpt-ltf .mpt-lst{opacity:.55} .mpt-ltf .mpt-blk:hover{opacity:.8} .mpt-ltf .mpt-cp{opacity:.8} .mpt-kf{opacity:.55} /* (the fast run: your colours, faded, so "You" stays the bright one) */
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
.mpt-plh,.mpt-pr summary,.mpt-sum{display:grid;grid-template-columns:96px minmax(0,1fr) 44px 92px 72px 200px;gap:12px;align-items:baseline;padding:8px 6px}
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
/* (a chained pack: a thin line joins it to the row above (the studio's audit of the pull split)) */
.mpt-pr.mpt-chn > summary{position:relative} .mpt-chm{position:absolute;left:0;top:-9px;width:2px;height:18px;background:var(--faint);border-radius:1px;cursor:help}
.mpt-chm::after{content:"";position:absolute;left:-5px;top:0;width:12px;height:100%}
.mpt-pr.mpt-chn{border-top-color:transparent}
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
/* (what Season 2 Mythic+ knows (Nov 2): the rating pill, the affix chips, and Know this dungeon) */
.mpt-pill.mpt-rp{color:var(--gold);border-color:color-mix(in srgb,var(--gold) 50%,transparent);background:color-mix(in srgb,var(--gold) 7%,transparent);cursor:help}
.mpt-afx{display:flex;gap:4px 14px;flex-wrap:wrap;margin-top:7px}
.mpt-af{display:inline-flex;align-items:center;gap:6px;font:500 13px var(--body);color:var(--muted);cursor:help}
.mpt-af::before{content:"";width:6px;height:6px;border-radius:50%;background:color-mix(in srgb,var(--gold) 70%,transparent)}
.mpt-af:hover,.mpt-af:focus{color:var(--text);outline:none}
.mpt-know{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px 28px;margin-bottom:16px}
.mpt-kb2{min-width:0}
.mpt-kb2 h4{margin:0 0 3px;font:700 16px var(--head);color:var(--gold)}
.mpt-kb2 ul,.mpt-kl3 ul{margin:0;padding-left:18px;color:var(--mpt-soft);font-size:14.5px}
.mpt-kb2 li,.mpt-kl3 li{padding:1px 0}
.mpt-kl3{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr);gap:14px 28px;padding-top:12px;border-top:1px solid var(--line)}
.mpt-kl3 > div{min-width:0} .mpt-kl3 p{margin:0;color:var(--mpt-soft);font-size:14.5px} .mpt-kl3 .mpt-k{margin-bottom:4px}
.mpt-ksh{margin-top:16px!important} .mpt-pd .mpt-mi{color:var(--muted)} .mpt-pd .mpt-mi b{color:var(--mpt-soft);font-weight:600} .mpt-ks{color:var(--muted);cursor:help} .mpt-ks b{color:var(--mpt-soft);font-weight:600}
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
.mpt-say{margin:0 0 18px;padding:0;list-style:none}
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
.mpt-sbm{position:absolute;top:-6px;bottom:-6px;width:0;border-left:2px solid var(--gold)} /* (the boss marker on the strip: kept, thinner (it marks where a boss died, not an edge)) */
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
.mpt-tg.mpt-tlu{color:#ffd166} .mpt-tg.mpt-tlu::before{background:#ffd166}
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
/* (five chapters (Nov 2, the Design studio's chapters.md): the site's own .panel finish, a small grey label, parts split by a hairline) */
.mpt .mpt-chap{display:block;padding:16px 20px 18px;margin:0 0 16px;background:var(--panel);border:1px solid var(--line2);border-radius:var(--r,4px)}
html:not([data-theme]) .mpt .mpt-chap{background-image:linear-gradient(rgba(255,255,255,.055),rgba(255,255,255,0) 160px);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 1px 0 rgba(0,0,0,.5),0 14px 30px -16px rgba(0,0,0,.95)} /* (Debriefing's panel finish, from the site's own variables; not the .panel class: the site's type scale resizes text inside it) */
.mpt-chk{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 10px;margin:0 0 8px;font:700 11px var(--head);letter-spacing:.44px;text-transform:uppercase;color:var(--faint)}
.mpt-chk span{font:500 13px var(--body);letter-spacing:0;text-transform:none;color:var(--muted)}
.mpt-chk-bad::before,.mpt-chk-good::before{content:"";width:6px;height:6px;align-self:center;flex:none;margin-right:-3px}
.mpt-chk-bad::before{background:var(--bad)} .mpt-chk-good::before{background:#7ee08f}
.mpt-chap > .mpt-chk + *{margin-top:0;border-top:0;padding-top:0}
.mpt-chap > .mpt-sec + .mpt-sec,.mpt-chap > .mpt-fx + .mpt-sec{margin-top:18px;padding-top:18px;border-top:1px solid var(--line)}
.mpt-chap > .mpt-sec + .mpt-fold{padding-top:4px}
.mpt-chap .mpt-ban{padding:2px 0 14px;border-bottom:0}
.mpt-chap .mpt-tiles{margin-top:0;border-bottom:0;padding-bottom:0}
.mpt-chap .mpt-tile{border-left:0;box-shadow:inset 1px 0 0 var(--line)} .mpt-chap .mpt-tile:first-child{box-shadow:none}
.mpt-fxr:hover{background:rgba(255,255,255,.025)}
/* (the quick read (Nov 2, the studio's quick-read.md): rows open on a click, three then "Show N more", folds under "▸ …") */
.mpt-fxd{border-top:1px solid var(--line)} .mpt-fxh + .mpt-fxd,.mpt-sk + .mpt-fxd,.mpt-sbar + .mpt-fxd{border-top:0}
.mpt-fxd > summary.mpt-fxr{list-style:none;cursor:pointer;border-top:0} .mpt-fxd > summary::-webkit-details-marker{display:none}
.mpt-fxd > summary .mpt-fxt::after{content:" ▸";font-size:12px;color:var(--faint)} .mpt-fxd[open] > summary .mpt-fxt::after{content:" ▾"}
.mpt-fxm{padding:0 0 12px 40px} .mpt-fxm > p:first-child{margin:0;color:var(--mpt-soft);font-size:14.5px}
.mpt .mpt-ntd{color:var(--mpt-soft)!important}
.mpt-fxbtn{margin:10px 0 0 40px;height:30px;padding:0 14px;font:600 13px var(--head);letter-spacing:.04em;color:var(--muted);background:none;border:1px solid var(--line2);border-radius:999px;cursor:pointer}
.mpt-fxbtn:hover,.mpt-fxbtn:focus-visible{color:var(--text);border-color:var(--faint);outline:none}
.mpt-sub{margin-top:12px} .mpt-sub > summary{list-style:none;cursor:pointer;width:fit-content;font:600 13.5px var(--head);letter-spacing:.04em;color:var(--muted);padding:4px 0}
.mpt-sub > summary::-webkit-details-marker{display:none} .mpt-sub > summary::before{content:"▸ ";color:var(--faint)} .mpt-sub[open] > summary::before{content:"▾ "}
.mpt-sub > summary:hover{color:var(--text)} .mpt-sub[open] > summary{margin-bottom:10px}
.mpt-rpl{margin:0;font:500 15px var(--body);color:var(--mpt-soft)} .mpt-rpl b{color:var(--text)}
.mpt-fold > summary.mpt-sh0{grid-template-columns:minmax(0,1fr) auto} .mpt-fold > summary.mpt-sh0 .mpt-hl{grid-column:1;grid-row:1}
@media (max-width:600px){ .mpt-fxm{padding-left:0} .mpt-fxbtn{margin-left:0} }
.mpt-chap + .mpt-jb{margin:0 0 16px}
@media (max-width:600px){ .mpt .mpt-chap{padding:14px 12px 16px} }
@media (max-width:860px){
  .mpt-rt1{grid-template-columns:minmax(0,1fr)}
  .mpt-fold > summary{grid-template-columns:minmax(0,1fr) auto;row-gap:4px}
  .mpt-kl3{grid-template-columns:minmax(0,1fr)}
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
  .mpt-tile:last-child:nth-child(odd){flex-basis:100%} /* (five tiles: the last one across, never alone in half a row) */
  .mpt-chap .mpt-tile{box-shadow:none}
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
  .mpt-pgd{grid-column:1 / -1;display:flex;align-items:center;gap:8px} .mpt-pgd:empty{display:none} .mpt-pgd::before{content:"Group DPS";font:700 11px var(--head);letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
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
