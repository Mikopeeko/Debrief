// The Discord bot's morning digest in #moderator-only was lost for the whole day when one post failed.
// Found in the quiet-bug hunt (Nov 15, overnight). The code dates from the bot's first day (Oct 20, be6eab93).
// runDigest in src/worker_template.js marked the day's digest as sent (KV dc-digest) before it posted. One Discord hiccup at
// 14:00 UTC, and the runs at 14:10 to 14:50 saw "sent" and skipped it, so there was no digest that day and no sign of why.
// Now the day is marked only after the post goes through, so the next run that hour tries again.
// This check takes the Worker's own runDigest (and its say) out of src/worker_template.js by name and runs it against a pretend
// Discord and KV: the post fails once at 14:00 UTC, the 14:10 run must post it and mark the day, and the 14:20 run must not post again.
// The code is async, so it runs in a child Node process and this check waits for it (about 0.1 s): every problem is in before the
// runner prints. quiet-bugs.js runs it (contradictions.js, every build).
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
module.exports = function quietDigest(say, H) {
  const bad = (m) => say('the Discord bot', 'morning digest', m);
  let code;
  try {
    const W = fs.readFileSync(path.join(__dirname, '..', 'src', 'worker_template.js'), 'utf8');
    const W2 = W.replace(/(^|\n)async function /g, '$1function '); /* (H.grab reads plain functions; async is put back below) */
    const grab = H && typeof H.grab === 'function' ? H.grab : require('./site-helpers.js').grab;
    const names = ['say', 'runDigest'];
    code = names.map((n) => (new RegExp('(^|\\n)async function ' + n + '\\b').test(W) ? 'async ' : '') + grab(n, W2)).join('\n') + '\n({ ' + names.join(', ') + ' })';
  } catch (e) { bad('could not read the morning digest (runDigest) out of src/worker_template.js: ' + e.message); return; }
  const r = cp.spawnSync(process.execPath, ['-e', '(' + child.toString() + ')()'], { input: code, encoding: 'utf8', timeout: 20000, windowsHide: true });
  let out = null; try { out = JSON.parse(String(r.stdout || '').trim().split('\n').pop()); } catch (e) { /* (below) */ }
  if (!Array.isArray(out)) { bad('the morning digest check could not run: ' + String(r.stderr || (r.error && r.error.message) || 'no answer').trim().slice(0, 300)); return; }
  for (const m of out) bad(m);
};

// (runs in the child process: the Worker's code comes in on stdin; prints one JSON line, the list of problems)
function child() {
  const vm = require('vm'), code = require('fs').readFileSync(0, 'utf8');
  (async () => {
    const P = [], kv = new Map(); let posts = 0, fails = 1;
    const env = { DEBRIEF_KV: { get: async (k, t) => (kv.has(k) ? (t === 'json' ? JSON.parse(kv.get(k)) : kv.get(k)) : null),
      put: async (k, v) => { kv.set(k, String(v)); }, delete: async (k) => { kv.delete(k); } } };
    const dc = async (e, p, q = {}) => {
      if (p === '/guilds/G/channels') return [{ id: 'M', name: 'moderator-only' }];
      if (p === '/channels/M/messages' && q.method === 'POST') { if (fails > 0) { fails--; throw new Error('Discord answered 503 on ' + p); } posts++; return {}; }
      return {};
    };
    const ctx = vm.createContext({ console: { warn() {}, log() {}, error() {} }, dc, GUILD: 'G', FORUM_BUGS: 'FB', FORUM_IDEAS: 'FI', FORUM_QS: 'FQ', snowAt: () => 0, alike: () => 0 });
    const o = vm.runInContext(code, ctx), day = '2026-11-15', at = (h, m) => Date.UTC(2026, 10, 15, h, m);
    try { await o.runDigest(env, at(14, 0), []); } catch (e) { /* (the failed post: discordJobs catches it) */ }
    await o.runDigest(env, at(14, 10), []);
    if (posts !== 1) P.push('when the 14:00 UTC post fails, the 14:10 run should post the morning digest, it posted ' + posts + ' (the day\'s digest is lost)');
    if (kv.get('dc-digest') !== day) P.push('once the morning digest is posted, the day should be marked as sent (dc-digest is ' + JSON.stringify(kv.get('dc-digest') || null) + ')');
    await o.runDigest(env, at(14, 20), []);
    if (posts > 1) P.push('the morning digest is posted ' + posts + ' times in one day');
    console.log(JSON.stringify(P));
  })().catch((e) => { console.log(JSON.stringify(['the morning digest check crashed: ' + e.message])); });
}
