// The #kill-feed could lose a guild's first Mythic kill for good.
// Found in the quiet-bug hunt (Nov 15, overnight). The bot's runKillFeed (src/worker_template.js) marked a guild's newest report as
// read (g.seen) before it read the report's fights, and marked each boss as done (g.done) before it posted the kill. So when the
// Warcraft Logs read failed (a rate limit, a timeout) or the Discord post failed, the next run skipped that report, and the kill
// was never posted. Now the report is marked read only after its kills are posted, and each boss is marked done only after its post.
// This check takes the bot's own runKillFeed out of src/worker_template.js by text markers and runs it in a vm against a made-up
// Warcraft Logs, Discord and KV: a failed fights read, a failed post, and a failed second post must each still post every kill, once.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function quietKillfeed(say) {
  const where = 'kill feed';
  const W = fs.readFileSync(path.join(__dirname, '..', 'src', 'worker_template.js'), 'utf8');
  // (from "async function runKillFeed(" to the first "}" alone on a line: a brace count would trip on regexes elsewhere in the file)
  const a = W.indexOf('\nasync function runKillFeed('), b = a < 0 ? -1 : W.indexOf('\n}\n', a);
  if (b < 0) { say(where, 'quiet bug', 'the bot has no runKillFeed any more, so this check cannot run the kill feed'); return; }
  const code = W.slice(a + 1, b + 2);
  const BOSS_A = { encounterID: 3001, name: 'The Coiled Altar' }, BOSS_B = { encounterID: 3002, name: 'Ula\'tek' };
  // (a finished raid report: a wipe and a kill on the first boss, a one-pull kill on the second, and a Heroic kill that must not post)
  const fightsOf = (two) => [
    { id: 4, ...BOSS_A, difficulty: 5, kill: false, startTime: 0, endTime: 300000 },
    { id: 5, ...BOSS_A, difficulty: 5, kill: true, startTime: 400000, endTime: 700000 },
    { id: 6, encounterID: 3003, name: 'A Heroic boss', difficulty: 4, kill: true, startTime: 800000, endTime: 900000 },
  ].concat(two ? [{ id: 7, ...BOSS_B, difficulty: 5, kill: true, startTime: 1000000, endTime: 1300000 }] : []);
  function world(opts) {
    const kv = new Map([['killfeed', JSON.stringify([{ id: 1, name: 'Test Guild', by: 'x', seen: 'OLD:50', done: [] }])]]);
    const posts = []; let readFails = opts.readFails || 0, sayCalls = 0;
    const ctx = vm.createContext({
      console: { warn() {}, log() {} }, TEAM_LATEST_Q: 'TEAM_LATEST_Q', KILLS_Q: 'KILLS_Q', SITE: 'https://debriefme.io',
      mss: (ms) => Math.floor(ms / 60000) + ':00', kfChannel: async () => 'kill-feed',
      say: async (env, ch, text) => { sayCalls++; if ((opts.sayFailsOn || []).includes(sayCalls)) throw new Error('Discord answered 503'); posts.push(text); },
      gql: async (env, q, v) => {
        if (q === 'TEAM_LATEST_Q') return { reportData: { reports: { data: [{ code: 'NEW', endTime: 100 }, { code: 'OLD', endTime: 50 }] } } };
        if (q === 'KILLS_Q') { if (readFails > 0) { readFails--; throw new Error('Warcraft Logs is rate limiting this site right now.'); } return { reportData: { report: { code: v.code, fights: fightsOf(opts.two) } } }; }
        throw new Error('an unexpected Warcraft Logs question');
      },
    });
    vm.runInContext(code, ctx);
    const env = { DEBRIEF_KV: { get: async (k, t) => (kv.has(k) ? (t === 'json' ? JSON.parse(kv.get(k)) : kv.get(k)) : null), put: async (k, v) => { kv.set(k, v); }, delete: async (k) => { kv.delete(k); } } };
    return { run: (now) => ctx.runKillFeed(env, now), posts, kv };
  }
  const T0 = Date.UTC(2026, 10, 12, 4, 0), HALF = 30 * 60000; // (the feed runs in the first 10 minutes of each half hour)
  const count = (posts, boss) => posts.filter((p) => p.includes('Mythic ' + boss.name + '**')).length;
  const three = async (w) => { await w.run(T0); await w.run(T0 + HALF); await w.run(T0 + 2 * HALF); return w.posts; };
  return (async () => {
    // 1. the fights read fails once: the next run still posts the kill
    { const posts = await three(world({ readFails: 1 }));
      if (count(posts, BOSS_A) !== 1) say(where, 'quiet bug', 'when Warcraft Logs fails to answer once, a first Mythic kill is posted ' + count(posts, BOSS_A) + ' times over the next runs, not once'); }
    // 2. the Discord post fails once: the next run still posts the kill, and only once
    { const posts = await three(world({ sayFailsOn: [1] }));
      if (count(posts, BOSS_A) !== 1) say(where, 'quiet bug', 'when the Discord post fails once, a first Mythic kill is posted ' + count(posts, BOSS_A) + ' times over the next runs, not once'); }
    // 3. two kills in one report, the second post fails: the next run posts only the second
    { const posts = await three(world({ two: true, sayFailsOn: [2] }));
      if (count(posts, BOSS_A) !== 1 || count(posts, BOSS_B) !== 1) say(where, 'quiet bug', 'when the second of two kill posts fails, the kills are posted ' + count(posts, BOSS_A) + ' and ' + count(posts, BOSS_B) + ' times, not once each'); }
    // 4. nothing fails: one post, the report marked read, the boss marked done, the Heroic kill left out
    { const w = world({}), posts = await three(w), g = JSON.parse(w.kv.get('killfeed') || '[{}]')[0];
      if (posts.length !== 1 || count(posts, BOSS_A) !== 1) say(where, 'quiet bug', 'a clean report posts ' + posts.length + ' kill(s) over three runs, not one');
      else if (!/Pull 2 tonight/.test(posts[0])) say(where, 'quiet bug', 'the kill post no longer says it was pull 2: ' + posts[0].split('\n')[0]);
      if (g.seen !== 'NEW:100' || !(g.done || []).includes(BOSS_A.encounterID)) say(where, 'quiet bug', 'after a clean run the report is not marked read or the boss not marked done (' + JSON.stringify(g) + ')'); }
  })().catch((e) => say(where, 'crash', 'the kill feed crashed in this check: ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')));
};
