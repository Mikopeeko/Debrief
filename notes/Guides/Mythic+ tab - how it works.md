# Mythic+ tab: how it works (Nov 1, 2026)

The website's Mythic+ tab reads a Mythic+ key from a Warcraft Logs report and shows it top to bottom, as in the Design studio's round 3 that Flex approved ("Looks good").
It covers steps 1 to 3 of the plan: the key top to bottom, where the time went against a fast run, and your route on the map (see Your route below).
Page text never names Warcraft Logs (Flex's rule, Oct 19).

## Where it shows
- Paste a Warcraft Logs report that has keys. A report of only keys opens on the Mythic+ tab, on the key in the link or else the newest.
- A raid report that also has keys opens the raid as usual, with a **Mythic+** tab at the end of the tabs. The raid's tabs take you back.
- With several keys in the report, a drop-down at the top picks one.
- Address: `?report=<code>&fight=<n>&tab=mplus`. Reload, Back and Forward work.
- **Keys from a log on your PC** (Nov 1, Flex: "yea do those two"): opened as a file, or followed through the Debrief app or a Logs folder.
  - The site's log reader keeps keys when asked (`createIndexer({ keys: true })`, `indexChunks(…, { keys: true })`, `liveIndexer({ keys: true })`); its dungeon bosses are still skipped.
  - The keys go to `S.index.keys` (`mpLocalKeys`), never the raid list.
  - A log with only keys opens on the Mythic+ tab, on the newest key. While following a log live, a newly finished key opens there when no raid pull is open.
  - A key's lines are read from the file by its bytes, exactly as a raid pull's are.
- **Shared nights carry keys:**
  - Share sends the night's keys with its raid pulls (`shrMine`).
  - The Mythic+ tab has its own Share line for a key from your PC, and the dialog says "Share your key".
  - The links: `?night=<id>` (the whole night), and `?night=<id>&pull=<n>&tab=mplus` (that key).
  - Opening one rebuilds the keys from the night's list (items with `kind: 'run'`).
- Tested on Flex's Voidscar Arena +19 of Oct 10 (`RaiderIOLogsArchive/WoWCombatLog-101026_174717.txt`, lines 589 to 329,674, about 100 MB): opened from the file, shared, and opened from the shared link on a practice copy.

## The pipeline
1. `src/wcl.js` `loadReport` lists each key as `runs` (the page keeps them as `S.index.keys`). Warcraft Logs keeps a whole key as one fight, with:
   - the level and the time on the key's timer (deaths included), and how many levels it went up (0 means over time)
   - its bosses, in `dungeonPulls`, in English
   - a key left early has no time
   - a minute or less is a key started and reset, so it's skipped
   `REPORT_Q` asks for `keystoneTime keystoneBonus keystoneAffixes dungeonPulls{encounterID name}`.
2. The key's events download like a raid pull's (`loadEvents`, saved on the PC and in R2). A 12-minute key is 16 pages (about 150,000 events); a 24-minute key loads in about 10 s.
3. `translateSteps` writes them the way WoW writes a key: `CHALLENGE_MODE_START`, each boss's `ENCOUNTER_START/END` (the events say `dungeonencounterstart/end`), and `CHALLENGE_MODE_END` with the time from Warcraft Logs. On a key only, a purge (`isBuff`) is written as a BUFF, so it counts as a purge.
4. The PC app's own reader, `companion/mplus.js` (`DBF_MPLUS`), reads it: the run, pulls, mobs, deaths, kicks, casts that went off, and the timer. The build puts that file in the site (`/*MPLUS*/` in shell.html), so a change there changes the site too.
5. `src/mptab.js` draws the tab. The build puts it inside ui.js (`/*MPTAB*/`).

## The fast run: a typical fast run (the Design studio's audit, Flex: "Yes, send them", Nov 1)
- `/api/mpfast?e=<dungeon>&l=<level>&v=2` (the Worker, kept a day): Warcraft Logs' speed rankings for that dungeon and level. Up to 5 requests.
- Warcraft Logs' bracket is the level less one: bracket 11 is +12 (checked on Voidscar Arena).
- It takes the 20 fastest and their middle (median) time. It returns those of them with a public log (13 of 20 for Voidscar Arena +12), each with who played what and their damage or healing a second (from the run's own rankings, 5 runs a request).
- The page reads the public run closest to that middle time (never your own key) with the same reader, so both sides are counted the same way. Everything uses that one run: the tiles, the timeline, the stretches, the route lines, the strips and the maps.
- It's labelled "a typical fast run". If fewer than 20 exist, the line says how many.
- For Voidscar Arena +12 the middle of the 20 fastest is 12:50, about a minute slower than the very fastest (11:56): the top 20 are all very fast.
- Until it's in, the tiles say "finding a fast run" and the fast lane waits. With none, the tab shows without it. It never makes up numbers.
- Players: each player's DPS or HPS (the studio, Nov 1: "DPS" and "HPS" like Debriefing's tiles, never "damage a second") against the middle player of the same spec in those runs (spec and class must match). With none of that spec: "no X in the fast runs".
- Warcraft Logs encounter IDs for Midnight Season 2 (zone 55): Altar of Fangs 12993, Den of Nalorakk 12825, Kings' Rest 61762, Murder Row 12813, Ruby Life Pools 112521, Temple of Sethraliss 61877, The Blinding Vale 12859, Voidscar Arena 12923.

## How it decides
- **The timer:** each death's penalty is measured, not assumed: what the deaths cost on the timer divided by the deaths (15 s at +12). The timeline puts each death where it happened. The countdown is the gap between the log's end and the official time.
- **What gets you +N:** the next level is +2 at 80% of the timer and +3 at 60%. Over time, it's "What gets you in time". The seconds needed are as the timer shows them (24:06 against 24:00 is 6 s). The fixes are ranked by seconds:
  1. A **wipe** is the whole group dead within 45 s. Its deaths, plus the run back. It names who died first, their role and whether they used a defensive.
  2. **Kick X**: a must-kick cast that went off with a kick ready, and deaths to that same spell from the same enemy in a pull where it went off.
  3. **N deaths to X**: two or more deaths to one cause.
  Then come must-kick casts that went off without killing anyone ("fewer casts"), and last the other deaths as one line. Three are shown.
- **The verdict:**
  - "Either of the first two would have done it" and the like when they're enough.
  - "Even with no deaths, you'd be N seconds short. The rest is pace" when even no deaths isn't enough.
- **Stretches:** from the start to each boss **kill** (a boss you wiped on or reset belongs to the stretch). In each row, only the worst difference against the fast run is coloured, and only when it's over 20 s.
- **Pulls:** the reader's own pulls. Tags:
  - Wipe or N deaths
  - Not killed, for a boss that wasn't killed
  - N casts went off
  - an enemy buff from the dungeon's list with its count, e.g. Bolster ×6, from the log and never explained
  A pull with something in it opens.

## Your route (step 3, Nov 1)
It comes after Where you fell behind. Flex's picks: "Yes, the map dots", and enemy counts from Raider.IO with its credit link.
- **The four lines:**
  - "You reached X% after pull N. Pull M added Y% when you needed Z%."
  - the stretch where your pulls differ most from the fast run's ("Between A and B you got X% in N pulls. The fast run got Y% in M pulls.")
  - the extra past 100% for both runs
  - each run's biggest pull
  Facts only, never advice.
- **Two strips:** you and the fast run. Each pull is a piece as wide as what it counted, with its number inside. Bosses get a gold mark, and anything past 100% is striped red.
- **On the map:**
  - one small picture per floor, in the game's floor order
  - your pulls numbered on a dashed path, gold for bosses and a red ring for a wipe
  - the fast run as small grey dots and a faint path
- **Pull by pull, side by side,** with what each pull counted and the running total.
- **Credit:** "Enemy counts: Raider.IO", with a link (Flex's okay, Nov 1: Raider.IO's rule).

How it's worked out (`mpRouteOf` in `src/mptab.js`, from the key's own events):
- **Enemy counts:** each enemy that died counts once, in the pull it died in or after. The values come from `MP_ROUTE[dungeon].n` (NPC ID: count), built from Raider.IO's run details of each dungeon's top runs and Flex's 13 runs (Nov 1).
- **Checked:** Flex's Voidscar Arena +12 adds up to 803, the same as Raider.IO's own list for that run (108.8%). The Design studio's 761 came from the mobs listed in each pull.
- **Ruby Life Pools:** Raider.IO lists several of its enemies as 0. A finished key there comes out at 78%, so whenever a finished key adds up under 99%, the counts are left out with a plain note. The map and the table still show.
- **Where each pull happened:** the middle (median) of the enemies' positions during the pull, on the floor most of them stood on. Warcraft Logs' x and y become WoW's north and west, and `mapID` is the floor's uiMapID.
- **Floors:** corners from wago.tools `UiMapAssignment` (12.1.5.70688). Across = (maxY − y) / (maxY − minY), down = (maxX − x) / (maxX − minX).
- **Pictures:** Wowhead's `wow.zamimg.com/images/wow/maps/enus/original/<zone>[-N].jpg`, loaded at runtime and never bundled. N is the game's floor order (`UiMapGroupMember.FloorIndex`). That matches the Design studio's hand check of Voidscar Arena, and all 18 pictures exist.
- **Checked on the maps:** Voidscar Arena (3 floors), The Blinding Vale (1) and Ruby Life Pools (2). The dots sit on the walkways.
- **Small maps** (the Design studio's audit): each map is at most 400 px wide and grows to twice its size on click (one at a time), and back. A one-floor dungeon's map sits beside the lines and strips.
- **Dots closer than a dot's width** are nudged apart (worked out at the small map's size). The path still runs through the real spots, and a thin white line joins a nudged dot to its spot.
- **Boss names on the strips never touch** (`mpLabelFit`, measured on the page and again on resize). Each name goes in the first place it fits:
  1. close to the strip
  2. one row further out
  3. its short name (first word)
  4. otherwise only the gold mark, with the name on hover
  On a phone with four bosses close together, one name can end up as a mark only.
- **Not yet:** grey dots for packs nobody pulled. That needs Mythic Dungeon Tools' pack layout and its author's okay.

## Round 4 layout (Nov 1, the Design studio's mplus-tab4, Flex: "Yes, build both")
- **Order:** the banner, a jump bar (Timeline · Route · Pulls · Kicks · Players), What gets you +N, the tiles, Where you fell behind, Your route, Pulls, Casts and kicks, Players.
  - The jump bar sticks under the site's own sticky tab bar (`--mpt-jbt` is the tab bar's height).
  - Sections have a scroll margin, so headings aren't hidden under the jump bar.
- **One Pulls list** replaces Pull by pull, the route's side-by-side table and Deaths (deaths live in their pulls).
  - It's grouped by stretch, up to each boss kill. Each header reads "Atroxus → Charonus · 11:45 · fast run 8:19 · 3:26 slower".
  - Each row shows: what was pulled (enemies something summoned aren't counted, from SPELL_SUMMON), the time, what it counted (+11.5%, with the total in small grey), and tags (Lust, Wipe or N deaths, casts that went off, Bolster ×N, Big cooldowns N of M).
  - A row opens for its deaths in order, what went off with a kick ready, Lust and big cooldowns.
  - "Fast run here" sits to the right of each stretch, or under it on a phone.
- **Maps you can use:**
  - Each dot (`data-n`) has a card on hover, or on the first tap on a phone (`MP.pinfo`). The card shows the pull, its times on the timer, what it counted, what was in it, its tags and the first 3 deaths. It stays on screen and hides on scroll.
  - A click opens that pull's row (`#mpt-pull-N`), scrolls to it and flashes it.
  - Hovering a row lights up its dot. A click anywhere else on the map still makes it bigger.
- Lust is the studio's yellow (#ffd166) everywhere: the timeline mark, the key and the tags.

## Hard keys (Nov 1, the Design studio's pass on Flex's +19, Flex: "Yes, send them")
- **Where your M:SS went.** When the seconds needed for the next level are more than all the deaths cost, and the typical fast run is in and over a minute faster, the top box becomes "Where your 5:28 went" (the gap to the typical fast run).
  - The items, by seconds, are each stretch's trash, each boss fight, the standing between pulls, and the death and kick fixes.
  - Only gaps of 15 s or more are listed. They add up to the gap: a stretch's time splits into trash, boss, standing and deaths.
  - "What gets you +N" stays when the next level is reachable (the +12's 6 seconds).
- **Trash and Boss apart** in the stretch rows (`mpStretches`: `trash`, `bossT`, `tries`, `nt`). Only the worst number in a row is coloured.
- **The cushion in the banner:** "Timed +1 · 59 s to spare" (the time under the limit you beat), amber under 90 s and green otherwise; "1:12 over" in red.
- **Big cooldowns tag** only when someone didn't press theirs.

## Lust and big cooldowns (Nov 1)
No new section (the Design studio's call): they go where they belong. One pass over the key's lines (`mpScan`) finds them, with the route, for a report, a log and a shared night alike.
- **Lust:** a Bloodlust-type buff landing on the group: Bloodlust, Heroism, Time Warp, Primal Rage, Fury of the Aspects, Harrier's Cry, or any drums.
  - Checked in the log itself: Flex's +19 has Time Warp (ID 80353) 3 times, with Temporal Displacement after.
  - A second landing within 20 s is the same Lust. A Lust just before a pull counts for that pull.
- **Big cooldowns:** each player's casts of their spec's big cooldowns.
  - The list is the Rotation tab's own (`GEN_SPECS[spec].cds`), cooldowns of a minute or more only.
  - Healers also get the engine's healing cooldowns (`CD_NAMES`, less Lust and movement).
  - One that player pressed more often than once every 50 s in that key is dropped: Flex's +19 Arms Warrior pressed Bladestorm (ID 446035) every 20 to 40 s.
  - A press written twice within 5 s counts once.
- **Where they show:**
  - a pink Lust mark on your lane in Where you fell behind
  - "Lust" and "Big cooldowns N of M" tags on each pull row, with who pressed what in the pull's details
  - in Players, "N big cooldowns, K on the 3 biggest pulls" (biggest by what they counted, else by damage taken), with the hover listing each cooldown's pulls
- **One line in What gets you +N:** "Lust on your biggest pulls", only when it's clear: no Lust went on a boss or on either of your two biggest trash pulls. No seconds, since the log can't measure them.

## Rules Flex set
- Dungeon facts from 12.1 to 12.1.5 only. Timers and lists live in `companion/mplus.js`.
- No made-up tactics: the fixes are what the log shows (wipes, kicks from the must-kick lists, deaths).
- Healers have no kick in Midnight, except Restoration Shamans (said under "Who stopped casts").
- Plain, short sentences. It works on desktop and phone (stacked rows, labels on the stretch numbers).

## Tests that worked
- Offline: `scratchpad/mpx/readkey.js` (a saved key → translator → `DBF_MPLUS`). Also `harness.js`, which draws the tab's HTML in node from saved keys, for every sample in the mplus-preview notes.
- Practice links (`versions upload --preview-alias mptN`):
  - Flex's report `L7fRqbmPr2WdhaTG`: fight 1 is the Voidscar Arena +12 from the design, fight 20 is over time, fights 18 and 19 were left early.
  - `4GdvhM71B8zrCJjH` is a raid night with 2 keys (the tab beside the raid).
