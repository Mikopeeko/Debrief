// The "Warcraft Logs is down right now" bar never showed for a pull read in a background reading worker.
// Found in the quiet-bug hunt (Nov 15, overnight) by reading the code, then proved in a vm. Broken since 9420b019 (Oct 25, "Faster night
// loading"), when pulls started downloading in reading workers: inside a worker, wcl.js fires 'wla-wcl-down' on the worker's own global,
// so the page's listener never hears it. The worker sends { load: true, down: true } back, and RW's done handler in src/ui.js copied
// down onto the error (e.down = m.down) but never fired the event on the page.
// This cuts that done handler out of src/ui.js and runs it in a vm: a "Warcraft Logs is down" answer must fire 'wla-wcl-down' on the
// page and still fail the pull with an error marked down; any other failed download must not fire it.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function quietWclDownWorker(say) {
  const bad = (m) => say('Warcraft Logs down bar', 'quiet bug', m);
  let ui; try { ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'); } catch (e) { bad('could not read src/ui.js'); return; }
  const at = ui.indexOf('e.down = m.down');
  if (at < 0) { bad('could not find the reading workers\' done handler (e.down = m.down) in src/ui.js'); return; }
  const s = ui.lastIndexOf('done: (m) =>', at);
  if (s < 0 || at - s > 2000) { bad('could not find "done: (m) =>" right before e.down = m.down in src/ui.js'); return; }
  // (the handler runs from "(m) =>" to the first closing brace that makes it a whole function: the parser decides, so quotes and comments can't fool it)
  const head = s + 'done: '.length; let fnSrc = null;
  for (let i = ui.indexOf('{', head); i > 0 && i - head < 4000; i = ui.indexOf('}', i + 1)) {
    if (ui[i] !== '}') continue;
    const cand = '(' + ui.slice(head, i + 1) + ')';
    try { new vm.Script(cand); fnSrc = cand; break; } catch (e) { /* (not whole yet) */ }
  }
  if (!fnSrc) { bad('could not cut RW\'s done handler out of src/ui.js'); return; }
  const run = (m) => {
    const fired = [], out = {};
    const ctx = vm.createContext({ Event: class { constructor(t) { this.type = t; } }, console: { warn() {}, error() {}, log() {} }, item: { boss: 'Boss', pull: 1 },
      res: (v) => { out.res = v; }, rej: (e) => { out.rej = e; } });
    ctx.dispatchEvent = (e) => { fired.push(e && e.type); return true; }; ctx.window = ctx;
    let fn; try { fn = vm.runInContext(fnSrc, ctx); } catch (e) { bad('RW\'s done handler doesn\'t run on its own: ' + e.message); return null; }
    try { fn(m); } catch (e) { bad('RW\'s done handler threw: ' + e.message); return null; }
    return { fired, out };
  };
  const down = run({ id: 1, load: true, down: true, err: 'Warcraft Logs is down right now. Try again in a few minutes.' });
  if (!down) return;
  if (!down.out.rej || !down.out.rej.down || !down.out.rej.load) bad('a reading worker\'s "Warcraft Logs is down" answer no longer fails the pull with an error marked down');
  if (!down.fired.includes('wla-wcl-down')) bad('a pull read in a background worker while Warcraft Logs is down never shows the "Warcraft Logs is down right now" bar (the page doesn\'t fire wla-wcl-down)');
  const other = run({ id: 2, load: true, down: false, err: 'The server answered 404' });
  if (other && other.fired.includes('wla-wcl-down')) bad('any failed download in a background worker shows the "Warcraft Logs is down" bar, not only Warcraft Logs being down');
  if (other && (!other.out.rej || other.out.rej.down)) bad('a failed download in a background worker no longer fails the pull, or is marked as Warcraft Logs being down');
};
if (require.main === module) { const P = []; module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c)); console.log(P.length ? P.join('\n') : 'quiet-wcl-down-worker: passes'); process.exitCode = P.length ? 1 : 0; }
