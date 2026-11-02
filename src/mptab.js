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
const mpDung = (n) => { if (!n || !n.includes(' / ')) return n; const d = MP_DUNGEONS.find((x) => ((MP_KNOW[mpLc(x)] || {}).b || []).some(([b]) => n.includes(b))); return d || n; }; /* (a key an upload named by its bosses) */
const mpkGet = () => { try { const j = JSON.parse(store.get(MP_KEYK) || 'null'); if (j && j.chars) { j.added = j.added || []; j.addedChars = j.addedChars || []; for (const c of Object.values(j.chars)) for (const k of c.keys || []) k.boss = mpDung(k.boss); for (const k of j.added) k.boss = mpDung(k.boss); return j; } } catch (e) { /* (unreadable: start again) */ } return { chars: {}, added: [], addedChars: [] }; };
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
// (a key's result in words, as the verdict says it: "timed with 2:10 to spare" (to the limit of the level it got), "timed +2 with …", "over time by …",
// "left early")
const mpResWords = (k) => { const s = k.keyMs ? k.keyMs / 1000 : 0, tm = (window.DBF_MPTIMER || {})[mpLc(k.boss)]; if (!s) return 'left early'; if (!tm) return k.timed ? 'timed' : 'over time';
  const P = tm * 60, up = k.timed ? (k.up || mpUp(k)) : 0, lim = up === 3 ? P * 0.6 : up === 2 ? P * 0.8 : P; return up ? 'timed' + (up > 1 ? ' +' + up : '') + ' with ' + mpMM(lim - s) + ' to spare' : 'over time by ' + mpMM(s - P); };
// (last time on this dungeon: the viewer's own character in this key (the same pick as the tab's "open on you") and their key before this one on the
// same dungeon, from the key finder's saved keys; nothing is loaded. Nothing when there's no own character or no earlier key)
// (a new best (the studio's round, "celebrate wins, quietly"): a timed key that beat the character's best before it on this dungeon in the saved
// keys, a higher level or the same level with more time to spare; only when there was a key there before)
function mpNewBest(it, R, timed) { const me = mpMine(R); if (!me || !it.wallMs || !timed) return false; const g = mpkChars().find((c) => mpLc(c.name) === mpLc(me)); if (!g) return false;
  const d = mpLc(mpDung(it.boss)), w = it.wcl || {}, before = (((mpkGet().chars[g.id] || {}).keys) || []).filter((k) => mpLc(k.boss) === d && k.wallMs < it.wallMs - 60e3 && !(k.code === w.code && k.fight === w.fight));
  if (!before.length) return false; const b = before.filter((k) => k.timed && k.keyMs).sort(mpfBetter)[0]; if (!b) return true; const cur = { ...it, boss: mpDung(it.boss) };
  return it.level > b.level || (it.level === b.level && mpfSpare(cur) > mpfSpare(b)); }
function mpLastTime(it, R) { const me = mpMine(R); if (!me || !it.wallMs) return ''; const g = mpkChars().find((c) => mpLc(c.name) === mpLc(me)); if (!g) return '';
  const d = mpLc(mpDung(it.boss)), w = it.wcl || {}, prev = (((mpkGet().chars[g.id] || {}).keys) || []).filter((k) => mpLc(k.boss) === d && k.wallMs < it.wallMs - 60e3 && !(k.code === w.code && k.fight === w.fight)).sort((a, b) => b.wallMs - a.wallMs)[0];
  if (!prev) return ''; const now = mpResWords({ ...it, boss: mpDung(it.boss) });
  return '<p class="mpt-vd2">Last time on ' + esc(mpDung(it.boss)) + ' (+' + prev.level + ', ' + new Date(prev.wallMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '): ' + mpResWords(prev) + '. This one: +' + it.level + (/^timed with /.test(now) ? now.slice(5) : ', ' + now) + '.</p>'; }
function mpfByDungeon(rows, id, people) { const showWho = !!(people && people.length > 1), cc = new Map((people || []).map((p) => [p.name, p.cls ? mpCC(p.cls) : ''])), ccOf = (n) => cc.get(n);
  return MP_DUNGEONS.map((d) => { const L = rows.filter((r) => mpLc(r.it.boss) === mpLc(d)).sort((a, b) => mpfRank(a.it) - mpfRank(b.it) || b.it.level - a.it.level || b.it.wallMs - a.it.wallMs), sid = id + '-' + d.toLowerCase().replace(/[^a-z]+/g, ''), more = MPK.more.has(sid);
    const b = (L.find((r) => r.it.timed && r.it.keyMs) || L[0] || {}).it, br = b && mpfRes(b);
    if (!L.length) return '<div class="mpf-dgh mpf-dg0"><div class="mpf-dsum"><b>' + esc(d) + '</b><span class="mpt-m">No keys yet</span></div></div>';
    const pb = (L.filter((r) => r.it.timed && r.it.keyMs).sort((a, c) => mpfBetter(a.it, c.it))[0] || {}).it;
    const trend = '<span class="mpf-trend" aria-label="Last keys, oldest first">' + L.filter((r) => r.it.wallMs).sort((a, c) => a.it.wallMs - c.it.wallMs).slice(-5).map((r) => { const k = r.it, sec = k.keyMs ? k.keyMs / 1000 : 0, tm = (window.DBF_MPTIMER || {})[mpLc(k.boss)];
      return '<i class="' + (sec && k.timed ? ((k.up || mpUp(k)) >= 2 ? 'g' : 'a') : 'm') + '"' + mpT1(new Date(k.wallMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · +' + k.level + ' · ' + (sec ? mpMM(sec) + (tm ? ' of ' + tm + ':00' : '') : 'left early') + (k === pb ? ' · your best' : '')) + '>' + k.level + (k === pb ? '<b class="mpf-pb" aria-label="your best">★</b>' : '') + '</i>'; }).join('') + '</span>';
    return '<details class="mpf-dgh" id="' + sid + '" open><summary class="mpf-dsum"><b>' + esc(d) + '</b>' + trend + '<span><b class="' + br.c + '">+' + b.level + ' · ' + br.t + '</b> <span class="mpt-m">' + plural(L.length, 'key') + '</span></span></summary>' +
      '<div class="mpf-kl">' + L.slice(0, more ? L.length : 3).map((r) => mpfRow2(r, ccOf, showWho)).join('') + (L.length > 3 ? '<button type="button" class="linkbtn mpf-showm" data-mpfm="' + sid + '">' + (more ? 'Show fewer' : 'Show ' + (L.length - 3) + ' more') + '</button>' : '') + '</div></details>'; }).join(''); }
// (a character's own keys, one row each)
function mpkOwn(c, J) { const m = new Map(); for (const k of ((J.chars[c.id] || {}).keys || [])) { const it = { ...k, wcl: { code: k.code, fight: k.fight } }, id = mpkId(it), o = m.get(id); if (o) o.n++; else m.set(id, { it, n: 1, who: [c.name] }); } return [...m.values()]; }
// (a character's tile, Home's tt-card: the crest, the name in class colour, the class and guild, one square per dungeon (green timed +2/+3, amber +1,
// grey not timed, dark no key), the best key and how many dungeons timed, and the keys this season, or a gold bar with % and time left while it reads)
const mpfSpare = (it) => { const tm = (window.DBF_MPTIMER || {})[mpLc(it.boss)]; return tm && it.keyMs ? tm * 60 - it.keyMs / 1000 : 0; };
const mpfBetter = (a, b) => b.level - a.level || (b.up || 0) - (a.up || 0) || mpfSpare(b) - mpfSpare(a) || b.wallMs - a.wallMs; /* (highest, most levels up, most time to spare, newest) */
function mpfCard(c, J, on) { const rows = mpkOwn(c, J), cls = (E.CLASSES || {})[c.cls], per = MPK.busy && MPK.per && MPK.per[c.id];
  const best = MP_DUNGEONS.map((d) => { const L = rows.filter((r) => mpLc(r.it.boss) === mpLc(d)), t = L.filter((r) => r.it.timed && r.it.keyMs).sort((a, b) => mpfBetter(a.it, b.it))[0];
    return { d, t, any: L.length, st: t ? (t.it.up >= 2 ? 'g' : 'a') : L.length ? 'm' : '' }; });
  const strip = best.map((x) => '<i class="' + x.st + '"' + mpT1(esc(x.d) + ': ' + (x.t ? '+' + x.t.it.level + ', timed +' + (x.t.it.up || 1) : x.any ? 'not timed' : 'no key')) + '></i>').join('');
  const top = best.filter((x) => x.t).sort((a, b) => mpfBetter(a.t.it, b.t.it))[0], nT = best.filter((x) => x.t).length;
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
const mpMoreSet = (v) => { const box = document.getElementById('mptMoreRows'), b = document.querySelector('[data-mptmore]'); if (!box || !b) return; box.hidden = !v; b.textContent = v ? 'Show fewer' : 'Show ' + b.dataset.mptmore + ' more'; b.classList.toggle('on', !!v); };
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-mptmore]'); if (!b) return; const box = document.getElementById('mptMoreRows'); if (!box) return; const v = box.hidden; mpMoreSet(v); mpFoldSet('mptMoreRows', v); });
document.addEventListener('toggle', (e) => { const d = e.target; if (!d || !d.closest || !d.closest('.mpt')) return; if (d.id && /^mpt/.test(d.id)) mpFoldSet(d.id, d.open); if (d.open && d.querySelector('.mpt-strip')) try { mpLabelFit(); } catch (x) { /* (labels as drawn) */ } }, true);
// (the tab opens on you (the studio's item 19, Flex's plan): your character in this key, by your Home character, then your saved ones, then your
// sign-in ones, is picked in Player; a choice you make is kept for that key in this browser)
const mpMyNames = () => { const out = [], add = (n) => { if (n && !out.some((x) => mpLc(x) === mpLc(n))) out.push(n); };
  try { const me = typeof meOf === 'function' ? meOf() : null; if (me) add(me.name); } catch (e) { /* (no Home character) */ }
  try { for (const g of groups()) if (g.kind === 'char') add(g.name); } catch (e) { /* (no saved characters) */ }
  try { const w = WCL.HOSTED && typeof wclMe === 'function' ? wclMe() : null; for (const c of (w && w.chars) || []) add(c.n); } catch (e) { /* (not signed in) */ } return out; };
const mpMine = (R) => { const ppl = (R.people || []).map((p) => p.name); for (const n of mpMyNames()) { const m = ppl.find((x) => mpLc(x) === mpLc(n)); if (m) return m; } return ''; };
// (no pop-in (the studio's round): a part that waits on the fast run holds its place with a faint shimmering bar the size of what's coming, and
// fades in over 150 ms when it arrives)
const mpShim = (w, h) => '<span class="mpt-shim" style="width:' + w + (h ? ';height:' + h : '') + '" aria-hidden="true"></span>', mpFi = () => (MP.fade ? ' mpt-fadein' : '');
const mpPfi = () => (MP.pfade ? ' mpt-fadein' : '');
// (real parses (Flex: "ok yea then add it in"; only real parses get parse colours): a report key's bracketPercent, the parse at that key level
// against the same spec, in the site's parse colours; nothing for a key that wasn't timed, a log from a PC, or no answer)
const mpOrd = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const mpParseOf = (name, m) => { const P = MP.parse; if (!P || P.wait || !MP.item || P.k !== mpK(MP.item)) return null; const x = P[m] && P[m].get(name); return x && x.pct != null ? x : null; };
const mpPcTip = (x, p, R, m) => mpT1('<b>' + mpOrd(Math.round(x.pct)) + ' percentile</b> for ' + (m === 'hps' ? 'healing' : 'damage') + ' among ' + esc(p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || '')) + 's at +' + (x.lvl || R.run.level) + '.');
function mpParseLoad(it, R) { const k = mpK(it); if (MP.parse && MP.parse.k === k) return; const w = it.wcl, ok = !!(w && w.code && w.fight != null && WCL.loadParses && (it.timed || (R.run.clock && R.run.clock.up > 0)));
  MP.parse = { k, wait: ok }; if (!ok) return;
  Promise.all(['dps'].map((m) => WCL.loadParses(S.wclCreds, w.code, w.fight, m).catch(() => null))).then(([d]) => { if (!MP.parse || MP.parse.k !== k) return; MP.parse = { k, dps: d, fresh: true }; /* (DPS only (Flex: "DPS is usually the better number to look at for healers")) */
    if (MP.item && mpK(MP.item) === k && S.page === 'mplus') mpDraw(); }); }
const mpShimT = (t) => '<span class="mpt-shimt" aria-hidden="true">' + t + '</span>'; /* (a sentence's own length: it wraps like the words that come) */
// (each dungeon's art for the banner (banner v3, Flex: "add some flavor to the banner… dungeon graphics in the background"): the header image of its
// Wowhead dungeon overview guide (the page's og:image), loaded at runtime, never bundled; without it the banner looks as before)
const MP_ART = { 'altar of fangs': 'header/11c702265ad6f3432b6bc76bef19f5240b89b3f2', 'den of nalorakk': 'header/4bb1873c1337bf96894e1550415413ac9971b8be', 'kings\' rest': 'header/8ef12737a9541bc98b3c079e4c2e1095525a5ec7',
  'murder row': 'header/ca08a478dcdef236f2430780f555774df16920f0', 'ruby life pools': 'header/861750fe3cbf403821c43173d434f53aa1d90598', 'temple of sethraliss': 'header/53b6b49adb58de413ce2fe6dd04e8088bf39c1e6',
  'the blinding vale': 'seo/33193', 'voidscar arena': 'header/6fb807eef5c20427802397324585e56c166d6555' };
// (a key's points in the score colours (Flex: "this should be colored"): the game's own per-dungeon scale isn't public, so Raider.IO's season score tiers
// at points × 8, highest first, as score:colour)
const MP_TIERS = '4300:ff8000,4240:fe7e16,4215:fd7c23,4190:fc7a2c,4165:fa7735,4145:f9753d,4120:f87344,4095:f6714a,4070:f56f51,4045:f36d57,4025:f26a5d,4000:f06863,3975:ee6669,3950:ed646f,3925:eb6274,3905:e95f7a,3880:e75d7f,3855:e55b85,3830:e3598b,3805:e05790,3785:de5596,3760:dc539b,3735:d950a1,3710:d64ea6,3685:d34cac,3665:d04ab1,3640:cd48b7,3615:ca46bc,3590:c744c2,3565:c342c7,3545:bf40cd,3520:bb3ed2,3495:b73cd8,3470:b23add,3445:ae38e3,3425:a837e8,3400:a335ee,3360:9d3ded,3335:9643ec,3315:8f49ea,3290:884ee9,3265:8153e8,3240:7957e7,3215:715be5,3195:695ee4,3170:5f62e3,3145:5565e2,3120:4968e1,3095:3b6bdf,3075:286dde,3050:0070dd,2990:1d74d9,2965:2b78d5,2940:347cd1,2920:3c80cd,2895:4283c8,2870:4787c4,2845:4b8bc0,2820:4f8fbc,2800:5393b8,2775:5597b3,2750:589baf,2725:5a9fab,2700:5ba3a6,2680:5da8a2,2655:5eac9d,2630:5fb099,2605:5fb494,2580:5fb890,2560:5fbc8b,2535:5fc086,2510:5ec481,2485:5dc87c,2460:5ccc77,2440:5bd171,2415:59d56c,2390:56d966,2365:54dd60,2340:50e159,2320:4de652,2295:48ea4b,2270:43ee43,2245:3df239,2220:35f62e,2200:2cfb1f,2175:1eff00,2150:29ff0f,2125:32ff19,2100:3aff21,2075:40ff27,2050:46ff2d,2025:4cff32,2000:51ff37,1975:55ff3b,1950:5aff3f,1925:5eff43,1900:62ff47,1875:66ff4a,1850:6aff4e,1825:6dff51,1800:71ff55,1775:74ff58,1750:78ff5b,1725:7bff5e,1700:7eff61,1675:81ff65,1650:84ff68,1625:87ff6a,1600:8aff6d,1575:8dff70,1550:8fff73,1525:92ff76,1500:95ff79,1475:97ff7c,1450:9aff7e,1425:9cff81,1400:9fff84,1375:a1ff87,1350:a4ff89,1325:a6ff8c,1300:a9ff8f,1275:abff91,1250:adff94,1225:afff97,1200:b2ff99,1175:b4ff9c,1150:b6ff9e,1125:b8ffa1,1100:bbffa4,1075:bdffa6,1050:bfffa9,1025:c1ffab,1000:c3ffae,975:c5ffb1,950:c7ffb3,925:c9ffb6,900:cbffb8,875:cdffbb,850:cfffbd,825:d1ffc0,800:d3ffc2,775:d5ffc5,750:d7ffc7,725:d9ffca,700:dbffcd,675:ddffcf,650:dfffd2,625:e1ffd4,600:e3ffd7,575:e4ffd9,550:e6ffdc,525:e8ffde,500:eaffe1,475:ecffe3,450:edffe6,425:efffe8,400:f1ffeb,375:f3ffed,350:f5fff0,325:f6fff2,300:f8fff5,275:fafff7,250:fcfffa,225:fdfffc,200:ffffff'.split(',').map((x) => x.split(':')), mpScoreCol = (pts) => { const v = pts * 8; for (const [sc, c] of MP_TIERS) if (v >= +sc) return '#' + c; return '#9d9d9d'; };
// (what the run added for the viewer's own character (Flex: "a (+X) showing how much the player gained from that specific run"): this run's points
// less their best on this dungeon before it in the key finder's saved keys (Midnight keeps one score a dungeon); their first known key there counts
// whole. Nothing without an own character)
function mpGain(it, R, pts) { const me = mpMine(R); if (!me || !it.wallMs) return null; const g = mpkChars().find((c) => mpLc(c.name) === mpLc(me)); if (!g) return null;
  const dn = mpDung(it.boss), d = mpLc(dn), w = it.wcl || {}, tm = (window.DBF_MPTIMER || {})[d]; if (!tm) return null;
  const prev = (((mpkGet().chars[g.id] || {}).keys) || []).filter((k) => mpLc(k.boss) === d && k.wallMs < it.wallMs - 60e3 && !(k.code === w.code && k.fight === w.fight) && k.timed && k.keyMs && k.level >= 12)
    .map((k) => ({ k, p: mpPts(k.level, k.keyMs / 1000, tm * 60) })).sort((a, b) => b.p - a.p)[0];
  if (!prev) return { x: Math.round(pts), tip: '<b>+' + Math.round(pts) + '</b><br>Your first ' + esc(dn) + ' key that Debrief has seen, so all of it counts. Keys we haven\'t seen aren\'t counted.' };
  const x = Math.max(0, Math.round(pts - prev.p)), day = new Date(prev.k.wallMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { x, tip: '<b>+' + x + '</b><br>vs your best ' + esc(dn) + ' key before this one: +' + prev.k.level + ' on ' + day + ' (' + Math.round(prev.p) + ' points). Keys we haven\'t seen aren\'t counted.' }; }
const MP_PPK = 'mpt-pp', mpPPGet = () => { try { return JSON.parse(localStorage.getItem(MP_PPK) || '{}') || {}; } catch (e) { return {}; } };
function mpDraw() {
  const it = MP.item, R = it && MP.R[mpK(it)], b = $('#mptBody'); if (!R || !b || S.page !== 'mplus') return;
  if (MP.ppK !== mpK(it)) { MP.ppK = mpK(it); const v = mpPPGet()[MP.ppK]; MP.pp = v != null ? v : mpMine(R); }
  const fx = MP.fastOf && MP.fastOf.k === mpK(it) ? MP.fastOf : null;
  const was = [...b.querySelectorAll('details[id][open]')].map((d) => d.id); /* (a section you opened stays open when the fast run arrives) */
  mpParseLoad(it, R); MP.pfade = !!(MP.parse && MP.parse.fresh);
  const wt = !fx || fx.wait; MP.fade = !wt && MP.shimK === mpK(it); /* (what waited on the fast run fades in once when it comes (no pop-in)) */
  b.innerHTML = mpHtml(it, R, fx); MP.shimK = wt ? mpK(it) : null; MP.fade = false; if (MP.parse) MP.parse.fresh = false; MP.pfade = false;
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
// (one short sentence, the action and the number that proves it; the full text in a small ⓘ (the studio's item 18, Flex: "yea do that"))
const mpNT = (s, full) => (s ? '<p class="mpt-nt"><b>Next time</b> ' + s + (full && full !== s ? ' ' + mpInfo(full) : '') + '</p>' : '');
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
  const pullLine = 'Pull it in fewer, bigger pulls. The fast run took it in ' + plural(fN, 'pull') + ', the biggest ' + fBig + ' enemies. You took ' + yN + (yc.length > 1 ? ' (' + Math.min(...yc) + ' to ' + Math.max(...yc) + ')' : '') + '.', pullS = 'Pull bigger: the fast run took this in ' + plural(fN, 'pull') + ', you took ' + yN + '.';
  if (sp.low > sp.more) { if (fewer) out.push([pullS, pullLine + ' Every AoE hits more enemies in a bigger pull.']); else { const top = mpGapTop(R, F, yp, fp); if (top.length) out.push(['More damage here: ' + mpGapWho(R, top), mpGapLine(R, F, yp, fp)]); } }
  else { const rt = R.route && R.route.ok ? R.route : null, frt = F.route && F.route.ok && rt && F.route.full === rt.full ? F.route : null;
    if (frt) { const share = (RR, rr, ps) => 100 * ps.reduce((a, p) => a + ((rr.pulls[RR.pulls.indexOf(p)] || {}).add || 0), 0) / rr.full; let best = null;
      for (const s2 of ST) { const f2 = s2 !== s && fBy.get(s2.boss); if (!f2) continue; const ys = share(R, rt, mpInSt(R, s2)), fs = share(F, frt, mpInSt(F, f2)); if (fs - ys >= 5 && (!best || fs - ys > best.d)) best = { s2, ys, fs, d: fs - ys }; }
      if (best) out.push(['Pull more before ' + esc(best.s2.boss) + ', so less is left after it: the fast run had ' + Math.round(best.fs) + '% by then, you had ' + Math.round(best.ys) + '%.', 'Pull more of the count before ' + esc(best.s2.boss) + ', so less is left after it. The fast run got ' + Math.round(best.fs) + '% ' + mpWhere(best.s2) + ', you got ' + Math.round(best.ys) + '%, so it had less to kill here.']); }
    if (fewer) out.push([pullS, pullLine]); }
  const lu = (RR, ps) => (RR.lust || []).some((l) => ps.includes(RR.pulls[l.pull])); /* (Lust only when the fast run used it here and you didn't) */
  if (lu(F, fp) && !lu(R, yp)) out.push(['The fast run used Lust here, you didn\'t.', 'The fast run used Lust here, you didn\'t.']);
  return out.length ? mpNT(out[0][0], out.map((x) => x[1]).join(' ')) : '';
}
// (a boss where lower damage is the bigger part: the one or two biggest gaps against the fast run's same spec, or tank against tank and healer
// against healer. Never against a player's own key average: a boss is always lower than AoE trash. Trash uses the same line when the pulls
// were already as big as the fast run's)
function mpNextBoss(R, F, yp, fp) {
  const sp = mpSplit(mpGrp(yp), mpGrp(fp)); if (!sp || sp.low <= sp.more || sp.low < 1) return ''; const top = mpGapTop(R, F, yp, fp); if (!top.length) return '';
  return mpNT('More damage on ' + esc((yp[0] || {}).boss || 'this boss') + ': ' + mpGapWho(R, top), mpGapLine(R, F, yp, fp));
}
function mpGapTop(R, F, yp, fp) {
  const rate = (ps, nm) => { let D = 0, T = 0; for (const p of ps) { D += ((p.dmg || {})[nm] || 0) * p.dur; T += p.dur; } return T ? D / T : 0; }, gaps = [];
  for (const p of R.people || []) { let m = (F.people || []).find((q) => q.spec === p.spec && q.cls === p.cls), lab = m ? 'the fast run\'s ' + esc(p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || '')) : '';
    if (!m && p.role !== 'dps') { m = (F.people || []).find((q) => q.role === p.role); lab = 'the fast run\'s ' + p.role; }
    if (!m) continue; const mine = rate(yp, p.name), theirs = rate(fp, m.name); if (theirs - mine > 0) gaps.push({ p, mine, theirs, lab, g: theirs - mine }); }
  return gaps.sort((a, b) => b.g - a.g).slice(0, 2); }
const mpGapWho = (R, top) => mpAnd(top.map((x) => mpWho(R, x.p.name))) + (top.length > 1 ? ' were' : ' was') + ' furthest behind the fast run.';
function mpGapLine(R, F, yp, fp) {
  const top = mpGapTop(R, F, yp, fp); if (!top.length) return '';
  // (Flex: "love these but the wording could use some work": who was furthest behind, then their DPS against the fast run's same spec, numbers bold)
  if (top.length === 1) { const x = top[0]; return mpWho(R, x.p.name) + ' was furthest behind the fast run here: <b>' + mpGF(x.mine) + '</b> DPS, against <b>' + mpGF(x.theirs) + '</b> from ' + x.lab + '.'; }
  return mpAnd(top.map((x) => mpWho(R, x.p.name))) + ' were furthest behind the fast run here. ' + top.map((x, k) => mpWho(R, x.p.name) + ' did <b>' + mpGF(x.mine) + '</b>' + (k ? '' : ' DPS') + ', against <b>' + mpGF(x.theirs) + '</b> from ' + x.lab + '.').join(' ');
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
  return out.length ? mpNT(out[0], out.join(' ')) : '';
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
  return { h: h + '</div>', nt: !free.length ? '' : mpNT('Pull sooner before ' + esc(mpPNs(R, free.map((p) => p.n))) + '.', 'Pull sooner before ' + esc(mpPNs(R, free.map((p) => p.n))) + '. Nobody was dead and no big cooldown went out when you pulled.') }; /* (the list, and its Next time line apart: the quick read shows the line, the list on a click) */
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
  /* (the result alone (the studio, Nov 2: the verdict line under the title has the time to spare or over): Timed +N, amber under 90 s to spare;
     Over time in red) */
  const sp = (v) => (v < 60 ? Math.round(v) + ' s' : mpMM(v)), lim = ck ? (ck.up === 3 ? ck.par * 0.6 : ck.up === 2 ? ck.par * 0.8 : ck.par) : 0;
  // (banner v3: identity only, over the dungeon's art: the level, the date and name, one result badge with the time and the points (coloured, with what
  // the run added) beside it, the affixes, and the five players with their spec icons; the verdict and the numbers sit under it)
  const res = run.left || !run.timeMs ? ['Left early', 'mpt-rl'] : ck && ck.up === 0 ? ['Over time', 'mpt-rb'] : ck ? ['Timed +' + ck.up, 'mpt-rt' + (ck.up === 3 ? ' mpt-glow' : '')] : run.timed ? ['Timed', 'mpt-rt'] : ['Over time', 'mpt-rb'];
  const ptsH = (() => { const rp = mpRating(R, ck, it); if (!rp) return ''; const col = mpScoreCol(rp.pts), g = rp.gain != null ? { x: Math.round(rp.gain), tip: rp.tip } : mpGain(it, R, rp.pts);
    return '<span class="mpt-bpts" style="color:' + col + '" tabindex="0"' + mpT1(rp.tip) + '>' + (rp.est ? '~' : '') + Math.round(rp.pts) + ' points</span>' + (g ? ' <span class="mpt-bgain" style="color:' + (g.x ? col : 'var(--muted)') + '" tabindex="0"' + mpT1(g.tip) + '>(+' + g.x + ')</span>' : ''); })();
  const art = MP_ART[mpLc(run.dungeon || mpDung(it.boss))], tmH = ck ? mpMM(ck.time) + ' of ' + mpMM(ck.par) : run.timeMs ? mpMM(run.timeMs / 1000) : '';
  const ban = '<div class="mpt-ban' + (art ? ' mpt-ban-art' : '') + '">' + (art ? '<div class="mpt-bart" style="background-image:url(https://wow.zamimg.com/uploads/guide/' + art + '.jpg)" aria-hidden="true"></div>' : '') + '<div class="mpt-kb">+' + run.level + '</div><div class="mpt-bt"><p class="mpt-k">Mythic+' + (date ? ' · ' + esc(date) : '') + '</p><h1>' + esc(run.dungeon || it.boss) + '</h1>' +
    '<div class="mpt-pills"><span class="mpt-res ' + res[1] + '">' + res[0] + '</span>' + (mpNewBest(it, R, !!(ck && ck.up > 0)) ? '<span class="mpt-pill mpt-best">★ New best on ' + esc(mpDung(it.boss)) + '</span>' : '') + '<span class="mpt-bmeta">' + [tmH ? esc(tmH) : '', ptsH].filter(Boolean).join(' · ') + '</span></div>' +
    /* (its affixes, each with a plain hover) */
    ((run.affixes || []).some((a) => MP_AFFIX[a]) ? '<div class="mpt-afx">' + run.affixes.filter((a) => MP_AFFIX[a]).map((a) => '<span class="mpt-af" tabindex="0"' + mpT1('<b>' + esc(MP_AFFIX[a][0]) + '</b><br>' + esc(MP_AFFIX[a][1])) + '>' + esc(MP_AFFIX[a][0]) + '</span>').join('') + '</div>' : '') +
    /* (the five players, each with their spec icon (Flex: "use spec icons for the classes"), in class colour) */
    '<div class="mpt-grp">' + R.people.slice().sort(mpByRole).map((p) => { const sid = mpSpecId(p.spec, p.cls), ic = typeof NDZ_SPECIC !== 'undefined' && NDZ_SPECIC[sid] ? NDZ_SPECIC[sid] : 'inv_misc_questionmark';
      return '<span class="mpt-gm" style="color:' + mpCC(p.cls) + '"' + mpT1(esc(p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || ''))) + '><img src="' + whIcon(ic) + '" alt="" loading="lazy" onerror="this.remove()"><b>' + esc(p.name) + '</b></span>'; }).join('') + '</div></div></div>';
  if (!C) return mpChap('mptC1', 'The key', '', ban + '<p class="mpt-note">' + (run.left || !run.timeMs ? 'This key was left before the end, so there\'s no timer to judge. Everything that happened is below.' : 'Debrief doesn\'t know this dungeon\'s timer yet. Everything that happened is below.') + '</p>' + mpBand(R, fx, '')) + mpJumpBar(R, false) +
    mpChap('mptCM', 'Your key on the map', 'every pull, and where the mistakes were', mpRPFold(R, null, mpMapHtml(R, null, ''))) + mpChap('mptC4', 'Your group', 'kicks, deaths and each player', mpGroup(R, fx, waiting)) + mpChap('mptC5', 'Know this dungeon', 'for your next key', mpKnowHtml(R, true));
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
  const ntSeen = new Set(), ntSame = (h) => { const m = /^(<p class="mpt-nt"><b>Next time<\/b> )([^:<]{3,40}): /.exec(h || ''); if (!m) return h; if (ntSeen.has(m[2])) return h.replace(m[0], m[1] + 'Same here: '); ntSeen.add(m[2]); return h; }; /* (two rows with the same action: the second says "Same here") */
  const fxRow = (f, i, fix) => { const nt = ntSame(f.nt || (f.c === 'kick' && f.sp ? mpNextKick(R, f.sp) : '')) || (f.c === 'death' ? '<p class="mpt-nt mpt-ntd">' + f.d + '</p>' : '');
    const full = ((/ data-tt="([^"]*)"/.exec(nt || '') || [])[1] || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&amp;/g, '&'); /* (the ⓘ's words) */
    const more = (f.c === 'death' ? '' : '<p>' + (full || f.d) + '</p>') + (f.g || ''), badge = '<span class="mpt-fxn mpt-c-' + (f.c || 'none') + '">' + (i + 1) + '</span>';
    const right = '<span class="mpt-fxs">' + (f.s ? (fix ? '<b class="mpt-g">−' + mpMM(f.s) + '</b>' : '<b class="' + mpSz(f.s) + '">' + mpMM(f.s) + '</b>') + (f.plus ? '<small>' + f.plus + '</small>' : '') : f.n ? '<b class="mpt-ab">' + f.n + '</b><small>went off</small>' : '<b class="mpt-m">' + f.ns + '</b>') + '</span>';
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
  // (one verdict under the key's title (the studio's tidy-pass.md item 6): timed or over, then how far behind a typical fast run and the biggest part of it,
  // from the timer and the first row of Where your time went)
  const keyLine = (() => { const lim0 = ck.up === 3 ? P * 0.6 : ck.up === 2 ? P * 0.8 : P; let v = ck.up > 0 ? 'Timed +' + ck.up + ' with <b>' + mpMM(lim0 - T) + '</b> to spare.' : 'Over time by <b>' + mpMM(T - P) + '</b>.';
    if (!F || !FC) return '<p class="mpt-vd">' + v + (waiting ? ' ' + mpShimT('You were 0:00 behind a typical fast run, the biggest part (0:00) on the trash between ' + esc(mpStretches(R, C).map((x) => x.name.replace(' → ', ' and ')).sort((x, y) => y.length - x.length)[0] || 'the two bosses') + '.') : '') /* (the placeholder as long as the key's longest stretch, so it wraps like the real line) */ + '</p>'; const gap = T - FC.ck.time;
    if (gap > 5) { const ST = mpStretches(R, C), fBy = new Map(mpStretches(F, FC).map((x) => [x.boss, x])), L = [];
      for (const x of ST) { const y = fBy.get(x.boss); if (!y) continue; L.push({ s: x.trash - y.trash, w: x.name.startsWith('Start → ') ? 'on the trash before ' + esc(x.boss) : 'on the trash between ' + esc(x.name.split(' → ')[0]) + ' and ' + esc(x.boss) }, { s: x.bossT - y.bossT, w: 'on ' + esc(x.boss) }); }
      L.push({ s: ck.between - FC.ck.between, w: 'standing between pulls' }, { s: ck.deathCost - FC.ck.deathCost, w: 'on deaths' });
      const top = L.filter((x) => x.s >= 15).sort((a, b) => b.s - a.s)[0];
      v += ' <span class="mpt-vdb' + mpFi() + '">You were <b>' + mpMM(gap) + '</b> behind a typical fast run' + (top ? ', ' + (top.s >= gap / 2 ? 'most of it' : 'the biggest part') + ' (<b>' + mpMM(Math.min(top.s, gap)) + '</b>) ' + top.w : '') + '.</span>'; }
    else if (gap < -5) v += ' <span class="mpt-vdb' + mpFi() + '">You were <b>' + mpMM(-gap) + '</b> ahead of a typical fast run.</span>';
    return '<p class="mpt-vd">' + v + '</p>'; })();
  const fixes = waiting && tgt != null ? '<section class="mpt-fx mpt-fxw" aria-busy="true"><div class="mpt-fxh"><h2>' + head + '</h2><span>' + mpShim('min(22em, 90%)') + '</span></div><div class="mpt-fxwb">' + mpShim('100%', '10px') + '<br>' + mpShim('min(30em, 90%)') + '</div>' +
      [0, 1, 2].map(() => '<div class="mpt-fxr mpt-fxr0">' + mpShim('22px', '22px') + '<div>' + mpShim('min(15em, 70%)') + '<br>' + mpShim('min(24em, 92%)') + '</div>' + mpShim('3.4em') + '</div>').join('') + '</section>'
    : went ? '<section class="mpt-fx' + mpFi() + '"><div class="mpt-fxh"><h2>Where your ' + mpMM(T - fT0) + ' went</h2>' + mpInfo('The ' + mpMM(T - fT0) + ' you were behind the fast run, split by cause. Hover a piece of the bar for more.' + (gLine ? '<br><br>' + gLine : '') + '<br><br>Click a row for the numbers behind it.') +
    '<span>A typical fast run took <b>' + mpMM(fT0) + '</b>. You needed to be <b>' + mpMM(need) + '</b> faster ' + (lv === 0 ? 'to time it' : 'for +' + (lv + 1)) + (ck.deathCost ? ', and your deaths only cost <b>' + mpMM(ck.deathCost) + '</b>.' : ', and you had no deaths.') + '</span></div>' + sbar +
    /* (the polish pass: each badge in its cause's colour, the seconds by size (60 s red, 20 s amber, less grey), a kick by how often it went off) */
    fxRows(went, false) + '</section>' :
    '<section class="mpt-fx' + mpFi() + '"><div class="mpt-fxh"><h2>' + head + '</h2><span>' + (tgt != null ? 'You needed <b>' + plural(need, 'second') + '</b>.' + (verdict ? ' ' + verdict : '') : 'You got +3. These would still save time.') + '</span></div>' +
    (FIX.length ? fxRows(FIX, true)
      : '<p class="mpt-none">No deaths, and no must-kick cast went off with a kick ready. The time is in the pulls and the walking between them' + (F ? ': see where you fell behind below.' : '.') + '</p>') + '</section>';
  // slim tiles
  const thN = R.pulls.reduce((a, p) => a + p.through.length, 0), fT = FC ? FC.ck.time : null;
  /* (four tiles (the "easier on the eyes" round): deaths and standing are in the top box and the stretch rows, so Lust takes their place;
     group DPS joined them (Nov 2)) */
  const LU = R.lust || [], yG = mpGrp(R.pulls), fGr = F ? mpGrp(F.pulls) : null, gdp = fGr && fGr.r ? Math.round(100 * (yG.r / fGr.r - 1)) : null;
  // (layout v3: the numbers as one faint line under the verdict, bold numbers, instead of the tiles; the time and the gap are in the verdict)
  const stats = '<p class="mpt-stl">' + [yG.r ? '<b>' + mpGF(yG.r) + '</b> group DPS' + (gdp == null ? (waiting ? ', ' + mpShim('9em') : '') : '<span class="mpt-fv' + mpFi() + '">, ' + (gdp ? Math.abs(gdp) + '% ' + (gdp < 0 ? 'less' : 'more') + ' than the fast run' : 'the same as the fast run') + '</span>') : '',
    '<b' + (thN ? ' class="mpt-bad"' : '') + '>' + thN + '</b> ' + (thN === 1 ? 'cast' : 'casts') + ' went off with a kick ready',
    LU.length ? 'Lust <b>' + plural(LU.length, 'time') + '</b> (' + esc([...new Set(LU.map((l) => mpPullName(R, l.pull)))].join(', ')) + ')' : 'No Lust'].filter(Boolean).join(' · ') + '</p>';
  /* (the tiles moved up under the banner, so the result is read first (the chapters round; it changes the round-3 order Flex approved, and he
     saw it in the mock)) */
  const behind = F ? (T - fT > 5 ? 'bad' : T - fT < -5 ? 'good' : '') : '';
  /* (the quick read: chapter 2 is "Fix these first"; chapter 3 is one sentence with the route and the pulls a click away) */
  const bh = {}, behindH = mpBehind(R, C, F, FC, fx, waiting, bh); /* (the map-first round: the map is chapter 2, with the timeline lanes under it) */
  // (layout v3: a band in the key's panel, Your part on the left and Fix these first on the right, shown once; the old chapter below the map is gone)
  const band = mpBand(R, fx, '<p class="mpt-chk' + (behind ? ' mpt-chk-' + behind : '') + '">Fix these first' + (F ? '<span>against a typical fast run</span>' : '') + '</p>' + fixes + behindH);
  return mpChap('mptC1', 'The key', '', ban + '<div class="mpt-ksum">' + keyLine + stats + mpLastTime(it, R) + '</div>' + band) + mpJumpBar(R, true) + mpChap('mptCM', 'Your key on the map', 'every pull, and where the mistakes were', mpRPFold(R, F, mpMapHtml(R, F, bh.tl))) +
    mpChap('mptC4', 'Your group', 'kicks, deaths and each player', mpGroup(R, fx, waiting)) + mpChap('mptC5', 'Know this dungeon', 'for your next key', mpKnowHtml(R, true));
}
// (five chapters (Nov 2, the Design studio's chapters.md, Flex: "the page is lacking depth. Maybe find a way to separate the information so its
// more readable in sections", then "does it have depth like my other pages do?"): each one the site's own panel, the finish Debriefing's panels
// have, opening with a small grey label and a sub-line; a 6 px square only when the chapter has a verdict (behind red, ahead green))
const mpChap = (id, k, sub, body, dot) => (body ? '<div class="mpt-chap" role="region" aria-label="' + k + '" id="' + id + '"><p class="mpt-chk' + (dot ? ' mpt-chk-' + dot : '') + '">' + k + (sub ? '<span>' + sub + '</span>' : '') + '</p>' + body + '</div>' : ''); /* (a div: the site's type scale resizes text in a section inside a section) */
// (the jump bar between chapter 1 and 2 (the Design studio's round 4, by chapter since Nov 2): it sticks under the site's tab bar while you scroll)
// (chapter 3 in the quick read: one sentence, how many packs and pulls and where you reached 100%, then the route and the pulls a click away)
function mpRPFold(R, F, map) {
  // (the map's first line, faint (the studio's tidy-pass.md item 6): your pulls and how many chained, the fast run's, where you reached 100%, and where
  // the count ended, yours and the fast run's)
  const rt = R.route && R.route.ok ? R.route : null, tr = R.pulls.filter((p) => !p.boss), ch = tr.length - mpChainN(R, tr), bits = [plural(tr.length, 'pull') + (ch ? ' (' + ch + ' chained)' : '')];
  if (F) bits.push('fast run ' + mpPacks(F, true));
  if (rt) { let t = 0; for (let k = 0; k < rt.pulls.length; k++) { t += rt.pulls[k].add; if (t >= rt.full * 0.9995) { const nx = R.pulls.slice(k + 1).find((p) => p.boss), pv = R.pulls.slice(0, k).reverse().find((p) => p.boss);
        bits.push('100% ' + (R.pulls[k].boss ? 'at ' + esc(R.pulls[k].boss) : nx ? 'before ' + esc(nx.boss) : pv ? 'after ' + esc(pv.boss) : 'in pack ' + R.pulls[k].n)); break; } }
    const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '') + '%', fr = F && F.route && F.route.ok && F.route.full === rt.full ? F.route : null;
    if (R.run.timeMs && !R.run.left) bits.push('ended at ' + f1(100 * rt.total / rt.full) + (fr ? ' (fast run ' + f1(100 * fr.total / fr.full) + ')' : '')); }
  return '<p class="mpt-rpl mpt-meta">' + bits.join(' · ') + '</p>' + (map || '');
}
// (the band: Your part beside Fix these first (layout v3); Your part alone when the key has no timer)
const mpBand = (R, fx, right) => '<div class="mpt-band' + (right ? '' : ' mpt-band1') + '" id="mptBand"><div class="mpt-bl">' + mpPartHtml(R, fx, MP.pp) + '</div>' + (right ? '<div class="mpt-br">' + right + '</div>' : '') + '</div>';
const mpJumpBar = (R, tl) => '<nav class="mpt-jb" aria-label="Jump to">' + [['mptBand', 'Debrief'], ['mptCM', 'Map'], ['mptC4', 'Your group'], MP_KNOW[mpLc(R.run.dungeon)] ? ['mptC5', 'Dungeon'] : null].filter(Boolean).map(([id, l]) => '<button type="button" data-mptj="' + id + '">' + l + '</button>').join('') + '</nav>';
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-mptj]'); if (!b) return; e.preventDefault(); const s = document.getElementById(b.dataset.mptj); if (!s) return;
  if (s.tagName === 'DETAILS') s.open = true; /* (a folded section opens first) */
  else { const f = s.querySelectorAll(':scope > details.mpt-fold'); if (f.length === 1 && s.children.length === 2) f[0].open = true; } /* (a chapter that's one folded part, Know this dungeon, opens it) */
  s.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
// (what "a typical fast run" is, for the line under the timeline and the hovers: the middle of the 20 fastest, or of as many as there are)
const mpTypical = (R, fx) => { const n = (fx && fx.list && fx.list.n) || 0; return 'the middle of this season\'s ' + (n >= 20 || !n ? '20' : n) + ' fastest timed +' + R.run.level + ' ' + esc(R.run.dungeon) + ' runs' + (n && n < 20 ? ' (only ' + n + ' so far)' : ''); };
const mpPullName = (R, k) => { const p = R.pulls[k]; return p ? (p.boss ? p.boss : 'pull ' + mpNo(R, p.n)) : ''; };
// (a player's big cooldowns over the key (Nov 1): how many, and how many went on the 3 biggest trash pulls, by what they counted toward the 100%
// or else the damage the group took; the hover lists each one's pulls)
const mpCdN = (R, p) => { if (!(R.cdWho || []).includes(p.name)) return null;
  /* (the 3 biggest pulls by chain: packs pulled one after another count as one pull (the studio's audit of the pull split)) */
  const l = (R.cds || {})[p.name] || [], rt = R.route && R.route.ok ? R.route : null, ch = mpChains(R), byC = new Map();
  R.pulls.forEach((q, k) => { if (q.boss) return; const o = byC.get(ch[k]) || { ks: [], v: 0 }; o.ks.push(k); o.v += rt ? rt.pulls[k].add : (R.taken || [])[k] || 0; byC.set(ch[k], o); });
  const big = new Set([...byC.values()].sort((a, b) => b.v - a.v).slice(0, 3).flatMap((x) => x.ks)), by = new Map(); for (const x of l) by.set(x.spell, (by.get(x.spell) || []).concat(mpPullName(R, x.pull)));
  return { n: l.length, on: l.filter((x) => big.has(x.pull)).length, tip: l.length ? '<b>Big cooldowns</b><br>' + [...by].map(([s, ps]) => '<b>' + esc(s) + '</b>: ' + esc([...new Set(ps)].join(', '))).join('<br>') : 'No big cooldown pressed.' }; };
// (a section: its title, one plain headline sentence, then the body. Pulls, Kicks and Players start folded to that sentence with a Show pill;
// a chart's title has a small ⓘ. The Design studio's "easier on the eyes" round, Flex: "i dont know what im looking at looking at the charts,
// maybe giving them some tooltips". Hovers use the site's own look: data-tt, shown on hover, focus or a tap)
const mpT1 = (h) => ' data-tt="' + esc(h) + '"';
const mpInfo = (t) => '<span class="ds-i mpt-i" tabindex="0" role="note" aria-label="How to read it"' + mpT1(t) + '>ⓘ</span>';
const mpSec = (t, line, body, id, o) => { o = o || {}; const h = (o.noTitle ? '' : '<h2>' + t + '</h2>') + (o.tip ? mpInfo(o.tip) : '') + (line ? '<span class="mpt-hl">' + line + '</span>' : ''); /* (noTitle: a chapter with this one part says its name already) */
  return o.fold ? '<details class="mpt-sec mpt-fold"' + (id ? ' id="' + id + '"' : '') + (o.open ? ' open' : '') + '><summary class="mpt-sh' + (o.noTitle ? ' mpt-sh0' : '') + '">' + h + '<span class="mpt-chev" aria-hidden="true"></span></summary><div class="mpt-fb">' + body + '</div></details>'
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
    return blocks.map((b) => '<i class="mpt-blk' + (b.p.boss ? ' mpt-bo' : '') + '" data-run="' + (fr ? 'fast' : 'you') + '" data-pi="' + RR.pulls.indexOf(b.p) + '" style="left:' + X(b.x) + ';width:' + W(b.w) + '"' + mpT1((fr ? '<span class="sub">Fast run</span><br>' : '') + mpPullTip(RR, RR.pulls.indexOf(b.p))) + '></i>').join('') +
      RR.pulls.map((p) => { if (!(p.through || []).length) return ''; const m = new Map(); for (const x of p.through) { const o = m.get(x.spell) || { n: 0, who: new Set() }; o.n++; if (x.who) o.who.add(x.who); m.set(x.spell, o); } /* (a cast that went off with a kick ready: a purple ! over the pull (the studio's 15b)) */
        return '<i class="mpt-ktk" style="left:' + X(CC.tv((p.s + p.e) / 2)) + '"' + mpT1([...m].map(([sp, o]) => '<b>' + esc(sp) + '</b>' + (o.n > 1 ? ' ×' + o.n : '') + (o.who.size ? ', kick ready: ' + [...o.who].map(esc).join(', ') : '')).join('<br>')) + '>!</i>'; }).join('') +
      dticks.map((t) => '<i class="mpt-dth" style="left:' + X(t.x) + ';width:' + W(CC.pen) + '"' + mpT1('<b>' + (fr ? 'Fast run: ' : '') + esc(t.d.who) + ' died</b>' + (t.d.to && t.d.to !== 'unknown' ? ' to ' + esc(t.d.to) : '') + ': +' + Math.round(CC.pen) + ' s on the timer.') + '></i>').join('') +
      (RR.lust || []).map((l) => '<i class="mpt-lst" style="left:' + X(CC.tv(l.t)) + '"' + mpT1('<b>' + (fr ? 'Fast run\'s Lust' : 'Lust') + '</b>' + (l.spell ? ' (' + esc(l.spell) + ')' : '') + ', ' + esc(mpPullName(RR, l.pull)) + '.') + '></i>').join(''); }; /* (each Lust where it went out (Nov 1)) */
  const youLane = '<div class="mpt-lt">' + lane(R, C, false) +
    CP.map((c) => '<span class="mpt-cp" style="left:' + X(c.you) + '"' + mpT1('<b>' + esc(c.boss) + ' down</b> at ' + mpMM(c.you) + (c.fast != null ? ', ' + (c.you >= c.fast ? mpMM(c.you - c.fast) + ' behind' : mpMM(c.fast - c.you) + ' ahead of') + ' the fast run.' : '.')) + '><i></i></span>').join('') + '</div>';
  const fDia = F ? CP.filter((c) => c.fast != null).map((c) => '<span class="mpt-cp mpt-f" style="left:' + X(c.fast) + '"' + mpT1('<b>Fast run: ' + esc(c.boss) + ' down</b> at ' + mpMM(c.fast) + '.') + '><i></i></span>').join('') : '';
  /* (the grey bar only when the fast run's pulls can't be read) */
  const fastLane = F && (F.pulls || []).length ? '<div class="mpt-lt mpt-ltf' + mpFi() + '">' + lane(F, FC, true) + fDia + '</div>'
    : F ? '<div class="mpt-lt"><i class="mpt-fbar" style="width:' + W(FC.ck.time) + '"' + mpT1('<b>A typical fast run</b>: ' + mpTypical(R, fx) + '. It finished at ' + mpMM(FC.ck.time) + '. Its pulls couldn\'t be read.') + '></i>' + fDia + '</div>'
    : waiting ? '<div class="mpt-lt mpt-ltw" aria-label="Finding a typical fast run">' + mpShim('72%') + '</div>' : '<div class="mpt-lt mpt-lt0"><span>No public fast run at this level yet.</span></div>';
  const fNote = F && (F.pulls || []).length ? ' It finished at ' + mpMM(FC.ck.time) + '. Same colours as yours, faded.' + (!(F.lust || []).length ? ' Lust isn\'t shown for the fast run: none was found in its log.' : '') : '';
  const marks = '<div class="mpt-mk">' + [[0.6, '+3'], [0.8, '+2'], [1, '+1']].map(([f, l]) => '<span style="left:' + X(ck.par * f) + '"' + mpT1('Finish before <b>' + mpMM(ck.par * f) + '</b> for ' + l + '.') + '>' + l + ' · ' + mpMM(ck.par * f) + '</span>').join('') + '</div>';
  const lines = [0.6, 0.8, 1].map((f) => '<i class="mpt-vl" style="left:' + X(ck.par * f) + '"></i>').join('');
  let lastX = -99, row = 0, rows = 1; const rowOf = CP.map((c) => { const x = 100 * c.you / W0; row = x - lastX < 13 ? 1 - row : 0; lastX = x; rows = Math.max(rows, row + 1); return row; }); /* (bosses close together: their labels take turns on two rows) */
  const gapRow = '<div class="mpt-gp" style="--mpt-gph:' + 40 * rows + 'px">' + CP.map((c, i) => '<span style="left:' + X(c.you) + ';--mpt-gpt:' + 40 * rowOf[i] + 'px"><b>' + esc(c.boss) + '</b>' + mpMM(c.you) + (c.fast != null ? ' · <b class="' + (i === CP.length - 1 && c.you > c.fast ? 'mpt-bad' : '') + '">' + (c.you >= c.fast ? mpMM(c.you - c.fast) + ' behind' : mpMM(c.fast - c.you) + ' ahead') + '</b>' : '') + '</span>').join('') + '</div>';
  const timeline = '<div class="mpt-tl"><div class="mpt-tlg">' + marks + '<div class="mpt-lanes">' + lines + '<div class="mpt-ln"><span class="mpt-ll">You' + mpInfo('<b>The timeline</b><br>Blue: a pull. Gold: a boss fight.' + (C.pen ? ' Red: a death, +' + Math.round(C.pen) + ' s on the timer.' : '') + ' ◇: a boss down. Gold line: Lust. Purple !: a cast went off with a kick ready.' + (F ? ' The fast run\'s lane is the same, faded.' : '')) + '</span>' + youLane + '</div><div class="mpt-ln"><span class="mpt-ll"' + mpT1('<b>A typical fast run</b>: ' + mpTypical(R, fx) + '.' + fNote) + '>Fast run</span>' + fastLane + '</div></div>' + gapRow + '</div>' +
    '</div>'; /* (the legend moved into the ⓘ by "You" (the studio's tidy-pass.md item 8)) */
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
  if (out) { out.tl = timeline; /* (the lanes and their key moved under the map (the map-first round)) */
    /* (the cut, Nov 2: one sentence under the bar, the numbers folded) */
    /* (Flex's "go", Nov 2: no sentence under the leak rows when there's a fast run; it repeated row 1 and the verdict with a second number) */
    return (F ? '' : line ? '<p class="mpt-why mpt-why1">' + line + '</p>' : '') + '<details class="mpt-sub" id="mptStr"><summary>The numbers, stretch by stretch</summary>' + why + src + '</details>'; }
  return mpSec('Where you fell behind', line, (out ? '' : timeline) + '<details class="mpt-sub" id="mptStr"><summary>Stretch by stretch</summary>' + why + (sum ? '<p class="mpt-why">' + sum + '</p>' : '') + src + '</details>', 'mptTl',
    { tip: F || waiting ? '<b>How to read it</b><br>Your key and a typical fast run on the same timer, left to right. Where your line runs longer, you were slower. Hover any piece for what it is.' : '<b>How to read it</b><br>Your key on its timer, left to right. Hover any piece for what it is.' });
}
// (one Pulls list (Nov 1, the Design studio's round 4, Flex: "Yes, build both"): pull by pull, the route's side by side and the deaths in one
// list, grouped by stretch (up to each boss kill), with the fast run's pulls in that stretch beside it. A row opens for its deaths in order, what
// went off with a kick ready, Lust and big cooldowns. Enemies something summoned (a Magma Totem, a player's guardian) aren't counted in what you
// pulled. Each row is #mpt-pull-N for the map's dots, and MP.pinfo has each pull's card)
// (one pull's tags (Nov 2, the Design studio's tidy-pass.md and its item 15, Flex: "is there a way to put this information into the map tooltips
// when hovering over the pulls?"): each death by name, each cast that went off with a kick ready, Lust, enemy buffs and who didn't press a big
// cooldown, each in its colour. The same in the Pulls list, the map's hover, the tiles and the timeline)
const mpCdMiss = (RR, i) => { const ci = mpChainOf(RR, i); if (ci[0] !== i || ci.reduce((a, k) => a + RR.pulls[k].dur, 0) < 45) return []; /* (judged on a chain's first pack, never under 45 s) */
  const s0 = RR.pulls[ci[0]].s - 3, e0 = RR.pulls[ci[ci.length - 1]].e + 1, act = (RR.cdWho || []).filter((nm) => ((RR.cds || {})[nm] || []).length);
  return act.filter((nm) => !RR.cds[nm].some((x) => x.t >= s0 && x.t <= e0)); }; /* (by the chain's own time, from 3 s before it to 1 s after, as the pull card counts) */
function mpPullTags(RR, i) {
  const p = RR.pulls[i], out = [], wipe = !!mpWipe(p, Math.max(1, (RR.people || []).length)), t = (txt, cls, tip) => out.push('<span class="mpt-tg2' + (cls ? ' ' + cls : '') + '"' + (tip ? mpT1(tip) : '') + '>' + txt + '</span>');
  const en = (n) => plural(n, 'enemy').replace(/enemys$/, 'enemies'), who = (L, sp) => [...new Set((L || []).filter((x) => x.removed === sp).map((x) => x.who))].map(esc).join(', ');
  const grp = (L) => { const m = new Map(); for (const x of L || []) { const o = m.get(x.spell) || { n: 0, who: new Set() }; o.n++; if (x.who) o.who.add(x.who); m.set(x.spell, o); } return m; }, tw = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : n + ' times');
  if (wipe) t('☠ Wipe', 'mpt-t2d', plural(p.deaths.length, 'death') + ': ' + p.deaths.map((d) => esc(d.who)).join(', ') + '.');
  else for (const d of p.deaths.slice().sort((a, b) => a.t - b.t)) t('☠ ' + esc(d.who), 'mpt-t2d', '<b>' + esc(d.who) + '</b> died to ' + esc(d.to || 'unknown') + ', ' + mpMM(d.t - p.s) + ' in.');
  if (p.boss && p.kill === false && !wipe) t('Not killed', 'mpt-t2d');
  for (const [sp, o] of grp(p.through)) t('! ' + esc(sp) + (o.n > 1 ? ' ×' + o.n : ''), 'mpt-t2k', '<b>' + esc(sp) + '</b> went off ' + tw(o.n) + ' with a kick ready.' + (o.who.size ? '<br>Kick ready: ' + [...o.who].map(esc).join(', ') + '.' : ''));
  for (const [sp, o] of grp(p.minor)) t('! ' + esc(sp) + (o.n > 1 ? ' ×' + o.n : ''), 'mpt-t2m', '<b>' + esc(sp) + '</b> went off ' + tw(o.n) + ' with a kick ready. Worth a kick, not a mistake.');
  const lu = (RR.lust || []).find((l) => l.pull === i); if (lu) t('⚡ Lust ' + (lu.t < p.s ? mpMM(p.s - lu.t) + ' before' : mpMM(lu.t - p.s) + ' in'), 'mpt-t2l', lu.spell ? '<b>' + esc(lu.spell) + '</b>' : '');
  const av = (p.avoid || []).filter((a) => a.n); if (av.length) t('◆ Avoidable ×' + av.reduce((a, x) => a + x.n, 0), 'mpt-t2a', av.map((a) => '<b>' + esc(a.who) + '</b> ×' + a.n + ' ' + esc(a.spell)).join('<br>'));
  for (const b of (p.ebuffs || []).filter((x) => x.on > 0).slice(0, 2)) t(esc(b.spell) + ' ×' + b.on, '', '<b>' + esc(b.spell) + '</b> went on ' + en(b.on) + '.' + (b.removed ? ' ' + b.removed + ' purged (' + who(p.purges, b.spell) + ').' : ''));
  for (const b of (p.debs || []).filter((x) => x.on > 0).slice(0, 2)) t(esc(b.spell) + ' ×' + b.on, '', '<b>' + esc(b.spell) + '</b> went on ' + plural(b.on, 'player') + '.' + (b.removed ? ' ' + b.removed + ' dispelled (' + who(p.dispels, b.spell) + ').' : ''));
  const miss = mpCdMiss(RR, i); if (miss.length) t('No big cooldown: ' + miss.map(esc).join(', '), 'mpt-t2c', 'Their spec has a big cooldown, and they didn\'t press one in this pull.');
  return out; }
// (a pull's hover (the studio's item 15, then Flex: "its just a lot of information to read"): what and how long, its tags, "Click for the details";
// on the map's pull tags, the tiles and the timeline's blocks alike)
function mpPullTip(RR, i, extra) { const p = RR.pulls[i], rt = RR.route && RR.route.ok ? RR.route : null, add = rt && rt.pulls[i] ? rt.pulls[i].add : 0;
  const f1 = (v) => (Math.round(1000 * v / rt.full) / 10).toFixed(1).replace(/\.0$/, '') + '%', tot = rt ? rt.pulls.slice(0, i + 1).reduce((a, x) => a + x.add, 0) : 0; /* (the running total (the cut): the Pulls list had it) */
  const top = (p.boss ? '★ ' + esc(p.boss) + ' · ' + (p.kill === false ? 'Not killed' : 'Killed') + ' · ' + mpMM(p.dur) : 'Pull ' + mpNo(RR, p.n) + ' · ' + mpMM(p.dur) + (add ? ' · +' + f1(add) : '')) + (rt ? ' · ' + f1(tot) + ' total' : '');
  const tg = mpPullTags(RR, i).map((x) => x.replace(/ data-tt="[^"]*"/, '')).concat(extra || []);
  return '<b>' + top + '</b><br>' + (tg.length ? tg.join('<span class="mpt-t2s"> · </span>') : '<span class="mpt-t2s">clean</span>') + '<br><span class="sub">Click for the details</span>'; }
function mpGroups(P) { const out = []; let cur = { from: '', to: '', ps: [] }; for (const p of P) { cur.ps.push(p); if (p.boss && p.kill !== false) { cur.to = p.boss; out.push(cur); cur = { from: p.boss, to: '', ps: [] }; } } if (cur.ps.length) out.push(cur); return out; }
const mpWhat = (R2, p, k) => { if (p.boss) return esc(p.boss); const mobs = mpMobs(R2, p), cnt = mobs.reduce((a, m) => a + m[1], 0);
  return plural(cnt, 'enemy').replace('enemys', 'enemies') + ': ' + mobs.slice(0, k || 3).map((m) => esc(m[0]) + (m[1] > 1 ? ' ×' + m[1] : '')).join(', ') + (mobs.length > (k || 3) ? ' and ' + (mobs.length - (k || 3)) + ' more' : ''); };
// (Your part (the studio's round, Flex: "yes do those 3"): one slim card under the key's tiles for the viewer's own character, or the Player pick
// when it's someone else ("Hansso's part"); hidden with no one to show. One or two lines of tags in the icon set's colours, each picking its pull,
// and one Next time line: a death first, then casts that went off with their kick ready, missed big cooldowns, avoidable hits, then damage behind
// top players of their spec (Flex: "comparing the player to top players of the same spec"). Only what the page already has)
function mpPartHtml(R, fx, pick) {
  const me = mpMine(R), name = pick || me, p = name && (R.people || []).find((x) => x.name === name); if (!p) return '<div id="mptPart" data-for="' + esc(pick || '') + '"></div>';
  const own = name === me, P = R.pulls, cn = (E.CLASSES[p.cls] || [])[0] || '', heal = p.role === 'healer', kickless = heal && !(p.cls === 'Shaman' && /restoration/i.test(p.spec || ''));
  const pn = (i) => (P[i].boss ? esc(P[i].boss) : 'pull ' + mpNo(R, i + 1)), on = (i) => (P[i].boss ? 'on ' : 'in ') + pn(i), pns = (L) => esc(mpPNs(R, L.map((i) => i + 1))), tw = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : n + ' times');
  // (one row: an icon in the icon set's colours, the label, the value bold on the right; a row about a pull picks it and scrolls to the map)
  const rows = [], row = (ic, col, label, val, at) => rows.push((at ? '<button type="button" class="mpt-prow"' + at + '>' : '<div class="mpt-prow">') + '<i class="mpt-pic" style="color:' + col + '" aria-hidden="true">' + ic + '</i><span class="mpt-ypl">' + label + '</span><span class="mpt-ypv">' + val + '</span>' + (at ? '</button>' : '</div>'));
  // (a parse, in its colour with a small "· 80"; a placeholder while the parses load)
  const pw = !!(MP.parse && MP.item && MP.parse.k === mpK(MP.item) && MP.parse.wait), pv = (m, txt) => { const x = mpParseOf(name, m); if (!x) return '<b>' + txt + '</b>' + (pw ? ' ' + mpShim('1.4em') : '');
    const c = yuPc(Math.round(x.pct)); return '<b class="' + mpPfi().trim() + '" style="color:' + c + '">' + txt + '</b><small class="mpt-ppn' + mpPfi() + '" style="color:' + c + '" tabindex="0"' + mpPcTip(x, p, R, m) + '> · ' + Math.round(x.pct) + '</small>'; };
  // (1, 2) damage with its share of the group ("include the HPS/DPS contribution"), a healer's healing
  const sum = (R.people || []).reduce((a, x) => a + (x.dps || 0), 0);
  row('⚔', '#e8eaed', 'Damage', pv('dps', mpGF(p.dps) + ' DPS') + (sum ? '<small> · ' + Math.round(100 * p.dps / sum) + '% of the group</small>' : ''));
  if (heal && p.hps) row('✚', '#7ee08f', 'Healing', '<b tabindex="0"' + mpT1('High healing can just mean the group took a lot of damage. DPS is the better number for healers in keys.') + '>' + mpGF(p.hps) + ' HPS</b>'); /* (plain: no parse colour on healing) */
  // (3) deaths
  const dd = []; P.forEach((q, i) => { for (const d of q.deaths || []) if (d.who === name) dd.push({ ...d, i }); }); dd.sort((a, b) => a.t - b.t);
  row('☠', '#ff8f87', 'Deaths', dd.length ? '<b class="mpt-bad">' + dd.length + '</b><small> · ' + on(dd[0].i) + '</small>' : '<b class="mpt-g">0</b>', dd.length ? ' data-mppick="' + dd[0].i + '"' : '');
  // (4) kicks, or a healer's stops and CC (no kick; a Restoration Shaman keeps Wind Shear)
  const cc = mpCCcasts(R.ccEv || []).filter((c) => c.who === name).length, th = []; P.forEach((q, i) => { for (const x of q.through || []) if (x.who === name) th.push({ ...x, i }); });
  if (kickless) row('●', '#7ee08f', 'Stops · CC', '<b>' + (p.stops || 0) + ' · ' + cc + '</b>');
  else row('●', '#7ee08f', 'Kicks', '<b>' + (p.kicks || 0) + '</b>' + (th.length ? '<small class="mpt-t2k"> · ! ' + th.length + ' went off with ' + (own ? 'your' : 'their') + ' kick ready</small>' : ''), th.length ? ' data-mppick="' + th[0].i + '"' : '');
  // (5) against top players of the spec (the middle one in the fastest public runs; the best in the hover)
  const wt = !fx || fx.wait, v = mpSpecVs(p, (fx && fx.list && fx.list.runs) || []);
  if (v || wt) row('◇', '#f2c46b', 'DPS vs top ' + esc(p.spec) + ' ' + esc(cn) + 's', v ? '<b class="' + mpVs(v.pct) + mpFi() + '"' + mpT1('Damage per second, against the middle ' + esc(p.spec + ' ' + cn) + ' in the 20 fastest runs with a public log at this level (' + v.n + ' of them). The middle one did <b>' + mpGF(v.avg) + ' DPS</b>, the best <b>' + mpGF(v.best) + '</b>. ' + (own ? 'You' : esc(name)) + ' did <b>' + mpGF(v.mine) + '</b>.') + '>' + (v.pct >= 0 ? v.pct + '% ahead' : -v.pct + '% behind') + '</b>' : mpShim('5em'), v ? ' data-mpgo="mptC4"' : '');
  // (6) big cooldowns, judged as on the cards
  const cdx = mpCdN(R, p), miss = cdx ? P.map((q, i) => (mpCdMiss(R, i).includes(name) ? i : -1)).filter((i) => i >= 0) : [];
  if (cdx) row('✓', '#7ee08f', 'Big cooldowns', miss.length ? '<b class="mpt-a">missed in ' + pns(miss) + '</b>' : '<b class="mpt-g">every pull</b>', miss.length ? ' data-mppick="' + miss[0] + '"' : '');
  // (7) avoidable hits
  const av = []; P.forEach((q, i) => { for (const a of q.avoid || []) if (a.who === name && a.n) av.push({ ...a, i }); }); const avN = av.reduce((t, a) => t + a.n, 0), byP = new Map(); for (const a of av) byP.set(a.i, (byP.get(a.i) || 0) + a.n);
  const top = avN ? [...byP].sort((a, b) => b[1] - a[1])[0][0] : -1;
  row('◆', '#f2c46b', 'Avoidable hits', avN ? '<b class="mpt-a">' + avN + '</b><small> · ' + (byP.size > 1 ? 'most ' : '') + on(top) + '</small>' : '<b class="mpt-g">0</b>', avN ? ' data-mppick="' + top + '"' : '');
  // (8) a healer whose damage timed the key
  if (heal) { const hv = mpHealVerdict(R, p, v, own, cn); if (hv) rows.push('<div class="mpt-prow mpt-prow2' + (hv[0] === 'win' ? ' mpt-pwin' : '') + '"><i class="mpt-pic" style="color:' + (hv[0] === 'win' ? '#ffd166' : '#aeb6bf') + '" aria-hidden="true">' + (hv[0] === 'win' ? '★' : '⏱') + '</i><span class="mpt-ypl">Did ' + (own ? 'your' : 'their') + ' damage time it?</span><span class="mpt-ypv2 mpt-hv-' + hv[0] + '">' + hv[1] + '</span></div>');
    else if (wt && R.run.clock && R.run.clock.up === 0) rows.push('<div class="mpt-prow mpt-prow2"><i class="mpt-pic" style="color:#aeb6bf" aria-hidden="true">⏱</i><span class="mpt-ypl">Did ' + (own ? 'your' : 'their') + ' damage time it?</span><span class="mpt-ypv2">' + mpShimT('You were 0:40 over. Matching the middle healer would have saved about 0:25.') + '</span></div>'); }
  // (one Next time line, the first that applies: a death, casts with their kick ready, missed cooldowns, avoidable hits, damage behind the spec)
  let nt = ''; const you = own ? 'you' : 'them';
  if (dd.length) { const d = dd[0]; nt = d.defs ? 'Watch for ' + esc(d.to || 'that hit') + ' ' + on(d.i) + '. It killed ' + you + ' even after a defensive.' : 'Press a defensive ' + on(d.i) + '. ' + (own ? 'You' : esc(name)) + ' died to ' + esc(d.to || 'a hit') + (d.from ? ' (' + esc(d.from) + ')' : '') + ' with none used.'; }
  else if (th.length) { const m = new Map(); for (const x of th) { const o = m.get(x.spell) || { n: 0, ps: new Set() }; o.n++; o.ps.add(x.i); m.set(x.spell, o); } const [s1, o] = [...m].sort((a, b) => b[1].n - a[1].n)[0];
    nt = 'Kick ' + esc(s1) + ' in ' + pns([...o.ps]) + '. It went off ' + tw(o.n) + ' with ' + (own ? 'your' : 'their') + ' kick ready.'; }
  else if (miss.length) nt = 'Press a big cooldown in ' + pns(miss) + '.';
  else if (avN) { const m = new Map(); for (const a of av) m.set(a.spell, (m.get(a.spell) || 0) + a.n); const [s1, n] = [...m].sort((a, b) => b[1] - a[1])[0]; nt = 'Dodge ' + esc(s1) + '. It hit ' + you + ' ' + tw(n) + '.'; }
  else if (v && v.pct < -5) nt = 'Push ' + (own ? 'your' : 'their') + ' damage. ' + (own ? 'You were ' : esc(name) + ' was ') + (-v.pct) + '% behind top ' + esc(p.spec) + ' ' + esc(cn) + 's.';
  const ntH = nt ? '<p class="mpt-nt' + (v && !dd.length && !th.length && !miss.length && !avN ? mpFi() : '') + '"><b>Next time</b> ' + nt + '</p>' : wt ? '<p class="mpt-nt">' + mpShimT('Next time push your damage. You were 10% behind top players.') + '</p>' : '';
  return '<div id="mptPart" data-for="' + esc(pick || '') + '"><p class="mpt-k mpt-pth">' + (own ? 'Your part · ' : '') + '<span style="color:' + mpCC(p.cls) + '">' + esc(name) + '</span>' + (own ? '' : '\'s part') + ' <span class="mpt-m">(' + esc(p.spec) + ')</span></p>' +
    '<div class="mpt-prows">' + rows.join('') + '</div>' + ntH + '</div>'; }
// (a player against the same spec in the fastest runs with a public log at this level: healers by their DPS when the runs have it, else HPS)
function mpSpecVs(p, runs) { const heal = p.role === 'healer', same = (m) => mpNorm(m.s) === mpNorm(p.spec) && mpNorm(m.c) === mpNorm(p.cls) && (m.r === 'healer') === heal;
  let a = [], dps = true; for (const r of runs) for (const m of r.ppl || []) if (same(m) && (heal ? m.d : m.a)) a.push(heal ? m.d : m.a);
  if (!a.length) return null; a.sort((x, y) => x - y); const avg = a.length % 2 ? a[a.length >> 1] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2, mine = dps ? p.dps : p.hps; return { pct: Math.round(100 * (mine - avg) / avg), n: a.length, avg, best: a[a.length - 1], mine, u: dps ? 'DPS' : 'HPS' }; } /* (the middle one, like the typical fast run; the best one for the hover) */
// (Your group, one table (Nov 2, the Design studio's tidy-pass.md, Flex: "can we tidy this up kinda jumbled"): what went off with a kick ready on
// top, then one Graphs-tab row per player, highest DPS first: DPS, against their spec, kicks, stops, CC, deaths, defensives, avoidable hits and big
// cooldowns, with the group's total at the bottom. The group's trash and boss DPS, the healer's damage and what the columns mean are footnotes)
function mpGroup(R, fx, waiting) {
  const thru = new Map(); for (const p of R.pulls) for (const t of p.through) { const k = t.spell + '|' + t.mob, o = thru.get(k) || { spell: t.spell, mob: t.mob, n: 0, pulls: new Map() }; o.n++; o.pulls.set(p.n, (o.pulls.get(p.n) || 0) + 1); thru.set(k, o); }
  const TH = [...thru.values()].sort((a, b) => b.n - a.n), t0 = TH[0];
  const went = /* (what went off is in the summary, on the map's ! marks and on each card (the cut, Nov 2); low-danger kicks stay) */
    ((R.spam || []).length ? '<p class="mpt-k mpt-ksh">Low danger: kick when you can</p>' + R.spam.map((x) => '<div class="mpt-gwo mpt-ks" tabindex="0"' + mpT1('<b>' + esc(x.spell) + '</b> is low danger: ' + x.casts + ' casts from ' + plural(x.enemies, 'enemy').replace('enemys', 'enemies') + '. Every one you kick or stop helps, and one that goes off isn\'t a mistake.') + '><span><b>' + esc(x.spell) + '</b><small>' + esc(x.mob) + (x.enemies > 1 ? ' · ' + plural(x.enemies, 'enemy').replace('enemys', 'enemies') : '') + '</small></span><span class="mpt-m">kicked ' + x.kicked + ' of ' + x.casts + (x.stopped ? ', stopped ' + x.stopped + ' more' : '') + '</span><b></b></div>').join('') : '');
  const ccBy = new Map(); for (const c of mpCCcasts(R.ccEv)) { const o = ccBy.get(c.who) || { n: 0, sp: new Map() }, x = o.sp.get(c.sp) || { n: 0, g: new Set() }; o.n++; x.n++; for (const g of c.g) x.g.add(g); o.sp.set(c.sp, x); ccBy.set(c.who, o); }
  const ccN = (p) => (ccBy.get(p.name) || { n: 0 }).n, ccTip = (p) => { const o = ccBy.get(p.name); return o ? mpT1('<b>' + esc(p.name) + '</b><br>' + [...o.sp].sort((a, b) => b[1].n - a[1].n).map(([sp, x], k) => esc(sp) + ' ×' + x.n + (x.g.size ? ' (' + (k ? x.g.size : plural(x.g.size, 'enemy').replace(/enemys$/, 'enemies')) + ')' : '')).join(' · ')) : ''; };
  const ppl = R.people.slice().sort((a, b) => b.dps - a.dps), mxD = Math.max(1, ...ppl.map((p) => p.dps)), runs = (fx && fx.list && fx.list.runs) || [], me = mpMine(R); /* (your own row: a gold edge (item 19)) */
  /* (healers lead with DPS (the studio's healer-dps.md): against the same spec's DPS in the fast runs when they have it, else their HPS) */
  const vs = (p) => mpSpecVs(p, runs);
  const num = (v, cls) => '<span class="gbx-s mpt-gxn' + (v ? (cls ? ' ' + cls : '') : ' mpt-g0') + '">' + v + '</span>';
  const cdOf = new Map(ppl.map((p) => [p.name, mpCdN(R, p)]));
  const rows = ppl.map((p) => { const heal = p.role === 'healer', v = vs(p), sid = mpSpecId(p.spec, p.cls), ic = typeof NDZ_SPECIC !== 'undefined' && NDZ_SPECIC[sid] ? NDZ_SPECIC[sid] : 'inv_misc_questionmark', cd = cdOf.get(p.name), cc = ccN(p);
    const vtxt = v ? '<span class="mpt-vs ' + mpVs(v.pct) + mpFi() + '" tabindex="0"' + mpT1('Against ' + esc(plural(v.n, p.spec + ' ' + ((E.CLASSES[p.cls] || [])[0] || ''))) + ' in the fastest runs with a public log: the middle one does <b>' + Math.round(v.avg / 1000) + 'k ' + v.u + '</b>.') + '>' + (v.pct >= 0 ? v.pct + '% ahead' : -v.pct + '% behind') + '</span>'
      : waiting ? mpShim('5.5em') : '<span class="mpt-vs mpt-m">' + (runs.length ? 'no ' + esc(p.spec) : '—') + '</span>';
    const facts = [plural(p.kicks, 'kick'), plural(p.stops, 'stop'), cc + ' CC', plural(p.deaths, 'death'), plural(p.defs, 'defensive'), p.avoid + ' avoidable', cd ? plural(cd.n, 'big cooldown') + ' (' + cd.on + ')' : ''].filter(Boolean).join(' · ');
    return '<div class="gbx-r' + (p.name === me ? ' mpt-gme' : '') + '" style="--c:' + mpCC(p.cls) + '"><span class="gbx-n"><img src="' + whIcon(ic) + '" alt="" loading="lazy" onerror="this.remove()"><span class="mpt-gpn">' + mpWho(R, p.name) + '<small>' + esc(p.spec) + (heal && p.hps ? ' · ' + mpGF(p.hps) + ' HPS' : '') + '</small></span></span>' +
      '<span class="gbx-b"><i style="width:' + Math.min(100, 100 * p.dps / mxD).toFixed(1) + '%"></i></span><b class="gbx-v' + (mpParseOf(p.name, 'dps') ? mpPfi() : '') + '"' + ((x) => (x ? ' style="color:' + yuPc(Math.round(x.pct)) + '" tabindex="0"' + mpPcTip(x, p, R, 'dps') : ''))(mpParseOf(p.name, 'dps')) + '>' + mpGF(p.dps) + '</b><span class="gbx-s mpt-gvs">' + vtxt + '</span>' +
      num(p.kicks) + num(p.stops) + (cc ? '<span class="gbx-s mpt-gxn" tabindex="0"' + ccTip(p) + '>' + cc + '</span>' : num(0)) + num(p.deaths, 'mpt-gd') + num(p.defs) + num(p.avoid) +
      (cd ? '<span class="gbx-s mpt-gxn' + (cd.n ? '' : ' mpt-g0') + '" tabindex="0"' + mpT1(cd.tip) + '>' + cd.n + (cd.n ? ' <small>(' + cd.on + ')</small>' : '') + '</span>' : '<span class="gbx-s mpt-gxn mpt-g0">—</span>') +
      '<span class="mpt-gx2">' + facts + '</span></div>'; }).join('');
  // (your group, overall (Flex: "and overall"): its DPS while fighting against the typical fast run, and the sum of each column)
  const F = fx && fx.R, yG = mpGrp(R.pulls), fG = F ? mpGrp(F.pulls) : null, half = (RR, b) => mpGrp(RR.pulls.filter((q) => !!q.boss === b));
  const S = (f) => ppl.reduce((a, p) => a + f(p), 0), cdS = ppl.reduce((a, p) => { const c = cdOf.get(p.name); return a + (c ? c.n : 0); }, 0);
  let tot = '';
  if (yG.r) { const dp = fG && fG.r ? Math.round(100 * (yG.r / fG.r - 1)) : null, fC = F && F.run.clock ? mpClock(F) : null;
    const vsg = dp == null ? (waiting ? mpShim('5.5em') : '<span class="mpt-vs mpt-m">—</span>') : '<span class="mpt-vs ' + mpVs(dp) + '" tabindex="0"' + mpT1('Against the typical fast run' + (fC ? ' (' + mpMM(fC.ck.time) + ')' : '') + ': its group did <b>' + mpGF(fG.r) + '</b> DPS while fighting.') + '>' + (dp < 0 ? -dp + '% behind' : dp + '% ahead') + '</span>';
    tot = '<div class="gbx-r mpt-gtot"><span class="gbx-n"><span class="mpt-si mpt-gi" aria-hidden="true"><svg viewBox="0 0 16 16"><circle cx="8" cy="5" r="2.6"/><circle cx="3.6" cy="7" r="2"/><circle cx="12.4" cy="7" r="2"/><path d="M3.5 14c0-2.7 2-4.4 4.5-4.4s4.5 1.7 4.5 4.4Z"/></svg></span><span class="mpt-gpn"><b class="mpt-nm">Your group</b><small>while fighting</small></span></span>' +
      '<span></span><b class="gbx-v">' + mpGF(yG.r) + '</b><span class="gbx-s mpt-gvs">' + vsg + '</span>' + num(S((p) => p.kicks)) + num(S((p) => p.stops)) + num(S(ccN)) + num(S((p) => p.deaths), 'mpt-gd') + num(S((p) => p.defs)) + num(S((p) => p.avoid)) + num(cdS) +
      '<span class="mpt-gx2">' + [plural(S((p) => p.kicks), 'kick'), plural(S((p) => p.stops), 'stop'), S(ccN) + ' CC', plural(S((p) => p.deaths), 'death'), plural(S((p) => p.defs), 'defensive'), S((p) => p.avoid) + ' avoidable', plural(cdS, 'big cooldown')].join(' · ') + '</span></div>'; }
  const hd = '<div class="gbx-r gbx-hd"><span>Player</span><span></span><span>DPS</span><span' + (runs.length ? ' tabindex="0"' + mpT1('<b>vs spec (DPS)</b><br>Damage per second, against the middle player of the same spec in the 20 fastest runs.') : '') + '>vs spec (DPS)</span>' +
    '<span class="mpt-gxn" tabindex="0"' + mpT1('<b>Kicks</b><br>Healers have no kick in Midnight, except Restoration Shamans.') + '>Kicks</span><span class="mpt-gxn" tabindex="0"' + mpT1('<b>Stops</b><br>Crowd control that cut a cast short.') + '>Stops</span><span class="mpt-gxn" tabindex="0"' + mpT1('<b>CC</b><br>Every stun, disorient, fear, knockback or grip pressed on enemies, even when it didn\'t stop a cast: it takes a pack out of the fight for a moment.') + '>CC</span><span class="mpt-gxn" tabindex="0"' + mpT1('<b>Deaths</b>') + '>Deaths</span><span class="mpt-gxn" tabindex="0"' + mpT1('<b>Defensives</b><br>How many they pressed.') + '>Defensives</span><span class="mpt-gxn" tabindex="0"' + mpT1('<b>Avoidable hits</b><br>Hits from mechanics the fastest groups dodge.') + '>Avoidable</span><span class="mpt-gxn" tabindex="0"' + mpT1('<b>Big cooldowns</b><br>How many they pressed, and in brackets how many went on the 3 biggest pulls.') + '>Big cooldowns</span></div>';
  // (the footnotes: the group's trash and bosses, the healer's damage, what the columns mean)
  const tb = (b) => { const y = half(R, b), f = F ? half(F, b) : null; return y.r ? (b ? 'bosses ' : 'trash ') + mpGF(y.r) + (b ? '' : ' DPS') + (f && f.r ? ' (fast run ' + mpGF(f.r) + ')' : '') : ''; };
  const hw = ''; /* (the healer's line lives in Your part now ("Did your damage time it?")) */ /* (one line (the cut): what each column means is in its header's hover) */
  const foot = yG.r || hw ? '<p>' + (yG.r ? 'Your group: ' + [tb(false), tb(true)].filter(Boolean).join(', ') + '.' : '') + (hw ? ' ' + hw : '') + '</p>' : '';
  // (the headline: what went off, whether everyone pressed their big cooldowns, who was furthest behind their spec, the healer's damage)
  const never = (R.cdWho || []).filter((nm) => !((R.cds || {})[nm] || []).length), V = ppl.map((p) => ({ p, v: vs(p) })).filter((x) => x.v), low = V.slice().sort((a, b) => a.v.pct - b.v.pct)[0];
  const line = [t0 ? '<b class="mpt-ab">' + esc(t0.spell) + '</b> went off <b>' + (t0.n === 1 ? 'once' : t0.n + ' times') + '</b> with a kick ready.' : 'Nothing on the must-kick list went off with a kick ready.',
    (R.cdWho || []).length ? (never.length ? never.map((nm) => mpWho(R, nm)).join(', ').replace(/, ([^,]*)$/, ' and $1') + ' never pressed a big cooldown.' : 'Everyone pressed their big cooldowns.') : '',
    low ? (low.v.pct < 0 ? mpWho(R, low.p.name) + ' was furthest behind their spec (<b class="mpt-bad">' + -low.v.pct + '%</b>).' : 'Everyone was ahead of the middle player of their spec.') : ''].filter(Boolean).join(' ');
  return mpSec('Your group', line, went + '<div class="gbx mpt-gtab">' + hd + rows + tot + '</div><div class="mpt-gft">' + foot + '</div>', 'mptPlayers', { fold: true, open: true, noTitle: true }); /* (open from the start, the chapter label its title (Flex's "go")) */
}
// (a healer's damage, in time: worth T × r_h / (r − r_h) seconds of fighting, with T the fighting time, r the group's damage a second while
// fighting and r_h the healer's. When that's more than the time the key was timed with, a line says so: "was worth", never "you'd have failed")
const mpHealT = (R, p) => { const y = mpGrp(R.pulls); let D = 0; for (const q of R.pulls) D += ((q.dmg || {})[p.name] || 0) * q.dur; const rh = y.T ? D / y.T : 0; return { rh, worth: y.r > rh && rh ? y.T * rh / (y.r - rh) : 0 }; };
// (did a healer's damage time the key? (Flex: "Remember when i had the idea about if the healer DPS made or break the key?", then "if this number was the
// deciding factor if the key was timed or not it should be noted and celebrated!"). Timed: their damage was worth W seconds of fighting; more than the time
// to spare and it timed the key (celebrated), else it would have been timed without it. Over time: what matching the middle healer of their spec in the
// fast runs would have saved, the same sum on the gap in damage a second. Left early or no baseline: nothing)
function mpHealVerdict(R, p, v, own, cn) { const ck = R.run.clock; if (!ck || R.run.left || !R.run.timeMs) return null;
  const T = ck.time, P = ck.par, your = own ? 'Your' : 'Their', had = own ? 'you had' : 'the key had';
  if (ck.up > 0) { const h = mpHealT(R, p); if (!h.worth) return null; const sp1 = P - T, lim = ck.up === 3 ? P * 0.6 : ck.up === 2 ? P * 0.8 : P, spL = lim - T;
    if (h.worth > sp1) return ['win', '<b>' + your + ' damage timed this key!</b> It was worth <b>' + mpMM(h.worth) + '</b> of fighting, and ' + had + ' <b>' + mpMM(sp1) + '</b> to spare.'];
    if (ck.up >= 2 && h.worth > spL) return ['win', '<b>' + your + ' damage got this key its +' + ck.up + '!</b> It was worth <b>' + mpMM(h.worth) + '</b> of fighting, and ' + had + ' <b>' + mpMM(spL) + '</b> to spare for +' + ck.up + '.'];
    return ['m', your + ' damage was worth <b>' + mpMM(h.worth) + '</b> of fighting. The key would have been timed without it, with <b>' + mpMM(sp1 - h.worth) + '</b> to spare.']; }
  if (!v || v.u !== 'DPS') return null; const y = mpGrp(R.pulls), over = T - P, d = v.avg - v.mine, saved = y.T && y.r && d > 0 ? y.T * d / (y.r + d) : 0, mid = 'the middle ' + esc(p.spec + ' ' + cn) + '\'s damage', wo = own ? 'you were' : 'the key was';
  if (d <= 0) return ['m', wo.charAt(0).toUpperCase() + wo.slice(1) + ' <b>' + mpMM(over) + '</b> over. ' + your + ' damage was already at ' + mid + '.'];
  if (saved >= over) return ['bad', your + ' damage could have timed this key. Matching ' + mid + ' would have saved about <b>' + mpMM(saved) + '</b>, and ' + wo + ' <b>' + mpMM(over) + '</b> over.'];
  return ['a', wo.charAt(0).toUpperCase() + wo.slice(1) + ' <b>' + mpMM(over) + '</b> over. Matching ' + mid + ' would have saved about <b>' + mpMM(saved) + '</b>, not enough on its own.']; }
function mpHealWorth(R, p) {
  const ck = R.run.clock; if (!ck || !(ck.up > 0)) return '';
  const lim = ck.up === 3 ? ck.par * 0.6 : ck.up === 2 ? ck.par * 0.8 : ck.par, spare = lim - ck.time, h = mpHealT(R, p);
  if (!(h.worth > spare && spare > 0)) return '';
  return '<p class="mpt-hw" tabindex="0"' + mpT1('<b>Healer damage</b><br>' + esc(p.name) + ' did ' + mpGF(h.rh) + ' damage a second while fighting. Without it, the same fighting would have taken about ' + mpMM(h.worth) + ' longer.') + '>' + mpWho(R, p.name) + '\'s damage timed this key: it was worth <b>' + mpMM(h.worth) + '</b> of fighting, and you had <b>' + mpMM(spare) + '</b> to spare.</p>';
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
  'kings\' rest': { full: 608, zone: 9526, floors: [[1004, 'Kings\' Rest', -1240.31, -679.68, 2440, 3280.94]], /* (Animated Gold: 6, from three timed keys that add up to 100% with it, Nov 2) */
    n: { 133935: 22, 134157: 5, 134158: 25, 134174: 20, 134251: 10, 134331: 25, 134739: 25, 135167: 22, 135192: 5, 135204: 7, 135231: 25, 135239: 7, 135406: 6, 137473: 10, 137474: 25, 137478: 25, 137484: 25, 137485: 7, 137486: 25, 137487: 10, 137969: 15, 137989: 1, 270502: 7 } },
  'murder row': { full: 655, zone: 16091, floors: [[2433, 'Murder Row', 8633.33, 8952.08, -5106.25, -4629.17], [2435, 'The Illicit Rain', 8850, 9000, -4895, -4670], [2434, 'Augurs\' Terrace', 8554.17, 9250, -5502.08, -4458.33]],
    n: { 234849: 2, 235257: 1, 235261: 5, 235265: 25, 235267: 5, 235268: 7, 235322: 35, 235465: 25, 236071: 25, 236073: 3, 236082: 6, 236084: 7, 236085: 1, 236091: 3, 236893: 2, 236897: 7, 236902: 12, 236905: 30, 252529: 35, 255604: 6 } },
  'ruby life pools': { full: 551, zone: 14063, floors: [[2095, 'Infusion Chambers', 1335, 1685, -450, 75], [2094, 'Ruby Overlook', 1345.83, 1868.75, -602.08, 181.25]],
    n: { 187897: 30, 187969: 5, 188011: 5, 188067: 7, 188244: 25, 190207: 7, 197535: 30, 197697: 40, 197698: 48, 197982: 5, 198047: 25 } },
  'temple of sethraliss': { full: 687, zone: 9527, floors: [[1038, 'Temple of Sethraliss', 3187.5, 3937.5, 2789.58, 3916.67], [1043, 'Atrium of Sethraliss', 3760.42, 4285.42, 3185.42, 3972.92]],
    n: { 134364: 7, 134599: 7, 134600: 7, 134602: 7, 134616: 5, 134629: 25, 134686: 16, 134691: 5, 134990: 7, 134991: 25, 135007: 25, 135562: 7, 135846: 5, 136076: 25, 136250: 25, 139110: 5, 139422: 7, 139425: 7, 265057: 5, 268317: 5, 269227: 5,
      /* (Raider.IO lists these two as 0, yet every top run is 12 short of 687 without them: Rogue Krolusk 2 and Toxic Viper 1 bring all 20 of the top runs
         we checked to 100-100.6%, Nov 2. A fit, not the game's own number) */ 134617: 2, 134389: 1 } },
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
// (crowd control a player put on an enemy, by the aura it leaves (the key reader's own list); knockbacks and grips by their cast (Nov 2; the pull card's
// Kicks & CC fold))
const MP_KNOCK = new Set(['blast wave', 'gorefiend\'s grasp', 'death grip', 'mass grip', 'supernova', 'gravity lapse', 'typhoon', 'thunderstorm', 'ursol\'s vortex', 'wing buffet', 'tail swipe']);
const MP_CC = new Set(['leg sweep', 'shadowfury', 'static charge', 'hammer of justice', 'kidney shot', 'cheap shot', 'storm bolt', 'shockwave', 'intimidating shout', 'war stomp', 'chaos nova', 'fel eruption', 'mighty bash', 'maim',
  'asphyxiate', 'blinding light', 'incapacitating roar', 'paralysis', 'binding shot', 'intimidation', 'psychic scream', 'psychic horror', 'silence', 'solar beam', 'sigil of silence', 'sigil of misery', 'strangulate', 'dragon\'s breath',
  'ring of frost', 'mortal coil', 'howl of terror', 'fear', 'hex', 'polymorph', 'repentance', 'holy word: chastise', 'blinding sleet', 'sleep walk', 'quaking palm', 'gouge', 'blind', 'sap', 'imprison', 'freezing trap', 'scatter shot',
  'disorienting roar', 'deep breath', 'terror of the skies', 'haymaker', 'bull rush', 'axe toss', 'cyclone', 'shackle undead', 'banish', 'capacitor totem', 'lightning lasso', 'thunderous paws', 'dead of winter', 'remorseless winter',
  'frost nova', 'abomination limb', 'chains of ice', 'piercing howl', 'entangling roots', 'mass entanglement', 'earthbind', 'landslide']);
// (CC casts (Flex, Nov 2: "Another metric to look at is CC cast, stuns disrupts disorients. Even if it doesnt stop a cast those are used to neutralize
// packs"): one per cast, the same player and spell within 0.3 s, however many enemies it hit. Stuns, incapacitates, disorients, fears, knockbacks
// and grips; roots and slows aren't, and never Grip of the Dead)
const MP_SLOW = new Set(['frost nova', 'chains of ice', 'piercing howl', 'entangling roots', 'mass entanglement', 'earthbind', 'landslide', 'remorseless winter', 'thunderous paws', 'grip of the dead']);
const mpCCcasts = (L) => { const out = [], last = new Map(); for (const e of [...(L || [])].sort((a, b) => a.t - b.t)) { if (MP_SLOW.has(mpLc(e.sp))) continue; const k = e.who + '|' + e.sp, o = last.get(k);
  if (o && e.t - o.t1 <= 0.3) { o.t1 = e.t; if (e.g) o.g.add(e.g); continue; } const c = { who: e.who, sp: e.sp, t: e.t, t1: e.t, g: new Set(e.g ? [e.g] : []) }; last.set(k, c); out.push(c); } return out; };
// (the rares of this season's 8 dungeons, by NPC ID, from Wowhead's page of each (Nov 2): Skarr and Weaponmaster Halu, both in Kings' Rest. The combat
// log doesn't say which enemies are rare or elite (checked on Flex's log of Nov 1), and Wowhead's "elite" flag is on nearly all key trash, so the
// Pack's Elite is the mini-boss tier by health; these two are Elite whatever their health (mplus-tab-design/npc-classes.md))
const MP_RARE = new Set([50815, 140123]);
// (the key's middle trash enemy by health, each one counted, and the trash kinds; the Pack's Elite rule, shared with the map's gold rings: a rare, or at
// least twice the middle health, trash only)
const mpMid = (RR) => { if (RR.mobMid == null) { const ty = RR.mobType || {}, hs = []; RR.mobTrash = new Set(); for (const q2 of RR.pulls) if (!q2.boss) for (const [n2, c2] of mpMobs(RR, q2)) { RR.mobTrash.add(n2); const h = (ty[n2] || {}).hp || 0; if (h) for (let k = 0; k < c2; k++) hs.push(h); }
  hs.sort((a, b) => a - b); RR.mobMid = hs.length ? hs[hs.length >> 1] : 0; } return RR.mobMid; };
const mpElite = (RR, n2) => { const o = n2 && (RR.mobType || {})[n2]; if (!o) return false; const mid = mpMid(RR); return MP_RARE.has(o.id) || !!(mid && o.hp >= 2 * mid && RR.mobTrash.has(n2)); };
// (each boss's Encounter Journal portrait, as Wowhead's dungeon overview guides show them (read from the 8 guides, Nov 2), loaded at runtime, never
// bundled; by the boss's name in letters only. Without one, the boss keeps its dot and its ★)
const MP_BOSSPIC = { tazrah: 'tazrah', atroxus: 'atroxus', charonus: 'charonus', ravi: 'hydra', thewrithingcoil: 'writhe', zuljan: 'zuljan', thehoardmonger: 'furbolgprimal', sentinelofwinter: 'furbolgearth', nalorakk: 'bearloa',
  kystiamanaheart: 'kystia-manaheart', zaenbladesorrow: 'zaen-bladesorrow', xathuuxtheannihilator: 'xathuux-the-annihilator', xanthuuxtheannihilator: 'xathuux-the-annihilator', lithielcinderfury: 'lithiel-cinderfury',
  melidrussachillworn: 'melidrussa-chillworn', kokiablazehoof: 'kokia-blazehoof', kyrakkaanderkhartstormvein: 'kyrakka', thegoldenserpent: 'thegoldenserpent', mchimbatheembalmer: 'mchimbatheembalmer', thecounciloftribes: 'thecounciloftribes',
  dazarthefirstking: 'dazarthefirstking', adderisandaspix: 'adderisandaspix', merektha: 'merektha', galvazzt: 'galvazzt', avatarofsethraliss: 'avatarofsethraliss', lightblossomtrinity: 'lightblossomtrinity', ikuzzthelighthunter: 'lighthunterikuzz',
  lightwardenruia: 'lightwardenruia', ziekket: 'ziekket' };
// (each enemy's model display ID by NPC ID, read from Wowhead's NPC pages on Nov 2 (this season's 8 dungeons: the enemies that count, and the adds seen in
// keys); its portrait is Wowhead's model thumbnail, loaded at runtime, never bundled. One missing keeps the ringed dot)
const MP_NPCD = new Map('50815:19607,62982:31985,93349:61982,95072:14511,98300:71056,106972:40144,106988:418,133379:83550,133384:88585,133389:81654,133392:83203,133935:83252,133943:76055,133944:83552,134157:83363,134158:83364,134174:83371,134251:83517,134331:83544,134364:86510,134388:83574,134389:78250,134390:147087,134516:86318,134517:86317,134599:83779,134600:83780,134602:83782,134616:83787,134617:83790,134629:84761,134686:75595,134691:81655,134739:83836,134990:84024,134991:84207,134993:83529,134994:84026,135007:84503,135167:84112,135192:84133,135204:84140,135231:85125,135235:84112,135239:84163,135322:84202,135406:88651,135470:84269,135472:84271,135475:84272,135562:78250,135641:31999,135846:78247,135971:147077,136076:65631,136160:84352,136250:84676,136264:84688,136391:84761,136976:84274,136984:84273,137020:84351,137204:84676,137233:78423,137473:85270,137474:85272,137478:85274,137484:85284,137485:85285,137486:85287,137487:33733,137857:83790,137969:85677,137989:33008,138489:85860,138493:76055,139108:51418,139110:83553,139284:86210,139300:83181,139304:78246,139314:75730,139422:84761,139425:83444,139946:84761,139949:86210,140123:86571,141086:87046,141806:81103,141890:87504,141896:87506,141929:87524,142929:84209,144311:84503,149583:86790,149585:75592,166949:69902,187894:110633,187897:107106,187969:102955,188011:79800,188067:107397,188086:102721,188087:102769,188244:101209,188252:106891,189232:106851,189886:102505,189893:110633,190034:102505,190051:104439,190054:103007,190055:104296,190059:102765,190060:102325,190205:102535,190206:102969,190207:102886,190397:102697,190400:110043,190408:107112,190409:102719,190410:102690,190411:102675,190412:107296,190484:107137,190485:108318,194622:102535,194654:107204,194667:107204,194687:107040,195119:108753,197509:102516,197535:110966,197697:106023,197698:106435,197717:104556,197982:110964,197985:110969,198047:110967,199788:107204,199789:107204,199790:107137,199791:108318,200379:102969,200380:102886,200382:102769,205775:102681,225190:142898,228224:121467,228226:121468,234849:65901,235257:77024,235261:1913,235265:124763,235267:63968,235268:124770,235322:137564,235465:76712,236071:126157,236073:136939,236082:77400,236084:129784,236085:139997,236091:137441,236893:136834,236897:136657,236902:139996,236905:138787,238883:130200,241496:130201,241808:14316,241813:141213,241814:128080,241816:124212,241869:128095,241872:141288,241874:141223,241876:103213,241911:73034,243766:141196,243835:141810,243983:140037,243985:140036,243988:140041,243996:140045,244260:140256,244309:140264,244708:147460,244889:138584,245139:129562,245143:129563,245145:129581,245146:131630,245190:124949,245336:127945,245339:127942,245345:125875,245346:127946,245410:104473,245460:128068,245473:122805,245484:136758,245513:142839,245527:110392,245752:124212,245855:26857,245950:141286,246871:126929,249461:140299,249590:141195,249603:140295,249608:141194,249756:136026,250478:138885,252053:137329,252072:137330,252508:141207,252529:137450,254850:126462,255604:138981,261550:146598,261552:146661,261553:146654,261554:147569,261557:146663,261560:146653,261573:146299,262011:146664,263109:147578,263112:146677,263228:138723,263383:7409,264785:83787,265057:83553,267545:147378,267546:147363,268184:147459,268317:147718,268344:84761,268427:84024,268491:84676,268729:147085,269227:80961,270306:146680,270502:84688,271453:147577'.split(',').map((x) => x.split(':').map(Number)));
const mpNpcPic = (id) => { const d = MP_NPCD.get(+id); return d ? 'https://wow.zamimg.com/modelviewer/live/webthumbs/npc/' + (d % 256) + '/' + d + '.webp' : ''; };
const mpBossPic = (name) => { const k = MP_BOSSPIC[String(name || '').toLowerCase().replace(/[^a-z]/g, '')]; return k ? 'https://wow.zamimg.com/images/wow/journal/ui-ej-boss-' + k + '.png' : ''; };
// (always Caster, by NPC ID (Flex: "Yes, both casters"): Murder Row's Corrupted Warlock and Felonious Mage; then (Flex: "yea fix those things") the three
// whose damage is mostly magic but who rarely begin a cast: Ruby Life Pools' High Channeler Ryvati, Temple of Sethraliss' Spark Channeler (both IDs)
// and Orb Watcher)
const MP_CASTER = new Set([235265, 236084, 197535, 139110, 265057, 135007]);
// (the pack's type tags: a 12 px icon, then the word (map-extras.md item 17))
const MP_PKI = (() => { const sv = (b) => '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">' + b + '</svg>';
  return { cast: sv('<path d="M2 10.5 8.2 4.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9.5 .8v2.4M9.5 4.2v2.4M7.1 3.4h2.4M10.3 3.4h1.9" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>') + 'Caster',
    melee: sv('<path d="M2 10 9.6 2.4M8 1.6l2.4 2.4M1.6 8.2l2.2 2.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>') + 'Melee',
    elite: sv('<path d="M6 1 7.5 4.4 11 4.6 8.3 7 9.1 10.6 6 8.7 2.9 10.6 3.7 7 1 4.6 4.5 4.4z" fill="currentColor"/>') + 'Elite' }; })();
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
  const kickEv = [], ccEv = [], petOwn = new Map(), npcPos = new Map(), uq = (v) => String(v || '').replace(/^"|"$/g, ''); /* (the pull card's Kicks & CC) */
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
    if ((ev === 'SPELL_CAST_START' || ev === 'SPELL_HEAL' || ev === 'SPELL_PERIODIC_HEAL') && (line.startsWith('Creature-', c + 1) || line.startsWith('Vehicle-', c + 1))) { const f = E.split(line, c + 1), u = uOf(f[0], f[1]); /* (an enemy that casts, or heals another enemy: the card's Pack) */
      if (ev === 'SPELL_CAST_START') { (u.cs || (u.cs = new Set())).add(uq(f[9])); u.nc = (u.nc || 0) + 1; (u.cst || (u.cst = {}))[f[8]] = t; } else if (NPC.test(f[4] || '') && f[4] !== f[0]) u.hl = true; continue; }
    if (ev === 'SWING_MISSED' && (line.startsWith('Creature-', c + 1) || line.startsWith('Vehicle-', c + 1))) { const f = E.split(line, c + 1); if (String(f[4]).startsWith('Player-')) { const u = uOf(f[0], f[1]); u.nsw = (u.nsw || 0) + 1; } continue; } /* (a swing that missed is still a melee swing) */
    if (ev === 'SPELL_SUMMON') { const f = E.split(line, c + 1); if (f[5]) summoned.add(f[5]); if (/^Player-/.test(f[0] || '') && f[4]) petOwn.set(f[4], short(uq(f[1]))); /* (a pet's or a totem's CC is its player's) */ if (NPC.test(f[4] || '')) uOf(f[4]).sum = true; continue; } /* (summoned: not counted in "what you pulled" (round 4)) */
    if (ev === 'CHALLENGE_MODE_END') { const f = E.split(line, c + 1); R.rateAfter = num(f[5]) || null; continue; } /* (the player's rating after the key, as WoW wrote it (Nov 2)) */
    if (ev === 'SPELL_AURA_APPLIED') { if (line.indexOf('BUFF', c) < 0) continue; const f = E.split(line, c + 1); if (f[11] === 'BUFF' && String(f[4]).startsWith('Player-') && MP_LUST.test(f[9])) lustT.push([t, f[9]]);
      else if (T && f[11] === 'DEBUFF' && (/^(Player|Pet)-/.test(f[0] || '') || petOwn.has(f[0])) && NPC.test(f[4] || '') && MP_CC.has(mpLc(uq(f[9])))) { const p = npcPos.get(f[4]); const cp = lastPos.get(f[0]); ccEv.push({ t, src: f[0], who: petOwn.get(f[0]) || short(uq(f[1])), sp: uq(f[9]), tg: uq(f[5]), g: f[4], x: p && p[0], y: p && p[1], ui: p && p[2], cx: cp && cp[0], cy: cp && cp[1], cui: cp && cp[2] }); }
      continue; }
    const dmg = ev === 'SPELL_DAMAGE' || ev === 'SPELL_PERIODIC_DAMAGE' || ev === 'SWING_DAMAGE' || ev === 'RANGE_DAMAGE';
    if (!dmg && ev !== 'SPELL_CAST_SUCCESS') continue;
    const f = E.split(line, c + 1);
    if (T && ev === 'SPELL_CAST_SUCCESS' && (/^(Player|Pet)-/.test(f[0] || '') || petOwn.has(f[0])) && MP_KNOCK.has(mpLc(uq(f[9])))) { const g = NPC.test(f[4] || '') ? f[4] : null, p = g ? npcPos.get(g) : null; const cp = lastPos.get(f[0]); ccEv.push({ t, src: f[0], who: petOwn.get(f[0]) || short(uq(f[1])), sp: uq(f[9]), tg: g ? uq(f[5]) : '', g, x: p && p[0], y: p && p[1], ui: p && p[2], cx: cp && cp[0], cy: cp && cp[1], cui: cp && cp[2] }); }
    if (ev === 'SPELL_CAST_SUCCESS' && String(f[0]).startsWith('Player-')) { const id = +f[8]; if (DEF.has(id) || /healthstone/i.test(f[9])) { const m = defUse.get(f[0]) || new Map(), k2 = DEF.has(id) ? id : 'hs'; m.set(k2, (m.get(k2) || []).concat(t)); defUse.set(f[0], m); } }
    if (ev === 'SPELL_CAST_SUCCESS' && String(f[0]).startsWith('Player-')) { const nm = short(f[1]), s = cdOf.get(nm); if (s && s.has(mpLc(f[9]))) { const l = cast[nm] = cast[nm] || []; if (!l.some((x) => x[1] === f[9] && t - x[0] < 5)) l.push([t, f[9]]); } } /* (one press, even if the log writes it twice) */
    const adv = ev === 'SWING_DAMAGE' ? 8 : 11; if (f.length < adv + ADV) continue;
    if (dmg && String(f[4]).startsWith('Player-') && !String(f[0]).startsWith('Player-')) { const sp = ev === 'SWING_DAMAGE' ? 'Melee' : String(f[9] || '').replace(/^"|"$/g, ''), amt = num(f[adv + ADV]), l = hitsOf.get(f[4]) || [];
      l.push([t, sp, String(f[1] || '').replace(/^"|"$/g, ''), amt, f[adv] === f[4] ? num(f[adv + 3]) : maxOf.get(f[4]) || 0]); /* (a swing's block is the attacker's: the player's health from their own) */ if (l.length > 8) l.shift(); hitsOf.set(f[4], l);
      /* (an avoidable hit's spot: the hit player's own spot as it landed; a beam ticking every second is one hit until they're out of it for 1.6 s, and tanks aren't counted, as on the page) */
      if (T && avSet.has(mpLc(sp)) && roleOf.get(short(f[5])) !== 'tank') { const k2 = f[4] + '|' + mpLc(sp), lt = avLast.get(k2); avLast.set(k2, t); if (!(lt > t - 1.6)) { let x = 0, y = 0, ui = 0; if (f[adv] === f[4]) { x = +f[adv + 14]; y = +f[adv + 15]; ui = +f[adv + 16] || 0; } else { const lp = lastPos.get(f[4]); if (lp && t - lp[3] <= 2) [x, y, ui] = lp; }
        if (x || y) avHits.push({ t, who: short(f[5]), sp, x, y, ui }); } } }
    if (dmg && String(f[0]).startsWith('Player-') && NPC.test(f[4] || '')) { const u = uOf(f[4], f[5]); u.fl |= parseInt(f[6], 16) || 0; if (u.hit == null) u.hit = t; }
    /* (a killing blow counts as a death when the log has no death line for it: Temple's Static Anomalies, 6 killed and worth 30, never get one) */
    if (T && dmg && /^(Player|Pet)-/.test(f[0] || '') && NPC.test(f[4] || '') && num(f[adv + ADV + 2]) > 0 && !seen.has(f[4])) { const g = f[4], u = uOf(g, f[5]); if (u.died == null) u.died = t; seen.add(g); const v = T.n[+g.split('-')[5]]; if (v) add[pullAt(t)] += v; }
    if (T) { const ig = f[adv];
      if (String(ig).startsWith('Player-')) { const x = +f[adv + 14], y = +f[adv + 15], mh = num(f[adv + 3]); if (x || y) lastPos.set(ig, [x, y, +f[adv + 16] || 0, t]); if (mh) maxOf.set(ig, mh); }
      else if (ev === 'SPELL_CAST_SUCCESS' && ig === f[0] && NPC.test(ig || '') && ksp.has(mpLc(f[9]))) { const x = +f[adv + 14], y = +f[adv + 15]; if (x || y) castPos.push({ t, sp: mpLc(f[9]), x, y, ui: +f[adv + 16] || 0 }); }
      if (NPC.test(f[adv] || '')) { { const x = +f[adv + 14], y = +f[adv + 15]; if (x || y) npcPos.set(f[adv], [x, y, +f[adv + 16] || 0]); } const u = uOf(f[adv]); if (!u.at) { const x = +f[adv + 14], y = +f[adv + 15]; if ((x || y) && x === x) { u.at = [x, y, +f[adv + 16] || 0]; u.hp = +f[adv + 3] || 0; } } } }
    if (dmg && NPC.test(f[0] || '') && String(f[4]).startsWith('Player-')) { taken[pullAt(t)] += num(f[adv + ADV]); const u = uOf(f[0], f[1]); if (ev === 'SWING_DAMAGE') { u.sw = true; u.nsw = (u.nsw || 0) + 1; } else if (ev !== 'SPELL_PERIODIC_DAMAGE') u.nsp = (u.nsp || 0) + 1;
      /* (how it fights, for the Pack's Caster and Melee: its damage to players and how much of it was magic, by the spell's school (anything but
         Physical; swings are Physical), the hit and what a shield took; a channel's ticks, one cast per channel (a gap of 3 s or more starts a new one,
         and none counts when it began a cast of that spell in the 6 s before)) */
      const a = num(f[adv + ADV]) + num(f[adv + ADV + 6]); u.dm = (u.dm || 0) + a; if (ev !== 'SWING_DAMAGE' && (parseInt(f[10], 16) || 1) !== 1) u.mg = (u.mg || 0) + a;
      if (ev === 'SPELL_PERIODIC_DAMAGE') { const ch = u.ch || (u.ch = {}), lt = ch[f[8]]; ch[f[8]] = t; if (!(lt > t - 3) && !(u.cst && u.cst[f[8]] > t - 6)) u.nch = (u.nch || 0) + 1; } }
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
  // (what kind of enemy each one is, from this key's own log (map-extras.md item 17): a caster began casts, a healer healed another enemy, melee only
  // swung; its health for Big and Small; the casts it was kicked on or let off. By name, for the pull card's Pack)
  { const ty = {}; for (const u of U.values()) { if (!u.n || u.hit == null || !(u.fl & 0x40) || (u.fl & 0x3000)) continue; const o = ty[u.n] || (ty[u.n] = { cs: 0, hl: false, sw: false, hp: 0, kick: [], id: +u.g.split('-')[5] || 0, nc: 0, nk: 0, nsw: 0, nsp: 0, n: 0, mins: 0, dm: 0, mg: 0, nch: 0 });
      if (u.cs) o.cs += u.cs.size; if (u.hl) o.hl = true; if (u.sw) o.sw = true; if (u.hp > o.hp) o.hp = u.hp; o.nc += u.nc || 0; o.dm += u.dm || 0; o.mg += u.mg || 0; o.nch += u.nch || 0; o.nsw += u.nsw || 0; o.nsp += u.nsp || 0; o.n++; if (u.died != null && u.died > u.hit) o.mins += (u.died - u.hit) / 60; }
    const addK = (nm, sp) => { const o = ty[nm]; if (o && sp && !o.kick.includes(sp)) o.kick.push(sp); }; for (const e of kickEv) { addK(e.tg, e.cut); if (ty[e.tg]) ty[e.tg].nk++; } for (const p of P) for (const t of p.through || []) addK(t.mob, t.spell);
    /* (Caster (Flex: "just because theres a cast bar doesnt make them a caster", "casters will melee but most of their damage is from spells",
       "melee might have cast times, but its physical damage being done"): it healed another enemy, OR it began 14 or more casts a minute, OR 60% or
       more of its damage to players was magic AND it began 10 or more a minute (kicks and channels counted). Casts a minute keeps a caster that's
       kicked a lot (a kicked cast does no damage, so its damage is swings: Storm Adept, 19.5 a minute and 47% magic); the 10 keeps a brute with a
       magic slam Melee (Devouring Brutalizer, 62% magic and 5 a minute, which Flex called out as a Caster). An enemy that did under 1% of the key's
       average enemy's damage (it died first, or only buffs) goes by casts a minute alone: 10 or more. MP_CASTER names the ones Flex called) */
    const L0 = Object.values(ty), avg = L0.reduce((a, o) => a + o.dm, 0) / Math.max(1, L0.reduce((a, o) => a + o.n, 0));
    for (const o of L0) { const hits = o.nsw + o.nsp; o.swing = hits ? o.nsw / hits : 0; o.cpm = o.mins ? (o.nc + o.nk + o.nch) / o.mins : 0; o.magic = o.dm ? o.mg / o.dm : 0;
      o.low = !(o.dm / Math.max(1, o.n) >= 0.01 * avg); o.caster = MP_CASTER.has(o.id) || o.hl || (o.low ? o.cpm >= 10 : o.cpm >= 14 || (o.magic >= 0.6 && o.cpm >= 10)); }
    R.mobType = ty; }
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
      L.push({ x: u.at[0], y: u.at[1], ui: u.at[2], k, hp: u.hp, t: tt, n: u.n, id: +u.g.split('-')[5] || 0 }); }
    for (let m = 0; m < N; m++) if (!L.some((u) => u.k === m)) for (const u of U.values()) if (ok(u) && u.g.split('-')[4] === zone && u.hit >= P[m].s && u.hit <= P[m].e) L.push({ x: u.at[0], y: u.at[1], ui: u.at[2], k: m, hp: u.hp, t: u.hit, n: u.n, id: +u.g.split('-')[5] || 0 }); /* (a pull whose enemies all died in the next one: the ones first hit in it (Den of Nalorakk's two Frostfangs, Nov 2)) */
    for (let m = 0; m < N; m++) if (P[m].boss) { const us = L.filter((u) => u.k === m), top = Math.max(0, ...us.map((u) => u.hp)); for (const u of us) if (top && u.hp >= top * 0.3) u.boss = true; }
    const avT = new Map(); for (const p of P) for (const a of p.avoid || []) if (a.ts) { const k = a.who + '|' + mpLc(a.spell); avT.set(k, (avT.get(k) || []).concat(a.ts)); } /* (only the hits the key reader counted: not a cast on the whole group, not a spell's free hits (Nov 2)) */
    R.units = L; R.deathPos = deathPos; R.castPos = castPos; R.avHits = avT.size ? avHits.filter((h) => { const l = avT.get(h.who + '|' + mpLc(h.sp)); return !!l && l.some((t) => Math.abs(t - h.t) < 0.35); }) : avHits; R.kickEv = kickEv; R.ccEv = ccEv; }
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
    if (row) row.classList.toggle('mpt-row2u', far); /* (above both lanes (the tidy pass)) */
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
  const rt = R.route, strip = tl ? '<div class="mpt-mstrip">' + tl + '</div>' + (rt && rt.ok ? '<p class="mpt-ex">Enemy counts from <a href="https://raider.io" target="_blank" rel="noopener">Raider.IO</a>.</p>' : '') : '';
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
  const kgrp = (L) => { const m = new Map(); for (const x of L || []) { const o = m.get(x.spell) || { n: 0, r: new Set() }; o.n++; for (const w of x.ready || []) o.r.add(w); m.set(x.spell, o); } return [...m]; };
  const tip =(q) => mpPullTip(q.RR, q.i, [q.wait ? '<span class="mpt-tg2">⏱ waited ' + mpMM(q.wait) + '</span>' : '', q.chained ? '<span class="mpt-tg2">chained</span>' : '', q.us && !q.us.length ? '<span class="mpt-tg2">no spot</span>' : ''].filter(Boolean)); /* (the studio's item 15) */
  // (Know this dungeon's tips on the matching pulls: a boss's plan; trash tips only for named enemies that were in the pull. At most 3)
  const K = MP_KNOW[mpLc(R.run.dungeon)], tips = (q) => { if (!K) return []; if (q.p.boss) { const b = K.b.find(([n]) => mpLc(n) === mpLc(q.p.boss)); return b ? b[1].slice(0, 3) : []; }
    const names = mpMobs(q.RR, q.p).map((m) => mpLc(m[0])); return K.t.filter((x) => { const L = [...x.matchAll(/\*\*(.+?)\*\*/g)].map((m) => mpLc(m[1]).replace(/s$/, '')); return L.length && L.some((n) => names.some((m) => m.startsWith(n) || n.startsWith(m))); }).slice(0, 3); };
  const svg = (Q, fl) => { const k = fl.box[2] / W, f = fl.f, here = (u) => u.ui === f[0], cen = new Map(), shapes = [], marks = [], tags = [], defs = [], uid = (Q[0] && Q[0].RR === R ? 'y' : 'f') + fl.i;
    for (const q of Q) { const us = q.us.filter(here); if (us.length) { /* (its shapes and tag only where its enemies stood; its marks wherever they landed) */
      /* (one outline per group of enemies standing within 50 yards of each other (the studio, Nov 2; Voidscar pull 1 has a 46-yard gap, its
         dragged Siphoids 88 or more): a pull stretched across the room is several shapes in one colour, its number on the biggest) */
      const gi = us.map((u, j) => j), root = (j) => (gi[j] === j ? j : (gi[j] = root(gi[j])));
      for (let a = 0; a < us.length; a++) for (let b = a + 1; b < us.length; b++) if (Math.hypot(us[a].x - us[b].x, us[a].y - us[b].y) <= 50) gi[root(a)] = root(b);
      const cl = new Map(); us.forEach((u, j) => { const r = root(j); if (!cl.has(r)) cl.set(r, []); cl.get(r).push(u); });
      const groups = [...cl.values()].sort((a, b) => b.length - a.length), big = groups[0].map((u) => px(f, u));
      cen.set(q.i, [big.reduce((a, v) => a + v[0], 0) / big.length, big.reduce((a, v) => a + v[1], 0) / big.length]);
      const shape = (g, gi) => { const pts = g.map((u) => px(f, u)), hp = mpHull(pts), d = (hp.length === 1 ? [hp[0], hp[0]] : hp).map((v, j) => (j ? 'L' : 'M') + v[0].toFixed(1) + ' ' + v[1].toFixed(1)).join('') + (hp.length > 2 ? 'Z' : '');
        const pad = 30 * k, e = 1.6 * k, id = 'mpm-' + uid + '-' + q.i + '-' + gi, lj = ' stroke-linejoin="round" stroke-linecap="round"';
        defs.push('<mask id="' + id + '" maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="9000" height="9000"><rect x="-4000" y="-4000" width="9000" height="9000" fill="#fff"/><path d="' + d + '" fill="#000" stroke="#000" stroke-width="' + pad.toFixed(1) + '"' + lj + '/></mask>');
        return '<g class="mpt-hpg" opacity=".09"><path d="' + d + '" fill="' + q.c + '" stroke="' + q.c + '" stroke-width="' + pad.toFixed(1) + '"' + lj + '/></g>' +
          '<path class="mpt-hedge" d="' + d + '" fill="none" stroke="' + q.c + '" stroke-width="' + (pad + 2 * e).toFixed(2) + '" data-pad="' + pad.toFixed(2) + '" data-e="' + e.toFixed(3) + '"' + lj + ' mask="url(#' + id + ')"/>' +
          pts.map((v, j) => { const el = !g[j].boss && mpElite(q.RR, g[j].n); return '<circle cx="' + v[0].toFixed(1) + '" cy="' + v[1].toFixed(1) + '" r="' + ((g[j].boss || el ? 6.5 : 4.2) * k).toFixed(1) + '" fill="#0f1117" stroke="' + (el ? '#ffd166' : q.c) + '" stroke-width="' + (1.8 * k).toFixed(2) + '"/>'; }).join('') +
          pts.map((v, j) => { const u = g[j]; if (u.boss) return ''; const src = mpNpcPic(u.id); if (!src) return ''; const el = mpElite(q.RR, u.n), r2 = el ? 10 : 8, o = (q.RR.mobType || {})[u.n] || {};
            return '<g class="mpt-ep' + (el ? ' mpt-epe' : '') + '" transform="translate(' + v[0].toFixed(1) + ',' + v[1].toFixed(1) + ') scale(' + k.toFixed(3) + ')"' + mpT1('<b>' + esc(u.n || '') + '</b>' + (el ? ' · Elite' : '') + ' · ' + (o.caster ? 'Caster' : 'Melee')) + '><circle r="' + r2 + '" fill="#3b4458"/>' +
              '<image data-href="' + src + '" x="' + (-r2 * 5 / 3).toFixed(2) + '" y="' + (-r2 * 4 / 3).toFixed(2) + '" width="' + (r2 * 10 / 3).toFixed(2) + '" height="' + (r2 * 10 / 3).toFixed(2) + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#mpec' + r2 + '-' + uid + ')" onerror="this.parentNode.remove()"/><circle r="' + r2 + '" fill="none" stroke="' + (el ? '#ffd166' : q.c) + '" stroke-width="1.8"/></g>'; }).join(''); };
      const port = (() => { const src = q.p.boss && mpBossPic(q.p.boss); if (!src) return ''; const bs = us.filter((u) => u.boss).map((u) => px(f, u)), at = bs.length ? [bs.reduce((a, v) => a + v[0], 0) / bs.length, bs.reduce((a, v) => a + v[1], 0) / bs.length] : null; if (!at) return '';
        return '<g class="mpt-bport" transform="translate(' + at[0].toFixed(1) + ',' + at[1].toFixed(1) + ') scale(' + k.toFixed(3) + ')"><circle r="15" fill="#0f1117"/><image href="' + src + '" x="-14" y="-14" width="28" height="28" preserveAspectRatio="xMidYMid slice" clip-path="url(#mpbc-' + uid + ')" onerror="this.remove()"/><circle r="14.4" fill="none" stroke="#e5c56b" stroke-width="1.4"/></g>'; })();
      shapes.push('<g class="mpt-mpl" data-pi="' + q.i + '"' + mpT1(tip(q)) + '>' + groups.map(shape).join('') + port + '</g>');
      const top = big.reduce((a, v) => (v[1] < a[1] ? v : a)), wt = q.wait ? '⏱' + mpMM(q.wait) : '', ww = wt.length * 7 + 8;
      const rr = q.RR.route && q.RR.route.ok && q.RR.route.full === rt.full ? q.RR.route : null, cum = rr ? 100 * rr.pulls.slice(0, q.i + 1).reduce((a, x) => a + x.add, 0) / rr.full : null, ptx = cum != null && !q.p.boss ? (Math.round(cum * 10) / 10).toFixed(1) + '%' : '';
      const pw = ptx ? ptx.length * 6.6 + 12 : 0, LW = 22 + (pw ? 3 + pw : 0), x0 = -LW / 2;
      tags.push('<g class="mpt-mpl mpt-mtag" data-pi="' + q.i + '" data-oy="' + (26 * k).toFixed(1) + '"' + mpT1(tip(q)) + ' transform="translate(' + top[0].toFixed(1) + ',' + (top[1] - 26 * k).toFixed(1) + ') scale(' + k.toFixed(3) + ')">' +
        '<rect x="' + x0.toFixed(1) + '" y="-11" width="22" height="22" rx="4" fill="' + q.c + '" stroke="#0f1117" stroke-width="1.2"/><text class="mpt-tgn" x="' + (x0 + 11).toFixed(1) + '" y="4.5" text-anchor="middle" fill="#0f1117">' + (q.p.boss ? '★' : mpNo(q.RR, q.p.n)) + '</text>' +
        (pw ? '<rect x="' + (x0 + 25).toFixed(1) + '" y="-10" width="' + pw.toFixed(1) + '" height="20" rx="10" fill="#0f1117" fill-opacity=".92" stroke="' + q.c + '" stroke-width="1.4"/><text class="mpt-tgp" x="' + (x0 + 25 + pw / 2).toFixed(1) + '" y="4" text-anchor="middle" fill="#e8eaed">' + ptx + '</text>' : '') +
        (q.bad ? '<circle class="mk-bad" cx="' + (x0 + 21).toFixed(1) + '" cy="-11" r="5" fill="#ff8f87" stroke="#0f1117" stroke-width="1.5"/>' : '') +
        (q.lust ? '<g class="mk-lust"><rect x="' + (x0 + LW + 3).toFixed(1) + '" y="-11" width="20" height="20" rx="4" fill="#0f1117" stroke="#ffd166" stroke-width="1.5"/><text x="' + (x0 + LW + 13).toFixed(1) + '" y="4" text-anchor="middle" fill="#ffd166" style="font-size:12px">⚡</text></g>' : '') +
        (wt ? '<g class="mk-wait"><rect x="' + (x0 - 3 - ww).toFixed(1) + '" y="-10" width="' + ww + '" height="18" rx="4" fill="#0f1117" stroke="#aeb6bf" stroke-width="1"/><text x="' + (x0 - 3 - ww / 2).toFixed(1) + '" y="3.5" text-anchor="middle" fill="#aeb6bf" style="font-size:11px">' + wt + '</text></g>' : '') + '</g>');
      }
      // (☠ where each player died: their last spot before it; !N at the casters of the casts that went off, purple for the high ones, grey for the rest)
      for (const d of q.dd) if (here(d)) { const [x, y] = px(f, d); marks.push('<g class="mpt-mk mk-death" data-pi="' + q.i + '" data-who="' + esc(d.who) + '"' + mpT1('<b>' + esc(d.who) + ' died</b> here · ' + nm(q) + '<br><span class="sub">Click to see how</span>') + ' transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(' + k.toFixed(3) + ')"><circle r="10" fill="#0f1117" stroke="#ff8f87" stroke-width="2"/><text y="4.5" text-anchor="middle" fill="#ff8f87" style="font-size:12px">☠</text></g>'); }
      for (const [L, n, cls, col] of [[q.kh, (q.p.through || []).length, 'mk-kick', '#c39bff'], [q.km, (q.p.minor || []).length, 'mk-kick mk-kick2', '#95a0ab']]) { const l = L.filter(here); if (!l.length) continue;
        const [x, y] = px(f, { x: l.reduce((a, c) => a + c.x, 0) / l.length, y: l.reduce((a, c) => a + c.y, 0) / l.length });
        marks.push('<g class="mpt-mk ' + cls + '" data-pi="' + q.i + '"' + mpT1('<b>' + plural(n, 'cast') + ' went off with a kick ready</b> · ' + nm(q)) + ' transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(' + k.toFixed(3) + ')"><circle r="11" fill="#0f1117" stroke="' + col + '" stroke-width="2"/><text y="4.5" text-anchor="middle" fill="' + col + '" style="font-size:12px">!' + n + '</text></g>'); }
      // (avoidable hits where they landed: small amber marks, bunched within 5 yards, off until the chip turns them on)
      { const bs = []; for (const h of q.av.filter(here)) { const b = bs.find((x) => Math.hypot(x.x - h.x, x.y - h.y) <= 5); if (b) b.l.push(h); else bs.push({ x: h.x, y: h.y, l: [h] }); }
        for (const b of bs) { const [x, y] = px(f, b), m = new Map(); for (const h of b.l) { const k2 = h.who + ' · ' + h.sp; m.set(k2, (m.get(k2) || 0) + 1); }
          marks.push('<g class="mpt-mk mk-avoid" data-pi="' + q.i + '"' + mpT1([...m].map(([k2, c]) => esc(k2) + ' ×' + c).join('<br>')) + ' transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(' + k.toFixed(3) + ')"><circle r="' + (b.l.length > 1 ? 8 : 6) + '" fill="#f2c46b" fill-opacity=".9" stroke="#0f1117" stroke-width="1.5"/>' +
            (b.l.length > 1 ? '<text y="4" text-anchor="middle" fill="#0f1117" style="font-size:10px;font-weight:700">' + b.l.length + '</text>' : '') + '</g>'); } } }
    // (the route: a dotted line through each pull's middle, in order, with a chevron at each midpoint; "then Arena →" where it leaves this floor)
    const order = Q.filter((q) => cen.has(q.i)), route = [];
    for (let j = 1; j < order.length; j++) { const a = cen.get(order[j - 1].i), b = cen.get(order[j].i), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      route.push('<path d="M-4 -4 L2 0 L-4 4" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2" transform="translate(' + mx.toFixed(1) + ',' + my.toFixed(1) + ') rotate(' + ang.toFixed(0) + ') scale(' + k.toFixed(3) + ')"/>'); }
    const line = order.length > 1 ? '<polyline data-pis="' + order.map((q) => q.i).join(',') + '" points="' + order.map((q) => cen.get(q.i).map((v) => v.toFixed(1)).join(',')).join(' ') + '" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="' + (2.2 * k).toFixed(2) + '" stroke-dasharray="' + (7 * k).toFixed(1) + ' ' + (6 * k).toFixed(1) + '"/>' : '';
    const last = order[order.length - 1], nx = last && Q.slice(last.i + 1).find((q) => q.fl >= 0 && floors[q.fl].f[0] !== f[0]);
    if (nx) { const [x, y] = cen.get(last.i), t = 'then ' + floors[nx.fl].f[1] + ' →', tw2 = t.length * 6.4 + 14;
      route.push('<g class="mpt-mthen" data-mdtf="' + nx.fl + '" role="button" transform="translate(' + (x + 18 * k).toFixed(1) + ',' + (y + 14 * k).toFixed(1) + ') scale(' + k.toFixed(3) + ')"><rect width="' + tw2.toFixed(0) + '" height="20" rx="10" fill="#0f1117" fill-opacity=".85" stroke="#fff" stroke-opacity=".45"/><text x="' + (tw2 / 2).toFixed(0) + '" y="14" text-anchor="middle" fill="#e8ebee" style="font-size:11.5px">' + esc(t) + '</text></g>'); }
    return '<svg viewBox="' + fl.box.map((v) => v.toFixed(1)).join(' ') + '" role="img" aria-label="' + esc(f[1]) + '"><image href="https://wow.zamimg.com/images/wow/maps/enus/original/' + rt.zone + (fl.i ? '-' + fl.i : '') + '.jpg" x="0" y="0" width="' + W + '" height="' + H + '" opacity=".85" style="filter:brightness(.72) saturate(.75) contrast(1.05)"/>' +
      '<defs><clipPath id="mpbc-' + uid + '" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath><clipPath id="mpec8-' + uid + '"><circle r="8"/></clipPath><clipPath id="mpec10-' + uid + '"><circle r="10"/></clipPath>' + defs.join('') + '</defs><g class="mk-route">' + line + route.join('') + '</g>' + shapes.join('') + marks.join('') + tags.join('') + '</svg>'; };
  // (the picked pull's card: what went wrong, worst first, each player's damage a second, and the big cooldowns pressed in this pull itself
  // (from 3 s before it to 1 s after: the studio's fix, where a chain's whole list showed on each of its pulls). The fast run's from its own log)
  // (the pull card (the studio's tidy-pass.md item 7, toward 10/10, Flex: "Do 1, 2 and 3"): the title, one line of tags as in the hover, the pack, the plan,
  // then closed one-liners that open on a click (Kicks & CC, DPS, how each player died), each remembered in this browser across pulls)
  const CF = (() => { try { return JSON.parse(localStorage.getItem('mpt-cardfold') || '{}') || {}; } catch (e) { return {}; } })();
  const fold = (k, sum, body, at) => '<details class="mpt-cfd' + (k === 'x' ? ' mpt-mdr' : '') + '" data-cf="' + k + '"' + (at || '') + (CF[k] ? ' open' : '') + '><summary class="mpt-cfs">' + sum + '</summary><div class="mpt-cfb">' + body + '</div></details>';
  const card = (q, run) => { const RR = q.RR, p = q.p, gd = mpGd(p), ppl = (RR.people || []).slice().sort(mpByRole), i = q.i;
    // (one line of tags, the same as the hover's; "✓ Clean" when there's nothing)
    const tags = mpPullTags(RR, i).concat(q.wait ? ['<span class="mpt-tg2 mpt-t2w">⏱ waited ' + mpMM(q.wait) + '</span>'] : []);
    let next = '';
    if (run === 'you' && p.boss && F) { const fb = F.pulls.filter((x) => x.boss === p.boss), t = fb.length ? mpNextBoss(R, F, [p], fb) : ''; if (t) next = '<p class="mpt-mcn">▼ ' + t.replace(/^<p class="mpt-nt"><b>Next time<\/b> /, '').replace(/<\/p>$/, '') + '</p>'; }
    const tp = tips(q), plan = tp.length ? '<p class="mpt-mck2">Plan</p><ul class="mpt-mtips">' + tp.map((x) => '<li>' + mpKm(x) + '</li>').join('') + '</ul>' : '';
    const byW = (L) => { const m = new Map(); for (const x of L || []) if (x.who) m.set(x.who, (m.get(x.who) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]).map(([w, c]) => mpWho(RR, w) + ' ' + c).join(' · '); };
    const en = (n) => plural(n, 'enemy').replace(/enemys$/, 'enemies');
    // (Kicks & CC: one row per player, most kicks first, with the spells they kicked and their CC ("on N" for more than one enemy); the enemies kicked and
    // the CC's targets in each cell's hover, as on the map)
    let kicks = ''; { const kname = (e) => (String(e.src).startsWith('Pet-') ? ((p.kicks || []).find((x) => Math.abs(x.t - e.t) < 0.5) || {}).who || e.who : e.who), P = new Map();
      const row = (w) => { if (!P.has(w)) P.set(w, { w, k: new Map(), kt: new Map(), c: new Map(), nk: 0, nc: 0 }); return P.get(w); };
      for (const e of q.kx) { const o = row(kname(e)), sp = e.cut || e.tg, k2 = e.tg + '\n' + e.cut; o.nk++; o.k.set(sp, (o.k.get(sp) || 0) + 1); if (!o.kt.has(k2)) o.kt.set(k2, { tg: e.tg, cut: e.cut, n: 0 }); o.kt.get(k2).n++; }
      for (const e of q.cx) { const o = row(e.who), c = o.c.get(e.sp) || { tg: new Map() }; if (e.g && !c.tg.has(e.g)) c.tg.set(e.g, e.tg); o.c.set(e.sp, c); }
      for (const c of mpCCcasts(q.cx)) row(c.who).nc++; /* (CC casts, as in Kicks and CC) */
      const L = [...P.values()].sort((a, b) => b.nk - a.nk || b.nc - a.nc || a.w.localeCompare(b.w)), nk = L.reduce((t, o) => t + o.nk, 0), nc = L.reduce((t, o) => t + o.nc, 0), dash = '<span class="mpt-mcz">—</span>';
      const tbl = L.map((o) => { const kc = [...o.k].map(([sp, n]) => esc(sp) + (n > 1 ? '&nbsp;<span class="mpt-m">×' + n + '</span>' : '')).join(', ');
        const kh = '<b>' + esc(o.w) + '</b>' + [...o.kt.values()].map((x) => '<br>Kicked ' + esc(x.tg) + (x.n > 1 ? ' ×' + x.n : '') + (x.cut ? ' (' + esc(x.cut) + ')' : '')).join('');
        const cc = [...o.c].map(([sp, c]) => esc(sp) + (c.tg.size > 1 ? ' <span class="mpt-m">on&nbsp;' + c.tg.size + '</span>' : '')).join(', ');
        const ch = '<b>' + esc(o.w) + '</b>' + [...o.c].map(([sp, c]) => { const nm2 = new Map(); for (const n of c.tg.values()) nm2.set(n, (nm2.get(n) || 0) + 1);
          return '<br>' + esc(sp) + (c.tg.size ? ' → ' + en(c.tg.size) + ' (' + [...nm2].map(([a, k]) => esc(a) + (k > 1 ? ' ×' + k : '')).join(', ') + ')' : ''); }).join('');
        return '<div class="mpt-mkr" data-who="' + esc(o.w) + '"><span>' + mpWho(RR, o.w) + '</span><span' + (kc ? mpT1(kh) : '') + '>' + (kc || dash) + '</span><span' + (cc ? mpT1(ch) : '') + '>' + (cc || dash) + '</span></div>'; }).join(''), ss = byW(p.stops);
      if (L.length || ss) kicks = fold('k', '<b>Kicks &amp; CC</b>' + (nk ? ' · ' + plural(nk, 'kick') : '') + (nc ? ' · ' + nc + ' CC' : '') + (!nk && !nc && ss ? ' · stops' : ''),
        (L.length ? '<div class="mpt-mkr mpt-mkh"><span></span><span>Kicked</span><span>CC</span></div>' + tbl : '') + (ss ? '<p class="mpt-mcf">Stops: ' + ss + '</p>' : '')); }
    // (DPS, highest first, with each player's big cooldowns pressed here in a fourth column ("none" when they have some but pressed none here, blank when
    // none are tracked, the times in the hover); the healer's healing a line under the rows)
    const dl = ppl.slice().sort((a, b) => ((p.dmg || {})[b.name] || 0) - ((p.dmg || {})[a.name] || 0)), mx = Math.max(1, ...ppl.map((x) => (p.dmg || {})[x.name] || 0));
    const act = new Set((RR.cdWho || []).filter((n) => ((RR.cds || {})[n] || []).length)), mine = (n) => (act.has(n) ? RR.cds[n].filter((x) => x.t >= p.s - 3 && x.t <= p.e + 1) : []), cdc = act.size > 0;
    const cdCell = (n) => { if (!act.has(n)) return '<span class="mpt-mcc"></span>'; const l = mine(n); if (!l.length) return '<span class="mpt-mcc mpt-mcz">none</span>';
      const m = new Map(); for (const x of l) m.set(x.spell, (m.get(x.spell) || 0) + 1);
      return '<span class="mpt-mcc"' + mpT1('<b>' + esc(n) + '</b>' + l.map((x) => '<br>' + esc(x.spell) + ' · ' + (x.t < p.s ? 'just before the pull' : mpMM(x.t - p.s) + ' in')).join('')) + '>' + [...m].map(([sp, c]) => esc(sp) + (c > 1 ? ' ×' + c : '')).join(', ') + '</span>'; };
    const dps = !ppl.length ? '' : fold('d', '<b>DPS</b>' + (dl[0] && (p.dmg || {})[dl[0].name] ? ' · ' + mpWho(RR, dl[0].name) + ' ' + mpGF((p.dmg || {})[dl[0].name]) : '') + (gd ? ' · group ' + mpGF(gd) : ''),
      '<div class="mpt-mlh' + (cdc ? '' : ' no-cd') + '"><span>DPS</span>' + (cdc ? '<small>Big cooldown</small>' : '') + '</div><div class="gbx mpt-gbd' + (cdc ? '' : ' no-cd') + '">' + dl.map((x) => { const d = (p.dmg || {})[x.name] || 0, cc = mpCC(x.cls);
        return '<div class="gbx-r" data-who="' + esc(x.name) + '" style="--c:' + cc + '"><span class="gbx-n" style="color:' + cc + '">' + esc(x.name) + '</span><span class="gbx-b"><i style="width:' + (100 * d / mx).toFixed(1) + '%"></i></span><b class="gbx-v">' + mpGF(d) + '</b>' + (cdc ? cdCell(x.name) : '') + '</div>'; }).join('') + '</div>' +
      ppl.filter((x) => x.role === 'healer' && (p.heal || {})[x.name]).map((x) => '<p class="mpt-mcf" data-who="' + esc(x.name) + '">' + mpWho(RR, x.name) + ' healed ' + mpGF(p.heal[x.name]) + ' a second.</p>').join('') +
      (cdc && q.chained && !dl.some((x) => mine(x.name).length) ? '<p class="mpt-mcf">No big cooldowns here: chained onto the pull before, where they went out.</p>' : ''));
    // (how each player died: the killing blow and its source, and whether a defensive was used, on the line; the last hits, what was ready and the
    // Healthstone inside)
    const died = p.deaths.slice().sort((a, b) => a.t - b.t).map((d) => { const r = q.dd.find((x) => x.who === d.who && Math.abs(x.t - d.t) < 3);
      const body = '<p class="mpt-mcm">Died to <b>' + esc(d.to || 'unknown') + '</b>' + (d.from ? ' (from ' + esc(d.from) + ')' : '') + ', ' + mpMM(d.t - p.s) + ' in. ' + (d.defs ? 'Used ' + plural(d.defs, 'defensive') + '.' : 'No defensive used.') + '</p>' + (!r ? '' :
        (r.hits.length ? '<ol>' + r.hits.map((h) => '<li><span class="mpt-m">' + h.ago.toFixed(1) + ' s before:</span> <b>' + esc(h.sp) + '</b>' + (h.from ? ' <span class="mpt-m">(' + esc(h.from) + ')</span>' : '') + ' ' + mpGF(h.amt) + (h.pct ? ' <span class="mpt-m">· ' + Math.round(100 * h.pct) + '% of their health</span>' : '') + '</li>').join('') + '</ol>' : '') +
        '<p class="mpt-mcm">' + (r.ready.length ? mpAnd(r.ready.map(esc)) + (r.ready.length === 1 ? ' was' : ' were') + ' ready.' : 'No defensive was ready.') + (r.used.length ? ' Used: ' + r.used.map(([n, sec]) => esc(n) + ' (' + sec + ' s before)').join(', ') + '.' : '') + ' Healthstone: ' + (r.hs != null ? 'used ' + r.hs + ' s before.' : 'not used.') + '</p>');
      return fold('x', '<span class="mpt-t2d">☠</span> <b>How ' + mpWho(RR, d.who) + ' died</b> · ' + esc(d.to || 'unknown') + (d.from ? ' (' + esc(d.from) + ')' : '') + ' · ' + (d.defs ? plural(d.defs, 'defensive') : 'no defensive'), body, ' data-dr="' + esc(d.who) + '"'); }).join('');
    // (the pack (map-extras.md item 17; Flex: "those are considered the mini bosses in dungeons or the harder mobs to deal with"): each kind of enemy with
    // one role, Caster (it healed another enemy, or it keeps casting: 14 or more casts a minute, or 10 or more with mostly magic damage) or Melee; Elite for the mini-boss tier, at least twice the health of
    // the key's middle trash enemy (the same on every pull), or a rare; fodder, half that or less, on one last line. 5 rows, then the rest in a hover)
    const pack = (() => { const mobs = mpMobs(RR, p), ty = RR.mobType || {}; if (!mobs.length) return '';
      mpMid(RR); /* (the middle trash enemy of the whole key, each one counted: one-off kings don't lift it) */
      const mid = RR.mobMid, L = mobs.map(([n2, c]) => { const o = ty[n2] || {}, cast = !!o.caster, el = MP_RARE.has(o.id) || (mid && o.hp >= 2 * mid && RR.mobTrash.has(n2)), /* (trash only: never a boss or a boss fight's own enemies) */ fod = !el && mid && o.hp && o.hp <= mid / 2;
        return { n2, c, el, fod, cast, kick: o.kick || [] }; }).sort((a, b) => b.el - a.el || b.cast - a.cast || b.c - a.c);
      const tag = (k) => '<i class="mpt-pkt mpt-pk-' + k + '">' + MP_PKI[k] + '</i>', role = (x) => tag(x.cast ? 'cast' : 'melee');
      const row = (x) => '<div class="mpt-pkr"><b>' + x.c + '×</b><span class="mpt-pkn">' + ((pic) => (pic ? '<img class="mpt-pkp" src="' + pic + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' : '<i class="mpt-pkp mpt-pkp0"></i>'))(mpNpcPic((ty[x.n2] || {}).id)) + esc(x.n2) + '</span>' + (x.el ? tag('elite') : '') + role(x) + (x.kick.length ? '<small>kick: ' + x.kick.map((k) => '<b>' + esc(k) + '</b>').join(', ') + '</small>' : '') + '</div>';
      const main = L.filter((x) => !x.fod), fod = L.filter((x) => x.fod), more = main.slice(5);
      return '<div class="mpt-pk"><p class="mpt-mck2">Pack · ' + plural(mobs.reduce((a, m) => a + m[1], 0), 'enemy').replace('enemys', 'enemies') + '</p>' + main.slice(0, 5).map(row).join('') +
        (more.length ? '<p class="mpt-pkm" tabindex="0"' + mpT1(more.map((x) => x.c + '× ' + esc(x.n2)).join('<br>')) + '>+' + plural(more.length, 'more type') + '</p>' : '') +
        (fod.length ? '<p class="mpt-pkf">+ ' + fod.map((x) => x.c + '× ' + esc(x.n2) + ' ' + role(x)).join(', ') + '</p>' : '') + '</div>'; })();
    return '<div class="mpt-mch">' + badge(q) + '<b>' + nm(q) + '</b><span>' + mpMM(p.dur) + (q.add ? ' · +' + fmt(pc(q.add)) : '') + (() => { const r2 = RR.route && RR.route.ok ? RR.route : null; return r2 ? ' · ' + fmt(100 * r2.pulls.slice(0, q.i + 1).reduce((a, x) => a + x.add, 0) / r2.full) + ' total' : ''; })() + (gd ? ' · ' + mpGF(gd) + ' group DPS' : '') + '</span></div>' +
      '<p class="mpt-mtl">' + (tags.join(' ') || '<span class="mpt-t2g">✓ Clean</span>') + '</p>' + next + pack + plan + kicks + dps + died; };
  // (the pulls as tiles under the map (Flex, Nov 2: "any way to fill the dead space? Maybe the pull counter horizontal across the bottom somehow?"): the
  // badge over two lines, the name, then the time, the % and the icons; the full name, "chained" and "no spot" in the hover)
  const list = (Q) => '<ol class="mpt-mfl">' + Q.map((q) => { const pct = q.add ? pc(q.add) : 0, th = (q.p.through || []).length;
    return '<li data-pi="' + q.i + '"' + (q.fl >= 0 ? ' data-fl="' + q.fl + '"' : '') + ' data-lab="' + esc(q.p.boss ? q.p.boss : 'Pull ' + mpNo(q.RR, q.p.n)) + '" tabindex="0"' + mpT1(tip(q)) + '>' + badge(q) + '<span class="mpt-pnm">' + nm(q) + '</span>' +
      '<span class="mpt-pl2"><span class="mpt-ptm">' + mpMM(q.p.dur) + '</span><span class="mpt-pfc">' + (pct ? '+' + fmt(pct) : '—') + '</span>' +
      '<span class="mpt-mic">' + (q.p.deaths.length ? '<i class="d">☠</i>' : '') + (th ? '<i class="k">!' + th + '</i>' : '') + (q.lust ? '<i class="l">⚡</i>' : '') + '</span></span></li>'; }).join('') + '</ol>';
  const f0 = Math.max(0, floors.findIndex((x) => x.us[0].length));
  const fb = '<div class="mpt-flb" role="group" aria-label="Floor">' + (floors.length > 1 ? floors.map((fl, j) => '<button type="button" data-mdtf="' + j + '"' + (j === f0 ? ' class="on"' : '') + '>' + esc(fl.f[1]) + '</button>').join('') : '<span>' + esc(floors[0].f[1]) + '</span>') + '</div>';
  const LAY = [['r', '⋯', 'Route'], ['d', '☠', 'Deaths'], ['k', '!', 'Missed kicks'], ['l', '⚡', 'Lust'], ['w', '⏱', 'Waits'], ['a', '◆', 'Avoidable', 1]];
  const eye = '<b class="mpt-eye" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8Z" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8" r="2" fill="currentColor"/><path class="x" d="M2.5 13.5 13.5 2.5" stroke="currentColor" stroke-width="1.4"/></svg></b>';
  const lay = '<div class="mpt-lay"><button type="button" class="mpt-layb" aria-expanded="false">Layers <span class="mpt-layn">' + LAY.filter((x) => !x[3]).length + ' of ' + LAY.length + '</span> ▾</button><div class="mpt-layp" role="group" aria-label="Show on the map">' +
    LAY.map(([c, i, l, off]) => '<button type="button" class="mpt-mchip' + (off ? '' : ' on') + ' mpt-mchip-' + c + '" data-mchip="' + c + '" aria-pressed="' + !off + '"><i>' + i + '</i><span>' + l + '</span>' + eye + '</button>').join('') + '</div></div>';
  const views = runs.map(([v, RR], ri) => { const Q = pullsOf(RR);
    return '<div class="mpt-mdtv" data-v="' + v + '" data-n="' + Q.length + '"' + (ri ? ' hidden' : '') + '><div class="mpt-mgrid"><div class="mpt-mleft"><div class="mpt-mwrap">' + fb + lay + floors.map((fl, j) => '<div class="mpt-mdtm" data-f="' + j + '"' + (j === f0 ? '' : ' hidden') + '>' + svg(Q, fl) + '</div>').join('') +
      '<div class="zctl mpt-zctl"><button type="button" data-mz="1" aria-label="Zoom in">+</button><button type="button" data-mz="-1" aria-label="Zoom out" disabled>−</button></div></div>' + list(Q) + '</div>' +
      '<div class="mpt-mside"><div class="mpt-mcard"><p class="mpt-mc0">Pick a pull.</p><div class="mpt-mcx" hidden></div>' + Q.map((q) => '<div class="mpt-mc" data-pi="' + q.i + '" hidden>' + card(q, v) + '</div>').join('') + '</div></div></div></div>'; }).join('');
  // (the map's controls in one bar (Nov 2, the studio's tidy-pass.md, Flex: "this section could be organized much better"): You and Fast run as slim
  // tabs, the player as a select, the stepper on the right; the floors and the layers sit on the map)
  const tg = runs.length > 1 ? '<div class="mpt-mtg" role="group" aria-label="Whose pulls">' + runs.map(([v, RR], ri) => '<button type="button" data-mdtv="' + v + '" aria-pressed="' + !ri + '"' + (ri ? '' : ' class="on"') + '>' + (v === 'you' ? 'You' : 'Fast run') + ' · ' + plural(RR.pulls.filter((p) => !p.boss).length, 'pull') + '</button>').join('') + '</div>' : '';
  const step = '<div class="mpt-mstep"><button type="button" data-mstep="-1" aria-label="Previous pull">◀</button><span>Pick a pull</span><button type="button" data-mstep="1" aria-label="Next pull">▶</button></div>';
  const pl = (R.people || []).slice().sort(mpByRole), pp = pl.length ? '<label class="mpt-ppl">Player <select class="mpt-ppsel" data-mppsel aria-label="Show a player"><option value="">Everyone</option>' + pl.map((x) => '<option value="' + esc(x.name) + '" style="color:' + mpCC(x.cls) + '">' + esc(x.name) + '</option>').join('') + '</select></label>' : '';
  return '<div class="mpt-mdt no-a"><div class="mpt-mbar">' + tg + pp + step + '</div>' + views + strip + '</div>'; }
// (picking: a click or tap on a shape, tag, mark, list row, timeline block or ◀ ▶. The map goes to the pull's floor, the pull lights up and the
// rest dim, the card shows it; the pick stays when the tab redraws. A hover only lights up (MP.peek), never moving the card or the floor)
const mpMdtFloor = (box, j) => { if (!box || j == null || j === '') return; j = String(j); if (MP.mz && MP.mz.f !== j) { MP.mz = { f: j, z: 1, c: null }; mpZoomBtns(box, 1); } box.querySelectorAll('[data-mdtf]').forEach((x) => x.classList.toggle('on', x.dataset.mdtf === j)); box.querySelectorAll('.mpt-mdtm').forEach((m) => { m.hidden = m.dataset.f !== j; }); mpZoom(box); }; /* (the new floor's marks at the map's size) */
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
  for (const sv of view.querySelectorAll('.mpt-mdtm svg')) mpEdges(sv, MP.mz && MP.mz.f === (sv.closest('.mpt-mdtm') || {}).dataset.f ? MP.mz.z : 1);
  if (one) mpFitPull(box, view, ids[0]); else mpZoomTo(box, 1, null); } /* (a picked pull fills the map (item 9); several lit up, the whole floor) */
function mpMapPeek(view, i) { if (!view) return; view.classList.toggle('peek', i != null); view.querySelectorAll('[data-pi]').forEach((x) => x.classList.toggle('pk', i != null && x.dataset.pi === String(i))); }
// (pick a player: only their kick, CC and death marks on the map, the others' rows in the card faded; the Home character is the default later)
function mpMapPP(name) { const box = document.querySelector('.mpt-mdt'); if (!box) return; name = name || ''; MP.pp = name;
  { const pe = document.getElementById('mptPart'), it2 = MP.item, R2 = it2 && MP.R[mpK(it2)]; if (pe && R2 && pe.dataset.for !== name) pe.outerHTML = mpPartHtml(R2, MP.fastOf && MP.fastOf.k === mpK(it2) ? MP.fastOf : null, name); } /* (Your part follows the pick) */
  box.querySelectorAll('[data-mppsel]').forEach((x) => { x.value = name; const o = x.selectedOptions[0]; x.style.color = name && o ? o.style.color : ''; });
  box.querySelectorAll('.mpt-mdtv[data-v="you"] [data-who]').forEach((el) => el.classList.toggle('pp-off', !!name && !el.dataset.who.split('|').includes(name))); }
document.addEventListener('change', (e) => { const x = e.target; if (!x || !x.matches || !x.matches('[data-mppsel]')) return; mpMapPP(x.value); if (MP.ppK) { const m = mpPPGet(); m[MP.ppK] = x.value; try { localStorage.setItem(MP_PPK, JSON.stringify(m)); } catch (e2) { /* (not kept) */ } } });
document.addEventListener('toggle', (e) => { const d = e.target; if (!d.matches || !d.matches('details[data-cf]')) return; if (d.dataset.auto) { delete d.dataset.auto; return; } const k = d.dataset.cf; /* (a skull's click opens one, and isn't kept) */ let m = {}; try { m = JSON.parse(localStorage.getItem('mpt-cardfold') || '{}') || {}; } catch (x) { m = {}; }
  if (!!m[k] !== d.open) { m[k] = d.open; try { localStorage.setItem('mpt-cardfold', JSON.stringify(m)); } catch (x) { /* (not kept) */ } } document.querySelectorAll('details[data-cf="' + k + '"]').forEach((x) => { if (x !== d && x.open !== d.open) x.open = d.open; }); }, true); /* (the card's one-liners, open or closed the same on every pull) */
// (a Your part tag: picks its pull and scrolls to the map, or scrolls to Your group for the spec one)
document.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('#mptPart [data-mppick], #mptPart [data-mpgo]'); if (!t) return; e.preventDefault();
  if (t.dataset.mppick != null) mpMapPick('you', [t.dataset.mppick]); const ch = document.getElementById(t.dataset.mppick != null ? 'mptCM' : t.dataset.mpgo); if (ch) ch.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
// (a tag on the pull card: a tap or click shows its hover's words on a line under the tags (who had a kick ready, who dispelled, who got hit), so
// nothing on the card is hover-only on a phone (the studio's phone pass); a second tap hides it)
document.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('.mpt-mtl .mpt-tg2[data-tt]'); if (!t) return; const p = t.parentNode, nx = p.nextElementSibling;
  const x = nx && nx.classList.contains('mpt-tgx') ? nx : p.insertAdjacentElement('afterend', Object.assign(document.createElement('p'), { className: 'mpt-tgx' })), on = !t.classList.contains('on');
  p.querySelectorAll('.mpt-tg2.on').forEach((y) => y.classList.remove('on')); t.classList.toggle('on', on); x.hidden = !on; if (on) x.innerHTML = t.getAttribute('data-tt'); const tip = document.querySelector('.spc-tt'); if (tip) tip.hidden = true; });
// (zoom (Flex: "the map should have a zoom in and zoom out option"): + and − step 1×, 1.5×, 2.25×, 3×; the scroll wheel zooms smoothly in between
// (Flex, Nov 2: "can you make it so scroll wheel zooms in and out too"; Debriefing's maps keep + and − only); drag to pan; pinch on a phone. No reset
// and no double-click (Flex's rules for maps, Oct 20/22). Tags, marks and the route keep their size on screen, so a busy pull spreads out. A
// new floor goes back to 1×; picking a pull pans to it; a redraw keeps the zoom; a drag never picks)
const MP_ZS = [1, 1.5, 2.25, 3], MP_TF = /translate\(([-\d.]+),([-\d.]+)\)(?: rotate\(([-\d.]+)\))? scale\(([-\d.]+)\)/;
const mpZoomF = (box) => { const b = box.querySelector('[data-mdtf].on'); if (b && b.closest('.mpt-flb')) return b.dataset.mdtf; const m = box.querySelector('.mpt-mdtm:not([hidden])'); return m ? m.dataset.f : '0'; };
const mpZoomBtns = (box, z) => { if (!box) return; box.querySelectorAll('[data-mz="1"]').forEach((b) => { b.disabled = z >= 2.999; }); box.querySelectorAll('[data-mz="-1"]').forEach((b) => { b.disabled = z <= 1.001; }); };
// (how much bigger the marks draw on a narrow map: the labels, portraits, dots and edges are sized for a map about 860 px wide; on a phone they grow,
// up to 2.2x, so a label isn't 8 px tall)
const mpSF = (box) => { const sv = [...box.querySelectorAll('.mpt-mdtm svg')].find((x) => x.clientWidth > 0); return sv ? Math.min(2.2, Math.max(1, 860 / sv.clientWidth)) : 1; };
function mpZoom(box, at) { if (!box) return; const fi = mpZoomF(box), st = MP.mz && MP.mz.f === fi ? MP.mz : (MP.mz = { f: fi, z: 1, c: null }); if (at) st.c = at; mpZoomBtns(box, st.z); const sf = mpSF(box);
  for (const svg of box.querySelectorAll('.mpt-mdtm[data-f="' + fi + '"] svg')) { const b = (svg.dataset.vb || (svg.dataset.vb = svg.getAttribute('viewBox'))).split(' ').map(Number), z = st.z, w = b[2] / z, h = b[3] / z;
    const c = st.c || [b[0] + b[2] / 2, b[1] + b[3] / 2], x = Math.max(b[0], Math.min(b[0] + b[2] - w, c[0] - w / 2)), y = Math.max(b[1], Math.min(b[1] + b[3] - h, c[1] - h / 2)); st.c = [x + w / 2, y + h / 2];
    svg.setAttribute('viewBox', [x, y, w, h].map((v) => v.toFixed(1)).join(' ')); svg.style.touchAction = z > 1 ? 'none' : 'pan-y';
    for (const el of svg.querySelectorAll('[transform]')) { if (!el.dataset.tf) { const m = MP_TF.exec(el.getAttribute('transform')); if (!m) continue; el.dataset.tf = [m[1], m[2], m[3] || '', m[4]].join(','); }
      const [tx, ty, rot, sc] = el.dataset.tf.split(','), oy = +el.dataset.oy || 0; el.setAttribute('transform', 'translate(' + tx + ',' + (+ty + oy - oy * sf / z).toFixed(1) + ')' + (rot ? ' rotate(' + rot + ')' : '') + ' scale(' + (sc * sf / z).toFixed(4) + ')'); }
    for (const el of svg.querySelectorAll('polyline, line')) { if (el.dataset.sw == null) { el.dataset.sw = el.getAttribute('stroke-width') || ''; el.dataset.da = el.getAttribute('stroke-dasharray') || ''; }
      if (el.dataset.sw) el.setAttribute('stroke-width', (el.dataset.sw / z).toFixed(3)); if (el.dataset.da) el.setAttribute('stroke-dasharray', el.dataset.da.split(' ').map((v) => (v / z).toFixed(2)).join(' ')); }
    for (const el of svg.querySelectorAll('.mpt-mpl > circle')) { if (!el.dataset.r) { el.dataset.r = el.getAttribute('r'); el.dataset.csw = el.getAttribute('stroke-width') || ''; } el.setAttribute('r', (el.dataset.r * sf / z).toFixed(2)); if (el.dataset.csw) el.setAttribute('stroke-width', (el.dataset.csw * sf / z).toFixed(3)); }
    svg.classList.toggle('mpt-zin', z >= 1.5); for (const im of svg.querySelectorAll(z >= 1.5 ? '.mpt-ep image[data-href]' : '.mpt-epe image[data-href]')) { im.setAttribute('href', im.dataset.href); im.removeAttribute('data-href'); } /* (portraits load when shown) */
    mpEdges(svg, z, sf); } }
// (each pull's crisp edge: the masked copy's width is the pad plus twice the rim, the rim kept ~1.6 px on screen at any zoom, 2.4 px on the picked pull)
function mpEdges(svg, z, sf) { const v = svg.closest('.mpt-mdtv'), pick = v && v.classList.contains('pick'); if (!sf) { const bx = svg.closest('.mpt-mdt'); sf = bx ? mpSF(bx) : 1; } for (const el of svg.querySelectorAll('.mpt-hedge')) { const hot = pick && el.closest('.mpt-mpl.hot'); el.setAttribute('stroke-width', (+el.dataset.pad + 2 * el.dataset.e * (hot ? 1.5 : 1) * sf / (z || 1)).toFixed(2)); } }
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
// (the wheel: the spot under the mouse stays put. The page never gets stuck: at 1× a wheel down scrolls the page, at 3× a wheel up is swallowed, and a
// wheel that was scrolling the page in the last 0.4 s keeps scrolling it. Ctrl + wheel (a laptop pinch) zooms the map, never the page)
{ let pgT = 0, wh = 0;
  document.addEventListener('scroll', () => { pgT = Date.now(); }, { passive: true, capture: true });
  document.addEventListener('wheel', (e) => { const svg = e.target.closest && e.target.closest('.mpt-mdtm svg'); if (!svg) return; const box = svg.closest('.mpt-mdt'); if (!box) return;
    if (!e.ctrlKey && Date.now() - pgT < 400) return; let dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1); if (!dy) return;
    mpZoom(box); const st = MP.mz, z0 = st.z; if (z0 <= 1.001 && dy > 0 && !e.ctrlKey) return; e.preventDefault();
    if (e.ctrlKey) dy = Math.max(-100, Math.min(100, dy * 6.67)); /* (a laptop pinch sends small steps: scaled so the map follows your fingers; a Ctrl + wheel notch zooms like a plain one) */
    const z = Math.max(1, Math.min(3, z0 * Math.exp(-dy * 0.0015))); if (Math.abs(z - z0) < 1e-4) return;
    document.querySelectorAll('.spc-tt').forEach((t) => { t.hidden = true; }); document.body.classList.add('mpz-wh'); clearTimeout(wh); wh = setTimeout(() => document.body.classList.remove('mpz-wh'), 250); /* (no hover card while it turns) */
    const at = () => { const m = svg.getScreenCTM(); if (!m) return null; const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); return [p.x, p.y]; };
    const a = at(); st.z = z; mpZoom(box); const b = at(); if (a && b) mpZoom(box, [st.c[0] + a[0] - b[0], st.c[1] + a[1] - b[1]]); }, { passive: false }); }
// (a picked pull fills the map (the studio's item 9, Flex: "have the map zoomed in on the pull by default"): the box around its enemies and its tag, a
// quarter more on each side, between 1.5× and 2.25×, gliding there in about 300 ms; a pull on another floor switches floor first. Hand zoom and drag
// work as before, and the next pick fits again)
function mpZoomTo(box, z, c, ms) { mpZoom(box); const st = MP.mz; if (!st) return; const z0 = st.z, c0 = (st.c || [0, 0]).slice(), t0 = performance.now(), n = MP.zAnim = (MP.zAnim || 0) + 1, D = ms == null ? (MP.zNow ? 0 : 300) : ms;
  const go = (k) => { if (MP.zAnim !== n) return; const e = k >= 1 ? 1 : 1 - Math.pow(1 - k, 3); st.z = z0 + (z - z0) * e; mpZoom(box, c ? [c0[0] + (c[0] - c0[0]) * e, c0[1] + (c[1] - c0[1]) * e] : null); };
  if (!D) { go(1); return; } const step = () => { const k = (performance.now() - t0) / D; go(Math.min(1, k)); if (k < 1 && MP.zAnim === n) requestAnimationFrame(step); }; requestAnimationFrame(step); setTimeout(() => go(1), D + 60); }
function mpFitPull(box, view, i) { const svg = view.querySelector('.mpt-mdtm:not([hidden]) svg'); if (!svg) return; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const el of svg.querySelectorAll('.mpt-mpl[data-pi="' + i + '"]')) { const m = MP_TF.exec(el.getAttribute('transform') || ''); let b = null;
    if (el.dataset.tf) { const [tx, ty] = el.dataset.tf.split(','); b = { x: +tx, y: +ty + (+el.dataset.oy || 0), width: 0, height: 0 }; } else if (m) b = { x: +m[1], y: +m[2], width: 0, height: 0 }; else { try { b = el.getBBox(); } catch (e) { b = null; } }
    if (!b) continue; x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }
  if (x1 < x0) { mpZoomTo(box, 1, null); return; } const vb = (svg.dataset.vb || svg.getAttribute('viewBox')).split(' ').map(Number), fit = (a, b, c, d) => Math.min(vb[2] / Math.max(1, (c - a) * 1.5), vb[3] / Math.max(1, (d - b) * 1.5));
  /* (its route segment, from the pull before on this floor, when the whole of it still fits at 1.5×) */
  const pl = svg.querySelector('polyline[data-pis]'), ix = pl ? pl.dataset.pis.split(',').indexOf(String(i)) : -1;
  if (ix > 0) { const [px, py] = pl.getAttribute('points').split(' ')[ix - 1].split(',').map(Number), a = Math.min(x0, px), b = Math.min(y0, py), c = Math.max(x1, px), d = Math.max(y1, py); if (fit(a, b, c, d) >= 1.5) { x0 = a; y0 = b; x1 = c; y1 = d; } }
  mpZoomTo(box, Math.max(1.5, Math.min(2.25, fit(x0, y0, x1, y1))), [(x0 + x1) / 2, (y0 + y1) / 2]); }
function mpMapRestore() { const p = MP.pick, has = p && document.querySelector('.mpt-mdtv[data-v="' + p.v + '"]'); if (has) { MP.zNow = true; try { mpMapPick(p.v, p.ids, p.sum); } finally { MP.zNow = false; } } if (MP.pp) mpMapPP(MP.pp); if (!has) { const bx = document.querySelector('.mpt-mdt'); if (bx) mpZoom(bx, MP.mz && MP.mz.z > 1 ? MP.mz.c : null); } }
document.addEventListener('click', (e) => { const t = e.target; if (!t.closest) return; const box = t.closest('.mpt-mdt');
  if (MP.dragT && Date.now() - MP.dragT < 250 && t.closest('.mpt-mdtm')) { e.stopPropagation(); e.preventDefault(); return; } /* (the end of a drag or pinch, not a pick) */
  if (!t.closest('.mpt-lay')) document.querySelectorAll('.mpt-lay.open').forEach((x) => { x.classList.remove('open'); x.querySelector('.mpt-layb').setAttribute('aria-expanded', 'false'); });
  const lb = t.closest('.mpt-layb'); if (lb) { const w = lb.closest('.mpt-lay'), o = !w.classList.contains('open'); w.classList.toggle('open', o); lb.setAttribute('aria-expanded', String(o)); return; }
  const sv = t.closest('[data-mdtv]'); if (sv && box) { mpMapView(box, sv.dataset.mdtv); return; }
  const sf = t.closest('[data-mdtf]'); if (sf && box) { mpMdtFloor(box, sf.dataset.mdtf); return; }
  const pb = t.closest('[data-mpp]'); if (pb && box) { mpMapPP(pb.dataset.mpp); return; }
  const ch = t.closest('[data-mchip]'); if (ch && box) { const c = ch.dataset.mchip, on = !ch.classList.contains('on'); box.querySelectorAll('[data-mchip="' + c + '"]').forEach((x) => { x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); box.classList.toggle('no-' + c, !on);
    const all = new Set([...box.querySelectorAll('[data-mchip]')].map((x) => x.dataset.mchip)), shown = new Set([...box.querySelectorAll('[data-mchip].on')].map((x) => x.dataset.mchip)); box.querySelectorAll('.mpt-layn').forEach((x) => { x.textContent = shown.size + ' of ' + all.size; }); return; }
  const st = t.closest('[data-mstep]'); if (st && box) { const view = box.querySelector('.mpt-mdtv:not([hidden])'), n = +view.dataset.n, p = MP.pick && MP.pick.v === view.dataset.v && MP.pick.ids.length === 1 ? +MP.pick.ids[0] : -1;
    let k = p + +st.dataset.mstep; if (k < 0) k = n - 1; if (k >= n) k = 0; mpMapPick(view.dataset.v, k); return; }
  const blk = t.closest('.mpt-mstrip .mpt-blk[data-pi]'); if (blk) { mpMapPick(blk.dataset.run, blk.dataset.pi); return; }
  const go = t.closest('[data-mpps]'); if (go) { e.preventDefault(); e.stopPropagation(); const ids = go.dataset.mpps.split(','), ch2 = document.getElementById('mptCM');
    mpMapPick('you', ids, '<div class="mpt-mch"><b>' + go.dataset.mpt + '</b><span>' + go.dataset.mpl + '</span></div><p class="mpt-mcm">Lit up on the map. Click one for what happened in it.</p>');
    if (ch2) ch2.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  const dm = t.closest('.mpt-mdtv .mk-death'); if (dm) { const view = dm.closest('.mpt-mdtv'), box2 = view.querySelector('.mpt-mcard'); mpMapPick(view.dataset.v, dm.dataset.pi);
    const c = [...view.querySelectorAll('.mpt-mc[data-pi="' + dm.dataset.pi + '"] .mpt-mdr')].find((x) => x.dataset.dr === dm.dataset.who); if (c && c.tagName === 'DETAILS' && !c.open) { c.dataset.auto = '1'; c.open = true; } if (c && box2) { if (box2.scrollHeight > box2.clientHeight + 4) box2.scrollTop = c.offsetTop - 6; else c.scrollIntoView({ behavior: 'smooth', block: 'center' }); } return; } /* (a phone: the card has no scroll of its own) */
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
  .mpt-pl .gbx-b{display:none}
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
.mpt .mpt-mchip.on{color:var(--text);border-color:var(--faint)} .mpt-mchip i{font-style:normal;margin-right:5px} .mpt-mchip-d i{color:#ff8f87} .mpt-mchip-k i{color:#c39bff;font-weight:700} .mpt-mchip-l i{color:#ffd166} .mpt-mchip-a i{color:#f2c46b}
.mpt-mpp{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 10px} .mpt-mpp > span{font:600 12.5px var(--body);color:var(--faint)}
.mpt .mpt-mpp button{height:26px;margin:0;padding:0 10px;border:1px solid var(--line2);border-radius:4px;background:none;font:600 12.5px var(--body);cursor:pointer;color:var(--muted)} .mpt .mpt-mpp button.on{border-color:currentColor;background:var(--raised)}
.mpt-mcard .pp-off{opacity:.35}
.mpt-mrow{display:flex;justify-content:space-between;align-items:center;gap:8px 10px;flex-wrap:wrap;margin:0 0 8px}
.mpt-mstep{display:flex;align-items:center;gap:8px} .mpt .mpt-mstep button{height:28px;margin:0;padding:0 10px;border:1px solid var(--line2);border-radius:4px;background:none;color:var(--text);font:600 13px var(--body);cursor:pointer}
.mpt-mstep span{min-width:150px;text-align:center;font:600 13px var(--body);color:var(--text)}
.mpt-mgrid{display:grid;grid-template-columns:minmax(0,2fr) minmax(300px,1.2fr);gap:12px;align-items:stretch} .mpt-mleft{display:flex;flex-direction:column;gap:10px;min-width:0}
.mpt-mwrap{position:relative} .mpt-mwrap .mpt-mdtm{aspect-ratio:16/10} .mpt-mdtm svg{touch-action:pan-y} .mpt-zctl{z-index:2} .mpt .mpt-zctl button{margin:0;font:700 16px var(--body);line-height:1} .mpt .mpt-zctl button:disabled{opacity:.35;cursor:default;border-color:var(--line2);color:var(--muted)}
.mpt-mdtv .mpt-mpl,.mpt-mdtv .mpt-mk{transition:opacity .12s;cursor:pointer}
.mpt-mdtv.pick:not(.peek) .mpt-mpl:not(.hot),.mpt-mdtv.pick:not(.peek) .mpt-mk:not(.hot){opacity:.15}
.mpt-mdtv.peek .mpt-mpl:not(.pk),.mpt-mdtv.peek .mpt-mk:not(.pk){opacity:.35}
.mpt-mdt .mpt-mk.pp-off,.mpt-mdt.no-a .mk-avoid,.mpt-mdt.no-r .mk-route,.mpt-mdt.no-r .mpt-mthen,.mpt-mdt.no-d .mk-death,.mpt-mdt.no-k .mk-kick,.mpt-mdt.no-k .mk-bad,.mpt-mdt.no-l .mk-lust,.mpt-mdt.no-w .mk-wait{display:none}
.mpt-mthen{cursor:pointer}
.mpt-mside{position:relative;min-width:0;min-height:380px} .mpt-mside > .mpt-mcard{position:absolute;inset:0;height:auto} /* (the card as tall as the map and its tiles; a longer one scrolls) */
.mpt-mcard{position:relative;height:380px;overflow:auto;box-sizing:border-box;padding:10px 12px;background:var(--raised);border:1px solid var(--line2);border-radius:4px;font:500 13px/1.4 var(--body);color:var(--mpt-soft)}
.mpt-mcard p{margin:4px 0 0} .mpt-mcard b{color:var(--text)} .mpt .mpt-mc0{margin:0;color:var(--faint)}
.mpt-mch{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 4px} .mpt-mch > b{font:700 15px var(--body);color:var(--text)} .mpt-mch > span:last-child{color:var(--muted);font-size:12.5px}
.mpt .mpt-mcd{color:#ffb3ad} .mpt .mpt-mck{color:#d9c4ff} .mpt .mpt-mcm{color:var(--muted)} .mpt .mpt-mcn{color:#f2c46b} .mpt .mpt-mcl{color:#ffd166} .mpt .mpt-mcw{color:var(--muted)} .mpt .mpt-mco{color:#7ee08f}
.mpt .mpt-mck2{margin:10px 0 4px!important;font:700 11px var(--head);letter-spacing:.44px;text-transform:uppercase;color:var(--faint)}
.mpt-gbk{--gbx-cols:168px minmax(0,1fr) 64px 56px 48px;--gbx-cols-m:104px minmax(0,1fr) 44px 40px 36px} .mpt-gbk .gbx-s[data-tt]{cursor:help} .mpt-gbk .gbx-hd > span:nth-child(n+3){text-align:right}
.mpt-gbk .gbx-n img{width:16px;height:16px;border-radius:3px;flex:none} .mpt-gbk .gbx-n .mpt-nm{min-width:0;overflow:hidden;text-overflow:ellipsis;font:600 13px var(--body)} .mpt .mpt-mlh{padding:0 4px}
.mpt-gbd{--gbx-cols:82px minmax(0,1fr) 44px 120px;--gbx-cols-m:82px minmax(0,1fr) 44px 96px} .mpt-gbd.no-cd{--gbx-cols:82px minmax(0,1fr) 44px;--gbx-cols-m:82px minmax(0,1fr) 44px}
.mpt-gbd .gbx-n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700} .mpt-gbd .mpt-mcc{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:500 12px var(--body);color:var(--muted);text-align:left} .mpt-gbd .mpt-mcc[data-tt]{cursor:help} .mpt-mcr span{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpt-mcr s{display:block;height:5px;border-radius:3px;background:rgba(255,255,255,.06);text-decoration:none} .mpt-mcr s i{display:block;height:5px;border-radius:3px;opacity:.85} .mpt-mcr b{text-align:right;font-weight:600;font-variant-numeric:tabular-nums} .mpt-mcr small{color:var(--muted);font-weight:500}
.mpt .mpt-mcz{color:var(--faint)} .mpt .mpt-mcf{color:var(--faint)}
.mpt .mpt-mlh, .mpt .mpt-mlh2{margin:10px 0 4px;font:700 11px var(--head);letter-spacing:.44px;text-transform:uppercase;color:var(--faint)} .mpt .mpt-mlh2{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.mpt .mpt-mlh{display:grid;grid-template-columns:82px minmax(0,1fr) 44px 120px;gap:8px;align-items:baseline} .mpt .mpt-mlh.no-cd{grid-template-columns:82px minmax(0,1fr) 44px} .mpt-mlh > span{grid-column:1/4;white-space:nowrap}
.mpt-mlh2 small{font:500 11px var(--body);letter-spacing:0;text-transform:none} .mpt-mlh small{font:700 10px var(--head);letter-spacing:.4px;white-space:nowrap}
.mpt-mkr{display:grid;grid-template-columns:82px minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:baseline;font-size:12.5px;margin:2px 0} .mpt-mkr > span{min-width:0;overflow-wrap:break-word} .mpt-mkr > span[data-tt]{cursor:help}
.mpt-mkr > span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap} .mpt .mpt-mkh{margin:2px 0 3px;font:700 10px var(--head);letter-spacing:.4px;text-transform:uppercase;color:var(--faint)}
@media (max-width:700px){ .mpt .mpt-mlh{grid-template-columns:82px minmax(0,1fr) 44px 96px} }
.mpt-mfl{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:6px}
.mpt-mfl li{display:grid;grid-template-columns:24px minmax(0,1fr);align-items:center;column-gap:7px;row-gap:1px;margin:0;padding:5px 7px;border:1px solid var(--line2);border-radius:4px;background:var(--raised);cursor:pointer;min-width:0}
.mpt-mfl li .mpt-nb{grid-row:1 / 3;width:22px;height:22px;box-sizing:border-box;font-size:12px} .mpt-mfl li .mpt-pnm{font:600 12.5px var(--body)} .mpt-pl2{display:flex;align-items:baseline;gap:7px;min-width:0;white-space:nowrap;font:500 11.5px var(--body)}
.mpt-pl2 .mpt-ptm{color:#aeb6bf;font-size:11.5px} .mpt-pl2 .mpt-pfc{color:#868f99;font-weight:500;text-align:left} .mpt-pl2 .mpt-mic{margin-left:auto}
.mpt-mfl li:hover,.mpt-mfl li.pk{border-color:#4a5262} .mpt-mfl li.hot,.mpt-mfl li:focus-visible{outline:0;border-color:var(--gold);box-shadow:inset 0 0 0 1px var(--gold);background:rgba(242,196,107,.06)}
.mpt-mic{white-space:nowrap} .mpt-mic i{font-style:normal;margin-left:4px} .mpt-mic .d{color:#ff8f87} .mpt-mic .k{color:#c39bff;font-weight:700} .mpt-mic .l{color:#ffd166}
.mpt-mstrip{margin-top:14px} .mpt-mstrip .mpt-blk[data-pi]{cursor:pointer} .mpt-mstrip .mpt-blk.hot{outline:2px solid var(--text);outline-offset:1px;z-index:2}
.mpt-mtips{margin:2px 0 0;padding-left:18px} .mpt-mtips li{margin:2px 0} .mpt .mpt-mcv{color:var(--mpt-soft)} .mpt .mpt-mca{color:#f2c46b}
.mpt-mdr ol{margin:2px 0 0;padding-left:18px;font-size:12.5px} .mpt-mdr li{margin:2px 0} .mpt-mdr{padding-top:2px;border-top:1px solid var(--line);margin-top:8px}
.mpt .mpt-mhint{margin:8px 0 0;font:500 12px var(--body);color:var(--faint)}
.mpt-fxgo{margin-left:8px;font:600 12.5px var(--body)!important;color:var(--mpt-you)!important;white-space:nowrap}
.mpt-chap > .mpt-rpl{margin:0 0 10px}
@media (max-width:820px){ .mpt-mgrid{grid-template-columns:minmax(0,1fr)} .mpt-mside{min-height:0} .mpt-mside > .mpt-mcard{position:relative;inset:auto} .mpt-mcard{height:auto;min-height:150px} .mpt-mstep span{min-width:110px} }
@media (max-width:699px){ .mpt-mfl{grid-template-columns:repeat(auto-fill,minmax(104px,1fr))} }
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
body.mpz-wh .spc-tt{display:none !important}
/* (the tidy pass, Nov 2: one pull's tags; the tooltip is outside .mpt, so these aren't scoped) */
.mpt-tg2{font:500 12.5px var(--body);color:#aeb6bf;white-space:nowrap} .mpt-t2d{color:#ff8f87} .mpt-t2k{color:#c39bff} .mpt-t2l{color:#ffd166} .mpt-t2c{color:#f2c46b} .mpt-t2s{color:var(--faint)}
/* (Your group: one table) */
.mpt .gbx.mpt-gtab{max-width:none;margin-top:8px;--gbx-cols:200px minmax(0,1fr) 64px 92px 52px 52px 44px 56px 84px 80px 104px;--gbx-cols-m:minmax(0,1.5fr) minmax(0,1fr) 48px 84px}
.mpt-gtab .gbx-r{min-height:40px} .mpt-gtab .gbx-hd{min-height:0} .mpt-gtab .gbx-hd > span:nth-child(n+3){text-align:right}
.mpt-gtab .gbx-n img{width:28px;height:28px;border-radius:4px;flex:none;box-shadow:0 0 0 1px #000} .mpt-gtab .mpt-gi{width:28px;height:28px;flex:none;border-radius:4px}
.mpt-gpn{display:flex;flex-direction:column;min-width:0;line-height:1.25} .mpt-gpn .mpt-nm{overflow:hidden;text-overflow:ellipsis;font:600 13px var(--body)} .mpt-gpn small{overflow:hidden;text-overflow:ellipsis;font:500 11.5px var(--body);color:var(--muted)}
.mpt-gtab .mpt-gvs .mpt-vs{font:600 12.5px var(--body)} .mpt-gtab .mpt-g0{color:#5b636c} .mpt-gtab .mpt-gd:not(.mpt-g0){color:#ff8f87} .mpt-gtab .gbx-s[data-tt]{cursor:help} .mpt-gtab .gbx-s small{font-size:11.5px;color:var(--muted)}
.mpt-gx2{display:none} .mpt-gtab .mpt-gtot{border-top:1px solid #222930;margin-top:2px;background:none!important} .mpt-gtot .gbx-v{font-weight:700}
.mpt-gwo{display:grid;grid-template-columns:220px minmax(0,1fr) 48px;gap:12px;align-items:center;padding:6px 4px;border-bottom:1px solid #20242e;font:500 13px var(--body)} .mpt-gwo > span:first-child small{display:block;font-size:12px;color:var(--muted)} .mpt-gwo > b{text-align:right}
.mpt-gwo + .mpt-k,.mpt-gtab{margin-top:12px} .mpt-gft{margin-top:10px} .mpt-gft p{margin:3px 0 0;font:500 12.5px var(--body);color:var(--faint)} .mpt-gft .mpt-hw{color:var(--mpt-soft)}
/* (the map's controls: one bar; the floors and the layers on the map) */
.mpt-mbar{display:flex;flex-wrap:wrap;align-items:center;gap:6px 22px;margin:0 0 10px;border-bottom:1px solid #222930}
.mpt-mbar .mpt-mtg{display:flex;gap:18px;border:0;border-radius:0;overflow:visible} .mpt .mpt-mbar .mpt-mtg button{height:auto;margin:0 0 -1px;padding:8px 0;border:0;border-bottom:2px solid transparent;background:none;color:var(--muted);font:600 13.5px var(--body)} .mpt .mpt-mbar .mpt-mtg button + button{border-left:0}
.mpt .mpt-mbar .mpt-mtg button.on{background:none;color:var(--text);border-bottom-color:var(--gold)}
.mpt-ppl{display:inline-flex;align-items:center;gap:8px;font:600 12.5px var(--body);color:var(--faint)} .mpt .mpt-ppsel{appearance:none;-webkit-appearance:none;height:26px;margin:0;padding:0 18px 0 2px;border:0;border-bottom:1px solid var(--line2);border-radius:0;background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0h10L5 6z' fill='%23868f99'/%3E%3C/svg%3E") no-repeat right 3px center;color:var(--text);font:600 13px var(--body);cursor:pointer}
.mpt .mpt-ppsel option{background:#14171d} .mpt-mbar .mpt-mstep{margin-left:auto;padding:4px 0}
.mpt-mwrap .mpt-flb{position:absolute;left:8px;top:8px;z-index:3;display:flex;flex-wrap:wrap;gap:2px;max-width:calc(100% - 150px);padding:3px;border-radius:6px;background:rgba(10,12,16,.78)}
.mpt .mpt-mwrap .mpt-flb button,.mpt-mwrap .mpt-flb > span{display:inline-flex;align-items:center;height:24px;margin:0;padding:0 9px;border:0;border-radius:4px;background:none;color:#c9ced8;font:600 12px var(--body);cursor:pointer} .mpt-mwrap .mpt-flb > span{cursor:default}
.mpt .mpt-mwrap .mpt-flb button:hover{color:var(--text)} .mpt .mpt-mwrap .mpt-flb button.on{color:var(--gold);background:rgba(242,196,107,.12)}
.mpt-lay{position:absolute;right:8px;top:8px;z-index:4} .mpt .mpt-layb{height:26px;margin:0;padding:0 10px;border:0;border-radius:6px;background:rgba(10,12,16,.78);color:#e8eaed;font:600 12.5px var(--body);cursor:pointer} .mpt-layn{color:var(--muted);font-weight:500}
.mpt-layp{display:none;position:absolute;right:0;top:26px;min-width:190px;padding:4px;border:1px solid var(--line2);border-radius:6px;background:#14171d;box-shadow:0 12px 32px rgba(0,0,0,.55)} .mpt-lay.open .mpt-layp{display:grid} @media (hover:hover){ .mpt-lay:hover .mpt-layp{display:grid} }
.mpt .mpt-layp .mpt-mchip{display:grid;grid-template-columns:16px minmax(0,1fr) 18px;align-items:center;gap:8px;width:100%;height:28px;margin:0;padding:0 6px;border:0;border-radius:4px;background:none;color:#e8eaed;font:600 12.5px var(--body);text-align:left;cursor:pointer}
.mpt .mpt-layp .mpt-mchip:hover{background:rgba(255,255,255,.04)} .mpt .mpt-layp .mpt-mchip:not(.on){color:var(--faint)} .mpt-layp .mpt-mchip:not(.on) span{text-decoration:line-through} .mpt-layp .mpt-mchip i{margin:0;text-align:center}
.mpt-eye svg{display:block;width:16px;height:16px;color:var(--muted)} .mpt-mchip.on .mpt-eye .x{display:none}
/* (Pulls: one line each; the fast run's pulls faded under each stretch) */
.mpt-plh2,.mpt .mpt-pr2 > summary,.mpt-pr2f{display:grid;grid-template-columns:150px minmax(0,1fr) 52px 64px 52px 130px minmax(0,1.2fr);gap:8px;align-items:center;padding:6px}
.mpt-plh2{font:600 10.5px var(--body);text-transform:uppercase;letter-spacing:.04em;color:#7d8792;border-bottom:1px solid #222930;margin-top:4px} .mpt-plh2 > span:nth-child(n+3):nth-child(-n+5){text-align:right}
.mpt-pr2 .mpt-pn,.mpt-pr2f .mpt-pn{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 13.5px var(--body);color:var(--text)} .mpt-pr2 .mpt-pnb{color:var(--gold)}
.mpt-pr2 .mpt-pm,.mpt-pr2f .mpt-pm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:500 13px var(--body);color:var(--mpt-soft)}
.mpt-pr2 .mpt-pt,.mpt-pr2 .mpt-pf,.mpt-pr2 .mpt-pf2,.mpt-pr2f .mpt-pt,.mpt-pr2f .mpt-pf,.mpt-pr2f .mpt-pf2{text-align:right;font:600 13px var(--body);font-variant-numeric:tabular-nums;color:var(--text);white-space:nowrap} .mpt-pr2 .mpt-pf2,.mpt-pr2f .mpt-pf2{font-weight:500;font-size:12px;color:var(--faint)}
.mpt-pg2{display:flex;align-items:center;gap:6px;min-width:0} .mpt-pg2 b{flex:none;width:44px;text-align:right;font:600 12.5px var(--body);font-variant-numeric:tabular-nums;color:var(--text)} .mpt-pg2 .gbx-b{flex:1}
.mpt-pr2 .mpt-pc{display:flex;flex-wrap:wrap;gap:2px 10px;min-width:0} .mpt-pr2f{opacity:.6} .mpt-pr2f .mpt-pn{font-weight:600}
.mpt-fpl{margin:8px 0 0 6px;font:600 10.5px var(--body);letter-spacing:.04em;text-transform:uppercase;color:var(--faint)} .mpt .mpt-pr2 > .mpt-pd{padding-left:164px}
/* (Your route: four tiles; the boss names above both lanes) */
.mpt-rtl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:2px 0 18px} .mpt .mpt-rtl .mpt-tile{padding:10px 12px;border:1px solid var(--line2);border-left:1px solid var(--line2);border-radius:4px;background:var(--raised);box-shadow:none} .mpt-rtl .mpt-tile b{font-size:20px} .mpt-rtl .mpt-tile span{white-space:normal}
.mpt-rtl .mpt-tile[data-tt],.mpt-fzk .mpt-r100[data-tt]{cursor:help} .mpt .mpt-sf .mpt-sbm em{top:-16px;bottom:auto} .mpt .mpt-sf .mpt-sbm em.mpt-r1{top:-29px;bottom:auto} .mpt-fz .mpt-row + .mpt-row{margin-top:12px}
/* (the timeline: a purple ! over a pull where a cast went off with a kick ready) */
.mpt-ktk{position:absolute;top:-13px;width:12px;margin-left:-6px;font:800 11px/12px var(--body);font-style:normal;text-align:center;color:#c39bff;cursor:help;z-index:2} .mpt-ltf .mpt-ktk{opacity:.55} .mpt-kk{display:inline-block;width:11px;margin-right:5px;color:#c39bff;font-weight:800;text-align:center}
@media (max-width:820px){ .mpt-rtl{grid-template-columns:repeat(2,minmax(0,1fr))} }
@media (max-width:699px){
  .mpt-gtab .mpt-gxn{display:none} .mpt-gtab .mpt-gx2{display:block;grid-column:1 / -1;margin:-2px 0 2px 36px;font:500 11.5px var(--body);color:var(--muted);white-space:normal;text-align:left}
  .mpt-gwo{grid-template-columns:minmax(0,1fr) auto 36px} .mpt-gwo > span:nth-child(2){font-size:12px}
  .mpt-mbar .mpt-mtg{flex:1 1 100%} .mpt-mwrap .mpt-flb{max-width:calc(100% - 120px)}
  .mpt-plh2{display:none}
  .mpt .mpt-pr2 > summary,.mpt-pr2f{grid-template-columns:minmax(0,1fr) 40px 56px 50px;grid-template-areas:"pn pt pf pg" "pm pm pm pm" "pc pc pc pc";row-gap:2px}
  .mpt-pr2 .mpt-pn,.mpt-pr2f .mpt-pn{grid-area:pn} .mpt-pr2 .mpt-pt,.mpt-pr2f .mpt-pt{grid-area:pt} .mpt-pr2 .mpt-pf,.mpt-pr2f .mpt-pf{grid-area:pf} .mpt-pr2 .mpt-pg2,.mpt-pr2f .mpt-pg2{grid-area:pg} .mpt-pr2 .mpt-pm,.mpt-pr2f .mpt-pm{grid-area:pm;white-space:normal} .mpt-pr2 .mpt-pc,.mpt-pr2f .mpt-pc{grid-area:pc}
  .mpt-pr2 .mpt-pf2,.mpt-pr2f .mpt-pf2,.mpt-pg2 .gbx-b{display:none} .mpt-pg2 b{width:auto} .mpt-pr2f .mpt-pc:empty{display:none} .mpt .mpt-pr2 > .mpt-pd{padding-left:6px}
}
.mpt-pk{margin:6px 0 2px} .mpt-pkr{display:flex;align-items:center;flex-wrap:wrap;gap:2px 7px;padding:2px 0;font:500 12.5px var(--body)} .mpt-pkr > b{min-width:24px;color:var(--muted);font-weight:600;font-variant-numeric:tabular-nums} .mpt-pkn{font:600 13px var(--body);color:var(--text)}
.mpt-pkr small{color:var(--muted);font-size:12px} .mpt-pkr small b{color:#c39bff;font-weight:600}
.mpt-pkt{display:inline-flex;align-items:center;gap:3px;height:17px;padding:0 6px;border-radius:9px;font:600 11px/1 var(--body);font-style:normal;color:#aeb6bf;background:rgba(174,182,191,.12)} .mpt-pkt svg{flex:none;width:11px;height:11px}
.mpt-pk-cast{color:#c39bff;background:rgba(195,155,255,.14)} .mpt-pk-melee{color:#c69b6d;background:rgba(198,155,109,.14)} /* (Warrior tan (Flex)) */ .mpt-pk-elite{color:#f2c46b;background:rgba(242,196,107,.15)} .mpt .mpt-pkf{margin:3px 0 0;color:var(--faint);font-size:12.5px} .mpt-pkf .mpt-pkt{margin-left:2px} .mpt .mpt-pkm{margin:2px 0 0;color:var(--faint);font-size:12.5px;cursor:help}
.mpt-gtab .gbx-hd > span[data-tt]{cursor:help} .mpt .mpt-why1{margin:12px 0 4px}
.mpt .mpt-gtab .gbx-r.mpt-gme{box-shadow:inset 3px 0 0 var(--gold);background:rgba(242,196,107,.07)}
/* (the tidy pass's items 6-8: the verdict, the map's meta line, the card's tags and one-liners, one set of icon colours) */
.mpt .mpt-vd{margin:8px 0 0;font:500 13.5px/1.45 var(--body);color:var(--mpt-soft)} .mpt-vd b{color:var(--text)} .mpt .mpt-meta{color:var(--faint);font-size:12.5px}
.mpt .mpt-mtl{display:flex;flex-wrap:wrap;gap:3px 10px;margin:6px 0 2px;font-size:12.5px} .mpt-t2w{color:#aeb6bf} .mpt-t2a{color:#f2c46b} .mpt-t2m{color:var(--muted)} .mpt-t2g{color:#7ee08f}
.mpt-cfd{border-top:1px solid var(--line);margin-top:8px} .mpt-cfs{display:flex;align-items:baseline;flex-wrap:wrap;gap:2px 6px;padding:7px 0 5px;cursor:pointer;list-style:none;font:500 12.5px var(--body);color:var(--muted)}
.mpt-cfs::-webkit-details-marker{display:none} .mpt-cfs::after{content:"▸";margin-left:auto;color:var(--faint)} .mpt-cfd[open] > .mpt-cfs::after{content:"▾"} .mpt-cfs > b{color:var(--text);font-weight:600} .mpt-cfb{padding:0 0 6px}
.mpt-cfd + .mpt-cfd{margin-top:0} .mpt-cfb .mpt-mlh{margin-top:2px}
.mpt .mpt-mchip-r i{color:#e8eaed} .mpt .mpt-mchip-d i{color:#ff8f87} .mpt .mpt-mchip-k i{color:#c39bff} .mpt .mpt-mchip-l i{color:#ffd166} .mpt .mpt-mchip-w i{color:#aeb6bf} .mpt .mpt-mchip-a i{color:#f2c46b} .mpt-layp .mpt-mchip:not(.on) i{opacity:.45}
.mpt-ll .mpt-i{margin-left:4px;font-size:12px;vertical-align:1px}
/* (last time on this dungeon: the faint line under the verdict, and the key finder's 5-key trend, quiet tints) */
.mpt .mpt-vd2{margin:2px 0 0;font:500 12.5px/1.45 var(--body);color:var(--faint)}
.mpf-trend{display:inline-flex;gap:3px;margin-right:auto;align-self:center} .mpf-trend i{min-width:24px;height:18px;padding:0 3px;border-radius:3px;font:700 11px/18px var(--body);font-style:normal;text-align:center;color:var(--muted);background:rgba(149,160,171,.14)}
.mpf-trend i.g{color:#7ee08f;background:rgba(126,224,143,.14)} .mpf-trend i.a{color:#f3c969;background:rgba(243,201,105,.14)}
/* (the phone pass: a card tag opens its words on a line under the tags) */
.mpt .mpt-mtl .mpt-tg2[data-tt]{cursor:pointer} .mpt .mpt-mtl .mpt-tg2.on{text-decoration:underline;text-underline-offset:3px}
.mpt .mpt-tgx{margin:2px 0 6px;padding:6px 8px;border-radius:4px;background:rgba(255,255,255,.04);font:500 12.5px/1.45 var(--body);color:var(--mpt-soft)} .mpt .mpt-tgx b{color:var(--text)}
/* (Your part, quiet wins, no pop-in (the studio's round)) */
.mpt .mpt-part{margin:12px 0 0;padding:10px 14px 11px;border:1px solid var(--line);border-radius:6px;background:rgba(255,255,255,.015)} .mpt .mpt-pth{margin:0 0 7px} .mpt-pth > span{text-transform:none;letter-spacing:0}
.mpt-ptags{display:flex;flex-wrap:wrap;gap:6px 16px;font:500 13px/1.4 var(--body)} .mpt .mpt-ptg{margin:0;padding:0;border:0;background:none;font:inherit;color:var(--mpt-soft);text-align:left;min-width:0}
.mpt button.mpt-ptg{cursor:pointer} .mpt button.mpt-ptg:hover{text-decoration:underline;text-underline-offset:3px} .mpt .mpt-ptg.mpt-t2d{color:#ff8f87} .mpt .mpt-ptg.mpt-t2k{color:#c39bff} .mpt .mpt-ptg.mpt-t2a{color:#f2c46b}
.mpt .mpt-ptg.mpt-t2g,.mpt .mpt-ptg.mpt-pkk{color:#7ee08f} .mpt .mpt-ptg.mpt-phw b{color:var(--text)} .mpt .mpt-part .mpt-nt{margin:8px 0 0!important}
.mpt .mpt-pill.mpt-best{color:#ffd166;border-color:rgba(255,209,102,.45);background:rgba(255,209,102,.08)} .mpt .mpt-pill.mpt-glow{box-shadow:0 0 0 1px rgba(255,209,102,.3),0 0 14px rgba(255,209,102,.25)}
.mpf-trend i{position:relative} .mpf-trend .mpf-pb{position:absolute;top:-7px;right:-5px;font:700 9px/1 var(--body);color:#ffd166}
.mpt-shim{display:inline-block;height:.8em;max-width:100%;vertical-align:-1px;border-radius:3px;background:linear-gradient(90deg,rgba(255,255,255,.05) 0%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.05) 100%);background-size:200% 100%;animation:mptShim 1.4s ease-in-out infinite}
@keyframes mptShim{0%{background-position:100% 0}100%{background-position:-100% 0}} @media (prefers-reduced-motion: reduce){.mpt-shim{animation:none}}
.mpt-fadein{animation:mptFade .15s ease-out both} @keyframes mptFade{from{opacity:0}to{opacity:1}}
.mpt-lt.mpt-ltw > .mpt-shim{position:absolute;left:0;top:30%;height:40%} .mpt .mpt-fxr.mpt-fxr0{align-items:center} .mpt-fxr0 > div > .mpt-shim + br + .mpt-shim{margin-top:7px}
.mpt .mpt-shimt{color:transparent!important;user-select:none;border-radius:3px;background:linear-gradient(90deg,rgba(255,255,255,.05) 0%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.05) 100%);background-size:200% 100%;animation:mptShim 1.4s ease-in-out infinite;-webkit-box-decoration-break:clone;box-decoration-break:clone}
@media (prefers-reduced-motion: reduce){.mpt .mpt-shimt{animation:none}} .mpt-fxwb{margin:6px 0 10px} .mpt-fxwb .mpt-shim + br + .mpt-shim{margin-top:8px}
/* (Flex's "go" (Nov 2): Show and Show N more are quiet text links, ▸ turning ▾, gold on hover; a leak's whole title opens its words) */
.mpt .mpt-chev{border:0;padding:0;border-radius:0;font:600 12.5px var(--body);letter-spacing:0;color:var(--muted)} .mpt-chev::before{content:"Show ▸"} .mpt-fold[open] > summary .mpt-chev::before{content:"Hide ▾"}
.mpt .mpt-fold > summary:hover .mpt-chev,.mpt .mpt-fold > summary:focus-visible .mpt-chev{color:var(--gold)}
.mpt .mpt-fxbtn{height:auto;margin:10px 0 0 40px;padding:0;border:0;border-radius:0;background:none;font:600 12.5px var(--body);letter-spacing:0;color:var(--muted)} .mpt .mpt-fxbtn::after{content:" ▸"} .mpt .mpt-fxbtn.on::after{content:" ▾"}
.mpt .mpt-fxbtn:hover,.mpt .mpt-fxbtn:focus-visible{color:var(--gold);border:0} .mpt-fxd > summary .mpt-fxt{cursor:pointer} .mpt-fxd > summary:hover .mpt-fxt::after{color:var(--gold)}
@media (max-width:600px){ .mpt .mpt-fxbtn{margin-left:0} }
/* (a tile's number that faded in keeps the number's size and colour: the caption rule .mpt-tile span made it small and grey (the studio's catch)) */
.mpt .mpt-tile > b .mpt-fv{font:inherit;color:inherit;white-space:inherit}
/* (layout v3: the stats line, the band (Your part rows | Fix these first, compact), parse colours) */
.mpt .mpt-stl{margin:4px 0 0;font:500 12.5px/1.45 var(--body);color:var(--faint)} .mpt-stl b{color:var(--mpt-soft);font-weight:700} .mpt-stl b.mpt-bad{color:#ff8f87}
.mpt .mpt-band{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.4fr);margin:16px 0 0;padding-top:14px;border-top:1px solid var(--line);scroll-margin-top:calc(var(--mpt-jbt,0px) + 58px)}
.mpt-band > .mpt-bl{min-width:0;padding-right:22px;border-right:1px solid var(--line)} .mpt-band > .mpt-br{min-width:0;padding-left:22px} .mpt .mpt-band1{grid-template-columns:minmax(0,1fr)} .mpt-band1 > .mpt-bl{padding-right:0;border-right:0;max-width:560px}
.mpt-band:has(#mptPart:empty){grid-template-columns:minmax(0,1fr)} .mpt-band:has(#mptPart:empty) > .mpt-bl{display:none} .mpt-band:has(#mptPart:empty) > .mpt-br{padding-left:0}
.mpt .mpt-pth{margin:0 0 4px} .mpt-pth > span{text-transform:none;letter-spacing:0} .mpt-prows{display:flex;flex-direction:column}
.mpt .mpt-prow{display:grid;grid-template-columns:16px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;min-height:34px;margin:0;padding:0;border:0;border-bottom:1px solid var(--line);border-radius:0;background:none;font:500 13px var(--body);color:var(--mpt-soft);text-align:left}
.mpt button.mpt-prow{cursor:pointer} .mpt button.mpt-prow:hover .mpt-ypl{color:var(--text);text-decoration:underline;text-underline-offset:3px} .mpt-pic{font-style:normal;text-align:center;font-size:13px;line-height:1}
.mpt-ypv{min-width:0;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .mpt-ypv > b{color:var(--text);font-weight:700} .mpt-ypv small{font:500 12px var(--body);color:var(--muted)} .mpt-ypv small.mpt-t2k{color:#c39bff}
.mpt-ypv > b.mpt-g{color:#7ee08f} .mpt-ypv > b.mpt-a{color:#f2c46b} .mpt-ypv > b.mpt-bad{color:#ff8f87} .mpt .mpt-bl .mpt-nt{margin:10px 0 0!important}
.mpt .mpt-br .mpt-fx{margin:0} .mpt .mpt-br .mpt-fxh h2{font-size:15px} .mpt .mpt-br .mpt-fxh > span{font-size:12px} .mpt .mpt-br .mpt-sbar{height:6px;margin:8px 0 5px} .mpt .mpt-br .mpt-sk{font-size:12px}
.mpt .mpt-br .mpt-fxt{font-size:13.5px} .mpt .mpt-br .mpt-nt{font-size:12.5px!important} .mpt .mpt-br .mpt-fxs b{font-size:16px} .mpt .mpt-br .mpt-fxr{grid-template-columns:24px minmax(0,1fr) auto;gap:10px;padding:8px 0}
.mpt .mpt-br .mpt-fxbtn{margin-left:34px} .mpt .mpt-br .mpt-chk{margin-bottom:6px}
@media (max-width:700px){ .mpt .mpt-band{grid-template-columns:minmax(0,1fr)} .mpt-band > .mpt-bl{padding-right:0;border-right:0;padding-bottom:14px} .mpt-band > .mpt-br{padding-left:0;padding-top:14px;border-top:1px solid var(--line)} .mpt .mpt-br .mpt-fxbtn{margin-left:0} }
/* (the healer verdict; banner v3) */
.mpt .mpt-prow2{grid-template-columns:16px minmax(0,1fr);row-gap:3px;align-items:start;padding:8px 0} .mpt-prow2 .mpt-pic{padding-top:2px} .mpt .mpt-ypv2{grid-column:2;font:500 12.5px/1.45 var(--body);color:var(--muted)} .mpt-ypv2 b{color:var(--text)}
.mpt-ypv2.mpt-hv-a{color:#f2c46b} .mpt-ypv2.mpt-hv-bad{color:#ff8f87} .mpt .mpt-pwin{margin:4px 0;padding:9px 10px;border:1px solid rgba(255,209,102,.35);border-radius:5px;background:rgba(255,209,102,.07)} .mpt-pwin .mpt-ypl{color:#ffd166;font-weight:700} .mpt-pwin .mpt-ypv2{color:var(--mpt-soft)} .mpt-pwin .mpt-ypv2 > b:first-child{color:#ffd166}
.mpt .mpt-ban-art{isolation:isolate;min-height:150px} .mpt-bart{position:absolute;z-index:-1;top:-16px;right:-20px;bottom:0;width:72%;background:center 30%/cover no-repeat;opacity:.8;filter:brightness(.7) saturate(.95);border-top-right-radius:var(--r,4px);
  -webkit-mask-image:linear-gradient(to right,transparent 0,#000 42%),linear-gradient(to bottom,#000 55%,transparent 100%);-webkit-mask-composite:source-in;mask-image:linear-gradient(to right,transparent 0,#000 42%),linear-gradient(to bottom,#000 55%,transparent 100%);mask-composite:intersect}
.mpt .mpt-ban .mpt-bt{position:relative;z-index:1} .mpt-res{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:4px;font:700 12.5px var(--body)} .mpt-res.mpt-rt{color:#7ee08f;background:rgba(126,224,143,.16)} .mpt-res.mpt-rb{color:#ff8f87;background:rgba(255,143,135,.14)} .mpt-res.mpt-rl{color:var(--muted);background:rgba(149,160,171,.14)}
.mpt-res.mpt-glow{box-shadow:0 0 0 1px rgba(255,209,102,.3),0 0 14px rgba(255,209,102,.25)} .mpt .mpt-pills{align-items:center} .mpt-bmeta{font:500 13px var(--body);color:var(--mpt-soft)} .mpt-bpts,.mpt-bgain{font-weight:700}
.mpt .mpt-bt .mpt-grp{margin:9px 0 0;gap:4px 14px} .mpt-gm img{width:16px;height:16px;border-radius:3px;margin-right:1px} .mpt .mpt-ksum{margin-top:2px;padding-top:12px;border-top:1px solid var(--line)}
@media (max-width:700px){ .mpt-bart{width:auto;left:-12px;right:-12px;opacity:.35;-webkit-mask-image:linear-gradient(to bottom,#000 45%,transparent);mask-image:linear-gradient(to bottom,#000 45%,transparent)} }
/* (the map's look, like MDT (the studio, Flex: "ok make it happen"): a picked pull's inside a little stronger, the others at half; the label's text) */
.mpt-mpl.hot .mpt-hpg{opacity:.16} .mpt-mdtv.pick:not(.peek) .mpt-mpl:not(.hot){opacity:.5} .mpt-mtag .mpt-tgn{font:800 12.5px var(--body)} .mpt-mtag .mpt-tgp{font:700 11px var(--body)}
/* (Your group's table: its columns are about 910 px; between the phone layout and a wide panel it scrolls inside its box, not the page) */
.mpt .mpt-gtab{overflow-x:auto;scrollbar-width:thin}
/* (enemy portraits: Elites always, the rest once zoomed to 1.5x) */
.mpt-ep{display:none} .mpt-ep.mpt-epe,svg.mpt-zin .mpt-ep{display:inline} .mpt-ep image{filter:brightness(1.25)}
/* (the thumbnails are whole models: the middle 60% across, from 8% down, fills the ring, so the head and chest show) */
.mpt .mpt-pkp{width:16px;height:16px;margin:0 5px 0 0;border-radius:50%;object-fit:cover;object-view-box:inset(8% 20% 32% 20%);vertical-align:-3px;background:#3b4458;filter:brightness(1.25)} .mpt .mpt-pkp0{display:inline-block;background:none}
`;
