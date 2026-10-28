# Restoration Druid (healer)

Read Oct 19 2026. Both guides are by the same author (Voulk). Wowhead updated 2026-10-13, patch 12.1.5; Icy Veins 12.1.5.
Oct 27 hotfix (aimed at dungeons): Verdancy healing +60%, Regrowth healing +10%, Improved Swiftmend 30% -> 40%. No guide change since Oct 13 (audit, Oct 28). Before that: no class changes in 12.1.5. (Icy Veins mentions a "minor revamp to Nature's Bounty" in 12.1.5 but also says no changes — treat as none.)

## The spec in one line
HoT healer. Keep 5 Rejuvenations out so **Abundance** makes Regrowth cheap and crit-heavy, then cast lots of Regrowth.
Swiftmend on cooldown (it triggers many talents). Plan Tranquility and Convoke/Tree with the raid's damage.

## Hero trees and builds (both guides)
- **Wildstalker is the pick everywhere** (raid, Mythic+, delves). It stacks healing-taken on the Lifebloom target, which feeds the Apex.
  You do NOT have to play Cat Form for it.
- Keeper of the Grove: still playable, burstier (several Grove Guardians at once), good defensive (Protective Growth#433748),
  but held back by Wild Growth's cost (fewer treants). Grove Guardians#102693 are now passive: they spawn from Swiftmend and Wild Growth.
- **Convoke the Spirits#323764 is the default.** Incarnation: Tree of Life#33891 for very high-movement fights (instant Regrowth on the move).
- Mana talent choice: Master Shapeshifter#289237 (safe default, mana back from Wrath) vs Liveliness#426702 (~3% more healing, needs
  excellent mana play; avoid on long progression fights) vs Embrace of the Dream (slightly more burst).
- Apex talent **Everbloom** (4 points, always taken): Lifebloom stacks to 3 (every 5 s, heals 3x); points 2-3 splash 20/40% of each
  "bloom" to up to 6 nearby allies; point 4: Swiftmend makes Lifebloom bloom 3 times in a row. Photosynthesis is taken alongside it
  (each HoT on the Lifebloom target has an 8% chance to cause a bloom).
- Omnium Folio (12.0.7 system): Unleashed Fire, Self-Mending, Lingering, Burning Haste, Overload. The stat node (4) is most of the power.

## Raid rotation (both guides)
Maintenance — do these all fight:
1. **Lifebloom#33763 on yourself**, 100% uptime (Everbloom heals scale with HoTs on the target). Refresh near expiry (<5-6 s left is free, pandemic).
2. 1-2 Rejuvenation#774 on yourself too (more Photosynthesis blooms, more mastery). Regrowth's HoT on you is kept up for free by Rampant Growth.
3. **Swiftmend#18562 on yourself, on cooldown**, even at full health. Self-cast gives Symbiotic Blooms (+20% healing taken → bigger Everbloom).
4. **Rejuvenation right after every Swiftmend** — Power of the Archdruid spreads it to 3 targets.
5. Efflorescence#81262 always down under a group. With Lifetreading it follows your Lifebloom target (you), so it's automatic.

Abundance#207383 (reworked in 12.1): with **5+ Rejuvenations active**, Regrowth#8936 gets +60% crit and −60% mana cost.
- Keep exactly the minimum 5 out, then chain Regrowth. Batch the Rejuvenations together rather than one at a time.
- End of fight check: **many more Regrowth casts than Rejuvenation casts.** Most players gain healing by casting fewer Rejuvs.
- Never cast Regrowth without Abundance up (main cause of mana trouble).
- Movement-heavy fight: cast more Rejuvs manually, and spend Soul of the Forest procs on Regrowth.

Other buttons
- **Wild Growth#48438**: big, expensive, the main mana sink. Use when the raid is in danger, NOT on cooldown in raid. Out of mana → cut Wild Growths
  in quiet parts first. (Mythic+: it IS on cooldown.)
- Nature's Swiftness: next Regrowth instant and much bigger. With Overgrowth, **self-cast it during dangerous or semi-dangerous damage**:
  refreshes your own HoTs, splashes to other Regrowth targets (Nature's Bounty), and procs lots of Photosynthesis for 10 s.
- Wrath#5176: damage + mana back (Master Shapeshifter). Cast in downtime. Under nonstop damage, wait for Abundance to drop before spamming Wrath.
- Innervate: restores 25% max mana (reworked 12.1), 3 min. First one at ~75% mana; fit in as many as possible. Self-cast in most cases.
- Ironbark: −20% damage taken for 12 s, off the GCD, short cooldown. Use often, don't save it.
- Barkskin#22812: personal defensive, low cooldown, use whenever in danger.
- Mark of the Wild before every pull. Symbiotic Relationship on a squishy DPS. Rebirth = battle res.
- Pre-pull: start Rejuvenations a few seconds before the pull if there's damage at the start.

## Major cooldowns
**Tranquility#740** — the biggest one. Heals everyone, and each tick extends all HoTs by 2 s (10 s total, Flourish).
12.1: also gives a root shield worth 60% of your max health and stops knockbacks while channeling.
- Line it up with the most dangerous moments (or the raid lead's assignment).
- **Ramp 15-20 s before it**: one Wild Growth, many Rejuvenations, and **as many Regrowth HoTs as possible** (Regrowth is the most valuable HoT
  to extend), then Tranquility, then chain Regrowths (they splash to all the extended Regrowth HoTs via Nature's Bounty). About a 20-25 s
  healing window. Raid aim: 12+ Rejuvenations; Mythic+ 5-6.
- With Tree of Life: combine them — Tree's timer pauses while channeling.

**Convoke the Spirits#323764** — 12-16 random Druid spells over 3-4 s, short cooldown. Usually 0-2 Wild Growth, 2-4 Swiftmend, 2-5 Wraths,
some Rejuv/Regrowth, ~45-50% chance of a one-tick Tranquility (Cenarius' Guidance) that gives a 2 s HoT extension.
- Raid: always in caster form, **Wild Growth just before** (so a Flourish extension catches it). Not a huge heal any more —
  aim for **as many casts per fight as possible**. Don't let it sit off cooldown.
- Cat Form Convoke casts mostly Cat abilities (Mythic+ damage use).

**Incarnation: Tree of Life#33891** — 30 s, cooldown cut by Grove Guardians (~1:40 with good play; 60-70% uptime with Reforestation).
+10% healing, Rejuvenation +40% healing and −30% mana, Wild Growth +2 targets, Wrath +20%, Regrowth instant. 12.1: casting it also
Regrowths 3 injured allies. Press it **10-12 s before big damage** to spam cheap Rejuvs. Pairs with Tranquility.

## Tier set (Season 2)
- 2-piece: Rejuvenation has 15% chance to give **Genesis** (all HoTs +15% for 8 s, stacks).
- 4-piece: Genesis lasts 8 s longer; Nature's Swiftness, Tranquility, Convoke and Tree always grant it. → rewards pressing big cooldowns often.

## Mastery and HoTs
Mastery: Harmony#77495 — more healing per HoT on the target (full value for the first, then 70%, 60%, 50%…).
HoTs that count (exhaustive): Rejuvenation, Germination, Wild Growth, Regrowth's HoT, Lifebloom, Frenzied Regeneration, Symbiotic Blooms.
No trinket benefits from mastery.

## Guide uptime targets (Wowhead)
Lifebloom 100%; Rejuvenation, Germination and Regrowth on yourself 90%+.

## Stats
- Raid (both): Intellect > Haste > Mastery > Versatility > Critical Strike. Same for both hero trees.
- Dungeons (Icy Veins): Intellect > Mastery > Haste > Vers > Crit. Beginners (Wowhead): Haste = Mastery.
- Crit is weak because Regrowth already crits a lot under Abundance. Item level first; don't drop more than ~3 ilvl for stats (6 on neck/rings).
- Sockets ≈ 5 ilvl (Wowhead) / ≈ 10 ilvl (Icy Veins). Leech ≈ 5-6 ilvl on the first 2-3 pieces. Lycara's Teachings haste doesn't hit diminishing returns.

## Consumables (Wowhead)
Flask of the Blood Knights#241324 every fight. Potion of Recklessness#241288 (preferred, use on the most dangerous moment) or Lightfused Mana
Potion#241300 (fallback). Concentrated Silvermoon Health Potion#271884. Thalassian Phoenix Oil#243734 (not Oil of Dawn). Void-Touched Augment
Rune#259085 (optional). Food: Harandar Celebration#255846 feast / Royal Roast#242275. Gems: Indecipherable Eversong Diamond#240983 + Flawless
Masterful Peridot#240892. Enchants: Berserker's Rage#243973 weapon, Empowered Hex of Leeching#243951 helm, Silvermoon's Mending#244021
shoulders, Mark of the Worldsoul#243977 chest, Arcanoweave Spellthread#240155 legs, Shaladrassil's Roots#243983 boots, Silvermoon's Alacrity#244015 rings.

## Damage (optional, healing first)
- Caster (Icy Veins says easier and currently tuned well; Wowhead says caster is now ahead in AoE since 12.0.5):
  single target Starsurge on cooldown then Wrath (Moonfire on the move); AoE Starfire (Sunfire on the move).
- Catweave: Prowl pre-pull, Rake the biggest enemy, Rake the rest, Rip at 5 combo points, then Shred (1-2) / Swipe (3+);
  Ferocious Bite on single target if Rip is already up. Rake/Shred on the caster bar (Fluid Form shifts for free). Heart of the Wild → Cat Form.

## Disagreements / things to watch
- Wild Growth: Wowhead beginner page says "on cooldown"; both main rotation pages say raid = only when the raid is in danger. Use the rotation pages.
- Lifebloom target: beginner page says tanks are fine; the raid rotation (both guides) says **yourself**.
- Socket value 5 vs 10 ilvl.

## What a log can check (for the analyzer)
Lifebloom uptime on self ~100%; Swiftmend casts vs possible; Rejuvenation cast right after Swiftmend; Regrowth casts > Rejuvenation casts;
Regrowths cast without Abundance; Convoke casts vs possible; Wild Growth right before Convoke; Tranquility preceded by Wild Growth + Regrowths;
Innervate count vs possible (first by ~75% mana); Ironbark and Barkskin used.
