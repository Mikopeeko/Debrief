# Graphs vs Warcraft Logs: looking at a pull (Nov 8)

Research only, nothing built yet. Waiting on Flex's OK.

**How it was checked:** the same pull opened on both sites: Thursday Nov 5, The Coiled Altar Mythic, pull 22
(report 2r1KzqygWAFHkZT3; Debrief `fight=32&tab=perf`). Every tab, hover and click on Warcraft Logs was tried
(read only), then the same on Debrief's Graphs.

**Rules this list keeps:** Graphs stays raw numbers, no verdicts ([performance-replaces-wcl]). Every list uses the
Graphs meter row ([graphs-tab-bars-rule]). Nothing copies their look, and nothing links out. We build our own version.

---

## Bugs found while comparing (fix first, these are not features)

| # | What's wrong | Where |
|---|---|---|
| B1 | **Deaths list shows 1 death when there were 18.** The chart above says "18 deaths, the first at 7:04", the Health list shows a death next to most players, but the Deaths list only has Vandagos (7:14). Picking a player (Fourinches) still shows Vandagos. | Graphs > Deaths |
| B2 | **Wrong item levels.** Several players show 314 where the log says 333-335 (Kargaryen, Boltzzx, Tyralien, Vandagos, Larryg, Dashtoswirly, Zaffia on the Healing list). | Damage + Healing lists, ILVL column |
| B3 | **"Active" reads much lower than the log's.** Fourinches 82-92% on Debrief vs 99.6% there; healers 31-43% vs 35-52%. Either the meaning differs or the math is off. If it's on purpose, the header tip should say what it counts. | ACTIVE column |
| B4 | **The player chart's legend and the spell list name things differently.** Chart: Necrotic Bolt 19% on top. List: Lord of the Dead 17% on top (pet spells folded under the pet in one, not the other). | Damage, one player open |
| B5 | **Name tip gets stuck.** After clicking a name, its hover box ("click for the breakdown") stays on screen over the open breakdown. | Damage list |
| B6 | **Boss % doesn't match.** Debrief: "Wipe, boss at 11%". The log's pull list: "24% P3". Worth one look at which boss/number each uses. | Pull picker, banner |
| B7 | **The side menu jumps.** Opening Deaths or Damage taken adds a sub-item ("What killed them", "Mechanic damage") that pushes every item below it down, so the next click lands on the wrong item. | Graphs side menu |
| B8 | **On a kill, Deaths and Dispels are missing from the menu.** Twin Fangs kill (Oct 14): the Health list shows 3 deaths (Hobbz, Ironvan, Tyralien), but there's no Deaths item to open. | Graphs side menu, kill pulls |

### Second check: Flex's Twin Fangs Mythic kill (Oct 14, report 9DRWhKnZbHtQgf4a, fight 37)

Flex asked that his own kill be used too. The same checks on a kill, Healing first:
- **Item levels are wrong here too (B2 confirmed):** Tyralien 309 (log 328), Ironvan 301 (log 319), Arsyn 310 (log 329).
  It's about 19 lower for some players every time, so it looks like one bug, maybe gear read at the wrong moment.
- **The raid chart has no hover box (confirmed).** The Healing chart shows nothing on hover, on a kill as well.
- **Kills do show a Parse column** (healers: Huservoker 59, Flëxørçïst 69, Optt 21, Ashdknight 19, close to the log's numbers).
  The gap is only that wipes have no parse column. The log shows a parse on wipes too.
- **Healing totals are a bit higher than the log's** (Flëxørçïst 156.6M vs 152.6M; overheal 39.5% vs 40.3%). That's small,
  but worth one look at what each counts (absorbs or pets).
- **The pill names fit the fight** ("Both Fangs", "One Fang left"), which is better than the log's stage names.
- **The log only:** clicking a name in the chart legend adds that player's own line next to the total, with a second scale. Our "Compare
  players" does the same job.
- **The log only:** a plain note under the chart says what's left out ("damage to Brooding of Ithraz is excluded").
  We should say the same when adds are left out of a total.

---

## The gap table

WCL = what Warcraft Logs does. Value: **Must** (raiders look for it every night), **Nice**, **Skip**.
Size: **S** under a day, **M** a day or two, **L** bigger.

### Hover and click (Flex asked about these most)

| Feature | WCL | Debrief now | Gap | Value | Size |
|---|---|---|---|---|---|
| Hover the raid chart for numbers | Hover anywhere: time + raid total at that second | Player chart has a great hover box (every spell at that second). **The raid chart shows nothing on hover.** | Add the same hover box to the raid chart (time, raid total, top 5 players at that second) | Must | S |
| Hover a damage bar: player vs pets | Two-tone bar (player + pets); hover lists the player and each pet with its share | Pets fold in; one solid bar; hover gives total, DPS, % and rank | Two-tone bar + pet split in the hover box | Nice | S |
| Hover a spell bar: hit/crit split | Hover shows Hit / Critical Hit / Tick rows with share, count, min, max, average | Nothing on hover of the spell bar | Hover box with normal vs crit vs tick, min, max, average | Must | S |
| Hover a spell name: who it hit | Hover shows sources and targets of that spell (e.g. 72% Zul'jan, 28% Malacrass) | Hover/click shows the in-game spell tooltip (nice) | Add "hit: Zul'jan 72%, Malacrass 28%" under the tooltip | Nice | S |
| Click a spell: split into parts | Arrow opens sub-rows (Dread Plague vs Dread Plague (Erupt), pet spells under the pet) | Flat list | Fold parts under one parent row, click to open | Nice | M |
| Hover the parse number | "72% for all Unholy Death Knights (1,148 parses)" | No parse column on the Damage list for a pull | See "Parse %" below | — | — |
| Hover a death on the deaths chart | "7:04 Volkovod dies from Zul'jan's Venom Rupture" | Dots are crowded at the end and hard to hit; no hover line | Hover line per dot; spread dots that land on the same second | Must | S |
| Click any moment → see the map | Every row in a death recap has an arrow that jumps the Replay to that exact second | Debriefing has its own Timeline replay, but Graphs never opens it | "Watch this moment" from a death, a chart point or a spike, opening our replay at that second | Must | M |
| Cast icons on a timeline, hover for details | One row per spell, an icon at every cast; hover: "05.374 Fourinches casts Necrotic Coil on Zul'jan" | Casts tab = casts a minute + spell count list | Cast timeline per player (one row per spell, icons, hover for time + target) | Must | M |
| Click a buff → its own view | Opens: stacks over time chart, who had it, uptime strips, "stacked/normal" toggle | Buff rows with uptime strips (good); no drill-in | Click a buff row: stacks chart + who had it | Nice | M |
| Pin a spell to the chart | "+" on any row adds that spell as its own chart above (several pins at once) | Can compare players; can't add one spell | Click a spell to draw just that spell's line on the chart | Nice | M |

### Charts and time

| Feature | WCL | Debrief now | Gap | Value | Size |
|---|---|---|---|---|---|
| Drag to zoom → lists follow | Drag across the chart; the chart zooms and **every table recounts for just that window**; "Reset zoom" | "Drag to zoom" on the chart | Check the lists recount for the window, and show the window + a Reset button in the header | Must | S (check) |
| Phase filter | All phases / each stage | Whole pull, P1, P2, Intermission, P3, Bloodlust, Power Infusion pills | Have it, and ours is quicker | — | — |
| Chart markers you can switch on/off | Heroism, downtime, deaths, rezzes, boss deaths, add deaths | Bloodlust, Deaths, Battle res, Add kills, Boss abilities | Have it. Add "downtime" (boss away / untargetable) shading | Nice | S |
| Per-ability stacked chart for one player | Stacked area by ability | Same, with hover numbers | Have it (ours has the better hover) | — | — |
| Casting-time chart | Bars showing when a player was casting vs idle | Not there | Idle gaps on the cast timeline cover it | Nice | S (with cast timeline) |
| "Ignore after death" / "after wipe called" | Toggle | Always counts up to the wipe call ("Counted up to 7:14") | Fine as is; maybe a small "count the whole pull" switch | Skip | S |

### Damage done

| Feature | WCL | Debrief now | Gap | Value | Size |
|---|---|---|---|---|---|
| Ranked list: total, %, DPS, ilvl, active | Yes, plus parse % and ilvl % | Total, DPS, %, ilvl, active | Parse % column on the pull | Must | M |
| Parse % on the pull | Parse % per player on kills **and wipes** + hover with spec and how many parses | Parse column on kills (checked on the Twin Fangs kill); none on wipes | Add parse on wipes, and a hover with spec + how many parses | Nice | M |
| Damage to one enemy | Pick any enemy or add set | "Target: All enemies" picker + By target | Have it | — | — |
| By ability (whole raid) | Yes | Yes | Have it | — | — |
| Spell columns | Casts, avg cast, hits, avg hit, crit %, **uptime %**, **miss %**, **DPS** per spell | Share, casts, avg cast, hits, avg hit, crit % | Add uptime % (DoTs) and per-spell DPS | Nice | S |
| Filter by buff ("only while Bloodlust was up") | Aura filter icons above the spell list | Phase pills cover Bloodlust and Power Infusion | Enough for now | Skip | L |
| Augmentation / weighted damage | Toggles | Augmentation support damage exists on Debrief | Check it's shown on Graphs' Damage list | Nice | S |
| CSV export | Yes | No | Not for our raiders | Skip | S |

### Healing

| Feature | WCL | Debrief now | Gap | Value | Size |
|---|---|---|---|---|---|
| List with overheal | Yes | Total, HPS, %, overheal, ilvl, active | Have it | — | — |
| Healing + absorbs / mitigation | Separate settings | "Healing + mitigation" and "Into absorbs" views | Ours is better | — | — |
| Healing per spell with hit/crit hover | Yes | Spell list, no hover split | Same hover box as Damage | Nice | S |
| Who did a healer heal | "Done to" view | ? not found on the pull view | "By target" for healing (who got the heals) | Nice | S |

### Damage taken

| Feature | WCL | Debrief now | Gap | Value | Size |
|---|---|---|---|---|---|
| By player / by ability | Yes | Yes, plus stacked chart per player | Have it | — | — |
| Mitigated % column, hits, avg hit, miss/dodge | Mitigated %, hits, avg hit, crit, miss %, DTPS; two-tone bar (taken vs mitigated) | Total, per sec, % only on this list (the Mitigation numbers live elsewhere) | Add hits, biggest hit, mitigated % to By ability | Must | S |
| Absorbed / friendly fire toggles | Self absorbs, external absorbs, absorbed healing, friendly fire | Not on this list | Show absorbed as the light part of the bar | Nice | S |
| Biggest single hit | Max per ability | Not shown | Add "biggest hit" column (raiders ask "what one-shot me?") | Must | S |

### Deaths

| Feature | WCL | Debrief now | Gap | Value | Size |
|---|---|---|---|---|---|
| Death list | Time, name, killing blow, overkill, last 3 hits, damage taken, healing received | One row per player: count, time, killed by (and **bug B1**) | Fix B1; add "last 3 hits" and "healing in the last 10s" columns | Must | S |
| Death recap: event by event | Every hit, heal and shield in the last ~10 s; HP after each line; source → target; overkill | Grouped bars ("10 heals +883k", "Venom Rupture −428k") with health % | Let the recap open into a full line-by-line list (time, what, amount, health after, who) | Must | M |
| Buffs up at each hit | A row of buff icons on every hit (was a defensive up?) | Not shown | Small icons for defensives/externals active at each hit | Must | M |
| Health chart for the last seconds | HP line for the dying player | Health tab has the raid line, not per death | Small health line inside the recap | Nice | S |

### Casts, buffs, debuffs, resources, utility

| Feature | WCL | Debrief now | Gap | Value | Size |
|---|---|---|---|---|---|
| Casts per spell | Count, CPM, uptime | Count + per minute | Have it (uptime only in Buffs) | — | — |
| Cast timeline | Yes (see hover section) | No | See above | Must | M |
| Buffs grouped | Raid CDs, personal CDs, damage buffs, consumables | All / Defensives / Externals / Cooldowns / Raid cooldowns / Consumables / Procs + search | Ours is better (search, by player/by buff) | — | — |
| Debuffs on the boss | Uptime per debuff | Debuffs tab | Have it | — | — |
| Interrupts / dispels | Per spell, who, when | Tabs exist | Add the time list (who kicked what, when) if missing | Nice | S |
| Resources | Any resource (mana, rage, runic power, combo) per player, HP chart + event log | Mana for healers (with potions and deaths marked) | Other resources (rage, energy, runic power) per player | Nice | M |
| Health per player over time | Resources > HP for any player | Raid average + lowest line; time spent low list | Click a player in "Time spent low" to see their own health line | Nice | S |
| Threat | Threat chart | No | Tanks rarely need it in Midnight | Skip | M |

### Players, pulls and setup

| Feature | WCL | Debrief now | Gap | Value | Size |
|---|---|---|---|---|---|
| Talents, gear, potions per player | Summary page: talents, gear icons, combat potions, healthstones | Elsewhere on Debrief (character page, Rotation) | One "Setup" row per player on Graphs (talents, ilvl, potions, healthstone) | Nice | M |
| Group composition strip | Tanks / DPS / healers with class icons | Not on Graphs | A small comp strip under the pull picker | Nice | S |
| Compare two players | Compare page | "Compare players" on the chart + Compare tab | Have it | — | — |
| Jump between pulls | Pull list | Pull picker + ‹ › + keyboard keys | Ours is quicker | — | — |
| Events log (every line) | Full event list with filters | No | Too raw for our raiders; the line-by-line death recap covers the real need | Skip | L |
| Custom filter expressions | Query language | No | Skip | Skip | L |
| Replay (map) | Full replay with raid frames and meters | Timeline replay on Debriefing | Link it from Graphs (see "click any moment") | Must | M |

---

## Top 10 to build first

1. **Fix the deaths list (B1) and item levels (B2, seen on both pulls).** Raiders will trust nothing else on the page if the death count is wrong.
2. **Line-by-line death recap with buff icons.** "What killed me and was my defensive up" is the first thing every raider opens after a wipe.
3. **Cast timeline per player (icons per spell, hover for time and target).** It's the main thing raiders use to see when cooldowns went out, and we have nothing like it on Graphs.
4. **Hover box on the raid chart.** The player chart already has a great one; the raid chart shows nothing, which feels broken.
5. **Hit/crit/min/max hover on spell bars.** It's the most-used hover on their site and costs very little.
6. **"Watch this moment" from Graphs into our replay.** One click from a death or a spike to the map answers "where was I standing".
7. **Biggest hit, hits and mitigated % on Damage taken.** "What one-shot me" is asked every night.
8. **Show Deaths in the menu on kills (B8), and add parse % on wipes.** Kills hide the Deaths view even when people died, and wipes have no parse column, though raiders look at both first.
9. **Drag-to-zoom recounts every list, with a Reset button.** Lets people check one burn window, like Bloodlust in P3.
10. **Easy-to-hit death dots, with a hover line.** Right now 18 dots pile up in the last second and you can't pick one.

---

## What Debrief already does better

- **Phase pills, plus Bloodlust and Power Infusion windows, one click.** They need a dropdown and stage names.
- **Player chart hover lists every spell's number at that second.** Theirs gives only one total.
- **Healing + mitigation and "into absorbs" views** (Devotion Aura, versatility, defensives split out). They have nothing like it.
- **Buffs in groups with a search box**, by player or by buff, with uptime strips on every row.
- **Boss health over the pull, one line per boss**, on the same time axis as everything else.
- **Mana chart with potions and deaths marked**, plus "mana left / spent" per healer.
- **"Time spent low" list** (seconds under 35%, lowest health, deaths), which isn't anywhere on theirs.
- **Pulls side by side**: ‹ › and keyboard keys between pulls, and the "Wipe called at" mark.
- **The in-game spell tooltip on every spell name.**
- **Cleaner, quicker to read.** One meter row style everywhere, no wall of columns.
