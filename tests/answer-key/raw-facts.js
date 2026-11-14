// The answer key's raw reader (Nov 13, the accuracy plan; the guide: notes/Guides/Answer key - how it works.md).
// It reads one pull's Warcraft Logs events and writes down plain facts, WITHOUT any of the site's code (no engine.js, wcl.js or ui.js),
// so the answer key stays independent of what it checks. Every fact says below how it is read from the log.
//   const { rawFacts } = require('./raw-facts.js'); rawFacts(report, { start, end, events })  ->  facts
// Times are seconds from the pull's start. Names are the players' names as the report lists them.
'use strict';
const TANKS = new Set([73, 66, 250, 104, 581, 268]), HEALERS = new Set([65, 256, 257, 264, 105, 270, 1468]);
// Spell ids of The Coiled Altar (encounter 3429), read from the events themselves (each id's name is in the report's ability list).
const CA = {
  frontal: { 1299684: 'Sever', 1286620: 'Soul Sever', 1307292: 'Blighted Sever' }, frontalDebuff: { 1301690: 'Sever', 1307959: 'Soul Sever', 1307403: 'Blighted Sever' },
  dreadCast: 1285643, dread: 1297445, ghostSummon: 1285844, fixate: 1285911, resonance: 1310744,
  rupture: 1299838, purpleCarry: 1310498, greenCarry: 1282419, purpleSpawn: 1310544, greenSpawn: 1299781, deluge: 1299960,
  gloomCast: 1310882, gloom: 1310881, gloomHit: 1310883, grave: 1286837, graveHit: 1308330,
  noxious: 1283290, venomfang: 1306906, wail: 1286399, addSummon: 1286498, spiritShield: 1309105,
  guil: { 1283594: 'Guillotine', 1299296: 'Grim Guillotine' }, guilTarget: { 1283485: 'Guillotine', 1299266: 'Grim Guillotine' }, kiss: { 1283623: "Widow's Kiss", 1299396: "Death's Embrace" }, execution: { 1299301: 'Grim Execution' },
  axe: 1285017, nightfall: 1286918, veil: 1286912, regen: 1304033, fragHeal: 1287718, erasure: 1287722,
};
// Personal defensives by name with their base cooldown in seconds (from the spells' tooltips; talents can shorten some). Used only to say what a
// player had pressed before a death; the key gives no verdict on deaths yet.
const DEFS = { 'Divine Shield': 300, 'Divine Protection': 60, 'Lay on Hands': 420, 'Blessing of Protection': 300, 'Shield of Vengeance': 90, 'Ardent Defender': 120, 'Guardian of Ancient Kings': 300,
  'Shield Wall': 180, 'Last Stand': 180, 'Die by the Sword': 120, 'Enraged Regeneration': 120, 'Rallying Cry': 180,
  'Icebound Fortitude': 120, 'Anti-Magic Shell': 40, 'Death Pact': 120, 'Lichborne': 120, 'Vampiric Blood': 90, 'Dancing Rune Weapon': 120,
  'Obsidian Scales': 90, 'Renewing Blaze': 90, 'Aspect of the Turtle': 180, 'Exhilaration': 120, 'Survival of the Fittest': 120,
  'Ice Block': 240, 'Ice Cold': 240, 'Greater Invisibility': 120, 'Mirror Image': 120, 'Alter Time': 50,
  'Cloak of Shadows': 120, 'Evasion': 120, 'Crimson Vial': 30, 'Blur': 60, 'Netherwalk': 180, 'Fiery Brand': 60, 'Metamorphosis': 180,
  'Astral Shift': 120, 'Stone Bulwark Totem': 180, 'Barkskin': 60, 'Renewal': 90, 'Survival Instincts': 180, 'Desperate Prayer': 90, 'Dispersion': 120,
  'Fortifying Brew': 120, 'Diffuse Magic': 90, 'Touch of Karma': 90, 'Dampen Harm': 120, 'Unending Resolve': 180, 'Dark Pact': 60 };
// Shields that only stop a killing blow (the site leaves them out of healing done; kept apart as absorbCheat).
const CHEAT = /^(Cheat Death|Purgatory)$/;
// Raid cooldowns by name (the ones a healing plan is built from): every cast is written down with who and when.
const RAID_CDS = new Set(['Aura Mastery', 'Divine Hymn', 'Rewind', 'Dream Flight', 'Spirit Link Totem', 'Healing Tide Totem', 'Tranquility', 'Revival', 'Restoral', 'Power Word: Barrier', 'Darkness', 'Anti-Magic Zone', 'Rallying Cry', 'Zephyr']);
// Combat potions by name. Each was seen used at the pull and again five minutes later (the potions' shared cooldown) on these nights.
const COMBAT_POTS = /^(Potion of Recklessness|Light's Potential|Liquid Luster)$/;
const r2 = (x) => Math.round(x * 100) / 100, r1 = (x) => Math.round(x * 10) / 10;
// Spells that move a player at once (a blink, a teleport, a leap): the log's position for them lags by a moment.
const MOVES = /^(Shimmer|Blink|Displacement|Demonic Circle: Teleport|Transcendence: Transfer|Door of Shadows|Disengage|Heroic Leap|Wild Charge|Fel Rush|Infernal Strike|Vengeful Retreat|Death's Advance|Roll|Chi Torpedo|Tiger Dash|Dash|Divine Steed|Sprint|Shadowstep|Charge|Intervene|Hover|Spatial Paradox|Gorefiend's Grasp|Leap of Faith|Rescue)$/;

function rawFacts(rep, P) {
  const ev = P.events, t0 = P.start, len = (P.end - P.start) / 1000, s = (t) => r2((t - t0) / 1000);
  const A = new Map(rep.masterData.actors.map((a) => [a.id, a])), AB = new Map(rep.masterData.abilities.map((a) => [a.gameID, a.name]));
  const isP = (id) => (A.get(id) || {}).type === 'Player', nm = (id) => (A.get(id) || {}).name || '#' + id, an = (id) => AB.get(id) || String(id);
  const ownerOf = (id) => { let a = A.get(id), n = 0; while (a && a.type !== 'Player' && a.petOwner != null && n++ < 4) a = A.get(a.petOwner); return a && a.type === 'Player' ? a.id : null; };
  const friendly = (id) => isP(id) || ownerOf(id) != null;
  const F = rep.fights.find((f) => f.id === P.fight) || {};
  // ---- who is in the pull: the players with a combatant record at the pull's start ----
  const info = new Map(); for (const e of ev) if (e.type === 'combatantinfo' && isP(e.sourceID)) info.set(e.sourceID, e);
  const ids = [...info.keys()], roleOf = (id) => { const sp = (info.get(id) || {}).specID; return TANKS.has(sp) ? 'tank' : HEALERS.has(sp) ? 'healer' : 'dps'; };
  const pl = {}; for (const id of ids) pl[nm(id)] = { spec: info.get(id).specID, role: roleOf(id), dmg: 0, dmgShield: 0, heal: 0, absorb: 0, overheal: 0, alive: 0 };
  const get = (id) => pl[nm(id)];
  // ---- flask, food, runes at the pull's start: the auras in each player's combatant record, by name ----
  const prep = {}; for (const id of ids) { const au = (info.get(id).auras || []).filter((a) => a.ability !== 97821 /* (Void-Touched, the mark Raise Ally leaves: not the rune's buff of the same name, 1264426) */).map((a) => a.name || an(a.ability));
    prep[nm(id)] = { flask: au.find((n) => /^Flask of /.test(n) || /Phial/.test(n)) || null, food: au.find((n) => /Well Fed/.test(n)) || null, rune: au.find((n) => /( Augmentation|^Void-Touched)$/.test(n)) /* (any augment rune's buff: Ethereal, Draconic, Soulgorged ... Augmentation, and the Void-Touched rune's) */ || null, vantus: au.filter((n) => /^Vantus Rune/.test(n)).length }; }
  // ---- one pass: totals, deaths, health samples, casts ----
  const hp = new Map(ids.map((id) => [id, []])), lastHits = new Map(ids.map((id) => [id, []])), deathsRaw = [], rez = [], casts = new Map(ids.map((id) => [id, []]));
  const mxHp = new Map(), fearSp = []; { const open = new Map(); for (const e of ev) { if (e.abilityGameID !== CA.wail) continue; if (e.type === 'applydebuff') open.set(e.targetID, e.timestamp); else if (e.type === 'removedebuff' && open.has(e.targetID)) { fearSp.push([e.targetID, open.get(e.targetID), e.timestamp]); open.delete(e.targetID); } } for (const [id, a] of open) fearSp.push([id, a, P.end]); }
  const lastPos = new Map();
  const bossHp = {}, dead = new Map(), aliveCut = new Map(ids.map((id) => [id, 0])), diedAt = new Map();
  const consum = {}; const useC = (id, kind, t, name) => { const o = consum[nm(id)] || (consum[nm(id)] = { pot: [], stone: [], healpot: [], manapot: [] }); o[kind].push([s(t), name]); };
  for (const e of ev) {
    const ty = e.type;
    if (e.x != null && e.resourceActor) { const idp = e.resourceActor === 2 ? e.targetID : e.sourceID; if (hp.has(idp)) lastPos.set(idp, [e.timestamp, e.x / 100, e.y / 100]); }
    if (e.hitPoints != null && e.maxHitPoints) { const id = e.resourceActor === 2 ? e.targetID : e.sourceID, v = e.hitPoints / e.maxHitPoints;
      if (hp.has(id)) { hp.get(id).push([e.timestamp, v]); mxHp.set(id, e.maxHitPoints); } else { const n = nm(id); if (n === "Zul'jan" || n === 'Hex Lord Malacrass' || n === F.name) bossHp[n] = [s(e.timestamp), r2(100 * v)]; } }
    if (ty === 'damage') { const tot = (e.amount || 0) + (e.absorbed || 0);
      if (e.subtractsFromSupportedActor && e.supportID != null && !friendly(e.targetID)) { const sp = isP(e.supportID) ? e.supportID : ownerOf(e.supportID); if (sp != null && get(sp)) { get(sp).dmg -= e.amount || 0; get(sp).dmgShield -= e.absorbed || 0; /* (the shield-absorbed part of the share is on their own event too: Urgdragon, Nov 11 pull 10) */ } }
      if (hp.has(e.targetID)) { const l = lastHits.get(e.targetID); l.push([e.timestamp, e.abilityGameID, tot, e.overkill || 0, e.sourceID, e.hitPoints != null && e.maxHitPoints ? e.hitPoints / e.maxHitPoints : null]); if (l.length > 40) l.splice(0, 20); }
      const w = isP(e.sourceID) ? e.sourceID : ownerOf(e.sourceID); if (w != null && get(w) && !friendly(e.targetID)) { get(w).dmg += e.amount || 0; get(w).dmgShield += e.absorbed || 0; } }
    else if (ty === 'heal') { const w = isP(e.sourceID) ? e.sourceID : ownerOf(e.sourceID); if (w != null && get(w)) { get(w).heal += (e.amount || 0) + (e.absorbed || 0); get(w).overheal += e.overheal || 0; } }
    else if (ty === 'absorbed') { const w = isP(e.sourceID) ? e.sourceID : ownerOf(e.sourceID); if (w != null && get(w)) { if (CHEAT.test(an(e.abilityGameID))) get(w).absorbCheat = (get(w).absorbCheat || 0) + (e.amount || 0); else get(w).absorb += e.amount || 0; } }
    else if (ty === 'cast' && hp.has(e.sourceID)) { const n = an(e.abilityGameID); casts.get(e.sourceID).push([e.timestamp, n]);
      if (/^(Demonic )?Healthstone$/.test(n)) useC(e.sourceID, 'stone', e.timestamp, n); else if (/Health(ing)? Potion/.test(n)) useC(e.sourceID, 'healpot', e.timestamp, n); else if (COMBAT_POTS.test(n)) useC(e.sourceID, 'pot', e.timestamp, n); else if (/Mana Potion/.test(n)) useC(e.sourceID, 'manapot', e.timestamp, n); else if (/^(Potion of |Draught of )/.test(n) || /Potion$/.test(n)) useC(e.sourceID, 'pot', e.timestamp, n); }
    else if (ty === 'death' && hp.has(e.targetID) && !e.feign) { if (!dead.has(e.targetID)) { dead.set(e.targetID, e.timestamp); deathsRaw.push(e); if (!diedAt.has(e.targetID)) diedAt.set(e.targetID, e.timestamp); } }
    else if (ty === 'resurrect' && hp.has(e.targetID)) { if (dead.has(e.targetID)) { aliveCut.set(e.targetID, aliveCut.get(e.targetID) + (e.timestamp - dead.get(e.targetID))); dead.delete(e.targetID); } rez.push([s(e.timestamp), nm(e.targetID), nm(e.sourceID)]); }
  }
  for (const [id, t] of dead) aliveCut.set(id, aliveCut.get(id) + (P.end - t));
  for (const id of ids) { const p = get(id); p.dmg = Math.round(p.dmg); p.alive = r1(len - aliveCut.get(id) / 1000); p.died = diedAt.has(id) ? s(diedAt.get(id)) : null; }
  // ---- deaths: each death event on a player, with the hits before it, the health line, and what they had pressed ----
  const hpAt = (id, t) => { const a = hp.get(id); let v = null; for (const x of a) { if (x[0] > t) break; v = x[1]; } return v; };
  const mcSp = []; { const open = new Map(); for (const e of ev) { if (e.abilityGameID !== CA.dread || !hp.has(e.targetID)) continue; if (e.type === 'applydebuff') open.set(e.targetID, e.timestamp); else if (e.type === 'removedebuff' && open.has(e.targetID)) { mcSp.push([e.targetID, open.get(e.targetID), e.timestamp]); open.delete(e.targetID); } } for (const [id, a] of open) mcSp.push([id, a, P.end]); }
  const mcAt = (id, t) => mcSp.some((x) => x[0] === id && t >= x[1] && t <= x[2] + 300); /* (Dreadmarch was on them when they died: mind controlled) */
  const deaths = [];
  { const all = ev.filter((e) => e.type === 'death' && hp.has(e.targetID) && !e.feign).sort((a, b) => a.timestamp - b.timestamp); let n = 0;
    for (const d of all) { const id = d.targetID, t = d.timestamp, hits = [];
      const dmgs = ev.filter((e) => e.type === 'damage' && e.targetID === id && e.timestamp <= t + 50 && e.timestamp >= t - 10000);
      for (const e of dmgs.slice(-6)) hits.push([s(e.timestamp), an(e.abilityGameID), (e.amount || 0) + (e.absorbed || 0), e.hitPoints != null && e.maxHitPoints ? Math.round(100 * e.hitPoints / e.maxHitPoints) : null]);
      const kbId = d.killingAbilityGameID != null ? d.killingAbilityGameID : null; /* (the death event's own killing blow; none = no hit killed them: a fall, or carried off) */
      const line = hp.get(id).filter((x) => x[0] <= t && x[0] >= t - 10000); let low = t; for (let i = line.length - 1; i >= 0; i--) { if (line[i][1] > 0.35) break; low = line[i][0]; }
      const samp = []; for (let k = 10; k >= 0; k -= 2) { const v = hpAt(id, t - k * 1000); samp.push(v == null ? null : Math.round(100 * v)); }
      const mine = casts.get(id).filter((c) => c[0] <= t), used = {}; for (const [ct, n2] of mine) if (DEFS[n2] != null || /Healthstone|Health(ing)? Potion/.test(n2)) used[n2] = s(ct);
      const pe = ev.filter((e) => e.x != null && e.timestamp <= t && e.timestamp >= t - 3000 && ((e.resourceActor === 2 && e.targetID === id) || (e.resourceActor === 1 && e.sourceID === id))).pop(), posAt = pe ? [r1(pe.x / 100), r1(pe.y / 100)] : null;
      const last4 = {}; for (const e of dmgs) { if (e.timestamp < t - 4000 || !(e.amount > 0)) continue; const k = an(e.abilityGameID), o4 = last4[k] || (last4[k] = [0, 0]); o4[0] += e.amount; o4[1]++; }
      const okE = dmgs.slice().reverse().find((e) => e.overkill > 0), feared = fearSp.some((x) => x[0] === id && x[1] <= t && x[2] >= t - 1500) || (kbId == null && fearSp.some((x) => x[0] === id && x[1] <= t && x[2] >= t - 12000)), mc2 = mcSp.some((x) => x[0] === id && x[1] <= t && x[2] >= t - 2000) || (kbId == null && mcSp.some((x) => x[0] === id && x[1] <= t && x[2] >= t - 12000)); /* (no killing hit: a fall. Carried over the edge by a mind control or a fear that ended up to 10 s before) */
      const twice = {}; { const dd = dmgs.filter((e) => e.timestamp >= t - 4000 && e.amount > 0 && !e.tick); for (let i2 = 1; i2 < dd.length; i2++) for (let j2 = 0; j2 < i2; j2++) if (dd[i2].abilityGameID === dd[j2].abilityGameID && dd[i2].timestamp - dd[j2].timestamp <= 500 && dd[i2].timestamp > dd[j2].timestamp) twice[an(dd[i2].abilityGameID)] = dd[i2].amount; }
      deaths.push({ t: s(t), player: nm(id), role: roleOf(id), deadBefore: n, twice: Object.keys(twice).length ? twice : undefined, last4, overkill: okE ? okE.overkill : 0, maxHp: mxHp.get(id) || null, pos: posAt, path4: ev.filter((e) => e.x != null && e.timestamp <= t && e.timestamp >= t - 4000 && ((e.resourceActor === 2 && e.targetID === id) || (e.resourceActor === 1 && e.sourceID === id))).filter((e, i2, l) => i2 % Math.max(1, Math.ceil(l.length / 8)) === 0 || i2 === l.length - 1).map((e) => [r1(e.x / 100), r1(e.y / 100)]), knock3: dmgs.some((e) => e.timestamp >= t - 3000 && e.abilityGameID === CA.axe) || ev.some((e) => e.abilityGameID === CA.axe && e.type === 'applydebuff' && e.targetID === id && e.timestamp >= t - 3000 && e.timestamp <= t) || undefined, feared: feared || undefined, mc2: mc2 || undefined, killedBy: kbId != null ? an(kbId) : null, killedByFrom: d.killerID != null ? nm(d.killerID) : null, mc: mcAt(id, t), hits, hp10: samp, lowFor: r1((t - low) / 1000), used }); n++; } }
  for (const d of deaths) { d.mass = d.killedBy ? deaths.filter((x) => x.killedBy === d.killedBy && Math.abs(x.t - d.t) <= 0.6).length : 1; if (d.mc2) d.mc = true; delete d.mc2; } /* (a mass death: 3 or more to the same hit at once; mind controlled: up to 2 s before, or 6 s with no killing hit) */
  // ---- kicks ----
  const kicks = [], offs = [];
  for (const e of ev) { if (e.type === 'interrupt' && (isP(e.sourceID) || ownerOf(e.sourceID) != null)) kicks.push({ t: s(e.timestamp), by: nm(isP(e.sourceID) ? e.sourceID : ownerOf(e.sourceID)), with: an(e.abilityGameID), spell: an(e.extraAbilityGameID), on: nm(e.targetID) + (e.targetInstance ? ' ' + e.targetInstance : '') });
    if (e.type === 'cast' && e.abilityGameID === CA.wail && !friendly(e.sourceID)) offs.push({ t: s(e.timestamp), spell: 'Wail of Terror', on: nm(e.sourceID) + (e.sourceInstance ? ' ' + e.sourceInstance : ''), feared: ev.filter((x) => x.type === 'applydebuff' && x.abilityGameID === CA.wail && Math.abs(x.timestamp - e.timestamp) < 500 && isP(x.targetID)).length }); }
  const dispels = ev.filter((e) => e.type === 'dispel' && (isP(e.sourceID) || ownerOf(e.sourceID) != null)).map((e) => [s(e.timestamp), nm(isP(e.sourceID) ? e.sourceID : ownerOf(e.sourceID)), an(e.abilityGameID), an(e.extraAbilityGameID)]);
  const ccSpans = {}; for (const [id, a, b] of mcSp.concat(fearSp)) (ccSpans[nm(id)] = ccSpans[nm(id)] || []).push([s(a), s(b)]);
  const castN = {}, raidCds = []; for (const [id, l] of casts) { const o = (castN[nm(id)] = {}); for (const [ct, n] of l) { o[n] = (o[n] || 0) + 1; if (RAID_CDS.has(n) && !raidCds.some((q) => q[1] === nm(id) && q[2] === n && s(ct) - q[0] < 12)) raidCds.push([s(ct), nm(id), n]); } } raidCds.sort((a, b) => a[0] - b[0]); /* (a channelled cooldown logs a cast every second: one use) */
  const out = { fight: P.fight, kill: !!(ev.find((e) => e.type === 'encounterend') || {}).kill || !!F.kill, len: r1(len), wclBossPct: F.bossPercentage, wclFightPct: F.fightPercentage, wclLastPhase: F.lastPhase, wclIntermission: !!F.lastPhaseIsIntermission,
    bossHpEnd: bossHp, size: ids.length, dispels, ccSpans, castN, raidCds, players: pl, prep, consum, deaths, rez, kicks, kicksMissed: offs };
  if (F.encounterID === 3492 || F.name === "Ula'tek") out.ula = ulatek(ev, { s, nm, an, isP, roleOf, friendly });
  if (F.encounterID === 3429 || (ev[0] && ev[0].encounterID === 3429)) out.ca = coiledAltar(ev, { t0, s, nm, an, isP, ownerOf, friendly, roleOf, ids, hp, hpAt, len, P });
  return out;
}

// ---- The Coiled Altar: phases and each mechanic, from the events alone ----
function coiledAltar(ev, X) {
  const { t0, s, nm, isP, roleOf, friendly } = X, ca = {};
  const of = (id, ...types) => ev.filter((e) => e.abilityGameID === id && types.includes(e.type));
  // phases: phase 2 starts at Malacrass' first cast; the intermission is Zul'jan's Ghastly Regeneration (from its start to its end); phase 3 follows
  const mal = ev.find((e) => (e.type === 'cast' || e.type === 'begincast') && nm(e.sourceID) === 'Hex Lord Malacrass'), rg = of(CA.regen, 'applybuff')[0], rgEnd = of(CA.regen, 'removebuff')[0];
  ca.p2 = mal ? s(mal.timestamp) : null; ca.inter = rg ? s(rg.timestamp) : null; ca.p3 = rgEnd ? s(rgEnd.timestamp) : null;
  ca.phase = ca.p3 != null ? 'P3' : ca.inter != null ? 'Intermission' : ca.p2 != null ? 'P2' : 'P1';
  const phaseAt = (t) => (ca.p3 != null && t >= ca.p3 ? 'P3' : ca.inter != null && t >= ca.inter ? 'Intermission' : ca.p2 != null && t >= ca.p2 ? 'P2' : 'P1');
  // tank frontals: each Sever / Soul Sever / Blighted Sever cast and every player its hit damaged (within 1.5 s of the cast)
  ca.frontals = [];
  for (const e of ev) { if (e.type !== 'cast' || !CA.frontal[e.abilityGameID] || friendly(e.sourceID)) continue;
    const hit = ev.filter((x) => x.type === 'damage' && x.abilityGameID === e.abilityGameID && isP(x.targetID) && x.timestamp >= e.timestamp - 100 && x.timestamp <= e.timestamp + 1500).map((x) => x.targetID);
    const u = [...new Set(hit)], stacks = {}; for (const id of u.filter((x) => roleOf(x) === 'tank')) { const dz = ev.find((x) => CA.frontalDebuff[x.abilityGameID] === CA.frontal[e.abilityGameID] && x.targetID === id && Math.abs(x.timestamp - e.timestamp) < 600 && (x.type === 'applydebuff' || x.type === 'applydebuffstack')); stacks[nm(id)] = dz ? (dz.type === 'applydebuff' ? 1 : dz.stack || 2) : null; }
    ca.frontals.push({ t: s(e.timestamp), spell: CA.frontal[e.abilityGameID], tanks: u.filter((id) => roleOf(id) === 'tank').map(nm), stacks, others: u.filter((id) => roleOf(id) !== 'tank').map(nm) }); }
  // Dreadmarch: each cast's targets (the debuff within 1.5 s of the cast). A Dreadmarch debuff at any other time is a ghost that reached its player.
  const dCast = of(CA.dreadCast, 'cast').map((e) => e.timestamp); ca.dreadmarch = dCast.map((t) => ({ t: s(t), targets: of(CA.dread, 'applydebuff').filter((x) => x.timestamp >= t && x.timestamp <= t + 1500 && isP(x.targetID)).map((x) => nm(x.targetID)) }));
  ca.ghostReached = of(CA.dread, 'applydebuff').filter((x) => isP(x.targetID) && !dCast.some((t) => x.timestamp >= t && x.timestamp <= t + 1500)).map((x) => ({ t: s(x.timestamp), player: nm(x.targetID) }));
  // ghosts touching: Malevolent Resonance lands on both players at the same moment
  ca.ghostsTouched = []; for (const e of of(CA.resonance, 'applydebuff')) { if (!isP(e.targetID)) continue; const g = ca.ghostsTouched.find((x) => Math.abs(x.ms - e.timestamp) < 300); if (g) g.players.push(nm(e.targetID)); else ca.ghostsTouched.push({ ms: e.timestamp, t: s(e.timestamp), players: [nm(e.targetID)] }); }
  ca.ghostsTouched.forEach((g) => { delete g.ms; g.players.sort(); });
  // Venom Rupture waves: stacks landing less than 4 s apart are one wave; its size is the most stacks one player got in it. Each wave notes the
  // frontal just before it (a planned pop), the purple carriers whose orb ended at the burst, and the deaths in the next 15 s.
  const rup = ev.filter((e) => e.abilityGameID === CA.rupture && (e.type === 'applydebuff' || e.type === 'applydebuffstack') && isP(e.targetID)).sort((a, b) => a.timestamp - b.timestamp);
  const frontT = ev.filter((e) => e.type === 'cast' && CA.frontal[e.abilityGameID] && !friendly(e.sourceID)).map((e) => e.timestamp);
  // (a burst hidden behind a frontal's pop: a pop adds one stack per orb; a purple bursting adds about 20 at once. 3+ players jumping 8+ stacks, 0.6 s or more into a frontal's wave, start a wave of their own)
  const jumpAt = []; { const cur = new Map(), n = new Map(); for (const e of ev) { if (e.abilityGameID !== CA.rupture || !isP(e.targetID)) continue; if (e.type === 'applydebuff') cur.set(e.targetID, 1); else if (e.type === 'applydebuffstack') { if ((e.stack || 0) - (cur.get(e.targetID) || 0) >= 8) n.set(e.timestamp, (n.get(e.timestamp) || 0) + 1); cur.set(e.targetID, e.stack || 0); } else if (e.type === 'removedebuff') cur.delete(e.targetID); } const ts = [...n.keys()].sort((a, b) => a - b); for (const x of ts) { let c = 0; for (const y of ts) if (Math.abs(y - x) <= 150) c += n.get(y); if (c >= 3) jumpAt.push(x); } }
  const byFrontal = (a) => frontT.some((f) => f <= a + 300 && f >= a - 3500);
  const waves = []; for (const e of rup) { const w = waves[waves.length - 1]; if (w && e.timestamp - w.last < 4000 && !(!w.hidden && byFrontal(w.a) && e.timestamp - w.a >= 600 && jumpAt.includes(e.timestamp))) { w.last = e.timestamp; w.per.set(e.targetID, (w.per.get(e.targetID) || 0) + 1); } else waves.push({ a: e.timestamp, last: e.timestamp, per: new Map([[e.targetID, 1]]), hidden: !!(w && e.timestamp - w.last < 4000), after: w && e.timestamp - w.last < 4000 ? w.a : null }); }
  const carry = (aid) => { const o = [], open = new Map(); for (const e of ev) { if (e.abilityGameID !== aid || !isP(e.targetID)) continue; if (e.type === 'applydebuff' || e.type === 'applybuff') open.set(e.targetID, e.timestamp); else if ((e.type === 'removedebuff' || e.type === 'removebuff') && open.has(e.targetID)) { o.push({ who: e.targetID, a: open.get(e.targetID), b: e.timestamp }); open.delete(e.targetID); } } for (const [w, a] of open) o.push({ who: w, a, b: X.P.end }); return o; };
  const purple = carry(CA.purpleCarry), green = carry(CA.greenCarry);
  const pdeaths = ev.filter((e) => e.type === 'death' && isP(e.targetID) && !e.feign);
  const rupD = ev.filter((e) => e.abilityGameID === CA.rupture && e.type === 'damage' && isP(e.targetID)), delT = of(CA.deluge, 'cast').map((e) => e.timestamp);
  ca.ruptureWaves = waves.map((w) => ({ t: s(w.a), phase: phaseAt(s(w.a)), stacks: Math.max(...w.per.values()), players: w.per.size, bigHit: Math.round(Math.max(0, ...rupD.filter((e) => e.timestamp >= w.a - 100 && e.timestamp <= w.last + 2500).map((e) => (e.amount || 0) + (e.absorbed || 0))) / 1000), atDeluge: delT.some((d) => d <= w.a + 300 && d >= w.a - 2500), killed: pdeaths.filter((d) => d.killingAbilityGameID === CA.rupture && d.timestamp >= w.a && d.timestamp <= w.last + 6000).length, frontal: !w.hidden && byFrontal(w.a), afterFrontal: w.hidden ? r1((w.a - w.after) / 1000) : undefined, pushP1: ca.p2 != null && Math.abs(s(w.a) - ca.p2) < 12 && (w.hidden || !byFrontal(w.a)),
    purpleEnded: purple.filter((c) => Math.abs(c.b - w.a) <= 700).map((c) => nm(c.who)), purpleHeld: purple.filter((c) => c.a <= w.a + 300 && c.b >= w.a - 300).map((c) => nm(c.who)), deaths15: pdeaths.filter((d) => d.timestamp >= w.a && d.timestamp <= w.a + 15000).length }));
  // where the orbs were at each burst that no frontal explains: every orb unit's own position (its first event with a position; it is gone at its death
  // event) and every carrier's position then; the closest pairs with a purple in them, in yards
  { const pos = new Map(), key = (id, inst) => id + (inst ? '.' + inst : '');
    for (const e of ev) if (e.x != null && e.resourceActor) { const k = e.resourceActor === 1 ? key(e.sourceID, e.sourceInstance) : key(e.targetID, e.targetInstance); let a = pos.get(k); if (!a) pos.set(k, (a = [])); a.push([e.timestamp, e.x / 100, e.y / 100]); }
    const at = (k, t) => { const a = pos.get(k); if (!a) return null; let b = null; for (const x of a) { const d = Math.abs(x[0] - t); if (d <= 1500 && (!b || d < b.d)) b = { d, p: [x[1], x[2]] }; } return b && b.p; };
    /* (an orb is off the floor once a carrier of its colour starts a carry within 8 yd of it (the nearest one); a purple older than the last Toxic Deluge is gone too, or that Deluge would have burst it; a green is kept 90 s) */
    const orbs = []; for (const [k, a] of pos) { const n = nm(+k.split('.')[0]), col = /^Virulent Mutation/.test(n) ? 'purple' : /^Coalesced Venom/.test(n) ? 'green' : null; if (col) orbs.push({ k, col, t: a[0][0], p: [a[0][1], a[0][2]], gone: null }); }
    orbs.sort((a, b) => a.t - b.t);
    /* (what takes an orb off the floor, in the order it happened: a carrier of its colour picking it up, and a frontal popping it. A frontal adds one stack per orb it pops, so the N orbs nearest the line from the boss through the tank it hit are gone; popped: by which frontal) */
    const steps = [...purple.map((x) => ({ ...x, col: 'purple', at: x.a })), ...green.map((x) => ({ ...x, col: 'green', at: x.a }))];
    for (const e of ev) { if (e.type !== 'cast' || !CA.frontal[e.abilityGameID] || friendly(e.sourceID)) continue; const w = waves.find((x) => !x.hidden && Math.abs(x.a - e.timestamp) <= 400), fr = ca.frontals.find((x) => Math.abs(x.t - s(e.timestamp)) < 0.3); if (!w || !fr || !fr.tanks.length) continue; const tid = X.ids.find((id) => nm(id) === fr.tanks[0]); steps.push({ pop: Math.max(...w.per.values()), at: e.timestamp + 1, boss: at(key(e.sourceID, e.sourceInstance), e.timestamp), tank: at(String(tid), e.timestamp) }); }
    for (const c of steps.sort((u, v) => u.at - v.at)) {
      if (c.pop) { if (!c.boss || !c.tank) continue; const dx = c.tank[0] - c.boss[0], dy = c.tank[1] - c.boss[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; const cand = orbs.filter((o) => o.gone == null && o.t <= c.at - 100).map((o) => { const ax = o.p[0] - c.boss[0], ay = o.p[1] - c.boss[1], along = ax * ux + ay * uy; return { o, along, perp: Math.abs(ax * uy - ay * ux) }; }).filter((x) => x.along > 0 && x.along < 60 && x.perp < 12).sort((a, b) => a.perp - b.perp); for (const x of cand.slice(0, c.pop)) { x.o.gone = c.at; x.o.popped = true; } continue; }
      const me = at(String(c.who), c.a); if (!me) continue; let best = null; for (const o of orbs) if (o.col === c.col && o.gone == null && o.t <= c.a + 200) { const d = Math.hypot(o.p[0] - me[0], o.p[1] - me[1]); if (d <= 8 && (!best || d < best.d)) best = { o, d }; } if (best) best.o.gone = c.a; }
    ca.ruptureWaves.forEach((w, i) => { if (w.frontal || (w.killed < 1 && w.bigHit < 300)) return; const t = waves[i].a, things = [];
      /* (a carry that ended at the burst dropped its orb there: the new orb unit's position is where the carrier really was; a player's own reading lags a blink or a teleport) */
      const jumped = (who, tt) => { const cst = ev.filter((e) => e.type === 'cast' && e.sourceID === who && e.timestamp <= tt + 100 && e.timestamp >= tt - 1500 && MOVES.test(X.an(e.abilityGameID))).pop(); if (!cst) return null; const a = pos.get(String(who)) || []; let before = null, after = null; for (const x of a) { if (x[0] <= cst.timestamp + 150) before = x; else if (x[0] <= tt + 1500 && before && !after && Math.hypot(x[1] - before[1], x[2] - before[2]) >= 8) after = x; } return after ? { p: [after[1], after[2]], d: Math.hypot(after[1] - before[1], after[2] - before[2]), cast: cst.timestamp, spell: X.an(cst.abilityGameID) } : null; };
      const dropAt = new Map(); for (const [col, list] of [['purple', purple], ['green', green]]) { const enders = list.filter((c) => c.a <= t + 150 && Math.abs(c.b - t) <= 700), left = new Set(orbs.filter((o) => o.col === col && enders.some((c) => Math.abs(o.t - c.b) <= 400))), prs = []; for (const c of enders) { const me = at(String(c.who), c.b); for (const o of left) if (Math.abs(o.t - c.b) <= 400) prs.push([me ? Math.hypot(o.p[0] - me[0], o.p[1] - me[1]) : 999, c, o]); } prs.sort((x, y) => x[0] - y[0]); for (const [d, c, o] of prs) { if (dropAt.has(c) || !left.has(o)) continue; dropAt.set(c, { p: o.p, d }); left.delete(o); } }
      for (const [col, list] of [['purple', purple], ['green', green]]) for (const c of list) if (c.a <= t + 150 && c.b >= t - 700) { const dp = dropAt.get(c), jp = dp ? null : jumped(c.who, t), p = dp ? dp.p : jp ? jp.p : at(String(c.who), t); if (p) things.push({ lab: nm(c.who) + ' (' + col + ', carried' + (dp && dp.d > 6 && dp.d < 900 ? ', ' + r1(dp.d) + ' yd from their last reading: a blink or a teleport' : jp ? ', ' + jp.spell + ' ' + r1((t - jp.cast) / 1000) + ' s before, landed ' + r1(jp.d) + ' yd away' : '') + ')', col, p }); }
      const lastDel = Math.max(0, ...delT.filter((d) => d <= t - 1500));
      for (const o of orbs) { if (o.t > t - 500 || (o.gone != null && o.gone <= t) || (o.col === 'purple' ? o.t < lastDel - 1000 : t - o.t > 90000)) continue; const dr = (o.col === 'purple' ? purple : green).find((c) => Math.abs(c.b - o.t) <= 500 && (() => { const q = at(String(c.who), c.b); return q && Math.hypot(q[0] - o.p[0], q[1] - o.p[1]) < 5; })());
        things.push({ lab: o.col + ' on the floor since ' + s(o.t) + (dr ? ', dropped by ' + nm(dr.who) : ''), col: o.col, p: o.p }); }
      w.purpleJustEnded = purple.filter((c) => c.b < t - 700 && c.b >= t - 4000).map((c) => [nm(c.who), r1((t - c.b) / 1000)]);
      const pairs = []; for (let a = 0; a < things.length; a++) for (let b = a + 1; b < things.length; b++) { const A1 = things[a], B1 = things[b]; if (A1.col !== 'purple' && B1.col !== 'purple') continue; const d = Math.hypot(A1.p[0] - B1.p[0], A1.p[1] - B1.p[1]); if (d < 14) pairs.push([r1(d), A1.lab, B1.lab]); }
      pairs.sort((x, y) => x[0] - y[0]); w.near = pairs.slice(0, 5); w.orbsUp = things.length; }); }
  ca.greenPickups = green.map((c) => [s(c.a), nm(c.who), r1((c.b - c.a) / 1000)]);
  ca.purplePickups = purple.map((c) => [s(c.a), nm(c.who), r1((c.b - c.a) / 1000)]);
  ca.deluges = of(CA.deluge, 'cast').map((e) => s(e.timestamp));
  // Gloombomb: each cast's four targets; anyone else its blast hit; and every Gravebound (from a bomb or a frontal): fragments picked up, and how it ended
  const gHit = of(CA.gloomHit, 'damage').filter((e) => isP(e.targetID));
  ca.gloombombs = of(CA.gloomCast, 'cast').map((e) => { const tg = of(CA.gloom, 'applydebuff').filter((x) => Math.abs(x.timestamp - e.timestamp) < 600 && isP(x.targetID)).map((x) => x.targetID);
    const hits = gHit.filter((x) => x.timestamp >= e.timestamp + 1000 && x.timestamp <= e.timestamp + 7000); const cnt = new Map(); for (const x of hits) cnt.set(x.targetID, (cnt.get(x.targetID) || 0) + 1);
    return { t: s(e.timestamp), targets: tg.map(nm).sort(), alsoHit: [...new Set(hits.filter((x) => !tg.includes(x.targetID)).map((x) => nm(x.targetID)))].sort(), hitTwice: tg.filter((id) => cnt.get(id) > 1).map(nm).sort() }; });
  ca.gravebound = of(CA.grave, 'applydebuff', 'applybuff').filter((e) => isP(e.targetID)).map((e) => { const end = ev.find((x) => x.abilityGameID === CA.grave && (x.type === 'removedebuff' || x.type === 'removebuff') && x.targetID === e.targetID && x.timestamp > e.timestamp), te = end ? end.timestamp : X.P.end;
    const picks = ev.filter((x) => x.abilityGameID === CA.graveHit && x.type === 'damage' && x.targetID === e.targetID && x.timestamp > e.timestamp && x.timestamp <= te + 50).length;
    const died = pdeaths.find((d) => d.targetID === e.targetID && d.timestamp >= e.timestamp && d.timestamp <= te + 1500);
    const from = gHit.some((x) => x.targetID === e.targetID && Math.abs(x.timestamp - e.timestamp) < 300) ? 'Gloombomb' : (ev.find((x) => x.type === 'damage' && CA.frontal[x.abilityGameID] && x.targetID === e.targetID && Math.abs(x.timestamp - e.timestamp) < 600) ? 'frontal' : 'other');
    const bh = gHit.filter((x) => x.targetID === e.targetID && x.timestamp >= e.timestamp - 300 && x.timestamp <= te), tgt = bh.length && of(CA.gloom, 'applydebuff', 'applybuff').some((x) => x.targetID === e.targetID && x.timestamp <= bh[0].timestamp && bh[0].timestamp - x.timestamp < 7000) ? 1 : 0;
    const fr = ev.filter((x) => x.type === 'damage' && CA.frontal[x.abilityGameID] && x.targetID === e.targetID && x.timestamp >= e.timestamp - 600 && x.timestamp <= te).length;
    return { t: s(e.timestamp), player: nm(e.targetID), from, src: { ownBomb: tgt, othersBomb: bh.length - tgt, frontal: fr }, picked: picks, for: r1((te - e.timestamp) / 1000), died: !!died, ended: !end }; });
  // Noxious Ground: seconds each player carried the debuff, and its damage ticks
  ca.noxious = {}; { const open = new Map(); for (const e of ev) { if (e.abilityGameID !== CA.noxious || !isP(e.targetID)) continue; const o = ca.noxious[nm(e.targetID)] || (ca.noxious[nm(e.targetID)] = { secs: 0, ticks: 0, times: 0 });
      if (e.type === 'applydebuff') { open.set(e.targetID, e.timestamp); o.times++; } else if (e.type === 'removedebuff' && open.has(e.targetID)) { o.secs += (e.timestamp - open.get(e.targetID)) / 1000; open.delete(e.targetID); } else if (e.type === 'damage') o.ticks++; }
    for (const [id, a] of open) ca.noxious[nm(id)].secs += (X.P.end - a) / 1000; for (const o of Object.values(ca.noxious)) o.secs = r1(o.secs); }
  // Venomfang: each debuff, who removed it and after how long (a dispel event), or that it ran out
  const disp = ev.filter((e) => e.type === 'dispel' && e.extraAbilityGameID === CA.venomfang);
  ca.venomfang = of(CA.venomfang, 'applydebuff').filter((e) => isP(e.targetID)).map((e) => { const end = ev.find((x) => x.abilityGameID === CA.venomfang && x.type === 'removedebuff' && x.targetID === e.targetID && x.timestamp > e.timestamp), te = end ? end.timestamp : X.P.end;
    const d = disp.find((x) => x.targetID === e.targetID && x.timestamp >= e.timestamp && x.timestamp <= te + 100); return { t: s(e.timestamp), player: nm(e.targetID), by: d ? nm(isP(d.sourceID) ? d.sourceID : X.ownerOf(d.sourceID)) : null, with: d ? X.an(d.abilityGameID) : null, after: r1((te - e.timestamp) / 1000) }; });
  // Guillotine: each drop's target, the players its hit split on (the soakers), and anyone the eruption caught
  ca.guillotines = []; for (const [id, name] of Object.entries(CA.guilTarget)) for (const e of of(+id, 'applydebuff')) { if (!isP(e.targetID)) continue;
    const dmgId = name === 'Guillotine' ? 1283594 : 1299296, kissId = name === 'Guillotine' ? 1283623 : 1299396;
    const so = ev.filter((x) => x.type === 'damage' && x.abilityGameID === dmgId && isP(x.targetID) && x.timestamp >= e.timestamp && x.timestamp <= e.timestamp + 12000), ks = ev.filter((x) => x.type === 'damage' && x.abilityGameID === kissId && isP(x.targetID) && x.timestamp >= e.timestamp && x.timestamp <= e.timestamp + 20000);
    ca.guillotines.push({ t: s(e.timestamp), spell: name, target: nm(e.targetID), soakers: [...new Set(so.map((x) => nm(x.targetID)))].sort(), caught: [...new Set(ks.map((x) => nm(x.targetID)))].sort() }); }
  ca.guillotines.sort((a, b) => a.t - b.t);
  ca.executions = ev.filter((e) => e.type === 'damage' && /Execution$/.test(X.an(e.abilityGameID)) && !friendly(e.sourceID) && isP(e.targetID)).reduce((o, e) => { const k = o.find((x) => Math.abs(x.ms - e.timestamp) < 1500); if (k) k.hit++; else o.push({ ms: e.timestamp, t: s(e.timestamp), spell: X.an(e.abilityGameID), hit: 1 }); return o; }, []).map((x) => ({ t: x.t, spell: x.spell, hit: x.hit }));
  // Axegrinder: separate hits per player (damage at least 1.5 s after the last)
  // (a rolling axe catching a player puts its debuff on them: one catch per debuff, at least 1.5 s after the last)
  ca.axeCaught = {}; { const last = new Map(); for (const e of of(CA.axe, 'applydebuff')) { if (!isP(e.targetID)) continue; if (e.timestamp - (last.get(e.targetID) || -1e9) > 1500) ca.axeCaught[nm(e.targetID)] = (ca.axeCaught[nm(e.targetID)] || 0) + 1; last.set(e.targetID, e.timestamp); } }
  ca.axeHits = {}; { const last = new Map(); for (const e of of(CA.axe, 'damage')) { if (!isP(e.targetID)) continue; if (e.timestamp - (last.get(e.targetID) || -1e9) > 1500) ca.axeHits[nm(e.targetID)] = (ca.axeHits[nm(e.targetID)] || 0) + 1; last.set(e.targetID, e.timestamp); } }
  // Eternal Nightfall: each shield (Veil of Twilight) and how long it stood; whether the cast finished
  ca.shields = of(CA.veil, 'applybuff').map((e) => { const end = of(CA.veil, 'removebuff').find((x) => x.timestamp > e.timestamp); return { t: s(e.timestamp), brokenAfter: end ? r1((end.timestamp - e.timestamp) / 1000) : null }; });
  ca.nightfallFinished = of(CA.nightfall, 'cast').map((e) => s(e.timestamp));
  // adds: each Spiteful Soulcoiler's spawn and death
  ca.adds = of(CA.addSummon, 'summon').map((e) => { const d = ev.find((x) => x.type === 'death' && x.targetID === e.targetID && x.targetInstance === e.targetInstance && x.timestamp > e.timestamp && x.timestamp < e.timestamp + 120000); return { t: s(e.timestamp), died: d ? s(d.timestamp) : null }; });
  // the intermission: fragments that reached Zul'jan (each heals him)
  ca.fragmentsReached = of(CA.fragHeal, 'heal').reduce((l, e) => { if (!l.some((t) => Math.abs(t - e.timestamp) < 1500)) l.push(e.timestamp); return l; }, []).length; /* (one fragment heals both bosses at once) */
  return ca;
}

// ---- Ula'tek (encounter 3492): each mechanic of phase 1, from the events alone. Spell ids are the ones in the log (names in the report). ----
const UL = { beamCast: 1299759, beamHit: 1299919, fester: 1310763, splash: 1307635, coilHit: 1287265, coilCast: 1299010, constrictor: 1300685, waves: 1292403, thrash: 1296301, wrath: 1298367 };
function ulatek(ev, X) {
  const { s, nm, isP, roleOf, friendly } = X, u = {}, pd = (id) => ev.filter((e) => e.type === 'damage' && e.abilityGameID === id && isP(e.targetID));
  // Toxic Incubation (the beam): each cast and who its impacts hit, most first; a tank should take it
  const bh = pd(UL.beamHit); u.beams = ev.filter((e) => e.type === 'cast' && e.abilityGameID === UL.beamCast).map((e) => { const l = bh.filter((x) => x.timestamp >= e.timestamp && x.timestamp <= e.timestamp + 9000), c = new Map(); for (const x of l) c.set(x.targetID, (c.get(x.targetID) || 0) + 1);
    const took = [...c].sort((a, b) => b[1] - a[1]); return { t: s(e.timestamp), took: took.map(([id, n]) => [nm(id), n]), nonTanks: took.filter(([id]) => roleOf(id) !== 'tank').map(([id]) => nm(id)) }; });
  // Fester Burst: each burst and every player it put its debuff on (they were outside the Wretch's bubble)
  u.festerBursts = ev.filter((e) => e.type === 'cast' && e.abilityGameID === UL.fester && !friendly(e.sourceID)).map((e) => ({ t: s(e.timestamp), hit: [...new Set(ev.filter((x) => x.abilityGameID === UL.fester && (x.type === 'applydebuff' || x.type === 'damage') && isP(x.targetID) && x.timestamp >= e.timestamp - 200 && x.timestamp <= e.timestamp + 1500).map((x) => nm(x.targetID)))].sort(), hitNotTanks: [...new Set(ev.filter((x) => x.abilityGameID === UL.fester && (x.type === 'applydebuff' || x.type === 'damage') && isP(x.targetID) && roleOf(x.targetID) !== 'tank' && x.timestamp >= e.timestamp - 200 && x.timestamp <= e.timestamp + 1500).map((x) => nm(x.targetID)))].sort() }));
  // Blightscale Vipers: every Viper that appears in the log (each hatched from an egg)
  { const seen = new Map(); for (const e of ev) { for (const [id, inst] of [[e.sourceID, e.sourceInstance], [e.targetID, e.targetInstance]]) { if (id == null || nm(id) !== 'Blightscale Viper') continue; const k = id + '.' + (inst || 0); if (!seen.has(k)) seen.set(k, s(e.timestamp)); } } u.vipers = [...seen.values()].sort((a, b) => a - b); }
  // Spectral Coils: each circle (one Spectral Coil unit) and the players its hit split on
  { const by = new Map(), key = (e) => e.sourceID + '.' + (e.sourceInstance || 0); /* (a circle is one Spectral Coil unit; a soaker gets Soul Constrictor from the circle they stand in; the circle's own damage hits the whole raid) */
    for (const e of ev) { if (e.sourceID == null || nm(e.sourceID) !== 'Spectral Coil') continue; if ((e.type === 'cast' || e.type === 'begincast') && e.abilityGameID === UL.coilCast && !by.has(key(e))) by.set(key(e), { t: s(e.timestamp), who: new Set() });
      else if (e.abilityGameID === UL.constrictor && e.type === 'applydebuff' && isP(e.targetID)) { let o = by.get(key(e)); if (!o) by.set(key(e), (o = { t: s(e.timestamp), who: new Set() })); o.who.add(nm(e.targetID)); } }
    /* (Nov 13, the Ula'tek chat: a circle lands 3.9 s after it begins. One begun in the pull's last seconds that nobody was in never landed: naMdPc13Qfj9vmHY fight 42 ended at 5:51
       with circles begun at 5:48.4 and 5:50.8, Frwn49zWfdxHQAJG fight 40 at 5:37 with one begun at 5:34.6) */
    const endS = ev.length ? s(ev[ev.length - 1].timestamp) : 0;
    u.coils = [...by.values()].filter((o) => o.who.size || o.t <= endS - 3.7).sort((a, b) => a.t - b.t).map((o) => ({ t: o.t, soakers: [...o.who].sort() })); }
  // Noxious Splash: each time two egg carriers touched (the debuff lands on them)
  // A touch is the first hit or the debuff landing, never the once-a-second ticks after it (pull 12: Fourinches and Larryg touched at 0:30 and ticked
  // to 0:40; those ticks are not the 0:38 touch). A first hit for no damage is still a touch: that carrier's egg broke too (pull 12: Volkovod at
  // 0:38.5 took nothing, and his Noxious Shell came off that instant). "took" is what the first hits did; 0 keeps them out of the damage tables.
  u.splashes = ev.filter((e) => e.abilityGameID === UL.splash && isP(e.targetID) && (e.type === 'applydebuff' || (e.type === 'damage' && !e.tick))).reduce((l, e) => { const who = nm(e.targetID), t = s(e.timestamp), took = e.type === 'damage' ? (e.amount || 0) + (e.absorbed || 0) : 0, x = l.find((y) => y.player === who && t - y.t < 3); if (x) x.took += took; else l.push({ t, player: who, took }); return l; }, []);
  // each touch: the carriers whose first hits landed within 1.5 s of each other
  u.touches = u.splashes.reduce((l, x) => { const g = l.find((y) => x.t - y.t < 1.5); if (g) { if (!g.players.includes(x.player)) g.players.push(x.player); } else l.push({ t: x.t, players: [x.player] }); return l; }, []);
  // Caustic Waves: each player's hits (damage at least 1.5 s after their last)
  u.waveHits = {}; { const last = new Map(); for (const e of pd(UL.waves)) { if (e.timestamp - (last.get(e.targetID) || -1e9) > 1500) u.waveHits[nm(e.targetID)] = (u.waveHits[nm(e.targetID)] || 0) + 1; last.set(e.targetID, e.timestamp); } }
  // the raid-wide killers, when they happened and how many they hit
  const grp = (name) => ev.filter((e) => e.type === 'damage' && X.an(e.abilityGameID) === name && isP(e.targetID) && !friendly(e.sourceID)).reduce((l, e) => { const g = l.find((x) => Math.abs(x.ms - e.timestamp) < 1500); if (g) g.who.add(e.targetID); else l.push({ ms: e.timestamp, who: new Set([e.targetID]) }); return l; }, []).map((g) => ({ t: s(g.ms), hit: g.who.size }));
  u.rattlerSlams = grp('Rattler Slam'); u.uncheckedRage = grp('Unchecked Rage');
  u.wraths = ev.filter((e) => e.type === 'cast' && e.abilityGameID === UL.wrath && isP(e.targetID)).map((e) => ({ t: s(e.timestamp), on: nm(e.targetID) }));
  return u;
}
function col2(o) { return o.col; }
module.exports = { rawFacts, CA, DEFS };
