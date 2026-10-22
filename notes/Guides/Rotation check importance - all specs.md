# Rotation check importance — all specs (Oct 22 2026)

Why: the new coach note on the Rotation tab leads with a player's top 3 fixes (red first, then the healing or damage the
mistake cost, then how much the check counts). The user saw "Infused Flash of Light on a Beacon" lead for their own Holy
Paladin and asked: is each thing the coach raises really important for that class? This file is the answer, spec by spec.

Tested on the shared night PLRbTkpI_S3vOfdSwJrDZw, pull 19 (The Coiled Altar Mythic, a 7:08 wipe in P3), all 20 players,
before and after (practice copies `rotchk0` = before, `rotchk` = after, `rotimp` = after with the coach note).

## How each check was judged
1. Does it turn yellow or red, what does it weigh (WT / GEN_TUNE / the entry's `w`), and does it carry a cost?
2. Is it a real priority for the spec and hero tree in both guides (notes/Guides/Classes/<Spec>.md)? Talent-gated where it should be?
3. Is the bar fair? A "good" bar should be one the top players clear on most bosses (SPEC_TOP: the middle of the players of the spec
   in the 20 fastest Mythic kills). A script (scratch, not in the repo) printed every graded check's bars and weight next to the top
   players' middle value per boss and flagged any bar the top players miss.
4. Is the reason (the "how" text) right, and does it give the coach a reason, not just the rule?

## Changes that affect every spec
- **A cost counts only what you lost next to the top players.** Before, every Infused Flash of Light off a Beacon counted as lost
  healing, but even the top Holy Paladins land only about 6 in 10 on a Beacon. Now a cost is scaled by the gap to the top
  players' number (when there is one): Flëxørçïst's Beacon line went from 2.19M to 352K, Divine Purpose from 1.02M to 510K,
  a Preservation Evoker's Temporal Anomaly from 5.9M to 2.9M. The line then says "Next to the top players, that cost about …".
- **A cost under 1% of your output no longer moves the order.** It's still said in the line, but "Work on these first" and the coach
  go by red, then a real cost, then weight. Before, 2 extra wasted Divine Purposes (0.3% of the healing) led over casting 74% of
  the time against the top players' 87%. Now Always be casting leads.
- **Wasted procs within reach of the top players are never red**: no more than twice the top players' count, or 2 more.
  Even the best waste some (Arcane Mages waste about 20 Clearcastings a kill).
- **Healers' wasted procs are never red** (shared engine: Mistweaver, Holy Priest, Restoration Shaman, Discipline): both guides
  spend healing procs into damage, so holding one in a quiet moment is right. The same for "Procs wasted in" a healer's window.
  Holy Paladin's own Infusion of Light line keeps its bar (it's the core of the spec, and the top players waste about 1).
- **"Cooldowns into the big hits"** (every healer): with only 1 or 2 cooldowns in a pull, one miss made it red; it's never red
  under 3 now. Its reason now leads with why ("a cooldown sent into a quiet moment is one you don't have when it hurts"),
  and says to follow the raid note when it sends one elsewhere.
- **The boss out of reach** (bug): while nobody in the raid had anything on the boss for 6+ seconds (an intermission, or the raid
  on another target), the priority list and the "damage over time through your window" line no longer judge your damage over
  time on the boss. The uptime lines already left those stretches out. On pull 19 both Balance Druids got about 90
  "Sunfire was about to fall off" slips after 2:26 with Sunfire up 100%: Rotation priority went 39% → 73% and 44% → 73%.
- **A cooldown's warn bar of 0 means never red**, as it already did for pairs (it silently fell back to the default 60%).

## Healers

### Holy Paladin (the user's spec) — hpalChecks
Can turn yellow/red (weight, cost?): Holy Shock 3 (cost), Infusion of Light 3 (cost), Holy Power wasted 2.5 (cost), Beacon of Virtue
uses 2 (cost), Beacon of Virtue windows 2, Divine Toll in Beacon of Virtue 2, Divine Toll uses 2 (cost), Always be casting 2,
Mana at the kill 2 (cost), priority 2, Eternal Flame over Light of Dawn 1.5, Avenging Wrath uses 1.5, Casting pace in Wings 1.5,
Casting in Wings 1.5, Infused Flash of Light on a Beacon 1 (cost), Divine Purpose 1 (cost), Flash of Light without an Infusion 1,
Judgment while Holy Shock was full 1, Procs wasted in Wings 1, Cooldowns into the big hits 2.
All match the guides' priorities: "Always be casting", "never generate at 5", Infusions on Flash of Light, Divine Toll and Aura
Mastery inside Beacon of Virtue (raid), Eternal Flame the best spender, use Divine Toll / Wings / Virtue as often as possible.
- **Infused Flash of Light on a Beacon: a real priority, confirmed.** Moment of Compassion is only worth it with Beacon of Virtue, and both
  guides then put every Flash of Light on a Beaconed player (Virtue or Savior). It only shows with Moment of Compassion, and it's
  yellow-only. What was wrong was its cost (all off-Beacon casts, not the gap to the top players' ~60%). Fixed by the cost change.
  Its reason now says why the top players land only about 6 in 10 (someone in danger without a Beacon comes first).
- **Flash of Light without an Infusion**: one inside Beacon of Virtue no longer counts. Wowhead's priority fills Beacon of Virtue
  with Flash of Light, and Icy Veins lists it as a good spell there. Its bar legend says "With an Infusion, or in Beacon of Virtue".
- **Casting in Avenging Wrath**: was 90% / 80% (red at 78% for Flëxørçïst, who cast more inside Wings than outside). Every other
  spec's window has used its own Always be casting bar since Oct 19 (a flat 90% put most top players red), so Holy Paladin
  does too: 75% good, under 60% red.
- Mana at the kill: top players end with 24-52%, bar 35% / 50%; the 10-point rule keeps a near miss yellow; its cost now counts
  only the mana past the top players. No change.
- Weights unchanged: Holy Shock and Infusion of Light count most, as the guides' core.

### Restoration Druid — rdruChecks
Graded: Lifebloom 3, Swiftmend 3, Abundance 2.5, HoTs on you 2, Swiftmend on yourself 1.5, Wild Growth on every target 2,
Tranquility / Convoke / Tree ramps 2, Convoke uses 2, Tranquility uses 1.5, mana 2, Innervate timing 1, Regrowth without
a discount 2, Clearcasting / Soul of the Forest 1.5, Lifebloom/Rejuvenation refreshed early, Rejuvenation batches, Regrowths
over Rejuvenations, Nature's Swiftness on yourself, Wild Growth into damage, Efflorescence.
All match "the raid rotation" in both guides (Lifebloom and Swiftmend on yourself, Abundance, Wild Growth only into danger).
- **Your HoTs on you**: was 90% / 75%, from the guide's "aim for 90%". The top players average 63-79% on every boss, so a top
  player was yellow. Now 70% / 55%, and the reason says so.
- **Convoke the Spirits uses**: was 85% / 70%; the top players use 80-89%. Now 80% / 65%.
- Ironbark stays shown, not graded (the raid's call).

### Preservation Evoker — pevkChecks
Graded: Temporal Anomaly on cooldown 3 (cost), Dream Breath 3 (cost), Essence Burst 3 (cost), Echoes that ran out 2.5 (cost),
Essence at full 2.5, Echoes used by Merithra's Blessing 2, Dream Breath at rank 1 2, Emerald Blossom without a burst 2, Stasis 2,
Stasis combos 2, ramps (Merithra's / Dream Breath / into damage), Twin Echoes, Inner Flame window, Source of Magic, mana 2.
- **Temporal Anomaly on cooldown**: was 72% / 60%; the top players sit at 67-80% (both guides: fine to skip a quiet moment).
  Now 65% / 50%.
- **Essence at full**: was 8% / 18% with a reason saying the top players lose 7%; they lose 11-21%. Now 15% / 25%, reason fixed.
- **Stasis uses**: 80% → 75% (top players 75-100%). **Tip the Scales**: 75% → 65% (top 67-100%).
- **Casting in Inner Flame**: 90% / 80% → the spec's own Always be casting bar (64% / 52%), like every other window.
- **Source of Magic**: missing it was red; it's a buff for another healer, so now yellow at worst.
- Stasis ending with Temporal Anomaly and Fire Breath before Stasis are one guide's advice (Icy Veins), weight 1: kept.

### Holy Priest, Discipline Priest, Restoration Shaman, Mistweaver Monk — GEN_SPECS
Bars match the top players (Holy Priest, Restoration Shaman, Mistweaver); Discipline has no top-player numbers yet.
Raid cooldowns the raid assigns are shown, not graded (Divine Hymn, Pain Suppression, Power Word: Barrier, Spirit Link, Healing
Tide, Life Cocoon, Revival). Changes: healers' wasted procs and window procs never red; big hits never red under 3 cooldowns.
On pull 19 the Mistweaver's 5 wasted Spiritfonts were the coach's first fix (red); now yellow and not in the top 3.

## Damage dealers and tanks — GEN_SPECS + GEN_TUNE
Every spec was rebuilt from both guides and SimC on Oct 19 (see "rotation-card-checklist"). This pass checked each graded
bar against the top players and each weight against what the guides call core. Most bars were already set from top kills.
Weights: priority 3, the burst window 3 (4.5 with casting merged into it), damage over time and buff uptimes 2.5, cooldowns,
pairs, opener, casting and resource 2, procs 1.5, window details 1-1.5. That order matches the guides for every spec: the core
rotation and the burst window first, procs and small details last. No spec needed a different order.

Bars the top players' middle missed, now lowered:
- **Balance Druid**: Force of Nature 85% → 70% (top 65-86%; the guides pair it with Eclipse or the big cooldown).
  **Innervate** (on a healer) counted 2 and went red at 0 of 2; it helps the healer, not your damage, so it counts 0.5 and is
  never red. (Plus the Sunfire bug above.)
- **Augmentation Evoker**: Breath of Eons 80% → 75% (top 75-100%).
- **Affliction Warlock**: Haunt and Dark Harvest 85% → 80% (top 75-89%); Agony 95% / 90% → 90% / 80% (top 65-100%) and
  weight 2.5 → 3 (Icy Veins: "your most important spell"); Wither 90% → 80% (only one boss of top-player data: 66%).
- **Blood Death Knight**: Always be casting 78% / 70% → 74% / 66% (top 70-83%).
- **Vengeance Demon Hunter**: Sigil of Spite 85% → 80% (top 80-100%).

Other changes:
- **Shadow Priest**: Power Infusion uses and "Power Infusion with Voidform" could go red; the user's rule (Oct 19) is that a
  Shadow Priest's Power Infusion is never red. Now yellow at worst.
- **Elemental Shaman**: "Maelstrom saved for Ascendance" (one guide: pool 90) went red, but the other guide casts Elemental Blast
  right before Ascendance, which Debrief also checks. Now never red.

Checked and left as they are (pull 19 and the bar report):
- Arcane Mage, Arms Warrior, Beast Mastery, Marksmanship, Retribution, Frost Mage, Devastation, Devourer, Assassination,
  Frost Death Knight, Havoc, Subtlety, Windwalker, Unholy, Destruction, Enhancement, Protection Paladin, Guardian, Brewmaster,
  Protection Warrior: every bar at or under the top players' middle, weights in the guides' order.
- Fire Mage, Fury Warrior, Feral, Survival, Outlaw: no top-player numbers yet (too few top logs on Oct 18), so their bars come
  from the guides only. Worth a top-kill check when there are logs.
- Elemental "Stormkeeper before Ascendance" (red on pull 19): both guides, kept. Protection Warrior Shield Block uptime (red at
  72%, top 92%): core active mitigation in both guides, kept. Devastation Dragonrage uses: kept.
- Demonology (pdemChecks): bars set from top kills (casting 77%, Tyrant with Dreadstalkers, 2 Demonic Cores into Tyrant 60%);
  weights match the guides (Tyrant, Hand of Gul'dans inside it, Soul Shards). No change.

## Pull 19, the coach's top 3, after
- Flëxørçïst (Holy Paladin): Always be casting 74% (top 87%) → Infused Flash of Light on a Beacon 49% (top 57%) → Divine Purpose 4 wasted (top 2).
  Before: Casting in Avenging Wrath (red at 78%) → Beacon line (2.19M) → Divine Purpose (1.02M).
- Jangokin (Balance): Fury of Elune right before Incarnation 2/4 → priority 73% → casting. Before: Incarnation windows,
  priority 44%, Fury of Elune, Innervate 0/2 (all red).
- Huservoker (Preservation): Stasis 0 of 5 (never pressed) → Temporal Anomaly 60% (2.9M) → ramps on Merithra's Blessing.
- Optt (Holy Priest): Cooldowns into the big hits 0 of 2 (yellow) → procs in Apotheosis (yellow) → Apotheosis uses.
- Ashdknight (Mistweaver): Yu'lon uses → Celestial Conduit set up → Celestial Conduit uses (Spiritfont is now yellow, 4th+).

## Follow-ups (not done here)
- The Coiled Altar's P3 targets: Balance Druids dotted something from 2:26 on that isn't in the pull's boss units (Zul'jan and
  Malacrass?). The away rule stops the false slips; whether r.bossUnits should include them is an engine question.
- Top-player numbers for Fire, Fury, Feral, Survival, Outlaw and Discipline (and folb-style lines without SPEC_TOP marks).
