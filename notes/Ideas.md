# Ideas for later

- **Burst windows vs mechanics (Oct 19):** find a way to note when a DPS player's burst window (their big cooldowns)
  lined up with certain mechanic windows, for example an add set, a shield to break, or a boss damage-taken window,
  or when it was spent during a phase where damage doesn't matter. Likely home: the burst window cards on Rotation.

## Strictness setting: Flexible / Moderate / Strict (Oct 26)
The user: "The user of the website can toggle how strict the raid lead is/the rules are. Flexible/Moderate/Strict or something like that. This would basically allow them to simulate their own raid scene, maybe a raid lead uses my website and wants 0 mistakes, no room for error at all. Maybe some want some leniency."
- One setting that scales every judgement: mistake tolerances, the avoidable-damage limits, soak tolerance, death blame, yellow-vs-red cut-offs, and how the coach talks.
- Possible levels:
  - **Flexible:** only real wipers and repeats count;
  - **Moderate:** today's fair rules (the default, set against top kills);
  - **Strict (Mythic world-first style):** zero tolerance, every slip shows.
- Where it lives: a raid lead sets it for their team (saved with the team, so all raiders see the same bar); a raider can preview another level for themselves.
- Keep the facts identical; only the flags, grades and coaching tone change. Show the level in the header ("Strict mode") so screenshots aren't misread.
- Owners: Debriefing (coach and checks), Deaths and Avoidable damage (their limits), Report card (grades). It needs one shared "strictness" value that every rule reads.
- **The user's answers (Oct 26, later):** these replace the guesses above where they differ.
  - **Per user, not per team.** "Anyone, its not saved per team its per user." Each viewer picks their own, and it's remembered for them.
  - **Three levels.** "Probably start with Flexible, Some Mistakes, and No Mistakes (Light, Medium, Severe)". A bigger slider might be nice later, but it risks more bugs.
  - **Strict = "nail in the coffin" raid leading.** "As little avoidable damage as possible, imagine this is a top guild pushing for top 100 world rank. What would they expect their raiders to play like?"
  - **Tier each level off ranking performance:** "maybe tiering each based off of ranking performance". Each level's cut-offs come from real kills by guilds at that rank, not from invented numbers. Severe = what top-100 world raiders actually do; Medium = today's fair rules from the fastest kills; Light = what an average guild's kill allows.
  - **The bands, decided Oct 26** (world ranks, each boss after its last nerf). The user: "there needs to be a somewhat higher standard when using the site, whats the point in using it if youre not looking to be better".
    - **No mistakes:** guilds ranked 1–100, their fastest kill.
    - **Some mistakes:** today's rules.
    - **Flexible:** guilds ranked about 300–1,000, their *first* kill after the nerf. Speed rankings are mostly farm kills, and mid/late season the guilds still on a boss are progressing. 300–1,000 is one step above Wolfthorn's ~#1,460. Fewer kills than that: everything from 300 down.
    - **Cut-offs:** from the typical raider in those kills (median → amber, 9 in 10 → red). Deaths are red at every level.
  - Mockup: notes/Strictness mockup - Oct 26/ (Coiled Altar pull 22, three levels side by side). The user, on the first ranges: "a good start".
  - **Light follows the data (the user, Oct 26):** "Follow the data: Light is never stricter than Medium, and looser only where average guilds really are (orbs, ghost collisions nobody died from)."
    - Measured on Coiled Altar: 12 first kills by world #459–#737 guilds. Their raiders took about the same avoidable damage as top raiders, sometimes less, and died more (median 7 deaths vs 2).
    - So Light = Medium everywhere except orbs in one P1 frontal (Light amber 8, red 9) and a ghost collision with nobody dead (Light amber).
    - The same rule applies to every boss's Light band.
  - **The raid lead's voice matches the level (the user, Oct 26):** "the way the raid lead speaks should match the level of strictness". Same facts at every level; only the tone changes.
    - Light is encouraging: it names the real problems, then "fix those and this pull is in good shape".
    - Medium is today's balanced voice.
    - Strict is firm: "a top-100 guild wouldn't accept this pull", then everything that has to change.
    - This applies even when Light and Medium colour a pull the same.
    - Examples the user OK'd ("looks good for now"), Oct 22 Coiled Altar night:
      - **Wipe, pull 22.**
        - Light: "We wiped in P2 at 56%. Two of us died when the ghosts touched, and one frontal took 10 orbs. Fix those two and this pull is in good shape."
        - Strict: "…a top-100 guild wouldn't accept this pull: two deaths to touching ghosts, 10 orbs in one frontal, and three of us over 16 seconds in Noxious Ground. Next pull: ghosts apart, about 4 orbs a frontal, and out of the ground right away."
      - **Best pull, 24.**
        - Light: "Our best pull yet, P2 at 21%! That's real progress."
        - Strict: "Best pull so far, but it's still not clean: someone ate an axe, and the second Nightfall shield took 16 seconds when top guilds break it in 13."
      - **One raider (Ashdknight, 21 s in Noxious Ground).**
        - Light: "Step out a little sooner and you're right where you need to be."
        - Strict: "A top-100 raider takes about 5. That's damage the healers shouldn't be spending on you."
      - **The night.**
        - Light: "…Axegrinder wiped us 6 times, so that's the one to clean up. Good work tonight, everyone."
        - Strict: "35 pulls tonight and no kill. Axegrinder wiped us 6 times, and that shouldn't happen once."
      - **A kill.**
        - Light: "Boss down! … Amazing work, everyone."
        - Strict: "Boss down. Now let's make it clean: Caustic Globules had mistakes in 23 pulls tonight."
      - Same facts, numbers and names at every level; only the praise, the number of problems and the push change.
    - The final table is in the mechanics chat's side notes: "Strictness - Coiled Altar Mythic cut-offs.md".
  - **The switch (Design studio's pick A, wording the user OK'd, Oct 26).**
    - **Where:** "JUDGED  Light | Medium | Strict" in the boss header (the user, Oct 26: "Strict might sound better/more clear" than Severe), next to the wipe filter. On a phone it gets its own row under the pull pills.
    - **Hover text on the pill:** "How strictly this page judges you. Only the colours, grades and the raid lead's tone change; the numbers stay the same. Deaths are red at every level."
    - **One hover line per level:**
      - Light: "judged like a mid-pack guild. Slips are fine, repeats and wipers are not."
      - Medium: "judged like the fastest kills. The usual bar."
      - Strict: "judged like a top-100 guild. Every slip shows."
    - **Feel:**
      - A gold pill glides to the tapped level (.22 s).
      - A one-line hint fades in under the control for 2.6 s, e.g. "Judged like a top-100 guild · every slip shows".
      - Sizes: 28 px pill (26 on phone), options 13 px.
    - **Reminders:** the user's idea ("up here put small reminders about the settings that are set").
      - A tiny "JUDGED STRICT" tag after the coach box label "Your raid lead says…": muted JUDGED, the level in gold, 12 px uppercase, a 1px line before it.
      - The same tag on the Report card banner and the Avoidable damage header.
      - Clicking it scrolls to the header switch and flashes it.
    - **Full spec:** the Design studio's look/strict/mock.js (window.__strictMock('A')).

## Debrief Lite: a recap without the PC app (Oct 25)
**Parked until after the Debrief 1.0 release** (the user, Oct 25: "Keep Debrief Lite parked until after the 1.0 release. Fixes only until then.").
The user asked whether the addon could work in game without Debrief Companion ("unconventional methods are fine, just no bans"). It can, as a smaller recap, using only what Blizzard lets addons read in Midnight. Nothing risks a ban. Parked for later (the user: "add it to a list of things to consider at a later time").
- Could show, fairly sure:
  - Your rotation, from your own button presses (Midnight hides other players' casts, not yours): your gaps between casts, big cooldowns used and how often, held cooldowns, your opener. Another addon, Midnight Sensei, already grades rotations this way in raids.
  - Defensives, Healthstone and potion: pressed or not, and when.
  - The pull itself (boss, difficulty, kill or wipe, length) from Blizzard's encounter events.
  - Your own death (Blizzard's death recap: the last 5 hits).
  - Your numbers pull by pull tonight, saved by the addon.
- Also possible if one test passes: Blizzard's built-in damage meter (C_DamageMeter). It is hidden during the fight, and reports disagree on whether it opens up after the pull. If it does: your damage or healing and your place, avoidable damage by spell, interrupts, dispels, and who died, when and to what.
  - The test, right after a boss pull, in WoW chat: /dump C_DamageMeter.GetCombatSessionFromType(1, 0). Numbers mean yes; "secret" or nothing means no.
- Only the PC app can do:
  - the raid lead box, What wiped us and the wipe call
  - mechanic checks against top guilds
  - rotation checks that need buffs or other players' health (addons can't read buffs any more)
  - the grade and the full coach
- My take: 6/10 as a feature on its own, 8/10 as a free first taste ("Get the full recap with Debrief Companion") that lets new raiders try Debrief without installing anything.
- TESTED Oct 25 by the user, right after a pull (/dump C_DamageMeter.GetCombatSessionFromType(1, 0)):
  - It returned real numbers. The fight lasted 147 s, and each player had their class, name, total damage, damage per second, death recap ID and death time. The user's own Druid "Trëèflêx" did 26.3M damage at 179k per second.
  - The "Expired" session (2, 0) was empty at that moment.
  - So the meter half works: read the Current session when the boss fight ends (ENCOUNTER_END / out of combat), before the next pull resets it.
  - Still to check: that it was a boss fight; Mythic+ keys (stricter "challenge mode" rules); Mythic raid. With this, the take goes to 8/10.
- Checked Oct 25 (the user asked: "most restrictions happen in combat"): reading the combat log is shut for addons all the time, not only in combat.
  - Live events (COMBAT_LOG_EVENT_UNFILTERED) error when an addon registers for them.
  - The game's stored log, the one the Combat Log chat tab reads, can only be read through C_CombatLogSecure, which is marked SecureOnly (Blizzard's own code only).
  - Its chat lines come wrapped in protected |K text that addons can show but not read.
  - What does open after combat is the secret values (meters, health): that's what the /dump test checks.
- Not possible or not safe: reading the combat log file from inside WoW; pulling recaps from the website into the game (addons can't go online); anything that presses keys for you, such as auto-typing /reload (that's how accounts get banned).

