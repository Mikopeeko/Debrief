# Raiding — what matters (Mythic progression, Midnight 12.x)

Research notes for building Debrief, Oct 21, 2026. Our notes, not a site page.
Sources are tagged in brackets like **[RIO-perf]** and listed at the bottom. Where a point is the common, long-standing
habit of progression guilds and no single page says it best, it is tagged **[norm]**. The user's own rules (from memory)
are tagged **[user]**; they win when they disagree with a source.

Pairs with: `Raider checklist.md` (one line per thing a raider is judged on) and `Debrief gap list.md` (what the site
already covers, and what to build next).

---

## 0. The short version

1. **Alive beats everything.** A dead player does zero damage and zero healing, and on Mythic one death often costs the
   pull. Raid leaders look at deaths first, then mechanics, then numbers. [RIO-perf] [RIO-app] [MMOC] [norm]
2. **Do your job in the plan.** Your soak, your kick, your dispel, your cooldown at its time. A raider who always does
   their assignment, even at a cost to their own damage, is worth more than a top parser who doesn't. [RIO-app] [norm]
3. **Same mistake twice is the real problem.** Everyone makes a mistake once. Repeating it, wipe after wipe or week after
   week, is what gets talked about and, in the end, benched. [RIO-perf] [GO] [norm]
4. **Show up ready.** Flask, food, weapon oil, potions, enchants, gems, the note loaded and the fight known. Missing these
   is "free" lost progress and shows the raider isn't taking it seriously. [RIO-app] [GO-wiki] [recruit] [norm]
5. **Numbers matter, but not as parses.** Damage and healing must clear the fight's checks. Parses are a rough filter
   (single digits = a spec problem); medians, improvement over kills and "what were you doing" beat one pink parse.
   [RIO-perf] [RIO-app] [MMOC]

---

## 1. Context: how Mythic raiding works in Midnight

- **Mythic is exactly 20 players.** Normal/Heroic flex from 10 to 30. Guilds roster 23–25 for Mythic so absences don't
  stop the night. [GO-wiki]
- **Progression vs farm.** Progression = a boss you haven't killed; farm = re-clearing bosses you have. Mythic bosses can
  take 100–400+ pulls; wiping is normal and the goal is to see more of the fight each pull. [GO-wiki]
- **Achievements set the tiers of ambition.** Ahead of the Curve (AotC) = last boss on Heroic before the next tier;
  Cutting Edge (CE) = last boss on Mythic before the next tier; Hall of Fame = first guilds to kill it on Mythic (for the
  Venomous Abyss: the first 200 worldwide to kill Ula'tek on Mythic, already full). [BLZ-VA] [IV-HoF]
- **This tier.** Venomous Abyss (12.1, Aug 18 2026), 8 bosses + Kith'ix in 12.1.5. Heroic Ula'tek was the hardest Heroic
  end boss since Vault of the Incarnates (only ~231 guilds had AotC in week one); after her nerfs, The Coiled Altar is the
  real wall for most guilds. [SERA] [IV-HoF]
- **Midnight changed the tools.** Combat addons can't read most combat data during encounters ("secret values"): no
  WeakAuras-style combat logic, boss mods trimmed, other players' cooldowns can't be tracked by addons. Blizzard added
  its own boss timeline, "you are targeted" alerts, highlighted cast bars for important interrupts, and a server-side
  damage meter. Warcraft Logs (the combat log file) is not affected. [WH-addons] [BLZ-UI] [WT-UI] [WIKI-API]
  - What this means for raiders: plans live in **notes** (NSRT reminders on screen at the planned time) instead of
    addon calls, so knowing and loading the note matters more than ever. [NSRT] [WOWU-NSRT]
  - What this means for us: **logs are now the only place a raid lead can see the whole picture after the fact**, which
    is Debrief's opening.
- **Healers have no interrupts in Midnight except Restoration Shaman (Wind Shear).** Kick rotations are DPS and tanks.
  [CLAUDE.md] [WCOACH]

---

## 2. What matters on a pull

In order of how raid leaders weigh it. The first four decide most Mythic wipes.

### 2.1 Deaths
- **First death matters most.** It usually starts the chain: a missing soaker, a missing kicker, a healer gone. Wipefest
  and raid leads both treat early deaths as the biggest score hit. [WF] [GO] [norm]
- **Avoidable or not.** Raid leads sort each death: own mistake (stood in it, missed a mechanic, late), someone else's
  mistake (missed kick, missed soak, a cooldown not used), or the plan/tuning (raid damage too high, healing check).
  [GO] [concord] [norm]
- **"Could you have lived?"** The Warcraft Logs Deaths tab is the standard: did they press a defensive, a Healthstone or a
  health potion before dying? Was it a slow bleed (a healing problem) or a burst? Replay to check if they were in the
  right spot and moving with the group. [RIO-perf] [RIO-app]
- **User's rule:** 2 seconds or less from healthy to dead is "not on you"; slower, with a defensive/Healthstone/potion
  still ready, was theirs to save; dying to your own mistake is never "not on you". [user: recap-raid-lead-voice]
- **Cascade = a mechanic or a check.** Several deaths within ~10 s of the first usually means a failed mechanic or a raid
  damage check, not five separate mistakes. [Debrief engine insight] [norm]
- **After the pull is lost, deaths stop counting.** Raid leads ignore what happens once the wipe is clear (Debrief's
  "wipe filter"). [norm]

### 2.2 Mechanics and assignments
- The plan says who soaks, who kicks, who dispels, who uses which raid cooldown when, who baits, who runs where. Doing
  your piece every time is the core skill. [NSRT] [RIO-app]
- Group mechanics are where pugs and new raiders fail most: standing apart from the soak, not going to their group,
  late to a spot. Personal mechanics (don't stand in fire) usually fix themselves. [MMOC]
- **Soak tolerance [user]:** 1–2 missing from a note's soak group is fine; flag 3+ missing, or soaking with the wrong
  group.
- **Not every mechanic is equal [user, coiled-altar-danger-weights]:** weigh by what kills pulls (Dreadmarch falls and
  ghost collisions yes; a slow Venomfang dispel no). Check thresholds against top kills before calling something a
  mistake. Wipefest does the same: mechanics are weighted by how often the cleanest kills did them right. [WF]

### 2.3 Avoidable damage
- Damage you could have dodged (swirls, frontals on non-tanks, beams, pools, waves). It costs healer mana and GCDs and
  makes the next mechanic lethal. Warcraft Logs' "Problems"/damage-taken views and Wipefest's avoidable damage are the
  usual check: who took the most, and from what. [MMOC] [WF-VA]
- Raid leads care about **repeat hits** and **hits that led to a death**, not one tick. [norm]

### 2.4 Interrupts
- Every important cast on a kick rotation gets kicked, by its assigned kicker, in order. A missed kick on your
  assignment is a top-tier mistake because it can wipe the raid. [GO] [norm]
- Midnight's highlighted cast bars mark the lethal casts; the game expects them stopped. [BLZ-UI]

### 2.5 Dispels
- Some debuffs must come off within seconds; others shouldn't be touched (they jump, explode or are part of the plan).
  Who dispels, how fast, and deaths with a removable debuff on are the checks. [WCOACH] [WF-VA]
- **User's rule:** only dangerous debuffs get graded harshly; harmless ones (Venomfang) are advice, never red.

### 2.6 Soaks and positioning
- Soak counts, spread/stack distances, baiting away from the group, standing where the plan says, moving with the
  group. Positioning is mostly judged in the replay or a map. [RIO-perf] [norm]
- **Room edges [user]:** players stand on the stone; rims aren't walkable (check maps against real dots).

### 2.7 Personal defensives, Healthstones and potions
- Use a personal defensive on hits you know are coming (big raid damage, your debuff, a soak). Use a Healthstone or
  health potion when you're low and healing can't catch up. [RIO-perf] [RIO-app]
- **User's rules (healthstone-fail-rules):** a split-second dip under 30% isn't a fail; being nearly one-shot isn't a
  fail; 5+ s under 30% with little healing, or sitting low with a hit coming and a stone/pot unused, is.
- Healthstone: once per pull (its cooldown starts after combat) except a Warlock's own with Pact of Gluttony; health
  potions and combat potions are separate 5-minute cooldowns. [user: cooldown-planning-rules] [Method Midnight]
- **Combat potion:** one per pull, two if the fight is long enough (pre-pot + one later). A missing potion on a
  progression pull is a known, cheap loss. [norm] [Debrief Report card rules]

### 2.8 Raid cooldowns
- Healer raid cooldowns (Aura Mastery, Spirit Link Totem, Revival, Tranquility, Barrier, Rewind, etc.) and raid-wide
  utility (Rallying Cry, Darkness, Anti-Magic Zone) go on the planned damage events, don't overlap, and get used as
  often as they're back. A cooldown still unused when the raid died "might have prevented it". [WCOACH]
- **User's rule (cooldown-planning-rules):** on Mythic every raid cooldown goes out as often as it's back.

### 2.9 Uptime ("always be casting") and the rotation
- Damage/healing comes from pressing buttons: time not casting (outside forced movement) is lost output. Then the
  priority list: right buttons in the right order, no capped resources, cooldowns used. WoWAnalyzer's checklist and its
  APL checks are the model ("You pressed X while Y was ready"). [WA-guide] [WA-APL]
- **User's rules:** proc-reliant gaps aren't major (red only for what adds damage if fixed) [proc-reliant-not-major];
  overhealing is minor, never flagged [overhealing-minor]; healer logic judges resources, cooldowns against damage and
  mana pacing, not single heals.

### 2.10 Burst lined up with the right moments
- Big damage cooldowns, potions, Bloodlust and Power Infusion go where damage matters most: priority adds, damage-taken
  windows (boss vulnerable/shield), execute, or the phase push. Holding a cooldown for a window is correct; sending it
  on pull into a boss that's immune soon isn't. [WA-APL: cooldowns kept out of the APL because holding can be correct]
  [WCOACH] [norm]
- **User's rules (power-infusion-rules):** PI lined up with the target's cooldown is right; Shadow never red; Holy/Disc
  must line up with DPS cooldowns.

### 2.11 Add priority and target swaps
- Priority adds die first and fast; damage on the wrong target (boss when adds are up, cleaving into a shield) can wipe.
  Watch who targets the wrong thing. [MMOC] [norm]

### 2.12 Phase timing and damage checks
- Many fights have hard checks: a shield to break, an enrage/berserk, a boss % to hit before a mechanic stacks too high.
  The raid lead watches "where were we at 4:15?" against a kill or a top log to tell a **damage problem** from an
  **execution problem**. [GO-wiki] [Debrief guides "Reach 25% by 4:15"] [norm]
- Pushing a phase early or late can change which mechanics overlap; good raids control it on purpose. [norm]

### 2.13 Tanks
- Taunt swaps on time, frontals pointed away, adds picked up, active mitigation and big cooldowns used, staying alive
  through tank busters. Tanks are judged on deaths and swaps first, then damage. [norm] [Debrief Report card tank rules]

### 2.14 Healers
- HPS alone misleads (a clean raid makes healers look worse). Judge: deaths that healing could have stopped, raid
  cooldowns on the damage, dispels, mana left (running out on a wipe is a problem; reserves on a kill are fine), and
  damage dealt in quiet moments. [WCOACH] [user: healer-saves, overhealing-minor]

---

## 3. How raiders are judged

### 3.1 What raid leads and officers look at, in order
1. **Deaths and why.** [RIO-perf] [RIO-app]
2. **Mechanics and assignments**, over many pulls — "you will see who handles difficult mechanics reliably over a
   tier". [RIO-perf]
3. **Preparedness**: gems, enchants, consumables, uptime of important buffs. "The easy details" come first in a log
   review. [RIO-app]
4. **Throughput**, read with care (next section).
5. **Learning and attitude**: improving wipe to wipe and kill to kill, taking feedback, staying calm. [RIO-app] [RIO-perf]
6. **Attendance and reliability.** [recruit] [GO-wiki]

### 3.2 Warcraft Logs parses, and why they mislead
- A **parse** is any logged attempt's percentile; a **ranking** is your best. The percentile is "better than X% of
  logged players of your spec on that boss", not "X% of the top damage". Colors: grey <25, green 25–49, blue 50–74,
  purple 75–94, orange 95–98, pink 99, gold 100. Item level brackets split the pool. [ARCHON-rank] [WT-wcl]
- Why parses mislead [RIO-perf] [RIO-app] [MMOC] [BLZ-forum]:
  - **Only uploaded logs count** — the pool skews toward stronger players.
  - **External buffs**: Power Infusion, Augmentation buffs and the like inflate parses.
  - **Fight length and strategy**: short kills, cheese strats, different assignments.
  - **The job**: a player with soaks, kicks, baits or add duty parses lower doing it right.
  - **Group strength**: parses rise with the raid around you.
  - **One lucky kill**: the best parse hides a weak median.
- How good leads use them: single-digit parses = struggling with the spec; around 50+ on progression = stop worrying
  about damage and look at other things; compare **median vs best**, and the **kill-by-kill graph** to see improvement.
  [RIO-perf] [RIO-app] [MMOC]

### 3.3 Mechanics first versus damage
- The common view: a raider who does mechanics properly can be taught the rotation; a habit of ignoring mechanics is
  harder to fix. [BLZ-forum] [RIO-app]
- "A raider does not need to top the meters to be crucial to a team's success." The reliable mechanics player is
  "incredibly valuable in a progression environment". [RIO-app]
- But damage checks are real on Mythic: raiders must clear them, and a raid full of low parsers can't kill Mythic
  bosses. Dependable mechanics **plus** above-average throughput is the target. [RIO-perf] [GO-wiki]

### 3.4 Consistency over the night (and the tier)
- One bad night is forgiven; patterns are not. "Don't expect perfection… judge over time." [RIO-perf]
- Late-night dips (everyone sloppier in hour three) point to fatigue, not skill. [GO]
- Players should improve on repeat kills; no improvement is a warning sign. [RIO-perf] [RIO-app]

### 3.5 Preparedness
- Expected in any organized guild: flask, food, potions, weapon oil, augment rune (top guilds), Healthstones, enchants
  and gems on everything, current talents for the fight, required addons, boss research. [GO-wiki] [recruit] [RIO-app]
- Midnight extras: Omnium Folio done, weekly vault filled (M+ 10s for a better vault) — semi-casual guilds already ask
  for these. [recruit-S2]
- **The note**: NSRT loaded (the raid lead's "Share on Ready Check" catches late joiners), personal reminders on, the
  plan read before raid. [WOWU-NSRT]
- Watch the guide/short clips for your role before raid; long videos overwhelm, short role clips work. [BW-prog]

### 3.6 Learning from wipe to wipe, communication and attitude
- Growth mindset (welcomes feedback, inspired by others' wins) is valued "at any progression level"; fixed mindset is a
  red flag. [RIO-app]
- Respect under stress; constant negativity hurts morale; how someone repairs an outburst matters most. Neurodivergent
  or anxious raiders may need help with repair, and an honest effort shouldn't count against them. [RIO-perf]
- Comms discipline: quiet on voice during pulls except assigned calls; answer "how did you die" briefly. [GO] [EK]
- Bonus value: people who help outside raid (clips, notes, sitting in on log reviews). [RIO-app]

### 3.7 Attendance
- Mythic teams usually want ~90–95% attendance, and to be told about absences ahead of time. [recruit]
- Bench fairness: rotate who sits so nobody sits weeks in a row; benched players get first pick next week. [BLZ-bench]
  (Debrief's note builder already tracks who sat last raid.)

### 3.8 Bench, trials and recruitment
- **Trials**: a defined length (a few raids, two weeks, or a whole tier), written expectations, a check-in after week
  one, notes kept on each trial, a meeting on the end date. Decision on performance, attitude and fit. [RIO-app]
  [DivVII]
- **Applicant log review**: more than parses — median vs best, kill graph, then gems/enchants/consumables/buff uptimes,
  then replays for mechanics, positioning and deaths (defensive used? stone/pot ready? avoidable?). [RIO-app]
- **Benching**: not a punishment; a signal that everyone contributes. Warn at least once first; private, early (4–24 h
  notice); use concrete data; give a clear path back. Same standards for officers and friends — favoritism kills trust.
  [RIO-perf] [GO]
- A typical ladder: quick DM → sit-down with the raid lead and an officer → formal bench. [RIO-perf]

### 3.9 How it differs by guild level
| | Casual / AotC (Heroic) | Cutting Edge (mid Mythic) | Top 100 / Hall of Fame | World first (Liquid, Echo, Method) |
|---|---|---|---|---|
| Attendance | flexible, sign-ups | ~90% | 95%+ | full-time during the race |
| Consumables | encouraged, often guild-supplied | full, every pull | full + augment runes, guild-supplied | everything, every pull, splits for gear |
| Prep | know the fight basics | know the fight and your job; note loaded | study the fight before it opens; own assignments perfect | hundreds of pulls practised; strategy invented live |
| Parses | rarely checked | a filter (no single digits; ~50+ on prog) | high, but mechanics first | max output inside perfect execution |
| Mistakes | many forgiven; teaching | once forgiven; repeat → talk | very few forgiven; repeat → bench for that boss | expected near-zero; swaps per boss |
| Mentoring | the guild helps you improve | some help | you improve yourself | you improve yourself |
| Bench | rare | rotation + per-boss comp | per-boss comp, strict | per-boss comp, large roster |
Sources: [recruit] [GO-wiki] [RIO-perf: "higher-end guilds usually don't provide mentorship"] [BW-ulatek: 300+ pulls
practised] [norm]. Heroic guilds also bring 10–30 players (flex), so one weak player matters far less than on Mythic's
fixed 20. [GO-wiki]

---

## 4. Acceptable vs not acceptable (tolerance table)

"Forgiven once" = said once, no record. "Talking-to" = a DM or a word after raid. "Benched" = sits that boss/night or
loses the spot. CE-level defaults; casual guilds move each line one step softer, top guilds one step harsher.
Sources: [RIO-perf] [GO] [RIO-app] [EK] [MMOC] [norm]; the user's own rules where marked.

| Situation | Casual / AotC | Cutting Edge | Top guilds |
|---|---|---|---|
| Died once to a new mechanic while learning it | fine | fine | fine (first night) |
| Died to the **same** mechanic twice in a night | fine, a tip | forgiven once, then a word | talking-to |
| Same mechanic, week after week | a tip | talking-to → benched for that boss | benched for that boss |
| Stood in avoidable damage (one tick) | fine | fine | a word if it cost healing |
| Keeps standing in bad, raid-wide | a word | talking-to | benched |
| Died with a defensive/stone/pot ready, slow death (5+ s) [user] | a tip | a word | talking-to |
| Died in ≤2 s from healthy [user] | not on them | not on them | not on them (unless their mistake) |
| No defensive on a known, planned hit | a tip | a word | talking-to |
| Missed kick **on your assignment**, once | fine | a word right away | talking-to |
| Missed kicks on assignment repeatedly | a word | talking-to → benched | benched |
| Missed your soak / your group's soak once | fine | forgiven once [user: 1–2 missing is fine] | a word |
| Soaked with the wrong group | a tip | a word | talking-to |
| No flask or food on a progression pull | often fine | a word (repeat: talking-to) | talking-to, maybe benched |
| Missing enchants/gems on raid night | a tip | talking-to | not invited until fixed |
| No combat potion all night | fine | a word | talking-to |
| Note not loaded / didn't read the plan | a tip | a word | talking-to |
| Greed DPS that wipes the raid (skipping a soak/kick/move for damage) | a word | talking-to (if repeated, benched) | benched for that boss |
| Raid cooldown not pressed at its planned time | a tip | a word | talking-to |
| Kept DPSing/healing after the wipe was called (padding) | a word | talking-to | talking-to; repeat = removal |
| Talking over calls during pulls | a word | a word | talking-to |
| Late or no-show without notice | a word | talking-to; repeat = bench | removal |
| Low parse while doing a heavy job right | fine | fine | fine |
| Single-digit parses with no job, over weeks | help offered | talking-to + coaching | benched / trial failed |
| Rude, blaming others, tilting | a word | talking-to | removal |

Things that are almost never held against a player: being one-shot by a mechanic someone else failed, a 1-tick dip,
proc RNG gaps, overhealing [user], a low parse on an assignment-heavy role, a mistake on a pull that was already lost
[norm].

---

## 5. How raid leads review a night

### 5.1 Between pulls (60–90 seconds)
1. State the cause in one sentence, no blame ("We died to a missed kick at 72%").
2. Ask one targeted question if needed.
3. Name one change for the next pull (or "same plan, execute").
4. Call the next pull with a timer.
Structural issues (the plan itself) wait for after raid. [GO]
- Ask non-confrontationally how people died, especially the first few deaths. [MMOC]
- Wipefest's Discord bot can score each pull as it happens. [RIO-perf]

### 5.2 After the raid (5–30 minutes)
- Deaths and wipe causes first (who, when, what killed them). [concord] [RIO-perf]
- Are wipes getting further (best pull % per night) or flat? Same person dying first every pull? Which phase falls
  apart? [concord] [GO-wiki]
- Pattern failures (same player, same mechanic, several pulls), timing failures, role confusion, fatigue dips. [GO]
- Pick one metric to track next week to see if the fix worked. [concord]
- Keep it short: 20–30 minutes, twice a week, to avoid burnout. [GO]
- Feedback to individuals is private (DM); public callouts make people afraid to take risks. [GO]

### 5.3 The tools and what they score
| Tool | What it scores | How | What raid leads say it misses |
|---|---|---|---|
| **Warcraft Logs** | Damage/healing percentiles per spec and boss; deaths (last hits, defensives); damage taken; casts; buffs; replay; "Problems" (avoidable damage) | Percentile against uploaded logs, split by item level bracket; kills only for rankings | Doesn't know your assignments; parses ignore jobs, PI/Aug buffs and fight length; deep review takes long; no "why we wiped" [ARCHON-rank] [RIO-perf] [MMOC] |
| **Wipefest** | Per-mechanic ratings, player scores, insights, timeline (boss casts, debuffs, raid cooldowns, deaths), multi-pull analysis (paid) | Mechanics weighted by how often the cleanest kills of the last two weeks did them right; player score = "the raid's score if everyone did this mechanic like you"; early deaths cost the most | Doesn't read your note/assignments; generic per-boss rules; mechanic rules lag new tiers; multi-pull is paid [WF] [WF-VA] [WH-WF] |
| **WoWAnalyzer** | One player's spec play: checklist (green/red), suggestions (Major/Average/Minor), stats, timeline | Spec modules and an APL checker approximating guides (first rule that applies; cooldowns kept out because holding can be correct; utility ignored) | One player at a time; nothing about mechanics; specs vary in depth; no raid view [WA-guide] [WA-APL] |
| **Raider.IO** | M+ score, raid progress, recruitment profiles | Public progress/achievements | Not a performance review; says little about raid execution [RIO-app] |
| **NSRT (Northern Sky Raid Tools)** + Viserio/WoWUtils | The plan itself: assignments, cooldowns, groups; personal reminders on screen at the planned time | Raid lead exports notes; raiders import; "Share on Ready Check"; personal (red) / shared (blue) / text (green) reminders | Doesn't check afterwards whether the plan was followed (that's Debrief's Assignments check) [NSRT] [WOWU-NSRT] |
| **Built-in damage meter** (Midnight) | Damage/healing live, server-side | Blizzard's meter | Live only; no review [BLZ-UI] |

What all of them miss, in raid leads' own words: who was **assigned** to do what (so a missed job looks like nothing,
and a job done right looks like low damage); **why the pull was lost** in one line; **patterns across pulls and weeks**
for one player; and the time it takes to put it together. [RIO-perf] [MMOC] [GO] [norm]

---

## 6. Wipe causes

### 6.1 How progression guilds sort them
1. **Execution** — a mechanic failed: missed soak, kick, dispel, bait, position; a death that started the chain.
   Fix: the same plan, done right. Most progression wipes. [GO] [concord] [norm]
2. **Damage check** — the boss was too healthy when a hard point came (shield not broken, enrage, a phase that stacks).
   Signs: everyone alive, mechanics clean, boss % short at the key time. Fix: cooldown timing, Bloodlust/potion
   placement, comp, gear. [GO-wiki] [Debrief engine "raid damage check"]
3. **Healing / survival check** — the raid can't live through a damage window. Signs: deaths spread across the raid in
   one window, no single mechanic failed, cooldowns used. Fix: raid cooldown plan, personals called, more healers.
   [WCOACH]
4. **Strategy / plan** — the plan doesn't work (positions overlap, a soak group too small, a cooldown gap). Signs:
   people did what the note said and still died. Fix: change the plan (after raid, not between pulls). [GO]
5. **Fatigue / focus** — late-night dips, the same people suddenly sloppy. Fix: a break. [GO] [EG-wipes]
6. **Bad luck / bugs** — rare; raid leads are wary of blaming it. [norm]
- "Personal / external / structural" is another common split for each death: your own mistake, someone else's (e.g. a
  cooldown not used), or the plan. [concord]

### 6.2 Wipe call etiquette
- The raid lead (only) calls the wipe. When called: stop DPS, stop healing, die quickly (or run out to reset if the fight
  allows), don't release early on a kill-possible pull. [EK] [EG-raidrx] [norm]
- Don't keep DPSing a lost pull to pad meters; guilds remove people for it. [EG-pad] [JH]
- Call it early when the pull is clearly lost (3+ key deaths before a check, a soak group gone) — wasted minutes add up
  over a 300-pull boss. [norm]
- Keep voice quiet until the raid lead asks; answer "how did you die" in one line. [EK] [MMOC]
- Celebrate new phases and best pulls even on a wipe; take a short break after a streak of wipes. [GO-wiki] [EG-wipes]

---

## Sources
- [RIO-perf] Raider.IO, *Raiding 101: Performance Management* — https://www.raider.io/news/556-raiding-101-performance-management
- [RIO-app] Raider.IO (Gogogadgetkat), *Raiding 101: Finding and Trialing Your Ideal Applicant*, Aug 2023 — https://raider.io/news/547-raiding-101-finding-and-trialing-your-ideal-applicant (read in full in the browser)
- [ARCHON-rank] Warcraft Logs / Archon help, *Rankings and parses* (search summary; page blocks automated reading) — https://archon.gg/wow/articles/help/rankings-and-parses
- [WT-wcl] Warcraft Tavern, *How to use Warcraft Logs* — https://www.warcrafttavern.com/wow-classic/guides/how-to-use-warcraft-logs/
- [WF] Warcraft Logs / Archon help, *How to improve your raid with Wipefest* (search summary; page behind a bot check and WCL maintenance) — https://www.archon.gg/wow/articles/help/how-to-improve-your-raid-with-wipefest
- [WF-VA] Wipefest news, Venomous Abyss support live (Aug 20, 2026) — https://www.archon.gg/wow/articles/news/wipefest-venomous-abyss
- [WH-WF] Wowhead, *How to use Wipefest* (2020 user guide; insights scored as percentiles vs kills) — https://cn.tbc.wowhead.com/how-to-use-wipefest
- [WA-guide] Wowhead / Peak of Serenity, *How to use WoWAnalyzer* (checklist; Major/Average/Minor suggestions) — https://cn.tbc.wowhead.com/how-to-use-wowanalyzer
- [WA-APL] WoWAnalyzer GitHub wiki, *APLCheck* — https://github-wiki-see.page/m/WoWAnalyzer/WoWAnalyzer/wiki/APLCheck
- [MMOC] MMO-Champion, *Best way to check logs? Raid Leading* — https://www.mmo-champion.com/threads/2369057-Best-way-to-check-logs-Raid-Leading
- [GO] GuildOrder, *WoW Raid Leader Guide: Calls, Reviews, Burnout* — https://guildorder.com/games/wow/guides/raid-leadership
- [GO-wiki] GuildOrder, *WoW Raiding Guide: Difficulty Tiers, Preparation, and the Roster Boss* — https://guildorder.com/games/wow/wiki/raiding-guide
- [concord] Concord, *Reading WoW Raid Logs* and wowcoach/parsepal log guides (search summaries) — https://www.concordp2c.com/reading-wow-raid-logs-guide/
- [WCOACH] wowcoach.gg, *How to Read Your Healer Logs in WoW* — https://wowcoach.gg/blog/how-to-read-healer-logs-wow
- [recruit] Recruitment posts on Blizzard forums / Icy Veins / guildsofwow (90–95% attendance, full consumables, logs on request) — e.g. https://guildsofwow.com/existential-dread/post/14923/expectations-and-information
- [recruit-S2] Season 2 recruitment (vault, Omni-Folio) — https://guildsofwow.com/defiant-ones/post/16688/defiant-ones-is-recruiting-normalheroic-aotc-mythic-pushers-wanted-for-season-2
- [DivVII] Division VII team rules (trial attendance, mid-trial review) — https://guildsofwow.com/divisionvii/post/10230/bbs-team-rules
- [BLZ-bench] Blizzard forums, *How does your guild handle who sits for raids?* — https://us.forums.blizzard.com/en/wow/t/how-does-your-guild-handle-who-sits-for-raids/689659?page=2
- [BLZ-forum] Blizzard forums, parse and DPS-vs-mechanics threads — https://us.forums.blizzard.com/en/wow/t/dps-vs-mechanics/84454 , https://us.forums.blizzard.com/en/wow/t/so-what-is-considered-an-acceptable-parse-as-dps/1100798
- [EK] Eternal Kingdom, *A Beginner's Guide to Raid Etiquette* — https://www.eternal-kingdom.com/?p=13617
- [EG-raidrx] [EG-pad] [EG-wipes] Engadget/WoW.com columns on wipes, padding, and stopping heals on a wipe call — https://www.engadget.com/2010-08-19-raid-rx-5-reasons-why-youre-not-getting-healed.html , https://www.engadget.com/2011-06-10-ready-check-how-to-deal-with-multiple-wipes.html
- [JH] JudgeHype, raid leader removing players who kept DPSing after a wipe call — https://worldofwarcraft.judgehype.com/news/un-chef-de-raid-reclame-un-wipe-a-5-parce-que-ses-logs-sont-fichus-186197/
- [BW-prog] Blizzard Watch, *Officers' Quarters: 10 tips for progression* — https://blizzardwatch.com/2017/07/19/officers-quarters-10-tips-for-progression/
- [BW-ulatek] Blizzard Watch, Liquid's Ula'tek world first (300+ practised pulls) — https://blizzardwatch.com/2026/09/03/world-first-ulatek-venomous-abyss-liquid-win/
- [BLZ-VA] Blizzard, *Curse of Ula'tek: The Venomous Abyss Raid Goes Live August 18* — https://worldofwarcraft.blizzard.com/en-us/news/24294062
- [IV-HoF] Icy Veins, Ula'tek Hall of Fame closing — https://www.icy-veins.com/wow/news/guilds-still-on-ulatek-have-a-day-or-two-left-to-earn-their-hall-of-fame-title/
- [SERA] Seramate, Venomous Abyss hardest Heroic raid — https://seramate.com/news/2026/08/29/venomous-abyss-hardest-heroic-raid-1f1a3cba
- [WH-addons] Wowhead, *Combat addons disabled in end game content in Midnight* — https://www.wowhead.com/news/combat-addons-disabled-in-end-game-content-in-midnight-378679
- [BLZ-UI] Blizzard, *Midnight: Get up to Speed with User Interface Updates* — https://worldofwarcraft.blizzard.com/news/24223311
- [WT-UI] Warcraft Tavern, official damage meters and boss timers — https://www.warcrafttavern.com/wow/news/official-damage-meters-boss-timers-transmog-overhaul-coming-in-world-of-warcraft-midnight/
- [WIKI-API] Warcraft Wiki, *Patch 12.0.1/API changes* — https://warcraft.wiki.gg/wiki/Patch_12.0.1/API_changes
- [NSRT] [WOWU-NSRT] WoWUtils / Viserio, *NSRT guide* — https://wowutils.com/viserio-cooldowns/guide/nsrt-guide ; also `notes/Guides/NSRT notes - how they work.md`
- [Method Midnight] Method's Midnight consumables list (Healthstone rules) — https://www.method.gg/guides/list-of-all-midnight-consumables-enchants-and-gems
- Project library: `notes/Guides/Shared.md` (consumables, Midnight systems), `notes/Guides/Bosses/*` (per-boss mechanics and
  checks), memory rules tagged [user].

Gaps in this research (honest): Reddit is blocked in the browser and search didn't surface specific r/CompetitiveWoW
threads; Archon/Warcraft Logs help pages were behind a bot check or WCL maintenance (summaries used); no YouTube raid
leader talk was transcribed this round. Worth a second pass when WCL is back up: read the Wipefest and rankings help
pages in full, and one Liquid/Echo raid-lead interview.
