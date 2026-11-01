// Debrief Companion: the Mythic+ run recap (Nov 1, Flex: "only show at the end of a dungeon ... outline the run, and have tabs to look at
// each pull to show the mistakes on that given pull, bosses included ... DPS, HPS, Defensive usage, interupts, stopping casts with
// disrupts, stuns etc."; and "Are you also including CC cast to stop casting even if its not a true interupt?": yes).
// One key's log lines in (CHALLENGE_MODE_START to _END), one recap out: the run (dungeon, level, affixes, time, timed, score), its pulls
// (trash packs and bosses), and per pull the kicks, the stops (a cast that never finished while a player's stun, knockback, silence,
// disorient or fear was on the caster), the must-stop casts that got through while someone's kick was ready (a spell somebody kicked at
// least once this key), deaths with what killed them, defensives, dispels, and each player's damage or healing per second (pets count for their owner).
// First version: no avoidable damage yet (it needs each dungeon's list). Guide: notes/Guides/Mythic+ run recap - gameplan.md
(function (root) {
'use strict';
// (crowd control that stops a cast: the aura a player's spell leaves on the enemy, by name)
const CC = new Set(['leg sweep', 'shadowfury', 'static charge', 'hammer of justice', 'kidney shot', 'cheap shot', 'storm bolt', 'shockwave',
  'intimidating shout', 'war stomp', 'chaos nova', 'fel eruption', 'mighty bash', 'maim', 'asphyxiate', 'blinding light', 'incapacitating roar',
  'paralysis', 'binding shot', 'intimidation', 'psychic scream', 'psychic horror', 'silence', 'solar beam', 'sigil of silence', 'sigil of misery',
  'strangulate', 'dragon\'s breath', 'ring of frost', 'mortal coil', 'howl of terror', 'fear', 'hex', 'polymorph', 'repentance', 'holy word: chastise',
  'blinding sleet', 'sleep walk', 'quaking palm', 'gouge', 'blind', 'sap', 'imprison', 'freezing trap', 'scatter shot', 'disorienting roar',
  'deep breath', 'terror of the skies', 'haymaker', 'bull rush', 'axe toss', 'cyclone', 'shackle undead', 'banish', 'capacitor totem',
  'lightning lasso', 'thunderous paws', 'dead of winter', 'remorseless winter', 'gorefiend\'s grasp', 'death grip', 'mass grip', 'grip of the dead']);
// (knockbacks and pulls leave no aura: the spell's hit on the enemy is the stop)
const KNOCK = new Set(['thunderstorm', 'typhoon', 'ursol\'s vortex', 'ring of peace', 'blast wave', 'tail swipe', 'wing buffet', 'shining force',
  'sigil of chains', 'gorefiend\'s grasp', 'death grip', 'mass grip', 'havoc', 'chaos nova', 'thundering orb', 'shockwave']);
const num = (x) => { const n = +x; return n === n ? n : 0; };
const isPlayer = (g) => typeof g === 'string' && g.startsWith('Player-');
const isNpc = (g) => typeof g === 'string' && (g.startsWith('Creature-') || g.startsWith('Vehicle-'));
const short = (n) => String(n || '').replace(/-.*$/, '');
function build(text, E) {
  const ADV = 19, lines = text.split('\n');
  const run = { dungeon: '', level: 0, affixes: [], timed: false, timeMs: 0, score: null, started: null };
  const players = new Map(); // guid -> { name, cls, spec, role }
  const owners = new Map(); // pet guid -> player guid
  const P = (g, n) => { let p = players.get(g); if (!p) { p = { guid: g, name: short(n), cls: '', spec: '' }; players.set(g, p); } if (n && !p.name) p.name = short(n); return p; };
  const ev = []; // [t, kind, ...]
  const encs = []; let enc = null;
  let t0 = null;
  for (const line of lines) {
    const ts = E.parseTs(line); if (!ts) continue;
    const c = line.indexOf(',', ts.body); if (c < 0) continue;
    const e = line.substring(ts.body, c);
    if (t0 == null) t0 = ts.ms;
    const t = (ts.ms - t0) / 1000;
    const f = E.split(line, c + 1);
    if (e === 'CHALLENGE_MODE_START') { run.dungeon = f[0]; run.level = num(f[3]); run.affixes = String(f[4] || '').replace(/[[\]]/g, '').split(/,/).filter(Boolean).map(Number); continue; }
    if (e === 'CHALLENGE_MODE_END') { run.timed = f[1] === '1'; run.timeMs = num(f[3]); run.score = num(f[4]) || null; run.end = t; continue; }
    if (e === 'COMBATANT_INFO') { let s = num(f[24]); if (!E.SPECS[s]) s = num(f[23]); const p = P(f[0]); if (E.SPECS[s]) { p.spec = E.SPECS[s][0]; p.cls = E.SPECS[s][1]; p.specId = s; } continue; }
    if (e === 'ENCOUNTER_START') { enc = { id: num(f[0]), boss: f[1], s: t, e: null }; encs.push(enc); continue; }
    if (e === 'ENCOUNTER_END') { if (enc) { enc.e = t; enc.kill = f[4] === '1'; enc = null; } continue; }
    if (e === 'SPELL_SUMMON' && isPlayer(f[0])) { owners.set(f[4], f[0]); continue; }
    const sg = f[0], sn = f[1], dg = f[4], dn = f[5];
    // (the owner of a pet or a guardian: from a summon, or the advanced block's owner field)
    const ownerOf = (adv) => (isPlayer(sg) ? sg : owners.get(sg) || (f.length >= adv + ADV && f[adv] === sg && isPlayer(f[adv + 1]) ? f[adv + 1] : null));
    switch (e) {
      case 'SPELL_DAMAGE': case 'SPELL_PERIODIC_DAMAGE': case 'RANGE_DAMAGE': case 'SWING_DAMAGE': {
        const swing = e === 'SWING_DAMAGE', adv = swing ? 8 : 11; if (f.length < adv + 8) break;
        const hasAdv = f.length >= adv + ADV + 8, s0 = adv + (hasAdv ? ADV : 0);
        const amt = Math.max(0, num(f[s0]) + num(f[s0 + 4]) + num(f[s0 + 5]) - Math.max(0, num(f[s0 + 2])));
        const ow = ownerOf(adv);
        if (ow && isNpc(dg)) { if (isPlayer(sg)) P(sg, sn); ev.push([t, 'dmg', ow, amt, dg, dn]); }
        else if (isNpc(sg) && isPlayer(dg)) ev.push([t, 'hit', dg, amt, swing ? 'Melee' : f[9], sn, sg]);
        if (!swing && ow && isNpc(dg) && KNOCK.has(String(f[9]).toLowerCase())) ev.push([t, 'cc', ow, f[9], dg]);
        break;
      }
      case 'SPELL_HEAL': case 'SPELL_PERIODIC_HEAL': {
        if (f.length < 16) break; const s0 = 11 + (f.length >= 11 + ADV + 5 ? ADV : 0);
        const eff = Math.max(0, num(f[s0 + 1]) - Math.max(0, num(f[s0 + 2]))), ow = ownerOf(11);
        if (ow && isPlayer(dg)) ev.push([t, 'heal', ow, eff]);
        break;
      }
      case 'SPELL_CAST_START': if (isNpc(sg)) ev.push([t, 'start', sg, sn, num(f[8]), f[9]]); break;
      case 'SPELL_CAST_SUCCESS': { const ow = ownerOf(11);
        if (ow) ev.push([t, 'cast', ow, num(f[8]), f[9]]); /* (a player's or their pet's: kicks, defensives) */
        else if (isNpc(sg)) ev.push([t, 'done', sg, sn, num(f[8]), f[9]]);
        break; }
      case 'SPELL_INTERRUPT': { const ow = isPlayer(sg) ? sg : owners.get(sg); if (ow && isNpc(dg)) ev.push([t, 'kick', ow, f[9], dg, dn, num(f[11]), f[12]]); break; }
      case 'SPELL_AURA_APPLIED': {
        const ow = isPlayer(sg) ? sg : owners.get(sg);
        if (ow && isNpc(dg) && CC.has(String(f[9]).toLowerCase())) ev.push([t, 'cc', ow, f[9], dg]);
        else if (isPlayer(sg) && sg === dg) ev.push([t, 'aura', sg, num(f[8]), f[9]]);
        break;
      }
      case 'SPELL_DISPEL': { const ow = isPlayer(sg) ? sg : owners.get(sg); if (ow) ev.push([t, 'dispel', ow, f[9], dg, dn, f[12]]); break; }
      case 'UNIT_DIED': if (isPlayer(dg)) ev.push([t, 'died', dg, dn]); else if (isNpc(dg)) ev.push([t, 'mobdied', dg]); break;
      default: break;
    }
  }
  if (!players.size) return null;
  // ---- pulls: bosses are their own; trash starts when new enemies are engaged after the last pack is dead, or after a 4 s lull ----
  const pulls = [], alive = new Set(), seen = new Set(); let cur = null, last = -1e9;
  const inEnc = (t) => encs.find((x) => t >= x.s - 1 && t <= (x.e == null ? 1e9 : x.e + 1));
  for (const x of ev) {
    const t = x[0];
    if (x[1] === 'mobdied') { alive.delete(x[2]); continue; }
    let mob = null; if (x[1] === 'dmg') mob = [x[4], x[5]]; else if (x[1] === 'hit') mob = [x[6], x[5]]; if (!mob) continue;
    const boss = inEnc(t);
    if (boss) { if (!cur || cur.enc !== boss) { cur = { s: boss.s, e: boss.e || t, enc: boss, mobs: new Map() }; pulls.push(cur); } }
    else if (!seen.has(mob[0]) && (!cur || cur.enc || alive.size === 0 || t - last > 4)) { cur = { s: t, e: t, enc: null, mobs: new Map() }; pulls.push(cur); }
    if (!seen.has(mob[0])) { seen.add(mob[0]); alive.add(mob[0]); }
    if (!cur.mobs.has(mob[1])) cur.mobs.set(mob[1], new Set()); cur.mobs.get(mob[1]).add(mob[0]);
    if (!boss) cur.e = Math.max(cur.e, t); last = t;
  }
  // (a pack of one stray enemy hit for a few seconds is folded into the pull before it)
  for (let i = pulls.length - 1; i > 0; i--) { const p = pulls[i]; const n = [...p.mobs.values()].reduce((a, s) => a + s.size, 0); if (!p.enc && n <= 1 && p.e - p.s < 8) { const q = pulls[i - 1]; for (const [k, v] of p.mobs) { if (!q.mobs.has(k)) q.mobs.set(k, new Set()); for (const g of v) q.mobs.get(k).add(g); } q.e = Math.max(q.e, p.e); pulls.splice(i, 1); } }
  const pullOf = (t) => { for (let i = pulls.length - 1; i >= 0; i--) if (t >= pulls[i].s - 2) return i; return 0; };
  // ---- casts: kicked, stopped, finished or cut short; dangerous = a spell this group kicked or stopped at least once ----
  const casts = [], open = new Map();
  const kicks = ev.filter((x) => x[1] === 'kick'), ccs = ev.filter((x) => x[1] === 'cc');
  for (const x of ev) {
    if (x[1] === 'start') { const k = x[2] + '|' + x[4]; const c = { t: x[0], guid: x[2], mob: x[3], id: x[4], spell: x[5], res: 'cut' }; casts.push(c); open.set(k, c); }
    else if (x[1] === 'done') { const c = open.get(x[2] + '|' + x[4]); if (c && x[0] - c.t < 12) { c.res = 'done'; c.end = x[0]; open.delete(x[2] + '|' + x[4]); } }
  }
  for (const c of casts) {
    if (c.res === 'done') continue;
    const kk = kicks.find((k) => k[4] === c.guid && k[6] === c.id && k[0] >= c.t - 0.1 && k[0] <= c.t + 6);
    if (kk) { c.res = 'kicked'; c.by = kk[2]; c.with = kk[3]; c.at = kk[0]; continue; }
    const cc = ccs.find((k) => k[4] === c.guid && k[0] >= c.t - 0.2 && k[0] <= c.t + 4);
    if (cc) { c.res = 'stopped'; c.by = cc[2]; c.with = cc[3]; c.at = cc[0]; }
  }
  // (must-stop spells: the ones somebody deliberately kicked at least once this key; a spell only caught in an area stun isn't one)
  const danger = new Set(casts.filter((c) => c.res === 'kicked').map((c) => c.id));
  // (whose kick was ready when a dangerous cast went off: each player's interrupts for their spec, from the engine, and when they last pressed
  // them. A cast that got through with nobody's kick ready isn't a mistake (Nov 1))
  const kickNames = new Map(); for (const p of players.values()) { const l = ((E.INTERRUPTS || {})[p.cls] || []).filter((k) => !k[2] || k[2].includes(p.specId)); if (l.length) kickNames.set(p.guid, l); }
  const pressed = new Map(); for (const x of ev) if (x[1] === 'cast' && kickNames.has(x[2]) && kickNames.get(x[2]).some((k) => k[0] === x[4])) { if (!pressed.has(x[2])) pressed.set(x[2], []); pressed.get(x[2]).push([x[0], x[4]]); }
  const readyAt = (t) => [...kickNames].filter(([g, l]) => l.some((k) => { const last = (pressed.get(g) || []).filter((q) => q[1] === k[0] && q[0] < t).pop(); return !last || t - last[0] >= k[1]; })).map(([g]) => g);
  // ---- per pull ----
  const defIds = new Map(); for (const [cls, list] of Object.entries(E.DEFENSIVES || {})) for (const d of list) defIds.set(d[1], d[0]);
  const out = pulls.map((p, i) => ({ n: i + 1, s: p.s, e: p.e, boss: p.enc ? p.enc.boss : null, kill: p.enc ? !!p.enc.kill : null,
    mobs: [...p.mobs].map(([n, g]) => [n, g.size]).sort((a, b) => b[1] - a[1]), dmg: {}, heal: {}, kicks: [], stops: [], through: [], deaths: [], defs: [], dispels: [], hits: {} }));
  const addTo = (o, k, v) => { o[k] = (o[k] || 0) + v; };
  const recent = new Map(); // player -> last hits
  for (const x of ev) {
    const pi = pullOf(x[0]), o = out[pi]; if (!o) continue;
    if (x[1] === 'dmg') addTo(o.dmg, x[2], x[3]);
    else if (x[1] === 'heal') addTo(o.heal, x[2], x[3]);
    else if (x[1] === 'hit') { const l = recent.get(x[2]) || []; l.push([x[0], x[4], x[5], x[3]]); if (l.length > 6) l.shift(); recent.set(x[2], l); }
    else if (x[1] === 'aura' && defIds.has(x[3])) o.defs.push({ t: x[0], who: x[2], name: defIds.get(x[3]) });
    else if (x[1] === 'cast' && defIds.has(x[3])) { if (!o.defs.some((d) => d.who === x[2] && d.name === defIds.get(x[3]) && Math.abs(d.t - x[0]) < 2)) o.defs.push({ t: x[0], who: x[2], name: defIds.get(x[3]) }); }
    else if (x[1] === 'dispel') o.dispels.push({ t: x[0], who: x[2], removed: x[6], on: short(x[5]) });
    else if (x[1] === 'died') { const l = (recent.get(x[2]) || []).filter((h) => x[0] - h[0] < 5); const top = l.slice().sort((a, b) => b[3] - a[3])[0];
      o.deaths.push({ t: x[0], who: x[2], to: top ? top[1] : 'unknown', from: top ? top[2] : '', defs: out.flatMap((q) => q.defs).filter((d) => d.who === x[2] && x[0] - d.t < 30).length }); }
  }
  for (const c of casts) {
    const o = out[pullOf(c.t)]; if (!o) continue;
    if (c.res === 'kicked') o.kicks.push({ t: c.at, who: c.by, with: c.with, spell: c.spell, mob: c.mob });
    else if (c.res === 'stopped') o.stops.push({ t: c.at, who: c.by, with: c.with, spell: c.spell, mob: c.mob });
    else if (c.res === 'done' && danger.has(c.id)) { const rd = readyAt(c.t); if (rd.length) o.through.push({ t: c.t, spell: c.spell, mob: c.mob, ready: rd }); }
  }
  for (const o of out) { const d = Math.max(1, o.e - o.s); o.dur = d; for (const k of ['dmg', 'heal']) for (const g of Object.keys(o[k])) o[k][g] = Math.round(o[k][g] / d); }
  // ---- the whole key, per player ----
  const total = Math.max(1, (run.end != null ? run.end : out.length ? out[out.length - 1].e : 1));
  const people = [...players.values()].filter((p) => p.cls).map((p) => {
    const sum = (k) => out.reduce((a, o) => a + (o[k][p.guid] || 0) * o.dur, 0);
    const role = /Restoration|Holy|Discipline|Mistweaver|Preservation/.test(p.spec) ? 'healer' : /Protection|Guardian|Blood|Brewmaster|Vengeance/.test(p.spec) ? 'tank' : 'dps';
    const cnt = (k) => out.reduce((a, o) => a + o[k].filter((x) => x.who === p.guid).length, 0);
    return { guid: p.guid, name: p.name, cls: p.cls, spec: p.spec, role, dps: Math.round(sum('dmg') / total), hps: Math.round(sum('heal') / total),
      kicks: cnt('kicks'), stops: cnt('stops'), deaths: cnt('deaths'), defs: cnt('defs'), dispels: cnt('dispels') };
  });
  const name = (g) => (players.get(g) || {}).name || short(g);
  for (const o of out) for (const k of ['kicks', 'stops', 'deaths', 'defs', 'dispels']) for (const x of o[k]) x.who = name(x.who);
  for (const o of out) for (const x of o.through) x.ready = x.ready.map(name);
  for (const o of out) { const fix = (m) => { const r = {}; for (const [g, v] of Object.entries(m)) r[name(g)] = v; return r; }; o.dmg = fix(o.dmg); o.heal = fix(o.heal); delete o.hits; }
  return { run, people, pulls: out, danger: [...danger].length, casts: { total: casts.length, kicked: casts.filter((c) => c.res === 'kicked').length, stopped: casts.filter((c) => c.res === 'stopped').length,
    through: out.reduce((a, o) => a + o.through.length, 0) } };
}
root.DBF_MPLUS = build;
if (typeof module !== 'undefined') module.exports = build;
})(typeof window !== 'undefined' ? window : globalThis);
