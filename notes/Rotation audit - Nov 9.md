# Rotation audit - Nov 9

Flex, Nov 9: "I need rotational checks to be 100% accurate in both raid content and mythic + content", "Talent choices need to be
heavily considered", "Make sure the information you obtained from the guides is accurate as well, and up to date with current 12.1.5
notes", "Learn as much as you can, fix as much as you can".

Status of each finding: **FIXED** (in this round, Parts 1 and 2 unless marked OPEN), **OPEN** (needs Flex's call or more data), **NOTE** (for the record).
Ranked inside each part by how much it would mislead a raider.

## How this was checked
- **The rules:** every spec's checks on newest main (`GEN_SPECS`, `GEN_TUNE` and the four hand-built pages in `src/ui.js`), read rule by
  rule against `notes/Guides/Classes/<Spec>.md`.
- **12.1.5 facts:** each claim against the 12.1.5 talent reference (Raidbots talents.json build 12.1.5.70688 + each talent's own tooltip,
  5,307 entries; shared notes `mplus-tab-design/talents-12-1-5/`). A cooldown and charge cross-check of every rule ran against it too.
- **Real pulls:** the real page code run in node (`__wla.specRun`) on 31 pulls: the 19 fastest Mythic Coiled Altar kills in the log
  library, ten bosses of the Oct 29 night (`xH3JNdbQ74wBDPAv`) and Thursday's pulls 29 and 32 (`2r1KzqygWAFHkZT3`). 630 player pages,
  38 of 40 specs (no Brewmaster or Outlaw in them).
- **The test that finds wrong rules fastest:** a row that most of the world's best players "fail" on a kill is the row's fault. Every
  row was counted over the 19 top kills.
- **Timeline notes:** every note the Timeline would print was rebuilt from those 630 pages (the same code path as `.rtv-note`).

## Part 1. Timeline notes (the cards beside each mistake mark)

Built in `src/ui.js`: `model()` turns each check's moments into marks, and the `.rtv-note` builder (near `box._notes`) writes the card.
The card shows the mark's title, a moment line, and the check's "Next time" tip.

### T1. A whole-pull sentence rides along on every "fell off" and "sat ready" card (every spec)
- **What a raider sees:** at a 4-second gap at 5:23 the card says "Lifebloom fell off. Off you for 4 s. ... Your longest gap was 13
  seconds, from 0:03." Every mark of that check repeats the same "longest gap" or "From 2:42, it sat ready for 19 seconds" line.
- **Why:** the card's tip is the check's own Next time, and the shared tip writer (`spcAutoTip`) ends uptime tips with "Your longest gap
  was N seconds, from M:SS" and cooldown tips with "From M:SS, it sat ready for N seconds(, long enough for one more use)".
- **Rule broken:** Flex, Nov 9: "these checks should be based on the moment if they are posted not for the overall".
- **Seen on:** 30 of the 32 "fell off" cards in the 630 pages (Agony, Wither, Rend, Rupture, Garrote, Moonfire, Sunfire, Flame Shock,
  Blood Plague, Bone Shield, Ebon Might, Enrage, Exergy, Consecration, Lifebloom, Shadow Word: Pain, Vampiric Touch, Rake, Rip...),
  every "X sat ready" card and every "Missed: X uses" card.

### T2. Three checks get a nonsense title from the "fell off" rule
- "Melee uptime" -> **"Melee fell off"**. "Evangelism ramps set up" -> **"Evangelism ramps set fell off"**. "Ascendance set up" ->
  **"Ascendance set fell off"** (the same would hit "Celestials set up", "Celestial Conduits set up", "Convoke the Spirits set up").
- **Why:** the title rule matches any label ending in "uptime", "on you" or "up", so "set up" matches, and Melee isn't a buff.

### T3. Melee specs: "Missed: Always be pressing"
- The title rule only knows "Always be casting" (-> "Time with nothing cast"). Melee and tank pages call the row "Always be
  pressing", so their cards read "Missed: Always be pressing".

### T4. "Missed: ..." titles that read wrong at a moment
- "Missed: Dark Harvest uses", "Missed: Opener, step by step", "Missed: Potion with Summon Darkglare", "Missed: Hunter's Mark on the
  boss", "Missed: Time in Eclipse", "Missed: Power Infusion", "Missed: Rotation priority" (Demonology), "Missed: Tranquility ramp".
- A cooldown that sat ready is not "missed uses"; the mark is one stretch it sat ready.

### T5. The `BUFFS` map has one entry (Abundance)
A "fell off" card with no entry says only "Down N s." plus the tip. That is true but thin. Entries worth adding, each from its guide
(affected spells, why it drops, what to press), are listed with the fix below. Damage-over-time rows need no entry: "X fell off.
Down N s. Refresh X before it runs out." is already about the moment once T1 is gone.

### T6. A wasted-proc card always says "a new one replaced it"
- The hover line is fixed: "A new X proc replaced one you hadn't used yet." Procs are also lost by running out, and the row itself
  counts both ("2 ran out, and 6 came while you already held 2"). The card should say which happened at that moment, or not say.

### T7. A card can carry another moment's story
- Holy Priest "Missed: Power Infusion": "Sãrdîne used Touch of the Magi at 7:31. Wait for it." printed on every Power Infusion mark.
- Holy Paladin "Missed: Aura Mastery inside Beacon of Virtue" has no tip at all.

## Part 2. Rules that blame right play (found with the 19 top kills)

Counts are "top players not green" out of the top players of that spec in the 19 fastest Mythic Coiled Altar kills.

### R1. Hunter's Mark: the second Hunter always reads "No" (all three Hunter specs)
- **Seen:** pulls with one Hunter: 0 "No" in 13. Pulls with two or more: one Hunter reads "No" in 11 of 18. 9 of 28 top Marksmanship
  Hunters were red on "Hunter's Mark on the boss".
- **Why:** the check read only your own Mark. The boss holds one Mark, so the second Hunter's never shows.
- **Fix:** any Hunter's Mark on the boss at the pull counts. "Hunter's Mark was on the boss when it was pulled."

### R2. Resource waste: the colour used a number the row never shows (Subtlety, Frost DK, Retribution, Unholy, Devourer, Assassination)
- **Seen:** "244 of the 1,568 combo points ... 126 of them came from procs, which is fine, so 118 count against you ... 22% or less is
  good": red. 12 of 20 top Subtlety Rogues red, 3 of 9 top Frost Death Knights red.
- **Why:** the colour was the counted waste over the counted gains only (builders only, or gains with no proc waiting). The row shows
  the total (16%) and the counted points (118), neither of which is that share.
- **Fix:** the colour is the counted waste as a share of everything gained, and the row says so. Bars set from the top players' counted
  share: Subtlety 12% (top 0.4-11.6%), Frost DK 6% (top 0.5-4.3%), Retribution 22% (top 13.6-20.6%). Unholy, Devourer and Assassination
  keep their bars (too few top players here to move them).

### R3. Casting inside the burst window: three bars above what the top players do
- Arms, Colossus Smash: bar 85%, top 75-85%: 21 of 22 yellow, with every window otherwise right. Now 76%.
- Affliction, Summon Darkglare: bar 80%, top 70-84%: 24 of 28 not green. Now 72%.
- Augmentation, Breath of Eons: bar 75%, top 62-84% (the flight itself is time with nothing cast): 6 of 14 yellow. Now 66%.
- The Oct 19 rule was already "the spec's own always-be-casting bar"; these three had their own higher number.
- **OPEN:** Outlaw's Adrenaline Rush has the same 85%. No Outlaw in the 31 pulls, so it is untouched.

### R4. Openers with a step the top tanks skip
- Protection Paladin: step 1 "Hand of Reckoning". Only the tank who takes the boss first taunts. 16 of 16 top players lost a step.
  The top marks say 75% (3 of 4) on seven of ten bosses. Step removed; the text says it isn't counted.
- Blood: the last step "Death Strike". Both guides press it for healing or near full Runic Power (guide: "heal after big damage, or
  above ~75 RP"). 11 of 17 top players not green. Step removed.

### R5. "On cooldown" and proc bars the top players miss on every boss
- Protection Paladin "Judgment on cooldown": bar 80%. The top marks are 65-72% on all ten bosses. 16 of 16 yellow. Now 62%.
- Mistweaver "Strength of the Black Ox" and "Spiritfont": top players lose 12-36% and 6-28%; 6 of 6 and 5 of 6 yellow. Bars now 26% and 20%.

### R6. Elemental "Refreshed too early" counted refreshes the player didn't choose
- **Seen:** 6 of 10 top Elemental Shamans yellow or red ("10 of your 11 refreshes came before the last 30%").
- **Why (talents and guide):** Ascendance re-applies Flame Shock itself (guide: "Ascendance: Flame Shock on 6 targets"); the guide then
  says "recast Flame Shock after Ascendance before the Elemental fades"; and Voltaic Blaze (applies Flame Shock, 10 s cooldown) is
  pressed on cooldown on 4 or more enemies.
- **Fix:** Elemental has no "Refreshed too early" row. Flame Shock uptime stays.

### R7. Shadow: Insanity's cap and where Madness goes
- "Spend Insanity ... before it caps at 100": with Voidtouched the cap is 150 (12.1.5 tooltip 407430: "increases your maximum
  Insanity by 50"). Text fixed.
- "Shadow Word: Madness uptime" only counted the boss. The guide: "Funnel Madness into the priority target". 19 of 19 top Shadow
  Priests not green (56-75%). It now counts on any enemy.

### R8. Damage over time "on the boss" while you were sent somewhere else (every DoT spec)
- **Seen:** one gap of about 160 s, 2:19 to 4:58, for the raiders sent to the other targets on The Coiled Altar: Assassination
  "Deadly Poison uptime 67%" red, Destruction "Wither 67%" red, Feral "Rake 67%", Subtlety "Atrophic Poison" red.
- **Why:** time only stopped counting when nobody in the raid had anything on the boss. A split raid always has someone on it.
- **Fix:** a stretch of 12 s or more where you made no direct hit on the boss while hitting other enemies doesn't count.
- **Also:** "your damage over time was up as the window started" looked at the boss only; a Voidform pressed on the adds failed
  (top Shadow Priests: 1 to 3 of 4 windows "done right"). Up on any enemy now counts.

### R9. Rows nearly every top player reads yellow on one boss
- **Seen on The Coiled Altar:** "Trueshot uses 4/5" (26 of 28 top Marksmanship), "Voidform uses 4/5" (17 of 19), "Dragonrage uses
  4/5" (5 of 5), "Summon Darkglare uses 4/5" (28 of 28), "Ascendance uses" (8 of 12), "Elemental Blast right before Ascendance 0/3"
  (11 of 11), "Maelstrom saved for Ascendance" (11 of 12), Restoration Shaman "Ascendance into heavy damage" (10 of 17).
- **Why:** the bars are one number for every boss. The saved top marks already differ by boss (Trueshot 100% on nine bosses, 80% on
  The Coiled Altar; Madness uptime 65% there, 91-96% on four others), but they only turned red into yellow.
- **Fix:** a yellow or red row at or above the top players' middle on this boss turns green and says "That matches the top players on
  this boss." Only with 5 or more top players behind the mark, and only for rows whose direction is known.
- **For Flex to confirm:** this is the one change with a wide reach. It is in the build, and it only ever turns a row green.

### R10. Priority lists the top players break by a guide's own words
- **Protection Paladin:** the step "Consecration whenever you are not standing in it" sat above Avenger's Shield, Hammer of Wrath and
  Judgment. That is one guide's order (Icy Veins: "Consecration if not in it"); the other ends both hero trees' lists with
  "Consecration filler" (Wowhead). All 16 top Protection Paladins broke it about 90 times a kill (1,475 slips), and the saved top marks
  put their priority at 62-76% on every boss. Step removed; Consecration stays the filler and keeps its uptime row. Top players
  after: 78% and 83% on the two re-checked kills (were 72% and 60%).
- **Discipline:** "Void Blast while Mind Blast was ready" was a slip. Both guides: "Void Blast as much as possible" inside the Rift.
  3 of 3 top players, 68 times a kill each. Void Blast now counts as right there.
- **OPEN, Protection Paladin:** "Divine Toll was ready and you had 2 or less Holy Power" still fires while a player holds Divine Toll for
  wings, which the guide also asks for ("sync with Wings"). 14 of 16 top players, about 20 slips each.

## Part 3. Facts against 12.1.5 and the guides

- **Restoration Druid, Everbloom:** two "how" texts and one code note said its blooms heal "up to 6 allies". 12.1.5 tooltip 1244331:
  "24% of Lifebloom's final bloom heals up to 5 injured allies within 40 yds". The Nov 2 audit listed this as fixed; one of three places
  was. All three now say 5 injured allies. FIXED.
- **Guide note out of date, Restoration Druid:** `notes/Guides/Classes/Restoration Druid.md` says Innervate "restores 25% max mana" and
  Everbloom splashes "to up to 6 nearby allies". 12.1.5: Innervate 20% over 8 s (29166), Everbloom 5 injured allies. The page already
  says 20%. The guide note itself is OPEN: it is the source file the next audit will read.
- **Shadow, Insanity cap:** 150 with Voidtouched (407430). FIXED (R7).
- **Cooldowns and charges, every shared-module spec:** every rule's cooldown and charge count compared with the 12.1.5 tooltips. 20
  differences, all explained by a talent the page already reads (Bestial Wrath 30 s, Retribution's wings 60 s, Fire Blast 3 charges,
  Riptide and Radiance 2 charges...) and all on the Nov 2-3 audit's "checked by play" list. Nothing new. NOTE.
- **Holy Paladin, "Light of Dawn passes only half as much to your Beacons" (3 places):** the Nov 2 audit softened this to "less"; the
  page says "half" again. The guide says half ("Light of Dawn transfers to beacons at half rate"), so it stands. NOTE.

## Part 4. Mythic+ and healers in keys (Flex: "healers play differently in keys with DPS being part of their toolkit")

What is true today:
- The priority row knows keys: pack lists for 28 specs, and for healers the damage list is judged when nobody needs healing.
- **Nothing else does.** The four hand-built pages (Holy Paladin, Restoration Druid, Preservation, Demonology) have no line that asks
  "is this a key?". The shared module has one (cooldown uses near the end of a trash pack).

Seen on Flex's Voidscar Arena +19 (`bYNMLX6nD3aPtKvg`, Holy Paladin, the Mythic+ Rotation tab on the practice copy), "to fix":
1. Infusion of Light, 49 wasted (fine on 4 of 13 pulls). "Next time: Spend each Infusion of Light on Flash of Light."
2. Holy Shock on cooldown, 56%.
3. Judgment while Holy Shock was full, 65 times (fine on 2 of 13 pulls).
4. Empyrean Legacy, 47 wasted (fine on 5 of 13 pulls).

Why those read wrong in a key, from the guide and 12.1.5:
- **Infusion of Light:** the guide: spend it "on Flash of Light if anyone needs healing; Judgment only if no good target". 12.1.5
  (53576): it also empowers Judgment (1 more Holy Power). In a key with nobody hurt, Judgment is the guide's own answer, and the
  tip tells you to Flash of Light.
- **Empyrean Legacy:** it empowers your next Word of Glory (1241358). With nobody to heal, the guide spends Holy Power on Shield of
  the Righteous, so the proc runs out. The row calls that waste.
- **Judgment while Holy Shock was full:** the key damage list accepts Judgment and Holy Shock in either order; this row doesn't.

Guide lines that say a raid rule flips in keys, and the row that still applies the raid rule:

| Spec | Guide line | Row |
|---|---|---|
| Restoration Druid | "Wild Growth ... NOT on cooldown in raid. (Mythic+: it IS on cooldown.)" | "Wild Growth into damage" |
| Restoration Druid | "Cat Form Convoke casts mostly Cat abilities (Mythic+ damage use)" | "Convoke the Spirits set up" marks Cat Form bad |
| Restoration Druid | "Raid aim: 12+ Rejuvenations; Mythic+ 5-6" | "Tranquility ramp" |
| Restoration Druid | Lifebloom, Swiftmend and HoTs on yourself sit under "Raid rotation" | "Lifebloom on you", "Swiftmend on yourself", "Your HoTs on you", "Nature's Swiftness on yourself" |
| Holy Paladin | "In raid, Divine Toll and Aura Mastery go inside Beacon of Virtue ... (M+: separate them.)" | both "inside Beacon of Virtue" rows |
| Holy Priest | "M+ (Wowhead): like raid, no Prayer of Healing, Holy Fire talents for downtime damage" | not checked |
| Restoration Shaman | "M+: Totemic, Healing Tide over Ascendance" | the Ascendance rows |
| Mistweaver | "Mythic+: Chi-Ji 'Apexless' build: skip Spiritfont" | "Spiritfont" |
| Beast Mastery | "Kill Command (ignore Nature's Ally at 4+ targets)" | "Kill Command with Nature's Ally" counts every Kill Command |
| Beast Mastery | "Hold it in M+ if the pack dies within ~12 s" | "Bestial Wrath uses" |

**All OPEN.** None of these is changed in this round: each needs a real key from that healer spec to test on (only Flex's Holy Paladin
key was at hand), and the Holy Paladin rows are Flex's own spec, so his word decides. Proposed rule, in one place (`specPage`): on a
key pull, a healer's healing-proc rows and the raid-only rows above are shown, not graded, with the line "In a key this isn't graded:
when nobody needs healing, your globals go to damage."

## Part 5. Where each spec stands after this round

- **Read line by line against its guide and the 12.1.5 text:** Restoration Druid, Beast Mastery Hunter, Shadow Priest, Protection
  Paladin (priority and opener), Discipline Priest (priority).
- **Covered by the top-kill test, the cooldown cross-check and the Timeline rebuild, not yet read line by line:** every other spec.
  With no top player in the 31 pulls, so only the cross-check: Brewmaster, Outlaw, Fire, Fury, Survival, Demonology.
- **Rows still not green for most top players after the fixes (to look at next, with the library):** Elemental "Stormkeeper before
  Ascendance" (8 of 12), Mistweaver "Celestials into heavy damage" (4 of 6), Protection Paladin "Consecration uptime" (6 of 16),
  Discipline's Evangelism and Ultimate Penitence set-up rows (3 of 3, three players only), Feral "Rake uptime" and "Energy wasted"
  (2 of 2, two players only), Balance "Time in Eclipse" (8 of 24).

## Part 6. The fix round (saved to main, not live)

- Before and after on the same 630 pages: 382 rows changed, all toward green; 0 rows got worse; 253 scores went up, none went down.
  Re-checked on newest main (5 pulls, 100 pages): 57 rows better, 0 worse, no errors.
- Build checks: the build's own contradiction check passes. Retribution's Nov 7 bar is guarded there and was left as it was.
- Practice copy: https://rotaudit2-debrief.james-m-nemecek.workers.dev (Thursday's pull: `?report=2r1KzqygWAFHkZT3&fight=32&tab=rot&p=Zaffia`).
- Scripts (exact replacements, each must match once): `fix1.js`, `fix2.js`, `fix3.js`, with copies in the shared notes folder under
  `rotation-audit-nov9/`.
- **How to re-run the test:** `rotj.js` (the real page code in node over saved nights), `sumj.js fail` (rows the top players fail),
  `sumj.js notes` (every Timeline note), `cmp.js` (before and after). Same folder.

### Needs Flex's call
1. **R9, green at the top players' middle on that boss.** It is in this build. It only turns rows green, but it is the widest change.
   One block in `specPage`; say the word and it comes out.
2. **Part 4, keys:** build the "not graded in a key" rule, starting with Holy Paladin and Restoration Druid?
3. **Protection Paladin, Divine Toll held for wings** (R10 OPEN).
4. **The Restoration Druid guide note** (Innervate 25%, Everbloom 6): correct the note file?
5. **Outlaw's 85% window bar**, and tighter resource bars for Unholy, Devourer and Assassination, once the library has enough of them.

## Part 7. Keys, second round (Flex: "Yes, build it", "do everything you can to make sure the feedback the site gives for rotations is very accurate")

**How keys were tested.** The site's own list of fast timed runs (`WCL.mpFast`, +18 to +20, all eight dungeons, 268 runs) gave real keys
for every spec that appears in them. Nine were opened on the practice copy and every player's "Every check across the key" was read:
which rows a fast-run player is "fine" on for half the pulls or fewer. Runs used: `DnJpvGkZ3qTCymdQ:7`, `qcjV9YwC4RJa3TL7:1`,
`6ZkhwvxdLQKHpaRX:1`, `wXmTt9pQRYBqhJHk:2`, `m8c9yhgPNHtMFfRx:11`, `6fnNb9vpT1adL2qz:15`, `YKGvdxPny8Lm6fH9:23`, `41p2v96fFCZrVhYJ:3`,
`Cn1rQVz4df79hwDv:93`, plus Flex's `bYNMLX6nD3aPtKvg:1`. 30 specs seen. Not in any fast run at these levels: Fire, Frost Mage,
Affliction, Devastation, Augmentation.

### K0. Healers: the raid healing rules don't hold in a 5-player group. FIXED
- Restoration Druid, timed +20 (Zuckles): 28 checks, 7 clean. "Swiftmend on yourself" fine on 1 of 10 pulls, "Wild Growth into damage"
  1 of 9, "Lifebloom on you" 1 of 10, "Regrowths against Rejuvenations" 0 of 10, "Abundance uptime" 2 of 10, "Convoke the Spirits set
  up" 2 of 8, "Tranquility ramp" 1 of 4.
- Restoration Shaman, timed +20 (Milkytotems): "Riptide on new targets" fine on 0 of 11 pulls (94 of 206; the three fastest runs: 108).
- Holy Priest, timed +20 (Pititpeluche): "Prayer of Mending on players without Renew" 2 of 24, "Apotheosis windows" fine on 1 of 7.
- Holy Paladin (Flex, +19): Infusion of Light 49 wasted, Empyrean Legacy 47 wasted, Judgment while Holy Shock was full 65 times.
- **Fix:** on a key pull a healer's healing rows are shown, not graded, with "In a key this isn't graded: how much healing a pull needs
  decides it, and when nobody needs healing your globals go to damage." Still graded: the priority row (it already judges the damage
  buttons when nobody needs healing), always be casting, cancelled casts, what was on at the pull, Power Infusion.
- **After, same keys:** Zuckles 25 checks, 23 clean, then only the graded rows; Flex's key: trash pulls clean, 1 boss pull to fix
  (priority), 80 -> 96. Raid pages: 0 differences on 60 pages.

### K1. A big cooldown still cooling down from the pack before. FIXED
- "Uses" on boss pulls read fine on 0 or 1 of 3-4 for Havoc (Metamorphosis 4 of 6), Guardian (Lunar Beam 12 of 14), Protection
  Paladin (Divine Toll 8 of 10), Brewmaster (Niuzao 4 of 6), Feral (Berserk 5 of 7), Elemental (Ascendance 7 of 9).
- **Why:** each pull was counted as if the cooldown were ready at its first second.
- **Fix:** in a key, one use fewer is possible on each pull for a cooldown of 45 s or more.

### K2. Tanks' and Feral's wasted resource. FIXED (shown, not graded in a key)
- Fine on 0 of 11 pulls for Feral (Energy 20%), 1 of 11 Vengeance (Fury 22%), 2 of 10 Protection Warrior (Rage 8%), 4 of 16 Blood
  (Runic Power 18%), and Guardian's Rage on 4 of 7 trash pulls. Packs fill the bar faster than one enemy does.

### K5. Hunter's Mark at the pull, on every trash pack. FIXED
- A fast +20 Beast Mastery Hunter read it fine on 4 of 12 pulls. Not judged on a key's trash packs.

### Still OPEN in keys (rows a fast-run player fails on half the pulls or more; each needs its pack rule)
| Spec | Row | Fine on |
|---|---|---|
| Guardian (two players) | Thrash on cooldown (360 of 582), Mangle on cooldown (313 of 517; 329 of 534), Lunar Beam uses | 5/10, 4/10, 3/11, 1/4 |
| Enhancement | Maelstrom Weapon, 538 wasted; Voltaic Blaze on cooldown | 0/10, 4/10 |
| Feral | Apex Predator's Craving, 79 wasted; Finishers at 5 combo points 85% | 3/11, 4/11 |
| Fury | Rotation priority 82%; Odyn's Fury on cooldown | 4/11, 4/10 |
| Arms | Bladestorm in Colossus Smash, 26 of 39 | 1/11 |
| Arcane | Touch of the Magi after a Barrage, 20 of 24 | 4/8 |
| Protection Paladin | Holy Armaments on cooldown, 25 of 40 | 3/12 |
| Elemental | Stormkeeper before Ascendance; Maelstrom saved for Ascendance | 1/3, 5/10 |
| Havoc | Exergy uptime 89% | 5/10 |
The common thread: "X on cooldown" and "X inside Y" rows are single-target rules, and on packs the priority list already tells the
player to press something else. The clean fix is to stop grading a row on a pack pull when the spec's own pack list ranks another button
first; that is a per-spec job.

### What this round did not do
- Heroic raid: not tested. One raid boss carries most of the raid evidence (The Coiled Altar).
- 35 specs still not read line by line against their guides. Guide notes not re-read against the live guide pages.
- The Mythic+ tab's own "top X (3 runs)" numbers are shown beside each row but don't colour it. Using them the way the raid rule (R9)
  uses the top marks would settle most of the OPEN table at once. That code is in `src/mptab.js`, the Mythic+ chat's file.

## Part 8. Talents, and the next specs read line by line (Flex: "Yes, carry on")

### The talent scan (all 36 shared-module specs)
For every 12.1.5 talent whose text replaces a button, casts it for you, or changes its cooldown or charges, and names a spell the spec's
rules judge, while the spec's rules never mention that talent: 172 hits, each read. Script: `talscan.js`.

- **TL1. Retribution, Radiant Glory. FIXED.** 12.1.5 (458359): "Avenging Wrath is replaced with Radiant Glory. Wake of Ashes activates
  Avenging Wrath for 8 sec." The guide's Mythic+ build takes it. The rules never knew it, so a player with it kept an "Avenging Wrath
  uses" row for a button they don't have, plus the opener step and the window. All four now switch off with Radiant Glory. Not seen on a
  real log yet (the Retribution Paladins in the fast keys play Avenging Wrath).
- **How cooldowns are read, for the record.** "Uses" and "on cooldown" rows take a spell's base cooldown from the game by its id, then a
  talent override where one is written (`cdT`), then what the log shows. So Combustion without Kindling (2 min) and Meteor without Blast
  Zone (45 s) are counted right on the site. The node test falls back to the written number, so it can differ from the site there.
- **TL2. OPEN: priority steps use a written cooldown as it is.** Three assume a talent: Beast Mastery's Bestial Wrath at 30 s (needs The
  Beast Within, -60 s), Enhancement's Ascendance at 2 min (needs Thorim's Invocation, -60 s) and Totemic's Lava Lash at 7.2 s (Molten
  Assault, Ashen Catalyst, Hot Hand). Without the talent the step says "it was ready" while it was cooling down. Top players all take
  them, so nobody was seen blamed. Gating a step on a passive talent switches the step off when a log has no talent list, so this needs
  a per-step cooldown-by-talent option first.
- **TL3. NOTE:** every other hit shortens a cooldown or adds a charge, where the row then expects fewer uses than were possible. That is
  lenient, never blame.

### Read line by line this round: Havoc, Frost Death Knight, Arms, Retribution, Fury, Unholy
- **Arms, packs. FIXED.** The pack list had Mortal Strike before the plain Overpower. The guide (Slayer AoE): "Cleave -> Overpower at 2
  charges -> Execute -> Overpower -> Mortal Strike -> Slam", and the step's own tip says "once Cleave and Overpower are spent". Swapped.
- **Havoc. FIXED (wording).** Essence Break "for 4 seconds": 6 with 4 pieces of the tier set (guide: "4 s, 6 s with tier").
- **Unholy. FIXED (wording).** Two pack steps for Epidemic carried Death Coil's tip ("Death Coil with Sudden Doom...").
- **Frost Death Knight:** nothing found. Rules match both guides, the 4-or-more Glacial Advance line and the Rider and Deathbringer split.
- **Fury. OPEN:** Odyn's Fury is a priority step for both hero trees. The guide's Mountain Thane lists don't have it (only the pack
  opener). A fast-run Fury read "Odyn's Fury on cooldown" fine on 4 of 10 pulls and priority on 4 of 11.
- **Havoc. OPEN:** "Eye Beam on cooldown" counts 30 s; Cycle of Hatred brings it to 20 s (lenient). The Hunt's tip says "as Aldrachi
  Reaver" to Fel-Scarred players too.
- **Arms. OPEN (keys):** "Bladestorm in Colossus Smash" on packs (fine on 1 of 11 pulls for a fast-run Arms): Sudden Death brings
  Bladestorm back faster than Colossus Smash there.

### Where the count stands
Read line by line: 11 of 40 (Restoration Druid, Beast Mastery, Shadow, Protection Paladin, Discipline, Havoc, Frost Death Knight, Arms,
Retribution, Fury, Unholy). All 36 shared-module specs: cooldown cross-check, talent scan, top-kill test (38 specs), fast-key test (30).
Not read line by line yet: 29, the four hand-built pages' full text among them (Holy Paladin, Preservation, Demonology in full).

## Part 9. The priority row: slips every top player makes (Flex: "Keep going")

**Method.** For each spec, every priority slip ("you pressed A, but B was better") was counted over the 19 fastest Mythic Coiled Altar
kills (`slips.js`). A slip that nearly every top player makes many times a kill was read against the guide. Three kinds came out.

### P1. A cooldown the raid holds counted a slip for every second it was held. FIXED
- The step "X was ready" kept firing until X was pressed. A raid that holds a cooldown 30 s for a phase took 20 slips for one decision,
  on top of the "uses" row that already shows it. The option for this existed (`hold: 10`, wanted for 10 s after it's ready) on one
  step, Unholy's Army of the Dead.
- Slips a kill among top players: Avenging Wrath 28 (8 of 8 Retribution), Halo 22 (19 of 19 Shadow), Goremaw's Bite 21 (20 of 20
  Subtlety), Dragonrage 19 (5 of 5 Devastation), Reaper's Mark 14 (9 of 9 Frost DK), Breath of Eons 14 (11 of 14 Augmentation), Volley
  10 (27 of 28 Marksmanship), Dark Harvest 6 and Malevolence 5 (Affliction).
- **Fix:** those steps (and Destruction's Malevolence and Blood's Reaper's Mark, the same steps) are wanted for 10 s after they're ready.

### P2. Havoc: "Reaver's Glaive as soon as you have it". FIXED (step removed)
- All 16 top Havoc Demon Hunters broke it, about 79 times a kill (1,264 slips). The ones who hold the Glaive read 59-72% on priority;
  the ones who don't read 91-97%.
- The guide: "Hold Reaver's Glaive for adds to funnel." The pack list already had no such step, and the row's own text admitted "a held
  Glaive may be on purpose".

### P3. One guide's order, where the other guide puts another button first. FIXED (the other button counts as right)
- **Affliction, Haunt before Agony.** Wowhead: "Haunt -> Agony -> Wither". Icy Veins: "maintain Agony + Corruption/Wither -> ... ->
  Haunt". Refreshing Agony, Wither or Corruption while Haunt is ready is no longer a slip. 28 of 28 top players, about 13 a kill.
- **Elemental, Flame Shock refresh before Lava Burst.** Wowhead puts Lava Burst first. 10 of 12 top players, about 10 a kill.
- **Vengeance, Fel Devastation before Soul Cleave.** The guide's order is "Soul Cleave with 1+ Souls -> Fel Devastation (50+ Fury)".
  2 of 2 top players, 47 a kill.
- **Windwalker, Celestial Conduit.** In the guide's own sequence it comes after Strike of the Windlord, Fists of Fury, Rising Sun Kick
  and Whirling Dragon Punch ("Don't cast Conduit too early"). 11 of 11 top players, about 10 a kill.
- **Windwalker, Spinning Crane Kick with Unbroken Rhythm on one target.** The guide's step is "with Dance of Chi-Ji and Unbroken
  Rhythm"; Unbroken Rhythm alone is the pack rule. 11 of 11 top players, about 17 a kill. The one-target step now needs both.
- **Preservation, spending an Essence Burst before Temporal Anomaly or Merithra's Blessing.** Temporal Anomaly on cooldown is the
  guide's second priority and Merithra's Blessing goes out "when damage hits". 15 of 15 and 11 of 15 top players.

### Read and left as they are (the guide backs the rule, so it stands)
- Blood, "Blood Boil sat at 2 charges": all 17 top players, 22 a kill. Both guides: "never cap Blood Boil charges".
- Arms, "Heroic Strike before Mortal Strike": 22 of 22, 8 a kill. Both guides put Heroic Strike first.
- Balance, "Starsurge before Starfire inside Eclipse": 24 of 24, 13 a kill. The guide's inside-Eclipse order.
- Marksmanship, "Explosive Shot on cooldown": 26 of 28, 8 a kill. The guide: on cooldown.
- Subtlety read line by line: nothing found.

### OPEN from this pass
- Elemental: "Elemental Blast with both tier buffs / near full Maelstrom" before Lava Burst (9-10 of 12 top players, 5 a kill each).
- Shadow: "Shadow Word: Madness about to fall off / near full" before Void Volley (19 of 19, 6 a kill).
- Affliction: "Agony refresh" before Shadow Bolt (23 of 28, 9 a kill): likely a Nightfall Shadow Bolt.

### P4. Top marks read with the old rules. FIXED (left out until the top players are read again)
- The saved top-player marks were read before today's changes. An old priority mark (Havoc about 80% with the Reaver's Glaive step,
  Protection Paladin 63% with the Consecration step) is lower than what the same players score now (Havoc 90-99%, Protection Paladin
  65-85%). Beside the row "top X" was out of date, and "matches the top players on this boss" (R9) came too easily.
- **Fix:** each row whose rule changed today is on its spec's `topNew` list, the switch that already existed for this: priority for
  Havoc, Protection Paladin, Vengeance, Discipline, Affliction, Augmentation, Devastation, Marksmanship, Subtlety, Windwalker,
  Retribution, Elemental, Shadow and Preservation; the opener for Protection Paladin and Blood; Hunter's Mark; Shadow's Madness uptime
  and Voidform windows.
- **Data job, OPEN:** read the top players again from the log library so these rows get their marks back. Damage-over-time marks on
  fights with a split (The Coiled Altar) are a little low for the same reason.
- Two bars set from the top players once the old marks were out: Shadow Word: Madness uptime 87% (19 top Shadow Priests, counted on any
  enemy: 86-96%), Protection Paladin priority 62% (16 top players: 65-85%).
- Mistweaver wording: "never sit at 3 charges of Renewing Mist" said 3 to everyone; it is 2, or 3 with Pool of Mists.

### After this round, against where the day started (219 of the same pages)
149 rows fairer, 0 worse, 96 scores up, none down. Top players' priority rows now sit close together: Havoc 90-99%, Windwalker 93-98%,
Subtlety 91-99%, Augmentation 95-99%, Devastation 94-99%, Affliction 82-96%, Marksmanship 84-97%, Elemental 86-99%, Retribution 83-94%.
A tight band at the top is what a correct priority row looks like; a wide one (Havoc was 59-97%) meant the rule was judging a choice.

### Where the count stands
Read line by line: 15 of 40 (adds Subtlety, Marksmanship, Holy Priest, Windwalker). Every spec's priority row: checked against what the
top players press. Still not read line by line: 25.


## Part 10: The last specs, read line by line (round 7)

Flex: "Keep going until youre done with them all". Every raid spec's rules have now been read next to its class guide: the 36 shared pages rule by rule,
and the four hand-built pages (Holy Paladin, Restoration Druid, Preservation, Demonology) by their priority lists and what the top players slip on.
Read in this pass: Assassination, Outlaw, Feral, Enhancement, Survival, Devourer, Arcane, Fire, Frost Mage, Affliction, Destruction, Devastation,
Augmentation, Balance, Elemental, Demonology, Restoration Shaman, Mistweaver, Brewmaster, Protection Warrior, Blood, Guardian, Vengeance, Holy Paladin,
Preservation.

### What was wrong, most misleading first

| # | Where | What a raider saw | Why it was wrong | Fix |
|---|---|---|---|---|
| S1 | Every spec with a "refresh it in its last 30%" step (Affliction, Destruction, Assassination, Feral, Balance, Elemental, Guardian, Arms) | "You pressed Shadow Bolt while Agony was in its last 5.4 seconds", many times a pull | The 30% window is when a refresh loses nothing. It is not a deadline. Top Affliction Warlocks cast a filler with Agony at 4 or 5 seconds left 8 to 15 times a kill and never dropped it | The step is wanted only in the last 3 seconds, or once the DoT is off. Refreshing earlier in the window still counts as right |
| S2 | Same steps | The same slip while the player was on an add | The uptime rows already leave out your time on another enemy; the priority row didn't | The priority row leaves it out too (12 seconds or more with every hit on something that isn't the boss) |
| S3 | Balance | "You pressed Starfire in Eclipse with Astral Power to spend", about 12 times a kill for all 9 top Balance Druids | Wowhead spends inside Eclipse for the first three (Ascendant Eclipses), procs, capping and movement, then Starfire. The 4-piece wants spenders at an Eclipse's start and end | Step removed, single target and packs. Capping, free procs and Eclipse at 2 charges are still judged |
| S4 | Blood | "You pressed Heart Strike with Blood Boil at 2 charges", about 22 times a kill for all 17 top Blood Death Knights | On one target Heart Strike spends the Runes that would cap; the log has no Rune count to tell | Heart Strike and Vampiric Strike count as right on one target. On a pack the step stays |
| S5 | Protection Warrior | "You pressed Revenge while Execute was usable", about 22 times a kill for both top Warriors | Icy Veins: Execute "if you don't need the Rage"; the tier set wants a free Revenge inside 5 seconds | Revenge counts as right |
| S6 | Elemental | "You pressed Lava Burst with both tier buffs up" | 4 of 5 top Elementals Lava Burst first, so Master of the Elements is on the spender (Wowhead's order) | Lava Burst counts as right |
| S7 | Feral | "You pressed Regrowth, not Ferocious Bite" | Regrowth is a heal | Regrowth is never judged. Energy bar 15% / 22% (Wowhead: a little waste is fine; top Ferals lose 11 to 13%) |
| S8 | Mistweaver | Rushing Wind Kick before Renewing Mist at full charges, or Mana Tea at 20 | The two guides disagree on the order | Either order counts |
| S9 | Guardian, Restoration Shaman | Uses counted on the base cooldown | 12.1.5 tooltips: Lunation takes 20 seconds off Lunar Beam; First Ascendant takes a minute off Ascendance and Healing Tide Totem | The talent's cooldown is used when the talent is taken |
| S10 | Guardian and Enhancement in keys | "Thrash on cooldown", "Mangle on cooldown", "Lunar Beam uses", Maelstrom Weapon wasted, "Voltaic Blaze on cooldown" marked on packs | Single-target habits that the fastest key runs break on every pack | Shown, not graded, in a key (`keyNa` on the spec) |
| S11 | Fire, Arcane (wording only) | Fire's pack step for Pyroclasm had the Hot Streak tip. Arcane said to cast Prismatic Bolt "quickly" | Pyroclasm is spent on a hard cast (12.1.5 tooltip: Pyroblast or Flamestrike). Prismatic Bolt lasts a minute and both guides hold it for Cumulative Power with the 4-piece | Text corrected |

### Read with nothing to change
Outlaw, Survival, Devourer, Frost Mage, Destruction, Devastation, Augmentation, Demonology, Brewmaster, Vengeance, Holy Paladin, Preservation, Restoration
Shaman's priority (top players 86 to 100%).

### Tested
All 31 test pulls again (19 fastest Mythic Coiled Altar kills, ten bosses, two Wolfthorn pulls), 629 player pages, against the start of the day:
**412 rows fairer, 0 worse, 267 scores up, none down.** Top players' priority, start of day to now: Balance 86 to 93%, Blood 90 to 95%, Affliction 87 to 90%,
Assassination 81 to 85%, Destruction 82 to 91%, Feral 88 to 96%, Elemental 90 to 94%, Protection Warrior 93 to 96%. A fast +20 Den of Nalorakk run on the
practice build: the Guardian reads 96 with no "on cooldown" rows marked on packs.

### Still open (none of these blame right play as far as the data shows)
- Affliction: four of 28 top Warlocks still take 11 to 49 "Agony missing" slips a kill. They look like players assigned to a target that isn't a boss unit. Needs a look at their pulls.
- Assassination 82 to 89% for the two top Rogues: Kingsbane held with Envenom up (26 slips), and Mutilate at 5 combo points. Two players is too few to change a rule on.
- Balance: free-proc steps (Touch the Cosmos, Starweaver's Warp) are the top slips left, 3 to 6 a kill. The guides say spend them; left as is.
- Blood Boil at 2 charges on a pack is still judged; no fast-run evidence yet that it shouldn't be.
- Augmentation: the 2-piece takes 10 seconds off Upheaval; the row uses the cooldown the log shows, so it is lenient at worst.
- Restoration Shaman: "Unleash Life on cooldown" has no Farseer gate (Totemic can take it as an option).
- Devastation: Deep Breath has no hold; the one top Devastation in the data takes 5 slips a kill for it.
- From earlier parts, unchanged: Heroic untested; the top players' marks for every `topNew` row need a fresh read (a data job); Frost Mage's guide note on Fingers of Frost is out of date (the site is right); Outlaw's window bar is unmeasured.


## Part 11: Every spec and hero tree on top players' logs (round 8)

Flex: "Just get it all done". Until now the proof came from one boss's fastest kills, so some specs had zero to two players. This round ran the real
Rotation page on **2,229 top-player pages from 348 Mythic kills since Oct 6, all ten bosses**, straight from the log library (no downloads). Every spec
has 34 to 65 players. Three runs: before the fixes, after, and with the final rules.

Scripts (shared notes folder, `rotation-audit-nov9/lib/`): `select2.js` picks the kills, `libj.js` runs them, `tsum.js` reads them (`cover`, `rows`,
`slips`, `tal`, `vals`, `gaps`), `one.js` and `probe.js` open one player, `marks.js` writes the top players' marks back into the app.

### What the logs showed that reading the guides did not

**1. Priority steps all top players break (slips a kill, players)**

| Spec | The slip | Why it was wrong | Fix | Priority, before to after |
|---|---|---|---|---|
| Protection Paladin | Blessed Hammer "with a Judgment charge", 36 a kill, 55 of 55 | They keep a charge banked; in wings Judgment's button is Hammer of Wrath and spends the same charges; Divine Toll waits for 0 Holy Power (Wowhead) | Judgment only at 2 charges, Hammer of Wrath shares them, Divine Toll at 0. Bar back to 80% | 76% to 93% |
| Brewmaster | Keg Smash or Breath of Fire "with Blackout Kick ready", 40 a kill, 45 of 45 | They press Blackout Kick every 5.7 s, not every 4: the tier set wants Breath of Fire into Keg Smash | Either counts as right. Niuzao held 10 s. Blackout Kick row bar 50% | 88% to 97% |
| Discipline | Smite "with Mind Blast ready", 20 a kill, 52 of 52 | Mind Blast is timed for the Rift and the ramp | Smite counts as right | 92% to 98% |
| Fury | Rampage wanted "with no Enrage" without its 80 Rage; Bloodbath and Crushing Blow before Rampage; Odyn's Fury had no cooldown written | 40 of 41 top Slayers | Rampage needs 80 Rage, the lit-up buttons count, Odyn's Fury is 45 s and held 10 s at most | 85% to 94%, lowest 47% to 89% |
| Beast Mastery | Cobra Shot "with Howl of the Pack Leader ready", 13 a kill, 61 of 61 | The 30-second timer and "ready" are two auras with one name | New rule: only while that stretch of the buff has had no Kill Command. Kill Command saved for Bestial Wrath | 90% to 93% |
| Vengeance | Soul Cleave "with Sigil of Spite ready", 13 a kill, 47 of 47 | Both guides spend first so the Sigil's Souls and Fury aren't lost | Soul Cleave and Spirit Bomb count as right | 92% to 96% |
| Blood, Deathbringer | Heart Strike "with Exterminate up", 29 a kill, 5 of 5 | Both guides: on one target Exterminate is a low-priority filler | Fillers count as right | 80% to 89% |
| Protection Warrior | Anything "with Demoralizing Shout ready", up to 36 a kill as Colossus | A defensive held for the hits; its uses row grades it | Not in the priority. Demolish held 10 s | Colossus 84% to 90% |
| Shadow, Voidweaver | "Mind Blast was ready", Shadowy Insight "wasted", 6 of 6 | Void Blast takes Mind Blast's place in the Rift and shares its charges | Void Blast counts | 87% to 94% |
| Balance, Keeper of the Grove | Wrath "within 20 Astral Power of full", 10 a kill, 17 of 18 | Their bar holds 140, not 100 | Read as a share of the bar | 90% to 95% |
| Survival | Boomstick "ready" without Tip of the Spear; Takedown "at 0 Tip" | Boomstick is always Tipped (Icy Veins); nobody presses Takedown at 0 Tip | Boomstick waits for Tip; Kill Command before Takedown counts | 93% to 94%, score 82 to 94 |
| Fire | Scorch "with Pyroclasm", 8 a kill | Scorch is the moving and execute cast | Counts as right | 93% to 95% |
| Frost, Frostfire | Ice Lance "with Glacial Spike ready", 7 a kill, 11 of 11 | Fingers of Frost and Thermal Void go first | Counts as right | 89% to 90% |
| Enhancement, Affliction | Ascendance, Summon Darkglare "ready" while held | 2-minute cooldowns held for the burst | Held 10 s at most | Enhancement 90% to 95% |

**2. Two rules that were wrong for every raid fight**
- The pack list was used whenever 3 bosses were alive, stacked or not. Fury took 8 "Whirlwind buff down" slips a kill, Arms 9 for Cleave, Assassination
  9 for Fan of Knives, Subtlety 7 for Shuriken Storm. Now it is the enemies you are hitting yourself. Assassination's lowest tenth went from 68% to 82%.
- "The boss was under 35%" read the lowest boss in the room. It now reads the boss you are on.

**3. Openers.** Survival (31 of 37 failed, 20 red), Brewmaster (42 of 45), Blood as San'layn (36 of 58) and Frost Mage (21 of 52 red) had a fixed
order nobody follows. Each is now the same buttons in any order, read from what the top players press in their first 15 seconds.

**4. Rows most top players fail on every boss.** A new table, `ROW_SOFT`, marks a row "shown, not graded" or "amber at most", by spec and hero tree.
Shown, not graded: Survival's Takedown at 0 Tip (35 of 37), Elemental's Elemental Blast before Ascendance and Maelstrom saved for it, Restoration
Druid's Regrowths against Rejuvenations (58 of 60), Restoration Shaman's Ascendance set up, Vengeance's Fel Devastation on cooldown, Holy Priest's
Guardian Spirit uses, Balance's Fury of Elune and Force of Nature right before the cooldown, Discipline's Ultimate Penitence ramps (38 of 44),
Enhancement's melee uptime (54 of 55: Ascendance turns swings into Windlash), the Shamans' shield at the pull. Amber at most: Preservation's Temporal
Anomaly before the pull, Holy Paladin's Aura Mastery inside Beacon of Virtue, Restoration Druid's Swiftmend on yourself, mana at the kill for Holy
Paladin and Discipline, Devourer's Void Ray count.

**5. Hero trees and talents (the talent walk).** For every talent some top players take and others don't, each row's pass rate was compared.
- Havoc, Fel-Scarred: Eye Beam is cast as Abyssal Gaze in Metamorphosis, so "Eye Beam on cooldown" failed 6 of 8. Now counted: 8 of 8 pass.
- Protection Warrior, Colossus: Thunder Clap is pressed about half as often (7 of 8 failed). It has its own bar.
- Balance, Keeper of the Grove: Ascendant Fires read red for 16 of 18 (they fill with Wrath). Not graded for that tree.
- Frost, Frostfire: "Ray of Frost in Bloodlust" was red for 9 of 9 who don't take Ray of Frost; "Ice Lances on 12 Freezing" failed 7 of 11.
- Blood, Deathbringer: the Dancing Rune Weapon window is San'layn's. Not graded for Deathbringer.
- Devourer, Void-Scarred: Void Ray count in Metamorphosis is lower than Annihilator's. Not graded for that tree.
- Brewmaster with Fluidity of Motion (5 of 5 failed Blackout Kick on cooldown), Feral with Rampant Ferocity, Assassination's movement build: softened.

**6. Bars read from the top players** (green near their lowest quarter, amber near their lowest tenth): Survival's pressing and Focus, Arms' Bladestorm in
Colossus Smash, Elemental's Voltaic Blaze and Stormkeeper pairs, Restoration Shaman's Riptide on new targets and Nature's Swiftness, Outlaw's Adrenaline
Rush at low combo points, Enhancement's Maelstrom Weapon and Voltaic Blaze, Devourer's Soul Immolation, Vengeance's Fury, Fire's Heat Shimmer,
Balance's Astral Power going into Incarnation.

**7. Top players' marks.** Every row whose rule changed has its mark read again from these kills: 845 marks and 275 scores across all ten bosses.
The `topNew` lists are gone. Six marks on The Twin Fangs were dropped where fewer than 3 new players had the row.

### Keys
- The open table in Part 7 is closed with `keyNa`: Feral (finishers at 5, Apex Predator's Craving), Fury (Odyn's Fury), Arms (Bladestorm in Colossus
  Smash), Arcane (Touch of the Magi after a Barrage), Protection Paladin (Holy Armaments), Elemental (Stormkeeper before Ascendance), Havoc (Exergy).
- Fire, Frost Mage, Affliction and Devastation are in none of about 470 fast timed runs (+15 to +20, all eight dungeons). There is nothing to test them on.
- Augmentation: one fast +17. It reads 92. Ebon Might uptime is marked on 6 of 8 trash pulls; one run is too few to change the rule.

### Tested
- Final rules on all 2,229 pages: no errors. Rows that 55% or more of top players still fail: mana at the kill (amber, healers on short kills) and one
  Soul Harvester row with 13 players.
- The site itself (practice build) gives the same numbers as the test harness on a library kill: Discipline 93 and 97%, Brewmaster 98 and 97%.
- The 31 pulls from earlier rounds, 629 pages, against the start of the day: 630 rows fairer, 4 stricter. The stricter ones: two Protection Paladins at
  75% priority now read amber (the bar went back to 80% once the list stopped blaming top players), one Demonology at 80%, and one opener on a saved
  night that has no talent list.

### Still open
- Hero trees no top raider plays can't be proven on logs: Stormbringer Elemental, Totemic Enhancement, Farseer Restoration Shaman, Flameshaper
  Devastation (2), Diabolist Destruction (1), Deathstalker Rogues, Colossus Arms, Mountain Thane Fury (1), Templar Protection Paladin (1), Lightsmith
  Holy Paladin (1), Master of Harmony Mistweaver (1), Shado-Pan Windwalker (1), Rider of the Apocalypse (2), Soul Harvester Demonology, Pack Leader
  Survival (2), Dark Ranger. Their rules are read against the guides only.
- Beast Mastery: Cobra Shot with Nature's Ally up and a Kill Command charge, 6 a kill for all 61. Not understood yet.
- Arms: Mortal Strike before Heroic Strike with Master of Warfare, 4.5 a kill; both guides put Heroic Strike first, so the rule stays.
- Unholy: Soul Reaper under 35%, about 10 a kill; both guides press it, so the rule stays.
- Mistweaver with Chi-Ji (4 players) reads 79% priority: the list is the Yu'lon raid build's.
- Devastation: 11 players on one build miss the opener (2 of 6 steps). Not looked at.
- Not rotation, but on the same page: "Stat order" reads amber for 54 to 98% of top players in 14 specs. Worth its own look.
