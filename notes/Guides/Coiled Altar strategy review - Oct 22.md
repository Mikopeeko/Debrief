# The Coiled Altar (Mythic) — strategy review and our own plan (Oct 22, 2026)

Asked by the user: "evaluate the strategy for coiled altar, and you tell me if its the most efficient strategy. Then, make up
your own strategy on how to deal with the fight."

**Sources.** The 20 fastest Mythic kills in the world (489–514 s, read event by event from Warcraft Logs through Debrief's
data service), Wolfthorn's 19 pulls on Oct 21 (report HWFBkCyc6JNazQrK, best: pull 19, P3 at 48% / 64%), the Mythic plan
in `Bosses/7 The Coiled Altar.md` (the Tactyks plan, written out), and the danger weights and kill baselines already in Debrief.
Every number below comes from those logs unless it says **(my idea)**.

---

## 1. Verdict in one breath

- **The strategy is solid, not the problem.** The plan we use is the plan every fast kill uses. Not one of the 20 fastest kills
  does anything we don't (same lust, same soaks, same orb shape, same add split). There's no cheese to find.
- **How we run it is where the time goes.** Three things lose our pulls, with numbers:
  1. **Purple orb collisions in P1**: 7 of our 19 pulls. 5 of those 7 came off the **3rd Toxic Deluge (1:27)**. Top kills: zero.
  2. **P2 is ~60 s too long** (3:33 vs 2:35). That gives us a 5th Dreadmarch, a 5th add set and a 2nd Eternal Nightfall that
     16 of the 20 top kills never see. Our best pull lost its first 4 players right there.
  3. **We spend damage cooldowns in the wrong places.** Late P1 (Zul'jan already dying): we cast 7 big cooldowns, kills cast 4.
     Intermission start: kills cast 20, we cast 11. So we hit Zul'jan for 269M in the intermission; kills hit him for 470–630M.
     He starts P3 at **48%** for us vs **22–33%** in every kill.
- Plus one soak hole: **the 4th Guillotine soak (2:08) failed in 4 pulls, and the first P3 Grim Guillotine on our best pull**
  (2 soakers → 11 dead).

Ratings: the strategy is **solid** (proven by every top kill). How we run it is **lackluster** in the 4 spots above. My plan
below is **solid-to-amazing for Wolfthorn**. It keeps the proven bones and aims every change at where our pulls actually died.

---

## 2. The fight runs on a fixed clock

Every kill and every one of our pulls has the same timers to the second. Only the phase pushes move. That makes this
fight very plannable: every cooldown and call can be written down to the second.

**P1 (from the pull)**
| Time | What |
|---|---|
| 0:00 | Fangs 1 (pools, ~28 yd from the side walls) · Toxic Deluge 1 (0:02) |
| 0:12 | Axegrinder set 1 |
| 0:20/0:23 | Sever pair 1 (then 0:37/0:40, 0:57/1:00, 1:14/1:17, 1:45/1:48, 2:02/2:05, 2:22/2:25) |
| 0:43 / 0:46.5 | Guillotine 1 / 2 (soaks land 5 s later) |
| 0:45 | Toxic Deluge 2 |
| 1:25 | Fangs 2 (pools ~48 yd: the lane by the boss narrows to 4–8 yd) |
| 1:27 | Toxic Deluge 3 ← **our P1 killer** |
| 1:39 | Axegrinder set 2 (10 axes out until ~3:15) |
| 2:08 / 2:11.5 | Guillotine 3 / 4 |
| 2:10 | Toxic Deluge 4 (skipped if Zul'jan is dead by then) |
| Zul'jan at 0% | P2 starts 8.5 s later |

**P2 (from P2 start; kills: 2:14–2:37)**
| +0:06 Dreadmarch 1 | +0:13 adds 1 | +0:18 Gloombomb 1 | +0:34/0:38 Soul Sever |
|---|---|---|---|
| +0:42 Dreadmarch 2 | +0:46 adds 2 | +0:55 Gloombomb 2 | +1:05/1:09 Soul Sever |
| **+1:10 Eternal Nightfall 1** (break the shield; kills 11–15 s; fails at ~17 s) | | | |
| +1:31 Dreadmarch 3 | +1:38 adds 3 | +1:43 Gloombomb 3 | +1:59/2:03 Soul Sever |
| +2:07 Dreadmarch 4 | +2:11 adds 4 | +2:20 Gloombomb 4 | +2:30/2:34 Soul Sever |
| **+2:35 Eternal Nightfall 2** ← 16 of 20 kills are past P2 by now | | | |
| +2:56 Dreadmarch 5 | +3:03 adds 5 | +3:08 Gloombomb 5 | ← where our best pull fell apart |

**Intermission:** always 37.5–38 s. **P3:** Zul'jan comes back ~3.5% and heals; Malacrass back at ~70%. Kills spend 2:27–2:59 here.
Grim Guillotine pairs at about P3+0:17 and P3+1:21; Defilement at P3+0:00 and P3+1:42.

---

## 3. Where Wolfthorn stands (Oct 21, 19 pulls)

| | 20 fastest kills | Wolfthorn |
|---|---|---|
| P1 length | 2:14–2:37 (median 2:28) | 2:26–2:31 ✅ on par |
| Zul'jan at 2:09.5 | 0–7.6% | 4.5–8.1% ✅ |
| Orbs per Sever (when it goes right) | 4/4/4/4/5/5 | 4/4/4/4/5/5 ✅ identical |
| Purple drop spots | ~30 yd out toward the doors | ~30 yd out ✅ identical |
| Purple collisions (mass Venom Rupture) | 0 of 20 | **7 of 19 pulls** ❌ |
| Executions (unsoaked Guillotine) | 0 | **4 pulls** (2:13 soak, and P3) ❌ |
| P2 length | 2:25–2:56 (median 2:35) | **3:33** (pull 19) ❌ |
| Damage on P2 targets per second | ~2.67M | ~2.25M (−16%) |
| Eternal Nightfall shield | 11–15 s | 12.6–17.2 s (2 wipes at 17.1/17.2 s) ⚠️ |
| Adds alive | ~30 s each, all die | ~22–40 s; first set never died in pulls 4 and 15 ⚠️ |
| Lust | intermission start (all 20) | intermission start ✅ (pull 2 lusted in P2) |
| Damage cooldowns, late P1 / P2 start / intermission start | 3.6 / 13.6 / 20.4 casts | 7.2 / ~11 / 11 casts ❌ |
| Zul'jan damage in the intermission | 454–630M | 269M ❌ |
| Zul'jan HP at P3 start | 22–33% | 48% ❌ |
| Healers | 4 in all 20 kills | 4 ✅ |

### How each pull ended
- **P1, purple collision (7):** #6 (0:20, carrier died carrying), #3 (1:34), #18 (1:35), #11 (1:52; Komo died carrying at 1:35),
  #8 (1:56; Komo died carrying at 0:54), #12 (2:02, 25 orbs blew at once), #9 (2:11, as Deluge 4 landed).
- **P1, Guillotine 3 under-soaked (2):** #10 (1 soaker → 17 Executions), #14 (4 soakers → 19 Executions). Pulls 9 and 12 also had it at 2 and 1.
- **Transition (1):** #7: leftover orbs blew when Zul'jan died.
- **P2 (8):** ghost collisions (#1), Gravebound/fragments missed (#2, #16, #17), first adds never died → Retaliatory Malice (#4, #15),
  Eternal Nightfall shield not broken in time (#5, #13).
- **P3 (1):** #19, our best: clean P2 until the 2nd Nightfall and 5th add set (4 deaths), then the first Grim Guillotine was soaked by 2 → 11 dead.

---

## 4. The current strategy, piece by piece

| Piece | Current plan | What kills do | Rating |
|---|---|---|---|
| Comp | 5 healers (Tactyks) | 4 healers in all 20; tanks Blood DK + Prot Paladin in 13 | We already run 4 ✅. The written plan's "5 healers" is out of date. |
| Lust | Intermission | Intermission, all 20 | **Amazing**: keep. |
| P1 orbs | Purples hard-assigned, pyramids at the doors | Same; purples carried by Arcane Mage (35%), Prot Paladin (22%), Affliction (14%), Balance (6%); **Demonology 0, hunters ~0** | Solid plan; **our carrier picks are off** (Demo and hunters carry for us). |
| P1 Guillotine | Soak 1 = 6–7 incl. next immunities; soak 2 = 5 immunes | Same: only soak 1 ever takes damage (5–8 players); soak 2 is fully immune | Solid. Our 3rd soak (2:08) breaks because Deluge 4 lands 2 s later. |
| End of P1 | Hold damage, kill Zul'jan around the pools | 16 of 20 let Deluge 4 happen, kill him at 2:17–2:29. 4 (incl. world #1) killed him before 2:10 and **skipped Deluge 4** | Solid. The "skip" is a real option once damage allows. |
| P2 ghosts/Dreadmarch | Stack at a marker, cancel macro, stare at ghosts | Same (0 falls, ~0 ghost collisions) | Solid; our misses are execution. |
| P2 adds | Ranged add / melee add, kick on Gloombomb cast | Same; adds live ~30 s | Solid. |
| Nightfall | Pool damage, cooldowns on the shield | Same; break in 11–15 s | Solid. |
| Intermission | Lust, potions, everything | Same; ~20 damage cooldowns in the first 25 s | **We don't actually do "everything"** (11 casts). |
| P3 | Purples in a diamond, soak groups again, kill together | Same | Solid; our P3 soak call broke. |

---

## 5. Top 5 places a better plan saves time or lives (with numbers)

1. **The 3rd Toxic Deluge (1:27).** 5 of our 7 collision wipes. The pools are at their biggest (Fangs 2 at 1:25) and the lane
   by the boss is only 4–8 yd wide. Fix: a set purple route for this Deluge only, and carriers who never die carrying (Section 6).
   *Saves: up to 7 of 19 pulls.*
2. **Hold damage cooldowns from ~2:00 to P2 start.** Kills cast half as many cooldowns in late P1 as we do. P1 is gated by the
   fight anyway (P1 length is the same for us and them). Moving those casts to P2 start should be worth roughly 15–25 s of P2.
   **(my estimate)**
3. **Intermission = everything.** Kills open it with ~20 damage cooldowns plus lust, and do ~2× our damage to Zul'jan. Getting
   him to ~30% instead of 48% shortens P3 by about a minute **(my estimate from the HP gap)**. It also keeps the 2-boss
   finish inside one Defilement cycle.
4. **Malacrass dead before the 2nd Nightfall (P2+2:35), or at worst before Dreadmarch 5 (P2+2:56).** Every second past that
   adds a whole extra cycle of ghosts, adds and a shield. Points 2, 5 and clean adds get us there.
5. **Soak 3 and the P3 Grim Guillotine:** soak 3 in place before Deluge 4 lands (and ignoring its orbs), P3 soaks named in the note. 4 pulls died to Executions at 2:13,
   and our best pull died to the first P3 soak. Top kills: zero Executions in 20.

---

## 6. Our own plan for Wolfthorn

Roster from pull 19: tanks **Vandagos** (Prot Warrior, boss tank) and **Tyralien** (Prot Paladin, off-tank). Healers **Flëxørçïst**
(Holy Paladin), **Optt** (Holy Priest), **Ashdknight** (Mistweaver), **Huservoker** (Preservation). DPS: Boltzzx (Arcane),
Arsyn (Affliction), Komo (Demonology), Larryg (Arms), Shockabunga (Elemental), Urgdragon (Augmentation), Earthday and Jangokin
(Balance), Schooty and Volkovod (Beast Mastery), Kargaryen (Devastation), Fourinches (Unholy), Zaffia (Subtlety), Dashtoswirly (Havoc).

Room: doors north and south (south = entrance), pools from the middle of the west and east walls. Spots below are yards from
the room centre, from our own pull positions.

### Phase targets (call these out loud)
| Checkpoint | Target | Proven by |
|---|---|---|
| Zul'jan dies | 2:17–2:22 (no earlier than the 2:02 Sever pair clearing) | 16 of 20 kills |
| P2 starts | ~2:26–2:30 | all kills |
| Malacrass ≤ 54% | at P2+1:00 (we were at 63%) | kills: 45–54% at +1:00 |
| Malacrass dead | **before P2+2:35** (stretch) / **before P2+2:56** (must) | 16 / 20 kills |
| Zul'jan at P3 start | **≤ 32%** | all 20 kills |
| Kill | ~8:30–9:00 for us | kills 8:09–8:34 |

**The "skip Deluge 4" option (proven, but not for us yet):** kill Zul'jan before 2:09 and Deluge 4 never comes. That also removes
Guillotine 4 and the 10 orbs that blow at the transition. World #1 and 3 others did it. We're 4.5–8% short at 2:09 (~25–40M
damage). Revisit when gear goes up. Until then, plan for Deluge 4.

### Lust and damage cooldowns
- **Lust:** intermission start (Soulbinding cast). All 20 kills. Potions with it.
- **2-minute cooldowns:** pull → **hold from ~2:00 and press at P2 start** (the first Dreadmarch at +0:06, adds at +0:13 for cleave)
  → **intermission start** (hold if they come up late in P2) → P3 as they come back. Kills: Power Infusion at 0:05, 2:22, 4:51. Ours
  at 0:04, 2:06, 4:09, 6:11. *(Proven pattern; the exact hold is my reading of the kills.)*
- **3-minute cooldowns:** pull → **Eternal Nightfall 1 (P2+1:10)** for the shield → intermission. **(my idea, built on the plan's shield
  cooldowns.)**
- Nobody pops a damage cooldown on Zul'jan after ~1:55 unless the raid lead calls "skip Deluge 4".

### Raid healing cooldowns (each one used as often as it's back)
Spacing between uses comes from our own and the top kills' logs (Aura Mastery ~3 min, Divine Hymn ~2 min, Celestial Conduit
~1.5 min, Rallying Cry ~3 min, Anti-Magic Zone ~2 min, Darkness ~4 min, Rewind ~4 min, Zephyr ~2 min). **Check each length in
game before the note goes out.** Clock times assume P2 at 2:28 and a 2:35 P2 (intermission ~5:03, P3 ~5:41).
| Moment | Cooldowns |
|---|---|
| 0:45–0:55 Guillotine 1 + Widow's Kiss | Rallying Cry (Larryg), Celestial Conduit (Ashdknight) |
| 1:27–1:50 Fangs 2 + Deluge 3 ruptures | Aura Mastery (Flëxørçïst), Divine Hymn (Optt), Zephyr (Kargaryen) |
| 2:08–2:35 soak 3 + transition (~10 Venom Rupture stacks) | Anti-Magic Zone (Fourinches), Darkness (Dashtoswirly), Rallying Cry (Vandagos), Rewind (Huservoker), Celestial Conduit |
| P2+1:10 Eternal Nightfall 1 (heal absorb) | Divine Hymn, Celestial Conduit, Zephyr (Urgdragon) |
| P2+1:43 Gloombomb 3 | Zephyr (Kargaryen) |
| P2+2:20 Gloombomb 4 (and Nightfall 2 if we get there) | Aura Mastery, Anti-Magic Zone, Rallying Cry (Larryg), Celestial Conduit |
| Intermission, the 7–10 soak | Divine Hymn, Rallying Cry (Vandagos), Zephyr (Urgdragon), Stampeding Roar ×2 for the soak runs |
| P3, first minute (Defilement, Grim Guillotine 1) | Darkness and Rewind as they come back, Celestial Conduit |
| P3+1:21–1:42 Grim Guillotine 2 + Defilement 2 (kill window) | Anti-Magic Zone, Divine Hymn, Zephyr, everything left |
Healthstone once a pull (the Gloombomb you're hit by, or soak 3). Health potion only if the combat potion isn't needed.

### P1 orbs: who carries purples (the biggest change)
Top kills carry purples with Arcane Mages, the Prot Paladin and Affliction Warlocks. **Demonology carried 0 in 20 kills, hunters
almost never.** Our Demo (Komo) died carrying in 3 pulls. Our hunters carry, but they're also our Turtle immunities for the soaks.
- **Purple carriers:** Boltzzx (Arcane, far-north corner), Arsyn (Affliction, entrance corner + Gateway), **Tyralien (Prot Paladin,
  floater: the awkward purple, Divine Steed)**, **Earthday (Balance, far-south corner; Stampeding Roar, Wild Charge)**. Backup: Jangokin.
  Off purples: Komo, Schooty, Volkovod. *(Proven by top-kill carrier specs; names are my picks.)*
- Drop spots stay as they are (~30 yd north/south, just inside the door lanes). Ours already match the kills.
- **Deluge 3 rule (1:27) (my idea):** the pools are biggest, so nobody walks a green *across* the lane. Greens go to the pyramid
  on their own side only. A purple carrier who can't get a clean line calls "hold" and waits for the 1:45 Sever to clear the greens
  in the way. The pyramid for this set stays one row shorter (4 greens, not 5).
- Second-to-last Sever pair (2:02) takes 2–3 orbs; the last pair (2:22) takes the rest; nothing left when Zul'jan dies (pull 7).

### Guillotine soaks (keep the plan's pattern; fix the two moments that broke)
Only the first soak of each pair takes damage (5–8 players in the kills). The second is all immunities: the kills show zero damage
on it, every time. Guillotined is permanent on Mythic, so each damage-taking soak needs fresh players. Keep the groups you use now:
your 0:43 soaks had 6–7 people in every pull. The fixes:
- **2:08 (soak 3) stands in its spot by 2:05 and ignores Deluge 4's orbs** (it lands at 2:10, right on top of the soak). That's why
  our 2:08 soaks had 1–4 people in pulls 9, 10, 12 and 14. No purple carrier is ever in this group. **(my idea, from where it broke)**
- **Immunity soaks (0:46.5, 2:11.5, P3+0:20.5, P3+1:24.5), 5 each:** Vandagos and Tyralien (personals), Schooty and Volkovod (Turtle),
  and the target gets Blessing of Protection in P1 (physical). In P3 it's magic: Zaffia (Cloak), Flëxørçïst (Divine Shield) or
  Spellwarding. Per the plan, whoever immunes the second soak stands in the first soak of that pair too.
- Gate *into* the soak (Arsyn's Gateway to the back corner), never out.
- **P3 soaks get written down by name in the note and called by name**, because that's where our best pull died (2 soakers at P3+0:22).

### P2: Dreadmarch, ghosts, adds, shield
- Dreadmarch stack spot: the square marker, as now; press the cancel macro; CC is a bonus (Ring of
  Peace — Ashdknight; Ursol's Vortex ×2; Shockwave — Vandagos; Chaos Nova). Kills never lose anyone to a fall.
- Ghosts: stare at yours the moment it's yours; walk missed ghosts back to the square for the next Soul Sever.
  **Vandagos takes every P2 Soul Sever** (Tactyks pattern: defensive on odd, defensive + 2 externals on even).
- **Gravebound:** every hit player picks up all 3 fragments before doing anything else. 4 of our 8 P2 wipes had this.
- **Adds:** ranged add / melee add, kick the moment Gloombomb is cast so the add stands still; both adds dead within ~30 s.
  - Ranged add kicks: Schooty (Counter Shot) → Shockabunga (Wind Shear) → Volkovod (Counter Shot) → Boltzzx (Counterspell). Backup Kargaryen (Quell).
  - Melee add kicks: Zaffia (Kick) → Fourinches (Mind Freeze) → Dashtoswirly (Disrupt) → Larryg (Pummel). The 2nd kick on the melee add is always a melee. Backup Tyralien (Rebuke).
  - Curse of Tongues (Arsyn) on the ranged add.
- **Eternal Nightfall 1 (P2+1:10):** 3-minute damage cooldowns go here; target 13 s; "shield first", adds die before the next set.

### Intermission
Spread exactly as the plan says (mobile healers to areas, priests near melee, off-tank soaks far fragments). Soak 3–5 at a time,
let the stacks drop, about 5 times, then stack cooldowns and go 7–10. **New: everyone opens the intermission with every damage
cooldown they have.** Lust + potions + 2-minute + 3-minute. We cast 11, kills cast 20.

### P3
Play on the star/square side as written. Purples are never missed (diamond for the first frontal); greens may be. Kill Zul'jan
before Defilement 2 (P3+1:42); Malacrass at 7–8% when Zul'jan dies is fine; don't over-damage Malacrass.

### Role by role
- **Tanks:** Vandagos holds Zul'jan *centre* in P1 (kills range from centre to ~15 yd toward the frontal's door; centre is fine for
  us since our orb counts match). Takes every Soul Sever in P2. Tyralien: off-tank taunts before each Sever, carries a purple, soak B.
- **Healers:** follow the cooldown table; Flëxørçïst's BoP is for the soak B target in P1; Ashdknight's Ring of Peace on Dreadmarch.
- **Melee:** damage-taking soaks; melee add kicks; never cross the lane at 1:27.
- **Ranged:** purple carriers as named; ranged add kicks; Gloombomb to your add.

### What's proven vs my idea
- **Proven by kills:** the fixed timers, 4 healers, lust at intermission, soak 2 all-immune, purple spots, carrier specs,
  Malacrass before the 2nd Nightfall, damage cooldowns held for P2 start and the intermission, Zul'jan ≤ 33% at P3.
- **My idea:** the Deluge 3 "no crossing / hold" rule and the shorter pyramid; soak 3 standing ready before Deluge 4 lands; the exact
  carrier and kicker names; 3-minute cooldowns on Nightfall 1; the minute-long P3 saving estimate.

**Rating, mine vs current:** current strategy **solid**; mine **solid-to-amazing for Wolfthorn**. The bones are the same; mine is
aimed at the 4 places our 19 pulls died, and it moves about 30 cooldowns to where the kills use them.

---

## 7. How this was done (to repeat on another boss)
Scripts (node) are saved in the side-session notes folder `coiled-strategy/`: `fetch.js` (top kills + our pulls, slim events),
`analyze.js` (phases, lust, deaths, adds, shields, casts), `report.js` (kills vs us), `p2.js` (HP curves, P2 damage),
`inter.js`, `del4.js`, `soak.js`, `orbs2.js`, `drops.js`, `dpscd.js`, `lust3.js`. Lessons: count raid lust as a buff on 8+ players
(an Evoker's self-only Fury of the Aspects looks like lust); Venom Rupture is a DoT, so count orbs by stack *gains*, not hits;
the 2nd Guillotine of each pair shows no damage because it's soaked by immunities.
