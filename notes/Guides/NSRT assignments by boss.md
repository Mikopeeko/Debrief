# NSRT assignments by boss (researched Oct 20, 2026)

What a raid's NSRT note can assign on each Venomous Abyss boss (plus Nymrissa Wavecaller and Kith'ix), the exact words the
addon reads, and what a combat log can show for each job. Written for "Draft a note from your pulls" (a Debrief test feature).

Sources:
- NSRT's own code, read line by line (github.com/Reloe/NorthernSkyRaidTools, cloned Oct 20): `EncounterAlerts/MidnightS2/*.lua`
  (one file per boss), `InterruptDisplay.lua` (`ReadInterruptNote`), `Reminders.lua`, `NickNames.lua`, `SetupManager.lua`,
  `BossTimelines/MidnightS2/*.lua`. Facts marked **(code)** are exact.
- The note write-up next to this file: `NSRT notes - how they work.md` (reminder fields, tags, phases).
- wowutils (Viserio Cooldowns): its public guide pages (NSRT guide, cooldown planner basics, the v5.1 notes). They describe
  the workflow but **not** the per-boss assignment templates: those live behind the site's sign-in (the Assignments "AS" page
  of each boss). So the label words below come from the addon code, the raid guides in `Bosses/`, and the labels Debrief
  already reads from real notes (engine.js `checkAssignments` and the boss `…Assign` functions).
- The raid guides in `notes/Guides/Bosses/` (the jobs each strategy hands out).

## The big finding: NSRT reads almost nothing from the note's text

A note has three kinds of line (see `NSRT notes - how they work.md`). For **assignments**, the addon only *reads* two
blocks on these 10 bosses. Everything else is plain text it just shows (the green "text note"), in words the raid leader
picks. **(code)**

| Block | Bosses | How NSRT reads it |
|---|---|---|
| `intstart` … `intend` | The Coiled Altar, Ula'tek | Each line between the two words is one kick rotation: names in kick order, split on spaces. A name can be a nickname. Only players in the raid count. The block ends at the first `intend`. Case doesn't matter. (`ReadInterruptNote`) |
| `transitionStart` … `transitionEnd` | Ula'tek (Mythic) | Up to 3 lines, each one soak group (names split on spaces). (`GetUlatekTransitionAssignments`) |

Two more assignment systems exist, but **they don't use the note**:
- **Automatic soak sides** (`NSI.AddAssignments`): Coiled Altar **Heroic only** splits Guillotine soaks into "first" and
  "second" by NSRT's group sorter; Sszorak Mythic splits Mutilate soaks Left/Right by raid group (groups 1-2 left, the rest
  right), Normal/Heroic by the group sorter. Mythic Coiled Altar soaks are not automatic: they come from the note's text. **(code)**
- **Macros and whispers**: Ula'tek wave direction and transition pattern (a raid lead presses a macro), Sszorak Winds Helper
  (macros post 1-8 with markers), Twin Fangs "Interrupt Whisper Alert" (shows "Your Interrupt" on any whisper). **(code)**

Everything else (soak groups, orb carriers, CC orders, curses, positions, cooldowns) is either:
- a **reminder line** `time:…;ph:…;tag:…;spellid:…;text:…` (shown as a timed pop-up to the tagged players), or
- a **text line** `Label: Name Name Name` (shown, never read).

### Nicknames **(code)**
- NSRT nicknames are not in the note. They are shared between players by the addon (`NSI:SendNickName`), or imported as
  `charactername-realm:nickname;charactername-realm:nickname;…` (`ImportNickNames`).
- Anywhere the addon reads names (kick blocks, transition groups, reminder tags), it turns a nickname back into the
  character with `NSAPI:GetChar(name, true, "GlobalNickNames")`. So a note may say `Flex` for `Flëxørçïst`.
- In text lines, names are swapped for nicknames, cut to 12 letters and class-coloured, for display only.
- Debrief: nicknames are linked once on the swap screen (`nicksGet`/`nickSet`); a drafted note uses character names, which
  NSRT always accepts.

### Phases for reminders **(code)**
Reminder `time` counts from the phase start; `ph` decimals are intermissions. NSRT finds each phase from the boss's casts.
The ones Debrief needs for drafted reminders:

| Boss | NSRT phases | Mythic phase starts (boss timeline, seconds from pull) |
|---|---|---|
| The Coiled Altar | 1, 2, 2.5, 3 | 0, 175, 382, 420 |
| Ula'tek | 1, 2, 3 (+ transition) | see `BossTimelines/MidnightS2/Ulatek.lua` |
| Nek'zali | 1, 1.5, 2 | see its timeline file |
| Others | 1, or the boss's own numbering | timeline files |

## Boss by boss

Columns: **Job** (what the raid leader hands out) · **Note syntax** (exact for addon-read blocks; for text lines, the
label Debrief already reads, which is also the label raids use) · **Log shows** · **Drafting** (can Debrief guess it from
repeated pulls?).

### 0. Nymrissa Wavecaller (3379)
NSRT module: timed alerts only (adds, waves, knockback, Chilling Frost, Abyssal Rain, Water Jet, Iceblade Flurry, taunt). No note blocks. **(code)**

| Job | Note syntax | Log shows | Drafting |
|---|---|---|---|
| Frost Orb soakers per set | `Orb Soak 1: A B C` (Debrief reads `orb soak N`) or reminders `text:Soak orb` | orb soak hits per player per set | yes: who soaked set N in most pulls |
| Healing cooldowns | reminder `time;ph;tag;spellid` | cast times | yes |
| Kill order / Frostscale first | free text | nothing assignable | no (raid lead) |

### 1. Nek'zali the Soulcoiler (3470)
NSRT module: alerts only (Barrage, Essence Rend, Soulcoil Ignition, Hungering Pyre, add spawns, Invoke). No note blocks. **(code)**

| Job | Note syntax | Log shows | Drafting |
|---|---|---|---|
| Soulcoil Well teams (take turns in the well per Drowned Echo) | `Well Group 1: …`, `Well Group 2: …` (Debrief reads `well/realm/depths/echo` + `group N`) | Immortal Coil hits = who was in the well | yes: who went in on Echo N |
| Echo kicks (2 melee or 3 others) | free text, or a kick line | interrupt events on the Echo | yes |
| Hungering Pyre soak list / don't-soak list | `Pyre Soak: …`, `Don't soak: …` | Pyre hits | yes |
| Essence Rend dispels | free text / reminders | dispel events | partly (who dispelled most) |

### 2. Entombed Sentinels (3445)
NSRT module: alerts plus a "Radar" range display. No note blocks. **(code)**

| Job | Note syntax | Log shows | Drafting |
|---|---|---|---|
| Blood / Breath split | `Blood: …` and `Breath: …` | Mark of Blood / Mark of Acid stacks = which boss each player fought | yes, very reliable |
| Unstable Miasma soakers (8+ on Mythic) | free text `Miasma: …` | soak hits | yes |
| Toxic Droplets (tanks with defensives) | free text | droplet pickups | yes (repeated pickups) |
| Blighted Blood dispels | reminders/free text | dispels | partly |

### 3. The Lost Explorers (3497)
NSRT module: alerts only (Shell Spin variants, Mighty Thud "Soaks", fish, mushrooms, bomb debuff, "Time to throw Fish"). No note blocks. **(code)**

| Job | Note syntax | Log shows | Drafting |
|---|---|---|---|
| Crate breakers (pairs) | free text `Crates: …` | crate hits / Relic Rupture | partly |
| Fish carrier | free text `Fish: …` | the extra action button / fish throw cast | yes if the throw is logged |
| Mighty Thud soakers (3 leaps) | free text | Thud hits per leap | partly (targets are random) |
| Icebound Flames kicks | kick line | interrupts | yes |

### 4. Vashnik the Malignant (3455)
NSRT module: alerts only (tank hits, taunt, adds, Infection, AoE, Soaks, Waves, Wave-Spread). No note blocks. **(code)**

| Job | Note syntax | Log shows | Drafting |
|---|---|---|---|
| Totem clearing sides (ranged per side) | free text `Left: … / Right: …` | totem damage / positions | partly (positions) |
| Catalytic Bile soak spread | free text | soak hits | weak (random spots) |
| Exploding Infection dispels | reminders | dispels | partly |
| Death Knight grips | free text | Death Grip casts | yes |

### 5. Sszorak (3420)
NSRT module: alerts, "Set Markers" reminder (Mythic, 9.9 / 137 / 264 s), Winds Helper macros, debuff targets. Automatic Mutilate Left/Right soak by raid group (Mythic: groups 1-2 left). **(code)**

| Job | Note syntax | Log shows | Drafting |
|---|---|---|---|
| Mutilate soak groups (alternate) | `Mutilate Soak 1: …` / `Soak Left: …` (Debrief reads `mutilate|soak`) | Mutilate hits | yes |
| Cyst poppers (intermission) | `Cyst: …` (`orb|popper|cyst`) | nearest player at each pop | partly |
| Serpent's Fury bait (one mobile player) | free text / reminder `text:Trigger Virulence` | Fury target | yes |
| Virulence spread spots | free text with markers | positions | no (positions, raid lead) |

### 6. The Twin Fangs (3421)
NSRT module: Eternal Venom overview, soak 1/2/3 alerts, Interrupt Whisper Alert (whisper-based, not the note). **(code)**

| Job | Note syntax | Log shows | Drafting |
|---|---|---|---|
| Ravenous Feast soak groups (3, one per strike) | a heading line with "Feast" or "Tainted", then `Group 1: …` lines; order from reminders `text:Soak First/Second/Third` | strike hits per player | yes |
| Broodling kicks by area | heading "Broodling Kicks…", lines per area | interrupts per add | yes (who kicks which area's adds) |
| Globule CC groups (odd / even sets) | heading line + groups | CC auras on globules | yes |
| Tainted Blood orbs (right group first) | free text | orb soak hits | yes |

### 7. The Coiled Altar (3429) — the first boss for drafting
NSRT module: alerts for frontals, orb deadline, taunts, P1/P3 soak timers (47.97/132.99 s; P3 21.69/86.13/186.13 Mythic), mind controls, debuffs, shields, Eternal Nightfall absorb bar, add interrupts and the **interrupt assignments display**. **(code)**

| Job | Note syntax | Log shows | Drafting |
|---|---|---|---|
| **Kick rotations** for the Spiteful Soulcoilers | `intstart` / line 1 = unmarked add / line 2 = marked add / optional lines 3-4 = P3 / 5-6 = P3 second set / `intend` **(code: "The first interrupt line will be assigned to the add with no raidmarker. The second … any raidmarker.")** | each successful interrupt, the add, and its raid marker | **yes**: each player's add (marked or not) and their place in the order |
| Guillotine soak groups (P1: 2 drops, Mythic) | `Guillotine 1: …`, `Guillotine 2: …` (Debrief reads `soak|guillotine` + number) | who took each axe hit | **yes**: soak 1 vs soak 2 |
| Grim Guillotine (P3: 3 drops) | `P3 Guillotine 1: …` or `Grim Guillotine 1: …` | same | **yes** |
| External on the Guillotine target | `External Guillotine 1: …` | external aura on the target | yes |
| Zephyr for a Guillotine | `Zephyr Guillotine 1: …` | Zephyr cast | yes |
| **Purple orb carriers** (Mythic, 5 hard-assigned) | `Purple Orbs: …` text line, or reminders `text:Grab {cross} purple orb` | Mutagenic Venom on the carrier | **yes**, very reliable |
| Green orb clearers / backups | `Green Orbs: …`, `Green orb backup` | Volatile Venom pickups | partly (everyone grabs greens) |
| CC order on Dreadmarch mind controls | `1st CC on Mindcontrol: A`, `2nd CC on Mindcontrol: B` … | CC auras on the mind-controlled players | yes |
| Curses on the adds | `Curse Unmarked Add: A`, `Curse Raid-Marked Add: B` | curse auras on each add | yes |
| Ghost soaks in the intermission | `Soak Ghost at {cross}: A` | positions only (fragments aren't units) | partly: who stood alone at a spot |
| Who marks the ranged add | free text | raid marker set events (source isn't always logged) | weak |
| Healing / raid cooldowns | reminders `time:…;ph:…;tag:Name;spellid:…` | cast times | **yes**: the same cooldown at the same phase time in most pulls |
| Eternal Nightfall damage cooldowns per shield | reminders | cast times | yes |
| Positions (orb triangle, soak spots, Dreadmarch at square) | free text with markers | positions (not who was "assigned") | no: left for the raid leader |

### 8. Ula'tek (3492)
NSRT module: many alerts, **interrupt assignments display** (reads `intstart`/`intend`; you kick the add you focus, in your line's order), **transition soaks** (`transitionStart`/`transitionEnd`, 3 groups; the pattern macro picks which marker spots each group soaks), wave direction macros. **(code)**

| Job | Note syntax | Log shows | Drafting |
|---|---|---|---|
| Add kick teams | `intstart` / one line per add team / `intend` | interrupts per add | yes |
| Transition soak groups (Mythic) | `transitionStart` / `A B C` / `D E F` / `G H I` / `transitionEnd` **(code)** | Spectral Coils hits during the transition | yes |
| Spectral Coils teams (1/3/5 vs 2/4/6) | `Team 1: …` / `Team 2: …` | coil hits per soak | yes |
| Egg carriers with zones | free text with markers | Malignant Shell on carriers (who), zones (positions) | who: yes; where: no |
| Serpent's Bite soakers | free text | leech hits | partly |
| Toxic Incubation (off-tank) | free text | beam soak | yes |

### 9. Kith'ix (3513, patch 12.1.5)
NSRT module: alerts only (Dark Devastation, taunt, AoE, Darkness, Adds) and a phase helper. No note blocks. **(code)**

| Job | Note syntax | Log shows | Drafting |
|---|---|---|---|
| Null Gate drop spots | free text with markers | positions | no (positions) |
| Voidscar soak pairs (ranged) with backups | free text `Scar 1: A B` | soak hits | yes |
| Bomber Beetle detonators / CC | free text | beetle explosions, CC | partly |
| Healing cooldowns | reminders | casts | yes |

## What this means for "Draft a note from your pulls"

1. **Kick blocks** (`intstart`/`intend`) are the most valuable thing to draft: NSRT reads them, and the log shows every kick
   with the add's marker. Order comes from who kicked first, second… on that add in most pulls.
2. **Soak groups and orb carriers** are text lines in Debrief's own label words, so the drafted note checks itself on the
   Assignments page with no extra work.
3. **Cooldowns** become reminder lines at the phase time they were pressed in most pulls (median), so they pop up in game.
4. **Positions, marker spots, calls and macro jobs** can't be drafted: the log shows where people stood, not where they were
   told to stand. The draft leaves a `# For you to fill in:` comment line for each.
5. A **job that repeats across pulls is the assignment**; a one-off is a mistake or a cover. Each drafted line keeps its
   evidence ("kicked the unmarked add in 9 of 11 pulls") in the review screen, not in the note itself (NSRT would show it).
