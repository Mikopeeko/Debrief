# Entombed Sentinels (Venomous Abyss boss 2 or 4, depending on route)

Read Oct 19 2026: Wowhead cheat sheet + journal, Icy Veins, Mythic Trap, Tactyks Mythic video (qDAclL39D7U, week-1 kill). Older detailed notes (log spell IDs, measured circle sizes, thresholds): `notes/Entombed Sentinels research.md`. Encounter ID 3445.
Fight style: two separate bosses (spread two-target). Lust on pull. Raid split into two halves, one per boss.

## Fight in one line
**Breath of Ula'tek** (green, 258557) and **Blood of Ula'tek** (red, 258558) must stay **40+ yd apart** (Ula'tek's Dominance#1290193: 99% damage reduction within 25 yd; marks reach 40 yd). Each puts a stacking 40 s DoT on everyone within 40 yd
(Mark of Acid#1284494 / Mark of Blood#1284503) — stay with your boss. At 100 energy: **Vitriolic Stasis#1284588** intermission (both run to the middle, 99% DR for 30 s, **the weaker one heals up to the other**) + the **Helical Toxins#1284590** math game. Tanks swap bosses (and groups their stacks reset) after every intermission.

## Green — Breath of Ula'tek
- **Venom Coagulation#1284251**: big slime baited on a ranged player; pulses raid damage (Contaminate) while alive → kill it fast (on Mythic a real DPS check). Red-side ranged can help if it is far enough from their boss.
- **Toxic Droplets#1284434**: little droplets; step on them before they explode (Noxious Blast, raid-wide). Each pickup hurts — **tanks soak most of them with a defensive** (Tactyks: always Barkskin/Incarn/Survival Instincts up; wait for the defensive rather than soak naked). Mythic: two at once can kill.
  Heroic+: **Living Venom#1284207** — droplets fire back into the boss as lines ("daggers"); dodge.
- **Empowering Slam#1284458**: tank hit, +10% each time on the same target (until the intermission swap).

## Red — Blood of Ula'tek
- **Unstable Miasma#1288232**: group soak (split, 7.5 yd); soakers get Clinging Murk. Mythic: **8+ soakers** (it hurts — stack defensives/AMZ/Spirit Link). Heroic+: Clinging Murk ends in a **Blood Venom#1284208** puddle → soak in a corner, then line up along the back wall to drop puddles in a pattern.
- **Blighted Blood#1284471**: dispellable DoT — dispel fast (Icy Veins: instantly, to get a second dispel). Heroic+: if it expires it drops a puddle → place near other puddles.
- **Bloodvenom Injection#1284487**: tank hit + stacking DoT; after the intermission the leaving tank drops a **huge puddle** → drop its *center* in a free gap among old puddles (center decides placement; it won't drift) (Tactyks).

## Intermission — Helical Toxins
Everyone gets 1-3 green orbs (stacks); touch exactly one partner so the total is **4** (1+3 or 2+2); 30 s. Wrong total/unsolved → **Cultivated Burst** (huge hit + DoT + pool). Heroic: going over 4 by bumping is lethal.
Mythic: after a few seconds you can only see your own number. Systems:
- Tactyks / video: **2s go under the boss**; **1s jump in place and ping themselves (macro)**; **3s run around and collide with a jumping pinger**. Pre-spread first; quick-clear only when obviously safe.
- Method: 3s stand and ping, 1s hunt pingers, 2s meet between bosses.
Keep boss health even going in (multi-dotters help); a 5% gap = free healing for the bosses.

## Mythic
- **Shifting Protovenom#1296878** (cast by Vashnik): ~8 players get an orange circle (~6 yd, measured), aiming for 4 per side. Touch another circle player to clear both; touching an unmarked player → **Protovenom Eruption** (damage + big knockback). Pre-spread, unmarked players get out of the way,
  marked players **pause ~2 s** before walking unless the path is obvious. A multi-dotter with both marks can be picked as a 5th on one side → must clear with the other side. Two sets per cycle.
- **Hidden rule (Tactyks): 20+ stacks of Mark of Acid AND 20+ of Mark of Blood at once = instant death.** Multi-dotters: don't refresh into both.
- Comp (Tactyks): split multi-dotters evenly (e.g. Warlock + Boomkin one side, Warlock + Shadow the other); put the strong 2-target **melee on the green side** (more adds to kill).
- Positioning trick: green ranged "stack far" to bait the Venom Coagulation away from the tank's new puddle; tank the green boss on the *far side* of the add so all ranged (both sides) can hit the add from max range without collecting marks.
- **Worst overlap each cycle (after the first): the second add + Toxic Droplets + second Protovenom set**, right after the blood soak. Use immunities (Turtle, Bubble, Cloak) to soak droplets there; otherwise raid cooldowns (Rally, Devotion Aura).
- Space: puddles start despawning late; Tactyks still had room at the enrage. Use the cubbies later in the fight.
- Enrage after the 4th intermission cycle (don't start the new green add then).

## What a log can check (see research note for IDs and thresholds)
Bosses within 40 yd; Mark stacks of the other boss; boss HP gap before each intermission (healing 1284635); Helical Toxins failures (Cultivated Burst 1284941); Protovenom Eruptions (1296962) and slow clears; droplet pickups in pairs / by non-tanks without defensives;
Blighted Blood dispel delay; Miasma soaker count; Living Venom hits; deaths to both-marks at 20.
