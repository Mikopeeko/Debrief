// Each pull goes to the Whole tier store once (Nov 14, the raid-night rehearsal: opening Wolfthorn's Thu Nov 12 Ula'tek night sent all 13 pulls to
// /api/tier again on every visit, and the Worker rewrote the guild's file each time with the same lines). The page now leaves out a line it already
// sent with the same version, and the Worker writes only lines that changed. contradictions.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function tierSendOnce(H, say) {
  const bad = (m) => say('Whole tier', 'sync', m);
  // 1. the page: a second visit queues nothing that was sent with the same version
  const mem = new Map(), store = { get: (k) => (mem.has(k) ? mem.get(k) : null), set: (k, v) => mem.set(k, String(v)) };
  const queued = []; let o;
  const it = (f) => ({ kind: 'boss', id: 3492, diffId: 16, gid: 772787, wcl: { code: 'Gax3AkbyFRXmdrgQ', fight: f } });
  try {
    o = H.site(['TIER_SENT_K', 'tierSent', 'tierMarkSent', 'TQ', 'tierWork'], { store, TIER: { k: '' }, tierSumOf: (r) => ({ c: r.item.wcl.code, f: r.item.wcl.fight, k: 'eggs', n: 'Eggs', rc: '', u: 0, dd: 3, v: 'abc123' }),
      tierKeyOf: () => ({ g: 772787, e: 3492, d: 5 }), tierQs: () => 'g=772787&e=3492&d=5', tierQueue: (tk, l) => queued.push(...l), tierSoon: () => {} });
  } catch (e) { bad('the page no longer remembers which pulls it sent (tierSent / tierMarkSent): ' + e.message); return; }
  const fights = [11, 12, 13, 23];
  o.TQ.held.push(...fights.map((f) => ({ item: it(f) }))); o.tierWork();
  if (queued.length !== 4) bad('a first visit should send the night\'s 4 test pulls, sent ' + queued.length);
  o.tierMarkSent(queued.splice(0)); o.TQ.seen.clear(); /* (a new visit: the page's own memory is new, the browser's stays) */
  o.TQ.held.push(...fights.map((f) => ({ item: it(f) }))); o.tierWork();
  if (queued.length) bad('a second visit sent ' + queued.length + ' pulls the store already has (Nov 12 Ula\'tek night: all 13 went again on every visit)');
  if (!/if \(r && r\.ok\) tierMarkSent\(b\)/.test(H.UI)) bad('a pull is marked sent before the site said it kept it');
  // 2. the Worker: nothing written when the lines are the same
  const W = fs.readFileSync(path.join(__dirname, '..', 'src', 'worker_template.js'), 'utf8');
  let tc; try { tc = require('vm').runInNewContext(H.grab('tierChanged', W) + '\ntierChanged'); } catch (e) { bad('the Worker no longer skips unchanged lines (tierChanged): ' + e.message); return; }
  const line = { k: 'eggs', n: 'Eggs', rc: 'eggs', u: 0, dd: 3, v: 'abc123' };
  if (tc({ 'G:23': { ...line, at: 1 } }, { 'G:23': { ...line, at: 2 } }).length) bad('the Worker rewrites a pull whose line is the same (only its time differs)');
  if (tc({ 'G:23': { ...line } }, { 'G:23': { ...line, dd: 4 } }).join() !== 'G:23' || tc({}, { 'G:22': line }).join() !== 'G:22') bad('the Worker drops a changed or new pull');
  if (!/const ch = tierChanged\(doc\.c, add\); if \(!ch\.length\) return json/.test(W)) bad('the Worker\'s /api/tier POST no longer asks tierChanged before it writes');
};
