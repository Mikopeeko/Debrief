// Debrief Companion: the Mythic+ run recap (Nov 1, Flex: "only show at the end of a dungeon ... outline the run, and have tabs to look at
// each pull to show the mistakes on that given pull, bosses included ... DPS, HPS, Defensive usage, interupts, stopping casts with
// disrupts, stuns etc."; and "Are you also including CC cast to stop casting even if its not a true interupt?": yes).
// One key's log lines in (CHALLENGE_MODE_START to _END), one recap out: the run (dungeon, level, affixes, time, timed, score), its pulls
// (trash packs and bosses), and per pull the kicks, the stops (a cast that never finished while a player's stun, knockback, silence,
// disorient or fear was on the caster), the must-kick casts that got through while someone's kick was ready, deaths with what killed them,
// defensives, dispels and purges, avoidable damage, and each player's damage or healing per second (pets count for their owner).
// Must-kick lists (Nov 1, Flex: "Must-kick lists"): each Season 2 dungeon's casts to kick, casts to stop with CC, debuffs to dispel, enemy
// buffs to purge or soothe, and damage to dodge, from the Wowhead guides and checked on Flex's keys (notes/Guides/Mythic+ must-kick lists.md).
// A dungeon without a list falls back to "a spell somebody kicked at least once this key". Guide: notes/Guides/Mythic+ run recap - gameplan.md
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
// (each dungeon's lists, by spell name as the log writes it. kick: must-kick casts; chan: the ones that are channels (the log shows them only
// when they start); cc: [cast, what the enemy gains when nobody stopped it]; dispel: debuffs on players to remove (not the "only after a failed
// mechanic" ones); purge: enemy buffs to purge or soothe; dodge: damage a player who isn't tanking should never take (bosses from the guides, trash
// from Flex's keys and each spell's Wowhead text, Nov 1); pool: a puddle that puts a debuff on whoever stands in it (each landing is one hit). Seen on Flex's keys
// Oct 24 to 31 except Murder Row, The Blinding Vale and Voidscar Arena (no key yet) and Den of Nalorakk past its first boss)
const LISTS = {
  'altar of fangs': { kick: ['Piercing Hiss', 'Toxic Atrophy', 'Mass Envenom'], cc: [['Evolve', 'Evolved']],
    dispel: ['Paralyzing Shots', 'Regurgitate', 'Envenom'], purge: ['Ravenous Claws'], dodge: ['Regurgitate', 'Burrowing Charge', 'Axegrinder', 'Septic Spatter'] },
  'murder row': { kick: ['Fel Missiles', 'Seduction', 'Felstorm', 'Fel Rage', 'Health Funnel', 'Chaos Bolt'], chan: ['Health Funnel'],
    dispel: ['Corroding Spittle', 'Heartstop Poison', 'Murder in a Row', 'Curse of Doom'], purge: ['Back to Work!'], dodge: ['Legion Strike', 'Demonic Rage'] },
  'den of nalorakk': { kick: ['Scavenge', 'Healing Breeze', 'Frigid Roar', 'Winter\'s Shroud', 'Arc Lightning'],
    dispel: ['Insatiable Hunger', 'Toxic Spores', 'Cryo Surge', 'Glacial Torment'], purge: ['Mother\'s Wrath', 'Bestial Wrath'], dodge: ['Earthshatter Slam'], pool: ['Rotten Ground'] },
  'the blinding vale': { kick: ['Light Bolt Volley', 'Light Bolt', 'Disorienting Screech', 'Warden\'s Wrath', 'Lightspore Shot'],
    dispel: ['Bloodthorn Roots'], purge: [], dodge: ['Lightsower Dash', 'Fan of Thorns'] },
  'voidscar arena': { kick: ['Demoralizing Shout', 'Shadowbolt Volley', 'Violent Sand', 'Mad Shriek', 'Mending Void'],
    dispel: ['Melt Armor', 'Corrosive Essence'], purge: ['Bolster'], dodge: ['Nether Dash', 'Dark Bloom', 'Poison Splash', 'Unstable Singularity', 'Cosmic Crash'] },
  'ruby life pools': { kick: ['Ice Shield', 'Frigid Shard', 'Fiery Blast', 'Blaze Volley'], chan: ['Ice Shield'],
    dispel: ['Cold Claws', 'Rolling Thunder', 'Stormslam'], purge: ['Blaze of Glory', 'Stormcloud Barrier'], dodge: ['Molten Boulder', 'Roaring Firebreath', 'Flame Breath'] },
  'kings\' rest': { kick: ['Hex Volley', 'Bind Soul', 'Unholy Mending', 'Wretched Discharge', 'Hex', 'Poison Nova', 'Deathly Roar'],
    dispel: ['Lingering Fluid', 'Putrid Seekers', 'Savage Maul'], purge: ['Bound by Shadow', 'Ancestral Fury', 'Bestial Berserk', 'Captain\'s Bulwark', 'Unholy Mending'], dodge: ['Gilded Destruction', 'Suppression Slam'] },
  'temple of sethraliss': { kick: ['Poisoned Cheap Shot', 'Addle Mind', 'Poison Spit', 'Essence Disruption', 'Flame Shock'], chan: ['Essence Disruption'],
    dispel: ['Cytotoxin', 'Imbued Conduction'], purge: ['Accumulate Charge'], dodge: ['Burrow'] },
};
// (each dungeon's timer in minutes (Nov 1, Flex: "yea" to the timer story): Wowhead's Season 2 table and each dungeon's own page agree, except
// Altar of Fangs: 29 on its page, 30 in the table (which says it's from the PTR), so its page wins. Two levels at 80% of the timer and three at
// 60%, as since Battle for Azeroth)
const TIMER = { 'altar of fangs': 29, 'murder row': 34, 'den of nalorakk': 32, 'the blinding vale': 31, 'voidscar arena': 30, 'kings\' rest': 33, 'temple of sethraliss': 33, 'ruby life pools': 28 };
const lc = (s) => String(s || '').toLowerCase().replace(/[’`]/g, '\'');
const listFor = (dungeon) => { const L = LISTS[lc(dungeon)]; if (!L) return null; const S = (a) => new Set((a || []).map(lc));
  return { kick: S(L.kick), chan: S(L.chan), ccCast: new Map((L.cc || []).map(([c, r]) => [lc(r), c])), dispel: S(L.dispel), purge: S(L.purge), dodge: S(L.dodge), pool: S(L.pool) }; };
const num = (x) => { const n = +x; return n === n ? n : 0; };
const isPlayer = (g) => typeof g === 'string' && g.startsWith('Player-');
const isNpc = (g) => typeof g === 'string' && (g.startsWith('Creature-') || g.startsWith('Vehicle-'));
const short = (n) => String(n || '').replace(/-.*$/, '');
const roleOf = (spec) => (/Restoration|Holy|Discipline|Mistweaver|Preservation/.test(spec) ? 'healer' : /Protection|Guardian|Blood|Brewmaster|Vengeance/.test(spec) ? 'tank' : 'dps');
function build(text, E) {
  const ADV = 19, lines = text.split('\n');
  const run = { dungeon: '', level: 0, affixes: [], timed: false, timeMs: 0, score: null, started: null };
  const players = new Map(); // guid -> { name, cls, spec, role }
  const owners = new Map(); // pet guid -> player guid
  const P = (g, n) => { let p = players.get(g); if (!p) { p = { guid: g, name: short(n), cls: '', spec: '' }; players.set(g, p); } if (n && !p.name) p.name = short(n); return p; };
  const ev = []; // [t, kind, ...]
  const encs = []; let enc = null, LIST = null, lastT = 0;
  let t0 = null;
  for (const line of lines) {
    const ts = E.parseTs(line); if (!ts) continue;
    const c = line.indexOf(',', ts.body); if (c < 0) continue;
    const e = line.substring(ts.body, c);
    if (t0 == null) t0 = ts.ms;
    const t = (ts.ms - t0) / 1000;
    const f = E.split(line, c + 1);
    if (e === 'CHALLENGE_MODE_START') { run.dungeon = f[0]; run.level = num(f[3]); run.affixes = String(f[4] || '').replace(/[[\]]/g, '').split(/,/).filter(Boolean).map(Number); run.inst = f[1]; LIST = listFor(f[0]); continue; }
    if (e === 'ZONE_CHANGE' && run.inst && f[0] !== run.inst && f[1] !== 'UNKNOWN AREA') { run.left = t; break; } /* (the group left the dungeon: the key ends here for the recap; a loading screen isn't leaving) */
    lastT = t;
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
        else if (isNpc(sg) && isPlayer(dg)) ev.push([t, 'hit', dg, amt, swing ? 'Melee' : f[9], sn, sg, e === 'SPELL_PERIODIC_DAMAGE']);
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
        else if (LIST && isNpc(sg) && isPlayer(dg) && f[11] === 'DEBUFF' && LIST.dispel.has(lc(f[9]))) ev.push([t, 'deb', dg, f[9]]); /* (a debuff to dispel landed) */
        else if (LIST && isNpc(sg) && isPlayer(dg) && f[11] === 'DEBUFF' && LIST.pool.has(lc(f[9]))) ev.push([t, 'pool', dg, f[9]]); /* (someone stepped into a puddle) */
        else if (LIST && isNpc(dg) && f[11] === 'BUFF' && (LIST.purge.has(lc(f[9])) || LIST.ccCast.has(lc(f[9])))) ev.push([t, 'ebuff', dg, f[9], dn]); /* (an enemy buff to purge, or what an unstopped cast gave) */
        break;
      }
      /* (a buff taken off is a purge or soothe; a debuff taken off is a dispel, a friendly NPC's too: Altar's Cursed Bones get their Cursed cleansed) */
      case 'SPELL_DISPEL': case 'SPELL_STOLEN': { const ow = isPlayer(sg) ? sg : owners.get(sg); if (ow) ev.push([t, e === 'SPELL_STOLEN' || f[14] === 'BUFF' ? 'purge' : 'dispel', ow, f[9], dg, dn, f[12]]); break; }
      case 'UNIT_DIED': if (isPlayer(dg)) { if (f[8] !== '1') ev.push([t, 'died', dg, dn]); } else if (isNpc(dg)) ev.push([t, 'mobdied', dg]); break; /* (1 at the end: Feign Death, not a death, as the website reads it) */
      default: break;
    }
  }
  if (!players.size) return null;
  if (run.end == null && run.left == null) run.left = lastT; /* (no end line: the app ended the key where the group left the dungeon (Nov 1)) */
  for (const p of players.values()) p.role = roleOf(p.spec);
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
  // ---- casts: kicked, stopped, finished or cut short ----
  const casts = [], open = new Map();
  const kicks = ev.filter((x) => x[1] === 'kick'), ccs = ev.filter((x) => x[1] === 'cc');
  for (const x of ev) {
    if (x[1] === 'start') { const k = x[2] + '|' + x[4]; const c = { t: x[0], guid: x[2], mob: x[3], id: x[4], spell: x[5], res: 'cut' }; casts.push(c); open.set(k, c); }
    else if (x[1] === 'done') { const c = open.get(x[2] + '|' + x[4]); if (c && x[0] - c.t < 12) { c.res = 'done'; c.end = x[0]; open.delete(x[2] + '|' + x[4]); }
      else if (LIST && LIST.chan.has(lc(x[5]))) casts.push({ t: x[0], guid: x[2], mob: x[3], id: x[4], spell: x[5], res: 'chan' }); } /* (a must-kick channel started) */
  }
  for (const c of casts) {
    if (c.res === 'done') continue;
    const kk = kicks.find((k) => k[4] === c.guid && k[6] === c.id && k[0] >= c.t - 0.1 && k[0] <= c.t + (c.res === 'chan' ? 8 : 6));
    if (kk) { c.res = 'kicked'; c.by = kk[2]; c.with = kk[3]; c.at = kk[0]; continue; }
    const cc = ccs.find((k) => k[4] === c.guid && k[0] >= c.t - 0.2 && k[0] <= c.t + 4);
    if (cc) { c.res = 'stopped'; c.by = cc[2]; c.with = cc[3]; c.at = cc[0]; }
    else if (c.res === 'chan') c.res = 'done';
  }
  // (must-kick: the dungeon's list; without one, a spell somebody deliberately kicked at least once this key (an area stun alone doesn't make one))
  const kickedIds = new Set(casts.filter((c) => c.res === 'kicked').map((c) => c.id));
  const danger = (c) => (LIST ? LIST.kick.has(lc(c.spell)) : kickedIds.has(c.id));
  // (whose kick was ready when a must-kick cast went off: each player's interrupts for their spec, from the engine, and when they last pressed
  // them. A cast that got through with nobody's kick ready isn't a mistake (Nov 1))
  const kickNames = new Map(); for (const p of players.values()) { const l = ((E.INTERRUPTS || {})[p.cls] || []).filter((k) => !k[2] || k[2].includes(p.specId)); if (l.length) kickNames.set(p.guid, l); }
  const pressed = new Map(); for (const x of ev) if (x[1] === 'cast' && kickNames.has(x[2]) && kickNames.get(x[2]).some((k) => k[0] === x[4])) { if (!pressed.has(x[2])) pressed.set(x[2], []); pressed.get(x[2]).push([x[0], x[4]]); }
  const readyAt = (t) => [...kickNames].filter(([g, l]) => l.some((k) => { const last = (pressed.get(g) || []).filter((q) => q[1] === k[0] && q[0] < t).pop(); return !last || t - last[0] >= k[1]; })).map(([g]) => g);
  // ---- per pull ----
  const defIds = new Map(); for (const [cls, list] of Object.entries(E.DEFENSIVES || {})) for (const d of list) defIds.set(d[1], d[0]);
  const out = pulls.map((p, i) => ({ n: i + 1, s: p.s, e: p.e, boss: p.enc ? p.enc.boss : null, kill: p.enc ? !!p.enc.kill : null,
    mobs: [...p.mobs].map(([n, g]) => [n, g.size]).sort((a, b) => b[1] - a[1]), dmg: {}, heal: {}, kicks: [], stops: [], through: [], deaths: [], defs: [], dispels: [], purges: [],
    avoid: {}, debs: {}, ebuffs: {} }));
  const addTo = (o, k, v) => { o[k] = (o[k] || 0) + v; }, avoidOf = (o, who, spell) => o.avoid[who + '|' + spell] || (o.avoid[who + '|' + spell] = { who, spell, n: 0, dmg: 0 });
  const recent = new Map(), inPool = new Set(); // player -> last hits; player|puddle stepped into, not ticked yet
  for (const x of ev) {
    const pi = pullOf(x[0]), o = out[pi]; if (!o) continue;
    if (x[1] === 'dmg') addTo(o.dmg, x[2], x[3]);
    else if (x[1] === 'heal') addTo(o.heal, x[2], x[3]);
    else if (x[1] === 'hit') { const l = recent.get(x[2]) || []; l.push([x[0], x[4], x[5], x[3]]); if (l.length > 6) l.shift(); recent.set(x[2], l);
      /* (avoidable damage: a dodge-list spell's direct hit (not the damage-over-time some leave) on anyone but a tank, who may be standing in a frontal on purpose) */
      if (LIST && (players.get(x[2]) || {}).role !== 'tank') { if (!x[7] && LIST.dodge.has(lc(x[4]))) { const a = avoidOf(o, x[2], x[4]); a.n++; a.dmg += x[3]; } else if (x[7] && LIST.pool.has(lc(x[4]))) { const a = avoidOf(o, x[2], x[4]), k = x[2] + '|' + lc(x[4]); if (inPool.has(k)) { a.n++; inPool.delete(k); } a.dmg += x[3]; } } }
    /* (a puddle: one hit each time someone stepped in and it ticked on them; out again within a second isn't a mistake. Its ticks are the damage) */
    else if (x[1] === 'pool') inPool.add(x[2] + '|' + lc(x[3]));
    else if (x[1] === 'aura' && defIds.has(x[3])) o.defs.push({ t: x[0], who: x[2], name: defIds.get(x[3]) });
    else if (x[1] === 'cast' && defIds.has(x[3])) { if (!o.defs.some((d) => d.who === x[2] && d.name === defIds.get(x[3]) && Math.abs(d.t - x[0]) < 2)) o.defs.push({ t: x[0], who: x[2], name: defIds.get(x[3]) }); }
    else if (x[1] === 'dispel' || x[1] === 'purge') { o[x[1] + 's'].push({ t: x[0], who: x[2], removed: x[6], on: short(x[5]) });
      const m = x[1] === 'dispel' ? o.debs : o.ebuffs, k = LIST && (x[1] === 'dispel' ? LIST.dispel : LIST.purge).has(lc(x[6])) ? x[6] : null; if (k) { const b = m[k] || (m[k] = { on: 0, removed: 0 }); b.removed++; } }
    else if (x[1] === 'deb') { const b = o.debs[x[3]] || (o.debs[x[3]] = { on: 0, removed: 0 }); b.on++; }
    else if (x[1] === 'ebuff') {
      if (LIST.ccCast.has(lc(x[3]))) o.through.push({ t: x[0], spell: LIST.ccCast.get(lc(x[3])), mob: short(x[4]), ready: [], cc: true }); /* (nobody stunned it: the enemy got its buff) */
      else { const b = o.ebuffs[x[3]] || (o.ebuffs[x[3]] = { on: 0, removed: 0 }); b.on++; } }
    else if (x[1] === 'died') { const l = (recent.get(x[2]) || []).filter((h) => x[0] - h[0] < 5); const top = l.slice().sort((a, b) => b[3] - a[3])[0];
      o.deaths.push({ t: x[0], who: x[2], to: top ? top[1] : 'unknown', from: top ? top[2] : '', defs: out.flatMap((q) => q.defs).filter((d) => d.who === x[2] && x[0] - d.t < 30).length }); }
  }
  for (const c of casts) {
    const o = out[pullOf(c.t)]; if (!o) continue;
    if (c.res === 'kicked') o.kicks.push({ t: c.at, who: c.by, with: c.with, spell: c.spell, mob: c.mob });
    else if (c.res === 'stopped') o.stops.push({ t: c.at, who: c.by, with: c.with, spell: c.spell, mob: c.mob });
    else if (c.res === 'done' && danger(c)) { const rd = readyAt(c.t); if (rd.length) o.through.push({ t: c.t, spell: c.spell, mob: c.mob, ready: rd }); }
  }
  for (const o of out) { const d = Math.max(1, o.e - o.s); o.dur = d; for (const k of ['dmg', 'heal']) for (const g of Object.keys(o[k])) o[k][g] = Math.round(o[k][g] / d); o.through.sort((a, b) => a.t - b.t); }
  // ---- the whole key, per player ----
  const total = Math.max(1, (run.end != null ? run.end : out.length ? out[out.length - 1].e : 1));
  const people = [...players.values()].filter((p) => p.cls).map((p) => {
    const sum = (k) => out.reduce((a, o) => a + (o[k][p.guid] || 0) * o.dur, 0);
    const cnt = (k) => out.reduce((a, o) => a + o[k].filter((x) => x.who === p.guid).length, 0);
    const av = out.flatMap((o) => Object.values(o.avoid).filter((a) => a.who === p.guid && a.n));
    return { guid: p.guid, name: p.name, cls: p.cls, spec: p.spec, role: p.role, dps: Math.round(sum('dmg') / total), hps: Math.round(sum('heal') / total),
      kicks: cnt('kicks'), stops: cnt('stops'), deaths: cnt('deaths'), defs: cnt('defs'), dispels: cnt('dispels'), purges: cnt('purges'), kick: kickNames.has(p.guid) || cnt('kicks') > 0, /* (has a kick: their spec's, or they kicked something) */
      avoid: av.reduce((a, x) => a + x.n, 0), avoidDmg: av.reduce((a, x) => a + x.dmg, 0) };
  });
  const name = (g) => (players.get(g) || {}).name || short(g);
  for (const o of out) for (const k of ['kicks', 'stops', 'deaths', 'defs', 'dispels', 'purges']) for (const x of o[k]) x.who = name(x.who);
  for (const o of out) for (const x of o.through) x.ready = x.ready.map(name);
  for (const o of out) { const fix = (m) => { const r = {}; for (const [g, v] of Object.entries(m)) r[name(g)] = v; return r; }; o.dmg = fix(o.dmg); o.heal = fix(o.heal);
    o.avoid = Object.values(o.avoid).filter((a) => a.n).map((a) => ({ who: name(a.who), spell: a.spell, n: a.n, dmg: Math.round(a.dmg) })).sort((a, b) => b.dmg - a.dmg);
    o.debs = Object.entries(o.debs).map(([spell, b]) => ({ spell, on: b.on, removed: b.removed })); o.ebuffs = Object.entries(o.ebuffs).map(([spell, b]) => ({ spell, on: b.on, removed: b.removed })); }
  // ---- the timer (Nov 1): how close the key was to each upgrade, what the deaths cost, and fighting against the time between pulls. The
  // clock starts 10 s after CHALLENGE_MODE_START (the countdown); the time WoW wrote at the end, less the time that passed, is what deaths added
  // (15 s each at +12 and up on Flex's keys, nothing at +2 to +5), within a second or two, so it's rounded to 5 s ----
  const par = TIMER[lc(run.dungeon)];
  if (par && run.timeMs && run.end != null && !run.left) {
    const T = run.timeMs / 1000, P = par * 60, fight = out.reduce((a, o) => a + o.dur, 0);
    const lost = Math.max(0, Math.round((T - (run.end - 10) - 1) / 5) * 5), deaths = out.reduce((a, o) => a + o.deaths.length, 0);
    const up = (s) => (s <= P * 0.6 ? 3 : s <= P * 0.8 ? 2 : s <= P ? 1 : 0), lv = up(T);
    run.clock = { par: P, time: T, up: lv, next: lv && lv < 3 ? (lv === 1 ? P * 0.8 : P * 0.6) : null, over: lv ? 0 : T - P,
      deathCost: lost, deaths, upWithout: lost ? up(T - lost) : lv, fight: Math.round(fight), between: Math.max(0, Math.round(T - lost - fight)) };
  }
  const thr = out.flatMap((o) => o.through);
  return { run, people, pulls: out, list: !!LIST, casts: { total: casts.length, kicked: casts.filter((c) => c.res === 'kicked').length, stopped: casts.filter((c) => c.res === 'stopped').length,
    through: thr.filter((x) => !x.cc).length, ccThrough: thr.filter((x) => x.cc).length }, avoid: people.reduce((a, p) => a + p.avoid, 0) };
}
// ---- Rotation per pull (Nov 1, Flex: "will this also include rotation break down pull by pull?"): the website's own Rotation checks on each
// pull of the key, as the boss card has them. It needs the website's engine and its specRun (the app has both): each pull's lines, with the
// key's spec lines stamped at the pull's start, read as one fight (1 to 2 seconds for a whole key). A Mythic+ pull isn't a raid pull: potions, raid openers and mana at the end
// aren't judged, and a big cooldown's "uses" count on bosses only (holding one on trash for the next pull is normal). opts.line turns a check
// into the card's short line, opts.icon a spell name into its icon id. Adds o.rot (each player's top 3 fixes and what went well) and
// people[].rot (the fixes that came up most across the key) ----
const plainT = (s) => String(s == null ? '' : s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').trim();
const ROT_SKIP = /^(Opener|Mana at the)|potion/i; /* (a potion is for the big pull or the boss, not every pull: "Combat potions", "Potion with Breath of Eons") */
async function rotation(R, text, W, opts) {
  const E = W.E, o2 = opts || {}, line = o2.line || ((c) => plainT(c.label)), icon = o2.icon || (() => ''), lines = text.split('\n');
  let t0 = null; const ts = new Float64Array(lines.length);
  for (let i = 0; i < lines.length; i++) { const p = E.parseTs(lines[i]); if (!p) { ts[i] = i ? ts[i - 1] : 0; continue; } if (t0 == null) t0 = p.ms; ts[i] = (p.ms - t0) / 1000; }
  const info = lines.filter((l) => l.indexOf('COMBATANT_INFO') > 0), stamp = /^.*?(?=  )/, began = Date.now();
  let i0 = 0;
  for (const o of R.pulls) {
    if (Date.now() - began > (o2.budget || 30000)) break;
    while (i0 < lines.length && ts[i0] < o.s - 1) i0++; let i1 = i0; while (i1 < lines.length && ts[i1] <= o.e + 1) i1++;
    const pe = i1 - i0 > 50 ? E.parseTs(lines[i0]) : null; if (!pe) continue;
    const st = (lines[i0].match(stamp) || [''])[0], seg = info.map((l) => l.replace(stamp, st)).concat(lines.slice(i0, i1)).join('\n');
    const b = { kind: 'pull', startMs: pe.ms, id: 990002, boss: o.boss || 'Pull ' + o.n, diffId: 8, kill: true, duration: o.dur, pull: o.n, dungeon: true };
    let rep = null; try { rep = E.analyze(b, seg, { packs: (W.S && W.S.packs) || E.PACKS, overrides: {} }); } catch (e) { rep = null; }
    if (!rep) continue;
    o.rot = {};
    for (const p of rep.players.values()) {
      if (!p.specName || !p.name) continue;
      let x = null; try { x = W.specRun(p.specName, [rep], p.name, true); } catch (e) { x = null; }
      if (!x || !x.checks) continue;
      const cs = x.checks.filter((c) => c.st && c.st !== 'na' && !/^(st|boss):/.test(String(c.k || '')) && !ROT_SKIP.test(plainT(c.label)) && !(!o.boss && / uses$/i.test(plainT(c.label))));
      const fix = cs.filter((c) => c.st === 'bad' || c.st === 'warn').sort((a, c) => (c.st === 'bad') - (a.st === 'bad') || (c.cost || 0) - (a.cost || 0)).slice(0, 3);
      const ln = (c) => { try { return plainT(line(c)); } catch (e) { return plainT(c.label); } };
      o.rot[short(p.name)] = { fix: fix.map((c) => [c.st, icon(c.ic) || '', plainT(c.label), plainT(c.v), ln(c)]), good: cs.filter((c) => c.st === 'ok' && c.isMain).slice(0, 3).map((c) => plainT(c.label)) };
    }
    await new Promise((r) => setTimeout(r, 0)); /* (the app stays responsive between pulls) */
  }
  // (across the key: each player's fixes by how many pulls they came up in, the worst colour, and the line from the first of them)
  for (const q of R.people) {
    const by = new Map(), seen = R.pulls.filter((o) => o.rot && o.rot[q.name]);
    for (const o of seen) for (const f of o.rot[q.name].fix) { const k = f[2], a = by.get(k) || { st: f[0], ic: f[1], label: k, line: f[4], pulls: [] }; if (f[0] === 'bad') a.st = 'bad'; a.pulls.push(o.n); by.set(k, a); }
    q.rot = seen.length ? { pulls: seen.length, fix: [...by.values()].sort((a, c) => c.pulls.length - a.pulls.length || (c.st === 'bad') - (a.st === 'bad')).slice(0, 4) } : null;
  }
  return R;
}
root.DBF_MPLUS = build;
root.DBF_MPLUS_ROT = rotation;
if (typeof module !== 'undefined') { module.exports = build; module.exports.rotation = rotation; }
})(typeof window !== 'undefined' ? window : globalThis);
