// Summary, how it looks (Nov 17, Flex: "ok go for it", of the marked mock-up; round 1 of 2: the looks only). It fails if How it went goes back to "P2"
// on every row with no phase label, the root cause takes two rows again, every row wears the same red tag again (deaths read "Serious" beside the
// root cause), ▶ Watch disappears or stops opening Replay at its second, the old root row is taken out of the page (every count reads it), or the
// "No NSRT note" box is a box again. contradictions.js runs it on every build. Each part fails on the Replay tab's commit.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function summaryLook(say) {
  const bad = (m) => say('Summary', 'how it looks, Nov 17', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src: ' + e.message); return; }
  const has = (t, why, src) => { if ((src || s).indexOf(t) < 0) bad(why); };
  has('function smDisplay()', 'the How it went display pass is gone');
  has("want.set(box, smPhaseName(ch));", 'How it went lost its phase label'); has("if (!(pv && pv.classList.contains('sm-ph') && pv.textContent === txt))", 'the phase labels are taken out and put back on every pass again, which kept the page redrawing (380 changes in 4 s)');
  has('.dbt-why .dbt-chn .dbt-chp { display: none !important; }', '"P2" shows on every row again', css);
  has("if (!prev.classList.contains('sm-root')) prev.classList.add('sm-root'); if (!root.classList.contains('sm-hid')) root.classList.add('sm-hid');", 'the root cause takes two rows again');
  if (/root\.remove\(\)|sm-hid[^;]*remove\(\)/.test(s.slice(s.indexOf('function smDisplay()'), s.indexOf('function smDisplay()') + 6000))) bad('the old root row is taken out of the page, so the counts that read it change');
  has(".dbt-chr:not(.sm-root) .dbt-lv.l5::after { content: 'Death';", 'deaths wear the red Serious tag again', css);
  has(".dbt-chr.sm-root .dbt-lv::after { content: 'Root cause';", 'the root cause lost its red tag', css);
  has('box._jumpTo(null, at);', '▶ Watch can no longer jump the replay to its second'); has('box._jumpTo = function (k, t, pre) {', 'the replay lost the jump ▶ Watch uses');
  has("const smWatch = (t) => { const tab = document.querySelector('.tabbar .tab[data-t=\"replay\"]');", '▶ Watch no longer opens the Replay tab');
  has('<span class="sm-watch" role="button" tabindex="0" data-smt="', 'How it went lost its ▶ Watch buttons');
  has('.dbn-bar.dbn-add { background: none !important; border: 0 !important;', 'the "No NSRT note" box is a box again', css);
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Summary look, Nov 17: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
