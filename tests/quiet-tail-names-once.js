// Home's round 10 hook threw a hidden error on every redraw (the quiet-bug hunt, Nov 15, overnight; seen in a headless page run,
// about 2,000 times a visit). The code after the end of ui.js's big closure runs at the page's top level, and it declared
// "function dsHome" twice: Design studio round 10's Home briefing (Oct 25) and round 132's dsHome(b), which puts Debriefing's docked
// details back (Oct 27). Two top-level functions with one name don't clash out loud: the later one quietly replaces the earlier one
// everywhere. So round 10's code never ran again, and its dsBars hook called dsHome() with no box on every redraw, where
// "b.querySelectorAll" threw a TypeError into an empty catch. Fixed Nov 15: round 10's function is now dsHomeR10 and its hook is retired
// (round 340, Oct 30, re-homes Home now; running round 10 again would undo it).
// This check:
// 1. compiles the code after the closure, each inline <script> in src/shell.html, and the body of each "(function () { ... })();" that
//    starts a line in them, as the body of a strict-mode block, where one name declared twice is an error (at a script's or a function's
//    top level it isn't), then the pieces all together (separate scripts share the page's top level);
// 2. runs every dsBars hook in the code after the closure that calls dsHome, with the page's own last dsHome and small stand-ins, and
//    fails if dsHome throws because it was called without a box.
// tests/quiet-bugs.js runs it; contradictions.js runs that on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', 'src', p), 'utf8').replace(/\r\n/g, '\n');

// where ui.js's closure ends: the first "})();" line where the file so far is a whole program
function closureEnd(L) {
  for (let i = 0; i < L.length; i++) if (/^\}\)\(\);?\s*$/.test(L[i])) { try { new vm.Script(L.slice(0, i + 1).join('\n')); return i + 1; } catch (e) { /* (still inside) */ } }
  return null;
}

// the top-level pieces of the page, in page order: shell.html's inline scripts, with ui.js after the closure where the build puts ui.js
// (at /*UI*/; the build's other holes, /*ENGINE*/ and the like, are skipped)
function pieces(L, end) {
  const tail = { lines: L.slice(end), at: (i) => 'src/ui.js:' + (end + i + 1) }, out = [];
  const sh = read('shell.html'), re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g; let s;
  while ((s = re.exec(sh))) {
    if (s[1] && /\bsrc=|type=["']application\/(ld\+)?json/.test(s[1])) continue;
    if (/^\s*\/\*UI\*\/\s*$/.test(s[2])) { out.push(tail); continue; }
    if (/^\s*\/\*[A-Z]+\*\/\s*$/.test(s[2])) continue;
    const first = sh.slice(0, s.index + s[0].indexOf('>') + 1).split('\n').length;
    out.push({ lines: s[2].split('\n'), at: (i) => 'src/shell.html:' + (first + i) });
  }
  if (out.indexOf(tail) < 0) out.unshift(tail);
  return out;
}

// the bodies of the "(function () { ... })();" wrappers that start a line at a piece's top level (most shell.html scripts are one):
// the functions declared straight inside one are that wrapper's top level, and one name twice there is the same quiet bug
const IIFE_OPEN = /^(?:\/\*.*?\*\/\s*)*[;!]?\(\s*(?:function\s*[\w$]*\s*\([^)]*\)|\([^)]*\)\s*=>)\s*\{/;
const IIFE_CLOSE = /\}\s*\)\s*\([^()]*\)\s*;?\s*(?:\/\*.*?\*\/\s*)*$|\}\s*\([^()]*\)\s*\)\s*;?\s*(?:\/\*.*?\*\/\s*)*$/;
function wrapperBodies(p) {
  const ls = p.lines, out = [];
  for (let i = 0; i < ls.length; i++) {
    const m = IIFE_OPEN.exec(ls[i]); if (!m) continue;
    for (let j = i; j < ls.length; j++) {
      if (!IIFE_CLOSE.test(ls[j])) continue;
      try { new vm.Script(ls.slice(i, j + 1).join('\n')); } catch (e) { continue; }
      const cl = ls[j].search(IIFE_CLOSE), body = j === i ? [ls[i].slice(m[0].length, cl)] : [ls[i].slice(m[0].length)].concat(ls.slice(i + 1, j), [ls[j].slice(0, cl)]);
      const i0 = i; out.push({ lines: body, at: (k) => p.at(i0 + k) }); i = j; break;
    }
  }
  return out;
}

// compile as a strict-mode block, where (unlike a script's or a function's top level) one name declared twice is an error;
// returns null, or where the first repeat is (0-based line and column in src)
function firstRepeat(src) {
  try { new vm.Script('(function () { "use strict"; {\n' + src + '\n} })', { filename: 'piece' }); return null; } catch (e) {
    const st = String(e.stack || '').split('\n'), m = /Identifier '([^']+)' has already been declared/.exec(String(e.message)), ln = /^piece:(\d+)/.exec(st[0] || '');
    if (!m || !ln) return { other: String(e.message) };
    return { name: m[1], line: +ln[1] - 2, col: Math.max(0, (st[2] || '').indexOf('^')) };
  }
}

// give the repeated declaration at (line, col) a new name, so the next compile finds the next repeat
function rename(lines, r, k) {
  const s = lines[r.line]; if (s == null) return false;
  const nm = r.name.replace(/\$/g, '\\$'), re = new RegExp('(?:function\\s*\\*?\\s*|class\\s+|var\\s+|let\\s+|const\\s+)(' + nm + ')(?![\\w$])', 'g'), re2 = new RegExp('(^|[^\\w$.])(' + nm + ')(?![\\w$])', 'g');
  for (const x of [re, re2]) { x.lastIndex = r.col; const m = x.exec(s); if (m) { const at = m.index + m[0].length - r.name.length; lines[r.line] = s.slice(0, at) + r.name + '__twice' + k + s.slice(at + r.name.length); return true; } }
  return false;
}

// an earlier declaration of the same name, for the message
function earlier(scope, name, upto) {
  const nm = name.replace(/\$/g, '\\$'), re = new RegExp('(^|[^\\w$.])(?:function\\s*\\*?\\s*|class\\s+)' + nm + '\\s*[({]|(?:var|let|const)\\s+' + nm + '(?![\\w$])');
  for (const p of scope) for (let i = 0; i < p.lines.length; i++) { const at = p.at(i); if (at === upto) return null; if (re.test(p.orig[i])) return at; }
  return null;
}

function namesOnce(L, end, bad) {
  const list = pieces(L, end), all = list.concat(...list.map(wrapperBodies)); all.forEach((p) => { p.orig = p.lines.slice(); });
  const found = [], report = (name, at, scope) => { const e = earlier(scope, name, at); found.push('"' + name + '" (' + (e ? e + ' and ' : 'again at ') + at + ')'); };
  // each piece, and each wrapper's body, on its own
  for (const p of all) {
    for (let k = 0; k < 40; k++) { const r = firstRepeat(p.lines.join('\n')); if (!r) break;
      if (r.other) { bad('the one-name-twice check can\'t read the code at ' + p.at(0) + ' as strict code (' + r.other + '), so it can\'t look for two functions with one name there'); break; }
      report(r.name, p.at(r.line), [p]); if (!rename(p.lines, r, k)) break; }
  }
  // the pieces together: separate scripts share the page's top level, so a name in two of them clashes too
  for (let k = 0; k < 40; k++) {
    const off = []; let n = 0; const src = list.map((p) => { off.push(n); n += p.lines.length + 1; return p.lines.join('\n'); }).join('\n;\n');
    const r = firstRepeat(src); if (!r || r.other) break;
    let u = 0; while (u + 1 < off.length && off[u + 1] <= r.line) u++;
    const p = list[u], li = r.line - off[u]; report(r.name, p.at(li), list); if (!rename(p.lines, { name: r.name, line: li, col: r.col }, 'x' + k)) break;
  }
  if (found.length) bad('two functions in the same part of the page code share one name: ' + found.join('; ') + '. The later one quietly replaces the earlier one everywhere, so the earlier one never runs. Give one of them its own name (Home\'s round 10, Nov 15 quiet-bug hunt)');
}

// run each dsBars hook that calls dsHome, with the page's own last dsHome, and catch dsHome failing for want of a box
function hooksGiveABox(L, end, bad) {
  const tail = L.slice(end), grow = (i) => { for (let j = i; j < Math.min(tail.length, i + 400); j++) { const s = tail.slice(i, j + 1).join('\n'); try { new vm.Script(s); return s; } catch (e) { /* (not whole yet) */ } } return null; };
  const hooks = []; tail.forEach((l, i) => { if (/\bdsBars\s*=(?!=)/.test(l) && /\bdsHome\b/.test(l)) { const s = grow(i); if (s) hooks.push({ s, at: 'src/ui.js:' + (end + i + 1) }); } });
  if (!hooks.length) return;
  let last = -1; tail.forEach((l, i) => { if (/(^|[^\w$.])function\s+dsHome\s*\(/.test(l)) last = i; });
  const decl = last >= 0 ? grow(last) : null;
  const none = () => null, el = () => ({ querySelector: none, querySelectorAll: () => [], getElementById: none, closest: none, classList: { add() {}, remove() {}, contains: () => false, toggle() {} }, style: { setProperty() {} }, dataset: {}, textContent: '' });
  const ctx = vm.createContext({ document: Object.assign(el(), { body: el(), documentElement: el() }), window: {}, console: { log() {}, warn() {}, error() {} }, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0 });
  ctx.window = ctx;
  vm.runInContext('var dsBars = function (root) {};', ctx);
  if (decl) { try { vm.runInContext(decl, ctx); } catch (e) { /* (the declaration is hoisted; anything else on its line doesn't matter here) */ } }
  if (typeof ctx.dsHome !== 'function') return;
  vm.runInContext('var __dsErr = []; (function () { var real = dsHome; dsHome = function () { try { return real.apply(this, arguments); } catch (e) { __dsErr.push(String(e && e.message || e)); throw e; } }; })();', ctx);
  for (const h of hooks) {
    ctx.__dsErr.length = 0;
    try { vm.runInContext(h.s, ctx); } catch (e) { continue; }
    try { ctx.dsBars(el()); } catch (e) { /* (a hook may let it out; it's counted either way) */ }
    if (ctx.__dsErr.length) bad('a dsBars hook (' + h.at + ') calls dsHome without a box, so it fails on every redraw ("' + ctx.__dsErr[0] + '") and nobody sees it (Home\'s round 10, Nov 15 quiet-bug hunt)');
  }
}

module.exports = function quietTailNamesOnce(say, H) { void H; /* (reads the source itself) */
  const bad = (m) => say('the page code', 'quiet bug', m);
  let L; try { L = read('ui.js').split('\n'); } catch (e) { bad('could not read src/ui.js'); return; }
  const end = closureEnd(L);
  if (!end) { bad('could not find where ui.js\'s closure ends'); return; }
  try { namesOnce(L, end, bad); } catch (e) { bad('the one-name-twice check crashed: ' + e.message); }
  try { hooksGiveABox(L, end, bad); } catch (e) { bad('the dsHome hook check crashed: ' + e.message); }
};
if (require.main === module) { const P = []; module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c)); console.log(P.length ? P.join('\n') : 'tail names once: pass'); process.exitCode = P.length ? 1 : 0; }
