# Why we wiped — how it works (Oct 21, test version)

Your ask: build the top idea from the raiding research and show a test version, not live.
Practice link: https://whywiped-debrief.james-m-nemecek.workers.dev/?night=PLRbTkpI_S3vOfdSwJrDZw (tonight's Coiled Altar).

## What you see (after your wording notes, Oct 21–22: "sound like a raid lead", "human", "root cause, briefer, at a glance")
- **One pull (Debriefing):** one line above "Next pull" with the first domino: "**Lost to Dreadmarch at 3:07** · Boltzzx, Volkovod
  and Earthday didn't pick up their soul fragments" + a "Third time tonight" tag when it repeats. Click "more" for the raid
  lead's take: "Dreadmarch again, that's the third time tonight. Boltzzx, Volkovod and Earthday, you didn't pick up your soul
  fragments and Gravebound got you at 3:07. Losing three at once is too much to come back from."
- **All pulls:** "**What wiped us:** Dreadmarch ×4 · Slow deaths, Healthstone unused ×3 · Axegrinder ×3 · Spiritcackle ×2 ·
  Sever ×2 · Venom Rupture raid damage ×2 · +3 others". "more" opens "Okay, tonight mostly came down to three things…".
- **Pull cards:** a dot next to "Pull 16": red = a mistake, orange = not enough damage, purple = too much damage taken,
  grey = not clear. Shows once the pull has been read.

## The four verdicts
- **A mistake**: a mechanic went wrong where the pull fell apart (the raid's, or the player's own: their mistake, a red mechanic
  row on their death like Gravebound, something avoidable, a cast that should have been kicked, or a slow death with a defensive,
  Healthstone or potion still ready).
- **Not enough damage**: an enrage, a berserk, a shield not broken in time, a boss still too high.
- **Too much damage taken**: many died within seconds with no mistake found, a slow death with little healing, or a tank going
  down to melee.
- **Not clear**: the log can't tell. It never guesses.

## Rules
- It looks at where the pull **fell apart**: the first death after which deaths kept coming (never a minute without one).
  An early death the raid played through for minutes isn't blamed.
- A raid mistake up to 20 s before that moment, or logged up to 8 s after it (like an orb exploding), counts.
- Kills and resets (under 15 s, or the boss never moved) get no verdict.
- Recap voice: "we", a name for one player, short.

## Tested
Tonight's 19 Coiled Altar Mythic pulls (shared night): 17 mistakes (Dreadmarch 4, Spiritcackle 2, Sever, Guillotine,
Axegrinder, slow deaths with kit ready), 2 too much damage taken (the P1 Venom Rupture wipes, where the log found no mistake).

## Code
`src/ui.js`: `whyWiped`, `whySay`, `whyLine`, `whyNight`, `whyDot` (before the report card grades); used in `dbfPull` and
`dbfNight` (top and slim boxes) and the pull card. `src/shell.html`: `.dbr-why`, `.why-t`, `.why-bad/dmg/heal/na`, `.fc-why`, `.why-bar`.
Patch kept in the shared notes folder (`why-wiped.patch`) until it goes live.

## Nov 12: the mechanic the wipe was called on
Flex, on Nov 11 pull 8: "this section is still wildly innacurate and needs serious fine tuning", "in terms of what caused the wipe at least".
The root cause (`rootCause` in src/engine.js, The Coiled Altar) used to read only the deaths before the wipe call. When the call came from a
wipe mechanic (`wipeMech` in ui.js: a short Guillotine soak, orbs touching, Eternal Nightfall finishing), the deaths it caused came a few
seconds after the call, so the few earlier deaths won and it said "Too many individual mistakes". Now:
- A wipe called on a mechanic was lost at that mechanic, with its deaths in the next 12 s. An earlier wave the raid lived through
  (Spirit Erasure 68 s before) goes to what added up, not the root.
- A Guillotine soak that landed while an unkicked Wail of Terror still had players feared (counted from the fear on each player) is the
  missed kick's wipe: "An unkicked Wail of Terror feared 15 players through the Guillotine soak, so it was short and Execution hit the raid."
- A tank killed by Blighted Sever because the other tank didn't taunt names the taunt: "Tyralien didn't taunt before Blighted Sever:
  Vandagos took it on stack 4 and died."
- The wipe-call row says "Ended by <the call's mechanic>", not the last serious row (pull 8 read "Ended by Gloombomb").

Nov 11 (19 wipes), before → after: pull 2 Too many individual mistakes → Schooty's purple orb (Venom Rupture killed 17); pull 6 Spirit
Erasure → Eternal Nightfall's shield (killed 15); pull 8 Too many individual mistakes → Guillotine soak 3 of 5 (Grim Execution killed 6);
pull 13 Too many individual mistakes → the unkicked Wail (15 feared, soak 1 of 5); pull 1 "The tank frontal hit players" → Tyralien's
missed taunt. The other 14 kept their cause. Left as it is: pull 5 (the call at 3:37 on 4 separate deaths, then Soul Sever killed 5 at
3:38, after the call). Check: tests/contradictions.js (a wipe called on a mechanic has that mechanic, or the missed kick, in its story).

## Nov 12, round 3
Flex: "The root cause aka the reason for wipes needs further fine tuning its still very off in a lot of cases", "the summary section is arguably
the most important part of my site". Read every saved Coiled Altar wipe (Oct 21: 35, Oct 22: 19, Nov 11: 19) with the site's own wipe call:
tests/wipe-read.js (real cutInfo + E.rootCause next to the log's deaths and raid mistakes around the call).
- A wipe called on the orbs keeps the orb wave a few seconds later as its own; it was read as "Reset on purpose" (Oct 21 pulls 15 and 28).
- Oct 21 pulls 27 and 33 had no root cause at all: the sentence code used `fam` outside the block that defines it (a crash, fixed).
- Tried and undone, waiting on Flex: naming the mechanic behind half or more of a worn-down pull's deaths as the root ("Gravebound killed 3
  of the 4 who died") instead of "Too many individual mistakes". Flex's Nov 5 rule (272c2ac3) keeps "Too many individual mistakes" with
  "Most were Dreadmarch (5 of 8 deaths)" for separate personal deaths, and the contradiction check guards it. With the change, 22 of 54 saved
  October wipes would have dropped to 10.
Still open: wipes worn down by a long phase 2 (Dreadful Presence); the other nine bosses (rootCauseGen), not re-read this round.
