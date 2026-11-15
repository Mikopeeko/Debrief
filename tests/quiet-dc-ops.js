// The Discord bot's job queue (KV dc-ops) lost every job past the first 20.
// Found in the quiet-bug hunt (Nov 15, overnight). The queue dates from Oct 20 (e67975ee).
// runInbox in src/worker_template.js deleted the whole dc-ops key, then ran only ops.slice(0, 20). Job 21 and up (pings, asks,
// closes, #bug-review posts left by the twice-a-day bug check) were gone with no log line. Now the jobs past 20 are put back in
// dc-ops for the next run.
// This check takes the Worker's own runInbox out of src/worker_template.js by name and runs it against a pretend Discord, GitHub
// and KV: 25 queued jobs, one run, 5 must wait in dc-ops; after three runs all 25 are done once each and the queue is empty.
// The code is async, so it runs in a child Node process and this check waits for it (about 0.1 s): every problem is in before the
// runner prints. quiet-bugs.js runs it (contradictions.js, every build).
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
module.exports = function quietDcOps(say, H) {
  const bad = (m) => say('the Discord bot', 'job queue', m);
  let code;
  try {
    const W = fs.readFileSync(path.join(__dirname, '..', 'src', 'worker_template.js'), 'utf8');
    const W2 = W.replace(/(^|\n)async function /g, '$1function '); /* (H.grab reads plain functions; async is put back below) */
    const grab = H && typeof H.grab === 'function' ? H.grab : require('./site-helpers.js').grab;
    code = (/(^|\n)async function runInbox\b/.test(W) ? 'async ' : '') + grab('runInbox', W2) + '\nrunInbox';
  } catch (e) { bad('could not read the job queue (runInbox) out of src/worker_template.js: ' + e.message); return; }
  const r = cp.spawnSync(process.execPath, ['-e', '(' + child.toString() + ')()'], { input: code, encoding: 'utf8', timeout: 20000, windowsHide: true });
  let out = null; try { out = JSON.parse(String(r.stdout || '').trim().split('\n').pop()); } catch (e) { /* (below) */ }
  if (!Array.isArray(out)) { bad('the job queue check could not run: ' + String(r.stderr || (r.error && r.error.message) || 'no answer').trim().slice(0, 300)); return; }
  for (const m of out) bad(m);
};

// (runs in the child process: runInbox's code comes in on stdin; prints one JSON line, the list of problems)
function child() {
  const vm = require('vm'), code = require('fs').readFileSync(0, 'utf8');
  (async () => {
    const P = [], kv = new Map(), done = [];
    const env = { DEBRIEF_KV: { get: async (k, t) => (kv.has(k) ? (t === 'json' ? JSON.parse(kv.get(k)) : kv.get(k)) : null),
      put: async (k, v) => { kv.set(k, String(v)); }, delete: async (k) => { kv.delete(k); } } };
    const ctx = vm.createContext({ OWNER: 'O', GUILD: 'G', console: { warn() {}, log() {}, error() {} }, closeAgain: async () => {},
      gh: async () => { throw new Error('GitHub is not part of this check'); },
      dc: async (e, p, q) => { if (q && q.method === 'POST' && /^\/channels\/\d+\/messages$/.test(p)) done.push(q.body.content); return {}; } });
    const run = vm.runInContext(code, ctx);
    const t = {}; for (let i = 1; i <= 25; i++) t['1' + String(i).padStart(17, '0')] = i; /* (each job's report has its Discord thread: dc-bugs t maps thread to report) */
    kv.set('dc-bugs', JSON.stringify({ t }));
    kv.set('dc-ops', JSON.stringify(Array.from({ length: 25 }, (_, i) => ({ op: 'ask', issue: i + 1, text: 'job ' + (i + 1) }))));
    await run(env);
    const left = kv.has('dc-ops') ? JSON.parse(kv.get('dc-ops')) : [];
    if (done.length !== 20) P.push('one run should do the first 20 of 25 queued jobs, it did ' + done.length);
    if (left.length !== 5 || !left[0] || left[0].text !== 'job 21') P.push('with 25 jobs queued, jobs 21 to 25 should wait in the queue for the next run, ' + left.length + ' are left (the rest are lost)');
    await run(env); await run(env);
    const seen = new Set(done);
    if (done.length !== 25 || seen.size !== 25) P.push('after three runs all 25 queued jobs should be done once each: ' + done.length + ' done, ' + seen.size + ' different');
    if (kv.has('dc-ops')) P.push('the job queue should be empty once every job is done');
    console.log(JSON.stringify(P));
  })().catch((e) => { console.log(JSON.stringify(['the job queue check crashed: ' + e.message])); });
}
