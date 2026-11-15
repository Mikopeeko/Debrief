// Debriefing's second "Note cooldowns" raid check never drew (the quiet-bug hunt, Nov 15, overnight; found by the exact scope check that
// became tests/closure-names-outside.js, and seen throwing in the hunt's headless page run). It was added on Nov 7 (3ae8621d) at the
// Debriefing timeline's "card on top", after the end of ui.js's big closure, where the page state S and the helpers cutT, hcdNever, spNm,
// T, svgIcon and esc don't exist: "nr = S.rep" threw "S is not defined" straight into its own catch, every time. The row raiders see is
// the closure's own (Raid checks, "if (kitG && NA)", since Oct 23), which shell.html's Raid checks line reads, and it honours the player
// filter: bringing the copy back to life would add a whole-raid row while one player is picked. The dead copy was removed on Nov 15.
// This check fails while a Note cooldowns row is built after the closure (it runs that code at the page's top level, with small
// stand-ins, to say what it stops at), and fails if the closure's own row or the line that reads it goes missing.
// tests/quiet-bugs.js runs it; contradictions.js runs that on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', 'src', p), 'utf8').replace(/\r\n/g, '\n');

// where ui.js's closure ends: the first "})();" line where the file so far is a whole program
function closureEnd(L) {
  for (let i = 0; i < L.length; i++) if (/^\}\)\(\);?\s*$/.test(L[i])) { try { new vm.Script(L.slice(0, i + 1).join('\n')); return i + 1; } catch (e) { /* (still inside) */ } }
  return null;
}

// run the statement around line i of the tail at the page's top level (none of the closure's names), and say what it stops at
function runOutside(tail, i) {
  let from = -1; for (let k = i; k >= Math.max(0, i - 30); k--) if (/^\s*try\s*\{/.test(tail[k])) { from = k; break; }
  if (from < 0) return null;
  let src = null; for (let j = i; j < Math.min(tail.length, i + 30); j++) { const s = tail.slice(from, j + 1).join('\n'); try { new vm.Script(s); src = s; break; } catch (e) { /* (not whole yet) */ } }
  if (!src) return null;
  const c = src.lastIndexOf('catch (e) {'); if (c < 0) return null;
  src = src.slice(0, c) + 'catch (e) { __stop.push(String(e && e.message || e)); ' + src.slice(c + 'catch (e) {'.length);
  const none = () => null, el = () => ({ querySelector: (q) => (/dt-box/.test(q) ? box : null), querySelectorAll: () => [], appendChild() {}, classList: { add() {}, contains: () => false }, dataset: {}, textContent: '' }), box = el();
  const ctx = vm.createContext({ __stop: [], v: el(), txt: (x) => String((x && x.textContent) || '').trim(), document: { createElement: el, querySelector: none, querySelectorAll: () => [], getElementById: none }, console: { log() {}, warn() {}, error() {} } });
  ctx.window = ctx;
  try { vm.runInContext(src, ctx, { timeout: 1000 }); } catch (e) { ctx.__stop.push(String(e && e.message || e)); }
  return ctx.__stop[0] || '';
}

module.exports = function quietNoteCooldownsTail(say, H) { void H; /* (reads the source itself) */
  const bad = (m) => say('Debriefing', 'quiet bug', m);
  let L, SH; try { L = read('ui.js').split('\n'); SH = read('shell.html'); } catch (e) { bad('Note cooldowns check: could not read src/ui.js or src/shell.html'); return; }
  const end = closureEnd(L);
  if (!end) { bad('Note cooldowns check: could not find where ui.js\'s closure ends'); return; }
  const inside = L.slice(0, end).join('\n'), tail = L.slice(end);
  // 1) a Note cooldowns row built after the closure (comments on the same line don't count)
  const at = tail.findIndex((l) => /cch-ab-note|\bnr = S\.rep\b/.test(l.replace(/\/\*.*?\*\//g, '')));
  if (at >= 0) {
    let stop = null; try { stop = runOutside(tail, at); } catch (e) { stop = null; }
    bad('a second Note cooldowns row is back after ui.js\'s closure (src/ui.js:' + (end + at + 1) + ')' + (stop ? ': out there it stops at "' + stop + '" and never draws' : '') + '. The closure\'s own row in Raid checks is the one raiders see; a copy would show the whole raid\'s cooldowns while one player is picked (Nov 15 quiet-bug hunt, from 3ae8621d)');
  }
  // 2) the row raiders see, inside the closure, and the Raid checks line that reads it
  for (const s of ["svgIcon(0, 'Note cooldowns')", '<span class="cgl-n">Note cooldowns</span>'])
    if (!inside.includes(s)) bad('Raid checks lost the Note cooldowns row (expected `' + s + '` inside ui.js\'s closure)');
  if (!SH.includes('var ncd = pick(/^note cooldowns/i)')) bad('Raid checks no longer reads the Note cooldowns row (expected `var ncd = pick(/^note cooldowns/i)` in src/shell.html)');
};
if (require.main === module) { const P = []; module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c)); console.log(P.length ? P.join('\n') : 'note cooldowns tail: pass'); process.exitCode = P.length ? 1 : 0; }
