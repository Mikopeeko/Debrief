# Nek'zali the Soulcoiler (Venomous Abyss boss 1)

Read Oct 19 2026: Wowhead strategy + journal, Icy Veins full guide. Older notes: `notes/Nekzali research.md` (Method Mythic/Heroic guides, Mythic Trap, and what Wolfthorn's logs show — spell IDs, timings, thresholds). Encounter ID 3470.
Fight style: single target with adds. Lust: Wowhead says pull; **Icy Veins says Phase 2** (when she comes back; P2 is a damage race to 100 energy). Our research note also says P2.

## Fight in one line
Two phases with a 50% intermission. Everything revolves around the **Soulcoil Well#1285623/1284032** in the middle: adds (Restless Amani#261509) that reach it, or players who die in it, give her energy and hit the raid. At 100 energy she enrages (Uncoiled Rage#1284034: +150% speed, +500% damage).

## Phase 1 — mechanics and solutions
- **Soulcoil Ignition#1285681** (cast 1293664, ~every 73 s): she stirs the well, Soulcoil Rite#1288772 x5 on everyone (+25 energy; 4th Ignition = 100 unless adds gave more). Heroic+: Ritual Burn#1297624 (+15% Rite damage per stack, 1 min).
  Solution: healing cooldowns for the overlap; dodge **Anguished Echoes#1294846** (spirits from the well, big hit + knockback in 5 yd).
- **Restless Amani** (sets of 4-6 from glowing coffins on the room edge; one area with many coffins, an adjacent area with one = 2-3 adds): walk to the well behind a **magic** absorb shield (Gravebound Advance#1287533, 25% HP) — can't die while it holds.
  Solution: tank drags the boss to the big coffin group for cleave; **ranged break shields with magic damage** (not Hunters — physical); Death Grip strays; once the shield breaks they get a normal threat table → tank picks them up. Each Amani in the well = +5 energy and a Rite on the raid.
  Heroic+: dead Amani leave a corpse (**Vessel of Awakening#1295263**) and Corpse Blight#1294729 (stacking raid DoT within 15 yd). Corpses must be burned in the intermission.
- **Essence Rend#1287426** (dispellable): pulls several players to the center for 5 s, then knocks them out with a DoT. Solution: walk to the **outer edge**, then healers dispel (not before). Dispel leaves a **Latent Cultist#1287198** puddle (area denial, slow) for the rest of the fight — keep them off the middle.
- **Possession Barrage#1284103** (tank): ghosts fly toward the tank and burst on arrival for raid damage (1292034) that is **lower the farther they travel**. Solution: the tank runs straight away from the raid; **nobody stands between boss and tank** (a ghost hitting someone early = big raid damage). Ghosts spawn Restless Amani where they land. Heroic: each echo applies Hollowing Strikes.
- **Hollowing Strikes#1284109** (tank stacks: DoT + −5% healing per stack). Swap at ~5-6 stacks, timed so the swap lands after Possession Barrage.

## Intermission (50%) — Ritual of Awakening
- She is immune (Tether of Awakening#1289696) while **two Echoes of Jawae** live; **Soul Transfer#1292248** spawns them one at a time (15 s channel, then a line blast — dodge). First on the west, the second (after the first dies) on the opposite side. Kill them one at a time, cleave Amani.
- **Hungering Pyre#1289855**: group soak (split, 10 yd) centered on the Echo's tank. Solution: tank parks the Echo **on a corpse pile**; melee + tanks soak; it burns corpses it hits. Players who don't soak get **Slithering Flame#1294933** (DoT).
  Heroic+: Slithering Flame ends in **Cremation#1289875** (4 yd burn) → mobile ranged stay out of the soak on purpose and use it to burn stray corpses.
- Corpses left are repossessed during the ritual (empowered Amani, Vessel of Awakening 1297630) — several at once can wipe the raid (Wolfthorn wipe: 5 at once killed 11).

## Phase 2 — Uncoiling
Energy resets to 0. **Uncoiling#1290003**: raid damage every 0.9 s until she dies. Same mechanics as P1 plus **Invoke#1299673**: Soulcoil Rite on everyone (stacks no longer fall off — damage climbs) and Latent Cultists reposition (Entwined Step#1293497).
Kill her before 100 energy.

## Mythic changes
- **Grasping Depths#1293212** (twice per phase): a Drowned Echo awakens in the well; the raid is pulled toward the well and takes damage until it dies. Teams go **into the well** (Immortal Coil#1308227 damage inside) to kill it, dodge **Swirling Spirit#1300239** beams,
  and **interrupt Soulcoiler's Curse#1300238** (otherwise everyone inside is ejected Soulcoiled → sacrificed → Rite). Leaving gives **Soul Exhaustion#1300235** (+300% well damage, 1 min) → teams rotate.
  - Team size: Icy Veins **3 teams of 4 DPS + 1 healer**; Method ~3 DPS + healer, two teams alternating; Wolfthorn used **two teams of 5** (listed in the research note).
- **Invoke** interrupts all casts and silences the interrupted player 3 s → stop casting before it.
- Every corpse left is repossessed in the intermission; more than one at once hits very hard.

## Tactyks Mythic video (week-1 kill) and Mythic Trap — extra points
- Grasping Depths runs **the whole fight**, not just the intermission. Touch the well to phase down. The Drowned Echo has one long cast to kick: **2 melee kicks or 3 other kicks**. Kick late in the cast. Assign 1st/2nd kicker per team.
- Down there: dodge circles and lasers (Swirling Spirit) → **send physical/melee DPS** (warriors, hunters, monks, rogues, DKs). Keep casters such as Balance, Shadow and Warlocks upstairs to break the Amani's magic shields. Mages weren't a good fit.
- They sent **two hit squads of 4 DPS + 1 healer**, alternating (Soul Exhaustion stops back-to-back trips). It was overkill but safe: one run with only 3 DPS still killed the add. The first Depths comes ~26 s after Possession Barrage.
- The DPS check is lenient: as long as no Amani reaches the well, boss damage barely matters in P1. Grips help (tighter corpse piles) but aren't required.
- Tank swap is forgiving: they swapped around 7-9 stacks, and one tank (Guardian Druid) took every Barrage. A Blood DK found the Barrages annoying.
- Intermission: hit the boss during her move to the well (free damage), then the Echoes. Use one 2-min cooldown in the intermission and **hold the second plus Lust for P2** (delaying Lust 30-50 s to line up is fine).
- **The Hungering Pyre's hit is smaller than its circle**: stand near the center or corpses at the edge survive. Ranged clean up missed corpses and can pre-position on them. Swap to a revived Amani immediately (it pulses heavy damage). One is fine, more is a wipe.
- P2 Invoke: a 3 s silence if you're casting when it lands.

## What a log can check (see research note for IDs)
Amani reaching the well (energy jumps, Rite batches outside Ignition); Essence Rend dispel timing and puddle distance from the well; players between boss and tank on Barrage (raid hit size); tank swap stacks; Pyre soaker counts; corpses repossessed;
Mythic: Soulcoiler's Curse kicked, Swirling Spirit hits, players in the well with Soul Exhaustion; deaths in the well; Invoke interrupts (players silenced).
