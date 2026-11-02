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
function mpTabHtml(on) { on = !!on; const tt = mpKeys().length ? 'Your Mythic+ key, top to bottom: what gets you a level up, where you fell behind a fast run, every pull, kick and death' : 'Find your Mythic+ keys, or anyone\'s, and see where the time went'; /* (always in the top bar (the key finder, Nov 2)) */
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
  const keys = mpKeys(); if (!it) it = MP.item && keys.includes(MP.item) ? MP.item : keys[keys.length - 1]; if (!it) { mpFinder(); return; } /* (no key open: the key finder) */
  if (MPF.addNext && it.wcl) { MPF.addNext = false; const J = mpkGet(); for (const k of mpKeys()) if (k.wcl && !J.added.some((a) => a.code === k.wcl.code && a.fight === k.wcl.fight)) J.added.push(mpkOf(k)); mpkSet(J); } /* (a link pasted in the key finder: its keys join the list) */
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
function mpPickHtml(it) { const keys = mpKeys(), find = '<button class="linkbtn mpt-findl" type="button" data-mpf-open="1">Find other keys</button>'; if (keys.length < 2) return '<div class="mpt-pick">' + find + '</div>';
  return '<div class="mpt-pick"><label for="mptPick">' + keys.length + ' keys in this report</label><select id="mptPick">' + keys.map((x, i) => '<option value="' + i + '"' + (x === it ? ' selected' : '') + '>' + esc(mpKeyName(x)) + '</option>').join('') + '</select>' + find + '</div>'; }
// ---------- the key finder (Nov 2; Flex: "theres no way to look up your m+ logs on my website. Should put that somewhere", the Design
// studio's key-finder.md, "Yes, send it"): the Mythic+ tab with no key open. Your keys (your character on Debrief, else the newest one the
// sign-in sent), and anyone's by name, realm and region. Their uploads newest first; the Mythic+ ones opened a few at a time (one report
// read each, kept by the site); only keys the character was in; the same key in several uploads shown once, opening the first)
const MP_SEASON = (z) => !!z && (z.id === 55 || /^Mythic\+ Season 2$/i.test(z.name || ''));
const MPF = { who: null, mine: false, reps: [], at: 0, page: 0, last: 1, rows: [], seen: new Map(), busy: false, err: '', done: false, view: [], addNext: false };
function mpfMine() {
  const me = typeof meOf === 'function' ? meOf() : null, cs = groups().filter((g) => g.kind === 'char'), g = (me && cs.find((c) => c.name === me.name)) || cs[0];
  if (g) return { id: g.id, name: g.name, server: g.server || '' };
  const w = WCL.HOSTED && typeof wclMe === 'function' ? wclMe() : null, c = w && (w.chars || []).slice().sort((a, b) => b.id - a.id)[0];
  return c ? { id: c.id, name: c.n, server: (c.srv || '') + (c.srv && c.reg ? ' (' + String(c.reg).toUpperCase() + ')' : '') } : null; }
// ---------- the Mythic+ front page (Nov 2; Flex: "id like the m+ screen to resemble something similar to the Home Screen … where you can easily
// pull up multiple character logs … keep m+ completely its own thing", and "yes" to the studio's mock): Home's hero with a paste box for a key,
// "Your characters" as Home's tiles (every saved character, every sign-in character, and ones added here for Mythic+ only), then the picked
// character's keys by dungeon. Keys come in on their own (mpkImport); a reload draws them at once from what was read before ----------
const MP_REAL = { night: 'AEVxiCJqkaR3pmxgnKtnsA', pull: 0 }; /* (Flex's Voidscar +19, shared: "See a real +19 key") */
function mpFinder() {
  if (S.page === 'pull' && S.item) PROG_BACK = S.item; /* (the raid you came from stays one tab away) */
  S.page = 'mpfind'; mpCss(); MPF.addNext = false;
  for (const id of ['#list', '#bossHead', '#bossPick']) { const el = $(id); if (el) el.innerHTML = ''; }
  { const oa = $('#oaTop'); if (oa) { oa.innerHTML = ''; oa.hidden = true; } }
  const I = typeof TH_ICO !== 'undefined' ? TH_ICO : {};
  const hero = '<section class="th-hero"><h1>Every key, <span class="mpf-gold">explained.</span></h1><p class="th-lead">Pick a character to see their keys, or open any key.</p>' +
    '<div class="th-box">' + (I.link || '') + '<input id="mpfIn" placeholder="Paste a Warcraft Logs report with a key in it" autocomplete="off" aria-label="Warcraft Logs report link"><button class="btn primary" id="mpfGo" type="button">Open</button></div>' +
    '<div class="th-links"><button type="button" data-mpf-file="1">' + (I.file || '') + 'Open a log file</button><button type="button" data-mpf-real="1">' + (I.play || '') + 'See a real +19 key</button></div>' +
    '<div class="th-msg"><span class="fp-msg" id="mpfMsg"></span></div></section>';
  const add = '<form class="mpf-f mpf-addf" id="mpfAddForm" autocomplete="off" hidden><label><span>Character</span><input name="n" required spellcheck="false" aria-label="Character"></label>' +
    '<label><span>Realm</span><input name="s" required spellcheck="false" aria-label="Realm"></label><label><span>Region</span><select name="r" aria-label="Region"><option>US</option><option>EU</option><option>KR</option><option>TW</option></select></label>' +
    '<button class="btn primary" type="submit">Add</button></form><p class="mpf-msg mpt-bad" id="mpfAddMsg" hidden></p>';
  $('#main').innerHTML = pgTabBar(null) + '<div class="mpf-home">' + hero + '<section class="th-teams"><div class="th-h"><h2>Your characters</h2><span class="sub" id="mpfAgo"></span></div><div id="mpfCards"></div>' + add + '</section>' +
    '<section class="mpt mpf" id="mpfKeys"></section><p class="mpf-foot2">Every saved character, and every character on your Warcraft Logs sign-in, comes in on its own. New keys show up the next time you open this tab.</p></div>';
  { const t = $('#main .pg-tabbar .mpt-tab'); if (t) { t.classList.add('on'); t.setAttribute('aria-selected', 'true'); } }
  try { navNote(); } catch (e) { /* (no address) */ } window.scrollTo(0, 0);
  mpfDraw(); if (!MPK.ran) { MPK.ran = true; mpkImport(); } }
function mpfStart(who, mine) { Object.assign(MPF, { who, mine, reps: [], at: 0, page: 0, last: 1, rows: [], seen: new Map(), busy: false, err: '', done: false }); mpfDraw(); mpfMore(); }
// (the next few Mythic+ uploads: pages of uploads as needed, then each one's keys)
async function mpfMore() {
  if (MPF.busy || MPF.done || !MPF.who) return; const who = MPF.who; MPF.busy = true; MPF.err = ''; mpfDraw();
  let creds = null; try { creds = await wclCreds(); } catch (e) { creds = null; }
  try {
    if (!who.id) { const c = await WCL.charInfo(creds, { name: who.name, srv: who.srv, reg: who.reg }); Object.assign(who, { id: c.id, name: c.name, server: c.server, cls: c.cls }); }
    let read = 0; const had = MPF.rows.length; /* (until 8 more keys or 24 uploads: rows appear as they're found) */
    while (read < 24 && MPF.rows.length - had < 8 && MPF.who === who) {
      if (MPF.at >= MPF.reps.length) { if (MPF.page >= MPF.last) { MPF.done = true; break; }
        const pg = await WCL.charReportsPage(creds, who.id, ++MPF.page); if (MPF.who !== who) return; MPF.last = pg.last; MPF.reps.push(...pg.data.filter((r) => MP_SEASON(r.zone))); continue; }
      const r = MPF.reps[MPF.at++]; read++; mpfDraw();
      try { const rep = await WCL.loadReport(creds, r.code); if (MPF.who !== who) return; for (const it of rep.runs || []) mpfAdd(it, who); mpfDraw(); } catch (e) { /* (a private or broken upload is skipped) */ }
    }
    if (MPF.at >= MPF.reps.length && MPF.page >= MPF.last) MPF.done = true;
  } catch (e) { if (MPF.who === who) MPF.err = e.message || String(e); }
  if (MPF.who === who) { MPF.busy = false; mpfDraw(); } }
function mpfAdd(it, who) {
  const nm = mpLc(who.name); if (!(it.roster || []).some((n) => mpLc(n) === nm)) return; /* (uploads list other people's keys too) */
  const k = [mpLc(it.boss), it.level, it.keyMs || 'x' + Math.round((it.duration || 0) / 60), new Date(it.wallMs).toISOString().slice(0, 10)].join('|'), o = MPF.seen.get(k);
  if (o) { o.n++; return; }
  const row = { it, n: 1 }; MPF.seen.set(k, row); MPF.rows.push(row); MPF.rows.sort((a, b) => b.it.wallMs - a.it.wallMs); }
function mpfRow(r, i) {
  const it = r.it, tm = (window.DBF_MPTIMER || {})[mpLc(it.boss)], s = it.keyMs ? it.keyMs / 1000 : 0, spare = tm && s && it.timed ? tm * 60 - s : 0;
  const res = s ? (it.timed ? 'Timed +' + (it.up || 1) : 'Over time') : 'Left early', rc = s && it.timed ? (it.up >= 2 ? 'mpt-g' : 'mpt-a') : 'mpt-m';
  const time = s ? mpMM(s) + (tm ? ' of ' + tm + ':00' : '') + (spare > 0 ? ' · ' + (spare < 60 ? Math.round(spare) + ' s' : mpMM(spare)) + ' to spare' : '') : mpMM(it.duration || 0) + ' played';
  const day = new Date(it.wallMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return '<button class="mpf-r" type="button" data-mpf="' + i + '"' + (r.n > 1 ? ' data-tt="Same key in ' + r.n + ' uploads, shown once."' : '') + '><span class="mpf-lv' + (it.level >= 15 ? ' mpf-hi' : '') + '">+' + it.level + '</span>' +
    '<span class="mpf-dg"><b>' + esc(it.boss) + '</b><small>' + time + '</small><em class="' + rc + '">' + res + ' · ' + day + '</em></span><span class="mpf-res ' + rc + '">' + res + '</span><span class="mpf-dt">' + day + '</span><span class="btn sm mpf-op">Open</span></button>'; }
// (every saved character's keys (Nov 2, Flex: "can you have it auto import all of the saved website characters logged m+ runs with the additional
// option to import a log manually? Organize them by the dungeon run"; the studio's key-finder.md addendum): read on their own, the way a team's
// raid nights are (teamImport): each character's uploads this season, newest first, three at a time, one import at a time across tabs. What was
// read is kept in this browser per character (each upload's end time, like g.done), so the next visit draws at once and reads only new uploads.
// Keys from a pasted link join the list and stay; keys from a combat log on this PC show for this visit only)
const MP_KEYK = 'mpt-keys', MP_DUNGEONS = ['Altar of Fangs', 'Den of Nalorakk', 'Kings\' Rest', 'Murder Row', 'Ruby Life Pools', 'Temple of Sethraliss', 'The Blinding Vale', 'Voidscar Arena'];
const MPK = { busy: false, ran: false, err: '', n: 0, of: 0, t0: 0, pick: '', more: new Set() };
const mpkGet = () => { try { const j = JSON.parse(store.get(MP_KEYK) || 'null'); if (j && j.chars) { j.added = j.added || []; j.addedChars = j.addedChars || []; return j; } } catch (e) { /* (unreadable: start again) */ } return { chars: {}, added: [], addedChars: [] }; };
const mpkSet = (j) => { try { store.set(MP_KEYK, JSON.stringify(j)); } catch (e) { /* (full: kept for this visit) */ } };
const mpkOf = (it) => ({ code: it.wcl.code, fight: it.wcl.fight, boss: it.boss, level: it.level, keyMs: it.keyMs, timed: it.timed, up: it.up, wallMs: it.wallMs, duration: it.duration });
// (whose keys: every character saved on Debrief, plus every character the Warcraft Logs sign-in sent, once each (Flex: "it was only showing my druid
// and not my paladin"); one with no Mythic+ upload this season is left out (mpkImport marks it))
const mpkChars = () => { const out = [], seen = new Set(); for (const g of groups()) if (g.kind === 'char' && g.id && !seen.has(+g.id)) { seen.add(+g.id); out.push(g); }
  const w = WCL.HOSTED && typeof wclMe === 'function' ? wclMe() : null;
  for (const c of (w && w.chars) || []) if (c.id && !seen.has(+c.id)) { seen.add(+c.id); out.push({ id: c.id, name: c.n, cls: (typeof WCL_CLS !== 'undefined' && WCL_CLS[c.cls]) || '', server: (c.srv || '') + (c.srv && c.reg ? ' (' + String(c.reg).toUpperCase() + ')' : ''), kind: 'char', signin: true }); }
  for (const c of mpkGet().addedChars || []) if (c.id && !seen.has(+c.id)) { seen.add(+c.id); out.push({ ...c, kind: 'char', added: true }); } /* (added on this page, for Mythic+ only) */
  return out; };
const mpkId = (it) => [mpLc(it.boss), it.level, it.keyMs || 'x' + Math.round((it.duration || 0) / 60), new Date(it.wallMs).toISOString().slice(0, 10)].join('|');
async function mpkImport() {
  const cs = mpkChars(); if (!cs.length) return; if (MPK.busy) { MPK.again = true; return; }
  if (Date.now() - +(store.get(IMPORT_LOCK) || 0) < 90e3) { MPK.err = 'Another tab is reading uploads right now. Your saved keys are below; open the tab again in a minute for new ones.'; mpfDraw(); return; }
  Object.assign(MPK, { busy: true, err: '', n: 0, of: 0, t0: Date.now(), per: {}, again: false }); for (const g of cs) MPK.per[g.id] = { n: 0, of: 0 }; store.set(IMPORT_LOCK, String(Date.now())); mpfDraw();
  let creds = null; try { creds = await wclCreds(); } catch (e) { creds = null; }
  try { const J = mpkGet(), todo = [];
    for (const g of cs) { const c = J.chars[g.id] || (J.chars[g.id] = { done: {}, keys: [] }), p1 = await WCL.charReportsPage(creds, g.id, 1).catch(() => null); /* (no Mythic+ on the first page of uploads: none this season; left out) */
      c.none = !p1 || !p1.data.some((x) => MP_SEASON(x.zone)); if (c.none) continue; /* (one that can't be read is skipped; the rest carry on) */
      for (const x of await WCL.charReports(creds, g.id).catch(() => [])) if (MP_SEASON(x.zone) && (c.done || {})[x.code] !== x.endTime) todo.push({ g, x }); }
    mpkSet(J);
    todo.sort((a, b) => b.x.startTime - a.x.startTime); MPK.of = todo.length; for (const { g } of todo) MPK.per[g.id].of++; mpfDraw();
    for (let i = 0; i < todo.length; i += 3) { store.set(IMPORT_LOCK, String(Date.now())); const batch = todo.slice(i, i + 3), reps = await Promise.all(batch.map(({ x }) => WCL.loadReport(creds, x.code).catch(() => null))), J2 = mpkGet();
      batch.forEach(({ g, x }, b) => { const c = J2.chars[g.id] || (J2.chars[g.id] = { done: {}, keys: [] }), rep = reps[b], nm = mpLc(g.name); if (!rep) return; /* (a private upload is tried again next time) */
        for (const it of rep.runs || []) if ((it.roster || []).some((n) => mpLc(n) === nm) && !c.keys.some((k) => k.code === it.wcl.code && k.fight === it.wcl.fight)) c.keys.push(mpkOf(it));
        c.done[x.code] = x.endTime; MPK.per[g.id].n++; });
      mpkSet(J2); MPK.n = Math.min(todo.length, i + batch.length); mpfDraw(); }
  } catch (e) { MPK.err = e.message || String(e); }
  { const J3 = mpkGet(); J3.at = Date.now(); mpkSet(J3); } store.set(IMPORT_LOCK, '0'); MPK.busy = false; mpfDraw(); if (MPK.again) mpkImport(); }
// (one list: the same key under two saved characters is one row with both names)
function mpkRows(cs) { const J = mpkGet(), m = new Map();
  const put = (it, who, tag, local) => { const k = mpkId(it), o = m.get(k); if (o) { if (who && !o.who.includes(who)) o.who.push(who); return; } m.set(k, { it, who: who ? [who] : [], tag, local }); };
  for (const g of cs) for (const k of (J.chars[g.id] || {}).keys || []) put({ ...k, wcl: { code: k.code, fight: k.fight } }, g.name);
  for (const k of J.added) put({ ...k, wcl: { code: k.code, fight: k.fight } }, '', 'added');
  for (const it of mpKeys()) if (!it.wcl && it.wallMs) put(it, '', 'from your PC', true);
  return [...m.values()]; }
const mpfRes = (it) => { const s = it.keyMs ? it.keyMs / 1000 : 0; return { t: s ? (it.timed ? 'Timed +' + (it.up || 1) : 'Over time') : 'Left early', c: s && it.timed ? (it.up >= 2 ? 'mpt-g' : 'mpt-a') : 'mpt-m' }; };
// (a key row, one slim line (Flex's slim rows): the level, the time, the result, the date and Open. The character's name only when several are listed)
function mpfRow2(r, ccOf, showWho) { const i = MPF.view.push(r) - 1, it = r.it, tm = (window.DBF_MPTIMER || {})[mpLc(it.boss)], s = it.keyMs ? it.keyMs / 1000 : 0, spare = tm && s && it.timed ? tm * 60 - s : 0, R0 = mpfRes(it);
  const time = s ? '<b>' + mpMM(s) + '</b>' + (tm ? ' <small>of ' + tm + ':00</small>' : '') + (spare > 0 ? ' <small>· ' + (spare < 60 ? Math.round(spare) + ' s' : mpMM(spare)) + ' to spare</small>' : '') : '<small>Not finished · ' + mpMM(it.duration || 0) + ' played</small>';
  const day = new Date(it.wallMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const who = (showWho ? r.who.map((n) => '<span style="color:' + (ccOf(n) || 'var(--text)') + '">' + esc(n) + '</span>').join(', ') + ' ' : '') + (r.tag ? '<span class="mpt-m">' + esc(r.tag) + '</span> ' : '');
  return '<button class="mpf-kr" type="button" data-mpfv="' + i + '"' + (r.n > 1 ? ' data-tt="Same key in ' + r.n + ' uploads, shown once."' : '') + '><span class="mpf-lv2' + (it.level >= 15 ? ' mpf-hi' : '') + '">+' + it.level + '</span>' +
    '<span class="mpf-kt">' + who + time + '</span><span class="mpf-res2 ' + R0.c + '">' + R0.t + '</span><span class="mpf-dt2">' + day + '</span><span class="btn sm mpf-op">Open</span></button>'; }
// (all 8 dungeons, A to Z so nothing jumps around, each a quiet fold with its best timed key and how many. Inside: timed keys first (highest, then
// newest), then over time, then left early, so a reset doesn't take a top slot (the studio's row fixes); 3, then "Show N more")
const mpfRank = (it) => (it.keyMs ? (it.timed ? 0 : 1) : 2);
function mpfByDungeon(rows, id, people) { const showWho = !!(people && people.length > 1), cc = new Map((people || []).map((p) => [p.name, p.cls ? mpCC(p.cls) : ''])), ccOf = (n) => cc.get(n);
  return MP_DUNGEONS.map((d) => { const L = rows.filter((r) => mpLc(r.it.boss) === mpLc(d)).sort((a, b) => mpfRank(a.it) - mpfRank(b.it) || b.it.level - a.it.level || b.it.wallMs - a.it.wallMs), sid = id + '-' + d.toLowerCase().replace(/[^a-z]+/g, ''), more = MPK.more.has(sid);
    const b = (L.find((r) => r.it.timed && r.it.keyMs) || L[0] || {}).it, br = b && mpfRes(b);
    if (!L.length) return '<div class="mpf-dgh mpf-dg0"><div class="mpf-dsum"><b>' + esc(d) + '</b><span class="mpt-m">No keys yet</span></div></div>';
    return '<details class="mpf-dgh" id="' + sid + '" open><summary class="mpf-dsum"><b>' + esc(d) + '</b><span><b class="' + br.c + '">+' + b.level + ' · ' + br.t + '</b> <span class="mpt-m">' + plural(L.length, 'key') + '</span></span></summary>' +
      '<div class="mpf-kl">' + L.slice(0, more ? L.length : 3).map((r) => mpfRow2(r, ccOf, showWho)).join('') + (L.length > 3 ? '<button type="button" class="linkbtn mpf-showm" data-mpfm="' + sid + '">' + (more ? 'Show fewer' : 'Show ' + (L.length - 3) + ' more') + '</button>' : '') + '</div></details>'; }).join(''); }
// (a character's own keys, one row each)
function mpkOwn(c, J) { const m = new Map(); for (const k of ((J.chars[c.id] || {}).keys || [])) { const it = { ...k, wcl: { code: k.code, fight: k.fight } }, id = mpkId(it), o = m.get(id); if (o) o.n++; else m.set(id, { it, n: 1, who: [c.name] }); } return [...m.values()]; }
// (a character's tile, Home's tt-card: the crest, the name in class colour, the class and guild, one square per dungeon (green timed +2/+3, amber +1,
// grey not timed, dark no key), the best key and how many dungeons timed, and the keys this season, or a gold bar with % and time left while it reads)
function mpfCard(c, J, on) { const rows = mpkOwn(c, J), cls = (E.CLASSES || {})[c.cls], per = MPK.busy && MPK.per && MPK.per[c.id];
  const best = MP_DUNGEONS.map((d) => { const L = rows.filter((r) => mpLc(r.it.boss) === mpLc(d)), t = L.filter((r) => r.it.timed && r.it.keyMs).sort((a, b) => b.it.level - a.it.level || b.it.up - a.it.up)[0];
    return { d, t, any: L.length, st: t ? (t.it.up >= 2 ? 'g' : 'a') : L.length ? 'm' : '' }; });
  const strip = best.map((x) => '<i class="' + x.st + '"' + mpT1(esc(x.d) + ': ' + (x.t ? '+' + x.t.it.level + ', timed +' + (x.t.it.up || 1) : x.any ? 'not timed' : 'no key')) + '></i>').join('');
  const top = best.filter((x) => x.t).sort((a, b) => b.t.it.level - a.t.it.level || b.t.it.up - a.t.it.up)[0], nT = best.filter((x) => x.t).length;
  const pct = per && per.of ? Math.round(100 * per.n / per.of) : 0, left = per && per.n ? (Date.now() - MPK.t0) / Math.max(1, MPK.n) * (MPK.of - MPK.n) / 1000 : 0;
  const l2 = per && per.of > per.n ? '<span class="tt-l">Finding keys: ' + per.n + ' of ' + per.of + ' uploads (' + pct + '%)' + (left ? ' · about ' + (left < 90 ? 'a minute' : Math.round(left / 60) + ' minutes') + ' left' : '') + '</span><span class="mpf-prog"><i style="width:' + pct + '%"></i></span>'
    : per && !per.of ? '<span class="tt-l">Finding keys…</span><span class="mpf-prog"><i style="width:4%"></i></span>' : '<span class="tt-l">' + (rows.length ? plural(rows.length, 'key') + ' this season' : 'No keys yet this season') + '</span>';
  return '<div class="tt-card mpf-card' + (on ? ' on' : '') + '" role="button" tabindex="0" data-mpc="' + esc(String(c.id)) + '" aria-pressed="' + !!on + '">' + banner(c) + '<span class="tt-b"><span class="tt-n"' + (cls ? ' style="color:' + cls[1] + '"' : '') + '>' + esc(c.name) + '</span>' +
    '<span class="tt-g">' + esc([cls ? cls[0] : '', c.guild ? '‹' + c.guild + '›' : c.server || ''].filter(Boolean).join(' · ')) + '</span><span class="tt-strip mpf-strip">' + strip + '</span>' +
    (top ? '<span class="tt-l">Best <b>+' + top.t.it.level + ' ' + esc(top.d) + '</b> · ' + nT + ' of 8 dungeons timed</span>' : '') + l2 + '</span>' + (c.added ? '<button type="button" class="mpf-x" data-mpx="' + esc(String(c.id)) + '" aria-label="Remove ' + esc(c.name) + '">×</button>' : '') + '</div>'; }
const mpfPickId = () => { try { return localStorage.getItem('mpt-pick') || ''; } catch (e) { return MPK.pick || ''; } };
// (the page: the cards, then the picked character's keys; redrawn as keys come in)
function mpfDraw() { if (S.page !== 'mpfind') return; MPF.view = []; const J = mpkGet(), cs = mpkChars().filter((c) => !(J.chars[c.id] || {}).none);
  const cards = $('#mpfCards'), keys = $('#mpfKeys'), ago = $('#mpfAgo'); if (!cards || !keys) return;
  const pick = cs.find((c) => String(c.id) === mpfPickId()) || cs[0];
  cards.innerHTML = '<div class="tt-row">' + cs.map((c) => mpfCard(c, J, c === pick)).join('') +
    '<div class="tt-card tt-add mpf-addc" role="button" tabindex="0" data-mpadd="1"><span class="tt-plus" aria-hidden="true">+</span><span class="tt-n">Add a character</span><span class="tt-l">Any character by name and realm, just for Mythic+. Your raid teams aren\'t touched.</span></div></div>' +
    (MPK.err ? '<p class="mpf-msg mpt-bad">' + esc(MPK.err) + '</p>' : '');
  if (ago) { const m = J.at ? Math.round((Date.now() - J.at) / 60000) : null; ago.textContent = MPK.busy ? 'finding new keys…' : m == null ? '' : 'checked ' + (m < 1 ? 'just now' : m < 60 ? plural(m, 'minute') + ' ago' : 'earlier'); }
  if (!pick) { keys.innerHTML = '<p class="mpf-msg">Add a character to see their keys, or open any key above.</p>'; return; }
  const extra = []; for (const k of J.added) extra.push({ it: { ...k, wcl: { code: k.code, fight: k.fight } }, n: 1, who: [], tag: 'added' }); for (const it of mpKeys()) if (!it.wcl && it.wallMs) extra.push({ it, n: 1, who: [], tag: 'from your PC', local: true });
  const own = mpkOwn(pick, J), ids = new Set(own.map((r) => mpkId(r.it))), rows = own.concat(extra.filter((r) => !ids.has(mpkId(r.it)))), cls = (E.CLASSES || {})[pick.cls];
  keys.innerHTML = '<div class="th-h"><h2' + (cls ? ' style="color:' + cls[1] + '"' : '') + '>' + esc(pick.name) + '\'s keys</h2><span class="sub">this season, by dungeon · highest first</span></div>' +
    '<div class="mpf-keys">' + mpfByDungeon(rows, 'mptK', null) + '</div>';
  try { mpFoldRestore(); } catch (e) { /* (folds as drawn) */ } }
const mpfPaste = () => { const v = $('#mpfIn').value.trim(); if (!v) return; MPF.addNext = true; openReportLink(v, $('#mpfMsg')); }; /* (its keys join the list (mpOpen)) */
document.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('[data-mpx],[data-mpc],[data-mpadd],[data-mpfv],[data-mpk],[data-mpfm],[data-mpf-more],[data-mpf-open],[data-mpf-paste],[data-mpf-file],[data-mpf-real],#mpfGo'); if (!t) return;
  if (t.dataset.mpfv != null) { const r = MPF.view[+t.dataset.mpfv]; if (!r) return; if (r.local) mpOpen(r.it); else mpGo(r.it.wcl.code, r.it.wcl.fight); }
  else if (t.dataset.mpk != null) { MPK.pick = t.dataset.mpk; mpfDraw(); }
  else if (t.dataset.mpx) { e.stopPropagation(); const J = mpkGet(), id = t.dataset.mpx; J.addedChars = J.addedChars.filter((c) => String(c.id) !== id); delete J.chars[id]; mpkSet(J); mpfDraw(); }
  else if (t.dataset.mpc) { try { localStorage.setItem('mpt-pick', t.dataset.mpc); } catch (x) { MPK.pick = t.dataset.mpc; } mpfDraw(); }
  else if (t.dataset.mpadd) { const fm = $('#mpfAddForm'); if (fm) { fm.hidden = !fm.hidden; if (!fm.hidden) fm.n.focus(); } }
  else if (t.dataset.mpfm) { const k = t.dataset.mpfm; if (MPK.more.has(k)) MPK.more.delete(k); else MPK.more.add(k); mpfDraw(); }
  else if (t.dataset.mpfMore) mpfMore();
  else if (t.dataset.mpfOpen) mpFinder();
  else if (t.dataset.mpfPaste) { const bx = $('#mpfBox'); bx.hidden = !bx.hidden; if (!bx.hidden) $('#mpfIn').focus(); }
  else if (t.dataset.mpfFile) nightDlg();
  else if (t.dataset.mpfReal) openShared(MP_REAL.night, { pull: MP_REAL.pull, tab: 'mplus' });
  else if (t.id === 'mpfGo') mpfPaste(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target && e.target.id === 'mpfIn') mpfPaste(); else if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches && e.target.matches('.mpf-card, .mpf-addc')) { e.preventDefault(); e.target.click(); } });
// (a character added by name: for Mythic+ only, kept in this browser; it never touches your raid teams)
document.addEventListener('submit', async (e) => { const fm = e.target; if (!fm || fm.id !== 'mpfAddForm') return; e.preventDefault(); const msg = $('#mpfAddMsg'), n = fm.n.value.trim(), s2 = fm.s.value.trim(), r = fm.r.value; if (!n || !s2) return; if (msg) msg.hidden = true;
  let creds = null; try { creds = await wclCreds(); } catch (x) { creds = null; }
  try { const c = await WCL.charInfo(creds, { name: n, srv: srvSlug(s2), reg: r }), J = mpkGet(); if (!J.addedChars.some((x) => +x.id === +c.id)) J.addedChars.push({ id: c.id, name: c.name, cls: c.cls || '', server: c.server || '', guild: c.guild || '' }); mpkSet(J);
    try { localStorage.setItem('mpt-pick', String(c.id)); } catch (x) { MPK.pick = String(c.id); } fm.reset(); fm.hidden = true; mpfDraw(); mpkImport(); }
  catch (x) { if (msg) { msg.textContent = x.message || String(x); msg.hidden = false; } } });
document.addEventListener('submit', (e) => { const f = e.target; if (!f || f.id !== 'mpfForm') return; e.preventDefault();
  const n = f.n.value.trim(), s = f.s.value.trim(), r = f.r.value, msg = $('#mpfFormMsg'); if (!n || !s) return; if (msg) msg.hidden = true;
  mpfStart({ name: n, srv: srvSlug(s), reg: r, server: s + ' (' + r + ')' }, false); const l = $('#mpfList'); if (l) l.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

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
  try { mpMapRestore(); } catch (e) { /* (no map) */ }
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
// ("14 pulls, 3 chained into the one before"; short: "11" for the fast run after yours. Every pull keeps its number, bosses too: "Pull N" is
// what you fight at once, the way Mythic Dungeon Tools says it (Nov 2, the studio's mdt-view.md, which reverses "Pack N"). mpPN names one
// ("pull 5", or the boss); mpPNs names several ("pulls 9, 10 and 12"))
// (a trash pull's number, counted among trash pulls only: bosses go by name with a ★ and never take a number, so the list reads Pull 5,
// Taz'Rah, Pull 6 (the studio, Nov 2). Takes the pull's n, the reader's own count, which stays the key for rows and links)
const mpNo = (RR, n) => { if (!RR._no) { let k = 0; RR._no = RR.pulls.map((p) => (p.boss ? 0 : ++k)); } return RR._no[n - 1] || n; };
const mpPN = (RR, n) => mpPullName(RR, n - 1);
const mpPNs = (RR, ns) => (ns.every((n) => !(RR.pulls[n - 1] || {}).boss) ? (ns.length === 1 ? 'pull ' : 'pulls ') + mpAnd(ns.map((n) => String(mpNo(RR, n)))) : mpAnd(ns.map((n) => mpPN(RR, n))));
const mpCap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const mpPacks = (RR, short) => { const tr = RR.pulls.filter((p) => !p.boss), n = tr.length, ch = n - mpChainN(RR, tr); return short ? String(n) : plural(n, 'pull') + (ch ? ', ' + ch + ' chained into the one before' : ''); };
// (stretches: from the start (or a boss) to the next boss: the pulls in it, the time fighting, the deaths and the time between pulls)
function mpStretches(R, C) { const P = R.pulls, out = []; let from = C.T0, fromName = 'Start', fi = 0;
  P.forEach((b, bi) => { if (!b.boss || b.kill === false) return; /* (a boss you wiped on, or reset, is part of the stretch to its kill) */ const ps = P.slice(fi, bi + 1), d = ps.reduce((a, p) => a + p.deaths.length, 0), fight = ps.reduce((a, p) => a + p.dur, 0), wall = b.e - from;
    const tr = ps.filter((p) => !p.boss); /* (trash and the boss apart (the Design studio's hard-key pass): at +19 the boss fights are a big share of the key) */
    out.push({ name: fromName + ' → ' + b.boss, boss: b.boss, n: tr.length, nt: tr.length, ntc: tr.length - mpChainN(R, tr), packs: tr.length, /* (every pull, to match the list (the studio, Nov 2); ntc: how many trash pulls were chained) */ fight, trash: tr.reduce((a, p) => a + p.dur, 0), bossT: fight - tr.reduce((a, p) => a + p.dur, 0), tries: ps.length - tr.length, d, pen: d * C.pen, stand: Math.max(0, wall - fight), t: wall + d * C.pen, first: ps[0].n, last: b.n, at: C.tv(b.e) }); from = b.e; fromName = b.boss; fi = bi + 1; });
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
// (what a pull fought: its enemies less summons, guardians, enemy pets and ones no player hit (Raj'kess's orbs, Taz'Rah's Ethereal Shades;
// the studio's pull-accuracy fix, Nov 2). Their damage still counts toward group DPS)
const mpMobs = (RR, p) => { const sum = RR.summoned || new Set(), real = RR.realNames; return (p.mobs || []).filter((m) => !sum.has(m[0]) && (!real || real.has(m[0]))); };
const mpCnt = (RR, p) => mpMobs(RR, p).reduce((a, m) => a + m[1], 0);
const mpWhere = (s) => (s.name.startsWith('Start → ') ? 'before ' + esc(s.boss) : 'between ' + esc(s.name.split(' → ')[0]) + ' and ' + esc(s.boss));
// (a trash stretch: lead with the bigger cause (the studio's audit). More to kill: where the fast run got its count instead. Fewer, bigger
// pulls only when the fast run took at least 2 fewer pulls there (by chain), quoting its biggest pack)
function mpNextTrash(R, F, s, f, ST, fBy) {
  const yp = mpInSt(R, s).filter((p) => !p.boss), fp = mpInSt(F, f).filter((p) => !p.boss); if (!fp.length || !yp.length) return '';
  const sp = mpSplit(mpGrp(yp), mpGrp(fp)); if (!sp) return '';
  const yN = yp.length, fN = fp.length, fewer = yN - fN >= 2, out = []; /* (every pull, as the list and the stretch rows count them (the studio, Nov 2)) */
  const yc = yp.map((p) => mpCnt(R, p)), fBig = Math.max(...fp.map((p) => mpCnt(F, p)));
  const pullLine = 'Pull it in fewer, bigger pulls. The fast run took it in ' + plural(fN, 'pull') + ', the biggest ' + fBig + ' enemies; you took ' + yN + (yc.length > 1 ? ' (' + Math.min(...yc) + ' to ' + Math.max(...yc) + ')' : '') + '.';
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
  if (most >= 2) out.push('Put one kicker on each ' + esc(mob) + ': ' + esc(mpPNs(R, at.map((p) => p.n))) + ' had ' + most + '.');
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
  const nm = (p, RR = R) => esc(mpPN(RR, p.n));
  const note = (x) => { const dd = [...new Set(x.prev.deaths.map((d) => d.who))], lu = (R.lust || []).filter((l) => l.t >= x.prev.e && l.t <= x.p.s + 5);
    const cds = Object.entries(R.cds || {}).flatMap(([n, l]) => l.filter((c) => c.t >= x.prev.e && c.t <= x.p.s + 5).map((c) => [n, c.spell])), bits = [];
    if (dd.length) bits.push(mpAnd(dd.map((w) => mpWho(R, w))) + ' had died in ' + nm(x.prev) + '.');
    if (lu.length || cds.length) bits.push(lu.length && cds.length ? 'Lust and ' + plural(cds.length, 'big cooldown') + ' went out at the pull.' : lu.length ? 'Lust went out at the pull.' : cds.length === 1 ? mpWho(R, cds[0][0]) + ' pressed ' + esc(cds[0][1]) + ' at the pull.' : plural(cds.length, 'big cooldown') + ' went out at the pull.');
    x.free = !bits.length; return bits.join(' ') || 'No death, and no big cooldown at the pull.'; };
  const FG = F ? gaps(F)[0] : null, mx = Math.max(...G.map((x) => x.g), FG ? FG.g : 0);
  const row = (lab, g, n, cls) => '<div class="mpt-wt' + (cls ? ' ' + cls : '') + '"><span>' + lab + '</span><div><i><u style="width:' + (100 * g / mx).toFixed(0) + '%"></u></i><small>' + n + '</small></div><b>' + mpMM(g) + '</b></div>';
  let h = '<div class="mpt-wts"><p class="mpt-k">Your longest waits</p>' + G.map((x) => row('Before ' + nm(x.p), x.g, note(x))).join('');
  if (FG) h += row('Fast run\'s longest', FG.g, 'Before its ' + nm(FG.p, F) + '.', 'mpt-wtf');
  const free = G.filter((x) => x.free && x.g >= 10).map((x) => x.p);
  return { h: h + '</div>', nt: !free.length ? '' : mpNT('Pull sooner before ' + esc(mpPNs(R, free.map((p) => p.n))) + '. Nobody was dead and no big cooldown went out when you pulled.') }; /* (the list, and its Next time line apart: the quick read shows the line, the list on a click) */
}
// (what gets you the next level: each fix's seconds on the timer, biggest first. A wipe: every death in it. Deaths to the same spell. A
// must-kick cast that went off with a kick ready and killed someone. Casts that went off without killing anyone save casts, not seconds)
function mpFixes(R, C, all) {
  const P = R.pulls, n = Math.max(1, (R.people || []).length), pen = Math.round(C.pen) || 15, out = [], used = new Set();
  const roleOf = (w) => ((R.people || []).find((p) => p.name === w) || {}).role || '';
  for (const p of P) { const wp = mpWipe(p, n); if (!wp) continue;
    const dd = wp.list; dd.forEach((d) => used.add(d)); const f = wp.first, tank = roleOf(f.who) === 'tank';
    out.push({ c: 'death', ps: [P.indexOf(p)], s: dd.length * pen, t: 'Don\'t wipe on ' + esc(mpPN(R, p.n)), plus: 'plus the run back',
      d: (tank ? 'Your tank ' : '') + mpWho(R, f.who) + ' died first, to <b class="mpt-ab">' + esc(f.to) + '</b>' + (f.defs ? '.' : ', with <b class="mpt-bad">no defensive</b>.') + ' Everyone else was dead ' + Math.max(1, Math.round(dd[dd.length - 1].t - f.t)) + ' s later.' }); }
  // (a must-kick cast and the deaths it caused: the same spell from the same kind of enemy, in a pull where it went off with a kick ready)
  const thr = new Map(); for (const p of P) for (const t of p.through) { const k = t.spell + '|' + t.mob, o = thr.get(k) || { spell: t.spell, mob: t.mob, n: 0, pulls: new Set() }; o.n++; o.pulls.add(p.n); thr.set(k, o); }
  const by = new Map(), rest = []; for (const p of P) for (const d of p.deaths) { if (used.has(d) || !d.to || d.to === 'unknown') { if (!used.has(d)) rest.push({ ...d, pull: p.n }); continue; } const k = thr.get(d.to + '|' + d.from), key = k && k.pulls.has(p.n) ? 'k|' + d.to + '|' + d.from : 'd|' + d.to, o = by.get(key) || { to: d.to, k: key[0] === 'k' ? k : null, list: [] }; o.list.push({ ...d, pull: p.n }); by.set(key, o); }
  for (const o of by.values()) { const names = [...new Set(o.list.map((d) => d.who))], killed = names.map((w) => mpWho(R, w)).join(' and '), times = o.list.length;
    if (o.k) { o.k.done = true; const pl = [...o.k.pulls]; out.push({ c: 'kick', ps: [...o.k.pulls].map((n) => n - 1), sp: o.to, mob: o.k.mob, s: times * pen, t: 'Kick ' + esc(o.to) + (pl.length === 1 ? ' in ' + esc(mpPN(R, pl[0])) : ''), d: 'It went off ' + plural(o.k.n, 'time') + ' with a kick ready, and killed ' + killed + (times > names.length ? ' ' + (times === 2 ? 'twice' : times + ' times') : '') + '.' }); }
    else if (times >= 2) out.push({ c: 'death', ps: [...new Set(o.list.map((d) => d.pull - 1))], s: times * pen, t: plural(times, 'death') + ' to ' + esc(o.to), d: 'Who died: ' + o.list.map((d) => mpWho(R, d.who) + ' <span class="mpt-m">(' + esc(mpPN(R, d.pull)) + ')</span>').join(', ') + '. Each death put ' + pen + ' s on the timer.' });
    else rest.push(...o.list); }
  out.sort((a, b) => b.s - a.s);
  // (Lust that missed your biggest pulls (Nov 1): only when it's clear in the log: no Lust went on a boss or on either of your two biggest trash
  // pulls (what they counted toward the 100%, else the damage the group took). It saves time we can't measure, so no seconds)
  /* (by chain since the pull split (the studio's audit): packs pulled one after another, the fight going on, are one pull here) */
  { const L = R.lust || [], rt = R.route && R.route.ok ? R.route : null, ch = mpChains(R), byC = new Map();
    P.forEach((p, k) => { if (p.boss) return; const o = byC.get(ch[k]) || { ks: [], v: 0 }; o.ks.push(k); o.v += rt ? rt.pulls[k].add : (R.taken || [])[k] || 0; byC.set(ch[k], o); });
    const trash = [...byC.values()].sort((a, b) => b.v - a.v), top = trash.slice(0, 2), nm = (x) => (x.ks.length > 1 ? 'pulls ' + mpNo(R, P[x.ks[0]].n) + '–' + mpNo(R, P[x.ks[x.ks.length - 1]].n) : 'pull ' + mpNo(R, P[x.ks[0]].n));
    const amt = (x) => (rt ? Math.round(100 * x.v / rt.full) + '% of the enemies' : Math.round(x.v / 1e6) + 'M damage taken');
    if (L.length && top.length && top[0].v > 0 && !L.some((l) => P[l.pull] && (P[l.pull].boss || top.some((x) => x.ks.includes(l.pull))))) {
      const on = L.map((l) => { const x = trash.find((y) => y.ks.includes(l.pull)); return x ? nm(x) + ' (' + amt(x) + ')' : esc(mpPullName(R, l.pull)); });
      out.push({ c: 'lust', ps: [...new Set(L.map((l) => l.pull).concat(top[0].ks))].sort((a, b) => a - b), s: 0, ns: 'timing', t: 'Lust on your biggest pulls', d: 'Lust went on ' + on.join(' and ') + '. Your biggest pull was ' + nm(top[0]) + ' (' + amt(top[0]) + ').' }); } }
  // (then must-kick casts that went off without killing anyone: fewer casts, not seconds)
  const wiped = new Set(P.filter((p) => mpWipe(p, n)).map((p) => p.n));
  const bySp = new Map(); for (const p of P) for (const t of p.through) { const k = thr.get(t.spell + '|' + t.mob); if (!k || k.done) continue; const o = bySp.get(t.spell) || { spell: t.spell, n: 0, pulls: new Map() }; o.n++; o.pulls.set(p.n, (o.pulls.get(p.n) || 0) + 1); bySp.set(t.spell, o); }
  for (const k of [...bySp.values()].filter((x) => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 2)) { const pl = [...k.pulls.keys()], [bp, bn] = [...k.pulls].sort((a, b) => b[1] - a[1])[0];
    out.push({ c: 'kick', ps: [...k.pulls.keys()].map((n) => n - 1), sp: k.spell, n: k.n, s: 0, ns: 'fewer casts', t: 'Kick ' + esc(k.spell), d: 'It went off ' + plural(k.n, 'time') + ' with a kick ready' + (pl.length === 1 && wiped.has(bp) ? ', all in the ' + esc(mpPN(R, bp)) + ' wipe' : pl.length > 1 && bn * 2 >= k.n && wiped.has(bp) ? ', ' + bn + ' of them in the ' + esc(mpPN(R, bp)) + ' wipe' : pl.length <= 3 ? ', in ' + esc(mpPNs(R, pl)) : ', across ' + pl.length + ' pulls') + '.' }); }
  // (last, the deaths left, one to each cause, as one line)
  const more = out.some((x) => x.s > 0); /* ("more" only after other deaths above it) */
  if (rest.length) out.push({ c: 'death', ps: [...new Set(rest.map((d) => d.pull - 1))], s: rest.length * pen, t: more ? (rest.length === 1 ? 'One more death' : plural(rest.length, 'more death')) : (rest.length === 1 ? 'One death' : plural(rest.length, 'death')), d: rest.sort((a, b) => a.t - b.t).map((d) => mpWho(R, d.who) + ' to <b class="mpt-ab">' + esc(d.to || 'unknown') + '</b> <span class="mpt-m">(' + esc(mpPN(R, d.pull)) + ')</span>').join(', ') + '.' });
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
    mpChap('mptCM', 'Your key on the map', 'every pull, and what went wrong where', mpRPFold(R, null, mpRouteHtml(R, null, false) + mpPulls(R, null, null, null), mpMapHtml(R, null, ''))) + mpChap('mptC4', 'Your group', 'kicks, deaths and each player', mpCasts(R) + mpPlayers(R, fx, waiting)) + mpChap('mptC5', 'Know this dungeon', 'for your next key', mpKnowHtml(R, true));
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
      if (s.trash - f.trash >= 15) L.push({ c: 'trash', ps: yp.filter((p) => !p.boss).map((p) => R.pulls.indexOf(p)), s: s.trash - f.trash, t: where, d: 'You took ' + plural(s.nt, 'pull') + ' there' + (s.ntc ? ', ' + s.ntc + ' chained' : '') + '; the fast run took ' + f.nt + '. Your trash took ' + mpMM(s.trash) + ', theirs took ' + mpMM(f.trash) + '.', g: mpGdTags(R, F, yp.filter((p) => !p.boss), fp.filter((p) => !p.boss), true, yp, fp), nt: mpNextTrash(R, F, s, f, ST, fBy) });
      if (s.bossT - f.bossT >= 15) L.push({ c: 'boss', ps: yp.filter((p) => p.boss).map((p) => R.pulls.indexOf(p)), s: s.bossT - f.bossT, t: esc(s.boss), d: 'Your fight took ' + mpMM(s.bossT) + (s.tries > 1 ? ' over ' + s.tries + ' pulls' : '') + ', theirs took ' + mpMM(f.bossT) + '.', g: mpGdTags(R, F, yp.filter((p) => p.boss), fp.filter((p) => p.boss), false), nt: mpNextBoss(R, F, yp.filter((p) => p.boss), fp.filter((p) => p.boss)) }); }
    if (ck.between - FC.ck.between >= 15) L.push({ c: 'stand', s: ck.between - FC.ck.between, t: 'Standing between pulls', d: 'You stood still for ' + mpMM(ck.between) + ' between pulls, the fast run for ' + mpMM(FC.ck.between) + '.', ...((w) => ({ g: w.h, nt: w.nt }))(mpWaits(R, F)) });
    for (const f of mpFixes(R, C, true)) L.push(f);
    return L.filter((x) => x.s >= 15 || !x.s).sort((a, b) => b.s - a.s).slice(0, 6); })();
  // (a thin bar under the lead: the gap split into longer fighting, standing between pulls and deaths, each with its hover, a key under it and
  // no words inside (they'd be cut off on a phone). The three add up to the gap: the fighting is what's left after the other two)
  // (the quick read (Nov 2, the Design studio's quick-read.md, Flex: "theres almost too much information… its a lot of alot"): a row shows its
  // title, one Next time line (a death row: who died, plainly) and its time; the explanation and the tags open on a click (▸ turns ▾). Three rows,
  // then "Show N more". Nothing is gone: it's one click away)
  const fxGo = (f) => (f.ps && f.ps.length && R.units && R.units.length ? '<button type="button" class="linkbtn mpt-fxgo" data-mpps="' + f.ps.join(',') + '" data-mpt="' + esc(f.t.replace(/<[^>]+>/g, '')) + '" data-mpl="' + esc(esc(mpPNs(R, f.ps.map((k) => k + 1)))) + '">Show on the map ↑</button>' : ''); /* (the map-first round) */
  const fxRow = (f, i, fix) => { const nt = f.nt || (f.c === 'kick' && f.sp ? mpNextKick(R, f.sp) : '') || (f.c === 'death' ? '<p class="mpt-nt mpt-ntd">' + f.d + '</p>' : '');
    const more = (f.c === 'death' ? '' : '<p>' + f.d + '</p>') + (f.g || ''), badge = '<span class="mpt-fxn mpt-c-' + (f.c || 'none') + '">' + (i + 1) + '</span>';
    const right = '<span class="mpt-fxs">' + (f.s ? (fix ? '<b class="mpt-g">−' + mpMM(f.s) + '</b>' : '<b class="' + mpSz(f.s) + '">' + mpMM(f.s) + '</b>') + '<small>' + (f.plus || 'on the timer') + '</small>' : f.n ? '<b class="mpt-ab">' + f.n + '</b><small>went off</small>' : '<b class="mpt-m">' + f.ns + '</b>') + '</span>';
    return more ? '<details class="mpt-fxd"><summary class="mpt-fxr">' + badge + '<div><b class="mpt-fxt">' + f.t + '</b>' + fxGo(f) + nt + '</div>' + right + '</summary><div class="mpt-fxm">' + more + '</div></details>'
      : '<div class="mpt-fxr">' + badge + '<div><b class="mpt-fxt mpt-fxt0">' + f.t + '</b>' + fxGo(f) + nt + '</div>' + right + '</div>'; };
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
  const bh = {}, behindH = mpBehind(R, C, F, FC, fx, waiting, bh); /* (the map-first round: the map is chapter 2, with the timeline lanes under it) */
  return mpChap('mptC1', 'The key', '', ban + tiles) + mpJumpBar(R, true) + mpChap('mptCM', 'Your key on the map', 'every pull, and what went wrong where', mpRPFold(R, F, mpRouteHtml(R, F, waiting) + mpPulls(R, C, F, FC), mpMapHtml(R, F, bh.tl))) +
    mpChap('mptC2', 'Fix these first', F ? 'against a typical fast run' : '', fixes + behindH, behind) + mpChap('mptC4', 'Your group', 'kicks, deaths and each player', mpCasts(R) + mpPlayers(R, fx, waiting)) + mpChap('mptC5', 'Know this dungeon', 'for your next key', mpKnowHtml(R, true));
}
// (five chapters (Nov 2, the Design studio's chapters.md, Flex: "the page is lacking depth. Maybe find a way to separate the information so its
// more readable in sections", then "does it have depth like my other pages do?"): each one the site's own panel, the finish Debriefing's panels
// have, opening with a small grey label and a sub-line; a 6 px square only when the chapter has a verdict (behind red, ahead green))
const mpChap = (id, k, sub, body, dot) => (body ? '<div class="mpt-chap" role="region" aria-label="' + k + '" id="' + id + '"><p class="mpt-chk' + (dot ? ' mpt-chk-' + dot : '') + '">' + k + (sub ? '<span>' + sub + '</span>' : '') + '</p>' + body + '</div>' : ''); /* (a div: the site's type scale resizes text in a section inside a section) */
// (the jump bar between chapter 1 and 2 (the Design studio's round 4, by chapter since Nov 2): it sticks under the site's tab bar while you scroll)
// (chapter 3 in the quick read: one sentence, how many packs and pulls and where you reached 100%, then the route and the pulls a click away)
function mpRPFold(R, F, inner, map) {
  const rt = R.route && R.route.ok ? R.route : null; let reach = '';
  if (rt) { let t = 0; for (let k = 0; k < rt.pulls.length; k++) { t += rt.pulls[k].add; if (t >= rt.full * 0.9995) { const nx = R.pulls.slice(k + 1).find((p) => p.boss), pv = R.pulls.slice(0, k).reverse().find((p) => p.boss); /* (by boss, not pull number: the Pulls list numbers packs) */
        reach = ' You reached 100% ' + (R.pulls[k].boss ? 'at ' + esc(R.pulls[k].boss) : nx ? 'before ' + esc(nx.boss) : pv ? 'after ' + esc(pv.boss) : 'in pack ' + R.pulls[k].n) + '.'; break; } } }
  const line = 'You took <b>' + mpPacks(R) + '</b>' + (F ? '; the fast run took <b>' + mpPacks(F, true) + '</b>.' : '.') + reach;
  return '<p class="mpt-rpl">' + line + '</p>' + (map || '') + '<details class="mpt-sub" id="mptRP"><summary>Every pull in detail</summary>' + inner + '</details>'; /* (the map-first round: the forces strips, route lines and Pulls fold here) */
}
const mpJumpBar = (R, tl) => '<nav class="mpt-jb" aria-label="Jump to">' + [['mptCM', 'Map'], tl ? ['mptC2', 'Fix these first'] : null, ['mptC4', 'Your group'], MP_KNOW[mpLc(R.run.dungeon)] ? ['mptC5', 'Dungeon'] : null].filter(Boolean).map(([id, l]) => '<button type="button" data-mptj="' + id + '">' + l + '</button>').join('') + '</nav>';
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-mptj]'); if (!b) return; e.preventDefault(); const s = document.getElementById(b.dataset.mptj); if (!s) return;
  if (s.tagName === 'DETAILS') s.open = true; /* (a folded section opens first) */
  else { const f = s.querySelectorAll(':scope > details.mpt-fold'); if (f.length === 1 && s.children.length === 2) f[0].open = true; } /* (a chapter that's one folded part, Know this dungeon, opens it) */
  s.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
// (what "a typical fast run" is, for the line under the timeline and the hovers: the middle of the 20 fastest, or of as many as there are)
const mpTypical = (R, fx) => { const n = (fx && fx.list && fx.list.n) || 0; return 'the middle of this season\'s ' + (n >= 20 || !n ? '20' : n) + ' fastest timed +' + R.run.level + ' ' + esc(R.run.dungeon) + ' runs' + (n && n < 20 ? ' (only ' + n + ' so far)' : ''); };
const mpPullName = (R, k) => { const p = R.pulls[k]; return p ? (p.boss ? p.boss : 'pull ' + mpNo(R, p.n)) : ''; };
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
function mpBehind(R, C, F, FC, fx, waiting, out) {
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
    return blocks.map((b) => '<i class="mpt-blk' + (b.p.boss ? ' mpt-bo' : '') + '" data-run="' + (fr ? 'fast' : 'you') + '" data-pi="' + RR.pulls.indexOf(b.p) + '" style="left:' + X(b.x) + ';width:' + W(b.w) + '"' + mpT1(b.p.boss ? '<b>' + pre + esc(b.p.boss) + '</b>: ' + mpMM(b.p.dur) + (b.p.kill === false ? ', not killed.' : '.') : '<b>' + (fr ? pre + 'pull ' : 'Pull ') + mpNo(RR, b.p.n) + '</b>: ' + mpMM(b.p.dur) + ' of trash.') + '></i>').join('') +
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
    return '<div class="mpt-wyr"><span class="mpt-sn">' + esc(s.name) + '<small>' + (() => { const k = mpInSt(R, s).filter((p) => !p.boss).map((p) => mpNo(R, p.n)); return !k.length ? '' : k.length === 1 ? 'pull ' + k[0] : 'pulls ' + k[0] + '–' + k[k.length - 1]; })() + '</small></span>' +
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
  if (out) out.tl = timeline; /* (the lanes and their key moved under the map (the map-first round)) */
  return mpSec('Where you fell behind', line, (out ? '' : timeline) + '<details class="mpt-sub" id="mptStr"><summary>Stretch by stretch</summary>' + why + (sum ? '<p class="mpt-why">' + sum + '</p>' : '') + src + '</details>', 'mptTl',
    { tip: F || waiting ? '<b>How to read it</b><br>Your key and a typical fast run on the same timer, left to right. Where your line runs longer, you were slower. Hover any piece for what it is.' : '<b>How to read it</b><br>Your key on its timer, left to right. Hover any piece for what it is.' });
}
// (one Pulls list (Nov 1, the Design studio's round 4, Flex: "Yes, build both"): pull by pull, the route's side by side and the deaths in one
// list, grouped by stretch (up to each boss kill), with the fast run's pulls in that stretch beside it. A row opens for its deaths in order, what
// went off with a kick ready, Lust and big cooldowns. Enemies something summoned (a Magma Totem, a player's guardian) aren't counted in what you
// pulled. Each row is #mpt-pull-N for the map's dots, and MP.pinfo has each pull's card)
function mpGroups(P) { const out = []; let cur = { from: '', to: '', ps: [] }; for (const p of P) { cur.ps.push(p); if (p.boss && p.kill !== false) { cur.to = p.boss; out.push(cur); cur = { from: p.boss, to: '', ps: [] }; } } if (cur.ps.length) out.push(cur); return out; }
const mpWhat = (R2, p, k) => { if (p.boss) return esc(p.boss); const mobs = mpMobs(R2, p), cnt = mobs.reduce((a, m) => a + m[1], 0);
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
    const ci = mpChainOf(R, i), first = ci[0] === i, cDur = ci.reduce((a, k) => a + R.pulls[k].dur, 0), cName = ci.length > 1 ? 'pulls ' + mpNo(R, R.pulls[ci[0]].n) + '–' + mpNo(R, R.pulls[ci[ci.length - 1]].n) : 'this pull';
    /* (a player who never pressed a big cooldown all key is said once, in Players, not on every pull) */
    const cdAct = (R.cdWho || []).filter((nm) => ((R.cds || {})[nm] || []).length);
    const lu = (R.lust || []).filter((l) => l.pull === i), cdu = Object.entries(R.cds || {}).filter(([nm]) => cdAct.includes(nm)).map(([nm, l]) => [nm, l.filter((x) => ci.includes(x.pull))]).filter(([, l]) => l.length), cdn = cdAct.length;
    const cdList = cdu.length ? cdu.map(([nm, l]) => '<b>' + esc(nm) + '</b>: ' + esc([...new Set(l.map((x) => x.spell))].join(', '))).join('<br>') : 'Nobody pressed a big cooldown.';
    /* (this pull's own presses, from 3 s before it to 1 s after (the studio's fix, Nov 2: pull 3 showed pull 4's Aura Mastery, Lay on Hands and Blessing
       of Sacrifice, the chain's whole list); the N of M flag above still judges the chain) */
    const own = Object.entries(R.cds || {}).filter(([nm]) => cdAct.includes(nm)).map(([nm, l]) => [nm, l.filter((x) => x.t >= p.s - 3 && x.t <= p.e + 1)]).filter(([, l]) => l.length), missO = cdAct.filter((nm) => !own.some(([x]) => x === nm));
    const ownList = own.length ? own.map(([nm, l]) => '<b>' + esc(nm) + '</b>: ' + esc([...new Set(l.map((x) => x.spell))].join(', '))).join('<br>') : 'Nobody pressed a big cooldown in this pull.';
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
      (cdn ? '<p class="mpt-cdl" tabindex="0"' + mpT1('<b>Big cooldowns in this pull</b><br>' + ownList) + '>' + (!missO.length ? 'Everyone pressed a big cooldown.' : !own.length ? (first || !cdu.length ? 'Nobody pressed a big cooldown.' : 'None: chained onto the pull before, where they went out.') : missO.map((nm) => mpWho(R, nm)).join(', ').replace(/, ([^,]*)$/, ' and $1') + ' didn\'t press one here.') + '</p>' : '');
    const open = !opened && wipe; if (open) opened = true;
    const what = p.boss ? (p.kill === false ? '<span class="mpt-bad">Not killed</span>' : '<span class="mpt-g">Killed</span>') : mpWhat(R, p);
    const add = rt ? rt.pulls[i].add : 0, forces = rt && add ? '+' + fmt(100 * add / rt.full) + ' <small>' + fmt(100 * tot[i] / rt.full) + '</small>' : rt ? '<span class="mpt-m">+0%</span>' : ''; /* (+0% grey, never a blank cell) */
    MP.pinfo[p.n] = { t: p.boss ? esc(p.boss) : 'Pull ' + mpNo(R, p.n), at: mpMM(tv(p.s)) + ' to ' + mpMM(tv(p.e)), len: mpMM(p.dur), add: rt && add ? '+' + fmt(100 * add / rt.full) : '', tot: rt ? fmt(100 * tot[i] / rt.full) : '',
      mobs: p.boss ? (p.kill === false ? 'Boss · not killed' : 'Boss · killed') : mpWhat(R, p, 4), tags: tags.filter((x) => !/mpt-tcd/.test(x)).map((x) => x.replace(/ data-tt="[^"]*"/, '')).join(''), dd: dd.slice(0, 3).map((d) => esc(d.who) + ' died to ' + esc(d.to)) };
    /* (group DPS, pull by pull (Flex: "group dps pull by pull would be helpful as well"): the value and a bar scaled to the key's best pull,
       trash blue and bosses gold. No red or green: the size of the pull drives it) */
    const gd = mpGd(p), nE = mpCnt(R, p);
    const gdc = gd ? '<span class="mpt-pgd' + (p.boss ? ' mpt-bo' : '') + '" tabindex="0"' + mpT1('<b>Group DPS: ' + mpGF(gd) + '</b><br>Your whole group\'s damage a second in this ' + (p.boss ? 'boss fight' : 'pull') + (nE > 1 ? ', with ' + nE + ' enemies' : '') + '.' + (GB.best ? ' Your best trash pull: ' + mpGF(GB.v) + ' (pull ' + mpNo(R, GB.best.n) + ').' : '')) + '><b>' + mpGF(gd) + '</b><i><u style="width:' + Math.min(100, 100 * gd / GB.max).toFixed(0) + '%"></u></i></span>' : '<span class="mpt-pgd"></span>';
    const head = '<span class="mpt-pn">' + (p.boss ? '★ ' + esc(p.boss) : 'Pull ' + mpNo(R, p.n)) + '</span><span class="mpt-pm">' + what + '</span><span class="mpt-pt">' + mpMM(p.dur) + '</span><span class="mpt-pf">' + forces + '</span>' + gdc + '<span class="mpt-pc">' + (shown.join('') || '<span class="mpt-m">clean</span>') + '</span>';
    /* (a pack pulled while the last one was still dying: a thin line joins the two rows (the studio's audit of the pull split)) */
    const chn = !first ? '<i class="mpt-chm" tabindex="0"' + mpT1('Chained: pulled while the last one was still dying.') + '></i>' : '';
    return '<details id="mpt-pull-' + p.n + '" data-n="' + p.n + '" class="mpt-pr' + (p.boss ? ' mpt-boss' : '') + (!first ? ' mpt-chn' : '') + '"' + (open ? ' open' : '') + (body ? '' : ' data-empty') + '><summary>' + chn + head + '</summary>' + (body ? '<div class="mpt-pd">' + body + '</div>' : '') + '</details>';
  };
  const G = mpGroups(R.pulls), tdN = R.pulls.reduce((a, p) => a + p.deaths.length, 0);
  const groups = G.map((g) => { const s = sBy.get(g.to), f = fsBy.get(g.to), fg = FG.get(g.to);
    const head = '<div class="mpt-sgh"><b>' + esc((g.from || 'Start') + ' → ' + (g.to || 'the end')) + '</b><span>' + [s ? mpMM(s.t) : '', f ? 'fast run ' + mpMM(f.t) : '', s && f ? '<b class="' + (s.t - f.t > 60 ? 'mpt-bad' : '') + '">' + (s.t >= f.t ? mpMM(s.t - f.t) + ' slower' : mpMM(f.t - s.t) + ' faster') + '</b>' : ''].filter(Boolean).join(' · ') + '</span></div>';
    const fast = fg ? '<div class="mpt-fp"><p class="mpt-k">Fast run here</p>' + fg.ps.map((q) => { const k = F.pulls.indexOf(q), a = frt ? frt.pulls[k].add : 0; const g2 = mpGd(q); return '<div class="mpt-fpr' + (q.boss ? ' mpt-bo' : '') + '"><span>' + (q.boss ? esc(q.boss) + (a ? ', with trash' : '') : mpWhat(F, q, 2)) + '</span>' +
      (g2 ? '<em class="mpt-fgd' + (q.boss ? ' mpt-bo' : '') + '" tabindex="0"' + mpT1('<b>Fast run\'s group DPS: ' + mpGF(g2) + '</b><br>Its whole group\'s damage a second in this ' + (q.boss ? 'boss fight' : 'pull') + '.') + '>' + mpGF(g2) + '<i><u style="width:' + Math.min(100, 100 * g2 / GB.max).toFixed(0) + '%"></u></i></em>' : '') + '<b>' + (a ? '+' + fmt(100 * a / frt.full) : '') + '</b></div>'; }).join('') + '</div>' : '';
    return '<div class="mpt-sg">' + head + '<div class="mpt-sgb' + (fast ? '' : ' mpt-sgb1') + '"><div>' + g.ps.map(row).join('') + '</div>' + fast + '</div></div>'; }).join('');
  const wipes = R.pulls.filter((p) => mpWipe(p, n)).map((p) => esc(mpPN(R, p.n)));
  return mpSec('Pulls', 'You took <b>' + mpPacks(R) + '</b>' + (wipes.length ? ' and wiped on <b class="mpt-bad">' + wipes.join(' and ') + '</b>.' : tdN ? ', with <b class="mpt-bad">' + plural(tdN, 'death') + '</b>.' : ' with no deaths.'),
    '<div class="mpt-plh' + (F ? '' : ' mpt-plh1') + '"><span>Pull</span><span>What you pulled</span><span>Time</span><span>' + (rt ? 'Forces' : '') + '</span><span>Group DPS</span><span>What happened</span></div>' + groups +
    '<p class="mpt-sm">Click a pull for who died, what went off with a kick ready, and when Lust went out. Summoned enemies aren\'t counted.</p>', 'mptPulls', { fold: true });
}
// (casts and kicks: what went off with a kick ready, by spell and pull, and who stopped casts)
function mpCasts(R) {
  const thru = new Map(); for (const p of R.pulls) for (const t of p.through) { const k = t.spell + '|' + t.mob, o = thru.get(k) || { spell: t.spell, mob: t.mob, n: 0, pulls: new Map() }; o.n++; o.pulls.set(p.n, (o.pulls.get(p.n) || 0) + 1); thru.set(k, o); }
  const TH = [...thru.values()].sort((a, b) => b.n - a.n), thN = TH.reduce((a, t) => a + t.n, 0);
  const who = R.people.filter((p) => p.kicks + p.stops > 0).sort((a, b) => b.kicks + b.stops - a.kicks - a.stops), mx = Math.max(1, ...who.map((p) => p.kicks + p.stops));
  const left = '<div><p class="mpt-k">Went off with a kick ready</p>' + (TH.length ? TH.map((t) => '<div class="mpt-kr"><span><b class="mpt-ab">' + esc(t.spell) + '</b><small>' + esc(t.mob) + '</small></span><span class="mpt-m">' + [...t.pulls].map(([n, c]) => esc(mpPN(R, n)) + (c > 1 ? ' ×' + c : '')).join(', ') + '</span><b>' + t.n + '×</b></div>').join('') : '<p class="mpt-none">Nothing on the must-kick list went off while someone\'s kick was ready.</p>') +
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
// (crowd control a player put on an enemy, by the aura it leaves (the key reader's own list); knockbacks and grips by their cast (Nov 2, the map's
// Kicks & CC layer))
const MP_KNOCK = new Set(['blast wave', 'gorefiend\'s grasp', 'death grip', 'mass grip', 'supernova', 'gravity lapse', 'typhoon', 'thunderstorm', 'ursol\'s vortex', 'wing buffet', 'tail swipe']);
const MP_CC = new Set(['leg sweep', 'shadowfury', 'static charge', 'hammer of justice', 'kidney shot', 'cheap shot', 'storm bolt', 'shockwave', 'intimidating shout', 'war stomp', 'chaos nova', 'fel eruption', 'mighty bash', 'maim',
  'asphyxiate', 'blinding light', 'incapacitating roar', 'paralysis', 'binding shot', 'intimidation', 'psychic scream', 'psychic horror', 'silence', 'solar beam', 'sigil of silence', 'sigil of misery', 'strangulate', 'dragon\'s breath',
  'ring of frost', 'mortal coil', 'howl of terror', 'fear', 'hex', 'polymorph', 'repentance', 'holy word: chastise', 'blinding sleet', 'sleep walk', 'quaking palm', 'gouge', 'blind', 'sap', 'imprison', 'freezing trap', 'scatter shot',
  'disorienting roar', 'deep breath', 'terror of the skies', 'haymaker', 'bull rush', 'axe toss', 'cyclone', 'shackle undead', 'banish', 'capacitor totem', 'lightning lasso', 'thunderous paws', 'dead of winter', 'remorseless winter',
  'frost nova', 'abomination limb', 'chains of ice', 'piercing howl', 'entangling roots', 'mass entanglement', 'earthbind', 'landslide']);
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
  const lastPos = new Map(), deathPos = [], castPos = [], ksp = new Set(); for (const p of P) for (const x of (p.through || []).concat(p.minor || [])) ksp.add(mpLc(x.spell)); /* (the map chapter: ☠ and !N spots) */
  const kickEv = [], ccEv = [], npcPos = new Map(), uq = (v) => String(v || '').replace(/^"|"$/g, ''); /* (the Kicks & CC layer) */
  const hitsOf = new Map(), maxOf = new Map(), defUse = new Map(), avSet = new Set(), avHits = [], avLast = new Map(), DEF = new Map(), roleOf = new Map((R.people || []).map((x) => [x.name, x.role])); /* (how they died, and avoidable hits pinned: the map extras) */
  for (const p of P) for (const a of p.avoid || []) avSet.add(mpLc(a.spell)); for (const l of Object.values(E.DEFENSIVES || {})) for (const d of l) DEF.set(+d[1], d);
  const U = new Map(), uOf = (g, n) => { let u = U.get(g); if (!u) U.set(g, u = { g, n: '', fl: 0, at: null, hp: 0, hit: null, died: null, sum: false }); if (n && !u.n) u.n = String(n).replace(/^"|"$/g, ''); return u; }; /* (each enemy, for the map of pulls (Nov 2)) */
  while (i < text.length) {
    let j = text.indexOf('\n', i); if (j < 0) j = text.length; const line = text.substring(i, j); i = j + 1;
    const ts = E.parseTs(line); if (!ts) continue; if (t0 == null) t0 = ts.ms; const t = (ts.ms - t0) / 1000;
    const c = line.indexOf(',', ts.body); if (c < 0) continue; const ev = line.substring(ts.body, c);
    if (ev === 'UNIT_DIED') { if (!T) continue; const f = E.split(line, c + 1), g = f[4]; if (String(g).startsWith('Player-')) { const lp = lastPos.get(g); if (lp && f[8] !== '1') { const who = short(f[5]), per = (R.people || []).find((x) => x.name === who), sid = per ? mpSpecId(per.spec, per.cls) : 0, us = defUse.get(g) || new Map();
        const last = (id) => { const l = (us.get(id) || []).filter((x) => x <= t); return l.length ? l[l.length - 1] : null; }, defs = per ? ((E.DEFENSIVES || {})[per.cls] || []).filter((d) => !d[3] || d[3].includes(sid)) : [];
        const ready = defs.filter((d) => { const u = last(+d[1]); return u == null || t - u >= d[2]; }).map((d) => d[0]), used = defs.map((d) => [d[0], last(+d[1])]).filter(([, u]) => u != null && t - u < 30).map(([n, u]) => [n, Math.round(t - u)]), hs = last('hs');
        deathPos.push({ who, t, x: lp[0], y: lp[1], ui: lp[2], hits: (hitsOf.get(g) || []).filter((h) => t - h[0] <= 10).slice(-5).map((h) => ({ ago: t - h[0], sp: h[1], from: h[2], amt: h[3], pct: h[4] ? h[3] / h[4] : 0 })), ready, used, hs: hs != null && t - hs < 120 ? Math.round(t - hs) : null }); } continue; } if (!NPC.test(g || '') || f[8] === '1') continue; { const u = U.get(g); if (u && u.died == null) u.died = t; } if (seen.has(g)) continue; seen.add(g); const v = T.n[+g.split('-')[5]]; if (v) add[pullAt(t)] += v; continue; }
    if (ev === 'SPELL_INTERRUPT') { if (!T) continue; const f = E.split(line, c + 1); if (/^(Player|Pet)-/.test(f[0] || '') && NPC.test(f[4] || '')) { const p = npcPos.get(f[4]); const cp = lastPos.get(f[0]); kickEv.push({ t, src: f[0], who: short(uq(f[1])), tg: uq(f[5]), g: f[4], cut: uq(f[12]), x: p && p[0], y: p && p[1], ui: p && p[2], cx: cp && cp[0], cy: cp && cp[1], cui: cp && cp[2] }); } continue; }
    if (ev === 'SPELL_SUMMON') { const f = E.split(line, c + 1); if (f[5]) summoned.add(f[5]); if (NPC.test(f[4] || '')) uOf(f[4]).sum = true; continue; } /* (summoned: not counted in "what you pulled" (round 4)) */
    if (ev === 'CHALLENGE_MODE_END') { const f = E.split(line, c + 1); R.rateAfter = num(f[5]) || null; continue; } /* (the player's rating after the key, as WoW wrote it (Nov 2)) */
    if (ev === 'SPELL_AURA_APPLIED') { if (line.indexOf('BUFF', c) < 0) continue; const f = E.split(line, c + 1); if (f[11] === 'BUFF' && String(f[4]).startsWith('Player-') && MP_LUST.test(f[9])) lustT.push([t, f[9]]);
      else if (T && f[11] === 'DEBUFF' && /^(Player|Pet)-/.test(f[0] || '') && NPC.test(f[4] || '') && MP_CC.has(mpLc(uq(f[9])))) { const p = npcPos.get(f[4]); const cp = lastPos.get(f[0]); ccEv.push({ t, src: f[0], who: short(uq(f[1])), sp: uq(f[9]), tg: uq(f[5]), g: f[4], x: p && p[0], y: p && p[1], ui: p && p[2], cx: cp && cp[0], cy: cp && cp[1], cui: cp && cp[2] }); }
      continue; }
    const dmg = ev === 'SPELL_DAMAGE' || ev === 'SPELL_PERIODIC_DAMAGE' || ev === 'SWING_DAMAGE' || ev === 'RANGE_DAMAGE';
    if (!dmg && ev !== 'SPELL_CAST_SUCCESS') continue;
    const f = E.split(line, c + 1);
    if (T && ev === 'SPELL_CAST_SUCCESS' && /^(Player|Pet)-/.test(f[0] || '') && MP_KNOCK.has(mpLc(uq(f[9])))) { const g = NPC.test(f[4] || '') ? f[4] : null, p = g ? npcPos.get(g) : null; const cp = lastPos.get(f[0]); ccEv.push({ t, src: f[0], who: short(uq(f[1])), sp: uq(f[9]), tg: g ? uq(f[5]) : '', g, x: p && p[0], y: p && p[1], ui: p && p[2], cx: cp && cp[0], cy: cp && cp[1], cui: cp && cp[2] }); }
    if (ev === 'SPELL_CAST_SUCCESS' && String(f[0]).startsWith('Player-')) { const id = +f[8]; if (DEF.has(id) || /healthstone/i.test(f[9])) { const m = defUse.get(f[0]) || new Map(), k2 = DEF.has(id) ? id : 'hs'; m.set(k2, (m.get(k2) || []).concat(t)); defUse.set(f[0], m); } }
    if (ev === 'SPELL_CAST_SUCCESS' && String(f[0]).startsWith('Player-')) { const nm = short(f[1]), s = cdOf.get(nm); if (s && s.has(mpLc(f[9]))) { const l = cast[nm] = cast[nm] || []; if (!l.some((x) => x[1] === f[9] && t - x[0] < 5)) l.push([t, f[9]]); } } /* (one press, even if the log writes it twice) */
    const adv = ev === 'SWING_DAMAGE' ? 8 : 11; if (f.length < adv + ADV) continue;
    if (dmg && String(f[4]).startsWith('Player-') && !String(f[0]).startsWith('Player-')) { const sp = ev === 'SWING_DAMAGE' ? 'Melee' : String(f[9] || '').replace(/^"|"$/g, ''), amt = num(f[adv + ADV]), l = hitsOf.get(f[4]) || [];
      l.push([t, sp, String(f[1] || '').replace(/^"|"$/g, ''), amt, f[adv] === f[4] ? num(f[adv + 3]) : maxOf.get(f[4]) || 0]); /* (a swing's block is the attacker's: the player's health from their own) */ if (l.length > 8) l.shift(); hitsOf.set(f[4], l);
      /* (an avoidable hit's spot: the hit player's own spot as it landed; a beam ticking every second is one hit until they're out of it for 1.6 s, and tanks aren't counted, as on the page) */
      if (T && avSet.has(mpLc(sp)) && roleOf.get(short(f[5])) !== 'tank') { const k2 = f[4] + '|' + mpLc(sp), lt = avLast.get(k2); avLast.set(k2, t); if (!(lt > t - 1.6)) { let x = 0, y = 0, ui = 0; if (f[adv] === f[4]) { x = +f[adv + 14]; y = +f[adv + 15]; ui = +f[adv + 16] || 0; } else { const lp = lastPos.get(f[4]); if (lp && t - lp[3] <= 2) [x, y, ui] = lp; }
        if (x || y) avHits.push({ t, who: short(f[5]), sp, x, y, ui }); } } }
    if (dmg && String(f[0]).startsWith('Player-') && NPC.test(f[4] || '')) { const u = uOf(f[4], f[5]); u.fl |= parseInt(f[6], 16) || 0; if (u.hit == null) u.hit = t; }
    if (T) { const ig = f[adv];
      if (String(ig).startsWith('Player-')) { const x = +f[adv + 14], y = +f[adv + 15], mh = num(f[adv + 3]); if (x || y) lastPos.set(ig, [x, y, +f[adv + 16] || 0, t]); if (mh) maxOf.set(ig, mh); }
      else if (ev === 'SPELL_CAST_SUCCESS' && ig === f[0] && NPC.test(ig || '') && ksp.has(mpLc(f[9]))) { const x = +f[adv + 14], y = +f[adv + 15]; if (x || y) castPos.push({ t, sp: mpLc(f[9]), x, y, ui: +f[adv + 16] || 0 }); }
      if (NPC.test(f[adv] || '')) { { const x = +f[adv + 14], y = +f[adv + 15]; if (x || y) npcPos.set(f[adv], [x, y, +f[adv + 16] || 0]); } const u = uOf(f[adv]); if (!u.at) { const x = +f[adv + 14], y = +f[adv + 15]; if ((x || y) && x === x) { u.at = [x, y, +f[adv + 16] || 0]; u.hp = +f[adv + 3] || 0; } } } }
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
  { const real = new Set(); for (const u of U.values()) if (u.n && u.hit != null && (u.fl & 0x40) && !(u.fl & 0x3000) && !u.sum) real.add(u.n); R.realNames = real.size ? real : null; } /* (the studio's pull-accuracy fix, Nov 2) */
  if (!T) { R.route = null; return; }
  const med = (a) => { const s = a.slice().sort((p, q) => p - q); return s[s.length >> 1]; };
  const out = P.map((p, k) => { const q = pts[k], cn = {}; for (const u of q.u) cn[u] = (cn[u] || 0) + 1; const top = Object.entries(cn).sort((a, b) => b[1] - a[1])[0]; if (!top) return { n: p.n, add: add[k], ui: null };
    const u = +top[0], xs = q.x.filter((x, m) => q.u[m] === u), ys = q.y.filter((x, m) => q.u[m] === u); return { n: p.n, add: add[k], ui: u, x: med(xs), y: med(ys) }; });
  const total = add.reduce((a, v) => a + v, 0), done = !!R.run.timeMs && !R.run.left;
  R.route = { full: T.full, zone: T.zone, floors: T.floors, pulls: out, total, ok: !done || total >= T.full * 0.99 };
  // (the map of pulls: real trash, as the pack-map research found it: hit by a player, hostile, not summoned, not a guardian or a pet (Raj'kess's
  // orbs), from this key's instance (the GUID's zone). Each one in the pull its death (else its first hit) falls in, or the nearest when it
  // fell between pulls. In a boss pull, enemies with 30% or more of the most health there are the boss)
  { const ok = (u) => u.hit != null && u.at && (u.fl & 0x40) && !(u.fl & 0x3000) && !u.sum && ui.has(u.at[2]), zc = {};
    for (const u of U.values()) if (ok(u)) { const z = u.g.split('-')[4]; zc[z] = (zc[z] || 0) + 1; }
    const zone = (Object.entries(zc).sort((a, b) => b[1] - a[1])[0] || [])[0], L = [];
    for (const u of U.values()) { if (!ok(u) || u.g.split('-')[4] !== zone) continue; const tt = u.died != null ? u.died : u.hit; let k = 0, best = 1e9;
      for (let m = 0; m < N; m++) { const d = tt < P[m].s ? P[m].s - tt : tt > P[m].e ? tt - P[m].e : 0; if (d < best) { best = d; k = m; } }
      L.push({ x: u.at[0], y: u.at[1], ui: u.at[2], k, hp: u.hp, t: tt }); }
    for (let m = 0; m < N; m++) if (P[m].boss) { const us = L.filter((u) => u.k === m), top = Math.max(0, ...us.map((u) => u.hp)); for (const u of us) if (top && u.hp >= top * 0.3) u.boss = true; }
    R.units = L; R.deathPos = deathPos; R.castPos = castPos; R.avHits = avHits; R.kickEv = kickEv; R.ccEv = ccEv; }
}
function mpRouteHtml(R, F, waiting) {
  const rt = R.route; if (!rt || !rt.pulls.length) return '';
  const fr = F && F.route && F.route.full === rt.full ? F.route : null, ok = rt.ok && (!fr || fr.ok);
  const pc = (v) => 100 * v / rt.full, fmt = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '') + '%';
  const cum = (rr, RR) => { let t = 0; return rr.pulls.map((q, i) => { t += q.add; const p = RR.pulls[i]; return { ...q, p, RR, boss: p.boss && p.kill !== false ? p.boss : null, tot: pc(t), wipe: !!mpWipe(p, Math.max(1, (RR.people || []).length)) }; }); };
  const Y = cum(rt, R), Fa = fr ? cum(fr, F) : null, yEnd = pc(rt.total), fEnd = fr ? pc(fr.total) : 0, done = !!R.run.timeMs && !R.run.left;
  const what = (q) => (q.p.boss ? esc(q.p.boss) + (q.p.kill === false ? ' (not killed)' : '') : mpMobs(q.RR || R, q.p).slice(0, 3).map((m) => (m[1] > 1 ? m[1] + ' ' : '') + esc(m[0])).join(', ') + (mpMobs(q.RR || R, q.p).length > 3 ? ' and ' + (mpMobs(q.RR || R, q.p).length - 3) + ' more' : ''));
  // four plain lines
  const lines = [];
  if (ok) {
    const cross = Y.findIndex((q) => q.tot >= 99.95);
    if (cross > 0 && pc(Y[cross].add) - (100 - Y[cross - 1].tot) > 2) lines.push('<b>You reached ' + fmt(Y[cross - 1].tot) + ' after ' + esc(mpPN(R, Y[cross - 1].p.n)) + '.</b> ' + esc(mpCap(mpPN(R, Y[cross].p.n))) + ' added ' + fmt(pc(Y[cross].add)) + ' when you needed ' + fmt(100 - Y[cross - 1].tot) + '.');
    else if (cross >= 0) lines.push('<b>' + esc(mpCap(mpPN(R, Y[cross].p.n))) + ' took you to 100%.</b>');
    else lines.push('<b>You reached ' + fmt(yEnd) + '</b> before the key ended.');
    if (Fa) { const segs = (L) => { const out = []; let from = '', acc = 0, k = 0; for (const q of L) { if (!q.p.boss) k++; acc += pc(q.add); if (q.boss) { out.push({ from, to: q.boss, f: acc, k }); from = q.boss; acc = 0; k = 0; } } return out; };
      const fs = new Map(segs(Fa).map((s) => [s.to, s])), pairs = segs(Y).map((s) => ({ s, f: fs.get(s.to) })).filter((x) => x.f && x.s.k + x.f.k > 0).sort((a, b) => Math.abs(b.s.k - b.f.k) - Math.abs(a.s.k - a.f.k) || Math.abs(b.s.f - b.f.f) - Math.abs(a.s.f - a.f.f));
      const pr = pairs[0]; if (pr && (pr.s.k !== pr.f.k || Math.abs(pr.s.f - pr.f.f) >= 5)) lines.push('<b>' + (pr.s.from ? 'Between ' + esc(pr.s.from) + ' and ' + esc(pr.s.to) : 'Before ' + esc(pr.s.to)) + ' you got ' + fmt(pr.s.f) + ' in ' + plural(pr.s.k, 'pull') + '.</b> The fast run got ' + fmt(pr.f.f) + ' in ' + plural(pr.f.k, 'pull') + '.'); }
    if (done) lines.push('<b>' + (yEnd > 100.5 ? 'You ended at ' + fmt(yEnd) + ' enemy forces.' : 'You ended right on 100% enemy forces.') + '</b>' + (Fa ? (fEnd > 100.5 ? ' The fast run ended at ' + fmt(fEnd) + '.' : ' The fast run ended right on 100%.') : ''));
    const big = Y.filter((q) => !q.p.boss).sort((a, b) => b.add - a.add)[0], fbig = Fa ? Fa.filter((q) => !q.p.boss).sort((a, b) => b.add - a.add)[0] : null;
    if (big) lines.push('<b>Your biggest pull was pull ' + mpNo(R, big.p.n) + ': ' + fmt(pc(big.add)) + ' in ' + mpMM(big.p.dur) + '.</b>' + (fbig ? ' The fast run\'s biggest was ' + fmt(pc(fbig.add)) + ' in ' + mpMM(fbig.p.dur) + '.' : ''));
  } else lines.push('The enemy counts for ' + esc(R.run.dungeon) + ' aren\'t complete yet, so this shows where you pulled, without how much each pull counted.');
  // two strips: each pull a piece as wide as what it counted, bosses a gold mark, past 100% striped red
  const SC = Math.max(106, yEnd + 2, fEnd + 2), X = (v) => (100 * v / SC).toFixed(2) + '%';
  // (each boss's name, and a short one (its first word) for when names would touch: mpLabelFit places them once the page is drawn)
  const strip = (L, cls, end) => { let prev = 0; const fr = cls === 'mpt-sf'; return '<div class="mpt-strip ' + cls + '">' + L.map((q) => { const w = q.tot - prev;
    let s = w > 0.05 ? '<i class="mpt-sp" style="left:' + X(prev) + ';width:' + X(w) + '"' + mpT1('<b>' + (fr ? 'Fast run, ' : '') + esc(mpCap(mpPN(fr ? F : R, q.p.n))) + '</b>: +' + fmt(w) + ' enemy forces, ' + fmt(q.tot) + ' total.<br><span class="sub">' + what(q) + '</span>') + '><b>' + (w >= 2.4 ? q.n : '') + '</b></i>' : '';
    if (q.boss) s += '<i class="mpt-sbm" style="left:' + X(q.tot) + '"' + mpT1('<b>' + esc(q.boss) + ' down</b> at ' + fmt(q.tot) + ' enemy forces' + (fr ? ' in the fast run.' : '.')) + '><em data-f="' + esc(q.boss) + '" data-s="' + esc(q.boss.replace(/^The /, '').split(/[ ,]/)[0]) + '">' + esc(q.boss) + '</em></i>';
    prev = q.tot; return s; }).join('') + (end > 100 ? '<u style="left:' + X(100) + ';width:' + X(end - 100) + '"' + mpT1('<b>Extra enemies past 100%</b>: ' + fmt(end - 100) + (fr ? ' the fast run didn\'t need to kill.' : ' you didn\'t need to kill.')) + '></u>' : '') + '<i class="mpt-s100" style="left:' + X(100) + '"></i></div>'; };
  const strips = ok ? '<h3 class="mpt-h3 mpt-h3a">How much each pull added toward 100% enemy forces' + mpInfo('<b>How to read it</b><br>Each piece is one pull. The wider it is, the more of the dungeon\'s enemies it cleared. 100% finishes the key. Hover a piece for its pull.') + '</h3><div class="mpt-fz"><div class="mpt-fzk">' + [0, 25, 50, 75].map((v) => '<span style="left:' + X(v) + '">' + v + '%</span>').join('') + '<span class="mpt-r100" style="left:' + X(100) + '">100%</span></div>' +
    '<div class="mpt-row"><span class="mpt-rll">You</span>' + strip(Y, 'mpt-sy', yEnd) + '<span class="mpt-end">' + fmt(yEnd) + '</span></div>' +
    (Fa ? '<div class="mpt-row"><span class="mpt-rll"' + mpT1('<b>A typical fast run</b>: the same one as in Where you fell behind.') + '>Fast run</span>' + strip(Fa, 'mpt-sf', fEnd) + '<span class="mpt-end">' + fmt(fEnd) + '</span></div>' : '<div class="mpt-row"><span class="mpt-rll">Fast run</span><span class="mpt-strip0">' + (waiting ? 'Finding a typical fast run…' : 'No public fast run at this level yet.') + '</span></div>') +
    '<div class="mpt-key"><span><i class="mpt-k1"></i>Your pulls (number inside)</span>' + (Fa ? '<span><i class="mpt-k4"></i>Fast run\'s packs</span>' : '') + '<span><i class="mpt-k2 mpt-kbar"></i>Boss</span><span><i class="mpt-kover"></i>Over 100%: extra you didn\'t need</span></div></div>' : '';
  const map = ''; /* (the map has its own chapter now (the map-first round): mpMapHtml) */
  /* (the side-by-side table moved into Pulls, beside each stretch (round 4)) */
  const credit = ok ? '<p class="mpt-ex">Enemy counts from <a href="https://raider.io" target="_blank" rel="noopener">Raider.IO</a>. The map shows where each pull\'s enemies were first seen, from your log.</p>' : '<p class="mpt-ex">The map shows where each pull\'s enemies were first seen, from your log.</p>';
  const say = '<ul class="mpt-say">' + lines.map((l) => '<li>' + l + '</li>').join('') + '</ul>';
  /* (one floor: its map beside the lines and strips, not alone in a row (the Design studio's audit)) */
  return mpSec('Your route', 'You took <b>' + mpPacks(R) + '</b>' + (F ? '; the fast run took <b>' + mpPacks(F, true) + '</b>.' : '.'), say + strips + map + credit, 'mptRoute');
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
document.addEventListener('click', (e) => { const d = e.target.closest && e.target.closest('.mpt-dot, .mpt-pgo'); if (!d) return; e.preventDefault(); e.stopPropagation();
  if (MP_PT === 'touch' && (!MP_CARD || MP_CARD.hidden || MP_CARD.dataset.n !== d.dataset.n)) { mpCardShow(d); return; } /* (a phone: the first tap shows the card) */
  mpCardHide(); const row = document.getElementById('mpt-pull-' + d.dataset.n); if (!row) return;
  for (let d = row.parentElement && row.parentElement.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true; /* (Pulls and the route fold start folded) */
  row.open = true; row.scrollIntoView({ behavior: 'smooth', block: 'center' }); row.classList.add('mpt-flash'); setTimeout(() => row.classList.remove('mpt-flash'), 1400); }, true);
document.addEventListener('keydown', (e) => { if (e.key !== 'Enter' || !e.target.classList || !(e.target.classList.contains('mpt-dot') || e.target.classList.contains('mpt-pgo'))) return; e.target.click(); });
window.addEventListener('scroll', () => { if (MP_CARD && !MP_CARD.hidden) mpCardHide(); }, { passive: true });

// (the map chapter (Nov 2, the Design studio's mapfirst.md; Flex: "condensing a lot of this info into the map and the maps being the main
// feature", then "after you check that you can have this get built"): your pulls drawn the way Mythic Dungeon Tools draws a route (mdt-view.md:
// each pull its colour and number, a padded outline per 50-yard group of its enemies, ★ for a boss), with the route between them, a ☠ where each
// player died, !N where the casters of missed kicks stood, and on each tag a red dot for a problem, ⚡ for Lust and ⏱ for a wait. Beside it the
// picked pull's card (what went wrong, each player's damage, the big cooldowns pressed in it) and the list; the timeline lanes under it.
// A click or tap picks a pull (its floor, its card); a hover only lights it up, so nothing moves under the mouse (Flex: "it glitches"))
const MP_PCOL = ['#7d9be8', '#7ee08f', '#f2c46b', '#c39bff', '#ff8f87', '#5fd3d0', '#e6a96b', '#b0e06f', '#e88fd0', '#9aa7ff', '#f0e07a', '#8fd3ff', '#ffb38f', '#a6e3a1'];
const mpHull = (P) => { if (P.length < 3) return P; const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1)); };
function mpMapHtml(R, F, tl) {
  const rt = R.route, strip = tl ? '<div class="mpt-mstrip">' + tl + '</div><p class="mpt-mhint">Your timeline: hover a block to find that pull on the map, or click it to pick it.</p>' : '';
  if (!rt || !rt.floors || !R.units || !R.units.length) return strip;
  const pc = (v) => 100 * v / rt.full, fmt = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '') + '%';
  const W = 1002, H = 668, runs = [['you', R], F && F.units && F.units.length && F.route && F.route.full === rt.full ? ['fast', F] : null].filter(Boolean);
  const px = (f, u) => [W * (f[5] - u.y) / (f[5] - f[4]), H * (f[3] - u.x) / (f[3] - f[2])];
  const floors = rt.floors.map((f, i) => ({ f, i, us: runs.map(([, RR]) => RR.units.filter((u) => u.ui === f[0])) })).filter((x) => x.us.some((l) => l.length)); if (!floors.length) return strip;
  for (const fl of floors) { const pts = fl.us.flat().map((u) => px(fl.f, u)); let x0 = Math.min(...pts.map((q) => q[0])) - 70, y0 = Math.min(...pts.map((q) => q[1])) - 70, w = Math.max(...pts.map((q) => q[0])) + 70 - x0, h = Math.max(...pts.map((q) => q[1])) + 70 - y0;
    if (w / h < 1.6) { const nw = h * 1.6; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / 1.6; y0 -= (nh - h) / 2; h = nh; }
    if (w <= W) x0 = Math.max(0, Math.min(W - w, x0)); if (h <= H) y0 = Math.max(0, Math.min(H - h, y0)); /* (inside the picture when it fits) */
    fl.box = [x0, y0, w, h]; }
  const fIdx = (ui) => floors.findIndex((x) => x.f[0] === ui);
  // (each pull: its enemies, the wait before it (10 s or more), Lust, the deaths and the casts that went off, each with its spot)
  const pullsOf = (RR) => { const ch = mpChains(RR), rr = RR.route, cp = RR.castPos || [];
    const near = (t) => { let k = 0, best = 1e9; RR.pulls.forEach((p, m) => { const d = t < p.s ? p.s - t : t > p.e ? t - p.e : 0; if (d < best) { best = d; k = m; } }); return k; };
    const dk = (RR.deathPos || []).map((d) => ({ ...d, k: near(d.t) }));
    const at = (x) => { let b = null; for (const c of cp) if (c.sp === mpLc(x.spell) && c.t >= x.t - 0.5 && c.t <= x.t + 10 && (!b || Math.abs(c.t - x.t) < Math.abs(b.t - x.t))) b = c; return b; };
    return RR.pulls.map((p, i) => { const prev = RR.pulls[i - 1], wait = prev ? p.s - prev.e : 0, us = RR.units.filter((u) => u.k === i);
      const c = new Map(); for (const u of us) { const j = fIdx(u.ui); if (j < 0) continue; const o = c.get(j) || { n: 0, t: 1e9 }; o.n++; o.t = Math.min(o.t, u.t != null ? u.t : 1e9); c.set(j, o); }
      let fl = -1, bo = null; for (const [j, o] of c) if (!bo || o.n > bo.n || (o.n === bo.n && o.t < bo.t)) { fl = j; bo = o; } /* (its floor: the one with most of its enemies, else the first killed's) */
      return { p, i, RR, c: MP_PCOL[i % MP_PCOL.length], chained: i > 0 && !p.boss && ch[i] === ch[i - 1], add: rr && rr.full === rt.full && rr.pulls[i] ? rr.pulls[i].add : 0, us, fl,
        wait: wait >= 10 ? wait : 0, lust: (RR.lust || []).some((l) => l.pull === i), dd: dk.filter((d) => d.k === i), kh: (p.through || []).map(at).filter(Boolean), km: (p.minor || []).map(at).filter(Boolean),
        av: (RR.avHits || []).filter((h) => near(h.t) === i), kx: (RR.kickEv || []).filter((e) => near(e.t) === i), cx: (RR.ccEv || []).filter((e) => near(e.t) === i), bad: !!(p.deaths.length || (p.through || []).length) }; }); };
  const en = (q) => { const n = q.us.filter((u) => !u.boss).length || (q.p.boss ? 0 : mpCnt(q.RR, q.p)); return q.p.boss && !q.add ? (n ? plural(n, 'add') : 'no adds') : plural(n, 'enemy').replace(/enemys$/, 'enemies'); };
  const nm = (q) => (q.p.boss ? esc(q.p.boss) + (q.add ? ', with trash' : '') : 'Pull ' + mpNo(q.RR, q.p.n));
  const badge = (q) => '<span class="mpt-nb" style="border-color:' + q.c + ';color:' + q.c + '">' + (q.p.boss ? '★' : mpNo(q.RR, q.p.n)) + '</span>';
  const tw = (k) => (k === 1 ? 'once' : k === 2 ? 'twice' : k + ' times');
  const kgrp = (L) => { const m = new Map(); for (const x of L || []) { const o = m.get(x.spell) || { n: 0, r: new Set() }; o.n++; for (const w of x.ready || []) o.r.add(w); m.set(x.spell, o); } return [...m]; };
  const tip = (q) => { const p = q.p, gd = mpGd(p), pr = p.deaths.slice(0, 2).map((d) => '☠ ' + esc(d.who) + ' died to ' + esc(d.to || 'unknown'));
    for (const [sp, o] of kgrp(p.through)) if (pr.length < 2) pr.push('! ' + esc(sp) + ' went off ' + tw(o.n) + ' with a kick ready');
    return '<b>' + nm(q) + '</b> · ' + mpMM(p.dur) + (q.add ? ' · +' + fmt(pc(q.add)) : '') + (gd ? ' · ' + mpGF(gd) + ' group DPS' : '') + pr.map((x) => '<br>' + x).join('') + (q.lust ? '<br>⚡ Lust' : '') + (q.wait ? '<br>⏱ waited ' + mpMM(q.wait) : '') +
      (q.chained ? '<br>Chained onto the pull before' : '') + '<br><span class="sub">Click for the details</span>'; };
  // (Know this dungeon's tips on the matching pulls: a boss's plan; trash tips only for named enemies that were in the pull. At most 3)
  const K = MP_KNOW[mpLc(R.run.dungeon)], tips = (q) => { if (!K) return []; if (q.p.boss) { const b = K.b.find(([n]) => mpLc(n) === mpLc(q.p.boss)); return b ? b[1].slice(0, 3) : []; }
    const names = mpMobs(q.RR, q.p).map((m) => mpLc(m[0])); return K.t.filter((x) => { const L = [...x.matchAll(/\*\*(.+?)\*\*/g)].map((m) => mpLc(m[1]).replace(/s$/, '')); return L.length && L.some((n) => names.some((m) => m.startsWith(n) || n.startsWith(m))); }).slice(0, 3); };
  const svg = (Q, fl) => { const k = fl.box[2] / W, f = fl.f, here = (u) => u.ui === f[0], cen = new Map(), shapes = [], marks = [], tags = [];
    for (const q of Q) { const us = q.us.filter(here); if (us.length) { /* (its shapes and tag only where its enemies stood; its marks wherever they landed) */
      /* (one outline per group of enemies standing within 50 yards of each other (the studio, Nov 2; Voidscar pull 1 has a 46-yard gap, its
         dragged Siphoids 88 or more): a pull stretched across the room is several shapes in one colour, its number on the biggest) */
      const gi = us.map((u, j) => j), root = (j) => (gi[j] === j ? j : (gi[j] = root(gi[j])));
      for (let a = 0; a < us.length; a++) for (let b = a + 1; b < us.length; b++) if (Math.hypot(us[a].x - us[b].x, us[a].y - us[b].y) <= 50) gi[root(a)] = root(b);
      const cl = new Map(); us.forEach((u, j) => { const r = root(j); if (!cl.has(r)) cl.set(r, []); cl.get(r).push(u); });
      const groups = [...cl.values()].sort((a, b) => b.length - a.length), big = groups[0].map((u) => px(f, u));
      cen.set(q.i, [big.reduce((a, v) => a + v[0], 0) / big.length, big.reduce((a, v) => a + v[1], 0) / big.length]);
      const shape = (g) => { const pts = g.map((u) => px(f, u)), hp = mpHull(pts), d = (hp.length === 1 ? [hp[0], hp[0]] : hp).map((v, j) => (j ? 'L' : 'M') + v[0].toFixed(1) + ' ' + v[1].toFixed(1)).join('') + (hp.length > 2 ? 'Z' : '');
        return '<path d="' + d + '" fill="' + q.c + '" fill-opacity=".22" stroke="' + q.c + '" stroke-opacity=".38" stroke-width="' + (30 * k).toFixed(1) + '" stroke-linejoin="round" stroke-linecap="round"/>' +
          pts.map((v, j) => '<circle cx="' + v[0].toFixed(1) + '" cy="' + v[1].toFixed(1) + '" r="' + ((g[j].boss ? 7 : 4.5) * k).toFixed(1) + '" fill="' + q.c + '" stroke="#0f1117" stroke-width="' + (1.2 * k).toFixed(1) + '"/>').join(''); };
      shapes.push('<g class="mpt-mpl" data-pi="' + q.i + '"' + mpT1(tip(q)) + '>' + groups.map(shape).join('') + '</g>');
      const top = big.reduce((a, v) => (v[1] < a[1] ? v : a)), wt = q.wait ? '⏱' + mpMM(q.wait) : '', ww = wt.length * 7 + 8;
      tags.push('<g class="mpt-mpl mpt-mtag" data-pi="' + q.i + '" data-oy="' + (26 * k).toFixed(1) + '"' + mpT1(tip(q)) + ' transform="translate(' + top[0].toFixed(1) + ',' + (top[1] - 26 * k).toFixed(1) + ') scale(' + k.toFixed(3) + ')"><rect x="-14" y="-12" width="28" height="22" rx="4" fill="#0f1117" stroke="' + q.c + '" stroke-width="2"/><text y="5" text-anchor="middle" fill="' + q.c + '">' + (q.p.boss ? '★' : mpNo(q.RR, q.p.n)) + '</text>' +
        (q.bad ? '<circle class="mk-bad" cx="13" cy="-11" r="5" fill="#e5534b" stroke="#0f1117" stroke-width="1.5"/>' : '') +
        (q.lust ? '<g class="mk-lust"><rect x="17" y="-11" width="20" height="20" rx="4" fill="#0f1117" stroke="#ffd166" stroke-width="1.5"/><text x="27" y="4" text-anchor="middle" fill="#ffd166" style="font-size:12px">⚡</text></g>' : '') +
        (wt ? '<g class="mk-wait"><rect x="' + (-17 - ww) + '" y="-10" width="' + ww + '" height="18" rx="4" fill="#0f1117" stroke="#95a0ab" stroke-width="1"/><text x="' + (-17 - ww / 2) + '" y="3.5" text-anchor="middle" fill="#c9cdd3" style="font-size:11px">' + wt + '</text></g>' : '') + '</g>');
      }
      // (☠ where each player died: their last spot before it; !N at the casters of the casts that went off, purple for the high ones, grey for the rest)
      for (const d of q.dd) if (here(d)) { const [x, y] = px(f, d); marks.push('<g class="mpt-mk mk-death" data-pi="' + q.i + '" data-who="' + esc(d.who) + '"' + mpT1('<b>' + esc(d.who) + ' died</b> here · ' + nm(q) + '<br><span class="sub">Click to see how</span>') + ' transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(' + k.toFixed(3) + ')"><circle r="10" fill="#0f1117" stroke="#e5534b" stroke-width="2"/><text y="4.5" text-anchor="middle" fill="#ff8f87" style="font-size:12px">☠</text></g>'); }
      for (const [L, n, cls, col] of [[q.kh, (q.p.through || []).length, 'mk-kick', '#c39bff'], [q.km, (q.p.minor || []).length, 'mk-kick mk-kick2', '#95a0ab']]) { const l = L.filter(here); if (!l.length) continue;
        const [x, y] = px(f, { x: l.reduce((a, c) => a + c.x, 0) / l.length, y: l.reduce((a, c) => a + c.y, 0) / l.length });
        marks.push('<g class="mpt-mk ' + cls + '" data-pi="' + q.i + '"' + mpT1('<b>' + plural(n, 'cast') + ' went off with a kick ready</b> · ' + nm(q)) + ' transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(' + k.toFixed(3) + ')"><circle r="11" fill="#0f1117" stroke="' + col + '" stroke-width="2"/><text y="4.5" text-anchor="middle" fill="' + col + '" style="font-size:12px">!' + n + '</text></g>'); }
      // (kicks: a green ring with the count on each kicked enemy, at its spot; CC: a ✦N tag in the player's colour at the middle of its targets, or at
      // the caster when the target has no spot yet. Marks of one pull closer than 20 px fan out in a small ring around their middle, kick rings first,
      // a thin line back to each one's true spot (the studio's follow-up: pull 7 had 2 rings and 4 tags inside 20 px))
      { const spot = (e) => (e.x != null && e.ui === f[0] ? e : e.cx != null && e.cui === f[0] ? { x: e.cx, y: e.cy } : null), kcc = [];
        const kname = (e) => (String(e.src).startsWith('Pet-') ? ((q.p.kicks || []).find((x) => Math.abs(x.t - e.t) < 0.5) || {}).who || e.who : e.who), kg = new Map();
        for (const e of q.kx) { if (!spot(e)) continue; const o = kg.get(e.g) || { l: [] }; o.l.push(e); kg.set(e.g, o); }
        for (const o of kg.values()) { const e0 = o.l[o.l.length - 1], [x, y] = px(f, spot(e0)), who = [...new Set(o.l.map(kname))], cut = [...new Set(o.l.map((e) => e.cut).filter(Boolean))];
          kcc.push({ x, y, who: who.join('|'), tip: '<b>' + esc(e0.tg) + '</b>: kicked ' + tw(o.l.length) + ' (' + who.map(esc).join(', ') + ')' + (cut.length ? ' · ' + cut.map(esc).join(', ') : ''),
            body: '<circle r="9" fill="#0f1117" fill-opacity=".55" stroke="#7ee08f" stroke-width="2.2"/><text y="4" text-anchor="middle" fill="#7ee08f" style="font-size:10px;font-weight:700">' + o.l.length + '</text>' }); }
        const cg = new Map(); for (const e of q.cx) { const o = cg.get(e.who + '|' + e.sp) || { w: e.who, sp: e.sp, l: [] }; o.l.push(e); cg.set(e.who + '|' + e.sp, o); }
        for (const o of cg.values()) { const at = o.l.map(spot).filter(Boolean); if (!at.length) continue; const [x, y] = px(f, { x: at.reduce((a, e) => a + e.x, 0) / at.length, y: at.reduce((a, e) => a + e.y, 0) / at.length });
          const tg = new Map(); for (const e of o.l) if (e.g && !tg.has(e.g)) tg.set(e.g, e.tg); const nm2 = new Map(); for (const n of tg.values()) nm2.set(n, (nm2.get(n) || 0) + 1);
          const cc = mpCC(((q.RR.people || []).find((x2) => x2.name === o.w) || {}).cls), n = tg.size || o.l.length, lab = '✦' + n, wd = lab.length * 7 + 10;
          kcc.push({ x, y, who: o.w, tip: '<b>' + esc(o.w) + '</b> · ' + esc(o.sp) + (tg.size ? ' → ' + plural(tg.size, 'enemy').replace(/enemys$/, 'enemies') + ' (' + [...nm2].map(([a, c]) => esc(a) + (c > 1 ? ' ×' + c : '')).join(', ') + ')' : ''),
            body: '<rect x="' + (-wd / 2) + '" y="-9" width="' + wd + '" height="18" rx="4" fill="#0f1117" stroke="' + cc + '" stroke-width="1.5"/><text y="4" text-anchor="middle" fill="' + cc + '" style="font-size:11px;font-weight:700">' + lab + '</text>' }); }
        const D = 20 * k, gi = kcc.map((m, j) => j), root = (j) => (gi[j] === j ? j : (gi[j] = root(gi[j])));
        for (let a = 0; a < kcc.length; a++) for (let b = a + 1; b < kcc.length; b++) if (Math.hypot(kcc[a].x - kcc[b].x, kcc[a].y - kcc[b].y) < D) gi[root(a)] = root(b);
        const grp2 = new Map(); kcc.forEach((m, j) => { const r = root(j); if (!grp2.has(r)) grp2.set(r, []); grp2.get(r).push(m); });
        const pos = []; for (const g of grp2.values()) { const mx = g.reduce((a, m) => a + m.x, 0) / g.length, my = g.reduce((a, m) => a + m.y, 0) / g.length, rr = Math.max(16, 9 * g.length) * k;
          g.forEach((m, j) => { const ang = -Math.PI / 2 + 2 * Math.PI * j / g.length; pos.push({ m, nx: g.length > 1 ? mx + rr * Math.cos(ang) : m.x, ny: g.length > 1 ? my + rr * Math.sin(ang) : m.y }); }); }
        /* (then any two still closer than a mark's width are pushed apart, so none sits on another) */
        for (let it = 0; it < 30; it++) { let mv = false; for (let a = 0; a < pos.length; a++) for (let b = a + 1; b < pos.length; b++) { let dx = pos[b].nx - pos[a].nx, dy = pos[b].ny - pos[a].ny, d = Math.hypot(dx, dy); const M = 24 * k; if (d >= M) continue; mv = true;
          if (d < 0.01) { dx = 1; dy = 0.3; d = Math.hypot(dx, dy); } const s2 = (M - d) / 2 / d; pos[a].nx -= dx * s2; pos[a].ny -= dy * s2; pos[b].nx += dx * s2; pos[b].ny += dy * s2; } if (!mv) break; }
        for (const { m, nx, ny } of pos) { const at2 = ' data-pi="' + q.i + '" data-who="' + esc(m.who) + '"';
          if (Math.hypot(nx - m.x, ny - m.y) > 3 * k) marks.push('<line class="mpt-mk mk-kcc"' + at2 + ' x1="' + m.x.toFixed(1) + '" y1="' + m.y.toFixed(1) + '" x2="' + nx.toFixed(1) + '" y2="' + ny.toFixed(1) + '" stroke="#fff" stroke-opacity=".4" stroke-width="' + k.toFixed(2) + '"/>');
          marks.push('<g class="mpt-mk mk-kcc"' + at2 + mpT1(m.tip) + ' transform="translate(' + nx.toFixed(1) + ',' + ny.toFixed(1) + ') scale(' + k.toFixed(3) + ')">' + m.body + '</g>'); } }
      // (avoidable hits where they landed: small amber marks, bunched within 5 yards, off until the chip turns them on)
      { const bs = []; for (const h of q.av.filter(here)) { const b = bs.find((x) => Math.hypot(x.x - h.x, x.y - h.y) <= 5); if (b) b.l.push(h); else bs.push({ x: h.x, y: h.y, l: [h] }); }
        for (const b of bs) { const [x, y] = px(f, b), m = new Map(); for (const h of b.l) { const k2 = h.who + ' · ' + h.sp; m.set(k2, (m.get(k2) || 0) + 1); }
          marks.push('<g class="mpt-mk mk-avoid" data-pi="' + q.i + '"' + mpT1([...m].map(([k2, c]) => esc(k2) + ' ×' + c).join('<br>')) + ' transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(' + k.toFixed(3) + ')"><circle r="' + (b.l.length > 1 ? 8 : 6) + '" fill="#f2c46b" fill-opacity=".9" stroke="#0f1117" stroke-width="1.5"/>' +
            (b.l.length > 1 ? '<text y="4" text-anchor="middle" fill="#0f1117" style="font-size:10px;font-weight:700">' + b.l.length + '</text>' : '') + '</g>'); } } }
    // (the route: a dotted line through each pull's middle, in order, with a chevron at each midpoint; "then Arena →" where it leaves this floor)
    const order = Q.filter((q) => cen.has(q.i)), route = [];
    for (let j = 1; j < order.length; j++) { const a = cen.get(order[j - 1].i), b = cen.get(order[j].i), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      route.push('<path d="M-4 -4 L2 0 L-4 4" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2" transform="translate(' + mx.toFixed(1) + ',' + my.toFixed(1) + ') rotate(' + ang.toFixed(0) + ') scale(' + k.toFixed(3) + ')"/>'); }
    const line = order.length > 1 ? '<polyline points="' + order.map((q) => cen.get(q.i).map((v) => v.toFixed(1)).join(',')).join(' ') + '" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="' + (2.2 * k).toFixed(2) + '" stroke-dasharray="' + (7 * k).toFixed(1) + ' ' + (6 * k).toFixed(1) + '"/>' : '';
    const last = order[order.length - 1], nx = last && Q.slice(last.i + 1).find((q) => q.fl >= 0 && floors[q.fl].f[0] !== f[0]);
    if (nx) { const [x, y] = cen.get(last.i), t = 'then ' + floors[nx.fl].f[1] + ' →', tw2 = t.length * 6.4 + 14;
      route.push('<g class="mpt-mthen" data-mdtf="' + nx.fl + '" role="button" transform="translate(' + (x + 18 * k).toFixed(1) + ',' + (y + 14 * k).toFixed(1) + ') scale(' + k.toFixed(3) + ')"><rect width="' + tw2.toFixed(0) + '" height="20" rx="10" fill="#0f1117" fill-opacity=".85" stroke="#fff" stroke-opacity=".45"/><text x="' + (tw2 / 2).toFixed(0) + '" y="14" text-anchor="middle" fill="#e8ebee" style="font-size:11.5px">' + esc(t) + '</text></g>'); }
    return '<svg viewBox="' + fl.box.map((v) => v.toFixed(1)).join(' ') + '" role="img" aria-label="' + esc(f[1]) + '"><image href="https://wow.zamimg.com/images/wow/maps/enus/original/' + rt.zone + (fl.i ? '-' + fl.i : '') + '.jpg" x="0" y="0" width="' + W + '" height="' + H + '" opacity=".85"/>' +
      '<g class="mk-route">' + line + route.join('') + '</g>' + shapes.join('') + marks.join('') + tags.join('') + '</svg>'; };
  // (the picked pull's card: what went wrong, worst first, each player's damage a second, and the big cooldowns pressed in this pull itself
  // (from 3 s before it to 1 s after: the studio's fix, where a chain's whole list showed on each of its pulls). The fast run's from its own log)
  const card = (q, run) => { const RR = q.RR, p = q.p, gd = mpGd(p), ppl = (RR.people || []).slice().sort(mpByRole), out = [];
    for (const d of p.deaths) out.push('<p class="mpt-mcd">☠ ' + mpWho(RR, d.who) + ' died to <b>' + esc(d.to || 'unknown') + '</b>' + (d.from ? ' (from ' + esc(d.from) + ')' : '') + ', ' + mpMM(d.t - p.s) + ' in. ' + (d.defs ? 'Used ' + plural(d.defs, 'defensive') + '.' : 'No defensive used.') + '</p>');
    const grp = kgrp;
    for (const [sp, o] of grp(p.through)) out.push('<p class="mpt-mck">! <b>' + esc(sp) + '</b> went off ' + tw(o.n) + ' with a kick ready.' + (o.r.size ? ' Kick ready: ' + [...o.r].map((n) => mpWho(RR, n)).join(', ') + '.' : '') + '</p>');
    for (const [sp, o] of grp(p.minor)) out.push('<p class="mpt-mcm">! ' + esc(sp) + ' went off ' + tw(o.n) + ' with a kick ready. Worth a kick, not a mistake.</p>');
    if (run === 'you' && p.boss && F) { const fb = F.pulls.filter((x) => x.boss === p.boss), t = fb.length ? mpNextBoss(R, F, [p], fb) : ''; if (t) out.push('<p class="mpt-mcn">▼ ' + t.replace(/^<p class="mpt-nt"><b>Next time<\/b> /, '').replace(/<\/p>$/, '') + '</p>'); }
    const tp = tips(q), ex = []; if (tp.length) ex.push('<p class="mpt-mck2">Plan</p><ul class="mpt-mtips">' + tp.map((x) => '<li>' + mpKm(x) + '</li>').join('') + '</ul>');
    const byW = (L) => { const m = new Map(); for (const x of L || []) if (x.who) m.set(x.who, (m.get(x.who) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]).map(([w, c]) => mpWho(RR, w) + ' ' + c).join(' · '); };
    const pd = [];
    const rm = (L, b) => [...new Set((L || []).filter((x) => x.removed === b).map((x) => x.who))].map((n) => mpWho(RR, n)).join(', ');
    for (const o of [].concat(p.ebuffs || [])) if (o && o.on) pd.push('<p class="mpt-mcv">' + esc(o.spell) + ' on ' + plural(o.on, 'enemy').replace(/enemys$/, 'enemies') + (o.removed ? ' · ' + o.removed + ' purged (' + rm(p.purges, o.spell) + ')' : '') + '</p>');
    for (const o of [].concat(p.debs || [])) if (o && o.on) pd.push('<p class="mpt-mcv">' + esc(o.spell) + ' on ' + plural(o.on, 'player') + (o.removed ? ' · ' + o.removed + ' dispelled (' + rm(p.dispels, o.spell) + ')' : '') + '</p>');
    { const kname = (e) => (String(e.src).startsWith('Pet-') ? ((p.kicks || []).find((x) => Math.abs(x.t - e.t) < 0.5) || {}).who || e.who : e.who), kg = new Map();
      for (const e of q.kx) { const w = kname(e), k2 = w + '|' + e.tg + '|' + e.cut, o = kg.get(k2) || { w, tg: e.tg, cut: e.cut, n: 0 }; o.n++; kg.set(k2, o); }
      const kl = [...kg.values()].map((o) => '<span data-who="' + esc(o.w) + '">' + mpWho(RR, o.w) + ' → ' + esc(o.tg) + (o.n > 1 ? ' ×' + o.n : '') + (o.cut ? ' <span class="mpt-m">(' + esc(o.cut) + ')</span>' : '') + '</span>').join(' · ');
      const cg = new Map(); for (const e of q.cx) { const k2 = e.who + '|' + e.sp, o = cg.get(k2) || { w: e.who, sp: e.sp, g: new Set() }; if (e.g) o.g.add(e.g); cg.set(k2, o); }
      const cl = [...cg.values()].map((o) => '<span data-who="' + esc(o.w) + '">' + mpWho(RR, o.w) + ' ' + esc(o.sp) + (o.g.size ? ' → ' + plural(o.g.size, 'enemy').replace(/enemys$/, 'enemies') : '') + '</span>').join(' · '), ss = byW(p.stops);
      if (kl || cl || ss || pd.length) ex.push('<p class="mpt-mck2">Kicks &amp; CC</p>' + (kl ? '<p class="mpt-mcv">' + kl + '</p>' : '') + (cl ? '<p class="mpt-mcv">' + cl + '</p>' : '') + (ss ? '<p class="mpt-mcv">Stops: ' + ss + '</p>' : '') + pd.join('')); }
    if ((p.avoid || []).length) ex.push('<p class="mpt-mca">Avoidable: ' + p.avoid.map((a) => mpWho(RR, a.who) + ' ×' + a.n + ' ' + esc(a.spell)).join(', ') + '</p>');
    const recap = p.deaths.map((d) => { const r = q.dd.find((x) => x.who === d.who && Math.abs(x.t - d.t) < 3); if (!r) return '';
      return '<div class="mpt-mdr" data-dr="' + esc(d.who) + '"><p class="mpt-mck2">How ' + esc(d.who) + ' died</p>' + (r.hits.length ? '<ol>' + r.hits.map((h) => '<li><span class="mpt-m">' + h.ago.toFixed(1) + ' s before:</span> <b>' + esc(h.sp) + '</b>' + (h.from ? ' <span class="mpt-m">(' + esc(h.from) + ')</span>' : '') + ' ' + mpGF(h.amt) + (h.pct ? ' <span class="mpt-m">· ' + Math.round(100 * h.pct) + '% of their health</span>' : '') + '</li>').join('') + '</ol>' : '') +
        '<p class="mpt-mcm">' + (r.ready.length ? mpAnd(r.ready.map(esc)) + (r.ready.length === 1 ? ' was' : ' were') + ' ready.' : 'No defensive was ready.') + (r.used.length ? ' Used: ' + r.used.map(([n, sec]) => esc(n) + ' (' + sec + ' s before)').join(', ') + '.' : '') + ' Healthstone: ' + (r.hs != null ? 'used ' + r.hs + ' s before.' : 'not used.') + '</p></div>'; }).join('');
    const mx = Math.max(1, ...ppl.map((x) => (p.dmg || {})[x.name] || 0));
    const dps = ppl.map((x) => { const d = (p.dmg || {})[x.name] || 0, h = (p.heal || {})[x.name] || 0, cc = mpCC(x.cls);
      return '<div class="mpt-mcr" data-who="' + esc(x.name) + '"><span style="color:' + cc + '">' + esc(x.name) + '</span><s><i style="width:' + (100 * d / mx).toFixed(0) + '%;background:' + cc + '"></i></s><b>' + mpGF(d) + (x.role === 'healer' && h ? ' <small>· ' + mpGF(h) + ' HPS</small>' : '') + '</b></div>'; }).join('');
    const act = (RR.cdWho || []).filter((n) => ((RR.cds || {})[n] || []).length), own = act.map((n) => [n, RR.cds[n].filter((x) => x.t >= p.s - 3 && x.t <= p.e + 1)]).filter(([, l]) => l.length);
    const chips = own.flatMap(([n, l]) => { const m = new Map(); for (const x of l) m.set(x.spell, (m.get(x.spell) || 0) + 1); const cc = mpCC(((RR.people || []).find((x) => x.name === n) || {}).cls);
      return [...m].map(([sp, c]) => '<span style="border-color:' + cc + '"' + mpT1(esc(n)) + '><i style="background:' + cc + '"></i>' + esc(sp) + (c > 1 ? ' ×' + c : '') + '</span>'); }).join('');
    const not = act.filter((n) => !own.some(([x]) => x === n));
    return '<div class="mpt-mch">' + badge(q) + '<b>' + nm(q) + '</b><span>' + mpMM(p.dur) + (q.add ? ' · +' + fmt(pc(q.add)) : '') + (gd ? ' · ' + mpGF(gd) + ' group DPS' : '') + '</span></div>' +
      (q.wait ? '<p class="mpt-mcw">⏱ Waited ' + mpMM(q.wait) + ' before this pull.</p>' : '') + (q.lust ? '<p class="mpt-mcl">⚡ Lust went out here.</p>' : '') +
      (out.length ? out.join('') : '<p class="mpt-mco">✓ Clean.</p>') + ex.join('') + (ppl.length ? '<p class="mpt-mck2">Damage a second</p>' + dps : '') +
      (act.length ? '<p class="mpt-mck2">Big cooldowns pressed in this pull</p>' + (own.length ? '<div class="mpt-mccd">' + chips + '</div>' + (not.length ? '<p class="mpt-mcm">Not pressed here: ' + not.map(esc).join(', ') + '</p>' : '')
        : '<p class="mpt-mcm">' + (q.chained ? 'None (chained onto the pull before, where they went out).' : 'None.') + '</p>') : '') + recap; };
  const list = (Q) => '<ol class="mpt-mfl">' + Q.map((q) => { const pct = q.add ? pc(q.add) : 0, th = (q.p.through || []).length;
    return '<li data-pi="' + q.i + '"' + (q.fl >= 0 ? ' data-fl="' + q.fl + '"' : '') + ' data-lab="' + esc(q.p.boss ? q.p.boss : 'Pull ' + mpNo(q.RR, q.p.n)) + '" tabindex="0">' + badge(q) +
      '<span class="mpt-pnm">' + nm(q) + ((q.chained || !q.us.length) ? '<small>' + [q.chained ? 'chained' : '', !q.us.length ? '<span' + mpT1('The run\'s log didn\'t record where these enemies stood.') + '>no spot</span>' : ''].filter(Boolean).join(' · ') + '</small>' : '') + '</span>' +
      '<span class="mpt-mic">' + (q.p.deaths.length ? '<i class="d">☠</i>' : '') + (th ? '<i class="k">!' + th + '</i>' : '') + (q.lust ? '<i class="l">⚡</i>' : '') + '</span>' +
      '<span class="mpt-ptm">' + mpMM(q.p.dur) + '</span><span class="mpt-pfc">' + (pct ? '+' + fmt(pct) : '<span class="mpt-m">—</span>') + '</span></li>'; }).join('') + '</ol>';
  const f0 = Math.max(0, floors.findIndex((x) => x.us[0].length));
  const views = runs.map(([v, RR], ri) => { const Q = pullsOf(RR);
    return '<div class="mpt-mdtv" data-v="' + v + '" data-n="' + Q.length + '"' + (ri ? ' hidden' : '') + '><div class="mpt-mgrid"><div class="mpt-mwrap">' + floors.map((fl, j) => '<div class="mpt-mdtm" data-f="' + j + '"' + (j === f0 ? '' : ' hidden') + '>' + svg(Q, fl) + '</div>').join('') +
      '<div class="zctl mpt-zctl"><button type="button" data-mz="1" aria-label="Zoom in">+</button><button type="button" data-mz="-1" aria-label="Zoom out" disabled>−</button></div></div>' +
      '<div class="mpt-mside"><div class="mpt-mcard"><p class="mpt-mc0">Click a pull, or press ▶, to see what happened in it.</p><div class="mpt-mcx" hidden></div>' + Q.map((q) => '<div class="mpt-mc" data-pi="' + q.i + '" hidden>' + card(q, v) + '</div>').join('') + '</div>' + list(Q) + '</div></div></div>'; }).join('');
  const tg = runs.length > 1 ? '<div class="mpt-mtg" role="group" aria-label="Whose pulls">' + runs.map(([v, RR], ri) => '<button type="button" data-mdtv="' + v + '" aria-pressed="' + !ri + '"' + (ri ? '' : ' class="on"') + '>' + (v === 'you' ? 'You' : 'Fast run') + ' · ' + plural(RR.pulls.filter((p) => !p.boss).length, 'pull') + '</button>').join('') + '</div>' : '';
  const chips = '<div class="mpt-mchips" role="group" aria-label="Show on the map">' + [['r', '⋯', 'Route'], ['d', '☠', 'Deaths'], ['k', '!', 'Missed kicks'], ['l', '⚡', 'Lust'], ['w', '⏱', 'Waits'], ['c', '●', 'Kicks & CC'], ['a', '◆', 'Avoidable', 1]].map(([c, i, l, off]) => '<button type="button" class="mpt-mchip' + (off ? '' : ' on') + ' mpt-mchip-' + c + '" data-mchip="' + c + '" aria-pressed="' + !off + '"><i>' + i + '</i>' + l + '</button>').join('') + '</div>';
  const fb = floors.length > 1 ? '<div class="mpt-flb" role="group" aria-label="Floor">' + floors.map((fl, j) => '<button type="button" data-mdtf="' + j + '"' + (j === f0 ? ' class="on"' : '') + '>' + esc(fl.f[1]) + '</button>').join('') + '</div>' : '<span class="mpt-m">' + esc(floors[0].f[1]) + '</span>';
  const step = '<div class="mpt-mstep"><button type="button" data-mstep="-1" aria-label="Previous pull">◀</button><span>Pick a pull</span><button type="button" data-mstep="1" aria-label="Next pull">▶</button></div>';
  const pp = (R.people || []).length ? '<div class="mpt-mpp" role="group" aria-label="Show a player"><span>Show:</span><button type="button" class="on" data-mpp="">Everyone</button>' + (R.people || []).slice().sort(mpByRole).map((x) => '<button type="button" data-mpp="' + esc(x.name) + '" style="color:' + mpCC(x.cls) + '">' + esc(x.name) + '</button>').join('') + '</div>' : '';
  return '<div class="mpt-mdt no-a"><div class="mpt-mdtc">' + tg + chips + '</div>' + pp + '<div class="mpt-mrow">' + fb + step + '</div>' + views + strip + '</div>'; }
// (picking: a click or tap on a shape, tag, mark, list row, timeline block or ◀ ▶. The map goes to the pull's floor, the pull lights up and the
// rest dim, the card shows it; the pick stays when the tab redraws. A hover only lights up (MP.peek), never moving the card or the floor)
const mpMdtFloor = (box, j) => { if (!box || j == null || j === '') return; j = String(j); if (MP.mz && MP.mz.f !== j) { MP.mz = { f: j, z: 1, c: null }; mpZoomBtns(box, 1); } box.querySelectorAll('[data-mdtf]').forEach((x) => x.classList.toggle('on', x.dataset.mdtf === j)); box.querySelectorAll('.mpt-mdtm').forEach((m) => { m.hidden = m.dataset.f !== j; }); };
function mpMapView(box, v) { box.querySelectorAll('[data-mdtv]').forEach((x) => { x.classList.toggle('on', x.dataset.mdtv === v); x.setAttribute('aria-pressed', String(x.dataset.mdtv === v)); }); box.querySelectorAll('.mpt-mdtv').forEach((x) => { x.hidden = x.dataset.v !== v; }); }
function mpMapPick(v, ids, sum) { const box = document.querySelector('.mpt-mdt'); if (!box) return; const view = box.querySelector('.mpt-mdtv[data-v="' + v + '"]'); if (!view) return;
  if (view.hidden) mpMapView(box, v); ids = [].concat(ids).map(String); const one = ids.length === 1 && !sum;
  const li = view.querySelector('.mpt-mfl li[data-pi="' + ids[0] + '"]'); if (li && li.dataset.fl) mpMdtFloor(box, li.dataset.fl);
  view.classList.add('pick'); view.querySelectorAll('[data-pi]').forEach((x) => { if (!x.classList.contains('mpt-mc')) x.classList.toggle('hot', ids.includes(x.dataset.pi)); });
  view.querySelectorAll('.mpt-mc').forEach((c) => { c.hidden = !one || c.dataset.pi !== ids[0]; }); view.querySelector('.mpt-mc0').hidden = true;
  const cx = view.querySelector('.mpt-mcx'); cx.hidden = one; if (!one) cx.innerHTML = sum || '';
  box.querySelectorAll('.mpt-mstrip .mpt-blk[data-pi]').forEach((b) => b.classList.toggle('hot', b.dataset.run === v && ids.includes(b.dataset.pi)));
  const lab = box.querySelector('.mpt-mstep span'); if (lab && li) lab.textContent = one ? li.dataset.lab + ' · ' + (+ids[0] + 1) + ' of ' + view.dataset.n : plural(ids.length, 'pull') + ' lit up';
  if (li) { const ol = li.parentNode; if (li.offsetTop < ol.scrollTop || li.offsetTop + li.offsetHeight > ol.scrollTop + ol.clientHeight) ol.scrollTop = li.offsetTop - ol.clientHeight / 2; }
  MP.pick = { v, ids, sum: sum || '' };
  if (MP.mz && MP.mz.z > 1) { const tg = view.querySelector('.mpt-mdtm:not([hidden]) .mpt-mtag[data-pi="' + ids[0] + '"]'); if (tg && tg.dataset.tf) { const [tx, ty] = tg.dataset.tf.split(',').map(Number); mpZoom(box, [tx, ty + (+tg.dataset.oy || 0)]); } else mpZoom(box); } }
function mpMapPeek(view, i) { if (!view) return; view.classList.toggle('peek', i != null); view.querySelectorAll('[data-pi]').forEach((x) => x.classList.toggle('pk', i != null && x.dataset.pi === String(i))); }
// (pick a player: only their kick, CC and death marks on the map, the others' rows in the card faded; the Home character is the default later)
function mpMapPP(name) { const box = document.querySelector('.mpt-mdt'); if (!box) return; name = name || ''; MP.pp = name;
  box.querySelectorAll('[data-mpp]').forEach((b) => b.classList.toggle('on', b.dataset.mpp === name));
  box.querySelectorAll('.mpt-mdtv[data-v="you"] [data-who]').forEach((el) => el.classList.toggle('pp-off', !!name && !el.dataset.who.split('|').includes(name))); }
// (zoom (Flex: "the map should have a zoom in and zoom out option"): + and − step 1×, 1.5×, 2.25×, 3×; drag to pan; pinch on a phone. No reset, no
// wheel or double-click (Flex's rules for maps, Oct 20/22). Tags, marks and the route keep their size on screen, so a busy pull spreads out. A
// new floor goes back to 1×; picking a pull pans to it; a redraw keeps the zoom; a drag never picks)
const MP_ZS = [1, 1.5, 2.25, 3], MP_TF = /translate\(([-\d.]+),([-\d.]+)\)(?: rotate\(([-\d.]+)\))? scale\(([-\d.]+)\)/;
const mpZoomF = (box) => { const b = box.querySelector('[data-mdtf].on'); if (b && b.closest('.mpt-flb')) return b.dataset.mdtf; const m = box.querySelector('.mpt-mdtm:not([hidden])'); return m ? m.dataset.f : '0'; };
const mpZoomBtns = (box, z) => { if (!box) return; box.querySelectorAll('[data-mz="1"]').forEach((b) => { b.disabled = z >= 2.999; }); box.querySelectorAll('[data-mz="-1"]').forEach((b) => { b.disabled = z <= 1.001; }); };
function mpZoom(box, at) { if (!box) return; const fi = mpZoomF(box), st = MP.mz && MP.mz.f === fi ? MP.mz : (MP.mz = { f: fi, z: 1, c: null }); if (at) st.c = at; mpZoomBtns(box, st.z);
  for (const svg of box.querySelectorAll('.mpt-mdtm[data-f="' + fi + '"] svg')) { const b = (svg.dataset.vb || (svg.dataset.vb = svg.getAttribute('viewBox'))).split(' ').map(Number), z = st.z, w = b[2] / z, h = b[3] / z;
    const c = st.c || [b[0] + b[2] / 2, b[1] + b[3] / 2], x = Math.max(b[0], Math.min(b[0] + b[2] - w, c[0] - w / 2)), y = Math.max(b[1], Math.min(b[1] + b[3] - h, c[1] - h / 2)); st.c = [x + w / 2, y + h / 2];
    svg.setAttribute('viewBox', [x, y, w, h].map((v) => v.toFixed(1)).join(' ')); svg.style.touchAction = z > 1 ? 'none' : 'pan-y';
    for (const el of svg.querySelectorAll('[transform]')) { if (!el.dataset.tf) { const m = MP_TF.exec(el.getAttribute('transform')); if (!m) continue; el.dataset.tf = [m[1], m[2], m[3] || '', m[4]].join(','); }
      const [tx, ty, rot, sc] = el.dataset.tf.split(','), oy = +el.dataset.oy || 0; el.setAttribute('transform', 'translate(' + tx + ',' + (+ty + oy - oy / z).toFixed(1) + ')' + (rot ? ' rotate(' + rot + ')' : '') + ' scale(' + (sc / z).toFixed(4) + ')'); }
    for (const el of svg.querySelectorAll('polyline, line')) { if (el.dataset.sw == null) { el.dataset.sw = el.getAttribute('stroke-width') || ''; el.dataset.da = el.getAttribute('stroke-dasharray') || ''; }
      if (el.dataset.sw) el.setAttribute('stroke-width', (el.dataset.sw / z).toFixed(3)); if (el.dataset.da) el.setAttribute('stroke-dasharray', el.dataset.da.split(' ').map((v) => (v / z).toFixed(2)).join(' ')); }
    for (const el of svg.querySelectorAll('.mpt-mpl > circle')) { if (!el.dataset.r) el.dataset.r = el.getAttribute('r'); el.setAttribute('r', (el.dataset.r / z).toFixed(2)); } } }
document.addEventListener('click', (e) => { const zb = e.target.closest && e.target.closest('[data-mz]'); if (!zb) return; const box = zb.closest('.mpt-mdt'); if (!box) return; mpZoom(box); const st = MP.mz, up = zb.dataset.mz === '1';
  st.z = up ? (MP_ZS.find((v) => v > st.z + 0.01) || 3) : ([...MP_ZS].reverse().find((v) => v < st.z - 0.01) || 1); mpZoom(box); });
{ const P = new Map(); let pan = null, pin = null;
  document.addEventListener('pointerdown', (e) => { const svg = e.target.closest && e.target.closest('.mpt-mdtm svg'); if (!svg) return; P.set(e.pointerId, [e.clientX, e.clientY]); const box = svg.closest('.mpt-mdt'); mpZoom(box);
    if (P.size === 2) { const [a, b] = [...P.values()]; pin = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: MP.mz.z, box }; pan = null; } else if (P.size === 1) pan = { x: e.clientX, y: e.clientY, c: MP.mz.c.slice(), svg, box, moved: false }; });
  document.addEventListener('pointermove', (e) => { if (!P.has(e.pointerId)) return; P.set(e.pointerId, [e.clientX, e.clientY]);
    if (pin && P.size === 2) { const [a, b] = [...P.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); MP.mz.z = Math.max(1, Math.min(3, pin.z * d / (pin.d || 1))); mpZoom(pin.box); MP.dragT = Date.now(); return; }
    if (!pan) return; const dx = e.clientX - pan.x, dy = e.clientY - pan.y; if (!pan.moved && Math.hypot(dx, dy) < 5) return; pan.moved = true; MP.dragT = Date.now();
    const r = pan.svg.getBoundingClientRect(), vb = pan.svg.getAttribute('viewBox').split(' ').map(Number); mpZoom(pan.box, [pan.c[0] - dx / r.width * vb[2], pan.c[1] - dy / r.height * vb[3]]); });
  const end = (e) => { P.delete(e.pointerId); if (P.size < 2) pin = null; if (!P.size) pan = null; };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end); }
function mpMapRestore() { const p = MP.pick; if (p && document.querySelector('.mpt-mdtv[data-v="' + p.v + '"]')) mpMapPick(p.v, p.ids, p.sum); if (MP.pp) mpMapPP(MP.pp); if (MP.mz && MP.mz.z > 1) { const st = MP.mz; mpZoom(document.querySelector('.mpt-mdt'), st.c); } }
document.addEventListener('click', (e) => { const t = e.target; if (!t.closest) return; const box = t.closest('.mpt-mdt');
  if (MP.dragT && Date.now() - MP.dragT < 250 && t.closest('.mpt-mdtm')) { e.stopPropagation(); e.preventDefault(); return; } /* (the end of a drag or pinch, not a pick) */
  const sv = t.closest('[data-mdtv]'); if (sv && box) { mpMapView(box, sv.dataset.mdtv); return; }
  const sf = t.closest('[data-mdtf]'); if (sf && box) { mpMdtFloor(box, sf.dataset.mdtf); return; }
  const pb = t.closest('[data-mpp]'); if (pb && box) { mpMapPP(pb.dataset.mpp); return; }
  const ch = t.closest('[data-mchip]'); if (ch && box) { const on = !ch.classList.contains('on'); ch.classList.toggle('on', on); ch.setAttribute('aria-pressed', String(on)); box.classList.toggle('no-' + ch.dataset.mchip, !on); return; }
  const st = t.closest('[data-mstep]'); if (st && box) { const view = box.querySelector('.mpt-mdtv:not([hidden])'), n = +view.dataset.n, p = MP.pick && MP.pick.v === view.dataset.v && MP.pick.ids.length === 1 ? +MP.pick.ids[0] : -1;
    let k = p + +st.dataset.mstep; if (k < 0) k = n - 1; if (k >= n) k = 0; mpMapPick(view.dataset.v, k); return; }
  const blk = t.closest('.mpt-mstrip .mpt-blk[data-pi]'); if (blk) { mpMapPick(blk.dataset.run, blk.dataset.pi); return; }
  const go = t.closest('[data-mpps]'); if (go) { e.preventDefault(); e.stopPropagation(); const ids = go.dataset.mpps.split(','), ch2 = document.getElementById('mptCM');
    mpMapPick('you', ids, '<div class="mpt-mch"><b>' + go.dataset.mpt + '</b><span>' + go.dataset.mpl + '</span></div><p class="mpt-mcm">Lit up on the map. Click one for what happened in it.</p>');
    if (ch2) ch2.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  const dm = t.closest('.mpt-mdtv .mk-death'); if (dm) { const view = dm.closest('.mpt-mdtv'), box2 = view.querySelector('.mpt-mcard'); mpMapPick(view.dataset.v, dm.dataset.pi);
    const c = [...view.querySelectorAll('.mpt-mc[data-pi="' + dm.dataset.pi + '"] .mpt-mdr')].find((x) => x.dataset.dr === dm.dataset.who); if (c && box2) { if (box2.scrollHeight > box2.clientHeight + 4) box2.scrollTop = c.offsetTop - 6; else c.scrollIntoView({ behavior: 'smooth', block: 'center' }); } return; } /* (a phone: the card has no scroll of its own) */
  const pi = t.closest('.mpt-mdtv [data-pi]'); if (pi && !pi.classList.contains('mpt-mc')) { mpMapPick(pi.closest('.mpt-mdtv').dataset.v, pi.dataset.pi); return; }
  const sm = t.closest('.mpt-pr > summary'); if (sm) { const n = +sm.parentNode.dataset.n; if (n) mpMapPick('you', n - 1); } /* (a pull opened in Pulls is picked on the map too, without moving the page) */
}, true);
document.addEventListener('keydown', (e) => { if (e.key !== 'Enter' || !e.target.closest || !e.target.closest('.mpt-mfl li')) return; e.target.click(); });
document.addEventListener('mouseover', (e) => { const t = e.target; if (!t.closest) return;
  const blk = t.closest('.mpt-mstrip .mpt-blk[data-pi]'); if (blk) { mpMapPeek(document.querySelector('.mpt-mdtv[data-v="' + blk.dataset.run + '"]:not([hidden])'), blk.dataset.pi); return; }
  const v = t.closest('.mpt-mdtv'); if (!v) { document.querySelectorAll('.mpt-mdtv.peek').forEach((x) => mpMapPeek(x, null)); return; }
  const p = t.closest('[data-pi]'); mpMapPeek(v, p && !p.classList.contains('mpt-mc') && !p.closest('.mpt-mcard') ? p.dataset.pi : null); });

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
.mpf .mpf-who{margin:0 0 10px;font:500 13.5px var(--body);color:var(--muted)} .mpf .mpf-who b{color:var(--text)}
.mpf-l{display:flex;flex-direction:column;border-top:1px solid var(--line)}
.mpf .mpf-r{display:grid;grid-template-columns:42px minmax(0,1fr) 104px 58px auto;align-items:center;gap:12px;width:100%;margin:0;padding:10px 4px;background:none;border:0;border-bottom:1px solid var(--line);border-radius:0;color:var(--text);text-align:left;cursor:pointer;font:inherit}
.mpf .mpf-r:hover{background:rgba(255,255,255,.03)} .mpf .mpf-r:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.mpf-lv{display:grid;place-items:center;width:40px;height:40px;border:1px solid var(--line2);border-radius:4px;font:700 15px var(--head);color:var(--muted)} .mpf-lv.mpf-hi{border-color:var(--gold);color:var(--gold)}
.mpf-dg{display:flex;flex-direction:column;min-width:0} .mpf-dg b{font:700 14.5px var(--body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .mpf-dg small{font:500 12.5px var(--body);color:var(--muted)} .mpf-dg em{display:none;font:600 12.5px var(--body);font-style:normal}
.mpf-res{font:600 13px var(--body)} .mpf-dt{font:500 12.5px var(--body);color:var(--muted)} .mpf-r .mpf-op{pointer-events:none}
.mpf .mpf-msg{margin:10px 0 0;font:500 13px var(--body);color:var(--muted)} .mpf .mpf-foot{margin:8px 0 0;font:500 12px var(--body);color:var(--faint)} .mpf-more{margin-top:12px}
.mpf-f{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1.3fr) 90px auto;gap:10px;align-items:end}
.mpf-f label{display:flex;flex-direction:column;gap:4px;font:600 12px var(--body);color:var(--muted)}
.mpf-f input,.mpf-f select{min-width:0;background:var(--raised);border:1px solid var(--line2);border-radius:4px;padding:8px 10px;color:var(--text);font:500 14px var(--body)}
.mpf .mpf-alt{margin:14px 0 0;font:500 13px var(--body);color:var(--muted)} .mpf-box{margin-top:10px}
.mpt-pick .mpt-findl{font:600 13px var(--body)}
@media (max-width:600px){ .mpf .mpf-r{grid-template-columns:40px minmax(0,1fr) auto;gap:10px} .mpf-res,.mpf-dt{display:none} .mpf-dg em{display:block} .mpf-f{grid-template-columns:1fr 1fr} .mpf-f .btn{grid-column:1 / -1} }
.mpt-mdtc{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0 0 8px}
.mpt-mtg{display:inline-flex;border:1px solid var(--line2);border-radius:4px;overflow:hidden} .mpt .mpt-mtg button{height:30px;margin:0;padding:0 14px;background:none;border:0;border-radius:0;color:var(--muted);font:600 13.5px var(--body);cursor:pointer}
.mpt .mpt-mtg button.on{background:var(--raised);color:var(--text);font-weight:700} .mpt .mpt-mtg button + button{border-left:1px solid var(--line2)}
.mpt-flb{display:flex;flex-wrap:wrap;gap:6px} .mpt .mpt-flb button{height:28px;margin:0;padding:0 12px;border:1px solid var(--line2);border-radius:4px;background:none;color:var(--muted);font:600 13px var(--body);cursor:pointer} .mpt .mpt-flb button.on{color:var(--text);border-color:var(--faint)}
.mpt-mdtm{border:1px solid var(--line2);border-radius:4px;overflow:hidden;aspect-ratio:16/10;background:#14161b} .mpt-mdtm svg{display:block;width:100%;height:100%} .mpt-mdtm text{font:700 14px var(--head)}
.mpt-mpl{cursor:default;transition:opacity .12s} .mpt-mpl.mpt-pgo{cursor:pointer} .mpt-mdtv.dim .mpt-mpl{opacity:.15} .mpt-mdtv.dim .mpt-mpl.hot{opacity:1}
.mpt-mdtl{list-style:none;margin:12px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;column-gap:24px}
.mpt-mdtl li{display:grid;grid-template-columns:30px minmax(0,1fr) 78px 40px 50px 64px;align-items:center;gap:8px;margin:0;padding:6px 4px;border-top:1px solid var(--line);font:500 13px var(--body)} .mpt-mdtl li.mpt-pgo{cursor:pointer}
.mpt-mdtl li:hover,.mpt-mdtl li.hot{background:rgba(255,255,255,.03)} .mpt-mdtl li:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.mpt-nb{width:26px;height:22px;display:grid;place-items:center;border:2px solid;border-radius:4px;font:700 13px var(--head)}
.mpt-pnm{min-width:0;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .mpt-pnm small{display:block;font:500 11.5px var(--body);color:var(--faint)}
.mpt-pen,.mpt-ptm{color:var(--muted);font-size:12.5px} .mpt-pfc{font-weight:700;text-align:right}
.mpt-pbar{height:5px;border-radius:3px;background:rgba(255,255,255,.06)} .mpt-pbar i{display:block;height:5px;border-radius:3px}
@media (max-width:760px){ .mpt-mdtl{grid-template-columns:minmax(0,1fr)} .mpt-mdtl li{grid-template-columns:30px minmax(0,1fr) 70px 40px 50px} .mpt-pbar{display:none} }
.mpt-mdt [hidden]{display:none!important}
.mpt-mdt .mpt-mdtc{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:0 0 10px}
.mpt-mchips{display:flex;flex-wrap:wrap;gap:6px} .mpt .mpt-mchip{height:26px;margin:0;padding:0 10px;border:1px solid var(--line2);border-radius:4px;background:none;color:var(--faint);font:600 12.5px var(--body);cursor:pointer}
.mpt .mpt-mchip.on{color:var(--text);border-color:var(--faint)} .mpt-mchip i{font-style:normal;margin-right:5px} .mpt-mchip-d i{color:#ff8f87} .mpt-mchip-k i{color:#c39bff;font-weight:700} .mpt-mchip-l i{color:#ffd166} .mpt-mchip-a i{color:#f2c46b} .mpt-mchip-c i{color:#7ee08f}
.mpt-mpp{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 10px} .mpt-mpp > span{font:600 12.5px var(--body);color:var(--faint)}
.mpt .mpt-mpp button{height:26px;margin:0;padding:0 10px;border:1px solid var(--line2);border-radius:4px;background:none;font:600 12.5px var(--body);cursor:pointer;color:var(--muted)} .mpt .mpt-mpp button.on{border-color:currentColor;background:var(--raised)}
.mpt-mcard .pp-off{opacity:.35}
.mpt-mrow{display:flex;justify-content:space-between;align-items:center;gap:8px 10px;flex-wrap:wrap;margin:0 0 8px}
.mpt-mstep{display:flex;align-items:center;gap:8px} .mpt .mpt-mstep button{height:28px;margin:0;padding:0 10px;border:1px solid var(--line2);border-radius:4px;background:none;color:var(--text);font:600 13px var(--body);cursor:pointer}
.mpt-mstep span{min-width:150px;text-align:center;font:600 13px var(--body);color:var(--text)}
.mpt-mgrid{display:grid;grid-template-columns:minmax(0,2fr) minmax(300px,1.2fr);gap:12px;align-items:start}
.mpt-mwrap{position:relative} .mpt-mwrap .mpt-mdtm{aspect-ratio:16/10} .mpt-mdtm svg{touch-action:pan-y} .mpt-zctl{z-index:2} .mpt .mpt-zctl button{margin:0;font:700 16px var(--body);line-height:1} .mpt .mpt-zctl button:disabled{opacity:.35;cursor:default;border-color:var(--line2);color:var(--muted)}
.mpt-mdtv .mpt-mpl,.mpt-mdtv .mpt-mk{transition:opacity .12s;cursor:pointer}
.mpt-mdtv.pick:not(.peek) .mpt-mpl:not(.hot),.mpt-mdtv.pick:not(.peek) .mpt-mk:not(.hot){opacity:.15}
.mpt-mdtv.peek .mpt-mpl:not(.pk),.mpt-mdtv.peek .mpt-mk:not(.pk){opacity:.35}
.mpt-mdt.no-c .mk-kcc,.mpt-mdt .mpt-mk.pp-off,.mpt-mdt.no-a .mk-avoid,.mpt-mdt.no-r .mk-route,.mpt-mdt.no-r .mpt-mthen,.mpt-mdt.no-d .mk-death,.mpt-mdt.no-k .mk-kick,.mpt-mdt.no-k .mk-bad,.mpt-mdt.no-l .mk-lust,.mpt-mdt.no-w .mk-wait{display:none}
.mpt-mthen{cursor:pointer}
.mpt-mside{display:flex;flex-direction:column;gap:8px;min-width:0}
.mpt-mcard{position:relative;height:380px;overflow:auto;box-sizing:border-box;padding:10px 12px;background:var(--raised);border:1px solid var(--line2);border-radius:4px;font:500 13px/1.4 var(--body);color:var(--mpt-soft)}
.mpt-mcard p{margin:4px 0 0} .mpt-mcard b{color:var(--text)} .mpt .mpt-mc0{margin:0;color:var(--faint)}
.mpt-mch{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 4px} .mpt-mch > b{font:700 15px var(--body);color:var(--text)} .mpt-mch > span:last-child{color:var(--muted);font-size:12.5px}
.mpt .mpt-mcd{color:#ffb3ad} .mpt .mpt-mck{color:#d9c4ff} .mpt .mpt-mcm{color:var(--muted)} .mpt .mpt-mcn{color:#f2c46b} .mpt .mpt-mcl{color:#ffd166} .mpt .mpt-mcw{color:var(--muted)} .mpt .mpt-mco{color:#7ee08f}
.mpt .mpt-mck2{margin:10px 0 4px!important;font:700 11px var(--head);letter-spacing:.44px;text-transform:uppercase;color:var(--faint)}
.mpt-mcr{display:grid;grid-template-columns:82px minmax(0,1fr) auto;align-items:center;gap:8px;font-size:12.5px;margin:2px 0} .mpt-mcr span{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpt-mcr s{display:block;height:5px;border-radius:3px;background:rgba(255,255,255,.06);text-decoration:none} .mpt-mcr s i{display:block;height:5px;border-radius:3px;opacity:.85} .mpt-mcr b{text-align:right;font-weight:600} .mpt-mcr small{color:var(--muted);font-weight:500}
.mpt-mccd{display:flex;flex-wrap:wrap;gap:4px} .mpt-mccd span{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 7px;border:1px solid;border-radius:4px;font-size:12px;color:var(--mpt-soft)} .mpt-mccd i{width:6px;height:6px;border-radius:50%}
.mpt-mfl{list-style:none;margin:0;padding:0;max-height:300px;overflow:auto;border:1px solid var(--line2);border-radius:4px;position:relative}
.mpt-mfl li{display:grid;grid-template-columns:30px minmax(0,1fr) auto 38px 46px;align-items:center;gap:6px;margin:0;padding:6px 8px;border-top:1px solid var(--line);cursor:pointer;font:500 13px var(--body)} .mpt-mfl li:first-child{border-top:0}
.mpt-mfl li:hover,.mpt-mfl li.pk{background:rgba(255,255,255,.035)} .mpt-mfl li.hot{background:rgba(255,255,255,.07)} .mpt-mfl li:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.mpt-mic{white-space:nowrap} .mpt-mic i{font-style:normal;margin-left:4px} .mpt-mic .d{color:#ff8f87} .mpt-mic .k{color:#c39bff;font-weight:700} .mpt-mic .l{color:#ffd166}
.mpt-mstrip{margin-top:14px} .mpt-mstrip .mpt-blk[data-pi]{cursor:pointer} .mpt-mstrip .mpt-blk.hot{outline:2px solid var(--text);outline-offset:1px;z-index:2}
.mpt-mtips{margin:2px 0 0;padding-left:18px} .mpt-mtips li{margin:2px 0} .mpt .mpt-mcv{color:var(--mpt-soft)} .mpt .mpt-mca{color:#f2c46b}
.mpt-mdr ol{margin:2px 0 0;padding-left:18px;font-size:12.5px} .mpt-mdr li{margin:2px 0} .mpt-mdr{padding-top:2px;border-top:1px solid var(--line);margin-top:8px}
.mpt .mpt-mhint{margin:8px 0 0;font:500 12px var(--body);color:var(--faint)}
.mpt-fxgo{margin-left:8px;font:600 12.5px var(--body)!important;color:var(--mpt-you)!important;white-space:nowrap}
.mpt-chap > .mpt-rpl{margin:0 0 10px}
@media (max-width:820px){ .mpt-mgrid{grid-template-columns:minmax(0,1fr)} .mpt-mfl{max-height:none} .mpt-mcard{height:auto;min-height:150px} .mpt-mstep span{min-width:110px} }
.mpf-dgh{border-top:1px solid var(--line)} .mpf-dgh > summary{display:flex;justify-content:space-between;align-items:baseline;gap:2px 12px;flex-wrap:wrap;padding:9px 2px;cursor:pointer;list-style:none}
.mpf-dgh > summary::-webkit-details-marker{display:none} .mpf-dgh > summary > b{font:700 14.5px var(--body);color:var(--text)} .mpf-dgh > summary > span{font:500 12.5px var(--body)}
.mpf-dgh .mpf-l{margin:0 0 6px} .mpt .mpf-none{margin:0 0 10px 2px;font:500 12.5px var(--body);color:var(--faint)} .mpt .mpf-showm{margin:0 0 10px 2px;font:600 12.5px var(--body)}
.mpf-pp small{color:var(--faint);font-weight:500} .mpt .mpf-add{margin:0 0 12px}
.mpf-home{max-width:1120px;margin:0 auto;padding:34px var(--gmin,16px) 48px;display:flex;flex-direction:column;gap:34px} /* (Home's page spacing, under its own name: the raid side reads th-home2 as Home) */
@media (max-width:640px){ .mpf-home{padding-top:22px;gap:26px} }
.mpf-home .th-hero h1 .mpf-gold{color:var(--gold)} .mpf-home .mpf-card{position:relative;cursor:pointer} .mpf-home .mpf-card.on{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold) inset}
.mpf-home .mpf-strip{grid-template-columns:repeat(8,minmax(0,1fr))} .mpf-strip i.g{background:#7ee08f} .mpf-strip i.a{background:#f3c969} .mpf-strip i.m{background:#596070}
.mpf-prog{display:block;height:4px;margin-top:6px;border-radius:2px;background:#252a35;overflow:hidden} .mpf-prog i{display:block;height:100%;background:var(--gold);transition:width .4s}
.mpf-home .mpf-x{position:absolute;top:8px;right:10px;width:22px;height:22px;padding:0;border:0;border-radius:50%;background:none;color:var(--faint);font:600 16px/1 var(--body);cursor:pointer} .mpf-home .mpf-x:hover{color:var(--text);background:var(--raised)}
.mpf-home .mpf-addc .tt-l{max-width:240px;font-size:12.5px} .mpf-home .mpf-addf{margin-top:12px}
.mpf-home #mpfKeys{max-width:none;width:100%;align-self:stretch;margin:0;padding:0} .mpf-home .mpf-addf[hidden]{display:none} .mpf-keys{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:4px 18px 10px}
.mpf-keys .mpf-dgh{border-top:1px solid var(--line)} .mpf-keys .mpf-dgh:first-child{border-top:0} .mpf-dsum{display:flex;justify-content:space-between;align-items:baseline;gap:2px 12px;flex-wrap:wrap;padding:11px 0;cursor:pointer;list-style:none}
.mpf-dsum::-webkit-details-marker{display:none} .mpf-dsum > b{font:600 16px var(--head);color:#f3f5f9} .mpf-dg0 .mpf-dsum{cursor:default} .mpf-dg0 .mpf-dsum > b{color:var(--muted)} .mpf-dsum > span{font:500 13.5px var(--body)}
.mpf-kl{padding:0 0 8px 12px} .mpf .mpf-kr{display:grid;grid-template-columns:40px minmax(0,1fr) auto 46px auto;gap:12px;align-items:center;width:100%;margin:0;padding:6px 0;background:none;border:0;border-top:1px solid #20242e;border-radius:0;color:var(--text);text-align:left;cursor:pointer;font:inherit}
.mpf .mpf-kr:first-child{border-top:0} .mpf .mpf-kr:hover{background:rgba(255,255,255,.025)} .mpf .mpf-kr:focus-visible{outline:2px solid var(--gold);outline-offset:-2px}
.mpf-lv2{display:grid;place-items:center;width:40px;height:30px;border-radius:7px;border:1px solid var(--line2);font:700 15px var(--head);color:#c9ced8} .mpf-lv2.mpf-hi{border-color:var(--gold);color:#f6dc9a}
.mpf-kt{min-width:0;font:500 13.5px var(--body);color:#c9ced8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .mpf-kt small{color:var(--faint);font-size:12.5px} .mpf-res2{font:600 13.5px var(--head)} .mpf-dt2{color:var(--faint);font-size:13px;text-align:right}
.mpf-kr .mpf-op{pointer-events:none} .mpt .mpf-showm{margin:4px 0 2px;font:600 12.5px var(--body)} .mpf-home .mpf-foot2{margin:-18px 0 0;font:500 12.5px var(--body);color:var(--faint)}
@media (max-width:600px){ .mpf .mpf-kr{grid-template-columns:40px minmax(0,1fr) auto auto;gap:8px} .mpf-dt2{display:none} .mpf-kl{padding-left:0} .mpf-keys{padding:4px 12px 8px} }
`;
