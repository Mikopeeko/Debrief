# Feral Druid (melee DPS)

Read Oct 19 2026. Wowhead + Icy Veins (12.1.5). No 12.1.5 class changes.
12.1 (Wowhead): Matted Fur +25%, Heart of the Wild Wild Growth +25%, Shred/Swipe +10%; Feral +3% all; Rampant Ferocity +25%; Saber Jaws 60%/pt; Focused Frenzy 15%; Rip and Tear 20%; Chomp +30%;
Apex Predator's Craving#391881 base 4%; Merciless Claws 25%; Blood Spattered#1244532 8% per stack max 6; Taste for Blood 16% (+8% in Tiger's Fury); Rejuv/Wild Growth/Regrowth +25%; Cooldown Manager shows empowered DoT icons.

## The spec in one line
Energy + Combo Points. Keep Rip#1079 and Rake#1822 (and Moonfire#155625 with Lunar Inspiration) up ~100%, snapshot them during Tiger's Fury#5217, always spend at **5 Combo Points**, Ferocious Bite#22568
with **50 Energy** (bonus damage) only while Rip is up, and sync Berserk#106951 + Tiger's Fury + Convoke the Spirits#391528.

## Hero trees
- Raid: Wowhead **Druid of the Claw "Raid (Best)"** (better in lower gear, bursty; best defense); Icy Veins **Wildstalker** for raid (handles the Venomous Abyss's frequent cleave better). Both "nearly indistinguishable" by 12.1.
- Mythic+: Wowhead **Wildstalker "M+ (Best)"** (its text says DotC pulls ahead in M+ — contradictory); Icy Veins **Druid of the Claw** for M+ (Blood Spattered funnel, easier, more defense).
  DotC: Ravage#441583 procs (Ferocious Bite upgrade, AoE), Claw Rampage#441835 during Berserk (Swipe to fish), Tear Down the Mighty (Feral Frenzy/Chomp). Wildstalker: Bloodseeker Vines#439531, Lunar Inspiration DoT play.
- M+ must-haves: Primal Wrath#285381, Apex Predator's Craving, Rampant Ferocity#391709; Frantic Frenzy#1243807 (AoE version of Feral Frenzy) vs Focused Frenzy#1244544 (single target, −15 s, +15%).
- Apex **Unseen Predator**: Ferocious Bite has 15% per Combo Point to trigger Unseen Slash/Swipe (weaker if <5 CP and <50 Energy); +7.5%/pt all damage for 1 s per CP; final point: Rip +30%, Tiger's Fury makes the next
  two generators trigger max-strength Unseen Attacks. → always spend at 5 CP.
- Incarnation: Avatar of Ashamane#102543 is weaker than Berserk with the tier set (Icy Veins).
- Omnium Folio (Icy Veins): Unleashed Fire, Self-Mending, Lingering, Masterful Cunning (balance your weakest stat), Overload.

## Single target priority
Wowhead (DotC): Ferocious Bite with Apex Predator's Craving → Rip at 5 CP if missing/pandemic and Tiger's Fury is up (or TF won't be up before it drops) → Ferocious Bite at 5 CP + 50 Energy with Rip up →
Berserk + Convoke with Tiger's Fury → Feral Frenzy#274837 with TF → dump Energy 3 s before Chomp#1244258 / before TF (if >80% Energy) → Feral Frenzy / Chomp / Tiger's Fury on cooldown →
Rake if missing, pandemic, or a stronger snapshot (or ≤2 s left and TF isn't ready) → Moonfire same rules → Shred#5221.
Icy Veins: Tiger's Fury on cooldown (ideally at 5 CP or 50 below Energy cap) → Berserk with TF → Feral/Frantic Frenzy in TF → Chomp → Apex proc Bite → Rip at 5 CP (prefer in TF) → Convoke (with Berserk + TF,
low CP, Rip lasting the channel) → Ferocious Bite/Ravage at 5 CP + 50 Energy with Rip up → Rake → Moonfire → Shred.
- Only overwrite a DoT with an equal or stronger snapshot; if TF is about to fade, refresh soon-to-expire DoTs first. Pandemic windows: Rake 4.5 s, Rip 7.2 s, Moonfire 5.4 s (−25% with Circle of Life and Death).
- Chomp: only usable below 30% Energy (or within 2 s after) → dump Energy as it comes back; triple damage on crit.
- Don't waste Combo Points (Panther's Guile bursts); a little Energy waste is OK. Use Omen of Clarity procs below 5 CP.

## AoE
Primal Wrath for Rips on everything (Rampant Ferocity only hits Ripped targets) → Tiger's Fury (70+ below cap) → Apex procs on Bite → Berserk/Convoke with TF → Bite/Ravage at 5 CP + 50 Energy →
Swipe#213764 during Berserk (DotC Claw Rampage) or with Clearcasting → Rake cycling targets (Double-Clawed Rake; Wowhead: up to 5 targets) → Moonfire cycling → Swipe → Chomp when out of Energy.

## Openers
ST (Icy Veins): Prowl#5215 → Tiger's Fury in stealth + Rake (max snapshot, Pouncing Strikes#390772) → Berserk + potion + trinket (e.g. Voracious Heart of Ula'tek) → Feral/Frantic Frenzy (5 CP) → Rip → Convoke → Bite.
Wowhead adds: Swipe twice pre-combat to be low Energy; Moonfire; Shred to 5; under 30% Energy → Berserk + TF → Chomp → Rip → Convoke → Bite → Feral Frenzy.
AoE: Rake different targets to 5 CP → TF → Primal Wrath → potion → Berserk → Frenzy → Bite → Ravage → Convoke.

## Cooldowns
- Berserk (15 s, 3 min; 2 min with Heart of the Lion): +15%, 1 CP every 1.5 s, +1 CP per generator, store up to 3 extra CP (Overflowing Power). Spend aggressively. Incarnation: 20 s, −25% energy costs, one Prowl in combat.
- Tiger's Fury (30 s, off GCD): +50 Energy, +15% for 10 s (longer with Predator / Raging Fury), snapshots bleeds. Press every 30 s, ideally at low Energy, refreshing expiring bleeds.
- Convoke (2 min; 1 min with Ashamane's Guidance — keep it on its 1-min cadence): 16 spells over 4 s (12/3 s), mostly Feral, casts Ferocious Bite as a full-strength finisher, may cast Feral Frenzy. Only inside Berserk + TF, Rip up.
- Feral Frenzy: at 0-2 CP, follow with a finisher; with Focused Frenzy every Tiger's Fury; Frantic Frenzy every third TF (or held to align with Berserk / adds).

## Tier set (Season 2 — "Bark of the Enigmatic Dreamwatcher")
- 2-piece: when Berserk ends, +10% damage for 1 s per Combo Point spent during Berserk.
- 4-piece: Berserk lasts 10 s longer. → make full use of Berserk.

## Stats
- Wowhead: DotC Agility > Mastery > Haste > Crit > Vers; Wildstalker Mastery > Crit > Haste > Vers.
- Icy Veins: single target Mastery > Haste > Crit > Vers; AoE Mastery > Crit > Haste > Vers. Keep Vers low (Venomcursed / Potion of Recklessness). Primal Fury#159286: generator crits give an extra CP.

## Consumables (Wowhead)
Flask of the Shattered Sun (or Magisters); Potion of Recklessness; Concentrated Silvermoon Health Potion; Thalassian Phoenix Oil both hands; Harandar Celebration / Royal Roast + Sanguithorn Tea (5% speed, stacks).
Enchants: Acuity of the Ren'dorei, Rune of Avoidance, Amirdrassil's Grace, Mark of the Worldsoul, Forest Hunter's Armor Kit, Lynx's Dexterity, Eyes of the Eagle; Powerful Eversong Diamond#240967 + one of each colour.
Pre-pull: Mark of the Wild, Cat Form, Prowl.

## Disagreements
- Hero tree per content is flipped between the guides (Wowhead DotC raid / Wildstalker M+; Icy Veins Wildstalker raid / DotC M+). Both: near-identical numbers — don't judge a player on this.
- Stat order after Mastery differs slightly.

## What a log can check
Rip and Rake uptime; Rips/Rakes applied with Tiger's Fury snapshot; finishers cast below 5 CP; Ferocious Bite with <50 Energy or with no Rip; Tiger's Fury / Berserk / Convoke / Feral Frenzy / Chomp casts vs possible;
Convoke outside Berserk+TF; Apex Predator's Craving procs wasted; Combo Points wasted.
