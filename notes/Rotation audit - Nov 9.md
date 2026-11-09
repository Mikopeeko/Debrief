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
