(function (root) {
'use strict';

// ---------- static data ----------
// (the label on a mechanic's whole-set map row: 'Both circles' for two, 'All 3 leaps' for more)
const allN = (n, w) => (n === 2 ? 'Both ' + w + 's' : n === 1 ? 'The ' + w : 'All ' + n + ' ' + w + 's');
const ADV = 19; // advanced-logging block length, retail format V22 (patch 12.x)
const NIL = '0000000000000000';
// The block ends with positionX, positionY, uiMapID, facing, level, so position sits 5 fields from its end.
const PX = ADV - 5;

const CLASSES = {
  WARRIOR: ['Warrior', '#C69B6D', 'warrior'], PALADIN: ['Paladin', '#F48CBA', 'paladin'],
  HUNTER: ['Hunter', '#AAD372', 'hunter'], ROGUE: ['Rogue', '#FFF468', 'rogue'],
  PRIEST: ['Priest', '#F2F2F2', 'priest'], DEATHKNIGHT: ['Death Knight', '#E0475B', 'deathknight'],
  SHAMAN: ['Shaman', '#2E8CFF', 'shaman'], MAGE: ['Mage', '#3FC7EB', 'mage'],
  WARLOCK: ['Warlock', '#8788EE', 'warlock'], MONK: ['Monk', '#00FF98', 'monk'],
  DRUID: ['Druid', '#FF7C0A', 'druid'], DEMONHUNTER: ['Demon Hunter', '#B44BE0', 'demonhunter'],
  EVOKER: ['Evoker', '#33B392', 'evoker'],
};
const SPECS = {
  62: ['Arcane', 'MAGE'], 63: ['Fire', 'MAGE'], 64: ['Frost', 'MAGE'],
  65: ['Holy', 'PALADIN'], 66: ['Protection', 'PALADIN'], 70: ['Retribution', 'PALADIN'],
  71: ['Arms', 'WARRIOR'], 72: ['Fury', 'WARRIOR'], 73: ['Protection', 'WARRIOR'],
  102: ['Balance', 'DRUID'], 103: ['Feral', 'DRUID'], 104: ['Guardian', 'DRUID'], 105: ['Restoration', 'DRUID'],
  250: ['Blood', 'DEATHKNIGHT'], 251: ['Frost', 'DEATHKNIGHT'], 252: ['Unholy', 'DEATHKNIGHT'],
  253: ['Beast Mastery', 'HUNTER'], 254: ['Marksmanship', 'HUNTER'], 255: ['Survival', 'HUNTER'],
  256: ['Discipline', 'PRIEST'], 257: ['Holy', 'PRIEST'], 258: ['Shadow', 'PRIEST'],
  259: ['Assassination', 'ROGUE'], 260: ['Outlaw', 'ROGUE'], 261: ['Subtlety', 'ROGUE'],
  262: ['Elemental', 'SHAMAN'], 263: ['Enhancement', 'SHAMAN'], 264: ['Restoration', 'SHAMAN'],
  265: ['Affliction', 'WARLOCK'], 266: ['Demonology', 'WARLOCK'], 267: ['Destruction', 'WARLOCK'],
  268: ['Brewmaster', 'MONK'], 269: ['Windwalker', 'MONK'], 270: ['Mistweaver', 'MONK'],
  577: ['Havoc', 'DEMONHUNTER'], 581: ['Vengeance', 'DEMONHUNTER'], 1480: ['Devourer', 'DEMONHUNTER'],
  1467: ['Devastation', 'EVOKER'], 1468: ['Preservation', 'EVOKER'], 1473: ['Augmentation', 'EVOKER'],
};
// Each spec's own icon (Wowhead's names, loaded at runtime; checked to exist Oct 2026). Devourer has no spec icon there
// yet, so it uses Void Metamorphosis. A player with no known spec falls back to the class icon.
const SPEC_ICON = {
  62: 'spell_holy_magicalsentry', 63: 'spell_fire_firebolt02', 64: 'spell_frost_frostbolt02',
  65: 'spell_holy_holybolt', 66: 'ability_paladin_shieldofthetemplar', 70: 'spell_holy_auraoflight',
  71: 'ability_warrior_savageblow', 72: 'ability_warrior_innerrage', 73: 'ability_warrior_defensivestance',
  102: 'spell_nature_starfall', 103: 'ability_druid_catform', 104: 'ability_racial_bearform', 105: 'spell_nature_healingtouch',
  250: 'spell_deathknight_bloodpresence', 251: 'spell_deathknight_frostpresence', 252: 'spell_deathknight_unholypresence',
  253: 'ability_hunter_bestialdiscipline', 254: 'ability_hunter_focusedaim', 255: 'ability_hunter_camouflage',
  256: 'spell_holy_powerwordshield', 257: 'spell_holy_guardianspirit', 258: 'spell_shadow_shadowwordpain',
  259: 'ability_rogue_deadlybrew', 260: 'ability_rogue_waylay', 261: 'ability_stealth',
  262: 'spell_nature_lightning', 263: 'spell_shaman_improvedstormstrike', 264: 'spell_nature_magicimmunity',
  265: 'spell_shadow_deathcoil', 266: 'spell_shadow_metamorphosis', 267: 'spell_shadow_rainoffire',
  268: 'spell_monk_brewmaster_spec', 269: 'spell_monk_windwalker_spec', 270: 'spell_monk_mistweaver_spec',
  577: 'ability_demonhunter_specdps', 581: 'ability_demonhunter_spectank', 1480: 'inv_112_ability_demonhunter_metamorphasisvoid',
  1467: 'classicon_evoker_devastation', 1468: 'classicon_evoker_preservation', 1473: 'classicon_evoker_augmentation',
};
// Interrupts by class: [spell name, cooldown in seconds, specs (null = all specs of the class)].
// Midnight (12.0) removed interrupts from every healer spec except Restoration Shaman, whose Wind Shear
// is on a 30s cooldown (12s for Elemental and Enhancement). Holy and Discipline Priests never had one.
// Quell is listed at its talented 20s (40s base); other cooldowns are the standard values.
const INTERRUPTS = {
  WARRIOR: [['Pummel', 15, null]],
  PALADIN: [['Rebuke', 15, [66, 70]], ["Avenger's Shield", 15, [66]]],
  HUNTER: [['Counter Shot', 24, [253, 254]], ['Muzzle', 15, [255]]],
  ROGUE: [['Kick', 15, null]],
  PRIEST: [['Silence', 45, [258]]],
  DEATHKNIGHT: [['Mind Freeze', 15, null]],
  SHAMAN: [['Wind Shear', 12, [262, 263]], ['Wind Shear', 30, [264]]],
  MAGE: [['Counterspell', 24, null]],
  WARLOCK: [['Spell Lock', 24, null], ['Axe Toss', 30, [266]]],
  MONK: [['Spear Hand Strike', 15, [268, 269]]],
  DRUID: [['Skull Bash', 15, [103, 104]], ['Solar Beam', 60, [102]]],
  DEMONHUNTER: [['Disrupt', 15, null]],
  EVOKER: [['Quell', 20, [1467, 1473]]],
};
// How far each interrupt reaches, in yards. Melee kicks reach 5 yards from the add's edge, so a big add can be kicked from
// up to about 10 yards from its centre (Heroic Ula'tek: Doomscales kicked from 1-10 yd). Spell Lock and Axe Toss come from
// the Warlock's pet, so the Warlock's own spot says nothing and they aren't listed.
const KICK_REACH = { Pummel: 5, Rebuke: 5, "Avenger's Shield": 30, 'Counter Shot': 40, Muzzle: 5, Kick: 5, Silence: 30, 'Mind Freeze': 15,
  'Wind Shear': 30, Counterspell: 40, 'Spear Hand Strike': 5, 'Skull Bash': 13, 'Solar Beam': 40, Disrupt: 10, Quell: 25 };
const HEALERS = new Set([65, 105, 256, 257, 264, 270, 1468]);
const TANKS = new Set([66, 73, 104, 250, 268, 581]);

// Personal defensives, matched by spell name (stable across patches; English client).
// Cooldowns are base values, checked against Wowhead's tooltips for the live patch (Oct 2026). Talents shorten many; a
// base cooldown is the longest it can be, so "possible uses" is never more than they really had, and something counts as
// "still ready" at a death only when even the base cooldown had come back.
// [name, spellId, base cooldown, specs (null = all specs of the class), baseline?, kind ('heal': a self-heal button)]
// Talent defensives (baseline false) only count once the player is seen casting them,
// so a death is never blamed on a defensive the player may not have talented.
// Self-heals are buttons that only heal yourself (Exhilaration, Crimson Vial, Frenzied Regeneration…), never a heal cast on
// yourself. Names and IDs checked on Midnight raid logs (Oct 2026, 26 specs); Shield of Vengeance and Renewing Blaze trigger
// on their own there (they heal, but nobody presses them), so they stay talent-only and never count as unused.
const DEFENSIVES = {
  WARRIOR: [['Enraged Regeneration', 184364, 120, [72], true, 'heal'], ['Die by the Sword', 118038, 120, [71], true], ['Shield Wall', 871, 180, [73], true], ['Last Stand', 12975, 180, [73], false], ['Rallying Cry', 97462, 180, null, false], ['Bitter Immunity', 383762, 180, null, false, 'heal']],
  PALADIN: [['Divine Shield', 642, 300, null, true], ['Divine Protection', 498, 60, [65, 70], true], ['Shield of Vengeance', 184662, 90, [70], false], ['Ardent Defender', 31850, 90, [66], true], ['Guardian of Ancient Kings', 86659, 180, [66], false], ['Eye of Tyr', 387174, 60, [66], false], ['Lay on Hands', 633, 600, null, true, 'heal']],
  HUNTER: [['Aspect of the Turtle', 186265, 180, null, true], ['Survival of the Fittest', 264735, 90, null, false], ['Exhilaration', 109304, 120, null, true, 'heal'], ['Fortitude of the Bear', 388035, 120, null, false]],
  ROGUE: [['Cloak of Shadows', 31224, 120, null, true], ['Evasion', 5277, 120, null, true], ['Crimson Vial', 185311, 30, null, true, 'heal']],
  PRIEST: [['Desperate Prayer', 19236, 90, null, true, 'heal'], ['Dispersion', 47585, 120, [258], true]],
  DEATHKNIGHT: [['Icebound Fortitude', 48792, 120, null, true], ['Anti-Magic Shell', 48707, 60, null, true], ['Lichborne', 49039, 120, null, false], ['Vampiric Blood', 55233, 90, [250], true], ['Dancing Rune Weapon', 49028, 120, [250], false], ['Death Pact', 48743, 120, null, false, 'heal']],
  SHAMAN: [['Astral Shift', 108271, 120, null, true], ['Stone Bulwark Totem', 108270, 180, null, false]],
  MAGE: [['Ice Block', 45438, 240, null, true], ['Ice Cold', 414658, 240, null, false], ['Alter Time', 342245, 60, null, false], ['Greater Invisibility', 110959, 120, null, false], ['Mirror Image', 55342, 120, null, false]],
  WARLOCK: [['Unending Resolve', 104773, 180, null, true], ['Dark Pact', 108416, 60, null, false], ['Mortal Coil', 6789, 45, null, false, 'heal']],
  MONK: [['Fortifying Brew', 115203, 360, null, true], ['Diffuse Magic', 122783, 90, null, false], ['Dampen Harm', 122278, 120, null, false], ['Zen Meditation', 115176, 300, [268], false], ['Touch of Karma', 122470, 90, [269], false]],
  DRUID: [['Barkskin', 22812, 60, null, true], ['Survival Instincts', 61336, 180, [103, 104], false], ['Rage of the Sleeper', 200851, 60, [104], false],
    ['Frenzied Regeneration', 22842, 36, [102, 103, 105], false, 'heal'], ['Renewal', 108238, 90, null, false, 'heal']],
  DEMONHUNTER: [['Blur', 198589, 60, [577, 1480], true], ['Netherwalk', 196555, 180, [577], false], ['Fiery Brand', 204021, 60, [581], false], ['Metamorphosis', 187827, 120, [581], true], ['Darkness', 196718, 300, null, false]],
  EVOKER: [['Obsidian Scales', 363916, 90, null, true], ['Renewing Blaze', 374348, 90, null, false, 'heal']],
};
// (racial ones, for every class: only once the player is seen using them, like a talent)
for (const k of Object.keys(DEFENSIVES)) DEFENSIVES[k].push(['Gift of the Naaru', 59547, 120, null, false, 'heal'], ['Stoneform', 20594, 120, null, false], ['Fireblood', 265221, 120, null, false]);
// (a talent that takes another's place: a mage with Ice Cold has no Ice Block, so Ice Block is never "ready" for them)
const DEF_REPLACED = { 'ice block': 'ice cold' };
// Short survival buttons: counted when pressed (the Survivability view, and a close call they answered), but never listed
// as "ready" at a death or counted in possible uses, since they're up most of the time or have no cooldown. Bear Form counts
// for a druid who isn't the Guardian tank (they're in it all fight); Death Strike for a Death Knight who isn't Blood.
// [name, spellId, specs (null = all), kind]
const SURV_MINOR = {
  WARRIOR: [['Impending Victory', 202168, null, 'heal'], ['Victory Rush', 34428, null, 'heal'], ['Spell Reflection', 23920, null, 'dr']],
  ROGUE: [['Feint', 1966, null, 'dr']],
  MAGE: [['Prismatic Barrier', 235450, [62], 'dr'], ['Blazing Barrier', 235313, [63], 'dr'], ['Ice Barrier', 11426, [64], 'dr']],
  MONK: [['Expel Harm', 322101, [269, 270], 'heal']],
  DEATHKNIGHT: [['Death Strike', 49998, [251, 252], 'heal']],
  DRUID: [['Bear Form', 5487, [102, 103, 105], 'dr']],
};
// every self-heal by name, for the heals they gave back (plus Healthstones and health potions, matched on their own)
const SELF_HEAL = new Set([...Object.values(DEFENSIVES).flat().filter((d) => d[5] === 'heal'), ...Object.values(SURV_MINOR).flat().filter((d) => d[3] === 'heal')].map((d) => d[0].toLowerCase()));

// Potions by name (the spell name logged when drinking matches the item name).
// Midnight list from the Midnight alchemy recipe tables; The War Within potions are still usable.
// Anything else with "potion" in its name falls back to a guess from the name.
const CONSUMABLES = new Map([
  // Midnight
  ['silvermoon health potion', 'healpot'], ['refreshing serum', 'healpot'], ['amani extract', 'healpot'], ["light's preservation", 'healpot'],
  ["light's potential", 'combatpot'], ['potion of zealotry', 'combatpot'], ['draught of rampant abandon', 'combatpot'], ['potion of recklessness', 'combatpot'],
  ['lightfused mana potion', 'manapot'], ['potion of devoured dreams', 'manapot'],
  ['void-shrouded tincture', 'utilpot'], ['enlightenment tonic', 'utilpot'],
  // The War Within
  ['algari healing potion', 'healpot'], ["cavedweller's delight", 'healpot'], ['invigorating healing potion', 'healpot'],
  ['tempered potion', 'combatpot'], ['frontline potion', 'combatpot'], ['potion of unwavering focus', 'combatpot'], ['algari mana potion', 'manapot'],
]);
function potionKind(ln) {
  if (CONSUMABLES.has(ln)) return CONSUMABLES.get(ln);
  if (!ln.includes('potion')) return null;
  return ln.includes('mana') ? 'manapot' : /heal|restor|rejuven|vital|mend/.test(ln) ? 'healpot' : 'combatpot';
}

// Throughput cooldowns checked for efficiency, per spec ID.
const COOLDOWNS = {
  65: [[31884, 'Avenging Wrath', 120], [375576, 'Divine Toll', 60], [31821, 'Aura Mastery', 180]],
};

// Absorbs that are not healing (cheat-death / Stagger).
const NOT_HEALING = new Set([114556, 31850, 31230, 115069]);

// Boss mechanic rule packs (patch 12.1, Venomous Abyss), all difficulties unless a rule lists its own.
// Spell IDs where the in-game Adventure Guide publishes them (warcraft.wiki.gg); otherwise matched by
// spell name. What counts as a mistake comes from published raid strategy guides.
// None of these have been checked against a real log yet.
const SRC = ['the encounter journal', 'raid strategy guides'];
// (in season order: Nymrissa Wavecaller first, Kith'ix last. Neither is in The Venomous Abyss in game: Nymrissa is the Tidebound
// Grotto lair's boss (12.1, Flex Mythic) and Kith'ix is a one-boss raid added in 12.1.5. Warcraft Logs ranks both in its
// Venomous Abyss zone, so they count on Progress; `raid` names their own instance on the pull banner. Spell IDs read from real
// Mythic (Nymrissa) and Heroic (Kith'ix) pulls, 2026-10; Shatter and Unending Tides weren't in them, so they also match by name.)
const PACKS = [
{ encounter: 'Nymrissa Wavecaller', raid: 'The Tidebound Grotto', sources: ['the encounter journal', 'raid strategy guides', 'real Mythic logs'], rules: [
  { type: 'raidFail', spellIds: [1271380], name: 'Pulsing Tides', severity: 'High', tip: 'Murlocs reached the bubble and came out as Bubblefin Berserkers, which pulse the whole raid every 3 seconds. Kill murlocs before they reach the bubble, and kill any Berserker at once.' },
  { type: 'raidFail', spellIds: [1313456], name: 'Shatter', severity: 'High', tip: 'A Frost Orb was left untouched and exploded on the whole raid. Soak every orb before it blows up.' },
  { type: 'avoidable', spellIds: [1258677], name: 'Swirling Whirlpools', severity: 'Medium', tip: 'Stand in the one gap the whirlpools leave as they surge toward the bubble.' },
  // (Lingering Frost, the ice an orb leaves, isn't a rule: on the kill only orb soakers took it)
  { type: 'debuff', spellIds: [1265425], name: 'Wild Bite', severity: 'Medium', tip: "You stayed in the water and the sharks bit you. Get out fast, and don't stand where Pop!'s knockback pushes you in." },
  { type: 'raidFail', spellIds: [1294867, 1295086], name: 'Unending Tides', severity: 'High', tip: 'Nymrissa reached her enrage and flooded the raid. More damage on the boss.' },
]},
// (Nek'zali: spell IDs checked against real Mythic pulls, 2026-10. Slithering Flame isn't a rule: every player outside
// the Hungering Pyre soak gets it by design. Amani in the well, the corpses, Ignition and Invoke are the fight module's.)
{ encounter: "Nek'zali the Soulcoiler", sources: ['the encounter journal', 'raid strategy guides', 'real Mythic logs'], rules: [
  { type: 'avoidable', spellIds: [1294846], name: 'Anguished Echoes', severity: 'Medium', tip: 'Dodge the circles that rain out of the well during Soulcoil Ignition.' },
  { type: 'avoidable', spellIds: [1288554], name: 'Latent Cultist', severity: 'Medium', tip: 'Stay out of the cultist puddles (they move around the well in P2), and walk to the side of the room before Essence Rend is dispelled so the cultist spawns out of the way.' },
  { type: 'avoidable', spellIds: [1292248, 1289902], name: 'Soul Transfer', severity: 'High', tip: "Step out of the Echo of Jawae's line toward Nek'zali before its 15-second channel ends." },
  { type: 'avoidable', spellIds: [1300239], name: 'Swirling Spirit', severity: 'Low', difficulties: ['Mythic'], tip: 'Avoid the spirits circling inside the well during Grasping Depths. Their damage stacks.' },
  { type: 'debuff', spellIds: [1290361], name: 'Soulcoiled', severity: 'High', tip: "Your soul was dragged to the well. Don't die in the well, and make sure Soulcoiler's Curse gets interrupted on Mythic." },
  { type: 'interrupt', spellIds: [1300238], name: "Soulcoiler's Curse", severity: 'High', difficulties: ['Mythic'], tip: 'Kick every Soulcoiler\'s Curse from the Drowned Echo. If it lands, everyone in the well is thrown out and Soulcoiled.' },
  { type: 'bossBuff', spellIds: [1284034], name: 'Uncoiled Rage', severity: 'High', tip: "Nek'zali hit full energy. Keep Restless Amani out of the well, reach the intermission before the fourth Soulcoil Ignition, and Bloodlust in P2." },
  { type: 'stacks', spellIds: [1284109], name: 'Hollowing Strikes', severity: 'Low', threshold: 8, tip: 'Tank swap sooner. Each stack cuts healing and absorbs on the tank by 5%. Guides swap at 30 to 40%, 6 to 8 stacks.' },
]},
{ encounter: 'Entombed Sentinels', sources: SRC, rules: [
  { type: 'raidFail', spellIds: [1284452], name: 'Noxious Blast', severity: 'High', tip: 'A Toxic Droplet was left alone and exploded on the whole raid. Step on every droplet before it erupts.' },
  // (Living Venom hits log as 1284209, read from Mythic pulls. Clinging Murk is NOT a pool: it lands on every Unstable
  // Miasma soaker at the soak, so it isn't avoidable)
  { type: 'avoidable', spellIds: [1284207, 1284209], name: 'Living Venom', severity: 'Medium', difficulties: ['Heroic', 'Mythic'], tip: 'After a droplet is destroyed, its venom flies back to the Breath of Ula\'tek. Stay out of its path.' },
  // (named apart from the Blood Venom debuff: rules also match by name, and every Miasma soaker takes that one)
  { type: 'avoidable', spellIds: [1284208], name: 'Blood pool', severity: 'Medium', difficulties: ['Heroic', 'Mythic'], tip: 'Get out of blood pools, and drop your own pool at the room edge or on an existing pool.' },
  // (Cultivated Burst, a Helical Toxins not solved, is flagged by the fight module with who and when)
  { type: 'avoidable', spellIds: [1296962], name: 'Protovenom Eruption', severity: 'Low', /* (fix 16, Oct 26: one Medium per player hit; top kills erupt and win) */ difficulties: ['Mythic'], tip: 'Only touch another player who also has Shifting Protovenom. Touching an unmarked player erupts and knocks you both back.' },
]},
// (Vashnik: spell IDs checked against real Mythic pulls, 2026-10; Malignant Burst and Malignance weren't in them, so they
// match by name. The fight module covers the adds, totems, soaks, dispels and tank swaps.)
{ encounter: 'Vashnik the Malignant', sources: ['the encounter journal', 'raid strategy guides', 'real Mythic logs'], rules: [
  { type: 'raidFail', name: 'Malignant Burst', severity: 'High', tip: 'A living venom reached the Malignant Cavity. Kill or control every venom add before it gets to the middle. More than one usually wipes.' },
  { type: 'raidFail', spellIds: [1282616], name: 'Catalytic Bile', severity: 'Low', tip: 'A Catalytic Bile landed with nobody under it and hit the whole raid. Spread so every impact has someone within 6 yards.' },
  { type: 'avoidable', spellIds: [1295798], name: 'Plague Wave', severity: 'High', tip: 'Stay off the four lines (north, south, east and west) through every Plague Froth target as it ends.' },
  { type: 'avoidable', spellIds: [1286737], name: 'Umbral Ejection', severity: 'Medium', tip: 'Step out of the circles a Shrouded Venom leaves when it dies.' },
]},
// (Lost Explorers: spell IDs checked against real Mythic pulls, 2026-10; the fight module covers boxes, United Defense,
// Final Ascension, Frostfire, Blink Nova, Mighty Thud, the bomb and tank stacks)
{ encounter: 'The Lost Explorers', sources: ['the encounter journal', 'raid strategy guides', 'real Mythic logs'], rules: [
  { type: 'avoidable', spellIds: [1310500], name: 'Aftershock', severity: 'Medium', tip: 'Step out of the Aftershock craters Mighty Thud leaves. They last 30 seconds.' },
  { type: 'avoidable', spellIds: [1292764], name: 'Evil Eyes', severity: 'Medium', tip: 'Stay out of the flame puddles the statues leave.' },
  { type: 'bossBuff', spellIds: [1297646], name: 'United Defense', severity: 'High', tip: 'All three explorers were within 30 yards of each other. Keep at most two of them together.' },
  { type: 'raidFail', name: 'Relic Rupture', severity: 'High', tip: 'A box glowed green and ruptured on the raid. Your box popper needs to keep popping on the 2-stacks rhythm.' },
  { type: 'raidFail', spellIds: [1292780], name: 'Final Ascension', severity: 'High', tip: 'Final Ascension went off before a fish stopped it. Feed the Disgusting Fish with about 4 seconds left on the cast.' },
  { type: 'interrupt', spellIds: [1286922], name: 'Icebound Flames', severity: 'Medium', tip: "Interrupt Iku's Icebound Flames. Dispel it if a kick is missed." },
  { type: 'debuff', spellIds: [1291918], name: 'Shell Spin', severity: 'Low', tip: "Stunned by Shell Spin. Don't stand in front of Nama, and melee should bait it toward the room's edge." },
]},
// (Sszorak: spell IDs checked against real Mythic pulls, 2026-10. A Tempest touch and its stacking DoT share an ID, so it
// counts touches, not ticks. Unbound Ferocity, the Serpent's Fury enrage, is flagged by the fight module with why.)
{ encounter: 'Sszorak', sources: ['the encounter journal', 'raid strategy guides', 'real Mythic logs'], rules: [
  { type: 'avoidable', spellIds: [1287083], name: 'Tempest', severity: 'Medium', ticks: true, tip: 'Dodge the tornadoes Tempest sends roaming out from Sszorak. Each touch hits hard and stacks a damage over time.' },
  { type: 'avoidable', spellIds: [1305998], name: 'Caustic Claws', severity: 'Medium', tip: 'Step out of the venom splashes that land around Sszorak during Venomous Surge.' },
  { type: 'avoidable', spellIds: [1296667], name: 'Caustic Residue', severity: 'Low', ticks: true, escalate: { touches: 8, severity: 'Medium' }, difficulties: ['Heroic', 'Mythic'], tip: 'Step out of the Caustic Residue puddles. The tank moves Sszorak to a clean part of the room.' },
]},
{ encounter: 'The Twin Fangs', sources: SRC, rules: [
  { type: 'stacks', name: 'Eternal Venom', severity: 'Medium', threshold: 6,
    sources: { unavoidable: ['Venomous Emergence'], soak: ['Caustic Globule', 'Tainted Blood'], avoidable: ['Stir the Depths'] }, tip: 'Dodge mechanics to avoid extra venom stacks and clear some at Ravenous Feast. Stacks become lethal at 11 on Normal and 10 on Heroic and Mythic.' },
  // Sanguine Storm is damage only (no venom stacks): minor
  { type: 'avoidable', name: 'Sanguine Storm', severity: 'Low', tip: 'Avoid the Sanguine Storm swirlies, and on Heroic and Mythic the puddles they leave behind.' },
]},
{ encounter: 'The Coiled Altar', aliases: ['The Bargained Crown'], sources: ['raid strategy guides'], rules: [
  { type: 'interrupt', spellIds: [1286399], name: 'Wail of Terror', severity: 'High', tip: 'Kick the Spiteful Soulcoiler\'s Wail of Terror (a raid-wide fear). On Mythic, interrupting it also briefly reveals the hidden ghosts.' },
  // (damage spell 1285017 is a debuff that ticks fast while you stand in an axe: counted per touch, not per tick)
  { type: 'avoidable', spellIds: [1283832, 1285017], name: 'Axegrinder', severity: 'Low', ticks: true, escalate: { touches: 12, severity: 'Medium' }, tip: 'Dodge the Axegrinder axes. When Zul\'jan throws them, anyone they fly into is knocked back; then they roll around the room at random for 3 minutes and hurt anyone they touch. Ranged: stay out of melee when you can. Melee: step into a puddle rather than an axe.' },
  // (the axe erupts 6 s after it lands, 40 yd around it (journal; Wowhead 1283623 / 1299396; 6.0 s in every drop of a real
  // Mythic kill). Inside: Widow's Kiss, or Death's Embrace for Grim Guillotine; outside: the small Widow's Touch / Death's Whisper)
  { type: 'avoidable', spellIds: [1283623, 1299396], name: "Widow's Kiss", severity: 'Medium', tip: 'Soak, then run at least 40 yards from where the axe landed. It erupts 6 seconds after it lands (Widow\'s Kiss, or Death\'s Embrace for Grim Guillotine).' },
]},
// (Ula'tek: spell IDs checked against real Heroic and Mythic pulls, 2026-10; the fight module covers the rest)
{ encounter: "Ula'tek", sources: ['the encounter journal', 'raid strategy guides', 'real Heroic and Mythic logs'], rules: [
  { type: 'avoidable', spellIds: [1292403], name: 'Caustic Waves', severity: 'Medium', tip: "Dodge the venom waves from Ula'tek and her tail. On Stage 1 she lifts a wing first to show the side." },
  { type: 'raidFail', spellIds: [1299206], name: 'Rattler Slam', severity: 'High', tip: 'Nobody was in reach of the tail (Gore Rattle), so it slammed the raid. Keep a tank on the tail at all times.' },
  { type: 'raidFail', spellIds: [1301007], name: 'Unchecked Rage', severity: 'High', tip: "Nobody was in melee of Ula'tek, so she hit the raid. Keep her tanked through swaps and when she resurfaces." },
  { type: 'raidFail', spellIds: [1290991], name: 'Malice', severity: 'High', tip: "A Doomscale Warden's Malice went off on the raid. Interrupt it the moment it starts." },
  { type: 'interrupt', spellIds: [1290779], name: 'Malice', severity: 'High', tip: "Interrupt the Doomscale Warden's Malice." },
  { type: 'interrupt', spellIds: [1305650], name: 'Anguished Cry', severity: 'High', tip: "Interrupt the Weakened Doomscale's Anguished Cry." },
  { type: 'interrupt', spellIds: [1310764], name: 'Vicious Echoes', severity: 'High', tip: "Interrupt the Blightscale Shrieker's Vicious Echoes (a raid hit and stun)." },
]},
// (Venom Roar and Dark Devastation hit the tanks by design, and Commanding Presence lands on adds as they spawn, so none is a rule)
{ encounter: "Kith'ix", raid: "The Unbinding of Kith'ix", sources: ['the encounter journal', 'raid strategy guides', 'real Heroic logs'], rules: [
  { type: 'avoidable', spellIds: [1303685], name: 'Twisted Appendage', severity: 'Medium', tip: 'Dodge the tentacle slaps. Step out of the circle before it lands, about 3 seconds after it shows.' },
  { type: 'debuff', spellIds: [1303257], name: 'Suffocation', severity: 'Medium', tip: "You left Liadrin's Refulgent Bulwark during Suffocating Darkness. Stay inside it until Divine Radiance." },
  { type: 'avoidable', spellIds: [1308881], name: 'Nullshards', severity: 'Low', tip: 'Dodge the shards the Null Gates release in phase 2. Each hit stacks Nullify, and enough stacks kill you.' },
]},
];

const DIFF = { 1: 'Normal', 2: 'Heroic', 8: 'Mythic+', 14: 'Normal', 15: 'Heroic', 16: 'Mythic', 17: 'LFR', 23: 'Mythic' };
const WANTED = new Set(['COMBATANT_INFO', 'SPELL_DAMAGE', 'SPELL_PERIODIC_DAMAGE', 'RANGE_DAMAGE', 'SWING_DAMAGE',
  'ENVIRONMENTAL_DAMAGE', 'SPELL_HEAL', 'SPELL_PERIODIC_HEAL', 'SPELL_ABSORBED', 'SPELL_HEAL_ABSORBED', 'SPELL_CAST_SUCCESS',
  'SPELL_INTERRUPT', 'SPELL_DISPEL', 'SPELL_SUMMON', 'UNIT_DIED', 'SPELL_RESURRECT', 'SPELL_AURA_APPLIED', 'SPELL_AURA_APPLIED_DOSE', 'SPELL_AURA_REMOVED_DOSE', 'SPELL_AURA_REMOVED', 'SPELL_CAST_START',
  'SPELL_ENERGIZE', 'SPELL_PERIODIC_ENERGIZE',
  // (Augmentation's share of other players' hits, and missed auto attacks for melee uptime, Oct 19)
  'SPELL_DAMAGE_SUPPORT', 'SPELL_PERIODIC_DAMAGE_SUPPORT', 'RANGE_DAMAGE_SUPPORT', 'SWING_DAMAGE_LANDED_SUPPORT', 'SWING_MISSED']);

// Spell school per spell ID, learned from the log (used for icon colors).
const SCHOOL = new Map();
// spell name -> ID as seen in the log, so a mechanic named only by text still gets its game icon and tooltip
const SPELLID = new Map();
const noteId = (id, name) => { if (id && name && id !== 6603) { const k = String(name).toLowerCase(); if (!SPELLID.has(k)) SPELLID.set(k, id); } };
// spell name -> ID for what enemies cast, hit players with or put on them, as seen in the log: a boss ability named
// anywhere in the app gets its tooltip, even one the rules and fight modules only know by name
const ENEMY_SPELL = new Map();
// The boss's own windows the Rotation tab grades cooldowns against (Oct 19, from the guide library's boss notes): when it takes
// more damage (Dig In, Ghastly Regeneration, Rage of the Shackled) or almost none (Vitriolic Stasis). Kept on the pull as
// r.bossAuras: [{ n, a, e }], one entry per window (the same aura on several units at once is one window).
const BOSS_AURA_N = new Set(['dig in', 'ghastly regeneration', 'rage of the shackled', 'vitriolic stasis']);
function bossAura(r, n, t, on) {
  const l = r.bossAuras || (r.bossAuras = []), w = l.filter((x) => x.n === n).pop();
  if (on) { if (!w || (w.e != null && t - w.e > 2)) l.push({ n, a: t, e: null }); else if (w.e != null) w.e = null; }
  else if (w && w.e == null) w.e = t;
}
const ENEMY_EV = new Set(['SPELL_DAMAGE', 'SPELL_PERIODIC_DAMAGE', 'SPELL_MISSED', 'SPELL_PERIODIC_MISSED', 'SPELL_CAST_START', 'SPELL_CAST_SUCCESS', 'SPELL_AURA_APPLIED', 'SPELL_AURA_APPLIED_DOSE', 'SPELL_SUMMON']);
const noteEnemy = (id, name) => { if (id && name && id !== 6603) { const k = String(name).toLowerCase(); if (!ENEMY_SPELL.has(k)) ENEMY_SPELL.set(k, id); } };
const noteSchool = (id, hex) => { if (id && hex && !SCHOOL.has(id)) { const v = parseInt(hex, 16); if (v) SCHOOL.set(id, v); } };

// ---------- helpers ----------
const num = (x) => { const v = +x; return v === v ? v : 0; };
const isPlayer = (g) => g && g.startsWith('Player-');
const shortName = (g, n) => (isPlayer(g) && n.indexOf('-') > 0 ? n.slice(0, n.indexOf('-')) : n);
const fmtT = (s) => { s = Math.max(0, s); return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };

function parseTs(line) {
  const i = line.indexOf('  ');
  if (i < 8 || i > 40) return null;
  const sp = line.indexOf(' ');
  const d = line.substring(0, sp).split('/');
  let t = line.substring(sp + 1, i);
  // (the clock is the PC's local time, with its offset from UTC after it: "19:24:38.123-5"; ms is that clock read as
  // UTC, and off the offset, so ms - off is the real time)
  const tz = Math.max(t.lastIndexOf('-'), t.lastIndexOf('+')), off = tz > 0 ? parseFloat(t.substring(tz)) * 3600e3 : null;
  if (tz > 0) t = t.substring(0, tz);
  const p = t.split(/[:.]/);
  if (d.length !== 3 || p.length < 3) return null;
  const ms = p.length > 3 ? parseInt((p[3] + '000').substring(0, 3), 10) : 0;
  const v = Date.UTC(+d[2], +d[0] - 1, +d[1], +p[0], +p[1], +p[2], ms);
  return v === v ? { ms: v, body: i + 2, off: off === off ? off : null } : null;
}

function split(s, start) {
  const res = [];
  let seg = start, q = false, depth = 0;
  for (let i = start; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 34) { q = !q; continue; }
    if (q) continue;
    if (c === 40 || c === 91) depth++;
    else if (c === 41 || c === 93) depth--;
    else if (c === 44 && depth === 0) { res.push(unq(s.substring(seg, i))); seg = i + 1; }
  }
  res.push(unq(s.substring(seg)));
  return res;
}
function unq(x) { return x.charCodeAt(0) === 34 && x.length > 1 ? x.slice(1, -1) : x; }

// ---------- indexing: find pulls by byte offset ----------
// Raids only: a Mythic+ key, and any dungeon boss (a 5-player group or a dungeon difficulty), is left out entirely.
// (a key is still followed, so the bosses inside it are recognized and skipped)
const DUNGEON_DIFF = new Set([1, 2, 8, 23, 24, 150, 205, 208, 216, 236]);
const isDungeon = (diffId, size) => DUNGEON_DIFF.has(diffId) || (size > 0 && size <= 5);
// (the in-game app asks for dungeon bosses too (Oct 24): Normal, Heroic, Mythic and keystone dungeons, each marked dungeon with its key level)
const DUNGEON_BOSS = new Set([1, 2, 8, 23]);
function createIndexer(opts) {
  const bosses = [], runs = [], pulls = {}, withDungeons = !!(opts && opts.dungeons);
  let cur = null, run = null, lastMs = 0;
  return {
    line(text, start, end) {
      const ts = parseTs(text); if (!ts) return;
      lastMs = ts.ms;
      const c = text.indexOf(',', ts.body); if (c < 0) return;
      const ev = text.substring(ts.body, c);
      const f = split(text, c + 1);
      if (ev === 'ENCOUNTER_START' && f.length >= 4) {
        if (cur) { cur.endByte = start; cur.result = 'Unknown'; }
        const diffId = +f[2];
        cur = { kind: 'boss', id: +f[0], boss: f[1], diffId, diff: DIFF[diffId] || ('Difficulty ' + diffId), size: +f[3],
          startMs: ts.ms, wallMs: ts.off != null ? ts.ms - ts.off : undefined, startByte: start, endByte: 0, kill: false, result: 'In progress', duration: 0, pull: 1, run: null }; // (wallMs: the real time, as Warcraft Logs pulls have it)
        // (for the app, only a dungeon difficulty counts as inside a key: a key left without its end line never makes a raid boss a dungeon boss)
        const inKey = run && (!withDungeons || DUNGEON_DIFF.has(diffId)), dun = inKey || isDungeon(diffId, +f[3]);
        if (dun && !(withDungeons && DUNGEON_BOSS.has(diffId))) cur.skip = true; // (a dungeon boss: followed to its end, never listed on the site)
        else { if (dun) { cur.dungeon = true; if (inKey && run.level > 0) cur.key = run.level; } const k = cur.id + ':' + diffId; pulls[k] = (pulls[k] || 0) + 1; cur.pull = pulls[k]; bosses.push(cur); }
      } else if (ev === 'ENCOUNTER_END' && cur && +f[0] === cur.id) {
        cur.kill = f[4] === '1'; cur.result = cur.kill ? 'Kill' : 'Wipe';
        cur.duration = num(f[5]) / 1000; cur.endByte = end; cur = null;
      } else if (ev === 'CHALLENGE_MODE_START') {
        run = { kind: 'run', boss: f[0], zone: f[0], level: +f[3], diff: '+' + f[3], startMs: ts.ms, startByte: start, endByte: 0,
          kill: false, result: 'In progress', duration: 0, bosses: [] }; // (not listed: raids only)
      } else if (ev === 'CHALLENGE_MODE_END' && run) {
        run.kill = f[1] === '1'; run.result = run.kill ? 'Timed' : 'Depleted';
        run.duration = num(f[3]) / 1000 || (ts.ms - run.startMs) / 1000; run.endByte = end; run = null;
      }
    },
    peek() { return { bosses, runs }; }, // (live logging: what's been found so far, without closing an unfinished pull)
    finish(size) {
      for (const x of [cur, run]) if (x && !x.endByte) { x.endByte = size; x.duration = (lastMs - x.startMs) / 1000; }
      for (const r of runs) for (const b of r.bosses) if (!b.endByte) b.endByte = r.endByte;
      return { bosses, runs };
    },
  };
}

// Live logging from a combat log that WoW is still writing: feed it the new bytes as the file grows; peek() lists the
// pulls found so far (an unfinished pull stays "In progress" until its ENCOUNTER_END line arrives).
function liveIndexer() {
  const ix = createIndexer(), dec = new TextDecoder();
  let carry = null, offset = 0;
  const check = (b, s, e, off) => {
    const lim = Math.min(e - 2, s + 48);
    for (let i = s + 8; i < lim; i++) {
      if (b[i] === 32 && b[i + 1] === 32) {
        const k = b[i + 2];
        if (k === 69 || k === 67) { const tag = dec.decode(b.subarray(i + 2, Math.min(e, i + 17))); if (tag.startsWith('ENCOUNTER_') || tag.startsWith('CHALLENGE_MODE_')) ix.line(dec.decode(b.subarray(s, e)), off + s, off + e + 1); }
        return;
      }
    }
  };
  return {
    feed(value) {
      let buf = value;
      if (carry && carry.length) { const m = new Uint8Array(carry.length + value.length); m.set(carry); m.set(value, carry.length); buf = m; }
      let s = 0, nl;
      while ((nl = buf.indexOf(10, s)) !== -1) { check(buf, s, nl, offset); s = nl + 1; }
      carry = buf.slice(s); offset += s;
    },
    peek: () => ix.peek(),
  };
}

// next(): Promise<{done, value: Uint8Array}>
async function indexChunks(next, total, onProgress) {
  const ix = createIndexer();
  const dec = new TextDecoder();
  let carry = null, offset = 0;
  const check = (b, s, e, off) => {
    const lim = Math.min(e - 2, s + 48);
    for (let i = s + 8; i < lim; i++) {
      if (b[i] === 32 && b[i + 1] === 32) {
        const k = b[i + 2];
        if (k === 69 || k === 67) { // 'E'ncounter / 'C'hallenge
          const tag = dec.decode(b.subarray(i + 2, Math.min(e, i + 17)));
          if (tag.startsWith('ENCOUNTER_') || tag.startsWith('CHALLENGE_MODE_')) ix.line(dec.decode(b.subarray(s, e)), off + s, off + e + 1);
        }
        return;
      }
    }
  };
  for (;;) {
    const { done, value } = await next();
    if (done) break;
    let buf = value;
    if (carry && carry.length) { const m = new Uint8Array(carry.length + value.length); m.set(carry); m.set(value, carry.length); buf = m; }
    let s = 0, nl;
    while ((nl = buf.indexOf(10, s)) !== -1) { check(buf, s, nl, offset); s = nl + 1; }
    carry = buf.subarray(s); offset += s;
    if (onProgress) onProgress(Math.min(1, offset / total));
  }
  if (carry && carry.length) check(carry, 0, carry.length, offset);
  return ix.finish(offset + (carry ? carry.length : 0));
}

// For the cooldown timeline: when a boss cast lands (cast success) and who it was aimed at (players who got its
// debuff, or failing that, who took its damage). Raid-wide when it hit most of the raid.
function markInfo(ev, n, t, h, nPlayers) {
  const L = (x) => String(x).toLowerCase();
  const land = (ev.find((e) => e.k === 'cast' && L(e.spell) === n && e.t >= t && e.t <= t + 10) || { t }).t;
  let who = [...new Set(ev.filter((e) => e.k === 'aura' && e.op === 'apply' && L(e.spell) === n && h.isPlayer(e.dst) && e.t >= t - 0.5 && e.t <= land + 2).map((e) => e.dst))];
  if (!who.length) who = [...new Set(ev.filter((e) => e.k === 'dmg' && L(e.spell) === n && h.isPlayer(e.dst) && e.t >= land - 0.3 && e.t <= land + 2.5).map((e) => e.dst))];
  const raid = who.length >= Math.max(6, nPlayers * 0.5);
  return { land, who: raid ? [] : who.slice(0, 8).map((g) => h.name(g)), raid, hits: who.length };
}

// ---------- fight audit modules ----------// A module watches a set of spells for one encounter, gets those events after parsing,
// and returns phases, a timeline, audit sections (who / when / how) and mistakes.
// Strategy for The Coiled Altar follows published Mythic raid guides (spell IDs from the same).
const CA_IDS = {
  'toxic deluge': 1299960, 'virulent mutation': 1310544, 'mutagenic venom': 1310498, 'venom rupture': 1299838, 'coalesced venom': 1282403,
  'sever': 1299680, 'soul sever': 1286620, 'blighted sever': 1307279, 'guillotine': 1283489, 'grim guillotine': 1299267,
  'fangs of the coiled altar': 1282487, 'dreadmarch': 1285643, 'malevolent resonance': 1310732, 'spiritcackle': 1286441,
  'wail of terror': 1286399, 'gloombomb': 1310882, 'spirit shield': 1309105, 'soulbinding': 1304032, 'spirit erasure': 1287722,
  'reclaim essence': 1287718, 'eternal nightfall': 1286918, 'defilement of the coiled altar': 1298381, 'axegrinder': 1283832, 'venomfang': 1306906, // (Zul'jan's Venomfang debuff; cast 1282287. A player ability of the same name is 1306635)
  'volatile venom': 1282288, "widow's kiss": 1283623, "death's embrace": 1299396, // (the axe's eruption, 6 s after a Guillotine / Grim Guillotine lands)
};
const TF_SPELLS = ['eternal venom', 'venomous emergence', 'caustic globule', 'tainted blood', 'stir the depths', 'ravenous feast', 'sanguine storm', 'coiling ichor', 'corrosive spit', 'barbed bulwark', 'stone breaker', 'uncoiled wrath', 'tainted burst'];
// Twin Fangs spell IDs, read from a Mythic kill. Several mechanics log under shared names, so the module
// matches these by ID (MODULES entry `ids`).
const TF = {
  spitAim: 1293979, spit: 1293295, // Corrosive Spit: aim debuff on the target (~5s), then the hit
  ichorDeb: 1290814, ichor: 1290878, // Coiling Ichor: target debuff (~12s), circle damage
  glob: 1289201, bulHit: [1307363, 1307538], // Caustic Globule soak hit; Barbed Bulwark hits on players
  bulwark: 1303378, // Mythic: the barrier each globule channels as it spawns (crowd control or a kick breaks it)
  globBurst: 1290338, // a Caustic Globule nobody soaked exploding on the whole raid (hits ~20 players at once)
  strike: 1290662, feasted: 1310096, tainted: 1310102, // Ravenous Feast strike, Feasted debuff, Tainted Blood
  sbCast: 1288538, sbDeb: 1289092, sbTank: 1310371, sbRaid: [1289153, 1289154], // Stone Breaker: tank debuff, tank soak, raid hit
  wrath: 1308711, // Uncoiled Wrath (boss enrage once its twin is dead)
};
const TF_IDS = Object.values(TF).flat();
// Entombed Sentinels spell IDs, read from Mythic pulls on Warcraft Logs (Sep 2026) and checked against Wowhead's
// tooltips. Matched by ID (MODULES entry `ids`).
const ES = {
  acid: 1284500, blood: 1284506, // Mark of Acid (Breath of Ula'tek) / Mark of Blood (Blood of Ula'tek): each boss's stacking DoT on everyone within 40 yd
  stasis: [1284588, 1284606], stasisHeal: 1284635, // Vitriolic Stasis (the intermission, a buff on each boss), the weaker boss healing up
  dropCast: 1284434, drop: 1284451, blast: 1284452, lv: 1284209, // Toxic Droplets: the cast, a droplet stepped on (375k), one erupting on the raid (Noxious Blast); Living Venom (venom flying back to the boss)
  coagCast: 1284251, contam: 1284258, // Venom Coagulation: the add's spawn cast, its Contaminate pulses on the raid
  slam: 1284458, injCast: 1284487, inj: 1284491, // tank hits: Empowering Slam (green), Bloodvenom Injection (red, a stacking debuff that drops a pool when it ends)
  bbCast: 1284483, bb: 1284471, // Blighted Blood: the cast, the dispellable DoT (a pool if it runs out)
  miCast: 1288232, miTarget: 1288260, miHit: 1288282, // Unstable Miasma: the cast, the marked player, the soak hit
  venom: 1284210, pool: 1284208, murk: [1288297, 1303097], // Blood Venom (a pool when it ends, bigger with more stacks), the pool's damage, Clinging Murk (on every Miasma soaker at the soak)
  pvCast: 1296878, pv: 1296880, pvTick: 1296882, erupt: 1296962, // Mythic Shifting Protovenom: the cast, the circle, its pulse (233k / 2 s), Protovenom Eruption
  helix: 1284590, helixTick: 1284813, cb: 1284941, cbDeb: 1284947, cbPool: 1284948, // Helical Toxins (the intermission's pairing game, 28 s) and Cultivated Burst (not solved)
};
const ES_IDS = Object.values(ES).flat();
// Sszorak spell IDs, read from Mythic pulls on Warcraft Logs (Sep to Oct 2026) and checked against Wowhead's journal
// tooltips. Matched by ID (MODULES entry `ids`).
const SZ = {
  ravageCast: 1277002, ravage: 1277101, ravageDeb: 1277105, // Ravage: the cast, its hit, the vulnerability it leaves on the tank (25 s)
  mutCast: 1277027, mut: 1285999, gash: 1277051, // Mutilate: the cast, the soak hit (split), Mutilated Gash (22 s; the next Mutilate hits that player 500% harder)
  tempestCast: 1287072, tempest: 1287083, // Tempest: the cast, a tornado touching a player (its hit and the stacking DoT share the ID)
  surgeCast: 1305959, surge: 1305963, // Venomous Surge: the cast, the 10 s debuff on two players (a Viscous Cyst drops where it ends)
  cyst: 1287205, // a Viscous Cyst popping: its hit and the wind-resisting coat it leaves share the ID
  claws: 1305998, residue: 1296667, // Caustic Claws (the splashes) and Caustic Residue (their puddles)
  cwCast: 1285419, cw: [1285425, 1285453, 1297096, 1297111], cwHit: 1285616, gusts: 1285447, // Raging Crosswinds: the cast, the four arrows, a flying player's hit, Turbulent Gusts (the launch)
  digIn: 1286033, // Dig In: the intermission at 100 energy (25 s, 30% more damage taken; the winds blow during it)
  fury: 1305621, enrage: 1296898, vir: [1297707, 1299899], virClip: 1300089, // Mythic: the Serpent's Fury mark, Unbound Ferocity (the enrage at 100 rage), Virulence on each soaker, a Virulence burst clipping someone
};
const SZ_IDS = Object.values(SZ).flat();
// Each Raging Crosswinds arrow is its own debuff, one per direction (the tooltips are the same). The way each one launches
// was measured from players who drifted on Mythic pulls (Oct 2026): fixed for the room, two opposite pairs at right
// angles, about 17 degrees off the compass. [degrees in map space, east = 0, counterclockwise; the nearest compass word]
const SZ_CW = { 1285425: [73, 'north'], 1297111: [163, 'west'], 1285453: [253, 'south'], 1297096: [343, 'east'] };
// Nek'zali the Soulcoiler spell IDs, read from real Mythic pulls on Warcraft Logs (Sep to Oct 2026). Matched by ID
// (MODULES entry `ids`).
const NZ = {
  ignition: 1293664, ignitionCh: 1285681, echoes: 1294846, // Soulcoil Ignition: the cast, its channel (her aura), Anguished Echoes (the circles out of the well)
  rite: 1288772, burn: 1297624, // Soulcoil Rite (every feed of the well: a raid hit and a stacking damage over time), Ritual Burn (Heroic and Mythic: +15% from the next Rites per stack, 60 s)
  barrage: 1284103, barrageHit: 1292034, hollow: 1284109, // Possession Barrage (the cast and the tank's debuff; the spirits' raid damage), Hollowing Strikes (tank stacks)
  rend: 1287434, rendPull: 1287427, cultist: 1288554, // Essence Rend: the dispellable damage over time (a Latent Cultist spawns where it ends), its pull, a cultist's hit
  shield: 1287533, blight: [1307939, 1294729], // Restless Amani: Gravebound Advance (the magic shield each spawns with), Corpse Blight (a dead Amani's burst and damage over time)
  vessel: 1297631, vesselHit: 1297630, // Vessel of Awakening: a corpse coming back (its aura), the revived Amani's pulse on the raid
  ritual: 1295124, ritualAura: 1289683, // the intermission: Ritual of Awakening (the cast, her aura)
  transfer: [1292248, 1289902, 1293211], pyre: 1289855, flame: 1294933, // Echo of Jawae: Soul Transfer (the 15 s channel and line blast), Hungering Pyre (the soak), Slithering Flame (on the non-soakers)
  uncoil: 1290003, invoke: 1299673, invokeDeb: 1299722, // P2: Uncoiling (her aura as it starts), Invoke (the cast; Mythic: the debuff on players it interrupted)
  depths: 1293212, coil: 1308227, coilDeb: 1300524, curse: 1300238, spirit: 1300239, exhaust: 1300235, // Mythic Grasping Depths: the well's aura while a Drowned Echo lives, Immortal Coil (on the players in the well), Soulcoiler's Curse, Swirling Spirit, Soul Exhaustion
  soulcoiled: 1290361, rage: 1284034, // Soulcoiled, Uncoiled Rage (the enrage at 100 energy)
};
const NZ_IDS = Object.values(NZ).flat();
// Nymrissa Wavecaller (Frost Orbs) spell IDs, read from a real Mythic kill on Warcraft Logs (Sep 16 2026): Chilling Frost
// marks 3 players and drops a Frost Orb under each; whoever touches an orb takes Frost Orb (a hit, logged as immune for
// someone in an immunity, and a debuff) and, on Mythic, sets off Frost Burst on the raid; an orb nobody touches Shatters.
const NY = { chill: 1313393, orb: 1313448, burst: 1313450, shatter: 1313456,
  // (audit Oct 19, from a top Mythic kill: Water Jet, the tank's beam (cast, the tank's debuff, its hits), and Lingering Frost, the ice puddles)
  jet: 1281951, jetTank: 1258901, jetHit: [1271458, 1260637], frost: 1257654,
  // (Oct 20, from the guild's Mythic pulls: the murloc sets. Alluring Bubble is the boss's cast and the aura on every murloc it
  // lures (gone when it dies, kept by one that reaches the bubble), Waterfog Shield the Frostscale's own aura, Pulsing Tides
  // the Berserker that a popped bubble lets out (its buff, its raid pulses))
  bubble: 1257717, lure: 1260012, shield: 1273091, berserk: 1258894, tides: 1271380,
  // (Swirling Whirlpools (cast, hits), Pop! (the bubble bursting: raid hit), Wild Bite (the sharks, in the water), Abyssal Rain (cast, damage over time))
  whirl: 1258673, whirlHit: 1258677, popHit: 1266340, bite: 1265425, rain: 1260837, rainDot: 1260843 };
const NY_IDS = Object.values(NY).flat();
// (raid cooldowns, by name, for the Abyssal Rain check)
const NY_RAIDCD = ['darkness', 'spirit link totem', 'anti-magic zone', 'rallying cry', 'power word: barrier', 'aura mastery', 'tranquility', 'revival', 'rewind', 'divine hymn', 'vampiric embrace'];
// Vashnik the Malignant spell IDs, read from real Mythic pulls on Warcraft Logs (Sep to Oct 2026). Matched by ID
// (MODULES entry `ids`); the infusions and the rarer failures by name.
const VS = {
  imbibe: 1284663, vapor: 1284561, expulsion: [1298587, 1298583], // Imbibe (at 100 energy: drains the two nearest fountains), Toxic Vapor (its stacking raid damage), the fountains' raid hits at Imbibe (Conflagrating, Gloom)
  catalyst: 1282516, catalystHit: 1282525, bile: 1282602, bileRaid: 1282616, // Malignant Catalyst: the cast, its raid hit, a bile soaked (split within 6 yd), a bile nobody soaked (the whole raid)
  froth: 1281913, frothMark: 1281910, frothTick: 1281925, wave: 1295798, // Plague Froth: the 6 s debuff on a target (the wave goes when it ends), a marker aura that ends at once, its ticks on everyone within 5 yd, Plague Wave (four lines)
  exploding: 1295173, explosion: 1295209, stygian: 1294994, stygBurst: 1302489, // Adaptive Infection: Exploding (fire; a raid hit when it's removed), Stygian (shadow; bursts on players within 6 yd)
  fangs: 1280935, fangsDeb: 1280934, // Dripping Fangs (tank: 100% more physical damage taken for 32 s)
  presence: 1305902, surge: 1285979, coating: 1312366, ejection: 1286737, // adds: Burning Presence (a Burning Venom's aura), Caustic Surge (its death burst), Miasmic Coating (a Shrouded Venom's shield), Umbral Ejection (its burst circles)
  totem: 1306820, malignance: 1304459, // Mythic: Malignant Totem (summoned at each Imbibe), Malignance (each totem's cast: it goes off at the next Imbibe)
};
const VS_IDS = Object.values(VS).flat();
// Kith'ix (The Unbinding of Kith'ix, 12.1.5) spell IDs, read from a Mythic kill on Warcraft Logs (Oct 19 2026) and checked against
// the guide library's boss notes. Matched by ID; Overwhelming Fear's dispels reach the module by name.
const KX = {
  swarm: [1301511, 1301668], frenzy: [1303260, 1303261], juices: 1302319, mindsting: 1304040, // Voidswarm (cast, its raid hit), Dark Frenzy (an add alive at the intermission), Digestive Juices (a Bomber Beetle popping), Mindsting (an egg hatched)
  extinguish: 1304424, embrace: [1304526, 1304508], // Extinguish (the raid hit), Light's Embrace (the mote's buff: 90% less shadow damage)
  horrors: 1304045, fear: 1304046, scream: 1304047, // Unspeakable Horrors (the mark), Overwhelming Fear (the fear), its scream when it's removed
  devCast: 1304930, devHit: [1304946, 1304947], devastated: 1304948, voidscar: 1304950, appendage: 1303685, // tank: Dark Devastation, Devastated (+150% damage taken), the Voidscar puddle, Twisted Appendage
  roar: [1302884, 1302914, 1302917], weave: [1302333, 1302334, 1302336], nightfall: [1302705, 1302727, 1302728], // the adds' Venom Roar (Hulk), Voidweave and Nightfall (Voidweaver)
  suffocate: [1302951, 1303165, 1303257], radiance: [1314099, 1303169, 1303188], grasp: 1303406, fragment: 1308674, exhausted: 1307662, // intermission: Suffocating Darkness, Divine Radiance (its end), Abyssal Grasp, Eclipse Fragment
  howl: 1301110, lastLight: [1305427, 1311977], grace: 1305428, eclipse: [1301479, 1305876], // P2: Stygian Howl, Last Light, Luminous Grace, Eightfold Eclipse
  gate: [1308873, 1308874], nullify: [1308875, 1308876, 1308877], shards: 1308881, negation: 1318467, restab: [1318472, 1318473], // Null Gate, Nullify (stacks), Nullshards, Negation (tank) and Explosive Restabilization (a gate closed)
};
const KX_IDS = Object.values(KX).flat();
// The Lost Explorers spell IDs, read from real Mythic pulls on Warcraft Logs (Sep to Oct 2026). Matched by ID (MODULES
// entry `ids`); Blast Wave, Elemental Explosion and the death enrages (not in those pulls) by name.
const LE = {
  transform: { 1292786: 'Gebbo', 1292784: 'Iku', 1292785: 'Nama' }, // Mor'zahi taking over an explorer (its aura): that explorer's turn
  fish: 1292490, ascension: 1292779, ascensionHit: 1292780, united: 1297646, // a Disgusting Fish fed, Final Ascension (the cast; its raid damage), United Defense (all three within 30 yd)
  junk: 1291933, rupture: 1310028, splinters: 1312853, // Throw Junk (the boxes), Relic Rupture (a box left too long), Splinters (Mythic: the raid's bleed at every box pop)
  bomb: 1297625, bounce: 1299854, // Gebbo: Explosive Surprise (the bomb on a player), Bounce (launched by a mushroom, over the Blast Wave)
  volley: 1295891, flames: 1295928, frost: 1295954, blink: 1296025, blinkHit: 1294334, kick: 1286922, shards: 1295858, // Iku: Frostfire Volley, Burning Flames, Piercing Frost, Blink Nova (the target; the raid hit), Icebound Flames, Shredding Shards (tank)
  thud: 1296133, thudHit: 1300237, aftershock: 1310500, spin: 1291918, steady: 1291929, // Nama: Mighty Thud (each leap; its split hit), Aftershock, Shell Spin (the stun), Steady Strikes (tank)
};
const LE_IDS = Object.keys(LE.transform).map(Number).concat(Object.values(LE).filter((v) => typeof v !== 'object' || Array.isArray(v)).flat());
// Latent Cultist puddles closer than this to the well's centre (yards) are in the way (the guides: get dispelled at the
// side of the room). My call, from where Wolfthorn's Mythic kills dropped them.
const NZ_EDGE = 25;
// Ula'tek spell IDs, read from real Heroic and Mythic pulls (Warcraft Logs, Aug to Oct 2026). Matched by ID (MODULES
// entry `ids`): several share names with player spells or with each other.
const UL = {
  malShell: 1295360, noxShell: 1307612, splash: 1307635, yolk: 1312150, // eggs: carrying (Malignant Shell; Mythic Noxious Shell), carriers touching, a popped carrier
  coil: 1299010, coilHit: 1287265, constrictor: 1300685, // Spectral Coils: a circle's cast, its hit on the raid, the soaker's debuff
  wave: 1292403, waveBig: [1311807, 1319282, 1292211], waveTail: 1298570, thrash: 1296301, // Caustic Waves (the hit/DoT on players; the big wave casts; one from the tail surfacing at the edge), Mephitic Thrash
  wrath: 1298367, wrathHit: 1298369, stone: 1298417, slam: 1299206, unchecked: 1301007, // tanks: Mother's Wrath, Stone Venom stacks, the punishments
  rage: 1286860, debris: 1286885, // Rage of the Shackled (the 20 s damage amp), Falling Debris
  womb: 1303620, fester: 1310763, incub: 1299759, incubHit: 1299919, burn: 1302842, boon: 1299764, // Mythic Blightscale Wretch and Toxic Incubation
  hatching: 1306862, fangs: 1311611, fangsCast: 1301117, vein: 1311609, spit: 1302982, wardenAura: 1306858, desperate: 1305709, revenge: 1307941, wardenGest: 1302950, // Stage 2 (wardenGest: the Warden's Writhing Gestation; a second one is its enrage)
  cots: [1304012, 1315541, 1300751], prey: 1315341, biteCast: 1295905, bite: 1288879, purge: 1312967, purgeBoom: 1305878, corpse: [1306119, 1318329], // intermission and Stage 3
  expulsion: 1313531, boilS: 1315342, // Acidic Expulsion (raid DoT from Rawlings and Shriekers), a Shrieker's Boiling Venom
  cry: 1305650, // a Weakened Doomscale's Anguished Cry (542K to everyone within 60 yards and a 6 s stun; interruptible)
};
const UL_IDS = Object.values(UL).flat();
// names for icons and labels
const UL_N = {
  'malignant shell': UL.malShell, 'noxious shell': UL.noxShell, 'noxious splash': UL.splash, 'rancid yolk': UL.yolk, 'spectral coils': UL.coil, 'soul constrictor': UL.constrictor,
  'caustic waves': UL.wave, 'mephitic thrash': UL.thrash, "mother's wrath": UL.wrath, 'stone venom': UL.stone, 'rattler slam': UL.slam, 'unchecked rage': UL.unchecked,
  'rage of the shackled': UL.rage, 'falling debris': UL.debris, 'toxic womb': UL.womb, 'fester burst': UL.fester, 'toxic incubation': UL.incub, 'toxic burn': UL.burn, "mother's boon": UL.boon,
  'hatching doom': UL.hatching, 'grasping fangs': UL.fangsCast, 'blight vein': UL.vein, 'virulent spit': UL.spit, "warden's protection": UL.wardenAura, 'desperate thrash': UL.desperate, revenge: UL.revenge,
  'call of the serpent': 1300751, 'circling prey': UL.prey, "serpent's bite": UL.biteCast, 'volatile purge': UL.purge, 'calcified corpse': UL.corpse[0], 'acidic expulsion': UL.expulsion, 'boiling venom': UL.boilS, 'writhing gestation': UL.wardenGest,
};
// Ravenous Feast strike circle radius in yards: not published (server-side), measured from 5 Mythic pulls (most
// soak groups fit inside ~8 yd; wider spreads are players moving between position samples).
const FEAST_R = 8;
// (each ground mechanic's colour on the maps, from its spell icon (your note, Oct 18): the icon's main colour, measured, so a
// circle reads as the icon beside it. The word is what the map's key calls it)
const MECH_COL = { 'Ravenous Feast': ['#f24224', 'Red'], 'Coiling Ichor': ['#f2243a', 'Red'], 'Corrosive Spit': ['#9ff26d', 'Green'], 'Shifting Protovenom': ['#9ff26d', 'Green'],
  'Protovenom Eruption': ['#d6f25a', 'Lime'], 'Toxic Droplets': ['#d2f230', 'Lime'], 'Unstable Miasma': ['#f23724', 'Red'], 'Viscous Cyst': ['#d8f22f', 'Lime'], 'Raging Crosswinds': ['#dfe6f2', 'White'],
  'Plague Froth': ['#dbf231', 'Lime'], 'Hungering Pyre': ['#f2a924', 'Orange'], 'Soulcoil Well': ['#2cf2b5', 'Teal'], 'Blink Nova': ['#7a6df2', 'Violet'], 'Mighty Thud': ['#f2842f', 'Orange'],
  'Gloombomb': ['#da3df2', 'Purple'], 'Spectral Coils': ['#24f2cb', 'Teal'], 'Guillotine': ['#f24824', 'Red'], 'Grim Guillotine': ['#46f2d1', 'Teal'], "Widow's Kiss": ['#9ff26d', 'Green'], "Death's Embrace": ['#a35cf2', 'Purple'], 'Noxious Shell': ['#3af2a8', 'Green'], 'Fester Burst': ['#d8f22f', 'Lime'], "Serpent's Bite": ['#f23243', 'Red'],
  'Volatile Purge': ['#9ff224', 'Lime'], 'Frost Orb': ['#7cd4f2', 'Ice blue'] };
const mcol = (n, a) => { const x = MECH_COL[n] || ['#e6b450', 'Gold'], h = x[0]; return { color: h, fill: 'rgba(' + [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',') + ',' + (a == null ? 0.16 : a) + ')', cn: x[1] + ' circle', mn: n }; }; // (mn: the mechanic, for its spell icon on the map)
// Smallest circle around points [[x, y], ...] (Welzl, fine for a handful of soakers): { x, y, r }.
function mec(P) {
  const inC = (c, p) => Math.hypot(p[0] - c.x, p[1] - c.y) <= c.r + 1e-6;
  const two = (a, b) => ({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, r: Math.hypot(a[0] - b[0], a[1] - b[1]) / 2 });
  const three = (a, b, c) => {
    const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1])); if (Math.abs(d) < 1e-9) return null;
    const A = a[0] * a[0] + a[1] * a[1], B = b[0] * b[0] + b[1] * b[1], C = c[0] * c[0] + c[1] * c[1];
    const x = (A * (b[1] - c[1]) + B * (c[1] - a[1]) + C * (a[1] - b[1])) / d, y = (A * (c[0] - b[0]) + B * (a[0] - c[0]) + C * (b[0] - a[0])) / d;
    return { x, y, r: Math.hypot(a[0] - x, a[1] - y) };
  };
  let c = null;
  for (let i = 0; i < P.length; i++) {
    if (c && inC(c, P[i])) continue;
    c = { x: P[i][0], y: P[i][1], r: 0 };
    for (let j = 0; j < i; j++) { if (inC(c, P[j])) continue; c = two(P[i], P[j]); for (let k = 0; k < j; k++) if (!inC(c, P[k])) c = three(P[i], P[j], P[k]) || c; }
  }
  return c;
}
const GUILLOTINE_R = 9; // soak circle radius in yards: Guillotine 1283594 and Grim Guillotine 1299296 (Wowhead)
const AXE_ERUPT_R = 40, AXE_ERUPT_S = 6; // the axe's eruption: Widow's Kiss 1283623 / Death's Embrace 1299396, 40 yd (Wowhead, journal), 6.0 s after the drop (logs)
// Short labels for defensives, externals and immunities shown next to a player.
const SHORT_CD = { 'divine shield': 'Bubble', 'blessing of protection': 'BoP', 'blessing of spellwarding': 'Spellwarding', 'aspect of the turtle': 'Turtle', 'cloak of shadows': 'Cloak', 'ice block': 'Ice Block', 'anti-magic shell': 'AMS', 'blessing of sacrifice': 'Sacrifice', 'pain suppression': 'Pain Suppression', 'guardian spirit': 'Guardian Spirit', 'ironbark': 'Ironbark', 'life cocoon': 'Life Cocoon', 'time dilation': 'Time Dilation', 'zephyr': 'Zephyr' };
// Crowd control that stops a mind-controlled player walking off the edge (Dreadmarch), by the aura it leaves on them.
// (Capacitor Totem's stun logs as "Capacitor Totem" from the totem; Holy Word: Chastise stuns with Censure.)
const CA_CC = ['ring of peace', 'leg sweep', 'shockwave', "ursol's vortex", 'chaos nova', "gorefiend's grasp", 'death grip', 'chains of ice', 'grip of the dead', 'static charge', 'capacitor totem', 'hammer of justice', 'storm bolt',
  'intimidating shout', 'mass entanglement', 'entangling roots', 'frost nova', 'typhoon', 'thunderstorm', 'binding shot', 'psychic scream', 'incapacitating roar', 'blinding light', 'sigil of misery', 'sigil of chains', 'earthgrab', 'landslide', 'deep breath', 'mighty bash', 'cyclone', 'polymorph', 'hex', 'repentance', 'imprison', 'fear', 'paralysis', 'blind', 'gouge',
  'howl of terror', 'freezing trap', 'ring of frost', "dragon's breath", 'intimidation', 'terror of the skies', 'kidney shot', 'cheap shot', 'sleep walk', 'shadowfury', 'axe toss', 'disorienting roar',
  'holy word: chastise', 'fel eruption', 'void tendrils', 'asphyxiate', 'abomination limb', 'lightning lasso', 'maim', 'psychic horror', 'mortal coil', 'song of chi-ji', 'oppressing roar'];
// What can break a Twin Fangs globule's Barbed Bulwark (a channel: anything that stops a cast). Void Nova was seen breaking
// it on Mythic pulls; silences stop a channel too.
const TF_BREAK = CA_CC.concat(['void nova', 'solar beam', 'silence', 'sigil of silence', 'strangulate']);
// Crowd control that leaves nothing on the target in the log (Ring of Peace knocks back whoever walks in): counted when cast
const CA_ZONE = ['ring of peace'];
// Crowd control a player landed on an enemy, for Performance's Utility: the list above by the aura it leaves, less the ones
// that are mainly damage or a self-heal (Deep Breath, Abomination Limb, Mortal Coil) and passives, plus a few racials; and
// the ones that leave nothing on their targets, counted when cast (Ring of Peace, Gorefiend's Grasp)
const PERF_CC = new Set(CA_CC.filter((n) => !['deep breath', 'abomination limb', 'mortal coil', 'grip of the dead', 'ring of peace', "gorefiend's grasp"].includes(n)).concat(['blinding sleet', 'war stomp', 'bull rush', 'haymaker', 'quaking palm']));
const PERF_CC_CAST = new Set(['ring of peace', "gorefiend's grasp"]);
// (single-target heals whose target the spec checks read: [time, target, healed, overhealed])
const HEAL_TO = new Set(['flash of light', 'holy light', 'eternal flame', 'word of glory', 'holy shock', 'beacon of light', 'pillar of lights',
  'regrowth', 'wild growth', 'swiftmend', 'lifebloom', 'rejuvenation', 'rejuvenation (germination)', 'tranquility', 'symbiotic blooms', 'everbloom']);
// Curses that slow a Spiteful Soulcoiler's casts (Curse of the Satyr replaces Curse of Tongues for some warlocks)
const CA_CURSE = ['curse of tongues', 'curse of the satyr'];
// Personal defensives by name (from DEFENSIVES, minus raid-wide ones), for soak checks.
// (Metamorphosis is a Havoc damage cooldown under the same name, so it isn't treated as a defensive in soaks)
const PERSONAL = [...new Set(Object.values(DEFENSIVES).flat().map((d) => d[0].toLowerCase()).filter((n) => n !== 'rallying cry' && n !== 'darkness' && n !== 'metamorphosis'))];
// Mechanic titles (your rule, Oct 22: "the nicknames to boss mechanics has gotten weird again"): "Name (Short instruction)": the name
// players know in game, then a short, clear instruction; nothing after the bracket; no glossary underlines inside a title (ui.js
// secHead). A check that changes its title says so here, so every tab, the coach, Homework, the Report card, Copy for Discord and
// the in-game recap use the same name. Guide: notes/Guides/Mechanic titles - the rule.md
const TITLE_FIX = {
  'The Coiled Altar': {
    'Venom orbs (Into the frontals)': 'Coalesced Venom (Pop the orbs with the frontals)',
    'Tank frontals (Defensives on stack 2)': 'Sever (Defensive on the second stack)',
    'Soulcoiler adds (Kick and kill)': 'Spiteful Soulcoiler (Kick and kill)',
    'Gloombombs (Drop them on the adds)': 'Gloombomb (Drop it on the adds)'
  },
  "Ula'tek": {
    'Eggs (No Vipers)': "Eggs (Don't let them hatch)",
    'Spectral Coils (Soak circles)': 'Spectral Coils (Soak the circles)',
    'Caustic Waves (Dodge waves)': 'Caustic Waves (Dodge the waves)',
    'Tanks (Tail tanking)': 'Tail (Always a tank on it)',
    'Toxic Incubation (Beam)': 'Toxic Incubation (Off-tank soaks the beam)',
    'Blightscale Wretch (Bubble)': 'Blightscale Wretch (Stand in its bubble)',
    'Rage of the Shackled (Damage windows)': 'Rage of the Shackled (Burst the heart)',
    'Wardens and Doomscales (Big adds)': 'Wardens and Doomscales (Kick and kill)',
    'Serpent\'s Bite (Soak)': 'Serpent\'s Bite (Soak with 3)',
    'Shriekers and Rawlings (Adds)': 'Shriekers and Rawlings (Kill the adds)'
  }
};
const MODULES = [{
  encounter: 'Nymrissa Wavecaller',
  units: [],
  spells: NY_RAIDCD, // (the mechanics are matched by ID; the names are the raid cooldowns)
  ids: NY_IDS,
  focus: new Set(['Nymrissa Wavecaller']),
  build: buildNymrissa,
}, {
  encounter: 'The Coiled Altar',
  units: ["Zul'jan", 'Hex Lord Malacrass', 'Malacrass', 'Spiteful Soulcoiler', 'Fragment of Malacrass', 'Coalesced Venom Stalker', 'Virulent Mutation', 'Manifestation of Dread'],
  spells: Object.keys(CA_IDS).concat(['noxious ground', 'defiled ground', 'volatile venom', 'toxic deluge', 'bloodlust', 'heroism', 'time warp', 'fury of the aspects', 'primal rage', "harrier's cry", 'darkness', 'spirit link totem', 'anti-magic zone', 'rallying cry', 'power word: barrier', 'aura mastery', 'tranquility', 'revival', 'rewind', 'divine hymn', 'vampiric embrace',
    'divine shield', 'ice block', 'aspect of the turtle', 'cloak of shadows', 'anti-magic shell', 'netherwalk', 'dispersion', 'blessing of spellwarding', 'blessing of protection', 'blessing of sacrifice', 'pain suppression', 'guardian spirit', 'ironbark', 'life cocoon', 'time dilation', 'zephyr', 'dreadful presence', 'retaliatory malice'], PERSONAL, CA_CC, CA_CURSE),
  focus: new Set(["Zul'jan", 'Hex Lord Malacrass', 'Malacrass']),
  ids: [1286912], // the Eternal Nightfall absorb shield (its own aura, separate from the cast's 1310752)
  priority: ['Spiteful Soulcoiler'], // (the adds that have to die: the Performance tab's priority damage and switch speed)
  build: buildCoiledAltar,
}, {
  encounter: 'The Twin Fangs',
  units: ['Spawn of Vexhul', 'Broodling of Ithraz', 'Caustic Globule', 'Barbed Bulwark'], // adds drawn on animated maps (Mythic globules log as Barbed Bulwark)
  spells: TF_SPELLS.concat(TF_BREAK), // (crowd control on globules: what broke each Barbed Bulwark, and the NSRT orb CC assignment)
  ids: TF_IDS,
  focus: new Set(), // boss names aren't verified yet; the module finds the twins by health pool instead
  build: buildTwinFangs,
}, {
  encounter: 'Entombed Sentinels',
  units: ['Venom Coagulation'], // drawn on maps
  spells: ['blighted blood', 'vitriolic stasis'], // (by name: dispels and boss heals reach the module by name; the rest by ID)
  ids: ES_IDS,
  focus: new Set(["Breath of Ula'tek", "Blood of Ula'tek"]),
  priority: ['Venom Coagulation'],
  build: buildEntombedSentinels,
}, {
  encounter: "Nek'zali the Soulcoiler",
  units: ['Restless Amani', 'Drowned Echo', 'Echo of Jawae'], // drawn on maps
  spells: ['essence rend'], // (dispels reach the module by name; the rest by ID)
  ids: NZ_IDS,
  focus: new Set(["Nek'zali the Soulcoiler", "Nek'zali, the Soulcoiler"]),
  priority: ['Restless Amani', 'Drowned Echo', 'Echo of Jawae'],
  build: buildNekzali,
}, {
  encounter: 'The Lost Explorers',
  units: ['Useless Junk', 'Bouncy Mushroom', 'Explosive Bomb', 'Disgusting Fish'], // drawn on maps
  spells: ['blast wave', 'elemental explosion', 'fungal burst', 'smashing shovel', 'cataclysmic invocation', 'relentless escalation'], // (by name: not in the pulls the IDs came from)
  ids: LE_IDS,
  focus: new Set(['Scrollsage Iku', 'Trader Gebbo', 'First Mate Nama', "Mor'zahi"]),
  build: buildLostExplorers,
}, {
  encounter: 'Vashnik the Malignant',
  units: ['Burning Venom', 'Shrouded Venom', 'Clotting Venom', 'Malignant Totem'], // drawn on maps
  spells: ['flame infusion', 'shadow infusion', 'blood infusion', 'hardened venom', 'malignant burst', 'exploding infection', 'malignance'], // (by name: the infusions, dispels and failures not seen in a log yet)
  ids: VS_IDS,
  focus: new Set(['Vashnik', 'Vashnik the Malignant']),
  priority: ['Burning Venom', 'Shrouded Venom', 'Clotting Venom'],
  build: buildVashnik,
}, {
  encounter: 'Sszorak',
  units: [],
  spells: [], // (matched by ID only)
  ids: SZ_IDS,
  focus: new Set(['Sszorak']),
  build: buildSszorak,
}, {
  encounter: "Ula'tek",
  units: ['Blightscale Viper', 'Blightscale Rawling', 'Blightscale Spawn', 'Blightscale Wretch', 'Doomscale Warden', 'Weakened Doomscale', 'Blightscale Shrieker', 'Gore Rattle', 'Venomous Heart'], // drawn on maps
  spells: [], // (matched by ID only: names like Revenge are player spells too)
  ids: UL_IDS,
  focus: new Set(["Ula'tek", 'Gore Rattle', 'Venomous Heart']), // (they share health: damage into any counts for the damage amps)
  priority: ['Doomscale Warden', 'Weakened Doomscale', 'Blightscale Shrieker', 'Blightscale Rawling'],
  // (has to die, but on a timer, not on sight: between its second and third Fester Burst, so it isn't judged on switch speed)
  useful: ['Blightscale Wretch'],
  build: buildUlatek,
}, {
  encounter: "Kith'ix",
  units: ['Venomous Hulk', 'Voidweaver', 'Bomber Beetle', 'Mindstinger Egg', 'Lady Liadrin', 'Liadrin'], // drawn on maps
  spells: ['overwhelming fear'], // (dispels reach the module by name; the rest by ID)
  ids: KX_IDS,
  focus: new Set(["Kith'ix"]),
  priority: ['Voidweaver', 'Bomber Beetle', 'Mindstinger Egg'],
  build: buildKithix,
}];
// Every boss ability the rules and fight modules know, by encounter (spell IDs): each gets its spell tooltip wherever the
// app names it, in a heading or in plain text (a rule's tip, a check's line), even when this log doesn't have it (its
// name then comes from BOSS_NAMES, read from Wowhead).
const BOSS_IDS = {};
for (const p of PACKS) BOSS_IDS[p.encounter] = new Set(p.rules.flatMap((r) => r.spellIds || []));
for (const m of MODULES) { const s = BOSS_IDS[m.encounter] || (BOSS_IDS[m.encounter] = new Set()); for (const id of (m.ids || []).flat()) s.add(+id); }
for (const id of Object.values(CA_IDS).flat()) BOSS_IDS['The Coiled Altar'].add(id);
// (each one's name on Wowhead, Oct 2026, for an ability this log doesn't have: then the app still knows which spell it is)
const BOSS_NAMES = {
  1258677:'Swirling Whirlpools', 1265425:'Wild Bite', 1271380:'Pulsing Tides', 1277002:'Ravage', 1277027:'Mutilate',
  1277051:'Mutilated Gash', 1277101:'Ravage', 1277105:'Ravage', 1280934:'Dripping Fangs', 1280935:'Dripping Fangs',
  1281910:'Plague Froth', 1281913:'Plague Froth', 1281925:'Plague Froth', 1282288:'Volatile Venom', 1282403:'Coalesced Venom',
  1282487:'Fangs of the Coiled Altar', 1282516:'Malignant Catalyst', 1282525:'Malignant Catalyst', 1282602:'Catalytic Bile',
  1282616:'Catalytic Bile', 1283489:'Guillotine', 1283832:'Axegrinder', 1284034:'Uncoiled Rage', 1284103:'Possession Barrage',
  1284109:'Hollowing Strikes', 1284207:'Living Venom', 1284208:'Blood Venom', 1284209:'Living Venom', 1284210:'Blood Venom',
  1284251:'Venom Coagulation', 1284258:'Contaminate', 1284434:'Toxic Droplets', 1284451:'Toxic Droplets', 1284452:'Noxious Blast',
  1284458:'Empowering Slam', 1284471:'Blighted Blood', 1284483:'Blighted Blood', 1284487:'Bloodvenom Injection',
  1284491:'Bloodvenom Injection', 1284500:'Mark of Acid', 1284506:'Mark of Blood', 1284561:'Toxic Vapor',
  1284588:'Vitriolic Stasis', 1284590:'Helical Toxins', 1284606:'Vitriolic Stasis', 1284635:'Vitriolic Stasis', 1284663:'Imbibe',
  1284813:'Helical Toxins', 1284941:'Cultivated Burst', 1284947:'Cultivated Burst', 1284948:'Cultivated Burst',
  1285017:'Axegrinder', 1285419:'Raging Crosswinds', 1285425:'Raging Crosswinds', 1285447:'Turbulent Gusts',
  1285453:'Raging Crosswinds', 1285616:'Raging Crosswinds', 1285643:'Dreadmarch', 1285681:'Soulcoil Ignition',
  1285979:'Caustic Surge', 1285999:'Mutilate', 1286033:'Dig In', 1286399:'Wail of Terror', 1286441:'Spiritcackle',
  1286620:'Soul Sever', 1286737:'Umbral Ejection', 1286860:'Rage of the Shackled', 1286885:'Falling Debris',
  1286912:'Veil of Twilight', 1286918:'Eternal Nightfall', 1286922:'Icebound Flames', 1287072:'Tempest', 1287083:'Tempest',
  1287205:'Viscous Cyst', 1287265:'Spectral Coils', 1287427:'Essence Rend', 1287434:'Essence Rend', 1287533:'Gravebound Advance',
  1287718:'Reclaim Essence', 1287722:'Spirit Erasure', 1288232:'Unstable Miasma', 1288260:'Unstable Miasma',
  1288282:'Unstable Miasma', 1288297:'Clinging Murk', 1288538:'Stone Breaker', 1288554:'Latent Cultist', 1288772:'Soulcoil Rite',
  1288879:"Serpent's Bite", 1289092:'Stone Breaker', 1289153:'Stone Breaker', 1289154:'Stone Breaker', 1289201:'Caustic Globule',
  1289683:'Ritual of Awakening', 1289855:'Hungering Pyre', 1289902:'Soul Transfer', 1290003:'Uncoiling', 1290338:'Caustic Globule',
  1290361:'Soulcoiled', 1290662:'Ravenous Feast', 1290779:'Malice', 1290814:'Coiling Ichor', 1290878:'Coiling Ichor',
  1290991:'Malice', 1291918:'Shell Spin', 1291929:'Steady Strikes', 1291933:'Throw Junk', 1292034:'Possession Barrage',
  1292211:'Caustic Waves', 1292248:'Soul Transfer', 1292403:'Caustic Waves', 1292490:'Disgusting Fish', 1292764:'Evil Eyes',
  1292779:'Final Ascension', 1292780:'Final Ascension', 1292784:'Iku Transform', 1292785:'Nama Transform',
  1292786:'Transform Gebbo', 1293211:'Soul Transfer', 1293212:'Grasping Depths', 1293295:'Corrosive Spit',
  1293664:'Soulcoil Ignition', 1293979:'Corrosive Spit', 1294334:'Blink Nova', 1294729:'Corpse Blight', 1294846:'Anguished Echoes',
  1294867:'Unending Tides', 1294933:'Slithering Flame', 1294994:'Stygian Infection', 1295086:'Unending Tides',
  1295124:'Ritual of Awakening', 1295173:'Exploding Infection', 1295209:'Caustic Explosion', 1295360:'Malignant Shell',
  1295798:'Plague Wave', 1295858:'Shredding Shards', 1295891:'Frostfire Volley', 1295905:"Serpent's Bite",
  1295928:'Burning Flames', 1295954:'Piercing Frost', 1296025:'Blink Nova', 1296133:'Mighty Thud', 1296301:'Mephitic Thrash',
  1296667:'Caustic Residue', 1296878:'Shifting Protovenom', 1296880:'Shifting Protovenom', 1296882:'Shifting Protovenom',
  1296898:'Unbound Ferocity', 1296962:'Protovenom Eruption', 1297096:'Raging Crosswinds', 1297111:'Raging Crosswinds',
  1297624:'Ritual Burn', 1297625:'Explosive Surprise', 1297630:'Vessel of Awakening', 1297631:'Vessel of Awakening',
  1297646:'United Defense', 1297707:'Virulence', 1298367:"Mother's Wrath", 1298369:"Mother's Wrath",
  1298381:'Defilement of the Coiled Altar', 1298417:'Stone Venom', 1298570:'Caustic Waves', 1298583:'Gloom Expulsion',
  1298587:'Conflagrating Expulsion', 1299010:'Spectral Coils', 1299206:'Rattler Slam', 1299267:'Grim Guillotine', 1299673:'Invoke',
  1299680:'Sever', 1299722:'Invoke', 1299759:'Toxic Incubation', 1299764:"Mother's Boon", 1299838:'Venom Rupture',
  1299854:'Bounce', 1299899:'Virulence', 1299919:'Toxic Incubation', 1299960:'Toxic Deluge', 1300089:'Virulence',
  1300235:'Soul Exhaustion', 1300237:'Mighty Thud', 1300238:"Soulcoiler's Curse", 1300239:'Swirling Spirit',
  1300685:'Soul Constrictor', 1300751:'Call of the Serpent', 1301007:'Unchecked Rage', 1301117:'Grasping Fangs',
  1302489:'Stygian Burst', 1302842:'Toxic Burn', 1302950:'Writhing Gestation', 1302982:'Virulent Spit', 1303097:'Clinging Murk',
  1303257:'Suffocation', 1303378:'Barbed Bulwark', 1303620:'Toxic Womb', 1303685:'Twisted Appendage',
  1304012:'Call of the Serpent', 1304032:'Soulbinding', 1304459:'Malignance', 1305621:"Serpent's Fury", 1305650:'Anguished Cry',
  1305709:'Desperate Thrash', 1305878:'Volatile Purge', 1305902:'Burning Presence', 1305959:'Venomous Surge',
  1305963:'Venomous Surge', 1305998:'Caustic Claws', 1306119:'Calcified Corpse', 1306820:'Malignant Totem',
  1306858:"Warden's Protection", 1306862:'Hatching Doom', 1306906:'Venomfang', 1307279:'Blighted Sever', 1307363:'Barbed Bulwark',
  1307538:'Barbed Bulwark', 1307612:'Noxious Shell', 1307635:'Noxious Splash', 1307939:'Corpse Blight', 1307941:'Revenge',
  1308227:'Immortal Coil', 1308711:'Uncoiled Wrath', 1308881:'Nullshards', 1309105:'Spirit Shield', 1310028:'Relic Rupture',
  1310096:'Feasted', 1310102:'Tainted Blood', 1310371:'Stone Breaker', 1310498:'Mutagenic Venom', 1310500:'Aftershock',
  1310544:'Virulent Mutation', 1310732:'Malevolent Resonance', 1310763:'Fester Burst', 1310764:'Vicious Echoes',
  1310882:'Gloombomb', 1311609:'Blight Vein', 1311611:'Grasping Fangs', 1311807:'Caustic Waves', 1312150:'Rancid Yolk',
  1312366:'Miasmic Coating', 1312853:'Splinters', 1312967:'Volatile Purge', 1313456:'Shatter', 1313531:'Acidic Expulsion',
  1315341:'Circling Prey', 1315342:'Boiling Venom', 1315541:'Call of the Serpent', 1318329:'Calcified Corpse',
  1319282:'Caustic Waves'
};
// (and the boss abilities the fight modules know only by name, with their spell on Wowhead (its NPC abilities, Oct
// 2026): they get a tooltip too, even in a pull where they didn't happen)
const BOSS_EXTRA = {
  'The Coiled Altar': { 1283290: 'Noxious Ground', 1298591: 'Defiled Ground', 1288624: 'Dreadful Presence' },
  'The Twin Fangs': { 1290336: 'Eternal Venom', 1292806: 'Stir the Depths', 1306872: 'Sanguine Storm', 1308122: 'Venomous Emergence', 1310105: 'Tainted Burst' },
  'The Lost Explorers': { 1291390: 'Cataclysmic Invocation', 1295952: 'Elemental Explosion', 1296227: 'Relentless Escalation', 1296252: 'Smashing Shovel', 1305618: 'Fungal Burst' },
  'Vashnik the Malignant': { 1280189: 'Malignant Burst', 1293968: 'Shadow Infusion', 1293969: 'Blood Infusion', 1293971: 'Flame Infusion', 1314837: 'Hardened Venom' },
};
for (const [enc, o] of Object.entries(BOSS_EXTRA)) for (const [id, n] of Object.entries(o)) { (BOSS_IDS[enc] || (BOSS_IDS[enc] = new Set())).add(+id); BOSS_NAMES[id] = n; }
// (by name: the spell to show for a boss ability named only by text, when the log has no spell of that name)
const BOSS_SPELL = new Map();
for (const [id, n] of Object.entries(BOSS_NAMES)) { const k = n.toLowerCase(); if (!BOSS_SPELL.has(k)) BOSS_SPELL.set(k, +id); }

// Channeled cooldowns (Tranquility, Divine Hymn, ...) can log a cast per tick; keep only the first cast
// of each player's spell within 12s. Sorted by time.
function firstCasts(list) {
  const last = new Map();
  return list.slice().sort((a, b) => a.t - b.t).filter((e) => {
    const k = e.src + '|' + String(e.spell).toLowerCase(), p = last.get(k);
    if (p != null && e.t - p < 12) return false;
    last.set(k, e.t); return true;
  });
}

// Boss cast times for a spell name. A cast with a cast bar logs a start and, seconds later, a success: count it
// once, at the start (a success within 8s after a start is the same cast). Repeats within 3s are merged.
function castTimes(ev, L) {
  return (n) => {
    const starts = ev.filter((e) => e.k === 'start' && L(e.spell) === n).map((e) => e.t);
    const done = ev.filter((e) => e.k === 'cast' && L(e.spell) === n).map((e) => e.t).filter((t) => !starts.some((s) => t >= s && t - s <= 8));
    return starts.concat(done).sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 3);
  };
}

// Split time-sorted events ({t}) into sets: a gap of more than `gap` seconds starts a new set.
function setsOf(list, gap) {
  const out = [];
  for (const x of list.slice().sort((a, b) => a.t - b.t)) { const cur = out[out.length - 1]; if (cur && x.t - cur[cur.length - 1].t <= gap) cur.push(x); else out.push([x]); }
  return out;
}



function buildTwinFangs(ev, r, h) {
  // Same panel shape as The Coiled Altar. Mechanics are matched by spell ID (TF above) or by name (TF_SPELLS).
  // Mistakes for plain avoidable hits and venom stacks already come from the rule pack, so this module adds
  // only the mechanic-specific ones.
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const L = (x) => String(x).toLowerCase();
  const S = (n) => [0, n.split(' ').map((w, i) => (i && (w === 'the' || w === 'of') ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ')];
  const casts = castTimes(ev, L);
  const dmg = (n) => ev.filter((e) => e.k === 'dmg' && L(e.spell) === n && h.isPlayer(e.dst));
  const dmgId = (ids) => { ids = [].concat(ids); return ev.filter((e) => e.k === 'dmg' && ids.includes(e.id) && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t); };
  const auraId = (id, op) => ev.filter((e) => e.k === 'aura' && e.id === id && (!op || e.op === op)).sort((a, b) => a.t - b.t);
  // Debuff windows for a spell ID: one per application, ending at its removal.
  const windows = (id, dflt) => { const rm = auraId(id, 'remove'); return auraId(id, 'apply').map((e) => ({ g: e.dst, src: e.src, t0: e.t, t1: (rm.find((x) => x.dst === e.dst && x.t >= e.t) || { t: e.t + dflt }).t })); };
  const pname = (g) => h.name(g), dur = r.duration, diff = r.item.diff;
  const fmtN = (n) => Math.round(n).toLocaleString('en-US');
  const mistakes = [], sections = [];
  const M = (t, player, spell, severity, detail, fix, map) => mistakes.push({ t, player, mechanic: S(spell)[1], id: 0, severity, detail, fix, ...(map ? { map } : {}) });
  // Mythic was listed as 9 in guides, but 5 players reached 9 stacks on a Mythic kill and lived, so it's at least 10.
  const lethal = { Normal: 11, Heroic: 10, Mythic: 10 }[diff] || 10;
  const budget = lethal - 3; // the plan: about one stack per set, so ~6 on Mythic going into the enrage
  const diedNear = (g, t, w) => r.deaths.find((d) => d.guid === g && d.t >= t - 0.2 && d.t <= t + w);

  // ---- the twins: the biggest-health enemies (see bossUnits in analyze) ----
  const twins = [...(r.hpUnits || new Map())].filter(([, u]) => r.bossUnits.includes(u.name));
  const deathOf = (g) => (ev.find((e) => e.k === 'die' && e.guid === g) || {}).t;
  const endPct = (u) => (u.samples.length ? Math.round(100 * u.samples[u.samples.length - 1][1]) : null);
  // On a kill the last Fang often has no death event before the encounter ends: it died at the end.
  const tw = twins.map(([g, u]) => ({ g, u, name: u.name, died: deathOf(g) ?? (r.item.kill ? dur : null), end: r.item.kill ? 0 : endPct(u) }));
  const firstDown = tw.map((x) => x.died).filter((t) => t != null).sort((a, b) => a - b)[0];

  // ---- phases: both twins up, then one left ----
  const phases = [{ name: 'Both Fangs', start: 0, end: firstDown ?? dur }];
  if (firstDown != null && firstDown < dur - 1) phases.push({ name: 'One Fang left', start: firstDown, end: dur });
  const marks = [];
  for (const [n, kind] of [['stir the depths', 'front'], ['caustic globule', 'soak'], ['venomous emergence', 'add'], ['ravenous feast', 'phase'], ['sanguine storm', 'raid'], ['corrosive spit', 'target'], ['coiling ichor', 'target'], ['stone breaker', 'front']])
    for (const t of casts(n)) marks.push({ t, label: S(n)[1], id: 0, kind, ...markInfo(ev, n, t, h, r.players.size) });

  // ---- Eternal Venom stack timeline per player ----
  const hist = new Map();
  for (const e of ev.filter((x) => x.k === 'aura' && L(x.spell) === 'eternal venom' && h.isPlayer(x.dst)).sort((a, b) => a.t - b.t)) {
    const st = e.op === 'apply' ? Math.max(1, e.stacks || 1) : e.op === 'remove' ? 0 : e.stacks || 0;
    let l = hist.get(e.dst); if (!l) hist.set(e.dst, l = []); l.push([e.t, st]);
  }
  const stackAt = (g, t) => { let s = 0; for (const [tt, st] of hist.get(g) || []) { if (tt > t) break; s = st; } return s; };

  // ---- 1. boss balance: kill both together, or the survivor gains Uncoiled Wrath ----
  const hpAt = (u, t) => { let v = null; for (const [tt, f] of u.samples) { if (tt > t) break; v = f; } return v; };
  let worst = { gap: 0, t: 0 };
  if (tw.length > 1) for (let t = 5; t < (firstDown ?? dur); t += 2) {
    const a = hpAt(tw[0].u, t), b = hpAt(tw[1].u, t);
    if (a != null && b != null && Math.abs(a - b) * 100 > worst.gap) worst = { gap: Math.abs(a - b) * 100, t };
  }
  const wrathEv = auraId(TF.wrath).filter((e) => e.op !== 'remove');
  const wrathMax = wrathEv.reduce((m, e) => Math.max(m, e.op === 'apply' ? 1 : e.stacks || 1), 0);
  const gap = tw.length > 1 && tw.every((x) => x.died != null) ? Math.abs(tw[0].died - tw[1].died) : null;
  // (shown, not judged: the Mythic plan in the guides kills one Fang first on purpose (start on Vexhul, swap at 40%,
  // kill Vexhul before the last Submerge), and Wolfthorn's Mythic kill had them die 21s apart with 8 Uncoiled Wrath stacks)
  const balBad = false, balWarn = false;
  sections.push({ id: 'twins', title: 'Twin balance (Kill them together)', place: 'Twin balance: the Fangs\' health', spell: [0, 'The Twin Fangs'], info: 'shown, not judged',
    verdict: 'good',
    summary: (tw.length ? [...new Set(tw.map((x) => x.name))].join(' and ') : 'No boss units found') + '. ' +
      (gap != null ? 'Both died ' + gap.toFixed(1) + ' s apart.' : firstDown != null ? 'One Fang died, and the other ended at ' + (tw.find((x) => x.died == null) || {}).end + '%.' : 'This is each Fang\'s health at the end of the pull.') +
      ' The biggest health gap was ' + Math.round(worst.gap) + '%' + (worst.gap ? ', at ' + h.fmtT(worst.t) : '') + '.' +
      (wrathMax ? ' Uncoiled Wrath reached ' + pl(wrathMax, 'stack') + ' (first at ' + h.fmtT(wrathEv[0].t) + ').' : ' No Uncoiled Wrath.'),
    cols: ['Boss', 'Health at end', 'Died', 'Uncoiled Wrath'],
    // one group at the first death, so both Fangs stay together in the last phase
    groups: tw.length ? [{ title: gap != null ? 'Died ' + gap.toFixed(1) + ' s apart' : 'Health at the end', t: firstDown ?? dur, bad: balBad, warn: balWarn,
      sub: 'Biggest health gap ' + Math.round(worst.gap) + '%' + (wrathMax ? ', Uncoiled Wrath ' + pl(wrathMax, 'stack') : ''),
      rows: tw.map((x) => {
        const wr = wrathEv.filter((e) => e.dst === x.g), mx = wr.reduce((m, e) => Math.max(m, e.op === 'apply' ? 1 : e.stacks || 1), 0);
        return [{ txt: x.name }, { txt: x.end != null ? x.end + '%' : '?' }, { txt: x.died != null ? h.fmtT(x.died) : 'alive', dim: x.died == null }, mx ? { txt: pl(mx, 'stack') } : { txt: 'none', dim: true }];
      }) }] : [], rows: [] });

  // ---- 2. Eternal Venom stacks and the stack budget ----
  /* (Oct 23, your idea: stack management matters, so each player's line says what gave them their stacks: what hit them in the same
     second a stack went up. Stir the Depths and someone else's spit are the avoidable ones) */
  const V_SRC = [['venomous emergence', 'adds spawning'], ['caustic globule', 'orb soaks'], ['tainted blood', 'Tainted Blood'], ['stir the depths', 'Stir the Depths'], ['corrosive spit', 'spit'], ['coiling ichor', 'Coiling Ichor'], ['sanguine storm', 'Sanguine Storm'], ['ravenous feast', 'Ravenous Feast']];
  const vHits = ev.filter((e) => (e.k === 'dmg' || e.k === 'aura') && h.isPlayer(e.dst) && V_SRC.some(([n]) => L(e.spell) === n));
  const vSrcOf = (g, l) => { const c = new Map(); let prev = 0;
    for (const [t, st] of l) { if (st > prev) { const near = vHits.filter((e) => e.dst === g && e.t >= t - 1.2 && e.t <= t + 0.3).sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t))[0];
        const k = near ? V_SRC.find(([n]) => n === L(near.spell))[1] : 'other'; c.set(k, (c.get(k) || 0) + (st - prev)); } prev = st; }
    return [...c].filter(([k]) => k !== 'other').sort((a, b) => b[1] - a[1]); };
  const vRows = [];
  for (const [g, l] of hist) {
    const peak = Math.max(...l.map((x) => x[1]));
    const d = r.deaths.find((x) => x.guid === g);
    const atDeath = d ? stackAt(g, d.t) : null;
    if (d && atDeath >= lethal) M(d.t, pname(g), 'eternal venom', 'High', 'Died with ' + atDeath + ' Eternal Venom stacks (lethal at ' + lethal + ' on ' + diff + ').', 'Avoid extra stacks (other players\' circles, Stir the Depths, extra soaks) so you never reach the lethal count.');
    const overAt = (l.find((x) => x[1] > budget) || [])[0];
    vRows.push({ g, peak, atDeath, overAt, src: vSrcOf(g, l) });
  }
  vRows.sort((a, b) => b.peak - a.peak);
  const over = vRows.filter((x) => x.peak > budget);
  sections.push({ id: 'venom', title: 'Eternal Venom (Stay under the limit)', place: 'Eternal Venom (debuff) stacks', spell: S('eternal venom'),
    verdict: vRows.some((x) => x.atDeath != null && x.atDeath >= lethal) ? 'bad' : over.length || vRows.some((x) => x.peak >= lethal - 1) ? 'warn' : 'good', /* (fix 12, Oct 26: 9 stacks was red on 5 of 10 top kills) */
    summary: pl(vRows.length, 'player') + ' got Eternal Venom, and ' + pl(over.length, 'player') + ' went over ' + budget + ' stacks, the safe limit. It\'s lethal at ' + lethal + ' on ' + diff + '.',
    cols: ['Player', 'Highest stacks', 'Over the limit at', 'Stacks at death', 'From'],
    // red: died at the lethal count; amber: over the budget, or one stack from lethal
    rows: vRows.map((x) => [{ p: pname(x.g) }, { txt: String(x.peak), warn: x.peak > budget || x.peak >= lethal - 1 }, x.overAt != null ? { txt: h.fmtT(x.overAt), warn: true } : { txt: '—', dim: true }, x.atDeath != null ? { txt: String(x.atDeath), bad: x.atDeath >= lethal } : { txt: '—', dim: true }, x.src.length ? { txt: 'gained from ' + x.src.map(([k, n]) => n + ' ' + k).join(', '), warn: x.peak > budget, s: 1 } : { txt: '—', dim: true }]) });

  // ---- 3. Ravenous Feast: three strikes, each needs 4+ soakers who aren't already Feasted ----
  const feasts = casts('ravenous feast');
  const strikesAll = dmgId(TF.strike);
  const feastGroups = feasts.map((t, i) => {
    const hits = strikesAll.filter((e) => e.t >= t && e.t <= t + 14);
    const strikes = []; for (const e of hits) { const c = strikes[strikes.length - 1]; if (c && e.t - c.last <= 0.4) { c.who.push(e.dst); c.last = e.t; } else strikes.push({ t: e.t, last: e.t, who: [e.dst] }); }
    const seen = new Map();
    for (const [k, s] of strikes.entries()) { s.repeat = s.who.filter((g) => seen.has(g)); for (const g of s.who) if (!seen.has(g)) seen.set(g, k); }
    // where each strike landed: the smallest circle around its soakers (the circle is ~8 yd, measured from 5 pulls;
    // Blizzard doesn't publish it), and anyone who died within 3s of soaking
    for (const s of strikes) {
      s.pts = h.snap(s.t); const sp = s.pts.filter((q) => s.who.includes(q.guid)).map((q) => [q.x, q.y]);
      const c = sp.length >= 2 ? mec(sp) : sp.length ? { x: sp[0][0], y: sp[0][1], r: 0 } : null;
      s.ring = c ? { x: c.x, y: c.y, r: Math.max(FEAST_R, c.r), label: 'Ravenous Feast strike (~' + FEAST_R + ' yd)', ...mcol('Ravenous Feast'), fx: 'soak', at: s.t } : null;
    }
    // a death counts for the last strike that player soaked (strikes are ~1.5s apart)
    strikes.forEach((s, k) => { s.died = s.who.filter((g) => !strikes.slice(k + 1).some((z) => z.who.includes(g))).map((g) => diedNear(g, s.t, 3)).filter(Boolean); });
    for (const s of strikes) for (const g of s.repeat)
      M(s.t, pname(g), 'ravenous feast', s.who.length - s.repeat.length < 4 ? 'Medium' : 'Low', 'Soaked a second Ravenous Feast strike while already Feasted.', 'Soak only your own group\'s strike, then step away so the next group takes theirs.',
        { t: s.t, hl: s.who, hlLabel: 'in this strike', bad: [g], badLabel: 'already Feasted', title: 'Ravenous Feast #' + (i + 1) + ' at ' + h.fmtT(s.t), pts: s.pts, rings: s.ring ? [s.ring] : [] });
    const gs = [...hist.keys()].filter((g) => !r.deaths.some((d) => d.guid === g && d.t < t));
    const before = gs.map((g) => stackAt(g, t - 0.5)), after = gs.map((g) => stackAt(g, t + 14));
    const avg = (a) => (a.length ? (a.reduce((s, x) => s + x, 0) / a.length).toFixed(1) : '0');
    return { t, i, strikes, avgB: avg(before), avgA: avg(after) };
  });
  // red: a repeat soaker (Feasted) or a death in the strike; amber: under 4 fresh soakers but everyone lived
  const lowStrike = (s) => s.who.length - s.repeat.length < 4;
  // under 4 fresh soakers on a strike: the raid takes the full hit (medium, raid-wide)
  for (const f of feastGroups) f.strikes.forEach((s, k) => { if (lowStrike(s)) M(s.t, 'Raid', 'ravenous feast', 'Medium', 'Ravenous Feast #' + (f.i + 1) + ' strike ' + (k + 1) + ' had only ' + (s.who.length - s.repeat.length) + ' fresh soakers (needs 4). The raid took the full hit.', 'Each strike needs at least 4 players who haven\'t soaked this Feast. Stick to your group and its strike.'); });
  // (Oct 22, boss coverage: 7 of the 14 fastest Mythic kills had someone step into a strike they'd already soaked, one kill on
  // every second and third strike. With 4 fresh soakers still in it nothing goes wrong, so that's a slip; it's the mistake when it
  // leaves under 4 fresh soakers, or someone dies)
  // (below Mythic the fastest Heroic kills soak strikes 2 and 3 with one or two players: there it's a slip unless someone dies)
  const strikeBad = (s) => (s.repeat.length > 0 && lowStrike(s) && diff === 'Mythic') || s.died.length > 0, strikeSlip = (s) => s.repeat.length > 0 && !strikeBad(s);
  // (one map for the whole Feast (your note, Oct 18), on its own row above the strikes: every strike's circle numbered in
  // order, each filling as its strike comes, then slamming; a green check on each player from the strike they soaked, red
  // from a repeat soak or a death)
  const feastWhole = (f) => {
    const st = f.strikes.filter((s) => s.ring), last = f.strikes[f.strikes.length - 1], c0 = (f.strikes[0] || f).t - 3, c1 = (last || f).t + 1.5;
    const rings = st.map((s) => ({ ...s.ring, label: String(f.strikes.indexOf(s) + 1), t0: c0 - 1, dur: 60, legend: 'a Ravenous Feast strike, ~' + FEAST_R + ' yd: it fills as the strike comes, then slams (numbered in order)' }));
    const goodAt = [], badAt = [];
    for (const s of f.strikes) { for (const g of s.who) if (!s.repeat.includes(g) && !goodAt.some((x) => x[0] === g)) goodAt.push([g, s.t]); for (const g of s.repeat) badAt.push([g, s.t]); for (const d of s.died) badAt.push([d.guid, d.t]); }
    const bad = [...new Set(badAt.map((x) => x[0]))], good = goodAt.filter((x) => !bad.includes(x[0]));
    const fc = st.map((s) => s.ring), x = fc.reduce((v, p) => v + p.x, 0) / (fc.length || 1), y = fc.reduce((v, p) => v + p.y, 0) / (fc.length || 1);
    const tEnd = (last || f).t + 0.3, all = [{ txt: allN(f.strikes.length, 'strike'), sub: 'the whole Feast, on one map', dim: true }, { t: f.t }, { txt: '' }, { txt: '' }, { txt: '' }, { txt: '' }];
    if (!fc.length) return all.concat([{ txt: '' }]);
    return all.concat([{ map: { t: tEnd, good: good.map((q) => q[0]), goodLabel: 'soaked a strike', goodAt: good, pendLabel: 'not in a strike yet', bad, badLabel: 'already Feasted, or died', badAt,
      title: 'Ravenous Feast #' + (f.i + 1) + ' at ' + h.fmtT(f.t) + ': all ' + f.strikes.length + ' strikes, in order', pts: h.snap(tEnd), frames: h.frames(Math.max(0, c0), Math.min(dur, c1), 0.25), rings,
      focus: { x, y, r: Math.max(10, ...fc.map((p) => Math.hypot(p.x - x, p.y - y) + p.r + 2)) } } }]);
  };
  sections.push({ id: 'feast', title: 'Ravenous Feast (Soak in groups of 4)', place: 'Ravenous Feast (group soaks)', spell: S('ravenous feast'),
    verdict: feastGroups.some((f) => f.strikes.some(strikeBad)) ? 'bad' : feastGroups.some((f) => f.strikes.some((s) => lowStrike(s) || strikeSlip(s))) ? 'warn' : 'good',
    summary: pl(feasts.length, 'Ravenous Feast') + '. Each strike should be soaked by 4 or more players who haven\'t soaked one yet this Feast.',
    cols: ['Strike', 'When', 'Soakers', 'Players', 'Already Feasted', 'Died', ''],
    groups: feastGroups.map((f) => {
      const bad = f.strikes.some(strikeBad), warn = f.strikes.some((s) => lowStrike(s) || strikeSlip(s));
      return { title: 'Feast ' + (f.i + 1), t: f.t, bad, warn,
        sub: pl(f.strikes.length, 'strike') + ', ' + f.strikes.map((s) => s.who.length).join(', ').replace(/, (\d+)$/, ' and $1') + ' soakers' + (f.strikes.some((s) => s.repeat.length) ? ', ' + pl(f.strikes.reduce((n, s) => n + s.repeat.length, 0), 'repeat soak') : '') + '. Average venom went from ' + f.avgB + ' to ' + f.avgA + '.',
        rows: [feastWhole(f)].concat(f.strikes.map((s, k) => [{ txt: 'Strike ' + (k + 1) }, { t: s.t }, { txt: String(s.who.length), warn: lowStrike(s) }, { ps: s.who.map(pname) }, { ps: s.repeat.map(pname), none: '—', bad: s.repeat.length > 0 && lowStrike(s) && diff === 'Mythic', warn: strikeSlip(s) }, { ps: s.died.map((d) => d.player), none: '—', bad: s.died.length > 0 },
          { txt: '' }])) };
    }), rows: [] });

  // ---- 4. Tainted Blood founts: absorb them before they burst ----
  const taint = auraId(TF.tainted, 'apply').filter((e) => h.isPlayer(e.dst));
  const bursts = dmg('tainted burst');
  // the heal absorbs cleared: every heal eaten by Tainted Blood, by healer (healers by name, everyone else's own healing
  // and leech added up), per Feast and for the whole pull
  const habs = ev.filter((e) => e.k === 'habs' && e.id === TF.tainted && h.isPlayer(e.dst));
  const fmtM = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1e3) + 'k');
  const clearedBy = (list) => { const m = new Map(); let other = 0; for (const e of list) { if (h.role(e.healer) === 'healer') m.set(e.healer, (m.get(e.healer) || 0) + e.amt); else other += e.amt; } return { heal: [...m].sort((a, b) => b[1] - a[1]), other }; };
  const clearCell = (list) => { const c = clearedBy(list); if (!c.heal.length && !c.other) return { txt: '—', dim: true };
    return { pt: c.heal.map(([g, a]) => [pname(g), fmtM(a)]), sub: c.other > 0 ? 'everyone else: ' + fmtM(c.other) : '' }; };
  const fRows = feastGroups.map((f) => {
    const end = f.i + 1 < feastGroups.length ? feastGroups[f.i + 1].t : dur + 1;
    const who = [...new Set(taint.filter((e) => e.t >= f.t && e.t < end).map((e) => e.dst))];
    const bh = bursts.filter((e) => e.t >= f.t && e.t < end);
    return [{ txt: 'Feast ' + (f.i + 1) }, { t: f.t }, { txt: String(who.length) }, bh.length ? { txt: pl(new Set(bh.map((e) => e.dst)).size, 'player') + ' hit', bad: true } : { txt: 'none' },
      habs.length ? clearCell(habs.filter((e) => e.t >= f.t && e.t < end)) : { txt: '—', dim: true }];
  });
  const clearAll = clearedBy(habs);
  // a fount nobody absorbed erupts on the whole raid: serious
  { const seen = []; for (const e of bursts.slice().sort((a, b) => a.t - b.t)) { if (seen.some((t) => Math.abs(t - e.t) < 2)) continue; seen.push(e.t);
    M(e.t, 'Raid', 'tainted burst', 'High', 'A Tainted Blood fount nobody absorbed erupted as Tainted Burst on the raid (' + pl(new Set(bursts.filter((x) => Math.abs(x.t - e.t) < 2).map((x) => x.dst)).size, 'player') + ' hit).', 'Every fount needs its soakers inside it before it erupts. The group that didn\'t get knocked back takes them.'); } }
  // (only when the pull had founts: Heroic has none (no Tainted Blood or Tainted Burst anywhere in a Heroic night on
  // Warcraft Logs), and grading it there called every Feast clean with nobody absorbing)
  if (taint.length || bursts.length || habs.length) sections.push({ id: 'founts', title: 'Tainted Blood (Heal the absorbs off)', place: 'Tainted Blood (founts): absorbed in time', spell: S('tainted blood'),
    verdict: bursts.length ? 'bad' : 'good',
    summary: (bursts.length ? 'Tainted Burst went off ' + pl(new Set(bursts.map((e) => Math.round(e.t))).size, 'time') + '.' : 'Every fount was absorbed, so there was no Tainted Burst.') +
      (clearAll.heal.length ? ' Heal absorbs cleared: ' + clearAll.heal.map(([g, a]) => pname(g) + ' ' + fmtM(a)).join(', ') + (clearAll.other ? ', everyone else ' + fmtM(clearAll.other) : '') + '.' : ''),
    cols: ['After', 'When', 'Absorbed', 'Tainted Burst', 'Heal absorbs cleared'], rows: fRows,
    // (the whole pull's totals per healer, under the table)
    ...(clearAll.heal.length ? { extra: { title: 'Heal absorbs cleared, whole pull', items: clearAll.heal.map(([g, a]) => ({ p: pname(g), n: fmtM(a) })) } } : {}) });

  // ---- 5a. Barbed Bulwark (Mythic): the barrier each globule channels as it lands ----
  // Read from Mythic pulls on Warcraft Logs: every globule spawns channeling it (a huge absorb, 99% less damage taken,
  // and touching it hits for ~500k and knocks back). Every barrier that went came off within 0.2 s of a stun, fear,
  // disorient or incapacitate landing on that globule, with its absorb still full; slows on it changed nothing. One
  // nobody breaks runs ~10 s and the globule then explodes on the raid with it still up. Soaks follow 1 to 2 s after a
  // break. A Barbed Bulwark hit on a player names the globule they ran into (some log a second, sourceless hit).
  const bOn = []; { const seen = new Set(); for (const e of auraId(TF.bulwark, 'apply')) if (!h.isPlayer(e.dst) && !seen.has(e.dst)) { seen.add(e.dst); bOn.push(e); } }
  const bOff = auraId(TF.bulwark, 'remove'), kicksB = (r.interrupts || []).filter((x) => x.id === TF.bulwark);
  const ccB = ev.filter((e) => e.k === 'aura' && e.op === 'apply' && TF_BREAK.includes(L(e.spell)) && !h.isPlayer(e.dst));
  const bulHits = dmgId(TF.bulHit);
  const bars = bOn.map((a) => {
    const g = a.dst, off = bOff.find((x) => x.dst === g && x.t >= a.t), t1 = off ? off.t : null, up = t1 != null ? t1 - a.t : null;
    // (what broke it: a kick on its channel, or the crowd control that landed on it closest to the moment it went)
    let by = null;
    if (t1 != null) {
      const k = kicksB.find((x) => x.target === g && Math.abs(x.t - t1) <= 0.3);
      const cc = ccB.filter((e) => e.dst === g && e.t >= t1 - 0.3 && e.t <= t1 + 0.1).sort((p, q) => Math.abs(p.t - t1) - Math.abs(q.t - t1))[0];
      if (k) by = { who: k.player, spell: k.by, id: k.byId };
      else if (cc) { const o = h.isPlayer(cc.src) ? cc.src : cc.own; by = { who: o ? pname(o) : null, spell: cc.spell, id: cc.id }; }
    }
    const end = t1 != null ? t1 : Math.min(dur, a.t + 11);
    const ranOut = !by && (t1 == null ? end - a.t >= 9.5 : up >= 9.5);
    // players who ran into it while it was up (one per player: the hits come in pairs)
    const into = new Map(); for (const e of bulHits.filter((x) => x.src === g && x.t >= a.t - 0.1 && x.t <= end + 0.2)) { const o = into.get(e.dst); if (o) o.amt += e.amt; else into.set(e.dst, { t: e.t, amt: e.amt }); }
    for (const [p, o] of into) o.died = !!diedNear(p, o.t, 3);
    return { g, t: a.t, t1, up, by, ranOut, late: !!by && up > 6, into };
  });
  const bSets = setsOf(bars, 20).map((l, i) => ({ i, t: l[0].t, bars: l }));
  const ranOutT = bars.filter((b) => b.ranOut).map((b) => b.t1 ?? b.t + 10);
  for (const b of bars) {
    if (b.ranOut) M(b.t1 ?? b.t + 10, 'Raid', 'barbed bulwark', 'High', 'Nobody broke a Caustic Globule\'s Barbed Bulwark. It ran out after ' + (b.up != null ? b.up.toFixed(0) : '10') + ' seconds, and the globule exploded on the raid, giving everyone 1 more Eternal Venom stack.', 'Every globule needs a stun, fear or other crowd control as it lands. Assign one per globule, with a backup.');
    // (a late break is the raid's: whoever finally broke it did the job, the log can't tell who was meant to)
    else if (b.late) M(b.t1, 'Raid', 'barbed bulwark', 'Low', 'A Caustic Globule\'s Barbed Bulwark took ' + b.up.toFixed(1) + ' seconds to break (' + b.by.spell + '), leaving little time to soak it before it explodes.', 'Break each barrier right as the globules land. They explode about 10 seconds after.');
    for (const [p, o] of b.into) M(o.t, pname(p), 'barbed bulwark', o.died ? 'High' : 'Low', 'Ran into a Caustic Globule while its Barbed Bulwark was still up: ' + (o.amt > 0 ? 'hit for ' + fmtN(o.amt) + ' and ' : '') + 'knocked back' + (o.died ? ', and died' : '') + '.', 'Wait for the barrier to break before going in to soak.',
      { t: o.t, good: [], goodLabel: '', bad: [p], badLabel: 'ran into a live barrier', title: 'Barbed Bulwark at ' + h.fmtT(o.t), pts: h.snap(o.t), frames: h.frames(Math.max(0, o.t - 3), Math.min(dur, o.t + 1.5), 0.25) });
  }
  const bBad = (b) => b.ranOut || [...b.into.values()].some((o) => o.died), bWarn = (b) => b.late || b.into.size > 0;

  // ---- 5. Caustic Globule soaks and Barbed Bulwark ----
  const globs = dmgId(TF.glob), bul = dmgId(TF.bulHit);
  // unsoaked globules: the rupture spell hitting most of the raid at once (each one is +1 Eternal Venom for everyone)
  const gBurst = []; for (const e of dmgId(TF.globBurst).filter((x) => h.isPlayer(x.dst)).sort((a, b) => a.t - b.t)) { const c = gBurst[gBurst.length - 1]; if (c && e.t - c.t <= 0.5) c.who.add(e.dst); else gBurst.push({ t: e.t, who: new Set([e.dst]) }); }
  const globExplode = gBurst.filter((c) => c.who.size >= 6);
  // (one whose barrier ran out is flagged under Barbed Bulwark instead: that's what went wrong)
  for (const c of globExplode) if (!ranOutT.some((t) => Math.abs(c.t - t) < 1.5)) M(c.t, 'Raid', 'caustic globule', 'High', 'A Caustic Globule nobody soaked exploded on the raid: ' + c.who.size + ' players hit, each +1 Eternal Venom.', 'Every globule needs a soaker before it ruptures. Assign one per player per set, and send someone with low stacks to any left over.');
  const gSets = setsOf(globs, 20).map((set, i) => ({ i, t: set[0].t, end: set[set.length - 1].t, hits: set }));
  const prevSoakers = new Set();
  for (const s of gSets) {
    s.by = new Map(); for (const e of s.hits) { let o = s.by.get(e.dst); if (!o) s.by.set(e.dst, o = { n: 0, t: e.t, ts: [] }); o.n++; o.ts.push(e.t); }
    // an extra globule is sometimes needed (amber); it's red when the soaker already had a lot of venom when taking it
    for (const o of s.by.values()) o.hiStacks = 0;
    s.bul = new Map(); for (const e of bul.filter((x) => x.t >= s.t - 2 && x.t <= s.end + 15)) { let o = s.bul.get(e.dst); if (!o) s.bul.set(e.dst, o = { n: 0, t: e.t, amt: 0 }); o.n++; o.amt += e.amt; }
    s.back = [...s.by.keys()].filter((g) => prevSoakers.has(g));
    s.died = [...s.by].map(([g, o]) => diedNear(g, o.t, 4)).filter(Boolean);
    const snapT = s.hits[Math.floor(s.hits.length / 2)].t;
    // (globule maps are animated, so the globules themselves show: 3s before to 1.5s after)
    const gfr = (t) => h.frames(Math.max(0, t - 3), Math.min(dur, t + 1.5), 0.25);
    const map = (bad, badLabel, t) => ({ t, good: [...s.by.keys()].filter((g) => !bad.includes(g)), goodLabel: 'soaked', bad, badLabel, title: 'Caustic Globule set ' + (s.i + 1) + ' at ' + h.fmtT(t), pts: h.snap(t), frames: gfr(t) });
    // (an extra globule at low venom is shown, not flagged: sets often have more globules than soakers (15 for 13 on
    // Wolfthorn's Mythic kill), so someone has to; it's a mistake when it's taken at the stack budget or above)
    for (const [g, o] of s.by) if (o.n > 1) {
      o.hiStacks = Math.max(...o.ts.slice(1).map((t) => stackAt(g, t - 0.05)));
      if (o.hiStacks < budget) continue;
      M(o.t, pname(g), 'caustic globule', 'Medium', 'Soaked ' + o.n + ' Caustic Globules in set ' + (s.i + 1) + ', taking the extra one at ' + o.hiStacks + ' Eternal Venom stacks.', 'Leave extra globules to players with fewer stacks.', map([g], 'soaked more than one', o.t));
    }
    // a second set in a row taken at the stack budget or above (not already flagged for an extra globule): Method's Mythic
    // guide rotates the sets between the two halves of the raid, with the raid leader keeping high-stack players out. A
    // set has 15 globules on Wolfthorn's pulls for 20 players, so about half the raid must go twice in a row: at low
    // venom that's only shown
    s.backHi = [];
    for (const g of s.back) { const o = s.by.get(g), st = stackAt(g, o.t - 0.05); if (st < budget || (o.n > 1 && o.hiStacks >= budget)) continue; s.backHi.push(g); o.backSt = st;
      M(o.t, pname(g), 'caustic globule', 'Medium', 'Soaked Caustic Globule set ' + (s.i + 1) + ' right after set ' + s.i + ', at ' + st + ' Eternal Venom stacks.', 'Sit out the next set when your stacks are high, so someone lower takes it.', map([g], 'second set in a row at high venom', o.t)); }
    // (Barbed Bulwark hits are flagged in their own section, 5a)
    for (const d of s.died) M(d.t, d.player, 'caustic globule', 'High', 'Died soaking a Caustic Globule.', 'Use a personal defensive for the soak, or let someone with fewer venom stacks take it.', map([d.guid], 'died after soaking', d.t));
    s.snapT = snapT; prevSoakers.clear(); for (const g of s.by.keys()) prevSoakers.add(g);
  }
  // (sets on Wolfthorn's Mythic pulls had 15 globules for 20 players, so many soak two sets in a row: that's shown, and
  // flagged only at high venom)
  // red: a death; amber: an extra globule taken at high venom, a Barbed Bulwark hit, or a second set in a row at high venom
  // (an extra globule at low venom is only shown) (fix 13, Oct 26: an extra at high venom was red on 3 of 10 top kills, one death among them)
  const setBad = (s) => s.died.length > 0;
  const setWarn = (s) => s.bul.size > 0 || s.backHi.length > 0 || [...s.by.values()].some((o) => o.n > 1 && o.hiStacks >= budget);
  sections.push({ id: 'soaks', title: 'Caustic Globules (One soak each)', place: 'Caustic Globule (orb) soaks', spell: S('caustic globule'),
    verdict: globExplode.length || gSets.some(setBad) ? 'bad' : gSets.some(setWarn) ? 'warn' : 'good',
    summary: pl(globs.length, 'globule') + ' soaked over ' + pl(gSets.length, 'set') + (globExplode.length ? ', and ' + pl(globExplode.length, 'globule') + ' exploded on the raid unsoaked' : '') + '. The plan is one globule per player per set, with sets taken in turns (high-venom players sit one out), and no touching a globule while its Barbed Bulwark is up.',
    cols: ['Soaker', 'When', 'Globules', 'Risky soaks', 'Barbed Bulwark hits', 'Died', ''],
    groups: gSets.map((s, si) => {
      // globules nobody soaked that exploded on the raid, listed in the set they came from (the last set that spawned before it)
      const ex = globExplode.filter((c) => c.t >= s.t - 1 && (gSets[si + 1] == null || c.t < gSets[si + 1].t - 1));
      const who = [...new Set([...s.by.keys(), ...s.bul.keys()])].sort((a, b) => ((s.by.get(a) || s.bul.get(a)).t - (s.by.get(b) || s.bul.get(b)).t));
      const rep = [...s.by.values()].filter((o) => o.n > 1).length;
      return { title: 'Set ' + (s.i + 1), t: s.t, bad: !!setBad(s) || ex.length > 0, warn: !!setWarn(s),
        sub: pl(s.hits.length, 'globule') + ', ' + pl(s.by.size, 'soaker') + (rep ? ', ' + rep + ' took more than one' : '') + (s.back.length ? ', ' + s.back.length + ' also soaked the last set' + (s.backHi.length ? ' (' + s.backHi.length + ' at high venom)' : '') : '') + (s.bul.size ? ', ' + pl(s.bul.size, 'Bulwark hit') : '') + (s.died.length ? ', ' + pl(s.died.length, 'death') : '') + (ex.length ? ', ' + pl(ex.length, 'globule') + ' exploded unsoaked' : ''),
        // (the wipe filter re-counts the explosions up to its cut, so the line matches the rows shown)
        cutSub: (ct) => { const n = ex.filter((c) => c.t <= ct + 0.05).length; return pl(s.hits.length, 'globule') + ', ' + pl(s.by.size, 'soaker') + (rep ? ', ' + rep + ' took more than one' : '') + (s.back.length ? ', ' + s.back.length + ' also soaked the last set' + (s.backHi.length ? ' (' + s.backHi.length + ' at high venom)' : '') : '') + (s.bul.size ? ', ' + pl(s.bul.size, 'Bulwark hit') : '') + (s.died.length ? ', ' + pl(s.died.length, 'death') : '') + (n ? ', ' + pl(n, 'globule') + ' exploded unsoaked' : ''); },
        // one map for the whole set: every soaker on it (green = clean soak, red = a problem), animated from just before
        // the globules land to just after the last soak or explosion; the rows below list everyone without a map each
        rows: [(() => {
          const probs = who.filter((g) => { const o = s.by.get(g); return (o && o.n > 1 && o.hiStacks >= budget) || s.backHi.includes(g) || s.bul.has(g) || s.died.some((x) => x.guid === g); });
          const t1 = Math.max(s.end, ...ex.map((c) => c.t)) + 1.5;
          return [{ txt: 'Whole set', sub: 'everyone who soaked, on one map' }, { t: s.t }, { txt: String(s.hits.length) }, { txt: '' }, { txt: '' }, { txt: '' },
            { map: { t: s.snapT, good: who.filter((g) => !probs.includes(g)), goodLabel: 'soaked', bad: probs, badLabel: 'soak problem (extra globule or second set in a row at high venom, Bulwark hit or died)', title: 'Caustic Globule set ' + (s.i + 1) + ': ' + pl(s.by.size, 'soaker') + (ex.length ? ', ' + pl(ex.length, 'globule') + ' exploded unsoaked' : ''), pts: h.snap(s.snapT), frames: h.frames(Math.max(0, s.t - 3), Math.min(dur, t1), 0.25) } }];
        })()].concat(ex.map((c) => [{ txt: 'Exploded unsoaked', bad: true }, { t: c.t }, { txt: '—', dim: true }, { txt: c.who.size + ' players hit, +1 Eternal Venom each', bad: true }, { txt: '—', dim: true }, { txt: '—', dim: true }, { txt: '' }])).concat(who.map((g) => {
          const o = s.by.get(g), b = s.bul.get(g), d = s.died.find((x) => x.guid === g), t = (o || b).t;
          const bad = (o && o.n > 1) || b || d, risky = o && o.n > 1 && o.hiStacks >= budget, again = o && s.backHi.includes(g);
          return [{ p: pname(g) }, { t }, { txt: String(o ? o.n : 0), warn: !!risky }, o && o.n > 1 ? { txt: pl(o.hiStacks, 'stack') + ', extra globule', bad: !!(risky && d), warn: !!risky } : again ? { txt: pl(o.backSt, 'stack') + ', second set in a row', warn: true } : { txt: '—', dim: true }, b ? { txt: String(b.n), warn: true } : { txt: '—', dim: true }, d ? { txt: 'died', bad: true } : { txt: '—', dim: true },
            { txt: '' }];
        })) };
    }), rows: [] });

  // the Barbed Bulwark section (Mythic only): per set, each globule's barrier, who broke it and with what, how long it
  // was up, and who ran into it while it was up. Red: one ran out (the globule exploded with it up) or someone died
  // running into one; amber: broken after 6 s (little time left to soak), or someone ran into one.
  if (bars.length) {
    const ups = bars.filter((b) => b.by).map((b) => b.up).sort((a, b) => a - b), med = ups.length ? ups[Math.floor(ups.length / 2)] : null;
    const outN = bars.filter((b) => b.ranOut).length, intoN = bars.reduce((s, b) => s + b.into.size, 0);
    const byWho = new Map(); for (const b of bars) if (b.by && b.by.who) byWho.set(b.by.who, (byWho.get(b.by.who) || 0) + 1);
    const top = [...byWho].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, c]) => n + ' (' + c + ')').join(', ');
    sections.push({ id: 'bulwark', title: 'Barbed Bulwark (CC breaks it)', place: 'Barbed Bulwark (orb shield): barriers broken', spell: S('barbed bulwark'),
      verdict: bars.some(bBad) ? 'bad' : bars.some(bWarn) ? 'warn' : 'good',
      summary: pl(bars.length, 'barrier') + ' over ' + pl(bSets.length, 'set') + '. ' + (outN ? pl(outN, 'barrier') + (outN === 1 ? ' wasn\'t' : ' weren\'t') + ' broken, so the globule exploded' : 'Every one was broken') + (med != null ? ', half of them within ' + med.toFixed(1) + ' seconds' : '') +
        ', and ' + (intoN ? 'someone ran into a live barrier ' + pl(intoN, 'time') : 'nobody ran into a live barrier') + '.' + (top ? ' The most were broken by ' + top + '.' : ''),
      cols: ['Globule', 'Landed', 'Broken by', 'With', 'Barrier up', 'Ran into it'],
      groups: bSets.map((s) => {
        const sOut = s.bars.filter((b) => b.ranOut).length, sInto = s.bars.reduce((n, b) => n + b.into.size, 0), slow = Math.max(0, ...s.bars.filter((b) => b.by).map((b) => b.up));
        return { title: 'Set ' + (s.i + 1), t: s.t, bad: s.bars.some(bBad), warn: s.bars.some(bWarn),
          sub: pl(s.bars.length, 'barrier') + ', ' + (sOut ? sOut + ' nobody broke' : 'all broken') + (slow ? ', slowest ' + slow.toFixed(1) + ' s' : '') + (sInto ? ', ' + pl(sInto, 'player') + ' ran into one' : ''),
          rows: s.bars.map((b, j) => {
            const died = [...b.into.values()].some((o) => o.died);
            return [{ txt: 'Globule ' + (j + 1) }, { t: b.t },
              b.by && b.by.who ? { p: b.by.who } : { txt: b.ranOut ? 'nobody' : b.t1 == null ? 'still up at the end' : 'not seen', bad: b.ranOut, dim: !b.ranOut },
              b.by ? { s: [b.by.id, b.by.spell] } : { txt: '—', dim: true },
              b.ranOut ? { txt: 'ran out, so it exploded', bad: true } : b.up != null ? { txt: b.up.toFixed(1) + ' s', warn: b.late } : { txt: '—', dim: true },
              b.into.size ? { ps: [...b.into.keys()].map(pname), bad: died, warn: !died } : { txt: '—', dim: true }];
          }) };
      }), rows: [] });
  }

  // ---- 6. Corrosive Spit: the Spawn of Vexhul adds spit a line at a marked player ----
  // The target isn't at fault (the spit is aimed at them). Anyone else it hits stood in the line. The plan is to
  // kill one add right away and the rest before their second spit.
  // Each aim: one add (src) marks one player (g) from t0 until the spit (t1). Its end is matched by both add and
  // player, since two adds can aim at the same player.
  const aimRm = auraId(TF.spitAim, 'remove');
  const aims = auraId(TF.spitAim, 'apply').map((e) => ({ g: e.dst, src: e.src, t0: e.t, t1: (aimRm.find((x) => x.dst === e.dst && x.src === e.src && x.t >= e.t) || { t: e.t + 5 }).t, byst: [] }));
  const spits = dmgId(TF.spit);
  // A spit fired only if the add finished the cast. An aim that ends early because the add died never fired, even
  // if it ran ~4.7s of its 5s. (Checked against 5 Mythic pulls: every aim ends in a cast or the add's death.)
  const spitCasts = ev.filter((e) => e.k === 'cast' && L(e.spell) === 'corrosive spit');
  for (const a of aims) a.fired = spitCasts.some((c) => c.src === a.src && c.t >= a.t0 + 3 && c.t <= a.t1 + 0.6);
  // Every hit belongs to the add that cast it. Hitting its own target is fine; anyone else stood in the line.
  // The target isn't always hit: standing right on the add (within ~6 yd) the line can miss them and still hit
  // people further down it.
  const spitOthers = [];
  for (const e of spits) {
    const a = aims.filter((w) => w.src === e.src && w.t0 <= e.t + 0.2 && e.t <= w.t1 + 0.6).pop();
    if (a) a.fired = true;
    if (a && a.g === e.dst) { a.hitTarget = true; continue; }
    const o = { e, target: a && a.g }; spitOthers.push(o); if (a) a.byst.push(o);
  }
  for (const a of aims) a.landed = a.fired; // (map lines use `landed`)
  // Animated map: every add and spit line of the set from the aim to the spit, so you can see who walked into a line.
  const spitMap = (t0, t1, setAims, mine, badAt, title) => {
    // every bystander hit in the window gets a red X, whichever add's spit it was
    badAt = badAt.concat(spitOthers.filter((o) => o.e.t >= t0 && o.e.t <= t1 && !badAt.some((b) => b[0] === o.e.dst && Math.abs(b[1] - o.e.t) < 0.1)).map((o) => [o.e.dst, o.e.t]));
    const frames = h.frames(t0, t1, 0.2, [...new Set(setAims.map((a) => a.src))]);
    const last = frames[frames.length - 1] || { pts: [] };
    // other targeted mechanics up at the same time: Coiling Ichor targets, and the Stone Breaker circle on the tank
    // (3.5 yd: SpellRadius 64 on Stone Breaker 1288538)
    const marks = windows(TF.ichorDeb, 12).filter((w) => w.t1 >= t0 && w.t0 <= t1).map((w) => ({ g: w.g, t0: w.t0, t1: w.t1, kind: 'ichor' }))
      .concat(dmgId(TF.sbTank).filter((e) => e.t >= t0 - 1 && e.t <= t1 + 1).map((e) => ({ g: e.dst, t0: e.t - 1.2, t1: e.t + 0.3, kind: 'stone', r: 3.5 })));
    return { t: t1, frames, marks, lines: setAims.map((a) => ({ from: a.src, to: a.g, t0: a.t0, t1: a.t1, on: mine.includes(a), landed: !!a.fired })), // landed: false = the add died first, the spit never fired
      hl: [...new Set(mine.map((a) => a.g))], hlLabel: 'spit target (not at fault)', bad: badAt.map((x) => x[0]), badAt, badLabel: 'stood in the line', title, pts: last.pts };
  };
  const spawnSets = setsOf(aims.map((a) => ({ a, t: a.t0 })), 15).map((set, i) => {
    const list = set.map((x) => x.a), addG = [...new Set(list.map((a) => a.src))];
    // number each add's spits in order (spit 1, spit 2...) and the adds by their first aim
    for (const g of addG) list.filter((a) => a.src === g).forEach((a, n) => { a.n = n + 1; a.k = addG.indexOf(g) + 1; });
    return { i, t: list[0].t0, aims: list, adds: addG.map((g) => ({ g, died: deathOf(g), fired: list.filter((a) => a.src === g && a.fired).length })) };
  });
  for (const o of spitOthers) {
    const a = aims.find((w) => w.byst.includes(o)), setAims = aims.filter((w) => w.t0 <= o.e.t + 0.6 && w.t1 >= (a ? a.t0 : o.e.t - 5));
    M(o.e.t, pname(o.e.dst), 'corrosive spit', diedNear(o.e.dst, o.e.t, 3) ? 'High' : 'Low', 'Hit by a Corrosive Spit aimed at ' + (o.target ? pname(o.target) : 'someone else') + ' (' + fmtN(o.e.amt) + ' damage).', 'Stay out of the line from a Spawn of Vexhul through its marked target. It keeps going past them.',
      spitMap((a ? a.t0 : o.e.t - 5) - 0.4, o.e.t + 0.6, setAims, a ? [a] : [], [[o.e.dst, o.e.t]], 'Corrosive Spit at ' + h.fmtT(o.e.t) + ': ' + pname(o.e.dst) + ' in the line'));
  }
  const repeatSpit = (a) => a.fired && a.n >= 2; // the add lived long enough for another spit
  // The answer in words under each spit's map (icons cover a couple of yards at full-arena zoom, so near misses can
  // look like hits): who the log says it hit, and the closest other player to the line when it fired.
  // Line: from the add through its target, ~55 yd long and ~3 yd each side of center (see SPIT_LEN / SPIT_W in ui.js).
  const spitNote = (a) => {
    if (!a.fired) return 'No spit. The add died before it fired, so nobody was hit.';
    const hit = (a.hitTarget ? [pname(a.g) + ' (the target)'] : []).concat(a.byst.map((o) => pname(o.e.dst) + ' (not targeted)'));
    let near = '';
    const f = (h.frames(a.t1, a.t1, 0.2, [a.src])[0] || { pts: [] }).pts, ad = f.find((p) => p.guid === a.src), tg = f.find((p) => p.guid === a.g);
    if (ad && tg) {
      const dx = tg.x - ad.x, dy = tg.y - ad.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, skip = new Set([a.g, ...a.byst.map((o) => o.e.dst)]);
      let best = null;
      for (const p of f) if (p.kind === 'player' && !skip.has(p.guid)) {
        const al = (p.x - ad.x) * ux + (p.y - ad.y) * uy, off = Math.abs(-(p.x - ad.x) * uy + (p.y - ad.y) * ux);
        if (al > 0 && al < 55 && (!best || off < best.off)) best = { p, off };
      }
      if (best) near = ' Closest other player: ' + best.p.name + ', ' + best.off.toFixed(1) + ' yd from the center of the line (it reaches about 3 yd each side).';
    }
    return 'Hit by this spit (from the log): ' + (hit.length ? hit.join(', ') : 'nobody') + '.' + (a.byst.length ? '' : ' Nobody else was hit.') + near;
  };
  /* (fix 12, Oct 26: one bystander turned the panel red on 6 of 10 top kills with nobody dying; the extra stack already shows under Eternal Venom) */
  const spitDead = (o) => !!diedNear(o.e.dst, o.e.t, 3);
  sections.push({ id: 'spit', title: 'Corrosive Spit (Stay out of others\' lines)', place: 'Corrosive Spit (add attack): standing in the line', spell: S('corrosive spit'),
    // red: a bystander who died, or an add's 3rd spit; amber: a bystander hit, or an add's 2nd spit (it should have died)
    verdict: spitOthers.some(spitDead) || aims.some((a) => a.fired && a.n >= 3) ? 'bad' : spitOthers.length || aims.some(repeatSpit) ? 'warn' : 'good',
    summary: pl(spawnSets.length, 'add set') + ' fired ' + pl(aims.filter((a) => a.fired).length, 'spit') + ', and ' + pl(spitOthers.length, 'player') + (spitOthers.length === 1 ? ' was' : ' were') + ' hit by a spit that wasn\'t aimed at them.',
    cols: ['Spit', 'Aimed', 'Target', 'Result', 'Stood in it', ''], /* (short words (your note, Oct 23)) */
    groups: spawnSets.map((s) => {
      const fired = s.aims.filter((a) => a.fired).length, extra = s.aims.filter(repeatSpit).length, oth = s.aims.reduce((n, a) => n + a.byst.length, 0);
      const early = s.adds.filter((x) => !x.fired).length;
      return { title: 'Set ' + (s.i + 1), t: s.t, bad: s.aims.some((a) => a.byst.some(spitDead) || (a.fired && a.n >= 3)), warn: extra > 0 || oth > 0,
        sub: pl(s.adds.length, 'add') + ', ' + pl(fired, 'spit') + ' fired' + (extra ? ', ' + extra + ' from adds that should have been dead' : '') + (early ? ', ' + pl(early, 'add') + ' killed before it fired' : ', none killed before its first spit') + (oth ? ', ' + pl(oth, 'player') + ' stood in it' : ''),
        rows: s.aims.map((a) => {
          const ad = s.adds.find((x) => x.g === a.src);
          const result = !a.fired ? { txt: 'add died first, no spit' + (ad && ad.died != null ? ' (' + h.fmtT(ad.died) + ')' : '') }
            /* (Oct 23, your note: "fired, hit the target" read as the target's fault; it's the add living too long. Being targeted can't be helped) */
            : a.n >= 2 ? { txt: 'add lived too long', bad: a.n >= 3, warn: true }
            : { txt: ((by) => (a.hitTarget ? (by.length ? 'hit its target and ' + by.join(', ') : 'hit only its target') : by.length ? 'hit ' + by.join(', ') : 'hit nobody'))([...new Set(a.byst.map((o) => pname(o.e.dst)))]) }; /* (fix 11, Oct 24: it said "only its target" with others hit too) */
          const t0 = a.t0 - 0.4, t1 = a.t1 + 0.6;
          const mp = spitMap(t0, t1, s.aims.filter((x) => x.t1 >= t0 && x.t0 <= t1), [a], a.byst.map((o) => [o.e.dst, o.e.t]), 'Corrosive Spit, set ' + (s.i + 1) + ', spawn ' + a.k + ' spit ' + a.n + ': ' + h.fmtT(a.t0) + ' to ' + h.fmtT(a.t1));
          mp.note = spitNote(a);
          return [{ txt: 'Spawn ' + a.k + ', spit ' + a.n }, { t: a.t0 }, { ps: [pname(a.g)] }, result, { ps: a.byst.map((o) => pname(o.e.dst)), none: 'nobody', bad: a.byst.some(spitDead), warn: a.byst.length > 0, suf: 'hit by ' + (pname(a.g) ? String(pname(a.g)).split('-')[0] + '\'s' : 'someone else\'s') + ' beam' /* (names first (your wording, Oct 23)) */ }, { map: mp }];
        }) };
    }), rows: [] });
  // ---- 7. Coiling Ichor: a circle around each target ----
  // Being a target is fine. Anyone else hit by the circle after a short spread time stood in someone's circle.
  const ICHOR_GRACE = 1.5;
  const ichWin = windows(TF.ichorDeb, 12), ichHits = dmgId(TF.ichor);
  const ichCasts = setsOf(ichWin.map((w) => ({ ...w, t: w.t0 })), 2).map((set) => {
    const tg = [...new Set(set.map((w) => w.g))], t = set[0].t, end = Math.max(...set.map((w) => w.t1));
    // (a tick counts once even when two circles overlap and both hit at the same moment)
    const others = new Map();
    for (const e of ichHits) if (e.t >= t + ICHOR_GRACE && e.t <= end + 0.5 && !tg.includes(e.dst)) { let o = others.get(e.dst); if (!o) others.set(e.dst, o = { n: 0, amt: 0, t: e.t, last: -9 }); if (e.t - o.last > 0.3) o.n++; o.last = e.t; o.amt += e.amt; }
    return { t, end, tg, others };
  });
  // A hit is small (50 to 75K on Mythic) and adds no Eternal Venom stack (checked on Wolfthorn's kill), and the raid
  // stacks for soaks, so a tick or two while stepping out is fine: only a stand-in of ICHOR_LONG ticks is a mistake
  const ICHOR_LONG = 10;
  // the circle on each marked player: it follows them and shrinks (measured on 30 Mythic pulls: about 11 yd for the first
  // ~6s, then down to about 6 yd at 10s; the map draws it that way, ring.shrink = 'ichor')
  const ichRings = (c) => c.tg.map((g) => ({ guid: g, t0: c.t, dur: 12, shrink: 'ichor', r: 11, label: 'Coiling Ichor', ...mcol('Coiling Ichor'), fx: 'debuff' }));
  for (const c of ichCasts) for (const [g, o] of c.others) {
    // (only a long stand-in, and minor: damage only; the gore puddle is the carrier's to place)
    if (o.n < ICHOR_LONG) continue;
    M(o.t, pname(g), 'coiling ichor', 'Low', 'Stood in a Coiling Ichor circle that wasn\'t theirs: hit ' + o.n + 'x (' + fmtN(o.amt) + ' damage).', 'Give marked players room. They carry the circle to the edge, so stay out of it until it expires.',
      { t: o.t, hl: c.tg, hlLabel: 'circle target (not at fault)', bad: [g], badLabel: 'in someone\'s circle', title: 'Coiling Ichor at ' + h.fmtT(o.t) + ': ' + pname(g) + ' in a circle', pts: h.snap(o.t), rings: ichRings(c) });
    mistakes[mistakes.length - 1].avoid = true; // (avoidable damage: graded there on the Night summary's report card)
  }
  sections.push({ id: 'ichor', title: 'Coiling Ichor (Stay out of others\' circles)', place: 'Coiling Ichor (player circles): standing in them', spell: S('coiling ichor'),
    verdict: ichCasts.some((c) => [...c.others.values()].some((o) => o.n >= ICHOR_LONG)) ? 'warn' : 'good',
    summary: pl(ichCasts.length, 'cast') + '. ' + pl(ichCasts.reduce((n, c) => n + [...c.others.values()].filter((o) => o.n >= ICHOR_LONG).length, 0), 'player') + ' stayed in a circle that wasn\'t theirs for ' + ICHOR_LONG + ' ticks or more. A tick or two while stepping out is fine, and hits in the first ' + ICHOR_GRACE + ' seconds are spread time, so they aren\'t counted.',
    cols: ['When', 'Circle targets', 'In someone else\'s circle', ''],
    rows: ichCasts.map((c) => {
      const hitList = [...c.others].sort((a, b) => b[1].n - a[1].n);
      const first = hitList.length ? Math.min(...hitList.map(([, o]) => o.t)) : c.t + 3;
      // amber: someone stayed in a circle for ICHOR_LONG+ ticks; a tick or two while moving out is listed, not judged
      return [{ t: c.t }, { ps: c.tg.map(pname) }, hitList.length ? { txt: hitList.map(([g, o]) => pname(g) + ' (' + o.n + (o.n === 1 ? ' time' : ' times') + ')').join(', '), warn: hitList.some(([, o]) => o.n >= ICHOR_LONG) } : { txt: 'nobody', dim: false },
        { map: { t: first, hl: c.tg, hlLabel: 'circle target (not at fault)', bad: hitList.map(([g]) => g), badLabel: 'in someone\'s circle', good: hitList.length ? [] : c.tg, goodLabel: 'circle target, nobody else hit', title: 'Coiling Ichor at ' + h.fmtT(first), pts: h.snap(first), rings: ichRings(c), frames: h.frames(Math.max(0, c.t - 1), Math.min(dur, c.end + 1), 0.25) } }];
    }) });

  // ---- 8. Stone Breaker: the tank soaks three circles in a row; a missed one hits the raid ----
  // (three casts 3s apart, so castTimes' 3s merge can't be used here)
  const sbCasts = ev.filter((e) => e.k === 'start' && e.id === TF.sbCast).map((e) => e.t).sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 1), sbTank = dmgId(TF.sbTank), sbRaid = dmgId(TF.sbRaid);
  const sbSets = setsOf(sbCasts.map((t) => ({ t })), 5).map((set, i) => {
    const rows = set.map((c, k) => {
      const nextT = set[k + 1] ? set[k + 1].t : c.t + 3;
      const tank = sbTank.filter((e) => e.t >= c.t && e.t < nextT + 0.2 && e.t < c.t + 3);
      const raid = sbRaid.filter((e) => e.t >= c.t && e.t < c.t + 3);
      return { t: c.t, k, tank: [...new Set(tank.map((e) => e.dst))], raid: [...new Set(raid.map((e) => e.dst))], hitT: (tank[0] || raid[0] || { t: c.t + 1.5 }).t };
    }).filter((x) => !(r.item.kill && x.hitT >= dur - 1)); /* (fix 10, Oct 24: a circle landing within a second of the kill, or after it, isn't judged) */
    const tankG = (rows.find((x) => x.tank.length) || { tank: [] }).tank[0] || (auraId(TF.sbDeb).find((e) => e.t >= set[0].t && e.t <= set[0].t + 10) || {}).dst;
    for (const x of rows) if (!x.tank.length && x.raid.length) {
      // (no map: the log can't place the circle itself, only where the tank and the raid stood, and a map of that alone would look like proof)
      M(x.hitT, tankG ? pname(tankG) : 'Unknown', 'stone breaker', 'High', 'Missed Stone Breaker circle ' + (x.k + 1) + ': it hit ' + pl(x.raid.length, 'player') + '.', 'Tank: stand in each of the three circles in order as they land.');
    }
    return { i, t: set[0].t, rows, tankG };
  });
  sections.push({ id: 'stone', title: 'Stone Breaker (Tank catches the circles)', place: 'Stone Breaker (tank soak): catching the circles', spell: S('stone breaker'),
    verdict: sbSets.some((s) => s.rows.some((x) => !x.tank.length)) ? 'bad' : 'good',
    summary: ((m) => pl(sbSets.length, 'Stone Breaker') + (m ? ', and the tank missed ' + pl(m, 'circle') : ', and the tank caught every circle') + '.')(sbSets.reduce((n, s) => n + s.rows.filter((x) => !x.tank.length).length, 0)),
    cols: ['Circle', 'When', 'Soaked by', 'Raid hit', ''],
    groups: sbSets.map((s) => {
      const miss = s.rows.filter((x) => !x.tank.length).length;
      return { title: 'Stone Breaker ' + (s.i + 1), t: s.t, bad: miss > 0, sub: (s.tankG ? pname(s.tankG) + ', ' : '') + (s.rows.length - miss) + ' of ' + s.rows.length + ' circles soaked',
        rows: s.rows.map((x) => [{ txt: 'Circle ' + (x.k + 1) }, { t: x.hitT }, x.tank.length ? { ps: x.tank.map(pname) } : { txt: 'missed', bad: true }, x.raid.length ? { txt: pl(x.raid.length, 'player'), bad: true } : { txt: 'none', dim: true },
          { txt: '' }]) };
    }), rows: [] });

  // ---- 9. avoidable: Stir the Depths and Sanguine Storm ----
  // Stir the Depths pulses the whole raid every 2 seconds while it's out (19 of 19 players, 4 pulses a cast on Mythic
  // kills): that isn't avoidable and isn't counted. What is avoidable is stepping into the churned water it leaves,
  // which tags you with a brief debuff (often 20 to 40 seconds after the cast): each step is one hit. Sanguine Storm:
  // each hit. Both are spread over the whole raid in every top kill, so amber is more than the worst top-kill raider had by the same
  // point of the fight (AVOID_BASE, avLim; mechanics audit Oct 26: the old 2 amber / 5 red had no top kill green), red twice that;
  // a death to Sanguine Storm is red when it did half or more of their last 15 s.
  const av = new Map(), A = (g) => { let a = av.get(g); if (!a) av.set(g, a = { stir: 0, storm: 0, amt: 0, last: -9, stirT: [], stormT: [] }); return a; };
  for (const e of ev.filter((x) => x.k === 'aura' && L(x.spell) === 'stir the depths').sort((a, b) => a.t - b.t)) if (e.op === 'apply' && h.isPlayer(e.dst)) { const a = A(e.dst); if (e.t - a.last > 1.5) { a.stir++; a.stirT.push(e.t); } a.last = e.t; }
  for (const e of dmg('sanguine storm')) { const a = A(e.dst); a.storm++; a.stormT.push(e.t); a.amt += e.amt; }
  const avRows = [...av].sort((a, b) => (b[1].stir + b[1].storm) - (a[1].stir + a[1].storm) || b[1].amt - a[1].amt);
  const hits = (a) => a.stir + a.storm;
  // (one set per source, like every other boss's Avoidable damage, so it draws as bars: players, hits, damage, died)
  // (with how harmful it is, its hits and damage in total, and its spell, like avoidPanel's: the Summary's chart reads those)
  const avOwn = (d, n) => { const rc = (d.recap || []).filter((e) => !e.heal), all = rc.reduce((s, e) => s + (e.amount || 0), 0); return !all || rc.filter((e) => L(e.spell || '') === n).reduce((s, e) => s + (e.amount || 0), 0) >= all / 2; };
  const avSet = (title, sub, key, amtOf, sp) => { const rs = avRows.filter(([, a]) => a[key] > 0).sort((a, b) => b[1][key] - a[1][key]);
    if (!rs.length) return null; const L2 = avLim(r, { label: title, harm: 'Medium' }, false), [wA, bA] = L2.lim(r.duration || 0);
    const died = new Map(key === 'storm' ? r.deaths.filter((d) => L(d.ability || '') === sp && avOwn(d, sp)).map((d) => [d.guid, d.t]) : []);
    const rows = rs.map(([g, a]) => { const dd = died.has(g), bad = dd || a[key] >= bA; return [{ p: pname(g) }, { txt: a[key] + (a[key] === 1 ? ' hit' : ' hits'), bad, warn: !bad && a[key] >= wA }, { n: amtOf(a) }, dd ? { txt: 'died to it', bad: true } : { txt: '—', dim: true }]; });
    const nT = rs.reduce((n, [, a]) => n + a[key], 0), amt = rs.reduce((n, [, a]) => n + amtOf(a), 0), spl = S(sp);
    return { title, t: null, harm: 'Medium', nT, amt, spell: spl, sub: sub + '. ' + pl(nT, 'hit') + ' on ' + pl(rs.length, 'player') + '.', bad: rows.some((x) => x[1].bad), warn: rows.some((x) => x[1].warn), rows, hitTs: rs.map(([g, a]) => [pname(g), a[key + 'T']]),
      /* (avoidMistakes reads these: the verdict is the one answer, the pack's per-hit notes give way) */ label: title, names: [sp], secs: false, kb: false, lim: L2.lim,
      judge: rs.map(([g, a]) => ({ p: pname(g), tank: false, ts: a[key + 'T'], amt: amtOf(a), dt: died.has(g) ? died.get(g) : null })) }; };
  const avGroups = [avSet('Stir the Depths water', 'Harmful: stepping into the churned water it leaves (each step is a hit)', 'stir', () => 0, 'stir the depths'),
    avSet('Sanguine Storm', 'Harmful: each hit', 'storm', (a) => a.amt, 'sanguine storm')].filter(Boolean);
  sections.push({ id: 'avoid', title: 'Avoidable damage', spell: S('sanguine storm'),
    verdict: avGroups.some((g) => g.bad) ? 'bad' : avGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: avRows.length ? pl(avRows.length, 'player') + ' stepped into Stir the Depths water or got hit by Sanguine Storm.' : 'Nobody stepped into Stir the Depths water or got hit by Sanguine Storm.',
    cols: ['Player', 'Hits', 'Damage taken', 'Died'], rows: [], groups: avGroups });

  // (raid cooldown usage is shown on the Healing tab)
  const diag = TF_SPELLS.map((n) => {
    const c = { cast: 0, dmg: 0, aura: 0, other: 0 };
    for (const x of ev) if (L(x.spell) === n) { if (x.k === 'cast' || x.k === 'start') c.cast++; else if (x.k === 'dmg') c.dmg++; else if (x.k === 'aura') c.aura++; else c.other++; }
    return { name: S(n)[1], id: 0, ...c, total: c.cast + c.dmg + c.aura + c.other };
  });
  // for NSRT assignment checks (checkAssignments): each Feast's strikes and who soaked them, the globule sets, and
  // crowd control players put on the Caustic Globules
  const _feasts = feastGroups.map((f) => ({ t: f.t, strikes: f.strikes.map((s) => ({ t: s.t, who: s.who.map(pname) })) }));
  const bulT = [...r.firstSeen].filter(([g]) => /barbed bulwark|globule/i.test(h.unitName(g) || '')).map(([, t]) => t);
  const _globSets = gSets.map((s) => ({ i: s.i, t: s.t, end: s.end, adds: bulT.filter((t) => t >= s.t - 6 && t <= s.end + 2).length }));
  const _globCC = ev.filter((e) => e.k === 'aura' && e.op === 'apply' && CA_CC.includes(L(e.spell)) && !h.isPlayer(e.dst) && h.isPlayer(e.src) && /globule|barbed bulwark/i.test(h.unitName(e.dst) || '')).map((e) => ({ t: e.t, who: pname(e.src), spell: e.spell })); // (the globule adds log as "Barbed Bulwark")
  // which side of the platform a spot is on, as the raid faces the twins at the pull: the line from the raid (first 5 s)
  // to the point between the twins' starting spots splits it. On every Mythic pull checked Vexhul starts on the left;
  // the first two sets of Broodlings come 5 on each side, later sets all on one side. (The Interrupts section uses it.)
  const kickSide = (() => {
    const tp = tw.map((x) => r.positions.get(x.g)).filter((u) => u && u.pts.length).map((u) => u.pts[0]); if (tp.length < 2) return null;
    const mid = [(tp[0][1] + tp[1][1]) / 2, (tp[0][2] + tp[1][2]) / 2], early = [];
    for (const u of r.positions.values()) if (r.players.has(u.guid)) { const p = u.pts.find((q) => q[0] <= 5); if (p) early.push(p); }
    if (!early.length) return null;
    const c = [early.reduce((s, p) => s + p[1], 0) / early.length, early.reduce((s, p) => s + p[2], 0) / early.length], d = [mid[0] - c[0], mid[1] - c[1]];
    if (Math.hypot(d[0], d[1]) < 3) return null;
    // (map x is east and y north, so a positive cross product is to the left of the way the raid faces)
    return (x, y) => (d[0] * (y - mid[1]) - d[1] * (x - mid[0]) > 0 ? 'left' : 'right');
  })();
  { const pc = paceCard(ev, r, h, mistakes, "The Twin Fangs"); if (pc) sections.push(pc); } /* (Pace, Oct 22: boss coverage) */
  return { _feasts, _globSets, _globCC, diag, kickSide, title: diff + ' audit: The Twin Fangs', reached: phases[phases.length - 1].name, phases, marks, sections, mistakes,
    legend: 'Rows: Stir the Depths, soaks, Venomous Emergence and Ravenous Feast, Sanguine Storm. Red ticks are deaths. Hover any icon for its time.',
    note: '' };
}

// Entombed Sentinels: two golems, Breath of Ula'tek (green) and Blood of Ula'tek (red), each fought by half the raid on
// its own side of the room, with Vitriolic Stasis (the Helical Toxins pairing game) at 100 energy, after which the bosses
// swap sides. Mechanics and the plan are from the Mythic guides; the spell IDs, timings and how each shows in the log
// were read from Mythic pulls (Warcraft Logs). Phases: one per cycle, each ending with its intermission.
function buildEntombedSentinels(ev, r, h) {
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const dur = r.duration, mythic = r.item.diff === 'Mythic', pname = (g) => h.name(g);
  const fmtM = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1e3) + 'k');
  const mistakes = [], sections = [];
  const M = (t, player, mech, severity, detail, fix, map) => mistakes.push({ t, player, mechanic: mech, id: 0, severity, detail, fix, ...(map ? { map } : {}) });
  const has = (e, ids) => [].concat(ids).includes(e.id);
  const dmgId = (ids) => ev.filter((e) => e.k === 'dmg' && has(e, ids) && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const auraId = (ids, op) => ev.filter((e) => e.k === 'aura' && has(e, ids) && (!op || e.op === op)).sort((a, b) => a.t - b.t);
  // (a boss cast logs a start and a success: one time per cast, repeats within 3 s merged)
  const castT = (id) => { const l = ev.filter((e) => (e.k === 'cast' || e.k === 'start') && e.id === id).map((e) => e.t).sort((a, b) => a - b); return l.filter((t, i) => !i || t - l[i - 1] > 3); };
  const diedNear = (g, t, w) => r.deaths.find((d) => d.guid === g && d.t >= t - 0.2 && d.t <= t + w);
  const frames = (t0, t1) => h.frames(Math.max(0, t0), Math.min(dur, t1), 0.25);
  const isTank = (g) => h.role(g) === 'tank';
  const unitG = (nm) => { for (const [g, u] of r.hpUnits || []) if (u.name === nm) return g; for (const u of r.positions.values()) if (u.name === nm) return u.guid; return null; };
  const gBreath = unitG("Breath of Ula'tek"), gBlood = unitG("Blood of Ula'tek");

  // ---- intermissions (Vitriolic Stasis on the bosses) and phases: one cycle each, ending with its intermission ----
  const stA = auraId(ES.stasis, 'apply').filter((e) => !h.isPlayer(e.dst)), stR = auraId(ES.stasis, 'remove').filter((e) => !h.isPlayer(e.dst));
  const inters = [];
  for (const e of stA) { if (inters.length && e.t - inters[inters.length - 1].t0 < 5) continue; inters.push({ i: inters.length, t0: e.t, t1: (stR.find((x) => x.t > e.t + 1) || { t: Math.min(dur, e.t + 30) }).t }); }
  const phases = []; let c0 = 0;
  inters.forEach((x, i) => { phases.push({ name: 'Cycle ' + (i + 1), start: c0, end: x.t1 }); c0 = x.t1; });
  if (c0 < dur - 1 || !phases.length) phases.push({ name: 'Cycle ' + (inters.length + 1), start: c0, end: dur });
  const cycOf = (t) => { let k = 0; phases.forEach((p, i) => { if (t >= p.start - 0.5) k = i; }); return k; };
  const inInter = (t) => inters.some((x) => t >= x.t0 - 0.5 && t <= x.t1 + 0.5);
  const marks = [];
  for (const x of inters) marks.push({ t: x.t0, label: 'Vitriolic Stasis', id: 0, kind: 'phase' });

  // ---- 1. Helical Toxins (the intermission): pair up so the green orbs make exactly 4 ----
  // Read from Mythic pulls: everyone gets Helical Toxins, but the starting orb count isn't in the log. Two players who
  // solve it lose the debuff at the same moment; a wrong bump shows as both players' stacks changing to the sum (two
  // 1s make 2, a 1 and a 2 make 3), and whoever still has it when it runs out (28 s) takes Cultivated Burst: a big hit,
  // a long DoT and a pool. So: who paired with whom, how fast, any wrong bump, and who didn't solve it.
  // (a failure from its hit, or its debuff when the hit was fully absorbed: 0 damage logs as a miss)
  const hxA = auraId(ES.helix).filter((e) => h.isPlayer(e.dst)), cbHits = dmgId(ES.cb).concat(auraId(ES.cbDeb, 'apply').filter((e) => h.isPlayer(e.dst)).map((e) => ({ t: e.t, dst: e.dst, amt: 0 })))
    .sort((a, b) => a.t - b.t).filter((e, i, a) => !a.slice(0, i).some((x) => x.dst === e.dst && Math.abs(x.t - e.t) < 2));
  const hGroups = inters.map((x) => {
    const evs = hxA.filter((e) => e.t >= x.t0 - 3 && e.t <= x.t0 + 34), got = [...new Set(evs.filter((e) => e.op === 'apply').map((e) => e.dst))];
    const t0 = Math.min(...evs.filter((e) => e.op === 'apply').map((e) => e.t), x.t0);
    const rem = evs.filter((e) => e.op === 'remove'), cb = cbHits.filter((e) => e.t >= x.t0 && e.t <= x.t0 + 40);
    const failed = new Set(cb.map((e) => e.dst));
    // wrong bumps: two players' stacks changing at the same moment
    const doses = evs.filter((e) => e.op === 'dose' || e.op === 'rdose'), bumps = [];
    for (const d of doses) { const b = bumps.find((q) => Math.abs(q.t - d.t) < 0.15 && q.st === d.stacks && !q.who.includes(d.dst)); if (b) b.who.push(d.dst); else bumps.push({ t: d.t, st: d.stacks, who: [d.dst] }); }
    // (a pair reaching exactly 4 is the solve itself; any other new count is a wrong bump)
    const wrong = bumps.filter((b) => b.st !== 4 && b.st > 0);
    // solved pairs: removed together, without a Cultivated Burst (a removal at a death is the death, not a solve)
    const solved = [], used = new Set(), diedIn = [];
    for (const e of rem) { if (used.has(e.dst) || failed.has(e.dst)) continue;
      if (r.deaths.some((d) => d.guid === e.dst && Math.abs(d.t - e.t) < 0.5)) { used.add(e.dst); diedIn.push(e); continue; }
      const mate = rem.find((q) => q.dst !== e.dst && !used.has(q.dst) && !failed.has(q.dst) && Math.abs(q.t - e.t) < 0.15);
      used.add(e.dst); if (mate) used.add(mate.dst); solved.push({ t: e.t, who: mate ? [e.dst, mate.dst] : [e.dst] }); }
    // each player's starting stacks (their green orbs). Not in the log itself, but Helical Toxins ticks every 2 s for
    // about 15k a stack, so the first tick tells (1, 2 or 3); a pair that solved it adds up to 4, which settles the close
    // ones (a 3 and a 1 are far apart, two 2s alike). Unknown for a pair that solved it before the first tick.
    const bumpT = new Map(); for (const b of wrong) for (const g of b.who) if (!bumpT.has(g)) bumpT.set(g, b.t);
    const tick = new Map(); for (const e of ev.filter((q) => q.k === 'dmg' && q.id === ES.helixTick && h.isPlayer(q.dst) && q.t >= t0 && q.t <= t0 + 5).sort((a, b) => a.t - b.t)) if (!tick.has(e.dst) && e.t < (bumpT.get(e.dst) ?? 1e9)) tick.set(e.dst, e.raw || e.amt);
    const stk = new Map(), pairs = solved.filter((s) => s.who.length === 2);
    for (const s of pairs) { const [a, b] = s.who, va = tick.get(a), vb = tick.get(b); if (!va || !vb) continue;
      if (Math.max(va, vb) / Math.min(va, vb) >= 1.8) { stk.set(va > vb ? a : b, 3); stk.set(va > vb ? b : a, 1); } else { stk.set(a, 2); stk.set(b, 2); } }
    const per1 = [...stk].map(([g, n]) => tick.get(g) / n).sort((a, b) => a - b), unit = per1.length ? per1[Math.floor(per1.length / 2)] : 15000;
    for (const [g, v] of tick) if (!stk.has(g)) stk.set(g, Math.max(1, Math.min(3, Math.round(v / unit))));
    for (const s of pairs) { const [a, b] = s.who; if (stk.has(a) && !stk.has(b)) stk.set(b, 4 - stk.get(a)); else if (stk.has(b) && !stk.has(a)) stk.set(a, 4 - stk.get(b)); }
    const lab = (g) => (stk.has(g) ? String(stk.get(g)) : '');
    const rows = solved.sort((a, b) => a.t - b.t).map((s) => {
      const wb = wrong.find((b) => b.who.some((g) => s.who.includes(g)));
      return [{ pt: s.who.map((g) => [pname(g), lab(g)]) }, { t: s.t }, { txt: (s.t - t0).toFixed(1) + ' s' }, wb ? { txt: 'solved, after a wrong bump (to ' + wb.st + ')', warn: true } : { txt: s.who.length === 2 ? 'solved' : 'cleared', dim: s.who.length !== 2 }, { txt: '' }];
    }).concat(diedIn.map((e) => [{ pt: [[pname(e.dst), lab(e.dst)]] }, { t: e.t }, { txt: '—', dim: true }, { txt: 'died during the intermission', bad: true }, { txt: '' }]),
      [...failed].map((g) => { const e = cb.find((q) => q.dst === g), wb = wrong.find((b) => b.who.includes(g)), d = diedNear(g, e.t, 70);
      return [{ pt: [[pname(g), lab(g)]] }, { t: e.t }, { txt: 'ran out', bad: true }, { txt: 'Cultivated Burst' + (e.amt ? ' (' + fmtM(e.amt) + ')' : '') + (wb ? ' after a wrong bump (to ' + wb.st + ')' : '') + (d ? ', died' : ''), bad: true }, { txt: '' }]; }));
    for (const g of failed) { const e = cb.find((q) => q.dst === g); M(e.t, pname(g), 'Helical Toxins', 'High', 'Didn\'t solve Helical Toxins in intermission ' + (x.i + 1) + ': took Cultivated Burst (' + (e.amt ? fmtM(e.amt) + ', then ' : '') + 'a long DoT and a pool).', 'Pair with exactly one player so your green orbs make 4 (1 with 3, 2 with 2). If you fail, go to the far corner and stop bumping.'); }
    for (const b of wrong) if (b.who.some((g) => !failed.has(g))) M(b.t, b.who.map(pname).join(' and '), 'Helical Toxins', 'Medium', 'Bumped into the wrong partner in intermission ' + (x.i + 1) + ': the stacks went to ' + b.st + ' instead of clearing.', 'Bump only into a partner that makes 4: follow the raid\'s system (who pings, who goes under the boss).');
    const slow = solved.length ? Math.max(...solved.map((s) => s.t - t0)) : null;
    const who = got.filter((g) => !failed.has(g)), fl = [...failed];
    // (the map: each player's stacks next to their name, a white ring until they solve it, then a green check; a green
    // line joins a pair the moment they solve it, an amber one a wrong bump; a red X at Cultivated Burst)
    const solveAt = new Map(); for (const s of pairs) for (const g of s.who) solveAt.set(g, s.t);
    const hxMap = { t: x.t0 + 6, good: who, goodLabel: 'solved it', goodAt: [...solveAt], pendLabel: 'hasn\'t solved it yet', bad: fl, badLabel: 'didn\'t solve it (Cultivated Burst)', badAt: fl.map((g) => [g, cb.find((q) => q.dst === g).t]),
      // (the number follows their stacks: the starting count, the new total after a wrong bump, then 4 once solved)
      tags: got.flatMap((g) => {
        const ch = doses.filter((d) => d.dst === g).map((d) => [d.t, d.stacks]).concat(solveAt.has(g) ? [[solveAt.get(g), 4]] : []).sort((a, b) => a[0] - b[0]);
        const seg = []; let from = t0 - 1, val = stk.has(g) ? stk.get(g) : null;
        for (const [t, v] of ch) { if (val != null) seg.push([g, String(val), from, t]); from = t; val = v; }
        if (val != null) seg.push([g, String(val), from, 1e9]); return seg; }),
      tagLabel: 'Number by a name: their stacks (green orbs), read from the debuff\'s damage; 4 once solved',
      links: pairs.map((s) => ({ from: s.who[0], to: s.who[1], t0: s.t - 0.4, t1: s.t + 1.6, color: '#2fd15a', legend: 'a pair solving it' }))
        .concat(wrong.filter((b) => b.who.length >= 2).map((b) => ({ from: b.who[0], to: b.who[1], t0: b.t - 0.4, t1: b.t + 1.6, color: '#f3c969', legend: 'a wrong bump' }))),
      // (to the last solve or Cultivated Burst: Helical Toxins runs its 28 s even when the bosses' stasis ends sooner)
      title: 'Helical Toxins, intermission ' + (x.i + 1), pts: h.snap(x.t0 + 6), frames: frames(x.t0, Math.min(x.t0 + 32, Math.max(x.t1, ...solved.map((s) => s.t), ...cb.map((q) => q.t)) + 2)) };
    return { title: 'Intermission ' + (x.i + 1), t: x.t0, bad: fl.length > 0, warn: wrong.length > 0,
      sub: pl(got.length, 'player') + ': ' + pl(solved.filter((s) => s.who.length === 2).length, 'pair') + ' solved' + (slow != null ? ', slowest +' + slow.toFixed(1) + ' s' : '') + (wrong.length ? ', ' + pl(wrong.length, 'wrong bump') : '') + (fl.length ? ', ' + fl.length + ' didn\'t solve it' : ''),
      // (the map row is dim: it isn't a result, so the counts above leave it out)
      rows: [[{ txt: 'Whole intermission', sub: 'everyone, on one map', dim: true }, { t: x.t0 }, { txt: '' }, { txt: '' }, { map: hxMap }]].concat(rows) };
  });
  if (hGroups.length) sections.push({ id: 'helix', title: 'Helical Toxins (Pair up and solve)', place: 'Helical Toxins (orbs): the pairing game', spell: [ES.helix, 'Helical Toxins'],
    verdict: hGroups.some((g) => g.bad) ? 'bad' : hGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(hGroups.length, 'intermission') + '. It shows the pairs that solved it, how fast, any wrong bumps, and anyone who took Cultivated Burst.',
    cols: ['Players', 'When', 'Solved after', 'Result', ''], groups: hGroups, rows: [] });

  // ---- 2. Shifting Protovenom (Mythic): circles that clear by touching another circle ----
  // Read from Mythic pulls: 8 players get a circle in two batches of 4; each pulses 233k every 2 s until two circles
  // touch, which removes both at the same moment. A circle touching a player without one is a Protovenom Eruption
  // (damage and a knockback for both, and the circle stays).
  const pvA = auraId(ES.pv).filter((e) => h.isPlayer(e.dst)), pvTicks = dmgId(ES.pvTick), erupts = dmgId(ES.erupt);
  const pvCasts = castT(ES.pvCast).concat(pvA.filter((e) => e.op === 'apply').map((e) => e.t)).sort((a, b) => a - b).filter((t, i, a) => !i || t - a[i - 1] > 8);
  const pvGroups = pvCasts.map((t, i) => {
    const end = pvCasts[i + 1] != null ? pvCasts[i + 1] - 1 : dur + 1;
    // (t is the cast's start: the circles land about 4.5 s later, in two batches)
    const ap = pvA.filter((e) => e.op === 'apply' && e.t >= t - 0.5 && e.t <= t + 8), circles = [...new Set(ap.map((e) => e.dst))];
    const rm = pvA.filter((e) => e.op === 'remove' && e.t >= t && e.t < end);
    const er = []; for (const e of erupts.filter((x) => x.t >= t && x.t < end)) { const c = er.find((q) => Math.abs(q.t - e.t) < 0.3); if (c) { if (!c.who.includes(e.dst)) c.who.push(e.dst); } else er.push({ t: e.t, who: [e.dst] }); }
    const eruptOf = (g) => er.find((q) => q.who.includes(g));
    /* (fix 16, Oct 26: a death within ~4 s of the eruption, or a fall after its knockback) */
    const exDeath = (g, ex) => ex ? r.deaths.find((d) => d.guid === g && d.t >= ex.t - 0.2 && (d.t <= ex.t + 4 || (d.t <= ex.t + 8 && /fall/i.test(d.ability || '')))) : null;
    // partners: two circles gone at the same moment; when two pairs clear at once, the nearest one is the partner
    const offT = new Map(circles.map((g) => { const on = (ap.find((e) => e.dst === g) || {}).t; return [g, (rm.find((e) => e.dst === g && e.t >= on) || {}).t]; }));
    const mateOf = new Map(), left = circles.filter((g) => offT.get(g) != null).sort((a, b) => offT.get(a) - offT.get(b));
    while (left.length) {
      const g = left.shift(); if (mateOf.has(g)) continue;
      const cand = left.filter((q) => !mateOf.has(q) && Math.abs(offT.get(q) - offT.get(g)) < 0.15); if (!cand.length) continue;
      const sn = cand.length > 1 ? h.snap(offT.get(g)) : [], pos = (x) => sn.find((p) => p.guid === x), pg = pos(g), dd = (q) => { const p = pos(q); return p && pg ? Math.hypot(p.x - pg.x, p.y - pg.y) : 1e9; };
      const best = cand.reduce((m, q) => (dd(q) < dd(m) ? q : m)); mateOf.set(g, best); mateOf.set(best, g);
    }
    const rowOf = (g) => {
      const on = (ap.find((e) => e.dst === g) || {}).t, off = offT.get(g), mate = mateOf.get(g) || null;
      const n = pvTicks.filter((e) => e.dst === g && e.t >= on && e.t <= (off ?? end) + 0.1).length, ex = eruptOf(g), d = diedNear(g, on, (off ?? on + 20) - on + 2);
      const took = off != null ? off - on : null, slow = took != null && took > 8;
      return { g, on, off, mate, n, ex, d, took, row: [{ p: pname(g) }, { t: on }, mate ? { p: pname(mate) } : { txt: off != null ? 'no partner' : 'still on', warn: true }, took != null ? { txt: took.toFixed(1) + ' s', warn: slow } : { txt: '—', dim: true },
        { txt: pl(n, 'pulse'), dim: !n }, ex ? { txt: 'erupted' + (ex.who.length > 1 ? ' with ' + ex.who.filter((q) => q !== g).map(pname).join(', ') : '') + (exDeath(g, ex) ? ' and died' : ''), bad: !!exDeath(g, ex) } : d ? { txt: 'died', bad: true } : { txt: '—', dim: true }, { txt: '' }] };
    };
    const cr = circles.map(rowOf).sort((a, b) => a.on - b.on);
    // (players without a circle caught in an eruption: they ran into one, or one ran into them)
    const plain = [...new Set(er.flatMap((q) => q.who))].filter((g) => !circles.includes(g)).map((g) => { const ex = eruptOf(g);
      return [{ p: pname(g), sub: 'no circle' }, { t: ex.t }, { txt: '—', dim: true }, { txt: '—', dim: true }, { txt: '—', dim: true }, exDeath(g, ex) ? { txt: 'caught in an eruption and died', bad: true } : { txt: 'caught in an eruption' }, { txt: '' }]; });
    // (eruption hits themselves are flagged by the rule pack, one per player hit)
    for (const x of cr) if (!x.ex && x.took > 8) M(x.off, pname(x.g), 'Shifting Protovenom', 'Low', 'Took ' + x.took.toFixed(1) + ' s to clear Shifting Protovenom (' + pl(x.n, 'pulse') + ' of 233k).', 'Find a partner with a circle right away. Cross to the other group if yours has none.');
    const last = Math.max(t + 8, ...cr.map((x) => x.off ?? t + 14)), tm = cr.length ? cr[0].on + 1 : t + 5;
    // (the map: an orange circle on each player while they have it, a green flash where a pair cleared, a red one at
    // each eruption. The circle's size isn't published (a server-side area). Measured on 30 Mythic pulls: two circles
    // clear when their players are about 6 yards apart (482 clears), and a circle erupts on a player without one at
    // about the same distance (median 7 yards just before the blast), so touching is another player stepping inside a
    // circle about 6 yards around its player. (Protovenom Eruption's 10 yards is the blast, shown on its own.) It does
    // nothing for about the first 1.5 s: players already next to each other still clear at about 1.6 s.
    const pvRings = cr.map((x) => ({ guid: x.g, r: 6, ...mcol('Shifting Protovenom'), label: '', t0: x.on, dur: Math.max(0.5, (x.off ?? last) - x.on), fx: 'debuff', legend: 'Shifting Protovenom, about 6 yd (measured from when circles clear and erupt)' }))
      .concat(cr.filter((x) => x.mate && x.off != null).map((x) => ({ guid: x.g, r: 4, color: '#ffffff', fill: 'rgba(255,255,255,.22)', label: '', t0: x.off, dur: 1.2, cn: 'White flash', legend: 'cleared with a partner' })))
      // (an eruption's blast is 10 yd, its published radius, around the circle player it came from)
      .concat(er.flatMap((q) => { const c = q.who.filter((g) => circles.includes(g)); return (c.length ? c : q.who.slice(0, 1)).map((g) => ({ guid: g, r: 10, ...mcol('Protovenom Eruption', 0.2), label: 'Eruption', t0: q.t - 0.1, dur: 1.6, fx: 'burst', at: q.t, legend: 'Protovenom Eruption (10 yd blast)' })); }));
    const bad = er.some((q) => q.who.some((g) => exDeath(g, q))) || cr.some((x) => x.d), warn = cr.some((x) => x.took > 8 || !x.mate);
    return { title: 'Protovenom ' + (i + 1), t, bad, warn,
      sub: pl(circles.length, 'circle') + ', ' + (cr.filter((x) => x.mate).length) + ' cleared in pairs' + (cr.some((x) => x.took != null) ? ', slowest ' + Math.max(...cr.map((x) => x.took || 0)).toFixed(1) + ' s' : '') + (er.length ? ', ' + pl(er.length, 'eruption') : ''),
      rows: [[{ txt: 'Whole cast', sub: 'every circle, on one map', dim: true }, { t }, { txt: '' }, { txt: '' }, { txt: '' }, { txt: '' }, { map: { t: tm, hl: circles, hlLabel: 'had a circle', bad: [...new Set(er.flatMap((q) => q.who))], badLabel: 'in a Protovenom Eruption', title: 'Shifting Protovenom ' + (i + 1) + ' at ' + h.fmtT(tm), pts: h.snap(tm), rings: pvRings, frames: frames(tm - 2, last + 1) } }]].concat(cr.map((x) => x.row), plain) };
  });
  if (pvGroups.length) sections.push({ id: 'protovenom', title: 'Shifting Protovenom (Clear circles in pairs)', place: 'Shifting Protovenom (orange circles): cleared in pairs', spell: [ES.pv, 'Shifting Protovenom'],
    verdict: pvGroups.some((g) => g.bad) ? 'bad' : pvGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(pvGroups.length, 'cast') + '. It shows who cleared with whom and how fast, and any eruption.',
    cols: ['Player', 'Circle', 'Cleared with', 'Took', 'Pulses', 'Eruption', ''], groups: pvGroups, rows: [] });

  // ---- 3. Toxic Droplets (green): step on every droplet, one each, and dodge the venom flying back ----
  // Read from Mythic pulls: a droplet stepped on hits for 375k; one left alone erupts on the whole raid after 12 s
  // (Noxious Blast); each destroyed droplet's venom flies back to the boss 4 s later (Living Venom, 375k a hit).
  const dropT = castT(ES.dropCast), picks = dmgId(ES.drop), blasts = dmgId(ES.blast), lvHits = dmgId(ES.lv);
  const immune = ev.filter((e) => e.k === 'miss' && e.id === ES.drop);
  const dGroups = dropT.map((t, i) => {
    const end = Math.min(dropT[i + 1] != null ? dropT[i + 1] - 1 : dur + 1, t + 24);
    const pk = picks.filter((e) => e.t >= t && e.t < end), im = immune.filter((e) => e.t >= t && e.t < end), lv = lvHits.filter((e) => e.t >= t && e.t < end + 6);
    const bl = []; for (const e of blasts.filter((x) => x.t >= t && x.t < end + 2)) { const c = bl.find((q) => Math.abs(q.t - e.t) < 0.5); if (c) c.n++; else bl.push({ t: e.t, n: 1 }); }
    const blN = bl.filter((q) => q.n >= 5);
    const per = new Map(); const P = (g) => { let o = per.get(g); if (!o) per.set(g, o = { g, ts: [], imm: 0, lv: 0, lvT: null }); return o; };
    for (const e of pk) P(e.dst).ts.push(e.t); for (const e of im) { const o = P(e.dst); o.imm++; o.ts.push(e.t); } for (const e of lv) { const o = P(e.dst); o.lv++; if (o.lvT == null) o.lvT = e.t; }
    // the hard set: the one right before an intermission (immunities are the plan there)
    const nextI = inters.find((x) => x.t0 > t), hard = nextI && (dropT[i + 1] == null || dropT[i + 1] > nextI.t0);
    const rows = [...per.values()].sort((a, b) => (a.ts[0] ?? a.lvT) - (b.ts[0] ?? b.lvT)).map((o) => {
      // (two at once: two pickups within half a second that both did damage; an absorbed or immune one doesn't count)
      o.ts.sort((a, b) => a - b); const hurt = pk.filter((e) => e.dst === o.g && e.amt > 0).map((e) => e.t).sort((a, b) => a - b), dbl = hurt.some((x, k) => k && x - hurt[k - 1] <= 0.5);
      const d = diedNear(o.g, o.ts[0] ?? o.lvT, 6), tank = isTank(o.g);
      if (dbl && !tank) /* (Mechanics audit, Oct 24: top kills do this and win, so living through it is a note; a death stays red) */ M(hurt.find((x, k) => k && x - hurt[k - 1] <= 0.5), pname(o.g), 'Toxic Droplets', d ? 'High' : 'Low', 'Stepped on two Toxic Droplets at once (375k each)' + (d ? ' and died' : '') + '.', 'Pick up one droplet at a time unless you have an immunity. Tanks can take extras.');
      // (Living Venom hits are judged under Avoidable damage and flagged by the rule pack; here they're only shown, so
      // they aren't counted twice)
      return [{ p: pname(o.g), sub: tank ? 'tank' : '' }, { t: o.ts[0] ?? o.lvT }, { txt: String(o.ts.length) + (o.imm ? ' (' + o.imm + ' immune)' : ''), sub: dbl && !tank ? 'two at once' : '' }, o.lv ? { txt: pl(o.lv, 'hit'), sub: 'see Avoidable damage' } : { txt: '—', dim: true }, d ? { txt: 'died', bad: true } : { txt: '—', dim: true }, { txt: '' }];
    });
    // (an erupted droplet is flagged by the rule pack: Noxious Blast)
    const takers = [...per.values()].filter((o) => o.ts.length);
    // (the map: a green flash where each droplet was stepped on, blue for an immunity, red where the venom flying back hit)
    const dRings = pk.map((e) => ({ guid: e.dst, r: 1.8, ...mcol('Toxic Droplets', 0.3), label: '', t0: e.t, dur: 1.2, fx: 'burst', at: e.t, cn: 'Lime flash', legend: 'stepped on a droplet' }))
      .concat(im.map((e) => ({ guid: e.dst, r: 1.8, color: '#6aa8ff', fill: 'rgba(106,168,255,.3)', label: '', t0: e.t, dur: 1.2, cn: 'Blue flash', legend: 'stepped on one with an immunity' })))
      .concat(lv.map((e) => ({ guid: e.dst, r: 2.2, color: '#ff3b3b', fill: 'rgba(255,59,59,.25)', label: '', t0: e.t, dur: 1.2, cn: 'Red flash', legend: 'hit by Living Venom' })))
      // (map audit, Oct 19: the flashes last a second, so a still map showed no droplets at all: each pickup also leaves a small lime dot where it was, for the rest of the clip)
      .concat(pk.concat(im).map((e) => { const q = ((h.frames(e.t, e.t, 0.2)[0] || { pts: h.snap(e.t) }).pts || []).find((p) => p.guid === e.dst); return q ? { x: q.x, y: q.y, r: 1.6, ...mcol('Toxic Droplets', 0.45), label: '', t0: e.t, dur: 600, fx: 'puddle', cn: 'Lime dot', legend: 'where a droplet was picked up' } : null; }).filter(Boolean));
    return { title: 'Set ' + (i + 1) + (hard ? ' (before the intermission)' : ''), t, bad: blN.length > 0 || rows.some((x) => x[4].bad), warn: rows.some((x) => x[2].warn),
      sub: (pk.length + im.length) + ' stepped on by ' + pl(takers.length, 'player') + (im.length ? ' (' + im.length + ' with an immunity)' : '') + (blN.length ? ', ' + pl(blN.length, 'droplet') + ' erupted on the raid' : '') + (lv.length ? ', ' + pl(new Set(lv.map((e) => e.dst)).size, 'player') + ' hit by the venom flying back' : ''),
      rows: [[{ txt: 'Whole set', sub: 'everyone who stepped on one, on one map', dim: true }, { t }, { txt: String(pk.length + im.length), dim: true }, { txt: '' }, { txt: '' }, { map: { t: t + 6, good: takers.map((o) => o.g), goodLabel: 'stepped on a droplet', goodAt: takers.map((o) => [o.g, Math.min(...o.ts)]), pendLabel: 'hasn\'t stepped on one yet', bad: [...per.values()].filter((o) => o.lv).map((o) => o.g), badLabel: 'hit by Living Venom', title: 'Toxic Droplets set ' + (i + 1) + ' at ' + h.fmtT(t), pts: h.snap(t + 6), rings: dRings, frames: frames(t, t + 14) } }]]
        .concat(blN.map((q) => [{ txt: 'Erupted on the raid', bad: true }, { t: q.t }, { txt: '—', dim: true }, { txt: '—', dim: true }, { txt: q.n + ' players hit', bad: true }, { txt: '' }]), rows) };
  });
  if (dGroups.length) sections.push({ id: 'droplets', title: 'Toxic Droplets (Step on one each)', place: 'Toxic Droplets (puddles): stepped on, one each', spell: [ES.drop, 'Toxic Droplets'],
    verdict: dGroups.some((g) => g.bad) ? 'bad' : dGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(dGroups.length, 'set') + ' of droplets. It shows who stepped on them, anyone who took two at once, any that erupted on the raid, and hits from the venom flying back.',
    cols: ['Player', 'When', 'Droplets', 'Living Venom', 'Died', ''], groups: dGroups, rows: [] });

  // ---- 4. Venom Coagulation (green add): kill it, the second of each cycle before the intermission ----
  // (each add from its spawn cast, matched to the next Venom Coagulation death: Warcraft Logs reuses an add's ID once it
  // dies, so two adds can share one; its Contaminate is what hit the raid between its spawn and its death)
  const coagDie = ev.filter((e) => e.k === 'die' && e.name === 'Venom Coagulation').map((e) => e.t).sort((a, b) => a - b), usedD = new Set();
  const adds = castT(ES.coagCast).map((t) => { const d = coagDie.find((x) => x > t + 1 && !usedD.has(x)); if (d != null) usedD.add(d); return { t, died: d ?? null }; });
  const contam = ev.filter((e) => e.k === 'dmg' && e.id === ES.contam && h.isPlayer(e.dst));
  const aRows = adds.map((a, i) => {
    const nextI = inters.find((x) => x.t0 > a.t), lastC = (cycOf(a.t) === phases.length - 1 && inters.length >= 4) || (r.item.kill && dur - a.t < 60);
    const before = nextI && !adds.some((b) => b.t > a.t && b.t < nextI.t0); // (the cycle's last add: it spawns right before the intermission)
    const alive = before && (a.died == null || a.died > nextI.t0), dmg = contam.filter((e) => e.t >= a.t && e.t <= (a.died ?? dur) + 0.5 && !adds.some((b) => b !== a && b.t > a.t && e.t >= b.t && (b.died == null || e.t <= b.died))).reduce((s, e) => s + e.amt, 0);
    if (alive && !lastC) M(nextI.t0, 'Raid', 'Venom Coagulation', 'Medium', 'The Venom Coagulation was still alive when the intermission started. Its Contaminate pulses hit the raid during the pairing game.', 'Give the cycle\'s second Venom Coagulation priority so it dies before Vitriolic Stasis. Ranged on the red side can help.');
    return [{ txt: 'Add ' + (i + 1) + (before ? ' (before the intermission)' : '') }, { t: a.t }, a.died != null ? { txt: 'killed in ' + (a.died - a.t).toFixed(0) + ' s' } : { txt: 'not killed', warn: !lastC, dim: lastC }, { txt: fmtM(dmg) + ' on the raid' },
      alive ? (lastC ? { txt: 'alive, not judged (enrage near)', dim: true } : { txt: 'still alive at the intermission', bad: true }) : before ? { txt: 'dead in time' } : { txt: '', dim: true }];
  });
  if (aRows.length) sections.push({ id: 'coag', title: 'Venom Coagulation (Kill before the intermission)', place: 'Venom Coagulation (add): killed in time', spell: [ES.coagCast, 'Venom Coagulation'],
    verdict: aRows.some((x) => x[4].bad) ? 'bad' : aRows.some((x) => x[2].warn) ? 'warn' : 'good',
    summary: pl(adds.length, 'add') + '. It shows each one\'s time to kill and the raid damage it did. The one before each intermission has to be dead before it.',
    cols: ['Add', 'Spawned', 'Killed', 'Contaminate', 'At the intermission'], rows: aRows });

  // ---- 5. Unstable Miasma (red): a soak, at least 8 players on Mythic ----
  const miT = castT(ES.miCast), miHits = dmgId(ES.miHit), miTg = auraId(ES.miTarget, 'apply').filter((e) => h.isPlayer(e.dst));
  const need = mythic ? 8 : 0;
  const mRows = miT.map((t, i) => {
    const hit = miHits.filter((e) => e.t >= t && e.t <= t + 12), t1 = hit.length ? hit[0].t : null, soak = [...new Set(hit.filter((e) => e.t <= (t1 ?? 0) + 1).map((e) => e.dst))];
    const tg = (miTg.find((e) => e.t >= t - 1 && e.t <= t + 8) || {}).dst, died = soak.map((g) => diedNear(g, t1 ?? t, 3)).filter(Boolean);
    // (one short is amber, two or more red (scan, Oct 19): a top Mythic kill soaked every other one with 7 and nobody died, so 7
    // works, just with more stacks each; the guides' plan is 8)
    // (Oct 22, boss coverage: 4 of the 20 fastest Mythic kills soaked some with 6 and nobody died, and the last one before a kill is
    // often left. Now 6 or 7 is a slip, under 6 the mistake, and a soak in the last 20 s of a kill isn't judged)
    const endK = r.item.kill && (t1 ?? t) >= dur - 20;
    /* (your soak rule (Oct 24): 1 or 2 missing is fine, 3 missing is yellow, 4 or more red; 7 of 8 top kills had a soak one or two short) */
    const few = need && soak.length <= need - 3 && !endK, veryFew = few && soak.length <= need - 4;
    if (few) M(t1 ?? t, 'Raid', 'Unstable Miasma', veryFew ? 'High' : 'Medium', 'Unstable Miasma ' + (i + 1) + ' had ' + pl(soak.length, 'soaker') + ', but Mythic needs at least ' + need + ', so each soaker got more stacks and a bigger pool.', 'Get at least eight players into every Unstable Miasma, far back in a corner.');
    for (const d of died) M(d.t, d.player, 'Unstable Miasma', 'High', 'Died in the Unstable Miasma soak.', 'Soak at full health, with a defensive if you\'re low. More soakers means less damage each.');
    return [{ txt: 'Soak ' + (i + 1) }, { t: t1 ?? t }, tg ? { p: pname(tg) } : { txt: '—', dim: true }, { txt: String(soak.length) + (need ? ' (' + need + ' needed)' : ''), bad: !!veryFew, warn: !!few && !veryFew, dim: endK, sub: endK ? 'the end of the kill' + (soak.length ? ': ' + soak.map(pname).join(', ') : '') : soak.map(pname).join(', ') }, died.length ? { txt: died.map((d) => d.player).join(', ') + ' died', bad: true } : { txt: '—', dim: true },
      // (the soak: 7.5 yd around the marked player, its published radius, shown from 3 s before it lands)
      t1 != null ? { map: { t: t1, good: soak, goodLabel: 'soaked', goodAt: soak.map((g) => [g, t1]), pendLabel: 'in the soak (before it lands)', hl: tg ? [tg] : [], hlLabel: 'marked', title: 'Unstable Miasma ' + (i + 1) + ' at ' + h.fmtT(t1), pts: h.snap(t1), frames: frames(t1 - 3, t1 + 1.5),
        rings: tg ? [{ guid: tg, r: 7.5, ...mcol('Unstable Miasma'), label: '7.5 yd', t0: t1 - 3.2, dur: 3.6, fx: 'soak', at: t1, legend: 'Unstable Miasma soak (7.5 yd)' }] : [] } } : { txt: '' }];
  });
  if (mRows.length) sections.push({ id: 'miasma', title: 'Unstable Miasma (Soak with 8)', place: 'Unstable Miasma (big soak): enough soakers', spell: [ES.miCast, 'Unstable Miasma'],
    verdict: mRows.some((x) => x[3].bad || x[4].bad) ? 'bad' : 'good',
    summary: pl(miT.length, 'soak') + '. ' + (need ? 'At least ' + need + ' soakers each on Mythic.' : 'Soakers per soak.'),
    cols: ['Soak', 'When', 'Marked', 'Soakers', 'Died', ''], rows: mRows });

  // ---- 6. Blighted Blood (red): dispel it quickly; one that runs out drops a pool ----
  const bbA = auraId(ES.bb).filter((e) => h.isPlayer(e.dst)), disp = ev.filter((e) => e.k === 'dispel' && String(e.spell).toLowerCase() === 'blighted blood');
  const bbOn = bbA.filter((e) => e.op === 'apply'), bbSets = [];
  for (const e of bbOn) { const s = bbSets[bbSets.length - 1]; if (s && e.t - s.t <= 3) s.l.push(e); else bbSets.push({ t: e.t, l: [e] }); }
  const bbGroups = bbSets.map((s, i) => {
    const rows = s.l.map((e) => {
      const off = bbA.find((x) => x.op === 'remove' && x.dst === e.dst && x.t > e.t), dp = off && disp.find((x) => x.dst === e.dst && Math.abs(x.t - off.t) < 0.3), d = diedNear(e.dst, e.t, (off ? off.t - e.t : 20) + 0.5);
      const on = off ? off.t - e.t : null, slow = dp && on > 5, ran = off && !dp && !d;
      if (ran) M(off.t, pname(e.dst), 'Blighted Blood', 'Low', 'Blighted Blood wasn\'t dispelled and ran out, dropping a pool.', 'Healers dispel Blighted Blood as soon as it lands. If it does run out, drop the pool at the edge.');
      return [{ p: pname(e.dst) }, { t: e.t }, /* (Mechanics audit, Oct 24: top kills do this and win, so living through it is a note; a death stays red) */ on != null ? { txt: on.toFixed(1) + ' s', dim: !slow } : { txt: '—', dim: true }, dp ? { p: dp.src } : { txt: d ? 'died with it' : ran ? 'not dispelled, left a pool' : '—', bad: !!d, dim: !d }];
    });
    return { title: 'Blighted Blood ' + (i + 1), t: s.t, bad: rows.some((x) => x[3].bad), warn: rows.some((x) => x[2].warn || x[3].warn), sub: pl(s.l.length, 'player') + ', ' + rows.filter((x) => x[3].p).length + ' dispelled', rows };
  });
  if (bbGroups.length) sections.push({ id: 'blighted', title: 'Blighted Blood (Dispel fast)', place: 'Blighted Blood (dispel): cleared quickly', spell: [ES.bb, 'Blighted Blood'],
    verdict: bbGroups.some((g) => g.bad) ? 'bad' : bbGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(bbOn.length, 'Blighted Blood') + '. It shows how long each stayed on and who dispelled it.', cols: ['Player', 'When', 'On for', 'Dispelled by'], groups: bbGroups, rows: [] });

  // ---- 7. Blood pools: where they landed, cycle by cycle (a pool lands when Blood Venom, a Blighted Blood that ran out
  // or Bloodvenom Injection ends on someone); for keeping the floor clean, not judged ----
  const posOf = (g, t) => (h.snap(t).find((q) => q.guid === g) || null);
  const poolSrc = auraId(ES.venom, 'remove').filter((e) => h.isPlayer(e.dst)).map((e) => ({ t: e.t, g: e.dst, src: 'Blood Venom' }))
    .concat(auraId(ES.inj, 'remove').filter((e) => h.isPlayer(e.dst)).map((e) => ({ t: e.t, g: e.dst, src: 'Bloodvenom Injection' })))
    .filter((p) => !r.deaths.some((d) => d.guid === p.g && Math.abs(d.t - p.t) < 0.3)).sort((a, b) => a.t - b.t);
  const pools = []; for (const p of poolSrc) { const q = posOf(p.g, p.t); if (q) pools.push({ ...p, x: q.x, y: q.y }); }
  const poolGroups = phases.map((ph, i) => {
    const mine = pools.filter((p) => p.t >= ph.start && p.t < ph.end); if (!mine.length) return null;
    const upTo = pools.filter((p) => p.t < ph.end), tm = Math.min(ph.end, dur) - 0.5;
    return { title: 'Cycle ' + (i + 1), t: ph.start + 0.01, sub: pl(mine.length, 'pool') + ' this cycle, ' + upTo.length + ' on the floor in all',
      rows: [[{ txt: 'The floor at the end of the cycle', sub: 'every pool so far', dim: true }, { t: tm }, { txt: '' }, { map: { t: tm, title: 'Blood pools by the end of cycle ' + (i + 1), pts: h.snap(tm), rings: upTo.map((p) => ({ x: p.x, y: p.y, fx: 'puddle', t0: p.t, r: p.src === 'Bloodvenom Injection' ? 7 : 4, color: p.t >= ph.start ? '#e5534b' : '#8a3a36', fill: 'rgba(229,83,75,.18)', label: '' })) } }]]
        .concat(mine.map((p) => [{ p: pname(p.g) }, { t: p.t }, { txt: p.src, dim: true }, { txt: '' }])) };
  }).filter(Boolean);
  // (info: shown, not judged, so it never says "clean")
  if (poolGroups.length) sections.push({ id: 'pools', title: 'Blood pools (Keep the floor clear)', place: 'Blood pools: where they landed', spell: [ES.venom, 'Blood Venom'], verdict: 'good', info: 'floor maps, not judged',
    summary: pl(pools.length, 'pool') + ' dropped. One floor map per cycle, to see how much of the room is still free.', cols: ['Player', 'When', 'From', ''], groups: poolGroups, rows: [] });

  // ---- 8. Sides: each player in range of one boss (Mark of Acid or Mark of Blood), and the boss health balance ----
  // Each boss stacks its Mark on everyone within 40 yd. A player gaining stacks of the boss their group isn't on was in
  // range of both. A swap at the intermission is fine: stacks are only counted from 8 s after it ends.
  const markEv = ev.filter((e) => e.k === 'aura' && (e.id === ES.acid || e.id === ES.blood) && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const lastSt = new Map(), gain = new Map(); // (per player per cycle: stacks gained of each Mark)
  for (const e of markEv) {
    const k = e.dst + '|' + e.id, prev = lastSt.get(k) || 0, now = e.op === 'remove' ? 0 : e.op === 'apply' ? Math.max(1, e.stacks || 1) : e.stacks || 0; lastSt.set(k, now);
    if (now <= prev || inInter(e.t) || inters.some((x) => e.t > x.t1 && e.t < x.t1 + 8)) continue;
    const c = cycOf(e.t), gk = e.dst + '|' + c; let o = gain.get(gk); if (!o) gain.set(gk, o = { g: e.dst, c, acid: 0, blood: 0 });
    o[e.id === ES.acid ? 'acid' : 'blood'] += now - prev;
  }
  const _sides = phases.map(() => new Map()); // (each player's side per cycle, for the NSRT note's Blood/Breath split)
  const sGroups = phases.map((ph, c) => {
    const list = [...gain.values()].filter((o) => o.c === c); if (!list.length) return null;
    const rows = [];
    for (const o of list) { const main = o.acid >= o.blood ? 'acid' : 'blood', off = main === 'acid' ? o.blood : o.acid; _sides[c].set(pname(o.g), main === 'acid' ? 'Breath' : 'Blood');
      if (off >= 5 && !isTank(o.g)) { rows.push([{ p: pname(o.g) }, { txt: main === 'acid' ? 'Breath (green)' : 'Blood (red)' }, /* (Mechanics audit, Oct 24: top kills had 5 to 10; 20 of both kills, so 12+ is yellow and 16+ red) */ { txt: off + ' stacks', bad: off >= 16, warn: off >= 12 && off < 16, dim: off < 12 }]);
        M(ph.start + 1, pname(o.g), 'Mark of ' + (main === 'acid' ? 'Blood' : 'Acid'), off >= 12 ? 'Medium' : 'Low', 'Picked up ' + off + ' stacks of the other boss\'s Mark in cycle ' + (c + 1) + ', by standing in range of both bosses.', 'Stay within 40 yards of your own boss only. To hit both, cleave from the edge of range.'); } }
    const nB = [..._sides[c].values()].filter((v) => v === 'Breath').length;
    return { title: 'Cycle ' + (c + 1), t: ph.start + 0.02, bad: rows.some((x) => x[2].bad), warn: rows.some((x) => x[2].warn), sub: nB + ' on the Breath (green), ' + (_sides[c].size - nB) + ' on the Blood (red)' + (rows.length ? ', ' + pl(rows.length, 'player') + ' in range of both' : ''),
      rows: rows.length ? rows : [[{ txt: 'Nobody in range of both bosses', dim: true }, { txt: '' }, { txt: '' }]] };
  }).filter(Boolean);
  if (sGroups.length) sections.push({ id: 'marks', title: 'Marks (Stay on your boss\'s side)', place: 'Marks (stacks): in range of one boss only', spell: [ES.acid, 'Mark of Acid'],
    verdict: sGroups.some((g) => g.bad) ? 'bad' : sGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: 'It shows who was on which side each cycle, and anyone who picked up 5 or more stacks of the other boss\'s Mark (12 or more is red).', cols: ['Player', 'Their side', 'Other boss\'s Mark'], groups: sGroups, rows: [] });

  // boss health at each intermission (Vitriolic Stasis heals the weaker boss up to the other), and the 40-yard rule
  const hpAt = (g, t) => { const u = g && r.hpUnits && r.hpUnits.get(g); if (!u) return null; let v = null; for (const [tt, f] of u.samples) { if (tt > t) break; v = f; } return v; };
  const heals = ev.filter((e) => e.k === 'heal' && String(e.spell).toLowerCase() === 'vitriolic stasis' && !h.isPlayer(e.dst));
  const posU = (g, t) => { const u = g && r.positions.get(g); if (!u) return null; let b = null; for (const p of u.pts) { if (p[0] > t + 1) break; if (p[0] >= t - 3) b = p; } return b; };
  const balRows = inters.map((x) => {
    const a = hpAt(gBreath, x.t0 - 0.5), b = hpAt(gBlood, x.t0 - 0.5), gap = a != null && b != null ? Math.abs(a - b) * 100 : null, healed = heals.filter((e) => e.t >= x.t0 && e.t <= x.t1).reduce((s, e) => s + e.amt, 0);
    const big = gap != null && gap >= 5;
    if (big) M(x.t0, 'Raid', 'Vitriolic Stasis', 'Low', 'The bosses were ' + gap.toFixed(0) + ' points apart at intermission ' + (x.i + 1) + ': Vitriolic Stasis healed the lower one back up' + (healed ? ' (' + fmtM(healed) + ')' : '') + '.', 'Even out the bosses\' health before the intermission by moving players between sides, not by stopping damage.');
    return [{ txt: 'Intermission ' + (x.i + 1) }, { t: x.t0 }, { txt: a != null ? Math.round(a * 100) + '%' : '—' }, { txt: b != null ? Math.round(b * 100) + '%' : '—' }, gap != null ? { txt: gap.toFixed(1) + ' points', warn: big } : { txt: '—', dim: true }, { txt: healed ? fmtM(healed) + ' healed back' : '—', dim: !healed }];
  });
  const near = []; // (bosses within 40 yd of each other outside the intermissions: they take 99% less damage)
  // (from 10 s into the pull, while the tanks take them apart, until a boss dies; the swap after each intermission is
  // skipped; a run of 3+ seconds counts)
  const bDie = ev.filter((e) => e.k === 'die' && (e.guid === gBreath || e.guid === gBlood)).map((e) => e.t), tEnd = Math.min(dur, ...bDie);
  let run = [];
  for (let t = 10; t < tEnd; t += 1) { const skip = inInter(t) || inters.some((x) => t > x.t1 && t < x.t1 + 10); const p = skip ? null : posU(gBreath, t), q = skip ? null : posU(gBlood, t);
    if (p && q && Math.hypot(p[1] - q[1], p[2] - q[2]) < 40) run.push(t); else { if (run.length >= 3) near.push(...run); run = []; } }
  if (run.length >= 3) near.push(...run);
  // (the reason the panel is red gets its own row, not only a line in the summary)
  if (near.length >= 3) balRows.push([{ txt: 'Bosses close together', bad: true }, { t: near[0] }, { txt: 'within 40 yards', sub: 'for about ' + near.length + ' s in all', bad: true }, { txt: '' }, { txt: '99% less damage taken', bad: true }, { txt: '' }]);
  if (near.length >= 3) M(near[0], 'Raid', 'Entombed Sentinels', 'Medium', 'The bosses were within 40 yards of each other for about ' + near.length + ' seconds outside the intermissions (99% less damage taken).', 'Keep the bosses on opposite sides of the room, 40+ yards apart.');
  if (balRows.length || near.length) sections.push({ id: 'balance', title: 'Boss balance (Keep them even)', place: 'Boss balance: even health, 40 yards apart', spell: [ES.stasisHeal, 'Vitriolic Stasis'],
    verdict: near.length >= 3 ? 'bad' : balRows.some((x) => x[4].warn) ? 'warn' : 'good',
    summary: 'It shows each boss\'s health going into every intermission (Vitriolic Stasis heals the lower one up to the other) and how much it healed back.' + (near.length ? ' The bosses were within 40 yards for about ' + near.length + ' s outside the intermissions.' : ' The bosses stayed 40+ yards apart.'),
    cols: ['Intermission', 'When', 'Breath (green)', 'Blood (red)', 'Gap', 'Healed back'], rows: balRows });

  // ---- 9. Tanks: one on each boss, swapping at every intermission ----
  const slams = dmgId(ES.slam), inj = auraId(ES.inj, 'apply').filter((e) => h.isPlayer(e.dst));
  const most = (l) => { const m = new Map(); for (const e of l) m.set(e.dst, (m.get(e.dst) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1])[0]; };
  let prevT = null;
  const tRows = phases.map((ph, c) => {
    const sl = most(slams.filter((e) => e.t >= ph.start && e.t < ph.end)), ij = most(inj.filter((e) => e.t >= ph.start && e.t < ph.end));
    const g = sl ? sl[0] : null, b = ij ? ij[0] : null, noSwap = c > 0 && prevT && ((g && g === prevT.g) || (b && b === prevT.b));
    if (noSwap) M(ph.start, 'Raid', 'Entombed Sentinels', 'Medium', 'The tanks didn\'t swap bosses after intermission ' + c + '.', 'Tanks trade bosses at every intermission so their stacks drop.');
    prevT = { g, b };
    return [{ txt: 'Cycle ' + (c + 1) }, { t: ph.start + 0.03 }, g ? { p: pname(g), sub: pl(sl[1], 'Empowering Slam') } : { txt: '—', dim: true }, b ? { p: pname(b), sub: pl(ij[1], 'Bloodvenom Injection') } : { txt: '—', dim: true }, c === 0 ? { txt: '—', dim: true } : noSwap ? { txt: 'no swap', bad: true } : { txt: 'swapped' }];
  });
  if (tRows.some((x) => x[2].p || x[3].p)) sections.push({ id: 'tanks', title: 'Tanks (Swap at each intermission)', place: 'Tanks: swapping at every intermission', spell: [ES.slam, 'Empowering Slam'],
    verdict: tRows.some((x) => x[4].bad) ? 'bad' : 'good', summary: 'Who tanked each boss each cycle. They should trade at every intermission.', cols: ['Cycle', 'When', 'Breath (green) tank', 'Blood (red) tank', 'After the intermission'], rows: tRows });

  // ---- 10. avoidable damage ----
  const av = avoidPanel(ev, r, h, [
    { n: ['living venom'], label: 'Living Venom', harm: 'Medium', why: 'a droplet\'s venom flying back to the Breath of Ula\'tek (375k a hit)', warnAt: 1, badAt: 3 },
    { n: ['blood venom'], label: 'Blood pools', harm: 'Medium', why: 'standing in a blood pool (166k a second)', skip: (e) => e.id !== ES.pool },
  ]);
  if (av) sections.push(av);

  const diag = [['Helical Toxins', ES.helix], ['Cultivated Burst', ES.cb], ['Shifting Protovenom', ES.pv], ['Protovenom Eruption', ES.erupt], ['Toxic Droplets', ES.drop], ['Noxious Blast', ES.blast], ['Living Venom', ES.lv], ['Venom Coagulation', ES.coagCast],
    ['Unstable Miasma', ES.miHit], ['Blighted Blood', ES.bb], ['Blood Venom', ES.venom], ['Clinging Murk', 1303097], ['Mark of Acid', ES.acid], ['Mark of Blood', ES.blood], ['Vitriolic Stasis', ES.stasis[0]], ['Empowering Slam', ES.slam], ['Bloodvenom Injection', ES.inj]].map(([name, id]) => {
    const c = { cast: 0, dmg: 0, aura: 0, other: 0 };
    for (const x of ev) if (x.id === id) { if (x.k === 'cast' || x.k === 'start') c.cast++; else if (x.k === 'dmg') c.dmg++; else if (x.k === 'aura') c.aura++; else c.other++; }
    return { name, id, ...c, total: c.cast + c.dmg + c.aura + c.other };
  });
  // (the Mechanics tab groups these by boss, not by cycle: each section keeps every cycle's sets in one place; the
  // cycles stay for the note's side check and the timings)
  // (every boss mechanic in a group of its own kind first; deaths and avoidable damage last)
  const sectionGroups = [
    { name: 'Poison side', sub: "Breath of Ula'tek (green)", ids: ['droplets', 'coag'] },
    { name: 'Blood side', sub: "Blood of Ula'tek (red)", ids: ['miasma', 'blighted', 'pools'] },
    { name: 'Intermission', sub: 'Vitriolic Stasis: the pairing game', ids: ['helix'] },
    // (Shifting Protovenom is cast by Vashnik, in the room on Mythic: read from the logs; it sits with the rest here)
    { name: 'Whole fight', sub: 'Shifting Protovenom, the Marks, boss balance, tanks', ids: ['protovenom', 'marks', 'balance', 'tanks'] },
    { name: 'Deaths and avoidable damage', sub: '', ids: ['deaths', 'avoid', 'kicks'], rest: true },
  ];
  { const pc = paceCard(ev, r, h, mistakes, "Entombed Sentinels", { inters }); if (pc) sections.push(pc); } /* (Pace, Oct 22: boss coverage) */
  return { _sides, _cycles: phases, diag, title: r.item.diff + ' audit: Entombed Sentinels', reached: phases[phases.length - 1].name, phases: [], sectionGroups, marks, sections, mistakes,
    legend: 'Grouped by mechanic: each boss\'s side, the intermission, the rest (Shifting Protovenom, the Marks, boss balance, tanks), then deaths and avoidable damage.', note: '' };
}

// Sszorak: one boss on a loop. Apex Predator (a five-cast tank combo in random order: two Ravage, two Mutilate, one
// Tempest), then Venomous Surge (two players each drop a Viscous Cyst) and Raging Crosswinds; twice, then Dig In at 100
// energy, the intermission: three winds blow across the platform and the raid pops a cyst against each. On Mythic,
// Serpent's Fury: 14 players pop a marked player's circle to reset his rage before it reaches 100 (the enrage). The plan
// is from the Mythic guides; the spell IDs, timings and how each shows in the log were read from Mythic pulls.
function buildSszorak(ev, r, h) {
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const dur = r.duration, mythic = r.item.diff === 'Mythic', pname = (g) => h.name(g), T = h.fmtT;
  const fmtM = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1e3) + 'k');
  const mistakes = [], sections = [];
  const M = (t, player, mech, severity, detail, fix, map) => mistakes.push({ t, player, mechanic: mech, id: 0, severity, detail, fix, ...(map ? { map } : {}) });
  const has = (e, ids) => [].concat(ids).includes(e.id);
  const dmgId = (ids) => ev.filter((e) => e.k === 'dmg' && has(e, ids) && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const AUR = new Map(), aur = (id) => { const k = String(id); if (!AUR.has(k)) AUR.set(k, ev.filter((e) => e.k === 'aura' && has(e, id)).sort((a, b) => a.t - b.t)); return AUR.get(k); };
  // (a boss cast's success times; the two IDs some casts log under are merged)
  const castOk = (ids) => { const l = ev.filter((e) => e.k === 'cast' && has(e, ids)).map((e) => e.t).sort((a, b) => a - b); return l.filter((t, i) => !i || t - l[i - 1] > 1); };
  const diedNear = (g, t, w) => r.deaths.find((d) => d.guid === g && d.t >= t - 0.2 && d.t <= t + w);
  const deadBy = (g, t) => r.deaths.some((d) => d.guid === g && d.t <= t);
  const frames = (t0, t1) => h.frames(Math.max(0, t0), Math.min(dur, t1), 0.25);
  const isTank = (g) => h.role(g) === 'tank';
  const players = [...r.players.values()].map((p) => p.guid).filter((g) => h.isPlayer(g));
  // (everyone's position at t in between log samples, not the last one: Warcraft Logs positions can be a couple of
  // seconds old, which matters for a player running to a cyst)
  const posPts = (t) => (h.frames(t, t, 0.2)[0] || { pts: h.snap(t) }).pts;
  // (an aura still on a player at t: applied, or a stack added, within len seconds and not removed since)
  const upAt = (id, g, t, len) => { let on = null; for (const e of aur(id)) { if (e.dst !== g || e.t >= t - 0.05) continue; if (e.op === 'apply' || e.op === 'dose') on = e.t; else if (e.op === 'remove') on = null; } return on != null && t - on < len; };
  const marks = [];

  // ---- the loop: Apex Predator sets (the tank combo's five casts) and the intermissions (Dig In) ----
  const apexC = ev.filter((e) => e.k === 'cast' && has(e, [SZ.ravageCast, SZ.mutCast, SZ.tempestCast])).map((e) => e.t).sort((a, b) => a - b);
  const sets = []; for (const t of apexC) { const s = sets[sets.length - 1]; if (s && t - s.t1 < 15) s.t1 = t; else sets.push({ i: sets.length, t0: t, t1: t }); }
  const digT = castOk(SZ.digIn), digR = aur(SZ.digIn).filter((e) => e.op === 'remove' && !h.isPlayer(e.dst));
  const inters = digT.map((t, i) => ({ i, t0: t, t1: (digR.find((e) => e.t > t + 1) || { t: Math.min(dur, t + 25) }).t }));
  for (const x of inters) marks.push({ t: x.t0, label: 'Dig In', id: SZ.digIn, kind: 'phase' });
  // (each set's place in its cycle: the first after the pull or an intermission, or the second, just before one)
  const cycOf = (t) => inters.filter((x) => x.t0 < t).length;
  sets.forEach((s) => { s.cyc = cycOf(s.t0); s.k = sets.filter((q) => q.i < s.i && cycOf(q.t0) === s.cyc).length; });
  const setOf = (t) => [...sets].reverse().find((s) => t >= s.t0 - 1);
  const setTitle = (s) => 'Set ' + (s.i + 1) + (s.k === 1 ? ' (before the intermission)' : s.cyc ? ' (after intermission ' + s.cyc + ')' : ' (the pull)');

  // ---- 1. Ravage: the tank frontal; the tanks taunt between the two of each combo ----
  const ravHits = dmgId(SZ.ravage);
  const ravRows = castOk(SZ.ravageCast).map((t) => {
    const who = [...new Set(ravHits.filter((e) => e.t >= t - 0.3 && e.t <= t + 1.2).map((e) => e.dst))];
    const tanks = who.filter(isTank), others = who.filter((g) => !isTank(g)), dbl = who.filter((g) => upAt(SZ.ravageDeb, g, t, 25)), died = who.map((g) => diedNear(g, t, 3)).filter(Boolean);
    for (const g of others) M(t, pname(g), 'Ravage', 'High', 'Hit by Ravage, the tank frontal.', 'Ravage is aimed at the tank: stay out of its cone. Tanks take it at the edge, away from the raid.');
    for (const g of dbl) M(t, pname(g), 'Ravage', 'High', 'Took a second Ravage with the first one\'s debuff still up' + (died.some((d) => d.guid === g) ? ', and died.' : '.'), 'Taunt between the two Ravages of every tank combo, so each tank takes one.');
    return { t, row: [{ txt: 'Ravage' }, { t }, tanks.length ? { ps: tanks.map(pname) } : { txt: 'nobody', warn: true }, dbl.length ? { ps: dbl.map(pname), bad: true } : { txt: '—', dim: true },
      others.length ? { ps: others.map(pname), bad: true } : { txt: '—', dim: true }, died.length ? { txt: died.map((d) => d.player).join(', ') + ' died', bad: true } : { txt: '—', dim: true }] };
  });
  const ravGroups = sets.map((s) => { const rows = ravRows.filter((x) => setOf(x.t) === s).map((x) => x.row); return { title: setTitle(s), t: s.t0, bad: rows.some((x) => x.some((c) => c.bad)), warn: rows.some((x) => x.some((c) => c.warn)), sub: pl(rows.length, 'Ravage'), rows }; }).filter((g) => g.rows.length);
  if (ravGroups.length) sections.push({ id: 'ravage', title: 'Ravage (Tanks swap)', place: 'Ravage (frontal): one per tank', spell: [SZ.ravageCast, 'Ravage'], verdict: ravGroups.some((g) => g.bad) ? 'bad' : ravGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(ravRows.length, 'Ravage') + '. It shows who took each one, any tank taking a second with the debuff up, and anyone else in the cone.', cols: ['Cast', 'When', 'Tank', 'Debuff up', 'Others hit', 'Died'], groups: ravGroups, rows: [] });

  // ---- 2. Mutilate: the soak frontal, split by everyone in it; two groups alternate because of Mutilated Gash ----
  // (_sz: what the NSRT note check needs: who soaked each Mutilate, when each Fury popped, who popped each cyst)
  const _sz = { muts: [], furies: [], pops: [] };
  const mutHits = dmgId(SZ.mut);
  const mutRows = castOk(SZ.mutCast).map((t) => {
    const hits = mutHits.filter((e) => e.t >= t - 0.3 && e.t <= t + 1.2), who = [...new Set(hits.map((e) => e.dst))];
    const ms = setOf(t); _sz.muts.push({ t, set: ms ? ms.i + 1 : null, who: who.map(pname) });
    const dd = who.filter((g) => upAt(SZ.gash, g, t, 22.5)), died = who.map((g) => diedNear(g, t, 4)).filter(Boolean), few = who.length > 0 && who.length < 5;
    const each = hits.length ? hits.reduce((s, e) => s + (e.raw || e.amt), 0) / hits.length : 0;
    if (few) M(t, 'Raid', 'Mutilate', 'High', 'Mutilate was soaked by only ' + pl(who.length, 'player') + ' (at least 5 are needed).', 'Bring the whole group into every Mutilate.');
    else if (!who.length) M(t, 'Raid', 'Mutilate', 'High', 'Nobody soaked Mutilate.', 'Bring the whole group into every Mutilate.');
    for (const g of dd) M(t, pname(g), 'Mutilate', 'High', 'Soaked Mutilate with Mutilated Gash still on (500% more damage)' + (died.some((d) => d.guid === g) ? ', and died.' : '.'), 'Soak only your group\'s Mutilate. The other group takes the next one.');
    return { t, row: [{ txt: 'Mutilate' }, { t }, { txt: who.length ? pl(who.length, 'soaker') : 'nobody', bad: few || !who.length, sub: who.map(pname).join(', ') }, dd.length ? { ps: dd.map(pname), bad: true } : { txt: '—', dim: true },
      died.length ? { txt: died.map((d) => d.player).join(', ') + ' died', bad: true } : { txt: '—', dim: true }, each ? { txt: fmtM(each) + ' on each player', dim: true } : { txt: '—', dim: true }] };
  });
  const mutGroups = sets.map((s) => { const rows = mutRows.filter((x) => setOf(x.t) === s).map((x) => x.row); return { title: setTitle(s), t: s.t0, bad: rows.some((x) => x.some((c) => c.bad)), warn: false, sub: pl(rows.length, 'Mutilate'), rows }; }).filter((g) => g.rows.length);
  if (mutGroups.length) sections.push({ id: 'mutilate', title: 'Mutilate (Soak in two groups)', place: 'Mutilate (soak frontal): two groups, alternating', spell: [SZ.mutCast, 'Mutilate'], verdict: mutGroups.some((g) => g.bad) ? 'bad' : 'good',
    summary: pl(mutRows.length, 'Mutilate') + '. It shows who soaked each one, and anyone soaking with Mutilated Gash still on from the last one.', cols: ['Cast', 'When', 'Soakers', 'With Gash', 'Died', 'Hit each'], groups: mutGroups, rows: [] });

  // ---- 3. Tempest: roaming tornadoes, once per combo; each touch is a big hit and a stack of its damage over time ----
  // (read from Mythic pulls: the tornadoes come out as the cast starts and roam for about 30 seconds, so a Tempest's
  // touches run from its cast to the next one)
  const tmpA = aur(SZ.tempest).filter((e) => (e.op === 'apply' || e.op === 'dose') && h.isPlayer(e.dst));
  const tmpOk = castOk(SZ.tempestCast), tmpSt = tmpOk.map((t) => { const s = ev.filter((e) => e.k === 'start' && e.id === SZ.tempestCast && e.t <= t && e.t >= t - 6).pop(); return s ? s.t : t - 3.5; });
  const tmpGroups = tmpSt.map((t, i) => {
    const s = setOf(t + 0.5), tEnd = Math.min(dur, tmpSt[i + 1] != null ? tmpSt[i + 1] - 0.1 : t + 45, t + 45), touch = tmpA.filter((e) => e.t >= t - 0.2 && e.t <= tEnd), by = new Map();
    // (one pass through a tornado can log two or three stacks a moment apart: those within 2 s are one touch)
    for (const e of touch) { let o = by.get(e.dst); if (!o) by.set(e.dst, o = { g: e.dst, ts: [], last: -9 }); if (e.t - o.last > 2) o.ts.push(e.t); o.last = e.t; }
    const rows = [...by.values()].sort((a, b) => a.ts[0] - b.ts[0]).map((o) => {
      const d = r.deaths.find((x) => x.guid === o.g && x.t >= o.ts[0] && x.t <= o.ts[o.ts.length - 1] + 8 && /tempest/i.test(x.ability || ''));
      const tk = isTank(o.g) && !d; return [{ p: pname(o.g), sub: isTank(o.g) ? 'tank' : '' }, { t: o.ts[0] }, /* (Mechanics audit, Oct 24: top kills do this and win, so living through it is a note; a death stays red) */ { txt: pl(o.ts.length, 'touch').replace('touchs', 'touches'), dim: true, sub: '' }, d ? { txt: 'died', bad: true } : { txt: '—', dim: true }, { txt: '' }];
    });
    const hit = [...by.values()];
    const whole = [{ txt: 'Whole Tempest', sub: 'every touch, on one map', dim: true }, { t }, { txt: String(hit.reduce((n, o) => n + o.ts.length, 0)), dim: true }, { txt: '' },
      { txt: '' }];
    return { title: s ? setTitle(s) : 'Tempest ' + (i + 1), t, bad: rows.some((x) => x[2].bad || x[3].bad), warn: rows.some((x) => x[2].warn), sub: hit.length ? pl(hit.length, 'player') + ' touched' : 'nobody touched', rows: rows.length ? [whole].concat(rows) : [] };
  });
  if (tmpGroups.length) sections.push({ id: 'tempest', title: 'Tempest (Dodge the tornadoes)', place: 'Tempest (tornadoes): dodged', spell: [SZ.tempestCast, 'Tempest'], verdict: tmpGroups.some((g) => g.bad) ? 'bad' : tmpGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(tmpGroups.length, 'Tempest') + '. It shows who a tornado touched, how often, and deaths to it. A tank touched is only noted: the tornadoes are what kill the others.', cols: ['Player', 'When', 'Touches', 'Died', ''], groups: tmpGroups, rows: [] });

  // ---- 4. Venomous Surge: two players per combo each drop a Viscous Cyst; the cysts are for the intermission's winds ----
  // (a cyst lands where its player stood when Surge ended. A pop coats nearly the whole platform, and someone runs to the
  // cyst to pop it, so each pop is matched to the open cyst a coated player was standing on (within about 5 yards on
  // Mythic pulls), and that player popped it)
  const sgA = aur(SZ.surge).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), sgR = aur(SZ.surge).filter((e) => e.op === 'remove' && h.isPlayer(e.dst));
  const cysts = sgA.map((e, i) => {
    const rm = sgR.find((x) => x.dst === e.dst && x.t > e.t && x.t <= e.t + 11), d = diedNear(e.dst, e.t, 10.5), died = d && (!rm || d.t <= rm.t + 0.3) ? d : null;
    const tEnd = rm ? rm.t : died ? died.t : Math.min(dur, e.t + 10), p = posPts(tEnd).find((q) => q.guid === e.dst);
    return { i, n: 0, g: e.dst, t: e.t, tEnd, died, x: p ? p.x : null, y: p ? p.y : null, cyc: cycOf(e.t), pop: null };
  });
  inters.concat([{ i: inters.length }]).forEach((x, k) => cysts.filter((c) => c.cyc === k).forEach((c, j) => (c.n = j + 1)));
  const coat = aur(SZ.cyst).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), pops = [];
  for (const e of coat) { const p = pops.find((q) => Math.abs(q.t - e.t) < 1.2); if (p) p.who.add(e.dst); else pops.push({ t: e.t, who: new Set([e.dst]) }); }
  for (const p of pops) {
    // (where the coated players stood as its hit landed: the hit's own position samples, a moment after the coat)
    const at = posPts(p.t).filter((q) => p.who.has(q.guid));
    const open = cysts.filter((c) => c.x != null && c.tEnd < p.t - 0.3 && !c.pop).map((c) => { let best = null; for (const q of at) { const d = Math.hypot(q.x - c.x, q.y - c.y); if (!best || d < best.d) best = { d, g: q.guid }; } return { c, ...(best || { d: Infinity }) }; }).sort((a, b) => a.d - b.d);
    if (open.length && open[0].d < 15) { open[0].c.pop = p; p.cyst = open[0].c; p.by = open[0].g; }
    else if (open.length && at.length) { // (nobody's position sample close enough: the cyst nearest the coated players, unnamed popper)
      const cx = at.reduce((s, q) => s + q.x, 0) / at.length, cy = at.reduce((s, q) => s + q.y, 0) / at.length, c = open.map((o) => ({ c: o.c, d: Math.hypot(o.c.x - cx, o.c.y - cy) })).sort((a, b) => a.d - b.d)[0];
      if (c.d < 25) { c.c.pop = p; p.cyst = c.c; } }
    // which wind it was for: about 3, 11 and 20 seconds into Dig In; after the third, the spare
    const x = inters.find((q) => p.t >= q.t0 - 0.5 && p.t <= q.t1 + 15);
    p.inter = x || null; p.slot = !x ? 'outside' : p.t > x.t1 + 0.5 || p.t - x.t0 >= 26 ? 'spare' : p.t - x.t0 < 8 ? 1 : p.t - x.t0 < 16.5 ? 2 : 3;
  }
  // (two pops in one wind's window: the later one is the spare)
  for (const x of inters) for (const k of [1, 2, 3]) { const l = pops.filter((p) => p.inter === x && p.slot === k); l.slice(1).forEach((p) => (p.slot = 'spare')); }
  for (const p of pops) _sz.pops.push({ t: p.t, slot: p.slot, inter: p.inter ? p.inter.i + 1 : null, by: p.by ? pname(p.by) : null });
  // ("Zoom to mechanic" on a cyst map: around the cysts, not just the players)
  const cyFocus = (l) => { const q = l.filter((c) => c.x != null); if (!q.length) return null; const x = q.reduce((s, c) => s + c.x, 0) / q.length, y = q.reduce((s, c) => s + c.y, 0) / q.length;
    return { x, y, r: Math.max(12, ...q.map((c) => Math.hypot(c.x - x, c.y - y))) * 0.75 }; };
  const fate = (c) => { const p = c.pop, x = inters[c.cyc];
    if (!p) return { txt: c.died ? '—' : !x || x.t0 + 4 > dur ? 'the pull ended first' : 'not popped', dim: true };
    const by = p.by ? ', popped by ' + pname(p.by) : '';
    if (p.slot === 'outside') return { txt: 'popped outside the intermission', warn: true, sub: T(p.t) + by };
    return { txt: p.slot === 'spare' ? 'the spare, after the winds' : 'Wind ' + p.slot + ' of intermission ' + (p.inter.i + 1), sub: T(p.t) + by }; };
  for (const p of pops.filter((q) => q.slot === 'outside')) M(p.t, p.by ? pname(p.by) : 'Raid', 'Viscous Cyst', 'Medium', (p.by ? 'Popped a Viscous Cyst' : 'A Viscous Cyst popped') + (p.cyst ? ' (' + pname(p.cyst.g) + '\'s)' : '') + ' outside the intermission, knocking back ' + pl(p.who.size, 'player') + '.', 'Keep away from the cysts until Dig In. Each one is meant for a wind.');
  for (const c of cysts.filter((q) => q.died)) M(c.died.t, pname(c.g), 'Venomous Surge', 'Medium', 'Died with Venomous Surge on.', 'Venomous Surge hits hard for 10 seconds. Use a defensive, and walk to your cyst spot early so healers can focus you.');
  const cyGroups = [...new Set(cysts.map((c) => c.cyc))].map((k) => {
    const list = cysts.filter((c) => c.cyc === k), x = inters[k];
    // (each cyst as a goo blob: its number, what it was for underneath, outlined green for a wind, blue for the spare,
    // red if popped outside the intermission, grey if never popped)
    const COL = { wind: '#2fd15a', spare: '#6aa8ff', outside: '#ff5a4f', none: '#9aa0ac' };
    const cyMap = list.filter((c) => c.x != null).map((c) => { const f = !c.pop ? 'none' : c.pop.slot === 'outside' ? 'outside' : c.pop.slot === 'spare' ? 'spare' : 'wind';
      return { x: c.x, y: c.y, n: c.n, ring: COL[f], label: { wind: 'wind ' + (c.pop && c.pop.slot), spare: 'spare', outside: 'popped early', none: '' }[f] }; });
    const tm = x ? x.t0 : list[list.length - 1].tEnd + 1;
    const rows = list.map((c) => [{ p: pname(c.g) }, { t: c.tEnd }, c.died ? { txt: 'died with it', bad: true } : { txt: 'cyst #' + c.n }, fate(c), { txt: '' }]);
    return { title: x ? 'For intermission ' + (x.i + 1) : 'After the last intermission', t: list[0].t, bad: rows.some((q) => q[2].bad), warn: rows.some((q) => q[3].warn), sub: pl(list.length, 'cyst') + (x ? ', ' + list.filter((c) => c.pop && c.pop.inter === x && c.pop.slot !== 'outside').length + ' popped in the intermission' : ''),
      rows: [[{ txt: 'Every cyst', sub: 'where each landed, on one map', dim: true }, { t: tm }, { txt: '' }, { txt: '' }, { map: { t: tm, title: 'Viscous Cysts' + (x ? ' for intermission ' + (x.i + 1) : ''), pts: h.snap(tm), cysts: cyMap, ...(cyFocus(list) ? { focus: cyFocus(list) } : {}) } }]].concat(rows) };
  });
  if (cysts.length) sections.push({ id: 'cysts', title: 'Venomous Surge (Save cysts for the winds)', place: 'Venomous Surge (cysts): saved for the winds', spell: [SZ.surgeCast, 'Venomous Surge'], verdict: cyGroups.some((g) => g.bad) ? 'bad' : cyGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(cysts.length, 'Viscous Cyst') + '. It shows who dropped each one, where, and what it was used for.', cols: ['Player', 'When', 'Surge', 'Used for', ''], groups: cyGroups, rows: [] });

  // ---- 5. the intermission (Dig In): three winds, a cyst popped against each, then the spare ----
  const wGroups = inters.map((x) => {
    const rows = [], blownAll = [];
    // (each wind's stretch runs to the next one: a wind blows for several seconds, longer than the coat lasts)
    const twOf = (k) => { const p = pops.find((q) => q.inter === x && q.slot === k); return p ? p.t : x.t0 + [3, 11.5, 20][k - 1]; };
    for (const k of [1, 2, 3]) {
      const p = pops.find((q) => q.inter === x && q.slot === k), tw = twOf(k), tNext = k < 3 ? twOf(k + 1) - 0.5 : x.t1 + 3;
      if (tw > dur + 0.5) break;
      // (alive: not dead yet, or coated by it, which a player brought back is)
      const al = players.filter((g) => !deadBy(g, tw - 0.3) || (p && p.who.has(g))), missed = p ? al.filter((g) => !p.who.has(g)) : [];
      // (died during this wind: blown off the platform, or killed by it)
      const blown = r.deaths.filter((d) => d.t >= tw - 0.5 && d.t < tNext && h.isPlayer(d.guid) && !blownAll.includes(d));
      blownAll.push(...blown);
      if (!p && tw < x.t1) M(tw, 'Raid', 'Howling Maelstrom', 'High', 'No Viscous Cyst was popped for wind ' + k + ' of intermission ' + (x.i + 1) + (blown.length ? ': ' + pl(blown.length, 'player') + ' died.' : '.'), 'Drop the cysts opposite the tunnels that will fire (the orbs above a tunnel show its order), and pop one into each wind.');
      for (const d of blown) M(d.t, d.player, 'Howling Maelstrom', 'High', 'Died during wind ' + k + ' of the intermission' + (p && p.who.has(d.guid) ? '.' : ', without the cyst\'s coat.'), 'Stack in the middle so the wind pushes you into the cyst with everyone else.');
      rows.push([{ txt: 'Wind ' + k }, { t: tw }, p ? { txt: p.cyst ? pname(p.cyst.g) + '\'s cyst' : 'a cyst', sub: [p.cyst ? 'cyst #' + p.cyst.n : '', p.by ? 'popped by ' + pname(p.by) : ''].filter(Boolean).join(', ') } : { txt: 'no cyst popped', bad: true },
        p ? { txt: p.who.size + ' of ' + al.length + ' coated', sub: missed.length ? 'not coated: ' + missed.map(pname).join(', ') : '' } : { txt: '—', dim: true },
        blown.length ? { ps: blown.map((d) => d.player), bad: true } : { txt: '—', dim: true },
        // (the whole intermission's map is on its own row above; a wind someone died in keeps its own map)
        !blown.length ? { txt: '' } : { map: { t: tw + 0.6, good: p ? [...p.who] : [], goodLabel: 'coated by the cyst', bad: blown.map((d) => d.guid), badLabel: 'died in this wind', title: 'Wind ' + k + ', intermission ' + (x.i + 1) + ' at ' + T(tw), pts: h.snap(tw + 0.6), frames: frames(tw - 3, tw + 5),
          // (every cyst of this cycle: the one for this wind green, bursting as it pops; earlier ones already splats)
          cysts: cysts.filter((c) => c.x != null && c.cyc === x.i).map((c) => ({ x: c.x, y: c.y, n: c.n, ring: c.pop === p ? '#2fd15a' : '#e6b450', label: c.pop === p ? 'this wind' : '', popT: c.pop ? c.pop.t : null })),
          ...(cyFocus(cysts.filter((c) => c.cyc === x.i)) ? { focus: cyFocus(cysts.filter((c) => c.cyc === x.i)) } : {}) } }]);
    }
    // (one map for the whole intermission (your note, Oct 18), on its own row above the winds: every cyst of this cycle,
    // labelled with the wind it was popped for, bursting one after another; a green check on each player from the first
    // cyst that coated them, red for anyone who died in a wind)
    const wins = [1, 2, 3].map((k) => ({ k, tw: twOf(k), p: pops.find((q) => q.inter === x && q.slot === k) })).filter((w) => w.tw <= dur + 0.5 && rows.some((q) => q[0].txt === 'Wind ' + w.k));
    if (wins.length) {
      const myC = cysts.filter((c) => c.cyc === x.i), tA = wins[0].tw, tB = wins[wins.length - 1].tw, goodAt = [];
      for (const w of wins) if (w.p) for (const g of w.p.who) if (!goodAt.some((q) => q[0] === g)) goodAt.push([g, w.p.t]);
      const badAt = blownAll.map((d) => [d.guid, d.t]), bad = [...new Set(badAt.map((q) => q[0]))], good = goodAt.filter((q) => !bad.includes(q[0]));
      rows.unshift([{ txt: allN(wins.length, 'wind'), sub: 'the whole intermission, on one map', dim: true }, { t: tA }, { txt: '' }, { txt: '' }, { txt: '' },
        { map: { t: tB + 0.6, good: good.map((q) => q[0]), goodLabel: 'coated by a cyst', goodAt: good, pendLabel: 'not coated yet', bad, badLabel: 'died in a wind', badAt, title: 'Intermission ' + (x.i + 1) + ' at ' + T(x.t0) + ': all ' + pl(wins.length, 'wind') + ', in order', pts: h.snap(tB + 0.6), frames: frames(tA - 3, tB + 5),
          cysts: myC.filter((c) => c.x != null).map((c) => { const w = wins.find((q) => q.p && c.pop === q.p); return { x: c.x, y: c.y, n: c.n, ring: w ? '#2fd15a' : '#e6b450', label: w ? 'wind ' + w.k : '', popT: c.pop ? c.pop.t : null }; }),
          ...(cyFocus(myC) ? { focus: cyFocus(myC) } : {}) } }]);
    }
    const sp = pops.find((q) => q.inter === x && q.slot === 'spare'), left = cysts.filter((c) => c.cyc === x.i && !c.pop && !c.died).length;
    if (x.t1 + 2 < dur) rows.push([{ txt: 'Spare cyst' }, { t: sp ? sp.t : x.t1 }, sp ? { txt: 'popped', sub: [sp.cyst ? pname(sp.cyst.g) + '\'s, cyst #' + sp.cyst.n : '', sp.by ? 'popped by ' + pname(sp.by) : ''].filter(Boolean).join(', ') } : left ? { txt: 'left up', warn: true, sub: 'it pops on its own later and knocks the raid' } : { txt: 'none left', dim: true },
      sp ? { txt: sp.who.size + ' coated', dim: true } : { txt: '—', dim: true }, { txt: '—', dim: true }, { txt: '' }]);
    return { title: 'Intermission ' + (x.i + 1), t: x.t0, bad: rows.some((q) => q[2].bad || q[4].bad), warn: rows.some((q) => q[2].warn), sub: 'Dig In ' + T(x.t0) + ' to ' + T(x.t1) + (blownAll.length ? ', ' + pl(blownAll.length, 'death') : ''), rows };
  }).filter((g) => g.rows.length); // (an intermission the pull ended in before its first wind has nothing to show)
  if (wGroups.length) sections.push({ id: 'winds', title: 'Intermission (A cyst for each wind)', place: 'Intermission: a cyst for every wind', spell: [SZ.digIn, 'Dig In'], verdict: wGroups.some((g) => g.bad) ? 'bad' : wGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(wGroups.length, 'intermission') + '. For each of the three winds, it shows the cyst popped against it, who it coated, and who died.', cols: ['Wind', 'When', 'Cyst', 'Coated', 'Died', ''], groups: wGroups, rows: [] });

  // ---- 6. Raging Crosswinds: marked players are launched the way their arrow points; pairs collide in the air ----
  // (read from Mythic pulls: Turbulent Gusts is the launch; two players who collide lose it together within about a
  // second, a player who drifts keeps it about 5 seconds, and an immunity means no launch at all)
  const cwA = aur(SZ.cw).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), cwR = aur(SZ.cw).filter((e) => e.op === 'remove' && h.isPlayer(e.dst));
  const gu = aur(SZ.gusts).filter((e) => h.isPlayer(e.dst)), cwHits = dmgId(SZ.cwHit);
  const cwGroups = castOk(SZ.cwCast).map((t, i) => {
    const gm = [...new Set(cwA.filter((e) => e.t >= t - 0.5 && e.t <= t + 3).map((e) => e.dst))], arrow = (g) => (cwA.find((e) => e.dst === g && e.t >= t - 0.5) || {}).id;
    const knock = (cwR.find((e) => e.t > t + 3 && e.t < t + 14) || { t: t + 8.7 }).t;
    const gOf = (g) => { const a = gu.find((e) => e.dst === g && e.op === 'apply' && e.t >= knock - 0.3 && e.t <= knock + 1); if (!a) return null; const rm = gu.find((e) => e.dst === g && e.op === 'remove' && e.t > a.t); return { t0: a.t, t1: rm ? rm.t : dur, len: (rm ? rm.t : dur) - a.t }; };
    const info = gm.map((g) => { const q = gOf(g); return { g, id: arrow(g), q, res: !q ? 'none' : q.len <= 2.5 ? 'pair' : 'drift', died: diedNear(g, knock - 0.5, 10), mate: null }; });
    for (const o of info) if (o.res === 'pair' && !o.mate) { const c = info.filter((q) => q !== o && q.res === 'pair' && !q.mate && Math.abs(q.q.t1 - o.q.t1) < 0.15); const m = c.find((q) => q.id !== o.id) || c[0]; if (m) { o.mate = m; m.mate = o; } }
    const by = info.filter((o) => o.res !== 'none');
    // (an unmarked player launched or hit at the same moment: a flying player ran into them)
    const byst = players.filter((g) => !gm.includes(g)).map((g) => ({ g, hit: cwHits.filter((e) => e.dst === g && e.t >= knock - 0.3 && e.t <= knock + 5), q: gOf(g) })).filter((o) => o.hit.length || o.q);
    const drift = info.filter((o) => o.res === 'drift'), imm = info.filter((o) => o.res === 'none');
    /* (Mechanics audit, Oct 24: top kills do this and win, so living through it is a note; a death stays red) */ for (const o of drift) M(knock, pname(o.g), 'Raging Crosswinds', o.died ? 'High' : 'Low', 'Drifted after Raging Crosswinds instead of colliding with another marked player' + (o.died ? ', and died.' : '.'), 'Point your arrow at another marked player so you collide in the air. Arrows at right angles work too.');
    for (const o of byst) M(knock, pname(o.g), 'Raging Crosswinds', 'Low', 'Hit by a player flying from Raging Crosswinds' + (o.hit.length ? ' (' + fmtM(o.hit.reduce((s, e) => s + (e.raw || e.amt), 0)) + ')' : '') + '.', 'Stay out of the marked players\' arrow lines until they land.');
    const aw = (o) => (SZ_CW[o.id] ? 'arrow ' + SZ_CW[o.id][1] : '');
    const rows = info.map((o) => [{ p: pname(o.g), sub: aw(o) }, { t: o.q ? o.q.t0 : knock }, o.mate ? { p: pname(o.mate.g), sub: aw(o.mate) } : { txt: '—', dim: true },
      o.died ? { txt: o.res === 'drift' ? 'drifted, died' : 'died', bad: true } : o.res === 'pair' ? { txt: 'collided' } : o.res === 'drift' ? { txt: 'drifted ' + o.q.len.toFixed(1) + ' s', dim: true } : { txt: 'no launch', dim: true, sub: 'an immunity or a cancel' + (drift.length ? '. Someone in this set drifted' : '') }, { txt: '' }])
      .concat(byst.map((o) => [{ p: pname(o.g) }, { t: knock }, { txt: 'not marked', dim: true }, diedNear(o.g, knock - 0.5, 6) ? { txt: 'hit by a flying player, died', bad: true } : { txt: 'hit by a flying player', dim: true }, { txt: '' }]));
    const links = info.filter((o) => o.mate && o.g < o.mate.g).map((o) => ({ from: o.g, to: o.mate.g, t0: knock - 0.2, t1: knock + 2, color: '#2fd15a', legend: 'collided in the air' }));
    const whole = [{ txt: 'Whole cast', sub: 'every marked player, on one map', dim: true }, { t: knock }, { txt: '' }, { txt: '' },
      { map: { t: knock, pendLabel: 'marked, before the launch', good: info.filter((o) => o.res === 'pair').map((o) => o.g), goodLabel: 'collided', goodAt: info.filter((o) => o.res === 'pair').map((o) => [o.g, o.q.t0]),
        bad: drift.map((o) => o.g).concat(byst.map((o) => o.g)), badLabel: 'drifted, or hit by a flying player', badAt: drift.map((o) => [o.g, o.q.t0 + 2.5]).concat(byst.map((o) => [o.g, knock])), links,
        arrows: info.filter((o) => SZ_CW[o.id]).map((o) => ({ g: o.g, fx: 'wind', color: mcol('Raging Crosswinds').color, ang: SZ_CW[o.id][0] * Math.PI / 180, t0: (cwA.find((e) => e.dst === o.g && e.t >= t - 0.5) || { t }).t, t1: knock })), title: 'Raging Crosswinds ' + (i + 1) + ' at ' + T(t), pts: h.snap(knock), frames: frames(knock - 6, knock + 6) } }];
    return { title: 'Raging Crosswinds ' + (i + 1), t, bad: rows.some((q) => q[3].bad), warn: rows.some((q) => q[3].warn), sub: pl(gm.length, 'marked player') + ': ' + pl(info.filter((o) => o.mate).length / 2, 'pair') + ' collided' + (drift.length ? ', ' + drift.length + ' drifted' : '') + (imm.length ? ', ' + imm.length + ' not launched' : '') + (byst.length ? ', ' + pl(byst.length, 'bystander') + ' hit' : ''), rows: [whole].concat(rows) };
  }).filter((g) => g.rows.length > 1);
  if (cwGroups.length) sections.push({ id: 'crosswinds', title: 'Raging Crosswinds (Collide in the air)', place: 'Raging Crosswinds (arrows): collided in the air', spell: [SZ.cwCast, 'Raging Crosswinds'], verdict: cwGroups.some((g) => g.bad) ? 'bad' : cwGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(cwGroups.length, 'cast') + '. It shows who collided with whom, who drifted, and anyone a flying player hit.', cols: ['Player', 'When', 'Landed with', 'Result', ''], groups: cwGroups, rows: [] });

  // ---- 7. Mythic: Serpent's Fury (14 players pop the marked player's circle to reset his rage) and Virulence ----
  const furies = [];
  if (mythic) {
    const fa = aur(SZ.fury).filter((e) => h.isPlayer(e.dst)), vA = aur(SZ.vir).filter((e) => e.op === 'apply' && h.isPlayer(e.dst));
    // (a mark passed on when its holder dies is the same Fury; a pop is the mark coming off with Virulence on the soakers)
    let cur = null;
    for (const e of fa) {
      // (a mark that wasn't popped only ever passes on, as its holder dies: in the same instant, either way round, or a
      // moment later; so a new mark before a pop is the same Fury)
      if (e.op === 'apply') { if (cur && !cur.popT) { if (!cur.holders.includes(e.dst)) cur.holders.push(e.dst); continue; } cur = { t: e.t, holders: [e.dst], popT: null, lastR: null, soak: [] }; furies.push(cur); }
      else if (e.op === 'remove' && cur && !cur.popT) { cur.lastR = e.t; const v = vA.filter((x) => x.t >= e.t - 0.3 && x.t <= e.t + 1.8); if (v.length >= 5) { cur.popT = e.t; cur.soak = [...new Set(v.map((x) => x.dst))]; } }
    }
    // his rage, from his casts (it resets at a pop and stops climbing during Dig In)
    const rg = ev.filter((e) => e.k === 'cast' && e.pw != null && e.pwMax === 100 && e.srcName === 'Sszorak').map((e) => ({ t: e.t, v: e.pw })).sort((a, b) => a.t - b.t);
    const digOver = (a, b) => inters.reduce((s, x) => s + Math.max(0, Math.min(b, x.t1) - Math.max(a, x.t0)), 0);
    const slopes = []; for (let k = 1; k < rg.length; k++) { const a = rg[k - 1], b = rg[k], live = b.t - a.t - digOver(a.t, b.t); if (b.v > a.v && live > 2 && b.t - a.t < 12) slopes.push((b.v - a.v) / live); }
    slopes.sort((a, b) => a - b); const rate = slopes.length ? slopes[Math.floor(slopes.length / 2)] : null;
    const rageAt = (t) => { const s = [...rg].reverse().find((q) => q.t <= t + 0.05 && !furies.some((f) => f.popT && f.popT > q.t + 0.05 && f.popT <= t)); if (!s) return null; return Math.min(100, s.v + (rate || 0) * Math.max(0, t - s.t - digOver(s.t, t))); };
    const enr = aur(SZ.enrage).find((e) => e.op === 'apply' && !h.isPlayer(e.dst));
    for (const f of furies) { const s = sets.find((q) => q.t0 > f.t - 1); _sz.furies.push({ t: f.t, popT: f.popT, pre: !!(s && s.k === 1), holder: pname(f.holders[0]), enraged: !!(enr && enr.t >= f.t && (!f.popT || f.popT > enr.t)) }); }
    const fRows = furies.map((f, i) => {
      const s = sets.find((q) => q.t0 > f.t - 1), sEnd = s ? s.t1 : null, failed = enr && enr.t >= f.t && (!f.popT || f.popT > enr.t);
      const atEnd = f.popT ? inters.find((x) => f.popT >= x.t1 - 0.5 && f.popT <= x.t1 + 3) : null; // (popped as Dig In ended)
      const rage = f.popT ? rageAt(f.popT - 0.05) : null, after = f.popT != null && sEnd != null && f.popT >= sEnd - 6 ? f.popT - sEnd : null;
      // (a Fury still up when the pull ended: the boss died, or the raid wiped to something else first)
      let res = f.popT ? { txt: 'popped' } : { txt: r.item.kill ? 'up when he died' : 'up when the pull ended', dim: true };
      if (failed) {
        const prev = furies[i - 1], short = sEnd != null && s.k === 0 && s.cyc > 0 && prev && prev.popT ? sEnd - enr.t : null;
        const why = short != null && short > -0.5 ? 'Rage hit 100 at ' + T(enr.t) + ', ' + Math.max(0, short).toFixed(1) + ' s before the tank combo ended. The Fury before the intermission was popped at ' + T(prev.popT) + ': popped about ' + Math.max(1, Math.ceil(short + 0.25)) + ' s later, this one would have had room.'
          : 'Rage hit 100 at ' + T(enr.t) + (sEnd != null && enr.t > sEnd + 0.5 && enr.t - sEnd < 30 ? ', ' + (enr.t - sEnd).toFixed(1) + ' s after the tank combo ended,' : '') + ' before this Fury was popped.';
        res = { txt: 'he enraged', bad: true, sub: why };
        M(enr.t, 'Raid', "Serpent's Fury", 'High', 'Sszorak enraged (Unbound Ferocity). ' + why, 'Pop each Serpent\'s Fury on time. Pop it right as the tank combo ends after the pull or an intermission, and a few seconds after the combo before an intermission. A timer helps.');
      } else if (atEnd) { res = { txt: 'popped as Dig In ended', warn: true, sub: 'the marked player should leave the stack before Dig In ends' };
        M(f.popT, pname(f.holders[f.holders.length - 1]), "Serpent's Fury", 'Medium', 'Serpent\'s Fury popped as Dig In ended, earlier than planned.', 'During the intermission, step out of the stack after the third wind so the Fury waits for the tank combo.'); }
      const who = f.holders.map(pname);
      return [{ txt: 'Fury ' + (i + 1), sub: s ? (s.k === 1 ? 'before the intermission' : s.cyc ? 'after the intermission' : 'the pull') : '' }, { t: f.popT ?? f.t }, { p: who[0], sub: who.length > 1 ? 'then ' + who.slice(1).join(', ') : '' },
        after != null ? { txt: after >= 0 ? after.toFixed(1) + ' s after' : (-after).toFixed(1) + ' s before' } : { txt: '—', dim: true }, rage != null ? { txt: 'about ' + Math.round(rage) } : { txt: '—', dim: true },
        f.popT ? { txt: pl(f.soak.length, 'soaker'), sub: f.soak.length <= 6 ? f.soak.map(pname).join(', ') : '' } : { txt: '—', dim: true }, res,
        f.popT ? { map: { t: f.popT, good: f.soak, goodLabel: 'popped it (got Virulence)', goodAt: f.soak.map((g) => [g, f.popT]), pendLabel: 'in the stack, before the pop', tags: [[f.holders[f.holders.length - 1], 'Fury', f.popT - 6, f.popT + 1]], tagLabel: 'the marked player', title: "Serpent's Fury " + (i + 1) + ' at ' + T(f.popT), pts: h.snap(f.popT), frames: frames(f.popT - 5, f.popT + 1) } } : { txt: '' }];
    });
    if (fRows.length) sections.push({ id: 'fury', title: "Serpent's Fury (Stack and pop it)", place: "Serpent's Fury (stack circle): popped on time", spell: [SZ.fury, "Serpent's Fury"], verdict: fRows.some((x) => x[6].bad) ? 'bad' : fRows.some((x) => x[6].warn) ? 'warn' : 'good',
      summary: furies.length + ' Serpent\'s Fur' + (furies.length === 1 ? 'y' : 'ies') + '. It shows when each was popped against the tank combo, his rage at the pop, and who soaked it.' + (rate ? ' His rage climbs about ' + rate.toFixed(1) + ' a second (not during Dig In), and 100 is the enrage.' : ''),
      cols: ['Fury', 'Popped', 'Marked', 'After the tank combo', 'Rage', 'Soakers', 'Result', ''], rows: fRows });

    // Virulence: the soakers burst 5 s after the pop in four lines; a line clipping someone is a big hit and another Virulence
    const clips = dmgId(SZ.virClip);
    const vGroups = furies.filter((f) => f.popT).map((f) => {
      // (a burst comes when Virulence ends: 5 s after the pop, or at once if its carrier dies; a clipped player's new
      // Virulence bursts 5 s later, so it runs to the next pop)
      const nx = furies.find((q) => q.popT && q.popT > f.popT), k = furies.indexOf(f), cl = clips.filter((e) => e.t >= f.popT + 0.2 && e.t <= Math.min(f.popT + 25, nx ? nx.popT : Infinity)), by = new Map();
      for (const e of cl) { let o = by.get(e.dst); if (!o) by.set(e.dst, o = { g: e.dst, t: e.t, n: 0, amt: 0 }); o.n++; o.amt += e.raw || e.amt; }
      // (a carrier dying before the 5 s are up makes theirs burst at once, wherever the stack still is)
      const early = f.soak.map((g) => r.deaths.find((d) => d.guid === g && d.t > f.popT + 0.2 && d.t < f.popT + 4.8)).filter(Boolean);
      const rows = [...by.values()].map((o) => { const d = diedNear(o.g, o.t, 3);
        if (!o.amt) return [{ p: pname(o.g) }, { t: o.t }, { txt: 'no damage', dim: true, sub: 'an immunity' }, { txt: 'immune', dim: true }, { txt: '' }];
        /* (Mechanics audit, Oct 24: top kills do this and win, so living through it is a note; a death stays red) */ M(o.t, pname(o.g), 'Virulence', d ? 'High' : 'Low', 'Clipped by a Virulence burst (' + fmtM(o.amt) + ')' + (d ? ', and died.' : '.'), 'Spread out right after every Serpent\'s Fury pop, away from everyone else\'s lines.');
        return [{ p: pname(o.g) }, { t: o.t }, { txt: fmtM(o.amt), sub: o.n > 1 ? o.n + ' hits' : '' }, d ? { txt: 'clipped, died', bad: true } : { txt: 'clipped', dim: true }, { txt: '' }]; });
      const hurt = [...by.values()].filter((o) => o.amt > 0).length, tb = f.popT + 5;
      return { title: 'Fury ' + (k + 1) + ' pop', t: f.popT, bad: rows.some((q) => q[3].bad), warn: rows.some((q) => q[3].warn), sub: pl(f.soak.length, 'player') + ' with Virulence, ' + (hurt ? pl(hurt, 'player') + ' clipped' : 'nobody clipped') + (early.length ? '; ' + early.map((d) => d.player).join(', ') + ' died with it, so it burst early, in the stack' : ''),
        rows: [[{ txt: 'Whole burst', sub: 'everyone with Virulence', dim: true }, { t: tb }, { txt: '' }, { txt: '' }, { txt: '' }]].concat(rows) };
    });
    if (vGroups.length) sections.push({ id: 'virulence', title: 'Virulence (Spread out)', place: 'Virulence (line bursts): spread after the pop', spell: [SZ.vir[0], 'Virulence'], verdict: vGroups.some((g) => g.bad) ? 'bad' : vGroups.some((g) => g.warn) ? 'warn' : 'good',
      summary: pl(vGroups.length, 'pop') + '. It shows anyone a Virulence burst clipped.', cols: ['Player', 'When', 'Hit for', 'Result', ''], groups: vGroups, rows: [] });
  }

  // ---- 8. avoidable damage (Tempest, Virulence clips and flying players have their own sections) ----
  const av = avoidPanel(ev, r, h, [
    { n: ['caustic claws'], label: 'Caustic Claws', harm: 'Medium', why: 'the venom splashes that land around Sszorak during Venomous Surge', warnAt: 1, badAt: 2 },
    { n: ['caustic residue'], label: 'Caustic Residue', harm: 'Low', why: 'standing in the venom puddles the splashes leave', warnAt: 5, badAt: 10 },
  ]);
  if (av) sections.push(av);

  const diag = [['Ravage', SZ.ravage], ['Mutilate', SZ.mut], ['Mutilated Gash', SZ.gash], ['Tempest', SZ.tempest], ['Venomous Surge', SZ.surge], ['Viscous Cyst', SZ.cyst], ['Caustic Claws', SZ.claws], ['Caustic Residue', SZ.residue],
    ['Raging Crosswinds', SZ.cw[0]], ['Turbulent Gusts', SZ.gusts], ['Dig In', SZ.digIn], ["Serpent's Fury", SZ.fury], ['Unbound Ferocity', SZ.enrage], ['Virulence', SZ.vir[0]], ['Virulence clip', SZ.virClip]].map(([name, id]) => {
    const c = { cast: 0, dmg: 0, aura: 0, other: 0 };
    for (const x of ev) if (x.id === id) { if (x.k === 'cast' || x.k === 'start') c.cast++; else if (x.k === 'dmg') c.dmg++; else if (x.k === 'aura') c.aura++; else c.other++; }
    return { name, id, ...c, total: c.cast + c.dmg + c.aura + c.other };
  });
  // (grouped the way the fight loops: the tank combo, the Surge cysts, the Crosswinds, the Mythic Fury, the intermission)
  const sectionGroups = [
    { name: 'Tank combo', sub: 'Apex Predator: Ravage, Mutilate, Tempest', ids: ['ravage', 'mutilate', 'tempest'] },
    { name: 'Venomous Surge', sub: 'the cysts for the winds', ids: ['cysts'] },
    { name: 'Raging Crosswinds', sub: '', ids: ['crosswinds'] },
    { name: "Serpent's Fury", sub: 'Mythic: the stack that resets his rage', ids: ['fury', 'virulence'] },
    { name: 'Intermission', sub: 'Dig In: three winds, a cyst for each', ids: ['winds'] },
    { name: 'Deaths and avoidable damage', sub: '', ids: ['deaths', 'avoid', 'kicks'], rest: true },
  ];
  { const pc = paceCard(ev, r, h, mistakes, "Sszorak"); if (pc) sections.push(pc); } /* (Pace, Oct 22: boss coverage) */
  return { _sz, diag, title: r.item.diff + ' audit: Sszorak', reached: inters.length ? 'After intermission ' + inters.length : 'Before the first intermission', phases: [], sectionGroups, marks, sections, mistakes,
    legend: 'Grouped the way the fight loops: the tank combo, the Venomous Surge cysts, Raging Crosswinds, Serpent\'s Fury (Mythic), the intermission, then deaths and avoidable damage.', note: '' };
}

// Nymrissa Wavecaller: who soaked each set of Frost Orbs (each Chilling Frost drops one orb under each player it marks;
// touching an orb is the soak, and an immunity soaks it for free). It's the NSRT note's "Orb Soak N" check: set N is the
// Nth Chilling Frost. A set that Shattered had an orb nobody touched.
function buildNymrissa(ev, r, h) {
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const dur = r.duration, pname = (g) => h.name(g), T = h.fmtT, sections = [], mistakes = [];
  const M = (t, player, mech, id, severity, detail, fix) => mistakes.push({ t, player, mechanic: mech, id, severity, detail, fix });
  const has = (e, ids) => [].concat(ids).includes(e.id);
  const dmgId = (ids) => ev.filter((e) => e.k === 'dmg' && has(e, ids) && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const aur = (ids) => ev.filter((e) => e.k === 'aura' && has(e, ids)).sort((a, b) => a.t - b.t);
  const clusters = (list, g) => { const out = []; for (const e of list) { const c = out[out.length - 1]; if (c && e.t - c.t1 < g) { c.t1 = e.t; c.list.push(e); } else out.push({ t: e.t, t1: e.t, list: [e] }); } return out; };
  const diedTo = (re, t0, t1) => r.deaths.filter((d) => d.t >= t0 && d.t <= t1 && re.test(d.ability || ''));
  const frames = (t0, t1) => h.frames(Math.max(0, t0), Math.min(dur, t1), 0.25);
  const posAt = (g, t) => (((h.frames(t, t, 0.2)[0] || { pts: h.snap(t) }).pts) || []).find((p) => p.guid === g);
  const casts = ev.filter((e) => e.k === 'cast' && e.id === NY.chill).map((e) => e.t).sort((a, b) => a - b).filter((t, i, a) => !i || t - a[i - 1] > 5);
  const setEnd = (i, t) => Math.min(dur, casts[i + 1] != null ? casts[i + 1] - 0.1 : t + 45);
  // (a soak: a Frost Orb hit (damage, or immune) or its debuff on a player, from the cast until the next one)
  const touch = ev.filter((e) => e.id === NY.orb && h.isPlayer(e.dst) && (e.k === 'dmg' || e.k === 'miss' || (e.k === 'aura' && (e.op === 'apply' || e.op === 'dose')))).sort((a, b) => a.t - b.t);
  const shat = ev.filter((e) => e.id === NY.shatter).map((e) => e.t);
  const marked = aur([NY.chill]).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), rainDot = dmgId([NY.rainDot]);
  // (Mythic: each orb soaked sets off one Frost Burst on the whole raid, all its hits within a quarter second; two soaks at the
  // same moment hit everyone twice. The soaker is whoever the orb hit at that moment (its later ticks come every 2 s).)
  // (a tick can land a moment from someone else's soak: only the hits closest to the burst count)
  const bursts = clusters(dmgId([NY.burst]), 0.25).map((c) => { const n = new Set(c.list.map((e) => e.dst)).size, near = touch.filter((e) => e.k !== 'aura' && Math.abs(e.t - c.t) <= 0.25), dt = Math.min(9, ...near.map((e) => Math.abs(e.t - c.t)));
    return { t: c.t, k: Math.max(1, Math.round(c.list.length / Math.max(1, n))), who: [...new Set(near.filter((e) => Math.abs(e.t - c.t) <= dt + 0.05).map((e) => e.dst))] }; });
  const _ny = { sets: [] };
  const groups = casts.map((t, i) => {
    const t1 = setEnd(i, t), by = new Map();
    for (const e of touch.filter((x) => x.t >= t && x.t <= t1)) { let o = by.get(e.dst); if (!o) by.set(e.dst, o = { g: e.dst, t: e.t, imm: false, hits: [], n: 0 }); if ((e.k === 'miss' && /immune/i.test(e.how || '')) || (e.k === 'dmg' && !e.amt && !e.raw)) o.imm = true; /* (Warcraft Logs writes an immunity as a hit of 0; a hit a shield fully absorbed isn't one) */ if (e.k !== 'aura' && (!o.hits.length || e.t - o.hits[o.hits.length - 1] > 1.5)) o.hits.push(e.t); }
    const bs = bursts.filter((b) => b.t >= t && b.t <= t1);
    for (const b of bs) for (const g of b.who) { const o = by.get(g); if (o) o.n++; }
    const who = [...by.values()].sort((a, b) => a.t - b.t), shT = shat.find((x) => x >= t && x <= t1 + 2), sh = shT != null;
    const cut = !who.length && t + 20 > dur; // (the fight ended before this set's orbs were down)
    _ny.sets.push({ i: i + 1, t, who: who.map((o) => pname(o.g)), shatter: sh, cut });
    if (sh) M(shT, 'Raid', 'Frost Orb', NY.shatter, 'High', 'An orb from set ' + (i + 1) + ' was left untouched and Shattered on the raid.', 'Every orb needs a soaker. Assign one for each orb, and have a backup ready.');
    const mk = [...new Set(marked.filter((e) => e.t >= t - 0.5 && e.t <= t + 2).map((e) => e.dst))], nOrbs = bs.reduce((s, b) => s + b.k, 0);
    // (the map: who was marked, then each soaker turning green as they take their first orb; an ice-blue flash on each soak, and a dot where it was)
    const last = Math.max(t + 6, ...who.map((o) => o.t), ...bs.map((b) => b.t));
    const rings = bs.flatMap((b) => b.who.map((g) => ({ guid: g, r: 1.8, ...mcol('Frost Orb', 0.3), label: '', t0: b.t, dur: 1.2, fx: 'burst', at: b.t, cn: 'Ice blue flash', legend: 'soaked an orb' })))
      .concat(bs.flatMap((b) => b.who.map((g) => { const q = posAt(g, b.t); return q ? { x: q.x, y: q.y, r: 1.6, ...mcol('Frost Orb', 0.45), label: '', t0: b.t, dur: 600, fx: 'puddle', cn: 'Ice blue dot', legend: 'where an orb was soaked' } : null; }).filter(Boolean)));
    const rows = who.map((o) => [{ p: pname(o.g) }, { t: o.t }, { txt: o.n ? pl(o.n, 'orb') : o.hits.length ? pl(o.hits.length, 'orb') : 'soaked', sub: o.imm ? 'with an immunity' : '' }, { txt: '' }]);
    if (sh) rows.push([{ txt: 'Shattered', bad: true }, { t: shT }, { txt: 'unsoaked orb hit the raid', bad: true }, { txt: '' }]);
    if (who.length) rows.unshift([{ txt: 'Whole set', sub: 'every soak, on one map', dim: true }, { t }, { txt: nOrbs ? pl(nOrbs, 'orb') + ' in all' : '', dim: true },
      { map: { t: last, hl: mk, hlLabel: 'marked (dropped the orbs)', good: who.map((o) => o.g), goodLabel: 'soaked', goodAt: who.map((o) => [o.g, o.t]), pendLabel: 'hasn\'t soaked yet', title: 'Frost Orbs set ' + (i + 1) + ' at ' + T(t), pts: h.snap(last), rings, frames: frames(t, last + 1) } }]);
    return { title: 'Set ' + (i + 1), t, bad: sh, warn: false, sub: sh ? 'an orb Shattered' : who.length ? (nOrbs ? pl(nOrbs, 'orb') + ' soaked by ' : '') + pl(who.length, 'player') + (mk.length ? ' (' + mk.length + ' marked)' : '') : cut ? 'the fight ended first' : 'nobody soaked', rows };
  });
  if (groups.length) sections.push({ id: 'orbs', title: 'Frost Orbs (Soak every orb)', place: 'Frost Orbs: soaked', spell: [NY.chill, 'Chilling Frost'], verdict: groups.some((g) => g.bad) ? 'bad' : 'good',
    summary: pl(groups.length, 'set') + ' of Frost Orbs. Chilling Frost marks players and drops orbs under them. It shows who soaked each set and how many orbs each took, on a map, and any orb that Shattered.', cols: ['Soaker', 'When', 'Orbs', ''], groups, rows: [] });
  // ---- Frost Burst (Mythic): every soak hits the whole raid, so the orbs go one at a time ----
  { const bGroups = casts.map((t, i) => {
      const t1 = setEnd(i, t), bs = bursts.filter((b) => b.t >= t && b.t <= t1); if (!bs.length) return null;
      // (Oct 20, from the 10 fastest Mythic kills: about a quarter of their soaks land within a second of another, so a close soak alone
      // is only noted; a set goes yellow when more than a third of its soaks were close. Abyssal Rain's damage over time lasts 27 s and
      // starts about 5 s after the orbs drop, so nearly every soak lands while it ticks: deaths say so.)
      const rainOn = (g, t) => rainDot.some((e) => e.dst === g && e.t >= t - 3.5 && e.t <= t + 0.2);
      const info = bs.map((b, j) => { const gp = j ? b.t - bs[j - 1].t : null; return { b, gp, tog: b.k > 1 || (gp != null && gp < 1), dead: diedTo(/frost burst/i, b.t - 0.1, b.t + 1) }; });
      const close = info.filter((x) => x.tog).length, n = bs.reduce((s, b) => s + b.k, 0), many = close * 3 > n;
      const rows = info.map(({ b, gp, tog, dead }) => {
        const inRain = dead.filter((d) => rainOn(d.guid, d.t)).length;
        if (dead.length) M(b.t, 'Raid', 'Frost Burst', NY.burst, 'High', pl(dead.length, 'player') + ' died to Frost Burst' + (tog ? ', with two orbs soaked close together' : '') + (inRain ? ' while Abyssal Rain was ticking.' : '.'), 'Space the orbs out, a second or more apart, so the healers can top the raid up between bursts while Abyssal Rain ticks.');
        return [b.who.length === 1 ? { p: pname(b.who[0]), sub: b.k > 1 ? b.k + ' orbs at once' : '' } : { txt: b.who.length ? b.who.map(pname).join(', ') : 'an orb', sub: b.k > 1 ? b.k + ' orbs at once' : '' }, { t: b.t },
          b.k > 1 ? { txt: 'at the same moment as another', warn: many } : gp == null ? { txt: 'first soak', dim: true } : { txt: gp.toFixed(1) + ' s after the last one', warn: tog && many, sub: tog && !many ? 'close, but fine once in a while' : '' },
          dead.length ? { txt: dead.length === 1 && b.who.length === 1 && b.who[0] === dead[0].guid ? 'died' : dead.map((d) => d.player).join(', ') + ' died', bad: true, sub: inRain ? 'with Abyssal Rain ticking' : '' } : { txt: '—', dim: true }];
      });
      if (many) M(bs[0].t, 'Raid', 'Frost Burst', NY.burst, 'Low', 'In orb set ' + (i + 1) + ', ' + close + ' of ' + n + ' soaks came within a second of another: the raid took Frost Bursts back to back.', 'Space the orbs out, a second or more apart.');
      return { title: 'Set ' + (i + 1), t, bad: rows.some((x) => x[3].bad), warn: many, sub: pl(n, 'soak') + (close ? ', ' + close + ' close to another' + (many ? ' (too many)' : '') : ', one at a time'), rows };
    }).filter(Boolean);
    if (bGroups.length) sections.push({ id: 'nyburst', title: 'Frost Burst (Soak one at a time)', place: 'Frost Burst: orbs soaked one at a time', spell: [NY.burst, 'Frost Burst'], verdict: bGroups.some((g) => g.bad) ? 'bad' : bGroups.some((g) => g.warn) ? 'warn' : 'good',
      summary: 'Every orb soaked sets off Frost Burst on the whole raid, and Abyssal Rain is ticking for almost all of them, so space the soaks out. It shows each soak and the time since the one before. Top raids have about a quarter of their soaks within a second of another, so a set only counts as a mistake when more than a third of its soaks were that close, or someone died.', cols: ['Soaker', 'When', 'Since the last soak', 'Died'], groups: bGroups, rows: [] }); }
  // ---- the murloc sets: Alluring Bubble lures 17 Shorerunners and 2 Frostscales to the middle. A murloc that gets there comes out as a
  // Bubblefin Berserker when the bubble pops (Pulsing Tides on the raid). Each murloc's Alluring Bubble aura ends when it dies; one that
  // reaches the bubble keeps it (the log has no death for these murlocs). They take about 30 s to get there. ----
  { const shieldOn = new Set(aur([NY.shield]).map((e) => e.dst)), mur = new Map();
    for (const e of aur([NY.lure]).filter((x) => !h.isPlayer(x.dst))) { let u = mur.get(e.dst); if (!u && e.op === 'apply') mur.set(e.dst, u = { g: e.dst, t: e.t, name: (h.unitName && h.unitName(e.dst)) || '', died: null }); if (u && e.op === 'remove' && u.died == null) u.died = e.t; }
    const isScale = (u) => /frostscale/i.test(u.name) || shieldOn.has(u.g);
    // (a Frostscale can die with its Alluring Bubble still on: its Waterfog Shield ends at its death too)
    for (const e of aur([NY.shield]).filter((x) => x.op === 'remove')) { const u = mur.get(e.dst); if (u && e.t >= u.t && (u.died == null || e.t < u.died)) u.died = e.t; }
    const pops = clusters(dmgId([NY.popHit]), 5).map((c) => c.t), tides = dmgId([NY.tides]);
    const bers = new Map(); for (const e of aur([NY.berserk]).filter((x) => !h.isPlayer(x.dst))) { let b = bers.get(e.dst); if (!b && e.op === 'apply') bers.set(e.dst, b = { g: e.dst, t: e.t, died: null }); if (b && e.op === 'remove' && b.died == null) b.died = e.t; }
    const mSets = clusters([...mur.values()].sort((a, b) => a.t - b.t), 15).map((c, i) => {
      const t = c.t, runners = c.list.filter((u) => !isScale(u)), scales = c.list.filter(isScale);
      const reached = c.list.filter((u) => u.died == null && dur - u.t > 33), up = c.list.filter((u) => u.died == null && dur - u.t <= 33);
      return { i, t, runners, scales, reached, up, pop: pops.find((p) => p > t + 20) ?? null, bers: [] };
    });
    // (each Berserker belongs to the latest set before its pop that had murlocs get through)
    for (const b of bers.values()) { const s = mSets.filter((x) => x.reached.length && x.pop != null && Math.abs(x.pop - b.t) < 5).pop(); if (s) s.bers.push(b); }
    const addGroups = mSets.map((s) => {
      const rows = [], deadR = s.runners.filter((u) => u.died != null), lastR = Math.max(s.t, ...deadR.map((u) => u.died));
      if (deadR.length) rows.push([{ txt: pl(s.runners.length, 'Shorerunner'), sub: 'the small murlocs' }, { t: lastR }, deadR.length === s.runners.length ? { txt: 'all dead ' + Math.round(lastR - s.t) + ' s after they came' } : { txt: deadR.length + ' of ' + s.runners.length + ' killed', dim: true }, { txt: '' }]);
      if (s.reached.length) {
        const popped = s.pop != null && s.pop <= dur;
        M(popped ? s.pop : s.t + 30, 'Raid', 'Alluring Bubble', NY.bubble, popped ? 'High' : 'Medium', pl(s.reached.length, 'murloc') + ' from set ' + (s.i + 1) + ' reached the bubble' + (popped ? ' and came out as a Berserker when it popped.' : '.'), 'Kill every murloc before it reaches the bubble: Frostscales first, then cleave the Shorerunners down, with stuns and slows on the ones that slip past.');
        rows.push([{ txt: 'Reached the bubble' }, { t: popped ? s.pop : dur }, { txt: pl(s.reached.length, 'murloc') + ' got there', bad: popped, warn: !popped }, { txt: popped ? 'the bubble popped at ' + T(s.pop) : 'the pull ended before it popped', dim: true }]);
      }
      if (s.up.length) rows.push([{ txt: 'Still up at the end', dim: true }, { t: dur }, { txt: pl(s.up.length, 'murloc') + ' still alive when the pull ended', dim: true }, { txt: '' }]);
      // (the Berserkers from one pop on one row: when the last one died, the raid pulses and any deaths)
      if (s.bers.length) {
        const b0 = Math.min(...s.bers.map((b) => b.t)), alive = s.bers.some((b) => b.died == null), end = alive ? dur : Math.max(...s.bers.map((b) => b.died)), life = end - b0;
        const dead = diedTo(/pulsing tides/i, b0, end + 3), np = clusters(tides.filter((e) => e.t >= b0 && e.t <= end + 1), 1).length;
        if (dead.length) M(dead[0].t, 'Raid', 'Pulsing Tides', NY.tides, 'High', pl(dead.length, 'player') + ' died to Pulsing Tides from the Bubblefin Berserker' + (s.bers.length > 1 ? 's.' : '.'), 'Kill a Berserker the moment it comes out: it pulses the whole raid every 3 seconds.');
        rows.push([{ txt: s.bers.length > 1 ? s.bers.length + ' Bubblefin Berserkers' : 'Bubblefin Berserker' }, { t: b0 }, alive ? { txt: 'still alive when the pull ended', bad: true } : { txt: 'killed in ' + Math.round(life) + ' s', warn: life > 10 && !dead.length },
          dead.length ? { txt: (dead.length > 4 ? pl(dead.length, 'player') : dead.map((d) => d.player).join(', ')) + ' died', bad: true } : { txt: 'pulsed the raid ' + pl(np, 'time'), dim: true }]);
      }
      return { title: 'Set ' + (s.i + 1), t: s.t, bad: rows.some((x) => x.some((c) => c.bad)), warn: rows.some((x) => x.some((c) => c.warn)),
        sub: s.reached.length ? pl(s.reached.length, 'murloc') + ' reached the bubble' : s.up.length ? 'the pull ended first' : 'all dead in ' + Math.round(lastR - s.t) + ' s', rows };
    });
    if (addGroups.length) sections.push({ id: 'nyadds', title: 'Murloc sets (Kill them before the bubble)', place: 'Murlocs: all dead before they reach the bubble', spell: [NY.bubble, 'Alluring Bubble'], verdict: addGroups.some((g) => g.bad) ? 'bad' : addGroups.some((g) => g.warn) ? 'warn' : 'good',
      summary: pl(addGroups.length, 'set') + ' of murlocs. Any murloc that reaches the bubble comes out as a Bubblefin Berserker when it pops, and the Berserker pulses the whole raid. It shows when each set was dead, any murlocs that got through, and how fast a Berserker died.', cols: ['Murlocs', 'When', 'Result', 'Notes'], groups: addGroups, rows: [] });
    // ---- Bubblefin Frostscales (Mythic): Waterfog Shield gives nearby murlocs 99% less damage taken, so they die first ----
    const scGroups = mSets.filter((s) => s.scales.length).map((s) => {
      const rows = s.scales.map((u, k) => {
        const end = u.died ?? dur, life = end - u.t, still = s.runners.filter((x) => x.died == null || x.died > end).length, late = u.died != null && life > 25; /* (the 10 fastest Mythic kills: most die within 20 s, almost all within 25) */
        if (late) M(u.died, 'Raid', 'Waterfog Shield', NY.shield, 'Low', 'A Bubblefin Frostscale in set ' + (s.i + 1) + ' lived ' + Math.round(life) + ' s, shielding the murlocs near it.', 'Kill the Frostscales first, then cleave the Shorerunners.');
        return [{ txt: 'Frostscale ' + (k + 1) }, { t: end }, u.died != null ? { txt: 'dead ' + Math.round(life) + ' s after it came', warn: late } : s.reached.length ? { txt: 'alive as murlocs reached the bubble', bad: true } : { txt: 'still alive when the pull ended', dim: true },
          { txt: still ? still + ' of ' + s.runners.length + ' Shorerunners still up' : 'every Shorerunner already dead', dim: true }];
      });
      return { title: 'Set ' + (s.i + 1), t: s.t, bad: rows.some((x) => x[2].bad), warn: rows.some((x) => x[2].warn), sub: rows.some((x) => x[2].bad || x[2].warn) ? 'a Frostscale lived too long' : s.scales.some((u) => u.died == null) ? 'the pull ended first' : 'Frostscales down fast', rows };
    });
    if (scGroups.length) sections.push({ id: 'nyscale', title: 'Bubblefin Frostscales (Kill them first)', place: 'Frostscales: killed first', spell: [NY.shield, 'Waterfog Shield'], verdict: scGroups.some((g) => g.bad) ? 'bad' : scGroups.some((g) => g.warn) ? 'warn' : 'good',
      summary: 'Each set brings 2 Frostscales. Their Waterfog Shield makes the murlocs near them take 99% less damage, so they die first. It shows how long each one lived (top raids kill almost all of them within 25 seconds) and how many Shorerunners were still up when it died.', cols: ['Frostscale', 'Died', 'Result', 'Notes'], groups: scGroups, rows: [] });
  }
  // ---- Water Jet: the tank's beam (+20% per tick), so the tanks swap on every one ----
  { const jt = ev.filter((e) => e.k === 'aura' && e.id === NY.jetTank && e.op === 'apply' && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t).filter((e, i, a) => !i || e.t - a[i - 1].t > 3);
    const rows = jt.map((e, i) => { const again = i && jt[i - 1].dst === e.dst, d = r.deaths.find((x) => x.guid === e.dst && x.t >= e.t && x.t <= e.t + 6);
      if (again) mistakes.push({ t: e.t, player: pname(e.dst), mechanic: 'Water Jet', id: NY.jet, severity: 'Medium', detail: 'Took two Water Jets in a row.', fix: 'Swap tanks on every Water Jet: it hits harder with every tick.' });
      return [{ p: pname(e.dst) }, { t: e.t }, again ? { txt: 'took two in a row', warn: true } : { txt: i ? 'swapped' : 'first' }, d ? { txt: 'died', bad: true } : { txt: '—', dim: true }]; });
    if (rows.length) sections.push({ id: 'nyjet', title: 'Water Jet (Swap every jet)', place: 'Water Jet: a tank swap every time', spell: [NY.jet, 'Water Jet'], verdict: rows.some((x) => x[3].bad) ? 'bad' : rows.some((x) => x[2].warn) ? 'warn' : 'good',
      summary: pl(rows.length, 'Water Jet') + '. It shows which tank took each one. Aim the beam over the ice puddles: it clears them.', cols: ['Tank', 'When', 'Result', 'Died'], rows }); }
  // ---- Abyssal Rain: a raid hit and a long damage over time, about 5 s after the orbs go out; cover each one with a raid cooldown ----
  { const rains = ev.filter((e) => e.k === 'cast' && e.id === NY.rain).map((e) => e.t).sort((a, b) => a - b).filter((t, i, a) => !i || t - a[i - 1] > 10);
    const rc = firstCasts(ev.filter((e) => e.k === 'pcast' && NY_RAIDCD.includes(String(e.spell).toLowerCase()))), dot = dmgId([NY.rainDot]);
    const rows = rains.map((t, i) => {
      const cds = rc.filter((e) => e.t >= t - 3 && e.t <= t + 10), amt = dot.filter((e) => e.t >= t && e.t <= t + 15).reduce((s, e) => s + (e.amt || 0), 0), dead = diedTo(/abyssal rain/i, t, t + 20);
      if (dead.length) M(dead[0].t, 'Raid', 'Abyssal Rain', NY.rain, 'High', pl(dead.length, 'player') + ' died to Abyssal Rain ' + (i + 1) + (cds.length ? '.' : ', with no raid cooldown on it.'), 'Plan a raid cooldown for each Abyssal Rain (it lands about 5 seconds after the orbs go out), and use a personal defensive if you soak during it.');
      return [{ txt: 'Rain ' + (i + 1), sub: amt ? h.compact(amt) + ' damage on the raid' : '' }, { t }, cds.length ? { txt: cds.map((e) => e.spell + ' (' + pname(e.src) + ')').join(', ') } : { txt: 'none', dim: !dead.length, warn: !!dead.length },
        dead.length ? { txt: dead.map((d) => d.player).join(', ') + ' died', bad: true } : { txt: '—', dim: true }];
    });
    if (rows.length) sections.push({ id: 'nyrain', title: 'Abyssal Rain (Cover it with cooldowns)', place: 'Abyssal Rain: covered, nobody died', spell: [NY.rain, 'Abyssal Rain'], verdict: rows.some((x) => x[3].bad) ? 'bad' : rows.some((x) => x[2].warn) ? 'warn' : 'good',
      summary: pl(rows.length, 'Abyssal Rain') + '. Each one hits the raid and leaves a long damage over time about 5 seconds after the orbs go out, and makes Nymrissa hit harder for the rest of the fight. It shows the raid cooldowns used on each one (from 3 seconds before to 10 seconds after) and anyone who died to it.', cols: ['Rain', 'When', 'Raid cooldowns', 'Died'], rows }); }
  // ---- Swirling Whirlpools and Pop!: stand in the one gap as the whirlpools surge in; when they reach the bubble it pops and knocks
  // everyone back, and anyone pushed into the water is bitten by the sharks (Wild Bite) ----
  { const pops = clusters(dmgId([NY.popHit]), 5).map((c) => c.t), wh = dmgId([NY.whirlHit]);
    const bite = ev.filter((e) => e.id === NY.bite && h.isPlayer(e.dst) && (e.k === 'dmg' || (e.k === 'aura' && e.op === 'apply'))).sort((a, b) => a.t - b.t);
    /* (Mechanics audit, Oct 24: every top kill had a player or two clipped and living (sometimes the same one twice), so living is a note, a death red) */
    const popN = new Map();
    const groups = pops.map((p, i) => {
      const t0 = Math.max(0, i ? pops[i - 1] + 15 : 0, p - 20), wi = new Map(), bi = new Map();
      for (const e of wh.filter((x) => x.t >= t0 && x.t <= p + 1)) if (!wi.has(e.dst)) wi.set(e.dst, e.t);
      for (const e of bite.filter((x) => x.t >= p - 1 && x.t <= p + 12)) if (!bi.has(e.dst)) bi.set(e.dst, e.t);
      const who = [...new Set([...wi.keys(), ...bi.keys()])];
      const rows = who.map((g) => {
        const tw = wi.get(g), tb = bi.get(g), t1 = tw ?? tb, d = r.deaths.find((x) => x.guid === g && x.t >= t1 - 0.2 && x.t <= p + 15 && /whirlpool|wild bite|pop!/i.test(x.ability || ''));
        if (d) M(d.t, pname(g), tb != null ? 'Wild Bite' : 'Swirling Whirlpools', tb != null ? NY.bite : NY.whirlHit, 'High', 'Died to ' + d.ability + ' at Pop! ' + (i + 1) + '.', tb != null ? 'Stand where Pop!\'s knockback keeps you on land, and get out of the water at once.' : 'Find the one gap in the whirlpools and stand in it before they surge in.');
        const nth = (popN.get(g) || 0) + 1; popN.set(g, nth);
        return [{ p: pname(g) }, { t: t1 }, { txt: [tw != null ? 'hit by a whirlpool' : '', tb != null ? 'knocked into the water' : ''].filter(Boolean).join(' and '), dim: !d, sub: nth > 1 ? 'again (' + nth + ' times)' : '' }, d ? { txt: 'died', bad: true } : { txt: '—', dim: true }];
      }).sort((a, b) => a[1].t - b[1].t);
      // (the map: a red flash on each whirlpool hit, a blue one on each shark bite, everyone moving from 12 s before the pop)
      const rings = [...wi].map(([g, at]) => ({ guid: g, r: 2.2, color: '#ff3b3b', fill: 'rgba(255,59,59,.25)', label: '', t0: at, dur: 1.5, cn: 'Red flash', legend: 'hit by a whirlpool' }))
        .concat([...bi].map(([g, at]) => ({ guid: g, r: 2.2, color: '#6aa8ff', fill: 'rgba(106,168,255,.3)', label: '', t0: at, dur: 3, cn: 'Blue flash', legend: 'knocked into the water (Wild Bite)' })));
      if (who.length) rows.unshift([{ txt: 'Whole pop', sub: 'where everyone stood, on one map', dim: true }, { t: p }, { txt: '' },
        { map: { t: p + 0.5, bad: who, badLabel: 'hit by a whirlpool or knocked into the water', badAt: who.map((g) => [g, wi.get(g) ?? bi.get(g)]), title: 'Pop! ' + (i + 1) + ' at ' + T(p), pts: h.snap(p + 0.5), rings, frames: frames(p - 12, p + 8) } }]);
      return { title: 'Pop! ' + (i + 1), t: p, bad: rows.some((x) => x[3].bad), warn: rows.some((x) => x[2].warn), sub: who.length ? [wi.size ? pl(wi.size, 'player') + ' hit by the whirlpools' : '', bi.size ? pl(bi.size, 'player') + ' knocked into the water' : ''].filter(Boolean).join(', ') : 'everyone found the gap and stayed dry', rows };
    });
    if (groups.length) sections.push({ id: 'nypop', title: 'Whirlpools and Pop! (Find the gap, stay dry)', place: 'Swirling Whirlpools and Pop!: in the gap, out of the water', spell: [NY.whirl, 'Swirling Whirlpools'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: pl(groups.length, 'Pop!').replace('Pop!s', 'pops') + '. Whirlpools form at the edges and surge to the middle, leaving one gap. When they reach the bubble it pops and knocks everyone back, and anyone pushed into the water is bitten by the sharks (Wild Bite). It shows who the whirlpools hit and who ended up in the water, with a map of each pop.', cols: ['Player', 'When', 'What happened', 'Died'], groups, rows: [] }); }
  const av = avoidPanel(ev, r, h, [
    { n: ['swirling whirlpools'], label: 'Swirling Whirlpools', harm: 'Medium', why: 'standing outside the gap as the whirlpools surged in' },
    { n: ['water jet'], label: 'Water Jet', harm: 'Medium', why: 'standing in the tank\'s beam', skip: (e) => h.role(e.dst) === 'tank' },
    { n: ['lingering frost'], label: 'Lingering Frost', harm: 'Low', why: 'standing on an ice puddle' },
  ]);
  if (av) sections.push(av);
  // (the pull timeline: each murloc set, Abyssal Rain and Pop!)
  const gapT = (l, g) => l.sort((a, b) => a - b).filter((t, i, a) => !i || t - a[i - 1] > g), marks = [];
  gapT(ev.filter((e) => e.k === 'aura' && e.id === NY.lure && e.op === 'apply' && !h.isPlayer(e.dst)).map((e) => e.t), 15).forEach((t, i) => marks.push({ t, label: 'Murloc set ' + (i + 1), id: NY.bubble, kind: 'phase' }));
  gapT(ev.filter((e) => e.k === 'cast' && e.id === NY.rain).map((e) => e.t), 10).forEach((t, i) => marks.push({ t, label: 'Abyssal Rain ' + (i + 1), id: NY.rain, kind: 'phase' }));
  clusters(dmgId([NY.popHit]), 5).forEach((c, i) => marks.push({ t: c.t, label: 'Pop! ' + (i + 1), id: NY.popHit, kind: 'phase' }));
  marks.sort((a, b) => a.t - b.t);
  // (the Data check: which tracked spells this pull contained)
  const diag = [['Chilling Frost', NY.chill], ['Frost Orb', NY.orb], ['Frost Burst', NY.burst], ['Shatter', NY.shatter], ['Water Jet', NY.jet], ['Water Jet (tank)', NY.jetTank], ['Lingering Frost', NY.frost],
    ['Alluring Bubble', NY.bubble], ['Alluring Bubble (on murlocs)', NY.lure], ['Waterfog Shield', NY.shield], ['Pulsing Tides (Berserker)', NY.berserk], ['Pulsing Tides (raid)', NY.tides],
    ['Swirling Whirlpools', NY.whirl], ['Swirling Whirlpools (hits)', NY.whirlHit], ['Pop!', NY.popHit], ['Wild Bite', NY.bite], ['Abyssal Rain', NY.rain], ['Abyssal Rain (damage over time)', NY.rainDot]].map(([name, id]) => {
    const c = { cast: 0, dmg: 0, aura: 0, other: 0 };
    for (const x of ev) if (x.id === id) { if (x.k === 'cast' || x.k === 'start') c.cast++; else if (x.k === 'dmg') c.dmg++; else if (x.k === 'aura') c.aura++; else c.other++; }
    return { name, id, ...c, total: c.cast + c.dmg + c.aura + c.other };
  });
  { const pc = paceCard(ev, r, h, mistakes, "Nymrissa Wavecaller"); if (pc) sections.push(pc); } /* (Pace, Oct 22: boss coverage) */
  return { _ny, diag, title: r.item.diff + ' audit: Nymrissa Wavecaller', reached: '', phases: [], marks, sections, mistakes, legend: 'The murloc sets and their Frostscales, the Frost Orb soaks and their bursts, the tank swaps, Abyssal Rain, the whirlpools and Pop!, then avoidable damage.', note: '' };
}

// Kith'ix (Oct 19 2026, from the guide library's notes: Wowhead, Icy Veins, Mythic Trap and a Mythic video guide). P1 adds sets and
// mechanics until his 100 energy, an intermission (Suffocating Darkness) each time, then P2 at 25%: Last Light and a one-minute DPS check.
function buildKithix(ev, r, h) {
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const dur = r.duration, diff = r.item.diff, mythic = diff === 'Mythic', heroic = mythic || diff === 'Heroic', pname = (g) => h.name(g), T = h.fmtT;
  const fmtM = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1e3) + 'k');
  const mistakes = [], sections = [], marks = [];
  const M = (t, player, mech, severity, detail, fix) => mistakes.push({ t, player, mechanic: mech, id: 0, severity, detail, fix });
  const has = (e, ids) => [].concat(ids).includes(e.id);
  const dmgId = (ids) => ev.filter((e) => e.k === 'dmg' && has(e, ids) && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const aur = (ids) => ev.filter((e) => e.k === 'aura' && has(e, ids)).sort((a, b) => a.t - b.t);
  const gap = (l, g) => l.sort((a, b) => a - b).filter((t, i, a) => !i || t - a[i - 1] > g);
  const castT = (ids, g) => gap(ev.filter((e) => e.k === 'cast' && has(e, ids)).map((e) => e.t), g || 3);
  const clusters = (list, g) => { const out = []; for (const e of list) { const c = out[out.length - 1]; if (c && e.t - c.t1 < g) { c.t1 = e.t; c.list.push(e); } else out.push({ t: e.t, t1: e.t, list: [e] }); } return out; };
  const diedNear = (g, t, w) => r.deaths.find((d) => d.guid === g && d.t >= t - 0.2 && d.t <= t + w);
  const upAt = (list, g, t) => { let on = false; for (const e of list) { if (e.t > t) break; if (e.dst !== g) continue; on = e.op !== 'remove'; } return on; };

  // ---- the phases: P1 until 100 energy, an intermission each time (Suffocating Darkness until Divine Radiance), P2 at Stygian Howl ----
  const inter = castT(KX.suffocate, 20), rad = castT(KX.radiance, 20);
  const howl = (castT([KX.howl]).concat(aur([KX.howl]).filter((e) => e.op === 'apply').map((e) => e.t)).sort((a, b) => a - b))[0] ?? null;
  const phases = []; let t0 = 0, k = 1;
  for (const a of inter.filter((x) => howl == null || x < howl)) { const b = rad.find((x) => x > a + 5 && x < a + 120) ?? Math.min(dur, howl ?? dur);
    phases.push({ name: 'P1 part ' + k, start: t0, end: a }); phases.push({ name: 'Intermission ' + k, start: a, end: b }); t0 = b; k++; }
  phases.push({ name: howl != null ? 'P1 part ' + k : (k > 1 ? 'P1 part ' + k : 'P1'), start: t0, end: howl ?? dur });
  if (howl != null) phases.push({ name: 'P2 Last Light', start: howl, end: dur });
  if (phases.length === 1) phases[0].name = 'P1';
  inter.forEach((t, i) => marks.push({ t, label: 'Intermission ' + (i + 1), id: KX.suffocate[0], kind: 'phase' }));
  if (howl != null) marks.push({ t: howl, label: 'P2', id: KX.howl, kind: 'phase' });
  const phOf = (t) => { let n = phases[0].name; for (const p of phases) if (t >= p.start - 0.5) n = p.name; return n; };

  // ---- 1. Voidswarm: each set of adds, all dead before the intermission (survivors get Dark Frenzy) ----
  // (Voidswarm is logged as a 6-second buff on Kith'ix while he channels it, not as a cast)
  const sets = gap(aur([KX.swarm[0]]).filter((e) => e.op === 'apply' && !h.isPlayer(e.dst)).map((e) => e.t).concat(castT([KX.swarm[0]], 20)), 20);
  {
    const ADD = ['Venomous Hulk', 'Voidweaver', 'Bomber Beetle', 'Mindstinger Egg'], die = ev.filter((e) => e.k === 'die' && ADD.includes(e.name));
    const fr = aur(KX.frenzy).filter((e) => e.op === 'apply' && !h.isPlayer(e.dst)), hatch = clusters(dmgId([KX.mindsting]), 3);
    const groups = sets.map((t, i) => {
      const t1 = sets[i + 1] ?? dur, mine = die.filter((e) => e.t >= t && e.t < t1), rows = [];
      for (const n of ADD) { const d = mine.filter((e) => e.name === n); if (!d.length) continue;
        rows.push([{ txt: n === 'Mindstinger Egg' ? 'Mindstinger Eggs' : pl(d.length, n), sub: n === 'Mindstinger Egg' ? pl(d.length, 'egg') + ' killed' : '' }, { t: d[d.length - 1].t }, { txt: 'all dead ' + Math.round(d[d.length - 1].t - t) + ' s after the swarm' }, { txt: '' }]); }
      const fz = [...new Set(fr.filter((e) => e.t >= t && e.t < t1).map((e) => e.dst))];
      if (fz.length) { const at = fr.find((e) => e.t >= t).t; M(at, 'Raid', 'Dark Frenzy', 'High', pl(fz.length, 'add') + ' from set ' + (i + 1) + ' were still alive at the intermission and got Dark Frenzy (faster, crowd-control immune, pulsing raid damage).', 'Kill every add before Kith\'ix reaches 100 energy.');
        rows.push([{ txt: 'Dark Frenzy' }, { t: at }, { txt: pl(fz.length, 'add') + ' still alive at the intermission', bad: true }, { txt: '' }]); }
      const hs = hatch.filter((c) => c.t >= t && c.t < t1);
      if (hs.length) { M(hs[0].t, 'Raid', 'Mindsting', 'Medium', pl(hs.length, 'Mindstinger egg') + ' from set ' + (i + 1) + ' hatched (stun and damage over time).', 'Kill the eggs before they hatch: drop them in the cleave on the Hulk and Voidweavers.');
        rows.push([{ txt: 'Eggs hatched' }, { t: hs[0].t }, { txt: pl(hs.length, 'egg') + ' hatched', warn: true, sub: 'Mindsting' }, { txt: '' }]); }
      rows.sort((a, b) => a[1].t - b[1].t);
      return { title: 'Set ' + (i + 1) + ' (' + phOf(t) + ')', t, bad: rows.some((x) => x[2].bad), warn: rows.some((x) => x[2].warn), sub: fz.length ? pl(fz.length, 'add') + ' reached the intermission' : 'all dead in time', rows };
    });
    if (groups.length) sections.push({ id: 'kxadds', title: 'Voidswarm (Kill before the intermission)', place: 'Voidswarm adds: all dead before the intermission', spell: [KX.swarm[0], 'Voidswarm'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: pl(groups.length, 'set') + ' of adds. It shows when each kind was dead, any that reached the intermission (Dark Frenzy)' + (heroic ? ' and any Mindstinger egg that hatched' : '') + '.', cols: ['Add', 'When', 'Result', ''], groups, rows: [] });
  }

  // ---- 2. Bomber Beetles: pop them one at a time (each pop puts a Digestive Juices stack on everyone nearby) ----
  {
    const ju = aur([KX.juices]).filter((e) => (e.op === 'apply' || e.op === 'dose') && h.isPlayer(e.dst)), pops = clusters(ju, 0.6);
    const dj = r.deaths.filter((d) => /digestive juices/i.test(d.ability || ''));
    const usedD = new Set(); /* (each death counted on one beetle) */
    const groups = sets.map((t, i) => {
      const t1 = sets[i + 1] ?? dur, pp = pops.filter((c) => c.t >= t && c.t < t1); if (!pp.length) return null;
      const rows = pp.map((c, j) => { const close = j && c.t - pp[j - 1].t1 < 3, n = new Set(c.list.map((e) => e.dst)).size, dead = dj.filter((d) => d.t >= c.t - 0.2 && d.t <= c.t + 8 && !usedD.has(d));
        dead.forEach((d) => usedD.add(d)); if (close) M(c.t, 'Raid', 'Bomber Beetle', 'Medium', 'Two Bomber Beetles popped within ' + (c.t - pp[j - 1].t1).toFixed(1) + ' s of each other: their Digestive Juices stacked on the raid.', 'Pop the beetles one at a time: grip or lead them into a player on purpose, a few seconds apart.');
        if (dead.length) M(dead[0].t, 'Raid', 'Digestive Juices', 'High', pl(dead.length, 'player') + ' died to Digestive Juices.', 'Pop the beetles one at a time, and stay out of the middle while they are up.');
        return [{ txt: 'Beetle ' + (j + 1) }, { t: c.t }, close ? { txt: (c.t - pp[j - 1].t1).toFixed(1) + ' s after the last one', warn: true, sub: 'popped together' } : { txt: j ? Math.round(c.t - pp[j - 1].t1) + ' s after the last one' : 'first pop' },
          dead.length ? { txt: dead.map((d) => d.player).join(', ') + ' died', bad: true } : { txt: pl(n, 'player') + ' got a stack', dim: true }]; });
      return { title: 'Set ' + (i + 1) + ' beetles', t, bad: rows.some((x) => x[3].bad), warn: rows.some((x) => x[2].warn), sub: pl(pp.length, 'pop') + (rows.some((x) => x[2].warn) ? ', some together' : ', one at a time'), rows };
    }).filter(Boolean);
    if (groups.length) sections.push({ id: 'kxbeetle', title: 'Bomber Beetles (Pop one at a time)', place: 'Bomber Beetles: popped one at a time', spell: [KX.juices, 'Digestive Juices'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: 'Each beetle that pops (on a player, or after 30 seconds) puts a stacking Digestive Juices on the raid. It shows each pop, and any within 3 seconds of another.', cols: ['Beetle', 'When', 'Result', 'Notes'], groups, rows: [] });
  }

  // ---- 3. Extinguish: everyone grabs a Light's Embrace mote first (90% less shadow damage) ----
  {
    const emb = aur(KX.embrace).filter((e) => h.isPlayer(e.dst)), hit = dmgId([KX.extinguish]);
    const groups = clusters(hit, 3).map((c, i) => {
      const by = new Map(); for (const e of c.list) if (!by.has(e.dst)) by.set(e.dst, e);
      const no = [...by.values()].filter((e) => !upAt(emb, e.dst, e.t + 0.05) && e.amt > 0);
      const rows = no.map((e) => { const d = diedNear(e.dst, e.t, 2);
        /* (Mechanics audit, Oct 24: every top kill had 1 to 4 players take it without a mote and live (a defensive does it), so living is a note) */
        M(e.t, pname(e.dst), 'Extinguish', d ? 'High' : 'Low', 'Took Extinguish without a Light\'s Embrace mote (' + fmtM(e.amt) + ')' + (d ? ', and died.' : '.'), 'Grab a Light\'s Embrace mote before Extinguish finishes casting. No mote left: use a defensive.');
        return [{ p: pname(e.dst) }, { t: e.t }, { txt: 'no mote, took ' + fmtM(e.amt), bad: !!d, dim: !d }, d ? { txt: 'died', bad: true } : { txt: 'lived', dim: true }]; });
      return { title: 'Extinguish ' + (i + 1) + ' (' + phOf(c.t) + ')', t: c.t, bad: rows.some((x) => x[2].bad || x[3].bad), warn: rows.some((x) => x[2].warn), sub: no.length ? pl(no.length, 'player') + ' without a mote' : 'everyone had a mote', rows };
    });
    if (groups.length) sections.push({ id: 'kxext', title: "Extinguish (Grab a mote)", place: "Extinguish: everyone holding Light's Embrace", spell: [KX.extinguish, 'Extinguish'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: pl(groups.length, 'Extinguish').replace(/hs$/, 'hes') + '. It shows who took it without a Light\'s Embrace mote (90% less shadow damage).', cols: ['Player', 'When', 'Result', 'Died'], groups, rows: [] });
  }

  // ---- 4. Unspeakable Horrors: run out, then dispel the fears one at a time (each dispel screams on the raid) ----
  {
    const fa = aur([KX.fear]).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), fr = aur([KX.fear]).filter((e) => e.op === 'remove' && h.isPlayer(e.dst));
    const disp = ev.filter((e) => e.k === 'dispel' && /overwhelming fear/i.test(e.spell || '')), scr = dmgId([KX.scream]);
    const groups = clusters(fa, 4).map((c, i) => {
      const rows = c.list.map((e) => { const rm = fr.find((x) => x.dst === e.dst && x.t > e.t); return { g: e.dst, t: e.t, rm: rm ? rm.t : null, by: rm && disp.find((x) => x.dst === e.dst && Math.abs(x.t - rm.t) < 0.5) }; })
        .sort((a, b) => (a.rm ?? 1e9) - (b.rm ?? 1e9)).map((o, j, l) => {
          const near = o.rm != null && l.some((q) => q !== o && q.rm != null && Math.abs(q.rm - o.rm) < 1), sh = o.rm != null ? scr.filter((x) => x.t >= o.rm - 0.1 && x.t <= o.rm + 1) : [];
          const dead = o.rm != null ? r.deaths.filter((d) => d.t >= o.rm - 0.2 && d.t <= o.rm + 2 && /overwhelming fear/i.test(d.ability || '')) : [];
          if (dead.length) M(o.rm, 'Raid', 'Overwhelming Fear', 'High', pl(dead.length, 'player') + ' died to the scream as ' + pname(o.g) + '\'s fear came off.', 'Dispel the fears one at a time, with the feared player away from the group.');
          return [{ p: pname(o.g) }, { t: o.rm ?? o.t }, o.rm == null ? { txt: 'still feared', dim: true } : { txt: (o.by ? 'dispelled' : 'came off') + ' after ' + (o.rm - o.t).toFixed(1) + ' s', sub: o.by ? 'by ' + o.by.src : '' },
            dead.length ? { txt: dead.map((d) => d.player).join(', ') + ' died', bad: true } : near ? { txt: 'within 1 s of another', warn: true, sub: 'two screams at once' } : { txt: sh.length ? 'scream hit ' + pl(new Set(sh.map((x) => x.dst)).size, 'player') : '—', dim: true }]; });
      return { title: 'Unspeakable Horrors ' + (i + 1) + ' (' + phOf(c.t) + ')', t: c.t, bad: rows.some((x) => x[3].bad), warn: rows.some((x) => x[3].warn), sub: pl(rows.length, 'feared player'), rows };
    });
    if (groups.length) sections.push({ id: 'kxfear', title: 'Overwhelming Fear (Dispel one at a time)', place: 'Overwhelming Fear: dispelled one at a time', spell: [KX.fear, 'Overwhelming Fear'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: pl(groups.length, 'set') + ' of fears. Each dispel releases a scream on the raid, weaker with distance, so they go one at a time. It shows each dispel, and any two within a second of each other.', cols: ['Player', 'When', 'Result', 'Notes'], groups, rows: [] });
  }

  // ---- 5. tanks: a swap on every Dark Devastation (Devastated: +150% damage taken) ----
  {
    const da = aur([KX.devastated]).filter((e) => h.isPlayer(e.dst)), raidHit = dmgId(KX.devHit).filter((e) => h.role(e.dst) !== 'tank');
    const rows = castT([KX.devCast], 5).map((t) => {
      const on = da.find((e) => e.op === 'apply' && e.t >= t - 0.5 && e.t <= t + 8), again = on && da.some((e) => e.dst === on.dst && e.t < on.t - 1 && e.op !== 'remove') && upAt(da, on.dst, on.t - 0.3);
      const by = raidHit.filter((e) => e.t >= t && e.t <= t + 8), d = on && diedNear(on.dst, on.t, 4);
      if (again) M(on.t, pname(on.dst), 'Dark Devastation', 'High', 'Took Dark Devastation with Devastated still on (150% more damage taken).', 'Taunt-swap on every Dark Devastation.');
      if (by.length) M(by[0].t, 'Raid', 'Dark Devastation', 'Medium', pl(new Set(by.map((e) => e.dst)).size, 'other player') + ' caught in the Dark Devastation circle.', 'The tank takes the 15-yard circle away from the raid.');
      return [{ p: on ? pname(on.dst) : '?' }, { t: on ? on.t : t }, again ? { txt: 'took two in a row', bad: true } : { txt: 'swapped' }, d ? { txt: 'died', bad: true } : by.length ? { txt: pl(new Set(by.map((e) => e.dst)).size, 'other player') + ' hit', warn: true } : { txt: '—', dim: true }];
    });
    if (rows.length) sections.push({ id: 'kxtank', title: 'Dark Devastation (Tank swap)', place: 'Dark Devastation: a swap every time, away from the raid', spell: [KX.devCast, 'Dark Devastation'], verdict: rows.some((x) => x[2].bad || x[3].bad) ? 'bad' : rows.some((x) => x[3].warn) ? 'warn' : 'good',
      summary: pl(rows.length, 'Dark Devastation') + '. It shows which tank took each one, and anyone else the circle hit.', cols: ['Tank', 'When', 'Result', 'Notes'], rows });
  }

  // ---- 6. intermission: Abyssal Grasp (heal it off within 8 s or be pulled into the dark) and Eclipse Fragments ----
  {
    const ga = aur([KX.grasp]).filter((e) => h.isPlayer(e.dst)), rows = [];
    for (const e of ga.filter((x) => x.op === 'apply')) { const rm = ga.find((x) => x.op === 'remove' && x.dst === e.dst && x.t > e.t), len = (rm ? rm.t : Math.min(dur, e.t + 8)) - e.t, d = diedNear(e.dst, e.t, 10);
      if (len >= 7.5 || d) M(e.t, pname(e.dst), 'Abyssal Grasp', d ? 'High' : 'Medium', 'Abyssal Grasp stayed on for ' + len.toFixed(1) + ' s' + (d ? ', and they died.' : ' and pulled them into the dark.'), 'Heal off the absorb fast: a Healthstone or potion yourself, and healers on it.');
      rows.push([{ p: pname(e.dst) }, { t: e.t }, { txt: 'removed after ' + len.toFixed(1) + ' s', bad: !!d || len >= 7.5, warn: !d && len >= 5 && len < 7.5 }, d ? { txt: 'died', bad: true } : { txt: '—', dim: true }]); }
    if (rows.length) sections.push({ id: 'kxgrasp', title: 'Abyssal Grasp (Heal it off)', place: 'Abyssal Grasp: healed off within 8 s', spell: [KX.grasp, 'Abyssal Grasp'], verdict: rows.some((x) => x[2].bad || x[3].bad) ? 'bad' : rows.some((x) => x[2].warn) ? 'warn' : 'good',
      summary: pl(rows.length, 'Abyssal Grasp') + ' in the intermissions. Its heal absorb has to be gone within 8 seconds, or it pulls the player into the dark.', cols: ['Player', 'When', 'Result', 'Died'], rows });
    const fg = aur([KX.fragment]).filter((e) => (e.op === 'apply' || e.op === 'dose') && h.isPlayer(e.dst));
    if (heroic && fg.length) { const groups = inter.map((t, i) => { const t1 = phases.find((p) => p.name === 'Intermission ' + (i + 1)); const end = t1 ? t1.end : t + 90, by = new Map();
      for (const e of fg.filter((x) => x.t >= t && x.t <= end + 2)) { const o = by.get(e.dst) || { g: e.dst, t: e.t, n: 0, mx: 0 }; o.n += e.op === 'apply' ? 1 : 0; o.mx = Math.max(o.mx, e.stacks || 1); by.set(e.dst, o); }
      const rows2 = [...by.values()].sort((a, b) => b.mx - a.mx).map((o) => { const d = diedNear(o.g, o.t, end - o.t + 3);
        return [{ p: pname(o.g) }, { t: o.t }, { txt: o.mx + (o.mx === 1 ? ' stack' : ' stacks') }, d && /eclipse fragment/i.test(d.ability || '') ? { txt: 'died to it', bad: true } : { txt: '—', dim: true }]; });
      return rows2.length ? { title: 'Intermission ' + (i + 1), t, bad: rows2.some((x) => x[3].bad), warn: rows2.some((x) => x[2].warn), sub: pl(rows2.length, 'player') + ' caught fragments', rows: rows2 } : null; }).filter(Boolean);
      if (groups.length) sections.push({ id: 'kxfrag', title: 'Eclipse Fragments (Catch them in turns)', place: 'Eclipse Fragments: intercepted before Liadrin', spell: [KX.fragment, 'Eclipse Fragment'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good', info: !groups.some((g) => g.bad || g.warn),
        summary: 'Fragments float from the Voidscars to Liadrin; each one caught gives a stacking damage over time. It shows who caught them and how many stacks they reached. A guide has two soakers take turns on each scar.', cols: ['Player', 'First catch', 'Most stacks', 'Died'], groups, rows: [] }); }
  }

  // ---- 7. P2: Null Gates (Nullify stacks kill at 3 on Mythic) and Negation (the tank closes gates) ----
  if (howl != null) {
    const cap = mythic ? 3 : diff === 'Heroic' ? 5 : 6;
    const nu = aur(KX.nullify).filter((e) => (e.op === 'apply' || e.op === 'dose') && h.isPlayer(e.dst)), by = new Map();
    for (const e of nu) { const o = by.get(e.dst) || { g: e.dst, t: e.t, mx: 0 }; if ((e.stacks || 1) >= o.mx) { o.mx = e.stacks || 1; o.t = e.t; } by.set(e.dst, o); }
    // (Oct 22, boss coverage: the fastest kills all lose players to Nullify and Explosive Restabilization in the last half minute of
    // the burn (4 of 5 top kills showed red here). On a kill, the last 30 s are shown but not judged: it's the race, not a mistake)
    const endRace = (t) => r.item.kill && t >= dur - 30;
    const rows = [...by.values()].filter((o) => o.mx >= cap || diedNear(o.g, o.t, 4)).sort((a, b) => b.mx - a.mx).map((o) => { const d = diedNear(o.g, o.t, 4), late = endRace(o.t);
      if (d && !late) M(o.t, pname(o.g), 'Nullify', 'High', 'Died with ' + o.mx + ' Nullify stacks.', 'Dodge the Nullshards the gates spray: ' + cap + ' stacks kill on ' + diff + '.');
      if (late) return [{ p: pname(o.g) }, { t: o.t }, { txt: o.mx + ' of ' + cap + ' stacks', dim: true, sub: 'the last 30 s of the kill' }, d ? { txt: 'died', dim: true } : { txt: '—', dim: true }];
      return [{ p: pname(o.g) }, { t: o.t }, { txt: o.mx + ' of ' + cap + ' stacks', bad: !!d, warn: !d }, d ? { txt: 'died', bad: true } : { txt: '—', dim: true }]; });
    const ng = aur([KX.negation]).filter((e) => h.isPlayer(e.dst)), rs = clusters(dmgId(KX.restab), 1.5);
    for (const e of ng.filter((x) => x.op === 'apply')) { const rm = ng.find((x) => x.op === 'remove' && x.dst === e.dst && x.t > e.t), end = rm ? rm.t : dur, n = rs.filter((c) => c.t >= e.t && c.t <= end + 1).length, need = mythic ? 3 : 1;
      const dd = diedNear(e.dst, end - 0.3, 1.5);
      if (endRace(end)) { rows.push([{ p: pname(e.dst), sub: 'Negation' }, { t: e.t }, { txt: pl(n, 'gate') + ' closed', dim: true, sub: 'the last 30 s of the kill' }, dd ? { txt: 'died', dim: true } : { txt: '—', dim: true }]); continue; }
      if (n < need && rm) M(e.t, pname(e.dst), 'Negation', 'High', 'Negation ended' + (dd ? ' with their death' : '') + ' after closing ' + pl(n, 'Null Gate') + (mythic ? ' (Mythic needs 3).' : '.'), 'With Negation, run into the Null Gates to close them before it runs out, with a defensive for each Explosive Restabilization.');
      rows.push([{ p: pname(e.dst), sub: 'Negation' }, { t: e.t }, { txt: pl(n, 'gate') + ' closed', bad: !!rm && n < need, warn: !rm && n < need }, dd ? { txt: 'died', bad: true } : { txt: '—', dim: true }]); }
    if (rows.length) sections.push({ id: 'kxgate', title: 'Null Gates (Dodge the shards)', place: 'Null Gates: Nullify kept under ' + cap + ', gates closed', spell: [KX.gate[0], 'Null Gate'], verdict: rows.some((x) => x[2].bad || x[3].bad) ? 'bad' : rows.some((x) => x[2].warn) ? 'warn' : 'good',
      summary: 'Gates spray Nullshards; each hit is a Nullify stack, and ' + cap + ' kill on ' + diff + '. It shows who reached ' + cap + ' or died with stacks, and how many gates each Negation tank closed' + (mythic ? ' (3 on Mythic)' : '') + '.', cols: ['Player', 'When', 'Result', 'Died'], rows });
    // ---- 8. the DPS check: Eightfold Eclipse, the 8th wipes the raid ----
    const ec = clusters(dmgId(KX.eclipse), 2).filter((c) => c.t >= howl), n = ec.length, kill = r.item.kill;
    if (n >= 8 && !kill) M(ec[7].t, 'Raid', 'Eightfold Eclipse', 'High', 'The eighth Eightfold Eclipse wiped the raid: Kith\'ix needed more damage in P2.', 'Save Bloodlust (or your 2-minute cooldowns), potions and every cooldown for P2.');
    sections.push({ id: 'kxdps', title: 'Last Light (Kill before the 8th Eclipse)', place: 'P2: Kith\'ix dead before the eighth Eclipse', spell: [KX.lastLight[0], 'Last Light'], verdict: n >= 8 && !kill ? 'bad' : n >= 7 ? 'warn' : 'good', info: kill && n < 7,
      summary: 'P2 started at ' + T(howl) + '. Every Eightfold Eclipse hits the raid, and the eighth one wipes it.', cols: ['What', 'When', 'Result', ''],
      rows: [[{ txt: 'P2 (Stygian Howl)' }, { t: howl }, { txt: T(howl) + ' into the pull' }, { txt: '' }], [{ txt: kill ? 'Kith\'ix died' : 'The pull ended' }, { t: dur }, { txt: (kill ? 'after ' : '') + n + ' of 8 Eclipses', bad: n >= 8 && !kill, warn: n === 7 }, { txt: Math.round(dur - howl) + ' s in P2', dim: true }]] });
  }

  // ---- 9. avoidable damage ----
  const av = avoidPanel(ev, r, h, [
    { n: ['twisted appendage'], label: 'Twisted Appendage', harm: 'Medium', why: 'the tentacle slam circles' },
    { n: ['venom roar'], label: 'Venom Roar', harm: 'Medium', why: 'the Venomous Hulk\'s cone (it should face away)' },
    { n: ['voidscar'], label: 'Voidscar', harm: 'Medium', why: 'walking into a Voidscar puddle (knockback)' },
    { n: ['nullshards'], label: 'Nullshards', harm: 'Medium', why: 'the shards a Null Gate sprays (each one is a Nullify stack)' },
  ]);
  if (av) sections.push(av);

  const diag = [['Voidswarm', KX.swarm[0]], ['Dark Frenzy', KX.frenzy[0]], ['Digestive Juices', KX.juices], ['Mindsting', KX.mindsting], ['Extinguish', KX.extinguish], ["Light's Embrace", KX.embrace[0]], ['Unspeakable Horrors', KX.horrors],
    ['Overwhelming Fear', KX.fear], ['Fear scream', KX.scream], ['Dark Devastation', KX.devCast], ['Devastated', KX.devastated], ['Voidscar', KX.voidscar], ['Suffocating Darkness', KX.suffocate[0]], ['Divine Radiance', KX.radiance[1]], ['Abyssal Grasp', KX.grasp],
    ['Eclipse Fragment', KX.fragment], ['Stygian Howl', KX.howl], ['Luminous Grace', KX.grace], ['Eightfold Eclipse', KX.eclipse[1]], ['Null Gate', KX.gate[0]], ['Nullify', KX.nullify[0]], ['Nullshards', KX.shards], ['Negation', KX.negation], ['Explosive Restabilization', KX.restab[0]]].map(([name, id]) => {
    const c = { cast: 0, dmg: 0, aura: 0, other: 0 };
    for (const x of ev) if (x.id === id) { if (x.k === 'cast' || x.k === 'start') c.cast++; else if (x.k === 'dmg') c.dmg++; else if (x.k === 'aura') c.aura++; else c.other++; }
    return { name, id, ...c, total: c.cast + c.dmg + c.aura + c.other };
  });
  { const pc = paceCard(ev, r, h, mistakes, "Kith'ix", { inter, howl }); if (pc) sections.push(pc); } /* (Pace, Oct 22: boss coverage) */
  return { diag, title: diff + ' audit: Kith\'ix', reached: howl != null ? 'P2' : inter.length ? 'After intermission ' + inter.length : 'P1', phases, marks, sections, mistakes,
    legend: 'By phase: the add sets, beetles, Extinguish, fears and tanks in P1, Abyssal Grasp and fragments in the intermissions, then the Null Gates and the DPS check in P2.', note: heroic ? '' : 'Heroic and Mythic checks (eggs, fragments) are hidden on this difficulty.' };
}

function buildNekzali(ev, r, h) {
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const dur = r.duration, mythic = r.item.diff === 'Mythic', burnOn = mythic || r.item.diff === 'Heroic', pname = (g) => h.name(g), T = h.fmtT;
  const fmtM = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1e3) + 'k');
  const mistakes = [], sections = [], marks = [];
  // (_nz: what the NSRT note check needs: who was in the well for each Drowned Echo, who soaked each Hungering Pyre)
  const _nz = { depths: [], pyres: [] };
  const M = (t, player, mech, severity, detail, fix, map) => mistakes.push({ t, player, mechanic: mech, id: 0, severity, detail, fix, ...(map ? { map } : {}) });
  const has = (e, ids) => [].concat(ids).includes(e.id);
  const dmgId = (ids) => ev.filter((e) => e.k === 'dmg' && has(e, ids) && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const AUR = new Map(), aur = (id) => { const k = String(id); if (!AUR.has(k)) AUR.set(k, ev.filter((e) => e.k === 'aura' && has(e, id)).sort((a, b) => a.t - b.t)); return AUR.get(k); };
  const gap1 = (l) => l.sort((a, b) => a - b).filter((t, i, a) => !i || t - a[i - 1] > 1);
  const castOk = (ids) => gap1(ev.filter((e) => e.k === 'cast' && has(e, ids)).map((e) => e.t));
  const starts = (ids) => gap1(ev.filter((e) => e.k === 'start' && has(e, ids)).map((e) => e.t));
  const frames = (t0, t1) => h.frames(Math.max(0, t0), Math.min(dur, t1), 0.25);
  const isTank = (g) => h.role(g) === 'tank';
  const posPts = (t) => (h.frames(t, t, 0.2)[0] || { pts: h.snap(t) }).pts;
  const posOf = (g, t) => posPts(t).find((q) => q.guid === g);
  const lastPos = (g) => { const u = r.positions.get(g); return u && u.pts.length ? u.pts[u.pts.length - 1] : null; };
  // (an aura on a player at t: applied, or a stack added, and not removed since)
  const upAt = (id, g, t) => { let on = false; for (const e of aur(id)) { if (e.dst !== g || e.t >= t - 0.05) continue; on = e.op !== 'remove'; } return on; };
  const stacksAt = (id, g, t) => { let n = 0; for (const e of aur(id)) { if (e.dst !== g || e.t >= t - 0.05) continue; n = e.op === 'remove' ? 0 : e.op === 'apply' ? Math.max(1, e.stacks || 1) : Math.max(n, e.stacks || n + 1); } return n; };
  const BOSS = "Nek'zali the Soulcoiler", players = [...r.players.values()].map((p) => p.guid).filter((g) => h.isPlayer(g));
  // the well's centre: where she stands to channel Soulcoil Ignition (she teleports into it)
  const ignAt = ev.find((e) => e.k === 'cast' && has(e, [NZ.ignition, NZ.ignitionCh]) && e.x != null);
  const W0 = ignAt ? { x: ignAt.x, y: ignAt.y } : { x: 0, y: 206.5 };
  const wellD = (p) => (p ? Math.hypot(p.x - W0.x, p.y - W0.y) : null);
  const wellRing = { x: W0.x, y: W0.y, r: 15, ...mcol('Soulcoil Well', 0.12), fx: 'zone', label: '', legend: 'the Soulcoil Well (about 15 yd)' };
  const spot = (x, y, color, legend, cn) => ({ x, y, r: 3, color, fill: color + '66', label: '', cn, legend });

  // ---- phases: P1, the intermission (Ritual of Awakening at 50%), P2 (Uncoiling) ----
  const ritT = (ev.find((e) => (e.k === 'start' || e.k === 'cast') && e.id === NZ.ritual) || ev.find((e) => e.k === 'aura' && e.id === NZ.ritualAura && e.op === 'apply') || {}).t ?? null;
  const p2T = (ev.find((e) => e.k === 'aura' && e.id === NZ.uncoil && e.op === 'apply') || {}).t ?? null;
  const phases = [{ name: 'P1', start: 0, end: ritT ?? dur }];
  if (ritT != null) { phases.push({ name: 'Intermission', start: ritT, end: p2T ?? dur }); marks.push({ t: ritT, label: 'Intermission', id: NZ.ritual, kind: 'phase' }); }
  if (p2T != null) { phases.push({ name: 'P2', start: p2T, end: dur }); marks.push({ t: p2T, label: 'P2', id: NZ.uncoil, kind: 'phase' }); }
  const phOf = (t) => (p2T != null && t >= p2T - 0.5 ? 'P2' : ritT != null && t >= ritT - 0.5 ? 'the intermission' : 'P1');
  // her energy, from her casts (Soulcoil Ignition gives 25, each feed of the well 5; P2 starts from empty)
  const en = ev.filter((e) => e.k === 'cast' && e.pw != null && e.pwMax === 100 && e.srcName === BOSS).map((e) => ({ t: e.t, v: e.pw })).sort((a, b) => a.t - b.t);
  const energyAt = (t) => { let v = null; for (const s of en) { if (s.t > t + 0.05) break; v = s.v; } return v; };
  const enr = aur(NZ.rage).find((e) => e.op === 'apply' && !h.isPlayer(e.dst));

  // ---- the well's feeds: every Soulcoil Rite on the raid that isn't from Ignition or Invoke ----
  const riteA = aur(NZ.rite).filter((e) => (e.op === 'apply' || e.op === 'dose') && h.isPlayer(e.dst));
  const batches = []; for (const e of riteA) { const b = batches[batches.length - 1]; if (b && e.t - b.t1 < 0.5) { b.t1 = e.t; b.who.add(e.dst); } else batches.push({ t: e.t, t1: e.t, who: new Set([e.dst]) }); }
  const ignSt = starts(NZ.ignition), invC = castOk(NZ.invoke);
  const ignOf = (t) => ignSt.find((s) => t >= s - 0.5 && t <= s + 14);
  const feeds = batches.filter((b) => b.who.size >= 5 && !ignOf(b.t) && !invC.some((c) => Math.abs(b.t - c) < 1.5)).map((b) => ({ t: b.t, by: null, died: null }));

  // ---- 1. Restless Amani: sets of adds walking to the well; break the magic shield, kill them before the water ----
  const vesA = aur(NZ.vessel).filter((e) => e.op === 'apply' && !h.isPlayer(e.dst));
  const amani = new Map();
  for (const e of aur(NZ.shield)) {
    if (h.isPlayer(e.dst)) continue;
    if (e.op === 'apply' && !amani.has(e.dst)) amani.set(e.dst, { g: e.dst, t: e.t, off: null, died: null, fed: null, seen: e.t });
    const a = amani.get(e.dst); if (a && e.op === 'remove' && a.off == null) a.off = e.t;
  }
  // (a corpse coming back is a new Amani that spawns the moment its corpse's Vessel of Awakening starts, read from Mythic
  // pulls; in a real log it can keep the corpse's own GUID: either way it's left out of the sets)
  const revived = new Set(vesA.map((e) => e.dst)), revOf = new Map();
  for (const v of vesA) { if (revOf.has(v.dst)) continue; const c = [...amani.values()].filter((a) => !revived.has(a.g) && Math.abs(a.t - v.t) < 0.4).sort((x, y) => Math.abs(x.t - v.t) - Math.abs(y.t - v.t))[0]; if (c) { revived.add(c.g); revOf.set(v.dst, c.g); } }
  for (const g of revived) amani.delete(g);
  for (const e of ev) {
    if (e.k === 'die' && amani.has(e.guid)) { const a = amani.get(e.guid); if (a.died == null) a.died = e.t; }
    for (const g of [e.src, e.dst]) if (g && amani.has(g)) { const a = amani.get(g); a.seen = Math.max(a.seen, e.t); }
  }
  for (const a of amani.values()) { const p = lastPos(a.g); if (p) a.seen = Math.max(a.seen, p[0]); }
  // (an Amani that reached the well vanishes as the raid takes the Rite (its shield drops at the water): the one last seen
  // closest to it; a player dying in the well feeds it too)
  for (const f of feeds) {
    const cand = [...amani.values()].filter((a) => a.fed == null && a.died == null && a.t < f.t && a.seen >= f.t - 3 && a.seen <= f.t + 1.5).sort((x, y) => Math.abs(x.seen - f.t) - Math.abs(y.seen - f.t));
    if (cand.length) { cand[0].fed = f.t; f.by = cand[0]; continue; }
    f.died = r.deaths.find((d) => d.t >= f.t - 2 && d.t <= f.t + 0.5 && h.isPlayer(d.guid)) || null;
  }
  const amSets = []; for (const a of [...amani.values()].sort((x, y) => x.t - y.t)) { const s = amSets[amSets.length - 1]; if (s && a.t - s.t < 6) s.list.push(a); else amSets.push({ t: a.t, list: [a] }); }
  const amGroups = amSets.map((s, i) => {
    const rows = s.list.map((a, j) => {
      const lp = lastPos(a.g), at = a.died != null ? posPts(a.died).find((q) => q.guid === a.g) || (lp ? { x: lp[1], y: lp[2] } : null) : lp ? { x: lp[1], y: lp[2] } : null, d = wellD(at);
      const res = a.fed != null ? { txt: 'reached the well', bad: true, sub: '+5 energy, a Soulcoil Rite on the raid' }
        : a.died != null ? { txt: 'killed after ' + Math.round(a.died - a.t) + ' s', sub: d != null ? Math.round(d) + ' yd from the well\'s center' : '' }
        : lp && lp[0] >= dur - 3 ? { txt: 'alive when the pull ended', dim: true } : { txt: 'gone (no kill seen)', dim: true, sub: 'burned, or out of the log' };
      return { a, at, row: [{ txt: 'Amani ' + (j + 1) }, { t: a.t }, a.off != null ? { txt: 'broken after ' + Math.round(a.off - a.t) + ' s' } : { txt: a.died != null ? '—' : 'never broken', dim: a.died != null, warn: a.died == null && a.fed != null }, res, { txt: '' }] };
    });
    const tEnd = Math.min(dur, Math.max(...s.list.map((a) => a.fed ?? a.died ?? s.t + 20)) + 0.5);
    const fed = s.list.filter((a) => a.fed != null);
    for (const a of fed) M(a.fed, 'Raid', 'Restless Amani', 'High', 'A Restless Amani reached the Soulcoil Well: Nek\'zali gained 5 energy and the raid took a Soulcoil Rite' + (burnOn ? ' and a Ritual Burn stack.' : '.'), 'Break each Amani\'s magic shield (Gravebound Advance) with magic damage, then kill it before it reaches the water.');
    const rings = [wellRing].concat(rows.filter((x) => x.at).map((x) => x.a.fed != null ? spot(x.at.x, x.at.y, '#ff5a4f', 'an Amani that reached the well', 'Red dot') : spot(x.at.x, x.at.y, '#2fd15a', 'where an Amani died', 'Green dot')));
    const whole = [{ txt: 'Whole set', sub: 'where each one died, on one map', dim: true }, { t: s.t }, { txt: '' }, { txt: '' },
      { map: { t: tEnd, title: 'Restless Amani set ' + (i + 1) + ' at ' + T(s.t), pts: h.snap(tEnd), rings, frames: frames(s.t, tEnd) } }];
    return { title: 'Set ' + (i + 1) + ' (' + phOf(s.t) + ')', t: s.t, bad: fed.length > 0, warn: false, sub: s.list.length + ' Amani' + (fed.length ? ', ' + fed.length + ' reached the well' : ', none reached the well'), rows: [whole].concat(rows.map((x) => x.row)) };
  });
  if (amGroups.length) sections.push({ id: 'amani', title: 'Restless Amani (Kill before the well)', place: 'Restless Amani (adds): none reach the well', spell: [NZ.shield, 'Restless Amani'], verdict: amGroups.some((g) => g.bad) ? 'bad' : 'good',
    summary: amani.size + ' Restless Amani in ' + pl(amGroups.length, 'set') + '. It shows when each one\'s shield broke, and whether it died or reached the well.', cols: ['Add', 'Spawned', 'Shield', 'Result', ''], groups: amGroups, rows: [] });

  // ---- 2. Soulcoil Ignition: five Rites on the raid while Anguished Echoes rain out of the well ----
  const echoHits = dmgId(NZ.echoes);
  const igGroups = ignSt.map((s, i) => {
    // (the circles keep landing for a few seconds after the channel: read from Mythic pulls, up to about 17 s after it starts)
    const cut = ritT != null && s < ritT && ritT < s + 12, t1 = Math.min(dur, s + 18);
    const burned = burnOn ? players.filter((g) => !r.deaths.some((d) => d.guid === g && d.t <= s) && stacksAt(NZ.burn, g, s) > 0) : [];
    const src = feeds.filter((f) => f.t < s && f.t > s - 60).map((f) => f.by ? 'an Amani at ' + T(f.t) : 'the well fed at ' + T(f.t));
    const by = new Map(); for (const e of echoHits.filter((e) => e.t >= s && e.t <= t1)) { let o = by.get(e.dst); if (!o) by.set(e.dst, o = { g: e.dst, t: e.t, n: 0, last: -9, amt: 0 }); if (e.t - o.last > 1) o.n++; o.last = e.t; o.amt += e.raw || e.amt; }
    const died = r.deaths.filter((d) => d.t >= s && d.t <= t1 && h.isPlayer(d.guid));
    if (burned.length) M(s, 'Raid', 'Soulcoil Ignition', 'Medium', pl(burned.length, 'player') + ' went into Soulcoil Ignition with Ritual Burn up' + (src.length ? ' (from ' + src.join(', ') + ')' : '') + ', so every Rite hit them harder.', 'Go into Ignition with no Ritual Burn, so let no Amani into the well in the minute before.');
    for (const o of by.values()) { const d = died.find((x) => x.guid === o.g); if (isTank(o.g) && !d) continue; /* (Mechanics audit, Oct 24: top kills do this and win, so living through it is a note; a death stays red) */ M(o.t, pname(o.g), 'Anguished Echoes', d ? 'High' : o.n >= 3 ? 'Medium' : 'Low', 'Hit by ' + (o.n > 1 ? o.n + ' Anguished Echoes circles' : 'an Anguished Echoes circle') + ' during Soulcoil Ignition' + (d ? ', and died.' : '.'), 'Watch for the circles raining from the well during Ignition and step out before they land.'); }
    const e0 = energyAt(s - 0.1), e1 = energyAt(t1);
    const rows = [[{ txt: 'Going in' }, { t: s }, burnOn ? (burned.length ? { txt: pl(burned.length, 'player') + ' with Ritual Burn', warn: true, sub: src.length ? 'from ' + src.join(', ') : '' } : { txt: 'no Ritual Burn' }) : { txt: '—', dim: true },
      died.length ? { txt: died.map((d) => d.player).join(', ') + ' died', bad: true } : { txt: '—', dim: true }, { txt: e0 != null && e1 != null ? 'energy ' + e0 + ' to ' + e1 : '', dim: true }]]
      .concat([...by.values()].map((o) => { const d = died.find((x) => x.guid === o.g); return [{ p: pname(o.g), sub: isTank(o.g) ? 'tank' : '' }, { t: o.t }, { txt: pl(o.n, 'circle hit'), warn: !d && o.n >= 3 && !isTank(o.g), bad: !!d, dim: !d && (o.n < 3 || isTank(o.g)), sub: fmtM(o.amt) + (isTank(o.g) && !d ? ', a tank: only a note' : '') /* (Oct 22: a tank's hits stay a note, even 3 of them; a top kill showed red for it) */ }, d ? { txt: 'died', bad: true } : { txt: '—', dim: true }, { txt: '' }]; }));
    return { title: 'Soulcoil Ignition ' + (i + 1) + (cut ? ' (cut short by the intermission)' : ''), t: s, bad: rows.some((x) => x[2].bad || x[3].bad), warn: rows.some((x) => x[2].warn), sub: (by.size ? pl(by.size, 'player') + ' hit by the circles' : 'nobody hit by the circles') + (burned.length ? ', ' + burned.length + ' with Ritual Burn' : ''), rows };
  });
  if (igGroups.length) sections.push({ id: 'ignition', title: 'Soulcoil Ignition (Dodge the circles)', place: 'Soulcoil Ignition (boss channel): no Ritual Burn, circles dodged', spell: [NZ.ignition, 'Soulcoil Ignition'], verdict: igGroups.some((g) => g.bad) ? 'bad' : igGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(igGroups.length, 'Soulcoil Ignition') + '. It shows any Ritual Burn going in' + (burnOn ? '' : ' (Heroic and Mythic only)') + ', who the Anguished Echoes circles hit, and her energy before and after.', cols: ['Who', 'When', 'Result', 'Died', ''], groups: igGroups, rows: [] });

  // ---- 3. Mythic: Grasping Depths, a Drowned Echo in the well twice a phase; a team goes in, kicks every Curse ----
  if (mythic) {
    const gd = aur(NZ.depths).filter((e) => !h.isPlayer(e.dst)), wins = [];
    for (const e of gd) { if (e.op === 'apply') wins.push({ t0: e.t, t1: null }); else if (e.op === 'remove' && wins.length && wins[wins.length - 1].t1 == null) wins[wins.length - 1].t1 = e.t; }
    const coil = dmgId(NZ.coil).concat(ev.filter((e) => e.k === 'aura' && e.id === NZ.coilDeb && e.op === 'apply' && h.isPlayer(e.dst))), spir = dmgId(NZ.spirit), cuSt = starts(NZ.curse), cuOk = castOk(NZ.curse);
    const dpGroups = wins.map((w, i) => {
      const t1 = w.t1 ?? dur, team = [...new Set(coil.filter((e) => e.t >= w.t0 && e.t <= t1 + 1).map((e) => e.dst))];
      _nz.depths.push({ i: i + 1, t0: w.t0, t1, team: team.map(pname), ph: phOf(w.t0) });
      const rows = [];
      for (const [k, cs] of cuSt.filter((t) => t >= w.t0 - 0.5 && t <= t1 + 0.5).entries()) {
        const kick = r.interrupts.find((x) => x.id === NZ.curse && x.t >= cs - 0.2 && x.t <= cs + 4.5), off = !kick && cuOk.find((t) => t >= cs && t <= cs + 5);
        if (off) M(off, 'Raid', "Soulcoiler's Curse", 'High', "Soulcoiler's Curse got off. Everyone in the well was thrown out and Soulcoiled.", 'Kick every Soulcoiler\'s Curse. Give the well team two kickers in turn.');
        rows.push([{ txt: "Soulcoiler's Curse " + (k + 1) }, { t: cs }, kick ? { txt: 'kicked' } : off ? { txt: 'got off', bad: true, sub: 'the well team was thrown out' } : { txt: 'cast stopped', dim: true }, kick ? { p: kick.player } : { txt: '—', dim: true }, { txt: '' }]);
      }
      for (const g of team) {
        const first = coil.find((e) => e.dst === g && e.t >= w.t0), ex = first && upAt(NZ.exhaust, g, first.t);
        const hits = spir.filter((e) => e.dst === g && e.t >= w.t0 && e.t <= t1 + 1); let n = 0, last = -9; for (const e of hits) { if (e.t - last > 1.5) n++; last = e.t; }
        const d = r.deaths.find((x) => x.guid === g && x.t >= w.t0 && x.t <= t1 + 1);
        if (!ex && !n && !d) continue;
        // (a single Swirling Spirit touch is common even on kills: shown, not judged; two or more in one Echo are)
        if (ex) M(first.t, pname(g), 'Grasping Depths', 'Low', 'Went into the well with Soul Exhaustion still on (300% more damage from the well).', 'Keep the two well teams apart. The team that just left sits out the next Drowned Echo.');
        if (n >= 2 || (n && d)) M(hits[0].t, pname(g), 'Swirling Spirit', d ? 'High' : 'Medium', 'Hit by ' + (n === 1 ? 'a Swirling Spirit' : n + ' Swirling Spirits') + ' in the well' + (d ? ', and died.' : '.'), 'Watch the spirits circling inside the well and step around them. Their damage stacks.');
        rows.push([{ p: pname(g) }, { t: first ? first.t : w.t0 }, d ? { txt: 'died in the well', bad: true, sub: d.ability || '' } : n ? { txt: pl(n, 'Swirling Spirit hit'), warn: n >= 2, dim: n < 2 } : { txt: 'in with Soul Exhaustion', warn: true }, ex && (n || d) ? { txt: 'went in with Soul Exhaustion', warn: true } : { txt: '—', dim: true }, { txt: '' }]);
      }
      // (nobody going in for the last Echo of a kill is the raid burning the boss: shown, not judged)
      const burn = w.t1 == null && r.item.kill;
      const head = [{ txt: 'Drowned Echo' }, { t: w.t0 }, w.t1 != null ? { txt: 'dead after ' + Math.round(w.t1 - w.t0) + ' s' } : { txt: 'alive when the pull ended', dim: true }, team.length ? { ps: team.map(pname) } : burn ? { txt: 'nobody went in', dim: true, sub: 'left for the burn' } : w.t1 != null && w.t1 - w.t0 <= 45 ? { txt: 'nobody went in', dim: true, sub: 'it died anyway' } : { txt: 'nobody went in', warn: true }, { txt: '' }];
      rows.sort((a, b) => a[1].t - b[1].t);
      return { title: 'Grasping Depths ' + (i + 1) + ' (' + phOf(w.t0) + ')', t: w.t0, bad: rows.some((x) => x[2].bad), warn: rows.some((x) => x[2].warn || x[3].warn) || !!head[3].warn, sub: (team.length ? pl(team.length, 'player') + ' in the well' : 'nobody in the well') + (w.t1 != null ? ', Echo dead in ' + Math.round(w.t1 - w.t0) + ' s' : ''), rows: [head].concat(rows) };
    });
    if (dpGroups.length) sections.push({ id: 'depths', title: 'Grasping Depths (Kill the Echo, kick the Curse)', place: 'Grasping Depths (add): the well team', spell: [NZ.curse, "Soulcoiler's Curse"], verdict: dpGroups.some((g) => g.bad) ? 'bad' : dpGroups.some((g) => g.warn) ? 'warn' : 'good',
      summary: dpGroups.length + (dpGroups.length === 1 ? ' Drowned Echo' : ' Drowned Echoes') + '. It shows who went into the well, every Soulcoiler\'s Curse and its kick, and any Swirling Spirit hits or Soul Exhaustion in the team.', cols: ['What', 'When', 'Result', 'Who', ''], groups: dpGroups, rows: [] });
  }

  // ---- 4. Essence Rend: a dispellable damage over time; a Latent Cultist puddle spawns where it ends ----
  const rdA = aur(NZ.rend).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), rdR = aur(NZ.rend).filter((e) => e.op === 'remove' && h.isPlayer(e.dst));
  const disp = ev.filter((e) => e.k === 'dispel' && /essence rend/i.test(e.spell || ''));
  const rdSets = []; for (const e of rdA) { const s = rdSets[rdSets.length - 1]; if (s && e.t - s.t < 1.5) s.list.push(e); else rdSets.push({ t: e.t, list: [e] }); }
  const rdGroups = rdSets.map((s, i) => {
    const info = s.list.map((e) => {
      const rm = rdR.find((x) => x.dst === e.dst && x.t >= e.t), tE = rm ? rm.t : Math.min(dur, e.t + 15), by = rm && disp.find((x) => x.dst === e.dst && Math.abs(x.t - rm.t) < 0.4);
      const p = posOf(e.dst, tE), d = wellD(p), died = r.deaths.find((x) => x.guid === e.dst && x.t >= e.t && x.t <= tE + 0.3);
      return { g: e.dst, t: e.t, tE, by, p, d, died, near: !died && d != null && d < NZ_EDGE };
    });
    for (const o of info.filter((x) => x.near)) M(o.tE, pname(o.g), 'Essence Rend', 'Low', 'Essence Rend ended ' + Math.round(o.d) + ' yards from the well\'s center, so the Latent Cultist puddle landed in the way.', 'Walk to the side of the room with Essence Rend and get dispelled there. The puddles stay for the whole fight and move in P2.');
    const rows = info.map((o) => [{ p: pname(o.g) }, { t: o.tE }, o.died ? { txt: 'died with it', bad: true } : o.by ? { txt: 'dispelled after ' + (o.tE - o.t).toFixed(1) + ' s', sub: 'by ' + o.by.src } : { txt: o.tE - o.t >= 14 ? 'ran out' : 'ended after ' + (o.tE - o.t).toFixed(1) + ' s' },
      o.d != null ? { txt: Math.round(o.d) + ' yd from the well', warn: o.near } : { txt: '—', dim: true }, { txt: '' }]);
    const tm = Math.max(...info.map((o) => o.tE)) + 0.3;
    const rings = [wellRing].concat(info.filter((o) => o.p).map((o) => spot(o.p.x, o.p.y, o.near ? '#e6b450' : '#a6acb8', o.near ? 'a Latent Cultist puddle in the way' : 'where a Latent Cultist puddle landed', o.near ? 'Amber dot' : 'Grey dot')));
    const whole = [{ txt: 'Whole cast', sub: 'where each puddle landed, on one map', dim: true }, { t: s.t }, { txt: '' }, { txt: '' }, { map: { t: tm, title: 'Essence Rend ' + (i + 1) + ' at ' + T(s.t), pts: h.snap(tm), rings, hl: info.map((o) => o.g), hlLabel: 'had Essence Rend', frames: frames(s.t, tm + 0.5) } }];
    return { title: 'Essence Rend ' + (i + 1) + ' (' + phOf(s.t) + ')', t: s.t, bad: rows.some((x) => x[2].bad), warn: rows.some((x) => x[3].warn), sub: pl(info.length, 'player') + (info.some((o) => o.near) ? ', ' + info.filter((o) => o.near).length + ' puddle' + (info.filter((o) => o.near).length > 1 ? 's' : '') + ' in the way' : ', every puddle at the side'), rows: [whole].concat(rows) };
  });
  if (rdGroups.length) sections.push({ id: 'rend', title: 'Essence Rend (Dispel at the side)', place: 'Essence Rend (dispel): puddles at the side', spell: [NZ.rend, 'Essence Rend'], verdict: rdGroups.some((g) => g.bad) ? 'bad' : rdGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(rdA.length, 'Essence Rend') + '. It shows who dispelled each one, and how far from the well its Latent Cultist puddle landed.', cols: ['Player', 'Ended', 'Removed', 'Puddle', ''], groups: rdGroups, rows: [] });

  // ---- 5. Possession Barrage: spirits at the tank, raid damage that falls off with the tank's distance ----
  const pbHits = dmgId(NZ.barrageHit), pbAura = aur(NZ.barrage).filter((e) => e.op === 'apply' && h.isPlayer(e.dst));
  const pbRows = ev.filter((e) => e.k === 'cast' && e.id === NZ.barrage).sort((a, b) => a.t - b.t).filter((e, i, a) => !i || e.t - a[i - 1].t > 1).map((c) => {
    const tk = pbAura.find((e) => Math.abs(e.t - c.t) < 0.6), tp = tk && posOf(tk.dst, c.t), d = tp && c.x != null ? Math.hypot(tp.x - c.x, tp.y - c.y) : null;
    const hits = pbHits.filter((e) => e.t >= c.t && e.t <= c.t + 4), tot = hits.reduce((s, e) => s + (e.raw || e.amt), 0), who = new Set(hits.map((e) => e.dst));
    const close = d != null && d < 25;
    if (close) M(c.t, pname(tk.dst), 'Possession Barrage', 'Low', 'Took Possession Barrage ' + Math.round(d) + ' yards from Nek\'zali, so the spirits hit the raid harder.', 'Step 30 or more yards away from the boss for Possession Barrage, away from the raid.');
    // (Oct 21, the guide's rule: nobody stands between the boss and the tank, or the spirits burst on them early, near the boss,
    // and hit the raid much harder. In the path = within 5 yards of the line from Nek'zali to the tank, a second after the cast)
    const inPath = [];
    if (d != null && d > 8) {
      const ux = (tp.x - c.x) / d, uy = (tp.y - c.y) / d;
      for (const p of h.snap(c.t + 1)) { if (p.kind !== 'player' || p.guid === tk.dst) continue;
        const along = (p.x - c.x) * ux + (p.y - c.y) * uy, off = Math.abs((p.x - c.x) * uy - (p.y - c.y) * ux);
        if (along > 4 && along < d - 3 && off <= 5) inPath.push(p.guid); }
    }
    for (const g of inPath) M(c.t, pname(g), 'Possession Barrage', 'Low', 'Stood between Nek\'zali and the tank as Possession Barrage went out, so the spirits could burst on them early.', 'Stay behind the boss for Possession Barrage: nobody between Nek\'zali and the tank running out.');
    /* (Mechanics audit, Oct 24: 7 of 10 top kills had the tank closer than 25 yards (about 450k each instead of 250k) and still killed, so it's a note;
       someone in the spirits' path stays yellow (no top kill had that)) */
    return [{ p: tk ? pname(tk.dst) : '?' }, { t: c.t }, d != null ? { txt: Math.round(d) + ' yd from the boss', sub: close ? 'closer than 25 yards: more raid damage' : '' } : { txt: '—', dim: true }, { txt: who.size ? fmtM(tot / who.size) + ' each on average' : '—', sub: who.size ? pl(who.size, 'player') + ' hit' : '', dim: !who.size },
      inPath.length ? { txt: 'in the path: ' + inPath.map(pname).join(', '), warn: true } : { txt: d != null ? 'path clear' : '', dim: true }];
  });
  if (pbRows.length) sections.push({ id: 'barrage', title: 'Possession Barrage (Tank steps away)', place: 'Possession Barrage (raid hit): tank far from the boss', spell: [NZ.barrage, 'Possession Barrage'], verdict: pbRows.some((x) => x[4].warn) ? 'warn' : 'good',
    summary: pl(pbRows.length, 'Possession Barrage') + '. It shows how far the tank stood from Nek\'zali when it went out, what it cost the raid, and anyone standing in the path of the spirits, between her and the tank.', cols: ['Tank', 'When', 'Distance', 'Raid damage', 'Path'], rows: pbRows });

  // ---- 6. the intermission: corpses coming back, the Hungering Pyre soaks, Soul Transfer, the Echoes of Jawae ----
  if (ritT != null) {
    const iEnd = p2T ?? dur, rows = [];
    const vA = aur(NZ.vessel).filter((e) => e.op === 'apply' && !h.isPlayer(e.dst)), waves = [];
    for (const e of vA) { const w = waves[waves.length - 1]; if (w && e.t - w.t1 < 3) { w.t1 = e.t; w.g.add(e.dst); } else waves.push({ t: e.t, t1: e.t, g: new Set([e.dst]) }); }
    for (const w of waves) {
      const n = w.g.size, died = r.deaths.filter((d) => d.t >= w.t && d.t <= w.t1 + 8 && /vessel of awakening/i.test(d.ability || ''));
      if (n >= 3 || died.length) M(w.t, 'Raid', 'Vessel of Awakening', 'High', pl(n, 'Amani corpse') + ' came back at once' + (died.length ? ': ' + pl(died.length, 'player') + ' died to them.' : '.'), 'Burn the corpses during the intermission with the Hungering Pyre soak and the Slithering Flames, so at most one comes back at a time.');
      else if (n === 2) M(w.t, 'Raid', 'Vessel of Awakening', 'Medium', '2 Amani corpses came back at once.', 'Burn more corpses during the intermission. One coming back at a time is the goal.');
      // (where each came back: the corpse's position, or the new Amani's first one)
      const at = [...w.g].map((g) => { for (const x of [g, revOf.get(g)]) { const u = x && r.positions.get(x); if (u && u.pts.length) { const p = u.pts.find((q) => q[0] >= w.t - 1) || u.pts[u.pts.length - 1]; return { x: p[1], y: p[2] }; } } return null; }).filter(Boolean);
      rows.push([{ txt: 'Corpses back' }, { t: w.t }, { txt: n + ' at once', bad: n >= 3, warn: n === 2 }, died.length ? { txt: pl(died.length, 'death'), bad: true } : { txt: '—', dim: true },
        at.length ? { map: { t: w.t1 + 0.3, title: 'Corpses coming back at ' + T(w.t), pts: h.snap(w.t1 + 0.3), rings: [wellRing].concat(at.map((p) => spot(p.x, p.y, '#ff5a4f', 'a corpse coming back', 'Red dot'))), frames: frames(w.t - 2, w.t1 + 4) } } : { txt: '' }]);
    }
    // (Hungering Pyre: the soak lands 7.5 s after its cast starts; its hit splits between everyone within 10 yards)
    const pyH = dmgId(NZ.pyre).filter((e) => e.t >= ritT && e.t <= iEnd + 5), pys = []; for (const e of pyH) { const p = pys[pys.length - 1]; if (p && e.t - p.t < 1) p.who.add(e.dst); else pys.push({ t: e.t, who: new Set([e.dst]) }); }
    // (the soak's 10 yards, centred on the players it hit, as the Spectral Coil map does: the log has no position for the Pyre itself)
    const pyreRing = (p) => { const sk = h.snap(p.t).filter((q) => p.who.has(q.guid)); if (!sk.length) return []; const cx = sk.reduce((v, q) => v + q.x, 0) / sk.length, cy = sk.reduce((v, q) => v + q.y, 0) / sk.length;
      return [{ x: cx, y: cy, r: 10, label: '10 yd soak', ...mcol('Hungering Pyre'), fx: 'soak', at: p.t, legend: 'the soak, 10 yd (centred on its soakers)' }]; };
    pys.forEach((p, k) => {
      _nz.pyres.push({ i: k + 1, t: p.t, who: [...p.who].map(pname) });
      const died = r.deaths.filter((d) => d.t >= p.t - 0.2 && d.t <= p.t + 1 && /hungering pyre/i.test(d.ability || ''));
      if (died.length) M(p.t, 'Raid', 'Hungering Pyre', 'High', 'Hungering Pyre was soaked by ' + pl(p.who.size, 'player') + ' and ' + pl(died.length, 'player') + ' died.', 'Send the melee into every Hungering Pyre so its damage is split.');
      rows.push([{ txt: 'Hungering Pyre ' + (k + 1) }, { t: p.t }, { txt: pl(p.who.size, 'soaker'), warn: p.who.size < 4 && !died.length, bad: !!died.length, sub: [...p.who].map(pname).join(', ') }, died.length ? { txt: died.map((d) => d.player).join(', ') + ' died', bad: true } : { txt: '—', dim: true },
        { map: { t: p.t, good: [...p.who], goodLabel: 'soaked', title: 'Hungering Pyre ' + (k + 1) + ' at ' + T(p.t), pts: h.snap(p.t), rings: pyreRing(p), frames: frames(p.t - 4, p.t + 1) } }]);
    });
    const stHits = dmgId(NZ.transfer);
    castOk(NZ.transfer[0]).filter((t) => t >= ritT - 1 && t <= iEnd + 1).forEach((t, k) => {
      const hit = [...new Set(stHits.filter((e) => e.t >= t - 0.3 && e.t <= t + 2).map((e) => e.dst))];
      rows.push([{ txt: 'Soul Transfer ' + (k + 1) }, { t }, hit.length ? { txt: pl(hit.length, 'player') + ' hit', bad: true } : { txt: 'nobody hit' }, hit.length ? { ps: hit.map(pname), bad: true } : { txt: '—', dim: true }, { txt: '' }]);
    });
    const jaw = ev.filter((e) => e.k === 'die' && /echo of jawae/i.test(e.name || '')).map((e) => e.t).sort((a, b) => a - b);
    if (jaw.length) rows.push([{ txt: 'Echoes of Jawae' }, { t: jaw[jaw.length - 1] }, { txt: jaw.length >= 2 ? 'both dead, ' + Math.round(jaw[jaw.length - 1] - ritT) + ' s in' : 'one dead', dim: jaw.length < 2 }, { txt: jaw.map(T).join(', '), dim: true }, { txt: '' }]);
    rows.sort((a, b) => a[1].t - b[1].t);
    if (rows.length) sections.push({ id: 'ritual', title: 'Intermission (Soak the Pyres)', place: 'Intermission: corpses, Pyres and the Echoes', spell: [NZ.vessel, 'Vessel of Awakening'], verdict: rows.some((x) => x[2].bad || x[3].bad) ? 'bad' : rows.some((x) => x[2].warn) ? 'warn' : 'good',
      summary: 'The intermission ran from ' + T(ritT) + ' to ' + T(iEnd) + '. It shows the corpses that came back and how many at once, every Hungering Pyre soak, any Soul Transfer hits, and when the Echoes of Jawae died.', cols: ['What', 'When', 'Result', 'Who', ''],
      groups: [{ title: 'Intermission', t: ritT, bad: rows.some((x) => x[2].bad || x[3].bad), warn: rows.some((x) => x[2].warn), sub: pl(waves.reduce((s, w) => s + w.g.size, 0), 'corpse') + ' came back, ' + pl(pys.length, 'Pyre'), rows }], rows: [] });
  }

  // ---- 7. Mythic P2: Invoke interrupts and silences anyone casting as it finishes ----
  if (mythic && invC.length) {
    const inv = aur(NZ.invokeDeb).filter((e) => e.op === 'apply' && h.isPlayer(e.dst));
    const ivRows = invC.map((t, k) => {
      const who = [...new Set(inv.filter((e) => Math.abs(e.t - t) < 0.6).map((e) => e.dst))];
      for (const g of who) M(t, pname(g), 'Invoke', 'Low', 'Was still casting when Invoke finished, so got interrupted and silenced for 3 seconds.', 'Stop casting just before Invoke finishes (it has a 5-second cast bar).');
      // (Oct 22, boss coverage: in the 10 fastest Mythic kills, 22 of 27 Invokes caught someone, up to 3 players most times. A few
      // caught is normal; 4 or more is a slip)
      return [{ txt: 'Invoke ' + (k + 1) }, { t }, who.length ? { txt: pl(who.length, 'player') + ' interrupted', warn: who.length >= 4, sub: who.length < 4 ? 'a few is normal' : '' } : { txt: 'nobody interrupted' }, who.length ? { ps: who.map(pname) } : { txt: '—', dim: true }, { txt: '' }];
    });
    sections.push({ id: 'invoke', title: 'Invoke (Stop casting)', place: 'Invoke (stop casting): nobody caught', spell: [NZ.invoke, 'Invoke'], verdict: ivRows.some((x) => x[2].warn) ? 'warn' : 'good',
      summary: pl(ivRows.length, 'Invoke') + '. It shows who was still casting when it finished, which interrupts and silences them for 3 seconds.', cols: ['Cast', 'When', 'Result', 'Who', ''], rows: ivRows });
  }

  // ---- 8. her energy: what fed it; 100 is the enrage ----
  {
    const rows = ignSt.map((s, i) => [{ txt: 'Soulcoil Ignition ' + (i + 1) }, { t: s }, { txt: ritT != null && s < ritT && ritT < s + 12 ? 'cut short' : '+25' }, { txt: energyAt(s + 13) != null ? 'energy ' + energyAt(s + 13) : '', dim: true }]);
    // (an Amani in the well is judged under Restless Amani: listed here, not flagged twice)
    for (const f of feeds) rows.push([{ txt: f.by ? 'An Amani reached the well' : f.died ? f.died.player + ' died in the well' : 'The well was fed' }, { t: f.t }, { txt: '+5' }, { txt: f.by ? 'see Restless Amani' : f.died ? 'dying in the well feeds it' : 'an add or a player in the water', dim: true }]);
    if (p2T != null) { const e2 = energyAt(p2T + 15); rows.push([{ txt: 'P2 starts' }, { t: p2T }, { txt: e2 != null ? 'energy ' + e2 + ' soon after' : '—', dim: true }, { txt: 'Uncoiling: climbs on its own now', dim: true }]); }
    const endE = energyAt(dur);
    if (enr) {
      const why = feeds.filter((f) => f.by).length;
      M(enr.t, 'Raid', 'Uncoiled Rage', 'High', 'Nek\'zali reached 100 energy and enraged (Uncoiled Rage)' + (why ? '. ' + why + ' Amani reached the well before that.' : '.'), p2T != null && enr.t > p2T ? 'P2 is a damage race. Save Bloodlust and damage cooldowns for it, and keep Amani out of the well.' : 'Reach the intermission (50%) before the fourth Soulcoil Ignition, and keep every Amani out of the well.');
      rows.push([{ txt: 'Uncoiled Rage' }, { t: enr.t }, { txt: 'she enraged', bad: true }, { txt: 'at 100 energy', dim: true }]);
    } else if (endE != null) rows.push([{ txt: r.item.kill ? 'She died' : 'The pull ended' }, { t: dur }, { txt: 'energy ' + endE, dim: true }, { txt: '' }]);
    rows.sort((a, b) => a[1].t - b[1].t);
    if (rows.length) sections.push({ id: 'energy', title: 'Energy (Don\'t feed her)', place: 'Energy: what fed her', spell: [NZ.rage, 'Uncoiled Rage'], verdict: enr ? 'bad' : 'good', info: !enr,
      summary: 'Everything that gave Nek\'zali energy this pull' + (endE != null ? ' (' + endE + ' at the end)' : '') + '. 100 is the enrage.', cols: ['What', 'When', 'Energy', ''], rows });
  }

  // ---- 9. avoidable damage ----
  const av = avoidPanel(ev, r, h, [
    { n: ['soul transfer'], label: 'Soul Transfer', harm: 'High', why: 'the Echo of Jawae\'s line blast toward Nek\'zali at the end of its 15-second channel' },
    { n: ['anguished echoes'], label: 'Anguished Echoes', harm: 'Medium', why: 'the circles that rain from the well during Soulcoil Ignition' },
    { n: ['latent cultist'], label: 'Latent Cultist', harm: 'Medium', why: 'touching a cultist puddle (they move around the well in P2)' },
  ].concat(mythic ? [{ n: ['swirling spirit'], label: 'Swirling Spirit', harm: 'Low', warnAt: 2, badAt: 4, why: 'the spirits inside the well during Grasping Depths (the well team)' }] : []));
  if (av) sections.push(av);

  const diag = [['Soulcoil Ignition', NZ.ignition], ['Anguished Echoes', NZ.echoes], ['Soulcoil Rite', NZ.rite], ['Ritual Burn', NZ.burn], ['Possession Barrage', NZ.barrage], ['Possession Barrage hit', NZ.barrageHit], ['Hollowing Strikes', NZ.hollow],
    ['Essence Rend', NZ.rend], ['Latent Cultist', NZ.cultist], ['Gravebound Advance', NZ.shield], ['Corpse Blight', NZ.blight[0]], ['Vessel of Awakening', NZ.vessel], ['Ritual of Awakening', NZ.ritual], ['Soul Transfer', NZ.transfer[0]],
    ['Hungering Pyre', NZ.pyre], ['Slithering Flame', NZ.flame], ['Uncoiling', NZ.uncoil], ['Invoke', NZ.invoke], ['Grasping Depths', NZ.depths], ['Immortal Coil', NZ.coil], ["Soulcoiler's Curse", NZ.curse], ['Swirling Spirit', NZ.spirit], ['Soul Exhaustion', NZ.exhaust], ['Uncoiled Rage', NZ.rage]].map(([name, id]) => {
    const c = { cast: 0, dmg: 0, aura: 0, other: 0 };
    for (const x of ev) if (x.id === id) { if (x.k === 'cast' || x.k === 'start') c.cast++; else if (x.k === 'dmg') c.dmg++; else if (x.k === 'aura') c.aura++; else c.other++; }
    return { name, id, ...c, total: c.cast + c.dmg + c.aura + c.other };
  });
  return { _nz, diag, title: r.item.diff + " audit: Nek'zali the Soulcoiler", reached: phases[phases.length - 1].name, phases, marks, sections, mistakes,
    note: mythic ? '' : 'Mythic-only checks (Grasping Depths, Invoke) are hidden on this difficulty.' };
}

function buildVashnik(ev, r, h) {
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const dur = r.duration, mythic = r.item.diff === 'Mythic', pname = (g) => h.name(g), T = h.fmtT;
  const fmtM = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1e3) + 'k');
  const mistakes = [], sections = [], marks = [];
  const M = (t, player, mech, severity, detail, fix, map) => mistakes.push({ t, player, mechanic: mech, id: 0, severity, detail, fix, ...(map ? { map } : {}) });
  const L = (x) => String(x || '').toLowerCase();
  const has = (e, ids) => [].concat(ids).includes(e.id);
  const dmgId = (ids) => ev.filter((e) => e.k === 'dmg' && has(e, ids) && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const dmgName = (n) => ev.filter((e) => e.k === 'dmg' && L(e.spell) === n && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const AUR = new Map(), aur = (id) => { const k = String(id); if (!AUR.has(k)) AUR.set(k, ev.filter((e) => e.k === 'aura' && has(e, id)).sort((a, b) => a.t - b.t)); return AUR.get(k); };
  const gap1 = (l) => l.sort((a, b) => a - b).filter((t, i, a) => !i || t - a[i - 1] > 1);
  const castOk = (ids) => gap1(ev.filter((e) => e.k === 'cast' && has(e, ids)).map((e) => e.t));
  const frames = (t0, t1) => h.frames(Math.max(0, t0), Math.min(dur, t1), 0.25);
  const posPts = (t) => (h.frames(t, t, 0.2)[0] || { pts: h.snap(t) }).pts;
  const posOf = (g, t) => posPts(t).find((q) => q.guid === g);
  const diedNear = (g, t, w) => r.deaths.find((d) => d.guid === g && d.t >= t - 0.2 && d.t <= t + w);
  const clusters = (list, gap) => { const out = []; for (const e of list) { const c = out[out.length - 1]; if (c && e.t - c.t1 < gap) { c.t1 = e.t; c.list.push(e); } else out.push({ t: e.t, t1: e.t, list: [e] }); } return out; };

  // ---- the loop: Imbibe at 100 energy, about every 84 seconds ----
  const imb = castOk(VS.imbibe), bossG = (ev.find((e) => e.k === 'cast' && e.id === VS.imbibe) || {}).src;
  imb.forEach((t, i) => marks.push({ t, label: 'Imbibe ' + (i + 1), id: VS.imbibe, kind: 'phase' }));
  const cycOf = (t) => imb.filter((x) => x <= t + 0.5).length; // (0: before the first Imbibe)
  const cyName = (k) => (k ? 'Imbibe ' + k : 'Before Imbibe 1');

  // ---- 1. Imbibe: the two nearest fountains drained (infusions on him), the raid hit, adds ----
  {
    const inf = ev.filter((e) => e.k === 'aura' && (e.op === 'apply' || e.op === 'dose') && /infusion$/i.test(e.spell || '') && /^(flame|shadow|blood)/i.test(e.spell || '') && (!bossG || e.dst === bossG));
    const exp = ev.filter((e) => e.k === 'dmg' && h.isPlayer(e.dst) && /expulsion$/i.test(e.spell || ''));
    const rows = imb.map((t, i) => {
      const got = [...new Set(inf.filter((e) => e.t >= t - 0.5 && e.t <= t + 2).map((e) => e.spell.split(' ')[0]))];
      const died = r.deaths.filter((d) => d.t >= t - 0.3 && d.t <= t + 3 && /expulsion|imbibe/i.test(d.ability || '') && h.isPlayer(d.guid));
      const hit = exp.filter((e) => e.t >= t - 0.3 && e.t <= t + 2), each = hit.length ? hit.reduce((s, e) => s + (e.raw || e.amt), 0) / new Set(hit.map((e) => e.dst)).size : 0;
      const quick = i && t - imb[i - 1] < 40;
      if (died.length) M(t, 'Raid', 'Imbibe', 'High', pl(died.length, 'player') + ' died to the fountains\' raid hit at Imbibe ' + (i + 1) + '.', 'Stack for healing cooldowns and defensives on every Imbibe. The hits grow with each infusion and Toxic Vapor stack.');
      return [{ txt: 'Imbibe ' + (i + 1), sub: quick ? 'only ' + Math.round(t - imb[i - 1]) + ' s after the last one' : '' }, { t }, got.length ? { txt: got.join(' and ') + ' fountains' } : { txt: '—', dim: true },
        died.length ? { txt: died.map((d) => d.player).join(', ') + ' died', bad: true } : { txt: '—', dim: true }, { txt: each ? fmtM(each) + ' on each player' : '', dim: true }];
    });
    if (rows.length) sections.push({ id: 'imbibe', title: 'Imbibe (Fountains drained)', place: 'Imbibe (fountains): the raid hit', spell: [VS.imbibe, 'Imbibe'], verdict: rows.some((x) => x[3].bad) ? 'bad' : 'good', info: !rows.some((x) => x[3].bad),
      summary: pl(rows.length, 'Imbibe') + '. It shows which two fountains he drained each time, what the raid took, and deaths to it. Each one adds a Toxic Vapor stack, so the longer the fight, the harder it gets.', cols: ['Imbibe', 'When', 'Drained', 'Died', 'Raid hit'], rows });
  }

  // ---- 2. the adds: Burning Venoms (kill one at a time, before they reach the middle) and Shrouded Venoms ----
  {
    const born = new Map();
    const seen = (g, t, kind) => { if (!born.has(g)) born.set(g, { g, t, kind, died: null }); };
    for (const e of aur(VS.presence)) if (e.op === 'apply' && !h.isPlayer(e.dst)) seen(e.dst, e.t, 'burning');
    for (const e of aur(VS.coating)) if (e.op === 'apply' && !h.isPlayer(e.dst)) seen(e.dst, e.t, 'shrouded');
    for (const e of ev) if (e.k === 'die' && born.has(e.guid)) { const a = born.get(e.guid); if (a.died == null) a.died = e.t; }
    const surgeT = castOk(VS.surge), hard = ev.filter((e) => e.k === 'aura' && e.op === 'apply' && L(e.spell) === 'hardened venom' && !h.isPlayer(e.dst));
    const burst = dmgName('malignant burst'), bursts = clusters(burst, 2);
    for (const b of bursts) M(b.t, 'Raid', 'Malignant Burst', 'High', 'A Living Venom reached the Malignant Cavity: Malignant Burst hit the whole raid and left a stacking damage over time.', 'Kill or crowd control every venom before it gets to the middle, starting with the Burning Venoms.');
    const groups = [...new Set([...born.values()].map((a) => cycOf(a.t)))].sort((a, b) => a - b).map((k) => {
      const list = [...born.values()].filter((a) => cycOf(a.t) === k).sort((a, b) => a.t - b.t), burning = list.filter((a) => a.kind === 'burning'), shr = list.filter((a) => a.kind === 'shrouded');
      const end = k < imb.length ? imb[k] : dur, rows = [];
      burning.forEach((a, j) => {
        const pair = a.died != null ? burning.find((b) => b !== a && b.died != null && Math.abs(b.died - a.died) < 3) : null, together = !!pair;
        /* (fix 15, Oct 26: top kills overlap two now and then and win, so two together is a note; players dying to Caustic Surge right after is red) */
        const sDead = pair ? r.deaths.filter((d) => d.t >= Math.min(a.died, pair.died) - 0.2 && d.t <= Math.max(a.died, pair.died) + 3 && /caustic surge/i.test(d.ability || '')) : [];
        const old = (a.died ?? Math.min(dur, end)) - a.t > 60 || hard.some((e) => e.dst === a.g);
        if (together && burning.indexOf(a) < burning.indexOf(pair) && sDead.length) M(Math.max(a.died, pair.died), 'Raid', 'Caustic Surge', 'High', pl(sDead.length, 'player') + ' died to Caustic Surge after two Burning Venoms died together.', 'Kill the fire adds one at a time (crowd control or banish the others), never together.');
        if (together && burning.indexOf(a) < burning.indexOf(pair)) M(a.died, 'Raid', 'Burning Venom', 'Low', 'Two Burning Venoms died within 3 seconds. Their Caustic Surges hit the raid together.', 'Kill the fire adds one at a time (crowd control or banish the others), never together.');
        rows.push([{ txt: 'Burning Venom ' + (j + 1) }, { t: a.t }, a.died != null ? { txt: 'killed after ' + Math.round(a.died - a.t) + ' s', warn: old } : { txt: 'alive', dim: a.t > dur - 60, warn: !r.item.kill && old }, together ? (sDead.length ? { txt: 'died with another', bad: true, sub: pl(sDead.length, 'player') + ' died to Caustic Surge' } : { txt: 'died with another', dim: true, sub: 'two Caustic Surges at once' }) : old ? { txt: 'hardened (over 60 s)', warn: true } : { txt: '—', dim: true }, { txt: '' }]);
      });
      if (shr.length) {
        const last = shr.every((a) => a.died != null) ? Math.max(...shr.map((a) => a.died)) : null, old = shr.filter((a) => (a.died ?? Math.min(dur, end)) - a.t > 60);
        rows.push([{ txt: 'Shrouded Venoms', sub: pl(shr.length, 'add') }, { t: shr[0].t }, last != null ? { txt: 'all dead after ' + Math.round(last - shr[0].t) + ' s' } : { txt: shr.filter((a) => a.died == null).length + ' still up', dim: true }, old.length ? { txt: old.length + ' over 60 s', warn: true } : { txt: '—', dim: true }, { txt: '' }]);
      }
      const bb = bursts.filter((b) => cycOf(b.t) === k);
      if (bb.length) rows.push([{ txt: 'Malignant Burst' }, { t: bb[0].t }, { txt: pl(bb.length, 'venom') + ' reached the middle', bad: true }, { txt: '—', dim: true }, { txt: '' }]);
      return { title: cyName(k) + ' adds', t: list[0].t, bad: rows.some((x) => x[2].bad || x[3].bad), warn: rows.some((x) => x[2].warn || x[3].warn), sub: pl(burning.length, 'Burning Venom') + (shr.length ? ', ' + pl(shr.length, 'Shrouded Venom') : '') + (bb.length ? ', ' + pl(bb.length, 'Malignant Burst') : ''), rows };
    }).filter((g) => g.rows.length);
    if (groups.length) sections.push({ id: 'venoms', title: 'Living Venoms (Kill one at a time)', place: 'Living Venoms (adds): killed one at a time', spell: [VS.surge, 'Caustic Surge'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: 'These are the adds from each Imbibe. It shows each Burning Venom\'s time alive and whether two died together, how long the Shrouded Venoms lived, and any venom that reached the middle.' + (surgeT.length ? ' ' + pl(surgeT.length, 'Caustic Surge') + ' this pull.' : ''), cols: ['Add', 'Spawned', 'Result', 'Notes', ''], groups, rows: [] });
  }

  // ---- 3. Mythic: Malignant Totems; Plague Waves must clear every one before the next Imbibe ----
  const froA = aur(VS.froth).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), froR = aur(VS.froth).filter((e) => e.op === 'remove' && h.isPlayer(e.dst));
  const froths = clusters(froA, 1.5).map((c) => { const who = [...new Set(c.list.map((e) => e.dst))]; return { t: c.t, who, ends: who.map((g) => { const rm = froR.find((x) => x.dst === g && x.t > c.t + 0.5 && x.t < c.t + 12); return { g, t: rm ? rm.t : Math.min(dur, c.t + 6) }; }) }; });
  froths.forEach((f) => (f.end = Math.max(...f.ends.map((x) => x.t))));
  if (mythic) {
    const tot = new Map();
    for (const e of ev) if (e.k === 'start' && e.id === VS.malignance && !tot.has(e.src)) tot.set(e.src, { g: e.src, t: e.t, died: null });
    for (const e of ev) if (e.k === 'die' && tot.has(e.guid)) { const o = tot.get(e.guid); if (o.died == null) o.died = e.t; }
    const groups = imb.map((t, i) => {
      const next = imb[i + 1] ?? null, mine = [...tot.values()].filter((o) => o.t >= t - 1 && o.t <= t + 8);
      if (!mine.length) return null;
      const rows = [[{ txt: 'Totems up' }, { t: mine[0].t }, { txt: pl(mine.length, 'totem') }, { txt: '' }, { txt: '' }]];
      froths.filter((f) => f.t > t && (next == null || f.t < next)).forEach((f) => {
        const n = mine.filter((o) => o.died != null && o.died >= f.end - 0.6 && o.died <= f.end + 8).length;
        rows.push([{ txt: 'Plague Froth at ' + T(f.t) }, { t: f.end }, { txt: n ? pl(n, 'totem') + ' cleared' : 'none cleared', dim: !n }, { txt: '' }, { txt: '' }]);
      });
      if (next != null) {
        const left = mine.filter((o) => o.died == null || o.died > next + 0.2);
        if (left.length) M(next, 'Raid', 'Malignance', left.length >= 2 ? 'High' : 'Medium', pl(left.length, 'Malignant Totem') + ' still up at Imbibe ' + (i + 2) + ': Malignance hit the raid' + (left.length >= 2 ? ' once for each (two usually wipe).' : '.'), 'Aim the Plague Waves at the totems. Walk to your marker with Plague Froth so its four lines run through them.');
        rows.push([{ txt: 'At Imbibe ' + (i + 2) }, { t: next }, left.length ? { txt: pl(left.length, 'totem') + ' still up', bad: left.length >= 2, warn: left.length === 1, sub: 'Malignance' } : { txt: 'all cleared' }, { txt: '' },
          { txt: '' }]);
      } else rows.push([{ txt: r.item.kill ? 'He died' : 'The pull ended' }, { t: dur }, { txt: mine.filter((o) => o.died == null).length + ' still up', dim: true }, { txt: '' }, { txt: '' }]);
      return { title: 'Totems from Imbibe ' + (i + 1), t, bad: rows.some((x) => x[2].bad), warn: rows.some((x) => x[2].warn), sub: pl(mine.length, 'totem') + (next != null ? ', ' + mine.filter((o) => o.died == null || o.died > next + 0.2).length + ' left at the next Imbibe' : ''), rows };
    }).filter(Boolean);
    if (groups.length) sections.push({ id: 'totems', title: 'Malignant Totems (Clear before the next Imbibe)', place: 'Malignant Totems: all cleared by the next Imbibe', spell: [VS.malignance, 'Malignance'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: 'For every set of totems, it shows how many each Plague Froth\'s waves cleared, and any still up when the next Imbibe went off (each one casts Malignance on the raid).', cols: ['What', 'When', 'Result', '', ''], groups, rows: [] });
  }

  // ---- 4. Plague Froth: four Plague Wave lines from each target when it ends; nobody else on them ----
  {
    const waves = dmgId(VS.wave);
    const groups = froths.map((f, i) => {
      // (each target's waves go when its Froth ends, early if they die with it)
      const hits = waves.filter((e) => f.ends.some((x) => e.t >= x.t - 1 && e.t <= x.t + 3)), by = new Map();
      for (const e of hits) { let o = by.get(e.dst); if (!o) by.set(e.dst, o = { g: e.dst, t: e.t, n: 0, amt: 0, from: null }); o.n++; o.amt += e.raw || e.amt; }
      // (whose line it was: the target lined up with the player north-south or east-west when it went off)
      for (const o of by.values()) { const me = posOf(o.g, o.t); if (!me) continue; let best = null; for (const x of f.ends) { if (x.g === o.g) continue; const p = posOf(x.g, x.t); if (!p) continue; const off = Math.min(Math.abs(p.x - me.x), Math.abs(p.y - me.y)); if (off < 4 && (!best || off < best.off)) best = { off, g: x.g }; } if (best) o.from = best.g; }
      const rows = [...by.values()].sort((a, b) => a.t - b.t).map((o) => {
        const d = diedNear(o.g, o.t, 1.5), soft = mythic && !d && o.n < 2;
        /* (Mechanics audit, Oct 24: top kills do this and win, so living through it is a note; a death stays red) */ if (!soft) M(o.t, pname(o.g), 'Plague Wave', d ? 'High' : 'Low', 'Hit by a Plague Wave' + (o.from ? ' from ' + pname(o.from) + '\'s Plague Froth' : '') + ' (' + fmtM(o.amt) + ')' + (d ? ', and died.' : '.'), 'Stay off the four lines (north, south, east and west) through every Plague Froth target as it ends.');
        return [{ p: pname(o.g), sub: f.who.includes(o.g) ? 'had Plague Froth too' : '' }, { t: o.t }, d ? { txt: 'died', bad: true } : { txt: 'hit for ' + fmtM(o.amt), dim: true, sub: '' }, o.from ? { p: pname(o.from) } : { txt: '—', dim: true }, { txt: '' }];
      });
      const arrows = f.ends.flatMap((x) => [0, 90, 180, 270].map((a) => ({ g: x.g, ang: a * Math.PI / 180, len: 30, color: mcol('Plague Froth').color, t0: x.t - 1.5, t1: x.t + 1, fx: 'wave', at: x.t })));
      const whole = [{ txt: 'Whole cast', sub: 'the targets and their lines, on one map', dim: true }, { t: f.end }, { txt: '' }, { txt: '' },
        { map: { t: f.end, hl: f.who, hlLabel: 'had Plague Froth', arrowLabel: 'the four Plague Waves it sends out when it ends (about 30 yd)', bad: [...by.keys()], badLabel: 'hit by a Plague Wave', badAt: [...by.values()].map((o) => [o.g, o.t]), arrows, title: 'Plague Froth ' + (i + 1) + ' at ' + T(f.t), pts: h.snap(f.end), frames: frames(f.end - 3, f.end + 2) } }];
      return { title: 'Plague Froth ' + (i + 1) + ' (' + cyName(cycOf(f.t)) + ')', t: f.t, bad: rows.some((x) => x[2].bad), warn: rows.some((x) => x[2].warn), sub: pl(f.who.length, 'target') + ', ' + (by.size ? pl(by.size, 'player') + ' hit by a wave' : 'nobody hit by a wave'), rows: [whole].concat(rows) };
    });
    if (groups.length) sections.push({ id: 'froth', title: 'Plague Froth (Aim the lines at totems)', place: 'Plague Froth (lines): nobody on them', spell: [VS.froth, 'Plague Froth'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: pl(groups.length, 'Plague Froth') + '. It shows who a Plague Wave hit, and whose line it was (the target lined up with them).' + (mythic ? ' On Mythic the lines go on the totems first, so one hit is only noted.' : ''), cols: ['Player', 'When', 'Result', 'Whose line', ''], groups, rows: [] });
  }

  // ---- 5. Malignant Catalyst: every Catalytic Bile needs someone under it ----
  {
    const soak = dmgId(VS.bile), raid = dmgId(VS.bileRaid);
    const rows = castOk(VS.catalyst).map((t, i) => {
      const w = (e) => e.t >= t + 3 && e.t <= t + 11, sk = soak.filter(w), un = clusters(raid.filter(w), 1);
      const who = [...new Set(sk.map((e) => e.dst))], biles = clusters(sk, 0.3).length;
      // (Oct 22, boss coverage: below Mythic, 3 of the 20 fastest Heroic kills let a bile land on nobody every time and nobody died; there
      // it's a slip unless it kills someone)
      const soft = !mythic && !r.deaths.some((d) => /catalytic bile/i.test(d.ability || '') && d.t >= t + 3 && d.t <= t + 14);
      if (un.length) M(un[0].t, 'Raid', 'Catalytic Bile', soft ? 'Medium' : 'High', pl(un.length, 'Catalytic Bile') + ' landed with nobody under it and hit the whole raid.', 'Spread out before the bile lands so every impact has someone within 6 yards.');
      const tm = (sk[0] || un[0] || { t: t + 7 }).t;
      return [{ txt: 'Malignant Catalyst ' + (i + 1) }, { t: tm }, un.length ? { txt: pl(un.length, 'bile') + ' unsoaked', bad: !soft, warn: soft, sub: 'the whole raid took it' } : { txt: biles ? 'every bile soaked' : '—', dim: !biles }, { txt: who.length ? pl(who.length, 'soaker') : '—', dim: !who.length, sub: who.map(pname).join(', ') },
        { txt: '' }];
    });
    if (rows.length) sections.push({ id: 'bile', title: 'Catalytic Bile (Soak every bile)', place: 'Catalytic Bile (soaks): every impact covered', spell: [VS.catalyst, 'Malignant Catalyst'], verdict: rows.some((x) => x[2].bad) ? 'bad' : rows.some((x) => x[2].warn) ? 'warn' : 'good',
      summary: pl(rows.length, 'Malignant Catalyst') + '. It shows who stood under the biles, and any bile that landed on nobody.', cols: ['Cast', 'When', 'Result', 'Soakers', ''], rows });
  }

  // ---- 6. Adaptive Infection: Exploding (dispel one at a time), Stygian (spread) ----
  {
    const exA = aur(VS.exploding).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), exR = aur(VS.exploding).filter((e) => e.op === 'remove' && h.isPlayer(e.dst));
    const sgA = aur(VS.stygian).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), burst = dmgId(VS.stygBurst);
    const disp = ev.filter((e) => e.k === 'dispel' && /exploding infection/i.test(e.spell || ''));
    const groups = clusters(exA.concat(sgA).sort((a, b) => a.t - b.t), 3).map((c, i) => {
      const rows = [], t1 = c.t + 25;
      const ex = c.list.filter((e) => e.id === VS.exploding).map((e) => { const rm = exR.find((x) => x.dst === e.dst && x.t > e.t); return { g: e.dst, t: e.t, rm: rm ? rm.t : null, by: rm && disp.find((x) => x.dst === e.dst && Math.abs(x.t - rm.t) < 0.4) }; });
      for (const o of ex) {
        const with2 = o.rm != null ? ex.filter((q) => q !== o && q.rm != null && Math.abs(q.rm - o.rm) < 1.5) : [];
        const dead = o.rm != null ? r.deaths.filter((d) => d.t >= o.rm - 0.2 && d.t <= o.rm + 1.2 && /caustic explosion|exploding infection/i.test(d.ability || '')) : [];
        if (with2.length && ex.indexOf(o) < ex.indexOf(with2[0])) /* (Mechanics audit, Oct 24: top kills do this and win, so living through it is a note; a death stays red) */ M(o.rm, 'Raid', 'Exploding Infection', 'Low', 'Two Exploding Infections were removed within ' + Math.abs(with2[0].rm - o.rm).toFixed(1) + ' s, which put two Caustic Explosions on the raid at once.', 'Dispel the fire infection one player at a time, once the raid is topped up.');
        if (dead.length && ex.indexOf(o) === ex.findIndex((q) => q.rm != null && Math.abs(q.rm - o.rm) < 1.5)) M(o.rm, 'Raid', 'Caustic Explosion', 'High', pl(dead.length, 'player') + ' died to a Caustic Explosion as an Exploding Infection came off.', 'Hold the dispel until the raid is healed up, and never two at once.');
        rows.push([{ p: pname(o.g), sub: 'Exploding Infection' }, { t: o.rm ?? o.t }, o.rm == null ? { txt: 'still on', dim: true } : o.by ? { txt: 'dispelled after ' + (o.rm - o.t).toFixed(1) + ' s', sub: 'by ' + o.by.src } : { txt: 'came off after ' + (o.rm - o.t).toFixed(1) + ' s' },
          dead.length ? { txt: dead.map((d) => d.player).join(', ') + ' died', bad: true } : with2.length ? { txt: 'with ' + with2.map((q) => pname(q.g)).join(', '), dim: true, sub: 'removed together' } : { txt: '—', dim: true }, { txt: '' }]);
      }
      const sg = c.list.filter((e) => e.id === VS.stygian).map((e) => e.dst), bh = burst.filter((e) => e.t >= c.t && e.t <= t1 && !sg.includes(e.dst));
      const by = new Map(); for (const e of bh) { const o = by.get(e.dst) || { g: e.dst, t: e.t, n: 0 }; o.n++; by.set(e.dst, o); }
      for (const o of by.values()) { M(o.t, pname(o.g), 'Stygian Burst', 'Low', 'Hit by ' + (o.n > 1 ? o.n + ' Stygian Bursts' : 'a Stygian Burst') + ' from a player with Stygian Infection.', 'Stay 6 yards away from players with Stygian Infection. They should spread too.');
        rows.push([{ p: pname(o.g) }, { t: o.t }, { txt: 'hit by a Stygian Burst', dim: true, sub: o.n > 1 ? o.n + ' hits' : '' }, { txt: '—', dim: true }, { txt: '' }]); }
      if (sg.length) rows.push([{ txt: 'Stygian Infection', sub: sg.map(pname).join(', ') }, { t: c.t }, { txt: by.size ? '' : 'nobody else hit', dim: !by.size }, { txt: '' }, { txt: '' }]);
      rows.sort((a, b) => a[1].t - b[1].t);
      return { title: 'Adaptive Infection ' + (i + 1) + ' (' + cyName(cycOf(c.t)) + ')', t: c.t, bad: rows.some((x) => x[3].bad), warn: rows.some((x) => x[2].warn || x[3].warn), sub: [ex.length ? ex.length + ' Exploding' : '', sg.length ? sg.length + ' Stygian' : ''].filter(Boolean).join(' and ') + ' Infection' + (ex.length + sg.length === 1 ? '' : 's'), rows };
    });
    if (groups.length) sections.push({ id: 'infect', title: 'Adaptive Infection (Dispel one at a time)', place: 'Adaptive Infection (dispel): one at a time, spread', spell: [VS.exploding, 'Exploding Infection'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: pl(groups.length, 'Adaptive Infection') + '. It shows each Exploding Infection\'s dispel (two together is two raid hits at once), and anyone a Stygian Burst hit.', cols: ['Player', 'When', 'Result', 'Notes', ''], groups, rows: [] });
  }

  // ---- 7. tanks: swap on every Dripping Fangs (100% more physical damage taken for 32 s) ----
  {
    const fa = aur(VS.fangsDeb).filter((e) => e.op === 'apply' && h.isPlayer(e.dst));
    const rows = castOk(VS.fangs).map((t, i) => {
      const on = fa.find((e) => Math.abs(e.t - t) < 0.6), prev = on && fa.filter((e) => e.t < t - 1).pop(), again = on && prev && prev.dst === on.dst && t - prev.t < 32;
      if (again) M(t, pname(on.dst), 'Dripping Fangs', 'High', 'Took a second Dripping Fangs with the first one\'s debuff still up (100% more physical damage).', 'Taunt-swap on every Dripping Fangs.');
      return [{ p: on ? pname(on.dst) : '?' }, { t }, again ? { txt: 'took two in a row', bad: true } : { txt: i ? 'swapped' : 'first' }, { txt: diedNear(on && on.dst, t, 5) ? 'died' : '—', bad: !!(on && diedNear(on.dst, t, 5)), dim: !(on && diedNear(on.dst, t, 5)) }];
    });
    if (rows.length) sections.push({ id: 'fangs', title: 'Dripping Fangs (Tanks swap)', place: 'Dripping Fangs (tank buster): a swap every time', spell: [VS.fangs, 'Dripping Fangs'], verdict: rows.some((x) => x[2].bad || x[3].bad) ? 'bad' : 'good',
      summary: rows.length + ' Dripping Fangs. It shows which tank took each one.', cols: ['Tank', 'When', 'Result', 'Died'], rows });
  }

  // ---- 8. avoidable damage ----
  const frothOn = (g, t) => froths.some((f) => f.ends.some((x) => x.g === g && t >= f.t - 0.2 && t <= x.t + 0.2));
  const av = avoidPanel(ev, r, h, [
    { n: ['plague wave'], label: 'Plague Wave', harm: 'Medium', why: 'the four lines from a Plague Froth target as it ends' + (mythic ? ' (on Mythic the totems come first, so a hit is less of a mistake)' : '') },
    { n: ['umbral ejection'], label: 'Umbral Ejection', harm: 'Medium', why: 'the circles a Shrouded Venom leaves when it dies' },
    { n: ['stygian burst'], label: 'Stygian Burst', harm: 'Medium', why: 'standing within 6 yards of a player with Stygian Infection', skip: (e) => aur(VS.stygian).some((x) => x.dst === e.dst && x.op === 'apply' && e.t >= x.t - 0.2 && e.t <= x.t + 20) },
    { n: ['plague froth'], label: 'Plague Froth (nearby)', harm: 'Low', warnAt: 6, badAt: 12, why: 'standing within 5 yards of a Plague Froth target', skip: (e) => frothOn(e.dst, e.t) },
  ]);
  if (av) sections.push(av);

  const diag = [['Imbibe', VS.imbibe], ['Toxic Vapor', VS.vapor], ['Malignant Catalyst', VS.catalyst], ['Catalytic Bile', VS.bile], ['Catalytic Bile (unsoaked)', VS.bileRaid], ['Plague Froth', VS.froth], ['Plague Wave', VS.wave],
    ['Exploding Infection', VS.exploding], ['Caustic Explosion', VS.explosion], ['Stygian Infection', VS.stygian], ['Stygian Burst', VS.stygBurst], ['Dripping Fangs', VS.fangs], ['Burning Presence', VS.presence], ['Caustic Surge', VS.surge],
    ['Miasmic Coating', VS.coating], ['Umbral Ejection', VS.ejection], ['Malignance', VS.malignance]].map(([name, id]) => {
    const c = { cast: 0, dmg: 0, aura: 0, other: 0 };
    for (const x of ev) if (x.id === id) { if (x.k === 'cast' || x.k === 'start') c.cast++; else if (x.k === 'dmg') c.dmg++; else if (x.k === 'aura') c.aura++; else c.other++; }
    return { name, id, ...c, total: c.cast + c.dmg + c.aura + c.other };
  });
  const sectionGroups = [
    { name: 'Imbibe and adds', sub: 'the fountains, the venoms', ids: ['imbibe', 'venoms'] },
    { name: 'Plague Froth', sub: mythic ? 'the waves and the totems they clear' : 'the waves', ids: ['froth', 'totems'] },
    { name: 'Malignant Catalyst', sub: 'the bile soaks', ids: ['bile'] },
    { name: 'Adaptive Infection', sub: 'dispels and spreading', ids: ['infect'] },
    { name: 'Tanks', sub: '', ids: ['fangs'] },
    { name: 'Deaths and avoidable damage', sub: '', ids: ['deaths', 'avoid', 'kicks'], rest: true },
  ];
  { const pc = paceCard(ev, r, h, mistakes, "Vashnik the Malignant", { imb }); if (pc) sections.push(pc); } /* (Pace, Oct 22: boss coverage) */
  return { diag, title: r.item.diff + ' audit: Vashnik the Malignant', reached: imb.length ? 'Imbibe ' + imb.length : 'Before the first Imbibe', phases: [], sectionGroups, marks, sections, mistakes,
    legend: 'Grouped by mechanic: Imbibe and the adds, Plague Froth' + (mythic ? ' and the totems' : '') + ', the Catalyst soaks, the infections, the tanks, then deaths and avoidable damage.', note: mythic ? '' : 'Mythic-only checks (Malignant Totems) are hidden on this difficulty.' };
}

function buildLostExplorers(ev, r, h) {
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const dur = r.duration, mythic = r.item.diff === 'Mythic', pname = (g) => h.name(g), T = h.fmtT;
  const fmtM = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1e3) + 'k');
  const mistakes = [], sections = [], marks = [];
  const M = (t, player, mech, severity, detail, fix, map) => mistakes.push({ t, player, mechanic: mech, id: 0, severity, detail, fix, ...(map ? { map } : {}) });
  const L = (x) => String(x || '').toLowerCase();
  const has = (e, ids) => [].concat(ids).includes(e.id);
  const dmgId = (ids) => ev.filter((e) => e.k === 'dmg' && has(e, ids) && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const dmgName = (n) => ev.filter((e) => e.k === 'dmg' && L(e.spell) === n && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const AUR = new Map(), aur = (id) => { const k = String(id); if (!AUR.has(k)) AUR.set(k, ev.filter((e) => e.k === 'aura' && has(e, id)).sort((a, b) => a.t - b.t)); return AUR.get(k); };
  const gap1 = (l) => l.sort((a, b) => a - b).filter((t, i, a) => !i || t - a[i - 1] > 1);
  const castOk = (ids) => gap1(ev.filter((e) => e.k === 'cast' && has(e, ids)).map((e) => e.t));
  const starts = (ids) => gap1(ev.filter((e) => e.k === 'start' && has(e, ids)).map((e) => e.t));
  const frames = (t0, t1) => h.frames(Math.max(0, t0), Math.min(dur, t1), 0.25);
  const clusters = (list, gap) => { const out = []; for (const e of list) { const c = out[out.length - 1]; if (c && e.t - c.t1 < gap) { c.t1 = e.t; c.list.push(e); } else out.push({ t: e.t, t1: e.t, list: [e] }); } return out; };
  const deadBy = (re, t0, t1) => r.deaths.filter((d) => d.t >= t0 && d.t <= t1 && h.isPlayer(d.guid) && re.test(d.ability || ''));

  // ---- the turns: Mor'zahi takes over one explorer at a time (its empowered moves); a fish ends the turn ----
  const tr = ev.filter((e) => e.k === 'aura' && e.op === 'apply' && LE.transform[e.id]).sort((a, b) => a.t - b.t).filter((e, i, a) => !i || e.t - a[i - 1].t > 5);
  const phases = [{ name: 'Before the first turn', start: 0, end: tr.length ? tr[0].t : dur }];
  tr.forEach((e, i) => { phases.push({ name: LE.transform[e.id] + '\'s turn', start: e.t, end: tr[i + 1] ? tr[i + 1].t : dur }); marks.push({ t: e.t, label: LE.transform[e.id] + '\'s turn', id: e.id, kind: 'phase' }); });
  const phOf = (t) => [...phases].reverse().find((p) => t >= p.start - 0.5).name;

  // ---- 1. boxes: every box popped before it glows (Relic Rupture); on Mythic each pop bleeds the raid (Splinters) ----
  {
    const born = new Map(), spl = aur(LE.splinters).filter((e) => (e.op === 'apply' || e.op === 'dose') && h.isPlayer(e.dst));
    // (a box is a Useless Junk unit; its life runs from the first event that names it to its death, or its rupture)
    for (const e of ev) {
      if (e.k === 'cast' && e.id === LE.rupture && !born.has(e.src)) born.set(e.src, { g: e.src, t: e.t - 16, died: null, rupt: e.t });
      if (e.k === 'cast' && e.id === LE.rupture && born.has(e.src)) born.get(e.src).rupt = e.t;
    }
    for (const e of ev) if (e.k === 'die' && /useless junk/i.test(e.name || '')) { if (!born.has(e.guid)) born.set(e.guid, { g: e.guid, t: null, died: e.t, rupt: null }); else if (born.get(e.guid).died == null) born.get(e.guid).died = e.t; }
    // (when it landed: about 3 s after the Throw Junk that threw it, the last throw before it was popped)
    const throws = castOk(LE.junk);
    for (const b of born.values()) { const end = b.rupt ?? b.died, th = throws.filter((x) => x <= end - 0.5 && end - x < 40).pop(); b.t = th != null ? th + 3 : null; }
    const boxes = [...born.values()].filter((b) => b.died != null || b.rupt != null).sort((a, b) => (a.rupt ?? a.died) - (b.rupt ?? b.died));
    const stackAt = (t) => { let mx = 0; for (const e of spl) { if (e.t < t - 0.2) continue; if (e.t > t + 0.8) break; mx = Math.max(mx, e.stacks || 1); } return mx; };
    const rupDead = deadBy(/relic rupture/i, 0, dur), splDead = deadBy(/splinters/i, 0, dur);
    /* (fix 17, Oct 26: the first rupture in a pull is a note, later ones a slip, one that kills is the mistake) */
    const rupInfo = new Map(); boxes.filter((x) => x.rupt != null).forEach((b, k) => { const d = rupDead.filter((x) => x.t >= b.rupt - 0.2 && x.t <= b.rupt + 3); rupInfo.set(b, { k, d });
      M(b.rupt, 'Raid', 'Relic Rupture', d.length ? 'High' : k === 0 ? 'Low' : 'Medium', 'A box was left until it glowed and ruptured on the raid' + (d.length ? ': ' + pl(d.length, 'player') + ' died.' : k ? ' (rupture ' + (k + 1) + ' this pull).' : '.'), 'Pop every box before it glows green (a dedicated popper, on a steady rhythm).'); });
    const groups = phases.map((p) => {
      const list = boxes.filter((b) => { const t = b.rupt ?? b.died; return t >= p.start - 0.5 && t < p.end - 0.5 || (p === phases[phases.length - 1] && t >= p.start - 0.5); });
      if (!list.length) return null;
      const rows = list.map((b, j) => {
        const popped = b.rupt == null && b.died != null, st = popped && mythic ? stackAt(b.died) : 0, d = popped ? splDead.filter((x) => x.t >= b.died && x.t <= b.died + 6) : [];
        if (st >= 6 || (st && d.length)) M(b.died, 'Raid', 'Splinters', d.length ? 'High' : 'Medium', 'A box was popped with the raid going to ' + st + ' Splinters stacks' + (d.length ? ': ' + d.map((x) => x.player).join(', ') + ' died to the bleed.' : '.'), 'Pop at a steady rhythm, and let the stacks drop before the raid goes past 5.'); /* (fix 17, Oct 26: top guilds keep the raid at 5 or fewer) */
        return [{ txt: 'Box ' + (j + 1) }, { t: b.rupt ?? b.died }, b.rupt != null ? ((ri) => ri && ri.d.length ? { txt: 'ruptured', bad: true, sub: pl(ri.d.length, 'player') + ' died' } : ri && ri.k ? { txt: 'ruptured', warn: true, sub: 'left until it glowed' } : { txt: 'ruptured', sub: 'left until it glowed' })(rupInfo.get(b)) : { txt: b.t != null && Math.round(b.died - b.t) <= 0 ? 'popped at once' : b.t != null ? 'popped after ' + Math.max(0, Math.round(b.died - b.t)) + ' s' : 'popped' },
          mythic && popped ? (d.length ? { txt: st + ' stacks of Splinters', bad: true, sub: d.map((x) => x.player).join(', ') + ' died' } : { txt: st ? st + (st > 1 ? ' stacks' : ' stack') + ' of Splinters' : '—', warn: st >= 6, dim: !st }) : { txt: '—', dim: true }, { txt: '' }];
      });
      return { title: 'Boxes, ' + p.name, t: list[0].rupt ?? list[0].died, bad: rows.some((x) => x[2].bad || x[3].bad), warn: rows.some((x) => x[2].warn || x[3].warn), sub: pl(list.length, 'box') .replace('boxs', 'boxes') + (list.some((b) => b.rupt != null) ? ', ' + list.filter((b) => b.rupt != null).length + ' ruptured' : ', none ruptured'), rows };
    }).filter(Boolean);
    if (groups.length) sections.push({ id: 'boxes', title: 'Boxes (Pop early)', place: 'Boxes: popped before they glow', spell: [LE.rupture, 'Relic Rupture'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: pl(boxes.length, 'box').replace('boxs', 'boxes') + '. It shows whether each one was popped or left to rupture' + (mythic ? ', and the raid\'s Splinters stacks right after each pop. Top guilds keep the raid at 5 Splinters stacks or fewer.' : '.'), cols: ['Box', 'When', 'Result', mythic ? 'Splinters' : '', ''], groups, rows: [] });
  }

  // ---- 2. United Defense: all three explorers within 30 yards of each other (99% less damage taken) ----
  {
    const ud = aur(LE.united).filter((e) => !h.isPlayer(e.dst)), on = clusters(ud.filter((e) => e.op === 'apply'), 2);
    // (Oct 22, boss coverage: in the 10 fastest Mythic kills it flickered on 14 times, never longer than 2.4 s, as the explorers
    // crossed paths. Under 3 s is shown but not judged; 3 to 5 s is a slip; over 5 s is the mistake)
    const rows = on.map((c) => { const off = ud.find((e) => e.op === 'remove' && e.t >= c.t); const len = (off ? off.t : dur) - c.t;
      if (len < 3) return [{ txt: 'United Defense' }, { t: c.t }, { txt: 'up for ' + len.toFixed(1) + ' s', dim: true, sub: 'a brush as they crossed: fine' }, { txt: phOf(c.t), dim: true }, ''];
      M(c.t, 'Raid', 'United Defense', len > 5 ? 'High' : 'Medium', 'All three explorers came within 30 yards of each other: United Defense (99% less damage taken) for ' + len.toFixed(1) + ' s.', 'Keep at most two explorers together. Tanks move them apart as soon as a third gets close.');
      return [{ txt: 'United Defense' }, { t: c.t }, { txt: 'up for ' + len.toFixed(1) + ' s', warn: len <= 5, bad: len > 5 }, { txt: phOf(c.t), dim: true },
        // (the three explorers joined by red lines while United Defense was up: they were within 30 yards of each other)
        { map: { t: c.t + 0.3, title: 'United Defense at ' + T(c.t), pts: h.snap(c.t + 0.3), frames: frames(c.t - 4, c.t + Math.min(len, 6) + 1),
          links: (() => { const ex = h.snap(c.t + 0.3).filter((p) => p.kind === 'boss').slice(0, 3), l = []; for (let i = 0; i < ex.length; i++) for (let j = i + 1; j < ex.length; j++) l.push({ from: ex[i].guid, to: ex[j].guid, t0: c.t - 0.3, t1: c.t + len + 0.3, color: '#ff5a4f', legend: 'the explorers were within 30 yards of each other (United Defense)' }); return l; })() } }]; });
    sections.push({ id: 'united', title: 'United Defense (Keep the bosses apart)', place: 'United Defense (boss shield): explorers kept apart', spell: [LE.united, 'United Defense'], verdict: rows.some((x) => x[2].bad) ? 'bad' : rows.some((x) => x[2].warn) ? 'warn' : 'good',
      summary: rows.length ? pl(rows.length, 'time') + ' all three explorers came within 30 yards of each other' + (rows.every((x) => x[2].dim) ? ', each for under 3 seconds (a brush as they cross is fine).' : '.') : 'All three explorers were never within 30 yards of each other.', cols: ['What', 'When', 'Result', 'Turn', ''], rows });
  }

  // ---- 3. Final Ascension: fed a fish in time, every time ----
  {
    const fish = castOk(LE.fish), asc = starts(LE.ascension), hits = dmgId(LE.ascensionHit);
    const rows = fish.map((t, k) => [{ txt: 'Fish ' + (k + 1) }, { t }, { txt: 'fed' }, { txt: phOf(t + 1), dim: true }]);
    for (const c of clusters(hits, 3)) {
      const who = new Set(c.list.map((e) => e.dst)), died = deadBy(/final ascension/i, c.t, c.t1 + 2);
      // (Oct 22, boss coverage: below Mythic it's a raid hit, not a wipe: 4 of the 20 fastest Heroic kills let one go off and nobody
      // died. There it's a slip unless it kills someone)
      const soft = !mythic && !died.length;
      M(c.t, 'Raid', 'Final Ascension', soft ? 'Medium' : 'High', 'Final Ascension went off on the raid (' + pl(who.size, 'player') + ' hit' + (died.length ? ', ' + pl(died.length, 'death') : '') + ') before a fish stopped it.', 'Feed the Disgusting Fish in time, every time (about 4 seconds left on the cast). The fourth time, it can\'t be stopped.');
      rows.push([{ txt: 'Final Ascension' }, { t: c.t }, { txt: 'went off', bad: !soft, warn: soft, sub: pl(who.size, 'player') + ' hit for ' + (c.t1 - c.t + 0.5).toFixed(1) + ' s' }, died.length ? { txt: pl(died.length, 'death'), bad: true } : { txt: '—', dim: true }]);
    }
    asc.filter((t) => !hits.some((e) => e.t >= t && e.t <= t + 9)).forEach((t) => rows.push([{ txt: 'Final Ascension cast' }, { t }, { txt: 'stopped by the fish' }, { txt: '' }]));
    rows.sort((a, b) => a[1].t - b[1].t);
    if (rows.length) sections.push({ id: 'ascension', title: 'Final Ascension (Feed a fish in time)', place: 'Final Ascension (enrage): a fish in time', spell: [LE.fish, 'Disgusting Fish'], verdict: rows.some((x) => x[2].bad) ? 'bad' : rows.some((x) => x[2].warn) ? 'warn' : 'good', info: !rows.some((x) => x[2].bad || x[2].warn),
      summary: (fish.length === 1 ? '1 fish' : fish.length + ' fish') + ' fed. It shows every Final Ascension cast, and any that went off on the raid.', cols: ['What', 'When', 'Result', 'Turn'], rows });
  }

  // ---- 4. Iku: Frostfire Volley (clear Burning Flames in a frost patch, Piercing Frost in a fire patch) and Blink Nova ----
  {
    const vol = castOk(LE.volley), fl = aur([LE.flames, LE.frost]).filter((e) => h.isPlayer(e.dst)), boom = dmgName('elemental explosion');
    const groups = vol.map((t, i) => {
      const next = vol[i + 1] ?? Infinity, got = fl.filter((e) => e.op === 'apply' && e.t >= t && e.t <= t + 4);
      const rows = got.map((e) => {
        const rm = fl.find((x) => x.op === 'remove' && x.dst === e.dst && x.id === e.id && x.t > e.t), tE = rm ? rm.t : dur, d = r.deaths.find((x) => x.guid === e.dst && x.t >= e.t && x.t <= tE + 0.3);
        const late = !d && tE > next - 0.2, type = e.id === LE.flames ? 'Burning Flames' : 'Piercing Frost';
        if (late) M(next, pname(e.dst), type, 'High', 'Still had ' + type + ' when the next Frostfire Volley landed (an Elemental Explosion risk).', 'Clear it before the next volley. Stand in the other element\'s patch (frost patch for Burning Flames, fire patch for Piercing Frost).');
        if (d) M(d.t, pname(e.dst), type, 'High', 'Died with ' + type + ' still on.', 'Clear it right away in the other element\'s patch.');
        return [{ p: pname(e.dst), sub: type }, { t: tE }, d ? { txt: 'died with it', bad: true } : late ? { txt: 'still on at the next volley', bad: true } : { txt: 'cleared after ' + (tE - e.t).toFixed(1) + ' s', warn: tE - e.t > 8 }, { txt: '' }];
      });
      const bb = boom.filter((e) => e.t >= t && e.t < next);
      if (bb.length) { M(bb[0].t, 'Raid', 'Elemental Explosion', 'High', 'Elemental Explosion went off on the raid. A volley hit someone still carrying the other element.', 'Clear Burning Flames and Piercing Frost before the next volley, every time.'); rows.push([{ txt: 'Elemental Explosion' }, { t: bb[0].t }, { txt: 'went off', bad: true }, { txt: '' }]); }
      return { title: 'Frostfire Volley ' + (i + 1), t, bad: rows.some((x) => x[2].bad), warn: rows.some((x) => x[2].warn), sub: pl(got.length, 'player') + ' hit' + (rows.some((x) => x[2].bad) ? '' : ', all cleared'), rows };
    }).filter((g) => g.rows.length);
    if (groups.length) sections.push({ id: 'frostfire', title: 'Frostfire Volley (Swap patches)', place: 'Frostfire Volley (fire and frost): cleared before the next', spell: [LE.volley, 'Frostfire Volley'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: pl(groups.length, 'volley') + '. It shows when each player cleared their Burning Flames or Piercing Frost, and anyone still carrying one at the next volley.', cols: ['Player', 'Cleared', 'Result', ''], groups, rows: [] });

    const bA = aur(LE.blink).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), bH = dmgId(LE.blinkHit);
    // (the blast's size, measured: how far from its target the furthest player it hit stood, over the pull's Blink Novas,
    // so each map draws the circle it really covered (the guides don't publish it))
    const bOf = (e) => { const hits = bH.filter((x) => x.t >= e.t + 5 && x.t <= e.t + 9); return { hits, tm: hits.length ? hits[0].t : e.t + 7 }; };
    // (measured, it hits nearly the whole raid (55 yards on the test night), weaker further out, so there's no blast circle
    // to draw; the map shows the guides' advice instead: 20 yards around the target, with the raid outside it)
    const bR = 20;
    const rows = bA.map((e) => {
      const { hits, tm } = bOf(e), died = deadBy(/blink nova/i, tm - 0.2, tm + 2), who = new Set(hits.map((x) => x.dst));
      for (const d of died) M(d.t, d.player, 'Blink Nova', 'High', 'Died to Blink Nova.', 'Spread out for Blink Nova. Its target moves at least 20 yards from the melee and away from the raid.');
      return [{ p: pname(e.dst) }, { t: tm }, { txt: who.size ? fmtM(hits.reduce((s, x) => s + (x.raw || x.amt), 0) / who.size) + ' each on average' : '—', dim: !who.size }, died.length ? { txt: died.map((d) => d.player).join(', ') + ' died', bad: true } : { txt: '—', dim: true },
        { map: { t: tm, hl: [e.dst], hlLabel: 'Blink Nova target', bad: died.map((d) => d.guid), badLabel: 'died to it', title: 'Blink Nova on ' + pname(e.dst) + ' at ' + T(tm), pts: h.snap(tm), frames: frames(tm - 4, tm + 1),
          rings: [{ guid: e.dst, r: bR, t0: e.t, dur: tm - e.t + 1, fx: 'burst', at: tm, label: 'Blink Nova', ...mcol('Blink Nova', 0.12), legend: '20 yards around the Blink Nova target, from the moment it was marked; the guides say to keep the raid outside it' }] } }];
    });
    if (rows.length) sections.push({ id: 'blink', title: 'Blink Nova (Target runs out)', place: 'Blink Nova (raid hit): spread, target away from the raid', spell: [LE.blink, 'Blink Nova'], verdict: rows.some((x) => x[3].bad) ? 'bad' : 'good',
      summary: pl(rows.length, 'Blink Nova') + '. It shows each one\'s target, what it cost the raid, and deaths to it.', cols: ['Target', 'When', 'Raid damage', 'Died', ''], rows });
  }

  // ---- 5. Nama: Mighty Thud (three leaps, each split by everyone under it) ----
  {
    const leaps = castOk(LE.thud), hit = dmgId(LE.thudHit), after = dmgId(LE.aftershock), groups = [];
    // How it plays (Method's Heroic and Mythic guides, and the log): Nama marks three players and leaps onto each in turn,
    // closest first, about 2 seconds apart. Each landing hits everyone within 6 yards (the log's hits all stood within
    // about 5.5 yards of the marked player) and knocks them back; on Mythic the raid lines the marks up away from Nama and
    // gets knocked from the first into the second, then the third. Each leap's cast records where Nama landed, which is
    // where its marked player stood.
    const THUD_R = 6;
    const spotOf = (t) => { const c = ev.find((e) => e.k === 'cast' && e.id === LE.thud && Math.abs(e.t - t) < 0.4 && e.x != null), sp = h.snap(t);
      const who = new Set(hit.filter((e) => e.t >= t - 0.2 && e.t <= t + 0.8).map((e) => e.dst)), on = sp.filter((p) => who.has(p.guid));
      return c ? { x: c.x, y: c.y } : on.length ? { x: on.reduce((s, p) => s + p.x, 0) / on.length, y: on.reduce((s, p) => s + p.y, 0) / on.length } : null; };
    const sets = clusters(leaps.map((t) => ({ t })), 6);
    for (const [si, c] of sets.entries()) { const nextSet = sets[si + 1] ? sets[si + 1].t : null;
      // (one map for the whole set (your note, Oct 18), on its own row above the leaps: all three marks numbered in order,
      // each filling as its leap comes, then slamming and leaving a crater (Aftershock), with a dashed line from Nama to the
      // mark he leaps to next)
      const spots = c.list.map((l) => spotOf(l.t)), c0 = c.list[0].t - 2.5, c1 = c.list[c.list.length - 1].t + 1.2;
      const boss = (h.snap(c0).find((p) => p.kind === 'boss' && /nama/i.test(p.name || '')) || {}).guid;
      const setRings = () => c.list.flatMap((l, k) => { const s = spots[k]; if (!s) return [];
        const base = { r: THUD_R, ...mcol('Mighty Thud', 0.16), cn: 'Orange circle', legend: 'a Mighty Thud mark, 6 yd: it fills as Nama\'s leap comes, then slams (numbered in leap order)' };
        // (each mark sits where its leap landed: the marked players hold their spots, and a mark that followed whoever stood
        // nearest jumped between players as they were knocked around)
        return [{ ...base, x: s.x, y: s.y, t0: c0 - 1, dur: l.t - c0 + 1.8, fx: 'soak', at: l.t, label: String(k + 1) },
        { x: s.x, y: s.y, r: THUD_R, color: '#a8662e', fill: 'rgba(120,70,30,.22)', fx: 'puddle', t0: l.t + 0.8, dur: 60, label: '', cn: 'Brown circle', legend: 'a crater a leap left (Aftershock: stay out of it)' }]; });
      const setLinks = boss ? c.list.map((l, k) => spots[k] ? { from: boss, toPt: { x: spots[k].x, y: spots[k].y }, t0: k ? c.list[k - 1].t + 0.3 : c0 - 1, t1: l.t - 0.1, color: '#f2842f', dash: true, legend: 'where Nama leaps next' } : null).filter(Boolean) : [];
      // (the log hardly updates Nama's position mid-set, so on the map he hops onto each mark as its leap lands)
      const setFrames = frames(c0, c1).map((f) => { const k = c.list.reduce((m, l, i) => (l.t <= f.t + 0.01 && spots[i] ? i : m), -1); if (k < 0 || !boss) return f;
        return { t: f.t, pts: f.pts.map((p) => (p.guid === boss ? { ...p, x: spots[k].x, y: spots[k].y } : p)) }; });
      const fc = spots.filter(Boolean), focus = fc.length ? (() => { const x = fc.reduce((s, p) => s + p.x, 0) / fc.length, y = fc.reduce((s, p) => s + p.y, 0) / fc.length; return { x, y, r: Math.max(8, ...fc.map((p) => Math.hypot(p.x - x, p.y - y) + 3)) }; })() : undefined;
      const per = c.list.map((l) => ({ who: [...new Set(hit.filter((e) => e.t >= l.t - 0.2 && e.t <= l.t + 0.8).map((e) => e.dst))], died: deadBy(/mighty thud/i, l.t - 0.2, l.t + 1.5) }));
      const rows = c.list.map((l, k) => {
        const { who, died } = per[k];
        if (!who.length) M(l.t, 'Raid', 'Mighty Thud', 'High', 'Nobody was under Mighty Thud leap ' + (k + 1) + ': the whole raid took the full hit.', 'Line up away from Nama and soak all three leaps. Everyone takes the first, then gets knocked into the next.');
        for (const d of died) M(d.t, d.player, 'Mighty Thud', 'High', 'Died to Mighty Thud leap ' + (k + 1) + ' (' + pl(who.length, 'soaker') + ').', 'Bring more players into each leap so the hit is split, and use a defensive if your health is low.');
        return [{ txt: 'Leap ' + (k + 1) }, { t: l.t }, { txt: who.length ? pl(who.length, 'soaker') : 'nobody under it', bad: !who.length, warn: who.length > 0 && who.length < 5, sub: who.map(pname).join(', ') }, died.length ? { txt: died.map((d) => d.player).join(', ') + ' died', bad: true } : { txt: '—', dim: true }, { txt: '' }];
      });
      // (the set's map: a green check on each player from the first leap they soaked)
      const first = new Map(); per.forEach((p, k) => { for (const g of p.who) if (!first.has(g)) first.set(g, c.list[k].t); });
      const allDied = per.flatMap((p) => p.died.map((d) => d.guid)), tEnd = c.list[c.list.length - 1].t + 0.3;
      rows.unshift([{ txt: 'All ' + c.list.length + ' leaps', sub: 'the whole set, on one map', dim: true }, { t: c.t }, { txt: '' }, { txt: '' },
        { map: { t: tEnd, good: [...first.keys()], goodLabel: 'soaked a leap', goodAt: [...first].map(([g, t]) => [g, t]), pendLabel: 'not under a leap yet', bad: allDied, badLabel: 'died to it',
          title: 'Mighty Thud at ' + T(c.t) + ': all ' + c.list.length + ' leaps, in order', pts: h.snap(tEnd), frames: setFrames, rings: setRings(), links: setLinks, focus } }]);
      // (the craters it leaves (Aftershock) count too (your note, Oct 18: any mess-up with it shows under what went wrong):
      // everyone who stood in one, from the first leap until the next set or a minute later, with a map of the first hit)
      const lr = rows.slice(1), cEnd = Math.min(nextSet != null ? nextSet : Infinity, c.list[c.list.length - 1].t + 60);
      const ash = after.filter((e) => e.t >= c.list[0].t && e.t < cEnd), ashBy = new Map(); for (const e of ash) { const o = ashBy.get(e.dst) || { n: 0, amt: 0, t: e.t }; o.n++; o.amt += e.amt || 0; ashBy.set(e.dst, o); }
      const ashDied = deadBy(/aftershock/i, c.list[0].t, cEnd);
      if (ashBy.size || ashDied.length) { const t1 = ash.length ? ash[0].t : ashDied[0].t, ord = [...ashBy].sort((a, b) => b[1].n - a[1].n);
        // (the count leads the row, so the summary line reads "7 players stood in a crater"; the names and ticks sit beside it)
        lr.push([{ txt: ashBy.size ? pl(ashBy.size, 'player') + ' stood in a crater' : 'Craters', warn: [...ashBy].some(([g, o]) => o.n >= 4 && h.role(g) !== 'tank'), sub: 'amber when someone other than a tank stayed in for 4 ticks or more' }, { t: t1 }, { txt: ord.map(([g, o]) => pname(g) + ' (' + o.n + (o.n === 1 ? ' tick)' : ' ticks)')).join(', ') || '—', dim: true },
          ashDied.length ? { txt: ashDied.map((d) => d.player).join(', ') + ' died', bad: true } : { txt: '—', dim: true },
          { map: { t: t1 + 0.2, hl: [...ashBy.keys()], hlLabel: 'stood in a crater', bad: [...new Set(ash.filter((e) => e.t <= t1 + 3).map((e) => e.dst))], badAt: ash.filter((e) => e.t <= t1 + 3).map((e) => [e.dst, e.t]), badLabel: 'took an Aftershock tick',
            title: 'Aftershock at ' + T(t1) + ': the craters Mighty Thud left, and who stood in one', pts: h.snap(t1 + 0.2), frames: frames(t1 - 2.5, t1 + 3), focus,
            rings: c.list.flatMap((l, k) => spots[k] ? [{ x: spots[k].x, y: spots[k].y, r: THUD_R, color: '#a8662e', fill: 'rgba(120,70,30,.22)', fx: 'puddle', t0: l.t + 0.8, dur: 60, label: '', cn: 'Brown circle', legend: 'a crater a leap left (Aftershock: stay out of it)' }] : []) } }]);
        rows.push(lr[lr.length - 1]); }
      groups.push({ title: 'Mighty Thud at ' + T(c.t), t: c.t, bad: lr.some((x) => x.some((q) => q.bad)), warn: lr.some((x) => x.some((q) => q.warn)), sub: lr.slice(0, c.list.length).map((x) => x[2].txt.replace(/ soakers?/, '')).join(', ') + ' soakers' + (ashBy.size ? ', ' + pl(ashBy.size, 'player') + ' in a crater' : ''), rows });
    }
    if (groups.length) sections.push({ id: 'thud', title: 'Mighty Thud (Soak every leap)', place: 'Mighty Thud (leaps): every landing soaked, craters avoided', spell: [1296094, 'Mighty Thud'], verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
      summary: pl(groups.length, 'Mighty Thud') + '. It shows who was under each of the three leaps, deaths to them, and anyone who stood in the craters they left.', cols: ['Leap', 'When', 'Soakers', 'Died', ''], groups, rows: [] });
  }

  // ---- 6. Gebbo: Explosive Surprise (bounce over the Blast Wave with a mushroom) ----
  {
    const bm = aur(LE.bomb).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), bo = aur(LE.bounce).filter((e) => e.op === 'apply' && h.isPlayer(e.dst)), bw = dmgName('blast wave'), fb = dmgName('fungal burst');
    const rows = bm.map((e) => {
      const t1 = e.t + 30, up = [...new Set(bo.filter((x) => x.t >= e.t && x.t <= t1).map((x) => x.dst))], hitW = [...new Set(bw.filter((x) => x.t >= e.t && x.t <= t1 && x.amt !== 0 /* (an immunity or a shield that took all of it is a way over it too) */).map((x) => x.dst))], hitF = [...new Set(fb.filter((x) => x.t >= e.t - 10 && x.t <= t1).map((x) => x.dst))];
      // (Oct 22, boss coverage: the fastest Mythic kills had 1 to 4 players caught by a wave and still killed it. A few caught is a
      // slip; a quarter of the raid or a death to it is the mistake, except deaths in the last 20 s of a kill, as for every death)
      const wDied = r.deaths.some((d) => /blast wave/i.test(d.ability || '') && d.t >= e.t && d.t <= t1 + 3 && !(r.item.kill && d.t >= dur - 20)), wBad = wDied || hitW.length >= Math.max(5, Math.ceil(r.players.size / 4));
      for (const g of hitW) M(e.t + 10, pname(g), 'Blast Wave', wBad ? 'High' : 'Medium', 'Hit by the Blast Wave from Explosive Surprise.', 'Bounce over the Blast Wave on a mushroom, or use a blink, teleport or leap.');
      return [{ p: pname(e.dst), sub: 'had the bomb' }, { t: e.t }, hitW.length ? { txt: pl(hitW.length, 'player') + ' hit by the Blast Wave', bad: wBad, warn: !wBad, sub: hitW.map(pname).join(', ') } : { txt: 'nobody hit by the Blast Wave' }, { txt: pl(up.length, 'player') + ' bounced', dim: true, sub: hitF.length ? pl(hitF.length, 'Fungal Burst hit') : '' }];
    });
    if (rows.length) sections.push({ id: 'bomb', title: 'Explosive Surprise (Bounce over the wave)', place: 'Explosive Surprise (bomb): over the Blast Wave', spell: [LE.bomb, 'Explosive Surprise'], verdict: rows.some((x) => x[2].bad) ? 'bad' : rows.some((x) => x[2].warn) ? 'warn' : 'good',
      summary: pl(rows.length, 'bomb') + '. It shows who had it, who bounced over the wave on a mushroom, and anyone the Blast Wave hit.', cols: ['Bomb', 'When', 'Result', 'Bounced'], rows });
  }

  // ---- 7. tanks: Shredding Shards (Iku) and Steady Strikes (Nama), stacks before each swap ----
  {
    const rows = [];
    for (const [id, name] of [[LE.shards, 'Shredding Shards'], [LE.steady, 'Steady Strikes']]) {
      const a = aur(id).filter((e) => h.isPlayer(e.dst)), runs = new Map();
      for (const e of a) { let o = runs.get(e.dst); if (e.op === 'apply') { o = { g: e.dst, t: e.t, mx: 1 }; runs.set(e.dst, o); } else if (o && (e.op === 'dose' || e.op === 'rdose')) o.mx = Math.max(o.mx, e.stacks || o.mx); else if (o && e.op === 'remove') { const d = r.deaths.find((x) => x.guid === o.g && x.t >= o.t && x.t <= e.t + 0.3);
        rows.push([{ p: pname(o.g), sub: name }, { t: e.t }, { txt: pl(o.mx, 'stack') + ' before it dropped' }, d ? { txt: 'died', bad: true, sub: d.ability || '' } : { txt: '—', dim: true }]); runs.delete(o.g); } }
    }
    rows.sort((a, b) => a[1].t - b[1].t);
    // (one mistake per tank death, even with both stacks up)
    const said = new Set();
    for (const x of rows.filter((q) => q[3].bad)) { const k = x[0].p + '|' + Math.round(x[1].t); if (said.has(k)) continue; said.add(k); M(x[1].t, x[0].p, x[0].sub, 'High', 'Died with ' + x[2].txt.replace(' before it dropped', '') + ' of ' + x[0].sub + '.', 'Swap tanks earlier as the stacks ramp.'); }
    if (rows.length) sections.push({ id: 'tankstacks', title: 'Tank stacks (Swap before too many)', place: 'Tank stacks: swapped in time', spell: [LE.shards, 'Shredding Shards'], verdict: rows.some((x) => x[3].bad) ? 'bad' : 'good', info: !rows.some((x) => x[3].bad),
      summary: 'It shows each tank\'s Shredding Shards (Iku) and Steady Strikes (Nama) stacks before they dropped.', cols: ['Tank', 'Dropped', 'Stacks', 'Died'], rows });
  }

  // ---- 8. avoidable damage ----
  const av = avoidPanel(ev, r, h, [
    { n: ['blast wave'], label: 'Blast Wave', harm: 'High', why: 'the bomb\'s shockwave (bounce over it on a mushroom)' },
    { n: ['aftershock'], label: 'Aftershock', harm: 'Medium', why: 'the craters Mighty Thud leaves for 30 seconds' },
    { n: ['evil eyes'], label: 'Evil Eyes', harm: 'Medium', why: 'the statues\' flame puddles' },
    { n: ['fungal burst'], label: 'Fungal Burst', harm: 'Medium', why: 'a mushroom bursting next to you after someone bounced' },
    { n: ['throw junk'], label: 'Throw Junk', harm: 'Medium', why: 'standing where a box lands' },
  ]);
  if (av) sections.push(av);

  const diag = [['Disgusting Fish', LE.fish], ['Final Ascension', LE.ascension], ['Final Ascension hit', LE.ascensionHit], ['United Defense', LE.united], ['Throw Junk', LE.junk], ['Relic Rupture', LE.rupture], ['Splinters', LE.splinters],
    ['Explosive Surprise', LE.bomb], ['Bounce', LE.bounce], ['Frostfire Volley', LE.volley], ['Burning Flames', LE.flames], ['Piercing Frost', LE.frost], ['Blink Nova', LE.blink], ['Icebound Flames', LE.kick], ['Shredding Shards', LE.shards],
    ['Mighty Thud', LE.thud], ['Aftershock', LE.aftershock], ['Shell Spin', LE.spin], ['Steady Strikes', LE.steady]].map(([name, id]) => {
    const c = { cast: 0, dmg: 0, aura: 0, other: 0 };
    for (const x of ev) if (x.id === id) { if (x.k === 'cast' || x.k === 'start') c.cast++; else if (x.k === 'dmg') c.dmg++; else if (x.k === 'aura') c.aura++; else c.other++; }
    return { name, id, ...c, total: c.cast + c.dmg + c.aura + c.other };
  });
  { const pc = paceCard(ev, r, h, mistakes, "The Lost Explorers", { phases }); if (pc) sections.push(pc); } /* (Pace, Oct 22: boss coverage) */
  return { diag, title: r.item.diff + ' audit: The Lost Explorers', reached: phases[phases.length - 1].name, phases, marks, sections, mistakes, note: '' };
}

// "How it works": a short plain-language summary of each mechanic and its strategy, shown at the top of its
// section in the Fight audit. Keep these neutral and short; they match what the checks look for.
const HOW = {
  // (Oct 20: from the boss guide and the Mythic logs, the guild's and the 10 fastest kills)
  'Nymrissa Wavecaller': {
    nyadds: 'Alluring Bubble sits in the middle and lures a set of 17 Bubblefin Shorerunners and 2 Frostscales, twice in each loop. They take about 30 seconds to reach it. Any murloc that gets in comes out as a Bubblefin Berserker when the whirlpools pop the bubble, and it pulses the whole raid every 3 seconds. Cleave the set down on the way in, use stuns and slows on the ones that slip past, and kill a Berserker the moment it appears.',
    nyscale: 'On Mythic each set has 2 Bubblefin Frostscales. Their Waterfog Shield gives the murlocs near them 99% less damage taken, so kill them first, then cleave the Shorerunners. Top raids kill almost all of them within 25 seconds.',
    nyburst: 'On Mythic every Frost Orb soaked sets off Frost Burst on the whole raid. Abyssal Rain lands about 5 seconds after the orbs drop and ticks for 27 seconds, so nearly every soak happens on top of it. Space the soaks out so healers can top everyone up between bursts. Top raids do soak some within a second of each other, but a set full of them, or deaths, is a problem.',
    orbs: 'Chilling Frost marks 3 players, and each drops 3 Frost Orbs. Every orb needs a soaker, by touching it. Each soak gives the soaker a damage over time and a slow, and leaves an ice puddle. Immunities soak for free, so raids often send one immune player through several orbs. An orb nobody touches Shatters on the raid.',
    nypop: 'Swirling Whirlpools form at the edges and surge to the middle, leaving one gap: stand in it. When they reach the bubble it pops (Pop!), hitting the raid and knocking everyone back. Stand where the knockback keeps you on land: anyone pushed into the water is bitten by the sharks (Wild Bite), so get out at once.',
    nyrain: 'Abyssal Rain hits the raid, then leaves a damage over time for 27 seconds, and each cast makes Nymrissa hit harder for the rest of the fight. It comes about 5 seconds after Chilling Frost, so it overlaps the orb soaks. Plan a raid cooldown for each one, and use a personal defensive if you soak during it.',
    nyjet: 'Water Jet is a beam on the current tank that hits harder with every tick, so the tanks swap on every one. Aim it over the ice puddles the orbs leave: it clears them. Everyone else stays out of the beam.',
  },
  'The Coiled Altar': {
    orbs: 'Toxic Deluge spits venom orbs around the room, and every orb left out pulses raid damage. Players carry orbs into a line in front of the boss, and the tank\'s Sever destroys every orb in its cone. Each destroyed orb gives the whole raid one Venom Rupture stack, whatever its color. About 4 orbs per frontal: the two frontals split each Toxic Deluge\'s 8 orbs. Never 8 at once. Push Zul\'jan at 11 Venom Rupture stacks or fewer, under stacked raid cooldowns. On Mythic some orbs are purple. Only the assigned carriers move them, nothing may touch a purple\'s ring (a carried green may pass a carried purple), and a purple still out when the pools come is a wipe. In P3 the first frontal takes every purple at once. Greens can be left if needed, but purples never. Defilement of the Coiled Altar detonates whatever is on the ground.',
    soakq: 'Zul\'jan marks a player and drops an axe on them. Everyone inside the 9-yard circle splits the damage. On Mythic it needs at least 5 players (3 on Heroic and Normal), so over-send. In phase 1 the first soak is 5 to 8 players with personals, and the second is the immunities and both tanks. In phase 3 each axe needs at least 5, free of the debuff. The row shows who was in, what each had up, the target and the corner.',
    tankfront: 'The boss frontals leave a debuff on the tank. In P1 the tanks taunt-swap so every Sever lands on a fresh tank. In P2 one tank takes every Soul Sever: a defensive on the first stack, a big defensive and an external on the second, and the stacks drop before a third. Red: a tank died to it or took a third stack. Amber: a second stack with no external, immunity or second defensive, or a missed swap in P1.',
    shield: 'Every second set of adds is followed by Eternal Nightfall: Malacrass shields himself while casting it. This is the damage check of P2 and P3: assign cooldowns and pool damage for every shield. The cast can only be kicked once the shield is gone, so it takes two steps. Break the shield, then kick Malacrass before the 17s cast finishes. Give every shield a kicker and a backup. Broken shows how far into the cast the shield came off and how much time was left to kick.',
    dmghost: 'Dreadmarch mind controls a few players, who walk to the edge and jump off unless their absorb shield is broken in time. Targets stack on the raid\'s Dreadmarch marker and press a macro that cancels their own shields and speed buffs. Stuns and grips stop them walking. When the mind control breaks, stand still: your ghost spawns where you are a moment later, so the ghosts start in one clump. On Mythic only you can see your ghost (an interrupted Wail reveals them all briefly). Two ghosts touching hits both players hard (Malevolent Resonance). The boss tank aims Soul Sever to hit as many ghosts as possible; a ghost it misses is walked back for the next one, and staring at your ghost at the end of P2 makes it disappear at the transition. (Maps show ghosts where they spawned; the log has no later positions for them.)',
    addsets: 'Spiritcackle summons two Spiteful Soulcoilers that cast Wail of Terror, a raid-wide fear that must be interrupted. They jump after each kick and become immune to kicks at full energy. Kick as soon as the Gloombomb cast starts, so the add stays put for the Gloombomb overlap and there is time for the next kick. The melee add\'s second kick should be a melee player. Kill both adds before the next set spawns: on Mythic each add hits the raid with Retaliatory Malice every 3 seconds for as long as it lives. (Their Spirit Shields and the Gloombombs are in the Gloombombs panel.)',
    gloom: 'On Mythic each Spiteful Soulcoiler spawns with Spirit Shield (99% damage reduction, 2 stacks). Malacrass puts Gloombomb on two melee and two ranged players; 5 seconds later each one explodes in a 15-yard circle, and every Soulcoiler inside loses a stack. Each pair overlaps its circles on its own add (melee on the unmarked melee add, ranged on the marked ranged add), so both shields break. A bomb that misses, or lands on a leftover add from an earlier set, leaves this set\'s shield up. Everyone else stays out of the circles.',
    inter: 'Malacrass channels Soulbinding: Zul\'jan takes double damage, so use Bloodlust and burn him. Fragments of Malacrass rush toward Zul\'jan and heal him for about 10% if they reach him, which is close to a wipe. Players block them, but every block gives the whole raid a Spirit Erasure stack (more damage taken), so soak in rounds: 3 to 5 stacks, let them drop, repeat; near the end stack raid cooldowns in the middle and go up to 7 to 10. Spread soakers around the room, including the inner ring. Zul\'jan under 35% when it ends is on pace for the kill.',
    avoid: 'Every source of damage that positioning can avoid, most harmful first. Dangerous (red on any hit): tank frontals on non-tanks and ghosts touching. Harmful: the statue poison pools (Noxious Ground), Axegrinder axes, someone else\'s Gloombomb, standing near a purple orb carrier, and P3 Defiled Ground. Minor: standing near a green orb carrier and Toxic Deluge impacts. Pools count the seconds you stood in them, axes and the rest the times you walked into them, against the fastest kills by the same point of the fight: the second Fangs fills the middle, so a few seconds there is normal. Tanks aren\'t judged on Axegrinder. Raid-wide damage (orb pulses and ruptures, Dreadful Presence, Retaliatory Malice, the Guillotine burst) isn\'t avoidable and isn\'t listed.',
    vf: 'Zul\'jan\'s Venomfang puts a 14-second poison on random players. Dispel it quickly: any healer can take it. It\'s a small part of the raid\'s damage, and it doesn\'t kill on its own, so a slow dispel is a small slip, never a fail. Each row is one Venomfang: how long it stayed on and who dispelled it. Amber: on for more than 4 seconds or never dispelled.',
    push: 'Phase changes are timed. In P1 hold damage, then kill Zul\'jan in the middle after the last Toxic Deluge with Darkness, Anti-Magic Zone and Spirit Link stacked (aim for 9 to 11 stacks). Push Malacrass right after a Soul Sever clears the ghosts (watch the knockback at the edge), use Lust in the intermission, and in P3 kill Zul\'jan first, before the Defilement that follows the burn, with Malacrass at about 7 to 8%, then finish Malacrass before he enrages.',
  },
  'Entombed Sentinels': {
    helix: 'At 100 energy both bosses go to the middle and take 99% less damage (Vitriolic Stasis), and everyone gets Helical Toxins: four orbs over your head, some green. Touch exactly one other player so your green orbs make 4: 1 with 3, 2 with 2. On Mythic the counts hide after a few seconds, so the raid uses a system (who pings and jumps, who goes under the boss) and your debuff stacks are your green orbs. A wrong bump adds the two counts together instead of clearing. Anyone still holding it after 28 seconds takes Cultivated Burst (a huge hit, a long damage over time and a red pool), so a failed player goes to a far corner and stops bumping. The bosses heal during the game: calm, but not slow. Each player\'s count (the number by their name) isn\'t written in the log. It\'s read from the debuff\'s damage, about 15k a stack every 2 seconds, so a pair that solved it before the first tick has none. Amber: solved after a wrong bump. Red: didn\'t solve it (Cultivated Burst).',
    protovenom: 'Mythic: Vashnik, in the room, puts an orange circle on eight players (Shifting Protovenom), about 6 yards around them, pulsing about 233k every 2 seconds. It does nothing for the first second and a half. Two circles touching clears both harmlessly. A circle touching a player without one is a Protovenom Eruption, damage and a big knockback for both, and the circle stays. Everyone, tanks and melee too, spreads before it lands, then circles pair up, crossing to the other group if needed. Amber: took over 6 seconds to clear. Red: an eruption.',
    droplets: 'The Breath of Ula\'tek sprays Toxic Droplets. Step on each one (about 375k) before it erupts on the whole raid 12 seconds later (Noxious Blast). On Mythic two at once can kill you, so one each. Tanks can take extras. On the hard sets, the one right before the intermission or droplets in a blood pool, use mobile immunities. Each destroyed droplet\'s venom flies back to the boss 4 seconds later (Living Venom, 375k a hit): dodge it. Amber: two at once (not a tank or immune). Red: one erupted on the raid, or a death. Venom hits are shown here and judged under Avoidable damage.',
    coag: 'The Breath of Ula\'tek spawns a Venom Coagulation near random players. It pulses raid damage (Contaminate) while alive. Bait it ahead of the group so it doesn\'t land in blood. The first of a cycle can be cleaved down. The second spawns right before the intermission and has to die before it, with red-side ranged helping. After the last intermission, leave the new add: the enrage is close. Amber: an add never killed. Red: the one before an intermission still alive when it starts.',
    miasma: 'The Blood of Ula\'tek marks a player with Unstable Miasma: a soak. On Mythic at least eight players soak it, far back in a corner. Fewer means more Blood Venom stacks each and bigger pools, and too few kills. The soakers then line up along the back wall to drop their pools and move out. Amber: seven soakers on Mythic (one short). Red: six or fewer, or a soaker died.',
    blighted: 'Blighted Blood is a dispellable damage over time on a few players. Healers dispel it as soon as it lands. One that runs out drops a blood pool. Amber: on for more than 5 seconds, or it ran out. Red: the player died with it.',
    pools: 'Everything on the red side drops blood pools: Blood Venom when it ends (bigger with more stacks), a Blighted Blood that ran out, and the red tank\'s Bloodvenom Injection when the tank swaps off. Keep a set pattern along the walls so the room stays open. After the second intermission most of it should still be free. One floor map per cycle, every pool so far, this cycle\'s brighter. Not judged.',
    marks: 'Each boss stacks its own damage over time on everyone within 40 yards: Mark of Acid from the Breath, Mark of Blood from the Blood. Be in range of only one boss. Spread-damage specs cleave both from the edge of range. Stacks are counted from 8 seconds after each intermission (the swap). Amber: 3 or more stacks of the other boss\'s Mark in a cycle. Red: 6 or more. Tanks aren\'t judged.',
    balance: 'Keep the bosses 40+ yards apart (closer, they take 99% less damage) and at even health: Vitriolic Stasis heals the lower one up to the other, so any lead is wasted. Balance by moving players between sides, not by stopping damage. Amber: 5+ points apart going into an intermission. Red: within 40 yards for 3+ seconds outside the intermissions.',
    tanks: 'There\'s one tank on each boss. Empowering Slam on the Breath ramps on the same tank, and Bloodvenom Injection on the Blood stacks a damage over time. They trade bosses at every intermission so the stacks drop, and the tank leaving the Blood drops a big pool when Injection ends: into old blood. Red: no swap after an intermission.',
    avoid: 'Every source of damage positioning can avoid, most harmful first. Dangerous: Protovenom Eruption (a circle touching a player without one). Harmful: Living Venom (a droplet\'s venom flying back to the boss, 375k a hit) and standing in a blood pool. Raid-wide damage (the Marks, Contaminate, Noxious Blast, the Helical Toxins ticks) isn\'t listed, and neither is Clinging Murk. It lands on every Unstable Miasma soaker.',
  },
  'The Lost Explorers': {
    boxes: 'Trader Gebbo throws boxes around the room. A box left alone glows green and ruptures on the whole raid (Relic Rupture), so one player pops every box. On Mythic every pop also hits the whole raid with a stacking bleed (Splinters), so the popper keeps a rhythm: two stacks, let them drop, two more (three if needed, never during Blink Nova or other big damage). Each row is one box: popped or ruptured, and the raid\'s stacks right after. Red: a box ruptured, or deaths to the bleed. Amber: a pop that took the raid to four stacks.',
    united: 'When all three explorers are within 30 yards of each other they take 99% less damage (United Defense). Keep at most two of them together and move them apart as soon as a third comes close. Amber: up for a moment. Red: up for more than 5 seconds.',
    ascension: 'Mor\'zahi builds energy and at 100 casts Final Ascension, which keeps hitting the raid until everyone dies. Feeding a Disgusting Fish (from the boxes) to the turtle he controls stops it and moves him to the next explorer, which then uses its empowered moves. You get three feeds, and the fourth Final Ascension is the hard enrage. Feed with about 4 seconds left on the cast. Red: Final Ascension went off.',
    frostfire: 'Iku\'s Frostfire Volley gives some players Burning Flames (fire) and others Piercing Frost (frost), each leaving a patch on the floor. Clear yours by standing in the other element\'s patch: a frost patch clears Burning Flames, a fire patch clears Piercing Frost. If the next volley hits someone still carrying the other element, Elemental Explosion can wipe the raid. Spread, and don\'t walk into a patch of your own type. Red: still on at the next volley, or a death with it. Amber: cleared after more than 8 seconds.',
    blink: 'Blink Nova: Iku blinks to a player and explodes, hitting the whole raid less the farther away they are. Spread out. The target moves at least 20 yards from the melee and away from the raid. Each row is one Blink Nova: its target, the average hit, and deaths. Red: a death to it.',
    thud: 'Nama\'s Mighty Thud marks spots and leaps to them in turn. Each landing is split between everyone within 6 yards and knocks them back, and an empty spot hits the whole raid for the full amount. Line up away from Nama. Everyone soaks the first leap and gets knocked into the next, then the third. Each landing leaves Aftershock craters for 30 seconds. Red: a leap with nobody under it, or a death. Amber: fewer than five soakers, or anyone standing in a crater.',
    bomb: 'Gebbo\'s Explosive Surprise lands a bomb on a player, then sends out a Blast Wave that kills: bounce over it on a Bouncy Mushroom (on Mythic there\'s one mushroom per bomb, so don\'t pop it early), or blink, teleport or leap over it. Drop the bomb at the edge of the room. Red: hit by the Blast Wave.',
    tankstacks: 'Iku\'s Shredding Shards (50% more damage from them per stack) and Nama\'s Steady Strikes (4% more physical damage per stack) ramp on their tanks, so swap as they climb. Each row is one stretch on a tank: the stacks before they dropped. Red: a tank death with them up.',
    avoid: 'Every source of damage positioning can avoid, most harmful first: the Blast Wave, Aftershock craters, the statues\' Evil Eyes puddles, Fungal Burst from a used mushroom, and standing where a box lands. Raid-wide damage (Malevolent Presence, Splinters, Blink Nova, Fishy Feedback) isn\'t listed.',
  },
  'Vashnik the Malignant': {
    imbibe: 'At 100 energy Vashnik casts Imbibe. It hits the raid, adds a stack of Toxic Vapor (raid damage that never goes away: the longer the fight, the harder), and drains the two fountains nearest to him. Each drained fountain gives him an infusion and sends out its venoms, so where the tank holds him decides the next stretch of the fight. Many raids keep him between the Shadow and Fire fountains the whole time. Stack for healing cooldowns and defensives on every Imbibe. Each row is one Imbibe: the fountains, the raid hit, deaths. Red: a death to it.',
    venoms: 'Each drained fountain sends venoms crawling toward the Malignant Cavity in the middle. If one gets there, Malignant Burst hits the raid hard and stacks. Burning Venoms (fire, and three on Mythic) pulse fire damage while alive and burst (Caustic Surge) when they die. Kill them first, one at a time, with crowd control or a banish on the others. Shrouded Venoms (shadow) have a full-health shield, so they need killing twice. Anything alive for 60 seconds hardens (immune to crowd control, faster). Red: a venom reached the middle. Amber: two fire adds died within 3 seconds, or an add lived over 60 seconds.',
    totems: 'Mythic: each Imbibe also raises Malignant Totems across the raid\'s half of the room. Only Plague Waves remove them. Any totem still up at the next Imbibe casts Malignance (a heavy raid hit and a stacking damage over time). One is survivable, two usually wipe. Players with Plague Froth walk to markers so their lines run through the totems. A totem glows when a wave is aimed at it. Red: two or more left at an Imbibe. Amber: one.',
    froth: 'Plague Froth coats a few players in venom that hurts anyone within 5 yards. After 8 seconds, Plague Wave erupts from each of them in four lines: north, south, east and west. Targets move away from the raid (on Mythic, to their totem markers), and everyone else stays off those lines. The map draws the four lines from each target. Red: a death to a wave. Amber: hit by one.',
    bile: 'Malignant Catalyst hits the raid and launches Catalytic Bile across the room. Each one splashes everyone within 6 yards when it lands, and one that lands on nobody hits the whole raid much harder. Spread out so every impact has someone under it. Red: a bile landed on nobody.',
    infect: 'Adaptive Infection hits a few players with an infection that matches the current infusions. Exploding Infection (fire) ticks until it\'s removed, and removing it sets off Caustic Explosion on the whole raid: healers dispel one at a time, with the raid topped up. Stygian Infection (shadow) bursts on everyone within 6 yards: the infected spread out. Red: a death to Caustic Explosion. Amber: two removed within 1.5 seconds, or hit by someone\'s Stygian Burst.',
    fangs: 'Dripping Fangs hits the tank hard and doubles the physical damage they take for 32 seconds, so the tanks swap on every cast. Red: one tank taking two in a row.',
    avoid: 'Every source of damage positioning can avoid, most harmful first: Plague Wave lines, Umbral Ejection circles from Shrouded Venoms, Stygian Bursts from infected players, and standing next to a Plague Froth target. Raid-wide damage (Imbibe, Toxic Vapor, the expulsions, Burning Presence, Caustic Surge, Malignant Catalyst) isn\'t listed.',
  },
  "Nek'zali the Soulcoiler": {
    amani: 'Restless Amani rise from the coffins at the sides and walk to the Soulcoil Well in the middle, protected by a magic-only shield (Gravebound Advance) worth a quarter of their health. Break it with magic damage, then kill them before they reach the water. Each one that gets in gives Nek\'zali 5 energy and hits the raid with a Soulcoil Rite (on Heroic and Mythic, plus a Ritual Burn stack). A dead Amani bursts (Corpse Blight) and, on Heroic and Mythic, leaves a corpse that comes back in the intermission. Red: one reached the well.',
    ignition: 'Nek\'zali teleports into the well and channels Soulcoil Ignition, which puts five Soulcoil Rites on the raid and gives her 25 energy, while Anguished Echoes rain out of the well as circles that hit hard and knock back. Use healing cooldowns and dodge the circles. On Heroic and Mythic, Ritual Burn makes each Rite hit 15% harder per stack for 60 seconds, so go in with none. An Amani reaching the well in the minute before leaves the raid with a stack. Amber: hit by a circle, or going in with Ritual Burn. Red: hit by two, or died.',
    depths: 'Mythic: twice per phase a Drowned Echo wakes in the well (Grasping Depths). While it lives the whole raid is pulled toward the middle and takes damage, so a team of about three damage dealers and a healer goes into the well to kill it, and two teams take turns. Kick every Soulcoiler\'s Curse. One that gets off throws everyone out of the well and Soulcoils them. Dodge the Swirling Spirits inside. Anyone who leaves the well gets Soul Exhaustion (300% more damage from the well), so the team that just left sits out the next one. Each group is one Echo: the team, every Curse and who kicked it. Red: a Curse got off, or a death in the well. Amber: Swirling Spirit hits, or going in with Soul Exhaustion.',
    rend: 'Essence Rend pulls a few players in, knocks them back and leaves a damage over time that healers dispel. Where it ends, a Latent Cultist spawns, a slowing puddle that stays for the whole fight and moves around the well in P2. Walk to the side of the room and get dispelled there, so the puddles stay out of the way. Each row is one debuff: who dispelled it and how far from the well its puddle landed. Amber: a puddle closer than 25 yards to the well\'s centre.',
    barrage: 'Possession Barrage sends spirits at the current tank. They hit the whole raid, harder the closer the tank stands to Nek\'zali. The tank steps 30 or more yards away from her, and nobody stands in the line between them. Amber: the tank closer than 25 yards when it went out.',
    ritual: 'At 50% Nek\'zali retreats into the well and two Echoes of Jawae protect her. Kill both to end it. Each Echo channels Soul Transfer for 15 seconds, then blasts in a line toward her. Step out of it. Hungering Pyre is a soak split between everyone within 10 yards (the melee take it). Everyone else gets a Slithering Flame, and the Pyre and the flames burn corpses. On Mythic every Amani corpse left on the floor comes back during the intermission, and more than one at a time hits the raid very hard, so burn them first. Red: three or more corpses back at once, deaths to them or to a Pyre, or a Soul Transfer hit. Amber: two at once, or a Pyre with fewer than four soakers.',
    invoke: 'Mythic: in P2 Nek\'zali casts Invoke, a 5-second cast. When it finishes, it puts a Soulcoil Rite on the raid, moves the cultist puddles around the well, and interrupts and silences anyone still casting for 3 seconds. Stop casting just before it ends. Amber: interrupted by it.',
    energy: 'Nek\'zali enrages at 100 energy (Uncoiled Rage). In P1 each Soulcoil Ignition gives her 25 and each Amani that reaches the well 5, so the fourth Ignition fills her. Reach the intermission at 50% before it. In P2 her energy climbs on its own (Uncoiling), so P2 is a damage race. Use Bloodlust there. This lists what gave her energy. Red: she enraged.',
    avoid: 'Every source of damage positioning can avoid, most harmful first: the Soul Transfer line blast, the Anguished Echoes circles, the Latent Cultist puddles, and on Mythic the Swirling Spirits in the well. Raid-wide damage (Soulcoil Rite, Corpse Blight, Possession Barrage, Uncoiling, Grasping Depths) isn\'t listed.',
  },
  Sszorak: {
    ravage: 'Ravage is the tank frontal in Sszorak\'s Apex Predator combo (five casts in random order: two Ravage, two Mutilate, one Tempest). It hits the tank very hard and leaves a debuff that makes the next Ravage hit far harder for 25 seconds, so the tanks taunt between the two Ravages of each combo and take them at the edge, away from the raid. Red: a tank taking a second Ravage with the debuff up, or anyone else in the cone.',
    mutilate: 'Mutilate is the soak frontal in the same combo. It\'s aimed at the tank and split between everyone in it, and it\'s lethal with fewer than five. Everyone hit gets Mutilated Gash for 22 seconds, which makes the next Mutilate hit them 500% harder, so the raid soaks in two groups that alternate: one takes the first Mutilate of each combo, the other the second. Red: fewer than five soakers, or someone soaking with Mutilated Gash still on.',
    tempest: 'Once per combo, Tempest sends tornadoes roaming out from the boss. A touch hits hard and stacks a damage over time. On Mythic they are one of the two biggest wipe causes. Watch them and move early. Every touch is shown with the player and how many times. Red: died to it.',
    cysts: 'After each combo, Venomous Surge puts a heavy 10-second damage over time on two players. When it ends the raid takes a hit (more the closer you are) and a Viscous Cyst drops where they stand. The cysts are the plan for the intermission: place them at the markers opposite the wind tunnels that will fire (the orbs above a tunnel show its order: one orb first, then two, then three). Four cysts for three winds leaves one spare. Each row is one cyst: who dropped it and what it was used for. Red: died with Surge on. Amber: a cyst popped outside the intermission (it knocks everyone near it back, and that cyst is gone).',
    crosswinds: 'Raging Crosswinds marks several players with an arrow. Eight seconds later, each is launched the way it points. Point your arrow at another marked player so you collide in the air and both land safely. Arrows at right angles work too. Missing everyone means drifting toward the edge. An immunity stops your own launch but can leave your partner with nobody to hit, so agree on it first. Each direction is its own debuff, so the log knows which way every arrow pointed: the map draws them (roughly north, south, east and west on the room\'s map). Amber: drifted, or hit by a flying player. Red: died.',
    fury: 'Mythic: at the pull, and again after each pop, one player is marked with Serpent\'s Fury (a big red circle that goes to the player furthest from the boss) while Sszorak builds rage. At 100 he enrages and the raid dies (Unbound Ferocity). Fourteen players stacking in the circle pop it and reset his rage. Each tank combo ends with one pop: right as the combo ends after the pull or an intermission, and a few seconds after the combo before an intermission, because his rage stops climbing during Dig In and the first pop after it needs room. Pop that one too early and the next can\'t be reached in time. Too late, and he enrages on the spot, so a timer helps. It can\'t pop during Dig In: the marked player joins the stack once Dig In starts and leaves it after the third wind. After tells how long after the tank combo each was popped, and Rage is his rage at the pop, read from his casts. Red: he enraged. Amber: popped as Dig In ended.',
    virulence: 'Mythic: everyone in a Serpent\'s Fury pop gets Virulence, which bursts 5 seconds later in four lines. Anyone a line clips takes a big hit and gets Virulence again, with longer lines. Spread out right after every pop (speed boosts help, and so does a personal every other one). Amber: clipped. Red: died to it.',
    winds: 'At 100 energy Sszorak casts Dig In for 25 seconds and takes 30% more damage: burn him. Three winds blow across the platform from the tunnels, one after another. The raid stacks in the middle. Each wind pushes the stack into the cyst opposite its tunnel, which pops, knocks everyone back toward the boss and coats them against the wind. After the third wind, pop the spare together. Each row is one wind: the cyst popped against it, how many it coated, and who died. Red: a wind with no cyst, or someone dying in it. Amber: the spare left up (it pops on its own later and knocks the raid).',
    avoid: 'Every source of damage positioning can avoid. Harmful: Caustic Claws, the venom splashes that land around the boss during Venomous Surge. Minor: standing in Caustic Residue, the puddles they leave (on Mythic the floor fills up, so move the boss to clean ground). Tempest, Virulence and flying players from Raging Crosswinds have their own sections.',
  },
  'The Twin Fangs': {
    twins:'Once one of Vexhul and Ithraz dies, the other gains Uncoiled Wrath, a stacking enrage. The Mythic plan in the guides kills one first on purpose (start on Vexhul, swap to Ithraz at 40%, kill Vexhul before the last Submerge), then finishes the other before the Wrath stacks get too high. Shown, not judged: each Fang\'s health, when it died, the biggest health gap and the Uncoiled Wrath stacks.',
    venom: 'Most mechanics add Eternal Venom stacks, and it becomes lethal at about 11 stacks on Normal and 10 on Heroic and Mythic. The plan is a budget of about one stack per set, roughly 3 under lethal (6 on Mythic) going into the enrage. Extra stacks come from soaking more than your share, standing in someone else\'s circle and Stir the Depths.',
    feast: 'Ravenous Feast strikes three times, once per group (two ranged groups and melee). Each strike needs 4 or more soakers, and a soaker is Feasted afterward, so nobody soaks a second strike in the same Feast. Under-soaked strikes hit much harder.',
    founts: 'Ravenous Feast leaves Tainted Blood founts. Players absorb them, taking a heal absorb that healers clear. A fount nobody absorbs erupts as Tainted Burst on the raid. Each Feast row shows how much of the heal absorbs each healer cleared (their healing eaten by Tainted Blood). Everyone else\'s own healing and leech is added up apart. The whole pull\'s totals are under the table.',
    soaks: 'Caustic Globules land in timed sets, and every globule must be soaked. One nobody soaks explodes on the whole raid and gives everyone an Eternal Venom stack (shown in red as Exploded unsoaked). Each player takes at most one globule per set, since each soak adds Eternal Venom. When there are fewer globules than players, rotate who soaks so the same players don\'t keep stacking. On Mythic every globule lands behind a Barbed Bulwark barrier, which has to be broken before it can be soaked (see its own section).',
    bulwark: 'On Mythic every Caustic Globule lands channeling Barbed Bulwark, a barrier that blocks the soak. Running into the globule while it\'s up hits for about 500k and knocks you back. Anything that stops a cast breaks it at once: stuns, fears, disorients and incapacitates (and, per the spell, an interrupt). Slows do nothing. Break every barrier as the globules land, then soak. A barrier nobody breaks runs out after about 10 seconds and the globule explodes on the raid with it still up. Each row is one globule: who broke its barrier, with what, and how long it was up. Amber: broken after 6 seconds (little time left to soak) or someone ran into it. Red: nobody broke it, or someone died running into it.',
    spit: 'Venomous Emergence spawns Spawn of Vexhul adds. Each marks a player for about 5 seconds and then spits a line at them. Being the target is fine. Anyone else standing in the line gets hit. Kill one add right away and the rest before their second spit.',
    ichor: 'Coiling Ichor puts a circle on a few players for about 12 seconds, damaging everyone inside it, and leaves a puddle when it expires. Targets take their circle to the edge of the room. Being a target is fine. Anyone else inside takes a small hit each second (no Eternal Venom stack, from the logs): a tick or two while stepping out is fine and isn\'t judged, but staying in it for 5 or more ticks is.',
    stone: 'Stone Breaker drops three circles in a row on the active tank, who must stand in each one as it lands. A circle the tank misses hits the whole raid.',
    avoid: 'Stir the Depths pulses the whole raid while it is out. That part can\'t be avoided and isn\'t counted. What can be avoided is stepping into the churned water it leaves behind, so each step counts as a hit. Sanguine Storm is avoidable too. Dodge it (and the puddles it leaves on Heroic and Mythic). One hit is amber, three or more red.',
  },
};

HOW["Ula'tek"] = {
  waves: 'Caustic Waves are green venom waves rolling across the platform. The tail (Gore Rattle) surfaces at the edge, two spots at a time, and each sends a wave straight across, about 12.5 yards a second. Ula\'tek sends her own as well: with the tail twice in Stage 1 and alone in Stage 3, and on Mythic every Toxic Incubation impact sends waves out from whoever took it. A hit leaves a 10-second Caustic Waves poison, and a wave that touches an egg breaks it into a Viper. Each row is one hit and says which wave it was: a tail wave (and which way it was heading), Ula\'tek\'s own, or a Toxic Incubation\'s.',
  eggs: 'Call of the Serpent drops eggs (Blightscale Spawn): on Mythic eight at the pull and eight more halfway through Stage 1, in random spots. Each egg has an assigned carrier (zones that turn with the boss) and backups. An egg that hatches on its own becomes a weak Blightscale Rawling, and a Spectral Coil popping the eggs its soakers carry is fine. Anything else green touching an egg or its carrier (Caustic Waves, the waves from the Toxic Incubation beam, Mephitic Thrash), or its carrier dying, breaks it into a Blightscale Viper. On Mythic eggs start Hardened (break the shell first, which specs with spread damage do), carrying one puts Noxious Shell on you with a 3-yard circle, and two carriers touching burst both eggs (Noxious Splash). After an egg breaks, its carrier has Rancid Yolk, and picking up another egg before it drops is deadly for anyone but a tank. In Stage 2 it is safer to let Blight Vein drop before picking up an egg. That isn\'t flagged on its own (the eggs drop right after the tether break), but a carrier who dies with it shows up as the Viper\'s cause.',
  coils: 'The tail (Gore Rattle) slams Spectral Coils: two circles in Stage 1, the right-hand one first, and a fast run of them in the intermission (six on Heroic, eight on Mythic). Each slam hits the whole raid and the players in its circle split it, so the more soakers, the less everyone takes. A soaker gets Soul Constrictor and doesn\'t count toward the next circle (standing in both is fine, it just doesn\'t help), so groups alternate: two on Heroic, three in the Mythic intermission. Egg carriers have assigned soak spots so they never touch. Soakers are counted from Soul Constrictor; a circle with fewer than about a fifth of the raid in it is flagged.',
  tank: 'One tank holds Ula\'tek and one holds her tail (Gore Rattle). Mother\'s Wrath hits the boss tank several times, knocks them back and adds Stone Venom, so swap on stacks. If its target is out of reach, the raid takes it. Nobody on the tail means Rattler Slam on the raid, and nobody in melee of Ula\'tek means Unchecked Rage. Stay in reach through swaps and when she resurfaces after submerging. Misdirects go on the tank picking up the adds.',
  incub: 'Mythic: a spectral image of Ula\'tek appears and its Toxic Incubation beam fires at the Blightscale Wretch (5 impacts). The tank not on the boss stands in the beam with a defensive. Every impact that reaches the Wretch gives it Mother\'s Boon (more damage dealt, less taken). The beam also sends Caustic Waves from the tank, so they stand where the waves hit no eggs. The image\'s side also shows where the next tail spawns.',
  wretch: 'Mythic: a Blightscale Wretch spawns at the pull, halfway through Stage 1 and in Stage 3. Its Fester Burst makes a 10-yard bubble around it and hits everyone outside, so the raid (egg carriers included) pre-positions to step in. It enrages after 30 seconds (more tank damage, and faster bursts, so stand closer for the second one). Letting it enrage is fine, but kill it before its third bubble. The bubbles come about 36, 68 and 100 seconds after it lands, so it dies in the half minute between the second and the third. It doesn\'t need a fast switch, just steady damage.',
  amps: 'Rage of the Shackled opens the Venomous Heart for 20 seconds, taking 100% more damage, three times a fight: at the end of Stage 1, at the end of Stage 2 and on the last platform. These are the damage windows. Line up damage cooldowns and potions for them (combat potions before the pull and around 4:45 and 9:45, Bloodlust on the second once the raid gets there alive). Dodge the brown Falling Debris circles. They kill anyone. On Mythic, Ula\'tek at 67% or lower after the first window and 45% or lower after the second is on pace for a kill. Shown: each window\'s damage into the heart, player by player (the faded end of a bar is damage into Ula\'tek or her tail instead, which isn\'t doubled), the boss\'s health before and after it, and the combat potions drunk for it.',
  fangs: 'Stage 2: each Doomscale Warden tethers three players with Grasping Fangs. Breaking a tether puts Blight Vein on the whole raid (both sides), and on Mythic it stacks. A common plan: one mobile ranged player breaks first, then the other five together on a call, all at the edge of their tether a couple of seconds early, with raid cooldowns stacked on both sides (meet where there are no eggs). A spread-out big break means extra Blight Vein ticks. Shown: who was tethered, each batch, the raid cooldowns under it and the Blight Vein peak; a death while tethered is flagged.',
  doomscale: 'Stage 2: break the egg shields, then kill the Doomscale Warden before its second gestation (its enrage). While it lives, standing on or next to its eggs hurts (Warden\'s Protection). Drop the small eggs into the cauldron first and the big Doomscale Eggs last (they don\'t have the 3-yard circle), before the big egg\'s timer runs out, or it hatches a Ravenous Doomscale. The cauldron hatches Weakened Doomscales (four on Mythic): mark them, give each a kick rotation for Anguished Cry, keep them off the raid with their frontal, and kill them together. When one dies the others gain Revenge (100% more haste and damage). Revenge is marked to look at. It\'s a problem when it costs something: an Anguished Cry gets through (about 1.1M to everyone within 60 yards and a 6-second stun under Revenge) or someone dies to that Doomscale while it has it. How long it lasts matters less than whether every Cry is kicked, because it casts twice as fast.',
  bite: 'Stage 3: Serpent\'s Bite marks a melee, a healer and a ranged player. Assigned soakers stand with them to take the venom off before it turns them into a Calcified Corpse. A bitten player dying is a wipe. Taking it off gives the soaker Volatile Purge. On Mythic it hits them for about 2 million when it pops, then a long damage over time, so soakers are few (about four per cast), pick players with immunities or big defensives, and get externals after. Their Purges also shoot waves, so they spread where the waves miss the raid. Shown: who cleared each bite, any Calcified Corpse, Purge holders without a defensive (Mythic) and anyone caught in a Purge they weren\'t holding.',
  shriek: 'Stage 3: each Call of the Serpent drops egg clutches. On Mythic they crawl toward the water. Grip them platform to platform (not across the middle, which can hatch Vipers) and kill them so they hatch as Rawlings before the waves. Eggs that reach the venom hatch Blightscale Shriekers: tank them, interrupt Vicious Echoes (see Interrupts) and kill them before their next cast; on Mythic, Shriekers and Rawlings start Boiling Venom (stronger) if they live too long. Shown: each Shrieker\'s time alive and anything beyond its first cast, and any Rawling that cast Acidic Expulsion.',
  avoid: 'Every source of damage that positioning can avoid, most harmful first. Dangerous: Noxious Splash (Mythic: two egg carriers within 3 yards) and the brown Falling Debris circles during the damage amps (they kill anyone). Harmful: Caustic Waves, the Weakened Doomscale frontal on non-tanks, Fester Burst (Mythic: outside the Wretch\'s bubble) and Virulent Spit. Minor: standing on or next to an egg while its Doomscale Warden lives. Raid-wide damage (Necrotic Vapors, Spectral Coils, Mephitic Thrash, Blight Vein, Circling Prey) isn\'t avoidable and isn\'t listed.',
};

// "How it works" for the Interrupts mechanic, per boss
// (Pace, Oct 22: boss coverage)
HOW["Kith'ix"] = Object.assign(HOW["Kith'ix"] || {}, { pace: "The hardest part is the third intermission, so the plan skips it: Lust, potions and every cooldown on the pull, hold the 2-minute cooldowns from 4:00 for Last Light, and push him to 25% before the third beetle set (about 4:10 to 4:20). Top guilds reach 25% at 3:46 to 4:11." });
HOW["Vashnik the Malignant"] = Object.assign(HOW["Vashnik the Malignant"] || {}, { pace: "Every Imbibe stacks Toxic Vapor on him, so he hits harder each time: the soft enrage. Burn him so the last totem set can be ignored; top guilds finish after the third or fourth Imbibe." });
HOW["Entombed Sentinels"] = Object.assign(HOW["Entombed Sentinels"] || {}, { pace: "Keep both Sentinels even and on pace: top guilds have both under 76%, 44% and 14% as the three intermissions begin, and finish in the fourth cycle. The enrage comes after the fourth cycle." });
HOW["Ula'tek"] = Object.assign(HOW["Ula'tek"] || {}, { pace: "Rage of the Shackled opens three damage windows. On pace: Ula'tek at 67% or lower after the first and 45% or lower after the second (top guilds: 60 to 66% and 32 to 40%)." });
HOW["The Twin Fangs"] = Object.assign(HOW["The Twin Fangs"] || {}, { pace: "Cleave Vexhul into execute first, then swap to Ithraz at 35%. On pace: about 25% Vexhul and 40% Ithraz by the last platform; kill Vexhul around the final soak before the enrage (about 8 minutes)." });
HOW["Nymrissa Wavecaller"] = Object.assign(HOW["Nymrissa Wavecaller"] || {}, { pace: "She enrages after a few Pops (about 7:15). Top guilds finish between the second and third Pop, at 3:49 to 4:35." });
HOW["Sszorak"] = Object.assign(HOW["Sszorak"] || {}, { pace: "He enrages at about 6:20; after the last Dig In, leave the fourth cyst. Top guilds finish at 4:43 to 5:01, with him at 34 to 39% at 3:00." });
HOW["The Lost Explorers"] = Object.assign(HOW["The Lost Explorers"] || {}, { pace: "Each explorer takes a turn being empowered. With enough damage the third turn never comes: all 20 of top guilds finish in two turns." });
const HOW_KICKS = {
  "Ula'tek": 'Three adds cast spells that must be interrupted: the Doomscale Warden\'s Malice (Stage 2, a deadly raid-wide channel), the Weakened Doomscale\'s Anguished Cry (Stage 2) and the Blightscale Shrieker\'s Vicious Echoes (Stage 3, a raid hit and stun). Give each add a kicker and a backup.',
  'The Twin Fangs': 'The Broodling of Ithraz adds cast Visceral Burst, and every cast should be interrupted. Each add is marked left or right, by its side of the platform as the raid faces the twins at the pull (Vexhul starts on the left). The first two sets come five on each side. Later sets come all on one side. Give each side its kickers and a backup, and use the map to see who was in range when a cast got off.',
  'The Coiled Altar': 'Wail of Terror is a raid-wide fear cast by the Spiteful Soulcoiler adds, so every cast has to be interrupted. The add jumps after each kick, so give each add a kick order with a backup and stay in range. On Mythic, kicking it also briefly reveals the hidden ghosts.',
};
const pl2e = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

// One "Avoidable damage" panel for a boss: a set per source (most harmful first), a row per player hit by it.
// Judged against the fastest kills (your ask, Oct 22: "Do the same thing for avoidable damage"; notes/Guides/Avoidable damage -
// how to judge it.md). AVOID_BASE: for each boss's source, how much 9 in 10 non-tank raiders in the fastest Mythic kills took by
// each point of the fight ([t, amount], never lower later). A pull is judged at its own length (up to the wipe filter), at the
// next point at or after it. Pools and ground count the seconds you stood in them (a tick is about a second); everything else
// counts hits (times you walked into it, hits more than 1.5 s apart). Amber: more than the kills' line (and at least 2), "a bit
// more than most". Red: twice that, a death to it, or any hit from a Dangerous source. Without a kill bar (a source no kill was
// hit by), the old fixed numbers. Heroic and Normal use the Mythic bars until they have their own (lenient: those fights are slower).
// Tanks (your note, Oct 18): they often take these on purpose, holding the boss in place, so a tank's hits are listed but not
// judged, unless it killed them or they kept standing in it (twice the red line, at least 6). A source that is a tank's own job to
// avoid sets tankJudged.
const AVOID_BASE = {"The Twin Fangs":{"Stir the Depths water":[0,10,[[30,0],[90,2],[150,3],[240,4],[330,5]]],"Sanguine Storm":[0,10,[[30,0],[150,3],[180,4],[300,5],[330,6]]]},"The Coiled Altar":{"Axegrinder":[0,20,[[30,1],[60,2],[120,3],[150,4],[180,5],[240,7]]],"Noxious Ground":[1,20,[[30,3],[120,16]]],"Gloombomb (not your own)":[0,13,[[30,0]]],"Mutagenic Venom (near a purple carrier)":[0,20,[[30,0],[120,1]]],"Volatile Venom (near a green carrier)":[0,20,[[30,1],[120,2],[420,3]]],"Toxic Deluge impacts":[0,10,[[30,0]]]},"Nymrissa Wavecaller":{"Swirling Whirlpools":[0,3,[[30,0]]],"Water Jet":[0,6,[[30,0]]],"Lingering Frost":[0,10,[[30,0],[60,1],[180,2],[240,3]]]},"Nek'zali the Soulcoiler":{"Latent Cultist":[1,10,[[30,0],[120,1],[150,2],[240,3]]],"Anguished Echoes":[0,9,[[30,0]]],"Swirling Spirit":[0,4,[[30,0]]]},"Entombed Sentinels":{"Living Venom":[0,10,[[30,1]]]},"The Lost Explorers":{"Aftershock":[1,10,[[30,0],[90,1],[120,3]]]},"Vashnik the Malignant":{"Plague Wave":[0,10,[[30,1],[180,2]]],"Stygian Burst":[0,10,[[30,0],[240,1]]],"Umbral Ejection":[0,8,[[30,0]]],"Plague Froth (nearby)":[0,10,[[30,1],[60,2],[150,3],[240,4]]]},"Sszorak":{"Caustic Claws":[0,9,[[30,0],[90,1]]],"Caustic Residue":[1,10,[[30,0],[90,1],[120,4],[180,5],[240,7]]]},"Ula'tek":{"Caustic Waves":[0,19,[[30,0],[480,1]]],"Fester Burst":[0,19,[[30,0]]],"Desperate Thrash (Doomscale frontal)":[0,19,[[30,0]]],"Warden's Protection":[0,19,[[30,0],[240,2]]],"Virulent Spit":[0,12,[[30,0]]],"Falling Debris":[0,12,[[30,0]]]},"Kith'ix":{"Venom Roar":[0,5,[[30,0]]],"Nullshards":[0,5,[[30,0]]],"Twisted Appendage":[0,5,[[30,0],[120,1]]],"Voidscar":[0,2,[[30,0]]]}};
// (sources measured in seconds stood in them, not hits)
// (the same from the 20 fastest Heroic kills (Oct 22); a source with no Heroic line falls back to the Mythic one)
const AVOID_BASE_H = {"The Coiled Altar":{"Axegrinder":[0,17,[[30,0],[60,1]]],"Noxious Ground":[1,14,[[30,0]]],"Volatile Venom (near a green carrier)":[0,20,[[30,1],[240,2]]],"Toxic Deluge impacts":[0,6,[[30,0]]],"Gloombomb (not your own)":[0,7,[[30,0]]]},"Nymrissa Wavecaller":{"Lingering Frost":[0,20,[[30,0],[60,2],[120,4]]],"Swirling Whirlpools":[0,8,[[30,0]]]},"Nek'zali the Soulcoiler":{"Latent Cultist":[1,19,[[30,0],[90,1],[150,2],[180,3]]],"Anguished Echoes":[0,20,[[30,1]]]},"Entombed Sentinels":{"Living Venom":[0,20,[[30,1]]]},"The Lost Explorers":{"Aftershock":[1,12,[[30,0],[90,2],[120,4]]],"Fungal Burst":[0,3,[[30,0]]]},"Vashnik the Malignant":{"Plague Wave":[0,20,[[30,1],[90,2],[150,3]]],"Stygian Burst":[0,14,[[30,0]]],"Plague Froth (nearby)":[0,20,[[30,1],[60,2],[120,3]]],"Umbral Ejection":[0,13,[[30,0]]]},"Sszorak":{"Caustic Claws":[0,19,[[30,0]]]},"Ula'tek":{"Falling Debris":[0,16,[[30,0]]],"Caustic Waves":[0,20,[[30,0],[120,1]]],"Virulent Spit":[0,19,[[30,0],[240,1]]],"Desperate Thrash (Doomscale frontal)":[0,20,[[30,0],[420,1]]],"Warden's Protection":[0,19,[[30,0],[240,1]]]},"Kith'ix":{"Nullshards":[0,20,[[30,0],[150,1]]],"Twisted Appendage":[0,19,[[30,0],[120,1]]],"Venom Roar":[0,14,[[30,0]]],"Voidscar":[0,9,[[30,0]]]}};
const AV_SECS = /noxious ground|defiled ground|caustic residue|blood pool|aftershock|evil eyes|latent cultist|lingering frost|stir the depths/i;
const AV_SECS_DEF = { High: [1, 1], Medium: [4, 8], Low: [8, 16] };
const HARM = { High: 'Dangerous', Medium: 'Harmful', Low: 'Minor' };
// (how much before a tank "kept standing in it": twice what makes anyone else red, and at least 6)
const tankKept = (bad) => Math.max(6, 2 * (bad || 1));
// (a source's [amber, red] lines at t seconds into the pull, and whether they come from the kills)
function avLim(r, src, secs) {
  const dur = r.duration || 0, DEF = { High: [1, 1], Medium: [2, 5], Low: [5, 10] };
  if (src.harm === 'High') return { kb: false, lim: () => [1, 1] };
  const bs = r.item && r.item.boss, bH = r.item && r.item.diffId !== 16 && AVOID_BASE_H[bs] && AVOID_BASE_H[bs][src.label], b = bH || (AVOID_BASE[bs] && AVOID_BASE[bs][src.label]);
  if (b && !!b[0] === !!secs) { const bars = b[2];
    return { kb: true, k: b[1], lim: (t) => { const at = dur ? Math.min(t, dur) : t, x = bars.find((q) => q[0] >= at) || bars[bars.length - 1], a = Math.max(secs ? 3 : 2, x[1] + 1); return [a, src.harm === 'Low' ? Infinity : Math.max(2 * a, a + (secs ? 5 : 3))]; /* (a Minor source is amber at most; a death to it is still red) */ } }; }
  const d = secs ? AV_SECS_DEF[src.harm] : [src.warnAt ?? DEF[src.harm][0], src.badAt ?? DEF[src.harm][1]];
  return { kb: false, lim: () => (src.harm === 'Low' ? [d[0], Infinity] : d) };
}
// ---- Pace (Oct 22, boss coverage; your OK: "build the timing checks as planned"): the timing each boss's plan relies on, against the
// 20 fastest Mythic kills (notes/Guides/Boss coverage.md, the Coiled Altar's Phase changes is the model). Being slower than the world's
// best is only a slip (amber); red only where the plan breaks (a third Kith'ix intermission, a sixth Imbibe, an enrage). Mythic only:
// on other difficulties the rows are shown, not judged. Each mistake is dated to the moment it went late, so the wipe filter is fair.
// x: what the boss's module already knows (its intermissions, Imbibes or turns).
function paceCard(ev, r, h, mistakes, boss, x) {
  x = x || {};
  const dur = r.duration, mythic = r.item.diff === 'Mythic', kill = r.item.kill, rows = [];
  const ms2 = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const ids = (a) => (Array.isArray(a) ? a : [a]);
  const gapT = (l, g) => l.sort((a, b) => a - b).filter((t, i, s) => !i || t - s[i - 1] > g);
  const castsOf = (a, g) => gapT(ev.filter((e) => (e.k === 'cast') && ids(a).includes(e.id)).map((e) => e.t), g || 3);
  const auraOn = (a, g) => gapT(ev.filter((e) => e.k === 'aura' && e.op === 'apply' && ids(a).includes(e.id) && !h.isPlayer(e.dst)).map((e) => e.t), g || 5);
  const hitsOf = (a, g) => gapT(ev.filter((e) => e.k === 'dmg' && ids(a).includes(e.id) && h.isPlayer(e.dst)).map((e) => e.t), g || 5);
  // (a boss's health at a moment: the unit with that name the log followed longest)
  const unitOf = (re) => [...(r.hpUnits || new Map()).values()].filter((u) => re.test(u.name || '')).sort((a, b) => b.samples.length - a.samples.length)[0];
  const hpAt = (re, t) => { const u = unitOf(re); if (!u) return null; let v = null; for (const [s, f] of u.samples) { if (s > t) break; v = f; } return v == null ? null : Math.round(100 * v); };
  // (one row: lvl 0 on pace, 1 a slip, 2 the plan broke; a mistake for 1 and 2 on Mythic)
  const row = (what, t, txt, kills, lvl, sub, detail, fix, noMistake) => {
    const l = mythic && !kill ? lvl || 0 : 0; /* (a kill is shown, not judged: the boss died, so the pace was enough (Oct 22: All pulls said Pace "0% done right" with the kill among the misses)) */
    if (l && !noMistake) mistakes.push({ t, player: 'Raid', mechanic: 'Pace', id: spell[0], severity: l === 2 ? 'High' : 'Medium', detail, fix });
    rows.push([{ txt: what }, { t }, { txt, bad: l === 2, warn: l === 1, sub: sub || '' }, { txt: mythic ? kills : '', dim: true }]);
  };
  let spell = [0, 'Pace'], title = '', summary = '';
  if (boss === "Kith'ix") {
    spell = [KX.lastLight[0], 'Last Light']; title = 'Pace (Reach 25% before the third intermission)';
    summary = 'The plan skips the third intermission: Lust and every cooldown on the pull, then push Kith\'ix to 25% (Last Light) before he reaches 100 energy a third time. Top guilds got there at 3:46 to 4:11.';
    const inter = x.inter || [], howl = x.howl, fix = 'Lust and every cooldown on the pull, then push Kith\'ix to 25% before the third intermission (about 4:20); hold your 2-minute cooldowns from 4:00 for Last Light.';
    if (inter[1] != null) { const v = hpAt(/^Kith'ix$/, inter[1]); row('Intermission 2 began', inter[1], 'Kith\'ix at ' + (v ?? '?') + '%', 'top guilds: 44 to 52%', 0); }
    if (howl != null) {
      const third = inter.filter((t) => t < howl)[2], late = howl > 265;
      if (third != null) row('Last Light (25%)', third, 'reached at ' + ms2(howl) + ', after a third intermission', 'top guilds: 3:46 to 4:11', 2, '', 'The third intermission came at ' + ms2(third) + ' with Kith\'ix at ' + (hpAt(/^Kith'ix$/, third) ?? '?') + '% (top guilds reach 25% by 4:11 and skip it).', fix);
      else row('Last Light (25%)', late ? 265 : howl, 'reached at ' + ms2(howl), 'top guilds: 3:46 to 4:11', late ? 1 : 0, '', 'Kith\'ix was still at ' + (hpAt(/^Kith'ix$/, 265) ?? '?') + '% at 4:25 (top guilds reach 25% by 4:11).', fix);
    } else if (kill) { /* (a kill whose log lost the Stygian Howl: nothing to judge) */
    } else if (inter[2] != null) row('Last Light (25%)', inter[2], 'a third intermission at ' + ms2(inter[2]), 'top guilds: 3:46 to 4:11', 2, '', 'The third intermission came at ' + ms2(inter[2]) + ' with Kith\'ix still at ' + (hpAt(/^Kith'ix$/, inter[2]) ?? '?') + '% (top guilds reach 25% by 4:11 and skip it).', fix);
    else if (dur > 265) row('Last Light (25%)', 265, 'not reached by 4:25', 'top guilds: 3:46 to 4:11', 1, '', 'Kith\'ix was still at ' + (hpAt(/^Kith'ix$/, 265) ?? '?') + '% at 4:25 (top guilds reach 25% by 4:11).', fix);
  } else if (boss === 'Vashnik the Malignant') {
    spell = [VS.imbibe, 'Imbibe']; title = 'Pace (Kill before Imbibe 5)';
    summary = 'Each Imbibe makes Vashnik hit harder (Toxic Vapor stacks): the soft enrage. Top guilds finish after the third or fourth Imbibe; the plan is to burn him before the sixth.';
    const imb = x.imb || [], fix = 'Burn Vashnik so the last totem set can be ignored: top guilds finish before a fifth Imbibe.';
    imb.forEach((t, i) => { const v = hpAt(/^Vashnik/, t), k = i + 1, lvl = k >= 6 ? 2 : k === 5 ? 1 : 0;
      row('Imbibe ' + k, t, 'Vashnik at ' + (v ?? '?') + '%', k <= 4 ? 'top guilds: ' + ['', '67 to 73%', '49 to 54%', '28 to 36%', '8 to 18%'][k] : 'top guilds: dead by now', lvl, '', 'Vashnik was still at ' + (v ?? '?') + '% at the ' + (k === 5 ? 'fifth' : k + 'th') + ' Imbibe (top guilds finish after the third or fourth).', fix); });
  } else if (boss === 'Entombed Sentinels') {
    spell = [ES.stasis[0], 'Vitriolic Stasis']; title = 'Pace (Low enough at each intermission)';
    summary = 'Both Sentinels\' health as each intermission begins, the higher of the two. The enrage comes after the fourth cycle, so top guilds finish in the fourth.';
    const inters = x.inters || [], KB = [76, 44, 14], fix = 'Keep damage on both Sentinels evenly: top guilds have both under ' + KB.join('%, ') + '% at the three intermissions.';
    inters.forEach((it, i) => { const a = hpAt(/^Breath of Ula'tek$/, it.t0), b = hpAt(/^Blood of Ula'tek$/, it.t0), v = Math.max(a ?? 0, b ?? 0);
      if (i >= 3) { row('Intermission ' + (i + 1), it.t0, 'a fourth intermission: the enrage follows', 'top guilds: dead before it', 2, 'Breath ' + (a ?? '?') + '%, Blood ' + (b ?? '?') + '%', 'A fourth intermission began at ' + ms2(it.t0) + ' with the Sentinels at ' + (a ?? '?') + '% and ' + (b ?? '?') + '%; the enrage follows it.', fix); return; }
      const lvl = v > KB[i] + 5 ? 1 : 0;
      row('Intermission ' + (i + 1), it.t0, 'up to ' + v + '%', 'top guilds: ' + KB[i] + '% or lower', lvl, 'Breath ' + (a ?? '?') + '%, Blood ' + (b ?? '?') + '%', 'The Sentinels were still at ' + (a ?? '?') + '% and ' + (b ?? '?') + '% at intermission ' + (i + 1) + ' (top guilds: ' + KB[i] + '% or lower).', fix); });
  } else if (boss === "Ula'tek") {
    spell = [UL.rage, 'Rage of the Shackled']; title = 'Pace (Burst the heart on time)';
    summary = 'Ula\'tek\'s health right after each Rage of the Shackled window. On pace: 67% or lower after the first and 45% or lower after the second (top guilds: 60 to 66% and 32 to 40%).';
    const wins = auraOn(UL.rage, 30), G = [67, 45], K = ['60 to 66%', '32 to 40%'], fix = 'Line up damage cooldowns and potions for the Rage of the Shackled windows, and keep everyone alive into the second one.';
    wins.slice(0, 2).forEach((s, i) => { const t = s + 22; if (t > dur) return; const v = hpAt(/^Ula'tek$/, t); if (v == null) return; const lvl = v > G[i] + 10 ? 2 : v > G[i] ? 1 : 0;
      row('After window ' + (i + 1), t, 'Ula\'tek at ' + v + '%', 'top guilds: ' + K[i], lvl, 'on pace: ' + G[i] + '% or lower', 'Ula\'tek was still at ' + v + '% after damage window ' + (i + 1) + ' (on pace: ' + G[i] + '% or lower; top guilds: ' + K[i] + ').', fix); });
  } else if (boss === 'The Twin Fangs') {
    spell = [1308356, 'Rouse the Brood']; title = 'Pace (Low enough before the last platform)';
    summary = 'Both Fangs\' health at 4:12, the last add set on the second platform (the log doesn\'t show the Submerge itself). Top guilds: Vexhul 15 to 26%, Ithraz 22 to 32%. The guides\' pace: about 25% and 40% by the last platform, then kill Vexhul around the final soak before the enrage.';
    const t = dur > 252 ? 252 : null, fix = 'Cleave Vexhul into execute first, then swap to Ithraz at 35%: about 25% Vexhul and 40% Ithraz by the last platform.';
    if (t != null) { const a = hpAt(/^Vexhul$/, t), b = hpAt(/^Ithraz$/, t), over = Math.max((a ?? 0) - 30, (b ?? 0) - 40), lvl = over > 10 ? 2 : over > 0 ? 1 : 0;
      row('At 4:12', t, 'Vexhul ' + (a ?? '?') + '%, Ithraz ' + (b ?? '?') + '%', 'top guilds: Vexhul 15 to 26%, Ithraz 22 to 32%', lvl, 'on pace: Vexhul 30% or lower, Ithraz 40% or lower', 'The Fangs were still at ' + (a ?? '?') + '% (Vexhul) and ' + (b ?? '?') + '% (Ithraz) at 4:12 (top guilds: 15 to 26% and 22 to 32%).', fix); }
  } else if (boss === 'Nymrissa Wavecaller') {
    spell = [NY.popHit, 'Pop!']; title = 'Pace (Kill before the third Pop)';
    summary = 'Nymrissa enrages after a few Pops (about 7:15). Top guilds finish between the second and third Pop (3:49 to 4:35), with her at 20 to 33% at 3:00.';
    const pops = hitsOf(NY.popHit, 5), fix = 'Burn Nymrissa through the second Pop: top guilds finish before the third.';
    if (dur > 180) { const v = hpAt(/^Nymrissa/, 180); if (v != null) row('At 3:00', 180, 'Nymrissa at ' + v + '%', 'top guilds: 20 to 33%', 0); }
    if (pops[2] != null) { const v = hpAt(/^Nymrissa/, pops[2]); row('Third Pop', pops[2], 'Nymrissa at ' + (v ?? '?') + '%', 'top guilds: dead before it', 1, '', 'Nymrissa was still at ' + (v ?? '?') + '% at the third Pop (top guilds finish before it).', fix); }
    const enr = hitsOf([1294867, 1295086], 30)[0];
    if (enr != null) row('Enrage (Unending Tides)', enr, 'she enraged', 'top guilds: never', 2, '', '', '', true);
  } else if (boss === 'Sszorak') {
    spell = [SZ.fury, 'Serpent\'s Fury']; title = 'Pace (Kill before the enrage)';
    summary = 'Sszorak enrages at about 6:20. Top guilds finish at 4:43 to 5:01, with him at 34 to 39% at 3:00. After the last Dig In, leave the fourth cyst.';
    const fix = 'Keep damage on Sszorak through the intermissions: top guilds have him at 34 to 39% at 3:00.';
    if (dur > 180) { const v = hpAt(/^Sszorak$/, 180); if (v != null) row('At 3:00', 180, 'Sszorak at ' + v + '%', 'top guilds: 34 to 39%', v > 44 ? 1 : 0, '', 'Sszorak was still at ' + v + '% at 3:00 (top guilds: 34 to 39%).', fix); }
    if (dur > 380 && !kill) { const v = hpAt(/^Sszorak$/, 380); row('Enrage (6:20)', 380, 'Sszorak at ' + (v ?? '?') + '%', 'top guilds: dead by 5:01', 2, '', 'Sszorak was still at ' + (v ?? '?') + '% at the enrage (6:20).', fix); }
  } else if (boss === 'The Lost Explorers') {
    spell = [0, 'Turns']; title = 'Pace (Kill in two turns)';
    summary = 'Each explorer takes a turn being empowered. All 20 of top guilds finish in two turns, so the third explorer never gets one. A third turn is a slip, never a fail.';
    const turns = (x.phases || []).filter((p) => /turn$/.test(p.name) && !/^Before/.test(p.name));
    turns.forEach((p, i) => { const lvl = i >= 2 ? 1 : 0; row('Turn ' + (i + 1), p.start, p.name, i >= 2 ? 'top guilds: all 20 finish before it' : 'top guilds: two turns', lvl, '', 'A third turn (' + p.name + ') began at ' + ms2(p.start) + ' (all 20 of top guilds finish in two).', 'Push damage so the explorers die before a third one is empowered.'); });
  } else return null;
  if (!rows.length) return null;
  return { id: 'pace', title, spell, verdict: rows.some((x) => x[2].bad) ? 'bad' : rows.some((x) => x[2].warn) ? 'warn' : 'good', summary, cols: ['Moment', 'When', 'Result', mythic ? 'Top guilds' : ''], rows };
}
function avoidPanel(ev, r, h, list) {
  const L = (x) => String(x).toLowerCase(), groups = [];
  // (one source's set from its hits and deaths up to cut; the wipe filter builds it again with recut, so a hit or a death
  // after the filter never shows or counts)
  const build = (src, all, cut) => {
    // (a hit that did no damage, met with an immunity or fully absorbed, isn't avoidable damage taken (scan, Oct 19: a top kill's
    // Blast Wave "hits" were four immunities))
    const hits = all.filter((e) => e.t <= cut + 0.05 && e.amt !== 0); if (!hits.length) return null;
    const secs = src.secs != null ? !!src.secs : AV_SECS.test(src.label), L2 = avLim(r, src, secs), [wA, bA] = L2.lim(cut);
    const per = new Map();
    // (a source whose hit leaves a damage over time under the same name (src.dot: how many seconds it lasts) counts the hits, not its
    // ticks: a shield that soaked a tick made the next one look like a new hit (Oct 24: a top kill's raider showed 5 Caustic Waves hits
    // for 3 waves). A tick starts a touch only when no hit came before it in that time (the hit itself was fully absorbed))
    for (const e of hits) { let x = per.get(e.dst); if (!x) per.set(e.dst, x = { g: e.dst, touches: 0, ticks: 0, amt: 0, last: -9, hit: -99, ts: [], tk: [], tl: [] }); x.ticks++; x.tk.push(e.t); x.amt += e.amt;
      const fresh = src.dot ? e.t - x.hit > (e.tick ? src.dot + 1 : 1.5) : e.t - x.last > 1.5;
      if (fresh) { x.touches++; x.ts.push(e.t); x.tl.push({ t: e.t, e: e.t, n: 0, a: 0 }); } const tc = x.tl[x.tl.length - 1]; tc.e = e.t; tc.n++; tc.a += e.amt; x.last = e.t; if (src.dot && (!e.tick || fresh)) x.hit = e.t; }
    // (a source that only counts a walk-in from minTicks ticks: a lone brush isn't one (Mutagenic Venom, fix 9))
    if (src.minTicks > 1) for (const [g, x] of [...per]) { const tl = x.tl.filter((c) => c.n >= src.minTicks); if (!tl.length) { per.delete(g); continue; } x.tl = tl; x.ts = tl.map((c) => c.t); x.touches = tl.length; }
    if (!per.size) return null;
    const val = (x) => (secs ? x.ticks : x.touches);
    // (a death to it is red when it did half or more of the damage in their last 15 s (the Deaths page's rule), they were already past the
    // amber line, or it's Dangerous; an axe's last tick on someone the raid damage was killing is not on them (top kills, fix 9))
    const own = (d) => { const rc = (d.recap || []).filter((e) => !e.heal), all = rc.reduce((s, e) => s + (e.amount || 0), 0), mine = rc.filter((e) => src.n.includes(L(e.spell || ''))).reduce((s, e) => s + (e.amount || 0), 0); return !all || mine >= all / 2; };
    const diedT = new Map(r.deaths.filter((d) => { const x = per.get(d.guid); return d.t <= cut + 0.05 && src.n.includes(L(d.ability || '')) && (src.harm === 'High' || own(d) || (x && val(x) >= wA)); }).map((d) => [d.guid, d.t])), died = new Set(diedT.keys());
    const rows = [...per.values()].sort((a, b) => val(b) - val(a) || b.amt - a.amt).map((x) => {
      const v = val(x), tank = !src.tankJudged && h.role(x.g) === 'tank', dd = died.has(x.g), kept = tank && v >= tankKept(bA);
      const bad = dd || kept || (!tank && v >= bA), warn = !bad && !tank && v >= wA;
      return [{ p: h.name(x.g), sub: tank ? (kept ? 'tank, kept standing in it' : 'tank') : '' }, { txt: secs ? v + ' s in it' : v + (v === 1 ? ' hit' : ' hits'), bad, warn,
        sub: secs ? (x.touches > 1 ? x.touches + ' times' : '') : x.ticks > x.touches ? x.ticks + ' damage ticks' : '' }, { n: x.amt }, { txt: dd ? 'died to it' : '—', bad: dd, dim: !dd }];
    });
    const nT = [...per.values()].reduce((s, x) => s + val(x), 0), amt = [...per.values()].reduce((s, x) => s + x.amt, 0);
    // (the spell, for its icon and tooltip: the source's own, else what hit players most often under it, with its name)
    const byId = new Map(); for (const e of hits) if (e.id) { const c = byId.get(e.id) || { n: 0, name: e.spell }; c.n++; byId.set(e.id, c); }
    const top = [...byId].sort((a, b) => b[1].n - a[1].n)[0], sid = src.id || (top && top[0]) || 0;
    const sname = (sid && byId.has(sid) && byId.get(sid).name) || (top && top[1].name) || src.label;
    const line = src.harm === 'High' ? ' Any hit is a mistake.' : L2.kb ? ' In the fastest kills, 9 in 10 raiders took ' + (secs ? (wA - 1) + ' s or less' : wA - 1 === 0 ? 'no hits' : (wA - 1) + (wA - 1 === 1 ? ' hit' : ' hits') + ' or fewer') + ' by this point.' : '';
    return { title: src.label, t: null, harm: src.harm, secs, spell: sid ? [sid, sname] : null, sub: HARM[src.harm] + ': ' + src.why + '. ' + (secs ? nT + ' s in it' : pl2e(nT, 'hit')) + ' on ' + pl2e(per.size, 'player') + ', for ' + compact(amt) + ' damage.' + line,
      bad: rows.some((x) => x.some((c) => c.bad)), warn: rows.some((x) => x.some((c) => c.warn)), rows, nT, amt, label: src.label,
      // for the Night summary report card: each player's moments (hit times, or each second in it), so it can stop at the wipe filter;
      // lim(t) gives the lines at any cut
      names: src.n, wA, bA, kb: L2.kb, lim: L2.lim, skip: src.skip || null, fix: src.fix || '',
      judge: [...per.values()].map((x) => ({ p: h.name(x.g), tank: !src.tankJudged && h.role(x.g) === 'tank' && val(x) < tankKept(bA), ts: secs ? x.tk : x.ts, amt: x.amt, dt: diedT.has(x.g) ? diedT.get(x.g) : null,
        // (for the coach's card (Oct 22): the guid, each touch, and a map of a moment: the raid then, them in red, a few seconds of movement)
        g: x.g, tl: x.tl, mk: (t) => ({ t, pts: h.snap(t), frames: h.frames ? h.frames(Math.max(0, t - 2.5), Math.min(r.duration || t + 1, t + 1), 0.25) : undefined, bad: [x.g], badLabel: 'hit by ' + src.label, title: src.label + ' at ' + h.fmtT(t) + ': ' + h.name(x.g) }) })) };
  };
  for (const src of list) {
    const all = ev.filter((e) => e.k === 'dmg' && h.isPlayer(e.dst) && src.n.includes(L(e.spell)) && !(src.skip && src.skip(e))).sort((a, b) => a.t - b.t);
    const g = all.length ? build(src, all, Infinity) : null; if (!g) continue;
    g.recut = (t) => build(src, all, t);
    groups.push(g);
  }
  if (!groups.length) return null;
  const rank = { High: 0, Medium: 1, Low: 2 };
  groups.sort((a, b) => rank[a.harm] - rank[b.harm] || b.amt - a.amt);
  const by = (k) => groups.filter((g) => g.harm === k && !g.secs).reduce((s, g) => s + g.nT, 0);
  return { id: 'avoid', title: 'Avoidable damage', spell: [0, 'Avoidable damage'], verdict: groups.some((g) => g.bad) ? 'bad' : 'good',
    summary: 'Every avoidable damage source this pull, most harmful first, against what the fastest kills take by the same point of the fight. Amber: a bit more than most of their raiders. Red: twice that, a death to it, or a dangerous hit. Pools count the seconds you stood in them.' + (['High', 'Medium', 'Low'].some(by) ? ' ' + ['High', 'Medium', 'Low'].map((k) => by(k) ? by(k) + ' ' + HARM[k].toLowerCase() : '').filter(Boolean).join(', ') + ' hits.' : ''),
    cols: ['Player', 'Hits', 'Damage taken', 'Died'], rows: [], groups };
}
// The avoid panel's verdict as mistakes, so the coach, Homework and a raider's fixes say what the panel says (one answer): the rule
// pack's own avoidable mistakes for the same spells give way to it. Red (twice the kills' line, a death to it, a dangerous hit) is a
// High mistake; amber is a Low one marked avAmber (a slip: it becomes a fix only when it keeps happening, 3+ pulls of a night).
function avoidMistakes(r) {
  const sec = ((r.module && r.module.sections) || []).find((s) => s.id === 'avoid' && (s.groups || []).some((g) => g.judge)); if (!sec) return;
  const L = (x) => String(x || '').toLowerCase(), names = new Set(sec.groups.flatMap((g) => (g.names || []).concat(L(g.label)))), ids = new Set(sec.groups.map((g) => g.spell && g.spell[0]).filter(Boolean));
  const pack = PACKS.find((p) => p.encounter === r.item.boss), tipOf = (g) => { const x = pack && pack.rules.find((q) => q.type === 'avoidable' && ((g.names || []).includes(L(q.name)) || L(q.name) === L(g.label))); return x ? x.tip : ''; };
  r.mistakes = r.mistakes.filter((m) => !(m.avoidRule && (names.has(L(m.mechanic)) || (m.ruleIds || []).some((i) => ids.has(i)))));
  const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1e3) + 'k');
  // (judged where the panel is by default: the whole kill, or a wipe up to its 2nd death (the wipe filter's default), so both say the same)
  const ds = r.deaths.map((d) => d.t).sort((a, b) => a - b), T = Math.min(r.duration || Infinity, !r.item.kill && ds.length >= 2 ? ds[1] : Infinity);
  for (const g of sec.groups) for (const j of g.judge || []) {
    if (j.tank) continue; const ts = j.ts.filter((t) => t <= T + 0.05).sort((a, b) => a - b), [wA, bA] = g.lim(T);
    const tA = ts.length >= wA ? ts[wA - 1] : null, tR = j.dt != null && j.dt <= T + 0.05 ? j.dt : ts.length >= bA ? ts[bA - 1] : null;
    if (tA == null && tR == null) continue;
    // (the fight's own check already flagged this hit (the frontal on a raider, ghosts touching): one mistake, not two)
    const tt = tR != null ? tR : tA; if (r.mistakes.some((m) => !m.avoidRule && m.player === j.p && (g.names || []).includes(L(m.mechanic)) && Math.abs(m.t - tt) <= 3)) continue;
    const red = tR != null, n = ts.length, died = j.dt != null && j.dt <= T + 0.05, short = g.label.replace(/\s*\(.*$/, '');
    const what = g.secs ? 'Stood in ' + short + ' for ' + n + ' s' : g.harm === 'High' ? 'Hit by ' + ((g.spell && g.spell[1]) || short) + (n > 1 ? ' ' + n + ' times' : '') : 'Hit by ' + short + ' ' + (n === 1 ? 'once' : n === 2 ? 'twice' : n + ' times');
    const vs = g.harm === 'High' || !g.kb || n < wA ? '' : ', more than 9 in 10 raiders in the fastest kills by then';
    r.mistakes.push({ t: red ? tR : tA, player: j.p, mechanic: g.label, id: (g.spell && g.spell[0]) || 0, severity: red ? 'High' : 'Low', avAmber: !red, dmg: j.amt, pos: true, avoidRule: true, avoid: true, touches: n, ruleIds: [],
      detail: what + (j.amt >= 1 ? ' (' + fmt(j.amt) + ')' : '') + vs + (died ? ', and died to it.' : '.'), fix: g.fix || tipOf(g) || (g.secs ? 'Stay out of ' + short + '.' : 'Dodge ' + short + '.') });
  }
  r.mistakes.sort((a, b) => a.t - b.t);
}
// (The Coiled Altar: when each Fangs cast's pools were down, from the cast to the last Noxious Ground hit after it. Sizes from 9 Mythic
// kills (Oct 20): the first cast's pools reach about 28 yards from the middle of the west and east walls, later ones about 48)
function caPools(ev) {
  const casts = ev.filter((e) => (e.k === 'cast' || e.k === 'start') && e.id === 1282487).map((e) => e.t).sort((a, b) => a - b).filter((t, i, a) => !i || t - a[i - 1] > 10);
  const hits = ev.filter((e) => e.k === 'dmg' && e.id === 1283290).map((e) => e.t);
  return casts.map((t, i) => { const nx = i + 1 < casts.length ? casts[i + 1] : Infinity, mine = hits.filter((x) => x >= t && x < Math.min(nx, t + 45));
    return { t0: +(t + 0.8).toFixed(2), t1: +((mine.length ? Math.max(...mine) : t + 28) + 0.5).toFixed(2), r: i ? 48 : 28 }; });
}
function buildCoiledAltar(ev, r, h) {
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const mythic = r.item.diff === 'Mythic';
  const S = (n) => [CA_IDS[n] || 0, n.split(' ').map((w, i) => (i && (w === 'of' || w === 'the') ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ')];
  const L = (x) => String(x).toLowerCase();
  const casts = castTimes(ev, L);
  const dmg = (n) => ev.filter((e) => e.k === 'dmg' && L(e.spell) === n);
  const auras = (n) => ev.filter((e) => e.k === 'aura' && L(e.spell) === n);
  const pname = (g) => h.name(g), role = (g) => h.role(g);
  const mistakes = [], sections = [], dur = r.duration;
  const M = (t, player, spell, severity, detail, fix) => mistakes.push({ t, player, mechanic: S(spell)[1], id: S(spell)[0], severity, detail, fix });

  // ---- phases ----
  const dm = casts('dreadmarch'), sb = casts('soulbinding');
  // P2 starts when Hex Lord Malacrass joins (his Dreadful Presence cast, about 7.5s before the first Dreadmarch); NSRT's
  // P2 timers count from there. Without it, the first Dreadmarch.
  const dp = casts('dreadful presence').filter((t) => dm.length && t < dm[0] && dm[0] - t < 20);
  const p2 = dm.length ? (dp.length ? dp[0] : dm[0]) : null, inter = sb.length ? sb[0] : null;
  let p3 = null;
  if (inter != null) {
    const after = ['grim guillotine', 'blighted sever', 'defilement of the coiled altar'].flatMap((n) => casts(n)).filter((t) => t > inter + 3);
    p3 = after.length ? Math.min(...after) : null;
  }
  const phases = [{ name: 'P1 Zul\'jan', start: 0, end: p2 ?? dur }];
  if (p2 != null) phases.push({ name: 'P2 Malacrass', start: p2, end: inter ?? dur });
  if (inter != null) phases.push({ name: 'Intermission', start: inter, end: p3 ?? dur });
  if (p3 != null) phases.push({ name: 'P3 Coiled Union', start: p3, end: dur });
  const phaseAt = (t) => { let n = phases[0].name; for (const p of phases) if (t >= p.start) n = p.name; return n.split(' ')[0]; };
  const marks = [];
  for (const [n, kind] of [['toxic deluge', 'orb'], ['sever', 'front'], ['blighted sever', 'front'], ['soul sever', 'front'], ['guillotine', 'soak'], ['grim guillotine', 'soak'],
    ['dreadmarch', 'ghost'], ['spiritcackle', 'add'], ['eternal nightfall', 'shield'], ['soulbinding', 'phase'], ['defilement of the coiled altar', 'raid'], ['fangs of the coiled altar', 'raid']])
    for (const t of casts(n)) marks.push({ t, label: S(n)[1], id: S(n)[0], kind, ...markInfo(ev, n, t, h, r.players.size) });

  // ---- 1. frontals hitting non-tanks ----
  const front = [];
  // (Heroic and Normal (Oct 22): all 20 fastest Heroic kills live through a frontal on a non-tank, so there it's yellow unless it killed
  // them; only each frontal's first hit on a player counts (not the damage it leaves every 2 s); and in a log with no specs, a player
  // two different frontals hit is a tank. Mythic is unchanged)
  const fKeep = new Set(), fTanks = new Set();
  if (!mythic) {
    const seen = new Set(), hitAt = new Map();
    for (const n of ['sever', 'soul sever', 'blighted sever']) for (const e of dmg(n)) { const c = casts(n).filter((t) => e.t >= t - 0.5 && e.t <= t + 5).pop(); if (c == null || seen.has(n + c + e.dst)) continue; seen.add(n + c + e.dst); fKeep.add(e);
      if (!(r.players.get(e.dst) || {}).specId) { const l = hitAt.get(e.dst) || []; if (!l.some((t) => Math.abs(t - e.t) < 8)) l.push(e.t); hitAt.set(e.dst, l); } }
    for (const [g, l] of hitAt) if (l.length >= 2) fTanks.add(g);
  }
  for (const n of ['sever', 'soul sever', 'blighted sever']) for (const e of dmg(n)) if (role(e.dst) !== 'tank' && (mythic || (fKeep.has(e) && !fTanks.has(e.dst))))
    front.push(mythic ? e : { ...e, soft: !(r.deaths || []).some((d) => d.guid === e.dst && d.t >= e.t - 0.5 && d.t <= e.t + 3) });
  for (const e of front) { M(e.t, pname(e.dst), L(e.spell), e.soft ? 'Medium' : 'High', 'Stood in ' + e.spell + ' (tank frontal) for ' + Math.round(e.amt).toLocaleString('en-US') + ' and picked up its 200% vulnerability.', 'Only the tank belongs in front of the boss. Stay out of the cone unless you are placing orbs or ghosts for it and step out before it lands.'); mistakes[mistakes.length - 1].avoid = true; }
  sections.push({ id: 'front', title: 'Tank frontals (Raid hits)', place: 'Tank frontals hitting the raid', spell: S('sever'),
    verdict: front.length ? 'bad' : 'good', summary: front.length ? pl(front.length, 'non-tank hit') + ' from Sever, Soul Sever and Blighted Sever.' : 'Only tanks were hit by the frontals.',
    cols: ['When', 'Player', 'Frontal', 'Damage'], rows: front.map((e) => [{ t: e.t }, { p: pname(e.dst) }, { s: S(L(e.spell)) }, { n: e.amt }]) });

  // ---- 2. orb cleanup: purple orb carriers, clipped players, mass ruptures, stacks at push ----
  const mv = auras('mutagenic venom').filter((e) => h.isPlayer(e.dst));
  const carry = [];
  for (const e of mv) if (e.op === 'apply') carry.push({ g: e.dst, s: e.t, e: e.t + 5 });
  for (const e of mv) if (e.op === 'remove') { const c = carry.filter((x) => x.g === e.dst && x.s <= e.t).pop(); if (c) c.e = e.t; }
  const carriersAt = (t) => carry.filter((c) => t >= c.s - 0.2 && t <= c.e + 0.3);
  // green orb carriers (Volatile Venom on them), the same way
  const vvWin = new Map(); for (const e of auras('volatile venom').filter((x) => h.isPlayer(x.dst)).sort((a, b) => a.t - b.t)) { let l = vvWin.get(e.dst); if (!l) vvWin.set(e.dst, l = []); if (e.op === 'apply') l.push([e.t, e.t + 8]); else if (e.op === 'remove' && l.length) l[l.length - 1][1] = e.t; }
  const carryingVV = (g, t) => (vvWin.get(g) || []).some(([a, b]) => t >= a - 0.2 && t <= b + 0.3);
  const greenAt = (t) => [...vvWin.keys()].filter((g) => carryingVV(g, t));
  // Orb carrier rings for every map: a carried purple orb (Mutagenic Venom) hits everyone within 6 yd of the carrier,
  // a carried green orb (Volatile Venom) within 5 yd (Wowhead spell effects: Mutagenic Venom 1310691 radius 6,
  // Volatile Venom 1282288 radius 5). The ring follows the carrier; players that venom hit around then are marked.
  const orbRings = (mp) => {
    const t = mp.t; if (t == null) return;
    // Gloombomb maps: every carrier's 15 yd explosion circle (Gloombomb's tooltip radius), all drawn the same way: a
    // transparent mint green circle with a "15 yd" label. Anyone the explosion clipped without carrying one gets an orange !
    if (mp.gloom) {
      const gb = gbAt(t);
      mp.rings = (mp.rings || []).concat(gb.map((c) => ({ guid: c.g, r: 15, ...mcol('Gloombomb'), fx: 'burst', t0: c.s - 0.2, dur: c.e - c.s + 1, at: c.e, label: '15 yd', legend: 'Gloombomb explosion (15 yd around the carrier)' })));
      const cl = clipAt(t).filter((g) => !gb.some((c) => c.g === g));
      if (cl.length) { mp.warn = [...new Set((mp.warn || []).concat(cl))]; mp.warnLabel = 'clipped by a bomb they didn\'t carry'; }
    }
    const pur = carriersAt(t).map((c) => c.g), grn = greenAt(t).filter((g) => !pur.includes(g));
    if (!pur.length && !grn.length) return;
    mp.rings = (mp.rings || []).concat(pur.map((g) => ({ guid: g, r: 6, color: '#b65cff', fill: 'rgba(182,92,255,.14)', fx: 'debuff', label: '6 yd', legend: 'purple orb carrier (6 yd)' })), grn.map((g) => ({ guid: g, r: 5, color: '#5fd35f', fill: 'rgba(95,211,95,.12)', fx: 'debuff', label: '5 yd', legend: 'green orb carrier (5 yd)' })));
    const hit = [...new Set(ev.filter((e) => e.k === 'dmg' && h.isPlayer(e.dst) && Math.abs(e.t - t) <= 1.5 && ((L(e.spell) === 'mutagenic venom' && !carriersAt(e.t).some((c) => c.g === e.dst)) || (L(e.spell) === 'volatile venom' && !carryingVV(e.dst, e.t)))).map((e) => e.dst))];
    if (hit.length) { mp.bad = [...new Set((mp.bad || []).concat(hit))]; mp.badLabel = mp.badLabel ? mp.badLabel + ' / hit by an orb carrier' : 'hit by an orb carrier\'s venom'; }
  };
  // Mutagenic Venom pulses once a second on the carrier and everyone near them, so one stand-in is several hits:
  // count it once per player (hits less than 2.5s apart belong together).
  const clipped = [], clipBy = new Map();
  for (const e of dmg('mutagenic venom').sort((a, b) => a.t - b.t)) {
    if (!h.isPlayer(e.dst) || carriersAt(e.t).some((c) => c.g === e.dst)) continue;
    const who = carriersAt(e.t).map((c) => pname(c.g)), last = clipBy.get(e.dst);
    if (last && e.t - last.end <= 2.5) { last.end = e.t; last.n++; last.amt += e.amt; for (const w of who) if (!last.who.includes(w)) last.who.push(w); continue; }
    const c = { ...e, who, end: e.t, n: 1 }; clipped.push(c); clipBy.set(e.dst, c);
  }
  // (one brush is minor: carriers walk through the raid too; hit two times or more, it's a medium mistake)
  /* (Coiled Altar fix 7, Oct 24: one tick happened 93 times in 11 top kills; one tick is nothing, 2+ Low, 4+ Medium) */
  for (const c of clipped.filter((x) => x.n >= 2)) { M(c.t, pname(c.dst), 'mutagenic venom', c.n >= 4 ? 'Medium' : 'Low', 'Stood within 6 yards of a purple orb carrier' + (c.who.length ? ' (' + c.who.join(', ') + ')' : '') + ': hit ' + (c.n > 1 ? c.n + ' times' : 'once') + ' for ' + Math.round(c.amt).toLocaleString('en-US') + '.', 'Purple carriers have right of way. Stay more than 6 yards from anyone carrying Mutagenic Venom (the purple circle on the map).'); mistakes[mistakes.length - 1].avoid = true; }
  // mass Venom Rupture: a player jumping 8+ stacks within 2s means a purple orb touched other orbs
  const vr = auras('venom rupture').filter((e) => h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const lastSt = new Map(), hist = new Map(), bursts = [];
  for (const e of vr) {
    let st = e.op === 'apply' ? 1 : e.op === 'dose' ? e.stacks : e.op === 'rdose' ? e.stacks : 0;
    lastSt.set(e.dst, st);
    let l = hist.get(e.dst); if (!l) hist.set(e.dst, l = []); l.push([e.t, st]);
    const early = l.find(([t]) => t >= e.t - 2);
    if (early && st - early[1] >= 8 && !bursts.some((b) => Math.abs(b.t - e.t) < 4)) bursts.push({ t: e.t, gain: st - early[1] });
  }
  // Mass stacks that aren't a collision: the orbs exploding when Zul'jan goes down at the P1 push (expected, about
  // 9 to 11 stacks), and Defilement of the Coiled Altar detonating every orb still on the ground in P3 (a wipe if
  // purples are left).
  const zjDown = (() => { const u = r.hpUnits && [...r.hpUnits].find(([, x]) => /^Zul'jan$/.test(x.name)); if (!u || p2 == null) return null; const z = u[1].samples.find(([t, f]) => f <= 0.01 && t <= p2 + 1); return z ? z[0] : null; })();
  const defils = casts('defilement of the coiled altar');
  const detonations = [];
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    if (zjDown != null && b.t >= zjDown - 1.5 && b.t <= zjDown + 6) { bursts.splice(i, 1); continue; }
    const df = defils.find((t) => b.t >= t - 0.5 && b.t <= t + 4);
    if (df != null) { detonations.push({ t: df, gain: b.gain }); bursts.splice(i, 1); }
  }
  for (const x of detonations) M(x.t, 'Raid', 'defilement of the coiled altar', 'High', 'Defilement of the Coiled Altar detonated the orbs still on the ground: the raid gained ' + x.gain + '+ Venom Rupture stacks at once.', 'Clear every purple orb before Defilement (and kill Zul\'jan before the one that follows the burn). Green orbs left over are survivable, but purples are not.');
  for (const b of bursts) {
    const who = carriersAt(b.t).map((c) => pname(c.g));
    M(b.t, 'Raid', 'venom rupture', 'High', 'A purple orb exploded into other orbs: players gained ' + b.gain + '+ Venom Rupture stacks at once' + (who.length ? '. Carrying a purple orb at that moment: ' + who.join(', ') : '') + '.', 'Purple orbs must never touch green or purple orbs. Carriers path around every other orb.');
  }
  // Virulent Mutation left on the ground when the next Toxic Deluge goes out
  const deluges = casts('toxic deluge');
  const fangs = () => casts('fangs of the coiled altar');
  const vmHits = dmg('virulent mutation');
  const leftover = [];
  for (const d of deluges.slice(1)) {
    const hits = vmHits.filter((e) => e.t >= d && e.t <= d + 4);
    const big = new Set(hits.map((e) => e.dst));
    if (big.size >= 10) { leftover.push({ t: d, n: big.size }); M(d, 'Raid', 'virulent mutation', 'High', 'A Virulent Mutation was still on the ground when Toxic Deluge was cast and erupted on ' + big.size + ' players.', 'Every purple orb from a Deluge has to be cleared before the next one. Give each cleanup player their own section.'); }
  }
  const stackAt = (t) => { const v = []; for (const [g, l] of hist) { let s = 0; for (const [tt, st] of l) { if (tt > t) break; s = st; } if (s) v.push(s); } return v; };
  const pushStacks = p2 != null ? stackAt(Math.min((zjDown ?? p2) + 5, p2 - 0.5)) : [];
  const pushMax = pushStacks.length ? Math.max(...pushStacks) : 0;
  const carriers = new Map(); for (const c of carry) carriers.set(pname(c.g), (carriers.get(pname(c.g)) || 0) + 1);
  const cycles = deluges.map((d, i) => {
    const end = deluges[i + 1] ?? (p2 ?? dur);
    const picks = carry.filter((c) => c.s >= d && c.s < end);
    return [{ txt: '#' + (i + 1) }, { t: d }, { txt: picks.length + ' pickups' }, { ps: [...new Set(picks.map((c) => pname(c.g)))], none: 'nobody' },
      { txt: clipped.filter((c) => c.t >= d && c.t < end).length + ' clipped', bad: clipped.some((c) => c.t >= d && c.t < end) },
      { txt: leftover.some((x) => x.t === end) ? 'orb left at next Deluge' : bursts.some((b) => b.t >= d && b.t < end) ? 'orbs collided' : 'clean', bad: leftover.some((x) => x.t === end) || bursts.some((b) => b.t >= d && b.t < end) }];
  });
  sections.push({ id: 'orbs', title: 'Orbs (Cleanup)', place: 'Orb cleanup', spell: S('virulent mutation'), mythicOnly: true,
    verdict: bursts.length || leftover.length ? 'bad' : 'good', /* (fix 7: purple-carrier clips are judged in Avoidable damage) */
    summary: [pl(deluges.length, 'Toxic Deluge cycle'), pl(carry.length, 'purple orb pickup'), pl(clipped.length, 'player') + ' clipped by carriers', pl(bursts.length, 'orb collision'), pl(leftover.length, 'orb') + ' left at a Deluge'].join(', ') +
      (p2 != null ? '. Venom Rupture after the P1 push: up to ' + pushMax + ' stacks' + (pushMax > 11 ? ' (the plan is 9 to 11)' : '') + '.' : '.'),
    cols: ['Cycle', 'Deluge', 'Purple pickups', 'Carriers', 'Clipped', 'Result'], rows: cycles,
    extra: carriers.size ? { title: 'Purple orb carriers', items: [...carriers].sort((a, b) => b[1] - a[1]).map(([n, c]) => ({ p: n, n: c })) } : null });

  // ---- 3. Guillotine soaks ----
  const soaks = [];
  for (const n of ['guillotine', 'grim guillotine']) {
    const hits = dmg(n), missed = ev.filter((e) => e.k === 'miss' && L(e.spell) === n);
    for (const t of casts(n)) {
      // soakers: everyone the axe hit, plus everyone it missed (immunities like Turtle or Blessing of Protection take no
      // damage but are still in the circle), plus anyone who got the Guillotine debuff right at the drop
      const w0 = hits.concat(missed).filter((e) => e.t >= t && e.t <= t + 8).sort((a, b) => a.t - b.t);
      const drop = w0.length ? w0[0].t : null;
      const w = drop == null ? [] : w0.filter((e) => e.t <= drop + 1.5);
      const deb = drop == null ? [] : ev.filter((e) => e.k === 'aura' && (e.op === 'apply' || e.op === 'dose') && L(e.spell) === n && h.isPlayer(e.dst) && e.t >= drop - 0.3 && e.t <= drop + 1);
      const who = [...new Set(w.map((e) => e.dst).concat(deb.map((e) => e.dst)))];
      // only soakers count as "died in the soak" (others dying at the same moment died to something else)
      const died = r.deaths.filter((d) => who.includes(d.guid) && d.t >= (w[0] ? w[0].t : t) - 0.2 && d.t <= (w[0] ? w[0].t : t) + 4).map((d) => d.player);
      // (landed: false when the cast never finished (no cast success after the start, e.g. Zul'jan's cast cut off as the
      // phase changed) and the axe hit and missed nobody: nothing to judge. A finished cast counts even with nobody hit,
      // so a circle of immunities, which may leave no line in the log, is still checked)
      const done = ev.some((e) => e.k === 'cast' && e.id === CA_IDS[n] && e.t > t + 0.5 && e.t <= t + 8);
      soaks.push({ n, t, who, died, hit: w[0] ? w[0].t : null, landed: done || w.length > 0 || deb.length > 0 });
    }
  }
  soaks.sort((a, b) => a.t - b.t);
  // Mythic needs at least 5 players in the circle (3 on Heroic and Normal); fewer and it blows up on the raid
  const need = mythic ? 5 : 3;
  soaks.forEach((s, i) => {
    if (s.who.length && s.who.length < need) M(s.t, 'Raid', s.n, 'High', S(s.n)[1] + ' was soaked by only ' + pl2e(s.who.length, 'player') + ' (' + s.who.map(pname).join(', ') + '); it needs ' + need + '.', 'Over-send: put more than ' + need + ' players in every soak so one late player can\'t wipe it.');
    for (const d of s.died) M(s.t, d, s.n, 'High', 'Died in the ' + S(s.n)[1] + ' soak.', 'Soakers need a personal defensive or an immunity, and the target needs an external.');
  });
  // (soak counts and deaths are shown in the combined Guillotine panel further down)

  // ---- 4. Ghosts: Malevolent Resonance (two ghosts touching) ----
  // One collision = the Malevolent Resonance debuff landing on the two players whose ghosts touched (its damage
  // ticks for several seconds, so grouping by damage would count one collision more than once).
  const mrEvents = [];
  const mrApply = auras('malevolent resonance').filter((e) => e.op === 'apply' && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const mrSrc = mrApply.length ? mrApply.map((e) => ({ t: e.t, dst: e.dst, amt: 0 })) : dmg('malevolent resonance');
  for (const e of mrSrc) { let x = mrEvents.find((m) => e.t - m.t >= 0 && e.t - m.t < 3); if (!x) mrEvents.push(x = { t: e.t, who: new Set(), amt: 0 }); x.who.add(e.dst); }
  for (const e of dmg('malevolent resonance')) { const x = mrEvents.find((m) => e.t >= m.t - 0.5 && e.t - m.t < 8); if (x) x.amt += e.amt; }
  for (const m of mrEvents) for (const g of m.who) M(m.t, pname(g), 'malevolent resonance', 'High', 'Their ghost touched another ghost' + (m.who.size > 1 ? ' (with ' + [...m.who].filter((x) => x !== g).map(pname).join(', ') + ')' : '') + ', causing Malevolent Resonance.', 'Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.');
  sections.push({ id: 'ghosts', title: 'Ghosts (Dreadmarch)', spell: S('dreadmarch'), mythicOnly: true,
    verdict: mrEvents.length ? 'bad' : 'good', summary: pl(dm.length, 'Dreadmarch cast') + ', ' + pl(mrEvents.length, 'ghost collision') + ' (Malevolent Resonance).',
    cols: ['When', 'Ghosts touched', 'Damage taken'], rows: mrEvents.map((m) => [{ t: m.t }, { ps: [...m.who].map(pname) }, { n: m.amt }]) });

  // ---- 5. Spiritcackle adds and Gloombomb ----
  const sc = casts('spiritcackle');
  const adds = [];
  for (const [g, t0] of r.firstSeen) { const nm = h.unitName(g); if (nm === 'Spiteful Soulcoiler') adds.push({ g, t0, died: (ev.find((e) => e.k === 'die' && e.guid === g) || {}).t }); }
  // (Mythic, found in Oct 21's pulls, in no guide: every Soulcoiler casts Retaliatory Malice on itself the moment it spawns, and
  // it hits the raid every 3 s until the add dies. Its hits are credited to the add that cast them; a death to it goes to the
  // oldest set with an add alive at that moment)
  const rmHits = dmg('retaliatory malice'), rmDeaths = r.deaths.filter((d) => /^retaliatory malice$/i.test(String(d.ability || ''))), rmUsed = new Set();
  const setRows = sc.map((t, i) => {
    // adds should die before the next set spawns (the last set before a phase change is cleaned up by the transition)
    const next = sc[i + 1] != null && phaseAt(sc[i + 1]) === phaseAt(t) ? sc[i + 1] : null;
    const mine = adds.filter((a) => a.t0 >= t - 2 && a.t0 <= t + 15);
    // amber: still alive when the next set spawned (the plan wants them dead by then, but the shield comes first);
    // red: still alive when the set after that spawned (sets piling up)
    /* (Coiled Altar fix 8, Oct 24: the 11 top kills had an add live up to 10.7 s into the next set, so up to 12 s isn't flagged) */
    const alive = next != null ? mine.filter((a) => a.died == null || a.died > next + 12) : [];
    const next2 = sc[i + 2] != null && phaseAt(sc[i + 2]) === phaseAt(t) ? sc[i + 2] : null, lateDm = next2 != null ? mine.filter((a) => a.died == null || a.died > next2) : [];
    if (lateDm.length) M(next2, 'Raid', 'spiritcackle', 'High', lateDm.length + ' Spiteful Soulcoiler' + (lateDm.length > 1 ? 's were' : ' was') + ' still alive two sets later.', 'Break each Spirit Shield with two overlapping Gloombombs (melee targets on the melee add, ranged on the ranged add) and kill both adds before the next set.');
    else if (alive.length) M(next, 'Raid', 'spiritcackle', 'Low', alive.length + ' Spiteful Soulcoiler' + (alive.length > 1 ? 's were' : ' was') + ' still alive when the next set of adds spawned.', 'Kill both adds before the next set spawns. The shield comes first, but don\'t let sets pile up.');
    const kicks = r.interrupts.filter((k) => mine.some((a) => a.g === k.target));
    const rmAmt = rmHits.filter((e) => mine.some((a) => a.g === e.src)).reduce((s, e) => s + (e.amt || 0), 0);
    const rmDead = rmDeaths.filter((d) => !rmUsed.has(d) && mine.some((a) => d.t >= a.t0 - 0.5 && (a.died == null || d.t <= a.died + 3))); rmDead.forEach((d) => rmUsed.add(d));
    if (rmDead.length) M(rmDead[0].t, 'Raid', 'spiritcackle', 'High', pl(rmDead.length, 'player') + ' died to Retaliatory Malice while set ' + (i + 1) + '\'s adds were alive (' + (mine.length && mine.every((a) => a.died == null) ? (mine.length > 1 ? 'neither add was killed' : 'the add wasn\'t killed') : 'they lived ' + mine.map((a) => a.died != null ? Math.round(a.died - a.t0) + ' s' : 'until the pull ended').join(' and ')) + ').', 'Kill both adds fast: on Mythic each one hits the raid with Retaliatory Malice every 3 seconds from the moment it spawns until it dies.');
    const row = [{ txt: 'Set ' + (i + 1) }, { t }, { txt: mine.map((a) => a.died != null ? 'died ' + h.fmtT(a.died) + ' (' + Math.round(a.died - a.t0) + 's)' : 'not killed').join(', ') || 'no adds seen', bad: mine.some((a) => a.died == null) },
      { txt: String(kicks.length) }, { txt: (lateDm.length ? 'alive two sets later' : alive.length ? 'lived ' + Math.max(1, Math.round(Math.max(...alive.map((a) => (a.died != null ? a.died : r.duration) - next)))) + ' s too long' /* (how far off, so DPS see it (Oct 23)) */ : next == null ? 'last set' : 'dead in time') + (rmDead.length ? ', ' + pl(rmDead.length, 'death') + ' to Retaliatory Malice' : ''), bad: lateDm.length > 0 || rmDead.length > 0, warn: alive.length > 0 }];
    row.rm = { amt: rmAmt, dead: rmDead }; // (for the adds panel's Retaliatory Malice row)
    return row;
  });
  const gbT = auras('gloombomb').filter((e) => e.op === 'apply' && h.isPlayer(e.dst));
  const gbClip = [];
  for (const e of dmg('gloombomb')) if (!gbT.some((a) => a.dst === e.dst && e.t - a.t >= 0 && e.t - a.t <= 10)) gbClip.push(e);
  // each Gloombomb on a player, from the moment it lands until it explodes (the aura is removed): maps draw its 15 yd circle
  const gbWin = [];
  for (const e of auras('gloombomb').filter((x) => h.isPlayer(x.dst)).sort((a, b) => a.t - b.t)) {
    if (e.op === 'apply') gbWin.push({ g: e.dst, s: e.t, e: e.t + 5 });
    else if (e.op === 'remove') { const c = gbWin.filter((x) => x.g === e.dst && x.s <= e.t).pop(); if (c) c.e = e.t; }
  }
  const gbAt = (t) => gbWin.filter((c) => t >= c.s - 0.2 && t <= c.e + 0.3), clipAt = (t) => gbClip.filter((e) => Math.abs(e.t - t) <= 1.5).map((e) => e.dst);
  /* (Coiled Altar fix 8, Oct 24: 6 of 11 top kills had 1 to 5 clips and nobody died: Low; Gravebound killing them is High) */
  const gbGrave = (e) => r.deaths.find((d) => d.guid === e.dst && d.t >= e.t && d.t <= e.t + 16 && /^gravebound$/i.test(String(d.ability || '')));
  for (const e of gbClip) M(e.t, pname(e.dst), 'gloombomb', gbGrave(e) ? 'High' : 'Low', 'Got clipped by someone else\'s Gloombomb, so they also had to collect souls.', 'Gloombomb targets move to the add or to the side. Everyone else stays out of the circles.');
  sections.push({ id: 'adds', title: 'Spiritcackle and Gloombombs (Adds)', place: 'Spiritcackle adds and Gloombombs', spell: S('spiritcackle'),
    verdict: setRows.some((r2) => r2[4].bad) ? 'bad' : gbClip.length ? 'warn' : 'good',
    summary: pl(sc.length, 'add set') + ', and ' + pl(gbClip.length, 'player') + ' clipped by a Gloombomb they weren\'t targeted by. The kicks on each add are under Interrupts below.',
    cols: ['Set', 'Spawned', 'Adds', 'Kicks', 'Result'], rows: setRows });

  // ---- 6. Intermission: fragments reaching Zul'jan, Spirit Erasure stacks ----
  const reclaim = ev.filter((e) => (e.k === 'heal' || e.k === 'cast') && L(e.spell) === 'reclaim essence').map((e) => e.t).sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 0.5);
  // (each one heals Zul'jan: 10% on Mythic, 3% on Heroic, from the guides)
  for (const t of reclaim) M(t, 'Raid', 'reclaim essence', mythic ? 'High' : 'Medium', 'A Fragment of Malacrass reached Zul\'jan and healed him for ' + (mythic ? '10%' : r.item.diff === 'Heroic' ? '3%' : 'a little') + '.', 'Spread soakers around the room (including the inner ring, where an early one spawns) so no fragment gets through.');
  // Spirit Erasure is raid-wide: every blocked fragment gives the whole raid a stack at the same moment. So judge the
  // raid's stacks per soak round (a round ends when the stacks drop off), not each player.
  const cur = new Map(), rounds = []; let round = null;
  for (const e of auras('spirit erasure').filter((x) => h.isPlayer(x.dst)).sort((a, b) => a.t - b.t)) {
    cur.set(e.dst, e.op === 'apply' ? Math.max(1, e.stacks || 1) : e.op === 'remove' ? 0 : e.stacks || 0);
    const raid = Math.max(0, ...cur.values());
    if (raid > 0 && !round) rounds.push(round = { t: e.t, peak: 0, end: null });
    if (round) { round.peak = Math.max(round.peak, raid); if (raid === 0) { round.end = e.t; round = null; } }
  }
  // The plan: soak in rounds of 3 to 5 stacks and let them drop; near the end, stack raid cooldowns in the middle
  // and go up to 7 to 10. So a round is judged against whether a raid cooldown was up for it.
  const RCD = ['darkness', 'spirit link totem', 'anti-magic zone', 'rallying cry', 'power word: barrier', 'aura mastery', 'tranquility', 'revival', 'rewind', 'divine hymn', 'vampiric embrace'];
  const rcdCasts = firstCasts(ev.filter((e) => e.k === 'pcast' && RCD.includes(L(e.spell))));
  const seRows = rounds.map((rd, i) => {
    const until = rounds[i + 1] ? rounds[i + 1].t : (p3 ?? dur), through = reclaim.filter((t) => t >= rd.t - 1 && t < until).length;
    const cd = rcdCasts.filter((e) => e.t >= rd.t - 10 && e.t <= (rd.end ?? until)), cap = cd.length ? 10 : 5;
    const over = rd.peak > cap, way = rd.peak > cap + 2;
    if (over) M(rd.t, 'Raid', 'spirit erasure', way ? 'High' : 'Medium', 'The raid reached ' + rd.peak + ' Spirit Erasure stacks in soak round ' + (i + 1) + (cd.length ? ' (with raid cooldowns up)' : ' with no raid cooldown up') + '.', cd.length ? 'Even with cooldowns stacked, stop around 10 and let the stacks drop.' : 'Without cooldowns, stop at 3 to 5 stacks and let them drop. Save higher counts for when Darkness, Anti-Magic Zone or Spirit Link is down.');
    return [{ txt: 'Round ' + (i + 1) }, { t: rd.t }, { txt: pl(rd.peak, 'stack'), bad: way, warn: over, sub: cd.length ? 'cooldowns: ' + [...new Set(cd.map((e) => e.spell))].join(', ') : '' }, { txt: through ? through + ' got through' : 'none got through', bad: through > 0 && mythic, warn: through > 0 }];
  });
  // Zul'jan's health when the intermission ends: under 35% is on pace for the kill
  const zjAtP3 = (() => { if (p3 == null || !r.hpUnits) return null; const u = [...r.hpUnits].find(([, x]) => /^Zul'jan$/.test(x.name)); if (!u) return null; let v = null; for (const [t, f] of u[1].samples) { if (t > p3) break; if (t >= inter) v = f; } return v == null ? null : Math.round(100 * v); })();
  if (zjAtP3 != null) seRows.push([{ txt: 'Zul\'jan at P3' }, { t: p3 }, { txt: zjAtP3 + '% health', warn: zjAtP3 > 35, sub: 'under 35% is on pace for the kill' }, { txt: '' }]);
  // (fragments that got through with no soak round at all still get a row, so the panel says what happened)
  const notSoaked = reclaim.filter((t) => !rounds.some((rd, i) => t >= rd.t - 1 && t < (rounds[i + 1] ? rounds[i + 1].t : (p3 ?? dur))));
  if (notSoaked.length) seRows.unshift([{ txt: 'Not blocked' }, { t: notSoaked[0] }, { txt: 'no Spirit Erasure', dim: true, sub: 'nobody stood in the way' }, { txt: notSoaked.length + ' got through', sub: 'each healed Zul\'jan ' + (mythic ? '10%' : r.item.diff === 'Heroic' ? '3%' : 'a little'), bad: mythic, warn: !mythic }]);
  if (inter != null) sections.push({ id: 'inter', title: 'Intermission (Stop the fragments)', place: 'Intermission: blocking the Fragments', spell: S('soulbinding'),
    verdict: reclaim.length ? (mythic ? 'bad' : 'warn') : seRows.some((x) => x[2].warn || x[2].bad) ? 'warn' : 'good',
    summary: pl(rounds.length, 'soak round') + ', and ' + pl(reclaim.length, 'fragment') + ' reached Zul\'jan.',
    cols: ['Soak round', 'Started', 'Raid peak', 'Fragments to Zul\'jan'], rows: seRows });

  // ---- 7. Venomfang dispels ----
  // only the boss's Venomfang (a 14s dispellable poison); a player ability shares the name and lasts 6s
  const vf = auras('venomfang').filter((e) => h.isPlayer(e.dst) && !h.isPlayer(e.src));
  const vfRows = [];
  for (const a of vf.filter((e) => e.op === 'apply')) {
    const rem = vf.find((e) => e.op === 'remove' && e.dst === a.dst && e.t >= a.t);
    const disp = ev.find((e) => e.k === 'dispel' && L(e.spell) === 'venomfang' && e.dst === a.dst && e.t >= a.t && (!rem || e.t <= rem.t + 0.2));
    const took = rem ? rem.t - a.t : null;
    vfRows.push({ t: a.t, g: a.dst, took, by: disp ? disp.src : null, died: !!r.deaths.find((d) => d.guid === a.dst && d.t >= a.t && d.t <= (rem ? rem.t : a.t + 14) + 0.5) });
  }
  const slow = vfRows.filter((x) => x.took != null && x.took > 4 && !x.by);
  if (vfRows.length) sections.push({ id: 'vf', title: 'Venomfang (Dispel fast)', place: 'Venomfang (poison) dispels', spell: S('venomfang'), // (no panel on a pull without Venomfang)
    verdict: slow.length > 2 ? 'warn' : 'good', // (Oct 21, your call: dispel it quickly, but it isn't deadly: a slow one is a slip, never a fail, never red)
    summary: pl(vfRows.length, 'Venomfang debuff') + ', and ' + vfRows.filter((x) => x.by).length + ' were dispelled. The average time on a player was ' +
      (vfRows.filter((x) => x.took != null).length ? (vfRows.filter((x) => x.took != null).reduce((s, x) => s + x.took, 0) / vfRows.filter((x) => x.took != null).length).toFixed(1) + ' s' : 'n/a') + '.',
    // amber: a slow or missed dispel (no guide sets a hard rule); red only when the player died with it on them
    cols: ['When', 'Player', 'Removed after', 'Dispelled by'], rows: vfRows.map((x) => [{ t: x.t }, { p: pname(x.g) }, { txt: x.took != null ? x.took.toFixed(1) + ' s' : 'not removed', warn: x.took == null || x.took > 4 }, x.by ? { p: pname(x.by) } : { txt: 'expired / not dispelled', dim: true }]),
    // how many each player dispelled
    extra: (() => { const by = new Map(); for (const x of vfRows) if (x.by) by.set(pname(x.by), (by.get(pname(x.by)) || 0) + 1); return by.size ? { title: 'Dispels by player', items: [...by].sort((a, b) => b[1] - a[1]).map(([p, n]) => ({ p, n })) } : null; })() });

  // ---- Avoidable damage: every avoidable source in one panel, most harmful first ----
  // (from the encounter journal: what positioning can avoid; raid-wide pulses and random-target hits are left out)
  {
    const sec = avoidPanel(ev, r, h, [
      { n: ['sever', 'soul sever', 'blighted sever'], label: 'Tank frontals on non-tanks', id: S('sever')[0], harm: 'High', why: 'a big hit plus a 200% damage-taken debuff', fix: 'Only the tank belongs in front of the boss. Stay out of the frontal cone.', skip: (e) => role(e.dst) === 'tank' },
      { n: ['malevolent resonance'], label: 'Malevolent Resonance', id: S('malevolent resonance')[0], harm: 'High', why: 'two ghosts touching, which is a lethal damage over time', fix: 'When the mind control breaks, stand still, so your ghost spawns in the clump and never touches another.' },
      { n: ['noxious ground'], label: 'Noxious Ground', harm: 'Medium', why: 'the poison pools under the snake statues, every second you stand in them', warnAt: 2, badAt: 5, fix: 'Stay out of the poison pools by the statues. When the second set fills the middle, cross it quickly.' },
      { n: ['axegrinder'], label: 'Axegrinder', id: S('axegrinder')[0], harm: 'Medium', why: 'damage and a knockback every half second in an axe', warnAt: 5, badAt: 8, tankOk: true },
      { n: ['gloombomb'], label: 'Gloombomb (not your own)', id: S('gloombomb')[0], harm: 'Medium', why: 'Gravebound: collect your soul fragments or die', warnAt: 1, badAt: 2, fix: 'Stay out of the Gloombomb circles on other players.', skip: (e) => gbT.some((a) => a.dst === e.dst && e.t - a.t >= 0 && e.t - a.t <= 10) },
      { n: ['mutagenic venom'], label: 'Mutagenic Venom (near a purple carrier)', id: S('mutagenic venom')[0], harm: 'Medium', why: 'heavy damage from standing near a purple orb carrier', warnAt: 2, badAt: 5, minTicks: 2, fix: 'Give purple orb carriers room: they have right of way.', skip: (e) => carriersAt(e.t).some((c) => c.g === e.dst) },
      { n: ['defiled ground'], label: 'Defiled Ground', harm: 'Medium', why: 'P3 ground that absorbs healing every second', warnAt: 2, badAt: 5 },
      { n: ['volatile venom'], label: 'Volatile Venom (near a green carrier)', harm: 'Low', why: 'damage from standing near a green orb carrier', fix: 'Give green orb carriers 5 yards of room.', skip: (e) => carryingVV(e.dst, e.t) },
      { n: ['toxic deluge'], label: 'Toxic Deluge impacts', id: S('toxic deluge')[0], harm: 'Low', why: 'the 4-yard missile impacts', fix: 'Dodge the Toxic Deluge circles, most of all when you are low.' },
    ]);
    if (sec) sections.push(sec);
  }

  // ======== extra checks: pushes, cooldowns, Sever accounting, add execution, soak protection, mind controls, maps ========
  const LUST = ['bloodlust', 'heroism', 'time warp', 'fury of the aspects', 'primal rage', "harrier's cry"];
  const RAID_CD = ['darkness', 'spirit link totem', 'anti-magic zone', 'rallying cry', 'power word: barrier', 'aura mastery', 'tranquility', 'revival', 'rewind', 'divine hymn', 'vampiric embrace'];
  const IMMUNE = ['divine shield', 'ice block', 'aspect of the turtle', 'cloak of shadows', 'anti-magic shell', 'netherwalk', 'dispersion', 'blessing of spellwarding', 'blessing of protection'];
  const EXTERNAL = ['blessing of protection', 'blessing of spellwarding', 'blessing of sacrifice', 'pain suppression', 'guardian spirit', 'ironbark', 'life cocoon', 'time dilation', 'zephyr'];
  const pcasts = (names) => firstCasts(ev.filter((e) => e.k === 'pcast' && names.includes(L(e.spell))));
  const guidsNamed = (re, not) => [...r.firstSeen.keys()].filter((g) => re.test(h.unitName(g) || '') && !(not && not.test(h.unitName(g) || '')));
  const zj = guidsNamed(/^Zul'jan$/), mal = guidsNamed(/Malacrass$/, /Fragment/);
  // (a frontal that hit a raider gets its own map: the cone, aimed at the tank it was cast on, with the raider marked. A death to Sever
  // then shows the cone too (your note, Oct 20: "the Sever mechanic didn't show when it killed someone"). 60 degree cone, as on the orb maps)
  const frontMap = (e) => { const n = L(e.spell), snap = h.snap(e.t), RCH = { sever: 35, 'blighted sever': 45, 'soul sever': 45 };
    const tg = (dmg(n).find((x) => Math.abs(x.t - e.t) <= 1 && role(x.dst) === 'tank') || {}).dst;
    const boss = snap.find((p) => p.guid === e.src) || snap.find((p) => p.kind === 'boss' && (zj.includes(p.guid) || mal.includes(p.guid))), aim = snap.find((p) => p.guid === tg) || snap.find((p) => p.guid === e.dst);
    if (!boss || !aim) return null;
    return { t: e.t, cone: { x: boss.x, y: boss.y, dir: Math.atan2(aim.y - boss.y, aim.x - boss.x), half: Math.PI / 6, r: RCH[n] || 35, at: e.t },
      bad: [e.dst], badLabel: 'hit by the frontal', hl: tg ? [tg] : [], hlLabel: 'Tank it was aimed at', title: S(n)[1] + ' at ' + h.fmtT(e.t) + ': ' + pname(e.dst) + ' was in the cone' }; };
  const zeroAt = (gs, after) => { let best = null; for (const g of gs) { const u = r.hpUnits && r.hpUnits.get(g); if (!u) continue; for (const [s, p] of u.samples) if (s >= (after || 0) && p <= 0.01) { if (best == null || s < best) best = s; break; } } return best; };
  const hpEnd = (gs) => { let v = null; for (const g of gs) { const u = r.hpUnits && r.hpUnits.get(g); if (u && u.samples.length) v = Math.round(100 * u.samples[u.samples.length - 1][1]); } return v; };
  // aura windows (immunities, externals, shields) per unit
  const win = new Map();
  for (const e of ev.filter((x) => x.k === 'aura')) {
    const n = L(e.spell), key = e.dst + '|' + n;
    if (e.op === 'apply') { let l = win.get(key); if (!l) win.set(key, l = []); l.push([e.t, Infinity]); }
    else if (e.op === 'remove') { const l = win.get(key); if (l && l.length && l[l.length - 1][1] === Infinity) l[l.length - 1][1] = e.t; }
  }
  const has = (g, n, t) => (win.get(g + '|' + n) || []).some(([a, b]) => t >= a - 0.3 && t <= b + 0.3);
  const fmtList = (es) => [...new Set(es.map((e) => e.spell + ' (' + pname(e.src) + ')'))].join(', ');
  const healPots = (a, b) => { const out = []; for (const p of r.players.values()) for (const x of p.cons.healpot.concat(p.cons.healthstone)) if (x.t >= a && x.t <= b) out.push(p.name); return out; };

  // ---- pushes and cooldowns ----
  const pushRows = [];
  // (the 20 fastest Mythic kills, Oct 22: when each phase ended. Heroic has no kill numbers yet, so it's shown, not judged)
  const KT = { p1: [134, 157], p2: [150, 176], zj: [22, 33] }, P2K = 'about 2:30, never past 2:56', ms2 = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const MT = (t, sev, detail, fix) => mistakes.push({ t, player: 'Raid', mechanic: 'Phase changes', id: S('fangs of the coiled altar')[0], severity: sev, detail, fix });
  const hpAtT = (gs, t) => { let v = null; for (const g of gs) { const u = r.hpUnits && r.hpUnits.get(g); if (u) for (const [s2, f2] of u.samples) { if (s2 > t) break; v = f2; } } return v == null ? null : Math.round(100 * v); };
  if (p2 != null) {
    const pt = zeroAt(zj) ?? p2;
    // compare with the Fangs that was due: the last one if the push came right after it, otherwise the next one
    // (cast, or due one cycle after the last); negative = pushed early
    // The plan: after the last Toxic Deluge (the pools), hold the last frontal on empty ground, then kill Zul'jan in
    // the middle; his death explodes the orbs left (aim for 9 to 11 stacks) under stacked raid cooldowns.
    const lastDel = deluges.filter((t) => t <= pt).pop();
    const fangs = casts('fangs of the coiled altar').filter((t) => t < p2 - 1).length, p1Late = mythic && p2 > KT.p1[1] + 3, p1Bad = mythic && fangs >= 3;
    if (p1Bad || p1Late) MT(p2, p1Bad ? 'High' : 'Medium', 'Zul\'jan went down at ' + ms2(p2) + (p1Bad ? ', after the third Noxious Ground pools' : '') + ' (top guilds: ' + ms2(KT.p1[0]) + ' to ' + ms2(KT.p1[1]) + ').',
      'Push Zul\'jan right after the second pools, at 11 Venom Rupture stacks or fewer: burn him with cooldowns stacked.');
    const st = stackAt(pt + 5), mx = st.length ? Math.max(...st) : 0;
    const cds = pcasts(RAID_CD).filter((e) => e.t >= pt - 8 && e.t <= pt + 12);
    const pots = healPots(pt - 5, pt + 20);
    if (mx > 11) M(pt, 'Raid', 'venom rupture', mx >= 14 ? 'High' : 'Medium', 'The raid had up to ' + mx + ' Venom Rupture stacks after the P1 push (plan: 9 to 11).', 'Pop fewer orbs with the last frontals (2 to 3, then none), so the push explosion lands on fewer stacks.');
    if (!cds.length && mythic) M(pt, 'Raid', 'fangs of the coiled altar', 'Medium', 'No raid cooldown was used around the P1 push (' + mx + ' Venom Rupture stacks).', 'Group up and stack Darkness, Anti-Magic Zone and Spirit Link Totem for the push, and stay in them until the stacks fall off.');
    pushRows.push([{ txt: 'P1 → P2' }, { t: pt }, { txt: 'P1 took ' + ms2(p2) + (mythic ? ' (top guilds: ' + ms2(KT.p1[0]) + ' to ' + ms2(KT.p1[1]) + ')' : ''), bad: p1Bad, warn: !p1Bad && p1Late, sub: lastDel != null ? (pt - lastDel).toFixed(0) + ' s after the last Toxic Deluge' + (fangs >= 3 ? ', after the third pools' : '') : '' },
      { txt: mx + ' Venom Rupture (plan 9 to 11)', bad: mx >= 14, warn: mx > 11 }, { txt: fmtList(cds) || 'none', bad: mythic && !cds.length }, { txt: pots.length ? pots.length + ' (' + pots.join(', ') + ')' : 'none', dim: !pots.length }]);
  }
  // (P2, Malacrass: how long he took against the kills, with the moment it went late: his second shield (amber, 4 of the 20 kills
  // had one) or a 5th Dreadmarch or 3:00 (red, no kill got there). Judged at that moment, so the wipe filter counts it fairly;
  // a pull that wipes in P2 gets its own line)
  const p2End = inter ?? (p2 != null && !r.item.kill ? dur : null);
  const P2T = p2 == null || p2End == null ? null : (() => {
    const dmT = dm.filter((t) => t >= p2 - 1 && t < p2End), enT = ev.filter((x) => x.k === 'start' && L(x.spell) === 'eternal nightfall' && x.t >= p2 && x.t < p2End).map((x) => x.t).sort((p, q) => p - q).filter((t, i, l) => !i || t - l[i - 1] > 10);
    const len = p2End - p2, badAt = [dmT[4], p2 + 180].filter((t) => t != null && t < p2End), warnAt = [enT[1], p2 + 163].filter((t) => t != null && t < p2End);
    const bad = mythic && badAt.length > 0, warn = mythic && !bad && warnAt.length > 0, got = [enT.length >= 2 ? 'a second Eternal Nightfall' : '', dmT.length >= 5 ? 'a ' + dmT.length + 'th Dreadmarch' : ''].filter(Boolean);
    const at = bad || warn ? Math.min(...(bad ? badAt : warnAt)) : null;
    if (bad || warn) MT(at, bad ? 'High' : 'Medium', (inter != null ? 'Malacrass took ' : 'P2 went on for ') + ms2(len) + (inter != null ? '' : ' before the wipe') + ' (top guilds: ' + P2K + ')' + (got.length ? ', so he got ' + got.join(' and ') : '') + '.',
      'Push Malacrass before his second shield: keep damage on him between add sets and save cooldowns for his first shield. Top guilds finish P2 in about 2:30.');
    return { len, dmN: dmT.length, enN: enT.length, bad, warn, at };
  })();
  const p2Cell = (x) => ({ txt: 'P2 ' + (inter != null ? 'took ' : 'lasted ') + ms2(x.len) + (mythic ? ' (top guilds: ' + P2K + ')' : ''), bad: x.bad, warn: x.warn, sub: (x.enN === 1 ? '1 shield' : x.enN + ' shields') + ', ' + x.dmN + ' Dreadmarch casts' + (mythic ? ' (top guilds: 1 shield, 4 casts)' : '') });
  if (P2T && inter == null) pushRows.push([{ txt: 'P2 (wiped)' }, { t: P2T.at ?? p2End }, p2Cell(P2T), { txt: '' }, { txt: '' }, { txt: '' }]);
  if (inter != null) {
    const pt = zeroAt(mal) ?? inter;
    const ssAll = casts('soul sever'), ss = ssAll.filter((t) => t <= pt + 1).pop();
    const delta = ss != null ? pt - ss : null;
    const lust = pcasts(LUST).filter((e) => e.t >= inter - 20 && e.t <= inter + 25);
    if (!lust.length && mythic) M(inter, 'Raid', 'soulbinding', 'Low', 'No Bloodlust or Heroism during the Soulbinding intermission.', 'Use Hero/Lust on the intermission, because it is the big damage window on Zul\'jan.');
    const zjDmg = ev.filter((e) => e.k === 'pdmg' && e.t >= inter && e.t <= (p3 ?? dur) && zj.includes(e.dst)).reduce((s, e) => s + e.amt, 0);
    const zjBack = p3 != null ? hpAtT(zj, p3) : null, zjBad = mythic && zjBack != null && zjBack > 40, zjWarn = mythic && !zjBad && zjBack != null && zjBack > 35;
    if (zjBad || zjWarn) MT(p3, zjBad ? 'High' : 'Medium', 'Zul\'jan was still at ' + zjBack + '% after the intermission (top guilds: ' + KT.zj[0] + ' to ' + KT.zj[1] + '%).', 'Lust in the intermission and put every damage cooldown on Zul\'jan: he takes double damage while he heals. A faster P2 gives him less time to heal, too.');
    const c2 = P2T ? p2Cell(P2T) : { txt: '' }; if (P2T && delta != null) c2.sub += '; ' + delta.toFixed(0) + ' s after the last Soul Sever';
    pushRows.push([{ txt: 'P2 → Intermission' }, { t: P2T && P2T.at != null ? Math.min(P2T.at, pt) : pt }, c2,
      { txt: 'Lust: ' + (lust.length ? fmtList(lust) : 'none'), bad: !lust.length && mythic }, { txt: zjBack != null ? 'Zul\'jan back at ' + zjBack + '%' + (mythic ? ' (top guilds: ' + KT.zj[0] + ' to ' + KT.zj[1] + '%)' : '') : 'Damage to Zul\'jan in intermission: ' + h.compact(zjDmg), bad: zjBad, warn: zjWarn, sub: zjBack != null ? 'damage to him in the intermission: ' + h.compact(zjDmg) : '' }, { txt: '' }]);
  }
  if (p3 != null) {
    const defil = casts('defilement of the coiled altar').filter((t) => t >= p3);
    const dz = ev.filter((e) => e.k === 'die' && zj.includes(e.guid) && e.t > p3).map((e) => e.t)[0];
    const dmal = ev.filter((e) => e.k === 'die' && mal.includes(e.guid) && e.t > p3).map((e) => e.t)[0];
    let note = '';
    // The plan: kill Zul'jan first, before the Defilement that follows the burn, with Malacrass already low (about 7
    // to 8%), then finish Malacrass before he enrages.
    const zjP3Down = zeroAt(zj, p3), malAt = (t) => { let v = null; for (const g of mal) { const u = r.hpUnits && r.hpUnits.get(g); if (u) for (const [s2, f2] of u.samples) { if (s2 > t) break; v = f2; } } return v == null ? null : Math.round(100 * v); };
    if (zjP3Down != null) {
      const m = malAt(zjP3Down); note = 'Zul\'jan died at ' + h.fmtT(zjP3Down) + (m != null ? ' with Malacrass at ' + m + '%' : '') + (dmal != null ? '; Malacrass died ' + (dmal - zjP3Down).toFixed(0) + ' s later' : '');
      if (m != null && m > 10) M(zjP3Down, 'Raid', 'defilement of the coiled altar', m > 20 ? 'High' : 'Medium', 'Malacrass was still at ' + m + '% when Zul\'jan died (plan: about 7 to 8%).', 'Bring Malacrass close to Zul\'jan before killing Zul\'jan, so Malacrass dies before he enrages.');
    } else if (dmal != null && dz == null) { note = 'Malacrass died first; Zul\'jan ended at ' + (hpEnd(zj) ?? '?') + '%'; M(dmal, 'Raid', 'defilement of the coiled altar', 'Medium', 'Malacrass died before Zul\'jan.', 'Kill Zul\'jan first (before the next Defilement), with Malacrass at about 7 to 8%.'); }
    else note = 'Health at the end: Zul\'jan ' + (hpEnd(zj) ?? '?') + '%, Malacrass ' + (hpEnd(mal) ?? '?') + '%';
    // damage to Malacrass outside his Eternal Nightfall shields (target priority)
    const shieldOn = (t) => mal.some((g) => has(g, 'eternal nightfall', t));
    const off = new Map();
    for (const e of ev) if (e.k === 'pdmg' && e.t >= p3 && mal.includes(e.dst) && !shieldOn(e.t)) off.set(e.src, (off.get(e.src) || 0) + e.amt);
    const offTop = [...off].sort((a, b) => b[1] - a[1]).slice(0, 3);
    pushRows.push([{ txt: 'P3' }, { t: p3 }, { txt: defil.length + ' Defilement cast' + (defil.length === 1 ? '' : 's') + (defil.length ? ', last at ' + h.fmtT(defil[defil.length - 1]) : '') }, { txt: note },
      { txt: offTop.length ? 'Most damage on Malacrass outside shields: ' + offTop.map(([g, a]) => pname(g) + ' ' + h.compact(a)).join(', ') : '' }, { txt: '' }]);
  }
  sections.unshift({ id: 'push', title: 'Phase changes (Push on time)', spell: S('fangs of the coiled altar'),
    verdict: mistakes.some((x) => ['Phase changes', 'Fangs of the Coiled Altar', 'Soulbinding', 'Defilement of the Coiled Altar'].includes(x.mechanic) && x.player === 'Raid') ? 'warn' : 'good',
    summary: 'Each phase change against the 20 fastest kills: when Zul\'jan went down, how long Malacrass took (kills push him before his second shield), how healthy Zul\'jan came back after the intermission, and boss balance in P3. Also the stacks and raid cooldowns at the P1 push and Bloodlust in the intermission.',
    cols: ['Transition', 'When', 'Timing', 'Stacks / Lust / balance', 'Cooldowns / Zul\'jan\'s health', 'Potions at push'], rows: pushRows });

  // ---- Sever orb accounting ----
  // frontals are timed to when they land (cast success, ~3s after the cast bar starts): that's when orbs pop
  const landAt = (n, t) => (ev.find((e) => e.k === 'cast' && L(e.spell) === n && e.t >= t && e.t <= t + 8) || { t }).t;
  // (a P1 Sever that would land after Zul'jan went down never happened)
  const severs = ['sever', 'blighted sever'].flatMap((n) => casts(n).map((t) => ({ t: landAt(n, t), n }))).filter((s) => !(s.n === 'sever' && zjDown != null && s.t >= zjDown - 0.2)).sort((a, b) => a.t - b.t);
  // the plan for each frontal (Oct 24, from 11 top Mythic kills after the Oct 13 tuning): each Toxic Deluge drops 8 orbs and its two frontals
  // split them, about 4 each (never 8), right up to the push; in P3 the first takes every purple at once, later ones clear the purples
  // (P1 positions count every Sever cast, including a last one cut off by the push, so "second-to-last" stays right)
  const p1All = casts('sever').map((t) => landAt('sever', t)).sort((a, b) => a - b), p3Sev = severs.filter((s) => s.n === 'blighted sever');
  const planFor = (s) => {
    // (Heroic and Normal have no purple orbs and no count to aim for: the guides' plan is to clear every orb on the ground
    // with each frontal, so the count is shown, not judged)
    if (!mythic) return { txt: 'every orb on the ground', badAt: Infinity };
    if (s.n === 'sever') return { txt: 'about 4 (never 8)', badAt: 8 };
    return p3Sev.indexOf(s) === 0 ? { txt: 'every purple (5 to 7)', badAt: 8 } : { txt: 'the purples left (7 at most)', badAt: 8 };
  };
  const sevRows = severs.map((s, i) => {
    const before = new Map(), after = new Map();
    for (const [g, l] of hist) { let b = 0, a = 0; for (const [tt, st] of l) { if (tt <= s.t - 0.3) b = st; if (tt <= s.t + 3) a = st; } before.set(g, b); after.set(g, a); }
    const gains = [...after].map(([g, a]) => a - before.get(g)).filter((x) => x > 0).sort((a, b) => a - b);
    const popped = gains.length ? gains[Math.floor(gains.length / 2)] : 0;
    const cyc = deluges.filter((d) => d <= s.t).length, nth = severs.filter((x) => x.t <= s.t && deluges.filter((d) => d <= x.t).length === cyc).length;
    const pf = planFor(s), plan = pf.txt;
    const bad = popped >= pf.badAt;
    if (bad) mistakes.push({ t: s.t, player: 'Raid', mechanic: 'Coalesced Venom', id: 1282403, severity: 'Medium', detail: S(s.n)[1] + ' popped about ' + popped + ' orbs at once; the plan was ' + plan + '.', fix: 'Each popped orb is a raid-wide stack. About 4 per frontal: the two frontals split each Toxic Deluge\'s 8 orbs. Never 8 at once.' }); /* (an orb mistake, filed under Coalesced Venom, not the tanks' Sever (Oct 24)) */
    return [{ txt: '#' + (i + 1) }, { t: s.t }, { s: S(s.n) }, { txt: phaseAt(s.t) }, { txt: 'about ' + popped + ' orbs', bad }, { txt: plan || '—', dim: true }];
  });
  sections.splice(2, 0, { id: 'sever', title: 'Sever orb counts', spell: S('sever'), mythicOnly: false,
    verdict: sevRows.some((x) => x[4].bad) ? 'warn' : 'good',
    summary: 'It shows the orbs each frontal popped, estimated from the Venom Rupture stacks the raid gained in the 3 seconds after it. Each popped orb adds one stack.',
    cols: ['Frontal', 'When', 'Spell', 'Phase', 'Orbs popped', 'Plan'], rows: sevRows });

  // ---- add execution: shield breaks and kick timing ----
  const addRows = [];
  // The add jumps when kicked, so the first kick goes in once the Gloombomb cast has started: the add then stays
  // put for the Gloombomb overlap, and there's still time to kick again after it lands. (Gloombomb starts right
  // away on odd sets and a few seconds later on even sets.)
  const gbStarts = ev.filter((e) => e.k === 'start' && L(e.spell) === 'gloombomb').map((e) => e.t).sort((a, b) => a - b);
  const gbLands = gbT.map((e) => e.t).sort((a, b) => a - b);
  sc.forEach((t, i) => {
    const mine = adds.filter((a) => a.t0 >= t - 2 && a.t0 <= t + 15);
    const lastOfPhase = !(sc[i + 1] != null && phaseAt(sc[i + 1]) === phaseAt(t));
    const gbS = gbStarts.find((x) => x >= t - 1 && x <= t + 15), gbL = gbS != null ? gbLands.find((x) => x >= gbS) : null;
    for (const a of mine) {
      const k = r.interrupts.filter((x) => x.target === a.g).map((x) => x.t).sort((x, y) => x - y)[0];
      const kd = k != null ? k - a.t0 : null;
      const beforeGb = k != null && gbS != null && k < gbS - 0.5;
      const shOff = ev.find((e) => e.k === 'aura' && e.op === 'remove' && e.dst === a.g && L(e.spell) === 'spirit shield');
      const shLate = gbL != null && shOff && shOff.t > gbL + 7;
      // (late in P3 the plan only keeps kicks on the adds: they don't enrage before the bosses die, so the last P3 set
      // isn't judged and earlier P3 sets are only Low)
      if (mythic && !shOff && a.died == null && !lastOfPhase) M(t, 'Raid', 'spirit shield', phaseAt(t) === 'P3' ? 'Low' : 'Medium', 'A Spiteful Soulcoiler\'s Spirit Shield was never broken (set ' + (i + 1) + ').', phaseAt(t) === 'P3' ? 'In P3, break the shields while there\'s time. Near the end, keeping kicks on the adds is enough.' : 'The two Gloombomb targets overlap their circles on the add: melee targets on the melee add, and ranged targets on the ranged add.');
      if (mythic && beforeGb && (!shOff || shLate)) M(k, 'Raid', 'wail of terror', 'Low', 'First kick on set ' + (i + 1) + ' came ' + (gbS - k).toFixed(1) + ' s before Gloombomb started, so the add jumped before the bombs could overlap on it.', 'Kick as soon as you see the Gloombomb cast start, so the add stays put for the overlap and there\'s still time for the next kick.');
      addRows.push([{ txt: 'Set ' + (i + 1) }, { t: a.t0 }, { txt: kd == null ? 'no kick' : kd.toFixed(1) + ' s after it spawned', sub: gbS != null && k != null ? (beforeGb ? (gbS - k).toFixed(1) + ' s before Gloombomb started' : 'after Gloombomb started') : '', warn: mythic && beforeGb && (!shOff || shLate) },
        { txt: shOff ? 'broken ' + (shOff.t - a.t0).toFixed(1) + ' s after it spawned' : mythic ? (lastOfPhase ? (phaseAt(t) === 'P3' ? 'not broken (kicks are enough at the end of P3)' : 'not broken (breaks at the transition)') : 'never broken') : '—', bad: mythic && !shOff && !lastOfPhase && phaseAt(t) !== 'P3', warn: mythic && !shOff && !lastOfPhase && phaseAt(t) === 'P3' },
        { txt: a.died != null ? 'killed in ' + Math.round(a.died - a.t0) + ' s' : 'alive', bad: a.died == null && !lastOfPhase, dim: a.died == null && lastOfPhase }]);
    }
    // (not checked: "the melee add's second kick should be a melee player". Which add is the melee one can't be told
    // reliably from positions: both often stand about as far from Malacrass.)
  });
  sections.push({ id: 'addx', title: 'Add execution (Shields)', place: 'Add execution: shields and kick timing', spell: S('spirit shield'), mythicOnly: true,
    verdict: addRows.some((x) => x[3].bad) ? 'bad' : addRows.some((x) => x[2].bad) ? 'warn' : 'good',
    summary: 'For each Spiteful Soulcoiler, it shows when the first kick came against the Gloombomb cast, when its Spirit Shield came off, and when it died.',
    cols: ['Set', 'Spawned', 'First kick', 'Spirit Shield', 'Died'], rows: addRows });

  // ---- Tank frontals: who took each Sever / Soul Sever / Blighted Sever, on which stack, and with what up ----
  // The plan: in P1 the tanks swap every frontal (one stack each); in P2 one tank takes every Soul Sever, using a
  // defensive on the first stack and a big defensive and an external on the second (the stacks drop before a third; one external is what top
  // tanks use, Coiled Altar fix 6, Oct 24).
  const tfRows = [];
  for (const n of ['sever', 'soul sever', 'blighted sever']) for (const t0 of casts(n)) {
    // the frontal itself (when the cast lands), not the damage-over-time Soul Sever leaves on the tank
    const land = landAt(n, t0), hit = (dmg(n).filter((e) => role(e.dst) === 'tank' && Math.abs(e.t - land) < 0.6).sort((a, b) => Math.abs(a.t - land) - Math.abs(b.t - land))[0] || null);
    if (!hit) continue;
    const g = hit.dst, st = (auras(n).filter((e) => e.dst === g && (e.op === 'apply' || e.op === 'dose') && Math.abs(e.t - hit.t) < 1).map((e) => (e.op === 'apply' ? 1 : e.stacks || 1)).pop()) || 1;
    const exts = EXTERNAL.filter((x) => has(g, x, hit.t)), pers = PERSONAL.filter((x) => has(g, x, hit.t)).concat(IMMUNE.filter((x) => has(g, x, hit.t)));
    const died = r.deaths.find((d) => d.guid === g && d.t >= hit.t - 0.2 && d.t <= hit.t + 3);
    const ph = phaseAt(hit.t), lowCover = st >= 2 && !exts.length && !IMMUNE.some((x) => has(g, x, hit.t)) && pers.length < 2; /* (covered: an external, an immunity, or two defensives (top kills, Oct 24)) */
    const bad = !!died || st >= 3, warn = !bad && ((ph === 'P1' && st >= 2) || lowCover || (!pers.length && !exts.length && st >= 2));
    if (died) M(hit.t, pname(g), n, 'High', 'Died to ' + S(n)[1] + ' on stack ' + st + '.', st >= 2 ? 'On the second stack, use a big defensive and get an external, or swap.' : 'Use a defensive for the frontal.');
    else if (st >= 3) M(hit.t, pname(g), n, 'High', 'Took ' + S(n)[1] + ' on stack ' + st + '.', 'Let the stacks drop (or swap) before a third frontal.');
    else if (warn) M(hit.t, pname(g), n, 'Low', 'Took ' + S(n)[1] + ' on stack ' + st + (exts.length ? ' with ' + exts.length + ' external' + (exts.length === 1 ? '' : 's') : ' with no external') + (ph === 'P1' ? ' (P1 swaps every frontal)' : '') + '.', ph === 'P1' ? 'Taunt before each Sever so every frontal lands on a fresh tank.' : 'On the second stack, use a big defensive and get an external.');
    tfRows.push({ t: hit.t, row: [{ t: hit.t }, { s: S(n) }, { p: pname(g) }, { txt: 'stack ' + st, bad: st >= 3, warn: ph === 'P1' && st >= 2 },
      { txt: [...new Set([...pers, ...exts])].map((x) => SHORT_CD[x] || x.replace(/\b\w/g, (c) => c.toUpperCase())).join(', ') || 'nothing up', sub: st >= 2 ? (!lowCover ? 'covered' : 'plan: a big defensive and an external') : '', warn: lowCover || (!pers.length && !exts.length && st >= 2), dim: st < 2 && !pers.length && !exts.length },
      { txt: died ? 'died' : 'lived', bad: !!died }] });
  }
  if (tfRows.length) sections.push({ id: 'tankfront', title: 'Tank frontals (Defensives on stack 2)', place: 'Tank frontals: stacks and defensives', spell: S('soul sever'),
    verdict: tfRows.some((x) => x.row.some((c) => c.bad)) ? 'bad' : tfRows.some((x) => x.row.some((c) => c.warn)) ? 'warn' : 'good',
    summary: pl(tfRows.length, 'tank frontal') + '. It shows who took each one, on which stack, and the defensives and externals they had up.',
    cols: ['When', 'Frontal', 'Tank', 'Stack', 'Had up', 'Result'], rows: tfRows.sort((a, b) => a.t - b.t).map((x) => x.row) });

  // ---- Eternal Nightfall: Malacrass shields himself while casting; breaking it in time is the real damage check ----
  // Two steps (encounter journal: "interruptible if the shield is broken"): the raid breaks the absorb shield (aura
  // 1286912), then someone kicks the cast before the 17s are up. The cast's own aura (1310752) drops at the kick.
  const EN_CAST = 17;
  const enStarts = ev.filter((e) => e.k === 'start' && L(e.spell) === 'eternal nightfall').map((e) => e.t).sort((a, b) => a - b);
  const enDone = ev.filter((e) => e.k === 'cast' && L(e.spell) === 'eternal nightfall').map((e) => e.t);
  const enKicks = (r.interrupts || []).filter((k) => mal.includes(k.target) && (k.id === 1286918 || L(k.spell) === 'eternal nightfall'));
  const hasAbs = ev.some((e) => e.k === 'aura' && e.id === 1286912);
  const _shields = []; // (for the Performance tab's damage checks: each shield's window, whether it broke, and the damage on Malacrass in it)
  const enRows = enStarts.map((t, i) => {
    const end = Math.min(enStarts[i + 1] ?? Infinity, t + 30);
    const done = enDone.find((x) => x >= t && x <= end);
    const kick = enKicks.find((k) => k.t >= t && k.t <= end);
    // when the shield broke: the absorb aura dropping before the cast ended (older logs without it: the kick time)
    const absOff = hasAbs ? ev.find((e) => e.k === 'aura' && e.op === 'remove' && e.id === 1286912 && mal.includes(e.dst) && e.t >= t && e.t <= end) : null;
    const stopAt = kick ? kick.t : done ?? null;
    const brokeAt = absOff && (stopAt == null || absOff.t < stopAt - 0.02) ? absOff.t : !hasAbs && kick ? kick.t : null;
    const spare = brokeAt != null ? EN_CAST - (brokeAt - t) : null;
    const breakCell = brokeAt != null ? { txt: 'after ' + (brokeAt - t).toFixed(1) + ' s (' + spare.toFixed(1) + ' s to spare)', warn: spare < 1 } : done != null ? { txt: 'not broken', bad: true } : { txt: 'pull ended first', dim: true };
    // who kicked, and how long after the shield fell (only possible once it's down)
    const kickCell = kick ? { p: kick.player, sub: kick.by + (brokeAt != null && hasAbs ? ' · ' + (kick.t - brokeAt).toFixed(1) + ' s after the break' : '') } : brokeAt != null && done != null ? { txt: 'nobody kicked', bad: true } : { txt: '—', dim: true };
    let res;
    if (done != null && brokeAt == null) { res = { txt: 'cast finished', bad: true }; M(done, 'Raid', 'eternal nightfall', 'High', 'Eternal Nightfall finished casting, because the shield wasn\'t broken in time.', 'Save cooldowns and pooled damage for every shield. It is the damage check that wipes the raid.'); }
    else if (done != null) { res = { txt: 'cast finished', bad: true }; M(done, 'Raid', 'eternal nightfall', 'High', 'The Eternal Nightfall shield broke, but nobody kicked Malacrass before the cast finished.', 'Assign a kicker and a backup for every Eternal Nightfall. Kick the moment the shield breaks.'); }
    else if (kick) res = { txt: 'stopped' };
    else res = { txt: 'pull ended first', dim: true };
    { const to = brokeAt ?? done ?? Math.min(end, dur), dmgIn = ev.filter((e) => e.k === 'pdmg' && mal.includes(e.dst) && e.t >= t && e.t <= to).reduce((s, e) => s + e.amt, 0);
      _shields.push({ n: i + 1, t, ph: phaseAt(t), brokeAt, spare, done: done != null, kicked: !!kick, dmg: dmgIn, secs: Math.max(0.1, to - t) }); }
    return [{ txt: 'Shield ' + (i + 1) }, { t }, { txt: phaseAt(t) }, breakCell, kickCell, res];
  });
  if (enRows.length) sections.push({ id: 'shield', title: 'Eternal Nightfall (Break and kick)', place: 'Eternal Nightfall (boss shield): break it, then kick', spell: S('eternal nightfall'),
    verdict: enRows.some((x) => x[5].bad) ? 'bad' : enRows.some((x) => x[3].warn) ? 'warn' : 'good',
    summary: pl(enRows.length, 'shield') + ', and ' + enRows.filter((x) => x[5].txt === 'stopped').length + ' were broken and kicked in time.',
    cols: ['Shield', 'Cast started', 'Phase', 'Broken', 'Kicked by', 'Result'], rows: enRows });

  // ---- Guillotine protection ----
  const qRows = [];
  const p1g = soaks.filter((s) => s.n === 'guillotine' && phaseAt(s.t) === 'P1');
  const grim = soaks.filter((s) => s.n === 'grim guillotine');
  // The Mythic plan per soak: who goes in, what they need, and where (corner relative to the room center)
  // The Mythic plan per soak. The players who immune the 2nd soak also stand in the 1st, because its debuff stops the 2nd
  // from targeting them (a targeted immuner would leave the circle a player short).
  const SHORT = { 'divine shield': 'Bubble', 'blessing of protection': 'BoP', 'blessing of spellwarding': 'Spellwarding', 'aspect of the turtle': 'Turtle', 'cloak of shadows': 'Cloak', 'ice block': 'Ice Block', 'dispersion': 'Dispersion', 'anti-magic shell': 'AMS', 'netherwalk': 'Netherwalk',
    'blessing of sacrifice': 'Sacrifice', 'pain suppression': 'Pain Suppression', 'guardian spirit': 'Guardian Spirit', 'ironbark': 'Ironbark', 'life cocoon': 'Life Cocoon', 'time dilation': 'Time Dilation', 'zephyr': 'Zephyr', tank: 'Tank' };
  const PLAN = { g1: '5 to 8 players with personals', g2: 'the immunities and both tanks',
    gg1: 'at least 5, free of the debuff', gg2: 'at least 5, free of the debuff', gg3: 'at least 5, free of the debuff (over-send)' };
  const zjPts = []; for (const g of zj) { const u = r.positions && r.positions.get(g); if (u) for (const p of u.pts) zjPts.push(p); }
  const mid = (a) => { const v = a.slice().sort((x, y) => x - y); return v.length ? v[v.length >> 1] : 0; };
  const center = { x: mid(zjPts.map((p) => p[1])), y: mid(zjPts.map((p) => p[2])) };
  const cornerOf = (gs, t) => {
    const at = h.snap(t).filter((p) => gs.includes(p.guid)); if (!at.length || !zjPts.length) return null;
    const x = at.reduce((s, p) => s + p.x, 0) / at.length - center.x, y = at.reduce((s, p) => s + p.y, 0) / at.length - center.y;
    return (y >= 0 ? 'north' : 'south') + '-' + (x >= 0 ? 'east' : 'west'); // log x points east, y north
  };
  const personal = (g, t) => PERSONAL.some((n) => has(g, n, t)) || IMMUNE.some((n) => has(g, n, t));
  const MS = (t, player, spell, sev, detail, fix, map) => { M(t, player, spell, sev, detail, fix); mistakes[mistakes.length - 1].map = map; };
  const corners = [];
  for (const s of soaks) {
    const hit = s.hit ?? s.t + 3;
    const tgtE = ev.find((e) => e.k === 'aura' && e.op === 'apply' && L(e.spell) === s.n && h.isPlayer(e.dst) && e.t <= hit && e.t >= hit - 12), tgt = tgtE && tgtE.dst;
    const tag = (g) => { const im = IMMUNE.filter((n) => has(g, n, hit)), ex = EXTERNAL.filter((n) => has(g, n, hit)); return im.length ? 'immune: ' + im.join('/') : ex.length ? 'external: ' + ex.join('/') : role(g) === 'tank' ? 'tank' : ''; };
    const gi = s.n === 'grim guillotine' ? grim.indexOf(s) : p1g.indexOf(s);
    const key = s.n === 'grim guillotine' ? ['gg1', 'gg2', 'gg3'][gi] : ['g1', 'g2'][gi];
    const immunitySoak = mythic && (key === 'g2' || key === 'gg2');
    // (a drop that never landed: shown, not judged)
    if (!s.landed) { qRows.push([{ t: s.t }, { s: S(s.n), sub: phaseAt(s.t) + (gi >= 0 ? ' · soak ' + (gi + 1) : '') }, { txt: 'didn\'t land', sub: 'nobody was hit (the phase changed or the pull ended first)', dim: true }, { txt: '—', dim: true }, { txt: '—', dim: true }, { txt: '—', dim: true }, { ps: [], none: '—' }, { txt: '' }]); continue; }
    const all = s.who.concat(tgt && !s.who.includes(tgt) ? [tgt] : []);
    // The axe lands where the target stands and hits everyone within 9 yards (soakers come from the damage hits).
    const lp = tgt && h.snap(hit).find((p) => p.guid === tgt);
    // (your note, Oct 19: the circle rides on the target while they run it to the spot, from the debuff to the drop, then
    // stays where the axe landed; a still map shows only the landed one)
    const gcol = mcol(s.n === 'grim guillotine' ? 'Grim Guillotine' : 'Guillotine'), tA = tgtE ? tgtE.t : hit, eName = s.n === 'grim guillotine' ? "Death's Embrace" : "Widow's Kiss";
    const ring = lp ? (hit - tA > 0.3 ? [{ guid: tgt, t0: tA, dur: hit - tA - 0.05, r: GUILLOTINE_R, fx: 'soak', at: hit, label: 'soak ' + GUILLOTINE_R + ' yd', ...gcol, legend: S(s.n)[1] + ' soak, ' + GUILLOTINE_R + ' yd' }] : [])
      .concat([{ x: lp.x, y: lp.y, t0: hit - 0.05, dur: 30, r: GUILLOTINE_R, fx: 'soak', at: hit, label: 'soak ' + GUILLOTINE_R + ' yd', ...gcol, legend: S(s.n)[1] + ' soak, ' + GUILLOTINE_R + ' yd' },
        // (then the axe swells and erupts 40 yd around where it landed, 6 s later (your note, Oct 19): Widow's Kiss, or
        // Death's Embrace for Grim Guillotine; it shows from the landing, turning faster until it bursts)
        { x: lp.x, y: lp.y, t0: hit, dur: AXE_ERUPT_S + 0.7, r: AXE_ERUPT_R, fx: 'burst', at: hit + AXE_ERUPT_S, label: eName + ' ' + AXE_ERUPT_R + ' yd', ...mcol(eName, 0.07),
          legend: eName + ': the axe erupts ' + AXE_ERUPT_S + ' s after it lands, ' + AXE_ERUPT_R + ' yd around it (get out)' }]) : [];
    // (anyone the eruption caught, on this map)
    const kissed = [...new Set(dmg(L(eName)).filter((e) => h.isPlayer(e.dst) && e.t >= hit + AXE_ERUPT_S - 1 && e.t <= hit + AXE_ERUPT_S + 2).map((e) => e.dst))];
    // outcome on the map: soakers who lived = right; soakers who died, or a target with no protection = wrong
    const diedG = r.deaths.filter((d) => s.died.includes(d.player) && Math.abs(d.t - hit) < 6).map((d) => d.guid);
    const wrong = [...new Set(diedG.concat(mythic && tgt && !tag(tgt) && !diedG.includes(tgt) ? [tgt] : [], kissed))];
    const map = { t: hit, hl: all, hlLabel: 'Soakers (in the circle)', good: all.filter((g) => !wrong.includes(g)), goodLabel: 'soaked and lived', bad: wrong, badLabel: 'died in the soak, target without protection, or caught by ' + eName, rings: ring,
      title: S(s.n)[1] + ' drop at ' + h.fmtT(hit) + ': ' + s.who.length + ' in the circle (soakers ringed)' + (kissed.length ? ', ' + pl(kissed.length, 'player') + ' caught by ' + eName : ''),
      // (the animation starts as the target gets the debuff, so the run is part of it, and ends just after the eruption)
      ...(h.frames ? { frames: h.frames(Math.max(0, Math.min(tA, hit - 4) - 0.5), Math.min(dur, hit + AXE_ERUPT_S + 1), 0.25) } : {}) };
    const corner = cornerOf(all, hit); if (s.n === 'grim guillotine') corners[gi] = corner;
    // the target needs protection on every soak but the last Grim Guillotine (where the plan just over-sends)
    const needsProt = mythic && key !== 'gg3', tgtDied = tgt && s.died.includes(pname(tgt));
    /* (Coiled Altar fix 5, Oct 24: top guilds often give the target nothing and it lives; only a target who died unprotected is a mistake) */
    if (needsProt && tgt && !tag(tgt) && tgtDied) MS(s.t, pname(tgt), s.n, 'High', 'Was the ' + S(s.n)[1] + ' target with no external or immunity and died.', 'The target gets an external (Blessing of Protection on the 2nd Guillotine, Spellwarding on Grim Guillotine 2).', map);
    // one row per drop: what the plan wanted, who was in the circle (and what they had up), target, corner, deaths
    // soakers as player chips with a short badge for what they had up (the plan per soak is in How it works)
    const kind = (g) => { const tg = tag(g); return tg ? [SHORT[tg.replace(/^(immune|external): /, '').split('/')[0]] || tg.replace(/^(immune|external): /, ''), /^immune/.test(tg) ? 'imm' : /^external/.test(tg) ? 'ext' : 'tank'] : personal(g, hit) ? ['Personal', 'pers'] : ['', '']; };
    qRows.push([{ t: s.t }, { s: S(s.n), sub: phaseAt(s.t) + (gi >= 0 ? ' · soak ' + (gi + 1) : '') }, { txt: String(s.who.length), sub: 'needs ' + need, bad: s.who.length < need },
      s.who.length ? { pt: s.who.map((g) => [pname(g), ...kind(g)]) } : { txt: '—', dim: true },
      tgt ? { p: pname(tgt), sub: tag(tgt) ? kind(tgt)[0] : (needsProt ? 'no protection' : 'none needed'), bad: needsProt && !tag(tgt) && tgtDied } : { txt: 'target not found', dim: true },
      { txt: corner ? corner.split('-').map((w) => w[0].toUpperCase()).join('') : '—', dim: true }, // NW / NE / SW / SE
      { ps: s.died, none: '—', bad: s.died.length > 0 }, { map }]);
  }
  sections.push({ id: 'soakq', title: 'Guillotine (Soak with 5)', place: 'Guillotine (axe) soaks', spell: S('guillotine'),
    verdict: soaks.some((s) => s.died.length || (s.landed && s.who.length < need)) ? 'bad' : 'good',
    summary: pl(soaks.length, 'drop') + ' checked against the plan (see How it works). It shows the soakers in the ' + GUILLOTINE_R + '-yard circle (at least ' + need + '), what each had up (immunity, external or personal), the target\'s protection, and where it was soaked. The map shows the circle at the drop.',
    cols: ['When', 'Soak', 'In circle', 'Soakers', 'Target', 'Corner', 'Died', ''], rows: qRows });

  // ---- mind controls: deaths by falling in P2/P3 ----
  const mcRows = [];
  for (const d of r.deaths) {
    const ph = phaseAt(d.t); if (ph !== 'P2' && ph !== 'P3') continue;
    const lastHit = d.recap.filter((x) => !x.heal).pop();
    const fell = lastHit && /^falling$/i.test(lastHit.spell); // (the log's falling damage only: "Eternal Nightfall" isn't a fall (Oct 22))
    const noHit = !lastHit || d.t - lastHit.t > 4;
    if (fell || noHit) {
      M(d.t, d.player, 'dreadmarch', 'High', 'Died ' + (fell ? 'from falling' : 'with no damage in the seconds before') + ' in ' + ph + ', most likely mind controlled off the platform.', 'Cancel shields and absorbs when mind controlled, and keep a stun plus a grip or ring ready for every Dreadmarch.');
      mcRows.push([{ t: d.t }, { p: d.player }, { txt: ph }, { txt: fell ? 'falling damage' : 'no damage before death', dim: true }, { map: { t: d.t - 1, hl: [d.guid], bad: [d.guid], badLabel: 'mind controlled off the edge', title: d.player + ' just before dying' } }]);
    }
  }
  sections.push({ id: 'mc', title: 'Mind controls (Falls)', place: 'Mind controls (falls)', spell: S('dreadmarch'), mythicOnly: false,
    verdict: mcRows.length ? 'bad' : 'good',
    summary: 'Deaths in P2 and P3 from falling, or with no damage taken just before, which on this fight almost always means a Dreadmarch mind control walked someone off the edge.',
    cols: ['When', 'Player', 'Phase', 'How', ''], rows: mcRows });

  // ---- positioning: orbs and ghosts on the arena maps ----
  // Orb and ghost spawns have positions in the log (Coalesced Venom Stalker = green orb, Virulent Mutation = purple,
  // Manifestation of Dread = ghost), so maps can show where they were next to the players.
  const deadAt = new Map(); for (const e of ev) if (e.k === 'die' && !deadAt.has(e.guid)) deadAt.set(e.guid, e.t);
  const OBJ = { 'coalesced venom stalker': 'orb', 'virulent mutation': 'porb', 'manifestation of dread': 'ghost' };
  // An orb isn't one unit for its whole life: when a carrier drops it, the game creates a new orb unit where it
  // lands (Virulent Mutation for purples). So follow the orbs: each pickup (Mutagenic Venom = purple,
  // Volatile Venom = green) removes the nearest orb still on the ground, and each drop adds its new unit.
  const inst = [];
  for (const u of (r.positions || new Map()).values()) {
    const nm = u.name || h.unitName(u.guid) || '', kind = OBJ[L(nm)]; if (!kind || !u.pts.length) continue;
    inst.push({ guid: u.guid, name: nm, kind, t0: u.pts[0][0], pts: u.pts });
  }
  inst.sort((a, b) => a.t0 - b.t0);
  const picks = { porb: auras('mutagenic venom'), orb: auras('volatile venom') };
  for (const k in picks) picks[k] = picks[k].filter((e) => e.op === 'apply' && h.isPlayer(e.dst)).map((e) => ({ t: e.t, g: e.dst })).sort((a, b) => a.t - b.t);
  const snapC = new Map(), snapAt = (t) => { const k = Math.round(t * 2); if (!snapC.has(k)) snapC.set(k, h.snap(t)); return snapC.get(k); };
  const objs = (t, from) => {
    const out = [];
    for (const kind of ['orb', 'porb', 'ghost']) {
      const units = inst.filter((i) => i.kind === kind && i.t0 >= from - 0.5 && i.t0 <= t + 0.5 && !(deadAt.get(i.guid) < t - 0.5));
      if (kind === 'ghost') { for (const i of units) { let best = i.pts[0]; for (const p of i.pts) { if (p[0] > t + 0.5) break; best = p; } out.push({ guid: i.guid, name: i.name, x: best[1], y: best[2], kind }); } continue; }
      // replay spawns/drops and pickups in time order
      const evs = units.map((i) => ({ t: i.t0, add: i })).concat(picks[kind].filter((p) => p.t >= from && p.t <= t).map((p) => ({ t: p.t, pick: p }))).sort((a, b) => a.t - b.t || (a.add ? -1 : 1));
      let alive = [];
      for (const e of evs) {
        if (e.add) { alive.push({ guid: e.add.guid, name: e.add.name, x: e.add.pts[0][1], y: e.add.pts[0][2], kind }); continue; }
        const me = snapAt(e.pick.t).find((p) => p.guid === e.pick.g); if (!me || !alive.length) continue;
        let bi = -1, bd = 8; alive.forEach((o, i) => { const d = Math.hypot(o.x - me.x, o.y - me.y); if (d < bd) { bd = d; bi = i; } });
        if (bi >= 0) alive.splice(bi, 1);
      }
      out.push(...alive);
    }
    return out;
  };
  // ---- Orbs and frontals in one panel: a set per Toxic Deluge, a row per frontal ----
  // What matters is where the orbs are when the tank frontal lands. Each popped orb gives everyone one Venom
  // Rupture stack, so the stacks the raid gained say how many it hit; the map marks which ones, from the cone
  // that points from Zul'jan at the tank the frontal hit (the closest-aligned orbs on the ground).
  const orbSec0 = sections.find((s) => s.id === 'orbs');
  const sevI = sections.findIndex((s) => s.id === 'sever'); if (sevI >= 0) sections.splice(sevI, 1);
  if (orbSec0) {
    // Sever / Soul Sever / Blighted Sever: 60 degree cone (SpellTargetRestrictions.ConeDegrees via wago.tools),
    // aimed at the tank (the boss faces its target); Sever reaches 35 yards, Blighted Sever 45 (Wowhead)
    const CONE = Math.PI / 6, REACH_OF = { sever: 35, 'blighted sever': 45, 'soul sever': 45 };
    // (your note, Oct 19: the Severs after a Toxic Deluge are one job, the tanks alternating so each cone pops its own set of
    // orbs. So it's a row per Deluge with its frontals together, and one map that plays every cone in order. A frontal that
    // pops fewer than 5 isn't a mistake when the pair clears the Deluge between them, and players clipped by a purple carrier
    // are counted under Avoidable damage, so neither marks a Deluge down)
    const frontOf = (s, d) => {
      const before = new Map(), after = new Map();
      for (const [g, l] of hist) { let b = 0, a = 0; for (const [tt, st] of l) { if (tt <= s.t - 0.3) b = st; if (tt <= s.t + 3) a = st; } before.set(g, b); after.set(g, a); }
      const gains = [...after].map(([g, a]) => a - before.get(g)).filter((x) => x > 0).sort((a, b) => a - b);
      const popped = gains.length ? gains[Math.floor(gains.length / 2)] : 0, raidMax = Math.max(0, ...after.values());
      const tankG = (dmg(s.n).find((e) => e.t >= s.t - 0.5 && e.t <= s.t + 3 && role(e.dst) === 'tank') || {}).dst;
      const snap = h.snap(s.t), boss = snap.find((p) => p.kind === 'boss' && zj.includes(p.guid)), tk = snap.find((p) => p.guid === tankG);
      const ground = objs(s.t - 0.3, d).filter((o) => o.kind !== 'ghost');
      let hit = [], cone = null;
      if (boss && tk) {
        const dir = Math.atan2(tk.y - boss.y, tk.x - boss.x);
        const ang = (o) => { let a = Math.abs(Math.atan2(o.y - boss.y, o.x - boss.x) - dir); return a > Math.PI ? 2 * Math.PI - a : a; };
        // every orb inside the cone (an orb counts if its edge, ~2 yd, is inside)
        const REACH = REACH_OF[s.n] || 35;
        hit = ground.filter((o) => { const dd = Math.hypot(o.x - boss.x, o.y - boss.y); return dd <= REACH + 2 && (ang(o) <= CONE || dd * Math.sin(ang(o)) <= 2); });
        cone = { x: boss.x, y: boss.y, dir, half: CONE, r: REACH, at: s.t };
      }
      // red: 8 or more at once (or the raid over 12 stacks); amber: off the plan at the end of P1 (the last frontal hits orbs, or the
      // second-to-last pops 5 or more)
      const pf = planFor(s);
      return { s, popped, raidMax, tankG, ground, hit, cone, plan: pf.txt, bad: popped >= (pf.badAt ?? 8) || raidMax > 12, warn: pf.warnAt != null && popped >= pf.warnAt };
    };
    orbSec0.rows = deluges.map((d, i) => {
      const end = deluges[i + 1] ?? (p2 != null && d < p2 ? p2 : dur);
      const picks = carry.filter((c) => c.s >= d && c.s < end), cl = clipped.filter((c) => c.t >= d && c.t < end).length;
      const coll = bursts.find((b) => b.t >= d && b.t < end), left = leftover.some((x) => x.t === end), det = detonations.filter((x) => x.t >= d - 1 && x.t < end);
      const fs = severs.filter((s) => s.t > d && s.t < end).map((s) => frontOf(s, d)), many = fs.length > 1;
      const fBad = fs.some((f) => f.bad), fWarn = !fBad && fs.some((f) => f.warn), raidMax = Math.max(0, ...fs.map((f) => f.raidMax));
      // (purple orbs are Mythic only: Heroic and Normal leave them out)
      const who = mythic ? [pl(picks.length, 'purple pickup') + (picks.length ? ' (' + [...new Set(picks.map((c) => pname(c.g)))].join(', ') + ')' : ''), cl ? pl(cl, 'player') + ' clipped by carriers' : ''].filter(Boolean).join(', ') : '';
      // (Oct 21, plain words: "4, then 6 orbs (aim for 2 to 3, then none)", the frontals in order, instead of "4 + 6 orbs (Sever 1: 4 · Sever 2: 6 · plan: …)")
      const aim = (x) => x.replace(/\s*\(hits empty ground\)/, ', into empty ground');
      const cnt = fs.length ? { txt: fs.map((f) => f.popped).join(', then ') + (fs.length === 1 && fs[0].popped === 1 ? ' orb' : ' orbs'), bad: fBad, warn: fWarn,
        sub: 'aim for ' + (new Set(fs.map((f) => f.plan)).size === 1 ? (!many ? aim(fs[0].plan) : fs[0].plan.includes(' (') ? aim(fs[0].plan).replace(' (', ' each (') : aim(fs[0].plan) + ' each') : fs.map((f) => aim(f.plan)).join(', then ')) + (raidMax > 12 ? ' · the raid ended at ' + raidMax + ' stacks' : '') } : { txt: 'no frontal', dim: true };
      const res = coll ? { txt: 'orbs collided', sub: '+' + coll.gain + ' stacks at once: a purple touched other orbs', bad: true }
        : left ? { txt: 'orb left at the next Deluge', sub: 'it erupted on the raid', bad: true }
        : det.length ? { txt: 'Defilement detonation', sub: '+' + det[0].gain + ' stacks at once: orbs still on the ground', bad: true }
        : fBad ? { txt: 'too many in ' + (() => { const f = fs.find((x) => x.bad), n = f && f.tankG ? pname(f.tankG) : null; return n ? String(n).split('-')[0] + '\'s frontal' : 'one frontal'; })() /* (whose frontal: the tank it was aimed at (Oct 23)) */, bad: true } : fWarn ? { txt: 'a little off the plan', warn: true } : { txt: 'clean' };
      // (one map: every cone of the Deluge, in the order it landed, each popping the orbs it held; it plays from just before
      // the first to just after the last, the orbs on the ground switching to each frontal's own as it comes)
      const fc = fs.filter((f) => f.cone), all = new Map(); for (const f of fs) for (const o of f.ground) if (!all.has(o.guid)) all.set(o.guid, o);
      const tanks = [...new Set(fs.map((f) => f.tankG).filter(Boolean))], last = fs[fs.length - 1];
      const map = fc.length ? { map: { t: last.s.t, from: d, cones: fc.map((f) => ({ ...f.cone, hit: f.hit.map((o) => o.guid) })), segs: fs.map((f) => ({ until: f.s.t + 1, objs: f.ground })),
        hl: tanks, hlLabel: tanks.length > 1 ? 'Tanks the frontals hit' : 'Tank the frontal hit', hitOrbs: fc.flatMap((f) => f.hit.map((o) => o.guid)), extraPts: [...all.values()],
        note: fs.map((f) => '+' + f.popped).join(', then ') + ' Venom Rupture stacks (the raid peaked at ' + raidMax + ')',
        title: 'Deluge #' + (i + 1) + ': ' + fs.map((f, k) => S(f.s.n)[1] + (many ? ' ' + (k + 1) : '') + ' at ' + h.fmtT(f.s.t) + ' popped ' + f.popped).join(', ') + (many ? ' (the cones in order; yellow rings: orbs inside)' : ' (yellow rings: orbs inside)') } } : { txt: '' };
      return [{ txt: 'Deluge #' + (i + 1), sub: who }, { t: d }, cnt, res, map];
    });
    delete orbSec0.groups;
    orbSec0.title = 'Venom orbs (Into the frontals)'; orbSec0.place = 'Venom orbs into the frontals'; orbSec0.mythicOnly = false;
    orbSec0.cols = ['Deluge', 'When', 'Orbs popped', 'Result', ''];
    orbSec0.fix = mythic ? 'Tanks, take turns and point each frontal at its own orbs: about 4 per frontal (the two frontals split each Toxic Deluge\'s 8), never 8 at once. Push Zul\'jan at 11 Venom Rupture stacks or fewer, under stacked raid cooldowns.' : 'Tanks, point each frontal at the orbs on the ground so it clears them.';
    orbSec0.summary = orbSec0.summary + ' Each Toxic Deluge is followed by its frontals, the tanks taking turns so each cone pops its own set of orbs. Each row shows how many orbs each frontal popped (each one is a Venom Rupture stack on everyone) against the plan, and its map plays every cone in order.';
  }
  // Dreadmarch: targets should pixel-stack on the nearest edge marker so ghost spawns are consistent
  const dmRows = [], dmCC = [];
  for (const t of dm) {
    const tg = [...new Set(auras('dreadmarch').filter((e) => e.op === 'apply' && h.isPlayer(e.dst) && e.t >= t - 1 && e.t <= t + 4).map((e) => e.dst))];
    // crowd control that landed on the mind-controlled players (stuns, roots, grips, slows) while they were walking
    const ccE = ev.filter((e) => e.k === 'aura' && e.op === 'apply' && tg.includes(e.dst) && CA_CC.includes(L(e.spell)) && e.t >= t && e.t <= t + 15 && (h.isPlayer(e.src) || (e.own && h.isPlayer(e.own))) && (h.isPlayer(e.src) ? e.src : e.own) !== e.dst);
    dmCC.push([...new Set(ccE.map((e) => e.spell))]);
    const at = h.snap(t + 1).filter((p) => tg.includes(p.guid));
    let spread = 0; for (const a of at) for (const b of at) spread = Math.max(spread, Math.hypot(a.x - b.x, a.y - b.y));
    const gl = objs(t + 12, t).filter((o) => o.kind === 'ghost'), ghosts = gl.length;
    // (one marker spot plus movement and position sampling easily spans ~10 yd, so only a clear split counts)
    /* (Coiled Altar fix 7, Oct 24: in every top kill; the spread and the ghosts stay on the row as facts) */
    if (false) M(t, 'Raid', 'dreadmarch', 'Low', 'Dreadmarch targets were ' + Math.round(spread) + ' yards apart instead of stacked on one marker.', 'If you are targeted, stack on the raid\'s Dreadmarch marker so the ghosts spawn in one clump the frontal can hit.');
    // ghosts spawn where their player stands a moment after the mind control breaks: one far from the clump means
    // someone moved (blink, gateway, port) before it spawned
    let farWho = []; /* (Oct 23: whose ghost spawned far: the Dreadmarch target standing nearest to it a moment after the mind control) */
    if (mythic && gl.length > 2) { const cx = mid(gl.map((o) => o.x)), cy = mid(gl.map((o) => o.y)), far = gl.filter((o) => Math.hypot(o.x - cx, o.y - cy) > 15);
      farWho = far.map((o) => { const ii = inst.find((x) => x.guid === o.guid), sx = ii ? ii.pts[0][1] : o.x, sy = ii ? ii.pts[0][2] : o.y, near = h.snap(ii ? ii.t0 : t + 6).filter((p) => tg.includes(p.guid)); /* (where and when it spawned) */
        const p = near.sort((a, b) => Math.hypot(a.x - sx, a.y - sy) - Math.hypot(b.x - sx, b.y - sy))[0]; return { o, n: p && Math.hypot(p.x - sx, p.y - sy) < 12 ? String(pname(p.guid)).split('-')[0] : null, d: Math.round(Math.hypot(o.x - cx, o.y - cy)) }; });
      if (false) M(t + 6, 'Raid', 'dreadmarch', 'Low', (farWho.every((x) => x.n) ? farWho.map((x) => x.n + '\'s ghost spawned ' + x.d + ' yards').join(', ') + ' from the clump after Dreadmarch.' : pl(far.length, 'ghost') + ' spawned more than 15 yards from the clump after Dreadmarch.'), 'After your mind control breaks, stand still until your ghost spawns, so all ghosts start together in front of the boss.'); }
    dmRows.push([{ t }, { ps: tg.map(pname), none: 'not found' }, { txt: at.length > 1 ? Math.round(spread) + ' yd' : '—' }, farWho.length ? { txt: String(ghosts), sub: farWho.map((x) => (x.n ? x.n + '\'s' : 'one') + ' ' + x.d + ' yd from the clump').join(', ') } : { txt: String(ghosts) },
      { map: { t: t + 4, from: t, hl: tg, hlLabel: 'Dreadmarch targets', title: 'Dreadmarch at ' + h.fmtT(t) + ': targets ringed, ghosts as they spawned' } }]);
  }
  if (dm.length) sections.push({ id: 'dmstack', title: 'Dreadmarch (Stacking)', place: 'Dreadmarch stacking and ghost spawns', spell: S('dreadmarch'),
    verdict: dmRows.some((x) => x[2].bad) ? 'warn' : 'good',
    summary: 'It shows how far apart the Dreadmarch targets stood (the plan is to pixel-stack on the nearest edge marker) and how many ghosts spawned. Open a map to see where the ghosts appeared relative to the frontal.',
    cols: ['When', 'Targets', 'Target spread', 'Ghosts', ''], rows: dmRows });

  // ---- Soul Sever (and P3 Blighted Sever): which ghosts the frontal removed and which it missed ----
  // The log marks every ghost the frontal hit (the frontal's aura lands on it), so removed/missed comes from the
  // log; the map adds the 60 degree cone and each ghost's spawn spot (ghost positions are only logged at spawn).
  const ssRows = [], ghostsAll = inst.filter((i) => i.kind === 'ghost');
  const hitBy = new Map(); // ghost guid -> first time a frontal hit it
  for (const n of ['soul sever', 'blighted sever']) for (const e of auras(n)) if (e.op === 'apply' && !h.isPlayer(e.dst) && !hitBy.has(e.dst)) hitBy.set(e.dst, e.t);
  // Soul Sever only: Blighted Sever (P3) ghost hits aren't reliably logged, and its ghosts' spawn spots don't tell
  // where they were when it landed, so P3 isn't judged here.
  const fronts = ['soul sever'].flatMap((n) => casts(n).map((t0) => { const c = ev.find((e) => e.k === 'cast' && L(e.spell) === n && e.t >= t0 && e.t <= t0 + 8); return { n, t: c ? c.t : t0, src: c && c.src }; })).sort((a, b) => a.t - b.t);
  for (const f of fronts) {
    const lastDm = dm.filter((t) => t <= f.t).pop(); if (lastDm == null) continue;
    // ghosts out: spawned since the last Dreadmarch, not already removed by an earlier frontal, not dead
    const out = ghostsAll.filter((g) => g.t0 >= lastDm - 1 && g.t0 <= f.t && !(hitBy.get(g.guid) < f.t - 0.5) && !(deadAt.get(g.guid) < f.t - 0.5));
    if (!out.length && f.n === 'blighted sever') continue; // P3 frontals with no ghosts out are about orbs
    const tankG = (dmg(f.n).find((e) => e.t >= f.t - 0.5 && e.t <= f.t + 2 && role(e.dst) === 'tank') || {}).dst;
    const snap = h.snap(f.t), boss = snap.find((p) => p.guid === f.src) || snap.find((p) => p.kind === 'boss' && mal.includes(p.guid)), tk = snap.find((p) => p.guid === tankG);
    const cone = boss && tk ? { x: boss.x, y: boss.y, dir: Math.atan2(tk.y - boss.y, tk.x - boss.x), half: Math.PI / 6, r: 45, at: f.t } : null; // Soul Sever: 60 degrees, 45 yards (Wowhead)
    const inCone = (g) => { if (!cone) return false; const x = g.pts[0][1] - cone.x, y = g.pts[0][2] - cone.y, d = Math.hypot(x, y); let a = Math.abs(Math.atan2(y, x) - cone.dir); if (a > Math.PI) a = 2 * Math.PI - a; return d <= cone.r + 2 && a <= cone.half; };
    const logged = (g) => { const ht = hitBy.get(g.guid); return ht != null && ht >= f.t - 0.5 && ht <= f.t + 1.5; };
    // Soul Sever hits are logged on every ghost; Blighted Sever's mostly aren't, so it also counts ghosts whose spawn spot is in the cone (an estimate)
    const est = f.n === 'blighted sever';
    const removed = out.filter((g) => logged(g) || (est && inCone(g))), missed = out.filter((g) => !removed.includes(g));
    const map = { t: f.t, hl: tankG ? [tankG] : [], hlLabel: 'Tank the frontal hit', cone, ghostHit: removed.map((g) => g.guid), ghostMiss: missed.map((g) => g.guid),
      extraPts: out.map((g) => ({ guid: g.guid, name: g.name, x: g.pts[0][1], y: g.pts[0][2], kind: 'ghost' })),
      note: removed.length + ' of ' + out.length + ' ghosts removed' + (missed.length ? ', ' + missed.length + ' missed' : '') + (est ? ' (estimated from spawn spots; Blighted Sever hits on ghosts are not always logged)' : ''),
      title: S(f.n)[1] + ' at ' + h.fmtT(f.t) + ': ghosts at their spawn spots (green ring = removed, red X = missed)' };
    /* (Coiled Altar fix 7, Oct 24: 9 of 11 top kills; a missed ghost is walked back for the next frontal) */
    if (false) MS(f.t, 'Raid', f.n, 'Low', missed.length + ' ghost' + (missed.length === 1 ? ' was' : 's were') + ' not in ' + S(f.n)[1] + ' and stayed alive.', 'Stare at your ghost so it stays put. If it was outside the frontal, walk it back to the stack spot for the next one.', map);
    ssRows.push([{ t: f.t }, { s: S(f.n), sub: est ? 'estimate' : '' }, { txt: String(out.length) }, { txt: String(removed.length) }, { txt: String(missed.length) }, { map }]);
  }
  if (ssRows.length) sections.push({ id: 'soulsever', title: 'Soul Sever (Frontal)', place: 'Soul Sever: ghosts in the frontal', spell: S('soul sever'),
    verdict: ssRows.some((x) => x[4].bad) ? 'bad' : 'good',
    summary: 'For each P2 Soul Sever, it shows how many ghosts it removed and how many it missed (from the log; P3 Blighted Sever isn\'t covered because its ghost hits aren\'t reliably logged). The map shows the 60° cone and where each ghost spawned. Ghosts move after spawning, so a missed ghost may have walked out of a good spawn spot.',
    cols: ['When', 'Frontal', 'Ghosts out', 'Removed', 'Missed', ''], rows: ssRows });

  // ---- maps on existing sections ----
  for (const s of sections) {
    if (s.id === 'ghosts') s.rows.forEach((row, i) => row.push({ map: { t: mrEvents[i].t, hl: [...mrEvents[i].who], bad: [...mrEvents[i].who], badLabel: 'their ghosts touched', title: 'Ghost collision at ' + h.fmtT(mrEvents[i].t) } }));
  }
  const gSec = sections.find((s) => s.id === 'ghosts'); if (gSec && gSec.rows.length) gSec.cols = gSec.cols.concat(['']);
  // ghost collisions also show the ghosts that were out in the 15s before
  for (const s of sections) if (s.id === 'ghosts') for (const row of s.rows) for (const c of row) if (c.map) c.map.from = c.map.t - 15;

  // ---- keep each mechanic's checks together: one panel per mechanic, grouped by its cycle ----
  const take = (id) => { const i = sections.findIndex((s) => s.id === id); return i >= 0 ? sections.splice(i, 1)[0] : null; };
  const worst = (secs) => secs.some((x) => x && x.verdict === 'bad') ? 'bad' : secs.some((x) => x && x.verdict === 'warn') ? 'warn' : 'good';
  const isBad = (row) => row.some((c) => c.bad);
  // Dreadmarch and ghosts: targets and ghost spawns, ghost collisions, mind-control falls and Soul Sever, per Dreadmarch
  {
    const sDm = take('dmstack'), sGh = take('ghosts'), sMc = take('mc'), sSs = take('soulsever');
    const items = [];
    // (the targets go in each set's header; the stacking check stays in Mistakes by player)
    for (const r0 of (sGh ? sGh.rows : [])) items.push({ t: r0[0].t, row: [{ txt: 'Ghost collision', bad: true }, { t: r0[0].t }, { ps: r0[1].ps }, { txt: 'ghosts touched (Malevolent Resonance), ' + h.compact(r0[2].n) + ' damage', bad: true }, r0[3] || { txt: '' }] });
    for (const r0 of (sMc ? sMc.rows : [])) items.push({ t: r0[0].t, row: [{ txt: 'Mind control fall', bad: true }, { t: r0[0].t }, { p: r0[1].p }, { txt: 'died, ' + r0[3].txt, bad: true }, r0[4]] });
    // (Gravebound deaths (Oct 21): a player hit by Soul Sever or a Gloombomb who didn't pick up their soul fragments, up to 30 s after the last Dreadmarch)
    { const lastDm = dm.length ? dm[dm.length - 1] + 30 : -1; for (const d of r.deaths || []) if (/^gravebound$/i.test(String(d.ability || '')) && d.t <= lastDm) items.push({ t: d.t, row: [{ txt: 'Gravebound death', bad: true }, { t: d.t }, { p: d.player }, { txt: 'missed their soul fragments and died', bad: true }, { txt: '' }] }); }
    for (const r0 of (sSs ? sSs.rows : [])) items.push({ t: r0[0].t, row: [{ txt: 'Soul Sever' }, { t: r0[0].t }, { txt: r0[3].txt + ' of ' + r0[2].txt + ' ghosts removed' }, { txt: r0[4].txt + ' missed', dim: true }, r0[5]] }); /* (a missed ghost is walked back for the next frontal (Oct 21): not a mistake) */
    if (dm.length || items.length) {
      const groups = dm.map((t, i) => ({ title: 'Dreadmarch #' + (i + 1), t, from: t - 1, to: (dm[i + 1] ?? dur + 1) - 1, rows: [], tg: sDm && sDm.rows[i] ? sDm.rows[i][1].ps : [] }));
      const other = { title: 'Other', t: 0, rows: [] };
      for (const it of items.sort((a, b) => a.t - b.t)) (groups.find((g) => it.t >= g.from && it.t < g.to) || other).rows.push(it.row);
      if (other.rows.length) groups.push(other);
      for (const g of groups) {
        const nBad = g.rows.filter(isBad).length, nColl = g.rows.filter((r0) => r0[0].txt === 'Ghost collision').length;
        g.bad = nBad > 0;
        // always say whether ghosts collided, even when nothing else happened
        g.sub = (g.tg && g.tg.length ? 'targets ' + g.tg.join(', ') + ' · ' : '') + (nColl ? pl(nColl, 'ghost collision') : 'no ghost collisions') + (nBad - nColl > 0 ? ' · ' + pl(nBad - nColl, 'other problem') : '');
        // crowd control on the mind-controlled players (amber when none landed)
        const di = dm.indexOf(g.t);
        if (di >= 0 && g.tg && g.tg.length) { const cc = dmCC[di] || []; g.sub += ' · ' + (cc.length ? 'CC: ' + cc.join(', ') : 'no CC on the targets'); } /* (no CC isn't a mistake (Oct 21): the cancel macro stops the walk) */
        if (!g.rows.length) g.rows.push([{ txt: 'Clean', dim: true }, { t: g.t }, { txt: '' }, { txt: 'no collisions, falls or missed ghosts', dim: true }, { txt: '' }]);
      }
      sections.push({ id: 'dmghost', title: 'Dreadmarch (Stack, then stand still)', place: 'Dreadmarch (mind control): ghosts and falls', spell: S('dreadmarch'), verdict: items.some((x) => x.row[0].bad) ? 'bad' : 'good', /* (Oct 21: falls, ghost collisions and Gravebound deaths only) */
        summary: 'It shows each Dreadmarch from start to finish: who was targeted and whether they stacked on the marker, where the ghosts spawned, ghosts touching, players mind controlled off the edge, and whether Soul Sever cleaned the ghosts up. Every row has its map.',
        cols: ['What', 'When', 'Who', 'Result', ''], rows: [], groups: groups.filter((g) => g.rows.length) });
    }
  }
  // Tank frontals that hit non-tanks: shown on the frontal's own row (Sever / Blighted Sever under Orbs and
  // frontals, Soul Sever under Dreadmarch and ghosts) instead of a separate panel
  {
    take('front');
    const oSec = sections.find((s) => s.id === 'orbs'), gSec = sections.find((s) => s.id === 'dmghost');
    const rowsOf = (sec) => sec && sec.groups ? sec.groups.flatMap((g) => g.rows.map((row) => ({ g, row }))) : [];
    const loose = [];
    for (const e of front) {
      const n = L(e.spell), who = pname(e.dst) + ' (' + h.compact(e.amt) + ')';
      const hitRow = n === 'soul sever'
        ? rowsOf(gSec).find(({ row }) => row[0].txt === 'Soul Sever' && Math.abs(row[1].t - e.t) <= 2)
        : rowsOf(oSec).find(({ row }) => row[2] && row[2].s && L(row[2].s[1]) === n && Math.abs(row[1].t - e.t) <= 2);
      // (the orbs panel is a row per Deluge, its frontals' cones on one map: a hit goes on the Deluge whose map has its cone, marked on the Result)
      const dRow = n === 'soul sever' || hitRow ? null : (oSec && oSec.rows || []).find((row) => row.some((x) => x.map && (x.map.cones || []).some((c0) => Math.abs(c0.at - e.t) <= 2)));
      if (dRow) { const rc = dRow[3]; rc.hits = (rc.hits || []).concat(who); rc.sub = (rc.sub && !/^hit non-tank/.test(rc.sub) ? rc.sub + ' · ' : '') + 'hit non-tank: ' + rc.hits.join(', '); if (e.soft) { rc.warn = true; if (rc.txt === 'clean') rc.txt = 'a frontal hit a non-tank'; } else rc.bad = true;
        const mc = dRow.find((x) => x.map); mc.map.bad = (mc.map.bad || []).concat(e.dst); mc.map.badLabel = 'non-tank hit by the frontal'; continue; }
      if (!hitRow) { loose.push(e); continue; }
      const c = n === 'soul sever' ? hitRow.row[0] : hitRow.row[2];
      c.hits = (c.hits || []).concat(who); c.sub = 'hit non-tank: ' + c.hits.join(', '); if (e.soft) { c.warn = true; hitRow.g.warn = true; } else { c.bad = true; hitRow.g.bad = true; }
      const mc = hitRow.row.find((x) => x.map); if (mc) { mc.map.bad = (mc.map.bad || []).concat(e.dst); mc.map.badLabel = 'non-tank hit by the frontal'; }
    }
    for (const g of (oSec && oSec.groups || []).concat(gSec && gSec.groups || [])) if (g.rows.some((row) => (row[0].hits || row[2] && row[2].hits)) && !/non-tank/.test(g.sub)) g.sub = g.sub.replace(/, clean$/, ', orbs clean') + ', a frontal hit a non-tank';
    if (front.length && oSec) { const hard = front.some((e) => !e.soft); oSec.verdict = hard ? 'bad' : oSec.verdict === 'bad' ? 'bad' : 'warn'; oSec.summary += ' Frontals that hit a non-tank are marked in ' + (hard ? 'red' : 'yellow') + ' on their row.'; }
    if (loose.length && oSec) oSec.summary += ' ' + pl(loose.length, 'other non-tank frontal hit') + ': ' + loose.map((e) => pname(e.dst) + ' (' + e.spell + ' at ' + h.fmtT(e.t) + ')').join(', ') + '.';
    // (a hit with no row of its own (a Sever before the first Deluge) gets its own row and map, so a death to it shows the cone (your note, Oct 20))
    if (loose.length && oSec && oSec.rows) { for (const e of loose) { const mp = frontMap(e); oSec.rows.push([{ txt: S(L(e.spell))[1], sub: 'no Deluge before it' }, { t: e.t }, { p: pname(e.dst) }, { txt: 'hit a non-tank', sub: h.compact(e.amt), bad: !e.soft, warn: !!e.soft }, mp ? { map: mp } : { txt: '' }]); }
      oSec.rows.sort((a, b) => a[1].t - b[1].t); }
  }
  // Spiritcackle adds: each set with its adds (kick timing, shield, death)
  {
    const sAd = take('adds'), sAx = take('addx');
    if (sAd && sAd.rows.length) { // (no section on pulls that never reached the adds)
      // two panels per set: the kicks (Spiritcackle adds) and the shields (Gloombombs). Add rows keep their shield
      // cell here only so the Gloombomb panel can read it; the kick panel shows first kick and death.
      const shieldOf = [];
      const groups = sAd.rows.map((r0, i) => {
        const t = r0[1].t, mine = (sAx ? sAx.rows : []).filter((x) => x[0].txt === 'Set ' + (i + 1));
        shieldOf[i] = mine.map((x, k) => ({ k: k + 1, t: x[1].t, cell: x[3] }));
        const rows = mine.map((x, k) => [{ txt: 'Soulcoiler ' + (k + 1) }, x[1], x[2], { txt: '' }, x[4]]); // (same numbering as the kick rows)
        // (Mythic: the raid damage the adds' Retaliatory Malice did while they lived, and anyone it killed)
        if (r0.rm && (r0.rm.amt || r0.rm.dead.length)) rows.push([{ txt: 'Retaliatory Malice', sub: 'hits the raid every 3 s while the adds live' }, { t }, { txt: h.compact(r0.rm.amt) + ' on the raid' },
          { txt: '' }, r0.rm.dead.length ? { txt: (r0.rm.dead.length > 4 ? pl(r0.rm.dead.length, 'player') : r0.rm.dead.map((d) => d.player).join(', ')) + ' died', bad: true } : { txt: 'no deaths', dim: true }]);
        return { title: 'Set ' + (i + 1), t, bad: r0[4].bad || rows.some(isBad), warn: r0[4].warn, sub: r0[3].txt + ' kicks, ' + r0[4].txt, rows: rows.length ? rows : [[{ txt: 'no adds seen', dim: true }, { txt: '' }, { txt: '' }, { txt: '' }, { txt: '' }]] };
      });
      // the Gloombomb panel: per set, each add's Spirit Shield, then every bomb, then players clipped by someone's bomb
      const ssEv = auras('spirit shield').filter((e) => !h.isPlayer(e.dst));
      const gGroups = groups.map((g, i) => {
        const setAdds = adds.filter((a) => a.t0 >= g.t - 2 && a.t0 <= g.t + 15);
        const left = (k) => { const a = setAdds[k - 1]; if (!a) return null; const n = ssEv.filter((e) => e.dst === a.g && e.op === 'rdose').length; return Math.max(0, 2 - n); };
        const rows = shieldOf[i].map((x) => [{ txt: 'Soulcoiler ' + x.k + ' shield' }, { t: x.t }, { txt: '' }, { ...x.cell, txt: 'Spirit Shield ' + x.cell.txt + (!/^broken/.test(x.cell.txt) && left(x.k) != null ? ' (' + left(x.k) + ' of 2 stacks left)' : '') }, { txt: '' }]);
        // amber: clipped by someone else's Gloombomb (they had to collect souls); red if they died from it
        for (const e of gbClip.filter((e) => e.t >= g.t && e.t < (groups[i + 1] ? groups[i + 1].t : dur + 1))) { const dd = r.deaths.find((d) => d.guid === e.dst && d.t >= e.t && d.t <= e.t + 16 && /^gravebound$/i.test(String(d.ability || '')));
          rows.push([{ txt: 'Gloombomb clip', bad: !!dd, dim: !dd }, { t: e.t }, { p: pname(e.dst) }, { txt: 'hit by another Gloombomb' + (dd ? ', died' : ''), bad: !!dd, dim: !dd },
            { map: { t: e.t, gloom: true, hl: [e.dst], hlLabel: 'player clipped', title: 'Gloombomb at ' + h.fmtT(e.t) + ': ' + pname(e.dst) + ' was inside someone else\'s 15 yd circle' } }]); }
        const sh = shieldOf[i].map((x) => 'Soulcoiler ' + x.k + ' ' + (/^broken/.test(x.cell.txt) ? 'broken' : 'not broken'));
        return { title: g.title, t: g.t, rows, bad: rows.some(isBad), warn: rows.some((row) => row.some((c) => c.warn)), sub: sh.join(', ') || 'no adds seen' };
      });
      // ---- Gloombombs: whose bomb landed on which add ----
      // Each Spiteful Soulcoiler spawns with 2 Spirit Shield stacks; every Gloombomb that explodes on it (15 yd)
      // removes one. Malacrass puts Gloombomb on 2 melee and 2 ranged players: the melee pair drops on the melee
      // (unmarked) add, the ranged pair on the ranged (marked) add. Checked per bomb: did it land on one of this set's
      // adds, on a leftover add from an earlier set (wasted), or on nothing; the shield stacks the log shows coming off
      // confirm it. (Melee or ranged comes from the spec; healers aren't judged on which add.)
      if (mythic) {
        const MELEE_SPEC = new Set([71, 72, 73, 70, 66, 250, 251, 252, 259, 260, 261, 268, 269, 577, 581, 103, 104, 263, 255]);
        const roleOf = (g) => { const p = r.players.get(g); if (!p || !p.specId || p.role === 'healer') return null; return MELEE_SPEC.has(p.specId) ? 'melee' : 'ranged'; };
        const posOf = (g, t) => { const u = r.positions && r.positions.get(g); let b = null; if (u) for (const p of u.pts) { if (p[0] > t + 0.4) break; b = p; } return b && t - b[0] < 3 ? b : null; };
        const SS = auras('spirit shield').filter((e) => !h.isPlayer(e.dst));
        const gbOn = auras('gloombomb').filter((e) => h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
        const waves = [];
        for (const e of gbOn.filter((x) => x.op === 'apply')) { const w = waves[waves.length - 1]; if (w && e.t - w.t < 1) w.who.push(e.dst); else waves.push({ t: e.t, who: [e.dst] }); }
        const setI = (t) => { let k = -1; groups.forEach((g, i) => { if (t >= g.t - 1) k = i; }); return k; };
        for (const w of waves) {
          const k = setI(w.t); if (k < 0) continue;
          const g = gGroups[k], mineAdds = adds.filter((a) => a.t0 >= g.t - 2 && a.t0 <= g.t + 15);
          const boom = (c) => { const rm = gbOn.find((e) => e.dst === c && e.op === 'remove' && e.t >= w.t && e.t <= w.t + 7); return rm ? rm.t : w.t + 5; };
          const te = Math.max(...w.who.map(boom));
          const alive = adds.filter((a) => a.t0 <= te && (a.died == null || a.died >= te - 0.2));
          if (!alive.length) {
            // no adds up (P3): nothing to break, the bombs just need room. One map for the whole wave (your note, Oct 18),
            // then a row per bomb
            g.rows.push([{ txt: allN(w.who.length, 'bomb'), sub: 'the whole wave, on one map', dim: true }, { t: te }, { txt: '' }, { txt: '' },
              { map: { t: te, gloom: true, hl: [...w.who], hlLabel: 'had a Gloombomb', title: 'Gloombombs at ' + h.fmtT(te) + ' (no adds up): all ' + pl(w.who.length, 'bomb') + '\'s 15 yd explosion circles' } }]);
            for (const c of w.who) g.rows.push([{ txt: 'Gloombomb' }, { t: boom(c) }, { p: pname(c), sub: roleOf(c) || (r.players.get(c) || {}).role || '' }, { txt: 'no adds up: spread out' }, { txt: '' }]);
            continue;
          }
          const lost = (a) => SS.filter((e) => e.dst === a.g && (e.op === 'rdose' || e.op === 'remove') && Math.abs(e.t - te) <= 0.6).length;
          const tag = (a) => { const mine = mineAdds.includes(a); const n = mine ? mineAdds.indexOf(a) + 1 : null; const mk = markerAt(r, a.g, te) > 0; return { mine, mk, label: mine ? 'Soulcoiler ' + n + ' (' + (mk ? 'marked' : 'unmarked') + ')' : 'a leftover add from set ' + (groups.findIndex((x) => a.t0 >= x.t - 2 && a.t0 <= x.t + 15) + 1) }; };
          // (the last set of a phase: its shields don't need breaking (they break at the transition, and kicks are enough at the
          // end of P3), so a bomb that misses its adds isn't a failure there, as the shield rows already say (scan, Oct 19))
          const endSet = !(groups[k + 1] && phaseAt(groups[k + 1].t) === phaseAt(groups[k].t));
          const res = w.who.map((c) => {
            const pp = posOf(c, te); if (!pp) return { c, a: null, d: null };
            let best = null, bd = Infinity; for (const a of alive) { const ap = posOf(a.g, te); if (!ap) continue; const d = Math.hypot(ap[1] - pp[1], ap[2] - pp[2]); if (d < bd) { bd = d; best = a; } }
            return { c, a: bd <= 17 ? best : null, d: bd < Infinity ? Math.round(bd) : null, near: best };
          });
          // the shield stacks the log shows coming off are the truth: an add that lost more stacks than the bombs
          // credited to it was hit by the nearest other carriers (positions are sampled, so a bomb at the edge can
          // read a few yards long)
          for (const a of alive) {
            let need = lost(a) - res.filter((y) => y.a === a).length;
            const cand = res.filter((y) => !y.a && y.c).map((y) => { const pp = posOf(y.c, te), ap = posOf(a.g, te); return { y, d: pp && ap ? Math.hypot(ap[1] - pp[1], ap[2] - pp[2]) : Infinity }; }).filter((x) => x.d <= 26).sort((p, q) => p.d - q.d);
            for (const x of cand) { if (need <= 0) break; x.y.a = a; x.y.d = Math.round(x.d); need--; }
          }
          const stacks = mineAdds.map((a) => lost(a)).reduce((s, x) => s + x, 0);
          // one map for the whole wave (your note, Oct 18), on its own row above the bombs: every carrier's 15 yd circle
          // (all the same mint look) bursting on the adds; a bomb that missed or was wasted keeps its own map below
          const gbMap = (hl, hlLabel, title) => ({ map: { t: te, gloom: true, hl, hlLabel, good: res.filter((y) => y.a && tag(y.a).mine).map((y) => y.c), goodLabel: 'bomb landed on this set\'s add', bad: res.filter((y) => !y.a || !tag(y.a).mine).map((y) => y.c), badLabel: 'bomb missed, or hit a leftover add',
            extraPts: alive.map((a) => { const p = posOf(a.g, te); return p ? { guid: a.g, name: 'Spiteful Soulcoiler', x: p[1], y: p[2], kind: 'add' } : null; }).filter(Boolean), title } });
          g.rows.push([{ txt: allN(res.length, 'bomb'), sub: 'the whole wave, on one map', dim: true }, { t: te }, { txt: '' }, { txt: '' },
            gbMap(res.map((y) => y.c), 'had a Gloombomb', 'Gloombombs at ' + h.fmtT(te) + ' (set ' + (k + 1) + '): all ' + pl(res.length, 'bomb') + ', the 15 yd explosion circles')]);
          for (const x of res) {
            const role = roleOf(x.c), tg = x.a ? tag(x.a) : null;
            // melee belongs on the unmarked add (only judged when the raid marked one of this set's adds)
            const wrongAdd = false; /* (Coiled Altar fix 8, Oct 24: guilds mark different adds (2 of 11 top kills mark the melee one), so which add isn't judged; missing the adds is) */
            let what, bad = false, warn = false;
            if (!x.a) { what = x.d != null ? 'missed the adds (' + x.d + ' yd from the nearest)' + (endSet ? ', fine on the last set of the phase' : '') : 'no position logged'; bad = x.d != null && !endSet; if (bad) M(te, pname(x.c), 'gloombomb', 'Medium', 'Their Gloombomb didn\'t land on an add in set ' + (k + 1) + ' (' + x.d + ' yd from the nearest Soulcoiler), so it didn\'t take a Spirit Shield stack off.', 'Take your Gloombomb to your add before it explodes. Melee take theirs to the unmarked add and ranged to the marked one, overlapping with your partner.'); }
            else if (!tg.mine) { what = 'landed on ' + tg.label + ' (wasted)'; warn = true; M(te, pname(x.c), 'gloombomb', 'Low', 'Their Gloombomb in set ' + (k + 1) + ' landed on a leftover add from an earlier set instead of this set\'s.', 'Drop it on this set\'s adds. Kill leftovers before the next set.'); }
            else { what = 'hit ' + tg.label + (wrongAdd ? ', but ' + role + ' bombs go on the ' + (role === 'melee' ? 'unmarked' : 'marked') + ' add' : ''); warn = !!wrongAdd; if (wrongAdd) M(te, pname(x.c), 'gloombomb', 'Low', 'Dropped their Gloombomb on the ' + (tg.mk ? 'marked' : 'unmarked') + ' add in set ' + (k + 1) + ' as a ' + role + ' player.', 'Melee Gloombombs go on the unmarked (melee) add, ranged on the marked (ranged) add, so each add gets its pair.'); }
            g.rows.push([{ txt: 'Gloombomb' }, { t: te }, { p: pname(x.c), sub: role || (r.players.get(x.c) || {}).role || '' }, { txt: what, bad, warn },
              bad || warn ? gbMap([x.c], pname(x.c) + '\'s Gloombomb', pname(x.c) + '\'s Gloombomb at ' + h.fmtT(boom(x.c)) + ' (set ' + (k + 1) + '): the 15 yd explosion circles of this set') : { txt: '' }]);
          }
          const onMine = res.filter((y) => y.a && tag(y.a).mine).length;
          g.gb = (g.gb || []).concat([{ on: onMine, n: res.length, stacks }]);
          if (!endSet && onMine < Math.min(res.length, 2 * mineAdds.length) && res.length) g.warn = true;
        }
        for (const g of gGroups) if (g.gb) g.sub = 'Gloombombs: ' + g.gb.map((x) => x.on + ' of ' + x.n + ' on this set\'s adds').join(', then ') + ' · ' + g.sub;
        for (const g of gGroups) { g.bad = g.bad || g.rows.some(isBad); g.warn = g.warn || g.rows.some((row) => row.some((c) => c.warn)); }
      }
      sections.push({ id: 'addsets', title: 'Soulcoiler adds (Kick and kill)', place: 'Spiritcackle (fear adds): kicks', spell: S('spiritcackle'), verdict: groups.some((g) => g.bad) ? 'bad' : groups.some((g) => g.warn) ? 'warn' : 'good',
        summary: pl(groups.length, 'add set') + '. Each set shows its adds (first kick against the Gloombomb cast, and when it died), then every Wail of Terror and who kicked it, or that it got off.',
        cols: ['Add', 'Spawned', 'First kick', '', 'Died'], rows: [], groups });
      if (mythic) sections.push({ id: 'gloom', title: 'Gloombombs (Drop them on the adds)', place: 'Gloombombs (player bombs): breaking the Spirit Shields', spell: S('gloombomb'), mythicOnly: true,
        verdict: gGroups.some((g) => g.bad) ? 'bad' : gGroups.some((g) => g.warn) ? 'warn' : 'good',
        summary: 'For each set, it shows whether each add\'s Spirit Shield broke, then whose Gloombomb landed on which add (or missed, or was wasted on a leftover add), and anyone clipped by someone else\'s bomb.',
        cols: ['What', 'When', 'Who', 'Result', ''], rows: [], groups: gGroups });
    }
  }
  const fill = (mp) => { mp.pts = h.snap(mp.t).concat(mp.extraPts || (mp.from != null ? objs(mp.t, mp.from) : [])); orbRings(mp); };
  for (const s of sections) for (const row of s.rows.concat(...(s.groups || []).map((g) => g.rows))) for (const c of row) { if (c.map) fill(c.map); if (c.maps) for (const [, mp] of c.maps) fill(mp); }
  // every positional mistake gets a map of that moment (player ringed, orbs and ghosts from the 15s before)
  const POSM = new Set(['sever', 'soul sever', 'blighted sever', 'mutagenic venom', 'venom rupture', 'virulent mutation', 'guillotine', 'grim guillotine', 'malevolent resonance', 'gloombomb', 'dreadmarch', 'reclaim essence']);
  const gOf = new Map([...r.players.values()].map((p) => [p.name, p.guid]));
  for (const x of mistakes) {
    if (!x.map && POSM.has(L(x.mechanic))) x.map = { t: x.t, gloom: L(x.mechanic) === 'gloombomb', hl: gOf.has(x.player) ? [gOf.get(x.player)] : [], bad: gOf.has(x.player) ? [gOf.get(x.player)] : [], badLabel: 'made this mistake', title: x.mechanic + ' at ' + h.fmtT(x.t) + (gOf.has(x.player) ? ' (' + x.player + ' ringed)' : '') };
    if (x.map && !x.map.pts) { x.map.pts = h.snap(x.map.t).concat(objs(x.map.t, x.map.from ?? x.map.t - 15)); orbRings(x.map); }
  }
  const order = ['push', 'front', 'orbs', 'tankfront', 'sever', 'soaks', 'soakq', 'ghosts', 'dmstack', 'mc', 'adds', 'addx', 'shield', 'inter', 'vf'];
  sections.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  // Data check: how many events of each tracked spell this pull contained, to confirm names and IDs match.
  const diag = Object.keys(CA_IDS).map((n) => {
    const c = { cast: 0, dmg: 0, aura: 0, other: 0 };
    for (const x of ev) if (L(x.spell) === n) { if (x.k === 'cast' || x.k === 'start') c.cast++; else if (x.k === 'dmg') c.dmg++; else if (x.k === 'aura') c.aura++; else c.other++; }
    return { name: S(n)[1], id: CA_IDS[n], ...c, total: c.cast + c.dmg + c.aura + c.other };
  });
  const reached = phases[phases.length - 1].name;
  // for the NSRT check: each drop's soakers, its target, and the externals / Zephyr cast for it
  const _soaks = soaks.map((s) => {
    const hit = s.hit ?? s.t + 3;
    const tgt = ev.filter((e) => e.k === 'aura' && e.op === 'apply' && L(e.spell) === s.n && h.isPlayer(e.dst) && e.t <= hit && e.t >= hit - 12).map((e) => e.dst)[0] || null;
    const ext = tgt ? ev.filter((e) => e.k === 'aura' && e.op === 'apply' && e.dst === tgt && EXTERNAL.includes(L(e.spell)) && L(e.spell) !== 'zephyr' && h.isPlayer(e.src) && e.src !== tgt && e.t >= hit - 12 && e.t <= hit + 0.5).map((e) => ({ who: pname(e.src), spell: e.spell, id: e.id })) : [];
    const zep = ev.filter((e) => e.k === 'pcast' && L(e.spell) === 'zephyr' && e.t >= hit - 12 && e.t <= hit + 1).map((e) => pname(e.src));
    // Zephyr (2 min cooldown) used shortly before this soak's window: it was still on cooldown for it
    const zepEarly = ev.filter((e) => e.k === 'pcast' && L(e.spell) === 'zephyr' && e.t >= hit - 120 && e.t < hit - 12).map((e) => ({ who: pname(e.src), t: e.t }));
    // the target protecting themselves (e.g. a paladin target's own Blessing of Protection or Divine Shield)
    const selfEv = tgt ? ev.filter((e) => e.k === 'aura' && e.op === 'apply' && e.dst === tgt && e.src === tgt && (EXTERNAL.includes(L(e.spell)) || IMMUNE.includes(L(e.spell))) && L(e.spell) !== 'zephyr' && e.t >= hit - 12 && e.t <= hit + 0.5) : [];
    const selfProt = selfEv.map((e) => e.spell), selfIds = selfEv.map((e) => e.id); // (the IDs are for spell icons)
    return { t: s.t, hit, grim: s.n === 'grim guillotine', landed: s.landed, who: s.who.map(pname), target: tgt ? pname(tgt) : null, ext, zep, zepEarly, selfProt, selfIds };
  });
  // for the NSRT mind-control check: each Dreadmarch, who it mind controlled and for how long (the first wave lands about
  // half a second after the cast; later single re-controls before the next cast are kept apart), and the crowd control
  // that landed on them (a pet's or totem's counts for its player). Ring of Peace leaves nothing on its targets, so a cast
  // from shortly before the mind control until it ends counts.
  const dmAll = auras('dreadmarch').filter((e) => h.isPlayer(e.dst) && (e.op === 'apply' || e.op === 'remove'));
  const ccBy = (e) => (h.isPlayer(e.src) ? e.src : e.own && h.isPlayer(e.own) ? e.own : null);
  const _dm = dm.map((t, i) => {
    const nx = dm[i + 1] ?? dur + 1;
    const mc = dmAll.filter((e) => e.op === 'apply' && e.t >= t - 1 && e.t < nx - 1).map((e) => {
      const off = dmAll.find((x) => x.op === 'remove' && x.dst === e.dst && x.t >= e.t), end = off ? off.t : Math.min(nx, dur);
      // (a player who dies mind controlled keeps the aura until the pull ends: their mind control ends at the death)
      const death = r.deaths.find((x) => x.guid === e.dst && x.t >= e.t && x.t < end + 0.5);
      return { g: e.dst, n: pname(e.dst), s: e.t, e: death ? Math.min(end, death.t) : end, died: !!death, main: e.t <= t + 4 };
    });
    // one entry per CC (an AoE stun on three mind-controlled players is one CC, listing who it held)
    const cc = [], addCC = (t1, who, spell, id, on, isMain) => {
      const same = cc.find((c) => c.who === who && c.spell === spell && Math.abs(c.t - t1) < 1 && c.main === isMain);
      if (same) { if (on && !same.on.includes(on)) same.on.push(on); return; }
      cc.push({ t: t1, who, spell, id, on: on ? [on] : [], main: isMain });
    };
    for (const m of mc) for (const e of ev) {
      if (e.k !== 'aura' || e.op !== 'apply' || e.dst !== m.g || e.t < m.s - 0.2 || e.t > m.e + 0.2 || !CA_CC.includes(L(e.spell))) continue;
      const by = ccBy(e); if (by && by !== m.g) addCC(e.t, pname(by), e.spell, e.id, m.n, m.main);
    }
    const main = mc.filter((m) => m.main), s0 = main.length ? Math.min(...main.map((m) => m.s)) : t, e0 = main.length ? Math.max(...main.map((m) => m.e)) : t;
    for (const e of ev) if (e.k === 'pcast' && CA_ZONE.includes(L(e.spell)) && e.t >= s0 - 3 && e.t <= e0 && !main.some((m) => m.g === e.src)) addCC(e.t, pname(e.src), e.spell, e.id, null, true);
    cc.sort((a, b) => a.t - b.t);
    return { n: i + 1, t, ph: phaseAt(t), s: s0, e: e0, mc: mc.map(({ g, ...x }) => x), cc };
  });
  // for the NSRT curse check: each set of Spiteful Soulcoilers, whether each add carried a raid marker, and the curses on it
  const _addSets = sc.map((t, i) => ({ n: i + 1, t, ph: phaseAt(t), adds: adds.filter((a) => a.t0 >= t - 2 && a.t0 <= t + 15).map((a) => ({
    marked: (r.marks && r.marks.get(a.g) || []).length > 0, t0: a.t0, died: a.died ?? null,
    curses: ev.filter((e) => e.k === 'aura' && e.op === 'apply' && e.dst === a.g && CA_CURSE.includes(L(e.spell)) && ccBy(e)).map((e) => ({ t: e.t, who: pname(ccBy(e)), spell: e.spell, id: e.id })),
  })) }));
  const _carriers = [...carriers];
  const _carrierT = {}; for (const c of carry) { const n = pname(c.g); if (_carrierT[n] == null) _carrierT[n] = c.s; } // first purple pickup per player (for the NSRT orb list)
  // every orb pickup (a purple is Mutagenic Venom landing on a player, a green is Volatile Venom) for the NSRT orb check
  const _orbPicks = { purple: carry.map((c) => ({ n: pname(c.g), t: c.s, e: c.e })), green: [...vvWin].flatMap(([g, ws]) => ws.map((w) => ({ n: pname(g), t: w[0], e: w[1] }))).sort((a, b) => a.t - b.t) };
  // for the NSRT ghost-soak check: the intermission, fragments that reached Zul'jan, and the raid's Spirit Erasure peak
  const _inter = inter != null ? { s: inter, e: p3 ?? dur, reclaim, peak: rounds.reduce((a, x) => Math.max(a, x.peak), 0), rounds: rounds.length } : null;
  // (the Performance tab's damage windows: each Eternal Nightfall shield until it broke, and the Soulbinding intermission)
  const windows = _shields.map((s) => ({ label: 'Nightfall shield ' + s.n, short: 'Shield ' + s.n, t0: s.t, t1: s.brokeAt != null ? s.brokeAt : s.t + s.secs }))
    .concat(_inter ? [{ label: 'Soulbinding intermission', short: 'Intermission', t0: _inter.s, t1: _inter.e }] : []).sort((a, b) => a.t0 - b.t0);
  return { _soaks, _carriers, _carrierT, _orbPicks, _dm, _addSets, _inter, _shields, diag, windows, title: (mythic ? 'Mythic' : r.item.diff) + ' audit: The Coiled Altar', reached, phases, marks, sections: sections.filter((s) => mythic || !s.mythicOnly), mistakes,
    note: mythic ? '' : 'Mythic-only checks (purple orbs, hidden ghosts) are hidden on this difficulty.' };
}

// ---------- Ula'tek (final boss), Heroic and Mythic ----------
// Phases: Stage 1 until the Doomscale Eggs start Hatching Doom; Stage 2 until the intermission's Call of the Serpent; the
// platform shatters into Stage 3 about 5 seconds before Stage 3's first Call of the Serpent (the log has no event for
// it; this matches Warcraft Logs' split within a second). Everything is matched by spell ID (UL above).
function buildUlatek(ev, r, h) {
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's'), diff = r.item.diff, mythic = diff === 'Mythic', hcUp = mythic || diff === 'Heroic';
  const S = (n) => [UL_N[n] || 0, n.split(' ').map((w, i) => (i && (w === 'of' || w === 'the') ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ')];
  const pname = (g) => h.name(g), role = (g) => h.role(g), dur = r.duration, T = (t) => h.fmtT(t), ids = (x) => [].concat(x);
  const mistakes = [], sections = [];
  const M = (t, player, mech, id, severity, detail, fix, extra) => mistakes.push({ t, player, mechanic: mech, id, severity, detail, fix, ...(extra || {}) });
  // boss casts by ID: a cast with a cast bar logs a start and a success; counted once, at the start
  const castsOf = (x) => { const want = ids(x), st = ev.filter((e) => e.k === 'start' && want.includes(e.id)).map((e) => e.t);
    const dn = ev.filter((e) => e.k === 'cast' && want.includes(e.id)).map((e) => e.t).filter((t) => !st.some((s) => t >= s && t - s <= 9));
    return st.concat(dn).sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 3); };
  // one unit's casts of a spell, each counted once at its start (a landing within 9 s of a start is the same cast: a
  // 4-second cast bar used to count twice)
  const unitCasts = (list, g) => { const mine = list.filter((e) => e.src === g), st = mine.filter((e) => e.k === 'start').map((e) => e.t);
    const dn = mine.filter((e) => e.k === 'cast').map((e) => e.t).filter((t) => !st.some((s) => t >= s && t - s <= 9));
    return st.concat(dn).sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 3); };
  const landOf = (x, t) => (ev.find((e) => e.k === 'cast' && ids(x).includes(e.id) && e.t >= t && e.t <= t + 10) || { t }).t;
  const dmgId = (x) => ev.filter((e) => e.k === 'dmg' && ids(x).includes(e.id) && h.isPlayer(e.dst)).sort((a, b) => a.t - b.t);
  const auraId = (x, op) => ev.filter((e) => e.k === 'aura' && ids(x).includes(e.id) && (!op || e.op === op)).sort((a, b) => a.t - b.t);
  const deathOf = (g) => (ev.find((e) => e.k === 'die' && e.guid === g) || {}).t ?? null;
  const unitsNamed = (re) => [...r.firstSeen].filter(([g]) => re.test(h.unitName(g) || '')).map(([g, t0]) => ({ g, t0, died: deathOf(g) })).sort((a, b) => a.t0 - b.t0);
  const snap = (t) => (h.snap ? h.snap(t) : []);
  // (everyone's position at t, in between log samples rather than the last one: Warcraft Logs positions can be a couple of
  // seconds old, which matters for a 3-yard mechanic)
  const posPts = (t, extra) => (h.frames ? (h.frames(t, t, 0.2, extra || [])[0] || { pts: [] }).pts : snap(t));
  const andList = (l) => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1]);
  // (a map's "Zoom to mechanic" frame: the middle of these units, r yards around it)
  const ctrOf = (pts, gs, r) => { const q = pts.filter((p) => gs.includes(p.guid)); return q.length ? { x: q.reduce((s, p) => s + p.x, 0) / q.length, y: q.reduce((s, p) => s + p.y, 0) / q.length, r } : null; };
  // a player's stacks of an aura over time (apply 1, dose / rdose the new count, remove 0)
  const stackAt = (hist, g, t) => { let v = 0; for (const [tt, s] of hist.get(g) || []) { if (tt > t) break; v = s; } return v; };
  const stackHist = (id) => { const m = new Map(); for (const e of auraId(id)) { if (!h.isPlayer(e.dst)) continue; let l = m.get(e.dst); if (!l) m.set(e.dst, l = []); l.push([e.t, e.op === 'remove' ? 0 : e.op === 'apply' ? Math.max(1, e.stacks || 1) : e.stacks || 0]); } return m; };
  const maxIn = (hist, g, a, b) => { let v = 0, cur = 0; for (const [t, s] of hist.get(g) || []) { if (t > b) break; cur = s; if (t >= a) v = Math.max(v, s); } return Math.max(v, (hist.get(g) || []).filter(([t]) => t < a).slice(-1).map(([, s]) => s)[0] || 0); };

  // ---- phases ----
  const hatch = castsOf(UL.hatching), cots = castsOf(UL.cots);
  const p2 = hatch.length ? hatch[0] : null, it = p2 != null ? cots.find((t) => t > p2 + 30) ?? null : null;
  const p3n = it != null ? cots.find((t) => t > it + 20) : null, p3 = p3n != null ? Math.max(it + 1, p3n - 5) : null;
  const phases = [{ name: 'P1 Serpent Mother', start: 0, end: p2 ?? dur }];
  if (p2 != null) phases.push({ name: 'P2 Doomscale', start: p2, end: it ?? dur });
  if (it != null) phases.push({ name: 'Intermission', start: it, end: p3 ?? dur });
  if (p3 != null) phases.push({ name: 'P3 Ascension', start: p3, end: dur });
  const phaseAt = (t) => { let n = phases[0].name; for (const p of phases) if (t >= p.start) n = p.name; return n.split(' ')[0]; };

  // ---- timeline marks ----
  const marks = [];
  const info = (x, t, hitIds) => { const land = landOf(x, t), who = [...new Set(ev.filter((e) => ((e.k === 'aura' && e.op === 'apply') || e.k === 'dmg') && ids(hitIds || x).includes(e.id) && h.isPlayer(e.dst) && e.t >= land - 0.5 && e.t <= land + 3).map((e) => e.dst))];
    const raid = who.length >= Math.max(6, r.players.size * 0.5); return { land, who: raid ? [] : who.slice(0, 8).map(pname), raid, hits: who.length }; };
  for (const [x, label, kind, hit] of [[UL.cots, 'Call of the Serpent', 'add'], [UL.incub, 'Toxic Incubation', 'soak', UL.incubHit], [UL.wrath, "Mother's Wrath", 'target', UL.wrathHit], [UL.coil, 'Spectral Coils', 'soak', UL.coilHit],
    [UL.waveBig, 'Caustic Waves', 'front', UL.wave], [UL.thrash, 'Mephitic Thrash', 'raid'], [UL.rage, 'Rage of the Shackled', 'phase'], [UL.fangsCast, 'Grasping Fangs', 'target', UL.fangs], [UL.biteCast, "Serpent's Bite", 'target', UL.bite], [UL.prey, 'Circling Prey', 'raid']])
    for (const t of castsOf(x)) marks.push({ t, label, id: ids(x)[0], kind, ...info(x, t, hit) });

  // ---- 1. eggs: every Blightscale Viper, who had the egg and what broke it ----
  const shells = auraId([UL.malShell, UL.noxShell]).filter((e) => h.isPlayer(e.dst));
  const carry = []; for (const e of shells) if (e.op === 'apply') carry.push({ g: e.dst, s: e.t, e: null });
  for (const e of shells) if (e.op === 'remove') { const c = carry.filter((x) => x.g === e.dst && x.s <= e.t + 0.05 && x.e == null).pop(); if (c) c.e = e.t; }
  for (const c of carry) if (c.e == null) c.e = dur;
  // (an egg popped by a Spectral Coil its carrier soaked hatches a Rawling, which is the plan: never the source of a Viper)
  const coilHitOn = dmgId(UL.coilHit), coilPop = (c) => coilHitOn.some((e) => e.dst === c.g && Math.abs(e.t - c.e) <= 0.3);
  for (const c of carry) c.pop = c.e < dur && coilPop(c);
  const splashes = dmgId(UL.splash), greens = dmgId([UL.wave, UL.thrash, UL.incubHit, UL.fester]);
  const vipers = unitsNamed(/^Blightscale Viper$/), used = new Set(), eggRows = [];
  // (who held an egg when, for the maps (your note, Oct 18): a small green ring on each carrier from the moment they picked
  // it up until it came off, so a map shows who had an egg while a mechanic hit)
  const eggC = mcol('Noxious Shell'), eggRings = (a, b) => carry.filter((c) => c.s < b && c.e > a).map((c) => ({ guid: c.g, r: 2, t0: c.s, dur: Math.max(0.3, c.e - c.s), label: '', color: eggC.color, fill: 'rgba(58,242,168,.28)', fx: 'debuff', cn: 'Small green ring', legend: 'carrying an egg' }));
  // (a Viper hatches within about half a second of its egg breaking: the nearest shell that came off in the second before,
  // or a carrier who died holding one; anything else was an egg on the ground or one the log doesn't tie to a player)
  for (const v of vipers) {
    let c = carry.filter((x) => !used.has(x) && !x.pop && x.e <= v.t0 + 0.3 && x.e >= v.t0 - 1).sort((a, b) => Math.abs(v.t0 - a.e) - Math.abs(v.t0 - b.e))[0];
    if (!c) { const d = r.deaths.find((x) => x.t <= v.t0 + 0.3 && x.t >= v.t0 - 1 && carry.some((y) => !used.has(y) && y.g === x.guid && y.s <= x.t && y.e >= x.t - 0.1)); if (d) c = carry.find((y) => !used.has(y) && y.g === d.guid && y.s <= d.t && y.e >= d.t - 0.1); }
    let cause, fix, g = null, splashG = null, grE = null;
    if (c) { used.add(c); g = c.g;
      const died = r.deaths.find((d) => d.guid === c.g && d.t >= c.s && d.t <= Math.min(c.e, v.t0) + 0.6 && d.t >= v.t0 - 1.3), sp = splashes.find((e) => e.dst === c.g && Math.abs(e.t - c.e) <= 0.6), gr = greens.filter((e) => e.dst === c.g && e.t >= c.e - 0.7 && e.t <= c.e + 0.2).pop();
      if (!sp && !died) grE = gr || null;
      if (sp) { splashG = [...new Set(splashes.filter((e) => Math.abs(e.t - sp.t) <= 0.4 && e.dst !== c.g).map((e) => e.dst))]; const other = splashG.map(pname);
        cause = 'Noxious Splash' + (other.length ? ', within 3 yards of ' + other.join(' and ') : ''); fix = 'Carriers keep their own lanes and never come within 3 yards of each other.'; }
      else if (died) { cause = 'died carrying it'; fix = 'An egg breaks into a Viper when its carrier dies. Carriers should get defensives and healing, and pass on the egg if they\'re low.'; }
      else if (gr) { cause = 'hit by ' + gr.spell; fix = 'Keep eggs away from anything green. Dodge the waves, and only take an egg into a Spectral Coil that is meant to pop it.'; }
      else { cause = 'broke in their hands'; fix = 'Anything green touching an egg or its carrier breaks it into a Viper.'; }
    } else { cause = 'an egg on the ground'; fix = 'Pick up every egg after Call of the Serpent. One left on the ground breaks into a Viper when a wave or a Coil hits it.'; }
    if (c) c.viper = { t: v.t0, cause };
    M(v.t0, g ? pname(g) : 'Raid', 'Viper hatched', mythic ? UL.noxShell : UL.malShell, 'High', 'A Blightscale Viper hatched at ' + T(v.t0) + (g ? ' from ' + pname(g) + '\'s egg (' + cause + ').' : ' from an egg on the ground, or one the log doesn\'t tie to a carrier.'), fix);
    // (a Viper from a carried egg is that egg's line in its egg phase below; one from an egg on the ground stays up here)
    (c ? (vr) => { c.vrow = vr; } : (vr) => eggRows.push(vr))([{ t: v.t0 }, g ? { p: pname(g) } : { txt: 'nobody', dim: true }, { txt: cause, bad: true }, { txt: v.died != null ? 'killed ' + Math.round(v.died - v.t0) + 's later' : 'still up', dim: v.died != null },
      // (a Noxious Splash: the carriers who came within 3 yards of each other, each with their 3-yard circle, a moment before
      // it went off; any other Viper: who had the egg)
      splashG ? { map: { t: Math.max(0, c.e - 0.15), hl: [g].concat(splashG), bad: [g].concat(splashG), badLabel: 'egg carriers within 3 yards', rings: [g].concat(splashG).map((x) => ({ guid: x, r: 3, label: '3 yd', ...mcol('Noxious Shell', 0.14), fx: 'debuff', legend: 'a Noxious Shell, 3 yd (another carrier inside breaks both)' })),
        title: 'Noxious Splash at ' + T(c.e) + ': ' + (splashG.length ? andList([g].concat(splashG).map(pname)) + ' came within 3 yards' : pname(g) + '\'s egg (the other carrier isn\'t in the log)'), pts: posPts(Math.max(0, c.e - 0.15)), focus: ctrOf(posPts(Math.max(0, c.e - 0.15)), [g].concat(splashG), 8) } }
        // (any other Viper (your note, Oct 18: a map of what broke the egg): the carriers ringed, the seconds before it broke,
        // and its cause drawn: the Wretch's bubble the carrier was outside of for a Fester Burst, a red flash where a wave
        // hit the carrier, or the spot an egg on the ground broke)
        : (() => { const t = Math.max(0, (c ? c.e : v.t0) - 0.2), rings = eggRings(t - 5, t + 1.5);
          // (an egg on the ground whose Viper the log never placed: no map, since there's nothing true to draw (your rule))
          if (!c) { const vp = [0.4, 1, 2, 3].map((d) => posPts(v.t0 + d, [v.g]).find((p) => p.guid === v.g)).find(Boolean); if (!vp) return { txt: '' }; rings.push({ x: vp.x, y: vp.y, r: 2.5, t0: v.t0 - 1, dur: 3, fx: 'puddle', label: 'egg', ...mcol('Noxious Shell', 0.3), cn: 'Green circle', legend: 'an egg left on the ground broke here' }); }
          else if (grE && ids(UL.fester).includes(grE.id)) { const me = posPts(grE.t).find((p) => p.guid === g), w = unitsNamed(/^Blightscale Wretch$/).filter((u) => u.t0 <= grE.t && (u.died == null || u.died >= grE.t - 1)).map((u) => ({ u, p: posPts(grE.t, [u.g]).find((q) => q.guid === u.g) })).filter((x) => x.p).sort((a, b) => (me ? Math.hypot(a.p.x - me.x, a.p.y - me.y) - Math.hypot(b.p.x - me.x, b.p.y - me.y) : 0))[0];
            if (w) rings.push({ guid: w.u.g, r: 10, fx: 'safe', label: '10 yd bubble', ...mcol('Fester Burst', 0.12), legend: 'the Wretch\'s bubble, 10 yd: the carrier was outside it when Fester Burst hit' }); }
          else if (grE) rings.push({ guid: g, r: 3, t0: grE.t - 0.1, dur: 1.2, fx: 'burst', at: grE.t, label: '', color: '#ff3b3b', fill: 'rgba(255,59,59,.25)', cn: 'Red flash', legend: grE.spell + ' hit the carrier here' });
          const extra = [v.g].concat(rings.filter((x) => x.guid && x.r >= 10).map((x) => x.guid)), p0 = posPts(t, extra);
          return { map: { t, hl: g ? [g] : [], bad: g ? [g] : [], badLabel: cause === 'died carrying it' ? 'died carrying the egg' : 'had the egg', title: 'Blightscale Viper at ' + T(v.t0) + ': ' + (g ? pname(g) + '\'s egg, ' : '') + cause, pts: p0, rings,
            frames: h.frames ? h.frames(Math.max(0, t - 5), Math.min(dur, v.t0 + 1.5), 0.25, extra) : undefined, focus: ctrOf(p0, g ? [g] : [], 14) || undefined } }; })()]);
  }
  // (Mythic: a carrier whose egg just popped has Rancid Yolk; picking up another egg during it hurts more)
  if (mythic) {
    const yk = auraId(UL.yolk).filter((e) => h.isPlayer(e.dst)), yw = yk.filter((e) => e.op === 'apply').map((e) => ({ g: e.dst, s: e.t, e: (yk.find((x) => x.op === 'remove' && x.dst === e.dst && x.t >= e.t) || { t: e.t + 20 }).t }));
    // (an egg picked up with Rancid Yolk still on: its Noxious Shell does 200% more damage, which kills anyone but a tank)
    for (const c of carry) if (yw.some((y) => y.g === c.g && c.s > y.s + 0.2 && c.s < y.e)) { const tk = role(c.g) === 'tank', diedW = !tk && r.deaths.some((d) => d.guid === c.g && d.t >= c.s && d.t <= c.e + 0.6);
      M(c.s, pname(c.g), 'Rancid Yolk', UL.yolk, diedW ? 'High' : 'Low', 'Picked up an egg at ' + T(c.s) + ' with Rancid Yolk still on (its Noxious Shell does 200% more damage' + (tk ? ').' : '; enough to kill anyone but a tank, and the egg hatches a Viper when its carrier dies).'), 'Wait for Rancid Yolk to drop before picking up another egg, or leave that egg to someone else.');
      // (its map: where they picked it up, Rancid Yolk still on, and the seconds before)
      const yp = posPts(c.s).find((q) => q.guid === c.g), yr = eggRings(c.s - 4, c.s + 2).concat(yp ? [{ x: yp.x, y: yp.y, r: 1.3, t0: c.s - 0.1, dur: 4, label: '', color: eggC.color, fill: 'rgba(58,242,168,.7)', cn: 'Green dot', legend: 'where the egg was picked up' }] : []);
      eggRows.push([{ t: c.s }, { p: pname(c.g) }, /* (Mechanics audit, Oct 24: 1 to 3 a top kill, nobody died, so living is a note) */ { txt: 'took an egg with Rancid Yolk on' + (tk ? ' (tank)' : diedW ? ', died' : ''), bad: diedW, dim: !diedW }, { txt: '—', dim: true },
        { map: { t: c.s + 0.2, hl: [c.g], bad: diedW ? [c.g] : [], badLabel: 'died with it', warn: diedW ? [] : [c.g], warnLabel: 'picked it up with Rancid Yolk still on', title: pname(c.g) + ' picked up an egg at ' + T(c.s) + ' with Rancid Yolk still on', pts: posPts(c.s + 0.2), rings: yr,
          frames: h.frames ? h.frames(Math.max(0, c.s - 4), Math.min(dur, c.s + 2), 0.25, []) : undefined, focus: ctrOf(posPts(c.s + 0.2), [c.g], 14) || undefined } }]);
    }
  }
  // (Stage 2: eggs picked up with Blight Vein still on, right after the tether break, are counted but not flagged: on
  // Mythic kills every carrier does it, and a carrier who then dies shows up as the Viper's cause above)
  let veinN = 0;
  if (hcUp) { const vh = stackHist(UL.vein); for (const c of carry) if (stackAt(vh, c.g, c.s) >= 2) veinN++; }
  // (each egg phase (your note, Oct 18): from Call of the Serpent until the last egg is picked up, everyone moving in, a
  // green dot where each egg was picked up (each carrier ticked from that moment), and a small ring on each carrier after)
  // (and every egg, one line each (your question, Oct 18): grouped by the Call of the Serpent that dropped it, with who
  // carried it, when they picked it up, how long they held it and how it ended)
  const eggGroups = [], inCall = new Set();
  // (no map on each egg's line: the egg phase's map above them already shows every pickup, and nine big maps in a row
  // would bury the list; an egg that broke is its Viper's line, with the map of what broke it)
  const eggRow = (c, k) => {
    const held = Math.max(0, Math.round(Math.min(c.e, dur) - c.s)), end = c.e >= dur - 0.3;
    if (c.vrow) { const v = c.vrow; return [v[0], v[1], { ...v[2], txt: 'Egg ' + k + ' broke into a Viper: ' + c.viper.cause, sub: 'picked up at ' + T(c.s) + ', held for ' + held + ' s' }, { ...v[3], txt: 'Viper ' + v[3].txt }].concat(v.slice(4)); }
    const how = c.viper ? 'broke into a Viper: ' + c.viper.cause : c.pop ? 'popped in a Spectral Coil' : end ? 'still carried when the pull ended' : 'dropped at ' + T(c.e) + ' (no Viper)';
    return [{ t: c.s }, { p: pname(c.g) }, { txt: 'Egg ' + k + ': ' + how, sub: 'picked up at ' + T(c.s) + ', held for ' + held + ' s' }, { txt: c.viper ? 'Viper at ' + T(c.viper.t) : '—', dim: !c.viper }];
  };
  const eggSub = (ups) => { const n = (f) => ups.filter(f).length, nV = n((c) => c.viper), nP = n((c) => !c.viper && c.pop), nE = n((c) => !c.viper && !c.pop && c.e >= dur - 0.3), nD = ups.length - nV - nP - nE;
    return pl(ups.length, 'egg') + ': ' + [nP ? nP + ' popped in a Coil' : '', nD ? nD + ' dropped' : '', nV ? nV + ' broke into a Viper' : '', nE ? nE + ' still carried at the end' : ''].filter(Boolean).join(', '); };
  cots.forEach((t, i) => { const nx = cots[i + 1] != null ? cots[i + 1] : dur, ups = carry.filter((c) => c.s >= t - 1 && c.s < Math.min(nx, t + 45)); if (!ups.length) return;
    const last = Math.max(...ups.map((c) => c.s)), t1 = Math.min(dur, last + 2);
    const spots = ups.map((c) => { const p = posPts(c.s).find((q) => q.guid === c.g); return p ? { x: p.x, y: p.y, r: 1.3, t0: c.s - 0.1, dur: t1 - c.s + 3, label: '', color: eggC.color, fill: 'rgba(58,242,168,.7)', cn: 'Green dot', legend: 'where an egg was picked up' } : null; }).filter(Boolean);
    const phaseRow = [{ t }, { txt: 'the raid', dim: true }, { dim: true, txt: 'Call of the Serpent ' + (i + 1) + ': ' + pl(ups.length, 'egg') + ' picked up in ' + Math.max(1, Math.round(last - t)) + ' s', sub: andList([...new Set(ups.map((c) => pname(c.g)))]) }, { txt: '—', dim: true },
      { map: { t: last, good: [...new Set(ups.map((c) => c.g))], goodLabel: 'picked up an egg', goodAt: ups.map((c) => [c.g, c.s]), title: 'Call of the Serpent ' + (i + 1) + ' at ' + T(t) + ': every egg picked up', pts: posPts(last), rings: spots.concat(eggRings(t, t1)),
        // ("Zoom to mechanic": around the spots the eggs were picked up)
        focus: spots.length ? (() => { const cx = spots.reduce((s, p) => s + p.x, 0) / spots.length, cy = spots.reduce((s, p) => s + p.y, 0) / spots.length; return { x: cx, y: cy, r: Math.max(10, ...spots.map((p) => Math.hypot(p.x - cx, p.y - cy) + 6)) }; })() : undefined,
        frames: h.frames ? h.frames(Math.max(0, t - 1), t1, 0.25, []) : undefined } }];
    ups.forEach((c) => inCall.add(c));
    eggGroups.push({ title: 'Call of the Serpent ' + (i + 1), t, bad: ups.some((c) => c.viper), sub: eggSub(ups), rows: [phaseRow].concat(ups.slice().sort((a, b) => a.s - b.s).map((c, k) => eggRow(c, k + 1))) });
  });
  // (eggs no Call of the Serpent cast is logged for: the ones at the pull (cast before it), Stage 2's small eggs after the
  // tether break, and any others)
  const restE = carry.filter((c) => !inCall.has(c)).sort((a, b) => a.s - b.s);
  const atPull = restE.filter((c) => c.s < Math.min(45, cots.length ? cots[0] - 1 : 45));
  const st2 = p2 != null ? restE.filter((c) => !atPull.includes(c) && c.s >= p2 - 1 && (it == null || c.s < it)) : [], otherE = restE.filter((c) => !atPull.includes(c) && !st2.includes(c));
  for (const [title, xs] of [['Eggs at the pull', atPull], ['Stage 2 eggs', st2], ['Other eggs', otherE]]) if (xs.length) eggGroups.push({ title: title + ', ' + T(xs[0].s), t: xs[0].s, bad: xs.some((c) => c.viper), sub: eggSub(xs), rows: xs.map((c, k) => eggRow(c, k + 1)) });
  eggGroups.sort((a, b) => a.t - b.t);
  eggRows.sort((a, b) => a[0].t - b[0].t);
  // (a baseline row at the first pickup, so a pull whose Vipers all came after the wipe filter still reads clean up to it)
  if (carry.length) eggRows.unshift([{ t: carry[0].s }, { txt: 'the raid', dim: true }, { dim: true, txt: pl(carry.length, 'egg') + ' carried' + (vipers.length ? '' : ', none broke into a Viper'), sub: veinN ? veinN + ' picked up with Blight Vein still on (fine unless the carrier dies)' : '' }, { txt: '—', dim: true }]);
  const nV = vipers.length;
  sections.push({ id: 'eggs', title: 'Eggs (No Vipers)', spell: S(mythic ? 'noxious shell' : 'malignant shell'), verdict: nV ? 'bad' : eggRows.some((x) => x[2].warn) ? 'warn' : 'good',
    summary: nV ? pl(nV, 'Blightscale Viper') + ' hatched. Each row says who had the egg and what broke it.' : carry.length ? pl(carry.length, 'egg') + ' carried and none broke into a Viper.' : 'No eggs carried yet.',
    cols: ['When', 'Carrier', 'What happened', 'Viper', ''], rows: eggRows, groups: eggGroups });

  // ---- 2. Spectral Coils: soakers per circle (Soul Constrictor marks a soaker on Heroic and Mythic) ----
  const coilHits = []; for (const e of dmgId(UL.coilHit)) { let c = coilHits.find((x) => Math.abs(x.t - e.t) < 1); if (!c) coilHits.push(c = { t: e.t, amt: 0, n: 0 }); c.amt += e.amt; c.n++; }
  coilHits.sort((a, b) => a.t - b.t);
  const sc = auraId(UL.constrictor, 'apply').filter((e) => h.isPlayer(e.dst)), minSoak = Math.max(3, Math.round(r.players.size * 0.2));
  const coilSets = []; for (const c of coilHits) { const cur = coilSets[coilSets.length - 1]; if (cur && c.t - cur[cur.length - 1].t < 10) cur.push(c); else coilSets.push([c]); }
  const coilGroups = coilSets.map((set, si) => {
    const parts = [];
    const rows = set.map((c, k) => {
      const soak = [...new Set(sc.filter((e) => Math.abs(e.t - c.t) < 1).map((e) => e.dst))], died = r.deaths.filter((d) => d.t >= c.t - 0.2 && d.t <= c.t + 2 && /spectral coils/i.test(d.ability || ''));
      const none = hcUp && !soak.length, thin = hcUp && soak.length > 0 && soak.length < minSoak;
      if (died.length) for (const d of died) M(c.t, d.player, 'Spectral Coils', UL.coil, 'High', 'Died to Spectral Coils at ' + T(c.t) + (hcUp ? ' (' + pl(soak.length, 'soaker') + ' in that circle).' : '.'), 'Get more soakers into each circle, because everyone in it splits the hit. Alternate the two groups so nobody with Soul Constrictor is counted on.');
      else if (none) M(c.t, 'Raid', 'Spectral Coils', UL.coil, 'High', 'Nobody soaked the Spectral Coil at ' + T(c.t) + '.', 'Every circle needs its group inside before the tail slams it.');
      // (the map: the 10-yard soak to scale, centred on its soakers (the impact point isn't in the log), with anyone just
      // outside it marked)
      const at = hcUp ? posPts(c.t) : [], sp = at.filter((p) => soak.includes(p.guid)), ctr = sp.length ? { x: sp.reduce((s, p) => s + p.x, 0) / sp.length, y: sp.reduce((s, p) => s + p.y, 0) / sp.length } : null;
      const near = ctr ? at.filter((p) => p.kind === 'player' && !soak.includes(p.guid) && Math.hypot(p.x - ctr.x, p.y - ctr.y) <= 15).map((p) => p.guid) : [], diedG = died.map((d) => d.guid);
      if (ctr) parts.push({ k, t: c.t, ctr, soak, diedG });
      return [{ txt: 'Circle ' + (k + 1) }, { t: c.t }, hcUp ? { txt: String(soak.length), bad: none, warn: thin, sub: thin ? 'under ' + minSoak : '' } : { txt: 'not shown on Normal', dim: true }, { ps: soak.map(pname), none: hcUp ? 'nobody' : '' },
        { n: c.amt / Math.max(1, c.n), sub: 'each' }, { ps: died.map((d) => d.player), none: '—', bad: died.length > 0 }, { txt: '', dim: true }];
    });
    const t0 = set[0].t;
    // (one map for the whole set (your note, Oct 18), on its own row above the circles: every 10-yard soak to scale, centred
    // on its soakers (the impact point isn't in the log), numbered in order, each filling as the tail comes, then slamming;
    // a green check on each soaker from their circle, red for a death to it)
    if (parts.length) {
      const c0 = t0 - 3, tL = set[set.length - 1].t, bad = [...new Set(parts.flatMap((q) => q.diedG))], goodAt = [];
      for (const q of parts) for (const g of q.soak) if (!bad.includes(g) && !goodAt.some((x) => x[0] === g)) goodAt.push([g, q.t]);
      const x = parts.reduce((v, q) => v + q.ctr.x, 0) / parts.length, y = parts.reduce((v, q) => v + q.ctr.y, 0) / parts.length;
      rows.unshift([{ txt: allN(set.length, 'circle'), sub: 'the whole set, on one map', dim: true }, { t: t0 }, { txt: '' }, { txt: '' }, { txt: '' }, { txt: '' },
        { map: { t: tL + 0.3, good: goodAt.map((q) => q[0]), goodLabel: 'in a circle (soaked)', goodAt, pendLabel: 'not in a circle yet', bad, badLabel: 'died to it', badAt: parts.flatMap((q) => q.diedG.map((g) => [g, q.t])),
          rings: parts.map((q) => ({ x: q.ctr.x, y: q.ctr.y, r: 10, fx: 'soak', at: q.t, t0: c0 - 1, dur: 60, label: String(q.k + 1), ...mcol('Spectral Coils'), legend: 'a Spectral Coil soak, 10 yd (centred on its soakers): it fills as the tail comes, then slams (numbered in order)' })),
          focus: { x, y, r: Math.max(13, ...parts.map((q) => Math.hypot(q.ctr.x - x, q.ctr.y - y) + 12)) }, title: 'Spectral Coils at ' + T(t0) + ': all ' + pl(set.length, 'circle') + ', in order', pts: posPts(tL + 0.3),
          ...(h.frames ? { frames: h.frames(Math.max(0, c0), Math.min(dur, tL + 1.5), 0.25) } : {}) } }]);
    }
    return { title: 'Spectral Coils, set ' + (si + 1) + ' (' + phaseAt(t0) + ')', t: t0, sub: pl(set.length, 'circle') + (hcUp ? ': ' + set.map((c) => sc.filter((e) => Math.abs(e.t - c.t) < 1).length).join(' / ') + ' soakers' : ''),
      bad: rows.some((x) => x.some((c) => c.bad)), warn: rows.some((x) => x.some((c) => c.warn)), rows };
  });
  if (coilGroups.length) sections.push({ id: 'coils', title: 'Spectral Coils (Soak circles)', spell: S('spectral coils'), verdict: coilGroups.some((g) => g.bad) ? 'bad' : coilGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: pl(coilHits.length, 'circle') + (hcUp ? '. A circle under ' + minSoak + ' soakers is flagged.' : '.'), cols: ['Circle', 'When', 'Soakers', 'Who soaked', 'Damage', 'Died', ''], rows: [], groups: coilGroups });

  // ---- 2b. Caustic Waves: every wave hit, and where that wave came from ----
  // A hit puts the 10 s Caustic Waves poison on. The tail's waves (Gore Rattle surfacing at the platform's edge, two at a
  // time) roll straight across at about 12.5 yards a second (measured on a Mythic kill: hits land 5 to 6.5 s after the
  // cast, 62 to 86 yards away), so a hit is the tail wave whose front reached that spot just then, within 12 yards of its
  // path. Hits during Ula'tek's own wave casts, or just after a Toxic Incubation impact (waves from whoever took it), say
  // so; anything else is left unexplained rather than guessed. (No maps: the waves' width and shape aren't in the log, so
  // a map couldn't show the individual waves.)
  const WAVE_V = 12.5, wvHits = auraId(UL.wave).filter((e) => h.isPlayer(e.dst) && (e.op === 'apply' || e.op === 'dose'));
  const tailW = ev.filter((e) => e.k === 'cast' && e.id === UL.waveTail && e.face != null && e.x != null);
  // Ula'tek's own waves (and the tail's in their joint Stage 1 cast) go out from the platform's edge toward the middle for
  // about 12 s; in Stage 3 they start during her 4.5 s cast bar (measured on six Mythic pulls)
  const incOn = dmgId(UL.incubHit), incCasts = castsOf(UL.incub), wvTicks = dmgId(UL.wave);
  const bigW = ev.filter((e) => e.k === 'cast' && ids(UL.waveBig).includes(e.id)).map((c) => {
    const st = ev.filter((e) => e.k === 'start' && e.id === c.id && e.src === c.src && e.t <= c.t && e.t >= c.t - 6).pop();
    return { c, s: c.id === UL.waveBig[2] ? (st ? st.t : c.t - 4.5) : c.t, e: c.t + 12 };
  });
  const compass = (ux, uy) => ['east', 'north-east', 'north', 'north-west', 'west', 'south-west', 'south', 'south-east'][((Math.round(Math.atan2(uy, ux) / (Math.PI / 4)) % 8) + 8) % 8];
  // (each poison tick counts once, toward the latest hit on that player before it: a second wave on top restarts it)
  const tickOf = new Map(); for (const e of wvTicks) { const a = wvHits.filter((x) => x.dst === e.dst && x.t <= e.t + 0.2 && e.t - x.t <= 10.5).pop(); if (a) tickOf.set(a, (tickOf.get(a) || 0) + e.amt); }
  /* (Mechanics audit, Oct 24: every top kill took 6 to 17 wave hits and lived (often the same player twice), so a hit a player survives is a note
     (with how many times); a death is red. The damage itself still counts in Avoidable damage) */
  const wvN = new Map();
  const waveRows = wvHits.map((a) => {
    const nth = (wvN.get(a.dst) || 0) + 1; wvN.set(a.dst, nth);
    const me = posPts(a.t).find((p) => p.guid === a.dst);
    let src = null;
    if (me) for (const c of tailW) { if (a.t < c.t + 1 || a.t > c.t + 10) continue;
      const ux = -Math.sin(c.face), uy = Math.cos(c.face), dx = me.x - c.x, dy = me.y - c.y, al = dx * ux + dy * uy, pp = Math.abs(dy * ux - dx * uy), late = Math.abs(a.t - c.t - al / WAVE_V);
      if (al > 0 && pp <= 12 && late <= 1.5 && (!src || late + pp / 8 < src.score)) src = { c, ux, uy, score: late + pp / 8 }; }
    // (Toxic Incubation: its impacts send waves out from whoever took one, or from where they landed when nobody did)
    const bigB = !src && bigW.find((w) => a.t >= w.s - 0.5 && a.t <= w.e + 2), big = bigB && bigB.c, inc = !src && !big && incOn.filter((e) => a.t >= e.t - 0.3 && a.t <= e.t + 6).pop();
    const incT = !src && !big && !inc && incCasts.some((t) => a.t >= t && a.t <= t + 18);
    const amt = tickOf.get(a) || 0;
    const died = r.deaths.find((d) => d.guid === a.dst && d.t >= a.t && d.t <= a.t + 10.5 && /caustic waves/i.test(d.ability || ''));
    // (Oct 22, boss coverage: 4 of the 14 fastest Mythic kills lost someone to a wave in the last 20 s; as for every death, the end
    // of a kill isn't judged)
    if (died && r.item.kill && died.t >= dur - 20) return [{ t: a.t }, { ps: [pname(a.dst)] }, { txt: 'a wave in the last 20 s of the kill', dim: true }, { n: tickOf.get(a) || 0, sub: a.op === 'dose' ? 'a second wave on top' : '' }, { txt: 'died', dim: true, sub: 'the end of the kill' }];
    const from = src ? 'the tail\'s wave, heading ' + compass(src.ux, src.uy) : big ? (big.id === UL.waveBig[2] ? 'Ula\'tek\'s waves' : 'Ula\'tek and the tail\'s waves') : inc ? 'waves from ' + pname(inc.dst) + ' (Toxic Incubation)' : incT ? 'Toxic Incubation\'s waves' : 'not clear from the log';
    return [{ t: a.t }, { ps: [pname(a.dst)], sub: nth > 1 ? 'hit ' + nth + ' times' : '' }, { txt: from }, { n: amt, sub: a.op === 'dose' ? 'a second wave on top' : '' }, { txt: died ? 'died' : '—', bad: !!died, dim: !died }];
  });
  const wvPl = new Set(wvHits.map((e) => e.dst)).size;
  if (wvHits.length || tailW.length) sections.push({ id: 'waves', title: 'Caustic Waves (Dodge waves)', spell: S('caustic waves'), verdict: waveRows.some((x) => x[4].bad) ? 'bad' : 'good',
    summary: wvHits.length ? pl(wvHits.length, 'wave hit') + ' on ' + pl(wvPl, 'player') + (tailW.length ? ' (the tail surfaced ' + pl(tailW.length, 'time') + ')' : '') + '. Each row says which wave it was.' : 'Nobody was hit by Caustic Waves' + (tailW.length ? ' (the tail surfaced ' + pl(tailW.length, 'time') + ').' : '.'),
    cols: ['When', 'Hit', 'Which wave', 'Damage', 'Died'], rows: waveRows });

  // ---- 3. tanks: Mother's Wrath on the boss tank, Stone Venom, nobody on the tail or in melee ----
  const stone = stackHist(UL.stone), tankRows = [];
  for (const t of castsOf(UL.wrath)) {
    const land = landOf(UL.wrath, t), tg = [...new Set(dmgId(UL.wrathHit).filter((e) => e.t >= land - 0.5 && e.t <= land + 4).map((e) => e.dst))];
    // (each Wrath leaves the same stacks; what matters is what its target still had going in: a swap was due)
    const tank = tg.find((g) => role(g) === 'tank') || tg[0], raidHit = tg.length >= 3, st = tank ? maxIn(stone, tank, land, land + 6) : 0, had = tank ? stackAt(stone, tank, land - 0.6) : 0;
    if (raidHit) M(land, tank ? pname(tank) : 'Raid', "Mother's Wrath", UL.wrath, 'High', "Mother's Wrath at " + T(land) + ' hit ' + pl(tg.length, 'player') + ': its target was out of reach.', "The tank on Ula'tek stays in melee range through swaps and when she resurfaces.");
    if (had && !raidHit) M(land, pname(tank), "Mother's Wrath", UL.wrath, 'Low', pname(tank) + " took Mother's Wrath at " + T(land) + ' with ' + had + ' Stone Venom still on.', 'Swap so each Mother\'s Wrath lands on a tank with no Stone Venom left.');
    tankRows.push([{ t: land }, { s: S("mother's wrath") }, tank ? { p: pname(tank) } : { txt: '—', dim: true }, { txt: had ? 'had ' + had + ' going in' : 'none going in', warn: had > 0, dim: !had, sub: st ? st + ' after' : '' }, { txt: raidHit ? 'hit ' + pl(tg.length, 'player') : 'on the tank', bad: raidHit }]);
  }
  for (const [id, nm, what] of [[UL.slam, 'rattler slam', 'nobody was on the tail'], [UL.unchecked, 'unchecked rage', "nobody was in melee of Ula'tek"]]) {
    const hs = dmgId(id), seen = []; for (const e of hs) { if (seen.some((t) => Math.abs(t - e.t) < 3)) continue; seen.push(e.t); tankRows.push([{ t: e.t }, { s: S(nm) }, { txt: '—', dim: true }, { txt: '—', dim: true }, { txt: what + ': ' + pl(new Set(hs.filter((x) => Math.abs(x.t - e.t) < 3).map((x) => x.dst)).size, 'player') + ' hit', bad: true }]); }
  }
  tankRows.sort((a, b) => a[0].t - b[0].t);
  if (tankRows.length) sections.push({ id: 'tank', title: 'Tanks (Tail tanking)', place: 'Tanks (Boss and tail)', spell: S("mother's wrath"), verdict: tankRows.some((x) => x.some((c) => c.bad)) ? 'bad' : tankRows.some((x) => x.some((c) => c.warn)) ? 'warn' : 'good',
    summary: "It shows each Mother's Wrath, its tank and the Stone Venom they still had going in, and any time the raid was punished for nobody tanking.", cols: ['When', 'What', 'Tank', 'Stone Venom', 'Result'], rows: tankRows });

  // ---- 4. Mythic: Toxic Incubation (the inactive tank stands in the beam) and each Wretch's bubbles ----
  if (mythic) {
    const burnH = stackHist(UL.burn);
    const incRows = castsOf(UL.incub).map((t) => {
      const land = landOf(UL.incub, t), w0 = land - 0.3, w1 = land + 6.5, hits = dmgId(UL.incubHit).filter((e) => e.t >= w0 && e.t <= w1), who = [...new Set(hits.map((e) => e.dst))];
      const boon = ev.filter((e) => e.k === 'aura' && e.id === UL.boon && (e.op === 'apply' || e.op === 'dose') && e.t >= w0 && e.t <= w1).length;
      if (boon) M(land, 'Raid', 'Toxic Incubation', UL.incub, 'High', pl(boon, 'Toxic Incubation impact') + ' reached the Blightscale Wretch at ' + T(land) + ' (Mother\'s Boon: it hits harder and takes less damage).', 'The tank not on the boss stands in the beam for every impact, with a defensive.');
      return [{ t: land }, { ps: who.map(pname), none: 'nobody' }, { txt: hits.length + ' of ' + (hits.length + boon), sub: who.length ? 'Toxic Burn up to ' + Math.max(...who.map((g) => maxIn(burnH, g, w0, w1 + 1))) + (who.every((g) => role(g) === 'tank') ? ' · tank' : '') : '' }, { txt: boon ? boon + ' reached the Wretch' : 'none reached the Wretch', bad: boon > 0 }];
    });
    if (incRows.length) sections.push({ id: 'incub', title: 'Toxic Incubation (Beam)', place: 'Toxic Incubation (Block the beam)', spell: S('toxic incubation'), mythicOnly: true, verdict: incRows.some((x) => x[3].bad) ? 'bad' : 'good',
      summary: 'For each Toxic Incubation, it shows who took the impacts and how many reached the Wretch.', cols: ['When', 'Took it', 'Impacts taken', 'Wretch'], rows: incRows });
    // (each Blightscale Wretch dies before its third Fester Burst bubble; anyone outside a bubble takes the burst)
    const fest = ev.filter((e) => (e.k === 'start' || e.k === 'cast') && e.id === UL.fester), festHit = dmgId(UL.fester);
    const wrRows = unitsNamed(/^Blightscale Wretch$/).map((x) => {
      const ts = unitCasts(fest, x.g), late = ts.length >= 3;
      // (tanks aren't judged: the one on the Toxic Incubation beam has to stand away from the Wretch)
      const outAll = [...new Set(festHit.filter((e) => ts.some((t) => e.t >= t && e.t <= t + 6)).map((e) => e.dst))], outside = outAll.filter((g) => role(g) !== 'tank'), outT = outAll.length - outside.length;
      if (late) M(ts[2], 'Raid', 'Fester Burst', UL.fester, 'Low', 'A Blightscale Wretch got to its third Fester Burst at ' + T(ts[2]) + '.', 'Kill each Wretch before its third bubble. It enrages after 30 seconds and bursts faster.');
      // (the map: the burst that caught the most people outside, a moment before it landed, with the Wretch's 10-yard
      // bubble to scale; everyone it hit was outside it)
      const bursts = ts.map((t) => { const hits = festHit.filter((e) => e.t >= t && e.t <= t + 6); return { land: hits.length ? hits[0].t : t + 2, out: [...new Set(hits.map((e) => e.dst))] }; }).sort((a, b) => b.out.length - a.out.length);
      const pick = bursts[0], mt = pick ? Math.max(0, pick.land - 0.3) : null, fr = pick && h.frames ? ((h.frames(mt, mt, 0.2, [x.g])[0] || { pts: [] }).pts) : [];
      const mapC = pick && fr.some((p) => p.guid === x.g) ? { map: { t: mt, bad: pick.out.filter((g) => role(g) !== 'tank'), badLabel: 'outside the bubble (hit)', hl: pick.out.filter((g) => role(g) === 'tank'), hlLabel: 'tank outside (not judged)',
        rings: [{ guid: x.g, r: 10, fx: 'safe', at: pick.land, label: '10 yd bubble', ...mcol('Fester Burst', 0.12), legend: 'the Wretch\'s bubble, 10 yd (inside is safe)' }], focus: ctrOf(fr, [x.g], 13), title: 'Fester Burst at ' + T(pick.land) + ': the Wretch\'s 10-yard bubble' + (pick.out.length ? ', ' + pl(pick.out.length, 'player') + ' outside' : ', everyone inside'), pts: fr } } : { txt: '', dim: true };
      return [{ t: x.t0 }, { txt: x.died != null ? 'killed after ' + Math.round(x.died - x.t0) + 's' : 'still up', dim: x.died == null }, { txt: pl(ts.length, 'bubble'), warn: late, sub: late ? 'kill it before the third' : '' }, /* (Mechanics audit, Oct 24: 2 of 5 top kills had 1 or 2 outside and lived; 3 or more is the mistake) */ { ps: outside.map(pname), none: 'nobody outside', warn: outside.length >= 3, sub: outT ? pl(outT, 'tank') + ' outside (not judged)' : '' }, mapC];
    });
    if (wrRows.length) sections.push({ id: 'wretch', title: 'Blightscale Wretch (Bubble)', place: 'Blightscale Wretch (Stand in the bubble)', spell: S('fester burst'), mythicOnly: true, verdict: wrRows.some((x) => x.some((c) => c.warn)) ? 'warn' : 'good',
      summary: 'For each Wretch, it shows how long it lived, how many Fester Bursts it got off and who was outside the bubble.', cols: ['Spawned', 'Killed', 'Bubbles', 'Outside the bubble', ''], rows: wrRows });
  }

  // ---- 5. damage amps: Rage of the Shackled windows (damage in, boss health after, potions) ----
  const rg = auraId(UL.rage).filter((e) => !h.isPlayer(e.dst)), wins = [];
  for (const e of rg) if (e.op === 'apply' && !wins.some((w) => Math.abs(w.s - e.t) < 2)) wins.push({ s: e.t, e: (rg.find((x) => x.op === 'remove' && x.t > e.t) || { t: Math.min(dur, e.t + 20) }).t });
  const lustT = (() => { const ts = []; for (const p of r.players.values()) for (const n of ['bloodlust', 'heroism', 'time warp', 'fury of the aspects', 'primal rage', "harrier's cry"]) for (const t of p.byName.get(n) || []) ts.push(t); return ts.length ? Math.min(...ts) : null; })();
  // (boss health: Ula'tek, her tail and the Venomous Heart share one pool, so the latest reading from any of them; a
  // Warcraft Logs report carries it too, on the events it has the target's resources for)
  const ulU = [...(r.hpUnits || new Map()).values()].find((u) => u.name === "Ula'tek");
  const poolS = ulU ? [...r.hpUnits.values()].filter((u) => u.max >= 0.9 * ulU.max).flatMap((u) => u.samples).sort((a, b) => a[0] - b[0]) : [];
  const hpAt = (t) => { let v = null; for (const [tt, f] of poolS) { if (tt > t) break; v = f; } return v; };
  // (Mythic: Ula'tek at 67% or lower after the first window, and 45% or lower after the second, is on pace for a kill)
  const PACE = mythic ? [0.67, 0.45] : [];
  // (each window, player by player: their damage into the heart (doubled while it's open) and elsewhere on the boss)
  const amps = wins.map((w, i) => { const per = new Map(); let heart = 0, other = 0;
    for (const e of ev) { if (e.k !== 'pdmg' || e.t < w.s || e.t > w.e) continue; const p = r.players.get(e.src); if (!p || !p.name) continue;
      const x = per.get(p.name) || { p: p.name, h: 0, o: 0 }; if (e.dn === 'Venomous Heart') { x.h += e.amt; heart += e.amt; } else { x.o += e.amt; other += e.amt; } per.set(p.name, x); }
    const pots = [...r.players.values()].filter((p) => p.cons.combatpot.some((u) => u.t >= w.s - 20 && u.t <= w.e)).length, lust = lustT != null && lustT >= w.s - 10 && lustT <= w.e;
    return { n: i + 1, t0: w.s, t1: w.e, heart, other, hp0: hpAt(w.s), hp1: hpAt(w.e + 0.5), pace: PACE[i] != null ? PACE[i] : null, pots, lust, per: [...per.values()].filter((x) => x.h + x.o > 0).sort((a, b) => b.h - a.h || b.o - a.o) }; });
  const pc = (v) => Math.round(100 * v) + '%';
  const ampRows = amps.map((a) => { const len = Math.max(1, a.t1 - a.t0), hp = a.hp1, slow = a.pace != null && hp != null && hp > a.pace + 0.005, d = a.heart || a.other;
    return [{ txt: '#' + a.n }, { t: a.t0 }, { n: d, sub: h.compact(d / len) + ' per second' + (a.heart && a.other ? ' · ' + pc(a.heart / (a.heart + a.other)) + ' of it on the heart' : '') },
      { txt: hp != null ? (hp < 0.005 ? 'killed in it' : pc(hp) + ' after') : '—', warn: slow, dim: hp == null, sub: [a.hp0 != null && hp != null ? 'from ' + pc(a.hp0) : '', a.pace != null ? 'on pace at ' + pc(a.pace) + ' or lower' : ''].filter(Boolean).join(' · ') },
      { txt: pl(a.pots, 'combat potion'), dim: !a.pots, sub: a.lust ? 'with Bloodlust' : '' }]; });
  if (ampRows.length) sections.push({ id: 'amps', title: 'Rage of the Shackled (Damage windows)', spell: S('rage of the shackled'), verdict: ampRows.some((x) => x[3].warn) ? 'warn' : 'good',
    summary: 'It shows the damage into the Venomous Heart in each 20-second window, player by player, the boss\'s health before and after it' + (mythic ? ' (on pace: 67% after the first, 45% after the second)' : '') + ' and the combat potions drunk for it' + (lustT != null ? '. Bloodlust was at ' + T(lustT) : '') + '.',
    cols: ['Window', 'When', 'Into the heart', 'Boss health', 'Potions'], rows: ampRows, amps });

  // ---- 6. Stage 2: Grasping Fangs tethers (broken in planned batches, the big one together under a raid cooldown) ----
  const RAIDCD = ['anti-magic zone', 'rallying cry', 'spirit link totem', 'darkness', 'power word: barrier', 'aura mastery', 'tranquility', 'revival', 'divine hymn', 'rewind', 'vampiric embrace'];
  const cdsAt = (a, b) => { const out = new Set(); for (const p of r.players.values()) for (const n of RAIDCD) if ((p.byName.get(n) || []).some((t) => t >= a && t <= b)) out.add(n.replace(/\b\w/g, (c) => c.toUpperCase())); return [...out]; };
  const fa = auraId(UL.fangs).filter((e) => h.isPlayer(e.dst)), vein = stackHist(UL.vein);
  const teth = fa.filter((e) => e.op === 'apply').map((e) => { const rm = fa.find((x) => x.op === 'remove' && x.dst === e.dst && x.t >= e.t), end = rm ? rm.t : dur;
    return { g: e.dst, s: e.t, e: end, died: r.deaths.find((d) => d.guid === e.dst && d.t >= e.t && d.t <= end + 0.5) }; });
  const tSets = []; for (const x of teth.sort((a, b) => a.s - b.s)) { const cur = tSets[tSets.length - 1]; if (cur && x.s - cur[0].s < 6) cur.push(x); else tSets.push([x]); }
  const veinPeak = (a, b) => Math.max(0, ...[...vein.keys()].map((g) => maxIn(vein, g, a, b)));
  const fangGroups = tSets.map((set, i) => {
    const t0 = set[0].s, t1 = Math.max(...set.map((x) => x.e)), pk = veinPeak(t0, t1 + 10), byE = set.slice().sort((a, b) => a.e - b.e);
    const rows = byE.map((x) => { if (x.died) M(x.died.t, pname(x.g), 'Grasping Fangs', UL.fangsCast, 'High', 'Died while tethered by Grasping Fangs (' + (x.died.ability || 'unknown') + ').', 'Break tethers on the call with healing and raid cooldowns ready, and not during other big damage.');
      return [{ t: x.s }, { p: pname(x.g) }, { txt: x.e < dur ? 'broke at ' + T(x.e) + ' (' + Math.round(x.e - x.s) + 's)' : 'never broke', warn: x.e >= dur && !x.died }, { txt: x.died ? 'died' : '—', bad: !!x.died, dim: !x.died }]; });
    // (breaks within 3 s are one batch; a batch of several should go off within about a second, so the raid takes one set of
    // Blight Vein ticks, under a raid cooldown)
    const broke = byE.filter((x) => x.e < dur && !x.died), batches = []; for (const x of broke) { const cur = batches[batches.length - 1]; if (cur && x.e - cur[cur.length - 1].e <= 3) cur.push(x); else batches.push([x]); }
    // (a raid cooldown is the plan for a big batch, four or more; pairs on Heroic go without one)
    if (hcUp) for (const b of batches) if (b.length >= 2) { const spread = b[b.length - 1].e - b[0].e, cds = cdsAt(b[0].e - 10, b[0].e + 1), loose = spread > 2, noCd = b.length >= 4 && !cds.length;
      if (loose) M(b[0].e, 'Raid', 'Grasping Fangs', UL.fangsCast, 'Low', 'A break of ' + b.length + ' tethers at ' + T(b[0].e) + ' was spread over ' + spread.toFixed(1) + ' s (more Blight Vein ticks on the raid).', 'Everyone in the batch stands at the edge of their tether a couple of seconds early and steps out together on the call.');
      rows.push([{ t: b[0].e }, { txt: 'Break of ' + b.length }, { txt: 'over ' + spread.toFixed(1) + ' s', sub: cds.length ? cds.join(', ') : 'no raid cooldown' }, { txt: loose ? 'spread out' : noCd ? 'no raid cooldown' : 'together', warn: loose || noCd, dim: !loose && !noCd }]); }
    rows.sort((a, b) => a[0].t - b[0].t);
    return { title: 'Grasping Fangs ' + (i + 1), t: t0, sub: pl(set.length, 'tether') + ', broken in ' + batches.map((b) => b.length).join(' + ') + ' · Blight Vein up to ' + pl(pk, 'stack') + ' on the raid', bad: rows.some((x) => x.some((c) => c.bad)), warn: rows.some((x) => x.some((c) => c.warn)), rows };
  });
  if (fangGroups.length) sections.push({ id: 'fangs', title: 'Grasping Fangs (Tether breaks)', spell: S('grasping fangs'), verdict: fangGroups.some((g) => g.bad) ? 'bad' : fangGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: 'It shows who each Doomscale Warden tethered, when each tether broke, how each batch went and the raid cooldowns under it.', cols: ['When', 'Tethered', 'Broke', 'Result'], rows: [], groups: fangGroups });

  // ---- 7. Stage 2: Wardens (dead before their second gestation), Doomscales (killed together), a big egg that hatched ----
  const weak = unitsNamed(/^Weakened Doomscale$/), rav = unitsNamed(/^Ravenous Doomscale$/), rev = auraId(UL.revenge, 'apply').filter((e) => !h.isPlayer(e.dst)), dsRows = [];
  const gest = ev.filter((e) => (e.k === 'start' || e.k === 'cast') && e.id === UL.wardenGest);
  for (const x of unitsNamed(/^Doomscale Warden$/)) { const gs = unitCasts(gest, x.g), late = gs.length >= 2;
    if (late) M(gs[1], 'Raid', 'Writhing Gestation', UL.wardenGest, 'Low', 'A Doomscale Warden reached its second Writhing Gestation at ' + T(gs[1]) + ' (its enrage).', 'Kill each Warden before its second gestation. Focus it while the eggs are cleaved down.');
    dsRows.push([{ t: x.t0 }, { txt: 'Doomscale Warden' }, { txt: x.died != null ? 'killed after ' + Math.round(x.died - x.t0) + 's' : 'not killed', dim: x.died == null }, { txt: late ? 'reached its second gestation' : gs.length ? 'before its second gestation' : '—', warn: late, dim: !late }]); }
  const wSets = []; for (const x of weak) { const cur = wSets[wSets.length - 1]; if (cur && x.t0 - cur[0].t0 < 8) cur.push(x); else wSets.push([x]); }
  wSets.forEach((set, i) => { const ds = set.map((x) => x.died).filter((t) => t != null), gap = ds.length === set.length && ds.length > 1 ? Math.max(...ds) - Math.min(...ds) : null;
    // (Revenge: the survivor casts twice as fast and hits twice as hard. Any Revenge could be better; it went wrong when it
    // cost something: an Anguished Cry got through, or someone died to that Doomscale's Thrash or Cry while it had it. How
    // long it lasted doesn't decide it: the top Mythic kills held it from under a second to 17 s, every Cry kicked.)
    const rv = rev.filter((e) => set.some((x) => x.g === e.dst));
    const cost = rv.map((e) => { const d = deathOf(e.dst) ?? dur;
      const cry = new Set(ev.filter((x) => x.k === 'dmg' && x.id === UL.cry && x.src === e.dst && x.t >= e.t && x.t <= d + 0.5).map((x) => x.dst)).size;
      const dead = r.deaths.filter((x) => x.t >= e.t && x.t <= d + 3 && (x.abilityId === UL.cry || x.abilityId === UL.desperate)).map((x) => x.player);
      return { cry, dead }; });
    const cries = Math.max(0, ...cost.map((c) => c.cry)), deadN = [...new Set(cost.flatMap((c) => c.dead))], rvBad = cries > 0 || deadN.length > 0;
    const hurt = (cries ? 'its Anguished Cry hit ' + pl(cries, 'player') : '') + (deadN.length ? (cries ? ' and ' : '') + deadN.join(', ') + ' died to it' : '');
    if (rv.length) M(rv[0].t, 'Raid', 'Revenge', UL.revenge, rvBad ? 'High' : 'Low', 'A Weakened Doomscale gained Revenge at ' + T(rv[0].t) + ' (another one died first: 100% more haste and damage)' + (rvBad ? ': ' + hurt + '.' : '.'),
      rvBad ? 'While a Doomscale has Revenge it casts twice as fast. Keep a kick ready for every Anguished Cry, keep its frontal off the raid, and kill the Doomscales together.' : 'Keep every Doomscale at the same health (call it out) and kill them together.');
    dsRows.push([{ t: set[0].t0 }, { txt: pl(set.length, 'Weakened Doomscale') }, { txt: ds.length ? 'killed ' + ds.map((t) => T(t)).join(', ') : 'not killed', dim: !ds.length },
      { txt: rv.length ? 'Revenge' + (gap != null ? ' (' + Math.round(gap) + 's apart)' : '') : gap != null ? Math.round(gap) + 's apart' : '—', bad: rvBad, dim: !rvBad, /* (Mechanics audit, Oct 24: every top kill had Revenge with nothing getting through, so harmless Revenge is a note) */
        sub: rv.length ? (rvBad ? hurt : 'no Anguished Cry got through') : '' }]); });
  for (const x of rav) { M(x.t0, 'Raid', 'Ravenous Doomscale', UL.hatching, 'High', 'A Doomscale Egg hatched into a Ravenous Doomscale at ' + T(x.t0) + '.', 'Drop the small eggs into the cauldron first and the big Doomscale Egg last, before its timer runs out.');
    dsRows.push([{ t: x.t0 }, { txt: 'Ravenous Doomscale' }, { txt: 'a big egg hatched' }, { txt: 'a problem', bad: true }]); }
  dsRows.sort((a, b) => a[0].t - b[0].t);
  if (dsRows.length) sections.push({ id: 'doomscale', title: 'Wardens and Doomscales (Big adds)', place: 'Wardens and Doomscales (Kill in time)', spell: S('hatching doom'), verdict: dsRows.some((x) => x.some((c) => c.bad)) ? 'bad' : dsRows.some((x) => x.some((c) => c.warn)) ? 'warn' : 'good',
    summary: 'It shows each Doomscale Warden (it should die before its second gestation), each set of Weakened Doomscales and how close together they died' + (mythic ? ' (Revenge if not)' : '') + ', and any big egg that hatched.', cols: ['When', 'What', 'Killed', 'Result'], rows: dsRows });

  // ---- 8. Stage 3: Serpent's Bite, one set per cast (cleared in time; Volatile Purge spread; on Mythic, a defensive for it) ----
  // (the three bites of a cast clear together on Mythic, so their helpers belong to the cast, not to one bite)
  const bt = auraId(UL.bite).filter((e) => h.isPlayer(e.dst)), pa = auraId(UL.purge, 'apply').filter((e) => h.isPlayer(e.dst)), booms = dmgId(UL.purgeBoom), corpse = ev.filter((e) => ids(UL.corpse).includes(e.id));
  const holdersAt = (t) => new Set(pa.filter((x) => x.t >= t - 5.6 && x.t <= t - 4.4).map((x) => x.dst));
  // (a personal defensive pressed in the 10 s before, or an external cast on them in the 12 s before)
  const DEF_N = new Set(PERSONAL.concat(['bear form', 'heart of the wild', 'ice cold', 'spell reflection'])), EXT_N = new Set(['pain suppression', 'guardian spirit', 'ironbark', 'life cocoon', 'blessing of sacrifice', 'blessing of protection', 'blessing of spellwarding', 'time dilation']);
  const covered = (g, t) => { const p = r.players.get(g); if (p) for (const n of DEF_N) if ((p.byName.get(n) || []).some((u) => u >= t - 10 && u <= t + 0.3)) return n; const nm = pname(g);
    for (const q of r.players.values()) for (const c of q.helpL || []) if (c.on && c.on.split('-')[0] === nm && EXT_N.has(String(c.spell).toLowerCase()) && c.t >= t - 12 && c.t <= t + 0.3) return c.spell; return null; };
  const bSets = []; for (const e of bt.filter((x) => x.op === 'apply')) { const cur = bSets[bSets.length - 1]; if (cur && e.t - cur[0].t < 5) cur.push(e); else bSets.push([e]); }
  const biteGroups = bSets.map((set, i) => {
    const t0 = set[0].t, ends = set.map((e) => { const rm = bt.find((x) => x.op === 'remove' && x.dst === e.dst && x.t >= e.t); return rm ? rm.t : dur; });
    const helpers = [...new Set(pa.filter((x) => ends.some((t) => x.t >= t - 0.3 && x.t <= t + 0.6) && !set.some((e) => e.dst === x.dst)).map((x) => x.dst))];
    const rows = set.map((e, k) => { const end = ends[k], died = r.deaths.find((d) => d.guid === e.dst && d.t >= e.t && d.t <= end + 1), cc = corpse.find((x) => x.t >= e.t && x.t <= end + 4 && (x.dst === e.dst || x.src === e.dst));
      const bad = !!died || !!cc, res = cc ? 'became a Calcified Corpse' : died ? 'died with it (a wipe)' : end < dur ? 'cleared' : 'not cleared';
      if (bad) M(e.t, pname(e.dst), "Serpent's Bite", UL.biteCast, 'High', "Serpent's Bite on " + pname(e.dst) + ' at ' + T(e.t) + ': ' + res + '.', 'Their soakers stand with them right away, and nobody with a bite takes extra damage before it clears.');
      // (the map: just before it cleared, every bite of this cast with its 7-yard leech circle, and who took the venom)
      const mt = Math.max(0, (end < dur ? end : e.t + 2) - 0.3);
      const bmap = { map: { t: mt, hl: [e.dst], hlLabel: 'bitten', good: helpers, goodLabel: 'took the venom (now a Purge holder)', rings: set.map((x) => ({ guid: x.dst, r: 7, fx: 'debuff', label: '7 yd', ...mcol("Serpent's Bite", 0.12), legend: 'leech range, 7 yd' })), title: "Serpent's Bite on " + pname(e.dst) + ' at ' + T(e.t) + ': the 7-yard leech circles', pts: posPts(mt), focus: ctrOf(posPts(mt), set.map((x) => x.dst), 12) } };
      // (the whole cast's map is on its own row above; a bite that went wrong keeps its own map)
      return [{ t: e.t }, { p: pname(e.dst) }, { txt: res, bad, sub: end < dur && !bad ? 'after ' + Math.round(end - e.t) + 's' : '' }, bad ? bmap : { txt: '' }]; });
    const lastEnd = Math.max(...ends), bm = booms.filter((x) => x.t >= lastEnd + 3 && x.t <= lastEnd + 7.5), seenB = [], bursts = [];
    for (const e of bm) { if (seenB.some((t) => Math.abs(t - e.t) < 0.5)) continue; seenB.push(e.t);
      const hold = holdersAt(e.t), caught = [...new Set(bm.filter((x) => Math.abs(x.t - e.t) < 0.5 && !hold.has(x.dst)).map((x) => x.dst))];
      // (the map: each holder's burst a moment before it went off. Its size isn't published: about 12 yards, from where the
      // players it caught stood in a Mythic kill)
      const pt = Math.max(0, e.t - 0.1), pmap = { map: { t: pt, hl: [...hold], hlLabel: 'held a Volatile Purge', bad: caught, badLabel: "caught in someone else's", rings: [...hold].map((x) => ({ guid: x, r: 12, fx: 'burst', at: e.t, label: '~12 yd', ...mcol('Volatile Purge', 0.1), legend: 'a Volatile Purge burst, about 12 yd' })),
        title: 'Volatile Purge at ' + T(e.t) + ': each holder\'s burst (about 12 yards, measured from logs)', pts: posPts(pt), focus: ctrOf(posPts(pt), [...hold], 16) } };
      // (a Volatile Purge exploding on someone who wasn't holding one: not spread)
      for (const g of caught) { M(e.t, pname(g), 'Volatile Purge', UL.purge, 'Low', "Caught in someone else's Volatile Purge at " + T(e.t) + '.', 'Spread before the Purges explode, 5 seconds after a bite is cleared.');
        rows.push([{ t: e.t }, { p: pname(g) }, { txt: "caught in someone else's Volatile Purge", dim: true }, pmap]); } /* (Mechanics audit, Oct 24: 1 or 2 a top kill, all lived: a note) */
      // (Mythic: the Purge hits its holder for about 2 million, so every holder needs a big defensive or an external)
      if (mythic) for (const g of hold) { if (r.deaths.some((d) => d.guid === g && d.t < e.t - 0.2)) continue; const c = covered(g, e.t);
        if (!c) M(e.t, pname(g), 'Volatile Purge', UL.purge, 'Low', 'Took the Volatile Purge at ' + T(e.t) + ' with no defensive or external.', 'The Purge hits its holder for about 2 million. Use a big defensive or immunity for it, then personals and externals through the damage over time after it.');
        rows.push([{ t: e.t }, { p: pname(g) }, { txt: c ? 'Volatile Purge with ' + String(c).replace(/\b\w/g, (x) => x.toUpperCase()).replace(/ (Of|The) /g, (m) => m.toLowerCase()) : 'Volatile Purge, no defensive', dim: true }, { txt: '' }]); }
      bursts.push({ t: e.t, hold, caught }); }
    // (one map for the whole cast (your note, Oct 18), on its own row above: every bite's 7-yard leech circle until it
    // cleared, a green check on each player from the moment they took the venom, then each holder's Volatile Purge
    // bursting 5 seconds later, with anyone caught in someone else's marked red)
    {
      const tL = bursts.length ? Math.max(...bursts.map((b) => b.t)) + 1 : Math.min(dur, lastEnd + 2), c0 = Math.max(0, t0 - 1.5);
      const gAt = helpers.map((g) => [g, (pa.find((x) => x.dst === g && ends.some((t) => x.t >= t - 0.3 && x.t <= t + 0.6)) || { t: lastEnd }).t]);
      const holdAll = [...new Set(bursts.flatMap((b) => [...b.hold]))], caughtAt = bursts.flatMap((b) => b.caught.map((g) => [g, b.t]));
      const rings = set.map((x, k) => ({ guid: x.dst, r: 7, fx: 'debuff', t0: x.t, dur: ends[k] - x.t, label: '7 yd', ...mcol("Serpent's Bite", 0.12), legend: 'a bite\'s leech range, 7 yd, until it was cleared' }))
        .concat(bursts.flatMap((b) => [...b.hold].map((g) => ({ guid: g, r: 12, fx: 'burst', t0: b.t - 5, dur: 5.6, at: b.t, label: '~12 yd', ...mcol('Volatile Purge', 0.1), legend: 'a Volatile Purge burst, about 12 yd (5 seconds after the bite is cleared)' }))));
      const mid = Math.min(dur, lastEnd + 2);
      rows.unshift([{ t: t0 }, { txt: 'Whole cast', sub: 'the bites, then the Purges, on one map', dim: true }, { txt: '' },
        { map: { t: Math.max(0, tL - 1.1), hl: set.map((x) => x.dst), hlLabel: 'bitten', good: helpers, goodLabel: 'took the venom (now a Purge holder)', goodAt: gAt, pendLabel: 'not holding venom yet', bad: [...new Set(caughtAt.map((x) => x[0]))], badLabel: "caught in someone else's Volatile Purge", badAt: caughtAt, rings,
          title: "Serpent's Bite " + (i + 1) + ' at ' + T(t0) + ': the bites, then the Purges', pts: posPts(mid), focus: ctrOf(posPts(mid), set.map((x) => x.dst).concat(holdAll), 18), ...(h.frames ? { frames: h.frames(c0, Math.min(dur, tL), 0.25) } : {}) } }]);
    }
    return { title: "Serpent's Bite " + (i + 1), t: t0, sub: pl(set.length, 'bite') + (!helpers.length ? '' : helpers.length <= 4 ? ', cleared by ' + helpers.map(pname).join(', ') : ', cleared by ' + pl(helpers.length, 'player')), bad: rows.some((x) => x.some((c) => c.bad)), warn: rows.some((x) => x.some((c) => c.warn)), rows };
  });
  if (biteGroups.length) sections.push({ id: 'bite', title: "Serpent's Bite (Soak)", place: "Serpent's Bite (Soak the bite)", spell: S("serpent's bite"), verdict: biteGroups.some((g) => g.bad) ? 'bad' : biteGroups.some((g) => g.warn) ? 'warn' : 'good',
    summary: 'It shows each bite, who took it off' + (mythic ? ' and whether each Purge holder had a defensive' : '') + ', and anyone caught in a Volatile Purge they weren\'t holding.', cols: ['When', 'Player', 'Result', ''], rows: [], groups: biteGroups });

  // ---- 9. Stage 3: Blightscale Shriekers (and any Rawling that got its Acidic Expulsion off) ----
  const exp = ev.filter((e) => e.k === 'cast' && e.id === UL.expulsion), boil = ev.filter((e) => (e.k === 'cast' || e.k === 'start') && e.id === UL.boilS), shRows = [];
  // (a Shrieker gets one Acidic Expulsion off soon after it spawns; a second one, or Boiling Venom, means it lived too long)
  for (const x of unitsNamed(/^Blightscale Shrieker$/)) { const nE = exp.filter((e) => e.src === x.g).length, b = boil.some((e) => e.src === x.g);
    // (Oct 22, boss coverage: every one of the 9 fastest Mythic kills let each Shrieker cast Boiling Venom and one Expulsion, and killed
    // it in 20 to 32 s; the last one is still up when the kill ends. Over 40 s alive or a second Expulsion is the slip)
    const life = x.died != null ? x.died - x.t0 : dur - x.t0;
    shRows.push([{ t: x.t0 }, { txt: 'Blightscale Shrieker' }, { txt: x.died != null ? 'killed in ' + Math.round(life) + 's' : 'still up', warn: life > 40 && !(x.died == null && r.item.kill), dim: x.died == null && r.item.kill }, { txt: (b ? 'Boiling Venom' : '') + (b && nE ? ', ' : '') + (nE ? pl(nE, 'Acidic Expulsion') : '') || '—', warn: nE > 1, dim: nE < 2 }]); }
  const rawEx = exp.filter((e) => /Rawling/.test(h.unitName(e.src) || ''));
  for (const e of rawEx) shRows.push([{ t: e.t }, { txt: 'Blightscale Rawling' }, { txt: 'lived long enough to expel' }, { txt: 'Acidic Expulsion', warn: true }]);
  shRows.sort((a, b) => a[0].t - b[0].t);
  if (shRows.length) sections.push({ id: 'shriek', title: 'Shriekers and Rawlings (Adds)', place: 'Shriekers and Rawlings (Kill in time)', spell: S('acidic expulsion'), verdict: shRows.some((x) => x.some((c) => c.bad)) ? 'bad' : shRows.some((x) => x.some((c) => c.warn)) ? 'warn' : 'good',
    summary: 'It shows each Shrieker\'s time alive and what it got off (the first Acidic Expulsion comes right after it spawns), and any Rawling that cast Acidic Expulsion (a raid-wide damage over time).', cols: ['When', 'Add', 'Killed', 'Got off'], rows: shRows });

  // ---- 10. avoidable damage ----
  // (each Mephitic Thrash's hit window, and whether half the raid or more was hit by it)
  const thrashW = ev.filter((c) => c.id === UL.thrash && (c.k === 'cast' || c.k === 'start')).map((c) => (c.k === 'cast' ? [c.t - 0.5, c.t + 1.5] : [c.t + 3, c.t + 5.5]))
    .map(([a0, b0]) => { const hit = new Set(ev.filter((e) => e.k === 'dmg' && h.isPlayer(e.dst) && String(e.spell).toLowerCase() === 'mephitic thrash' && e.t >= a0 && e.t <= b0 && e.amt !== 0).map((e) => e.dst)); return { a0, b0, raid: hit.size * 2 >= Math.max(10, r.players.size) }; });
  const thrashWin = (t) => thrashW.find((w) => t >= w.a0 && t <= w.b0) || null;
  const av = avoidPanel(ev, r, h, [
    { n: ['noxious splash'], label: 'Noxious Splash', harm: 'High', why: 'two egg carriers within 3 yards of each other' },
    { n: ['desperate thrash'], label: 'Desperate Thrash (Doomscale frontal)', harm: 'Medium', warnAt: 1, badAt: 2, tankOk: true, dot: 6, why: 'standing in front of a Weakened Doomscale' },
    { n: ['caustic waves'], label: 'Caustic Waves', harm: 'Medium', dot: 10, why: 'the venom waves from Ula\'tek and her tail' },
    { n: ['fester burst'], label: 'Fester Burst', harm: 'Medium', dot: 12, why: 'more than 10 yards from the Blightscale Wretch when it bursts' },
    { n: ['virulent spit'], label: 'Virulent Spit', harm: 'Medium', why: 'the swirlies in Stage 2' },
    /* (Mechanics audit, Oct 24: 2 of 5 top Mythic kills had someone clipped by a circle's edge who lived, so a hit you live through isn't red; a death is) */
    { n: ['falling debris'], label: 'Falling Debris', harm: 'Medium', why: 'the brown circles during Rage of the Shackled' + (mythic ? ' (a full hit kills anyone, tanks too)' : '') },
    { n: ["warden's protection"], label: "Warden's Protection", harm: 'Low', warnAt: 2, badAt: 5, why: 'standing on or next to an egg while its Doomscale Warden is alive' },
    // (Oct 21: the tail's Mephitic Thrash hits everyone within 35 yards as its 4 s cast ends (spell 1296301: a hit, a 10 s damage
    // over time and a knockback). Only that hit counts, not the ticks after it; tanks are judged loosely as usual)
    { n: ['mephitic thrash'], label: 'Mephitic Thrash', harm: 'Medium', warnAt: 1, badAt: 2, why: 'within 35 yards of the tail when it thrashed (knockback and a damage over time)',
      skip: (e) => { const w = thrashWin(e.t); return !w || w.raid; } }, /* (only a thrash most of the raid stayed out of is judged: a top kill had all 19 hit by both (Oct 22), so then it's raid damage) */
  ]);
  if (av) sections.push(av);

  // ---- data check: how often each tracked spell showed up in this pull ----
  const diag = Object.entries(UL_N).map(([n, id]) => {
    const c = { cast: 0, dmg: 0, aura: 0, other: 0 }, want = n === 'call of the serpent' ? UL.cots : n === 'calcified corpse' ? UL.corpse : n === 'spectral coils' ? [UL.coil, UL.coilHit] : n === "serpent's bite" ? [UL.biteCast, UL.bite] : n === 'toxic incubation' ? [UL.incub, UL.incubHit] : [id];
    for (const x of ev) if (want.includes(x.id)) { if (x.k === 'cast' || x.k === 'start') c.cast++; else if (x.k === 'dmg') c.dmg++; else if (x.k === 'aura') c.aura++; else c.other++; }
    return { name: S(n)[1], id, ...c, total: c.cast + c.dmg + c.aura + c.other };
  });
  // (the Performance tab's damage windows)
  const windows = wins.map((w, i) => ({ label: 'Rage of the Shackled ' + (i + 1), short: 'Rage ' + (i + 1), t0: w.s, t1: w.e }));
  { const pc = paceCard(ev, r, h, mistakes, "Ula'tek"); if (pc) sections.push(pc); } /* (Pace, Oct 22: boss coverage) */
  return { diag, windows, title: diff + " audit: Ula'tek", reached: phases[phases.length - 1].name, phases, marks, sections: sections.filter((s) => mythic || !s.mythicOnly), mistakes,
    note: mythic ? '' : 'Mythic-only checks (Toxic Incubation, Rancid Yolk, Revenge) are hidden on this difficulty.' };
}

// ---------- NSRT note import: compare assignments with what happened ----------
// Reads Northern Sky Raid Tools notes: the header (EncounterID/Difficulty/Name), reminder lines
// (time;ph;tag;spellid/text...) and plain text-note lines ("Guillotine 1: A B C", "{skull} Kick: A B").
const MARKER_TOKENS = { star: 1, rt1: 1, circle: 2, rt2: 2, diamond: 3, rt3: 3, triangle: 4, rt4: 4, moon: 5, rt5: 5, square: 6, rt6: 6, cross: 7, x: 7, rt7: 7, skull: 8, rt8: 8 };
const TAG_GROUPS = new Set(['everyone', 'tank', 'tanks', 'healer', 'healers', 'damager', 'dps', 'melee', 'ranged', 'group1', 'group2', 'group3', 'group4', 'group5', 'group6', 'group7', 'group8',
  'warrior', 'paladin', 'hunter', 'rogue', 'priest', 'deathknight', 'shaman', 'mage', 'warlock', 'monk', 'druid', 'demonhunter', 'evoker']);
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/-.*$/, '').trim();
const clean = (s) => String(s).replace(/\|c[0-9a-fA-F]{8}/g, '').replace(/\|r/g, '').replace(/\|T[^|]*\|t/g, '');

function parseNote(text) {
  const out = { header: {}, reminders: [], lines: [] };
  for (let raw of String(text || '').split(/\r?\n/)) {
    const line = clean(raw).trim();
    if (!line || line.startsWith('#') || line.startsWith('--')) continue;
    if (/^EncounterID:/i.test(line)) { for (const kv of line.split(';')) { const [k, ...v] = kv.split(':'); if (k) out.header[k.trim().toLowerCase()] = v.join(':').trim(); } continue; }
    if (/(^|;)\s*time:/i.test(line) && /;/.test(line)) {
      const f = {};
      for (const kv of line.split(';')) { const i = kv.indexOf(':'); if (i > 0) f[kv.slice(0, i).trim().toLowerCase()] = kv.slice(i + 1).trim(); else if (kv.trim()) f[kv.trim().toLowerCase()] = true; }
      out.reminders.push({ time: +f.time || 0, ph: +f.ph || 1, tags: String(f.tag || '').split(/\s+/).filter(Boolean), spellid: +f.spellid || 0, text: f.text || '', raw: line });
      continue;
    }
    // text-note line: optional {marker} / {spell:id} tokens, a label, then names
    const marks = [...line.matchAll(/\{(\w+)\}/g)].map((m) => MARKER_TOKENS[m[1].toLowerCase()]).filter(Boolean);
    const spells = [...line.matchAll(/\{spell:(\d+)\}/gi)].map((m) => +m[1]);
    const body = line.replace(/\{[^}]*\}/g, ' ');
    const ci = body.indexOf(':');
    const label = ci >= 0 ? body.slice(0, ci).trim() : '';
    const words = (ci >= 0 ? body.slice(ci + 1) : body).split(/[\s,]+/).map((w) => w.replace(/[()[\]]/g, '')).filter(Boolean);
    out.lines.push({ raw: line, label, marks, spells, words });
  }
  return out;
}

// (the name of every healing and raid cooldown a note can assign, for when the log never saw that exact ID (Oct 22: Revival showed
// as "Spell 115310" because the monk pressed Restoral))
const CD_NAMES = new Map(Object.entries({"633":"Lay on Hands","740":"Tranquility","1022":"Blessing of Protection","2825":"Bloodlust","6940":"Blessing of Sacrifice","10060":"Power Infusion","15286":"Vampiric Embrace","31821":"Aura Mastery","31884":"Avenging Wrath","32182":"Heroism","33206":"Pain Suppression","33891":"Incarnation: Tree of Life","47536":"Rapture","47788":"Guardian Spirit","51052":"Anti-Magic Zone","62618":"Power Word: Barrier","64843":"Divine Hymn","64844":"Divine Hymn","77764":"Stampeding Roar","80353":"Time Warp","97462":"Rallying Cry","98008":"Spirit Link Totem","102342":"Ironbark","106898":"Stampeding Roar","108280":"Healing Tide Totem","114052":"Ascendance","115310":"Revival","116849":"Life Cocoon","145629":"Anti-Magic Zone","157982":"Tranquility","192077":"Wind Rush Totem","196718":"Darkness","197721":"Flourish","200183":"Apotheosis","207399":"Ancestral Protection Totem","216331":"Avenging Crusader","264667":"Primal Rage","265202":"Holy Word: Salvation","322118":"Invoke Yu'lon, the Jade Serpent","325197":"Invoke Chi-Ji, the Red Crane","357170":"Time Dilation","359816":"Dream Flight","363534":"Rewind","370537":"Stasis","370564":"Stasis","374227":"Zephyr","374968":"Time Spiral","388615":"Restoral","390386":"Fury of the Aspects","391528":"Convoke the Spirits","421453":"Ultimate Penitence","443028":"Celestial Conduit"}).map(([k, v]) => [+k, v]));
const cdName = (id) => CD_NAMES.get(+id) || '';
// (the same button under another ID: a heal vs its cast, a talent choice for the same slot)
const CD_ALIAS = [[64843, 64844], [115310, 388615], [740, 157982], [51052, 145629]];
const cdIds = (id) => { const g = CD_ALIAS.find((x) => x.includes(id)); return g || [id]; };
function checkAssignments(r, noteText) {
  const note = parseNote(noteText), res = { note, cds: [], soaks: [], kicks: [], orbs: [], other: [], mistakes: [], unknownNames: new Set(), warnings: [] };
  const roster = new Map([...r.players.values()].map((p) => [norm(p.name), p]));
  const isName = (w) => roster.has(norm(w));
  const P = (w) => roster.get(norm(w));
  // phase starts. NSRT numbers phases 1, 2, 3 …, with an intermission as x.5 (Coiled Altar: 1, 2, 2.5, 3). The fight
  // module lists intermissions as their own phase, so whole numbers count only the real phases.
  const mph = r.module && r.module.phases && r.module.phases.length ? r.module.phases : [{ name: 'P1', start: 0 }];
  const realPh = mph.filter((p) => !/intermission/i.test(p.name)), interPh = mph.filter((p) => /intermission/i.test(p.name));
  const phaseOf = (ph) => { if (ph % 1 === 0) return realPh[ph - 1] || null; const after = realPh[Math.floor(ph) - 1]; return (after && interPh.find((p) => p.start >= after.start)) || null; };
  if (note.header.name && norm(note.header.name) !== norm(r.item.boss) && !r.item.boss.toLowerCase().includes(String(note.header.name).toLowerCase()))
    res.warnings.push('This note is for "' + note.header.name + '" but the pull is ' + r.item.boss + '.');
  const deathAt = (p) => { const d = r.deaths.filter((x) => x.guid === p.guid).map((x) => x.t); return d.length ? Math.min(...d) : null; };

  // 1) cooldown reminders assigned to named players (in time order, so each press counts for one reminder only (Oct 22))
  const claimed = new Map(), clm = (k) => { if (!claimed.has(k)) claimed.set(k, new Set()); return claimed.get(k); };
  const remAt = (x) => { const q = phaseOf(x.ph); return q ? q.start + x.time : Infinity; };
  for (const rem of note.reminders.slice().sort((a, b) => remAt(a) - remAt(b))) {
    const names = rem.tags.filter((t) => !TAG_GROUPS.has(t.toLowerCase()));
    for (const t of rem.tags) if (!TAG_GROUPS.has(t.toLowerCase()) && !isName(t)) res.unknownNames.add(t);
    if (!rem.spellid || !names.length) continue;
    // (reminders another check reads aren't cooldowns: the add curses, and the Zephyr / external for a Guillotine)
    if (r.item.boss === 'The Coiled Altar' && /curse|guillotine/i.test(rem.text)) continue;
    const phx = phaseOf(rem.ph), start = phx ? phx.start : null;
    for (const n of names) {
      const p = P(n); if (!p) continue;
      const row = { phName: phx ? phx.name : (rem.ph === 1 ? 'from the pull' : 'phase not reached'), player: p.name, ph: rem.ph, time: rem.time, spellid: rem.spellid, spell: spellNameOf(r, p, rem.spellid) || rem.text || '', ids: cdIds(rem.spellid), expected: start == null ? null : start + rem.time };
      if (row.expected == null) { row.status = 'phase not reached'; res.cds.push(row); continue; }
      if (row.expected > r.duration) { row.status = 'pull ended first'; res.cds.push(row); continue; }
      const dt = deathAt(p);
      /* (every press of that button: its ID or a variant, or the note's own spell name, so a heal ID or a talent choice in the note still matches (Oct 22)) */
      const nmL = [row.spell, rem.text].filter(Boolean).map((x) => String(x).toLowerCase().trim()), all = [...new Set(cdIds(rem.spellid).flatMap((i) => p.castTimes.get(i) || []).concat(...nmL.map((x) => (p.byName && p.byName[x]) || [])))].sort((a, b) => a - b);
      const ck = clm(p.name + '|' + cdIds(rem.spellid).join(',')), free = all.filter((u) => !ck.has(u));
      const uses = free.filter((u) => Math.abs(u - row.expected) <= 20), prevUse = free.filter((u) => u < row.expected - 20 && u > row.expected - 180).pop();
      if (uses.length) {
        const u = uses.reduce((a, b) => (Math.abs(b - row.expected) < Math.abs(a - row.expected) ? b : a)); ck.add(u);
        row.used = u; row.delta = u - row.expected;
        // (healing cooldowns are timed around raid damage that doesn't land on the exact second: within 5 s is on time, and only
        // over 10 s off is a medium mistake)
        row.status = Math.abs(row.delta) <= 8 ? 'on time' : row.delta > 0 ? 'late' : 'early';
        if (row.status !== 'on time') res.mistakes.push({ t: u, player: p.name, mechanic: 'Assigned cooldown', id: rem.spellid, severity: 'Low',
          detail: 'Used ' + (row.spell || 'their assigned cooldown') + ' ' + Math.abs(row.delta).toFixed(1) + ' s ' + (row.delta > 0 ? 'late' : 'early') + ' (assigned at ' + fmtT(row.expected) + ', P' + rem.ph + ' ' + fmtT(rem.time) + ').', fix: 'Press it when the NSRT reminder counts down to 0.' });
      } else if (dt != null && dt < row.expected) row.status = 'dead before it';
      else if (free.some((u) => u > row.expected + 20 && u <= row.expected + 45)) { /* (pressed, just well after the reminder: late, not missed (Oct 22)) */ const u = free.find((x) => x > row.expected + 20 && x <= row.expected + 45); ck.add(u); row.used = u; row.delta = u - row.expected; row.status = 'late';
        res.mistakes.push({ t: u, player: p.name, mechanic: 'Assigned cooldown', id: rem.spellid, severity: 'Low', detail: 'Used ' + (row.spell || 'their assigned cooldown') + ' ' + row.delta.toFixed(0) + ' s late (assigned at ' + fmtT(row.expected) + ').', fix: 'Press it when the NSRT reminder counts down to 0.' }); }
      else if (prevUse != null) { /* (pressed earlier and still recharging: early, not missed) */ ck.add(prevUse); row.used = prevUse; row.delta = prevUse - row.expected; row.status = 'early'; row.onCd = true;
        res.mistakes.push({ t: prevUse, player: p.name, mechanic: 'Assigned cooldown', id: rem.spellid, severity: 'Low', detail: 'Used ' + (row.spell || 'their assigned cooldown') + ' at ' + fmtT(prevUse) + ', ' + Math.abs(row.delta).toFixed(0) + ' s before its reminder (' + fmtT(row.expected) + '), so it was still recharging when the reminder came.', fix: 'Hold it for the reminder, or tell the raid leader to move it in the note.' }); }
      else {
        row.status = 'missed';
        res.mistakes.push({ t: row.expected, player: p.name, mechanic: 'Assigned cooldown', id: rem.spellid, severity: 'Medium',
          detail: 'Never used ' + (row.spell || 'their assigned spell') + ' for the assignment at ' + fmtT(row.expected) + ' (P' + rem.ph + ' ' + fmtT(rem.time) + ').', fix: 'Assigned cooldowns are planned around the damage. If it was on cooldown, tell the raid leader so the plan can change.' });
      }
      res.cds.push(row);
    }
  }

  // 2) text-note lines: soak teams, kick teams by marker, orb carriers, everything else
  const mod = r.module && r.module.sections ? r.module : null;
  const soakSec = mod && r.module._soaks, carriers = mod && r.module._carriers, orbLines = [];
  for (const ln of note.lines) {
    if (/^invitelist$/i.test(ln.label)) continue; // NSRT's roster line, not an assignment
    const names = ln.words.filter(isName), unknown = ln.words.filter((w) => !isName(w) && /^[A-Za-zÀ-ÿ']{3,}$/.test(w) && w[0] === w[0].toUpperCase());
    if (!names.length) continue;
    unknown.forEach((w) => { if (!/^(Guillotine|Grim|Soak|Kick|Kicks|Interrupt|Purple|Orb|Orbs|Group|Team|Set|Left|Right|Back|Front|Melee|Ranged)$/i.test(w)) res.unknownNames.add(w); });
    const lab = (ln.label + ' ' + ln.raw).toLowerCase();
    // the soak number follows "Soak" / "Guillotine" ("P1 Soak 2" is soak 2, not 1); a "P1"/"P3" in the label says
    // which phase (P1 has Guillotine, P3 Grim Guillotine); otherwise the first number that isn't a phase
    const num = +((ln.label.match(/(?:soak|guillotine)\s*#?\s*(\d+)/i) || ln.label.replace(/\bp\s*\d\b/ig, '').match(/(\d+)/) || [])[1] || 0);
    const phN = +((ln.label.match(/\bp\s*(\d)\b/i) || [])[1] || 0);
    if (/guillotine|soak/.test(lab) && !/ghost/.test(lab) && soakSec) {
      const grim = phN === 3 || (phN !== 1 && /grim/.test(lab)), list = soakSec.filter((s) => s.grim === grim);
      // (a drop that never landed, like one cut off by the phase change, isn't checked)
      const s0 = num ? list[num - 1] : null, s = s0 && s0.landed !== false ? s0 : null;
      const row = { label: ln.label || ln.raw, assigned: names.map((n) => P(n).name), soak: s, kind: 'soak' };
      const nm = (grim ? 'Grim Guillotine ' : 'Guillotine ') + (num || '');
      // "External Guillotine Target: X" / "Zephyr Guillotine: X": X casts it for that drop; X isn't a soaker
      if (/external|zephyr/i.test(lab)) {
        row.kind = /zephyr/i.test(lab) ? 'zephyr' : 'external';
        if (s) {
          // (an assigned player who is the target themselves covers it with their own protection)
          const did = row.kind === 'zephyr' ? s.zep : s.ext.map((x) => x.who).concat(s.target && (s.selfProt || []).length ? [s.target] : []);
          row.missing = row.assigned.filter((n) => !did.includes(n) && !deadAt(r, n, s.hit)); row.extra = [];
          const others = row.kind === 'external' ? [...new Set(s.ext.map((x) => x.who).filter((w) => !row.assigned.includes(w)))] : [];
          row.info = row.kind === 'zephyr' ? (s.zep.length ? 'Zephyr from ' + [...new Set(s.zep)].join(', ') : 'no Zephyr') + (s.zepEarly || []).filter((z) => row.missing.includes(z.who)).map((z) => ' · ' + z.who + ' used it at ' + fmtT(z.t) + ' (on cooldown)').join('')
            : (s.target ? (s.ext.map((x) => x.spell + ' (' + x.who + ')').concat((s.selfProt || []).map((sp) => sp + ' (on themselves)')).join(', ') || 'no external') : 'target not found');
          row.target = s.target;
          // (an external or Zephyr the note assigns is a job, not a nice-to-have: missed with nobody else covering it, it's serious)
          for (const n of row.missing) res.mistakes.push({ t: s.hit, player: n, mechanic: (grim ? 'Grim ' : '') + 'Guillotine assignment', id: grim ? 1299267 : 1283489, severity: others.length ? 'Low' : 'High', detail: row.kind === 'external' && others.length ? 'Was assigned the external on the ' + nm + ' target' + (s.target ? ' (' + s.target + ')' : '') + ', but ' + others.join(' and ') + ' covered it instead.' : row.kind === 'zephyr' ? 'Was assigned Zephyr for ' + nm + ' but didn\'t cast it' + ((s.zepEarly || []).filter((z) => z.who === n).map((z) => ': it was on cooldown, used at ' + fmtT(z.t)).pop() || '') + '.' : 'Was assigned to put an external on the ' + nm + ' target' + (s.target ? ' (' + s.target + ')' : '') + ' but didn\'t.', fix: row.kind === 'zephyr' ? 'Cast Zephyr just before the axe lands, with the soakers in range.' : 'Watch who gets the Guillotine debuff and put your external on them before the axe lands.' });
        } else row.note = num ? 'This pull had no ' + nm.trim() + '.' : 'No soak number in the label, so it can\'t be matched to a specific soak.';
        res.soaks.push(row); continue;
      }
      if (s) {
        const got = new Set(s.who);
        // (the axe's target is picked by the game and stands in the circle by definition: never an "extra" soaker)
        row.missing = row.assigned.filter((n) => !got.has(n) && !deadAt(r, n, s.hit)); row.extra = [...got].filter((n) => !row.assigned.includes(n) && n !== s.target);
        if (s.target && !row.assigned.includes(s.target)) row.info2 = 'target: ' + s.target;
        for (const n of row.missing) res.mistakes.push({ t: s.t, player: n, mechanic: (grim ? 'Grim ' : '') + 'Guillotine assignment', id: grim ? 1299267 : 1283489, severity: 'Medium', detail: 'Was assigned to ' + (row.label || 'this soak') + ' but wasn\'t in it.', fix: 'Check your soak number before the pull. The soak is planned around exactly this group.' });
        for (const n of row.extra) res.mistakes.push({ t: s.t, player: n, mechanic: (grim ? 'Grim ' : '') + 'Guillotine assignment', id: grim ? 1299267 : 1283489, severity: 'Low', detail: 'Soaked ' + (row.label || 'a Guillotine') + ' without being assigned to it.', fix: 'Extra soakers pick up a vulnerability that breaks the next soak rotation. Only soak your own number.' });
      } else row.note = num ? 'This pull had no ' + nm.trim() + '.' : 'No soak number in the label, so it can\'t be matched to a specific soak.';
      res.soaks.push(row); continue;
    }
    if (/kick|interrupt/.test(lab)) {
      const mark = ln.marks[0] || 0;
      const kicks = r.interrupts.filter((k) => !mark || k.marker === mark);
      const by = new Map(); for (const k of kicks) by.set(k.player, (by.get(k.player) || 0) + 1);
      const assigned = names.map((n) => P(n).name);
      const row = { label: ln.label || 'Kicks', mark, assigned, by, idle: assigned.filter((n) => !by.has(n)), outside: [...by.keys()].filter((n) => !assigned.includes(n)) };
      const missedOnMark = (r.missedKicks || []).filter((m) => !mark || m.marker === mark).length;
      row.missed = missedOnMark;
      if (missedOnMark) for (const n of row.idle) res.mistakes.push({ t: 0, player: n, mechanic: 'Kick assignment', id: 0, severity: 'Low', detail: 'Was on the ' + (row.label || 'kick') + ' rotation but landed no kicks, and ' + missedOnMark + ' cast' + (missedOnMark === 1 ? '' : 's') + ' got through on ' + (mark ? 'that marker' : 'those adds') + '.', fix: 'Check your kick order and have the interrupt ready when it\'s your turn.' });
      res.kicks.push(row); continue;
    }
    if (/\b(purple|orbs?|mutation)\b|clean ?up/.test(lab) && carriers) { orbLines.push(ln); continue; } // (checked together below)
    res.other.push({ label: ln.label, raw: ln.raw, names: names.map((n) => P(n).name) });
  }
  // 2b) orb carriers. NSRT's timed reminders say who grabs which orb in each phase ("Grab {cross} purple orb", "Grab side
  // green orb", "Green orb backup"), once per orb wave. Each wave is checked against the pickups in the log: Mutagenic Venom
  // landing on a player is a purple pickup, Volatile Venom a green one. A phase that wasn't reached, and a wave nobody
  // picked an orb up in (no orbs came), aren't judged. Without timed reminders the text lists are read over the whole pull.
  // Purple orbs are hard-assigned, so anyone else picking one up is a mistake; green orbs are only listed.
  try { if (mod && mod._orbPicks && (note.reminders.some((x) => /\borbs?\b/i.test(x.text)) || orbLines.length)) orbCheck(); } catch (e) { res.warnings.push('Couldn\'t check the orb carriers: ' + e.message); }
  function orbCheck() {
    const picks = mod._orbPicks, kindOf = (s) => (/backup|helper/i.test(s) ? 'helper' : /purple/i.test(s) ? 'purple' : /green/i.test(s) ? 'green' : null);
    const ents = new Map(), add = (ph, kind, names, time) => {
      if (!kind || !names.length) return; const k = ph + '|' + kind; let e = ents.get(k); if (!e) ents.set(k, e = { ph, kind, names: new Set(), times: new Set() });
      names.forEach((n) => e.names.add(n)); if (time != null) e.times.add(time);
    };
    const timed = note.reminders.filter((x) => /\borbs?\b/i.test(x.text) && kindOf(x.text));
    if (timed.length) for (const x of timed) add(x.ph, kindOf(x.text), x.tags.filter(isName).map((n) => P(n).name), x.time);
    else for (const ln of orbLines) add(null, kindOf(ln.label + ' ' + ln.raw), ln.words.filter(isName).map((n) => P(n).name), null);
    const ORD = { purple: 0, green: 1, helper: 2 }, KIND = { purple: 'Purple orbs', green: 'Green orbs', helper: 'Green orb backups' };
    const inWin = (arr, x) => arr.filter((p) => p.t >= x - 4 && p.t <= x + 16);
    for (const e of [...ents.values()].sort((a, b) => (a.ph || 0) - (b.ph || 0) || ORD[a.kind] - ORD[b.kind])) {
      const list = e.kind === 'purple' ? picks.purple : picks.green, names = [...e.names];
      const row = { label: (e.ph != null ? 'P' + e.ph + ' · ' : '') + KIND[e.kind], kind: e.kind, ph: e.ph, assigned: names, got: new Map(names.map((n) => [n, { n: 0, of: 0 }])), outside: new Map(), note: '', waves: null };
      if (e.ph == null) {
        // whole-pull totals
        for (const p of list) { if (row.got.has(p.n)) row.got.get(p.n).n++; else if (e.kind === 'purple' || e.kind === 'green') { const o = row.outside.get(p.n) || { n: 0, t: p.t }; o.n++; row.outside.set(p.n, o); } }
        if (e.kind === 'green') { const helpers = new Set([...ents.values()].filter((x) => x.kind === 'helper').flatMap((x) => [...x.names])); for (const n of [...row.outside.keys()]) if (helpers.has(n)) row.outside.delete(n); }
        if (e.kind === 'helper') row.outside.clear();
        row.note = 'Whole pull (this note has no timed orb reminders)';
      } else {
        const px = phaseOf(e.ph);
        if (!px) { row.note = 'Phase not reached'; row.waves = 0; res.orbs.push(row); continue; }
        const end = Math.min(px.end != null ? px.end : r.duration, r.duration);
        const waves = [...e.times].sort((a, b) => a - b).map((t) => px.start + t).filter((x) => x + 12 <= end + 0.5);
        const greenNames = new Set([...ents.values()].filter((x) => x.ph === e.ph && x.kind !== 'purple').flatMap((x) => [...x.names]));
        const purpleNames = new Set([...ents.values()].filter((x) => x.ph === e.ph && x.kind === 'purple').flatMap((x) => [...x.names]));
        let n = 0;
        for (const x of waves) {
          const pk = inWin(list, x); if (!pk.length) continue; // no orbs of this colour came that wave
          n++; const got = new Set(pk.map((p) => p.n));
          for (const nm of names) { const g = row.got.get(nm); if (deadAt(r, nm, x)) continue; g.of++; if (got.has(nm)) g.n++; }
          if (e.kind === 'helper') continue;
          const mine = e.kind === 'purple' ? purpleNames : greenNames;
          for (const nm of got) if (!mine.has(nm)) { if (e.kind === 'green' && purpleNames.has(nm)) continue; const o = row.outside.get(nm) || { n: 0, t: x }; o.n++; row.outside.set(nm, o); }
        }
        row.waves = n; row.note = n ? n + (n === 1 ? ' set' : ' sets') + ' checked' : 'No orb sets in this phase';
      }
      res.orbs.push(row);
      if (e.kind !== 'purple') continue;
      // mistakes: someone else picked up a purple orb (Low), and an assigned carrier whose orb was taken by someone else (Low)
      const what = (row.ph != null ? ' in P' + row.ph : '');
      for (const [nm, o] of row.outside) res.mistakes.push({ t: o.t, player: nm, mechanic: 'Orb assignment', id: 0, severity: 'Low', detail: 'Picked up ' + (o.n === 1 ? 'a purple orb' : o.n + ' purple orbs') + what + ' without being on the purple orb list.', fix: 'Purple orbs are for the assigned carriers only. Everyone else moves green orbs out of their way.' });
      if (row.ph != null && row.outside.size) for (const [nm, g] of row.got) if (g.of && g.n === 0) res.mistakes.push({ t: px0(row), player: nm, mechanic: 'Orb assignment', id: 0, severity: 'Low', detail: 'Was assigned a purple orb' + what + ' but picked none up' + (g.of > 1 ? ' in ' + g.of + ' sets' : '') + '. Someone who wasn\'t assigned took them.', fix: 'Be at the orb when it lands, because your carrier spot is planned around you.' });
    }
    function px0(row) { const px = phaseOf(row.ph); return px ? px.start : 0; }
  }
  // 3) boss-specific assignments, read by section heading (a line with no names, e.g. "Broodling Kicks - Area Assign")
  try { if (r.item.boss === 'The Twin Fangs' && r.module && r.module._feasts) twinFangsAssign(r, note, res, isName, P); } catch (e) { res.warnings.push('Couldn\'t check the Twin Fangs assignments: ' + e.message); }
  try { if (r.item.boss === 'Entombed Sentinels' && r.module && r.module._sides) sentinelsAssign(r, note, res, isName, P); } catch (e) { res.warnings.push('Couldn\'t check the Entombed Sentinels assignments: ' + e.message); }
  try { if (r.item.boss === 'Sszorak' && r.module && r.module._sz) sszorakAssign(r, note, res, isName, P); } catch (e) { res.warnings.push('Couldn\'t check the Sszorak assignments: ' + e.message); }
  try { if (r.item.boss === 'Nymrissa Wavecaller' && r.module && r.module._ny) nymrissaAssign(r, note, res, isName, P); } catch (e) { res.warnings.push('Couldn\'t check the Nymrissa assignments: ' + e.message); }
  try { if (r.item.boss === "Nek'zali the Soulcoiler" && r.module && r.module._nz) nekzaliAssign(r, note, res, isName, P); } catch (e) { res.warnings.push('Couldn\'t check the Nek\'zali assignments: ' + e.message); }
  try { if (r.item.boss === 'The Coiled Altar') coiledAltarAssign(r, note, res, isName, P, realPh); } catch (e) { res.warnings.push('Couldn\'t check the Coiled Altar assignments: ' + e.message); }
  try { if (r.item.boss === 'The Coiled Altar') coiledAltarNote(r, note, res, isName, P, phaseOf); } catch (e) { res.warnings.push('Couldn\'t check the Coiled Altar CC and curse assignments: ' + e.message); }
  try { if (root.NDZ_JOBS && root.NDZ_JOBS()) noteJobsCheck(r, note, res, isName, P); } catch (e) { res.warnings.push('Couldn\'t check the dispel, grip and kick jobs: ' + e.message); }
  res.unknownNames = [...res.unknownNames].slice(0, 20);
  for (const m of res.mistakes) m.fromNote = true; // (every miss here comes from the note: Mechanics leaves them to Assignments)
  return res;
}

// Note jobs Debrief checks on any boss (Oct 20, the test copy only until it goes live: ui.js turns it on with
// window.NDZ_JOBS). Lines no other check read: dispel jobs (who removed the boss's debuff), grips, slows, Banish and
// Freedom (who pressed them), and the intstart kick teams on bosses without their own kick check (Ula'tek: each line
// is one side's team, and each Doomscale belongs to the team that kicked it most). A kick line named after an add
// ("Iku Kicks") counts only the kicks on that add. Lines read here leave "Lines Debrief doesn't check yet".
const JOB_DISPEL = { "Nek'zali the Soulcoiler": 'Essence Rend', 'Vashnik the Malignant': 'Exploding Infection', 'Entombed Sentinels': 'Blighted Blood', "Kith'ix": 'Overwhelming Fear', 'The Lost Explorers': 'Icebound Flames' };
const JOB_PRESS = [
  { re: /grip/i, kind: 'grip', what: 'grips', none: 'pressed no grip', fix: 'Grip strays into the cleave as they come. Say so in voice when your grip is on cooldown.', spells: /^(Death Grip|Gorefiend's Grasp|Abomination Limb|Ursol's Vortex|Sigil of Chains|Ring of Peace)$/i },
  { re: /slow/i, kind: 'slow', what: 'slows', none: 'pressed no slow', fix: 'Slow the adds as they walk in, so they die before they get anywhere.', spells: /^(Binding Shot|Chains of Ice|Typhoon|Ring of Frost|Earthgrab Totem|Earthbind Totem|Landslide|Shadowfury|Leg Sweep|Frost Nova|Ursol's Vortex|Sigil of Chains|Mass Entanglement|Tar Trap)$/i },
  { re: /banish/i, kind: 'banish', what: 'Banish', none: 'never cast Banish', fix: 'Banish the add the note gives you, and cast it again before it breaks.', spells: /^Banish$/i },
  { re: /freedom/i, kind: 'freedom', what: 'Blessing of Freedom', none: 'never cast Blessing of Freedom', fix: 'Put Blessing of Freedom on the tank as soon as they\'re slowed.', spells: /^Blessing of Freedom$/i },
];
const andJ = (l) => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1]);
const JOB_KICKADD = { "Ula'tek": /doomscale/i };
function noteJobsCheck(r, note, res, isName, P) {
  const left = new Set(res.other.map((o) => o.raw)), ps = [...r.players.values()], byN = new Map(ps.map((p) => [norm(p.name), p]));
  const dl = [], pl = [], intL = []; let head = '', blk = false;
  for (const ln of note.lines) {
    const w = ln.raw.trim().toLowerCase();
    if (w === 'intstart') { blk = true; continue; } if (w === 'intend') { blk = false; continue; }
    const names = [...new Set(ln.words.filter(isName).map((n) => P(n).name))];
    if (blk) { if (left.has(ln.raw) && names.length) intL.push({ raw: ln.raw, names }); continue; }
    if (!names.length) { head = ln.raw; continue; }
    if (!left.has(ln.raw)) continue;
    if (/dispel/i.test(ln.label + ' ' + head)) dl.push({ label: ln.label || head, head, raw: ln.raw, names });
    else { const j = JOB_PRESS.find((x) => x.re.test(ln.label)); if (j) pl.push({ label: ln.label, raw: ln.raw, names, j }); }
  }
  const done = new Set([...dl, ...pl, ...intL].map((l) => l.raw)); res.other = res.other.filter((o) => !done.has(o.raw));
  const out = res.jobs = { dispels: null, presses: [], teams: null };
  const alive = (n, t) => !deadAt(r, n, t);
  // -- dispels: the debuff the heading names when the pull had it, else the boss's known one
  if (dl.length) {
    const all = ps.flatMap((p) => (p.dispL || []).filter((d) => !d.foe).map((d) => Object.assign({ who: p.name }, d)));
    const want = [String(dl[0].head || '').replace(/\bdispels?\b/ig, '').trim(), JOB_DISPEL[r.item.boss]].filter(Boolean);
    const aura = want.find((a) => all.some((d) => String(d.aura).toLowerCase() === a.toLowerCase())) || JOB_DISPEL[r.item.boss] || want[0] || 'the debuff';
    const hits = all.filter((d) => String(d.aura).toLowerCase() === aura.toLowerCase()).sort((a, b) => a.t - b.t);
    const roleOf = (on) => { const p = byN.get(norm(on)); if (!p) return null; if (p.role === 'healer' || p.role === 'tank') return p.role; return JOB_MELEE.has(p.specId) ? 'melee' : 'ranged'; };
    const assigned = [...new Set(dl.flatMap((l) => l.names))];
    const rows = dl.map((l) => {
      const ro = (/\b(healer|melee|ranged|tank)s?\b/i.exec(l.label) || [])[1], mine = ro ? hits.filter((d) => roleOf(d.on) === ro.toLowerCase()) : hits;
      const by = new Map(); for (const d of mine) by.set(d.who, (by.get(d.who) || 0) + 1);
      const backup = /backup|back-up|spare/i.test(l.label), did = l.names.reduce((s, n) => s + (by.get(n) || 0), 0);
      const others = [...by].filter(([n]) => !l.names.includes(n)).map(([n, k]) => ({ who: n, n: k }));
      const st = !mine.length ? 'na' : did || backup ? 'ok' : 'warn';
      return { label: l.label, role: ro ? ro.toLowerCase() : null, names: l.names, by, of: mine.length, did, backup, others, st, first: mine.length ? mine[0].t : null };
    });
    for (const x of rows) if (x.st === 'warn') for (const n of x.names) if (alive(n, x.first)) res.mistakes.push({ t: x.first, player: n, mechanic: 'Dispel job', id: 0, severity: 'Low', fromNote: true,
      detail: 'Was on ' + aura + ' dispels (' + x.label + ') but didn\'t dispel any' + (x.others.length ? ': ' + andJ(x.others.map((o) => o.who)) + ' did them.' : '.'), fix: 'Dispel your marked players as soon as they\'re in place, so nobody else has to leave their spot or spend a global on it.' });
    const by = new Map(); for (const d of hits) by.set(d.who, (by.get(d.who) || 0) + 1);
    out.dispels = { aura, n: hits.length, rows, outside: [...by].filter(([n]) => !assigned.includes(n)).map(([n, k]) => ({ who: n, n: k })) };
  }
  // -- grips, slows, Banish, Freedom: who pressed them. Nobody pressing one isn't judged (the adds may not have needed
  // it); someone on the job pressing none while others did is a slip
  for (const l of pl) {
    const cnt = (p) => { const sp = p ? [...p.castAb.values()].filter((c) => l.j.spells.test(c.name)) : []; return { n: sp.reduce((s, c) => s + c.n, 0), sp: [...new Set(sp.map((c) => c.name))], t0: Math.min(Infinity, ...sp.flatMap((c) => p.castTimes.get(c.id) || [])) }; };
    const per = l.names.map((n) => Object.assign({ who: n }, cnt(byN.get(norm(n)))));
    const others = ps.filter((p) => !l.names.includes(p.name)).map((p) => Object.assign({ who: p.name }, cnt(p))).filter((x) => x.n);
    const any = per.some((x) => x.n) || others.length, idle = per.filter((x) => !x.n).map((x) => x.who), t0 = Math.min(...per.concat(others).map((x) => x.t0));
    out.presses.push({ label: l.label, kind: l.j.kind, what: l.j.what, per, others, st: !any ? 'na' : idle.length ? 'warn' : 'ok', idle });
    if (any) for (const n of idle) if (alive(n, t0)) res.mistakes.push({ t: isFinite(t0) ? t0 : 0, player: n, mechanic: 'Note job', id: 0, severity: 'Low', fromNote: true,
      detail: 'Was on ' + l.label + ' but ' + l.j.none + ' this pull' + (others.length ? '; ' + andJ(others.map((x) => x.who)) + ' did.' : '.'), fix: l.j.fix });
  }
  // -- intstart kick teams (bosses without their own kick check): each add belongs to the team that kicked it most
  if (intL.length) {
    const re = JOB_KICKADD[r.item.boss], units = (r.kickUnits || []).filter((u) => (!re || re.test(u.name || '')) && (u.kicked.length || u.missed.length));
    const nmT = r.item.boss === "Ula'tek" && intL.length === 2 ? ['Left team', 'Right team'] : intL.map((x, i) => 'Kick line ' + (i + 1));
    const teams = intL.map((l, i) => ({ label: nmT[i], names: l.names, adds: [], by: new Map(), outside: new Map(), missed: 0 })), loose = [];
    for (const u of units) {
      const score = teams.map((tm) => u.kicked.filter((k) => tm.names.includes(k.player)).length), best = Math.max(0, ...score), k = best ? score.indexOf(best) : -1;
      if (k < 0) { if (u.missed.length) loose.push({ name: u.label || u.name, missed: u.missed.length, t: u.missed[0].t }); continue; }
      const tm = teams[k]; tm.adds.push(u.label || u.name); tm.missed += u.missed.length; if (u.missed.length && tm.firstMiss == null) tm.firstMiss = u.missed[0].t;
      for (const x of u.kicked) { const m = tm.names.includes(x.player) ? tm.by : tm.outside; m.set(x.player, (m.get(x.player) || 0) + 1); }
    }
    for (const tm of teams) { tm.idle = tm.names.filter((n) => !tm.by.has(n)); tm.st = !tm.adds.length ? 'na' : tm.missed ? 'bad' : tm.outside.size ? 'warn' : 'ok';
      if (tm.missed) for (const n of tm.idle) if (alive(n, tm.firstMiss)) res.mistakes.push({ t: tm.firstMiss, player: n, mechanic: 'Kick assignment', id: 0, severity: 'Low', fromNote: true,
        detail: 'Was on the ' + tm.label.toLowerCase() + ' but landed no kicks, and ' + tm.missed + ' cast' + (tm.missed > 1 ? 's' : '') + ' got through on that side.', fix: 'Watch your side\'s add and take your turn in the kick order.' }); }
    for (const x of loose) res.mistakes.push({ t: x.t, player: 'Raid', mechanic: 'Kick assignment', id: 0, severity: 'Low', fromNote: true, detail: x.name + ': ' + x.missed + ' cast' + (x.missed > 1 ? 's' : '') + ' got through and no kick team kicked it.', fix: 'Each add has a team from the note. Make sure every add has its team in range.' });
    out.teams = { teams, loose, adds: units.length, t: units.length ? Math.min(...units.map((u) => u.spawn || 0)) : null };
  }
  // -- a kick line named after an add ("Iku Kicks"): only the kicks on that add count
  for (const k of res.kicks) {
    if (k.mark) continue; const ws = String(k.label).toLowerCase().split(/[^a-z']+/).filter((x) => x.length > 3 && !/^(kick|kicks|interrupt|interrupts|team|order)$/.test(x));
    const us = (r.kickUnits || []).filter((u) => ws.some((x) => String(u.name || '').toLowerCase().split(/\s+/).includes(x))); if (!us.length) continue;
    const by = new Map(); for (const u of us) for (const x of u.kicked) by.set(x.player, (by.get(x.player) || 0) + 1);
    Object.assign(k, { by, idle: k.assigned.filter((n) => !by.has(n)), outside: [...by.keys()].filter((n) => !k.assigned.includes(n)), missed: us.reduce((s, u) => s + u.missed.length, 0), add: us[0].name });
    const was = 'Was on the ' + (k.label || 'kick') + ' rotation'; res.mistakes = res.mistakes.filter((m) => !(m.mechanic === 'Kick assignment' && String(m.detail).startsWith(was))); /* (the general check counted every add's casts) */
    const t0 = Math.min(...us.flatMap((u) => u.missed.map((x) => x.t)));
    if (k.missed) for (const n of k.idle) if (alive(n, t0)) res.mistakes.push({ t: t0, player: n, mechanic: 'Kick assignment', id: 0, severity: 'Low', fromNote: true, detail: was + ' but landed no kicks, and ' + k.missed + ' ' + k.add + ' cast' + (k.missed > 1 ? 's' : '') + ' got through.', fix: 'Take your turn in the kick order on ' + k.add + '.' });
  }
}
const JOB_MELEE = new Set([71, 72, 73, 70, 66, 250, 251, 252, 259, 260, 261, 268, 269, 577, 581, 103, 104, 263, 255]);
// A spell's name for a note reminder: the player's own cast of it, else anyone's in the pull, else any name the log used
// for that ID (so a reminder that wasn't pressed still reads "Zephyr", not a number)
function spellNameOf(r, p, id) {
  const of = (q) => (q && q.castAb && [...q.castAb.values()].find((c) => c.id === id) || {}).name;
  let n = of(p); if (n) return n;
  if (CD_NAMES.has(id)) return CD_NAMES.get(id); /* (our own name for a raid or healing cooldown (Oct 22)) */
  for (const q of r.players.values()) { n = of(q); if (n) return n; }
  for (const [k, v] of SPELLID) if (v === id) return k.replace(/(^|[\s:'-])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/ (Of|The|And) /g, (m) => m.toLowerCase());
  return '';
}
// Dead at time t: died before t and did nothing after that death (a battle res brings them back).
function deadAt(r, name, t) {
  const ds = r.deaths.filter((d) => d.player === name && d.t < t); if (!ds.length) return false;
  const last = Math.max(...ds.map((d) => d.t)), p = [...r.players.values()].find((x) => x.name === name);
  return !(p && [...p.castTimes.values()].some((ts) => ts.some((x) => x > last + 1 && x <= t + 5)));
}

// Coiled Altar NSRT kick assignments (Mythic, P2 and P3), read the way NSRT reads them: a block between "intstart" and
// "intend", one kick rotation per line. Line 1 kicks the Spiteful Soulcoiler with no raid marker, line 2 the marked one
// (raid leaders mark the ranged add). Optional lines 3-4 replace them for P3, and 5-6 for the second P3 set (NSRT
// switches 159.2s into P3, 6s early). A name can appear more than once. NSRT counts kicks per add: the 1st successful
// interrupt is name 1's, the 2nd name 2's, and so on, repeating; a cast that gets through doesn't move the count on, so
// it was the turn of whoever was up.
function coiledAltarAssign(r, note, res, isName, P, realPh) {
  const lines = []; let on = false;
  for (const ln of note.lines) {
    const w = ln.raw.trim().toLowerCase();
    if (w === 'intstart') { on = true; continue; }
    if (w === 'intend') break;
    if (on) lines.push({ raw: ln.raw, names: ln.words.filter(isName).map((n) => P(n).name) });
  }
  if (!lines.length) return;
  // these lines are handled here, not as generic "other" lines
  res.other = res.other.filter((o) => !lines.some((l) => l.raw === o.raw));
  const pair = (i) => (lines[i] && lines[i + 1] ? [lines[i].names, lines[i + 1].names] : null);
  const p2 = pair(0) || [lines[0] ? lines[0].names : [], []], p3a = pair(2) || p2, p3b = pair(4) || p3a;
  const p2t = realPh[1] ? realPh[1].start : null, p3t = realPh[2] ? realPh[2].start : null;
  const units = (r.kickUnits || []).filter((u) => /soulcoiler/i.test(u.name || '')).sort((a, b) => a.spawn - b.spawn);
  if (!units.length) { res.boss = { ca: { lines, sets: [], none: true } }; return; }
  const dead = (n, t) => deadAt(r, n, t);
  const sets = new Map();
  for (const u of units) {
    const marked = u.marker > 0 || u.kicked.some((k) => k.marker > 0);
    const inP3 = p3t != null && u.spawn >= p3t - 1, wave2 = inP3 && u.spawn >= p3t + 159.2 - 6;
    const use = inP3 ? (wave2 ? p3b : p3a) : p2, line = marked ? use[1] : use[0];
    const kicks = u.kicked.slice().sort((a, b) => a.t - b.t), rows = [];
    kicks.forEach((k, i) => { const want = line.length ? line[i % line.length] : null; rows.push({ t: k.t, who: k.player, want, n: i + 1, ok: !want || k.player === want, listed: line.includes(k.player) }); });
    const gotOff = u.missed.map((m) => { const before = kicks.filter((k) => k.t < m.t).length, want = line.length ? line[before % line.length] : null; return { t: m.t, want, n: before + 1, dead: want ? dead(want, m.t) : false }; });
    for (const g of gotOff) if (g.want && !g.dead) res.mistakes.push({ t: g.t, player: g.want, mechanic: 'Kick assignment', id: 0, severity: 'Medium', fromNote: true, detail: 'A Spiteful Soulcoiler cast got through on their turn (kick ' + g.n + ' on the ' + (marked ? 'marked' : 'unmarked') + ' add, set ' + u.wave + ').', fix: 'Watch the NSRT box on the add. When it shows your name, have your interrupt ready and kick the cast.' });
    for (const k of rows) if (!k.ok && k.listed) res.mistakes.push({ t: k.t, player: k.who, mechanic: 'Kick order', id: 0, severity: 'Low', fromNote: true, detail: 'Kicked the ' + (marked ? 'marked' : 'unmarked') + ' Spiteful Soulcoiler out of turn (kick ' + k.n + ', set ' + u.wave + '): it was ' + k.want + '\'s.', fix: 'Kick only when the NSRT box shows your name. Kicking early takes the next player\'s turn.' });
    let s = sets.get(u.wave); if (!s) sets.set(u.wave, s = { set: u.wave, t: u.spawn, phase: inP3 ? (wave2 ? 'P3, 2nd set' : 'P3') : 'P2', adds: [] });
    s.adds.push({ marked, line, kicks: rows, gotOff, died: u.died, first: kicks.length ? kicks[0].t - u.spawn : null });
  }
  for (const s of sets.values()) s.adds.sort((a, b) => a.marked - b.marked);
  res.boss = { ca: { lines, sets: [...sets.values()].sort((a, b) => a.t - b.t), p2, p3a, p3b, hasP3: !!pair(2), hasP3b: !!pair(4) } };
}

// Coiled Altar NSRT lines read here, each checked against the log:
// - the CC order on Dreadmarch's mind controls ("1st CC on Mindcontrol: A" … and "CC Mindcontrol" reminders). Every
//   Dreadmarch counts: the first player on the order who isn't mind controlled or dead is up first, the rest follow
//   in order (a CC on cooldown hands it to the next one). Nobody CCing a mind control that lasts is the mistake.
// - the add curses ("Curse Unmarked Add: A", "Curse Raid-Marked Add: B", or the same as reminders): each Spiteful
//   Soulcoiler should get its assigned warlock's curse. Sets in phases the reminders don't cover aren't judged.
function coiledAltarNote(r, note, res, isName, P, phaseOf) {
  const m = r.module; if (!m || m.error) return;
  const names = (arr) => [...new Set(arr.filter(isName).map((n) => P(n).name))];
  const drop = (re) => { res.other = res.other.filter((o) => !re.test((o.label || '') + ' ' + o.raw)); };
  const isMc = (s) => /mind ?control|dreadmarch/i.test(s) && /\bcc\b|crowd|stun/i.test(s);
  const ORD = { '1st': 1, first: 1, '2nd': 2, second: 2, '3rd': 3, third: 3, '4th': 4, fourth: 4, '5th': 5, fifth: 5, '6th': 6, sixth: 6 };
  const order = [];
  for (const ln of note.lines) {
    if (!isMc(ln.label)) continue;
    const k = (ln.label.match(/\b(1st|2nd|3rd|[4-9]th|first|second|third|fourth|fifth|sixth)\b/i) || [])[1];
    for (const n of names(ln.words)) if (!order.some((o) => o.n === n)) order.push({ n, k: k ? ORD[k.toLowerCase()] || 9 : 9 });
  }
  for (const x of note.reminders) if (isMc(x.text)) for (const n of names(x.tags)) if (!order.some((o) => o.n === n)) order.push({ n, k: 99 });
  order.sort((a, b) => a.k - b.k); // (stable: reminder-only names keep their note order after the numbered lines)
  if (order.length && m._dm) { drop(/mind ?control|dreadmarch/i); res.mcCC = mcCheck(order.map((o) => o.n)); }

  const isCurse = (s) => /\bcurse/i.test(s);
  const kindOf = (s) => (/un-?marked|no marker|non-?marked/i.test(s) ? 'unmarked' : /marked|marker|skull/i.test(s) ? 'marked' : 'any');
  const cw = { unmarked: new Set(), marked: new Set(), any: new Set() }, cPh = new Set();
  for (const ln of note.lines) if (isCurse(ln.label)) names(ln.words).forEach((n) => cw[ln.marks.length ? 'marked' : kindOf(ln.label)].add(n));
  for (const x of note.reminders) if (isCurse(x.text)) { names(x.tags).forEach((n) => cw[x.text.includes('{') ? 'marked' : kindOf(x.text)].add(n)); cPh.add(Math.floor(x.ph)); }
  if ((cw.unmarked.size || cw.marked.size || cw.any.size) && m._addSets) { drop(/\bcurse/i); res.curses = curseCheck(); }

  // - the intermission ghost soaks ("Soak Ghost at {cross}: A", or the same as ph 2.5 reminders): one soaker per marker.
  //   The log doesn't say who blocked which Fragment (each block gives the whole raid a Spirit Erasure stack, and the
  //   fragments aren't logged as units), so this checks that each soaker was alive and held a spot of their own.
  const isGhost = (s) => /ghost|fragment/i.test(s) && /soak|block/i.test(s);
  const gl = []; let gFrom = 5;
  const addG = (n, mark) => { const o = gl.find((x) => x.n === n); if (o) { if (!o.mark && mark) o.mark = mark; } else gl.push({ n, mark: mark || 0 }); };
  for (const ln of note.lines) if (isGhost(ln.label)) for (const n of names(ln.words)) addG(n, ln.marks[0]);
  for (const x of note.reminders) if (isGhost(x.text)) { const mk = (x.text.match(/\{(\w+)\}/) || [])[1]; for (const n of names(x.tags)) addG(n, mk ? MARKER_TOKENS[mk.toLowerCase()] : 0); if (x.ph % 1) gFrom = Math.min(gFrom, x.time); }
  if (gl.length) { drop(/ghost/i); res.ghosts = ghostCheck(gl); }

  function ghostCheck(list) {
    const I = m._inter;
    if (!I) return { reached: false, rows: list.map((o) => ({ ...o, st: 'na', txt: 'intermission not reached' })) };
    const from = Math.min(I.e, I.s + gFrom), to = I.e, med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
    const zu = [...r.positions.values()].find((u) => /^Zul'jan$/.test(u.name || '')), zp = zu ? zu.pts.filter((q) => q[0] >= from && q[0] <= to) : [];
    const zx = zp.length ? med(zp.map((q) => q[1])) : null, zy = zp.length ? med(zp.map((q) => q[2])) : null;
    const rows = list.map((o) => {
      const p = P(o.n), d = r.deaths.filter((x) => x.player === o.n && x.t >= from && x.t <= to).map((x) => x.t)[0] ?? null;
      const u = p && r.positions.get(p.guid), pts = u ? u.pts.filter((q) => q[0] >= from && q[0] <= (d ?? to)) : [];
      const x = pts.length ? med(pts.map((q) => q[1])) : null, y = pts.length ? med(pts.map((q) => q[2])) : null;
      const off = pts.map((q) => Math.hypot(q[1] - x, q[2] - y)).sort((a, b) => a - b), moved = off.length ? off[Math.floor(off.length * 0.8)] : 0;
      return { ...o, x, y, moved, dZ: x != null && zx != null ? Math.hypot(x - zx, y - zy) : null, died: d, before: deadAt(r, o.n, from) };
    });
    for (const a of rows) {
      const same = rows.filter((b) => b !== a && a.x != null && b.x != null && !b.before && b.died == null && Math.hypot(a.x - b.x, a.y - b.y) < 5).map((b) => b.n);
      if (a.before) { a.st = 'bad'; a.txt = 'dead before the soak'; }
      else if (a.died != null) { a.st = 'bad'; a.txt = 'died ' + Math.round(a.died - I.s) + 's into the intermission'; }
      else if (a.x == null) { a.st = 'na'; a.txt = 'no position logged'; }
      else if (same.length) { a.st = 'warn'; a.txt = 'on the same spot as ' + same.join(', '); a.same = same;
        res.mistakes.push({ t: from, player: a.n, mechanic: 'Ghost soak', id: 1287722, severity: 'Low', fromNote: true, detail: 'Stood on the same spot as ' + same.join(' and ') + ' during the intermission, so one marker had no soaker.', fix: 'Go to your own marker as the intermission starts and block the Fragments that come to it.' }); }
      else { a.st = 'ok'; a.txt = 'held a spot' + (a.dZ != null ? ' ' + Math.round(a.dZ) + ' yd from Zul\'jan' : ''); }
    }
    const through = I.reclaim.filter((t) => t >= I.s - 1 && t <= I.e + 1).length;
    return { reached: true, from, to, through, peak: I.peak, rounds: I.rounds, rows };
  }

  function mcCheck(list) {
    const per = new Map(list.map((n) => [n, { n, up: 0, did: 0, spells: new Map() }]));
    const rows = m._dm.map((d) => {
      const main = d.mc.filter((x) => x.main), mcd = new Set(main.map((x) => x.n)), len = main.length ? d.e - d.s : 0;
      const ccers = list.map((n, i) => ({ n, k: i + 1, why: mcd.has(n) ? 'mind controlled' : deadAt(r, n, d.s) ? 'dead' : '' }));
      const avail = ccers.filter((o) => !o.why).map((o) => o.n);
      const cc = d.cc.filter((c) => c.main).map((c) => ({ ...c, rel: c.t - d.s, k: list.indexOf(c.who) + 1 }));
      const first = new Map(); for (const c of cc) if (!first.has(c.who)) first.set(c.who, c);
      // the listed players who CC'd, by when their first CC landed; one going more than a second before someone above
      // them on the order is out of order (a CC on cooldown, or a mind-controlled CCer, simply passes it down)
      const seq = list.filter((n) => first.has(n)).sort((a, b) => first.get(a).t - first.get(b).t);
      const early = seq.find((n, j) => seq.slice(j + 1).some((x) => list.indexOf(x) < list.indexOf(n) && first.get(x).t - first.get(n).t > 1));
      let st, txt;
      if (!main.length) { st = 'na'; txt = 'no one mind controlled'; }
      else if (!cc.length && len < 2) { st = 'na'; txt = 'broke on its own in ' + len.toFixed(1) + ' s'; }
      else if (!cc.length) { st = avail.length ? 'bad' : 'na'; txt = avail.length ? 'no CC for ' + len.toFixed(1) + ' s' : 'every CCer was mind controlled or dead'; }
      else if (!seq.length) { st = 'warn'; txt = 'CC came only from players not on the order'; }
      else if (early) { const x = seq.find((y) => list.indexOf(y) < list.indexOf(early)); st = 'warn'; txt = early + ' went before ' + x; }
      else { const c0 = cc[0]; st = 'ok'; txt = c0.rel <= 0.3 ? 'CC was ready as it landed' : 'first CC after ' + c0.rel.toFixed(1) + ' s'; }
      if (main.length && len >= 2) for (const n of avail) { const p = per.get(n); p.up++; if (first.has(n)) { p.did++; for (const c of cc.filter((x) => x.who === n)) p.spells.set(c.spell, c.id); } }
      if (st === 'bad') res.mistakes.push({ t: d.s, player: avail[0], mechanic: 'Mind control CC', id: 1285643, severity: 'Medium', fromNote: true,
        detail: 'Nobody used a CC on the mind-controlled players at Dreadmarch ' + d.n + ' (' + [...mcd].join(', ') + ' walked for ' + len.toFixed(1) + ' s' + (main.some((x) => x.died) ? '; ' + main.filter((x) => x.died).map((x) => x.n).join(' and ') + ' died mind controlled' : '') + '). You were up first on the CC order.', fix: 'Have your stun, grip or ring ready as Dreadmarch finishes casting and use it on the mind-controlled players. If it\'s on cooldown, say so, so the next one on the order goes.' });
      if (st === 'warn' && early) res.mistakes.push({ t: first.get(early).t, player: early, mechanic: 'Mind control CC', id: 1285643, severity: 'Low', fromNote: true,
        detail: 'Used ' + first.get(early).spell + ' at Dreadmarch ' + d.n + ' before ' + seq.find((y) => list.indexOf(y) < list.indexOf(early)) + ', who is above you on the CC order.', fix: 'Chain the CC in the note\'s order so the stuns don\'t overlap and the mind control stays covered until it breaks.' });
      // later single re-controls before the next Dreadmarch (shown, not judged)
      const later = d.mc.filter((x) => !x.main).map((x) => ({ n: x.n, s: x.s, len: x.e - x.s, died: x.died, cc: d.cc.filter((c) => !c.main && c.on.includes(x.n)).map((c) => ({ who: c.who, spell: c.spell, id: c.id, rel: c.t - x.s })) }));
      return { n: d.n, t: d.t, ph: d.ph, s: d.s, len, mcd: [...mcd], died: main.filter((x) => x.died).map((x) => x.n), ccers, cc, st, txt, later };
    });
    return { order: list, rows, per: [...per.values()].map((p) => ({ ...p, spells: [...p.spells].map(([spell, id]) => ({ spell, id })) })) };
  }

  function curseCheck() {
    const want = (kind) => [...new Set([...cw[kind], ...cw.any])];
    const sets = m._addSets.filter((s) => !cPh.size || cPh.has(+((s.ph.match(/^P(\d)/) || [])[1] || 0)));
    const per = new Map();
    const tally = (n, ok) => { let p = per.get(n); if (!p) per.set(n, p = { n, of: 0, did: 0 }); p.of++; if (ok) p.did++; };
    const rows = sets.map((s) => {
      // a set where neither add carried a raid marker can't tell the two apart: either add counts for either warlock,
      // and a warlock who cursed neither is the miss
      const noMark = s.adds.length > 1 && !s.adds.some((a) => a.marked), all = [...new Set([...want('unmarked'), ...want('marked')])];
      if (noMark) {
        const adds = s.adds.map((a) => {
          const who = [...new Set(a.curses.map((c) => c.who))], c0 = a.curses.find((c) => all.includes(c.who)) || a.curses[0] || null, lived = (a.died ?? r.duration) - a.t0;
          const st = who.some((n) => all.includes(n)) ? 'ok' : who.length ? 'warn' : lived < 4 ? 'na' : 'bad';
          return { kind: 'either', want: all, curses: a.curses.map((c) => ({ ...c, rel: c.t - a.t0 })), st, txt: st === 'ok' ? 'cursed after ' + Math.max(0, c0.t - a.t0).toFixed(1) + ' s' : st === 'warn' ? 'cursed by ' + who.join(', ') + ' instead' : st === 'na' ? 'died within ' + Math.max(0, lived).toFixed(0) + ' s' : 'not cursed', swapped: [], t0: a.t0 };
        });
        const t0 = Math.min(...s.adds.map((a) => a.t0)), idle = all.filter((n) => !deadAt(r, n, t0 + 3) && !s.adds.some((a) => a.curses.some((c) => c.who === n)));
        for (const n of all.filter((x) => !deadAt(r, x, t0 + 3))) tally(n, !idle.includes(n));
        for (const n of idle) res.mistakes.push({ t: t0, player: n, mechanic: 'Curse assignment', id: 1714, severity: 'Low', fromNote: true, detail: 'Didn\'t curse either Spiteful Soulcoiler in set ' + s.n + ' (' + s.ph + ').', fix: 'Curse your add as soon as the set spawns. The curse slows its casts, which gives the kickers more time.' });
        return { n: s.n, t: s.t, ph: s.ph, noMark: true, idle, adds };
      }
      const adds = s.adds.slice().sort((a, b) => a.marked - b.marked).map((a) => {
        const kind = a.marked ? 'marked' : 'unmarked', w = want(kind), who = [...new Set(a.curses.map((c) => c.who))];
        const c0 = a.curses.find((c) => w.includes(c.who)) || a.curses[0] || null, alive = w.filter((n) => !deadAt(r, n, a.t0 + 3));
        const lived = (a.died ?? r.duration) - a.t0;
        // an assigned warlock who cursed the other add of this set instead
        const swapped = w.filter((n) => !who.includes(n) && s.adds.some((b) => b !== a && b.curses.some((c) => c.who === n)));
        let st, txt;
        if (!w.length) { st = 'na'; txt = 'no one assigned' + (who.length ? ' (cursed by ' + who.join(', ') + ')' : ''); }
        else if (who.some((n) => w.includes(n))) { st = 'ok'; txt = 'cursed after ' + Math.max(0, c0.t - a.t0).toFixed(1) + ' s'; }
        else if (who.length) { st = 'warn'; txt = 'cursed by ' + who.join(', ') + ' instead'; }
        else if (lived < 4) { st = 'na'; txt = 'died within ' + Math.max(0, lived).toFixed(0) + ' s'; }
        else if (!alive.length) { st = 'na'; txt = 'the assigned warlock was dead'; }
        else { st = 'bad'; txt = 'not cursed'; }
        if (st === 'ok' || st === 'warn' || st === 'bad') for (const n of alive) tally(n, who.includes(n));
        const what = (a.marked ? 'raid-marked' : 'unmarked') + ' Spiteful Soulcoiler in set ' + s.n + ' (' + s.ph + ')';
        if (st !== 'ok') for (const n of alive.filter((x) => !who.includes(x)) ) if (st === 'bad' || st === 'warn') res.mistakes.push({ t: a.t0, player: n, mechanic: 'Curse assignment', id: c0 ? c0.id : 1714, severity: 'Low', fromNote: true,
          detail: swapped.includes(n) ? 'Cursed the other add instead of the ' + what + '.' : st === 'warn' ? 'Didn\'t curse the ' + what + '; ' + who.join(' and ') + ' covered it.' : 'Didn\'t curse the ' + what + '.',
          fix: 'Curse your add as soon as the set spawns. The curse slows its casts, which gives the kickers more time. Unmarked and raid-marked adds each have their own warlock.' });
        return { kind, want: w, curses: a.curses.map((c) => ({ ...c, rel: c.t - a.t0 })), st, txt, swapped, t0: a.t0 };
      });
      return { n: s.n, t: s.t, ph: s.ph, adds };
    });
    return { want: { unmarked: want('unmarked'), marked: want('marked') }, phases: [...cPh].sort(), rows, per: [...per.values()] };
  }
}

// Entombed Sentinels NSRT assignments: the raid's Blood / Breath split ("Blood: names" and "Breath: names", or reminder
// lines whose text names a side). Each group fights its boss in cycle 1 and the other boss after every intermission
// (the swap), so every cycle each player should be on their group's boss; the fight module says who was on which
// (from the Mark stacks each player picked up).
function sentinelsAssign(r, note, res, isName, P) {
  const m = r.module, grp = new Map();
  for (const ln of note.lines) { const k = /^blood/i.test(ln.label) ? 'Blood' : /^breath/i.test(ln.label) ? 'Breath' : null; if (!k) continue;
    for (const w of ln.words) if (isName(w)) grp.set(P(w).name, k); res.other = res.other.filter((o) => o.label !== ln.label); }
  if (!grp.size) for (const rem of note.reminders) { const k = /blood/i.test(rem.text) ? 'Blood' : /breath/i.test(rem.text) ? 'Breath' : null; if (k) for (const w of rem.tags) if (isName(w)) grp.set(P(w).name, k); }
  if (!grp.size) return;
  const other = (k) => (k === 'Blood' ? 'Breath' : 'Blood');
  const rows = (m._cycles || m.phases).map((ph, c) => {
    const sides = m._sides[c] || new Map(), wrong = [], none = []; let ok = 0;
    for (const [n, k] of grp) { const want = c % 2 === 0 ? k : other(k), got = sides.get(n); if (!got) none.push(n); else if (got === want) ok++; else wrong.push({ n, want, got }); }
    return { cycle: c + 1, t: ph.start, wrong, ok, none };
  }).filter((x) => x.ok || x.wrong.length);
  // (one issue per player: someone who played the other group's side all pull is one thing to fix, not five)
  const by = new Map(); for (const x of rows) for (const w of x.wrong) { let o = by.get(w.n); if (!o) by.set(w.n, o = { sev: 'warn', t: x.t, who: w.n, group: grp.get(w.n), cycles: [] }); o.cycles.push(x.cycle); }
  const issues = [...by.values()].map((o) => ({ ...o, all: o.cycles.length === rows.length }));
  for (const i of issues) res.mistakes.push({ t: i.t, player: i.who, mechanic: 'Side assignment', id: 0, severity: 'Low', fromNote: true,
    detail: i.all ? 'Played the other group\'s side all pull: the note puts them in the ' + i.group + ' group.' : 'Was on the other boss in cycle' + (i.cycles.length > 1 ? 's ' : ' ') + i.cycles.join(', ') + ' (the note puts them in the ' + i.group + ' group).',
    fix: 'Stay with your group. That\'s its boss in cycle 1, then the other one after each intermission. If the split changed, update the note.' });
  res.boss = Object.assign(res.boss || {}, { sides: { rows, issues, blood: [...grp].filter(([, k]) => k === 'Blood').map(([n]) => n), breath: [...grp].filter(([, k]) => k === 'Breath').map(([n]) => n) } });
}

// Sszorak NSRT assignments: the two Mutilate soak groups (each Mutilate is soaked by one group, the next one by the other,
// because of Mutilated Gash), the intermission cyst poppers, and the Serpent's Fury pop timer (the reminders that say when
// to pop it, e.g. "Trigger Virulence"). The fight module says who soaked each Mutilate, when each Fury popped and who
// popped each cyst (that last one is the player nearest the cyst when it popped: shown, not judged).
function sszorakAssign(r, note, res, isName, P) {
  const Z = r.module._sz;
  const secs = []; let cur = null;
  for (const ln of note.lines) {
    const names = ln.words.filter(isName).map((n) => P(n).name);
    if (!names.length) { cur = { head: ln.raw, lines: [] }; secs.push(cur); continue; }
    if (!cur) { cur = { head: '', lines: [] }; secs.push(cur); }
    cur.lines.push({ label: ln.label, names });
  }
  const take = (re) => { const s = secs.find((x) => re.test(x.head)); if (s) for (const l of s.lines) res.other = res.other.filter((o) => o.label !== l.label); return s; };
  const ms = take(/mutilate|soak/i), op = take(/orb|popper|cyst/i), tr = take(/virulence|trigger|fury/i);
  const out = { mut: null, poppers: null, timer: null };
  const deadAt = (n, t) => r.deaths.some((d) => d.player === n && d.t <= t);
  // Mutilate groups: the group with the most players in a Mutilate is the one soaking it. Someone from the other group in
  // it soaked out of turn (they'll have Mutilated Gash for their own group's next one). Missing players aren't judged one
  // by one (the raid's call: the groups list people who don't always soak, and one or two out is fine); a Mutilate with
  // three or more of its group missing is short-handed
  const SHORT = 3;
  if (ms && ms.lines.length >= 2) {
    const groups = ms.lines.slice(0, 2).map((l) => ({ label: l.label, names: l.names })), gOf = new Map(); groups.forEach((g, i) => g.names.forEach((n) => gOf.set(n, i)));
    const by = new Map(), missedBy = new Map(), P2 = (n) => { let o = by.get(n); if (!o) by.set(n, o = { who: n, group: groups[gOf.get(n)].label, wrong: [] }); return o; };
    const rows = Z.muts.map((m, i) => {
      const cnt = groups.map((g) => m.who.filter((n) => g.names.includes(n)).length), k = cnt[0] >= cnt[1] ? 0 : 1;
      if (!cnt[k]) return { i: i + 1, t: m.t, set: m.set, group: null, n: 0, of: 0, wrong: [], missed: [], short: false };
      const wrong = m.who.filter((n) => gOf.has(n) && gOf.get(n) !== k), missed = groups[k].names.filter((n) => !m.who.includes(n) && !deadAt(n, m.t));
      for (const n of wrong) P2(n).wrong.push(m.set || i + 1); for (const n of missed) { if (!missedBy.has(n)) missedBy.set(n, []); missedBy.get(n).push(m.set || i + 1); }
      return { i: i + 1, t: m.t, set: m.set, group: groups[k].label, n: cnt[k], of: groups[k].names.filter((n) => !deadAt(n, m.t)).length, wrong, missed, short: missed.length >= SHORT };
    });
    const issues = [...by.values()];
    for (const x of issues) res.mistakes.push({ t: (Z.muts.find((m) => (m.set || 0) === x.wrong[0]) || Z.muts[0] || { t: 0 }).t, player: x.who, mechanic: 'Mutilate group', id: 0, severity: 'Low', fromNote: true,
      detail: 'Soaked the other group\'s Mutilate (set' + (x.wrong.length > 1 ? 's ' : ' ') + [...new Set(x.wrong)].join(', ') + '): the note puts them in the ' + x.group + ' group.',
      fix: 'Soak only your group\'s Mutilate. The other group takes the next one, and an extra soak leaves you with Mutilated Gash for your own.' });
    for (const x of rows.filter((q) => q.short)) res.mistakes.push({ t: x.t, player: 'Raid', mechanic: 'Mutilate group', id: 0, severity: 'Low', fromNote: true,
      detail: 'Mutilate ' + x.i + ' (set ' + (x.set || '?') + ') was ' + x.missed.length + ' short of the ' + x.group + ' group: ' + x.missed.join(', ') + '.', fix: 'Bring the whole group into every Mutilate, because fewer soakers means a bigger hit each.' });
    out.mut = { groups, rows, issues, missedBy: [...missedBy].map(([who, sets]) => ({ who, sets })), short: SHORT };
  }
  // the cyst poppers: who the note names, and who popped each cyst (not judged)
  if (op && op.lines.length) out.poppers = { names: op.lines[0].names, pops: Z.pops.filter((p) => p.inter) };
  // the Fury timer: each pop against the nearest reminder; popping the one before an intermission early leaves the next
  // one short of time (the guides: even 2 seconds), and a late pop is close to the enrage
  const tm = [...new Set(note.reminders.filter((x) => /virulence|fury|trigger|pop the stack/i.test(String(x.text || ''))).map((x) => +x.time).filter((v) => v === v))].sort((a, b) => a - b);
  if (tm.length && Z.furies.length) {
    const rows = tm.filter((t) => t <= r.duration + 1).map((t, i) => {
      const f = Z.furies.find((q) => q.popT != null && Math.abs(q.popT - t) <= 10), d = f ? f.popT - t : null;
      const st = !f ? 'na' : (f.pre && d < -1.5) || d > 3 ? 'warn' : 'ok';
      return { i: i + 1, t, popT: f ? f.popT : null, d, pre: f ? f.pre : null, st };
    });
    for (const x of rows.filter((q) => q.st === 'warn')) res.mistakes.push({ t: x.popT, player: 'Raid', mechanic: 'Fury timer', id: 0, severity: 'Low', fromNote: true,
      detail: 'Serpent\'s Fury ' + x.i + ' popped ' + Math.abs(x.d).toFixed(1) + ' s ' + (x.d < 0 ? 'before' : 'after') + ' the note\'s timer.', fix: x.d < 0 ? 'Wait for the timer. Before an intermission, an early pop leaves the next one without enough time.' : 'Stack on the timer, because a late pop is close to the enrage.' });
    out.timer = { rows, triggers: tr && tr.lines.length ? tr.lines[0].names : [] };
  }
  res.boss = Object.assign(res.boss || {}, { sz: out });
}

// Nymrissa NSRT assignments: "Orb Soak N: names" (or "Soak orb" reminders, in time order), one per set of Frost Orbs.
// Set N is soaked by its assigned players: none of them soaking it, or an orb that Shattered, is a miss; someone else
// soaking an orb could be better (an orb they weren't planned for).
function nymrissaAssign(r, note, res, isName, P) {
  const Z = r.module._ny, want = [];
  for (const ln of note.lines) { const m = /orb\s*soak\s*(\d+)/i.exec(ln.label); if (!m) continue; want[+m[1] - 1] = ln.words.filter(isName).map((n) => P(n).name); res.other = res.other.filter((o) => o.label !== ln.label); }
  if (!want.length) note.reminders.filter((x) => /soak\s*orb|orb\s*soak/i.test(String(x.text || ''))).sort((a, b) => a.time - b.time).forEach((x, i) => { want[i] = x.tags.filter(isName).map((n) => P(n).name); });
  if (!want.some((w) => w && w.length) || !Z.sets.length) return;
  const deadAt = (n, t) => r.deaths.some((d) => d.player === n && d.t <= t);
  const rows = Z.sets.map((s, i) => {
    const w = want[i] || [], alive = w.filter((n) => !deadAt(n, s.t)), did = w.filter((n) => s.who.includes(n)), extra = s.who.filter((n) => !w.includes(n));
    const st = !w.length || s.cut ? 'na' : s.shatter || (alive.length && !did.length) ? 'bad' : extra.length ? 'warn' : 'ok';
    if (st === 'bad' && alive.length && !did.length) res.mistakes.push({ t: s.t, player: alive.join(', '), mechanic: 'Orb soak', id: 1313393, severity: 'Medium', fromNote: true,
      detail: 'Orb Soak ' + s.i + ': ' + alive.join(' and ') + (alive.length > 1 ? ' were' : ' was') + ' assigned, but ' + (s.who.length ? s.who.join(', ') + ' soaked the orbs.' : 'nobody soaked.'), fix: 'Take your set\'s orbs: be ready at the reminder, with your immunity or defensive.' });
    for (const n of extra) res.mistakes.push({ t: s.t, player: n, mechanic: 'Orb soak', id: 1313393, severity: 'Low', fromNote: true,
      detail: 'Soaked an orb in set ' + s.i + ', which the note gives to ' + (w.join(' and ') || 'nobody') + '.', fix: 'Leave the orbs to the players the note assigns, unless one of them is dead.' });
    return { i: s.i, t: s.t, want: w, who: s.who, did, extra, missed: alive.filter((n) => !did.includes(n)), shatter: s.shatter, st };
  });
  res.boss = Object.assign(res.boss || {}, { ny: { rows } });
}

// Nek'zali NSRT assignments: the Soulcoil Well groups (they take turns going into the well for each Drowned Echo, in the
// order of the note's "go in" reminders, or one after the other), and the Hungering Pyre soak list and its "don't soak"
// list (those players take a Slithering Flame to burn corpses instead). The fight module says who was in the well for each
// Echo (Immortal Coil hits only them) and who each Pyre hit. Like the other soak checks: one or two of a group missing is
// fine, three or more is short-handed; someone from the other group, or from the don't-soak list, could be better.
function nekzaliAssign(r, note, res, isName, P) {
  const Z = r.module._nz, SHORT = 3;
  const secs = []; let cur = null;
  for (const ln of note.lines) {
    const names = ln.words.filter(isName).map((n) => P(n).name);
    if (!names.length) { cur = { head: ln.raw, lines: [] }; secs.push(cur); continue; }
    if (!cur) { cur = { head: '', lines: [] }; secs.push(cur); }
    cur.lines.push({ label: ln.label, names });
  }
  const take = (re) => { const s = secs.find((x) => re.test(x.head)) || secs.find((x) => x.lines.some((l) => re.test(l.label))); if (s) for (const l of s.lines) res.other = res.other.filter((o) => o.label !== l.label); return s; };
  const wg = take(/well|realm|depths|echo/i), py = take(/pyre|soak circle/i);
  const deadAt = (n, t) => r.deaths.some((d) => d.player === n && d.t <= t + 0.2);
  const out = { well: null, pyre: null };
  // the well groups: which group's turn each Echo is (the reminders that name a group, by phase then time; else they alternate)
  const groups = wg ? wg.lines.filter((l) => l.names.length).slice(0, 2).map((l) => ({ label: l.label.replace(/^realm\s*/i, ''), names: l.names })) : [];
  if (groups.length === 2 && Z.depths.length) {
    const gi = (txt) => { const m = /group\s*(\d)/i.exec(txt || ''); return m ? +m[1] - 1 : null; };
    const order = note.reminders.filter((x) => gi(x.text) != null && gi(x.text) < 2).sort((a, b) => a.ph - b.ph || a.time - b.time).map((x) => gi(x.text));
    const gOf = new Map(); groups.forEach((g, k) => g.names.forEach((n) => gOf.set(n, k)));
    const by = new Map();
    const rows = Z.depths.map((d, i) => {
      const k = order.length > i ? order[i] : i % 2, g = groups[k], wrong = d.team.filter((n) => gOf.has(n) && gOf.get(n) !== k);
      const missed = g.names.filter((n) => !d.team.includes(n) && !deadAt(n, d.t0)), extra = d.team.filter((n) => !gOf.has(n));
      for (const n of wrong) { let o = by.get(n); if (!o) by.set(n, o = { who: n, group: groups[gOf.get(n)].label, echoes: [] }); o.echoes.push(d.i); }
      return { i: d.i, t: d.t0, ph: d.ph, group: g.label, k, n: d.team.filter((n) => gOf.get(n) === k).length, of: g.names.filter((n) => !deadAt(n, d.t0)).length, wrong, missed, extra, short: d.team.length > 0 && missed.length >= SHORT, empty: !d.team.length };
    });
    const issues = [...by.values()];
    for (const x of issues) res.mistakes.push({ t: (Z.depths.find((d) => d.i === x.echoes[0]) || { t0: 0 }).t0, player: x.who, mechanic: 'Well group', id: 0, severity: 'Low', fromNote: true,
      detail: 'Went into the well on the other group\'s turn (Drowned Echo ' + x.echoes.join(', ') + '): the note puts them in ' + x.group + '.', fix: 'Go in only on your group\'s Echo. Leaving the well gives you Soul Exhaustion for the next one.' });
    for (const x of rows.filter((q) => q.short)) res.mistakes.push({ t: x.t, player: 'Raid', mechanic: 'Well group', id: 0, severity: 'Low', fromNote: true,
      detail: 'Drowned Echo ' + x.i + ' (' + x.group + '\'s turn) was ' + x.missed.length + ' short: ' + x.missed.join(', ') + '.', fix: 'The whole group goes in for its Echo, so it dies fast and every Curse gets kicked.' });
    out.well = { groups, rows, issues, short: SHORT };
  }
  // the Pyre soak list: someone from the don't-soak list in a Pyre, or three or more of the soak list missing (not counting
  // anyone dead or in the well then)
  const lists = py ? py.lines.filter((l) => l.names.length) : [], soakL = lists.find((l) => !/don'?t|not|stay out|no soak/i.test(l.label)), outL = lists.find((l) => /don'?t|not|stay out|no soak/i.test(l.label));
  if (soakL && Z.pyres.length) {
    const inWell = (n, t) => Z.depths.some((d) => t >= d.t0 - 1 && t <= d.t1 + 1 && d.team.includes(n));
    const by = new Map();
    const rows = Z.pyres.map((p) => {
      const wrong = outL ? p.who.filter((n) => outL.names.includes(n)) : [], missed = soakL.names.filter((n) => !p.who.includes(n) && !deadAt(n, p.t) && !inWell(n, p.t));
      for (const n of wrong) { let o = by.get(n); if (!o) by.set(n, o = { who: n, pyres: [] }); o.pyres.push(p.i); }
      return { i: p.i, t: p.t, n: p.who.filter((n) => soakL.names.includes(n)).length, of: soakL.names.filter((n) => !deadAt(n, p.t) && !inWell(n, p.t)).length, wrong, missed, extra: p.who.filter((n) => !soakL.names.includes(n) && !(outL && outL.names.includes(n))), short: missed.length >= SHORT };
    });
    const issues = [...by.values()];
    for (const x of issues) res.mistakes.push({ t: (Z.pyres.find((p) => p.i === x.pyres[0]) || { t: 0 }).t, player: x.who, mechanic: 'Pyre soak', id: 0, severity: 'Low', fromNote: true,
      detail: 'Soaked Hungering Pyre ' + x.pyres.join(', ') + ', but the note has them out of it (their Slithering Flame burns the corpses).', fix: 'Stay out of the Pyre and use your Slithering Flame on the corpses.' });
    for (const x of rows.filter((q) => q.short)) res.mistakes.push({ t: x.t, player: 'Raid', mechanic: 'Pyre soak', id: 0, severity: 'Low', fromNote: true,
      detail: 'Hungering Pyre ' + x.i + ' was ' + x.missed.length + ' short of the soak list: ' + x.missed.join(', ') + '.', fix: 'Everyone on the soak list goes into every Pyre so its damage is split.' });
    out.pyre = { soak: soakL.names, out: outL ? outL.names : [], rows, issues, short: SHORT };
  }
  res.boss = Object.assign(res.boss || {}, { nz: out });
}

// Twin Fangs NSRT assignments: Ravenous Feast soak groups (in order), Broodling kick order by area, and which group
// CCs the globules on odd and even sets. Each one is checked against what happened in the log.
function twinFangsAssign(r, note, res, isName, P) {
  const secs = []; let cur = null;
  for (const ln of note.lines) {
    if (/^invitelist$/i.test(ln.label)) continue;
    const names = ln.words.filter(isName).map((n) => P(n).name);
    if (!names.length) { cur = { head: ln.raw, lines: [] }; secs.push(cur); continue; }
    if (!cur) { cur = { head: '', lines: [] }; secs.push(cur); }
    cur.lines.push({ label: ln.label, names });
  }
  const sec = (re) => { const s = secs.find((x) => re.test(x.head)) || null; if (s) for (const l of s.lines) res.other = res.other.filter((o) => o.label !== l.label); return s; }; // (lines read here don't also show as "other")
  const m = r.module, out = res.boss = { feast: null, kicks: null, orbcc: null };

  // -- Ravenous Feast groups: strike 1, 2, 3 each belong to one group (order from the "Soak First/Second/Third" reminders)
  const fs = sec(/feast|tainted/i);
  if (fs && fs.lines.length) {
    const ordWord = { first: 0, second: 1, third: 2 }, order = new Map();
    for (const rem of note.reminders) { const w = (String(rem.text).match(/soak (first|second|third)/i) || [])[1]; if (!w) continue; const tags = new Set(rem.tags.map((t) => (isName(t) ? P(t).name : t)));
      let bi = -1, bo = 0; fs.lines.forEach((l, i) => { const o = l.names.filter((n) => tags.has(n)).length; if (o > bo) { bo = o; bi = i; } }); if (bi >= 0) order.set(bi, ordWord[w.toLowerCase()]); }
    const groups = fs.lines.map((l, i) => ({ label: l.label, names: l.names, slot: order.has(i) ? order.get(i) : i }));
    const bySlot = new Map(groups.map((g) => [g.slot, g])), groupOf = new Map(); for (const g of groups) for (const n of g.names) if (!groupOf.has(n)) groupOf.set(n, g);
    const rows = [], per = new Map(); // player -> { kind, other, feasts } for the "who messed up" list
    const note2 = (n, kind, other, fi, t) => { const k = n + '|' + kind + '|' + (other || ''); let x = per.get(k); if (!x) per.set(k, x = { who: n, kind, other, group: groupOf.get(n) ? groupOf.get(n).label : null, feasts: [], t }); x.feasts.push(fi + 1); };
    m._feasts.forEach((f, fi) => {
      // what each player actually soaked this Feast (strike slots)
      const took = new Map(); f.strikes.forEach((s, k) => { for (const n of s.who) { if (!took.has(n)) took.set(n, []); took.get(n).push(k); } });
      for (const g of groups) {
        const strike = f.strikes[g.slot]; if (!strike) continue;
        const alive = g.names.filter((n) => !deadAt(r, n, strike.t));
        const missing = alive.filter((n) => !strike.who.includes(n)), extra = strike.who.filter((n) => !g.names.includes(n));
        const wrong = alive.filter((n) => f.strikes.some((s, k) => k !== g.slot && s.who.includes(n)));
        for (const n of missing) {
          const other = (took.get(n) || []).filter((k) => k !== g.slot).map((k) => (bySlot.get(k) || { label: 'strike ' + (k + 1) }).label)[0];
          note2(n, other ? 'wrong' : 'missed', other, fi, strike.t);
          res.mistakes.push({ t: strike.t, player: n, mechanic: 'Feast assignment', id: 0, severity: 'Medium', fromNote: true, detail: other ? 'Soaked ' + other + '\'s Ravenous Feast strike instead of their own (' + g.label + ', strike ' + (g.slot + 1) + ') in Feast ' + (fi + 1) + '.' : 'Didn\'t soak their Ravenous Feast strike (' + g.label + ', strike ' + (g.slot + 1) + ') in Feast ' + (fi + 1) + '.', fix: 'Soak your own group\'s strike: ' + g.label + ' takes strike ' + (g.slot + 1) + '.' });
        }
        for (const n of extra) if (!groupOf.has(n)) note2(n, 'unlisted', g.label, fi, strike.t);
        rows.push({ feast: fi + 1, t: strike.t, label: g.label, slot: g.slot + 1, assigned: g.names, soaked: strike.who.filter((n) => g.names.includes(n)), missing, extra, wrong });
      }
    });
    const issues = [...per.values()].sort((a, b) => ({ wrong: 0, missed: 0, unlisted: 1 }[a.kind] - { wrong: 0, missed: 0, unlisted: 1 }[b.kind]) || b.feasts.length - a.feasts.length);
    out.feast = { groups, rows, issues, nFeasts: m._feasts.length };
  }

  // -- Broodling kicks: each area kicks its Broodlings in the listed order. A set of Broodlings spawns together and
  // each one usually needs a single kick, so within a set the area's 1st Broodling is kicker 1's, the 2nd kicker 2's,
  // and so on (the order starts over every set). A Broodling belongs to the area of the listed kicker who hit it.
  const ks = sec(/kick|interrupt/i);
  if (ks && ks.lines.length) {
    const backup = ks.lines.filter((l) => /backup/i.test(l.label)).flatMap((l) => l.names);
    const areas = ks.lines.filter((l) => !/backup/i.test(l.label)).map((l) => ({ label: l.label, order: l.names, units: 0, kicks: 0, inOrder: 0, outOfOrder: 0, backup: 0, outside: 0, gotOff: 0, by: new Map(), slip: [], react: [] }));
    const units = (r.kickUnits || []).filter((x) => /broodling/i.test(x.name || '')).sort((a, b) => a.spawn - b.spawn);
    const unmatched = new Map(); let unmatchedN = 0;
    const turn = new Map(); // `${set}|${area}` -> Broodlings of that area seen so far in the set
    for (const u of units) {
      const kicks = u.kicked.slice().sort((a, b) => a.t - b.t);
      let a = null, best = 0; for (const ar of areas) { const o = kicks.filter((k) => ar.order.includes(k.player)).length; if (o > best) { best = o; a = ar; } }
      if (!a) { if (kicks.length || u.missed.length) unmatchedN++; for (const k of kicks) unmatched.set(k.player, (unmatched.get(k.player) || 0) + 1); continue; }
      const key = (u.wave || 0) + '|' + a.label, n = turn.get(key) || 0; turn.set(key, n + 1);
      a.units++; a.gotOff += u.missed.length;
      // a cast that got through: the turn was whoever was up (kicks before it on this Broodling move the turn on)
      for (const mc of u.missed) { const before = kicks.filter((k) => k.t < mc.t).length, want = a.order[(n + before) % a.order.length]; (a.through = a.through || []).push({ t: mc.t, want, set: u.wave, dead: deadAt(r, want, mc.t) }); }
      kicks.forEach((k, i) => {
        a.kicks++; a.by.set(k.player, (a.by.get(k.player) || 0) + 1);
        if (i === 0) a.react.push(k.t - u.spawn);
        const want = a.order[(n + i) % a.order.length];
        if (k.player === want) a.inOrder++;
        else if (backup.includes(k.player)) a.backup++;
        else if (!a.order.includes(k.player)) a.outside++;
        else { a.outOfOrder++; a.slip.push({ t: k.t, who: k.player, want, set: u.wave }); }
      });
    }
    for (const a of areas) { a.avgReact = a.react.length ? a.react.reduce((s, x) => s + x, 0) / a.react.length : null; a.slowest = a.react.length ? Math.max(...a.react) : null; }
    for (const a of areas) for (const s of a.slip) if (s.who !== s.want) res.mistakes.push({ t: s.t, player: s.who, mechanic: 'Kick order', id: 0, severity: 'Low', fromNote: true, detail: 'Kicked a ' + a.label + ' Broodling out of turn in set ' + s.set + ': that one was ' + s.want + '\'s.', fix: 'Follow the ' + a.label + ' kick order: ' + [...new Set(a.order)].join(', ') + '.' });
    for (const a of areas) for (const g of a.through || []) if (!g.dead) res.mistakes.push({ t: g.t, player: g.want, mechanic: 'Kick assignment', id: 0, severity: 'Medium', fromNote: true, detail: 'A ' + a.label + ' Broodling cast got through on their turn (set ' + g.set + ').', fix: 'Have your interrupt ready for your turn in the ' + a.label + ' order.' });
    // the "who messed up" list: casts that got through (red), then kicks taken out of turn (amber)
    const issues = [];
    for (const a of areas) for (const g of a.through || []) issues.push({ sev: 'bad', t: g.t, set: g.set, area: a.label, want: g.want, dead: g.dead });
    for (const a of areas) for (const s of a.slip) if (s.who !== s.want) issues.push({ sev: 'warn', t: s.t, set: s.set, area: a.label, who: s.who, want: s.want });
    issues.sort((x, y) => (x.sev === y.sev ? x.t - y.t : x.sev === 'bad' ? -1 : 1));
    out.kicks = { areas, backup, unmatched: [...unmatched], unmatchedN, issues };
    // the area check replaces the generic kick rows (e.g. the "Backup Kicker" line)
    res.kicks = []; res.mistakes = res.mistakes.filter((x) => x.mechanic !== 'Kick assignment');
  }

  // -- Orb CC: one group CCs the globules on odd sets, the other on even sets
  const os = sec(/orb|cc|deluge/i);
  if (os && os.lines.length && m._globSets) {
    const odd = os.lines.find((l) => /odd/i.test(l.label)), even = os.lines.find((l) => /even/i.test(l.label));
    const rows = m._globSets.map((s) => {
      const grp = (s.i % 2 === 0 ? odd : even); // set 1 is i = 0 (odd)
      const cc = m._globCC.filter((c) => c.t >= s.t - 6 && c.t <= s.end + 4), did = [...new Set(cc.map((c) => c.who))];
      const assigned = grp ? grp.names : [], idle = assigned.filter((n) => !did.includes(n) && !deadAt(r, n, s.t)), outside = did.filter((n) => !assigned.includes(n));
      return { set: s.i + 1, t: s.t, adds: s.adds, label: grp ? grp.label : '', assigned, did: did.filter((n) => assigned.includes(n)), idle, outside, n: cc.length };
    });
    // the "who messed up" list: sets the group didn't CC at all (red), then players who never CC'd on their sets (amber)
    const issues = [], idleBy = new Map();
    for (const x of rows) {
      if (x.adds != null && x.adds < 3 && !x.n) continue; // a set with only a globule or two needs no CC
      if (!x.did.length) issues.push({ sev: 'bad', set: x.set, t: x.t, label: x.label });
      for (const n of x.idle) { let e = idleBy.get(n); if (!e) idleBy.set(n, e = { who: n, sets: [], of: rows.filter((y) => y.assigned.includes(n) && !(y.adds != null && y.adds < 3 && !y.n)).length }); e.sets.push(x.set); }
    }
    for (const e of idleBy.values()) issues.push({ sev: 'warn', who: e.who, sets: e.sets, of: e.of });
    out.orbcc = { rows, issues };
  }
}

// ---------- mechanics ----------
// Rule types: avoidable, debuff, interrupt, bossBuff, stacks, raidFail.
// Rules match by spellIds and/or names (names used when no spell ID is published yet).
class Mech {
  constructor(item, packs) {
    const T = ['avoidable', 'debuff', 'interrupt', 'bossbuff', 'stacks', 'raidfail'];
    this.ids = {}; this.names = {};
    for (const k of T) { this.ids[k] = new Map(); this.names[k] = new Map(); }
    this.avoid = new Map(); this.debuffs = new Map(); this.stk = new Map(); this.raid = []; this.fails = new Map(); this.casts = [];
    const names = new Set(item.kind === 'run' ? item.bosses.map((b) => b.boss) : [item.boss]);
    const diff = item.kind === 'run' ? 'Mythic' : item.diff;
    this.packs = packs.filter((p) => names.has(p.encounter) || (p.aliases || []).some((a) => names.has(a)));
    for (const p of this.packs) for (const r of p.rules) {
      if (r.difficulties && r.difficulties.length && !r.difficulties.includes(diff)) continue;
      const k = String(r.type).toLowerCase(); if (!this.ids[k]) continue;
      for (const id of r.spellIds || []) this.ids[k].set(+id, r);
      for (const n of r.names || [r.name]) this.names[k].set(String(n).toLowerCase(), r);
    }
  }
  get(k, id, name) { return this.ids[k].get(id) || (name ? this.names[k].get(name.toLowerCase()) : undefined); }
  damage(t, player, id, name, amount) {
    const f = this.get('raidfail', id, name);
    if (f) {
      let list = this.fails.get(f.name); if (!list) this.fails.set(f.name, list = []);
      const last = list[list.length - 1];
      if (last && t - last.t <= 4) { last.hit.add(player); last.dmg += amount; } else list.push({ t, r: f, id, hit: new Set([player]), dmg: amount });
    }
    const r = this.get('avoidable', id, name); if (!r) return 0;
    const k = player + '\u0001' + r.name, a = this.avoid.get(k);
    // touches: hits more than 1.5s apart (a damage-over-time area like Axegrinder ticks several times per touch)
    if (a) { a.hits++; a.dmg += amount; if (t - a.last > 1.5) a.touches++; a.last = t; } else this.avoid.set(k, { p: player, r, hits: 1, touches: 1, last: t, dmg: amount, t, id });
    return amount;
  }
  aura(t, target, isPl, id, name, stacks) {
    let r;
    if (isPl && stacks <= 1 && (r = this.get('debuff', id, name))) {
      const k = target + '\u0001' + r.name, a = this.debuffs.get(k);
      if (a) a.n++; else this.debuffs.set(k, { p: target, r, n: 1, t, id });
    }
    if (isPl && (r = this.get('stacks', id, name))) {
      const k = target + '\u0001' + r.name, a = this.stk.get(k);
      if (!a || stacks > a.max) this.stk.set(k, { p: target, r, max: stacks, t, id });
    }
    if (!isPl && (r = this.get('bossbuff', id, name)) && !this.raid.some((m) => m.mechanic === r.name && t - m.t < 5))
      this.raid.push({ t, player: 'Raid', mechanic: r.name, id, severity: r.severity, detail: target + ' gained ' + r.name + '.', fix: r.tip });
  }
  npcCast(t, caster, guid, id, name) {
    const r = this.get('interrupt', id, name);
    if (r) this.casts.push({ t, caster, guid, id, name: (name || '').toLowerCase(), r, kicked: false });
  }
  interrupted(t, guid, id, name) {
    const ln = (name || '').toLowerCase();
    for (let i = this.casts.length - 1; i >= 0; i--) {
      const c = this.casts[i];
      if (t - c.t > 12) break;
      if (!c.kicked && c.guid === guid && (c.id === id || c.name === ln)) { c.kicked = true; return; }
    }
  }
  build() {
    const out = this.raid.slice();
    for (const c of this.casts) if (!c.kicked) out.push({ t: c.t, player: 'Raid', mechanic: c.r.name, id: c.id, severity: c.r.severity, kick: true, detail: c.caster + ' got ' + c.r.name + ' off. Nobody interrupted it.', fix: c.r.tip });
    // pos: positional mistakes, which get a map of that moment (see analyze)
    for (const list of this.fails.values()) for (const f of list) out.push({ t: f.t, player: 'Raid', mechanic: f.r.name, id: f.id, severity: f.r.severity, pos: true,
      detail: f.r.name + ' went off and hit ' + f.hit.size + (f.hit.size === 1 ? ' player' : ' players') + ' for ' + Math.round(f.dmg).toLocaleString('en-US') + '.', fix: f.r.tip });
    for (const a of this.avoid.values()) out.push({ t: a.t, player: a.p, mechanic: a.r.name, id: a.id, severity: a.r.escalate && a.touches >= a.r.escalate.touches ? a.r.escalate.severity : a.r.severity, dmg: a.dmg, pos: true,
      avoidRule: true, touches: a.touches, ruleIds: a.r.spellIds || [], tankJudged: !!a.r.tankJudged, // (for going easier on tanks, after roles are known)
      detail: (a.r.ticks ? 'Walked into it ' + (a.touches === 1 ? 'once' : a.touches === 2 ? 'twice' : a.touches + ' times') : 'Got hit ' + (a.hits === 1 ? 'once' : a.hits === 2 ? 'twice' : a.hits + ' times')) + (a.dmg >= 1 ? ', for ' + Math.round(a.dmg).toLocaleString('en-US') + ' avoidable damage.' : '.'), fix: a.r.tip });
    for (const a of this.debuffs.values()) out.push({ t: a.t, player: a.p, mechanic: a.r.name, id: a.id, severity: a.r.severity, pos: true,
      detail: 'Got ' + a.r.name + ' ' + (a.n === 1 ? 'once' : a.n === 2 ? 'twice' : a.n + ' times') + '.', fix: a.r.tip });
    for (const a of this.stk.values()) if (a.max > a.r.threshold) out.push({ t: a.t, player: a.p, mechanic: a.r.name, id: a.id, severity: a.r.severity,
      detail: 'Reached ' + a.max + ' stacks (aim to stay at or under ' + a.r.threshold + ').', fix: a.r.tip });
    return out;
  }
}

// ---------- analysis of one pull or key ----------
function newPlayer(guid) {
  return { guid, name: '', specId: 0, cls: null, damage: 0, healing: 0, overheal: 0, absorbs: 0, taken: 0, avoidable: 0,
    casts: 0, interrupts: 0, dispels: 0, deaths: 0, active: 0, lastCast: -1,
    dmgAb: new Map(), healAb: new Map(), takenAb: new Map(), castAb: new Map(), castTimes: new Map(), byName: new Map(),
    // (per second over the pull, and damage by target name: the Performance tab's charts and boss / add split)
    dmgS: [], healS: [], takenS: [], dmgT: new Map(), takenAbS: [], rawS: [], mitS: [], shS: [], devS: [], devGS: [], cdRS: [], /* (devGS: what their Devotion Aura took off the raid; cdRS: what others' cooldowns and externals took off their hits) */ /* (shS: shields soaked on them; absS below is damage they did into enemy shields) */ /* (rawS: hits before mitigation; mitS: what armor, versatility, avoidance and defensives took off; absS: shields (Oct 23)) */ // (takenAbS: per second, what hit them: { spell: [id, amount, hits, biggest, avoidable] })
    // (their eight biggest single hits taken, and what they dispelled)
    big: [], dispL: [], helpL: [],
    // (when they first hit each enemy, for switch speed; mana over the pull, from their casts (a real log only); healing that
    // landed on someone under half health; the buffs on them, each with its time spans)
    firstHit: new Map(), mana: [], manaUse: [], lowHeal: 0, buffs: new Map(), debuffs: new Map(), ccL: [], dmgTS: [], absS: [],
    // (each heal they gave themselves from a self-heal button, a Healthstone or a health potion: { t, spell, id, amt })
    selfH: [],
    // (their power other than mana, by type, for wasted resources (resAt); every cast they started, { t, id, spell, done },
    // done the time it went off, for casts that didn't finish)
    res: new Map(), starts: [],
    // (the Resources view: every power they gained, { t, ty, spell, id, amt, over } (over: what came while they were already
    // full), and every power a cast cost them, { t, ty, spell, id, amt }; ty is the log's power type, 0 for mana)
    gainL: [], spendL: [], drainL: [],
    // (casts Warcraft Logs marks as not pressed, procs: lowercase name -> times, for the Casts view's presses)
    fakeT: new Map(),
    cons: { healthstone: [], healpot: [], combatpot: [], manapot: [], utilpot: [] } };
}
function addAb(m, name, id, amt, over, crit) {
  let a = m.get(name);
  if (!a) m.set(name, a = { name, id, total: 0, over: 0, hits: 0, crits: 0, max: 0 });
  a.total += amt; a.over += over; a.hits++; if (crit) a.crits++; if (amt > a.max) a.max = amt;
}
// battle resses and externals: who they went on (the Performance tab's Utility view)
const HELP_CAST = new Set(['rebirth', 'raise ally', 'intercession', 'soulstone', 'pain suppression', 'guardian spirit', 'ironbark', 'life cocoon', 'blessing of sacrifice', 'blessing of protection', 'blessing of spellwarding', 'time dilation', 'rescue', 'power infusion']);
// Major healing cooldowns (the Performance tab's Healing cooldowns): the heal each logs (by name, or "summon: heal" for a
// totem or summon) -> the cooldown it belongs to; each heal is credited to its caster's latest press
const CD_HEALS = new Map([['tranquility', 'Tranquility'], ['divine hymn', 'Divine Hymn'], ['holy word: salvation', 'Holy Word: Salvation'], ['revival', 'Revival'], ['restoral', 'Restoral'],
  ['celestial conduit', 'Celestial Conduit'], ["yu'lon: soothing breath", "Invoke Yu'lon, the Jade Serpent"], ['healing tide totem: healing tide', 'Healing Tide Totem'],
  ['spirit link totem: spirit link', 'Spirit Link Totem'], ['rewind', 'Rewind'], ['dream flight', 'Dream Flight'], ['emerald communion', 'Emerald Communion'], ['vampiric embrace', 'Vampiric Embrace']]);
// damage reduction cooldowns, by the buff on the players inside: [cooldown, reduction, magic damage only] (tooltips, patch 12.1)
// Personal defensives' damage taken off (Oct 22, for the Defensives panel): buff name (lower case) -> [reduction, magic only]. Reduction 1 =
// an immunity (no number); 'abs' = an absorb shield (its soak is logged exactly). Values from the spells' text (Midnight, about; check
// against tooltips when tuning changes). Evasion, Spell Reflection and heals aren't here: they don't reduce damage taken.
const PERS_DR = new Map([['barkskin', [0.2]], ['survival instincts', [0.5]], ['rage of the sleeper', [0.2]], ['icebound fortitude', [0.3]],
  ['astral shift', [0.4]], ['unending resolve', [0.25]], ['fortifying brew', [0.2]], ['dampen harm', [0.3]], ['diffuse magic', [0.6, true]],
  ['divine protection', [0.2]], ['ardent defender', [0.2]], ['guardian of ancient kings', [0.5]], ['shield wall', [0.4]], ['die by the sword', [0.3]],
  ['obsidian scales', [0.3]], ['blur', [0.2]], ['feint', [0.4]], ['survival of the fittest', [0.3]], ['aspect of the turtle', [0.3]],
  ['dispersion', [0.75]], ['stoneform', [0.1]], ['ice cold', [0.7]], ['zen meditation', [0.6]], ['stone bulwark totem', ['abs']],
  ['anti-magic shell', ['abs']], ['dark pact', ['abs']], ['ice barrier', ['abs']], ['prismatic barrier', ['abs']], ['blazing barrier', ['abs']],
  ['ice block', [1]], ['divine shield', [1]], ['cloak of shadows', [1, true]], ['netherwalk', [1]]]);
// externals and Zephyr, by the buff on the player it covers: [reduction, magic only, area damage only] (tooltips, about)
const EXT_DR = new Map([['pain suppression', [0.4]], ['ironbark', [0.2]], ['blessing of sacrifice', [0.3]], ['zephyr', [0.2, false, true]]]);
const CD_DR = new Map([['power word: barrier', ['Power Word: Barrier', 0.20]], ['spirit link totem', ['Spirit Link Totem', 0.10]], ['anti-magic zone', ['Anti-Magic Zone', 0.15, true]]]);
// (Darkness: each attack it makes someone avoid logs as an absorb by the Demon Hunter, so that one is exact; Rallying Cry
// adds 10% maximum health for 10 seconds)
// Aura Mastery raises Devotion Aura from 3% to 12% for 8 seconds: what it adds of each hit it covered
const AM_ADD = (0.12 - 0.03) / (1 - 0.12);
// the presses that start a cooldown's entry (Celestial Conduit only for Mistweaver: Windwalker has one too)
const CD_PRESS = new Map([...CD_HEALS.values(), 'Aura Mastery', 'Power Word: Barrier', 'Spirit Link Totem', 'Anti-Magic Zone', 'Darkness', 'Rallying Cry'].map((n) => [n.toLowerCase(), n]));
function bigHit(p, h) { const b = p.big; if (b.length >= 8 && h.amt <= b[b.length - 1].amt) return; b.push(h); b.sort((x, y) => y.amt - x.amt); if (b.length > 8) b.pop(); }
// (a player's damage taken per second by what hit them: amount, hits, the biggest one (absorbs included) and how much was avoidable)
function bumpTk(arr, t, name, id, v, av, raw) { const i = t | 0; while (arr.length <= i) arr.push(null); const m = arr[i] || (arr[i] = {}), x = m[name]; if (x) { x[1] += v; x[2]++; if (raw > x[3]) x[3] = raw; x[4] += av; } else m[name] = [id, v, 1, raw, av]; }
function bumpAb(arr, t, name, id, v) { const i = t | 0; while (arr.length <= i) arr.push(null); const m = arr[i] || (arr[i] = {}); if (m[name]) m[name][1] += v; else m[name] = [id, v]; }
function bump(arr, t, v) { const i = t | 0; while (arr.length <= i) arr.push(0); arr[i] += v; }
function bumpN(arr, t, name, v) { const i = t | 0; while (arr.length <= i) arr.push(null); const m = arr[i] || (arr[i] = {}); m[name] = (m[name] || 0) + v; }
// a buff on a player going up or down: spans of [from, to] (to stays null while it's up; a buff removed without being put
// on in the log was up from the pull)
function buffUp(p, id, name, t, by) { let b = p.buffs.get(name); if (!b) p.buffs.set(name, b = { name, id, sp: [], by: new Map() }); const l = b.sp[b.sp.length - 1]; if (l && l[1] == null) return; if (b.sp.length < 400) b.sp.push([t, null]); if (by) b.by.set(by, (b.by.get(by) || 0) + 1); }
// (debuffs on players the same way: when each went on and off, from whom, and the most stacks it reached)
function debuffUp(p, id, name, t, by) { let b = p.debuffs.get(name); if (!b) p.debuffs.set(name, b = { name, id, sp: [], by: new Map(), mx: 1 }); const l = b.sp[b.sp.length - 1]; if (l && l[1] == null) return; if (b.sp.length < 400) b.sp.push([t, null]); if (by) b.by.set(by, (b.by.get(by) || 0) + 1); }
function debuffDown(p, id, name, t) { const b = p.debuffs.get(name); if (!b) { p.debuffs.set(name, { name, id, sp: [[0, t]], by: new Map(), mx: 1 }); return; } const l = b.sp[b.sp.length - 1]; if (l && l[1] == null) l[1] = t; }
// (stat items (Oct 22): buffs from trinkets, Venomcursed gear and weapon enchants that raise or lower a stat, by spell ID (Hex Lord's Doom
// is two spells with one name), as their stacks over time ([t, stacks]) for Gear and extras' estimate. Copies that overlap come as stacks;
// one that ends and starts again at the same moment keeps its count)
const STAT_BUFF_N = new Set(['soul fang alacrity', 'voracious heart of ula\'tek', 'devoured strength', 'empowering venom', 'devastating power', 'hex lord\'s doom', 'tidal insight',
  'freightrunner\'s flask', 'focus of ula\'tek', 'riftwalker\'s temptation', 'deepening temptation', 'akil\'zon\'s rite', 'jan\'alai\'s rite', 'halazzi\'s rite', 'nalorakk\'s rite',
  'precision of the dragonhawk', 'genius insight', 'frenzied focus', 'seriously sharp seashell', '50-lb midnight salmon', 'tattered tortollan scroll', 'rotting voidfin', 'slick and slimy gralstone', 'brittle torga totem']);
const isStatBuf = (n) => STAT_BUFF_N.has(n) || n.startsWith('venomcursed ');
function statBuf(p, id, name, t, op, n) { if (!p.statB) p.statB = new Map(); let b = p.statB.get(id); if (!b) p.statB.set(id, b = { id, name, l: [], pv: 0 }); const l = b.l; if (l.length >= 4000) return;
  const z = l[l.length - 1], cur = z ? z[1] : 0; let v;
  if (op === 'a') v = z && cur === 0 && t - z[0] < 0.06 && b.pv > 0 ? b.pv : 1; else if (op === 'd') v = Math.max(0, n || 0); else { if (!z) l.push([0, 1]); b.pv = cur || 1; v = 0; }
  l.push([t, v]); }
function buffPre(p, id, name) { let b = p.buffs.get(name); if (!b) p.buffs.set(name, b = { name, id, sp: [[0, null]], by: new Map() }); return b; }
function buffDown(p, id, name, t) { let b = p.buffs.get(name); if (!b) p.buffs.set(name, b = { name, id, sp: [], by: new Map() }); const l = b.sp[b.sp.length - 1]; if (l && l[1] == null) l[1] = t; else if (!b.sp.length) b.sp.push([0, t]); }
// a player's mana from a cast's advanced block (the power lists are pipe-separated: "9|0" with "5|274744" is Holy Power 5
// and mana 274744): [t, fraction], at most one every 2 seconds
// (and the cast's mana cost, written after the power: { t, spell, id, cost } as a share of their mana, for "what their mana
// went on")
function manaAt(p, f, a, t, spell, id) { const ty = String(f[a + 10]).split('|'), k = ty.indexOf('0'); if (k < 0) return; const cur = +String(f[a + 11]).split('|')[k], mx = +String(f[a + 12]).split('|')[k]; if (!(mx > 0) || cur !== cur) return;
  p.manaMax = mx; // (their whole bar, for the Resources view's "bars of mana")
  const cost = +String(f[a + 13]).split('|')[k]; if (cost > 0 && spell) p.manaUse.push({ t, spell, id, cost: cost / mx });
  const l = p.mana[p.mana.length - 1]; if (l && t - l[0] < 2) { l[1] = Math.min(l[1], cur / mx); return; } p.mana.push([t, Math.max(0, Math.min(1, cur / mx))]); }
// a player's other power (rage, energy, combo points, Holy Power, runes and so on; not mana or Arcane Charges, where sitting
// at the top isn't a waste), from an event's advanced block, for "wasted resources": per power type, samples
// [t, current, max, spend] (a new one when it changed, or every 2 s). spend: 1 when the event's cast cost that power: its
// number is from just before paying it (a finisher at 7 combo points reads 7), so it says they were spending, not
// sitting at the top.
const RES_SKIP = new Set(['0', '16']);
const PET_AURA = new Set(['demonic power']), DMG_EV = new Set(['implosion', 'breath of eons']); // (Breath of Eons: its stored damage exploding, for each window's card)
function resAt(p, f, a, t) {
  const ty = String(f[a + 10]).split('|'); if (!ty.length || (ty.length === 1 && RES_SKIP.has(ty[0]))) return;
  const cu = String(f[a + 11]).split('|'), mx = String(f[a + 12]).split('|'), co = String(f[a + 13]).split('|');
  for (let k = 0; k < ty.length; k++) { if (RES_SKIP.has(ty[k]) || ty[k] === '') continue; const m = +mx[k], c = +cu[k], sp = +co[k] > 0 ? 1 : 0; if (!(m > 0) || c !== c) continue;
    let rs = p.res.get(ty[k]); if (!rs) p.res.set(ty[k], rs = { pts: [] }); const l = rs.pts[rs.pts.length - 1];
    if (l && l[1] === c && l[2] === m && l[3] === sp && t - l[0] < 2) continue; if (rs.pts.length < 8000) rs.pts.push([t, c, m, sp]); }
}

// (analyzeSteps is the reading itself, in steps: it stops every couple of thousand lines and between its later passes.
// analyze runs it straight through; analyzeAsync lets the page breathe (pause) every ~30 ms, so a long pull doesn't freeze
// the page for seconds. Same code, same result. `text` may also be the log's lines, already split)
function analyze(item, text, opts) { const g = analyzeSteps(item, text, opts); let s; do s = g.next(); while (!s.done); return s.value; }
async function analyzeAsync(item, text, opts, pause) {
  const g = analyzeSteps(item, text, opts); let t = Date.now();
  for (;;) { const s = g.next(); if (s.done) return s.value; if (Date.now() - t > 30) { await pause(); t = Date.now(); } }
}
function* analyzeSteps(item, text, opts) {
  const packs = (opts && opts.packs) || PACKS;
  const r = { item, players: new Map(), deaths: [], rezzes: [], mistakes: [], insights: [], interrupts: [],
    dmgS: [], healS: [], takenS: [], bossS: [], bossPct: null, duration: 0,
    takenAbS: [], // (takenAbS: per second, what hit the raid: { spell: [id, amount] }, for the Performance tab's big hits)
    dmgTS: [], enemyDied: new Map(), // (dmgTS: per second, the raid's damage by target name; enemyDied: guid -> when it died)
    cdUse: [] }; // (each press of a major healing cooldown: { g, cd, t, end, heal, over, prev, taken, cov })
  // a cooldown's entry: its caster's latest press (a heal from a press before the pull, or one the log missed, starts one)
  const cdPress = (g, cd, t, make) => { for (let i = r.cdUse.length - 1; i >= 0; i--) { const u = r.cdUse[i]; if (u.g === g && u.cd === cd && u.t <= t + 0.5) return u; }
    if (!make) return null; const u = { g, cd, t, end: null, heal: 0, over: 0, prev: 0, taken: 0, hp: 0, cov: new Set(), late: true }; r.cdUse.push(u); return u; };
  const extOn = new Map(); r.extMit = []; /* (externals and Zephyr up on a player: guid|buff -> the caster's use (EXT_DR)) */
  const persOn = new Map(); r.defMit = []; /* (personal defensives up on a player: guid|buff -> its use (PERS_DR)) */
  const persUse = (g, ln, nm, t) => { const u = { g, name: nm, t, end: null, prev: 0, taken: 0, abs: PERS_DR.get(ln)[0] === 'abs', imm: PERS_DR.get(ln)[0] === 1 }; r.defMit.push(u); persOn.set(g + '|' + ln, u); return u; };
  const persCover = (dg, amt, magic) => { for (const [k, u] of persOn) { if (u.g !== dg) continue; const [red, mag] = PERS_DR.get(k.slice(k.indexOf('|') + 1)); if (u.abs || u.imm || (mag && !magic)) continue; u.prev += amt * red / (1 - red); u.taken += amt; } };
  const devOn = new Map(), drOn = new Map(); // (who has Devotion Aura up, and whose aura it is; who sits in a Barrier, Spirit Link or Anti-Magic Zone: guid|buff -> the caster)
  const pMax = new Map(); r.pMax = pMax; // (each player's maximum health, last seen: what a Rallying Cry adds 10% to)
  // a hit on a player from an enemy, after mitigation (absorbs included): what an Aura Mastery, a Barrier or a Spirit Link
  // over them took off it (estimated from the reduction: the log only has what was left)
  const amOn = (t) => { for (let i = r.cdUse.length - 1; i >= 0; i--) { const u = r.cdUse[i]; if (t - u.t > 30) break; if (u.cd === 'Aura Mastery' && t >= u.t && t <= (u.end != null ? u.end : u.t + 8) + 0.05) return true; } return false; }; /* (an Aura Mastery is up: Devotion Aura is 12% then) */
  const cdCover = (dg, t, amt, magic) => {
    let rc = 0; for (let i = r.cdUse.length - 1; i >= 0; i--) { const u = r.cdUse[i]; if (t - u.t > 30) break;
      if (u.cd === 'Aura Mastery' && t >= u.t && t <= (u.end != null ? u.end : u.t + 8) + 0.05 && (dg === u.g || devOn.has(dg))) { u.prev += amt * AM_ADD; rc += amt * AM_ADD; u.taken += amt; u.cov.add(dg); } }
    for (const [ln, [cd, red, mag]] of CD_DR) { if (mag && !magic) continue; const by = drOn.get(dg + '|' + ln); if (!by) continue; const u = cdPress(by, cd, t, true); u.prev += amt * red / (1 - red); rc += amt * red / (1 - red); u.taken += amt; u.cov.add(dg); }
    if (rc > 0) { const tp = r.players.get(dg); if (tp) bump(tp.cdRS || (tp.cdRS = []), t, rc); } /* (what others' cooldowns took off this player's hits (Oct 24)) */
  };
  const pets = new Map(), recaps = new Map(), mech = new Mech(item, packs);
  const hits = new Map(), stackEv = [], npcCasts = [], npcStart = new Map(), npcStarts = [];
  const mod = item.kind === 'boss' ? MODULES.find((m) => m.encounter === item.boss) : null;
  const watch = mod ? new Set(mod.spells) : null, modEv = [];
  const watchIds = mod && mod.ids ? new Set(mod.ids) : null;
  const W = (name, id) => (watch && watch.has(String(name).toLowerCase())) || (watchIds && watchIds.has(+id));
  // Unit positions from the advanced-logging block (x/y in world yards), kept at most every 0.5s per unit.
  const positions = new Map();
  // The log's advanced block gives positionX (north) then positionY (west), in yards. Positions are kept as
  // [t, east, north] (= Warcraft Logs' x and y), which is what the arena maps are drawn in.
  const pos = (g, n, px, py, t) => {
    const x = -(+py), y = +px; if (!g || !(x || y) || x !== x || y !== y) return;
    let u = positions.get(g); if (!u) positions.set(g, u = { guid: g, name: n, pts: [] });
    if (n && !u.name) u.name = n;
    const last = u.pts[u.pts.length - 1];
    if (!last || t - last[0] >= 0.5) u.pts.push([t, x, y]);
  };
  r.positions = positions;
  // When each enemy first appears (for grouping adds into spawn waves) and its raid markers over time.
  const firstSeen = new Map(), marks = new Map();
  const unitNames = new Map();
  const seen = (g, t, n) => { if (g && (g.startsWith('Creature-') || g.startsWith('Vehicle-'))) { if (!firstSeen.has(g)) firstSeen.set(g, t); if (n && !unitNames.has(g)) unitNames.set(g, n); } };
  const mark = (g, flags, t) => {
    const v = parseInt(flags, 16) & 0xff; if (!v || !g || isPlayer(g)) return;
    let idx = 0; while (!((v >> idx) & 1)) idx++;
    let l = marks.get(g); if (!l) marks.set(g, l = []);
    if (!l.length || l[l.length - 1][1] !== idx + 1) l.push([t, idx + 1]);
  };
  r.firstSeen = firstSeen; r.marks = marks; r.combatantsRaw = []; r.unitNames = unitNames;
  const hit = (g, t, spell, id) => { let l = hits.get(g); if (!l) hits.set(g, l = []); l.push({ t, spell, id }); };
  const bossNames = new Set(item.kind === 'run' ? item.bosses.map((b) => b.boss) : [item.boss]);
  const P = (g, n) => { let p = r.players.get(g); if (!p) r.players.set(g, p = newPlayer(g)); if (n && !p.name) p.name = shortName(g, n); return p; };
  // each player's last 12 seconds of damage and healing (was the last 16 events, which is under a second in heavy raid damage)
  const recap = (g, e) => { let l = recaps.get(g); if (!l) recaps.set(g, l = []); l.push(e); while (l.length > 600 || (l.length && l[0].t < e.t - 16)) l.shift(); }; // (16 s kept: a death reads its last 15 s (your ask, Oct 22))
  let lastT = 0;
  const units = new Map(); // enemy health from advanced logging: guid -> { name, max, cur, samples }
  const seenHp = (g, n, cur, mx, t) => {
    if (!(mx > 0) || isPlayer(g) || !(g.startsWith('Creature-') || g.startsWith('Vehicle-'))) return;
    let u = units.get(g); if (!u) units.set(g, u = { name: n, max: mx, cur, samples: [] });
    u.max = Math.max(u.max, mx); const pct = Math.min(1, cur / mx);
    const s = t | 0, last = u.samples[u.samples.length - 1];
    if (last && last[0] === s) last[1] = pct; else u.samples.push([s, pct]);
  };
  // each player's health from advanced logging (damage and heals on them): guid -> [[t, fraction]], one sample per
  // quarter second keeping the lowest, for the survival check's close calls
  const php = new Map(); r.php = php;
  // (Tyr's Deliverance's buff (200654) on a player, by whose: their Holy Light, Flash of Light and Holy Shock heal that player 10% more (12.1.5))
  const TIER_EVN = new Set(['Sigil of Flame', 'Immolation Aura', 'Sigil of Spite', 'Crash Lightning', 'Slam', 'Icy Death Torrent', 'Fate Mirror', 'Necrotic Bolt', 'Withering Grasp', 'Lingering Shadow', 'Lightning Bolt', 'Chain Lightning', 'Lava Burst', 'Cobra Shot', 'Shield Slam', 'Revenge', 'Arcane Blast', 'Arcane Pulse', 'Prismatic Bolt', 'Rising Sun Kick', 'Spinning Crane Kick', 'Wildfire Bomb', 'Pyroblast', 'Flamestrike', 'Mangle']),
    TIER_EVP = /^(Eviscerate|Black Powder|Backstab|Gloomblade|Shuriken Storm)/, TIER_EVPET = new Set(['Necrotic Bolt', 'Withering Grasp']); // (the hits a tier bonus changes one by one (Oct 25))
  const awOn = new Set(), AW_SKIP = /^(rune of |soulcoil|glistening|saved by the light|overflowing light|armory of light|greater judgment)/i; /* (Avenging Wrath up on a Holy Paladin: their heals' raw, effective and overheal, for its real extra) */
  const tyrOn = new Set(), TYR_UP = new Set(['holy light', 'flash of light', 'holy shock']);
  // (heals and absorbs landing on a player under half health: [t, target, healer, amount, 1 for an absorb, spell], for the healers' saves)
  const lowHL = []; r.lowHL = lowHL;
  const phpNow = (g) => { const l = php.get(g); return l && l.length ? l[l.length - 1][1] : 1; };
  const seenPhp = (g, cur, mx, t) => {
    if (!(mx > 0) || !isPlayer(g)) return;
    const fr = Math.max(0, Math.min(1, cur / mx)); let l = php.get(g); if (!l) php.set(g, l = []);
    const last = l[l.length - 1]; if (last && t - last[0] < 0.25) { if (fr < last[1]) last[1] = fr; } else l.push([t, fr]);
  };

  const lines = typeof text === 'string' ? text.split('\n') : text;
  for (let li = 0; li < lines.length; li++) {
    if (!(li & 2047)) yield;
    let line = lines[li];
    if (!line) continue;
    if (line.charCodeAt(line.length - 1) === 13) line = line.slice(0, -1);
    const ts = parseTs(line); if (!ts) continue;
    const t = Math.max(0, (ts.ms - item.startMs) / 1000); lastT = t;
    const c = line.indexOf(',', ts.body); if (c < 0) continue;
    const ev = line.substring(ts.body, c);
    // (a buff renewed while it was still up, e.g. a proc landing on one you still hold: noted on that player's buff only,
    // so it changes nothing else. Warcraft Logs sends none for Infusion of Light, Divine Purpose or Dawnlight)
    if (ev === 'SPELL_AURA_REFRESH') { const f = split(line, c + 1), p = f.length >= 12 && f[11] === 'BUFF' && r.players.get(f[4]), b = p && buffPre(p, num(f[8]), f[9]);
      if (b) { if (!b.ref) b.ref = []; if (b.ref.length < 600) b.ref.push(t); if (isPlayer(f[0]) && f[0] !== f[4]) { const w = shortName(f[0], f[1]); b.by.set(w, (b.by.get(w) || 0) + 1); } }
      // (a debuff a player renewed on an enemy while it was still up: kept with their damage over time events, marked 2, for the early-refresh check)
      if (f.length >= 12 && f[11] === 'DEBUFF' && !isPlayer(f[4])) { const q0 = r.players.get(f[0]); if (q0) { if (!q0.dotEv) q0.dotEv = []; if (q0.dotEv.length < 30000) q0.dotEv.push([t, 2, f[9], f[4]]); } }
      continue; }
    // (an empowered spell let go: its rank, on the player who cast it, for the spec checks)
    if (ev === 'SPELL_EMPOWER_END') { const f = split(line, c + 1), p = f.length >= 12 && r.players.get(f[0]); if (p) { if (!p.empL) p.empL = []; if (p.empL.length < 600) p.empL.push([t, f[9], num(f[11])]); } continue; }
    if (!WANTED.has(ev)) continue;
    const f = split(line, c + 1);

    if (ev === 'COMBATANT_INFO') {
      if (f.length > 24) { let s = num(f[24]); if (!SPECS[s]) s = num(f[23]); if (SPECS[s]) P(f[0]).specId = s; }
      // gear, stats and buffs at the pull (for the Raid audit), in the shape Warcraft Logs gives them
      try { const ci = parseCombatant(line, ts.body, f); if (ci && !r.combatantsRaw.some((x) => x.guid === ci.guid)) r.combatantsRaw.push(ci); { const da = ci && (ci.auras || []).find((a) => +a.ability === 465); if (da) devOn.set(ci.guid, da.source); } /* (Devotion Aura up at the pull's start (Oct 23)) */ } catch (e) { /* skip a line we can't read */ }
      continue;
    }
    if (f.length < 8) continue;
    const sg = f[0], sn = f[1], dg = f[4], dn = f[5];
    seen(sg, t, sn); seen(dg, t, dn); mark(sg, f[3], t); mark(dg, f[7], t);
    // (an enemy's spell: from a hostile unit that isn't a player's or their pet's)
    if (f.length > 9 && ENEMY_EV.has(ev) && !isPlayer(sg) && !pets.has(sg) && (parseInt(f[2], 16) & 0x40)) noteEnemy(num(f[8]), f[9]);

    // (a player's summon: the pet is theirs, and its time and spell are kept for the spec checks, e.g. a Warlock's demons)
    if (ev === 'SPELL_SUMMON') { if (isPlayer(sg)) { pets.set(dg, sg); if (f.length > 9 && f[8] !== '0') { const q = P(sg, sn); if (!q.sumL) q.sumL = []; if (q.sumL.length < 6000) q.sumL.push([t, f[9], dg, dn]); } } continue; }
    // (a battle rez or any resurrect on a player: back alive, for the wipe call (Oct 23))
    if (ev === 'SPELL_RESURRECT') { if (isPlayer(dg)) r.rezzes.push({ t, guid: dg, by: sg, spell: f[9] || '' }); continue; }
    if (ev === 'UNIT_DIED') {
      if (!isPlayer(dg)) { const u = units.get(dg); if (u) u.samples.push([t | 0, 0]); if (!r.enemyDied.has(dg)) r.enemyDied.set(dg, t); if (mod) modEv.push({ k: 'die', t, guid: dg, name: dn }); continue; }
      if (f[8] === '1') continue;
      const p = P(dg, dn); p.deaths++;
      const recent = (recaps.get(dg) || []).filter((e) => e.t >= t - 15);
      let last = null; for (const e of recent) if (!e.heal) last = e;
      r.deaths.push({ t, guid: dg, player: p.name, killer: last ? last.src : 'Unknown', ability: last ? last.spell : '', abilityId: last ? last.id : 0, recap: recent });
      continue;
    }

    const owner = isPlayer(sg) ? sg : (pets.get(sg) || '');
    const pet = owner && !isPlayer(sg);

    switch (ev) {
      // a watched spell that missed a player (immune, Turtle, Cloak...): they were still in it, e.g. a Guillotine soaker
      // a player's auto attack that missed an enemy still means they were in melee range (melee uptime)
      case 'SWING_MISSED': { if (isPlayer(sg) && (parseInt(f[6], 16) & 0x40)) { const p = P(sg, sn); (p.swT || (p.swT = [])).push(t); } else if (isPlayer(dg) && (parseInt(f[2], 16) & 0x40)) { const p = P(dg, dn); if (!p.hitIn) p.hitIn = []; if (p.hitIn.length < 20000) p.hitIn.push([t, 6603]); } break; }
      case 'SPELL_MISSED': case 'SPELL_PERIODIC_MISSED': {
        if (f.length >= 12 && isPlayer(dg) && W(f[9], f[8])) modEv.push({ k: 'miss', t, dst: dg, spell: f[9], id: num(f[8]), how: f[11], src: sg });
        break;
      }
      // A share of a player's hit that another player's buff gave (Augmentation's Ebon Might, Prescience, Shifting Sands, Fate Mirror, Breath of Eons):
      // the hitter's damage again, with the buff's spell, and the buffer's GUID last. It counts for the buffer and comes off the hitter, off the hit it
      // follows when there is one (same moment and target), the way Warcraft Logs adds them up. The whole raid's total doesn't change. (Oct 19)
      case 'SPELL_DAMAGE_SUPPORT': case 'SPELL_PERIODIC_DAMAGE_SUPPORT': case 'RANGE_DAMAGE_SUPPORT': case 'SWING_DAMAGE_LANDED_SUPPORT': {
        const swing = ev.startsWith('SWING'), adv = swing ? 8 : 11; if (f.length < adv + 9 || !(parseInt(f[6], 16) & 0x40)) break;
        const hasAdv = f.length >= adv + ADV + 9, s0 = adv + (hasAdv ? ADV : 0); let sup = f[f.length - 1], hitter = owner;
        // (the Evoker is the buffer: if the line has it the other way round, swap)
        if (isPlayer(sg) && (r.players.get(sg) || {}).specId === 1473 && (r.players.get(sup) || {}).specId !== 1473) { const x = sup; sup = sg; hitter = isPlayer(x) ? x : (pets.get(x) || ''); }
        if (!isPlayer(sup)) break;
        const amt = Math.max(0, num(f[s0]) + num(f[s0 + 4]) + num(f[s0 + 5]) - Math.max(0, num(f[s0 + 2]))); if (!amt) break;
        const spell = swing ? 'Support' : f[9], id = swing ? 0 : num(f[8]), crit = f[s0 + 7] === '1';
        const a = P(sup, null); a.damage += amt; addAb(a.dmgAb, spell, id, amt, 0, crit); if (spell === 'Fate Mirror') { if (!a.tierEv) a.tierEv = []; if (a.tierEv.length < 12000) a.tierEv.push([t, spell, amt, null, 0, crit ? 1 : 0]); } bump(a.dmgS, t, amt); a.dmgT.set(dn, (a.dmgT.get(dn) || 0) + amt); bumpN(a.dmgTS, t, dn, amt);
        // (by buff, and by whose hit it came through, for "damage through your buffs"; Breath of Eons' explosions one by one)
        (a.supAb || (a.supAb = new Map())).set(spell, (a.supAb.get(spell) || 0) + amt); if (hitter && hitter !== sup) { const hn = P(hitter, null).name || ''; if (hn) (a.supTo || (a.supTo = new Map())).set(hn, (a.supTo.get(hn) || 0) + amt); }
        if (DMG_EV.has(String(spell).toLowerCase())) { if (!a.dmgEv) a.dmgEv = []; if (a.dmgEv.length < 6000) a.dmgEv.push([t, spell, dg, amt]); }
        if (hitter && hitter !== sup) { const p = P(hitter, null), lh = p.lastHit, ab = lh && lh[2] === dg && Math.abs(lh[0] - t) < 0.02 ? p.dmgAb.get(lh[1]) : null;
          p.damage -= amt; bump(p.dmgS, t, -amt); if (p.dmgT.has(dn)) p.dmgT.set(dn, p.dmgT.get(dn) - amt); bumpN(p.dmgTS, t, dn, -amt); if (ab) ab.total = Math.max(0, ab.total - amt); else p.supOut = (p.supOut || 0) + amt; }
        else bump(r.dmgS, t, amt);
        break;
      }
      case 'SPELL_DAMAGE': case 'SPELL_PERIODIC_DAMAGE': case 'RANGE_DAMAGE': case 'SWING_DAMAGE': {
        const swing = ev === 'SWING_DAMAGE', adv = swing ? 8 : 11;
        if (f.length < adv + 8) break;
        const hasAdv = f.length >= adv + ADV + 8, s0 = adv + (hasAdv ? ADV : 0);
        if (swing && hasAdv && !owner && f[adv] === sg && isPlayer(f[adv + 1])) pets.set(sg, f[adv + 1]);
        const base = num(f[s0]), over = Math.max(0, num(f[s0 + 2]));
        const dealt = Math.max(0, base + num(f[s0 + 4]) + num(f[s0 + 5]) - over);
        const crit = f[s0 + 7] === '1';
        const id = swing ? 6603 : num(f[8]), spell = swing ? 'Melee' : f[9];
        if (!swing) { noteSchool(id, f[10]); noteId(id, spell); } else SCHOOL.set(6603, 1);
        let hp = -1;
        if (hasAdv) pos(f[adv], f[adv] === dg ? dn : f[adv] === sg ? sn : '', f[adv + PX], f[adv + PX + 1], t);
        if (hasAdv && f[adv] === sg && isPlayer(sg)) resAt(P(sg, sn), f, adv, t); // (their power, when the block is theirs)
        if (hasAdv && f[adv] === dg) { const mx = num(f[adv + 3]); if (mx > 0 && isPlayer(dg)) pMax.set(dg, mx); if (mx > 0) { hp = num(f[adv + 2]) / mx * 100; seenHp(dg, dn, num(f[adv + 2]), mx, t); seenPhp(dg, num(f[adv + 2]), mx, t); } }
        if (isPlayer(dg)) {
          const p = P(dg, dn);
          if (ev !== 'SPELL_PERIODIC_DAMAGE' && (parseInt(f[2], 16) & 0x40)) { if (!p.hitIn) p.hitIn = []; if (p.hitIn.length < 20000) p.hitIn.push([t, id]); } /* (an enemy's direct hits on them, melee included: when a tank was tanking (Oct 25)) */
          p.taken += base; addAb(p.takenAb, spell, id, base, 0, crit); bump(r.takenS, t, base); bump(p.takenS, t, base); { const raw = num(f[s0 + 1]), ab = Math.max(0, num(f[s0 + 6])); if (raw > 0) { bump(p.rawS, t, raw); bump(p.mitS, t, Math.max(0, raw - base - ab)); } if (ab > 0) bump(p.shS, t, ab); if (devOn.has(dg)) { const dv = (base + ab) * 0.03 / (amOn(t) ? 0.88 : 0.97), gq = r.players.get(devOn.get(dg)); bump(p.devS, t, dv); if (gq) bump(gq.devGS || (gq.devGS = []), t, dv); } } /* (devS: what Devotion Aura's 3% took off, about) */ /* (Graphs' Mitigation tab (Oct 23)) */
          if (base > 0) bumpAb(r.takenAbS, t, spell, id, base);
          const av = mech.damage(t, p.name, id, spell, base), raw = base + Math.max(0, num(f[s0 + 6])); p.avoidable += av;
          if (raw > 0) bumpTk(p.takenAbS, t, spell, id, base, av, raw);
          if (base + num(f[s0 + 6]) > 0) bigHit(p, { t, amt: base + Math.max(0, num(f[s0 + 6])), spell, id, src: shortName(sg, sn), hp });
          if (!owner) hit(dg, t, spell, id);
          if (W(spell, id)) modEv.push({ k: 'dmg', t, dst: dg, spell, id, amt: base, raw: base + Math.max(0, num(f[s0 + 6])), src: sg, srcName: sn, tick: ev === 'SPELL_PERIODIC_DAMAGE' }); // (raw: the hit with what shields absorbed; tick: a damage over time's tick)
          if (r.cdUse.length && (parseInt(f[2], 16) & 0x40)) { const amt = base + Math.max(0, num(f[s0 + 6])), sch = swing ? 1 : parseInt(f[10], 16) || 1; if (amt > 0) cdCover(dg, t, amt, (sch & ~1) !== 0); }
          if (extOn.size && (parseInt(f[2], 16) & 0x40)) { const amt = base + Math.max(0, num(f[s0 + 6])), sch = swing ? 1 : parseInt(f[10], 16) || 1; if (amt > 0) for (const [k, u] of extOn) { if (!k.startsWith(dg + '|')) continue; const [red, mag, aoe] = EXT_DR.get(k.slice(k.indexOf('|') + 1)); if ((mag && (sch & ~1) === 0) || (aoe && swing)) continue; u.prev += amt * red / (1 - red); u.taken += amt; bump(p.cdRS || (p.cdRS = []), t, amt * red / (1 - red)); } } /* (externals' and Zephyr's share (Oct 24)) */
          if (persOn.size && (parseInt(f[2], 16) & 0x40)) { const amt = base + Math.max(0, num(f[s0 + 6])), sch = swing ? 1 : parseInt(f[10], 16) || 1; if (amt > 0) persCover(dg, amt, (sch & ~1) !== 0); } /* (personal defensives' share (Oct 22)) */
          recap(dg, { t, heal: false, amount: base, src: shortName(sg, sn), spell, id, hp });
        } else if (owner && (parseInt(f[6], 16) & 0x40)) { // (damage on enemies only: a mind-controlled player hitting a friendly pet isn't damage done)
          const p = P(owner, pet ? null : sn);
          if (swing && !pet) (p.swT || (p.swT = [])).push(t); // (their own auto attacks, for melee uptime; a Warcraft Logs miss comes as a hit of 0)
          p.damage += dealt;
          if (mod && mod.focus && mod.focus.has(dn)) modEv.push({ k: 'pdmg', t, src: owner, dst: dg, dn, amt: dealt }); addAb(p.dmgAb, pet ? sn + ': ' + spell : spell, id, dealt, 0, crit); bump(r.dmgS, t, dealt);
          bump(p.dmgS, t, dealt); if (dealt > 0) { p.dmgT.set(dn, (p.dmgT.get(dn) || 0) + dealt); bumpN(r.dmgTS, t, dn, dealt); bumpN(p.dmgTS, t, dn, dealt); if (!p.firstHit.has(dg)) p.firstHit.set(dg, t); }
          if ((TIER_EVN.has(spell) || TIER_EVP.test(spell)) && (!pet || TIER_EVPET.has(spell))) { if (!p.tierEv) p.tierEv = []; if (p.tierEv.length < 12000) p.tierEv.push([t, spell, dealt, dg, ev === 'SPELL_PERIODIC_DAMAGE' ? 1 : 0, crit ? 1 : 0]); } /* (each hit of a spell a tier bonus changes hit by hit, for the tier set card (Oct 25)) */
          p.lastHit = [t, pet ? sn + ': ' + spell : spell, dg]; // (for a support line that follows it: see *_DAMAGE_SUPPORT)
          // (the hits the spec checks count one by one, e.g. Implosion's: one per Wild Imp on each target)
          // (with the amount; and every "(Erupt)" hit, like the plagues Unholy's Blightfall sets off, so a press can be credited with them)
          { const lsp = spell.toLowerCase(); if (!pet && (DMG_EV.has(lsp) || lsp.endsWith(' (erupt)'))) { if (!p.dmgEv) p.dmgEv = []; if (p.dmgEv.length < 6000) p.dmgEv.push([t, spell, dg, dealt]); } }
        }
        break;
      }
      case 'ENVIRONMENTAL_DAMAGE': {
        if (!isPlayer(dg) || f.length < 31) break;
        const base = num(f[28]), p = P(dg, dn);
        p.taken += base; addAb(p.takenAb, f[27], 0, base, 0, false); bump(r.takenS, t, base); bump(p.takenS, t, base); if (base > 0) bumpTk(p.takenAbS, t, f[27], 0, base, 0, base);
        recap(dg, { t, heal: false, amount: base, src: 'Environment', spell: f[27], id: 0, hp: -1 });
        break;
      }
      case 'SPELL_HEAL': case 'SPELL_PERIODIC_HEAL': {
        if (f.length < 16) break;
        const s0 = 11 + (f.length >= 11 + ADV + 5 ? ADV : 0);
        if (s0 > 11) pos(f[11], f[11] === dg ? dn : f[11] === sg ? sn : '', f[11 + PX], f[12 + PX], t);
        if (s0 > 11 && f[11] === dg) { seenPhp(dg, num(f[13]), num(f[14]), t); if (num(f[14]) > 0 && isPlayer(dg)) pMax.set(dg, num(f[14])); }
        const amount = num(f[s0 + 1]), over = Math.max(0, num(f[s0 + 2])), crit = f[s0 + 4] === '1';
        const eff = Math.max(0, amount - over), id = num(f[8]), spell = f[9];
        noteSchool(id, f[10]);
        if (owner) {
          const p = P(owner, pet ? null : sn);
          p.healing += eff; p.overheal += over; addAb(p.healAb, pet ? sn + ': ' + spell : spell, id, eff, over, crit); bump(r.healS, t, eff); bump(p.healS, t, eff);
          // (triage: the heal's advanced block is the target's, health after it; under half before it)
          if (s0 > 11 && f[11] === dg && eff > 0 && isPlayer(dg)) { const mx = num(f[14]); if (mx > 0 && (num(f[13]) - eff) / mx < 0.5) { p.lowHeal += eff; if (lowHL.length < 60000) lowHL.push([t, dg, owner, eff, 0, spell]); } }
          if (!pet && spell === 'Flash of Light') { if (!p.folEv) p.folEv = []; if (p.folEv.length < 3000) p.folEv.push([t, eff, over]); } if (!pet && spell === 'Living Flame') { if (!p.lfEv) p.lfEv = []; if (p.lfEv.length < 3000) p.lfEv.push([t, eff]); } if (!pet && ev === 'SPELL_PERIODIC_HEAL' && eff > 0) { if (!p.hotS) p.hotS = []; const i0 = Math.floor(t); if (i0 >= 0 && i0 < 7200) p.hotS[i0] = (p.hotS[i0] || 0) + eff; } /* (each Flash of Light, for the tier set card (Oct 25)) */
          if (!pet && awOn.has(owner) && !AW_SKIP.test(String(spell))) { if (!p.awEv) p.awEv = []; if (p.awEv.length < 8000) p.awEv.push([eff + over, eff, over > 0 ? 1 : 0, spell === 'Holy Shock' ? 1 : 0]); }
          if (!pet && tyrOn.size && TYR_UP.has(String(spell).toLowerCase()) && tyrOn.has(dg + '|' + owner)) { p.tyrX = (p.tyrX || 0) + eff * 0.1 / 1.1; p.tyrXn = (p.tyrXn || 0) + 1; p.tyrB = (p.tyrB || 0) + eff; }
          if (!pet && HEAL_TO.has(String(spell).toLowerCase())) { if (!p.hT) p.hT = new Map(); let l = p.hT.get(spell); if (!l) p.hT.set(spell, l = []); if (l.length < 12000) l.push([t, dg, eff, over, ev === 'SPELL_PERIODIC_HEAL' ? 1 : 0]); } // (the last: a HoT's tick)
          const ck = CD_HEALS.get((pet ? sn + ': ' + spell : spell).toLowerCase());
          if (ck && (ck !== 'Celestial Conduit' || p.specId === 270)) { const u = cdPress(owner, ck, t, true); u.heal += eff; u.over += over; }
          if (/healthstone/i.test(spell) && !p.cons.healthstone.some((x) => Math.abs(x.t - t) < 2)) p.cons.healthstone.push({ t, name: spell, id });
          // (what a self-heal, Healthstone or health potion gave back: their own heal on themselves)
          if (!pet && owner === dg) { const ln = String(spell).toLowerCase(); if (SELF_HEAL.has(ln) || ln.includes('healthstone') || potionKind(ln) === 'healpot') p.selfH.push({ t, spell, id, amt: eff }); }
        }
        if (isPlayer(dg) && eff > 0) recap(dg, { t, heal: true, amount: eff, src: shortName(sg, sn), spell, id, hp: -1 });
        if (!owner && W(spell)) modEv.push({ k: 'heal', t, src: sg, srcName: sn, dst: dg, spell, amt: amount });
        break;
      }
      // a heal eaten by a heal absorb the module watches (e.g. Twin Fangs' Tainted Blood): the absorb's owner, the player
      // with it, the absorb, then the healer and their heal, then the amount eaten (the healer's pet or totem counts for them)
      case 'SPELL_HEAL_ABSORBED': {
        if (mod && f.length >= 19 && W(f[9], f[8])) { const hg = f[11], ho = isPlayer(hg) ? hg : pets.get(hg) || '';
          modEv.push({ k: 'habs', t, dst: dg, spell: f[9], id: num(f[8]), healer: ho || hg, heal: f[16], healId: num(f[15]), amt: num(f[18]) }); }
        break;
      }
      case 'SPELL_ABSORBED': {
        const a = f.length >= 21 ? 11 : 8, sp = a + 4;
        if (f.length < sp + 4) break;
        const absorber = f[a], id = num(f[sp]), amt = num(f[sp + 3]);
        noteSchool(id, f[sp + 2]);
        if (amt <= 0 || NOT_HEALING.has(id)) break;
        /* (Oct 26, your ask "isolate damage done to the shields on coiled altar": each hit into Veil of Twilight (Eternal Nightfall's shield) and the
           Dreadmarch shields on mind-controlled players: [shield id, time, who hit it, amount, whose shield]) */
        if ((id === 1286912 || id === 1297445) && owner) (r.shieldHits || (r.shieldHits = [])).push([id, +t.toFixed(2), P(owner, pet ? null : sn).name, amt, dg]);
        // (a player's hit soaked by a boss's own shield, like Malacrass's Eternal Nightfall: still damage into the boss, for the damage checks)
        if (mod && mod.focus && mod.focus.has(dn) && owner) modEv.push({ k: 'pdmg', t, src: owner, dst: dg, dn, amt, abs: true });
        // (damage an enemy's shield soaked: the Performance tab's damage windows count it, like a Nightfall shield's)
        if (owner && amt > 0 && !isPlayer(dg) && (parseInt(f[6], 16) & 0x40)) bump(P(owner, pet ? null : sn).absS, t, amt);
        const ow = isPlayer(absorber) ? absorber : pets.get(absorber);
        if (!ow) break;
        // (Darkness: an attack it made someone avoid, exact)
        if (isPlayer(dg) && String(f[sp + 1]).toLowerCase() === 'darkness') { const u = cdPress(ow, 'Darkness', t, true); u.prev += amt; u.taken += amt; u.cov.add(dg); }
        { const u = PERS_DR.has(String(f[sp + 1]).toLowerCase()) && ow === dg ? r.defMit.slice().reverse().find((x) => x.g === dg && x.abs && x.name.toLowerCase() === String(f[sp + 1]).toLowerCase() && t - x.t <= 30) : null; if (u) u.prev += amt; } /* (a personal shield's soak, exact (Oct 22)) */
        const p = P(ow, isPlayer(absorber) ? f[a + 1] : null);
        if (isPlayer(dg)) { const tp = r.players.get(dg); if (tp) { const m = tp.shBy || (tp.shBy = new Map()); m.set(p.name || '', (m.get(p.name || '') || 0) + amt); } } /* (who shielded whom (Oct 23)) */
        p.healing += amt; p.absorbs += amt; addAb(p.healAb, f[sp + 1], id, amt, 0, false);
        if (awOn.has(ow) && String(f[sp + 1]) === 'Overflowing Light') p.awOL = (p.awOL || 0) + amt; /* (Overflowing Light soaked while Avenging Wrath was up) */
        if (isPlayer(dg) && phpNow(dg) < 0.5 && lowHL.length < 60000) lowHL.push([t, dg, ow, amt, 1, f[sp + 1]]); bump(r.healS, t, amt); bump(p.healS, t, amt);
        if (isPlayer(dg)) recap(dg, { t, heal: true, amount: amt, src: shortName(absorber, f[a + 1]), spell: f[sp + 1] + ' (absorb)', id, hp: -1 });
        break;
      }
      case 'SPELL_AURA_APPLIED': case 'SPELL_AURA_APPLIED_DOSE': {
        if (f.length < 12) break;
        if (num(f[8]) === 1297445) (r.shieldAuras || (r.shieldAuras = [])).push([1297445, 1, +t.toFixed(2), dg]); /* (a Dreadmarch shield goes on (Oct 26)) */
        if (num(f[8]) === 200654 && f[11] === 'BUFF') tyrOn.add(dg + '|' + sg);
        if (f[11] === 'BUFF' && f[9] === 'Avenging Wrath' && dg === sg) awOn.add(dg);
        noteSchool(num(f[8]), f[10]); noteId(num(f[8]), f[9]);
        const stacks = ev === 'SPELL_AURA_APPLIED_DOSE' && f.length > 12 ? num(f[12]) : 1;
        const pl = isPlayer(dg);
        mech.aura(t, pl ? P(dg, dn).name : dn, pl, num(f[8]), f[9], stacks);
        if (W(f[9], f[8])) modEv.push({ k: 'aura', op: ev === 'SPELL_AURA_APPLIED' ? 'apply' : 'dose', t, dst: dg, spell: f[9], id: num(f[8]), stacks, src: sg, own: owner }); // (own: the player behind a pet or totem)
        if (!pl && ev === 'SPELL_AURA_APPLIED' && BOSS_AURA_N.has(f[9].toLowerCase())) bossAura(r, f[9], t, true);
        if (pl) { const sr = mech.get('stacks', num(f[8]), f[9]); if (sr) stackEv.push({ t, guid: dg, rule: sr, stacks, up: true, id: num(f[8]) }); }
        // (a buff on a player's demon that the spec checks read: Demonic Power's stacks are how many demons the Demonic Tyrant empowers)
        if (!pl && owner && f[11] === 'BUFF' && PET_AURA.has(f[9].toLowerCase())) { const q = P(owner, null); if (!q.petAur) q.petAur = []; if (q.petAur.length < 4000) q.petAur.push([t, f[9], stacks, dg]); }
        if (pl && f[11] === 'BUFF' && ev === 'SPELL_AURA_APPLIED') { buffUp(P(dg, dn), num(f[8]), f[9], t, isPlayer(sg) && sg !== dg ? shortName(sg, sn) : '');
          // (a zone's buff comes from the zone itself, e.g. Anti-Magic Zone: credit the player who pressed it last)
          const ln = f[9].toLowerCase(); if (PERS_DR.has(ln) && (sg === dg || !isPlayer(sg) || owner === dg)) persUse(dg, ln, f[9], t); /* (a personal defensive went up (Oct 22)) */
          if (EXT_DR.has(ln) && isPlayer(sg) && (sg !== dg || ln === 'zephyr')) { let u = null; for (let i = r.extMit.length - 1; i >= 0 && t - r.extMit[i].t <= 12; i--) if (r.extMit[i].g === sg && r.extMit[i].name === f[9]) { u = r.extMit[i]; break; } if (!u) { u = { g: sg, name: f[9], t, prev: 0, taken: 0 }; r.extMit.push(u); } extOn.set(dg + '|' + ln, u); } /* (an external or Zephyr went up (Oct 24)) */
          if (ln === 'devotion aura') devOn.set(dg, sg);
          else if (CD_DR.has(ln)) { let by = owner; if (!by) { for (let i = r.cdUse.length - 1; i >= 0 && t - r.cdUse[i].t <= 15; i--) if (r.cdUse[i].cd === CD_DR.get(ln)[0] && isPlayer(r.cdUse[i].g)) { by = r.cdUse[i].g; break; } } drOn.set(dg + '|' + ln, by || sg); }
          else if (ln === 'rallying cry' && (owner || isPlayer(sg))) { const u = cdPress(owner || sg, 'Rallying Cry', t, true); if (!u.cov.has(dg)) { u.cov.add(dg); u.hp += 0.1 * (pMax.get(dg) || 0); } } }
        // (crowd control a player, their pet or their totem landed on an enemy)
        if (!pl && owner && ev === 'SPELL_AURA_APPLIED' && f[11] === 'DEBUFF' && (parseInt(f[6], 16) & 0x40) && PERF_CC.has(f[9].toLowerCase())) { const q = P(owner, pet ? null : sn); if (q.ccL.length < 600) q.ccL.push({ t, spell: f[9], id: num(f[8]), on: dn }); }
        // (a debuff a player, their pet or their totem put on an enemy, e.g. a damage over time: when it went on, per target, for the spec checks' uptimes)
        if (!pl && owner && ev === 'SPELL_AURA_APPLIED' && f[11] === 'DEBUFF') { const q = P(owner, pet ? null : sn); if (!q.dotEv) q.dotEv = []; if (q.dotEv.length < 30000) q.dotEv.push([t, 1, f[9], dg]); }
        // (a buff's extra stack is a proc too, and its top stack: e.g. Infusion of Light at 2 with Inflorescence of the Sunwell)
        if (pl && f[11] === 'BUFF' && isStatBuf(f[9].toLowerCase())) statBuf(P(dg, dn), num(f[8]), f[9], t, ev === 'SPELL_AURA_APPLIED' ? 'a' : 'd', stacks);
        if (pl && f[11] === 'BUFF' && ev === 'SPELL_AURA_APPLIED_DOSE') { const b = buffPre(P(dg, dn), num(f[8]), f[9]); if (b) { b.mx = Math.max(b.mx || 1, stacks); if (!b.dose) b.dose = []; if (b.dose.length < 600) b.dose.push([t, stacks]); if (!b.dn) b.dn = []; if (b.dn.length < 3000) b.dn.push([t, stacks, 1]); } }
        if (pl && f[11] === 'DEBUFF') { const q = P(dg, dn); if (ev === 'SPELL_AURA_APPLIED') debuffUp(q, num(f[8]), f[9], t, sn && !isPlayer(sg) ? shortName(sg, sn) : ''); else { if (!q.debuffs.has(f[9])) debuffUp(q, num(f[8]), f[9], t, ''); const b = q.debuffs.get(f[9]); b.mx = Math.max(b.mx, stacks); } }
        break;
      }
      case 'SPELL_AURA_REMOVED':
        if (f.length >= 10 && num(f[8]) === 1297445) (r.shieldAuras || (r.shieldAuras = [])).push([1297445, 0, +t.toFixed(2), dg]); /* (and comes off (Oct 26)) */
        if (f.length >= 12 && num(f[8]) === 200654 && f[11] === 'BUFF') tyrOn.delete(dg + '|' + sg);
        if (f.length >= 12 && f[11] === 'BUFF' && f[9] === 'Avenging Wrath') awOn.delete(dg);
        if (f.length >= 10 && W(f[9], f[8])) modEv.push({ k: 'aura', op: 'remove', t, dst: dg, spell: f[9], id: num(f[8]), stacks: 0, src: sg });
        if (f.length >= 10 && !isPlayer(dg) && BOSS_AURA_N.has(f[9].toLowerCase())) bossAura(r, f[9], t, false);
        if (f.length >= 12 && f[11] === 'BUFF' && isPlayer(dg)) { buffDown(P(dg, dn), num(f[8]), f[9], t); if (isStatBuf(f[9].toLowerCase())) statBuf(P(dg, dn), num(f[8]), f[9], t, 'r');
          const ln = f[9].toLowerCase(); if (PERS_DR.has(ln)) { const u = persOn.get(dg + '|' + ln); if (u) { u.end = t; persOn.delete(dg + '|' + ln); } }
          if (EXT_DR.has(ln)) extOn.delete(dg + '|' + ln);
          if (ln === 'devotion aura') devOn.delete(dg); else if (CD_DR.has(ln)) drOn.delete(dg + '|' + ln);
          else if (ln === 'aura mastery') { const u = cdPress(dg, 'Aura Mastery', t, false); if (u && t - u.t < 12) u.end = t; } }
        if (f.length >= 12 && f[11] === 'DEBUFF' && isPlayer(dg)) debuffDown(P(dg, dn), num(f[8]), f[9], t);
        else if (f.length >= 12 && f[11] === 'DEBUFF' && owner) { const q = P(owner, pet ? null : sn); if (!q.dotEv) q.dotEv = []; if (q.dotEv.length < 30000) q.dotEv.push([t, 0, f[9], dg]); }
        break;
      // a player gaining power (rage from a hit, Holy Power from Holy Shock, mana from a potion…): how much, and how much of it
      // came while they were already full (the last four fields: amount, over, power type, max)
      case 'SPELL_ENERGIZE': case 'SPELL_PERIODIC_ENERGIZE': {
        if (f.length < 14 || !isPlayer(dg)) break;
        const n = f.length, amt = num(f[n - 4]), over = Math.max(0, num(f[n - 3])), ty = String(f[n - 2]);
        // (a negative one is power taken away, like Devourer's Fury draining inside Void Metamorphosis: kept as a drain, in whole points like a gain (Oct 26))
        // (no reading kept from it: it's from after, and the drain as Void Metamorphosis starts logs -1000 when only what was left went, so the
        // pages count a drain down to what was there)
        if (amt < 0 && /^\d+$/.test(ty)) { const pd = P(dg, dn); if (!pd.drainL) pd.drainL = []; if (pd.drainL.length < 8000) pd.drainL.push({ t, ty, spell: f[9], id: num(f[8]), amt: -amt }); break; }
        if (!(amt > 0) || !/^\d+$/.test(ty)) break;
        // (rd: the event's own block read that power too, right after the gain; Warcraft Logs only reads a player's main
        // power there, so a gain of Holy Power or combo points has no reading of its own)
        const own = f.length >= 11 + ADV + 4 && f[11] === dg, rd = own && String(f[21]).split('|').includes(ty) ? 1 : 0;
        const pg = P(dg, dn); if (pg.gainL.length < 8000) pg.gainL.push({ t, ty, spell: f[9], id: num(f[8]), amt, over: Math.min(amt, over), rd, src: sg });
        if (own) resAt(pg, f, 11, t);
        break;
      }
      case 'SPELL_CAST_START':
        if (f.length >= 10) noteId(num(f[8]), f[9]);
        // (a player starting a cast: matched to its cast going off, for casts that didn't finish)
        // (an instant proc can log its start and its cast at the same moment, the cast first: then it's done already)
        if (f.length >= 10 && isPlayer(sg)) { const ps = P(sg, sn), sid = num(f[8]), tl = ps.castTimes.get(sid), already = tl && tl.length && Math.abs(tl[tl.length - 1] - t) <= 0.05;
          if (ps.starts.length < 4000) ps.starts.push({ t, id: sid, spell: f[9], done: already ? t : null }); }
        if (f.length >= 10 && !isPlayer(sg)) { npcStart.set(sg + '|' + num(f[8]), t); if (npcStarts.length < 30000) npcStarts.push({ t, guid: sg, id: num(f[8]), spell: f[9] }); } // cast-bar spells (see kickReport)
        if (f.length >= 10 && !isPlayer(sg) && W(f[9], f[8])) modEv.push({ k: 'start', t, src: sg, srcName: sn, spell: f[9], id: num(f[8]) });
        break;
      case 'SPELL_AURA_REMOVED_DOSE': {
        if (f.length >= 13 && W(f[9], f[8])) modEv.push({ k: 'aura', op: 'rdose', t, dst: dg, spell: f[9], id: num(f[8]), stacks: num(f[12]), src: sg });
        if (f.length < 13 || !isPlayer(dg)) break;
        if (f[11] === 'BUFF' && isStatBuf(f[9].toLowerCase())) statBuf(P(dg, dn), num(f[8]), f[9], t, 'd', num(f[12]));
        if (f[11] === 'BUFF') { const b = buffPre(P(dg, dn), num(f[8]), f[9]); if (b) { if (!b.rd) b.rd = []; if (b.rd.length < 600) b.rd.push(t); if (!b.dn) b.dn = []; if (b.dn.length < 3000) b.dn.push([t, num(f[12]), -1]); } } // (a stack spent)
        const sr = mech.get('stacks', num(f[8]), f[9]);
        if (sr) stackEv.push({ t, guid: dg, rule: sr, stacks: num(f[12]), up: false, id: num(f[8]) });
        break;
      }
      case 'SPELL_CAST_SUCCESS': {
        if (f.length < 10) break;
        const id = num(f[8]), spell = f[9]; noteId(id, spell);
        noteSchool(id, f[10]);
        if (f.length >= 11 + ADV && f[11] === sg) pos(sg, sn, f[11 + PX], f[12 + PX], t);
        if (f.length >= 11 + ADV && f[11] === sg && isPlayer(f[12]) && !isPlayer(sg)) pets.set(sg, f[12]);
        if (!isPlayer(sg) && f.length >= 11 + ADV && f[11] === sg) seenHp(sg, sn, num(f[13]), num(f[14]), t);
        // (a boss cast keeps where the caster stood and which way it faced, for aimed mechanics like Caustic Waves: map
        // x = -positionY, y = positionX, and the facing is radians from north toward west, so it points along (-sin, cos))
        if (!isPlayer(sg)) { if (!owner) { mech.npcCast(t, sn, sg, id, spell); npcCasts.push({ t, guid: sg, caster: sn, id, spell, hadStart: (npcStart.get(sg + '|' + id) ?? -99) >= t - 15 });
          if (W(spell, id)) { const me = f.length >= 11 + ADV && f[11] === sg && +f[11 + PX] !== 0, fc = me ? +f[14 + PX] : NaN;
            // (and the caster's power when it has one, e.g. Sszorak's rage: its first listed power, current and max)
            const pmx = f.length >= 11 + ADV && f[11] === sg ? +String(f[23]).split('|')[0] : 0, pw = pmx > 0 ? { pw: +String(f[22]).split('|')[0], pwMax: pmx } : {};
            modEv.push({ k: 'cast', t, src: sg, srcName: sn, spell, id, ...pw, ...(me ? { x: -(+f[12 + PX]), y: +f[11 + PX], face: fc === fc ? fc : null } : {}) }); } } break; }
        const p = P(sg, sn);
        p.casts++;
        if (f[f.length - 1] === 'FAKE') { const fk = spell.toLowerCase(); let fl = p.fakeT.get(fk); if (!fl) p.fakeT.set(fk, fl = []); fl.push(t); }
        /* (Tranquility's heal ticks are logged as casts named "Tranquility" (id 157982, 7 a channel, seen in a real log Oct 24): not presses, so one Tranquility no longer counts as 8) */
        else if (+id === 157982) { const fk = spell.toLowerCase(); let fl = p.fakeT.get(fk); if (!fl) p.fakeT.set(fk, fl = []); fl.push(t); }
        // (who each cast was aimed at, for the spec checks: an ally, an enemy, or nobody (0); [time, spell, target guid])
        if (!p.castTg) p.castTg = []; if (p.castTg.length < 4000) p.castTg.push([t, spell, dg && dg !== '0000000000000000' ? dg : 0]);
        if (f.length >= 11 + ADV && f[11] === sg) { manaAt(p, f, 11, t, spell, id); resAt(p, f, 11, t);
          // (what the cast cost, in each power it used)
          const tys = String(f[21]).split('|'), cos = String(f[24]).split('|'); for (let k = 0; k < tys.length; k++) { const c = +cos[k]; if (c > 0 && tys[k] !== '' && p.spendL.length < 6000) p.spendL.push({ t, ty: tys[k], spell, id, amt: c }); } }
        // (the cast it finishes, if it had a cast bar: its latest start of the same spell in the last 15 s)
        for (let i = p.starts.length - 1; i >= 0 && i >= p.starts.length - 4; i--) { const s0 = p.starts[i]; if (s0.done == null && s0.id === id && t - s0.t <= 15) { s0.done = t; break; } }
        if (W(spell)) modEv.push({ k: 'pcast', t, src: sg, spell, id, dst: dg });
        if (PERF_CC_CAST.has(spell.toLowerCase()) && p.ccL.length < 600) p.ccL.push({ t, spell, id, on: '' });
        const ca = p.castAb.get(spell); if (ca) ca.n++; else p.castAb.set(spell, { name: spell, id, n: 1 });
        let tl = p.castTimes.get(id); if (!tl) p.castTimes.set(id, tl = []); tl.push(t);
        const ln = spell.toLowerCase();
        let bl = p.byName.get(ln); if (!bl) p.byName.set(ln, bl = []); bl.push(t);
        if (HELP_CAST.has(ln)) p.helpL.push({ t, spell, id, on: isPlayer(dg) && dg !== sg ? dn : '', g: isPlayer(dg) ? dg : '' }); // (g: who it was on, themselves included)
        // (a major healing cooldown: a new entry, unless it's the next tick of a channel; Celestial Conduit only for Mistweaver)
        if (CD_PRESS.has(ln) && (ln !== 'celestial conduit' || p.specId === 270)) { const cd = CD_PRESS.get(ln), last = cdPress(sg, cd, t, false);
          if (!last || t - last.t > 12) r.cdUse.push({ g: sg, cd, id, t, end: null, heal: 0, over: 0, prev: 0, taken: 0, hp: 0, cov: new Set() }); else if (!last.id) last.id = id; }
        // (a warlock's Create Healthstone or Soulwell makes them; it isn't using one)
        if (ln.includes('healthstone')) { if (!/^create /.test(ln) && !p.cons.healthstone.some((x) => Math.abs(x.t - t) < 2)) p.cons.healthstone.push({ t, name: spell, id }); }
        else { const k = potionKind(ln); if (k) p.cons[k].push({ t, name: spell, id }); }
        if (p.lastCast >= 0) p.active += Math.min(t - p.lastCast, 2.5);
        p.lastCast = t;
        break;
      }
      case 'SPELL_INTERRUPT':
        if (f.length > 12) mech.interrupted(t, dg, num(f[11]), f[12]);
        if (owner && f.length > 12) { const p = P(owner, pet ? null : sn); p.interrupts++; r.interrupts.push({ t, player: p.name, guid: owner, target: dg, marker: (() => { const v = parseInt(f[7], 16) & 0xff; let i = 0; if (!v) return 0; while (!((v >> i) & 1)) i++; return i + 1; })(), caster: dn, spell: f[12], id: num(f[11]), by: f[9], byId: num(f[8]) }); }
        break;
      case 'SPELL_DISPEL':
        if (owner) { const p = P(owner, pet ? null : sn); p.dispels++; if (f.length > 12) p.dispL.push({ t, aura: f[12], id: num(f[11]), on: dn, by: f[9], foe: !!(parseInt(f[6], 16) & 0x40) }); }
        if (owner && f.length > 12 && W(f[12])) modEv.push({ k: 'dispel', t, src: P(owner).name, dst: dg, spell: f[12] });
        break;
    }
  }

  yield;
  r.duration = Math.max(1, item.duration > 0 ? item.duration : lastT);
  // Boss units: enemies named like the encounter; otherwise (councils like The Twin Fangs) the
  // biggest-health enemies, i.e. everything within half the health pool of the largest one.
  let bossUnits = [...units.values()].filter((u) => bossNames.has(u.name));
  if (!bossUnits.length && units.size) {
    const top = Math.max(...[...units.values()].map((u) => u.max));
    bossUnits = [...units.values()].filter((u) => u.max >= top * 0.5);
  }
  r.bossUnits = [...new Set(bossUnits.map((u) => u.name))];
  r.hpUnits = units;
  if (bossUnits.length && item.kind === 'boss') {
    const n = Math.ceil(r.duration) + 1, cur = bossUnits.map(() => 1), idx = bossUnits.map(() => 0);
    const total = bossUnits.reduce((s, u) => s + u.max, 0);
    for (let s = 0; s < n; s++) {
      bossUnits.forEach((u, k) => { while (idx[k] < u.samples.length && u.samples[idx[k]][0] <= s) cur[k] = u.samples[idx[k]++][1]; });
      r.bossS.push(100 * bossUnits.reduce((a, u, k) => a + cur[k] * u.max, 0) / total);
    }
    r.bossPct = item.kill ? 0 : r.bossS[r.bossS.length - 1];
  } else r.bossPct = item.kind === 'boss' && item.kill ? 0 : null;
  for (const [g, p] of r.players) {
    if (p.damage + p.healing + p.casts + p.taken + p.interrupts + p.absorbs === 0 && !p.deaths && !p.specId) { r.players.delete(g); continue; }
    if (!p.name) p.name = g;
    const sp = SPECS[p.specId];
    p.cls = sp ? sp[1] : null;
    p.specName = sp ? sp[0] + ' ' + CLASSES[sp[1]][0] : 'Unknown spec';
    p.role = TANKS.has(p.specId) ? 'tank' : HEALERS.has(p.specId) ? 'healer' : (p.specId ? 'dps' : (p.healing > p.damage ? 'healer' : 'dps'));
    p.color = p.cls ? CLASSES[p.cls][1] : '#9aa0ac';
    p.icon = p.cls ? CLASSES[p.cls][2] : null;
    p.specIcon = SPEC_ICON[p.specId] || null;
    const firstDeath = r.deaths.filter((d) => d.guid === g).map((d) => d.t);
    p.aliveUntil = Math.max(1, firstDeath.length ? Math.min(...firstDeath) : r.duration);
    for (const b of p.buffs.values()) for (const s of b.sp) if (s[1] == null) s[1] = r.duration;
    for (const b of p.debuffs.values()) for (const s of b.sp) if (s[1] == null) s[1] = r.duration;
  }
  for (const d of r.deaths) { const p = r.players.get(d.guid); d.color = p ? p.color : '#9aa0ac'; d.icon = p && p.icon; d.specIcon = p && p.specIcon; d.spec = p ? p.specName : ''; }

  yield; survivability(r); triageSaves(r);
  yield; r.mistakes = mech.build();
  // avoidable damage tanks are expected to take (their job puts them in it)
  { const tankOf = new Set([...r.players.values()].filter((p) => p.role === 'tank').map((p) => p.name)); r.mistakes = r.mistakes.filter((m) => !(TANK_OK.has(m.mechanic) && tankOf.has(m.player)));
    // (going easier on tanks for standing in bad stuff (your note, Oct 18): they often take these hits on purpose, holding
    // the boss in place, and can live through them. A tank's avoidable hit becomes a small note, not a mistake, unless it
    // killed them, they kept standing in it (6 or more touches), or the rule is a tank's own job to avoid (tankJudged))
    const L = (x) => String(x || '').toLowerCase();
    for (const m of r.mistakes) { if (!m.avoidRule || m.tankJudged || !tankOf.has(m.player) || m.severity === 'Low') continue;
      const died = r.deaths.some((d) => d.player === m.player && ((d.abilityId && m.ruleIds.includes(d.abilityId)) || L(d.ability) === L(m.mechanic)));
      if (died || (m.touches || 1) >= tankKept(1)) continue;
      m.severity = 'Low'; m.tankEase = true; m.detail = String(m.detail || '').replace(/\s*$/, '') + ' Tanks often take this on purpose, so it\'s only a note.'; } }
  yield; kickReport(r, npcCasts, mech, npcStarts);
  stackReport(r, stackEv, hits, (opts && opts.overrides) || {});
  r.mistakes.sort((a, b) => a.t - b.t);
  for (const d of r.deaths) {
    const p = r.players.get(d.guid);
    r.mistakes.push({ t: d.t, player: d.player, mechanic: 'Death', id: d.abilityId, severity: 'High',
      detail: 'Died to ' + d.killer + (d.ability ? ': ' + d.ability : '') + '.',
      fix: d.available && d.available.length ? 'Still had ' + (d.available.length < 2 ? d.available[0] : d.available.slice(0, -1).join(', ') + ' and ' + d.available[d.available.length - 1]) + ' available.' : 'Check the death recap for what led up to it.' });
    if (p && d.available && d.available.length) p.diedWithDefs = (p.diedWithDefs || 0) + 1;
  }
  r.mistakes.sort((a, b) => a.t - b.t);
  // Everyone's position at t (last 3s), plus the bosses (the module's focus units, or the biggest-health enemies).
  const snapAt = (t) => {
    const out = [];
    for (const u of r.positions.values()) {
      let best = null; for (const p of u.pts) { if (p[0] > t + 0.5) break; if (p[0] >= t - 3) best = p; } if (!best) continue;
      const pl = r.players.get(u.guid), nm = unitNames.get(u.guid) || u.name;
      if (pl) out.push({ guid: u.guid, name: pl.name, x: best[1], y: best[2], kind: 'player' });
      else if ((mod && mod.focus.has(nm)) || r.bossUnits.includes(nm)) out.push({ guid: u.guid, name: nm, x: best[1], y: best[2], kind: 'boss' });
    }
    return out;
  };
  // Animation frames for a map: positions every `step` seconds from t0 to t1, interpolated between log samples
  // (gaps over 3s aren't bridged). Players, bosses, and the `extra` units (e.g. adds) as kind 'add'.
  const posAt = (u, t) => {
    const a = u.pts; let lo = 0, hi = a.length - 1;
    if (hi < 0) return null;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (a[m][0] <= t) lo = m; else hi = m - 1; }
    const p = a[lo][0] <= t ? a[lo] : null, q = p ? a[lo + 1] : a[0];
    if (p && q && q[0] - p[0] <= 3) { const f = (t - p[0]) / (q[0] - p[0] || 1); return [p[1] + (q[1] - p[1]) * f, p[2] + (q[2] - p[2]) * f]; }
    if (p && t - p[0] <= 3) return [p[1], p[2]];
    if (q && q[0] - t <= 0.5) return [q[1], q[2]];
    return null;
  };
  // Adds named in the module's `units` list are always included; a unit drops out once it dies.
  const deadAt = new Map(); for (const e of modEv) if (e.k === 'die' && !deadAt.has(e.guid)) deadAt.set(e.guid, e.t);
  const framesAt = (t0, t1, step, extra) => {
    const ex = new Set(extra || []), units = [], named = new Set((mod && mod.units) || []);
    for (const u of r.positions.values()) {
      const pl = r.players.get(u.guid), nm = unitNames.get(u.guid) || u.name;
      // (bosses first: some modules list the bosses among their units too)
      const kind = pl ? 'player' : (mod && mod.focus.has(nm)) || r.bossUnits.includes(nm) ? 'boss' : ex.has(u.guid) || named.has(nm) ? 'add' : null;
      if (kind) units.push({ u, guid: u.guid, name: pl ? pl.name : nm, kind });
    }
    const out = [];
    for (let t = t0; t <= t1 + 1e-6; t += step) {
      const pts = [];
      for (const x of units) { if (deadAt.has(x.guid) && deadAt.get(x.guid) < t) continue; const p = posAt(x.u, t); if (p) pts.push({ guid: x.guid, name: x.name, x: +p[0].toFixed(2), y: +p[1].toFixed(2), kind: x.kind }); }
      out.push({ t: +t.toFixed(2), pts });
    }
    return out;
  };
  yield;
  if (mod) {
    const helpers = { name: (g) => (r.players.get(g) || {}).name || g, role: (g) => (r.players.get(g) || {}).role, isPlayer, fmtT, unitName: (g) => unitNames.get(g), compact, snap: snapAt, frames: framesAt };
    try {
      r.module = mod.build(modEv, r, helpers); r.mistakes.push(...r.module.mistakes); r.mistakes.sort((a, b) => a.t - b.t);
      try { avoidMistakes(r); } catch (e) { console.error(e); } /* (the avoid panel's verdict is the one answer (Oct 22)) */
      if (mod.encounter === 'The Coiled Altar') r.module.pools = caPools(modEv); // (for the maps: the Fangs pools as they really were)
      for (const s of r.module.sections) s.how = (HOW[mod.encounter] || {})[s.id] || ''; // short strategy note per mechanic
      for (const s of r.module.sections) { const nt = (TITLE_FIX[mod.encounter] || {})[s.title]; if (nt) { if (!s.place) s.place = s.title; s.title = nt; } } /* (one name everywhere, see TITLE_FIX) */
    }
    catch (err) { r.module = { title: mod.encounter + ' audit', error: String(err && err.message || err), sections: [], phases: [], marks: [] }; }
  }
  yield; /* (a breath after the fight's own checks, the longest step) */
  r.priority = (mod && mod.priority) || []; // (the adds that have to die, for the Performance tab)
  r.useful = (mod && mod.useful) || []; // (adds that have to die on a timer: useful damage, no switch speed)
  r.focus = mod && mod.focus ? [...mod.focus] : []; // (the boss and what shares its health)
  const guidOf = new Map([...r.players.values()].map((p) => [p.name, p.guid]));
  // Interrupts as a regular mechanic of the fight audit (so it splits by phase): one set per add, one row per
  // kickable cast, kicked by whom or got off, each with a map of the add and the players around it
  if (r.module && !r.module.error && (r.kickUnits || []).length) {
    const addAt = (u, t) => { const pu = r.positions.get(u.guid); if (!pu) return []; let best = null; for (const p of pu.pts) { if (p[0] > t + 0.5) break; best = p; } return best ? [{ guid: u.guid, name: u.label, x: best[1], y: best[2], kind: 'add' }] : []; };
    const units = r.kickUnits.slice().sort((a, b) => a.spawn - b.spawn);
    // (a module that knows the room can say which side each add is on, from where it stood at its first cast)
    // (the nearest position logged for the add, within 5 s of the cast: some adds log none before their first cast)
    const sideOf = r.module.kickSide ? (u, t) => { const pu = r.positions.get(u.guid); let b = null, bd = 5; for (const p of pu ? pu.pts : []) { const d = Math.abs(p[0] - t); if (d <= bd) { bd = d; b = p; } } return b ? r.module.kickSide(b[1], b[2]) : null; } : null;
    const groups = units.map((u) => {
      const evs = u.kicked.map((k) => ({ t: k.t, k })).concat(u.missed.map((m) => ({ t: m.t, m }))).sort((a, b) => a.t - b.t);
      const side = sideOf && evs.length ? sideOf(u, evs[0].t) : null;
      const rows = evs.map(({ t, k, m }) => {
        if (k) { const g = guidOf.get(k.player); return [{ t }, { txt: k.spell }, { p: k.player, sub: k.by }, { txt: 'kicked' },
          { map: { t, hl: g ? [g] : [], good: g ? [g] : [], goodLabel: 'kicked it', goodAdd: [u.guid], title: k.spell + ' kicked by ' + k.player + ' at ' + fmtT(t), pts: snapAt(t).concat(addAt(u, t)) } }]; }
        // the per-add list holds the bare cast; the kick history is on the matching missed-kick entry
        const full = (r.missedKicks || []).find((x) => x.guid === u.guid && Math.abs(x.t - m.t) < 0.05) || {};
        const before = [...new Set((full.before || []).map((x) => x.player))];
        // how far each kicker was from the add when it cast (only from spots logged in the last 3 s), and whether that was
        // beyond the reach of the kick they had been using (8 yards of slack for the add's size)
        const pu = r.positions.get(u.guid), here = snapAt(t); let ap = null;
        for (const p of pu ? pu.pts : []) { if (p[0] > t + 0.5) break; if (p[0] >= t - 3) ap = { x: p[1], y: p[2] }; }
        const dist = (n) => { const q = here.find((x) => x.name === n); return q && ap ? Math.round(Math.hypot(q.x - ap.x, q.y - ap.y)) : null; };
        const kickOf = new Map((full.before || []).map((x) => [x.player, x.by]));
        const rot = before.map((n) => { const dd = dist(n), by = kickOf.get(n), far = dd != null && KICK_REACH[by] != null && dd > KICK_REACH[by] + 8;
          return n + (dd != null ? ' (' + dd + ' yd' + (far ? ', too far for ' + by : '') + ')' : ''); });
        return [{ t }, { txt: m.spell }, { txt: before.length ? 'kick rotation: ' + rot.join(', ') : 'nobody kicked this add before', dim: !before.length }, { txt: 'got off', bad: true },
          { map: { t, hl: before.map((n) => guidOf.get(n)).filter(Boolean), hlLabel: 'had been kicking this add', badAdd: [u.guid], title: m.spell + ' got off from ' + u.label + ' at ' + fmtT(t), pts: snapAt(t).concat(addAt(u, t)) } }];
      });
      if (side) for (const row of rows) row[1] = { ...row[1], sub: side + ' side' };
      return { title: u.label, t: evs.length ? evs[0].t : u.spawn, bad: u.missed.length > 0, side, kN: u.kicked.length, mN: u.missed.length, sub: (side ? side + ' side · ' : '') + pl2e(u.kicked.length, 'kick') + (u.missed.length ? ', ' + pl2e(u.missed.length, 'cast') + ' got off' : ', every cast kicked'), rows };
    }).filter((g) => g.rows.length);
    // (many adds of one kind per set, like the Twin Fangs' ten Broodlings: one group per set, each row saying which add,
    // and its side when the module knows the room)
    const setRe = /^(.*) \(Set (\d+) #(\d+)\)$/, kgroups = [], bySet = new Map();
    for (const g of groups) {
      // (a pull with one set labels its adds "#1", "#2": with sides known they're grouped as set 1 too)
      let m = setRe.exec(g.title); if (!m && sideOf) { const q = /^(.*) \(#(\d+)\)$/.exec(g.title); if (q) m = [q[0], q[1], '1', q[2]]; }
      if (!m) { kgroups.push(g); continue; }
      const key = m[1] + '|' + m[2]; let s = bySet.get(key);
      if (!s) { bySet.set(key, s = { title: m[1] + ', set ' + m[2], t: g.t, bad: false, rows: [], adds: 0, side: { left: [0, 0, 0], right: [0, 0, 0] } }); kgroups.push(s); }
      s.adds++; s.bad = s.bad || g.bad; s.t = Math.min(s.t, g.t);
      if (g.side) { const c = s.side[g.side]; c[0]++; c[1] += g.kN; c[2] += g.mN; }
      for (const row of g.rows) s.rows.push([row[0], { ...row[1], sub: 'add #' + m[3] + (g.side ? ', ' + g.side : '') }].concat(row.slice(2)));
    }
    // ("5 left, 5 right", or "all 10 on the left"; casts that got off say which side)
    const sideTxt = (sd, n) => { const l = sd.left[0], rr = sd.right[0], u = n - l - rr; return !l && !rr ? '' : u > 0 ? ' (' + [l ? l + ' left' : '', rr ? rr + ' right' : '', u + ' unknown'].filter(Boolean).join(', ') + ')' : !rr ? ' (all on the left)' : !l ? ' (all on the right)' : ' (' + l + ' left, ' + rr + ' right)'; };
    const gotTxt = (sd) => (sd && (sd.left[2] || sd.right[2]) ? ' (' + [sd.left[2] ? sd.left[2] + ' left' : '', sd.right[2] ? sd.right[2] + ' right' : ''].filter(Boolean).join(', ') + ')' : '');
    for (const s of bySet.values()) { s.rows.sort((a, b) => a[0].t - b[0].t); const k = s.rows.filter((x) => x[3].txt === 'kicked').length, got = s.rows.length - k;
      s.sub = s.adds + ' adds' + sideTxt(s.side, s.adds) + ' · ' + pl2e(k, 'kick') + (got ? ', ' + pl2e(got, 'cast') + ' got off' + gotTxt(s.side) : ', every cast kicked'); }
    kgroups.sort((a, b) => a.t - b.t);
    const missed = units.reduce((n, u) => n + u.missed.length, 0), kicked = units.reduce((n, u) => n + u.kicked.length, 0);
    // (with sides known, the line adds each side's total, so a weaker side shows at a glance)
    const tot = { left: [0, 0], right: [0, 0] }; for (const g of groups) if (g.side) { tot[g.side][0] += g.kN; tot[g.side][1] += g.mN; }
    const sideSum = sideOf && (tot.left[0] + tot.left[1] + tot.right[0] + tot.right[1]) ? ' Left side: ' + tot.left[0] + ' kicked, ' + tot.left[1] + ' got off. Right side: ' + tot.right[0] + ' kicked, ' + tot.right[1] + ' got off.' : '';
    r.module.sections.push({ id: 'kicks', title: 'Interrupts', spell: [0, 'Kick'], verdict: missed > 2 ? 'bad' : missed ? 'warn' : 'good',
      summary: kicked + ' kicked, ' + missed + ' got off.' + sideSum, cols: ['When', 'Spell', 'Kicked by', 'Result', ''], rows: [], groups: kgroups,
      how: (HOW_KICKS[mod.encounter] || 'Every kickable cast should be interrupted. Give each add a kick order with a backup, and use the map to see who was in range when a cast got off.') });
    // The Coiled Altar: the only kicks are Wail of Terror on the Spiritcackle adds, so the kicks go into that section's
    // sets (one place per set: each add's kick timing, shield and death, then every Wail cast)
    const addSec = mod.encounter === 'The Coiled Altar' && r.module.sections.find((s) => s.id === 'addsets');
    if (addSec && addSec.groups && addSec.groups.length) {
      const sets = addSec.groups.slice().sort((a, b) => a.t - b.t);
      const setOf = (t) => { let k = -1; sets.forEach((g, i) => { if (t >= g.t - 2) k = i; }); return k >= 0 ? sets[k] : null; };
      // add rows become What / When / Who / Result: first kick under Who, shield and death under Result
      for (const g of sets) g.rows = g.rows.map((row) => {
        if (!/^Soulcoiler \d+$/.test(row[0].txt || '')) return row;
        const [what, when, kick, , died] = row; // (the shield is in the Gloombombs panel)
        return [what, when, { txt: '', dim: true },
          { txt: died.txt, bad: !!died.bad, warn: !!died.warn || !!kick.warn, dim: !died.bad && died.dim, sub: (kick.txt === 'no kick' ? 'no kick' : 'first kick ' + kick.txt) + (kick.sub ? ', ' + kick.sub : '') }, { txt: '' }];
      });
      const left = [];
      for (const kg of groups) {
        // Eternal Nightfall kicks on Malacrass are shown with their shield in the Eternal Nightfall shields section
        if (kg.rows.every((x) => /eternal nightfall/i.test(x[1].txt || ''))) continue;
        const set = /Soulcoiler/.test(kg.title) ? setOf(kg.t) : null;
        if (!set) { left.push(kg); continue; }
        const n = sets.indexOf(set), mine = groups.filter((x) => setOf(x.t) === set && /Soulcoiler/.test(x.title)), k = mine.indexOf(kg) + 1;
        for (const row of kg.rows) set.rows.push([{ txt: 'Soulcoiler ' + k + ': ' + row[1].txt }, row[0], row[2], row[3], row[4]]); // e.g. "Soulcoiler 1: Wail of Terror"
        if (kg.bad) set.bad = true;
        set.kicks = (set.kicks || 0) + kg.rows.filter((x) => x[3].txt === 'kicked').length; set.got = (set.got || 0) + kg.rows.filter((x) => x[3].txt === 'got off').length;
        void n;
      }
      for (const g of sets) {
        const isAdd = (row) => /^Soulcoiler \d+$/.test(row[0].txt || '');
        const addN = (row) => +((String(row[0].txt || '').match(/^Soulcoiler (\d+)/) || [])[1] || 99);
        g.rows.sort((a, b) => (addN(a) - addN(b)) || ((isAdd(a) ? 0 : 1) - (isAdd(b) ? 0 : 1)) || ((a[1].t ?? 0) - (b[1].t ?? 0)));
        if (g.kicks != null) g.sub = g.sub.replace(/^\d+ kicks?, /, '') + ' · ' + pl2e(g.kicks, 'kick') + (g.got ? ', ' + pl2e(g.got, 'Wail') + ' got off' : ', every Wail kicked');
      }
      addSec.cols = ['What', 'When', 'Who', 'Result', ''];
      const kSec = r.module.sections.find((s) => s.id === 'kicks');
      if (!left.length) { r.module.sections.splice(r.module.sections.indexOf(kSec), 1); r.module.kicksMerged = true; }
      else kSec.groups = left;
      if (groups.some((x) => x.bad && !left.includes(x) && /Soulcoiler/.test(x.title))) addSec.verdict = missed > 2 ? 'bad' : addSec.verdict === 'good' ? 'warn' : addSec.verdict;
    }
  }
  // (rule-pack mistakes about where someone stood used to get a map of just the player, ringed: no puddle, cone or circle,
  // so it showed nothing about the mechanic. Removed (your rule, Oct 18: a map draws its mechanic, or there's no map); a
  // line elsewhere borrows the fight check's own map of that moment instead)
  // Animated maps for the pull recap (and the Fight audit): every mistake map gets animation frames from 4s before to 2s
  // after; every death gets one of the last 5 seconds. (Skipped when the log has no positions.) A mistake with no map of
  // its own no longer gets one of just the player (see above)
  yield;
  if (r.positions && r.positions.size) {
    try {
      for (const m of r.mistakes) {
        if (m.mechanic === 'Death' || !m.map) continue;
        if (!m.map.frames) m.map.frames = framesAt(Math.max(0, m.map.t - 4), Math.min(r.duration, m.map.t + 2), 0.2);
      }
      // kick maps (Interrupts, and adds sections that merged them): animate them and show every add of that set, so the
      // kicked add sits next to the others (the add's own guid is in goodAdd / badAdd)
      if (r.module && r.module.sections) for (const sec of r.module.sections) for (const row of sec.rows.concat(...(sec.groups || []).map((g) => g.rows))) for (const c of row) {
        const mp = c && c.map; if (!mp || mp.frames || !(mp.goodAdd || mp.badAdd)) continue;
        const own = [...(mp.goodAdd || []), ...(mp.badAdd || [])], u0 = (r.kickUnits || []).find((u) => own.includes(u.guid));
        const mates = u0 ? (r.kickUnits || []).filter((u) => u.name === u0.name && u.wave === u0.wave).map((u) => u.guid) : [];
        mp.frames = framesAt(Math.max(0, mp.t - 3), Math.min(r.duration, mp.t + 1.5), 0.25, [...new Set(own.concat(mates))]);
      }
      // (your rule, Oct 18: a map draws its mechanic, or there's no map. Any fight-check or mistake map that ended up with
      // nothing but players and bosses on it (a ghost collision with no ghost logged, a soak with no globule) is dropped.
      // Death maps stay: where someone died is the point of them)
      // (every fight-check map plays the 4 seconds leading up to its moment (your note, Oct 18), with the adds on it moving
      // too; one whose drawn things aren't units in the log (orbs placed by the check) stays still, so they don't vanish)
      if (r.module && r.module.sections) for (const sec of r.module.sections) for (const row of sec.rows.concat(...(sec.groups || []).map((g) => g.rows))) for (const c of row) {
        for (const mp of c && c.map ? [c.map] : c && c.maps ? c.maps.map((x) => x[1]) : []) { if (mp.frames || mp.t == null || !(mp.pts || []).length) continue;
          // (a tank frontal into orbs or ghosts (Coiled Altar, your note, Oct 18): the players and bosses move, the orbs and ghosts
          // the check placed stay where they were, so the cone can be seen coming out of the boss and popping them)
          if (mp.cones && mp.segs && mp.cones.length) { const t0 = mp.cones[0].at - 3, t1 = mp.cones[mp.cones.length - 1].at + 1.6, segs = mp.segs; delete mp.segs;
            mp.frames = framesAt(Math.max(0, t0), Math.min(r.duration, t1), 0.2).map((fr) => { const sg = segs.find((q) => fr.t <= q.until) || segs[segs.length - 1]; return { t: fr.t, pts: fr.pts.filter((p) => !/venom stalker|virulent mutation|manifestation of dread/i.test(p.name)).concat(sg.objs) }; }); continue; }
          if (mp.cone && mp.cone.at != null) { const objs = mp.pts.filter((p) => p.kind !== 'player' && p.kind !== 'boss');
            mp.frames = framesAt(Math.max(0, mp.t - 3), Math.min(r.duration, mp.t + 1.6), 0.2).map((fr) => ({ t: fr.t, pts: fr.pts.filter((p) => !/venom stalker|virulent mutation|manifestation of dread/i.test(p.name)).concat(objs) })); continue; }
          const extra = mp.pts.filter((p) => p.kind !== 'player' && p.kind !== 'boss'); if (!extra.every((p) => p.guid && r.positions.has(p.guid))) continue;
          mp.frames = framesAt(Math.max(0, mp.t - 4), Math.min(r.duration, mp.t + 1.5), 0.25, extra.map((p) => p.guid)); } }
      const drawsMech = (mp) => !!(mp.cone || (mp.cones || []).length || ['marks', 'lines', 'rings', 'cysts', 'arrows', 'links', 'goodAdd', 'badAdd', 'tags', 'ghostHit', 'ghostMiss'].some((f) => (mp[f] || []).length) || mp.hitOrbs ||
        [mp.pts || []].concat((mp.frames || []).map((f) => f.pts || [])).some((ps) => ps.some((p) => p.kind && p.kind !== 'player' && p.kind !== 'boss')));
      if (r.module && r.module.sections) for (const sec of r.module.sections) for (const row of sec.rows.concat(...(sec.groups || []).map((g) => g.rows))) for (const c of row) {
        if (!c) continue; if (c.map && !drawsMech(c.map)) delete c.map;
        if (c.maps) { c.maps = c.maps.filter(([, mp]) => drawsMech(mp)); if (!c.maps.length) delete c.maps; } }
      for (const m of r.mistakes) if (m.map && m.mechanic !== 'Death' && !drawsMech(m.map)) delete m.map;
      for (const d of r.deaths) if (!d.map) d.map = { t: d.t, hl: [d.guid], bad: [d.guid], badLabel: 'died here', title: d.player + ' died at ' + fmtT(d.t) + (d.ability ? ' to ' + d.ability : ''), pts: snapAt(Math.max(0, d.t - 0.3)), frames: framesAt(Math.max(0, d.t - 5), d.t + 0.4, 0.2) };
      // (The Coiled Altar: every map carries the pull's Fangs pools, so it draws them wherever it's shown)
      if (r.module && r.module.pools) { const P = r.module.pools, tag = (m) => { if (m && !m.pools) m.pools = P; };
        for (const sec of r.module.sections || []) for (const row of (sec.rows || []).concat(...(sec.groups || []).map((g) => g.rows || []))) for (const c of row) { if (!c) continue; tag(c.map); (c.maps || []).forEach(([, mp]) => tag(mp)); }
        r.mistakes.forEach((m) => tag(m.map)); r.deaths.forEach((d) => tag(d.map)); }
    } catch (e) { console.error(e); } // (maps are extra: never block the pull)
  }  r.hasPack = mech.packs.length > 0;
  r.packSources = mech.packs.flatMap((p) => p.sources).join('; ');
  yield; try { explainDeaths(r); } catch (e) { console.error(e); for (const d of r.deaths) { d.why = d.why || []; d.prevent = d.prevent || []; } } // never block the pull
  try { deathHealGaps(r); } catch (e) { console.error(e); }
  try { deathSaves(r); } catch (e) { console.error(e); } // (would what they had ready have saved them (Oct 25)) // (healing gaps before deaths: extra, never block the pull)
  insights(r);
  return r;
}

// COMBATANT_INFO from a real combat log: guid, faction, stats (strength ... armor), spec, then [talents], (pvp talents),
// [items], [buffs]. Each item is (itemID, itemLevel, (permanent enchant, temporary enchant, on-use), (bonus IDs),
// (gem ID, gem item level, ...)), in equipment-slot order; buffs are a flat list of caster GUID, spell ID, stacks.
function parseCombatant(line, body, f) {
  if (f.length < 25) return null;
  const n = (i) => +f[i] || 0;
  // a tiny reader for the nested [..] / (..) lists after the spec field
  let i = line.indexOf('[', body); if (i < 0) return null;
  const read = () => {
    const ch = line[i];
    if (ch === '[' || ch === '(') { const close = ch === '[' ? ']' : ')', out = []; i++; while (i < line.length && line[i] !== close) { if (line[i] === ',') { i++; continue; } out.push(read()); } i++; return out; }
    let j = i; while (j < line.length && line[j] !== ',' && line[j] !== ']' && line[j] !== ')') j++; const v = line.slice(i, j); i = j; return /^-?\d+(\.\d+)?$/.test(v) ? +v : v;
  };
  const lists = []; while (i < line.length && lists.length < 4) { if (line[i] === '[' || line[i] === '(') lists.push(read()); else i++; }
  const [, , items = [], buffs = []] = lists;
  const gear = items.map((it) => (Array.isArray(it) && it[0] ? { id: it[0], itemLevel: it[1] || 0, permanentEnchant: (it[2] && it[2][0]) || 0, temporaryEnchant: (it[2] && it[2][1]) || 0, bonusIDs: Array.isArray(it[3]) ? it[3] : [],
    gems: Array.isArray(it[4]) ? it[4].filter((_, k) => k % 2 === 0).map((g, k) => ({ id: g, itemLevel: it[4][2 * k + 1] || 0 })) : [] } : { id: 0 }));
  const auras = []; for (let k = 0; k + 1 < buffs.length; k += 3) auras.push({ source: buffs[k], ability: buffs[k + 1], stacks: buffs[k + 2] }); // (caster, spell ID, stacks)
  // (fields counted on a 12.1 log: 2-5 strength, agility, stamina, intellect; 10-12 crit; 13 speed; 14 leech; 15-17
  // haste; 18 avoidance; 19 mastery; 20-22 versatility; 23 armor; 24 spec)
  // (the talents: the first list, (node, entry, rank) each)
  const talents = (lists[0] || []).filter((t) => Array.isArray(t) && t.length >= 2).map((t) => ({ nodeID: t[0], id: t[1], rank: t[2] || 1 }));
  return { guid: f[0], specId: n(24) || n(23), gear, auras, talents,
    stats: { strength: n(2), agility: n(3), stamina: n(4), intellect: n(5), crit: Math.max(n(10), n(11), n(12)), speed: n(13), leech: n(14), haste: Math.max(n(15), n(16), n(17)), avoidance: n(18), mastery: n(19), versatility: n(20), armor: n(23) } };
}

// Boss casts judged in their own fight-audit section instead (so a finished cast isn't counted twice):
// Eternal Nightfall (Malacrass) is judged with its shield break and kick in the Coiled Altar audit.
const NO_KICK_BLAME = new Set([1286918]);
// Avoidable mechanics tanks aren't judged on: the Coiled Altar axes roll through the boss area, and tanks can take them
const TANK_OK = new Set(['Axegrinder']);
// Interrupts: a spell counts as kickable if anyone kicked it this pull or a rule says so.
// A completed cast of a kickable spell with no kick on that caster within 12s counts as "got off".
function kickReport(r, casts, mech, starts) {
  const byKey = new Map();
  const key = (id, name) => id || ('n:' + String(name).toLowerCase());
  const row = (id, name) => { const k = key(id, name); let x = byKey.get(k); if (!x) byKey.set(k, x = { id, name, kicked: 0, missed: 0, kickers: new Map(), missedAt: [] }); return x; };
  for (const k of r.interrupts) { const x = row(k.id, k.spell); x.kicked++; x.kickers.set(k.player, (x.kickers.get(k.player) || 0) + 1); }
  const ruleNames = new Set([...mech.names.interrupt.keys()]), ruleIds = new Set([...mech.ids.interrupt.keys()]);
  for (const c of casts) {
    if (NO_KICK_BLAME.has(c.id)) continue;
    const kickable = byKey.has(key(c.id, c.spell)) || ruleIds.has(c.id) || ruleNames.has(String(c.spell).toLowerCase());
    if (!kickable) continue;
    // A cast with a cast bar that finishes was not kicked (a later kick on the same add is its next cast). Only channels,
    // which log their success when the channel starts, can still be interrupted after the success.
    const kicked = !c.hadStart && r.interrupts.some((k) => k.target === c.guid && k.t >= c.t && k.t - c.t <= 12 && (k.id === c.id || k.spell === c.spell));
    if (!kicked) { const x = row(c.id, c.spell); x.missed++; x.missedAt.push({ t: c.t, caster: c.caster, guid: c.guid }); }
  }
  r.kicks = [...byKey.values()].sort((a, b) => (b.kicked + b.missed) - (a.kicked + a.missed));
  // Cast bars for the maps (your note, Oct 18): every cast of a kickable spell, from its start to how it ended: kicked (and
  // by whom), went off, or stopped another way (the add died, or a stun or knockback cut it). A channel logs its success
  // when it starts, so a kicked channel runs from there to the kick. `len` is how long the cast takes when it finishes
  // (the middle of this pull's finished casts of that spell), so a kicked bar shows how far it got.
  const isKick = (id, spell) => !NO_KICK_BLAME.has(id) && (byKey.has(key(id, spell)) || ruleIds.has(id) || ruleNames.has(String(spell).toLowerCase()));
  const grp = (xs, kf) => { const m = new Map(); for (const x of xs) { const k = kf(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; };
  const doneBy = grp(casts.filter((c) => c.hadStart && isKick(c.id, c.spell)), (c) => c.guid + '|' + c.id), kickBy = grp(r.interrupts, (k) => k.target + '|' + k.id);
  const bars = [], usedK = new Set();
  for (const [k, ss] of grp((starts || []).filter((x) => isKick(x.id, x.spell)), (x) => x.guid + '|' + x.id)) {
    ss.sort((a, b) => a.t - b.t);
    const dn = doneBy.get(k) || [], kk = kickBy.get(k) || [];
    ss.forEach((x, i) => {
      const nxt = i + 1 < ss.length ? ss[i + 1].t : Infinity, died = r.enemyDied.get(x.guid) ?? Infinity;
      const kick = kk.find((q) => !usedK.has(q) && q.t >= x.t - 0.05 && q.t < nxt + 0.05), done = dn.find((c) => c.t >= x.t - 0.05 && c.t < nxt + 0.05);
      const b = { g: x.guid, id: x.id, spell: x.spell, t0: x.t };
      if (kick && (!done || kick.t <= done.t)) { usedK.add(kick); bars.push({ ...b, t1: kick.t, end: 'kick', by: kick.player }); }
      else if (done) bars.push({ ...b, t1: done.t, end: 'done' });
      else bars.push({ ...b, t1: Math.min(nxt, died), end: died < nxt ? 'died' : 'stop' }); // (its end is set from the spell's length below)
    });
  }
  // (the Soulcoilers' Wail of Terror also logs a cast of the same name at the moment it's kicked: that's not a cast going off)
  const kickedNear = (c) => r.interrupts.some((k) => k.target === c.guid && k.t <= c.t + 0.05 && k.t >= c.t - 0.5);
  for (const c of casts) {
    if (c.hadStart || !isKick(c.id, c.spell) || kickedNear(c)) continue;
    const kick = (kickBy.get(c.guid + '|' + c.id) || []).find((q) => !usedK.has(q) && q.t >= c.t && q.t - c.t <= 12);
    if (kick) { usedK.add(kick); bars.push({ g: c.guid, id: c.id, spell: c.spell, t0: c.t, t1: kick.t, end: 'kick', by: kick.player, chan: true }); }
    else bars.push({ g: c.guid, id: c.id, spell: c.spell, t0: c.t, t1: c.t, end: 'done', chan: true });
  }
  const lens = grp(bars.filter((b) => b.end === 'done' && !b.chan), (b) => b.id), lenOf = new Map();
  for (const [id, bs] of lens) { const v = bs.map((b) => b.t1 - b.t0).sort((a, b) => a - b); lenOf.set(id, v[v.length >> 1]); }
  // (a spell that was always kicked has no finished cast to measure: a bit longer than its latest kick, 2 s at least)
  const latestKick = new Map(); for (const b of bars) if (b.end === 'kick' && !b.chan) latestKick.set(b.id, Math.max(latestKick.get(b.id) || 0, b.t1 - b.t0));
  for (const b of bars) {
    b.len = b.chan ? Math.max(0.5, b.t1 - b.t0) : b.end === 'done' ? b.t1 - b.t0 : lenOf.get(b.id) || Math.max(2, 1.15 * (latestKick.get(b.id) || 0));
    // (a cast that just stops ends where it would have finished; one whose add died after that point was stopped first)
    if (b.end === 'stop') b.t1 = Math.min(b.t1, b.t0 + b.len);
    else if (b.end === 'died' && b.t1 > b.t0 + b.len) { b.t1 = b.t0 + b.len; b.end = 'stop'; }
  }
  r.castBars = bars.sort((a, b) => a.t0 - b.t0);
  // Per enemy unit: number adds of the same name in the order they first act ("Spawn of Vexhul #2"),
  // so a missed cast can be traced to the exact add and to who had been kicking it.
  const missed = [];
  for (const x of r.kicks) for (const m of x.missedAt) missed.push({ t: m.t, guid: m.guid, caster: m.caster, spell: x.name, id: x.id });
  const evs = r.interrupts.map((k) => ({ t: k.t, guid: k.target, name: k.caster, kick: k }))
    .concat(missed.map((m) => ({ t: m.t, guid: m.guid, name: m.caster, miss: m }))).sort((a, b) => a.t - b.t);
  const units = new Map();
  for (const ev of evs) {
    let u = units.get(ev.guid);
    if (!u) units.set(ev.guid, u = { guid: ev.guid, name: ev.name, kicked: [], missed: [], spawn: r.firstSeen.has(ev.guid) ? r.firstSeen.get(ev.guid) : ev.t });
    if (ev.kick) u.kicked.push(ev.kick); else u.missed.push(ev.miss);
  }
  // Group same-name adds into sets (appearing within 8s of the previous one = same set),
  // and number them within their set, so the 3rd add of set 4 reads "Set 4 #3", not "#12".
  const byName = new Map();
  for (const u of units.values()) { if (!byName.has(u.name)) byName.set(u.name, []); byName.get(u.name).push(u); }
  for (const list of byName.values()) {
    list.sort((a, b) => a.spawn - b.spawn);
    let w = 0, n = 0, prev = -1e9;
    for (const u of list) { if (u.spawn - prev > 8) { w++; n = 0; } prev = u.spawn; u.wave = w; u.n = ++n; }
    const waves = w;
    for (const u of list) {
      const size = list.filter((x) => x.wave === u.wave).length;
      u.short = (waves > 1 ? 'Set ' + u.wave + (size > 1 ? ' #' + u.n : '') : list.length > 1 ? '#' + u.n : '');
      u.label = u.name + (u.short ? ' (' + u.short + ')' : '');
      u.marker = markerAt(r, u.guid, Math.max(...u.kicked.map((k) => k.t), ...u.missed.map((x) => x.t)));
    }
  }
  r.kickUnits = [...units.values()].sort((a, b) => b.missed.length - a.missed.length || a.name.localeCompare(b.name) || a.n - b.n);
  r.missedKicks = missed.sort((a, b) => a.t - b.t).map((m) => {
    const u = units.get(m.guid);
    const snap = snapshot(r, m.t, units);
    // Always show the two adds that most recently cast before this one (kicked or not),
    // at their last known spot even if that is older than 3s (they may have died).
    const recent = [...units.values()].filter((o) => o.guid !== m.guid)
      .map((o) => ({ o, last: Math.max(-1, ...o.kicked.filter((k) => k.t <= m.t).map((k) => k.t), ...o.missed.filter((x) => x.t <= m.t).map((x) => x.t)) }))
      .filter((x) => x.last >= 0).sort((a, b) => b.last - a.last).slice(0, 2);
    for (const { o, last } of recent) {
      const have = snap.find((p) => p.guid === o.guid);
      if (have) { have.recent = true; have.lastCast = last; continue; }
      const pu = r.positions.get(o.guid); if (!pu) continue;
      let best = null; for (const p of pu.pts) { if (p[0] > m.t + 0.5) break; best = p; }
      if (best) snap.push({ guid: o.guid, name: o.label, short: o.short, x: best[1], y: best[2], kind: 'add', recent: true, stale: m.t - best[0], lastCast: last, marker: markerAt(r, o.guid, m.t), hp: hpAt(r, o.guid, m.t) });
    }
    return { ...m, label: u.label, short: u.short, wave: u.wave, marker: markerAt(r, m.guid, m.t), before: u.kicked.filter((k) => k.t < m.t), after: u.kicked.filter((k) => k.t > m.t), snap };
  });
  // Casts that got off are listed with the other mistakes too; spells with an interrupt rule already add their own mistake.
  for (const m of r.missedKicks) {
    if (ruleIds.has(m.id) || ruleNames.has(String(m.spell).toLowerCase())) continue;
    const who = [...new Set(m.before.map((k) => k.player))];
    // Visceral Burst (a Twin Fangs Broodling) hits the whole raid every second with a stacking DoT: the fight's main wipe cause
    r.mistakes.push({ t: m.t, player: 'Raid', mechanic: 'Missed interrupt', id: m.id, severity: /^visceral burst$/i.test(m.spell) ? 'High' : 'Medium',
      detail: m.label + ' got ' + m.spell + ' off with no kick.' + (who.length ? ' Kicked earlier by ' + who.join(', ') + '.' : ''),
      fix: 'Keep a kick rotation on every add that casts this, with a backup kicker. The Breakdown tab shows a map of who was nearby.' });
  }
}

// Debuff stack sources: each stack gain is credited to the closest hit on that player
// (up to 1s before or 0.25s after), then sorted into the rule's source groups.
function stackReport(r, evs, hits, overrides) {
  const reports = new Map();
  for (const e of evs) {
    const rule = e.rule; let rep = reports.get(rule.name);
    if (!rep) reports.set(rule.name, rep = { name: rule.name, id: e.id, threshold: rule.threshold, players: new Map() });
    const p = r.players.get(e.guid); if (!p) continue;
    let pr = rep.players.get(e.guid);
    if (!pr) rep.players.set(e.guid, pr = { p, max: 0, gains: 0, cleared: 0, sources: new Map(), last: 0 });
    if (!e.up) { pr.cleared += Math.max(0, pr.last - e.stacks); pr.last = e.stacks; continue; }
    const gained = Math.max(1, e.stacks - pr.last); pr.last = e.stacks; pr.max = Math.max(pr.max, e.stacks); pr.gains += gained;
    let best = null, bd = 9;
    for (const h of hits.get(e.guid) || []) {
      if (h.t < e.t - 1 || h.t > e.t + 0.25 || h.spell.toLowerCase() === rule.name.toLowerCase()) continue;
      const d = h.t <= e.t ? e.t - h.t : (h.t - e.t) * 2;
      if (d < bd) { bd = d; best = h; }
    }
    const src = best ? best.spell : 'Unknown source';
    const kind = classify(rule, src, overrides);
    const k = src + '\u0001' + kind; const s = pr.sources.get(k);
    if (s) s.n += gained; else pr.sources.set(k, { src, id: best ? best.id : 0, kind, n: gained, t: e.t });
  }
  r.stacks = [...reports.values()].map((rep) => ({ ...rep, players: [...rep.players.values()].sort((a, b) => b.max - a.max || b.gains - a.gains) }));
  for (const rep of r.stacks) for (const pr of rep.players) {
    const avoid = [...pr.sources.values()].filter((s) => s.kind === 'avoidable');
    const n = avoid.reduce((a, s) => a + s.n, 0);
    if (n) r.mistakes.push({ t: Math.min(...avoid.map((s) => s.t)), player: pr.p.name, mechanic: rep.name, id: rep.id, severity: n >= 3 ? 'High' : 'Medium', pos: true,
      detail: 'Gained ' + n + ' avoidable ' + rep.name + (n === 1 ? ' stack' : ' stacks') + ' from ' + avoid.map((s) => s.src + ' (' + s.n + ')').join(', ') + '.',
      fix: 'Dodge those mechanics. Every avoidable stack brings you closer to the lethal count.' });
  }
}
function classify(rule, src, overrides) {
  const s = src.toLowerCase(), g = rule.sources || {};
  const o = overrides && overrides[rule.name] && overrides[rule.name][s];
  if (o) return o;
  for (const kind of ['unavoidable', 'soak', 'avoidable']) if ((g[kind] || []).some((n) => s.includes(n.toLowerCase()))) return kind;
  return src === 'Unknown source' ? 'unknown' : 'other';
}

function markerAt(r, guid, t) {
  const l = r.marks && r.marks.get(guid); if (!l || !l.length) return 0;
  let m = l[0][1]; for (const [mt, v] of l) { if (mt > t + 1) break; m = v; } return m;
}
function hpAt(r, guid, t) {
  const u = r.hpUnits && r.hpUnits.get(guid); if (!u || !u.samples.length) return null;
  let v = null; for (const [s, p] of u.samples) { if (s > t + 1) break; v = p; } return v == null ? null : Math.round(v * 100);
}
// Where everyone stood at time t: the latest known position of each unit within the last 3s.
function snapshot(r, t, units) {
  const at = (u) => { let best = null; for (const p of u.pts) { if (p[0] > t + 0.5) break; if (p[0] >= t - 3) best = p; } return best; };
  const out = [];
  for (const u of r.positions.values()) {
    const p = at(u); if (!p) continue;
    const pl = r.players.get(u.guid), ku = units.get(u.guid);
    if (!pl && !ku && !(r.bossUnits || []).includes(u.name)) continue;
    out.push({ guid: u.guid, name: pl ? pl.name : ku ? ku.label : u.name, short: ku ? ku.short : '', x: p[1], y: p[2], kind: pl ? 'player' : ku ? 'add' : 'boss', marker: pl ? 0 : markerAt(r, u.guid, t), hp: pl ? null : hpAt(r, u.guid, t) });
  }
  return out;
}

// (seconds a player's health line ([t, fraction] samples) spends under th between t0 and t1)
function lowTime(l, t0, t1, th) { let s = 0; for (let i = 0; i < l.length; i++) { const [t, fr] = l[i]; if (t > t1) break; const tn = i + 1 < l.length ? Math.min(l[i + 1][0], t1) : t1; if (tn <= t0 || fr >= th) continue; s += tn - Math.max(t, t0); } return s; }
function survivability(r) {
  let used = 0, possible = 0;
  for (const p of r.players.values()) {
    const list = (p.cls ? DEFENSIVES[p.cls] : []).filter(([n, , , specs, baseline]) =>
      (!specs || specs.includes(p.specId)) && (baseline || p.byName.has(n.toLowerCase())) && !(DEF_REPLACED[n.toLowerCase()] && p.byName.has(DEF_REPLACED[n.toLowerCase()])));
    p.defs = list.map(([name, id, cd, , , kind]) => {
      const uses = p.byName.get(name.toLowerCase()) || [];
      const ca = p.castAb.get(name);
      const poss = Math.floor(p.aliveUntil / cd) + 1;
      used += Math.min(uses.length, poss); possible += poss;
      return { name, id: ca ? ca.id : id, cd, uses, possible: poss, kind: kind || 'dr' };
    });
    // (the short buttons they pressed: they answer a close call, but are never "ready" at a death)
    p.minor = (p.cls ? SURV_MINOR[p.cls] || [] : []).filter(([n, , specs]) => (!specs || specs.includes(p.specId)) && p.byName.has(n.toLowerCase()))
      .map(([name, id, , kind]) => ({ name, id: (p.castAb.get(name) || {}).id || id, uses: p.byName.get(name.toLowerCase()), kind }));
  }
  const stonesExist = [...r.players.values()].some((p) => p.cls === 'WARLOCK' || p.cons.healthstone.length);
  for (const d of r.deaths) {
    const p = r.players.get(d.guid); if (!p) continue;
    const avail = [];
    for (const def of p.defs || []) if (!def.uses.some((u) => u <= d.t && u > d.t - def.cd)) avail.push(def.name);
    // (a Warlock's own Demonic Healthstone comes back about a minute later: 2 or 3 a pull in our logs (deaths research, Oct 22))
    if (stonesExist && !p.cons.healthstone.some((u) => u.t <= d.t && !(/^demonic/i.test(u.name || '') && u.t < d.t - 60))) avail.push('Healthstone');
    if (!p.cons.healpot.some((u) => u.t <= d.t)) avail.push('a healing potion');
    d.available = avail;
    // how fast they went down: from the last moment they were healthy (90%+), or their highest health in the window
    const withHp = d.recap.filter((e) => e.hp >= 0);
    let ref = null; for (const e of withHp) if (e.hp >= 90) ref = e;
    if (!ref && withHp.length) ref = withHp.reduce((a, b) => (b.hp > a.hp ? b : a));
    d.window = ref ? d.t - ref.t : 0;
    d.startHp = ref ? ref.hp : null;
    d.healthy = !!(ref && ref.hp >= 90); // false: startHp is just their best in the window
    // (time to react (your rule, Oct 19): sitting at or under 35% health for 2 seconds or more in the 10 before dying, so a Healthstone or
    // potion was a choice. Nearly one-shot, or 80 to 0 in a burst, there was no time, so it isn't held against them)
    const hl = (r.php && r.php.get(d.guid)) || []; d.lowFor = lowTime(hl, d.t - 10, d.t - 0.05, 0.35); d.reactable = d.lowFor >= 2;
  }
  for (const p of r.players.values()) {
    const died = r.deaths.filter((d) => d.guid === p.guid);
    const withAvail = died.filter((d) => d.available.some((a) => !/^(Healthstone|a healing potion)$/.test(a))).length;
    const defUse = p.defs.length ? p.defs.reduce((s, d) => s + Math.min(d.uses.length, d.possible), 0) / p.defs.reduce((s, d) => s + d.possible, 0) : 1;
    p.survVerdict = withAvail ? 'Poor' : died.length ? 'Okay' : 'Good'; /* (not by uses of possible any more (Oct 22)) */
    p.defUse = defUse;
  }
  r.defUse = possible ? used / possible : 0;
  // Close calls: a player's health dropping under 30% who didn't die in the next few seconds (deaths are judged on
  // their own). One close call lasts until they're back over 50%. It counts as answered when they had a personal
  // defensive going (pressed in the 8 s before, or up to 3 s after the low point) or used a Healthstone or health potion
  // from 2 s before to 5 s after it.
  // Judged (your rules, Oct 19) only when there was time to answer it: 5 seconds or more under 30% (the healing wasn't keeping
  // up), or sitting at or under 35% for 2 seconds and then taking another hit under 15%. A split-second dip isn't a fail.
  // kitAvail: a Healthstone (when a Warlock is in the raid) or a health potion was still unused when it started.
  for (const p of r.players.values()) {
    const l = (r.php && r.php.get(p.guid)) || [], dts = r.deaths.filter((d) => d.guid === p.guid).map((d) => d.t), calls = [];
    const own = p.role === 'healer' ? (r.lowHL || []).filter((e) => e[1] === p.guid && e[2] === p.guid) : [], mx = (r.pMax && r.pMax.get(p.guid)) || 0;
    // (a dip counts when it stays under 30% for at least a second or goes under 15%: a blip healers catch instantly
    // can't be reacted to; dips starting within 5 s of the last one are the same close call)
    let cur = null;
    const close = () => { if (!cur) return; if (cur.last - cur.t >= 1 || cur.low < 0.15) { const prev = calls[calls.length - 1]; if (prev && cur.t - prev.t < 5) { if (cur.low < prev.low) { prev.low = cur.low; prev.tl = cur.tl; } prev.last = cur.last; } else calls.push(cur); } cur = null; };
    for (const [t, fr] of l) {
      if (fr < 0.3) { if (!cur) cur = { t, low: fr, tl: t, last: t }; else { cur.last = t; if (fr < cur.low) { cur.low = fr; cur.tl = t; } } }
      else if (cur && fr > 0.5) close();
    }
    close();
    p.closeCalls = calls.filter((c) => !dts.some((dt) => dt >= c.t - 1 && dt <= c.tl + 6)).map((c) => {
      const t0 = c.tl, defUsed = (p.defs || []).concat(p.minor || []).some((d) => d.uses.some((u) => u >= t0 - 8 && u <= t0 + 3));
      const stone = p.cons.healthstone.some((u) => u.t >= t0 - 2 && u.t <= t0 + 5), pot = p.cons.healpot.some((u) => u.t >= t0 - 2 && u.t <= t0 + 5);
      const under = lowTime(l, c.t, c.last + 0.5, 0.3), judged = under >= 5 || (c.low < 0.15 && lowTime(l, c.t, c.tl, 0.35) >= 2);
      const kitAvail = (stonesExist && !p.cons.healthstone.some((u) => u.t < c.t - 2)) || !p.cons.healpot.some((u) => u.t < c.t - 2);
      // (a healer who healed themself back up answered it too (defensives research, Oct 22: top healers answer 60% of their lows with
      // a button and heal through the rest): their own heals on themselves while low came to 20%+ of their health)
      const self = own.length > 0 && mx > 0 && own.reduce((a, e) => a + (e[0] >= c.t - 1 && e[0] <= c.last + 2 ? e[3] : 0), 0) >= 0.2 * mx;
      return { t: c.t, tl: t0, low: c.low, def: defUsed, stone, pot, self, under, judged, kitAvail };
    });
    // (the Survivability verdict: never by how many defensives they pressed (top players press about half they could); a long low
    // with nothing pressed makes it Okay)
    if (p.survVerdict === 'Good' && p.closeCalls.some((c) => c.judged && !c.def && !c.stone && !c.pot && !c.self)) p.survVerdict = 'Okay';
  }
}

// Saves (your idea, Oct 20): a player dropped under 30% health, healing brought them back over 50% within 15 s, and they were still
// alive 6 s later. The save is the healer's who gave them the most healing and absorbs from the moment they dropped under 30% until they
// were back over 50% (overhealing never counts). Their own heals (Healthstone, potion, self-heals) count as theirs: if those were the most,
// they saved themselves and no one gets it, so a healer never saves themself. A second healer who gave 30% or more is named with it.
// Left out: a player who died within 6 s, and a dip in the last 3 s of the pull. An external from that healer on them is noted.
const SAVE_EXT = ['Blessing of Sacrifice', 'Blessing of Protection', 'Blessing of Spellwarding', 'Pain Suppression', 'Guardian Spirit', 'Ironbark', 'Life Cocoon', 'Time Dilation', 'Rescue'];
function triageSaves(r) {
  const out = []; r.saves = out;
  const byT = new Map(); for (const e of r.lowHL || []) { let l = byT.get(e[1]); if (!l) byT.set(e[1], l = []); l.push(e); }
  const dts = new Map(); for (const d of r.deaths) { let l = dts.get(d.guid); if (!l) dts.set(d.guid, l = []); l.push(d.t); }
  const end = r.duration || 0;
  for (const [g, l] of r.php || []) {
    const tp = r.players.get(g); if (!tp || !tp.name) continue;
    let cur = null;
    const done = (tr) => {
      const c = cur; cur = null;
      if (tr - c.t > 15 || tr + 3 > end || (dts.get(g) || []).some((dt) => dt >= c.t && dt <= tr + 6)) return;
      const by = new Map(), sp = new Map(); let tot = 0;
      for (const e of byT.get(g) || []) { if (e[0] < c.t - 0.3 || e[0] > tr + 0.2) continue; const k = e[2] === g ? 'self' : e[2]; by.set(k, (by.get(k) || 0) + e[3]); tot += e[3];
        let m = sp.get(k); if (!m) sp.set(k, m = new Map()); m.set(e[5], (m.get(e[5]) || 0) + e[3]); }
      const top = [...by].sort((a, b) => b[1] - a[1]); if (!top.length || top[0][0] === 'self' || !tot) return;
      const hg = top[0][0], hp = r.players.get(hg); if (!hp || !hp.name) return;
      const w = top.slice(1).find(([k, v]) => k !== 'self' && v / tot >= 0.3), wp = w && r.players.get(w[0]);
      const ext = SAVE_EXT.find((n) => { const b = tp.buffs.get(n); return b && b.by.has(hp.name) && b.sp.some(([a, z]) => a <= tr && (z == null ? end : z) >= c.t - 1); });
      out.push({ t: c.t, back: Math.round(10 * (tr - c.t)) / 10, low: Math.round(100 * c.low), guid: g, who: tp.name, by: hp.name, share: Math.round(100 * top[0][1] / tot), amt: Math.round(top[0][1]), mx: (r.pMax && r.pMax.get(g)) || 0,
        sp: [...sp.get(hg)].sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]), with: wp && wp.name ? wp.name : '', ext: ext || '' });
    };
    for (const [t, fr] of l) {
      if (fr < 0.3) { if (!cur) cur = { t, low: fr }; else if (fr < cur.low) cur.low = fr; }
      else if (cur && fr > 0.5) done(t);
    }
  }
  out.sort((a, b) => a.t - b.t);
}

// Why each player died and what would have prevented it, in plain words (shown with each death in the Fight audit).
// Built from the last 15 seconds before the death (10 until Oct 22: a slow slide often starts earlier): what hit them and how fast, how much healing came in, any
// mechanic mistakes they made just before, the boss's avoidable spells, and what they still had ready.
// Healing gaps before a death (your question, Oct 22: "is it the healers fault? Did this person genuinely not get any direct/enough direct
// healing for a long period?"). In their last 15 s: starved = seconds under 50% health while healing from others (heals and absorbs) over
// the 3 s before came to under 10% of their health; run = the longest of those stretches; heal = healing from others as % of their health;
// alive / healers = other healers alive / in the raid; dist = yards to the nearest alive healer (positions); busy = seconds that were the
// pull's top-20% raid damage seconds (raid-wide damage: healers have to pick). Top guilds' survivors almost never sit 5 s+ starved
// (99th percentile 5.5 s); on our Oct 21 night 1 of 81 deaths did (notes/Guides/Deaths - how to judge them.md).
// Would what they had ready have saved them? (your rule, Oct 25: "if they had a healthstone/healthpot/some type of emergency self heal they
// could have used to survive the mechanic"). From the first moment they were under half health with 1.5 s or more to go (time to press),
// the hits that still came minus the healing that came is what they had to cover: a heal saves them if it's bigger than that; a defensive
// if the share it takes off the hits that came is. Heals as measured in our Oct 21 logs (share of max health): Healthstone 25%, Demonic
// Healthstone 31%, health potion 46%, Exhilaration 30%, Desperate Prayer 25%, Death Pact 50%, Mortal Coil 20%, Lay on Hands all of it.
// Defensives: PERS_DR (Aspect of the Turtle takes about 30% off: on Coiled Altar our hunter took 1.36M through it, so it isn't an
// immunity there); Ice Block, Divine Shield and Netherwalk stop the hits. Anything else isn't claimed. -> d.saves { name: { ok, amt } }, d.saveT
const SAVE_HEAL = { healthstone: 0.25, 'demonic healthstone': 0.31, 'a healing potion': 0.46, exhilaration: 0.3, 'desperate prayer': 0.25, 'death pact': 0.5, 'mortal coil': 0.2,
  'lay on hands': 1, 'crimson vial': 0.2, 'frenzied regeneration': 0.3, renewal: 0.3, 'bitter immunity': 0.2, 'enraged regeneration': 0.3, 'gift of the naaru': 0.2 };
const SAVE_IMM = new Set(['ice block', 'divine shield', 'netherwalk']);
function deathSaves(r) {
  for (const d of r.deaths) { const av = d.available || [], mx = (r.pMax && r.pMax.get(d.guid)) || 0, l = (r.php && r.php.get(d.guid)) || []; d.saves = {}; d.saveT = null;
    if (!av.length || !mx) continue;
    let tp = null; for (const [t, fr] of l) { if (t < d.t - 15) continue; if (t > d.t - 1.5) break; if (fr < 0.5) { tp = t; break; } }
    if (tp == null) { for (const a of av) d.saves[a] = { ok: false, amt: 0, fast: true }; continue; }
    let h = mx; for (const [t, fr] of l) { if (t > tp) break; h = fr * mx; }
    const rc = d.recap || [], dmg = rc.filter((e) => !e.heal && e.t >= tp + 0.3).reduce((a, e) => a + e.amount, 0), healIn = rc.filter((e) => e.heal && e.t >= tp && !/\(absorb\)$/.test(e.spell || '')).reduce((a, e) => a + e.amount, 0);
    const need = Math.max(1, dmg - h - healIn); d.saveT = tp; d.saveNeed = need;
    for (const a of av) { const k = a.toLowerCase(), hp = SAVE_HEAL[k], dr = PERS_DR.get(k);
      if (hp != null) d.saves[a] = { ok: hp * mx > need, amt: Math.round(hp * mx), heal: true };
      else if (SAVE_IMM.has(k)) d.saves[a] = { ok: true, amt: dmg, imm: true };
      else if (dr && dr[0] === 'abs') d.saves[a] = { ok: 0.3 * mx > need, amt: Math.round(0.3 * mx) };
      else if (dr && typeof dr[0] === 'number') d.saves[a] = { ok: (dr[1] ? 0.5 : 1) * dmg * dr[0] > need, amt: Math.round(dmg * dr[0]) };
      else d.saves[a] = { ok: false, amt: 0, unknown: true }; } }
}
function deathHealGaps(r) {
  const heals = new Map(); for (const e of r.lowHL || []) { let l = heals.get(e[1]); if (!l) heals.set(e[1], l = []); l.push(e); }
  const healers = [...r.players.values()].filter((p) => p.role === 'healer' && p.name), deadAt = new Map();
  for (const d of r.deaths.slice().sort((a, b) => a.t - b.t)) if (!deadAt.has(d.guid)) deadAt.set(d.guid, d.t);
  const ts = r.takenS || [], srt = ts.filter((v) => v > 0).sort((a, b) => a - b), p80 = srt[Math.floor(srt.length * 0.8)] || 0;
  const posAt = (g, t) => { const u = r.positions && r.positions.get(g); if (!u) return null; let b = null; for (const q of u.pts) { if (q[0] > t + 2) break; b = q; } return b; };
  for (const d of r.deaths) {
    const mx = (r.pMax && r.pMax.get(d.guid)) || 0, l = (r.php && r.php.get(d.guid)) || []; if (!mx || !l.length) continue;
    const hl = (heals.get(d.guid) || []).filter((e) => e[2] !== d.guid && e[0] > d.t - 18 && e[0] <= d.t);
    const hpAt = (t) => { let v = 1; for (const [x, fr] of l) { if (x > t) break; v = fr; } return v; };
    const inn = (a, b) => hl.reduce((n, e) => n + (e[0] > a && e[0] <= b ? e[3] : 0), 0);
    let starved = 0, run = 0, best = 0;
    for (let t = d.t - 15; t < d.t; t += 0.5) { if (hpAt(t) < 0.5 && inn(t - 3, t) < 0.1 * mx) { starved += 0.5; run += 0.5; best = Math.max(best, run); } else run = 0; }
    const others = healers.filter((h) => h.guid !== d.guid), alive = others.filter((h) => !(deadAt.get(h.guid) < d.t - 0.5)), me = posAt(d.guid, d.t);
    const ds = me ? alive.map((h) => { const q = posAt(h.guid, d.t); return q ? Math.hypot(q[1] - me[1], q[2] - me[2]) : null; }).filter((x) => x != null) : [];
    let busy = 0; if (p80 > 0) for (let k = Math.max(0, Math.floor(d.t - 15)); k <= Math.floor(d.t); k++) if ((ts[k] || 0) >= p80) busy++;
    d.gap = { starved, run: best, heal: Math.round(100 * inn(d.t - 15, d.t) / mx), alive: alive.length, healers: others.length, dist: ds.length ? Math.round(Math.min(...ds)) : null, busy };
  }
}
function explainDeaths(r) {
  const pack = PACKS.find((p) => p.encounter === r.item.boss), rules = pack ? pack.rules : [];
  // (and every source in the boss's Avoidable damage panel, so a death to Noxious Ground or a Deluge circle reads as dodgeable too;
  // a source with a skip (tank frontals on a tank, a carrier's own orb) needs to know who, so only the rule pack counts there)
  const avP = new Map(); for (const g of ((((r.module && r.module.sections) || []).find((q) => q.id === 'avoid') || {}).groups || [])) if (!g.skip && g.judge) for (const n of g.names || []) avP.set(n, { type: 'avoidable', name: g.label, tip: '' });
  const ruleFor = (e) => rules.find((x) => (x.spellIds || []).includes(e.id) || (x.name && x.name.toLowerCase() === String(e.spell).toLowerCase())) || avP.get(String(e.spell).toLowerCase()) || null;
  // boss spells can log with no source (e.g. Caustic Globule), so 'Environment' alone doesn't mean room damage
  const mod = MODULES.find((m) => m.encounter === r.item.boss), modSpells = new Set(mod ? mod.spells.map((x) => String(x).toLowerCase()) : []);
  const isRoom = (t) => /^environment$/i.test(t.src || '') && !ruleFor({ id: t.id, spell: t.name }) && !modSpells.has(String(t.name).toLowerCase()) && !(mod && mod.ids && mod.ids.includes(t.id));
  const pct = (a, b) => Math.round(100 * a / Math.max(1, b));
  for (const d of r.deaths) {
    const p = r.players.get(d.guid), rc = d.recap || [];
    const hits = rc.filter((e) => !e.heal), heals = rc.filter((e) => e.heal);
    const dmg = hits.reduce((n, e) => n + e.amount, 0), heal = heals.reduce((n, e) => n + e.amount, 0);
    const by = new Map(); for (const e of hits) { const k = e.spell || 'Melee'; let o = by.get(k); if (!o) by.set(k, o = { name: k, id: e.id, src: e.src, amt: 0, n: 0 }); o.amt += e.amount; o.n++; }
    const top = [...by.values()].sort((a, b) => b.amt - a.amt);
    // (too fast to react: from half health or more to dead in 2 s or less. A hit from 70% that kills is a one-shot too, so it's timed
    // from the last moment they were at 50%+, not 90% (deaths research, Oct 22). Tanks sit at half health on purpose: from 90%+, as before)
    const hl0 = (r.php && r.php.get(d.guid)) || []; let l50 = null; for (const [ts, fr] of hl0) { if (ts > d.t) break; if (fr >= 0.5) l50 = ts; }
    const tank = !!(p && p.role === 'tank'), mxHp = (r.pMax && r.pMax.get(d.guid)) || 0, old2 = d.window > 0 && d.window <= 2 && d.startHp >= 50;
    d.t50 = l50 == null ? null : Math.round(10 * (d.t - l50)) / 10;
    // (the biggest hit of their last 1.5 s against their health: over 150% only an immunity helps; 500% and up is a mechanic that kills outright, like Gravebound)
    d.hitPct = mxHp ? Math.round(100 * hits.filter((e) => e.t >= d.t - 1.5).reduce((m, e) => Math.max(m, e.amount), 0) / mxHp) : null;
    const fast = tank || d.t50 == null ? old2 : d.t50 <= 2, slow = d.window >= 5, low = !d.healthy && d.startHp > 0 && d.startHp < 35;
    d.fast = fast; const huge = (d.hitPct || 0) >= 150, scripted = (d.hitPct || 0) >= 500;
    // kickable casts that got off in their last 15 seconds and hit them (e.g. Visceral Burst from a Broodling)
    const gotOff = (r.kicks || []).map((k) => ({ k, at: k.missedAt.filter((m) => m.t >= d.t - 15 && m.t <= d.t + 0.2) })).filter((x) => x.at.length && by.has(x.k.name));
    const defs = (d.available || []).filter((a) => !/^(Healthstone|a healing potion)$/.test(a)), cons = (d.available || []).filter((a) => /^(Healthstone|a healing potion)$/.test(a));
    // the player's own mechanic mistakes just before dying (the fix text says what to do instead)
    const mine = r.mistakes.filter((m) => m.player === d.player && m.mechanic !== 'Death' && m.t >= d.t - 10 && m.t <= d.t + 0.5).sort((a, b) => (b.severity === 'High') - (a.severity === 'High') || b.t - a.t);
    // avoidable boss spells in the damage that killed them
    const avoid = []; for (const t of top) { const x = ruleFor({ id: t.id, spell: t.name }); if (x && x.type === 'avoidable' && !avoid.some((a) => a.x === x)) avoid.push({ x, amt: t.amt }); }
    const env = top.find(isRoom);
    // why
    const why = [];
    const killer = d.ability || d.killer || 'an unknown hit';
    why.push(killer + ' finished them' + (d.healthy && d.window > 0 ? ', from ' + Math.round(d.startHp) + '% health to 0 in ' + d.window.toFixed(1) + ' s' + (fast ? ' (a burst, with little time to react)' : '') : '') + '.');
    if (top.length > 1 || (top[0] && top[0].name !== d.ability)) why.push('Most of the damage in their last seconds: ' + top.slice(0, 3).map((t) => t.name + ' ' + pct(t.amt, dmg) + '%').join(', ') + '.');
    if (dmg && slow && heal < dmg * 0.2) why.push('Very little healing came in (' + pct(heal, dmg) + '% of the damage taken) over ' + d.window.toFixed(0) + 's.');
    for (const m of mine.slice(0, 2)) why.push('Just before: ' + m.detail.replace(/\.$/, '') + '.');
    for (const a of avoid.slice(0, 2)) if (!mine.some((m) => m.mechanic === a.x.name) && pct(a.amt, dmg) >= 20) why.push(a.x.name + ' is avoidable and made up ' + pct(a.amt, dmg) + '% of the damage.');
    if (low) why.push('They never got above ' + Math.round(d.startHp) + '% health in their last 15 seconds, so there was no buffer left.');
    for (const x of gotOff) why.push(x.k.name + ' was not interrupted (' + x.at.length + (x.at.length === 1 ? ' cast' : ' casts') + ' got off at ' + x.at.map((m) => fmtT(m.t)).join(', ') + ') and did ' + pct(by.get(x.k.name).amt, dmg) + '% of the damage.');
    const envBig = env && pct(env.amt, dmg) >= 30;
    if (envBig) why.push(env.name + ' is room damage and did ' + pct(env.amt, dmg) + '% of what hit them.');
    // what would have prevented it, most useful first
    const fix = [];
    for (const x of gotOff) fix.push('Interrupt ' + x.k.name + (x.at[0].caster ? ' (' + x.at[0].caster + ')' : '') + ': the raid needs a kicker on every cast.');
    for (const m of mine.slice(0, 2)) if (m.fix && !fix.includes(m.fix)) fix.push(m.fix);
    for (const a of avoid.slice(0, 2)) if (a.x.tip && !fix.includes(a.x.tip) && pct(a.amt, dmg) >= 20) fix.push(a.x.tip); /* (a small avoidable hit 12 s earlier is not what killed them) */
    if (envBig) fix.push('Stay out of the ' + env.name + ' (room damage, not a boss ability).');
    if (low && !fast) fix.push('Get topped up before the next mechanic. Use a Healthstone, potion or defensive while low, or call for healing.');
    // (a button is only advice when there was time to press it, and only one that could have saved them: a hit over 1.5 times
    // their health needs an immunity, and a mechanic that kills outright needs the mechanic done (deaths research, Oct 22))
    const defsOk = scripted ? [] : huge ? defs.filter((a) => DEATH_IMMUNE.test(a)) : defs;
    if (scripted) fix.unshift(killer + ' kills outright: no defensive or heal saves you. Do the mechanic it punishes.');
    if (defsOk.length && !fast && !(envBig && pct(env.amt, dmg) >= 80)) fix.push('Use ' + andJoin(defsOk.slice(0, 2)) + ' when your health starts dropping. ' + (defsOk.length > 1 ? 'Both were' : 'It was') + ' ready.');
    if (cons.length && !fast && !scripted && d.reactable !== false) fix.push(andJoin(cons) + ' would have bought time.');
    if (dmg && slow && heal < dmg * 0.2) fix.push((p && p.role === 'healer' ? 'Stay in range of the other healers, or ' : 'Stay in healer range, or ') + 'call for an external when you are taking steady damage.');
    if (p && p.role === 'tank' && top[0] && /melee/i.test(top[0].name) && !defs.length) fix.push('This is tank damage. Plan an external or a tank swap for this point.');
    if (!fix.length) fix.push(fast ? 'Too fast to react: nothing to fix on your side. If it keeps happening, the raid can plan a cooldown before ' + killer + '.' : 'No clear mistake found in the log. Open the recap to see the hits in order.');
    d.why = why; d.prevent = fix;
    // (their health 15, 10, 5 and 2 seconds before, and the story in a line: how they went down, read from all of it (your ask, Oct 22))
    const hl = hl0, hpAt = (t) => { let v = null; for (const [ts, fr] of hl) { if (ts > t) break; v = fr; } return v == null ? null : Math.round(100 * v); };
    d.hpPath = [15, 10, 5, 2].map((s) => [s, hpAt(d.t - s)]).filter(([, v]) => v != null);
    d.avoidPct = dmg ? pct(avoid.reduce((n, a) => n + a.amt, 0), dmg) : 0; d.ownAvoid = d.avoidPct >= 50; /* (dodgeable damage did half or more: their own death) */ d.avoidName = avoid[0] ? avoid[0].x.name : '';
    d.healPct = dmg ? pct(heal, dmg) : 0;
    const path = d.hpPath.length >= 3 ? ' (' + d.hpPath.map(([, v]) => v + '%').join(', ') + ', then dead)' : '';
    const hp50 = l50 == null ? null : hpAt(l50);
    d.story = scripted ? killer + ' kills outright'
      : fast ? (d.healthy && d.window <= 2 ? 'from ' + Math.round(d.startHp) + '% to dead in ' + d.window.toFixed(1) + ' s' : hp50 != null && d.t50 != null ? 'from ' + hp50 + '% to dead in ' + d.t50.toFixed(1) + ' s' : 'one big hit while already low') + ', too fast to react'
      : d.avoidPct >= 50 ? (d.avoidName || 'avoidable damage') + ', which you can dodge, did ' + d.avoidPct + '% of the damage'
      : mine.length ? 'right after a mistake on ' + mine[0].mechanic
      : low ? 'stuck under 35% health for the whole 15 seconds' + path
      : slow && heal < dmg * 0.3 ? 'a slow slide over ' + d.window.toFixed(0) + ' s with little healing coming in' + path
      : slow ? 'a slow slide over ' + d.window.toFixed(0) + ' s' + path
      : 'from ' + Math.round(d.startHp || 100) + '% to dead in ' + (d.window || 0).toFixed(1) + ' s';
    // for the Deaths panel: the hit that did it (the biggest of their last 4 seconds, when it was well over the finishing
    // one: a 447k globule explosion, then a 59k tick "finished" them), the mistakes linked to it (their own in the last
    // 10 seconds, and the raid's within 4 seconds, like a globule exploding on everyone), damage taken and healing
    // received in the last 5 seconds, and whether there was time to press something
    const lastHit = hits[hits.length - 1] || null, big = hits.filter((e) => e.t >= d.t - 4).reduce((m, e) => (!m || e.amount > m.amount ? e : m), null);
    d.last = lastHit ? { t: lastHit.t, spell: lastHit.spell || killer, id: lastHit.id, amount: lastHit.amount } : null;
    d.big = big && lastHit && big !== lastHit && big.amount >= 1.5 * lastHit.amount ? { t: big.t, spell: big.spell, id: big.id, amount: big.amount, hp: big.hp } : null;
    const raidM = r.mistakes.filter((m) => m.player === 'Raid' && m.mechanic !== 'Death' && m.t >= d.t - 4 && m.t <= d.t + 0.5);
    d.links = mine.concat(raidM).sort((a, b) => a.t - b.t).map((m) => ({ t: m.t, mechanic: m.mechanic, severity: m.severity, detail: m.detail, raid: m.player === 'Raid' }));
    d.taken5 = hits.filter((e) => e.t >= d.t - 5).reduce((n, e) => n + e.amount, 0);
    d.healed5 = heals.filter((e) => e.t >= d.t - 5).reduce((n, e) => n + e.amount, 0);
    d.react = !fast; // (false: from 50%+ to dead in 2 s or less, too fast to press anything)
  }
  // (a mass death: 3+ of us dead within 1.5 s to the same hit is one raid event, like an orb exploding into the pile, not 14 mistakes.
  // Not a mechanic that kills each player outright for their own miss (Gravebound), and not their own death when their own mistake
  // was that hit (they stood in that Sever). Deaths research, Oct 22: 51 of 105 counted deaths on the Oct 21 night)
  const lc = (s) => String(s || '').toLowerCase(), abOf = (d) => lc(d.ability || d.killer);
  for (const d of r.deaths) { const ab = abOf(d); d.mass = 0; if (!ab || (d.hitPct || 0) >= 500) continue;
    const near = r.deaths.filter((x) => Math.abs(x.t - d.t) <= 1.5 && abOf(x) === ab && (x.hitPct || 0) < 500); if (near.length < 3) continue;
    d.mass = near.length;
    if ((d.links || []).some((l) => !l.raid && lc(l.mechanic) === ab) || (d.ownAvoid && lc(d.avoidName) === ab)) continue;
    d.story = 'one of ' + near.length + ' of us killed by ' + (d.ability || d.killer) + ' at once';
    d.prevent = ['Not on you: ' + (d.ability || d.killer) + ' killed ' + near.length + ' of us at once. Fix what set it off as a raid.']; }
}
// (the buttons that can save a hit bigger than your health: immunities and full resets)
const DEATH_IMMUNE = /^(Ice Block|Divine Shield|Aspect of the Turtle|Netherwalk|Cloak of Shadows|Dispersion|Alter Time)$/;
const andJoin = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1];
function insights(r) {
  const it = r.item, ins = r.insights, dur = r.duration;
  const deaths = r.deaths.slice().sort((a, b) => a.t - b.t);
  if (deaths.length) {
    const d0 = deaths[0];
    ins.push({ k: 'death', text: 'First death: ' + d0.player + ' at ' + fmtT(d0.t) + ' (' + Math.round(100 * d0.t / dur) + '% into the pull), ' + d0.killer + (d0.ability ? ': ' + d0.ability : '') });
    const cascade = deaths.filter((d) => d.t - d0.t <= 10).length;
    if (cascade >= 4 && !it.kill) ins.push({ k: 'warn', text: cascade + ' deaths within 10 seconds of the first. That usually means a failed mechanic or a raid damage check.' });
    const by = {};
    for (const d of deaths) if (d.ability) by[d.ability] = (by[d.ability] || 0) + 1;
    const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (top.length) ins.push({ k: 'info', text: 'Most deaths came from ' + top.map(([a, n]) => a + ' (' + n + ')').join(', ') });
  } else ins.push({ k: 'good', text: 'Nobody died.' });
  const ts = r.takenS;
  if (ts.length > 5) {
    let best = 0, at = 0;
    for (let i = 0; i + 5 <= ts.length; i++) { let s = 0; for (let j = i; j < i + 5; j++) s += ts[j]; if (s > best) { best = s; at = i; } }
    ins.push({ k: 'info', text: 'Biggest damage spike: ' + compact(best) + ' over 5 seconds at ' + fmtT(at) });
  }
  const mechCount = r.mistakes.filter((m) => m.mechanic !== 'Death').length;
  ins.push(r.hasPack ? { k: mechCount ? 'warn' : 'good', text: mechCount + ' mechanic mistakes found.' }
    : { k: 'info', text: 'No mechanic rules for this fight yet, so only deaths and survivability are checked.' });
  const ints = r.interrupts.length;
  if (ints) ins.push({ k: 'info', text: ints + (ints === 1 ? ' interrupt' : ' interrupts') + ' landed.' });
}

function compact(n) {
  n = Math.round(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

// cut: where the audit stops on a wipe (the app's wipe filter); everything after it is left out
function checklist(p, r, cut) {
  const ct = cut == null ? Infinity : cut, out = [], alive = Math.max(1, Math.min(p.aliveUntil, ct)), dur = r.duration;
  let active = p.active;
  if (alive < p.aliveUntil) { const ts = [...p.castTimes.values()].flat().filter((t) => t <= ct).sort((a, b) => a - b); active = 0; for (let i = 1; i < ts.length; i++) active += Math.min(ts[i] - ts[i - 1], 2.5); }
  const act = Math.min(100, 100 * active / alive);
  out.push({ status: act >= 90 ? 'Good' : act >= 80 ? 'Okay' : 'Poor', check: 'Activity', detail: Math.round(act) + '% of the time spent casting (gaps over 2.5s count as downtime).' });
  const died = r.deaths.filter((d) => d.guid === p.guid && d.t <= ct + 0.05).length;
  out.push(died ? { status: 'Poor', check: 'Survival', detail: died === 1 ? 'Died once.' : 'Died ' + died + ' times.' } : { status: 'Good', check: 'Survival', detail: 'Stayed alive.' });
  for (const [id, name, cd] of COOLDOWNS[p.specId] || []) {
    const times = (p.castTimes.get(id) || []).filter((t) => t <= ct);
    const poss = Math.floor(alive / cd) + 1;
    if (!times.length) { out.push({ status: 'Poor', check: name, id, detail: 'Never used, though it could have been used up to ' + (poss === 1 ? 'once' : poss === 2 ? 'twice' : poss + ' times') + '.' }); continue; }
    let idle = times[0];
    for (let i = 1; i < times.length; i++) idle += Math.max(0, times[i] - times[i - 1] - cd);
    const e = times.length / poss;
    out.push({ status: e >= 0.85 ? 'Good' : e >= 0.65 ? 'Okay' : 'Poor', check: name, id, detail: 'Used ' + times.length + ' of ' + poss + ' possible. First use at ' + fmtT(times[0]) + ', about ' + Math.round(idle) + 's sitting ready.' });
  }
  const kicks = r.interrupts.filter((x) => x.guid === p.guid && x.t <= ct + 0.05).length;
  if (kicks) out.push({ status: 'Info', check: 'Interrupts', detail: kicks + (kicks === 1 ? ' interrupt' : ' interrupts') + ' landed.' });
  return out;
}


// Coaching: the few changes that would help this player most next pull, in priority order.
function coach(p, r, cut) {
  const ct = cut == null ? Infinity : cut, tips = [];
  const mine = r.mistakes.filter((m) => m.player === p.name && m.mechanic !== 'Death' && m.t <= ct + 0.05);
  for (const d of r.deaths.filter((x) => x.guid === p.guid && x.t <= ct + 0.05)) {
    const defs = (d.available || []).filter((a) => !/^(Healthstone|a healing potion)$/.test(a));
    const cons = (d.available || []).filter((a) => /^(Healthstone|a healing potion)$/.test(a));
    tips.push({ w: 100, title: 'Survive ' + (d.ability || 'the hit that killed you'),
      text: 'You died at ' + fmtT(d.t) + (d.startHp != null ? ', going from ' + Math.round(d.startHp) + '% to 0 in ' + d.window.toFixed(1) + ' s' : '') + '. ' +
        (defs.length ? 'You still had ' + defs.join(', ') + ' ready. Press one when you see this coming.' : cons.length ? 'Your defensives were used, but ' + cons.join(' and ') + ' could have bought time.' : 'Nothing was left to press, so check the recap for what to avoid earlier.') });
  }
  const av = mine.filter((m) => m.dmg).sort((a, b) => b.dmg - a.dmg);
  // weights follow severity, so the most serious mistake comes first (High 80+, Medium 45-60, Low 20-30)
  const SW = { High: 80, Medium: 45, Low: 20 }, sev = (m) => SW[m.severity] || 20;
  if (av.length) tips.push({ w: Math.max(...av.map(sev)) + Math.min(10, av.length * 2), title: 'Dodge ' + av[0].mechanic, text: av[0].detail + ' ' + av[0].fix + (av.length > 1 ? ' Also watch ' + av.slice(1, 3).map((m) => m.mechanic).join(' and ') + '.' : '') });
  // one tip per mechanic (the first time it happened, plus how many more), most serious first
  const byMech = new Map(); for (const m of mine.filter((x) => !x.dmg).sort((a, b) => sev(b) - sev(a) || a.t - b.t)) { const g = byMech.get(m.mechanic); if (g) g.n++; else byMech.set(m.mechanic, { m, n: 1 }); }
  for (const { m, n } of [...byMech.values()].slice(0, 2)) tips.push({ w: sev(m) + 2, title: m.mechanic + (n > 1 ? ' (' + n + 'x)' : ''), text: m.detail + (n > 1 ? ' It happened ' + (n - 1) + ' more time' + (n > 2 ? 's' : '') + ' this pull.' : '') + ' ' + m.fix });
  for (const c of checklist(p, r, ct)) if (c.status === 'Poor' && c.check !== 'Survival')
    tips.push({ w: c.check === 'Activity' ? 40 : 50, title: c.check === 'Activity' ? 'Keep casting' : c.check, text: c.detail + (c.check === 'Activity' ? ' Even while moving, there is usually an instant or a short cast to fill the gap.' : '') });
  const missed = (r.kicks || []).reduce((s, k) => s + k.missedAt.filter((m) => m.t <= ct + 0.05).length, 0);
  const kicked = r.interrupts.some((x) => x.guid === p.guid && x.t <= ct + 0.05);
  if (missed && !kicked && p.role !== 'healer') tips.push({ w: 35, title: 'Help with interrupts', text: missed + ' kickable ' + (missed === 1 ? 'cast' : 'casts') + ' got off this pull and you landed no kicks.' });
  // (combat and mana potions share one cooldown, so a healer's mana potion counts)
  const potted = p.cons.combatpot.concat(p.cons.manapot).some((u) => u.t <= ct + 0.05);
  if (!potted && p.role !== 'tank' && Math.min(r.duration, ct, p.aliveUntil) > 90) tips.push({ w: 15, title: 'Use a combat potion', text: 'No combat ' + (p.role === 'healer' ? 'or mana ' : '') + 'potion this pull. Most specs pot with their first big cooldowns.' });
  return tips.sort((a, b) => b.w - a.w).slice(0, 4);
}

const api = { MECH_COL, liveIndexer, parseNote, checkAssignments, cdName, CD_NAMES, CONSUMABLES, INTERRUPTS, SCHOOL, SPELLID, coach, analyze, analyzeAsync, analyzeSteps, indexChunks, createIndexer, parseTs, split, fmtT, compact, checklist, CLASSES, SPECS, PACKS, DEFENSIVES, DEF_REPLACED, SURV_MINOR, potionKind, BOSS_IDS, BOSS_NAMES, BOSS_SPELL, ENEMY_SPELL, MODULE_SPELLS: Object.fromEntries(MODULES.map((m) => [m.encounter, m.spells || []])) };
root.ENGINE = api;
if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
