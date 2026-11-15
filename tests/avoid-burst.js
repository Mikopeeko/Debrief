// Avoidable damage lines and the death recap count the same hits (Nov 14, raid-night rehearsal; Wolfthorn Thu Nov 12 Ula'tek pull 13 = Gax3AkbyFRXmdrgQ fight 23).
// Raiyvenz's line read "Hit by Caustic Waves twice (1.7M) and died to it." while his death read "You: 3 Caustic Waves hits right before you died". The log has 4 wave hits:
// 0:43.5, then three waves from one tail at 1:03.8, 1:04.0 and 1:04.1 (his poison went to 2 stacks; the third killed him). The panel counts hits under 1.5 s apart as one time
// (the top raids' lines were measured that way), so the line keeps "twice" and must say the last time was 3 hits at once: the number the raw log has in that burst.
// Run by tests/contradictions.js on every build; without the log library it passes.
'use strict';
module.exports = function (o) {
  const { H, E, W, say, report, findFile, readJ } = o, code = 'Gax3AkbyFRXmdrgQ', fight = 23, where = "Wolfthorn Thu Nov 12 Ula'tek pull 13";
  const rep = report(code), ef = findFile(code + '_' + fight + '.json'); if (!rep || !ef || !rep.items.get(fight)) return 0;
  const it = rep.items.get(fight); let ev = readJ(ef); if (!Array.isArray(ev)) ev = ev.events;
  const txt = W.translate(it, ev); ev = null; const r = E.analyze(it, txt, {}); if (!r.item) r.item = it;
  // (from the log itself: each direct Caustic Waves hit (not the poison's ticks) on each player, in seconds from the pull's start)
  const t0 = (() => { const m = /^\S+ (\d+):(\d+):(\d+\.\d+)/.exec(txt); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0; })(), raw = new Map();
  const re = /^\S+ (\d+):(\d+):(\d+\.\d+)\S*\s+SPELL_DAMAGE,[^,]*,"[^"]*",[^,]*,[^,]*,[^,]*,"([^"]*)",[^,]*,[^,]*,1292403,/gm; let m;
  while ((m = re.exec(txt))) { const k = m[4].split('-')[0]; if (!raw.has(k)) raw.set(k, []); raw.get(k).push(+m[1] * 3600 + +m[2] * 60 + +m[3] - t0); }
  // (the burst a player died in: the direct hits chained under 1.5 s apart, ending at the death)
  const burst = (p, dt) => { const ts = (raw.get(p) || []).filter((t) => t <= dt + 0.1).sort((a, b) => a - b); let n = 0; for (let i = ts.length - 1; i >= 0; i--) { if (i < ts.length - 1 && ts[i + 1] - ts[i] > 1.5) break; n++; } return n; };
  let n = 0;
  for (const x of r.mistakes.filter((q) => q.avoidRule && q.mechanic === 'Caustic Waves' && /and died to it/.test(q.detail || ''))) {
    const p = String(x.player).split('-')[0], d = (r.deaths || []).find((y) => String(y.player).split('-')[0] === p && Math.abs(y.t - x.t) <= 1.5); if (!d) continue; n++;
    const b = burst(p, d.t), said = +((/\b(\d+) hits at once\b/.exec(x.detail) || [])[1] || 1);
    if (b > 1 && said !== b) say(where, 'count', p + ': "' + x.detail + '", but the log has ' + b + ' Caustic Waves hits at once as they died at ' + E.fmtT(d.t) + ' (the death recap counts them)');
  }
  const ry = r.mistakes.find((q) => q.avoidRule && q.mechanic === 'Caustic Waves' && /^Raiyvenz/.test(q.player));
  if (!ry) say(where, 'avoid', 'Raiyvenz has no Caustic Waves line at 1:04 any more');
  else if (!/^Hit by Caustic Waves twice \(1\.7M, 3 hits at once the last time\) and died to it\.$/.test(ry.detail)) say(where, 'count', 'Raiyvenz\'s Caustic Waves line reads "' + ry.detail + '"; it should say twice, with 3 hits at once the last time (his death recap: 3 Caustic Waves hits right before he died)');
  return n;
};
