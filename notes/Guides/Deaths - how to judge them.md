# Deaths — how to judge them (Oct 22, 2026)

The user: "I want deaths to be heavily researched. I feel like deaths still aren't fairly/accurately being graded/coached."
This guide is the research, the audit of real pulls, the rules Debrief should use, and why. Sources are tagged in
brackets; never name them on the site.

Code today: one rule for the whole site, `deathVerdict(r, d)` in src/ui.js (why: own / ready / nothing / fast / raid / wipe,
weight 1 / 1 / 0.5 / 0 / 0 / 0), built on the engine's death recap (`explainDeaths`, `survivability` in src/engine.js).
Every tab reads it: Report card grade, Homework "Stay alive", the coach, Why we wiped, Who died, Copy for Discord.
So fixing the rule in one place fixes it everywhere.

---

## 1. What the research says

### How the tools count
- **Warcraft Logs death statistics** [WCL-deaths]: on a wipe, deaths stop counting at a cutoff (30 s before the end of
  the pull, moved by battle resses); "the first death **cluster** after the cutoff is included", then everything else is
  dropped "on the assumption that the wipe has been called". On kills, every death counts. A Shaman's Reincarnation is a
  save, not a death. Their warning about killing blows: "some abilities are simply small ticking DoTs, so even though that
  was the final killing blow, it may have been something else that really did the player in."
- **Wipefest** [WF-how]: a player's death lowers their score **by how early in the fight it happened**; a player who
  didn't die always gets full marks for Healthstones/potions; the deaths insight is judged against kills ("it's very
  common for kills of this fight to include multiple deaths"). It strips damage that was never avoidable for the person
  (the targeted player of a pool, the one soaking on purpose) [WF-aberrus], and admits it can't see "being forced to stand
  in something because of another player's movement".
- **A Midnight death study of the whole raid** [WC-va]: they threw out every death after **half the raid was already
  dead** (47% of all deaths: "they explain how a wipe ended, not why it started"), and only credit a killing hit if it
  was really lethal. Three lessons for every boss: fix the **first** death, not the biggest number; **tank cones kill
  non-tanks** (90%+ of Sever's victims weren't tanks); and **raid pulses are usually just the last hit**, finishing
  someone something else left low: "find the something else".
- **Wipe-review guides** [WC-why]: (1) who died first, (2) the 5–10 s before it, not just the last hit, (3) "had a
  defensive available **that would have saved them**", (4) the cascade (a second death within 10–15 s of the first was
  probably caused by it), (5) missed kicks, (6) what the fight was doing. Three death shapes: a **one-shot** (80%+ to
  dead in one hit: nearly always a failed mechanic), a **slow bleed** (healing, a missed defensive, or extra avoidable
  damage), and the sneaky one: **a big avoidable hit, then raid damage finishes them** (looks like healing, is positioning).
- **Raid leads** [RIO-perf] [IV-forum] [norm]: the Deaths tab is the core tool; questions are "avoidable?", "did they
  press a defensive or a potion?". Deaths after the wipe call don't count ("look at the first ones to die"). Blame
  culture after every wipe is called out as harmful [EG-pitchforks].

### Midnight facts checked in our own logs (Oct 21 night, 19 pulls)
- Combat potions and healing potions are **separate** cooldowns: 50 times a player drank both within 5 minutes.
- Healthstones: one per pull, **except Warlocks with Demonic Healthstone** (Arsyn used 2–3 a pull, about 60 s apart).
  Debrief today says a Warlock's stone is gone after the first one.

### How often the best kills have deaths (19 of the 20 fastest Mythic Coiled Altar kills, Oct 22)
- Median **2 deaths** per kill; only 2 of 19 kills had none; one had 12 (all in the last 10 s, as the orbs blew).
- Most kill deaths are in the **last 30 s** (Coalesced Venom as the fight ends). Deaths in the first half: 9 in 19 kills,
  to Axegrinder (4), Malevolent Resonance, Gravebound, Gloombomb, Guillotine, Soul Sever (tank).
- So: one death to Axegrinder or Gravebound in a night is normal even at the top; **repeats** and **the first death that
  starts a wipe** are what matter. Deaths in the final seconds of a kill are not worth a grade.

---

## 2. The audit (every counted death, Oct 21 Coiled Altar night)

Method: the real engine + the real `deathVerdict` run in node on the shared night (scratch scripts audit.js / propose.js,
see §6), plus the raw log for each death: the killing hit and its size against max health, health 15/10/5/2 s before,
time spent under 50% and under 35%, who else died within 1.5 s, auras (mind control, cheat-death), casts in the last 6 s.

**368 deaths, 105 counted** (the rest are after the wipe filter). Of the 105:

| Type | Count | Today | Fair |
|---|---|---|---|
| Mass one-hit wipe (3+ of us dead in the same second to the same hit: Venom Rupture ×14, ×8, ×11, ×14; Eternal Nightfall ×14) | 51 | 30 "had Ice Block / Barkskin ready" (full), 7 "own" (a small unrelated slip just before), 14 already zero | **not on them**: the raid's event (who caused it is Why we wiped's job) |
| …of those, an Eternal Nightfall wipe cast read as "fell off the platform" (the check matches "fall" inside "Nightfall") | (1) | own (full) | not on them (bug) |
| Mind-controlled off the edge (Dreadmarch) | 3 | own (full) | **shared** (half): the CC team stops you, you press the cancel macro |
| One hit from mid health, counted "ready" (e.g. 58% → dead in 1.3 s) | 2 | ready (full) | too fast (0) |
| A tiny dodgeable last hit made it "own" (8–16% of the damage) | 2 | own | judged on the rest |
| Raid's mistake, but sat at ~30% for 2–3 s with a Healthstone and potion | 3 | raid (0) | **shared** (half) |
| Fair as is (Sever, ghost collisions, Gravebound, axes, slow deaths with kit) | 44 | | |

**47 of 105 verdicts (45%) were unfair**: 44 too harsh, 3 too soft. And **50 of the 105 coaching lines** say the wrong thing:

- **35** one-shot or mass deaths still say "Press Barkskin before Venom Rupture lands. It was ready."
- **9 of 9 Gravebound deaths** give the wrong fix ("Press Ice Block before Gravebound lands", "This looks like a raid
  damage check", "Healthstone would have bought time"). Gravebound hit for 17–34 million (18–33× their health); the only
  fix is walking over your soul fragments.
- **6** more "own" deaths tell them to press a defensive instead of the mistake's fix (Toxic Deluge: "Use Fortifying Brew").

What this did to grades (sum of death weights for the night): Komo 9 → 5, Larryg 9 → 5, Shockabunga 7 → 3,
Boltzzx 6 → 3, Kargaryen 6 → 3, Flëxørçïst 6 → 2.5, Huservoker 5 → 1.5 … raid total **86 → 46**.

Other nights, same story:
- Twin Fangs, Wolfthorn pull 36 (9DRWhKnZbHtQgf4a): one Caustic Globule killed 16 at 5:08; today 12 of them are "their
  own mistake".
- World #6 Coiled Altar kill (RtHcmfLyTAdhGCa9 33): 10 players charged for dying in the last 10 s as the kill ends;
  world #1 (xw649bM3KCvFtDqn 49): its tank charged for dying 12 s before the kill.

Full table: §7.

---

## 3. The rules (proposed), rated

The user's rules stay: three flags; 2 s or less isn't on you; slow with kit ready is; never flag overhealing; after the
wipe filter, only your own avoidable death while fewer than a quarter of the raid is dead.

| # | Rule | Rating | Why |
|---|---|---|---|
| 1 | **Mass deaths are the raid's.** 3+ of us dead within 1.5 s to the same hit = one raid event, on nobody's grade, except the player whose own mistake *was that hit* (stood in that Sever, their ghost touched). Why we wiped names what caused it. | **Amazing** | Covers 51 of the 105 counted deaths on the night; it's what every raid lead and tool does (WCL clusters, "one-shot by a mechanic someone else failed" is never held against you). |
| 2 | **Coaching follows the verdict.** Own → the fix for the mistake that killed them (Gravebound → "walk over every soul fragment"). Too fast or mass → "Nothing you could do in time" plus what hit them, no "press a defensive". A hit bigger than 1.5× their health → only an immunity is ever suggested. | **Amazing** | 50 death lines today tell players the wrong thing; this is what they actually read. |
| 3 | **"Too fast" counts from 50% health, not 90%.** A hit from 70% to dead in one second is a one-shot. Tanks keep the 90% measure (they sit at half health on purpose). | **Solid** | It's what the rule's own comment already says ("from healthy, or from 50%+"); the code measures from the last time they were at 90%. |
| 4 | **Healthstone/potion only with time to use it** (2+ s at or under 35%, the user's Oct 19 rule). `deathVerdict` ignores this today; the Report card's tiles already use it. | **Solid** | One rule, everywhere. |
| 5 | **Raid's mistake + time at low health + kit ready = half** ("the adds lived too long, but you sat at 30% for 3 s with a Healthstone"). | **Solid** | Today it's zero; a raid lead would say both things. |
| 6 | **Mind-controlled off the edge = half**, coached as "press your cancel macro, and the CC team stops you". | **Solid** (the user's call) | The player can't move; the CC team failed too. Today it's full blame. |
| 7 | **Fix "Nightfall" read as a fall.** | **Amazing** | A plain bug; Eternal Nightfall wipes are being blamed on one player as their own mistake. |
| 8 | **A small last hit doesn't make it "own".** A dodgeable hit counts only if dodgeable damage did 25%+ of what killed them (or it was a big hit itself). | **Solid** | Flëxørçïst pull 9: an 8% axe tick made a raid wipe "her own mistake". |
| 9 | **The last 20 s of a kill are info only** (unless it's their own mistake). | **Solid** | Top kills die there; nobody grades the kill's last seconds. |
| 10 | **Warlocks' Demonic Healthstone comes back after 60 s.** | Lackluster | Right, but rarely changes a verdict. |
| 11 | **Raid cooldowns (Rallying Cry, Darkness) are never "your personal ready".** | Lackluster | They're on the note's plan, not yours to press for yourself. |
| 12 | "Nothing left + little healing came in" → 0 instead of half. | Bad (skip) | The log can't tell out-of-range from healer error; leave it at half. |

Order inside `deathVerdict` after the change: wipe (after the filter) → kill's last 20 s → **mass** → mind-controlled →
own (with the 25% rule) → fast (50% measure) → raid (+ shared) → ready (kit needs 2 s low) → nothing.

---

## 4. What each death should say (wording)

Raid lead voice, short, "you", the fix first (see recap-raid-lead-voice, debriefing-coach).
- Own: "You died to Sever: you were in the cone. Next time: only the tank stands in front of Zul'jan."
- Gravebound: "Gravebound killed you: a soul fragment was missed. Next time: stop casting and walk over every fragment."
- Ready: "You went from 98% to dead over 14 s with Unending Resolve ready. Next time: press it when you drop under half."
- Fast: "Too fast to react: Sever took you from 91% to dead in 0.4 s. Nothing to fix on your side."
- Mass: "Not on you: Venom Rupture killed 14 of us at once (a purple orb blew into the pile)."
- Shared: "The adds lived too long, and you sat at 30% for 3 s with a Healthstone. Next time: Healthstone when you sit low."
- Mind control: "Dreadmarch walked you off the edge. Press your cancel macro; the CC team stops you."
- Kill's end: "Died in the last seconds of the kill. Doesn't count."

---

## 5. Notes for other owners
- The Coiled Altar module logs "A purple orb exploded into other orbs" a few seconds **after** the deaths it caused
  (pull 3: deaths 1:34, mistake 1:41), and "Sever popped about 20 orbs" at 0:23 for deaths at 0:20, so deaths can't link
  to it (links look 4 s back). Why we wiped should time the cause at the explosion.
- Dreadmarch fall check: `/fall/i` matches "Eternal Nightfall" (engine.js, the mind control rows). Use the log's
  environment type "Falling" only.

## 6. How the audit was run (repeatable)
1. Download the shared night: `/api/night?id=…` (manifest) and `/api/night/part?id=&n=&m=` (gzip parts).
2. `audit.js <src> <night> <out.json>`: runs `E.analyze` on each pull, slices `deathVerdict`/`deathOwn`/`cutInfo` out of
   ui.js, and reads the raw lines for the killing hit (overkill, % of max health), auras and casts at death.
3. `propose.js out.json`: the proposed rules side by side, per-death and per-player weight changes.
4. Other nights: `wclnight.js <src> <code> <fights> <dir>` turns Warcraft Logs fights into the same night folder (through
   debriefme.io's `/api/report` and `/api/fightlog`, then `W.translate`). Top kills: `/api/topkills?e=3429&d=5&p=1`,
   deaths per kill: `/api/deaths?code=&s=&e=`.
Scripts are kept in the shared notes folder of this group of sessions (deaths-audit/).

## Sources
- [WCL-deaths] Warcraft Logs / Archon, "Death Statistics" help article (wipe cutoff, death clusters, killing blows).
- [WF-how] Archon, "How to Improve Your Raid With Wipefest" (Raid Score, Player Score, deaths by how early).
- [WF-aberrus] Archon, "Wipefest: Aberrus" (unavoidable damage filtered for targeted players).
- [WC-va] WowCoach, "What Kills Raids in the Venomous Abyss: Every Boss, by the Numbers" (Oct 16, 2026).
- [WC-why] WowCoach, "How to Figure Out Why You Wiped in WoW" (Oct 7, 2026).
- [RIO-perf] Raider.IO, "Raiding 101: Performance Management".
- [IV-forum] Icy Veins forums, "Raid leading tips".
- [EG-pitchforks] Engadget, "Officers' Quarters: Pitchforks and torches".
- [norm] common raid-lead practice (see Raiding - what matters.md).
- Our logs: shared night PLRbTkpI_S3vOfdSwJrDZw; 9DRWhKnZbHtQgf4a (Twin Fangs); top kills RtHcmfLyTAdhGCa9 33, xw649bM3KCvFtDqn 49.

---

## 7. Every counted death on the Oct 21 night

Columns: the hit that killed them (size as % of their max health), health 15/10/5/2 s before, what the site says today
(verdict, weight, its first coaching line), the fair call, and whether today is fair.

| Pull | Time | Who | Killed by (hit, % of health) | 15 s before | Site today | Fair call | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | 3:00 | Volkovod (Beast Mastery Hunter) | Retaliatory Malice 19% | 67%→68%→38%→32% · RAID Spiritcackle @3:00 High: 1 player died to Retaliatory Malice whil | raid 0 — Healthstone or a healing potion would have bought time. | shared 0.5 | too soft |
| 1 | 3:30 | Fourinches (Unholy Death Knight) | Malevolent Resonance 35% | 62%→100%→81%→83% · Malevolent Resonance @3:29 High: Their ghost touched another ghost (wi | own 1 — Only you can see your ghost on Mythic. Hold it near the mark | own 1 | fair |
| 1 | 3:30 | Jangokin (Balance Druid) | Malevolent Resonance 58% | 93%→95%→79%→74% · Malevolent Resonance @3:29 High: Their ghost touched another ghost (wi | own 1 — Only you can see your ghost on Mythic. Hold it near the mark | own 1 | fair |
| 1 | 4:17 | Schooty (Marksmanship Hunter) | Malevolent Resonance 53% | 60%→84%→90%→55% · 3 died together · Malevolent Resonance @4:16 High: Their ghost touched another ghost (wi | own 1 — Only you can see your ghost on Mythic. Hold it near the mark | own 1 | fair |
| 1 | 4:18 | Shockabunga (Elemental Shaman) | Malevolent Resonance 51% | 83%→96%→77%→7% · 6 died together · Malevolent Resonance @4:16 High: Their ghost touched another ghost (wi | own 1 — Only you can see your ghost on Mythic. Hold it near the mark | own 1 | fair |
| 2 | 3:03 | Dashtoswirly (Havoc Demon Hunter) | Gravebound 1857% | 100%→27%→89%→90% | own 1 — No mistake found in the log and nothing was left to press. T | own 1 | fair |
| 2 | 3:29 | Boltzzx (Arcane Mage) | Axegrinder 11% | 64%→100%→99%→89% | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | own 1 | fair |
| 2 | 3:40 | Fourinches (Unholy Death Knight) | Gravebound 1937% | 87%→80%→96%→100% | own 1 — Press Icebound Fortitude before Gravebound lands. It was rea | own 1 | fair |
| 2 | 3:40 | Zaffia (Subtlety Rogue) | Gravebound 2734% | 86%→41%→100%→100% | own 1 — Use Cloak of Shadows or Evasion when your health starts drop | own 1 | fair |
| 2 | 4:13 | Kargaryen (Devastation Evoker) | Malevolent Resonance 46% | 93%→75%→98%→48% · Malevolent Resonance @4:10 High: Their ghost touched another ghost (wi | own 1 — Only you can see your ghost on Mythic. Hold it near the mark | own 1 | fair |
| 3 | 1:34 | Boltzzx (Arcane Mage) | Venom Rupture 67% | 95%→99%→95%→78% · 14 died together | ready 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | mass 0 | too harsh |
| 3 | 1:34 | Arsyn (Affliction Warlock) | Venom Rupture 88% | 100%→100%→83%→84% · 14 died together | ready 1 — Use Unending Resolve when your health starts dropping. It wa | mass 0 | too harsh |
| 3 | 1:34 | Komo (Demonology Warlock) | Venom Rupture 88% | 89%→100%→76%→73% · 14 died together | ready 1 — Use Unending Resolve when your health starts dropping. It wa | mass 0 | too harsh |
| 3 | 1:34 | Schooty (Marksmanship Hunter) | Venom Rupture 73% | 82%→78%→93%→21% · 14 died together | ready 1 — Use Aspect of the Turtle or Exhilaration when your health st | mass 0 | too harsh |
| 3 | 1:34 | Shockabunga (Elemental Shaman) | Venom Rupture 93% | 86%→94%→85%→70% · 14 died together | ready 1 — Use Astral Shift when your health starts dropping. It was re | mass 0 | too harsh |
| 3 | 1:34 | Huservoker (Preservation Evoker) | Venom Rupture 116% | 90%→100%→100%→90% · 14 died together | fast 0 — No mistake found in the log and nothing was left to press. T | mass 0 | fair |
| 3 | 1:34 | Volkovod (Beast Mastery Hunter) | Venom Rupture 96% | 96%→100%→86%→77% · 14 died together · Mutagenic Venom @1:31 Low: Stood within 6 yards of a purple orb carrie | own 1 — Purple carriers have right of way. Stay more than 6 yards fr | mass 0 | too harsh |
| 3 | 1:34 | Larryg (Arms Warrior) | Venom Rupture 104% | 80%→100%→81%→91% · 14 died together | fast 0 — No mistake found in the log and nothing was left to press. T | mass 0 | fair |
| 3 | 1:34 | Dashtoswirly (Havoc Demon Hunter) | Venom Rupture 93% | 96%→100%→100%→89% · 14 died together | fast 0 — No mistake found in the log and nothing was left to press. T | mass 0 | fair |
| 3 | 1:34 | Earthday (Balance Druid) | Venom Rupture 103% | 97%→98%→76%→92% · 14 died together | fast 0 — Press Barkskin before Venom Rupture lands. It was ready. | mass 0 | fair |
| 3 | 1:34 | Ashdknight (Mistweaver Monk) | Venom Rupture 98% | 89%→92%→93%→90% · 14 died together | fast 0 — Press Fortifying Brew before Venom Rupture lands. It was rea | mass 0 | fair |
| 3 | 1:34 | Kargaryen (Devastation Evoker) | Venom Rupture 103% | 84%→100%→94%→98% · 14 died together | fast 0 — Press Obsidian Scales before Venom Rupture lands. It was rea | mass 0 | fair |
| 3 | 1:34 | Jangokin (Balance Druid) | Venom Rupture 103% | 96%→100%→98%→76% · 14 died together | ready 1 — Use Barkskin when your health starts dropping. It was ready. | mass 0 | too harsh |
| 4 | 2:51 | Ashdknight (Mistweaver Monk) | Retaliatory Malice 20% | 90%→100%→85%→88% · RAID Spiritcackle @2:51 High: 5 players died to Retaliatory Malice whi | raid 0 — Healthstone or a healing potion would have bought time. | fast 0 | fair |
| 4 | 2:52 | Komo (Demonology Warlock) | Dreadful Presence 14% | 93%→71%→94%→35% · RAID Spiritcackle @2:51 High: 5 players died to Retaliatory Malice whi | raid 0 — Use Mortal Coil when your health starts dropping. It was rea | shared 0.5 | too soft |
| 4 | 3:01 | Flëxørçïst (Holy Paladin) | Axegrinder 11% | 85%→9%→94%→42% · 4 died together | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | own 1 | fair |
| 5 | 2:13 | Larryg (Arms Warrior) | Toxic Deluge 61% | 39%→97%→23%→62% · Axegrinder @2:06 Low: Walked into it once, for 643,536 avoidable damag | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | own 1 | fair |
| 5 | 2:13 | Ashdknight (Mistweaver Monk) | Toxic Deluge 70% | 47%→71%→86%→60% | own 1 — Use Fortifying Brew when your health starts dropping. It was | own 1 | fair |
| 5 | 3:21 | Fourinches (Unholy Death Knight) | Melee | 100%→85%→63%→64% · Dreadmarch @3:21 High: Died with no damage in the seconds before in P2 | own 1 — Cancel shields and absorbs when mind controlled, and keep a  | shared 0.5 | too harsh |
| 5 | 3:56 | Boltzzx (Arcane Mage) | Eternal Nightfall 159% | 81%→88%→64%→100% · 14 died together · RAID Eternal Nightfall @3:56 High: Eternal Nightfall finished casting, | own 1 — Cancel shields and absorbs when mind controlled, and keep a  | mass 0 | too harsh |
| 6 | 0:18 | Schooty (Marksmanship Hunter) | Mutagenic Venom 16% | 85%→91%→100%→93% | fast 0 — Press Aspect of the Turtle before Mutagenic Venom lands. It  | fast 0 | fair |
| 6 | 0:20 | Fourinches (Unholy Death Knight) | Venom Rupture 62% | 98%→99%→99%→25% · 8 died together | ready 1 — Use Icebound Fortitude or Anti-Magic Shell when your health  | mass 0 | too harsh |
| 6 | 0:20 | Komo (Demonology Warlock) | Venom Rupture 89% | 97%→65%→97%→27% · 8 died together | ready 1 — Use Unending Resolve when your health starts dropping. It wa | mass 0 | too harsh |
| 6 | 0:20 | Huservoker (Preservation Evoker) | Venom Rupture 105% | 93%→76%→96%→47% · 8 died together | ready 1 — Use Obsidian Scales when your health starts dropping. It was | mass 0 | too harsh |
| 6 | 0:20 | Volkovod (Beast Mastery Hunter) | Venom Rupture 85% | 94%→88%→79%→61% · 8 died together | ready 1 — Use Aspect of the Turtle or Exhilaration when your health st | mass 0 | too harsh |
| 6 | 0:20 | Larryg (Arms Warrior) | Venom Rupture 92% | 93%→97%→97%→19% · 8 died together | ready 1 — Use Die by the Sword when your health starts dropping. It wa | mass 0 | too harsh |
| 6 | 0:20 | Kargaryen (Devastation Evoker) | Venom Rupture 84% | 98%→99%→97%→33% · 8 died together | ready 1 — Use Obsidian Scales when your health starts dropping. It was | mass 0 | too harsh |
| 6 | 0:20 | Jangokin (Balance Druid) | Venom Rupture 57% | 74%→74%→91%→11% · 8 died together | ready 1 — Use Barkskin when your health starts dropping. It was ready. | mass 0 | too harsh |
| 6 | 0:20 | Earthday (Balance Druid) | Venom Rupture 94% | 97%→99%→96%→23% · 8 died together | ready 1 — Use Barkskin when your health starts dropping. It was ready. | mass 0 | too harsh |
| 7 | 1:57 | Volkovod (Beast Mastery Hunter) | Axegrinder 10% | 98%→49%→62%→50% | own 1 — Use Aspect of the Turtle or Exhilaration when your health st | ready 1 | fair |
| 7 | 2:13 | Ashdknight (Mistweaver Monk) | Toxic Deluge 60% | 27%→92%→96%→61% | own 1 — Use Fortifying Brew when your health starts dropping. It was | own 1 | fair |
| 7 | 2:16 | Larryg (Arms Warrior) | Axegrinder 12% | 47%→82%→72%→67% | own 1 — Healthstone or a healing potion would have bought time. | fast 0 | too harsh |
| 8 | 0:54 | Komo (Demonology Warlock) | Mutagenic Venom 13% | 98%→85%→84%→22% | ready 1 — Use Unending Resolve when your health starts dropping. It wa | ready 1 | fair |
| 8 | 1:56 | Boltzzx (Arcane Mage) | Venom Rupture 115% | 70%→97%→60%→27% · 11 died together | ready 1 — Use Ice Block when your health starts dropping. It was ready | mass 0 | too harsh |
| 8 | 1:56 | Komo (Demonology Warlock) | Venom Rupture 94% | 69%→68%→89%→37% · 11 died together | ready 1 — a healing potion would have bought time. | mass 0 | too harsh |
| 8 | 1:56 | Schooty (Marksmanship Hunter) | Venom Rupture 127% | 88%→91%→78%→27% · 11 died together | ready 1 — Use Aspect of the Turtle or Exhilaration when your health st | mass 0 | too harsh |
| 8 | 1:56 | Shockabunga (Elemental Shaman) | Venom Rupture 123% | 64%→94%→53%→64% · 11 died together | ready 1 — Use Astral Shift when your health starts dropping. It was re | mass 0 | too harsh |
| 8 | 1:56 | Huservoker (Preservation Evoker) | Venom Rupture 99% | 98%→79%→99%→57% · 11 died together | ready 1 — Healthstone or a healing potion would have bought time. | mass 0 | too harsh |
| 8 | 1:56 | Volkovod (Beast Mastery Hunter) | Venom Rupture 108% | 95%→98%→86%→34% · 11 died together · Axegrinder @1:51 Low: Walked into it once, for 398,343 avoidable damag | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | mass 0 | too harsh |
| 8 | 1:56 | Larryg (Arms Warrior) | Venom Rupture 119% | 93%→85%→70%→75% · 11 died together | ready 1 — Healthstone or a healing potion would have bought time. | mass 0 | too harsh |
| 8 | 1:56 | Earthday (Balance Druid) | Venom Rupture 87% | 71%→75%→42%→56% · 11 died together | ready 1 — Healthstone or a healing potion would have bought time. | mass 0 | too harsh |
| 8 | 1:56 | Ashdknight (Mistweaver Monk) | Venom Rupture 127% | 76%→64%→96%→66% · 11 died together | ready 1 — Use Fortifying Brew when your health starts dropping. It was | mass 0 | too harsh |
| 8 | 1:56 | Kargaryen (Devastation Evoker) | Venom Rupture 131% | 98%→96%→100%→76% · 11 died together | ready 1 — a healing potion would have bought time. | mass 0 | too harsh |
| 8 | 1:56 | Jangokin (Balance Druid) | Venom Rupture 114% | 86%→97%→100%→55% · 11 died together | ready 1 — Use Barkskin when your health starts dropping. It was ready. | mass 0 | too harsh |
| 9 | 2:11 | Boltzzx (Arcane Mage) | Venom Rupture 102% | 71%→87%→98%→83% · 5 died together · RAID Guillotine @2:08 High: Guillotine was soaked by only 2 players (V | fast 0 — Press Ice Block before Venom Rupture lands. It was ready. | mass 0 | fair |
| 9 | 2:11 | Huservoker (Preservation Evoker) | Venom Rupture 113% | 54%→99%→99%→78% · 5 died together · RAID Guillotine @2:08 High: Guillotine was soaked by only 2 players (V | fast 0 — No mistake found in the log and nothing was left to press. T | mass 0 | fair |
| 9 | 2:11 | Earthday (Balance Druid) | Venom Rupture 101% | 51%→82%→91%→74% · 5 died together · RAID Guillotine @2:08 High: Guillotine was soaked by only 2 players (V | raid 0 — Healthstone or a healing potion would have bought time. | mass 0 | fair |
| 9 | 2:11 | Ashdknight (Mistweaver Monk) | Venom Rupture 103% | 59%→75%→95%→75% · 5 died together · RAID Guillotine @2:08 High: Guillotine was soaked by only 2 players (V | raid 0 — Use Fortifying Brew when your health starts dropping. It was | mass 0 | fair |
| 9 | 2:11 | Flëxørçïst (Holy Paladin) | Axegrinder 9% | 31%→74%→84%→100% · 5 died together · RAID Guillotine @2:08 High: Guillotine was soaked by only 2 players (V | own 1 — Press Lay on Hands before Axegrinder lands. It was ready. | mass 0 | too harsh |
| 10 | 1:42 | Kargaryen (Devastation Evoker) | Coalesced Venom 1% | 83%→97%→94%→64% · Axegrinder @1:41 Low: Walked into it once, for 596,965 avoidable damag | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | own 1 | fair |
| 10 | 1:58 | Tyralien (Protection Paladin) | Axegrinder 7% | 69%→93%→60%→70% | ready 1 — Use Divine Shield or Ardent Defender when your health starts | ready 1 | fair |
| 10 | 2:05 | Larryg (Arms Warrior) | Sever 142% | 72%→63%→94%→98% · Sever @2:05 High: Stood in Sever (tank frontal) for 1,359,208 and pick | own 1 — Only the tank belongs in front of the boss. Stay out of the  | own 1 | fair |
| 11 | 1:34 | Komo (Demonology Warlock) | Mutagenic Venom 14% | 95%→100%→96%→51% | ready 1 — Use Unending Resolve when your health starts dropping. It wa | fast 0 | too harsh |
| 11 | 1:43 | Komo (Demonology Warlock) | Axegrinder 9% | 78%→51%→0%→41% · Axegrinder @1:42 Low: Walked into it once, for 340,721 avoidable damag | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | own 1 | fair |
| 11 | 1:46 | Flëxørçïst (Holy Paladin) | Noxious Ground 13% | 68%→68%→54%→56% | own 1 — Use Divine Shield or Lay on Hands when your health starts dr | fast 0 | too harsh |
| 11 | 1:48 | Urgdragon (Augmentation Evoker) | Axegrinder 6% | 100%→97%→86%→40% | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | own 1 | fair |
| 12 | 1:48 | Jangokin (Balance Druid) | Sever 184% | 83%→77%→97%→82% · Sever @1:48 High: Stood in Sever (tank frontal) for 1,730,802 and pick | own 1 — Only the tank belongs in front of the boss. Stay out of the  | own 1 | fair |
| 12 | 1:52 | Huservoker (Preservation Evoker) | Venom Rupture 15% | 99%→76%→68%→18% · Mutagenic Venom @1:51 Low: Stood within 6 yards of a purple orb carrie | own 1 — Purple carriers have right of way. Stay more than 6 yards fr | own 1 | fair |
| 13 | 1:00 | Arsyn (Affliction Warlock) | Sever 180% | 81%→89%→55%→99% · Sever @1:00 High: Stood in Sever (tank frontal) for 1,841,436 and pick | own 1 — Only the tank belongs in front of the boss. Stay out of the  | own 1 | fair |
| 13 | 3:07 | Komo (Demonology Warlock) | Gravebound 3074% | 77%→25%→69%→49% | own 1 — Use Unending Resolve when your health starts dropping. It wa | own 1 | fair |
| 13 | 3:30 | Boltzzx (Arcane Mage) | Malevolent Resonance 49% | 72%→100%→82%→77% · Malevolent Resonance @3:29 High: Their ghost touched another ghost (wi | own 1 — Only you can see your ghost on Mythic. Hold it near the mark | own 1 | fair |
| 13 | 3:31 | Larryg (Arms Warrior) | Malevolent Resonance 60% | 93%→88%→97%→75% · Malevolent Resonance @3:29 High: Their ghost touched another ghost (wi | own 1 — Only you can see your ghost on Mythic. Hold it near the mark | own 1 | fair |
| 13 | 3:33 | Earthday (Balance Druid) | Gloombomb 40% | 78%→93%→94%→81% · Gloombomb @3:33 Medium: Got clipped by someone else's Gloombomb, so th | own 1 — Gloombomb targets move to the add or to the side. Everyone e | own 1 | fair |
| 14 | 0:51 | Flëxørçïst (Holy Paladin) | Axegrinder 10% | 87%→100%→55%→69% · Guillotine @0:43 High: Died in the Guillotine soak. | own 1 — Soakers need a personal defensive or an immunity, and the ta | own 1 | fair |
| 14 | 1:52 | Dashtoswirly (Havoc Demon Hunter) | Axegrinder 10% | 100%→100%→93%→12% | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | own 1 | fair |
| 14 | 2:13 | Tyralien (Protection Paladin) | Venom Rupture 6% | 65%→76%→100%→92% · 11 died together · Guillotine @2:08 High: Died in the Guillotine soak. | own 1 — Soakers need a personal defensive or an immunity, and the ta | mass 0 | too harsh |
| 15 | 1:48 | Larryg (Arms Warrior) | Axegrinder 11% | 93%→90%→67%→79% | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | own 1 | fair |
| 15 | 2:15 | Shockabunga (Elemental Shaman) | Coalesced Venom 1% | 58%→100%→90%→59% | ready 1 — a healing potion would have bought time. | fast 0 | too harsh |
| 15 | 3:03 | Shockabunga (Elemental Shaman) | Gravebound 3297% | 94%→68%→78%→93% | own 1 — No mistake found in the log and nothing was left to press. T | own 1 | fair |
| 15 | 3:05 | Larryg (Arms Warrior) | Soul Sever 85% | 30%→60%→96%→84% · RAID Soul Sever @3:05 Low: 1 ghost was not in Soul Sever and stayed al | own 1 — Only the tank belongs in front of the boss. Stay out of the  | own 1 | fair |
| 16 | 0:53 | Komo (Demonology Warlock) | Mutagenic Venom 13% | 98%→83%→76%→44% · Axegrinder @0:52 Low: Walked into it once, for 378,349 avoidable damag | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | own 1 | fair |
| 16 | 3:07 | Boltzzx (Arcane Mage) | Gravebound 3235% | 100%→44%→61%→86% · 3 died together | own 1 — Press Ice Block before Gravebound lands. It was ready. | own 1 | fair |
| 16 | 3:07 | Volkovod (Beast Mastery Hunter) | Gravebound 3328% | 97%→53%→68%→68% · 3 died together | own 1 — Healthstone or a healing potion would have bought time. | own 1 | fair |
| 16 | 3:07 | Earthday (Balance Druid) | Gravebound 2694% | 90%→28%→37%→56% · 3 died together · Axegrinder @3:00 Low: Walked into it once, for 374,549 avoidable damag | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | own 1 | fair |
| 16 | 3:24 | Flëxørçïst (Holy Paladin) | Dreadful Presence | 94%→94%→76%→80% · Dreadmarch @3:24 High: Died with no damage in the seconds before in P2 | own 1 — Cancel shields and absorbs when mind controlled, and keep a  | shared 0.5 | too harsh |
| 17 | 1:00 | Shockabunga (Elemental Shaman) | Sever 149% | 77%→91%→87%→72% · Sever @1:00 High: Stood in Sever (tank frontal) for 1,483,614 and pick | own 1 — Only the tank belongs in front of the boss. Stay out of the  | own 1 | fair |
| 17 | 3:05 | Dashtoswirly (Havoc Demon Hunter) | Gravebound 1774% | 100%→56%→35%→74% | own 1 — Healthstone or a healing potion would have bought time. | own 1 | fair |
| 17 | 3:08 | Huservoker (Preservation Evoker) | Dreadful Presence | 100%→91%→65%→74% · RAID Soul Sever @3:07 Low: 2 ghosts were not in Soul Sever and stayed  | own 1 — Cancel shields and absorbs when mind controlled, and keep a  | shared 0.5 | too harsh |
| 17 | 3:31 | Schooty (Beast Mastery Hunter) | Gloombomb 34% | 76%→42%→70%→66% · 4 died together · Gloombomb @3:31 Medium: Got clipped by someone else's Gloombomb, so th | own 1 — Gloombomb targets move to the add or to the side. Everyone e | own 1 | fair |
| 18 | 1:34 | Komo (Demonology Warlock) | Venom Rupture 72% | 88%→100%→87%→67% · 14 died together | ready 1 — Use Dark Pact when your health starts dropping. It was ready | mass 0 | too harsh |
| 18 | 1:34 | Schooty (Beast Mastery Hunter) | Venom Rupture 94% | 89%→100%→98%→42% · 14 died together | ready 1 — Use Aspect of the Turtle or Exhilaration when your health st | mass 0 | too harsh |
| 18 | 1:34 | Shockabunga (Elemental Shaman) | Venom Rupture 92% | 92%→100%→100%→64% · 14 died together · Axegrinder @1:32 Low: Walked into it once, for 112,261 avoidable damag | own 1 — Dodge the Axegrinder axes. When Zul'jan throws them, anyone  | mass 0 | too harsh |
| 18 | 1:34 | Huservoker (Preservation Evoker) | Noxious Ground 10% | 93%→100%→92%→90% · 14 died together | own 1 — No mistake found in the log and nothing was left to press. T | mass 0 | too harsh |
| 18 | 1:34 | Volkovod (Beast Mastery Hunter) | Venom Rupture 95% | 87%→100%→81%→100% · 14 died together | fast 0 — Press Aspect of the Turtle before Venom Rupture lands. It wa | mass 0 | fair |
| 18 | 1:34 | Larryg (Arms Warrior) | Venom Rupture 104% | 91%→100%→78%→83% · 14 died together | ready 1 — a healing potion would have bought time. | mass 0 | too harsh |
| 18 | 1:34 | Dashtoswirly (Havoc Demon Hunter) | Venom Rupture 92% | 89%→100%→100%→90% · 14 died together | fast 0 — Press Blur before Venom Rupture lands. It was ready. | mass 0 | fair |
| 18 | 1:34 | Earthday (Balance Druid) | Venom Rupture 106% | 86%→100%→100%→81% · 14 died together | fast 0 — Press Barkskin before Venom Rupture lands. It was ready. | mass 0 | fair |
| 18 | 1:34 | Ashdknight (Mistweaver Monk) | Venom Rupture 104% | 98%→100%→81%→77% · 14 died together | ready 1 — Use Fortifying Brew when your health starts dropping. It was | mass 0 | too harsh |
| 18 | 1:34 | Kargaryen (Devastation Evoker) | Venom Rupture 102% | 85%→100%→79%→55% · 14 died together | ready 1 — Use Obsidian Scales when your health starts dropping. It was | mass 0 | too harsh |
| 18 | 1:34 | Jangokin (Balance Druid) | Venom Rupture 105% | 100%→100%→100%→43% · 14 died together | fast 0 — Press Barkskin before Venom Rupture lands. It was ready. | mass 0 | fair |
| 18 | 1:34 | Flëxørçïst (Holy Paladin) | Venom Rupture 109% | 92%→100%→100%→86% · 14 died together | ready 1 — Use Divine Shield when your health starts dropping. It was r | mass 0 | too harsh |
| 19 | 4:58 | Komo (Demonology Warlock) | Retaliatory Malice 17% | 100%→56%→37%→47% · RAID Spiritcackle @4:58 High: 2 players died to Retaliatory Malice whi | raid 0 — Use Unending Resolve or Mortal Coil when your health starts  | shared 0.5 | too soft |
| 19 | 4:59 | Vandagos (Protection Warrior) | Soul Sever 156% | 95%→94%→88%→81% · RAID Spiritcackle @4:58 High: 2 players died to Retaliatory Malice whi | own 1 — On the second stack use a defensive plus two externals, or s | own 1 | fair |
| 19 | 5:01 | Arsyn (Affliction Warlock) | Retaliatory Malice 20% | 87%→100%→84%→77% · RAID Spiritcackle @4:58 High: 2 players died to Retaliatory Malice whi | own 1 — Only you can see your ghost on Mythic. Hold it near the mark | own 1 | fair |
| 19 | 5:05 | Kargaryen (Devastation Evoker) | Malevolent Resonance 39% | 44%→100%→35%→27% · Malevolent Resonance @5:00 High: Their ghost touched another ghost (wi | own 1 — Only you can see your ghost on Mythic. Hold it near the mark | own 1 | fair |
