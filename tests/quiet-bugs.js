// The quiet-bug hunt (Nov 15, overnight): code on the site that quietly did nothing (an error nobody saw, or code that never ran).
// Each bug fixed that night has its own check, tests/quiet-<name>.js, which fails on the old code and passes on the fixed code and says
// which bug it guards and how it was found. This file runs all of them; contradictions.js runs this file on every build.
// A check exports function (say, H): say(where, kind, message) reports a problem; H is tests/site-helpers.js (the page's own code, for checks that run it).
// A check may return a promise (one that runs the page's async code); this returns a promise that settles when every check has, so
// contradictions.js waits for it before it prints.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function quietBugs(say, H) {
  const files = fs.readdirSync(__dirname).filter((f) => /^quiet-.+\.js$/.test(f) && f !== 'quiet-bugs.js').sort(), wait = [];
  const crash = (f, e) => say('the page code', 'crash', 'tests/' + f + ' crashed: ' + String((e && (e.stack || e.message)) || e).split('\n').slice(0, 3).join(' | '));
  for (const f of files) {
    try { const fn = require(path.join(__dirname, f)); if (typeof fn !== 'function') { say('the page code', 'quiet bug', 'tests/' + f + ' exports no check'); continue; } const r = fn(say, H); if (r && typeof r.then === 'function') wait.push(Promise.resolve(r).catch((e) => crash(f, e))); }
    catch (e) { crash(f, e); }
  }
  return Promise.all(wait).then(() => files.length);
};
if (require.main === module) { const P = []; module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c), (() => { try { return require('./site-helpers.js'); } catch (e) { return null; } })()).then((n) => { console.log(P.length ? P.join('\n') : 'quiet bugs: ' + n + ' check(s), all pass'); process.exitCode = P.length ? 1 : 0; }); }
