# Rotation page critique (Oct 25)

## What's left on Rotation (your question: "Any data or polishing needed?")
**Looks: nothing left.** Any future look change goes to the Design studio chat.
**Data and checks: yes.** This comes from this morning's class-guide audit. Its wrong rules and wrong wording are already fixed and live. What's left:

| # | Job | My take | Why |
|---|---|---|---|
| 1 | **About 15 big missing checks**: mistakes both guides call out that the page doesn't catch yet, so they show as fine | 9/10 | A Feral spending at 3 combo points gets a green today. These are the checks top players would notice first |
| 2 | **Top-player numbers for 16 specs** | 8/10 | Fire, Fury, Feral, Survival, Outlaw and Discipline are graded on our own default marks on every boss. 10 more specs have top numbers on only 1 to 4 bosses. Gathering them from Warcraft Logs is slow (one request every 10 seconds), so it runs in the background |
| 3 | **Tank marks measured only while tanking** | 7/10 | The mitigation rules now count only while you're tanking, but the "top" marks were set from whole fights. This one rides along with 2 |
| 4 | **About 30 smaller missing checks** | 5/10 | Small gains: weapon-oil checks on a few specs, cooldowns sitting at 2 charges and the like. Later |

The big missing checks (job 1):
- **Feral**: finishers spent below 5 combo points
- **Enhancement**: Lightning Bolt or Chain Lightning below 5 Maelstrom Weapon
- **Unholy**: Putrefy spent outside Dark Transformation
- **Destruction**: Shadowburn in execute (under 20%)
- **Retribution**: Hammer of Light right after every Wake of Ashes
- **Protection Paladin**: Holy Bulwark and Sacred Weapon (Lightsmith, the tree both guides recommend)
- **All three Hunters**: Hunter's Mark on the boss before the pull (and Misdirection for Beast Mastery)
- **Brewmaster**: Purifying Brew sitting at 2 charges
- **Fire**: Scorch under 30%
- **Fury (Mountain Thane)**: Thunder Blast at 2 stacks
- **Survival**: Raptor Swipe without Tip, and Wildfire Bomb on the Sentinel's Mark target
- **Discipline**: Void Shield used before your next Penance
- **Havoc**: Exergy uptime
- **Shadow**: Void Volley charges left when Voidform ends
- **Guardian**: Moonfire uptime

**My pick:** start job 1 on the practice link, a few specs at a time (I'll read each spec's guide first), and run job 2 in the background alongside it.

### Progress (you said "Yes, start…")
Each new check is tried on real top players' kills before it goes in. If top players fail a check, the check is wrong, not them.

**Live on debriefme.io (b3542f7)**, with patch notes under Oct 25. Both test logs pass, with no errors on any of the 40 raiders.

| Spec | New check | Top players | On our raid |
|---|---|---|---|
| Feral | Finishers at 5 combo points; Ferocious Bite with 50 Energy (free Apex Bites left out) | 100% and 98% | No Feral |
| Enhancement | Lightning Bolt, Chain Lightning and Tempest at 5+ Maelstrom Weapon (the free ones in Ascendance and Doom Winds left out) | 97 to 100% | Timespirall 100% |
| Unholy | Putrefy inside Dark Transformation or Forbidden Knowledge | 76 to 100%, so 75% is green | 12/12 on Coiled Altar |
| Destruction | Shadowburn before Chaos Bolt when the boss is under 20% (councils: only once one boss is left) | Almost no Chaos Bolts under 20% | No Destruction |
| Retribution (Templar) | Hammer of Light right after every Wake of Ashes | About 1 second after, every time | No Templar |
| Protection Paladin (Lightsmith) | Holy Bulwark and Sacred Weapon about once a minute | 5/6 to 7/7 | Balkazaar 2/9 on Nymrissa (one of each in 7:23), 5/5 on Coiled Altar |
| Beast Mastery, Marksmanship, Survival | Hunter's Mark on the boss before the pull | 6 of 8 had it | All yes |
| Fire (Sunfury) | Scorch before Fireball when the boss is under 30% | 17 to 1 and 9 to 1 | No Fire |
| Fury (Mountain Thane) | Thunder Blast not wasted at 2 stacks | No top Fury plays Thane in raid, so it only shows for Thane players | No Fury |
| Survival | Raptor Swipe with Tip of the Spear | 94 to 95% | No Survival |
| Havoc | Exergy uptime | 90 to 99% | 94% |
| Guardian | Moonfire on the boss (Red Moon keeps it up) | 75 to 100%, so 75% is green | No Guardian |
| Discipline | No Void Shield proc wasted (you can hold 2) | None wasted | No Discipline |
| Shadow | Every Void Volley charge used before Voidform ends | 0 or 1 left | All used |

**"Fix it all" round: live on debriefme.io (f2632a4), with patch notes:**

| Spec | Fix | Top players |
|---|---|---|
| Survival (Sentinel) | New priority line: Wildfire Bomb when the boss has your Sentinel's Mark, right after Boomstick, as both guides list it | They mostly do it (their priority score drops only about 2 points) |
| Guardian | Thrash and Moonfire count only while you tank, like Ironfur already does, so time away from the boss isn't a gap. Thrash is green at 80% | Thrash 86 to 100%, Moonfire 85 to 99%. Before, 2 of 3 top Guardians were red |
| Blood | Blood Plague counts only while you tank too (Blood Boil only reaches what's next to you) | Same rule |
| Brewmaster | New line: Purifying Brew while tanking, how many a minute | Top Brewmasters: 5 to 7 a minute |

**Also found and fixed:** Fire Mage's tier set card (live since this morning) read "NaN". Under that, it counted every Pyroblast cast while a Pyroclasm waited (74 on a top Fire Mage's kill) instead of the ones that used it (23), so the number was about 4 times too high. It now reads about 2.1M (2-piece) and 1.8M (4-piece) on that kill. I found it by running every page on 10 saved top kills (184 pages, 33 specs). That was the only problem.

**Why Brewmaster's check is a count, not "sitting at 2 charges":** the log doesn't show Purifying Brew's charges. I rebuilt them from the casts using the guide's numbers (20 seconds each, Keg Smash −3 s, Tiger Palm −1 s), and top Brewmasters came out pressing it with no charge left, up to 13 times in a pull. So haste and something else the log doesn't show shorten it. Grading a guess would blame good players. Instead the page shows how often you used it while tanking and grades that against the top Brewmasters on the boss once their numbers arrive from the download. Until then it shows the number without a grade.

**Left out on purpose:**
- **Sacred Weapon outside your wings.** The top Lightsmiths split on it: one casts every Sacred Weapon inside their wings, one always outside, the others mix. The guides' "outside Wings" can be read two ways.
- **Discipline: Void Shield before your next Penance.** Top Discipline Priests hold one through a Penance a fifth to a third of the time, and with 2 charges that loses nothing. Only a wasted proc is counted.

**Found and fixed along the way:** for busy stacking buffs, the page lost count of the stacks 4 to 5 minutes into a pull. It kept only the first 600 stack changes, so Maelstrom Weapon read "1 stack" for the rest of the fight. That made our Enhancement look like 58% (really 100%). It also affected every priority rule and proc check that reads stacks late in long pulls. It now reads the full record.


**Top-player numbers (job 2): paused, restarting at 11 pm tonight.** At about 1 pm the site's Warcraft Logs key got rate-limited ("429"). While that lasts, raiders can't open new logs. My download's ranking requests turned out to be heavy, and with the site's Sunday traffic they used up the key. I stopped it right away and told the Manager. It now asks for rankings once a minute instead of every 10 seconds, pauses an hour if it ever sees that error again, and restarts by itself at 11 pm, when the site is quiet. The rankings take about 1.5 hours, then the kills download overnight and into tomorrow. When it's done, I'll turn it into top marks and show you first.

Read as a top raider and as a new raider, on your Nymrissa kill (Holy Paladin) and a Windwalker on the same pull.

## What works (keep)
- **What to fix**: three ranked cards with a "How" and what each one cost. New raiders get one clear "Fix first". Top raiders get the numbers.
- **The rings and tiles**: you can read the whole page at a glance, with the top players' mark on every share.
- **Tier set card**: its "Where it came from" breakdown is the proof top raiders want.
- **Where your healing / damage came from** bar.
- **Burst-window cards** with the cast strips.

## The 8 changes (all built, on the practice link: https://rotation-crit-debrief.james-m-nemecek.workers.dev/?report=4GdvhM71B8zrCJjH&fight=68&tab=rot&p=Fl%C3%ABx%C3%B8r%C3%A7%C3%AFst)
| # | Change | Why |
|---|---|---|
| 1 | Score and Parse get plain labels: "Rotation score" (how well you pressed your buttons) and "Parse" (your HPS against other Holy Paladins), each with a one-line ⓘ | 90/100 next to a 16 parse looks like a contradiction to a new raider |
| 2 | Talents fold to one line by default, with the full tree one click away | The big tree takes the top of the page, and most people only need it now and then |
| 3 | "What to fix" skips a check when you're within 5 points of the top players | Beacon of Virtue 60% against a top of 63% isn't a real fix, and it pushed out a bigger one |
| 4 | A small ⓘ on "Your checklist" says the grey "top" number is the top players' on this boss | New raiders don't know what "top 82%" means |
| 5 | "Biggest hit / heal" goes. Holy Paladin's separate Tyr's Deliverance section becomes a normal tile in Your numbers | Biggest hit is trivia with nothing to act on, and no spec gets a special section of its own |
| 6 | One "Your gear" list instead of the Trinkets / Gear effects / Stat items headings, sorted by what each item gave. The "All gear effects" total goes when it only repeats one item | Three headings for gear, with numbers that repeat each other |
| 7 | The "Potion window" number moves into the Combat potions tile | Potions in one place |
| 8 | Shorter section subtitles | "boss and add damage, what your trinkets, stat items, enchants and potion added…" is too long |

## Would both kinds of raider get what they need?
- **New raiders**: yes, after 1, 3 and 4. The page reads top to bottom: score, three fixes, then the rings.
- **Top raiders**: yes. The exact numbers, the top players' marks, "How it's judged", the cost of each mistake, the tier breakdown and the folded cast timeline are all there.

## The 8 changes are live (26377e8)

## Design polish (practice link: https://rotation-polish-debrief.james-m-nemecek.workers.dev/?report=4GdvhM71B8zrCJjH&fight=68&tab=rot&p=Fl%C3%ABx%C3%B8r%C3%A7%C3%AFst)
Found by clicking everything on the page:
- **"Casting" is now "Rotation"**: every spec has a rotation, casters or not.
- **Talents open on a desktop again.** Folding them didn't shorten the header, and on a desktop the fold couldn't be opened at all. They stay folded on a phone.
- **A "What to fix" card opens its tile** in the checklist and scrolls you to it.
- **No time chips** (the rows of "0:24–0:43" times). The tile has the total, and "Next time" names the one that matters.
- **Nothing in the checklist jumps you to the bottom timeline** any more. Window cards stay put when you click them.
- **Long window lists show the 6 that matter** (ones with mistakes first), with "Show all 18" for the rest.
- **No count line under each window's cast strip.** The strip already shows every cast.
- **Merged repeats:** not-graded numbers sit on the tile they belong to. Casts per minute is on "Always be casting", extra healing on "Avenging Wrath uses", and Aura Mastery uses on Aura Mastery's tile. Your numbers keeps only what stands alone (Saves, Tyr's Deliverance).
- An open number tile no longer repeats its line, and the cast timeline's title shows once without a stray "1".
- Checked on every spec in both logs (no errors) and at phone width (nothing sideways).

## Gear and extras in colour (live, e851d9b; everything below is live too, c2462d7)
Your note: "Maybe format and color code this better looks plain."
- **Each group has its colour**, the same colours as "Where your healing came from": Boss and adds orange, Trinkets gold, Tier set and enchants purple, Other gear blue, Extras green.
- **Each group sits in a soft box** of its colour, with a glowing dot and its total on the right (for example "Trinkets 23.8K HPS").
- **Each item has a thin bar** in its group's colour, sized against your biggest item, so you can see at a glance what pulls its weight.
- "Your gear added **about 44.2K HPS**" has its number in gold. Groups side by side line up at the bottom.
- Checked all 40 raiders in both logs (no errors).

## Latest round (live)
Your three notes: "not every bit of info needs to be a card", "these could all be merged and categorized", "should the drop down tiles be larger?"
- **Lists inside a tile are plain rows** with a thin line between them, not cards (Rotation priority's slips, for example). The facts in a chart tile ("296 gained · 276 spent…") are one line of text. Burst-window cards stay cards, because each one is its own thing with its own cast strip.
- **Gear and extras is one panel** with short groups, each a plain list with the biggest first:
  - **Boss and adds** (damage dealers and tanks)
  - **Trinkets**
  - **Tier set and enchants**
  - **Other gear**
  - **Extras** (not graded: Saves, Tyr's Deliverance and the like)
  - "Your gear added about 44.2K HPS in all" sits on top, and Where your healing came from at the bottom.
  - It's about half the height of the ten boxes it replaces.
- **The tiles line up with the rings**: 5 rings, so 5 tiles across. 9 tiles now take 2 rows instead of 3, and the page reads as one grid. The tiles aren't bigger than the rings.
- **The open ring stays in the row**, outlined in gold, and its tiles open below the whole row. Before, opening one pushed the other four rings down under its tiles.
- **One headline per tile** (your note: "why are there extra lines on the tile if the drop down shows it?"):
  - The small lines under a tile's number are gone. The tile's big number is still its worst check, so a mistake always shows on the tile.
  - When the tile opens, the main part's sentence sits right under the tile's title, without repeating the name.
  - Each other part has its own title with its number, top mark and flag colour on the right (for example "Infused Flash of Light on a Beacon … 44/68 top 68%" in green).
- Fixed: "You saved 7 raiders from dying over these 1 pull" now reads "You saved 7 raiders from dying."
- Checked all 40 raiders in both test logs (no errors), at phone width (2 tiles across, nothing sideways), and on All pulls (both pickers agree).

## Ideas A–F (all built, on the practice link)
| # | Idea | My take | Why |
|---|---|---|---|
| A | **The 5 rings in one row** on a desktop (Rotation, Cooldowns, Resources, Prep, Stats), smaller, with the open ring's tiles below | 8/10 | Today they wrap 3 + 2 and leave Stats alone on a second row. One row reads like a scoreboard at a glance |
| B | **Shorter "What to fix" cards**: one line of why and one line of How, with the cost as a small tag ("cost 1.31M healing"). The full text stays in the tile, and the card already opens it | 8/10 | The three cards are the most text-heavy part of the page and sit right at the top |
| C | **Your numbers joins Gear and extras** as an "Extras" row (Saves, Tyr's Deliverance, and the like) | 7/10 | After the merges it's down to 1 or 2 tiles. A whole section for that is one heading too many |
| D | **"Top Holy Paladins score about 88"** moves under the score ring as a small "top 88" | 6/10 | One less loose line in the header, and it reads like the top marks everywhere else |
| E | **Phone: tiles 2 across** instead of 1, a bit smaller | 6/10 | On a phone the open ring is a long single column. Two across halves the scrolling |
| F | **All pulls: the player picker.** The header picker can show one raider while the Rotation panel still says "Pick a raider…" | 7/10 (small bug) | Two pickers that disagree confuse people. The panel should follow the header's pick |

Not changing: the colours (only the three flags plus gold), the tile and ring look, "How it's judged" (top raiders use it), and the tier breakdown.

## Plain wording round (Oct 26, your notes: "fix all the jumbled jargon and simplify the wording" and "just remove the text, you have the chart")
Every sentence on Rotation now says one thing in plain words. Before → after:
- Priority: "Debrief checked 337 of your casts against your priority list, and 92% of them were the best button to press at that moment." → "92% of your 337 casts were the best button at that moment."
- Cooldowns: "Used 10 of a possible 15 times…" → "You used it 10 of 15 possible times. It waited unused for 46 seconds."
- Always be casting: → "You were casting 85% of the time. Your longest gap was 4 seconds, at 3:27, while moving."
- Casts per minute: → "You cast 52.8 times a minute." (the label "Casts per minute (CPM)" stays)
- Cancelled casts: → "You finished all 112 casts you started."
- Procs: → "None wasted." / "replaced by a new one."
- Opener: guide names gone → "The opener your guides use (…)."
- Melee: → "You were hitting the boss 91% of the time. Of the 40 s off it, 12 were only you, and 28 came from mechanics."
- Potions: timestamps gone → "You drank 2 of 2 possible combat potions. In their 30 seconds you did 1.3 times your usual healing."
- Stat order: the sentence is gone; the bars show it.
- Ring lines: "1 to fix · 1 to improve · Divine Purpose…" (only the checks that need work are named).
- What to fix: "Strong kill. Only small things to polish. Start with the first one." / "A good kill, close to the top." / "Lots to gain, and the fixes are clear."
- Next time tips: "in its pandemic window" → "in its last 30%"; "on your very next global cooldown" → "right after"; "on the same global cooldown as" → "together with".
- Cost: "It cost about 1.31M healing (1% of yours)."
- Holy Paladin: Divine Purpose, Flash of Light without an Infusion and Eternal Flame lines rewritten the same way.
Checked: both test logs, all 20 pages, no errors.

## Resources vs Warcraft Logs (Oct 26, your note: "holy power spent vs used ... seemed dramatically different") — aa23b9f, not live
Checked every power against the raw Warcraft Logs events on 6 top kills (scratchpad tops/resaudit.js).
| Power | What it was | Now |
|---|---|---|
| Holy Power (you) | Read right (296 gained, 18 wasted, 276 spent), but the tile said 2% because it skipped Divine Toll overflow | Shows 6% like Warcraft Logs; the sentence says 12 came from Divine Toll, which is fine; colour still from the 6 that count |
| Other "wasted" tiles that forgive some (Ret, Outlaw, Sub, Frost DK, Unholy, Devourer) | Showed only the counted part | Show everything; the sentence says how much was fine |
| Insanity (Shadow) | Spending 100x too big; the "at 50 Insanity" priority rule always passed | Right; top Shadow priority scores 76-81% -> 85-87% |
| Fury (Devourer) | Void Metamorphosis drains ignored, chart and waste off | Drains count as spent, capped at what was there |
| Energy, Rage, Focus | "Wasted" included a guess of regen lost while full, counted even when the boss was away | Wasted = what the log says; the guess is its own "about" line and skips boss-away time |
| Mana, combo points, Chi, Maelstrom, Astral Power, Shards, Essence, Runes | Matched | Unchanged |
Top marks for the changed tiles were re-measured from saved top kills (tops/marks_res.js).
Open: the Design studio's summary/dup pass hides the new second sentence (the Divine Toll part); asked it to fix. Shadow's priority top marks (93-96%) look older than today's checks (top players 85-87%).

## Queued for tomorrow (Oct 26 night, the Manager: "a new build, so it waits for tomorrow")
- DONE and LIVE (fd0aa97, the user: "you didnt create this for the healers"): **Healers' Healing box** (the user via the Design studio: "you have this unique chip for dps [Boss and adds], i think healers should get one showing HPS and overhealing"). In spcExtras, next to grp('Boss and adds'): grp('Healing', [healC, overC]) for healers, group class rgx-gheal for the studio.
  - Healing done: big number HPS (same as the hero's: sum of healS over the pulls ÷ sum of pull lengths), sub "total · N% of the raid's" (raid = every player's healing in those pulls), card class rgx-heal, bar = share.
  - Overhealing: big number the % of what you cast (over ÷ (healing + over)), sub "total · per second", card class rgx-over. Numbers only, never graded or coloured (overhealing rule).
  - Then tell the Design studio the classes.

## Launch 4 (Oct 26): tested, then deployed on the user's OK (live = 10af238, Worker 053110e4)
- Built 10af238 (newest main, everything on GitHub), tested on https://launch-check-debrief.james-m-nemecek.workers.dev: all 7 tabs load, no errors, no undefined/NaN.
- `npx wrangler deploy` was refused by the Rotation chat's permission check (a production deploy needs the user's own OK; the launch came through the Manager). Live is still launch 3 (1d5797f).
- To go live: tell the Rotation chat "deploy it", or run `npx wrangler deploy` from a fresh build of main.
- Seen while testing (also on live, not new): a report link with no &tab= opens Home's front page when the last tab used was Home.
- **Pull at a glance colours** (the Design studio, from the user's "any opinions on how this is designed?"): in the timeline (.spc-tl) Holy Power and Avenging Wrath are both gold, Mana and Beacon of Virtue both blue. Holy Power to warm orange #e88f6f, Mana to cool teal #5fc9c9 (Avenging Wrath stays gold, Beacon blue); the legend's i.hp / i.mn swatches follow.

- Live after the Healing box: fd0aa97 (Worker f7a31e16), all 7 tabs tested.
- Launch 5 (Oct 26, the user's OK in the Rotation chat): live = 0d73ac1 (Worker 1884f0b4), all 7 tabs tested. Includes the healer Parse fix (GEN_MEMO key now includes which parses have arrived).
- Launch 6 (Oct 26, the user's OK in the Rotation chat): live = a57a757 (Worker c5383ca5); desktop + phone tests, Coiled Altar shield block checked. Design studio round 47 (8120f6a) landed during testing, not live.
