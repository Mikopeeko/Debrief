// The quiet-bug hunt (Nov 15, overnight, from Main's Nov 14 find: Graphs' Buffs row threw "S is not defined", tests/graphs-buff-row.js).
// src/ui.js is one big closure, "(function () { ... })();", that ends at the first "})();" line where the file so far is a whole program
// (about line 37990; guides.js, mptab.js and sidenav.js are spliced inside it). Everything after that line, and every inline <script> in
// src/shell.html, runs at the page's top level, where the closure's own names (S, esc, svgIcon, T, C, cutT, ...) don't exist. Code there that
// uses one throws "X is not defined" (often inside a try/catch, so the feature quietly does nothing), and a "typeof X" guard on one is always
// false (so the feature never runs). The hunt found 13 such names on Nov 15 with an exact check (esbuild's define, plus the names a real page has):
// the Debriefing timeline's Note cooldowns row and class-coloured names, its maps, its icons, Graphs' Defensives row, the Rotation timeline's
// "casts nobody pressed" filter, the boss guides' design hook and more.
// This check reads the closure's top-level names and fails when code outside the closure uses one that the page doesn't also put on window.
// It has its own small tokenizer (strings, template literals, regex literals and comments are skipped), so it needs no packages.
// contradictions.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const KW = new Set('break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static await async of get set'.split(' '));
const REGEX_AFTER_KW = new Set('return typeof case in of new delete void throw instanceof else do yield await'.split(' '));
// names a browser page always has (a closure name that shadows one is fine to use outside: it means the browser's)
const BROWSER = new Set('window self document location history navigator screen top parent frames opener name status length origin event open close print alert confirm prompt find focus blur scroll scrollTo scrollBy scrollX scrollY innerWidth innerHeight outerWidth outerHeight devicePixelRatio localStorage sessionStorage indexedDB caches crypto performance console fetch setTimeout clearTimeout setInterval clearInterval requestAnimationFrame cancelAnimationFrame requestIdleCallback cancelIdleCallback queueMicrotask structuredClone getComputedStyle matchMedia addEventListener removeEventListener dispatchEvent postMessage atob btoa encodeURIComponent decodeURIComponent encodeURI decodeURI escape unescape isNaN isFinite parseInt parseFloat Image Audio Option Node Element HTMLElement SVGElement Event CustomEvent URL URLSearchParams Blob File FileReader FormData Headers Request Response AbortController MutationObserver ResizeObserver IntersectionObserver DOMParser XMLSerializer NodeFilter TextEncoder TextDecoder Worker WebSocket Intl JSON Math Date Object Array String Number Boolean Symbol RegExp Map Set WeakMap WeakSet Promise Proxy Reflect Error TypeError RangeError SyntaxError ReferenceError ArrayBuffer DataView Uint8Array Uint16Array Uint32Array Int8Array Int16Array Int32Array Float32Array Float64Array BigInt globalThis undefined NaN Infinity eval arguments CSS ClipboardItem Path2D'.split(' '));

// A small JavaScript tokenizer: identifiers, punctuators and opaque literals, with line numbers.
function tokenize(src, line0) {
  const out = []; let i = 0, line = line0 || 1; const n = src.length; const tplStack = []; // brace depth at each open ${
  let depth = 0; // braces inside template expressions
  const prevSig = () => out.length ? out[out.length - 1] : null;
  const regexOk = () => { const p = prevSig(); if (!p) return true; if (p.t === 'num' || p.t === 'str' || p.t === 'tpl' || p.t === 're') return false;
    if (p.t === 'id') return KW.has(p.v) ? REGEX_AFTER_KW.has(p.v) : false; return !(p.v === ')' || p.v === ']' || p.v === '}'); };
  const tplRest = () => { // read template text until ` or ${
    const st = line; while (i < n) { const c = src[i];
      if (c === '\\') { i += 2; continue; } if (c === '\n') line++;
      if (c === '`') { i++; out.push({ t: 'tpl', v: '`', line: st }); return; }
      if (c === '$' && src[i + 1] === '{') { i += 2; tplStack.push(depth); depth = 0; out.push({ t: 'punc', v: '${', line: st }); return; }
      i++; } };
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v' || c === ' ' || c === '﻿') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? n : e + 2; for (let k = i; k < end; k++) if (src[k] === '\n') line++; i = end; continue; }
    if (c === '"' || c === "'") { const st = line; i++; while (i < n && src[i] !== c) { if (src[i] === '\\') { if (src[i + 1] === '\n') line++; i++; } else if (src[i] === '\n') { line++; break; } i++; } i++; out.push({ t: 'str', v: c, line: st }); continue; }
    if (c === '`') { i++; tplRest(); continue; }
    if (c === '}' && tplStack.length && depth === 0) { out.push({ t: 'punc', v: '}', line }); i++; depth = tplStack.pop(); tplRest(); continue; }
    if (/[A-Za-z_$]/.test(c) || c > '\u007f') { let j = i + 1; while (j < n && (/[\w$]/.test(src[j]) || src[j] > '\u007f')) j++; out.push({ t: 'id', v: src.slice(i, j), line }); i = j; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1]))) { let j = i + 1; while (j < n && /[\w.]/.test(src[j])) { if ((src[j] === 'e' || src[j] === 'E') && (src[j + 1] === '+' || src[j + 1] === '-') && !/^0[xX]/.test(src.slice(i, j))) j++; j++; } out.push({ t: 'num', v: src.slice(i, j), line }); i = j; continue; }
    if (c === '/' && regexOk()) { const st = line; let j = i + 1, cls = false; while (j < n) { const d = src[j]; if (d === '\\') { j += 2; continue; } if (d === '\n') break; if (cls) { if (d === ']') cls = false; } else if (d === '[') cls = true; else if (d === '/') break; j++; } j++; while (j < n && /[a-z]/i.test(src[j])) j++; out.push({ t: 're', v: '/', line: st }); i = j; continue; }
    const three = src.substr(i, 3), two = src.substr(i, 2);
    const p = ['>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??='].find((x) => src.startsWith(x, i)) || (['=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>'].includes(two) ? two : c);
    if (p === '{') depth++; else if (p === '}') depth--;
    out.push({ t: 'punc', v: p, line }); i += p.length; void three;
  }
  return out;
}

// the names declared at a closure's top level (bracket depth `d`): const/let/var declarators, function and class names
function topNames(tk, d) {
  const names = new Map(); let depth = 0;
  const OPEN = { '(': 1, '[': 1, '{': 1, '${': 1 }, CLOSE = { ')': 1, ']': 1, '}': 1 };
  for (let k = 0; k < tk.length; k++) {
    const x = tk[k];
    if (x.t === 'punc' && OPEN[x.v]) { depth++; continue; }
    if (x.t === 'punc' && CLOSE[x.v]) { depth--; continue; }
    if (depth !== d || x.t !== 'id') continue;
    if ((x.v === 'function' || x.v === 'class') && tk[k + 1]) { let j = k + 1; if (tk[j].v === '*') j++; if (tk[j] && tk[j].t === 'id' && !KW.has(tk[j].v)) names.set(tk[j].v, tk[j].line); continue; }
    if (x.v === 'const' || x.v === 'let' || x.v === 'var') {
      let j = k + 1, dd = 0, expectName = true;
      for (; j < tk.length; j++) { const y = tk[j];
        if (y.t === 'punc' && OPEN[y.v]) { if (expectName && dd === 0 && (y.v === '{' || y.v === '[')) { // destructuring: bound names are the ones not followed by ':'
            let q = j + 1, pd = 1; for (; q < tk.length && pd > 0; q++) { const z = tk[q]; if (z.t === 'punc' && OPEN[z.v]) pd++; else if (z.t === 'punc' && CLOSE[z.v]) pd--; else if (z.t === 'id' && !KW.has(z.v) && !(tk[q + 1] && tk[q + 1].v === ':') && tk[q - 1].v !== '=' && tk[q - 1].v !== '.') names.set(z.v, z.line); }
            j = q - 1; expectName = false; continue; }
          dd++; continue; }
        if (y.t === 'punc' && CLOSE[y.v]) { if (dd === 0) break; dd--; continue; }
        if (dd > 0) continue;
        if (y.v === ';') break;
        if (y.v === ',') { expectName = true; continue; }
        if (expectName && y.t === 'id') { if (KW.has(y.v)) break; names.set(y.v, y.line); expectName = false; continue; }
        if (y.t === 'id' && y.line > tk[j - 1].line && /^(const|let|var|function|class|if|for|while|do|return|try|switch|throw)$/.test(y.v)) break; // a new statement (no semicolon)
        expectName = false;
      }
      k = j - 1;
    }
  }
  return names;
}

// scopes: each function, arrow, method and catch is a scope holding its parameters and the var/let/const/function/class names declared
// directly in it (block scoping is ignored: a let in an inner block counts for the whole function, which can only hide a hit, never invent one)
function scopes(tk) {
  const OPEN = { '(': 1, '[': 1, '{': 1, '${': 1 }, CLOSE = { ')': 1, ']': 1, '}': 1 };
  const match = new Int32Array(tk.length).fill(-1), st = [];
  for (let k = 0; k < tk.length; k++) { const x = tk[k]; if (x.t !== 'punc') continue; if (OPEN[x.v]) st.push(k); else if (CLOSE[x.v] && st.length) { const o = st.pop(); match[o] = k; match[k] = o; } }
  const S = [{ start: 0, end: tk.length - 1, decl: new Set() }];
  // the names bound by a parameter list or a destructuring pattern between two brackets (keys before ':' and defaults after '=' are not bound)
  const ids = (from, to, set) => { for (let q = from + 1; q < to; q++) { const z = tk[q]; if (z.t !== 'id' || KW.has(z.v)) continue; const pv = tk[q - 1].v, nv = tk[q + 1] && tk[q + 1].v;
      if (pv === '.' || pv === '?.') continue; if (nv === ':' && (pv === '{' || pv === ',')) continue; if (pv === '=') { continue; } set.add(z.v); } return set; };
  for (let k = 0; k < tk.length; k++) { const x = tk[k];
    if (x.t === 'id' && x.v === 'function') { let j = k + 1; if (tk[j] && tk[j].v === '*') j++; const nm = tk[j] && tk[j].t === 'id' ? tk[j].v : null; if (nm) j++;
      if (tk[j] && tk[j].v === '(' && match[j] > 0 && tk[match[j] + 1] && tk[match[j] + 1].v === '{') { const d = ids(j, match[j], new Set()); if (nm) d.add(nm); S.push({ start: j, end: match[match[j] + 1], decl: d, fnName: nm, at: k }); } continue; }
    if (x.v === '=>') { let start; const d = new Set(), p = tk[k - 1]; if (p && p.t === 'id') { start = k - 1; d.add(p.v); } else if (p && p.v === ')' && match[k - 1] >= 0) { start = match[k - 1]; ids(start, k - 1, d); } else continue;
      let end; if (tk[k + 1] && tk[k + 1].v === '{') end = match[k + 1]; else { let q = k + 1; for (; q < tk.length; q++) { const z = tk[q]; if (z.t === 'punc' && OPEN[z.v]) { if (match[q] >= 0) q = match[q]; continue; } if (z.t === 'punc' && (CLOSE[z.v] || z.v === ',' || z.v === ';')) break; } end = q - 1; }
      S.push({ start, end, decl: d }); continue; }
    if (x.t === 'id' && x.v === 'catch' && tk[k + 1] && tk[k + 1].v === '(' && match[k + 1] > 0 && tk[match[k + 1] + 1] && tk[match[k + 1] + 1].v === '{') { S.push({ start: k + 1, end: match[match[k + 1] + 1], decl: ids(k + 1, match[k + 1], new Set()) }); continue; }
    // a method: name(a, b) { ... } in an object literal or a class body
    if (x.t === 'id' && !KW.has(x.v) && tk[k + 1] && tk[k + 1].v === '(' && match[k + 1] > 0 && tk[match[k + 1] + 1] && tk[match[k + 1] + 1].v === '{' && tk[k - 1] && /^([{},;*]|get|set|async|static)$/.test(tk[k - 1].v)) { S.push({ start: k + 1, end: match[match[k + 1] + 1], decl: ids(k + 1, match[k + 1], new Set()) }); continue; }
  }
  S.sort((p, q) => p.start - q.start || q.end - p.end);
  // the innermost scope at each token, by a sweep, and each scope's parent
  const inner = new Int32Array(tk.length), stack = [0]; let si = 1;
  for (let k = 0; k < tk.length; k++) { while (stack.length > 1 && k > S[stack[stack.length - 1]].end) stack.pop(); while (si < S.length && S[si].start === k) { stack.push(si); si++; } inner[k] = stack[stack.length - 1]; }
  const parent = new Int32Array(S.length).fill(-1); { const stk = [0]; for (let i = 1; i < S.length; i++) { while (stk.length > 1 && S[i].start > S[stk[stk.length - 1]].end) stk.pop(); parent[i] = stk[stk.length - 1]; stk.push(i); } }
  const byAt = new Map(); S.forEach((sc, i) => { if (sc.at != null) byAt.set(sc.at, i); });
  // declarations go to the innermost scope that holds them (a function declaration's own name also goes to the scope around it)
  for (let k = 0; k < tk.length; k++) { const x = tk[k]; if (x.t !== 'id') continue;
    if (x.v === 'function') { const own = byAt.get(k); if (own > 0 && S[own].fnName) S[parent[own]].decl.add(S[own].fnName); continue; }
    if (x.v === 'class' && tk[k + 1] && tk[k + 1].t === 'id') { S[inner[k]].decl.add(tk[k + 1].v); continue; }
    if (x.v === 'const' || x.v === 'let' || x.v === 'var') { const into = S[inner[k]].decl; let j = k + 1, expect = true;
      for (; j < tk.length; j++) { const y = tk[j];
        if (y.t === 'punc' && OPEN[y.v]) { if (expect && (y.v === '{' || y.v === '[') && match[j] > 0) { ids(j, match[j], into); j = match[j]; expect = false; continue; } if (match[j] >= 0) j = match[j]; expect = false; continue; }
        if (y.t === 'punc' && CLOSE[y.v]) break; if (y.v === ';') break; if (y.v === ',') { expect = true; continue; }
        if (expect && y.t === 'id') { if (KW.has(y.v)) break; into.add(y.v); expect = false; continue; }
        if (y.t === 'id' && y.line > tk[j - 1].line && /^(const|let|var|function|class|if|for|while|do|return|try|switch|throw)$/.test(y.v)) break; // a new statement (no semicolon)
        expect = false; }
      } }
  return { S, inner, parent };
}

// uses of closure-only names in a unit that no scope around them declares
function usesIn(tk, closureNames, exposed, mapLine) {
  const { S, inner, parent } = scopes(tk), hits = [];
  const bound = (k, n) => { for (let i = inner[k]; i >= 0; i = parent[i]) if (S[i].decl.has(n)) return true; return false; };
  for (let k = 0; k < tk.length; k++) { const x = tk[k];
    if (x.t !== 'id' || !closureNames.has(x.v) || exposed.has(x.v) || BROWSER.has(x.v) || KW.has(x.v)) continue;
    const p = tk[k - 1], nx = tk[k + 1];
    if (p && (p.v === '.' || p.v === '?.' || p.v === '#')) continue; // a property
    if (nx && nx.v === ':' && p && (p.v === '{' || p.v === ',')) continue; // an object key
    if (bound(k, x.v)) continue;
    hits.push({ name: x.v, where: mapLine(x.line), guarded: !!(p && p.v === 'typeof') });
  }
  return hits;
}

function check(read) {
  const L = read('src/ui.js').split('\n');
  let end = null;
  for (let i = 0; i < L.length; i++) if (/^\}\)\(\);?\s*$/.test(L[i])) { try { new vm.Script(L.slice(0, i + 1).join('\n')); end = i + 1; break; } catch (e) { /* (still inside) */ } }
  if (!end) return { error: 'could not find where ui.js\'s closure ends' };
  // the closure with the spliced files in place, so their top-level names count as closure names too
  const parts = []; for (let i = 0; i < end; i++) { const l = L[i]; const inl = l.startsWith('/*GUIDES*/') ? 'src/guides.js' : l.startsWith('/*MPTAB*/') ? 'src/mptab.js' : l.startsWith('/*SIDENAV*/') ? 'src/sidenav.js' : null; parts.push(inl ? read(inl) : l); }
  const closureTk = tokenize(parts.join('\n')), closure = topNames(closureTk, 2);
  // names the page puts on window: real window.X = ... statements (tokens, so comments and strings don't count). Inside the closure any such line
  // is a bridge. Outside it, window.X = X (a closure name on the right) is not: it runs where X doesn't exist, so it can't count (Nov 15 review)
  const exposed = new Set();
  const bridges = (tk, outside) => { for (let k = 0; k + 3 < tk.length; k++) { const x = tk[k]; if (x.t !== 'id' || (x.v !== 'window' && x.v !== 'globalThis') || (tk[k - 1] && (tk[k - 1].v === '.' || tk[k - 1].v === '?.'))) continue;
    if (tk[k + 1].v !== '.' || tk[k + 2].t !== 'id' || tk[k + 3].v !== '=') continue; const rhs = tk[k + 4];
    if (outside && rhs && rhs.t === 'id' && closure.has(rhs.v)) continue; exposed.add(tk[k + 2].v); } };
  bridges(closureTk, false);
  const hits = [];
  // the tail of ui.js (same <script> tag, top level): its own top-level names are page-wide too
  const tailTk = tokenize(L.slice(end).join('\n'), end + 1);
  for (const n of scopes(tailTk).S[0].decl) exposed.add(n);
  bridges(tailTk, true);
  // the shell's inline scripts
  const sh = read('src/shell.html'), units = []; const sre = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g; let s;
  while ((s = sre.exec(sh))) { if (s[1] && /\bsrc=|type=["']application\/(ld\+)?json/.test(s[1])) continue; const body = s[2]; if (/^\s*\/\*(ENGINE|MPLUS|RECAP|WCL|UI)\*\/\s*$/.test(body)) continue;
    const start = sh.slice(0, s.index + s[0].indexOf('>') + 1).split('\n').length; const tk = tokenize(body, start); for (const n of scopes(tk).S[0].decl) exposed.add(n); bridges(tk, true); units.push({ tk, start }); }
  // (the other script files the build inlines (engine, wcl, recap, mplus) put their own names on window; none of them is a closure name's bridge)
  hits.push(...usesIn(tailTk, closure, exposed, (l) => 'src/ui.js:' + l));
  for (const u of units) hits.push(...usesIn(u.tk, closure, exposed, (l) => 'src/shell.html:' + l));
  return { end, closureNames: closure.size, hits };
}

module.exports = function closureNamesOutside(say, read) {
  read = read || ((p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8').replace(/\r\n/g, '\n'));
  let r; try { r = check(read); } catch (e) { say('the page code', 'quiet bug', 'the closure-names check crashed: ' + e.message); return; }
  if (r.error) { say('the page code', 'quiet bug', r.error); return; }
  if (r.closureNames < 500) say('the page code', 'quiet bug', 'the closure-names check found only ' + r.closureNames + ' names at the top of ui.js\'s closure: the check no longer reads it');
  const by = new Map(); for (const h of r.hits) { const o = by.get(h.name) || { at: new Set(), guarded: false }; o.at.add(h.where); o.guarded = o.guarded || h.guarded; by.set(h.name, o); }
  for (const [k, o] of by) say('the page code', 'quiet bug', k + ' is one of ui.js\'s closure names, used outside the closure at ' + [...o.at].slice(0, 6).join(', ') + (o.guarded ? ' behind a "typeof ' + k + '" guard that is always false there, so that code never runs' : ', where it throws "' + k + ' is not defined", so that code quietly does nothing') + '. Put it on window inside the closure and read window.' + k + ', or move the code inside (quiet-bug hunt, Nov 15)');
};
module.exports.check = check;
if (require.main === module) { const P = []; module.exports((a, b, c) => P.push('[' + b + '] ' + c)); console.log(P.length ? P.join('\n') : 'closure names outside: none'); process.exitCode = P.length ? 1 : 0; }
