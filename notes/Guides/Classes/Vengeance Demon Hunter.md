# Vengeance Demon Hunter (tank)

Read Oct 19 2026. Wowhead + Icy Veins (12.1.5). No 12.1.5 class changes.
12.1 (Wowhead): healing values up to offset the +25% health/damage (Charred Warblades 5%, Soul Cleave +25%, Fel Devastation +25%, Frailty 10%, Feast of Souls +25%, Revel in Pain 6%);
Sigil of Chains#202138 baseline (60 s); Sigil of Silence#202137 replaces Sigil of Misery#207684 when talented; all damage +5.5%.
Midnight removed Demonic, The Hunt, Illuminated Sigils, the Fel-Scarred tree (now Annihilator). Frailty#389958, Painbringer#207387, Fiery Brand#204021 no longer ramp or stack.
Brings Chaos Brand#255260 (+magic damage taken; also the only external buff to Discipline Atonement).

## The spec in one line
Builder/spender with two resources: keep Fracture#263642 from capping (2 charges), spend Souls on Spirit Bomb#247454 (5-6 Souls) / Soul Cleave#228477, dump Fury, and press cooldowns as they come up.
Defensives are short and must be chained: Demon Spikes#203720, Fiery Brand (−40%), Metamorphosis#187827.

## Hero trees
- **Annihilator — recommended for virtually all content** (both guides; Wowhead marks every Annihilator build "Best"). Fracture has 35% to give Voidfall#1253304 (max 3); at 3, Soul Cleave (or Spirit Bomb
  with Meteoric Fall) drops meteors (Shadowflame — boosted by Fiery Demise#389220). Metamorphosis resets Spirit Bomb; Mass Acceleration#1256295 / Dark Matter / World Killer (−10 s Meta per meteor set,
  Meta ≈ 60-80 s). Icy Veins: ~40% more damage on 5 targets; also better defensively (shorter cooldowns).
- Aldrachi Reaver: priority-target funnel (Wounded Quarry), stronger self-healing; every 20 Souls → Reaver's Glaive#442294 → Rending Strike#442442 (Fracture first) then Glaive Flurry#442435 (Soul Cleave second —
  Bladecraft: always Fracture then Soul Cleave). Thrill of the Fight#442686 (+6% haste) should be 100% uptime. Put Reaver's Mark#442624 on the longest-living target. Soul generation beats everything.
- Apex **Untethered Rage#1270444**: Soul Cleave/Spirit Bomb can grant a second, 10 s Metamorphosis charge (chance scales with Souls); spenders eat 1 extra Soul (+5%/Soul each point);
  failures stack Seething Anger (+1% Agility, more chance). Untethered Metas still trigger Annihilator Meta effects.
- Talent notes (Wowhead): no Last Resort#209258 in raid (put it in Soul Carver#207407); M+ default has it. Calcified Spikes#389720 → Ascending Flame#428603 for more damage. Raid Cleave/Council builds for long adds / multi-boss.
  Sigil of Chains is often misused (enemies recast if not actually kicked); don't gather mobs on top of yourself (synced melees).
- Omnium Folio (Icy Veins): Unleashed Fire, Void-Tainted Shell, Lingering, Burning Haste, Overload.

## Single target — Annihilator (Wowhead)
1. Infernal Strike#189110 off GCD at/near 2 charges if you won't need it to move (Icy Veins: keep one charge; macro with Immolation Aura at your feet).
2. Hold 75 Fury if at 2 Voidfall stacks or Meta is about to come up.
3. Metamorphosis if it won't overwrite duration and Spirit Bomb has >10 s left (enter Meta with max Souls). Don't Meta at 2 Voidfall — fish the 3rd and spend first (Icy Veins). Hold a few s if meteors are still falling (Mass Acceleration bug).
4. Fracture at/near 2 charges (but not while you sit at 3 Voidfall — it can't generate).
5. Fiery Demise builds: Spirit Bomb (4+ Souls) if Fiery Brand is about to end; Fiery Brand if not up.
6. Spirit Bomb with 5+ Souls (if it triggers Voidfall, Soul Cleave next GCD).
7. Immolation Aura#258920 → Sigil of Flame#204596 → Soul Carver (no Soul overcap) → Sigil of Spite#390163 (no overcap).
8. Soul Cleave with 1+ Souls → Fel Devastation#212084 (50+ Fury) → Soul Cleave at 0 Souls → Fracture (no cap) → Felblade#232893 → Throw Glaive#204157.
Icy Veins adds: Fiery Brand when you need it defensively, before Meta, at 3 Voidfall, or about to hit 2 charges (Down in Flames#389732); Spirit Bomb hold ~5 s if Brand is coming.

## Single target — Aldrachi Reaver (Wowhead)
Metamorphosis → Fracture with Rending Strike → Spirit Bomb 5+ → Soul Cleave with Glaive Flurry → Sigil of Spite (to start Art of the Glaive if no Reaver's Glaive) → Reaver's Glaive → Immolation Aura →
Sigil of Flame → Soul Carver → Soul Cleave 1+ → Soul Cleave 0 → Felblade.
AoE (both): same, Fel Devastation higher (ideally with many Branded enemies), from 2 targets.

## Opener (Icy Veins)
Sigil of Flame 1 s before pull → Metamorphosis + Infernal Strike → Fiery Brand → Immolation Aura → Sigil of Spite → (Reaver's Glaive) → Fracture → Soul Cleave → Fracture → Spirit Bomb → Soul Carver → …

## Cooldowns and defense (both)
- **Demon Spikes** (charges, 20 s hasted): use whenever no other defensive is up, or before charges would cap; keep one rolling. Feed the Demon#218612 → macro to Fracture for near-full uptime.
- **Fiery Brand**: −40% for 12 s + DoT (Fiery Demise fire buff; Burning Alive spreads). 1 min (48 s Down in Flames, 2 charges — one offensive, one defensive). Can hold ~10 s for a tank buster.
- **Metamorphosis**: +40% health, +200% armor, 15 s (20 s Vengeful Beast#1265818); strongest defensive and offensive. Near cooldown, hold briefly for a known hit. Annihilator: Brand 5-10 s before Meta.
- Fel Devastation (40 s; 28-34 s with Darkglare Boon#389708): on cooldown, defensively below ~70% health; sync with Brand if Fiery Demise + Down in Flames.
- Soul Carver / Sigil of Spite (1 min): on cooldown (sync with Brand for Fiery Demise). Darkness#196718 (5 min, 3 with Pitch Black): group damage.
- Souls heal 6% of damage taken in last 5 s (or 1% max HP); **environmental damage doesn't count**. Over 6 Souls auto-consumes the oldest. Spenders scale with Souls (Soul Cleave up to 2/3, Spirit Bomb 5/6).
- Utility sigils: Silence (2 s, normal mobs), Misery (15 s fear; can let a group skip with Shadowmeld), Chains (grip + 70% slow). Chains of Anger +2 s.

## Tier set (Season 2)
- 2-piece: Sigil of Flame +50% damage; Soul Cleave extends it 2 s on your main target.
- 4-piece: Sigil of Spite and Immolation Aura deal +100% to targets in Sigil of Flame. Minor damage only.

## Stats
- Wowhead (both trees, raid and M+): ilvl > Haste > Crit > Vers > Mastery (all within ~5%). Offensive sim usually Crit > Vers > Haste > Mastery.
- Icy Veins: Agility > Haste > Mastery > Vers > Crit. (Also says Mastery is "very undertuned defensively".)

## Consumables (Wowhead)
Flask of the Blood Knights; Light's Potential#241308; Concentrated Silvermoon Health Potion; Thalassian Phoenix Oil; Harandar Celebration / Blooming Feast (secondary-stat feasts: Blooming Feast, Quel'dorei Medley).
Enchants: Empowered Blessing of Speed helm, Mark of the Worldsoul, Akil'zon's Swiftness, Forest Hunter's Armor Kit, Farstrider's Hunt, Eyes of the Eagle rings; weapons double Acuity of the Ren'dorei (defense) or
Rite of the Hash'ey (offense); Indecipherable Diamond + Flawless Deadly/Versatile Peridot.

## Disagreements
- Stats: Wowhead Crit second; Icy Veins Mastery second (and also calls Mastery undertuned). Both: Haste first, ilvl over all.

## What a log can check
Fracture capped at 2 charges; Spirit Bomb Souls consumed per cast; Souls overcapped; Demon Spikes uptime when nothing else is up; Fiery Brand / Meta / Fel Devastation / Sigil of Spite / Soul Carver casts vs possible;
Meta at 2 Voidfall (Annihilator); Thrill of the Fight uptime (Reaver); Fracture-then-Soul Cleave order in Art of the Glaive.
