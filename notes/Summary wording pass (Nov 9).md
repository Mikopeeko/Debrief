# Summary wording pass (Nov 9)

Flex: "Things like this could be more simply stated 'Shock dropped guillotine in the wrong spot and killed several people'", then
"maybe we should do a wording pass across the summary tab".

Words only. The verdicts, colours, tags, counts, rows and layout stay the same. The long wording (how fast someone died, the old
verdict words) is still there: it's the hover on each How it went row, and the opened card keeps every detail.

## What changed (shared templates, so every boss gets it)

- **Death lines** (`deathBrief` in ui.js): "who died to what", then whose it was in a few words. How fast they died moves to the hover.
  - "X died to Y, from 59% health in 1.5 s." → "X died to Y."
  - "…: their own mistake" → "…, their own mistake"
  - "…: with a defensive still ready" → "…, with a defensive still ready"
  - "…: one of 5 killed at once" → "…, one of 5 at once"
  - "…: Tyralien didn't taunt before Blighted Sever: their miss, not them" → "… because Tyralien didn't taunt before Blighted Sever"
  - "…: feared by an unkicked Wail of Terror: the missed kick, not them" → "… while feared by an unkicked Wail of Terror"
  - "…: X dropped the Guillotine on the raid: not them" → "… because X dropped the Guillotine in the wrong spot"
  - "…: killed by orbs someone else set off (Venom Rupture)" → "…, killed by orbs someone else set off"
- **The Guillotine dropped on the raid** (engine.js): "Dropped the Guillotine in the wrong spot, and Widow's Kiss killed 3."
  It says "killed N" only when players other than the target really died to its eruption. Otherwise it says "…in the wrong spot, on top of
  6 players." The yards stay in the second sentence. The Coiled Altar root cause line says the same.
- **Missed kicks** on How it went: "Weakened Doomscale got Anguished Cry off." → "Nobody kicked Weakened Doomscale's Anguished Cry."
- **Grouped deaths** (round 361 in shell.html): names first, in one sentence: "Shockabunga and Dragooned died to the same Venom Rupture,
  killed by orbs someone else set off." The why for a group or single row comes after the spell, not after a colon.
- **Gravebound**: "Volkovod picked up all 3 soul fragments, and the third one killed them."
- **Wipe called with a shield up**: "…shield 4 still had 13% left, with 5 s of its cast to go."
- **Venomfang**: "Huservoker took 4.1 s to dispel it. 2 landed at once. Urgdragon, Tyralien and Kargaryen had dispels ready."
- **Adds left alive**: "Set 2's adds stayed alive too long, and Retaliatory Malice killed 3 players. It hit the raid for 4.48M in all."
- **Orb pops**: "Blighted Sever popped about 22 orbs at once. The plan was the purples left (7 at most)."

Matching and grouping still read the old words (each row keeps them in `data-dk`), so no row merges or splits differently.

## Before → after on the test pulls

### Coiled Altar, Thu Nov 5 (2r1KzqygWAFHkZT3), pull 22 (fight 32)
- Komo died to Venom Rupture: one of 5 killed at once. → Komo died to Venom Rupture, one of 5 at once.
- Schooty and 5 others died to Venom Rupture: too many orb stacks at once. → Schooty and 5 others died to Venom Rupture from too many orb stacks at once.
- 2 died to the same Venom Rupture, slowly, over 5 s: killed by orbs someone else set off (Shockabunga and Dragooned). → Shockabunga and Dragooned died to the same Venom Rupture, killed by orbs someone else set off.
- Blighted Sever popped about 22 orbs at once; the plan was the purples left (7 at most). → Blighted Sever popped about 22 orbs at once. The plan was the purples left (7 at most).
- Vandagos died to Melee, slowly, over 9 s: with a defensive still ready. → Vandagos died to Melee, with a defensive still ready.
- 1:05 Optt: Huservoker dispelled it after 4.1 s (2 landed at once); Urgdragon, Tyralien and Kargaryen had dispels ready. → 1:05 Optt: Huservoker took 4.1 s to dispel it. 2 landed at once. Urgdragon, Tyralien and Kargaryen had dispels ready.

### Same night, pull 13 (fight 22)
- Spiteful Soulcoiler got Wail of Terror off. → Nobody kicked Spiteful Soulcoiler's Wail of Terror.
- Kargaryen died to Dreadful Presence, slowly, over 13 s: feared by an unkicked Wail of Terror: the missed kick, not them. → Kargaryen died to Dreadful Presence while feared by an unkicked Wail of Terror.
- 3:15: Set 2's adds stayed alive, so Retaliatory Malice kept hitting the raid (4.48M) until it killed 3 players. → 3:15: Set 2's adds stayed alive too long, and Retaliatory Malice killed 3 players. (The 4.48M is the next sentence, on the opened card.)
- 1:55: Huservoker dispelled it after 8.1 s (2 landed at once); Tyralien and Urgdragon had dispels ready. → 1:55: Huservoker took 8.1 s to dispel it.

### Same night, pull 20 (fight 29)
- Kargaryen died to Gloombomb, from 56% health in 0.7 s: their own mistake. → Kargaryen died to Gloombomb, their own mistake.
- Komo died to Mutagenic Venom, slowly, over 10 s: with a defensive still ready. → Komo died to Mutagenic Venom, with a defensive still ready.
- Volkovod died to Gravebound, slowly, over 8 s. → Volkovod picked up all 3 soul fragments, and the third one killed them.
- Vandagos died to Blighted Sever, from 90% health in 0.0 s: Tyralien didn't taunt before Blighted Sever: their miss, not them. → Vandagos died to Blighted Sever because Tyralien didn't taunt before Blighted Sever.
- Half the raid was dead. Eternal Nightfall's shield 4 still had 13% left: the raid wiped 5 s before that cast would have finished. → Half the raid was dead. Eternal Nightfall's shield 4 still had 13% left, with 5 s of its cast to go.
- 2:18: Trëèflêx died to Venom Rupture, from 58% health in 1.7 s: killed by orbs someone else set off. → 2:18: Trëèflêx died to Venom Rupture, killed by orbs someone else set off.

### Twin Fangs kill (9DRWhKnZbHtQgf4a, fight 37)
- No changed lines (a kill: "Down, with 2 things to tidy up." and the same tags).

### Ula'tek pull 4 (xH3JNdbQ74wBDPAv, fight 19)
- Weakened Doomscale got Anguished Cry off. → Nobody kicked Weakened Doomscale's Anguished Cry.
- Ashslash died to Caustic Waves, from 59% health in 1.5 s. → Ashslash died to Caustic Waves.
- Ninjaristic died to Caustic Waves, from 91% health in 1.1 s. → Ninjaristic died to Caustic Waves.

### Kith'ix pull 2 (xH3JNdbQ74wBDPAv, fight 28)
- Bolas died to Nullify, from 100% health in 0.5 s: their own mistake. → Bolas died to Nullify, their own mistake.
- Eroka died to Melee, slowly, over 5 s: with a defensive still ready. → Eroka died to Melee, with a defensive still ready.
- Zeforusdk died to Negation, slowly, over 6 s. → Zeforusdk died to Negation.
- 0:23: Esra died to Digestive Juices, from 71% health in 0.5 s. → 0:23: Esra died to Digestive Juices.

## Checked: nothing else moved
The whole Summary was captured on the old build (practice link words0) and the new one (words2) for all six pulls: Timeline and
Overview views, every dropdown and hover (title, data-tt, data-why, data-next), the night strip and the wipe-call text.
- Same "Wipe called at … · N dead at the call · boss at …" line on every pull.
- Same How it went rows, same tags (Serious/Moderate/Minor) on every row, same Also hurt and Raid checks rows, same root cause.
- The build's contradiction check passed.
- The only other differences are timeline marks that group differently at another window width, and replay lists that depend on where
  the replay was.
- One quirk was already there before this pass (seen on the old build too): pull 20's header count reads "10 Serious · 3 Moderate ·
  2 Minor" when the pull is opened from its link, but "5 Serious · 3 Moderate · 1 Minor" after switching to it from the pull list.
  Not changed here; worth a look.

## Not changed (left for later)
- The orb root cause's second and third sentences ("Boltzzx was the only carrier next to another orb: 6 yd from…") are Flex's Nov 8
  wording, so they stay.
- "Komo: Stood in Soul Sever (tank frontal) for 678,998 and picked up its 200% vulnerability." in Also hurt. A page script already
  rewrites this line elsewhere, so it was left alone.
- Raid checks' Power Infusion line ("None of their big cooldowns (…) was up").
