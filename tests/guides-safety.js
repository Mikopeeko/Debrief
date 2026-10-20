// Guides safety check: plays every guide map (and each Putting it all together simulation) frame by frame and lists any
// player standing in something deadly as it lands: a frontal they aren't tanking (from 1.2 s before), a Toxic Deluge circle,
// Widow's Kiss, someone else's Gloombomb, a purple orb's ring touching another orb, or two ghosts touching on Mythic.
// How to run: open the app at localhost (Guides is on there), open any pull, then paste this file into the browser console
// and run gdzSafety(). It prints 'all clear' or one line per problem. (window.__gdz is set by src/guides.js off the website only.)
window.gdzSafety = () => {
  const { GDZ } = window.__gdz, out = [];
  const near = (mp, t) => { let b = mp.frames[0]; for (const f of mp.frames) if (Math.abs(f.t - t) < Math.abs(b.t - t)) b = f; return b; };
  const pl = (f) => f.pts.filter((p) => p.kind === 'player');
  const fmt = (t) => t.toFixed(1) + 's';
  const check = (label, mp, whole) => { const bad0 = new Set();
    // frontals: nobody but a tank inside when it lands
    for (const c of mp.cones || []) for (const f of mp.frames.filter((q) => q.t >= c.at - 1.2 && q.t <= c.at + 0.6)) {
      for (const p of pl(f)) { const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy); if (d < 1 || d > c.r) continue;
        let a = Math.atan2(dy, dx) - c.dir; while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
        if (Math.abs(a) <= c.half && p.guid[0] !== 't') { const kk = 'cone' + c.at + p.guid; if (!bad0.has(kk)) { bad0.add(kk); out.push(label + ': ' + p.name + ' in the frontal at ' + fmt(f.t)); } } } }
    // every orb or ghost a frontal pops must really be inside it when it lands
    for (const c of mp.cones || []) { const f = near(mp, c.at);
      for (const id of c.hit || []) { const p = f.pts.find((q) => q.guid === id); if (!p) { out.push(label + ': ' + id + ' popped at ' + fmt(c.at) + ' but not on the map'); continue; }
        const dx = p.x - c.x, dy = p.y - c.y; let a = Math.atan2(dy, dx) - c.dir; while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
        if (Math.hypot(dx, dy) > c.r + 1 || Math.abs(a) > c.half + 0.05) out.push(label + ': ' + id + ' popped at ' + fmt(c.at) + ' but outside the frontal'); } }
    for (const g of mp.rings || []) {
      if (g.at == null) continue; const f = near(mp, g.at), cen = g.guid ? f.pts.find((q) => q.guid === g.guid) : { x: g.x, y: g.y }; if (!cen) continue;
      const inside = pl(f).filter((p) => Math.hypot(p.x - cen.x, p.y - cen.y) < g.r - 0.3);
      if (g.cn === 'Toxic Deluge') inside.forEach((p) => out.push(label + ': ' + p.name + ' under a Toxic Deluge circle at ' + fmt(g.at)));
      if (g.cn === "Widow's Kiss") inside.forEach((p) => out.push(label + ': ' + p.name + " inside Widow's Kiss at " + fmt(g.at)));
      if (g.cn === 'Gloombomb') { const bombers = new Set((mp.rings || []).filter((x) => x.cn === 'Gloombomb').map((x) => x.guid)); inside.filter((p) => !bombers.has(p.guid)).forEach((p) => out.push(label + ': ' + p.name + ' hit by a Gloombomb at ' + fmt(g.at)));
        // (bombs never stack on each other: they overlap only on the add)
        inside.filter((p) => bombers.has(p.guid) && p.guid !== g.guid).forEach((p) => out.push(label + ': ' + p.name + ' stands in another Gloombomb at ' + fmt(g.at))); }
    }
    // Noxious Ground pools: nobody standing in one from 2 s after it pours in until it fades
    const poolHit = new Set();
    for (const g of mp.rings || []) { if (g.cn !== 'Noxious Ground' || g.t0 == null) continue;
      for (const f of mp.frames.filter((q) => q.t >= g.t0 + 2 && q.t <= g.t0 + g.dur)) for (const p of pl(f)) if (Math.hypot(p.x - g.x, p.y - g.y) < g.r - 0.5 && !poolHit.has(p.guid + g.t0)) { poolHit.add(p.guid + g.t0); out.push(label + ': ' + p.name + ' stands in a Noxious Ground pool at ' + fmt(f.t)); } }
    // players and carried orbs moving faster than a player can run (about 7 yd/s; over 12 yd/s across half a second looks like a teleport)
    const fast = new Set();
    for (let i = 2; i < mp.frames.length; i++) { const a = mp.frames[i - 2], b = mp.frames[i], am = new Map(a.pts.map((p) => [p.guid, p]));
      for (const p of b.pts) { if (p.kind !== 'player') continue; const q = am.get(p.guid); if (!q) continue; const v = Math.hypot(p.x - q.x, p.y - q.y) / (b.t - a.t);
        if (v > 12 && !fast.has(p.guid + Math.floor(b.t))) { fast.add(p.guid + Math.floor(b.t)); fast.add(p.guid + (Math.floor(b.t) + 1)); out.push(label + ': ' + p.name + ' moves ' + Math.round(v) + ' yd/s at ' + fmt(b.t)); } } }
    // purple rings and ghosts, every frame
    const bad = new Set();
    mp.frames.forEach((f, fi) => { const prev = mp.frames[Math.max(0, fi - 1)], moved = (p) => { const q = prev.pts.find((z) => z.guid === p.guid); return q && Math.hypot(q.x - p.x, q.y - p.y) > 0.05; };
      const pu = f.pts.filter((p) => p.kind === 'porb'), orbs = f.pts.filter((p) => p.kind === 'orb' || p.kind === 'porb');
      for (const a of pu) for (const b of orbs) if (a !== b && Math.hypot(a.x - b.x, a.y - b.y) < 4.5 && !(moved(a) && moved(b) && b.kind === 'orb')) { const k = 'orb ' + a.guid + '/' + b.guid; if (!bad.has(k)) { bad.add(k); out.push(label + ': purple orb ring touches ' + b.guid + ' at ' + fmt(f.t)); } }
      if (label.includes('|m|')) { const gh = f.pts.filter((p) => p.kind === 'ghost'); for (let i = 0; i < gh.length; i++) for (let j = i + 1; j < gh.length; j++) if (Math.hypot(gh[i].x - gh[j].x, gh[i].y - gh[j].y) < 2.5) { const k = 'gh ' + gh[i].guid + gh[j].guid; if (!bad.has(k)) { bad.add(k); out.push(label + ': ghosts touch at ' + fmt(f.t)); } } }
    });
  };
  for (const [boss, G0] of Object.entries(GDZ)) for (const D of ['h', 'm']) {
    const own = (o) => (!o || (o.only && o.only !== D) ? null : Object.assign({}, o, o[D] || {}));
    const G = own(G0); G.phases = G.phases.map(own).filter(Boolean).map((p) => ({ ...p, mechs: (p.mechs || []).map(own).filter(Boolean) }));
    for (const p of G.phases) for (const m of p.mechs) if (m.map) check(boss + '|' + D + '|' + m.name, m.map(D));
    check(boss + '|' + D + '|WHOLE', window.__gdz.gdzWhole(boss, G, D).mp);
  }
  return out.length ? out.join('\n') : 'all clear';
};
'loaded';
