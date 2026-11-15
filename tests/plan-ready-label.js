// Plan's ready ring names its boss (Nov 15; found by the Nov 14 raid-night rehearsal on Wolfthorn's plan for Wed Nov 11).
// The bug: the header read "0 of 10 bosses ready" while the end of the boss strip read "67% ready". Both were right: the header counts bosses with all four
// parts done (who plays, cooldowns, jobs, raid kit), and the ring is the open boss's own plan (Nymrissa, 67% of the way there). But at the end of the strip
// the ring read as the whole night's. It now names its boss: "Nymrissa 67% ready". The page's own planBarH, run in Node. contradictions.js runs it on every build.
'use strict';
module.exports = function planReadyLabel(H, say) {
  const bad = (m) => say('Plan', 'ready ring', m);
  const B = ['Nymrissa Wavecaller', "Kith'ix"], SH = { 'Nymrissa Wavecaller': 'Nymrissa', "Kith'ix": "Kith'ix" };
  let o; try {
    o = H.site(['planBarH'], { pnNightsGet: () => ({ sel: null, d: {} }), pnToday: () => '2026-11-11', pnDateOf: () => new Date(2026, 10, 11), pnGet: () => ({ diff: 'Mythic' }),
      pgRdy: () => ({ k: 'half', left: ['2 jobs to fill'] }), planBosses: () => B, BOSS_HERO: {}, NDZ_BUILD: {}, pnGap: () => null, esc: (s) => String(s), andL: (a) => a.join(', '),
      pnShort: (b) => SH[b] || b, planNm: () => 'Wolfthorn plan 11', pnTopH: () => '<div>Wolfthorn · 34 raiders · 0 of 2 bosses ready</div>' }); }
  catch (e) { bad('could not read planBarH out of ui.js: ' + e.message); return; }
  const ring = '<span class="ndz-dring" style="--p:67" data-tt="x"><span>67%</span></span>', txt = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  for (const b of B) { const h = o.planBarH(b, null, ring), end = txt(h.slice(h.indexOf('</nav>') + 6));
    if (end.indexOf(SH[b] + ' 67% ready') !== 0) bad('the ring at the end of the boss strip reads "' + end + '" with ' + SH[b] + ' open: it should name its boss, "' + SH[b] + ' 67% ready", so it never reads as the night\'s next to "0 of 2 bosses ready" (Nov 14 rehearsal)'); }
  const none = txt(o.planBarH(B[0], null, '').split('</nav>')[1] || ''); if (none) bad('with no ring the strip still ends in "' + none + '"');
};
