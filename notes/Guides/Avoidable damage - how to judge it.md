# Avoidable damage — how to judge it (Oct 22, 2026)

The user's ask: "Do the same thing for avoidable damage" (as the Deaths research). Avoidable damage drives the
"Fix these next raid" cards, the coach, Homework and the Report card, so a rule that is too strict tells every raider
to fix it. This file is the research, the audit of real pulls, the per-boss lists, the kill bars and the rules.
Checklist for the next boss / hotfix: `Avoidable damage - checklist.md`.

## 1. What the research says

**Wipefest** (the closest tool to what we do) [WF1][WF2]:
- Scores every mechanic 0–100 **against a large sample of recent kills**: 50 = an average kill. Not against a fixed number.
- Mechanics are ranked by how often the **cleanest kills** got them right.
- **Removes damage the target can't avoid** ("players targeted by X always take damage, as well as players within 10 yards…
  Wipefest removes the unavoidable damage taken by the targeted players"). Same for "hit on purpose" cases
  (Sarkareth: only the third case of three was avoidable).
- Player score = "what would the raid score be if everyone did what this player did" — so a player is compared to kills.
- It warns its own player scores miss context: "purposely taking damage to push DPS, being forced to stand in something
  because of another player's movement".
- Soaks, interrupts and dispels are a separate bonus: not everyone gets the same chance.

**Raid leads / guides** [IV][MMOC][CBT][GK][AMR]:
- Start from deaths: was the first death avoidable? Then look for **repeat** offenders, not single ticks.
- Compare a player with the rest of the raid **on the same ability**, and by role (melee stand closer).
- One tick of avoidable damage is fine at every level below the very top; "keeps standing in bad" gets a word.
  (Our tolerance table in `Raiding - what matters.md`: "Stood in avoidable damage (one tick): fine / fine / a word if it cost
  healing".)
- If a player's last three hits were avoidable, the death is a "get out of it" problem, not a healing problem.
- An old Ask Mr. Robot study: top teams take under 1% of their damage from avoidable sources, struggling teams 14–27%.
  (Midnight's arenas are smaller and fill up: see Noxious Ground below. A share alone can't judge a player.)

**What this means for us**
1. Judge against what the fastest kills take **by the same point of the fight**, not a fixed number for the whole pull.
2. Leave out damage the player couldn't avoid (raid-wide fills, the target's own hit, a job that puts you in it).
3. Count **time standing in it** for pools and ground, **hits** for things that hit you (axes, circles, waves).
4. A death to it, or a dangerous hit (frontal on a non-tank, ghosts touching), is always worth saying.
5. Forgive once: a slip in one or two pulls of a night is a note, not a fix. Repeats and deaths lead.

## 2. The audit (real pulls, run through Debrief's own engine in node)

Method: `scratchpad/av/` scripts (copy kept in the shared notes folder): `audit.js` runs the engine on a shared night,
`wclaudit.js` on Warcraft Logs fights through debriefme.io (cached), `dist2.js`, `curve.js` and `bars.js` sum it up.
Wipe filter = the 2nd death, like the site's default.

### Today's rules flag the world's fastest kills as badly as us

| Boss (Mythic) | Kills read | Raiders flagged per pull today (non-tanks) | Old avoid score (Report card) |
|---|---|---|---|
| The Coiled Altar | 20 fastest | **73%** (our night: 63%) | kills 43–82 (world #1: 51 = F) |
| Entombed Sentinels | 10 | 47% | |
| The Twin Fangs | 10 | 44% (38% amber on 1–4 Stir/Storm hits) | |
| Nek'zali / Sszorak / Ula'tek | 10 / 10 / 6 | 26% each | |
| Vashnik | 10 | 24% | |
| The Lost Explorers | 10 | 20% | |
| Kith'ix | 6 | 15% | |
| Nymrissa | 10 | 4% | |

The world #1 Coiled Altar kill (poptart corndoG, 8:09): 14 of 20 raiders flagged, avoid score 51. KILL_BASE already
said it: avoidable damage was "done right" in **0 of 20** kills.

### The user's night (Coiled Altar Mythic, Oct 21, 19 pulls, `?night=PLRbTkpI_S3vOfdSwJrDZw`)

Today: "Avoidable damage" went wrong in **18 of 19** pulls; 63% of raiders flagged every pull; 248 flags.

| Source | Today: flags (amber/red) | Fair? | Kill bar (fastest 20) | New: amber/red |
|---|---|---|---|---|
| Noxious Ground (statue pools) | 186 / 5 | **Too harsh.** The 2nd Fangs (~1:31) fills the middle: 14–18 of 18 non-tanks get touched in *every* pull, in ours and in the kills (median 2 touches, same as the world's best). And too soft the other way: 20 s standing in it = 1 hit. | 9 in 10 kill raiders stay under 16 s in it | 18 / 1 (Ashdknight 17–27 s in 12 pulls: real) |
| Axegrinder | 24 / 13 | Mixed. Deaths fair. Bars were whole-pull, so a 1:35 pull and an 8:00 kill had the same 5/8 line. Kills: p90 3 hits by 2:00, 7 by 5:00. | 3 by 2:00 → 7 by 5:00 | 25 / 6 (6 deaths) |
| Tank frontals on non-tanks | 0 / 6 | Fair (3 died; kills: 3 hits in 20 kills) | any hit | 0 / 6 |
| Malevolent Resonance (ghosts) | 0 / 2 | Fair (both died) | any hit | 0 / 2 |
| Toxic Deluge impacts | 0 / 3 | Fair-ish: three deaths whose last hit was a Deluge circle (slow slides). Kept: dodge circles when low. | under 1 | 0 / 3 |
| Gloombomb (not your own) | 6 / 1 | Too harsh at 1 hit (kills: 0–1) | 1 | 1 / 0 |
| Volatile Venom (green carrier) | 1 / 0 | **Too soft**: our raid is clipped twice as often as kills (p90 4 vs 2 by 2:00). Low harm, so amber only. | 2 by 2:00 | 13 / 0 |
| Mutagenic Venom (purple carrier) | 1 / 0 | Fair | 1 | 1 / 0 |

**Unfair today, by type (this night):** raid-wide fill counted as a mistake (Noxious Ground, ~180 flags); whole-pull bars
that ignore fight length (Axegrinder, all bosses); one-hit amber where kills take 1–3 (Gloombomb, Living Venom, Caustic
Claws, Twin Fangs water); time in pools not counted (too soft); the same mistake counted twice (Entombed Sentinels'
Protovenom Eruption: its own section, the avoid panel and a rule-pack mistake).

**By boss (kills):** Coiled Altar (Noxious Ground, Axegrinder), Twin Fangs (Stir the Depths water / Sanguine Storm at 2 hits),
Entombed Sentinels (Living Venom at 1 hit, Protovenom Eruption double), Sszorak (Caustic Claws at 1 hit), Nek'zali
(Latent Cultist puddles), Lost Explorers (Aftershock craters: hits instead of time), Ula'tek (Warden's Protection,
Caustic Waves), Vashnik (Plague Froth nearby), Kith'ix (Nullshards), Nymrissa (fine).

**What a world-first raid lead would say about this night:** "Tanks: aim the frontals — 6 raiders hit in 4 pulls, 3 died.
Ghosts touched once (2 dead). Melee, the axes killed 6 of you: Dashtoswirly, Larryg, Boltzzx, Komo, Volkovod, and
Flëxørçïst once. Ashdknight, you stand in the poison pools every pull. Everyone else: fine." Under the new rules the
site says exactly that.

Notable: our raid takes **the same** Noxious Ground and Axegrinder damage per minute as the world's fastest kills.

## 3. The rules (new)

- **Kill bars.** For each boss's avoidable source, the 10–20 fastest Mythic kills (read through Debrief) give, at points in the
  fight (30 s, 60 s … 600 s), how much 9 in 10 of their non-tank raiders took by then (`AVOID_BASE` in engine.js; never lower
  later in the fight). A pull is judged at its own length (up to the wipe filter), using the next point at or after it.
- **Measure:** time standing in it (ticks ≈ seconds) for ground and pools (Noxious Ground, Defiled Ground, Caustic Residue,
  blood pools, Aftershock craters, Evil Eyes, Latent Cultist puddles); hits (times you walked into it) for everything else.
- **Amber** ("a bit more than most"): more than 9 in 10 raiders in the fastest kills by this point (and at least 2).
- **Red**: twice the amber line, a death to it, or any hit from a Dangerous source (tank frontals on non-tanks, ghosts
  touching, Falling Debris, Noxious Splash, Blast Wave, Soul Transfer).
- **The pull's flag** (Debriefing, Fix cards, Homework): yellow only when a raider is red. One or two raiders a little over
  the kills is normal (the kills have that too), so amber rows alone leave it green.
- **A raider's fixes:** red in any pull, or amber in 3+ pulls of the night (forgive once or twice).
- **Report card:** amber costs that raider 25 of the pull's points, red 100 (was 40/100). Kills now score 85–97.
- **Tanks** not judged (they hold the boss in it), unless it's their own job to avoid (tankJudged) or it killed them.
- **No kill bar yet** (Heroic, Normal, a new source): the Mythic bar for that source when there is one, else the old fixed
  numbers (amber 2 / red 5 hits, Dangerous any hit).
- **Damage caused by someone else:** carriers (green/purple orbs), Gloombomb targets, Plague Froth targets and Stygian
  targets are left out of their own source; the bystander is judged against the kills. Who walked into whom is not judged
  yet (needs positions both ways; idea parked).
- **One definition with Deaths:** the avoidable list for a boss is its avoid panel's sources (plus the rule pack's
  avoidable rules). Deaths' `ownAvoid` (avoidable did 50%+ of the last 15 s) uses the same list.

## 4. Per-boss avoidable sources (Mythic kill bars, Oct 22)

Format: source — harm — measure — 9-in-10 kill line by time (t: value). From `base.json`.

- **The Coiled Altar** (20 kills): Tank frontals on non-tanks — Dangerous — any hit. Malevolent Resonance — Dangerous — any.
  Noxious Ground — Harmful — seconds — 0:30 3 s, 2:00 16 s (the 2nd Fangs). Axegrinder — Harmful — hits — 0:30 1, 1:00 2,
  2:00 3, 2:30 4, 3:00 5, 4:00+ 7. Gloombomb (not your own) — 0. Mutagenic Venom — 0 → 1 from 2:00. Volatile Venom — Minor —
  1, 2 from 2:00, 3 from 7:00. Toxic Deluge impacts — Minor — 0. Defiled Ground — no kill hit it (fixed bars).
- **Entombed Sentinels** (10): Living Venom — 1 (whole fight). Protovenom Eruption — judged in its own section (Shifting
  Protovenom); removed from avoidable damage. Blood pools — no kill bar (fixed).
- **Vashnik** (10): Plague Wave — 1, 2 from 3:00 (13 deaths in 10 kills: deadly even for the best). Stygian Burst 0 → 1 at 4:00.
  Umbral Ejection 0. Plague Froth (nearby) 1 → 2 from 1:00 →.
- **Sszorak** (10): Caustic Claws ~0–1; Caustic Residue (seconds).
- **Nek'zali** (10): Latent Cultist (seconds) 0 → 3 s by 4:00; Anguished Echoes 0; Swirling Spirit 0.
- **The Lost Explorers** (10): Aftershock (seconds) 0 → 3 s; Blast Wave — Dangerous.
- **Ula'tek** (6): Caustic Waves, Fester Burst, Warden's Protection, Virulent Spit; Falling Debris and Noxious Splash Dangerous;
  Mephitic Thrash only when most of the raid dodged it (no kill hit).
- **Kith'ix** (6): Nullshards 1 → 2; Twisted Appendage 0–1; Venom Roar, Voidscar 0.
- **Nymrissa** (10): Lingering Frost 1 → 3 by 4:00; Water Jet 0; Swirling Whirlpools 0.
- **The Twin Fangs** (10): Stir the Depths water and Sanguine Storm keep their own section (amber 2 / red 5 hits; kills: p90 3, max 6). Amber no longer flags the pull; a kill bar for it is next.

Exact bars: `AVOID_BASE` in src/engine.js.

## 5. Proposed changes, rated

| Change | Rating | Why |
|---|---|---|
| Kill bars by time in the fight, per source (replaces fixed whole-pull bars) | **amazing** | Fixes most unfair flags on every boss at once, and it's the Wipefest method the user already liked (kill baselines). |
| Pools and ground judged by seconds in it, not "touches" | **solid** | Stops flagging the whole raid for the 2nd Fangs fill, and catches the one raider who stands in it 25 s. |
| Pull flag yellow only on a red row | **solid** | "18 of 19 wrong" becomes "12 of 19, each with a death or a frontal" — the kills: 11 of 20. |
| A raider's fix only for red, or amber in 3+ pulls | **solid** | Forgive once, the user's rule. |
| One avoidable list shared with Deaths (panel + rule pack) | **solid** | Noxious Ground and Toxic Deluge deaths were "avoidable" on Debriefing but not to the death rule. |
| Rule-pack avoidable mistakes follow the panel's verdict (no second opinion) | **solid** | Axegrinder's rule pack escalated at 5 hits regardless of fight length; now one answer. |
| Protovenom Eruption out of avoidable damage (own section) | **solid** | It was counted three times. |
| Report card amber cost 40 → 25 | **lackluster** | Small; makes the world's best kills land around A/B instead of F. |
| Who-walked-into-whom for carriers | **lackluster for now** | Real, but needs both players' paths; Low harm sources. Parked in Ideas. |
| Damage share of all damage taken (the AMR metric) | **bad** for grading | Midnight arenas fill with pools; a share can't tell a raider's fault. OK as a number on Graphs (already there). |

## Sources
[WF1] Archon, "How to Improve Your Raid With Wipefest" (Raid Score, Player Score, bonus mechanics, caveats).
[WF2] Archon, "Wipefest: Aberrus" (avoidable damage that isn't avoidable; targeted players removed; Sarkareth's three cases).
[IV] Icy Veins forums, raid leading tips (start with first deaths; compare with others hit by the same mechanic).
[MMOC] MMO-Champion, "Best way to check logs? Raid Leading" (Problems tab; mechanics over parses; ask non-confrontationally).
[CBT] "Evaluating Raiders with Warcraft Logs" (compare by ability and role; last three hits avoidable = not a healing problem).
[GK] Gordian Knot raiding guide part 3 (one category at a time; 1–3 actionable differences).
[AMR] Ask Mr. Robot blog (avoidable share: <1% top teams vs 14–27%).
Data: 20 fastest Coiled Altar Mythic kills + 10 (6 for Ula'tek and Kith'ix) fastest of every other boss, via debriefme.io
/api/topkills, Oct 22, 2026; the user's Oct 21 night.

## 6. Heroic (Oct 22, round 2)
The user: "Yes, fix Heroic avoidable damage the same way." Heroic used the Mythic lines, and on Vashnik every Plague Wave hit
was Dangerous: all 20 of the fastest Heroic kills were flagged (10 "failed", 319 red rows). Read the 20 fastest Heroic kills of
every boss (events saved by the Roll-out chat, offline) and built `AVOID_BASE_H` the same way (a source with no Heroic line falls
back to the Mythic one). Also:
- Vashnik Plague Wave is Harmful on every difficulty (judged against the kills; a death to it is still red).
- Ula'tek Falling Debris is Dangerous on Mythic only (13 of 20 Heroic kills had raiders clipped, nobody died).
- Red needs a real gap over the kills: twice the line and at least 3 more hits (5 more seconds for pools; pools' amber line is at
  least 3 s). A line of 1 hit had made 4 hits red where Heroic kills barely get touched.
- A Minor source is amber at most; only a death to it is red.
Heroic kills flagged yellow after (before): Vashnik 3 (20), Ula'tek 7 (17), Lost Explorers 9 (11), Coiled Altar 8 (6, frontals on
non-tanks and 9+ s in pools), Nymrissa 0 (4), the rest 0-3. None failed. The Mythic night stays at 12 of 19.
