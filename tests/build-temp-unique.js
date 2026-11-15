// Two builds at once broke each other (the Mythic+ Rotation chat, Nov 14: its practice page came out cut at 3 MB and hung on "Downloading the
// site"). build.ps1 wrote the page to strip its comments through fixed files in %TEMP% (debrief-site-in.html / debrief-site-out.html, and
// debrief-worker-check.mjs), so a second build overwrote or deleted the first one's file mid-way. Each build now names its own (with its process id).
// This fails if build.ps1 writes a fixed-name file in %TEMP% again. contradictions.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function buildTempUnique(say) {
  const bad = (m) => say('the build', 'temp files', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'build.ps1'), 'utf8'); } catch (e) { bad('could not read src/build.ps1'); return; }
  const fixed = s.match(/Join-Path \$env:TEMP '[^']+'/g);
  if (fixed) bad('build.ps1 writes fixed-name files in %TEMP% (' + fixed.join(', ') + '), so two builds at once break each other; name them with $PID');
  if (!/debrief-site-in-' \+ \$PID/.test(s) || !/debrief-site-out-' \+ \$PID/.test(s)) bad('build.ps1 no longer names its comment-stripping files with its process id');
};
