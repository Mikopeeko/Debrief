# Ideas for later

- **Burst windows vs mechanics (Oct 19):** find a way to note when a DPS player's burst window (their big cooldowns)
  lined up with certain mechanic windows, for example an add set, a shield to break, or a boss damage-taken window,
  or when it was spent during a phase where damage doesn't matter. Likely home: the burst window cards on Rotation.

- **Discord link with mechanic alerts (Oct 20):** let users link Debrief to their own Discord server and set up
  channels that get alerts about boss mechanics (for example, a post when a pull fails a mechanic, or a summary
  after each pull). Debrief already posts patch notes to its own Discord through a webhook, so a raid could add
  its own webhook in the same way.

- **In-game companion addon: "Your homework" (Oct 21, user liked it):** a "Copy for game" string from Debrief, pasted into
  the addon once. When you zone in or target a boss (out of combat), a small card shows your top 3 fixes for that boss,
  your NSRT job and a one-line tip. Out of combat only, because Midnight blocks live combat data for addons.
  Check the 12.1.5 addon rules before building.

- **Addon option: glow the cooldown to press (Oct 21):** for healing cooldown assignments from the NSRT note, instead of
  pop-up icons, glow that spell's icon on the Cooldown Manager when it's time to press it. Check first: (1) can an addon
  still glow the Cooldown Manager in combat in Midnight 12.1.5, (2) can it listen to NSRT's own reminders so timing and
  phases match the note, (3) does NSRT already have a "glow the spell" option. Rated solid, maybe amazing.

  - **Plan (Oct 21):** a small program on the PC watches WoWCombatLog.txt and analyzes each pull as it ends (Debrief's own
    engine). It puts a short code on the clipboard with a sound; a keybind in game pastes it, and the card shows (no /reload;
    a SavedVariables + /reload route is the fallback). Nothing types into the game or touches its memory.
  - **Who sees what:** a recap for the INDIVIDUAL by default: their result on that boss, their performance (damage or
    healing against their last and best pull) and their rotation slips, much simpler than the website. A raid lead can
    switch to the raid's view too: the pull result, the top 3 raid mistakes with names, deaths and the Next pull line.

- **Why we wiped: one root cause, at a glance (Oct 22):** narrow each single wipe down to its ONE root cause (the first
  domino that lost the pull), not a list of everything that went wrong, and say it in an even briefer line you can read
  at a glance. Details can open underneath. Sent to the "Why we wiped" chat (raiding research) to build on its test link.

## Pick your own pulls (Oct 23)
New feature idea from the user: "Select multiple pulls, asside from all pulls. You select the pulls from the chart you want to view as a whole. This is great for filtering out fluke pulls."
- Click points on the pull chart (the boss-health line) to pick a set of pulls, then everything (coach box, bars, Breakdown) summarises just those, like All pulls.
- Use: drop fluke pulls (early resets, disconnects, one-shot wipes) so the summary shows real progress.
- Owners: the header chart is Front page and look; the summary is Debriefing (All pulls / Whole progression). Fits next to the "Whole progression" idea.

## TOMORROW (Oct 25): mechanics audit (Oct 24)
The user: "need to do a mechanics audit to ensure things are being evaluated properly, strictly, fairly, etc. fine tuning the logic more."
- Go mechanic by mechanic, boss by boss (all 10, Heroic and Mythic): is each moment judged right, is red only for real mistakes, is yellow fair, and does nothing slip through as green? Check against the guides (notes/Guides) and the 20 fastest kills, then against our own pulls.
- Things noticed on Oct 24 to start with:
  - A check's per-pull dot can disagree with its night number (Defensives 100% for the night while its line dips on some pulls): the night adds up first, each dot judges one pull alone. Make both use the same rule.
  - Spiteful Soulcoiler showed 100% while the note said a cast got through our kicks: should a cast that got through cost the mechanic?
  - The Sever orb-count check was filed under the tanks' Sever until today (now Coalesced Venom): look for other checks filed under the wrong mechanic.
  - Mistake kinds drop the player's name ("Too many in someone's frontal"): check each kind still reads right.
  - What wiped us now says "Too many deaths" when 3+ died from different things: check it picks the right story on a range of wipes.

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

## Report card: repeated mistakes count more (Oct 26)
The user: "regarding the report card. Mistakes are one thing, repeated mistakes that dont get corrected or happen too frequently are another".
- One-off mistakes and mistakes that keep happening should not weigh the same. A mistake made once and then fixed is learning. The same mistake pull after pull (never corrected), or very often in one night, is the real problem.
- Ideas: a "repeat" tag on Report card checks ("4 pulls in a row", "never fixed tonight"); weigh repeats more in the grade and one-offs less; show "fixed after pull 6" as a positive; compare with last raid ("still happening since last week").
- Owner: Report card (archived; unarchive it), sharing the week-to-week and trend logic Debriefing already has (Improving / Worsening tags, Since last pull).

## ✅ DONE (aa23b9f, waiting for the next launch): Resource tracking seems very inaccurate (Oct 26)
The user: "Resource tracking seems very innacurate".
- Rotation's Resources section (mana, Holy Power, Runic Power, Combo Points, Insanity, Astral Power, Fury, Maelstrom, Essence and so on): capping, wasted resource, spending and pooling checks.
- Check against the raw log: the advanced-log power fields (current/max and type per event) vs what the engine reads. Watch for the wrong power type for specs with two resources, the max changing with talents, regen not in the log, overcap counted on events that don't generate, and pets or secondary units mixed in.
- Verify each spec against a top player's kill (they should come out clean), and against the user's own Holy Paladin pull (Holy Power, mana).
- Owner: Rotation (local_bbb0619c).

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

## "Summarize this for me" button (Oct 26)
The user: "a one button press, 'Summarize this for me' with a pop up that breaks down all the information simply for them to understand".
- One button on a page (Debriefing, Rotation, Report card, Graphs…). It opens a pop-up that explains that page's information in a
  few plain lines, for someone who doesn't want to read the whole thing.
- Main chat's take (8/10): it fits the "tired raider after work" goal ([[effortless-setup]]) and the simple-first rules. Build it from
  the page's own facts (coachSummary already has one shared brain), not an AI call per press, so it's instant, free and always matches
  the page. Keep it 3–5 lines: what happened, the one thing to fix, what went well. Watch that it doesn't repeat the coach box word
  for word; the pop-up covers the WHOLE page (every section), and the coach box covers one pull.
- Owners when built: Debriefing (the shared summary brain), Design studio (the button and pop-up look), then each tab's owner.

## Plan: picture raid plans with the assignments on the map (Oct 26)
The user: "for plan, finding a way to make picture raid plans, showing the assignments when applicable. similar to how they would manually build it on raidstrats.gg"
- For each boss, a picture of the room per phase or mechanic, with the raid's real names (class colours, spec icons) placed where
  the plan puts them: soak groups, add/kick teams, tank spots, healer and cooldown spots. It's built from the Plan's NSRT note
  automatically, not dragged in by hand.
- Main chat's take (8.5/10): most pieces already exist. The Boss guides chat has room maps and mechanic positions for all 10 bosses;
  Plan has the note's jobs and groups and already makes a "Copy for Discord" picture. Joining them gives leads what raidstrats.gg
  makes them draw by hand, in one click. Watch for crowding (20 names on one map): label groups, not every dot, with names in
  a legend beside the map. Never link raidstrats.gg ([[raidstrats-library]]); it's only for picturing positions.
- Owners: Plan (assignments → spots), Boss guides (the maps), Design studio (the look). Start with one boss as a mockup
  (Coiled Altar Mythic: Dreadmarch stack spot, soak groups), then all 10.
- **Oct 26: paused, then back on the same day.** The user: "it actually looks good, lets continue with it"; "the whole boss arena…
  in each image"; "Make sure all the mechanics that are neccesary are accounted for".
  - The Coiled Altar Mythic mockup is built from the user's real note. It has a checklist of every mechanic and 10 pictures, with the
    raid's own marker spots read from their Oct 21 and 22 pulls.
  - It's on the practice link https://pictureplan-debrief.james-m-nemecek.workers.dev/?pictureplan only, not on main.
  - Everything is in notes/Picture plan mockup - Oct 26/.
  - **BUILT, version 1 (5433161, Oct 26, only the user sees it, not deployed).**
    - A 🖼 Pictures button sits next to every Copy for Discord in Plan. It shows one 1200×675 picture per mechanic, filled from the
      note, with Copy and Download.
    - Markers: the raid lead drags them and picks one per mechanic.
    - Coiled Altar Mythic only so far. Practice link: https://pictures-debrief.james-m-nemecek.workers.dev
  - Where it lives (the user, Oct 26): "So these wouldnt actually be for the boss strat page, just the plan page". It goes on
    Plan's Copy for Discord preview and fills itself from the Plan tab's jobs.
  - **OPEN TO EVERYONE (d13e632, Oct 26, the user: "push this live please"), live with the next build.** The pictures sit in
    Plan's Jobs cards (numbered ones beside their row); the markers start on the guide's spots, drag to move, right-click to
    change which mark; Copy all is the Design studio's one big sheet. Next: the other 9 bosses.

## Boss guides: your own roster on the maps (Oct 26)
The user: "Enhance the boss strategy page, to change the player icons to a selected roster, so the players can see in real time how
they would position for the fight."
- What changes:
  - A roster picker on the Boss guides page swaps the role tokens (Tank 1, Melee 3…) for your raid's real players: names in class
    colour, spec icons.
  - Every card map and the whole-fight video play with your raid in them.
  - Your own character gets the gold ring, so you can follow yourself through the fight.
- How each player gets a spot:
  - If the Plan tab has jobs for that boss (soakers, orb carriers, kick lines…), players take those spots.
  - Otherwise they fill by role: healers take healer spots, and so on.
  - Random targets (an axe target, mind controls, bombs) stay grey question marks.
- Not the same as the picture plan above. That one goes on the Plan page only, as pictures to post. This is the guide page
  itself, for players learning the fight.
- Boss guides' take (9/10): high value for little work.
  - The picture-plan mockup already does the hard part: player to spot by job or role, names and spec icons on the guide maps.
  - Rosters already exist (Plan's rosters and team import).
  - Recommendation: start from the roster Debrief already knows (Home's team or Plan's roster for tonight), with a "Use my raid"
    switch that remembers its setting.
- Owners: Boss guides (the maps and the seating), Plan (rosters and jobs), Design studio (the picker's look).

## Debrief's own parses: a number for performance and mechanics (Oct 27)
The user: "Now that i have server hosting/storage. Creating my own parse system with numbers. Based on performance, and mechanical
execution."
- What it is: every raider gets a Debrief score per pull and per boss (0 to 100, like a parse), ranked against other raiders of the
  same spec on the same boss and difficulty. Two halves:
  - **Performance:** damage or healing for the spec (what Warcraft Logs parses already measure), plus Debrief's Rotation score.
  - **Mechanics:** what no parse site scores: avoidable damage, soaks, kicks, dispels, defensives, deaths, each judged by the
    checks Debrief already runs.
- Why now: the R2 storage (each night kept once, for everyone) and the log library (787 top fights) mean Debrief can keep the
  numbers for every pull it reads and build its own comparison pool, instead of asking Warcraft Logs each time.
- Pieces that already exist: the mechanics checks and their fair rules, the strictness tables (Flexible / Medium / Strict from
  rank bands), the kill baselines (20 fastest kills per boss), the Rotation score.
- Main chat's take (8/10): the mechanics half is the part nobody else has, and the hard work is already done.
  - Start with **mechanics only**, on Mythic, scored against the saved top kills, before adding performance.
  - Risks: it has to be fair across specs and jobs (a soaker takes more damage than a ranged player who never soaks), and a
    public number gets compared, so every point must be explainable on the page.
  - Cost: scoring is cheap once a night is stored; filling the comparison pool means more Warcraft Logs downloads (one gatherer).
- Owners when it starts: Debriefing (the mechanics score), Rotation (the performance half), Design studio (how the number looks).

## Plan: start a new raid night fresh or as a copy (Oct 27)
- The user: clicking a new raid night in the nights strip should show two buttons right in that little section: **Open new** and **Copy from**.
  - **Open new**: a blank night, the way a new night starts today.
  - **Copy from**: lets you pick another night, and the new night starts with that night's roster, sits and plans.
- My take, 8/10: most weeks the raid is nearly the same, so copying last week is the fastest start; asking up front also stops a
  night from silently borrowing another night's plans. Keep both buttons small and inside the day's box, and pre-pick last
  week's same weekday in Copy from.
- Owners: Plan (the nights and the copy), Design studio (the look).

## Compare: your boss pulls against top guilds' pulls (Oct 31)
- The user: "in compare tab.. compare boss pulls against top guild boss pulls".
- What it would be: pick one of your pulls (or your best) and set it beside a top guild's kill of the same boss: the pace at each
  phase (boss health at the same times), deaths and when, how long each phase took, the raid's damage and healing over time, and
  the big mechanics side by side (soaks, kicks, add kills).
- My take, 8.5/10: the question every prog raid asks is "where are we losing time compared to a kill", and Compare already does
  this for two players; doing it for whole pulls answers it at a glance. The top kills are already read for the pace checks and
  baselines. Keep it to the few numbers that tell the story (pace, deaths, phase times) so it doesn't become another big table.
- Owners: Compare (the data), Design studio (the look).

## Addon: your casts and damage by ability against top logs (Nov 1)
- A raider's idea in the Discord (shave8297), passed on by Flex for the addon: "an option for like total cast comparison to top logs
  and damage percent by ability comparison". No rush ("no like rush order or anything required").
- What it would be, on the one recap card (in game and the PC pop-up): for your spec on that pull, how many times you pressed each
  button against the top players of your spec on the same boss (per minute, so pull length doesn't matter), and what share of your
  damage each ability did against theirs. One quiet list: the ability, your number, the top players' typical number, and a dot
  when you're well off (for example "Blade of Justice: 9 a minute, top 12").
- My take, 8/10: it's the question players already take to Warcraft Logs ("am I pressing the right buttons as often as the best
  players"), and Debrief already reads top kills per spec for the Rotation checks (SPEC_TOP), so the numbers exist. Keep it to
  the abilities that matter for the spec, folded under Rotation and open on tap, so the card stays calm. Damage share fits
  damage specs; for healers use healing share.
- Owners: the in-game addon chat (data into the card), Rotation (the top-player numbers), Design studio (the look).

## Debriefing: rotation mistakes and wins on each pull, against top players (Nov 2)
- Flex: "Incorporating rotational errors/improvments into debriefing tab somehow. It would need to be based on how top players
  utilize their cooldowns and rotations on that fight as a comparison, along with other rotational mistakes."
- What it would be, when one player is picked on Debriefing:
  - Each pull gets a short "Your play" list, at most 3 lines, worst first. The comparison is the top players of the same spec on
    the same boss (SPEC_TOP and the kill baselines):
    - were your big cooldowns lined up with the moments top players use theirs (the damage amps, the burn phase, the add sets)?
    - did you press the key buttons as often as they do?
    - idle time
    - the spec's own Rotation checks that matter on this fight
  - Each line is priced: damage lost, or seconds of fight time / boss health it cost, so it's clear what mattered.
  - One "✓" line when earned, then one "Next time".
- It's the raid twin of the Mythic+ "Your play" being built now (mplus-tab-design/your-play.md, Nov 2). Use the same shared rows
  function, so the Rotation tab and the addon card say the same thing.
- **Update, Flex: "or just putting that into the rotations tab for that specific fight". That's the plan.** It lives on the
  Rotation tab, for the fight that's open. Debriefing gets at most one link line on a pull ("Your play this pull · 2 to fix ▸",
  which opens Rotation on that pull), so Debriefing stays calm.
- My take: 9/10 in the Rotation tab (8.5 on Debriefing). Rotation is already where spec advice lives, fight by fight, and it has
  the top-player numbers (SPEC_TOP). One place to build and keep right, and no change to the paused Debriefing page.
- Owners: Rotation (the checks, the top-player numbers and the place), Design studio (the look). The Debriefing chat only adds the one link line.

- **Rotation timeline as a replay of your casts (Nov 3):** let the Rotation tab's timeline play the player's casting sequence
  the way Debriefing's Timeline replays a pull: a Play button (1x / 2x / 4x) moves a playhead across the cast strip, each
  press lights up with its icon as it happens, and gaps, late cooldowns and wrong presses show as they come, so you can watch
  your own rotation unfold instead of reading it.
  - My take: 7/10. Watching it play makes a slow opener or a capped resource easy to feel, and the replay's player, speed
    buttons and dragging line already exist to reuse. The static timeline already shows everything, so it's a nicer way to
    look rather than new information.
  - Owners when it starts: Rotation (the data and the checks), the Timeline replay chat (the player), Design studio (the look).

## Plan tab: big ideas after looking at Viserio / WowUtils (Nov 4)
- Flex: "My whole issue with wowutils/visero is what you said. It's hard to navigate. I want mine to be very easy". Their
  friction: raiders join a group and claim characters, "Update roster" by hand, re-run auto-fill after every change, many
  separate tools, the best automation behind a paywall. Ours must need no sign-up for raiders and keep itself up to date.
- Flex's answers on the five ideas:
  1. **Plan learns from your pulls** (job cards show how each person did that job last raid, the whole-plan button prefers
     people who did it cleanly): "lets discuss". My take 10/10; Viserio can't judge soaks, kicks or spots.
  2. **"My jobs tonight" for raiders**: yes. Flex: "I think the my assignments/jobs would fit well in the homepage". Mocked Nov 4 as a
     "Your jobs" panel under What's new (one tile a boss: your first job + "+N", Sitting, "Heal · no job"; tap = your pictures with
     only you on them). Other raiders' Home needs the team plan online (idea 3) first.
  3. **One team plan saved online** (officers edit the same plan, not a copy): yes.
  4. **Post the plan to Discord** (lineup + pictures, edits the post when the plan changes; always a button press): eventually.
  5. **Your own fight timings** (cooldown chart built from your pulls' phase times): "raid plans are usually used for the first
     kills, but they can be revised later throughout prog. We should probably plan this out". Needs a plan before building.
- Lower: sign-ups/absences in Discord that sit people (6/10), loot-aware bench (5/10).
- Owners when they start: Plan (data, sharing, raider view), Design studio (the look), the Discord bot chat (idea 4).

- Nov 7 (Flex): a Plan tab for personal NSRT notes, where each raider assigns anything they want for themselves, not for the raid (NSRT's personal note). Rated 8/10: every raider uses it, carries over to the next tier. BUILT Nov 7 (main 1be910a2 + cooldown rules); Flex: "will definitely need some work but its a decent start". Open: sync across devices (it's per browser), confirm NSRT reads the lines as a personal note, raid jobs as suggestions.

## PRIORITY, long-term project: Compare guild vs guild (Nov 8)
- Flex: "Compare guild vs guild long term project".
- Your guild side by side with another guild (a rival, or guilds around your world rank) across the tier: progress and pulls per
  boss, how fast each boss died, mechanics, deaths, raid damage and healing, pull by pull or night by night.
- Builds on Compare (your pulls vs top guilds), "Guilds like us" and the Warcraft Logs guild reports. Plan it before building.

- **Talent check for the fight** (Flex, Nov 15: "Talent tree audit, something that would check if members of the group/raid are running the appropriate talents for the fight. Would likely need to be more based off of logs than anything"). Read each pull's talents from the log (COMBATANT_INFO, which the site already turns into talent names for Rotation) and compare with what the top kills of the same spec take on the same boss. Flag only fight talents a raider is missing (movement, defensives, add or cleave picks top players take here), not every small difference. Main's take: 8/10.

## Defensives tile: what to compare with (Nov 1, parked)
Flex, looking at "32% behind · vs top players" while Guilds like us was picked: "what about this one?". Then he said "lets leave it
for now and re explore another time". Today the tile compares how often each raider presses each defensive per minute alive with the
top players of their spec (DEF_TOP, built in). The Guilds like us switch doesn't reach it.
- Options looked at (my ratings):
  1. **Score it like Healthstones (8/10, my pick):**
     - "None missed", or "20% missed · 3 of 15 who got low pressed nothing".
     - A press up to 8 s before a low counts as answering it, so pressing early is never marked down.
     - The top-player count stays in the hover.
  2. **Clearer tag (6/10):** "always vs top players".
  3. **Guilds like us (5/10):**
     - It flatters the raid without making it safer.
     - It needs another Warcraft Logs table for each saved kill and about a day of filling.
  4. **Against your own past nights (5/10):** shows progress, but sets no standard.
- **Flex's point:** defensives are often pressed **before** the hit.
  - Counting presses can't judge that.
  - A timing check would be shaky. Top players press 53% of their defensives near the raid's big damage moments, against 38% for random
    timing; we're at 49%.
  - Top players have a defensive up on only about 1 in 5 of their own biggest hits.
  - So "press before X" can only be soft advice, except planned jobs in the NSRT note.
  - Source: notes/Guides/Defensives and healthstones - how to judge them.md.

## Graphs: parse % on wipes (on hold, Nov 8)
- Flex: "skip it for now". Warcraft Logs gives no parses for wipe pulls, so it would be an estimate from the spec's kill rankings
  (about 4 ranking pages per spec, cached a day; needs /api/specrank to return the ranking count). Kills already show real parses.
- Build it only if raiders ask for wipe parses.

## Rotation tab: practice your rotation (Nov 15)
- Flex: "add to ideas in rotation tab: practice rotation module".
- A practice mode inside the Rotation tab. Your spec's main buttons sit on a hotbar like the practice game's (press to cast, cooldown sweeps, procs lighting up), against a target dummy. It scores you the way the Rotation checks already do: the opener, casts on cooldown, no capping, procs used, holding cooldowns for burst windows. No damage meter.
- Training wheels first, the same idea as the Ula'tek practice game: hints on, slow speed. Then a fight version that plays the boss's real timeline (movement, add sets, burst windows from the guide) so you practice the rotation for that fight.
- It reuses what exists: the practice game's hotbar and press-to-cast, the Rotation checks and their top-player numbers, the 12.1.5 talent data.
- Main's take: 7/10. Raiders would come back to it, and nothing else does this. But each spec needs its own buttons and priority, and they must match 12.1.5 exactly. Start with one spec (Holy Paladin) and only its 5 or 6 core buttons, then add specs one at a time.
- Owners when it starts: Rotation (the checks and spec data), the practice game chat (the hotbar), Design studio (the look).
