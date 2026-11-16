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

## Graphs, as Raid review's Graphs (Nov 14, 2026, night)

This replaces "Graphs, rebuilt" above (the chart of pull blocks). Flex: "I think i want the graphs tab to be almost exactly like the other graphs tab in appearance and functionality".

It is Raid review's Graphs tab, fed a key:
- The rail on the left: Damage done, Damage taken, Healing, Deaths, Interrupts, Dispels, Defensives.
- The chart: damage, damage taken or healing per second across the key, a layer a player (one player alone when one is picked). Bosses are faint bands with their names; Bloodlust and deaths are marked. Pulls: Whole key, Bosses, Trash; one pull zooms the chart to it.
- The table: By player (total, per second, share, and "vs spec" against top players of the spec for the whole key's damage), By ability, By pull. A player's row opens to their damage by spell and shows their layer alone on the chart; an ability opens to who did it; a pull's row picks that pull.
- Interrupts and Dispels open to what was kicked or taken off. Deaths lists each death with the hits before it. Defensives shows Big hits.

What a key does not have, and is left out instead of faked: buffs, debuffs, resources, casts, item level, active time, and a hover on the chart. Healing is not kept per second, so its chart is flat across each pull; a spell's casts and crits are not kept, so those columns show a dash.

Where the numbers come from: damage and healing are the reader's own numbers for each pull, the ones the players table is built from. Damage taken, the chart's damage and a spell's damage are the page's own pass over the log.

## Graphs: the breakdowns and Defensives (Nov 14, 2026, night)

Flex on the first raid-style Graphs: "graphs is missing a lot of breakdowns. Theres no healing breakdowns, damage taken breakdowns. Looks unfinished. Whats going on with the defensives section of graphs?"

- Damage taken: a player's row opens to "Damage taken by source" (each ability that hit them: its share, hits, average hit and biggest hit). By ability lists every ability that hit the group and opens to who took it.
- Healing: a player's row opens to "Healing by spell" (share, hits, average hit, overheal). By ability lists every healing spell and opens to who cast it. By target is who received the healing. The last column of By player is that player's overheal. The chart is by the second now.
- Defensives: a table of its own. Pressed (how many defensives), Kinds (how many different ones), Covered (the big hits they took with a defensive up, of all the big hits they took), Close (a big hit that left them under 15% with none up) and Deaths. A row opens to the defensives they pressed. Every big hit, cast by cast, is the Big hits list under it, unchanged.

Where the numbers come from: the page's own pass over the log now also keeps, for each pull, what hit each player, each player's healing by spell with its overheal, and who received it. Healing is counted the way the reader counts it (the heal less its overheal, a pet's healing to its owner, onto players), so a player's spells add up to about their healing in the table; healing between pulls is in the chart but not in a pull's breakdown.

Still not read from a key's log, and so not shown: casts and crits for a spell, buffs, debuffs, resources.

## Graphs: the whole rail, and Big hits on Summary (Nov 14, 2026, night)

Flex, with a picture of Raid review's rail: "missing a lot of categories", "also why no buffs/debuff section?". And with a picture of the Big hits list under Graphs: "I think this is good but probably better in summary or somewhere else".

The rail now has Raid review's numbers in its order: Damage done, Damage taken, Healing, Buffs, Debuffs, Deaths, Interrupts, Dispels, Resources, Casts, Survival.
- Buffs: By player (how many buffs, their average uptime; a row opens to each buff with its uptime and how often it went on) and By buff (who had it).
- Debuffs: what the dungeon put on the group: how many times, on how many players, for how long in all; a row opens to who.
- Resources: "Mana left" for mana users (average, lowest, time under 20%, with a chart, a line a player), and for each other resource what a player gained and how much spilled over the cap.
- Casts: casts per minute By player (a row opens to each spell) and By spell (who cast it), with a chart of casts per minute.
- Survival: Defensives (as before), Healthstones, potions & self-heals, Combat potions (who used one, and when), and Health over the key (the lowest each player got, with a chart).

Big hits (every big hit, cast by cast) left Graphs. It is on Summary, under Mistakes, as a part you open; "See every big hit", the Close calls tile and old links open it there.

Where the new numbers come from: the page's own pass over the log now keeps every buff on a player and every debuff no player put on them (as times on and off), the mana a caster's own casts say they had, and the healing a player did to themself. Uptime is the share of the fighting in the pulls picked.

Not the same as Raid review's: no "click to chart" for one buff or spell, no stacks, no "how much a defensive took off", and mana is only known at the moments its owner cast something.

## Report card: like Raid review's (Nov 14, 2026, night)

Flex: "I think the report card tab should also function and look the same as its counterpart in raid".

A key's Report card is Raid review's Report card page, fed a key:
- The banner: the dungeon and level, how it ended, five numbers (pulls, deaths, combat potions drunk, mistakes, players graded) and the group's grade as a ring.
- "The key, in short": how it ended, what the deaths cost, the group's best and weakest part, and "Next key:" the one thing that cost the group the most points.
- The group's report card: Performance, Mechanics, Staying alive and Ready for the key, each averaged over the five players, with the best of the key.
- Ranked group: the five players by grade. Click a column to rank by it, a role to narrow it, a player for their checklist under their row (click again to close it). The player picked in the bar is the row picked.
- The checklist: Fix first (the row that cost the most points), a box a part, then every row with its goal and what happened. A row with mistakes opens to its pulls; a pull shows on the Route map.

The grade is Raid review's own formula: Performance 40%, Mechanics 30%, Staying alive 20%, Ready 10%. A row with a % counts that %; Mechanics rows count as passed, half or missed. Inside Performance, Damage is half, Rotation 30%, the rest 20%. A part with nothing graded gives its share to the others.

What each part reads (all of it is on the key's other tabs too):
- Ready for the key: flask, food, weapon oil, enchants, gems and item level as the key started (the gear and buffs the log wrote at the start). A log with no such line has no Ready part.
- Mechanics: must-kick casts that went off with the player's kick ready, debuffs left on with their dispel ready, and avoidable hits by spell. Stops and CC are shown, not graded.
- Staying alive: deaths (each takes time off the timer) and close calls (a big hit that left them under 15% with no defensive up). A defensive ready at a death and Healthstones or health potions pressed are shown, not graded.
- Performance: the damage parse (with no parse, damage against the middle player of the spec in the fastest runs), Rotation (the Rotation tab's score), big cooldowns (one in every pull of 45 seconds or more) and combat potions (one each time it is ready). A healer's healing is shown, not graded.

Every column of the players table is a row in each checklist, with the table's own number (Flex, with a picture of that table: "can each of these be put in the individuals report card?"): damage and damage against the spec, kicks, stops, CC, dispels, deaths, defensives pressed, avoidable hits and big cooldowns. The ones a key cannot judge fairly (stops, CC, defensives pressed, against the spec when there is a parse) are shown, not graded.

Not the same as Raid review's: no externals (not read in a key), no "Gear and stats" pop-up, and every death counts (a key has no wipe call). The players table (damage, kicks, dispels and so on) is still on the tab, under the ranked group.

## Report card: a key's own grade, and the players table folded in (Nov 14, 2026, late night)

This replaces what the section above says about the weights, the ungraded rows and the players table.

**The weights are a key's own** (Main's ruling, from "Mythic+ - how it works (the whole picture)", section 4): Mechanics 40%, Staying alive 30%, Performance 20%, Ready 10%. Raid review keeps its own (Performance 40, Mechanics 30, Staying alive 20, Ready 10). Why: in a key, not dying is 10 of 10, stopping the dangerous casts 9, defensives on the big hits 9; your place on the meter is 4 and parse colours 2. Flex can overrule the numbers.

**Three things are graded a key's own way** (Flex: "I think some of the ungraded parts of report card could be graded, things like defensives, healthstone healthpot usage combat potion usage. You might need to make new formulas specific for mythic+ regarding those though"). Each counts only the moments it mattered and could be done:
- Defensives on big hits (Staying alive): missed when a big hit left the player under 15% or dead while a defensive sat ready. Its % is the big hits met with a defensive up, out of those and the missed ones. A hit with nothing ready is not counted. Close calls are still listed, as information.
- Healthstone or health potion (Staying alive): the moments are the big hits that left the player under 15% and the deaths that took a moment. A moment counts when a Healthstone or a health potion was off cooldown (5 minutes since the last one; a Healthstone only with a Warlock in the group or one pressed in the key). Its % is the moments where one was pressed within 8 seconds.
- Combat potion (Performance): a chance is a boss or a long pull (45 seconds or more) starting with the 5-minute cooldown back. The walking between pulls is not a chance. The row lists what was drunk, by name with how often (Flex: "this should also list which combat potions they used"). Potions are sorted by the site's one potion list, never by the word "potion" in their name (Light's Potential has none).
Inside Staying alive the rows weigh by the same research: Deaths half, Defensives on big hits 35%, a Healthstone or health potion 15% (not dying is 10 of 10, defensives 9, Healthstones 5: one Healthstone not pressed must not cost what a death costs).

**Healer damage** (Flex: "i definetely think healer dps should be rewarded and evaluated/graded"): a healer's Damage row is graded like anyone's (half of Performance). When their damage is what timed the key, "Damage and the timer" is a bonus check: it lifts the grade, and never counts against them.

**The players table is off the tab; its facts are in the Report card** (Flex, with pictures of it: "Maybe you can integrate some of the remaining information into the report card tab somehow?", and of its DPS and vs spec columns: "i think this is valuable information"):
- Ranked group has two more columns, DPS (in its parse colour) and vs spec. Click either to rank by it. Under the five players is the group's own row: its grade, its parts, its damage while fighting and how far that is from a fast run.
- The group's report card has, under its four tiles, the table's three callouts (what went off with a kick ready, who never pressed a big cooldown, who was furthest behind their spec), the group's damage (all, trash and bosses against a fast run), the group's totals (kicks, stops, CC, dispels, defensives, avoidable hits, big cooldowns) and the low-danger casts.
- Each player's own numbers were already rows of their checklist.
The Companion app's card keeps the table as it was.

## Route: the replay (Nov 14, 2026, first version)

Flex: "Lets start by making a replay version of the map", "I still want the route to be shown, but i want the replay to follow the group", "Get creative with it", and of the pull's panel beside the map: "that includes getting creative with this part too".

"Replay the key" on the Route map's bar plays the key back on the map:
- The route stays drawn (each pull's outline and number, the route line). The pull being fought lights up, and the ones done fade.
- The five players move where the log put them, second by second, each a ring in their class colour round their spec's icon. A gold line shows the way walked so far. The camera follows the middle of the group, and changes floor with it.
- A pull's enemies are red dots (a boss is gold) where the log saw them, until they die. Between pulls the next pack shows faintly ahead.
- What happened pops up at its spot and its moment: a kick (✓), a cast that went off (!), a death (☠), an avoidable hit. Lust and deaths also show a line across the bottom of the map.
- The panel beside the map follows the same clock: each player's health (read at each hit) and their damage in the pull as it grows, with a big cooldown named while it runs; the pull's enemies by name and how many are left; and the pull's events as they happen, newest first.
- The clock is the key's own timer. Play or pause (Space too), jump a pull back or forward, 1×, 4×, 10× or 30×, and "Skip the walking" (on from the start: between pulls it runs fast). The strip under the map is the whole key, a block a pull, with a red tick a death and a gold one a Lust; click or drag it to move the clock.

What it reads: the page's own pass over the log now keeps where each player and each enemy was, a spot a second (from the position each log line carries). Everything else was already kept for the map and the pull cards.

Not in this first version: the fast run moving beside the group, a player to follow, dispels and defensives on the map itself (they are in the list), and enemy health.

## Route: the Route score (Nov 14, 2026)

Flex: "I also think there should be a score for the route somehow", "Like route efficiency, timing the key, how much time remained... etc things like that. Tricky to make". He agreed to five parts ("Yes, build it"). The numbers are his to tune.

At the top of the Route tab: a ring with the score out of 100, and its five parts, each with its points, what happened and one sentence.
- Timer, 35: a timed key is 24, and the time left earns the rest (40% of the timer left, which is a +3, earns all 35). Over time loses the 24 a little at a time, and all of it at 25% over.
- Pace between pulls, 25: the time not fighting, against the fast run's. The same or less is 25; twice as long is 0. With no fast run it is judged by its share of the key (12% or less is 25, 32% is 0).
- Pull plan, 20: the trash pulls taken, against the fast run's. Each pull more costs 3.
- Count, 10: finishing at 100% and not far over. Up to 2% over is free; each 1% more costs 1.
- Lust, 10: each Lust on a boss or one of the three biggest pulls, out of the Lusts the key's length allows (one every 10 minutes, 3 at most).
A part that can't be judged is left out and the rest is scaled to 100: a key left early has no timer, pace or count; with no fast run there is no pull plan.

Why these weights: the Mythic+ research ranks route and pull plan 9.5 of 10, pace between pulls 8.5, Lust on the right moments 7.5, and finishing at 100% count 7.

## Route: the tab, redesigned (Nov 14, 2026)

Flex: "we need to look at the route tab next, and find a better design for it", then "Redesign the tab".

The map is the star of the tab and was a screen down the page. Now, top to bottom:
- The Route score as a slim band: the ring, and a tile a part (Timer, Pace between pulls, Pull plan, Count, Lust) with its points and what happened. A part's sentence is on its tile's hover, and all five are under "Why these points".
- One bar: your route or the fast run's, the pull stepper, and "Replay the key". The bar's own Player picker is hidden: the page's bar has it, and the two were always one pick.
- The map with the timeline strip (You and Fast run, pull by pull) under it, in one column that stays in view while the pull's card beside it scrolls.
The sentence "You took N more pulls than the fast run" is hidden when the score's Pull plan says the same; the line of route facts under the score stays.

## Route: the replay, round 2 (Nov 14, 2026)

Flex: "I think putting the health bars like raid frames on the map would be better", then "Same for enemy health bars".
- The group's health is on the map as raid frames, bottom left: a bar a player in their class colour, their name and their health, red-edged under 35%, grey with "Dead" while dead. The panel beside the map keeps the damage in the pull and the cooldown running.
- Each enemy has a small health bar over it, like a nameplate. A boss also gets a frame at the top right of the map with its name and health.
- Health is the log's own reading: each line names the health of the unit it describes, and the replay keeps the last reading of each second.
- Enemies are drawn above the players. In melee the pack stands where the group stands, and it was hidden under the player icons (found on Flex's Den of Nalorakk +20, Pull 8).

## Route: the replay, round 3 (Nov 14, 2026)

Flex: "the default speed on the replay should be x1 not x10", "it would be cool if you could put what they are targeting", "This should be organized by DPS done at that time, would be even better if you could put dps meters on the map so people can watch the dps in real time", "Would be nice if mob health bars also had cast bars, and it showed who/when someone interupted".
- Speeds are 1x, 2x and 4x, and the replay starts at 1x. "Skip the walking" still runs fast between pulls.
- Each raid frame's second line is who the player last hit or cast on (in the last 3 seconds); a friendly target (a healer's heal) is in green.
- A damage meter sits at the bottom right of the map: the pull's damage per second so far, the most first, moving as the pull goes. The panel's list beside the map is in the same order.
- Each enemy has a cast bar under its health bar, with the spell's name over it, filling as it casts. Grey: it can't be kicked (never kicked in the key and not on the must-kick list). Green "Kicked · name" for a moment when someone kicked it. Red when a must-kick cast went off.
- The camera is a little closer (130 yards across), and the health bars, cast bars and names over the enemies keep the same size on screen.
What it reads: the page's pass now keeps each enemy's casts (when each started, and whether it went off, was kicked and by whom, or was stopped) and who each player hit or cast on, a second at a time. A cast's length comes from its own end, or from how long that spell usually takes in the key.

## Summary: the clean-up pass (Nov 14, 2026)

Flex: "maybe start another chat to work on the summary tab. Clean it up make it better". The order did not change: the numbers, the one thing to fix, the key pull by pull, the mistakes, your part, Big hits.

- **The tiles are two groups.** The clock: Result (with the next level as its second line, "5:01 faster gets +2"), Against a fast run, Group DPS. The mistakes, in the Mistakes box's order: Deaths, Close calls, Missed kicks. Each mistake tile opens its list. Next level had a tile of its own; it was folded into Result so Close calls could have one (the research ranks defensives on the big hits 9 of 10 and chasing +2 on a push key 3 of 10). Each count is the Mistakes box's own, so a tile and the list it opens agree: Missed kicks no longer counts the casts that can't be kicked.
- **Fix first is a box of its own** (a gold outline, no bar down its left edge): the title, its Next time line (the one Compare's first row has; a fix with none says its plain facts), "Also in these pulls" (the mistakes of each kind that happened in the fix's pulls, each a link to its list), "Show on the map" and "Where your 5:35 went", and at the right what it cost: "1:30 of your 5:35 behind", "0:26 back on the timer" or "7 casts went off". While the fast run is still loading and could still change the pick, the box holds its place.
- **The key, pull by pull has a row a kind of mistake over the You lane**, named as the Mistakes box names it, each mark where it happened. Marks of one kind in one pull are one mark with their count. A close call, a cast that needed a stop and a cooldown not pressed are hollow (two kinds share red, two share purple, and a solid blue mark would read as a small pull). A hover says who and what; a click on a mark or on the row's name opens that kind's list. The pulls Fix first is about get a bracket and a faint column through the rows and both lanes. On a phone the rows use short names (Kicks, Stops, Debuffs, Cooldowns, Avoidable) in the strip's own narrow column. The lanes are still mpBehind's, the same as under the Route map: the rows go into Summary's copy only. `MPX_STRIP_ON = false` in src/mptab.js takes the rows off again.
- **The Mistakes box says where.** Deaths: each name with its pull (up to three deaths; more are names, then the pulls). Close calls: the cast that caused them, how many it left low and in which pull ("Shadow Whirlwind left 4 players at 3% to 11% in pull 1"). A click from a tile or a mark scrolls only as far as it must.
- **Your part** is its heading, its Next time line and the report card link at the left, and its tiles at the right on an even four-column grid, one size for every player.
- Nothing on the tab is under 12px now (the tiles' labels were 11px), and a Mistakes line no longer has a dark band behind its words (a stray drop shadow).

Not built, noted for later: the closest call as one sentence at the top; a key left early still shows "DPS vs top" and "Your rotation" tiles in Your part after one pull; the tiles' colours on a timed key (Timed +1 is amber in the tile and green in the banner).

Checks: tests/mplus-summary-strip.js runs Summary's own code on made-up keys; tests/look-review.js has a block of lines for this pass.

Raid frames, one line each (Nov 14; Flex: "could we make these not as tall somehow?"): the name, then the target in lighter type on the same line, the health on the right. On a phone the target is left off.

The panel beside the replay (Nov 14; Flex: "instead of having two dps meters, what if this was replaced with mob health bars/cast bars", and of As it happens: "this should also have mob casts especially if they get stopped/interupted/missed"):
- Enemies: the enemies in the fight, a health bar and a cast bar each (the ones casting first, then the bosses, then the lowest; 8 at most, then "+ N more"), with the count by name under them. The damage list that was there is the meter on the map; a running big cooldown now shows on the meter's row.
- As it happens also lists a kickable cast that went off ("went off", with the enemy) and a cast a stun, knock or grip stopped ("stopped by" the player, with the spell). Kicks and the must-kick casts that went off were there already.

## The Rotation tab is judged as a key (Nov 14)

Flex: "Yes, build it". A key pull has its own rules for the Rotation rows, a healer gets a damage-or-heal check, big cooldowns are judged over the whole key (a hold for Lust is never marked), and the score is 70% the pulls and 30% the key's own check. The rules, the numbers they were set from and what is still open: `notes/Guides/Mythic+ Rotation - how a key is judged.md`. The check: `tests/mplus-rotation-keys.js`.

## Summary: option A2, the story (Nov 14, 2026)

Flex, on the clean-up pass: "I feel like nothing changed?", then "Do you think this is the best version of the summary tab?", "can you do a mock first", "you dont think A is hard to read?" and, on the redrawn mock "The story, easier to read": "Yes, build A2". This replaces the clean-up pass's layout (the section above) on the website; the Companion's card is as it was.

Top to bottom:
- **The headline.** "Timed +1 with 1:35 to spare." Then one sentence of what put the key at risk, biggest first: a wipe or a near-wipe (one cast that left three or more under 15%), the deaths, casts that went off with a kick ready. "...nearly cost it" when the key was close (a wipe or near-wipe, deaths that cost half the time to spare, or under 30 s to spare); over time, "...cost it: without the deaths it was in time" when the deaths alone would have timed it. A clean key says so. Then, in grey, against a typical fast run and the biggest part of the gap; then, faint, the next level, group DPS and Lust (they were tiles). Beside it the three numbers that decide a key: Deaths, Close calls, Missed kicks, each opening its list.
- **The key, pull by pull.** The strip with the moments that decided the key numbered on it (a hover says the moment, a click opens the pull on Route) and a gold bracket over the pulls Fix first is about. Under it the moments, one fact a row: the number, the key's timer, the pull, what happened and what was ready, and what a death cost. Four at most (`MPX_MOM_N`), chosen by weight (a wipe, a death, a near-wipe, a missed kick, a close call, a cast that needed a stop, a debuff left on, a cooldown not pressed, an avoidable hit) and told in the order they happened. Then one line: "Also:" and the rest counted by kind (each a link), what was clean, and "Every mistake, kind by kind".
- **Every mistake, kind by kind.** The old Mistakes box, folded and out of sight until a link opens it (the "Also" links, the three numbers, "Every mistake, kind by kind"). Nothing in it changed.
- **Fix first and Your part, side by side.** Fix first is a card: what it cost on the right, the title, its Next time line, "Show on the map" and "Where your 5:35 went". Your part is a card: the player, their Next time line, their mistakes as one line, and their report card.

`MPX_STRIP_ON = false` in src/mptab.js takes the numbers off the strip. A key with no timer (left early) keeps its page: no headline, the Mistakes box open, Your part as a card.

Checks: tests/mplus-summary-strip.js runs the story code on made-up keys (the sentence, which moments are told, a wipe told once, the numbers on the strip, Fix first's card); tests/look-review.js has a block for A2.

Smooth bars (Nov 14; Flex: "is there a way to get the bars to update in real time and not be so choppy?"): the log reads health and damage once a second, so every bar on the replay (the raid frames, the meter, the enemies beside the map, the bosses' frames and the bars over the enemies) slides from one reading to the next and is drawn every frame. The meter's rows and the enemies' rows slide into their new places when the order changes, and the enemies glide between their spots.

The enemies' health bars in their kind's colour (Nov 14; Flex: "Can you also color the mob health bars by their mob type? Elite > Some type of purple, Caster > Some type of blue, Melee > Warrior class color"): Elite purple, Caster blue, Melee in the Warrior class colour, on the map and beside it, with a key by "Enemies". The kind is the pull card's own (Elite: a rare, or at least twice the health of the key's middle trash enemy; Caster: it heals other enemies or keeps casting). The count by name under the rows is gone ("this probably isnt neeed since we have mob health bars").

### Big hits moves into the fold (Nov 14, 2026)

Flex: "I think the big hits section is throwing me off im not sure what to do with it", then "Yes, move it". Big hits was its own folded panel under the Summary, a second, longer list of what the moments already tell. It is now the last part of "Every mistake, kind by kind", with its own fold inside. The Close calls number, a close call's row ("See the hit") and "See every big hit" open it there. Nothing in Big hits changed. A key with no timer has no fold, so its Big hits stays where it was.

The enemies beside the replay keep a fixed order (Nov 14; Flex: "Dont organize these mid pull just leave them with elites at the top, then casters, then melee. Dont sort by health remaining"): bosses, elites, casters, melee, the same kind together by name. A row only moves up when one above it dies, or down when a new enemy joins.

Raid frames that move like health (Nov 14; Flex: "the healthbars here dont really move in a realistic way can you fine tune it"): the page keeps every change of a player's health with its moment, and a frame shows the health at that very moment, easing there quickly (a hit drops it fast, heals fill it a little slower). A boss's health bar is red, on the map and beside it ("Bosses should have red health bars").

Walking and the map's size (Nov 14; Flex: "disabling this doesnt work, it still skips the walking", "how can we fill the empty space"): a player writes nothing in the log while only walking, so the replay now walks each player in a straight line from one spot the log has to the next; with "Skip the walking" off the walk plays at its own speed. The map grows to the height of the panel beside it, and the panel keeps a fixed height (8 enemy rows, 9 lines of As it happens) so the map never changes size mid-pull.

Targets and guessed spots (Nov 15; Flex: "I think what people are targeting needs to be checked, its switching too often", "theres no way they stood still for 12 seconds"): a raid frame's target is only what the player aims at (a cast with a target, a melee swing, an auto shot), the one they aimed at most in the last 5 seconds. A player writes nothing while only walking, so between the spots the log has, the replay guesses (a straight line on the same floor, or the last spot until the next floor); while a spot is a guess the mark fades, and the caption says the log has no positions while they walk.

## Summary merged into the Report card, which opens the key (Nov 15, 2026)

Flex, after four Summary designs: "Maybe we dont even need it? Thoughts?", then "What if we just merge some of summary with report card, and make report card the opening tab". So the website's key page has five tabs: **Report card, Route, Rotation, Graphs, Compare**. The page opens on Report card. The Companion app's card is unchanged.

What came from Summary, and where it is now:
- **The key, in short** (the Report card's strip) reads a line a fact on a key with a timer: the result with the story of the key ("Timed +1 with 1:35 to spare. A near-wipe in pull 1 and two deaths nearly cost it."), how far behind a typical fast run, the group's line as before, its tip as its own line called **To raise the grade**, then the next level and Lust, faint. Where most of the time went is said by Fix first under it; with no Fix first card the strip says it itself.
- **Fix first**: Summary's card, under the strip, with its Next time line, "Show on the map" and "Where your time went" (Compare).
- **Every mistake, kind by kind**: a panel of its own under the Report card, shut until you click its title. Big hits is its last part. A key with no timer has its Mistakes box and Big hits in that panel instead.
- The pull strip with its numbered moments: Route has the same strip, and each pull's card there says what happened in it.
- Your part: the Report card's own card for the picked player.

Details the patch review found (Nov 15), each with its check: the first line counts the spare time against the limit of the level the key got, as Summary did and the rest of the site does (the Report card's own line counted it against the whole timer: "Timed +2 with 6:20 to spare"); "behind a fast run" is red, "ahead of" is not; a clean key says "nobody died" once; where most of the time went stays in the strip unless Fix first is that same stretch; "Last time here (+18, Nov 2): …" is the strip's last faint line (it had no other place on the website); the panel's count is the banner's "mistakes" count; a key whose log names no players still shows its mistakes on the first tab.

Why "To raise the grade": the Report card's tip ("Next key: …") is the grade's biggest gain, and Fix first is the timer's. Side by side, two "Next key" lines read as two "do this first".

Old links still work: `&mpv=run` (Summary), `&mpv=mis` (Mistakes) and `&mpv=hit` (Big hits, opened in its fold) open the Report card. A pull card's "See every big hit" on Route opens it there too (it still pointed at Graphs).

How it is built: Summary's code still draws (the Companion uses it, and its pieces are what the Report card shows). The heroH part of `mpHtml` keeps its sentences on `R._sx` (story, fast, fastA, next, lust, fix); `mprShort` and `mprFixH` read them. `mpxAllMove` (run by `mpxOpen` after each draw) moves `#mpxAllM`, or a timerless key's `.mpx-dg` and `#mptCH`, into `div#mptCA` right after `#mptCP`; a Report card repaint replaces only `#mptCP`, so the panel stays.

Checks: tests/mplus-report-opens.js runs the tab list, the address and the strip on made-up keys (contradictions.js runs it on every build); tests/look-review.js has a block of lines for this change. Each fails on e0f8fb6d.

### Big hits grouped by part of the key (Nov 15, 2026)

Flex: "the big hits section needs to be sorted better" (after "the abilities need to be organized better, by bosses/trash packs/pull numbers or something"). On the website the big hits are grouped by part of the key, in its order: the trash before each boss (with its pull numbers), then the boss, its name in gold. Under each part are the spells cast there, in the order each first went off. A spell cast in two parts is in both, with that part's casts, its own lowest and its own deaths; in a part of several trash pulls a row says which pull. The close calls and By player are as before. The Companion app's card keeps one list, the worst first. Check: tests/mplus-big-hits-order.js (fails on 78fa4907).

## Survival, a tab of its own (Nov 15, 2026)

Flex, on Big hits ("man the big hits still feels so out of place", "thats too much in a single persons report card", "im almost debating on putting it in the graphs section, but its very big"), then his idea: "what if we made a new tab, for survivability that highlighted players ability to use their kit to stay alive, and mitigate damage done? It could include the avoidable damage, could include this defensive usage chart you made", and "Yes, build it" on the mock. The website's key page has six tabs: Report card, Route, Rotation, **Survival**, Graphs, Compare (`&mpv=sur`).

What is on it, top to bottom:
- **Staying alive**: one line ("2 deaths and 5 close calls."), one sentence (the one cast that left the most of you under 15% at once; the player who left a ready defensive unpressed most often), five numbers: deaths (+ time on the timer), close calls, defensive ready but not pressed, Healthstone or potion (used of the times one was needed), avoidable hits.
- **Deaths**: the same rows as the mistakes and Graphs' Deaths; a click shows the hits before it and what was ready.
- **Defensives on big hits**: grouped by part of the key (the trash before each boss with its pulls, then the boss in gold), a line a spell: its casts, how much it takes, the lowest it left anyone, and how many of its hits landed on someone with a defensive up ("8 of 24 up"). A click opens the spell's grid of players against its casts, with each defensive as its icon. Shut until clicked, so the tab stays short.
- **Healthstones and health potions** (Flex: "Healthpots and healthstones should also be included in this"): a row a player with Healthstones and health potions used and what they healed, and how many of the times one was needed they pressed one (the Report card's own count: a big hit left them under 15% or killed them and one was off cooldown); then each time one was needed and neither was pressed, with its time, pull and what hit them.
- **Each player's kit**: the defensives they pressed (icons ×count), how often one was up on a big hit, close calls, self-healing, and the lowest they got (or where they died). The tank's big hits aren't judged. On a phone each row stacks, each value with its label.
- **Avoidable damage**: the mistakes' rows, or "Clean".

Fixed on the way: the Report card's hovers said a close call "left you at 900%" (the health left is already a whole percent); they read "left you at 9%" now.

Where the numbers come from (nothing is counted twice): deaths, close calls and avoidable hits are `mpxData`'s; the defensives left unpressed and the Healthstone moments are the Report card's own (its Staying alive rows carry `nMiss` and `ch`, `ans`, `uses`, `hsN`, `potN` and each missed moment, `mis`); the big hits are `R.big`; self-healing and potion healing are `R.hsf`; the pressed defensives are each pull's `defs`.

Big hits on the website is now only this tab: the old Big hits chapter (`mpBigChap`) draws on the Companion app's card only, which keeps its layout. Links to Big hits (the close calls' "See every big hit", Route's pull cards, old `&mpv=hit` links) open Survival. Graphs keeps its raw Survival and Deaths views. Code: `mpxSvGroups`, `mpxSvNums`, `mpxSvCell`, `mpxSurv` in src/mptab.js; the look is the "Mythic+ Survival" block at the end of style#look-nov13.

Checks: tests/mplus-big-hits-order.js runs the tab's own code (the parts of the key, the numbers on top, the Report card's counts, the Companion's list); tests/look-review.js has a block for the tab. Each fails on 6f03d342.

## The fresh reviewers' top three (Nov 15, 2026)

Flex asked "rate the mythic+ tab overall". Seven reviewers who had never seen the work scored each tab from real pictures of his +19 Kings' Rest: 7.0 overall (Survival 7.3, Rotation 7.2, Graphs 7.0, Report card, Route and Compare 6.8; the full report is in the shared notes, mplus-rating-nov15.md). Flex: "Yes, fix them" on the top three:
- **One wording per number.** Compare's sentence says what the deaths put on the timer and how much of it was beyond the fast run's ("0:30 on the timer, 0:15 more than the fast run's"), so it matches its bar's "Deaths 0:15". The Report card's group row adds up the players' damage above it (the whole key, walking included, as every player's number and Graphs count it); the in-pull number (1.02m) is called "while in a pull", with the whole-key one beside it. The banner counts pulls as Route does (11, the bosses apart).
- **One Next key list** on the Report card, under The key, in short: the timer (what Summary called Fix first, with its Next time line, what it cost and its links), the grade (the Report card's tip, which left the strip) and the picked player (their card's own Fix first, with a link to their checklist). A key with no timer keeps its strip as it was.
- **No banner said twice**: the Report card's banner keeps its numbers and the group grade, not the key's name, result and time (they are in the banner on top of every tab); the time to spare replaces "players graded".
- **Compare, one job**: the key against a typical fast run. Each player's bar fills to the best of their own spec with a white mark at its middle player (one scale for every role made the healer look worst), furthest behind first, and a player with no fast runs of their spec gets a line saying so.
- **A phone shows every tab**: the tab row wraps onto two lines.

Left as it was: the floating "Ask the Paladin" bubble shows only for the admin. Code: `mprNext` in src/mptab.js; the look is the last block of style#look-nov13. Checks: tests/mplus-report-opens.js runs the Next key list; tests/look-review.js has a block of six lines. Each fails on b203075a.

## The next batch from the rating (Nov 15, 2026)

Flex: "Yes, next batch" on the fresh reviewers' list (mplus-rating-nov15.md in the shared notes). Three readers drafted the Route, Rotation and Graphs changes from the code; the Survival part is this session's.
- **Route**: one line under the Route score names the weakest part (the lowest share of its points, as the tiles colour them), says that part's own sentence and what to do next time ("Pull plan is the weak part. You took 3 more pulls than the fast run (11 against 8)... Next time, pull bigger where the fast run did."); when the Timer is the weak part the action is Fix first's own (R._sx.fx). Under the strip a one-line key names each shape the lanes show, drawn with the strip's own pieces, only the ones this key has (`mrsTake`, `mrtKey`). The map and the replay are untouched.
- **Rotation** (the website's tab is `mpcRotHtml`): every check to fix opens by default, so the worst one is never shut, until you open or shut one yourself; the Trash pulls and Bosses tiles name the pull or boss when it came up on one or two ("Rotation priority, on pull 1"). The order of the checks is the studio's (gap to top players first).
- **Graphs**: Damage done, Damage taken and Healing open on every player, a layer each in class colours; opening a row shows that player alone (the chart follows the opened row on those three; Casts, Resources, Deaths and Survival still follow the Player pick). The boss band, its start line, its name and the Bosses chip are in the site's boss gold, the name drawn over the layers.
- **Survival**: with no Warlock in the group and no Healthstone used, the tab says health potion only (the tile, the section's title and its rows; the Healthstones column goes). The kit's column is the graded number, "Ready, not pressed" (a defensive that sat ready when a big hit left them under 15% or dead), with "up on N of M big hits" under it. The "up" bars on the big hits are the site's blue.

Left for later: Route's map readability (another chat works on the map and the replay); Survival telling the same moments in several parts; the tabs' different summary styles.

## Four tabs, each with one job (Nov 15, 2026)

Flex: "I just dont like the mythic + tab a lot right now im not sure what to do", then "alright do whatever you want then make it good". Six tabs built one at a time read as a data dump, not a coach. The key's page is now four tabs:
- **Debrief** (opens first): did we time it and why, and what to do next key. The key, in short and Next key (they were the top of the Report card), then **The key, pull by pull**: every pull a line, grouped into the parts of the key (the trash and the boss: "Start → Vexamus", "Vexamus → Melidrussa", and "After X" for pulls after the last boss). Each part's line has your time, the fast run's time for the same part and the gap in red, amber or green. Each pull's line has when it started on the timer, how long it lasted (a bar, bosses in gold), the count it gave, and what happened: deaths and what killed them, close calls by spell ("Crush left 2 players under 15%"), missed kicks, big cooldowns not pressed, debuffs left on, avoidable hits, Lust, or "clean". Clicking a pull shows it on Route. Every mistake, kind by kind, is the panel under it (it was under the Report card).
- **Players**: Report card, Rotation and Survival, a row of three under the bar; the Player pick in the bar is for all three. The Report card is its banner, the group's report card and the ranked group, with **Against top players** (each player's damage against their spec in the fastest runs, from Compare) under the ranked group.
- **Route**: the map, the Route score and Know this dungeon, with **Where the time went** (from Compare) under the map.
- **Graphs**: as it was.

Old links still work: &mpv=run and &mpv=mis open Debrief, &mpv=cmp opens Route, &mpv=hit opens Survival. The Companion app's card keeps its layout (website only, behind MPC_ON). Code: `MPX_TABS`, `MPX_SUB`, `mpxPbpData`, `mpxPbp`, `mpxDeb`, `mpxCmpMove` in src/mptab.js; the look is the last block of style#look-nov13. Checks: tests/mplus-debrief.js runs the four tabs and the pull-by-pull list on a made-up key; tests/look-review.js has a block of lines. Each fails on 3dd30969.

Fresh reviewers' fixes before it was saved: a cast that needed a stop and got none is said in its pull (it read "clean"); close calls count each player once, with "2 times" when one player was left low twice; a death after a pull ended says so; "See this pull's rotation" on a pull card lights Players and Rotation; a log that names no players gets no empty Players page and keeps the key pull by pull; the moved parts' look rules were renamed where they were (no copies), so no check passes on rules that style nothing.

## Replay raid frames (Nov 15, 2026)

Flex, with a picture of the replay's health bars: "these are too long, can you have the health bar being more like a healer raid frame and the target be to the right of the healthbar?". Each player is now a short box (132 px; 120 px on a phone) with the name and health inside, as on a healer's raid frames, still one line tall. What they are hitting (or healing, in green) sits outside the box to its right, over the map; on a phone the target stays hidden, as before. Look only (the last block of style#look-nov13); check: one look-review line, failing on fe05760f.

## The replay's meter, switchable (Nov 15, 2026)

Flex, with a picture of the replay's damage meter: "What if we just merged as much of graphs as we can into this", then "Yes, build it" on a meter that runs with the replay like a damage meter in the game. The meter beside the replay's map now has six kinds over it: **Damage**, **Healing**, **Taken** (damage taken), **Kicks**, **Dispels** and **Deaths**, and **Pull** or **Key** beside its title: the pull being played, or the whole key up to the moment being played (its rates are over the time fighting, so the walking doesn't lower them). Each row says the rate and the share (Damage, Healing, Taken) or the count (Kicks, Dispels, Deaths); the small line after a name is a big cooldown just pressed (Damage, Healing), a defensive just pressed (Taken), the spell kicked, the debuff taken off, or what killed them. The numbers come from the same records as Graphs: damage, healing and damage taken a second (R.pd, R.phl, R.ptk), and each pull's kicks, dispels and purges, and deaths. Two differences on purpose: Key so far adds up each pull's own stretch and divides by the time fighting (Graphs' whole key divides by the whole key's length, so its rates are lower), and a pull's healing here stops when the pull ends (Graphs adds the topping-off in the walk after it). A row answers Enter; Space stays the replay's play and pause. A click on a player (or Enter) lights them up on the map (their name shows, the others fade), in the raid frames and in the meter; a second click puts them back. The kind and Pull or Key are kept for the next replay.

The Graphs tab stays as it is for the whole-key deep dive (charts over time, by ability, target and buff). Code: `MRP_MM`, `mrpMeter`, `mrpMtHead`, `mrpMtClick` in src/mptab.js; the look is the last block of style#look-nov13. Check: tests/mplus-replay-meter.js runs the meter on a made-up key; it fails on 9a758623.

## Survival off Players, and fewer colours (Nov 15, 2026)

Flex: "I feel like the survival section needs to just be removed. Its clutter at this point", then "keep survival in graphs though". The Players tab is now **Report card** and **Rotation**. What Survival showed is still on the page: the close calls, deaths and avoidable hits are on Debrief (in the key pull by pull and in every mistake), each player's defensives, Healthstones and potions are graded on their Report card, and **Graphs' Survival** keeps its four sections (Defensives; Healthstones, potions and self-heals; Combat potions; Health over the key). The cast-by-cast Big hits list was only on Survival; it is gone from the website (the Companion app's card keeps its Big hits page). Old links: &mpv=sur and &mpv=hit open Graphs on its Survival; a link to the big hits opens Debrief's close calls.

Then: "The mythic + tab as a whole feels hard to read, theres a lot of colors". A count of every word on the page: about 42% of the words on Debrief, the Report card and Route were coloured, in up to 30 colours a tab. Now it is about 6 to 10%, by the site's own rule, one meaning a colour:
- player names in class colours (as everywhere);
- spell, mechanic and enemy names bold white (they were purple or gold);
- red only for what cost time or a life (deaths, close calls, time behind, a failed check);
- gold for bosses and for Debrief's voice ("Next time", the section labels);
- green only for a good result (Timed, Clean, No mistakes, a passed check's tick);
- a grade's colour only on its badge: the numbers beside it, the players table's scores and its DPS are white (the DPS parse colour is in its hover);
- everything else white or grey: the pull squares on Debrief (their colours are the map's), the pull-by-pull marks that are not deaths or close calls, the Next key box and its numbers, the counts in every mistake, "was ready", the route score's numbers (its bars keep their colour), "never went off".

Rotation, Graphs and the replay keep their colours. The look is the "Mythic+, fewer colours" block at the end of style#look-nov13. Check: tests/mplus-calm.js (Survival stays off, Graphs keeps its Survival, each colour rule stays); it fails on acd07a20. tests/mplus-big-hits-order.js, which ran the Survival tab's own code, is retired with it.


## Summary lines that agree with their rows (Nov 15, late)

Flex: "thoughts on the mythic+ tab? rate it". Six fresh reviewers scored the page 6.7/10. The main reason was trust: a summary line sometimes said the opposite of the rows under it. Then: "Yes, fix them". Each summary is now built from the same data as its rows:
- **Next key, the damage line.** It says what lower damage cost, from the same split as "Where your 5:35 went", and names the one or two players furthest behind their spec. It used to read "the group averaged a 53 parse", which named nobody, and 53 is above the goal.
- **Route score, the pull plan reason.** It gives the real reason: area damage hits more enemies in a bigger pull. It only mentions time between pulls when that part cost 15 seconds or more.
- **The big cooldowns line under the group's grade.** It names the pulls the pull rows mark. A long pull only counts as a miss for a player who had a big cooldown ready at its start. Ready means not pressed yet in the key, or pressed at least its shortest gap between two presses ago. A cooldown pressed only once before isn't counted, because how long it takes isn't known. The checklist counts the same pulls: "11 of 11 long pulls" on his key, where it used to say 11 of 12.
- **Rotation.** A check at or above top players isn't "to fix". It sits under Done right with a green dot, so a box can say "Clean · 2 checks as good as top players". A check close to top players stays amber at most. One line explains what the squares count: "Judged on 10 pulls and 4 bosses. Pull 7 was too short to judge." The Colossus Smash sentence names its windows, and "a Arms Warrior" is now "an Arms Warrior".
- **"Nearly cost it".** It only shows when what the mistakes cost came close to the time left (mpxRisky).
- **DPS.** The players table and its group row use one time base: the whole key, walking included. The group row is the players added up, and its vs spec is the players against their specs' middle players. The in-pull 1.02m and its fast-run comparison stay in Group damage. On Graphs, the rail, the chart and the table say their base and show one number.
- **Small wording fixes.** Graphs says Lust. The banner says "~472 points (all gained)".

Checks: tests/mplus-cd-say.js, tests/mplus-dps-base.js and tests/mplus-rotation-top.js, plus new parts in tests/mplus-report-opens.js, tests/mplus-summary-strip.js and tests/look-review.js. All of them fail on 37cefaa3.
