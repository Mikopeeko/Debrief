# Boss guides: how-to cards (what worked on The Coiled Altar, Nov 4)

Flex: "the guides need clear explanations of how to handle each mechanic, not just explaining the mechanic. Including the videos."
The Coiled Altar was done first (Mythic and Heroic). Do the other bosses the same way.

## A card
- Put `how: 1` on the card. The steps come first, then a short **What it does** line under them (the card's `what`).
- Each step starts with **who** and a colon, shown in gold: `Axe target:`, `Soak 1:`, `Everyone in it:`, `Off-tank:`, `Healers:`, `Purple carriers:`.
  Keep the who to 2 to 30 characters, with no full stop in it.
- Then say **where**, **when** and **what to press**, in short sentences. Put the key words in `*stars*` and they show bold: `*Walk out 40 yards*`, `*Press a defensive*`.
  The stars are dropped everywhere else (the whole-fight list, its gist line, the Raider look's summary).
- Put `roles` on the card: one per step, `''` everyone, `t` tanks, `h` healers, `d` DPS (e.g. `'td'`). Put Mythic's own in `m: { roles }`.
  This replaces the guide's `stepRoles` list, which was keyed by name, so Heroic and Mythic could not share a name.
- Title: `In-game name (Nickname)`, as in Guillotine (Soak), Dreadmarch (Mind Control), Eternal Nightfall (Shield Break),
  Spiteful Soulcoiler (Adds), Coalesced Venom (Orb Pops). Don't end the name before the bracket with a number: the whole-fight
  list drops a trailing number ("Into Phase 2" read "Into Phase"; it's "Phase 2 Push" now).
- There must be one step line per `k.step()` on the map. A card with both soaks of a phase (Guillotine) chains the soaks
  on one map, like `grim()` does (`GDZ_SEG`), and lists both soaks' lines.
- Heroic gets its own lines in the base card; Mythic's go in `m: { … }`. Check that no Mythic-only thing is left in the base
  (Retaliatory Malice and raid markers were Mythic-only on The Coiled Altar).
- When a card is renamed, the report's "How to do it" links still find it: `GDZ_SEC` points at card ids now, not names.

## Its map
- Add one caption per step with `k.call(t0, t1, text, { x, y, color, ink })`, timed to the step and shown one at a time.
  Words are short calls, like "Soak 1: walk in", "Walk out 40 yards" or "Stun them in turns".
- Show presses with `k.press(id, text, from, to)`: Wall, Turtle, BoP, Kick, Leg Sweep. These stay in the whole-fight video,
  where other tags are hidden, and a player with a press is always named.
- Show handling as movement: soakers walk in and out at a walking pace, CC players walk over and press in order, an add
  teleports after each kick (two `k.add` keys 0.05 s apart).
- Set `label: false` on a ring when your own caption says the same thing (Guillotine, Widow's Kiss, Veil of Twilight, a
  stack's raid cooldowns). Otherwise two pills pile up.
- `GDZ_FREE` (guides.js) lists the bosses whose map labels move off the players. A label on the floor tries a few spots around
  where it was put. A label on a unit goes above or below it. The map keeps whichever covers the fewest players while the label
  shows. Add each boss to `GDZ_FREE` as it's done. Bosses not on the list keep their labels where they were put.
- The raid lead's freeze box picks the spot (out of 8) that covers the fewest players, the freeze's spot and the video's own
  captions. This works on every boss already.

## Checking
- The scratchpad checker (`ca/chk.js`, run in the page through a test-only hook in a local copy) does three things for every card. It steps each map frame by frame and lists any caption over a player. It shows each freeze box and counts the players under it. It compares the step count with the line count. Run it on Mythic and on Heroic.
- Plan's pictures reuse some guide maps (The Coiled Altar: `GDZ_CA_M.kicks()` and `diamond()`, read at a fixed moment).
  A change to where things are at that moment changes the picture, so read the picture's spots from frame 0 (the kick
  picture's adds do now).
- Check on desktop 1440 and phone 390, Mythic and Heroic, with no console errors.
