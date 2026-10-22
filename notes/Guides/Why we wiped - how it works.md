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
