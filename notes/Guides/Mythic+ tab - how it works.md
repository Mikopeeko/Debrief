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

## Easier on the eyes (Nov 1, the Design studio's mplus-tidy, Flex: "ok so then do it")
Flex: "great, lots of awesome information but a bit hard to digest" and "i dont know what im looking at looking at the charts, maybe giving them some tooltips".
- **One headline sentence per section** (`mpSec(title, line, body, id, { fold, tip })`):
  - Timeline: "You fell furthest behind after Atroxus: 3:26."
  - Route: "You pulled 12 times; the fast run pulled 7."
  - Pulls: "You took 12 pulls, with 2 deaths." (or "and wiped on pull 9")
  - Kicks: the spell that went off most with a kick ready.
  - Players: who never pressed a big cooldown (else "Everyone pressed their big cooldowns."), then who was furthest behind their spec.
- **Open at the top, folded below:**
  - The banner, the top box, the tiles, the timeline and the route stay open.
  - Pulls, Kicks and Players are `details.mpt-fold`, showing the sentence and a Show pill.
  - The jump bar and a map dot open the folded section first. A section you opened stays open when the fast run arrives (`mpDraw`).
- **Four tiles:** Time (with the cushion), Behind a typical fast run, Casts that went off, and Lust (how many, and on which pulls). Deaths and standing moved to the top box and the stretch rows.
- **The split bar** in "Where your M:SS went":
  - It splits the gap into longer fighting, standing between pulls and deaths. Fighting is what's left, so the pieces add up.
  - Each piece has a hover, the key sits under the bar, and there are no words inside the bar.
  - A piece where you beat the fast run shows in the key only, in green.
- **Stretch rows:** one number per cell, the difference from the fast run (+1:46, +3 pulls, same). Both times are in the hover. A pull counts as 40 s when picking the worst cell to colour.
- **Quiet tags:** sentence case, a dot, no box. Red for deaths, wipes and "not killed"; yellow (#ffd166) for Lust; grey for the rest. Three at most, then "+N" with the rest in its hover. "4 of 5 big cooldowns".
- **Pull details:**
  - Each death reads "1:05 in: Hansso died to Insidious Aura (from Chitigoth). Used 1 defensive."
  - The cooldowns line is one sentence ("Everyone pressed a big cooldown." / "X didn't press one."), with who pressed what in its hover.
- **Hovers:** the site's own (`data-tt`, through `mpT1`), plus an ⓘ (`mpInfo`, the site's `.ds-i`) by the timeline, the split bar, the forces strips ("How much each pull added toward 100% enemy forces") and "On the map".
  - Every timeline piece has one: pulls, bosses, deaths, Lust (with its spell, `R.lust[].spell`), boss-down diamonds, the +3/+2/+1 marks and the fast run.
  - So do strip pieces, boss marks, the striped extra past 100%, and the fast run's map dots.
  - No native `title` hovers are left on the tab.
- Not this round: the "casts went off" counts on boss pulls (many boss casts can't be kicked). The studio is scoping it.

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

## The key page as tabs, and Mistakes (Nov 14, 2026)
Flex: "I think the mythic+ page needs a complete redesign/new layout", "its hard to read", "i was trying to use it to look at mistakes made throughout the key, like missed interupts and i genuinely couldnt find the information".
On his Voidscar Arena +19 the page said "Missed kicks 6" and nothing more: which spell, which pull and whose kick was ready sat in hovers on fourteen pull cards.

- **Tabs under the key's banner** (website only): Summary, Mistakes, Big hits (when the key has any), Route, Players, Rotation, Dungeon. One page each. The address keeps the tab (`&mpv=mis`, `hit`, `map`, `grp`, `rot`, `dun`; none is Summary).
  - `MPX_VIEWS` lists them; `mpxView(v)` switches (the tab, `html[data-mpv]`, the address). The styles hide every chapter but the tab's own.
  - Every chapter is still drawn on every draw, so nothing loads on a tab click. The map's labels are fitted when Route comes into view.
  - Anything that lights pulls on the map opens Route first ("map" on a time row, a pull chip on Mistakes).
- **Mistakes** (`mpxData`, `mpxHtml`): the whole key, by kind, in the key's order. Each row has the key's timer, the pull (a click shows it on the map), what happened and who.
  - Missed kicks: `p.through` without `cc`, grouped by spell, most first, with the same Next time line as before, then each cast with every player whose kick was ready.
  - Casts that needed a stop: `p.through` with `cc` (they can't be kicked).
  - Deaths: `p.deaths`, with what was ready (amber) or how many defensives were used; a click opens the hits before it, as the pull card does.
  - Debuffs left on: `mpDisp(R, F).list` rows marked `long`, with who had a dispel ready. They need the fast run, so they arrive when it does.
  - Avoidable hits: `p.avoid`. Big cooldowns not pressed: `mpCdMiss`.
  - A kind with nothing in it is named once on a "Clean" line. Medium-danger casts are a folded "Worth a kick, not counted".
  - Chips narrow it to one kind or one player. A missed kick belongs to everyone whose kick was ready.
- **Summary**: the five numbers, then a Mistakes box (`mpxDigest`: one line a kind, a click opens it) beside Where your time went, then Your part across the page. The Missed kicks number opens the list.
- **Players**: the Kicks column shows in brackets the must-kick casts that went off with that player's kick ready (`mpxKickCell`).
- **The Companion's card keeps its layout**: everything above is behind `MPC_ON` (`mpxKey`, `mpxChap`, `mpxDigest` return the old page for the card) and `html:not(.mpcard)` in the styles. Its class names are unchanged.
- **The map's pull card** (`mpxCard`, Flex the same day with a picture of it: "this section has a lot in it thats really confusing and unclear"): the numbers have names (Lasted, Enemies, Count, Group DPS); the tags became sentences under **What went wrong** (the Mistakes tab's facts for that pull, deaths first, or "Nothing went wrong in this pull") and **What else happened** (Lust, the wait before it, enemy buffs, debuffs); the folds are The enemies, Kicks, CC and dispels, Damage by player. "Most mistakes" is gone from the card.
- **Play by play** (`mpxFeed`, Flex: "maybe it should be a chat replay section"): on the pull card, the pull told in order, one line an event, by the pull's own clock: kicks with the cast they cut, CC with what it stopped, big cooldowns, defensives, dispels, what went off, deaths, close calls, big hits landing, Lust. It opens on Kicks and CC (Flex: "knowing who interupted, cast CC, stopped casts etc is very important. Moreso than someone using their big cooldowns"), with what went off in the same list; the other chips are Mistakes, Defensives, Cooldowns and Everything (14 lines until "Show all"). The enemies and Damage by player open by themselves; the kicks table is "by player". A picked player lights their own lines; nobody else is greyed out.
- Checks: the "Mythic+:" lines at the end of `tests/look-review.js`.

## Play by play, round 2, and Players with Rotation (Nov 14, 2026, evening)
Flex, with pictures of pull 8 of his +19 Kings' Rest of Sep 25: "If a cc cast stopped a cast it should be noted", "if a defensive was used during an aoe, or while they had a debuff, or were in danger etc etc it should be noted", "dispels should also be included here, and maybe even externals somewhere". And: "I think these two sections could be merged together probably" (Players and Rotation).

- **A CC that stopped casts** leads with "stopped", and names every cast (`p.stops`, the key reader's own: a CC takes an enemy's open cast within 4 s). A CC that stopped nothing stays "pressed". On that pull Incapacitating Roar and Storm Bolt stopped nothing: the reader has no stop for them.
- **A defensive** says what it was pressed into (`mpxDefWhy`): their health when under 70% (the lowest in the 3 s before), the big hit it was up for (`R.big`, the reader's list of what was up), a debuff on them (`R.dbf`), how much of their health they took in the next 6 s, and a death within 10 s. Facts only: nothing is called wasted.
- **New in the page's log pass** (`mpScan`): for each player and second, the damage taken (`R.ptk`) and the lowest health in percent (`R.phm`), with their full health (`R.pmx`). Health is read from a hit's own line when that line describes the player hit.
- **Externals** (`MPX_EXT`) are named "external". Whom one went on isn't in what the page keeps yet.
- **Dispels**: "dispelled X off Y, after N s". A debuff nobody took off has its own line: a mistake (red, under Mistakes) when they died with it on or a dispel sat ready, else a quiet note. The chip is "Kicks, CC and dispels".
- **A death** says which defensives were ready.
- **Players and Rotation are one tab**: the group table, then the picked player's rotation. A click on a player's row picks them (`mpxRowOn`). The tab's key is still `rot`; an old `&mpv=grp` link opens it.

## The key page as Raid review's sibling (Nov 14, 2026, night)

Flex: "i dont want it to be a mirror copy of the raid review tab but i want it to be a brother or sister of it in similarity", then "Im giving you creative freedom with this, with the plan for the future to turn the map in mythic+ into a replay map as well".

What a key shares with a raid pull now:
- The banner: the dungeon's art across the right, a small tag and the date, the name at the same size with the key level beside it, and the result as a pill.
- The tab row right under the banner. It stays at the top of the screen while you scroll.
- One bar under the tabs: the key (with arrows to step to the key before or after), the player whose part shows, and Find other keys. The key picker that sat above the banner lives here.
- Summary in the same order: the score panel (one sentence, the five numbers, "Fix first"), then "Your part…" (Raid review's "Your raid lead says…"): one sentence with the one fix, Your mistakes beside What you did well, the plain numbers under them, and a link to every mistake of yours on the Mistakes tab. Then "The key at a glance": your pulls over the fast run's; click a pull to open it on Route. Then Mistakes beside Where your time went.

What stays Mythic+'s own: the timer and the fast-run comparison, the Mistakes list, Big hits, Route (the map; the plan is to make it a replay that follows the group), Players and Dungeon.

How Your part sorts its rows: a row whose value is red or amber is a mistake, a green one is done well, and a plain number (damage, healing, kicks, dispels) goes in the row of numbers. Nothing was dropped. Each row still opens its pull.

The Companion's card keeps its own layout.

## The key page in Raid review's flow, with its own look (Nov 14, 2026, late)

This replaces the section above ("as Raid review's sibling"). That page copied Raid review's look. Flex: "I dont want it to look or resemble the raid review, but have a similar flow to it. Similar tabs and stuff like that. Summary tab, rotation tab, graphs tab, report card, compare", "i want mythic+ to have its own identity but follow a familiar flow to raid review", "full creative freedom ... it doesnt have to be those exact tabs either".

The tabs, in Raid review's order with the two only a key has slotted in:
- Summary: the five numbers, "Fix first", the key pull by pull (click a pull to open it on Route), then the group's mistakes beside the picked player's part.
- Route: the map and the pull cards, with Know this dungeon under it. The plan is to make the map a replay that follows the group.
- Mistakes: every missed kick, death, close call and debuff left on, in one list.
- Rotation: the picked player's rotation.
- Graphs: the raw numbers of the whole key as bars (damage, healing, damage taken, kicks, other stops, dispels, casts that went off, avoidable hits, deaths), then Big hits and defensives.
- Report card: the players table, then a card a player (yours first): their mistakes beside what they did well, then their plain numbers.
- Compare: where your time went against a typical fast run, stretch by stretch, then each player against top players of their spec.

What moved: Players is on Report card, Big hits is on Graphs, Dungeon is under the Route map. Old links to those still open. Players and Rotation are two tabs again (this replaces the earlier merge): the Player picker in the bar under the tabs is the one player Summary, Rotation and Report card show.

The look is the key page's own again: its banner, its panels, its blue under the open tab. From the earlier page only the flow pieces stayed: the tab row that stays at the top, and the bar with the key and the player.

The Companion's card keeps its own layout.

## Graphs, rebuilt (Nov 14, 2026, late)

Flex on the first Graphs tab (nine small bar lists): "the graphs tab 100% needs to be worked on...", then "Yes, build it".

One number at a time, as on Warcraft Logs:
- The choices on top: Damage, Healing, Damage taken, Kicks and stops, Dispels, Deaths, Defensives.
- The chart, "The key, pull by pull": a block is a pull, as wide as it lasted and as tall as the number in it (damage per second, healing per second, casts stopped and so on). Bosses are gold, trash is blue. The coloured part of each block is the player picked in the bar. A red mark on top is a death. Click a block to see only that pull; click it again for the whole key.
- Which pulls: Whole key, Bosses, Trash, or one pull.
- The meter: a player a row with their spec icon, the bar, then the amount, the amount per second and their share. Click a row to pick that player everywhere.
- Deaths lists each death with the hits before it and what was ready. Defensives shows Big hits (every big hit and what was pressed for it), unchanged.

Where the numbers come from: damage and healing are the reader's own numbers for each pull, the same ones the players table is built from, so the whole key's damage per second matches the table. Kicks, stops, dispels and deaths are the same lists the table counts. Damage taken is the page's own pass over the log. A CC cast counts for the pull it fell in.

## The Mistakes tab folds into Summary and Report card (Nov 14, 2026, night)

Flex, with a picture of the Mistakes tab's label: "im not seeing the value in this tab, how can we migrate the information into another tab?" For the passes that follow: "go through each tab one at a time and fix it up real nice", "full creative executive freedom in each tab. Just make sure it doesnt completely look like a different website, follow a similar flow and style as the rest of the site but let mythic + have its own flavor".

Six tabs now: Summary, Route, Rotation, Graphs, Report card, Compare. Nothing from the Mistakes tab was dropped:
- By kind: Summary's Mistakes box. Each line (Deaths, Close calls, Missed kicks and so on) opens to every one of them, with its pull and who could have stopped it. The Missed kicks number on top opens that line.
- By player: Report card. Each card has "Every mistake with their name on it, one by one", which opens the same rows for that player; the card goes full width while it is open.
- By place: Route, in each pull's card, as before.
An old link to the Mistakes tab opens Summary.

Summary is one column: the five numbers, "Fix first", the key pull by pull, the mistakes at full width, then the picked player's part.

A death the log has no hit for reads "died to a hit the log doesn't name" (it read "died to unknown", and its Next time line "Watch for unknown").
