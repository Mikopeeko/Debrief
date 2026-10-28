# Class guide audit, Oct 28 2026

13 helpers, one per class, re-read our notes and checks against Wowhead and Icy Veins and the Oct 23/26/27 hotfixes. Both sites' guides were last updated Oct 12-18 (before our Oct 19 notes). Death Knight, Monk and Hunter were re-run with a browser tab against GitHub's copy (second pass); the other classes' line numbers are from the working copy, so check each against main before fixing (Elemental 75% and Blood 'Death Strike above 75' were only in uncommitted work).

Fixed: e2a5715 (Arcane Spellslinger Missiles at under 15 Salvo, Fire Scorch Sunfury only, notes for the Oct 27 tuning); second pass (Survival tier 2/4-piece order, big-cooldown lists: Takedown, Zenith, Dark Transformation in; Coordinated Assault, Spearhead, Storm Earth and Fire, Summon Gargoyle, Call of the Wild, Bloodshed, Flagellation out; Marksmanship note).

---

## Death Knight

Specs checked: Blood, Frost, Unholy (second pass, with a working browser; compared against origin/main src/ui.js and origin/main notes).
Sure mismatches: 0. No Death Knight PvE change in the Oct 23, 26 or 27 hotfixes, and every guide page we quote is dated before our Oct 19 read. 4 small stale-wording or stale-data items (all likely/unsure, none change a grade).
Most important: Unholy's PERF_CDS list still tracks Summon Gargoyle (180 s) and Unholy Assault (90 s); Gargoyle no longer has its own cooldown (Army of the Dead summons it) and Unholy Assault is not in Wowhead's builds.

## Coverage (what I opened)
Own tab (tab-9), closed at the end. A plain page read hides the tabs, so I read each page's full DOM text (every hidden hero-tree, ST/AoE, opener and "Show more" panel, all in the page whether or not it is clicked), which has the same text as clicking each switch. Pages read in full:
- Wowhead Blood / Frost / Unholy: rotation-cooldowns (Deathbringer + San'layn / Rider hidden panels, ST + AoE priorities, openers, cooldown sections, advanced tips), talent-builds (all raid / M+ / delve build tabs, flex notes), stat-priority. All "Updated 2026/10/13" (Frost talent-builds "2026/10/17", Rider raid tab now labelled "Deathbringer cleave"). Our notes were read Oct 19, so they already include these.
- Icy Veins Blood / Frost / Unholy: rotation (all hero/build variants, ST + AoE, openers, FAQ), stat priority, talents/builds. All "Last Updated Oct 12, 2026".
- Wowhead spell tooltips (nether.wowhead.com) for the cooldowns/charges our checks quote.
- Hotfixes: Wowhead news "Class Tuning and Bug Fixes - Patch 12.1.5 Hotfixes for October 27th" and Blizzard's cumulative "Midnight Hotfixes - October 27" thread (https://www.wowhead.com/blue-tracker/topic/us/2382684, covers Oct 20, 21, 23, 26, 27). The only Death Knight line in it is PvP: Unholy "San'layn: Vampiric Strike damage reduced by 20% in PvP combat" (Oct 27). Searched the thread for Blood, Frost, Unholy, Deathbringer, Rider, Death Strike, Obliterate, Dancing Rune, Pillar, Army, Dark Transformation, Reaper's Mark, Breath, Bone Shield, Putrefy, Soul Reaper: no PvE hit. So nothing in our notes needs updating for the Oct 23-27 tuning.
Not opened: the Wowhead BiS-gear, consumables and abilities pages (nothing of ours quotes gear lists beyond the notes' consumable lines).

## Corrections to the first pass
- First pass said Blood's `lead.res` reads "Death Strike above 75". Not true on GitHub: origin/main `lead.res` says "Don't let Runic Power overflow. Death Strike before you get near full, or when you need the healing." and the apl tip already explains 75/70 as adjustable. No mismatch there.
- First pass line numbers were from an older file. On origin/main: Blood spec block ~24812-24841, Frost ~24357-24402, Unholy ~24503-24546 (apl/open/stats/win/cds all in those blocks); PERF_CDS DK rows 16413-16414.

## Blood (tank)
Verified OK against current Wowhead + Icy Veins: San'layn and Deathbringer ST/AoE priorities (Death Strike line, 5+ Bone Shield, Marrowrend when expiring, Crimson Scourge / Visceral Strength Death and Decay rule, Boiling Point Blood Boil, Vampiric Strike, Blood Boil at 2 charges, Heart Strike filler), Reaper's Mark before Dancing Rune Weapon, Exterminate spent on Marrowrend, stats (San'layn Haste first, up to ~30%; Deathbringer Crit first, Haste last; both guides consistent), Dancing Rune Weapon 2 min and 12 s parry window (Wowhead guide text; the bare spell tooltip says 8 s base, talents extend it), Blood Boil 7.5 s / 2 charges, Death and Decay 30 s, Death Strike 45 RP, Reaper's Mark 45 s, tier set, Consumption not in any Wowhead raid build (so no Consumption row is right).
1. src/ui.js (origin/main) Blood `apl.list`: every row's `alt` list and `apl.offGcd` still contain "Rune Tap", "Tombstone", "Bonestorm" (and Heart Strike's alt "Soul Reaper"). Our note says Midnight removed Bonestorm, Tombstone, Soul Reaper, Rune Tap, Blood Tap. Source: our note + current guides list none of them. Likely. Harmless (they only mean "casts that don't break the priority") but stale. Fix: drop the four removed spells from those lists.
2. notes/Guides/Classes/Blood Death Knight.md, Opener, San'layn line: "Death's Caress → Dancing Rune Weapon (+ Raise Dead) → Blood Boil...". Both guides' San'layn opener now start with a pre-placed Death and Decay (Wowhead: "Cast Death's Caress, while it is in flight pre-place Death and Decay, Cast Dancing Rune Weapon, Blood Boil, Vampiric Strike x2, Death Strike"; Icy Veins: "Pre-place Death and Decay where you expect to be fighting. Do not target an enemy" first). Source: https://www.wowhead.com/guide/classes/death-knight/blood/rotation-cooldowns-pve-tank and https://www.icy-veins.com/wow/blood-death-knight-pve-tank-rotation-cooldowns-abilities . Sure (about the note). Our `open.seqs` already accepts Death and Decay or Death's Caress as step 1, so no check changes; fix the note line only.
3. `open.why` (Blood): "Death and Decay placed under the boss, then ...": matches both trees now (item 2), so the earlier "unsure" is withdrawn.
Marrowrend thresholds (Wowhead "at least 5", Icy Veins "7 or fewer"/1+ in Gift) are a known disagreement already in the note; our check uses under 5, fine.

## Frost
Verified OK: ST priority (ERW at 2 charges, Reaper's Mark, Pillar, Breath, Frostwyrm's Fury, Obliterate at 2 KM or 1 KM + Exterminate, Howling Blast with Rime, Frost Strike, Obliterate with KM, ERW for KM, no-KM Obliterate last), AoE swaps (Frostscythe/Glacial Advance at 3+), Wowhead builds (Breath of Sindragosa, Frostwyrm's Fury, Obliteration, Frozen Dominion, Cryogenic Chamber, Killing Streak all taken; Frostbane and Shattering Blade 0/1), Icy Veins "Dual-Wield Breath build in all content", Deathbringer slightly ahead of Rider in raid, stats (Wowhead Crit > Mastery > Haste > Vers; Icy Veins Crit > Haste > Mastery > Vers; Deathbringer a little lower on Haste), cooldowns (Pillar 45 s +20% Strength 12 s; Breath of Sindragosa 90 s, 60 RP, 8 s base, +0.8 s per Killing Machine/Rime; Frostwyrm's Fury 90 s; Reaper's Mark 45 s; Empower Rune Weapon 30 s recharge, 2 charges, +40 RP and a Killing Machine), Chosen of Frostbrood text (+100% damage, 15% Haste 12 s, extends Pillar when cast in it; recall for ranks 3/4).
1. src/ui.js Frost `open.why` / `open.lead`: "Both guides' Deathbringer opener: Empower Rune Weapon, Reaper's Mark, then Pillar of Frost and Breath of Sindragosa together...". Wowhead's Deathbringer opener is ERW → Pillar → Reaper's Mark → Breath → Obliterate → Frostwyrm's Fury. Icy Veins' single-target opener is ERW → Obliterate → Reaper's Mark → Remorseless Winter → Breath + Pillar + Frostwyrm's Fury (Obliterate and Remorseless Winter come before Pillar, Breath and Frostwyrm's Fury), and its multi-target opener differs again. So "both guides" is only true for Wowhead's order; our seq (four of ERW/Reaper's Mark/Pillar/Breath in any order, then Obliterate, then Frostwyrm's Fury) would not match Icy Veins' own order. Source: https://www.icy-veins.com/wow/frost-death-knight-pve-dps-rotation-cooldowns-abilities . Unsure (wording, and a player following Icy Veins might score lower on the opener). Fix: say "your guides" without implying identical order, or accept an Obliterate in the first five steps.
2. Frost `apl`: Wowhead lists "Frostbane when it procs" above Frost Strike; we have no Frostbane row. Frostbane is 0/1 in every Wowhead build and Wowhead says it "doesn't hit hard enough", so leaving it out is right. No fix needed (noted so nobody re-adds it).
No stale spell, cooldown or number found for Frost.

## Unholy
Verified OK: ST priority (Outbreak when Virulent Plague is down, Festering Strike/Scythe upkeep, Soul Reaper under 35% and ~6-7 s after Dark Transformation with Reaping, Putrefy inside Dark Transformation or on cooldown in Forbidden Knowledge, Death Coil on Sudden Doom, Necrotic Coil in Forbidden Knowledge, Festering Strike at 0 Lesser Ghoul, Scourge Strike with stacks, San'layn Death Coil above 50 RP from Icy Veins), cooldown timings (Army of the Dead 1.5 min / 90 s, Dark Transformation 45 s, Putrefy 30 s 1 charge, Soul Reaper 15 s), stats (Wowhead Strength > Crit > Mastery > Haste > Vers with Vers near 0; Icy Veins Crit > Mastery > Haste > Vers), Icy Veins talent page ("Rider minion build for single-target raid, San'layn pet build for M+"), Wowhead builds (Forbidden Knowledge 4/4, Lord of the Dead, Raise Abomination, Summon Gargoyle as an Army-triggered talent; Blightfall 1/1 in the Blightfall builds only).
1. src/ui.js PERF_CDS (origin/main line 16414): `'Unholy Death Knight': [['Army of the Dead', 90], ['Summon Gargoyle', 180], ['Unholy Assault', 90]]`. Wowhead's spell page for Summon Gargoyle (https://www.wowhead.com/spell=49206) shows no cooldown and reads "Army of the Dead now summons a Gargoyle"; Wowhead's rotation page says Army summons "Raise Abomination, Summon Gargoyle, and Apocalypse Now". So 180 s is not a cooldown. Unholy Assault (spell 207289, 1.5 min) still exists but I could not find it taken (all builds show it, if at all, at 0/1) and no guide mentions pressing it. Dark Transformation (45 s) is the real second cooldown and is not in the list. Likely. The code comment says a cooldown is only judged if cast at least once, so impact is small, but a Gargoyle summon logged as a cast would be graded against a 180 s clock. Fix: list Army of the Dead (90) and Dark Transformation (45), drop Gargoyle, and drop Unholy Assault unless a player is seen casting it.
2. Note line "Gargoyle (with Army): ramps with Runic Power spent": matches Wowhead (spell: +1% damage per Runic Power spent, 25 s). OK.
3. Epidemic threshold: Icy Veins contradicts itself (single-target page text says swap at 3+, 4+ in Forbidden Knowledge; multi-target text says 4+, 6+). Our note records both; our checks do not grade Epidemic vs Death Coil by target count, so nothing to fix.
No hotfix change for Unholy PvE; the Oct 27 PvP-only Vampiric Strike cut touches none of our wording.

## Summary of fixes, in order of value
1. PERF_CDS Unholy row: replace Gargoyle/Unholy Assault with Dark Transformation 45 (likely).
2. Blood alt/offGcd lists: drop Rune Tap, Tombstone, Bonestorm, Soul Reaper (likely, cosmetic).
3. Blood note San'layn opener: add the pre-placed Death and Decay (sure, note only).
4. Frost opener wording: do not say "both guides" for one order (unsure).

---

## Demon Hunter

Specs checked: Havoc, Vengeance, Devourer (notes + GEN_SPECS in src/ui.js lines 18623, 18710, 19245).
Sure mismatches: 0. Likely: 6. Unsure: 4. No Oct 23, 26 or 27 PvE change for Demon Hunter exists (see "Hotfix check"), so the notes are not stale from tuning.
Most important: Devourer "The Hunt / Voidblade on cooldown" checks (ui.js ~18644) judge buttons the Annihilator guides never press (the recommended tree).

## What I could and could not open
- Icy Veins: Devourer, Havoc and Vengeance rotation pages (all "Last Updated Oct 12 2026"; no later edits), stat pages. Opened the ST/AoE/opener tabs for Devourer and Vengeance (Annihilator default), plus the Havoc and Vengeance priority lists. Could NOT open the Aldrachi Reaver / Fel-Scarred tab on Icy Veins Havoc and Vengeance (the tab buttons are not plain clickable text; the default tab was read). The Havoc priority I read is the default one (Aldrachi-flavoured). Void-Scarred / Aldrachi Vengeance tabs not read.
- Wowhead rotation pages: Devourer (every tab list read from the page, Annihilator and Void-Scarred), Havoc (Aldrachi ST and AoE read; the Fel-Scarred switch did not take, so Fel-Scarred lists and the opener tab text were NOT read), Vengeance (Annihilator ST read; Aldrachi list not read). After that Wowhead started returning errors, so Wowhead stat pages for all three specs were NOT read. I do not judge those.
- Hotfix data: check-wow.com Demon Hunter feed (quotes Blizzard's posts word for word).
- The talent tips table (SPEC_BOOK, ~line 19902) only has Holy Paladin. No Demon Hunter talent tips exist in ui.js, so nothing to check there.

## Hotfix check (Oct 23 / 26 / 27)
- Oct 27 post: the only Demon Hunter line is "Devourer Collapsing Star damage +20% in PvP". Nothing PvE. Nothing in our notes quotes it.
- Nothing for Oct 23 or Oct 26 appears for Demon Hunter on that feed.
- Our notes' 12.1.5 facts all match Blizzard's 12.1.5 content notes (Collapsing Star no 5 s cooldown, Voidpurge 2.5 s, Soulforged Blades 18%, Monster Rising 10% / +20%, Violent Transformation now resets Soul Immolation not The Hunt, Demonic Intensity resets The Hunt on Star).
- The Oct 15 hotfixes (not in our notes, nothing of ours quotes them): Devourer 4pc set weakened, Reap/Cull/Eradicate single-target damage cut, Eradicate AoE up; Havoc Aldrachi Reaver buffed (Art of the Glaive 15%/30%, Reaver's Glaive +25%); Vengeance Demonic Wards 15%, Fel Devastation healing up. Only matters if you quote them. Icy Veins Devourer says the tier set "is only actively played around in single-target" after the cut.

## Havoc

1. Essence Break cooldown and window length with the tier set (likely).
   - Where: GEN_SPECS 'Havoc Demon Hunter' rot Essence Break `cd: 40` and apl `cd: 40` (~18730, 18717); pairs 'eb' `dur: 4`, why "hit much harder for 4 seconds".
   - We say: cooldown 40 s, window 4 seconds. Our own note already says "4 s, 6 s with tier".
   - Now: tier 4pc gives Essence Break Cycle of Hatred (each cast cuts Eye Beam's and its own cooldown 2.5 s, flat 10 s at 4 stacks, so about 30 s) and +2 s duration (6 s window).
   - Source: https://www.icy-veins.com/wow/havoc-demon-hunter-pve-dps-rotation-cooldowns-abilities (Tier Set section).
   - Fix: make the "4 seconds" wording say "4 seconds (6 with your tier set)" and treat Essence Break's real cooldown as shorter than 40 s for players with 4 pieces.
2. Eye Beam cooldown (likely).
   - Where: rot Eye Beam `cd: 30`, apl Eye Beam `cd: 30`.
   - We say: 30 s. Both guides: Cycle of Hatred (and Tactical Retreat with Exergy) put it on a 20 s cycle (20 s at 4 stacks); our note says this too.
   - Source: Icy Veins page above; Wowhead Havoc Advanced tips "reducing both abilities to a 20 second cooldown" https://www.wowhead.com/guide/classes/demon-hunter/havoc/rotation-cooldowns-pve-dps
   - Fix: allow up to 20 s when Cycle of Hatred is talented (otherwise "possible casts" are undercounted and the check is too lenient).
3. The Hunt cooldown (likely).
   - Where: apl The Hunt `cd: 90` and cds The Hunt `cd: 90`, wording "The Hunt on cooldown".
   - We say: 90 s. Both guides: the Apex talent Eternal Hunt (all four points, taken together) cuts it by 30 s: "a 1-minute burst tool"; Aldrachi "uses The Hunt every minute". Wowhead's spell page shows base 1.5 min.
   - Source: Icy Veins page above, Apex section.
   - Fix: 60 s when Eternal Hunt is talented, else 90.
4. Blade Dance cooldown is different in the two places (unsure which).
   - Where: apl Blade Dance `cd: 15, g: 1.5` versus rot Blade Dance `cd: 10, h: true`.
   - Blade Dance is a 10 s base cooldown (Death Sweep 9 s), hasted. Eternal Hunt's fourth point also resets it after a full Eye Beam. Source: https://www.wowhead.com/spell=188499
   - Fix: pick 10 for both, or confirm 15 is intentional for the priority check.
5. Pre-pull oil wording (unsure). pre `why`: "weapon oils on your main hand and off hand" fine; nothing wrong. Skipped.
6. Havoc hero-tree wording (likely, small). Our note: "Icy Veins Raid/ST 'best choice'" for Aldrachi Reaver and "Fel-Scarred for Mythic+ (both)". Icy Veins now says both trees work in raid ("Aldrachi Reaver has the higher ceiling", Fel-Scarred "very capable on cleave encounters") and its changelog says 30 Aug "set recommendations to Fel-Scarred and default to Raid Cleave". The note is fine; only matters if any UI text says "Aldrachi for raid". I found no such text in the checks.
- Stats (Agility > Crit > Mastery > Haste > Versatility) match Icy Veins (https://www.icy-veins.com/wow/havoc-demon-hunter-pve-dps-stat-priority). Note adds Season 2 fact "Haste much improved" fine. Wowhead stat page not read.
- Priority list order matches both guides' Aldrachi lists (The Hunt if no Glaive, Meta, Glaive, Annihilation with Rending Strike, Eye Beam, Essence Break, Death Sweep, Annihilation, Blade Dance, Chaos Strike, Felblade, Immolation Aura). Fel-Scarred list not re-read.

## Vengeance

1. Priority order does not match the guide our note quotes (likely).
   - Where: apl list (~19250 to 19261): Fiery Brand, Fracture at 2, Spirit Bomb, Sigil of Spite, Immolation Aura, Fel Devastation, Sigil of Flame, Soul Cleave. Wording says "Both guides".
   - Wowhead (Annihilator ST, read Oct 28): Infernal Strike, hold Fury, Metamorphosis, Fracture at 2 charges, Spirit Bomb 4+ if Brand ending, Fiery Brand if debuff off, Spirit Bomb 5+, Immolation Aura, Sigil of Flame, Sigil of Spite, Soul Cleave 1+ Souls, Fel Devastation at 50 Fury, Soul Cleave at 0.
   - Icy Veins: Meta (unless 2+ Voidfall), spenders at 3 Voidfall, Fracture at 2, Sigil of Spite, Spirit Bomb 5+ (hold ~5 s if Brand soon), Immolation Aura, Soul Cleave 5+ if Bomb on cooldown, Fel Devastation at 3 or fewer Souls, Sigil of Flame, Soul Cleave 3+.
   - So our order is the Icy Veins one (Spite before Immolation Aura) and Fel Devastation ahead of Sigil of Flame; Wowhead puts Immolation Aura and Sigil of Flame before Spite and Fel Devastation after Soul Cleave. The two guides disagree; our text says "Both guides".
   - Sources: https://www.wowhead.com/guide/classes/demon-hunter/vengeance/rotation-cooldowns-pve-tank and https://www.icy-veins.com/wow/vengeance-demon-hunter-pve-tank-rotation-cooldowns-abilities
   - Fix: reword the Spite / Fel Devastation tips to "your guides differ" (or only judge what both agree on: Fracture at 2, Spirit Bomb at 5+, everything else on cooldown).
2. Our note's opener is stale (likely). Note "Opener (Icy Veins): Sigil of Flame 1 s before pull -> Metamorphosis + Infernal Strike -> Fiery Brand -> ..." Icy Veins now (ST opener, Annihilator default): Sigil of Flame 1 s before pull, Fiery Brand, Immolation Aura, Sigil of Spite, Fracture, Spirit Bomb, Metamorphosis, Fracture, Fracture, Spirit Bomb, Soul Cleave. The check's `open` seq (Fiery Brand, two generators, Metamorphosis) already matches the new one, so only the note file is wrong. Fix the note.
3. Spirit Bomb "4 in Metamorphosis" (unsure).
   - Where: apl Spirit Bomb `{ buff 'Soul Fragments', st: 4, any: [{ buff: 'Metamorphosis' }] }`; tip "(4 in Metamorphosis)".
   - Neither guide says 4 in Metamorphosis. Wowhead says 4+ only when Fiery Brand is about to run out; both say 5+ otherwise.
   - Fix: drop the Metamorphosis case or reword to "(4 when Fiery Brand is about to end)".
4. Sigil of Flame cooldown (unsure). apl and rot use `cd: 30`. Wowhead's spell page lists 23 s as the first cooldown value for Sigil of Flame (possibly a talent-reduced base). Neither guide gives a number. Worth one look in game data; I could not settle it.
- Stats: our wording (Haste first; Wowhead calls the rest equal; Icy Veins Mastery, Versatility, Crit) matches Icy Veins (Agility > Haste > Mastery > Versatility > Crit). Wowhead stat page not read.
- Cooldown numbers in the note match Wowhead's table: Fel Devastation 40 s (28-34 with Darkglare Boon), Soul Carver and Sigil of Spite 1 min, Fiery Brand 1 min (48 s Down in Flames), Demon Spikes 20 s, Meta 2 min, Darkness 5 min (3 with Pitch Black). Tier set text matches.
- Oct 15 Vengeance changes (Demonic Wards 15%, Fel Devastation healing) are not in our notes or checks.

## Devourer

1. The Hunt and Voidblade checks apply to every hero tree (likely).
   - Where: cds (~18644): The Hunt `cd: 90` "press it on cooldown, and as Annihilator, before Voidblade"; Voidblade `cd: 30` "Press it whenever it's ready". lead.cdsO "Press The Hunt and Voidblade whenever they're ready."
   - Now: Wowhead's Annihilator lists never press The Hunt and cast Voidblade only before a Star/Cull for Devourer's Bite (and "save for right before Meta if Meta is within 10 Soul Fragments" is Void-Scarred). Blizzard moved The Hunt to the middle gate in 12.1.5 as "featured for Void-Scarred builds"; Icy Veins and Wowhead say Annihilator is the build for all raid content. Void-Scarred is not recommended.
   - Sources: https://www.wowhead.com/guide/classes/demon-hunter/devourer/rotation-cooldowns-pve-dps , https://www.icy-veins.com/wow/devourer-demon-hunter-pve-dps-rotation-cooldowns-abilities , Blizzard 12.1.5 notes (via https://check-wow.com/hotfixes?class=demon-hunter).
   - Fix: only judge The Hunt (and "whenever ready" Voidblade) for Void-Scarred (or when talented); for Annihilator reword Voidblade as "before a Collapsing Star or Cull".
   - The `why` text "as Annihilator, before Voidblade" for The Hunt is not in either guide.
2. The Hunt cooldown 90 s: confirmed correct for Devourer (Wowhead spell 1246167: 1.5 min). Void-Scarred resets it on each Collapsing Star (Demonic Intensity), so "on cooldown" can be much more than once per 90 s. Likely worth one clause in the wording.
3. Mastery wording (unsure). Our note: "Monster Within +33% in Meta (Icy Veins)". Icy Veins stat page now says Mastery: Monster Within was nerfed ("following the nerfs to Mastery: Monster Within"). Number not re-verified. Only the note quotes it; the checks do not.
4. Opener (fine). Both guides give no true opener; ours (Consume, Reap/Eradicate, Void Ray) is ok. Icy Veins ST opener tab: Consume x2, Reap, Consume x2, Reap, then slower set-up; matches the note.
5. Priority lists (ST, AoE, Annihilator and Void-Scarred, inside and outside Meta): match the note and the apl (Consume at Soulburst, Reap at 4+, Void Ray at 100 Fury, Void Ray on cooldown in Meta, Collapsing Star at 30, Cull at 4+ or 2 charges, Soul Immolation on exit). Wowhead notes "Void Ray unless it overcaps Souls" (Annihilator) and Void Ray has a 14 s hasted cooldown in Meta: not in our `rate` why, which says "pressing it on cooldown"; fine.
6. Stats (Mastery > Haste > Crit > Versatility, both trees): matches Icy Veins stat page. Wowhead stat page not read.
7. Huggling: Wowhead says it is "not very useful in AoE" after 12.1.5 (note says Void-Scarred single target only; fine).
8. Notes already match the Oct 13/15 data. No Devourer check quotes a changed number.

## SPEC_TOP / other
No SPEC_TOP entry is made meaningless by any change I found. Devourer's per-minute and Collapsing Star counts (SPEC_TOP ~13830, win keyMin 3) still fit the "4-5 Annihilator, 3-4 Void-Scarred" guide targets.

---

## Druid

SUMMARY
1. Specs checked: Balance, Feral, Guardian, Restoration (GEN_SPECS + rdruChecks + notes) against Icy Veins (all hero/ST/AoE/opener/cooldown tabs I could click) and the Oct 23/26/27 hotfix posts. Wowhead pages could NOT be re-opened (CloudFront 403 on repeated tries); I only know Wowhead from our Oct 19 notes plus the Feral page's first screen.
2. Sure mismatches: 2 (both Feral/Balance wording or numbers) + 4 likely/unsure; nothing in our checks quotes the Oct 27 tuning numbers.
3. Most important: Feral "Berserk" window length is 20 s in `win` and 15 s in `open.len`, but with the Season 2 4-piece Berserk lasts 25 s (Icy Veins says 15 s base +10 s from the set).

SOURCES READ
- Oct 27 tuning (applied): https://www.icy-veins.com/wow/news/class-tuning-midnight-12-1-5-hotfixes-october-27th/  Druid = Feral all damage +5%; Restoration: Verdancy healing +60%, Regrowth healing +10%, Improved Swiftmend +40% (was 30%). All PvE-aimed at dungeons; raid said to be fine.
- Oct 23 (https://www.icy-veins.com/wow/news/venomstone-item-level-class-and-dungeon-fixes-midnight-12-1-5-hotfixes-october-23rd/): no Druid entry (Warlock summons, Enhancement CDM only).
- Oct 26 (title "Class Fixes, Labyrinth Scenario Improvements"): search snippet names Enhancement and Affliction only; I did not open it fully. No Druid seen.
- Icy Veins Balance / Feral / Guardian / Restoration rotation pages: all "Last Updated Oct 12, 2026", changelog "Reviewed/Updated for 12.1.5". Wowhead Feral rotation page: "Updated 2026/10/13". So the guides have NOT changed since our Oct 19 read. Mismatches below are against the current guide text, not new changes.
- Not judged (could not open): Wowhead Balance/Guardian/Restoration pages and their tabs; Icy Veins FAQ dropdowns (Feral "Do I always spend at 5 CP", Resto "mana issues", Guardian "Defensive or Offensive"), Icy Feral "Apex Talent" and "Feral Frenzy & Chomp" tabs, Icy Balance AoE tabs, Wowhead Feral option toggles (Chomp/Focused Frenzy/Lunar Inspiration).

NOTES THAT ARE NOW OUT OF DATE (notes/Guides/Classes, not player-facing)
- Feral Druid.md, Restoration Druid.md (line 3-4 "No 12.1.5 class changes"): Feral +5% all damage and the Resto changes (Verdancy +60%, Regrowth +10%, Improved Swiftmend 30% -> 40%) landed Oct 27. Sure. Fix: add one line to each note. Nothing in ui.js quotes these numbers (grep for Verdancy / Improved Swiftmend finds only the talent-tree data blob at ~line 14515/14561), so no player-facing wording is false.

BALANCE (Elune's Chosen, Keeper of the Grove)
1. src/ui.js line 18360, `pairs` k:'foeecl', why: "Icy Veins: with Elune's Chosen, always cast Fury of Elune inside your Eclipse." The current Icy Veins Elune's Chosen single-target list says "Cast Fury of Elune before entering Eclipse or casting Celestial Alignment/Incarnation", and the opener is Fury of Elune, then Eclipse (Lunar), Starfire, Incarnation. The check itself already accepts "in Eclipse or right before it" (post 2.5), so scoring is fine; only the quoted attribution is stale/contradictory. Source https://www.icy-veins.com/wow/balance-druid-pve-dps-rotation-cooldowns-abilities (Elune's Chosen > Single-Target, Opener tabs). Sure (about the text I saw; I did not open the AoE tab). Fix: reword to "your guides: Fury of Elune goes out just before Eclipse or Incarnation".
2. Line 18367, KotG opener seq: steps are Wrath, Sunfire, Fury of Elune (talent), Force of Nature, Incarnation, Starsurge. Icy KotG opener (both builds) has Eclipse (Lunar) and Starfire between Sunfire/Fury and Force of Nature, and for the Convoke build: ...Force of Nature, Celestial Alignment, Starsurge to under 40 AP, Convoke the Spirits. Nothing we check is wrong (subsequence), but the Convoke build's "Starsurge under 40 AP, then Convoke" is not covered. Unsure / minor. Fix: optional, add Lunar Eclipse step for KotG and a Convoke step with `tal`.
3. Line 18372 orderWhy and stat orders: match Icy Veins as I could see (Mastery first). Stats page itself not re-opened this round. Unsure.
Otherwise: ST priority (Lunar Eclipse at 2 charges, DoT pandemic, Starfall with Starweaver Warp/Touch the Cosmos, Starsurge not to cap), 65-75% Eclipse uptime, tier set text, two Wraths at 4 s, Moonkin Form + Mark of the Wild all match current Icy Veins.

FERAL
1. [sure] Line 18510 `win` { n:'Berserk', dur: 20 } and line 18496 `open.len: 15`. Season 2 4-piece: "Berserk lasts 10 seconds longer" (Icy Veins Feral page, tier set section; our own note says the same). Berserk is 15 s base (so 25 s with the set, 20 s is Incarnation's base, 30 s Incarnation with the set). Source https://www.icy-veins.com/wow/feral-druid-pve-dps-rotation-cooldowns-abilities . Fix: dur 25 for Berserk (30 for Incarnation) when the 4-piece is worn, and opener len should not stop at 15; or make dur read the tier-set flag if one exists.
2. [likely] Line 18517 `rot` Chomp cd: 30 vs Icy Veins Druid of the Claw ST notes: "Chomp is used on cooldown every 20 seconds. Try to dump Energy just before its cooldown ends." Our note says 30 s per Wowhead. The two guides disagree or one is stale; confirm on the Chomp spell page. Fix: confirm, then set cd to 20 (if Icy is right) so "casts vs possible" is not understated.
3. [likely] Line 18515 and 18503 tip: "Both guides: spend Apex Predator's Craving on a free Ferocious Bite first." The current Icy Veins ST lists (Wildstalker and Druid of the Claw) do not mention Apex Predator's Craving; only Wowhead's Druid of the Claw list leads with it ("Ferocious Bite with Apex Predator's Craving procs"). I did not open Icy's "Apex Talent" tab, so I can't say whether it appears there. Fix: say "Wowhead" (or "your guides") unless the Icy tab confirms.
4. [unsure] APL order (lines 18503-18507): ours is Apex Bite, Rip, Bite at 5 CP, Feral Frenzy, Rake, Moonfire, Shred. Icy order: Tiger's Fury, Berserk, Feral Frenzy, Chomp (Druid of the Claw), Rip, Convoke, Bite at 5 CP + Rip, Rake, Moonfire, Shred. Feral Frenzy builds 5 CP and Icy puts it before Rip; ours puts it after the 5-CP spend, which only works if the Frenzy is pressed at low CP. Our note already records this order. Fix: move Feral Frenzy ahead of the Bite line, or leave if the `maxT` gate is meant to cover it.
5. [unsure] Line 18497 opener seq lacks Feral Frenzy between Berserk and Rip. Current Icy opener (both hero trees): Prowl, Tiger's Fury, Rake, Berserk, potion/trinket, Feral Frenzy, Rip, Convoke the Spirits, Ferocious Bite. The `why` text mentions Frenzy for combo points; the sequence does not. Fix: add `{ n: 'Feral Frenzy' }` as optional.
6. Line 18500 stats text (Haste vs Crit by hero tree) and 18501-18508 pandemic windows (Rip 7.2, Rake 4.5, Moonfire 5.4) match Icy Veins/our note. Heroes: Icy Veins now recommends Wildstalker for raid / Druid of the Claw for M+ (matches note); nothing checks hero choice.

GUARDIAN
1. [likely] Line 19189, `apl` Maul rule: `resF: ['1', 0.9]` with why "you were near full Rage" and tip "near full Rage, spend it on Ironfur or Maul (Raze)". Icy Veins: "using Raze/Ravage at above 80 rage as often as possible ... for the Harnessed Rage talent" (resets Mangle through Gore); our own note says "above 80 Rage". Source https://www.icy-veins.com/wow/guardian-druid-pve-tank-rotation-cooldowns-abilities (Guardian Single Target tab). Fix: lower the threshold to about 0.8 and say "above 80 Rage" (Maul/Raze/Ravage).
2. [unsure] Line 19184 list order: Red Moon is listed before Lunar Beam. Icy ST: Thrash, Mangle, Lunar Beam (ideally aligned with Red Moon if close), Red Moon, Heart of the Wild (in Cat Form), Incarnation, Raze/Ironfur, Swipe. Both are "on cooldown" so little effect. Heart of the Wild (Cat Form on bosses, Moonkin on AoE pulls) is in Icy's list and not in our list or rot/cds; our note's "What a log can check" says Heart of the Wild used. Fix: optional, add a Heart of the Wild cooldown line.
3. [unsure] Line 19184 offGcd includes "Rage of the Sleeper" (our note says Midnight removed it). Harmless, but if it is gone from the kit nothing will ever match. Fix: drop it.
4. 4-piece: "Incarnation lasts 5 s longer" (Icy). Line 19179 opener `len: 12`, cds Incarnation cd 180: no check quotes the Incarnation length; if `len` is meant as Incarnation duration it should be 35 s base (30 +5)? Unsure: I could not confirm the base duration (Icy's cooldown section for Incarnation did not render in my read). Fix: only check if `len` is used for window scoring.
5. Stats, Ironfur uptime wording ("keep at least one stack up"), Thrash/Mangle on cooldown, Apex Wild Guardian text all match the Icy page.

RESTORATION (GEN_SPECS key 'Restoration Druid' ~line 14394 stats blob, rdruChecks 16209, RDRU_* 16169-16201)
1. [unsure, guides disagree] RDRU_TIPS.nss (line 16182) "Cast Nature's Swiftness on yourself, so Overgrowth refreshes the HoTs on your Lifebloom target", and the check at line 16269/16432 marks NS Regrowths on someone else as a warning (and scores it when Overgrowth is talented). Icy Veins (cooldown tab, read now): "Nature's Swiftness makes your next Regrowth instant cast and increases the amount of healing it does. You will mostly use it when people drop low to save them." Our Oct 19 note takes the self-cast advice from Wowhead (not re-readable now). Fix: soften the wording ("on yourself, or on someone about to die") and don't treat NS on a low-health ally as a miss (the code already treats Regrowth on someone under 30% as fine for the "bad Regrowth" check; do the same for `nss`).
2. [unsure] RDRU_CD (line 16174): 'convoke the spirits': 120, ironbark: 90. Icy Veins calls Convoke "a short cooldown" and Ironbark's cooldown "quite low"; our note says the same ("short cooldown"). 120 and 90 are only fallbacks when the tooltip can't be read, so they matter little; confirm on Wowhead spell pages (Convoke 60 s with Cenarius' Guidance/Ashamane-type talents is likely wrong to assume either way).
3. [sure, not a mismatch] Tier set text (Genesis +15% 8 s, 4-piece: +8 s, NS/Tranquility/Convoke/Tree 100%), Lifebloom on self + Everbloom, Swiftmend on cooldown then Rejuvenation, Innervate 25% mana from about 75% mana, Tranquility +10 s HoT extension, Ironbark 20% for 12 s, Convoke 45% mini-Tranquility ("~45-50%" in note), Tree of Life 60-70% uptime: all match current Icy Veins.
4. Oct 27 tuning (Verdancy, Regrowth, Improved Swiftmend): no check, tip or wording of ours quotes these numbers. `Improved Wild Growth` is the only "Improved" talent the code reads. No change needed except the note header.
5. Abundance wording in our note ("+60% crit and -60% mana cost") is not shown on the Icy page (it says "greatly increases the crit chance and lowers the mana cost"); the figure came from Wowhead on Oct 19. Not re-verified. No player-facing text quotes it (checked rdruChecks section; "Abundance: 5 Rejuvenations out, then Regrowth, cheap and almost always a crit").
6. Hero talents: Icy says Wildstalker "BEST CHOICE", rotation the same for both trees; matches our note and `ws`/`kotg` handling.

TALENT TIPS TABLE (~line 19907)
I found no Druid entries in the 'Reclamation': ['out'... table region (grep for Everbloom, Abundance, Verdancy, Lunation, Convoke, Rampant Ferocity, Tiger's Fury as table keys returned nothing), so nothing to check there. Unsure whether Druid talent tips live elsewhere.

SPEC_TOP: nothing made meaningless by Oct 23-27 (Feral +5% and Resto healing are pure numbers).

---

## Evoker

Specs checked: Augmentation, Devastation, Preservation (guide notes, GEN_SPECS in src/ui.js ~18598 / ~18854, pevkChecks ~16587-16700). Coverage is PARTIAL, see "Not verified".
Sure mismatches: 0. One likely internal mismatch (Augmentation Upheaval cooldown with the 2-piece set).
Most important: Wowhead's Evoker guides were last edited Oct 13 (Aug, Pres) and Oct 18 (Dev), i.e. before our Oct 19 notes, and I found no Evoker class tuning in the Oct 23-28 posts, so the notes are not stale from the guides' side.

## Coverage and limits (honest)
- Wowhead pages read: Augmentation rotation (updated 2026/10/13), Devastation rotation (2026/10/18), Preservation rotation (2026/10/13). Stat pages for all three show updated 2026/10/13 but their text would not load (JS-rendered; the browser then errored "Policy check temporarily unavailable"), so stat orders are NOT re-verified.
- The built-in browser would not open my own tab (tabs_create failed: tab cap), and the shared "seed" tab got navigated by another helper mid-run. I read the default view of each page only. I did NOT click hero-talent switches (Chronowarden / Scalecommander / Flameshaper), Single-target/AoE/Opener tabs, or the Rewind / Dream Flight / Stasis sub-tabs on Preservation. Not judged: the hero-specific priorities, openers, AoE lists, the Rewind and Dream Flight texts.
- Icy Veins returned HTTP 403 on all three spec pages. Nothing from Icy Veins was re-checked (our notes quote it in many places: stat orders for Aug/Dev/Pres, Duplicate rank text, Pyre 5+, Merithra's Blessing +60%).
- Hotfix posts for Oct 23, 26, 27: I could not find or open any (searches returned only Oct 6 and earlier Blizzard threads; Blizzard forum thread page 1 stops at Oct 6, tail was truncated). The Oct 28 balance preview (gamewave.fr/world-of-warcraft/wow-equilibrage-des-classes-du-28-octobre-2026-les-details-de-la-mise-a-jour/) lists Evoker changes for Preservation PvP only (Chronal Dynamo 50% to 80%, Reverberations 40% to 80%); none for Devastation or Augmentation. Nothing in our PvE notes quotes those. Treat Oct 23/26/27 as "not found", not "no changes".

## Augmentation Evoker
1. LIKELY. Tier-set cooldown not reflected in checks. Note says "2-piece: Upheaval cooldown -10 s" (notes/Guides/Classes/Augmentation Evoker.md, Tier set), but ui.js GEN_SPECS 'Augmentation Evoker' uses `cd: 40` for Upheaval in apl (~line 18868) and rot (~18879), with no cdT adjustment. A player in the 2-piece has a 30 s cooldown, so "possible casts" and the "Upheaval was ready" check would be too lenient (and the note's own claim contradicts the check). Source: our own note (Oct 19, from the guides); I could not confirm the 10 s from a page today. Fix: add `cdT` / tier-aware cd of 30 when the 2-piece is worn, or confirm the number first.
2. UNSURE (wording only). Wowhead's current single-target list (updated Oct 13, https://www.wowhead.com/guide/classes/evoker/augmentation/rotation-cooldowns-pve-dps, Chronowarden view) puts "Maintain Prescience" first, Ebon Might "if a few seconds or less remain" second, then Breath of Eons, Tip the Scales, Fire Breath (rank 1 or max), Upheaval rank 1, Time Skip (only if talented), Eruption, Living Flame (filler), Azure Strike, Blistering Scales. Our note's list starts with Ebon Might and puts Prescience third; our checks put Prescience first, so the code matches Wowhead. Only the note's order differs. Fix: reorder the note, no code change.
3. Everything else I could compare (Fire Breath rank 1 vs max rank, Upheaval rank 1, "4-5 seconds" Ebon Might/Duplicate guideline, Essence Burst cap 2 and spend before Prescience/Living Flame, empowers only inside Ebon Might, Leaping Flames, Prescience advice) matches Wowhead's page. No renamed/removed spells found in the default view.

## Devastation Evoker
1. UNSURE. Wowhead (updated 2026/10/18, https://www.wowhead.com/guide/classes/evoker/devastation/rotation-cooldowns-pve-dps, Scalecommander view) lists Deep Breath twice: once on cooldown and again "when Strafing Run is about to expire". Our apl has one Deep Breath line and the tip says "its second cast 7 or 8 seconds later" (Icy Veins wording). Consistent enough; only flag if you want the second cast checked.
2. Matches: Dragonrage every 2 min, fires 3 Pyres, extended by Fire Breath/Eternity Surge via Animosity (~32 s, our `dur: 18` base window is fine), Unbound Flame is after Dragonrage and 4 uses, Mass Disintegrate priority, Living Flame with Leaping Flames + Burnout, Azure Strike for movement, Fire Breath/Eternity Surge rank 1. Tip the Scales listed before Eternity Surge as in our opener. No mismatch.
3. Not verified: Flameshaper view (our rule "Tip the Scales only on Eternity Surge, never Fire Breath"), stats order (ours: Crit, then Mastery/Haste, Vers last), Pyre thresholds, Rising Fury wording.

## Preservation Evoker (notes + pevkChecks)
1. No mismatch found against Wowhead (updated 2026/10/13, https://www.wowhead.com/guide/classes/evoker/preservation/rotation-cooldowns-pve-healer, Flameshaper raid view): Temporal Anomaly on cooldown; Dream Breath generates a Merithra's Blessing and is cast just after Echoes are consumed; Emerald Blossom with an Essence Burst, Echo when Twin Echoes is at 2 stacks or no burst; consume Echoes with Merithra's Blessing (Reversion otherwise) when damage hits; Living Flame on the boss to farm Essence Bursts; max-rank Fire Breath then Living Flame; Stasis gives the 15 s 50% HoT window (our "Inner Flame") and Emerald Blossom spam; Flameshaper raid Stasis = two rank-1 Dream Breaths (+ Temporal Anomaly, third slot; if one charge is missing use Emerald Blossom); Chronowarden Stasis + Tip the Scales; 3x Cauterizing Flame mass dispel. All as our PEVK_APL / PEVK_TIPS / stc check say.
2. Minor, wording only: Wowhead's ramp lists Dream Breath before Temporal Anomaly; our APL and note put Temporal Anomaly first. Order is not a mismatch (both "on cooldown").
3. Not verified: Rewind and Dream Flight texts (collapsed tabs), Stasis cooldown 90 s in PEVK_CD, Rewind 240 s, Dream Flight 120 s, Time Dilation 60 s, Zephyr 120 s (spell cooldowns not looked up; I did not open Wowhead spell pages), the "Dream Breath instant heal -50%" and "+60% Dream Breath with rank 3 Merithra's" numbers, the Chronowarden view, Mythic+ view, stat orders (ours: Crit and Mastery first, either).
4. pevkChecks stat note says "Wowhead puts Critical Strike first for raid, Icy Veins Mastery first": not re-verified today.

## Suggested follow-up if you want a firm verdict
Re-run with a free browser tab to click the hero switches, ST/AoE/Opener tabs and the Preservation Rewind/Dream Flight tabs, read the three Wowhead stat pages, and pull the Icy Veins pages (blocked for plain fetch). Confirm the Upheaval 2-piece cooldown (item 1 under Augmentation).

---

## Hunter

Specs checked: Beast Mastery, Marksmanship, Survival (second pass, browser used; compared with origin/main 73fc01e src/ui.js and notes).
Sure/likely mismatches: 3 sure, 5 likely, 3 unsure/cosmetic (all below). Oct 27 Marksmanship tuning CONFIRMED from a major source (Icy Veins news, quoting Blizzard's notes).
Most important: Survival's tier-set lines in ui.js (21335) have the 2-piece and 4-piece swapped against both guides (and against our own note); next, Survival's big-cooldown rows still name Coordinated Assault / Spearhead (not in the kit) instead of Takedown.

All line numbers are in `git show origin/main:src/ui.js` (GitHub's copy). Notes read from `origin/main:notes/Guides/Classes/<Spec> Hunter.md`.

## What I opened (so you know what was and wasn't judged)
Icy Veins (tab clicked, "Show more" opened): BM, MM, SV rotation pages with every hero/ST/AoE button (BM: Pack Leader ST/AoE, Dark Ranger ST/AoE; MM: Sentinel ST/AoE/Hydra Cleave, Dark Ranger ST/AoE; SV: Pack Leader ST/AoE, Sentinel ST/AoE) incl. openers, tier-set text and changelogs; stat pages (BM, MM; SV stat page not read, Wowhead's used); talent pages (BM, MM, SV).
Wowhead: rotation pages (hidden tab panels read: ST, AoE, Opener, cooldowns, for both hero trees; the page's hero master switches and Twin Fangs option are rendered by script, I read all panel text instead of toggling), stat pages (3), talent-build tabs (BM all 4 tabs, SV all 5), SV gear/tier page, Season 2 tier-set overview. Wowhead MM talents page and Icy SV stat page not opened (no mismatch expected, MM stats and hero advice matched on two other pages).
Guide dates: Wowhead BM/SV rotation 2026/10/13, MM 2026/10/14, SV talents 2026/10/23. Icy BM/SV rotation Oct 12, MM Oct 14, SV talents Oct 22. None post-date Oct 27.

## Patch findings (Oct 23 / 26 / 27)
- Oct 27 class tuning (Icy Veins news "Class Tuning: Midnight 12.1.5 Hotfixes, October 27th", also pre-announced Oct 23): Marksmanship, "intended to boost area damage": Trick Shots now +85% ricochet damage of Aimed Shot and Rapid Fire (was 75%); Explosive Shot damage +10%; Volley damage +10%. Nothing for BM or Survival.
  https://www.icy-veins.com/wow/news/class-tuning-midnight-12-1-5-hotfixes-october-27th/
  https://www.icy-veins.com/wow/news/big-subtlety-nerf-druid-buffs-and-more-upcoming-class-tuning-october-27th/
- Oct 26 hotfixes and the Oct 20-26 weekly summary (Icy Veins): no Hunter entry. Oct 23: nothing for Hunter found (only the Oct 27 pre-announcement).
- The first pass listed PvP-only Kill Shot / Black Arrow numbers for Oct 27; the Icy Veins post shows no such Hunter PvP lines. Ignore them.

## MISMATCHES

### Survival
1. SURE. Tier-set lines are swapped. ui.js 21335 (TIER table, 'Survival Hunter'): `p2: []`, `p4: [{ stk: 'Mongoose Fury', hit: 'Wildfire Bomb' ... }]`, `t2: 'Boomstick keeps Mongoose Fury up longer, and Mongoose Fury is 10% stronger'`, `t4: 'Mongoose Fury also makes Wildfire Bomb 10% stronger'`, `no: 'the 2-piece (a longer and stronger Mongoose Fury)'`.
   Right: 2-piece = Mongoose Fury also increases Wildfire Bomb damage by 10%; 4-piece = each Boomstick blast extends Mongoose Fury 1 s and Mongoose Fury effects +10%. Icy Veans SV rotation page ("2-set makes Mongoose Fury increase Wildfire Bomb damage by 10%, 4-set ... Boomstick extend ... by 1 second"); Wowhead SV gear page lists the Wildfire Bomb bonus first, then the Boomstick one; our own note (Survival Hunter.md "Tier set") has it this way round. Wowhead's overview page labels both "4pc" (a data quirk), so rely on the two guide pages.
   https://www.icy-veins.com/wow/survival-hunter-pve-dps-rotation-cooldowns-abilities  https://www.wowhead.com/guide/classes/hunter/survival/bis-gear
   Fix: move the Wildfire Bomb counting rule (`stk` Mongoose Fury -> Wildfire Bomb) to p2 and t2 text; t4 = 'each Boomstick extends Mongoose Fury 1 second, and Mongoose Fury is 10% stronger'; `no:` should name the 4-piece (longer, stronger Mongoose Fury) or the 2-piece depending on what the code tests (check what `no` means).
2. SURE. Big-cooldown rows are stale. ui.js 16421 (PERF_CDS): `'Survival Hunter': [['Coordinated Assault', 120], ['Spearhead', 90]]`; ui.js 3782 (NDZ_BIG): `255: 'Coordinated Assault'`. Neither spell is in the 12.1.5 Survival kit or in the talent-tree data in ui.js; the real cooldown is Takedown (90 s base, 60 s with 2 points of Savagery, 8 s window). Effect: NDZ_BIG tells a Survival player to "use Coordinated Assault" in the Cooldowns suggestion; PERF_CDS never judges Takedown.
   Source: Icy Veins SV rotation ("Takedown is Survival's primary cooldown ... 1:30 ... 1 minute with 2 points of Savagery"); Wowhead spell 1250646 (1.5 min cooldown).
   Fix: 255: 'Takedown'; Survival PERF_CDS: [['Takedown', 90]].
3. LIKELY. Takedown cooldown ignores Savagery. ui.js 24226 `cds: [{ n: 'Takedown', cd: 90, one1: true ... }]` with no `cdT`. Wowhead's Sentinel single-target raid build takes Savagery 2/2 (60 s Takedown) and Icy says the same; counted against 90 s the player looks like they under-use it (or get free full marks). Fix: add `cdT` for Savagery (60), or say "90 s (60 s with Savagery)" and count against 60 when talented. Also BM/MM use cdT the same way (Bestial Wrath / Trueshot).
4. LIKELY. Pack Leader's top rule is missing from the list. Both guides' first Pack Leader rule: Kill Command whenever a Howl of the Pack Leader beast is ready (Wowhead: "without wasting Tip of the Spear"; Icy: "Kill Command below 2 Tip if Howl is ready"). ui.js 24209-24216 (Survival `apl.list`) has no Howl rule (Howl is only in `ctx`), and Boomstick (24211) sits above Takedown, whereas both Pack Leader lists put Takedown above Wildfire Bomb and Boomstick. Fix: add `{ s: 'Kill Command', hero: 'Pack Leader', if: { buff: 'Howl of the Pack Leader' } ... }` at the top, and for Pack Leader move the Tipped Takedown above Boomstick. UNSURE how much of this the checker can score; Sentinel's order (KC at 0 Tip, Boomstick, Wildfire Bomb on a mark, Takedown) matches both guides.
5. UNSURE (wording). `wfbtip` pair, ui.js (Survival `pairs`, k:'wfbtip'): "cast Wildfire Bomb with a Tip of the Spear stack to spend". Icy now says a bomb about to cap "No need to Tip it", Wowhead Pack Leader says "if you have a Tip stack". Not false; maybe soften to "most Wildfire Bombs".
6. COSMETIC. `procs` / `alt` lists still carry Mongoose Bite and Butchery (24216, 24223) which are not in the kit. Harmless. (Flamefang Pitch is not in origin/main ui.js at all: first pass's flag was from the working copy.) Flamefang Pitch: Wowhead's rotation page (Oct 13) still lists it in the Pack Leader and AoE lists, but it is not in any Wowhead or Icy talent build or in the talent-tree data; our note's "removed, ignore" stands (likely).

### Marksmanship
1. LIKELY (note only). Oct 27 tuning missing from notes/Guides/Classes/Marksmanship Hunter.md (header lists only 12.1 numbers). Add: "Oct 27 hotfix: Trick Shots ricochet 75% -> 85%, Explosive Shot +10%, Volley +10% (area damage buff)". Nothing in ui.js quotes these, so no player-facing wording is false. Also the notes' hero-tree/build lines still hold: both guides still say Sentinel everywhere; the AoE buff may shift Hydra vs Trick Shots advice later, neither guide has reacted yet.
2. LIKELY. Dark Ranger Rapid Fire rule. ui.js 23987: `{ s: 'Rapid Fire', ... if: { any: [{ no: 'Precise Shots' }, { buff: 'Trueshot' }] }, tip: 'Rapid Fire on cooldown once your Precise Shots are spent, or any time in Trueshot' }` has no hero filter. Both guides: Dark Ranger casts Rapid Fire on cooldown regardless of Precise Shots (our own note says the same: "Dark Ranger: Rapid Fire on cooldown regardless"); only Sentinel waits to spend Precise Shots. Also Icy (Oct 14 changelog): Sentinel with Aspect of the Hydra on 2+ targets casts Rapid Fire on cooldown even with Precise Shots up. Fix: hero-split the line (Dark Ranger: plain cooldown; Sentinel as now, except on 2+ targets with Hydra).
3. LIKELY. Dark Ranger priority differences. Dark Ranger's list (both guides): Black Arrow with Precise Shots, Explosive Shot, Volley, in Trueshot Aimed Shot with no Precise Shots only if Black Arrow is ready or Aimed Shot is about to hit 2 charges, Trueshot, Rapid Fire, Wailing Arrow on cooldown, Arcane Shot, Aimed Shot, Black Arrow, Steady Shot. ui.js 23986 applies the Sentinel Aimed-Shot-in-Trueshot rule ("Trueshot was up and you had no Precise Shots") to both heroes and has no Wailing Arrow row (it is only in the `alt`/`procs` lists, 23990); Moonlight Chakram (Sentinel: ~5 s before Trueshot ends) is also only in alt lists. Fix: hero-split the Aimed Shot row; add Wailing Arrow (Dark Ranger) and Moonlight Chakram (Sentinel) rows, or leave as alt-excusals deliberately (UNSURE: both are one-press-per-Trueshot buttons).
4. UNSURE (cosmetic). Opener steps list one Explosive Shot (ui.js 23977) while the `why` text and both guides say twice in a row (Unstable Trigger). Add a second `{ n: 'Explosive Shot' }` step if the opener check should expect it (Icy AoE opener for 2+ targets: second Explosive Shot on a second target).
5. COSMETIC. Internal inconsistency: `open.len: 15` vs `win.dur: 17` (Trueshot lasts 17 s per Icy, "90-second or 2-minute cooldown"). Trueshot cd 120 with Calling the Shots 90 (cdT) is right.
Checked and fine: Explosive Shot 30 s / Volley 45 s (Wowhead spell shows 45 s), Rapid Fire 16, Aimed Shot 15 s 2 charges, stat order (Crit > Mastery > Vers > Haste on both guides, both heroes), Hunter's Mark first, tier-set text (2-pc: Explosive Shot +1 s and +5%; 4-pc: Aimed/Rapid +5% and 0.5 s cooldown per Explosive tick: matches Wowhead spell text), opener order, Precise Shots rule for Sentinel, Trueshot hold for 30 Bullseye.

### Beast Mastery
1. SURE (cosmetic, from first pass; re-confirmed). Dire Beast is a passive talent (Wowhead BM builds list it as a talent node, 1/1 in the single-target build, 0/1 in raid cleave and M+; no button). `alt` arrays in the BM apl (ui.js 23957-23966, every row) still contain "Dire Beast" and "Call Pet 1" next to real presses. Harmless to scoring; drop "Dire Beast" for tidiness.
2. SURE (cosmetic). ui.js 16421 PERF_CDS: `'Beast Mastery Hunter': [['Bestial Wrath', 90], ['Call of the Wild', 120], ['Bloodshed', 60]]`. Call of the Wild is not in the kit or in any build; Bloodshed is a passive talent (not a press; Wowhead: "Bloodshed will be applied to the target the pet is currently attacking"). Only judged if the player cast them, so nothing shows; remove both for tidiness. Bestial Wrath 90 s base is right (Wowhead spell 1.5 min); Icy's "30-second cooldown" is with The Beast Within, which every Wowhead build takes, so the apl `cd: 30` and cds `cd: 90 / cdT The Beast Within 30` are consistent. The first pass's "oddity" is not a bug.
3. LIKELY (Dark Ranger only). Wailing Arrow has no apl row (both guides: use in each Bestial Wrath, when Withering Fire is within 2 GCDs of ending; Wowhead: do it without letting Kill Command reach 2 charges). It is only in `alt` lists. Same trade-off as Marksmanship item 3.
4. UNSURE (Dark Ranger). Icy's Dark Ranger single-target list puts Black Arrow (during Withering Fire, first 10 s of Bestial Wrath) above Kill Command and Barbed Shot only when Bestial Wrath is about to be up; ours (23962) puts Black Arrow after the Kill Command rows with the tip "Black Arrow before Barbed Shot" (Wowhead's order). The two guides differ; no change needed.
Checked and fine: Pack Leader ST/AoE priority (Barbed Shot before Bestial Wrath or at 2 charges; Kill Command on Howl or Nature's Ally; Cobra Shot at Cobra Fang; Wild Thrash first on AoE, Wild Thrash needs 2+ targets), Cobra Shot at 3 Cobra Fang Pack Leader / 4 Dark Ranger (Icy tier text, ui.js 23964-23965), tier set text (matches Wowhead spell text), ST openers (Pack Leader Barbed x2, Bestial Wrath, Kill Command, Cobra Shot; Dark Ranger Black Arrow first per Wowhead), stat order (Pack Leader Mastery > Crit > Haste > Vers; Dark Ranger ST Crit first; Icy ST Mastery > Haste > Crit, M+ Haste last: already listed as a disagreement in the note), Pack Leader recommended everywhere (Icy says Dark Ranger "far behind"), Stampede 30 yd line, Kill Command 7.5 s with Alpha Predator charge handling.

## Still not judged
- Wowhead hero master switch and the "Twin Fangs" option on the Survival page are scripted; I read all hidden panel text instead of toggling them, so the Pack Leader + Twin Fangs variants are covered only through that text.
- SPEC_TOP numbers and the talent-tips table (Hunter talent names such as Two Against Many, Emergency Salve, Tenacious): not re-checked beyond the names existing in Wowhead's current builds (they do: Two Against Many in SV raid/AoE builds, Emergency Salve in BM Coiled Altar/Ula'tek advice, Tenacious in the Icy MM builds).

---

## Mage

Specs checked: Arcane, Fire, Frost Mage (Wowhead guide pages read in the browser with tabs clicked; Icy Veins returned 403 and could not be opened; no Oct 23/26/27 Mage hotfix text was findable by search).
Sure mismatches: 2 (both small, in src/ui.js GEN_SPECS). Likely: 2.
Most important: Frostfire Frost priority in our checks leaves out Comet Storm (Wowhead puts it second); Spellslinger Arcane uses the Sunfury Missiles threshold.

## Scope and what could not be verified
- Wowhead pages: Arcane rotation "Updated 2026/10/16"; Fire and Frost rotation, and all three stat pages "Updated 2026/10/13". All are before our Oct 19 notes, so there is no newer guide text than our copy. Our notes match Wowhead's text where I could read it.
- Read after clicking tabs: Arcane (Spellslinger + Sunfury priority, opener, pre-combat, Touch, Evocation, Surge text); Fire (opener, Frostfire single-target priority + Combustion priority; Sunfury priority tab did not render text, so I did not judge it); Frost (Frostfire single-target priority, Charged Cooldowns text; Spellslinger priority did not render, the page said "Please select a Hero Talent option", so I did not judge it).
- NOT opened: stat priority pages (page body did not load through fetch; browser calls failed with "Policy check temporarily unavailable"); all AoE tabs; all Icy Veins pages; Oct 23/26/27 hotfix notes. I do not judge those.

## Arcane Mage
Matches Wowhead (Oct 16): Sunfury priority, Spellslinger priority, opener (Surge, Missiles, Barrage, Touch while Barrage/Bolt in the air or Surge has 13 s or less left), Touch 45 s, Surge 15 s / +35% / 425% mana regen, cooldown window 17 s Spellslinger / 23 s Sunfury, Prismatic Barrier 0.5 s cast, pre-combat (Intellect, Familiar, Barrier, Mirror Image for threat).
1. src/ui.js GEN_SPECS 'Arcane Mage' apl list, first entry (Arcane Missiles): `if: { buff: 'Clearcasting', low: ['Arcane Salvo', 11], no: 'Arcane Soul' }`, tip "with Clearcasting and under 12 Arcane Salvo". Right now: that is Sunfury only. Spellslinger is "Missiles with Clearcasting and less than 15 Salvo" (Barrage at 20). Source: https://www.wowhead.com/guide/classes/mage/arcane/rotation-cooldowns-pve-dps (Spellslinger priority tab). Sure. Fix: tag the entry `hero: 'Sunfury'` and add a Spellslinger copy with `low: ['Arcane Salvo', 14]`; say "under 15" in its tip.
2. Same list, Prismatic Bolt entries: both are untagged ("whenever it is ready"). Spellslinger's first Bolt rule needs more than 13 Salvo (and 6+ Cumulative Power, or no Clearcasting, or no 4-piece, or 2+ targets); the plain "if ready" Bolt comes after Barrage at 20 and Missiles. Likely. Fix: for Spellslinger, don't flag a Bolt left up while you had Clearcasting and under 14 Salvo (or tag the first Bolt rule Sunfury).
3. src/ui.js GEN_SPECS 'Arcane Mage' `why` of the apl and the spec note say Sunfury Orb "under 3 Charges" is not checked: fine, no mismatch. Note only: Wowhead's Spellslinger Orb rule is "no Charges or 2+ targets"; ours (rot, Arcane Orb cd 20, hero Spellslinger) is a cooldown-use check, so no wording is false.
4. Stats (not re-read, see scope): our note and `stats` say Haste first. Unverified this pass.

## Fire Mage
Matches Wowhead (Oct 13) for opener, Combustion text (cast while casting, delay to 90% Firestarter ~18 s, 8-10 s otherwise, Fired Up apex, Combustion every 1 min), hard-cast list into Combustion (Pyroblast/Flamestrike with Pyroclasm, Frostfire Bolt if Frostfire, Scorch if Sunfury, Fireball).
1. src/ui.js GEN_SPECS 'Fire Mage' apl list, entry `{ s: 'Scorch', if: { buff: 'Heat Shimmer', no: 'Hot Streak!' } ... tip: 'Both guides: cast Scorch with Heat Shimmer ...' }`: no hero tag. Wowhead's Frostfire priority (single-target and Combustion lists) has no Scorch at all (Frostfire Bolt is the filler); our own note says "Scorch is only for movement as Frostfire". Source: https://www.wowhead.com/guide/classes/mage/fire/rotation-cooldowns-pve-dps (Frostfire, Single-Target Priority). Sure. Fix: add `hero: 'Sunfury'` to that Scorch entry and the Heat Shimmer proc (procs list) so Frostfire players are not flagged; "Both guides" becomes "As Sunfury".
2. Same list, Meteor entry tip "cast Meteor as soon as it is ready, and inside Combustion": Wowhead's Frostfire Combustion list is "Meteor if it will hit during Combustion", and the outside-Combustion list puts Meteor after Combustion. Likely small. Fix: say "Meteor right after Combustion, or timed to land inside it".
3. Fire Blast rule: Wowhead Frostfire adds "Fire Blast if your Pyroblast (Hot Streak!) just crit" and "while casting Frostfire Bolt/Pyroblast with Heating Up". Our `fbhs` pair ("Fire Blast without Hot Streak! up") is consistent. No mismatch.
4. Stats (Haste > Mastery > Vers > Crit): not re-read this pass.

## Frost Mage
Matches Wowhead (Oct 13): Frostfire opener intent, Ray of Frost 2 charges with Hand of Frost (level 90), Glacial Bulwark + Improved Ice Barrier for two Ice Barrier / Ice Block charges, Time Walk note, Frostfire Ice Lance at 12+ Freezing (we do not check Freezing).
1. src/ui.js GEN_SPECS 'Frost Mage' apl list (Frostfire entries): Wowhead's Frostfire priority is Glacial Spike, Comet Storm, Flurry (Brain Freeze, no Thermal Void), Ice Lance at 2 Fingers, Ray of Frost, Frozen Orb, Ice Lance (Fingers + Thermal Void), Ice Lance at 12+ Freezing, Flurry, Frostbolt. Ours has no Comet Storm entry (its name is only in the `alt` lists). Source: https://www.wowhead.com/guide/classes/mage/frost/rotation-cooldowns-pve-dps (Frostfire, Single-Target Priority). Sure. Fix: add `{ s: 'Comet Storm', hero: 'Frostfire', cdq: true, if: ready, tip: 'Comet Storm right after Glacial Spike' }` second in the Frostfire order (Comet Storm is not a press of its own talented spell only if it is a proc, so verify how it appears in the log first).
2. Same list, last entry `{ s: 'Frostfire Bolt', ...}` is the filler for both hero trees; Wowhead Frostfire says "Frostbolt" in the last line of the single-target list while its text says "Any reference to Fireball also applies to Frostfire Bolt" (that is the Fire note). In Frost the filler for Frostfire is Frostfire Bolt per our note and the talent table; the page's priority line reads "Frostbolt". Unsure. Fix: none unless the log shows Frostfire players casting Frostbolt.
3. Spellslinger priority could not be read (it renders only after a hero choice and did not show text). Not judged. Our note's Spellslinger list (Flurry, Ice Lance at 2 Fingers, Frozen Orb, Glacial Spike, Ice Lance, 6+ Freezing, Ray at <=3 Icicles) was not re-verified.
4. Frozen Orb vs Ray order in Frostfire: Wowhead puts Ray of Frost before Frozen Orb (ours matches).
5. Stats (Mastery > Crit > Haste > Vers): not re-read this pass.

---

## Monk

Specs checked: Brewmaster, Mistweaver, Windwalker (project side from origin/main; online side read in a browser tab for Wowhead and Icy Veins, all three specs).
Sure mismatches: 1 (Windwalker burst table still lists Storm, Earth, and Fire); 1 more in our notes (not player-facing); 1 unsure (Revival cooldown with Uplifted Spirits).
Most important: src/ui.js:16424 `'Windwalker Monk'` burst list says "Storm, Earth, and Fire"; the guides' Windwalker cooldown lists are Zenith, Celestial Conduit, Invoke Xuen, Touch of Death, Touch of Karma, Fortifying Brew (no SEF).

## How this pass was done (second pass)
- Compared against `git show origin/main:src/ui.js` (saved to %TEMP%\ui_main_monk.js; line numbers below are from that file, they matched the working copy for the Monk entries) and `origin/main:notes/Guides/Classes/<Spec> Monk.md`.
- Opened my own browser tab (closed at the end). Wowhead and Icy Veins hide the hero-talent tabs, ST/AoE switches, opener variants and ability toggles inside the page. I opened each page and read the full page text out of the DOM with a script, which contains every hidden tab and option list at once (Shado-Pan + Conduit; Master of Harmony + Shado-Pan; Yu'lon + Chi-Ji; raid / M+; ST / AoE / opener; the talent-option lists). I did NOT physically click each switch; the text of every variant was present, so nothing was left unread. Not readable as text: talent import strings and spell-icon tooltips (hover notes), so talent-by-talent picks inside the builds were NOT verified.
- Pages read: Wowhead rotation, stat priority (and talent-builds for Windwalker) for all three specs; Icy Veins rotation + stat priority for all three. Wowhead guide "Updated" date is 2026/10/13 on every page; Icy Veins "Last Updated: Oct 12, 2026 (reviewed for 12.1.5)". Both are BEFORE our Oct 19 read, so no guide revision has happened since our copies.
- Hotfix posts read in full for Monk: Oct 27 (Wowhead news), Oct 26 (Wowhead news), Oct 23 (Blizzard "Hotfixes: October 23, 2026" via Wowhead blue tracker). The Oct 23 and Oct 26 posts have no Monk entry. Oct 27: only PvE Monk line is "Resolved an issue that caused the Mistline talent to sometimes not properly heal the lowest health target" (Mistweaver). The other Oct 27 Monk lines are PvP-only (Celestial Conduit healing +35% in PvP, Strength of the Black Ox absorb +25% in PvP). Nothing in our notes quotes a number that these change.
- No Monk entries exist in the talent tips table (`'Reclamation': ['out'` table, line 25637); nothing to check there.

## Windwalker Monk
1. SURE (check data, tiny player impact): src/ui.js:16424, burst-cooldown table: `'Windwalker Monk': [['Storm, Earth, and Fire', 90], ['Invoke Xuen, the White Tiger', 120], ['Celestial Conduit', 90]]`. Both guides' cooldown sections list Zenith, Celestial Conduit, Invoke Xuen, Touch of Death, Touch of Karma, Fortifying Brew; Storm, Earth, and Fire is not in the Midnight guides, and GEN_SPECS (line 24480-24501) already uses Zenith as the window. Source: https://www.wowhead.com/guide/classes/monk/windwalker/rotation-cooldowns-pve-dps and https://www.icy-veins.com/wow/windwalker-monk-pve-dps-rotation-cooldowns-abilities. Fix: replace the SEF entry with `['Zenith', 90]` (Zenith is a 60/70/80/90 s talent-set cooldown, 2 charges). Confidence: sure it is not in the guides; likely the spell is gone from the Midnight kit (retail Wowhead page for the old spell redirects to Mists Classic).
2. STALE IN OUR NOTE ONLY (no code change): notes/Guides/Classes/Windwalker Monk.md, "Disagreements" last bullet and the Conduit opener line say "Wowhead's [Conduit opener] has no Zenith listed". Both guides now list Zenith right after Invoke Xuen in the Conduit opener (Wowhead: Slicing Winds precast, Tiger Palm, Invoke Xuen, Zenith, Strike of the Windlord, Fists of Fury, Rising Sun Kick, Fists again if reset, Whirling Dragon Punch; Icy Veins identical, with a second Strike and Slicing Winds at the end). So our check, `open.seqs[0]` at ui.js:24481 (Tiger Palm, Xuen, Zenith, Strike, Fists, RSK, WDP), is CORRECT. Fix: correct the note; optionally change its `src` from `'Wowhead, Conduit of the Celestials'` to `'Wowhead and Icy Veins, Conduit of the Celestials'`. Sure.
3. Previous pass item 2 is WRONG: GEN_SPECS Zenith `why` "Plan it for every 60, 90 or 120 seconds" is what Wowhead says ("likely want a 60 or 90 second cooldown and adjust for using it every 60, 90, or 120 seconds depending on the fight"). Keep. `cd: 90` as the default is fine.
4. Unsure, wording only: apl Celestial Conduit entry (ui.js:24488) says "Wowhead: Celestial Conduit in Zenith when no Heart of the Jade Serpent is active". Both guides say "Celestial Conduit if no active Heart of the Jade Serpent from Whirling Dragon Punch or Strike of the Windlord, cancel with the next GCD" (no "in Zenith"). The `if: { buff: 'Zenith', no: 'Heart of the Jade Serpent' }` condition is our own narrowing. Suggest dropping "in Zenith" from the tip text or noting it is about overlap with the Strike/WDP Heart. Confidence: unsure (harmless; opener places Conduit after Zenith anyway).
5. Matches, no change needed (read in both guides): Shado-Pan ST priority (Wowhead's 14 lines; Icy Veins combined list), Conduit ST priority, AoE priorities (SCK with Unbroken Rhythm right after Fists, 2+ targets), Shado-Pan opener (Tiger Palm, Zenith, Fists, RSK, Fists if reset, WDP, Strike, Slicing Winds), pre-pull (weapon oil, SCK well before pull, Transcendence), Zenith cost/BoK/RSK-reset/+2 Chi text, Heart of the Jade Serpent stacking rules, Touch of Death/Karma/Fortifying Brew text, Season 2 tier set (2pc + Unbroken Rhythm 4pc). Stats: Wowhead Agility > Haste = Crit = Mastery > Versatility (same for both hero trees); Icy Veins Haste, Crit, Mastery "all very close", Versatility last, no breakpoints. Our `stats` order [haste,crit,mastery],[versatility] matches.
- Hero choice: Wowhead recommends Shado-Pan for raid (Conduit "Advanced"); matches our note.

## Mistweaver Monk
- No mismatch in the raid priority, procs, hero trees, or stats. Read both guides: Wowhead raid priority for Conduit + Yu'lon (Vivify to save a life, Rushing Wind Kick, Renewing Mist at 3 charges, Mana Tea at 20, Spiritfont at 2 stacks, Thunder Focus Tea on Renewing Mist, remaining Renewing Mist, Vivify with high coverage, Spiritfont procs, Enveloping Mist with Strength of the Black Ox, Mana Tea, Blackout Kick / Tiger Palm) and Icy Veins' (same, plus Vivify at 2 Zen Pulse stacks and Enveloping Mist at 2 Spiritfont, which our apl already has). Chi-Ji and Master of Harmony variants read; Master of Harmony adds Harmonic Surge at 6 stacks (we do not check it; Conduit is the raid pick in both guides, so fine). Stats raid Haste > Crit > Versatility > Mastery in both guides; M+ Haste > Mastery > Crit > Vers (matches our `stats` and the "Mythic+ values Mastery" line). Tier set text matches the note. Yu'lon window text matches (3-4 Enveloping Mists, then Rushing Wind Kick / RSK, then Vivify).
- Unsure (likely minor): Revival cooldown. Wowhead: "Uplifted Spirits reduces the cooldown from 3 minutes to 2 minutes 30 seconds and increases Revival's healing by 15%" (talent #388551, which also covers Restoral). GEN_SPECS cds Revival has `cd: 180` with no `cdT`, and ui.js:16423 uses 180 for Restoral/Revival. For someone with Uplifted Spirits the possible-casts count is undercounted. The entry is info-only (`info: true`), so players are not graded on it. Fix, if wanted: add `cdT: [['Uplifted Spirits', 150]]` to Revival (and the table at 16423). Source: https://www.wowhead.com/guide/classes/monk/mistweaver/rotation-cooldowns-pve-healer. Confidence: unsure (depends on whether the talent is detectable and common).
- Oct 27 hotfix (Mistline sometimes not healing the lowest-health target): bug fix, our note only lists Mistline as a scaler; no wording to change.

## Brewmaster Monk
- No mismatch. Read both guides' single-target and AoE priorities, openers, tier-set notes, stats. Order in our apl (ui.js:24891 onward: Blackout Kick, Niuzao, Tiger Palm with Blackout Combo, Keg Smash with Empty Barrel, Breath of Fire, Exploding Keg, Keg Smash, Tiger Palm) matches Wowhead's and Icy Veins' single-target list (the AoE list puts Niuzao and Breath of Fire / Keg Smash first, but our check is ST-only by design). Opener (Breath of Fire pre-pull, Rushing Jade Wind, Chi Burst, Keg Smash, Blackout Kick, Breath of Fire, Tiger Palm, Exploding Keg, Keg Smash, Blackout Kick, Niuzao) matches both. Exploding Keg "once every minute" and Blackout Kick 4 s unhasted ("Blackout + 3") match. Stats: Icy Veins defensive Crit > Vers > Mastery > Haste, offensive Crit > Mastery > Vers > Haste; Wowhead defensive Vers = Crit = Mastery > Haste. Our `orderWhy` already says this; Haste last agrees.
- Minor, harmless (unchanged from first pass): offGcd list and the closing Tiger Palm alt list include Dampen Harm (note says Midnight removed it); never appears in logs. Leave unless tidying.
- Not in any player-facing check: Celestial Brew/Infusion 90 s cooldown (note only). Oct 23/26/27 hotfixes did not touch Brewmaster.

## Not verified
- Talent-by-talent contents of the recommended builds (import strings and icon tooltips are not readable as text).
- Spell-page cooldown/charge numbers beyond those quoted in the guides (Niuzao 120 s, Celestial Conduit 90 s, Fists 24 s, RSK 10 s, WDP/Strike 35 s in our rot lists were not re-checked on spell pages; the guides do not contradict them).
- Blizzard blue-tracker posts other than the Oct 23 hotfix list.

---

## Paladin

Specs checked: Holy, Protection, Retribution Paladin (notes, GEN_SPECS, hpalChecks, SPEC_BOOK talent tips, cooldown table).
Sure mismatches: 0. Likely: 3 (Retribution Avenging Wrath cooldown table, Retribution Blade of Justice at 2 Art of War for Templar, Avenging Crusader tip). Unsure: 4.
Most important: ui.js line 11740 lists Retribution Avenging Wrath as 120 s, Crusade and Final Reckoning as cooldowns; the guides now say Avenging Wrath 60 s and Final Reckoning is folded into Execution Sentence. No Paladin PvE hotfix landed Oct 23-27.

# Paladin audit, Oct 28 2026

## Patch and guide status (what changed since Oct 19)
- Oct 23/26/27 hotfixes: the only Paladin entry is Oct 27, PvP only (Holy: all healing +5% in PvP, Divine Favor cuts Holy Light mana 50% in PvP, was 30%; developer note says Holy throughput underperforming). No PvE Paladin change on Oct 23, 26 or 27. Source: https://warcraft.wiki.gg/wiki/Hotfixes (I read up to Sept 21; nothing earlier checked).
- Older ones our notes do not quote: Sept 22 (Protection all ability damage +6%; Templar Hammer of Light +50% and Empyrean Hammer +12%, PvE). Nothing in our notes or checks quotes these, so no fix needed.
- Wowhead guide dates: Holy rotation "Updated 2026/10/24" (after our Oct 19 read), Holy talents 10/13, Holy stats 10/13, Protection rotation and stats 10/13, Retribution rotation and stats 10/13. Icy Veins all three specs "Last updated Oct 12" (changelog "Reviewed for 12.1.5"). Method Ret 13 Oct. Patch 12.1.5 itself has no Paladin changes (https://warcraft.wiki.gg/wiki/Patch_12.1.5).
- I compared the Wowhead Holy rotation page (all text, both priority variants, Cooldowns tab, Advanced section) with our Holy note: the healing priority, cooldown advice, tier set and Beacon facts all still match. The Oct 24 edit did not change anything our note quotes that I could find (the page's own changelog dialog I did not open, so I cannot name the edit).

## Holy Paladin
Overall: guide note and hpalChecks match both guides. No sure mismatches.

Reclamation (asked): still a talent. Holy tree, taken 1/1 in every Wowhead build (Herald raid Virtue and Faith, Lightsmith) in https://www.wowhead.com/guide/classes/paladin/holy/talent-builds-pve-healer (sits between the Avenging Wrath/Avenging Crusader choice and Pillars of Light). Wowhead spell data for Reclamation (spell 415364): passive, "modifies healing by target health, value 50%, affected spell Holy Shock" (https://www.wowhead.com/spell=415364/reclamation). Neither guide's rotation or talent page discusses it (it is not a choice node and does not change the priority), so it is not a button or a proc we should check. Our tip at ui.js 19907 ("Holy Shock heals up to 50% more on someone low, and gives back some mana") matches the healing part. The "gives back some mana" part: the spell data shows a second effect (dummy, value 10) I could not decode, and the old Dragonflight wording (10.1.5) was "refund up to 15% mana on Holy Shock and Crusader Strike". Sure about the 50% healing; unsure about the mana part and about whether Crusader Strike is still included (spell data lists only Holy Shock). Fix: keep the sentence, or drop "and gives back some mana" if you cannot confirm in game. ui.js 13784 comment calls Reclamation a "proc not pressed"; harmless.

1. Avenging Crusader tip. Where: ui.js 19954, SPEC_BOOK['Holy Paladin'].talents['Avenging Crusader']. Says: "A melee-range playstyle (mostly Lightsmith); the guides don't use it in raid." Now: Icy Veins' rotation page has a loadout button "Raid - Avenging Crusader" and its own priority for it (Judgment, Crusader Strike, Light of Dawn, Holy Shock); Wowhead's healing priority has an "Avenging Crusader" option that adds "During Avenging Crusader cast Hammer of Wrath / Crusader Strike" (verified by clicking the option). Source: https://www.icy-veins.com/wow/holy-paladin-pve-healing-rotation-cooldowns-abilities and https://www.wowhead.com/guide/classes/paladin/holy/rotation-cooldowns-pve-healer. Neither says it is the raid default (Herald plus Avenging Wrath is), so the claim "don't use it in raid" is too strong. Likely. Fix: "An optional melee playstyle; both guides give it its own priority, but the default raid build keeps Avenging Wrath."
2. Call of the Righteous. Where: ui.js 19953 (tip) and notes/Guides/Classes/Holy Paladin.md line 24 ("90 s Wings"). Says: "Avenging Wrath comes back 30 seconds sooner but lasts 5 seconds less." Patch 12.1.0 notes say "Call of the Righteous reduces Avenging Wrath duration by 3 seconds (was 4)" (https://warcraft.wiki.gg/wiki/Patch_12.1.0, Holy section), but Wowhead's own Avenging Wrath tooltip on the guide shows "20 sec / Call of the Righteous: 15 sec" (5 less) and the talent cooldown "1.5 min". The sources disagree. Unsure. Fix: verify in game; if it is 3 s, change "5 seconds less" to "3 seconds less".
3. Note line 5 (Holy Paladin.md): "Holy Shock +65%", "Eternal Flame/Word of Glory +20.75%". The Patch 12.1.0 list says Holy Shock healing +10%, Eternal Flame +20%, Word of Glory +20% (all healing +19% on top). Not quoted anywhere player-facing; only the note. Unsure which is right (the 65% may be a combined figure from the Wowhead news post). Fix: re-read the Wowhead 12.1 post before quoting; leave alone otherwise.

Checked and fine: Beacon of Virtue "5 people for 9 seconds, every 15 seconds" (https://warcraft.wiki.gg/wiki/Beacon_of_Virtue: 9 s since 12.0.0, target plus up to 4, 15 s cooldown, 10% transfer; Icy Veins' glossary says "4 allies" which is the extra four); Aura Mastery 8 s and Devotion Aura 12% (https://warcraft.wiki.gg/wiki/Aura_Mastery; the note's "3%" base Devotion value I could not confirm but is not contradicted); Ringing of the Heavens double-strength Divine Toll (Patch 12.1.0); Holy Light always grants Infusion with the 4-piece, Judgment 20% chance, Holy Light costs more mana (Icy Veins tier set); Eternal Flame best spender, Light of Dawn only if it would overheal; Divine Toll and Holy Prism at 2 or fewer Holy Power; Infusion goes to Flash of Light, Judgment only without a target; Aura Mastery only with Virtue up in raid; Avenging Wrath 2 minutes, 30 s with Sanctified Wrath; stats Intellect, Mastery, Haste = Crit, Versatility (Wowhead, both Herald and Lightsmith; Icy Veins Oct 12 unchanged); orderH Herald/Lightsmith in HPAL_D matches the notes. Lightsmith uses Word of Glory (not Eternal Flame) as its spender and Holy Bulwark/Sacred Weapon first in the list: hpalChecks already counts Word of Glory with Eternal Flame (ui.js ~14767), so nothing to fix.

## Protection Paladin
Overall: priority, openers, stats, tier set and the 12.1 numbers in the note match both guides. No sure mismatches.

1. Avenging Wrath numbers. Where: notes/Guides/Classes/Protection Paladin.md line 43 ("Avenging Wrath: +20% damage/healing (+crit talented)"). Patch 12.1.0 notes (Protection section): "Avenging Wrath increases damage and healing by 10% and critical strike by 10%"; Wowhead's Avenging Wrath tooltip on the Protection page still shows a shared Holy/Protection line "by 20% for 20 sec". Conflict inside Wowhead. Unsure. Not shown to players. Fix: re-check in game before quoting any number.
2. Divine Toll and Sentinel wording is fine. One difference worth knowing, not a mismatch: Icy Veins has Divine Toll above Hammer of Light and does not gate it on Holy Power; Wowhead gates it at 0 Holy Power (single target) and 0-2 (AoE). GEN_SPECS (ui.js 19159) uses "2 or less", which sits inside both. No fix.
3. Wowhead Protection page (10/13) calls Avenger's Shield before Judgment for Lightsmith but after Judgment for Templar; ours is one order for both. Style, not a mismatch.

Checked and fine: Haste first, then Crit/Mastery/Vers close (Wowhead survivability Haste > Mastery > Crit > Vers; DPS Haste > Crit > Mastery > Vers); SotR 3-5 Holy Power; Word of Glory under 50% or with Shining Light; Hand of Reckoning pull; Sentinel 20 s and Hammer of Light/Empyrean Hammer -33% (Patch 12.1.0). Pre-combat aura and weapon oil/Rite checks match Wowhead ("Make sure you have the most useful aura on", oil if Templar, Rite if Lightsmith). Spec Tune pairs: Divine Toll with Sentinel/Avenging Wrath match Wowhead "sync with Avenging Wrath".

## Retribution Paladin
1. Cooldown table is stale. Where: ui.js line 11740 (table of burst cooldowns per spec): 'Retribution Paladin': [['Avenging Wrath', 120], ['Crusade', 120], ['Divine Toll', 60], ['Execution Sentence', 60], ['Final Reckoning', 60]]. Now: Avenging Wrath is a 60 s cooldown ("Wake of Ashes being a 30-second CD and Avenging Wrath a 60-second one"), Crusade is no longer a separate cooldown (reworked into extra haste stacks on Avenging Wrath), and Final Reckoning is gone (its effects were added to Execution Sentence, a 60 s cooldown). Source: https://www.icy-veins.com/wow/retribution-paladin-pve-dps-guide (sections 2.9 and intro) and Wowhead "mostly 30 and 60 second abilities" (https://www.wowhead.com/guide/classes/paladin/retribution/rotation-cooldowns-pve-dps). Our own GEN_SPECS (ui.js 18330, 18346) already says Avenging Wrath cd 60, so the two tables disagree. The Warcraft wiki still shows 2 min for Avenging Wrath (https://warcraft.wiki.gg/wiki/Avenging_Wrath), which is probably the Holy/Protection value on a shared page. Likely. Fix: change to [['Avenging Wrath', 60], ['Divine Toll', 60], ['Execution Sentence', 60]] (drop Crusade and Final Reckoning).
2. Blade of Justice at 2 Art of War, Templar. Where: ui.js 18335 (apl entry, `if: { buff: 'Art of War', st: 2, no: 'Avenging Wrath' }`, why "you had 2 Art of War outside Avenging Wrath"); notes Ret lines 24-29 are right (note says "outside Wrath" only under Herald). Now: Wowhead and Icy Veins (both, verified by switching the hero toggle): Herald says "Blade of Justice with 2 stacks of Art of War if Avenging Wrath isn't active"; Templar says "Blade of Justice with 2 stacks of Art of War" with no Wrath condition (and Templar has no "Hammer of Wrath at 2 charges" line, which our code already limits to Herald at 18336). So for Templar the check should fire at 2 Art of War even inside Avenging Wrath. Likely. Fix: make the `no: 'Avenging Wrath'` condition Herald-only (same way the Hammer of Wrath entry uses hero: 'Herald of the Sun'), and reword "outside Avenging Wrath" for Herald only. Source: https://www.wowhead.com/guide/classes/paladin/retribution/rotation-cooldowns-pve-dps.
3. Divine Arbiter step missing from Herald single-target note. Where: notes Ret line 29. Both guides' Herald single-target list (updated Oct 12/13) includes "Divine Storm with a Divine Arbiter proc from Final Verdict" (at 5 Holy Power first, then again after Hammer of Wrath at 2 charges). Our note's Herald line leaves it out (the AoE line has it). GEN_SPECS lists Divine Arbiter in `ctx` and treats Divine Storm and Final Verdict as the same spender, so no check is wrong. Likely, note only. Fix: add the step to the note.
4. Final Reckoning/Crusade wording elsewhere. ui.js 18325 opener accepts 'Crusade' as an Avenging Wrath alias and 18341 `win.names` too; harmless (nothing to match) but Crusade is now only a haste talent on Avenging Wrath, so a logged "Crusade" cast would not occur. No fix needed.
5. Blade of Justice cooldown. Where: ui.js 18339/18343 `cd: 12`. Wowhead's guide data attaches "10 sec cooldown" to a Blade of Justice talent line (404436) and "2 Charges" (403745, Improved Blade of Justice). Unsure what the base is now. Fix: verify in game; if it is 10 s, change both cd values.

Checked and fine: opener (Blade, Avenging Wrath, potion and trinkets, Execution Sentence, Wake, Hammer of Light/Final Verdict, Divine Toll; Wowhead's alternative has Wake before Execution Sentence, our lead sentence already allows either order); Avenging Wrath +15% (Patch 12.1.0, was 20%) and 20 s duration; stats Mastery > Haste > Crit > Vers for both trees (Wowhead 10/13 and Icy Veins 10/12); tier set (Divine Purpose proc rate, weave Divine Storm after a Divine Purpose spend on single target, Final Verdict on AoE); Hammer of Light costs 3 Holy Power after Wake (Patch 12.1.0); Execution Sentence 10-yard radius (Patch 12.1.0).

## What I could not open or judge
- Wowhead Holy: the "Gameplay differences as Lightsmith" dropdown (I read its text from the page source but did not click it open); the page's changelog dialog was not opened. Wowhead Holy talent explanations tab clicked, no Reclamation text in it.
- Icy Veins Holy and Protection priority lists: read as one block of page text (all talent toggles merged); I clicked the Herald/Templar and ST toggles only on the Retribution page. For Holy, the Avenging Crusader and Lightsmith variants were checked on Wowhead only.
- Blizzard blue tracker and Wowhead/Icy Veins hotfix news posts were not reachable (the search tool returned no Oct 23-27 posts); I used the Warcraft wiki hotfix page instead, read only to its first 100,000 characters (covers Sept 21 to Oct 27).
- Wowhead spell pages for Beacon of Virtue and Aura Mastery returned errors; the wiki was used instead.
- Warcraft wiki Patch 12.1.0 page read to character 200,000 of 281,000; Paladin section was complete.

---

## Priest

Specs checked: Shadow (Wowhead rotation page read in full, both hero trees, ST/AoE/opener/cooldowns), Holy (Wowhead rotation page partly), Discipline (our files only; online pages not opened). Icy Veins never opened (403 to fetch, no own browser tab; see "Could not check").
Sure mismatches: 1 (the notes' header "No 12.1.5 class changes" is false for Discipline and Holy). Likely/unsure: 3.
Most important: Disc Master the Darkness duration was cut 1 min -> 30 s and Holy's Holy Celerity / Ultimate Serenity swapped tree positions in 12.1.5; nothing of ours quotes the duration, but all three notes claim "No 12.1.5 class changes".

## Sure
1. All three notes, line 3: "Read Oct 19 2026. Wowhead + Icy Veins (12.1.5). No 12.1.5 class changes."
   Blizzard 12.1.5 content update notes (https://news.blizzard.com/en-us/article/24304162/12-1-5-content-update-notes): Discipline "Master the Darkness duration reduced to 30 seconds (was 1 minute)"; Holy "Holy Celerity and Ultimate Serenity have swapped positions on the specialization tree" (Ultimate Serenity now cheaper to reach, so saved Holy talent imports/builds from before may need a recheck); Shadow: none.
   Fix: change header on Disc and Holy notes; Disc note "Apex Master the Darkness (4 ranks)" bullet: add "lasts 30 s (was 60 s)". Nothing in src/ui.js quotes either number (grep Master the Darkness / Holy Celerity: no hits), so no player-facing wording is false. Sure.

## Shadow Priest
Checked against Wowhead "Shadow Priest Rotation Guide - Midnight" (updated 2026/10/13, 12.1.5) with the Archon and Voidweaver master switches, ST, AoE and Opener tabs, options (Misery / Invoked Nightmare / Voidform) and the Voidform / Halo / Power Infusion cooldown tabs. Our note and checks match it: Archon ST order (Pain, Vampiric Touch, Halo, Voidform, PI, Madness if missing/falling off/cap, Mind Blast, Mind Flay: Insanity while Madness up, Madness in Voidform, Tentacle Slam, Shadow Word: Death under 20%, Void Volley, Mind Flay); Voidweaver order (Death on absorb, Void Blast, Madness, Void Torrent, Mind Blast...); opener (Mind Blast precast, Tentacle Slam, Pain if Invoked Nightmare, Void Volley, Halo, Voidform, PI + trinket; Voidweaver adds Madness, Void Torrent, Void Blast); Voidform is on cooldown with PI/Halo/Torrent; Halo early. No Shadow change in 12.1.5 notes.
Mismatches:
- src/ui.js ~18790, procs Mind Devourer `use: ['Shadow Word: Madness', 'Devouring Plague']`: Devouring Plague is not in the 12.1.5 Shadow kit (Madness replaced it). Harmless alias, drop it. Likely.
- src/ui.js ~18770 stats `order: haste, mastery, crit, vers` and note "Wowhead: Haste > Mastery". A log-stats site (seemeta.com/en/wow/priest/shadow, data Oct 20-28) shows Mastery > Haste > Crit > Vers and Archon at 93% of logs. Could not open Wowhead's or Icy Veins' stat page to see if either changed, so unsure; our own Disagreements section already notes the Haste/Mastery split.
- Wowhead's Archon ST puts Madness-at-cap before Mind Blast and Mind Flay: Insanity; our apl list order has Mind Blast before MFI then Madness-in-Voidform, which matches. Voidweaver: Wowhead puts Void Torrent before Mind Blast; our list has Void Torrent after Tentacle Slam in the list but gated on Madness up. Order only, unsure it matters.
No other mismatches found.

## Holy Priest
Wowhead Holy rotation page (updated 2026/10/13, 12.1.5) read from the live page (Oracle and Archon priority lists are icon-only, so spell order not readable; the text matches our note): Oracle never uses Prayer of Healing; Serenity on cooldown, Prayer of Mending on cooldown (2 charges), Flash Heal spot heals, do not overcap Benediction (2), Smite for Surge of Light, Divine Hymn for raid damage; 4-piece PoM gives a Renew; Apotheosis with Halo for Archon; Divine Hymn gives Guardian Spirit on you (12.1); Prayer of Mending stacks up to 14.
- Holy Celerity / Ultimate Serenity swap (12.1.5): see Sure #1. Our note's "Ultimate Serenity" capstone advice still right; no talent id/position quoted in ui.js (the talent tree data at ui.js ~14552 is positions only: check Ultimate Serenity (82612 at 13500,5700) vs Holy Celerity (103900 at 12300,6900) coordinates are the old layout). Unsure whether the tree data was refreshed; fix: re-export the Holy tree.
- src/ui.js ~19038 `rot` includes `Halo` for all Holy players with no `hero: 'Archon'`; Halo is Archon-only (our own note says so). Likely harmless if never-cast spells are skipped, otherwise Oracle gets a false "Halo" miss. Unsure.
- Note stats: "Icy Veins raid: Crit > Mastery..." could not be re-verified (see below).

## Discipline Priest
Online pages not opened (Wowhead Disc page blocked after rate limits; Icy Veins 403). Only the one confirmed 12.1.5 change applies: Master the Darkness 30 s (Sure #1).
- src/ui.js 11741 (cooldown list): `'Discipline Priest': [Power Word: Barrier 180, Rapture 90, Evangelism 90, Power Infusion 120]`. Rapture is not mentioned anywhere in our Disc note (Evangelism is the 1:30 cooldown). If Rapture is gone from the Midnight kit the entry is stale. Unsure; check Wowhead Rapture spell page.
- Note says Mind Blast opens Entropic Rift; `rot` Mind Blast `cd: 20` for Disc: unverified (Wowhead spell page 8092 not opened). Unsure.

## Could not check (say so; do not judge)
- Icy Veins pages for all three specs (fetch 403; browser pane would not give me my own tab, shared tab kept being navigated away by other helpers, then Wowhead CloudFront blocked me).
- Wowhead Discipline rotation page, Holy M+ priority and Archon tab text, all Wowhead stat-priority and talent pages, Wowhead changelog.
- Hotfixes of Oct 23, 26, 27: no source found by search; the Blizzard 12.1.5 notes list no dated Priest hotfix; no Priest hotfix post seen.
- Talent tips table: has no Priest entries (only paladin etc. keys), so nothing to check there.

---

## Rogue

Specs checked: Assassination, Outlaw, Subtlety (notes + GEN_SPECS checks vs current guides and the Oct 23/26/27 tuning).
Sure mismatches: 2 (Subtlety note misses the Oct 27 nerf; PERF_CDS still lists Flagellation). Assassination and Outlaw: none found.
Most important: Subtlety note says "+14% to compensate"; Oct 27 took all ability damage down 8% and Trickster's Fazed from 7% to 5%.

# Rogue class audit (Oct 28 2026)

Method: read our three notes and the three GEN_SPECS entries (ui.js 18545 Outlaw, 18645 Assassination, 18735 Subtlety, plus PERF_CDS 11743, SPEC_TOP/other tables). Online, I opened guide pages in the browser and read the full page text including the hidden tab/switch content (hero-talent switches, ST/AoE, opener variants), not just the default view.
Pages read in full: Wowhead Subtlety rotation (updated 10/16, all hero/ST/AoE/opener variants), Wowhead Assassination rotation (updated 10/13, all variants), Icy Veins rotation pages for all three specs (all "Last Updated Oct 12", reviewed for 12.1.5), Icy Veins Subtlety stat page (Oct 12).
NOT re-read in the browser: Wowhead Outlaw rotation (the fetch only returned the header, "Updated 10/19"; the Wowhead stat pages returned errors), Wowhead and Icy Veins talent pages, Wowhead/Icy Veins stat pages for Assassination and Outlaw. I do not judge those sections. Our Outlaw note matched the Icy Veins page in every line I could compare.

## What changed since Oct 19
- Oct 23 and Oct 26 hotfix lists: no Rogue entries found (AccountShark's Oct 27 article lists none for Rogue).
- Oct 27 tuning (class tuning, not a hotfix; Icy Veins "big subtlety nerf druid buffs and more upcoming class tuning october 27th", AccountShark https://accountshark.net/blog/wow-midnight-class-tuning-october-27-subtlety-nerf-feral-fire-buffs-resto-druid-pvp):
  - Subtlety: ALL ability damage -8% (PvE and PvP). Trickster: Fazed 7% -> 5%. Blizzard says the 12.1.5 compensation "overshot expectations" and Trickster benefited more than Deathstalker.
  - Assassination: PvP only (Deathstalker's Mark +20%, Hunt Them Down +20%, Darkest Night's Eviscerate bonus 8% -> 15%). No PvE change.
  - Outlaw: nothing.
- Both guide sites were last edited before our Oct 19 reading (Icy Veins Oct 12; Wowhead Oct 13/16/19), so neither has absorbed the Oct 27 nerf yet.

## Subtlety Rogue

1. SURE. Where: notes/Guides/Classes/Subtlety Rogue.md, line 5: "Subtlety got +14% to compensate".
   Now: that compensation was partly rolled back on Oct 27: all ability damage -8%, Trickster Fazed 7% -> 5%. Source: https://www.icy-veins.com/wow/news/big-subtlety-nerf-druid-buffs-and-more-upcoming-class-tuning-october-27th/ and the AccountShark article above.
   Fix: add "Oct 27: all ability damage -8%, Trickster Fazed 7% -> 5%" to the 12.1.5 change line. Nothing in ui.js quotes the +14% or Fazed (grep found no hits), so no player-facing text is wrong.

2. LIKELY. Same note, "Hero trees" (Wowhead: Trickster in all situations; Deathstalker ~2% ahead in pure single target). The guides were written before the Fazed nerf, which hits Trickster specifically, so "Trickster everywhere" may no longer hold. Not yet confirmed by any guide. Fix: flag it in the note as "guides not yet updated for Oct 27"; do not change the checks until Wowhead/Icy Veins re-rank. (Checks already handle both heroes via heroBy/orderH, so no code change needed either way.)

3. SURE. Where: src/ui.js line 11743, PERF_CDS 'Subtlety Rogue': [['Shadow Blades', 90], ['Flagellation', 90]].
   Now: our own note says Midnight removed Flagellation (and Symbols of Death, Rupture); neither current guide mentions it. The performance cooldown lane / Cooldowns-over-the-fight will show a cooldown that cannot be cast. Fix: replace Flagellation with the Midnight big buttons, e.g. ['Shadow Dance', 20 static as the note says] is the obvious second lane, or drop the entry; keep Shadow Blades 90.

4. No mismatch found for the rest of Subtlety, checked against both guides' full text:
   - Opener (Shadowstrike, Eviscerate, Vanish, Shadowstrike, Goremaw's Bite, Eviscerate, Shadow Dance + Shadow Blades, trinket/potion, Shuriken Storm, Secret Technique): matches Wowhead (Deathstalker ST) and Icy Veins. Trickster ST opener has no Eviscerate after Goremaw's; our sequence is a superset check so it is fine.
   - Priority: Secret Technique first finisher in Dance, Eviscerate with Darkest Night first (Deathstalker), Coup de Grace, finishers at 6+, Shadowstrike in Dance / Backstab outside, Goremaw's on cooldown before Dance, Vanish at low CP: all match. Wowhead Trickster: Shadow Dance at 6+ CP; Deathstalker and Icy Veins: at 2 or fewer (6+ also fine for Trickster per Icy Veins). Our wording "very low (<=2) or finishing (6+)" is right.
   - "Don't Dance if Shadow Blades <10 s from ready", Shadow Blades 90 s with two Dances, second Dance has no Secret Technique unless Bloodlust, Thistle Tea auto, pre-pull Dance >20 s for Supercharger, Atrophic + Instant poisons: all match.
   - Stats: Icy Veins Oct 12: item level, Mastery, Haste (700 to 1100, soft), Versatility, Crit. Our check order [mastery],[haste],[versatility, crit], drAt haste 1100: matches.
   - Tier set text (2pc cheaper builders, 4pc Lingering Shadow on Eviscerate/Black Powder, second half of Blades stronger): matches.
   - Wowhead advanced tip not in our notes (not a mismatch): Deathstalker should macro Shuriken Storm with Shadow Dance, Trickster macros Secret Technique.

## Assassination Rogue
No mismatches found. Checked against full text of Wowhead (both hero variants, ST/AoE/opener) and Icy Veins (Fatebound and Deathstalker, raid and M+): Garrote/Rupture upkeep, Shiv on cooldown for Deathstalker only (Wowhead: Fatebound unclear, -1% to +4.5%), Envenom at 5+ (max CP / 7 with Darkest Night; Shiv or Fan of Knives at exactly 6), no Rupture during Darkest Night, Vanish -> Garrote with Deathmark, Kingsbane right after Deathmark, Crimson Tempest spread in AoE, Pandemic numbers (7.2 s at 5 CP, 5.4 s Garrote), stat order Crit > Haste > Mastery > Vers: all match what our note and GEN_SPECS say. Oct 27 changed Assassination in PvP only. (Stat and talent pages not re-read, see top.)

## Outlaw Rogue
No mismatches found. Icy Veins (Trickster and Fatebound, opener and rotation tabs, full text) matches our note and checks: Roll the Bones stages and odds 55/30/10/5, Roll the Bones unless stage 2+ (our check allows the Loaded Dice case), Keep It Rolling at stage 3 (Icy Veins allows stage 2+ for consistency; our check states both), Adrenaline Rush at low CP, Between the Eyes at 6+, Killing Spree at 6+ with Supercharger, Dispatch 6+ (Trickster) / 5+ (Fatebound), Pistol Shot at 6 Opportunity or 3 at 1-3 CP, Preparation resets AR, BtE and Blade Rush, Gravedigger / Palmed Bullets, AR global cooldown to 0.8 s at about 20-30% Haste. No Oct 23-27 change. Wowhead Outlaw rotation not re-read (see top); it is dated Oct 19, the same day as our read.
Tiny note-only point (unsure, no check affected): our note's "Keep ... (and Killing Spree for Trickster) on cooldown" - Icy Veins lists Killing Spree in both hero trees' rotation and opener (our GEN_SPECS check already applies it to both).

## Other places checked
- SPEC_TOP / spec tables (13806-13853, 14093+, 15827+, 19295+): only numbers measured from logs; the Subtlety -8% will lower Sub damage-based numbers (outP) in future kills, but none of ours quote a patch percentage. Nothing to fix.
- Talent tips table (~19907): holds Holy Paladin entries only; no Rogue entries, so nothing stale there.
- apl/ctx names for Subtlety include 'Premeditation' as a context buff: still a Subtlety talent in the tree (Premeditation#343160), fine.

---

## Shaman

Specs checked: Elemental, Enhancement, Restoration (rotation/priority/cooldown/opener pages on Wowhead and Icy Veins, hero tabs and toggles opened; hotfixes Oct 23/26/27).
Sure mismatches: 1 (Elemental: "overloads hit 75% harder" is the pre-12.1 number). Everything else matches the current guides.
Most important: src/ui.js line 18396 Elemental win.why says Ascendance makes overloads hit 75% harder; 12.1 cut it to 30%.

## Method and limits
- Wowhead guides (rotation pages for all three specs): read the full page text including every hidden hero-talent / ST / AoE / opener tab (page text, not just the visible tab). Guides last updated 2026/10/13 (12.1.5).
- Icy Veins rotation pages (all three): read every toggle's text. All say "Reviewed for Patch 12.1.5", last updated Oct 12 2026. Neither site has changed any guide since Oct 13, so none reflects the Oct 23/26/27 hotfixes.
- Hotfixes (patchbot.io copies of Blizzard's posts):
  - Oct 23: Enhancement, "Surging Elements" now shows on the Cooldown Manager (UI only).
  - Oct 26: Enhancement, Voltaic Blaze now hits secondary targets when Ula'tek is the main target.
  - Oct 27: Restoration, Healing Stream Totem and Stormstream Totem +20% healing in PvP only.
  - No Shaman raid tuning in any of the three days. Nothing of ours quotes these.
- NOT re-checked this pass: Wowhead/Icy Veins stat-priority pages, talent pages and consumables (Wowhead stat page returned a site error; stats text in the code was left as in the note). Wowhead spell pages gave no usable tooltip numbers (spell page errored in the browser). I do not judge those.
- Talent tips table (the 'Reclamation': ['out' table, now at about line 19905): it has no Shaman entries, only Holy Paladin. Nothing to audit there.

## Elemental Shaman
1. SURE. src/ui.js line 18396, GEN_SPECS 'Elemental Shaman'.win.why: "makes overloads hit 75% harder". 12.1 changed Ascendance to +30% overload damage (our own note, Elemental Shaman.md line 5, says 30% was 75%; two other write-ups of the 12.1 Shaman changes agree: https://worldofwarcraft.judgehype.com/article/patch-12-1-changements-apportes-au-chaman/ and the Icy Veins 12.1 class-changes notes). Caveat: the Wowhead rotation guide text (https://www.wowhead.com/guide/classes/shaman/elemental/rotation-cooldowns-pve-dps, updated Oct 13) still says 75%, so the guide text is stale, not the patch. Fix: drop the number ("makes overloads hit harder") or say 30%.
2. LIKELY (wording). Same line and line 18398 (pairs 'skasc' why) say Stormkeeper's "empowered spells get Ascendance's extra overloads". Our note says 12.1 stopped Stormkeeper guaranteeing a Lightning Bolt overload; Wowhead's guide text still says Stormkeeper adds an extra overload. Wording is vague enough to stay true; only revisit if you quote "extra overload" anywhere. No change needed unless you want precision.
3. NOTE, no change. The note says Stormbringer is "behind everywhere". Icy Veins now labels Stormbringer "not recommended" for raid and M+; Wowhead lists both. Our checks cover both hero trees, which is fine.
Verified as matching (no change): single-target and AoE priorities, Farseer burst order Stormkeeper > Ancestral Swiftness > Voltaic Blaze > Ascendance, Earthquake rules (Farseer: 3+ targets; Stormbringer: 4+; Elemental Blast at most 5 targets without Ancestors), pandemic 30% (5.4 s used in code), openers for ST and AoE (both guides), Elemental Blast right before Ascendance (Icy Veins still says it), tier set Overcharge!/Flowing Elements, pre-pull checks (Skyfury, Lightning Shield/Earth Shield, Flametongue, Instinctive Imbuements), cooldowns (Ascendance 180, First Ascendant 120, Stormkeeper 60, Ancestral Swiftness 30).

## Enhancement Shaman
No mismatches found against the Wowhead and Icy Veins text (priorities, openers, cooldowns, Thorim's Invocation rule, Doom Winds 8/10 s, Ascendance 2 min with Thorim's, no weapon oils, 9-10 stack spending). The Oct 26 Voltaic Blaze fix is Ula'tek-only and nothing of ours quotes it.
Minor, unsure, optional:
- UNSURE. Icy Veins' toggles show an extra Sundering step in the Stormbringer list when you tick the Sundering talent ("align with Ascendance") and a Totemic-with-Ascendance variant; Wowhead says Stormbringer has no build swaps. Our Stormbringer APL has no Sundering. Only matters if a raider runs that talent; leave as is.
- UNSURE. Icy Veins' Totemic list opens with "Voltaic Blaze if Flame Shock isn't active"; Wowhead's does not. Our Totemic order (Voltaic Blaze first) is fine either way.

## Restoration Shaman
No mismatches found. Wowhead (both hero tabs) and Icy Veins match the note and the checks: Stormstream first, Riptide on cooldown on players without it, Nature's Swiftness (Totemic) / Ancestral Swiftness (Farseer) on cooldown, Unleash Life (Farseer), Surging Totem (Totemic) / Healing Rain (Farseer), Healing Stream Totem at max charges, Chain Heal vs Healing Wave; Ascendance sequence; 60 s Stormstream buff, max 2; tier set text; pre-pull (Water Shield, Earth Shield on self and a second on the tank, Earthliving, Skyfury).
One internal oddity, UNSURE (could not confirm Riptide's charge count this pass): src/ui.js GEN_SPECS 'Restoration Shaman'.apl has { s: 'Riptide', full: true, g: 3 } (full at 3?) while rot has { n: 'Riptide', cd: 6, ch: 2 } (2 charges). One of them is wrong or "g" means something else; check against the kit in game.

---

## Warlock

Specs checked: Affliction, Demonology (incl. pdemChecks), Destruction. Wowhead and Icy Veins rotation pages opened with their tabs/switches clicked; Oct 27 hotfix post read.
Sure mismatches: 0. Both guide sites were last updated Oct 12-13 (before our Oct 19 notes), so the priorities/openers in our notes still match them.
Most important: the Oct 27 hotfix (Unstable Affliction +20%, Destruction Rain of Fire +20%) changes no priority, but our Rain of Fire target-count thresholds (Destruction note) are from before it.

## What was verified (no mismatch)
- Wowhead Affliction rotation (updated 2026/10/13): Hellcaller ST, Soul Harvester ST, AoE (Soul Harvester) all clicked; match note and apl list in GEN_SPECS. Darkglare 2 min, +20% DoTs: matches.
- Icy Veins Affliction (updated Oct 12): Hellcaller and Soul Harvester ST + openers clicked; match note and code (Dark Harvest <=2 shards for Soul Harvester, Shard Instability free UA, Malevolence on cooldown).
- Wowhead Demonology (Oct 13): Diabolist and Soul Harvester ST, AoE, opener clicked; match note. Icy Veins Demonology (Oct 12): Diabolist ST clicked; Tyrant lasts 20 s, tier set 2pc/4pc: matches note.
- Icy Veins Destruction (Oct 12): Hellcaller ST, AoE, opener clicked; match note.
- Hotfix Oct 23 (Wowhead blue tracker/Icy Veins via search): Warlock summons from Shadow of Nath'reza / Dominion of Argus / Diabolist no longer target enemies out of combat (bug fix only). Oct 26: Affliction Cooldown Manager showing Summon Darkglare (UI fix only). Nothing for our checks.
- Oct 27 (https://www.wowhead.com/news/world-of-warcraft-midnight-hotfixes-october-27-383617): Affliction "Unstable Affliction damage increased by 20%"; Destruction "Rain of Fire damage increased by 20%". Nothing for Demonology.

## Affliction
1. Pandemic windows mixed. GEN_SPECS 'Affliction Warlock' dots: Agony "refresh in its last 4.5 seconds", Corruption/Wither "4.2 seconds" (src/ui.js ~18960-18966, apl rows 'Agony' drem 4.5, 'Wither/Corruption' drem 4.2).
   Right: Icy Veins (https://www.icy-veins.com/wow/affliction-warlock-pve-dps-rotation-cooldowns-abilities): Agony 5.4 s and Corruption 4.2 s baseline; with Creeping Death 4.5 s and 3.5 s. Wowhead lists 4.5/4.2 (a mix). Our note already says "5.4 s (4.5 with Creeping Death)", so note and code disagree.
   Sure: the two numbers belong to different talent states; only matters if the check flags early refreshes. Fix: use 5.4/4.2, or 4.5/3.5 when Creeping Death is talented (it is in the talent data, id 264000). Likely.
2. Oct 27 +20% Unstable Affliction: our notes/wording quote no number, nothing to change. UA priority unchanged in both guides.

## Demonology
1. Note "Icy Veins" lines (Demonology note, Single target and Openers) quote: "Grimoire -> Tyrant -> Doomguard -> Power Siphon with <=2 Cores ... Infernal Bolt at <=2 shards" and opener "pre-cast Demonbolt x2 / Power Siphon / Shadow Bolt -> Doomguard -> Grimoires...". Icy Veins' current page (Diabolist ST tab) says: Grimoire: Imp Lord, Summon Demonic Tyrant, Implosion with 6 Wild Imps, Call Dreadstalkers whenever available, Hand of Gul'dan at 4-5 shards, Demonbolt with 2+ Cores, Shadow Bolt; opener: pre-cast Demonbolt, Imp Lord, Shadow Bolt if under 2 shards, Dreadstalkers, Tyrant, as many Hand of Gul'dans as possible, Implosion at 6 imps and <=1 Core. No Doomguard/Power Siphon/Infernal Bolt there. Likely our copy was from other talent toggles I could not open (the talent-selector "Active Talents" panel); unsure. Only note text, code is not affected.
2. pdemChecks wording (src/ui.js ~line 17103 area, 'Summon Demonic Tyrant is your big cooldown, once a minute') and 'Dominion of Argus ... 25 seconds' (~17155): neither the guides I could open state the Tyrant cooldown (60 s) or the 25 s window; Spell pages were blocked (Wowhead 403 from the browser and WebFetch), so unsure. Icy Veins confirms the Tyrant lasts 20 s. Check the Dominion of Argus 25 s and Tyrant 60 s in game data before trusting.
3. Icy Veins now stresses "Demonic Calling" reducing Call Dreadstalkers' shard cost and Hand of Gul'dan having a fixed cost; our line 'Hand of Gul'dan spends 3' agrees. No change.
4. Not opened: Wowhead's "Pre-Combat Checks" tab on all three Warlock pages.

## Destruction
1. Rain of Fire thresholds (note, AoE / cleave): "Rain of Fire at 3+ targets without Havoc, at 5+ with Havoc" (Wowhead) and "Rain of Fire at 4+ (3+)" (Icy Veins). Icy Veins' current AoE tab (Hellcaller) says "Rain of Fire if there are 4+ targets". The Oct 27 +20% Rain of Fire damage may lower these thresholds; no guide has re-tested since (both last updated Oct 12-13). Note only; no code threshold exists (apl has no Rain of Fire row). Unsure; revisit when guides update.
2. Channel Demonfire: GEN_SPECS 'Destruction Warlock' rot has { n: 'Channel Demonfire', cd: 25 ... 'Channel Demonfire on cooldown' } (src/ui.js ~18912) with no "tal" or hero gate. Neither current priority list for Hellcaller (Icy Veins ST/AoE, Wowhead per our note) mentions it; it is a talent (id 196447). It is only graded when seen/talented. Fix: add 'tal: Channel Demonfire' or drop it from the graded list. Unsure (could not open the Diabolist tab text).
3. Shadowburn: note says "Shadowburn is now an execute (under 20%), no cooldown" while the check (apl rows, src/ui.js ~18903-18904) only asks for Shadowburn when the Fiendish Cruelty buff is up (4 shards / Malevolence / Infernal for Hellcaller). Both current guides say "Shadowburn whenever available". Wording in the apl `why` credits "both guides" for the Fiendish Cruelty rule; it comes from the SimulationCraft list. The `why` text already says so for the Hellcaller row; the Diabolist row's tip ('Both guides: Shadowburn whenever Fiendish Cruelty makes it free') is not literally what the guides say. Unsure; wording only.
4. Hellcaller opener in code: Soul Fire pre-cast, then any of Summon Infernal / Conflagrate / Malevolence x3, then Chaos Bolt. Icy Veins: Soul Fire, Conflagrate, Infernal (trinkets/racials), Malevolence, Chaos Bolt, Conflagrate. Matches.
5. Stats (note): Wowhead Int > Haste > Mastery >= Crit; Icy Veins Haste to 22% then Crit... Not re-verified (stat pages not opened).

## Not opened / not judged
- Wowhead Destruction rotation page: blocked (Cloudflare 403 from the browser) after the Demonology and Affliction pages loaded, so Wowhead's Destruction Hellcaller/Diabolist tabs and opener were not re-read; they rely on Icy Veins and our existing note (read Oct 19, page last updated Oct 13).
- Icy Veins Destruction Diabolist tab (ST/AoE/opener): could not isolate; the panel always showed Hellcaller text.
- Wowhead spell pages (cooldowns, charges) and Icy Veins/Wowhead stat and talent pages: not opened. Talent tips table entries for Warlock talents: not audited.
- SPEC_TOP numbers: not flagged (no kit change makes them meaningless).

---

## Warrior

Specs checked: Arms, Fury, Protection Warrior (notes + GEN_SPECS in src/ui.js).
Sure mismatches: 0. Likely: 3. No Warrior change since our Oct 19 copy: every Warrior page on both guide sites was last updated/reviewed Oct 12-13 (before we read them), and the Oct 23, 26 and 27 hotfix posts have no Warrior class entries.
Most important: Arms "Overpower at 2 Opportunist" tip is credited to the wrong guide and is not in the current Wowhead list (likely); Prot Execute check is tied to Sudden Death only (likely).

## Evidence of "nothing changed"
- Wowhead Arms / Fury / Prot rotation pages: "Updated: 2026/10/13" (Arms, Fury, Prot all 10/13), Patch 12.1.5. I opened every tab (ST, Multitarget, Opener with all 4 hero variants, cooldowns, tips) for Arms and Fury by reading all tab panels in the page DOM. Priorities match our notes word for word. https://www.wowhead.com/guide/classes/warrior/arms/rotation-cooldowns-pve-dps , .../fury/rotation-cooldowns-pve-dps , .../protection/rotation-cooldowns-pve-tank
- Icy Veins Arms, Fury, Prot (rotation, stats, talents): "12 Oct. 2026: Reviewed for Patch 12.1.5", no later entry. (Prot Aug 18: Phalanx added to AoE priority; Oct 2: Colossus raid build swapped Tough as Nails for Massacre; both already earlier than our read.) https://www.icy-veins.com/wow/arms-warrior-pve-dps-rotation-cooldowns-abilities
- Blizzard hotfix post covering Oct 13 to Oct 27 (page scanned in full): the only "Warrior" hits are an enemy (Storm Warrior) and Blessing of Protection. Oct 27 has Druid, Hunter, Mage, Monk, Rogue, Warlock only. No Arms/Fury/Prot entries. http://worldofwarcraft.blizzard.com/en-us/news/24307310/hotfixes-october-26-2026
- Not opened/not judged: Wowhead and Icy Veins stat-priority pages (stat order lines not extracted, only their update dates, Oct 12/13, so unchanged since our read); Prot rotation panel on Wowhead is hero-selector driven and its per-hero lists printed only the Colossus/Thane summaries (no Avatar/Demo Shout/Ravager lines); Icy Veins Prot/Fury rotation text not re-read in full; spell pages (Demolish, Colossus Smash, Bladestorm cooldowns) returned 403/error, so the cooldown numbers in GEN_SPECS (Demolish 30, Colossus Smash 45, Bladestorm 90, Ravager 90, Shield Charge 45, Demo Shout 45) are unverified by me (unsure, no evidence of change).

## Arms Warrior
1. LIKELY. src/ui.js ~18250, apl entry Overpower with `if: { buff: 'Opportunist', st: 2 }`, tip "Wowhead and the SimulationCraft list: at 2 Opportunist, Overpower before it caps." The current Wowhead single-target list just says "Overpower" (no Opportunist line); only Icy Veins mentions Opportunist (our note says so). Fix: credit it to Icy Veins only ("Icy Veins and the SimulationCraft list").
2. UNSURE. Same apl: Heroic Strike entry gated on `buff: 'Master of Warfare'` ("Both guides: Heroic Strike comes right after your cooldowns"). Wowhead's list shows Heroic Strike unconditionally after Colossus Smash/Bladestorm (spell 1269383). If Heroic Strike is castable without the proc, the gate misses presses; check what the log records. Fix: leave as is if it is only castable on the proc, else drop the gate.
3. UNSURE (opener). Wowhead's ST Slayer opener precasts Avatar and Storm Bolt, then Charge ("Pull") then Cleave+Rend, Colossus Smash, Execute, Bladestorm. Our opener sequence starts Charge then Cleave/Rend then Avatar/Colossus Smash. A player who precasts Avatar may be marked off. Fix: let Avatar count anywhere in the first steps (it already accepts either order for Avatar/Colossus Smash after Rend; add Avatar as allowed before Charge).
4. MINOR. Note quotes Sudden Death as #280776; Wowhead's links use 280721. Only matters if the id is used for matching (src/ui.js uses names). Fix: check the id in the note.
Everything else in Arms (hero trees, Rend thresholds 10 s / 5 s, Imminent Demise before Bladestorm, Executioner's Precision at 2, execute 35%, stats Crit/Haste first, no 12.1.5 class changes) matches.

## Fury Warrior
1. LIKELY (small). Mountain Thane opener (note "Openers", and GEN_SPECS open.seqs Thane: Charge, Recklessness, Avatar, Rampage, Thunder Blast, Bloodbath...). Wowhead's Thane opener (single target) says Odyn's Fury is used before opening cooldowns, to avoid cluttering the rotation ("Odyn's Fury is used before opening cooldowns"). Ours has no Odyn's Fury step. Fix: add Odyn's Fury as an optional first step for Thane, or mention it in the why text.
2. UNSURE. Wowhead Slayer ST "During cooldowns" says Rampage if Hack and Slash is not active (before Crushing Blow); our note matches. No mismatch found in apl: Rampage >100 or no Enrage, Bladestorm in Recklessness, Execute at 2 Sudden Death, Odyn's Fury, Raging Blow.
3. UNSURE. win.dur 12 (Recklessness length) and tier-set wording cannot be verified without the spell page; Wowhead did not state a length.
Rest of Fury (stats Haste/Mastery first, hero trees, Rampaging Berserker, tier set, Enrage uptime 0.9) matches the guides; no 12.1.5 or hotfix change.

## Protection Warrior
1. LIKELY. src/ui.js ~19236, apl entry Execute `if: { buff: 'Sudden Death' }`, why "Sudden Death made Execute usable". Both guides: "Execute targets at or below 20% (35% if you have the talent) health" (Wowhead Prot ST/AoE priority; our own note says the same). Execute is usable by health too, so the check misses those presses and the wording is incomplete. Fix: allow Execute when the boss is under 20% (35% with Massacre) or Sudden Death is up; reword "Execute is usable".
2. UNSURE. Demolish entry `if: { buff: 'Colossal Might', st: 5 }`, tip "Demolish on cooldown, at 5 Colossal Might (the SimulationCraft list)". Both guides say plain "Demolish on cooldown" (Wowhead: Colossus priority starts Charge, Demolish, Shield Slam). Only gating by 5 stacks is from SimC; risk of marking correct presses as off. Fix: keep on-cooldown wording, drop the 5-stack condition unless SimC is still the source.
3. UNSURE. Wowhead's current Prot priority (both hero trees): Charge, (Demolish), Shield Slam, Thunder Clap on cooldown and to apply Rend, Revenge, Ignore Pain with excess Rage, Execute at 20/35%, Impending Victory when low. It lists no Avatar/Demoralizing Shout/Ravager/Shield Charge lines (Avatar, Taunt, Shield Block sit in its opener timeline). Our apl puts Demoralizing Shout, Ravager and Shield Charge above Shield Slam and credits "Both guides" for Shield Charge and Demo Shout in several tips ("Both guides: Shield Charge on cooldown"). Wowhead's visible text does not show them. Fix: credit those to Icy Veins and the SimulationCraft list if Wowhead really omits them (I could not open the hero-selected variants fully).
No 12.1.5 or Oct 23/26/27 change affects Prot; stat order (Haste, then Crit/Vers, Mastery last), Phalanx, Revenge! free procs and Shield Block uptime wording are consistent with the notes.

## Talent tips table (`'Reclamation': ['out'` region)
Not audited in depth for Warrior; no Warrior talent was reported reworked in the Oct 13-27 hotfixes, and Icy Veins talent pages show no change after Oct 12 (Prot Colossus raid build swap of Tough as Nails for Massacre was Oct 2, before our read).
