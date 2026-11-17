// The Replay tab (Nov 17, Flex: "i thnk we should move the replay into its own tab, called replay. Keep the summary overview the default for summary").
// It fails if: Replay stops being its own tab right after Summary; Summary can open on the replay again (it opened on the Timeline unless you had
// picked Overview once); the Timeline / Overview switch comes back on Summary; the Replay tab shows Summary's parts (Why we wiped, the scores, the
// note bar); a link, Back or the tab bar loses which of the two you were on; or Replay can be picked on All pulls (there's no replay of a night).
// contradictions.js runs it on every build. Each part fails on 3573699b.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function replayTab(say) {
  const bad = (m) => say('Raid review', 'the Replay tab, Nov 17', m);
  let s, css, sn; try { const rd = (f) => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'); s = rd('ui.js'); css = rd('shell.html'); sn = rd('sidenav.js'); } catch (e) { bad('could not read src: ' + e.message); return; }
  const has = (t, why, src) => { if ((src || s).indexOf(t) < 0) bad(why); };
  const ord = (s.match(/const TAB_ORDER = (\[[^\]]*\])/) || [])[1] || '';
  if (!/^\['audit', 'replay',/.test(ord)) bad('Replay is no longer its own tab right after Summary (TAB_ORDER is ' + ord + ')');
  has("['replay', 'Replay']", 'the Replay tab lost its name');
  has("var pv = document.documentElement.dataset.rv === 'replay' ? 'tl' : 'full';", 'Summary can open on the replay again, not its Overview');
  if (/var pv = '';\s*try \{ pv = localStorage\.getItem\('wla-dbt-view'\)/.test(s)) bad('Summary goes back to the last layout picked, so it can open on the replay');
  has('html:not([data-rv="replay"]) body #view#view section.dbt > .dbt-vt { display: none !important; }', 'the Timeline / Overview switch is back on Summary', css);
  for (const p of ['> .r212-sb.r212-sb', 'section.dbt > .dbt-note', 'section.dbt > .dbt-why', 'section.dbt > .dbt-vt']) if (css.indexOf('html[data-rv="replay"] body #view#view ' + p) < 0) bad('the Replay tab shows Summary\'s ' + p + ' again');
  has("const rvNorm = () => { if (S.tab === 'replay') { S.tab = 'audit'; S.dview = 'replay'; }", 'a link or Back to Replay no longer opens the replay');
  has('function renderMain() { rvNorm();', 'the page no longer works out Summary or Replay before it draws');
  has("tab: S.tab === 'audit' && S.dview === 'replay' && S.scope !== 'all' ? 'replay' : S.tab,", 'the address no longer says tab=replay on the Replay tab, so a shared link opens Summary');
  has("S.tab = b.dataset.t; if (S.tab === 'audit') S.dview = 'sum'; renderMain();", 'clicking Summary can land on the replay');
  has("(k === 'replay' && S.scope === 'all')", 'Replay can be picked on All pulls, where there is no replay');
  if (/<kbd>5<\/kbd> sub tabs/.test(sn)) bad('the keys hint still says 1 to 5 sub tabs with six tabs');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Replay tab, Nov 17: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
