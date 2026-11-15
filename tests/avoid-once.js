// Avoidable damage lines read right for one hit and for many (Nov 15; found by the Nov 14 raid-night rehearsal on Wolfthorn's Thu Nov 12 Ula'tek night).
// The bug: a player hit one time only, by a burst of waves, read "Hit by Caustic Waves once (1.2M, 3 hits at once) and died to it.": "once" and "3 hits" in one line.
// Hits under 1.5 s apart count as one time (avoid-burst.js has why), so one time that was a burst drops "once":
// "Hit by Caustic Waves (1.2M, 3 hits at once) and died to it.", the shape the big-hit lines already had. One plain hit keeps "once"; two times or more keep
// "3 hits at once the last time". A first try, "Hit by 3 Caustic Waves hits at once (1.2M)", made the Report card's summary (mechGist) read
// "Got hit by 3 Caustic Waves hits." and split it from the same player's plain hits, so the summary is checked here too.
// It runs the engine's own avoidMistakes on made-up players and the page's own mechGist, so it needs no log library. Run by tests/contradictions.js on every build.
'use strict';
module.exports = function (o) {
  const { E, H, say } = o, where = 'avoidable damage wording';
  if (typeof E.avoidMistakes !== 'function') { say(where, 'crash', 'the engine no longer hands avoidMistakes to the tests'); return 0; }
  // (one made-up pull per case: a kill, so the whole pull counts; the group judges everyone from the first hit)
  const line = (harm, ts, w, died) => {
    const j = { p: 'Tester-Realm', ts, tj: ts, amt: 1.2e6, dt: died ? ts[ts.length - 1] + 0.3 : null, tl: ts.map((t, i) => ({ t, w: i === ts.length - 1 ? w : 1 })) };
    const g = { label: 'Caustic Waves', names: ['caustic waves'], spell: [1292403, 'Caustic Waves'], harm, secs: false, judge: [j], rows: [], lim: () => [1, 1, ''] };
    const r = { item: { boss: 'Avoid Once Test', kill: true }, duration: 300, deaths: died ? [{ player: j.p, t: j.dt }] : [], mistakes: [], module: { sections: [{ id: 'avoid', groups: [g] }] } };
    E.avoidMistakes(r); const m = r.mistakes.find((x) => x.avoidRule); return m ? m.detail : '(no line)'; };
  const cases = [
    ['one time, a burst of 3, died', line('Medium', [63.8], 3, true), 'Hit by Caustic Waves (1.2M, 3 hits at once) and died to it.'],
    ['one time, a burst of 3, died (a big-hit group)', line('High', [63.8], 3, true), 'Hit by Caustic Waves (1.2M, 3 hits at once) and died to it.'],
    ['one plain hit, died', line('Medium', [63.8], 1, true), 'Hit by Caustic Waves once (1.2M) and died to it.'],
    ['two times, the last a burst of 3', line('Medium', [43.5, 63.8], 3, true), 'Hit by Caustic Waves twice (1.2M, 3 hits at once the last time) and died to it.'],
    ['three times, lived', line('Medium', [20, 43.5, 63.8], 1, false), 'Hit by Caustic Waves 3 times (1.2M).']];
  for (const [what, got, want] of cases) {
    if (/\bonce \([^)]*hits at once/.test(got) || /\b1 hits\b/.test(got)) say(where, 'count', what + ': "' + got + '" says once and several hits in one line (Nov 14 rehearsal)');
    else if (got !== want) say(where, 'count', what + ': reads "' + got + '", should read "' + want + '"'); }
  // (the Report card's one-line summary of a mechanic: a burst and a plain hit are the same thing to it, "Got hit by Caustic Waves.")
  if (H) { let mg = null; try { mg = H.site(['mechGist']).mechGist; } catch (e) { say(where, 'crash', 'could not read mechGist out of ui.js: ' + e.message); }
    if (mg) for (const [what, got] of cases.slice(0, 3)) { const s = mg(got, 'Caustic Waves'); if (s !== 'Got hit by Caustic Waves.') say(where, 'summary', what + ': the Report card sums up "' + got + '" as "' + s + '", not "Got hit by Caustic Waves."'); } }
  return cases.length;
};
