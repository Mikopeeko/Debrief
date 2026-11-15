// Rotation Timeline: tapping a mistake mark that covers a stretch of time (a cooldown left ready, a buff that fell off) redrew the whole
// Timeline, so the note the tap had just opened and pinned vanished at once. On a phone those notes couldn't be read at all.
// Why: since Nov 9 (e6b225a5) a stretch mark carries data-sp (its length), and the Checklist/Timeline switch's click listener (the one that
// calls setV(t.dataset.rv)) still listened for the Oct 28 filter buttons ('.rtl [data-show]', '.rtl [data-sp]', ...). Nothing draws those
// buttons any more, but '.rtl [data-sp]' caught the mark, toggled a filter nothing reads and called redraw().
// Found by the quiet-bug hunt (Nov 15, overnight; seen on Wolfthorn's Thu Nov 12 Rotation Timelines).
// This draws a real stretch mark with the Timeline's own code (cut out of src/ui.js), checks it still carries data-nt and data-sp, then runs
// the real click listener on a tap on that mark, with a small stand-in page: the tap must not redraw or rebuild anything, and a tap on the
// Checklist/Timeline switch must still switch. quiet-bugs.js runs it on every build (contradictions.js runs quiet-bugs.js).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function quietRotationMarkTap(say) {
  const bad = (m) => say('Rotation', 'Timeline mark tap', m);
  let ui; try { ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8').replace(/\r\n/g, '\n'); } catch (e) { bad('could not read src/ui.js'); return; }
  // (1) a stretch mark, drawn by the Timeline's own code
  const m0 = ui.indexOf('\'<span class="rtv-mk \''), m1 = m0 < 0 ? -1 : ui.indexOf('\'</span>\'', m0);
  if (m0 < 0 || m1 < 0) { bad('could not find how the Timeline draws its marks (\'<span class="rtv-mk \' ... \'</span>\')'); return; }
  let html; try { html = String(vm.runInNewContext('(' + ui.slice(m0, m1 + 9) + ')', { a: { cl: 'bd', lv: 2, mi: 0, n: 1, nt: '1:41 · Shield Wall sat ready', ck: 'cd', span: 12.4, t: 101.2 }, p: 120, side: 'l', alt: 0, bandAt: () => true, Y: 1 })); }
  catch (e) { bad('drawing a Timeline mark threw: ' + e.message); return; }
  const tag = /^<(\w+)([^>]*)>/.exec(html); if (!tag) { bad('could not read the Timeline mark it drew: ' + html.slice(0, 80)); return; }
  const attrs = {}; for (const m of tag[2].matchAll(/([\w-]+)="([^"]*)"/g)) attrs[m[1]] = m[2];
  if (!('data-nt' in attrs) || !('data-sp' in attrs)) { bad('a stretch mark on the Timeline no longer carries data-nt and data-sp (it has ' + Object.keys(attrs).join(', ') + '), so this check needs a new look'); return; }
  // (2) the Checklist/Timeline click listener: from its addEventListener line to its closing "});"
  const L = ui.split('\n'), li = L.findIndex((l) => l.includes('setV(t.dataset.rv)'));
  if (li < 0) { bad('could not find the Checklist/Timeline click listener (setV(t.dataset.rv)) in src/ui.js'); return; }
  let a = li; while (a >= 0 && li - a < 12 && !L[a].includes('document.addEventListener(\'click\', function (e) {')) a--;
  let b = li; while (b < L.length && b - li < 30 && !/^\s*\}\);\s*$/.test(L[b])) b++;
  if (a < 0 || li - a >= 12 || b >= L.length || b - li >= 30) { bad('could not cut the Checklist/Timeline click listener out of src/ui.js'); return; }
  // (a stand-in page: elements with classes, data attributes, parents and closest() for simple selectors like '.rtl [data-sp]')
  const compound = (s) => { const c = { tag: null, cls: [], at: [] }; let r = s.replace(/^[a-z][\w-]*/i, (t) => { c.tag = t.toLowerCase(); return ''; });
    while (r) { let m; if ((m = /^\.([\w-]+)/.exec(r))) c.cls.push(m[1]); else if ((m = /^\[([\w-]+)(?:="([^"]*)")?\]/.exec(r))) c.at.push([m[1], m[2]]); else throw new Error('can\'t read selector "' + s + '"'); r = r.slice(m[0].length); }
    return c; };
  const fits = (el, c) => (!c.tag || el.tag === c.tag) && c.cls.every((k) => el.cls.includes(k)) && c.at.every(([k, v]) => k in el.at && (v == null || el.at[k] === v));
  const matches = (el, sel) => { const cs = sel.trim().split(/\s+/).map(compound); if (!fits(el, cs[cs.length - 1])) return false; let n = el.parent; for (let i = cs.length - 2; i >= 0; i--) { while (n && !fits(n, cs[i])) n = n.parent; if (!n) return false; n = n.parent; } return true; };
  const node = (tg, cls, at, parent) => { const el = { tag: tg, cls, at: at || {}, parent, dataset: {}, textContent: '' };
    for (const k in el.at) if (k.startsWith('data-')) el.dataset[k.slice(5).replace(/-(\w)/g, (x, y) => y.toUpperCase())] = el.at[k];
    el.closest = (sel) => { for (let n = el; n; n = n.parent) if (sel.split(',').some((p) => matches(n, p))) return n; return null; };
    el.getAttribute = (k) => (k in el.at ? el.at[k] : null); el.classList = { contains: (k) => el.cls.includes(k) }; el.querySelector = () => null; return el; };
  const body = node('body', [], {}, null), pg = node('div', ['pf-inl', 'spc-v', 'rtl-on'], {}, body);
  const box = node('div', ['rtl'], {}, pg), lane = node('div', ['rtv-ms'], {}, node('div', ['rtv'], {}, box));
  const mark = node(tag[1].toLowerCase(), (attrs.class || '').split(/\s+/).filter(Boolean), attrs, lane);
  const vt = node('div', ['rtl-vt'], { role: 'tablist' }, pg), tlBtn = node('button', [], { type: 'button', role: 'tab', 'data-rv': 'tl' }, vt);
  let handler = null; const calls = [];
  const F0 = () => ({ show: {}, sev: {}, type: {}, ph: 0, sp: {}, only: 0 });
  const ctx = { document: { addEventListener: (ev, f) => { if (ev === 'click') handler = f; } }, F: F0(), F0,
    setV: (v) => calls.push('setV ' + v), build: () => calls.push('build'), redraw: () => calls.push('redraw'), console: { error: () => {}, warn: () => {}, log: () => {} } };
  ctx.window = ctx;
  try { vm.runInNewContext(L.slice(a, b + 1).join('\n'), ctx); } catch (e) { bad('setting up the Checklist/Timeline click listener threw: ' + e.message); return; }
  if (typeof handler !== 'function') { bad('the Checklist/Timeline click listener was not set up'); return; }
  try { handler({ target: mark }); } catch (e) { bad('tapping a stretch mark threw: ' + e.message); return; }
  if (calls.length) bad('tapping a stretch mark on the Timeline (it carries data-sp) calls ' + calls.join(', ') + ': the Timeline is drawn again and the note the tap opened closes');
  calls.length = 0;
  try { handler({ target: tlBtn }); } catch (e) { bad('tapping the Timeline switch threw: ' + e.message); return; }
  if (calls.join('|') !== 'setV tl|build') bad('tapping the Checklist/Timeline switch no longer switches (got: ' + (calls.join(', ') || 'nothing') + ')');
};
if (require.main === module) { const P = []; module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c)); console.log(P.length ? P.join('\n') : 'Timeline mark tap: OK'); process.exitCode = P.length ? 1 : 0; }
