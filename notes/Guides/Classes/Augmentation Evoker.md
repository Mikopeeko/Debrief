# Augmentation Evoker (support ranged DPS)

Read Oct 19 2026. Wowhead + Icy Veins (12.1.5). No 12.1.5 class changes. See also memory "augmentation-support-damage" (how buff damage is logged).
12.1 nerfs (Wowhead): Wingleader#441206 — Mass Eruption#438587 now cuts Breath of Eons#442204 cooldown 1.5 s per target hit; Duplicate's Upheavals no longer knock up; Double-time#431874 crit-stats now 15 s
(Mastery-extended) and extend if reapplied (less variance in raid).

## The spec in one line
Keep **Ebon Might#395152** up as long as possible (recast at ≤3-4 s left — pandemic), extend it by casting Fire Breath#357208, Upheaval#408092 and Eruption#395160 **only while Ebon Might is up**,
Prescience#409311 on cooldown (never cap 2 charges) on the best DPS, and Breath of Eons on cooldown (Duplicate). Fill with Living Flame/Chrono Flame or Azure Strike#362969.

## Hero trees
- **Chronowarden for raid** (both; Icy Veins: Scalecommander ~15% behind in raid, "strongly recommend against"). Buff-focused: Nozdormu Adept, Double-time (Ebon Might/Prescience can crit for +50%),
  Temporal Burst#431695 from Tip the Scales#370553 (treat as a major cooldown; cooldown starts when the buff is used), Chrono Flame. Icy Veins: Chronowarden also for high keys.
- Scalecommander: Wowhead "Mythic+ (Best)" and delves (simpler, less reliant on allies); Icy Veins: weekly keys. Bombardments via Eruption, Mass Eruption stacks after empowers, Imminent Destruction / Plot the Future.
  Maneuverability: end Breath early but wait ~2 s for Command Squadron's Pyres.
- Raid notes (Wowhead): Overlord#410260 can go to Tomorrow, Today#412723 or Interwoven Threads#412713 for timings; Arcane Reach#454983 for Prescience range; drop Quell if nothing to kick, Pupil of Alexstrasza#407814 on pure ST;
  Blistering Scales#360827 skipped in raid (negligible). M+ Scalecommander: Interwoven Threads instead of Time Skip, Reactive Hide#409329 (Blistering Scales buffed), Clairvoyant#1250914 + Overlord motes alternative.
- Apex **Duplicate#1259173**: Breath of Eons summons a Duplicate (casts Eruption/Fire Breath/Upheaval, doesn't extend Ebon Might); ranks 2-3: Sands of Time#413525 extensions also extend Duplicate (Haste/Crit value up);
  rank 4: while up, your Ebon Might on allies +75% and Upheaval much stronger → **Breath of Eons on cooldown** beats holding it (M+: hold if the pull is about to end; raid: hold only if it won't cost a use).
- Omnium Folio (Icy Veins): Unleashed Fire, Self-Mending, Lingering, **Masterful Cunning (always)**, Overload.

## Priority (Icy Veins full list; Wowhead same)
1. Ebon Might if ≤4 s left (Wowhead "a few seconds"); on cooldown unless Breath of Eons is next and Ebon Might isn't up.
2. Breath of Eons on cooldown (shortest flight, hit every enemy). Deep Breath on cooldown (Scalecommander).
3. Prescience on cooldown (Wowhead: maintain on allied DPS).
4. Tip the Scales (on Fire Breath for max rank instantly) — cancel the buff if no empower within a GCD (Chronowarden + Time Skip macro, keeps it synced with Time Skip#404977).
5. Fire Breath at the highest rank available (Wowhead: rank 1 unless max rank won't delay Upheaval or let Ebon Might/Duplicate fall under ~4-5 s; Leaping Flames#369939 rewards max rank).
6. Upheaval on cooldown at rank 1 (uprank only to reach more enemies).
7. Time Skip if Fire Breath and Upheaval are both on cooldown (Chronowarden: with Temporal Burst; recast Ebon Might right after to fish Double-time).
8. Eruption if Ebon Might is up or at 2 Essence Burst (spend Essence Burst before generators like Prescience/Living Flame to avoid capping at 2).
9. Blistering Scales on a tank if missing (M+). 10. Azure Strike (Scalecommander ST: as good as Living Flame, better with Echoing Strike) / Chrono Flame / Living Flame.
- Move with Hover#358267 first, then a held Prescience charge, then Azure Strike.

## Opener (Icy Veins Chronowarden)
Blistering Scales on main tank, precast Living/Chrono Flame → Ebon Might → potion + trinkets → Prescience x2 → Breath of Eons → (Deep Breath) → Ebon Might → Tip the Scales → Fire Breath → Upheaval (lowest rank that hits all) →
Time Skip → Ebon Might → Fire Breath max rank → Prescience x2 → Eruption x3.

## Buff targeting and positioning
- Prescience: auto-targets Sense Power#361021 players; manual targeting of your best DPS / their burst windows can be +3-5%. Tier makes it matter more (Fate Mirror#412774).
- Shifting Sands#413984 (from empowers) goes to the nearest DPS without it → stand close to the top DPS; two Augs must stand far apart.
- Motes of Possibility#409267 (Clairvoyant: 50% Prescience or Shifting Sands to whoever picks it up) → DPS should grab them, non-DPS avoid.
- Pre-pull: Blessing of the Bronze#364342, Source of Magic#369459 on a healer, (Blistering Scales on tank, Black Attunement, Timelessness#412710 on a high-threat DPS, Bestow Weyrnstone).

## Tier set (Season 2)
- 2-piece: Upheaval cooldown −10 s (desyncs it from Ebon Might).
- 4-piece: casting Upheaval raises Fate Mirror echo to 45% (from 15%) for 8 s → Prescience targets matter.

## Stats
- Both guides: Intellect > **Mastery** > Crit > Haste > Versatility (Vers "awful"). Mastery: Timewalker#406380 = Shifting Sands Versatility + longer buff durations; well ahead until ~1840 rating (2nd DR).
  Chronowarden: Crit slightly > Haste (Double-time); Scalecommander: equal.

## Consumables (Wowhead)
Flask of the Magisters; Potion of Recklessness; Concentrated Silvermoon Health Potion; Thalassian Phoenix Oil; Hearty Silvermoon Parade#266985.
Enchants: Arcane Mastery#244031 weapon, Rune of Avoidance, Amirdrassil's Grace, Mark of the Worldsoul, Sunfire Silk Spellthread, Lynx's Dexterity, Zul'jin's Mastery#243959 rings; Indecipherable Diamond + Deadly Amethyst.
Blizzard's meter doesn't show buff damage; Warcraft Logs reattributes it.

## Disagreements
- Mythic+ hero tree: Wowhead Scalecommander; Icy Veins Scalecommander for weekly keys, Chronowarden for high keys.
- Fire Breath rank: Wowhead rank 1 unless max rank is free; Icy Veins "highest rank available".

## What a log can check
Ebon Might uptime; empowers/Eruption cast while Ebon Might was down (wasted extension); Prescience charges capped; Breath of Eons casts vs possible; Essence Burst wasted; Tip the Scales / Time Skip counts;
Prescience targets (were they the top DPS?).
