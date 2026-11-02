# Mythic+ route data: where it could come from

Research for step 3 of the website Mythic+ tab: compare your route with faster runs, on a map.
Checked Nov 1, 2026. Only Midnight Season 2 (patches 12.1 to 12.1.5) counts. Nothing here signs in anywhere.

## In one minute

- **The data exists, and it's current.** Raider.IO, Mythic Dungeon Tools and Warcraft Logs all have this season's 8 dungeons, updated after 12.1.5.
- **Enemy forces are solved.** Raider.IO and Mythic Dungeon Tools give the same forces value for every mob. Both agree on the 100% totals.
- **The fastest +12 runs come from Warcraft Logs.** Its rankings can be filtered by key level, and each run shows its pulls and where they happened.
- **Raider.IO only reaches the very top keys** (+21 to +24), but those runs come with their full kill list and a ready-made route.
- **Keystone.guru is out for now.** Its API needs an account login, and its terms forbid copying its content.
- **Maps:** Wowhead has this season's in-game map picture for all 8 dungeons. We can load it at runtime, like our icons. A plain drawing works as the fallback.
- **Rating: 8/10 doable.** The plan is near the end of this file.

## This season's 8 dungeons

From Raider.IO's season list ("MN Season 2", started Aug 18, 2026). Timers are the real ones from runs done after 12.1.5 went live (Oct 13 US, Oct 14 EU).

| Dungeon | Timer | First added | 100% forces | Map pictures on Wowhead |
|---|---|---|---|---|
| Altar of Fangs | 30:00 | 12.1 (new this season) | 817 | 3 |
| Den of Nalorakk | 32:00 | Midnight 12.0 | 729 | 3 |
| Kings' Rest | 33:00 | Battle for Azeroth (back this season) | 608 | 1 |
| Murder Row | 34:00 | Midnight 12.0 | 655 | 3 |
| Ruby Life Pools | 28:00 | Dragonflight (back this season) | 551 | 2 |
| Temple of Sethraliss | 32:00 | Battle for Azeroth (back this season) | 687 | 2 |
| The Blinding Vale | 30:00 | Midnight 12.0 | 686 | 1 |
| Voidscar Arena | 30:00 | Midnight 12.0 | 738 | 3 |

- The 100% forces come from Mythic Dungeon Tools. Raider.IO's real runs show the same totals (checked: Voidscar Arena, Kings' Rest, Temple of Sethraliss, Ruby Life Pools).
- The three returning dungeons count only in this season's version. Both sources list them under Midnight Season 2, edited in October 2026.

**Side finding: three timers in the app were off by a minute.** `companion/mplus.js` (TIMER) has Altar of Fangs at 29, The Blinding Vale at 31 and Temple of Sethraliss at 33. This season's runs say 30, 30 and 32. The Blinding Vale and Temple cuts were made in testing, before 12.1 went live. So an Altar key done in 29:30 shows as "over time" when it was timed. I changed no code. Fixed on main in 6d0a29a (Nov 1).

---

## 1. Raider.IO API

**What it has for this season**
- The season list: all 8 dungeons, timers and IDs (`/api/v1/mythic-plus/static-data?expansion_id=11`).
- The top runs per dungeon (`/api/v1/mythic-plus/runs`), 20 per page, best score first.
- Run details (`/api/v1/mythic-plus/run-details`). For runs logged with the Raider.IO app (about 80% of top runs), there's more:
  - every enemy killed, with its NPC ID, its **enemy forces value** and when it died
  - each boss fight's start and end
  - deaths
  - a `route_key`: a route Raider.IO built for that run on Keystone.guru (the author shows as "RaiderIO"). Not every run has one.
- Flex was right: Raider.IO has routes built in. They live on Keystone.guru, though, not in Raider.IO's own data.

**How we'd get it**
- Plain web requests. No account needed for basic use. Our Worker can call it and cache the answers.

**Limits and terms**
- There's no key-level filter. The list is best runs first, and without an app key it stops at page 100. For Voidscar Arena, page 100 is still +21. So **the fastest +12 runs can't be found here.**
- Mob names come back as "Unknown". We match NPC IDs to names ourselves (from our logs or Mythic Dungeon Tools).
- No positions. Raider.IO tells you what died and when, not where.
- Terms: a website using the data must **show a link back to raider.io**. It must not be a "competing service". Too many requests get slowed down. More requests need a registered app, which means a Raider.IO account: Flex's call.

**Verdict:** Very useful. It's the cleanest source of enemy forces (the game's own numbers) and of the pro routes at the top keys. It can't give same-level comparisons at +12. Using it means a small "Data: Raider.IO" credit link. That breaks our "never link out" habit, so it's Flex's call.

## 2. Mythic Dungeon Tools (MDT)

**What it has for this season**
- It's up to date: version 6.3.29 came out today (Nov 1), with Den of Nalorakk and Blinding Vale fixes this week.
- It has a file for each of this season's 8 dungeons (in its `Midnight` folder), plus last season's.
- For each dungeon:
  - every mob type, with its name, NPC ID, **forces count**, health and spells
  - every spot on the map where that mob stands, with its pack number (Voidscar Arena: 212 mobs in 62 packs)
  - the 100% total (Voidscar Arena: 738)
  - boss spots and map markers
- This season every dungeon is one combined map ("sublevel 1"). That keeps drawing simple.
- Checked against Raider.IO: every Voidscar Arena forces value matched (Lost Sethrak 4, Dominated Brawler 7, Watchful Harrower 65, Devouring Brutalizer 30, and so on).

**How we'd get it**
- The addon is open source on GitHub: `github.com/Nnoggie/MythicDungeonTools`, files like `Midnight/VoidscarArena.lua`.
- The format is a Lua table, which is easy to read as text. A small script could turn each file into a table of numbers for our app.

**Limits and terms**
- License: **GPL-2.0.** You may reuse it, but anything built from it and shared must also be GPL and credit MDT. Putting its tables inside our app's code would bring that rule along.
- The forces counts themselves are game facts. Raider.IO gives the same numbers, so we don't need MDT for them.
- The hand-placed pack positions are MDT's own work. To show "packs you skipped", the polite and safe way is to ask the author (Nnoggie) first and credit MDT.
- Its map pictures (150 tiles per dungeon) are Blizzard art. Never use those.

**Verdict:** The best "template" of each dungeon, just as Flex said. Use it as a cross-check for forces right away. Use its pack layout only after asking the author.

## 3. Keystone.guru

**What it has for this season**
- Routes for all 8 dungeons on Season 2 maps. Its Voidscar Arena map is from Oct 2026 (built from MDT 6.2.20), with 212 enemies, 738 for 100%, and pulls with their mobs.
- Every Raider.IO-logged run becomes a Keystone.guru route. Example: the fastest Voidscar Arena +24 is route `5G4YWTw`, 12 pulls, 740 of 738 forces.
- It offers an "embed" code to show a route inside another site.

**How we'd get it**
- Its API (`keystone.guru/api/v1/...`) needs your Keystone.guru email and password on every request. Without them, every call is refused. We sign in nowhere, so this is out unless Flex makes an account and decides otherwise.
- The route pages carry the data inside them, but reading it out counts as copying (see terms).

**Limits and terms**
- The terms say you must not "reproduce, duplicate or copy material" or redistribute it, unless it's made for sharing. The embed is made for sharing.
- The embed would show their page, their look and their map inside ours.

**Verdict:** Not a data source for us. An embedded pro route in a pop-up is possible later. That's a design call because it isn't our look.

## 4. Warcraft Logs v2 API

**What it has for this season**
- **Fastest runs at a key level:** `worldData.encounter(id).fightRankings(bracket, metric: speed)`. The docs say that for WoW, "brackets are … keystones". **The bracket is the key level minus 1**, so bracket 11 returns +12 runs. The Mythic+ tab builder tested this on Nov 1; the docs don't say it. (A `score` metric exists too.) Each result points to a report and fight. We already call `fightRankings` for raid kills in `src/wcl.js`.
- **The pulls of a run:** `report.fights { dungeonPulls { ... } }` gives each pull:
  - `startTime` and `endTime`
  - `x` and `y`: where the first mob was hit (the pull's marker)
  - `boundingBox`: the box around everyone in that pull
  - `maps`: which map floor
  - `enemyNPCs`: which NPCs were in it (game ID and instance numbers)
  - `encounterID` (0 means trash) and `kill`
- **Exact positions and kills:** the run's events (deaths, and the advanced-log positions we already read) give each mob's spot and the moment it died.
- **No enemy forces.** We add those from our forces table.

**How we'd get it**
- Through our Worker with the Warcraft Logs key already stored in Cloudflare. No new account.
- The Season 2 Mythic+ zone is 55. Its dungeon encounter IDs, found by the Mythic+ tab builder on Nov 1:
  - Altar of Fangs 12993
  - Den of Nalorakk 12825
  - Kings' Rest 61762
  - Murder Row 12813
  - Ruby Life Pools 112521
  - Temple of Sethraliss 61877
  - The Blinding Vale 12859
  - Voidscar Arena 12923

**Limits and terms**
- Each call uses some of our hourly Warcraft Logs points. A comparison is about 1 rankings call plus 2 or 3 calls per run. Cache each dungeon and key level for a day.
- Only runs someone uploaded show up. There are plenty at +12.
- The rankings data "can change without notice", so cache it and handle missing fields.
- It's the same API and rules we already use.

**Verdict:** The backbone. It's the only source that finds the fastest timed runs at your key level and shows where each pull happened.

## 5. Map pictures

- **Wowhead** hosts the in-game map picture for all 8 dungeons: `wow.zamimg.com/images/wow/maps/enus/original/<zone id>.jpg`, plus `-1` and `-2` for extra floors. I looked at Voidscar Arena's, and it's the real in-game parchment map.
  - It loads at runtime from the same place as our icons, so nothing is bundled.
  - It's still Blizzard art served by Wowhead. Same footing as our icons, so keep a fallback.
- **Lining the pulls up with the picture:** wago.tools has the game's map tables, current to 12.1.5.70688 (Oct 31). The `UiMapAssignment` table gives each floor's corners in game coordinates (Voidscar Arena floors 2572, 2573 and 2574). Those few numbers turn log x and y into a spot on the picture. They're plain numbers, not art.
- **Don't use:** MDT's map tiles or Keystone.guru's tiles. MDT's are Blizzard art, and Keystone.guru's terms forbid copying.
- **Is a plain drawing enough?** Yes, for a first version. Dots for each pull, numbered, joined by a line, with the three bosses marked. The shape of the route reads fine without the picture. The picture makes it feel finished, and it's cheap to add once the dots line up.

---

## Recommended plan

Build in this order. Each step works on its own.

1. **Your own route first, no outside data.** We already read the key from your log. Add a forces table (NPC ID → forces) for the 8 dungeons. Build it from Raider.IO run details, cross-checked with MDT, and save it in our code as plain numbers. Then each pull shows "+84 (11.4%)" and a running total. Draw your pulls as numbered dots on a plain canvas, using the log's positions.
2. **Fastest runs at your level.** Use Warcraft Logs `fightRankings`: same dungeon, same key level, timed, fastest first. Take the top 3 to 5. For each, get `dungeonPulls` and the death events, then add forces from our table. Cache per dungeon, key level and day.
3. **Put the map picture behind the dots.** Load it from Wowhead at runtime, lined up with the wago.tools corners. Fall back to the plain canvas if it doesn't load.
4. **Later, if Flex wants it: pro routes.** Raider.IO's top runs (+21 and up) with their kill lists, as an extra "what the best teams do" view. This needs the Raider.IO credit link.
5. **Later, after asking MDT's author:** grey dots for the packs nobody pulled, from MDT's pack layout.

**To protect trust:** show facts, not advice. Write "Fast runs pulled these two packs together here" and "You were at 98.6% after pull 9", never "you should have pulled X". Mark each comparison with its key level and date.

## Rating: 8/10 doable

- Up from the Design studio's 7.5. Forces turned out to be a solved problem, and Warcraft Logs filters by key level.
- What keeps it from a 9:
  - lining up 2 to 3 floors per dungeon with the map
  - comparing routes that took different side paths (Voidscar has two arena champions, and runs pick one)
  - the Raider.IO credit link being Flex's call

---

## Worked example: Voidscar Arena +12

**Could we get the fastest timed +12 runs, their pulls and their forces?** Yes:
- the runs come from Warcraft Logs (bracket 11 for +12 keys, fastest first)
- the pulls and positions from `dungeonPulls` and the run's events
- the forces from our table

I didn't run the Warcraft Logs part: its key lives only in Cloudflare and I may not use it. Below are two real runs instead.

**Your key** (Flex as Trëèflêx, Oct 24): Voidscar Arena +12, timed in 24:06 of 30:00, 11 pulls, 10 deaths. Forces per pull use MDT's counts. "Mobs" is what was in the pull, so treat it as close, not exact.

| Pull | Starts | Length | What | Forces | Running total |
|---|---|---|---|---|---|
| 1 | 0:11 | 77s | 2 Longtooth Tuskarr, 2 Enthralled Shaman, Feral Saberon, Dominated Brawler, Lost Sethrak, Voidtouched Magi | +64 | 8.7% |
| 2 | 1:31 | 65s | Raj'kess the Spellstorm (arena champion) | +40 | 14.1% |
| 3 | 2:44 | 168s | the big arena pull: 20 trash, Chitigoth, Brutok, Raging Raptor, Protective Turtle, Abducted Drakonid, Angry Krolusk | +158 | 35.5% |
| 4 | 5:40 | 113s | **Taz'Rah** | 0 | 35.5% |
| 5 | 7:41 | 67s | Enthralled Shaman, Kilivore Screamer, Savage Shredclaw, Watchful Harrower | +84 | 46.9% |
| 6 | 8:53 | 106s | Brutal Overseer, Dominated Brawler, Enthralled Shaman, Watchful Harrower | +104 | 61.0% |
| 7 | 10:52 | 100s | **Atroxus** | 0 | 61.0% |
| 8 | 12:40 | 174s | 10 Scavenging Siphoid, 6 Savage Shredclaw and 13 more | +150 | 81.3% |
| 9 | 15:40 | 170s | 4 Voidminder, 2 Devouring Brutalizer and 9 more | +128 | 98.6% |
| 10 | 18:35 | 52s | 2 Feral Saberon, Agitated Voidscythe | +33 | 103.1% |
| 11 | 19:29 | 136s | **Charonus** | 0 | 103.1% |

What the tab could say: "You reached 98.6% after pull 9. Pull 10 added 4.5% when you needed 1.4%."

**The fastest Voidscar Arena run this season** (+24, 29:10 of 30:00, Oct 27). This uses Raider.IO's kill list and its Keystone.guru route, with MDT counts. It's here to show the format. The real +12 comparison would use +12 runs from Warcraft Logs.

| Pull | What | Forces | Running total |
|---|---|---|---|
| 1 | Brutal Overseer, 2 Lost Sethrak, 3 Dominated Brawler, Feral Saberon | +58 | 7.9% |
| 2 | Aegyra the Unyielding (the other arena champion) | +40 | 13.3% |
| 3 | 10 arena trash | +43 | 19.1% |
| 4 | the rest of the arena: Chitigoth, Brutok and 13 more | +107 | 33.6% |
| 5 | **Taz'Rah** with 2 trash | +8 | 34.7% |
| 6 | Kilivore Screamer, Savage Shredclaw, Enthralled Shaman, Watchful Harrower | +84 | 46.1% |
| 7 | **Atroxus** | 0 | 46.1% |
| 8 | 10 Scavenging Siphoid, Devouring Brutalizer and 9 more | +88 | 58.0% |
| 9 | 10 Scavenging Siphoid, Voidtouched Magi, Watchful Harrower, 3 Savage Shredclaw | +115 | 73.6% |
| 10 | 10 Scavenging Siphoid, Devouring Brutalizer and 8 more | +80 | 84.4% |
| 11 | 10 Scavenging Siphoid, Devouring Brutalizer and 7 more | +80 | 95.3% |
| 12 | 8 trash with **Charonus** | +37 | 100.3% |

Boss times in that run: Taz'Rah 7:28 to 11:26, Atroxus 13:49 to 17:37, Charonus 25:17 to 29:09.

What the side-by-side could say:
- "The fast run split the arena into two pulls. You did it in one big pull (2:48)."
- "After Atroxus you needed 39% more and got it in 2 big pulls. They needed 54% and took 5 pulls."
- "You finished with 3.1% extra. They finished with 0.3% extra."

(These lines compare a +12 with a +24, only to show the wording. The real tab compares runs at the same key level.)

On the map: your 11 numbered dots in one colour, theirs in another, both lines over the Voidscar Arena picture.

---

## Sources checked (Nov 1, 2026)

- Raider.IO API docs and rules: https://raider.io/api (the spec at https://raider.io/swagger.json)
- Raider.IO season list: https://raider.io/api/v1/mythic-plus/static-data?expansion_id=11
- Raider.IO top runs: https://raider.io/api/v1/mythic-plus/runs?season=season-mn-2&region=world&dungeon=voidscar-arena&affixes=all&page=0
- Raider.IO run details: https://raider.io/api/v1/mythic-plus/run-details?season=season-mn-2&id=23288811
- Mythic Dungeon Tools: https://github.com/Nnoggie/MythicDungeonTools (license GPL-2.0, release 6.3.29 on Nov 1)
- Keystone.guru route from that run: https://keystone.guru/route/voidscar-arena/5G4YWTw
- Keystone.guru API docs: https://keystone.guru/api/documentation. Terms: https://keystone.guru/terms
- Warcraft Logs API docs: https://www.warcraftlogs.com/v2-api-docs/warcraft/ (pages ReportDungeonPull, ReportDungeonPullNPC, ReportMapBoundingBox, Encounter, FightRankingMetricType)
- Wowhead map picture: https://wow.zamimg.com/images/wow/maps/enus/original/16425.jpg
- wago.tools map tables: https://wago.tools/db2/UiMapAssignment and https://wago.tools/db2/UiMap (build 12.1.5.70688)
- 12.1.5 dungeon tuning and timer news: https://www.icy-veins.com/wow/news/timer-reductions-and-more-final-mythic-tuning-on-the-12-1-ptr-all-8-dungeons/ and https://us.forums.blizzard.com/en/wow/t/2380514
