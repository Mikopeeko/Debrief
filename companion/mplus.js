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
// from Flex's keys and each spell's Wowhead text, Nov 1); own: a dodge-list attack aimed at each player in turn, so each player's first hit in a cast is
// their own and only another one counts (Nov 1); pool: a puddle that puts a debuff on whoever stands in it (each landing is one hit). Seen on Flex's keys
// Oct 4 to 31 (Murder Row, The Blinding Vale and Voidscar Arena found by date on Raider.IO), except Den of Nalorakk past its first boss.
// free: hits a player can take in a key before they count, the most 9 in 10 fast runners took (the raid rule, Oct 22).
// Checked Nov 2 against 24 fast runs, 3 a dungeon. What every fast runner takes isn't avoidable, so it's off the list:
// - Kings' Rest's Gilded Destruction (12 of 12, 3 hits each);
// - Voidscar Arena's Poison Splash (12 of 12, 6 or 7) and Void Beam (12 of 12, 1 to 5).
// Den of Nalorakk's Rotten Ground (10 of 12, up to 7) counts past 7.)
const LISTS = {
  'altar of fangs': { kick: ['Piercing Hiss', 'Toxic Atrophy', 'Mass Envenom'], cc: [['Evolve', 'Evolved']],
    dispel: ['Paralyzing Shots', 'Regurgitate', 'Envenom'], purge: ['Ravenous Claws'], dodge: ['Regurgitate', 'Burrowing Charge', 'Axegrinder', 'Septic Spatter'] },
  'murder row': { kick: ['Fel Missiles', 'Seduction', 'Felstorm', 'Fel Rage', 'Health Funnel', 'Chaos Bolt'], chan: ['Health Funnel', 'Fel Missiles', 'Felstorm'],
    dispel: ['Corroding Spittle', 'Heartstop Poison', 'Curse of Doom'], purge: ['Back to Work!'], dodge: ['Legion Strike'] },
  'den of nalorakk': { kick: ['Scavenge', 'Healing Breeze', 'Frigid Roar', 'Winter\'s Shroud', 'Arc Lightning'],
    dispel: ['Insatiable Hunger', 'Toxic Spores', 'Cryo Surge', 'Glacial Torment'], purge: ['Mother\'s Wrath', 'Bestial Wrath'], dodge: ['Earthshatter Slam'], pool: ['Rotten Ground'], free: { 'Rotten Ground': 7 } },
  'the blinding vale': { kick: ['Light Bolt Volley', 'Light Bolt@Kezkitt', 'Disorienting Screech', 'Warden\'s Wrath', 'Lightspore Shot'],
    dispel: ['Bloodthorn Roots'], purge: [], dodge: ['Lightsower Dash', 'Fan of Thorns', 'Lightmaw Beams', 'Belch Spores', "Lightwarden's Blight"] },
  'voidscar arena': { kick: ['Demoralizing Shout', 'Shadowbolt Volley', 'Violent Sand', 'Mad Shriek', 'Mending Void'], chan: ['Mending Void'],
    dispel: ['Melt Armor', 'Corrosive Essence'], purge: ['Bolster'], dodge: ['Nether Dash', 'Unstable Singularity'], own: ['Nether Dash'] }, /* (Nether Dash: "Dodge Other Lines. Targets each player with a line attack.") */
  'ruby life pools': { kick: ['Ice Shield', 'Frigid Shard', 'Fiery Blast', 'Blaze Volley'], chan: ['Ice Shield'],
    dispel: ['Cold Claws', 'Rolling Thunder', 'Stormslam'], purge: ['Blaze of Glory', 'Stormcloud Barrier'], dodge: ['Molten Boulder', 'Roaring Firebreath', 'Flame Breath'] },
  'kings\' rest': { kick: ['Hex Volley', 'Bind Soul', 'Unholy Mending', 'Wretched Discharge', 'Hex', 'Poison Nova', 'Deathly Roar'],
    dispel: ['Lingering Fluid', 'Putrid Seekers', 'Savage Maul'], purge: ['Bound by Shadow', 'Ancestral Fury', 'Bestial Berserk', 'Captain\'s Bulwark', 'Unholy Mending'], dodge: ['Suppression Slam'] },
  'temple of sethraliss': { kick: ['Poisoned Cheap Shot', 'Addle Mind', 'Poison Spit', 'Essence Disruption', 'Flame Shock'], chan: ['Essence Disruption'],
    dispel: ['Cytotoxin', 'Imbued Conduction'], purge: ['Accumulate Charge'], dodge: ['Burrow'], unconf: ['Essence Disruption'] }, /* (Essence Disruption: never seen cast in 9 Temple keys, so not counted until it is (Nov 1)) */
};
// (each dungeon's timer in minutes (Nov 1, Flex: "yea" to the timer story), from Raider.IO's static data for Midnight (its keystone_timer_seconds,
// read from the game), which agrees with the 12.1 final tuning (Icy Veins, Blizzard's Oct 13 post): Altar of Fangs 30, The Blinding Vale 30 and
// Temple of Sethraliss 32 (Nov 1: they were 29, 31 and 33 here, from older pages). Two levels at 80% of the timer and three at 60%, as since
// Battle for Azeroth)
const TIMER = { 'altar of fangs': 30, 'murder row': 34, 'den of nalorakk': 32, 'the blinding vale': 30, 'voidscar arena': 30, 'kings\' rest': 33, 'temple of sethraliss': 32, 'ruby life pools': 28 };
const lc = (s) => String(s || '').toLowerCase().replace(/[’`]/g, '\'');
// (how dangerous each must-kick is when it goes off (Nov 1, the Design studio's table, Flex: "Yes, send it"): from the 12.1.5 Wowhead overviews and
// how much each one hurt in 33 of Flex's keys, every one seen interrupted by a player. high: heals enemies, hits the whole group, takes players out or
// makes an enemy tough; low: small hits or mechanics; anything else on the list is medium (weakens the group, or one big hit on one player))
const DANGER = {
  'altar of fangs': { high: ['Mass Envenom'] },
  'murder row': { high: ['Seduction', 'Fel Rage', 'Health Funnel'], low: ['Fel Missiles', 'Felstorm'] },
  'den of nalorakk': { high: ['Healing Breeze', 'Winter\'s Shroud'], low: ['Scavenge'] },
  'the blinding vale': { high: ['Light Bolt Volley', 'Disorienting Screech'], low: ['Lightspore Shot', 'Warden\'s Wrath'] },
  'voidscar arena': { high: ['Shadowbolt Volley', 'Violent Sand', 'Mad Shriek', 'Mending Void'] },
  'ruby life pools': { high: ['Ice Shield', 'Blaze Volley'] },
  'kings\' rest': { high: ['Hex Volley', 'Bind Soul', 'Unholy Mending', 'Wretched Discharge', 'Hex', 'Poison Nova', 'Deathly Roar'] },
  'temple of sethraliss': { high: ['Poisoned Cheap Shot', 'Addle Mind'], low: ['Essence Disruption'] },
};
const listFor = (dungeon) => { const L = LISTS[lc(dungeon)]; if (!L) return null; const S = (a) => new Set((a || []).map(lc)), D = DANGER[lc(dungeon)] || {};
  return { kick: S(L.kick), chan: S(L.chan), ccCast: new Map((L.cc || []).map(([c, r]) => [lc(r), c])), dispel: S(L.dispel), purge: S(L.purge), dodge: S(L.dodge), own: S(L.own), pool: S(L.pool), free: new Map(Object.entries(L.free || {}).map(([k, v]) => [lc(k), v])), unconf: S(L.unconf), high: S(D.high), low: S(D.low) }; };
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
  const mobHp = new Map(), spawned = new Set(); // enemy guid -> its most health seen; enemies an enemy summoned (a mechanic's wave, never a pack of their own)
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
    if (e === 'SPELL_SUMMON' && isNpc(f[0])) { spawned.add(f[4]); continue; }
    const sg = f[0], sn = f[1], dg = f[4], dn = f[5];
    // (the owner of a pet or a guardian: from a summon, or the advanced block's owner field)
    const ownerOf = (adv) => (isPlayer(sg) ? sg : owners.get(sg) || (f.length >= adv + ADV && f[adv] === sg && isPlayer(f[adv + 1]) ? f[adv + 1] : null));
    switch (e) {
      case 'SPELL_DAMAGE': case 'SPELL_PERIODIC_DAMAGE': case 'RANGE_DAMAGE': case 'SWING_DAMAGE': {
        const swing = e === 'SWING_DAMAGE', adv = swing ? 8 : 11; if (f.length < adv + 8) break;
        const hasAdv = f.length >= adv + ADV + 8, s0 = adv + (hasAdv ? ADV : 0);
        const amt = Math.max(0, num(f[s0]) + num(f[s0 + 4]) + num(f[s0 + 5]) - Math.max(0, num(f[s0 + 2])));
        const ow = ownerOf(adv);
        if (ow && isNpc(dg)) { if (isPlayer(sg)) P(sg, sn); ev.push([t, 'dmg', ow, amt, dg, dn]); if (hasAdv && f[adv] === dg) { const m = num(f[adv + 3]); if (m > (mobHp.get(dg) || 0)) mobHp.set(dg, m); } } /* (the advanced block is the enemy hit: its max health) */
        else if (isNpc(sg) && isPlayer(dg)) ev.push([t, 'hit', dg, amt, swing ? 'Melee' : f[9], sn, sg, e === 'SPELL_PERIODIC_DAMAGE', swing ? '' : f[8]]); /* (x[8]: the spell id, for its icon (Nov 1)) */
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
  // ---- pulls: bosses are their own; trash starts when new enemies are engaged after the last pack is dead, or after a 4 s lull, or 20 s or
  // more after the pull last took on new enemies even with stragglers still alive (Nov 2, Flex: "theres times where youre saying they pulled 51
  // mobs at a time": one straggler kept the old pull open, so the next packs piled into it, Blinding Vale's first "pull" 66 enemies over 4½
  // minutes). Packs dragged together within seconds stay one pull. An enemy counts in the pull it joined, not again in the next ----
  // (the studio's audit of that, Nov 2: a pack isn't over while its main enemy (the most health) is alive or more than a quarter of it is; Raj'kess's
  // orbs come in waves and had split his pack in two. An enemy another enemy summoned never starts a pull)
  const PULL_GAP = 20, pulls = [], alive = new Set(), seen = new Set(); let cur = null, last = -1e9;
  const inEnc = (t) => encs.find((x) => t >= x.s - 1 && t <= (x.e == null ? 1e9 : x.e + 1));
  const hitAt = new Map(), busy = (g, t) => alive.has(g) && t - (hitAt.get(g) || -1e9) <= 10; /* (alive and hit in the last 10 s: an enemy that never logs its death doesn't hold a pack open) */
  const settled = (c, t) => !busy(c.main, t) && [...c.own].filter((g) => busy(g, t)).length <= c.own.size / 4;
  for (const x of ev) {
    const t = x[0];
    if (x[1] === 'mobdied') { alive.delete(x[2]); continue; }
    let mob = null; if (x[1] === 'dmg') mob = [x[4], x[5]]; else if (x[1] === 'hit') mob = [x[6], x[5]]; if (!mob) continue;
    const boss = inEnc(t), isNew = !seen.has(mob[0]), wave = spawned.has(mob[0]) && cur && !cur.enc;
    if (boss) { if (!cur || cur.enc !== boss) { cur = { s: boss.s, e: boss.e || t, enc: boss, mobs: new Map(), hit: new Set() }; pulls.push(cur); } }
    else if (isNew && !wave && (!cur || cur.enc || alive.size === 0 || t - last > 4 || (t - cur.nw >= PULL_GAP && settled(cur, t)))) { cur = { s: t, e: t, enc: null, mobs: new Map(), hit: new Set(), own: new Set(), main: null, nw: t, chain: !!cur && !cur.enc && alive.size > 0 && t - last <= 4 }; pulls.push(cur); } /* (chain: joined while the fighting went on, no lull) */
    if (isNew) { seen.add(mob[0]); alive.add(mob[0]); if (!cur.enc && !spawned.has(mob[0])) { cur.nw = t; cur.own.add(mob[0]); if (!cur.main || (mobHp.get(mob[0]) || 0) > (mobHp.get(cur.main) || 0)) cur.main = mob[0]; } }
    cur.hit.add(mob[0]); hitAt.set(mob[0], t); /* (every enemy hit in it, leftovers too: the stray fold below judges by these, as before) */
    if (cur.enc || isNew) { if (!cur.mobs.has(mob[1])) cur.mobs.set(mob[1], new Set()); cur.mobs.get(mob[1]).add(mob[0]); }
    if (!boss) cur.e = Math.max(cur.e, t); last = t;
  }
  // (a pack of one stray enemy hit for a few seconds is folded into the pull before it, and so are one or two that joined a pull still going:
  // a patrol or a straggler, not a pull of their own. A lone elite pulled with nothing else alive stays its own pull. A stray that came more than
  // 4 s after the pull had ended doesn't stretch it (Nov 3: Voidscar's second Watchful Harrower swung at Horoba 25 s after pull 6, during a skip,
  // and made pull 6 half a minute longer))
  for (let i = pulls.length - 1; i > 0; i--) { const p = pulls[i]; const n = [...p.mobs.values()].reduce((a, s) => a + s.size, 0); if (!p.enc && ((p.hit.size <= 1 && p.e - p.s < 8) || (p.chain && n <= 2))) { const q = pulls[i - 1]; for (const [k, v] of p.mobs) { if (!q.mobs.has(k)) q.mobs.set(k, new Set()); for (const g of v) q.mobs.get(k).add(g); } if (p.s - q.e <= 4) q.e = Math.max(q.e, p.e); pulls.splice(i, 1); } }
  const pullOf = (t) => { for (let i = pulls.length - 1; i >= 0; i--) if (t >= pulls[i].s - 2) return i; return 0; };
  // ---- casts: kicked, stopped, finished or cut short ----
  const casts = [], open = new Map();
  const kicks = ev.filter((x) => x[1] === 'kick'), ccs = ev.filter((x) => x[1] === 'cc');
  for (const x of ev) {
    if (x[1] === 'start') { const k = x[2] + '|' + x[4]; const c = { t: x[0], guid: x[2], mob: x[3], id: x[4], spell: x[5], res: 'cut' }; casts.push(c); open.set(k, c); }
    else if (x[1] === 'done') { const c = open.get(x[2] + '|' + x[4]); if (c && x[0] - c.t < 12) { c.res = 'done'; c.end = x[0]; open.delete(x[2] + '|' + x[4]); }
      else if (LIST && LIST.chan.has(lc(x[5]))) casts.push({ t: x[0], guid: x[2], mob: x[3], id: x[4], spell: x[5], res: 'chan' }); } /* (a must-kick channel started) */
  }
  // (each kick, then each CC, stops one cast: the newest one that enemy began before it (an enemy has one cast open at a time, so an older cast it
  // began again over stays 'cut'). A kick takes the newest unclaimed cast of the spell it interrupted, within 6 s (8 for a channel); a CC takes the
  // enemy's newest cast if it's still open, within 4 s. Before (Nov 2): a cast start written twice took one kick twice (Hansso's 14 read 15), and then
  // a kick went to the oldest match, so the cast it really stopped fell through to a CC (the addon chat's catch: Den +19, 17 stops read 22))
  const byG = new Map(); for (const c of casts) { if (!byG.has(c.guid)) byG.set(c.guid, []); byG.get(c.guid).push(c); }
  for (const k of kicks) { let best = null; for (const c of byG.get(k[4]) || []) if (!c.claimed && c.res !== 'done' && c.id === k[6] && c.t <= k[0] + 0.1 && k[0] <= c.t + (c.res === 'chan' ? 8 : 6) && (!best || c.t >= best.t)) best = c;
    if (best) { k.used = true; best.claimed = true; best.res = 'kicked'; best.by = k[2]; best.with = k[3]; best.at = k[0]; } }
  for (const k of ccs) { let last = null; for (const c of byG.get(k[4]) || []) if (c.t <= k[0] + 0.2 && (!last || c.t >= last.t)) last = c;
    if (last && !last.claimed && last.res !== 'done' && k[0] <= last.t + 4) { last.claimed = true; last.res = 'stopped'; last.by = k[2]; last.with = k[3]; last.at = k[0]; } }
  for (const c of casts) if (c.res === 'chan') c.res = 'done';
  // (must-kick: the dungeon's list; without one, a spell somebody deliberately kicked at least once this key (an area stun alone doesn't make one))
  const kickedIds = new Set(casts.filter((c) => c.res === 'kicked').map((c) => c.id));
  const danger = (c) => (LIST ? (LIST.kick.has(lc(c.spell)) || LIST.kick.has(lc(c.spell) + '@' + lc(c.mob))) && !LIST.unconf.has(lc(c.spell)) : kickedIds.has(c.id)); /* ("Spell@Caster": only from that enemy) */
  // (each must-kick's tier, from DANGER (Nov 1, the Design studio's table; Flex: "Yes, send it"): high, low, or medium for the rest; a dungeon
  // without lists keeps every kicked spell high, as before. How many enemies a spell came from is kept for the wording, "from 30 Lightspawn Lashers")
  const tierOf = (c) => { if (!LIST) return 'high'; const s = lc(c.spell), sm = s + '@' + lc(c.mob); return LIST.high.has(s) || LIST.high.has(sm) ? 'high' : LIST.low.has(s) || LIST.low.has(sm) ? 'low' : 'medium'; };
  const bySpell = new Map();
  for (const c of casts) if (danger(c)) { const k = lc(c.spell), b = bySpell.get(k) || { ts: [], guids: new Set() }; b.ts.push(c.t); b.guids.add(c.guid); bySpell.set(k, b); }
  // (whose kick was ready when a must-kick cast went off: each player's interrupts for their spec, from the engine, and when they last pressed
  // them. A cast that got through with nobody's kick ready isn't a mistake (Nov 1))
  const kickNames = new Map(); for (const p of players.values()) { const l = ((E.INTERRUPTS || {})[p.cls] || []).filter((k) => !k[2] || k[2].includes(p.specId)); if (l.length) kickNames.set(p.guid, l); }
  const pressed = new Map(); for (const x of ev) if (x[1] === 'cast' && kickNames.has(x[2]) && kickNames.get(x[2]).some((k) => k[0] === x[4])) { if (!pressed.has(x[2])) pressed.set(x[2], []); pressed.get(x[2]).push([x[0], x[4]]); }
  // (the fair count (Nov 1): a kick counted against a cast that went off is used for its cooldown, as if pressed; the kick that sat ready longest goes first)
  const vPressed = new Map(), lastUse = (g, k, t) => { let u = null; for (const m of [pressed, vPressed]) for (const q of m.get(g) || []) if (q[1] === k[0] && q[0] < t && (u == null || q[0] > u)) u = q[0]; return u; };
  const readyNow = (t) => { const r = []; for (const [g, l] of kickNames) { let best = null; for (const k of l) { const u = lastUse(g, k, t); if (u == null || t - u >= k[1]) { const since = u == null ? -1e9 : u + k[1]; if (!best || since < best.since) best = { g, k, since }; } } if (best) r.push(best); } return r.sort((a, b) => a.since - b.since); };
  // ---- per pull ----
  const defIds = new Map(); for (const [cls, list] of Object.entries(E.DEFENSIVES || {})) for (const d of list) defIds.set(d[1], d[0]);
  // (what a pull fought (Nov 2, the Design studio's pull-accuracy fix): only enemies the group damaged. One that only swung at someone passing
  // by (Voidscar's second Watchful Harrower) or that no player hits (Taz'Rah's Ethereal Shades) still shapes the pulls, but isn't listed)
  const dmgd = new Set(); for (const x of ev) if (x[1] === 'dmg') dmgd.add(x[4]);
  const out = pulls.map((p, i) => ({ n: i + 1, s: p.s, e: p.e, boss: p.enc ? p.enc.boss : null, kill: p.enc ? !!p.enc.kill : null,
    mobs: [...p.mobs].map(([n, g]) => [n, [...g].filter((x) => dmgd.has(x)).length]).filter((m) => m[1]).sort((a, b) => b[1] - a[1]), dmg: {}, heal: {}, kicks: [], stops: [], through: [], minor: [], deaths: [], defs: [], dispels: [], purges: [],
    avoid: {}, debs: {}, ebuffs: {} }));
  const addTo = (o, k, v) => { o[k] = (o[k] || 0) + v; }, avoidOf = (o, who, spell) => o.avoid[who + '|' + spell] || (o.avoid[who + '|' + spell] = { who, spell, n: 0, dmg: 0, ts: [] });
  // (one cast that lands on every non-tank in the group, its hits within 1 s, is damage nobody could dodge: not a mistake for anyone (Nov 2, Flex: "Mechanics
  // still being marked as avoidable when they are not avoidable", Kings' Rest's Gilded Destruction))
  const allHit = new Set(); if (LIST) { const nt = [...players.values()].filter((p) => p.role !== 'tank').length, open = new Map(), shut = (c) => { if (c && nt && c.who.size >= nt) for (const x of c.xs) allHit.add(x); };
    for (const x of ev) { if (x[1] !== 'hit' || x[7] || !LIST.dodge.has(lc(x[4])) || (players.get(x[2]) || {}).role === 'tank') continue; const k = lc(x[4]), c = open.get(k);
      if (c && x[0] - c.t0 <= 1) { c.who.add(x[2]); c.xs.push(x); } else { shut(c); open.set(k, { t0: x[0], who: new Set([x[2]]), xs: [x] }); } }
    for (const c of open.values()) shut(c); }
  const seenN = new Map(), counts = (x) => { const k = x[2] + '|' + lc(x[4]), n = (seenN.get(k) || 0) + 1; seenN.set(k, n); return n > (LIST.free.get(lc(x[4])) || 0); }; /* (past the spell's free hits for this key) */
  const recent = new Map(), inPool = new Set(), lastHit = new Map(), ownAt = new Map(); // player -> last hits; player|puddle stepped into, not ticked yet; player|spell -> its last hit; player|spell -> their own line's hit
  for (const x of ev) {
    const pi = pullOf(x[0]), o = out[pi]; if (!o) continue;
    if (x[1] === 'dmg') addTo(o.dmg, x[2], x[3]);
    else if (x[1] === 'heal') addTo(o.heal, x[2], x[3]);
    else if (x[1] === 'hit') { const l = recent.get(x[2]) || []; l.push([x[0], x[4], x[5], x[3]]); if (l.length > 6) l.shift(); recent.set(x[2], l);
      /* (avoidable damage: a dodge-list spell's direct hit (not the damage-over-time some leave) on anyone but a tank, who may be standing in a frontal on purpose;
         a beam or breath that hits every second while you stand in it is one hit until you're out of it for 1.6 s (Nov 1)) */
      if (LIST && (players.get(x[2]) || {}).role !== 'tank') { if (!x[7] && LIST.dodge.has(lc(x[4])) && LIST.own.has(lc(x[4])) && !(ownAt.get(x[2] + '|' + lc(x[4])) > x[0] - 8)) ownAt.set(x[2] + '|' + lc(x[4]), x[0]); /* (their own line this cast: not a mistake) */
      else if (!x[7] && LIST.dodge.has(lc(x[4])) && !allHit.has(x)) { const a = avoidOf(o, x[2], x[4]); if (!a.id && x[8]) a.id = x[8]; const k = x[2] + '|' + lc(x[4]); if (!(lastHit.get(k) > x[0] - 1.6) && counts(x)) { a.n++; a.ts.push(+x[0].toFixed(1)); } lastHit.set(k, x[0]); a.dmg += x[3]; } else if (x[7] && LIST.pool.has(lc(x[4]))) { const a = avoidOf(o, x[2], x[4]), k = x[2] + '|' + lc(x[4]); if (inPool.has(k)) { inPool.delete(k); if (counts(x)) { a.n++; a.ts.push(+x[0].toFixed(1)); } } a.dmg += x[3]; } } }
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
      o.deaths.push({ t: x[0], who: x[2], to: top ? top[1] : 'unknown', from: top ? top[2] : '', defs: out.flatMap((q) => q.defs).filter((d) => d.who === x[2] && x[0] - d.t < 30).length, ...(x[0] > o.e + 2 ? { gap: true } : {}) }); } /* (gap: after the pull had ended, before the next one (a skip, a walk): counted for the key, not for the pull) */
  }
  const sorted = casts.slice().sort((a, b) => a.t - b.t);
  for (const c of sorted) {
    const o = out[pullOf(c.t)]; if (!o) continue;
    if (danger(c) && tierOf(c) === 'low') { const m = o.spamM || (o.spamM = new Map()), b = m.get(c.spell) || { spell: c.spell, id: c.id, casts: 0, kicked: 0, stopped: 0, guids: new Set(), mobs: new Map() };
      b.casts++; if (c.res === 'kicked') b.kicked++; else if (c.res === 'stopped') b.stopped++; b.guids.add(c.guid); b.mobs.set(c.mob, (b.mobs.get(c.mob) || 0) + 1); m.set(c.spell, b); }
    if (c.res === 'kicked') o.kicks.push({ t: c.at, who: c.by, with: c.with, spell: c.spell, mob: c.mob, id: c.id });
    else if (c.res === 'stopped') o.stops.push({ t: c.at, who: c.by, with: c.with, spell: c.spell, mob: c.mob, id: c.id });
  }
  // (a kick with no cast start to pair it with (the cast began before the log saw it) is still a kick, so Your group and the map agree: Temple's
  // Shrouded Fang, kicked 0:13 in (Nov 2))
  for (const k of kicks) if (!k.used) { const o = out[pullOf(k[0])]; if (o) o.kicks.push({ t: k[0], who: k[2], with: k[3], spell: k[7], mob: k[5], id: k[6] }); }
  // (the fair count: high casts first, so a kick isn't spent on a lesser cast in the counting, then medium; who: the kick it's counted against; ready:
  // every kick that was still ready; id: the spell's icon. High ones that went off are mistakes (through); medium ones are a note (minor))
  for (const tier of ['high', 'medium']) for (const c of sorted) {
    const o = out[pullOf(c.t)]; if (!o || c.res !== 'done' || !danger(c) || tierOf(c) !== tier) continue;
    const rd = readyNow(c.t); if (!rd.length) continue; const w = rd[0]; if (!vPressed.has(w.g)) vPressed.set(w.g, []); vPressed.get(w.g).push([c.t, w.k[0]]);
    (tier === 'high' ? o.through : o.minor).push({ t: c.t, spell: c.spell, mob: c.mob, ready: rd.map((r) => r.g), who: w.g, id: c.id });
  }
  // (kick when you can, per pull: each pack spell's casts, how many were kicked or stopped, from how many enemies)
  const spamOut = (m) => [...m.values()].map((b) => ({ spell: b.spell, id: b.id, casts: b.casts, kicked: b.kicked, stopped: b.stopped, enemies: b.guids.size, mob: [...b.mobs].sort((x, y) => y[1] - x[1])[0][0] })).sort((a, b) => b.casts - a.casts);
  for (const o of out) { o.spam = o.spamM ? spamOut(o.spamM) : []; delete o.spamM; }
  for (const o of out) { const d = Math.max(1, o.e - o.s); o.dur = d; for (const k of ['dmg', 'heal']) for (const g of Object.keys(o[k])) o[k][g] = Math.round(o[k][g] / d); o.through.sort((a, b) => a.t - b.t); o.minor.sort((a, b) => a.t - b.t); }
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
  for (const o of out) for (const x of o.through.concat(o.minor)) { x.ready = x.ready.map(name); if (x.who) x.who = name(x.who); }
  for (const o of out) { const fix = (m) => { const r = {}; for (const [g, v] of Object.entries(m)) r[name(g)] = v; return r; }; o.dmg = fix(o.dmg); o.heal = fix(o.heal);
    o.avoid = Object.values(o.avoid).filter((a) => a.n).map((a) => ({ who: name(a.who), spell: a.spell, n: a.n, dmg: Math.round(a.dmg), id: a.id || '', ts: a.ts })).sort((a, b) => b.dmg - a.dmg);
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
  // (kick when you can, for the whole key: the low-danger kicks summed over the pulls; tiers: each must-kick seen, "high", "medium" or "low")
  const KS = new Map(); for (const o of out) for (const x of o.spam) { const b = KS.get(x.spell) || { spell: x.spell, id: x.id, casts: 0, kicked: 0, stopped: 0, enemies: 0, mob: x.mob }; b.casts += x.casts; b.kicked += x.kicked; b.stopped += x.stopped; KS.set(x.spell, b); }
  for (const b of KS.values()) b.enemies = (bySpell.get(lc(b.spell)) || { guids: new Set() }).guids.size;
  const tiers = {}; for (const c of casts) if (danger(c)) tiers[c.spell] = tierOf(c); /* (high, medium or low (Nov 1)) */
  return { run, people, pulls: out, list: !!LIST, spam: [...KS.values()].sort((a, b) => b.casts - a.casts), tiers, casts: { total: casts.length, kicked: casts.filter((c) => c.res === 'kicked').length, stopped: casts.filter((c) => c.res === 'stopped').length,
    through: thr.filter((x) => !x.cc).length, ccThrough: thr.filter((x) => x.cc).length, minor: out.reduce((a, o) => a + o.minor.length, 0) }, avoid: people.reduce((a, p) => a + p.avoid, 0) };
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
      const bt = (c) => { try { return o2.bits ? o2.bits(c, o.s) : null; } catch (e) { return null; } }; /* (what happened, the fix, the bar and the moments (Nov 1)) */
      o.rot[short(p.name)] = { fix: fix.map((c) => { const b = bt(c); return b ? [c.st, icon(c.ic) || '', plainT(c.label), plainT(c.v), [b.what, b.why].filter(Boolean).join(' '), b.tip, b.aim, b.mom.join(';')] : [c.st, icon(c.ic) || '', plainT(c.label), plainT(c.v), ln(c)]; }), good: cs.filter((c) => c.st === 'ok' && c.isMain).slice(0, 3).map((c) => plainT(c.label)) };
    }
    await new Promise((r) => setTimeout(r, 0)); /* (the app stays responsive between pulls) */
  }
  // (across the key: each player's fixes by how many pulls they came up in, the worst colour, and the line from the first of them)
  for (const q of R.people) {
    const by = new Map(), seen = R.pulls.filter((o) => o.rot && o.rot[q.name]);
    for (const o of seen) for (const f of o.rot[q.name].fix) { const k = f[2], a = by.get(k) || { st: f[0], ic: f[1], label: k, line: f[4], tip: f[5] || '', aim: f[6] || '', pulls: [] }; if (f[0] === 'bad') a.st = 'bad'; a.pulls.push(o.n); by.set(k, a); }
    q.rot = seen.length ? { pulls: seen.length, fix: [...by.values()].sort((a, c) => c.pulls.length - a.pulls.length || (c.st === 'bad') - (a.st === 'bad')).slice(0, 4) } : null;
  }
  return R;
}
root.DBF_MPLUS = build;
root.DBF_MPTIMER = TIMER; // (the main window's key timer (round 482): each dungeon's time limit in minutes)
root.DBF_MPLUS_ROT = rotation;
if (typeof module !== 'undefined') { module.exports = build; module.exports.rotation = rotation; }
})(typeof window !== 'undefined' ? window : globalThis);
