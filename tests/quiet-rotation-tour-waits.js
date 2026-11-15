// Rotation Timeline's first-visit tour: it asked "typeof tipBusy === 'function' && tipBusy()" (the site's "one set of tips at a time" check,
// from f47141e2, Nov 9), but tipBusy is a const inside ui.js's big closure and the tour code runs after the closure ends, where the name
// doesn't exist, so the check was always false. The tour could start while a pop-up, the site tour or the getting-started window was open,
// hidden behind it. Found by the quiet-bug hunt (Nov 15, overnight).
// The fix: the closure puts the check on window (window.tipBusy) and the tour reads window.tipBusy, skipping it while its own tour box
// (.rtv-tour) is up, and asks again whether the raider already finished the tour before it starts.
// This runs the real tour-start line (cut out of src/ui.js) at the page's top level with a fake clock and a stand-in page, next to the
// closure's real tipBusy lines: with a pop-up or the site tour open it must wait, and start once it closes; once the raider has finished
// it ('wla-rtv-tour' saved) it must not start; drawn twice, it must not come back after the raider finishes it.
// quiet-bugs.js runs it on every build (contradictions.js runs quiet-bugs.js).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function quietRotationTourWaits(say) {
  const bad = (m) => say('Rotation', 'Timeline tour', m);
  let L; try { L = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8').replace(/\r\n/g, '\n').split('\n'); } catch (e) { bad('could not read src/ui.js'); return; }
  // (where the big closure ends: the first "})();" line where the file so far is a whole program, as tests/graphs-buff-row.js finds it)
  let end = null;
  for (let i = 0; i < L.length; i++) if (/^\}\)\(\);?\s*$/.test(L[i])) { try { new vm.Script(L.slice(0, i + 1).join('\n')); end = i + 1; break; } catch (e) { /* (still inside) */ } }
  if (!end) { bad('could not find where ui.js\'s closure ends'); return; }
  const defAt = L.findIndex((l, i) => i < end && /^\s*const tipBusy\s*=/.test(l));
  if (defAt < 0) { bad('could not find "const tipBusy" inside ui.js\'s closure'); return; }
  try { new vm.Script(L[defAt]); } catch (e) { bad('the tipBusy line no longer stands on its own line, so this check can\'t run it'); return; }
  const onWin = L.slice(0, end).join('\n').match(/\bwindow\.tipBusy\s*=\s*tipBusy\b\s*;?/);
  if (!onWin) bad('tipBusy (is a tour or pop-up open?) is never put on window inside ui.js\'s closure, so the Rotation Timeline tour can\'t see it');
  const at = L.findIndex((l, i) => i >= end && l.includes('getItem(\'wla-rtv-tour\')') && l.includes('rtvTour(box, 0)'));
  if (at < 0) { bad('could not find the Rotation Timeline tour start (wla-rtv-tour ... rtvTour(box, 0)) after ui.js\'s closure'); return; }
  const code = L[at].trim();
  // (one run: the closure's tipBusy inside a function, the tour line at the top level, a fake clock; returns when rtvTour was called, in ms)
  const run = (draws, events, saved) => {
    const open = new Set(), store = Object.assign({}, saved || {}), q = [], log = []; let now = 0;
    const el = () => ({ classList: { contains: () => false }, closest: () => null, getClientRects: () => [{}], remove: () => {} });
    const document = { body: { contains: () => true }, querySelector: (s) => (open.has(s) ? el() : null),
      querySelectorAll: (s) => (open.has('dialog') && /role="dialog"/.test(s) ? [el()] : []) };
    const ctx = { document, localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
      setTimeout: (f, ms) => { q.push({ at: now + (ms || 0), f }); return q.length; }, clearTimeout: () => {},
      box: { offsetParent: {} }, rtvTour: () => { log.push(now); open.add('.rtv-tour'); }, console: { error: () => {}, warn: () => {}, log: () => {} } };
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext('var $ = function (s) { return document.querySelector(s); };\n(function () {\n' + L[defAt] + '\n' + (onWin ? onWin[0] : '') + '\n})();', ctx);
    draws.forEach((t) => q.push({ at: t, f: () => vm.runInContext(code, ctx) }));
    events.forEach((e) => q.push({ at: e.at, f: () => e.f(open, store) }));
    while (q.length) { q.sort((x, y) => x.at - y.at); const j = q.shift(); if (j.at > 700000) break; now = j.at; j.f(); }
    return log;
  };
  const s = (ms) => (ms / 1000) + ' s';
  try {
    // (a pop-up, then the site tour: open when the Timeline is drawn, closed at 6 s)
    for (const [what, key] of [['a pop-up', 'dialog'], ['the site tour', '#tour']]) {
      const a = run([0], [{ at: 0, f: (o) => o.add(key) }, { at: 6000, f: (o) => o.delete(key) }]);
      if (a.length && a[0] < 6000) bad('the Timeline tour started at ' + s(a[0]) + ' while ' + what + ' was still open (it closed at 6 s): it shows up behind it');
      else if (!a.length) bad('the Timeline tour never started after ' + what + ' closed');
    }
    // (the raider already finished the tour)
    const c = run([0], [{ at: 0, f: (o) => o.add('dialog') }, { at: 6000, f: (o) => o.delete('dialog') }], { 'wla-rtv-tour': '1' });
    if (c.length) bad('the Timeline tour started at ' + s(c[0]) + ' for a raider who already finished it');
    // (drawn twice, as a filter tap or new data does; the raider finishes the tour at 10 s)
    const d = run([0, 300], [{ at: 10000, f: (o, st) => { o.delete('.rtv-tour'); st['wla-rtv-tour'] = '1'; } }]);
    if (!d.length) bad('drawn twice, the Timeline tour never started');
    else if (d.some((t) => t >= 10000)) bad('drawn twice, the Timeline tour came back at ' + s(d.find((t) => t >= 10000)) + ' after the raider finished it');
  } catch (e) { bad('running the Timeline tour start threw: ' + e.message); }
};
if (require.main === module) { const P = []; module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c)); console.log(P.length ? P.join('\n') : 'Timeline tour: OK'); process.exitCode = P.length ? 1 : 0; }
