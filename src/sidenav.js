// ===== The side menu, sub tabs and context bar (Nov 8, the Design studio's mock m33; Flex: "wow i think this looks so much better", "Yes, send it") =====
// Desktop (900px and wider): a left menu for the five sections (Home · Plan · Guides · Raid review · Mythic+), each section's own tabs across the top
// (Raid review: Summary · Rotation · Graphs · Report card · Compare), and under them the section's pickers (Night ‹ › Pull Player). Nothing is
// taken away: every page still draws its own tab bar; on a desktop the section buttons in it are hidden because the menu has them, and on a phone
// everything stays as it was (the ☰ sheet). The menu shows status (the open night, the last 3 nights, jobs left on the plan), folds to icons
// (remembered), and keys 1-5 pick a sub tab, ← → the pull.
const SN_MQ = window.matchMedia ? window.matchMedia('(min-width: 900px)') : { matches: true, addEventListener() {} };
const SN_FOLD_K = 'wla-snv-fold', SN_SUB_K = 'wla-snv-raid';
const SN_IC = { imp: '<path d="M12 4v10M8 10.5l4 4 4-4"/><path d="M4.5 14.5V19.5h15v-5"/>', home: '<path d="M3.5 10.5 12 4l8.5 6.5V20h-5.5v-5.5h-6V20H3.5Z"/>', plan: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8.5h6M9 12.5h6M9 16.5h3.5"/>',
  guides: '<path d="M3.5 5.5h7.5v14H3.5zM13 5.5h7.5v14H13z"/>', raid: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  mplus: '<circle cx="8" cy="12" r="4.5"/><path d="M12.5 12h9M18.5 12v3.5M15.5 12v2.5"/>' };
const SN_SECS = [['home', 'Home'], ['plan', 'Plan'], ['guides', 'Guides'], ['raid', 'Raid review'], ['mplus', 'Mythic+'], ['imp', 'Import a log']]; /* (Nov 9: Import a log, a popup) */
const snIco = (k) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + SN_IC[k] + '</svg>';
const snFold = () => store.get(SN_FOLD_K) === '1';
// (not on the front page a new visitor sees, with nothing added yet: its one button does the work there (Flex, Nov 8: "it probably shouldnt show on the home page"); Home with a team or character keeps it)
const snLanding = () => { if (S.page !== "home") return false; try { return !groups().length; } catch (e) { return false; } };
const snOn = () => !!SN_MQ.matches && !snLanding();
let SN_LAST = null, SN_KEY = '', SN_JOBS = { n: 0, boss: '', at: 0 };
// (which section the page on screen belongs to)
function snSec() { const p = S.page; if (p === 'plan') return 'plan'; if (p === 'guides') return 'guides'; if (p === 'mplus' || p === 'mpfind') return 'mplus';
  if (p === 'pull') return S.tab === 'me' ? 'home' : S.tab === 'overview' ? 'plan' : 'raid'; return 'home'; }
const snSubGet = () => { const t = store.get(SN_SUB_K); return TAB_ORDER.includes(t) ? t : 'audit'; };
const snDay = (ms) => new Date(ms - 6 * 3600e3);
const snDate = (d, wk) => d.toLocaleDateString('en-US', wk ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' });
// (your raid nights, newest first: from the pulls saved on this PC, your team's when you have one)
function snNights() { const mem = HIST && HIST.mem; if (!mem || !mem.size) return []; if (WCL.HOSTED && WHO.now && !WHO.now.me) return []; /* (Nov 8: signed out, no one's raid nights) */
  let L = [...mem.values()].filter((v) => v && v.at && v.boss && v.kind !== 'run' && !v.run);
  try { const g = homeTarget(); if (g) { const f = groupFilter(g), m = L.filter((v) => { try { return f(v); } catch (e) { return false; } }); if (m.length) L = m; } } catch (e) { /* (every night) */ }
  const wo = (v) => v.wcl || (/^wcl:/.test(v.src || '') ? { code: v.src.slice(4), fight: null } : null);
  const by = new Map(); for (const v of L) { const k = nightOf(v.at); if (!by.has(k)) by.set(k, []); by.get(k).push(v); }
  return [...by].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([k, l]) => { const cnt = new Map(); for (const v of l) cnt.set(v.boss, (cnt.get(v.boss) || 0) + 1);
    const boss = [...cnt].sort((a, b) => b[1] - a[1])[0][0], ml = l.filter((v) => v.boss === boss), at = Math.min(...l.map((v) => v.at));
    const op = ml.filter(wo).sort((p, q) => (q.kill ? 1 : 0) - (p.kill ? 1 : 0) || (p.left ?? 101) - (q.left ?? 101))[0] || l.find(wo);
    return { k, boss, n: ml.length, kill: ml.some((v) => v.kill), day: snDay(at), code: op ? wo(op).code : null, fight: op ? wo(op).fight : null }; }); }
// (the open night: its boss, date and which pull of how many)
function snOpen() { const it = S.page === 'pull' ? S.item : null; if (!it || it.kind === 'run' || it.run) return null;
  const all = (S.index && S.index.bosses) || [], same = all.filter((b) => b.boss === it.boss && b.diffId === it.diffId), i = same.indexOf(it);
  const ms = it.wallMs || it.startMs || 0;
  return { it, boss: it.boss, day: ms ? snDay(ms) : null, n: i + 1, of: same.length, k: ms ? nightOf(ms) : '', code: it.wcl ? it.wcl.code : null }; }
// (jobs nobody has yet on the plan's boss, worked out now and then: the plan's own readiness count)
function snJobs() { if (WCL.HOSTED && WHO.now && !WHO.now.me) { SN_JOBS.n = 0; SN_JOBS.boss = null; SN_JOBS.none = true; return SN_JOBS; } /* (Nov 8: signed out, no team jobs) */ const now = Date.now(); if (now - SN_JOBS.at < 45000 && !(S.page === 'plan' && now - SN_JOBS.at > 5000)) return SN_JOBS;
  SN_JOBS.at = now; try { const b = S.ndzPick || store.get(PLAN_BK); if (!b) { SN_JOBS.n = 0; return SN_JOBS; } const r = pgRdy(pnGet(), b); SN_JOBS.boss = b; SN_JOBS.none = !r || !!r.none; SN_JOBS.n = r && r.jobs && !r.none ? Math.max(0, (r.jobs.of || 0) - (r.jobs.done || 0)) : 0; } catch (e) { SN_JOBS.n = 0; }
  return SN_JOBS; }
function snWho() { const me = meOf(); let g = null; try { g = homeTarget(); } catch (e) { g = null; }
  const team = g && g.kind !== 'char' ? gName(g) : '', k = me && me.cls && E.CLASSES && E.CLASSES[me.cls];
  /* (Nov 8, live bug: the line says whether you're signed in; st: in (Battle.net), old (an old Warcraft Logs sign-in), out, or '' before the site has answered) */
  const W = WCL.HOSTED ? WHO.now : null, st = !WCL.HOSTED ? '' : !W ? '' : W.me ? (W.me.legacy ? 'old' : 'in') : 'out';
  return { name: me ? String(me.name).split('-')[0] : '', col: k ? k[1] : '', team, st }; }
// ---- drawing the menu ----
function snNavHtml() { const sec = snSec(), fold = snFold(), op = snOpen(), nights = snNights(), jobs = snJobs();
  const last = op ? null : nights[0];
  const tip = { raid: op ? 'Raid review · ' + (op.day ? snDate(op.day) + ', ' : '') + 'pull ' + op.n : last ? 'Raid review · last night ' + snDate(last.day) : 'Raid review', plan: 'Plan' + (jobs.n ? ' · ' + plural(jobs.n, 'job') + ' left' : '') };
  const badge = {}, badge0 = { plan: jobs.n ? '<span class="snv-b warn">' + plural(jobs.n, 'job') + ' left</span>' : '', raid: sec !== 'raid' && (SN_LAST || last) ? '<span class="snv-b ok">' + esc(SN_LAST && SN_LAST.wallMs ? snDate(snDay(SN_LAST.wallMs)) : last ? snDate(last.day) : '') + '</span>' : '' };
  let h = '';
  for (const [k, l] of SN_SECS) { const soon = k === 'mplus' && typeof mpSoon === 'function' && mpSoon();
    h += '<button type="button" class="snv-i' + (sec === k ? ' on' : '') + (soon ? ' off' : '') + '" data-sn="' + k + '" data-tip="' + esc(tip[k] || l) + '"' + (sec === k ? ' aria-current="page"' : '') + (soon ? ' aria-disabled="true"' : '') + '>' + snIco(k) + '<span class="snv-l">' + esc(l) + '</span>' + (badge[k] || '') + (soon ? '<span class="snv-b">Soon</span>' : '') + '</button>';
    if (fold) continue;
    if (k === 'raid' && sec === 'raid') { const others = nights.filter((n) => !(op && ((op.code && n.code === op.code) || n.k === op.k))).slice(0, 3);
      h += '<div class="snv-sub">' + (op ? '<div class="snv-k">' + (op.k === nightOf(Date.now()) ? 'Tonight' : 'Open now') + '</div><div class="snv-n cur"><b>' + esc(op.boss) + '</b><small>' + esc([op.day ? snDate(op.day, 1) : '', op.of ? 'pull ' + op.n + ' of ' + op.of : ''].filter(Boolean).join(' · ')) + '</small></div>' : '') +
        (others.length ? '<div class="snv-k">Last nights</div>' + others.map((n) => '<button type="button" class="snv-n"' + (n.code ? ' data-code="' + esc(n.code) + '" data-fight="' + esc(String(n.fight == null ? '' : n.fight)) + '"' : ' disabled title="This night is only in your combat log"') + '><b>' + esc(snDate(n.day, 1)) + '</b><small>' + esc(pnShortB(n.boss) + ' · ' + plural(n.n, 'pull') + (n.kill ? ' · Kill' : '')) + '</small></button>').join('') : '') + '</div>'; }
    if (k === 'plan' && sec === 'plan' && jobs.boss) h += '<div class="snv-sub"><div class="snv-k">This week</div><div class="snv-n cur"><b>' + esc(jobs.boss) + '</b><small>' + (jobs.none ? 'No plan yet' : jobs.n ? plural(jobs.n, 'job') + ' not filled' : 'Every job filled') + '</small></div></div>'; }
  return h; }
const pnShortB = (b) => String(b).replace(/^The /, '');
function snWhoHtml() { const w = snWho(), fold = snFold(), out = w.st === 'out', ini = out && !w.name ? '?' : (w.name || '?').charAt(0).toUpperCase();
  /* (Nov 8, live bug (Flex: "it still has me saved/logged in after pressing logout"): signed out reads as signed out; a remembered character is grey, "Viewing as") */
  const io = (k, t) => '<button type="button" class="snv-io" data-snio="' + k + '" style="all:unset;cursor:pointer;font-size:12px;color:var(--gold);text-decoration:underline;text-underline-offset:2px">' + t + '</button>';
  const tip = out ? 'Not signed in' + (w.name ? ' · viewing as ' + w.name : '') : w.st === 'old' ? (w.name || 'You') + ' · old sign-in' : (w.name || 'Home') + (w.st === 'in' ? ' · signed in' : '');
  const nm = out ? 'Not signed in' : esc(w.name || 'Who are you?'), sub = out ? io('in', 'Sign in with Battle.net') + (w.name ? '<br>Viewing as ' + esc(w.name) : '')
    : w.st === 'old' ? 'Old sign-in · ' + io('out', 'Sign out') : w.st === 'in' ? (w.team ? esc(w.team) + '<br>' : '') + io('out', 'Sign out') : esc(w.team || (w.name ? 'Your character' : 'Pick your character on Home'));
  return '<button type="button" class="snv-av" data-sn="me" data-tip="' + esc(tip) + '"' + (out ? ' style="--cc:var(--muted);opacity:.65"' : w.col ? ' style="--cc:' + w.col + '"' : '') + '>' + esc(ini) + '</button>' +
    (fold ? '' : '<span class="snv-wt" data-st="' + (w.st || '') + '"><b' + (out ? ' style="color:var(--muted)"' : w.col ? ' style="color:' + w.col + '"' : '') + '>' + nm + '</b><small' + (w.st ? ' style="white-space:normal;line-height:1.35"' : '') + '>' + sub + '</small></span>'); }
function snMount() { if ($('#sideNav')) return;
  const a = document.createElement('aside'); a.id = 'sideNav'; a.className = 'sn'; a.setAttribute('aria-label', 'Sections');
  const logo = $('#brandHome svg.logo'); a.innerHTML = '<button type="button" class="snv-brand" data-sn="home" data-tip="Home" aria-label="Debrief home">' + (logo ? logo.outerHTML : '') + '<span class="snv-l">Debrief</span></button>' +
    '<nav class="snv-nav" id="snNav"></nav><div class="snv-foot"><div class="snv-who" id="snWho"></div><div class="snv-tools" id="snTools"></div><button type="button" class="snv-hide" id="snHide"></button></div>';
  document.body.insertBefore(a, document.body.firstChild);
  a.addEventListener('click', snClick); snPlace(); }
// (the Discord button and the ☰ menu live in the side menu on a desktop, in the top bar on a phone)
function snPlace() { const on = snOn(), tools = $('#snTools'), tb = $('#topbar'), menu = tb ? tb.querySelector('.tbmenu') || (tools && tools.querySelector('.tbmenu')) : null, disc = $('#tbDisc');
  document.body.classList.toggle('snv-on', on); if (!tools || !tb) return;
  if (on) { if (disc && disc.parentElement !== tools) tools.appendChild(disc); if (menu && menu.parentElement !== tools) tools.appendChild(menu); }
  else { const pr = $('#prog'); if (menu && menu.parentElement !== tb) tb.insertBefore(menu, pr); if (disc && disc.parentElement !== tb) tb.insertBefore(disc, menu || pr); } }
function snDraw(force) { if (!$('#sideNav')) snMount(); const fold = snFold(), sec = snSec(), jobs = snJobs(), op = snOpen();
  const k = [sec, S.page, S.tab, op ? op.boss + op.n + op.of : '', SN_LAST ? SN_LAST.boss : '', HIST && HIST.mem ? HIST.mem.size : 0, fold, jobs.n, jobs.boss, (meOf() || {}).name || '', snWho().st].join('|'); /* (the sign-in state too, Nov 8) */
  document.body.classList.toggle('snv-fold', fold); document.body.dataset.snSec = sec;
  if (!force && k === SN_KEY) return; SN_KEY = k;
  $('#snNav').innerHTML = snNavHtml(); $('#snWho').innerHTML = snWhoHtml();
  const hb = $('#snHide'); hb.textContent = fold ? '»' : '« hide'; hb.setAttribute('aria-label', fold ? 'Show the menu' : 'Fold the menu to icons'); hb.dataset.tip = fold ? 'Show the menu' : 'Fold the menu'; }
document.addEventListener('whoami', () => { try { if ($('#sideNav')) snDraw(true); } catch (e) { /* (next draw) */ } }); /* (Nov 8: redrawn once the site says who's signed in) */
async function snClick(e) { const t = e.target.closest && e.target.closest('button'); if (!t || t.disabled) return;
  if (t.dataset.snio) { e.stopPropagation(); if (t.dataset.snio === 'out') signOutNow(); else signInNow(); return; } /* (Nov 8: Sign in / Sign out on the account line) */
  if (t.id === 'snHide') { store.set(SN_FOLD_K, snFold() ? '0' : '1'); snDraw(true); return; }
  if (t.dataset.code) { t.disabled = true; try { S.tab = snSubGet(); await openWcl({ code: t.dataset.code, fight: +t.dataset.fight || null }, await wclCreds()); } catch (err) { t.disabled = false; toast('<span>' + esc(err.message) + '</span>', 6000); } return; }
  const k = t.dataset.sn; if (!k || t.classList.contains('off')) return; if (k === 'imp') { snImport(); return; } /* (Nov 9) */
  if (k === 'home' || k === 'me') { snHome(); }
  else if (k === 'plan') { if (S.page !== 'plan') { planPage(); window.scrollTo(0, 0); } }
  else if (k === 'guides') { if (S.page !== 'guides') openGuides(); }
  else if (k === 'mplus') { if (S.page !== 'mplus' && S.page !== 'mpfind') mpOpen(); }
  else if (k === 'raid') await snRaid();
  snDraw(true); }
// (Home: your team's page, the Home tab; the welcome page only for someone with nothing added yet or signed out (Flex, Nov 8: "clicking on this should take you to the home tab not the home screen"). The same as coming back to the site)
function snHome() { const t = homeTarget(); if (t) { store.set(GROUP_CUR, t.gid); progressPage(undefined, t.gid); } else home(); window.scrollTo(0, 0); }
// (Raid review: back to the night you had open, on the sub tab you used last; else your newest night; else the ways to open one)
async function snRaid() { if (snSec() === 'raid') { window.scrollTo({ top: 0 }); return; }
  const bs = (S.index && S.index.bosses) || [], b = SN_LAST && bs.includes(SN_LAST) ? SN_LAST : PROG_BACK && bs.includes(PROG_BACK) ? PROG_BACK : null, tab = snSubGet();
  if (b) { S.tab = tab; if (S.item === b && S.rep) { S.page = 'pull'; renderMain(); } else await select(b); window.scrollTo(0, 0); return; }
  const n = snNights().find((x) => x.code); if (n) { S.tab = tab; try { await openWcl({ code: n.code, fight: n.fight || null }, await wclCreds()); } catch (err) { toast('<span>' + esc(err.message) + '</span>', 6000); } return; }
  const m = $('#tbMenu'); if (m) { m.click(); toast('Open a Warcraft Logs report or your combat log to review a raid.', 5000); } }
// ---- each page's extras on a desktop ----
// (the keys, at the right of Raid review's sub tabs)
function snKeys() { const bar = $('#main > .tabbar:not(.pg-tabbar)'); if (!bar || bar.querySelector('.snv-keys')) return;
  bar.insertAdjacentHTML('beforeend', '<span class="snv-keys" aria-hidden="true">Keys <kbd>1</kbd>–<kbd>5</kbd> sub tabs · <kbd>←</kbd><kbd>→</kbd> pulls</span>'); }
// (the context bar: the night picker and ‹ › in front of the pull and player pickers)
function snCtx() { const tb = $('#main > .r300-tb'); if (!tb || S.page !== 'pull') return; const op = snOpen(); if (!op) return;
  let box = tb.querySelector('.snv-ctx'); const nights = snNights(), key = op.k + '|' + nights.length + '|' + (op.code || '');
  if (box && box.dataset.k === key) return; if (box) box.remove();
  const cur = nights.find((n) => (op.code && n.code === op.code) || n.k === op.k), opts = (cur ? [] : ['<option value="" selected>' + esc((op.day ? snDate(op.day, 1) : 'This night') + ' · ' + pnShortB(op.boss)) + '</option>'])
    .concat(nights.slice(0, 20).map((n) => '<option value="' + (n.code ? esc(n.code + '|' + (n.fight == null ? '' : n.fight)) : '') + '"' + (n === cur ? ' selected' : '') + (n.code || n === cur ? '' : ' disabled') + '>' + esc(snDate(n.day, 1) + ' · ' + pnShortB(n.boss) + ' · ' + plural(n.n, 'pull')) + '</option>'));
  box = document.createElement('div'); box.className = 'snv-ctx'; box.dataset.k = key;
  box.innerHTML = '<label class="snv-sel"><span>Night</span><select class="snv-night" aria-label="Pick a night">' + opts.join('') + '</select></label><span class="snv-arr"><button type="button" data-snstep="-1" aria-label="Earlier pull" title="Earlier pull (←)">‹</button><button type="button" data-snstep="1" aria-label="Later pull" title="Later pull (→)">›</button></span>';
  tb.insertBefore(box, tb.firstChild);
  box.querySelector('.snv-night').addEventListener('change', async (e) => { const v = e.target.value; if (!v) return; const [code, f] = v.split('|'); try { await openWcl({ code, fight: +f || null }, await wclCreds()); } catch (err) { toast('<span>' + esc(err.message) + '</span>', 6000); } });
  box.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-snstep]'); if (b) snStep(+b.dataset.snstep); }); }
// (the night's earlier or later pull, on the same sub tab)
function snStep(d) { const bs = (S.index && S.index.bosses) || [], i = bs.indexOf(S.item), b = i < 0 ? null : bs[i + d]; if (!b) return;
  if (S.scope === 'all' && S.tab !== 'player') S.scope = 'pull'; select(b); }
// (Summary: deaths after the wipe call, folded into one line under How it went)
function snAfter() { if (S.page !== 'pull' || S.tab !== 'audit' || !S.rep || S.scope === 'all') return; const end = $('#view .dbt-why .dbt-chn .dbt-chr.end'); if (!end || end.nextElementSibling && end.nextElementSibling.classList.contains('snv-after')) return;
  let ds = []; try { const rc0 = typeof wipeRoot === 'function' ? wipeRoot(S.rep) : null, t = rc0 && rc0.early ? (S.rep.duration || cutT(S.rep)) : cutT(S.rep); /* (Nov 10: when the root cause says the raid played on past the call, How it went already runs to the end) */ if (isFinite(t)) ds = S.rep.deaths.filter((x) => x.t > t + 0.05).sort((a, b) => a.t - b.t); } catch (e) { ds = []; } if (!ds.length) return;
  const el = document.createElement('div'); el.className = 'snv-after';
  el.innerHTML = '<button type="button" class="snv-aft" aria-expanded="false"><span class="snv-ak"></span><span>' + ds.length + ' more died as the raid went down · <u>show</u></span></button><div class="snv-afl" hidden>' +
    ds.map((x) => '<div class="snv-afr"><span class="snv-at">' + esc(T(x.t)) + '</span><b' + (x.color ? ' style="color:' + esc(x.color) + '"' : '') + '>' + esc(String(x.player || '').split('-')[0]) + '</b><span>' + esc(x.ability || x.killer || '') + '</span></div>').join('') + '</div>';
  end.after(el); const bt = el.querySelector('.snv-aft'); bt.addEventListener('click', (e) => { e.stopPropagation(); const l = el.querySelector('.snv-afl'), o = l.hidden; l.hidden = !o; bt.setAttribute('aria-expanded', String(o)); bt.querySelector('u').textContent = o ? 'hide' : 'show'; }); }
// (the boss banner as one thin line once it scrolls away)
function snThin() { let th = $('#snThin'); const h = $('#bossHead header.fight'), on = snOn() && S.page === 'pull' && !!h && h.getBoundingClientRect().bottom < 52;
  document.body.classList.toggle('snv-thin', on); if (!on) return; if (!th) { th = document.createElement('div'); th.id = 'snThin'; th.setAttribute('aria-hidden', 'true'); document.body.appendChild(th); }
  const g = (s) => { const e = h.querySelector(s); return e ? e.textContent.trim() : ''; }, k = [g('.r308-df'), g('.bh-name'), g('.bh-big')].join('|');
  if (th.dataset.k !== k) { th.dataset.k = k; const [df, nm, big] = k.split('|'); th.innerHTML = (df ? '<span class="snv-tdf">' + esc(df) + '</span>' : '') + '<b>' + esc(nm) + '</b>' + (big ? '<span class="snv-tbg' + (/Kill/.test(big) ? ' kill' : '') + '">' + esc(big) + '</span>' : ''); } }
window.addEventListener('scroll', () => { if (snOn()) snThin(); }, { passive: true });
// ---- keys: 1-5 a sub tab, ← → the pull (never while typing) ----
const SN_SUBSEL = { raid: '#main > .tabbar:not(.pg-tabbar) .tabs > .tab', plan: '#view .pg-tabs > .pg-tab', guides: '#main .snv-gsub > button', mplus: '#main .mpc-tabs > button' };
// (Guides: Heroic · Mythic as the section's sub tabs; they press the guide's own switch, which stays the one that does the work)
function snGsub() { if (S.page !== 'guides') return; const top = $('#main > .gdz-pagetop'), sw = $('#view .gdz-diff'); if (!top || !sw) return;
  let nav = $('#main > .snv-gsub'); if (!nav) { nav = document.createElement('nav'); nav.className = 'snv-gsub'; nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Difficulty');
    nav.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-snd]'); if (!b) return; const o = $('#view .gdz-diff [data-d="' + b.dataset.snd + '"]'); if (o) o.click(); setTimeout(snGsub, 0); }); }
  if (nav.previousElementSibling !== top) top.after(nav);
  const cur = (sw.querySelector('button.on') || {}).dataset || {}, k = cur.d || ''; if (nav.dataset.k === k) return; nav.dataset.k = k;
  nav.innerHTML = [...sw.querySelectorAll('button[data-d]')].map((b) => '<button type="button" role="tab" data-snd="' + esc(b.dataset.d) + '" class="' + (b.dataset.d === k ? 'on' : '') + '" aria-selected="' + (b.dataset.d === k) + '">' + esc(b.textContent.trim()) + '</button>').join('') + '<span class="snv-keys" aria-hidden="true">Keys <kbd>1</kbd>–<kbd>2</kbd></span>'; }
document.addEventListener('keydown', (e) => { if (!snOn() || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const a = document.activeElement, tg = a && a.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT' || (a && a.isContentEditable)) return;
  if ($('#gs') || $('.tour') || $$('[role="dialog"]:not([hidden])').some((d) => d.offsetParent !== null && d.getBoundingClientRect().width > 0)) return;
  const sec = snSec();
  if (/^[1-9]$/.test(e.key)) { const L = $$(SN_SUBSEL[sec] || '#none').filter((b) => b.offsetParent !== null && !b.classList.contains('tab-off') && b.getAttribute('aria-disabled') !== 'true'), b = L[+e.key - 1]; if (b) { e.preventDefault(); b.click(); } return; }
  if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && sec === 'raid') { const bx = document.querySelector('section.dbt.dtm-on .dtm'); if (bx && bx._keys) { const r0 = bx.getBoundingClientRect(); if (r0.bottom >= 80 && r0.top <= innerHeight - 80) return; } /* (the replay on screen keeps its own steps) */
    e.preventDefault(); snStep(e.key === 'ArrowLeft' ? -1 : 1); } });
// ---- keeping it in step ----
function snTick() { try { if (!$('#sideNav')) snMount(); if (document.body.classList.contains('snv-on') !== snOn()) snPlace(); if (!snOn()) return; if (S.page === 'pull' && S.item && TAB_ORDER.includes(S.tab)) { SN_LAST = S.item; store.set(SN_SUB_K, S.tab); }
  snDraw(); snKeys(); snCtx(); snAfter(); snThin(); snGsub(); } catch (e) { if (!snTick.warned) { snTick.warned = 1; console.warn('side menu', e); } } }
SN_MQ.addEventListener && SN_MQ.addEventListener('change', () => { snPlace(); snDraw(true); snTick(); });
try { snMount(); if (HIST && HIST.load) HIST.load().then(() => snDraw(true)).catch(() => {}); } catch (e) { console.warn('side menu', e); }
setInterval(snTick, 300);
{ const mo = new MutationObserver(() => { clearTimeout(snTick.t); snTick.t = setTimeout(snTick, 0); }); const m = $('#main'); if (m) mo.observe(m, { childList: true }); const v = () => { const w = $('#view'); if (w && w !== snTick.vw) { snTick.vw = w; mo.observe(w, { childList: true }); } }; setInterval(v, 1000); v(); }

/* (Nov 9, Flex: "it can just be a popup window not an entirely new page"): Import a log. The same path as Home's box: WCL.parseLink, then
   openWcl, which opens Raid review for a raid report and Mythic+ for a key */
function snImport() { let o = document.getElementById('snImp'); if (o) { o.querySelector('input').focus(); return; }
  o = document.createElement('div'); o.id = 'snImp'; o.className = 'snimp'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-labelledby', 'snImpT');
  o.innerHTML = '<div class="snimp-box"><div class="snimp-h"><b id="snImpT">Open a Warcraft Logs report</b><button type="button" class="snimp-x" aria-label="Close">✕</button></div>' +
    '<div class="snimp-r"><input type="text" spellcheck="false" autocomplete="off" aria-label="Warcraft Logs link or report code" placeholder="Paste a Warcraft Logs link or report code"><button type="button" class="btn primary snimp-go">Open</button></div><p class="snimp-m" aria-live="polite"></p>' + snRecentH() + '</div>';
  document.body.appendChild(o);
  const inp = o.querySelector('input'), go = o.querySelector('.snimp-go'), msg = o.querySelector('.snimp-m');
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  const close = () => { document.removeEventListener('keydown', onKey, true); o.remove(); };
  document.addEventListener('keydown', onKey, true);
  o.addEventListener('mousedown', (e) => { if (e.target === o) close(); });
  o.querySelector('.snimp-x').onclick = close;
  const open = async () => { const link = WCL.parseLink(inp.value);
    if (!link) { msg.className = 'snimp-m no'; msg.textContent = "That doesn't look like a Warcraft Logs link."; inp.focus(); return; }
    msg.className = 'snimp-m'; msg.textContent = 'Opening the report…'; go.disabled = true; inp.disabled = true;
    try { await openWcl(link, null, false, true); snRecentAdd(link); close(); } catch (err) { go.disabled = false; inp.disabled = false; msg.className = 'snimp-m no'; msg.textContent = err && err.message ? err.message : "That report couldn't be opened."; inp.focus(); } };
  go.onclick = open; o.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-snrec]'); if (!b) return; inp.value = b.dataset.snrec; open(); }); inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); open(); } };
  inp.oninput = () => { if (msg.classList.contains('no')) { msg.className = 'snimp-m'; msg.textContent = ''; } };
  setTimeout(() => inp.focus(), 0); }

/* (Nov 9, Flex: "it shouldnt get saved to their profile, its just a one time import", and a "recent log" section): the last 5 logs opened
   from Import a log, in this browser only. A log on this list is one-time: Plan doesn't learn its raiders unless it's your own raid. */
const SN_REC_K = 'wla-recent-logs';
const snRecent = () => { try { const v = JSON.parse(store.get(SN_REC_K) || '[]'); return Array.isArray(v) ? v.filter((x) => x && x.code) : []; } catch (e) { return []; } };
window.snOnce = (code) => snRecent().some((x) => x.code === code);
function snRecentAdd(link) { try { const t = (($('.brand p') || {}).textContent || '').replace(/^Warcraft Logs:\s*/, '').trim(); const L = snRecent().filter((x) => x.code !== link.code); L.unshift({ code: link.code, fight: link.fight || null, title: t && t !== link.code ? t : '', at: Date.now() }); store.set(SN_REC_K, JSON.stringify(L.slice(0, 5))); } catch (e) { /* (fine without) */ } }
function snRecentH() { const L = snRecent(); if (!L.length) return '';
  const d = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return '<div class="snimp-rh">Recent</div><div class="snimp-rl">' + L.map((x) => '<button type="button" class="snimp-ri" data-snrec="' + esc('https://www.warcraftlogs.com/reports/' + x.code + (x.fight ? '#fight=' + x.fight : '')) + '"><b>' + esc(x.title || x.code) + '</b><span>' + d(x.at) + '</span></button>').join('') + '</div>'; }
