(function () {
'use strict';
const E = window.ENGINE;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const C = E.compact, T = E.fmtT;

const CACHE = new Map();
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage off */ } } };
const S = { file: null, index: null, item: null, rep: null, tab: 'overview', role: 'all', meter: 'damage', mPlayer: null, pPlayer: null, death: 0, packs: E.PACKS.slice(), openSets: new Set(), openSecs: new Set() }; // (openSets: set lines opened in any tab)
// local debugging only: the current pull's analysis, for checking mechanics against the raw log
if (location.hostname === 'localhost') window.__wla = { S, CACHE, getRep, select, WCL, E, gradeBoss: (r) => gradeBoss(r), survivalOf: (r, p) => survivalOf(r, p), prepotted: (r, p) => prepotted(r, p), auditChar: (c, p) => auditChar(c, p), resolveSockets: (cs) => resolveSockets(cs), resolveCombatants: (cs) => resolveCombatants(cs), get FH() { return FH; }, startFileLive: (h) => startFileLive(h), LIVE: () => LIVE, openWcl: (l, c) => openWcl(l, c) };

// ---------- icons ----------
// Original icon set drawn in SVG, built into the app. Spell tiles are colored by magic school
// (from the log) and carry a symbol picked from the spell name. Class emblems are original designs.
const G = {
  sword: '<path d="M18 4h2v2L9 17l-2-2zM6 13l5 5M4 20l3-3"/>',
  dagger: '<path d="M17 4l3 3-8 8-3-3zM8 12l4 4M9 15l-5 5"/>',
  swords: '<path d="M4 4l12 12M20 4L8 16M14 18l4-4M10 18l-4-4M16 16l4 4M8 16l-4 4"/>',
  shield: '<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M12 7v10M8.5 11h7"/>',
  flame: '<path d="M12 3c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4.5 3-6 .5 2 1.5 3 2.5 3-.5-3-.5-5.5.5-8z"/>',
  frost: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>',
  drop: '<path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z"/>',
  venom: '<path d="M10 5c2.5 4 5 6.5 5 10a5 5 0 0 1-10 0c0-3.5 2.5-6 5-10z"/><circle cx="18" cy="6" r="1.6"/><circle cx="19" cy="12" r="1"/>',
  skull: '<path d="M12 3a8 8 0 0 0-8 8c0 3 2 4 3 5v4h10v-4c1-1 3-2 3-5a8 8 0 0 0-8-8zM10 20v-3M14 20v-3"/><circle cx="9" cy="11" r="1.7"/><circle cx="15" cy="11" r="1.7"/>',
  star: '<path d="M12 3l2.2 6.3 6.8.2-5.4 4.1 2 6.4-5.6-3.8-5.6 3.8 2-6.4L3 9.5l6.8-.2z"/>',
  leaf: '<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14zM5 19l8-8"/>',
  bolt: '<path d="M13 3L6 13h5l-1 8 8-11h-5z"/>',
  swirl: '<path d="M4 9c4-4 12-4 15 0M5 13c4-3 10-3 13 0M8 17c2-1.5 5-1.5 7 0"/>',
  arrow: '<path d="M4 20L18 6M13 5h6v6M5 16l3 3"/>',
  bow: '<path d="M7 3c8 3 8 15 0 18M7 3v18M4 12h16M17 9l3 3-3 3"/>',
  hammer: '<path d="M14 4l6 6-3 3-6-6zM12.5 9.5L4 18l2 2 8.5-8.5"/>',
  claw: '<path d="M6 4c2 5 2 10-1 16M12 3c2 6 2 11-1 18M18 4c2 5 2 10-1 16"/>',
  heal: '<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  stop: '<path d="M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7z"/><path d="M8 12h8"/>',
  wave: '<path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.5 15h9"/>',
  gem: '<path d="M7 4h10l4 5-9 12L3 9zM3 9h18M9 4l3 5 3-5M12 9v12"/>',
  eye: '<path d="M2 12c4-7 16-7 20 0-4 7-16 7-20 0z"/><circle cx="12" cy="12" r="3"/>',
  wing: '<path d="M3 18C6 8 13 4 21 4c-2 3-3 5-6 6 2 1 3 2 3 3-3 .5-5 1-7 2 1 1 1 2 .5 3z"/>',
  horns: '<path d="M5 4c-2 5 0 9 4 10M19 4c2 5 0 9-4 10M8 20c0-4 2-6 4-6s4 2 4 6"/>',
  lotus: '<path d="M12 20c-5-2-7-6-6-11 3 1 5 3 6 6 1-3 3-5 6-6 1 5-1 9-6 11zM12 15c-1-4-1-8 0-11 1 3 1 7 0 11"/>',
  orb: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/>',
  group: '<circle cx="12" cy="7" r="3"/><circle cx="5.5" cy="11" r="2.5"/><circle cx="18.5" cy="11" r="2.5"/><path d="M6 20c0-4 3-6 6-6s6 2 6 6M1.5 19c0-2.5 1.5-4 4-4M22.5 19c0-2.5-1.5-4-4-4"/>',
};
const SCHOOLS = [[1, '#b08a5a', 'sword'], [2, '#e8c25a', 'sun'], [4, '#e0662f', 'flame'], [8, '#5aa84a', 'leaf'], [16, '#4fa3e0', 'frost'], [32, '#8a5ad6', 'skull'], [64, '#d065d6', 'star']];
const KEYS = [
  [/potion|elixir|flask|phial/, 'flask', '#c0566b'], [/healthstone|stone/, 'gem', '#5aa84a'],
  [/kick|pummel|rebuke|counterspell|mind freeze|wind shear|skull bash|spear hand|muzzle|disrupt|quell|solar beam|silence/, 'stop', '#c9a227'],
  [/shield|barrier|ward|protection|block|wall|fortitude|scales|aegis|barkskin|defen|evasion|cloak|turtle|astral|resolve|dispersion|ice block|guardian|ardent|bulwark/, 'shield', '#6a8fb5'],
  [/death$|^death /, 'skull', '#7a4e8f'],
  [/venom|poison|toxi|caustic|acid|plague|blight|ichor|agony|corruption|affliction|miasma|murk|protovenom/, 'venom', '#4f9a3a'],
  [/fire|flame|burn|blaze|pyre|inciner|immolat|cremat|ember|scorch|combust|breath/, 'flame', '#e0662f'],
  [/frost|ice|cold|glacial|blizzard|freez|snow|chill/, 'frost', '#4fa3e0'],
  [/blood|sanguine|vampir|drain|crimson|rend/, 'drop', '#b8323a'],
  [/heal|mend|renew|rejuv|regrowth|word of glory|light of dawn|holy shock|prayer|riptide|chain heal|restor|bloom|vivify|regenerat|lay on hands/, 'heal', '#4cb36b'],
  [/lightning|storm|thunder|shock|bolt|static|spark/, 'bolt', '#4f8de0'],
  [/wind|tempest|cyclone|swirl|whirl|tornado|gust/, 'swirl', '#6fb3c8'],
  [/wave|water|tide|deluge|depths|surge|flood/, 'wave', '#3f8fc4'],
  [/arrow|shot|aimed|volley|barrage|fire\s?wall/, 'arrow', '#8a9a4a'],
  [/hammer|judgment|crusader|slam|smash|crush|quake|stomp|shatter|rattler/, 'hammer', '#b08a5a'],
  [/claw|fang|bite|maul|rake|feast|devour|gore|lacerat/, 'claw', '#a8653a'],
  [/shadow|void|soul|dark|curse|malice|spirit|echo|anguish|haunt|doom|dread|torment/, 'skull', '#8a5ad6'],
  [/arcane|missile|nether|time|mana|star/, 'star', '#d065d6'],
  [/light|holy|divine|avenging|dawn|sun|radian|smite|consecrat/, 'sun', '#e8c25a'],
  [/nature|thorn|root|leaf|grove|wild|moonfire|sunfire|wrath/, 'leaf', '#5aa84a'],
  [/eye|gaze|vision|mind/, 'eye', '#8a5ad6'],
  [/blade|strike|slash|cleave|mortal|raging|bloodthirst|rampage|verdict|melee|attack|swing|execute|axe|grinder|stab/, 'sword', '#b08a5a'],
  [/mutilate|envenom|garrote|ambush|backstab|dagger|eviscerat/, 'dagger', '#b0a040'],
];
const CLASS_GLYPH = { WARRIOR: 'swords', PALADIN: 'hammer', HUNTER: 'bow', ROGUE: 'dagger', PRIEST: 'eye', DEATHKNIGHT: 'skull', SHAMAN: 'bolt',
  MAGE: 'star', WARLOCK: 'flame', MONK: 'lotus', DRUID: 'leaf', DEMONHUNTER: 'horns', EVOKER: 'wing' };
const iconCache = new Map();
function pickIcon(id, name) {
  const k = id + '|' + name; if (iconCache.has(k)) return iconCache.get(k);
  const n = String(name || '').toLowerCase(), school = E.SCHOOL.get(id) || 0;
  let glyph = null, color = null;
  for (const [re, g, c] of KEYS) if (re.test(n)) { glyph = g; color = c; break; }
  for (const [bit, c, g] of SCHOOLS) if (school & bit) { color = c; if (!glyph) glyph = g; break; }
  const out = { glyph: glyph || 'orb', color: color || '#6c7a96' };
  iconCache.set(k, out); return out;
}
// Official icons: icon name looked up by spell ID (Wowhead tooltip data, cached in this browser),
// image from Wowhead's server with Blizzard's as backup. The built-in icon shows until it loads,
// and stays if it can't (for example inside the chat preview, which blocks outside images).
const OFFICIAL = (n) => ['https://wow.zamimg.com/images/wow/icons/large/' + n + '.jpg', 'https://render.worldofwarcraft.com/us/icons/56/' + n + '.jpg'];
const NAMES = new Map(), Q = []; let busy = 0;
function iconName(id) {
  if (NAMES.has(id)) return NAMES.get(id);
  const c = store.get('wla-icon-' + id);
  const p = c ? Promise.resolve(c === '-' ? null : c) : new Promise((res) => { Q.push({ id, res }); pumpIcons(); });
  NAMES.set(id, p); return p;
}
function pumpIcons() {
  while (busy < 6 && Q.length) {
    const { id, res } = Q.shift(); busy++;
    fetch('https://nether.wowhead.com/tooltip/spell/' + id).then((r) => (r.ok ? r.json() : null))
      .then((j) => { const n = j && j.icon ? String(j.icon).toLowerCase() : null; store.set('wla-icon-' + id, n || '-'); res(n); })
      .catch(() => res(null)).finally(() => { busy--; pumpIcons(); });
  }
}
function loadOfficial(img, name) {
  const urls = OFFICIAL(name); let k = 0;
  img.onload = () => { if (img.naturalWidth) img.parentNode && img.parentNode.classList.add('has'); };
  img.onerror = () => { if (++k < urls.length) img.src = urls[k]; else img.remove(); };
  img.src = urls[0];
}
function hydrateIcons() {
  document.querySelectorAll('img.oi:not([data-done])').forEach((img) => {
    img.dataset.done = '1';
    if (img.dataset.icon) loadOfficial(img, img.dataset.icon);
    else iconName(+img.dataset.sid).then((n) => (n ? loadOfficial(img, n) : img.remove()));
  });
}
// game icons for headings that aren't one spell (loaded by icon name, like every other icon)
// (these win over a spell of the same name in the log: "Death" would otherwise borrow whatever spell a log calls that,
// so the Deaths heading changed from log to log)
const NAMED_ICON = { 'avoidable damage': 'ability_rogue_feint', death: 'inv_misc_bone_humanskull_01' };
function spellIcon(id, name, big) {
  const named = !id && name && NAMED_ICON[String(name).toLowerCase()];
  if (!id && name && !named) id = E.SPELLID.get(String(name).toLowerCase()) || 0; // named only: use the ID the log used for it
  return '<span class="icw' + (big ? ' big' : '') + '">' + svgIcon(id, name, big) + (id ? '<img class="oi" data-sid="' + id + '" alt="">' : named ? '<img class="oi" data-icon="' + named + '" alt="">' : '') + '</span>';
}
function svgIcon(id, name, big) {
  const { glyph, color } = pickIcon(id, name);
  return '<svg class="ico' + (big ? ' big' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><rect x="0.5" y="0.5" width="23" height="23" rx="4.5" fill="' + color + '"/>' +
    '<rect x="0.5" y="0.5" width="23" height="23" rx="4.5" fill="url(#icoShade)"/><g transform="translate(4 4) scale(.6667)" class="gl">' + G[glyph] + '</g></svg>';
}
// A mechanic name as text with the spell tooltip on hover (the ID comes from the log when only the name is known)
function mech(name, id) { const n = String(name || ''); if (!n) return ''; const sid = id || E.SPELLID.get(n.toLowerCase()) || 0; if (!sid) return esc(n); return '<span class="sp mt" data-sid="' + sid + '" data-sn="' + esc(n) + '">' + esc(n) + '</span>'; }
// A status on the right of a heading or bar, in the same words and marks on every tab: ✕ a problem, ! could be better, ✓ fine
const hst = (st, txt) => '<span class="sst ' + st + '">' + ({ bad: '✕ ', warn: '! ', ok: '✓ ' }[st] || '') + esc(txt) + '</span>';
// "all 3 done", but just "done" for one (never "all 1 done")
const allOf = (n, one, many) => (n === 1 ? one : 'all ' + n + ' ' + many);
// "What went well" first, then "What went wrong", the same on Latest pull and Summary: what the raid did well leads (a strip
// across the top, the wins in two columns), and what to improve follows, with Latest pull's "Fix first" beside it (o.rightTop).
// One line per item (the worst wrong first; at most five, the rest counted), its time on the right, the whole line on hover.
// wrong: [{ sev: 'bad' | 'warn', html, when?, extra? }]; right: [html or { html }]
function wrongRight(wrong, right, o) {
  o = o || {};
  const MK = { bad: '✕', warn: '!', ok: '✓' }, max = o.max || 5, plain = (x) => String(x).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const line = (x, sev) => '<div class="pb-r ' + sev + '" title="' + esc(plain(x.html)) + '"><span class="pb-i">' + MK[sev] + '</span><span class="pb-t wr-t">' + x.html + '</span>' + (x.when ? '<span class="pb-w">' + esc(x.when) + '</span>' : '') + (x.extra || '') + '</div>';
  const ws = wrong.slice().sort((a, b) => (a.sev === 'bad' ? 0 : 1) - (b.sev === 'bad' ? 0 : 1)), shown = ws.slice(0, max), wSt = ws.some((x) => x.sev === 'bad') ? 'bad' : ws.length ? 'warn' : 'ok';
  const wPanel = '<div class="panel probbox wr ' + wSt + '"><h3 class="nh">What went wrong' + (o.sub ? ' <small>' + o.sub + '</small>' : '') + hst(wSt, ws.length ? plural(ws.length, 'thing') : 'nothing') + '</h3>' +
    (shown.length ? shown.map((x) => line(x, x.sev)).join('') : line({ html: o.none || 'Nothing went wrong.' }, 'ok')) +
    (ws.length > shown.length ? '<div class="wr-more sub">+' + (ws.length - shown.length) + ' more ' + (o.moreWhere || 'below') + '</div>' : '') + '</div>';
  // (what went well: a strip across the top, its lines in two columns; left out when there's nothing to call out)
  const gPanel = right.length ? '<div class="panel probbox wr ok wr-good"><h3 class="nh">What went well' + hst('ok', plural(right.length, 'thing')) + '</h3><div class="wr-gl">' +
    right.map((x) => line(typeof x === 'string' ? { html: x } : x, 'ok')).join('') + '</div></div>' : '';
  return '<div class="wr-wrap">' + gPanel + (o.rightTop ? '<div class="wr-cols"><div class="wr-l">' + wPanel + '</div><div class="wr-stack">' + o.rightTop + '</div></div>' : wPanel) + '</div>';
}
// (a mistake's sentence after a player's name reads on: "Kargaryen: their ghost touched another ghost")
const lcLead = (d) => (/^(Their|They|Was|Were|Had|Took|Got|Gained|Died|Stood|Used|Soaked|Kicked|Picked|Cursed|Didn't|Never|Ran|Walked|Moved|Left|Missed|Is)\b/.test(d) ? d.charAt(0).toLowerCase() + d.slice(1) : d);
// A Fight audit section header: icon and title with the mechanic's spell tooltip, plus the section's summary of this pull
function secHead(s) {
  // (generic icons like Death, Kick and Shield Wall aren't the mechanic, so those headers show only the summary)
  const name = s.spell && s.spell[1] || s.title, generic = /^(death|kick|shield wall)$/i.test(name), id = generic ? 0 : (s.spell && s.spell[0]) || E.SPELLID.get(String(name).toLowerCase()) || 0;
  return '<span class="sp sechd" data-sid="' + id + '" data-sn="' + esc(name) + '" data-ex="' + esc(s.summary || '') + '">' + spellIcon(id, name, true) + '<b>' + esc(s.title) + '</b></span>';
}
function spell(id, name, big) {
  if (!id && name) id = E.SPELLID.get(String(name).toLowerCase()) || 0;
  const inner = spellIcon(id, name, big) + esc(name);
  return id ? '<a class="sp" data-sid="' + id + '" data-sn="' + esc(name) + '" href="https://www.wowhead.com/spell=' + id + '" target="_blank" rel="noopener">' + inner + '</a>'
    : '<span class="sp" data-sn="' + esc(name) + '">' + inner + '</span>';
}

// ---- spell tooltips: Wowhead's spell description (fetched by ID, cached), cleaned and shown in our own box ----
const TIPS = new Map();
function tipData(id) {
  if (TIPS.has(id)) return TIPS.get(id);
  const p = fetch('https://nether.wowhead.com/tooltip/spell/' + id).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  TIPS.set(id, p); return p;
}
function cleanTip(html) {
  const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,img,link').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((n) => { for (const a of [...n.attributes]) if (/^on|^href$|^src$|^style$/i.test(a.name)) n.removeAttribute(a.name); });
  doc.querySelectorAll('a').forEach((a) => a.replaceWith(...a.childNodes));
  return doc.body.firstChild.innerHTML;
}
const spTip = document.createElement('div'); spTip.id = 'sptip'; document.body.appendChild(spTip);
let spTimer = null, spCur = null;
function placeTip(e) {
  const pad = 14, w = spTip.offsetWidth, h = spTip.offsetHeight;
  let x = e.clientX + pad, y = e.clientY + pad;
  if (x + w > innerWidth - 8) x = e.clientX - w - pad;
  if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8);
  spTip.style.left = x + 'px'; spTip.style.top = y + 'px';
}
document.addEventListener('mouseover', (e) => {
  const el = e.target.closest && e.target.closest('.sp');
  if (!el || el === spCur) return;
  spCur = el; clearTimeout(spTimer);
  spTimer = setTimeout(async () => {
    const name = el.dataset.sn || el.textContent, id = +el.dataset.sid || E.SPELLID.get(String(name).toLowerCase()) || 0;
    const school = E.SCHOOL.get(id), schools = ['Physical', 'Holy', 'Fire', 'Nature', 'Frost', 'Shadow', 'Arcane'].filter((_, i) => school & (1 << i));
    const head = '<div class="spt-h">' + spellIcon(id, name, true) + '<div><b>' + esc(name) + '</b>' + (schools.length ? '<div class="spt-s">' + schools.join(', ') + '</div>' : '') + '</div></div>' + (el.dataset.ex ? '<div class="spt-x">' + esc(el.dataset.ex) + '</div>' : '');
    spTip.innerHTML = head + (id ? '<div class="spt-b muted">Loading description…</div>' : el.dataset.ex ? '' : '<div class="spt-b muted">No spell ID in the log for this one.</div>');
    spTip.style.display = 'block'; placeTip(e); hydrateIcons();
    if (!id) return;
    const d = await tipData(id);
    if (spCur !== el) return;
    spTip.querySelector('.spt-b').outerHTML = d && d.tooltip
      ? '<div class="spt-b wh">' + cleanTip(d.tooltip) + '</div><div class="spt-f">Spell ' + id + ' · description from Wowhead</div>'
      : '<div class="spt-b muted">Description unavailable (open the app from your PC, not the chat preview, so it can reach Wowhead).</div><div class="spt-f">Spell ' + id + '</div>';
  }, 140);
});
document.addEventListener('mousemove', (e) => { if (spTip.style.display === 'block') placeTip(e); });
document.addEventListener('mouseout', (e) => {
  const el = e.target.closest && e.target.closest('.sp');
  if (el && !el.contains(e.relatedTarget)) { spCur = null; clearTimeout(spTimer); spTip.style.display = 'none'; }
});
function avatar(p, sm) {
  const col = p.color || '#9aa0ac';
  const glyph = p.name === 'Raid' ? 'group' : CLASS_GLYPH[p.cls] || 'orb';
  return '<span class="av' + (sm ? ' sm' : '') + '" style="border-color:' + col + ';color:' + col + '"><svg viewBox="0 0 24 24" aria-hidden="true"><g transform="translate(4.5 4.5) scale(.625)" class="gl em">' + G[glyph] + '</g></svg>' +
    (pIcon(p) ? '<img class="oi" data-icon="' + pIcon(p) + '" alt="">' : '') + '</span>';
}
// a player's icon: their spec's, or their class's when the spec isn't known
const pIcon = (p) => (p && (p.specIcon || (p.icon ? 'classicon_' + p.icon : null))) || null;
function deathChip(p) {
  if (!p.deaths || !S.rep) return '';
  const ts = keptDeaths(S.rep).filter((d) => d.guid === p.guid).map((d) => d.t).sort((a, b) => a - b);
  if (!ts.length) return '';
  return ' <span class="dchip" role="link" tabindex="0" data-guid="' + esc(p.guid) + '" title="Died at ' + ts.map(T).join(', ') + '. Click to see the death recap."><svg viewBox="0 0 24 24" aria-hidden="true"><g class="gl">' + G.skull + '</g></svg>Died ' + T(ts[0]) + (ts.length > 1 ? ' +' + (ts.length - 1) : '') + '</span>';
}
// Clicking a death badge jumps to that player's first death on the Deaths tab.
function openDeath(guid) {
  const ds = S.rep.deaths.slice().sort((a, b) => a.t - b.t);
  const i = ds.findIndex((d) => d.guid === guid);
  if (i < 0) return;
  S.death = i; S.pendingDeath = ds[i].guid + '@' + ds[i].t.toFixed(2); S.tab = 'audit'; setScope('pull'); renderMain();
}
document.addEventListener('click', (e) => {
  const c = e.target.closest && e.target.closest('.dchip');
  if (!c) return;
  e.preventDefault(); e.stopPropagation(); openDeath(c.dataset.guid);
}, true);
document.addEventListener('keydown', (e) => {
  const c = e.target.closest && e.target.closest('.dchip');
  if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); openDeath(c.dataset.guid); }
}, true);
// A player's name anywhere (outside the Player audit's own rows, links and buttons) opens them in the Player audit,
// on the same pull or all pulls as the tab it was clicked on.
document.addEventListener('click', (e) => {
  const nm = e.target.closest && e.target.closest('.who .nm'); if (!nm || nm.closest('.plrow, .mvc, a, button, #list')) return;
  const name = nm.textContent.trim(); if (!name || !S.rep || ![...S.rep.players.values()].some((p) => p.name === name)) return;
  e.preventDefault(); e.stopPropagation();
  if (S.scope === 'all' && S.tab !== 'live') S.plOpenN = name; else { S.plOpenP = name; if (S.tab === 'live') setScope('pull'); }
  S.plScroll = true; S.tab = 'player'; renderMain();
}, true);
function who(p, sub) {
  return '<span class="who">' + avatar(p) + '<span style="min-width:0"><div class="nm" style="color:' + p.color + '">' + esc(p.name) + '</div><div class="sub">' + esc(sub == null ? p.specName : sub) + '</div></span></span>';
}
function refreshIcons() { hydrateIcons(); }

// ---------- loading ----------
$('#openBtn').onclick = () => $('#fileIn').click();
$('#fileIn').onchange = (e) => e.target.files[0] && openFile(e.target.files[0]);
if ($('#packBtn')) $('#packBtn').onclick = () => $('#packIn').click(); // (the Add rules button was removed from the sidebar)
$('#packIn').onchange = async (e) => {
  let added = 0;
  for (const f of e.target.files) {
    try { const p = JSON.parse(await f.text()); (Array.isArray(p) ? p : [p]).forEach((x) => { if (x.encounter && x.rules) { S.packs = S.packs.filter((y) => y.encounter !== x.encounter); S.packs.push(x); added++; } }); }
    catch (err) { alert(f.name + " isn't a valid rule pack: " + err.message); }
  }
  if (added) CACHE.clear();
  if (added && S.item) select(S.item);
};
document.addEventListener('dragover', (e) => { e.preventDefault(); const d = $('.drop') || $('.home'); if (d) d.classList.add('over'); });
document.addEventListener('dragleave', () => { const d = $('.drop'); if (d) d.classList.remove('over'); });
document.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) openFile(f); });

async function openFile(file) {
  if (FH.dir) { FH.dir = null; if (LIVE.on) setLive(false); } // (opening a file stops watching the local log)
  S.file = file; S.wclCreds = null; S.wclCode = null; CACHE.clear();
  const prog = $('#prog'), bar = prog.firstElementChild;
  prog.style.display = 'block'; bar.style.width = '0';
  $('#bossHead').innerHTML = ''; $('#list').innerHTML = '<p class="muted" style="padding:8px">Reading ' + esc(file.name) + '…</p>';
  try {
    const reader = file.stream().getReader();
    S.index = await E.indexChunks(() => reader.read(), file.size, (x) => { bar.style.width = (x * 100).toFixed(1) + '%'; });
  } catch (err) {
    $('#list').innerHTML = '<p class="muted" style="padding:8px">Couldn\'t read that file: ' + esc(err.message) + '</p>';
    return;
  } finally { setTimeout(() => (prog.style.display = 'none'), 400); }
  renderList();
  const all = S.index.bosses.concat(S.index.runs).sort((a, b) => a.startMs - b.startMs);
  if (all.length) select(all[all.length - 1]);
  else $('#main').innerHTML = '<div class="empty"><div class="drop"><h2>No raid pulls in this log</h2><p class="muted">The file opened, but it has no raid boss pulls (dungeons and Mythic+ keys are left out: this site is for raids). Make sure combat logging was on during the raid.</p></div></div>';
}

// times of day in US 12-hour format ("7:33 PM"); fight timers (0:43) are durations and use T()
const ampm = (h, m, s) => (h % 12 || 12) + ':' + String(m).padStart(2, '0') + (s != null ? ':' + String(s).padStart(2, '0') : '') + ' ' + (h < 12 ? 'AM' : 'PM');
const clock = (ms) => { const d = new Date(ms); return ampm(d.getUTCHours(), d.getUTCMinutes()); }; // (log timestamps are read as UTC wall time)
const wallClock = (ms, sec) => { const d = new Date(ms); return ampm(d.getHours(), d.getMinutes(), sec ? d.getSeconds() : null); };
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const andList = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
function resChip(it) {
  const cls = it.result === 'Kill' || it.result === 'Timed' ? 'kill' : it.result === 'Wipe' || it.result === 'Depleted' ? 'wipe' : 'other';
  return '<span class="chip ' + cls + '">' + esc(it.result) + '</span>';
}
// ---------- the pull cards (under the banner) and the boss picker (in the top bar) ----------
// One boss at a time: an All pulls card, then a card per pull, oldest to newest: the pull and its time, how far it got
// (multi-phase fights: the phase reached and that phase's boss health) with a bar, coloured like WoW item quality by how
// far through the whole encounter it got (a kill legendary orange), a star on tonight's best. More than one boss (or a Mythic+ key) tonight: the boss picker in the top bar switches.
let ITEMS = [], STRIP_T = 0;
const stripSoon = () => { clearTimeout(STRIP_T); STRIP_T = setTimeout(() => { renderList(); refreshHead(); }, 400); }; // (the banner's comparisons fill in too)
// a pull's result in a few characters: "P2 · 71%", "Kill", "34%"
function pullShort(b) {
  if (b.kill) return 'Kill';
  const p = pullProg(b); if (p && p.phase) { const m = /(\d+)%/.exec(p.label); return p.phase.replace('Intermission', 'Int') + (m ? ' · ' + m[1] + '%' : ''); }
  const v = pullPct(b); return v != null ? Math.round(v) + '%' : 'Wipe';
}
const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
function renderList() {
  ITEMS = [];
  const add = (it) => { ITEMS.push(it); return ITEMS.length - 1; };
  const box = $('#list'), pick = $('#bossPick'); if (!box) return;
  // (no pull cards or boss picker on the front page, even when a log read in the background redraws them)
  if (!S.item && $('.home')) { box.innerHTML = ''; if (pick) pick.innerHTML = ''; return; }
  const old = box.querySelector('.film'), sl = old ? old.scrollLeft : null;
  const { bosses, runs } = S.index || { bosses: [], runs: [] };
  // every boss and difficulty pulled tonight, in the order first pulled, then each Mythic+ key
  const groups = [], byBoss = new Map();
  for (const b of bosses) { if (b.run) continue; const k = b.boss + ' (' + b.diff + ')'; if (!byBoss.has(k)) { byBoss.set(k, []); groups.push({ k, kind: 'boss', list: byBoss.get(k) }); } byBoss.get(k).push(b); }
  for (const r of runs) groups.push({ k: r.zone + ' +' + r.level, kind: 'run', run: r, list: [r].concat(r.bosses) });
  if (!groups.length) { box.innerHTML = ''; if (pick) pick.innerHTML = ''; return; }
  const cur = (S.item && groups.find((g) => g.list.includes(S.item))) || groups[groups.length - 1];
  const allMode = S.scope === 'all' && S.tab !== 'live' && cur.kind === 'boss';
  // the boss picker: a menu when there's more than one boss tonight, else just the name
  const gName = (g) => (g.kind === 'run' ? g.run.zone + ' +' + g.run.level : g.list[0].boss + ' · ' + g.list[0].diff);
  const gLast = (g) => (g.kind === 'run' ? g.run : g.list[g.list.length - 1]);
  // (a log with more than one boss: the switch says how many, in gold, so it's easy to spot)
  if (pick) pick.innerHTML = groups.length > 1 ? '<button class="bp-b multi" type="button" aria-haspopup="true" aria-expanded="false" title="This log has ' + groups.length + ' bosses: pick one"><span class="bp-n">' + groups.length + ' bosses</span>' + esc(gName(cur)) + CHEV + '</button><div class="bp-pop" hidden>' +
    groups.map((g) => '<button class="bp-i' + (g === cur ? ' on' : '') + '" type="button" data-last="' + add(gLast(g)) + '"><b>' + esc(gName(g)) + '</b><span>' + (g.kind === 'run' ? esc(g.run.result) + ' · ' + T(g.run.duration) : plural(g.list.length, 'pull') + (g.list.some((b) => b.kill) ? ' · killed' : '')) + '</span></button>').join('') + '</div>'
    : '<span class="bp-l">' + esc(gName(cur)) + '</span>';
  let h = '';
  if (cur.kind === 'boss') {
    const list = cur.list, kill = list.find((b) => b.kill), known = list.map((b) => [b, pullPct(b)]).filter(([, v]) => v != null);
    const best = kill || (known.length ? known.reduce((m, x) => (x[1] < m[1] ? x : m))[0] : null);
    // (each pull in WoW item-quality colours by how far through the whole encounter it got, all phases and bosses
    // together; a kill is legendary, and a wipe is never red)
    const card = (b) => {
      const v = pullPct(b), done = b.kill ? 100 : v == null ? 0 : Math.max(3, 100 - v);
      const col = pullCol(b) || '#6aa8ff', at = b.wallMs ? wallClock(b.wallMs) : clock(b.startMs);
      const tip = 'Pull ' + b.pull + ' · ' + at + ' · ' + (b.kill ? 'kill' : v == null ? 'wipe' : 'wipe, ' + pullLabel(b)) + ' · ' + T(b.duration) + (b === best && !b.kill ? ' · best pull of the night' : '') +
        (!b.kill && v != null ? ' · ' + Math.floor(100 - v) + '% of the encounter done' : ''); // (rounded down, like the colour steps)
      return '<button class="pull fcard' + (b.kill ? ' kill' : '') + (b === best ? ' best' : '') + (v == null && !b.kill ? ' unk' : '') + (b === S.item ? ' sel' : '') + (allMode ? ' dim' : '') + '" type="button" data-i="' + add(b) + '" title="' + esc(tip) + '" style="--pc:' + col + '">' +
        '<span class="fc-h"><b>Pull ' + b.pull + '</b><span>' + esc(at) + '</span></span><span class="fc-p">' + esc(v == null && !b.kill ? T(b.duration) : pullShort(b)) + '</span><i class="fc-bar"><b style="width:' + done.toFixed(1) + '%"></b></i></button>';
    };
    // (no "All pulls" card: the Summary tab is the all-pulls page, and the banner shows the best pull)
    // (the arrows float over the faded ends of the cards, so the cards run the full width, and only show when there's more that way)
    h = '<div class="sg-row"><div class="fwrap"><button class="fnav l" type="button" data-d="-1" aria-label="Earlier pulls">‹</button><div class="film">' + list.map(card).join('') + '</div><button class="fnav r" type="button" data-d="1" aria-label="Later pulls">›</button></div></div>';
  } else {
    // a Mythic+ key: the whole key, then each boss in it
    h = '<div class="sg-row"><div class="film keys">' + cur.list.map((b, i) => { const ok = b.kill || b.result === 'Timed';
      return '<button class="pull fcard' + (ok ? ' kill' : '') + (b === S.item ? ' sel' : '') + '" type="button" data-i="' + add(b) + '" style="--pc:' + (ok ? '#45c15c' : '#e5534b') + '"><span class="fc-h"><b>' + (i ? esc(b.boss) : '∑ Whole key') + '</b></span><span class="fc-p">' + esc(b.result) + ' · ' + T(b.duration) + '</span><i class="fc-bar"><b style="width:' + (ok ? 100 : 40) + '%"></b></i></button>'; }).join('') + '</div></div>';
  }
  box.innerHTML = h;
  // the wipe filter: a card at the right end of a boss's pull cards (a Mythic+ key doesn't have one)
  if (CUT_NODE) { const row = cur.kind === 'boss' && box.querySelector('.sg-row'); if (row) row.appendChild(CUT_NODE); else if (CUT_NODE.parentNode) CUT_NODE.parentNode.removeChild(CUT_NODE); }
  if (bosses.some((b) => !b.wcl && !CACHE.has(b))) warmPulls();
  // (clicking one pull shows that pull on every tab; All pulls shows every pull of the boss: see setScope)
  box.querySelectorAll('.pull').forEach((b) => (b.onclick = () => { setScope('pull'); select(ITEMS[+b.dataset.i]); }));
  box.querySelectorAll('.allp').forEach((b) => (b.onclick = () => { setScope('all'); const it = ITEMS[+b.dataset.last]; if (S.item === it && S.rep) renderMain(); else select(it); }));
  if (pick) {
    const pb = pick.querySelector('.bp-b'), pop = pick.querySelector('.bp-pop');
    if (pb && pop) pb.onclick = (e) => { e.stopPropagation(); pop.hidden = !pop.hidden; pb.setAttribute('aria-expanded', String(!pop.hidden)); };
    pick.querySelectorAll('.bp-i').forEach((b) => (b.onclick = () => { if (pop) pop.hidden = true; setScope('pull'); select(ITEMS[+b.dataset.last]); }));
  }
  // keep the cards where they were (the newest in view the first time), the picked pull in view, and the mouse wheel
  // and the arrows scrolling them sideways
  const film = box.querySelector('.film'), sel = box.querySelector('.film .fcard.sel');
  if (film) {
    film.onwheel = (e) => { if (film.scrollWidth > film.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { film.scrollLeft += e.deltaY; e.preventDefault(); } };
    box.querySelectorAll('.fnav').forEach((b) => (b.onclick = () => film.scrollBy({ left: +b.dataset.d * Math.max(200, film.clientWidth * 0.7), behavior: 'smooth' })));
    fitFilm();
    film.scrollLeft = sl != null ? sl : film.scrollWidth;
    if (sel) { const a = sel.offsetLeft - film.offsetLeft, w = film.clientWidth; if (a < film.scrollLeft || a + sel.offsetWidth > film.scrollLeft + w) film.scrollLeft = a - w / 2 + sel.offsetWidth / 2; }
    // (the arrows show only when there's more that way, and that edge of the cards fades out)
    const navs = () => { const [l, r] = box.querySelectorAll('.fnav'), atL = film.scrollLeft <= 2, atR = film.scrollLeft + film.clientWidth >= film.scrollWidth - 2; if (l) l.hidden = atL; if (r) r.hidden = atR; film.classList.toggle('fl', !atL); film.classList.toggle('fr', !atR); };
    film.onscroll = navs; navs();
  }
}
// On a computer the pull cards stretch a little so a whole number of them fills the strip: it then always stops on whole
// cards, the newest at the right edge and no half card at the left
function fitFilm() {
  const film = $('#strip .film:not(.keys)'); if (!film) return;
  if (window.innerWidth < 761) { film.style.removeProperty('--fw'); return; }
  const g = 6, cw = film.clientWidth - 2, n = Math.max(1, Math.floor((cw + g) / (114 + g)));
  film.style.setProperty('--fw', ((cw - g * (n - 1)) / n).toFixed(2) + 'px');
}
{ let t = 0; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fitFilm, 120); }); }
// (a click anywhere else closes the boss picker)
document.addEventListener('click', (e) => { const pop = $('#bossPick .bp-pop'); if (pop && !pop.hidden && !e.target.closest('#bossPick')) { pop.hidden = true; const b = $('#bossPick .bp-b'); if (b) b.setAttribute('aria-expanded', 'false'); } });
// the top bar's menu: open a combat log, Warcraft Logs, the start screen
{
  const b = $('#tbMenu'), pop = $('#tbMenuPop'), close = () => { pop.hidden = true; b.setAttribute('aria-expanded', 'false'); };
  if (b && pop) {
    b.onclick = (e) => { e.stopPropagation(); pop.hidden = !pop.hidden; b.setAttribute('aria-expanded', String(!pop.hidden)); };
    pop.addEventListener('click', close);
    document.addEventListener('click', (e) => { if (!pop.hidden && !e.target.closest('.tbmenu')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) close(); });
  }
  // Saved progress: the bar above the banner, to say whether this log is your raid, forget the team or clear the saved pulls
  const sv = $('#tbSaved'); if (sv) sv.onclick = () => { S.meOpen = true; if (S.rep && S.item && $('#bossHead').innerHTML) { renderMain(); window.scrollTo({ top: 0 }); } };
}
// Local logs only know how far a pull got once it's read: the rest are read in the background, newest first, one at a
// time with a pause between, so the strip fills in (and the all-pulls tabs open faster later).
let WARM = null;
function warmPulls() {
  if (WARM || !S.index) return;
  const idx = S.index;
  WARM = (async () => {
    for (const b of idx.bosses.slice().reverse()) {
      if (S.index !== idx) break;
      if (b.wcl || CACHE.has(b)) continue;
      await new Promise((r) => setTimeout(r, 600));
      if (S.index !== idx) break;
      try { await getRep(b); } catch (e) { /* skip a pull that fails */ }
      stripSoon();
    }
  })().finally(() => { WARM = null; });
}

// ---------- saved progress: your raid's pulls, across nights ----------
// Each pull of your raid that gets analyzed is kept on this PC as a short summary (how far it got, its length, deaths, the
// note's assignment results), so the next night on the same boss picks up the progress: the banner and Summary count the
// earlier nights too. Which logs are your raid: the first one is confirmed once ("Is this your raid?") and its roster
// becomes your team; after that, a log where at least half the players are on your team is yours (sitting a fight doesn't
// matter), and one that's mostly other players asks first. A log that isn't yours is analyzed as usual but not saved.
const HIST = (() => {
  let dbp = null, ready = null;
  const open = () => dbp || (dbp = new Promise((res) => { try { const rq = indexedDB.open('wla-history', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('pulls'); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); } catch (e) { res(null); } }));
  const run = async (mode, fn) => { const d = await open(); if (!d) return null; return new Promise((res) => { try { const t = d.transaction('pulls', mode), rq = fn(t.objectStore('pulls')); t.oncomplete = () => res(rq ? rq.result : true); t.onerror = t.onabort = () => res(null); } catch (e) { res(null); } }); };
  const mem = new Map();
  return {
    mem,
    load: () => ready || (ready = run('readonly', (st) => st.getAll()).then(async (vals) => {
      const fix = [];
      for (const v of vals || []) if (v && v.k) { if (/^log:/.test(v.src || '') && !v.utc) fix.push(v); else mem.set(v.k, v); }
      // (pulls saved from a combat log before Oct 16 had the log's clock read as UTC, hours off the real time a
      // Warcraft Logs pull has: moved to the real time once, so the same pull from both is one record)
      for (const v of fix) { const old = v.k; v.at += new Date(v.at).getTimezoneOffset() * 60000; v.utc = true; v.k = histKey({ boss: v.boss, diffId: v.diffId, wallMs: v.at });
        await run('readwrite', (st) => st.delete(old)); mem.set(v.k, v); await run('readwrite', (st) => st.put(v, v.k)); }
      return mem;
    })),
    put: (v) => { mem.set(v.k, v); return run('readwrite', (st) => st.put(v, v.k)); },
    del: (k) => { mem.delete(k); return run('readwrite', (st) => st.delete(k)); },
    // (what's saved right now, also what another tab saved since this one loaded)
    reload: () => run('readonly', (st) => st.getAll()).then((vals) => { if (vals) { mem.clear(); for (const v of vals) if (v && v.k) mem.set(v.k, v); } return mem; }),
    clear: () => { mem.clear(); return run('readwrite', (st) => st.clear()); },
  };
})();
const TEAM_KEY = 'wla-team', ALLOW_KEY = 'wla-hist-allow', DENY_KEY = 'wla-hist-deny';
const listGet = (k) => { try { const v = JSON.parse(store.get(k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
const listAdd = (k, xs) => { const l = listGet(k); for (const x of xs) if (x && !l.includes(x)) l.push(x); store.set(k, JSON.stringify(l)); };
const listDel = (k, x) => store.set(k, JSON.stringify(listGet(k).filter((y) => y !== x)));
const team = () => listGet(TEAM_KEY);
// the log or report this is (a yes or no covers all of its pulls)
const srcKey = () => (S.wclCode ? 'wcl:' + S.wclCode : FH.dir && FH.name ? 'log:' + FH.name : S.file ? 'log:' + S.file.name : '');
const rosterOf = (r) => [...r.players.values()].map((p) => p.name);
// yes: confirmed, or at least half the players are on the team; no: said no; null: not known yet (ask)
function raidMine(r) {
  if (!r) return null; const k = srcKey();
  if (k && listGet(ALLOW_KEY).includes(k)) return true;
  if (k && listGet(DENY_KEY).includes(k)) return false;
  const tm = new Set(team()); if (!tm.size) return null;
  const ns = rosterOf(r); return ns.length && ns.filter((n) => tm.has(n)).length / ns.length >= 0.5 ? true : null;
}
const isMyRaid = (r) => raidMine(r) === true;
// (the same pull from the log and from Warcraft Logs is one record: boss, difficulty and start time to 10 seconds)
const histKey = (it) => it.boss + '|' + it.diffId + '|' + Math.round((it.wallMs || it.startMs || 0) / 10000);
// a raid night runs past midnight: pulls before 6 AM count for the evening before
const nightOf = (ms) => { const d = new Date(ms - 6 * 3600e3); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const nightLabel = (ms) => new Date(ms - 6 * 3600e3).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
let HIST_T = null;
const histSoon = () => { clearTimeout(HIST_T); HIST_T = setTimeout(refreshHead, 400); };
function histSave(r) {
  const it = r && r.item; if (!it || it.kind !== 'boss' || it.run || !(it.wallMs || it.startMs) || !isMyRaid(r)) return;
  listAdd(TEAM_KEY, rosterOf(r)); // (the team follows the raid: new members join it as their pulls are saved)
  const pg = progressOf(r), d0 = r.deaths.slice().sort((a, b) => a.t - b.t)[0];
  let checks = []; try { checks = (nsrtChecks(r) || []).map((c) => ({ cat: c.cat, label: c.label, st: c.st })); } catch (e) { /* no note */ }
  // (a pull already saved keeps its number: in a night that came from Warcraft Logs it's its place in the whole night)
  HIST.put({ k: histKey(it), v: 1, boss: it.boss, diff: it.diff, diffId: it.diffId, id: it.id, at: it.wallMs || it.startMs, pull: (HIST.mem.get(histKey(it)) || {}).pull || it.pull, kill: !!it.kill, dur: r.duration,
    left: it.kill ? 0 : pg ? pg.left : r.bossPct != null ? r.bossPct : null, label: it.kill ? 'Kill' : pg ? pg.label : r.bossPct != null ? r.bossPct.toFixed(1) + '%' : 'Wipe',
    deaths: r.deaths.length, first: d0 ? d0.player : null, players: [...r.players.values()].map((p) => p.name), checks, src: srcKey(), utc: !!it.wallMs, saved: Date.now(),
    ...(it.wcl ? { wcl: { code: it.wcl.code, fight: it.wcl.fight } } : (HIST.mem.get(histKey(it)) || {}).wcl ? { wcl: HIST.mem.get(histKey(it)).wcl } : {}) });
  histSoon();
}
// the saved nights on this boss before the night shown (a raid night is one date; tonight's pulls come from the log itself)
function histFor(it) {
  const tn = nightOf(it.wallMs || it.startMs), by = new Map();
  for (const v of HIST.mem.values()) { if (v.boss !== it.boss || v.diffId !== it.diffId) continue; const n = nightOf(v.at); if (n >= tn) continue; if (!by.has(n)) by.set(n, []); by.get(n).push(v); }
  const earlier = [...by].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([n, list]) => {
    list.sort((a, b) => a.at - b.at);
    const kill = list.find((x) => x.kill), known = list.filter((x) => x.left != null), best = kill || (known.length ? known.reduce((m, x) => (x.left < m.left ? x : m)) : null);
    return { n, label: nightLabel(list[0].at), list, kill, best, time: list.reduce((s, x) => s + (x.dur || 0), 0) };
  });
  const bestE = earlier.map((x) => x.best).filter(Boolean).reduce((m, x) => (!m || x.left < m.left ? x : m), null);
  return { earlier, pulls: earlier.reduce((s, x) => s + x.list.length, 0), best: bestE, kill: earlier.find((x) => x.kill) || null };
}
HIST.load().then(() => refreshHead());
// ---------- your team on Warcraft Logs: every raid night of this tier, imported into saved progress ----------
// The team's reports since this tier began (not Alt Stuff runs) are read as short pull summaries of this tier's bosses,
// like a pull saved from a log, so the Summary and the Progress page count every night, also ones nobody logged on this
// PC. A pull already saved (from your own log, or a second report of the same night) is kept once: same
// boss and difficulty, starting within 15 seconds. Running it again only reads reports that are new or changed.
const TEAMW_KEY = 'wla-team-wcl', TIER_RE = /venomous abyss/i;
const teamW = () => { try { return JSON.parse(store.get(TEAMW_KEY) || 'null'); } catch (e) { return null; } };
// Your teams: any number of Warcraft Logs teams, guilds and characters (your own page: every raid you were in, with any
// group). Each is { gid, kind: 'team' | 'guild' | 'char', id, name, label (your own name for it), server, done, last,
// reports }. A saved pull lists the ones it came in with (groups); one from a log opened on this PC belongs to a team when
// at least half its players are on it, and to a character when they were in it. The one team kept before Oct 18 becomes
// the first entry (legacy: its pulls were saved before pulls listed their teams).
const GROUPS_KEY = 'wla-groups', GROUP_CUR = 'wla-group-cur';
function groups() {
  let l = null; try { l = JSON.parse(store.get(GROUPS_KEY) || 'null'); } catch (e) { l = null; }
  if (!Array.isArray(l)) { const tw = teamW(); l = tw && tw.id ? [{ ...tw, gid: 'g' + tw.id, kind: tw.team ? 'team' : 'guild', legacy: true }] : []; store.set(GROUPS_KEY, JSON.stringify(l)); }
  return l;
}
const groupsSet = (l) => store.set(GROUPS_KEY, JSON.stringify(l));
const groupPut = (g) => { const l = groups(), i = l.findIndex((x) => x.gid === g.gid); if (i < 0) l.push(g); else l[i] = g; groupsSet(l); };
const groupCur = () => { const l = groups(), c = store.get(GROUP_CUR); return c === '*' ? null : l.find((g) => g.gid === c) || l[0] || null; };
const gName = (g) => g.label || g.name;
const gKind = (g) => (g.kind === 'char' ? 'character' : g.kind);
// the teams a saved pull came in with (a pull from before Oct 18 brought in by the old single team: that team)
const pullGroups = (v) => v.groups || (v.team ? groups().filter((g) => g.legacy).map((g) => g.gid) : []);
// which saved pulls are a team's: brought in by it, or any other pull with at least half its players on it (its players:
// everyone in the pulls it brought in). A team's nights aren't always on its own Warcraft Logs page (some get filed under a
// guild's), so a night your character or another team brought in still counts when it's this team's raid; a pug with a
// few of its players doesn't. A character's: every pull they were in.
function groupFilter(g) {
  if (!g) return () => true;
  if (g.kind === 'char') return (v) => pullGroups(v).includes(g.gid) || (v.players || []).includes(g.name);
  const roster = new Set(); for (const v of HIST.mem.values()) if (pullGroups(v).includes(g.gid)) for (const n of v.players || []) roster.add(n);
  return (v) => { if (pullGroups(v).includes(g.gid)) return true; if (!roster.size) return false; const ps = v.players || []; return ps.length >= 5 && ps.filter((n) => roster.has(n)).length / ps.length >= 0.5; };
}
// (a team's or character's Warcraft Logs link, either kind)
const groupLink = (s) => { const c = WCL.parseCharLink(s); if (c) return { kind: 'char', link: c }; const t = WCL.parseTeamLink(s); return t ? { kind: 'team', link: t } : null; };
async function groupAdd(raw) {
  const gl = groupLink(raw);
  if (!gl && WCL.parseLink(raw)) throw new Error('That\'s a report link: one night. Here, paste the page of your team, guild or character (see "Which link?" below). A single report opens from the box at the top of the home page.');
  if (!gl) throw new Error('That doesn\'t look like a Warcraft Logs team, guild or character link (see "Which link?" below).');
  const creds = await wclCreds(), info = gl.kind === 'char' ? await WCL.charInfo(creds, gl.link) : await WCL.teamInfo(creds, gl.link);
  const gid = (gl.kind === 'char' ? 'c' : 'g') + info.id;
  if (groups().some((g) => g.gid === gid)) { store.set(GROUP_CUR, gid); return { g: groups().find((g) => g.gid === gid), already: true }; }
  const g = { gid, kind: gl.kind === 'char' ? 'char' : info.team ? 'team' : 'guild', id: info.id, name: info.name, server: info.server, done: {}, ...(gl.kind === 'char' ? { cls: info.cls, guild: info.guild, clsV: 3 } : { faction: info.faction, facV: 1 }) };
  groupPut(g); store.set(GROUP_CUR, gid); return { g, already: false };
}
// Removing a team: it leaves the list, and so does every pull only it brought in (a pull from a log opened on this PC,
// or one another team or your character also brought in, stays). Returns how many pulls went.
async function groupRemove(g) {
  await HIST.load(); let n = 0;
  for (const v of [...HIST.mem.values()]) { const gs = pullGroups(v); if (!gs.includes(g.gid)) continue; const rest = gs.filter((x) => x !== g.gid);
    if (!rest.length && !/^log:/.test(v.src || '')) { await HIST.del(v.k); n++; } else { v.groups = rest; await HIST.put(v); } }
  groupsSet(groups().filter((x) => x.gid !== g.gid)); if (store.get(GROUP_CUR) === g.gid) store.set(GROUP_CUR, '');
  if (g.legacy) store.set(TEAMW_KEY, 'null');
  histSoon(); return n;
}
// how many saved pulls only this team brought in (what Remove would delete)
const groupOnly = (g) => [...HIST.mem.values()].filter((v) => { const gs = pullGroups(v); return gs.length === 1 && gs[0] === g.gid && !/^log:/.test(v.src || ''); }).length;
async function wclCreds() {
  if (WCL.HOSTED) return null;
  const j = await fetch('/wcl/login').then((r) => r.json()).catch(() => ({}));
  if (!j.saved) throw new Error('Connect Warcraft Logs first: menu, Warcraft Logs, then import any report once.');
  return { id: j.id, secret: '' };
}
// (one import at a time across tabs: two tabs importing at once each only knew their own saves and kept a pull twice)
const IMPORT_LOCK = 'wla-team-import';
async function teamImport(g, onStep) {
  const lk = +(store.get(IMPORT_LOCK) || 0); if (Date.now() - lk < 90e3) throw new Error('An import is already running in another tab. Try again when it finishes.');
  store.set(IMPORT_LOCK, String(Date.now()));
  try { return await teamImportRun(g, onStep); } finally { store.set(IMPORT_LOCK, '0'); }
}
async function teamImportRun(g0, onStep) {
  await HIST.load();
  const g = g0 && groups().find((x) => x.gid === g0.gid); if (!g || !g.id) throw new Error('Add your team first.');
  const creds = await wclCreds(), ch = g.kind === 'char'; g.done = g.done || {};
  if (onStep) onStep('Looking for ' + gName(g) + '\'s reports…');
  // (every report since the tier's first raid, wherever Warcraft Logs filed it: a raid night that also had keys in it is
  // filed under Mythic+, like the Oct 14 Twin Fangs kill; only this tier's bosses are kept from each. A character's list
  // is mostly keys, so for one only this tier's raid reports and nights a guild logged are read)
  const list = ch ? await WCL.charReports(creds, g.id) : await WCL.teamReports(creds, g.id), tierAt = list.filter((x) => x.zone && TIER_RE.test(x.zone.name)).map((x) => x.startTime);
  const since = tierAt.length ? Math.min(...tierAt) - 2 * 86400e3 : Infinity, tierBoss = new Set(E.PACKS.map((p) => p.encounter));
  // (a boss new to the tier since the last import, like Nymrissa and Kith'ix: every report is read again for its pulls;
  // pulls already saved are skipped)
  const bossKey = [...tierBoss].join('|'); if (g.bosses !== bossKey) { g.done = {}; g.bosses = bossKey; }
  const reps = list.filter((x) => x.startTime >= since && (ch ? (x.zone && TIER_RE.test(x.zone.name)) || x.guild : !/alt/i.test((x.guildTag || {}).name || '')));
  const todo = reps.filter((x) => g.done[x.code] !== x.endTime).sort((a, b) => a.startTime - b.startTime);
  let added = 0, dup = 0, pulls = 0, failed = 0;
  // (a report another of your teams already read in full isn't downloaded again: its saved pulls are this one's too, for a
  // character the ones they were in)
  const known = (x) => groups().some((o) => o.gid !== g.gid && o.done && o.done[x.code] === x.endTime);
  for (const x of todo.filter(known)) {
    for (const v of [...(await HIST.reload()).values()]) { if (!v.wcl || v.wcl.code !== x.code || (ch && !(v.players || []).includes(g.name))) continue; const gs = pullGroups(v); pulls++; dup++; if (!gs.includes(g.gid)) { v.groups = gs.concat(g.gid); await HIST.put(v); } }
    g.done[x.code] = x.endTime;
  }
  groupPut(g);
  // (the rest are read three at a time)
  const rest = todo.filter((x) => !known(x) && g.done[x.code] !== x.endTime);
  for (let i = 0; i < rest.length; i += 3) {
    const batch = rest.slice(i, i + 3); if (onStep) onStep('Reading ' + nightLabel(batch[0].startTime) + ' (' + Math.min(rest.length, i + batch.length) + ' of ' + rest.length + ')…');
    store.set(IMPORT_LOCK, String(Date.now()));
    // (a report that won't load, like a private one, is skipped and tried again next time; the rest carry on)
    const nights = await Promise.all(batch.map((x) => WCL.nightPulls(creds, x.code).catch((e) => { console.warn('Import: skipped ' + x.code + ':', e && e.message); return null; })));
    for (let b = 0; b < batch.length; b++) {
      const x = batch[b], night = nights[b]; if (!night) { failed++; continue; }
      const all = [...(await HIST.reload()).values()];
      for (const p of night.pulls) {
        if (!tierBoss.has(p.boss) || (ch && !(p.players || []).includes(g.name))) continue; // (a character: only the pulls they were in)
        pulls++;
        // (a pull already saved: it's this team's too)
        const have = all.find((v) => v.boss === p.boss && v.diffId === p.diffId && Math.abs(v.at - p.at) < 15000);
        if (have) { const gs = pullGroups(have); if (!gs.includes(g.gid)) { have.groups = gs.concat(g.gid); await HIST.put(have); } dup++; continue; }
        const pg = !p.kill && PROGRESS[p.boss] ? wclProg({ boss: p.boss, endPhase: p.endPhase, endBoss: p.endBoss }) : null;
        const v = { k: histKey({ boss: p.boss, diffId: p.diffId, wallMs: p.at }), v: 1, boss: p.boss, diff: p.diff, diffId: p.diffId, id: p.id, at: p.at, pull: 0, kill: p.kill, dur: p.dur,
          left: p.kill ? 0 : pg ? pg.left : p.endPct, label: p.kill ? 'Kill' : pg ? pg.label : p.endPct != null ? p.endPct.toFixed(1) + '%' : 'Wipe',
          deaths: p.deaths, first: p.first, players: p.players, checks: [], src: 'wcl:' + x.code, wcl: { code: x.code, fight: p.fight }, team: true, groups: [g.gid], utc: true, saved: Date.now() };
        await HIST.put(v); all.push(v); added++;
      }
      // (a team's players are your raid: later logs with them are saved on their own; a character's groups aren't)
      if (!ch) listAdd(TEAM_KEY, [...new Set(night.pulls.filter((p) => tierBoss.has(p.boss)).flatMap((p) => p.players))]);
      g.done[x.code] = x.endTime; groupPut(g);
    }
  }
  await histTidy();
  g.last = Date.now(); g.reports = reps.length; groupPut(g); histSoon();
  return { reports: todo.length - failed, pulls, added, dup, failed };
}
// Saved pulls kept tidy: the same pull twice (same boss and difficulty, starting within 15 seconds) is kept once (the one
// from your own log, with the note's checks, over a Warcraft Logs summary), and in a night that came from Warcraft Logs every
// pull is numbered by its place in the whole night (your log may have started a few pulls late).
async function histTidy() {
  const all = [...(await HIST.reload()).values()], score = (v) => (/^log:/.test(v.src || '') ? 4 : 0) + ((v.checks || []).length ? 2 : 0) + (v.team ? 0 : 1);
  const byB = new Map(); for (const v of all) { const k = v.boss + '|' + v.diffId; if (!byB.has(k)) byB.set(k, []); byB.get(k).push(v); }
  const gone = new Set();
  for (const list of byB.values()) { list.sort((a, b) => a.at - b.at); let keep = list[0];
    for (let i = 1; i < list.length; i++) { const b = list[i]; if (b.at - keep.at >= 15000) { keep = b; continue; }
      const drop = score(b) > score(keep) ? keep : b, kept = drop === keep ? b : keep; gone.add(drop.k); await HIST.del(drop.k);
      // (the kept copy keeps the report link, and the teams either copy came in with)
      const ug = [...new Set(pullGroups(kept).concat(pullGroups(drop)))], more = ug.length > pullGroups(kept).length;
      if (more) kept.groups = ug;
      if ((!kept.wcl && drop.wcl) || more) { if (!kept.wcl && drop.wcl) kept.wcl = drop.wcl; await HIST.put(kept); }
      keep = kept; } }
  const byN = new Map(); for (const v of all) { if (gone.has(v.k)) continue; const k = nightOf(v.at) + '|' + v.boss + '|' + v.diffId; if (!byN.has(k)) byN.set(k, []); byN.get(k).push(v); }
  for (const list of byN.values()) { if (!list.some((v) => v.team)) continue; list.sort((a, b) => a.at - b.at); for (let i = 0; i < list.length; i++) if (list[i].pull !== i + 1) { list[i].pull = i + 1; await HIST.put(list[i]); } }
  return gone.size;
}
// Summary: this boss night by night (the saved earlier nights, then tonight from the log)
function acrossNights(b0, pulls) {
  const H = histFor(b0); if (!H.earlier.length) return '';
  const kill = pulls.find((b) => b.kill), known = pulls.filter((b) => pullPct(b) != null), bestP = kill || (known.length ? known.reduce((m, b) => (pullPct(b) < pullPct(m) ? b : m)) : null);
  const rows = H.earlier.map((x) => ({ label: x.label, n: x.list.length, res: x.kill ? 'Killed on pull ' + x.kill.pull : x.best ? x.best.label : '—', left: x.kill ? 0 : x.best ? x.best.left : null, kill: !!x.kill, time: x.time }))
    .concat([{ label: 'Tonight', n: pulls.length, res: kill ? 'Killed on pull ' + kill.pull : bestP ? pullLabel(bestP) : '—', left: kill ? 0 : bestP ? pullPct(bestP) : null, kill: !!kill, time: pulls.reduce((s, b) => s + (b.duration || 0), 0), now: true }]);
  const allN = rows.reduce((s, x) => s + x.n, 0), allT = rows.reduce((s, x) => s + x.time, 0);
  return '<div class="db"><div class="db-h">Progress across nights <span class="sub">' + plural(allN, 'pull') + ' over ' + plural(rows.length, 'night') + ' · ' + T(allT) + ' on the boss · from the pulls saved on this PC</span></div>' +
    '<div class="scroll"><table class="tbl xn"><thead><tr><th>Night</th><th class="tc">Pulls</th><th>Best</th><th class="xn-bar">How far</th><th class="tc">Time on boss</th></tr></thead><tbody>' +
    rows.map((x) => '<tr' + (x.now ? ' class="xn-now"' : '') + '><td><b>' + esc(x.label) + '</b></td><td class="tc">' + x.n + '</td><td>' + (x.kill ? '<span class="okv">✓ ' + esc(x.res) + '</span>' : esc(x.res)) + '</td><td class="xn-bar">' + progBar(b0, x.left, null, x.kill ? '#ff8000' : x.left != null ? (PULL_Q.find(([lo]) => 100 - x.left >= lo) || [0, '#9d9d9d'])[1] : null) + '</td><td class="tc">' + T(x.time) + '</td></tr>').join('') + '</tbody></table></div></div>';
}
// "Is this your raid?": asked above the banner for a log that isn't known yet (the first one, or one that's mostly other
// players); the menu's Saved progress opens the same bar to change it, forget the team or clear the saved pulls
function meBar(r) {
  if (!r || !r.item || r.item.kind !== 'boss') return '';
  const st = raidMine(r), tm = team(), n = HIST.mem.size;
  if (S.meOpen) return '<div class="panel mebar"><span class="mb-t"><b>Saved progress</b> <span class="sub">' + plural(n, 'pull') + ' saved on this PC · your team: ' + plural(tm.length, 'player') + ' · this log: ' + (st ? 'saved as your raid' : 'not saved') + '</span></span>' +
    (st ? '<button class="btn" id="meNo">Not my raid</button>' : '<button class="btn primary" id="meYes">Save as my raid</button>') + '<button class="btn" id="meForget"' + (tm.length ? '' : ' disabled') + '>Forget my team</button><button class="btn" id="meClear"' + (n ? '' : ' disabled') + '>Clear saved pulls</button><button class="btn" id="meDone">Done</button></div>';
  if (st !== null || sessionStorage.getItem('wla-me-later:' + srcKey())) return '';
  const first = !tm.length;
  return '<div class="panel mebar"><span class="mb-t"><b>Is this your raid?</b> <span class="sub">' + (first ? 'Say yes and its pulls are saved on this PC, so the next night on a boss picks up where this one left off. Later logs with mostly the same players are saved on their own, even when someone sits.' : 'Most of these players aren\'t on your team, so nothing from this log is saved to your progress unless you say so.') + '</span></span>' +
    '<button class="btn primary" id="meYes">Yes, save it</button><button class="btn" id="meNo">No</button><button class="btn" id="meLater">Ask later</button></div>';
}
function meSaved() { for (const rep of CACHE.values()) histSave(rep); renderMain(); }
document.addEventListener('click', (e) => {
  const t = e.target.closest('#meYes, #meNo, #meLater, #meDone, #meClear, #meForget'); if (!t) return;
  const k = srcKey();
  if (t.id === 'meYes') { if (k) { listAdd(ALLOW_KEY, [k]); listDel(DENY_KEY, k); } if (S.rep) listAdd(TEAM_KEY, rosterOf(S.realRep || S.rep)); meSaved(); }
  else if (t.id === 'meNo') { if (k) { listAdd(DENY_KEY, [k]); listDel(ALLOW_KEY, k); } renderMain(); }
  else if (t.id === 'meLater') { try { sessionStorage.setItem('wla-me-later:' + k, '1'); } catch (x) { /* ignore */ } renderMain(); }
  else if (t.id === 'meDone') { S.meOpen = false; renderMain(); }
  else if (t.id === 'meForget') { if (confirm('Forget your team? The saved pulls stay; the next log asks again whether it\'s your raid.')) { store.set(TEAM_KEY, '[]'); renderMain(); } }
  else if (t.id === 'meClear') { if (confirm('Clear every saved pull on this PC? The log that\'s open stays; earlier nights are gone.')) HIST.clear().then(() => { for (const rep of CACHE.values()) histSave(rep); renderMain(); }); }
});

// (a pull asked for twice at once, e.g. by the background reader and a click, is only read once)
const INFLIGHT = new Map();
function getRep(item) {
  if (CACHE.has(item)) return Promise.resolve(CACHE.get(item));
  if (!INFLIGHT.has(item)) INFLIGHT.set(item, readRep(item).finally(() => INFLIGHT.delete(item)));
  return INFLIGHT.get(item);
}
async function readRep(item) {
  if (CACHE.has(item)) return CACHE.get(item);
  let text;
  if (item.wcl) {
    const st = () => document.getElementById('loadmsg');
    const events = await WCL.loadEvents(S.wclCreds, item, (n) => { if (S.item === item && st()) st().textContent = 'Downloading ' + item.boss + ' pull ' + item.pull + ' from Warcraft Logs: ' + n.toLocaleString('en-US') + ' events…'; });
    text = WCL.translate(item, events);
  } else text = FH.dir ? await fhText(item.startByte, item.endByte) : await S.file.slice(item.startByte, item.endByte).text();
  const rep = E.analyze(item, text, { packs: S.packs, overrides: overrides() });
  // Raid audit: each player's gear (with enchants) and buffs at the pull, straight from Warcraft Logs
  if (item.wcl) {
    const evs = await WCL.loadEvents(S.wclCreds, item);
    // every spell in the report (not just this pull), so mechanics that didn't happen this pull still get game icons and tooltips
    for (const a of item.wcl.abilities.values()) { const k = String(a.name || '').toLowerCase(); if (k && a.gameID > 1 && !E.SPELLID.has(k)) E.SPELLID.set(k, a.gameID); }
    rep.combatants = evs.filter((e) => e.type === 'combatantinfo').map((e) => ({ name: (item.wcl.actors.get(e.sourceID) || {}).name, gear: e.gear || [], auras: e.auras || [], self: e.sourceID,
      // stats as ratings, when the pull started (WCL gives melee/ranged/spell versions of crit and haste; the highest is the one that counts)
      stats: { strength: e.strength, agility: e.agility, intellect: e.intellect, stamina: e.stamina, crit: Math.max(e.critMelee || 0, e.critRanged || 0, e.critSpell || 0), haste: Math.max(e.hasteMelee || 0, e.hasteRanged || 0, e.hasteSpell || 0),
        mastery: e.mastery, versatility: e.versatilityDamageDone, leech: e.leech, avoidance: e.avoidance, speed: e.speed, armor: e.armor } }));
  }
  // own combat logs: gear, stats and buffs come from each player's COMBATANT_INFO line (names and icons are looked up
  // when the Raid audit opens)
  if (!item.wcl && rep.combatantsRaw && rep.combatantsRaw.length) rep.combatants = rep.combatantsRaw.filter((c) => rep.players.has(c.guid)).map((c) => ({ name: rep.players.get(c.guid).name, gear: c.gear, auras: c.auras, self: c.guid, stats: c.stats }));
  applyNote(rep);
  CACHE.set(item, rep);
  histSave(rep);
  return rep;
}
async function select(item) {
  S.miss = 0; syncUrl(item);
  S.item = item; S.mPlayer = null; S.pPlayer = null; S.death = 0;
  document.querySelectorAll('.pull').forEach((b) => b.classList.toggle('sel', ITEMS[+b.dataset.i] === item));
  $('#main').innerHTML = '<div class="empty"><p class="muted" id="loadmsg">Analyzing ' + esc(item.boss) + '…</p></div>';
  let rep;
  try { rep = await getRep(item); }
  catch (err) {
    if (S.item !== item) return;
    $('#main').innerHTML = '<div class="empty"><p class="muted">Couldn\'t analyze this pull: ' + esc(err.message) + '</p><button class="btn primary" id="pullRetry" type="button">Try again</button></div>'; console.error(err);
    $('#pullRetry').onclick = () => select(item); return;
  }
  if (S.item !== item) return;
  try { S.rep = rep; }
  catch (err) { $('#main').innerHTML = '<div class="empty"><p class="muted">Couldn\'t analyze this pull: ' + esc(err.message) + '</p></div>'; console.error(err); return; }
  renderMain();
  // pre-load the next pull's download in the background so it's ready when clicked
  if (item.wcl && S.index) {
    const next = S.index.bosses[S.index.bosses.indexOf(item) + 1];
    if (next && next.wcl && !CACHE.has(next)) WCL.loadEvents(S.wclCreds, next).catch(() => {});
  }
}

// ---------- main frame ----------
// Tabs: Latest pull (the live recap, always one pull), Assignments (the NSRT audit), Mechanics (the fight audit),
// Summary (the night, always all pulls) and Player audit (gear, consumables and survival kit). Damage, Healing and
// Damage taken are hidden for now (to be redone); meter() stays for that.
const TABS = [['overview', 'Assignments'], ['audit', 'Mechanics'], ['perf', 'Performance'], ['night', 'Summary'], ['player', 'Player audit']];
// One pull or all pulls (S.scope): Summary is the all-pulls page (every pull's mechanics and assignments, with their
// report cards); Latest pull, Assignments and Mechanics are always one pull; the Player audit has both, switched on its
// own page. The pull cards pick it: a pull, or All pulls (which opens Summary, or the Player audit's all-pulls view).
const OLD_ALL = { nightaudit: 1, nightassign: 1 }; // (the old all-pulls Mechanics and Assignments, e.g. in a saved resume: Summary has them now)
function setScope(sc) {
  S.scope = sc;
  if (sc === 'all') { if (S.tab !== 'player' && S.tab !== 'perf') S.tab = 'night'; }
  else if (S.tab === 'night' || OLD_ALL[S.tab]) S.tab = 'audit';
}
// the header's result for all pulls: the kill, or the best pull so far
function nightResult(it) {
  const pulls = S.index && S.index.bosses ? S.index.bosses.filter((b) => b.id === it.id && b.diffId === it.diffId) : [];
  const k = pulls.find((b) => b.kill); if (k) return { cls: 'good', txt: 'Killed on pull ' + k.pull, big: 'Killed on pull ' + k.pull, left: 0, pull: k.pull };
  let best = null; for (const b of pulls) { const v = pullPct(b); if (v != null && (!best || v < best.v)) best = { b, v }; }
  return { cls: 'best', txt: best ? 'Best: ' + pullLabel(best.b) + ' (pull ' + best.b.pull + ')' : 'No kill yet', big: best ? 'Best: ' + pullLabel(best.b) : 'No kill yet', left: best ? best.v : null, pull: best ? best.b.pull : null };
}
// the tabs' icons (drawn here, no game art)
const TAB_IC = { teams: 'trophy', live: 'clock', overview: 'list', audit: 'target', perf: 'bars', night: 'chart', player: 'users' };
// what each tab is, shown when hovering it
const TAB_TIP = {
  teams: 'Your teams and your character: every boss and night of the tier, with your rankings.',
  live: 'The pull that just ended, at a glance: what went wrong and what to fix before the next pull. Follows live logging.',
  overview: 'Your NSRT note against this pull: soaks, externals, orbs, kicks, mind control CC, curses and healing cooldowns, and who missed theirs.',
  audit: 'Every boss mechanic in this pull, phase by phase: what went wrong, who was involved, with maps. Deaths and survival too.',
  perf: 'Damage, healing and damage taken in this pull, player by player and over time, with the phases, boss mechanics, Bloodlust and deaths marked. Plus utility: interrupts, dispels, battle resses and externals.',
  night: 'Every pull of this boss together: report cards, how far you got, what to fix before next raid, and each mechanic and assignment pull by pull.',
  player: 'Each player\'s gear, flask, food and survival kit (defensives, Healthstones, potions), for this pull or all pulls.',
};
const TICO = { clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', list: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 3.5h6v3H9zM8.5 12.5l2 2 4.5-4.5"/>',
  target: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>', chart: '<path d="M4 19.5h16"/><path d="M5.5 15.5 10 10l3.5 3 5-7"/>',
  bars: '<path d="M4 20h16"/><path d="M6.5 17v-5M11 17V7M15.5 17v-8M20 17v-3"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  users: '<circle cx="9" cy="8" r="3.3"/><path d="M3 19.5c0-3.4 2.7-5.8 6-5.8s6 2.4 6 5.8"/><path d="M15.5 4.8a3.3 3.3 0 0 1 0 6.4M17.5 14c2.1.7 3.5 2.8 3.5 5.5"/>' };
const tabIco = (k) => '<svg class="tab-ic" viewBox="0 0 24 24" aria-hidden="true">' + (TICO[TAB_IC[k]] || '') + '</svg>';
// ---- the boss banner on top of every tab ----
// One pull: which pull and boss, the result in big letters, when and how long, and on the right how it compares
// (best of the night, further than the last pull) with a bar of the phases. All pulls: the night's best pull (or the
// kill) instead. The boss's model renders sit behind the right side: Wowhead's, loaded at runtime from its image server
// (never bundled), by display ID (from each boss's Wowhead NPC page). A boss without an entry gets the built-in emblem.
// (The Coiled Altar: Hex Lord Malacrass first, npc 259854; Zul'jan's, npc 257911, is a small figure in its frame)
// (each boss's model, as Wowhead's thumbnail renders it, loaded at runtime; a council or a pair uses one of its bosses:
// Blood of Ula'tek for the Entombed Sentinels, Scrollsage Iku for the Lost Explorers, Ithraz for the Twin Fangs)
const BOSS_ART = { 'The Coiled Altar': [142140, 142472], "Nek'zali the Soulcoiler": [142077, 137923], "Ula'tek": [140369], 'Entombed Sentinels': [143436], 'Vashnik the Malignant': [141675],
  'The Lost Explorers': [144892], Sszorak: [142788], 'The Twin Fangs': [141309], 'Nymrissa Wavecaller': [137687], "Kith'ix": [145351] };
// (the renders are framed by the model, so small ones get a zoom on the Progress cards to fill about the same space)
const ART_ZOOM = { "Nek'zali the Soulcoiler": 1.2, 'The Lost Explorers': 1.55, 'Vashnik the Malignant': 1.1 };
const artUrl = (d) => 'https://wow.zamimg.com/modelviewer/live/webthumbs/npc/' + (d & 255) + '/' + d + '.webp';
function bossArt(name) {
  const ds = BOSS_ART[name];
  if (!ds) return '<div class="bart none" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M32 3 56 12v18c0 15-11 26-24 31C19 56 8 45 8 30V12Z"/><path d="M22 18h10c9 0 14 6 14 14s-5 14-14 14H22Z"/></svg></div>';
  // (one boss at a time: the first one listed; renders are framed by the model, and some, like Malacrass, come out tiny)
  return '<div class="bart" aria-hidden="true"><img src="' + artUrl(ds[0]) + '" alt="" onerror="this.remove()"></div>';
}
// how far a pull got, as a bar: boss health, or on multi-phase fights one segment per phase (P1, P2, Int, P3), each as
// wide as its share of the encounter's health (a phase with none, like the Coiled Altar intermission, a narrow step).
// (Ula'tek's phases are on a timer, not her health, so hers is one bar: her health.)
// (col: the fill in a pull colour, as in the Summary's nights table)
function progBar(it, left, phase, col) {
  if (left == null) return '';
  const cfg = PROGRESS[it.boss], done = Math.max(0, Math.min(100, 100 - left)), st = col ? ' style="--pb:' + col + '"' : '';
  if (!cfg || cfg.pool) return '<div class="phb one"' + st + '><span><i style="width:' + done.toFixed(1) + '%"></i></span></div>';
  let acc = 0;
  return '<div class="phb"' + st + '>' + cfg.phases.map((p) => {
    const w = 100 * phShare(cfg, p), lo = acc; acc += w;
    const f = w > 0 ? Math.max(0, Math.min(1, (done - lo) / w)) : done > lo + 0.01 || phase === p ? 1 : 0;
    return '<span title="' + esc(p) + '" style="flex:' + (w > 0 ? w.toFixed(1) + ' 1 0' : '0 0 26px') + '"><i style="width:' + Math.round(100 * f) + '%"></i><em>' + esc(p.replace('Intermission', 'Int')) + '</em></span>'; }).join('') + '</div>';
}
// which pull the tab is showing, on the right of the sticky tab bar (it stays in view while scrolling; a click goes back up)
// The pinned bar's left end, shown once the banner has scrolled away (body.bh-off): the boss, the pull (with ‹ › to the
// earlier and later pull of the boss) and its result, and the menu; clicking the pull goes back to the top. While the
// banner is on screen it's hidden: the banner says the same thing.
function tbPull(r, allMode) {
  const it = r.item, isKey = it.kind === 'run' || !!it.run;
  const same = S.index && S.index.bosses ? S.index.bosses.filter((b) => b.id === it.id && b.diffId === it.diffId) : [], k = same.indexOf(it);
  const nav = (d, lab) => { const to = k >= 0 ? same[k + d] : null; return '<button class="tbp-n" type="button" data-d="' + d + '" aria-label="' + lab + '"' + (to ? '' : ' disabled') + '>' + (d < 0 ? '‹' : '›') + '</button>'; };
  const menu = '<button class="tbp-menu" type="button" aria-label="Open the menu" title="Menu">☰</button>';
  let pill;
  if (allMode) pill = '<button class="tb-pull all" type="button" title="Back to the top"><b>' + esc(it.boss) + '</b><span>All pulls · ' + plural(same.length, 'pull') + '</span></button>';
  else if (isKey) pill = '<button class="tb-pull" type="button" title="Back to the top"><i class="tbp-d ' + (it.kill || it.result === 'Timed' ? 'ok' : 'bad') + '"></i><b>' + esc(it.boss) + '</b><span>' + esc(it.result || '') + ' · ' + T(r.duration) + '</span></button>';
  else { const pg = progressOf(r);
    pill = '<button class="tb-pull" type="button" title="Back to the top"><i class="tbp-d ' + (it.kill ? 'ok' : 'bad') + '"></i><b>' + esc(it.boss) + '</b><span>Pull ' + it.pull + ' · ' + (it.kill ? 'kill' : 'wipe' + (pg ? (pg.phase ? ' in ' : ' at ') + esc(pg.label) : '')) + '</span></button>'; }
  return '<div class="tb-id">' + (allMode || isKey ? pill : nav(-1, 'Earlier pull') + pill + nav(1, 'Later pull')) + menu + '</div>';
}
// (the pinned bar's left end shows once the banner is off screen)
if (typeof IntersectionObserver !== 'undefined') { const bhObs = new IntersectionObserver((es) => { for (const e of es) document.body.classList.toggle('bh-off', !e.isIntersecting); }); const bh = document.getElementById('bossHead'); if (bh) bhObs.observe(bh); }
const isAllMode = () => !!(S.rep && S.scope === 'all' && S.tab !== 'live' && S.item && S.item.kind !== 'run' && !S.item.run);
// Each boss's banner art: Wowhead's guide header for the fight (the boss rendered over the raid's backdrop, 2992x1144),
// loaded at runtime from its image server, never bundled; [image, where the boss sits across it in %, for the crop].
// A boss without one (or when it doesn't load) gets the model render instead (bossArt).
const BOSS_HERO = {
  "Nek'zali the Soulcoiler": ['f2ae26185b3e0558f0a4e650b0c27d30380c9f99', 47], 'The Twin Fangs': ['52e498e3108b56f88a49f5fe5afa33eb6578a713', 53],
  'Entombed Sentinels': ['efcce5e7e8f3b1804d19121260df8411338144ce', 50], 'Vashnik the Malignant': ['f9f43b4f5abb79d2c6cf8e0d885b95ac59fbd3b0', 50],
  'The Lost Explorers': ['19bd46c0a77441577821e056dbd5cc5c09ae87b5', 45], Sszorak: ['127fb15e24c99767521d3697f97ef6e98181357e', 53],
  'The Coiled Altar': ['0b550745443dcd767f6cb4e4f8e23e14089dcd88', 46], "Ula'tek": ['20ff0eaaeb6117c9a8fcbb76792789b3e01341ce', 50],
  // (Kith'ix's header is his arena, without him in it)
  'Nymrissa Wavecaller': ['78505cd339948ac9ade920ec21aa8b2ba5bc3b0a', 50], "Kith'ix": ['f609edbeae0d26a609c3693e0814fba37de7df59', 50] };
// the banner's small icons (drawn here, no game art)
const BH_IC = { clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5M9.5 2.5h5M18.5 6.5l1.5-1.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>',
  skull: '<path d="M12 3c-4.4 0-8 3.2-8 7.5 0 2.6 1.3 4.5 3 5.6V19h10v-2.9c1.7-1.1 3-3 3-5.6C20 6.2 16.4 3 12 3Z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/>',
  pulls: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>' };
const bhIc = (k) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + BH_IC[k] + '</svg>';
// The team a pull is from (one of yours: at least half its players are on it), with how many of the tier's bosses that team
// has killed on the pull's difficulty: the banner's link to the team's Progress. Kept on the pull until more is saved.
function pullTeam(r, it) {
  if (!r || !r.players || !it || it.kind !== 'boss') return null;
  if (r._team && r._team.n === HIST.mem.size && r._team.d === it.diffId) return r._team.v;
  const v = { players: [...r.players.values()].map((p) => p.name).filter(Boolean) }, g = groups().find((x) => x.kind !== 'char' && groupFilter(x)(v)) || null;
  let out = null;
  if (g) { const order = E.PACKS.map((p) => p.encounter), inG = groupFilter(g), mine = [...HIST.mem.values()].filter((x) => x.diffId === it.diffId && x.kill && inG(x));
    out = { gid: g.gid, name: gName(g), k: order.filter((b) => mine.some((x) => x.boss === b)).length, of: order.length, diff: it.diff }; }
  r._team = { n: HIST.mem.size, d: it.diffId, v: out }; return out;
}
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-team]'); if (b) { e.preventDefault(); progressPage(undefined, b.dataset.team); window.scrollTo(0, 0); } });
function headerHtml(r, allMode) {
  const it = S.item, same = S.index && S.index.bosses ? S.index.bosses.filter((b) => b.id === it.id && b.diffId === it.diffId) : [], isKey = it.kind === 'run';
  let cls, kick, big, stats, side = '', left = null;
  // earlier nights on this boss, from the pulls saved on this PC
  const H = isKey ? { earlier: [] } : histFor(it), everBest = H.best ? H.best.left : null;
  // (the raid, when the boss is one of this tier's: "Pull 10 · Mythic · The Venomous Abyss"; the lair and Kith'ix name their own)
  const pk = E.PACKS.find((p) => p.encounter === it.boss), raid = pk ? pk.raid || 'The Venomous Abyss' : '';
  if (allMode) {
    const nr = nightResult(it), time = same.reduce((s, b) => s + (b.duration || 0), 0);
    cls = nr.cls; left = nr.left; kick = ['All pulls', it.diff, raid]; big = nr.big + (nr.cls !== 'good' && nr.pull ? ' (pull ' + nr.pull + ')' : '');
    stats = [['pulls', plural(same.length, 'pull')], ['timer', T(time) + ' on the boss']].concat(H.earlier.length ? [['moon', 'night ' + (H.earlier.length + 1) + ' on this boss']] : []);
    if (H.earlier.length) side += nr.cls !== 'good' && nr.left != null && everBest != null && nr.left < everBest ? '<span class="nc-res ok">✓ Further than any night before</span>'
      : '<span class="sub">Before tonight: ' + (H.kill ? 'killed on ' + esc(H.kill.label) : H.best ? 'best ' + esc(H.best.label) : 'no result') + ' · ' + plural(H.pulls, 'pull') + ' over ' + plural(H.earlier.length, 'night') + '</span>';
  } else if (isKey) {
    cls = it.result === 'Timed' ? 'good' : 'bad'; kick = ['Mythic+ +' + it.level]; big = it.result; stats = [['timer', T(it.duration)]];
  } else {
    // this pull against the last one and the best before it (local logs know a pull's progress once it's read)
    const k = same.indexOf(it), prevItem = k > 0 ? same[k - 1] : null, pg = progressOf(r), now = it.kill ? 0 : pg ? pg.left : null;
    const was = prevItem ? pullPct(prevItem) : null, earlier = same.slice(0, Math.max(0, k)).map((x) => ({ x, v: pullPct(x) })).filter((o) => o.v != null);
    const bestO = earlier.length ? earlier.reduce((m, o) => (o.v < m.v ? o : m)) : null, usesPh = !!PROGRESS[it.boss], delta = now != null && was != null ? was - now : null;
    const ds = keptDeaths(r).length;
    cls = it.kill ? 'good' : 'bad'; left = now; kick = [it.run ? '' : 'Pull ' + it.pull, it.diff, raid];
    big = it.kill ? 'Kill' : now != null ? (usesPh ? 'Wipe in ' : 'Wipe at ') + (pg ? pg.label : now.toFixed(1) + '%') : 'Wipe';
    stats = [['clock', it.wallMs ? wallClock(it.wallMs) : clock(it.startMs)], ['timer', T(r.duration)], ['users', plural(r.players.size, 'player')], ['skull', plural(ds, 'death') + (cutInfo(r) ? ' before the wipe filter' : '')]];
    const yet = !it.kill && now != null && everBest != null && now < everBest && (!bestO || now < bestO.v); // (further than every saved night too)
    // (a kill says how long it took tonight; "Boss down" only repeated the pill)
    const wipes = same.slice(0, Math.max(0, k)).filter((x) => !x.kill).length;
    side = (it.kill ? '<span class="nc-res ok">' + (wipes ? '✓ Down after ' + plural(wipes, 'wipe') + ' tonight' : k > 0 ? '✓ Down again' : '✓ Down on the first pull') + '</span>' : yet ? '<span class="nc-res ok">✓ Best pull yet</span>' : bestO && now != null && now < bestO.v ? '<span class="nc-res ok">✓ Best pull tonight</span>' : bestO ? '<span class="sub">Best tonight: ' + esc(pullLabel(bestO.x)) + '</span>' : '') +
      (delta != null && !it.kill ? '<span class="' + (delta > 0 ? 'okv' : delta < 0 ? 'hotv' : 'sub') + '">' + (usesPh ? (delta > 0 ? '▲ further than last pull (' : delta < 0 ? '▼ not as far as last pull (' : 'same as last pull (') + esc(pullLabel(prevItem)) + ')' : delta > 0 ? '▲ ' + delta.toFixed(1) + '% further than last pull' : delta < 0 ? '▼ ' + (-delta).toFixed(1) + '% short of last pull' : 'same as last pull') + '</span>'
        : !prevItem && !it.run && !it.kill ? '<span class="sub">First pull on this boss tonight</span>' : '');
  }
  // (a log you said isn't your raid: one quiet line, with the way back)
  if (!isKey && raidMine(S.realRep && S.rep === S.nightRep ? S.realRep : S.rep) === false) side += '<span class="sub">Not saved to your progress · <button class="lnk" id="meYes" type="button">Save it</button></span>';
  // the art on the right (fading into the panel), or the model render when there's none or it doesn't load
  const hero = !isKey && BOSS_HERO[it.boss];
  const art = (hero ? '<div class="bh-hero" aria-hidden="true"><img src="https://wow.zamimg.com/uploads/guide/header/' + hero[0] + '.jpg" alt="" style="--hx:' + Math.max(0, 50 - hero[1]) + '%" onerror="var h=this.closest(\'.fight\');if(h)h.classList.remove(\'hero\');this.parentNode.remove()"></div>' : '') + bossArt(isKey ? '' : it.boss);
  const pill = (cls === 'good' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17 19 7"/></svg>' : '') + esc(big);
  // (the edge, tint, pill and bar in the pull's colour by how far it got, as on the pull cards and the Progress chart:
  // grey, white, green, blue, purple, and orange for a kill)
  const qcol = isKey ? null : cls === 'good' ? '#ff8000' : left != null ? (PULL_Q.find(([lo]) => 100 - left >= lo) || [0, '#9d9d9d'])[1] : null;
  // (two lines, the same height on every tab: the boss, its result and the phase bar; then the pull, difficulty and raid,
  // how it compares, and when, how long, who and deaths)
  // (the team this raid is, linking to its Progress: "Wolfthorn · 7/10 Mythic ›")
  const tm = !isKey ? pullTeam(r || S.rep, it) : null, tmL = tm ? '<button class="bh-team" type="button" data-team="' + esc(tm.gid) + '" title="' + esc(tm.name) + '\'s progress, every boss and night">' + esc(tm.name) + ' · ' + tm.k + '/' + tm.of + ' ' + esc(tm.diff || '') + ' ›</button>' : '';
  return '<header class="fight bh ' + cls + (hero ? ' hero' : '') + (qcol ? ' q" style="--qc:' + qcol : '') + '">' + art + '<div class="bh-t">' +
    '<div class="bh-l1"><h2 class="bh-name">' + esc(it.boss) + '</h2><span class="bh-big">' + pill + '</span>' + progBar(it, left, !allMode && !isKey && r ? (progressOf(r) || {}).phase : null, qcol) + tmL + '</div>' +
    '<div class="bh-l2"><span class="bh-k">' + kick.filter(Boolean).map(esc).join('<i>·</i>') + '</span>' + (side ? '<span class="bh-side">' + side + '</span>' : '') +
    '<span class="bh-s">' + stats.map(([ic, t]) => '<span>' + bhIc(ic) + esc(t) + '</span>').join('') + '</span></div></div></header>';
}
// redraw the banner once more pulls are known (the background reader, or an all-pulls view that read every pull)
function refreshHead() { const f = $('.fight.bh'); if (!f || !S.rep || !S.item) return; const a = isAllMode(); if (!a && S.rep === S.nightRep) return; f.outerHTML = headerHtml(a ? null : S.rep, a); }
const setHeadRes = refreshHead;
// (the top bar's Progress button is lit while the Progress page is up)
const progLit = (on) => { const b = $('#tbProgBtn'); if (b) b.classList.toggle('on', on); };
function renderMain() {
  progLit(false);
  // (opened from a shared pull link on a first visit: the pull first, then the tour)
  if (S.tourAfterPull) { S.tourAfterPull = false; setTimeout(() => { if (!tourDone()) startTour(0); }, 1500); }
  // (a tab's tips the first time it's opened; they wait for it to fill in)
  setTimeout(() => pageTips(tipsPage()), 0);
  if (S.nightRep && S.rep === S.nightRep) S.rep = S.realRep; // (leave the all-pulls report: back to the real pull)
  const r = S.rep, it = r.item, single = it.kind === 'run' || !!it.run;
  if (S.tab === 'kicks' || S.tab === 'mistakes' || S.tab === 'deaths' || S.tab === 'surv') S.tab = 'audit'; // (old tabs, e.g. from a saved resume)
  if (S.tab === 'raid') S.tab = 'player'; // (the Raid audit is part of the Player audit now)
  if (OLD_ALL[S.tab]) S.tab = 'night';
  if (!VIEWS[S.tab]) S.tab = 'overview';
  // Summary is all pulls; Latest pull, Assignments and Mechanics are one pull; the Player audit keeps its own switch.
  // (a Mythic+ key has no all-pulls view)
  if (S.tab === 'night') S.scope = 'all'; else if (S.tab !== 'player' && S.tab !== 'perf') S.scope = 'pull';
  if (single) S.scope = 'pull';
  const allMode = S.scope === 'all' && !single && S.tab !== 'live';
  const serious = allMode ? 0 : keptMistakes(r).filter((m) => m.severity === 'High' && m.mechanic !== 'Death').length;
  // (the banner sits above the pull cards, outside #main; the tabs and the tab's view are in #main)
  $('#bossHead').innerHTML = headerHtml(r, allMode) + meBar(r); // (and, when this log isn't known yet, "Is this your raid?")
  $('#main').innerHTML =
    // Teams first (your teams' progress, every boss and night), then the Latest pull recap (with a red dot while live
    // logging is on) and the rest
    '<div class="tabbar"><nav class="tabs" role="tablist">' + [['teams', 'Teams'], ['live', 'Latest pull']].concat(TABS).map(([k, l]) => '<button class="tab' + (S.tab === k ? ' on' : '') + (k === 'live' && LIVE.on ? ' tab-live' : '') + '" data-t="' + k + '" role="tab" data-tt="' + esc(TAB_TIP[k] || '') + '" aria-description="' + esc(TAB_TIP[k] || '') + '">' + (k === 'live' && LIVE.on ? '<span class="tl-live"></span>' : tabIco(k)) + l +
      (k === 'audit' && serious ? '<span class="cnt">' + serious + '</span>' : '') + '</button>').join('') + '</nav>' + tbPull(r, allMode) + '</div>' +
    '<section id="view"></section>';
  $('#main').querySelectorAll('.tab').forEach((b) => (b.onclick = () => { if (b.dataset.t === 'teams') { progressPage(); window.scrollTo(0, 0); return; } S.tab = b.dataset.t; renderMain(); }));
  { const tp = $('#main .tb-pull'); if (tp) tp.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' }); }
  // (the pinned bar's ‹ › open the boss's earlier or later pull on the same tab; ☰ goes up to the menu and opens it)
  $('#main').querySelectorAll('.tbp-n').forEach((b) => (b.onclick = () => { const same = S.index.bosses.filter((x) => x.id === it.id && x.diffId === it.diffId), to = same[same.indexOf(it) + +b.dataset.d]; if (to) select(to); }));
  { const m = $('#main .tbp-menu'); if (m) m.onclick = () => { window.scrollTo({ top: 0 }); const t = $('#tbMenu'); if (t) t.click(); }; }
  renderList(); // (the pull strip follows the pull and the scope on screen; the wipe filter sits at its right end)
  VIEWS[S.tab]();
  // (opened from a Summary row: open that mechanic's or assignment's row on this pull and bring it into view)
  if (S.pendingSec) { const el = document.querySelector('#view [id^="' + CSS.escape(S.pendingSec) + '"]'); S.pendingSec = null;
    if (el) { if (el.tagName === 'DETAILS') { el.open = true; if (el.dataset.k) S.openSecs.add(el.dataset.k); } for (let e = el.parentElement; e; e = e.parentElement) if (e.tagName === 'DETAILS') e.open = true; window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70 }); } }
  refreshIcons();
}
const view = (h) => { $('#view').innerHTML = h; };
const players = () => [...S.rep.players.values()];

// ---------- overview ----------
function overview() {
  // NSRT audit: only the note's assignments versus what happened in this pull (the old overview tiles, "What
  // happened" and the progression chart were taken off this tab)
  const r = S.rep;
  if (r.item.kind !== 'boss') { view('<div class="panel"><p class="muted" style="margin:0">Assignments are for raid bosses: they compare a Northern Sky Raid Tools note with what happened in the pull.</p></div>'); return; }
  view('<div id="assignBox" class="assignbox"></div>');
  assign();
}function tile(l, v, s) { return '<div class="tile"><div class="l">' + l + '</div><div class="v">' + v + '</div><div class="s">' + esc(s) + '</div></div>'; }

function smooth(a, n) {
  const o = new Array(n).fill(0);
  for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let j = i - 2; j <= i + 2; j++) if (j >= 0 && j < n) { s += a[j] || 0; c++; } o[i] = s / c; }
  return o;
}
function drawChart() {
  const cv = $('#cv'); if (!cv) return;
  const r = S.rep, dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const n = Math.max(2, Math.ceil(r.duration) + 1), pad = 8, bottom = H - 22;
  const X = (s) => pad + s / r.duration * (W - pad * 2), Y = (f) => bottom - f * (bottom - 12);
  const series = [[smooth(r.dmgS, n), '#e8a23a'], [smooth(r.healS, n), '#45c15c'], [smooth(r.takenS, n), '#e5534b']];
  g.strokeStyle = '#2a2f3b'; g.lineWidth = 1;
  for (let k = 0; k <= 3; k++) { g.beginPath(); g.moveTo(pad, Y(k / 3)); g.lineTo(W - pad, Y(k / 3)); g.stroke(); }
  g.fillStyle = '#6c7381'; g.font = '12px Barlow, sans-serif';
  const step = r.duration > 900 ? 300 : r.duration > 360 ? 60 : 30;
  for (let s = 0; s <= r.duration; s += step) g.fillText(T(s), Math.min(X(s), W - 34), H - 5);
  for (const [a, col] of series) {
    const mx = Math.max(...a) || 1;
    g.strokeStyle = col; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath();
    a.forEach((v, i) => (i ? g.lineTo(X(i), Y(v / mx)) : g.moveTo(X(i), Y(v / mx)))); g.stroke();
  }
  let bossLine = null;
  if (r.bossS.length) {
    bossLine = []; let last = 100;
    for (let i = 0; i < n; i++) { if (i < r.bossS.length && !isNaN(r.bossS[i])) last = r.bossS[i]; bossLine.push(last); }
    g.strokeStyle = '#6aa8ff'; g.setLineDash([5, 4]); g.beginPath();
    bossLine.forEach((v, i) => (i ? g.lineTo(X(i), Y(v / 100)) : g.moveTo(X(i), Y(v / 100)))); g.stroke(); g.setLineDash([]);
  }
  g.strokeStyle = '#ff8f87'; g.lineWidth = 1.5;
  for (const d of r.deaths) { g.beginPath(); g.moveTo(X(d.t), 6); g.lineTo(X(d.t), bottom); g.stroke(); g.fillStyle = '#ff8f87'; g.beginPath(); g.arc(X(d.t), 6, 3, 0, 7); g.fill(); }
  const tip = $('#tip');
  cv.onmousemove = (e) => {
    const x = e.offsetX, s = Math.max(0, Math.min(n - 1, Math.round((x - pad) / (W - pad * 2) * r.duration)));
    const near = r.deaths.filter((d) => Math.abs(d.t - s) <= 3);
    tip.innerHTML = '<b>' + T(s) + '</b><br>DPS ' + C(series[0][0][s]) + '<br>HPS ' + C(series[1][0][s]) + '<br>Taken ' + C(series[2][0][s]) + '/s' +
      (bossLine ? '<br>Boss ' + bossLine[s].toFixed(1) + '%' : '') + near.map((d) => '<br><span style="color:#ff8f87">' + esc(d.player) + ' died</span>').join('');
    tip.style.display = 'block'; tip.style.left = Math.min(x + 12, W - 150) + 'px'; tip.style.top = '10px';
  };
  cv.onmouseleave = () => (tip.style.display = 'none');
}
window.addEventListener('resize', () => { if (S.tab === 'overview' && S.rep) drawChart(); });

// ---------- mistakes ----------
function sevBadge(m) { return m === 'High' ? 'b-high' : m === 'Medium' ? 'b-med' : 'b-low'; }
// Mistakes by player, shown inside the Fight audit. Deaths have their own tab, so they're left out here.
function mistakesHtml() {
  const r = S.rep;
  const byName = new Map(players().map((p) => [p.name, p]));
  const groups = new Map();
  for (const m of keptMistakes(r)) { if (m.mechanic === 'Death') continue; if (!groups.has(m.player)) groups.set(m.player, []); groups.get(m.player).push(m); }
  let list = [...groups.entries()].map(([name, ms]) => ({ name, ms, p: byName.get(name), serious: ms.filter((m) => m.severity === 'High').length }));
  // Collapsed by default to one line; opening it shows one closed row per player (state kept while you click around).
  const total = list.reduce((s, g) => s + g.ms.length, 0), serious = list.reduce((s, g) => s + g.serious, 0), people = list.filter((g) => g.name !== 'Raid').length;
  list = list.filter((g) => S.role === 'all' || (S.role === 'raid' ? g.name === 'Raid' : g.p && g.p.role === S.role));
  list.sort((a, b) => b.serious - a.serious || b.ms.length - a.ms.length);
  const pills = [['all', 'Everyone'], ['tank', 'Tanks'], ['healer', 'Healers'], ['dps', 'DPS'], ['raid', 'Raid-wide']];
  let h = '<details class="panel" id="sec-players"' + (S.mbpOpen ? ' open' : '') + '><summary style="cursor:pointer"><b>Mistakes by player</b> <span class="muted">' +
    pl2(people, 'player') + ', ' + pl2(total, 'mistake') + (serious ? ', <span class="hotv">' + serious + ' serious</span>' : '') + '</span></summary><div style="margin-top:10px">' +
    (r.hasPack ? '<p class="muted" style="margin-top:0">Checked against the ' + esc(r.item.boss) + ' rules.</p>'
    : '<p class="muted" style="margin-top:0">There are no mechanic rules for ' + esc(r.item.boss) + ' yet, so only interrupts and assignments are checked.</p>') +
    '<div class="filters">' + pills.map(([k, l]) => '<button class="pill' + (S.role === k ? ' on' : '') + '" data-r="' + k + '">' + l + '</button>').join('') + '</div>';
  h += stacksPanel(r);
  if (!list.length) h += '<div class="panel">No mechanic mistakes for this group. Nice.</div>';
  list.forEach((g, i) => {
    const p = g.p || { name: g.name, color: '#e6b450', icon: null, specName: 'Whole raid' };
    const sub = g.name === 'Raid' ? 'Raid-wide failures' : p.specName + (p.deaths ? ', died' : ', survived');
    h += '<details class="card" style="border-left-color:' + p.color + '"><summary>' + who(p, sub) +
      '<span class="badge ' + (g.serious ? 'b-high' : 'b-med') + '">' + (g.serious ? g.serious + ' serious, ' : '') + g.ms.length + ' total</span></summary><div class="body">' +
      g.ms.map((m) => {
        // positional mistakes carry a map of that moment; it opens under the row
        const mi = m.map ? (AUDITMAPS.push(m.map), AUDITMAPS.length - 1) : -1;
        return '<div class="mrow"><div><div>' + spell(m.id, m.mechanic, true) + '<span class="t">' + T(m.t) + '</span>' + (mi >= 0 ? ' <button class="btn mmb" data-sec="mk' + mi + '" data-i="' + mi + '">Map</button>' : '') + '</div><div>' + esc(m.detail) + '</div><div class="fx">' + esc(m.fix) + '</div>' +
          (mi >= 0 ? '<div class="mm" id="mm-mk' + mi + '"></div>' : '') + '</div><div class="sev ' + m.severity + '"></div></div>';
      }).join('') +
      '</div></details>';
  });
  return h + '</div></details>';
}
const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const pl2 = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

// Stack sources as a grid: players down the side, sources across the top. Click a source's type
// tag to change how it counts (saved in this browser); avoidable sources become mistakes.
const KIND = { unavoidable: ['Unavoidable', '#6c7381'], soak: ['Soak', '#6aa8ff'], avoidable: ['Avoidable', '#e5534b'], other: ['Unsorted', '#e8a23a'], unknown: ['No hit found', '#3a3f4d'] };
const KIND_ORDER = ['avoidable', 'other', 'soak', 'unavoidable', 'unknown'];
function overrides() { try { return JSON.parse(store.get('wla-stack-kinds') || '{}'); } catch (e) { return {}; } }
function stacksPanel(r) {
  if (!r.stacks || !r.stacks.length) return '';
  return r.stacks.map((s) => {
    const ps = s.players.filter((x) => S.role === 'all' || x.p.role === S.role);
    if (!ps.length) return '';
    const cols = new Map();
    for (const x of ps) for (const v of x.sources.values()) {
      let c = cols.get(v.src); if (!c) cols.set(v.src, c = { src: v.src, id: v.id, kind: v.kind, total: 0 });
      c.total += v.n;
    }
    const list = [...cols.values()].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || b.total - a.total);
    const cell = (n, kind) => {
      if (!n) return '<td class="sc"></td>';
      const col = KIND[kind][1], a = Math.min(0.85, 0.22 + n * 0.12);
      return '<td class="sc"><span style="background:' + col + Math.round(a * 255).toString(16).padStart(2, '0') + '">' + n + '</span></td>';
    };
    const rows = ps.slice().sort((a, b) => b.max - a.max || b.gains - a.gains).map((x) => {
      const by = new Map([...x.sources.values()].map((v) => [v.src, v.n]));
      const avoid = [...x.sources.values()].filter((v) => v.kind === 'avoidable').reduce((t, v) => t + v.n, 0);
      const danger = s.threshold && x.max > s.threshold;
      return '<tr><td class="pn">' + avatar(x.p, true) + ' <span class="nm" style="color:' + x.p.color + '">' + esc(x.p.name) + '</span></td>' +
        '<td class="r"><span class="pk' + (danger ? ' hot' : '') + '">' + x.max + '</span></td><td class="r' + (avoid ? '" style="color:#ff8f87;font-weight:600' : ' muted') + '">' + (avoid || '–') + '</td>' +
        '<td class="r muted">' + (x.cleared || '–') + '</td>' + list.map((c) => cell(by.get(c.src) || 0, c.kind)).join('') + '</tr>';
    }).join('');
    const head = list.map((c) => '<th class="sh"><div class="shn">' + spell(c.id, c.src) + '</div><button class="kind" data-rule="' + esc(s.name) + '" data-src="' + esc(c.src.toLowerCase()) + '" data-kind="' + c.kind + '" style="--k:' + KIND[c.kind][1] + '" title="Click to change how this source counts">' + KIND[c.kind][0] + ' ▾</button><div class="sub">' + c.total + ' total</div></th>').join('');
    return '<div class="panel"><h3>' + spell(s.id, s.name) + ' stacks <small>where every stack came from' + (s.threshold ? ', red peak means above ' + s.threshold : '') + '</small></h3>' +
      '<div class="scroll"><table class="tbl stk"><thead><tr><th>Player</th><th class="r">Peak</th><th class="r">Avoidable</th><th class="r">Cleared</th>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="muted" style="margin:10px 0 0;font-size:13px">Each stack is credited to the enemy hit that landed on that player at the same moment. Click a type tag (Avoidable, Soak, Unsorted…) to change how that source counts; your choice is saved on this PC and avoidable stacks show up as mistakes.</p></div>';
  }).join('');
}
function bindStackKinds() {
  $('#view').querySelectorAll('button.kind').forEach((b) => (b.onclick = () => {
    const cycle = ['avoidable', 'soak', 'unavoidable', 'other'];
    const next = cycle[(cycle.indexOf(b.dataset.kind) + 1) % cycle.length];
    const ov = overrides(); (ov[b.dataset.rule] = ov[b.dataset.rule] || {})[b.dataset.src] = next;
    store.set('wla-stack-kinds', JSON.stringify(ov));
    CACHE.clear(); select(S.item);
  }));
}

// ---------- NSRT assignments ----------
const noteKey = (boss) => 'wla-note-' + boss;
function applyNote(rep) {
  rep.mistakes = rep.mistakes.filter((m) => !m.fromNote);
  rep.assign = null;
  const text = store.get(noteKey(rep.item.boss));
  if (!text) return;
  try { rep.assign = E.checkAssignments(rep, text); } catch (e) { rep.assign = { error: e.message }; return; }
  for (const m of rep.assign.mistakes) rep.mistakes.push({ ...m, fromNote: true });
  rep.mistakes.sort((a, b) => a.t - b.t);
}
function assign(only) { // (only: just the note, for the all-pulls NSRT audit, which draws its own results)
  const r = S.rep, boss = r.item.boss, text = store.get(noteKey(boss)) || '', a = r.assign;
  const pmap = new Map(players().map((p) => [p.name, p]));
  const who = (n, cls) => { const p = pmap.get(n); return '<span class="chipn' + (cls ? ' ' + cls : '') + '">' + (p ? avatar(p, true) + '<span class="nm" style="color:' + p.color + '">' : '<span class="nm">') + esc(n) + '</span></span>'; };
  const chips = (ns, cls) => ns.length ? '<span class="chips">' + ns.map((n) => who(n, cls)).join('') + '</span>' : '<span class="sub">none</span>';
  // no note yet: one line with a button instead of an empty editor taking half the page
  if (!text && !S.noteEdit) {
    $('#assignBox').innerHTML = '<div class="panel noteempty"><div><b>Assignments</b> <span class="sub">No NSRT note for ' + esc(boss) + ' yet. Add one to check soaks, kicks, orbs and cooldown assignments.</span></div><button class="btn primary" id="noteAdd">Add NSRT note</button></div>';
    $('#noteAdd').onclick = () => { S.noteEdit = true; assign(only); };
    return;
  }
  const editing = S.noteEdit || !text;
  const CHECKS = { 'The Coiled Altar': 'the Spiteful Soulcoiler kick rotations (the intstart … intend block: line 1 unmarked add, line 2 marked add, optional P3 lines), Guillotine and orb lines, the CC order on mind controls ("1st CC on Mindcontrol: Name"), the add curses ("Curse Unmarked Add: Name"), the intermission ghost soaks ("Soak Ghost at {cross}: Name"), and cooldown reminders', 'The Twin Fangs': 'the Ravenous Feast groups and their order, Broodling kick areas and order, the odd/even set globule CC groups, and cooldown reminders' };
  const checked = 'Checked for ' + esc(boss) + ': ' + (CHECKS[boss] || 'cooldown reminders (who pressed what, and when) and text lines labelled Guillotine/Soak, Kick/Interrupt or Orbs') + '. Names must be character names; NSRT nicknames can\'t be matched yet.';
  // The page: what went wrong this pull (a box on top), then the panels, then the quiet things as one line each (the
  // note itself, cooldown reminders, checks that didn't come up). Each row states its result once: the coloured edge
  // of the row plus a short ✓ / ✕ / ! line, with the spells the log shows.
  let top = '', h = '';
  const quiet = [], probs = []; // probs: { sev: 'bad' | 'warn', html, when }
  // (each panel goes in its slot, then they're shown in fight order; tiles: one per panel, on top, a click jumps to it)
  const panels = {}, tiles = [];
  const addTile = (id, pic, label, v, st, txt) => tiles.push({ id, pic, label, v, st, txt });
  // the wipe filter: what happens after the Nth death is shown greyed and isn't counted, as on every other tab
  const ct = cutT(r), kept = (t) => t == null || t <= ct + 0.05, AFTER = 'after the wipe filter';
  // the fight's phases (when it has them): each assignment goes under the phase it happens in, as on Mechanics; secs holds
  // every fold-out row ({ id, ph: phase index, 'w' for the whole fight or 'hcd', ord, icon, title, sub, st, txt, how, body })
  const PHS = r.module && !r.module.error && r.module.phases && r.module.phases.length ? r.module.phases : [];
  const phAt = (t) => { if (t == null || !PHS.length) return 'w'; const k = PHS.findIndex((p) => t >= p.start && t < p.end); return k >= 0 ? k : t >= PHS[PHS.length - 1].start ? PHS.length - 1 : 0; };
  const phOf = (n) => { const k = PHS.findIndex((p) => new RegExp('^P' + n + '\\b').test(p.name)); return k >= 0 ? k : 'w'; };
  const secs = [], addSec = (o) => secs.push(o);
  const icoWh = (n) => '<span class="icw big"><img class="wh-i" src="' + whIcon(n) + '" alt="" onerror="this.style.visibility=\'hidden\'"></span>';
  const pst = (st, html) => '<div class="pst ' + st + '">' + ({ ok: '✓ ', bad: '✕ ', warn: '! ' }[st] || '') + html + '</div>';
  const qline = (title, right, cls) => '<div class="qrow"><span class="q-t">' + title + '</span><span class="q-r' + (cls ? ' ' + cls : '') + '">' + right + '</span></div>';
  const qfold = (title, right, cls, body) => '<details class="qrow"><summary><span class="q-t">' + title + '</span><span class="q-r' + (cls ? ' ' + cls : '') + '">' + right + '</span></summary><div class="q-b">' + body + '</div></details>';
  if (editing) top += '<div class="panel"><h3>NSRT note for ' + esc(boss) + ' <small>' + (text ? 'saved on this PC, used for every pull of this boss' : 'paste your Northern Sky Raid Tools note to check assignments') + '</small></h3>' +
    '<textarea id="noteBox" class="notebox" placeholder="Paste the whole NSRT note here: the EncounterID line, reminder lines (time:…;ph:…;tag:…;spellid:…) and your text assignments (Guillotine 1: Name Name…, {skull} Kicks: Name Name…)">' + esc(text) + '</textarea>' +
    '<div style="margin-top:8px;display:flex;gap:8px"><button class="btn primary" id="noteSave">Save and check</button>' + (text ? '<button class="btn" id="noteCancel">Cancel</button><button class="btn" id="noteDel">Remove note</button>' : '') + '</div>' +
    '<p class="muted" style="font-size:13px;margin:10px 0 0">' + checked + '</p></div>';
  // (the saved note, with a button to paste an updated one, sits on top where it's easy to find)
  if (!editing) top += '<div class="panel notebar"><span class="nb-t">' + icoWh('inv_inscription_scroll') + '<b>NSRT note</b> <span class="sub">' + (a && a.note ? plural(a.note.reminders.length, 'reminder') + ' · ' + plural(a.note.lines.length, 'text line') + ' · ' : '') + 'used for every pull of ' + esc(boss) + '</span></span><button class="btn" id="noteEditBtn">Update note</button></div>';
  if (a && a.error) top += '<div class="panel">Couldn\'t read the note: ' + esc(a.error) + '</div>';
  const B = (a && a.boss) || {};
  if (!only && a && !a.error) {
    if (a.warnings.length) top += '<div class="note">' + a.warnings.map(esc).join('<br>') + '</div>';
    // boss assignments first (groups, kick order, CC rotation): these are what players actually get wrong
    const pill = (cls, txt) => '<span class="spill ' + cls + '">' + esc(txt) + '</span>';
    // Twin Fangs panels: a verdict, the rule in one line, then "who messed up" (red = a mistake, amber = could be
    // better, grey = for information); the full grid is under "Show details". A red or amber verdict also goes in the box on top.
    const nm = (n) => { const p = pmap.get(n); return '<span class="iss-n" style="color:' + (p ? p.color : 'inherit') + '">' + esc(n) + '</span>'; };
    const list = (xs) => { const v = [...new Set(xs)]; return v.length > 1 && v.every((x, i) => i === 0 || x === v[i - 1] + 1) ? v[0] + '–' + v[v.length - 1] : v.join(', '); };
    const issue = (sev, whoHtml, what, when) => '<div class="iss ' + sev + '"><span class="iss-dot"></span><span class="iss-what">' + whoHtml + ' ' + what + '</span><span class="iss-when">' + when + '</span></div>';
    const vpanel = (title, verdict, rule, issues, okText, details, id, pic) => {
      const m = /spill (bad|warn)">([^<]*)/.exec(verdict); if (m) probs.push({ sev: m[1], html: '<b>' + title + '</b>: ' + m[2], when: '' });
      const v = /spill (bad|warn|ok)">([^<]*)/.exec(verdict), vtxt = v ? hst(v[1], v[2].replace(/&amp;/g, '&')) : verdict; // (the verdict as a status on the right of the heading)
      if (id && v) addTile(id, pic, title, v[1] === 'ok' ? '✓' : String(parseInt(v[2], 10) || 1), v[1], v[2].replace(/&amp;/g, '&'));
      // (a fold-out row for the whole fight: the rule is its "How it works", then who got it wrong, then the full grid)
      addSec({ id: id || 'as-v' + secs.length, ph: 'w', ord: secs.length, icon: pic || '', title: esc(title), sub: '', st: v ? v[1] : 'na', txt: v ? v[2].replace(/&amp;/g, '&') : '', how: rule,
        body: (issues.length ? '<div class="nsp-list">' + issues.join('') + '</div>' : '<div class="nsp-ok"><span class="iss-dot"></span>' + okText + '</div>') + '<details class="nsp-d"><summary>Show details</summary>' + details + '</details>' });
      return '';
    };
    if (B.feast && B.feast.rows.length) {
      const F = B.feast, fr = F.rows, nF = F.nFeasts || Math.max(...fr.map((x) => x.feast)), groups = F.groups.slice().sort((x, y) => x.slot - y.slot);
      const feasts = (fs) => (fs.length === nF && nF > 1 ? 'all ' + nF + ' Feasts' : (fs.length > 1 ? 'Feasts ' : 'Feast ') + list(fs));
      // one line per player who got it wrong (all their Feasts together), then one grey line for soakers in no group
      const byWho = new Map(); for (const x of F.issues.filter((y) => y.kind !== 'unlisted')) { let e = byWho.get(x.who); if (!e) byWho.set(x.who, e = { who: x.who, group: x.group, parts: [], all: [] }); e.parts.push(x); e.all.push(...x.feasts); }
      const bad = [...byWho.values()].sort((a, b) => b.all.length - a.all.length);
      const iss = bad.map((e) => issue('bad', nm(e.who), '<span class="sub">(' + esc(e.group) + ')</span> ' + e.parts.map((x) => x.kind === 'wrong' ? 'soaked <b>' + esc(x.other) + '\'s</b> strike instead of their own' + (e.parts.length > 1 ? ' <span class="sub">(' + feasts(x.feasts) + ')</span>' : '') : 'didn\'t soak' + (e.parts.length > 1 ? ' <span class="sub">(' + feasts(x.feasts) + ')</span>' : '')).join('; '), feasts([...new Set(e.all)].sort((a, b) => a - b))));
      const un = new Map(); for (const x of F.issues.filter((y) => y.kind === 'unlisted')) { let e = un.get(x.who); if (!e) un.set(x.who, e = new Set()); x.feasts.forEach((f) => e.add(f)); }
      if (un.size) iss.push(issue('info', [...un.keys()].map(nm).join(', '), 'soaked but aren\'t in any Feast group <span class="sub">(tanks, or players missing from the note)</span>', ''));
      const cell = (x) => !x ? '<td class="tc"><span class="sub">—</span></td>' : '<td class="fcell"><div>' + (x.missing.length ? pill('bad', x.missing.length + ' missing') : x.extra.length ? pill('warn', 'all in, +' + x.extra.length) : pill('ok', 'all in')) + ' <span class="sub">' + T(x.t) + '</span></div>' +
        (x.missing.length ? '<div class="fwho">Missing: ' + x.missing.map((n) => nm(n)).join(', ') + '</div>' : '') + (x.extra.length ? '<div class="fwho">Not in group: ' + x.extra.map(nm).join(', ') + '</div>' : '') + '</td>';
      const grid = '<div class="scroll"><table class="tbl ftbl"><thead><tr><th>Group</th>' + Array.from({ length: nF }, (_, i) => '<th>Feast ' + (i + 1) + '</th>').join('') + '</tr></thead><tbody>' +
        groups.map((g) => '<tr><td><b>' + esc(g.label) + '</b> <span class="sub">strike ' + (g.slot + 1) + '</span><div class="sub" style="margin-top:2px">' + g.names.length + ' players</div></td>' + Array.from({ length: nF }, (_, i) => cell(fr.find((x) => x.feast === i + 1 && x.label === g.label))).join('') + '</tr>').join('') + '</tbody></table></div>';
      vpanel('Ravenous Feast groups', bad.length ? pill('bad', plural(bad.length, 'mistake')) : pill('ok', 'no mistakes'),
        'Strike order: ' + groups.map((g) => '<b>' + esc(g.label) + '</b> ' + ['1st', '2nd', '3rd'][g.slot]).join(', ') + '. Each group soaks only its own strike, every Feast.',
        iss, 'Everyone soaked their own group\'s strike in every Feast.', grid, 'as-feast', spellIcon(0, 'Ravenous Feast', true));
    }
    if (B.kicks && B.kicks.areas.length) {
      const K = B.kicks, ar = K.areas.filter((x) => x.units), nb = K.issues.filter((x) => x.sev === 'bad').length, nw = K.issues.length - nb;
      const iss = K.issues.map((x) => x.sev === 'bad'
        ? issue('bad', nm(x.want), 'missed their kick: a <b>' + esc(x.area) + '</b> Broodling cast got through' + (x.dead ? ' <span class="sub">(they were dead)</span>' : ''), 'set ' + x.set + ' · ' + T(x.t))
        : issue('warn', nm(x.who), 'kicked on <b>' + esc(x.want) + '\'s</b> turn <span class="sub">(' + esc(x.area) + ')</span>', 'set ' + x.set + ' · ' + T(x.t)));
      if (K.unmatched.length) iss.push(issue('info', K.unmatched.map(([n]) => nm(n)).join(', '), 'kicked ' + plural(K.unmatchedN, 'Broodling') + ' without being in the kick list (if they replaced someone, update the note)', ''));
      const tbl = ar.length ? '<table class="tbl"><thead><tr><th>Area</th><th>Kick order (kicks landed)</th><th>Broodlings</th><th>In turn</th><th>Out of turn</th><th>Time to kick</th><th>Got through</th></tr></thead><tbody>' +
        ar.map((x) => '<tr><td><b>' + esc(x.label) + '</b></td><td><span class="chips">' + [...new Set(x.order)].map((n, i) => '<span class="chipn' + (x.by.has(n) ? '' : ' idle') + '"><span class="sub">' + (i + 1) + '</span>' + who(n).replace(/^<span class="chipn">|<\/span>$/g, '') + '<b>' + (x.by.get(n) || 0) + '</b></span>').join('') + '</span></td><td class="tc">' + x.units + '</td><td class="tc">' + x.inOrder + ' of ' + x.kicks + '</td><td class="tc' + (x.outOfOrder ? ' hotv' : '') + '">' + x.outOfOrder + '</td><td class="tc">' + (x.avgReact != null ? x.avgReact.toFixed(1) + 's' : '—') + '</td><td>' + (x.gotOff ? pill('bad', String(x.gotOff)) : pill('ok', '0')) + '</td></tr>').join('') + '</tbody></table>'
        : '<p class="muted" style="margin:0">No Broodling kicks matched the note\'s kick areas this pull.</p>';
      vpanel('Broodling kick order', nb ? pill('bad', plural(nb, 'cast') + ' got through') : nw ? pill('warn', plural(nw, 'kick') + ' out of turn') : pill('ok', 'no mistakes'),
        'Each set, every area kicks its Broodlings in its listed order: the area\'s 1st Broodling is kicker 1\'s, the 2nd kicker 2\'s, and so on. Red = a cast got through on your turn; amber = you took someone else\'s turn.',
        iss, 'Every Broodling was kicked in turn and no casts got through.', tbl + (K.backup.length ? '<div class="sub" style="margin-top:6px">Backup: ' + K.backup.map(esc).join(', ') + '</div>' : ''), 'as-bk', icoWh('ability_kick'));
    }
    if (B.ca) {
      // Coiled Altar: NSRT's kick boxes on the two Spiteful Soulcoilers per set
      const ca = B.ca, nm = (n) => { const p = pmap.get(n); return '<span style="color:' + (p ? p.color : 'inherit') + '">' + esc(n) + '</span>'; };
      // (sets after the wipe filter are shown greyed and not counted)
      const all = ca.sets.filter((s) => kept(s.t)).flatMap((s) => s.adds), got = all.reduce((n, a) => n + a.gotOff.length, 0), slips = all.reduce((n, a) => n + a.kicks.filter((k) => !k.ok && k.listed).length, 0);
      const rot = (a) => {
        const seen = new Map(); a.kicks.forEach((k) => seen.set(k.who, (seen.get(k.who) || 0) + 1));
        const turns = new Set(a.gotOff.map((g) => g.want));
        return '<span class="chips">' + a.line.map((n, i) => '<span class="chipn' + (turns.has(n) ? ' bad' : seen.has(n) ? '' : ' idle') + '"><span class="sub">' + (i + 1) + '</span>' + who(n).replace(/^<span class="chipn">|<\/span>$/g, '') + '</span>').join('') + '</span>' +
          (a.kicks.some((k) => !k.listed) ? '<div class="fwho">Kicked without being on this line: ' + [...new Set(a.kicks.filter((k) => !k.listed).map((k) => k.who))].map(nm).join(', ') + '</div>' : '');
      };
      const res2 = (a) => (a.gotOff.length ? pill('bad', plural(a.gotOff.length, 'cast') + ' got through') : a.kicks.some((k) => !k.ok && k.listed) ? pill('warn', a.kicks.filter((k) => !k.ok && k.listed).length + ' out of turn') : a.kicks.length ? pill('ok', 'all in turn') : '<span class="sub">no kicks</span>');
      const seq = (a) => a.kicks.map((k) => '<span class="' + (k.ok ? '' : k.listed ? 'warnv' : 'sub') + '" title="' + esc('Kick ' + k.n + ' at ' + T(k.t) + (k.ok ? '' : ', was ' + k.want + '\'s turn')) + '">' + esc(k.who) + '</span>').join(' → ') +
        a.gotOff.map((g) => '<div class="hotv" style="font-size:12.5px">Got through at ' + T(g.t) + ': ' + (g.want ? esc(g.want) + '\'s turn (kick ' + g.n + ')' + (g.dead ? ', already dead' : '') : 'no one assigned') + '</div>').join('');
      if (ca.none) quiet.push(qline('Spiteful Soulcoiler kicks', 'no Soulcoiler casts this pull (they come in P2 and P3 on Mythic)'));
      else {
        const turnsOff = [...new Set(all.flatMap((x) => x.gotOff.map((g) => (g.want ? g.want + '\'s turn' : 'no one assigned'))))];
        if (got) probs.push({ sev: 'bad', html: '<b>Soulcoiler kicks</b>: ' + plural(got, 'cast') + ' got through' + (turnsOff.length ? ' (' + esc(turnsOff.join(', ')) + ')' : ''), when: '' });
        else if (slips) probs.push({ sev: 'warn', html: '<b>Soulcoiler kicks</b>: ' + plural(slips, 'kick') + ' out of turn', when: '' });
        const caSt = !all.length ? 'na' : got ? 'bad' : slips ? 'warn' : 'ok', caTxt = !all.length ? 'every set was ' + AFTER : got ? plural(got, 'cast') + ' got through' + (slips ? ' · ' + plural(slips, 'kick') + ' out of turn' : '') : slips ? plural(slips, 'kick') + ' out of turn' : 'all in turn';
        addTile('as-ca', icoWh('ability_kick'), 'Soulcoiler kicks', all.length ? got + '<span> got through</span>' : '—', caSt, caTxt);
        // one row per phase the sets came in (P2, P3): a bar per set, click it for the two adds in a nested card
        const caPh = new Map(); ca.sets.forEach((s, si) => { const k = phAt(s.t); if (!caPh.has(k)) caPh.set(k, []); caPh.get(k).push([s, si]); });
        for (const [k, list] of caPh) {
          const ka = list.filter(([s]) => kept(s.t)).flatMap(([s]) => s.adds), g2 = ka.reduce((n, x) => n + x.gotOff.length, 0), s2 = ka.reduce((n, x) => n + x.kicks.filter((q) => !q.ok && q.listed).length, 0);
          addSec({ id: 'as-ca-' + k, ph: k, ord: 4, icon: icoWh('ability_kick'), title: 'Spiteful Soulcoiler kicks', sub: plural(list.length, 'set') + ' · line 1 kicks the unmarked add, line 2 the marked add' + (list.some(([s]) => /P3/.test(s.phase)) ? '; lines 3 to 6 in P3' : ''),
            st: !ka.length ? 'na' : g2 ? 'bad' : s2 ? 'warn' : 'ok', txt: !ka.length ? AFTER : g2 ? plural(g2, 'cast') + ' got through' + (s2 ? ' · ' + plural(s2, 'kick') + ' out of turn' : '') : s2 ? plural(s2, 'kick') + ' out of turn' : 'all in turn',
            how: 'NSRT counts successful kicks on each add: kick 1 is the first name\'s, kick 2 the second\'s, and so on, repeating. A cast that gets through doesn\'t move the count on, so it was the turn of whoever was up. "Marked" means the add had a raid marker. Sets after the wipe filter are greyed and not counted.',
            body: '<div class="scroll"><table class="tbl gtable"><tbody>' +
              list.map(([s, si], li) => { const after = !kept(s.t), got = s.adds.reduce((n, x) => n + x.gotOff.length, 0), slip = s.adds.reduce((n, x) => n + x.kicks.filter((q) => !q.ok && q.listed).length, 0), key = 'nsrt-ca-' + si, open = S.openSets.has(key), cls = after ? 'gna' : got ? 'gbad' : slip ? 'gwarn' : 'gok';
                return (li ? '<tr class="gsp2"><td colspan="4"></td></tr>' : '') + '<tr class="grp gline ' + cls + (open ? ' open' : '') + '" data-gk="' + key + '"><td colspan="4"><div class="gl"><span class="gl-t">Set ' + s.set + '</span><span class="gl-w">' + T(s.t) + '</span><span class="gl-s">' + s.adds.map((x) => (x.marked ? 'marked' : 'unmarked') + ' add: ' + x.kicks.length + ' kicks').join(', ') + '</span>' +
                  (after ? hst('na', AFTER + (got ? ' · ' + plural(got, 'cast') + ' got through' : '')) : hst(got ? 'bad' : slip ? 'warn' : 'ok', got ? plural(got, 'cast') + ' got through' : slip ? plural(slip, 'kick') + ' out of turn' : 'all in turn')) + '<span class="gl-c" aria-hidden="true">▸</span></div></td></tr>' +
                  '<tr class="gdet" data-gp="' + key + '"' + (open ? '' : ' hidden') + '><td colspan="4"><div class="gcard ' + cls + '"><table class="tbl gsub"><thead><tr><th>Add</th><th>Kick order (from the note)</th><th>Result</th><th>Who kicked, in order</th></tr></thead><tbody>' +
                  s.adds.map((x) => '<tr' + (x.gotOff.length ? ' class="rbad"' : x.kicks.some((q) => !q.ok && q.listed) ? ' class="rwarn"' : '') + '><td><b>' + (x.marked ? 'Marked' : 'Unmarked') + '</b><div class="sub">' + (x.marked ? 'ranged add' : 'melee add') + '</div></td><td>' + (x.line.length ? rot(x) : '<span class="sub">no line in the note</span>') + '</td><td>' + res2(x) + '</td><td class="fwho">' + (seq(x) || '<span class="sub">—</span>') + '</td></tr>').join('') + '</tbody></table></div></td></tr>'; }).join('') + '</tbody></table></div>' });
        }
      }
    }
    if (B.orbcc && B.orbcc.rows.length) {
      // a set the group didn't CC at all is the mistake; single players with no CC in the log are for information only
      // (knockbacks and some stuns leave no trace the log can tie to a player)
      const O = B.orbcc, orr = O.rows, badSets = O.issues.filter((x) => x.sev === 'bad'), idle = O.issues.filter((x) => x.sev !== 'bad'), nb = badSets.length;
      const iss = badSets.map((x) => issue('bad', '<b>' + esc(x.label || 'The group') + '</b>', 'didn\'t CC the globules at all', 'set ' + x.set + ' · ' + T(x.t)));
      if (idle.length) iss.push(issue('info', '', 'No CC from these players showed up in the log on their sets: ' + idle.map((x) => nm(x.who) + ' <span class="sub">(' + (x.sets.length > 1 ? 'sets ' : 'set ') + list(x.sets) + ')</span>').join(', ') + '. Knockbacks and some stuns don\'t show, so check before calling it a miss.', ''));
      const tbl = '<table class="tbl"><thead><tr><th>Set</th><th>Group</th><th>Result</th><th>Didn\'t CC</th><th>CC\'d but not in this group</th></tr></thead><tbody>' +
        orr.map((x) => '<tr><td class="tc"><b>' + x.set + '</b><div class="sub">' + T(x.t) + '</div></td><td>' + esc(x.label || '—') + '</td><td>' + (x.adds != null && x.adds < 3 && !x.n ? '<span class="sub">only ' + plural(x.adds, 'globule') + '</span>' : (!x.did.length ? pill('bad', 'no CC from the group') : x.idle.length ? pill('warn', x.did.length + ' of ' + x.assigned.length + ' CC\'d') : pill('ok', 'all CC\'d')) + ' <span class="sub">' + plural(x.n, 'CC') + ' in total</span>') + '</td><td class="fwho">' + (x.idle.length && !(x.adds < 3 && !x.n) ? x.idle.map(nm).join(', ') : '<span class="sub">—</span>') + '</td><td class="fwho">' + (x.outside.length ? x.outside.map(nm).join(', ') : '<span class="sub">—</span>') + '</td></tr>').join('') + '</tbody></table>';
      vpanel('Globule CC', nb ? pill('bad', plural(nb, 'set') + ' with no CC') : pill('ok', 'no mistakes'),
        'Sets 1, 3, 5 go to <b>' + esc((orr.find((x) => x.set % 2 === 1) || {}).label || 'the odd group') + '</b>, sets 2, 4, 6 to <b>' + esc((orr.find((x) => x.set % 2 === 0) || {}).label || 'the even group') + '</b>. That group CCs the globules so Barbed Bulwark comes off before the soak; red means nobody from it did.',
        iss, 'The assigned group CC\'d the globules on every set.', tbl, 'as-orbcc', icoWh('ability_creature_cursed_02'));
    }

    // ---- Entombed Sentinels: the Blood / Breath split, cycle by cycle (the groups trade bosses at every intermission)
    if (B.sides && B.sides.rows.length) {
      const Sd = B.sides, nw = Sd.issues.length;
      const iss = Sd.issues.map((x) => issue('warn', nm(x.who), x.all ? 'played the other group\'s side all pull <span class="sub">(the note has them in the ' + esc(x.group) + ' group; if the split changed, update the note)</span>' : 'was on the other boss <span class="sub">(the note has them in the ' + esc(x.group) + ' group)</span>', (x.cycles.length > 1 ? 'cycles ' : 'cycle ') + x.cycles.join(', ')));
      const tbl = '<table class="tbl"><thead><tr><th>Cycle</th><th>Blood group on</th><th>Breath group on</th><th>Result</th><th>On the other boss</th></tr></thead><tbody>' +
        Sd.rows.map((x) => '<tr><td class="tc"><b>' + x.cycle + '</b><div class="sub">' + T(x.t) + '</div></td><td>' + (x.cycle % 2 ? 'Blood (red)' : 'Breath (green)') + '</td><td>' + (x.cycle % 2 ? 'Breath (green)' : 'Blood (red)') + '</td><td>' + (x.wrong.length ? pill('warn', plural(x.wrong.length, 'player') + ' on the other boss') : pill('ok', 'everyone on their boss')) + '</td><td class="fwho">' + (x.wrong.length ? x.wrong.map((w) => nm(w.n)).join(', ') : '<span class="sub">—</span>') + '</td></tr>').join('') + '</tbody></table>';
      vpanel('Sides', nw ? pill('warn', plural(nw, 'player') + ' on the other side') : pill('ok', 'no mistakes'),
        'From the note\'s Blood / Breath split: each group is on its boss in cycle 1 and on the other boss after every intermission. Who was on which boss comes from the Mark stacks each player picked up.',
        iss, 'Everyone was on their group\'s boss every cycle.', tbl, 'as-sides', icoWh('ability_creature_poison_05'));
    }

    // ---- Sszorak: the two Mutilate groups, the Serpent's Fury timer, and the cyst poppers (shown, not judged)
    const SZ = B.sz;
    if (SZ && SZ.mut && SZ.mut.rows.length) {
      const Mu = SZ.mut, shortR = Mu.rows.filter((x) => x.short), nw = Mu.issues.length + shortR.length, sets = (l) => (l.length > 1 ? 'sets ' : 'set ') + list(l);
      const iss = Mu.issues.map((x) => issue('warn', nm(x.who), 'soaked the other group\'s Mutilate <span class="sub">(' + sets(x.wrong) + ') · ' + esc(x.group) + ' group</span>', ''))
        .concat(shortR.map((x) => issue('warn', '<b>Mutilate ' + x.i + '</b>', 'was ' + x.missed.length + ' short of the ' + esc(x.group) + ' group: ' + x.missed.map(nm).join(', '), 'set ' + (x.set || '?') + ' · ' + T(x.t))));
      const tbl = '<table class="tbl"><thead><tr><th>Mutilate</th><th>Soaked by</th><th>Of the group</th><th>Other group in it</th><th>Not in it</th></tr></thead><tbody>' +
        Mu.rows.map((x) => '<tr' + (x.wrong.length || x.short ? ' class="rwarn"' : '') + '><td><b>' + x.i + '</b><div class="sub">set ' + (x.set || '?') + ' · ' + T(x.t) + '</div></td><td>' + (x.group ? esc(x.group) + ' group' : '<span class="sub">nobody from the note</span>') + '</td><td class="tc">' + (x.group ? '<span class="' + (x.short ? 'warnv' : '') + '">' + x.n + ' of ' + x.of + '</span>' : '—') + '</td>' +
          '<td class="fwho">' + (x.wrong.length ? x.wrong.map(nm).join(', ') : '<span class="sub">—</span>') + '</td><td class="fwho' + (x.short ? '' : ' sub') + '">' + (x.missed.length ? x.missed.map(nm).join(', ') : '—') + '</td></tr>').join('') + '</tbody></table>' +
        (Mu.missedBy.length ? '<p class="sub" style="margin:8px 0 0">Not in their group\'s Mutilate (not judged on its own): ' + Mu.missedBy.sort((a, b) => b.sets.length - a.sets.length).map((x) => esc(x.who) + ' ' + x.sets.length + 'x').join(', ') + '.</p>' : '');
      vpanel('Mutilate groups', nw ? pill('warn', [Mu.issues.length ? plural(Mu.issues.length, 'player') + ' in the other group\'s soak' : '', shortR.length ? plural(shortR.length, 'short-handed soak') : ''].filter(Boolean).join(' · ')) : pill('ok', 'no mistakes'),
        'From the note\'s two soak groups (' + Mu.groups.map((g) => esc(g.label) + ': ' + g.names.length).join(', ') + '): each Mutilate is soaked by one group and the next by the other, because Mutilated Gash makes a second one hit 500% harder. The group with the most players in a Mutilate is the one soaking it. Amber: someone from the other group in it (they\'ll have Mutilated Gash for their own group\'s next one), or ' + Mu.short + ' or more of the soaking group not in it. One or two out is fine, so a single player missing isn\'t flagged. (Soaking with Mutilated Gash still on, and fewer than 5 soakers, are in Mechanics.)',
        iss, 'Every Mutilate was soaked by its own group, with at most ' + (Mu.short - 1) + ' missing.', tbl, 'as-szmut', icoWh('ability_rogue_mutilate'));
    }
    if (SZ && SZ.timer && SZ.timer.rows.length) {
      const Tm = SZ.timer, off = Tm.rows.filter((x) => x.st === 'warn');
      const iss = off.map((x) => issue('warn', '<b>Fury ' + x.i + '</b>', 'popped ' + Math.abs(x.d).toFixed(1) + ' s ' + (x.d < 0 ? 'before' : 'after') + ' the timer' + (x.pre && x.d < 0 ? ' <span class="sub">(before an intermission: the next one gets less time)</span>' : ''), T(x.popT)));
      const tbl = '<table class="tbl"><thead><tr><th>Fury</th><th>Timer</th><th>Popped</th><th>Off by</th></tr></thead><tbody>' +
        Tm.rows.map((x) => '<tr' + (x.st === 'warn' ? ' class="rwarn"' : '') + '><td><b>' + x.i + '</b>' + (x.pre ? '<div class="sub">before the intermission</div>' : '') + '</td><td>' + T(x.t) + '</td><td>' + (x.popT != null ? T(x.popT) : '<span class="sub">not popped</span>') + '</td><td class="tc">' + (x.d != null ? '<span class="' + (x.st === 'warn' ? 'warnv' : 'okv') + '">' + (x.d >= 0 ? '+' : '') + x.d.toFixed(1) + ' s</span>' : '—') + '</td></tr>').join('') + '</tbody></table>' +
        (Tm.triggers.length ? '<p class="sub" style="margin:8px 0 0">The note\'s Virulence triggers: ' + Tm.triggers.map(nm).join(', ') + '</p>' : '');
      vpanel('Serpent\'s Fury timer', off.length ? pill('warn', plural(off.length, 'pop') + ' off the timer') : pill('ok', 'every pop on the timer'),
        'From the note\'s reminders that say when to pop Serpent\'s Fury: each pop against the nearest one. Amber: the pop before an intermission more than 1.5 s early (the next one then can\'t be reached in time), or any pop more than 3 s late. A Fury that was never popped (the enrage) is in Mechanics.',
        iss, 'Every Serpent\'s Fury was popped on the note\'s timer.', tbl, 'as-szfury', icoWh('ability_hunter_pet_raptor'));
    }
    if (SZ && SZ.poppers && SZ.poppers.pops.length) {
      const Po = SZ.poppers, by = new Map(); for (const p of Po.pops) { if (!by.has(p.inter)) by.set(p.inter, []); by.get(p.inter).push(p); }
      const tbl = '<table class="tbl"><thead><tr><th>Intermission</th><th>Wind 1</th><th>Wind 2</th><th>Wind 3</th><th>Spare</th></tr></thead><tbody>' +
        [...by].map(([k, l]) => '<tr><td><b>' + k + '</b></td>' + [1, 2, 3, 'spare'].map((sl) => { const p = l.find((q) => q.slot === sl); return '<td>' + (!p ? '<span class="sub">—</span>' : p.by ? nm(p.by) + (Po.names.includes(p.by) ? '' : ' <span class="sub">(not a popper in the note)</span>') : '<span class="sub">popped, not sure by whom</span>') + '</td>'; }).join('') + '</tr>').join('') + '</tbody></table>';
      vpanel('Cyst poppers', '<span class="sub">shown, not judged</span>',
        'The note\'s cyst poppers: ' + Po.names.join(', ') + '. Who popped each cyst is the player nearest it as it popped, read from positions: close, but a guess when the raid is pushed into the cyst together, so it isn\'t judged.',
        [], 'Who popped each cyst, from positions.', tbl, 'as-szpop', icoWh('spell_nature_acid_01'));
    }

    // ---- Nek'zali: the Soulcoil Well groups (their turns for each Drowned Echo) and the Hungering Pyre soak list
    const NZ = B.nz;
    if (NZ && NZ.well && NZ.well.rows.length) {
      const Wl = NZ.well, shortR = Wl.rows.filter((x) => x.short), nw = Wl.issues.length + shortR.length;
      const iss = Wl.issues.map((x) => issue('warn', nm(x.who), 'went into the well on the other group\'s turn <span class="sub">(Echo ' + list(x.echoes) + ') · ' + esc(x.group) + '</span>', ''))
        .concat(shortR.map((x) => issue('warn', '<b>Echo ' + x.i + '</b>', esc(x.group) + ' was ' + x.missed.length + ' short: ' + x.missed.map(nm).join(', '), esc(x.ph) + ' · ' + T(x.t))));
      const tbl = '<table class="tbl"><thead><tr><th>Drowned Echo</th><th>Whose turn</th><th>In the well</th><th>Other group in it</th><th>Not in it</th></tr></thead><tbody>' +
        Wl.rows.map((x) => '<tr' + (x.wrong.length || x.short ? ' class="rwarn"' : '') + '><td><b>' + x.i + '</b><div class="sub">' + esc(x.ph) + ' · ' + T(x.t) + '</div></td><td>' + esc(x.group) + '</td><td class="tc">' + (x.empty ? '<span class="sub">nobody</span>' : '<span class="' + (x.short ? 'warnv' : '') + '">' + x.n + ' of ' + x.of + '</span>' + (x.extra.length ? '<div class="sub">+ ' + x.extra.map(esc).join(', ') + '</div>' : '')) + '</td>' +
          '<td class="fwho">' + (x.wrong.length ? x.wrong.map(nm).join(', ') : '<span class="sub">—</span>') + '</td><td class="fwho' + (x.short ? '' : ' sub') + '">' + (x.missed.length ? x.missed.map(nm).join(', ') : '—') + '</td></tr>').join('') + '</tbody></table>';
      vpanel('Well groups', nw ? pill('warn', [Wl.issues.length ? plural(Wl.issues.length, 'player') + ' in on the other group\'s turn' : '', shortR.length ? plural(shortR.length, 'short-handed Echo') : ''].filter(Boolean).join(' · ')) : pill('ok', 'no mistakes'),
        'From the note\'s Soulcoil Well groups (' + Wl.groups.map((g) => esc(g.label) + ': ' + g.names.length).join(', ') + '): they take turns going into the well for each Drowned Echo, in the order of the note\'s "go in" reminders. Who was in the well comes from Immortal Coil, which only hits players inside. Amber: someone from the other group in it (they\'ll have Soul Exhaustion for their own turn), or ' + Wl.short + ' or more of the group missing. One or two out is fine.',
        iss, 'Every Drowned Echo was taken by its group, with at most ' + (Wl.short - 1) + ' missing.', tbl, 'as-nzwell', spellIcon(0, 'Grasping Depths', true));
    }
    if (NZ && NZ.pyre && NZ.pyre.rows.length) {
      const Py = NZ.pyre, shortR = Py.rows.filter((x) => x.short), nw = Py.issues.length + shortR.length;
      const iss = Py.issues.map((x) => issue('warn', nm(x.who), 'soaked the Pyre <span class="sub">(Pyre ' + list(x.pyres) + ') · on the don\'t-soak list</span>', ''))
        .concat(shortR.map((x) => issue('warn', '<b>Pyre ' + x.i + '</b>', 'was ' + x.missed.length + ' short of the soak list: ' + x.missed.map(nm).join(', '), T(x.t))));
      const tbl = '<table class="tbl"><thead><tr><th>Hungering Pyre</th><th>From the soak list</th><th>Don\'t-soak list in it</th><th>Not in it</th></tr></thead><tbody>' +
        Py.rows.map((x) => '<tr' + (x.wrong.length || x.short ? ' class="rwarn"' : '') + '><td><b>' + x.i + '</b><div class="sub">' + T(x.t) + '</div></td><td class="tc"><span class="' + (x.short ? 'warnv' : '') + '">' + x.n + ' of ' + x.of + '</span>' + (x.extra.length ? '<div class="sub">+ ' + x.extra.map(esc).join(', ') + '</div>' : '') + '</td>' +
          '<td class="fwho">' + (x.wrong.length ? x.wrong.map(nm).join(', ') : '<span class="sub">—</span>') + '</td><td class="fwho' + (x.short ? '' : ' sub') + '">' + (x.missed.length ? x.missed.map(nm).join(', ') : '—') + '</td></tr>').join('') + '</tbody></table>';
      vpanel('Pyre soak', nw ? pill('warn', [Py.issues.length ? plural(Py.issues.length, 'player') + ' from the don\'t-soak list in it' : '', shortR.length ? plural(shortR.length, 'short-handed Pyre') : ''].filter(Boolean).join(' · ')) : pill('ok', 'no mistakes'),
        'From the note\'s Hungering Pyre lists: the soak list (' + Py.soak.length + ') goes into every Pyre; the don\'t-soak list (' + Py.out.length + ') stays out, because their Slithering Flame burns the corpses. Amber: someone from the don\'t-soak list in it, or ' + Py.short + ' or more of the soak list missing (anyone dead, or in the well then, isn\'t counted). Deaths to a Pyre are in Mechanics.',
        iss, 'Every Pyre was soaked by its list, with at most ' + (Py.short - 1) + ' missing.', tbl, 'as-nzpyre', spellIcon(0, 'Hungering Pyre', true));
    }

    // ---- Coiled Altar: the CC order on Dreadmarch's mind controls (one row per phase), the add curses, the ghost soaks
    const nmC = (n) => who(n).replace(/^<span class="chipn">|<\/span>$/g, ''), colOf = (n) => { const p = pmap.get(n); return p ? p.color : 'inherit'; };
    const pn = (n) => '<span class="nm" style="color:' + colOf(n) + '">' + esc(n) + '</span>';
    const tally = (list) => '<span class="chips">' + list.map((p) => '<span class="chipn' + (p.of != null ? (p.of && !p.did ? ' bad' : '') : (p.up && !p.did ? ' warn' : '')) + '">' + nmC(p.n) + '<b>' + p.did + '/' + (p.of != null ? p.of : p.up) + '</b></span>').join('') + '</span>';
    const caLater = [];
    if (a.mcCC && a.mcCC.rows.length) {
      const M = a.mcCC, ord = M.order, dmN = (n) => n + (n === 1 ? ' Dreadmarch' : ' Dreadmarches');
      for (const d of M.rows) if (kept(d.s) && (d.st === 'bad' || d.st === 'warn')) probs.push({ sev: d.st, html: '<b>Mind control CC</b>: Dreadmarch ' + d.n + ' ' + esc(d.st === 'bad' ? 'had no CC (' + andList(d.mcd) + ' walked for ' + d.len.toFixed(1) + 's)' : '· ' + d.txt), when: T(d.s) });
      const judged = (list) => list.filter((d) => kept(d.s) && d.st !== 'na');
      const stOf = (list) => { const j = judged(list), b = j.filter((d) => d.st === 'bad').length, w = j.filter((d) => d.st === 'warn').length;
        return [!j.length ? 'na' : b ? 'bad' : w ? 'warn' : 'ok', !j.length ? (list.some((d) => !kept(d.s)) ? AFTER : 'none needed a CC') : b ? dmN(b) + ' with no CC' + (w ? ' · ' + w + ' could be better' : '') : w ? w + ' of ' + j.length + ' could be better' : allOf(j.length, 'the mind control was CC\'d', 'mind controls CC\'d'), j.length - b]; };
      const [aSt, aTxt, held] = stOf(M.rows), jAll = judged(M.rows).length;
      addTile('as-mc', spellIcon(0, 'Dreadmarch', true), 'Mind control CC', jAll ? held + '<span> / ' + jAll + ' CC\'d</span>' : '—', aSt, aTxt);
      const rel = (c) => (c.rel <= 0.05 ? (c.rel < -0.05 ? Math.abs(c.rel).toFixed(1) + 's before' : 'as it landed') : '+' + c.rel.toFixed(1) + 's');
      const ccLine = (c) => '<div class="ccl"><span class="ccn' + (c.k ? '' : ' x') + '" title="' + (c.k ? 'number ' + c.k + ' on the CC order' : 'not on the CC order') + '">' + (c.k || '–') + '</span>' + pn(c.who) + ' ' + spell(c.id, c.spell) + ' <span class="sub">' + rel(c) + (c.on.length ? '' : ' · cast') + '</span></div>';
      const rowM = (d) => {
        const after = !kept(d.s), cls = after ? 'rna' : d.st === 'na' ? '' : 'r' + d.st, out = d.ccers.filter((o) => o.why);
        const cc = d.cc.slice(0, 6).map(ccLine).join('') + (d.cc.length > 6 ? '<div class="sub">+' + (d.cc.length - 6) + ' more</div>' : '');
        return '<tr class="' + cls + '"><td><b>Dreadmarch ' + d.n + '</b><div class="sub">' + T(d.s) + (d.len ? ' · ' + d.len.toFixed(1) + 's' : '') + '</div></td>' +
          '<td><span class="chips">' + d.mcd.map((n) => '<span class="chipn' + (d.died.includes(n) ? ' bad' : '') + '"' + (d.died.includes(n) ? ' title="died mind controlled"' : '') + '>' + nmC(n) + '</span>').join('') + '</span>' + (out.length ? '<div class="pdesc">Couldn\'t CC: ' + out.map((o) => esc(o.n) + ' (' + o.why + ')').join(', ') + '</div>' : '') + '</td>' +
          '<td>' + (cc || '<span class="sub">none</span>') + '</td><td class="cdr">' + (after ? hst('na', AFTER) : hst(d.st, d.txt)) + '</td></tr>' +
          d.later.map((x) => '<tr class="rsub"><td></td><td colspan="3"><span class="sub">Later: ' + esc(x.n) + ' mind controlled again for ' + x.len.toFixed(1) + 's' + (x.died ? ', died' : '') + ' · ' + (x.cc.length ? 'CC: ' + x.cc.map((c) => esc(c.who) + ' ' + esc(c.spell)).join(', ') : 'no CC') + ' (shown, not judged)</span></td></tr>').join('');
      };
      // per player on the order: the Dreadmarches before the wipe filter that needed a CC while they could give one, and how many they CC'd
      const mPer = ord.map((n) => { const up = M.rows.filter((d) => kept(d.s) && d.mcd.length && d.len >= 2 && d.ccers.some((o) => o.n === n && !o.why)); return { n, up: up.length, did: up.filter((d) => d.cc.some((c) => c.who === n)).length }; }).filter((p) => p.up);
      const mPh = new Map(); for (const d of M.rows) { const k = phAt(d.t); if (!mPh.has(k)) mPh.set(k, []); mPh.get(k).push(d); }
      for (const [k, list] of mPh) {
        const [st, txt] = stOf(list);
        addSec({ id: 'as-mc-' + k, ph: k, ord: 3.5, tip: 'Dreadmarch', icon: spellIcon(0, 'Dreadmarch', true), title: 'Mind control CC', sub: dmN(list.length) + ' · CC order from the note',
          st, txt, how: 'Dreadmarch mind controls three players, who walk to the edge of the platform. The first player on the note\'s CC order who isn\'t mind controlled or dead goes first; the next one follows when that wears off or is on cooldown. ' +
            'Counted: stuns (Leg Sweep, Shockwave, Chaos Nova, Capacitor Totem, Hammer of Justice, Storm Bolt, Binding Shot, Holy Word: Chastise and more), roots and grips (Ursol\'s Vortex, Death Grip, Gorefiend\'s Grasp, Mass Entanglement, Landslide), disorients (Blinding Light, Sigil of Misery), and Ring of Peace. Ring of Peace leaves nothing on its targets in the log, so it counts when it\'s cast from just before the mind control until it breaks. ' +
            'No CC at all is a miss. Someone lower on the order going more than a second before someone above them, or CC only from players not on the order, could be better. A mind control that breaks on its own within 2 seconds isn\'t judged. Single re-controls later on are shown, not judged. Dreadmarches after the wipe filter are greyed and not counted.',
          body: '<div class="pdesc" style="margin:0 0 8px">CC order: <span class="chips">' + ord.map((n, i) => '<span class="chipn"><span class="sub">' + (i + 1) + '</span>' + nmC(n) + '</span>').join('') + '</span></div>' +
            '<div class="scroll"><table class="tbl nsx"><colgroup><col style="width:15%"><col style="width:30%"><col style="width:35%"><col style="width:20%"></colgroup><thead><tr><th>Dreadmarch</th><th>Mind controlled</th><th>CC, in the order it landed</th><th>Result</th></tr></thead><tbody>' + list.map(rowM).join('') + '</tbody></table></div>' +
            (k === [...mPh.keys()].pop() && mPer.length ? '<div class="pdesc" style="margin-top:8px">CC\'d / could have, this pull: ' + tally(mPer) + '</div>' : '') });
      }
    }
    if (a.curses && a.curses.rows.length) {
      const C = a.curses, KN = { unmarked: 'unmarked', marked: 'raid-marked', either: 'no-marker' };
      const setSt = (s) => { const j = s.adds.filter((x) => x.st !== 'na'); return !j.length ? 'na' : j.some((x) => x.st === 'bad') ? 'bad' : j.some((x) => x.st === 'warn') || (s.idle && s.idle.length) ? 'warn' : 'ok'; };
      for (const s of C.rows) { if (!kept(s.t)) continue;
        for (const x of s.adds) if (x.st === 'bad' || x.st === 'warn') probs.push({ sev: x.st, html: '<b>Add curses</b>: the ' + KN[x.kind] + ' add in set ' + s.n + ' ' + (x.st === 'bad' ? 'wasn\'t cursed' + (x.want.length ? ' (' + esc(andList(x.want)) + ')' : '') : 'was ' + esc(x.txt)), when: T(s.t) });
        if (s.idle && s.idle.length) probs.push({ sev: 'warn', html: '<b>Add curses</b>: ' + esc(andList(s.idle)) + ' cursed neither add in set ' + s.n, when: T(s.t) }); }
      const stOf = (list) => { const j = list.filter((s) => kept(s.t)).map(setSt).filter((x) => x !== 'na'), b = j.filter((x) => x === 'bad').length, w = j.filter((x) => x === 'warn').length;
        return [!j.length ? 'na' : b ? 'bad' : w ? 'warn' : 'ok', !j.length ? (list.some((s) => !kept(s.t)) ? AFTER : 'no set to judge') : b ? plural(b, 'set') + ' with an add not cursed' + (w ? ' · ' + w + ' could be better' : '') : w ? w + ' of ' + j.length + ' sets could be better' : allOf(j.length, 'both adds cursed', 'sets cursed'), j.length - b - w, j.length]; };
      const [aSt, aTxt, clean, nJ] = stOf(C.rows);
      addTile('as-curse', spellIcon(0, 'Curse of Tongues', true), 'Add curses', nJ ? clean + '<span> / ' + nJ + ' sets clean</span>' : '—', aSt, aTxt);
      const rowC = (s) => {
        const after = !kept(s.t);
        return s.adds.map((x, i) => '<tr class="' + (after ? 'rna' : x.st === 'na' ? '' : 'r' + x.st) + '">' + (i ? '' : '<td rowspan="' + s.adds.length + '"><b>Set ' + s.n + '</b><div class="sub">' + T(s.t) + '</div>' + (s.idle && s.idle.length && !after ? pst('warn', esc(andList(s.idle)) + ' cursed neither') : '') + '</td>') +
          '<td><b>' + capS(KN[x.kind]) + '</b>' + (x.kind === 'either' ? '<div class="sub">either warlock</div>' : '') + '</td><td>' + (x.want.length ? '<span class="chips">' + x.want.map((n) => '<span class="chipn">' + nmC(n) + '</span>').join('') + '</span>' : '<span class="sub">no one</span>') + '</td>' +
          '<td>' + (x.curses.length ? x.curses.map((c) => '<div class="ccl">' + spell(c.id, c.spell) + ' ' + pn(c.who) + ' <span class="sub">+' + Math.max(0, c.rel).toFixed(1) + 's</span></div>').join('') : '<span class="sub">none</span>') + '</td><td class="cdr">' + (after ? hst('na', AFTER) : hst(x.st, x.txt)) + '</td></tr>').join('');
      };
      // per warlock: the sets before the wipe filter with an add of theirs to curse, and how many they cursed theirs in
      const cPer = [...new Set([...C.want.unmarked, ...C.want.marked])].map((n) => { const sets = C.rows.filter((s) => kept(s.t) && s.adds.some((x) => x.st !== 'na' && x.want.includes(n)));
        return { n, of: sets.length, did: sets.filter((s) => s.adds.some((x) => x.want.includes(n) && x.curses.some((c) => c.who === n))).length }; }).filter((p) => p.of);
      const cPh = new Map(); for (const s of C.rows) { const k = phAt(s.t); if (!cPh.has(k)) cPh.set(k, []); cPh.get(k).push(s); }
      for (const [k, list] of cPh) {
        const [st, txt] = stOf(list);
        addSec({ id: 'as-curse-' + k, ph: k, ord: 4.5, tip: 'Curse of Tongues', icon: spellIcon(0, 'Curse of Tongues', true), title: 'Add curses', sub: plural(list.length, 'set') + ' · unmarked: ' + esc(andList(C.want.unmarked) || 'no one') + ' · raid-marked: ' + esc(andList(C.want.marked) || 'no one'),
          st, txt, how: 'Each set of Spiteful Soulcoilers has one add with a raid marker and one without, and the note gives each add its warlock. The curse slows the add\'s casts, which gives the kickers more time: Curse of Tongues, or Curse of the Satyr, which some warlocks have in its place. ' +
            'The assigned warlock\'s curse on their add is done. Someone else\'s curse on it instead could be better. No curse at all is a miss. In a set where neither add had a raid marker, either add counts, and a warlock who cursed neither is the miss. Only sets in the phases the reminders cover are judged. Sets after the wipe filter are greyed and not counted.',
          body: '<div class="scroll"><table class="tbl nsx"><colgroup><col style="width:13%"><col style="width:15%"><col style="width:22%"><col style="width:30%"><col style="width:20%"></colgroup><thead><tr><th>Set</th><th>Add</th><th>Should curse</th><th>Cursed by</th><th>Result</th></tr></thead><tbody>' + list.map(rowC).join('') + '</tbody></table></div>' +
            (k === [...cPh.keys()].pop() && cPer.length ? '<div class="pdesc" style="margin-top:8px">Cursed their add / sets, this pull: ' + tally(cPer) + '</div>' : '') });
      }
    }
    if (a.ghosts) {
      const G = a.ghosts;
      if (!G.reached) caLater.push('ghost soaks (intermission)');
      else {
        const after = !kept(G.from), rows = G.rows.slice().sort((x, y) => (x.mark || 9) - (y.mark || 9));
        const gb = rows.filter((x) => x.st === 'bad').length, gw = rows.filter((x) => x.st === 'warn').length;
        const st = after ? 'na' : G.through || gb ? 'bad' : gw ? 'warn' : 'ok';
        const txt = after ? AFTER : G.through ? plural(G.through, 'fragment') + ' reached Zul\'jan' + (gb ? ' · ' + plural(gb, 'soaker') + ' dead' : '') : gb ? plural(gb, 'soaker') + ' dead' : gw ? 'soakers sharing a spot' : 'every marker had its soaker';
        if (!after) { if (G.through) probs.push({ sev: 'bad', html: '<b>Ghost soaks</b>: ' + plural(G.through, 'fragment') + ' reached Zul\'jan', when: 'Intermission' });
          for (const x of rows) if (x.st === 'bad' || x.st === 'warn') probs.push({ sev: x.st, html: '<b>Ghost soaks</b>: ' + esc(x.n) + ' ' + esc(x.txt), when: 'Intermission' }); }
        addTile('as-ghost', spellIcon(0, 'Spirit Erasure', true), 'Ghost soaks', after ? '—' : rows.length - gb - gw + '<span> / ' + rows.length + ' in place</span>', st, txt);
        addSec({ id: 'as-ghost', ph: phAt(G.from), ord: 1, tip: 'Spirit Erasure', icon: spellIcon(0, 'Spirit Erasure', true), title: 'Ghost soaks', sub: plural(rows.length, 'soaker') + ' · one per marker', st, txt,
          how: 'In the intermission, Fragments of Malacrass head for Zul\'jan and have to be blocked. Each block gives the whole raid a Spirit Erasure stack. The note puts one soaker on each marker. ' +
            'The log doesn\'t record who blocked which fragment, and the fragments don\'t show up in it, so this checks what it can: each soaker alive through the intermission, standing on a spot of their own (not within 5 yards of another soaker), and whether any fragment reached Zul\'jan.',
          body: '<div class="scroll"><table class="tbl nsx"><colgroup><col style="width:14%"><col style="width:26%"><col style="width:36%"><col style="width:24%"></colgroup><thead><tr><th>Marker</th><th>Soaker</th><th>Where they stood</th><th>Result</th></tr></thead><tbody>' +
            rows.map((x) => '<tr class="' + (after ? 'rna' : x.st === 'na' ? '' : 'r' + x.st) + '"><td>' + (x.mark ? markIcon(x.mark) : '<span class="sub">—</span>') + '</td><td>' + who(x.n) + '</td><td>' + (x.dZ != null ? Math.round(x.dZ) + ' yd from Zul\'jan <span class="sub">· moved ' + Math.round(x.moved) + ' yd</span>' : '<span class="sub">—</span>') + '</td><td class="cdr">' + (after ? hst('na', AFTER) : hst(x.st, x.txt)) + '</td></tr>').join('') + '</tbody></table></div>' +
            '<div class="pdesc" style="margin-top:8px">Fragments that reached Zul\'jan: <b>' + G.through + '</b> · raid peak: <b>' + G.peak + '</b> Spirit Erasure stacks over ' + plural(G.rounds, 'soak round') + '</div>' });
      }
    }

    // ---- Guillotine: one row per drop with everything assigned for it, the soak team, the external on the axe's target
    // and the Zephyr. Drops that didn't happen this pull (a later phase, say) are named in the quiet rows at the bottom.
    const dropName = (s) => { const m = s.label.match(/(?:soak|guillotine)\s*#?\s*(\d+)/i), p = s.label.match(/\bp\s*(\d)\b/i); return (p ? 'P' + p[1] + ' ' : '') + 'Guillotine ' + (m ? m[1] : ''); };
    const gDrops = new Map();
    for (const s of a.soaks) { const k = s.soak || dropName(s); let d = gDrops.get(k); if (!d) gDrops.set(k, d = { lab: dropName(s).trim(), soak: s.soak, team: null, ext: null, zep: null, note: s.note }); d[s.kind === 'zephyr' ? 'zep' : s.kind === 'external' ? 'ext' : 'team'] = s; }
    const gHere = [...gDrops.values()].filter((d) => d.soak || !/^This pull had no /.test(d.note || '')), gGone = [...gDrops.values()].filter((d) => !d.soak && /^This pull had no /.test(d.note || ''));
    const sSt = (s) => (!s || !s.soak ? 'na' : s.missing.length ? 'bad' : s.extra.length ? 'warn' : 'ok'), dSt = (x) => (!x || !x.soak ? 'na' : x.missing.length ? 'bad' : 'ok');
    const chipsOf = (x) => '<span class="chips">' + x.assigned.map((n) => '<span class="chipn' + (x.missing.includes(n) ? ' bad' : '') + '">' + who(n).replace(/^<span class="chipn">|<\/span>$/g, '') + '</span>').join('') + '</span>';
    const missTxt = (x) => (x.missing.length === x.assigned.length ? 'not done' : esc(andList(x.missing)) + ' missed');
    const teamLine = (s) => (s.missing.length ? pst('bad', esc(andList(s.missing)) + (s.missing.length === 1 ? ' wasn\'t in it' : ' weren\'t in it')) : pst('ok', 'everyone in')) + (s.extra.length ? pst('warn', 'also soaked: ' + esc(andList(s.extra))) : '');
    const extLine = (sk, x) => {
      // (who it came from only when that's not the assigned player, whose name is right above)
      const xs = (sk.ext || []).map((e) => spell(e.id, e.spell) + (x.assigned.includes(e.who) ? '' : ' <span class="sub">from ' + esc(e.who) + '</span>')).concat((sk.selfProt || []).map((sp, i) => spell((sk.selfIds || [])[i], sp) + ' <span class="sub">on themselves</span>'));
      return x.missing.length ? pst('bad', missTxt(x) + (xs.length ? '' : ' · no external')) + (xs.length ? '<div class="pdesc">Covered anyway: ' + xs.join(', ') + '</div>' : '') : pst('ok', 'done · ' + (xs.join(', ') || 'external'));
    };
    const zepLine = (sk, x) => {
      const by = [...new Set(sk.zep || [])], also = by.filter((n) => !x.assigned.includes(n)), cdNote = (sk.zepEarly || []).filter((z) => x.missing.includes(z.who)).map((z) => esc(z.who) + ' used it at ' + T(z.t) + ', so it was on cooldown');
      return x.missing.length ? pst('bad', missTxt(x) + (by.length ? '' : ' · no Zephyr')) + (by.length ? '<div class="pdesc">' + spell(374227, 'Zephyr') + ' from ' + esc(andList(by)) + ' instead</div>' : '') + cdNote.map((c) => '<div class="pdesc">' + c + '</div>').join('')
        : pst('ok', 'done · ' + spell(374227, 'Zephyr') + (also.length ? ' <span class="sub">· also ' + esc(andList(also)) + '</span>' : ''));
    };
    for (const d of gHere) {
      const sk = d.soak; if (!sk || !kept(sk.t)) continue; // (a drop after the wipe filter isn't counted)
      const at = '<b>' + esc(d.lab) + '</b>: ', w = T(sk.t);
      if (d.team && d.team.missing.length) probs.push({ sev: 'bad', html: at + esc(andList(d.team.missing)) + (d.team.missing.length === 1 ? ' wasn\'t' : ' weren\'t') + ' in the soak', when: w });
      if (d.team && d.team.extra.length) probs.push({ sev: 'warn', html: at + esc(andList(d.team.extra)) + ' soaked without being assigned', when: w });
      if (d.ext && d.ext.missing.length) probs.push({ sev: 'bad', html: at + esc(andList(d.ext.missing)) + ' didn\'t put an external on ' + esc(sk.target || 'the target'), when: w });
      if (d.zep && d.zep.missing.length) probs.push({ sev: 'bad', html: at + esc(andList(d.zep.missing)) + ' didn\'t cast Zephyr' + ((sk.zepEarly || []).some((z) => d.zep.missing.includes(z.who)) ? ' (it was on cooldown)' : ''), when: w });
    }
    if (gHere.length) {
      const none = '<span class="sub">none in the note</span>', col = (n) => { const p = pmap.get(n); return p ? p.color : 'inherit'; };
      // the tile: every drop before the wipe filter; then one row per phase with its drops (after the filter: greyed)
      const ps = gHere.filter((d) => d.soak && kept(d.soak.t)).flatMap((d) => [sSt(d.team), dSt(d.ext), dSt(d.zep)]).filter((x) => x !== 'na'), gnb = ps.filter((x) => x === 'bad').length, gnw = ps.filter((x) => x === 'warn').length;
      const gSt = !ps.length ? 'na' : gnb ? 'bad' : gnw ? 'warn' : 'ok', gTxt = !ps.length ? 'no drop before the wipe filter' : gnb ? gnb + ' of ' + ps.length + ' not done' : gnw ? plural(gnw, 'soak') + ' with extra soakers' : allOf(ps.length, 'done', 'done');
      addTile('as-guil', spellIcon(0, 'Guillotine', true), 'Guillotine', ps.length ? ps.length - gnb + '<span> / ' + ps.length + ' done</span>' : '—', gSt, gTxt);
      const rowOf = (d) => {
        const sk = d.soak;
        if (!sk) return '<tr><td><b>' + esc(d.lab || (d.team || d.ext || d.zep).label) + '</b></td><td colspan="3"><span class="sub">' + esc(d.note || '') + '</span></td></tr>';
        if (!kept(sk.t)) return '<tr class="rna"><td><b>' + esc(d.lab) + '</b><div class="sub">' + T(sk.t) + '</div></td><td colspan="3">' + pst('na', AFTER + ', not counted') + '</td></tr>';
        const all = [sSt(d.team), dSt(d.ext), dSt(d.zep)], row = all.includes('bad') ? 'rbad' : all.includes('warn') ? 'rwarn' : all.includes('ok') ? 'rok' : '';
        return '<tr class="' + row + '"><td><b>' + esc(d.lab.replace(/^P\d\s+/, '')) + '</b><div class="sub">' + T(sk.t) + (sk.target ? ' · on <span style="color:' + col(sk.target) + '">' + esc(sk.target) + '</span>' : '') + '</div></td>' +
          '<td>' + (d.team ? chipsOf(d.team) + teamLine(d.team) : none) + '</td><td>' + (d.ext ? chipsOf(d.ext) + extLine(sk, d.ext) : none) + '</td><td>' + (d.zep ? chipsOf(d.zep) + zepLine(sk, d.zep) : none) + '</td></tr>';
      };
      const gPh = new Map(); for (const d of gHere) { const m = /^P(\d)/.exec(d.lab || ''), k = d.soak ? phAt(d.soak.t) : m ? phOf(m[1]) : 'w'; if (!gPh.has(k)) gPh.set(k, []); gPh.get(k).push(d); }
      for (const [k, list] of gPh) {
        const p2 = list.filter((d) => d.soak && kept(d.soak.t)).flatMap((d) => [sSt(d.team), dSt(d.ext), dSt(d.zep)]).filter((x) => x !== 'na'), b2 = p2.filter((x) => x === 'bad').length, w2 = p2.filter((x) => x === 'warn').length;
        addSec({ id: 'as-guil-' + k, ph: k, ord: 1, tip: 'Guillotine', icon: spellIcon(0, 'Guillotine', true), title: 'Guillotine', sub: plural(list.length, 'drop') + ' · soak team, external and Zephyr',
          st: !p2.length ? 'na' : b2 ? 'bad' : w2 ? 'warn' : 'ok', txt: !p2.length ? (list.some((d) => d.soak) ? AFTER : 'didn\'t come up') : b2 ? b2 + ' of ' + p2.length + ' not done' : w2 ? plural(w2, 'soak') + ' with extra soakers' : allOf(p2.length, 'done', 'done'),
          how: 'Each drop has a soak team from the note. The player assigned the external puts one on the player the axe targets, and the assigned evoker casts Zephyr. A soaker who wasn\'t in it, or an external or Zephyr that didn\'t go out, is a miss; someone soaking who wasn\'t assigned could be better.',
          body: '<div class="scroll"><table class="tbl nsx gtl"><colgroup><col style="width:17%"><col style="width:37%"><col style="width:23%"><col style="width:23%"></colgroup><thead><tr><th>Drop</th><th>Soak team</th><th>External</th><th>Zephyr</th></tr></thead><tbody>' + list.map(rowOf).join('') + '</tbody></table></div>' });
      }
    }

    // ---- kick teams (text lines labelled Kick / Interrupt, by raid marker)
    const kSt = (k) => (k.missed ? 'bad' : k.outside.length ? 'warn' : 'ok');
    for (const k of a.kicks) if (k.missed) probs.push({ sev: 'bad', html: '<b>' + esc(k.label) + '</b>: ' + plural(k.missed, 'cast') + ' got through', when: '' });
    if (a.kicks.length) {
      const sts = a.kicks.map(kSt), knb = sts.filter((x) => x === 'bad').length, knw = sts.filter((x) => x === 'warn').length, kTxt = knb ? knb + ' of ' + sts.length + ' let casts through' : knw ? knw + ' kicked by someone else too' : 'nothing got through';
      addTile('as-kt', icoWh('ability_kick'), 'Kick teams', knb ? knb + '<span> / ' + sts.length + '</span>' : '✓', knb ? 'bad' : knw ? 'warn' : 'ok', kTxt);
      addSec({ id: 'as-kt', ph: 'w', ord: 5, icon: icoWh('ability_kick'), title: 'Kick teams', sub: plural(a.kicks.length, 'marker') + ' · kicks landed per assigned player', st: knb ? 'bad' : knw ? 'warn' : 'ok', txt: kTxt,
        how: 'Each raid marker has its kickers from the note. A cast from that marker\'s add that got through is a miss; someone kicking it who wasn\'t assigned could be better.',
        body: '<table class="tbl nsx"><thead><tr><th>Assignment</th><th>Assigned (kicks landed)</th><th>Kicked it without being assigned</th></tr></thead><tbody>' +
          a.kicks.map((k) => '<tr class="r' + kSt(k) + '"><td>' + (k.mark ? markIcon(k.mark) : '') + '<b>' + esc(k.label) + '</b>' + (k.missed ? pst('bad', plural(k.missed, 'cast') + ' got through') : k.outside.length ? pst('warn', 'kicked by someone not assigned too') : pst('ok', 'nothing got through')) + '</td><td><span class="chips">' + k.assigned.map((n) => '<span class="chipn' + (k.by.has(n) ? '' : ' bad') + '">' + who(n).replace(/^<span class="chipn">|<\/span>$/g, '') + '<b>' + (k.by.get(n) || 0) + '</b></span>').join('') + '</span></td><td>' + chips(k.outside, 'warn') + '</td></tr>').join('') + '</tbody></table>' });
    }

    // ---- orb carriers: per phase and orb colour; each assigned player shows the waves they picked one up in ("3/4").
    // Purple (hard-assigned): red if an assigned carrier picked up none, amber if one missed some waves or someone else
    // took an orb. Green (only listed): amber if an assigned carrier picked up none. The green backups sit in the green row.
    const orbsNow = a.orbs.filter((o) => o.note !== 'Phase not reached'), orbsLater = [...new Set(a.orbs.filter((o) => o.note === 'Phase not reached').map((o) => 'P' + o.ph))];
    const gOf = (o, n) => o.got.get(n) || { n: 0, of: 0 }, oSt = (o) => {
      if (o.kind === 'helper') return 'na';
      const gs = o.assigned.map((n) => gOf(o, n)).filter((g) => g.of > 0 && o.waves != null);
      if (o.kind === 'green') return gs.some((g) => g.n === 0) ? 'warn' : 'ok';
      return gs.some((g) => g.n === 0) ? 'bad' : gs.some((g) => g.n < g.of) || o.outside.size ? 'warn' : 'ok';
    };
    const zeroOf = (o) => o.assigned.filter((n) => { const g = gOf(o, n); return o.waves != null && g.of > 0 && g.n === 0; });
    const oTxt = (o) => { const z = zeroOf(o), part = o.assigned.filter((n) => { const g = gOf(o, n); return g.of > 0 && g.n > 0 && g.n < g.of; });
      return z.length ? esc(andList(z)) + ' picked up none' : o.kind === 'purple' && o.outside.size ? (o.outside.size === 1 ? 'someone else took one' : o.outside.size + ' others took one') : esc(andList(part)) + ' missed some waves'; };
    for (const o of orbsNow) {
      if (o.kind === 'helper') continue;
      const z = zeroOf(o), ex = [...o.outside], at = '<b>' + esc(o.label) + '</b>: ', took = esc(andList(ex.map(([n, x]) => n + (x.n > 1 ? ' (' + x.n + ')' : '')))) + ' took ' + (ex.length === 1 && ex[0][1].n === 1 ? 'one' : 'orbs') + ' without being assigned';
      if (o.kind === 'purple' && z.length) probs.push({ sev: 'bad', html: at + esc(andList(z)) + ' picked up none' + (ex.length ? '; ' + took : ''), when: 'P' + o.ph });
      else if (o.kind === 'purple' && ex.length) probs.push({ sev: 'warn', html: at + took, when: 'P' + o.ph });
      else if (o.kind === 'green' && z.length) probs.push({ sev: 'warn', html: at + esc(andList(z)) + ' picked up none', when: 'P' + o.ph });
    }
    const helperOf = (o) => orbsNow.find((x) => x.kind === 'helper' && x.ph === o.ph);
    const shown = orbsNow.filter((o) => o.kind !== 'helper' || !orbsNow.some((x) => x.kind === 'green' && x.ph === o.ph));
    const orbChip = (o, n) => { const g = gOf(o, n), judged = o.kind !== 'helper' && g.of > 0 && o.waves != null, zero = judged && g.n === 0, full = judged && g.n === g.of, part = judged && !zero && !full, green = o.kind === 'green';
      return '<span class="chipn' + (zero ? (green ? ' warn' : ' bad') : part ? (green ? '' : ' warn') : '') + '">' + who(n).replace(/^<span class="chipn">|<\/span>$/g, '') + '<b>' + (o.waves != null ? (g.of ? g.n + '/' + g.of : '—') : g.n) + '</b></span>'; };
    const others = (o) => {
      if (o.kind === 'purple') return o.outside.size ? '<div class="sub" style="margin-bottom:3px">Took one without being assigned</div><span class="chips">' + [...o.outside].map(([n, x]) => '<span class="chipn warn">' + who(n).replace(/^<span class="chipn">|<\/span>$/g, '') + '<b>' + x.n + '</b></span>').join('') + '</span>' : '<span class="sub">nobody else took one</span>';
      if (o.kind === 'green') { const hp = helperOf(o), bk = hp ? hp.assigned.map((n) => [n, gOf(hp, n).n]).filter(([, c]) => c > 0) : [];
        return '<div class="pdesc">' + [hp ? (bk.length ? 'Backups: ' + bk.map(([n, c]) => esc(n) + ' ' + c).join(', ') : 'No backups needed') : '', o.outside.size ? 'Also: ' + [...o.outside].map(([n, x]) => esc(n) + ' ' + x.n).join(', ') : ''].filter(Boolean).join('<br>') + '</div>'; }
      return '<span class="sub">backups, not judged</span>';
    };
    const oSts = shown.map(oSt).filter((x) => x !== 'na'), onb = oSts.filter((x) => x === 'bad').length, onw = oSts.filter((x) => x === 'warn').length;
    const oStAll = !oSts.length ? 'na' : onb ? 'bad' : onw ? 'warn' : 'ok', oTxtAll = onb ? onb + ' of ' + oSts.length + ' orb groups failed' : onw ? onw + ' of ' + oSts.length + ' orb groups not clean' : 'everyone took theirs';
    if (shown.length) addTile('as-orbs', spellIcon(0, 'Mutagenic Venom', true), 'Orb carriers', oSts.length ? oSts.length - onb - onw + '<span> / ' + oSts.length + ' clean</span>' : '—', oStAll, oTxtAll);
    // one row per orb group (purple, green), under its phase
    const ORB_HOW = { purple: 'Purple orbs are hard-assigned: each listed carrier picks one up every wave. A carrier who picked up none is a miss; missing some waves, or someone else taking one, could be better.',
      green: 'Green orbs are listed, not hard-assigned: an assigned carrier who picked up none could be better. Backups are shown but not judged.' };
    shown.forEach((o, oi) => {
      const st = oSt(o), purple = o.kind === 'purple', green = o.kind === 'green';
      addSec({ id: 'as-orbs-' + oi, ph: phOf(o.ph), ord: purple ? 2 : 3, tip: purple ? 'Mutagenic Venom' : green ? 'Volatile Venom' : '', icon: spellIcon(0, purple ? 'Mutagenic Venom' : 'Volatile Venom', true), title: purple ? 'Purple orbs' : green ? 'Green orbs' : esc(o.label),
        sub: esc(o.note || '') + ' · ' + plural(o.assigned.length, 'carrier'), st, txtHtml: st === 'bad' || st === 'warn' ? oTxt(o) : st === 'ok' ? 'everyone took theirs' : 'not judged', how: ORB_HOW[o.kind] || 'Backups, shown for reference and not judged.',
        body: '<div class="scroll"><table class="tbl nsx otl"><colgroup><col style="width:17%"><col style="width:48%"><col style="width:35%"></colgroup><thead><tr><th>Orbs</th><th>Assigned (waves picked up)</th><th>Others</th></tr></thead><tbody>' +
          '<tr class="' + (st === 'na' ? '' : 'r' + st) + '"><td><b>' + esc(o.label.replace(/^P\d\s*·\s*/, '')) + '</b><div class="sub">' + esc(o.note) + '</div></td><td><span class="chips">' + o.assigned.map((n) => orbChip(o, n)).join('') + '</span></td><td>' + others(o) + '</td></tr></tbody></table></div>' });
    });

    // ---- the quiet rows: cooldown reminders, checks that didn't come up, names not in the pull, other note lines
    let hcdLater = 0;
    if (a.cds.length) {
      // healing cooldowns (the note's reminders): their own group at the end, apart from the mechanical assignments and the
      // box on top, one row per phase; reminders after the wipe filter are greyed and not counted
      const due = a.cds.filter((c) => c.expected != null && c.expected <= r.duration && kept(c.expected)), late = due.filter((c) => c.status !== 'on time').length;
      const missedN = due.filter((c) => c.status === 'missed').length, lateN = late - missedN;
      const hSt = !due.length ? 'na' : missedN ? 'bad' : late ? 'warn' : 'ok', hTxt = !due.length ? 'none came up' + (isFinite(ct) ? ' before the wipe filter' : ' this pull') : late ? [missedN ? missedN + ' missed' : '', lateN ? lateN + ' late or early' : ''].filter(Boolean).join(' · ') : allOf(due.length, 'pressed on time', 'on time');
      addTile('as-hcd', icoWh('spell_holy_divinehymn'), 'Healing cooldowns', due.length ? due.length - late + '<span> / ' + due.length + ' on time</span>' : '—', hSt, hTxt);
      const res = (c) => { if (c.expected != null && !kept(c.expected)) return hst('na', AFTER); const s = c.status, k = s === 'on time' ? 'ok' : s === 'missed' ? 'bad' : s === 'late' || s === 'early' ? 'warn' : 'na'; return hst(k, s === 'late' || s === 'early' ? Math.abs(c.delta).toFixed(1) + 's ' + s : s); };
      const rowH = (c) => '<tr class="' + (kept(c.expected) ? ({ 'on time': 'rok', late: 'rwarn', early: 'rwarn', missed: 'rbad' }[c.status] || '') : 'rna') + '"><td>' + who(c.player) + '</td><td>' + spell(c.spellid, c.spell || ('Spell ' + c.spellid)) + '</td><td class="tc">ph:' + c.ph + ' + ' + T(c.time) + '</td><td class="tc">' + (c.expected != null ? T(c.expected) : '—') + '</td><td class="tc">' + (c.used != null ? T(c.used) + ' <span class="sub">(' + (c.delta >= 0 ? '+' : '') + c.delta.toFixed(1) + 's)</span>' : '—') + '</td><td class="cdr">' + res(c) + '</td></tr>';
      const hPh = new Map(); for (const c of a.cds) { const k = c.phName || 'Other'; if (!hPh.has(k)) hPh.set(k, []); hPh.get(k).push(c); }
      let hi = 0;
      for (const [name, list] of hPh) {
        if (/^phase not reached$/i.test(name)) { hcdLater += list.length; continue; } // (named once under About the note instead)
        const d2 = list.filter((c) => c.expected != null && c.expected <= r.duration && kept(c.expected)), l2 = d2.filter((c) => c.status !== 'on time').length, m2 = d2.filter((c) => c.status === 'missed').length;
        addSec({ id: 'as-hcd-' + hi, ph: 'hcd', ord: hi++, icon: icoWh('spell_holy_divinehymn'), title: esc(capS(name)), sub: plural(list.length, 'reminder'),
          st: !d2.length ? 'na' : m2 ? 'bad' : l2 ? 'warn' : 'ok', txt: !d2.length ? (list.some((c) => c.expected != null && c.expected <= r.duration) ? AFTER : 'didn\'t come up') : l2 ? [m2 ? m2 + ' missed' : '', l2 - m2 ? (l2 - m2) + ' late or early' : ''].filter(Boolean).join(' · ') : allOf(d2.length, 'pressed on time', 'on time'),
          how: hi === 1 ? 'The cooldown reminders in the note: pressed within 3 seconds of the reminder is on time, later or earlier than that is late or early, and not pressed at all is missed. Reminders after the wipe filter are greyed and not counted.' : '',
          body: '<div class="scroll"><table class="tbl nsx"><thead><tr><th>Player</th><th>Spell</th><th>Note time</th><th>Expected</th><th>Pressed</th><th>Result</th></tr></thead><tbody>' + list.map(rowH).join('') + '</tbody></table></div>' });
      }
    }
    const later = gGone.map((d) => d.lab).concat(orbsLater.map((p) => p + ' orb assignments'), caLater, hcdLater ? [plural(hcdLater, 'healing cooldown reminder') + ' from later phases'] : []);
    if (later.length) quiet.push(qline('Not in this pull', esc(later.join(', '))));
    if (a.unknownNames.length) quiet.push(qline('In the note but not in this pull', esc(a.unknownNames.join(', ')) + ' <span class="sub">(sat out, a nickname, or misspelled)</span>'));
    if (a.other.length) quiet.push(qfold('Other note lines', plural(a.other.length, 'line') + ' shown for reference, not checked', '', a.other.map((o) => '<div class="drow"><b style="min-width:140px">' + esc(o.label || '—') + '</b>' + chips(o.names) + '</div>').join('')));
  }
  if (!editing) quiet.push(qfold('What the note is checked for', '', '', '<p class="muted" style="font-size:13px;margin:0">' + checked + '</p>'));
  // the box on top: everything that went wrong this pull, worst first (or one green line when nothing did)
  let box = '';
  if (!only && a && !a.error) {
    const any = a.soaks.length || a.orbs.length || a.kicks.length || B.feast || B.kicks || (B.ca && !B.ca.none) || B.orbcc || B.sides || (B.sz && (B.sz.mut || B.sz.timer)) || (B.nz && (B.nz.well || B.nz.pyre)) || a.mcCC || a.curses || (a.ghosts && a.ghosts.reached); // (mechanical assignments; healing cooldowns have their own panel)
    // (the same "What went wrong / What went right" pair as Latest pull and Mechanics; right: every assignment that was clean)
    const right = tiles.filter((t) => t.st === 'ok').map((t) => '<b>' + esc(t.label) + ':</b> ' + esc(t.txt));
    if (probs.length || any) box = wrongRight(probs, right, { sub: isFinite(ct) ? 'up to the wipe filter (' + T(ct) + ')' : '', none: 'Every assignment in the note that came up this pull was done.', noneRight: 'Nothing fully clean this pull.', moreWhere: 'in the rows below' });
  }
  // the page: the tiles (one per assignment, click to jump), what went wrong, then the panels in fight order (Twin Fangs:
  // Feasts, Broodlings, globules; Coiled Altar: Guillotine and orbs in P1, then the Soulcoiler kicks), healing cooldowns,
  // and the note itself and other reference lines at the bottom
  // the sections, as on Mechanics: under their phase in fight order (Guillotine, orbs, kicks), then the whole-fight ones,
  // then healing cooldowns; each a fold-out row (icon, title, a short summary, its status), closed until clicked
  const stH = (st, html) => '<span class="sst ' + st + '">' + ({ bad: '✕ ', warn: '! ', ok: '✓ ' }[st] || '') + html + '</span>';
  // (the icon and title carry the same hover tooltip as on Mechanics: the spell's description when there's one, plus how it's checked)
  const tipOf = (o) => { const n = o.tip || String(o.title).replace(/<[^>]+>/g, ''), sid = o.tip ? E.SPELLID.get(o.tip.toLowerCase()) || 0 : 0, ex = String(o.how || '').replace(/<[^>]+>/g, '');
    return ' class="sp sechd" data-sid="' + sid + '" data-sn="' + esc(n) + '" data-ex="' + esc(ex.length > 240 ? ex.slice(0, 237) + '…' : ex) + '"'; };
  const secRow = (o) => '<details class="panel secd st-' + o.st + '" id="' + o.id + '" data-k="' + o.id + '"' + (S.openSecs.has(o.id) ? ' open' : '') + '><summary><span' + tipOf(o) + '>' + o.icon + '<b>' + o.title + '</b></span>' + (o.sub ? ' <span class="sub">' + o.sub + '</span>' : '') + (o.txtHtml != null ? stH(o.st, o.txtHtml) : hst(o.st, o.txt)) + '</summary>' +
    '<div class="secbody">' + (o.how ? '<details class="howit"><summary>How it works</summary><div>' + o.how + '</div></details>' : '') + o.body + '</div></details>';
  const phaseBlock = (name, sub, list) => { const nb = list.filter((o) => o.st === 'bad').length, nw = list.filter((o) => o.st === 'warn').length, judged = list.some((o) => o.st !== 'na');
    return '<details class="phase" open><summary><b>' + name + '</b>' + (sub ? ' <span class="sub">' + sub + '</span>' : '') + hst(!judged ? 'na' : nb ? 'bad' : nw ? 'warn' : 'ok', !judged ? 'not judged' : nb ? plural(nb, 'problem') + (nw ? ' · ' + nw + ' could be better' : '') : nw ? nw + ' could be better' : 'clean') + '</summary>' +
      list.sort((x, y) => x.ord - y.ord).map(secRow).join('') + '</details>'; };
  PHS.forEach((p, k) => { const list = secs.filter((o) => o.ph === k); if (list.length) h += phaseBlock(esc(p.name), isFinite(p.end) ? T(p.start) + '–' + T(p.end) : '', list); });
  { const list = secs.filter((o) => o.ph === 'w'); if (list.length) h += phaseBlock('Whole fight', PHS.length ? 'assignments that aren\'t tied to one phase' : '', list); }
  { const list = secs.filter((o) => o.ph === 'hcd'); if (list.length) h += phaseBlock('Healing cooldowns', 'the cooldown reminders in the note, kept apart from the mechanics', list); }
  const ORDER = ['feast', 'bk', 'orbcc', 'guil', 'orbs', 'mc', 'ca', 'curse', 'ghost', 'kt', 'hcd'];
  tiles.sort((x, y) => ORDER.indexOf(x.id.slice(3)) - ORDER.indexOf(y.id.slice(3))); // (the tiles in fight order too)
  // (one row as wide as the tiles there are, up to 6: six tiles in a row of five left one alone on a second row)
  const tileRow = tiles.length ? '<div class="pts as-tiles' + (tiles.length <= 4 ? ' four' : '') + ' an' + Math.min(6, tiles.length) + '">' + tiles.map((t) => '<a class="pt-go" href="#' + t.id + '">' + plTile(t.pic, t.label, t.v, t.st, t.txt) + '</a>').join('') + '</div>' : '';
  $('#assignBox').innerHTML = '<div class="nsa">' + top + tileRow + box + h + (quiet.length ? '<div class="panel quiet"><div class="q-h">About the note</div>' + quiet.join('') + '</div>' : '') + '</div>';
  // (a tile opens its section if it's folded, then scrolls to it under the sticky tabs)
  $$('#assignBox details.secd[data-k]').forEach((d) => (d.ontoggle = () => { if (d.open) S.openSecs.add(d.dataset.k); else S.openSecs.delete(d.dataset.k); }));
  $$('#assignBox .pt-go').forEach((x) => (x.onclick = (e) => { e.preventDefault(); const id = x.getAttribute('href').slice(1), el = document.getElementById(id) || document.querySelector('#assignBox [id^="' + id + '-"]'); if (!el) return; if (el.tagName === 'DETAILS') el.open = true; window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70 }); }));
  const save = () => { const v = $('#noteBox').value.trim(); if (v) store.set(noteKey(boss), v); else localStorage.removeItem(noteKey(boss)); S.noteEdit = false; for (const rep of CACHE.values()) if (rep.item.boss === boss) applyNote(rep); renderMain(); };
  if ($('#noteSave')) $('#noteSave').onclick = save;
  if ($('#noteCancel')) $('#noteCancel').onclick = () => { S.noteEdit = false; assign(only); refreshIcons(); };
  if ($('#noteDel')) $('#noteDel').onclick = () => { if (confirm('Remove the saved note for ' + boss + '?')) { localStorage.removeItem(noteKey(boss)); S.noteEdit = false; for (const rep of CACHE.values()) if (rep.item.boss === boss) applyNote(rep); renderMain(); } };
  if ($('#noteEditBtn')) $('#noteEditBtn').onclick = () => { S.noteEdit = true; assign(only); };
}

// ---------- death cutoff ----------
// Once enough of the raid is dead the pull is lost, and what happens next (wipe chaos) isn't worth auditing.
// On a wipe, the audit stops at the Nth player death (typed in, saved on this PC; 0 or blank = off). Kills are always audited in full.
// (new key: earlier test builds saved 4 under 'wla-death-cut'; the default is now 2)
function deathCutN() { const v = store.get('wla-death-cut2'); return v == null || v === '' ? 2 : +v; }
const CUT_WHY = 'Why filter? Once a pull is lost, players die one after another and mechanics stop being played on purpose. Everything after that point is noise: it piles up mistakes and blames people for a wipe that had already happened. Stopping the audit at the Nth death keeps the review on what actually caused the wipe. Kills are always audited in full. Raise the number if your raid often recovers from early deaths; 0 turns the filter off.';
function cutInfo(r) {
  const n = deathCutN(); if (!n || !r || r.item.kill) return null;
  const ds = r.deaths.slice().sort((a, b) => a.t - b.t);
  return ds.length >= n ? { t: ds[n - 1].t, n, who: ds[n - 1].player } : null;
}
const cutT = (r) => { const c = cutInfo(r); return c ? c.t : Infinity; };
const keptDeaths = (r) => { const t = cutT(r); return r.deaths.filter((d) => d.t <= t + 0.05); };
const keptMistakes = (r) => { const t = cutT(r); return r.mistakes.filter((m) => m.t <= t + 0.05); };
// The module's results with everything after the cutoff removed: timed rows, sets, and phases that start after it.
// (Rows without a time, e.g. a player's peak stacks, are whole-pull totals and stay.)
function cutModule(m, t) {
  if (!isFinite(t)) return { m, hidden: 0 };
  let hidden = 0;
  const rowT = (row) => { const c = row.find((x) => x.t != null); return c ? c.t : null; };
  const keep = (row) => { const rt = rowT(row); const ok = rt == null || rt <= t + 0.05; if (!ok) hidden++; return ok; };
  const sections = m.sections.map((s) => ({ ...s, rows: s.rows.filter(keep),
    // (a set that knows how to re-cut itself, like an avoidable damage source, is built again from what happened up to t)
    groups: (s.groups || []).flatMap((g) => { if (g.recut) { const c = g.recut(t); hidden += g.rows.length - (c ? c.rows.length : 0); return c ? [{ ...c, recut: g.recut }] : []; }
      const ok = g.t == null || g.t <= t + 0.05; if (!ok) { hidden += g.rows.length; return []; } return [{ ...g, sub: g.cutSub ? g.cutSub(t) : g.sub, rows: g.rows.filter(keep) }]; }) }))
    .filter((s) => s.rows.length || s.groups.length || !m.sections.find((x) => x.id === s.id).rows.length && !(m.sections.find((x) => x.id === s.id).groups || []).length);
  const phases = m.phases.filter((p) => p.start <= t).map((p) => ({ ...p, end: Math.min(p.end, t) }));
  return { m: { ...m, sections, phases }, hidden };
}

// ---------- fight audit (boss-specific modules) ----------
// The one place for mechanical mistakes: boss mechanic sections (when the fight has a module), mistakes by
// player from the rule packs, interrupts and NSRT assignments. Deaths and healing stay on their own tabs.
function audit() {
  const r = S.rep, m0 = r.module || { title: (r.item.kind === 'run' ? r.item.boss : r.item.diff + ' ' + r.item.boss) + ': mechanics', sections: [], phases: [], marks: [], mistakes: [] };
  if (m0.error) { view('<div class="panel">The audit for this fight hit an error: ' + esc(m0.error) + '</div>'); return; }
  // deaths are one of the mechanics (split by phase like the rest); the old Deaths tab lives here now
  const cut = cutInfo(r), { m, hidden } = cutModule({ ...m0, sections: m0.sections.concat(r.noDeathSec ? [] : [deathSection(r)]) }, cut ? cut.t : Infinity);
  const hiddenMk = cut ? r.mistakes.filter((x) => x.t > cut.t + 0.05 && x.mechanic !== 'Death').length : 0;
  // NSRT note: show each Guillotine assignment on its soak row (who was assigned but missing, who soaked unassigned)
  const qs = r.assign && !r.assign.error && m.sections.find((s) => s.id === 'soakq');
  if (qs) for (const a of r.assign.soaks) if (a.soak && (a.kind || 'soak') === 'soak') {
    const row = qs.rows.find((rw) => rw[0].t != null && Math.abs(rw[0].t - a.soak.t) < 0.6); if (!row || !row[3]) continue;
    const bits = [(a.missing || []).length ? 'assigned, not in it: ' + a.missing.join(', ') : '', (a.extra || []).length ? 'not assigned: ' + a.extra.join(', ') : ''].filter(Boolean);
    row[3] = { ...row[3], sub: (a.label || 'NSRT') + ': ' + (bits.join(' · ') || 'everyone assigned was in it'), warn: bits.length > 0 || row[3].warn };
  }
  const pmap = new Map(players().map((p) => [p.name, p]));
  const who = (n) => { const p = pmap.get(n); return p ? '<span class="who sm">' + avatar(p, true) + '<span class="nm" style="color:' + p.color + '">' + esc(n) + '</span></span>' : '<b>' + esc(n) + '</b>'; };
  const AM = []; AUDITMAPS = AM;
  const AH = []; AUDITHTML = AH; // html shown under a row by its Recap / Details button
  // c.sub: a second, smaller line under the cell (red when c.bad on a player or spell cell)
  const cell = (c, sid) => cell0(c, sid) + (c.sub ? '<div class="' + (c.bad && (c.p || c.s) ? 'hotv' : 'sub') + '" style="font-size:12px">' + esc(c.sub) + '</div>' : '');
  const cell0 = (c, sid) => c.more ? (AH.push(c.more), '<button class="btn mmb2" data-h="' + (AH.length - 1) + '"' + (c.dg ? ' data-dg="' + esc(c.dg) + '"' : '') + '>' + esc(c.label || 'Details') + '</button>') : c.maps ? '<span style="display:inline-flex;gap:4px">' + c.maps.map(([label, mp]) => (AM.push(mp), '<button class="btn mmb" data-sec="' + sid + '" data-i="' + (AM.length - 1) + '">' + esc(label) + '</button>')).join('') + '</span>'
    : c.pt ? '<span class="chips">' + c.pt.map(([n, lab, k]) => '<span class="ptag' + (k ? ' ' + k : '') + '">' + who(n) + (lab ? '<i>' + esc(lab) + '</i>' : '') + '</span>').join('') + '</span>' // players with a badge (e.g. soakers and their immunity)
    : c.map ? (AM.push(c.map), '<button class="btn mmb" data-sec="' + sid + '" data-i="' + (AM.length - 1) + '">Map</button>') : c.t != null ? '<span class="tc">' + T(c.t) + '</span>' : c.ps ? (c.ps.length ? '<span class="chips">' + c.ps.map(who).join('') + '</span>' : '<span class="sub">' + esc(c.none || '') + '</span>') : c.g ? '<span class="gcell">' + gradeChip(c.g) + '<b>' + c.gs + '</b></span>' : c.p ? who(c.p) : c.s ? spell(c.s[0], c.s[1]) : c.n != null ? C(c.n)
    : '<span class="' + (c.bad ? 'hotv' : c.dim ? 'sub' : '') + '">' + esc(c.txt) + '</span>';
  const vb = { good: ['b-good', 'Clean'], warn: ['b-med', 'Some mistakes'], bad: ['b-high', 'Problems'] };
  // (the fight timeline panel was removed: the audit is organized by phase below instead)
  // (the page header already names the boss and difficulty; only a module note is worth a line here)
  let h = m.note ? '<p class="muted" style="margin:0 0 10px">' + esc(m.note) + '</p>' : '';
  // a boss without its own mechanic checks yet: say so, so the short page doesn't look broken
  if (!(r.module && !r.module.error && r.module.sections && r.module.sections.length)) h += '<div class="nomod"><b>Mechanic checks for ' + esc(r.item.boss) + ' aren\'t built yet.</b> This pull shows deaths, defensives, potions and Healthstones, the raid cooldowns timeline and interrupts. The Coiled Altar and The Twin Fangs have full mechanic checks.</div>';
  // the wipe filter as one quiet line: where this pull's audit stops (the setting itself is on the tab bar, just above)
  h += '<div class="cutbar' + (cut ? ' on' : '') + '"><span class="cutnow">' + (r.allPulls ? (deathCutN() ? 'Each wipe counts up to its <b>' + ordinal(deathCutN()) + ' death</b>; kills count in full' : '<b>Wipe filter off</b>: every pull counts in full') : cut ? '<b>Audited up to ' + T(cut.t) + '</b>, the ' + ordinal(cut.n) + ' death (' + esc(cut.who) + '); ' + pl2(hidden + hiddenMk, 'result') + ' after it ' + (hidden + hiddenMk === 1 ? 'is' : 'are') + ' hidden'
      : r.item.kill ? '<b>Kill</b>: the whole pull is audited' : deathCutN() ? 'Fewer than ' + deathCutN() + ' deaths: the whole pull is audited' : 'Wipe filter off: the whole pull is audited') + '</span></div>';  // Highest-priority fixes first: problems, then some mistakes, then clean; within each, the most flagged rows first.
  // Interrupts (shown here instead of their own tab) are ranked the same way.
  const rank = { bad: 0, warn: 1, good: 2 };
  const missedN = (r.kicks || []).reduce((s, k) => s + k.missed, 0);
  const secs = m.sections.map((s) => ({ s, v: s.verdict, n: s.rows.concat(...(s.groups || []).map((g) => g.rows)).filter((row) => row.some((c) => c.bad)).length }))
    // fights with a module show Interrupts as one of their mechanics (split by phase); others keep the old block
    .concat(m.sections.some((x) => x.id === 'kicks') || m.kicksMerged ? [] : [{ kick: true, v: missedN > 2 ? 'bad' : missedN ? 'warn' : 'good', n: missedN }])
    .sort((a, b) => rank[a.v] - rank[b.v] || b.n - a.n);
  // Split each mechanic by phase: rows (or sets) go to the phase their time falls in; a mechanic with no timed
  // rows goes to the phase named like it (e.g. Intermission) or to "Whole fight".
  // (a module can group its mechanics by something other than time, e.g. Entombed Sentinels by boss: each section
  // whole, in its group; a section in no group goes to the one marked rest)
  const byGroup = m.sectionGroups && m.sectionGroups.length;
  const phs = byGroup ? m.sectionGroups.map((g) => ({ ...g, start: 0, end: Infinity })) : m.phases.length ? m.phases : [{ name: 'Mechanics', start: 0, end: Infinity }];
  const phaseOf = (t) => { let k = 0; phs.forEach((p, i) => { if (t >= p.start - 0.5) k = i; }); return k; };
  const rowT = (row) => { const c = row.find((x) => x.t != null); return c ? c.t : null; };
  const buckets = phs.map(() => []), whole = [];
  for (const { s } of secs.filter((x) => !x.kick)) {
    if (byGroup) { let k = phs.findIndex((g) => (g.ids || []).includes(s.id)); if (k < 0) k = Math.max(0, phs.findIndex((g) => g.rest)); buckets[k].push({ s, rows: s.rows, groups: s.groups || [] }); continue; }
    const per = phs.map(() => ({ rows: [], groups: [] }));
    let timed = false;
    for (const g of s.groups || []) { if (g.t != null && g.title !== 'Other') { per[phaseOf(g.t)].groups.push(g); timed = true; } else per[0].groups.push(g); }
    for (const row of s.rows) { const t = rowT(row); if (t != null) { per[phaseOf(t)].rows.push(row); timed = true; } else per[0].rows.push(row); }
    if (!timed && phs.length > 1) {
      const k = phs.findIndex((p) => s.title.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]) || p.name.toLowerCase().includes(s.title.split(':')[0].toLowerCase().split(' ')[0]));
      (k >= 0 ? buckets[k] : whole).push({ s, rows: s.rows, groups: s.groups || [] });
      continue;
    }
    per.forEach((p, i) => { if (p.rows.length || p.groups.length) buckets[i].push({ s, rows: p.rows, groups: p.groups }); });
    if (!per.some((p) => p.rows.length || p.groups.length)) whole.push({ s, rows: [], groups: [] });
  }
  const firstAt = new Map(); buckets.forEach((b, i) => b.forEach(({ s }) => { if (!firstAt.has(s.id)) firstAt.set(s.id, i); })); whole.forEach(({ s }) => { if (!firstAt.has(s.id)) firstAt.set(s.id, 'w'); });
  // One slim chip per mechanic: its status (red / amber / green) and problem count; click to open it.
  // (Mistakes by player was removed: every mistake is already on its mechanic's row.)
  {
    const cnt = (s) => { const all = s.rows.concat(...(s.groups || []).map((g) => g.rows)), b = all.filter((row) => row.some((c) => c.bad)).length;
      return { b, w: all.filter((row) => !row.some((c) => c.bad) && row.some((c) => c.warn)).length }; };
    // tiles: problems first, then could be better, then clean; within each, by importance (IMPORTANCE)
    const impT = IMPORTANCE[r.item.boss] || [], ixT = (s) => (s.id === 'deaths' ? -1 : impT.indexOf(s.id) < 0 ? 99 : impT.indexOf(s.id)), tierT = (s) => { const c = cnt(s); return c.b ? 0 : c.w ? 1 : s.info ? 3 : 2; };
    // A slim scoreboard: one chip per mechanic with a problem (✕ problems, ! could be better), worst first, each a link to
    // its section; the clean ones in one chip at the end. (It replaced a grid of tiles, and "What went wrong / right"
    // is on Latest pull only, so the first mechanic is on the first screen.)
    const ord = secs.filter((x) => !x.kick && firstAt.has(x.s.id)).sort((a, b) => tierT(a.s) - tierT(b.s) || ixT(a.s) - ixT(b.s)).map(({ s }) => s);
    const icon = (s) => (s.spell[0] || E.SPELLID.get(String(s.spell[1]).toLowerCase()) ? '<span class="sp" data-sid="' + (s.spell[0] || 0) + '" data-sn="' + esc(s.spell[1]) + '">' + spellIcon(s.spell[0], s.spell[1]) + '</span>' : spellIcon(s.spell[0], s.spell[1]));
    const href = (s) => '#sec-' + s.id + '-' + firstAt.get(s.id);
    const chips = ord.filter((s) => tierT(s) < 2).map((s) => { const { b, w } = cnt(s), cls = b ? 'bad' : 'warn';
      return '<a class="msc tlink ' + cls + '" href="' + href(s) + '" title="' + esc(s.summary) + '">' + icon(s) + '<span class="msc-n">' + esc(s.title.split(': ')[0]) + '</span><span class="msc-s ' + cls + '">' + (b ? '✕ ' + b : '! ' + w) + (b && w ? ' <i>! ' + w + '</i>' : '') + '</span></a>'; });
    const clean = ord.filter((s) => tierT(s) >= 2);
    if (clean.length) chips.push('<a class="msc tlink ok" href="' + href(clean[0]) + '" title="' + esc(clean.map((s) => s.title.split(': ')[0] + (s.info ? ' (' + s.info + ')' : '')).join(', ')) + '"><span class="msc-n">' + (chips.length ? '+' + clean.length + ' clean' : 'All ' + clean.length + ' clean') + '</span><span class="msc-s ok">✓</span></a>');
    if (chips.length) h += '<div class="mscore">' + chips.join('') + '</div>';
  }
  // "What went wrong": a short synopsis built from this phase's flagged rows, e.g.
  // "2:08 Guillotine: In circle 5 / 6 · Target Xyron (no protection) · Died Chumfu"
  const cellText = (c) => c.txt || (c.s && c.s[1]) || c.p || (c.ps && c.ps.join(', ')) || (c.pt && c.pt.map((x) => x[0]).join(', ')) || (c.n != null ? C(c.n) : '') || '';
  const say = (col, c) => {
    let v = cellText(c); if (!String(v).trim()) return '';
    if (/^died$/i.test(col) && v === 'alive') return 'never killed';
    // names and spells read on their own; other values keep their column name ("In circle 5 / 6")
    // (a value that already says its column, like "died" under Died, reads on its own: no "Died died")
    const sayCol = col && !(c.s || c.p) && !/^(result|rating)$/i.test(col) && !String(v).toLowerCase().startsWith(col.toLowerCase());
    return (sayCol ? col + ' ' : '') + v + (c.sub ? ' (' + c.sub + ')' : '');
  };
  const rowParts = (s, row) => {
    const t = row.find((c) => c.t != null), first = row.find((c) => c.t == null && !c.map && !c.maps && !c.more);
    const label = ((t ? T(t.t) + ' ' : '') + (first ? cellText(first) + (first.bad && first.sub ? ' (' + first.sub + ')' : '') : '')).trim();
    const bits = row.map((c, i) => ({ c, col: s.cols[i] || '' })).filter(({ c }) => (c.bad || c.warn) && c !== first && !c.map && !c.maps && !c.more).map(({ c, col }) => say(col, c)).filter(Boolean);
    return { label, bits: bits.join(' · '), name: first ? cellText(first) : '' };
  };
  const rowLine = (s, row) => { const p = rowParts(s, row); return p.label + (p.bits ? ': ' + p.bits : ''); };
  // Three levels: red = went wrong (costly: deaths, wipes, big damage), amber = could be better (not fatal on its
  // own, e.g. an extra soak), green = went well. Cells carry `bad` or `warn`; a row takes its worst cell.
  const isBadRow = (row) => row.some((c) => c.bad), isWarnRow = (row) => !isBadRow(row) && row.some((c) => c.warn);
  const collect = (s, rows, groups, rowTest, grpTest) => {
    const items = [];
    for (const g of groups) {
      const hit = g.rows.filter(rowTest);
      if (!grpTest(g) && !hit.length) continue;
      if (!hit.length) items.push(g.title + ' (' + T(g.t) + '): ' + g.sub);
      for (const row of hit) items.push(g.title + ', ' + rowLine(s, row));
    }
    // identical problems on several rows (e.g. 19 players at 5 stacks) collapse into one line
    const same = new Map();
    for (const row of rows) if (rowTest(row)) { const p = rowParts(s, row); const k = p.bits || p.label; if (!same.has(k)) same.set(k, []); same.get(k).push(p); }
    for (const [k, list] of same) {
      if (list.length >= 3 && list[0].bits) items.push(list.length + ' players: ' + k + ' (' + list.slice(0, 3).map((p) => p.name).join(', ') + (list.length > 3 ? ', +' + (list.length - 3) + ' more' : '') + ')');
      else for (const p of list) items.push(p.label + (p.bits ? ': ' + p.bits : ''));
    }
    return items;
  };
  const box = (cls, head, items) => { if (!items.length) return ''; const shown = items.slice(0, 6);
    return '<div class="' + cls + '"><b>' + head + '</b><ul>' + shown.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      (items.length > shown.length ? '<div class="sub">+' + (items.length - shown.length) + ' more in the table below</div>' : '') + '</div>'; };
  // A short written summary of the mechanic, the way someone reviewing the pull would say it: what went wrong,
  // what could be better and what went well, with the same problem on several rows said once ("Zaffia and Komo
  // (Set 1): took 2 globules"). The table below keeps every detail.
  const NOUN = { soaker: 'soaks', frontal: 'frontals', spit: 'spits', strike: 'strikes', player: 'players', add: 'adds', circle: 'circles', shield: 'shields', 'soak round': 'soak rounds', boss: 'bosses', what: 'results', when: 'results' };
  const andJ = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  const lc = (x) => (/^[A-Z][a-z]+ [A-Z]/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1)); // keeps names like "Barbed Bulwark"
  // What each flagged column means in plain words, per mechanic, so the summary can say "touching shielded
  // globules (2)" instead of listing players (falls back to the column name).
  const THEMES = {
    // ("!Column" is the wording for an amber result when it differs from the red one)
    venom: { 'Highest stacks': 'players getting close to lethal venom', '!Highest stacks': 'players going over the venom budget', 'Over budget at': 'going over the venom budget', 'Stacks at death': 'dying to venom' },
    feast: { Soakers: 'under-soaked strikes', 'Already Feasted': 'players soaking a second strike', Died: 'deaths in the strike' }, founts: { 'Tainted Burst': 'founts bursting' },
    // (Entombed Sentinels)
    droplets: { Died: 'deaths after a droplet', '!Droplets': 'two droplets at once', '!Living Venom': 'hits from the venom flying back' },
    coag: { 'At the intermission': 'adds still alive at the intermission', '!Killed': 'adds not killed' },
    miasma: { Soakers: 'soaks with too few players', Died: 'deaths in the soak' },
    blighted: { 'Dispelled by': 'players who died with it', '!Dispelled by': 'ones that ran out and dropped a pool', '!On for': 'slow dispels' },
    protovenom: { Eruption: 'eruptions', '!Took': 'slow clears', '!Cleared with': 'circles not cleared with a partner' },
    helix: { 'Solved after': 'players who didn\'t solve it', Result: 'failures', '!Result': 'wrong bumps' },
    balance: { '!Gap': 'intermissions with the bosses\' health uneven' }, tanks: { 'After the intermission': 'missed tank swaps' },
    // (Sszorak)
    ravage: { 'Debuff up': 'tanks taking a second Ravage', 'Others hit': 'Ravages hitting non-tanks', Died: 'deaths to Ravage', '!Tank': 'Ravages nobody tanked' },
    mutilate: { Soakers: 'short-handed soaks', 'With Gash': 'players soaking with Mutilated Gash on', Died: 'deaths in the soak' },
    tempest: { Touches: 'players touched twice or more', '!Touches': 'a single tornado touch', Died: 'deaths to Tempest' },
    cysts: { Surge: 'players dying with Venomous Surge', '!Used for': 'cysts popped outside the intermission' },
    crosswinds: { Result: 'deaths after the launch', '!Result': 'drifts or players hit by a flying player' },
    fury: { Result: 'enrages', '!Result': 'Furies popped as Dig In ended' }, virulence: { Result: 'deaths to a Virulence clip', '!Result': 'Virulence clips' },
    winds: { Cyst: 'winds with no cyst popped', Died: 'deaths in the winds', '!Cyst': 'a spare cyst left up' },
    // (Nek'zali)
    amani: { Result: 'Amani reaching the well', '!Shield': 'shields never broken' }, ignition: { Result: 'players hit by two circles', '!Result': 'circle hits or Ritual Burn going in', Died: 'deaths in Ignition' },
    depths: { Result: 'Curses that got off or deaths in the well', '!Result': 'Swirling Spirit hits', '!Who': 'going in with Soul Exhaustion' }, rend: { Removed: 'deaths with Essence Rend', '!Puddle': 'puddles in the way' },
    // (Lost Explorers)
    boxes: { Result: 'boxes left to rupture', Splinters: 'deaths to the bleed', '!Splinters': 'pops that took the raid to four stacks' }, united: { Result: 'long United Defenses', '!Result': 'United Defense coming up' }, ascension: { Result: 'Final Ascensions that went off' },
    frostfire: { Result: 'debuffs still on at the next volley', '!Result': 'slow clears' }, blink: { Died: 'deaths to Blink Nova' }, thud: { Soakers: 'empty leaps', '!Soakers': 'thin soaks', Died: 'deaths to Mighty Thud' }, bomb: { Result: 'Blast Wave hits' }, tankstacks: { Died: 'tank deaths with stacks up' },
    // (Vashnik)
    venoms: { Result: 'venoms reaching the middle', '!Result': 'adds living over a minute', '!Notes': 'fire adds dying together' }, totems: { Result: 'Imbibes with two or more totems up', '!Result': 'a totem left up' },
    froth: { Result: 'deaths to Plague Wave', '!Result': 'Plague Wave hits' }, bile: { Result: 'biles that landed on nobody' }, infect: { Notes: 'deaths to Caustic Explosion', '!Notes': 'infections removed together', '!Result': 'Stygian Burst hits' }, imbibe: { Died: 'deaths at Imbibe' }, fangs: { Result: 'tanks taking two Dripping Fangs in a row' },
    barrage: { '!Distance': 'Barrages with the tank too close' }, ritual: { Result: 'corpses back at once, Pyre deaths or Soul Transfer hits', '!Result': 'two corpses at once or thin Pyre soaks', Who: 'Soul Transfer hits' }, invoke: { '!Result': 'players interrupted by Invoke' }, energy: { Energy: 'enrages' },
    bulwark: { 'Broken by': 'barriers nobody broke', '!Barrier up': 'slow breaks', 'Ran into it': 'deaths running into a live barrier', '!Ran into it': 'players running into a live barrier' },
    soaks: { Globules: 'players taking an extra globule', 'Venom at extra soak': 'extra globules taken at high venom', 'Barbed Bulwark hits': 'touching shielded globules', Died: 'deaths after soaking' },
    spit: { Result: 'adds living long enough for a third spit', '!Result': 'adds getting a second spit off', 'Hit without being targeted': 'players standing in someone else\'s spit line' },
    ichor: { 'In someone else\'s circle': 'players standing in someone else\'s circle' }, stone: { 'Soaked by': 'missed Stone Breaker circles', 'Raid hit': 'missed circles hitting the raid' },
    avoid: { 'Stir the Depths steps': 'players stepping into Stir the Depths water again and again', '!Stir the Depths steps': 'a step into Stir the Depths water', 'Sanguine Storm hits': 'players taking repeated Sanguine Storm hits', '!Sanguine Storm hits': 'a single Sanguine Storm hit' },
    deaths: { 'Killed by': 'deaths', 'Still had ready': 'dying with a defensive or self-heal still ready' },
    orbs: { Spell: 'frontals hitting non-tanks', 'Orbs popped': 'frontals off the orb plan' }, soakq: { 'In circle': 'short-handed soaks', Target: 'targets without an external', Died: 'deaths in the soak', Soakers: 'soak assignment mix-ups' },
    dmghost: { Result: 'ghost collisions or mind-control falls', '!Result': 'ghosts missed by Soul Sever' }, addsets: { Who: 'kicks before Gloombomb went out', Result: 'shields or adds not dealt with in time' },
    tankfront: { Stack: 'tanks taking too many stacks', 'Had up': 'second stacks without two externals', Result: 'tank deaths' }, shield: { Result: 'casts nobody kicked', Broken: 'shields not broken in time', '!Broken': 'shields broken with little time to kick' },
    defensives: { Survival: 'low survival kit scores', '!Survival': 'survival kits with room to improve', Defensives: 'dying with a defensive or self-heal still ready', 'Healthstone and health potion': 'dying with a Healthstone or health potion unused', 'Combat or mana potion': 'pulls without a combat or mana potion', 'Close calls': 'close calls with nothing pressed' },
    inter: { 'Raid peak (3 to 5; up to 10 with cooldowns)': 'soak rounds going too high', 'Fragments to Zul\'jan': 'fragments reaching Zul\'jan' }, vf: { 'Removed after': 'slow Venomfang dispels' },
    push: { Timing: 'phase pushes off timing', 'Stacks / Lust / balance': 'transitions on too many stacks or without Lust', 'Cooldowns / damage': 'no raid cooldowns at the push' }, kicks: { Result: 'casts getting through' },
    eggs: { 'What happened': 'Vipers hatched', '!What happened': 'eggs picked up with Rancid Yolk on' }, coils: { Soakers: 'circles nobody soaked', '!Soakers': 'thin soaks', Died: 'deaths to Spectral Coils' }, tank: { Result: 'the raid punished for nobody tanking' },
    incub: { Wretch: 'venom reaching the Wretch' }, wretch: { '!Bubbles': 'Wretches alive for a third bubble', '!Outside the bubble': 'players outside a bubble' }, amps: { '!Boss health': 'windows behind pace' }, fangs: { Result: 'deaths while tethered', '!Broke': 'tethers never broken', '!Result': 'batches spread out or without a raid cooldown' }, doomscale: { Result: 'a hatched big egg or a long Revenge', '!Result': 'a Warden reaching its second gestation, or a short Revenge' }, bite: { Result: 'bites not cleared', '!Result': 'Purges not spread or held without a defensive' }, shriek: { Killed: 'adds left alive', '!Got off': 'adds that got their casts off' },
  };
  // (row labels that don't read as a plural noun on their own)
  const LABEL_T = { 'exploded unsoaked': 'globules exploding unsoaked', 'whole set': 'whole sets' };
  const SNOUN = { boxes: 'boxes', united: 'United Defenses', ascension: 'results', frostfire: 'debuffs', blink: 'Blink Novas', thud: 'leaps', bomb: 'bombs', tankstacks: 'tank stretches', venoms: 'adds', fangs: 'Dripping Fangs', totems: 'totem results', froth: 'players', bile: 'Catalysts', infect: 'infections', imbibe: 'Imbibes', amani: 'Amani', ignition: 'results', depths: 'well results', rend: 'puddles', barrage: 'Barrages', ritual: 'intermission results', invoke: 'Invokes', energy: 'feeds', ravage: 'Ravages', mutilate: 'soaks', tempest: 'players', cysts: 'cysts', crosswinds: 'players', fury: 'Furies', virulence: 'players', winds: 'winds', helix: 'pairings', protovenom: 'circles', droplets: 'soakers', coag: 'adds', miasma: 'soaks', blighted: 'debuffs', pools: 'pools', marks: 'players', balance: 'intermissions', tanks: 'cycles', bulwark: 'barriers', ichor: 'casts', soakq: 'soaks', push: 'transitions', tankfront: 'frontals', vf: 'debuffs', kicks: 'casts', founts: 'Feasts', twins: 'bosses', addsets: 'add and kick results', dmghost: 'Dreadmarch results', inter: 'soak rounds', shield: 'shields', deaths: 'deaths', eggs: 'egg results', coils: 'circles', tank: 'tank checks', incub: 'Toxic Incubations', wretch: 'Wretches', amps: 'damage windows', fangs: 'tether results', doomscale: 'Doomscale results', bite: 'bite results', shriek: 'adds' };
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  const synopsis = (s, rows, groups) => {
    const all = []; for (const g of groups) for (const row of g.rows) all.push({ row, g }); for (const row of rows) all.push({ row, g: null });
    // a section that only shows something (e.g. the Sentinels' blood pool maps) says so instead of "clean"
    if (s.info) return '<div class="msum"><p class="na"><b>Not judged:</b> ' + esc(s.summary || '') + '</p></div>';
    // Sentinels Marks: only the players in range of both bosses are listed, so say who, not "0 of 4 clean"
    if (s.id === 'marks') { const fl = new Set(); for (const g of groups) for (const row of g.rows) if (row[0] && row[0].p && row.some((c) => c.bad || c.warn)) fl.add(row[0].p);
      return '<div class="msum"><p class="' + (fl.size ? 'warn' : 'ok') + '"><b>Overall:</b> ' + esc(fl.size ? plural(fl.size, 'player') + ' picked up stacks of the other boss\'s Mark (in range of both): ' + [...fl].slice(0, 6).join(', ') + (fl.size > 6 ? ' and more' : '') + '.' : 'Clean: everyone stayed in range of their own boss only.') + '</p></div>'; }
    // Tempest (Sszorak): its rows are only the players a tornado touched, so say how many and who most, not "none went cleanly"
    if (s.id === 'tempest') { const cnt = new Map(), red = new Set(); let died = 0;
      for (const g of groups) for (const row of g.rows) { const p = row[0] && row[0].p; if (!p) continue; cnt.set(p, (cnt.get(p) || 0) + (parseInt(row[2].txt, 10) || 0)); if (row[2].bad) red.add(p); if (row[3] && row[3].bad) died++; }
      const top = [...cnt].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([p, n]) => p + ' (' + n + ')');
      return '<div class="msum"><p class="' + (red.size || died ? 'bad' : cnt.size ? 'warn' : 'ok') + '"><b>Overall:</b> ' + esc(!cnt.size ? 'Clean: no tornado touched anyone.' : plural(cnt.size, 'player') + ' touched by a tornado over ' + plural(groups.length, 'Tempest') +
        (red.size ? ', ' + red.size + ' of them twice or more in one' : '') + (died ? ', ' + plural(died, 'death') + ' to it' : '') + '. Most touches: ' + top.join(', ') + '.') + '</p></div>'; }
    // Deaths: just how many and how many with something still ready
    if (s.id === 'deaths') {
      const n = all.length, ready = all.filter((x) => isWarnRow(x.row) || x.row.some((c) => c.warn)).length;
      return '<div class="msum"><p class="' + (n ? 'bad' : 'ok') + '"><b>Overall:</b> ' + esc(n ? n + (n === 1 ? ' player died' : ' players died') + (m.sectionGroups ? ' this pull' : ' in this phase') + (ready ? ', ' + (n === 1 ? '' : (ready === n ? 'all ' : ready + ' ')) + 'with a defensive, Healthstone or potion still ready' : '') + '. Pick ' + (n === 1 ? 'the' : 'a') + ' death for what did it.' : 'Nobody died in this phase.') + '</p></div>';
    }
    {
      const T2 = THEMES[s.id] || {}, firstI = (row) => row.findIndex((c) => c.t == null && !c.map && !c.maps && !c.more);
      // a row's theme: its flagged label (e.g. "Orb collision"), or the first flagged column in plain words
      // (a flagged label reads as a plural: "orb collisions"; one that isn't a noun, like "Exploded unsoaked", has its
      // own wording in LABEL_T)
      const theme = (row, flag) => { const fi = firstI(row); if (fi >= 0 && row[fi][flag] && row[fi].txt && !row[fi].p) { const l = row[fi].txt.toLowerCase(); return LABEL_T[l] || (/s$/.test(l) ? l : l + 's'); }
        const i = row.findIndex((c, k) => k !== fi && c[flag] && !c.map); const col = s.cols[i] || ''; return (flag === 'warn' && T2['!' + col]) || T2[col] || (col ? col.toLowerCase() : 'other problems'); };
      // (avoidable damage: by what hit them, "Malevolent Resonance (2)", not by column)
      const tally = (list, flag) => { const m = new Map(); for (const x of list) { const k = s.id === 'avoid' && x.g ? x.g.title : theme(x.row, flag); m.set(k, (m.get(k) || 0) + 1); } return [...m].sort((a, b) => b[1] - a[1]); };
      const badL = all.filter((x) => isBadRow(x.row)), warnL = all.filter((x) => isWarnRow(x.row)), okL = all.filter((x) => okRow(x.row)), n = badL.length + warnL.length + okL.length;
      const noun = SNOUN[s.id] || NOUN[(s.cols[0] || '').toLowerCase()] || 'results';
      const item = ([k, c]) => k + (/\)$/.test(k) ? ' ×' + c : ' (' + c + ')');
      const listT = (t) => (t.length > 3 ? t.slice(0, 3).map(item).join(', ') + ' and a few smaller things' : andJ(t.map(item)));
      // (a set flagged only in its own header, like adds still up when the next set came, is named, not counted)
      const setsOnly = (pred) => groups.filter((g) => pred(g) && !g.rows.some((row) => isBadRow(row) || (pred === badPred ? false : isWarnRow(row))));
      const badPred = (g) => g.bad, badSetL = setsOnly(badPred), warnSetL = setsOnly((g) => g.warn && !g.bad);
      const badSets = badSetL.length, warnSets = warnSetL.length, setNames = (l) => andJ(l.slice(0, 3).map((g) => g.title)) + (l.length > 3 ? ' and ' + (l.length - 3) + ' more' : '');
      const ratio = n ? okL.length / n : 1, sing = (w) => w.replace(/sses$/, 'ss').replace(/s$/, '');
      let lead;
      if (s.id === 'avoid') {
        // (avoidable damage counts players: a row is one player and one source, so "40 of 70" meant nothing)
        const who = (f) => new Set(all.filter((x) => f(x.row)).map((x) => x.row[0].p)), pb = who(isBadRow), pw = [...who(isWarnRow)].filter((p) => !pb.has(p)).length, hitN = new Set(all.map((x) => x.row[0].p)).size;
        lead = !pb.size && !pw ? 'Clean: nobody took avoidable damage worth flagging' + (hitN ? ' (' + plural(hitN, 'player') + ' clipped by something minor).' : '.')
          : (pb.size ? plural(pb.size, 'player') + ' took dangerous or repeated hits' + (pw ? ', and ' + pw + ' more could be tighter' : '') : plural(pw, 'player') + ' could be tighter') + ' (' + hitN + ' hit by something avoidable).';
      } else if (s.id === 'eggs') {
        // (Ula'tek eggs: each red row is a Viper, each amber one an egg picked up with Rancid Yolk on)
        lead = badL.length ? plural(badL.length, 'Viper') + ' hatched' + (warnL.length ? ', and ' + plural(warnL.length, 'egg') + ' went to a carrier with Rancid Yolk still on' : '') + '.'
          : warnL.length ? 'No Vipers, but ' + plural(warnL.length, 'egg') + ' went to a carrier with Rancid Yolk still on.' : 'Clean: no egg broke into a Viper.';
      } else if (s.id === 'waves') {
        // (Ula'tek's Caustic Waves: every row is a hit, so say how many and on whom, not "0 of 6 were clean")
        const pw = new Set(all.map((x) => (x.row[1].ps || [])[0])).size, dw = all.filter((x) => x.row[4] && x.row[4].bad).length;
        lead = n ? plural(n, 'wave hit') + ' on ' + plural(pw, 'player') + (dw ? ', and ' + (dw === 1 ? 'one ended in a death' : dw + ' ended in deaths') : '') + '. Each row says which wave it was.' : 'Clean: nobody was hit by Caustic Waves.';
      } else lead = !badL.length && !warnL.length && !badSets && !warnSets ? (n > 2 ? 'Clean, all ' + n + ' ' + noun + ' went to plan.' : n === 2 ? 'Clean, both ' + noun + ' went to plan.' : 'Clean.')
        // (one result: say it, not "0 of 1")
        : n === 1 ? (badL.length || badSets ? 'The only ' + sing(noun) + ' went wrong.' : 'The only ' + sing(noun) + ' could be better.')
        : !badL.length && !badSets ? (ratio >= 0.5 ? 'Mostly fine, with a few things to tighten up (' + okL.length + ' of ' + n + ' ' + noun + ' were clean).' : 'No real problems, but plenty to tighten up (' + okL.length + ' of ' + n + ' ' + noun + ' were clean).')
        : ratio >= 0.75 ? 'Mostly clean, with a few real problems (' + okL.length + ' of ' + n + ' ' + noun + ' went fine).'
        : ratio >= 0.5 ? 'Some real problems: ' + okL.length + ' of ' + n + ' ' + noun + ' went cleanly.'
        : okL.length ? 'A rough one: only ' + okL.length + ' of ' + n + ' ' + noun + ' went cleanly.' : 'A rough one: none of the ' + n + ' ' + noun + ' went cleanly.';
      const parts = [['ok', 'Overall', lead]];
      const tb = tally(badL, 'bad');
      if ((tb.length || badSets) && s.id !== 'waves') parts.push(['bad', 'Main problems', (tb.length ? cap(listT(tb)) + '.' : '') + (badSets ? (tb.length ? ' Also ' : '') + setNames(badSetL) + ' (see ' + (badSets === 1 ? 'its' : 'their') + ' header).' : '')]);
      const tw = tally(warnL, 'warn');
      if ((tw.length || warnSets) && s.id !== 'waves') parts.push(['warn', 'Could be tighter', (tw.length ? cap(listT(tw)) + '.' : '') + (warnSets ? (tw.length ? ' Also ' : '') + setNames(warnSetL) + ' (see ' + (warnSets === 1 ? 'its' : 'their') + ' header).' : '')]);
      parts[0][0] = badL.length || badSets ? (ratio >= 0.8 ? 'warn' : 'bad') : warnL.length || warnSets ? 'warn' : 'ok';
      return '<div class="msum">' + parts.map(([k, h, t]) => '<p class="' + k + '"><b>' + h + ':</b> ' + esc(t) + '</p>').join('') + '</div>';
    }
    const bad = all.filter((x) => isBadRow(x.row)), warn = all.filter((x) => isWarnRow(x.row)), ok = all.filter((x) => okRow(x.row));
    // the same problem on several rows becomes one clause; who and where, then what
    const clauses = (list, max) => {
      const by = new Map();
      for (const { row, g } of list) {
        const p = rowParts(s, row), what = p.bits ? lc(p.bits.replace(/ · /g, ', ')) : 'flagged';
        // a row about one player is said by name; a row about a moment (it starts with a time) is said by its time
        const first = row.find((c) => c.t == null && !c.map && !c.maps && !c.more), t0 = row.find((c) => c.t != null);
        const who = first && (first.p || (first.pt && first.pt.length === 1)) ? p.name : !(first && (first.ps || first.pt)) && p.name && !/^\d/.test(p.name) ? p.name : t0 ? 'At ' + T(t0.t) : p.label;
        let e = by.get(what); if (!e) by.set(what, e = { what, who: [], where: new Set() }); e.who.push(who); if (g) e.where.add(g.title);
      }
      const ents = [...by.values()].sort((a, b) => b.who.length - a.who.length);
      const say = (e) => { const names = [...new Set(e.who)], shown = names.slice(0, 4), more = names.length - shown.length;
        return andJ(shown.concat(more > 0 ? [more + ' more'] : [])) + (e.where.size && e.where.size <= 3 ? ' (' + [...e.where].join(', ') + ')' : e.where.size ? ' (' + e.where.size + ' sets)' : '') + ': ' + e.what; };
      const out = ents.slice(0, max).map(say).join('. ');
      return out + (ents.length > max ? '. Plus ' + (ents.length - max) + ' other ' + (ents.length - max === 1 ? 'issue' : 'issues') + ' in the table' : '') + '.';
    };
    // set-level problems with no flagged row (e.g. adds still alive when the next set spawned)
    const setOnly = (pred) => groups.filter((g) => pred(g) && !g.rows.some((row) => isBadRow(row) || isWarnRow(row))).map((g) => g.title + ': ' + lc(g.sub));
    const badSets = setOnly((g) => g.bad), warnSets = setOnly((g) => g.warn && !g.bad);
    const noun = NOUN[(s.cols[0] || '').toLowerCase()] || 'results', total = bad.length + warn.length + ok.length;
    const cleanSets = groups.filter((g) => !g.bad && !g.warn && g.rows.length && g.rows.every((row) => !isBadRow(row) && !isWarnRow(row))).map((g) => g.title);
    const parts = [];
    if (bad.length || badSets.length) parts.push(['bad', 'What went wrong', (bad.length ? clauses(bad, 3) : '') + (badSets.length ? ' ' + badSets.join('. ') + '.' : '')]);
    if (warn.length || warnSets.length) parts.push(['warn', 'Could be better', (warn.length ? clauses(warn, 2) : '') + (warnSets.length ? ' ' + warnSets.join('. ') + '.' : '')]);
    const were = (n) => (n === 1 ? ' was clean' : ' were clean');
    if (ok.length) parts.push(['ok', 'What went well', (ok.length === total ? (total === 1 ? 'It was clean.' : 'All ' + total + ' ' + noun + ' were clean.') : ok.length + ' of ' + total + ' ' + noun + were(ok.length) +
      (cleanSets.length && cleanSets.length < groups.length ? (cleanSets.length <= 3 ? ', including every one in ' + andJ(cleanSets) : ', and ' + cleanSets.length + ' of ' + groups.length + ' sets had no problems at all') : '') + '.')]);
    else if (!parts.length) parts.push(['ok', 'This pull', 'Nothing went wrong with this mechanic.']);
    return '<div class="msum">' + parts.map(([k, h, t]) => '<p class="' + k + '"><b>' + h + '.</b> ' + esc(t.trim()) + '</p>').join('') + '</div>';
  };
  // "What went great": the clean results, showing the values that were checked (the columns that flag problems)
  const okRow = (row) => !row.some((c) => c.bad || c.warn) && row.some((c) => (c.txt || c.s || c.p || c.ps || c.pt || c.n != null) && !c.dim);
  const greatBox = (s, rows, groups, nothingWrong) => {
    const all = rows.concat(...groups.map((g) => g.rows));
    const checked = s.cols.map((_, i) => all.some((row) => row[i] && (row[i].bad || row[i].warn)));
    // who did it: the players the row's map is about (e.g. soakers who lived), else the row's player cells
    const whoOf = (row) => {
      const mc = row.find((c) => c.map) || null, mp = mc ? mc.map : null;
      if (mp && (mp.good || mp.hl) && mp.pts) { const ids = new Set(mp.good && mp.good.length ? mp.good : mp.hl); return mp.pts.filter((q) => q.kind === 'player' && ids.has(q.guid)).map((q) => q.name); }
      return row.flatMap((c) => c.ps || (c.pt ? c.pt.map((x) => x[0]) : c.p ? [c.p] : []));
    };
    const names = (list) => [...new Set(list)].slice(0, 8).join(', ') + (new Set(list).size > 8 ? ', +' + (new Set(list).size - 8) + ' more' : '');
    // clean results stay simple: "0:22 Frontal 1: clean (Telegon)"
    const goodLine = (row) => { const p = rowParts(s, row), w = whoOf(row).filter((n) => n !== p.name); return p.label + ': clean' + (w.length ? ' (' + names(w) + ')' : ''); };
    const items = [];
    // parts of a problem row that went right (e.g. "In circle 6 / 6" on a soak whose target had no protection)
    // kept short: only plain checked values with their column name ("In circle 6 / 6"), never spell names or notes
    const partial = (row) => { const p = rowParts(s, row), firstI = row.findIndex((x) => x.t == null && !x.map && !x.maps && !x.more);
      const v = row.map((c, i) => ({ c, i })).filter(({ c, i }) => checked[i] && i !== firstI && !c.bad && !c.warn && !c.map && !c.maps && !c.more && !c.s && c.txt && !/^\d+ orbs$/.test(c.txt) && !/^(—|0 missed|none)$/.test(c.txt))
        .map(({ c, i }) => (s.cols[i] ? s.cols[i] + ' ' : '') + c.txt);
      return v.length ? p.label + ': ' + v.join(' · ') : ''; };
    for (const g of groups) {
      const good = g.rows.filter(okRow), clean = !g.bad && !g.warn && !g.rows.some((row) => row.some((c) => c.bad || c.warn));
      if (clean) { const w = g.rows.flatMap(whoOf).concat(g.tg || []); items.push(g.title + ' (' + T(g.t) + '): clean' + (w.length ? ' (' + names(w) + ')' : '')); }
      // clean rows, plus the parts that went right on a red row (amber rows aren't "great")
      else for (const row of g.rows) { const l = okRow(row) ? goodLine(row) : isBadRow(row) ? partial(row) : ''; if (l) items.push(g.title + ', ' + l); }
    }
    for (const row of rows) if (isBadRow(row)) { const l = partial(row); if (l) items.push(l); }
    const same = new Map();
    // per-player rows (no time, e.g. Intermission stacks): one line listing everyone who was clean
    const timed = rows.filter(okRow).filter((row) => row.some((c) => c.t != null)), perPlayer = rows.filter(okRow).filter((row) => !row.some((c) => c.t != null));
    for (const row of timed) items.push(goodLine(row));
    if (perPlayer.length) items.push('Clean: ' + names(perPlayer.map((row) => rowParts(s, row).name)));
    if (!items.length) return nothingWrong ? '<div class="wentok"><b>✓ This pull</b>Nothing went wrong with this mechanic here.</div>' : '';
    const shown = items.slice(0, 6);
    return '<div class="wentok"><b>✓ What went great this pull</b><ul>' + shown.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      (items.length > shown.length ? '<div class="sub">+' + (items.length - shown.length) + ' more in the table below</div>' : '') + '</div>';
  };
  // table rows: green check for a clean result, red X for a problem
  const trCls = (row) => isBadRow(row) ? ' class="rbad"' : isWarnRow(row) ? ' class="rwarn"' : okRow(row) ? ' class="rok"' : '';
  // Deaths as a list and a detail pane, like the other sections: on the left each death in order (who, when, what did
  // it; deaths from the same hit grouped), on the right the picked one: what did it, the mistakes linked to it, what was
  // ready, damage in and healing out, their health over the last 10 seconds with each hit, the biggest hits, what would
  // have helped, and every event on demand
  const secOf = new Map(); for (const s of m.sections) { const n = (s.spell && s.spell[1]) || ''; if (n && !secOf.has(n.toLowerCase())) secOf.set(n.toLowerCase(), s.id); const tt = String(s.title || '').split(':')[0].toLowerCase(); if (tt && !secOf.has(tt)) secOf.set(tt, s.id); }
  const allDeaths = r.deaths.slice().sort((a, b) => a.t - b.t);
  const causeOf = (d) => (d.big ? d.big.spell : (d.last && d.last.spell) || d.ability || d.killer || 'an unknown hit');
  // Deaths, simple: one line per death (when, who, what killed them, the one thing that would have helped), the first one
  // open; opening a death shows the last 5 seconds in one line, its linked mistakes, the three biggest hits as bars, and
  // the Map and Every event buttons
  const deathsList = (rows, sid) => {
    const ds = rows.map((row) => row[0].death).filter(Boolean); if (!ds.length) return '';
    const same = ds.map((d, i) => { const p = ds[i - 1]; return p && d.t - p.t <= 2 && causeOf(p) === causeOf(d) ? p : null; });
    const cap = (s) => String(s).replace(/^a /, '').replace(/^./, (c) => c.toUpperCase());
    // what would have helped, in one line: a linked mistake first, then a defensive that was ready, then the advice
    const helped = (d) => { const l = (d.links || [])[0], av = d.available || [];
      // (the mistake in a few words: its first clause, without the numbers; the mechanic's name only when it doesn't say it)
      if (l) { const det = l.detail.replace(/( for [\d,.]+| and |: |\. |, leaving |; ).*$/, '').replace(/\.$/, '');
        return { st: l.severity === 'High' ? 'bad' : 'warn', txt: (l.raid ? 'Raid: ' : '') + (det.toLowerCase().includes(String(l.mechanic).toLowerCase()) ? det : l.mechanic + ': ' + det) }; }
      if (av.length && d.react !== false) return { st: 'warn', txt: cap(av[0]) + ' was ready' + (av.length > 1 ? ' (+' + (av.length - 1) + ' more)' : '') };
      const pv = (d.prevent || []).find((x) => !/^No clear mistake/i.test(x));
      if (pv) return { st: 'warn', txt: pv.replace(/\.$/, '') };
      return { st: 'na', txt: d.react === false ? 'too fast to react' : 'no clear mistake' };
    };
    // the three biggest hits of the last 10 seconds (a spell's smaller hits added up, "×10"), as bars
    const top3 = (d) => { const hits = (d.recap || []).filter((e) => !e.heal && e.t >= d.t - 10), last = hits[hits.length - 1], grp = new Map();
      for (const e of hits) { const k = e.spell || 'Melee'; const g = grp.get(k) || { spell: k, id: e.id, n: 0, amt: 0, kb: false }; g.n++; g.amt += e.amount; if (e === last) g.kb = true; grp.set(k, g); }
      const list = [...grp.values()].sort((a, b) => b.amt - a.amt).slice(0, 3), mx = Math.max(1, ...list.map((x) => x.amt));
      return list.length ? '<div class="dd-hits">' + list.map((x) => '<div class="dd-hit"><span>' + spell(x.id, x.spell) + (x.n > 1 ? ' <span class="sub">×' + x.n + '</span>' : '') + (x.kb ? ' <span class="hotv">killing blow</span>' : '') + '</span><span class="dd-bar"><i style="width:' + (100 * x.amt / mx).toFixed(1) + '%"></i></span><b>' + kfmt(x.amt) + '</b></div>').join('') + '</div>' : '<p class="muted">No hits recorded before this death.</p>'; };
    const items = ds.map((d, i) => { const cause = causeOf(d), h0 = helped(d);
      const how = same[i] ? 'the same hit as the death before' : d.big && d.last ? kfmt(d.big.amount) + ', then ' + d.last.spell + ' finished them' : d.last ? kfmt(d.last.amount) + (d.react === false ? ', no time to react' : '') : '';
      const hp = d.healthy && d.window > 0 ? Math.round(d.startHp) + '% to 0 ' + (d.window < 0.15 ? 'in one hit' : 'in ' + d.window.toFixed(1) + ' s') : d.startHp > 0 ? 'never above ' + Math.round(d.startHp) + '% in the last 10 s' : '';
      // (the first linked mistake is on the line itself; any others as chips that open their mechanic)
      const links = (d.links || []).slice(1).map((l) => { const sec = secOf.get(String(l.mechanic).toLowerCase());
        return '<button type="button" class="dchip ' + (l.severity === 'High' ? 'bad' : 'warn') + '"' + (sec ? ' data-sec="' + esc(sec) + '"' : '') + ' title="' + esc(T(l.t) + ': ' + l.detail) + '">' + (l.raid ? 'Raid: ' : '') + esc(l.mechanic) + ' <span>' + esc(l.detail.replace(/(: |\. |, leaving ).*$/, '').replace(/\.$/, '').slice(0, 70)) + '</span></button>'; });
      const rc = (d.recap || []).slice(-40).map((e) => '<div class="ev"><span class="muted">' + T(e.t) + '</span><span class="' + (e.heal ? 'heal' : 'dmg') + '">' + (e.heal ? '+' : '−') + C(e.amount) + '</span><span>' + spell(e.id, e.spell) + ' <span class="sub">' + esc(e.src) + '</span></span><span class="muted">' + (e.hp >= 0 ? Math.round(e.hp) + '% hp' : '') + '</span></div>').join('');
      const body = '<div class="dd-sum">' + [d.taken5 ? 'Last 5 seconds: took ' + kfmt(d.taken5) + ', healed ' + kfmt(d.healed5 || 0) : '', hp].filter(Boolean).map(esc).join(' · ') + '</div>' +
        (links.length ? '<div class="dchips">' + links.join('') + '</div>' : '') + top3(d) +
        '<div class="dd-act">' + (d.map ? cell({ map: d.map }, sid) : '') + '<button class="btn dev-all" type="button">Every event</button></div>' +
        '<div class="recap dall" hidden>' + (rc || '<p class="muted">No events recorded before this death.</p>') + '</div><div class="mm md-map"></div>';
      return { d, i, cause, how, h0, body, st: h0.st === 'na' ? 'bad' : h0.st };
    });
    const causes = new Map(); for (const x of items) causes.set(x.cause, (causes.get(x.cause) || 0) + 1);
    const cut0 = cut ? cut.t : Infinity, hasCut = isFinite(cut0) && ds.some((d) => Math.abs(d.t - cut0) < 0.06), after = hasCut ? allDeaths.filter((d) => d.t > cut0 + 0.05).length : 0;
    // (deaths from the same hit, each within 2 s of the one before, are one line: "Schooty and 14 more", every name
    // listed when it's opened, with the first one's recap)
    const groups = []; items.forEach((x, i) => { if (same[i] && groups.length) groups[groups.length - 1].push(x); else groups.push([x]); });
    return '<div class="md dd"><p class="dd-top">' + plural(ds.length, 'death') + ' · killed by: ' + [...causes].sort((a, b) => b[1] - a[1]).map(([c, n]) => esc(c) + ' ' + n).join(', ') + '</p>' +
      groups.map((g, gi) => { const x = g[0], many = g.length > 1;
        const names = many ? '<div class="dd-all"><span class="sub">' + g.length + ' died to it: </span>' + g.map((y) => '<span class="nm" style="color:' + ((pmap.get(y.d.player) || {}).color || 'inherit') + '">' + esc(y.d.player) + '</span>').join(', ') + '</div>' : '';
        return '<button class="md-i dd-r ' + x.st + (gi === 0 ? ' on' : '') + '" type="button" data-i="' + gi + '" data-dg="' + esc(x.d.guid + '@' + x.d.t.toFixed(2)) + '" data-dgs="' + esc(g.map((y) => y.d.guid + '@' + y.d.t.toFixed(2)).join(' ')) + '" aria-expanded="' + (gi === 0) + '">' +
          '<span class="dd-t">' + T(x.d.t) + '</span><span class="dd-w">' + who(x.d.player) + (many ? '<span class="dd-n">and ' + (g.length - 1) + ' more</span>' : '') + '</span><span class="dd-c"><b>' + esc(x.cause) + '</b>' + (x.how ? ' <span class="sub">' + esc(x.how) + '</span>' : '') + '</span>' +
          '<span class="dd-h ' + x.h0.st + '">' + (x.h0.st === 'bad' ? '✕ ' : x.h0.st === 'warn' ? '! ' : '') + esc(x.h0.txt) + '</span><span class="dd-x" aria-hidden="true">▸</span></button>' +
          '<div class="md-d dd-b" data-i="' + gi + '"' + (gi === 0 ? '' : ' hidden') + '>' + names + x.body + '</div>'; }).join('') +
      (after ? '<div class="dmore">' + plural(after, 'more death') + ' after the wipe filter</div>' : '') + '</div>';
  };
  // Avoidable damage as bars: each source on the left (most harmful first), the picked one's players on the right, a bar
  // per player as long as their hits (a hit is one time walking into it), coloured by the source's limits, with the
  // damage it did; a death to it or a tank who isn't judged is marked by the name
  const avoidMd = (groups) => {
    const items = groups.map((g) => { const rs = g.rows.map((row) => ({ p: row[0].p, tank: !!row[0].sub, hits: parseInt(row[1].txt, 10) || 0, bad: row[1].bad, warn: row[1].warn, ticks: row[1].sub || '', amt: row[2].n || 0, died: !!row[3].bad }));
      const mx = Math.max(1, ...rs.map((x) => x.hits));
      const bars = rs.map((x, i) => { const p = pmap.get(x.p) || { name: x.p, color: '#9aa0ac' };
        return cbRow({ tag: 'div', cls: ' nb', attrs: x.ticks ? ' title="' + esc(x.ticks) + '"' : '', k: i + 1, p, segs: [[Math.max(2, 100 * x.hits / mx), 'm']], v: '<span class="' + (x.bad ? 'hotv' : x.warn ? 'warnv' : '') + '">' + x.hits + '</span>', sub: x.amt ? kfmt(x.amt) : '—',
          chips: (x.died ? '<span class="pf-d">✕ died to it</span>' : '') + (x.tank ? '<span class="sub">tank, not judged</span>' : '') }); }).join('');
      return { label: g.title, st: g.bad ? 'bad' : g.warn ? 'warn' : 'ok', body: '<div class="md-h"><b>' + esc(g.title) + '</b></div><div class="sub" style="margin-bottom:8px">' + esc(g.sub || '') + '</div>' + cbHead('Hits', 'Damage') + bars }; });
    const iBad = items.findIndex((x) => x.st === 'bad'), iWarn = items.findIndex((x) => x.st === 'warn'), sel = iBad >= 0 ? iBad : iWarn >= 0 ? iWarn : 0;
    return '<div class="md"><div class="md-list">' + items.map((x, i) => '<button class="md-i ' + x.st + (i === sel ? ' on' : '') + '" data-i="' + i + '"><span class="md-dot"></span><span class="md-l">' + esc(x.label) + '</span></button>').join('') + '</div>' +
      '<div class="md-pane">' + items.map((x, i) => '<div class="md-d" data-i="' + i + '"' + (i === sel ? '' : ' hidden') + '>' + x.body + '</div>').join('') + '</div></div>';
  };
  // Ula'tek's damage amps, the windows shown (the rows left after the phase and wipe filters): one entry per window, plus
  // all of them together when there are two or more
  const ampsMd = (s, rows) => {
    const shown = s.amps.filter((a) => rows.some((row) => row.some((c) => c.t === a.t0)));
    if (!shown.length) return '';
    const pc = (v) => (v == null ? '—' : Math.round(100 * v) + '%'), slow = (a) => a.pace != null && a.hp1 != null && a.hp1 > a.pace + 0.005;
    const items = shown.map((a) => ({ ...a, secs: Math.max(1, a.t1 - a.t0), label: 'Amp ' + a.n, sub: a.hp1 != null ? (a.hp1 < 0.005 ? 'killed in it' : 'ended at ' + pc(a.hp1)) : '', st: slow(a) ? 'warn' : 'ok' }));
    if (shown.length > 1) { const per = new Map(); for (const a of shown) for (const x of a.per) { const y = per.get(x.p) || { p: x.p, h: 0, o: 0 }; y.h += x.h; y.o += x.o; per.set(x.p, y); }
      items.unshift({ all: true, label: 'All ' + shown.length + ' amps', sub: 'added up', st: items.some((x) => x.st === 'warn') ? 'warn' : 'ok', heart: shown.reduce((v, a) => v + a.heart, 0), other: shown.reduce((v, a) => v + a.other, 0), secs: shown.reduce((v, a) => v + Math.max(1, a.t1 - a.t0), 0), per: [...per.values()].sort((a, b) => b.h - a.h || b.o - a.o) }); }
    const stat = (v, l) => '<div class="pfw-s"><b>' + v + '</b><span>' + l + '</span></div>';
    const body = (a) => { const tot = a.heart + a.other, mx = Math.max(1, ...a.per.map((x) => x.h + x.o));
      const stats = (a.all ? '' : stat(pc(a.hp0) + '<span> → </span>' + (a.hp1 != null && a.hp1 < 0.005 ? 'dead' : pc(a.hp1)), 'boss health, before and after')) + stat(C(a.heart), 'into the heart') + stat(C(a.heart / a.secs) + '<span>/s</span>', 'per second') + stat(tot ? pc(a.heart / tot) : '—', 'of the raid\'s damage on the heart');
      const notes = a.all ? [] : [a.pace != null && a.hp1 != null ? (slow(a) ? 'Behind pace: ' : 'On pace: ') + pc(a.pace) + ' or lower after this one' : '', plural(a.pots, 'combat potion') + ' drunk for it', a.lust ? 'with Bloodlust' : ''].filter(Boolean);
      const bars = a.per.filter((x) => x.h + x.o >= 0.002 * mx).map((x, i) => { const p = pmap.get(x.p); if (!p) return '';
        return cbRow({ tag: 'div', cls: ' nb', attrs: ' title="' + esc(pc(x.h / Math.max(1, x.h + x.o)) + ' of their damage went into the heart') + '"', k: i + 1, p, segs: [[x.h ? Math.max(1, 100 * x.h / mx) : 0, 'm'], [100 * x.o / mx, 'oh']], v: C(x.h), sub: C(x.h / a.secs) }); }).join('');
      return '<div class="md-h"><b>' + esc(a.label) + '</b>' + (a.all ? ' <span class="sub">' + Math.round(a.secs) + 's in all</span>' : ' <span class="sub">' + T(a.t0) + '–' + T(a.t1) + '</span>') + '</div>' +
        '<div class="pfw-sts n' + (a.all ? 3 : 4) + '">' + stats + '</div>' + (notes.length ? '<p class="amp-n">' + notes.map(esc).join(' · ') + '</p>' : '') +
        (bars ? cbHead('Heart', 'Per sec') + bars + '<p class="sub amp-lg">The faded end of a bar is damage that went into Ula\'tek or her tail instead, which the amp doesn\'t double.</p>' : '<p class="muted">No damage into the heart recorded.</p>'); };
    return '<div class="md amp"><div class="md-list">' + items.map((x, i) => '<button class="md-i ' + x.st + (i === 0 ? ' on' : '') + '" data-i="' + i + '"><span class="md-dot"></span><span class="md-l">' + esc(x.label) + '<small>' + esc(x.sub) + '</small></span><span class="md-t">' + (x.all ? '' : T(x.t0)) + '</span></button>').join('') + '</div>' +
      '<div class="md-pane">' + items.map((x, i) => '<div class="md-d" data-i="' + i + '"' + (i === 0 ? '' : ' hidden') + '>' + body(x) + '</div>').join('') + '</div></div>';
  };
  // One collapsible block per mechanic (closed by default; open ones stay open while you click around)
  S.openSecs = S.openSecs || new Set(); S.openSets = S.openSets || new Set();
  const secBlock = ({ s, rows, groups }, key) => {
    const sid = s.id + '-' + key, allRows = rows.concat(...groups.map((g) => g.rows)), nBad = allRows.filter(isBadRow).length, nWarn = allRows.filter(isWarnRow).length;
    const v = nBad ? (s.verdict === 'good' ? 'warn' : s.verdict) : nWarn ? 'warn' : (rows.length || groups.length ? 'good' : s.verdict);
    // the row: a coloured edge and one status line on the right (✕ problems, ! could be better, ✓ clean), like Assignments;
    // "How it works" is folded away at the top of the opened section
    const stc = nBad ? 'bad' : nWarn ? 'warn' : s.info ? 'na' : 'ok';
    let b = '<details class="panel secd st-' + stc + '" id="sec-' + sid + '" data-k="' + sid + '"' + (S.openSecs.has(sid) ? ' open' : '') + '><summary>' + secHead(s) +
      '<span class="sst ' + stc + '">' + (nBad ? '✕ ' + pl2(nBad, 'problem') + (nWarn ? '<i> · ' + nWarn + ' could be better</i>' : '') : nWarn ? '! ' + nWarn + ' could be better' : s.info ? esc(s.info) : '✓ clean') + '</span></summary><div class="secbody">' +
      (s.how ? '<details class="howit"><summary>How it works</summary><div>' + esc(s.how) + '</div></details>' : '') + synopsis(s, rows, groups); // (the old counts summary was dropped: the synopsis and the table cover it)
    // grouped sections: one header row per set, then that set's rows
    // (column headings live inside each opened set's card, so the list of sets stays clean)
    // the bulky panels: a list on the left (one entry per soak, transition, frontal, shield or set) and the picked
    // entry's details on the right; it opens on the first problem
    const ampH = s.id === 'amps' && s.amps && rows.length ? ampsMd(s, rows) : '';
    if (s.id === 'deaths' && rows.some((row) => row[0] && row[0].death)) b += deathsList(rows, sid);
    // Venomfang dispels: just a bar chart of dispels per player (plus how many weren't dispelled)
    else if (s.id === 'vf') {
      const by = new Map(); let none = 0;
      for (const row of rows.concat(...groups.map((g) => g.rows))) { if (row[3] && row[3].p) by.set(row[3].p, (by.get(row[3].p) || 0) + 1); else none++; }
      const list = [...by].sort((a, b) => b[1] - a[1]), mx = Math.max(1, ...list.map(([, n]) => n));
      b += '<div class="dsp">' + list.map(([p, n]) => '<div class="dsp-r"><span>' + who(p) + '</span><span class="dsp-b"><i style="width:' + (100 * n / mx).toFixed(1) + '%"></i></span><b>' + n + '</b></div>').join('') + '</div>' +
        '<p class="sub" style="margin:8px 0 0">' + pl2(list.reduce((s0, [, n]) => s0 + n, 0), 'dispel') + (none ? ' · ' + none + ' Venomfang' + (none === 1 ? '' : 's') + ' not dispelled' : ' · every Venomfang dispelled') + '</p>';
    }
    // Ula'tek's damage amps: each window on the left (and all of them together), the picked one on the right: the boss's
    // health before and after it, and a bar per player for their damage into the heart (the faded end: elsewhere)
    else if (ampH) b += ampH;
    else if (s.id === 'avoid' && groups.length) b += avoidMd(groups);
    // (every mechanic made of sets uses it too: the sets on the left, the picked set's table on the right)
    else if ((MD_SECS.has(s.id) || groups.length) && (groups.length || rows.length)) {
      const items = groups.length
        ? groups.map((g) => ({ label: g.title, t: g.t, st: g.bad || g.rows.some(isBadRow) ? 'bad' : g.warn || g.rows.some(isWarnRow) ? 'warn' : 'ok', sub: g.sub || '',
            body: '<div class="md-h"><b>' + esc(g.title) + '</b>' + (g.t != null ? ' <span class="sub">' + T(g.t) + '</span>' : '') + '</div>' + (g.sub ? '<div class="sub" style="margin-bottom:8px">' + esc(g.sub) + '</div>' : '') +
              '<div class="scroll"><table class="tbl"><thead><tr>' + s.cols.map((c) => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + g.rows.map((row) => '<tr' + trCls(row) + '>' + row.map((c) => '<td>' + cell(c, sid) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' }))
        : rows.map((row) => { const p = rowParts(s, row), tc = row.find((c) => c.t != null), st = isBadRow(row) ? 'bad' : isWarnRow(row) ? 'warn' : 'ok';
            // entry label: the row's name plus what tells entries apart (e.g. "Guillotine · P1 · soak 1", "Sever · Vandagos")
            const first = row.find((c) => c.t == null && !c.map && !c.maps && !c.more), who1 = row.find((c) => c !== first && c.p);
            const name = first ? cellText(first) + (first.sub ? ' · ' + first.sub : who1 ? ' · ' + who1.p : '') : p.label;
            const fields = row.map((c, i) => ({ c, col: s.cols[i] || '' })).filter(({ c }) => c !== tc && c !== first && !c.map && !c.maps && (c.txt || c.p || c.ps || c.pt || c.s || c.n != null || c.more));
            const mp = row.find((c) => c.map);
            return { label: name, t: tc ? tc.t : null, st, sub: p.bits ? p.bits : '',
              body: '<div class="md-h">' + (first ? cell(first, sid) : '') + (tc ? ' <span class="sub">' + T(tc.t) + '</span>' : '') + (mp ? cell(mp, sid) : '') + '</div>' +
                '<dl class="md-f">' + fields.map(({ c, col }) => '<dt>' + esc(col) + '</dt><dd class="' + (c.bad ? 'hotv' : c.warn ? 'warnv' : '') + '">' + cell(c, sid) + '</dd>').join('') + '</dl><div class="mm md-map"></div>' }; });
      const iBad = items.findIndex((x) => x.st === 'bad'), iWarn = items.findIndex((x) => x.st === 'warn'), sel = iBad >= 0 ? iBad : iWarn >= 0 ? iWarn : 0;
      b += '<div class="md"><div class="md-list">' + items.map((x, i) => '<button class="md-i ' + x.st + (i === sel ? ' on' : '') + '" data-i="' + i + '"><span class="md-dot"></span><span class="md-l">' + esc(x.label) + '</span><span class="md-t">' + (x.t != null ? T(x.t) : '') + '</span></button>').join('') + '</div>' +
        '<div class="md-pane">' + items.map((x, i) => '<div class="md-d" data-i="' + i + '"' + (i === sel ? '' : ' hidden') + '>' + x.body + '</div>').join('') + '</div></div>';
    }
    else if (groups.length) b += '<div class="scroll"><table class="tbl gtable"><tbody>' +
      // an empty spacer row between sets (a gap made with borders bleeds into the row above when table borders collapse)
      // one line per set (name, time, what happened, result); click it for that set's rows
      groups.map((g, gi) => { const gb = g.bad || g.rows.some(isBadRow), gw = !gb && (g.warn || g.rows.some(isWarnRow)), key = s.id + '-' + sid + '-' + gi, open = S.openSets.has(key);
        const nb = g.rows.filter(isBadRow).length, nw = g.rows.filter((row) => !isBadRow(row) && isWarnRow(row)).length;
        const pill = hst(gb ? 'bad' : gw ? 'warn' : 'ok', gb ? (nb ? pl2(nb, 'problem') : 'problem') : gw ? (nw > 1 ? nw + ' could be better' : 'could be better') : 'clean');
        return (gi ? '<tr class="gsp2"><td colspan="' + s.cols.length + '"></td></tr>' : '') + '<tr class="grp gline ' + (gb ? 'gbad' : gw ? 'gwarn' : 'gok') + (open ? ' open' : '') + '" data-gk="' + key + '"><td colspan="' + s.cols.length + '"><div class="gl"><span class="gl-t">' + esc(g.title) + '</span><span class="gl-w">' + (g.t != null ? T(g.t) : '') + '</span><span class="gl-s">' + esc(g.sub || '') + '</span>' + pill + '<span class="gl-c" aria-hidden="true">▸</span></div></td></tr>' +
        // the set's rows: one nested card, indented under its bar, with its own column headings
        '<tr class="gdet" data-gp="' + key + '"' + (open ? '' : ' hidden') + '><td colspan="' + s.cols.length + '"><div class="gcard ' + (gb ? 'gbad' : gw ? 'gwarn' : 'gok') + '"><table class="tbl gsub"><thead><tr>' + s.cols.map((c) => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
        g.rows.map((row) => '<tr' + trCls(row) + '>' + row.map((c) => '<td>' + cell(c, sid) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></td></tr>'; }).join('') + '</tbody></table></div>';
    else if (rows.length) b += '<div class="scroll"><table class="tbl"><thead><tr>' + s.cols.map((c) => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((row) => '<tr' + trCls(row) + '>' + row.map((c) => '<td>' + cell(c, sid) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
    else b += '<p class="muted">Nothing recorded for this mechanic on this pull.</p>';
    b += '<div class="mm" id="mm-' + sid + '"></div>';
    // (Venomfang: the per-player dispel counts follow the rows shown, so the wipe filter and phases apply to them too)
    let extra = s.extra;
    if (s.id === 'vf') extra = null; // (the chart above already shows dispels per player)
    if (extra) b += '<div style="margin-top:12px"><div class="sub" style="margin-bottom:6px">' + esc(extra.title) + '</div><span class="chips">' + extra.items.map((i) => '<span class="chipn">' + who(i.p) + '<b>' + i.n + '</b></span>').join('') + '</span></div>';
    return b + '</div></details>';
  };
  // phases, in fight order; each phase is a header with its mechanics, problems first
  buckets.forEach((list, i) => {
    if (!list.length) return;
    // problems first; then by how much the mechanic can hurt (IMPORTANCE: wipe-level first, minor last)
    const imp = IMPORTANCE[r.item.boss] || [], ix = (x) => { const i = imp.indexOf(x.s.id); return x.s.id === 'deaths' ? -1 : i < 0 ? 99 : i; };
    list.sort((a, b) => rank[a.s.verdict] - rank[b.s.verdict] || ix(a) - ix(b));
    const p = phs[i], allR = list.flatMap((x) => x.rows.concat(...x.groups.map((g) => g.rows))), probs = allR.filter(isBadRow).length, better = allR.filter((row) => !isBadRow(row) && isWarnRow(row)).length;
    // a slim phase heading: name, its time span and one status line (no banner), in the same words as each section's
    // (a heading with only amber rows says so, not "clean")
    h += '<details class="phase" open><summary><b>' + esc(p.name) + '</b>' + (isFinite(p.end) ? ' <span class="sub">' + T(p.start) + '–' + T(p.end) + '</span>' : p.sub ? ' <span class="sub">' + esc(p.sub) + '</span>' : '') +
      '<span class="sst ' + (probs ? 'bad' : better ? 'warn' : 'ok') + '">' + (probs ? '✕ ' + pl2(probs, 'problem') + (better ? '<i> · ' + better + ' could be better</i>' : '') : better ? '! ' + better + ' could be better' : '✓ clean') + '</span></summary>' + list.map((x) => secBlock(x, i)).join('') + '</details>';
  });
  if (whole.length) h += '<details class="phase" open><summary><b>Whole fight</b> <span class="sub">mechanics that aren\'t tied to one phase</span></summary>' + whole.map((x) => secBlock(x, 'w')).join('') + '</details>';
  // Survival (the old Survivability tab): defensives per player, then potions and raid cooldowns for reference
  if (!r.noDeathSec) { const ds = defenseSection(r), info = (id, title, icon, sub, body) => '<details class="panel secd st-na" id="sec-' + id + '" data-k="' + id + '"' + (S.openSecs.has(id) ? ' open' : '') + '><summary><span class="sechd">' + spellIcon(0, icon, true) + '<b>' + esc(title) + '</b></span><span class="sst na">' + esc(sub) + '</span></summary><div class="secbody">' + body + '</div></details>';
    const nd = ds.rows.filter(isBadRow).length;
    h += '<details class="phase" open><summary><b>Survival</b> <span class="sub">defensives, Healthstones and potions up to the wipe filter; raid cooldowns for the whole pull</span><span class="sst ' + (nd ? 'bad' : 'ok') + '">' + (nd ? '✕ ' + pl2(nd, 'problem') : '✓ clean') + '</span></summary>' +
      secBlock({ s: ds, rows: ds.rows, groups: [] }, 'sv') +
      (() => { const rd = rcdData(r), nc = rd.hits.filter((x) => x.st === 'ok').length; return info('sv-cds', 'Raid cooldowns', 'Rallying Cry', rd.hits.length ? nc + ' of ' + plural(rd.hits.length, 'big hit') + ' covered' : 'the big hits and what covered them', raidCdPanel(r).replace(/^<div class="panel /, '<div class="')); })() + '</details>'; }
  if (!m.sections.some((x) => x.id === 'kicks') && !m.kicksMerged) h += '<details class="panel secd" id="sec-kicks" data-k="kicks"' + (S.openSecs.has('kicks') ? ' open' : '') + '><summary>' + spellIcon(0, 'Kick', true) + '<b>Interrupts</b> <span class="sub">' + esc(kickTile(r).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace('Interrupts', '').trim().replace(/^Clean /, 'Clean · ')) + '</span></summary><div class="secbody"><div id="kickBox"></div></div></details>';
  if (m.diag) h += '<details class="panel"><summary style="cursor:pointer"><b>Data check</b> <span class="muted">which tracked spells this pull contained, to confirm the module is reading the log correctly</span></summary>' +
    '<table class="tbl" style="margin-top:10px"><thead><tr><th>Spell</th><th class="r">Casts</th><th class="r">Damage hits</th><th class="r">Debuff events</th><th class="r">Other</th></tr></thead><tbody>' +
    m.diag.map((d) => '<tr' + (d.total ? '' : ' style="opacity:.55"') + '><td>' + spell(d.id, d.name) + (d.total ? '' : ' <span class="sub">not found</span>') + '</td><td class="r">' + d.cast + '</td><td class="r">' + d.dmg + '</td><td class="r">' + d.aura + '</td><td class="r">' + d.other + '</td></tr>').join('') +
    '</tbody></table><p class="muted" style="font-size:13px">A spell can legitimately be missing if the pull ended before it happened (for example, no intermission spells on a P1 wipe). If something you saw in the fight shows "not found", screenshot this table and send it to me.</p></details>';
  view(h);
  // applies on Enter or when you leave the box; keeps the cursor in the box while you type
  if ($('#kickBox')) kicks();
  bindStackKinds();
  $('#view').querySelectorAll('.pill').forEach((b) => (b.onclick = () => { S.role = b.dataset.r; audit(); refreshIcons(); }));
  const mbp = $('#sec-players'); if (mbp) mbp.ontoggle = () => { S.mbpOpen = mbp.open; };
  // remember which mechanic blocks are open; summary tiles open the block they jump to
  $('#view').querySelectorAll('details.secd').forEach((d) => (d.ontoggle = () => { if (d.open) S.openSecs.add(d.dataset.k); else S.openSecs.delete(d.dataset.k); }));
  $('#view').querySelectorAll('a.tlink').forEach((a) => (a.onclick = () => { const d = document.querySelector(a.getAttribute('href')); if (d && d.tagName === 'DETAILS') d.open = true; }));
  // Recap / Details buttons: open their html in a row right under the row (one per table), like maps
  $('#view').querySelectorAll('.mmb2').forEach((b) => (b.onclick = () => {
    const tr = b.closest('tr'), next = tr.nextElementSibling;
    if (next && next.classList.contains('maprow') && next.dataset.h === b.dataset.h) { next.remove(); return; }
    tr.closest('tbody').querySelectorAll('tr.maprow').forEach((x) => x.remove());
    const row = document.createElement('tr'); row.className = 'maprow'; row.dataset.h = b.dataset.h;
    row.innerHTML = '<td colspan="' + tr.children.length + '"><div class="mm">' + AUDITHTML[+b.dataset.h] + '</div></td>';
    tr.after(row); refreshIcons();
  }));
  // Deaths: "Every event" shows their whole last 10 seconds; a linked mistake opens its mechanic's section
  $('#view').querySelectorAll('.dev-all').forEach((b) => (b.onclick = () => { const a = b.closest('.md-d').querySelector('.dall'); a.hidden = !a.hidden; b.classList.toggle('on', !a.hidden); }));
  $('#view').querySelectorAll('.dchip[data-sec]').forEach((b) => (b.onclick = () => {
    const key = b.closest('details.secd').dataset.k.split('-').slice(1).join('-'), id = b.dataset.sec;
    const d = document.getElementById('sec-' + id + '-' + key) || document.querySelector('details.secd[data-k^="' + CSS.escape(id) + '-"]'); if (!d) return;
    for (let e = d; e; e = e.parentElement) if (e.tagName === 'DETAILS') e.open = true;
    window.scrollTo({ top: d.getBoundingClientRect().top + window.scrollY - 70 });
  }));
  // a death badge elsewhere in the app opens that death's recap here (in the Deaths list, or a row's Recap button)
  // (after the rest of the page's buttons are wired up, so the click does something)
  if (S.pendingDeath) { const pd = S.pendingDeath; S.pendingDeath = null; setTimeout(() => {
    const b = $('#view').querySelector('.md-i[data-dg="' + CSS.escape(pd) + '"]') || $('#view').querySelector('.dd-r[data-dgs~="' + CSS.escape(pd) + '"]') || $('#view').querySelector('.mmb2[data-dg="' + CSS.escape(pd) + '"]');
    if (b) { for (let e = b.parentElement; e; e = e.parentElement) if (e.tagName === 'DETAILS') e.open = true; if (!(b.classList.contains('dd-r') && b.classList.contains('on'))) b.click(); (b.classList.contains('dd-r') ? b : b.closest('.md') || b).scrollIntoView({ block: 'center' }); }
  }, 0); }
  // list-and-detail panels: clicking an entry shows its details
  $('#view').querySelectorAll('.md-i').forEach((b) => (b.onclick = () => { const md = b.closest('.md'); md.querySelectorAll('.md-i').forEach((x) => x.classList.toggle('on', x === b)); md.querySelectorAll('.md-d').forEach((d) => { d.hidden = d.dataset.i !== b.dataset.i; }); }));
  // (Deaths: each line opens its recap under it, and closes it again)
  $('#view').querySelectorAll('.dd-r').forEach((b) => (b.onclick = () => { const md = b.closest('.md'), open = !b.classList.contains('on');
    md.querySelectorAll('.dd-r').forEach((x) => { x.classList.toggle('on', open && x === b); x.setAttribute('aria-expanded', String(open && x === b)); });
    md.querySelectorAll('.dd-b').forEach((d) => { d.hidden = !(open && d.dataset.i === b.dataset.i); }); }));
  $('#view').querySelectorAll('.mmb').forEach((b) => (b.onclick = () => {
    const mp = AUDITMAPS[+b.dataset.i], tr = b.closest('tr');
    if (tr) {
      // table rows: open the map in a new row right under the row it belongs to (one open map per table)
      const next = tr.nextElementSibling;
      if (next && next.classList.contains('maprow') && next.dataset.i === b.dataset.i) { next.remove(); return; }
      tr.closest('tbody').querySelectorAll('tr.maprow').forEach((x) => x.remove());
      const row = document.createElement('tr'); row.className = 'maprow'; row.dataset.i = b.dataset.i;
      row.innerHTML = '<td colspan="' + tr.children.length + '"><div class="mm"></div></td>';
      tr.after(row);
      const box = row.querySelector('.mm'); box.innerHTML = miniMap(mp, pmap); bindZoom(box); bindAnim(box, mp, pmap); hydrateMapIcons(box); refreshIcons();
      return;
    }
    // (list-and-detail panels: the map opens inside the detail pane)
    const box = (b.closest('.md-d') && b.closest('.md-d').querySelector('.md-map')) || $('#mm-' + b.dataset.sec);
    if (box.dataset.i === b.dataset.i) { box.innerHTML = ''; box.dataset.i = ''; return; }
    box.dataset.i = b.dataset.i; box.innerHTML = miniMap(mp, pmap); bindZoom(box); bindAnim(box, mp, pmap); hydrateMapIcons(box);
  }));
}
// Fight audit panels shown as a list with a detail pane (the ones with many columns per row)
const MD_SECS = new Set(['soakq', 'push', 'tankfront', 'shield', 'addsets']);
// Fight audit mechanics in order of importance per boss (from the Mythic guides and the logs): what wipes the raid first,
// then what kills players, then what adds stacks or damage, then minor. Sections not listed go last.
const IMPORTANCE = {
  'The Coiled Altar': ['orbs', 'sever', 'shield', 'dmghost', 'ghosts', 'mc', 'soakq', 'inter', 'gloom', 'addsets', 'adds', 'addx', 'push', 'soulsever', 'dmstack', 'tankfront', 'front', 'kicks', 'avoid', 'vf'],
  'The Twin Fangs': ['kicks', 'bulwark', 'soaks', 'venom', 'feast', 'founts', 'stone', 'spit', 'twins', 'avoid', 'ichor'],
  'Entombed Sentinels': ['helix', 'protovenom', 'miasma', 'droplets', 'coag', 'balance', 'blighted', 'marks', 'tanks', 'avoid', 'pools'],
  // (the two biggest wipe causes are failed Fury pops and Tempest; then the winds, the Crosswinds, the soaks)
  Sszorak: ['fury', 'tempest', 'winds', 'crosswinds', 'mutilate', 'virulence', 'cysts', 'ravage', 'avoid'],
  // (the Mythic wipes: corpses back at once in the intermission, Amani in the well, a Curse in the well, the enrage)
  // (Mythic: totems left at Imbibe and venoms in the middle wipe; Plague Wave lines kill the most players)
  'Vashnik the Malignant': ['totems', 'venoms', 'froth', 'bile', 'infect', 'imbibe', 'fangs', 'avoid'],
  // (the Mythic wipes: a box rupture, a late fish, an Elemental Explosion, an empty leap; then United Defense and deaths)
  'The Lost Explorers': ['boxes', 'ascension', 'frostfire', 'thud', 'united', 'bomb', 'blink', 'tankstacks', 'avoid'],
  "Nek'zali the Soulcoiler": ['ritual', 'amani', 'depths', 'energy', 'ignition', 'rend', 'barrage', 'invoke', 'avoid'],
  "Ula'tek": ['eggs', 'coils', 'waves', 'tank', 'incub', 'wretch', 'amps', 'fangs', 'doomscale', 'kicks', 'bite', 'shriek', 'avoid'],
};
let AUDITMAPS = [], AUDITHTML = [];
const kfmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(Math.round(n)));
// Deaths as a Fight audit mechanic: one red row per death; amber note when they still had something to press.
function deathSection(r) {
  const ds = r.deaths.slice().sort((a, b) => a.t - b.t);
  const recap = (d) => '<div class="dwhy"><div><b>Why they died</b><ul>' + (d.why || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' +
    '<div><b>What would have prevented it</b><ul>' + (d.prevent || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></div>' +
    '<div class="sub" style="margin:8px 0 6px">' + esc(d.player) + ': the last 10 seconds before dying at ' + T(d.t) + '</div>' +
    (d.available && d.available.length ? '<div class="note">Still available: ' + esc(andList(d.available)) + '</div>' : '') +
    '<div class="recap">' + (d.recap.slice(-40).map((e) => '<div class="ev"><span class="muted">' + T(e.t) + '</span><span class="' + (e.heal ? 'heal' : 'dmg') + '">' + (e.heal ? '+' : '−') + C(e.amount) + '</span><span>' + spell(e.id, e.spell) + ' <span class="sub">' + esc(e.src) + '</span></span><span class="muted">' + (e.hp >= 0 ? Math.round(e.hp) + '% hp' : '') + '</span></div>').join('') || '<p class="muted">No events recorded before this death.</p>') + '</div>';
  return { id: 'deaths', title: 'Deaths', spell: [0, 'Death'], verdict: ds.length ? 'bad' : 'good', summary: ds.length ? pl2(ds.length, 'death') + ' this pull.' : 'Nobody died.',
    how: 'Every player death this pull, in order. Pick one on the left: it says what did it (the biggest hit of their last seconds, which isn\'t always the one that finished them), the mistakes linked to it (theirs, or the raid\'s at that moment, like a globule exploding on everyone), their health over the last 10 seconds with each hit, the biggest hits, and what they still had ready. Ready only counts against them when there was time to press it: from over 50% to dead in 2 seconds or less is too fast. Deaths from the same hit are grouped. "Every event" lists everything in their last 10 seconds.',
    cols: ['When', 'Player', 'Killed by', 'What would have helped', 'Still had ready', ''],
    // (the first cell carries the death itself: the Mechanics tab draws deaths as a list and a detail pane from it)
    rows: ds.map((d) => [{ t: d.t, death: d }, { p: d.player }, { txt: d.ability || d.killer, bad: true, sub: d.healthy && d.window > 0 ? Math.round(d.startHp) + '% to 0 in ' + d.window.toFixed(1) + 's' : d.startHp > 0 ? 'never above ' + Math.round(d.startHp) + '% in the last 10s' : '' },
      // (still had ready only counts against them when there was time to press it)
      { txt: (d.prevent || [])[0] || '—', dim: true }, d.available && d.available.length ? (d.react === false ? { txt: andList(d.available) + ' (too fast to use)', dim: true } : { txt: andList(d.available), warn: true }) : { txt: 'nothing left', dim: true },
      { more: recap(d), label: 'Why + recap', dg: d.guid + '@' + d.t.toFixed(2) }]) };
}
// Defensives per player (the old Survivability cards): red = Poor, amber = Okay; Details opens the full list.
// The Survival kit for this pull (the Mechanics tab's Survival section): every player's survival score (survivalOf), lowest
// first, with what cost them points; red under 65, amber under 88. Details lists each defensive, potion and Healthstone.
function defenseSection(r) {
  const list = players().filter((p) => p.name && !/^Player-/.test(p.name)).map((p) => ({ p, s: survivalOf(r, p) })).sort((a, b) => a.s.score - b.s.score || a.p.name.localeCompare(b.p.name));
  const low = list.filter((x) => x.s.score < 65).length, mid = list.filter((x) => x.s.score >= 65 && x.s.score < 88).length;
  const defR = list.reduce((n, x) => n + x.s.defReady, 0), potN = list.filter((x) => x.s.expect).length, potOk = list.filter((x) => x.s.expect && x.s.used >= x.s.expect).length;
  const nStone = list.reduce((n, x) => n + x.s.stones, 0), nHp = list.reduce((n, x) => n + x.s.hpots, 0);
  return { id: 'defensives', title: 'Survival kit: defensives, Healthstones, potions', spell: [0, 'Shield Wall'], verdict: low ? 'bad' : mid ? 'warn' : 'good',
    summary: (potN ? potOk + ' of ' + potN + ' players used their combat or mana potion; ' : '') + (defR ? plural(defR, 'death') + ' with a defensive or self-heal ready; ' : 'nobody died with a defensive or self-heal ready; ') + plural(nStone, 'Healthstone') + ' and ' + plural(nHp, 'health potion') + ' used. Each use\'s time is under its count.',
    how: 'Each player\'s survival kit this pull, up to the wipe filter, scored out of 100: defensives 40 (dying with a personal defensive ready costs 50, a close call under 30% health with nothing pressed costs 20), Healthstone and health potion 30 (the same, for them) and combat or mana potion 30 (they share one 5-minute cooldown, so a healer\'s mana potion counts; one is expected per pull, two if alive more than 5 minutes, and a pre-pot counts). One-shots aren\'t held against anyone. Tanks are scored differently: defensives 60, including how often they used their big cooldowns (80% of the uses they had is full marks), Healthstone and health potion 15, combat potion 25; for a tank only a dip under 15% with nothing pressed counts. Defensives are matched by spell name with base cooldowns, so talented ones can be off by one.',
    cols: ['Player', 'Survival', 'Defensives', 'Healthstone and health potion', 'Combat or mana potion', 'Close calls', ''],
    rows: list.map(({ p, s }) => {
      const more = p.defs.map((x) => drow(spell(x.id, x.name), x.uses.length, x.possible, x.uses)).join('') +
        crow('Healthstone', p.cons.healthstone) + crow('Healing or defensive potion', p.cons.healpot) + crow('Combat potion', p.cons.combatpot) +
        (p.cons.manapot.length ? crow('Mana potion', p.cons.manapot) : '') + (p.cons.utilpot.length ? crow('Utility potion', p.cons.utilpot) : '');
      return [{ p: p.name }, { g: letterOf(s.score), gs: Math.round(s.score), bad: s.score < 65, warn: s.score >= 65 && s.score < 88 },
        s.defReady ? { txt: 'died with one ready' + (s.defReady > 1 ? ' (' + s.defReady + 'x)' : ''), bad: true } : { txt: s.deaths ? 'died with nothing left' : 'fine', dim: true },
        // (the Potions and Healthstones table was merged in here: each use's time under its count)
        { txt: (s.stones || s.hpots ? [s.stones ? plural(s.stones, 'Healthstone') : '', s.hpots ? plural(s.hpots, 'health potion') : ''].filter(Boolean).join(', ') : 'none used') + (s.kitReady ? ', died with one unused' : ''), bad: s.kitReady > 0, dim: !s.kitReady && !(s.stones + s.hpots),
          sub: [p.cons.healthstone.length ? 'Healthstone ' + p.cons.healthstone.map((u) => T(u.t)).join(', ') : '', p.cons.healpot.length ? 'potion ' + p.cons.healpot.map((u) => T(u.t)).join(', ') : ''].filter(Boolean).join(' · ') },
        s.expect ? { txt: s.used + ' of ' + s.expect, bad: !s.used, warn: s.used > 0 && s.used < s.expect, sub: [s.pre ? 'pre-pot' : ''].concat(p.cons.combatpot.concat(p.cons.manapot).filter((u) => u.t >= 3).sort((a, b) => a.t - b.t).map((u) => T(u.t))).filter(Boolean).join(', ') } : { txt: 'not judged', dim: true },
        { txt: s.calls ? s.calls + (s.silent ? ', ' + s.silent + ' with nothing pressed' : ', all answered') : 'none', warn: s.silent > 0, dim: !s.calls }, { more, label: 'Details' }];
    }) };
}
// Corrosive Spit line size in yards. Blizzard doesn't publish it (server-side areatrigger 42733); measured from
// bystander hits in our pulls: hits up to ~51 yd out from the add and up to 2.7 yd off the center line.
const SPIT_LEN = 55, SPIT_W = 6;
// Real game icons for map markers, by spell ID: resolved once (async) and cached, so animated frames pick them up.
const ICON_SYNC = new Map();
function iconHref(id) {
  if (ICON_SYNC.has(id)) return ICON_SYNC.get(id);
  ICON_SYNC.set(id, ''); iconName(id).then((n) => ICON_SYNC.set(id, n ? OFFICIAL(n)[0] : ''));
  return '';
}
// Static maps: fill in icons that resolved after the map was drawn.
function hydrateMapIcons(box) {
  const imgs = [...box.querySelectorAll('image[data-sid]')]; if (!imgs.length) return;
  let n = 0; const tick = () => { let left = 0; for (const im of imgs) { const h = ICON_SYNC.get(+im.dataset.sid); if (h) im.setAttribute('href', h); else left++; } if (left && ++n < 20) setTimeout(tick, 300); };
  tick();
}
// Adds: their signature ability's icon in a red ring (spell ID), smaller than bosses.
const ADD_LOOK = { 'Spawn of Vexhul': { sid: 1291478, r: 10, label: 'Spawn' }, 'Broodling of Ithraz': { sid: 1308385, r: 7 }, 'Caustic Globule': { sid: 1289201, r: 7 }, 'Barbed Bulwark': { sid: 1289201, r: 7, label: 'Globule', legend: 'Caustic Globule' },
  'Spiteful Soulcoiler': { sid: 1286441, r: 10, label: 'Soulcoiler', legend: 'Spiteful Soulcoiler' } }; // (on Mythic the globules log as Barbed Bulwark)
function addIcon(x, y, look, title, k) {
  k = k || 1; const r = look.r * k, href = iconHref(look.sid);
  return '<circle cx="' + x + '" cy="' + y + '" r="' + (r + 2.5 * k) + '" fill="#ff3b3b" stroke="#000" stroke-width="1"/>' +
    '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#2a1418"/>' +
    '<image data-sid="' + look.sid + '" href="' + href + '" x="' + (x - r) + '" y="' + (y - r) + '" width="' + 2 * r + '" height="' + 2 * r + '" clip-path="url(#pclip)"/>' + (title ? '<title>' + title + '</title>' : '');
}
// Bosses: a gold crest with a skull, tinted per boss so two bosses (e.g. the twins) are easy to tell apart.
function bossCrest(x, y, name, k) {
  k = k || 1; let hsh = 0; for (const c of String(name)) hsh = (hsh * 31 + c.charCodeAt(0)) >>> 0;
  const tint = ['#2f8f3a', '#9b2335', '#3a5fb0', '#8a4fc0', '#b0702a'][hsh % 5], R = 15 * k, pts = [];
  for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10, rr = i % 2 ? R + 1.5 * k : R + 5 * k; pts.push((x + rr * Math.cos(a)).toFixed(1) + ',' + (y + rr * Math.sin(a)).toFixed(1)); }
  return '<polygon points="' + pts.join(' ') + '" fill="#e6b450" stroke="#000" stroke-width="1.2"/><circle cx="' + x + '" cy="' + y + '" r="' + R + '" fill="' + tint + '" stroke="#3a2a08" stroke-width="' + 2 * k + '"/>' +
    '<circle cx="' + x + '" cy="' + (y - 1.8 * k) + '" r="' + 7 * k + '" fill="#f1ead8"/><rect x="' + (x - 4 * k) + '" y="' + (y + 2.5 * k) + '" width="' + 8 * k + '" height="' + 5 * k + '" rx="' + 1.2 * k + '" fill="#f1ead8"/>' +
    '<circle cx="' + (x - 2.7 * k) + '" cy="' + (y - 2 * k) + '" r="' + 2 * k + '" fill="#111"/><circle cx="' + (x + 2.7 * k) + '" cy="' + (y - 2 * k) + '" r="' + 2 * k + '" fill="#111"/>' +
    '<path d="M' + (x - 2 * k) + ' ' + (y + 4 * k) + 'v3M' + x + ' ' + (y + 4 * k) + 'v3M' + (x + 2 * k) + ' ' + (y + 4 * k) + 'v3" stroke="#111" stroke-width="' + 0.9 * k + '"/><title>' + esc(name) + '</title>';
}// Shared map art: a round clip for class icons and glowing-sphere gradients for orbs.
const MAP_DEFS = '<defs><clipPath id="pclip" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath>' +
  '<radialGradient id="orbG" cx=".35" cy=".32" r=".75"><stop offset="0" stop-color="#f2fff0"/><stop offset=".3" stop-color="#7cf07c"/><stop offset="1" stop-color="#0f5410"/></radialGradient>' +
  '<radialGradient id="orbP" cx=".35" cy=".32" r=".75"><stop offset="0" stop-color="#fbf0ff"/><stop offset=".3" stop-color="#c47bff"/><stop offset="1" stop-color="#3d0f66"/></radialGradient></defs>';
// Player marker: spec icon in a class-colored ring (a plain dot when the class is unknown).
function playerDot(x, y, pl, r, attrs, title) {
  const col = pl ? pl.color : '#9aa0ac';
  const icon = pIcon(pl) ? 'https://wow.zamimg.com/images/wow/icons/large/' + pIcon(pl) + '.jpg' : null;
  return '<g' + (attrs || '') + '><circle cx="' + x + '" cy="' + y + '" r="' + (r + 1.2) + '" fill="' + col + '" stroke="#000" stroke-width="1"/>' +
    (icon ? '<image href="' + icon + '" x="' + (x - r) + '" y="' + (y - r) + '" width="' + 2 * r + '" height="' + 2 * r + '" clip-path="url(#pclip)"/>' : '') +
    (title ? '<title>' + esc(title) + '</title>' : '') + '</g>';
}
// Orb marker: a glowing sphere with a soft halo, so it never reads as a player.
function orbDot(x, y, kind, label) {
  const col = kind === 'porb' ? '#b65cff' : '#5fd35f';
  return '<g><circle cx="' + x + '" cy="' + y + '" r="12" fill="' + col + '" opacity=".22"/><circle cx="' + x + '" cy="' + y + '" r="7" fill="url(#' + (kind === 'porb' ? 'orbP' : 'orbG') + ')"/>' +
    '<circle cx="' + (x - 2.2) + '" cy="' + (y - 2.4) + '" r="1.6" fill="#fff" opacity=".85"/><title>' + esc(label) + '</title></g>';
}
function kickTile(r) {
  const ks = r.kicks || [], landed = ks.reduce((s, k) => s + k.kicked, 0), missed = ks.reduce((s, k) => s + k.missed, 0);
  const v = missed > 2 ? ['b-high', 'Problems'] : missed ? ['b-med', 'Some mistakes'] : ['b-good', 'Clean'];
  return '<a class="tile tlink" href="#sec-kicks"><div class="l">' + spellIcon(0, 'Kick') + 'Interrupts</div><div class="v" style="font-size:20px"><span class="badge ' + v[0] + '" style="margin:0">' + v[1] + '</span></div><div class="s">' +
    (landed + missed ? landed + ' kicked, ' + missed + ' got off' : 'No kickable casts this pull') + '</div></a>';
}
// Small top-down map for an audit moment: everyone's position, highlighted players ringed and named.
// Zoomable map: drawn in the boss's full-arena frame (when there's an arena map) and opened zoomed on the
// mechanic. Icons and labels (class="ic") keep their on-screen size at any zoom; areas with a real size
// (cones, soak circles, the grid) scale with the room. See bindZoom.
// a Viscous Cyst (Sszorak) on a map: a lumpy venom-green blob with a shine and a bubble, outlined in the colour of how it
// was used, its number on it (k scales it, for the legend)
function cystBlob(x, y, ring, n, k) {
  k = k || 1; const P = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = (i % 2 ? 8.4 : 10) * (1 + 0.07 * Math.sin(i * 2.3)) * k; P.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.88]); }
  let d = 'M' + ((P[0][0] + P[9][0]) / 2).toFixed(1) + ' ' + ((P[0][1] + P[9][1]) / 2).toFixed(1);
  for (let i = 0; i < 10; i++) { const p = P[i], q = P[(i + 1) % 10]; d += 'Q' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ' + ((p[0] + q[0]) / 2).toFixed(1) + ' ' + ((p[1] + q[1]) / 2).toFixed(1); }
  return '<path d="' + d + 'Z" fill="#000" fill-opacity=".45" transform="translate(1.5 2)"/>' +
    '<path d="' + d + 'Z" fill="#8fd94a" stroke="' + ring + '" stroke-width="' + (2.6 * k).toFixed(1) + '"/>' +
    '<path d="' + d + 'Z" fill="#3f7a12" fill-opacity=".45" transform="translate(' + (x * 0.25).toFixed(1) + ' ' + (y * 0.25 + 2.2 * k).toFixed(1) + ') scale(.75)"/>' +
    '<ellipse cx="' + (x - 3.6 * k).toFixed(1) + '" cy="' + (y - 4 * k).toFixed(1) + '" rx="' + (3.4 * k).toFixed(1) + '" ry="' + (2 * k).toFixed(1) + '" fill="#fff" fill-opacity=".6"/>' +
    '<circle cx="' + (x + 11.5 * k).toFixed(1) + '" cy="' + (y - 7 * k).toFixed(1) + '" r="' + (2.3 * k).toFixed(1) + '" fill="#8fd94a" stroke="' + ring + '" stroke-width="1.2"/>' +
    (n != null ? '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" style="font:800 11px var(--body,sans-serif)" fill="#13260a">' + n + '</text>' : '');
}
// a popped cyst: a faded splat of goo
function cystSplat(x, y) {
  let s = ''; for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.4, r = 7 + (i % 3) * 2; s += '<circle cx="' + (x + Math.cos(a) * r).toFixed(1) + '" cy="' + (y + Math.sin(a) * r * 0.85).toFixed(1) + '" r="' + (1.6 + (i % 2)).toFixed(1) + '" fill="#8fd94a" fill-opacity=".5"/>'; }
  return '<ellipse cx="' + x + '" cy="' + y + '" rx="7" ry="5.5" fill="#8fd94a" fill-opacity=".35" stroke="#8fd94a" stroke-opacity=".5" stroke-dasharray="2 2"/>' + s;
}
function miniMap(mp, pmap) {
  const pts = mp.pts || [];
  if (!pts.length && !(mp.frames && mp.frames.some((f) => f.pts.length))) return '<p class="muted">No position data at this moment (needs Advanced Combat Logging).</p>';
  const sx = (p) => p.x, sy = (p) => -p.y; // same orientation as mapPanel
  // animated maps keep one frame for every step: bounds come from all frames, not just the one drawn
  const bpts = mp.frames ? mp.frames.flatMap((f) => f.pts) : pts;
  const fx0r = Math.min(...bpts.map(sx)), fx1r = Math.max(...bpts.map(sx)), fy0r = Math.min(...bpts.map(sy)), fy1r = Math.max(...bpts.map(sy));
  // ("Zoom to mechanic" frames everyone, or the mechanic itself when the map names it: focus { x, y, r } in yards)
  const fc = mp.focus, span = fc ? Math.max(30, fc.r * 3.2) : Math.max(fx1r - fx0r, fy1r - fy0r, 30), fcx = fc ? fc.x : (fx0r + fx1r) / 2, fcy = fc ? -fc.y : (fy0r + fy1r) / 2;
  const fx0 = fcx - span * 0.6, fy0 = fcy - span * 0.6, fs = span * 1.2; // focus square, in yards
  const W = 480, yd = W / fs; // svg units per yard (icons are sized for the focus view)
  const A = ARENAS[S.rep.item.boss];
  // world frame: the arena image plus the focus area
  const ax0 = A ? A.cx - A.w / A.s / 2 : fx0, ay0 = A ? -A.cy - A.h / A.s / 2 : fy0, ax1 = A ? ax0 + A.w / A.s : fx0 + fs, ay1 = A ? ay0 + A.h / A.s : fy0 + fs;
  const x0 = Math.min(ax0, fx0), y0 = Math.min(ay0, fy0), x1 = Math.max(ax1, fx0 + fs), y1 = Math.max(ay1, fy0 + fs);
  const X = (p) => (sx(p) - x0) * yd, Y = (p) => (sy(p) - y0) * yd, hl = new Set(mp.hl || []);
  const FW = (x1 - x0) * yd, FH = (y1 - y0) * yd, fside = Math.max(FW, FH);
  const focusVB = [(fx0 - x0) * yd, (fy0 - y0) * yd, W, W], fullVB = A ? [((ax0 + ax1) / 2 - x0) * yd - Math.max(ax1 - ax0, ay1 - ay0) * yd / 2, ((ay0 + ay1) / 2 - y0) * yd - Math.max(ax1 - ax0, ay1 - ay0) * yd / 2, Math.max(ax1 - ax0, ay1 - ay0) * yd, Math.max(ax1 - ax0, ay1 - ay0) * yd] : [0, 0, fside, fside];
  const ic = (x, y, inner) => '<g class="ic" data-x="' + x.toFixed(1) + '" data-y="' + y.toFixed(1) + '">' + inner + '</g>';
  // opens on the whole arena when there is one; "Zoom to mechanic" (or double-click) goes in
  const startVB = A ? fullVB : focusVB;
  let s = '<svg viewBox="' + startVB.join(' ') + '" class="map zmap" style="max-width:560px;width:100%;aspect-ratio:1;background:#0b0d12;touch-action:none" data-focus="' + focusVB.join(',') + '" data-full="' + fullVB.join(',') + '" data-yd="' + yd + '">';
  // the boss's arena map (built in), or a room image the user added on the Interrupts map
  const arena = arenaImg(S.rep.item.boss, { x0, y0, yd });
  const mi = arena ? null : mapImg(S.rep.item.boss);
  s += arena;
  if (mi) s += '<image href="' + mi.src + '" preserveAspectRatio="none" opacity="' + mi.op + '"' + imgAttrs(mi, { x0, y0, yd }) + '/>';
  for (let g = 0; g <= (x1 - x0); g += 10) s += '<line x1="' + g * yd + '" x2="' + g * yd + '" y1="0" y2="' + FH + '" class="mg" vector-effect="non-scaling-stroke"/>';
  for (let g = 0; g <= (y1 - y0); g += 10) s += '<line y1="' + g * yd + '" y2="' + g * yd + '" x1="0" x2="' + FW + '" class="mg" vector-effect="non-scaling-stroke"/>';
  // orbs and ghosts (Coiled Altar): glowing spheres for orbs, a ghost shape for ghosts
  const OBJS = { orb: ['#5fd35f', 'Green orb (Coalesced Venom)'], porb: ['#b65cff', 'Purple orb (Virulent Mutation)'], ghost: ['#e9eef7', 'Ghost (Manifestation of Dread)'] };
  const hasObj = new Set();
  s += MAP_DEFS;
  // tank frontal cone (from the boss toward the tank it hit), drawn to scale under everything else
  if (mp.cone) {
    const c = mp.cone, cx = X(c), cy = Y(c), R = c.r * yd;
    // map space: x east, y north (screen y is flipped), so mirror the angle
    const pt = (a) => (cx + R * Math.cos(a)).toFixed(1) + ' ' + (cy - R * Math.sin(a)).toFixed(1);
    s += '<path d="M' + cx + ' ' + cy + ' L' + pt(c.dir - c.half) + ' A' + R + ' ' + R + ' 0 0 0 ' + pt(c.dir + c.half) + ' Z" fill="rgba(255,45,45,.30)" stroke="#000" stroke-opacity=".55" stroke-width="5" vector-effect="non-scaling-stroke"/>' + // dark halo so the edge reads on the light floor maps
      '<path d="M' + cx + ' ' + cy + ' L' + pt(c.dir - c.half) + ' A' + R + ' ' + R + ' 0 0 0 ' + pt(c.dir + c.half) + ' Z" fill="none" stroke="#ff3b3b" stroke-width="2.5" vector-effect="non-scaling-stroke"/>';
  }
  // mechanic circles (e.g. the Guillotine soak), drawn to scale under everything else
  // (a ring with a guid follows that unit; with t0 it only shows while active, and shrink 'ichor' is the Coiling Ichor
  // circle: about 11 yd for 6s, then shrinking to about 5 yd as it expires)
  const ringAt = (g0) => {
    let g = g0;
    if (g0.guid) { const p = pts.find((q) => q.guid === g0.guid); if (!p) return null; g = { ...g0, x: p.x, y: p.y }; }
    if (g0.t0 != null) { const el = (mp.ft != null ? mp.ft : mp.t) - g0.t0; if (el < -0.2 || el > (g0.dur || 12)) return null; if (g0.shrink === 'ichor') g = { ...g, r: el <= 6 ? 11 : Math.max(5, 11 - (el - 6) * 1.2) }; }
    return g;
  };
  // Viscous Cysts (Sszorak): a goo blob where each one landed, its number on it and what it was for underneath, outlined
  // by how it was used; on an animated map it bursts at the moment it pops and leaves a splat
  const ftC = mp.ft != null ? mp.ft : mp.t;
  for (const c of mp.cysts || []) {
    const x = X(c), y = Y(c), el = c.popT != null ? ftC - c.popT : -1;
    if (el >= 0) { s += ic(x, y, (el < 1.4 ? '<circle cx="' + x + '" cy="' + y + '" r="' + (8 + el * 26).toFixed(1) + '" fill="none" stroke="#b8f06a" stroke-opacity="' + (1 - el / 1.4).toFixed(2) + '" stroke-width="3"/>' : '') + cystSplat(x, y)); continue; }
    s += ic(x, y, cystBlob(x, y, c.ring || '#9aa0ac', c.n, 1.2) + (c.label ? '<text x="' + x + '" y="' + (y + 26) + '" class="ml" style="font-size:10px;font-weight:800" fill="' + (c.ring || '#e7e9ee') + '">' + esc(c.label) + '</text>' : ''));
  }
  for (const g0 of mp.rings || []) {
    const g = ringAt(g0); if (!g) continue;
    const col = g.color || '#e6b450', fill = g.fill || (g.color ? 'rgba(126,224,143,.16)' : 'rgba(230,180,80,.14)');
    s += '<circle cx="' + X(g) + '" cy="' + Y(g) + '" r="' + g.r * yd + '" fill="' + fill + '" stroke="' + col + '" stroke-opacity="' + (g.dim ? 0.5 : 1) + '" stroke-width="' + (g.dim ? 1.4 : 2) + '" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>' +
      ic(X(g), Y(g) - g.r * yd, '<text x="' + X(g) + '" y="' + (Y(g) - g.r * yd - 6) + '" class="ml" fill="' + col + '">' + esc((g.label || '') + (g0.shrink ? ' ~' + Math.round(g.r) + ' yd' : '')) + '</text>');
  }
  // spit lines (Corrosive Spit): add to its target while the aim is up; this row's add bright, the others dimmer
  const ft = mp.ft != null ? mp.ft : mp.t, byG = new Map(pts.map((p) => [p.guid, p]));
  // aimed arrows on players (Sszorak's Raging Crosswinds): from the player, the way they'll be launched, while marked
  // (ang: radians in map space, east = 0, counterclockwise)
  for (const a of mp.arrows || []) {
    if (ft < a.t0 - 0.05 || ft > a.t1 + 0.05) continue; const p = byG.get(a.g); if (!p) continue;
    const L = a.len || 10, x0 = X(p), y0 = Y(p), x1 = X({ x: p.x + Math.cos(a.ang) * L, y: p.y + Math.sin(a.ang) * L }), y1 = Y({ x: p.x + Math.cos(a.ang) * L, y: p.y + Math.sin(a.ang) * L });
    const d = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / d, uy = (y1 - y0) / d, hx = x1 - ux * 9, hy = y1 - uy * 9, col = a.color || '#7fd8ff';
    const head = 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + (hx - uy * 5).toFixed(1) + ' ' + (hy + ux * 5).toFixed(1) + 'L' + (hx + uy * 5).toFixed(1) + ' ' + (hy - ux * 5).toFixed(1) + 'Z';
    s += '<line x1="' + (x0 + ux * 8).toFixed(1) + '" y1="' + (y0 + uy * 8).toFixed(1) + '" x2="' + hx.toFixed(1) + '" y2="' + hy.toFixed(1) + '" stroke="#000" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/><path d="' + head + '" fill="#000" fill-opacity=".7" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<line x1="' + (x0 + ux * 8).toFixed(1) + '" y1="' + (y0 + uy * 8).toFixed(1) + '" x2="' + hx.toFixed(1) + '" y2="' + hy.toFixed(1) + '" stroke="' + col + '" stroke-width="2.5" stroke-linecap="round"/><path d="' + head + '" fill="' + col + '"/>';
  }
  // Drawn as a band to scale. Blizzard doesn't publish its width (the line is a server-side area, areatrigger
  // 42733), so SPIT_W is an estimate until a pull with bystander hits lets us measure it.
  for (const l of mp.lines || []) {
    if (ft < l.t0 - 0.05 || ft > l.t1 + 0.3) continue;
    const a = byG.get(l.from), b = byG.get(l.to); if (!a || !b) continue;
    // only a spit that went off turns yellow; one cut short by the add dying fades out grey (it never hurt anyone)
    // an aim whose add dies before it fires is grey and dashed the whole time, so it's clear it never hurt anyone
    const dud = l.landed === false, ended = ft >= l.t1 - 0.1, fired = ended && !dud, col = fired ? '#d6ff3b' : dud ? '#9aa0ac' : '#5fe35f';
    // the line runs from the add through its target and on past them
    const ax = X(a), ay = Y(a), tx = X(b), ty = Y(b), d0 = Math.hypot(tx - ax, ty - ay) || 1, reach = Math.max(SPIT_LEN * yd, d0);
    const bx = ax + (tx - ax) / d0 * reach, by = ay + (ty - ay) / d0 * reach, len = reach, hw = SPIT_W / 2 * yd;
    const nx = -(by - ay) / len * hw, ny = (bx - ax) / len * hw;
    const band = 'M' + (ax + nx).toFixed(1) + ' ' + (ay + ny).toFixed(1) + 'L' + (bx + nx).toFixed(1) + ' ' + (by + ny).toFixed(1) + 'L' + (bx - nx).toFixed(1) + ' ' + (by - ny).toFixed(1) + 'L' + (ax - nx).toFixed(1) + ' ' + (ay - ny).toFixed(1) + 'Z';
    s += '<path d="' + band + '" fill="' + col + '" fill-opacity="' + (fired ? 0.55 : dud ? 0.1 : l.on ? 0.3 : 0.18) + '" stroke="#000" stroke-opacity=".55" stroke-width="4" vector-effect="non-scaling-stroke"/>' +
      '<path d="' + band + '" fill="none" stroke="' + col + '" stroke-opacity="' + (l.on ? 1 : 0.6) + '" stroke-width="' + (l.on ? 2 : 1.4) + '"' + (dud ? ' stroke-dasharray="5 4"' : '') + ' vector-effect="non-scaling-stroke"/>';
  }
  // targeted mechanics on players: Coiling Ichor (circle size not published: shown as a marker ring) and the
  // Stone Breaker circle on the tank (to scale)
  const marksNow = (mp.marks || []).filter((m) => ft >= m.t0 - 0.05 && ft <= m.t1 + 0.05);
  for (const m of marksNow.filter((x) => x.kind === 'stone')) { const q = byG.get(m.g); if (q) s += '<circle cx="' + X(q) + '" cy="' + Y(q) + '" r="' + m.r * yd + '" fill="rgba(255,150,40,.22)" stroke="#ff9628" stroke-width="2" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>'; }
  const hitSet = new Set(mp.hitOrbs || []), gHit = new Set(mp.ghostHit || []), gMiss = new Set(mp.ghostMiss || []);
  for (const p of pts.filter((q) => OBJS[q.kind])) {
    hasObj.add(p.kind); const [col, label] = OBJS[p.kind];
    let inner = p.kind === 'ghost'
      ? '<path d="M' + (X(p) - 6) + ' ' + (Y(p) + 7) + 'v-7a6 6 0 0 1 12 0v7l-3-2-3 2-3-2z" fill="' + col + '" stroke="#000" stroke-width="1" opacity=".9"><title>' + label + '</title></path>'
      : orbDot(X(p), Y(p), p.kind, label + (hitSet.has(p.guid) ? ', popped by the frontal' : ''));
    if (hitSet.has(p.guid)) inner += '<circle cx="' + X(p) + '" cy="' + Y(p) + '" r="10.5" fill="none" stroke="#ffd23b" stroke-width="2.5"/>'; // yellow: reads on top of the red cone
    // Soul Sever: ghosts it removed (green ring) and missed (red X)
    if (gHit.has(p.guid)) inner += '<circle cx="' + X(p) + '" cy="' + Y(p) + '" r="10" fill="none" stroke="#45c15c" stroke-width="2.5"/>';
    if (gMiss.has(p.guid)) inner += '<path d="M' + (X(p) - 8) + ' ' + (Y(p) - 8) + 'l16 16M' + (X(p) + 8) + ' ' + (Y(p) - 8) + 'l-16 16" stroke="#ff4d4d" stroke-width="3" stroke-linecap="round"/>';
    s += ic(X(p), Y(p), inner);
  }
  // adds (e.g. the Spiteful Soulcoiler casting Wail of Terror): diamond with its name; green ring = kicked, red = got off
  const gAdd = new Set(mp.goodAdd || []), bAdd = new Set(mp.badAdd || []);
  for (const p of pts.filter((q) => q.kind === 'add')) {
    const x = X(p), y = Y(p), ring = gAdd.has(p.guid) ? '#2fd15a' : bAdd.has(p.guid) ? '#ff3b3b' : null;
    const look = ADD_LOOK[p.name] || ADD_LOOK[String(p.name).replace(/ \(.*\)$/, '')]; // (kick maps name adds like "Spiteful Soulcoiler (Set 1 #2)")
    // an add with its own icon still gets the kick result: green ring = kicked, red = its cast got off, and it says so
    if (look) { const st = gAdd.has(p.guid) ? ' · kicked' : bAdd.has(p.guid) ? ' · cast got off' : ''; s += ic(x, y, (ring ? '<circle cx="' + x + '" cy="' + y + '" r="' + (look.r + 6) + '" fill="none" stroke="' + ring + '" stroke-width="3.5"/>' : '') + addIcon(x, y, look, esc(p.name)) + (look.label ? '<text x="' + x + '" y="' + (y + look.r + 14) + '" class="ml" style="font-size:10px' + (ring ? ';font-weight:800" fill="' + ring : '') + '">' + esc(look.label + st) + '</text>' : '')); continue; }
    s += ic(x, y, (ring ? '<circle cx="' + x + '" cy="' + y + '" r="14" fill="none" stroke="' + ring + '" stroke-width="3"/>' : '') +
      '<rect x="' + (x - 8) + '" y="' + (y - 8) + '" width="16" height="16" transform="rotate(45 ' + x + ' ' + y + ')" fill="#b46bff" stroke="#000" stroke-width="1.5"><title>' + esc(p.name) + '</title></rect>' +
      (bAdd.has(p.guid) ? '<path d="M' + (x - 4) + ' ' + (y - 4) + 'l8 8M' + (x + 4) + ' ' + (y - 4) + 'l-8 8" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>' : '') +
      '<text x="' + x + '" y="' + (y + 25) + '" class="ml">' + esc(p.name) + '</text>');
  }
  for (const p of pts.filter((q) => q.kind === 'boss')) s += ic(X(p), Y(p), bossCrest(X(p), Y(p), p.name) + '<text x="' + X(p) + '" y="' + (Y(p) + 33) + '" class="ml" fill="#f3c969" style="font-size:13px;font-weight:800">' + esc(p.name) + '</text>');
  for (const m of marksNow.filter((x) => x.kind === 'ichor')) { const q = byG.get(m.g); if (q) s += ic(X(q), Y(q), '<circle cx="' + X(q) + '" cy="' + Y(q) + '" r="17" fill="rgba(200,90,255,.16)" stroke="#c85aff" stroke-width="2.5" stroke-dasharray="4 3"><title>Coiling Ichor target</title></circle>'); }
  // outcome markers: green ring + check = did the mechanic right, red ring + X = got it wrong
  const good = new Set(mp.good || []), bad = new Set(mp.bad || []), warnS = new Set(mp.warn || []);
  // animated maps: a red X appears only once that player is actually hit
  const badNow = mp.badAt ? new Set(mp.badAt.filter(([, t]) => ft >= t - 0.05).map((x) => x[0])) : bad;
  // (and a green check only once that player has done it: until then they have the white ring)
  const goodNow = mp.goodAt ? new Set(mp.goodAt.filter(([, t]) => ft >= t - 0.05).map((x) => x[0])) : good;
  // (a short note after a name, e.g. Helical Toxins stacks; and lines joining two players for a moment, e.g. a pair)
  // (a tag can be for a stretch of time: [guid, text, from, to])
  const tagOf = new Map((mp.tags || []).filter(([, , a, b]) => a == null || (ft >= a && ft < b)).map(([g, txt]) => [g, txt]));
  for (const l of mp.links || []) { if (ft < l.t0 || ft > l.t1) continue; const a = byG.get(l.from), b = byG.get(l.to); if (!a || !b) continue;
    s += '<line x1="' + X(a) + '" y1="' + Y(a) + '" x2="' + X(b) + '" y2="' + Y(b) + '" stroke="#000" stroke-opacity=".6" stroke-width="6" stroke-linecap="round" vector-effect="non-scaling-stroke"/><line x1="' + X(a) + '" y1="' + Y(a) + '" x2="' + X(b) + '" y2="' + Y(b) + '" stroke="' + l.color + '" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/>'; }
  // (kept close to the icon: a thin ring just outside it and a small badge on its corner)
  const okMark = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="9.5" fill="none" stroke="#2fd15a" stroke-width="2"/><circle cx="' + (x + 7.5) + '" cy="' + (y - 7.5) + '" r="4.5" fill="#2fd15a" stroke="#000" stroke-width="1"/><path d="M' + (x + 5.4) + ' ' + (y - 7.5) + 'l1.5 1.7l2.8-3.2" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
  const badMark = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="9.5" fill="none" stroke="#ff3b3b" stroke-width="2"/><circle cx="' + (x + 7.5) + '" cy="' + (y - 7.5) + '" r="4.5" fill="#ff3b3b" stroke="#000" stroke-width="1"/><path d="M' + (x + 5.9) + ' ' + (y - 9.1) + 'l3.2 3.2M' + (x + 9.1) + ' ' + (y - 9.1) + 'l-3.2 3.2" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>';
  const warnMark = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="9.5" fill="none" stroke="#ff9f1c" stroke-width="2"/><circle cx="' + (x + 7.5) + '" cy="' + (y - 7.5) + '" r="4.5" fill="#ff9f1c" stroke="#000" stroke-width="1"/><path d="M' + (x + 7.5) + ' ' + (y - 10) + 'v3.2M' + (x + 7.5) + ' ' + (y - 5.3) + 'v.5" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>';
  for (const p of pts.filter((q) => q.kind === 'player')) {
    const pl = pmap.get(p.name), col = pl ? pl.color : '#9aa0ac', on = hl.has(p.guid) || good.has(p.guid) || bad.has(p.guid) || warnS.has(p.guid), mark = badNow.has(p.guid) ? 'bad' : goodNow.has(p.guid) ? 'good' : warnS.has(p.guid) ? 'warn' : '';
    const tg = tagOf.get(p.guid);
    s += ic(X(p), Y(p), playerDot(X(p), Y(p), pl, on ? 7 : 6, ' class="pl' + (on && !mark ? ' k' : '') + '" style="opacity:' + (on ? 1 : 0.6) + '"', p.name) +
      (mark === 'good' ? okMark(X(p), Y(p)) : mark === 'bad' ? badMark(X(p), Y(p)) : mark === 'warn' ? warnMark(X(p), Y(p)) : '') +
      (on ? '<text x="' + X(p) + '" y="' + (Y(p) - 15) + '" class="ml" fill="' + col + '">' + esc(p.name) + (tg ? '<tspan fill="#f3d48a" font-weight="800"> ' + esc(tg) + '</tspan>' : '') + '</text>' : ''));
  }
  // legend inside the image: only what this map shows
  const leg = [[(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="#9aa0ac" stroke="#000"/>', 'Player (class icon)']];
  if ([...hl].some((g) => !good.has(g) && !bad.has(g))) leg.push([(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="#9aa0ac" stroke="#fff" stroke-width="2.5"/>', 'White ring: ' + (mp.hlLabel || 'player this is about')]);
  if (mp.goodAt && good.size) leg.push([(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="#9aa0ac" stroke="#fff" stroke-width="1.5"/>', 'White ring: ' + (mp.pendLabel || 'not done yet')]);
  if (good.size) leg.push([(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="none" stroke="#2fd15a" stroke-width="2.5"/><path d="M' + (x - 3) + ' ' + y + 'l2 2.5l4-4.5" fill="none" stroke="#2fd15a" stroke-width="2"/>', 'Green ✓: ' + (mp.goodLabel || 'did it right') + (mp.goodAt ? ' (from the moment they do)' : '')]);
  if ((mp.cysts || []).length) leg.push([(x, y) => cystBlob(x, y, '#2fd15a', null, 0.62), 'Viscous Cyst: its number, and what it was used for']);
  if ((mp.arrows || []).length) leg.push([(x, y) => '<line x1="' + (x - 6) + '" y1="' + (y + 4) + '" x2="' + (x + 3) + '" y2="' + (y - 2) + '" stroke="#7fd8ff" stroke-width="2.5" stroke-linecap="round"/><path d="M' + (x + 7) + ' ' + (y - 5) + 'l-6 0.5l3 4z" fill="#7fd8ff"/>', 'Arrow: the way Raging Crosswinds will launch them']);
  // (the sample is the tag itself when it's a short word, like "Fury"; a number otherwise)
  if ((mp.tags || []).length) { const tw = String(mp.tags[0][1]), smp = tw.length <= 4 && !/^\d+$/.test(tw) ? tw : '3';
    leg.push([(x, y) => '<text x="' + x + '" y="' + (y + 4) + '" fill="#f3d48a" font-size="' + (smp.length > 1 ? 10 : 12) + '" font-weight="800" text-anchor="middle">' + esc(smp) + '</text>', mp.tagLabel || 'Number by a name']); }
  for (const l of (mp.links || []).filter((x, i, a) => a.findIndex((y) => y.color === x.color) === i)) leg.push([(x, y) => '<line x1="' + (x - 6) + '" y1="' + (y + 4) + '" x2="' + (x + 6) + '" y2="' + (y - 4) + '" stroke="' + l.color + '" stroke-width="3" stroke-linecap="round"/>', (l.color === '#2fd15a' ? 'Green line: ' : l.color === '#f3c969' ? 'Amber line: ' : 'Line: ') + (l.legend || '')]);
  if (bad.size) leg.push([(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="none" stroke="#ff3b3b" stroke-width="2.5"/><path d="M' + (x - 2.5) + ' ' + (y - 2.5) + 'l5 5M' + (x + 2.5) + ' ' + (y - 2.5) + 'l-5 5" stroke="#ff3b3b" stroke-width="2"/>', 'Red ✕: ' + (mp.badLabel || 'got it wrong')]);
  if (warnS.size) leg.push([(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="none" stroke="#ff9f1c" stroke-width="2.5"/><path d="M' + x + ' ' + (y - 3) + 'v3M' + x + ' ' + (y + 2) + 'v.5" stroke="#ff9f1c" stroke-width="2" stroke-linecap="round"/>', 'Orange !: ' + (mp.warnLabel || 'needs a look')]);
  if (gAdd.size || bAdd.size) leg.push([(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="none" stroke="' + (gAdd.size ? '#2fd15a' : '#ff3b3b') + '" stroke-width="2.5"/>', gAdd.size ? 'Green ring: the add that was kicked' : 'Red ring: the add whose cast got off']);
  if (pts.some((q) => q.kind === 'add' && !(ADD_LOOK[q.name] || ADD_LOOK[String(q.name).replace(/ \(.*\)$/, '')]))) leg.push([(x, y) => '<rect x="' + (x - 4.5) + '" y="' + (y - 4.5) + '" width="9" height="9" transform="rotate(45 ' + x + ' ' + y + ')" fill="#b46bff" stroke="#000"/>', 'Add' + (gAdd.size ? ' (green ring: kicked)' : bAdd.size ? ' (red ring: cast got off)' : '')]);
  if (pts.some((q) => q.kind === 'boss')) leg.push([(x, y) => bossCrest(x, y, 'Boss', 0.33), 'Boss (gold crest)']);
  for (const k of hasObj) leg.push([(x, y) => k === 'ghost' ? '<path d="M' + (x - 5) + ' ' + (y + 6) + 'v-6a5 5 0 0 1 10 0v6l-2.5-1.7-2.5 1.7-2.5-1.7z" fill="#e9eef7" stroke="#000"/>' : '<circle cx="' + x + '" cy="' + y + '" r="5.5" fill="url(#' + (k === 'porb' ? 'orbP' : 'orbG') + ')"/>', OBJS[k][1]]);
  if (mp.lines && mp.lines.length) leg.push([(x, y) => '<path d="M1 11L11 1L15 5L5 15Z" fill="rgba(95,227,95,.4)" stroke="#5fe35f" stroke-width="1.2"/>', 'Green band: Corrosive Spit aiming, from the add through its target and beyond. It only hurts the moment it fires (turns yellow); grey dashed = the add died before it fired, so it never hit anyone. About ' + SPIT_LEN + ' yd long, ' + SPIT_W + ' yd wide, measured from bystander hits']);
  for (const [nm, look] of Object.entries(ADD_LOOK)) if (pts.some((q) => q.kind === 'add' && q.name === nm) || (mp.frames && mp.frames.some((f) => f.pts.some((q) => q.name === nm)))) leg.push([(x, y) => addIcon(x, y, look, '', 6 / (look.r + 2.5)), look.legend || nm]);
  if ((mp.marks || []).some((m) => m.kind === 'ichor')) leg.push([(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="rgba(200,90,255,.2)" stroke="#c85aff" stroke-width="2" stroke-dasharray="3 2"/>', 'Purple dashed ring: Coiling Ichor target (circle size not published)']);
  if ((mp.marks || []).some((m) => m.kind === 'stone')) leg.push([(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="rgba(255,150,40,.25)" stroke="#ff9628" stroke-width="1.5" stroke-dasharray="3 2"/>', 'Orange circle: Stone Breaker on the tank (3.5 yd)']);
  if (mp.cone) leg.push([(x, y) => '<path d="M' + (x - 6) + ' ' + (y + 5) + 'L' + (x + 6) + ' ' + (y + 5) + 'L' + x + ' ' + (y - 6) + 'Z" fill="rgba(255,45,45,.45)" stroke="#ff3b3b" stroke-width="1.5"/>', 'Frontal: 60° cone, ' + mp.cone.r + ' yd, aimed at the tank']);
  if (hitSet.size) leg.push([(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="none" stroke="#ffd23b" stroke-width="2.5"/>', 'Yellow ring: orb inside the frontal']);
  if (gHit.size) leg.push([(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="none" stroke="#45c15c" stroke-width="2.5"/>', 'Green ring: ghost the frontal removed']);
  if (gMiss.size) leg.push([(x, y) => '<path d="M' + (x - 5) + ' ' + (y - 5) + 'l10 10M' + (x + 5) + ' ' + (y - 5) + 'l-10 10" stroke="#ff4d4d" stroke-width="2.5" stroke-linecap="round"/>', 'Red X: ghost the frontal missed']);
  if (gHit.size || gMiss.size) leg.push([(x, y) => '<text x="' + (x - 3) + '" y="' + (y + 4) + '" fill="#9aa0ac" font-size="11">i</text>', 'Ghosts shown where they spawned']);
  for (const g of (mp.rings || []).filter((x, i, a) => a.findIndex((y) => (y.legend || y.label || '') === (x.legend || x.label || '')) === i)) leg.push([(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="' + (g.fill || (g.color ? 'rgba(126,224,143,.2)' : 'rgba(230,180,80,.2)')) + '" stroke="' + (g.color || '#e6b450') + '" stroke-dasharray="3 2"/>', (g.cn ? g.cn + ': ' : g.color === '#b65cff' ? 'Purple circle: ' : g.color ? 'Green circle: ' : 'Gold circle: ') + (g.legend || g.label || 'mechanic area') + (g.shrink === 'ichor' ? ' (shrinks from ~11 yd)' : '')]);
  s += '</svg>';
  // legend strip attached under the map (outside the zoomed area, so it never moves or covers anything)
  const legend = '<div class="zleg">' + leg.map(([icn, t]) => '<span><svg width="16" height="16" viewBox="0 0 16 16">' + MAP_DEFS + icn(8, 8) + '</svg>' + esc(t) + '</span>').join('') + '</div>';
  return '<div class="sub" style="margin:10px 0 6px">' + esc(mp.title) + '. Hover any icon for a name.' +
    (mi || arena ? '' : ' To show the room behind the dots, add a map image under Interrupts → Missed casts.') +
    (mp.note ? '<div style="margin-top:4px;font-weight:600;color:var(--text)">' + esc(mp.note) + '</div>' : '') + '</div>' +
    '<div class="zwrap" style="max-width:560px"><div class="zbar">' + (A ? '<button class="btn zfull on" type="button">Full arena</button><button class="btn zfocus" type="button">Zoom to mechanic</button>' : '') +
    '<span class="sub">Scroll to zoom, drag to move, double-click to switch views</span></div>' +
    '<div class="zbox">' + s + '<div class="zscale"><i></i><span>10 yards</span></div><div class="znorth">N ↑</div></div>' +
    (mp.frames ? '<div class="zanim"><button class="btn zplay" type="button">❚❚ Pause</button><input class="zrange" type="range" min="0" max="' + (mp.frames.length - 1) + '" value="0" step="1"><span class="ztime sub"></span></div>' : '') + legend + '</div>';
}
// Animated map (mp.frames): plays once from the first frame, then the slider scrubs. Each frame redraws the
// map's contents in place, so zoom and pan stay where they are.
function bindAnim(box, mp, pmap) {
  if (!mp.frames || !mp.frames.length) return;
  const svg = box.querySelector('svg.zmap'), rng = box.querySelector('.zrange'), btn = box.querySelector('.zplay'), lab = box.querySelector('.ztime');
  if (!svg || !rng) return;
  const inner = (html) => { const a = html.indexOf('<svg'), b = html.indexOf('>', a), c = html.indexOf('</svg><div class="zscale">', b); return html.slice(b + 1, c); };
  // Playback is drawn every screen refresh (~60 fps) at real-time speed, blending each unit's position between the
  // 0.2s frames (the log itself records positions about every 0.5s, so this smooths movement, it doesn't add detail).
  const fr = mp.frames, t0 = fr[0].t, t1 = fr[fr.length - 1].t;
  let ft = t0, raf = null, last = 0, drawn = -1;
  const at = (t) => {
    let i = 0; while (i < fr.length - 2 && fr[i + 1].t <= t) i++;
    const a = fr[i], b = fr[Math.min(i + 1, fr.length - 1)], w = b.t > a.t ? Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))) : 0;
    if (w === 0 || a === b) return { i, pts: a.pts };
    const nb = new Map(b.pts.map((p) => [p.guid, p]));
    return { i, pts: a.pts.map((p) => { const q = nb.get(p.guid); return q ? { ...p, x: p.x + (q.x - p.x) * w, y: p.y + (q.y - p.y) * w } : p; }) };
  };
  const show = (t) => {
    ft = Math.min(t1, Math.max(t0, t));
    const { i, pts } = at(ft);
    svg.innerHTML = inner(miniMap({ ...mp, pts, ft }, pmap));
    if (drawn !== i) { rng.value = i; drawn = i; }
    lab.textContent = T(ft) + '.' + String(Math.floor((ft % 1) * 10));
    if (box._zoomApply) box._zoomApply();
  };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; btn.textContent = '▶ Play'; };
  const step = (now) => {
    if (!box.isConnected) return stop();
    const dt = last ? (now - last) / 1000 : 0; last = now;
    show(ft + dt);
    if (ft >= t1) return stop();
    raf = requestAnimationFrame(step);
  };
  const play = () => { if (ft >= t1) ft = t0; btn.textContent = '❚❚ Pause'; last = 0; raf = requestAnimationFrame(step); };
  btn.onclick = () => (raf ? stop() : play());
  rng.oninput = () => { stop(); show(fr[+rng.value].t); };
  show(t0); play();
}
// Zoom and pan for miniMap: wheel zooms around the cursor, drag pans, double-click goes back to the mechanic.
// Icons are counter-scaled so they keep their size on screen; the scale bar follows the zoom.
function bindZoom(box) {
  const svg = box.querySelector('svg.zmap'); if (!svg) return;
  const focus = svg.dataset.focus.split(',').map(Number), full = svg.dataset.full.split(',').map(Number), yd = +svg.dataset.yd;
  const bar = box.querySelector('.zscale i');
  const hasArena = !!box.querySelector('.zfull');
  let vb = (hasArena ? full : focus).slice(); // starts on the whole arena (see miniMap)
  const apply = () => {
    svg.setAttribute('viewBox', vb.map((v) => v.toFixed(2)).join(' '));
    const k = vb[2] / 480; // 1 at the mechanic view
    for (const g of svg.querySelectorAll('g.ic')) { const x = +g.dataset.x, y = +g.dataset.y; g.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + k + ') translate(' + -x + ' ' + -y + ')'); }
    const w = svg.getBoundingClientRect().width || 480; if (bar) bar.style.width = (10 * yd * w / vb[2]).toFixed(1) + 'px';
    const f = box.querySelector('.zfocus'), u = box.querySelector('.zfull');
    if (f) { const atFull = vb[2] >= full[2] * 0.95; f.classList.toggle('on', !atFull); u.classList.toggle('on', atFull); }
  };
  const toSvg = (e) => { const r = svg.getBoundingClientRect(); return [vb[0] + (e.clientX - r.left) / r.width * vb[2], vb[1] + (e.clientY - r.top) / r.height * vb[3]]; };
  box._zoomApply = apply; // animated maps redraw the contents and re-apply the icon scale
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [px, py] = toSvg(e), f = e.deltaY < 0 ? 1 / 1.15 : 1.15, nw = Math.min(Math.max(vb[2] * f, 40), Math.max(full[2], focus[2]) * 1.3), q = nw / vb[2];
    vb = [px - (px - vb[0]) * q, py - (py - vb[1]) * q, nw, nw]; apply();
  }, { passive: false });
  let drag = null;
  svg.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, vb: vb.slice() }; svg.setPointerCapture(e.pointerId); svg.style.cursor = 'grabbing'; });
  svg.addEventListener('pointermove', (e) => { if (!drag) return; const r = svg.getBoundingClientRect(); vb = [drag.vb[0] - (e.clientX - drag.x) / r.width * vb[2], drag.vb[1] - (e.clientY - drag.y) / r.height * vb[3], vb[2], vb[3]]; apply(); });
  svg.addEventListener('pointerup', () => { drag = null; svg.style.cursor = ''; });
  svg.addEventListener('dblclick', () => { vb = (hasArena && vb[2] < full[2] * 0.95 ? full : focus).slice(); apply(); });
  const fb = box.querySelector('.zfocus'), ub = box.querySelector('.zfull');
  if (fb) fb.onclick = () => { vb = focus.slice(); apply(); };
  if (ub) ub.onclick = () => { vb = full.slice(); apply(); };
  apply();
}
function phaseBar(r, m) {
  const dur = r.duration, W = 1000, pc = ['#3b4a6b', '#5a3b6b', '#6b5a2a', '#6b2f3b'];
  const X = (t) => (t / dur * 100).toFixed(2) + '%';
  const segs = m.phases.map((p, i) => '<div class="ph" style="left:' + X(p.start) + ';width:' + ((p.end - p.start) / dur * 100).toFixed(2) + '%;background:' + pc[i % 4] + '" title="' + esc(p.name) + ' ' + T(p.start) + ' to ' + T(p.end) + '"><span>' + esc(p.name) + '</span></div>').join('');
  const lanes = { orb: 0, front: 0, soak: 1, ghost: 1, add: 2, shield: 2, phase: 2, raid: 3 };
  const mk = m.marks.map((k) => '<span class="pm" style="left:' + X(k.t) + ';top:' + (lanes[k.kind] * 24) + 'px" title="' + esc(k.label + ' at ' + T(k.t)) + '">' + spellIcon(k.id, k.label) + '</span>').join('');
  const dt = r.deaths.map((d) => '<span class="pd" style="left:' + X(d.t) + '" title="' + esc(d.player + ' died at ' + T(d.t)) + '"></span>').join('');
  const ticks = []; const step = dur > 400 ? 60 : 30; for (let s = 0; s <= dur; s += step) ticks.push('<span class="ptk" style="left:' + X(s) + '">' + T(s) + '</span>');
  return '<div class="pbar"><div class="phs">' + segs + '</div><div class="pms">' + mk + '</div><div class="pds">' + dt + '</div><div class="ptks">' + ticks.join('') + '</div></div>' +
    '<div class="legend" style="margin-top:6px"><span>' + esc(m.legend || 'Rows: orbs and frontals, soaks and ghosts, adds and shields, raid damage. Red ticks are deaths. Hover any icon for its time.') + '</span></div>';
}

// ---------- progression across pulls ----------
// Shown at the bottom of Overview. Warcraft Logs pulls each have to be downloaded, so only pulls already
// opened are included until "Load all pulls" is pressed (pulls saved on this PC count as opened).
let PROG_REPS = null;
const SHOW_PROG_EXTRAS = false;
// ---------- night summary ----------
// One boss across the night: how each mechanic went pull to pull, and the players who stood out. MVPs are scored
// on clean play (deaths and mistakes per pull, after the wipe filter) plus using what they had: healthstones,
// potions, personal defensives and immunities. Pulls not downloaded yet can be loaded with one button.
const IMMUNITIES = ['divine shield', 'ice block', 'aspect of the turtle', 'cloak of shadows', 'blessing of protection', 'blessing of spellwarding', 'dispersion', 'netherwalk', 'anti-magic shell'];
let NIGHT_ALL = false;
// ---------- NSRT audit for all pulls ----------
// Every assignment the note makes, checked against every pull of the boss: a grid with one column per pull (green done,
// amber partly, red missed, grey didn't come up or came after the wipe filter; click a square to open that pull's NSRT
// audit), who missed the most across the night, and each pull's assignment mistakes listed pull by pull. The checks are the
// same ones the single-pull NSRT audit makes (rep.assign); this only lines them up.
function nsrtChecks(r) {
  const a = r.assign; if (!a || a.error) return null;
  const ct = cutT(r), ok = (t) => t == null || t <= ct + 0.05, out = [], names = (xs) => xs.join(', ');
  const put = (cat, key, label, st, tip, ord, who) => out.push({ cat, key: cat + '|' + key, label, st, tip, ord: ord || 0, who: who || [] }); // (who: the players behind a miss)
  // Guillotine: per drop, its soak team, external and Zephyr as three rows next to each other ("P1 Guillotine 1 · Soak")
  for (const s of a.soaks) {
    const cd = s.kind === 'external' || s.kind === 'zephyr', cat = 'Guillotine', kind = s.kind === 'zephyr' ? 'Zephyr' : s.kind === 'external' ? 'External' : 'Soak';
    const m = s.label.match(/(?:soak|guillotine)\s*#?\s*(\d+)/i), p = s.label.match(/\bp\s*(\d)\b/i), label = (p ? 'P' + p[1] + ' ' : '') + 'Guillotine ' + (m ? m[1] : '?') + ' · ' + kind;
    const ord = (p ? +p[1] : 0) * 1000 + (m ? +m[1] : 99) * 10 + { Soak: 0, External: 1, Zephyr: 2 }[kind];
    if (!s.soak) { put(cat, s.label, label, 'na', 'Not in this pull', ord); continue; }
    if (!ok(s.soak.t)) { put(cat, s.label, label, 'na', 'After the wipe filter', ord); continue; }
    const miss = s.missing || [], extra = cd ? [] : s.extra || [];
    put(cat, s.label, label, miss.length ? 'bad' : extra.length ? 'warn' : 'ok', [miss.length ? 'Missing: ' + names(miss) : '', extra.length ? 'Not assigned but soaked: ' + names(extra) : '', cd && s.target ? 'Target ' + s.target : '', cd ? s.info || '' : ''].filter(Boolean).join(' · ') || 'Everyone assigned was in it', ord, miss.length ? miss : extra);
  }
  for (const o of a.orbs) {
    if (o.kind !== 'purple') continue; // (purple orbs are hard-assigned; green and backups are only listed in the pull's own audit)
    if (o.note === 'Phase not reached') { put('Purple orbs', o.label, o.label, 'na', 'Phase not reached'); continue; }
    const extra = [...o.outside].filter(([, x]) => ok(x.t)), got = o.assigned.map((n) => { const g = o.got.get(n) || { n: 0, of: 0 }; return n + ' ' + (o.waves != null ? (g.of ? g.n + '/' + g.of : '—') : g.n); });
    put('Purple orbs', o.label, o.label, extra.length ? 'warn' : o.waves === 0 ? 'na' : 'ok', (extra.length ? 'Picked up without being assigned: ' + extra.map(([n, x]) => n + (x.n > 1 ? ' (' + x.n + ')' : '')).join(', ') + ' · ' : '') + 'Assigned (waves picked up): ' + got.join(', '), 0, extra.map(([n]) => n));
  }
  // Coiled Altar: the kick rotation on each Soulcoiler set, the CC on each Dreadmarch, the curses on each add set, each ghost soaker
  const CA = a.boss && a.boss.ca;
  if (CA && CA.sets) for (const s of CA.sets) {
    const label = 'Set ' + s.set + ' (' + s.phase.split(',')[0] + ')';
    if (!ok(s.t)) { put('Soulcoiler kicks', 'set' + s.set, label, 'na', 'After the wipe filter', s.set); continue; }
    const off = s.adds.flatMap((x) => x.gotOff), slip = s.adds.flatMap((x) => x.kicks.filter((k) => !k.ok && k.listed));
    put('Soulcoiler kicks', 'set' + s.set, label, off.length ? 'bad' : slip.length ? 'warn' : 'ok', off.length ? plural(off.length, 'cast') + ' got through' + (off.some((g) => g.want) ? ' (' + [...new Set(off.filter((g) => g.want).map((g) => g.want + '\'s turn'))].join(', ') + ')' : '') : slip.length ? plural(slip.length, 'kick') + ' out of turn' : 'all in turn', s.set,
      off.length ? [...new Set(off.filter((g) => g.want && !g.dead).map((g) => g.want))] : [...new Set(slip.map((k) => k.who))]);
  }
  if (a.mcCC) for (const d of a.mcCC.rows) {
    const label = 'Dreadmarch ' + d.n + ' (' + d.ph + ')';
    if (!ok(d.s)) { put('Mind control CC', 'dm' + d.n, label, 'na', 'After the wipe filter', d.n); continue; }
    const first = (d.ccers.find((o) => !o.why) || {}).n, early = d.st === 'warn' ? (d.txt.match(/^(.+) went before /) || [])[1] : null;
    put('Mind control CC', 'dm' + d.n, label, d.st, d.txt + (d.cc.length ? ' · CC: ' + [...new Set(d.cc.map((c) => c.who + ' ' + c.spell))].slice(0, 4).join(', ') : ''), d.n, d.st === 'bad' && first ? [first] : early ? [early] : []);
  }
  if (a.curses) for (const s of a.curses.rows) {
    const label = 'Set ' + s.n + ' (' + s.ph + ')', j = s.adds.filter((x) => x.st !== 'na');
    if (!ok(s.t)) { put('Add curses', 'set' + s.n, label, 'na', 'After the wipe filter', s.n); continue; }
    const st = !j.length ? 'na' : j.some((x) => x.st === 'bad') ? 'bad' : j.some((x) => x.st === 'warn') || (s.idle && s.idle.length) ? 'warn' : 'ok';
    const missed = [...new Set(j.filter((x) => x.st !== 'ok').flatMap((x) => x.want.filter((n) => !x.curses.some((c) => c.who === n))).concat(s.idle || []))];
    put('Add curses', 'set' + s.n, label, st, s.adds.map((x) => ({ unmarked: 'Unmarked', marked: 'Raid-marked', either: 'No marker' }[x.kind]) + ': ' + x.txt).join(' · '), s.n, st === 'ok' ? [] : missed);
  }
  if (a.ghosts) for (const x of a.ghosts.rows) {
    const MK = ['', 'Star', 'Circle', 'Diamond', 'Triangle', 'Moon', 'Square', 'Cross', 'Skull'], label = (x.mark ? MK[x.mark] + ' · ' : '') + x.n;
    if (!a.ghosts.reached) { put('Ghost soaks', x.n, label, 'na', 'Intermission not reached', x.mark || 9); continue; }
    if (!ok(a.ghosts.from)) { put('Ghost soaks', x.n, label, 'na', 'After the wipe filter', x.mark || 9); continue; }
    put('Ghost soaks', x.n, label, x.st, x.txt + (a.ghosts.through ? ' · ' + plural(a.ghosts.through, 'fragment') + ' reached Zul\'jan' : ''), x.mark || 9, x.st === 'ok' ? [] : [x.n]);
  }
  // Entombed Sentinels: the note's Blood and Breath groups, one check per player (their group's boss in cycle 1, then the
  // other one after every intermission); on the other boss in any cycle could be better. (Per player, not per cycle: two
  // players swapped all night are two slips, not every cycle failed.)
  const SD = a.boss && a.boss.sides;
  if (SD && SD.rows) { const cyc = SD.rows.filter((x) => ok(x.t));
    for (const [k, list] of [['Blood', SD.blood || []], ['Breath', SD.breath || []]]) list.forEach((n, i) => {
      const label = n + ' (' + k + ' group)', key = k + '|' + n, seen = cyc.filter((x) => !x.none.includes(n)), off = cyc.filter((x) => x.wrong.some((w) => w.n === n));
      if (!seen.length) { put('Sides', key, label, 'na', 'Not in this pull, or after the wipe filter', i); return; }
      put('Sides', key, label, off.length ? 'warn' : 'ok', off.length ? 'On the other boss in cycle' + (off.length > 1 ? 's ' : ' ') + off.map((x) => x.cycle).join(', ') : 'On their side every cycle', (k === 'Blood' ? 0 : 100) + i, off.length ? [n] : []);
    }); }
  // Sszorak: the note's Mutilate groups, one check per Mutilate (someone from the other group in it, or 3+ of its own
  // group missing, could be better; one or two out is fine), and the Serpent's Fury timer, one check per pop
  const ZM = a.boss && a.boss.sz && a.boss.sz.mut;
  if (ZM) for (const x of ZM.rows) {
    const label = 'Mutilate ' + x.i + ' (set ' + (x.set || '?') + ')';
    if (!ok(x.t) || !x.group) { put('Mutilate groups', 'm' + x.i, label, 'na', !x.group ? 'Nobody from the note soaked it' : 'After the wipe filter', x.i); continue; }
    put('Mutilate groups', 'm' + x.i, label, x.wrong.length || x.short ? 'warn' : 'ok', [x.group + ' group, ' + x.n + ' of ' + x.of, x.wrong.length ? 'other group in it: ' + x.wrong.join(', ') : '', x.short ? 'not in it: ' + x.missed.join(', ') : ''].filter(Boolean).join(' · '), x.i, x.wrong.concat(x.short ? x.missed : []));
  }
  const ZT = a.boss && a.boss.sz && a.boss.sz.timer;
  if (ZT) for (const x of ZT.rows) {
    if (x.popT == null || !ok(x.popT)) { put('Fury timer', 'f' + x.i, 'Fury ' + x.i + ' (' + T(x.t) + ')', 'na', x.popT == null ? 'Not popped' : 'After the wipe filter', x.i); continue; }
    put('Fury timer', 'f' + x.i, 'Fury ' + x.i + ' (' + T(x.t) + ')', x.st, 'Popped ' + (x.d >= 0 ? '+' : '') + x.d.toFixed(1) + ' s off the timer', x.i, []);
  }
  // Nek'zali: the note's well groups, one check per Drowned Echo, and the Pyre soak list, one check per Pyre (someone from
  // the wrong list, or 3+ of the right one missing, could be better)
  const NW = a.boss && a.boss.nz && a.boss.nz.well;
  if (NW) for (const x of NW.rows) {
    const label = 'Drowned Echo ' + x.i + ' (' + x.group + ')';
    if (!ok(x.t) || x.empty) { put('Well groups', 'w' + x.i, label, 'na', x.empty ? 'Nobody went in' : 'After the wipe filter', x.i); continue; }
    put('Well groups', 'w' + x.i, label, x.wrong.length || x.short ? 'warn' : 'ok', [x.n + ' of ' + x.of + ' in', x.wrong.length ? 'other group in it: ' + x.wrong.join(', ') : '', x.short ? 'not in it: ' + x.missed.join(', ') : ''].filter(Boolean).join(' · '), x.i, x.wrong.concat(x.short ? x.missed : []));
  }
  const NP = a.boss && a.boss.nz && a.boss.nz.pyre;
  if (NP) for (const x of NP.rows) {
    const label = 'Hungering Pyre ' + x.i;
    if (!ok(x.t)) { put('Pyre soak', 'p' + x.i, label, 'na', 'After the wipe filter', x.i); continue; }
    put('Pyre soak', 'p' + x.i, label, x.wrong.length || x.short ? 'warn' : 'ok', [x.n + ' of ' + x.of + ' from the soak list', x.wrong.length ? 'don\'t-soak list in it: ' + x.wrong.join(', ') : '', x.short ? 'not in it: ' + x.missed.join(', ') : ''].filter(Boolean).join(' · '), x.i, x.wrong.concat(x.short ? x.missed : []));
  }
  // (cooldown reminders below always carry their player, so the Night summary can count each player's presses)
  for (const k of a.kicks) {
    const missed = (r.missedKicks || []).filter((m) => (!k.mark || m.marker === k.mark) && ok(m.t)).length;
    put('Kick teams', k.label, k.label, missed ? 'bad' : 'ok', (missed ? plural(missed, 'cast') + ' got through' : 'No casts got through') + (k.idle && k.idle.length ? ' · landed no kicks: ' + names(k.idle) : ''), 0, missed ? k.idle || [] : []);
  }
  for (const c of a.cds) {
    const label = c.player + ' · ' + (c.spell || 'Spell ' + c.spellid) + ' · P' + c.ph + ' ' + T(c.time), key = c.player + '|' + c.spellid + '|' + c.ph + '|' + c.time;
    if (c.expected != null && !ok(c.expected)) { put('Assigned cooldowns', key, label, 'na', 'After the wipe filter'); continue; }
    const st = c.status === 'on time' ? 'ok' : c.status === 'late' || c.status === 'early' ? 'warn' : c.status === 'missed' ? 'bad' : 'na';
    put('Assigned cooldowns', key, label, st, c.status + (c.used != null ? ' (pressed ' + T(c.used) + ', ' + (c.delta >= 0 ? '+' : '') + c.delta.toFixed(1) + 's)' : ''), 0, [c.player]);
  }
  return out;
}
// ---------- the night: every pull of the boss on screen ----------
// Reads every pull of this boss (Warcraft Logs pulls only once downloaded, unless "Load all pulls" was clicked).
async function bossReps(it, still, onCount) {
  const pulls = S.index.bosses.filter((b) => b.id === it.id && b.diffId === it.diffId);
  const reps = []; let skipped = 0;
  for (const b of pulls) {
    if (b.wcl && !NIGHT_ALL && !CACHE.has(b) && !(await WCL.isSaved(b))) { skipped++; continue; }
    try { reps.push(await getRep(b)); } catch (e) { /* skip a pull that fails */ }
    if (!still()) return null;
    if (onCount) onCount(reps.length, pulls.length);
  }
  return { reps, skipped, pulls };
}
const loadBar = (n, of, skipped, id) => (skipped ? '<div class="nightload"><span><b>Showing ' + n + ' of ' + of + ' pulls.</b> ' + skipped + ' haven\'t been downloaded yet, so the numbers below leave them out.</span><button class="btn primary" id="' + id + '">Load all pulls</button></div>' : '');

// ---- Night summary: one card per boss pulled tonight, in the order first pulled (see nightTimeline and nightDebrief) ----
// (Warcraft Logs pulls that aren't downloaded yet still show on the timeline; the debrief needs "Load all pulls".)
// what ended a wipe: the earliest of its first death and its first serious raid-wide failure
function causeOf(r) {
  if (r.item.kill) return null;
  const d = r.deaths.slice().sort((a, b) => a.t - b.t)[0];
  const rm = keptMistakes(r).filter((m) => m.player === 'Raid' && m.severity === 'High').sort((a, b) => a.t - b.t)[0];
  if (rm && (!d || rm.t <= d.t + 1)) return { label: rm.mechanic, id: rm.id, t: rm.t };
  // (a melee death names what hit them: a Viper's melee and the boss's are different problems)
  if (d) return { label: d.ability === 'Melee' && d.killer && d.killer !== 'Unknown' ? 'Melee from ' + d.killer : d.ability || 'a fall (likely a mind control)', id: d.abilityId, t: d.t, who: d.player };
  return null;
}
// ---- report card: letter grades (S, A, B, C, D, F) for how a boss's pulls were played ----
// Every score is out of 100 and only counts up to each pull's wipe filter (a pull's mess after the Nth death isn't
// graded). Mechanics: each mistake on a boss mechanic (soaks, adds, orbs, raid-wide failures) takes points off its pull
// (serious 15, medium 7, minor 2); avoidable damage and kicks have their own lines, and an NSRT-note miss is on the NSRT
// audit tab and isn't counted here. Avoidable damage: a player who took a dangerous avoidable hit loses that whole pull's
// score (100 points), a harmful-but-survivable one costs 40; the pull's score is the raid's average (the Fight audit's
// "Avoidable damage" panel decides which hits are dangerous or harmful). Survival: the raid's average survival kit score (survivalOf). Interrupts: share of the kickable casts that were kicked. The overall grade weights them 30 / 30 / 25 / 15.
const GRADES = [['S', 95], ['A', 88], ['B', 78], ['C', 65], ['D', 50], ['F', 0]];
const letterOf = (s) => GRADES.find(([, min]) => s >= min)[0];
const CARD_W = { mech: 30, avoid: 30, death: 25, kick: 15 };
function gradeBoss(reps) {
  const L = (x) => String(x || '').toLowerCase(), clamp = (v) => Math.max(0, Math.min(100, v));
  const boss = reps[0] && reps[0].item.boss;
  const hasAvoidRules = S.packs.some((p) => (p.encounter === boss || (p.aliases || []).includes(boss)) && p.rules.some((x) => String(x.type).toLowerCase() === 'avoidable'));
  const sc = { mech: [], avoid: [], death: [] }, kick = { landed: 0, total: 0 }, nm = new Map(), na = new Map(); let nMist = 0, deaths = 0, defReadyN = 0, potU = 0, potE = 0, sawAvoid = hasAvoidRules;
  for (const r of reps) {
    const ct = cutT(r), ok = (t) => t == null || t <= ct + 0.05, np = Math.max(1, r.players.size);
    // deaths
    // survival: the raid's average survival kit score this pull (survivalOf: defensives, Healthstones and potions, each up to the wipe filter)
    const sv = [...r.players.values()].filter((p) => p.name && !/^Player-/.test(p.name)).map((p) => survivalOf(r, p));
    sc.death.push(sv.length ? sv.reduce((s, x) => s + x.score, 0) / sv.length : 100);
    deaths += keptDeaths(r).length; for (const x of sv) { defReadyN += x.defReady; potU += x.used; potE += x.expect; }
    // interrupts
    for (const k of r.kicks || []) {
      const landed = r.interrupts.filter((x) => ok(x.t) && (x.id === k.id || L(x.spell) === L(k.name))).length, missed = k.missedAt.filter((x) => ok(x.t)).length;
      kick.landed += landed; kick.total += landed + missed;
    }
    // boss mechanics
    const kickNames = new Set((r.kicks || []).map((k) => L(k.name)));
    const ms = r.mistakes.filter((m) => ok(m.t) && m.mechanic !== 'Death' && !m.fromNote && !m.avoid && m.dmg == null && !m.kick && !kickNames.has(L(m.mechanic)));
    let lost = 0;
    for (const m of ms) { nm.set(m.mechanic, (nm.get(m.mechanic) || 0) + 1); lost += { High: 15, Medium: 7, Low: 2 }[m.severity] || 0; }
    nMist += ms.length; sc.mech.push(clamp(100 - lost));
    // avoidable damage: the Fight audit's per-source judging when the boss has it, otherwise the avoidable mistakes
    const av = r.module && !r.module.error && (r.module.sections || []).find((s) => s.id === 'avoid' && s.groups && s.groups.some((g) => g.judge));
    const cost = new Map(), add = (p, label, c) => { cost.set(p, (cost.get(p) || 0) + c); na.set(label, (na.get(label) || 0) + c); };
    if (av) { sawAvoid = true; for (const g of av.groups) for (const x of g.judge || []) {
      if (x.tank) continue;
      const n = x.ts.filter(ok).length, died = x.dt != null && ok(x.dt);
      if (died || n >= g.bA) add(x.p, g.label, 100); else if (n >= g.wA) add(x.p, g.label, 40);
    } } else {
      const am = r.mistakes.filter((m) => ok(m.t) && (m.avoid || m.dmg != null) && m.player !== 'Raid');
      if (am.length) sawAvoid = true;
      for (const m of am) add(m.player, m.mechanic, { High: 100, Medium: 40, Low: 10 }[m.severity] || 0);
    }
    sc.avoid.push(clamp(100 - [...cost.values()].reduce((s, v) => s + Math.min(100, v), 0) / np));
  }
  const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length, top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map((x) => x[0]);
  const cats = [{ key: 'mech', label: 'Mechanics', score: avg(sc.mech), sub: nMist ? plural(nMist, 'mistake') + ' · most: ' + top(nm, 2).join(', ') : 'No mechanic mistakes' }];
  if (sawAvoid) cats.push({ key: 'avoid', label: 'Avoidable damage', score: avg(sc.avoid), sub: na.size ? 'Most lost to: ' + top(na, 2).join(', ') : 'Nothing worth flagging' });
  cats.push({ key: 'death', label: 'Survival', score: avg(sc.death), sub: (potE ? 'combat or mana pot ' + Math.round(100 * potU / potE) + '% · ' : '') + plural(defReadyN, 'death') + ' with a defensive or self-heal ready' });
  if (kick.total) cats.push({ key: 'kick', label: 'Interrupts', score: 100 * kick.landed / kick.total, sub: kick.landed + ' of ' + kick.total + ' kicked' });
  const wsum = cats.reduce((s, c) => s + CARD_W[c.key], 0), overall = cats.reduce((s, c) => s + c.score * CARD_W[c.key], 0) / wsum;
  for (const c of cats) c.letter = letterOf(c.score);
  return { cats, overall, letter: letterOf(overall) };
}
const gradeChip = (l, big) => '<span class="grade g-' + l + (big ? ' big' : '') + '">' + l + '</span>';
// ---- Night summary, for planning next week: per boss, the progress chart of every pull and a debrief ----
// The chart shows how far each pull got (the phase it reached and that phase's boss health on multi-phase fights), with
// the best pull so far as a line, and under it the first pull that reached each phase and the best pull. The debrief ranks
// what to fix (what ended the wipes, mechanical assignments from the NSRT note that kept being missed, the avoidable damage
// players went over the limit on most, the boss mechanic missed most often), then the healing cooldowns from the note on
// their own, and says what got better or worse from the first half of the night to the second. Everything counts each
// pull up to its wipe filter.
const pullTime = (b) => (b.wallMs ? wallClock(b.wallMs) : clock(b.startMs));
function nightTimeline(pulls) {
  const cfg = pulls[0] && PROGRESS[pulls[0].boss], kill = pulls.find((b) => b.kill);
  const known = pulls.filter((b) => pullPct(b) != null), best = kill || (known.length ? known.reduce((m, b) => (pullPct(b) < pullPct(m) ? b : m)) : null);
  const first = new Map();
  for (const b of pulls) { const pg = pullProg(b); if (pg && pg.phase && !first.has(pg.phase)) first.set(pg.phase, b); }
  const marks = [];
  if (cfg) for (const p of cfg.phases.slice(1)) if (first.has(p)) marks.push('First ' + (p === 'Intermission' ? 'intermission' : p) + ': pull ' + first.get(p).pull);
  if (best && !best.kill) marks.push('Best: pull ' + best.pull + ' (' + esc(pullLabel(best)) + ')');
  if (kill) marks.push('Kill: pull ' + kill.pull);
  return (known.length ? trendSvg(pulls, true) + pullLegend('nc-leg2') : '') +
    '<div class="tl-m"><span class="sub">pull ' + pulls[0].pull + ' at ' + pullTime(pulls[0]) + ' to pull ' + pulls[pulls.length - 1].pull + ' at ' + pullTime(pulls[pulls.length - 1]) + '</span>' + (marks.length ? '<span class="tl-ms">' + marks.join(' · ') + '</span>' : '') + '</div>';
}
function nightDebrief(pulls, reps) {
  const wipes = reps.filter((r) => !r.item.kill), half = Math.floor(reps.length / 2), early = new Set(reps.slice(0, half)), late = new Set(reps.slice(reps.length - half));
  const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n);
  const ppl = (m) => top(m, 3).map(([k, c]) => esc(k) + (c > 1 ? ' (' + c + ')' : '')).join(', ');
  const bump = (m, k, n) => m.set(k, (m.get(k) || 0) + (n || 1));
  const phaseAt = (r, t) => { const ph = r.module && !r.module.error && r.module.phases; if (!ph || !ph.length) return null; let n = null; for (const p of ph) if (t >= p.start - 0.5) n = p.name.split(' ')[0]; return /^(P\d|Intermission)$/.test(n || '') ? n : null; };
  const fix = [], better = [], worse = [], trendOk = half >= 3, np = Math.max(1, reps.reduce((s, r) => s + r.players.size, 0) / Math.max(1, reps.length));
  // 1) what ended the wipes (each wipe's first death, or a serious raid-wide failure just before it)
  const causes = new Map();
  for (const r of wipes) {
    const c = causeOf(r); if (!c) continue;
    let x = causes.get(c.label); if (!x) causes.set(c.label, x = { label: c.label, id: c.id, n: 0, e: 0, l: 0, who: new Map(), ph: new Map() });
    x.n++; if (early.has(r)) x.e++; if (late.has(r)) x.l++; if (c.who) bump(x.who, c.who); const p = phaseAt(r, c.t); if (p) bump(x.ph, p);
  }
  for (const x of [...causes.values()].sort((a, b) => b.n - a.n).slice(0, 3)) {
    if (x.n < 2 && wipes.length > 2) continue;
    const phTxt = x.ph.size === 1 ? 'all in ' + [...x.ph.keys()][0] : x.ph.size ? top(x.ph, 3).map(([p, c]) => c + ' in ' + p).join(', ') : '';
    const trend = trendOk ? (x.l > x.e ? 'more often later in the night' : x.l < x.e ? 'less often later on' : 'all night long') : '';
    fix.push({ sev: 'bad', n: x.n, tier: 0, score: x.n, title: mech(x.label, x.id) + ' ended ' + x.n + ' of ' + plural(wipes.length, 'wipe'), sub: [x.who.size ? 'first to die: ' + ppl(x.who) : '', phTxt, trend].filter(Boolean).join(' · ') });
    if (trendOk && x.e - x.l >= 2) better.push(mech(x.label, x.id) + ' ended fewer pulls later on (' + x.e + ' → ' + x.l + ')');
    if (trendOk && x.l - x.e >= 2) worse.push(mech(x.label, x.id) + ' ended more pulls later on (' + x.e + ' → ' + x.l + ')');
  }
  // 2) assignments from the NSRT note that kept being missed (the all-pulls NSRT audit has the full grid)
  const rows = new Map(), cdWho = new Map(), cdP = new Map(); let cdJ = 0, cdBad = 0, cdMissed = 0, cdE = 0, cdL = 0, aE = 0, aL = 0;
  for (const r of reps) {
    const cs = nsrtChecks(r); if (!cs) continue; let bad = 0;
    for (const c of cs) {
      if (c.st === 'na') continue;
      if (c.cat === 'Assigned cooldowns') {
        cdJ++; for (const w of c.who) { let y = cdP.get(w); if (!y) cdP.set(w, y = { n: 0, late: 0, missed: 0 }); y.n++; if (c.st === 'warn') y.late++; if (c.st === 'bad') y.missed++; }
        if (c.st !== 'ok') { cdBad++; if (c.st === 'bad') cdMissed++; if (early.has(r)) cdE++; if (late.has(r)) cdL++; for (const w of c.who) bump(cdWho, w); }
        continue;
      }
      let x = rows.get(c.key); if (!x) rows.set(c.key, x = { label: c.label, j: 0, bad: 0, who: new Map() });
      x.j++; if (c.st === 'bad' || c.st === 'warn') { x.bad++; bad++; for (const w of c.who) bump(x.who, w); }
    }
    if (early.has(r)) aE += bad; if (late.has(r)) aL += bad;
  }
  for (const x of [...rows.values()].filter((x) => x.bad >= 3 && x.bad / x.j >= 0.4).sort((a, b) => b.bad - a.bad).slice(0, 3))
    fix.push({ sev: 'warn', n: x.bad, tier: 1, score: x.bad / x.j, title: esc(x.label) + ' missed on ' + x.bad + ' of ' + x.j + ' pulls', sub: (x.who.size ? 'who: ' + ppl(x.who) + ' · ' : '') + 'from the NSRT note' });
  // (healing cooldowns from the note's reminders are reported on their own, not with the mechanical assignments)
  if (trendOk && aE + aL >= 4) { if (aL <= aE * 0.7) better.push('Fewer assignment misses later on (' + aE + ' → ' + aL + ')'); else if (aL >= aE * 1.3) worse.push('More assignment misses later on (' + aE + ' → ' + aL + ')'); }
  // 3) avoidable damage: the sources players went over the limit on most (the Fight audit's per-source judging)
  const src = new Map(); let avE = 0, avL = 0;
  for (const r of reps) {
    const ct = cutT(r), ok = (t) => t == null || t <= ct + 0.05; let flagged = 0;
    const av = r.module && !r.module.error && (r.module.sections || []).find((s) => s.id === 'avoid' && s.groups && s.groups.some((g) => g.judge));
    const hit = (label, harm, p, over, died) => { let y = src.get(label); if (!y) src.set(label, y = { label, harm, pts: 0, n: 0, died: 0, who: new Map() }); y.pts += over; y.n++; if (died) y.died++; bump(y.who, p); flagged++; };
    if (av) { for (const g of av.groups) for (const x of g.judge || []) { if (x.tank) continue; const n = x.ts.filter(ok).length, died = x.dt != null && ok(x.dt), over = died || n >= g.bA ? 2 : n >= g.wA ? 1 : 0; if (over) hit(g.label, g.harm, x.p, over, died); } }
    else for (const m of keptMistakes(r)) if ((m.avoid || m.dmg != null) && m.player !== 'Raid' && m.severity !== 'Low') hit(m.mechanic, m.severity, m.player, m.severity === 'High' ? 2 : 1, false);
    if (early.has(r)) avE += flagged; if (late.has(r)) avL += flagged;
  }
  for (const y of [...src.values()].sort((a, b) => b.pts - a.pts).slice(0, 2)) if (y.n >= 3)
    fix.push({ sev: y.harm === 'High' ? 'bad' : 'warn', n: y.n, tier: 1, score: 2 * y.n / (reps.length * np) + y.died / reps.length, title: esc(y.label) + ': players went over the limit ' + plural(y.n, 'time'), sub: (y.died ? plural(y.died, 'death') + ' to it · ' : '') + 'most often: ' + ppl(y.who) });
  if (trendOk && avE + avL >= 6) { if (avL <= avE * 0.7) better.push('Less avoidable damage later on (' + avE + ' → ' + avL + ' times over the limit)'); else if (avL >= avE * 1.3) worse.push('More avoidable damage later on (' + avE + ' → ' + avL + ' times over the limit)'); }
  // 4) boss mechanics: the mistakes made most often (soaks, adds, orbs, raid-wide failures; not avoidable damage, kicks or the note)
  const mm = new Map();
  for (const r of reps) for (const m of keptMistakes(r)) {
    if (m.mechanic === 'Death' || m.fromNote || m.avoid || m.dmg != null || m.kick || m.severity === 'Low') continue;
    let x = mm.get(m.mechanic); if (!x) mm.set(m.mechanic, x = { label: m.mechanic, id: m.id, n: 0, who: new Map(), sev: m.severity });
    x.n++; if (m.player !== 'Raid') bump(x.who, m.player); if (m.severity === 'High') x.sev = 'High';
  }
  for (const x of [...mm.values()].sort((a, b) => b.n - a.n).slice(0, 2)) if (x.n >= 3)
    fix.push({ sev: x.sev === 'High' ? 'bad' : 'warn', n: x.n, tier: 1, score: (x.sev === 'High' ? 1 : 0.5) * x.n / reps.length, title: mech(x.label, x.id) + ': ' + plural(x.n, 'mistake'), sub: x.who.size ? 'most: ' + ppl(x.who) : 'raid-wide' });
  // how far the night got: how often each half reached the furthest phase, or how far it got on average
  const phs = reps.map((r) => (r.module && !r.module.error && r.module.phases && r.module.phases.length ? r.module.phases : null));
  const far = phs.filter(Boolean).reduce((m, p) => (!m || p.length > m.length ? p : m), null), real = far && far.every((x) => /^(P\d|Intermission)\b/.test(x.name)) && far.length > 1;
  if (trendOk && real) {
    const nm = far[far.length - 1].name.split(' ')[0], reach = (i) => !!phs[i] && phs[i].length === far.length;
    let e = 0, l = 0; for (let i = 0; i < half; i++) if (reach(i)) e++; for (let i = reps.length - half; i < reps.length; i++) if (reach(i)) l++;
    if (l > e) better.unshift('Reached ' + nm + ' more often: ' + l + ' of the last ' + half + ' pulls (' + e + ' of the first ' + half + ')');
    else if (l < e) worse.unshift('Reached ' + nm + ' less often: ' + l + ' of the last ' + half + ' pulls (' + e + ' of the first ' + half + ')');
  } else {
    const vals = pulls.map(pullPct).filter((v) => v != null), h2 = Math.floor(vals.length / 2), avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
    if (h2 >= 3) { const a1 = avg(vals.slice(0, h2)), a2 = avg(vals.slice(vals.length - h2)); if (a1 - a2 > 3) better.unshift('The later pulls got further (boss at ' + Math.round(a1) + '% → ' + Math.round(a2) + '% on average)'); else if (a2 - a1 > 3) worse.unshift('The later pulls ended earlier (boss at ' + Math.round(a1) + '% → ' + Math.round(a2) + '% on average)'); }
  }
  // wipes lasting longer later on is a good sign (people staying alive through more of the fight)
  const wl = wipes.map((r) => r.duration), wh = Math.floor(wl.length / 2), avgT = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  if (wh >= 3) { const t1 = avgT(wl.slice(0, wh)), t2 = avgT(wl.slice(wl.length - wh)); if (t2 >= t1 * 1.1) better.push('Wipes lasted longer: ' + T(t1) + ' → ' + T(t2) + ' on average'); else if (t2 <= t1 * 0.9) worse.push('Wipes ended sooner: ' + T(t1) + ' → ' + T(t2) + ' on average'); }
  // what ended wipes first (most often first), then the rest by how often it happened for the pulls there were
  // healing cooldowns from the note's reminders: who pressed theirs late or missed them (their own block, not a mechanic)
  const cds = cdJ ? { j: cdJ, bad: cdBad, missed: cdMissed, e: cdE, l: cdL, players: [...cdP].filter(([, y]) => y.late + y.missed).sort((a, b) => (b[1].late + b[1].missed) - (a[1].late + a[1].missed) || b[1].missed - a[1].missed).slice(0, 6) } : null;
  return { fix: fix.sort((a, b) => a.tier - b.tier || b.score - a.score).slice(0, 6), better: better.slice(0, 3), worse: worse.slice(0, 3), trendOk, cds };
}
// ---------- Summary: every pull of the boss, summarized ----------
// The all-pulls page, for the boss on screen (other bosses pulled tonight are one line each, with a button):
// 1) the overall report card (mechanics and assignments together), how far the night got (and earlier nights), and what
//    to fix before next raid;
// 2) Mechanics: its report card, then one fold-out row per mechanic under its phase, as on the Mechanics tab, with a dot
//    per pull (green clean, amber could be better, red a problem, grey didn't come up or came after the wipe filter);
//    open one for the pulls that went wrong, who keeps getting flagged, and whether it got better through the night;
// 3) Assignments: the same for the NSRT note, one row per assignment and phase, then the healing cooldowns.
// Every pull counts up to its own wipe filter. A dot, or a pull's Open button, opens that pull on Mechanics or Assignments.
const icoW = (n) => '<span class="icw big"><img class="wh-i" src="' + whIcon(n) + '" alt="" onerror="this.style.visibility=\'hidden\'"></span>';
const ST_RANK = { bad: 3, warn: 2, ok: 1, na: 0 };
const worstOf = (a) => a.reduce((m, x) => (ST_RANK[x] > ST_RANK[m] ? x : m), 'na');
const cellTxt = (c) => c.txt || (c.s && c.s[1]) || c.p || (c.ps && c.ps.join(', ')) || (c.pt && c.pt.map((x) => x[0]).join(', ')) || (c.n != null ? C(c.n) : '') || '';
// a flagged row as one short line: its time and name, then the flagged values ("3:12 Dreadmarch #2: Result 2 ghosts touched")
function rowText(s, row) {
  const t = row.find((c) => c.t != null), first = row.find((c) => c.t == null && !c.map && !c.maps && !c.more);
  // (each flagged value says its column, unless it already does, and its note: "Target Arsyn (no protection)")
  const bits = row.map((c, i) => ({ c, col: s.cols[i] || '' })).filter(({ c }) => (c.bad || c.warn) && c !== first && !c.map && !c.maps && !c.more)
    .map(({ c, col }) => { const v = String(cellTxt(c)); return v ? (col && !c.s && !v.toLowerCase().startsWith(col.toLowerCase()) ? col + ' ' : '') + v + (c.sub && !/^(result|rating)$/i.test(col) ? ' (' + c.sub + ')' : '') : ''; }).filter(Boolean);
  return ((t ? T(t.t) + ' ' : '') + (first ? cellTxt(first) : '')).trim() + (bits.length ? ': ' + bits.join(' · ') : '');
}
// every Fight audit mechanic across the pulls: per pull its status (up to the wipe filter), its problems as short lines,
// and the players in the flagged rows; plus the phase it mostly happens in
function mechAcross(reps) {
  const secs = new Map(), order = [], isB = (row) => row.some((c) => c.bad), isW = (row) => !isB(row) && row.some((c) => c.warn);
  for (const r of reps) {
    if (!r.module || r.module.error || !r.module.sections) continue;
    const m = cutModule(r.module, cutT(r)).m, phs = m.phases || [];
    const phName = (t) => { let n = null; for (const p of phs) if (t >= p.start - 0.5) n = p.name; return n; };
    for (const s of m.sections) {
      if (s.id === 'deaths') continue;
      let x = secs.get(s.id); if (!x) { secs.set(s.id, x = { id: s.id, title: s.title, spell: s.spell, how: s.how, info: s.info, per: new Map(), ph: new Map() }); order.push(s.id); }
      const groups = s.groups || [], rows = s.rows.concat(...groups.map((g) => g.rows));
      const lines = [], who = [];
      for (const g of groups) {
        const hit = g.rows.filter((row) => isB(row) || isW(row));
        for (const row of hit) lines.push({ st: isB(row) ? 'bad' : 'warn', txt: g.title + ', ' + rowText(s, row) });
        if (!hit.length && (g.bad || g.warn)) lines.push({ st: g.bad ? 'bad' : 'warn', txt: g.title + (g.sub ? ': ' + g.sub : '') });
      }
      for (const row of s.rows) if (isB(row) || isW(row)) lines.push({ st: isB(row) ? 'bad' : 'warn', txt: rowText(s, row) });
      for (const row of rows) {
        if (!isB(row) && !isW(row)) continue;
        const named = row.filter((c) => (c.bad || c.warn) && (c.p || c.ps)).flatMap((c) => c.p ? [c.p] : c.ps);
        const first = row.find((c) => c.t == null && !c.map && !c.maps && !c.more);
        who.push(...(named.length ? named : first && first.p ? [first.p] : []));
      }
      const nb = lines.filter((l) => l.st === 'bad').length, nw = lines.length - nb;
      // (a section that only shows something, like the floor maps, is never "clean")
      const st = !rows.length && !groups.length ? 'na' : nb ? 'bad' : nw ? 'warn' : s.info ? 'na' : 'ok';
      const ts = groups.map((g) => g.t).concat(s.rows.map((row) => { const c = row.find((q) => q.t != null); return c ? c.t : null; })).filter((v) => v != null);
      if (ts.length) { const pn = phName(Math.min(...ts)); if (pn) x.ph.set(pn, (x.ph.get(pn) || 0) + 1); }
      // (sc: this pull's score for the row's grade, the share of its results that went right; could be better counts half)
      // (a set flagged as a whole counts as one result; avoidable damage uses the report card's own score: each player over
      // the line costs their share, a death to it or going past the red line all of it, past the amber line 40%)
      const nR = Math.max(rows.length, groups.length, nb + nw);
      let sc = st === 'na' || !nR ? null : Math.max(0, 100 * (nR - nb - 0.5 * nw) / nR);
      if (s.id === 'avoid' && groups.some((g) => g.judge)) { const ct = cutT(r), ok = (t) => t == null || t <= ct + 0.05, cost = new Map();
        for (const g of groups) for (const j of g.judge || []) { if (j.tank) continue; const n = j.ts.filter(ok).length, c = (j.dt != null && ok(j.dt)) || n >= g.bA ? 100 : n >= g.wA ? 40 : 0; if (c) cost.set(j.p, (cost.get(j.p) || 0) + c); }
        sc = Math.max(0, 100 - [...cost.values()].reduce((a, v) => a + Math.min(100, v), 0) / Math.max(1, r.players.size)); }
      x.per.set(r.item.pull, { st, nb, nw, lines, who, sc });
    }
  }
  return order.map((id) => secs.get(id));
}
// avoidable damage across the pulls, by source: a bar per source (damage, coloured by how harmful it is), open one for
// every player it hit
function avoidChart(reps, whoT) {
  const src = new Map();
  for (const r of reps) {
    const ct = cutT(r), s = r.module && !r.module.error && r.module.sections && cutModule(r.module, ct).m.sections.find((q) => q.id === 'avoid'); if (!s) continue;
    for (const g of s.groups || []) {
      if (g.t != null && g.t > ct + 0.05) continue;
      let x = src.get(g.title); if (!x) src.set(g.title, x = { title: g.title, harm: g.harm, amt: 0, hits: 0, by: new Map() });
      x.amt += g.amt || 0; x.hits += g.nT || 0;
      for (const row of g.rows) { const p = row[0].p; let y = x.by.get(p); if (!y) x.by.set(p, y = { hits: 0, amt: 0, pulls: new Set(), tank: /tank/.test(row[0].sub || ''), died: 0 }); y.hits += parseInt(row[1].txt, 10) || 0; y.amt += (row[2] && row[2].n) || 0; y.pulls.add(r.item.pull); if (row[3] && row[3].bad) y.died++; }
    }
  }
  if (!src.size) return '';
  const rk = { High: 0, Medium: 1, Low: 2 }, list = [...src.values()].sort((a, b) => rk[a.harm] - rk[b.harm] || b.amt - a.amt), max = Math.max(1, ...list.map((x) => x.amt));
  const col = { High: '#e5534b', Medium: '#e8a23a', Low: '#8b93a3' }, lab = { High: 'Dangerous', Medium: 'Harmful', Low: 'Minor' };
  return '<div class="av-chart">' + list.map((x) => { const ps = [...x.by].sort((a, b) => a[1].tank - b[1].tank || b[1].hits - a[1].hits || b[1].amt - a[1].amt), pmax = Math.max(1, ...ps.map(([, y]) => y.hits));
    return '<details class="av-src"><summary class="av-row"><span class="av-l"><b>' + esc(x.title) + '</b><span class="av-h" style="color:' + col[x.harm] + '">' + lab[x.harm] + '</span></span>' +
      '<span class="av-bar"><i style="width:' + Math.max(2, 100 * x.amt / max).toFixed(1) + '%;background:' + col[x.harm] + '"></i><span>' + C(x.amt) + ' · ' + x.hits + ' hits · ' + ps.length + ' players</span></span><span class="av-c" aria-hidden="true">▸</span></summary>' +
      '<div class="av-ps">' + ps.map(([p, y]) => '<div class="av-p"><span>' + whoT(p) + (y.tank ? ' <span class="sub">tank</span>' : '') + '</span><span class="av-pb"><i style="width:' + (100 * y.hits / pmax).toFixed(1) + '%;background:' + col[x.harm] + '"></i></span><b>' + y.hits + (y.hits === 1 ? ' hit' : ' hits') + '</b><span class="sub">' + C(y.amt) + ' · ' + y.pulls.size + (y.pulls.size === 1 ? ' pull' : ' pulls') + (y.died ? ' · <span class="hotv">died ' + y.died + '×</span>' : '') + '</span></div>').join('') + '</div></details>'; }).join('') +
    '</div><p class="sub" style="margin-top:8px">Bar length is damage taken up to each wipe filter; a hit is one time walking into it.</p>';
}
// every NSRT check across the pulls (nsrtChecks), one row per assignment and phase ("Guillotine, P1"); healing cooldowns
// by phase too
const ASG_META = {
  'Guillotine': { pic: () => spellIcon(0, 'Guillotine', true), tip: 'Guillotine', sec: 'as-guil', how: 'Each drop has a soak team, an external on the axe\'s target and a Zephyr from the note. A soaker who wasn\'t in it, or an external or Zephyr that didn\'t go out, is a miss; someone soaking who wasn\'t assigned could be better.' },
  'Purple orbs': { pic: () => spellIcon(0, 'Mutagenic Venom', true), tip: 'Mutagenic Venom', sec: 'as-orbs', how: 'Purple orbs are hard-assigned: each listed carrier picks one up every wave. Someone else taking one could be better; a carrier who picked up none is a miss.' },
  'Mind control CC': { pic: () => spellIcon(0, 'Dreadmarch', true), tip: 'Dreadmarch', sec: 'as-mc', how: 'The CC order on Dreadmarch\'s mind controls. No CC on a mind control that lasted is a miss; someone lower on the order going first, or CC only from players not on it, could be better.' },
  'Add curses': { pic: () => spellIcon(0, 'Curse of Tongues', true), tip: 'Curse of Tongues', sec: 'as-curse', how: 'Each Spiteful Soulcoiler should carry its assigned warlock\'s curse (Curse of Tongues or Curse of the Satyr). No curse is a miss; someone else\'s curse instead could be better.' },
  'Ghost soaks': { pic: () => spellIcon(0, 'Spirit Erasure', true), tip: 'Spirit Erasure', sec: 'as-ghost', how: 'One soaker per marker in the intermission: alive, on a spot of their own. The log doesn\'t say who blocked which fragment, so this is as far as it can check.' },
  'Soulcoiler kicks': { pic: () => icoW('ability_kick'), tip: '', sec: 'as-ca', how: 'The kick rotation on each Spiteful Soulcoiler set. A cast that got through on someone\'s turn is a miss; a kick out of turn could be better.' },
  'Mutilate groups': { pic: () => icoW('ability_rogue_mutilate'), tip: '', sec: 'as-szmut', how: 'The note\'s two Mutilate soak groups: each Mutilate is soaked by one group and the next by the other. Someone from the other group in it, or three or more of its own group missing, could be better; one or two out is fine.' },
  'Fury timer': { pic: () => icoW('ability_hunter_pet_raptor'), tip: '', sec: 'as-szfury', how: 'Each Serpent\'s Fury pop against the note\'s timer. The pop before an intermission more than 1.5 s early, or any pop more than 3 s late, could be better.' },
  'Well groups': { pic: () => spellIcon(0, 'Grasping Depths', true), tip: 'Grasping Depths', sec: 'as-nzwell', how: 'The note\'s two Soulcoil Well groups take turns going into the well for each Drowned Echo. Someone from the other group in the well, or three or more of the group whose turn it is missing, could be better; one or two out is fine.' },
  'Pyre soak': { pic: () => spellIcon(0, 'Hungering Pyre', true), tip: 'Hungering Pyre', sec: 'as-nzpyre', how: 'The note\'s Hungering Pyre soak list goes into every Pyre; its don\'t-soak list stays out (their Slithering Flame burns the corpses). Someone from the don\'t-soak list in it, or three or more of the soak list missing (not counting anyone dead or in the well), could be better.' },
  'Sides': { pic: () => icoW('ability_creature_poison_05'), tip: '', sec: 'as-sides', how: 'The note\'s Blood and Breath groups: each starts on its own boss and swaps to the other after every intermission. A player on the other boss in a cycle could be better (the note may just be out of date).' },
  'Kick teams': { pic: () => icoW('ability_kick'), tip: '', sec: 'as-kt', how: 'Each raid marker\'s kickers from the note. A cast from that marker\'s add that got through is a miss.' },
  'Assigned cooldowns': { pic: () => icoW('spell_holy_divinehymn'), tip: '', sec: 'as-hcd', how: 'The cooldown reminders in the note: pressed within 3 seconds is on time, later or earlier is late or early, not pressed is missed.' },
};
const ASG_ORDER = ['Well groups', 'Pyre soak', 'Sides', 'Mutilate groups', 'Fury timer', 'Guillotine', 'Purple orbs', 'Mind control CC', 'Soulcoiler kicks', 'Add curses', 'Ghost soaks', 'Kick teams', 'Assigned cooldowns'];
function assignAcross(reps) {
  const rows = new Map();
  const phOf = (c) => (c.cat === 'Ghost soaks' ? 'Intermission' : (c.label.match(/\bP(\d)\b/) || [])[1] ? 'P' + c.label.match(/\bP(\d)\b/)[1] : '');
  for (const r of reps) {
    const cs = nsrtChecks(r); if (!cs) continue;
    for (const c of cs) {
      const ph = phOf(c), k = c.cat + '|' + ph; let x = rows.get(k);
      if (!x) rows.set(k, x = { cat: c.cat, ph, checks: new Map(), per: new Map() });
      let ck = x.checks.get(c.key); if (!ck) x.checks.set(c.key, ck = { label: c.label, ord: c.ord, cells: new Map() });
      ck.cells.set(r.item.pull, { st: c.st, tip: c.tip });
      let p = x.per.get(r.item.pull); if (!p) x.per.set(r.item.pull, p = { sts: [], who: [], lines: [] });
      p.sts.push(c.st); if (c.st === 'bad' || c.st === 'warn') { p.who.push(...c.who); p.lines.push({ st: c.st, txt: c.label + ': ' + c.tip }); }
    }
  }
  for (const x of rows.values()) for (const p of x.per.values()) {
    p.nb = p.lines.filter((l) => l.st === 'bad').length; p.nw = p.lines.length - p.nb; p.st = worstOf(p.sts);
    // healing cooldowns: a pull has many reminders, so one late press doesn't make it red: red at 3 missed or when a third
    // or more weren't on time, amber for anything less
    if (x.cat === 'Assigned cooldowns') { const j = p.sts.filter((s) => s !== 'na').length, off = p.nb + p.nw; p.st = !j ? 'na' : p.nb >= 3 || off / j >= 0.34 ? 'bad' : off ? 'warn' : 'ok'; }
    // (sc: this pull's score for the row's grade: each check done counts fully, could be better half)
    { const j = p.sts.filter((s) => s !== 'na'); p.sc = j.length ? 100 * j.reduce((s, v) => s + (v === 'ok' ? 1 : v === 'warn' ? 0.5 : 0), 0) / j.length : null; }
  }
  return [...rows.values()].sort((a, b) => ASG_ORDER.indexOf(a.cat) - ASG_ORDER.indexOf(b.cat) || (a.ph < b.ph ? -1 : 1));
}
// the Assignments report card: mechanical assignments (each pull's share done, partly done counts half) and healing
// cooldowns (the share pressed on time), weighted 70 / 30
function gradeAssign(reps) {
  const per = [], who = new Map(); let cdOk = 0, cdJ = 0, misses = 0;
  for (const r of reps) {
    const cs = nsrtChecks(r); if (!cs) continue;
    const mech = cs.filter((c) => c.cat !== 'Assigned cooldowns' && c.st !== 'na');
    if (mech.length) per.push(100 * mech.reduce((s, c) => s + (c.st === 'ok' ? 1 : c.st === 'warn' ? 0.5 : 0), 0) / mech.length);
    for (const c of mech) if (c.st === 'bad' || c.st === 'warn') { misses++; for (const w of c.who) who.set(w, (who.get(w) || 0) + 1); }
    for (const c of cs) if (c.cat === 'Assigned cooldowns' && c.st !== 'na') { cdJ++; cdOk += c.st === 'ok' ? 1 : c.st === 'warn' ? 0.5 : 0; }
  }
  const cats = [], top = [...who].sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);
  if (per.length) cats.push({ key: 'as', label: 'Mechanical assignments', score: per.reduce((s, x) => s + x, 0) / per.length, sub: misses ? plural(misses, 'miss') .replace('misss', 'misses') + (top.length ? ' · most: ' + top.join(', ') : '') : 'Nothing missed' });
  if (cdJ) cats.push({ key: 'cd', label: 'Healing cooldowns', score: 100 * cdOk / cdJ, sub: Math.round(100 * cdOk / cdJ) + '% pressed on time (late counts half)' });
  if (!cats.length) return null;
  const W = { as: 70, cd: 30 }, ws = cats.reduce((s, c) => s + W[c.key], 0), overall = cats.reduce((s, c) => s + c.score * W[c.key], 0) / ws;
  for (const c of cats) c.letter = letterOf(c.score);
  return { cats, overall, letter: letterOf(overall) };
}
async function night() {
  const it0 = S.item, here = () => S.item === it0 && S.tab === 'night';
  // every boss pulled tonight (not Mythic+ key bosses), in the order first pulled; the one on screen is shown in full
  const groups = new Map();
  for (const b of S.index.bosses) { if (b.run) continue; const k = b.id + ':' + b.diffId; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(b); }
  if (!groups.size) { view('<div class="panel"><p class="muted" style="margin:0">No boss pulls in this log.</p></div>'); return; }
  const key0 = groups.has(it0.id + ':' + it0.diffId) ? it0.id + ':' + it0.diffId : [...groups.keys()].pop(), pulls = groups.get(key0), b0 = pulls[0];
  view('<p class="muted">Reading ' + plural(pulls.length, 'pull') + ' of ' + esc(b0.boss) + '…</p>');
  const got = await bossReps(pulls[pulls.length - 1], here, (n, of) => { if ($('#view .muted')) $('#view .muted').textContent = 'Reading ' + of + ' pulls of ' + b0.boss + '… (' + n + ' of ' + of + ')'; });
  if (!got || !here()) return;
  const reps = got.reps, pullNs = reps.map((r) => r.item.pull), byPull = new Map(reps.map((r) => [r.item.pull, r]));
  const pm = new Map(); for (const r of reps) for (const p of r.players.values()) if (p.name && !pm.has(p.name)) pm.set(p.name, p);
  const whoT = (n) => { const p = pm.get(n); return p ? '<span class="who sm">' + avatar(p, true) + '<span class="nm" style="color:' + p.color + '">' + esc(n) + '</span></span>' : '<b>' + esc(n) + '</b>'; };
  const res = (r) => { const pg = progressOf(r); return r.item.kill ? 'kill' : 'wipe' + (pg ? (pg.phase ? ' in ' : ' at ') + pg.label : ''); };
  const gst = (l) => (l === 'S' || l === 'A' ? 'ok' : l === 'B' || l === 'C' ? 'warn' : 'bad');
  const kill = pulls.find((b) => b.kill), known = pulls.filter((b) => pullPct(b) != null), bestP = kill || (known.length ? known.reduce((m, b) => (pullPct(b) < pullPct(m) ? b : m)) : null);
  const time = pulls.reduce((s, b) => s + (b.duration || 0), 0), hasNote = !!store.get(noteKey(b0.boss));
  const gm = reps.length ? gradeBoss(reps) : null, ga = hasNote && reps.length ? gradeAssign(reps) : null;
  const overall = gm ? (ga ? 0.6 * gm.overall + 0.4 * ga.overall : gm.overall) : null;
  // ---- the pieces shared by both groups: a row of dots (one per pull), a fold-out row, a phase block ----
  const dotsOf = (per, tab, sec) => '<span class="dots" data-tab="' + tab + '" data-sec="' + esc(sec || '') + '">' + pullNs.map((n) => { const p = per.get(n), st = p ? p.st : 'na', r = byPull.get(n);
    return '<button class="d st-' + st + '" type="button" data-pull="' + n + '" title="' + esc('Pull ' + n + ' · ' + res(r) + ' · ' + (!p ? 'didn\'t come up' : st === 'na' ? 'didn\'t come up, or after the wipe filter' : st === 'ok' ? 'clean' : (p.nb ? plural(p.nb, 'problem') : '') + (p.nb && p.nw ? ', ' : '') + (p.nw ? p.nw + ' could be better' : ''))) + '"></button>'; }).join('') + '</span>';
  // how a row went across the night: red when it went wrong in at least 3 pulls (or a third of them), amber when it went
  // wrong at all or could be better, green when clean; plus the worst pull and whether the second half was better
  const verdictOf = (per) => {
    const j = pullNs.filter((n) => per.has(n) && per.get(n).st !== 'na'), b = j.filter((n) => per.get(n).st === 'bad'), w = j.filter((n) => per.get(n).st === 'warn');
    const st = !j.length ? 'na' : b.length && (b.length >= 3 || b.length / j.length >= 0.34) ? 'bad' : b.length || w.length ? 'warn' : 'ok';
    const txt = !j.length ? 'didn\'t come up' : b.length ? 'went wrong in ' + b.length + ' of ' + j.length + ' pulls' + (w.length ? ' · ' + w.length + ' could be better' : '') : w.length ? 'could be better in ' + w.length + ' of ' + j.length : 'clean in all ' + j.length;
    const worst = b.length ? b.reduce((m, n) => (per.get(n).nb > per.get(m).nb ? n : m)) : null;
    const half = Math.floor(j.length / 2), e = j.slice(0, half).filter((n) => per.get(n).st !== 'ok').length, l = j.slice(j.length - half).filter((n) => per.get(n).st !== 'ok').length;
    // (a trend only when it's a real change: at least 2 pulls and a quarter apart)
    const real = half >= 3 && Math.abs(e - l) >= 2 && Math.abs(e - l) >= 0.25 * Math.max(e, l);
    const trend = real ? (l < e ? 'better later on (' + e + ' → ' + l + ')' : 'worse later on (' + e + ' → ' + l + ')') : '';
    return { st, txt, worst, trend, real, better: l < e, j: j.length, half, e, l };
  };
  const tipAttr = (tip, title, how) => { const sid = tip ? E.SPELLID.get(tip.toLowerCase()) || 0 : 0, ex = String(how || '').replace(/<[^>]+>/g, ''); return ' class="sp sechd" data-sid="' + sid + '" data-sn="' + esc(tip || title) + '" data-ex="' + esc(ex.length > 240 ? ex.slice(0, 237) + '…' : ex) + '"'; };
  // a row's grade over the night: the average of its pulls' scores (the pulls it came up in, each up to the wipe filter),
  // on the report card scale, with an arrow when the last third of those pulls was clearly better or worse than before
  const gradeOf = (per) => {
    const xs = pullNs.map((n) => per.get(n)).filter((p) => p && p.st !== 'na' && p.sc != null); if (!xs.length) return '<span class="sgr" title="Didn\'t come up, so no grade"><span class="grade g-na">–</span></span>';
    const avg = (a) => a.reduce((s, p) => s + p.sc, 0) / a.length, score = avg(xs), k = Math.floor(xs.length / 3), late = k >= 2 ? avg(xs.slice(-k)) : null, d = late != null ? late - avg(xs.slice(0, xs.length - k)) : 0, l = letterOf(score);
    const tip = 'Grade ' + l + ': ' + Math.round(score) + ' / 100 over ' + plural(xs.length, 'pull') + ' (a clean result counts fully, could be better half)' + (d >= 15 ? ' · the last ' + k + ' pulls: ' + Math.round(late) + ', better than before' : d <= -15 ? ' · the last ' + k + ' pulls: ' + Math.round(late) + ', worse than before' : '');
    return '<span class="sgr" title="' + esc(tip) + '">' + gradeChip(l) + (d >= 15 ? '<span class="gtr up">▲</span>' : d <= -15 ? '<span class="gtr down">▼</span>' : '') + '</span>';
  };
  const sumRow = (o) => '<details class="panel secd st-' + o.st + '" id="' + o.id + '" data-k="' + o.id + '"' + (S.openSecs.has(o.id) ? ' open' : '') + '><summary>' + (o.gr || '<span class="sgr"></span>') + '<span' + tipAttr(o.tip, o.title, o.how) + '>' + o.icon + '<b>' + esc(o.title) + '</b></span>' + o.dots + hst(o.st, o.txt) + '</summary>' +
    '<div class="secbody">' + (o.how ? '<details class="howit"><summary>How it works</summary><div>' + esc(o.how) + '</div></details>' : '') + o.body + '</div></details>';
  const phaseBlock = (name, sub, list) => { const nb = list.filter((o) => o.st === 'bad').length, nw = list.filter((o) => o.st === 'warn').length, judged = list.some((o) => o.st !== 'na');
    return '<details class="phase" open><summary><b>' + esc(name) + '</b>' + (sub ? ' <span class="sub">' + esc(sub) + '</span>' : '') + hst(!judged ? 'na' : nb ? 'bad' : nw ? 'warn' : 'ok', !judged ? 'not judged' : nb ? plural(nb, 'problem') + (nw ? ' · ' + nw + ' could be better' : '') : nw ? nw + ' could be better' : 'clean') + '</summary>' + list.map(sumRow).join('') + '</details>'; };
  // the body of a row: the trend in one line, who keeps getting flagged, then the pulls that went wrong (latest first)
  const trendLine = (v) => (v.half >= 3 ? '<div class="pdesc sum-tr">First half of the night: ' + v.e + ' of ' + v.half + ' pulls with something wrong · second half: ' + v.l + ' of ' + v.half + (v.real ? (v.better ? ' <span class="okv">· getting better</span>' : ' <span class="hotv">· getting worse</span>') : ' <span class="sub">· about the same</span>') + '</div>' : '');
  const bodyOf = (per, v, tab, sec, what) => {
    const who = new Map(); for (const p of per.values()) for (const w of p.who || []) who.set(w, (who.get(w) || 0) + 1);
    const ppl = [...who].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const probs = pullNs.filter((n) => per.has(n) && (per.get(n).st === 'bad' || per.get(n).st === 'warn')).reverse();
    let h = trendLine(v);
    if (ppl.length) h += '<div class="sum-who"><span class="sub">Flagged most</span><span class="chips">' + ppl.map(([n, c]) => '<span class="chipn">' + whoT(n).replace(/^<span class="who sm">|<\/span>$/g, '') + '<b>' + c + '</b></span>').join('') + '</span></div>';
    if (!probs.length) return h + '<div class="nsp-ok"><span class="iss-dot"></span>Nothing went wrong with ' + what + ' in any pull.</div>';
    // the pulls that went wrong, as a list on the left (latest first) and the picked pull's problems on the right
    const items = probs.map((n) => { const p = per.get(n), r = byPull.get(n);
      return { n, st: p.st, sub: p.nb ? plural(p.nb, 'problem') + (p.nw ? ' · ' + p.nw + ' could be better' : '') : p.nw + ' could be better',
        body: '<div class="md-h"><b>Pull ' + n + '</b> <span class="sub">' + esc(capS(res(r))) + ' · ' + T(r.duration) + '</span><button class="btn sm" type="button" data-open="' + n + '" data-tab="' + tab + '" data-sec="' + esc(sec || '') + '">Open this pull</button></div>' +
          hst(p.st, p.nb ? plural(p.nb, 'problem') + (p.nw ? ' · ' + p.nw + ' could be better' : '') : p.nw + ' could be better') +
          '<ul class="sp-l">' + p.lines.map((l) => '<li class="' + l.st + '">' + esc(l.txt) + '</li>').join('') + '</ul>' }; });
    h += '<div class="md sum-md"><div class="md-list">' + items.map((x, i) => '<button class="md-i ' + x.st + (i ? '' : ' on') + '" type="button" data-i="' + i + '"><span class="md-dot"></span><span class="md-l">Pull ' + x.n + '</span><span class="md-t">' + esc(x.sub) + '</span></button>').join('') + '</div>' +
      '<div class="md-pane">' + items.map((x, i) => '<div class="md-d" data-i="' + i + '"' + (i ? ' hidden' : '') + '>' + x.body + '</div>').join('') + '</div></div>';
    return h;
  };
  // ---- Mechanics: every Fight audit mechanic, under the phase it mostly happens in ----
  const mech = mechAcross(reps), refPh = reps.map((r) => (r.module && !r.module.error && r.module.phases) || []).reduce((m, p) => (p.length > m.length ? p : m), []);
  const imp = IMPORTANCE[b0.boss] || [], ixOf = (id) => (imp.indexOf(id) < 0 ? 99 : imp.indexOf(id));
  // the furthest pull's phases ("P1 Zul'jan" …), and the one a short phase name ("P2", "Intermission") stands for
  const phNames = refPh.map((p) => p.name), phKey = (ph) => (ph === 'Intermission' ? phNames.find((n) => /^Intermission/.test(n)) : phNames.find((n) => new RegExp('^' + ph + '\\b').test(n)));
  const mRows = mech.map((x) => {
    const v = verdictOf(x.per), ph = x.ph.size ? [...x.ph].sort((a, b) => b[1] - a[1])[0][0] : null;
    // (avoidable damage: its chart by source instead of a list of pulls)
    // (a section that only shows something, like the floor maps, says so instead of "didn't come up")
    const info = x.info && v.st === 'na' && x.per.size > 0;
    const body = info ? '<div class="pdesc">Not judged: open a pull\'s Mechanics tab to see it.</div>' : x.id === 'avoid' ? trendLine(v) + avoidChart(reps, whoT) : bodyOf(x.per, v, 'audit', 'sec-' + x.id, 'this mechanic');
    return { id: 'sm-' + x.id, ph, ord: ixOf(x.id), st: v.st, txt: info ? x.info : v.txt + (v.worst ? ' · worst: pull ' + v.worst : '') + (v.trend ? ' · ' + v.trend : ''), tip: x.spell && x.spell[1], title: x.title, how: x.how, icon: spellIcon(x.spell ? x.spell[0] : 0, x.spell ? x.spell[1] : '', true), dots: dotsOf(x.per, 'audit', 'sec-' + x.id), gr: gradeOf(x.per), body };
  });
  let mHtml = '';
  // (a module that groups its mechanics by boss instead of by phase, like Entombed Sentinels, gets the same groups here)
  const sGroups = reps.map((r) => r.module && !r.module.error && r.module.sectionGroups).find((g) => g && g.length);
  if (sGroups) {
    const idOf = (o) => o.id.replace(/^sm-/, ''), listed = new Set(sGroups.flatMap((g) => g.ids));
    for (const g of sGroups) { const at = (o) => (g.ids.indexOf(idOf(o)) < 0 ? 100 + o.ord : g.ids.indexOf(idOf(o)));
      const list = mRows.filter((o) => g.ids.includes(idOf(o)) || (g.rest && !listed.has(idOf(o)))).sort((a, b) => at(a) - at(b)); if (list.length) mHtml += phaseBlock(g.name, g.sub || '', list); }
  } else {
    for (const p of refPh) { const list = mRows.filter((o) => o.ph === p.name).sort((a, b) => a.ord - b.ord); if (list.length) mHtml += phaseBlock(p.name, '', list); }
    { const list = mRows.filter((o) => !o.ph || !refPh.some((p) => p.name === o.ph)).sort((a, b) => a.ord - b.ord); if (list.length) mHtml += phaseBlock('Whole fight', 'mechanics that aren\'t tied to one phase', list); }
  }
  // ---- Assignments: every check from the NSRT note, one row per assignment and phase; healing cooldowns at the end ----
  const asg = hasNote ? assignAcross(reps) : [];
  const aRow = (x) => {
    const meta = ASG_META[x.cat] || { pic: () => '', how: '', sec: '' }, v = verdictOf(x.per), cd = x.cat === 'Assigned cooldowns';
    const checks = [...x.checks.values()].filter((c) => [...c.cells.values()].some((q) => q.st !== 'na')).sort((a, b) => a.ord - b.ord || (a.label < b.label ? -1 : 1));
    const probsN = (c) => [...c.cells.values()].filter((q) => q.st === 'bad' || q.st === 'warn').length;
    const grid = checks.length ? '<div class="scroll"><table class="tbl nmx"><thead><tr><th>' + (cd ? 'Reminder' : 'Assignment') + '</th>' + pullNs.map((n) => '<th class="c">' + n + '</th>').join('') + '<th>Problems</th></tr></thead><tbody>' +
      (cd ? checks.slice().sort((a, b) => probsN(b) - probsN(a)) : checks).map((c) => { const j = [...c.cells.values()].filter((q) => q.st !== 'na'); return '<tr><td>' + esc(c.label.replace(/^P\d\s+/, '')) + '</td>' + pullNs.map((n) => { const q = c.cells.get(n); return '<td class="c">' + (q ? '<button class="nm-cell st-' + q.st + '" type="button" data-pull="' + n + '" data-tab="overview" data-sec="' + meta.sec + '" title="' + esc('Pull ' + n + ': ' + q.tip) + '"></button>' : '') + '</td>'; }).join('') +
        '<td class="tc">' + (probsN(c) ? '<b class="' + (j.some((q) => q.st === 'bad') ? 'hotv' : 'warnv') + '">' + probsN(c) + '</b> of ' + j.length : '<span class="okv">none</span> <span class="sub">of ' + j.length + '</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '';
    const title = cd ? (x.ph ? phKey(x.ph) || x.ph : 'Other reminders') : x.cat + (x.ph ? ', ' + (x.ph === 'Intermission' ? 'intermission' : x.ph) : '');
    return { id: 'sa-' + (x.cat + '-' + (x.ph || 'w')).toLowerCase().replace(/[^a-z0-9]+/g, '-'), ph: x.ph, cd, ord: ASG_ORDER.indexOf(x.cat), st: v.st, txt: v.txt + (v.worst ? ' · worst: pull ' + v.worst : '') + (v.trend ? ' · ' + v.trend : ''), tip: meta.tip, title, how: meta.how, icon: meta.pic(), dots: dotsOf(x.per, 'overview', meta.sec), gr: gradeOf(x.per),
      body: bodyOf(x.per, v, 'overview', meta.sec, cd ? 'these reminders' : 'this assignment') + (grid ? '<details class="nsp-d"><summary>Every ' + (cd ? 'reminder' : 'check') + ', pull by pull</summary>' + grid + '</details>' : '') };
  };
  const aRows = asg.map(aRow);
  // by player, in a block of its own at the end: who missed their assignments, and who pressed their cooldowns late or not at all
  const posMiss = hasNote ? reps.flatMap((r) => keptMistakes(r).filter((m) => m.fromNote && m.player !== 'Raid' && m.mechanic !== 'Assigned cooldown').map((m) => ({ ...m, pull: r.item.pull }))) : [];
  const byRows = [];
  if (posMiss.length) {
    const pl = new Map(); for (const m of posMiss) { let x = pl.get(m.player); if (!x) pl.set(m.player, x = { n: 0, hi: 0, by: new Map(), pulls: new Set() }); x.n++; if (m.severity !== 'Low') x.hi++; x.by.set(m.mechanic, (x.by.get(m.mechanic) || 0) + 1); x.pulls.add(m.pull); }
    const people = [...pl].sort((a, b) => b[1].hi - a[1].hi || b[1].n - a[1].n), hi = people.filter(([, x]) => x.hi).length;
    byRows.push({ id: 'sa-players', st: hi ? 'bad' : 'warn', txt: plural(people.length, 'player') + ' missed one or more' + (hi ? ' · ' + hi + ' with a medium or serious miss' : ''), title: 'Assignment misses', how: 'Every assignment miss from the note across the pulls, up to each wipe filter, by player, most serious first.', icon: icoW('achievement_guildperk_everybodysfriend'), dots: '',
      body: '<div class="scroll"><table class="tbl"><thead><tr><th>Player</th><th class="tc">Misses</th><th>What</th><th>Pulls</th></tr></thead><tbody>' + people.map(([n, x]) => '<tr class="' + (x.hi ? 'rbad' : 'rwarn') + '"><td>' + whoT(n) + '</td><td class="tc"><b class="' + (x.hi ? 'hotv' : 'warnv') + '">' + x.n + '</b></td><td>' + [...x.by].sort((a, b) => b[1] - a[1]).map(([m, c]) => '<span class="sub">' + esc(m) + (c > 1 ? ' ×' + c : '') + '</span>').join(' · ') + '</td><td class="tc">' + [...x.pulls].sort((a, b) => a - b).join(', ') + '</td></tr>').join('') + '</tbody></table></div>' });
  }
  if (hasNote) {
    const cdp = new Map();
    for (const r of reps) for (const c of nsrtChecks(r) || []) {
      if (c.cat !== 'Assigned cooldowns' || c.st === 'na') continue;
      for (const w of c.who) { let y = cdp.get(w); if (!y) cdp.set(w, y = { n: 0, ok: 0, late: 0, missed: 0, pulls: new Set() }); y.n++; if (c.st === 'ok') y.ok++; else { if (c.st === 'bad') y.missed++; else y.late++; y.pulls.add(r.item.pull); } }
    }
    if (cdp.size) { const list = [...cdp].sort((a, b) => b[1].missed - a[1].missed || b[1].late - a[1].late || a[0].localeCompare(b[0])), nm = list.filter(([, y]) => y.missed).length;
      byRows.push({ id: 'sa-cdplayers', st: nm ? 'bad' : list.some(([, y]) => y.late) ? 'warn' : 'ok', txt: nm ? plural(nm, 'player') + ' missed a press' : list.some(([, y]) => y.late) ? 'some presses late or early' : 'everyone on time', title: 'Healing cooldowns', how: 'Each player\'s cooldown reminders from the note across the pulls: on time, late or early, and missed.', icon: icoW('spell_holy_divinehymn'), dots: '',
        body: '<div class="scroll"><table class="tbl"><thead><tr><th>Player</th><th class="r">On time</th><th class="r">Late or early</th><th class="r">Missed</th><th>Pulls with a late or missed press</th></tr></thead><tbody>' +
          list.map(([n, y]) => '<tr class="' + (y.missed ? 'rbad' : y.late ? 'rwarn' : 'rok') + '"><td>' + whoT(n) + '</td><td class="r">' + y.ok + ' of ' + y.n + '</td><td class="r' + (y.late ? ' warnv' : '') + '">' + y.late + '</td><td class="r' + (y.missed ? ' hotv' : '') + '">' + y.missed + '</td><td class="tc">' + ([...y.pulls].sort((a, b) => a - b).join(', ') || '—') + '</td></tr>').join('') + '</tbody></table></div>' }); }
  }
  let aHtml = '';
  // (assignments that never came up tonight, e.g. P3's on a night that didn't reach it: one quiet line, not a row each)
  const aNever = aRows.filter((o) => o.st === 'na');
  for (const o of aNever) aRows.splice(aRows.indexOf(o), 1);
  for (const pn of phNames) { const list = aRows.filter((o) => !o.cd && o.ph && phKey(o.ph) === pn).sort((a, b) => a.ord - b.ord); if (list.length) aHtml += phaseBlock(pn, '', list); }
  { const list = aRows.filter((o) => !o.cd && (!o.ph || !phKey(o.ph))).sort((a, b) => a.ord - b.ord); if (list.length) aHtml += phaseBlock('Whole fight', 'assignments that aren\'t tied to one phase', list); }
  { const list = aRows.filter((o) => o.cd); if (list.length) aHtml += phaseBlock('Healing cooldowns', 'the cooldown reminders in the note, kept apart from the mechanics', list); }
  if (byRows.length) aHtml += phaseBlock('By player', 'who missed what, across the pulls', byRows);
  if (aNever.length) aHtml += '<p class="sub sum-never">Didn\'t come up in these pulls: ' + esc(aNever.map((o) => (o.cd ? 'healing cooldowns, ' + o.title : o.title)).join(' · ')) + '</p>';
  // ---- the page ----
  const db = reps.length ? nightDebrief(pulls, reps) : null;
  const others = [...groups].filter(([k]) => k !== key0).map(([k, l]) => { const kl = l.find((b) => b.kill), kn = l.filter((b) => pullPct(b) != null), bp = kl || (kn.length ? kn.reduce((m, b) => (pullPct(b) < pullPct(m) ? b : m)) : null);
    return '<button class="sum-ob" type="button" data-boss="' + esc(k) + '"><b>' + esc(l[0].boss) + '</b> <span class="sub">' + esc(l[0].diff || '') + ' · ' + plural(l.length, 'pull') + ' · ' + (kl ? 'killed on pull ' + kl.pull : bp ? 'best ' + esc(pullLabel(bp)) : 'no kill') + '</span></button>'; });
  const tileGo = (href, html) => '<a class="pt-go" href="' + href + '">' + html + '</a>';
  // (a group's tile on the overall card names its weakest part, the one to look at first)
  const weakest = (cats) => { const c = cats.slice().sort((a, b) => a.score - b.score)[0]; return cats.length > 1 ? 'weakest: ' + (c.key === 'mech' ? 'boss mechanics' : c.label.toLowerCase()) + ' (' + Math.round(c.score) + ')' : c.sub; };
  const rcTop = overall != null ? '<div class="panel nc-rc2 sum-rc"><div class="rc-all" title="Grades go S, A, B, C, D, F; each pull counts up to the wipe filter">' + gradeChip(letterOf(overall), true) + '<div><div class="pt-l">Report card</div><div class="rc-sc">' + Math.round(overall) + '<span> / 100</span></div><div class="sub">mechanics' + (ga ? ' and assignments' : '') + ' · ' + plural(reps.length, 'pull') + ', each up to the wipe filter</div></div></div>' +
    '<div class="pts rc-cats four">' + tileGo('#sum-mech', plTile(gradeChip(gm.letter), 'Mechanics', Math.round(gm.overall) + '<span> / 100</span>', gst(gm.letter), weakest(gm.cats), true, gm.letter)) +
      tileGo('#sum-asg', ga ? plTile(gradeChip(ga.letter), 'Assignments', Math.round(ga.overall) + '<span> / 100</span>', gst(ga.letter), weakest(ga.cats), true, ga.letter) : plTile(icoW('inv_inscription_scroll'), 'Assignments', '—', 'na', hasNote ? 'nothing from the note came up' : 'no NSRT note for this boss', true)) +
      plTile(icoW(kill ? 'achievement_boss_lichking' : 'ability_hunter_markedfordeath'), kill ? 'Kill' : 'Best pull', kill ? 'Pull ' + kill.pull : bestP ? esc(pullShort(bestP)) : '—', kill ? 'ok' : 'na', kill ? 'after ' + plural(kill.pull - 1, 'wipe') : bestP ? 'pull ' + bestP.pull + ' · ' + esc(pullLabel(bestP)) : 'no result yet', true) +
      plTile(icoW('inv_misc_pocketwatch_01'), 'Pulls', String(pulls.length), 'na', T(time) + ' on the boss' + (reps.length ? ' · ' + (reps.reduce((s, r) => s + keptDeaths(r).length, 0) / reps.length).toFixed(1) + ' deaths a pull' : ''), true) + '</div></div>' : '';
  const progress = '<div class="panel sum-prog" id="sum-prog"><h3 class="nh">How far the night got <small>' + plural(pulls.length, 'pull') + ' · lower is better</small></h3>' + acrossNights(b0, pulls) + nightTimeline(pulls) + '</div>';
  // what went wrong and right across the night, in the same pair as Latest pull, Mechanics and Assignments: wrong is what
  // kept going wrong (and what got worse through the night), right is what got better and what was clean every pull
  const cleanM = mRows.filter((o) => o.st === 'ok').sort((a, b) => a.ord - b.ord).map((o) => shortT(o.title));
  const cleanA = aRows.filter((o) => o.st === 'ok' && !o.cd).map((o) => o.title);
  const wrongS = !db ? [] : db.fix.map((x) => ({ sev: x.sev, html: x.title + (x.sub ? ' <span class="sub">· ' + x.sub + '</span>' : '') })).concat(db.worse.map((x) => ({ sev: 'warn', html: '<b>Getting worse:</b> ' + x })));
  const rightS = [].concat(kill ? ['<b>Killed on pull ' + kill.pull + '</b>' + (kill.pull > 1 ? ' after ' + plural(kill.pull - 1, 'wipe') : '')] : [], db ? db.better.map((x) => '<b>Getting better:</b> ' + x) : [],
    cleanM.length ? ['<b>Clean every pull:</b> ' + esc(cleanM.join(', '))] : [], cleanA.length ? ['<b>Assignments done every pull:</b> ' + esc(cleanA.join(', '))] : []);
  const fix = !db ? '' : wrongRight(wrongS, rightS, { max: 6, sub: (reps.length < pulls.length ? 'from ' + reps.length + ' of ' + pulls.length + ' pulls downloaded' : 'across all ' + plural(reps.length, 'pull')) + ', each up to the wipe filter',
    none: 'Nothing kept going wrong.', noneRight: 'Nothing was clean every pull yet.', moreWhere: 'in Mechanics and Assignments below' });
  // each group's report card in the same framed card as the overall one: the grade and score on the left, a tile per part
  const secHead = (id, title, sub) => '<div class="sum-h" id="' + id + '"><h2>' + title + '</h2>' + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</div>';
  const rcCard = (g, what, tiles, title) => '<div class="panel nc-rc2 sum-rc"><div class="rc-all" title="Grades go S, A, B, C, D, F; each pull counts up to the wipe filter">' + gradeChip(g.letter, true) + '<div><div class="pt-l">' + (title || 'Report card') + '</div><div class="rc-sc">' + Math.round(g.overall) + '<span> / 100</span></div><div class="sub">' + what + '</div></div></div>' +
    '<div class="pts rc-cats" style="--n:' + Math.max(2, (tiles.match(/class="pt[ "]/g) || []).length) + '">' + tiles + '</div></div>';
  // (on a computer the group report cards sit in the right-hand column with the overall one; on a narrow screen each one
  // stays under its own heading, so the card is drawn in both places and CSS shows one)
  const mCard = gm ? rcCard(gm, 'boss mechanics, avoidable damage, survival and interrupts', gm.cats.map((c) => plTile(gradeChip(c.letter), c.key === 'mech' ? 'Boss mechanics' : c.label, Math.round(c.score) + '<span> / 100</span>', gst(c.letter), c.sub, true, c.letter)).join(''), 'Mechanics') : '';
  const aCard = hasNote && ga ? rcCard(ga, 'mechanical assignments 70%, healing cooldowns 30%', ga.cats.map((c) => plTile(gradeChip(c.letter), c.label, Math.round(c.score) + '<span> / 100</span>', gst(c.letter), c.sub, true, c.letter)).join(''), 'Assignments') : '';
  const inl = (card) => (card ? '<div class="sum-inl">' + card + '</div>' : '');
  const mSec = gm ? secHead('sum-mech', 'Mechanics', 'every mechanic across the pulls; open one for the pulls that went wrong') + inl(mCard) +
    (mHtml || '<div class="panel"><p class="muted" style="margin:0">Mechanic checks for ' + esc(b0.boss) + ' aren\'t built yet.</p></div>') : '';
  const aSec = secHead('sum-asg', 'Assignments', hasNote ? 'every assignment in the NSRT note across the pulls' : '') +
    (!hasNote ? '<div class="panel noteempty"><div><b>No NSRT note for ' + esc(b0.boss) + ' yet.</b> <span class="sub">Add one on the Assignments tab to check soaks, kicks, orbs and cooldowns across every pull.</span></div><button class="btn" id="sumNote">Open Assignments</button></div>'
      : inl(aCard) + (aHtml || '<div class="panel"><p class="muted" style="margin:0">None of the note\'s assignments came up in these pulls.</p></div>'));
  // Two columns on a computer: the night on the left (how far it got, what kept going wrong, every mechanic and
  // assignment), the grades and a "jump to" list on the right, staying in view while you scroll. On a narrow screen the
  // grades come first, then the rest, as before.
  const rail = '<aside class="sum-rail">' + rcTop + (mCard ? '<div class="sum-rc-g">' + mCard + '</div>' : '') + (aCard ? '<div class="sum-rc-g">' + aCard + '</div>' : '') +
    '<nav class="sum-jump" aria-label="Jump to"><span class="pt-l">Jump to</span><a class="pt-go" href="#sum-prog">How far the night got</a>' + (gm ? '<a class="pt-go" href="#sum-mech">Mechanics</a>' : '') + '<a class="pt-go" href="#sum-asg">Assignments</a></nav></aside>';
  view(loadBar(reps.length, pulls.length, got.skipped, 'nightAll') + '<div class="nsa sumv sum2">' + (others.length ? '<div class="sum-others"><span class="sub">Also tonight</span>' + others.join('') + '</div>' : '') +
    '<div class="sum-main">' + progress + fix + mSec + aSec +
    '<p class="muted" style="font-size:13px">In each row, each small square is a pull: green clean, amber could be better, red something went wrong, grey didn\'t come up or came after the wipe filter. Click one to open that pull. Players and the MVPs of the night are on the Player audit tab.</p></div>' + rail + '</div>');
  refreshIcons(); setHeadRes(); fitTrends();
  // opening a pull: its Mechanics or Assignments tab, scrolled to the row it came from
  const open = (n, tab, sec) => { const r = byPull.get(+n); if (!r) return; S.tab = tab || 'audit'; S.pendingSec = sec || null; S.scope = 'pull'; select(r.item); };
  $$('#view .dots .d').forEach((b) => (b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); const d = b.closest('.dots'); open(b.dataset.pull, d.dataset.tab, d.dataset.sec); }));
  $$('#view [data-open]').forEach((b) => (b.onclick = () => open(b.dataset.open, b.dataset.tab, b.dataset.sec)));
  $$('#view .nm-cell[data-pull]').forEach((b) => (b.onclick = () => open(b.dataset.pull, b.dataset.tab, b.dataset.sec)));
  $$('#view details.secd[data-k]').forEach((d) => (d.ontoggle = () => { if (d.open) S.openSecs.add(d.dataset.k); else S.openSecs.delete(d.dataset.k); }));
  $$('#view .pt-go').forEach((x) => (x.onclick = (e) => { e.preventDefault(); const el = document.querySelector(x.getAttribute('href')); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70 }); }));
  $$('#view .sum-ob').forEach((b) => (b.onclick = () => { const l = groups.get(b.dataset.boss); if (l) select(l[l.length - 1]); }));
  // list-and-detail: clicking a pull on the left shows its problems on the right
  $$('#view .md-i').forEach((b) => (b.onclick = () => { const md = b.closest('.md'); md.querySelectorAll('.md-i').forEach((x) => x.classList.toggle('on', x === b)); md.querySelectorAll('.md-d').forEach((d) => { d.hidden = d.dataset.i !== b.dataset.i; }); }));
  if ($('#sumNote')) $('#sumNote').onclick = () => { S.tab = 'overview'; renderMain(); };
  if ($('#nightAll')) $('#nightAll').onclick = () => { NIGHT_ALL = true; night(); };
}

// Each player's own NSRT assignments in one pull, up to the wipe filter: how many they had and how many they did (late or
// partly done counts half). Doing an assignment counts for the MVPs, so a player with many assignments isn't just someone
// with more chances to lose points. Counted: Guillotine soaks, externals and Zephyrs, orb pickups, cooldown reminders,
// Soulcoiler kick turns, mind control CC (when CC was needed and they could give it), curses and ghost soaks.
function assignCredit(r) {
  const a = r.assign, out = new Map(); if (!a || a.error) return out;
  const ct = cutT(r), ok = (t) => t == null || t <= ct + 0.05, died = (n, t) => r.deaths.some((d) => d.player === n && d.t < t);
  const add = (n, did, of) => { if (!n) return; const x = out.get(n) || { did: 0, of: 0 }; x.did += did; x.of += of == null ? 1 : of; out.set(n, x); };
  for (const s of a.soaks || []) { if (!s.soak || !ok(s.soak.t)) continue; for (const n of s.assigned || []) if (!died(n, s.soak.t)) add(n, (s.missing || []).includes(n) ? 0 : 1); }
  for (const c of a.cds || []) { if (c.expected == null || c.expected > r.duration || !ok(c.expected)) continue; const v = { 'on time': 1, late: 0.5, early: 0.5, missed: 0 }[c.status]; if (v != null) add(c.player, v); }
  for (const o of a.orbs || []) { if (o.kind === 'helper' || o.waves == null) continue; for (const [n, g] of o.got || []) if (g.of) add(n, g.n, g.of); }
  const CA = a.boss && a.boss.ca;
  if (CA && CA.sets) for (const s of CA.sets) { if (!ok(s.t)) continue; for (const x of s.adds) { for (const k of x.kicks) if (k.listed || k.ok) add(k.who, k.ok ? 1 : 0.5); for (const g of x.gotOff) if (g.want && !g.dead) add(g.want, 0); } }
  if (a.mcCC) for (const d of a.mcCC.rows) { if (!ok(d.s) || !d.mcd.length || d.len < 2) continue; for (const o of d.ccers) { if (o.why) continue; const did = d.cc.some((c) => c.who === o.n); if (did) add(o.n, 1); else if (d.st === 'bad') add(o.n, 0); } }
  if (a.curses) for (const s of a.curses.rows) { if (!ok(s.t)) continue;
    if (s.noMark) { for (const n of [...new Set(s.adds.flatMap((x) => x.want))]) if (!died(n, s.t + 3)) add(n, s.adds.some((x) => x.curses.some((c) => c.who === n)) ? 1 : 0); continue; }
    for (const x of s.adds) { if (x.st === 'na') continue; for (const n of x.want) if (!died(n, x.t0 + 3)) add(n, x.curses.some((c) => c.who === n) ? 1 : 0); } }
  if (a.ghosts && a.ghosts.reached && ok(a.ghosts.from)) for (const x of a.ghosts.rows) if (x.st !== 'na') add(x.n, x.st === 'ok' ? 1 : x.st === 'warn' ? 0.5 : 0);
  return out;
}
// ---- the night's players (Player audit, All pulls): stat tiles, the MVPs, then one row per player ----
// Ready to raid (gear and buffs at each pull, readyScore) and Survival kit (defensives, Healthstones and health potions,
// combat or mana potions, survivalOf) are scored per pull, each up to its wipe filter, then averaged over the night.
// The MVPs add execution (deaths and medium or serious mistakes per pull): 40% execution, 30% survival, 30% ready.
// Players are matched by GUID across pulls (a pull where the log never names someone shows them by their raw ID).
async function nightPlayers(reps, still) {
  { const all = reps.flatMap((r) => r.combatants || []); if (needsLookup(all)) { await resolveCombatants(all); if (!still()) return null; } await resolveSockets(all); if (!still()) return null; }
  const pl = new Map(), named = new Map();
  for (const r of reps) for (const p of r.players.values()) if (p.name && !/^Player-/.test(p.name)) named.set(p.guid, p);
  for (const r of reps) {
    const ms = keptMistakes(r).filter((x) => x.mechanic !== 'Death' && x.severity !== 'Low');
    const rows = []; for (const c of r.combatants || []) { const p = [...r.players.values()].find((x) => x.name === c.name || (c.name && x.name.split('-')[0] === c.name.split('-')[0])); if (p) rows.push(auditChar(c, p)); }
    markLowIlvl(rows); const prep = new Map(rows.map((x) => [x.p.guid, x])), credit = assignCredit(r);
    // (tanks: their own minor slips count, as they have few checks; and how their frontals went, for the row's summary)
    const ctR = cutT(r), tf = r.module && !r.module.error && (r.module.sections || []).find((q) => q.id === 'tankfront');
    const tankLow = keptMistakes(r).filter((m) => m.severity === 'Low' && TANK_MECH.has(m.mechanic) && !m.fromNote);
    for (const p of r.players.values()) {
      const who = named.get(p.guid) || p; if (!who.name || /^Player-/.test(who.name)) continue; // (never named all night: nothing to show)
      let a = pl.get(p.guid);
      if (!a) pl.set(p.guid, a = { p: who, pulls: 0, deaths: 0, high: 0, other: 0, mech: new Map(), mechH: new Map(), assignMiss: 0, ready: [], surv: [], log: [], pot: [0, 0], pre: 0, defReady: 0, kitReady: 0, oneShots: 0, calls: 0, silent: 0, stones: 0, hpots: 0, miss: new Map(), flask: [0, 0], food: [0, 0], rune: [0, 0], oil: [0, 0], last: null });
      const mm = ms.filter((x) => x.player === p.name || x.player === who.name), x = prep.get(p.guid), s = survivalOf(r, p), rs = x ? readyScore(x) : null;
      a.pulls++; a.deaths += s.deaths;
      // (execution counts the mechanic mistakes; the note's misses are in the assignment score instead, so they don't count twice)
      for (const m of mm) { if (m.severity === 'High') { a.high++; a.mechH.set(m.mechanic, (a.mechH.get(m.mechanic) || 0) + 1); } else a.other++; a.mech.set(m.mechanic, (a.mech.get(m.mechanic) || 0) + 1); if (m.fromNote) a.assignMiss++; else if (m.severity === 'High') a.highM = (a.highM || 0) + 1; else a.otherM = (a.otherM || 0) + 1; }
      { const c = credit.get(p.name) || credit.get(who.name); if (c) { a.asDid = (a.asDid || 0) + c.did; a.asOf = (a.asOf || 0) + c.of; } }
      a.surv.push(s.score); if (s.expect) { a.pot[0] += s.used; a.pot[1] += s.expect; } if (s.pre) a.pre++;
      // output feedback, added up over the night (activity, potion with Bloodlust, adds, what dying cost, avoidable damage)
      { const o = outputFeedback(r, p).st, O = a.out = a.out || { act: [], lost: 0, lostOf: 0, add: [], addAvg: [], potL: 0, potN: 0, avoidX: [], vsMed: [] };
        if (o.act != null) O.act.push(o.act); if (o.lost) { O.lost += o.lost; } if (o.lostOf) O.lostOf += o.lostOf; else O.lostOf += 0;
        if (o.add != null) { O.add.push(o.add); O.addAvg.push(o.addAvg); } if (o.potN) { O.potN++; O.potL += o.potLust; } if (o.avoidX != null) O.avoidX.push(o.avoidX); if (o.vsMed != null) O.vsMed.push(o.vsMed); }
      a.defReady += s.defReady; a.kitReady += s.kitReady; a.oneShots += s.oneShots; a.calls += s.calls; a.silent += s.silent; a.stones += s.stones; a.hpots += s.hpots;
      // (a tank's big cooldowns, added up over the night, per cooldown too)
      if (s.tank) {
        a.tankLow = (a.tankLow || 0) + tankLow.filter((m) => m.player === p.name || m.player === who.name).length;
        if (tf) { const mine = tf.rows.filter((row) => row[0].t != null && row[0].t <= ctR + 0.05 && row[2] && (row[2].p === p.name || row[2].p === who.name)); a.tfN = (a.tfN || 0) + mine.length; a.tfClean = (a.tfClean || 0) + mine.filter((row) => !row.some((c) => c.bad || c.warn)).length; }
      }
      if (s.tank) { a.tank = true; a.cdUsed = (a.cdUsed || 0) + s.cdUsed; a.cdPoss = (a.cdPoss || 0) + s.cdPoss; a.cdBy = a.cdBy || new Map(); for (const d of s.cds) { const y = a.cdBy.get(d.name) || { name: d.name, used: 0, poss: 0 }; y.used += d.used; y.poss += d.poss; a.cdBy.set(d.name, y); } }
      if (x) {
        a.ready.push(rs); a.last = x;
        for (const k of ['flask', 'food', 'rune']) { a[k][1]++; if (x[k]) a[k][0]++; }
        a.oil[1]++; if (x.temp) a.oil[0]++;
        for (const t of x.issues.concat(x.tighten)) a.miss.set(t, (a.miss.get(t) || 0) + 1);
      }
      a.log.push({ pull: r.item.pull, item: r.item, kill: r.item.kill, pct: r.bossPct, s, ready: rs, deaths: keptDeaths(r).filter((d) => d.guid === p.guid), mistakes: mm, issues: x ? x.issues : null, tighten: x ? x.tighten : null });
    }
  }
  const avg = (l) => (l.length ? l.reduce((s, v) => s + v, 0) / l.length : null), minPulls = Math.max(1, Math.ceil(reps.length / 2));
  const ps = [...pl.values()].map((a) => {
    // execution: 30 off per death, 14 per serious and 4 per medium mechanic mistake (per pull); tanks also lose 2 per minor
    // slip on their own mechanics (a missed taunt swap, a second stack without two externals), since those are most of their checks
    const n = a.pulls, clean = Math.max(0, 100 - 30 * a.deaths / n - 14 * (a.highM || 0) / n - 4 * (a.otherM || 0) / n - 2 * (a.tankLow || 0) / n), readyS = avg(a.ready), survS = avg(a.surv);
    // the MVP score: execution 40, survival 30, ready 30; a player with note assignments: execution 35, assignments 20,
    // survival 25, ready 20 (whatever wasn't logged is left out and the rest scaled up)
    const asS = a.asOf ? 100 * a.asDid / a.asOf : null;
    const parts = asS == null ? [[clean, 0.4], [survS, 0.3], [readyS, 0.3]] : [[clean, 0.35], [asS, 0.2], [survS, 0.25], [readyS, 0.2]];
    const kept = parts.filter(([v]) => v != null), score = kept.reduce((s, [v, w]) => s + v * w, 0) / kept.reduce((s, [, w]) => s + w, 0);
    const stands = standsOut(a);
    return { ...a, clean, readyS, survS, asS, score, ranked: n >= minPulls, stands, st: worstSt(stands) };
  });
  if (!ps.length) return { render: () => '<div class="panel"><p class="muted" style="margin:0">No players found in these pulls.</p></div>', bind: () => {} };
  const sum = (f) => ps.reduce((s, a) => s + f(a), 0);
  // ---- the raid at a glance ----
  const rAvg = avg(ps.map((a) => a.readyS).filter((v) => v != null)), sAvg = avg(ps.map((a) => a.survS));
  const rBad = ps.filter((a) => a.stands.some((s) => s[2] === 'ready' && s[0] === 'bad')), rWarn = ps.filter((a) => a.stands.some((s) => s[2] === 'ready' && s[0] === 'warn'));
  const defR = sum((a) => a.defReady), potU = sum((a) => a.pot[0]), potE = sum((a) => a.pot[1]), never = ps.filter((a) => a.pot[1] && !a.pot[0]), low = ps.filter((a) => a.pot[1] && a.pot[0] && a.pot[0] / a.pot[1] < 0.7);
  const kitR = sum((a) => a.kitReady), silent = sum((a) => a.silent), used = sum((a) => a.stones + a.hpots);
  const geared = ps.filter((a) => a.last), enchMiss = geared.filter((a) => [...a.last.ench.values()].some((e) => !e)), sockets = sum((a) => (a.last && a.last.emptySockets) || 0);
  const fullGear = geared.filter((a) => ![...a.last.ench.values()].some((e) => !e) && !a.last.emptySockets).length;
  const few = (l, txt) => plural(l.length, 'player') + ' ' + txt; // (the rows below name them)
  const tiles = '<div class="pts">' +
    plTile(rAvg == null ? '' : gradeChip(letterOf(rAvg)), 'Ready to raid', rAvg == null ? '—' : Math.round(rAvg) + '<span> avg</span>', rAvg == null ? 'na' : rBad.length ? 'bad' : rWarn.length ? 'warn' : 'ok',
      rAvg == null ? 'no gear logged' : rBad.length ? few(rBad, 'missing gear or buffs') : rWarn.length ? plural(rWarn.length, 'player') + ' could be better' : 'everyone ready', false, rAvg == null ? null : letterOf(rAvg)) +
    plTile(gradeChip(letterOf(sAvg)), 'Survival kit', Math.round(sAvg) + '<span> avg</span>', defR ? 'bad' : 'ok', defR ? plural(defR, 'death') + ' with a defensive or self-heal ready' : 'no deaths with a defensive or self-heal ready', false, letterOf(sAvg)) +
    plTile(plIco(PL_ICON.pot), 'Combat or mana pots', potE ? Math.round(100 * potU / potE) + '<span>%</span>' : '—', !potE ? 'na' : never.length ? 'bad' : low.length ? 'warn' : 'ok',
      !potE ? 'not judged yet' : never.length ? few(never, 'never potted') : low.length ? few(low, 'under 70%') : 'everyone potted') +
    plTile(plIco(PL_ICON.stone), 'Stones and health pots', used + '<span> used</span>', kitR ? 'bad' : silent ? 'warn' : 'ok',
      kitR ? 'died with one unused ' + (kitR === 1 ? 'once' : kitR + ' times') : silent ? plural(silent, 'close call') + ' with nothing pressed' : 'nothing to flag') +
    plTile(plIco(PL_ICON.ench), 'Enchants and gems', geared.length ? fullGear + '<span> / ' + geared.length + '</span>' : '—', !geared.length ? 'na' : enchMiss.length ? 'bad' : sockets ? 'warn' : 'ok',
      !geared.length ? 'no gear logged' : enchMiss.length ? few(enchMiss, 'missing enchants') : sockets ? plural(sockets, 'empty gem socket') : 'all enchanted and gemmed') + '</div>';
  // ---- the MVPs: a slim podium (2nd, 1st, 3rd) ----
  const sc = (v) => (v == null ? 'dim' : v >= 85 ? 'ok' : v >= 65 ? 'warn' : 'bad');
  const bar = (label, v) => '<div class="nb-bar"><span>' + label + '</span><div class="csbar"><i class="' + sc(v) + '" style="width:' + (v == null ? 0 : Math.round(v)) + '%"></i></div><b>' + (v == null ? '—' : Math.round(v)) + '</b></div>';
  // ---- the MVPs, by role (tanks, healers and DPS are scored differently, so they're ranked apart): the best tank, the
  // top two healers and the top three DPS ----
  const ranked = ps.filter((a) => a.ranked), ROLES = [['tank', 'Tank', 1], ['healer', 'Healers', 2], ['dps', 'DPS', 3]], mvpRank = new Map();
  const mvpGroups = ROLES.map(([role, label, n]) => { const list = ranked.filter((a) => (a.p.role || 'dps') === role).sort((a, b) => b.score - a.score).slice(0, n);
    list.forEach((a, k) => mvpRank.set(a.p.guid, { k: k + 1, label: n === 1 ? 'Top tank' : ['1st', '2nd', '3rd'][k] + ' ' + (role === 'healer' ? 'healer' : 'DPS') })); return { label, list }; }).filter((g) => g.list.length);
  const mvc = (a, k) => '<div class="mvc m' + (k + 1) + '">' + avatar(a.p) + '<div class="mvc-n"><span class="mvc-p">' + esc(mvpRank.get(a.p.guid).label) + '</span><span class="nm" style="color:' + a.p.color + '" title="' + esc(a.p.name) + '">' + esc(a.p.name) + '</span><span class="sub">' + esc(a.p.specName || '') + '</span></div>' +
    '<div class="mvc-s">' + Math.round(a.score) + '</div><div class="mvc-bars">' + bar('Execution', a.clean) + (a.asS != null ? bar('Assigned', a.asS) : '') + bar('Survival', a.survS) + bar('Ready', a.readyS) + '</div></div>';
  const mvpH = mvpGroups.length ? '<div class="plmv"><div class="plmv-h"><span class="mvp-trophy">★</span><b>MVPs of the night</b><span class="sub">by role · execution, assignments, survival kit and readiness over ' + plural(reps.length, 'pull') + '</span></div>' +
    // (a row per role on a narrow screen; on a computer all six cards in one row, each card naming its own role)
    '<div class="plmv-row" style="--t:' + mvpGroups.reduce((s, g) => s + g.list.length, 0) + '">' +
    mvpGroups.map((g) => '<div class="plmv-g"><div class="plmv-gh">' + g.label + '</div><div class="plmv-c">' + g.list.map(mvc).join('') + '</div></div>').join('') + '</div></div>' : '';
  // ---- everyone: worst group first, lowest score first inside it ----
  const all = ps.slice().sort((a, b) => ((a.readyS == null ? a.survS : (a.readyS + a.survS) / 2) - (b.readyS == null ? b.survS : (b.readyS + b.survS) / 2)) || a.p.name.localeCompare(b.p.name));
  const byPull = new Map(reps.map((r) => [r.item.pull, r.item]));
  const howit = '<details class="howit"><summary>How it\'s scored</summary><div>Ready to raid, per pull: consumables 60 (flask 25, food 20, weapon oil or stone 15) and gear 40 (missing enchants, rank 1 enchants, empty slots and gem sockets, and an item level 5 or more under the raid cost points). Augment runes aren\'t judged.<br>Survival kit, per pull up to the wipe filter: defensives 40 (dying with one ready, or a close call under 30% health with nothing pressed), Healthstone and health potion 30 (the same, for them) and combat or mana potion 30 (they share one 5-minute cooldown, so a healer\'s mana potion counts; one per pull, two if alive over 5 minutes, and a pre-pot counts). One-shots aren\'t held against anyone. Tanks are scored differently: defensives 60, including how often they used their big cooldowns (80% of the uses they had is full marks), Healthstone and health potion 15, combat potion 25; for a tank only a dip under 15% with nothing pressed counts.<br>Groups: "needs a word" is a missing enchant or empty slot, a flask, food or weapon oil missed on a fifth of the pulls or more, no combat or mana potion all night, or dying with a defensive or self-heal ready on a fifth of the pulls or more. Smaller slips are "could be better".<br>MVPs, by role (the best tank, the top two healers, the top three DPS): 40% execution (deaths and mechanic mistakes per pull; tanks also lose a little for each minor slip on their own frontals, like a missed taunt swap), 30% survival, 30% ready. A player with assignments in the NSRT note: 35% execution, 20% assignments (the share of their own they did; late or partly done counts half), 25% survival, 20% ready. Players need half the pulls to be ranked.</div></details>';
  let rows = [];
  const render = () => {
    // (a tank's row says what their score is made of: their frontals, deaths and big cooldowns over the night)
    const tankLine = (a) => (!a.tank ? '' : [a.tfN ? 'frontals clean ' + a.tfClean + '/' + a.tfN : '', a.deaths ? plural(a.deaths, 'death') : 'no deaths', a.cdPoss ? 'big cooldowns ' + Math.round(100 * a.cdUsed / a.cdPoss) + '%' : ''].filter(Boolean).join(' · '));
    rows = all.map((a, k) => ({ k, p: a.p, st: a.st, sub: (a.p.specName || '') + ' · ' + plural(a.pulls, 'pull'), tankLine: tankLine(a), ready: a.readyS, surv: a.survS, icons: nightIcons(a), notes: a.stands, mvp: mvpRank.get(a.p.guid) || null, open: S.plOpenN === a.p.name, detail: () => nightSheet(a) }));
    return tiles + mvpH + plRoster(rows, 'plRosterN') + howit;
  };
  const openPull = (n, name) => { const it = byPull.get(+n); if (!it) return; S.tab = 'player'; setScope('pull'); S.plOpenP = name; select(it); };
  const bind = () => bindRoster('plRosterN', rows, (o) => { S.plOpenN = o ? o.p.name : null; }, (x, o) => x.querySelectorAll('.nm-cell[data-pull]').forEach((b) => (b.onclick = () => openPull(b.dataset.pull, o.p.name))));
  return { render, bind };
}
// What stands out about a player's night, worst first: [severity, text, 'ready' or 'surv'] (augment runes aren't judged)
function standsOut(a) {
  const out = [];
  if (a.pot[1] && a.pot[0] === 0) out.push(['bad', 'no combat or mana potion all night', 'surv']); else if (a.pot[1] && a.pot[0] / a.pot[1] < 0.7) out.push(['warn', 'combat or mana potion on ' + a.pot[0] + ' of ' + a.pot[1], 'surv']);
  // (over a long night, a slip or two is normal: a defensive left ready counts as a problem from a fifth of the pulls)
  if (a.defReady >= 2) out.push([a.defReady >= 3 && a.defReady >= 0.2 * a.pulls ? 'bad' : 'warn', 'died with a defensive or self-heal ready ' + a.defReady + ' times', 'surv']);
  const g = a.last;
  if (g) {
    const miss = [...g.ench.entries()].filter(([, e]) => !e).map(([i]) => (ENCHANT_SLOTS.find(([j]) => j === i) || [0, 'an item'])[1].toLowerCase());
    if (miss.length) out.push(['bad', 'no ' + andList(miss) + ' enchant', 'ready']);
    if (g.issues.some((t) => /^Empty /.test(t))) out.push(['bad', g.issues.filter((t) => /^Empty /.test(t)).map((t) => t.toLowerCase()).join(', '), 'ready']);
    if (g.emptySockets) out.push(['warn', plural(g.emptySockets, 'empty gem socket'), 'ready']);
    if (g.lowIlvl) out.push(['warn', 'item level ' + Math.round(g.ilvl) + ', ' + Math.round(g.raidIlvl - g.ilvl) + ' under the raid', 'ready']);
  }
  // (a buff missed on a fifth of the pulls or more is a problem; fewer, could be better)
  for (const [k, l] of [['flask', 'flask'], ['food', 'food'], ['oil', 'weapon oil or stone']]) if (a[k][1] && a[k][0] < a[k][1]) out.push([(a[k][1] - a[k][0]) >= 0.2 * a[k][1] ? 'bad' : 'warn', 'no ' + l + ' on ' + (a[k][1] - a[k][0]) + ' of ' + a[k][1] + ' pulls', 'ready']);
  if (a.kitReady >= Math.max(2, 0.1 * a.pulls)) out.push(['warn', 'died with a Healthstone or potion unused ' + a.kitReady + ' times', 'surv']);
  if (a.silent >= 3) out.push(['warn', a.silent + (a.tank ? ' dips under 15% with nothing pressed' : ' close calls with nothing pressed'), 'surv']);
  if (a.tank && a.cdPoss >= 4 && a.cdUsed / a.cdPoss < 0.5) out.push([a.cdUsed / a.cdPoss < 0.3 ? 'bad' : 'warn', 'big cooldowns used ' + a.cdUsed + ' of ' + a.cdPoss + ' times they were up', 'surv']);
  return out.sort((x, y) => (x[0] === 'bad' ? 0 : 1) - (y[0] === 'bad' ? 0 : 1));
}
const worstSt = (notes) => (notes.some((n) => n[0] === 'bad') ? 'bad' : notes.some((n) => n[0] === 'warn') ? 'warn' : 'ok');
// the Ready to raid and Survival kit checklists, as ✓ / ! / ✕ lines (one pull or a whole night)
const ckLine = (st, html) => '<div class="ck ' + st + '"><span class="ck-m">' + ({ ok: '✓', warn: '!', bad: '✕', na: '–' }[st] || '') + '</span><span>' + html + '</span></div>';
function readyLines(x, night) {
  if (!x) return ckLine('na', 'No gear or buffs were logged' + (night ? '' : ' for this pull') + '.');
  const miss = [...x.ench.entries()].filter(([, e]) => !e).map(([i]) => (ENCHANT_SLOTS.find(([j]) => j === i) || [0, 'item'])[1].toLowerCase()), r1 = [...x.ench.values()].filter((e) => e && e.rank === 1).length, nE = x.ench.size;
  const empty = x.issues.filter((t) => /^Empty /.test(t));
  const share = (v, l, soft) => (v ? (v[0] === v[1] ? ckLine('ok', l + ' every pull') : ckLine(v[0] || soft ? 'warn' : 'bad', l + ' on ' + v[0] + ' of ' + v[1] + ' pulls')) : '');
  return ckLine(x.lowIlvl ? 'warn' : 'ok', 'Item level ' + Math.round(x.ilvl) + (x.raidIlvl ? ', raid median ' + Math.round(x.raidIlvl) : '')) +
    (empty.length ? ckLine('bad', esc(empty.join(', '))) : '') +
    ckLine(miss.length ? 'bad' : r1 ? 'warn' : 'ok', miss.length ? 'No ' + esc(andList(miss)) + ' enchant' : r1 ? plural(r1, 'enchant') + ' at rank 1' : 'All ' + nE + ' enchants, all top rank') +
    ckLine(x.emptySockets ? 'warn' : 'ok', x.emptySockets ? plural(x.emptySockets, 'empty gem socket') : 'Every gem socket filled') +
    (night ? share(night.flask, 'Flask') + share(night.food, 'Food') + share(night.oil, 'Weapon oil or stone')
      : ckLine(x.flask ? 'ok' : 'bad', x.flask ? 'Flask' : 'No flask') + ckLine(x.food ? 'ok' : 'bad', x.food ? 'Food buff' : 'No food buff') + ckLine(x.temp ? 'ok' : 'bad', x.temp ? esc(x.temp[0]) : 'No weapon oil or stone'));
}
function survLines(s) {
  return ckLine(s.expect ? (s.used >= s.expect ? 'ok' : s.used ? 'warn' : 'bad') : 'na', s.expect ? 'Combat or mana potion: ' + s.used + ' of ' + s.expect + (s.pre ? ' (' + (s.pre === true || s.pre === 1 ? 'pre-pot' : s.pre + ' pre-pots') + ')' : '') : 'Combat or mana potion: not judged (under 20 s alive)') +
    ckLine(s.kitReady ? 'bad' : 'ok', plural(s.stones, 'Healthstone') + ', ' + plural(s.hpots, 'health potion') + (s.kitReady ? ' · died with one unused' + (s.kitReady > 1 ? ' ' + s.kitReady + ' times' : '') : '')) +
    // (tanks: their big cooldowns used against the uses they had, and only deep dips, under 15%, count as close calls)
    (s.tank && s.cdPoss ? ckLine(s.cdUsed / s.cdPoss >= 0.8 ? 'ok' : s.cdUsed / s.cdPoss >= 0.5 ? 'warn' : 'bad', 'Big cooldowns: ' + s.cdUsed + ' of ' + s.cdPoss + ' possible uses' + (s.cds && s.cds.length ? ' <span class="sub">(' + s.cds.map((d) => esc(d.name) + ' ' + d.used + '/' + d.poss).join(' · ') + ')</span>' : '') + (s.cdUsed / s.cdPoss < 0.8 ? ' · keep them rolling' : '')) : '') +
    (s.tank ? ckLine(s.silent ? 'warn' : 'ok', s.silent ? plural(s.silent, 'dip') + ' under 15% health with nothing pressed' : 'No deep dips left unanswered' + (s.calls ? ' <span class="sub">(' + plural(s.calls, 'dip') + ' under 30%: normal for a tank)</span>' : ''))
      : ckLine(s.silent ? 'warn' : 'ok', s.calls ? plural(s.calls, 'close call') + ' under 30% health' + (s.silent ? ', ' + s.silent + ' with nothing pressed' : ', every one answered') : 'No close calls')) +
    ckLine(s.defReady ? 'bad' : 'ok', s.defReady ? 'Died with a defensive or self-heal ready' + (s.defReady > 1 ? ' ' + s.defReady + ' times' : '') : s.deaths ? 'Died with nothing left to press' : 'Never died') +
    (s.oneShots ? ckLine('na', plural(s.oneShots, 'one-shot death') + ', not held against them') : '');
}
// One player's night, opened under their row: Ready to raid, Survival kit and Mechanics, then a square per pull
// the night's output feedback: the per-pull numbers added up (see outputFeedback)
function nightOutputLines(a) {
  const O = a.out; if (!O) return ckLine('na', 'Nothing tracked yet.');
  const avg = (l) => (l.length ? l.reduce((s, v) => s + v, 0) / l.length : null), role = (a.p.role || 'dps'), out = [];
  const vm = avg(O.vsMed); if (vm != null && role !== 'tank') out.push(ckLine('na', (role === 'healer' ? 'Healing' : 'Damage') + ' while alive: ' + Math.round(100 * vm) + '% of the ' + (role === 'healer' ? 'healers\'' : 'DPS') + ' median on average'));
  const ac = avg(O.act); if (ac != null) out.push(ckLine(ac >= 90 ? 'ok' : ac >= 80 ? 'warn' : 'bad', 'Active ' + Math.round(ac) + '% of the time alive, on average'));
  if (O.potN) out.push(ckLine(O.potL / O.potN >= 0.8 ? 'ok' : 'warn', 'Combat potion with Bloodlust in ' + O.potL + ' of ' + plural(O.potN, 'pull')));
  const ad = avg(O.add), aa = avg(O.addAvg); if (ad != null && aa != null) out.push(ckLine(ad < aa * 0.5 ? 'warn' : 'ok', Math.round(100 * ad) + '% of their damage on adds <span class="sub">(DPS average ' + Math.round(100 * aa) + '%)</span>'));
  if (O.lost) out.push(ckLine(O.lost / Math.max(1, O.lostOf) >= 0.15 ? 'bad' : 'warn', 'Dying cost about ' + Math.round(100 * O.lost / Math.max(1, O.lostOf)) + '% of their ' + (role === 'healer' ? 'healing' : 'damage') + ' over the night'));
  const ax = avg(O.avoidX); if (ax != null && role !== 'tank') out.push(ckLine(ax >= 2.5 ? 'bad' : ax >= 1.5 ? 'warn' : 'ok', 'Avoidable damage: ' + (ax >= 1.05 ? ax.toFixed(1) + '× ' : ax <= 0.95 ? 'below ' : 'about ') + 'their role\'s average'));
  return out.join('') || ckLine('na', 'Nothing tracked yet.');
}
function nightSheet(a) {
  // (healing cooldowns from the NSRT note are listed last, under their own name, apart from the mechanics)
  const HCD = 'Assigned cooldown', mName = (m) => (m === HCD ? 'Healing cooldown late or missed' : m);
  const mlist = [...a.mech].sort((x, y) => (x[0] === HCD) - (y[0] === HCD) || y[1] - x[1]);
  const night = { flask: a.flask[1] ? a.flask : null, food: a.food[1] ? a.food : null, oil: a.oil[1] ? a.oil : null };
  const sNight = { expect: a.pot[1], used: a.pot[0], pre: a.pre, stones: a.stones, hpots: a.hpots, kitReady: a.kitReady, calls: a.calls, silent: a.silent, defReady: a.defReady, deaths: a.deaths, oneShots: a.oneShots, tank: a.tank, cdUsed: a.cdUsed || 0, cdPoss: a.cdPoss || 0, cds: a.cdBy ? [...a.cdBy.values()] : [] };
  let h = '<div class="plx-cols"><div class="cs-box"><div class="cs-bt">Ready to raid <span class="sub">gear from the last pull, buffs all night</span></div>' + readyLines(a.last, night) + '</div>' +
    '<div class="cs-box"><div class="cs-bt">Survival kit <span class="sub">all night, up to each wipe filter</span></div>' + survLines(sNight) + '</div>' +
    '<div class="cs-box"><div class="cs-bt">Mechanics <span class="sub">medium and serious mistakes</span></div>' + (mlist.length ? mlist.map(([m, n]) => ckLine(a.mechH.get(m) ? 'bad' : 'warn', (m === HCD ? esc(mName(m)) : mech(m)) + ' <span class="sub">' + n + 'x</span>')).join('') : ckLine('ok', 'Clean all night')) +
      (a.assignMiss ? '<div class="sub" style="margin-top:6px">' + plural(a.assignMiss, 'NSRT assignment') + ' missed (included above)</div>' : '') + '</div>' +
    '<div class="cs-box"><div class="cs-bt">Output and activity <span class="sub">all night, up to each wipe filter</span></div>' + nightOutputLines(a) + '</div></div>';
  // pull by pull: one square per pull and line; click one to open that pull with this player
  const gl = (v) => letterOf(v) + ' ' + Math.round(v);
  const lines = [
    ['Ready to raid', (l) => (l.ready == null ? ['na', 'no gear logged'] : ['q-' + letterOf(l.ready), 'ready ' + gl(l.ready) + (l.issues.length || l.tighten.length ? ' · ' + l.issues.concat(l.tighten).join(', ').toLowerCase() : '')])],
    ['Survival kit', (l) => ['q-' + letterOf(l.s.score), 'survival ' + gl(l.s.score) + (l.s.expect ? ' · combat or mana potion ' + l.s.used + ' of ' + l.s.expect : '') + (l.s.defReady ? ' · died with a defensive or self-heal ready' : '')]],
    ['Mechanics', (l) => [l.mistakes.some((m) => m.severity === 'High') ? 'bad' : l.mistakes.length ? 'warn' : 'ok', l.mistakes.length ? [...new Set(l.mistakes.map((m) => mName(m.mechanic)))].join(', ') : 'clean']],
    ['Died', (l) => [l.deaths.length ? 'bad' : 'ok', l.deaths.length ? l.deaths.map((d) => 'died at ' + T(d.t) + (d.ability ? ' to ' + d.ability : '')).join(', ') : 'alive to the end or the wipe filter']]];
  const res = (l) => (l.kill ? 'kill' : 'wipe' + (l.pct != null ? ' at ' + l.pct.toFixed(1) + '%' : ''));
  h += '<div class="plx-g"><div class="cs-bt">Pull by pull <span class="sub">hover a square for the details; click it to open that pull</span></div><div class="scroll"><table class="tbl nmx"><thead><tr><th></th>' + a.log.map((l) => '<th class="c' + (l.kill ? ' okv' : '') + '">' + l.pull + '</th>').join('') + '</tr></thead><tbody>' +
    lines.map(([label, f]) => '<tr><td>' + label + '</td>' + a.log.map((l) => { const [st, tip] = f(l); return '<td class="c"><button class="nm-cell st-' + st + '" data-pull="' + l.pull + '" title="' + esc('Pull ' + l.pull + ' (' + res(l) + '): ' + tip) + '"></button></td>'; }).join('') + '</tr>').join('') + '</tbody></table></div>' +
    '<div class="legend nmx-leg"><span>Ready to raid and Survival kit by grade:' + ['S', 'A', 'B', 'C', 'D', 'F'].map((g) => ' <i class="nm-cell st-q-' + g + '"></i>' + g).join('') + '</span><span><i class="nm-cell st-ok"></i> clean</span><span><i class="nm-cell st-warn"></i> a medium mistake</span><span><i class="nm-cell st-bad"></i> a serious mistake, a death</span><span><i class="nm-cell st-na"></i> no gear logged</span></div></div>';
  return h;
}
// ---- boss progress through the night: where each pull ended (boss health left, 0 = kill), pull by pull ----
// Warcraft Logs gives every pull's end percentage with the report, so this needs no downloads; local logs use the
// pulls already read. Each boss card on the Night summary draws one of these charts.
// Multi-phase fights: progress is how much of the whole encounter's boss health is gone, all phases and bosses
// together, as one number from 100 (nothing done) to 0 (kill). Each phase's share is the boss health it takes, measured
// on Mythic kills: The Coiled Altar is Zul'jan in P1 (451M, a third), Malacrass in P2 (316M, about a quarter), nothing in
// the intermission (both heal back up, Zul'jan to 30% and Malacrass to 70% of their new health) and both in P3 (the rest).
// Ula'tek is one health pool all fight (her tail and the Venomous Heart share it), so it's her health.
// `hp`: each phase's bosses as [health in millions, the health it starts at]; `pool`: units sharing one health bar.
// (Other bosses use the boss health as before.)
const PROGRESS = { 'The Coiled Altar': { phases: ['P1', 'P2', 'Intermission', 'P3'], boss: { P1: ["Zul'jan"], P2: ['Hex Lord Malacrass'], Intermission: ["Zul'jan"], P3: ["Zul'jan", 'Hex Lord Malacrass'] },
    hp: { P1: { "Zul'jan": [451, 1] }, P2: { 'Hex Lord Malacrass': [316, 1] }, Intermission: {}, P3: { "Zul'jan": [1154, 0.3], 'Hex Lord Malacrass': [376, 0.7] } } },
  "Ula'tek": { phases: ['P1', 'P2', 'Intermission', 'P3'], boss: { P1: ["Ula'tek"], P2: ["Ula'tek"], Intermission: ["Ula'tek"], P3: ["Ula'tek"] }, pool: ["Ula'tek", 'Venomous Heart', 'Gore Rattle'] } };
// a phase's share of the encounter's health (0 to 1; the Ula'tek pool has no phases of its own)
const phSize = (cfg, k) => Object.values((cfg.hp || {})[k] || {}).reduce((s, [m, f0]) => s + m * f0, 0);
const phShare = (cfg, k) => { const tot = cfg.phases.reduce((s, p) => s + phSize(cfg, p), 0); return tot ? phSize(cfg, k) / tot : 0; };
// how much of the encounter is left (%), from the phase reached and its bosses' health (fractions by name), or the
// phase's health as one fraction (Warcraft Logs' boss percentage)
function encLeft(cfg, key, hp, frac) {
  const i = cfg.phases.indexOf(key); if (i < 0) return null;
  if (cfg.pool) return frac != null ? 100 * frac : null;
  const before = cfg.phases.slice(0, i).reduce((s, k) => s + phShare(cfg, k), 0), me = cfg.hp[key] || {}, size = phSize(cfg, key);
  const now = frac != null ? size * Math.min(1, frac) : Object.entries(me).reduce((s, [n, [m, f0]]) => s + m * (hp[n] != null ? Math.min(f0, hp[n]) : f0), 0);
  return 100 * (1 - before - (size ? phShare(cfg, key) * (1 - now / size) : 0));
}
const shortBoss = (n) => n.replace(/^Hex Lord /, '');
function progressOf(r) {
  if (!r) return null;
  if (r.item.kill) return { left: 0, label: 'Kill' };
  if (r.item.wcl) return wclProg(r.item) || (r.item.endPct != null ? { left: r.item.endPct, label: r.item.endPct.toFixed(1) + '%' } : null);
  const cfg = PROGRESS[r.item.boss], ph = r.module && !r.module.error && r.module.phases;
  if (cfg && ph && ph.length) {
    const last = ph[ph.length - 1], key = last.name.split(' ')[0], names = cfg.boss[key] || [], U = [...(r.hpUnits || new Map()).values()];
    // (a boss's health since this phase began: Zul'jan's P1 health doesn't count in P3)
    const hpOf = (n, from) => { let v = null, at = -1; for (const u of U) if (u.name === n) for (const [t, f] of u.samples) if (t >= from - 0.5 && t > at) { at = t; v = f; } return v; };
    if (cfg.pool) { let v = null, at = -1; for (const u of U) if (cfg.pool.includes(u.name) && u.samples.length) { const s = u.samples[u.samples.length - 1]; if (s[0] > at) { at = s[0]; v = s[1]; } }
      if (v != null && cfg.phases.includes(key)) return { left: encLeft(cfg, key, {}, v), phase: key, label: key + ' · ' + shortBoss(names[0] || r.item.boss) + ' ' + Math.round(100 * v) + '%' }; }
    else if (cfg.phases.includes(key)) {
      const hp = {}; for (const n of Object.keys(cfg.hp[key] || {})) { const v = hpOf(n, last.start); if (v != null) hp[n] = v; }
      const shown = names.map((n) => [n, hpOf(n, last.start)]).filter(([, v]) => v != null);
      return { left: encLeft(cfg, key, hp), phase: key, label: key + (shown.length ? ' · ' + shown.map(([n, v]) => shortBoss(n) + ' ' + Math.round(100 * v) + '%').join(', ') : '') };
    }
  }
  const v = r.item.endPct != null ? r.item.endPct : r.bossPct;
  return v != null ? { left: v, label: v.toFixed(1) + '%' } : null;
}
// a Warcraft Logs pull's progress from its fight list (the phase it ended in and that phase's boss health), so it reads the
// same as a local log's without downloading the pull
function wclProg(b) {
  const cfg = PROGRESS[b.boss]; if (!cfg || !b.endPhase || b.endBoss == null || !cfg.phases.includes(b.endPhase)) return null;
  const k = b.endPhase, f = b.endBoss / 100, nm = (cfg.boss[k] || []).length === 1 ? shortBoss(cfg.boss[k][0]) + ' ' : '';
  return { left: encLeft(cfg, k, {}, k === 'Intermission' && !cfg.pool ? 1 : f), phase: k, label: k + (k === 'Intermission' && !cfg.pool ? '' : ' · ' + nm + Math.round(b.endBoss) + '%') };
}
// a saved earlier night's pull, re-read from its label ("P2 · Malacrass 66%"), so nights saved before this measure agree
function labelLeft(boss, label) {
  const cfg = PROGRESS[boss], m = cfg && /^(P\d|Intermission)(?: · (.*))?$/.exec(label || ''); if (!m) return null;
  const hp = {}; let frac = null;
  for (const part of (m[2] || '').split(', ')) { const x = /^(?:(.*) )?(\d+(?:\.\d+)?)%$/.exec(part); if (!x) continue; const n = x[1] && Object.keys((cfg.hp || {})[m[1]] || {}).find((k) => shortBoss(k) === x[1]);
    if (n) hp[n] = +x[2] / 100; else frac = +x[2] / 100; }
  return encLeft(cfg, m[1], hp, cfg.pool ? frac : Object.keys(hp).length ? null : m[1] === 'Intermission' ? 1 : frac);
}
// (a local pull's progress once it's read; a Warcraft Logs pull's from the report's fight list)
const pullProg = (b) => (b.wcl ? wclProg(b) : CACHE.has(b) ? progressOf(CACHE.get(b)) : null);
const pullPct = (b) => { if (b.kill) return 0; if (PROGRESS[b.boss]) { const p = pullProg(b); if (p) return p.left; } return b.endPct != null ? b.endPct : CACHE.has(b) && CACHE.get(b).bossPct != null ? CACHE.get(b).bossPct : null; };
const pullLabel = (b) => { const p = pullProg(b); return b.kill ? 'kill' : p ? p.label : pullPct(b) != null ? pullPct(b).toFixed(1) + '%' : 'wipe'; };
// a pull's colour, WoW item quality by how far through the whole encounter it got: every 20% of the encounter's health is
// one step (poor, common, uncommon, rare, epic), and a kill is legendary
const PULL_Q = [[80, '#b25ef5'], [60, '#2e8cff'], [40, '#2ee62e'], [20, '#f2f2f2'], [0, '#9d9d9d']];
const pullCol = (b) => { if (b.kill) return '#ff8000'; const v = pullPct(b); return v == null ? null : PULL_Q.find(([lo]) => 100 - v >= lo)[1]; };
// the dot colours, as a legend line (the Progress page and the Summary chart)
const pullLegend = (cls) => '<div class="pc-legend' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><span>Each dot is a pull, by how far it got:</span>' + [...PULL_Q].reverse().map(([lo, c], i, a) => '<span><i style="background:' + c + '"></i>' + (i < a.length - 1 ? lo + '–' + (a[i + 1][0] - 1) + '%' : lo + '%+') + '</span>').join('') +
  '<span><i class="k"></i>kill</span><span><i class="b"></i>best so far</span></div>';
// the big chart is drawn at the width it gets on screen (again once it's in the page, and when the window changes size):
// it's stretched to fill its box, so drawn at any other width its numbers and dots would come out squashed
const TREND_REG = new Map(); let trendN = 0, trendRz = 0;
const trendSoon = () => { clearTimeout(trendRz); trendRz = setTimeout(fitTrends, 120); };
const trendRO = window.ResizeObserver ? new ResizeObserver(trendSoon) : null;
window.addEventListener('resize', trendSoon);
function fitTrends() {
  for (const [id, pulls] of TREND_REG) {
    const q = 'svg.trend.big[data-tid="' + id + '"]'; let el = document.querySelector(q); if (!el) continue;
    const w = Math.round(el.getBoundingClientRect().width);
    if (w > 0 && Math.abs(w - +el.dataset.w) > 2) { if (trendRO) trendRO.unobserve(el); el.outerHTML = trendSvg(pulls, true, w, id); el = document.querySelector(q); }
    if (trendRO && el && !el.dataset.ro) { el.dataset.ro = '1'; trendRO.observe(el); }
  }
}
function trendSvg(pulls, big, wpx, tid) {
  if (big && !tid) { tid = ++trendN; TREND_REG.set(tid, pulls); TREND_REG.delete(tid - 20); requestAnimationFrame(fitTrends); }
  const W = big ? wpx || 760 : 220, H = big ? 190 : 54, L = big ? 34 : 4, R = big ? 12 : 4, T = big ? 10 : 4, Bm = big ? 24 : 4;
  const n = pulls.length, X = (i) => L + (n <= 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1)), Y = (v) => T + ((100 - v) / 100) * (H - T - Bm);
  const pts = pulls.map((b, i) => ({ i, b, v: pullPct(b) })).filter((p) => p.v != null);
  let s = '<svg class="trend' + (big ? ' big' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Boss health at the end of each pull"' + (big ? ' data-tid="' + tid + '" data-w="' + W + '"' : '') + '>';
  // multi-phase fights: the bands are the phases (P1 at the top), each as tall as its share of the encounter's health
  // (one with none, like the Coiled Altar intermission, is just its line); otherwise boss health in %
  const pcfg = pulls[0] && PROGRESS[pulls[0].boss] && !PROGRESS[pulls[0].boss].pool && PROGRESS[pulls[0].boss];
  if (big && pcfg) { let g = 100; s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g) + '" y2="' + Y(g) + '" class="tg"/>';
    for (const p of pcfg.phases) { const w = 100 * phShare(pcfg, p); if (w <= 0) continue; s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g - w) + '" y2="' + Y(g - w) + '" class="tg"/><text x="' + (L - 6) + '" y="' + (Y(g - w / 2) + 4) + '" class="tl" text-anchor="end">' + esc(p) + '</text>'; g -= w; } }
  else if (big) for (const g of [0, 25, 50, 75, 100]) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g) + '" y2="' + Y(g) + '" class="tg"/><text x="' + (L - 6) + '" y="' + (Y(g) + 4) + '" class="tl" text-anchor="end">' + g + '%</text>';
  if (pts.length > 1) {
    s += '<polyline class="tline" points="' + pts.map((p) => X(p.i).toFixed(1) + ',' + Y(p.v).toFixed(1)).join(' ') + '"/>';
    let bst = 101; const step = pts.map((p) => { bst = Math.min(bst, p.v); return X(p.i).toFixed(1) + ',' + Y(bst).toFixed(1); });
    s += '<polyline class="tbest" points="' + step.join(' ') + '"/>';
  }
  // (each dot in its pull's colour, as in the pull strip and on the Progress page; a kill orange, with a ring)
  for (const p of pts) { const cx = X(p.i).toFixed(1), cy = Y(p.v).toFixed(1);
    if (big && p.b.kill) s += '<circle cx="' + cx + '" cy="' + cy + '" r="10" class="tkh"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (big ? (p.b.kill ? 6 : 4) : p.b.kill ? 3.5 : 2) + '" class="' + (p.b.kill ? 'tk' : 'tw') + '"' + (p.b.kill ? '' : ' style="fill:' + (pullCol(p.b) || '#9d9d9d') + '"') + '><title>Pull ' + p.b.pull + ': ' + esc(pullLabel(p.b)) + '</title></circle>'; }
  // (pull numbers along the bottom, about one every 50 px)
  if (big) { const every = Math.max(1, Math.ceil(n / Math.max(4, (W - L - R) / 50))); pulls.forEach((b, i) => { if (i % every === 0 || i === n - 1) s += '<text x="' + X(i) + '" y="' + (H - 6) + '" class="tl" text-anchor="middle">' + b.pull + '</text>'; }); }
  return s + '</svg>';
}

async function progress(all) {
  const it = S.item, box = () => (S.item === it && S.tab === 'overview' ? $('#progBox') : null);
  const pulls = S.index.bosses.filter((b) => b.id === it.id && b.diffId === it.diffId);
  if (box()) box().innerHTML = '<p class="muted">Analyzing ' + pulls.length + ' pulls…</p>';
  const reps = [];
  let skipped = 0;
  for (const b of pulls) {
    if (b.wcl && !all && !CACHE.has(b) && !(await WCL.isSaved(b))) { reps.push(null); skipped++; continue; }
    try { reps.push(await getRep(b)); } catch (e) { reps.push(null); }
    if (!box()) return;
  }
  const ok = reps.filter(Boolean);
  const kills = ok.filter((x) => x.item.kill);
  const best = kills.length ? 'Killed' : ok.filter((x) => x.bossPct != null).reduce((m, x) => Math.min(m, x.bossPct), 100);
  let h = skipped ? '<div class="panel" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:220px">Showing ' + ok.length + ' of ' + pulls.length + ' pulls. The other ' + skipped + ' haven\'t been downloaded yet.</span><button class="btn primary" id="progAll">Load all pulls</button></div>' : '';
  h += '<div class="tiles">' + tile('Pulls', pulls.length, kills.length ? kills.length + ' kill' + (kills.length > 1 ? 's' : '') : 'no kill yet') +
    tile('Best pull', typeof best === 'string' ? best : best.toFixed(1) + '%', 'boss health at the end') +
    tile('Time on boss', T(ok.reduce((s, x) => s + x.duration, 0)), 'across all pulls') +
    tile('Deaths', ok.reduce((s, x) => s + x.deaths.length, 0), (ok.length ? (ok.reduce((s, x) => s + x.deaths.length, 0) / ok.length).toFixed(1) : 0) + ' per pull') + '</div>';
  h += '<div class="panel"><h3>Boss health left after each pull <small>lower is better, hover or click a pull</small></h3>' +
    '<div class="legend"><span><i style="background:#cfd3dc"></i>Boss health left</span><span><i style="background:#e6b450"></i>Best so far</span><span><i style="background:#2f3546"></i>Pull length</span><span><i style="background:#45c15c"></i>Kill</span></div>' +
    '<div class="chart" id="pchart" style="height:280px"></div></div>';
  // "What keeps going wrong" and "Players across all pulls" are off on the NSRT audit for now (they'll move to another tab)
  if (SHOW_PROG_EXTRAS) {
  // recurring mistakes
  const agg = new Map();
  ok.forEach((x, i) => { for (const m of keptMistakes(x)) { if (m.mechanic === 'Death') continue; let a = agg.get(m.mechanic); if (!a) agg.set(m.mechanic, a = { name: m.mechanic, id: m.id, pulls: new Set(), n: 0, who: new Map() }); a.pulls.add(i); a.n++; if (m.player !== 'Raid') a.who.set(m.player, (a.who.get(m.player) || 0) + 1); } });
  const rec = [...agg.values()].sort((a, b) => b.pulls.size - a.pulls.size || b.n - a.n).slice(0, 10);
  h += '<div class="meters"><div class="panel"><h3>What keeps going wrong <small>mechanics by how many pulls they hit</small></h3>' + (rec.length ? rec.map((a) =>
    '<div class="drow"><div style="flex:1;min-width:0"><div class="line1"><span>' + spell(a.id, a.name) + '</span><span class="val">' + a.pulls.size + ' of ' + ok.length + ' pulls</span></div><div class="bar"><div style="width:' + (100 * a.pulls.size / ok.length) + '%;background:var(--warn)"></div></div>' +
    '<div class="sub">' + (a.who.size ? 'Most often: ' + esc([...a.who].sort((x, y) => y[1] - x[1]).slice(0, 4).map(([n, c]) => n + ' ' + c).join(', ')) : 'Raid-wide') + '</div></div></div>').join('') : '<p class="muted">No mechanic mistakes recorded across these pulls' + (ok[0] && !ok[0].hasPack ? ' (this boss has no rules yet)' : '') + '.</p>') + '</div>';
  // players across pulls
  const pl = new Map();
  for (const x of ok) for (const p of x.players.values()) {
    let a = pl.get(p.name); if (!a) pl.set(p.name, a = { p, pulls: 0, deaths: 0, avoid: 0, mistakes: 0, early: 0 });
    a.pulls++; a.deaths += p.deaths; a.avoid += p.avoidable; a.mistakes += keptMistakes(x).filter((m) => m.player === p.name && m.mechanic !== 'Death').length;
    const d0 = x.deaths.slice().sort((q, w) => q.t - w.t)[0]; if (d0 && d0.player === p.name) a.early++;
  }
  const rows = [...pl.values()].sort((a, b) => (b.deaths + b.mistakes + b.early * 2) - (a.deaths + a.mistakes + a.early * 2));
  h += '<div class="panel"><h3>Players across all pulls</h3><table class="tbl"><thead><tr><th>Player</th><th class="r">Deaths</th><th class="r">First death</th><th class="r">Mistakes</th><th class="r">Avoidable</th></tr></thead><tbody>' +
    rows.map((a) => '<tr><td><span class="who">' + avatar(a.p, true) + '<span class="nm" style="color:' + a.p.color + '">' + esc(a.p.name) + '</span></span></td><td class="r">' + a.deaths + '</td><td class="r">' + (a.early || '') + '</td><td class="r">' + a.mistakes + '</td><td class="r">' + C(a.avoid) + '</td></tr>').join('') +
    '</tbody></table><p class="muted" style="font-size:13px;margin:8px 0 0">First death counts how many pulls this player died first, which often decides the wipe.</p></div></div>';
  }
  if (!box()) return;
  box().innerHTML = h;
  if ($('#progAll')) $('#progAll').onclick = () => progress(true);
  PROG_REPS = reps;
  drawProgress(reps);
  refreshIcons();
}

function drawProgress(reps) {
  const box = $('#pchart'); if (!box) return;
  const pts = reps.map((x, i) => x && { i, x, hp: x.item.kill ? 0 : x.bossPct }).filter((p) => p && p.hp != null);
  if (!pts.length) { box.innerHTML = '<p class="muted">No boss health in these pulls. Advanced Combat Logging may have been off.</p>'; return; }
  const W = box.clientWidth, H = box.clientHeight, L = 46, R = 46, Tp = 12, B = 30, iw = W - L - R, ih = H - Tp - B, n = reps.length;
  const X = (i) => L + (n === 1 ? iw / 2 : (i + 0.5) * iw / n), Y = (hp) => Tp + (1 - hp / 100) * ih;
  const maxDur = Math.max(...reps.filter(Boolean).map((x) => x.duration), 1);
  const bw = Math.max(3, Math.min(26, iw / n * 0.6));
  let s = '<svg width="' + W + '" height="' + H + '" style="display:block">';
  for (const v of [0, 25, 50, 75, 100]) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#2a2f3b"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="#6c7381" font-size="12">' + v + '%</text>';
  const dm = maxDur > 300 ? 120 : 60;
  for (let d = 0; d <= maxDur; d += dm) { const y = Tp + ih - d / maxDur * ih; s += '<text x="' + (W - R + 8) + '" y="' + (y + 4) + '" fill="#4f5666" font-size="11">' + T(d) + '</text>'; }
  reps.forEach((x, i) => { if (!x) return; const hgt = x.duration / maxDur * ih; s += '<rect x="' + (X(i) - bw / 2) + '" y="' + (Tp + ih - hgt) + '" width="' + bw + '" height="' + hgt + '" rx="2" fill="' + (x === S.rep ? '#3d3826' : '#232836') + '"/>'; });
  const step = n > 40 ? 5 : n > 20 ? 2 : 1;
  reps.forEach((x, i) => { if (x && (i % step === 0 || i === n - 1)) s += '<text x="' + X(i) + '" y="' + (H - 10) + '" text-anchor="middle" fill="#6c7381" font-size="12">' + x.item.pull + '</text>'; });
  let best = 100, bestPath = '';
  pts.forEach((p, k) => { const nb = Math.min(best, p.hp); bestPath += (k ? 'L' + X(p.i) + ' ' + Y(best) + ' ' : 'M' + X(p.i) + ' ' + Y(nb) + ' ') + 'L' + X(p.i) + ' ' + Y(nb) + ' '; best = nb; });
  s += '<path d="' + bestPath + '" fill="none" stroke="#e6b450" stroke-width="2" stroke-dasharray="5 4"/>';
  s += '<path d="' + pts.map((p, k) => (k ? 'L' : 'M') + X(p.i) + ' ' + Y(p.hp)).join(' ') + '" fill="none" stroke="#cfd3dc" stroke-width="1.6" stroke-opacity=".7"/>';
  for (const p of pts) {
    const cur = p.x === S.rep, col = p.x.item.kill ? '#45c15c' : cur ? '#e6b450' : '#cfd3dc';
    s += '<circle cx="' + X(p.i) + '" cy="' + Y(p.hp) + '" r="' + (cur || p.x.item.kill ? 6 : 4.5) + '" fill="' + col + '" stroke="#171a22" stroke-width="2"/>';
  }
  reps.forEach((x, i) => { if (x) s += '<rect class="phit" data-i="' + i + '" x="' + (X(i) - iw / n / 2) + '" y="' + Tp + '" width="' + (iw / n) + '" height="' + ih + '" fill="transparent" style="cursor:pointer"/>'; });
  s += '</svg><div class="tip" id="ptip"></div>';
  box.innerHTML = s;
  const tip = $('#ptip');
  box.querySelectorAll('.phit').forEach((el) => {
    const x = reps[+el.dataset.i];
    el.onmouseenter = () => {
      const d0 = x.deaths.slice().sort((a, b) => a.t - b.t)[0];
      tip.innerHTML = '<b>Pull ' + x.item.pull + '</b> ' + (x.item.wallMs ? wallClock(x.item.wallMs) : clock(x.item.startMs)) + '<br>' + (x.item.kill ? '<span style="color:#7ee08f">Kill</span>' : 'Boss at ' + (x.bossPct != null ? x.bossPct.toFixed(1) + '%' : 'unknown')) +
        (x.module ? '<br>Reached ' + esc(x.module.reached) : '') + '<br>Length ' + T(x.duration) + '<br>' + x.deaths.length + (x.deaths.length === 1 ? ' death' : ' deaths') + (d0 ? '<br>First: ' + esc(d0.player) + ' at ' + T(d0.t) : '');
      tip.style.display = 'block';
      tip.style.left = Math.min(+el.getAttribute('x') + iw / n + 6, W - 170) + 'px'; tip.style.top = '8px';
    };
    el.onmouseleave = () => (tip.style.display = 'none');
    el.onclick = () => { S.tab = 'overview'; setScope('pull'); select(x.item); };
  });
}
window.addEventListener('resize', () => { if (S.tab === 'overview' && PROG_REPS && $('#pchart')) drawProgress(PROG_REPS); });

// ---------- interrupts ----------
function missedList(r, pmap) {
  const ms = r.missedKicks || [];
  const nm = (k) => { const p = pmap.get(k.player); return '<span class="nm" style="color:' + (p ? p.color : 'inherit') + '">' + esc(k.player) + '</span>'; };
  return ms.map((m, i) => '<div class="drow mrowm' + (i === S.miss ? ' on' : '') + '" data-mi="' + i + '" style="align-items:flex-start;cursor:pointer"><span class="pk hotT">' + T(m.t) + '</span><div style="flex:1;min-width:0">' +
    '<div>' + spell(m.id, m.spell) + '</div><div class="addn">' + markIcon(m.marker) + '<b>' + esc(m.label) + '</b></div><div class="sub">' +
    (m.before.length ? 'Kicked earlier by ' + [...new Set(m.before.map((k) => k.player))].map((n) => nm({ player: n })).join(', ') : 'Never kicked before this') + '</div></div></div>').join('');
}
function byAddTable(r, pmap) {
  const nm = (n) => { const p = pmap.get(n); return '<span class="nm" style="color:' + (p ? p.color : 'inherit') + '">' + esc(n) + '</span>'; };
  const groups = new Map();
  for (const u of r.kickUnits || []) { if (!groups.has(u.name)) groups.set(u.name, []); groups.get(u.name).push(u); }
  const list = [...groups].sort((a, b) => b[1].reduce((s, u) => s + u.missed.length, 0) - a[1].reduce((s, u) => s + u.missed.length, 0));
  return list.map(([name, us]) => {
    us.sort((a, b) => a.wave - b.wave || a.n - b.n);
    const miss = us.reduce((s, u) => s + u.missed.length, 0), kick = us.reduce((s, u) => s + u.kicked.length, 0);
    let rows = '', lastWave = 0;
    for (const u of us) {
      if (u.wave !== lastWave && us.some((x) => x.wave > 1)) { lastWave = u.wave; rows += '<tr class="wv"><td colspan="4">Set ' + u.wave + ' <span class="sub">appeared at ' + T(u.spawn) + '</span></td></tr>'; }
      const who = new Map(); for (const k of u.kicked) who.set(k.player, (who.get(k.player) || 0) + 1);
      rows += '<tr' + (u.missed.length ? ' class="badrow"' : '') + '><td class="addn">' + markIcon(u.marker) + (u.marker ? '<span class="sub">' + MARKS[u.marker][0] + '</span> ' : '') + esc(u.short || name) + '</td><td class="r">' + u.kicked.length + '</td><td class="r' + (u.missed.length ? ' hotv' : '') + '">' + u.missed.length + '</td><td class="sub">' +
        ([...who].map(([n, c]) => nm(n) + ' ' + c).join(', ') || 'nobody') + '</td></tr>';
    }
    return '<div class="addgrp"><div class="line1"><b>' + esc(name) + '</b><span class="sub">' + us.length + (us.length === 1 ? ' add' : ' adds') + ', ' + kick + ' kicked, <span style="color:' + (miss ? '#ff8f87' : 'inherit') + '">' + miss + ' got off</span></span></div>' +
      '<table class="tbl"><thead><tr><th>Add</th><th class="r">Kicked</th><th class="r">Got off</th><th>Kicked by</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }).join('') + '<p class="muted" style="font-size:13px;margin:8px 0 0">Adds are grouped by name, then into sets (adds that appear within 8 seconds of each other), and numbered within their set. Raid markers come straight from the log.</p>';
}

// Top-down position map at the moment of a missed cast (world yards from Advanced Combat Logging).
function mapPanel(r, m, pmap) {
  const pts = (m && m.snap) || [];
  const add = m && pts.find((p) => p.guid === m.guid);
  if (!add) return '<div class="panel"><h3>Positions</h3><p class="muted" style="margin:0">No position data for this cast. Positions need Advanced Combat Logging turned on in WoW.</p></div>';
  // Map orientation: log x points east, log y points north (checked against the in-game floor maps).
  const sx = (p) => p.x, sy = (p) => -p.y;
  const xs = pts.map(sx), ys = pts.map(sy);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const span = Math.max(x1 - x0, y1 - y0, 30), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  x0 = cx - span * 0.62; x1 = cx + span * 0.62; y0 = cy - span * 0.62; y1 = cy + span * 0.62;
  const W = 640, H = 640, X = (p) => (sx(p) - x0) / (x1 - x0) * W, Y = (p) => (sy(p) - y0) / (y1 - y0) * H, yd = W / (x1 - x0);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const kickers = new Map();
  for (const k of m.before.concat(m.after)) if (!kickers.has(k.player)) kickers.set(k.player, k);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="map">' + MAP_DEFS;
  const arena = arenaImg(r.item.boss, { x0, y0, yd });
  const mi = arena ? null : mapImg(r.item.boss);
  MAPCTX = { x0, y0, yd, W, H, boss: r.item.boss };
  s += arena;
  if (mi) s += '<image id="userMap" href="' + mi.src + '" preserveAspectRatio="none" opacity="' + mi.op + '"' + imgAttrs(mi) + '/>';
  const step = span > 120 ? 20 : 10;
  for (let g = Math.ceil(x0 / step) * step; g < x1; g += step) s += '<line x1="' + (g - x0) * yd + '" x2="' + (g - x0) * yd + '" y1="0" y2="' + H + '" class="mg"/>';
  for (let g = Math.ceil(y0 / step) * step; g < y1; g += step) s += '<line y1="' + (g - y0) * yd + '" y2="' + (g - y0) * yd + '" x1="0" x2="' + W + '" class="mg"/>';
  s += '<circle cx="' + X(add) + '" cy="' + Y(add) + '" r="' + 40 * yd + '" class="rng"/>';
  for (const [name] of kickers) {
    const p = pts.find((q) => q.kind === 'player' && q.name === name); if (!p) continue;
    s += '<line x1="' + X(p) + '" y1="' + Y(p) + '" x2="' + X(add) + '" y2="' + Y(add) + '" class="kl"/>' +
      '<text x="' + (X(p) + X(add)) / 2 + '" y="' + ((Y(p) + Y(add)) / 2 - 4) + '" class="kd">' + Math.round(dist(p, add)) + ' yd</text>';
  }
  for (const p of pts.filter((q) => q.kind === 'boss')) s += '<circle cx="' + X(p) + '" cy="' + Y(p) + '" r="13" class="boss"/>' + nameplate(X(p), Y(p) - 19, p.name, p.marker, p.hp, 'bs', W);
  MAPTIPS = [];
  for (const p of pts.filter((q) => q.kind === 'add' && q.guid !== m.guid)) {
    const big = p.recent, sz = big ? 8 : 6;
    MAPTIPS.push(addTip(p, m, false));
    s += '<rect x="' + (X(p) - sz) + '" y="' + (Y(p) - sz) + '" width="' + sz * 2 + '" height="' + sz * 2 + '" transform="rotate(45 ' + X(p) + ' ' + Y(p) + ')" class="oadd' + (big ? ' rec' : '') + (p.stale > 3 ? ' stale' : '') + '" data-tip="' + (MAPTIPS.length - 1) + '"/>' +
      nameplate(X(p), Y(p) - sz - 6, (p.short || p.name) + (p.stale > 3 ? ', ' + Math.round(p.stale) + 's ago' : ''), p.marker, p.hp, big ? 'rec' : 'dim', W);
  }
  for (const p of pts.filter((q) => q.kind === 'player')) {
    const pl = pmap.get(p.name), col = pl ? pl.color : '#9aa0ac', isK = kickers.has(p.name);
    MAPTIPS.push(playerTip(r, pl, p, dist(p, add), m.t, isK));
    s += playerDot(X(p), Y(p), pl, isK ? 9 : 7, ' class="pl' + (isK ? ' k' : '') + '" data-tip="' + (MAPTIPS.length - 1) + '"');
    if (isK) s += '<text x="' + X(p) + '" y="' + (Y(p) + 20) + '" class="ml" fill="' + col + '">' + esc(p.name) + '</text>';
  }
  MAPTIPS.push(addTip(add, m, true));
  s += '<rect x="' + (X(add) - 10) + '" y="' + (Y(add) - 10) + '" width="20" height="20" transform="rotate(45 ' + X(add) + ' ' + Y(add) + ')" class="madd" data-tip="' + (MAPTIPS.length - 1) + '"/>' +
    nameplate(X(add), Y(add) - 18, add.name, m.marker || add.marker, add.hp, 'hot', W);
  s += '<line x1="16" x2="' + (16 + 10 * yd) + '" y1="' + (H - 16) + '" y2="' + (H - 16) + '" class="scale"/><text x="16" y="' + (H - 22) + '" class="ml" style="text-anchor:start">10 yards</text><text x="' + (W - 14) + '" y="22" class="ml" style="text-anchor:end">N ↑</text></svg>';
  const canKick = new Set(r.interrupts.map((k) => k.player));
  const near = pts.filter((p) => p.kind === 'player' && canKick.has(p.name)).map((p) => ({ p, d: dist(p, add) })).sort((a, b) => a.d - b.d).slice(0, 6);
  const side = '<div><div class="maplegend"><span><i class="lg madd"></i>Add that got its cast off</span><span><i class="lg rec"></i>Last 2 adds to cast before it</span><span><i class="lg oadd"></i>Other adds</span><span><i class="lg boss"></i>Boss</span></div>' +
    '<div class="sub" style="margin:8px 0 6px">Closest players who landed kicks this pull</div>' + near.map(({ p, d }) => {
      const pl = pmap.get(p.name);
      return '<div class="drow">' + (pl ? avatar(pl, true) : '') + '<div style="flex:1"><span class="nm" style="color:' + (pl ? pl.color : 'inherit') + '">' + esc(p.name) + '</span>' + (kickers.has(p.name) ? ' <span class="sub">kicks this add</span>' : '') + '</div><span class="val">' + Math.round(d) + ' yd</span></div>';
    }).join('') + '<p class="muted" style="font-size:13px">Hover any dot or add for details: players show their interrupt and whether it was ready. Nameplates show raid markers and health at the moment of the cast. The dashed ring is 40 yards, the range of most ranged interrupts.</p></div>';
  const ctrl = arena ? '<div class="mapctl"><span class="sub">Map: Blizzard\'s in-game floor map, placed with the game\'s own coordinates.</span></div>' : '<div class="mapctl">' + (mi
    ? '<button class="btn" id="mAlign">' + (ALIGN ? 'Done aligning' : 'Align map') + '</button>' + (ALIGN ? '<span class="sub">Drag to move, scroll to resize, then fine-tune:</span>' +
        '<label>Rotate <input type="range" id="mRot" min="-180" max="180" step="0.5" value="' + mi.rot + '"></label><label>Size <input type="range" id="mSize" min="10" max="600" step="1" value="' + Math.round(mi.w) + '"></label>' : '') +
      '<label>Map opacity <input type="range" id="mOp" min="0.1" max="1" step="0.05" value="' + mi.op + '"></label><button class="btn" id="mDel">Remove map</button>'
    : '<button class="btn" id="mAdd">Add a map image for ' + esc(r.item.boss) + '</button><span class="sub">Optional: a screenshot of this room\'s in-game map, lined up once and saved for every pull.</span>') +
    '<input type="file" id="mFile" accept="image/*" hidden></div>';
  return '<div class="panel"><h3>Where everyone was <small>' + markIcon(m.marker, 14) + ' ' + esc(m.spell) + ' from ' + esc(m.label) + ' at ' + T(m.t) + '</small></h3>' + ctrl +
    '<div class="mapwrap"><div class="mapbox">' + s + '<div class="maptip" id="maptip"></div></div>' + side + '</div></div>';
}

// ---- raid markers (original drawings, in the in-game marker colors) ----
const MARKS = [null, ['Star', '#f5d33f'], ['Circle', '#f08a2c'], ['Diamond', '#c05ee0'], ['Triangle', '#4fc24f'], ['Moon', '#c9d3e0'], ['Square', '#3f8ff0'], ['Cross', '#e8443a'], ['Skull', '#f2f2f2']];
const MARK_SHAPES = [null,
  '<path d="M8 1.5l1.9 4.2 4.6.4-3.5 3 1.1 4.5L8 11.3l-4.1 2.3 1.1-4.5-3.5-3 4.6-.4z"/>',
  '<circle cx="8" cy="8" r="6"/>',
  '<path d="M8 1.5L14 8l-6 6.5L2 8z"/>',
  '<path d="M8 2l6.5 11.5h-13z"/>',
  '<path d="M10.5 2.2A6 6 0 1 0 13.8 10 4.8 4.8 0 1 1 10.5 2.2z"/>',
  '<rect x="2.5" y="2.5" width="11" height="11" rx="1"/>',
  '<path d="M3 5l2-2 3 3 3-3 2 2-3 3 3 3-2 2-3-3-3 3-2-2 3-3z"/>',
  '<path d="M8 1.8a5.7 5.7 0 0 0-5.7 5.7c0 2 1.2 3 2 3.6v2.6h7.4v-2.6c.8-.6 2-1.6 2-3.6A5.7 5.7 0 0 0 8 1.8z"/><circle cx="5.8" cy="7.6" r="1.4" fill="#0f1117"/><circle cx="10.2" cy="7.6" r="1.4" fill="#0f1117"/>'];
function markIcon(idx, px) {
  if (!idx) return '';
  return '<svg class="mk" width="' + (px || 16) + '" height="' + (px || 16) + '" viewBox="0 0 16 16" aria-label="' + MARKS[idx][0] + '"><g fill="' + MARKS[idx][1] + '" stroke="#000" stroke-width=".8">' + MARK_SHAPES[idx] + '</g></svg>';
}
// In-map nameplate: [marker] name with a health bar under it, kept inside the map edges.
function nameplate(cx, bottom, label, marker, hp, kind, W) {
  const txt = String(label), w = Math.max(54, txt.length * 6.6 + (marker ? 20 : 0) + 12), h = hp != null ? 24 : 18;
  let x = cx - w / 2; x = Math.max(4, Math.min(W - w - 4, x)); const y = Math.max(4, bottom - h);
  let s = '<g class="np ' + kind + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" class="npbg"/>';
  if (marker) s += '<g transform="translate(' + (x + 4) + ' ' + (y + 2) + ')"><g fill="' + MARKS[marker][1] + '" stroke="#000" stroke-width=".8" transform="scale(.875)">' + MARK_SHAPES[marker] + '</g></g>';
  s += '<text x="' + (x + (marker ? 22 : 6)) + '" y="' + (y + 13) + '" class="npt">' + esc(txt) + '</text>';
  if (hp != null) s += '<rect x="' + (x + 4) + '" y="' + (y + h - 7) + '" width="' + (w - 8) + '" height="4" rx="1" class="nphb"/><rect x="' + (x + 4) + '" y="' + (y + h - 7) + '" width="' + ((w - 8) * Math.max(0, Math.min(100, hp)) / 100) + '" height="4" rx="1" class="nphp"/>';
  return s + '</g>';
}
function addTip(p, m, main) {
  const rows = ['<div class="tt-h">' + markIcon(p.marker || (main ? m.marker : 0), 14) + ' <b>' + esc(p.name) + '</b></div>'];
  if (p.marker || (main && m.marker)) rows.push('Marked ' + MARKS[p.marker || m.marker][0]);
  if (p.hp != null) rows.push('Health ' + p.hp + '%');
  if (main) rows.push('<span class="tt-bad">Got ' + esc(m.spell) + ' off at ' + T(m.t) + '</span>');
  else if (p.lastCast != null) rows.push('Last cast at ' + T(p.lastCast));
  if (p.stale > 3) rows.push('<span class="tt-dim">Last seen ' + Math.round(p.stale) + 's before this cast</span>');
  return rows.join('<br>');
}

// Tooltip for a player dot: who it is, distance, and whether their interrupt was ready at time t.
let MAPTIPS = [];
function playerTip(r, p, pos, d, t, isK) {
  if (!p) return '<b>' + esc(pos.name) + '</b><br>' + Math.round(d) + ' yd from the add';
  const list = ((E.INTERRUPTS[p.cls] || []).filter(([, , specs]) => !specs || specs.includes(p.specId)));
  const dead = S.rep.deaths.some((x) => x.guid === p.guid && x.t <= t);
  let kick = '';
  if (dead) kick = '<span class="tt-bad">Dead at this point</span>';
  else if (!list.length) kick = '<span class="tt-dim">' + (p.role === 'healer' ? 'No interrupt: healers lost theirs in Midnight (except Restoration Shaman)' : 'No interrupt for this spec') + '</span>';
  else kick = list.map(([name, cd]) => {
    const uses = (p.byName.get(name.toLowerCase()) || []).concat(r.interrupts.filter((k) => k.player === p.name && k.by === name).map((k) => k.t)).filter((x) => x <= t);
    const last = uses.length ? Math.max(...uses) : null;
    const ready = last == null || t - last >= cd;
    return '<div>' + spellIcon(0, name) + esc(name) + ': ' + (ready ? '<span class="tt-ok">ready</span>' : '<span class="tt-bad">on cooldown, ready in ' + Math.ceil(cd - (t - last)) + 's</span>') +
      (last != null ? '<span class="tt-dim"> (last used ' + T(last) + ')</span>' : '') + '</div>';
  }).join('');
  return '<div class="tt-h"><span class="nm" style="color:' + p.color + '">' + esc(p.name) + '</span> <span class="tt-dim">' + esc(p.specName) + '</span></div>' +
    '<div>' + Math.round(d) + ' yd from the add' + (d > 40 ? ' <span class="tt-dim">(outside 40 yd)</span>' : '') + (isK ? ' <span class="tt-gold">kicks this add</span>' : '') + '</div>' + kick;
}

// ---- built-in arena maps: RaidPlan.io's top-down arena renders, loaded at runtime (never bundled) ----
// Each render is north-up. cx/cy = the log position (x east, y north, yards) at the image center, s = image
// pixels per yard; w/h = image size. Calibrated by overlaying real Mythic pulls (Oct 2026) on each render:
// player paths line up with platform edges, the Nek'zali well and the Twin Fangs triangle.
const ARENAS = {
  "Nek'zali the Soulcoiler": { f: '01.nakzali-ort-v105.jpg', w: 2181, h: 1221, cx: 0, cy: 198, s: 11 },
  'Entombed Sentinels': { f: '02.sentinels-ort-v108.jpg', w: 2123, h: 1188, cx: 375, cy: 710, s: 11 },
  'Vashnik the Malignant': { f: '03.vashnik-ort-enter-v180.jpg', w: 2448, h: 1371, cx: 320, cy: 446, s: 11 },
  'The Lost Explorers': { f: '04.lostexplorers-ort-v112.jpg', w: 2448, h: 1371, cx: -470, cy: 698, s: 11 },
  Sszorak: { f: '05.sszorak-ort-v122.jpg', w: 2448, h: 1371, cx: -409, cy: 387, s: 11 },
  'The Twin Fangs': { f: '06.twinfangs-ort-v140.jpg', w: 2448, h: 1371, cx: 0, cy: 612, s: 10 }, // re-fit on 5 pulls: corners stay on the platform
  'The Coiled Altar': { f: '07.bargained-ort-v108.jpg', w: 2448, h: 1371, cx: 0, cy: 1158, s: 15 },
  "Ula'tek": { f: '08.ulatek-ort-platform-v85.jpg', w: 2123, h: 1188, cx: 0, cy: 1554, s: 10.5 },
};
ARENAS['The Bargained Crown'] = ARENAS['The Coiled Altar'];
// ARENAS above is now only each boss's room box (the "Full arena" view); the art drawn is the floor map below.

// The art: Blizzard's in-game floor maps (Wowhead's datamined copies, loaded at runtime, never bundled), placed with
// the game's own coordinates instead of by eye. Bounds are each floor's world extent from UiMapAssignment (via
// wago.tools). WoW map art is a 4x3 grid of 256px tiles (1024x768) and the map fills only the top-left 1002x668,
// so that area is what spans the floor's bounds. Checked against real pulls: paths sit on the Twin Fangs walkway
// and the Coiled Altar altar. In log positions x = -world Y (east), y = world X (north).
const FLOORS = {
  2606: { img: 1290351, minX: -110, maxX: 525, minY: -476.25, maxY: 476.25 },
  2607: { img: 1290352, minX: 410, maxX: 1088, minY: -508.5, maxY: 508.5 },
  2608: { img: 1290353, minX: 265, maxX: 885, minY: -802.5, maxY: 127.5 },
  2609: { img: 1290354, minX: 175, maxX: 940, minY: -113.75, maxY: 1033.75 },
  2610: { img: 1290355, minX: 980, maxX: 1755, minY: -581.25, maxY: 581.25 },
};
const BOSS_FLOOR = { "Nek'zali the Soulcoiler": 2606, 'The Twin Fangs': 2607, 'Entombed Sentinels': 2608, 'Vashnik the Malignant': 2608,
  'The Lost Explorers': 2609, Sszorak: 2609, 'The Coiled Altar': 2610, 'The Bargained Crown': 2610, "Ula'tek": 2610 };
// SVG <image> for the boss's floor map in map space (sx = x, sy = -y), or '' when there's no built-in map.
function arenaImg(boss, c) {
  const f = FLOORS[BOSS_FLOOR[boss]]; if (!f) return '';
  const wy = (f.maxY - f.minY) * 1024 / 1002, hy = (f.maxX - f.minX) * 768 / 668; // whole image, in yards
  const x = (-f.maxY - c.x0) * c.yd, y = (-f.maxX - c.y0) * c.yd;
  return '<image href="https://wow.zamimg.com/uploads/screenshots/normal/' + f.img + '.png" preserveAspectRatio="none" x="' + x + '" y="' + y + '" width="' + wy * c.yd + '" height="' + hy * c.yd + '" opacity="0.95"/>';
}

// ---- user map image: stored per boss in this browser, positioned in world yards ----
let MAPCTX = null, ALIGN = false;
function mapImg(boss) { try { return JSON.parse(store.get('wla-map-' + boss) || 'null'); } catch (e) { return null; } }
function saveMap(boss, m) { try { localStorage.setItem('wla-map-' + boss, JSON.stringify(m)); return true; } catch (e) { alert('Your browser ran out of storage for map images. Remove a map from another boss first.'); return false; } }
function imgAttrs(m, c) {
  c = c || MAPCTX; const w = m.w * c.yd, h = m.w * m.aspect * c.yd, x = (m.cx - c.x0) * c.yd - w / 2, y = (m.cy - c.y0) * c.yd - h / 2;
  return ' x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" transform="rotate(' + m.rot + ' ' + (x + w / 2) + ' ' + (y + h / 2) + ')"';
}
function placeImg(m) {
  const el = document.getElementById('userMap'); if (!el) return;
  const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'g'); tmp.innerHTML = '<image' + imgAttrs(m) + '/>';
  for (const a of ['x', 'y', 'width', 'height', 'transform']) el.setAttribute(a, tmp.firstChild.getAttribute(a));
  el.setAttribute('opacity', m.op);
}
function bindMap() {
  const c = MAPCTX; if (!c) return;
  const tip = $('#maptip'), box = document.querySelector('.mapbox');
  if (tip && box) box.querySelectorAll('[data-tip]').forEach((dot) => {
    dot.onmouseenter = () => { tip.innerHTML = MAPTIPS[+dot.dataset.tip] || ''; tip.style.display = 'block'; };
    dot.onmousemove = (e) => {
      const b = box.getBoundingClientRect(); let x = e.clientX - b.left + 14, y = e.clientY - b.top + 14;
      if (x + tip.offsetWidth > b.width) x = e.clientX - b.left - tip.offsetWidth - 14;
      if (y + tip.offsetHeight > b.height) y = e.clientY - b.top - tip.offsetHeight - 14;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    };
    dot.onmouseleave = () => (tip.style.display = 'none');
  });
  const boss = c.boss, svg = document.querySelector('svg.map'); const m = mapImg(boss);
  const add = $('#mAdd'), file = $('#mFile');
  if (add) add.onclick = () => file.click();
  if (file) file.onchange = () => {
    const f = file.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      const sc = Math.min(1, 1400 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
      cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      const nm = { src: cv.toDataURL('image/jpeg', 0.85), aspect: cv.height / cv.width, cx: c.x0 + c.W / c.yd / 2, cy: c.y0 + c.H / c.yd / 2, w: (c.W / c.yd) * 0.9, rot: 0, op: 0.75 };
      if (saveMap(boss, nm)) { ALIGN = true; kicks(); }
    };
    img.src = URL.createObjectURL(f);
  };
  if (!m || !svg || !$('#mAlign')) return; // built-in floor map shown instead
  const upd = () => placeImg(m), save = () => saveMap(boss, m);
  $('#mAlign').onclick = () => { ALIGN = !ALIGN; kicks(); };
  $('#mDel').onclick = () => { if (confirm('Remove the map image for ' + boss + '?')) { localStorage.removeItem('wla-map-' + boss); ALIGN = false; kicks(); } };
  $('#mOp').oninput = (e) => { m.op = +e.target.value; upd(); }; $('#mOp').onchange = save;
  if (!ALIGN) return;
  $('#mRot').oninput = (e) => { m.rot = +e.target.value; upd(); }; $('#mRot').onchange = save;
  $('#mSize').oninput = (e) => { m.w = +e.target.value; upd(); }; $('#mSize').onchange = save;
  svg.classList.add('aligning');
  const toYd = (dx) => dx * (c.W / svg.getBoundingClientRect().width) / c.yd;
  let drag = null;
  svg.onpointerdown = (e) => { drag = { x: e.clientX, y: e.clientY, cx: m.cx, cy: m.cy }; svg.setPointerCapture(e.pointerId); };
  svg.onpointermove = (e) => { if (!drag) return; m.cx = drag.cx + toYd(e.clientX - drag.x); m.cy = drag.cy + toYd(e.clientY - drag.y); upd(); };
  svg.onpointerup = () => { if (drag) { drag = null; save(); } };
  svg.onwheel = (e) => { e.preventDefault(); m.w = Math.max(10, m.w * (e.deltaY < 0 ? 1.04 : 1 / 1.04)); $('#mSize').value = Math.round(m.w); upd(); clearTimeout(svg._t); svg._t = setTimeout(save, 300); };
}

function kicks() {
  const r = S.rep, ks = r.kicks || [], ms = r.missedKicks || [];
  const landed = ks.reduce((s, k) => s + k.kicked, 0), missed = ks.reduce((s, k) => s + k.missed, 0);
  const pmap = new Map(players().map((p) => [p.name, p]));
  if (S.miss == null || S.miss >= ms.length) S.miss = 0;
  const views = [['missed', 'Missed casts', missed], ['adds', 'By add', (r.kickUnits || []).length], ['players', 'By player', new Set(r.interrupts.map((k) => k.player)).size], ['spells', 'By spell', ks.length]];
  if (!S.kview || (S.kview === 'missed' && !missed)) S.kview = missed ? 'missed' : 'players';
  const rate = landed + missed ? Math.round(100 * landed / (landed + missed)) : null;
  let h = '<div class="tiles">' +
    '<div class="tile"><div class="l">Kick rate</div><div class="v" style="color:' + (rate == null ? 'inherit' : rate >= 90 ? '#7ee08f' : rate >= 75 ? '#f3c06a' : '#ff8f87') + '">' + (rate == null ? 'n/a' : rate + '%') + '</div><div class="s">of kickable enemy casts</div></div>' +
    tile('Interrupts landed', landed, 'by ' + new Set(r.interrupts.map((k) => k.player)).size + ' players') +
    tile('Casts that got off', missed, missed ? 'from ' + new Set(ms.map((m) => m.guid)).size + ' different adds' : 'clean') + '</div>' +
    '<details class="howto"><summary>How kickable casts are found</summary>A spell counts as kickable once anyone interrupts it on this pull, or when the boss rules list it. A spell nobody ever kicked can\'t be spotted from the log alone.</details>' +
    '<div class="seg" role="tablist">' + views.map(([k, l, n]) => '<button class="' + (S.kview === k ? 'on' : '') + '" data-v="' + k + '">' + l + ' <span class="n' + (k === 'missed' && n ? ' bad' : '') + '">' + n + '</span></button>').join('') + '</div>';
  if (!ks.length) h += '<div class="panel"><p class="muted" style="margin:0">No interrupts happened on this pull.</p></div>';
  else if (S.kview === 'missed') {
    h += missed ? '<div class="kgrid"><div class="panel klist"><h3>Missed casts <small>click one to see the map</small></h3>' + missedList(r, pmap) + '</div>' + mapPanel(r, ms[S.miss], pmap) + '</div>'
      : '<div class="panel"><p class="muted" style="margin:0">Every kickable cast was interrupted. Clean.</p></div>';
  } else if (S.kview === 'adds') {
    h += '<div class="panel"><h3>By add <small>every enemy that cast something kickable, worst first</small></h3>' + byAddTable(r, pmap) + '</div>';
  } else if (S.kview === 'players') {
    const byP = new Map();
    for (const k of r.interrupts) { let x = byP.get(k.player); if (!x) byP.set(k.player, x = { n: 0, by: k.by, byId: k.byId, spells: new Map(), adds: new Set() }); x.n++; x.spells.set(k.spell, (x.spells.get(k.spell) || 0) + 1); x.adds.add(k.target); }
    const mx = Math.max(1, ...[...byP.values()].map((x) => x.n));
    h += '<div class="panel"><h3>By player <small>interrupts landed</small></h3>' + [...byP].sort((a, b) => b[1].n - a[1].n).map(([n, x]) => {
      const p = pmap.get(n) || { name: n, color: '#9aa0ac' };
      return '<div class="drow">' + avatar(p, true) + '<div style="flex:1;min-width:0"><div class="line1"><span><span class="nm" style="color:' + p.color + '">' + esc(n) + '</span> <span class="sub">' + spell(x.byId, x.by) + '</span></span><span class="val">' + x.n + '</span></div>' +
        '<div class="bar"><div style="width:' + (100 * x.n / mx) + '%;background:' + p.color + '"></div></div><div class="sub">' + esc([...x.spells].map(([s, c]) => s + ' ' + c).join(', ')) + ', on ' + x.adds.size + (x.adds.size === 1 ? ' add' : ' adds') + '</div></div></div>';
    }).join('') + '</div>';
  } else {
    h += '<div class="panel"><h3>By spell <small>kicked (green) vs got off (red)</small></h3>' + ks.map((k) => {
      const tot = k.kicked + k.missed;
      return '<div class="drow"><div style="flex:1;min-width:0"><div class="line1"><span>' + spell(k.id, k.name) + '</span><span class="val">' + k.kicked + ' of ' + tot + ' kicked</span></div>' +
        '<div class="bar"><div style="width:' + (100 * k.kicked / tot) + '%;background:var(--good)"></div><div style="width:' + (100 * k.missed / tot) + '%;background:var(--bad)"></div></div>' +
        '<div class="sub">' + (k.missed ? 'Got off at ' + k.missedAt.map((m) => T(m.t)).join(', ') : 'Never got off') + '</div></div></div>';
    }).join('') + '</div>';
  }
  // inside the Fight audit when the fight has one, otherwise its own tab
  const host = $('#kickBox') || $('#view');
  host.innerHTML = h;
  host.querySelectorAll('.seg button').forEach((b) => (b.onclick = () => { S.kview = b.dataset.v; kicks(); refreshIcons(); }));
  host.querySelectorAll('.mrowm').forEach((el) => (el.onclick = () => { S.miss = +el.dataset.mi; kicks(); refreshIcons(); }));
  bindMap();
}

// ---------- meters ----------
// ---------- Performance: damage, healing, damage taken and utility, for one pull ----------
// A switch on top (Damage, Healing, Damage taken, Utility), tiles for the raid, a timeline of the raid's output (or the
// picked player's) with the phases shaded and the boss mechanics, Bloodlust and deaths marked, then a bar per player.
// A click on a player draws their line and shows what their damage went into (targets and abilities). Everything counts
// up to the wipe filter; "while alive" divides by the time until a player's first death.
const PERF_KINDS = [['dmg', 'Damage'], ['heal', 'Healing'], ['taken', 'Damage taken'], ['util', 'Utility'], ['surv', 'Survivability']];
// (the two views that count presses, not output over time: no phase picker and no chart)
const PERF_COUNTS = new Set(['util', 'surv']);
// Each spec's big damage and healing cooldowns, by the name the log uses, with their base cooldown in seconds. Many were
// read off a Midnight log (2026-10-15); the rest are the usual ones and may be off by a talent. A cooldown is only judged
// for a player who cast it at least once that night, so an untalented one is never "never used"; cooldown-reduction
// talents can make "possible uses" a little low (uses above it count as full).
const PERF_CDS = {
  'Blood Death Knight': [['Dancing Rune Weapon', 120]], 'Frost Death Knight': [['Pillar of Frost', 60], ['Empower Rune Weapon', 120], ["Frostwyrm's Fury", 90]],
  'Unholy Death Knight': [['Army of the Dead', 180], ['Summon Gargoyle', 180], ['Unholy Assault', 90]],
  'Havoc Demon Hunter': [['Metamorphosis', 180], ['The Hunt', 90]], 'Vengeance Demon Hunter': [['Metamorphosis', 180], ['Fel Devastation', 40]],
  'Balance Druid': [['Incarnation: Chosen of Elune', 180], ['Celestial Alignment', 180], ['Convoke the Spirits', 120], ['Force of Nature', 60]],
  'Feral Druid': [['Incarnation: Avatar of Ashamane', 180], ['Berserk', 180], ['Convoke the Spirits', 120]], 'Guardian Druid': [['Incarnation: Guardian of Ursoc', 180], ['Berserk', 180]],
  'Restoration Druid': [['Tranquility', 180], ['Incarnation: Tree of Life', 180], ['Convoke the Spirits', 120], ['Flourish', 90]],
  'Devastation Evoker': [['Dragonrage', 120], ['Deep Breath', 120]], 'Preservation Evoker': [['Rewind', 240], ['Dream Flight', 120], ['Emerald Communion', 180], ['Tip the Scales', 120]],
  'Augmentation Evoker': [['Breath of Eons', 120], ['Tip the Scales', 120]],
  'Beast Mastery Hunter': [['Bestial Wrath', 90], ['Call of the Wild', 120], ['Bloodshed', 60]], 'Marksmanship Hunter': [['Trueshot', 120], ['Volley', 45]], 'Survival Hunter': [['Coordinated Assault', 120], ['Spearhead', 90]],
  'Arcane Mage': [['Arcane Surge', 90], ['Touch of the Magi', 45]], 'Fire Mage': [['Combustion', 120]], 'Frost Mage': [['Icy Veins', 120], ['Frozen Orb', 60]],
  'Brewmaster Monk': [['Invoke Niuzao, the Black Ox', 120]], 'Mistweaver Monk': [['Restoral', 180], ['Revival', 180], ["Invoke Yu'lon, the Jade Serpent", 120], ['Invoke Chi-Ji, the Red Crane', 120], ['Celestial Conduit', 90]],
  'Windwalker Monk': [['Storm, Earth, and Fire', 90], ['Invoke Xuen, the White Tiger', 120], ['Celestial Conduit', 90]],
  'Holy Paladin': [['Avenging Wrath', 120], ['Aura Mastery', 180], ['Divine Toll', 60]], 'Protection Paladin': [['Avenging Wrath', 120], ['Sentinel', 120]],
  'Retribution Paladin': [['Avenging Wrath', 120], ['Crusade', 120], ['Divine Toll', 60], ['Execution Sentence', 60], ['Final Reckoning', 60]],
  'Discipline Priest': [['Power Word: Barrier', 180], ['Rapture', 90], ['Evangelism', 90], ['Power Infusion', 120]], 'Holy Priest': [['Divine Hymn', 180], ['Apotheosis', 120], ['Holy Word: Salvation', 360], ['Power Infusion', 120]],
  'Shadow Priest': [['Voidform', 120], ['Dark Ascension', 60], ['Power Infusion', 120]],
  'Assassination Rogue': [['Deathmark', 120], ['Kingsbane', 60]], 'Outlaw Rogue': [['Adrenaline Rush', 180], ['Killing Spree', 90]], 'Subtlety Rogue': [['Shadow Blades', 120], ['Flagellation', 90]],
  'Elemental Shaman': [['Ascendance', 180], ['Stormkeeper', 60], ['Fire Elemental', 150], ['Storm Elemental', 150]], 'Enhancement Shaman': [['Feral Spirit', 90], ['Ascendance', 180], ['Doom Winds', 90]],
  'Restoration Shaman': [['Healing Tide Totem', 180], ['Spirit Link Totem', 180], ['Ascendance', 180]],
  'Affliction Warlock': [['Summon Darkglare', 120], ['Malevolence', 60]], 'Demonology Warlock': [['Summon Demonic Tyrant', 90], ['Grimoire: Imp Lord', 120], ['Grimoire: Felguard', 120]],
  'Destruction Warlock': [['Summon Infernal', 180], ['Malevolence', 60]],
  'Arms Warrior': [['Avatar', 90], ['Bladestorm', 90]], 'Fury Warrior': [['Recklessness', 90], ['Avatar', 90], ['Bladestorm', 90]], 'Protection Warrior': [['Avatar', 90]],
};
// The big cooldowns a player has (cast at least once this night), and how each was used up to t1 (their death or the
// wipe filter): uses against possible uses, how long it sat ready, and whether a use lined up with Bloodlust.
// (a spell the player has: cast this pull, or in any pull of this boss read so far)
function castOnBoss(r, p, n) { if ((p.byName.get(n.toLowerCase()) || []).length) return true; for (const q of CACHE.values()) { if (!q || !q.item || q.item.boss !== r.item.boss) continue; for (const x of q.players.values()) if (x.name === p.name && (x.byName.get(n.toLowerCase()) || []).length) return true; } return false; }
// A player's personal defensives up to t1, for the Damage taken view: the class list (talented ones only once they've
// been cast on this boss), each with its presses and how many it could have had
function bigDefs(r, p, t1) {
  const rep = E.DEF_REPLACED || {};
  const list = ((E.DEFENSIVES && p.cls && E.DEFENSIVES[p.cls]) || []).filter(([n, , , specs, baseline]) => (!specs || specs.includes(p.specId)) && (baseline || castOnBoss(r, p, n)) && !(rep[n.toLowerCase()] && castOnBoss(r, p, rep[n.toLowerCase()])));
  return list.map(([name, id0, cd]) => {
    const ts = (p.byName.get(name.toLowerCase()) || []).filter((t) => t <= t1 + 0.05).sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 2);
    const poss = 1 + Math.floor(Math.max(0, t1 - 1) / cd);
    return { name, id: (p.castAb.get(name) || {}).id || id0, cd, ts, used: Math.min(ts.length, poss), poss };
  });
}
function bigCds(r, p, t1, lust) {
  const list = PERF_CDS[p.specName] || [], out = [];
  const seen = (n) => castOnBoss(r, p, n);
  for (const [name, cd] of list) {
    if (!seen(name)) continue;
    const ts = (p.byName.get(name.toLowerCase()) || []).filter((t) => t <= t1 + 0.05).sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 2); // (one press, even if the log has a cast per tick)
    // (more presses than the listed cooldown allows means talents shortened it: then every press was possible)
    const poss = Math.max(ts.length, 1 + Math.floor(Math.max(0, t1 - 1) / cd)), used = Math.min(ts.length, poss);
    // (how long it sat ready in all, and its longest single stretch: { s: when it came ready, len })
    let idle = 0, hold = { s: 0, len: 0 };
    const sat = (s, e) => { const len = Math.max(0, e - s); idle += len; if (len > hold.len) hold = { s, len }; };
    if (!ts.length) sat(0, t1); else { sat(0, ts[0]); for (let i = 1; i < ts.length; i++) sat(ts[i - 1] + cd, ts[i]); sat(ts[ts.length - 1] + cd, t1); }
    const withLust = lust != null && lust <= t1 ? ts.some((t) => t >= lust - 3 && t <= lust + 40) : null;
    const id = (p.castAb.get(name) || {}).id || E.SPELLID.get(name.toLowerCase()) || 0;
    out.push({ name, id, cd, ts, used, poss, idle, hold, withLust, st: used / poss >= 0.85 ? 'ok' : used / poss >= 0.6 ? 'warn' : 'bad' });
  }
  return out;
}
const LUST_N = ['bloodlust', 'heroism', 'time warp', 'fury of the aspects', 'primal rage', "harrier's cry"];
const BRES_N = ['rebirth', 'raise ally', 'intercession', 'soulstone'];
const EXT_N = ['pain suppression', 'guardian spirit', 'ironbark', 'life cocoon', 'blessing of sacrifice', 'blessing of protection', 'blessing of spellwarding', 'time dilation', 'rescue'];
// the four views, as switches that carry their headline number (over what's counted: up to the wipe filter, in the
// picked phase)
const PERF_ICON = { dmg: 'ability_warrior_innerrage', heal: 'spell_holy_flashheal', taken: 'spell_shadow_shadowfury', util: 'ability_kick', surv: 'warlock_-healthstone' };
const PERF_COL = { dmg: '#6aa8ff', heal: '#45c15c', taken: '#e5534b' };
// (only the view you're on carries its numbers: the others are just their name, so the tiles under it read first)
function perfTabs(kind, vals) {
  return '<div class="pfk" role="tablist" aria-label="What to show">' + PERF_KINDS.map(([k, l]) => { const v = vals[k] || {}, on = k === kind;
    return '<button class="pfk-b k-' + k + (on ? ' on' : '') + '" role="tab" aria-selected="' + on + '" data-k="' + k + '" type="button"><img class="pfk-i" src="' + whIcon(PERF_ICON[k]) + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
      '<span class="pfk-t"><span class="pfk-l">' + l + '</span>' + (on ? '<span class="pfk-v">' + (v.v || '—') + '</span><span class="pfk-s">' + (v.s || '') + '</span>' : '') + '</span></button>'; }).join('') + '</div>';
}
// a phase by its short name (P1, P2, Intermission, P3); the chips: the whole pull, or one phase
const pfPhK = (q) => q.name.split(' ')[0];
function phaseChips(keys, sel) {
  return keys.length > 1 ? '<div class="seg pfph" role="tablist" aria-label="Phase"><button data-ph=""' + (!sel ? ' class="on"' : '') + '>Whole pull</button>' + keys.map((k) => '<button data-ph="' + esc(k) + '"' + (k === sel ? ' class="on"' : '') + '>' + esc(k) + '</button>').join('') + '</div>' : '';
}
// the role chips over the player bars: everyone, or one role (ranks count within it)
// (a view can start on one role, e.g. Damage windows on DPS; picking All keeps all)
const roleCur = (has, def) => (S.perfRole === 'all' ? 'all' : S.perfRole && has.has(S.perfRole) ? S.perfRole : def && has.has(def) ? def : 'all');
function roleChips(has, def) {
  if (has.size < 2) return '';
  const cur = roleCur(has, def);
  return '<div class="seg pf-rf" role="tablist" aria-label="Role">' + [['all', 'All'], ['dps', 'DPS'], ['healer', 'Healers'], ['tank', 'Tanks']].filter(([k]) => k === 'all' || has.has(k)).map(([k, l]) => '<button data-r="' + k + '"' + (k === cur ? ' class="on"' : '') + '>' + l + '</button>').join('') + '</div>';
}
const resses = (n) => n + (n === 1 ? ' battle res' : ' battle resses');
const utilHead = (cats) => { const t = (k) => (cats.find((c) => c.key === k) || { rows: [] }).rows.reduce((s, x) => s + x.n, 0);
  return { v: t('kick') + '<span> kicks</span> ' + t('disp') + '<span> dispels</span>', s: plural(t('ext'), 'external') + ' · ' + resses(t('bres')) }; };
function perf() {
  const r = S.rep, kind = S.perfKind || 'dmg', ct = cutT(r), end = Math.max(1, Math.min(r.duration, ct)), cut = isFinite(ct) && ct < r.duration;
  const ps = players().filter((p) => p.name && !/^Player-/.test(p.name));
  // (one pull or all pulls of the boss, switched here like on the Player audit)
  const isBoss = r.item.kind === 'boss' && !r.item.run, nP = isBoss && S.index ? S.index.bosses.filter((b) => b.id === r.item.id && b.diffId === r.item.diffId).length : 0;
  const scopeSw = isBoss ? '<div class="seg plsw" role="tablist" aria-label="Pulls shown"><button data-v="all"' + (S.scope === 'all' ? ' class="on"' : '') + '>All pulls<span class="n">' + nP + '</span></button><button data-v="pull"' + (S.scope === 'all' ? '' : ' class="on"') + '>Pull #' + r.item.pull + '<span class="n">' + (r.item.kill ? 'kill' : 'wipe') + '</span></button></div>' : '';
  if (isBoss && S.scope === 'all') { perfNight(r, kind, scopeSw); return; }
  // the window: the whole pull or the picked phase, each up to the wipe filter
  const phs = ((r.module && !r.module.error && r.module.phases) || []).filter((q) => q.start < end - 1);
  const ph = S.perfPh ? phs.find((q) => pfPhK(q) === S.perfPh) || null : null;
  const w0 = ph ? ph.start : 0, w1 = ph ? Math.min(isFinite(ph.end) ? ph.end : end, end) : end, wl = Math.max(1, w1 - w0);
  const sumWin = (arr) => { let s = 0; for (let i = Math.max(0, Math.floor(w0)); i < Math.min(arr.length, Math.ceil(w1)); i++) s += arr[i] || 0; return s; };
  const firstDeath = (p) => { const d = r.deaths.filter((x) => x.guid === p.guid && x.t <= end + 0.05).map((x) => x.t); return d.length ? Math.min(...d) : null; };
  const inWin = (t) => t != null && t >= w0 && t <= w1;
  const bossN = new Set(r.bossUnits || []), KEY = { dmg: 'dmgS', heal: 'healS', taken: 'takenS' };
  // (per player: their total in the window, seconds alive in it (a battle res gives time back) and their rate while alive)
  const rowsOf = (k) => ps.map((p) => { const tot = sumWin(p[KEY[k]] || []), al = aliveSecs(r, p, w0, w1); return { p, tot, al, alive: al >= 1 ? tot / al : 0, died: firstDeath(p), back: deadSpans(r, p).some(([a, b]) => inWin(a) && b <= w1), over: p.healing + p.overheal ? p.overheal / (p.healing + p.overheal) : 0, avoidShare: p.taken ? Math.min(1, p.avoidable / p.taken) : 0 }; })
    .filter((x) => x.tot > 0).sort((a, b) => b.tot - a.tot);
  const sumOf = (rows) => rows.reduce((s, x) => s + x.tot, 0);
  const R3 = { dmg: rowsOf('dmg'), heal: rowsOf('heal'), taken: rowsOf('taken') }, inPh = ph ? ' in ' + esc(pfPhK(ph)) : ' in total';
  const ucats = utilCats([r]), scats = survCats([r]), oh = (() => { const h2 = ps.reduce((s, p) => s + p.healing, 0), o2 = ps.reduce((s, p) => s + p.overheal, 0); return h2 + o2 ? o2 / (h2 + o2) : 0; })();
  const vals = { dmg: { v: C(sumOf(R3.dmg) / wl) + '<span>/s</span>', s: C(sumOf(R3.dmg)) + inPh }, heal: { v: C(sumOf(R3.heal) / wl) + '<span>/s</span>', s: C(sumOf(R3.heal)) + inPh + ' · ' + Math.round(100 * oh) + '% overheal' },
    taken: { v: C(sumOf(R3.taken) / wl) + '<span>/s</span>', s: C(sumOf(R3.taken)) + inPh }, util: utilHead(ucats), surv: survHead(scats) };
  const counts = PERF_COUNTS.has(kind);
  const cutLine = '<div class="cutbar' + (cut ? ' on' : '') + '"><span class="cutnow">' + (ph && !counts ? '<b>' + esc(ph.name) + '</b>, ' + T(w0) + '–' + T(w1) + (cut && w1 >= end - 0.5 ? ' (the wipe filter)' : '') : cut ? 'Counted up to <b>' + T(ct) + '</b>, the wipe filter' : r.item.kill ? '<b>Kill</b>: the whole pull counts' : 'The whole pull counts') + '</span></div>';
  // (one row on top: the kinds, then the pull / phase switches and the wipe filter line)
  let h = '<div class="pfv"><div class="pf-head">' + perfTabs(kind, vals) + '<div class="pf-top">' + scopeSw + (!counts ? phaseChips(phs.map(pfPhK), ph ? pfPhK(ph) : null) : '') + cutLine + '</div></div>';
  if (counts) { view(h + (kind === 'surv' ? utilCards(scats, true, 'surv') : utilCards(ucats, true)) + '</div>'); bindPerf(); refreshIcons(); return; }
  const rowsAll = R3[kind], total = sumOf(rowsAll), key = KEY[kind];
  const raidS = []; for (const x of rowsAll) (x.p[key] || []).forEach((v, i) => { if (i < end) raidS[i] = (raidS[i] || 0) + v; });
  if (!S.perfSel || !rowsAll.some((x) => x.p.name === S.perfSel)) S.perfSel = null;
  const sel = S.perfSel ? rowsAll.find((x) => x.p.name === S.perfSel) : null;
  // (Damage done can show only the damage on the boss (when some went elsewhere), or only the damage into the adds that
  // have to die (when the fight has any): a switch on the bars, and the chart follows it)
  const AD = kind === 'dmg' ? addsDamage(r, ps, w0, w1, bossN) : null, BD = kind === 'dmg' ? tgtDamage(ps, w0, w1, (n) => bossN.has(n)) : null, allT = kind === 'dmg' ? tgtDamage(ps, w0, w1, () => true).total : 0;
  const canAdds = !!(AD && AD.prio.size), canBoss = !!(BD && BD.total > 0 && BD.total < 0.99 * allT);
  const tgt = S.perfTgt === 'adds' && canAdds ? 'adds' : S.perfTgt === 'boss' && canBoss ? 'boss' : 'all', addsOn = tgt === 'adds', bossOn = tgt === 'boss';
  const onBossW = bossN.size > 1 ? 'on the bosses' : 'on the boss';
  // ---- the raid at a glance (in the window) ----
  // (Damage and Healing: what the dead would have done, and one role's big cooldown uses; the share on the boss, active
  // time and Healing's old tiles were dropped: the target switch shows the first, and the rest said little)
  // lost to deaths: what each player of the role would have done at their own rate, for the time they were dead here
  const lostTile = (role, what) => { const rs = role ? rowsAll.filter((x) => (x.p.role || 'dps') === role) : rowsAll, tot = rs.reduce((s, x) => s + x.tot, 0);
    const lost = rs.reduce((s, x) => s + (x.al > 0 ? x.alive * Math.max(0, wl - x.al) : 0), 0), lf = lost / Math.max(1, tot + lost);
    return plTile(plIco('inv_misc_bone_humanskull_01'), 'Lost to deaths', !tot ? '—' : lost && lf < 0.01 ? '<1<span>%</span>' : Math.round(100 * lf) + '<span>%</span>', lf > 0.1 ? 'bad' : lf >= 0.03 ? 'warn' : 'ok', lost >= 1 ? 'about ' + C(lost) + ' ' + what : 'nobody was dead here'); };
  // big cooldowns: the role's uses against their possible uses, each up to their death or the wipe filter
  const cdTile = (role, who) => { const pc = perfContext(r), low = []; let used = 0, poss = 0;
    for (const x of rowsAll) { if ((x.p.role || 'dps') !== role) continue; const xp = pc.per.get(x.p.name), cds = bigCds(r, x.p, xp ? Math.min(xp.until, pc.end) : pc.end, pc.lust);
      const u = cds.reduce((s, c) => s + c.used, 0), q = cds.reduce((s, c) => s + c.poss, 0); used += u; poss += q; if (q && u / q < 0.8) low.push(x.p.name); }
    const cu = poss ? used / poss : null;
    return plTile(plIco('spell_holy_borrowedtime'), 'Big cooldowns', cu == null ? '—' : Math.round(100 * cu) + '<span>% of possible uses</span>', cu == null ? 'na' : cu >= 0.85 && !low.length ? 'ok' : cu >= 0.7 ? 'warn' : 'bad',
      cu == null ? 'none listed for these specs yet' : (low.length ? 'under 80%: ' + low.slice(0, 3).join(', ') + (low.length > 3 ? ' and ' + (low.length - 3) + ' more' : '') : 'every ' + who + ' at 80% or more') + (ph ? ' · whole pull' : '')); };
  let tiles;
  if (kind === 'dmg') tiles = [lostTile(null, 'the dead would have done'), cdTile('dps', 'DPS')];
  else if (kind === 'heal') tiles = [lostTile('healer', 'healing the dead healers would have done'), cdTile('healer', 'healer')];
  else {
    const avoid = ps.reduce((s, p) => s + p.avoidable, 0), allTaken = ps.reduce((s, p) => s + p.taken, 0), ds = keptDeaths(r).filter((d) => inWin(d.t)).length;
    const calls = ps.flatMap((p) => (p.closeCalls || []).filter((c) => inWin(c.tl))), open = calls.filter((c) => !c.def && !c.stone && !c.pot).length;
    tiles = [plTile(plIco('ability_rogue_feint'), 'Avoidable', allTaken ? Math.round(100 * avoid / allTaken) + '<span>%</span>' : '—', avoid / Math.max(1, allTaken) > 0.1 ? 'bad' : avoid ? 'warn' : 'ok', avoid ? C(avoid) + ' from the fight\'s avoidable rules · whole pull' : 'nothing avoidable logged'),
      plTile(plIco('spell_holy_ardentdefender'), 'Close calls', String(calls.length), open ? 'warn' : 'ok', calls.length ? (open ? open + ' with nothing pressed' : 'each one answered') + ' · under 30% and lived' : 'nobody dropped under 30%'),
      plTile(plIco('inv_misc_bone_humanskull_01'), 'Deaths', String(ds), ds ? 'bad' : 'ok', ds ? 'see Mechanics for each one' : 'nobody died here')];
  }
  // (the tiles sit beside the chart, below)
  const tilesH = tiles.length ? '<div class="pts pf-side n' + tiles.length + '">' + tiles.join('') + '</div>' : '';
  // ---- the fight's damage checks (Damage, whole pull): one line that opens to the list ----
  if (kind === 'dmg' && !ph) { const dc = damageChecks(r); if (dc.length) { const b = dc.filter((x) => x.st === 'bad').length, w = dc.filter((x) => x.st === 'warn').length, dst = b ? 'bad' : w ? 'warn' : 'ok';
    S.perfDcOpen = S.perfDcOpen || false;
    h += '<details class="panel probbox ' + dst + ' pf-dc"' + (S.perfDcOpen ? ' open' : '') + '><summary class="nh">Damage checks <small>the fight\'s shields and adds, up to the wipe filter</small>' + hst(dst, b ? plural(b, 'failed') : w ? w + ' close or late' : 'all ' + dc.length + ' passed') + '</summary>' +
      dc.map((x) => '<div class="pb-r ' + x.st + '"><span class="pb-i">' + { bad: '✕', warn: '!', ok: '✓' }[x.st] + '</span><span class="pb-t">' + x.html + '</span><span class="pb-w">' + x.when + '</span></div>').join('') + '</details>'; } }
  // ---- the timeline: the raid's line, or the picked player's (the picked phase stands out) ----
  const series = addsOn ? AD.series(sel ? sel.p : null, end) : bossOn ? BD.series(sel ? sel.p : null, end) : sel ? (sel.p[key] || []).slice(0, Math.ceil(end)) : raidS;
  const what = addsOn ? 'damage into adds' : bossOn ? 'damage ' + onBossW : { dmg: 'damage', heal: 'healing', taken: 'damage taken' }[kind];
  // (the legend doubles as switches: click one to hide or show those marks on the chart)
  const hk = (k) => ' class="pf-hk' + (S.pfcHide && S.pfcHide.has(k) ? ' off' : '') + '" data-hk="' + k + '" role="button" tabindex="0" title="Click to hide or show"';
  const lg = '<span class="pfc-lg"><span' + hk('m') + '><i class="lg-m"></i>boss mechanics</span><span' + hk('l') + '><i class="lg-l"></i>Bloodlust</span><span' + hk('d') + '><i class="lg-d"></i>deaths</span>' + (sel ? '<span' + hk('c') + '><i class="lg-c" style="background:' + sel.p.color + '"></i>' + (kind === 'taken' ? 'their defensives' : 'their big cooldowns') + '</span>' : '') + '</span>';
  h += '<div class="pf-chartrow' + (tilesH ? '' : ' solo') + '"><div class="panel pf-chart pf-main' + [...(S.pfcHide || [])].map((k) => ' hide-' + k).join('') + '"><h3 class="nh"><span class="pfc-ttl">' + (sel ? '<span class="nm" style="color:' + sel.p.color + '">' + esc(sel.p.name) + '</span> · ' + what + ' per second' : 'Raid ' + what + ' per second') + '</span><small>5-second average</small>' + lg +
    // (a picked player's casts fold under the chart: opening them by default pushed the list down every time a name was picked)
    (sel ? '<button class="btn sm' + (S.perfCasts ? ' on' : '') + '" id="pfCasts" type="button" aria-expanded="' + !!S.perfCasts + '">Their casts ' + (S.perfCasts ? '▾' : '▸') + '</button><button class="btn sm" id="pfRaid" type="button">Show the raid</button>' : '') + '</h3>' +
    perfChart(r, series, end, sel ? sel.p : null, ph ? [w0, w1] : null, kind, chartPx(!!tilesH)) + (sel && S.perfCasts ? castStrip(r, sel.p, kind) : '') + '</div>' + tilesH + '</div>';
  // ---- the views: Players (a bar per player and the picked one's breakdown), or the pull cut another way (Healing adds
  // its cooldowns and the healing after the raid's biggest hits) ----
  const wins = kind === 'dmg' ? perfWins(r, end).filter((w) => !ph || (w.t0 < w1 && w.t1 > w0)) : [];
  const cdsH = kind === 'heal' ? healCds(r, w0, w1) : '', hitsH = kind === 'heal' ? healAfterHits(r, w0, w1) : '';
  // (no Phases view: the phase buttons at the top already cut every view by phase; no Heatmap either, by request)
  const lenses = PERF_LENS.filter(([k]) => k === 'players' || (k === 'windows' && wins.length) || (k === 'targets' && kind === 'dmg') || (k === 'healers' && kind === 'heal') || (k === 'cds' && cdsH) || (k === 'hits' && hitsH));
  const lens = lenses.some(([k]) => k === S.perfLens) ? S.perfLens : 'players';
  if (lenses.length > 1) h += lensBar(lenses, lens);
  if (lens !== 'players') {
    h += lens === 'phases' ? perfPhases(r, kind, ps, end, phs, ph ? pfPhK(ph) : null) : lens === 'windows' ? perfWindows(r, ps, end, wins) : lens === 'targets' ? perfTargets(r, ps, w0, w1, bossN) : lens === 'healers' ? perfHealers(r, ps, w0, w1, end)
      : lens === 'cds' ? cdsH : hitsH;
    view(h + '</div>'); bindPerf(); refreshIcons(); return;
  }
  // (the Warcraft Logs parse is the player's own for the pull, so it stays whichever targets are shown)
  const prs = parsesFor(r, kind);
  const tgtB = (k, l) => '<button data-tg="' + k + '"' + (tgt === k ? ' class="on"' : '') + '>' + l + '</button>';
  const tgtSw = canAdds || canBoss ? '<div class="seg pf-tg" role="tablist" aria-label="Targets">' + (canBoss ? tgtB('boss', bossN.size > 1 ? 'Bosses' : 'Boss') : '') + tgtB('all', 'All targets') + (canAdds ? tgtB('adds', 'On adds') : '') + '</div>' : '';
  // (boss or adds: each player's damage into them; the adds as a total, since they're only up part of the pull)
  const TD = addsOn ? AD : bossOn ? BD : null;
  const rowsB = TD ? rowsAll.map((x) => ({ ...x, all: x.tot, tot: TD.per.get(x.p.name) || 0 })).filter((x) => x.tot > 0).sort((a, b) => b.tot - a.tot) : rowsAll, totB = TD ? TD.total : total;
  const has = new Set(rowsB.map((x) => x.p.role || 'dps')), rc = roleCur(has), rows = rowsB.filter((x) => rc === 'all' || (x.p.role || 'dps') === rc), max = rows.length ? rows[0].tot : 1;
  const pc0 = (v) => (v < 0.01 ? '<1' : Math.round(100 * v)) + '%', pc1 = (v) => (v < 0.01 ? '<1' : (100 * v).toFixed(v >= 0.1 ? 0 : 1)) + '%';
  const rowCls = prs ? ' pf-pr' : '';
  const bars = rows.map((x, i) => { const on = sel && sel.p === x.p;
    // (healing: overhealing is the faded end of the bar; damage taken: the avoidable part in red)
    const segs = kind === 'taken' && x.avoidShare > 0.005 ? [[Math.max(0.5, 100 * x.tot * (1 - x.avoidShare) / max), 'm'], [100 * x.tot * x.avoidShare / max, 'ad']]
      : [[Math.max(1, 100 * x.tot / max), 'm']].concat(kind === 'heal' && x.over ? [[Math.min(100, 100 * x.tot * x.over / (1 - x.over) / max), 'oh']] : []);
    // (the small column is one thing per view, named over it: overhealing on Healing, the avoidable share on Damage
    // taken, otherwise their share of the raid's damage on those targets)
    const sub = kind === 'heal' ? pc0(x.over) : kind === 'taken' ? (x.avoidShare >= 0.005 ? pc0(x.avoidShare) : '—')
      : addsOn ? '<span title="' + esc(pc0(x.all ? x.tot / x.all : 0) + ' of their own damage went into adds') + '">' + pc1(totB ? x.tot / totB : 0) + '</span>' : pc1(totB ? x.tot / totB : 0);
    // (a death: when, and their rate while alive, on hover)
    const dTip = inWin(x.died) ? 'died at ' + T(x.died) + (x.back ? ', brought back' : '') + (!addsOn && x.al >= 1 ? ' · ' + C(x.tot / x.al) + ' per second while alive' : '') : '';
    return cbRow({ tag: 'button', cls: (on ? ' on' : '') + rowCls, attrs: ' type="button" data-n="' + esc(x.p.name) + '" aria-pressed="' + !!on + '"', k: i + 1, p: x.p, segs, v: addsOn ? C(x.tot) : C(x.tot / wl), sub,
      // (a parse only where it means something: damage for tanks and DPS, healing for healers)
      end: prs ? ((kind === 'heal') === (x.p.role === 'healer') ? prsChip(prs.get(x.p.name)) : '') : null,
      chips: dTip ? '<span class="pf-d" title="' + esc(dTip) + '">✕ ' + T(x.died) + (x.back ? ' ↻' : '') + '</span>' : '' }); }).join('');
  const span = ph ? esc(pfPhK(ph)) + ' (' + T(wl) + ')' : T(end);
  const head = cbHead(addsOn ? 'Damage' : { dmg: 'DPS', heal: 'HPS', taken: 'Per sec' }[kind], { heal: 'Overheal', taken: 'Avoidable' }[kind] || 'Share', prs ? 'Parse' : '', rowCls);
  const ttl = addsOn ? 'Damage into adds' : bossOn ? 'Damage ' + onBossW : { dmg: 'Damage done', heal: 'Healing done', taken: 'Damage taken' }[kind];
  h += '<div class="pf-cols"><div class="panel pf-bars"><h3 class="nh"><span>' + ttl + '</span><small>' + (addsOn ? 'total over ' + span + ' · ' + esc(AD.label) : 'per second over ' + span) + (kind === 'taken' ? ' · avoidable in red' : kind === 'heal' ? ' · overhealing faded' : '') + '</small>' + tgtSw + roleChips(has) + '</h3>' + (bars ? head + bars : '<p class="muted">Nothing recorded.</p>') + '</div>' +
    '<div class="panel pf-det">' + (addsOn && !sel ? AD.panel() : perfDetail(r, kind, sel ? sel.p : null, bossN, rowsAll)) + '</div></div>';
  view(h + '</div>');
  bindPerf();
  refreshIcons();
}
// Healing after the big hits: the window's five biggest moments of raid damage (3 seconds each, at least 10 seconds
// apart), what hit the raid then, and what each healer healed in the 11 seconds from its start (a stacked bar in their
// colours, the biggest first)
function healAfterHits(r, w0, w1) {
  const ts = r.takenS || [], W3 = 3, sums = [];
  for (let i = Math.max(0, Math.floor(w0)); i <= Math.min(ts.length, Math.ceil(w1)) - W3; i++) { let s = 0; for (let j = 0; j < W3; j++) s += ts[i + j] || 0; sums.push([i, s]); }
  sums.sort((a, b) => b[1] - a[1]); const picks = []; for (const x of sums) { if (picks.length >= 5) break; if (picks.some(([j]) => Math.abs(j - x[0]) < 10)) continue; picks.push(x); }
  if (!picks.length) return '';
  picks.sort((a, b) => a[0] - b[0]);
  const healers = [...r.players.values()].filter((p) => p.role === 'healer' && p.name && !/^Player-/.test(p.name)), marks = (r.module && !r.module.error && r.module.marks) || [];
  // (what hit: the two biggest spells on the raid in those 3 seconds; older pulls without that fall back to the boss
  // mechanic that landed)
  const hitBy = (i) => { const m = new Map(); for (let k = i; k < i + W3; k++) { const o = (r.takenAbS || [])[k]; if (o) for (const n in o) { const x = m.get(n) || [o[n][0], 0]; x[1] += o[n][1]; m.set(n, x); } } return [...m].sort((a, b) => b[1][1] - a[1][1]).slice(0, 2); };
  const rowsH = picks.map(([i, s]) => {
    const top = hitBy(i), near = [...new Set(marks.filter((m) => Math.abs((m.land != null ? m.land : m.t) - (i + 1.5)) <= 3).map((m) => m.label))];
    const what = top.length ? top.map(([n, [id, v]]) => '<span class="hah-s">' + spell(id, n) + ' <span class="sub">' + C(v) + '</span></span>').join('') : near.map((n) => '<span class="hah-s">' + mech(n) + '</span>').join('');
    const by = healers.map((p) => { let v = 0; for (let k = i; k < i + W3 + 8; k++) v += (p.healS || [])[k] || 0; return [p, v]; }).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]), tot = by.reduce((a, [, v]) => a + v, 0);
    return '<div class="hah-r"><div class="hah-w"><b>' + T(i) + '</b><span class="hah-m">' + (what || '<span class="sub">raid damage</span>') + '</span></div>' +
      '<div class="hah-mid"><div class="hah-bar">' + by.map(([p, v]) => '<i style="width:' + (100 * v / Math.max(1, tot)).toFixed(1) + '%;background:' + p.color + '" title="' + esc(p.name + ': ' + C(v)) + '"></i>').join('') + '</div>' +
      '<div class="hah-c">' + by.map(([p, v]) => '<span class="hah-p"><span class="nm" style="color:' + p.color + '">' + esc(p.name) + '</span> <b>' + C(v) + '</b> <span class="sub">' + Math.round(100 * v / Math.max(1, tot)) + '%</span></span>').join('') + '</div></div>' +
      '<div class="hah-n"><span><b>' + C(s) + '</b> taken in 3s</span><span><b>' + C(tot) + '</b> healed in the next 11s</span></div></div>';
  });
  return '<div class="panel pf-hah"><h3 class="nh"><span>Healing after the big hits</span><small>the five biggest moments of raid damage, and the 11 seconds after</small></h3>' + rowsH.join('') + '<details class="howit"><summary>How it works</summary><div>The five 3-second stretches with the most damage on the raid here (at least 10 seconds apart), the two spells that did most of it, and what each healer healed from the start of the hit to 8 seconds after it, as a bar in their colours. Overhealing isn\'t counted.</div></details></div>';
}
// Healing and raid cooldowns: every press of a major cooldown in the window (up to the wipe filter, or the picked phase),
// grouped by who pressed it (or in time order), with what it did:
//  heal  its own heals (overhealing shown, not counted), exact
//  dr    damage it took off (Aura Mastery, Power Word: Barrier, Anti-Magic Zone): an estimate from the reduction, since
//        the log only has what was left; both: Spirit Link Totem (that, plus the healing that evens out health)
//  av    damage Darkness made players avoid: logged as absorbs, exact
//  hp    health Rallying Cry added, and how many players dropped into it
//  amp   throughput cooldowns (Avenging Wrath, Apotheosis...) don't heal on their own: what the healer healed while it was
//        up, against their usual rate
// and what was hitting the raid while it was up.
const CD_AMP = { 'Holy Paladin': ['Avenging Wrath'], 'Holy Priest': ['Apotheosis'], 'Restoration Druid': ['Incarnation: Tree of Life'], 'Restoration Shaman': ['Ascendance'] };
const CD_LEN = { Tranquility: 8, 'Divine Hymn': 8, Revival: 2, Restoral: 2, 'Celestial Conduit': 4, "Invoke Yu'lon, the Jade Serpent": 25, 'Healing Tide Totem': 10, 'Spirit Link Totem': 6, Rewind: 5, 'Dream Flight': 6, 'Emerald Communion': 5, 'Vampiric Embrace': 12, 'Holy Word: Salvation': 2,
  'Aura Mastery': 8, 'Power Word: Barrier': 10, 'Anti-Magic Zone': 6, Darkness: 8, 'Rallying Cry': 10 };
const CD_KIND = { 'Aura Mastery': 'dr', 'Power Word: Barrier': 'dr', 'Anti-Magic Zone': 'dr', 'Spirit Link Totem': 'both', Darkness: 'av', 'Rallying Cry': 'hp' };
const CD_SHORT = { "Invoke Yu'lon, the Jade Serpent": "Invoke Yu'lon" };
function healCdRows(r, w0, w1) {
  const byG = new Map([...r.players.values()].map((p) => [p.guid, p])), rows = [];
  for (const u of r.cdUse || []) {
    if (u.t < w0 - 0.5 || u.t > w1) continue; const p = byG.get(u.g); if (!p || !p.name || /^Player-/.test(p.name)) continue;
    const kind = CD_KIND[u.cd] || 'heal', len = u.end != null ? Math.max(1, u.end - u.t) : CD_LEN[u.cd] || 6;
    if (kind === 'heal' && !u.heal && !u.over && u.late) continue;
    // (Rallying Cry: the players who dropped below their normal maximum while it was up, i.e. into the health it added)
    const dip = kind === 'hp' ? [...u.cov].filter((g) => ((r.php && r.php.get(g)) || []).some(([t, fr]) => t >= u.t && t <= u.t + len && fr < 1 / 1.1)).length : 0;
    rows.push({ p, cd: u.cd, id: u.id || E.SPELLID.get(u.cd.toLowerCase()) || 0, t: u.t, len, heal: u.heal, over: u.over, prev: u.prev, hp: u.hp || 0, dip, cov: u.cov.size, kind,
      v: kind === 'dr' || kind === 'av' ? u.prev : kind === 'both' ? u.prev + u.heal : kind === 'hp' ? u.hp || 0 : u.heal });
  }
  for (const p of r.players.values()) for (const n of CD_AMP[p.specName] || []) {
    const b = p.buffs && p.buffs.get(n); if (!b) continue;
    const press = p.byName.get(n.toLowerCase()) || []; // (only a press: talents proc short Ascendance and Tree of Life windows too)
    // (one line per cooldown: what they healed during all its presses here, against their usual rate)
    const ts = [], agg = { heal: 0, len: 0 };
    for (const [a, c] of b.sp) { if (a < w0 - 0.5 || a > w1 || !press.some((t) => Math.abs(t - a) <= 1.5)) continue; const e = Math.min(c, w1); ts.push(a); agg.len += Math.max(1, e - a); agg.heal += sumIn(p.healS || [], a, e); }
    if (ts.length) rows.push({ p, cd: n, id: b.id, t: ts[0], ts, len: agg.len, heal: agg.heal, kind: 'amp', v: agg.heal, rate: agg.heal / agg.len, avg: rateIn(r, p, p.healS || [], 0, w1) });
  }
  return rows.sort((a, b) => a.t - b.t);
}
// a rate against the player's usual, in words: "27% above their usual", "level with their usual"
const vsUsual = (v, avg) => { if (!avg) return ''; const d = (v - avg) / avg; return Math.abs(d) < 0.03 ? 'level with their usual' : Math.round(100 * Math.abs(d)) + '% ' + (d > 0 ? 'above' : 'below') + ' their usual'; };
function healCds(r, w0, w1) {
  const rows = healCdRows(r, w0, w1); if (!rows.length) return '';
  const byTime = S.hcdView === 'time', mx = Math.max(1, ...rows.filter((x) => x.kind !== 'amp').map((x) => x.v)), allHeal = [...r.players.values()].reduce((s, p) => s + sumIn(p.healS || [], w0, w1), 0);
  const healOf = (l) => l.filter((x) => x.kind === 'heal' || x.kind === 'both').reduce((s, x) => s + x.heal, 0), offOf = (l) => l.reduce((s, x) => s + (x.kind === 'dr' || x.kind === 'both' ? x.prev || 0 : 0), 0), avOf = (l) => l.reduce((s, x) => s + (x.kind === 'av' ? x.prev : 0), 0), hpOf = (l) => l.reduce((s, x) => s + (x.kind === 'hp' ? x.hp : 0), 0);
  // (what was hitting the raid while it was up: the biggest spell, and the raid's damage taken then)
  const hitIn = (a, b) => { const m = new Map(); let tot = 0; for (let k = Math.floor(a); k < Math.ceil(b); k++) { tot += (r.takenS || [])[k] || 0; const o = (r.takenAbS || [])[k]; if (o) for (const n in o) { const x = m.get(n) || [o[n][0], 0]; x[1] += o[n][1]; m.set(n, x); } } const top = [...m].sort((x, y) => y[1][1] - x[1][1])[0]; return { tot, top }; };
  const valOf = (x) => { const ov = x.heal + x.over ? x.over / (x.heal + x.over) : 0;
    return x.kind === 'dr' ? '<b>~' + C(x.prev) + '</b><span class="sub">taken off' + (x.cd === 'Anti-Magic Zone' ? ' (magic)' : '') + ' · ' + plural(x.cov, 'player') + '</span>'
      : x.kind === 'both' ? '<b>~' + C(x.prev) + '</b><span class="sub">taken off · ' + C(x.heal) + ' evened out</span>'
      : x.kind === 'av' ? '<b>' + C(x.prev) + '</b><span class="sub">avoided · ' + plural(x.cov, 'player') + '</span>'
      : x.kind === 'hp' ? '<b>+' + C(x.hp) + '</b><span class="sub">health · ' + x.dip + ' of ' + x.cov + ' dropped into it</span>'
      : x.kind === 'amp' ? '<b>' + C(x.heal) + '</b><span class="sub">healed during ' + (x.ts.length > 1 ? 'them' : 'it') + (x.avg ? ' · ' + vsUsual(x.rate, x.avg) : '') + '</span>'
      : '<b>' + C(x.heal) + '</b><span class="sub">healed' + (x.heal + x.over ? ' · ' + Math.round(100 * ov) + '% over' : '') + '</span>'; };
  const row = (x) => {
    const hi = hitIn(x.t, x.t + x.len), name = CD_SHORT[x.cd] || x.cd;
    const bar = x.kind === 'amp' ? '' : x.kind === 'heal' && x.over ? '<i style="width:' + (100 * x.heal / mx).toFixed(1) + '%"></i><i class="oh" style="width:' + Math.min(100, 100 * x.over / mx).toFixed(1) + '%"></i>' : '<i style="width:' + Math.max(1, 100 * x.v / mx).toFixed(1) + '%"></i>';
    // (a throughput cooldown is one line for all its presses: their times where "during" would be)
    if (x.kind === 'amp') return '<div class="hcd-r k-amp' + (byTime ? '' : ' np') + '"><span class="hcd-t">' + T(x.t) + '</span><span class="hcd-s">' + spell(x.id, name) + (x.ts.length > 1 ? ' <span class="sub">×' + x.ts.length + '</span>' : ' <span class="sub">' + Math.round(x.len) + 's</span>') + '</span>' +
      (byTime ? '<span class="hcd-p">' + avatar(x.p, true) + '<span class="nm" style="color:' + x.p.color + '">' + esc(x.p.name) + '</span></span>' : '') + '<span class="hcd-b none"></span><span class="hcd-v">' + valOf(x) + '</span><span class="hcd-h"><span class="sub">' + (x.ts.length > 1 ? 'pressed at ' + x.ts.map((t) => T(t)).join(', ') : 'up for ' + Math.round(x.len) + 's') + '</span></span></div>';
    return '<div class="hcd-r k-' + x.kind + (byTime ? '' : ' np') + '"><span class="hcd-t">' + T(x.t) + '</span><span class="hcd-s">' + spell(x.id, name) + ' <span class="sub">' + Math.round(x.len) + 's</span></span>' +
      (byTime ? '<span class="hcd-p">' + avatar(x.p, true) + '<span class="nm" style="color:' + x.p.color + '">' + esc(x.p.name) + '</span></span>' : '') + '<span class="hcd-b' + (bar ? '' : ' none') + '">' + bar + '</span><span class="hcd-v">' + valOf(x) + '</span>' +
      '<span class="hcd-h">' + (hi.top ? '<span class="sub">during</span> ' + spell(hi.top[1][0], hi.top[0]) + ' <span class="sub">· raid took ' + C(hi.tot) + '</span>' : '<span class="sub">raid took ' + C(hi.tot) + '</span>') + '</span></div>';
  };
  const sums = (l) => { const a = healOf(l), b = offOf(l), c = hpOf(l), w = l.filter((x) => x.kind === 'amp').reduce((s, x) => s + x.heal, 0);
    const d = avOf(l); return [a ? C(a) + ' healed' : '', b ? '~' + C(b) + ' taken off' : '', d ? C(d) + ' avoided' : '', c ? '+' + C(c) + ' health' : '', !a && !b && !c && !d && w ? C(w) + ' healed during them' : ''].filter(Boolean).join(' · '); };
  let body;
  if (byTime) {
    // (totals by cooldown and player, biggest first; throughput cooldowns last)
    const agg = new Map(); for (const x of rows) { const k = x.p.name + '|' + x.cd, a = agg.get(k) || { p: x.p, cd: x.cd, id: x.id, kind: x.kind, n: 0, v: 0 }; a.n++; a.v += x.v; agg.set(k, a); }
    body = '<div class="hcd-cs">' + [...agg.values()].sort((a, b) => (a.kind === 'amp') - (b.kind === 'amp') || b.v - a.v).map((a) => '<span class="hcd-c k-' + a.kind + '">' + spell(a.id, CD_SHORT[a.cd] || a.cd) + ' <span class="nm" style="color:' + a.p.color + '">' + esc(a.p.name) + '</span> <b>' + (a.kind === 'dr' || a.kind === 'both' ? '~' : a.kind === 'hp' ? '+' : '') + C(a.v) + '</b>' + (a.kind === 'amp' ? ' <span class="sub">during</span>' : '') + (a.n > 1 ? ' <span class="sub">' + a.n + ' presses</span>' : '') + '</span>').join('') + '</div>' + rows.map(row).join('');
  } else {
    // (a group per player: their totals, then their presses in time order; the biggest first, throughput-only last)
    const gs = new Map(); for (const x of rows) { if (!gs.has(x.p)) gs.set(x.p, []); gs.get(x.p).push(x); }
    const score = (l) => l.reduce((s, x) => s + (x.kind === 'amp' ? 0 : x.v), 0);
    body = [...gs].sort((a, b) => score(b[1]) - score(a[1])).map(([p, l]) => '<div class="hcd-g"><div class="hcd-gh">' + avatar(p, true) + '<span class="nm" style="color:' + p.color + '">' + esc(p.name) + '</span><span class="sub">' + esc(p.specName || '') + '</span><span class="hcd-gt">' + sums(l) + ' <span class="sub">· ' + ((n) => (n === 1 ? '1 press' : n + ' presses'))(l.reduce((s, x) => s + (x.ts ? x.ts.length : 1), 0)) + '</span></span></div>' + l.slice().sort((a, b) => (a.kind === 'amp') - (b.kind === 'amp') || a.t - b.t).map(row).join('') + '</div>').join('');
  }
  const sw = '<div class="seg hcd-sw" role="tablist" aria-label="Order"><button data-v="player"' + (byTime ? '' : ' class="on"') + '>By player</button><button data-v="time"' + (byTime ? ' class="on"' : '') + '>In time order</button></div>';
  const cdHeal = healOf(rows), off = offOf(rows), avAll = avOf(rows), hpAll = hpOf(rows);
  return '<div class="panel pf-hcd"><h3 class="nh"><span>Healing and raid cooldowns</span><small>' + C(cdHeal) + ' healed (' + Math.round(100 * cdHeal / Math.max(1, allHeal)) + '% of all healing)' + (off ? ' · ~' + C(off) + ' damage taken off' : '') + (avAll ? ' · ' + C(avAll) + ' avoided' : '') + (hpAll ? ' · +' + C(hpAll) + ' health' : '') + '</small>' + sw + '</h3>' + body +
    '<details class="howit"><summary>How it works</summary><div>A cooldown that heals is credited with its own heals (Tranquility, Divine Hymn, Revival, Restoral, Celestial Conduit, Yu\'lon\'s Soothing Breath, Healing Tide, Rewind, Dream Flight, Emerald Communion, Vampiric Embrace): exact, from the log, overhealing shown and not counted. ' +
      'A cooldown that reduces damage never shows in the log, so "taken off" is an estimate: the log has each hit after the reduction, and the reduction tells how much bigger it was. Devotion Aura cuts damage by 3%; Aura Mastery raises it to 12% for 8 seconds, so for each hit from an enemy on a player who had the aura then, it took off about 10% of what\'s left. Power Word: Barrier is 20% for the players inside it, Anti-Magic Zone 15% of magic damage, Spirit Link Totem 10% (its healing only evens out health between the players linked). Hits fully absorbed by a shield aren\'t counted, so these read a little low. ' +
      'Darkness is exact: every attack it makes someone avoid is logged. Rallying Cry adds 10% maximum health for 10 seconds; "dropped into it" is how many of them went below their normal maximum while it was up, i.e. actually used the extra health. ' +
      'Avenging Wrath, Apotheosis, Tree of Life and Ascendance make the healer stronger rather than healing on their own, so those show what the healer healed during it and how that rate compares with their usual over the pull (early in a pull, with little damage going out, it can read below).</div></details></div>';
}
// The fight's damage checks, for one pull: the ones the boss sets (The Coiled Altar: every Eternal Nightfall shield has
// to break before the 17 s cast ends; every set of Spiteful Soulcoilers should die before the next set spawns). A shield
// that didn't break says how much damage it was short, measured against the shields that did break this pull (or, with
// none, against the night's: ref). Judged up to the wipe filter only: a check still open there isn't shown.
// Returns [{ st, html, when }] rows, or [].
function damageChecks(r, ref) {
  const m = r.module; if (!m || m.error) return [];
  const ct = cutT(r), out = [], by = (t) => t != null && t <= ct + 0.05;
  const broke = (m._shields || []).filter((s) => s.brokeAt != null), size = broke.length ? Math.max(...broke.map((s) => s.dmg)) : ref || null;
  for (const s of m._shields || []) {
    if (!by(s.t)) continue;
    if (s.brokeAt != null && by(s.brokeAt)) out.push({ st: s.spare < 1 ? 'warn' : 'ok', when: T(s.t), html: '<b>Eternal Nightfall shield ' + s.n + '</b> (' + esc(s.ph) + '): broken in ' + (s.brokeAt - s.t).toFixed(1) + 's, ' + s.spare.toFixed(1) + 's to spare' + (s.spare < 1 ? ' · barely' : '') });
    else if (s.done && s.brokeAt == null && by(s.t + (s.secs || 17))) out.push({ st: 'bad', when: T(s.t), html: '<b>Eternal Nightfall shield ' + s.n + '</b> (' + esc(s.ph) + '): not broken · ' + C(s.dmg) + ' on Malacrass in ' + s.secs.toFixed(0) + 's' + (size && s.dmg < size ? ', about ' + Math.round(100 * (size - s.dmg) / Math.max(1, s.dmg)) + '% more damage needed' : '') });
  }
  const sets = m._addSets || [];
  sets.forEach((s, i) => {
    if (!by(s.t) || !s.adds.length) return;
    const next = sets[i + 1] && sets[i + 1].ph === s.ph ? sets[i + 1].t : null, last = Math.max(...s.adds.map((a) => (a.died == null ? Infinity : a.died)));
    if (next == null && !isFinite(last)) return; // (the last set of a phase is cleaned up by the transition)
    const lastIn = isFinite(last) && by(last);
    if (!lastIn && (next == null || !by(next))) return; // (still up at the wipe filter, and the next set wasn't due yet)
    const ok = lastIn && (next == null || last <= next);
    out.push({ st: ok ? 'ok' : 'warn', when: T(s.t), html: '<b>Spiteful Soulcoilers, set ' + s.n + '</b> (' + esc(s.ph) + '): ' + (ok ? (s.adds.length === 2 ? 'both' : 'all') + ' dead in ' + (last - s.t).toFixed(0) + 's' : lastIn ? 'the last died ' + T(last) + ', after the next set spawned' : 'still alive when the next set spawned') });
  });
  return out;
}
// The panel next to the bars. With nobody picked: who did how much by role, then where the raid's damage went (or its
// biggest heals, or what hit it hardest). With a player picked: how their pull went, their big cooldowns (their
// defensives and biggest hits on Damage taken), then what their damage went into, their heals or what hit them.
function perfDetail(r, kind, p, bossN, rowsAll) {
  const list = (m, n) => [...m.values()].sort((a, b) => b.total - a.total).slice(0, n);
  const barList = (items, color) => { const mx = Math.max(1, ...items.map((x) => x.v)); return items.map((x) => '<div class="pf-a"><span class="pf-an">' + x.html + '</span><span class="pf-ab"><i style="width:' + (100 * x.v / mx).toFixed(1) + '%;background:' + color + '"></i></span><b>' + C(x.v) + '</b></div>').join(''); };
  const sec = (title, note, body) => (body ? '<div class="pf-sec"><div class="pf-st"><b>' + title + '</b>' + (note ? '<span>' + note + '</span>' : '') + '</div>' + body + '</div>' : '');
  const abName = (a) => spell(a.id, a.name.replace(/^[^:]+: /, '')) + (/: /.test(a.name) ? ' <span class="sub">' + esc(a.name.split(': ')[0]) + '</span>' : '');
  if (!p) {
    // (by role: each role's share of the raid's total here)
    const RC = { dps: ['DPS', '#c8705a'], healer: ['Healers', '#4fae68'], tank: ['Tanks', '#5b8fd6'] }, tot = rowsAll.reduce((s, x) => s + x.tot, 0), byR = {};
    for (const x of rowsAll) byR[x.p.role || 'dps'] = (byR[x.p.role || 'dps'] || 0) + x.tot;
    const roles = Object.entries(byR).sort((a, b) => b[1] - a[1]);
    const roleBar = tot ? '<div class="pf-rb">' + roles.map(([k, v]) => '<i style="width:' + (100 * v / tot).toFixed(1) + '%;background:' + RC[k][1] + '" title="' + esc(RC[k][0] + ' ' + C(v)) + '"></i>').join('') + '</div><div class="pf-rl">' + roles.map(([k, v]) => '<span><i style="background:' + RC[k][1] + '"></i>' + RC[k][0] + ' <b>' + Math.round(100 * v / tot) + '%</b></span>').join('') + '</div>' : '';
    const hint = '<div class="pf-hint">Pick a player for their line, ' + (kind === 'taken' ? 'defensives and biggest hits' : kind === 'heal' ? 'cooldowns and heals' : 'cooldowns and targets') + '.</div>';
    let body;
    if (kind === 'dmg') { const by = new Map(); for (const q of r.players.values()) for (const [n, v] of q.dmgT) by.set(n, (by.get(n) || 0) + v);
      body = sec('Where the damage went', 'whole pull', barList([...by].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, v]) => ({ html: esc(n) + (bossN.has(n) ? ' <span class="sub">boss</span>' : ''), v })), PERF_COL.dmg)); }
    else { const by = new Map(); for (const q of r.players.values()) for (const a of (kind === 'heal' ? q.healAb : q.takenAb).values()) { const x = by.get(a.name) || { name: a.name, id: a.id, total: 0 }; x.total += a.total; by.set(a.name, x); }
      body = sec(kind === 'heal' ? 'The biggest heals' : 'What hit the raid hardest', 'whole pull', barList([...by.values()].sort((a, b) => b.total - a.total).slice(0, 10).map((a) => ({ html: spell(a.id, a.name) + (FIGHT_HEAL.has(a.id) ? ' <span class="sub">trinket</span>' : ''), v: a.total })), PERF_COL[kind])); }
    // (Healing: just the hint; the role split and the biggest heals weren't useful there)
    if (kind === 'heal') return '<h3 class="nh"><span>The raid</span></h3>' + hint;
    return '<h3 class="nh"><span>The raid</span></h3>' + hint + sec('By role', '', roleBar) + body;
  }
  const pc = perfContext(r), x0 = pc.per.get(p.name), t1 = x0 ? Math.min(x0.until, pc.end) : pc.end, gone = t1 < pc.end - 0.05;
  const upTo = gone ? 'up to their death' : isFinite(cutT(r)) && pc.end < r.duration - 0.5 ? 'up to the wipe filter' : 'whole pull';
  const head = '<div class="pf-ph">' + avatar(p) + '<div class="pf-pn"><span class="nm" style="color:' + p.color + '">' + esc(p.name) + '</span><span class="sub">' + esc(p.specName || '') + '</span></div><button class="pf-x" id="pfClose" type="button" aria-label="Close" title="Back to the raid">×</button></div>';
  const how = sec('How it went', isFinite(cutT(r)) && pc.end < r.duration - 0.5 ? 'up to the wipe filter' : 'whole pull', outputFeedback(r, p).lines.map(([st, html]) => ckLine(st, html)).join(''));
  if (kind === 'taken') {
    const big = (p.big || []).filter((x) => x.t <= pc.end + 0.05).slice(0, 5);
    return head + how + sec('Defensives', upTo, defBox(r, p, t1, pc.end, x0 && x0.died != null)) +
      sec('Biggest hits', 'single hits, absorbs included', big.map((x) => '<div class="pf-hit"><span class="pf-ht">' + T(x.t) + '</span><span class="pf-hn">' + spell(x.id, x.spell) + '</span><b>' + C(x.amt) + '</b><span class="pf-hp' + (x.hp >= 0 && x.hp < 25 ? ' low' : '') + '">' + (x.hp >= 0 ? (x.hp < 0.5 ? 'killing blow' : Math.round(x.hp) + '% left') : '') + '</span></div>').join('')) +
      sec('What hit them', 'whole pull', barList(list(p.takenAb, 8).map((a) => ({ html: abName(a), v: a.total })), PERF_COL.taken));
  }
  const cds = bigCds(r, p, t1, pc.lust);
  // (just whether they got every use out of it; a time only when it sat ready a long stretch: a minute, or half its
  // cooldown for the long ones, which healers often save for a planned moment)
  const cdBody = cds.length ? cds.map((c) => { const held = c.hold.len >= Math.max(60, c.cd / 2);
    return ckLine(c.st, spell(c.id, c.name) + ' <span class="sub">used ' + c.used + ' of ' + c.poss + (held ? ' · sat ready ' + Math.round(c.hold.len) + 's from ' + T(c.hold.s) : '') + '</span>'); }).join('')
    : ckLine('na', PERF_CDS[p.specName] ? 'None of their big cooldowns cast on this boss yet' : 'None listed for ' + esc(p.specName || 'this spec') + ' yet');
  // (against their best pull of the night, the same spec in this raid, and their Warcraft Logs parse on a kill)
  const cmpSec = () => {
    const key = kind === 'heal' ? 'healS' : 'dmgS', mine = rateIn(r, p, p[key] || [], 0, pc.end); if (!mine) return '';
    const lines = [], nb = nightBest(r, key, null), b = nb.per.get(p.name);
    if (nb.n >= 2 && b) lines.push(b.pull === r.item.pull ? ckLine('ok', 'Their best pull so far <span class="sub">of the ' + plural(nb.n, 'pull') + ' read</span>')
      : ckLine('na', 'Their best: <b>' + C(b.v) + '</b> in pull ' + b.pull + ' <span class="sub">this pull is</span> ' + dlt(pcDelta(mine, b.v)) + ' <span class="sub">of ' + plural(nb.n, 'pull') + ' read</span>'));
    const mates = [...r.players.values()].filter((q) => q !== p && q.specName === p.specName && q.name && !/^Player-/.test(q.name)).map((q) => [q, rateIn(r, q, q[key] || [], 0, pc.end)]).filter(([, v]) => v);
    if (mates.length) lines.push(ckLine('na', 'Other ' + esc(p.specName) + (mates.length > 1 ? 's' : '') + ': ' + mates.map(([q, v]) => '<span class="nm" style="color:' + q.color + '">' + esc(q.name) + '</span> <b>' + C(v) + '</b> <span class="sub">' + (Math.abs(v - mine) / mine < 0.02 ? 'level with them' : Math.round(100 * Math.abs(v - mine) / mine) + '% ' + (v > mine ? 'above' : 'below') + ' them') + '</span>').join(' · ')));
    // (a healer's damage parse, or a DPS player's healing parse, says nothing: left out)
    const fits = (kind === 'heal') === (p.role === 'healer'), prs = fits ? parsesFor(r, kind) : null, x = prs && prs.get(p.name);
    if (fits && r.item.wcl && !r.item.kill) lines.push(ckLine('na', 'Parse <span class="sub">Warcraft Logs only ranks kills</span>'));
    else if (x) lines.push(ckLine('na', 'Parse ' + prsChip(x) + ' <span class="sub">on Warcraft Logs, against the same spec on this boss</span>'));
    return lines.length ? sec('Compared', 'whole pull, per second while alive', lines.join('')) : '';
  };
  // (every ability: casts, hits, crit rate, average hit and share; heals add overhealing)
  // (long lists show their top few, with a switch for the rest; remembered per list)
  const more = (k, n, of) => (of > n || (S.perfMore && S.perfMore[k]) ? '<button class="pf-all" type="button" data-k="' + k + '">' + (S.perfMore && S.perfMore[k] ? 'Show fewer' : 'Show all ' + of) + '</button>' : '');
  const topN = (k, n) => (S.perfMore && S.perfMore[k] ? 99 : n);
  const abilTable = (k) => {
    const all = [...(k === 'heal' ? p.healAb : p.dmgAb).values()].sort((a, b) => b.total - a.total), tot = all.reduce((s, a) => s + a.total, 0) || 1, top = all.slice(0, topN('abil', 6));
    if (!top.length) return '';
    const casts = (a) => (/: /.test(a.name) ? null : (p.castAb.get(a.name) || {}).n || null), mx = Math.max(1, top[0].total);
    return '<table class="pf-abt"><thead><tr><th>' + (k === 'heal' ? 'Heal' : 'Ability') + '</th><th>Casts</th><th>Hits</th><th>Crit</th><th>Average</th>' + (k === 'heal' ? '<th>Over</th>' : '') + '<th class="sh">Share</th></tr></thead><tbody>' +
      top.map((a) => '<tr><td class="an">' + abName(a) + (FIGHT_HEAL.has(a.id) ? ' <span class="sub">trinket</span>' : '') + '</td><td>' + (casts(a) || '<span class="sub">–</span>') + '</td><td>' + a.hits + '</td><td>' + (a.hits ? Math.round(100 * a.crits / a.hits) + '%' : '') + '</td><td>' + C(a.hits ? a.total / a.hits : 0) + '</td>' +
        (k === 'heal' ? '<td>' + (a.total + a.over ? Math.round(100 * a.over / (a.total + a.over)) + '%' : '') + '</td>' : '') + '<td class="sh"><span class="pf-ab"><i style="width:' + (100 * a.total / mx).toFixed(1) + '%;background:' + p.color + '"></i></span><b>' + (100 * a.total / tot).toFixed(1) + '%</b></td></tr>').join('') + '</tbody></table>' +
      more('abil', 6, all.length);
  };
  // (their buffs by uptime up to their death or the wipe filter; the ones up the whole pull are only counted)
  const buffSec = () => {
    const out = []; let always = 0;
    for (const b of (p.buffs || new Map()).values()) { const up = b.sp.reduce((s, [a, c]) => s + Math.max(0, Math.min(c, t1) - a), 0); if (up < 1) continue;
      if (up >= 0.98 * t1 || (b.sp.length === 1 && b.sp[0][0] < 3 && b.sp[0][1] >= t1 - 1)) { always++; continue; } // (raid buffs, even recast after a death)
      out.push({ b, up, n: b.sp.filter(([a]) => a <= t1).length }); }
    if (!out.length) return '';
    const giver = (b) => { const g = [...b.by].sort((x, y) => y[1] - x[1])[0]; return g ? ' <span class="sub">from ' + esc(g[0]) + '</span>' : ''; };
    return sec('Buffs', 'uptime, ' + upTo, out.sort((a, b) => b.up - a.up).slice(0, topN('buffs', 5)).map((x) => '<div class="pf-a"><span class="pf-an">' + spell(x.b.id, x.b.name) + giver(x.b) + (x.n > 1 ? ' <span class="sub">×' + x.n + '</span>' : '') + '</span><span class="pf-ab"><i style="width:' + Math.min(100, 100 * x.up / t1).toFixed(1) + '%;background:' + p.color + '"></i></span><b>' + Math.round(100 * x.up / t1) + '%</b></div>').join('') + more('buffs', 5, out.length) +
      (always ? '<div class="sub pf-more">+' + always + ' up the whole time (raid buffs, flask, food…)</div>' : ''));
  };
  // (a healer's mana, from their casts in a real combat log, and how much of their healing landed on someone low)
  const manaSec = () => {
    if (p.role !== 'healer') return '';
    const ms = (p.mana || []).filter(([t]) => t <= t1 + 0.5), heals = p.healing - p.absorbs, lines = [];
    if (heals > 0) lines.push(ckLine('na', 'On low health: <b>' + Math.round(100 * p.lowHeal / heals) + '%</b> of their heals <span class="sub">landed on someone under half health · whole pull</span>'));
    if (ms.length >= 4) { const last = ms[ms.length - 1][1], low = Math.min(...ms.map(([, v]) => v)), pots = p.cons.manapot.filter((u) => u.t <= t1);
      lines.push(ckLine(gone ? 'na' : last < 0.1 ? 'bad' : last < 0.25 ? 'warn' : 'ok', 'Mana: <b>' + Math.round(100 * last) + '%</b> left ' + (gone ? 'when they died' : 'at the end') + ' <span class="sub">lowest ' + Math.round(100 * low) + '% · mana potion ' + (pots.length ? 'at ' + pots.map((u) => T(u.t)).join(', ') : 'not used') + '</span>') +
        '<svg class="pf-msp" viewBox="0 0 200 32" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="200" y1="24" y2="24" class="lo"/><polyline points="' + ms.map(([t, v]) => (200 * t / Math.max(1, t1)).toFixed(1) + ',' + (31 - 30 * v).toFixed(1)).join(' ') + '" style="stroke:' + p.color + '"/></svg>');
    }
    return lines.length ? sec('Healing and mana', upTo, lines.join('')) : '';
  };
  const out = head + how + cmpSec() + sec('Big cooldowns', upTo, cdBody);
  // (abilities first: they say the most about how a pull went; targets and buffs after)
  if (kind === 'dmg') return out + sec('Abilities', 'whole pull', abilTable('dmg')) +
    sec('Targets', 'whole pull', barList([...p.dmgT].sort((a, b) => b[1] - a[1]).slice(0, topN('tgts', 4)).map(([n, v]) => ({ html: esc(n) + (bossN.has(n) ? ' <span class="sub">boss</span>' : ''), v })), p.color) + more('tgts', 4, p.dmgT.size)) + buffSec();
  return out + manaSec() + sec('Heals', 'whole pull · overhealing not counted', abilTable('heal')) + buffSec();
}
// Damage taken, the picked player's defensives: each one's presses (used X of Y, when), flagged when it sat unused through
// a close call nothing answered or was still ready when they died; then their close calls (under 30% without dying),
// their death, and their Healthstone and health potion. Returns the lines.
function defBox(r, p, t1, end, died) {
  const defs = bigDefs(r, p, t1), calls = (p.closeCalls || []).filter((c) => c.t <= t1), open = calls.filter((c) => !c.def && !c.stone && !c.pot);
  const d = died ? r.deaths.filter((x) => x.guid === p.guid && x.t <= end + 0.05).sort((a, b) => a.t - b.t)[0] : null, ready = new Set(((d && d.available) || []).map((n) => n.toLowerCase()));
  const lines = defs.map((x) => {
    const st = x.used ? 'ok' : ready.has(x.name.toLowerCase()) ? 'bad' : open.length ? 'warn' : 'na';
    return ckLine(st, spell(x.id, x.name) + ' <span class="sub">' + (x.used ? 'used ' + x.used + ' of ' + x.poss + ' · at ' + x.ts.map((t) => T(t)).join(', ') : 'not pressed' + (st === 'bad' ? ', still ready when they died' : st === 'warn' ? ', ready during a close call' : '')) + '</span>');
  });
  if (!defs.length) lines.push(ckLine('na', 'None listed for ' + esc(p.specName || 'this spec') + ' yet'));
  if (calls.length) lines.push(ckLine(open.length ? 'warn' : 'ok', '<b>' + plural(calls.length, 'close call') + '</b> <span class="sub">under 30% · ' + calls.map((c) => T(c.tl) + ' (' + Math.round(100 * c.low) + '%, ' + (c.def ? 'defensive' : c.stone ? 'Healthstone' : c.pot ? 'potion' : 'nothing pressed') + ')').join(' · ') + '</span>'));
  if (d) lines.push(ckLine(d.available && d.available.length ? 'bad' : 'na', '<b>Died at ' + T(d.t) + '</b> <span class="sub">' + (d.available && d.available.length ? 'with ' + esc(d.available.join(', ')) + ' ready' : 'with nothing left to press') + '</span>'));
  const stones = p.cons.healthstone.filter((u) => u.t <= t1), pots = p.cons.healpot.filter((u) => u.t <= t1), hsRaid = [...r.players.values()].some((q) => q.cls === 'WARLOCK' || q.cons.healthstone.length);
  lines.push(ckLine(stones.length || pots.length ? 'ok' : 'na', (hsRaid ? 'Healthstone <span class="sub">' + (stones.length ? 'at ' + stones.map((u) => T(u.t)).join(', ') : 'not used') + '</span> · ' : '') + 'health potion <span class="sub">' + (pots.length ? 'at ' + pots.map((u) => T(u.t)).join(', ') : 'not used') + '</span>'));
  return lines.join('');
}
// healing from trinkets, tagged so a big line in the list reads right (counted like any other heal): Soulcoil Barrier, a
// healer trinket's absorb on the raid
const FIGHT_HEAL = new Set([1307578]);
// Utility: what each player did for the raid besides their output, up to the wipe filter: one card per kind (interrupts,
// dispels, battle resses, externals, mind control CC), only the players who did it, with what they kicked or removed and
// who their battle resses and externals went on. (The totals are on the Utility switch and each card.)
// what the cards show, over one pull or several (each up to its wipe filter)
const DISPEL_N = new Set(['cleanse', 'purify', 'purify disease', 'detox', 'nature\'s cure', 'remove corruption', 'naturalize', 'expunge', 'cauterizing flame', 'remove curse', 'cleanse spirit', 'purify spirit', 'improved purify spirit', 'cleanse toxins', 'mass dispel', 'dispel magic', 'purge', 'greater purge', 'tranquilizing shot', 'spellsteal', 'devour magic', 'consume magic', 'soothe', 'shiv', 'restoral', 'revival', 'singe magic']);
function utilCats(reps) {
  const pm = new Map(), cats = [
    { key: 'kick', icon: 'ability_kick', title: 'Interrupts', sub: 'what they stopped', none: 'No interrupts landed.' },
    { key: 'disp', icon: 'spell_holy_dispelmagic', title: 'Dispels', sub: 'what they removed', none: 'Nothing dispelled.' },
    { key: 'bres', icon: 'spell_nature_reincarnation', title: 'Battle resses', sub: 'who they brought back', none: 'No battle resses used.', who: true },
    { key: 'ext', icon: 'spell_holy_painsupression', title: 'Externals', sub: 'who they saved', tip: 'Pain Suppression, Guardian Spirit, Ironbark, Life Cocoon, Blessings of Sacrifice, Protection and Spellwarding, Time Dilation, Rescue', none: 'No externals cast.', who: true },
    { key: 'cc', icon: 'spell_shadow_shadowworddominate', title: 'Mind control CC', sub: 'on a mind-controlled player', none: 'No mind control CC.' }].map((c) => ({ ...c, m: new Map() }));
  const C2 = Object.fromEntries(cats.map((c) => [c.key, c])); let hasCC = false;
  const add = (cat, p, key, html, t) => { if (!p) return; let x = cat.m.get(p.name); if (!x) cat.m.set(p.name, x = { p: pm.get(p.name) || p, n: 0, d: new Map() }); const d = x.d.get(key) || { html, n: 0, ts: [] }; d.n++; d.ts.push(t); x.d.set(key, d); x.n++; };
  for (const r of reps) {
    const end = Math.max(1, Math.min(r.duration, cutT(r))), byN = new Map();
    for (const p of r.players.values()) if (p.name && !/^Player-/.test(p.name)) { byN.set(p.name, p); if (!pm.has(p.name)) pm.set(p.name, p); }
    const who = (on) => { const n = String(on || '').split('-')[0], q = byN.get(n); return n ? ' <span class="sub">on</span> <span class="nm" style="color:' + (q ? q.color : 'inherit') + '">' + esc(n) + '</span>' : ''; };
    for (const k of r.interrupts) if (k.t <= end) add(C2.kick, byN.get(k.player), k.spell, spell(k.id, k.spell), k.t);
    for (const p of byN.values()) {
      // (dispels: one per target per cast, so a Cleanse that takes off three stacks counts once; clearing their own debuff
      // only with a real dispel, not Disengage or an immunity; purged: taken off an enemy)
      const seenD = new Set();
      for (const d of p.dispL || []) { if (d.t > end) continue; const on = String(d.on || '').split('-')[0]; if (on === p.name && !DISPEL_N.has(String(d.by || '').toLowerCase())) continue;
        const k = on + '|' + d.t.toFixed(1); if (seenD.has(k)) continue; seenD.add(k); add(C2.disp, p, d.aura + (d.foe ? '|foe' : ''), spell(d.id, d.aura) + (d.foe ? ' <span class="pg">purged</span>' : ''), d.t); }
      for (const c of p.helpL || []) if (c.t <= end) { const ln = c.spell.toLowerCase(), cat = BRES_N.includes(ln) ? C2.bres : EXT_N.includes(ln) ? C2.ext : null; if (cat) add(cat, p, c.spell + '|' + c.on, spell(c.id, c.spell) + who(c.on), c.t); }
    }
    if (r.assign && r.assign.mcCC) { hasCC = true; for (const d of r.assign.mcCC.rows) if (d.s <= end) for (const c of d.cc) add(C2.cc, byN.get(c.who), c.spell, spell(c.id, c.spell), c.t); }
  }
  return cats.filter((c) => c.key !== 'cc' || hasCC).map((c) => ({ ...c, rows: [...c.m.values()].sort((a, b) => b.n - a.n) }));
}
// Survivability: what each player did to stay alive, up to the wipe filter, in the same layout as Utility: Healthstones,
// health potions, self-heals (buttons that only heal yourself, like Exhilaration or Frenzied Regeneration, never a heal cast
// on yourself) and defensives (Bear Form counts for a druid who isn't the tank), with what each heal gave back and who
// used none. (Raid cooldowns like Rallying Cry and Darkness are left out: they're for everyone, not a personal button.)
const SURV_RAID = new Set(['rallying cry', 'darkness']);
function survCats(reps) {
  const pm = new Map(), cats = [
    { key: 'stone', icon: 'warlock_-healthstone', title: 'Healthstones', sub: 'used, and what they healed', none: 'No Healthstones used.', heal: true, missTxt: 'Used none' },
    { key: 'pot', icon: 'inv_alchemy_70_red', title: 'Health potions', sub: 'used, and what they healed', none: 'No health potions used.', heal: true, missTxt: 'Used none' },
    { key: 'self', icon: 'ability_hunter_onewithnature', title: 'Self-heals', sub: 'buttons that only heal yourself', tip: 'Exhilaration, Crimson Vial, Desperate Prayer, Frenzied Regeneration, Renewal, Impending Victory, Mortal Coil, Death Pact, Lay on Hands on yourself and the like. A heal cast on yourself doesn\'t count.', none: 'No self-heals pressed.', heal: true },
    { key: 'def', icon: 'ability_warrior_shieldwall', title: 'Defensives', sub: 'damage cuts, immunities and shields', tip: 'Personal defensives, plus Bear Form for a druid who isn\'t the tank. Raid cooldowns are left out.', none: 'No defensives pressed.', missTxt: 'Pressed none' }].map((c) => ({ ...c, m: new Map(), seen: new Map() }));
  const C2 = Object.fromEntries(cats.map((c) => [c.key, c])); let stones = false;
  // (grouped by name: a Healthstone or Divine Protection can log under two spell IDs)
  const add = (cat, p, key, html, ts, heal) => { let x = cat.m.get(p.name); if (!x) cat.m.set(p.name, x = { p: pm.get(p.name) || p, n: 0, heal: 0, d: new Map() }); const d = x.d.get(key) || { key, html, n: 0, ts: [], heal: 0 }; d.n += ts.length; d.ts.push(...ts); d.heal += heal; x.d.set(key, d); x.n += ts.length; x.heal += heal; };
  const one = (ts) => ts.slice().sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 2); // (one press, even if the log has a cast per tick)
  for (const r of reps) {
    const end = Math.max(1, Math.min(r.duration, cutT(r))), ok = (t) => t <= end + 0.05;
    if ([...r.players.values()].some((q) => q.cls === 'WARLOCK' || q.cons.healthstone.length)) stones = true;
    for (const p of r.players.values()) {
      if (!p.name || /^Player-/.test(p.name)) continue; if (!pm.has(p.name)) pm.set(p.name, p);
      const sh = (p.selfH || []).filter((h) => ok(h.t)), healBy = (test) => sh.filter((h) => test(String(h.spell).toLowerCase())).reduce((s, h) => s + h.amt, 0);
      for (const c of cats) c.seen.set(p.name, pm.get(p.name));
      // Healthstones and health potions
      const hs = p.cons.healthstone.filter((u) => ok(u.t)); if (hs.length) add(C2.stone, p, 'Healthstone', spell(hs[0].id || 6262, 'Healthstone'), hs.map((u) => u.t), healBy((n) => n.includes('healthstone')));
      const hp = p.cons.healpot.filter((u) => ok(u.t)); if (hp.length) { const nm = hp[0].name || 'Health potion'; add(C2.pot, p, nm, spell(hp[0].id || 0, nm), hp.map((u) => u.t), healBy((n) => E.potionKind(n) === 'healpot')); }
      // self-heals and defensives: their class's list for their spec, counted only when pressed
      const list = ((p.cls && E.DEFENSIVES[p.cls]) || []).filter(([n, , , specs]) => (!specs || specs.includes(p.specId)) && !SURV_RAID.has(n.toLowerCase())).map(([n, id, , , , kind]) => [n, id, kind || 'dr'])
        .concat(((p.cls && E.SURV_MINOR[p.cls]) || []).filter(([, , specs]) => !specs || specs.includes(p.specId)).map(([n, id, , kind]) => [n, id, kind]));
      for (const [n, id0, kind] of list) {
        const ln = n.toLowerCase(), id = (p.castAb.get(n) || {}).id || id0;
        // (Lay on Hands counts only on themselves: each heal of it they got)
        const ts = one(ln === 'lay on hands' ? sh.filter((h) => String(h.spell).toLowerCase() === ln).map((h) => h.t) : (p.byName.get(ln) || []).filter(ok));
        if (!ts.length) continue;
        add(kind === 'heal' ? C2.self : C2.def, p, n, spell(id, n), ts, kind === 'heal' ? healBy((x) => x === ln) : 0);
      }
    }
  }
  return cats.filter((c) => c.key !== 'stone' || stones).map((c) => ({ ...c, rows: [...c.m.values()].sort((a, b) => b.n - a.n || b.heal - a.heal),
    // (who used none: everyone for Healthstones and potions; for defensives, players whose class has one)
    miss: !c.missTxt ? [] : [...c.seen.values()].filter((p) => !c.m.has(p.name) && (c.key !== 'def' || ((p.cls && E.DEFENSIVES[p.cls]) || []).some(([n, , , specs, base]) => base && (!specs || specs.includes(p.specId))))) }));
}
const survHead = (cats) => { const t = (k) => (cats.find((c) => c.key === k) || { rows: [] }).rows.reduce((s, x) => s + x.n, 0), hs = cats.some((c) => c.key === 'stone');
  return { v: (hs ? t('stone') + '<span> stones</span> ' : '') + t('pot') + '<span> potions</span>', s: plural(t('self'), 'self-heal') + ' · ' + plural(t('def'), 'defensive') }; };
// Utility as a chart, like Damage and Healing done: a switch for the kind (interrupts, dispels, externals, battle resses,
// mind control CC), a bar per player with how many they did, and on the right what the picked player did (each one, with
// times on a single pull), or with nobody picked what the raid did, by spell
// (st: whose switches these are, 'util' or 'surv', so each view remembers its own kind and player; a kind with heal: true
// also shows what was healed, and one with missTxt lists who used none)
function utilCards(cats, one, st) {
  st = st || 'util';
  const shown = cats.filter((c) => c.rows.length || c.key !== 'cc');
  const c = shown.find((x) => x.key === S[st + 'Cat']) || shown.find((x) => x.rows.length) || shown[0]; if (!c) return '';
  const mx = Math.max(1, ...c.rows.map((x) => x.n)), tot = c.rows.reduce((s, x) => s + x.n, 0), sel = c.rows.find((x) => x.p.name === S[st + 'Sel']) || null;
  const sw = '<div class="seg pfu-cat" role="tablist" aria-label="Kind">' + shown.map((x) => '<button type="button" data-c="' + x.key + '"' + (x === c ? ' class="on"' : '') + '>' + esc(x.title) + ' <span class="sub">' + x.rows.reduce((s, y) => s + y.n, 0) + '</span></button>').join('') + '</div>';
  const bars = c.rows.map((x, i) => cbRow({ tag: 'button', cls: sel === x ? ' on' : '', attrs: ' type="button" data-un="' + esc(x.p.name) + '" aria-pressed="' + (sel === x) + '"', k: i + 1, p: x.p,
    segs: [[Math.max(1, 100 * x.n / mx), 'm']], v: String(x.n), sub: c.heal ? (x.heal > 0 ? C(x.heal) : '—') : tot ? Math.round(100 * x.n / tot) + '%' : '' })).join('');
  const missL = c.miss && c.miss.length ? '<p class="sub pfu-miss"><b>' + esc(c.missTxt) + ':</b> ' + c.miss.map((p) => '<span class="nm" style="color:' + p.color + '">' + esc(p.name) + '</span>').join(', ') + '</p>' : '';
  const left = '<div class="panel pf-bars pfu-bars"><h3 class="nh"><span>' + esc(c.title) + '</span><small' + (c.tip ? ' title="' + esc(c.tip) + '"' : '') + '>' + esc(c.sub) + ' · ' + tot + ' in all' + (one ? '' : ' over the night') + (c.heal ? ' · ' + C(c.rows.reduce((s, x) => s + x.heal, 0)) + ' healed' : '') + '</small></h3>' + sw + (bars ? cbHead(c.heal ? 'Uses' : 'Casts', c.heal ? 'Healed' : 'Share') : '') +
    (bars || '<p class="muted" style="margin:10px 0 0">' + esc(c.none) + '</p>') + '</div>';
  const healT = (d) => (c.heal && d.heal > 0 ? C(d.heal) + ' healed' : '');
  const line = (d, who) => '<div class="pfu-l"><span class="pfu-w">' + d.html + (who ? ' <span class="sub">by</span> ' + who : '') + '</span><span class="sub">' + [one ? d.ts.slice().sort((a, b) => a - b).map((t) => T(t)).join(', ') : '', healT(d)].filter(Boolean).join(' · ') + '</span><b>' + d.n + '</b></div>';
  let right;
  if (sel) right = '<h3 class="nh">' + avatar(sel.p, true) + ' <span class="nm" style="color:' + sel.p.color + '">' + esc(sel.p.name) + '</span><small>' + plural(sel.n, c.key === 'stone' ? 'Healthstone' : c.key === 'pot' ? 'potion' : c.title.toLowerCase().replace(/s$/, '')) + (c.heal && sel.heal > 0 ? ' · ' + C(sel.heal) + ' healed' : '') + '</small></h3>' +
    [...sel.d.values()].sort((a, b) => b.n - a.n).map((d) => line(d)).join('') + '<p class="sub" style="margin:10px 0 0">Click their bar again for the whole raid.</p>';
  else {
    // (what the raid did, by spell: each one with who did it)
    const by = new Map(); for (const x of c.rows) for (const d of x.d.values()) { const k = d.key || d.html; let o = by.get(k); if (!o) by.set(k, o = { html: d.html, n: 0, ts: [], heal: 0, who: [] }); o.n += d.n; o.ts.push(...d.ts); o.heal += d.heal || 0; o.who.push([x.p, d.n]); }
    right = '<h3 class="nh"><span>The raid</span><small>' + esc(c.sub) + ', by spell</small></h3>' + ([...by.values()].sort((a, b) => b.n - a.n).map((o) => line({ html: o.html, n: o.n, ts: [], heal: o.heal }, o.who.sort((a, b) => b[1] - a[1]).map(([p, n]) => '<span class="nm" style="color:' + p.color + '">' + esc(p.name) + '</span>' + (n > 1 ? ' ' + n : '')).join(', '))).join('') || '<p class="muted">' + esc(c.none) + '</p>') +
      missL + '<p class="sub" style="margin:10px 0 0">Pick a player for what they did.</p>';
  }
  return '<div class="pf-cols" data-st="' + st + '">' + left + '<div class="panel pf-det pfu-det">' + right + '</div></div>';
}
// the timeline: a 5-second average line over a soft fill (the view's colour, or the picked player's), phases shaded and
// named, boss mechanics as ticks on top, Bloodlust and deaths marked, what's after the wipe filter greyed and outside a
// picked phase dimmed; hovering shows the time, the value, the phase and what happened then
// about how wide the Performance chart is on screen: the page column (1480 on big screens, 1240 otherwise), less the
// tiles beside it (side) and the panel's padding
const chartPx = (side) => { const cw = document.documentElement.clientWidth || 1200, col = Math.min(cw - 48, cw >= 1680 ? 1480 : 1240); return col - (side && cw > 1100 ? 282 : 0) - 34; };
function perfChart(r, series, end, p, win, kind, wpx) {
  // (on a phone the chart is drawn narrower and taller, so its text stays readable; on a computer it's drawn at about the
  // width it gets on screen, so a wide screen doesn't make it taller, only wider)
  const narrow = (document.documentElement.clientWidth || 1000) < 700, W = narrow ? 420 : wpx ? Math.max(760, Math.min(1500, Math.round(wpx))) : 1000, H = narrow ? 210 : 150, L = narrow ? 40 : 46, R = 8, Tp = 18, B = 20, iw = W - L - R, ih = H - Tp - B, dur = Math.max(1, r.duration);
  const sm = series.map((_, i) => { let s = 0, n = 0; for (let j = i - 2; j <= i + 2; j++) if (j >= 0 && j < series.length) { s += series[j] || 0; n++; } return s / n; });
  const top = Math.max(1, ...sm), mx = top * 1.1, X = (t) => L + (t / dur) * iw, Y = (v) => Tp + ih - (v / mx) * ih, col = p ? p.color : PERF_COL[kind] || PERF_COL.dmg, ev = [];
  let s = '<svg class="pfc" viewBox="0 0 ' + W + ' ' + H + '" data-w="' + W + '" data-dur="' + dur + '" data-l="' + L + '" data-iw="' + iw + '" role="img" aria-label="Output over the pull"><defs><linearGradient id="pfcG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".30"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
  const phs = (r.module && !r.module.error && r.module.phases) || [];
  phs.forEach((ph, i) => { const x0 = X(ph.start), x1 = X(Math.min(dur, isFinite(ph.end) ? ph.end : dur)); s += '<rect x="' + x0.toFixed(1) + '" y="' + Tp + '" width="' + Math.max(0, x1 - x0).toFixed(1) + '" height="' + ih + '" class="pfc-ph p' + (i % 2) + '"/>' + (i ? '<line x1="' + x0.toFixed(1) + '" x2="' + x0.toFixed(1) + '" y1="' + Tp + '" y2="' + (Tp + ih) + '" class="pfc-ps"/>' : '') + '<text x="' + (x0 + 5).toFixed(1) + '" y="' + (Tp + 11) + '" class="pfc-pl">' + esc(phLab(ph, (x1 - x0) * onScreen(W))) + '</text>'; });
  for (const f of [0.5, 1]) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(top * f).toFixed(1) + '" y2="' + Y(top * f).toFixed(1) + '" class="pfc-g"/><text x="' + (L - 6) + '" y="' + (Y(top * f) + 4).toFixed(1) + '" class="pfc-y" text-anchor="end">' + C(top * f) + '</text>';
  s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (Tp + ih) + '" y2="' + (Tp + ih) + '" class="pfc-ax"/>';
  const step = dur > 400 || (narrow && dur > 150) ? 60 : 30; for (let t = 0; t <= dur; t += step) s += '<text x="' + X(t).toFixed(1) + '" y="' + (H - 5) + '" class="pfc-x" text-anchor="middle">' + T(t) + '</text>';
  if (sm.length > 1) { const pts = sm.map((v, i) => X(i + 0.5).toFixed(1) + ',' + Y(v).toFixed(1)).join(' '); s += '<polygon points="' + X(0.5).toFixed(1) + ',' + (Tp + ih) + ' ' + pts + ' ' + X(sm.length - 0.5).toFixed(1) + ',' + (Tp + ih) + '" fill="url(#pfcG)"/><polyline points="' + pts + '" class="pfc-l" style="stroke:' + col + '"/>'; }
  // boss mechanics on top, one tick each (hover for the name), Bloodlust as a gold line, deaths as red marks at the bottom
  for (const m of ((r.module && r.module.marks) || [])) { const t = m.land != null ? m.land : m.t; if (t > dur) continue; s += '<g class="pfc-m"><title>' + esc(m.label + ' at ' + T(t)) + '</title><rect x="' + (X(t) - 1).toFixed(1) + '" y="' + (Tp - 8) + '" width="2" height="5" rx="1"/></g>'; ev.push([+t.toFixed(1), m.label, 'm']); }
  const lust = []; for (const q of r.players.values()) for (const n of LUST_N) for (const t of q.byName.get(n) || []) lust.push(t);
  if (lust.length) { const t = Math.min(...lust); s += '<line x1="' + X(t).toFixed(1) + '" x2="' + X(t).toFixed(1) + '" y1="' + Tp + '" y2="' + (Tp + ih) + '" class="pfc-lust"/><text x="' + (X(t) + 4).toFixed(1) + '" y="' + (Tp + 23) + '" class="pfc-lt">Bloodlust</text>'; ev.push([+t.toFixed(1), 'Bloodlust', 'l']); }
  // (the picked player's big cooldowns, or their defensives on Damage taken: a small marker each, in their colour)
  if (p) { const pc = perfContext(r); for (const c of (kind === 'taken' ? bigDefs(r, p, dur) : bigCds(r, p, dur, pc.lust))) for (const t of c.ts) { s += '<g class="pfc-cd"><title>' + esc(c.name + ' at ' + T(t)) + '</title><path d="M' + X(t).toFixed(1) + ' ' + (Tp + 2) + ' l4 6 h-8 z" style="fill:' + p.color + '"/><line x1="' + X(t).toFixed(1) + '" x2="' + X(t).toFixed(1) + '" y1="' + (Tp + 8) + '" y2="' + (Tp + ih) + '" style="stroke:' + p.color + '"/></g>'; ev.push([+t.toFixed(1), c.name, 'c']); } }
  // (deaths: a small dot on the axis each, faded after the wipe filter; the picked player's own death stands out)
  for (const d of r.deaths) if (d.t <= dur) { s += '<g class="pfc-dg' + (p && d.guid === p.guid ? ' me' : '') + (d.t > end + 0.05 ? ' cut' : '') + '"><title>' + esc(d.player + ' died at ' + T(d.t)) + '</title><circle cx="' + X(d.t).toFixed(1) + '" cy="' + (Tp + ih) + '" r="' + (p && d.guid === p.guid ? 4 : 2.6) + '"/></g>'; if (d.t <= end + 0.05) ev.push([+d.t.toFixed(1), d.player + ' died', 'd']); }
  // (a picked phase: the rest of the pull dimmed)
  if (win) { if (win[0] > 0.5) s += '<rect x="' + L + '" y="' + Tp + '" width="' + (X(win[0]) - L).toFixed(1) + '" height="' + ih + '" class="pfc-dim"/>'; if (win[1] < end - 0.5) s += '<rect x="' + X(win[1]).toFixed(1) + '" y="' + Tp + '" width="' + (X(end) - X(win[1])).toFixed(1) + '" height="' + ih + '" class="pfc-dim"/>'; }
  if (end < dur - 0.5) s += '<rect x="' + X(end).toFixed(1) + '" y="' + Tp + '" width="' + (X(dur) - X(end)).toFixed(1) + '" height="' + ih + '" class="pfc-cut"/><text x="' + (X(end) + 6).toFixed(1) + '" y="' + (Tp + ih / 2) + '" class="pfc-ct">after the wipe filter</text>';
  s += '<line class="pfc-hv" x1="0" x2="0" y1="' + Tp + '" y2="' + (Tp + ih) + '" style="display:none"/><circle class="pfc-hd" r="3.5" cx="0" cy="0" style="display:none;fill:' + col + '"/></svg>';
  return '<div class="pfc-w" data-s="' + esc(JSON.stringify(sm.map((v) => Math.round(v)))) + '" data-mx="' + mx + '" data-tp="' + Tp + '" data-ih="' + ih + '" data-ev="' + esc(JSON.stringify(ev)) + '" data-ph="' + esc(JSON.stringify(phs.map((q) => [q.start, q.name]))) + '">' + s + '<div class="pfc-tip" hidden></div></div>';
}
// ---- Performance, all pulls: the night's output pull by pull, and each player's average over the night ----
// Each pull counts up to its own wipe filter (and, with a phase picked, only that phase in the pulls that reached it); a
// pull counted for under 30 seconds (a reset) is left out of the numbers. "While alive" leaves out time spent dead.
async function perfNight(r0, kind, scopeSw) {
  const it = r0.item, still = () => S.tab === 'perf' && S.scope === 'all' && S.rep === r0;
  view('<div class="pfv"><div class="pf-top">' + scopeSw + '</div><p class="muted">Reading the pulls…</p></div>'); bindPerf();
  const got = await bossReps(it, still, (n, of) => { const m = $('#view .muted'); if (m) m.textContent = 'Reading the pulls… ' + n + ' of ' + of; }); if (!got || !still()) return;
  const reps = got.reps, KEY = { dmg: 'dmgS', heal: 'healS', taken: 'takenS' };
  const pm = new Map(); for (const r of reps) for (const p of r.players.values()) if (p.name && !/^Player-/.test(p.name) && !pm.has(p.name)) pm.set(p.name, p);
  // (the phase picker: a phase counts in each pull that reached it, up to that pull's wipe filter)
  const phOf = (r, end) => ((r.module && !r.module.error && r.module.phases) || []).filter((q) => q.start < end - 1);
  const keys = []; for (const r of reps) for (const q of phOf(r, Math.max(1, Math.min(r.duration, cutT(r))))) if (!keys.includes(pfPhK(q))) keys.push(pfPhK(q));
  const phSel = S.perfPh && keys.includes(S.perfPh) ? S.perfPh : null, MIN = phSel ? 10 : 30;
  const wins = reps.map((r) => { const end = Math.max(1, Math.min(r.duration, cutT(r))), q = phSel ? phOf(r, end).find((x) => pfPhK(x) === phSel) : null; if (phSel && !q) return null;
    const w0 = q ? q.start : 0, w1 = q ? Math.min(isFinite(q.end) ? q.end : end, end) : end; return { r, w0, w1, wl: Math.max(1, w1 - w0) }; }).filter(Boolean);
  const used = wins.filter((w) => w.wl >= MIN), short = wins.filter((w) => w.wl < MIN);
  const sumW = (arr, w) => { let s = 0; for (let i = Math.max(0, Math.floor(w.w0)); i < Math.min(arr.length, Math.ceil(w.w1)); i++) s += arr[i] || 0; return s; };
  const raidPs = (w, k) => { let s = 0; for (const p of w.r.players.values()) if (pm.has(p.name)) s += sumW(p[KEY[k]] || [], w); return s / w.wl; };
  const avgK = (k) => (used.length ? used.reduce((s, w) => s + raidPs(w, k), 0) / used.length : 0), ucats = utilCats(reps), scats = survCats(reps);
  const avgS = 'average over ' + plural(used.length, 'pull') + (phSel ? ' · ' + esc(phSel) : '');
  const vals = { dmg: { v: C(avgK('dmg')) + '<span>/s</span>', s: avgS }, heal: { v: C(avgK('heal')) + '<span>/s</span>', s: avgS }, taken: { v: C(avgK('taken')) + '<span>/s</span>', s: avgS }, util: utilHead(ucats), surv: survHead(scats) };
  const counts = PERF_COUNTS.has(kind);
  const cutTxt = counts ? plural(reps.length, 'pull') + ', each up to its wipe filter' : (phSel ? '<b>' + esc(phSel) + '</b> in each pull that reached it' : plural(used.length, 'pull')) + ', each up to its wipe filter' + (short.length ? ' · pull ' + short.map((w) => w.r.item.pull).join(', ') + ' left out (under ' + MIN + 's)' : '');
  let h = '<div class="pfv"><div class="pf-head">' + perfTabs(kind, vals) + '<div class="pf-top">' + scopeSw + (!counts ? phaseChips(keys, phSel) : '') + '<div class="cutbar"><span class="cutnow">' + cutTxt + '</span></div></div></div>';
  if (counts) { view(h + (kind === 'surv' ? utilCards(scats, false, 'surv') : utilCards(ucats, false)) + '</div>'); bindPerf(); refreshIcons(); return; }
  // per pull: the raid's output per second, and each player's total and time alive
  const key = KEY[kind], pulls = [], acc = new Map();
  for (const w of used) {
    const r = w.r; let raid = 0;
    for (const p of r.players.values()) { if (!pm.has(p.name)) continue; const tot = sumW(p[key] || [], w); if (!tot) continue; raid += tot;
      const alive = Math.max(1, aliveSecs(r, p, w.w0, w.w1)), ps = tot / alive;
      // (a best only from a pull they lived a minute in, or most of the phase: a quick death can't make a fake best)
      const a = acc.get(p.name) || { p: pm.get(p.name), tot: 0, alive: 0, best: 0, bestPull: null, per: [] }; a.tot += tot; a.alive += alive;
      if (alive >= (phSel ? 0.8 * w.wl : 60) && ps > a.best) { a.best = ps; a.bestPull = r.item.pull; } a.per.push([r.item.pull, ps]); acc.set(p.name, a); }
    pulls.push({ r, n: r.item.pull, ps: raid / w.wl, kill: r.item.kill, label: pullLabel(r.item), wl: w.wl });
  }
  const what = { dmg: 'damage', heal: 'healing', taken: 'damage taken' }[kind], best = pulls.filter((x) => x.wl >= (phSel ? MIN : 60)).reduce((m, x) => (!m || x.ps > m.ps ? x : m), null);
  const half = Math.floor(pulls.length / 2), first = half ? pulls.slice(0, half).reduce((s, x) => s + x.ps, 0) / half : 0, last = half ? pulls.slice(-half).reduce((s, x) => s + x.ps, 0) / half : 0;
  h += '<div class="pts n3">' + plTile(plIco('achievement_boss_lichking'), 'Best pull', best ? C(best.ps) + '<span>/s</span>' : '—', 'na', best ? 'pull ' + best.n + ' · ' + best.label : '') +
    plTile(plIco('spell_holy_borrowedtime'), 'Through the night', half >= 3 ? (last >= first ? '▲ ' : '▼ ') + Math.abs(Math.round(100 * (last - first) / Math.max(1, first))) + '<span>%</span>' : '—', half >= 3 ? (kind === 'taken' ? (last <= first ? 'ok' : 'warn') : last >= first ? 'ok' : 'warn') : 'na', half >= 3 ? 'the last ' + half + ' pulls against the first ' + half + (!phSel && keys.length > 1 ? ' · pick a phase to compare like with like' : '') : 'not enough pulls yet') +
    plTile(plIco('inv_misc_pocketwatch_01'), 'Pulls', String(pulls.length), 'na', T(pulls.reduce((s, x) => s + x.wl, 0)) + ' counted') + '</div>';
  // the night's damage checks: how often each one passed (a missed shield measured against the night's broken ones)
  if (kind === 'dmg' && !phSel) {
    const ref = Math.max(0, ...reps.flatMap((r) => ((r.module && !r.module.error && r.module._shields) || []).filter((s) => s.brokeAt != null).map((s) => s.dmg))) || null;
    let shB = 0, shN = 0, adB = 0, adN = 0; const shMiss = new Set(), adMiss = new Set();
    for (const r of reps) for (const x of damageChecks(r, ref)) { if (/Eternal Nightfall/.test(x.html)) { shN++; if (x.st !== 'bad') shB++; else shMiss.add(r.item.pull); } else { adN++; if (x.st === 'ok') adB++; else adMiss.add(r.item.pull); } }
    const row = (st, html) => '<div class="pb-r ' + st + '"><span class="pb-i">' + { bad: '✕', warn: '!', ok: '✓' }[st] + '</span><span class="pb-t">' + html + '</span></div>';
    const dc = (shN ? row(shB === shN ? 'ok' : 'bad', '<b>Eternal Nightfall shields</b>: broken in ' + shB + ' of ' + shN + (shMiss.size ? ' · not broken in pull ' + [...shMiss].join(', ') : '')) : '') +
      (adN ? row(adB === adN ? 'ok' : 'warn', '<b>Spiteful Soulcoiler sets</b> killed before the next set: ' + adB + ' of ' + adN + (adMiss.size ? ' · late in pull ' + [...adMiss].join(', ') : '')) : '');
    if (dc) { const dst = shB < shN ? 'bad' : adB < adN ? 'warn' : 'ok'; h += '<div class="panel probbox ' + dst + ' pf-dc"><h3 class="nh">Damage checks <small>across the pulls, each up to its wipe filter</small>' + hst(dst, dst === 'ok' ? 'all passed' : 'some missed') + '</h3>' + dc + '</div>'; }
  }
  // the night as bars: one per pull, its height the raid's output per second (green: a kill, gold: the best), the line a
  // 3-pull average; a click opens that pull
  const narrow = (document.documentElement.clientWidth || 1000) < 700, mxv = Math.max(1, ...pulls.map((x) => x.ps)) * 1.08, W = narrow ? 420 : 1000, H = narrow ? 200 : 150, L = narrow ? 40 : 46, Tp = 10, B = 20, ih = H - Tp - B, stepX = (W - L - 8) / Math.max(1, pulls.length), bw = Math.max(4, Math.min(24, stepX - 6));
  const cx = (i) => L + (i + 0.5) * stepX, cy = (v) => Tp + ih - (v / mxv) * ih;
  let svg = '<svg class="pfc pfn" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Output per pull">';
  for (const f of [0.5, 1]) svg += '<line x1="' + L + '" x2="' + (W - 8) + '" y1="' + cy(mxv / 1.08 * f).toFixed(1) + '" y2="' + cy(mxv / 1.08 * f).toFixed(1) + '" class="pfc-g"/><text x="' + (L - 6) + '" y="' + (cy(mxv / 1.08 * f) + 4).toFixed(1) + '" class="pfc-y" text-anchor="end">' + C(mxv / 1.08 * f) + '</text>';
  pulls.forEach((x, i) => { const hh = Math.max(2, (x.ps / mxv) * ih);
    svg += '<g class="pfn-b' + (x.kill ? ' kill' : '') + (x === best ? ' best' : '') + (x.n === it.pull ? ' cur' : '') + '" data-pull="' + x.n + '"><title>' + esc('Pull ' + x.n + ': ' + C(x.ps) + ' ' + what + ' per second · ' + x.label + (x.n === it.pull ? ' · the pull you came from' : '')) + '</title><rect class="hit" x="' + (cx(i) - stepX / 2).toFixed(1) + '" y="' + Tp + '" width="' + stepX.toFixed(1) + '" height="' + ih + '"/><rect x="' + (cx(i) - bw / 2).toFixed(1) + '" y="' + (Tp + ih - hh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="2"/></g>' +
      ((narrow ? pulls.length <= 12 || i % 5 === 0 || i === pulls.length - 1 : pulls.length <= 30 || i % 2 === 0) ? '<text x="' + cx(i).toFixed(1) + '" y="' + (H - 5) + '" class="pfc-x' + (x.n === it.pull ? ' cur' : '') + '" text-anchor="middle">' + x.n + '</text>' : ''); });
  if (pulls.length >= 4) svg += '<polyline class="pfn-tr" points="' + pulls.map((x, i) => { const a = pulls.slice(Math.max(0, i - 1), i + 2); return cx(i).toFixed(1) + ',' + cy(a.reduce((s, y) => s + y.ps, 0) / a.length).toFixed(1); }).join(' ') + '"/>';
  svg += '</svg>';
  h += '<div class="panel pf-chart"><h3 class="nh"><span class="pfc-ttl">Raid ' + what + ' per pull' + (phSel ? ' in ' + esc(phSel) : '') + '</span><small>per second, each up to its wipe filter · click a pull to open it</small><span class="pfc-lg"><span><i class="lg-b"></i>wipe</span><span><i class="lg-k"></i>kill</span><span><i class="lg-g"></i>best</span>' + (pulls.length >= 4 ? '<span><i class="lg-t"></i>3-pull average</span>' : '') + '</span></h3>' + svg + '</div>';
  // a bar per player: their average while alive over the night, their pull-by-pull line, and their best pull
  const maxN = Math.max(1, ...[...acc.values()].map((a) => a.per.length)), all = [...acc.values()].sort((a, b) => b.tot / b.alive - a.tot / a.alive);
  const has = new Set(all.map((x) => x.p.role || 'dps')), rc = roleCur(has), rows = all.filter((x) => rc === 'all' || (x.p.role || 'dps') === rc), top = rows.length ? rows[0].tot / rows[0].alive : 1;
  h += '<div class="panel pf-bars"><h3 class="nh"><span>' + capS(what) + ' by player</span><small>per second while alive' + (phSel ? ' in ' + esc(phSel) : '') + ', averaged over the pulls they were in</small>' + roleChips(has) + '</h3>' + (rows.length ? cbHead('Per sec', 'Their best', '', ' pf-nr') : '') +
    rows.map((x, i) => cbRow({ tag: 'div', cls: ' nb pf-nr', k: i + 1, p: x.p, segs: [[Math.max(1, 100 * (x.tot / x.alive) / top), 'm']], v: C(x.tot / x.alive),
      chips: x.per.length < maxN ? '<span class="sub">' + x.per.length + ' of ' + maxN + '</span>' : '',
      sub: x.bestPull != null && x.best >= x.tot / x.alive ? C(x.best) + ' · pull ' + x.bestPull : '' })).join('') + '</div>';
  view(h + '</div>');
  bindPerf(); refreshIcons();
  const byPull = new Map(reps.map((r) => [r.item.pull, r.item]));
  $$('#view .pfn-b').forEach((g) => (g.onclick = () => { const b = byPull.get(+g.dataset.pull); if (!b) return; S.scope = 'pull'; select(b); }));
}
// A condensed bar row (the Performance player lists), in fixed columns so every row lines up: the rank, the bar itself
// (the player's avatar and name on it), their number, any extra column (the night's sparkline), then the small number.
// The numbers sit outside the bar, so a bar ending under one never runs through it. segs: the fill as [width %, kind]
// parts: m the amount, oh overhealing (faded), ad avoidable damage (red; not 'av', the avatar's class).
function cbRow(o) {
  const fill = o.segs.filter(([w]) => w > 0).map(([w, k]) => '<i class="' + k + '" style="width:' + Math.min(100, w).toFixed(1) + '%"></i>').join('');
  return '<' + o.tag + ' class="pf-row cb' + (o.cls || '') + '"' + (o.attrs || '') + '><span class="pf-k">' + o.k + '</span><span class="cb-b" style="--c:' + o.p.color + '"><span class="cb-f">' + fill + '</span>' +
    (o.tick != null ? '<span class="cb-tk" style="left:' + Math.max(0, Math.min(100, o.tick)).toFixed(1) + '%"></span>' : '') +
    '<span class="cb-in">' + avatar(o.p, true) + '<span class="pf-nm"><span class="nm">' + esc(o.p.name) + '</span>' + (o.chips || '') + '</span></span></span><b class="cb-v">' + o.v + '</b>' + (o.extra || '') + '<span class="cb-s">' + (o.sub || '') + '</span>' + (o.end != null ? '<span class="cb-r">' + o.end + '</span>' : '') + '</' + o.tag + '>';
}
// the column names over a list of bars (cls: the rows' own column classes, so the names line up)
const cbHead = (v, s, end, cls) => '<div class="pf-row cb nb cb-h' + (cls || '') + '"><span class="pf-k">#</span><span class="cb-hn">Player</span><span class="cb-v">' + v + '</span><span class="cb-s">' + s + '</span>' + (end ? '<span class="cb-r">' + end + '</span>' : '') + '</div>';
// ---- Performance: the views under the timeline. Players (the bars and the picked player), then the same pull cut other
// ways: by phase, by damage window, by target, healers only, and as a heatmap ----
const PERF_LENS = [['players', 'Players'], ['cds', 'Cooldowns'], ['hits', 'Big hits'], ['healers', 'Healer mana'], ['phases', 'Phases'], ['windows', 'Damage windows'], ['targets', 'Targets']];
const KEY_OF = { dmg: 'dmgS', heal: 'healS', taken: 'takenS' };
const sumIn = (arr, a, b) => { let s = 0; for (let i = Math.max(0, Math.floor(a)); i < Math.min(arr.length, Math.ceil(b)); i++) s += arr[i] || 0; return s; };
// a player's rate while alive between a and b (null when they were dead for all of it)
const rateIn = (r, p, arr, a, b) => { const al = aliveSecs(r, p, a, b); return al >= 1 ? sumIn(arr, a, b) / al : null; };
const pcDelta = (v, b) => (b > 0 && v != null ? (v - b) / b : null);
// a change as a small badge: ▲ 12% or ▼ 12% (within 2%: level)
const dlt = (d) => (d == null ? '' : Math.abs(d) < 0.02 ? '<span class="dl lv">level</span>' : '<span class="dl ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '▲' : '▼') + ' ' + Math.round(100 * Math.abs(d)) + '%</span>');
function lensBar(list, cur) {
  return '<div class="pf-lens" role="tablist" aria-label="View">' + list.map(([k, l]) => '<button type="button" role="tab" data-l="' + k + '" aria-selected="' + (k === cur) + '"' + (k === cur ? ' class="on"' : '') + '>' + l + '</button>').join('') + '</div>';
}
// one phase of a pull (or the whole pull, with no key), up to its wipe filter: { w0, w1, wl }, or null if it never got there
function perfWin(r, k) {
  const end = Math.max(1, Math.min(r.duration, cutT(r)));
  if (!k) return { w0: 0, w1: end, wl: end };
  const q = ((r.module && !r.module.error && r.module.phases) || []).filter((x) => x.start < end - 1).find((x) => pfPhK(x) === k);
  if (!q) return null; const w1 = Math.min(isFinite(q.end) ? q.end : end, end); return { w0: q.start, w1, wl: Math.max(1, w1 - q.start) };
}
// The night's best on this boss, from the pulls read so far (each up to its wipe filter; the same phase when one is given):
// the raid's best rate, and each player's (from a pull they lived a minute in, or most of the phase, so a quick death
// can't make a fake best). n: how many pulls it looked at.
function nightBest(r, key, phK) {
  const raid = { v: 0, pull: null }, per = new Map(); let n = 0;
  for (const q of CACHE.values()) {
    if (!q || !q.item || q.item.kind !== 'boss' || q.item.run || q.item.id !== r.item.id || q.item.diffId !== r.item.diffId) continue;
    const w = perfWin(q, phK); if (!w || w.wl < (phK ? 10 : 30)) continue; n++;
    let tot = 0;
    for (const p of q.players.values()) {
      if (!p.name || /^Player-/.test(p.name)) continue;
      const s = sumIn(p[key] || [], w.w0, w.w1); tot += s; if (!s) continue;
      const al = aliveSecs(q, p, w.w0, w.w1); if (al < (phK ? 0.8 * w.wl : 60)) continue;
      const b = per.get(p.name); if (!b || s / al > b.v) per.set(p.name, { v: s / al, pull: q.item.pull });
    }
    if (w.wl >= (phK ? 10 : 60) && tot / w.wl > raid.v) { raid.v = tot / w.wl; raid.pull = q.item.pull; }
  }
  return { raid, per, n };
}
// The pull's damage windows up to the wipe filter: Bloodlust (its 40 seconds) and the fight's own (Rage of the Shackled,
// each Eternal Nightfall shield until it broke, the Soulbinding intermission)
function perfWins(r, end) {
  const out = [], lust = perfContext(r).lust;
  if (lust != null && lust < end - 1) out.push({ label: 'Bloodlust', short: 'Bloodlust', t0: lust, t1: Math.min(end, lust + 40), lust: true });
  for (const w of ((r.module && !r.module.error && r.module.windows) || [])) if (w.t0 < end - 1) out.push({ ...w, t1: Math.min(end, w.t1) });
  return out.sort((a, b) => a.t0 - b.t0);
}
// a phase's label for a space px wide: its name, its short name, or nothing
const phLab = (q, px) => { const k = pfPhK(q); return px >= 7.4 * q.name.length + 8 ? q.name : px >= 7.4 * k.length + 8 ? k : px >= 34 ? k.slice(0, 3) + (k.length > 3 ? '.' : '') : ''; };
// a chart's width on screen against its drawing width, for fitting labels
const onScreen = (W) => Math.min(1, ((document.documentElement.clientWidth || 1000) - 80) / W);
const lensRows = (ps, f, def) => { const has = new Set(ps.map((p) => p.role || 'dps')), rc = roleCur(has, def); return { has, list: ps.filter((p) => rc === 'all' || (p.role || 'dps') === rc).filter(f || (() => true)) }; };
const lensHead = (title, note, chips) => '<h3 class="nh"><span>' + title + '</span><small>' + note + '</small>' + (chips || '') + '</h3>';
const pfName = (p) => avatar(p, true) + '<span class="nm" style="color:' + p.color + '">' + esc(p.name) + '</span>';

// Phases: a row per player, a column per phase and one for the whole pull, each their rate while alive there; the cell is
// shaded by where it ranks in its column, and (Damage and Healing) badged against their best pull of the night there
function perfPhases(r, kind, ps, end, phs, pk) {
  const key = KEY_OF[kind], cols = phs.map((q) => ({ k: pfPhK(q), w0: q.start, w1: Math.min(isFinite(q.end) ? q.end : end, end) })).concat([{ k: null, name: 'Whole pull', w0: 0, w1: end, all: true }]);
  const cmp = kind !== 'taken', bests = cols.map((c) => (cmp ? nightBest(r, key, c.k) : null)), nPulls = cmp ? bests[bests.length - 1].n : 0, showB = cmp && nPulls >= 2;
  const { has, list } = lensRows(ps);
  const rows = list.map((p) => ({ p, v: cols.map((c) => rateIn(r, p, p[key] || [], c.w0, c.w1)), tot: sumIn(p[key] || [], 0, end) })).filter((x) => x.tot > 0).sort((a, b) => b.tot - a.tot);
  const what = { dmg: 'Damage', heal: 'Healing', taken: 'Damage taken' }[kind];
  if (!rows.length) return '<div class="panel pf-lp">' + lensHead(what + ' by phase', '', roleChips(has)) + '<p class="muted">Nothing recorded.</p></div>';
  const mx = cols.map((_, i) => Math.max(1, ...rows.map((x) => x.v[i] || 0))), cls = (c) => 'pf-c' + (c.all ? ' all' : '') + (pk && c.k === pk ? ' pk' : '');
  const badge = (v, b, i) => (!showB || !b || b.pull == null || bests[i].n < 2 ? '' : b.pull === r.item.pull ? '<span class="dl bs">★ best</span>' : dlt(pcDelta(v, b.v)));
  const th = cols.map((c) => '<th class="' + cls(c) + '">' + esc(c.all ? c.name : c.k) + '<span>' + T(Math.max(0, c.w1 - c.w0)) + '</span></th>').join('');
  const raid = cols.map((c, i) => { const v = ps.reduce((s, p) => s + sumIn(p[key] || [], c.w0, c.w1), 0) / Math.max(1, c.w1 - c.w0); return '<td class="' + cls(c) + '"><b>' + C(v) + '</b>' + badge(v, showB ? bests[i].raid : null, i) + '</td>'; }).join('');
  const body = rows.map((x) => '<tr data-n="' + esc(x.p.name) + '" tabindex="0"><td class="pf-pc">' + pfName(x.p) + '</td>' + x.v.map((v, i) => (v == null ? '<td class="' + cls(cols[i]) + ' na"><span class="sub">dead</span></td>'
    : '<td class="' + cls(cols[i]) + '" style="--a:' + (v / mx[i]).toFixed(2) + '"><b>' + C(v) + '</b>' + badge(v, showB ? bests[i].per.get(x.p.name) : null, i) + '</td>')).join('') + '</tr>').join('');
  return '<div class="panel pf-lp">' + lensHead(what + ' by phase', 'per second while alive' + (pk ? ' · every phase shows here; ' + esc(pk) + ' is highlighted' : ''), roleChips(has)) +
    '<div class="pf-tw"><table class="pf-t k-' + kind + '"><thead><tr><th class="pf-pc">Player</th>' + th + '</tr></thead><tbody><tr class="raid"><td class="pf-pc"><span class="nm">Raid</span></td>' + raid + '</tr>' + body + '</tbody></table></div>' +
    '<details class="howit"><summary>How it works</summary><div>Each cell is the player\'s rate while alive in that phase, up to the wipe filter, shaded by where it ranks in its column; a phase they were dead for reads dead. ' + (cmp ? (showB ? 'It\'s compared with the ' + plural(nPulls, 'pull') + ' of this boss read so far: ▲▼ against their own best pull of the night in that phase (only pulls they lived most of the phase in), ★ when this pull is it. ' : 'Open All pulls once and each cell is compared with their best pull of the night in that phase. ') : '') + 'Click a name for their breakdown.</div></details></div>';
}

// Damage windows: one window at a time, picked on a switch (Bloodlust and the fight's own). A bar per player for their
// damage per second while alive in it (damage a boss shield soaked counts), a tick at their own rate over the pull, the
// badge for how far past it they went, and the big cooldowns and combat potion they had going for it (a potion drunk up
// to 25 seconds before still counts). On the right, the raid in that window and every window side by side.
function perfWindows(r, ps, end, wins) {
  const lust = perfContext(r).lust, ser = (p) => { const a = p.dmgS || [], b = p.absS || [], n = Math.max(a.length, b.length), o = new Array(n); for (let i = 0; i < n; i++) o[i] = (a[i] || 0) + (b[i] || 0); return o; };
  const wi = Math.max(0, Math.min(wins.length - 1, S.perfWin | 0)), w = wins[wi];
  const { has, list } = lensRows(ps, null, 'dps');
  // (the picked window, per player: their rate in it and over the pull, the cooldowns they pressed for it, a potion)
  const rows = list.map((p) => { const s = ser(p), avg = rateIn(r, p, s, 0, end), v = rateIn(r, p, s, w.t0, w.t1), cds = bigCds(r, p, end, lust);
    return { p, tot: sumIn(s, 0, end), avg, v, x: v != null && avg ? v / avg : null, cds, used: cds.filter((c) => c.ts.some((t) => t >= w.t0 - 3 && t <= w.t1)), pot: p.cons.combatpot.some((u) => u.t >= w.t0 - 25 && u.t <= w.t1) }; })
    .filter((x) => x.tot > 0).sort((a, b) => (b.v == null ? -1 : b.v) - (a.v == null ? -1 : a.v));
  const sw = wins.length > 1 ? '<div class="seg pf-ws" role="tablist" aria-label="Window">' + wins.map((q, i) => '<button type="button" data-wi="' + i + '"' + (i === wi ? ' class="on"' : '') + '>' + esc(q.short || q.label) + '<span class="n">' + T(q.t0) + '</span></button>').join('') + '</div>' : '';
  const head = lensHead('Damage windows', esc(w.label) + ', ' + T(w.t0) + '–' + T(w.t1) + ' · per second while alive · the white tick is their usual', roleChips(has, 'dps')) + sw;
  if (!rows.length) return '<div class="panel pf-bars">' + head + '<p class="muted">No damage recorded.</p></div>';
  const allS = (() => { const o = []; for (const p of ps) ser(p).forEach((v, i) => { o[i] = (o[i] || 0) + v; }); return o; })(), raidAvg = sumIn(allS, 0, end) / end;
  const raidIn = (q) => sumIn(allS, q.t0, q.t1) / Math.max(1, q.t1 - q.t0);
  const xb = (x) => (x == null ? '' : '<span class="dl ' + (x >= 1.12 ? 'up' : x < 0.95 ? 'dn' : 'lv') + '">×' + x.toFixed(2) + '</span>');
  // (a bar per player: their rate in the window, a tick at their own rate over the pull; by the name, what they pressed)
  const mx = Math.max(1, ...rows.map((x) => Math.max(x.v || 0, x.avg || 0)));
  // (on a phone the chip is just ▲ and how many, so the name keeps its room)
  const cdChip = (u) => '<span class="pfw-c" title="' + esc(u.map((c) => c.name).join(', ')) + '">▲<span class="pfw-ct"> ' + esc(u.length > 1 ? u.length + ' cooldowns' : u[0].name) + '</span>' + (u.length > 1 ? '<span class="pfw-cn">' + u.length + '</span>' : '') + '</span>';
  const bars = rows.map((x, i) => cbRow({ tag: 'button', cls: ' pf-wr', attrs: ' type="button" data-n="' + esc(x.p.name) + '" title="' + esc('their usual: ' + C(x.avg || 0) + ' per second over the pull') + '"', k: i + 1, p: x.p,
    segs: [[x.v ? Math.max(1, 100 * x.v / mx) : 0, 'm']], tick: x.avg ? 100 * x.avg / mx : null, v: x.v == null ? '—' : C(x.v), sub: x.v == null ? '<span class="sub">dead</span>' : xb(x.x),
    chips: (x.used.length ? cdChip(x.used) : '') + (x.pot ? '<span class="pfw-p" title="combat potion">pot</span>' : '') })).join('');
  // (the right side: the raid in the window, who had nothing going for it, and every window side by side)
  const rv = raidIn(w), withLust = !w.lust && lust != null && lust >= w.t0 - 10 && lust <= w.t1;
  const alive = rows.filter((x) => x.v != null), withCds = alive.filter((x) => x.cds.length), cdUsed = withCds.filter((x) => x.used.length), pots = alive.filter((x) => x.pot);
  const none = alive.filter((x) => !x.used.length && !x.pot), below = alive.filter((x) => x.x != null && x.x < 0.95);
  const stat = (v, l) => '<div class="pfw-s"><b>' + v + '</b><span>' + l + '</span></div>';
  const who = (arr) => arr.map((x) => '<span class="nm" style="color:' + x.p.color + '">' + esc(x.p.name) + '</span>').join(', ');
  const wmx = Math.max(1, ...wins.map(raidIn));
  const side = '<h3 class="nh"><span>The raid in ' + esc(w.short || w.label) + '</span><small>' + T(w.t0) + '–' + T(w.t1) + ' (' + Math.round(w.t1 - w.t0) + 's)' + (withLust ? ' · with Bloodlust' : '') + '</small></h3>' +
    '<div class="pfw-sts">' + stat(C(rv) + xb(raidAvg ? rv / raidAvg : null), 'raid damage per second') + stat(cdUsed.length + '<span> of ' + withCds.length + '</span>', 'pressed a big cooldown') + stat(pots.length + '<span> of ' + alive.length + '</span>', 'drank a potion') + '</div>' +
    (none.length ? '<p class="pfw-l"><span class="sub">No cooldown or potion: </span>' + who(none) + '</p>' : '') +
    (below.length ? '<p class="pfw-l"><span class="sub">Below their usual: </span>' + who(below) + '</p>' : '') +
    (wins.length > 1 ? '<h3 class="nh pfw-h"><span>Every window</span><small>the raid\'s damage per second in each, against its usual</small></h3>' + wins.map((q, i) => { const v = raidIn(q);
      return '<button type="button" class="pfw-w' + (i === wi ? ' on' : '') + '" data-wi="' + i + '"><span class="pfw-wn">' + esc(q.short || q.label) + ' <span class="sub">' + T(q.t0) + '</span></span><span class="pf-ab"><i style="width:' + (100 * v / wmx).toFixed(1) + '%;background:' + PERF_COL.dmg + '"></i></span><b>' + C(v) + '</b>' + xb(raidAvg ? v / raidAvg : null) + '</button>'; }).join('') : '');
  return '<div class="pf-cols"><div class="panel pf-bars">' + head + cbHead('DPS', 'vs usual', '', ' pf-wr') + bars +
    '<details class="howit"><summary>How it works</summary><div>A window is a stretch where damage counts most: Bloodlust\'s 40 seconds, and the fight\'s own (a damage amp, a shield to break, an intermission). Each bar is the player\'s damage per second while alive in it, damage soaked by a boss shield included; the white tick is their own rate over the whole pull, so a bar past its tick means they pushed. ×1.40 means 40% more than their usual; under ×0.95 is orange, since a window should be above it. ▲ is a big cooldown pressed for it (up to 3 seconds before), "pot" a combat potion (up to 25 seconds before). Click a name for their breakdown.</div></details></div>' +
    '<div class="panel pf-det">' + side + '</div></div>';
}

// Damage into the targets pick() takes (by name), in the window: per player, the raid's total, and per second for the chart
function tgtDamage(ps, w0, w1, pick) {
  const i0 = Math.max(0, Math.floor(w0)), per = new Map(); let total = 0;
  for (const p of ps) { const a = p.dmgTS || []; let s = 0; for (let i = i0; i < Math.min(a.length, Math.ceil(w1)); i++) { const o = a[i]; if (o) for (const n in o) if (pick(n)) s += o[n]; } if (s) { per.set(p.name, s); total += s; } }
  const series = (p, end) => { const out = []; for (const q of p ? [p] : ps) (q.dmgTS || []).forEach((o, i) => { if (i >= end || !o) return; let s = 0; for (const n in o) if (pick(n)) s += o[n]; out[i] = (out[i] || 0) + s; }); for (let i = 0; i < Math.ceil(end); i++) out[i] = out[i] || 0; return out; };
  return { per, total, series };
}
// Damage into the adds that have to die (the boss module's list, plus adds that die on a timer; or, for a boss with no
// list, any other target that took 3% of the raid's damage), in the window: per player, per add, and per second for the
// chart. panel(): with nobody picked, each add and who hit it most.
function addsDamage(r, ps, w0, w1, bossN) {
  const focus = new Set([...(r.focus || []), ...bossN]), listN = (r.priority || []).concat(r.useful || []), i0 = Math.max(0, Math.floor(w0));
  const all = new Map(); for (const p of ps) { const a = p.dmgTS || []; for (let i = i0; i < Math.min(a.length, Math.ceil(w1)); i++) { const o = a[i]; if (o) for (const n in o) all.set(n, (all.get(n) || 0) + o[n]); } }
  const tot = [...all.values()].reduce((s, v) => s + v, 0) || 1;
  const prio = new Set(listN.length ? listN.filter((n) => all.has(n)) : [...all].filter(([n, v]) => !focus.has(n) && v >= 0.03 * tot).map(([n]) => n));
  const per = new Map(), byAdd = new Map();
  for (const p of ps) { const a = p.dmgTS || []; let s = 0; for (let i = i0; i < Math.min(a.length, Math.ceil(w1)); i++) { const o = a[i]; if (o) for (const n in o) if (prio.has(n)) { s += o[n]; let m = byAdd.get(n); if (!m) byAdd.set(n, m = new Map()); m.set(p, (m.get(p) || 0) + o[n]); } } if (s) per.set(p.name, s); }
  const total = [...per.values()].reduce((s, v) => s + v, 0), label = (r.priority || []).length ? 'the adds that have to die' : 'the adds';
  const barList = (items, color) => { const mx = Math.max(1, ...items.map((x) => x.v)); return items.map((x) => '<div class="pf-a"><span class="pf-an">' + x.html + '</span><span class="pf-ab"><i style="width:' + (100 * x.v / mx).toFixed(1) + '%;background:' + color + '"></i></span><b>' + C(x.v) + '</b></div>').join(''); };
  const series = (p, end) => { const out = [], list = p ? [p] : ps; for (const q of list) (q.dmgTS || []).forEach((o, i) => { if (i >= end || !o) return; let s = 0; for (const n in o) if (prio.has(n)) s += o[n]; out[i] = (out[i] || 0) + s; }); for (let i = 0; i < Math.ceil(end); i++) out[i] = out[i] || 0; return out; };
  const panel = () => '<h3 class="nh"><span>Each add</span><small>' + esc(label) + ', and who hit it most</small></h3>' +
    barList([...byAdd].map(([n, m]) => ({ n, v: [...m.values()].reduce((s, x) => s + x, 0), top: [...m].sort((a, b) => b[1] - a[1]).slice(0, 3) })).sort((a, b) => b.v - a.v)
      .map((x) => ({ html: esc(x.n) + '<div class="sub">' + x.top.map(([p, v]) => '<span class="nm" style="color:' + p.color + '">' + esc(p.name) + '</span> ' + Math.round(100 * v / Math.max(1, x.v)) + '%').join(', ') + '</div>', v: x.v })), PERF_COL.dmg) +
    '<p class="sub" style="margin:10px 0 0">Pick a player for their own targets. ' + ((r.priority || []).length ? '' : 'No list of adds for this boss yet: every add that took 3% of the raid\'s damage counts.') + '</p>';
  return { prio, per, byAdd, total, label, series, panel };
}
// Targets: where each player's damage went (the boss and what shares its health; the adds that have to die; everything
// else), how fast each DPS got onto those adds after the raid's first hit on them, each set of them, and the raid's
// damage by target over time
const TG_COL = ['#b07cf0', '#e07ab8', '#5fd3c4', '#d98c5f', '#c9ced8'];
function perfTargets(r, ps, w0, w1, bossN) {
  const focus = new Set([...(r.focus || []), ...bossN]), listN = r.priority || [];
  const tgtOf = (p) => { const m = new Map(), a = p.dmgTS || []; for (let i = Math.max(0, Math.floor(w0)); i < Math.min(a.length, Math.ceil(w1)); i++) { const o = a[i]; if (o) for (const n in o) m.set(n, (m.get(n) || 0) + o[n]); } return m; };
  const per = ps.map((p) => ({ p, m: tgtOf(p) })).filter((x) => x.m.size), all = new Map(); for (const x of per) for (const [n, v] of x.m) all.set(n, (all.get(n) || 0) + v);
  const tot = [...all.values()].reduce((s, v) => s + v, 0) || 1;
  // (a boss with no list: any other target that took 3% of the raid's damage counts as an add that matters)
  const prio = new Set(listN.length ? listN.filter((n) => all.has(n)) : [...all].filter(([n, v]) => !focus.has(n) && v >= 0.03 * tot).map(([n]) => n));
  // (adds that die on a timer, like Ula'tek's Wretch: useful damage, but not judged on switch speed)
  const timed = new Set((r.useful || []).filter((n) => all.has(n)));
  const cat = (n) => (focus.has(n) ? 0 : prio.has(n) || timed.has(n) ? 1 : 2), addW = listN.length ? 'priority adds' : 'adds';
  // each set of priority adds: same name, the raid's first hits on them within 8 seconds of each other
  const first = new Map(); for (const x of per) for (const [g, t] of x.p.firstHit) if (t >= w0 - 0.5 && t <= w1 && prio.has(r.unitNames.get(g))) first.set(g, Math.min(first.has(g) ? first.get(g) : Infinity, t));
  const byN = new Map(); for (const [g, t] of first) { const n = r.unitNames.get(g); if (!byN.has(n)) byN.set(n, []); byN.get(n).push([g, t]); }
  const sets = []; for (const [n, l] of byN) { l.sort((a, b) => a[1] - b[1]); let cur = null; for (const [g, t] of l) { if (!cur || t - cur.t0 > 8) sets.push(cur = { name: n, t0: t, gs: [] }); cur.gs.push(g); } }
  sets.sort((a, b) => a.t0 - b.t0);
  const dps = per.filter((x) => (x.p.role || 'dps') === 'dps'), sw = new Map(dps.map((x) => [x.p.name, []]));
  for (const s of sets) {
    const ds = s.gs.map((g) => (r.enemyDied || new Map()).get(g)); s.dead = ds.every((d) => d != null) ? Math.max(...ds) : null; s.until = s.dead != null ? Math.min(s.dead, w1) : w1; s.on = []; s.miss = [];
    if (s.until - s.t0 < 6) continue; // (died too fast for anyone to need to switch)
    for (const x of dps) { if (aliveSecs(r, x.p, s.t0, s.t0 + 6) < 5) continue;
      const f = Math.min(...s.gs.map((g) => x.p.firstHit.get(g)).filter((t) => t != null && t <= s.until + 0.5));
      if (isFinite(f)) { s.on.push([x.p, Math.max(0, f - s.t0)]); sw.get(x.p.name).push(Math.max(0, f - s.t0)); } else { s.miss.push(x.p); sw.get(x.p.name).push(null); } }
  }
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[(s.length - 1) >> 1] : null; };
  const { has, list } = lensRows(per.map((x) => x.p)), keep = new Set(list);
  const rows = per.filter((x) => keep.has(x.p)).map((x) => { const c = [0, 0, 0]; for (const [n, v] of x.m) c[cat(n)] += v; const t = c[0] + c[1] + c[2], l = sw.get(x.p.name) || [], hit = l.filter((v) => v != null);
    return { p: x.p, c, t, prioShare: t ? c[1] / t : 0, med: med(hit), hit: hit.length, of: l.length }; }).filter((x) => x.t > 0).sort((a, b) => b.t - a.t);
  const mxT = Math.max(1, ...rows.map((x) => x.t)), CC = ['#6aa8ff', '#b07cf0', '#6c7381'];
  const bars = rows.map((x) => '<div class="pf-tg-r" data-n="' + esc(x.p.name) + '" tabindex="0" role="button"><span class="pf-tg-n">' + pfName(x.p) + '</span><span class="pf-bar pf-tgb">' + x.c.map((v, i) => (v > 0 ? '<i style="width:' + (100 * v / mxT).toFixed(1) + '%;background:' + CC[i] + '" title="' + esc(['Boss', capS(addW), 'Other'][i] + ': ' + C(v)) + '"></i>' : '')).join('') + '</span>' +
    '<span class="pf-tg-v"><b>' + (prio.size ? Math.round(100 * x.prioShare) + '%' : '—') + '</b><span class="sub">' + (x.of ? (x.med != null ? 'on in ' + x.med.toFixed(1) + 's' : 'none hit') + ' · ' + x.hit + ' of ' + x.of : '') + '</span></span></div>').join('');
  const setRows = sets.filter((s) => s.on.length + s.miss.length).map((s) => { const m = med(s.on.map(([, d]) => d)), late = s.on.filter(([, d]) => d >= 6), st = !s.on.length || (m != null && m >= 4) ? 'warn' : 'ok';
    return ckLine(st, '<b>' + esc(s.name) + (s.gs.length > 1 ? ' ×' + s.gs.length : '') + '</b> at ' + T(s.t0) + ' <span class="sub">' + (s.dead != null && s.dead <= w1 ? 'dead in ' + Math.round(s.dead - s.t0) + 's' : 'still up at ' + T(w1)) + ' · ' + s.on.length + ' DPS on it' + (m != null ? ', half within ' + m.toFixed(1) + 's' : '') + '</span>' +
      // (a few names stand out; a long list is usually the plan, e.g. the raid split in two sides, so it's just a count)
      (late.length ? '<span class="sub"> · ' + (late.length <= 3 ? 'slow: ' + late.map(([p, d]) => '<span class="nm" style="color:' + p.color + '">' + esc(p.name) + '</span> ' + d.toFixed(0) + 's').join(', ') : late.length + ' took 6s or more') + '</span>' : '') +
      (s.miss.length ? '<span class="sub"> · ' + (s.miss.length <= 3 ? 'never hit it: ' + s.miss.map((p) => '<span class="nm" style="color:' + p.color + '">' + esc(p.name) + '</span>').join(', ') : s.miss.length + ' DPS never hit it') + '</span>' : '')); }).join('');
  const shareOf = (k) => rows.reduce((s, x) => s + x.c[k], 0);
  const lg = '<span class="pfc-lg"><span><i class="lg-sq" style="background:' + CC[0] + '"></i>boss</span><span><i class="lg-sq" style="background:' + CC[1] + '"></i>' + addW + '</span><span><i class="lg-sq" style="background:' + CC[2] + '"></i>other</span><span class="sub">% = their share into ' + addW + '</span></span>';
  return '<div class="panel pf-chart">' + tgtChart(r, w0, w1, cat) + '</div>' +
    '<div class="pf-cols"><div class="panel pf-lp">' + lensHead('Where the damage went', prio.size ? Math.round(100 * shareOf(1) / Math.max(1, shareOf(0) + shareOf(1) + shareOf(2))) + '% of it into ' + addW : '', roleChips(has)) + lg + (bars || '<p class="muted">No damage recorded.</p>') + '</div>' +
    '<div class="panel pf-det pf-sets"><h3 class="nh"><span>' + capS(addW) + ', set by set</span></h3>' + (prio.size ? '<div class="pf-hint">' + esc([...prio].join(', ')) + (listN.length ? '' : ' (no list for this boss yet: every add that took 3% of the damage)') + (timed.size ? '<br>' + esc([...timed].join(', ')) + ' counts as useful damage but isn\'t timed here: it dies on its own clock (see Mechanics)' : '') + '</div>' : '') +
      (setRows || '<p class="muted">' + (prio.size ? 'No set stayed up long enough to need a switch.' : 'No adds that matter were up here.') + '</p>') +
      '<details class="howit"><summary>How it works</summary><div>A set is the same add spawning together (the raid\'s first hits on them within 8 seconds). Each DPS\'s time is from the raid\'s first hit on the set to their own first hit on any of it, so time the add spent unattackable isn\'t counted. Sets that died within 6 seconds, and players dead when it spawned, aren\'t judged. "Half within" is the middle DPS\'s time; 6 seconds or more is marked slow. Some DPS are told to stay on the boss: read this with your plan.</div></details></div></div>';
}
// the raid's damage by target over time: the five biggest targets stacked (and the rest as Other), 5-second buckets
function tgtChart(r, w0, w1, cat) {
  const B = 5, a = r.dmgTS || [], i0 = Math.max(0, Math.floor(w0)), i1 = Math.min(a.length, Math.ceil(w1)), sums = new Map();
  for (let i = i0; i < i1; i++) { const o = a[i]; if (o) for (const n in o) sums.set(n, (sums.get(n) || 0) + o[n]); }
  if (!sums.size) return '<p class="muted">No damage recorded.</p>';
  const top = [...sums].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([n]) => n).sort((x, y) => cat(x) - cat(y) || sums.get(y) - sums.get(x));
  const keys = top.concat(sums.size > top.length ? ['Other'] : []), nb = Math.max(1, Math.ceil((w1 - w0) / B)), bk = keys.map(() => new Array(nb).fill(0));
  for (let i = i0; i < i1; i++) { const o = a[i]; if (!o) continue; const b = Math.min(nb - 1, Math.floor((i - w0) / B)); for (const n in o) { let k = top.indexOf(n); if (k < 0) k = keys.length - 1; bk[k][b] += o[n] / B; } }
  let pi = 0; const colOf = (n) => (n === 'Other' ? '#4a505d' : cat(n) === 0 ? (top.filter((x) => cat(x) === 0).indexOf(n) ? '#4a7fc4' : '#6aa8ff') : cat(n) === 1 ? TG_COL[pi++ % TG_COL.length] : '#7d8494');
  const cols = keys.map(colOf);
  const narrow = (document.documentElement.clientWidth || 1000) < 700, W = narrow ? 420 : 1000, H = narrow ? 200 : 150, L = narrow ? 40 : 46, R = 8, Tp = 12, Bm = 20, iw = W - L - R, ih = H - Tp - Bm, span = Math.max(1, w1 - w0);
  const stack = []; for (let b = 0; b < nb; b++) { let s = 0; stack.push(keys.map((_, k) => (s += bk[k][b]))); }
  const top1 = Math.max(1, ...stack.map((x) => x[x.length - 1])), mx = top1 * 1.08, X = (t) => L + ((t - w0) / span) * iw, Y = (v) => Tp + ih - (v / mx) * ih, xb = (b) => X(w0 + (b + 0.5) * B);
  let s = '<svg class="pfc" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Damage by target over time">';
  const phs = (r.module && !r.module.error && r.module.phases) || [];
  phs.forEach((q, i) => { if (q.start >= w1 || (isFinite(q.end) && q.end <= w0)) return; const x0 = X(Math.max(w0, q.start)), x1 = X(Math.min(w1, isFinite(q.end) ? q.end : w1)); s += '<rect x="' + x0.toFixed(1) + '" y="' + Tp + '" width="' + Math.max(0, x1 - x0).toFixed(1) + '" height="' + ih + '" class="pfc-ph p' + (i % 2) + '"/><text x="' + (x0 + 5).toFixed(1) + '" y="' + (Tp + 11) + '" class="pfc-pl">' + esc(phLab(q, (x1 - x0) * onScreen(W))) + '</text>'; });
  for (const f of [0.5, 1]) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(top1 * f).toFixed(1) + '" y2="' + Y(top1 * f).toFixed(1) + '" class="pfc-g"/><text x="' + (L - 6) + '" y="' + (Y(top1 * f) + 4).toFixed(1) + '" class="pfc-y" text-anchor="end">' + C(top1 * f) + '</text>';
  const off = (n) => (S.tgtHide && S.tgtHide.has(n) ? ' off' : '');
  for (let k = keys.length - 1; k >= 0; k--) { const up = stack.map((x, b) => xb(b).toFixed(1) + ',' + Y(x[k]).toFixed(1)), dn = stack.map((x, b) => xb(b).toFixed(1) + ',' + Y(k ? x[k - 1] : 0).toFixed(1)).reverse();
    s += '<polygon points="' + up.concat(dn).join(' ') + '" style="fill:' + cols[k] + '" class="tg-a' + off(keys[k]) + '" data-n="' + esc(keys[k]) + '"/>'; }
  s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (Tp + ih) + '" y2="' + (Tp + ih) + '" class="pfc-ax"/>';
  const step = span > 400 || (narrow && span > 150) ? 60 : 30; for (let t = Math.ceil(w0 / step) * step; t <= w1; t += step) s += '<text x="' + X(t).toFixed(1) + '" y="' + (H - 5) + '" class="pfc-x" text-anchor="middle">' + T(t) + '</text>';
  s += '<line class="pfx-hv" x1="0" x2="0" y1="' + Tp + '" y2="' + (Tp + ih) + '" style="display:none"/></svg>';
  const tot = [...sums.values()].reduce((q, v) => q + v, 0) || 1;
  // (the hover readout: each target's damage per second in that 5-second step)
  const ser = keys.map((n, k) => ({ n, l: n, c: cols[k], p: bk[k].map((v, b) => [w0 + b * B, Math.round(v)]) }));
  return '<h3 class="nh"><span class="pfc-ttl">Raid damage by target</span><small>per second, 5-second steps · hover for numbers, click a target to hide it</small><span class="pfc-lg">' + keys.map((n, k) => '<span class="tg-lg' + off(n) + '" data-tn="' + esc(n) + '" role="button" tabindex="0"><i class="lg-sq" style="background:' + cols[k] + '"></i>' + esc(n) + ' <b>' + Math.round(100 * (n === 'Other' ? [...sums].filter(([m]) => !top.includes(m)).reduce((q, [, v]) => q + v, 0) : sums.get(n)) / tot) + '%</b></span>').join('') + '</span></h3>' +
    '<div class="pfx" data-hx="' + esc(JSON.stringify({ L, iw, W, w0, span, ser })) + '">' + s + '<div class="pfc-tip" hidden></div></div>';
}

// Healers: each healer's mana over the pull beside the boss's health, and one plain line per healer. A healer's mana should
// come down about as fast as the boss's health and end as low as it can: running low early means they'll run out, ending
// a kill with a lot left means they could have healed harder. Then their healing per second and overhealing.
// (the boss's health over the pull, from advanced logging: the boss units, averaged when there are two, every 2 seconds)
function bossHpLine(r, end) {
  const names = new Set(r.bossUnits || []), U = [...(r.hpUnits || new Map()).values()].filter((u) => names.has(u.name) && u.samples.length > 3);
  if (!U.length) return null;
  const top = Math.max(...U.map((u) => u.max)), main = U.filter((u) => u.max >= 0.5 * top); // (the boss itself, not a small add with its name)
  const at = (u, t) => { let v = null; for (const [s, p] of u.samples) { if (s > t) break; v = p; } return v == null ? 1 : v; };
  const out = []; for (let t = 0; t <= end + 1; t += 2) out.push([t, main.reduce((s, u) => s + at(u, t), 0) / main.length]);
  return out;
}
function perfHealers(r, ps, w0, w1, end) {
  const hs = ps.filter((p) => p.role === 'healer' && (p.healing > 0 || p.casts));
  if (!hs.length) return '<div class="panel pf-lp"><p class="muted">No healers found in this pull.</p></div>';
  const pc = perfContext(r), manaOk = hs.some((p) => (p.mana || []).length >= 4), boss = bossHpLine(r, end), kill = r.item.kill && w1 >= end - 0.5;
  const bAt = (t) => { if (!boss) return null; let v = boss[0][1]; for (const [s, x] of boss) { if (s > t) break; v = x; } return v; };
  const pct = (v) => Math.round(100 * v) + '%', dur = (s) => (s < 60 ? Math.round(s) + 's' : T(s));
  const rows = hs.map((p) => { const x = pc.per.get(p.name), t1 = Math.min(w1, x ? x.until : end);
    const ms = (p.mana || []).filter(([t]) => t >= w0 - 2 && t <= t1 + 0.5), last = ms.length ? ms[ms.length - 1] : null;
    // (time under 25% and when it started; time well ahead of the boss: under 40% with the boss 25 points higher)
    let low = 0, lowAt = null, fast = 0, fastAt = null;
    for (let i = 1; i < ms.length; i++) { const dt = ms[i][0] - ms[i - 1][0], v = ms[i - 1][1], b = bAt(ms[i - 1][0]); if (v < 0.25) { low += dt; if (lowAt == null) lowAt = ms[i - 1][0]; } if (b != null && v < 0.4 && b - v > 0.25) { fast += dt; if (!fastAt) fastAt = [ms[i - 1][0], v, b]; } }
    return { p, hps: rateIn(r, p, p.healS || [], w0, w1) || 0, over: p.overheal / Math.max(1, p.healing + p.overheal), last, low, lowAt, fast, fastAt, bEnd: last ? bAt(last[0]) : null, gone: t1 < w1 - 0.05, t1, pots: p.cons.manapot.filter((u) => u.t >= w0 && u.t <= w1), ms };
  }).sort((a, b) => b.hps - a.hps);
  // (a second healer of the same class gets a dashed line, so two druids can be told apart)
  { const seen = new Map(); for (const x of rows) { const n = seen.get(x.p.cls) || 0; x.dash = n > 0; seen.set(x.p.cls, n + 1); } }
  const verdict = (x) => {
    if (!x.last) return { st: 'na', pill: 'No mana', txt: 'No mana in this pull.' };
    const pot = x.pots.length ? ' Mana potion at ' + x.pots.map((u) => T(u.t)).join(', ') + '.' : '', died = x.gone ? ' Died at ' + T(x.t1) + ' with ' + pct(x.last[1]) + '.' : '';
    if (x.low >= 8) return { st: 'warn', pill: x.low >= 30 ? 'Ran low' : 'Dipped low', txt: 'Under 25% for ' + dur(x.low) + ', from ' + T(x.lowAt) + '.' + (pot || ' No mana potion.') + died, low: true };
    if (x.fast >= 20) return { st: 'warn', pill: 'Spent fast', txt: 'Mana ran ahead of the boss: ' + pct(x.fastAt[1]) + ' with the boss at ' + pct(x.fastAt[2]) + ', at ' + T(x.fastAt[0]) + '.' + pot + died, fast: true };
    // (dying in the wipe's last seconds still counts: that's mana the raid died with)
    if (!(x.gone && x.t1 < w1 - 15) && x.bEnd != null && x.last[1] - x.bEnd > 0.3) return { st: 'warn', pill: 'Mana to spare', txt: (kill ? 'Ended the kill with ' + pct(x.last[1]) + ' mana' : (x.gone ? 'Died at ' + T(x.t1) + ' with ' : 'Had ') + pct(x.last[1]) + ' mana, the boss at ' + pct(x.bEnd)) + ': room to heal harder.' + pot, spare: true };
    return { st: 'ok', pill: 'On pace', txt: (x.bEnd != null ? 'Mana came down with the boss\'s health' : 'Never under 25%') + (x.gone ? '.' + died : '; ended with ' + pct(x.last[1]) + '.') + pot };
  };
  for (const x of rows) x.v = verdict(x);
  // (the list: whoever has something to look at first, then by healing)
  const listed = rows.slice().sort((a, b) => (a.v.st === 'warn' ? 0 : 1) - (b.v.st === 'warn' ? 0 : 1) || b.hps - a.hps);
  // the pull in one line
  const nLow = rows.filter((x) => x.v.low), nNoPot = nLow.filter((x) => !x.pots.length).length, nSpare = rows.filter((x) => x.v.spare).length, nFast = rows.filter((x) => x.v.fast).length;
  const parts = [];
  if (nLow.length) parts.push(plural(nLow.length, 'healer') + ' ran low on mana' + (nNoPot === nLow.length ? (nLow.length === 1 ? ', with no mana potion' : nLow.length === 2 ? ', and neither used a mana potion' : ', and none used a mana potion') : nNoPot ? ', ' + nNoPot + ' without a mana potion' : ''));
  if (nFast) parts.push(plural(nFast, 'healer') + ' spent mana faster than the boss lost health');
  if (nSpare) parts.push(plural(nSpare, 'healer') + (kill ? ' ended the kill with mana to spare' : ' had mana to spare'));
  const sum = !manaOk ? '' : parts.length ? parts.join('; ') + '.' : boss ? 'Every healer\'s mana kept pace with the boss\'s health.' : 'No healer ran low on mana.';
  const sumH = sum ? '<p class="hm-sum ' + (nLow.length || nFast || nSpare ? 'warn' : 'ok') + '">' + (nLow.length || nFast || nSpare ? '! ' : '✓ ') + esc(sum) + '</p>' : '';
  // (what their mana went on, from each cast's cost: the top spells as a share of all they spent, the whole list on open)
  const useOf = (x) => { const m = new Map(); let tot = 0; for (const u of x.p.manaUse || []) { if (u.t < w0 - 0.5 || u.t > x.t1 + 0.5) continue; const o = m.get(u.spell) || { spell: u.spell, id: u.id, c: 0, n: 0 }; o.c += u.cost; o.n++; m.set(u.spell, o); tot += u.cost; } return { tot, list: [...m.values()].sort((a, b) => b.c - a.c) }; };
  const useH = (x) => { const u = useOf(x); if (!u.tot) return ''; const sh = (o) => Math.round(100 * o.c / u.tot) + '%';
    return '<details class="hm-use"><summary><span class="sub">Mana went on</span> ' + u.list.slice(0, 3).map((o) => spell(o.id, o.spell) + ' <b>' + sh(o) + '</b>').join('<span class="sub"> · </span>') + (u.list.length > 3 ? ' <span class="sub">· ' + (u.list.length - 3) + ' more</span>' : '') + '</summary>' +
      '<div class="hm-ut"><div class="hm-uh"><span>Spell</span><span>Casts</span><span>Each</span><span>Share</span></div>' + u.list.map((o) => '<div class="hm-ur"><span>' + spell(o.id, o.spell) + '</span><span>' + o.n + '</span><span title="mana per cast, of their whole mana bar">' + (100 * o.c / o.n).toFixed(1) + '%</span><span><i style="width:' + Math.round(100 * o.c / u.list[0].c) + '%;background:' + x.p.color + '"></i><b>' + sh(o) + '</b></span></div>').join('') +
      '<div class="sub hm-un">In all they spent ' + (u.tot).toFixed(1) + ' full bars of mana (it comes back as they regenerate, and from potions). "Each" is one cast\'s cost, as a share of their whole bar.</div></div></details>'; };
  const list = '<div class="hm-rows">' + listed.map((x) => '<div class="hm-r"><div class="hm-w">' + avatar(x.p) + '<span class="hm-wn"><span class="nm" style="color:' + x.p.color + '">' + esc(x.p.name) + '</span><span class="sub">' + esc(x.p.specName || '') + '</span></span></div>' +
    '<div class="hm-t">' + (manaOk ? '<span class="hm-p ' + x.v.st + '">' + x.v.pill + '</span>' + esc(x.v.txt) : '') + useH(x) + '</div><div class="hm-n"><b>' + C(x.hps) + '</b> healing/s<br><span class="sub">' + pct(x.over) + ' overheal</span></div></div>').join('') + '</div>';
  return '<div class="panel pf-chart pf-mana">' + (manaOk ? manaChart(r, rows, w0, w1, boss) + sumH : '<h3 class="nh"><span class="pfc-ttl">Healer mana</span></h3><p class="muted">' + (r.item.wcl ? 'No mana came with this pull.' : 'No mana was logged for this pull (turn on advanced combat logging).') + '</p>') + list +
    '<details class="howit"><summary>How it works</summary><div>Mana comes from each healer\'s casts, every 2 seconds at most, up to the wipe filter. The aim is for mana to come down about as fast as the boss\'s health (the grey line) and end as low as it can. <b>Ran low</b>: under 25% for 8 seconds or more. <b>Spent fast</b>: under 40% while the boss still had 25 points more health. <b>Mana to spare</b>: 30 points more mana than the boss had health at the end, so there was room to heal harder. Overhealing is shown, never counted.</div></details></div>';
}
// every healer's mana over the window, one line each in their class colour (dashed for a second healer of the same class),
// the boss's health in grey, names at the right end of each line, a circle where they drank a mana potion and a cross
// where they died; the band under 25% is shaded
function manaChart(r, rows, w0, w1, boss) {
  const narrow = (document.documentElement.clientWidth || 1000) < 700, W = narrow ? 420 : Math.max(760, Math.min(1500, Math.round(chartPx(false)))), H = narrow ? 210 : 190, L = narrow ? 34 : 44, R = narrow ? 70 : 96, Tp = 12, Bm = 20, iw = W - L - R, ih = H - Tp - Bm, span = Math.max(1, w1 - w0);
  const X = (t) => L + ((Math.min(w1, Math.max(w0, t)) - w0) / span) * iw, Y = (v) => Tp + ih - v * ih;
  let s = '<svg class="pfc" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Healer mana and the boss\'s health">';
  const phs = (r.module && !r.module.error && r.module.phases) || [];
  phs.forEach((q, i) => { if (q.start >= w1 || (isFinite(q.end) && q.end <= w0)) return; const x0 = X(Math.max(w0, q.start)), x1 = X(Math.min(w1, isFinite(q.end) ? q.end : w1)); s += '<rect x="' + x0.toFixed(1) + '" y="' + Tp + '" width="' + Math.max(0, x1 - x0).toFixed(1) + '" height="' + ih + '" class="pfc-ph p' + (i % 2) + '"/><text x="' + (x0 + 4).toFixed(1) + '" y="' + (Tp + 10) + '" class="pfc-pl">' + esc(phLab(q, (x1 - x0) * onScreen(W))) + '</text>'; });
  s += '<rect x="' + L + '" y="' + Y(0.25).toFixed(1) + '" width="' + iw + '" height="' + (Y(0) - Y(0.25)).toFixed(1) + '" class="mp-lo"/>';
  for (const f of [0.25, 0.5, 1]) s += '<line x1="' + L + '" x2="' + (L + iw) + '" y1="' + Y(f).toFixed(1) + '" y2="' + Y(f).toFixed(1) + '" class="pfc-g' + (f === 0.25 ? ' lo' : '') + '"/><text x="' + (L - 5) + '" y="' + (Y(f) + 4).toFixed(1) + '" class="pfc-y" text-anchor="end">' + Math.round(100 * f) + '%</text>';
  s += '<line x1="' + L + '" x2="' + (L + iw) + '" y1="' + (Tp + ih) + '" y2="' + (Tp + ih) + '" class="pfc-ax"/>';
  // (each line is its own group: clicking a name at the right hides or shows it; the hover readout reads `ser`)
  const tags = [], ser = [], off = (n) => (S.manaHide && S.manaHide.has(n) ? ' off' : '');
  if (boss) { const bp = boss.filter(([t]) => t >= w0 && t <= w1); if (bp.length >= 2) { s += '<g class="mp-s' + off('__boss') + '" data-n="__boss"><polyline points="' + bp.map(([t, v]) => X(t).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ') + '" class="mp-boss"/></g>'; tags.push({ y: Y(bp[bp.length - 1][1]), html: 'Boss', cls: 'mp-bt', n: '__boss' }); ser.push({ n: '__boss', l: 'Boss health', c: '#8b93a3', p: bp.map(([t, v]) => [t, +v.toFixed(3)]) }); } }
  for (const x of rows) { const pts = x.ms.filter(([t]) => t >= w0 && t <= w1); if (pts.length < 2) continue;
    s += '<g class="mp-s' + off(x.p.name) + '" data-n="' + esc(x.p.name) + '"><polyline points="' + pts.map(([t, v]) => X(t).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ') + '" class="pfc-l" style="stroke:' + x.p.color + (x.dash ? ';stroke-dasharray:6 4' : '') + '"/>';
    tags.push({ y: Y(pts[pts.length - 1][1]), html: esc(x.p.name), col: x.p.color, n: x.p.name }); ser.push({ n: x.p.name, l: x.p.name, c: x.p.color, p: pts.map(([t, v]) => [t, +v.toFixed(3)]) });
    for (const u of x.pots) { const near = pts.reduce((m, y) => (Math.abs(y[0] - u.t) < Math.abs(m[0] - u.t) ? y : m)); s += '<circle cx="' + X(u.t).toFixed(1) + '" cy="' + Y(near[1]).toFixed(1) + '" r="3.5" class="mp-pot" style="stroke:' + x.p.color + '"><title>' + esc(x.p.name + ': mana potion at ' + T(u.t)) + '</title></circle>'; }
    for (const d of r.deaths) if (d.guid === x.p.guid && d.t >= w0 && d.t <= w1) { const v = (pts.filter(([t]) => t <= d.t).pop() || pts[0])[1]; s += '<text x="' + X(d.t).toFixed(1) + '" y="' + (Y(v) + 4).toFixed(1) + '" class="mp-d" text-anchor="middle" style="fill:' + x.p.color + '">✕<title>' + esc(x.p.name + ' died at ' + T(d.t)) + '</title></text>'; }
    s += '</g>'; }
  // (the names at the right end of the lines, pushed apart so they never overlap; each one hides or shows its line)
  const gap = narrow ? 12 : 13; tags.sort((a, b) => a.y - b.y);
  for (let i = 1; i < tags.length; i++) tags[i].y = Math.max(tags[i].y, tags[i - 1].y + gap);
  const over = tags.length ? tags[tags.length - 1].y - (Tp + ih) : 0; if (over > 0) for (const g of tags) g.y -= over;
  for (const g of tags) s += '<text x="' + (L + iw + 6) + '" y="' + (g.y + 4).toFixed(1) + '" class="mp-nm mp-tg' + (g.cls ? ' ' + g.cls : '') + off(g.n) + '" data-n="' + esc(g.n) + '"' + (g.col ? ' style="fill:' + g.col + '"' : '') + '><title>Click to hide or show this line</title>' + g.html + '</text>';
  const step = span > 400 || narrow ? 60 : 30; for (let t = Math.ceil(w0 / step) * step; t <= w1; t += step) s += '<text x="' + X(t).toFixed(1) + '" y="' + (H - 5) + '" class="pfc-x" text-anchor="middle">' + T(t) + '</text>';
  s += '<line class="pfx-hv" x1="0" x2="0" y1="' + Tp + '" y2="' + (Tp + ih) + '" style="display:none"/></svg>';
  return '<h3 class="nh"><span class="pfc-ttl">Healer mana</span><small>' + (boss ? 'beside the boss\'s health (grey) · ' : '') + '○ mana potion · ✕ death · shaded: under 25% · hover for numbers, click a name to hide it</small></h3>' +
    '<div class="pfx" data-hx="' + esc(JSON.stringify({ L, iw, W, w0, span, ser, pct: true })) + '">' + s + '<div class="pfc-tip" hidden></div></div>';
}
// A chart's hover readout (the mana and target charts): a line at the pointer, and in a box the time and every shown
// line's value there, biggest first. A mouse shows it on hover; a finger taps or drags along the chart.
function bindHoverCharts() {
  $$('.pfx[data-hx]').forEach((w) => {
    const o = JSON.parse(w.dataset.hx), svg = w.querySelector('svg'), tip = w.querySelector('.pfc-tip'), hv = svg.querySelector('.pfx-hv');
    const at = (p, t) => { let v = null; for (const q of p) { if (q[0] > t + 1) break; v = q[1]; } return v; };
    const fmt = (v) => (o.pct ? Math.round(100 * v) + '%' : C(v) + '/s');
    const clear = () => { tip.hidden = true; if (hv) hv.style.display = 'none'; };
    const show = (e) => { const b = svg.getBoundingClientRect(), x = (e.clientX - b.left) * (o.W / b.width), t = o.w0 + ((x - o.L) / o.iw) * o.span;
      if (x < o.L || x > o.L + o.iw) { clear(); return; }
      const hid = new Set([...w.querySelectorAll('.mp-s.off, .tg-a.off')].map((g) => g.dataset.n));
      const vals = o.ser.filter((q) => !hid.has(q.n)).map((q) => [q, at(q.p, t)]).filter(([, v]) => v != null && (o.pct || v > 0)).sort((a, b) => b[1] - a[1]);
      if (!vals.length) { clear(); return; }
      if (hv) { hv.setAttribute('x1', x); hv.setAttribute('x2', x); hv.style.display = ''; }
      tip.innerHTML = '<div><b>' + T(Math.max(0, t)) + '</b></div>' + vals.map(([q, v]) => '<div><i class="lg-sq" style="background:' + q.c + '"></i> ' + esc(q.l) + ' <b>' + fmt(v) + '</b></div>').join('');
      tip.hidden = false; const px = e.clientX - b.left; tip.style.left = Math.max(0, Math.min(b.width - tip.offsetWidth, px + (px > b.width - 220 ? -tip.offsetWidth - 12 : 12))) + 'px'; };
    svg.onpointermove = show; svg.onpointerdown = show; svg.onpointerleave = (e) => { if (e.pointerType === 'mouse') clear(); };
    // (a name or legend entry hides or shows its line, remembered while you look around)
    w.parentElement.querySelectorAll('[data-n].mp-tg, .pfc-lg [data-tn]').forEach((el) => (el.onclick = (e) => { e.stopPropagation();
      const n = el.dataset.n || el.dataset.tn, key = o.pct ? 'manaHide' : 'tgtHide'; S[key] = S[key] || new Set(); if (S[key].has(n)) S[key].delete(n); else S[key].add(n);
      const on = !S[key].has(n); w.parentElement.querySelectorAll('[data-n="' + CSS.escape(n) + '"], [data-tn="' + CSS.escape(n) + '"]').forEach((x) => x.classList.toggle('off', !on)); }));
  });
}

// The picked player's casts under the timeline, on the same time axis: their big cooldowns (defensives on Damage taken)
// and their most-cast spells, a tick per cast; their key buffs (Bloodlust, Power Infusion, their cooldowns' own buffs) as
// bars; time dead shaded
function castStrip(r, p, kind) {
  const narrow = (document.documentElement.clientWidth || 1000) < 700, W = narrow ? 420 : 1000, L = narrow ? 40 : 46, Rm = 8, dur = Math.max(1, r.duration), pc = perfContext(r);
  const cds = kind === 'taken' ? bigDefs(r, p, dur) : bigCds(r, p, dur, pc.lust), cdN = new Set(cds.map((c) => c.name.toLowerCase()));
  const KEYB = new Set([...LUST_N, 'power infusion', ...cdN]);
  const buffs = [...p.buffs.values()].filter((b) => KEYB.has(b.name.toLowerCase()) && b.sp.length).sort((a, b) => a.sp[0][0] - b.sp[0][0]).slice(0, 4);
  const top = [...p.castAb.values()].filter((a) => !cdN.has(a.name.toLowerCase())).sort((a, b) => b.n - a.n).slice(0, 7);
  const dead = deadSpans(r, p).map(([a, b]) => '<rect x="' + a.toFixed(1) + '" y="0" width="' + Math.max(0, Math.min(dur, b) - a).toFixed(1) + '" height="10" class="cs-dd"/>').join('');
  const ico = (id, name, n) => '<span class="sp cs-i" data-sid="' + (id || 0) + '" data-sn="' + esc(name) + '" data-ex="' + esc(n) + '">' + spellIcon(id, name) + '</span>';
  const row = (lab, body, cls) => '<div class="cs-r' + (cls ? ' ' + cls : '') + '">' + lab + '<svg viewBox="0 0 ' + dur + ' 10" preserveAspectRatio="none" aria-hidden="true">' + dead + body + '</svg><span></span></div>';
  const ticks = (ts, c) => ts.map((t) => '<line x1="' + t.toFixed(2) + '" x2="' + t.toFixed(2) + '" y1="1" y2="9"' + (c ? ' style="stroke:' + c + '"' : '') + '/>').join('');
  let h = '';
  for (const b of buffs) h += row(ico(b.id, b.name, 'buff: ' + b.sp.length + ' time' + (b.sp.length === 1 ? '' : 's')), b.sp.map(([a, c]) => '<rect x="' + a.toFixed(1) + '" y="2.5" width="' + Math.max(0.5, c - a).toFixed(1) + '" height="5" rx=".5" class="cs-b"/>').join(''), 'bf');
  for (const c of cds) h += row(ico(c.id, c.name, 'pressed ' + c.ts.length + ' time' + (c.ts.length === 1 ? '' : 's')), ticks(c.ts, p.color), 'cd');
  for (const a of top) h += row(ico(a.id, a.name, a.n + ' cast' + (a.n === 1 ? '' : 's')), ticks(p.byName.get(a.name.toLowerCase()) || p.castTimes.get(a.id) || []));
  if (!h) return '';
  return '<div class="cs" style="--pl:' + (100 * L / W).toFixed(2) + '%;--pr:' + (100 * Rm / W).toFixed(2) + '%"><div class="cs-h">Their casts <span class="sub">' + (buffs.length ? 'key buffs as bars, then ' : '') + (kind === 'taken' ? 'defensives' : 'big cooldowns') + ' and most-cast spells · hover an icon</span></div>' + h + '</div>';
}

// Warcraft Logs parses for a kill from a report (fetched once, then the view redraws): name -> { pct }, or null
const PARSES = new Map();
function parsesFor(r, kind) {
  if (!r.item.wcl || !r.item.kill || kind === 'taken' || (!S.wclCreds && !WCL.HOSTED)) return null;
  const k = r.item.wcl.code + ':' + r.item.wcl.fight + ':' + kind;
  if (PARSES.has(k)) { const v = PARSES.get(k); return v instanceof Map ? v : null; }
  PARSES.set(k, 'loading');
  WCL.loadRankings(S.wclCreds, r.item, kind === 'heal' ? 'hps' : 'dps').then((m) => { PARSES.set(k, m); if (S.tab === 'perf' && S.rep === r && S.scope !== 'all' && (S.perfKind || 'dmg') === kind) perf(); })
    .catch((e) => { console.warn('Parses:', e && e.message); PARSES.set(k, new Map()); });
  return null;
}
// a parse as Warcraft Logs colours it
const prsCls = (v) => (v >= 100 ? 'q7' : v >= 99 ? 'q6' : v >= 95 ? 'q5' : v >= 75 ? 'q4' : v >= 50 ? 'q3' : v >= 25 ? 'q2' : 'q1');
const prsChip = (x) => (x && x.pct != null ? '<span class="prs ' + prsCls(x.pct) + '" title="Warcraft Logs parse: better than ' + Math.floor(x.pct) + '% of the same spec on this boss">' + Math.floor(x.pct) + '</span>' : '');
function bindPerf() {
  $$('.pfk-b').forEach((b) => (b.onclick = () => { if (b.classList.contains('on')) return; S.perfKind = b.dataset.k; perf(); }));
  $$('details.pf-dc').forEach((d) => d.addEventListener('toggle', () => { S.perfDcOpen = d.open; })); // (Damage checks stays open or closed as you left it)
  $$('.pfv .plsw button').forEach((b) => (b.onclick = () => { if (b.classList.contains('on')) return; S.scope = b.dataset.v; renderMain(); }));
  $$('.pfph button').forEach((b) => (b.onclick = () => { if (b.classList.contains('on')) return; S.perfPh = b.dataset.ph || null; perf(); }));
  $$('.pf-rf button').forEach((b) => (b.onclick = () => { if (b.classList.contains('on')) return; S.perfRole = b.dataset.r; perf(); }));
  $$('.pf-tg button').forEach((b) => (b.onclick = () => { if (b.classList.contains('on')) return; S.perfTgt = b.dataset.tg; perf(); }));
  // (Utility and Survivability: the kind switch, and a player's bar picks them; clicking it again shows the whole raid)
  const stOf = (b) => { const w = b.closest('[data-st]'); return w ? w.dataset.st : 'util'; };
  $$('.pfu-cat button').forEach((b) => (b.onclick = () => { if (b.classList.contains('on')) return; const st = stOf(b); S[st + 'Cat'] = b.dataset.c; S[st + 'Sel'] = null; renderMain(); refreshIcons(); }));
  $$('.pfu-bars .pf-row:not(.nb)').forEach((b) => (b.onclick = () => { const st = stOf(b); S[st + 'Sel'] = S[st + 'Sel'] === b.dataset.un ? null : b.dataset.un; renderMain(); refreshIcons(); }));
  $$('.pf-row:not(.nb)').forEach((b) => { if (!b.closest('.pfu-bars')) b.onclick = () => { S.perfSel = S.perfSel === b.dataset.n ? null : b.dataset.n; perf(); }; });
  for (const id of ['#pfRaid', '#pfClose']) { const b = $(id); if (b) b.onclick = () => { S.perfSel = null; perf(); }; }
  { const b = $('#pfCasts'); if (b) b.onclick = () => { S.perfCasts = !S.perfCasts; perf(); }; }
  $$('.pf-all').forEach((b) => (b.onclick = () => { S.perfMore = S.perfMore || {}; S.perfMore[b.dataset.k] = !S.perfMore[b.dataset.k]; perf(); }));
  $$('.pf-lens button').forEach((b) => (b.onclick = () => { if (b.classList.contains('on')) return; S.perfLens = b.dataset.l; perf(); }));
  $$('.hcd-sw button').forEach((b) => (b.onclick = () => { if (b.classList.contains('on')) return; S.hcdView = b.dataset.v; perf(); }));
  // (a name in any of the other views opens that player on Players)
  $$('[data-wi]').forEach((b) => (b.onclick = () => { if (b.classList.contains('on')) return; S.perfWin = +b.dataset.wi; perf(); }));
  $$('.pf-t tr[data-n], .pf-hn[data-n], .pf-tg-r[data-n], .pf-row.pf-wr[data-n]').forEach((el) => { const go = () => { S.perfSel = el.dataset.n; S.perfLens = 'players'; perf(); const c = $('.pf-cols'); if (c) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
    el.onclick = go; el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  // (the main chart's legend: each entry hides or shows its marks; the mana and target charts' readouts and switches)
  $$('.pf-main .pf-hk').forEach((el) => { const go = () => { const k = el.dataset.hk; S.pfcHide = S.pfcHide || new Set(); if (S.pfcHide.has(k)) S.pfcHide.delete(k); else S.pfcHide.add(k);
    el.classList.toggle('off', S.pfcHide.has(k)); el.closest('.pf-main').classList.toggle('hide-' + k, S.pfcHide.has(k)); };
    el.onclick = go; el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  bindHoverCharts();
  // the chart's readout: a line and a dot at the pointer, with the time, the value, the phase and what happened within 2
  // seconds. A mouse shows it on hover, and a click keeps it there (click again to move it, anywhere else to let go); a
  // finger taps or drags along the chart, and it stays until a tap somewhere else.
  const w = $('.pfc-w'); if (!w) return;
  const svg = w.querySelector('svg'), tip = w.querySelector('.pfc-tip'), hv = svg.querySelector('.pfc-hv'), hd = svg.querySelector('.pfc-hd');
  const sm = JSON.parse(w.dataset.s || '[]'), ev = JSON.parse(w.dataset.ev || '[]'), phs = JSON.parse(w.dataset.ph || '[]'), mx = +w.dataset.mx, tp = +w.dataset.tp, ih = +w.dataset.ih;
  const dur = +svg.dataset.dur, L = +svg.dataset.l, iw = +svg.dataset.iw, ICO = { m: '▮', d: '✕', l: '⚡', c: '▲' };
  let pinned = false, scrub = false;
  const clear = () => { pinned = false; tip.hidden = true; tip.classList.remove('pin'); hv.style.display = 'none'; hd.style.display = 'none'; };
  const pin = () => { pinned = true; tip.classList.add('pin'); };
  const show = (e) => { const b = svg.getBoundingClientRect(), x = (e.clientX - b.left) * (+svg.dataset.w / b.width), t = ((x - L) / iw) * dur; if (t < 0 || t > dur || !sm.length) { if (!pinned) clear(); return; }
    const hid = S.pfcHide || new Set(), i = Math.max(0, Math.min(sm.length - 1, Math.floor(t))), y = tp + ih - (sm[i] / mx) * ih, near = ev.filter(([u, , k]) => Math.abs(u - t) <= 2 && !hid.has(k)).slice(0, 4), phn = (phs.filter(([a]) => a <= t).pop() || [])[1];
    hv.setAttribute('x1', x); hv.setAttribute('x2', x); hv.style.display = ''; hd.setAttribute('cx', x); hd.setAttribute('cy', y); hd.style.display = i < sm.length ? '' : 'none';
    tip.innerHTML = '<div><b>' + T(t) + '</b>' + (phn ? ' <span class="sub">' + esc(phn) + '</span>' : '') + '</div><div>' + C(sm[i]) + ' per second</div>' + near.map(([, txt, k]) => '<div class="pfc-te ' + k + '">' + ICO[k] + ' ' + esc(txt) + '</div>').join('');
    tip.hidden = false; const px = e.clientX - b.left; tip.style.left = Math.max(0, Math.min(b.width - tip.offsetWidth, px + (px > b.width - 200 ? -tip.offsetWidth - 12 : 12))) + 'px'; };
  svg.onpointermove = (e) => { if (scrub || (e.pointerType === 'mouse' && !pinned)) show(e); };
  svg.onpointerleave = (e) => { if (e.pointerType === 'mouse' && !pinned) clear(); };
  svg.onpointerdown = (e) => {
    if (e.pointerType === 'mouse') { pinned = false; show(e); if (!tip.hidden) pin(); return; }
    scrub = true; pinned = false; show(e); try { svg.setPointerCapture(e.pointerId); } catch (x) { /* (fine without) */ }
  };
  svg.onpointerup = (e) => { if (e.pointerType !== 'mouse' && scrub) { scrub = false; if (!tip.hidden) pin(); } };
  svg.onpointercancel = () => { if (scrub) { scrub = false; clear(); } }; // (the page took the gesture: a scroll)
  w._clear = clear;
  if (!bindPerf.out) { bindPerf.out = true; document.addEventListener('pointerdown', (e) => { const c = $('.pfc-w'); if (c && c._clear && !c.contains(e.target)) c._clear(); }, true); }
}
function meter(kind) {
  const r = S.rep, dur = r.duration;
  const key = kind === 'damage' ? 'damage' : kind === 'healing' ? 'healing' : 'taken';
  const ps = players().filter((p) => p[key] > 0).sort((a, b) => b[key] - a[key]);
  const top = ps.length ? ps[0][key] + (kind === 'healing' ? ps[0].overheal : 0) : 1;
  const total = ps.reduce((s, p) => s + p[key], 0);
  if (!S.mPlayer || !ps.includes(S.mPlayer)) S.mPlayer = ps[0] || null;
  const rows = ps.map((p, i) => {
    let bar;
    if (kind === 'healing') bar = '<div style="width:' + (100 * p.healing / top) + '%;background:' + p.color + '"></div><div style="width:' + (100 * p.overheal / top) + '%;background:' + p.color + ';opacity:.3"></div>';
    else bar = '<div style="width:' + (100 * p[key] / top) + '%;background:' + p.color + '"></div>';
    const right = kind === 'healing' ? C(p.healing / dur) + ' <span class="muted">' + Math.round(100 * p.overheal / Math.max(1, p.healing + p.overheal)) + '% OH</span>' : C(p[key] / dur);
    return '<button class="mrowp' + (p === S.mPlayer ? ' sel' : '') + '" data-i="' + i + '">' + avatar(p, true) + '<div class="main"><div class="line1"><span><span class="nm" style="color:' + p.color + '">' + esc(p.name) + '</span> <span class="sub">' + esc(p.specName) + '</span>' +
      deathChip(p) + '</span><span class="val">' + right + '</span></div><div class="bar">' + bar + '</div></div></button>';
  }).join('');
  const label = kind === 'damage' ? 'Damage done' : kind === 'healing' ? 'Healing done' : 'Damage taken';
  const unit = kind === 'healing' ? 'HPS' : kind === 'taken' ? 'per second' : 'DPS';
  view('<div class="tiles">' + tile(kind === 'damage' ? 'Raid DPS' : kind === 'healing' ? 'Raid HPS' : 'Raid damage taken / s', C(total / dur), C(total) + ' total') +
    (kind === 'healing' ? tile('Overhealing', Math.round(100 * ps.reduce((s, p) => s + p.overheal, 0) / Math.max(1, total + ps.reduce((s, p) => s + p.overheal, 0))) + '%', 'faded bar segment') : '') +
    (kind === 'taken' ? tile('Avoidable', C(players().reduce((s, p) => s + p.avoidable, 0)), 'from mechanic rules') : '') + '</div>' +
    '<div class="meters"><div class="panel"><h3>' + label + ' <small>' + unit + '</small></h3>' + (rows || '<p class="muted">Nothing recorded.</p>') + '</div>' +
    '<div class="panel" id="abil"></div></div>' + (kind === 'healing' ? raidCdPanel(S.rep) : ''));
  $('#view').querySelectorAll('.mrowp').forEach((b) => (b.onclick = () => { S.mPlayer = ps[+b.dataset.i]; meter(kind); refreshIcons(); }));
  abilities(kind);
}
// Raid cooldowns and Lust, once per cast (channeled ones log a cast per tick), with nearby boss mechanics.
const RAID_CDS = ['bloodlust', 'heroism', 'time warp', 'fury of the aspects', 'primal rage', "harrier's cry", 'tranquility', 'revival', 'divine hymn', 'rewind',
  'spirit link totem', 'healing tide totem', 'aura mastery', 'power word: barrier', 'vampiric embrace', 'convoke the spirits', 'dream flight', 'darkness', 'anti-magic zone', 'rallying cry'];
// Option B set lines: click to show or hide that set's rows (remembered while the app is open)
document.addEventListener('click', (e) => {
  const tr = e.target.closest && e.target.closest('tr.gline'); if (!tr || e.target.closest('a, button')) return;
  const k = tr.dataset.gk, open = !tr.classList.contains('open'); tr.classList.toggle('open', open);
  if (open) S.openSets.add(k); else S.openSets.delete(k);
  document.querySelectorAll('tr[data-gp="' + k + '"]').forEach((x) => { x.hidden = !open; });
  if (open) refreshIcons();
});
// Raid cooldowns: the pull's big hits (its moments of most raid damage, up to the wipe filter) and what covered each one,
// over the raid's damage on one time line, with the raid cooldowns in lanes underneath. A hit nothing covered says what was
// ready then. Replaces the old one-row-per-player timeline.
// (base cooldowns in seconds, for "was it ready": talents can shorten some, so this errs toward "not ready")
const RCD_CD = { Tranquility: 180, Revival: 180, Restoral: 180, 'Divine Hymn': 180, Rewind: 240, 'Spirit Link Totem': 180, 'Healing Tide Totem': 180, 'Aura Mastery': 180, 'Power Word: Barrier': 180,
  'Vampiric Embrace': 120, Darkness: 300, 'Anti-Magic Zone': 120, 'Rallying Cry': 180, 'Dream Flight': 120, 'Celestial Conduit': 90, "Invoke Yu'lon, the Jade Serpent": 120, 'Emerald Communion': 180, 'Holy Word: Salvation': 360 };
// (each healer's own raid cooldown, counted as theirs even if never pressed this pull)
const RCD_SPEC = { 'Restoration Druid': ['Tranquility'], 'Holy Priest': ['Divine Hymn'], 'Mistweaver Monk': ['Revival'], 'Preservation Evoker': ['Rewind'], 'Restoration Shaman': ['Spirit Link Totem'], 'Holy Paladin': ['Aura Mastery'], 'Discipline Priest': ['Power Word: Barrier'] };
const LUSTS = ['bloodlust', 'heroism', 'time warp', 'fury of the aspects', 'primal rage', "harrier's cry"];
function rcdData(r) {
  const dur = r.duration, ct = Math.min(dur, cutT(r)), ts = r.takenS || [];
  const byG = new Map([...r.players.values()].map((p) => [p.guid, p])), named = (p) => p && p.name && !/^Player-/.test(p.name);
  // the raid cooldowns pressed, each as long as it lasted (the same list the Healing tab's cooldown panel uses)
  const uses = [];
  for (const u of r.cdUse || []) {
    const p = byG.get(u.g); if (!named(p)) continue;
    if ((CD_KIND[u.cd] || 'heal') === 'heal' && !u.heal && !u.over && u.late) continue;
    uses.push({ p, name: u.cd, id: u.id || E.SPELLID.get(String(u.cd).toLowerCase()) || 0, t: u.t, len: u.end != null ? Math.max(1, u.end - u.t) : CD_LEN[u.cd] || 6 });
  }
  const lust = [];
  for (const p of r.players.values()) if (named(p)) for (const n of LUSTS) { let last = -1e9; for (const t of (p.byName.get(n) || []).slice().sort((a, b) => a - b)) { if (t - last >= 12) lust.push({ p, name: n.replace(/\b\w/g, (c) => c.toUpperCase()), id: E.SPELLID.get(n) || 0, t, len: 40 }); last = t; } }
  uses.sort((a, b) => a.t - b.t); lust.sort((a, b) => a.t - b.t);
  // (two players lusting at once is one Bloodlust: the first)
  for (let i = lust.length - 1; i > 0; i--) if (lust[i].t - lust[i - 1].t < 30) lust.splice(i, 1);
  // the big hits: the 3-second stretches with the most raid damage, at least 10 s apart, well above the pull's usual
  const W3 = 3, sums = [];
  for (let i = 0; i + W3 <= Math.min(ts.length, Math.ceil(ct)); i++) { let s = 0; for (let j = 0; j < W3; j++) s += ts[i + j] || 0; sums.push([i, s]); }
  const sorted = sums.map((x) => x[1]).sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)] || 0, top = sorted[sorted.length - 1] || 0;
  const thr = Math.max(med * 2, top * 0.4), picks = [];
  for (const x of sums.slice().sort((a, b) => b[1] - a[1])) { if (x[1] <= 0 || x[1] < thr || picks.length >= 10) break; if (picks.some(([j]) => Math.abs(j - x[0]) < 10)) continue; picks.push(x); }
  picks.sort((a, b) => a[0] - b[0]);
  const hitBy = (i) => { const m = new Map(); for (let k = i; k < i + W3; k++) { const o = (r.takenAbS || [])[k]; if (o) for (const n in o) { const x = m.get(n) || [o[n][0], 0]; x[1] += o[n][1]; m.set(n, x); } } return [...m].sort((a, b) => b[1][1] - a[1][1]); };
  const alive = (p, t) => { const d = r.deaths.filter((x) => x.guid === p.guid && x.t <= t).pop(); if (!d) return true; return [...p.castTimes.values()].some((l) => l.some((x) => x > d.t + 1 && x <= t)); };
  const hits = picks.map(([i, s], k) => {
    const t0 = i, t1 = i + W3, by = hitBy(i), cov = uses.filter((u) => u.t <= t1 && u.t + u.len >= t0 - 0.3);
    const died = r.deaths.filter((d) => d.t >= t0 && d.t <= t1 + 3 && byG.has(d.guid));
    // (what was ready: a raid cooldown its player had this pull, or their spec's own, alive and off cooldown then)
    const ready = [];
    if (!cov.length) for (const p of r.players.values()) {
      if (!named(p) || !alive(p, t0)) continue;
      const mine = new Set(uses.filter((u) => u.p === p).map((u) => u.name).concat(RCD_SPEC[p.specName] || []));
      for (const n of mine) { const cd = RCD_CD[n]; if (!cd) continue; const last = uses.filter((u) => u.p === p && u.name === n && u.t < t0).pop(); if (!last || t0 - last.t >= cd) ready.push({ p, name: n }); }
    }
    const st = cov.length ? 'ok' : died.length ? 'bad' : ready.length ? 'warn' : 'na';
    return { k: k + 1, t: t0 + 1.5, t0, t1, dmg: s, name: by.length ? by[0][0] : 'Raid damage', id: by.length ? by[0][1][0] : 0, also: by.slice(1, 3).map(([n]) => n), cov, ready, died, st };
  });
  return { dur, ct, ts, uses, lust, hits };
}
function raidCdPanel(r) {
  const d = rcdData(r), dur = Math.max(1, d.dur), P = (t) => (100 * Math.max(0, Math.min(dur, t)) / dur).toFixed(3) + '%';
  if (!d.hits.length && !d.uses.length) return '<div class="panel"><h3>Raid cooldowns</h3><p class="muted" style="margin:0">No big hits or raid cooldowns to show for this pull.</p></div>';
  const ST = { ok: ['✓', 'covered'], warn: ['!', 'nothing used, something was ready'], bad: ['✕', 'not covered, and players died'], na: ['·', 'nothing used, nothing was ready'] };
  // the raid's damage per second (a 3 s average), drawn as an area
  const sm = d.ts.map((_, i) => ((d.ts[i - 1] || 0) + d.ts[i] + (d.ts[i + 1] || 0)) / 3), mx = Math.max(1, ...sm);
  const area = sm.length ? 'M0,100 ' + sm.map((v, i) => 'L' + (1000 * i / dur).toFixed(1) + ',' + (100 - 92 * v / mx).toFixed(1)).join(' ') + ' L' + (1000 * (sm.length - 1) / dur).toFixed(1) + ',100 Z' : '';
  const phases = ((r.module && !r.module.error && r.module.phases) || []).filter((p, i) => i > 0 && p.start > 1);
  let chart = '<div class="rc-chart"><svg class="rc-area" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path d="' + area + '"/></svg>';
  chart += phases.map((p) => '<span class="rc-ph" style="left:' + P(p.start) + '"><i>' + esc(p.name) + '</i></span>').join('');
  if (d.ct < dur - 0.5) chart += '<span class="rc-cut" style="left:' + P(d.ct) + ';width:' + P(dur - d.ct) + '" title="After the wipe filter"></span>';
  chart += d.hits.map((h, i) => '<span class="rc-band ' + h.st + '" data-rch="' + i + '" style="left:' + P(h.t0) + ';width:' + P(h.t1 - h.t0) + '"></span><button type="button" class="rc-pin ' + h.st + '" data-rch="' + i + '" style="left:' + P(h.t) + '" title="' + esc(h.k + '. ' + h.name + ' at ' + T(h.t0) + ': ' + C(h.dmg) + ' in 3 s, ' + ST[h.st][1]) + '">' + h.k + '</button>').join('');
  chart += keptDeaths(r).filter((x) => r.players.has(x.guid)).map((x) => '<span class="rc-death" style="left:' + P(x.t) + '" title="' + esc(x.player + ' died at ' + T(x.t) + (x.ability ? ' to ' + x.ability : '')) + '">✕</span>').join('') + '</div>';
  // the raid cooldowns in as few lanes as fit (each bar as long as it lasted, its name after it); Bloodlust on its own lane
  const lanes = [], gap = (u) => Math.max(u.len, (26 + 6.5 * u.name.length) / 900 * dur);
  for (const u of d.uses) { let L = lanes.find((l) => l.end <= u.t); if (!L) lanes.push(L = { end: 0, items: [] }); L.items.push(u); L.end = u.t + gap(u); }
  // (the bar as long as it lasted, in the player's colour, with its icon and name on top from where it started)
  const bar = (u, cls) => '<span class="rc-bar' + (cls ? ' ' + cls : '') + '" style="left:' + P(u.t) + ';width:' + P(u.len) + ';background:' + u.p.color + '"></span><span class="rc-cd" style="left:' + P(u.t) + '" title="' + esc(u.name + ', ' + u.p.name + ', at ' + T(u.t) + ', about ' + Math.round(u.len) + ' s') + '">' + spellIcon(u.id, u.name) + '<em>' + esc(CD_SHORT[u.name] || u.name) + '</em></span>';
  let lanesH = d.lust.length ? '<div class="rc-lane lust">' + d.lust.map((u) => bar(u, 'lust')).join('') + '</div>' : '';
  lanesH += lanes.map((l) => '<div class="rc-lane">' + l.items.map((u) => bar(u)).join('') + '</div>').join('');
  let axis = '<div class="rc-axis">'; const step = dur > 420 ? 120 : dur > 200 ? 60 : 30; for (let t = 0; t <= dur; t += step) axis += '<span style="left:' + P(t) + '">' + T(t) + '</span>'; axis += '</div>';
  // the list: each big hit, what it was, what covered it, or what was ready
  const cdName = (u) => '<span class="rc-chip"><span class="nm" style="color:' + u.p.color + '">' + esc(u.p.name) + '</span> ' + esc(CD_SHORT[u.name] || u.name) + '</span>';
  const rows = d.hits.map((h, i) => {
    const cov = h.cov.length ? h.cov.map(cdName).join('') : '<span class="' + (h.st === 'bad' ? 'hotv' : h.st === 'warn' ? 'rc-wn' : 'sub') + '">nothing used</span>';
    const ready = h.ready.length ? '<div class="sub">Ready: ' + h.ready.slice(0, 4).map((x) => esc(x.name) + ' (' + esc(x.p.name) + ')').join(', ') + (h.ready.length > 4 ? ' and ' + (h.ready.length - 4) + ' more' : '') + '</div>' : !h.cov.length ? '<div class="sub">No raid cooldown was ready.</div>' : '';
    const died = h.died.length ? '<div class="hotv">' + esc(h.died.map((x) => x.player).join(', ')) + ' died</div>' : '';
    return '<div class="rc-row ' + h.st + '" data-rch="' + i + '"><i class="rc-st">' + ST[h.st][0] + '</i><span class="rc-k">' + h.k + '</span><span class="tc">' + T(h.t0) + '</span>' +
      '<span class="rc-what">' + spell(h.id, h.name) + (h.also.length ? '<div class="sub">also ' + esc(h.also.join(', ')) + '</div>' : '') + '</span><span class="rc-dmg">' + C(h.dmg) + '<div class="sub">in 3 s</div></span><span class="rc-cov">' + cov + ready + died + '</span></div>';
  }).join('');
  const nc = d.hits.filter((h) => h.st === 'ok').length, nb = d.hits.filter((h) => h.st === 'bad').length;
  const pill = d.hits.length ? '<span class="rc-pill ' + (nb ? 'bad' : nc === d.hits.length ? 'ok' : 'warn') + '">' + nc + ' of ' + plural(d.hits.length, 'big hit') + ' covered</span>' : '';
  return '<div class="panel rc" id="rcdTl"><h3 class="nh"><span>Raid cooldowns</span><small>the big hits this pull' + (d.ct < d.dur - 0.5 ? ' (up to the wipe filter)' : '') + ', and what covered them</small>' + pill + '</h3>' +
    chart + (lanesH ? '<div class="rc-lanes">' + lanesH + '</div>' : '<p class="muted" style="margin:6px 0">No raid cooldowns were used this pull.</p>') + axis +
    (rows ? '<div class="rc-list">' + rows + '</div>' : '') +
    '<details class="howit"><summary>How it works</summary><div>The big hits are the 3-second stretches with the most damage on the raid this pull (at least 10 seconds apart and well above its usual damage), up to the wipe filter, each named by the spell that did most of it. A hit is covered when a raid cooldown (healing, damage reduction, Rallying Cry, Darkness and so on) was up during it. When nothing was, it lists the raid cooldowns that were ready: ones their player used this pull, or a healer\'s own spec cooldown, off cooldown by their base cooldown (talents can shorten some, so a few may be missing). Bloodlust is shown, not counted as cover. Click a hit to find it on the chart.</div></details></div>';
}
document.addEventListener('click', (e) => {
  const el = e.target.closest && e.target.closest('[data-rch]'); if (!el) return; const box = el.closest('.rc'); if (!box) return;
  const k = el.dataset.rch, on = !el.classList.contains('sel') || !box.querySelector('.rc-row.sel[data-rch="' + k + '"]');
  box.querySelectorAll('[data-rch]').forEach((x) => x.classList.toggle('sel', on && x.dataset.rch === k));
  if (el.classList.contains('rc-pin') && on) { const row = box.querySelector('.rc-row[data-rch="' + k + '"]'); if (row) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
});
function abilities(kind) {
  const p = S.mPlayer, el = $('#abil'); if (!p) { el.innerHTML = '<p class="muted">Pick a player.</p>'; return; }
  const m = kind === 'damage' ? p.dmgAb : kind === 'healing' ? p.healAb : p.takenAb;
  const tot = kind === 'damage' ? p.damage : kind === 'healing' ? p.healing : p.taken;
  const list = [...m.values()].sort((a, b) => b.total - a.total);
  const mx = list.length ? list[0].total : 1;
  el.innerHTML = '<h3>' + avatar(p, true) + ' <span style="color:' + p.color + '">' + esc(p.name) + '</span> <small>' + (kind === 'taken' ? 'what hit them' : 'abilities') + '</small></h3>' +
    '<table class="tbl"><thead><tr><th>Ability</th><th class="r">Amount</th><th class="r">Share</th><th class="r">' + (kind === 'healing' ? 'Overheal' : 'Hits') + '</th>' + (kind === 'taken' ? '' : '<th class="r">Crit</th>') + '</tr></thead><tbody>' +
    list.slice(0, 25).map((a) => '<tr><td>' + spell(a.id, a.name) + '<div class="bar" style="height:4px"><div style="width:' + (100 * a.total / mx) + '%;background:' + p.color + '"></div></div></td><td class="r">' + C(a.total) +
      '</td><td class="r">' + (100 * a.total / Math.max(1, tot)).toFixed(1) + '%</td><td class="r">' + (kind === 'healing' ? Math.round(100 * a.over / Math.max(1, a.total + a.over)) + '%' : a.hits) + '</td>' +
      (kind === 'taken' ? '' : '<td class="r">' + Math.round(100 * a.crits / Math.max(1, a.hits)) + '%</td>') + '</tr>').join('') + '</tbody></table>';
}

// ---------- survivability ----------
// ---------- raid audit: enchants, flasks and combat potions ----------
// Midnight consumable and enchant lists (patch 12.1).
const FLASKS = ['flask of thalassian resistance', 'flask of the blood knights', 'flask of the magisters', 'flask of the shattered sun'];
const COMBAT_POTS = ["light's potential", 'draught of rampant abandon', 'potion of recklessness', 'potion of zealotry', 'alluring nostrum', 'liquid luster',
  'tempered potion', 'frontline potion', 'potion of unwavering focus']; // last three: The War Within, still usable
// Enchantable slots in Midnight (cloak and bracer enchants were removed); gear array index = equipment slot
const ENCHANT_SLOTS = [[0, 'Head'], [2, 'Shoulders'], [4, 'Chest'], [6, 'Legs'], [7, 'Feet'], [10, 'Ring 1'], [11, 'Ring 2'], [15, 'Weapon']];
// Midnight enchants by enchant ID (from the game's SpellItemEnchantment table, build 12.1.5): [name, rank (1 or 2; 0 = class imbue),
// kind: 0 permanent, 1 weapon oil / stone / ammo, 2 class weapon imbue]. Leg spellthreads and armor kits only have stat names in the table.
const ENCH = {7905:['Sharpened: +Attack Power',2,1],7906:['Sharpened: +Attack Power',1,1],7907:['Weighted: +Attack Power',1,1],7908:['Weighted: +Attack Power',2,1],7909:['Razor Sharp: +Finesse',1,1],7910:['Razor Sharp: +Finesse',2,1],7934:['+Intellect & +Stamina',1],7935:['+Intellect & +Stamina',2],7936:['+Intellect & +Mana',1],7937:['+Intellect & +Mana',2],7938:['+Intellect',1],7939:['+Intellect',2],7956:['Mark of Nalorakk',1],7957:['Mark of Nalorakk',2],7958:['Hex of Leeching',1],7959:['Hex of Leeching',2],7960:['Empowered Hex of Leeching',1],7961:['Empowered Hex of Leeching',2],7962:['Lynx\'s Dexterity',1],7963:['Lynx\'s Dexterity',2],7964:['Amani Mastery',1],7965:['Amani Mastery',2],7966:['Eyes of the Eagle',1],7967:['Eyes of the Eagle',2],7968:['Zul\'jin\'s Mastery',1],7969:['Zul\'jin\'s Mastery',2],7970:['Flight of the Eagle',1],7971:['Flight of the Eagle',2],7972:['Akil\'zon\'s Swiftness',1],7973:['Akil\'zon\'s Swiftness',2],7978:['Strength of Halazzi',1],7979:['Strength of Halazzi',2],7980:['Jan\'alai\'s Precision',1],7981:['Jan\'alai\'s Precision',2],7982:['Berserker\'s Rage',1],7983:['Berserker\'s Rage',2],7984:['Mark of the Rootwarden',1],7985:['Mark of the Rootwarden',2],7986:['Mark of the Worldsoul',1],7987:['Mark of the Worldsoul',2],7988:['Blessing of Speed',1],7989:['Blessing of Speed',2],7990:['Empowered Blessing of Speed',1],7991:['Empowered Blessing of Speed',2],7992:['Shaladrassil\'s Roots',1],7993:['Shaladrassil\'s Roots',2],7994:['Nature\'s Wrath',1],7995:['Nature\'s Wrath',2],7996:['Nature\'s Fury',1],7997:['Nature\'s Fury',2],7998:['Nature\'s Grace',1],7999:['Nature\'s Grace',2],8000:['Amirdrassil\'s Grace',1],8001:['Amirdrassil\'s Grace',2],8006:['Worldsoul Cradle',1],8007:['Worldsoul Cradle',2],8008:['Worldsoul Aegis',1],8009:['Worldsoul Aegis',2],8010:['Worldsoul Tenacity',1],8011:['Worldsoul Tenacity',2],8012:['Mark of the Magister',1],8013:['Mark of the Magister',2],8014:['Rune of Avoidance',1],8015:['Rune of Avoidance',2],8016:['Empowered Rune of Avoidance',1],8017:['Empowered Rune of Avoidance',2],8018:['Farstrider\'s Hunt',1],8019:['Farstrider\'s Hunt',2],8020:['Thalassian Haste',1],8021:['Thalassian Haste',2],8022:['Thalassian Versatility',1],8023:['Thalassian Versatility',2],8024:['Silvermoon\'s Alacrity',1],8025:['Silvermoon\'s Alacrity',2],8026:['Silvermoon\'s Tenacity',1],8027:['Silvermoon\'s Tenacity',2],8028:['Thalassian Recovery',1],8029:['Thalassian Recovery',2],8030:['Silvermoon\'s Mending',1],8031:['Silvermoon\'s Mending',2],8036:['Flames of the Sin\'dorei',1],8037:['Flames of the Sin\'dorei',2],8038:['Acuity of the Ren\'dorei',1],8039:['Acuity of the Ren\'dorei',2],8040:['Arcane Mastery',1],8041:['Arcane Mastery',2],8051:['Thalassian Phoenix Oil',1,1],8052:['Thalassian Phoenix Oil',2,1],8053:['Oil of Dawn',1,1],8054:['Oil of Dawn',2,1],8055:['Smuggler\'s Enchanted Edge',1,1],8056:['Smuggler\'s Enchanted Edge',2,1],8158:['+Agility/Strength & +Stamina',1],8159:['+Agility/Strength & +Stamina',2],8160:['+Agility/Strength',1],8161:['+Agility/Strength',2],8162:['+Agility/Strength & +Armor',1],8163:['+Agility/Strength & +Armor',2],8608:['Laced Zoomshots',1,1],8609:['Laced Zoomshots',2,1],8610:['Weighted Boomshots',1,1],8611:['Weighted Boomshots',2,1],8612:['Smuggler\'s Lynxeye',1],8613:['Smuggler\'s Lynxeye',2],8614:['Farstrider\'s Hawkeye',1],8615:['Farstrider\'s Hawkeye',2],8688:['Rite of the Hash\'ey',1],8689:['Rite of the Hash\'ey',2],5400:['Flametongue',0,2],5401:['Windfury',0,2],5398:['Earthliving',0,2],6498:['Earthliving',0,2],7143:['Rite of Sanctification',0,2],7144:['Rite of Adjuration',0,2],7528:['Tidecaller\'s Guard',0,2],7587:['Thunderstrike Ward',0,2]};
const enchName = (id, slot) => { const e = ENCH[id]; if (!e) return 'Enchant ' + id; return slot === 6 && /^\+/.test(e[0]) ? (/Intellect/.test(e[0]) ? 'Spellthread: ' : 'Armor kit: ') + e[0] : e[0]; };
const AUG_RUNE = /augmentation$/i; // augment rune buffs (e.g. Ethereal Augmentation)
// character sheet layout, as in the game: left column, right column, weapons underneath
const SHEET_L = [[0, 'Head'], [1, 'Neck'], [2, 'Shoulders'], [14, 'Back'], [4, 'Chest'], [8, 'Wrist']];
const SHEET_R = [[9, 'Hands'], [5, 'Waist'], [6, 'Legs'], [7, 'Feet'], [10, 'Ring'], [11, 'Ring'], [12, 'Trinket'], [13, 'Trinket']];
const SHEET_W = [[15, 'Main hand'], [16, 'Off hand']];
const QCOL = ['#9d9d9d', '#ffffff', '#1eff00', '#0070dd', '#a335ee', '#ff8000', '#e6cc80', '#00ccff'];
const whIcon = (n) => 'https://wow.zamimg.com/images/wow/icons/large/' + String(n || 'inv_misc_questionmark').replace(/\.jpg$/, '') + '.jpg';
// Item tooltips: Wowhead's tooltip for the exact item (bonus IDs, enchant, gems, item level), fetched and cached, shown in
// the same box as spell tooltips. Item names on the character sheet are filled in from the same data.
const ITIPS = new Map();
function itemTip(q) { if (!ITIPS.has(q)) ITIPS.set(q, fetch('https://nether.wowhead.com/tooltip/item/' + q).then((r) => (r.ok ? r.json() : null)).catch(() => null)); return ITIPS.get(q); }
function fillItemNames(root) {
  for (const a of root.querySelectorAll('.csn[data-wq]')) itemTip(a.dataset.wq).then((d) => { if (d && d.name) a.textContent = d.name; });
  for (const img of root.querySelectorAll('img.csgem[data-gid]')) itemTip(img.dataset.gid).then((d) => { if (d && d.icon) img.src = whIcon(d.icon); });
}
let itCur = null;
document.addEventListener('mouseover', (e) => {
  const el = e.target.closest && e.target.closest('[data-wq]');
  if (!el || el === itCur) return;
  itCur = el; spTip.innerHTML = '<div class="spt-b muted">Loading item…</div>'; spTip.style.display = 'block'; placeTip(e);
  itemTip(el.dataset.wq).then((d) => { if (itCur !== el) return; spTip.innerHTML = d && d.tooltip ? '<div class="spt-b wh">' + cleanTip(d.tooltip) + '</div><div class="spt-f">Tooltip from Wowhead</div>' : '<div class="spt-b muted">Tooltip unavailable.</div>'; placeTip(e); });
});
document.addEventListener('mouseout', (e) => { const el = e.target.closest && e.target.closest('[data-wq]'); if (el && !el.contains(e.relatedTarget)) { itCur = null; spTip.style.display = 'none'; } });
// One player's gear, enchants, consumables and what's missing
// From a local log: buff names and item icons aren't in the log, so they're looked up on Wowhead (cached) first.
const needsLookup = (cs) => (cs || []).some((c) => c.auras.some((a) => !a.name && a.ability) || c.gear.some((g) => g && g.id && !g.icon && !g.looked));
async function resolveCombatants(cs) {
  cs = cs || [];
  const needA = [...new Set(cs.flatMap((c) => c.auras.filter((a) => !a.name && a.ability).map((a) => a.ability)))];
  const needI = [...new Set(cs.flatMap((c) => c.gear.filter((g) => g && g.id && !g.icon && !g.looked).map((g) => g.id)))];
  if (!needA.length && !needI.length) return;
  const [ad, idt] = await Promise.all([Promise.all(needA.map((id) => tipData(id))), Promise.all(needI.map((id) => itemTip(String(id))))]);
  const an = new Map(needA.map((id, k) => [id, ad[k]])), inf = new Map(needI.map((id, k) => [id, idt[k]]));
  for (const c of cs) {
    for (const a of c.auras) { const d = an.get(a.ability); if (!a.name) { a.name = d && d.name ? d.name : 'Spell ' + a.ability; a.icon = d && d.icon; } }
    for (const g of c.gear) { if (!g || !g.id || g.icon) continue; const d = inf.get(g.id); g.looked = true; if (d) { g.icon = d.icon; if (g.quality == null) g.quality = d.quality; } }
  }
}
// Gem sockets per item: the log only lists the gems in an item, so the sockets come from Wowhead's tooltip for that
// item with its bonus IDs (every socket shows as a "socket-…" class). Looked up once per item and bonus set, six at a time.
const SOCKETS = new Map();
async function resolveSockets(cs) {
  const items = []; for (const c of cs || []) for (const g of c.gear || []) if (g && g.id && g.sockets == null) items.push(g);
  const key = (g) => g.id + '?bonus=' + (g.bonusIDs || []).join(':'), keys = [...new Set(items.map(key))].filter((k) => !SOCKETS.has(k));
  let i = 0; const work = async () => { while (i < keys.length) { const k = keys[i++]; const d = await itemTip(k); SOCKETS.set(k, d && d.tooltip ? (d.tooltip.match(/class="socket-/g) || []).length : null); } };
  await Promise.all(Array.from({ length: 6 }, work));
  for (const g of items) { const n = SOCKETS.get(key(g)); if (n != null) g.sockets = n; }
}
// A raid's item level line for the pull: anyone 5 or more under the raid's median gets a "could be better" (rows from auditChar)
function markLowIlvl(rows) {
  const v = rows.map((x) => x.ilvl).filter((x) => x > 0).sort((a, b) => a - b); if (v.length < 3) return null;
  const med = v[Math.floor(v.length / 2)];
  for (const x of rows) { x.raidIlvl = med; x.lowIlvl = x.ilvl > 0 && x.ilvl <= med - 5; if (x.lowIlvl && !x.tighten.some((t) => /^Item level/.test(t))) x.tighten.push('Item level ' + Math.round(x.ilvl) + ', ' + Math.round(med - x.ilvl) + ' under the raid'); }
  return med;
}
function auditChar(c, p) {
  const sa = c.auras.filter((a) => a.source == null || a.source === c.self);
  const lname = (a) => String(a.name || '').toLowerCase();
  const flask = sa.find((a) => FLASKS.includes(lname(a))) || c.auras.find((a) => FLASKS.includes(lname(a)));
  const food = c.auras.find((a) => /well fed/.test(lname(a)));
  const rune = c.auras.find((a) => AUG_RUNE.test(a.name || ''));
  const vantus = c.auras.filter((a) => /^vantus rune/i.test(a.name || ''));
  const prepot = c.auras.find((a) => COMBAT_POTS.includes(lname(a)));
  const inPull = p ? p.cons.combatpot : [];
  const g = c.gear, issues = [], tighten = [];
  const ench = new Map(); // slot -> {name, rank} or null (missing)
  for (const [i, n] of ENCHANT_SLOTS) {
    const it = g[i]; if (!it || !it.id) continue;
    if (!it.permanentEnchant) { ench.set(i, null); issues.push('No ' + n.toLowerCase() + ' enchant'); continue; }
    const e = ENCH[it.permanentEnchant]; ench.set(i, { name: enchName(it.permanentEnchant, i), rank: e ? e[1] : 0 });
    if (e && e[1] === 1) tighten.push(n + ' enchant is rank 1');
  }
  // full gear: every slot that counts holds an item (shirt, tabard and off hand aren't required)
  for (const [i, n] of [...SHEET_L, ...SHEET_R, [15, 'Main hand']]) if (!g[i] || !g[i].id) issues.push('Empty ' + n.toLowerCase() + ' slot');
  const mh = g[15], temp = mh && mh.temporaryEnchant ? ENCH[mh.temporaryEnchant] || [String('Weapon buff ' + mh.temporaryEnchant), 0, 1] : null;
  if (mh && mh.id && !temp) issues.push('No weapon oil or stone');
  else if (temp && temp[2] === 1 && temp[1] === 1) tighten.push(temp[0] + ' is rank 1');
  if (!flask) issues.push('No flask');
  if (!food) issues.push('No food buff');
  // (combat potions are part of the survival kit now, not preparation)
  // (augment runes aren't judged: nice to have, not part of being ready)
  // gem sockets, once resolveSockets has looked the items up: an empty one could be better
  let emptySockets = 0;
  for (const it of g) if (it && it.id && it.sockets != null) emptySockets += Math.max(0, it.sockets - (it.gems || []).length);
  if (emptySockets) tighten.push(emptySockets === 1 ? '1 empty gem socket' : emptySockets + ' empty gem sockets');
  // average item level: shirt and tabard don't count; a two-hander counts twice
  const slots = [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], twoH = mh && mh.id && (!g[16] || !g[16].id);
  const ils = slots.map((i) => (i === 16 && twoH ? mh.itemLevel : g[i] && g[i].id ? g[i].itemLevel : 0));
  const ilvl = ils.reduce((s, x) => s + x, 0) / slots.length;
  return { c, p, flask, food, rune, vantus, prepot, inPull, ench, temp, issues, tighten, ilvl, twoH, emptySockets };
}
// ---- the two Player audit scores, 0 to 100 and graded S to F like the report card ----
// Ready to raid (gear and buffs at the pull): consumables 60 (flask 25, food 20, weapon oil or stone 15, or 10 for a rank 1
// one; augment runes aren't judged) and gear 40 (8 off per missing enchant, 3 per rank 1 enchant, 15 per empty slot, 5 per
// empty gem socket, 10 for an item level 5 or more under the raid's median).
function readyScore(x) {
  const r1Oil = x.temp && x.temp[2] === 1 && x.temp[1] === 1;
  const cons = (x.flask ? 25 : 0) + (x.food ? 20 : 0) + (x.temp ? (r1Oil ? 10 : 15) : 0);
  const en = [...x.ench.values()], miss = en.filter((e) => !e).length, r1 = en.filter((e) => e && e.rank === 1).length, empty = x.issues.filter((t) => /^Empty /.test(t)).length;
  return cons + Math.max(0, 40 - 8 * miss - 3 * r1 - 15 * empty - 5 * (x.emptySockets || 0) - (x.lowIlvl ? 10 : 0));
}
// A potion drunk before the pull: its buff is on the player when the pull starts (the combatant line lists their buffs).
// Matched by spell ID against the combat and mana potions anyone drank in the log, so it needs no name lookups.
function prepotted(r, p) {
  const ids = new Set(); for (const q of r.players.values()) for (const u of q.cons.combatpot.concat(q.cons.manapot)) if (u.id) ids.add(u.id);
  const c = (r.combatants || []).find((x) => x.name === p.name || (x.self && x.self === p.guid));
  return !!(c && ids.size && c.auras.some((a) => ids.has(a.ability) || (a.id && ids.has(a.id))));
}
// Survival kit (one pull, up to the wipe filter): defensives 40, Healthstone and health potion 30, combat or mana potion 30.
//  Defensives: 50 off for each death with a personal defensive ready, 20 for each close call (under 30% health) with
//  nothing pressed. Healthstone and health potion: 50 off for each death with one still available, 20 for each close call
//  with nothing pressed. One-shots (healthy to dead in under 1.5 s) aren't held against anyone.
//  Combat or mana potion: they share one 5-minute cooldown, so a healer's mana potion counts. One is expected per pull and
//  two when they were alive more than 5 minutes; one drunk before the pull counts. Not judged under 20 s alive.
// Tanks are judged differently: they sit low on purpose and healers cover it, but they're expected to keep their big
// cooldowns rolling. Defensives 60, Healthstone and health potion 15, combat potion 25. Only a dip under 15% with nothing
// pressed is a close call for a tank (10 off each, at most 40; 5 off the kit, at most 20). Cooldown use: the share of
// their major defensives' possible uses they used (each a minute or longer: possible = 1 + alive time / cooldown, up to the
// wipe filter; raid cooldowns and emergency buttons like Lay on Hands don't count); 80% use is full marks, and below that
// it costs up to 45. A death with a major defensive ready still costs 50.
const TANK_CD_SKIP = new Set(['rallying cry', 'darkness', 'divine shield', 'lay on hands']);
// the mechanics only tanks are judged on (their frontals and stacks): a minor slip on one counts in a tank's execution
const TANK_MECH = new Set(['Sever', 'Soul Sever', 'Blighted Sever']);
function survivalOf(r, p) {
  const ct = cutT(r), ok = (t) => t <= ct + 0.05, dd = keptDeaths(r).filter((d) => d.guid === p.guid), fair = dd.filter((d) => !(d.healthy && d.window < 1.5)), tank = p.role === 'tank';
  const end = Math.min(r.duration, ct, dd.length ? Math.min(...dd.map((d) => d.t)) : Infinity);
  const calls = (p.closeCalls || []).filter((c) => ok(c.t)), quiet = calls.filter((c) => !c.def && !c.stone && !c.pot), silent = (tank ? quiet.filter((c) => c.low < 0.15) : quiet).length;
  const defReady = fair.filter((d) => (d.available || []).some((a) => !/^(Healthstone|a healing potion)$/.test(a))).length;
  const kitReady = fair.filter((d) => (d.available || []).some((a) => /^(Healthstone|a healing potion)$/.test(a))).length;
  // a tank's big cooldowns: uses against possible uses while they were alive, up to the wipe filter
  const cds = !tank || end < 60 ? [] : (p.defs || []).filter((d) => d.cd >= 60 && !TANK_CD_SKIP.has(d.name.toLowerCase())).map((d) => { const poss = 1 + Math.floor(end / d.cd); return { name: d.name, id: d.id, used: Math.min(poss, d.uses.filter((u) => u <= end).length), poss }; });
  const cdPoss = cds.reduce((s, d) => s + d.poss, 0), cdUsed = cds.reduce((s, d) => s + d.used, 0), cdUse = cdPoss ? cdUsed / cdPoss : null;
  const def = tank ? Math.max(0, 100 - 50 * defReady - 10 * Math.min(4, silent) - (cdUse == null ? 0 : 45 * (1 - Math.min(1, cdUse / 0.8)))) : Math.max(0, 100 - 50 * defReady - 20 * silent);
  const kit = tank ? Math.max(0, 100 - 50 * kitReady - 5 * Math.min(4, silent)) : Math.max(0, 100 - 50 * kitReady - 20 * silent);
  const pots = p.cons.combatpot.concat(p.cons.manapot).filter((u) => u.t <= end + 0.05), pre = !pots.some((u) => u.t < 3) && prepotted(r, p);
  const expect = end < 20 ? 0 : 1 + Math.floor(Math.max(0, end - 10) / 300), used = Math.min(pots.length + (pre ? 1 : 0), expect || 9);
  const pot = expect ? 100 * Math.min(1, used / expect) : null;
  const W = tank ? [0.6, 0.15, 0.25] : [0.4, 0.3, 0.3];
  const score = pot == null ? (W[0] * def + W[1] * kit) / (W[0] + W[1]) : W[0] * def + W[1] * kit + W[2] * pot;
  return { score, def, kit, pot, expect, used, pre, defReady, kitReady, calls: calls.length, silent, deaths: dd.length, oneShots: dd.length - fair.length, tank, cds, cdUsed, cdPoss,
    stones: p.cons.healthstone.filter((u) => ok(u.t)).length, hpots: p.cons.healpot.filter((u) => ok(u.t)).length };
}
function charSheet(x, embed) { // (embed: inside the Player audit, titled "Gear and consumables", no Close button)
  const g = x.c.gear, st = x.c.stats || {};
  const wh = (it) => it.id + '?' + (it.bonusIDs && it.bonusIDs.length ? '&bonus=' + it.bonusIDs.join(':') : '') + (it.permanentEnchant ? '&ench=' + it.permanentEnchant : '') + (it.gems && it.gems.length ? '&gems=' + it.gems.map((q) => q.id).join(':') : '') + (it.itemLevel ? '&ilvl=' + it.itemLevel : '');
  const slot = ([i, label], right) => {
    const it = g[i];
    if (!it || !it.id) return '<div class="cslot empty' + (right ? ' r' : '') + '"><div class="csi"></div><div class="csx"><span class="sub">' + label + ': empty</span></div></div>';
    const qc = QCOL[it.quality] || '#fff', en = x.ench.has(i) ? x.ench.get(i) : undefined;
    let lines = '';
    if (en === null) lines += '<div class="csbad">No enchant</div>';
    else if (en) lines += '<div class="csen' + (en.rank === 1 ? ' r1' : '') + '">' + esc(en.name) + (en.rank === 1 ? ' <span class="sub">(rank 1)</span>' : '') + '</div>';
    else if (it.permanentEnchant) lines += '<div class="csen">' + esc(enchName(it.permanentEnchant, i)) + '</div>';
    if (i === 15) lines += x.temp ? '<div class="csen' + (x.temp[2] === 1 && x.temp[1] === 1 ? ' r1' : '') + '">' + esc(x.temp[0]) + (x.temp[2] === 2 ? ' <span class="sub">(class imbue)</span>' : x.temp[1] === 1 ? ' <span class="sub">(rank 1)</span>' : '') + '</div>' : '<div class="csbad">No weapon oil or stone</div>';
    if (i === 16 && it.temporaryEnchant) lines += '<div class="csen">' + esc((ENCH[it.temporaryEnchant] || ['Weapon buff'])[0]) + '</div>';
    const gems = (it.gems || []).map((q) => '<a href="https://www.wowhead.com/item=' + q.id + '" target="_blank" rel="noopener" data-wq="' + q.id + '"><img class="csgem" src="' + whIcon(q.icon) + '"' + (q.icon ? '' : ' data-gid="' + q.id + '"') + ' alt=""></a>').join(''); // (a local log has no gem icons: fillItemNames looks them up)
    return '<div class="cslot' + (right ? ' r' : '') + '"><a class="csi" href="https://www.wowhead.com/item=' + wh(it) + '" data-wq="' + wh(it) + '" target="_blank" rel="noopener" style="border-color:' + qc + '"><img src="' + whIcon(it.icon) + '" alt=""><span class="csil">' + it.itemLevel + '</span></a>' +
      '<div class="csx"><a class="csn" href="https://www.wowhead.com/item=' + wh(it) + '" data-wq="' + wh(it) + '" target="_blank" rel="noopener" style="color:' + qc + '">' + label + '</a>' + (gems ? '<span class="csgems">' + gems + '</span>' : '') + lines + '</div></div>';
  };
  const stat = (n, v) => v ? '<div class="csstat"><span>' + n + '</span><b>' + Number(v).toLocaleString() + '</b></div>' : '';
  const main = [['Strength', st.strength], ['Agility', st.agility], ['Intellect', st.intellect]].sort((a, b) => (b[1] || 0) - (a[1] || 0))[0];
  const sec = [['Critical Strike', st.crit], ['Haste', st.haste], ['Mastery', st.mastery], ['Versatility', st.versatility]], smax = Math.max(1, ...sec.map((s) => s[1] || 0));
  const cons = (label, a, okTxt, missTxt, warn) => '<div class="cscon"><img src="' + whIcon(a && a.icon ? a.icon : 'inv_misc_questionmark') + '" class="' + (a ? '' : 'off') + '" alt="" onerror="this.style.visibility=\'hidden\'"><div><div class="sub">' + label + '</div>' + (a ? '<b>' + esc(okTxt || a.name) + '</b>' : '<b class="' + (warn ? 'warnv' : 'hotv') + '">' + esc(missTxt) + '</b>') + '</div></div>';
  const pot = x.prepot || (x.inPull[0] ? { name: x.inPull.map((u) => u.name + ' at ' + T(u.t)).join(', ') } : null);
  return '<div class="panel charsheet' + (embed ? ' embed' : '') + '"' + (embed ? '' : ' style="border-top:3px solid ' + x.p.color + '"') + '>' + (embed ? '' : '<div class="cs-head">' + avatar(x.p, true) + '<div><h3 style="margin:0"><span style="color:' + x.p.color + '">' + esc(x.p.name) + '</span> <small>' + esc(x.p.specName || '') + '</small></h3><div class="sub">' + x.ilvl.toFixed(1) + ' average item level' + (x.twoH ? ' (two-hander counted twice)' : '') + '</div></div><button class="btn" id="csClose" style="margin-left:auto">Close</button></div>' +
    (x.issues.length || x.tighten.length ? '<div class="cs-issues">' + x.issues.map((t) => '<span class="spill bad">' + esc(t) + '</span>').join('') + x.tighten.map((t) => '<span class="spill warn">' + esc(t) + '</span>').join('') + '</div>' : '<div class="cs-issues"><span class="spill ok">Nothing missing</span></div>')) +
    '<div class="cs-body"><div class="cs-col">' + SHEET_L.map((s) => slot(s)).join('') + '</div>' +
    '<div class="cs-mid"><div class="cs-box"><div class="cs-bt">Stats <span class="sub">(rating)</span></div>' + stat(main[0], main[1]) + stat('Stamina', st.stamina) +
      sec.map(([n2, v]) => '<div class="csstat"><span>' + n2 + '</span><b>' + Number(v || 0).toLocaleString() + '</b></div><div class="csbar"><i style="width:' + (100 * (v || 0) / smax) + '%"></i></div>').join('') +
      stat('Leech', st.leech) + stat('Avoidance', st.avoidance) + stat('Speed', st.speed) + '</div>' +
      '<div class="cs-box"><div class="cs-bt">Consumables</div>' + cons('Flask', x.flask, null, 'No flask') + cons('Food', x.food, null, 'No food buff') +
      cons('Weapon oil / stone', x.temp ? { icon: g[15].icon, name: x.temp[0] } : null, null, 'None') + (x.rune ? cons('Augment rune', x.rune) : '') +
      (embed ? '' : cons('Combat potion', pot ? { icon: (x.prepot && x.prepot.icon) || PL_ICON.pot, name: pot.name } : null, null, 'None this pull')) +
      (x.vantus.length ? cons('Vantus rune', x.vantus[0], x.vantus.map((v) => v.name.replace(/^Vantus Rune: /, '')).join(', ')) : '') + '</div></div>' +
    '<div class="cs-col">' + SHEET_R.map((s) => slot(s, true)).join('') + '</div></div>' +
    '<div class="cs-weap">' + SHEET_W.filter(([i]) => i === 15 || (g[i] && g[i].id)).map((s) => slot(s)).join('') + '</div>' +
    (embed ? '' : '<p class="muted" style="font-size:12.5px;margin:10px 0 0">Hover an item for its full tooltip (from Wowhead). Stats are ratings from when the pull started.</p>') + '</div>';
}
function surv() {
  const r = S.rep, ps = players();
  const stones = ps.reduce((s, p) => s + p.cons.healthstone.length, 0), hp = ps.reduce((s, p) => s + p.cons.healpot.length, 0), cp = ps.reduce((s, p) => s + p.cons.combatpot.length, 0);
  const withDefs = r.deaths.filter((d) => d.available && d.available.some((a) => !/^(Healthstone|a healing potion)$/.test(a))).length;
  let h = '<div class="tiles">' + tile('Defensives used', Math.round(100 * r.defUse) + '%', 'of possible casts') +
    tile('Died with defensives ready', withDefs + ' of ' + r.deaths.length, 'deaths') +
    tile('Healthstones', stones, 'used by ' + plural(ps.filter((p) => p.cons.healthstone.length).length, 'player')) +
    tile('Healing potions', hp, 'used by ' + plural(ps.filter((p) => p.cons.healpot.length).length, 'player')) +
    tile('Combat potions', cp, 'used by ' + plural(ps.filter((p) => p.cons.combatpot.length).length, 'player')) + '</div>' +
    potionPanel(ps) + raidCdPanel(r) + // (raid cooldowns moved here from the hidden Healing tab)
    '<p class="muted">Defensives are matched by spell name, so the English game client works best. Cooldowns are base values; talents can shorten them. Talented defensives only appear once a player casts them.</p>';
  const order = { Poor: 0, Okay: 1, Good: 2 };
  ps.sort((a, b) => order[a.survVerdict] - order[b.survVerdict] || b.deaths - a.deaths);
  ps.forEach((p, i) => {
    const vb = p.survVerdict === 'Poor' ? 'b-high' : p.survVerdict === 'Okay' ? 'b-med' : 'b-good';
    const deaths = r.deaths.filter((d) => d.guid === p.guid);
    h += '<details class="card" style="border-left-color:' + p.color + '"' + (i < 4 ? ' open' : '') + '><summary>' + who(p, p.specName + (deaths.length ? ', died at ' + deaths.map((d) => T(d.t)).join(', ') : ', survived')) +
      '<span class="badge ' + vb + '">' + p.survVerdict + '</span></summary><div class="body">' +
      p.defs.map((d) => drow(spell(d.id, d.name), d.uses.length, d.possible, d.uses)).join('') +
      crow('Healthstone', p.cons.healthstone) + crow('Healing or defensive potion', p.cons.healpot) + crow('Combat potion', p.cons.combatpot) +
      (p.cons.manapot.length ? crow('Mana potion', p.cons.manapot) : '') + (p.cons.utilpot.length ? crow('Utility potion', p.cons.utilpot) : '') +
      deaths.map((d) => '<div class="note">Died at ' + T(d.t) + ' to ' + (d.ability ? mech(d.ability, d.abilityId) : esc(d.killer)) +
        (d.startHp != null ? '. Health went from ' + Math.round(d.startHp) + '% to 0 in ' + d.window.toFixed(1) + 's' : '') +
        (d.available.length ? '. Still available: ' + esc(andList(d.available)) + '.' : '. Nothing was left to press.') + '</div>').join('') +
      '</div></details>';
  });
  view(h);
}
// Consumable row: lists exactly which potions were used and when, grouped by name.
function potionPanel(ps) {
  const rows = new Map();
  for (const p of ps) for (const [kind, label] of [['healthstone', 'Healthstone'], ['healpot', 'Healing / defensive'], ['combatpot', 'Combat'], ['manapot', 'Mana'], ['utilpot', 'Utility']])
    for (const x of p.cons[kind]) { let r = rows.get(x.name); if (!r) rows.set(x.name, r = { name: x.name, id: x.id, kind: label, n: 0, who: new Map() }); r.n++; r.who.set(p.name, (r.who.get(p.name) || 0) + 1); }
  if (!rows.size) return '<div class="panel"><h3>Potions and Healthstones used</h3><p class="muted" style="margin:0">Nobody used a potion or Healthstone this pull.</p></div>';
  const list = [...rows.values()].sort((a, b) => b.n - a.n);
  return '<div class="panel"><h3>Potions and Healthstones used <small>whole raid, this pull</small></h3><table class="tbl"><thead><tr><th>Item</th><th>Type</th><th class="r">Uses</th><th>Used by</th></tr></thead><tbody>' +
    list.map((r) => '<tr><td>' + spell(r.id, r.name) + '</td><td class="muted">' + r.kind + '</td><td class="r">' + r.n + '</td><td class="sub">' + esc([...r.who].map(([n, c]) => n + (c > 1 ? ' ' + c + 'x' : '')).join(', ')) + '</td></tr>').join('') +
    '</tbody></table></div>';
}
function crow(label, uses) {
  if (!uses.length) return '<div class="drow"><div style="flex:1">' + spellIcon(0, label === 'Healthstone' ? 'Healthstone' : label) + esc(label) + '</div><span class="muted">none used</span></div>';
  const by = new Map();
  for (const x of uses) { let g = by.get(x.name); if (!g) by.set(x.name, g = { name: x.name, id: x.id, t: [] }); g.t.push(x.t); }
  return '<div class="drow" style="align-items:flex-start"><div style="flex:1"><div class="sub" style="margin-bottom:2px">' + esc(label) + '</div>' +
    [...by.values()].map((g) => '<div>' + spell(g.id, g.name) + ' <span class="sub">' + (g.t.length > 1 ? g.t.length + 'x, ' : '') + 'at ' + g.t.map(T).join(', ') + '</span></div>').join('') +
    '</div><span class="muted">' + uses.length + ' used</span></div>';
}
function drow(label, used, possible, times) {
  const pips = possible ? '<span class="pips">' + Array.from({ length: Math.min(possible, 8) }, (_, i) => '<i class="' + (i < used ? 'on' : '') + '"></i>').join('') + '</span>' : '';
  return '<div class="drow"><div style="flex:1">' + label + (times.length ? ' <span class="sub">at ' + times.map(T).join(', ') + '</span>' : '') + '</div><span class="muted">' + used + (possible ? ' of ' + possible : ' used') + '</span>' + pips + '</div>';
}

// ---------- deaths ----------
function deaths() {
  const r = S.rep, ds = r.deaths.slice().sort((a, b) => a.t - b.t);
  if (!ds.length) { view('<div class="panel">Nobody died on this pull.</div>'); return; }
  const d = ds[Math.min(S.death, ds.length - 1)];
  const list = ds.map((x, i) => '<button class="mrowp' + (x === d ? ' sel' : '') + '" data-i="' + i + '">' + avatar(x, true) + '<div class="main"><div class="line1"><span><span class="nm" style="color:' + x.color + '">' + esc(x.player) + '</span> <span class="sub">' + esc(x.ability || x.killer) + '</span></span><span class="val">' + T(x.t) + '</span></div></div></button>').join('');
  const rec = d.recap.map((e) => '<div class="ev"><span class="muted">' + T(e.t) + '</span><span class="' + (e.heal ? 'heal' : 'dmg') + '">' + (e.heal ? '+' : '−') + C(e.amount) + '</span><span>' + spell(e.id, e.spell) + ' <span class="sub">' + esc(e.src) + '</span></span><span class="muted">' + (e.hp >= 0 ? Math.round(e.hp) + '% hp' : '') + '</span></div>').join('');
  view('<div class="meters"><div class="panel"><h3>Deaths <small>in order</small></h3>' + list + '</div><div class="panel"><h3>' + esc(d.player) + ' <small>last 10 seconds before dying at ' + T(d.t) + '</small></h3>' +
    (d.available && d.available.length ? '<div class="note">Still available: ' + esc(andList(d.available)) + '</div>' : '') +
    '<div class="recap">' + (rec || '<p class="muted">No events recorded before this death.</p>') + '</div></div></div>');
  $('#view').querySelectorAll('.mrowp').forEach((b) => (b.onclick = () => { S.death = +b.dataset.i; deaths(); refreshIcons(); }));
}

// ---------- Player audit ----------
// Two views, picked at the top: All pulls (every pull of the boss: stat tiles, the MVPs, every player's night) and the pull
// on screen (the raid's gear and buffs at the pull, then every player's pull). Both list players the same way: one row
// each, in three groups (needs a word, could be better, all set); click a row to open that player under it.
// Everything judged in a pull stops at its wipe filter. (The Raid audit tab used to hold the gear; it's part of this tab now.)
const PL_ICON = { flask: 'inv_alchemy_90_flask_green', food: 'spell_misc_food', rune: 'inv_misc_rune_09', oil: 'inv_potion_101', pot: 'inv_alchemy_70_red', stone: 'warlock_-healthstone', ench: 'trade_engraving' };
const plIco = (n) => '<img class="pt-i" src="' + whIcon(n) + '" alt="" onerror="this.style.visibility=\'hidden\'">';
const capS = (t) => String(t).charAt(0).toUpperCase() + String(t).slice(1);
const gBucket = (v) => (v == null ? 'na' : v >= 88 ? 'ok' : v >= 65 ? 'warn' : 'bad');
// a stat tile at the top of either view: a picture (grade or icon), the label, a big value and one status line
// (quiet: the line under the value is a detail, not a verdict: grey, with no mark; the edge still shows the status)
const plTile = (pic, label, v, st, txt, quiet, grade) => '<div class="pt ' + st + (grade ? ' q-' + grade : '') + '">' + (pic || '') + '<div class="pt-t"><div class="pt-l">' + esc(label) + '</div><div class="pt-v">' + v + '</div><div class="pt-s ' + (quiet ? 'na' : st) + '" title="' + esc(txt) + '">' + (quiet ? '' : { bad: '✕ ', warn: '! ', ok: '✓ ' }[st] || '') + esc(txt) + '</div></div></div>';
// one buff or kit icon in a player row: the ring shows how it went (ok, warn, bad; none = nothing to judge), greyed when missing
// (aura: the buff itself, when known: then the icon gets the spell's tooltip, with the line under it as the extra text)
const pli = (icon, st, off, title, n, aura) => '<span class="pli ' + st + (off ? ' off' : '') + (aura && aura.ability ? ' sp" data-sid="' + aura.ability + '" data-sn="' + esc(aura.name || title) + '" data-ex="' + esc(title) + '"' : '" title="' + esc(title) + '"') + '><img src="' + whIcon(icon) + '" alt="" onerror="this.style.visibility=\'hidden\'">' + (n ? '<b>' + n + '</b>' : '') + '</span>';
const plMeter = (v) => (v == null ? '<div class="plm na"><span class="sub">no gear logged</span></div>' : '<div class="plm">' + gradeChip(letterOf(v)) + '<div class="plm-b"><i class="g-' + letterOf(v) + '" style="width:' + Math.max(3, Math.round(v)) + '%"></i></div><b>' + Math.round(v) + '</b></div>');
// the night's buffs (share of pulls) and kit, as icons
function nightIcons(a) {
  const g = a.last, ic = (aura, fb) => (aura && aura.icon) || fb;
  const cov = (v, icon, label, soft, aura) => {
    if (!v[1]) return pli(icon, 'none', true, label + ': no gear logged');
    const st = v[0] === v[1] ? 'ok' : soft ? (v[0] < v[1] / 2 ? 'warn' : 'ok') : v[1] - v[0] >= 0.2 * v[1] ? 'bad' : 'warn'; // (as in standsOut)
    return pli(icon, st, v[0] === 0, label + ': ' + (v[0] === v[1] ? 'every pull' : v[0] + ' of ' + v[1] + ' pulls'), 0, aura);
  };
  const n = a.stones + a.hpots;
  return cov(a.flask, ic(g && g.flask, PL_ICON.flask), 'Flask', false, g && g.flask) + cov(a.food, ic(g && g.food, PL_ICON.food), 'Food', false, g && g.food) + cov(a.oil, (g && g.c.gear[15] && g.c.gear[15].icon) || PL_ICON.oil, 'Weapon oil or stone') + '<i class="sep"></i>' +
    pli(PL_ICON.pot, !a.pot[1] ? 'none' : !a.pot[0] ? 'bad' : a.pot[0] / a.pot[1] < 0.7 ? 'warn' : 'ok', !a.pot[0], a.pot[1] ? 'Combat or mana potion: ' + a.pot[0] + ' of ' + a.pot[1] + ' expected' : 'Combat or mana potion: not judged', a.pot[0]) +
    pli(PL_ICON.stone, a.kitReady >= Math.max(2, 0.1 * a.pulls) ? 'warn' : n ? 'ok' : 'none', !n, plural(a.stones, 'Healthstone') + ', ' + plural(a.hpots, 'health potion') + (a.kitReady ? '; died with one unused ' + (a.kitReady === 1 ? 'once' : a.kitReady + ' times') : ''), n);
}
// one pull's buffs and kit, as icons
function pullIcons(x, s) {
  const n = s.stones + s.hpots;
  const buffs = x ? pli((x.flask && x.flask.icon) || PL_ICON.flask, x.flask ? 'ok' : 'bad', !x.flask, x.flask ? 'Flask at the pull' : 'No flask', 0, x.flask) + pli((x.food && x.food.icon) || PL_ICON.food, x.food ? 'ok' : 'bad', !x.food, x.food ? 'Food at the pull' : 'No food buff', 0, x.food) +
      pli((x.c.gear[15] && x.c.gear[15].icon) || PL_ICON.oil, !x.temp ? 'bad' : x.temp[2] === 1 && x.temp[1] === 1 ? 'warn' : 'ok', !x.temp, x.temp ? x.temp[0] + (x.temp[2] === 1 && x.temp[1] === 1 ? ' (rank 1)' : '') : 'No weapon oil or stone')
    : [['flask', 'Flask'], ['food', 'Food'], ['oil', 'Weapon oil or stone']].map(([k, l]) => pli(PL_ICON[k], 'none', true, l + ': no gear logged')).join('');
  return buffs + '<i class="sep"></i>' +
    pli(PL_ICON.pot, !s.expect ? 'none' : s.used >= s.expect ? 'ok' : s.used ? 'warn' : 'bad', !s.used, s.expect ? 'Combat or mana potion: ' + s.used + ' of ' + s.expect + (s.pre ? ' (pre-pot)' : '') : 'Combat or mana potion: not judged (under 20 s alive)', s.used) +
    pli(PL_ICON.stone, s.kitReady ? 'bad' : n ? 'ok' : 'none', !n, plural(s.stones, 'Healthstone') + ', ' + plural(s.hpots, 'health potion') + (s.kitReady ? '; died with one unused' : ''), n);
}
// one player's row: who, the two scores, buffs and kit, and what stands out (worst first)
function plRow(o) {
  const notes = o.notes.slice(0, 2).map(([st, t]) => '<div class="pln ' + st + '">' + esc(capS(t)) + '</div>').join('') + (o.notes.length > 2 ? '<div class="pln more">+' + (o.notes.length - 2) + ' more</div>' : '');
  return '<div class="plrow st-' + o.st + (o.open ? ' open' : '') + '" data-k="' + o.k + '" role="button" tabindex="0" aria-expanded="' + !!o.open + '">' +
    '<span class="who">' + avatar(o.p) + '<span class="plw"><span class="plw-n"><span class="nm" style="color:' + o.p.color + '">' + esc(o.p.name) + '</span>' + (o.mvp ? '<span class="plmvp m' + (o.mvp.k || o.mvp) + '">' + esc(o.mvp.label || ['', '1st', '2nd', '3rd'][o.mvp]) + '</span>' : '') + '</span><span class="sub">' + esc(o.sub) + '</span>' + (o.tankLine ? '<span class="sub plw-t">' + esc(o.tankLine) + '</span>' : '') + '</span></span>' +
    plMeter(o.ready) + plMeter(o.surv) + '<span class="plis">' + o.icons + '</span><span class="plns">' + (notes || '<div class="pln ok">Nothing to flag</div>') + '</span><span class="plc" aria-hidden="true">›</span></div>';
}
// the rows in three groups, worst first, under one line of column names
function plRoster(rows, id) {
  let h = '<div class="plr-list" id="' + id + '"><div class="plr-hd"><span>Player</span><span>Ready to raid</span><span>Survival kit</span><span>Buffs and kit</span><span>What stands out</span><span></span></div>';
  for (const [st, label] of [['bad', 'Needs a word'], ['warn', 'Could be better'], ['ok', 'All set']]) {
    const g = rows.filter((o) => (o.st === 'na' ? 'ok' : o.st) === st); if (!g.length) continue;
    h += '<div class="plg-h ' + st + '">' + { bad: '✕', warn: '!', ok: '✓' }[st] + ' ' + label + '<span>' + plural(g.length, 'player') + '</span></div>' + g.map((o) => plRow(o) + (o.open ? '<div class="plx">' + o.detail() + '</div>' : '')).join('');
  }
  return h + '</div>';
}
// one open row at a time; onOpen remembers who is open (by name, so it carries over to other pulls), onBind wires the details
function bindRoster(id, rows, onOpen, onBind) {
  const root = $('#' + id); if (!root) return;
  const toggle = (el) => {
    const o = rows[+el.dataset.k], was = el.classList.contains('open');
    root.querySelectorAll('.plrow.open').forEach((x) => { x.classList.remove('open'); x.setAttribute('aria-expanded', 'false'); }); root.querySelectorAll('.plx').forEach((x) => x.remove());
    onOpen(was ? null : o); if (was) return;
    el.classList.add('open'); el.setAttribute('aria-expanded', 'true'); el.insertAdjacentHTML('afterend', '<div class="plx">' + o.detail() + '</div>');
    const x = el.nextElementSibling; if (onBind) onBind(x, o); refreshIcons();
    const b = x.getBoundingClientRect(); if (b.bottom > innerHeight) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  root.querySelectorAll('.plrow').forEach((el) => { el.onclick = () => toggle(el); el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(el); } }; });
  const open = root.querySelector('.plrow.open'); if (open && onBind) onBind(open.nextElementSibling, rows[+open.dataset.k]);
  // (opened from a player's name on another tab: bring their row into view, under the sticky tabs)
  if (open && S.plScroll) { S.plScroll = false; open.scrollIntoView({ block: 'start' }); window.scrollBy(0, -64); }
}
function player() {
  // (the wipe filter is part of the key: changing it scores the night again)
  const r = S.rep, it = r.item, isBoss = it.kind !== 'run', pulls = isBoss ? S.index.bosses.filter((b) => b.id === it.id && b.diffId === it.diffId) : [], key = it.id + ':' + it.diffId + ':' + pulls.length + ':' + deathCutN();
  const v = isBoss && S.scope === 'all' ? 'night' : 'pull';
  // the wipe filter as one quiet line, as on Mechanics: where this pull (or every pull) stops counting
  const n = deathCutN(), cut = cutInfo(r);
  const cutLine = '<div class="cutbar' + (cut && v === 'pull' ? ' on' : '') + '"><span class="cutnow">' + (v === 'night' ? (n ? 'Each wipe counts up to its <b>' + ordinal(n) + ' death</b>; kills count in full' : '<b>Wipe filter off</b>: every pull counts in full')
      : cut ? 'Survival and focus tips count up to <b>' + T(cut.t) + '</b>, the ' + ordinal(cut.n) + ' death (' + esc(cut.who) + ')' : it.kill ? '<b>Kill</b>: the whole pull counts' : n ? 'Fewer than ' + n + ' deaths: the whole pull counts' : '<b>Wipe filter off</b>: the whole pull counts') + '</span></div>';
  const cached = S.nightPl && S.nightPl.key === key ? S.nightPl : null;
  // (the Player audit is the one tab with both views: its switch sits on top of the page, next to the wipe filter's line)
  const sw = isBoss ? '<div class="seg plsw" role="tablist" aria-label="Pulls shown"><button data-v="all"' + (v === 'night' ? ' class="on"' : '') + '>All pulls<span class="n">' + pulls.length + '</span></button><button data-v="pull"' + (v === 'pull' ? ' class="on"' : '') + '>Pull #' + it.pull + '<span class="n">' + (it.kill ? 'kill' : 'wipe') + '</span></button></div>' : '';
  view('<div class="plv"><div class="plhd">' + sw + cutLine + '</div>' + (v === 'night' ? '<div id="nightPl">' + (cached ? cached.load + cached.np.render() : '<p class="muted">Reading tonight\'s pulls…</p>') + '</div>' : '<div id="plPull"><p class="muted">Looking up gear and buffs…</p></div>') + '</div>');
  $$('.plsw button').forEach((b) => (b.onclick = () => { if (b.classList.contains('on')) return; S.scope = b.dataset.v; renderMain(); }));
  if (v === 'pull') { playerPull(r); return; }
  const bindAll = (c) => { c.np.bind(); if ($('#plAll')) $('#plAll').onclick = () => { NIGHT_ALL = true; S.nightPl = null; player(); }; };
  if (cached) { bindAll(cached); refreshIcons(); return; }
  const still = () => S.tab === 'player' && S.rep && S.rep.item === it && $('#nightPl');
  bossReps(it, still, (n, of) => { const el = $('#nightPl'); if (el) el.innerHTML = '<p class="muted">Reading tonight\'s pulls… ' + n + ' of ' + of + '</p>'; }).then(async (got) => {
    if (!got || !still()) return;
    const np = await nightPlayers(got.reps, still); if (!np || !still()) return;
    S.nightPl = { key, np, load: loadBar(got.reps.length, got.pulls.length, got.skipped, 'plAll') };
    $('#nightPl').innerHTML = S.nightPl.load + np.render(); bindAll(S.nightPl); refreshIcons(); setHeadRes();
  });
}
// What stands out in one pull, worst first: [severity, text, 'ready' or 'surv']
function pullNotes(x, s) {
  const out = [];
  if (x) for (const t of x.issues) out.push(['bad', t, 'ready']);
  if (s.defReady) out.push(['bad', 'died with a defensive or self-heal ready', 'surv']);
  if (s.expect && !s.used) out.push(['bad', 'no combat or mana potion', 'surv']); else if (s.expect && s.used < s.expect) out.push(['warn', 'combat or mana potion ' + s.used + ' of ' + s.expect, 'surv']);
  if (s.kitReady) out.push(['bad', 'died with a Healthstone or potion unused', 'surv']);
  if (s.silent) out.push(['warn', s.tank ? plural(s.silent, 'dip') + ' under 15% with nothing pressed' : plural(s.silent, 'close call') + ' with nothing pressed', 'surv']);
  if (s.tank && s.cdPoss >= 2 && s.cdUsed / s.cdPoss < 0.4) out.push(['warn', 'big cooldowns used ' + s.cdUsed + ' of ' + s.cdPoss + ' times they were up', 'surv']);
  if (x) for (const t of x.tighten) out.push(['warn', t, 'ready']);
  return out.sort((p, q) => (p[0] === 'bad' ? 0 : 1) - (q[0] === 'bad' ? 0 : 1));
}
// the pull on screen: six tiles for the raid, then every player's row; a row opens their audit for this pull
async function playerPull(r) {
  const box = () => (S.rep === r && S.tab === 'player' ? $('#plPull') : null), cs = r.combatants || [];
  if (cs.length) { if (needsLookup(cs)) { await resolveCombatants(cs); if (!box()) return; } await resolveSockets(cs); if (!box()) return; }
  const ps = players().filter((p) => p.name && !/^Player-/.test(p.name));
  const byName = new Map(ps.map((p) => [p.name, p]));
  const prepRows = cs.map((c) => auditChar(c, byName.get(c.name) || ps.find((x) => c.name && x.name.split('-')[0] === c.name.split('-')[0]))).filter((x) => x.p);
  markLowIlvl(prepRows);
  S.prepRows = { r, rows: prepRows };
  const prep = new Map(prepRows.map((x) => [x.p.guid, x]));
  const all = ps.map((p) => { const x = prep.get(p.guid) || null, s = survivalOf(r, p), notes = pullNotes(x, s); return { p, x, s, ready: x ? readyScore(x) : null, notes, st: worstSt(notes) }; })
    .sort((a, b) => ((a.ready == null ? a.s.score : (a.ready + a.s.score) / 2) - (b.ready == null ? b.s.score : (b.ready + b.s.score) / 2)) || a.p.name.localeCompare(b.p.name));
  // the raid's tiles: buffs and gear at the pull, and potions up to the wipe filter
  const g = prepRows, n = g.length, few = (l, txt) => (l.length <= 2 ? txt + ': ' + andList(l.map((x) => x.p.name)) : plural(l.length, 'player') + ' ' + txt);
  const anyIcon = (k, fb) => { const y = g.find((x) => x[k] && x[k].icon); return y ? y[k].icon : fb; };
  const cov = (icon, label, miss, soft) => plTile(plIco(icon), label, n ? n - miss.length + '<span> / ' + n + '</span>' : '—', !n ? 'na' : miss.length ? (soft ? 'warn' : 'bad') : 'ok', !n ? 'no gear logged' : miss.length ? few(miss, 'missing') : 'everyone');
  const enchMiss = g.filter((x) => [...x.ench.values()].some((e) => !e)), gemMiss = g.filter((x) => x.emptySockets > 0 || [...x.ench.values()].some((e) => e && e.rank === 1));
  const judged = all.filter((a) => a.s.expect), noPot = judged.filter((a) => !a.s.used), lowPot = judged.filter((a) => a.s.used && a.s.used < a.s.expect);
  const fewA = (l, txt) => (l.length <= 2 ? txt + ': ' + andList(l.map((a) => a.p.name)) : plural(l.length, 'player') + ' ' + txt);
  const tiles = '<div class="pts">' + cov(anyIcon('flask', PL_ICON.flask), 'Flask', g.filter((x) => !x.flask)) + cov(anyIcon('food', PL_ICON.food), 'Food', g.filter((x) => !x.food)) +
    cov(PL_ICON.oil, 'Weapon oil or stone', g.filter((x) => !x.temp)) +
    plTile(plIco(PL_ICON.ench), 'Enchants and gems', n ? n - new Set(enchMiss.concat(gemMiss)).size + '<span> / ' + n + '</span>' : '—', !n ? 'na' : enchMiss.length ? 'bad' : gemMiss.length ? 'warn' : 'ok', !n ? 'no gear logged' : enchMiss.length ? few(enchMiss, 'missing enchants') : gemMiss.length ? few(gemMiss, 'could be better') : 'all enchanted and gemmed') +
    plTile(plIco(PL_ICON.pot), 'Combat or mana pot', judged.length ? judged.length - noPot.length + '<span> / ' + judged.length + '</span>' : '—', !judged.length ? 'na' : noPot.length ? 'bad' : lowPot.length ? 'warn' : 'ok', !judged.length ? 'not judged (pull too short)' : noPot.length ? fewA(noPot, 'didn\'t pot') : lowPot.length ? fewA(lowPot, 'potted once of twice') : 'everyone potted') + '</div>';
  // (a tank's row says what their score is made of this pull: their frontals, whether they died, their big cooldowns)
  const tfP = r.module && !r.module.error && (r.module.sections || []).find((q) => q.id === 'tankfront'), ctP = cutT(r);
  const tankLineP = (a) => { if (!a.s.tank) return ''; const mine = tfP ? tfP.rows.filter((row) => row[0].t != null && row[0].t <= ctP + 0.05 && row[2] && row[2].p === a.p.name) : [];
    return [mine.length ? 'frontals clean ' + mine.filter((row) => !row.some((c) => c.bad || c.warn)).length + '/' + mine.length : '', a.s.deaths ? 'died' : 'no deaths', a.s.cdPoss ? 'big cooldowns ' + a.s.cdUsed + '/' + a.s.cdPoss : ''].filter(Boolean).join(' · '); };
  const rows = all.map((a, k) => ({ k, p: a.p, st: a.st, sub: (a.p.specName || '') + (a.x ? ' · ' + a.x.ilvl.toFixed(1) + ' ilvl' : ''), tankLine: tankLineP(a), ready: a.ready, surv: a.s.score, icons: pullIcons(a.x, a.s), notes: a.notes, open: S.plOpenP === a.p.name, detail: () => pullDetail(r, a) }));
  const howit = '<details class="howit"><summary>How it\'s scored</summary><div>Gear and buffs are from when the pull started' + (cs.length ? '' : ' (none were logged: combat logs record them only with Advanced Combat Logging on)') + '. Enchantable slots in Midnight: head, shoulders, chest, legs (spellthread or armor kit), feet, both rings and the weapon. Rank 1 enchants and oils, empty gem sockets, and an item level 5 or more under the raid show as "could be better". Augment runes aren\'t judged.<br>Survival kit, up to the wipe filter: defensives 40, Healthstone and health potion 30, combat or mana potion 30 (they share one 5-minute cooldown; one per pull, two if alive over 5 minutes, and a pre-pot counts). One-shots aren\'t held against anyone. Tanks are scored differently: defensives 60, including how often they used their big cooldowns (80% of the uses they had is full marks), Healthstone and health potion 15, combat potion 25; for a tank only a dip under 15% with nothing pressed counts.</div></details>';
  box().innerHTML = tiles + plRoster(rows, 'plRosterP') + howit;
  bindRoster('plRosterP', rows, (o) => { S.plOpenP = o ? o.p.name : null; }, (x) => { fillItemNames(x); const d = x.querySelector('details.plgear'); if (d) d.ontoggle = () => store.set('wla-pl-gear', d.open ? '1' : '0'); });
  refreshIcons();
}
// one player's pull, opened under their row: what to fix first, the three checklists, then their gear
// ---- output feedback, for every spec (the Player audit's "Output and activity" box) ----
// The pull's context, once per pull and wipe filter: each player's output while alive (damage, or healing for healers),
// their role's median, the DPS players' average share of damage on adds, Bloodlust, and when each player was mind
// controlled (time they couldn't cast).
// When a player was dead: [died, back up] spans, back up being their first cast after it (a battle res or a self-res),
// Infinity if they never came back. "While alive" counts the time outside these.
function deadSpans(r, p) {
  const c = r._ds || (r._ds = new Map()); if (c.has(p.guid)) return c.get(p.guid);
  const ts = [...p.castTimes.values()].flat().sort((a, b) => a - b), out = [];
  for (const d of r.deaths.filter((x) => x.guid === p.guid).sort((a, b) => a.t - b.t)) { if (out.length && d.t < out[out.length - 1][1]) continue; const back = ts.find((t) => t > d.t + 1); out.push([d.t, back == null ? Infinity : back]); }
  c.set(p.guid, out); return out;
}
// a player's seconds alive between a and b
function aliveSecs(r, p, a, b) { let s = Math.max(0, b - a); for (const [d0, d1] of deadSpans(r, p)) s -= Math.max(0, Math.min(b, d1) - Math.max(a, d0)); return Math.max(0, s); }
// how much of their time alive (less any time mind controlled) a player spent casting between a and b: each gap between
// two casts counts up to 2.5 s; null when they cast nothing. The tiles and the player's own line use this same number.
function activityIn(r, p, a, b) {
  const ts = [...p.castTimes.values()].flat().filter((t) => t >= a && t <= b).sort((u, v) => u - v); if (!ts.length) return null;
  const mcw = perfContext(r).mc.get(p.name) || [], forced = mcw.reduce((s, [x, y]) => s + Math.max(0, Math.min(y, b) - Math.max(x, a)), 0);
  let act = Math.min(2.5, ts[0] - a); for (let i = 1; i < ts.length; i++) act += Math.min(ts[i] - ts[i - 1], 2.5);
  return Math.min(100, 100 * act / Math.max(1, aliveSecs(r, p, a, b) - forced));
}
function perfContext(r) {
  const ct = cutT(r); if (r._pc && r._pc.ct === ct) return r._pc;
  const end = Math.max(1, Math.min(r.duration, ct)), boss = new Set(r.bossUnits || []), per = new Map();
  const sumTo = (arr) => { let s = 0; for (let i = 0; i < Math.min(arr.length, Math.ceil(end)); i++) s += arr[i] || 0; return s; };
  const mc = new Map(); const dm = r.module && !r.module.error && r.module._dm; if (dm) for (const d of dm) for (const x of d.mc) { if (!mc.has(x.n)) mc.set(x.n, []); mc.get(x.n).push([x.s, x.e]); }
  for (const p of r.players.values()) {
    if (!p.name || /^Player-/.test(p.name)) continue;
    // (alive: seconds alive up to the end, so a battle res counts what they did after it; until: when they stopped for good)
    const ds = deadSpans(r, p).filter(([a]) => a <= end + 0.05), died = ds.length ? ds[0][0] : null, dead = ds.reduce((s, [a, b]) => s + Math.max(0, Math.min(b, end) - a), 0);
    const alive = Math.max(1, end - dead), until = ds.length && ds[ds.length - 1][1] > end ? ds[ds.length - 1][0] : end;
    const kindK = p.role === 'healer' ? 'healS' : 'dmgS', tot = sumTo(p[kindK] || []), allD = [...p.dmgT.values()].reduce((s, v) => s + v, 0), adds = [...p.dmgT].filter(([n]) => !boss.has(n)).reduce((s, [, v]) => s + v, 0);
    per.set(p.name, { p, role: p.role || 'dps', tot, alive, dead, died, until, ds, ressed: ds.some(([, b]) => b <= end), ps: tot / alive, addShare: allD ? adds / allD : null, avoid: p.avoidable || 0 });
  }
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
  const roles = {}; for (const x of per.values()) (roles[x.role] = roles[x.role] || []).push(x);
  const roleMed = {}, roleAvoid = {}; for (const k in roles) { roleMed[k] = med(roles[k].filter((x) => x.tot > 0).map((x) => x.ps)); roleAvoid[k] = roles[k].reduce((s, x) => s + x.avoid, 0) / roles[k].length; }
  const dpsAdd = (roles.dps || []).filter((x) => x.addShare != null), addAvg = dpsAdd.length ? dpsAdd.reduce((s, x) => s + x.addShare, 0) / dpsAdd.length : null;
  const lust = []; for (const p of r.players.values()) for (const n of LUST_N) for (const t of p.byName.get(n) || []) lust.push(t);
  r._pc = { ct, end, per, roles, roleMed, roleAvoid, addAvg, lust: lust.length ? Math.min(...lust) : null, mc };
  return r._pc;
}
// one player's output feedback this pull: [status, html] lines, worst-to-fix first after the output line, plus the
// numbers the night view adds up
function outputFeedback(r, p) {
  const C0 = perfContext(r), x = C0.per.get(p.name); if (!x) return { lines: [], st: {} };
  const lines = [], st = {}, ROLE = { dps: 'DPS', healer: 'healers', tank: 'tanks' }, role = x.role;
  // output against their role in this raid (for information: spec, comp and assignments decide a lot of it)
  const ranked = (C0.roles[role] || []).filter((y) => y.tot > 0).sort((a, b) => b.ps - a.ps), rank = ranked.findIndex((y) => y.p === p) + 1;
  if (x.tot > 0 && role !== 'tank') { lines.push(['na', (role === 'healer' ? 'Healing' : 'Damage') + ': ' + C(x.ps) + ' per second while alive · ' + ordinal(rank) + ' of ' + ranked.length + ' ' + ROLE[role] + ' <span class="sub">(median ' + C(C0.roleMed[role]) + ')</span>']); st.rank = rank; st.of = ranked.length; st.vsMed = C0.roleMed[role] ? x.ps / C0.roleMed[role] : null; }
  // activity: casting while alive, and the longest gaps that weren't forced (dead, or mind controlled)
  const ts = [...p.castTimes.values()].flat().filter((t) => t <= x.until).sort((a, b) => a - b), mcw = C0.mc.get(p.name) || [];
  const forced = mcw.reduce((s, [a, b]) => s + Math.max(0, Math.min(b, x.until) - a), 0), actPct = ts.length ? activityIn(r, p, 0, C0.end) : 0;
  // (a gap while mind controlled or dead isn't theirs)
  const gaps = []; for (let i = 1; i < ts.length; i++) { const g = ts[i] - ts[i - 1]; if (g >= 4 && !mcw.some(([a, b]) => ts[i - 1] < b && ts[i] > a) && !x.ds.some(([a, b]) => ts[i - 1] < b && ts[i] > a)) gaps.push([ts[i - 1], g]); }
  gaps.sort((a, b) => b[1] - a[1]);
  if (ts.length) { lines.push([actPct >= 90 ? 'ok' : actPct >= 80 ? 'warn' : 'bad', 'Active ' + Math.round(actPct) + '% of the time alive' + (forced > 1 ? ' <span class="sub">(mind controlled time left out)</span>' : '') + (gaps.length ? ' · longest gaps: ' + gaps.slice(0, 2).map(([t, g]) => T(t) + ' (' + Math.round(g) + 's)').join(', ') : '')]); st.act = actPct; }
  // the combat potion with Bloodlust: drunk before the pull or within 20 s after Bloodlust started
  if (C0.lust != null && role !== 'healer') { const pots = p.cons.combatpot.filter((u) => u.t <= C0.end + 0.05), pre = prepotted(r, p);
    const good = pots.some((u) => u.t >= C0.lust - 3 && u.t <= C0.lust + 20), off = pots.filter((u) => !(u.t >= C0.lust - 3 && u.t <= C0.lust + 20) && u.t > 3);
    if (pots.length || pre) { lines.push([good || (pre && !off.length) ? 'ok' : 'warn', good ? 'Combat potion with Bloodlust (' + T(C0.lust) + ')' : pre && !off.length ? 'Combat potion before the pull' : 'Combat potion at ' + off.map((u) => T(u.t)).join(', ') + ', away from Bloodlust (' + T(C0.lust) + ')']); st.potLust = good ? 1 : 0; st.potN = 1; } }
  // damage on adds: the DPS player's share against the DPS average, when the raid had adds worth hitting
  if (role === 'dps' && x.addShare != null && C0.addAvg != null && C0.addAvg >= 0.05) { const low = x.addShare < C0.addAvg * 0.5;
    lines.push([low ? 'warn' : 'ok', Math.round(100 * x.addShare) + '% of your damage went to adds <span class="sub">(DPS average ' + Math.round(100 * C0.addAvg) + '%)</span>' + (low ? ' · switch when they spawn' : '')]); st.add = x.addShare; st.addAvg = C0.addAvg; }
  // what dying cost: their own rate for the time they were dead, up to the wipe filter
  // (dead time only: a battle res gives the rest back; a death right at the end costs nothing that counts)
  if (x.died != null && x.tot > 0) { const lost = x.ps * x.dead, pct = lost / (x.tot + lost);
    if (x.dead < 3) lines.push(['na', 'Died at ' + T(x.died) + ', ' + (C0.end < r.duration - 0.5 ? 'at the wipe filter' : 'at the end of the pull')]);
    else lines.push([pct >= 0.25 ? 'bad' : 'warn', (x.ressed ? 'Dead for ' + Math.round(x.dead) + 's after dying at ' + T(x.died) + ' (brought back),' : 'Dying at ' + T(x.died)) + ' cost about ' + C(lost) + ' ' + (role === 'healer' ? 'healing' : 'damage') + ', ' + Math.round(100 * pct) + '% of what you\'d have done']);
    st.lost = lost; st.lostOf = x.tot + lost; }
  // avoidable damage against their role's average
  const ra = C0.roleAvoid[role]; if (ra > 0 && role !== 'tank') { const k = x.avoid / ra;
    lines.push([k >= 2.5 ? 'bad' : k >= 1.5 ? 'warn' : 'ok', 'Avoidable damage taken: ' + (x.avoid ? C(x.avoid) + ', ' + (k >= 1.05 ? k.toFixed(1) + '× ' : k <= 0.95 ? 'below ' : 'about ') + 'the ' + ROLE[role] + ' average' : 'none')]); st.avoidX = k; }
  return { lines, st };
}
function pullDetail(r, a) {
  const p = a.p, ct = cutT(r), tips = E.coach(p, r, ct), checks = E.checklist(p, r, ct).filter((c) => c.check !== 'Survival');
  const ST = { Good: 'ok', Okay: 'warn', Poor: 'bad', Info: 'na' };
  const focus = tips.length ? '<div class="cs-box plfx"><div class="cs-bt">Focus for next pull <span class="sub">biggest wins first</span></div>' + tips.map((x, i) => '<div class="plf k' + i + '"><span class="plf-n">' + (i + 1) + '</span><div><b>' + esc(x.title) + '</b><div class="sub">' + esc(x.text) + '</div></div></div>').join('') + '</div>'
    : '<div class="cs-box plfx"><div class="cs-bt">Focus for next pull</div>' + ckLine('ok', 'Clean pull. Nothing stood out to fix.') + '</div>';
  // (the activity line comes from the output feedback now, with the gaps that weren't forced; cooldowns and kicks stay)
  const of = outputFeedback(r, p);
  const cds = of.lines.map(([st, html]) => ckLine(st, html)).join('') + checks.filter((c) => !(of.st.act != null && c.check === 'Activity')).map((c) => ckLine(ST[c.status] || 'na', (c.id ? spell(c.id, c.check) : esc(c.check)) + ' <span class="sub">' + esc(c.detail) + '</span>')).join('');
  const upTo = isFinite(ct) ? 'up to the wipe filter (' + T(ct) + ')' : 'the whole pull';
  const cols = '<div class="plx-cols"><div class="cs-box"><div class="cs-bt">Ready to raid <span class="sub">at the pull</span></div>' + (a.x ? readyLines(a.x) : ckLine('na', 'No gear or buffs were logged for this player.')) + '</div>' +
    '<div class="cs-box"><div class="cs-bt">Survival kit <span class="sub">' + upTo + '</span></div>' + survLines(a.s) + '</div>' +
    '<div class="cs-box"><div class="cs-bt">Output and activity <span class="sub">' + upTo + '</span></div>' + (cds || ckLine('na', 'Nothing tracked for this spec.')) + '</div></div>';
  const gear = a.x ? '<details class="plgear"' + (store.get('wla-pl-gear') === '0' ? '' : ' open') + '><summary>Gear and stats <span class="sub">' + a.x.ilvl.toFixed(1) + ' average item level' + (a.x.twoH ? ' (two-hander counted twice)' : '') + ' · at the pull · hover an item for its tooltip</span></summary>' + charSheet(a.x, true) + '</details>' : '';
  return focus + cols + gear;
}

// ---------- Last pull (live logging only) ----------
// A one-screen recap of the pull that just ended, for between pulls: the result next to the last pull and the best of
// the night, what went wrong and what went well, and the three things to fix first. Everything respects the wipe filter.
const shortT = (t) => String(t).split(':')[0]; // a section's mechanic name without what it checks, for lists
function pullSections(r) {
  if (!r || !r.module || r.module.error || !r.module.sections) return new Map();
  const out = new Map();
  for (const s of cutModule(r.module, cutT(r)).m.sections) {
    const rows = s.rows.concat(...(s.groups || []).map((g) => g.rows)); if (!rows.length) continue;
    // (a section that only shows something, like the floor maps, is never "clean")
    out.set(s.id, { s, st: rows.some((row) => row.some((c) => c.bad)) ? 'bad' : rows.some((row) => row.some((c) => c.warn)) ? 'warn' : s.info ? 'na' : 'ok' });
  }
  return out;
}
async function lastPull() {
  const r = S.rep, it = r.item, imp = IMPORTANCE[it.boss] || [], ix = (id) => { const i = imp.indexOf(id); return i < 0 ? 99 : i; };
  const same = S.index.bosses.filter((b) => b.id === it.id && b.diffId === it.diffId), k = same.indexOf(it), prevItem = k > 0 ? same[k - 1] : null, latest = same[same.length - 1] === it;
  // progress left (multi-phase fights: phase plus that phase's boss health) and how it reads ("P2 · Malacrass 71%")
  const usesPh = !!PROGRESS[it.boss];
  const prg = (x, rep) => (x.wcl ? wclProg(x) : (rep || CACHE.has(x)) ? progressOf(rep || CACHE.get(x)) : null);
  const pct = (x, rep) => { if (x.kill) return 0; const rr = rep || (CACHE.has(x) ? CACHE.get(x) : null); if (usesPh) { const p = prg(x, rep); if (p) return p.left; } return x.endPct != null ? x.endPct : rr && rr.bossPct != null ? rr.bossPct : null; };
  const lab = (x, rep, v) => { const p = usesPh ? prg(x, rep) : null; return p ? p.label : v != null ? v.toFixed(1) + '%' : ''; };
  view('<p class="muted">Putting the recap together…</p>');
  let prev = null; if (prevItem) { try { prev = await getRep(prevItem); } catch (e) { /* no comparison */ } }
  if (S.rep !== r || S.tab !== 'live') return;
  const now = pct(it, r), was = prevItem ? pct(prevItem, prev) : null, isKey = /^\+/.test(String(it.diff || '')); // (a Mythic+ key reads as timed, not killed)
  const earlierX = same.slice(0, k).map((x) => ({ x, v: pct(x) })).filter((o) => o.v != null), bestO = earlierX.length ? earlierX.reduce((m, o) => (o.v < m.v ? o : m)) : null, best = bestO ? bestO.v : null, bestLab = bestO ? lab(bestO.x, null, bestO.v) : '';
  const ds = keptDeaths(r).slice().sort((a, b) => a.t - b.t), ms = keptMistakes(r).filter((m) => m.mechanic !== 'Death');
  const P = pullSections(r), Q = pullSections(prev);
  // ---- headline ----
  const delta = now != null && was != null ? was - now : null;
  const isBest = best != null && now != null && now < best;
  let h = (!latest ? '<div class="nightload"><span>This is pull ' + it.pull + ', not the latest one.</span><button class="btn primary" id="lpLatest">Show the latest pull</button></div>' : ''); // (the banner on top shows the result and how it compares)
  // ---- what went wrong (healing cooldowns from the note are kept apart: their own tile) ----
  const HCD = 'Assigned cooldown', wrong = [], fixes = [];
  if (ds.length) { const d = ds[0]; wrong.push({ sev: 'bad', w: 0, map: d.map, html: '<b>First death:</b> ' + esc(d.player) + ' at ' + T(d.t) + (d.ability ? ' to ' + mech(d.ability, d.abilityId) : '') + (ds.length > 1 ? ' <span class="sub">(' + plural(ds.length, 'death') + ' in total)</span>' : '') }); if (d.prevent && d.prevent[0]) fixes.push({ w: 0, t: 'Keep ' + d.player + ' alive', x: d.prevent[0] }); }
  const groups = new Map(); for (const m of ms.filter((m) => m.severity !== 'Low' && m.mechanic !== HCD)) { const g = groups.get(m.mechanic); if (g) { g.n++; if (m.player !== 'Raid') g.who.add(m.player); if (m.severity === 'High') g.hi = true; } else groups.set(m.mechanic, { m, n: 1, hi: m.severity === 'High', who: new Set(m.player !== 'Raid' ? [m.player] : []) }); }
  const secOf = (name) => { for (const [id, x] of P) if (String(x.s.spell && x.s.spell[1]).toLowerCase() === String(name).toLowerCase() || x.s.title.toLowerCase().includes(String(name).toLowerCase())) return id; return null; };
  [...groups.values()].sort((a, b) => b.hi - a.hi || ix(secOf(a.m.mechanic)) - ix(secOf(b.m.mechanic)) || b.n - a.n).slice(0, 6).forEach((g) => {
    wrong.push({ sev: g.hi ? 'bad' : 'warn', map: g.m.map, html: '<b>' + mech(g.m.mechanic, g.m.id) + (g.n > 1 ? ' ×' + g.n : '') + ':</b> ' + esc(g.m.detail) + (g.who.size > 1 ? ' <span class="sub">(' + esc([...g.who].slice(0, 4).join(', ') + (g.who.size > 4 ? ', +' + (g.who.size - 4) : '')) + ')</span>' : '') });
    fixes.push({ w: g.hi ? 1 : 2, t: g.m.mechanic, x: g.m.fix });
  });
  const worse = [...P].filter(([id, x]) => { const q = Q.get(id); return q && x.st === 'bad' && q.st !== 'bad'; }).sort((a, b) => ix(a[0]) - ix(b[0])).map(([, x]) => shortT(x.s.title));
  if (worse.length) wrong.push({ sev: 'warn', html: '<b>Worse than last pull:</b> ' + esc(worse.join(', ')) + '.' });
  // ---- what went well ----
  const well = [];
  if (it.kill) well.push(isKey ? '<b>The key was timed.</b> Nice work.' : '<b>The boss died.</b> Nice work.');
  else if (isBest) well.push('<b>Best pull of the night</b> so far: ' + esc(lab(it, r, now)) + ' (was ' + esc(bestLab) + ').');
  else if (delta != null && delta > 0) well.push('<b>Further than last pull</b>: ' + esc(lab(prevItem, prev, was)) + ' → ' + esc(lab(it, r, now)) + '.');
  if (!ds.length) well.push('<b>Nobody died</b>' + (it.kill ? '.' : ' before the end.'));
  else if (ds[0].t > r.duration * 0.6) well.push('<b>No deaths until ' + T(ds[0].t) + '</b>, well into the pull.');
  const improved = [...P].filter(([id, x]) => { const q = Q.get(id); return q && q.st !== 'ok' && x.st === 'ok'; }).sort((a, b) => ix(a[0]) - ix(b[0]));
  for (const [, x] of improved.slice(0, 3)) well.push('<b>' + esc(shortT(x.s.title)) + '</b> was clean this time (it had problems last pull).');
  const clean = [...P].filter(([id, x]) => x.st === 'ok' && !improved.some(([j]) => j === id)).sort((a, b) => ix(a[0]) - ix(b[0])).map(([, x]) => shortT(x.s.title));
  if (clean.length) well.push('<b>Clean:</b> ' + esc(clean.slice(0, 5).join(', ')) + (clean.length > 5 ? ' and ' + (clean.length - 5) + ' more' : '') + '.');
  const ct = cutT(r), missedK = (r.missedKicks || []).filter((m) => m.t <= ct + 0.05).length, kicks = r.interrupts.filter((x) => x.t <= ct + 0.05).length;
  if (kicks && !missedK) well.push('<b>Every kickable cast was interrupted</b> (' + kicks + ' kicks).');
  const noteMiss = ms.filter((m) => m.fromNote && m.severity !== 'Low' && m.mechanic !== HCD);
  if (r.assign && !r.assign.error && r.assign.note && !noteMiss.length) well.push('<b>NSRT assignments followed</b>: nothing medium or serious from the note.');
  // ---- the pull at a glance: the same tiles as the Player audit ----
  const hasNote = !!(r.assign && !r.assign.error && r.assign.note);
  // (minor note slips, like a player on the other side, aren't misses but shouldn't read as "all followed" either)
  const noteLow = new Set(ms.filter((m) => m.fromNote && m.severity === 'Low' && m.mechanic !== HCD).map((m) => m.player)).size;
  const cdRows = hasNote ? (r.assign.cds || []).filter((x) => x.expected != null && x.expected <= ct + 0.05 && /^(on time|late|early|missed)$/.test(x.status)) : [];
  const cdMiss = cdRows.filter((x) => x.status === 'missed').length, cdLate = cdRows.filter((x) => x.status === 'late' || x.status === 'early').length;
  const hiN = [...groups.values()].filter((g) => g.hi).length, medN = groups.size - hiN;
  const tiles = '<div class="pts lp-tiles">' +
    plTile(plIco('inv_misc_bone_humanskull_01'), 'Deaths', String(ds.length), ds.length ? 'bad' : 'ok', ds.length ? 'first: ' + ds[0].player + ' at ' + T(ds[0].t) : 'nobody died') +
    plTile(plIco('ability_creature_cursed_02'), 'Mechanics', groups.size ? groups.size + '<span> ' + (groups.size === 1 ? 'problem' : 'problems') + '</span>' : '0', hiN ? 'bad' : medN ? 'warn' : 'ok', groups.size ? [hiN ? hiN + ' serious' : '', medN ? medN + ' medium' : ''].filter(Boolean).join(' · ') : 'nothing medium or serious') +
    plTile(plIco('inv_inscription_scroll'), 'Assignments', hasNote ? noteMiss.length + '<span> missed</span>' : '—', !hasNote ? 'na' : noteMiss.some((m) => m.severity === 'High') ? 'bad' : noteMiss.length || noteLow ? 'warn' : 'ok', !hasNote ? 'no NSRT note for this boss' : noteMiss.length ? plural(new Set(noteMiss.map((m) => m.player)).size, 'player') : noteLow ? noteLow + ' could be better' : 'all followed') +
    plTile(plIco('spell_holy_divinehymn'), 'Healing cooldowns', cdRows.length ? cdRows.length - cdMiss - cdLate + '<span> / ' + cdRows.length + ' on time</span>' : '—', !cdRows.length ? 'na' : cdMiss ? 'bad' : cdLate ? 'warn' : 'ok', !cdRows.length ? (hasNote ? 'none came up' : 'no NSRT note for this boss') : cdMiss || cdLate ? [cdMiss ? cdMiss + ' missed' : '', cdLate ? cdLate + ' late or early' : ''].filter(Boolean).join(' · ') : 'all on time') +
    plTile(plIco('ability_kick'), 'Interrupts', kicks + '<span> ' + (kicks === 1 ? 'kick' : 'kicks') + '</span>', missedK ? 'bad' : kicks ? 'ok' : 'na', missedK ? plural(missedK, 'cast') + ' got through' : kicks ? 'every cast kicked' : 'nothing to kick') + '</div>';
  // ---- layout ----
  // a Map button opens the animated map of that moment right under the line (one open at a time)
  const LPM = [];
  // (the same "What went wrong / What went right" pair as Mechanics and Assignments; a moment with a map gets its button)
  const fx = fixes.filter((f) => f.x).sort((a, b) => a.w - b.w).filter((f, i, a) => a.findIndex((g) => g.t === f.t || g.x === f.x) === i).slice(0, 3); // (no repeated advice)
  // (the same numbered list as the Player audit's focus for next pull; it sits at the top of the right column, beside
  // "What went wrong", so it's on the first screen)
  const fixP = fx.length ? '<div class="panel lp-fix"><h3>Fix first on the next pull</h3>' + fx.map((f, i) => '<div class="plf k' + i + '"><span class="plf-n">' + (i + 1) + '</span><div><b>' + esc(f.t) + '</b><div class="sub">' + esc(f.x) + '</div></div></div>').join('') + '</div>' : '';
  h += tiles + wrongRight(wrong.map((x) => ({ sev: x.sev, html: x.html, extra: x.map ? '<button class="btn lpmb" data-i="' + (LPM.push(x.map) - 1) + '">Map</button>' : '' })), well,
    { max: 6, none: 'Nothing medium or serious this pull.', noneRight: 'Not much to celebrate yet: check what went wrong.', moreWhere: 'on Mechanics', rightTop: fixP });
  h += '<p class="muted" style="font-size:12.5px">The full details are in the Mechanics and Assignments tabs. Minor mistakes are left out of this recap.</p>';
  view(h); refreshIcons();
  if ($('#lpLatest')) $('#lpLatest').onclick = () => select(same[same.length - 1]);
  const pmap = new Map(players().map((p) => [p.name, p]));
  $('#view').querySelectorAll('.lpmb').forEach((b) => (b.onclick = () => {
    const row = b.closest('.pb-r'), open = row.nextElementSibling && row.nextElementSibling.classList.contains('lp-map') && row.nextElementSibling.dataset.i === b.dataset.i;
    $('#view').querySelectorAll('.lp-map').forEach((x) => x.remove()); $('#view').querySelectorAll('.lpmb.on').forEach((x) => x.classList.remove('on'));
    if (open) return;
    const mp = LPM[+b.dataset.i], box = document.createElement('div'); box.className = 'lp-map mm'; box.dataset.i = b.dataset.i; row.after(box); b.classList.add('on');
    box.innerHTML = miniMap(mp, pmap); bindZoom(box); bindAnim(box, mp, pmap); hydrateMapIcons(box); refreshIcons();
  }));
}
const VIEWS = { audit, overview, night, player, perf, live: lastPull };

// ---------- Warcraft Logs reports ----------
$('#wclBtn').onclick = () => wclPanel();
function wclPanel(msg, linkText) {
  if (WCL.HOSTED) { hostedPanel(msg); return; }
  const local = location.protocol === 'http:' && location.hostname === 'localhost';
  const id = store.get('wla-wcl-id') || '', remember = store.get('wla-wcl-remember') !== '0';
  $('#main').innerHTML = '<div class="empty"><div class="drop" style="text-align:left;max-width:640px"><h2>Open a Warcraft Logs report</h2>' +
    (local ? '' : '<div class="note">Warcraft Logs reports need the helper. Close this page, double-click <code>start.bat</code> (in the same folder as this file) and use the page it opens.</div>') +
    '<ol style="margin:12px 0 16px 18px;padding:0"><li>On warcraftlogs.com, open your account settings, go to API clients and create a client. Any name works; the redirect URL can be <code>http://localhost:8765</code>.</li>' +
    '<li>Paste its client ID and secret below. They are only sent from this PC to warcraftlogs.com.</li><li>Paste a report link, for example <code>https://www.warcraftlogs.com/reports/AbCd1234#fight=12</code>.</li></ol>' +
    '<label class="fld">Client ID<input id="wId" value="' + esc(id) + '" autocomplete="off"></label>' +
    '<div class="fld" id="wSaved" style="display:none">Client secret<div style="display:flex;gap:10px;align-items:center;margin-top:6px"><span style="color:#7ee08f">✓ Saved on this PC</span><button class="btn" id="wChange" type="button">Change</button></div></div>' +
    '<label class="fld" id="wSecretRow">Client secret<input id="wSecret" type="password" autocomplete="new-password"></label>' +
    '<label class="chk"><input type="checkbox" id="wRemember"' + (remember ? ' checked' : '') + '> Remember these on this PC (works in every browser while the helper runs)</label>' +
    '<label class="fld">Report link<input id="wLink" placeholder="https://www.warcraftlogs.com/reports/…" value="' + esc(linkText || '') + '"></label>' +
    '<button class="btn primary" id="wGo"' + (local ? '' : ' disabled') + '>Load report</button> <span class="muted" id="wMsg">' + esc(msg || '') + '</span>' +
    '<p class="muted" style="font-size:13px;margin-top:14px">Public reports only. Each pull is downloaded when you open it, and Warcraft Logs limits how much the API can download per hour, so very long nights may load gradually.</p></div></div>';
  // The login is saved by the helper (server.ps1) in a file on this PC, so it survives browser changes and rebuilds.
  // The page only learns whether a secret is saved; an empty secret box means "use the saved one".
  let saved = false;
  const login = (body) => fetch('/wcl/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  const showSaved = () => {
    if (!$('#wSaved')) return;
    const typed = !!$('#wSecret').value;
    $('#wSaved').style.display = saved && !typed ? '' : 'none';
    $('#wSecretRow').style.display = saved && !typed ? 'none' : '';
  };
  $('#wChange').onclick = () => { $('#wSaved').style.display = 'none'; $('#wSecretRow').style.display = ''; $('#wSecret').focus(); };
  if (local) fetch('/wcl/login').then((r) => r.json()).then(async (j) => {
    const oldSecret = store.get('wla-wcl-secret');
    if (!j.saved && oldSecret && id) { await login({ id, secret: oldSecret }); j = { saved: true, id }; } // move a browser-saved login to the helper
    if (j.saved) try { localStorage.removeItem('wla-wcl-secret'); } catch (e) { /* ignore */ }
    if (j.saved && $('#wId')) { saved = true; if (!$('#wId').value) $('#wId').value = j.id || ''; showSaved(); }
  }).catch(() => {});
  $('#wRemember').onchange = () => {
    const on = $('#wRemember').checked;
    store.set('wla-wcl-remember', on ? '1' : '0');
    if (!on) { login({ clear: true }); saved = false; showSaved(); try { localStorage.removeItem('wla-wcl-id'); } catch (e) { /* ignore */ } }
  };
  $('#wGo').onclick = async () => {
    const creds = { id: $('#wId').value.trim(), secret: $('#wSecret').value.trim() }, link = WCL.parseLink($('#wLink').value);
    if (!creds.id || (!creds.secret && !saved)) { $('#wMsg').textContent = 'Enter your client ID and secret.'; return; }
    // read the checkbox now: once the report opens, this panel is gone
    const remember = $('#wRemember').checked;
    if (remember) store.set('wla-wcl-id', creds.id);
    // only keep a secret Warcraft Logs accepted, so a bad paste never replaces a working saved one
    const keepSecret = () => { if (remember && creds.secret) { login(creds); saved = true; } };
    const authFail = (err) => /refused the client/.test(err.message);
    if (!link) { $('#wMsg').textContent = "That doesn't look like a Warcraft Logs report link."; return; }
    $('#wMsg').textContent = 'Loading the report…'; $('#wGo').disabled = true;
    try { await openWcl(link, creds); keepSecret(); }
    catch (err) {
      $('#wGo').disabled = false;
      if (!authFail(err)) { keepSecret(); $('#wMsg').textContent = err.message; return; }
      if (!creds.secret && saved) {
        // the saved secret stopped working: open the box for a new one
        $('#wSaved').style.display = 'none'; $('#wSecretRow').style.display = ''; $('#wSecret').focus();
        $('#wMsg').textContent = 'Warcraft Logs no longer accepts the saved secret. Paste your current client secret and click Load report again.';
      } else $('#wMsg').textContent = 'Warcraft Logs didn\'t accept that client ID and secret, so they weren\'t saved. Copy both again from your API client on warcraftlogs.com.';
    }
  };
}

// Local mode: reload by itself when the app file is rebuilt, and after any reload reopen what was open: a Warcraft Logs
// report (the saved login is used, so nothing has to be typed again) or the live combat log, on the same pull, tab,
// pulls switch and scroll position. (A file opened by hand or a picked folder can't be reopened without asking again.)
const RESUME = 'wla-resume';
let RESUME_PICK = null; // (the pull to go back to once the live log has been read again)
function rememberView() {
  try {
    const view = { tab: S.tab, scope: S.scope, y: Math.round(window.scrollY) };
    if (S.wclCode && S.item && S.item.wcl) sessionStorage.setItem(RESUME, JSON.stringify({ ...view, code: S.wclCode, fight: S.item.wcl.fight }));
    else if (FH.dir && FH.dir.kind === 'helper') sessionStorage.setItem(RESUME, JSON.stringify({ ...view, helper: true, boss: S.item ? S.item.id : null, diff: S.item ? S.item.diffId : null, pull: S.item ? S.item.pull : null }));
    else sessionStorage.removeItem(RESUME);
  } catch (e) { /* ignore */ }
}
if (!WCL.HOSTED && location.protocol === 'http:' && location.hostname === 'localhost') {
  window.__wlaUp = true; // (the app is running: the page's fallback reload in the shell stands down)
  let ver = null;
  setInterval(() => fetch('/version', { cache: 'no-store' }).then((r) => r.text()).then((v) => {
    if (ver == null) ver = v; else if (v !== ver) { rememberView(); location.reload(); }
  }).catch(() => {}), 2000);
  window.addEventListener('beforeunload', rememberView);
  let last = null; try { last = JSON.parse(sessionStorage.getItem(RESUME) || 'null'); } catch (e) { /* ignore */ }
  if (last && last.helper) {
    // the live combat log: follow it again (once this script has finished loading), then reopen the same pull
    S.tab = last.tab || 'live'; S.scope = last.scope || 'pull';
    RESUME_PICK = last.boss != null ? { boss: last.boss, diff: last.diff, pull: last.pull, y: last.y || 0, tab: S.tab, scope: S.scope } : null;
    setTimeout(() => startFileLive(HELPER_LOG), 0);
  } else if (last && last.code) {
    S.tab = last.tab || 'overview'; S.scope = last.scope || 'pull';
    fetch('/wcl/login').then((r) => r.json()).then((j) => {
      if (!j.saved) return;
      $('#main').innerHTML = '<div class="empty"><p class="muted">Reopening your Warcraft Logs report…</p></div>';
      return openWcl({ code: last.code, fight: last.fight }, { id: j.id, secret: '' });
    }).catch((err) => wclPanel(err.message));
  }
}

// live: opened as a live log (Go live), so it's followed even before its first boss pull
async function openWcl(link, creds, live) {
  const rep = await WCL.loadReport(creds, link.code, live);
  if (FH.dir) { FH.dir = null; if (LIVE.on) setLive(false); } // (opening a report stops watching the local log)
  S.file = null; S.wclCreds = creds; S.wclCode = link.code; CACHE.clear();
  S.index = { bosses: rep.bosses, runs: [] };
  $('.brand p').textContent = 'Warcraft Logs: ' + (rep.title || link.code);
  renderList();
  // live mode survives the auto-reload after an app update
  let wasLive = false; try { wasLive = sessionStorage.getItem('wla-live') === '1'; } catch (e) { /* ignore */ }
  // a report someone is still live logging (its last event only minutes old) is followed live without being asked
  const still = rep.endMs && Date.now() - rep.endMs < LIVE_FRESH, follow = live || wasLive || still;
  LIVE.seen.clear(); LIVE.endMs = rep.endMs; liveUi();
  if (!rep.bosses.length) {
    if (rep.dungeons || !follow) throw new Error(rep.dungeons ? 'That report only has dungeon runs, and this site is for raids.' : 'That report has no boss pulls.');
    // (a live log before the raid's first boss pull: wait for it instead of an error; the first pull opens by itself)
    S.item = null; S.rep = null; $('#bossHead').innerHTML = '';
    $('#main').innerHTML = '<div class="empty"><div class="drop"><h2>Live: waiting for the first pull</h2><p class="muted">Following <b>' + esc(rep.title || link.code) + '</b>. Each boss pull shows up here about a minute after it ends. Keep this tab open during raid.</p></div></div>';
    if (!LIVE.on) setLive(true);
    return;
  }
  const pick = (link.fight && rep.bosses.find((b) => b.wcl.fight === link.fight)) || rep.bosses[rep.bosses.length - 1];
  if (follow && !LIVE.on) {
    setLive(true);
    if (still && !live && !wasLive) toast('<span><b>Live</b> This report is still being logged, so new pulls show up here as they end.</span>', 9000);
  }
  select(pick);
}
// ---------- live logging ----------
// While the raid live-logs to Warcraft Logs, re-read the report every 30s and add pulls as they finish. A pull
// counts as finished once its end time stops changing between two checks, so a half-uploaded pull is never
// shown (or saved on this PC). If you're on the newest pull, the app jumps to the new one on the same tab.
// Opening a report whose last event is under 10 minutes old turns live on by itself; following a report stops by itself
// once it hasn't changed for 45 minutes (the raid is over), so a tab left open doesn't keep asking all night.
const LIVE = { on: false, timer: null, seen: new Map(), last: 0, busy: false, endMs: null, changed: 0 };
const LIVE_FRESH = 10 * 60e3, LIVE_IDLE = 45 * 60e3;
function liveUi() {
  const bar = $('#liveBar'); if (!bar) return;
  bar.hidden = !S.wclCode && !FH.dir;
  const b = $('#liveBtn'); b.textContent = LIVE.on ? 'Live: on' : 'Live: off'; b.classList.toggle('on', LIVE.on);
  // (short: when it last looked; the log's file name is in the tooltip)
  const lm = $('#liveMsg');
  lm.textContent = LIVE.on ? (FH.dir && FH.err ? FH.err : LIVE.last ? 'Checked ' + new Date(LIVE.last).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Checking…') : '';
  lm.title = LIVE.on && FH.dir && FH.name ? 'Following ' + FH.name + (LIVE.last ? ', last checked ' + new Date(LIVE.last).toLocaleTimeString('en-US') : '') : '';
}
// ---------- live logging from this PC's combat log ----------
// The raid lead picks the WoW Logs folder once (Chrome and Edge can watch a folder; the choice is remembered on this
// PC). Every 10 seconds the newest WoWCombatLog file in it is checked; only the bytes WoW added since the last check
// are read, and a pull is added once its ENCOUNTER_END line is in the file. A new log file (after /combatlog or a
// relog) is picked up automatically.
const FH = { dir: null, name: '', ix: null, size: 0, busy: false };
const fhDb = () => new Promise((ok, no) => { const q = indexedDB.open('wla-handles', 1); q.onupgradeneeded = () => q.result.createObjectStore('h'); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); });
const fhGet = async () => { try { const db = await fhDb(); return await new Promise((ok) => { const q = db.transaction('h').objectStore('h').get('logs'); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); }); } catch (e) { return null; } };
const fhSet = async (v) => { try { const db = await fhDb(); db.transaction('h', 'readwrite').objectStore('h').put(v, 'logs'); } catch (e) { /* ignore */ } };
// FH.dir is the Logs folder (follows the newest WoWCombatLog file), one combat log file picked directly, or the local
// helper (server.ps1 finds the WoW Logs folder itself and reads the newest log for the page: browsers won't let a
// page pick files under Program Files, where WoW usually is)
const HELPER_LOG = { kind: 'helper', name: 'your combat log' };
const helperInfo = async () => { const r = await fetch('/log/info', { cache: 'no-store' }); const j = await r.json().catch(() => null); if (!j) throw new Error('the Debrief helper is out of date: close the start.bat window and run start.bat again'); return j; };
const helperHandle = (name) => ({ getFile: async () => ({ slice: (a, b) => ({ arrayBuffer: async () => {
  const r = await fetch('/log/read?name=' + encodeURIComponent(name) + '&from=' + a + '&to=' + b, { cache: 'no-store' });
  if (!r.ok) throw new Error('the helper couldn\'t read the log (' + r.status + ')'); return r.arrayBuffer();
} }) }) });
async function newestLog(dir) {
  if (dir.kind === 'helper') { const j = await helperInfo(); if (j.error === 'nodir') throw new Error('couldn\'t find your WoW Logs folder: put its path in a logs-path.txt file next to start.bat'); if (j.error) return null; FH.where = j.dir; return { name: j.name, f: { size: j.size }, hd: helperHandle(j.name) }; }
  if (dir.kind === 'file') return { name: dir.name, f: await dir.getFile(), hd: dir };
  let best = null;
  for await (const [name, hd] of dir.entries()) if (hd.kind === 'file' && /^WoWCombatLog.*\.txt$/i.test(name)) { const f = await hd.getFile(); if (!best || f.lastModified > best.f.lastModified) best = { name, f, hd }; }
  return best;
}
// WoW writes to the log all the time, and a file snapshot can't be read once the file changes after it was taken
// (NotReadableError). So bytes are read in chunks, each from a fresh snapshot, with a few retries.
const fhRead = async (a, b, each) => {
  const hd = FH.hd, out = [];
  for (let p = a; p < b;) {
    const q = Math.min(b, p + 8 * 1024 * 1024);
    for (let k = 0; ; k++) {
      try { const u = new Uint8Array(await (await hd.getFile()).slice(p, q).arrayBuffer()); if (each) each(u); else out.push(u); break; }
      catch (e) { if (k >= 4) throw e; await new Promise((r) => setTimeout(r, 120 * (k + 1))); }
    }
    p = q;
  }
  return out;
};
const fhText = async (a, b) => { const parts = await fhRead(a, b), all = new Uint8Array(parts.reduce((s, x) => s + x.length, 0)); let o = 0; for (const x of parts) { all.set(x, o); o += x.length; } return new TextDecoder().decode(all); };
async function startFileLive(dir) {
  FH.dir = dir; FH.name = ''; FH.ix = null; FH.size = 0; FH.err = '';
  S.wclCode = null; S.wclCreds = null; CACHE.clear(); S.index = { bosses: [], runs: [] }; S.item = null; S.rep = null;
  const one = dir.kind === 'file', auto = dir.kind === 'helper';
  $('.brand p').textContent = 'Live: ' + (auto ? 'your combat log' : one ? dir.name.replace(/\.txt$/i, '') : dir.name + ' folder');
  renderList();
  $('#main').innerHTML = '<div class="empty"><div class="drop"><h2>Watching your combat log</h2><p class="muted">' + (auto ? 'Debrief follows your newest WoWCombatLog file (it switches by itself when WoW starts a new one)' : one ? 'Debrief follows <b>' + esc(dir.name) + '</b>' : 'Debrief follows the newest WoWCombatLog file in <b>' + esc(dir.name) + '</b>') + ' and adds each pull as soon as it ends (checked every 10 seconds). Keep this tab open during raid.</p><p class="muted" id="fhMsg">Reading the log…</p></div></div>';
  setLive(true);
}
async function fileTick() {
  if (FH.busy || !FH.dir) return; FH.busy = true;
  try {
    const nl = await newestLog(FH.dir);
    if (!nl) { if ($('#fhMsg')) $('#fhMsg').textContent = 'No WoWCombatLog file in that folder yet. Type /combatlog in game (with Advanced Combat Logging on).'; return; }
    if (nl.name !== FH.name) { FH.name = nl.name; FH.ix = E.liveIndexer(); FH.size = 0; LIVE.seen.clear(); CACHE.clear(); S.index = { bosses: [], runs: [] }; renderList(); } // a new log file: start over on it
    FH.hd = nl.hd; S.file = nl.f;
    // (a log can shrink only if WoW started it over: then read it from the start)
    if (nl.f.size < FH.size) { FH.ix = E.liveIndexer(); FH.size = 0; LIVE.seen.clear(); CACHE.clear(); S.index = { bosses: [], runs: [] }; renderList(); }
    if (nl.f.size > FH.size) {
      const end = nl.f.size, first = FH.size === 0 && end > 50e6;
      if (first && $('#fhMsg')) $('#fhMsg').textContent = 'Reading tonight\'s log so far (' + Math.round(end / 1e6) + ' MB)…';
      await fhRead(FH.size, end, (u) => FH.ix.feed(u));
      FH.size = end;
    }
    FH.err = '';
    const all = FH.ix.peek(), finished = all.bosses.filter((b) => b.result === 'Kill' || b.result === 'Wipe');
    const fresh = finished.filter((b) => !S.index.bosses.includes(b)), inProg = all.bosses.find((b) => b.result === 'In progress');
    if ($('#fhMsg')) $('#fhMsg').textContent = finished.length ? '' : inProg ? 'Pull in progress: ' + inProg.boss + '…' : 'No boss pulls yet in ' + nl.name + '. Pulls appear here as they end.';
    if (fresh.length) {
      const wasNewest = !S.item || S.index.bosses[S.index.bosses.length - 1] === S.item;
      S.index = { bosses: finished, runs: [] }; renderList();
      document.querySelectorAll('.pull').forEach((x) => x.classList.toggle('sel', ITEMS[+x.dataset.i] === S.item));
      // (after a reload: back to the pull that was open, at the same scroll position, instead of the newest one)
      if (RESUME_PICK) {
        const rp = RESUME_PICK, want = finished.find((b) => b.id === rp.boss && b.diffId === rp.diff && b.pull === rp.pull); RESUME_PICK = null;
        // (turning live on switches to Latest pull: put back the tab and pulls switch that were open)
        if (want) { S.tab = rp.tab || S.tab; S.scope = rp.scope || S.scope; select(want).then(() => { if (rp.y) setTimeout(() => window.scrollTo(0, rp.y), 400); }); LIVE.last = Date.now(); return; }
      }
      const nb = fresh[fresh.length - 1], what = esc(nb.boss) + ' pull ' + nb.pull + ': ' + (nb.kill ? 'Kill!' : 'wipe') + ' (' + T(nb.duration) + ')';
      if (wasNewest) { if (S.item) toast('<span><b>New pull</b> ' + what + '</span>', 8000); select(nb); }
      else { const t = toast('<span><b>New pull</b> ' + what + '</span><button class="btn primary" data-go>Open</button>'); t.querySelector('[data-go]').onclick = () => { t.remove(); select(nb); }; }
    }
    LIVE.last = Date.now();
  } catch (e) { FH.err = 'couldn\'t read the log (' + (e.name || 'error') + '), retrying'; if ($('#fhMsg')) $('#fhMsg').textContent = 'Couldn\'t read the log: ' + (e.message || e.name) + '. Retrying every 10 seconds.'; console.error(e); }
  finally { FH.busy = false; liveUi(); }
}
async function pickLogFile(msgEl, again) {
  if (!window.showOpenFilePicker) { msgEl.textContent = 'This browser can\'t follow a file as it grows. Use Chrome or Edge, or follow a Warcraft Logs live report below.'; return; }
  try {
    let h = again ? await fhGet() : null;
    if (h && (await h.requestPermission({ mode: 'read' })) !== 'granted') h = null;
    if (!h) { [h] = await window.showOpenFilePicker({ id: 'wow-logs', multiple: false, types: [{ description: 'WoW combat log', accept: { 'text/plain': ['.txt'] } }] }); await fhSet(h); }
    startFileLive(h);
  } catch (e) { if (e && e.name !== 'AbortError') msgEl.textContent = e.message; else if (WCL.HOSTED) msgEl.textContent = BLOCKED_HINT; }
}
async function pickLogFolder(msgEl, again) {
  if (!window.showDirectoryPicker) { msgEl.textContent = 'This browser can\'t watch a folder. Use Chrome or Edge, or follow a Warcraft Logs live report below.'; return; }
  try {
    let dir = again ? await fhGet() : null;
    if (dir && (await dir.requestPermission({ mode: 'read' })) !== 'granted') dir = null;
    if (!dir) { dir = await window.showDirectoryPicker({ id: 'wow-logs', mode: 'read' }); await fhSet(dir); }
    startFileLive(dir);
  } catch (e) { if (e && e.name !== 'AbortError') msgEl.textContent = e.message; else if (WCL.HOSTED) msgEl.textContent = BLOCKED_HINT; }
}
function toast(html, ms) {
  document.querySelectorAll('.toast').forEach((x) => x.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html + '<button class="btn" data-x>✕</button>';
  document.body.appendChild(t); t.querySelector('[data-x]').onclick = () => t.remove();
  if (ms) setTimeout(() => t.remove(), ms);
  return t;
}
async function liveTick() {
  if (LIVE.on && FH.dir) return fileTick();
  if (!LIVE.on || LIVE.busy || !S.wclCode) return;
  LIVE.busy = true;
  try {
    const rep = await WCL.loadReport(S.wclCreds, S.wclCode, true);
    if (rep.endMs !== LIVE.endMs) { LIVE.endMs = rep.endMs; LIVE.changed = Date.now(); }
    else if (Date.now() - LIVE.changed > LIVE_IDLE) {
      LIVE.busy = false; setLive(false);
      toast('<span><b>Live is off</b> The report hasn\'t changed in 45 minutes. Turn it back on at the top if the raid goes again.</span>');
      return;
    }
    const have = new Set(S.index.bosses.map((b) => b.wcl && b.wcl.fight));
    const fresh = [];
    for (const b of rep.bosses) {
      if (have.has(b.wcl.fight)) continue;
      const prev = LIVE.seen.get(b.wcl.fight); LIVE.seen.set(b.wcl.fight, b.wcl.end);
      if (prev === b.wcl.end) fresh.push(b); // unchanged since the last check: the pull is over
    }
    LIVE.last = Date.now();
    if (fresh.length) {
      const wasNewest = S.item && S.index.bosses[S.index.bosses.length - 1] === S.item;
      S.index.bosses.push(...fresh); renderList();
      document.querySelectorAll('.pull').forEach((x) => x.classList.toggle('sel', ITEMS[+x.dataset.i] === S.item));
      const nb = fresh[fresh.length - 1];
      const what = esc(nb.boss) + ' pull ' + nb.pull + ': ' + (nb.kill ? 'Kill!' : 'wipe') + ' (' + T(nb.duration) + ')';
      if (wasNewest || !S.item) { toast('<span><b>New pull</b> ' + what + '</span>', 8000); select(nb); }
      else { const t = toast('<span><b>New pull</b> ' + what + '</span><button class="btn primary" data-go>Open</button>'); t.querySelector('[data-go]').onclick = () => { t.remove(); select(nb); }; }
    }
  } catch (e) { $('#liveMsg').textContent = 'check failed, retrying: ' + e.message; LIVE.busy = false; return; }
  LIVE.busy = false; liveUi();
}
function setLive(on) {
  const was = LIVE.on;
  LIVE.on = on; clearInterval(LIVE.timer); LIVE.timer = null;
  // live logging opens on the Last pull recap; turning it off leaves that tab
  if (on && !was) S.tab = 'live';
  if (was !== on && S.rep && $('#view')) renderMain();
  if (on) { LIVE.changed = Date.now(); LIVE.timer = setInterval(liveTick, FH.dir ? 10000 : 30000); liveTick(); }
  try { sessionStorage.setItem('wla-live', on ? '1' : ''); } catch (e) { /* ignore */ }
  liveUi();
}
$('#liveBtn').onclick = () => setLive(!LIVE.on);
// Wipe filter: one setting for every pull and every tab (re-renders whatever is open)
// The wipe filter control, made once; renderList moves it to the right end of the pull cards, as a card of its own: it
// decides how far each wipe counts, on every tab.
let CUT_NODE = null;
(function cutSide() {
  const el = $('#cutSide'); if (!el) return;
  CUT_NODE = el;
  // (its name and the ? on top, the number of deaths with − and + under it; the ? opens why)
  el.innerHTML = '<span class="cs-top" title="On a wipe, everything after that death is left out of every tab. Kills are never cut. 0 = off."><svg class="cs-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4"/><path d="M6 4.5h11.5l-2.6 4 2.6 4H6"/></svg><b>Wipe filter</b><button class="cutq" type="button" id="cutSideQ" aria-label="Why filter deaths?" aria-expanded="false">?</button></span>' +
    '<span class="cs-row"><span class="cs-l">stop at</span><span class="cs-step"><button type="button" class="cs-b" data-d="-1" aria-label="One fewer death">−</button><input id="cutSideIn" type="number" min="0" max="40" step="1" value="' + (deathCutN() || '') + '" placeholder="off" title="Type a number, then press Enter"><button type="button" class="cs-b" data-d="1" aria-label="One more death">+</button></span><span class="cs-l">deaths</span></span>' +
    '<div class="cutwhy2" hidden><b>Why filter?</b> ' + esc(CUT_WHY.replace(/^Why filter\? /, '')) + '</div>';
  // (off: the control turns grey, so it's plain when nothing is being cut)
  const inp = $('#cutSideIn'), go = () => { const n = Math.max(0, Math.min(40, Math.round(+inp.value || 0))); inp.value = n || ''; el.classList.toggle('off', !n); if (n === deathCutN()) return; store.set('wla-death-cut2', String(n)); if (S.rep) { renderMain(); refreshIcons(); } };
  el.classList.toggle('off', !deathCutN());
  inp.onchange = go; inp.onkeydown = (e) => { if (e.key === 'Enter') go(); };
  el.querySelectorAll('.cs-b').forEach((b) => (b.onclick = () => { inp.value = Math.max(0, Math.min(40, (+inp.value || 0) + +b.dataset.d)); go(); }));
  $('#cutSideQ').onclick = (e) => { e.stopPropagation(); const w = el.querySelector('.cutwhy2'); w.hidden = !w.hidden; $('#cutSideQ').setAttribute('aria-expanded', String(!w.hidden)); };
  document.addEventListener('click', (e) => { const w = el.querySelector('.cutwhy2'); if (w && !w.hidden && !el.contains(e.target)) { w.hidden = true; $('#cutSideQ').setAttribute('aria-expanded', 'false'); } }); // (a click elsewhere closes it)
})();
function hostedPanel(msg) {
  $('#main').innerHTML = '<div class="empty"><div class="drop" style="max-width:640px"><h2>Paste a Warcraft Logs link</h2>' +
    '<p class="muted">Any public report. Pick a pull, or include <code>#fight=12</code> in the link to open that one.</p>' +
    '<div class="paste"><input id="hLink" placeholder="https://www.warcraftlogs.com/reports/…" autofocus><button class="btn primary" id="hGo">Analyze</button></div>' +
    '<p class="muted" id="hMsg">' + esc(msg || '') + '</p><p class="muted" style="font-size:13px;margin-top:18px">Or drop your own WoWCombatLog.txt here.</p></div></div>';
  const go = async () => {
    const link = WCL.parseLink($('#hLink').value);
    if (!link) { $('#hMsg').textContent = "That doesn't look like a Warcraft Logs report link."; return; }
    $('#hMsg').textContent = 'Loading the report…'; $('#hGo').disabled = true;
    try { await openWcl(link, null); } catch (err) { $('#hGo').disabled = false; $('#hMsg').textContent = err.message; }
  };
  $('#hGo').onclick = go;
  $('#hLink').onkeydown = (e) => { if (e.key === 'Enter') go(); };
  $('#hLink').onpaste = () => setTimeout(go, 50);
}
// Shareable addresses: ?report=CODE&fight=N opens that report and pull directly.
function syncUrl(item) {
  if (!WCL.HOSTED || !item || !item.wcl) return;
  try { history.replaceState(null, '', '?report=' + item.wcl.code + '&fight=' + item.wcl.fight); } catch (e) { /* ignore */ }
}

// ---------- start screen ----------
// Three ways in: follow the raid's Warcraft Logs live log during raid, open a combat log file from this PC, or import a
// Warcraft Logs report. Warcraft Logs needs the login once (local helper); after that a pasted link opens directly.
const LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 3 56 12v18c0 15-11 26-24 31C19 56 8 45 8 30V12Z" fill="#1b1f29" stroke="#e6b450" stroke-width="3" stroke-linejoin="round"/><path d="M22 18h10c9 0 14 6 14 14s-5 14-14 14H22Z" fill="none" stroke="#e6b450" stroke-width="4" stroke-linejoin="round"/><path d="m27 32.5 4 4 8.5-9.5" fill="none" stroke="#7ee08f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// The front page's preview: an app-like window with four views (Latest pull, Mechanics, Assignments, Summary). All
// made-up example data and names, drawn in code (no game art).
const FP_SCENES = [['live', 'Latest pull'], ['mech', 'Mechanics'], ['assign', 'Assignments'], ['summary', 'Summary']];
function fpParts() {
  const mark = { bad: '✕', warn: '!', ok: '✓' };
  const r = (k, html, who) => '<div class="fp-r ' + k + '"><i>' + mark[k] + '</i><span>' + html + '</span>' + (who ? '<span class="fp-who">' + who + '</span>' : '') + '</div>';
  const h4 = (t, k, s) => '<h4>' + t + (s ? '<span class="' + k + '">' + s + '</span>' : '') + '</h4>';
  const pnl = (inner, cls) => '<div class="fp-pnl' + (cls ? ' ' + cls : '') + '">' + inner + '</div>';
  // (the stage bar from the pull header: each stage as wide as its share of the encounter's health)
  const seg = (w, fill, t) => '<span class="fp-seg' + (fill ? '' : ' off') + '" style="flex:' + w + '">' + (fill ? '<i style="width:' + fill + '%"></i>' : '') + '<em>' + t + '</em></span>';
  const q = (d) => (PULL_Q.find(([lo]) => d >= lo) || [0, '#9d9d9d'])[1];
  const live = '<div class="fp-head"><div class="fp-hl"><small>Pull 18 · The Coiled Altar · Mythic</small><b>Wipe in P2 · Malacrass 34%</b><span class="up">▲ further than last pull (P2 · Malacrass 52%)</span></div>' +
      '<div class="fp-segs">' + seg('33 1 0', 100, 'P1') + seg('23 1 0', 66, 'P2') + seg('0 0 24px', 0, 'Int') + seg('44 1 0', 0, 'P3') + '</div></div>' +
    '<div class="fp-grid2">' + pnl(h4('What went wrong', 'bad', '✕ 2 things') + r('bad', '<b>First death:</b> Brann at 1:42 to Grim Guillotine') + r('bad', '<b>Eternal Nightfall:</b> shield broke with 0.6s to spare') + r('warn', '<b>Mutagenic Venom ×2:</b> clipped by a carrier')) +
      pnl(h4('What went well', 'ok', '✓ 3 things') + r('ok', '<b>Orbs and frontals</b> clean this time') + r('ok', '<b>Every Wail of Terror</b> kicked') + r('ok', '<b>No deaths</b> until 1:42')) + '</div>' +
    pnl(h4('Fix first on the next pull') + '<ol class="fp-ol"><li><b>Grim Guillotine:</b> at least 5 in the circle</li><li><b>Eternal Nightfall:</b> save cooldowns for the shield</li></ol>');
  const tile = (k, t, s) => '<div class="fp-tile ' + k + '"><b>' + t + '</b><span>' + mark[k] + ' ' + s + '</span></div>';
  const mech = '<div class="fp-tiles">' + tile('bad', 'Deaths', '3 problems') + tile('bad', 'Guillotine soaks', '1 problem') + tile('warn', 'Venom orbs', '2 could be better') + tile('ok', 'Spiritcackle adds', 'clean') + '</div>' +
    pnl(h4('Guillotine soaks', 'bad', '✕ 1 problem') + r('ok', '<b>0:43</b> Guillotine · 7 in the circle') + r('ok', '<b>1:51</b> Guillotine · 5 in, 2 immunities') + r('bad', '<b>2:31</b> Grim Guillotine · 4 in, needs 5', 'Map')) +
    pnl(h4('Tank frontals', 'warn', '! could be better') + r('warn', '<b>1:12</b> Sever clipped Ilyra behind the tank', 'Ilyra') + r('ok', '<b>2:05</b> Sever · tanks only'));
  const assign = '<div class="fp-row">' + pnl(h4('Your NSRT note') + '<pre class="fp-code">intstart\nKaelis Brann Ilyra\nThessa Vosk Doran\nintend\n\nsoak1 Morwyn Kaelis Vosk\nsoak2 Brann Ilyra Thessa</pre>') +
    pnl(h4('Assignments vs what happened') + r('ok', '<b>Kicks, set 1</b> · in order: Kaelis, Brann, Ilyra') + r('bad', '<b>Kicks, set 2</b> · Vosk kicked in Thessa\'s turn', 'Vosk') + r('ok', '<b>Soak 1</b> · all 3 assigned players soaked') +
      r('bad', '<b>Soak 2</b> · Ilyra wasn\'t there', 'Ilyra') + r('ok', '<b>CC</b> · every globule set crowd controlled'), 'wide') + '</div>';
  const pulls = [['P1 · 62%', 12], ['P1 · 20%', 27], ['P2 · 80%', 37], ['P2 · 40%', 47], ['Int', 56], ['P3 · 70%', 69], ['P3 · 40%', 82], ['P3 · 15%', 93], ['Kill', 100]];
  const ends = [['Tank frontal on a non-tank', 6, '#e5534b'], ['Purple orb collision', 4, '#e5534b'], ['Guillotine under-soaked', 2, '#e8a23a']];
  const summary = pnl(h4('How far each pull got', 'kill', 'Killed on pull 9') + '<div class="fp-pulls">' + pulls.map(([t, d], i) => '<div class="fp-pc"><b>Pull ' + (i + 1) + '</b>' + t + '<i style="width:' + Math.max(6, d) + '%;background:' + (d >= 100 ? '#ff8000' : q(d)) + '"></i></div>').join('') + '</div>' +
      '<div class="fp-small">Coloured like item quality by how much of the whole encounter was done; a kill is orange.</div>') +
    '<div class="fp-row">' + pnl(h4('What ended the pulls') + '<div class="fp-ends">' + ends.map(([n, k, c]) => '<span>' + n + '</span><span class="fp-bar"><i style="width:' + Math.round(100 * k / 6) + '%;background:' + c + '"></i></span><span>' + k + ' pulls</span>').join('') + '</div>', 'wide') +
      pnl(h4('Focus for the next pulls') + '<ol class="fp-ol"><li><b>Tank frontals:</b> only tanks in front</li><li><b>Orbs:</b> carriers path around other orbs</li></ol>') + '</div>';
  return { scenes: { live, mech, assign, summary } };
}
// the front page's clicks: the preview's tabs and the four buttons under it both switch the preview (a button below the
// fold also brings the preview back into view)
function bindFront(auto) {
  const box = $('.home.fp'); if (!box) return;
  const show = (k) => {
    box.querySelectorAll('.fp-tabs button').forEach((b) => { const on = b.dataset.s === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    box.querySelectorAll('.fp-mods button').forEach((b) => { const on = b.dataset.s === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    box.querySelectorAll('.fp-scene').forEach((s) => s.classList.toggle('on', s.dataset.s === k));
  };
  let picked = false;
  box.querySelectorAll('.fp-tabs button').forEach((b) => { b.onclick = () => { picked = true; show(b.dataset.s); }; });
  box.querySelectorAll('.fp-mods button').forEach((b) => { b.onclick = () => { picked = true; show(b.dataset.s); const p = $('#fpPrev'), rc = p.getBoundingClientRect(); if (rc.top < 0 || rc.bottom > innerHeight) p.scrollIntoView({ behavior: 'smooth', block: 'center' }); }; });
  // (the website's preview moves on to the next view every 7 seconds, paused while the mouse is on it, until a view is picked)
  if (!auto || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t = setInterval(() => {
    if (!document.body.contains(box)) { clearInterval(t); return; }
    if (picked || box.querySelector('.fph-prev:hover')) return;
    const cur = FP_SCENES.findIndex(([k]) => box.querySelector('.fp-scene.on[data-s="' + k + '"]'));
    show(FP_SCENES[(cur + 1) % FP_SCENES.length][0]);
  }, 7000);
}
// the start screen's card icons (drawn here, no game art)
const HICO = {
  live: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.2"/><path d="M8.3 15.7a5.3 5.3 0 0 1 0-7.4M15.7 8.3a5.3 5.3 0 0 1 0 7.4M5.5 18.5a9.2 9.2 0 0 1 0-13M18.5 5.5a9.2 9.2 0 0 1 0 13"/></svg>',
  file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h7.5l4 4v13h-11.5z"/><path d="M14 3.5v4h4M9.5 12.5h5M9.5 16h5"/></svg>',
  wcl: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10.5M7.5 10 12 14.5l4.5-4.5M5 19.5h14"/></svg>' };
function home() {
  progLit(false);
  if (LIVE.on) setLive(false);
  FH.dir = null; liveUi(); // (no live button on the start screen)
  S.item = null; S.rep = null;
  $('#list').innerHTML = ''; $('#bossHead').innerHTML = ''; $('#bossPick').innerHTML = ''; // (no banner or pull cards on the start screen)
  $('.brand p').textContent = WCL.HOSTED ? 'Paste a Warcraft Logs link or drop your own log' : 'Retail combat logs, read on your PC'; // (not the last report's name)
  // (with a team added, home is your teams; "More ways in" shows the welcome page once)
  const full = S.homeFull; S.homeFull = false;
  if (!full && groups().length) { S.progView = null; PROG_BACK = null; HIST.load().then(() => { renderTeamsHome(); groupsBackfill(); }); return; }
  if (WCL.HOSTED && !window.WLA_DESKTOP) { homeHosted(); return; }
  // the front page (what people see first): the ways in beside a clickable preview of the app, and the four main views
  // underneath as buttons that switch it. The live button comes first; the other ways to follow a log and the help are
  // folded under the start panel.
  const fp = fpParts(), liveLab = 'Follow my combat log';
  const lock = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const MODS = { live: 'Between pulls: what went wrong, what went well, what to fix first.', mech: 'Every mechanic checked, with arena maps of who stood where.', assign: 'Your NSRT note against what actually happened.', summary: 'How far each pull got, and what ended them.' };
  // (your teams first once you have one: the way back into your progress; for someone new, the invite sits under the start box)
  const teamsTop = groups().length > 0;
  $('#main').innerHTML = '<div class="home fp">' + (teamsTop ? homeTeams() : '') +
    '<div class="fp-top">' +
    '<section class="fp-hero" id="fpStart"><div class="fp-intro"><div><div class="fp-k">Mythic raid logs, pull by pull</div><h1>Every pull, explained.</h1><p class="fp-lead">Debrief checks every mechanic, assignment and death in your combat log, and tells you what to fix before the next pull.</p></div>' +
      '<div class="fp-start">' +
        '<button class="btn primary fp-big" id="hLiveAuto">' + liveLab + '</button>' +
        '<div class="fp-sub">During raid: each pull shows up the moment it ends.</div><div class="hc-found" id="hLiveFound"></div>' +
        '<button class="btn" id="hLiveAgain" hidden></button><div class="fp-msg" id="hLiveMsg"></div>' +
        '<div class="fp-or">or look at a finished night</div>' +
        '<button class="btn" id="hFileGo">Open a combat log</button><div class="fp-sub">You can also drop it anywhere on this page.</div>' +
        '<label class="fp-lab" for="hWcl">Warcraft Logs report, yours or any public one</label><div class="fp-in"><input id="hWcl" placeholder="Paste a report link" autocomplete="off"><button class="btn" id="hWclGo">Import</button></div><div class="fp-msg" id="hWclMsg"></div>' +
        '<details class="fp-more"><summary>Other ways to follow a log</summary><div class="fp-mb"><button class="linkbtn" id="hLiveFile">Choose the file yourself</button><button class="linkbtn" id="hLiveDir">Pick the Logs folder</button>' +
          '<div class="fp-or2">A Warcraft Logs live report</div><div class="fp-in"><input id="hLive" placeholder="Live report link" autocomplete="off"><button class="btn" id="hLiveGo">Go live</button></div></div></details>' +
        '<details class="fp-more"><summary>Help getting started</summary><div class="fp-help">' +
          '<b>Live logging</b><ol><li>In WoW, turn on Advanced Combat Logging (Options, Network) and type <code>/combatlog</code>.</li><li>Click <b>' + liveLab + '</b>: Debrief finds the newest log in <code>World of Warcraft\\_retail_\\Logs</code> by itself and switches when WoW starts a new one. (If it can\'t find the folder, put its path in a <code>logs-path.txt</code> file next to start.bat.)</li><li>Keep this tab open: pulls are checked every 10 seconds.</li><li>For a Warcraft Logs live log, start the uploader with Live Log and paste its link under Other ways.</li></ol>' +
          '<b>Finding your combat log</b><ol><li>Turn on Advanced Combat Logging and type <code>/combatlog</code> before you pull.</li><li>The file is in <code>World of Warcraft\\_retail_\\Logs</code>.</li></ol>' +
          '<b>Warcraft Logs, the first time</b><ol><li>Warcraft Logs needs a free API client the first time (client ID and secret).</li><li>Import asks for them once and remembers them on this PC.</li></ol>' +
        '</div></details>' +
        '<div class="fp-safe">' + lock + 'Your log is read on this PC. Nothing is uploaded.</div>' +
      '</div></div>' +
      '<div class="fp-prev" id="fpPrev"><div class="fp-win"><div class="fp-chrome"><span class="fp-dots"><i></i><i></i><i></i></span><span>Debrief · The Coiled Altar · Mythic</span><span class="fp-ex">Example data</span></div>' +
        '<div class="fp-tabs">' + FP_SCENES.map(([k, t], i) => '<button type="button" data-s="' + k + '" aria-pressed="' + (i ? 'false' : 'true') + '"' + (i ? '' : ' class="on"') + '>' + t + '</button>').join('') + '</div>' +
        '<div class="fp-stage">' + FP_SCENES.map(([k], i) => '<div class="fp-scene' + (i ? '' : ' on') + '" data-s="' + k + '">' + fp.scenes[k] + '</div>').join('') + '</div></div>' +
        '<div class="fp-note">Example data. Click a tab to look around.</div></div></section></div>' +
    (teamsTop ? '' : homeTeams()) +
    '<section class="fp-ways"><h2>Four ways to look at a night</h2><div class="fp-mods">' + FP_SCENES.map(([k, t], i) => '<button type="button" data-s="' + k + '"' + (i ? '' : ' class="on"') + '><b>' + t + '</b><span>' + MODS[k] + '</span></button>').join('') + '</div></section>' +
    '<div class="home-foot">Built for Mythic progression in The Venomous Abyss.</div></div>';
  bindHomeTeams(); homeTeamsSoon();
  // open a report: with a saved login (or the hosted site) straight away; otherwise the login form, link filled in
  const go = async (inputId, msgId, live) => {
    const raw = $('#' + inputId).value, link = WCL.parseLink(raw), msg = $('#' + msgId);
    if (!link) { msg.textContent = 'That doesn\'t look like a Warcraft Logs report link.'; return; }
    msg.style.color = 'var(--muted)'; msg.textContent = 'Opening the report…';
    try {
      let creds = null;
      if (!WCL.HOSTED) { const j = await fetch('/wcl/login').then((r) => r.json()).catch(() => ({})); if (!j.saved) { try { sessionStorage.setItem('wla-live', live ? '1' : ''); } catch (e) { /* ignore */ } wclPanel('Connect Warcraft Logs once, then click Load report.', raw); return; } creds = { id: j.id, secret: '' }; }
      try { sessionStorage.setItem('wla-live', live ? '1' : ''); } catch (e) { /* ignore */ }
      await openWcl(link, creds, live);
    } catch (err) { msg.style.color = ''; msg.textContent = err.message; }
  };
  $('#hLiveGo').onclick = () => go('hLive', 'hLiveMsg', true);
  $('#hWclGo').onclick = () => go('hWcl', 'hWclMsg', false);
  $('#hLive').onkeydown = (e) => { if (e.key === 'Enter') go('hLive', 'hLiveMsg', true); };
  $('#hWcl').onkeydown = (e) => { if (e.key === 'Enter') go('hWcl', 'hWclMsg', false); };
  $('#hFileGo').onclick = () => $('#fileIn').click();
  bindFront();
  const pickMsg = () => $('#hPickMsg') || $('#hLiveMsg');
  $('#hLiveFile').onclick = () => pickLogFile(pickMsg(), false);
  if ($('#hLiveAuto')) {
    $('#hLiveAuto').onclick = () => startFileLive(HELPER_LOG);
    // say which log it found (or why it can't), so there are no surprises
    helperInfo().then((j) => { const el = $('#hLiveFound'); if (!el) return; el.textContent = j.error === 'nodir' ? 'WoW Logs folder not found: see How to live log.' : j.error ? 'No combat log yet: type /combatlog in game.' : 'Found ' + j.name.replace(/\.txt$/i, '') + ' (' + (j.size / 1e6).toFixed(0) + ' MB, updated ' + wallClock(j.mtime) + ')'; }).catch((e) => { const el = $('#hLiveFound'); if (el) el.textContent = 'To use this, ' + e.message.replace(/^the/, 'the') + '.'; });
  }
  $('#hLiveDir').onclick = () => pickLogFolder(pickMsg(), false);
  // a folder chosen before: one click to watch it again (the browser asks to confirm access once per session)
  fhGet().then((dir) => { const b = $('#hLiveAgain'); if (!dir || !b) return; b.hidden = false; b.textContent = 'Watch "' + dir.name.replace(/\.txt$/i, '') + '" again'; b.onclick = () => (dir.kind === 'file' ? pickLogFile : pickLogFolder)(pickMsg(), true); });
}
// The website's front page: one box for any Warcraft Logs link (a report still being logged turns live on by itself, see
// openWcl), then what you get: the four main views as cards that switch an app-like preview (made-up example data),
// moving on by itself every few seconds until a card is clicked. A website can't follow the combat log where WoW is
// usually installed (Chrome keeps every page out of Program Files: "can't open files in this folder because it contains
// system files"), so the site has no live-file option; a finished log can still be opened or dropped on the page (a
// plain file pick isn't blocked).
// The start screen's "Your progress": a card per team or character (bosses killed on each difficulty they pulled, and
// their last night), each opening its Progress; with none yet, one card that invites adding your team
// ---- the home page once you have a team: your teams, with a slim bar for logs on top ----
// The bar has the everyday ways in: follow my combat log (on this PC), open a combat log, and any Warcraft Logs link (a
// report still being logged goes live by itself); "More ways in" opens the full welcome page once. Someone with no team
// yet gets the welcome page as before.
async function openReportLink(raw, msg) {
  const link = WCL.parseLink(raw);
  if (!link) { msg.style.color = ''; msg.textContent = 'That doesn\'t look like a Warcraft Logs report link. (A team or character page goes in the Add card below.)'; return; }
  msg.style.color = 'var(--muted)'; msg.textContent = 'Opening the report…';
  try {
    let creds = null;
    if (!WCL.HOSTED) { const j = await fetch('/wcl/login').then((r) => r.json()).catch(() => ({})); if (!j.saved) { wclPanel('Connect Warcraft Logs once, then click Load report.', raw); return; } creds = { id: j.id, secret: '' }; }
    try { sessionStorage.setItem('wla-live', ''); } catch (e) { /* ignore */ }
    await openWcl(link, creds, false);
  } catch (err) { msg.style.color = ''; msg.textContent = err.message; }
}
// (the hero: the headline, one rounded box for any live log or report, and the other ways in as small links under it)
const TH_ICO = {
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5z"/></svg>',
  file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  tour: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' };
function teamsBar() {
  const local = !(WCL.HOSTED && !window.WLA_DESKTOP);
  return '<section class="th-hero"><h1>Every pull, explained.</h1><p class="th-lead">Open tonight\'s raid, or pick up where your team left off.</p>' +
    '<div class="th-box">' + TH_ICO.link + '<input id="thWcl" placeholder="' + (local ? 'Paste any Warcraft Logs report link' : 'Paste your raid\'s live log, or any Warcraft Logs report') + '" autocomplete="off" aria-label="Warcraft Logs report link"><button class="btn primary" id="thWclGo" type="button">Open</button></div>' +
    '<div class="th-links">' + (local ? '<button type="button" id="thLive">' + TH_ICO.play + 'Follow my combat log</button>' : '') + '<button type="button" id="thFile">' + TH_ICO.file + 'Open a log file</button>' +
      '<button type="button" id="thTour">' + TH_ICO.tour + 'Take the tour</button><button type="button" id="thMore">' + TH_ICO.more + 'More ways in</button></div>' +
    '<div class="th-msg"><span class="sub" id="thFound"></span><span class="fp-msg" id="thMsg"></span></div></section>';
}
// A team's tile on the home page: its banner, name, and rank or guild; a strip of one square per boss on the hardest
// difficulty it pulled (orange once killed, otherwise the colour of its best pull, dark when not pulled yet); and where it
// is now: the boss it pulled most recently without a kill, and its best there. A character also shows their parses once
// their page has read them.
function teamTile(g, all, order) {
  const mine = all.filter(groupFilter(g)), d = DIFF_ORDER.find(([x]) => mine.some((v) => v.diffId === x)), cls = g.kind === 'char' && g.cls && E.CLASSES[g.cls];
  let strip = '', line = 'not imported yet';
  if (d) {
    const on = mine.filter((v) => v.diffId === d[0]), bestOf = (l) => l.filter((v) => v.left != null).reduce((m, v) => (!m || v.left < m.left ? v : m), null);
    strip = order.map((b) => { const l = on.filter((v) => v.boss === b), k = l.some((v) => v.kill), bst = !k && bestOf(l), col = k ? '#ff8000' : bst ? (PULL_Q.find(([lo]) => 100 - bst.left >= lo) || [0, '#9d9d9d'])[1] : '';
      return '<i' + (col ? ' style="background:' + col + '"' : '') + ' title="' + esc(b + ': ' + (k ? 'killed' : bst ? 'best ' + bst.label : l.length ? 'pulled' : 'not pulled yet')) + '"></i>'; }).join('');
    const kills = order.filter((b) => on.some((v) => v.boss === b && v.kill)).length;
    const open = on.filter((v) => !on.some((x) => x.boss === v.boss && x.kill)).sort((a, b) => b.at - a.at)[0], nb = open && bestOf(on.filter((v) => v.boss === open.boss));
    line = kills + '/' + order.length + ' ' + d[1] + (open ? ' · now on ' + esc(open.boss) + (nb ? ', best ' + esc(nb.label) : '') : kills === order.length ? ' · all killed' : '');
  }
  const sub = cls ? charAff(g).replace('class="ht-g"', 'class="tt-g"') || '<span class="tt-g">' + esc(cls[0]) + '</span>' : g.rank && (g.rank.w || g.rank.r) ? '<span class="tt-g tt-rk">' + (g.rank.w ? 'World #' + g.rank.w.toLocaleString('en-US') : '') + (g.rank.w && g.rank.r ? ' · ' : '') + (g.rank.r ? esc(g.rank.rn || 'Region') + ' #' + g.rank.r.toLocaleString('en-US') : '') + '</span>' : '<span class="tt-g">' + esc(gKind(g) + (g.server ? ' · ' + g.server : '')) + '</span>';
  const parse = cls && g.parse ? '<span class="tt-p">' + esc(g.parse.spec) + ' · ' + Math.floor(g.parse.best) + ' best average · ' + Math.floor(g.parse.med) + ' median</span>' : '';
  return '<button class="tt-card" type="button" data-g="' + esc(g.gid) + '">' + banner(g) + '<span class="tt-b"><span class="tt-n"' + (cls ? ' style="color:' + cls[1] + '"' : '') + '>' + esc(gName(g)) + '</span>' + sub +
    (strip ? '<span class="tt-strip" aria-hidden="true">' + strip + '</span>' : '') + '<span class="tt-l">' + line + '</span>' + parse + '</span></button>';
}
// "What Debrief does": four small previews that play a short animation, each opening the tour at its step
function homePreviews() {
  const card = (k, t, body) => '<button class="tp-card" type="button" data-tour="' + k + '"><span class="tp-t">' + t + '</span><span class="tp-art">' + body + '</span></button>';
  return '<section class="th-what"><h2>What Debrief does</h2><div class="tp-row">' +
    card(1, 'Latest pull', '<span class="tp-l ok">✓ Every kick landed</span><span class="tp-l bad">✕ First death: Caustic Waves</span><span class="tp-l warn">! Missed soak, 2 players</span><span class="tp-l fix">Fix first: spread for the waves</span>') +
    card(2, 'Mechanics', '<span class="tp-chips"><span class="bad">Eggs ✕3</span><span class="warn">Soak !1</span><span class="ok">+6 clean</span></span><svg class="tp-map" viewBox="0 0 120 44" aria-hidden="true"><circle cx="86" cy="22" r="13" class="tp-zone"/><circle cx="20" cy="22" r="4" class="tp-dot"/></svg>') +
    card(3, 'Performance', '<span class="tp-bars"><i style="--w:96%;--c:#C69B6D"></i><i style="--w:84%;--c:#3FC7EB"></i><i style="--w:73%;--c:#B44BE0"></i><i style="--w:61%;--c:#AAD372"></i></span>') +
    card(4, 'Progress', '<svg class="tp-line" viewBox="0 0 120 44" aria-hidden="true"><polyline class="a" points="2,8 20,16 36,11 54,24 70,21 88,32 104,29 118,40"/><polyline class="b" points="2,8 20,11 54,24 88,32 118,40"/></svg>') + '</div></section>';
}
// ---- the tour: five short steps on a first visit, required once (no close button), remembered in this browser ----
// Each step has a small picture that animates in (the logo drawing itself, a pull card building line by line, a player
// walking into a soak, meter bars growing, a progress strip filling). Someone who opens a shared pull link sees that pull
// first, and the tour right after. "Take the tour" (home page, menu) plays it again.
const TOUR_KEY = 'wla-tour-done', tourDone = () => store.get(TOUR_KEY) === '1';
const TOUR = [
  { t: 'Welcome to Debrief', p: 'Debrief reads your raid\'s combat logs and Warcraft Logs reports, and turns every pull into a short list: what went wrong, what went right, and what to fix next. Here\'s a quick look around.',
    art: () => '<svg class="tr-logo" viewBox="0 0 64 64" aria-hidden="true"><path class="s1" d="M32 3 56 12v18c0 15-11 26-24 31C19 56 8 45 8 30V12Z"/><path class="s2" d="M22 18h10c9 0 14 6 14 14s-5 14-14 14H22Z"/><path class="s3" d="m27 32.5 4 4 8.5-9.5"/></svg>' },
  { t: 'Every pull, explained', p: 'The moment a pull ends, its card shows what went well, what went wrong, and the one thing to fix before you pull again. Click a pull at the top to see any of them.',
    art: () => '<div class="tr-pull"><span class="k">Pull 18 · Mythic</span><b>Wipe in P2 · Malacrass 34%</b><span class="l ok">✓ Every Wail of Terror kicked</span><span class="l bad">✕ First death: Brann at 1:42, Grim Guillotine</span><span class="l warn">! 2 players missed the soak</span><span class="l fix">Fix first: at least 5 in the circle</span></div>' },
  { t: 'Mechanics and assignments', p: 'Every mechanic is checked for every player, with a map of who stood where. Add your raid\'s NSRT note and Debrief checks soaks, kicks and cooldowns against it.',
    art: () => '<div class="tr-mech"><span class="tp-chips"><span class="bad">Eggs ✕3</span><span class="warn">Soak !1</span><span class="ok">+6 clean</span></span><svg viewBox="0 0 200 70" aria-hidden="true"><circle cx="140" cy="35" r="22" class="tp-zone"/><circle cx="26" cy="35" r="6" class="tp-dot"/><circle cx="148" cy="26" r="5" class="tp-dot2"/><circle cx="131" cy="44" r="5" class="tp-dot2"/></svg></div>' },
  { t: 'Performance', p: 'Damage, healing, damage taken, utility and survivability, like Warcraft Logs but with the why: deaths, cooldowns, mana and defensives. Hover any chart for its numbers.',
    art: () => '<div class="tr-perf tp-bars"><i style="--w:96%;--c:#C69B6D"></i><i style="--w:86%;--c:#3FC7EB"></i><i style="--w:77%;--c:#B44BE0"></i><i style="--w:69%;--c:#AAD372"></i><i style="--w:58%;--c:#F48CBA"></i></div>' },
  { t: 'Your team\'s progress', p: 'Add your team, guild or your own character from Warcraft Logs: every raid night, boss by boss, with your rankings. New nights come in by themselves.',
    art: () => '<div class="tr-prog"><span class="tr-strip">' + [1, 1, 1, 1, 1, 1, 1, 0, 0, 0].map((k, i) => '<i class="' + (k ? 'k' : '') + '" style="--d:' + (i * 0.12).toFixed(2) + 's"></i>').join('') + '</span><span class="tr-pl">7/10 Mythic · now on The Coiled Altar, best 40%</span></div>' },
];
function startTour(at) {
  if ($('#tour')) return;
  let i = Math.max(0, Math.min(TOUR.length - 1, at || 0));
  const el = document.createElement('div'); el.id = 'tour'; el.className = 'tour'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'A quick tour of Debrief');
  document.body.appendChild(el); document.body.classList.add('touring');
  const finish = (go) => { store.set(TOUR_KEY, '1'); document.removeEventListener('keydown', key, true); el.classList.add('out'); document.body.classList.remove('touring'); setTimeout(() => el.remove(), 260);
    if (go === 'add') { S.pgFocusAdd = true; progressPage(); } else if (go === 'teams') home(); };
  const draw = () => { const s = TOUR[i], last = i === TOUR.length - 1, has = groups().length > 0;
    el.innerHTML = '<div class="tr-card" key="' + i + '"><div class="tr-bar">' + TOUR.map((_, j) => '<i' + (j <= i ? ' class="on"' : '') + '></i>').join('') + '</div>' +
      '<div class="tr-art">' + s.art() + '</div><h2>' + esc(s.t) + '</h2><p>' + esc(s.p) + '</p>' +
      '<div class="tr-nav"><span class="sub">' + (i + 1) + ' of ' + TOUR.length + '</span><div>' + (i ? '<button class="btn" data-tr="back" type="button">Back</button>' : '') +
      (!last ? '<button class="btn primary" data-tr="next" type="button">' + (i ? 'Next' : 'Show me') + '</button>' : has ? '<button class="btn primary" data-tr="teams" type="button">Take me in</button>' : '<button class="btn" data-tr="in" type="button">Take me in</button><button class="btn primary" data-tr="add" type="button">Add my team</button>') + '</div></div></div>';
    el.querySelectorAll('[data-tr]').forEach((b) => (b.onclick = () => { const a = b.dataset.tr; if (a === 'next') { i++; draw(); } else if (a === 'back') { i--; draw(); } else finish(a); }));
    const f = el.querySelector('.btn.primary'); if (f) f.focus(); };
  // (Enter or → for next, ← for back; Escape doesn't close it: the tour is a must once)
  const key = (e) => { if (!document.body.contains(el)) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); } else if (e.key === 'ArrowRight' && i < TOUR.length - 1) { i++; draw(); } else if (e.key === 'ArrowLeft' && i > 0) { i--; draw(); } };
  document.addEventListener('keydown', key, true);
  draw();
}
// ---- page tips: the first time you open a page, its main parts are pointed out one at a time ----
// The page dims except for one spot, with a bubble beside it (what it is, what to do with it), Back and Next, then
// "Got it". Required once per page in this browser, like the tour (no close; Escape doesn't skip it); a part that isn't
// on the page (no note yet, say) is skipped. They wait until the home tour is done, and for the page to fill in.
// "Tips for this page" in the menu plays them again. (Performance gets its tips once it's reworked.)
const PAGE_TIPS = {
  live: [
    { sel: '#list .film', t: 'Every pull of the night', p: 'Each card is one pull. Click one to see it. Its colour shows how far it got, and orange is a kill.' },
    { sel: '#bossHead header.fight', t: 'The pull at a glance', p: 'Its result, how it compares to the pull before, and your team\'s progress: click the team to see every boss and night.' },
    { sel: '#view .wr-wrap', t: 'What went well, and what to fix', p: 'What the raid did well comes first. Under it, what went wrong (the worst first), and beside that, the one thing to fix before you pull again.' },
    { sel: '.tabbar .tabs', t: 'Go deeper', p: 'Teams, on the left, is your raid\'s progress, every boss and night. The other tabs dig into this pull: every mechanic, your assignments, the meters, the whole night and every player.' },
    { sel: '#cutSide', t: 'The wipe filter', p: 'On a wipe, stop counting after a set number of deaths, so the last seconds of a wipe don\'t pile up mistakes.' }],
  overview: [
    { sel: '#assignBox .noteempty, #assignBox .notebar', t: 'Your raid\'s plan', p: 'Paste your NSRT note once. Debrief checks every assignment in it on every pull: soaks, kicks, orbs and cooldowns.' },
    { sel: '#view .as-tiles', t: 'Each assignment at a glance', p: 'Red went wrong, green was done. Click one to jump straight to it.' }],
  audit: [
    { sel: '#view .mscore', t: 'Every mechanic in one line', p: 'Red and amber chips went wrong. Click one to jump straight to it.' },
    { sel: '#view details.secd', t: 'Open a mechanic', p: 'Each one shows who got it wrong, when, and on many, a map of where everyone stood.' }],
  night: [
    { sel: '#sum-prog', t: 'How far the night got', p: 'Every pull of the night on one chart: lower is further. Click a dot to open that pull.' },
    { sel: '#view .sum-rc', t: 'The night\'s grades', p: 'Mechanics and assignments, graded over every pull of the night.' },
    { sel: '#view .sumv details.secd', t: 'Each mechanic, pull by pull', p: 'A square per pull: green clean, amber could be better, red went wrong. Click a square to open that pull.' }],
  player: [
    { sel: '#view .plsw', t: 'The whole night, or one pull', p: 'Look at every pull of the night together, or just the pull you\'re on.' },
    { sel: '#view .plmv', t: 'MVPs of the night', p: 'The best tank, healers and DPS by execution, survival and readiness.' },
    { sel: '#view .plr-list', t: 'Every player', p: 'Gear, consumables, survival and what stands out. Click a player for their full sheet.' }],
  hub: [
    { sel: '.pg-hub .ht-card', t: 'Your teams', p: 'Each team or character, with its kills on each difficulty. Click one for every boss and night.' },
    { sel: '.pg-hub .pg-addc', t: 'Add more', p: 'Paste a team, guild or character page from Warcraft Logs. "Which link?" says exactly what to copy.' }],
  team: [
    { sel: '.pc-diffs', t: 'Pick a difficulty', p: 'Mythic, Heroic, Normal and LFR, with how many bosses are down on each.' },
    { sel: '#pgRank', t: 'Rankings', p: 'Your Warcraft Logs rankings this tier.' },
    { sel: '.pc-grid .pc-card', t: 'Each boss', p: 'Its result and totals. Click a boss for the chart of every pull and its nights.' },
    { sel: '#pgEdit', t: 'Edit', p: 'Rename this team, or remove it.' }],
};
const TIPS_KEY = (k) => 'wla-tips-' + k;
// (which page is up: a pull's tab, the teams page, or a team's page)
const tipsPage = () => ($('#main .pg-hub') && !S.hubHome ? 'hub' : $('#pgEdit') ? 'team' : S.rep && $('#view') ? S.tab : null);
const tipVis = (sel) => { for (const e of document.querySelectorAll(sel)) { const b = e.getBoundingClientRect(); if (b.width > 4 && b.height > 4) return e; } return null; };
let TIPS_WAIT = null;
function pageTips(k, force) {
  if (!k || !PAGE_TIPS[k] || $('#tour') || $('#ptip') || (!force && (store.get(TIPS_KEY(k)) === '1' || !tourDone()))) return;
  if (TIPS_WAIT === k && !force) return; TIPS_WAIT = k;
  // (pages that fill in bit by bit, like Summary and Player audit: once the first part is up, the rest get a few more
  // seconds to appear before the tips start)
  const t0 = Date.now(); let first = 0;
  const wait = () => {
    if (tipsPage() !== k) { TIPS_WAIT = null; return; } // (you've moved on: the tips wait for your next visit)
    const steps = PAGE_TIPS[k].filter((s) => tipVis(s.sel)), now = Date.now();
    if (steps.length && !first) first = now;
    const allUp = steps.length === PAGE_TIPS[k].length, firstUp = !!tipVis(PAGE_TIPS[k][0].sel);
    if (!allUp && now - t0 < 10000 && (!firstUp || now - first < 3000)) { setTimeout(wait, 300); return; }
    TIPS_WAIT = null; if (steps.length) runTips(k, steps);
  };
  setTimeout(wait, 600);
}
function runTips(k, steps) {
  if ($('#ptip') || $('#tour')) return;
  let i = 0, raf = 0;
  const ov = document.createElement('div'); ov.id = 'ptip'; ov.className = 'ptip';
  ov.innerHTML = '<div class="pt-hole"></div><div class="pt-bub" role="dialog" aria-modal="true" aria-label="Tips for this page"></div>';
  document.body.appendChild(ov);
  const hole = ov.querySelector('.pt-hole'), bub = ov.querySelector('.pt-bub');
  // (the window around the spot, and the bubble below it, or above when there's no room; both follow a scroll)
  const place = () => { const e = tipVis(steps[i].sel); if (!e) return; const b = e.getBoundingClientRect(), pad = 6, h = Math.min(b.height + 2 * pad, innerHeight - 24);
    hole.style.left = (b.left - pad) + 'px'; hole.style.top = (b.top - pad) + 'px'; hole.style.width = (b.width + 2 * pad) + 'px'; hole.style.height = h + 'px';
    const bw = Math.min(360, innerWidth - 24); bub.style.width = bw + 'px'; const bh = bub.offsetHeight;
    let top = b.top - pad + h + 14, side = 'b'; if (top + bh > innerHeight - 10) { top = b.top - pad - bh - 14; side = 't'; } if (top < 10) { top = Math.max(10, Math.min(innerHeight - bh - 10, b.top + 12)); side = 'n'; }
    const left = Math.max(12, Math.min(innerWidth - bw - 12, b.left + Math.min(24, b.width / 2) - 24));
    bub.style.top = top + 'px'; bub.style.left = left + 'px'; bub.dataset.side = side; bub.style.setProperty('--ax', Math.max(18, Math.min(bw - 18, b.left + Math.min(b.width / 2, 60) - left)) + 'px'); };
  const follow = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
  const finish = () => { store.set(TIPS_KEY(k), '1'); removeEventListener('scroll', follow, true); removeEventListener('resize', follow); document.removeEventListener('keydown', key, true); ov.classList.add('out'); setTimeout(() => ov.remove(), 220); };
  const draw = () => { const s = steps[i], last = i === steps.length - 1, e = tipVis(s.sel);
    bub.innerHTML = '<div class="pt-k">' + (i + 1) + ' of ' + steps.length + '</div><b>' + esc(s.t) + '</b><p>' + esc(s.p) + '</p><div class="pt-nav">' + (i ? '<button class="btn" data-p="back" type="button">Back</button>' : '') +
      '<button class="btn primary" data-p="' + (last ? 'done' : 'next') + '" type="button">' + (last ? 'Got it' : 'Next') + '</button></div>';
    bub.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => { const a = b.dataset.p; if (a === 'next') { i++; draw(); } else if (a === 'back') { i--; draw(); } else finish(); }));
    bub.classList.remove('in'); void bub.offsetWidth; bub.classList.add('in');
    if (e) { const b = e.getBoundingClientRect(); if (b.top < 70 || b.bottom > innerHeight - 40) e.scrollIntoView({ block: 'center' }); }
    place(); const f = bub.querySelector('.btn.primary'); if (f) f.focus(); };
  // (Enter or → for next, ← for back; Escape doesn't skip it)
  const key = (e) => { if (!document.body.contains(ov)) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); } else if (e.key === 'ArrowRight' && i < steps.length - 1) { i++; draw(); } else if (e.key === 'ArrowLeft' && i > 0) { i--; draw(); } };
  addEventListener('scroll', follow, true); addEventListener('resize', follow); document.addEventListener('keydown', key, true);
  draw();
}
// the home page itself, once you have a team
function renderTeamsHome() {
  const gl = groups(), order = E.PACKS.map((p) => p.encounter), all = [...HIST.mem.values()].filter((v) => order.includes(v.boss));
  const last = gl.reduce((m, g) => Math.max(m, g.last || 0), 0), ago = last ? Math.max(0, Math.round((Date.now() - last) / 60000)) : null;
  $('#main').innerHTML = '<div class="home th-home2">' + teamsBar() +
    '<section class="th-teams"><div class="th-h"><h2>Your teams</h2>' + (ago != null ? '<span class="sub">' + (S.progBusy ? 'checking for new nights…' : 'checked ' + (ago < 1 ? 'just now' : ago < 60 ? plural(ago, 'minute') + ' ago' : ago < 1440 ? plural(Math.round(ago / 60), 'hour') + ' ago' : 'on ' + esc(nightLabel(last + 6 * 3600e3)))) + '</span>' : '') + '</div>' +
      '<div class="tt-row">' + gl.map((g) => teamTile(g, all, order)).join('') + '<button class="tt-card tt-add" type="button" data-g="+"><span class="tt-plus" aria-hidden="true">+</span><span class="tt-n">Add a team</span><span class="tt-l">or your character</span></button></div></section>' +
    homePreviews() + '<div class="home-foot">Built for Mythic progression in The Venomous Abyss.</div></div>';
  progLit(false); bindTeamsBar();
  $$('#main .tt-card').forEach((b) => (b.onclick = () => { const v = b.dataset.g; S.pgFocusAdd = v === '+'; progressPage(undefined, v === '+' ? null : v); window.scrollTo(0, 0); }));
  $$('#main .tp-card').forEach((b) => (b.onclick = () => startTour(+b.dataset.tour)));
}
function bindTeamsBar() {
  const msg = $('#thMsg');
  $('#thWclGo').onclick = () => openReportLink($('#thWcl').value, msg);
  $('#thWcl').onkeydown = (e) => { if (e.key === 'Enter') openReportLink($('#thWcl').value, msg); };
  $('#thWcl').onpaste = () => setTimeout(() => { if (WCL.parseLink($('#thWcl').value)) openReportLink($('#thWcl').value, msg); }, 50); // (a pasted link opens at once)
  $('#thFile').onclick = () => $('#fileIn').click();
  $('#thMore').onclick = () => { S.homeFull = true; home(); window.scrollTo(0, 0); };
  if ($('#thTour')) $('#thTour').onclick = () => startTour(0);
  if ($('#thLive')) { $('#thLive').onclick = () => startFileLive(HELPER_LOG);
    helperInfo().then((j) => { const el = $('#thFound'); if (!el) return; el.textContent = j.error === 'nodir' ? 'WoW Logs folder not found: see More ways in.' : j.error ? 'No combat log yet: type /combatlog in game.' : 'Your combat log: ' + j.name.replace(/\.txt$/i, '') + ', updated ' + wallClock(j.mtime); }).catch(() => { /* (the helper isn't running: the button says why when clicked) */ }); }
}
function homeTeams() {
  const gl = groups(), order = E.PACKS.map((p) => p.encounter), all = [...HIST.mem.values()].filter((v) => order.includes(v.boss));
  // (an Add card always ends the row: the way to bring in a team, a guild or your own character)
  return '<section class="home-teams" id="homeTeams"><div class="ht-h"><h2>Your progress</h2></div><div class="ht-row">' + gl.map((g) => teamCard(g, all, order, false)).join('') +
    '<button class="ht-card ht-add" type="button" data-g="+"><span class="ht-n">+ ' + (gl.length ? 'Add a team or character' : 'Add your team') + '</span><span class="ht-k">Your team, guild or character page from Warcraft Logs: every raid night of the tier, boss by boss.</span></button></div></section>';
}
// (a team's card opens its page; "add" opens the teams page, ready to paste a link)
function bindHomeTeams() {
  $$('#homeTeams [data-g]').forEach((b) => (b.onclick = () => { const v = b.dataset.g; S.pgFocusAdd = v === '+'; progressPage(undefined, v === '+' ? null : v); }));
}
// (the cards fill in once the saved pulls have loaded)
const homeTeamsSoon = () => HIST.load().then(() => { const s = $('#homeTeams'); if (s) { s.outerHTML = homeTeams(); bindHomeTeams(); } groupsBackfill(); });
function homeHosted() {
  const fp = fpParts();
  const MODS = { live: 'What went wrong, what went well, what to fix first.', mech: 'Every mechanic checked, with maps of who stood where.', assign: 'Your NSRT note against what really happened.', summary: 'How far each pull got, and what ended them.' };
  const teamsTop = groups().length > 0; // (your teams first once you have one; for someone new, the invite under the start box)
  $('#main').innerHTML = '<div class="home fp fph">' + (teamsTop ? homeTeams() : '') +
    '<section class="fph-hero" id="fpStart"><div class="fp-k">Mythic raid logs, pull by pull</div><h1>Every pull, explained.</h1>' +
      '<p class="fp-lead">Debrief checks every mechanic, assignment and death, and tells you what to fix before the next pull.</p>' +
      '<div class="fph-main"><div class="fph-h">' + HICO.live + '<b>Live logging</b><span>during raid</span></div>' +
        '<div class="fph-box"><input id="hLive" placeholder="Paste your raid\'s live log link" autocomplete="off" aria-label="Warcraft Logs live log link"><button class="btn primary" id="hLiveGo">Go live</button></div><div class="fp-msg" id="hLiveMsg"></div>' +
        '<div class="fph-note">Each pull shows up here about a minute after it ends. <button class="linkbtn" id="hHow" type="button" aria-expanded="false">How to live log</button></div>' +
        '<ol class="fph-how" id="hHowList" hidden><li>Whoever logs for the raid opens the Warcraft Logs uploader and starts <b>Live Log</b>.</li><li>Copy the live log\'s link (it\'s on warcraftlogs.com too, under your guild\'s reports).</li><li>Paste it above and keep this tab open during raid.</li></ol></div>' +
      '<div class="fph-sec"><div class="fph-sl">Looking at a finished night?</div>' +
        '<div class="fph-box sm"><input id="hWcl" placeholder="Paste any Warcraft Logs report link" autocomplete="off" aria-label="Warcraft Logs report link"><button class="btn" id="hWclGo">Open</button></div><div class="fp-msg" id="hWclMsg"></div>' +
        '<div class="fph-alt">Or <button class="linkbtn" id="hFileGo" type="button">open a combat log</button> from this PC, or drop it anywhere on this page.</div></div></section>' +
    '<section class="fph-prev"><h2>What you get</h2>' +
      '<div class="fp-mods">' + FP_SCENES.map(([k, t], i) => '<button type="button" data-s="' + k + '"' + (i ? '' : ' class="on"') + '><b>' + t + '</b><span>' + MODS[k] + '</span></button>').join('') + '</div>' +
      '<div class="fp-prev" id="fpPrev"><div class="fp-win"><div class="fp-chrome"><span class="fp-dots"><i></i><i></i><i></i></span><span>Debrief · The Coiled Altar · Mythic</span><span class="fp-ex">Example data</span></div>' +
        '<div class="fp-stage">' + FP_SCENES.map(([k], i) => '<div class="fp-scene' + (i ? '' : ' on') + '" data-s="' + k + '">' + fp.scenes[k] + '</div>').join('') + '</div></div></div></section>' +
    (teamsTop ? '' : homeTeams()) +
    '<div class="home-foot">Built for Mythic progression in The Venomous Abyss.</div></div>';
  bindHomeTeams(); homeTeamsSoon();
  // (either box takes any report link: the live one follows it from the start, the other turns live on by itself if the
  // report is still being logged)
  const go = async (k, live) => {
    const inp = $('#h' + k), btn = $('#h' + k + 'Go'), msg = $('#h' + k + 'Msg'), link = WCL.parseLink(inp.value);
    if (!link) { msg.style.color = ''; msg.textContent = 'That doesn\'t look like a Warcraft Logs link.'; return; }
    msg.style.color = 'var(--muted)'; msg.textContent = live ? 'Opening the live log…' : 'Opening the report…'; btn.disabled = true;
    try { await openWcl(link, null, live); } catch (err) { if (document.body.contains(btn)) { btn.disabled = false; msg.style.color = ''; msg.textContent = err.message; } }
  };
  for (const [k, live] of [['Live', true], ['Wcl', false]]) {
    $('#h' + k + 'Go').onclick = () => go(k, live);
    $('#h' + k).onkeydown = (e) => { if (e.key === 'Enter') go(k, live); };
    $('#h' + k).onpaste = () => setTimeout(() => { if (WCL.parseLink($('#h' + k).value)) go(k, live); }, 50); // (a pasted link opens at once)
  }
  $('#hHow').onclick = () => { const l = $('#hHowList'); l.hidden = !l.hidden; $('#hHow').setAttribute('aria-expanded', String(!l.hidden)); };
  $('#hFileGo').onclick = () => $('#fileIn').click();
  bindFront(true);
}
// (said on the website when a file pick ends without a file: usually Chrome refusing the WoW folder)
const BLOCKED_HINT = 'If Chrome said it can\'t open files in that folder: that\'s Chrome protecting Program Files, and a website can\'t get past it. Use a Warcraft Logs live log instead.';
// ---------- Progress: every boss of the tier, night by night, from the pulls saved on this PC ----------
// One row per boss and difficulty, in raid order, with a coloured left edge like everywhere else: orange once killed,
// otherwise item quality by how much of the encounter its best pull got through. A row opens its nights: pulls, kill or
// best, and time, and for a Warcraft Logs night Open (the report at that boss) and Save in full (every pull of the boss
// that night downloaded to this PC, to open later without waiting and to re-check with newer checks). Your team's reports
// come in from the card at the top.
const DIFF_ORDER = [[16, 'Mythic'], [15, 'Heroic'], [14, 'Normal'], [17, 'LFR']];
// (the pull you came from, for the page's "Back to" link: Progress has no tab bar)
let PROG_BACK = null;
// (view: a team's gid to open its page, '*' for everything saved; left out, the teams page)
function progressPage(msg, view) {
  progLit(true); S.progView = view == null ? null : view; S.pgRename = S.pgDel = S.pgEdit = false; S.hubHome = false;
  if (S.item) PROG_BACK = S.item;
  S.item = null; S.rep = null;
  $('#list').innerHTML = ''; $('#bossHead').innerHTML = ''; $('#bossPick').innerHTML = '';
  HIST.load().then(histTidy).then(() => { renderProgress(msg); groupsBackfill(); });
}
const PROG_DIFF_KEY = 'wla-prog-diff';
const durH = (s) => (s >= 3600 ? Math.floor(s / 3600) + 'h ' + String(Math.round((s % 3600) / 60)).padStart(2, '0') + 'm' : T(s)); // (time on a boss: "2h 05m")
// one boss on one difficulty: every saved pull in order, as a chart like the Summary's "How far the night got" (lower
// is further; multi-phase fights in stage bands sized by their share of the encounter), one line per pull plus the best
// so far, nights split by a dashed line, a kill as an orange dot
function progChart(list, boss) {
  const W = 560, H = 160, L = 34, R = 10, Tp = 8, B = 22, n = list.length;
  const X = (i) => L + (n <= 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1)), Y = (v) => Tp + ((100 - v) / 100) * (H - Tp - B);
  const cfg = PROGRESS[boss] && !PROGRESS[boss].pool ? PROGRESS[boss] : null;
  let s = '<svg class="pc-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="How far each pull got, every night">';
  // (stage bands: every other one faintly shaded, so the stages read at a glance)
  if (cfg) { let g = 100, k = 0; s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g) + '" y2="' + Y(g) + '" class="tg"/>';
    for (const p of cfg.phases) { const w = 100 * phShare(cfg, p); if (w <= 0) continue;
      if (k++ % 2) s += '<rect x="' + L + '" y="' + Y(g).toFixed(1) + '" width="' + (W - L - R) + '" height="' + (Y(g - w) - Y(g)).toFixed(1) + '" class="tband"/>';
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g - w) + '" y2="' + Y(g - w) + '" class="tg"/><text x="' + (L - 6) + '" y="' + (Y(g - w / 2) + 4) + '" class="tl" text-anchor="end">' + p + '</text>'; g -= w; } }
  else for (const g of [0, 50, 100]) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g) + '" y2="' + Y(g) + '" class="tg"/><text x="' + (L - 6) + '" y="' + (Y(g) + 4) + '" class="tl" text-anchor="end">' + g + '%</text>';
  // (nights: a dashed line where one ends, its date under its pulls when there's room; "nr" dates are hidden on a phone,
  // where the text is bigger)
  const nights = []; list.forEach((v, i) => { const k = nightOf(v.at); if (!nights.length || nights[nights.length - 1].k !== k) nights.push({ k, a: i, b: i, at: v.at }); else nights[nights.length - 1].b = i; });
  nights.forEach((nt, j) => { if (j) { const x = (X(nt.a - 1) + X(nt.a)) / 2; s += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + Tp + '" y2="' + (H - B) + '" class="pc-nl"/>'; }
    const x0 = j ? (X(nt.a - 1) + X(nt.a)) / 2 : L, x1 = j < nights.length - 1 ? (X(nt.b) + X(nt.b + 1)) / 2 : W - R;
    if (x1 - x0 > 46) s += '<text x="' + ((x0 + x1) / 2).toFixed(1) + '" y="' + (H - 6) + '" class="tl' + (x1 - x0 < 84 ? ' nr' : '') + '" text-anchor="middle">' + esc(new Date(nt.at - 6 * 3600e3).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) + '</text>'; });
  const pts = list.map((v, i) => ({ i, v, y: v.kill ? 0 : v.left })).filter((p) => p.y != null);
  if (pts.length > 1) {
    let bst = 101; const bp = pts.map((p) => { bst = Math.min(bst, p.y); return X(p.i).toFixed(1) + ',' + Y(bst).toFixed(1); });
    // (the ground covered so far, shaded between the top and the best-so-far line in the card's colour, strongest at the line)
    const gid = 'pcg' + ++progChart.n;
    s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="pcg0"/><stop offset="1" class="pcg1"/></linearGradient></defs>';
    s += '<path class="tarea" fill="url(#' + gid + ')" d="M' + X(pts[0].i).toFixed(1) + ',' + Y(100) + ' L' + bp.join(' L') + ' L' + X(pts[pts.length - 1].i).toFixed(1) + ',' + Y(100) + 'Z"/>';
    s += '<polyline class="tline" points="' + pts.map((p) => X(p.i).toFixed(1) + ',' + Y(p.y).toFixed(1)).join(' ') + '"/>';
    s += '<polyline class="tbest" points="' + bp.join(' ') + '"/>';
  }
  for (const p of pts) { const c = p.v.kill ? '#ff8000' : (PULL_Q.find(([lo]) => 100 - p.y >= lo) || [0, '#9d9d9d'])[1], cx = X(p.i).toFixed(1), cy = Y(p.y).toFixed(1);
    if (p.v.kill) s += '<circle cx="' + cx + '" cy="' + cy + '" r="8" class="pkh"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (p.v.kill ? 4.5 : 2.6) + '" class="' + (p.v.kill ? 'pk' : 'pd') + '" fill="' + c + '"><title>' + esc(nightLabel(p.v.at) + ' · pull ' + p.v.pull + ' · ' + (p.v.kill ? 'kill' : p.v.label)) + '</title></circle>'; }
  return s + '</svg>';
}
progChart.n = 0;
// Progress opens on a page of your teams: a card each (and your character), and one to add a team; picking one opens its
// own page (S.progView: its gid, null for the teams page; '*', every saved pull, is no longer offered)
const lastTxt = (x) => (x.last ? 'checked ' + esc(nightLabel(x.last + 6 * 3600e3)) + ', ' + new Date(x.last).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' · ' + plural(x.reports || 0, 'report') + ' this tier' : 'not imported yet');
// a team's banner: a crest with its initials, in a colour that's always the same for that team; a character's: a banner in
// their class colour with the class icon; everything saved: a plain one
const CREST_COL = ['#b8413a', '#2f73c9', '#2e9b5a', '#8a4fc4', '#c56a1c', '#1f9589', '#a88a1e', '#b8336f'];
// (a team on one side: the Horde's or the Alliance's emblem, in red or blue; one whose faction isn't known: its initials)
const FACTION = { Horde: ['#b8413a', 'pvpcurrency-honor-horde'], Alliance: ['#2f73c9', 'pvpcurrency-honor-alliance'] };
function banner(g) {
  const cls = g && g.kind === 'char' && g.cls && E.CLASSES[g.cls], fac = g && g.kind !== 'char' && FACTION[g.faction];
  const col = !g ? '#5c6373' : cls ? cls[1] : fac ? fac[0] : CREST_COL[[...g.name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % CREST_COL.length];
  const shape = g && g.kind === 'char' ? 'M5 2h42v50l-21 10-21-10Z' : 'M4 3h44v26c0 16-10 26-22 32C14 55 4 45 4 29Z';
  const ini = g ? gName(g).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => [...w][0].toUpperCase()).join('') : '';
  const inner = cls ? '<img class="hb-i" src="' + whIcon('classicon_' + cls[2]) + '" alt="" onerror="this.remove()">' : fac ? '<img class="hb-i" src="' + whIcon(fac[1]) + '" alt="' + esc(g.faction) + '" onerror="this.remove()">' : g ? '<span class="hb-t">' + esc(ini) + '</span>' : '<span class="hb-t">∑</span>';
  return '<span class="ht-ban" style="--bc:' + col + '" aria-hidden="true"><svg viewBox="0 0 52 64"><path d="' + shape + '"/></svg>' + inner + '</span>';
}
// a character's guild (from Warcraft Logs, ‹in brackets› the way WoW shows it) and the teams on your list they raid with
function charAff(g) {
  if (!g || g.kind !== 'char') return '';
  const teams = groups().filter((t) => t.kind !== 'char' && [...HIST.mem.values()].some((v) => pullGroups(v).includes(t.gid) && (v.players || []).includes(g.name))).map((t) => gName(t));
  const parts = (g.guild ? ['‹' + g.guild + '›'] : []).concat(teams.filter((n) => n !== g.guild));
  return parts.length ? '<span class="ht-g">' + esc(parts.join(' · ')) + '</span>' : '';
}
// a team's card (the start screen and the teams page): bosses killed on each difficulty it pulled, its last night
function teamCard(g, all, order, big) {
  const mine = all.filter(groupFilter(g)), last = mine.reduce((m, v) => Math.max(m, v.at), 0), nights = new Set(mine.map((v) => nightOf(v.at))).size;
  const diffs = DIFF_ORDER.filter(([d]) => mine.some((v) => v.diffId === d)).slice(0, big ? 4 : 2).map(([d, nm]) => '<span><b>' + order.filter((b) => mine.some((v) => v.diffId === d && v.boss === b && v.kill)).length + '/' + order.length + '</b> ' + nm + '</span>').join('');
  const cls = g && g.kind === 'char' && g.cls && E.CLASSES[g.cls];
  return '<button class="ht-card hb' + (big ? ' big' : '') + '" type="button" data-g="' + esc(g ? g.gid : '*') + '">' + banner(g) + '<span class="ht-b"><span class="ht-n"' + (cls ? ' style="color:' + cls[1] + '"' : '') + '>' + esc(g ? gName(g) : 'Everything saved') + '</span>' + charAff(g) +
    // (a team's World and US rank, once its page has read them)
    (g && g.rank && (g.rank.w || g.rank.r) ? '<span class="ht-g ht-rk">' + (g.rank.w ? 'World #' + g.rank.w.toLocaleString('en-US') : '') + (g.rank.w && g.rank.r ? ' · ' : '') + (g.rank.r ? esc(g.rank.rn || 'Region') + ' #' + g.rank.r.toLocaleString('en-US') : '') + '</span>' : '') +
    '<span class="ht-k">' + (g ? (cls ? cls[0] : gKind(g) + (g.faction ? ' · ' + esc(g.faction) : '')) + (g.server ? ' · ' + esc(g.server) : '') : 'every pull on this PC, from all your teams and the logs opened here') + '</span>' +
    '<span class="ht-d">' + (diffs || '<span>not imported yet</span>') + '</span><span class="ht-l">' + (last ? plural(nights, 'night') + ' · last ' + esc(nightLabel(last)) : g ? 'open to import its nights' : 'nothing saved yet') + '</span></span></button>';
}
// (a character added before its class was kept: looked up once, then its card is drawn again)
async function groupsBackfill() {
  // (clsV 3: class read with Warcraft Logs' class numbers the right way, and their guild; facV 1: a team's faction, for its
  // Horde or Alliance banner; an older lookup is done again)
  const need = groups().filter((g) => (g.kind === 'char' ? g.clsV !== 3 : g.facV !== 1)); if (!need.length) return;
  let creds = null; try { creds = await wclCreds(); } catch (e) { return; }
  for (const g of need) { let info = null; try { info = g.kind === 'char' ? await WCL.charInfo(creds, { id: g.id }) : await WCL.teamInfo(creds, { id: g.id }); } catch (e) { /* (tried again next visit) */ continue; }
    const x = groups().find((q) => q.gid === g.gid); if (!x) continue;
    if (g.kind === 'char') { x.cls = info.cls; x.guild = info.guild; x.clsV = 3; } else { x.faction = info.faction || x.faction || null; x.facV = 1; } groupPut(x); }
  if ($('#homeTeams')) { $('#homeTeams').outerHTML = homeTeams(); bindHomeTeams(); } else if ($('#main .pg-hub')) renderProgHub(); else if ($('#main .home.prog')) renderProgress();
}
// (asHome: the home page: the slim bar for logs on top, titled "Your teams")
function renderProgHub(msg, msgErr, asHome) {
  if (asHome == null) asHome = !!S.hubHome; S.hubHome = asHome;
  const gl = groups(), order = E.PACKS.map((p) => p.encounter), all = [...HIST.mem.values()].filter((v) => order.includes(v.boss));
  const back = !asHome && PROG_BACK && S.index && S.index.bosses && S.index.bosses.includes(PROG_BACK) ? '<button class="lnk pg-back" id="pgBack" type="button">‹ Back to ' + esc(PROG_BACK.boss) + (PROG_BACK.pull ? ', pull ' + PROG_BACK.pull : '') + '</button>' : '';
  // (the add card says exactly which link to paste: a team's or guild's page, or a character's, with what each looks like)
  const add = '<div class="ht-card ht-add big pg-addc"><span class="ht-n">Add a team or character</span><span class="ht-k">Paste the address of a page on Warcraft Logs: your team or guild brings in its raid nights; your own character brings in every raid you were in, with any group.</span>' +
    '<div class="fp-in"><input id="pgTeam" placeholder="Paste a team, guild or character page link" autocomplete="off"><button class="btn' + (gl.length ? '' : ' primary') + '" id="pgTeamGo" type="button">Add</button></div><div class="pg-msg' + (msgErr ? ' err' : '') + '" id="pgMsg">' + esc(msg || '') + '</div>' +
    '<div class="pg-which"><b>Which link?</b><ol>' +
      '<li><b>Your team or guild:</b> on <a href="https://www.warcraftlogs.com/" target="_blank" rel="noopener">warcraftlogs.com</a>, search your guild\'s name, open its page, and copy the address from the top of your browser. It looks like <code>warcraftlogs.com/guild/id/772787</code> or <code>warcraftlogs.com/guild/us/zuljin/wolfthorn</code>.</li>' +
      '<li><b>Your character:</b> search your character\'s name there, open it, and copy that address. It looks like <code>warcraftlogs.com/character/us/thrall/yourname</code>.</li>' +
      '<li><b>Not a report:</b> a link with <code>/reports/</code> in it is one night. Paste those in the box at the top of the home page instead.</li></ol></div></div>';
  $('#main').innerHTML = '<div class="home prog' + (asHome ? ' th-home' : '') + '">' + (asHome ? teamsBar() : back) + '<div class="pg-top"><div><h1>Your teams</h1><div class="sub">Pick a team or your character: every boss and night of The Venomous Abyss.</div></div></div>' +
    '<div class="pg-hub">' + gl.map((g) => teamCard(g, all, order, true)).join('') + add + '</div></div>';
  progLit(!asHome);
  if (asHome) bindTeamsBar(); else pageTips('hub');
  $$('#main .pg-hub button.ht-card').forEach((b) => (b.onclick = () => { S.progView = b.dataset.g; S.pgRename = S.pgDel = S.pgEdit = false; if (b.dataset.g !== '*') store.set(GROUP_CUR, b.dataset.g); renderProgress(); window.scrollTo(0, 0); }));
  const say = (t, err) => { const m = $('#pgMsg'); if (m) { m.textContent = t; m.classList.toggle('err', !!err); } };
  $('#pgTeamGo').onclick = async () => {
    try { say('Finding it on Warcraft Logs…'); const { g: ng, already } = await groupAdd($('#pgTeam').value);
      S.progView = ng.gid; if (already) { renderProgress(gName(ng) + ' is already on your list.'); return; }
      renderProgress('Added ' + ng.name + '. Importing its nights…'); progRun(ng); } catch (e) { say(e.message, true); }
  };
  $('#pgTeam').onkeydown = (e) => { if (e.key === 'Enter') $('#pgTeamGo').click(); };
  if (S.pgFocusAdd || !gl.length) { S.pgFocusAdd = false; $('#pgTeam').focus(); }
  if ($('#pgBack')) $('#pgBack').onclick = () => select(PROG_BACK);
}
// bringing in a team's nights: the steps show on its page; when it ends, the page you're on is redrawn only if it's that
// team's page or the teams page (an import keeps going if you leave)
// (quiet: the automatic check: no message when nothing is new, and none if another tab is already checking)
async function progRun(g, quiet) {
  const onIt = () => $('#main .home.prog') && S.progView === g.gid, say = (t, err) => { const m = $('#pgMsg'); if (m && onIt()) { m.textContent = t; m.classList.toggle('err', !!err); } };
  const done = (m, err) => { if (onIt()) renderProgress(m, err); else if ($('#main .home.prog') && S.progView == null) renderProgHub(); else if ($('#main .th-home2') && !$('#thWcl').value) renderTeamsHome(); else if ($('#homeTeams')) { $('#homeTeams').outerHTML = homeTeams(); bindHomeTeams(); } };
  S.progBusy = g.gid; say(g.last ? 'Checking for new nights…' : 'Bringing in every night of the tier…');
  try { const res = await teamImport(g, say); S.progBusy = null; done((res.reports ? gName(g) + ': imported ' + plural(res.added, 'new pull') + ' from ' + plural(res.reports, 'report') + (res.dup ? ' (' + res.dup + ' were already saved)' : '') + '.' : quiet ? '' : gName(g) + ' is up to date: no new reports.') +
    (res.failed ? ' ' + plural(res.failed, 'report') + ' couldn\'t be read (private, or Warcraft Logs was busy): they\'ll be tried again next time.' : '')); }
  catch (e) { S.progBusy = null; if (quiet && /already running|Connect Warcraft Logs/.test(e.message)) { done(''); return; } done(e.message, true); }
}
// New nights come in by themselves: each team (and your character) is checked when the app opens, and its page checks
// again when you open it, if it hasn't been checked in the last 10 minutes. One at a time, quietly.
const AUTO_AGE = 10 * 60e3;
// (tried at most once every 10 minutes per team, so a check that fails doesn't keep trying)
async function autoCheck(g) {
  if (!g || S.progBusy || (g.last && Date.now() - g.last < AUTO_AGE)) return;
  S.autoTried = S.autoTried || new Map(); if (Date.now() - (S.autoTried.get(g.gid) || 0) < AUTO_AGE) return; S.autoTried.set(g.gid, Date.now());
  await progRun(g, true);
}
async function autoCheckAll() { for (const g0 of groups()) { const g = groups().find((x) => x.gid === g0.gid); if (g) await autoCheck(g); } }
HIST.load().then(() => setTimeout(autoCheckAll, 4000));
// ---- a character's page: their Warcraft Logs rankings this tier ----
// Their most played spec first (the spec most of their best parses are on), healing for a healer spec and damage
// otherwise; switches for each spec of their class and for damage or healing; on the page's difficulty. The summary on top
// (best and median average, all-stars points), and each boss card gets a line with their best and median parse there.
// Hidden with one click (remembered on this PC).
const HEAL_SPECS = new Set([65, 105, 256, 257, 264, 270, 1468]), RANK_CACHE = new Map(), RANK_OFF = 'wla-rank-off';
const WCL_DIFF_OF = { 16: 5, 15: 4, 14: 3, 17: 1 };
async function charRankPanel(g, diffId) {
  const box = $('#pgRank'); if (!box || !g.cls) return;
  const still = () => S.progView === g.gid && $('#pgRank') === box && document.body.contains(box);
  if (store.get(RANK_OFF) === '1') { box.innerHTML = '<div class="pr-off"><span class="sub">Your Warcraft Logs rankings are hidden.</span> <button class="linkbtn" id="prShow" type="button">Show them</button></div>';
    $('#prShow').onclick = () => { store.set(RANK_OFF, '0'); charRankPanel(g, diffId); }; return; }
  const d = WCL_DIFF_OF[diffId] || 5, specs = Object.entries(E.SPECS).filter(([, [, c]]) => c === g.cls).map(([id, [n]]) => ({ id: +id, n, heal: HEAL_SPECS.has(+id) }));
  box.innerHTML = '<div class="sub">Reading your rankings from Warcraft Logs…</div>';
  let creds = null; try { creds = await wclCreds(); } catch (e) { box.innerHTML = '<div class="sub">' + esc(e.message) + '</div>'; return; }
  const get = async (m, s) => { const k = g.id + '|' + d + '|' + m + '|' + (s || ''); if (!RANK_CACHE.has(k)) RANK_CACHE.set(k, WCL.charRankings(creds, g.id, d, m, s).catch((e) => { RANK_CACHE.delete(k); throw e; })); return RANK_CACHE.get(k); };
  try {
    // (their most played spec: the one most of their best parses are on, kept once found)
    if (!g.mainSpec) { const z0 = await get('dps', null), cnt = new Map(); for (const x of (z0 && z0.rankings) || []) if (x.spec && x.totalKills) cnt.set(x.spec, (cnt.get(x.spec) || 0) + x.totalKills);
      const top = [...cnt].sort((a, b) => b[1] - a[1])[0]; if (top) { const x = groups().find((q) => q.gid === g.gid); if (x) { x.mainSpec = top[0]; groupPut(x); } g.mainSpec = top[0]; } }
    const spec = specs.find((x) => x.n === S.rankSpec) ? S.rankSpec : g.mainSpec || specs[0].n, sp = specs.find((x) => x.n === spec) || specs[0];
    const metric = S.rankMetric === 'hps' || S.rankMetric === 'dps' ? S.rankMetric : sp.heal ? 'hps' : 'dps';
    const z = await get(metric, spec); if (!still()) return;
    const rows = ((z && z.rankings) || []).filter((x) => x.encounter), ranked = rows.filter((x) => x.rankPercent != null);
    const as = ((z && z.allStars) || []).slice().sort((a, b) => (b.points || 0) - (a.points || 0))[0];
    // (their most played spec's averages, kept for their tile on the home page)
    if (spec === g.mainSpec && ranked.length && z.bestPerformanceAverage != null) { const x = groups().find((q) => q.gid === g.gid); if (x) { x.parse = { spec, best: z.bestPerformanceAverage, med: z.medianPerformanceAverage || 0, d }; groupPut(x); } }
    const chip = (v) => (v == null ? '<span class="sub">—</span>' : prsChip({ pct: v }));
    const sw = '<div class="pr-sw"><div class="seg" role="group" aria-label="Spec">' + specs.map((x) => '<button type="button" data-rs="' + esc(x.n) + '"' + (x.n === spec ? ' class="on"' : '') + '>' + esc(x.n) + (x.n === g.mainSpec ? ' <span class="sub">most played</span>' : '') + '</button>').join('') + '</div>' +
      '<div class="seg" role="group" aria-label="Damage or healing"><button type="button" data-rm="dps"' + (metric === 'dps' ? ' class="on"' : '') + '>Damage</button>' + (specs.some((x) => x.heal) ? '<button type="button" data-rm="hps"' + (metric === 'hps' ? ' class="on"' : '') + '>Healing</button>' : '') + '</div></div>';
    const diffN = (DIFF_ORDER.find(([x]) => x === diffId) || [0, ''])[1];
    box.innerHTML = '<div class="pr-h"><div><b>Your rankings on Warcraft Logs</b><div class="sub">' + esc(diffN) + ' · ' + esc(spec) + ' · ' + (metric === 'hps' ? 'healing' : 'damage') + ' · against the same spec, this tier</div></div>' + sw + '<button class="linkbtn pr-hide" id="prHide" type="button">Hide</button></div>' +
      (ranked.length ? '<div class="pts pr-sum n3">' +
        plTile(chip(z.bestPerformanceAverage), 'Best average', Math.floor(z.bestPerformanceAverage || 0) + '', 'na', 'your best parse on each boss, averaged', true) +
        plTile(chip(z.medianPerformanceAverage), 'Median average', Math.floor(z.medianPerformanceAverage || 0) + '', 'na', 'your typical parse on each boss, averaged', true) +
        plTile(icoW('achievement_dungeon_icecrown_frostmourne'), 'All-stars', as ? Math.round(as.points) + '<span> pts</span>' : '—', 'na', as && as.rank && as.rank !== '-' ? 'rank ' + Number(as.rank).toLocaleString('en-US') + ' of ' + Number(as.total || 0).toLocaleString('en-US') + (as.rankPercent != null && as.rankPercent !== '-' ? ' · top ' + Math.max(1, Math.round(100 - as.rankPercent)) + '%' : '') : 'not ranked yet', true) + '</div>' +
        '<div class="sub pr-n">Each boss card below shows your best and median parse there.</div>'
        : '<p class="muted" style="margin:6px 0 0">No ranked kills as ' + esc(spec) + ' on ' + esc(diffN) + ' yet. Warcraft Logs only ranks kills.</p>');
    // each boss card: their parse there
    $$('#main .pc-card[data-boss]').forEach((c) => { const x = rows.find((q) => q.encounter.name === c.dataset.boss); const old = c.querySelector('.pc-rank'); if (old) old.remove();
      const html = '<div class="pc-rank"><span class="pr-l">Your parse</span>' + (x && x.rankPercent != null ? chip(x.rankPercent) + ' <span class="sub">best</span> ' + chip(x.medianPercent) + ' <span class="sub">median · ' + plural(x.totalKills || 0, 'kill') + (x.bestAmount ? ' · best ' + C(x.bestAmount) + '/s' : '') + '</span>' : '<span class="sub">no ranked kill as ' + esc(spec) + '</span>') + '</div>';
      const st = c.querySelector('.pc-stats'); if (st) st.insertAdjacentHTML('afterend', html); });
    box.querySelectorAll('[data-rs]').forEach((b) => (b.onclick = () => { S.rankSpec = b.dataset.rs; S.rankMetric = null; charRankPanel(g, diffId); }));
    box.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { S.rankMetric = b.dataset.rm; charRankPanel(g, diffId); }));
    $('#prHide').onclick = () => { store.set(RANK_OFF, '1'); $$('#main .pc-rank').forEach((x) => x.remove()); charRankPanel(g, diffId); };
  } catch (e) { if (still()) box.innerHTML = '<div class="sub">Couldn\'t read your rankings: ' + esc(e.message) + '</div>'; }
}
// ---- a team's page: its Warcraft Logs rankings this tier (Mythic) ----
// Progress (how far it got, and how soon) world, in its region (US) and on its server, then speed; each number in Warcraft
// Logs' colour for it; and the team's faction. Kept on the team, so its cards can show World and US too.
const TIER_ZONE = 53; // (Warcraft Logs' zone for The Venomous Abyss)
const RANK_COL = { common: 'q1', uncommon: 'q2', rare: 'q3', epic: 'q4', legendary: 'q5', astounding: 'q6', artifact: 'q7' };
async function teamRankPanel(g) {
  const box = $('#pgRank'); if (!box) return;
  const still = () => S.progView === g.gid && document.body.contains(box);
  box.innerHTML = '<div class="sub">Reading ' + esc(gName(g)) + '\'s rankings from Warcraft Logs…</div>';
  let creds = null; try { creds = await wclCreds(); } catch (e) { box.innerHTML = '<div class="sub">' + esc(e.message) + '</div>'; return; }
  try {
    const k = 'team|' + g.id; if (!RANK_CACHE.has(k)) RANK_CACHE.set(k, WCL.teamRankings(creds, g.id, TIER_ZONE).catch((e) => { RANK_CACHE.delete(k); throw e; }));
    const t = await RANK_CACHE.get(k); if (!still()) return;
    const zr = (t && t.zoneRanking) || {}, pr = zr.progress || {}, sp = zr.speed || {}, reg = /\(([A-Z]{2})\)/.exec(g.server || ''), regN = reg ? reg[1] : 'Region', srv = (g.server || '').replace(/\s*\([A-Z]{2}\)$/, '') || 'Server';
    // (a rank in Warcraft Logs' colour for it: grey, green, blue, purple, orange, pink, gold)
    const num = (x) => (x && x.number ? '<span class="trv ' + (RANK_COL[x.color] || 'q1') + '">#' + x.number.toLocaleString('en-US') + '</span>' : '—');
    const n2 = (x) => (x && x.number ? '#' + x.number.toLocaleString('en-US') : '—');
    const fac = t && t.faction && t.faction.name;
    if (pr.worldRank || pr.regionRank) { const x = groups().find((q) => q.gid === g.gid); if (x) { x.rank = { w: pr.worldRank && pr.worldRank.number, r: pr.regionRank && pr.regionRank.number, rn: regN, at: Date.now() }; if (fac) x.faction = fac; groupPut(x); } }
    // the same look as a character's rankings: a tile each for the world, the region and the server (progress: how far the
    // team got, and how soon), and one for speed (its kill times added up)
    box.innerHTML = '<div class="pr-h"><div><b>' + esc(gName(g)) + '\'s rankings on Warcraft Logs</b><div class="sub">Mythic · The Venomous Abyss' + (fac ? ' · ' + esc(fac) : '') + ' · progress is how far the team got, and how soon</div></div></div>' +
      (pr.worldRank || pr.regionRank || sp.worldRank ? '<div class="pts pr-sum n4">' +
        plTile(icoW('inv_misc_map02'), 'World', num(pr.worldRank), 'na', 'progress, every team', true) +
        // (plTile escapes the label and the line under it itself)
        plTile(icoW('achievement_zone_easternkingdoms_01'), regN, num(pr.regionRank), 'na', 'progress, teams in the ' + regN, true) +
        plTile(icoW(fac === 'Horde' ? 'inv_bannerpvp_01' : 'inv_bannerpvp_02'), srv, num(pr.serverRank), 'na', 'progress, teams on ' + srv, true) +
        plTile(icoW('spell_holy_borrowedtime'), 'Speed', num(sp.worldRank), 'na', 'world · ' + regN + ' ' + n2(sp.regionRank) + ' · ' + srv + ' ' + n2(sp.serverRank) + ' · kill times added up', true) + '</div>'
        : '<p class="muted" style="margin:6px 0 0">Not ranked on Mythic yet: Warcraft Logs ranks a team once it has a Mythic kill this tier.</p>');
  } catch (e) { if (still()) box.innerHTML = '<div class="sub">Couldn\'t read the rankings: ' + esc(e.message) + '</div>'; }
}
function renderProgress(msg, msgErr) {
  // (the teams page, unless a team (or everything saved) is picked)
  const gl = groups(), g = S.progView && S.progView !== '*' ? gl.find((x) => x.gid === S.progView) : null;
  if (S.progView == null || (S.progView !== '*' && !g)) { S.progView = null; renderProgHub(msg, msgErr); return; }
  const inG = groupFilter(g), order = E.PACKS.map((p) => p.encounter), all = [...HIST.mem.values()].filter((v) => order.includes(v.boss) && inG(v));
  const diffs = DIFF_ORDER.filter(([d]) => all.some((v) => v.diffId === d));
  let cur = +(store.get(PROG_DIFF_KEY) || 0); if (!diffs.some(([d]) => d === cur)) cur = diffs.length ? diffs[0][0] : 16;
  const qc = (v) => (v.kill ? '#ff8000' : v.left != null ? (PULL_Q.find(([lo]) => 100 - v.left >= lo) || [0, '#9d9d9d'])[1] : 'var(--line2)');
  const bestOf = (list) => { const k = list.filter((v) => v.kill).sort((a, b) => a.at - b.at)[0]; if (k) return k; const kn = list.filter((v) => v.left != null); return kn.length ? kn.reduce((m, v) => (v.left < m.left ? v : m)) : null; };
  const killedOn = (d) => order.filter((b) => all.some((v) => v.diffId === d && v.boss === b && v.kill)).length;
  // a boss card: kill or best, the totals, every pull on a chart, and a menu of its nights to open or save
  // (the boss's own art, faded behind the card's right side; loaded at runtime, gone if it doesn't load)
  // (a card's background is the boss's banner art when there is one, as on the pull banner; otherwise its model render)
  const art = (boss, cls) => (!cls && BOSS_HERO[boss] ? '<img class="pc-art pc-hero" src="https://wow.zamimg.com/uploads/guide/header/' + BOSS_HERO[boss][0] + '.jpg" alt="" loading="lazy" style="object-position:' + BOSS_HERO[boss][1] + '% 20%" onerror="this.remove()">'
    : BOSS_ART[boss] ? '<img class="' + (cls || 'pc-art') + '" src="' + artUrl(BOSS_ART[boss][0]) + '" alt="" loading="lazy"' + (ART_ZOOM[boss] ? ' style="--az:' + ART_ZOOM[boss] + '"' : '') + ' onerror="this.remove()">' : '');
  const card = (boss, list) => {
    list.sort((a, b) => a.at - b.at);
    const b = bestOf(list), kills = list.filter((v) => v.kill), done = b ? Math.max(0, 100 - b.left) : 0;
    // (the progression: up to the first kill; farm kills after it are only counted)
    const prog = kills.length ? list.filter((v) => v.at <= kills[0].at) : list, after = list.length - prog.length;
    const nights = new Map(); for (const v of prog) { const k = nightOf(v.at); if (!nights.has(k)) nights.set(k, []); nights.get(k).push(v); }
    const time = prog.reduce((s, v) => s + (v.dur || 0), 0), last = list[list.length - 1].at;
    const st = kills.length ? 'Killed ' + esc(nightLabel(kills[0].at)) + ' on pull ' + kills[0].pull + (kills.length > 1 ? ' · ' + plural(kills.length - 1, 'more kill') + ' since' : '') : b ? 'Best: ' + esc(b.label) + ' · ' + plural(nights.size, 'night') + ' so far' : 'No result yet';
    // (the night menu has every night, farm nights after the kill too)
    const allN = new Map(); for (const v of list) { const k = nightOf(v.at); if (!allN.has(k)) allN.set(k, []); allN.get(k).push(v); }
    const opts = [...allN].sort((x, y) => (x[0] < y[0] ? 1 : -1)).map(([, l]) => {
      // (a pull saved from an opened report, before pulls kept their link, still has the report in its source)
      const wclOf = (v) => v.wcl || (/^wcl:/.test(v.src || '') ? { code: v.src.slice(4), fight: null } : null);
      const nb = bestOf(l), codes = new Map(); for (const v of l) if (wclOf(v)) codes.set(wclOf(v).code, (codes.get(wclOf(v).code) || 0) + 1);
      const code = [...codes].sort((p, q) => q[1] - p[1]).map((x) => x[0])[0], at = code && wclOf(l.filter((v) => wclOf(v) && wclOf(v).code === code).sort((p, q) => (p.kill ? -1 : 0) - (q.kill ? -1 : 0) || (p.left ?? 101) - (q.left ?? 101))[0] || {});
      const res = l.some((v) => v.kill) ? 'killed on pull ' + l.find((v) => v.kill).pull : nb ? 'best ' + nb.label : 'no result';
      // (a killed boss's menu starts on the night of the first kill)
      const sel = kills.length && nightOf(l[0].at) === nightOf(kills[0].at) ? ' selected' : '';
      return '<option value="' + (code ? code + '|' + (at && at.fight != null ? at.fight : '') : '') + '"' + sel + '>' + esc(nightLabel(l[0].at) + ' · ' + plural(l.length, 'pull') + ' · ' + res + (code ? '' : ' · your log only')) + '</option>';
    }).join('');
    // (short by default: the boss, its result and one line of totals; a click opens the chart, the totals and its nights)
    const open = S.pcOpen && S.pcOpen.has(boss);
    return '<article class="pc-card' + (open ? '' : ' mini') + '" style="--ec:' + (b ? qc(b) : 'var(--line2)') + '" data-boss="' + esc(boss) + '">' + art(boss) + '<header class="pc-h" role="button" tabindex="0" aria-expanded="' + !!open + '"><div><h3>' + esc(boss) + '</h3><div class="pc-st">' + st + '</div></div>' +
      '<div class="pc-big" style="color:' + (b ? qc(b) : 'var(--muted)') + '">' + (kills.length ? 'Killed' : b ? Math.floor(done) + '%' : '—') + '<span>' + (kills.length ? '' : 'of the encounter') + '</span></div></header>' +
      '<div class="pc-mini">' + plural(prog.length, 'pull') + (kills.length ? ' to the kill' : '') + ' · ' + plural(nights.size, 'night') + ' · ' + durH(time) + (kills.length ? ' to the kill' : ' on the boss') + ' · last ' + esc(new Date(last - 6 * 3600e3).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) + '<span class="pc-more">' + (open ? 'Show less ▴' : 'Chart and nights ▾') + '</span></div>' +
      '<div class="pc-stats"><div><b>' + prog.length + '</b>' + (kills.length ? 'pulls to the kill' : 'pulls') + '</div><div><b>' + nights.size + '</b>' + (nights.size === 1 ? 'night' : 'nights') + '</div><div><b>' + durH(time) + '</b>' + (kills.length ? 'to the kill' : 'on the boss') + '</div>' +
        '<div' + (after ? ' title="' + plural(after, 'pull') + ' since the first kill"' : '') + '><b>' + esc(new Date(last - 6 * 3600e3).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) + '</b>last pulled</div></div>' +
      progChart(prog, boss) +
      '<div class="pc-pick"><label class="sub">Night<select class="pc-sel">' + opts + '</select></label><button class="btn" type="button" data-act="open">Open</button><button class="btn" type="button" data-act="save">Save in full</button></div><div class="pc-msg"></div></article>';
  };
  const diffName = (DIFF_ORDER.find(([d]) => d === cur) || [0, ''])[1], list = all.filter((v) => v.diffId === cur), nN = new Set(list.map((v) => nightOf(v.at))).size;
  // the team's details are one quiet line under its name (what it is, its server, when it was last checked); Rename and Remove
  // sit behind a small Edit button beside the name and only show when it's clicked (removing asks first and says how many
  // pulls go with it)
  const pgMsg = '<div class="pg-msg' + (msgErr ? ' err' : '') + '" id="pgMsg">' + esc(msg || '') + '</div>';
  const only = g ? groupOnly(g) : 0;
  const info = !g ? '' : '<div class="sub pg-info">' + (g.kind === 'char' && g.cls && E.CLASSES[g.cls] ? E.CLASSES[g.cls][0] + ' · your character' : gKind(g)) + (g.server ? ' · ' + esc(g.server) : '') + (g.label && g.label !== g.name ? ' · ' + esc(g.name) + ' on Warcraft Logs' : '') + ' · ' + (S.progBusy === g.gid ? 'checking for new nights…' : lastTxt(g)) + '</div>';
  const editing = S.pgEdit || S.pgRename || S.pgDel;
  const team = !g || !editing ? '' : '<section class="pg-team pg-edit">' +
      (S.pgRename ? '<div class="pg-mn"><input class="pg-ren" id="pgRenIn" value="' + esc(gName(g)) + '" aria-label="Name" maxlength="40"><button class="btn" id="pgRenOk" type="button">Save</button><button class="linkbtn" id="pgRenNo" type="button">Cancel</button></div>'
        : S.pgDel ? '<div class="pg-ma del"><span>Remove ' + esc(gName(g)) + (only ? ' and the ' + plural(only, 'pull') + ' only it brought in' : '') + '? This can\'t be undone.</span><button class="btn danger" id="pgDelOk" type="button">Remove</button><button class="linkbtn" id="pgDelNo" type="button">Keep</button></div>'
        : '<div class="pg-ma"><span class="sub">' + esc(gName(g)) + ':</span><button class="btn" id="pgRen" type="button">Rename</button><button class="btn danger-o" id="pgDel" type="button">Remove</button><button class="linkbtn" id="pgEditNo" type="button">Done</button></div>') + '</section>';
  const sw = diffs.length > 1 ? '<div class="pc-diffs" role="group" aria-label="Difficulty">' + diffs.map(([d, nm]) => '<button type="button" data-d="' + d + '" aria-pressed="' + (d === cur) + '"' + (d === cur ? ' class="on"' : '') + '>' + nm + '<span>' + killedOn(d) + '/' + order.length + '</span></button>').join('') + '</div>' : '';
  // (bosses not pulled on this difficulty yet: one small row under the cards, not empty cards)
  const open = order.filter((boss) => !list.some((v) => v.boss === boss));
  const legend = pullLegend();
  const back = PROG_BACK && S.index && S.index.bosses && S.index.bosses.includes(PROG_BACK) ? '<button class="lnk pg-back" id="pgBack" type="button">‹ Back to ' + esc(PROG_BACK.boss) + (PROG_BACK.pull ? ', pull ' + PROG_BACK.pull : '') + '</button>' : '';
  $('#main').innerHTML = '<div class="home prog"><div class="pg-links"><button class="lnk pg-back" id="pgHub" type="button">‹ All teams</button>' + back + '</div>' +
    '<div class="pg-top"><div class="pg-ttl">' + banner(g) + '<div class="pg-tt"><h1' + (g && g.kind === 'char' && g.cls && E.CLASSES[g.cls] ? ' style="color:' + E.CLASSES[g.cls][1] + '"' : '') + '>' + esc(g ? gName(g) : 'Everything saved') + (g ? '<button class="pg-editb" id="pgEdit" type="button" aria-expanded="' + !!editing + '" title="Rename or remove">Edit</button>' : '') + '</h1>' + charAff(g) + '<div class="sub">The Venomous Abyss' + (list.length ? ' · ' + diffName + ': ' + killedOn(cur) + ' of ' + order.length + ' bosses killed, ' + plural(list.length, 'pull') + ' over ' + plural(nN, 'night') : '') + '</div>' + info + '</div></div>' + sw + '</div>' + team + pgMsg + (g && (g.kind !== 'char' || g.cls) ? '<section class="panel pg-rank" id="pgRank"></section>' : '') +
    (all.length ? legend + '<div class="pc-grid">' + order.filter((boss) => !open.includes(boss)).map((boss) => card(boss, list.filter((v) => v.boss === boss))).join('') + '</div>' +
        (open.length ? '<div class="pc-open"><span class="sub">Not pulled on ' + esc(diffName) + ' yet</span>' + open.map((boss) => '<span class="pc-chip"><span class="pc-av">' + art(boss, 'pc-av-art') + '</span>' + esc(boss) + '</span>').join('') + '</div>' : '')
      : '<p class="muted">' + (g ? 'No pulls for ' + esc(gName(g)) + ' yet. ' + (g.last ? 'New nights come in by themselves when you open this page.' : 'Its nights are being brought in.') : 'No pulls saved yet. Add your team on the teams page, or open a log of your raid.') + '</p>') + '</div>';
  $('#pgHub').onclick = () => { S.progView = null; S.pgRename = S.pgDel = S.pgEdit = false; renderProgress(); window.scrollTo(0, 0); };
  if ($('#pgEdit')) $('#pgEdit').onclick = () => { const on = !(S.pgEdit || S.pgRename || S.pgDel); S.pgEdit = on; S.pgRename = S.pgDel = false; renderProgress(); };
  if ($('#pgEditNo')) $('#pgEditNo').onclick = () => { S.pgEdit = false; renderProgress(); };
  if (g && g.kind === 'char') charRankPanel(g, cur); else if (g) teamRankPanel(g);
  pageTips('team');
  // (new nights: checked by themselves when the page opens, if not in the last 10 minutes; the line under the name says when)
  if (g && S.progBusy !== g.gid) autoCheck(g);
  // (rename: your own name for it, shown everywhere; an empty name goes back to its Warcraft Logs name)
  if ($('#pgRen')) $('#pgRen').onclick = () => { S.pgRename = true; S.pgDel = false; renderProgress(); const i = $('#pgRenIn'); if (i) { i.focus(); i.select(); } };
  if ($('#pgRenOk')) $('#pgRenOk').onclick = () => { const nv = $('#pgRenIn').value.trim(); g.label = nv && nv !== g.name ? nv : undefined; groupPut(g); S.pgRename = S.pgEdit = false; renderProgress(); };
  if ($('#pgRenNo')) $('#pgRenNo').onclick = () => { S.pgRename = false; renderProgress(); };
  if ($('#pgRenIn')) $('#pgRenIn').onkeydown = (e) => { if (e.key === 'Enter') $('#pgRenOk').click(); else if (e.key === 'Escape') $('#pgRenNo').click(); };
  if ($('#pgDel')) $('#pgDel').onclick = () => { S.pgDel = true; S.pgRename = false; renderProgress(); };
  if ($('#pgDelNo')) $('#pgDelNo').onclick = () => { S.pgDel = false; renderProgress(); };
  if ($('#pgDelOk')) $('#pgDelOk').onclick = async (ev) => { ev.currentTarget.disabled = true; const n = await groupRemove(g); S.pgDel = S.pgEdit = false; S.progView = null; renderProgress('Removed ' + gName(g) + (n ? ' and ' + plural(n, 'saved pull') : '') + '.'); };
  if ($('#pgBack')) $('#pgBack').onclick = () => select(PROG_BACK);
  $('#main').querySelectorAll('.pc-diffs button').forEach((b) => { b.onclick = () => { store.set(PROG_DIFF_KEY, b.dataset.d); renderProgress(); }; });
  // (a short card opens with a click anywhere on it; an open one closes from its top or its "Show less")
  $('#main').querySelectorAll('.pc-card[data-boss]').forEach((c) => { const boss = c.dataset.boss, h = c.querySelector('.pc-h'), more = c.querySelector('.pc-more');
    const set = (on) => { S.pcOpen = S.pcOpen || new Set(); if (on) S.pcOpen.add(boss); else S.pcOpen.delete(boss); c.classList.toggle('mini', !on); h.setAttribute('aria-expanded', String(on)); if (more) more.textContent = on ? 'Show less ▴' : 'Chart and nights ▾'; };
    c.addEventListener('click', (e) => { if (c.classList.contains('mini')) set(true); else if (e.target.closest('.pc-h, .pc-more')) set(false); });
    h.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(c.classList.contains('mini')); } }; });
  // a card's night menu: open that night's report at the boss, or save every pull of the boss that night on this PC
  $('#main').querySelectorAll('.pc-card[data-boss]').forEach((c) => {
    const sel = c.querySelector('.pc-sel'), msgEl = c.querySelector('.pc-msg'), boss = c.dataset.boss, acts = c.querySelectorAll('[data-act]');
    const sync = () => { const wcl = !!sel.value; acts.forEach((b) => { b.disabled = !wcl; }); msgEl.textContent = wcl ? '' : 'This night is only in your combat log: open the log itself to look at it.'; };
    sel.onchange = sync; sync();
    c.querySelector('[data-act="open"]').onclick = async () => { const [code, fight] = sel.value.split('|'); try { await openWcl({ code, fight: +fight || null }, await wclCreds()); } catch (e) { msgEl.textContent = e.message; } };
    c.querySelector('[data-act="save"]').onclick = async (ev) => {
      const b = ev.currentTarget, [code] = sel.value.split('|'); b.disabled = true;
      try {
        const creds = await wclCreds(), rep = await WCL.loadReport(creds, code), items = rep.bosses.filter((x) => x.boss === boss && x.diffId === cur);
        let n = 0; for (const it of items) { n++; b.textContent = 'Saving ' + n + ' of ' + items.length + '…'; if (!(await WCL.isSaved(it))) await WCL.loadEvents(creds, it); }
        b.textContent = 'Save in full'; b.disabled = false; msgEl.textContent = 'All ' + plural(items.length, 'pull') + ' of that night are saved on this PC: they open without waiting.';
      } catch (e) { b.disabled = false; b.textContent = 'Save in full'; msgEl.textContent = e.message; }
    };
  });
}
$('#brandHome').onclick = () => home();
if ($('#tbProg')) $('#tbProg').onclick = () => progressPage();
if ($('#tbProgBtn')) $('#tbProgBtn').onclick = () => progressPage();
if ($('#tbHome')) $('#tbHome').onclick = () => home();
if ($('#tbTour')) $('#tbTour').onclick = () => { const p = $('#tbMenuPop'); if (p) p.hidden = true; startTour(0); };
// ("Tips for this page": the page's tips again; on a page without its own, the tour)
if ($('#tbTips')) $('#tbTips').onclick = () => { const p = $('#tbMenuPop'); if (p) p.hidden = true; const k = tipsPage(); if (k && PAGE_TIPS[k]) pageTips(k, true); else startTour(0); };
// (the first-visit tour: a shared pull link opens that pull first and the tour comes once it's on screen; otherwise right away)
const sharedLink = WCL.HOSTED && !!new URLSearchParams(location.search).get('report');
if (!tourDone() && sharedLink) S.tourAfterPull = true;
if (WCL.HOSTED) {
  $('#wclBtn').textContent = 'Paste a link';
  $('.brand p').textContent = 'Paste a Warcraft Logs link or drop your own log';
  const qp = new URLSearchParams(location.search);
  if (qp.get('report')) { hostedPanel('Loading the report…'); openWcl({ code: qp.get('report'), fight: +qp.get('fight') || null }, null).catch((err) => hostedPanel(err.message)); }
  else home();
} else if (!$('#main').innerHTML.trim()) home();
if (!tourDone() && !sharedLink) { if (S.item) S.tourAfterPull = true; else setTimeout(() => { if (!tourDone() && !$('#tour')) startTour(0); }, 700); }
})();
