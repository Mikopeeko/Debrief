# Enhancement Shaman (melee DPS)

Read Oct 19 2026. Wowhead + Icy Veins (12.1.5).
12.1.5 (Wowhead): Static Accumulation#384411 bug fixed (overlapping Doom Winds procs disabled it). Oct 6 hotfix: all damage +4%, Lava Lash#60103 +35%.
12.1: Lightning Bolt / Chain Lightning +20%, Lava Lash / Stormstrike +15%, autos +15%, Doom Winds#384352 Windfury chance +50% (was 100%); Tempest#454009 −10%/−30%; Totemic Surging Totem nerfs; Aug 18 all damage +5%.
Midnight rework: damage moved from Maelstrom spending into strikes; **Crash Lightning#187874 is core at every target count**; Elemental Tempo#1250364 (spending Maelstrom cuts Stormstrike/Lava Lash cooldowns 0.3 s per stack), Thunder Capacitor#1262635 (20% refund).

## The spec in one line
No resource besides **Maelstrom Weapon#187880** (cap 10 with Overflowing Maelstrom; 5+ = instant): keep strikes on cooldown (Voltaic Blaze#470057 → Crash Lightning → Stormstrike#17364 → Lava Lash), spend Maelstrom at
**9-10 stacks** on Lightning Bolt#188196 / Tempest (Chain Lightning#188443 from 2 targets) without overcapping, and react to procs (Storm Unleashed Crash Lightning resets, Tempest, Thunder Capacitor).
Never hard-cast a spender below 5 stacks (resets swing timer).

## Hero trees
- **Stormbringer in all raid and M+** (both guides): Tempest from Maelstrom spending (deck-of-cards), **Ascendance#114051** 2-min burst (Descending Skies#1264688 gives a Tempest on cast), one build for everything, strong cleave
  (Ride the Lightning#204357, Conductive Energy#455123 priority damage). High RNG from Doom Winds procs.
- Totemic: Surging Totem#444995 + Doom Winds every minute, Hot Hand#201900 Lava Lash windows, Sundering#197214; Wowhead & Icy Veins **Delves** pick only.
- Raid build notes (Wowhead): always Voltaic Blaze + Fire Nova#1260666 (2-piece), all 4 Apex points, Chaining Storms#334308 free; **pure single target with the 4-piece: Storm Swell#455088 instead of Supercharge#455110** (Supercharge in cleave or before the 4-piece).
  Utility for this raid (Icy Veins): Capacitor Totem, Wind Rush Totem, Jet Stream, Totemic Focus, Totemic Projection (big arenas). M+: Cleanse Spirit + Poison Cleansing Totem (lots of poisons/curses).
- Apex **Storm Unleashed#1262713**: each Maelstrom stack spent has 2% to reset Crash Lightning (≈1 in 5 ten-stack spends) and its buff can overlap/stack; spenders +7.5%, imbues +10% per point; Crash Lightning static pool + attack speed per stack. All 4 points.
- Omnium Folio (Icy Veins): Unleashed Fire, Self-Mending, Lingering, Burning Haste (or your lowest stat), Overload.

## Single target — Stormbringer (Wowhead; Icy Veins same)
1. **Voltaic Blaze on cooldown** (2-piece Burning Core#1299975). 2. **Crash Lightning on cooldown** (Storm Unleashed overlaps). 3. Ascendance. 4. Windstrike#115356 in Ascendance.
5. Stormstrike during Doom Winds. 6. Tempest / Lightning Bolt at 10 Maelstrom. 7. Stormstrike. 8. Lava Lash. 9. Lightning Bolt at 5+.
- In Ascendance / Doom Winds don't spend manually — **Thorim's Invocation#384444** discharges a spender with every Windstrike / Stormstrike / Crash Lightning (Raging Maelstrom: up to 10 stacks). Crash Lightning whenever ready, Windstrike otherwise; Voltaic Blaze when it comes back.
  Enter Doom Winds with 1-2 charges of Stormstrike and Crash Lightning ready; fill every GCD with them.
- Thorim's priming: last Lightning Bolt / Chain Lightning cast sets which spell it fires (single target = Lightning Bolt, AoE = Chain Lightning); Tempest and Primordial Storm set it by targets hit.
## Totemic (Wowhead)
Voltaic Blaze → Surging Totem → Lava Lash with Hot Hand / Whirling Fire#453405 → Sundering (every other with Surging Totem) → Doom Winds (off GCD) → Primordial Storm#1218047 at 10 → Crash Lightning → Stormstrike in Doom Winds → Lightning Bolt at 10 → Lava Lash → Stormstrike.
Spend at 5+ if Elemental Tempo resets Lava Lash or it extends Hot Hand (Totemic Momentum#1260644). Sequence: Surging Totem → Sundering → Lava Lash → Doom Winds + Primordial Storm; weave Lava Lash 1→2→1 in Doom Winds.

## AoE (2+ targets → Chain Lightning)
Stormbringer: Voltaic Blaze → Crash Lightning → Ascendance → Stormstrike in Doom Winds → Tempest with a proc at 10 → Chain Lightning at 9+ → Stormstrike → Lava Lash → Chain Lightning at 5+. Cast Voltaic Blaze right before Ascendance and again inside it; Fire Nova can reset Crash Lightning.
Totemic: Surging Totem → Sundering → Doom Winds + Crash Lightning → Lava Lash (Primal Catalyst double) → Primordial Storm → Lava Lash on cooldown in Hot Hand.

## Openers (Stormbringer)
ST: Liquid Luster 10-12 s before pull (or pre-pot Potion of Recklessness — before combat so it rolls Crit/Mastery, not Haste) → pre-cast Crash Lightning 1 s before pull (hit nothing) → Voltaic Blaze → Stormstrike once → Light's Potential →
Ascendance → Crash Lightning whenever available, Windstrike otherwise, Voltaic Blaze when ready → priority. AoE is near identical (Crash Lightning first, Luster/Light's Potential with the first GCD). Second potion 10 s before a burst window.
Pre-combat: Lightning Shield#192106 (Instinctive Imbuements#1270350 applies Windfury#33757 / Flametongue#318038 imbues; Elemental Orbit#383010 adds Earth Shield), Skyfury#462854. **Never use weapon oils or whetstones** (they overwrite imbues).

## Cooldowns
- Ascendance (2 min with Thorim's Invocation, 15 s): Windstrike/Windlash 30 yd, armor-ignoring, Windstrike 60% shorter cooldown; free 10 s Doom Winds; outside it, 0.5% per Maelstrom stack spent to proc Doom Winds.
- Doom Winds (1 min, off GCD, 8-10 s): +50% Windfury chance, +20% Windfury damage; main-hand strikes (Stormstrike, Crash Lightning per target, Sundering, Primordial Storm hits) become AoE Windfury triggers.
- Sundering (30 s): line; Surging Elements#382042 15% haste + 5 Maelstrom; with Primordial Storm a 4-part attack.
- Earth Elemental is not a DPS cooldown.

## Tier set (Season 2)
- 2-piece: Voltaic Blaze makes the target erupt in Fire Nova every 2 s for 6 s (+200% on the main target) → **Voltaic Blaze to the top of the priority**.
- 4-piece: each Fire Nova cuts Crash Lightning cooldown 2 s and +8% next Crash Lightning (stacks 5) → more GCDs on Crash Lightning (why Storm Swell beats Supercharge in pure ST).

## Stats
- Stormbringer: Wowhead Agility > Crit = Mastery > Haste > Vers; Icy Veins item level > Crit (keep it highest for Overcharge#1251026) > Mastery > Haste > Vers (all three close).
- Totemic (Wowhead): Mastery = Haste > Crit > Vers. Mastery: Enhanced Elements#77223 (also Windfury chance).

## Disagreements
- None of substance (Stormbringer everywhere but Delves in both).

## What a log can check
Maelstrom Weapon overcapped / spenders cast below 5 (hard casts) or at 5-8 without reason; Voltaic Blaze and Crash Lightning casts vs possible (and Storm Unleashed resets used); Ascendance casts vs possible; manual spenders cast during Ascendance/Doom Winds
(should come from Thorim's Invocation); Stormstrike/Crash Lightning filling Doom Winds GCDs; imbues/Lightning Shield missing; potion rolled Haste.
