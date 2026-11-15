// The Discord bot's bug copy could stop the whole ten-minute run, and could copy one post to GitHub over and over.
// Found in the quiet-bug hunt (Nov 15, overnight). The code dates from the bot's first day (Oct 20, be6eab93).
// 1. discordJobs in src/worker_template.js ran runBugs with no .catch, the only job without one. So one failing GitHub call (GitHub
//    down, or the key revoked) stopped every job after it: the kill feed, #questions answers, the bug check's jobs, reminders,
//    welcome messages and the morning digest. The only sign was one "Cron:" line in the Worker's log.
// 2. runBugs saved dc-bugs only at the very end. When the GitHub issue was made but the thank-you reply in the post failed, nothing
//    was saved, so the next run (every minute, with the quick sync) copied the same post to GitHub and #bug-review again.
// Now discordJobs catches runBugs and falls back to the list of open threads, runBugs saves dc-bugs as soon as the issue exists,
// and the thank-you reply has its own .catch.
// This check takes the Worker's own runBugs and discordJobs out of src/worker_template.js by name and runs them against a pretend
// Discord, GitHub and KV. The code is async, so it runs in a child Node process and this check waits for it (about 0.1 s): every
// problem is in before the runner prints. quiet-bugs.js runs it (contradictions.js, every build).
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
module.exports = function quietDiscordJobs(say, H) {
  const bad = (m) => say('the Discord bot', 'ten-minute run', m);
  let code;
  try {
    const W = fs.readFileSync(path.join(__dirname, '..', 'src', 'worker_template.js'), 'utf8');
    const W2 = W.replace(/(^|\n)async function /g, '$1function '); /* (H.grab reads plain functions; async is put back below) */
    const grab = H && typeof H.grab === 'function' ? H.grab : require('./site-helpers.js').grab;
    const names = ['say', 'tagOf', 'AREAS', 'areasIn', 'runBugs', 'discordJobs'];
    code = names.map((n) => (new RegExp('(^|\\n)async function ' + n + '\\b').test(W) ? 'async ' : '') + grab(n, W2)).join('\n') + '\n({ ' + names.join(', ') + ' })';
  } catch (e) { bad('could not read the bug copy (runBugs, discordJobs) out of src/worker_template.js: ' + e.message); return; }
  const r = cp.spawnSync(process.execPath, ['-e', '(' + child.toString() + ')()'], { input: code, encoding: 'utf8', timeout: 20000, windowsHide: true });
  let out = null; try { out = JSON.parse(String(r.stdout || '').trim().split('\n').pop()); } catch (e) { /* (below) */ }
  if (!Array.isArray(out)) { bad('the bug copy check could not run: ' + String(r.stderr || (r.error && r.error.message) || 'no answer').trim().slice(0, 300)); return; }
  for (const m of out) bad(m);
};

// (runs in the child process: the Worker's code comes in on stdin; prints one JSON line, the list of problems)
function child() {
  const vm = require('vm'), code = require('fs').readFileSync(0, 'utf8');
  const LATER = ['runReplies', 'runMentions', 'sweepDone', 'ensureCommands', 'runKillFeed', 'runQuestions', 'runInbox', 'runReminders', 'relink', 'runWelcome', 'runDigest'];
  const WORDS = { runReplies: 'replies', runMentions: '@Claudette answers', sweepDone: 'closing finished posts', ensureCommands: 'the slash commands', runKillFeed: 'the kill feed',
    runQuestions: '#questions answers', runInbox: 'the bug check\'s jobs', runReminders: 'reminders', relink: 'link fixes', runWelcome: 'welcome messages', runDigest: 'the morning digest' };
  const NOW = Date.UTC(2026, 10, 15, 3, 0);
  function world(o) {
    const kv = new Map(), w = { ran: [], lists: [], issues: [], replies: 0, rejected: null, kv };
    kv.set('dc-bugs', JSON.stringify({ t: { old1: 0 }, open: [], fixed: [], ideasSeen: true }));
    const threads = [{ id: 'old1', parent_id: 'FB', name: 'An old post', applied_tags: [] }]
      .concat((o.posts || ['new1']).map((id) => ({ id, parent_id: 'FB', name: 'Graphs show nothing ' + id, applied_tags: [] })));
    w.env = { DISCORD_BOT_TOKEN: 'x', GITHUB_TOKEN: 'x', DEBRIEF_KV: {
      get: async (k, t) => (kv.has(k) ? (t === 'json' ? JSON.parse(kv.get(k)) : kv.get(k)) : null),
      put: async (k, v) => { kv.set(k, String(v)); }, delete: async (k) => { kv.delete(k); } } };
    const dc = async (e, p, q = {}) => {
      if (p === '/guilds/G/threads/active') return { threads };
      if (/^\/channels\/(FB|FI|IR|RF)$/.test(p)) return { available_tags: [] };
      if (/^\/channels\/(new\d)\/messages\/new\d$/.test(p)) return { content: 'the graphs tab is empty on pull 3', author: { username: 'raider' }, attachments: [] };
      if (/\/threads$/.test(p) && q.method === 'POST') return { id: 'rev' + w.issues.length };
      if (/^\/channels\/new\d\/messages$/.test(p) && q.method === 'POST') { if (o.replyFails > 0) { o.replyFails--; throw new Error('Discord answered 503 on ' + p); } w.replies++; return {}; }
      return {};
    };
    const gh = async (e, p, q = {}) => {
      if (p === '/issues' && q.method === 'POST') { if (o.ghDown && o.ghDown(q.body.title)) throw new Error('GitHub answered 503 on /issues'); w.issues.push(q.body.title); return { number: 100 + w.issues.length }; }
      return { state: 'open' };
    };
    const ctx = { console: { warn() {}, log() {}, error() {} }, dc, gh, GUILD: 'G', FORUM_BUGS: 'FB', FORUM_IDEAS: 'FI', IDEA_REVIEW: 'IR', REVIEW_FORUM: 'RF', OWNER: 'O',
      IDEA_ROW: [], REVIEW_ROW: [], SITE: 'https://example.test', ARCH_MS: 4 * 36e5, bugHunter: async () => {} };
    for (const n of LATER) ctx[n] = async (env, a) => { w.ran.push(n); if (n === 'runReplies') w.lists.push(a); };
    w.o = vm.runInContext(code, vm.createContext(ctx));
    w.run = async (times) => { for (let i = 0; i < times; i++) { w.ran.length = 0; try { await w.o.discordJobs(w.env, NOW); } catch (err) { w.rejected = err.message; } } };
    w.quick = async (times) => { for (let i = 0; i < times; i++) { try { await w.o.runBugs(w.env, true); } catch (err) { w.rejected = err.message; } } };
    w.saved = (id) => JSON.parse(kv.get('dc-bugs')).t[id];
    return w;
  }
  const list = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a.join(''));
  (async () => {
    const P = [];
    // 1. GitHub can't make the issue (down, or the key revoked): every other job still runs, with the open threads
    { const w = world({ ghDown: () => true }); await w.run(1);
      const miss = LATER.filter((n) => !w.ran.includes(n));
      if (miss.length) P.push('with GitHub down, the bot\'s ten-minute run stops at the bug copy: ' + list(miss.map((n) => WORDS[n])) + ' never ran');
      else if (!Array.isArray(w.lists[0]) || !w.lists[0].some((t) => t && t.id === 'new1')) P.push('with GitHub down, the jobs after the bug copy no longer get the list of open posts');
      if (w.saved('new1') !== undefined) P.push('a post whose GitHub issue was never made is saved as copied, so it never reaches GitHub'); }
    // 2. the issue is made but the thank-you reply fails once: the next run makes no second issue, and the post after it
    //    is still copied in the same run (ten-minute run)
    { const w = world({ posts: ['new1', 'new2'], replyFails: 1 }); await w.run(1);
      const first = w.issues.length; await w.run(1);
      const n1 = w.issues.filter((t) => /new1/.test(t)).length;
      if (n1 !== 1) P.push('when the thank-you reply fails once, the same post is copied to GitHub ' + n1 + ' times in 2 runs (each copy opens another #bug-review post too)');
      else if (w.saved('new1') !== 101) P.push('when the thank-you reply fails, the post\'s GitHub issue is not saved');
      if (first !== 2) P.push('a failed thank-you reply on one post stops the next new post from reaching GitHub in the same run'); }
    // 2b. the same on the one-minute run (runBugs quick)
    { const w = world({ replyFails: 1 }); await w.quick(2);
      if (w.issues.length !== 1) P.push('on the one-minute run, a failed thank-you reply copies the same post to GitHub ' + w.issues.length + ' times in 2 runs'); }
    // 3. two new posts, GitHub fails on the second: the first is not copied again, the second is copied once GitHub is back
    { let down = true; const w = world({ posts: ['new1', 'new2'], ghDown: (t) => down && /new2/.test(t) }); await w.run(2); down = false; await w.run(1);
      const n1 = w.issues.filter((t) => /new1/.test(t)).length, n2 = w.issues.filter((t) => /new2/.test(t)).length;
      if (n1 !== 1) P.push('a GitHub failure on one new post makes the post before it get copied to GitHub ' + n1 + ' times');
      if (n2 !== 1) P.push('a post whose GitHub copy failed is copied ' + n2 + ' times once GitHub is back (it should be once)'); }
    // 4. nothing fails: one issue, one reply, every job runs
    { const w = world({}); await w.run(2);
      if (w.issues.length !== 1 || w.replies !== 1) P.push('on a normal run a new post should get one GitHub issue and one reply, it got ' + w.issues.length + ' and ' + w.replies);
      const miss = LATER.filter((n) => !w.ran.includes(n)); if (miss.length) P.push('on a normal run ' + list(miss.map((n) => WORDS[n])) + ' never ran'); }
    console.log(JSON.stringify(P));
  })().catch((e) => { console.log(JSON.stringify(['the bug copy check crashed: ' + e.message])); });
}
