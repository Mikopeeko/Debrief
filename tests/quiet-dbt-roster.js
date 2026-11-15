// Summary's Debriefing timeline (Why we wiped, How it went, the moment cards): names from the pull's whole roster in class colour
// (quiet-bug hunt, Nov 15, overnight).
// The bug: the roster list (var ROS, from commit ad959c69, Nov 8, Flex: "Caused by Boltzzx", "one of A or B") read the page state S,
// but the timeline runs after the end of ui.js's closure, where S doesn't exist. "S is not defined" was caught and ROS came back empty
// every time, so a name in a sentence that wasn't in that row's own player list stayed plain grey (for example "Phartsy died to Putrid
// Membrane." on Wolfthorn's Thu Nov 12 Ula'tek pull 23). Found in the overnight hunt for code that quietly did nothing.
// The fix reads the roster through window.dbtMapKit().S, the bridge the closure already puts on window.
// This cuts the timeline's own ROS, col and chips() lines out of src/ui.js by their text, runs them at the page's top level (no S,
// only window.dbtMapKit) with a two-player roster, and expects a name that is only in the roster to come back as a coloured chip.
// tests/quiet-bugs.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function quietDbtRoster(say, H) {
  const bad = (m) => say('Summary', 'class-coloured names', m);
  let ui; try { ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'); } catch (e) { bad('could not read src/ui.js'); return; }
  let grab; try { grab = (H && H.grab) || require(path.join(__dirname, 'site-helpers.js')).grab; } catch (e) { bad('could not load tests/site-helpers.js: ' + e.message); return; }
  const a = ui.indexOf('var ROS = (function () {'), c = a < 0 ? -1 : ui.indexOf('var chips = function (html, who) {', a);
  if (a < 0 || c < 0 || c - a > 3000) { bad('could not find the Debriefing timeline\'s roster list (var ROS) and its chips() in src/ui.js'); return; }
  let chips; try { chips = grab('chips', ui.slice(c)); } catch (e) { bad('could not read chips() after var ROS in src/ui.js: ' + e.message); return; }
  const block = ui.slice(a, c) + chips; /* (var ROS, var col and chips, as the page has them) */
  if (!/var col = \{\}; ROS\.forEach/.test(block)) { bad('the colour list (var col) no longer sits between var ROS and chips() in src/ui.js'); return; }
  const players = new Map([['p1', { name: 'Jangokin-Wolfthorn', color: '#c41e3a' }], ['p2', { name: 'Komo-Wolfthorn', color: '#c69b6d' }]]);
  const ctx = vm.createContext({ window: { location: { hostname: 'debriefme.io' }, dbtMapKit: () => ({ S: { rep: { players } } }) } }); /* (the page's top level: no S, no closure names) */
  const run = '(function () { var E = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\\"": "&quot;" }[c]; }); };\n' +
    'var M = [{ who: [{ n: "Komo", c: "#c69b6d" }] }];\n' + block + '\nreturn { n: ROS.length, h: chips(E("Jangokin died to Putrid Membrane while Komo watched."), M[0].who) }; })()';
  let out; try { out = vm.runInContext(run, ctx, { timeout: 2000 }); } catch (e) { bad('the Debriefing timeline\'s roster lines crashed at the page\'s top level: ' + e.message); return; }
  if (!out || out.n !== 2 || !String(out.h).includes('<span class="dbt-chip" style="--cc:#c41e3a">Jangokin</span>'))
    bad('In the Debriefing timeline, "Jangokin died to Putrid Membrane" leaves Jangokin grey (roster: ' + (out ? out.n : 0) + ' of 2 players). A name that is only in the pull\'s roster has to be in its class colour: read the roster through window.dbtMapKit().S, not S.');
  if (out && !String(out.h).includes('<span class="dbt-chip" style="--cc:#c69b6d">Komo</span>')) bad('In the Debriefing timeline, Komo (in the row\'s own list) is no longer in his class colour.');
};
if (require.main === module) { const P = []; module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c), (() => { try { return require('./site-helpers.js'); } catch (e) { return null; } })()); console.log(P.length ? P.join('\n') : 'quiet-dbt-roster: pass'); process.exitCode = P.length ? 1 : 0; }
