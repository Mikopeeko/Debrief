// Faster loading (Nov 5, Flex: "Id like to improve load times on the website"): the website's copy of the page without the notes we write
// in the code (comments), about 0.5 MB less to download on every first visit and after every new build. Run by build.ps1 when Node is on
// this PC: node strip-comments.js <in.html> <out.html>. Only the website copy; WoW-Log-Analyzer.html (the local copy) keeps everything.
// Left exactly as they are:
// - The analysis scripts (they start with "(function (root)": engine.js, wcl.js, companion/mplus.js). Saved readings are keyed to their
//   text (RD.version in ui.js, and engine.js's RULES_MARK line), and the reading workers find them by that start.
// - Styles (little to gain).
// - Any script whose stripped copy doesn't compile, or doesn't keep the markers the reading workers and the Worker look for: it stays whole
//   and the build says so.
// Only comments go, with blank lines and spaces at line ends: code, strings, template text and regular expressions stay character for
// character, so text the site finds in its own code (the reading workers' "\nconst WIPE_LINE = {" and the like) is unchanged.
const fs = require('fs'), vm = require('vm');
function strip(js) {
  let o = '', i = 0; const n = js.length;
  const regexOk = () => { let k = o.length - 1; while (k >= 0 && /\s/.test(o[k])) k--; const c = o[k]; if (k < 0 || '(,=:[!&|?{};+-*%<>~^'.includes(c)) return true;
    const w = /[A-Za-z_$][\w$]*$/.exec(o.slice(Math.max(0, k - 12), k + 1)); return !!w && /^(return|typeof|case|do|else|in|void|delete|instanceof|new|throw)$/.test(w[0]); };
  while (i < n) {
    const c = js[i], d = js[i + 1];
    if (c === '/' && d === '/') { while (i < n && js[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const j = js.indexOf('*/', i + 2); if (j < 0) throw new Error('an open comment'); i = j + 2; o += ' '; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < n && js[j] !== c) { if (js[j] === '\\') j++; else if (js[j] === '\n') throw new Error('a string across lines'); j++; } o += js.slice(i, j + 1); i = j + 1; continue; }
    if (c === '`') { const j = tmpl(js, i); o += js.slice(i, j + 1); i = j + 1; continue; }
    if (c === '/' && regexOk()) { let j = i + 1, cls = false; while (j < n) { if (js[j] === '\\') { j += 2; continue; } if (js[j] === '\n') throw new Error('a regex across lines'); if (js[j] === '[') cls = true; else if (js[j] === ']') cls = false; else if (js[j] === '/' && !cls) break; j++; } o += js.slice(i, j + 1); i = j + 1; continue; }
    o += c; i++;
  }
  return o.replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n');
}
// (a template literal from i (the backtick) to its closing backtick, ${ } parts included, nested templates and strings in them skipped whole)
function tmpl(js, i) {
  let j = i + 1; const n = js.length;
  while (j < n) {
    const c = js[j];
    if (c === '\\') { j += 2; continue; }
    if (c === '`') return j;
    if (c === '$' && js[j + 1] === '{') { j += 2; let depth = 1;
      while (j < n && depth) { const e = js[j];
        if (e === '\\') { j += 2; continue; }
        if (e === '`') { j = tmpl(js, j) + 1; continue; }
        if (e === '"' || e === "'") { let k = j + 1; while (k < n && js[k] !== e) { if (js[k] === '\\') k++; k++; } j = k + 1; continue; }
        if (e === '{') depth++; else if (e === '}') depth--; j++; }
      continue; }
    j++;
  }
  throw new Error('an open template');
}
// (a script's first code, after any comments at its top)
function lead(js) { let i = 0; for (;;) { while (/\s/.test(js[i] || '')) i++; if (js.startsWith('//', i)) { const j = js.indexOf('\n', i); i = j < 0 ? js.length : j; continue; }
  if (js.startsWith('/*', i)) { const j = js.indexOf('*/', i + 2); i = j < 0 ? js.length : j + 2; continue; } return js.slice(i, i + 40); } }
// (what the reading workers (ui.js rwSrc) and the Worker (qaKnowledge, the patch-notes post) find in the page's text)
const MARKS = ['\nfunction cutInfo(r) {', '\nconst raidSizeOf =', '\nconst WIPE_LINE = {', '\nconst keptDeaths', 'const TAB_TIP = {', 'const PATCH_NOTES = ['];
const [IN, OUT] = process.argv.slice(2), html = fs.readFileSync(IN, 'utf8');
let out = '', at = 0, kept = 0, cut = 0, before = 0, after = 0; const notes = [];
const re = /<script>([\s\S]*?)<\/script>/g; let m;
while ((m = re.exec(html))) {
  out += html.slice(at, m.index); at = re.lastIndex; const js = m[1]; let s = js;
  if (js.length > 20000 && !lead(js).startsWith('(function (root)')) {
    try { s = strip(js); new vm.Script(s, { filename: 'stripped.js' });
      const lost = MARKS.filter((k) => js.includes(k) && !s.includes(k)); if (lost.length) throw new Error('lost ' + lost.join(', '));
      if (s.trimStart().startsWith('(function (root)')) throw new Error('would look like an analysis script'); cut++; }
    catch (e) { s = js; kept++; notes.push(e.message); }
  }
  before += js.length; after += s.length; out += '<script>' + s + '</script>';
}
out += html.slice(at);
fs.writeFileSync(OUT, out);
console.log('comments out of ' + cut + ' script(s): ' + (before / 1e6).toFixed(1) + ' MB -> ' + (after / 1e6).toFixed(1) + ' MB' + (kept ? '; kept whole: ' + kept + ' (' + notes.join('; ') + ')' : ''));
