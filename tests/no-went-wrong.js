// "Went wrong" never shows on the site, the Companion app, the addon, the bot or the patch notes (Flex, Oct 24: "I genuinely hate this phrasing",
// then "still doing this went wrong shit, I cannot stand it!!!!"). It came back on Nov 14: the new Mythic+ pull card (f3bfea72) had a "What went
// wrong" heading and "Nothing went wrong in this pull.", and the patch notes repeated it.
// This reads every source file people see text from and fails on "went wrong" anywhere outside a code comment. Allowed: the parts of a pattern
// that strips the phrase from old text ("(?:went wrong|failed)"), and the Ask Debrief AI's instruction never to write it.
// contradictions.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function noWentWrong(say) {
  const root = path.join(__dirname, '..'), files = [];
  const add = (dir, re) => { try { for (const f of fs.readdirSync(path.join(root, dir))) if (re.test(f)) files.push(path.join(dir, f)); } catch (e) { /* (no folder) */ } };
  add('src', /\.(js|html)$/); add('companion', /\.(js|html|lua)$/); add('addon', /\.lua$/);
  const allowed = (line, i) => /\(\?:\s*$/.test(line.slice(Math.max(0, i - 4), i)) || /\|\s*$/.test(line.slice(Math.max(0, i - 2), i)) || /[Nn]ever (write )?\\?["']?$/.test(line.slice(Math.max(0, i - 16), i));
  const found = [];
  for (const rel of files) {
    let txt; try { txt = fs.readFileSync(path.join(root, rel), 'utf8'); } catch (e) { continue; }
    const lines = txt.split('\n'); let inBlock = false, inHtml = false;
    lines.forEach((line, n) => {
      // (the parts of this line that are comments: a /* */ or <!-- --> block, possibly open from an earlier line, or a // to the end of the line)
      const cm = new Array(line.length + 1).fill(false); let j = 0;
      while (j < line.length) {
        if (inBlock) { const e = line.indexOf('*/', j); const end = e < 0 ? line.length : e + 2; for (let k = j; k < end; k++) cm[k] = true; if (e < 0) break; inBlock = false; j = end; continue; }
        if (inHtml) { const e = line.indexOf('-->', j); const end = e < 0 ? line.length : e + 3; for (let k = j; k < end; k++) cm[k] = true; if (e < 0) break; inHtml = false; j = end; continue; }
        if (line.startsWith('/*', j)) { inBlock = true; continue; }
        if (line.startsWith('<!--', j)) { inHtml = true; continue; }
        if (line.startsWith('//', j) && (j === 0 || /[\s;,)}\]]/.test(line[j - 1])) && !/['"`]\s*$/.test(line.slice(0, j)) ) { for (let k = j; k < line.length; k++) cm[k] = true; break; }
        if (line.startsWith('--', j) && rel.endsWith('.lua')) { for (let k = j; k < line.length; k++) cm[k] = true; break; }
        j++;
      }
      const re = /went wrong/gi; let m;
      while ((m = re.exec(line))) if (!cm[m.index] && !allowed(line, m.index)) found.push(rel.replace(/\\/g, '/') + ':' + (n + 1) + ' "' + line.slice(Math.max(0, m.index - 30), m.index + 40).trim() + '"');
    });
  }
  if (found.length) say('the page code', 'wording', '"went wrong" shows in ' + found.length + ' place(s) (Flex\'s rule since Oct 24: never; say what happened, or Mistakes): ' + found.slice(0, 6).join(' · '));
};
