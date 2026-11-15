// The 10 am #patch-notes post said "0 improvements and 0 fixes" every day.
// Found in the quiet-bug hunt (Nov 15, overnight). The bot's newestNotes (src/worker_template.js) counted the lines of a day's
// n: [...] (Improvements) and f: [...] (Bug fixes) lists by looking for lines that start with 4 spaces and a quote. Since Nov 5 each
// day in PATCH_NOTES (src/ui.js) is written on one line, so it found none. Now notesCount counts the strings in each list.
// This check takes the bot's own newestNotes (and notesCount, when there is one) out of src/worker_template.js by text markers,
// runs it on the real src/ui.js text, and compares its numbers with PATCH_NOTES itself, read for real in a vm, for the newest four days.
// It also runs a tiny made-up day: a ']' and an escaped quote inside a line, and a double-quoted line, on one line and on many.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function quietPatchPostCounts(say, H) {
  const where = 'patch notes post';
  if (!H) H = require('./site-helpers.js');
  const W = fs.readFileSync(path.join(__dirname, '..', 'src', 'worker_template.js'), 'utf8');
  const UI = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');
  // (a top-level function, from "function name(" to the first "}" alone on a line; a brace count would trip on the "\{" in newestNotes' regex)
  const cut = (name) => { const a = W.indexOf('\nfunction ' + name + '('); if (a < 0) return ''; const b = W.indexOf('\n}\n', a); return b < 0 ? '' : W.slice(a + 1, b + 2); };
  const code = cut('notesCount') + '\n' + cut('newestNotes');
  if (!/function newestNotes\(/.test(code)) { say(where, 'quiet bug', 'the bot has no newestNotes any more, so this check cannot read the morning post'); return; }
  const make = (APP_HTML) => vm.runInNewContext(code + '\nnewestNotes', { APP_HTML });
  const dayAfter = (d) => new Date(Date.parse(d + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10);
  const compare = (label, APP, days) => {
    let newestNotes; try { newestNotes = make(APP); } catch (e) { say(where, 'crash', label + ': the post code would not load: ' + e.message); return; }
    for (const day of days) {
      let p; try { p = newestNotes(dayAfter(day.d)); } catch (e) { say(where, 'crash', label + ' ' + day.d + ': the post code crashed: ' + e.message); continue; }
      if (!p || p.d !== day.d) { say(where, 'quiet bug', label + ' ' + day.d + ': the morning post finds ' + (p ? p.d : 'no day') + ' instead of that day'); continue; }
      const n = (day.n || []).length, f = (day.f || []).length, feats = (day.h || []).map((x) => x.t).join(' | ');
      if (p.n !== n || p.f !== f) say(where, 'quiet bug', label + ' ' + day.d + ': the morning post counts Improvements ' + p.n + ', Bug fixes ' + p.f + '; the day has ' + n + ' and ' + f);
      if (p.feats.join(' | ') !== feats) say(where, 'quiet bug', label + ' ' + day.d + ': the morning post names the new features "' + p.feats.join(' | ') + '", the day has "' + feats + '"');
    }
  };
  // 1. the real patch notes: the newest four days
  let P = null; try { P = vm.runInNewContext(H.grab('PATCH_NOTES') + '\nPATCH_NOTES'); } catch (e) { say(where, 'crash', 'PATCH_NOTES in src/ui.js could not be read: ' + e.message); }
  if (Array.isArray(P)) {
    const days = P.filter((d) => d && /^\d{4}-\d\d-\d\d$/.test(d.d)).slice(0, 4);
    if (!days.some((d) => (d.n || []).length + (d.f || []).length)) say(where, 'quiet bug', 'the newest patch notes days have no improvements or fixes to count, so this check proves nothing');
    compare('patch notes', UI, days);
  }
  // 2. a made-up day with the hard cases, on one line (since Nov 5) and on many lines (before)
  const FAKE = 'const PATCH_NOTES = [\n' +
    "  { d: '2026-12-02', t: 'A test day', h: [{ t: 'A big new thing', d: 'Words [with brackets] in it.' }], n: ['Graphs: a ] inside a line.', 'It\\'s fixed [again].', \"Ula'tek's beam line.\"], f: ['One fix.', \"A \\\"quoted\\\" fix ] here.\"] },\n" +
    "  { d: '2026-12-01', n: [\n    'Old style line one.',\n    \"Old style line two's.\",\n    'Old style [line] three.',\n  ], f: [\n    'Old style fix.',\n  ] },\n" +
    '];\n';
  let FP = null; try { FP = vm.runInNewContext(FAKE.replace('const PATCH_NOTES = ', '(').replace(/;\n$/, ')')); } catch (e) { say(where, 'crash', 'the made-up patch notes day would not read: ' + e.message); }
  if (Array.isArray(FP)) compare('made-up day', FAKE, FP);
};
