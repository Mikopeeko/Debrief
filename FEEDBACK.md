# Feedback notes

Running list of feedback on Adequate Audits. Newest round at the top; items are checked off when done.

## Next up (your order)
- [x] **High priority: set up GitHub before anything else** (round 102: private repo Mikopeeko/Debrief, a checkpoint pushed after every round).
- [x] Entombed Sentinels module (round 95).
- [x] Sszorak module (round 99).
- [x] Then the next fight modules: Nek'zali the Soulcoiler, Vashnik the Malignant, The Lost Explorers (round 108). Every raid boss has a module now.
- [ ] **Simplify Deaths in the Mechanics tab** a little (your note, round 108).
- [x] **Rework the raid cooldowns timeline** in the Mechanics tab, fully (round 110).
- [x] **Ula'tek: a damage graph on the Venomous Heart** (round 113).
- [x] **Damage windows, clearer** and **Big cooldowns, simpler**: mockup shown; you'd rather keep the Performance tab as it is now.
- [x] **Polish Twin Fangs, The Coiled Altar and Ula'tek** on Mythic and Heroic (round 116).
- [ ] **Teams**: remove a team, and a dropdown for more than one (your note). Design in the morning review.
- [ ] **Remove the Healers view?** (asked; waiting on your yes or no).
- [ ] **Big review of the whole app** for launch: organization, design, readability, with mockups (your note). In progress.
- [ ] **Performance: the same bar charts everywhere** (your note). Done so far: Utility, Damage done, Damage windows. Left: Targets, Heatmap.
- [ ] **Character page** (your question): a player's own page from their Warcraft Logs character link. Full answer still owed.
- [ ] The desktop app (.exe) with auto-update (plan in notes/Desktop app plan.md).
- [ ] Open (your call): a few thresholds in the Sentinels, Sszorak, Nek'zali, Vashnik and Lost Explorers modules are mine, not from a guide (listed in each boss's notes file). Say if your raid uses different ones.
- [x] Noticed: guides list Nymrissa Wavecaller and Kith'ix in The Venomous Abyss, but the app only knew 8 bosses (round 103).
- [ ] Check (from your question): older modules where a threshold came from what one of your kills looked like (Twin Fangs back-to-back soaks not flagged, the Barbed Bulwark 6 s). Re-check those against the guides.

## 2026-10-17, round 116: boss review (Twin Fangs, Coiled Altar, Ula'tek), the website in Chrome
Checked on your team's logs (Twin Fangs Mythic Oct 14, 30 pulls; Coiled Altar Mythic Oct 15, 32 pulls; Heroic Sep 2: Twin Fangs kill,
Coiled Altar wipe and kill, 11 Ula'tek pulls) and, for game facts only, a top Coiled Altar Mythic kill and the Ula'tek test logs. No
errors anywhere, every phase found. Fixed:
- [x] **The website in Chrome** (your note: "Failed to fetch" for team and Warcraft Logs pulls, fine in Edge): ad blockers block web
  addresses ending in "/api/events", which is where the site downloaded each pull. It now downloads from "/api/fightlog". Retries
  also skip the browser's saved copy, and the error says what went wrong (and to allow the site in an ad blocker).
- [x] **Memory**: every Warcraft Logs pull you opened stayed in memory for the whole visit (100+ MB for a long Mythic pull), so
  browsing a few dozen pulls crashed the tab. A pull is let go once it's saved on the PC.
- [x] **Twin Fangs, Coiling Ichor**: ~18 small mistakes a pull (634 on 30 pulls; 50 on your kill). A hit is 50 to 75K and adds no
  Eternal Venom (checked on your kill), and two circles overlapping counted each tick twice. Now a tick counts once, and only a
  stand-in of 5+ ticks is a (minor) mistake: 69 on 30 pulls.
- [x] **Twin Fangs, globule soaks**: an extra globule at low venom isn't flagged (sets had more globules than soakers: 15 for 13 on
  your kill). One taken at the stack budget or above still is.
- [x] **Twin Fangs, Twin balance**: shown, not judged. The Mythic plan in the guides kills one Fang first on purpose, and your kill
  had them die 21s apart with 8 Uncoiled Wrath stacks, so it read red on a kill.
- [x] **Twin Fangs, Avoidable damage**: drawn as bars like every other boss (Stir the Depths water, Sanguine Storm).
- [x] **Coiled Altar on Heroic**: the orbs were judged against the Mythic plan (5 to 6 per frontal, purples) though Heroic has no
  purples; the Heroic plan is to clear every orb, so the count is shown, not judged. A Fragment reaching Zul'jan heals 3% on Heroic
  (10% on Mythic): amber, not red, and a row says so when nobody blocked.
- Covered already, checked: Twin Fangs' Broodling kicks (Visceral Burst, by side); Ula'tek's egg failures (Putrid Membrane is the
  hatch's raid damage); Toxic Fumes and Necrotic Vapors are constant raid damage (nothing to judge).

## 2026-10-17, round 115: Deaths and Avoidable damage made simple, Coiled Altar fixes
- [x] **Deaths, rebuilt** (your note: overkill, simpler but clear). One line per death: when, who, what killed them, and the one
  thing that would have helped (a mistake, or a defensive that was ready). Deaths from the same hit are one line ("Schooty and
  14 more"). Opening a line shows the last 5 seconds in a sentence, the three biggest hits as bars, and Map / Every event. The
  health chart and the long hit table are gone.
- [x] **Avoidable damage as bars** (your note), on every boss: each source on the left, a bar per player for how often they got
  hit (red or amber past the limits), with the damage, "died to it" and "tank, not judged" by the name.
- [x] **Heatmap removed** from the Performance tab (your note).
- [x] The **Deaths heading** always shows a skull now (it borrowed whatever spell a log called "Death").
- [x] **Coiled Altar, Guillotine soaks**: a drop whose cast never finished (on a top Mythic kill, Zul'jan started one right as P2
  began) showed "0 in the circle, needs 5". It now reads "didn't land" and isn't judged. A drop whose cast finished still counts
  with nobody hit, so a circle of immunities is still checked (your note).
- [x] **Coiled Altar, the push into the intermission**: amber only when the next Dreadmarch went out before the push (it was amber
  for any push more than 5 seconds after the last Soul Sever).
- [x] Checked all 32 of your Mythic pulls from Oct 15 and a top guild's Mythic kill (game facts only): no errors, every phase found.

## 2026-10-17, round 114: Big cooldowns, damage tiles, spec icons
- [x] **Big cooldowns** (your note: just whether they're maximizing usage): each line is now "used 5 of 6". No list of times, no
  Bloodlust tag; a time shows only when it sat ready a long stretch (a minute, or half its cooldown for the long ones), e.g.
  "sat ready 176s from 0:00".
- [x] **Damage tiles** (your note): kept Lost to deaths. "On the boss" is gone (the Boss / All targets / On adds switch shows it) and
  so is Active time. New tile: **Big cooldowns**, the DPS's uses out of their possible uses, naming anyone under 80%.
- [x] **Spec icons everywhere** (your note): every player badge and map marker shows their spec's icon, not their class's. The new
  Devourer Demon Hunter has no spec icon on Wowhead yet, so it shows Void Metamorphosis.
- [x] Beast Mastery Hunters: Bestial Wrath now counts as a big cooldown (it was missing, so they showed none).
- [x] **Healing tiles** (your note): Lost to deaths (what the healers would have healed while dead) and Big cooldowns for healers.

## 2026-10-17, round 113: Ula'tek's heart in the damage amps
- [x] **Damage amps: Rage of the Shackled** (Mechanics, every difficulty): each amp now opens to a bar per player for their damage
  into the Venomous Heart (and per second). The faded end of a bar is damage that went into Ula'tek or her tail instead, which the
  amp doesn't double. On top: the boss's health before and after (your note: what % each amp finished at), the damage into the
  heart, per second, and how much of the raid's damage went into the heart.
- [x] The boss's health now reads from Warcraft Logs reports too (it only worked on your own combat log before). Checked on a Mythic
  kill: 80% → 65%, 64% → 44%, and she died in the third, matching the guide's pace of 67% and 45%. Heroic: 70% → 47%, 45% → 26%.

## 2026-10-17, round 112: Performance tab, cleaner bars
- [x] **Damage done: Boss / All targets / On adds** (your note). Boss is damage on the boss only (shown when some went elsewhere);
  On adds is damage into the adds that have to die, with each add and who hit it most on the right. The chart above follows the switch.
- [x] **Tidier columns** (your note): every bar list now has its column names over it (DPS, Share, Parse; HPS, Overheal; Casts,
  Share), the small column is narrower, and the parse is centred in its own column. The small column always means one thing now; a
  player who died shows their rate while alive when you hover the ✕.
- [x] **Damage windows, reworked** (your note: "not clear what this is telling the viewer"). Pick a window (Bloodlust, or the fight's
  own: Rage of the Shackled, a Nightfall shield, the intermission). Each player's bar is their damage per second in it; the white tick
  is their usual over the pull, so a bar past its tick means they pushed, and ×2.4 says by how much. ▲ cooldowns and potions sit by
  the name. On the right: the raid in that window (damage, how many pressed a cooldown, how many drank a potion, who had neither, who
  was below their usual) and every window side by side.
- [x] **Damage by phase removed** (your note: the phase buttons at the top already do it).
- [x] **Boss picker easier to find** (your note): a log with several bosses shows a gold "7 bosses" badge on the picker.

## 2026-10-17, round 111: Nek'zali's NSRT note
- [x] **Well groups** (Assignments tab): your note's two Soulcoil Well groups take turns going into the well for each Drowned Echo, in
  the order of the note's "Group 1 / Group 2 go in" reminders. Who was in the well comes from Immortal Coil, which only hits players
  inside. Amber: someone from the other group in the well, or 3+ of the group whose turn it is missing (one or two out is fine).
  On the Sep 23 kill: no mistakes, the groups alternated exactly as the note says.
- [x] **Pyre soak**: the soak list goes into every Hungering Pyre, and the don't-soak list stays out (their Slithering Flame burns
  corpses). Amber: someone from the don't-soak list in it, or 3+ of the soak list missing, not counting anyone dead or in the well.
  On the Sep 23 kill, 3 of the 4 Pyres were short-handed.
- [x] The build now checks every script for a syntax error before writing anything, so a broken build can't reach your open tab or
  the website again (one slipped through for a minute tonight).

## 2026-10-17, round 110: Raid cooldowns, reworked
- [x] The old one-row-per-player timeline is replaced by one **Raid cooldowns** panel (Mechanics tab, Survival group, and the Healing view):
  - the raid's damage over the pull, with each **big hit** pinned and numbered: green covered, amber nothing used but something was
    ready, red not covered and players died, grey nothing was ready;
  - the raid cooldowns underneath on the same time line, each bar as long as it lasted, packed into a few lanes, with Bloodlust on top;
  - a list: each big hit, the spell that did most of it, the raid damage in 3 s, and which cooldowns covered it. If none did, it
    says what was ready ("Ready: Rallying Cry (Vandagos), Rewind (Urgdragon)") and who died. Click a hit to find it on the chart.
- The big hits are the 3-second stretches with the most raid damage (at least 10 s apart, well above the pull's usual), up to the
  wipe filter, so it works on every boss.
- "Ready" counts a raid cooldown its player used this pull, or a healer's own spec cooldown, off cooldown by its base cooldown.
  Talents can shorten some, so it errs toward leaving one out.
- [x] Checked on a Nek'zali pull (7 of 10 covered) and a Vashnik kill (5 of 10), on desktop and phone width.
- [x] Also checked: the Vashnik and Lost Explorers modules run on Heroic kills too (Mythic-only parts are hidden there).

## 2026-10-17, round 109: "Failed to fetch" on the website
- [x] Your report: on another browser, opening a pull on the website said "Couldn't analyze this pull: Failed to fetch". A browser
  with nothing saved downloads many parts of a pull at once, and the website was unpacking each one in memory until it ran out and
  dropped the connections.
- [x] The website now passes those downloads (events, deaths) straight through without unpacking them. Eight pulls at once all came
  through fine, and a pull the site had never seen opened in a fresh tab.
- [x] The website's downloads now retry by themselves, up to 3 times, like your PC's version already did.
- [x] If a pull still can't load, there's a **Try again** button instead of a dead end.

## 2026-10-17, round 108: the last three boss modules, and the survival kit merged
- [x] **Nek'zali the Soulcoiler**, by phase (P1, the intermission, P2):
  - Restless Amani: each set, shields broken, killed or reached the well, with a map;
  - Soulcoil Ignition: Ritual Burn going in, circle hits;
  - Grasping Depths (Mythic): the well team, every Soulcoiler's Curse and who kicked it, Swirling Spirits, Soul Exhaustion;
  - Essence Rend: who dispelled it, and how far from the well each puddle landed;
  - Possession Barrage: how far the tank stood;
  - the intermission: corpses back at once, Hungering Pyre soakers, Soul Transfer, the Echoes;
  - Invoke (Mythic): who was still casting;
  - an energy list (what fed her, and the enrage).
- [x] **Vashnik the Malignant**, grouped by mechanic:
  - Imbibe: fountains, the raid hit, deaths;
  - the venoms: fire adds killed one at a time, adds over a minute, a venom reaching the middle;
  - Malignant Totems (Mythic): cleared by the waves before the next Imbibe;
  - Plague Froth: who a wave hit and whose line it was, with the four lines drawn on the map;
  - Catalytic Bile soaks; Exploding Infection dispels together; Stygian Burst hits; the Dripping Fangs swap.
- [x] **The Lost Explorers**, by turn (the pull, then Gebbo's, Iku's and Nama's turn as Mor'zahi takes each over):
  - boxes popped or ruptured, with the raid's Splinters stacks at each pop;
  - United Defense; Final Ascension against the fish;
  - Frostfire Volley clears; Blink Nova; Mighty Thud leaps and soakers;
  - the bomb's Blast Wave; tank stacks.
- [x] Every spell ID was read from your team's Mythic kills and wipes, and each module was checked on a kill and a wipe. The wipes read
  the way they went:
  - Nek'zali: 5 corpses back at once killed 11 players.
  - Vashnik: the soft enrage, two Imbibes 20 s apart.
  - Lost Explorers: a late fish, then a box rupture that killed 12 players.
- [x] Fixed for every boss: Warcraft Logs reuses an add's number once it dies, so different adds were merged into one. Now each one is
  tracked on its own (it fixed Nek'zali's Amani sets, and Sszorak and Ula'tek still read the same).
- [x] Old rules fixed: Nek'zali's Slithering Flame (everyone outside the soak gets it by design) is no longer a mistake; two wrong spell
  IDs were corrected.
- [x] **Survival kit merged with Potions and Healthstones**: one table. Each player's Healthstones and health potions show their times
  under the count, and combat potions show the pre-pot and each use. The separate table is gone.
- Notes for each boss (sources, what the logs showed, my thresholds): notes/Nekzali research.md, Vashnik research.md and
  Lost Explorers research.md.

## 2026-10-17, round 107: live logging leads the website
- [x] The website's start page leads with **Live logging**: one big box for your raid's Warcraft Logs live log ("Go live"). Each pull shows up about a minute after it ends. "How to live log" opens three short steps (the uploader's Live Log, copy its link, paste it).
- [x] Under it, the second box: **Looking at a finished night?** Paste any report link, or open a combat log from this PC.
- [x] A live log opened before the raid's first boss pull now shows "Live: waiting for the first pull" and keeps checking, instead of "That report has no boss pulls". The first pull opens by itself.
- How it works: the Warcraft Logs uploader watches the logger's combat log and sends each pull to Warcraft Logs; Debrief asks Warcraft Logs every 30 seconds for anything new.
- [x] Checked on the live site: desktop and phone width, How to live log, Go live on a report (live on, opens Latest pull), and the waiting screen.

## 2026-10-17, round 106: auto-live, a simpler website start page, a new slogan
- [x] **Auto-live**: open any Warcraft Logs report that's still being logged (its last event under 10 minutes old), and Debrief turns live on by itself. "This report is still being logged…" pops up, and new pulls appear as they end. It works on the website and on your PC.
- [x] Following a report live turns itself off after 45 minutes with no change ("Live is off… turn it back on at the top"), so a tab left open overnight doesn't keep asking.
- [x] **The website's start page is simpler**: one big box for any Warcraft Logs link (a pasted link opens at once), a line for live raids, and "open a combat log from this PC". Under it, **What you get** shows the four views as cards over one example preview, which moves on to the next view every 7 seconds until you click one. On a phone the cards are a 2 by 2 grid.
- [x] The website no longer offers to follow the log file live (Chrome blocks it for most people); opening a finished log still works.
- [x] New slogan on both start pages: **Every pull, explained.**
- [x] Checked on the live site: desktop and phone width, the preview moving on, an old report opening without live, a report made to look fresh turning live on, and live turning itself off after 45 minutes.

## 2026-10-17, round 105: the website's start page and the live log
- [x] Your report: on the website, following the live log gave Chrome's "can't open files in this folder because it contains system files". That's Chrome's own rule: no website may open files inside Program Files, where WoW is installed. It can't be fixed from a website (on your PC, start.bat's helper reads the log instead, so it works there).
- [x] The website's start page now leads with what works there: a Warcraft Logs report link, then a Warcraft Logs live log for raid night, then opening a finished log from the PC (a plain file pick isn't blocked). Following the log file sits under "Follow your combat log file live", with why it may not work; cancelling Chrome's message says the same.
- [x] A live Warcraft Logs report is now re-checked every 20 seconds on the website (it was kept 2 minutes), so new pulls show up about a minute after they end.
- [x] Checked on the live site, desktop and phone width.
- The real fix for following the log file live is the desktop app (it reads the file itself).

## 2026-10-17, round 104: the website is live
- [x] **https://debrief.james-m-nemecek.workers.dev**: anyone pastes a Warcraft Logs link and it works, with no key of their own. Your website key sits in Cloudflare's locked box.
- [x] The site now also does **team import** and the deaths list (they only worked on your PC before), and it has a fair-use guard so one person can't use up the allowance.
- [x] Checked on the live site: your Oct 1 report, the Sszorak kill's banner and Mechanics tab (the same results as on your PC), and the Wolfthorn team lookup.
- [x] It's ready for the desktop app: it answers requests from outside the website too.
- Note: NSRT notes and saved pulls are kept per site, so on the website you'd paste your notes once more.
- [ ] **For you:** on the Warcraft Logs clients page, delete the old clients you don't use: the first "Debrief Website" and the one whose secret was posted in the chat.

## 2026-10-16, round 103: Nymrissa Wavecaller and Kith'ix
- [x] **What they are:** neither is in The Venomous Abyss in game.
  - Nymrissa is the boss of the Tidebound Grotto lair (12.1). She's the season's only Flex Mythic boss outside the raid and counts for the Vault's raid row.
  - Kith'ix is a one-boss raid, The Unbinding of Kith'ix, live since 12.1.5 (Oct 13).
  - Warcraft Logs ranks both in its Venomous Abyss zone (10 bosses), and Mythic Trap lists them there too.
- [x] **Now full bosses in the app,** in season order (Nymrissa first, Kith'ix last):
  - The pull banner names their own instance ("Pull 4 · Mythic · The Tidebound Grotto") and uses Wowhead's guide header as art. Kith'ix's header shows his arena, not him.
  - Progress counts 10 bosses.
  - Mistakes, with spell IDs from your pulls. Nymrissa: Pulsing Tides (a murloc reached the bubble), Swirling Whirlpools, Wild Bite (sharks in the water), Shatter (an orb left unsoaked) and her enrage. Kith'ix: Twisted Appendage, Suffocation (left Liadrin's Bulwark) and Nullshards.
  - Left out on purpose: Lingering Frost (on the kill only orb soakers took it), Venom Roar and Dark Devastation (they hit the tanks by design) and Commanding Presence (it lands on adds as they spawn).
- [x] **Import new nights** reads every report once more, to pick up their pulls from nights you'd already imported. Pulls already saved are skipped.
- Correction: Nymrissa's Mythic pulls and kill are in the Sep 16 report, not Oct 1 (that one is all Sszorak). Kith'ix has one Heroic kill, on Oct 14.
- [ ] Your call: count them on Progress (as now, the way Warcraft Logs does), or keep it to the raid's 8.

## 2026-10-16, round 102: GitHub
- [x] Git installed (Git for Windows 2.55), the folder is a git project, and checkpoint 1 is on GitHub: the private repo Mikopeeko/Debrief, branch `main`.
- [x] You signed in once in the browser; Windows remembers it, so every round from now on ends with a checkpoint pushed, with no sign-in.
- [x] Left off GitHub (`.gitignore`): the installers in `files\`, the `backups\` folder and `*.raid-backup.*` copies (git history replaces them; they stay on your PC), and local tool settings. Your Warcraft Logs login was never in the folder.

## 2026-10-16, round 101: Progress cards
- [x] Each boss card's background is now that boss's banner art (the same as the pull banner), across the top and fading down into the card. Nothing else on the card changed. Bosses without banner art keep the model render. Checked on desktop and phone.
- [x] Merging reports: kept separate, your call (one report per night keeps pull numbers and the wipe filter clean; Progress already spans nights).

## 2026-10-16, round 100: Mutilate groups, from your answer
- [x] **Missing soakers aren't flagged one by one** any more: the groups list people who don't always soak (Huservoker soaks only when asked), and one or two out is fine.
  - Amber now: someone from the other group in a Mutilate (they'll have Mutilated Gash for their own), or a Mutilate with 3 or more of its group missing.
  - Who wasn't in their group's Mutilates is still listed under the table, not judged.
- [x] **On the kill:** nothing flagged.
- [x] **Answered:** on Oct 1 pulls 1 to 19, Flëxørçïst soaked the Right group's Mutilate every set as well as the Left's. That was you in the wrong group: a real catch, so the check stays as it is.

## 2026-10-16, round 99: Sszorak module, your NSRT note, and Potions and Healthstones
- [x] **Sszorak module** (strategy from the Mythic and Heroic guides; IDs and timings from your 73 Mythic pulls), grouped the way the fight loops:
  - **Tank combo:** Ravage (a second one with the debuff up, or anyone else in the cone), Mutilate (fewer than 5, or a soak with Mutilated Gash still on), Tempest (touches; a pass through a tornado counts once).
  - **Venomous Surge:** each cyst, who dropped it, where, and what it was used for (wind 1, 2, 3, the spare, popped early, or not at all), with who popped it.
  - **Raging Crosswinds:** who collided with whom, who drifted, immunities, players a flier hit.
  - **Serpent's Fury (Mythic):** each pop's rage, timing after the tank combo and soakers. An enrage says which side of the window it missed (e.g. "2.5 s before the tank combo ended; the pop before the intermission was too early"). Plus Virulence clips, and who died with it and set it off early.
  - **Intermission:** each wind's cyst, who it coated, and deaths in each wind.
- [x] **Boss rage** now comes through from Warcraft Logs (the translator wrote zeros for NPC power before).
- [x] **Cysts on the maps:** goo blobs with their number and what they were for; on the wind maps they burst when popped.
- [x] **Crosswinds arrows:** each direction is its own debuff (the tooltips are identical). Measured from drifting players, the four point roughly north, south, east and west. The map draws them and the rows say "arrow north".
- [x] **Your NSRT note:**
  - **Mutilate groups,** per player. On the kill Huservoker (Left) soaked none of the 6: intended, or a note to update?
  - **The Fury timer:** the kill was within 0.7 s of every reminder. On wipes, every pre-intermission pop 2.5 to 3.8 s early ended in an enrage after it.
  - **Cyst poppers:** shown next to who actually popped each cyst, not judged.
  - All three feed the Summary's Assignments card.
- [x] **Potions and Healthstones,** redone:
  - one row per player, problems first;
  - combat potions against what they could have used (a pre-pot counts), each use as a time;
  - Healthstone and health potion uses;
  - red for a death with one unused;
  - a short summary on top.
  - It uses the survival kit's own counts, so the two agree.
- [x] **Group headings on Mechanics** now say "! N could be better" when a group only has amber rows (they said "clean" before; every boss).

## 2026-10-16, round 98: the boss banner, redone
- [x] **Art:** each boss's Wowhead guide header (the boss over the raid's backdrop), loaded at runtime, never bundled. All 8 bosses have one. It fills the right side, sized so the whole boss shows, and fades into the panel. A boss without one (another raid) or a picture that doesn't load gets the old emblem or model.
- [x] **Text, top to bottom:**
  - a small line with the pull, difficulty and raid;
  - the boss's name, large;
  - the result as a pill beside the phase bar and how it compares;
  - then time, length, players and deaths, each with an icon.
  - A kill now says "Down after 9 wipes tonight" instead of "Boss down" (the pill already says Kill).
- [x] **Colours match the boss progression colours:** the left edge, tint, pill and bar follow the pull cards and the Progress chart (grey, white, green, blue, purple, orange for a kill).
- [x] **All pulls:** the same banner, with "Killed on pull 10" or the best pull, the pulls and time on the boss, and the night number.
- [x] **Phone:** the art sits behind the text, darker, and nothing scrolls sideways.
- Picked over the wiki's in-game shots. Note: these headers are Wowhead's own artwork, and every boss shares the same backdrop.

## 2026-10-16, round 97: Sentinels polish and debug, NSRT note checked
- [x] **Checked:** all 30 Mythic wipes and the kill run with no errors or empty sections. The NSRT note reads right: the Blood and Breath lists, its reminders not counted as cooldowns, names not in the pull listed apart.
- [x] **Blood pools** (floor maps only) no longer reads as "clean":
  - a grey "floor maps, not judged" on its tile, its row and in the Summary;
  - left out of "What went right" on Latest pull and Summary.
- [x] **Living Venom counted once:** it was amber in Toxic Droplets *and* in Avoidable damage. Droplets now only shows the hits; Avoidable damage judges them (Droplets went from 34 "could be better" to 17 on the kill).
- [x] **Checked, kept:** "two droplets at once" (17 on the kill) is real. Each set has 20 hits for 20 droplets, and the flagged pairs land at the same moment.
- [x] **Sides (the note's Blood/Breath split):**
  - now counts on the Summary's Assignments card, judged per player, not per cycle;
  - 4 players swapped all night grade 88, not 50;
  - the Latest pull tile says "4 could be better" instead of "all followed".
  - On the kill, Shockabunga and Larryg played Breath, Badbunny and Earthday played Blood, every cycle. If that's the plan now, update the note.
- [x] **Summary groups:** it uses the same Poison side / Blood side / Intermission / Misc groups as Mechanics (it was all under "Whole fight").
- [x] **Wording:**
  - "40 pairings" (was "pairs and players");
  - "157 soakers" (was "157 players");
  - every Sentinels "How it works" now says what's amber and what's red.
- [ ] Noticed, not this fight: the Twin Fangs note checks (Feast groups, kick order, globule CC) don't feed the Summary's Assignments card either.

## 2026-10-16, round 96: Sentinels maps and layout, from your notes
- [x] **Mechanics grouped by boss, not by cycle:**
  - Poison side (Breath of Ula'tek), Blood side (Blood of Ula'tek), Intermission;
  - Misc: Shifting Protovenom (cast by Vashnik, in the room on Mythic), the Marks, boss balance, tanks;
  - Deaths and avoidable damage last.
  - Each section appears once and keeps every cycle's sets inside it.
- [x] **Helical Toxins stacks shown:**
  - each player's count (their green orbs) is by their name on the map and in the rows;
  - the log doesn't record it; it's read from the debuff's damage, about 15k a stack every 2 seconds, and a solved pair has to add up to 4;
  - on the kill, every pair adds up to 4; only pairs that solved it before the first tick have no count.
  - On the map the number follows their stacks: the starting count, the new total after a wrong bump, then 4 once solved.
- [x] **Helical Toxins map:**
  - a white ring until a player solves it, a green check only from the moment they do;
  - a green line joins a pair as they solve it, an amber line marks a wrong bump, and a red X marks Cultivated Burst;
  - it now runs the debuff's full 28 seconds, even when the bosses' stasis ends sooner.
- [x] **Droplet and Miasma maps:** a check only once the player has stepped on a droplet, or once the soak lands.
- [x] **Shifting Protovenom circle:** 6 yd. First drawn at 3, then 10, before settling on 6 with you.
  - The logs: clears and eruptions fire with the players about 6 yd apart.
  - It does nothing for the first ~1.5 s.
- [x] **Every map:** smaller player highlights. The white ring and the check and X rings are thinner and closer to the icon, and highlighted icons are a little smaller.

## 2026-10-16, round 95: Entombed Sentinels module
- [x] **New Mythic module.** Sources:
  - strategy from the video guide's transcript, Method's Mythic and Heroic guides and Mythic Trap;
  - spell IDs, timings and sizes from Wolfthorn's pulls on Warcraft Logs and Wowhead's spell data.
  - Research notes: `notes/Entombed Sentinels research.md`.
- [x] **Phases:** one per cycle, each ending with its intermission (Vitriolic Stasis).
- [x] **Sections:**
  - **Helical Toxins** (each intermission): who paired with whom and how fast, wrong bumps (the stacks change to the sum) and anyone who took Cultivated Burst. The starting orb count isn't in the log, so it can't say who had a 1, 2 or 3.
  - **Shifting Protovenom:** each circle, who cleared it with whom, how long it took, pulses taken, and eruptions, including players without a circle caught in one.
  - **Unstable Miasma:** soakers per soak (8 or more on Mythic), the marked player and deaths.
  - **Toxic Droplets:** per set, who stepped on how many, two at once, immunity pickups, droplets that erupted, and hits from the venom flying back. The set before each intermission is labelled.
  - **Venom Coagulation:** each add's time to kill and its damage on the raid. The one before each intermission has to be dead before it; adds after the last intermission aren't judged (the enrage is close).
  - **Blighted Blood:** how long each stayed on and who dispelled it.
  - **Blood pools:** a floor map per cycle with every pool so far (not judged).
  - **Marks:** each player's side per cycle, and anyone in range of both bosses.
  - **Boss balance:** health going into each intermission and how much was healed back; the bosses within 40 yards.
  - **Tanks:** who tanked which boss each cycle, and the swap at every intermission.
  - **Avoidable damage.**
- [x] **Maps with the mechanic drawn on them:**
  - the Protovenom circles (about 6 yd, measured from when circles clear and erupt, since the size isn't published; first drawn at 3 yd, too small), green flashes as pairs clear and the 10 yd eruption blast;
  - the 7.5 yd Miasma soak on the marked player;
  - droplet pickups (blue for an immunity) and venom hits;
  - Helical Toxins solves, wrong bumps and failures.
- [x] **Assignments, from your Mythic note:** a Sides check reads the Blood / Breath split; each group is on its boss in cycle 1 and on the other after every intermission. On the Sep 16 kill, Shockabunga and Larryg (listed Blood) and Badbunny and Earthday (listed Breath) played the other side all pull. If the split changed, update the note.
- [x] **Fixed in the old rule pack:**
  - its Blood Venom rule matched the Miasma soakers' own damage over time by name, so every soaker was blamed for avoidable damage; it now only counts the pool;
  - the Living Venom spell ID it used never appeared in the log.
- Checked against the raw events on the kill and two wipes:
  - every Helical Toxins pair matches;
  - pull 5's wrong bump (two players to 3) and its 4 failures are caught, including one whose Cultivated Burst hit was fully absorbed;
  - the Protovenom pairs match.

## 2026-10-16, round 94: Deaths rebuilt, Tainted Blood healing

## 2026-10-16, round 94: Deaths rebuilt, Tainted Blood healing
- [x] **Deaths (Mechanics tab)** now looks like the other sections: the deaths in order on the left, the picked one on the right.
  - The list: who, when, which death it was (1st, 2nd…) and what did it. A death from the same hit, within 2 s of the one before, says "same …". Under the list: how many more deaths came after the wipe filter, and what killed people.
  - **What did it:** the biggest hit of their last 4 seconds when it was well over the one that finished them. Pull 15: "Caustic Globule hit them for 447k 0.6 s before, then Toxic Fumes (59k) finished them", where before it only said Toxic Fumes.
  - **Linked chips:** their own mistakes in the last 10 seconds, and the raid's at that moment (a globule exploding, a late barrier break); a chip opens that mechanic's section. Then what was still ready, and damage taken against healing received in the last 5 seconds.
  - **Ready only counts against them when there was time to press it:** from over 50% to dead in 2 seconds or less says "too fast to use" and isn't amber.
  - **Health, last 10 seconds:** a line, with each hit as a bar and the two that matter labelled. It's drawn at the width it gets, so it reads the same on desktop and phone.
  - **Biggest hits:** big single hits and the finishing one on their own lines (when, how much, health after); the rest added up per spell.
  - What would have helped, Map, and "Every event" for the full last 10 seconds.
- [x] **Tainted Blood founts:** a new column, "Heal absorbs cleared": how much of the Tainted Blood heal absorbs each healer cleared in each Feast, with everyone else's own healing and leech added up apart. The whole pull's totals per healer are under the table.
  - Read from the heals eaten by the absorb, which the app didn't read at all before (from your log or from Warcraft Logs).
  - Checked on the Oct 14 kill against the raw Warcraft Logs sums: Huservoker 10.2M, Optt 9.8M, Flëxørçïst 9.3M, Ashdknight 8.4M, everyone else 7.0M.

## 2026-10-16, round 93: Twin Fangs interrupts by side
- [x] Every Broodling of Ithraz in the Interrupts section says which side it was on: left or right as the raid faces the twins at the pull (Vexhul starts on the left on every pull checked).
  - Each kick row reads "add #3, left".
  - Each set says how its adds split, for example "10 adds (5 left, 5 right)" or "(all on the right)", and which side any casts that got off were on.
  - The section line adds each side's totals.
  - Side comes from where the add stood at its first cast. An add with no position logged is counted as "unknown".
- [x] A pull with only one set of Broodlings now shows them as one set, not ten single-add groups.
- Checked on the kill (sets 1–2: 5 and 5; sets 3–4 all left; set 5 all right), pull 15 (the 3 casts that got off in set 4 were all on the right) and pull 1.

## 2026-10-16, round 92: design polish, Barbed Bulwark, raids only
- [x] **Progress page:**
  - the totals are four small tiles;
  - the chart shades the ground covered so far in the card's colour, and a kill is an orange dot with a ring;
  - one legend line for the dot colours;
  - bosses not pulled yet on that difficulty are a small row of chips instead of empty cards;
  - Nek'zali has his full-colour art (the old one was a pale render), and small renders are zoomed to fill the card.
  - On a phone the chart text and dots are drawn bigger, and the difficulty switch is one row.
- [x] **Fixed (phone):** Latest pull and Mechanics could be wider than a phone screen. A long one-line row or a long grey note pushed the page to 1,053 px wide; they now wrap or cut off. Every tab was checked at phone width on two bosses with every section open.
- [x] **Mechanics:** the tiles at the top come out in even rows (10 tiles: two rows of 5, not 6 and 4).
- [x] **Summary:**
  - "How far the night got" was stretched sideways on a wide screen, so its numbers and dots were squashed into ovals. It's now drawn at the width it gets, and again when the window changes size.
  - Its dots use the same pull colours as the pull strip and the Progress page, with an orange kill.
  - The nights table bars use the same colours.
- [x] **Fixed:** a Progress night saved from an opened report, rather than imported, showed "your log only" and couldn't be opened. Saved pulls now keep their report link.
- [x] **Twin Fangs, new Mechanics section: Barbed Bulwark: barriers broken** (Mythic). Read from 30 Mythic pulls on Warcraft Logs:
  - every globule lands channeling a barrier (a huge absorb, 99% less damage taken; running into it hits about 500k and knocks back);
  - every barrier that came off did so within 0.2 s of a stun, fear, disorient or incapacitate landing on that globule, with its absorb still full; slows did nothing;
  - one nobody breaks runs out after about 10 s and the globule explodes on the raid with it still up.
  - Each row is one globule: who broke it, with what (a pet's or totem's crowd control counts for its owner), how long it was up, and who ran into it while it was up.
  - Amber: broken after 6 s, or someone ran into it. Red: nobody broke it, or someone died running into it.
  - Checked against the raw events: the kill was clean (72 barriers, half broken within 1.5 s); pull 1 had 2 barriers that ran out and 4 players who ran into one; pull 15 had a 9.3 s break (Kidney Shot) and a 6.3 s one (Void Nova).
- [x] **Raids only:** Mythic+ keys and dungeon bosses (5 players or a dungeon difficulty) are left out of both combat logs and Warcraft Logs reports. A report with only dungeon runs says so.
  - Nymrissa Wavecaller and Kith'ix stay: they're 24 to 29-player Heroic encounters in their own zones, not dungeons. Say if you want them gone too.

## 2026-10-16, round 91: Wolfthorn import and the Progress page
- [x] **Team import** (Progress in the menu, then "Your team on Warcraft Logs"): paste the team's page link (Wolfthorn, team 772787, Zul'jin US).
  - It reads every team report since the tier began, except Alt Stuff runs, and keeps the pulls on this tier's 8 bosses.
  - That includes reports Warcraft Logs filed under Mythic+ because the night also had keys in it; the Oct 14 Twin Fangs kill was one of those, and was missed at first.
  - Each pull is kept as a summary: result, how far it got (whole-encounter health), length, deaths, first death and roster. The team's players join your roster.
  - "Import new nights" reads only new or changed reports. One import runs at a time across tabs: two at once had kept 3 pulls twice, now cleaned up.
  - Result: 45 reports, 488 pulls saved; Mythic 6 of 8 killed.
- [x] **Duplicates and pull numbers:** the same pull from two reports, or from your log and a report, is kept once (same boss and difficulty, starting within 15 seconds; your own log's copy wins). In a night that came from Warcraft Logs, every pull is numbered by its place in the whole night (Oct 15: pulls 1–2 from Warcraft Logs, 3–32 from your log).
- [x] **Fixed: pull times from a combat log.** The log's local clock was read as UTC, so pulls from your log were saved about 5 hours off the real time and never matched the same pull from Warcraft Logs. The log's own offset ("…38.123-5") is now used, and the 30 pulls already saved were moved to the real time once.
- [x] **Progress page:** one card per boss on the chosen difficulty (Mythic / Heroic / Normal / LFR switch with kills out of 8). Each card has:
  - the boss's own art faded behind it (Wowhead's render, loaded at runtime; one boss of a council or pair);
  - the kill (date and pull) or the best pull;
  - pulls, nights and time to the kill;
  - a chart of every pull up to the first kill, stage bands by share of the encounter, best so far, nights split;
  - a night menu (starts on the kill night) with Open (the report at that boss) and Save in full (every pull of the boss that night downloaded to this PC).
- [x] Bosses with no saved art before (Ula'tek, Entombed Sentinels, Vashnik, The Lost Explorers, Sszorak, The Twin Fangs) now have their own art on the pull banner too.

## 2026-10-16, round 90: front page back to Front 1
- [x] "I don't like the homepage; version 1 was best." The front page is now the Front 1 design:
  - the ways in beside the clickable preview, with "Your log is read on this PC" as a quiet line at the bottom of the start panel;
  - "Four ways to look at a night" underneath: four buttons that switch the preview, and its tab with it.
  
  The tour, Also inside, the closing buttons and the page links are gone, along with their code and styles.
- [x] Fixed: with a log open, going back to the front page could redraw that log's pull strip and boss name on top of it (the background reader). The front page now never shows them.

## 2026-10-16, round 89: polishing the boss modules and the Mechanics tab
- [x] Reviewed the Mechanics tab on real pulls for all three modules: Coiled Altar pull 19 (your log), Twin Fangs (KGy pull 3), Ula'tek (the #1 kill and your 6 pulls).
- [x] Summaries, every section:
  - "both soaks" instead of "all 2 soaks"; one death reads "1 player died … with a defensive still ready" (no "all");
  - "A, B, C and a few smaller things" (was "A, B and C and a few …");
  - a set flagged only in its header is named ("Deluge #3, see its header"), not "sets flagged in their header";
  - 3 of 4 clean is "Mostly clean", not "A rough one";
  - "globules exploding unsoaked" (was "exploded unsoakeds");
  - Eternal Nightfall says "shields not broken in time" (was "Broken (1)"), and the survival kit's lines are in plain words.
- [x] The tiles at the top name just the mechanic ("Eternal Nightfall", not "Eternal Nightfall: break the shield, then kick").
- [x] A warlock's Create Healthstone no longer counts as using a Healthstone.
- [x] Interrupts: many adds of one kind per set (the Twin Fangs' ten Broodlings) are one group per set, each row saying which add, instead of 50 separate groups.
- [x] Twin Fangs, Avoidable damage:
  - Stir the Depths showed about 20 "hits" for every player. That was its raid-wide pulse (all 19 players, every 2 seconds, 4 pulses a cast), which can't be avoided.
  - It now counts each step into the churned water it leaves (a brief debuff, often 20 to 40 seconds after the cast), one hit amber, three or more red.
  - The damage column is now Sanguine Storm's own damage.
- [x] Ula'tek eggs: an egg picked up with Blight Vein on right after the tether break is no longer flagged (every carrier does it on Mythic kills; a carrier who then dies is still caught as the Viper's cause). The count is a note on the summary row instead.
- [x] Checked, not changed: a Caustic Waves death with Volatile Purge advice was right (he took a Purge with no defensive 4 seconds before).
- [x] Venomfang's How it works now has your raid's rule (dispel quickly, any healer; amber after 4s).
- [ ] Open (your call): a pull that's already lost counts every death and fall after that as separate problems (Coiled Altar pull 19: 16 falls and 19 deaths after Eternal Nightfall finished). With the wipe filter off, should those be folded into one "the wipe" entry?

## 2026-10-16, round 88: a new front page
- [x] Mocked up first: three home dashboards, which turned out to be the wrong idea (the user meant the front page people see first), then three front pages, then the mix of Front 1 and Front 2 that was built. The mockups are on the "Debrief home page mockups" canvas.
- [x] The front page is now:
  1. **Hero:** the ways in beside a clickable preview of the app (Latest pull, Mechanics, Assignments, Summary, with example data). "Follow my combat log" comes first, then the green "Your log is read on this PC. Nothing is uploaded." note, then opening a file and a Warcraft Logs link. The other ways to follow a log and the help are folded underneath.
  2. **Tour:** each section shows a different side of its module from the preview's: a big arena map for Mechanics, healing cooldowns against the note for Assignments, three nights on one chart for Summary. Each has a "See it in the preview" link.
  3. **Also inside:** Performance, Player audit and Deaths.
  4. **Closing:** "Ready for the next pull?" with the three ways in again.
  
  The page links at the top jump down the page.
- [x] Every existing button and ID is kept: live logging, the found-log line, choosing a file or folder, the Warcraft Logs live link, import, drop-anywhere and the hosted version's labels. The old animated demo and its styles are gone.
- [x] Phone: no sideways scroll; the page links are hidden; the preview's tabs sit on one swipeable row.

## 2026-10-16, round 87: Caustic Waves maps removed
- [x] "The wave maps aren't working well because you can't see the individual waves; remove the maps, keep the data." The section is now just the list of hits: when, who, which wave (the tail's and which way it was heading, Ula'tek's own, or a Toxic Incubation's), the poison's damage and whether they died. The map drawing for wave paths and fans is gone too.
- [x] Lesson: a map is only worth it when the log has the mechanic's real shape. The waves' width and shape aren't in it, so no map could show the individual waves.

## 2026-10-16, round 86: every wave on the Caustic Waves maps
- [x] "I see one of the tail's waves, but none of Ula'tek's or the other tails'": each map now plays the seconds before the hit with **every wave moving then**:
  - every tail wave in flight, as an arrow with its moving front;
  - Ula'tek's own waves, and the tail's in their joint Stage 1 cast, as a fan in front of the caster while the cast lasts.
  
  The wave that hit is bright and the rest fainter, up to six waves on one map. Hits not from a tail wave now get an animated map too.
- [x] Ula'tek's waves were measured on six Mythic pulls:
  - she casts from the platform's edge facing the middle;
  - hits came throughout her 12-second cast, and in Stage 3 already during her 4.5-second cast bar;
  - every hit landed within about 52 yards of her and 65° either side of where she faced.
  
  Their exact shape isn't in the log, so the fan is that measured area, and the legend says so.
- [x] Checked on 14 Ula'tek pulls (our 6, KGy's 6, the #1 kill and a 70% wipe), with no errors.

## 2026-10-16, round 85: pull colours by whole-encounter health, and Caustic Waves maps
- [x] Pull colours are no longer measured against your best: each pull is coloured by how much of the **whole encounter's** boss health was gone, all phases and bosses together. Every 20% is one item-quality step: grey, white, green, blue, purple; a kill is orange.
- [x] Phase shares were measured on three Mythic kills:
  - **The Coiled Altar:**
    - Stage 1 is Zul'jan, about a third of the encounter's health.
    - Stage 2 is Malacrass, about a quarter.
    - The intermission is none (both bosses heal back up, to 30% and 70% of their new health).
    - Stage 3 is both bosses, the rest.
  - **Ula'tek:** one shared health pool all fight (her tail and the Venomous Heart share it). Her stages are on a timer, so her health is the measure.
- [x] Your pulls with this: most are white (20–39% done); the two Stage 2 pulls at 66–67% are green (41%); early Stage 1 wipes are grey. The 71% pull that was purple is now white.
- [x] The same measure is used in the header's stage bar (each stage as wide as its share), the Summary chart's stage bands, saved earlier nights (re-read from their labels) and Warcraft Logs pulls (from the report's stage and boss health, no download).
- [x] New **Caustic Waves: dodged** section (every stage it happens in). One row per hit, saying which wave it was:
  - the tail's wave and the direction it was heading;
  - Ula'tek's waves, or Ula'tek and the tail's together;
  - waves from a Toxic Incubation impact;
  - "not clear from the log" when nothing fits (no guessing).
  
  Each row also has the poison's damage, whether they died, and a map.
- [x] How a hit is matched:
  - The tail's waves were measured on the #1 kill: about 12.5 yards a second, straight across from where the tail surfaced.
  - A hit is matched to the wave whose front reached that spot at that moment, within 12 yards of its path.
  - This covered 26 of 31 hits on our pulls.
- [x] The map: where the tail surfaced, an arrow along the wave's path, and its front moving across to the player it hit; the other tail of the pair is drawn fainter. Its width isn't published, so only the path is drawn.
- [x] Facing is now read correctly from both sources. Local logs were checked against 1,053 casts at the boss (casters face their target). Warcraft Logs' facing is turned to match on import.

## 2026-10-16, round 84: Ula'tek mini maps
- [x] Researched which mechanics a map helps with (where people stood is the mistake) and their sizes (tooltips, or measured from a Mythic kill when unpublished). Four maps, drawn to scale on the Ula'tek floor map, each with "Zoom to mechanic" framing the mechanic itself:
  - **Fester Burst**: the burst that caught the most people, with the Wretch's 10-yard bubble; players outside (hit) marked, tanks shown but not judged.
  - **Spectral Coils**: each circle's 10-yard soak, centred on its soakers (the impact point isn't in the log), soakers ticked, anyone within 5 yards of it but outside marked.
  - **Noxious Splash**: the egg carriers who came within 3 yards of each other, each with their 3-yard circle, just before it went off.
  - **Serpent's Bite and Volatile Purge**: the 7-yard leech circles with who took the venom; each Purge holder's burst (about 12 yards: not published, measured from where the players it caught stood) with anyone caught marked.
- [x] Positions on these maps are taken in between log samples (Warcraft Logs positions can be a couple of seconds old): the splash pairs now land 0.1–2.5 yards apart, as the 3-yard trigger says.
- [x] Not mapped on purpose: tank swaps, damage windows, Revenge, kill timers, tether breaks (timing problems, not position), Desperate Thrash (only ever hit the tank), kicks (their own map).
- [x] Waves: the mechanic is **Caustic Waves** (Ula'tek and her tail together in Stage 1, Ula'tek again in Stage 3, and every Toxic Incubation impact erupts them from whoever took it); it shows under Avoidable damage and on the timeline marks.

## 2026-10-16, round 83: Ula'tek module checked on a new Mythic kill
- [x] Your guild's only Mythic Ula'tek pulls are the 6 from Oct 15 (all early Stage 1), so the check used the fastest Mythic kill on Warcraft Logs (another guild, xw649bM3KCvFtDqn: a 70% wipe and the kill), for game facts only. No errors; the stages land at 2:54, 5:19 and 6:12; the data check found 29 of the 34 tracked spells, and the 5 missing are ones nobody triggered (or the lower-difficulty egg shell). Your 6 pulls re-run clean too.
- [x] **Bug fixed**: a Wretch's first Fester Burst has a 4-second cast bar, and its start and landing sometimes counted as two bubbles, so two Wretches read "3 bubbles" when they had 2 (confirmed against the raw casts). Starts and landings within 9 seconds now count once; the Warden's Writhing Gestation count got the same fix (its 3-second cast bar never tripped it, but it could).
- [x] Checked against the top 10 Mythic kills, the other flags hold: Unchecked Rage at 7:33 (20 hit) is a real mistake (none of the other 9 took it); egg carriers with 5 Blight Vein stacks in Stage 2 are avoidable (7 of 10 kills had none); Shriekers reaching Boiling Venom (killed at 28–29 s, it boils at 25 s); a Caustic Waves death confirmed in the death log.
- [x] Revenge, researched: the surviving Weakened Doomscale gets +100% haste and damage, so its Anguished Cry (542K to everyone within 60 yards and a 6 s stun, interruptible) becomes about 1.1M on a 1.25 s cast, and its Desperate Thrash frontal doubles too. In the top 10 Mythic kills, Revenge lasted from under a second to 17 s, and not one Anguished Cry got through while it was up (every one kicked); the cost was extra frontal hits. So it's now rated on what it cost, not how long it lasted: any Revenge is "!", and it's "✕" when an Anguished Cry got through or someone died to that Doomscale while it had Revenge. (That second path didn't happen in any top kill, so it's untested on real data.) The module now tracks Anguished Cry hits.

## 2026-10-16, round 82: pull strip in item-quality colours
- [x] Each pull card is coloured by how far it got against your best ever on that boss and difficulty (the saved earlier nights and tonight; a kill on any night makes the full fight the bar): within 5% of it epic purple, 80%+ rare blue, 60%+ uncommon green, 40%+ common white, below that poor grey; a kill is legendary orange (its card glows orange instead of green). No red on pulls: wiping is normal in progression. The ★ still marks tonight's best; the card's tooltip says how far it got against your best and what that best was ("71% as far as your best (P2 · Malacrass 71% tonight)").
- [x] The phase colours on the cards are gone (the text still says P1, P2, Int, P3).

## 2026-10-16, round 81: grade colours everywhere scores show, and touch
- [x] Desktop and phone both have to be usable: designs are judged on desktop first, and the phone is checked after every change (noted for the future).
- [x] Scores and grades use WoW item-quality colours; pass, look-at-this and fail keep green, amber and red with ✓ ! ✕. A graded tile's edge now follows its grade (the Assignments tile was a white D on a red edge); the survival score in Mechanics is a grade chip and its number; on Player audit's pull-by-pull grid the Ready to raid and Survival kit rows are in grade colours, Mechanics and Died stay in status colours (the legend says which is which).
- [x] **The chart's readout works without hover**: a click pins it (click elsewhere to let go); on a phone, tap or drag along the chart and it stays until you tap elsewhere. Tested with a real mouse and with touch.
- [x] **Heatmap cells show their numbers** on hover, click or tap (e.g. "Tracer · 3:00–3:05 · 201.3K per second (41% of their rate)"). Only the name opens the player now, so tapping a cell doesn't jump away to Players.
- [x] **Touch screens only**: player rows 40 px (28 with a mouse), view tabs 40 px, chips and buttons 36 px, table rows and heatmap strips taller. A mouse keeps the dense desktop layout.
- [x] The "can't click the bars" moment: a reload fixed it; most likely my checks were driving the same tab while you were clicking. Checks now run in a separate tab.

## 2026-10-16, round 80: desktop polish and grade colours
- [x] Desktop comes first; phone is secondary (noted for the future: only flag phone issues that are actually broken).
- [x] Removed the pull-by-pull trend lines from the All pulls player list.
- [x] Damage has its own colour (blue) instead of the warning orange; Utility is purple; Bloodlust markers are pink; throughput-cooldown lines are a quiet grey; bosses in Targets are blue. Gold stays for selected, best and active tabs (the app's nav accent).
- [x] Only the view you're on shows its numbers on the four switches; the others are just their name.
- [x] Small text on Performance is 12 px at the least (measured: nothing under 12 px on the Damage view outside the charts and parse badges); chart phase labels make room for it.
- [x] Grades (S–F, everywhere: Summary, report cards, Player audit, gear meters) in WoW item-quality colours: S legendary orange, A epic purple, B rare blue, C uncommon green, D common white, F red. Epic and rare are a touch lighter than in game so the letters read on dark panels.

## 2026-10-16, round 79: Performance cleanup
- [x] Review findings (measured): the Healing view was 3,950 px tall, with the healing cooldowns panel alone 2,300 px and the healer list starting about 2,800 px down; picking a player pushed the list down 236 px (their cast strip opened above it); the player panel ran to about 1,150 px; Healing had four tiles where the others have three; explanations sat in long subtitles and footers.
- [x] **Every view has the same shape now**: pickers, the four switches, three tiles, the chart, the view switch, then the content (about 1,100–1,500 px each). Healing's **Cooldowns** and **Big hits** moved into its view switch (Players · Cooldowns · Big hits · Healers · Phases · Heatmap); Healing dropped the Overhealing tile (it's on the Healing switch).
- [x] **Picking a player never moves the list** (measured 0 px on Damage, Healing and Damage taken): their casts fold behind a "Their casts" button under the chart, and the chart header keeps one height.
- [x] **Player panel**: abilities first, then targets and buffs; the top 6 abilities, 4 targets and 5 buffs, each with "Show all".
- [x] **Cooldowns**: Avenging Wrath, Apotheosis, Tree of Life and Ascendance are one line per healer (all presses, with their times), last in that healer's group.
- [x] **Consistency**: short subtitles, the method in each view's folded "How it works" (Phases, Heatmap and Big hits got one; the footers are gone); with a phase picked, Phases says it shows every phase and highlights the picked one; the On the boss tile now counts the picked phase only.
- [x] Phone: the view switch wraps instead of hiding views off the edge; Healing is about 1,860 px tall on a phone (it was several times that).

## 2026-10-16, round 78: condensed player bars
- [x] The Performance player lists (one pull, and all pulls) use condensed bars: the bar is the row, with the avatar and name on it, in fixed columns (rank, bar, number, then the trend line on all pulls, then the small number). Measured on 19–20 rows in Damage, Healing and Damage taken, desktop and phone: every column lands on the same pixel, the numbers sit exactly mid-bar, and on a phone each player is one line instead of two.
- [x] The numbers sit outside the bar, so a bar ending under one never runs through it, and there's no edge line crossing short names. Overhealing is the faded end; avoidable damage is a striped red end (plain red vanished on Death Knights).
- [x] Fixed on the way: the avoidable end drew as a ringed oval (its class name was the avatar's).
- [x] Smaller detail lists (abilities, targets, buffs, cooldowns, interrupts) keep thin bars: there the bar supports the text.

## 2026-10-16, round 77: bars match the rest of the shapes
- [x] Your point: panels, tiles, buttons and spell icons are rounded rectangles, but the thin bars were pills (a 3–4 px corner on a 5–8 px bar). Every bar in the app now has a corner in proportion to its height (1–1.5 px on the thin ones, 2 px at 7–10 px, 3–4 px on the chunky ones), and the fill inside is square, so split bars (role split, targets, healing after the big hits, overhealing and avoidable ends) join cleanly. Also the map nameplates' health bars and the per-pull column charts.
- [x] Kept the class icons round on purpose: round for people and square for spells is a quick way to tell a player from an ability in busy rows.

## 2026-10-16, round 76: healing cooldowns, Aura Mastery included
- [x] New **Healing cooldowns** panel on Performance > Healing: every press in time order (up to the wipe filter, or in the picked phase), who pressed it, what it did, and what was hitting the raid while it was up; totals per cooldown and player on top.
- [x] Cooldowns that heal get their own heals, exactly: Tranquility, Divine Hymn, Holy Word: Salvation, Revival, Restoral, Celestial Conduit (Mistweaver), Yu'lon's Soothing Breath, Healing Tide, Rewind, Dream Flight, Emerald Communion, Vampiric Embrace. Overhealing shown, not counted.
- [x] **Aura Mastery**: Devotion Aura goes from 3% to 12% for 8 seconds; the log re-applies the empowered aura on everyone in range, so the estimate only counts players who actually had it, and only hits from enemies. Your pull 30 press at 1:07: 20 players covered, 12.6M taken under it, about 1.3M taken off. Power Word: Barrier (20%) and Spirit Link Totem (10%, plus its evening-out heals) are estimated the same way, by who was inside.
- [x] Avenging Wrath, Apotheosis, Tree of Life and Ascendance don't heal on their own: they show what the healer healed while it was up and their rate against their usual (only real presses; talent procs left out). They sit last and have no bar, so they don't dwarf the real cooldowns.
- [x] The healer's own Big cooldowns lines now say what each did ("Aura Mastery used 1 of 2 · at 1:06 · ~1.29M taken off").
- [x] Fixed: a cooldown pressed more often than its listed cooldown allows (talents) read "used 4 of 4" next to 7 presses; it now counts every press as possible.
- [x] Added the raid cooldowns (panel renamed "Healing and raid cooldowns"): **Anti-Magic Zone** (15% of magic damage for the players inside, estimated like Barrier; the zone's buff is credited to the Death Knight who pressed it), **Darkness** (exact: every attack it makes someone avoid logs as an absorb by the Demon Hunter) and **Rallying Cry** (the health it added, 10% of each player's maximum, and how many dropped into that extra health). On pull 30: Anti-Magic Zone ~3.28M, Darkness 2.57M avoided, Rallying Cry +1.97M on 20 players (all 20 dipped into it).
- [x] Grouped **by player** (your idea): a group per caster with their totals on the header, their presses under it. "In time order" is a switch, for spotting cooldowns stacked on the same hit (pull 30: Rallying Cry, Darkness, Anti-Magic Zone, Rewind and Celestial Conduit all within 2:50–2:56 on one Venom Rupture).
- [x] Clearer wording on Avenging Wrath and Apotheosis: "healed during it · 11% below their usual" instead of "while up · ×0.89 their rate". Exact (Darkness) and estimated ("~", taken off) totals are kept apart.
- [ ] Could add: the night view (each cooldown's average per press across pulls).

## 2026-10-16, round 75: Performance, six new ways to read a pull
- [x] A view switch under the timeline: **Players** (the bars and the picked player, as before), **Phases**, **Damage windows**, **Targets**, **Healers** (Healing only) and **Heatmap**. A name in any view opens that player on Players.
- [x] **Phases**: a row per player, a column per phase plus the whole pull, per second while alive, each cell shaded by rank in its column. Once other pulls are read, ▲▼ shows each cell against that player's best pull of the night in that phase (★ when this is it; only for phases at least two pulls reached).
- [x] **Damage windows**: Bloodlust's 40 seconds, plus the fight's own: Rage of the Shackled (Ula'tek), each Eternal Nightfall shield until it broke, and the Soulbinding intermission (Coiled Altar). Per player: damage per second in it (damage soaked by a boss shield counts, checked against the fight audit: 35M into shield 1 either way), ×N against their own rate, the big cooldown and combat potion they had going. Starts on DPS.
- [x] **Targets**: raid damage by target over time (stacked), each player's split between the boss (and what shares its health), the adds that have to die, and everything else, then each set of those adds: how long it lived and how fast the DPS got on it after the raid's first hit. Lists: Spiteful Soulcoiler (Coiled Altar); Doomscale Warden, Weakened Doomscale, Shrieker, Wretch and Rawling (Ula'tek); other bosses fall back to any add with 3% of the damage. Long name lists collapse to a count (Stage 2's split sides made them noise).
- [x] **Heatmap**: a strip per player, a cell per 5 seconds, against their own rate (Damage taken: one scale for all), with dead time, big cooldowns (defensives on Damage taken), deaths, phases and Bloodlust marked.
- [x] **Healers**: healing per second, overhealing (shown, not counted), the share of heals that landed on someone under half health, and from a real combat log the healers' mana over the pull (lowest point, mana left at the end or death, mana potions). Warcraft Logs reports don't carry mana; the panel says so.
- [x] **The picked player**: their casts under the timeline on the same time axis (key buffs as bars, big cooldowns, most-cast spells), an ability table (casts, hits, crit, average, share), buffs by uptime with who gave them (raid buffs folded away), mana for healers, and "Compared": their best pull so far, others of their spec this pull, and on a Warcraft Logs kill their parse.
- [x] **Parses**: on a Warcraft Logs kill, each bar carries the player's parse in Warcraft Logs' colours (wipes have none). Works through the local helper; the hosted Worker got an `/api/rankings` route (needs a redeploy to go live).
- [x] The Ula'tek Wretch: researched. The guides only cover the beam and the bubble, but the 10 fastest Mythic kills on Warcraft Logs all handle it the same way: each Wretch gets exactly two Fester Bursts and dies 72–95 seconds after it lands. The bubbles run on a fixed clock (about 36, 68 and 100 seconds after landing), so it dies on a timer, between the second and the third bubble, not on sight. It's off the switch-speed list now (its damage still counts as useful), and the Mechanics "How it works" gives the bubble timings. The existing check (kill it before the third bubble) already matches.

## 2026-10-16, round 74: starter NSRT note for Mythic Ula'tek
- [x] Drafted `notes/Ulatek Mythic NSRT note (starter).txt` in the same style as your Coiled Altar note (header 3492, timed reminders, then "Label: names" lines), from the plan the module follows: beam soaks, raid cooldowns at the big tether break and on each Stage 3 platform, potions for damage windows 2 and 3, Bloodlust on window 2, intermission personals; tanks, egg breakers, two sets of eight egg zones with backups, Stage 1 Coil sides, Stage 2 sides, lanes, big and far eggs, the tether caller and first break, four Doomscale kick rotations, three intermission Coil groups, clutch grips, three Bite soak groups with backups and Shrieker kicks. Timings come from the Mythic kill log. It parses in Debrief.
- [x] Filled it in with your Coiled Altar team (`notes/Ulatek Mythic NSRT note (draft with names).txt`): jobs matched to specs (spread damage on shells, mages on the outer egg zones, a warlock gate per side, two raid cooldowns per side at the big tether break, immunities on the Bite soaks). Open: the callers are guesses, and there's only one Death Knight for the Stage 3 clutch grips.
- [ ] Next: Assignments checks for Ula'tek that read this note (egg zones and backups against who picked up, Coil groups against Soul Constrictor, Doomscale and Shrieker kick rotations, Bite soakers against the Volatile Purge holders, the beam tank, raid cooldowns at the tether break).

## 2026-10-16, round 73: Ula'tek polish and debugging
- [x] Ran the module on 33 real pulls (Normal, Heroic, Mythic; kills, wipes and resets): no errors, and the stage splits were right on every difficulty.
- [x] Bug: a Viper was blamed on a carrier whose egg had just popped in a Spectral Coil (that egg hatches a Rawling, which is the plan). Coil pops are left out now, the match window is a second, a carrier who dies holding an egg still counts even when the log has no shell removal, and anything else says "an egg on the ground".
- [x] Bug: a pull whose Vipers all came after the wipe filter dropped out of the Eggs results (and its grade on Summary). Every pull with eggs now has a baseline row, so it reads clean up to the filter.
- [x] Bug (mine, fixed within minutes): one edit broke the app's script for a few minutes; your tab never loaded it. Every build is now syntax-checked before I move on.
- [x] Less noise: tanks aren't judged for being outside a Wretch bubble (the beam tank has to stand away); "no raid cooldown" on a tether break only counts for big batches (four or more), so Heroic pairs aren't flagged.
- [x] Wording: Viper rows are short ("Noxious Splash with Empshield", "died carrying it", "hit by Caustic Waves") with the full sentence in What went wrong; "Grasping Fangs: tether breaks", "Wardens and Doomscales: killed in time"; the Wardens and Doomscales summary names a Warden's second gestation; Summary's "what ended the wipes" names whose melee it was ("Melee from Blightscale Viper").

## 2026-10-16, round 72: Ula'tek, strategy from a Mythic video guide
- [x] You asked for a specific Mythic Ula'tek video guide as the strategy reference. Read its full transcript (the video's own captions) and chapters. The app text stays neutral, with no names.
- [x] New from it: a Blightscale Wretch section (Mythic: kill each before its third Fester Burst bubble; who was outside a bubble); the damage amps show combat potions per window and, from a real combat log, the boss's health after each window with the Mythic pace (67% after the first, 45% after the second); tethers check the planned batches (one break, then the rest together within a second, with a raid cooldown up) and name the cooldowns; Doomscale Wardens should die before their second gestation; Mythic Volatile Purge holders need a big defensive or an external (about a 2 million hit); picking up an egg with Blight Vein stacks on is flagged; Warden's Protection is back as avoidable (standing on an egg while its Warden lives); Falling Debris is dangerous (it kills anyone).
- [x] Checked against the kill log, which kept some flags gentle: Rancid Yolk re-pickups (twice on the kill, both lived) are "could be better" unless the carrier died with that egg; a Warden's second gestation (once on the kill) is "could be better".
- [x] "How it works" for every Ula'tek mechanic rewritten with that strategy (egg zones and backups, three Coil groups in the Mythic intermission, the inactive tank on the beam, potion and Bloodlust timing, the tether plan, four Doomscales with kick rotations, minimum Serpent's Bite soakers with immunities, gripping clutches platform to platform).
- [ ] Not checked yet: Serpent's Bite soakers missing more than one tick to a knockback, Purge waves hitting the raid (they count as Caustic Waves for now), clutches gripped across the middle, the cauldron order.

## 2026-10-16, round 71: Ula'tek fight logic (Heroic and Mythic)
- [x] Researched the strategy (several public guides; the app text stays neutral) and read the real logs for game facts: your guild's Heroic prog and kills (Aug 30 to Sep 27), your 6 Mythic attempts (Oct 16) and another guild's Mythic kill night (the test report). Every spell ID in the module comes from those logs.
- [x] Phases, matching Warcraft Logs' split to the second: Stage 2 when the Doomscale Eggs start Hatching Doom (2:44 Heroic, 2:54 Mythic), the intermission at its Call of the Serpent, Stage 3 five seconds before the next one (the platform shatter has no event).
- [x] Checks: Eggs (every Blightscale Viper with who had the egg and what broke it: Noxious Splash with the other carrier named, the carrier dying, a wave or Coil hitting them, or an egg left on the ground; Mythic: re-picking an egg with Rancid Yolk on), Spectral Coils (soakers per circle from Soul Constrictor, deaths), Tanks (Mother's Wrath on the raid, Stone Venom still on going in, Rattler Slam, Unchecked Rage), Toxic Incubation (Mythic: impacts taken vs reaching the Wretch), Damage amps (damage in each Rage of the Shackled window, Bloodlust), Grasping Fangs (tethers, Blight Vein peak, deaths), Doomscales (Revenge on Mythic, a hatched Ravenous Doomscale), Serpent's Bite (per cast: Calcified Corpse, Purges not spread), Shriekers and Rawlings (time alive, extra Acidic Expulsions, Boiling Venom), Avoidable damage, Interrupts (Malice, Anguished Cry, Vicious Echoes), plus a "How it works" for each and a Data check.
- [x] What the logs corrected from the guides: Toxic Incubation is one stream of 5 impacts (on the kill one tank took all 5), not four interceptors; tether breaks weren't paced two at a time on the kill (so pacing isn't flagged, deaths are); Mythic has 8 intermission Coils (6 on Heroic); each Mother's Wrath leaves 9 Stone Venom (so the check is what the tank still had going in); a Shrieker's first Acidic Expulsion comes right after it spawns; Warden's Protection is unavoidable for melee on the Warden.
- [x] Your Mythic attempts, read by the module: Vipers in every pull (Noxious Splash pairs, carriers dying, eggs on the ground, carriers hit by Coils), Rattler Slam at 1:13 in pulls 3 and 5, and in pull 5 all 5 Toxic Incubation impacts reached the Wretch. Heroic pull 27 (8/30) wiped to three Calcified Corpses from the 4th Serpent's Bite.
- [ ] Not judged yet: Mephitic Thrash positioning, Circling Prey (hits are expected; deaths show in Deaths), the cauldron order (small eggs first) beyond a hatched Ravenous Doomscale, and which side each Doomscale pair was on.
- [ ] Normal difficulty: no Soul Constrictor, so Coils soakers aren't counted there.

## 2026-10-16, round 70: grades on Summary rows, Avoidable damage and the wipe filter
- [x] Bug: Avoidable damage counted hits and deaths after the wipe filter (pull 30 showed three "died to it" at 4:01 to 4:08 with the filter at 3:28), on Mechanics and in the Summary's dots and damage chart. Each source is now built again from what happened up to the filter.
- [x] Wording: "The only Dreadmarch result went wrong" instead of "0 of 1"; Avoidable damage counts players ("2 players took dangerous or repeated hits, and 12 more could be tighter") instead of "40 of 70 players"; its problems name the source ("Malevolent Resonance (1)") instead of "Hits (7)".
- [x] Summary: a grade per mechanic and assignment row (S, A, B, C, D, F on the report card scale; a dash when it didn't come up). Each pull scores the share of its results that went right (could be better counts half); the grade is the average over the pulls it came up in, each up to the wipe filter. ▲ / ▼ when the last third of those pulls was 15+ points better or worse. Avoidable damage uses the report card's own score, so the row and the card agree.
- [ ] The Mechanics report card's "Boss mechanics" category (A, 90) counts mistakes per pull, while the rows grade each result, so the card reads kinder than its rows (C, F). Worth lining the card up with the rows.

## 2026-10-16, round 69: Performance polish ("make it slay")
- [x] Bug: "while alive" stopped at a player's first death but kept counting damage after a battle res (Shockabunga's "best" read 666K in pull 19). Alive time now leaves out only the time spent dead, everywhere (Performance, and the Player audit's output lines: activity, what dying cost, longest gaps).
- [x] Bug: a Soulcoiler set was judged on what happened after the wipe filter. Damage checks now stop at the filter; a check still open there isn't shown.
- [x] Bug: the Active time tile and the player's own activity line used two different formulas. One number now, mind control left out.
- [x] All pulls: resets (pulls counted under 30 s) are left out of the averages, the best pull and the trend, and named in the header. A best needs a minute alive (or most of the picked phase).
- [x] Design: the four views are switches that carry their headline number (per second, and the night's average on All pulls). Tiles slimmed to three or four per view; Utility has none (the cards carry the totals).
- [x] Chart: a soft fill in the view's colour (or the player's), phase lines and names, a legend, and a hover tooltip with the time, value, phase and what happened then (mechanics, deaths, Bloodlust, their cooldowns). Drawn narrower and taller on a phone.
- [x] Bars: share of the raid (or overheal, or avoidable share) on every row, a ↻ for a player brought back, and All · DPS · Healers · Tanks chips.
- [x] Side panel: stays in view while the bars scroll; with nobody picked it shows a by-role split and a hint; with a player picked, a header with a close button and clear sections.
- [x] Healing after the big hits: what actually hit the raid in those 3 seconds (from the log, with amounts), and each healer's share as a bar in their colours.
- [x] All pulls: a 3-pull average line over the bars, the pull you came from outlined, and a pull-by-pull line per player.
- [x] Phone: no sideways scroll; tiles two per row; bars go to two lines.
- [ ] Augmentation Evoker is ranked by their own damage among DPS, which undersells them (their damage is credited to others). Worth a note or a different line for Aug.
- [ ] Idea for later (you, round 69): a tab where one player imports their own log and gets everything they personally need to work on for that fight.

## 2026-10-16, round 68: Performance tab built out
- [x] Phase picker (Whole pull · P1 · P2 · Intermission · P3, only the phases the pull reached): tiles, bars and "lost to deaths" count the picked phase only, alive time inside it; the timeline dims the rest of the pull. On All pulls, a phase counts in each pull that reached it (the others get no bar). Whole-pull numbers on the tiles say "whole pull".
- [x] Player panel: how it went (output, activity, potion, adds, what dying cost), then each spec's big cooldowns: used X of Y, first press, how long it sat ready, with Bloodlust or not. Their presses are marked on their line in the timeline.
- [x] Damage taken: each bar shows the avoidable part in red; a player's five biggest single hits (absorbs included) with how much health they had left ("killing blow").
- [x] Healing: "Healing after the big hits", the five biggest moments of raid damage (3 seconds each), the mechanic that landed then, and what each healer healed in the next 11 seconds.
- [x] Utility was "visually lacking" (a table of dashes): now one card per kind (interrupts, dispels, battle resses, externals, mind control CC), only the players who did it, a class-coloured bar each and what they did underneath: what they kicked or removed, who their battle resses and externals went on (with the times on a single pull). Dispels count once per target per cast; Disengage clearing a slow off yourself isn't a dispel; purges on enemies say "purged".
- [x] All pulls: a player's "best" is hidden when it reads lower than their average (short-lived pulls can push the average up).
- [x] Damage taken: the player panel shows their defensives instead of their damage cooldowns: used X of Y and when (talented ones once they've cast them on this boss), flagged when one sat unused through a close call or was still ready when they died; then their close calls under 30%, their death, and Healthstone and health potion. Their defensive presses are marked on their line.
- [ ] Performance in the MVP score (held: the Player audit waits for now).

## 2026-10-16, round 67: Performance tab (phase 1)
- [x] New Performance tab (after Mechanics): Damage · Healing · Damage taken · Utility. Tiles, a slim timeline of the raid's output (or a picked player's) with the phases shaded and the boss mechanics, Bloodlust and deaths marked, a bar per player, and what their damage went into (targets and abilities). Counts up to the wipe filter.
- [x] All pulls / Pull switch on the tab: all pulls shows the raid's output per pull (click a bar to open that pull), the night's trend, and each player's average while alive with their best pull (only pulls they lived a minute in).
- [x] Damage checks: every Eternal Nightfall shield (broken in time, how much to spare, or how much went in when it wasn't broken; "% more needed" once a shield has broken to compare with) and every Spiteful Soulcoiler set (dead before the next set). Damage into Malacrass's own shield now counts toward it.
- [x] Damage done counts enemies only (mind-controlled players hitting friendly pets aren't damage).
- [x] Healing: overhealing shown (a faded end on each bar, a percentage on the tile and per ability) but never counted. Soulcoil Barrier is a healer trinket (you corrected me): counted like any heal and tagged "trinket".
- [x] Player audit: "Output and activity" for every spec, per pull and over the night: output against their role in the raid (for information), activity with the longest gaps that weren't forced (mind controlled time left out), combat potion with Bloodlust, damage on adds against the DPS average, what dying cost, and avoidable damage against their role's average.
- [ ] Phase 2: each spec's big damage and healing cooldowns, cooldown use and alignment feedback, and Performance in the MVP score.
- [ ] Fine-tune the Performance graphics later (you said "better, we can fine tune that later").

## 2026-10-16, round 66: Summary is the all-pulls page, one look for what went wrong and right, MVPs by role
- [x] Summary rebuilt as the all-pulls page for the boss on screen (other bosses tonight: one line each): an overall report card (mechanics and assignments together), how far the night got (and earlier nights), what to fix before next raid, then Mechanics and Assignments, each with its own framed report card and a fold-out row per mechanic or assignment under its phase, with a dot per pull (click one to open that pull, on the row it came from). A row opens to the trend through the night, who was flagged most, and the pulls that went wrong in a list-and-detail view. Assignments ends with healing cooldowns and a "By player" block.
- [x] Retired the all-pulls views of Mechanics and Assignments (Summary has them). The All pulls card on the pull strip is gone; the Player audit has its own All pulls / Pull switch on its page.
- [x] Wipe filter: a card at the right end of the pull cards. Pull cards: the arrows float over the faded ends, so the cards run the full width.
- [x] Top bar: "Checked 10:16 PM" instead of the long file name (it's in the tooltip). The sticky tab bar shows the pull on screen on its right ("Pull 30 · wipe in P2 · 9:58 PM", or "All pulls"); a click goes back up. Each tab explains itself on hover.
- [x] "What to fix before next raid" in the same look as the rest (✕ / ! rows, then "Through the night" ✓ / ! rows).
- [x] "What went wrong / What went right" side by side, the same on Latest pull, Mechanics (instead of Fix these first) and Assignments: one line per item, worst first, at most five, the whole line on hover. Mechanics leaves the note's misses to Assignments.
- [x] Mechanics: every mechanic made of sets uses the list-and-detail view (sets on the left, the picked set's table on the right).
- [x] Avoidable damage has a game icon (Feint) instead of the built-in one.
- [x] Cooldown reminders read the spell's name even when it wasn't pressed (no more "Spell 374227"). Problem lines on Summary say the flagged column ("Target Arsyn (no protection)").
- [x] Tanks' survival kit is scored differently: defensives 60 (including big-cooldown use: uses against the uses they had, 70% is full marks), Healthstone and health potion 15, combat potion 25, and only a dip under 15% with nothing pressed counts. Added the tank cooldowns the list was missing (Fiery Brand, Metamorphosis for Vengeance, Last Stand, Dancing Rune Weapon, Eye of Tyr, Rage of the Sleeper, Zen Meditation).
- [x] MVPs by role (the best tank, top two healers, top three DPS), and assignments count: a player with note assignments is scored 35 execution, 20 assignments (their own done, late counts half), 25 survival, 20 ready; the note's misses no longer also count in execution.
- [ ] Assignment credit doesn't cover Twin Fangs yet (Feast groups, Broodling kicks, globule CC) or marker kick teams.
- [x] Tank review: tonight's tank scores were mostly earned (no deaths, frontals clean every pull), but tanks have fewer checks. Now their minor slips on their own frontals cost 2 a pull in execution, big cooldowns need 80% use for full marks (was 70%), and a tank's row says what their score is made of ("frontals clean 73/73 · no deaths · big cooldowns 80%").
- [x] Summary's top box is the same "What went wrong / What went right" pair as the other tabs. Wording: "all 1 held" is now "the mind control was CC'd" (and no more "all 1 …" anywhere).
- [ ] Next (brainstorming first): Damage / Healing / Damage taken charts, and how output should count in the Player audit and MVPs.
- [x] Answered: keep Assignments separate from Mechanics for now. Mechanics is "did the raid play the boss right" from the log alone; Assignments is "did each person do their job from our plan" and needs the note (healing cooldowns aren't a mechanic at all). Summary already shows both together. Revisit after a raid night of use.
- [x] Question for you: is "P1 Guillotine 1 External Guillotine Target: Huservoker" meant as "Huservoker puts an external on the target"? It's missed in all 28 pulls. Answered (Oct 16): yes, and he confirmed he wasn't using externals on his targets, so the misses are real; the check stays.

## 2026-10-16, round 65: CC order, curses and ghost soaks checked; saved progress across nights
- [x] Mind control CC (Dreadmarch, P2 and P3): each mind control's targets, how long it lasted, and every CC on them in the order it landed, numbered by the note's CC order. No CC on a mind control that lasted is a miss; someone lower on the order going first, or CC only from players not on it, could be better; one that broke on its own within 2 s isn't judged.
- [x] CC research, from tonight's log: stuns, roots, grips and disorients all count (Leg Sweep, Shockwave, Chaos Nova, Capacitor Totem, Binding Shot, Ursol's Vortex, Blinding Light, Holy Word: Chastise, Sigil of Misery, Storm Bolt, Hammer of Justice and more). Ring of Peace counts when it's cast during the mind control: it leaves nothing on its targets in the log.
- [x] Fixed: Capacitor Totem's stun logs as "Capacitor Totem" from the totem, so Shockabunga's CCs weren't counted before; a pet's or totem's CC now counts for its player (also on Mechanics).
- [x] Add curses: each Spiteful Soulcoiler set, the unmarked and raid-marked add, who should curse it and who did (Curse of Tongues or Curse of the Satyr, which Arsyn uses). A set where neither add got a raid marker lets either add count.
- [x] Ghost soaks (intermission): each soaker alive and on a spot of their own, and whether a fragment reached Zul'jan. The log doesn't say who blocked which fragment (the fragments aren't logged and every block stacks the whole raid), so this is as far as it can go; not seen on your own log yet (no intermission tonight), tested on the Warcraft Logs test report.
- [x] The curse and "Zephyr Guillotine" reminders no longer count as healing cooldowns.
- [x] Fixed: P2 started at the first Dreadmarch; it now starts when Malacrass joins (Dreadful Presence, about 7.5 s earlier), which is when NSRT's P2 timers start. P2 cooldown reminders were reading 5 to 8 s early.
- [x] The three checks are in Assignments (rows under their phase, tiles, What went wrong) and in the all-pulls Assignments grid.
- [x] "Update note" sits in a bar on top of Assignments.
- [x] Saved progress: the first log asks "Is this your raid?"; yes saves its pulls on this PC and remembers the roster as your team. Later logs with at least half the same players save on their own (sitting a fight doesn't matter); a log that's mostly other players asks first. The banner counts earlier nights ("night 2 on this boss", "Before tonight: …", "Best pull yet") and Summary shows progress night by night. The ☰ menu's Saved progress changes it, forgets the team or clears the saved pulls.
- [ ] Waiting on you: Summary as the all-pulls page (overall report card, then Mechanics and Assignments report cards with fold-out rows); and whether the all-pulls Mechanics and Assignments views go away, which decides where the All pulls / Pull switch and the wipe filter go.
- [x] Question: "P1 Guillotine 1 External Guillotine Target: Huservoker" is missed in all 28 pulls (no external from Huservoker on the axe target). Does that line mean something else? Answered: no, the misses are real (he wasn't using externals).
- [ ] Later (not started, on request): import every Wolfthorn report from Warcraft Logs, past and current, into saved progress.
- [ ] Question (from you): is having the Assignments tab separate from the Mechanics tab necessary?

## 2026-10-16, round 63: tighter top, reloads keep your place, Assignments and the start screen polished
- [x] Small tweaks to the top: slimmer top bar, shorter banner, tighter pull cards; the Summary drops its repeated "Best" line when only one boss was pulled.
- [x] Reloads (after a rebuild, or F5) reopen the live combat log on the same pull, tab, pulls switch and scroll position, instead of the start screen.
- [x] Assignments: a tile row on top (one per assignment, click to jump), "What went wrong" in the Latest pull style, panels in fight order (Guillotine and orbs in P1, then the Soulcoiler kicks), healing cooldowns as a fold-out section with ✓ ! ✕ results, and the note's reference lines under "About the note".
- [x] Fixed: Assignments ignored the wipe filter (Soulcoiler set 2 at 3:48 counted "2 casts got through" after the 2nd death at 3:28). Anything after the filter is greyed and not counted.
- [x] Guillotine: "done · Blessing of Protection" no longer repeats "from Flëxørçïst" when it's the assigned player shown right above; spell icons in those lines are small and inline.
- [x] Start screen: a banner like the one on every tab (with the boss art), the three ways in as cards with a coloured edge and sentence-case labels, one button on the live card with the other ways folded under it, and the example preview in the new look. No live button in the top bar until something is open.
- [ ] Twin Fangs assignments don't apply the wipe filter yet (Feasts, Broodling kicks, globule CC).

## 2026-10-16, round 64: Assignments laid out like Mechanics, tooltips
- [x] Assignments now reads like Mechanics: phase headings (P1 Zul'jan, P2 Malacrass, with their time and a status), and under each one a fold-out row per assignment with its icon, a short summary and ✓ ! ✕; click it for the details (the tables from before). Guillotine and orbs sit in P1, the Soulcoiler kicks in P2, an assignment in two phases gets a row in each. Purple and green orbs are separate rows.
- [x] Healing cooldowns: their own group at the end, one row per phase; reminders from phases the pull never reached are one line under About the note.
- [x] Every row has a "How it works" note, opened rows stay open across pulls, and the tiles on top jump to (and open) their row.
- [x] Tooltips: the Guillotine and orb rows show the spell's tooltip with how it's checked; the flask and food icons in the Player audit show the buff's tooltip.
- [x] (done in round 65) Note lines that aren't checked yet (shown under Other note lines): the CC order on mind controls ("1st CC on Mindcontrol" … "4th"), the curses on the unmarked and raid-marked adds, and the ghost soaks ("Soak Ghost at …").

## 2026-10-16, round 62: full debug and polish
- [x] Snapshot of the source before this pass: backups/2026-10-16 before full polish (git isn't installed on this PC).
- [x] One pull / all pulls is one setting for the whole app: the pull list and the same switch on the tab bar change it, so every tab agrees.
- [x] All-pulls Mechanics: the wipe filter line now says "Each wipe counts up to its 2nd death"; avoidable damage across the night sits under Fix these first, collapsed, sentence case.
- [x] Latest pull: the same tiles (deaths, mechanics, assignments, healing cooldowns, interrupts), ✕ ! ✓ rows, and numbered fixes as the Player audit. Healing cooldowns are a tile of their own, not in "What went wrong". No more raw spell IDs in the note checks.
- [x] Summary: the report card is a big grade plus a tile per category, under each boss's header.
- [x] Assignments all pulls: the shared tiles; pull-by-pull uses the ✕ / ✓ status words.
- [x] A player's name anywhere opens their row in the Player audit.
- [x] Layout: the sidebar moved to the top (app bar and a strip of pull pills); the Latest pull banner is now the banner on every tab (result in big letters, how it compares, a phase bar) with the boss renders behind it, loaded from Wowhead at runtime (Coiled Altar and Nek'zali so far; other bosses get a built-in emblem until their display IDs are added).
- [x] Tabs have icons; the pulls switch sits on the right of the tab bar.
- [x] Top bar, take two (mockup E of seven): just the logo, the boss (a picker when more than one boss or key was done tonight), live logging and a menu (open a combat log, Warcraft Logs, start screen).
- [x] Pull cards under the banner: All pulls, then a card per pull with its time, how far it got (coloured by phase) and a bar; a star on the best pull, green for a kill. They scroll sideways (wheel or arrows), the edges fade, and the picked pull stays in view. Pulls not read yet show their length until the background reader gets to them.
- [x] Wipe filter made more noticeable: a blue control with a flag on the tab bar, next to the All pulls / Pull switch (both decide what the tabs count), with − and + and its ? opening why. It turns grey when off. The duplicate "set in the sidebar" lines on Mechanics and Player audit are gone.
- [x] Fixed: Mechanics took over the wipe filter's ? button once it moved (it would have thrown an error).
- [x] Banner art: one boss at a time, cropped to head and shoulders (Malacrass for The Coiled Altar; Zul'jan's render is tiny in its frame).
- [ ] Summary fixes could link to their Mechanics section.

## 2026-10-16, round 61: Player audit rebuilt (readiness and survival kit), survival scoring everywhere
- [x] Goal: show who shows up ready (enchants, gems, gear, flask, food, weapon oil) and who uses their survival kit (defensives when it mattered, Healthstone and health potion, combat or mana potion; combat and mana potions share one cooldown).
- [x] Two scores per player per pull, graded S to F: Ready to raid (consumables 60, gear 40; item level 5 or more under the raid median is "could be better") and Survival kit (defensives 40, Healthstone and health potion 30, combat or mana potion 30). Close calls (under 30% health for a second or more, or under 15%) with nothing pressed cost points; one-shots don't.
- [x] Survival kit replaces the old defensives table in Mechanics; the Summary report card's Survival grade is the raid's average survival kit score.
- [x] Everything on the Player audit stops at the wipe filter: the focus tips and the cooldowns and activity checklist now do too (the night table already did).
- [x] Removed the casts breakdown and the overhealing check.
- [x] Augment runes are not judged at all (not scored, not flagged, no icon); they still show on the gear sheet when present.
- [x] New look: a Tonight / Pull N switch on top. Both views use the same parts: stat tiles with a coloured edge and one status line, then one row per player (grades with bars, buff and kit icons ringed by how they went, what stands out) in three groups: needs a word, could be better, all set. Click a row to open that player under it.
- [x] Tonight: a slim MVP podium, and each player's night with their checklists and a square per pull (ready, survival, mechanics, died); click a square to open that pull with the player already open.
- [x] Over a night, small slips aren't problems: a buff missed on under a fifth of the pulls, or dying with a defensive ready on under a fifth of the pulls, is "could be better".
- [x] Gem icons on the gear sheet now load for local logs.
- [x] A build that fails to load now reloads your tab on its own once it's fixed.
- [x] Follow-up: the switch reads "All pulls" (with the count) and "Pull #30".
- [x] Fixed: changing the wipe filter didn't change All pulls (its saved results ignored the filter). Both views now score again when it changes, and show the same quiet wipe filter line as Mechanics ("Each wipe counts up to its 2nd death" / "Survival and focus tips count up to 3:28, the 2nd death").

## 2026-10-16, round 60: Assignments tab polish (the Mechanics look)
- [x] Each panel heading (Soulcoiler kicks, Guillotine, Orb carriers, Kick teams, Twin Fangs panels) has one status on the right in the shared words (✕ 2 of 6 not done, ! 1 of 2 orb groups not clean, ✓ all in turn); shorter subtitles.
- [x] Rows keep only the coloured left edge: no red / amber / green row tints, row names in plain white, status lines stay coloured.
- [x] Orb chips are outlined only when something's wrong (none picked up, or missed waves on purple); full ones are plain.
- [x] Set bars (Soulcoiler kicks here, sets in Mechanics) use the same status text instead of pills.
- [x] Fixed: a comment inside a one-line expression broke the page twice. The build is now checked in the browser (every script parsed) before your tab picks it up.

## 2026-10-16, round 59: Mechanics tab polish (same layout, cleaner)
- [x] Kept the layout (tiles, Fix these first, phases, sections); only the look changed, to match Assignments and Summary.
- [x] Wipe filter: one quiet line ("Audited up to 3:28, the 2nd death (Shockabunga); 81 results after it are hidden" · wipe filter setting with its ?), no red banner.
- [x] Tiles: neutral cards with a coloured left edge and one status line (✕ 2 problems, ! 3 could be better, ✓ clean) instead of coloured outlines and big numbers.
- [x] Fix these first: the same box as the Assignments "what went wrong" (a row per problem, its mark, the time on the right).
- [x] Phase headings: slim, sentence case, with the time span and a status on the right, instead of the gold all-caps banners.
- [x] Mechanic rows: a coloured edge and one status line on the right, instead of pills; reference rows (potions, raid cooldowns) say what they are in grey.
- [x] Inside a section: "How it works" folded into a small link, plain summaries, no all-caps labels.
- [ ] Ideas not taken (kept for later): a timeline or boss-health chart on top of Mechanics (options 1 to 4 mocked up).

## 2026-10-16, round 58: Summary as a debrief, healing cooldowns apart, tabs renamed
- [x] Summary (was Night summary), built for planning next week: per boss the progress chart (the old graph, kept by request) with a line under it (first pull in each phase, best pull, pull times), then "What to fix before next raid": what ended the wipes first (with who died first, the phase, and whether it got better or worse), then mechanical assignments from the note that kept being missed, the avoidable damage players went over the limit on most, and the boss mechanic missed most often. Then "Getting better" / "Getting worse" (first half of the night against the second) and a one-line report card. Buttons go to the all-pulls Assignments and Mechanics.
- [x] Healing cooldowns (the note's cooldown reminders) kept apart from the mechanical assignments everywhere: their own block on the Summary (share on time, late or early, missed, who, trend), their own panel on Assignments (not in the "what went wrong" box), and their own per-player table in the all-pulls Assignments (the "who missed" table and pull-by-pull list now count mechanical misses; healing cooldowns are listed separately).
- [x] Tabs renamed: Latest pull, Assignments, Mechanics, Summary, Player audit (buttons, help text and the start screen preview too).
- [x] Fixed: a comment inside a one-line loop broke the page for a moment; "misss" in the pull-by-pull list.
- [x] Night summary rethink from round 57: done (A debrief + the old chart instead of B).

## 2026-10-15, round 57: NSRT audit easier to read, Raid audit merged into the Player audit
- [x] NSRT audit (one pull): a "N things went wrong this pull" box on top lists every problem in one sentence each (worst first, with the time or phase); one green line when everything that came up was done.
- [x] Each status shown once: the coloured row edge plus a short ✓ / ✕ / ! line per part (soak team, external, Zephyr, orbs, kicks). The per-row pills and header tallies are gone.
- [x] Smaller name chips and fixed column widths; the Guillotine target moved into the drop cell ("0:43 · on Ashdknight"); externals and Zephyr say what was cast with spell icons ("done · Blessing of Protection from Flëxørçïst", "done · Zephyr · also Huservoker").
- [x] Green orb backups folded into the green row ("Backups: Huservoker 2, Kargaryen 1").
- [x] Quiet things are one line each at the bottom: cooldown reminders (opens the table), Soulcoiler kicks with no casts, everything not in this pull, names not in the pull, other note lines, and the NSRT note itself (Edit note and what's checked inside). The NSRT kick-count explanation is behind "How NSRT counts kicks".
- [x] Raid audit merged into the Player tab, renamed "Player audit": tonight's players on top, then this pull's flask / food / oil / potion / enchant tiles and a card per player; clicking a card shows that player's focus list, checklist, casts and gear sheet under it.
- [x] Night summary: rethink pending. Options A (debrief) + B (timeline) suggested; used after the raid, so A was built (round 58).

## 2026-10-15, round 56: report card, NSRT orbs and Guillotine, Gloombomb maps, all-pulls NSRT audit
- [x] Night summary report card on each boss card: S/A/B/C/D/F for Mechanics, Avoidable damage, Deaths and Interrupts plus an overall grade (weighted 30/30/25/15), each up to the wipe filter. Tonight: Mechanics A, Avoidable C, Deaths C, Interrupts S, overall B. Legend under the chart (each pull, best so far).
- [x] NSRT orb carriers rebuilt: read per phase from the note's timed reminders and checked wave by wave against real pickups (Mutagenic Venom = purple, Volatile Venom = green). Fixed: every row listed the same "picked up without being assigned" players; green and backup rows were judged on purple pickups; P3 rows showed as missed when P3 wasn't reached.
- [x] Guillotine: soak team, external and Zephyr merged into one panel, one row per drop, with spell icons for what was cast. Checked against raw casts: the drop 1 external was never cast (the evokers' Time Dilation was used only 7 times all night, never within 12s of a drop).
- [x] Gloombomb maps: every bomb row, clip row and Gloombomb mistake has a map with each carrier's 15 yd circle, all drawn the same (transparent mint); players clipped without a bomb get an orange !. P3 bombs with no adds get rows too.
- [x] NSRT audit with All pulls selected: a grid of every assignment against every pull (click a square to open that pull), who missed what across the night, and pull by pull. The tab stays on all pulls.
- [x] Clear pass/fail on the single-pull NSRT panels: ✓/✕/! row icons and tints, a result pill per row and a tally in each panel header.
- [x] Sidebar "All pulls" chip says "No kill" instead of "Night"; "1 players" grammar fixed.

## 2026-10-15, round 55: Night summary as one simple card per boss
- [x] "A simple easy to read/look at summary of all the pulls for each boss that was pulled": one card per boss, in the order first pulled, under a one-line header (bosses, pulls, time on bosses, kills).
- [x] Each card: where it stands (Killed on pull N after X wipes, or Best: phase and health, pull N), whether the later pulls got further, the progress chart, four numbers (pulls, time on the boss, furthest phase and how many pulls got there, deaths per pull), the three things that ended pulls most often, and a button to that boss's all-pulls Fight audit.
- [x] One-pull kills are a single compact line (time, deaths, Fight audit).
- [x] "Furthest phase" only shows for real phase names (P1/P2/Intermission/P3), not encounter-stage labels.
- [x] When some Warcraft Logs pulls aren't downloaded yet, the card says how many the causes are based on.
- Checked on tonight's log (30 Coiled Altar pulls) and an 8-boss Warcraft Logs report (25 pulls).

## 2026-10-15, round 54: Night summary revamped, MVPs on the Player tab
- [x] The Night summary is now about progression: Progress tonight (chart), tiles (pulls, best pull, furthest phase, time on boss, deaths), Focus for the next pulls (the most common pull-enders and what's getting worse), Where the pulls ended (phase per pull, a numbered square each), What ended the pulls (per wipe the earliest of the first death and the first serious raid-wide failure, ranked, with who died first), and Mechanics over the night (a square per pull per mechanic, getting better or worse).
- [x] The MVP podium and everyone's night scores (with the click-through breakdown) moved to the top of the Player tab ("Everyone tonight"); the per-pull player view is below ("This pull").
- [x] Multi-phase progress for The Coiled Altar: the phase reached plus that phase's boss health (P1 Zul'jan, P2 Malacrass, intermission Zul'jan, P3 both), as one number for the chart (each phase an equal share) and as a label ("P2 · Malacrass 66%"). Used in the header ("Wipe in P2 · Malacrass 71%"), the progress chart (phase bands), best pull, Last pull and the all-pulls Fight audit. Before, "boss health" mixed both bosses: a P1 wipe at Zul'jan 0.4% looked better than a P2 wipe. Warcraft Logs pulls keep WCL's own fight percentage.
- [x] Fixed "mech is not a function" in the player breakdown (a variable shadowed the spell-icon helper).
- [x] The start screen's Night summary preview shows how far each pull got and what ended the pulls.

## 2026-10-15, round 53: Venomfang dispels as a chart
- [x] The Venomfang table is replaced by a bar chart of dispels per player, plus "N dispels · M Venomfangs not dispelled". The all-pulls Fight audit shows the night's totals the same way (each pull up to its wipe filter): 117 dispels so far, Flëxørçïst 41, Huservoker 40, Urgdragon 26, 12 not dispelled.

## 2026-10-15, round 52: orb carrier rings on the maps (Coiled Altar)
- [x] Every Coiled Altar map now rings each orb carrier at that moment: purple 6 yd (Mutagenic Venom 1310691) and green 5 yd (Volatile Venom 1282288), from Wowhead's spell effects; the ring follows the carrier on animated maps. Players hit by a carrier's venom within 1.5s are marked with the red X ("hit by an orb carrier's venom"). Labels are a short "6 yd" / "5 yd"; the legend names them.
- [x] The Mutagenic Venom mistake said "within 8 yards"; the radius is 6.
- Ground orbs get no ring: Wowhead lists no radius for Virulent Mutation (1310544).

## 2026-10-15, round 51: list-and-detail layout for the bulky panels (option H)
- [x] Guillotine soaks, Phase changes, Tank frontals, Eternal Nightfall shields and Spiritcackle adds: a list on the left (one entry per soak / transition / frontal / shield / set, status dot and time; labels like "Guillotine · P1 · soak 1", "Sever · Vandagos") and the picked entry's details on the right (label/value pairs, or the set's table); it opens on the first problem, and Map opens inside the detail pane. Stacks into one column on narrow windows. Other panels are unchanged.
- Mockup options A to I are in the conversation if another panel needs a different treatment.

## 2026-10-15, round 50: all-pulls Fight audit simplified
- [x] The "Players across all pulls" report card is gone from the all-pulls Fight audit: it's the Fight audit with the pulls combined.
- [x] The avoidable damage chart is one line per source (name, danger, damage bar, hits, players); opening a source lists every player it hit (bar, hits, damage, pulls, deaths), tanks last. The per-pull trend and top-3 were dropped.

## 2026-10-15, round 49: All pulls keeps your tab
- [x] Clicking "All pulls" no longer jumps to the Night summary: on Fight audit it opens the all-pulls Fight audit, on Night summary it stays, and other tabs stay where they are (showing the latest pull).

## 2026-10-15, round 48: Raid audit on your own combat log (raid night)
- [x] The Raid audit only worked on Warcraft Logs reports. It now reads each player's COMBATANT_INFO line from the local log: stats, spec, all 18 gear slots (item, item level, enchant, weapon oil, bonus IDs, gems) and buffs at the pull. Buff names and item icons/quality aren't in the log, so they're looked up on Wowhead (cached) when the Raid audit or Night summary opens.
- Log format notes (12.1): stats are fields 2-5 (primary + stamina), 10-12 crit, 13 speed, 14 leech, 15-17 haste, 18 avoidance, 19 mastery, 20-22 versatility, 23 armor, 24 spec; buffs come in threes (caster, spell ID, stacks).
- Pull 22: 18/20 flasked, 19/20 fed, 20/20 oiled and enchanted, 8 without a combat potion. Night summary preparedness now uses this too.

## 2026-10-15, round 47: Avoidable damage panel (raid night)
- [x] One "Avoidable damage" panel per pull (Coiled Altar): a set per source, most harmful first, a row per player (hits, damage taken, died to it). A hit is one touch; ticks are listed under it. Sources from the encounter journal: Dangerous (red on any hit): tank frontals on non-tanks, Malevolent Resonance. Harmful: Noxious Ground, Axegrinder (tanks not judged), someone else's Gloombomb, Mutagenic Venom near a purple carrier, Defiled Ground. Minor: Volatile Venom near a green carrier, Toxic Deluge impacts. Raid-wide damage (Venom Rupture, Coalesced Venom, Dreadful Presence, Retaliatory Malice, Widow's Touch/Kiss, Fangs, Nightfall) is left out.
- [x] The separate Axegrinder panel folded into it; the all-pulls player totals now show "Avoidable hits" (all sources, tanks' Axegrinder excluded) and "Axegrinder hits".
- [x] (follow-up) In the all-pulls Fight audit, avoidable damage is one chart by source instead of a set per pull: a bar per source (damage, coloured Dangerous / Harmful / Minor, hit count), its hits per pull as a small bar trend, and the 3 players who walked into it most (tanks excluded on Axegrinder). Night so far: Axegrinder 333M / 1,068 hits (Ashdknight 92), Noxious Ground 264M / 585.
- [x] Shared avoidPanel() helper in engine.js, so the other bosses can get the same panel from a list of their sources. Twin Fangs still uses its own "Avoidable damage" panel.
- Pull 9: Axegrinder 75 hits (Ashdknight 11), Noxious Ground 34 hits / 16.7M, 2 ghost collisions.

## 2026-10-15, round 46: Gloombombs on their own (raid night)
- [x] New Fight audit panel "Gloombombs: breaking the Spirit Shields": per set, each add's shield (broken at +Xs, or how many of its 2 stacks were left), each player's bomb (hit this set's add, wasted on a leftover, or missed, with a map), and Gloombomb clips. "Spiritcackle adds: kicks" now has only first kicks, deaths and Wail of Terror kicks.
- [x] Bomb credit is checked against the shield stacks the log shows coming off: a bomb a few yards past the cutoff on an add that lost a stack is credited (pull 9: Schooty's bomb read 17 yd but broke the shield). Checked on all 6 sets of pulls 7 to 9: credited bombs match the stacks removed.
- [x] The Spiritcackle panel is hidden on pulls that never reached the adds (it showed an empty "Clean").
- [x] Venomfang dispels: "Dispelled by" showed an internal ID instead of a name; there's now a "Dispels by player" count (pull 9: Huservoker 3, Flëxørçïst 3, Urgdragon 1). The counts follow the rows shown (wipe filter, phase), and the panel is hidden on pulls with no Venomfang.
- [x] (follow-up) In All pulls the normal "Fight audit" tab is the all-pulls one (the separate tab at the end was easy to miss and the normal one jumped to the latest pull); clicking a single pull in the sidebar leaves All pulls and opens that pull's Fight audit.
- [x] Fight audit for "All pulls": a new tab "Fight audit · all pulls" (shown when All pulls is selected). Every mechanic panel lists one set per pull that had a problem with it (each pull cut at its own wipe filter), with "problems on X of Y pulls". At the top, "Players across all pulls": serious and medium mistakes, deaths, Axegrinder hits, most frequent mechanics, and pulls with a mistake. The Survival block is left out there (it's per pull).
- [x] New "Axegrinder hits" panel per pull: hits per player (one hit = one touch, ticks counted under it), damage taken, deaths to it; amber from 5 hits, red from 8 or a death; tanks listed but not judged. Pull 9: 75 hits on 19 players, Ashdknight 11.

## 2026-10-15, round 45: Guillotine external checks (raid night)
- [x] An assigned player who is the Guillotine target themselves now counts their own protection (pull 9: the paladin BoP'd themselves and was flagged as missing the BoP).
- [x] The axe target is no longer flagged as "Healer in Guillotine 2" (the game picked them).
- [x] When someone else covered the external (pull 4: Tyralien's BoP), the assigned player gets a Low "covered it instead", not a Medium miss.
- [x] A missed assigned Zephyr says when it was used instead ("on cooldown, used at 0:09").
- Note for the raid lead: the NSRT note contradicts itself on Guillotine 1. Text lines say Huservoker external + Kargaryen Zephyr; the timed reminders say Huservoker Zephyr at 0:45 and Kargaryen Zephyr at 1:23. Each evoker follows a different half, so both get flagged.

## 2026-10-15, round 44: maps on real logs, Gloombomb check (raid night)
- [x] Maps showed the floor but no players, orbs or bosses on the user's own combat log: the real log writes positionX (north) then positionY (west), and the Warcraft Logs translator had written WCL x/y in that order instead, so the maps were calibrated on swapped axes. The parser now stores [east, north] = [-positionY, positionX], and the translator writes WCL data in the real log's order. Checked: the user's pull 7 and the KGy report draw the same, and both first frontals face the entrance.
- [x] Gloombombs in Spiritcackle adds: one row per bomb carrier (melee/ranged from spec). Shows whether it landed on this set's add (which one, marked or unmarked), on a leftover add from an earlier set (wasted), or nowhere (distance to the nearest add), with a map of the 15 yd circles and the adds. Confirmed by the Spirit Shield stacks the log shows coming off (each add has 2; each bomb on it removes 1). Medium: missed the adds; Low: leftover add, or melee/ranged on the wrong add (only when the raid marked one of the set's adds). Generic: nothing is tied to player names.
- Pull 7: set 1 only Shockabunga's bomb hit (others 49 to 64 yd away); set 2 Huservoker and Kargaryen broke the leftover set 1 add, Dashtoswirly hit, Zaffia missed.

## 2026-10-15, round 43: NSRT Guillotine soak check (raid night)
- [x] "P1 Soak 2" was matched to soak 1: the number was read from "P1". The soak number now comes after "Soak"/"Guillotine", and "P1"/"P3" picks Guillotine or Grim Guillotine.
- [x] Immune soakers weren't counted: the axe "misses" Turtle/BoP/immune players (SPELL_MISSED), so they never showed as damage. Misses and the Guillotine debuff at the drop now count as being in the circle. (Pull 4: Schooty and Volkovod turtled soak 2 and were flagged as missing.)
- [x] The axe target isn't an "extra" soaker (the game picks them); players already dead at the drop aren't "missing".
- [x] "External Guillotine Target" and "Zephyr Guillotine" lines are no longer read as soak groups: they check that the named player put an external on the target (Zephyr doesn't count) or cast Zephyr for that drop.
- [x] "Soak Ghost at" lines aren't Guillotine soaks anymore.
- Verified on tonight's 6 pulls against the raw log: pulls 4 to 6 clean; pull 1 soak 2 (only Vandagos plus the immune target: wipe) and pull 3 soak 2 (a different group of 6 soaked) are real.

## 2026-10-15, round 42: live logging without a picker
- [x] Root cause: WoW lives under C:\Program Files (x86), and Chrome won't let a page pick files there (system folder), so neither the file nor the folder picker worked.
- [x] The local helper (server.ps1) now finds the WoW Logs folder itself (registry, then common install paths; a logs-path.txt next to start.bat overrides it) and serves the newest WoWCombatLog read-only (/log/info, /log/read; only WoWCombatLog*.txt names, opened so WoW keeps writing). "Follow my combat log" on the start screen uses it, shows which log it found, and switches when WoW starts a new file. The file and folder pickers stay as fallbacks (and for the hosted site).
- Tested on the real raid log in progress: pulls 1 (7:24 PM) and 2 (7:29 PM) appeared and opened. Needs start.bat restarted once to load the new helper.
- [x] The first restart didn't take: the 11:17 AM helper was still running and held the port, so the new one couldn't start. Restarted it; live logging confirmed in the user's tab (pulls 1 to 3). start.bat now closes any old helper before starting.

## 2026-10-15, round 41: live logging from the combat log file
- [x] Live logging now picks the WoWCombatLog file itself ("Choose your combat log"); the Logs folder is still an option underneath (follows new log files after a relog).
- [x] Fixed a likely cause of live logging failing in raid: WoW writes to the log nonstop, and Chrome refuses to read a file snapshot once the file has changed (NotReadableError). Reads now take a fresh snapshot per 8 MB chunk with retries. Pulls are also read the same way when opened.
- [x] Read errors now show in the sidebar and on the waiting screen (before, "checked …" overwrote them, so it failed silently).
- Tested with a simulated growing 55 MB log of two real pulls, 30% of reads failing: both pulls appeared with correct durations and the recap opened automatically.

## To do (from raid night)
- [x] Clock times in US 12-hour format (7:33 PM), not 24-hour (19:33): pull list start times, the pull tooltip on the night chart, and the live "checked 7:15:29 PM" time (the only times of day shown). Fight timers (0:43, 2:31) stay as they are; they're time into the pull, not a clock.

## 2026-10-15, round 40: new start-screen preview
- [x] The four small cards are replaced by one app-like window: a feature list on the left (click to switch, auto-advances every 7s with a progress bar, pauses on hover) and animated scenes for Fight audit (tiles, soak rows, an arena map with players walking into a soak and Sever popping orbs), Night summary (health by pull, MVP podium, score bars), NSRT audit (the note, assignments vs what happened, who missed) and Last pull (headline with boss health draining, wrong/well, fix first). Made-up data, no game art; respects reduced motion.
- [x] Last pull lists use just the mechanic name ("Eternal Nightfall"), not the full new title.

## 2026-10-15, round 39: clearer mechanic titles
- [x] Each title now names the mechanic plus what's checked (e.g. "Eternal Nightfall: break the shield, then kick", "Tank frontals: stacks and defensives", "Twin balance: kill them together", "Coiling Ichor: standing in a circle"). Spell names are kept so tooltips and Last pull matching still work.

## 2026-10-15, round 38: Eternal Nightfall kick confirmed
- [x] Encounter journal: Eternal Nightfall "is interruptible if the shield is broken". So break the shield, then kick. The Kicked by column is back (with the delay after the break); a cast that finishes after the shield broke is High: "nobody kicked Malacrass". How it works says to assign a kicker and a backup for every shield.

## 2026-10-15, round 37: Coiled Altar deep audit against the guide
- [x] Eternal Nightfall: now times the real absorb shield (1286912) instead of the cast aura. Shows how far into the 17s cast it broke and the time to spare (amber under 1s). Kicks on Malacrass aren't shown or judged: the test raid kicked him, but that's their habit, not a requirement. A finished cast is no longer counted as a "missed kick" anywhere.
- [x] P3 Spirit Shields: an unbroken P3 shield is Low (was High). The guide says kicks are enough on the late P3 sets.
- [x] Axegrinder: counted per touch, not per damage tick ("hit 52x" was 10 touches). Low by default, Medium from 5 touches; tanks aren't judged (the guide says they can mostly ignore it). Tip updated.
- [ ] Not checked: "the melee add's second kick goes to a melee player". Positions can't reliably tell which add is the melee one; tried and removed.
- Rule kept in mind: test logs are for game facts (spell IDs, timings) only; strategy comes from the guide.

## 2026-10-15, round 36: Coiled Altar "Interrupts" confusion
- [x] Malacrass's Eternal Nightfall isn't kicked: breaking his shield stops the cast, and the log records that as an "interrupt". Those rows are gone from the Coiled Altar Interrupts section (they're in Eternal Nightfall shields), so the section is gone and every kick is in Spiritcackle adds.
- [x] Fixed: after the "Soulcoiler 1/2" rename, the add rows lost their "first kick" and shield/death text and weren't listed first in each set.

## 2026-10-15, round 35: Coiled Altar kick maps
- [x] Kick maps show both Spiteful Soulcoilers of the set with their icon, animated from 3s before the kick to 1.5s after; the kicked one has a green ring and reads "Soulcoiler · kicked" (red "cast got off" when it wasn't kicked).
- [x] Bosses no longer show as adds on animated maps (Malacrass and Zul'jan are in the Coiled Altar unit list too).
- [x] Rows read "Soulcoiler 1: Wail of Terror" instead of "Wail, add 1", and the add rows use the same Soulcoiler 1 / 2 numbering.

## 2026-10-15, round 34: final pass before the soft launch
- [x] Automated sweep: every boss and the Mythic+ key, every tab, in both reports (11 entries × 6 tabs): no errors, no "undefined"/"NaN" text, no empty views.
- [x] Last pull on a Mythic+ key says "Timed!" / "Key timed" / "First run of this key tonight" instead of boss wording.
- [x] Pull list: every boss starts with an "All pulls" row (pull count, Killed badge) that opens that boss's Night summary; it stays highlighted there, and the page header reads "Mythic, all 7 pulls tonight".

## 2026-10-15, round 33: before raid
- [x] Speed check: the longest pulls analyse in about 1.3 to 1.5s with all the animated mistake maps (a pull not yet downloaded also waits on Warcraft Logs). No change needed.
- [x] Exploded-globule count in a set's line now stops at the wipe filter cut, matching the rows shown.
- [x] Start screen: "What you get" with four animated previews drawn in code (made-up example data, no game art): Fight audit (arena with a soak circle and players moving in), Night summary (boss health drawing itself plus an MVP podium), NSRT audit (assignments ticking off), Last pull (a recap appearing). Animations stop for people who turn off motion in their system settings.

## 2026-10-15, round 32: maps in the recap, Coiling Ichor circles, globules on maps
- [x] Last pull: each "What went wrong" line with a position gets a Map button that opens the animated arena map under it (the first death, and mistakes with positions; NSRT assignment lines have none).
- [x] Every medium or serious mistake now has an animated map (4s before to 2s after), and every death one of its last 5 seconds (also used in the Fight audit).
- [x] Coiling Ichor circles drawn on the maps, following each marked player and shrinking. Radius measured on 30 Mythic pulls: about 11 yd for the first ~6s, then down to about 6 yd at 10s (Wowhead: "increasing damage as it shrinks in area").
- [x] Caustic Globule soaks: one "Whole set" map per set with every soaker (green = soaked, red = extra globule, Bulwark hit or died), animated through the set; the soakers are still listed below it, without a map each.
- [x] Caustic Globules on the Twin Fangs maps (they log as Barbed Bulwark on Mythic); globule maps are animated.

## 2026-10-15, round 31: polish pass, Last pull tab, exploding globules
- [x] Polish: NSRT "not in this pull" is a slim line; Globule CC rule reads "Sets 1, 3, 5 go to…"; the Fight audit wipe-filter bar is one short line; "Fix these first" sits under the mechanic tiles; Night summary mechanic icons are the real spell icons; the "Load all pulls" bar is at the very top of the Night summary; the sidebar subtitle no longer wraps; a boss without its own checks says so instead of looking empty; "Interrupts Clean · …" spacing.
- [x] Player "Focus for next pull" follows severity (most serious first) and groups repeats ("Feast assignment (5x)").
- [x] New **Last pull** tab, now always shown as the first tab (red dot while live logging is on; live mode opens on it): the result next to the last pull and the night's best, what went wrong (first death, medium and serious mistakes by mechanic, mechanics worse than last pull), what went well (best pull / further than last, no early deaths, mechanics clean or improved, every kick landed, NSRT followed), and the top 3 fixes for the next pull.
- [x] Twin Fangs: globules that nobody soaked and that exploded on the raid are listed in red in their set ("Exploded unsoaked", players hit, map), and the How it works note says so.
- [ ] A set's summary line still counts explosions after the wipe filter cut (the rows themselves are hidden).

## 2026-10-15, round 30: Coiled Altar priorities, importance order, local live logging
- [x] Coiled Altar re-checked against the Mythic guides: the serious list already matched (orb collisions or leftovers, Eternal Nightfall finishing, Guillotine under-soaked, mind-control falls, ghosts touching, fragments reaching Zul'jan). Changed: an unbroken Spirit Shield in P3 is now serious (the adds enrage before the boss can die); P2 stays medium.
- [x] Importance order per boss (wipe-level first, minor last), used in every tab that lists mechanics: Fight audit sections (after problems-first) and tiles, and the Night summary's "How each mechanic went" (serious first, then medium, then clean; within each, by importance). Coiled Altar: orbs and frontals, Eternal Nightfall, Dreadmarch and ghosts, Guillotine, intermission fragments, Spiritcackle adds, phase pushes, tank frontals, interrupts, Venomfang. Twin Fangs: Broodling interrupts, Caustic Globules, Eternal Venom, Ravenous Feast, Tainted Blood, Stone Breaker, Corrosive Spit, boss balance, avoidable hits, Coiling Ichor.
- [x] Live logging from this PC: "Choose your WoW Logs folder" on the start screen (Chrome or Edge; remembered, one click next time). Follows the newest WoWCombatLog file, checks every 10 seconds, reads only what WoW added, and adds each pull when it ends. Warcraft Logs live reports still work from the same card.
- [x] Test local live logging during a real raid (tested with a simulated growing log; then used in raid on Oct 15 and it worked fine, per you).

## 2026-10-15, round 29: Twin Fangs priorities, from guides plus the raid's own logs
- [x] Serious (can kill or wipe): Broodling Visceral Burst getting through (Missed interrupt, raised from medium; guides call it "the cause of most wipes" and it wiped 10+ pulls in our report), a Caustic Globule nobody soaked exploding on the raid (new check: spell 1290338 hitting most of the raid at once), Tainted Burst from an unabsorbed fount (new mistake), dying at lethal Eternal Venom, dying in a globule soak, missing a Stone Breaker soak.
- [x] Medium (adds venom or big raid damage): a Ravenous Feast strike with fewer than 4 fresh soakers (new, raid), soaking a second strike while Feasted, Corrosive Spit bystander hits, Barbed Bulwark hits, an extra globule at high venom, Eternal Venom over budget, NSRT assignment misses.
- [x] Minor: Coiling Ichor stand-ins (medium only at 5+ hits, was 3), Sanguine Storm hits (damage only, was medium), an extra globule at low venom, kicks out of turn.
- [x] Night summary score: immunities removed from survivability (defensives 65%, combat potions 20%, Healthstones and healing potions 15%).

### To do (from the raid lead)
- [x] Create a logo: a gold shield with a "D" and a green check (sidebar, start screen and browser tab icon; drawn in code, no game art).
- [x] Overhaul the start screen: three cards (Live logging, Open a combat log, Import from Warcraft Logs). A pasted link opens directly with the saved login, or the one-time login form with the link filled in. Clicking the logo in the sidebar returns to it.
- [x] Remove the "Add rules" button.

## 2026-10-15, round 28: Twin Fangs NSRT audit, clearer
- [x] Same set bars and nested cards everywhere: every grouped Fight audit section on every boss (one shared renderer), and the Coiled Altar Soulcoiler kick table on the NSRT audit.
- [x] An opened set's rows are now a nested card: indented under the set bar, its own border and darker background, its own column headings (the list of sets has none).
- [x] Fight audit set lines: neutral bars with the status on the left edge and the pill only, a small gap between sets; an open set's rows sit indented on a darker inner panel with their own status rail, so sets and rows no longer blur together.
- [x] Each Twin Fangs panel leads with a verdict pill, the rule in one line, then "who messed up" (red = mistake, amber = took someone's turn, grey = for information); the full grids are under "Show details".
- [x] Feast: one line per player, all their Feasts together ("soaked Right's strike instead of their own, Feasts 1, 2, 4, 5"); soakers in no group (tanks) in one grey line.
- [x] Kicks: "missed their kick: a cast got through" on the player whose turn it was (red), "kicked on X's turn" (amber).
- [x] Globule CC: red only when the group on that set didn't CC at all; players with no CC in the log are one grey line (knockbacks and some stuns don't show).

## 2026-10-15, round 27: Coiled Altar check before raid night
- [x] Checked every Coiled Altar rule against the raw events of all 7 cached pulls. Confirmed: immune soakers count in Guillotine soaks (they log as immune hits); non-tank frontal hits are real (e.g. a Restoration Shaman taking Sever); Mutagenic Venom clips are real (it pulses on the carrier and anyone near them each second).
- [x] Mutagenic Venom: one stand-in now counts once per player (it used to be one medium mistake per 1-second pulse).
- [x] Dreadmarch "targets not stacked" only above 12 yards apart (6-10 yd is one marker spot plus movement and position sampling).
- [x] Boss Venomfang pinned to its own spell ID (debuff 1306906); a player ability shares the name.
- [x] Tooltips on every boss mechanic name: Fix these first, mechanic tiles, Night summary breakdowns and death causes; names that aren't spells (Death, Kick) no longer show an empty tooltip.
- [x] Raid cooldowns are now a scrollable timeline: phases, raid damage taken, a lane per boss mechanic (land time under each, tooltip with cast/land time and who it hit), deaths, a lane per player cooldown with its duration, guide lines from the big boss casts, a time cursor and zoom.
- [x] Fight audit section headers (every boss) have the tooltip: the mechanic's spell description plus the section's summary of the pull; Deaths, Defensives and Interrupts show the summary only.
- [ ] The six other Venomous Abyss bosses only have Deaths and Defensives sections until their fight audits are built.
- [x] Fight audit sets use one line per set (name, time, what happened, result); click to see its rows.

## 2026-10-15, round 26
- [x] Overview tab renamed **NSRT audit**; the NSRT assignments now lead the tab.
- [x] Coiled Altar NSRT (researched from the NSRT addon's own source, EncounterAlerts/TheCoiledAltar.lua + InterruptDisplay.lua): on Mythic, NSRT's built-in assignment is the Spiteful Soulcoiler kick boxes, read from an `intstart` … `intend` block. Line 1 = unmarked add, line 2 = marked add; optional lines 3-4 for P3, 5-6 for the 2nd P3 set (switches 159.2s into P3). Kick N on an add belongs to name N (repeating); a cast that gets through doesn't advance the count, so it was that player's turn. The audit shows each set's two adds with the rotation, who kicked in order, out-of-turn kicks (Low) and casts that got through and whose turn it was (Medium).
- [x] NSRT phase numbers fixed: intermissions are x.5 (Coiled Altar 1, 2, 2.5, 3), so `ph:3` reminders no longer point at the intermission.
- [x] Battle-rezzed players are no longer treated as dead for assignment checks (Twin Fangs and Coiled Altar).
- [x] Pull timeline chart removed from the NSRT audit.
- [x] NSRT audit is now only the note versus the pull: the overview tiles (DPS, HPS, deaths, mistakes, avoidable damage), "What happened" and the progression chart are off this tab. The help line says what's checked for the boss on screen.
- [x] Night summary: "Progress tonight" at the top, with boss health left at the end of every pull (from the report, no downloads needed), best-so-far line, and a card per boss in the report (click to switch).
- [ ] "What keeps going wrong" and "Players across all pulls" are hidden from the NSRT audit for now; bring them back on another tab.
- [ ] Heroic Coiled Altar: NSRT assigns Guillotine soaks by raid group order (first half / second half), not by the note. Not checked yet.

## 2026-10-15, round 25
- [x] Night summary: a block for every player with their score (Clean / Used / Prepared bars); click one for the breakdown: mistakes by mechanic, preparation misses, and a pull-by-pull table (result, deaths, mistakes, what was missing).
- [x] Score now includes preparation (20%): no empty gear slots or missing enchants, flask, food, weapon oil or stone; rank 1 enchant/oil and no augment rune cost a little. Local logs (no gear data) keep 70% clean / 30% used.
- [x] Night summary counts only medium and serious mistakes; minor ones are left out (score, blocks, breakdown, MVPs).
- [x] "How each mechanic went" counts only medium and serious mistakes per pull (Serious / Medium / Clean columns); mechanics with none all night are listed in one line underneath.
- [x] Score parts renamed and ordered: Survivability (was Used), Execution (was Clean), Preparedness (was Prepared).
- [x] MVPs: top three only, as a podium (1st raised in the middle, 2nd left, 3rd right) in a gold-trimmed "MVPs of the night" banner, with big portraits and scores; MVPs also get a medal tag in the Everyone grid.
- [x] Each player's three score bars are sorted best to worst.
- [x] Night summary respects the wipe filter for everything it counts (deaths, mistakes, Healthstones, potions, immunities).
- [x] Boss mechanics: a spell shown by name only now uses the ID from the log (or the report's spell list), so it gets its game icon and Wowhead tooltip.
- [x] Item tooltips use the app's own tooltip box (no Wowhead script, no double tooltips); item names come from the same data.
- [ ] Defensive use in the score still covers the whole pull (the "possible casts" count isn't cut at the wipe filter).

## 2026-10-15, round 24
- [x] NSRT (Twin Fangs): lead with the real assignments instead of healing cooldowns. Ravenous Feast groups (grid of group × Feast: all in / missing / not in group), Broodling kick order per area (the order restarts each set; in turn / out of turn / time to kick / casts that got off), Globule CC by odd/even set. Cooldown reminders and unchecked lines are folded away.
- [x] Raid audit: clickable character blocks (flask, food, weapon oil/stone, augment rune icons; missing first). Clicking opens a character sheet laid out like the game: gear with real icons, item level, enchants (rank 1 in amber, missing in red), gems, stats, consumables; Wowhead tooltips and item names on hover.
- [x] Enchant names come from the game's enchant table (wago.tools, build 12.1.5), including Thalassian Phoenix Oil, Oil of Dawn, whetstones and weightstones, hunter ammo and class imbues (Flametongue, Windfury, Rite of Sanctification…).
- [x] Wipe filter is now one setting in the sidebar and applies to every pull and tab (Overview deaths tile, tab counts, Fight audit, Defensives, Night summary).
- [ ] Empty gem sockets can't be detected yet (the log doesn't say how many sockets an item has).
- [ ] Damage and healing totals on the Overview still cover the whole pull (the wipe filter would need a re-analysis).

## 2026-10-15, round 23

- [x] App renamed **Debrief** (window title, sidebar, helper messages). The file is still WoW-Log-Analyzer.html so start.bat and the helper keep working.
- [x] Night summary tab (simplified), for the boss you're on: pulls, kills, best pull; "How each mechanic went" (pulls with a problem / could be better / clean, and whether it got better or worse over the night); **MVPs** (top 5: 70% clean play = deaths and mistakes per pull after the wipe filter, 30% using what they had = defensives, combat potions, Healthstones and healing potions, immunities); "Needs work" (3 players with the most deaths and mistakes, their most common mistake, missed NSRT assignments). A "Load all pulls" button downloads any pull not on this PC yet.
- [ ] Earlier "Night summary" note asked for standouts both ways and NSRT assignments: covered at a simple level (assignment misses show under Needs work). A deeper version can come later.

## 2026-10-15, round 22

- [x] Each mechanic's three list boxes (What went wrong / Could be better / What went great) are replaced by a short general synopsis: "Overall" (how it went, e.g. "A rough one, with only 63 of 83 soaks going cleanly"), "Main problems" and "Could be tighter" as plain themes with counts ("Extra globules taken at high venom (3) and deaths after soaking (2)"). No player lists; the table below has the specifics. Deaths get one line ("5 players died in this phase, all with a defensive, Healthstone or potion still ready").

## 2026-10-15, round 21

- [x] Set headers styled like the What went wrong / could be better / great boxes: soft tint in the status color, colored left edge, set number in a solid colored block, gap above.
- [x] Fixed color bleeding between sets: the gap was a thick transparent border, which merged into the row above (collapsed table borders). Now a real empty spacer row sits between sets.
- [x] Fixed "Died died" in the summaries (a value that already says its column isn't prefixed with it), and "What went great" no longer lists bits of amber rows ("Venom at extra soak 1 stack"); only clean rows and the good parts of red rows.

## 2026-10-15, round 20: polish pass

- [x] Sidebar: the Live button lines up with the other buttons.
- [x] Overview: with no NSRT note saved, the Assignments box is one line with an "Add NSRT note" button (was a half-page empty editor). Mistakes tile no longer counts deaths, so it matches "What happened".
- [x] Fight audit: one status pill per mechanic ("2 problems" / "4 could be better" / "Clean") instead of a badge plus a repeat count; removed the grey "Mythic audit: …" line under the header; tiles put "+N could be better" on its own line.
- [x] Guillotine table: in-circle count with "needs 5" under it, short target protection (BoP, Spellwarding), corners as NW / NE / SW / SE.

## 2026-10-15, round 19: Coiled Altar follow-ups

- [x] New "Tank frontals" check (Sever, Soul Sever, Blighted Sever): who took each, on which stack, and what they had up. Red: tank died or a 3rd stack; amber: a 2nd stack without two externals, or a missed P1 taunt swap. (Kill: Soul Sever 2nd stacks at 3:45 and 5:10 had one external or none.)
- [x] Crowd control on mind-controlled players: each Dreadmarch set lists the CC that landed on its targets (Ursol's Vortex, Chaos Nova, Grip of the Dead, Shockwave...); amber when none did.
- [x] Three levels for the remaining checks: Venomfang slow/missed dispel = amber (red only if they died with it); Gloombomb clip = amber (red if they died); P2 push late = amber, red once the next Soul Sever was due.
- [x] NSRT note in the Coiled Altar audit: Guillotine rows show the assignment (who was assigned but missing, who soaked unassigned); purple orb pickups by players not on the note's orb list are flagged. (Kick assignments were already checked.)
- [x] Venomfang: decide your raid's dispel rule (currently amber after 4s). Answered (Oct 16): dispel quickly, any healer; the 4s amber stays and How it works says so.
- [x] Set headers in tables stand out more: gap above, solid band, bigger title, thicker colored edge. "Wail of Terror (add 2)" shortened to "Wail, add 2". Tried a solid colored label on a tinted band (looked off); now: neutral slate band outlined on all sides, a bigger gap above it, and only the set name and summary in the status color.

## 2026-10-15, round 18

- [x] Removed "Mistakes by player" from the Fight audit (redundant: every mistake is on its mechanic's row). Its stack-sources grid went with it.
- [x] Mechanic boxes back, simplified: one slim chip per mechanic under "Fix these first" (icon, name, red/amber count or green check); click opens that mechanic. Made bigger; shown on every boss's Fight audit (checked on Coiled Altar, Twin Fangs and Nek'zali). Then changed to rectangular tiles in a grid (icon + name, big count with problems / could be better / clean, colored left edge): user liked it.

## 2026-10-15, round 17: Coiled Altar cleanup

- [x] The summary tiles at the top of the Fight audit (one per mechanic, repeating the badges below) are replaced by a "Fix these first" box: the 3 costliest problems of the pull, raid-wide failures first, with who and when. (Applies to every boss; answers the open tiles question.)
- [x] Interrupts merged into Spiritcackle adds: each set lists its adds (first kick, shield, death) and then every Wail of Terror cast (kicked by whom, or got off). A separate Interrupts section only remains for other kickable enemies (e.g. Malacrass himself).
- [x] Orbs and frontals: one number per frontal (orbs popped = stacks each player gained) with the plan under it; dropped the duplicate stacks column, the Plan column and the cone sub-line (the map still shows the cone).
- [x] Guillotine soaks: the plan sentence no longer repeats on every row (it's in How it works); soakers are player chips with a small badge for what they had up (Turtle, BoP, Bubble, Tank, Personal...).

## 2026-10-15, round 16

- [x] Smoother map animations: playback now redraws every screen refresh (~60 fps, was 5) at real-time speed, blending positions between frames. The log records positions about every 0.5s, so movement is smoother, not more detailed.

## 2026-10-15, round 15: Coiled Altar Mythic audit against the Tactyks guide

Read the full guide (Mythic Coiled Altar Guide and Fight Walkthrough, YouTube, Sep 2026) and checked every rule against all 7 Coiled Altar pulls, including the kill. App text stays neutral (no guide names).
- [x] Guillotine: needs at least 5 on Mythic (3 on Heroic/Normal); was 6 / 5. A soak with 4 wiped or killed people on pulls 1 and 3, which matches. Soak plan text rewritten (G1 = 2nd soak's immuners + tanky players, externals on target; G2 = tanks + 2 immunities + BoP on target; Grim 1 own spot, Grim 2 and 3 together; Grim 3 = over-send, no protection needed). New: immuners of the 2nd soak should also soak the 1st. Zephyr counts as protection. Unprotected target = amber, red if they died. Fixed: the Died column was red on every row.
- [x] Orbs per frontal: 5 to 6, never more than 7 (was "3 purple + 3-4 green, then 2 purple"). P1: second-to-last frontal 2 to 3, last one none. P3: first frontal takes every purple.
- [x] Fixed false alarms: the orb explosion when Zul'jan dies was counted as the last frontal popping 10 orbs plus a "purple collision"; a P1 Sever cut off by the push was counted. P3 mass stacks right after Defilement of the Coiled Altar now say "Defilement detonated the orbs still on the ground" (pull 3's wipe), not a collision.
- [x] P1 push: dropped the "push as Fangs starts" check (every pull, including the kill, pushed ~24s before Fangs). Now: stacks after the push (plan 9 to 11) and raid cooldowns stacked.
- [x] Intermission: 3 to 5 Spirit Erasure stacks per round, up to 10 when a raid cooldown is up (was "stop at 4"). New row: Zul'jan health when P3 starts (under 35% = on pace).
- [x] P3 ending: kill Zul'jan first with Malacrass at ~7 to 8%, then Malacrass (was "die within 5s of each other"). Kill: Zul'jan died with Malacrass at 4%.
- [x] Adds: first kick judged against the Gloombomb cast (kick once it starts), not "early on odd sets"; alive when the next set spawns = amber (the kill did this every set), alive two sets later = red; the last set of a phase isn't judged.
- [x] New: Eternal Nightfall shields (the P2/P3 damage check): broken in Xs, red if the cast finishes. Kill: all 4 broken in 14 to 16s.
- [x] Dreadmarch: stack on the raid's marker; new check for a ghost spawning far from the clump (someone moved before it spawned). Missed ghosts in Soul Sever = amber (walk it back for the next one).
- Not in the guide, unchanged: Venomfang dispels (still flags anything over 4s; open question from round 2).
- [x] Found and fixed: long pulls weren't saved on this PC (a 10-minute Mythic pull is ~514,000 events, ~140 MB; the browser refuses one saved value over ~133 MB, silently). Now saved in parts of 100,000 events; the kill reopens from disk instead of re-downloading.
- Note: the test report is a random public log, not our raid. Strategy rules come from the guide; the log only checks game facts (IDs, sizes, timings).

## 2026-10-15, round 14

- [x] Each death says why they died and what would have prevented it (Deaths rows: "What would have helped"; "Why + recap" opens the full explanation above the hits). Built from the last 10 seconds: killing hit and how fast health fell, biggest damage sources, little healing, the player's own mechanic mistakes just before (with their fix), avoidable boss spells, uninterrupted casts that hit them, room damage (e.g. Toxic Fumes), and defensives / Healthstone / potion still ready.
- Fixed on the way:
  - Death recaps only kept the last 16 events (under a second in heavy raid damage), so "X% to 0 in Ns" was wrong. Now the full last 12 seconds, measured from the last moment they were at 90%+.
  - Interrupts missed finished casts: a Visceral Burst that got off was counted as kicked because the add's next cast was kicked. Cast-bar spells that finish now always count as got off (pull 2: 1 at 1:45, which caused most of the deaths; kill: 1).
- [ ] Question: with the wipe filter at 2, Coiled Altar pull 3 (8:16 wipe at 16.9%) is cut at 0:40, hiding 167 results, because two players died early and the raid kept going.

## 2026-10-15, round 13

- [x] Wipe filter: default 2 deaths, typed in. Shown as a highlighted "Wipe filter" box at the top of the Fight audit with "change it any time", plus a "?" that explains why filtering matters (hover or click).
- [x] Deaths and Survivability tabs merged into the Fight audit (tabs are now Overview, Raid audit, Fight audit, Player).
  - Deaths is a mechanic split by phase: one red row per death (killed by, still had ready in amber, health drop) with a Recap button that opens the last 10 seconds under the row. Death badges elsewhere jump straight to that recap.
  - New "Survival" group at the bottom: Defensives (one row per player, red Poor / amber Okay / green Good, Details opens their defensive and potion use), Potions and Healthstones, Raid cooldowns.
  - The wipe filter also hides deaths after the cutoff; Survival is whole-pull.

## 2026-10-15, round 12 (voice)

- [x] Ravenous Feast soak circles on the strike maps. Size isn't published (server-side), measured from 5 pulls: ~8 yd. Each circle is placed around that strike's soakers (they stand ~20–25 yd from the boss each time).
- [x] Not black and white: a third, amber level, "Could be better", between red "What went wrong" and green "What went great". Rows get an amber "!", mechanics show "N problems, M could be better".
  - Twin Fangs grades: extra Caustic Globule = amber (red if taken at the venom budget or more, or a death); Barbed Bulwark hit = amber; Feast under 4 soakers = amber, repeat soaker or a death = red; Corrosive Spit 2nd spit = amber, 3rd spit or a bystander hit = red; Coiling Ichor 1–2 ticks = amber, 3+ = red; venom over budget = amber, one from lethal = red; Sanguine Storm 1–2 hits = amber, 3+ = red; Stir the Depths amber only when clearly above the raid's typical count; Stone Breaker miss = red.
  - [ ] Coiled Altar still uses only red/green; give its checks the same grading.
- [x] Feast deaths were counted in two strikes (1.5s apart); now only the last strike that player soaked.
- [x] Eternal Venom lethal on Mythic changed 9 → 10: five players reached 9 on the kill and lived.

## 2026-10-15, round 11

- [x] Corrosive Spit logic audited against the raw log of all 5 Twin Fangs pulls; the app now matches exactly (aims 28/14/32/11/33, spits fired 19/9/22/6/20, bystanders 0/4/2/2/0).
  - Findings: every aim ends in a finished cast or the add's death; no spit ever switched targets; every hit traces back to the add that cast it.
  - The target isn't always hit: standing right on the add (~1–6 yd) the line can miss them and still hit people further down it (pull 2 0:44, pull 4 1:43).
  - Fixed: aim ends are matched by add and player (two adds can aim at one player); removed a rule that could skip a bystander who had their own aim from another add.
- [x] Table is one row per spit ("Spawn 1, spit 2"), with its own map and a result: fired and hit the target / fired and missed the target / add died first, no spit. An add's 2nd or 3rd spit is flagged ("the add should have been dead"). Pull 5 set 4 = Spawn 1 fired twice at two players (4:18 and 4:25), which is why it showed two targets.

## 2026-10-15, round 10

- [x] Pull 5, set 1, spawn 3 showed 2 spits; really 1. Its 2nd aim (0:46) ended at 0:50.7 when the add died, 0.3s before the spit; no cast, no damage. A spit now counts as fired only when the add finishes the cast or the target takes the hit (the old "aim lasted ~4.5s" guess was wrong). Same fix corrects pulls 2–4.
- [x] Columns renamed: Spits fired / Aimed at (not at fault) / Hit without being targeted / Add died.

## 2026-10-15, round 9

- [x] "Not seeing the red X": checked the log. On the kill (pull 5) every spit hit only its own target, so no X is right. Pull 2 has four bystanders and they show the X. Across all 5 pulls only 5 players stood inside the band unhit, all at its very edge, so the 6 yd width holds.
- [x] The confusing part: aims whose add died before they fired were drawn like real spits. Now they're grey and dashed for their whole life ("never hit anyone"); live aims are green; the band turns yellow only when a spit actually fires.

## 2026-10-15, round 8

- [x] Spit line length: it goes past the target. Measured from bystander hits in pulls 2–4: hits up to ~51 yd out from the add, up to 2.7 yd off the center line. Now drawn 55 yd long and 6 yd wide (replaces the 4 yd guess).
- [x] Anyone hit by a spit they weren't targeted by gets a red ring + ✕ from the moment they're hit, on every map in that set (checked: pull 2, 0:44, four bystanders, all inside the band).
- [x] Better icons: bosses get a gold crest with a skull, tinted per boss (Vexhul / Ithraz differ); adds show their signature ability's real game icon in a red ring (Spawn of Vexhul = Corrosive Spit, Broodling = Visceral Burst). The journal only has one 128×64 portrait for both twins, so it isn't used.
- [ ] Higher-resolution maps. The Blizzard floor art is ~1 pixel per yard (Twin Fangs room ~100 px wide), which is why it's soft. Wowhead only serves it at that size. Sharper art would mean the in-game minimap terrain tiles (game files, BLP format). Not done yet.

## 2026-10-15, round 7

- [x] Corrosive Spit lines drawn at real width. Blizzard doesn't publish it: the line is a server-side area (areatrigger 42733), so it's drawn as a band of an **estimated 4 yd**. Measure it once a pull has bystander hits (the hit is the same spell, 1293295).
- [x] Adds drawn with a boss-style icon (Spawn of Vexhul), and every add up at the time is on the map (broodlings, globules), dropping off when they die.
- [x] Other targeted mechanics on the spit maps: Coiling Ichor targets (purple ring; circle size not published, areatrigger 42488) and the Stone Breaker circle on the tank (3.5 yd, SpellRadius 64).
- Notes from round 6 (death cutoff, survivability, night summary, name) are kept for later.

## 2026-10-15, round 6 (voice)

- [x] Corrosive Spit map: show the add positions and the spit line, animated from the moment the line is cast to when it goes off, so you can see people walking into it. (Done: adds as diamonds, green add-to-target lines that turn yellow as they fire, plays once then scrub with the slider; a red X appears when someone is hit.)
- [x] Set headers in the breakdown tables (e.g. "Set 1"): no ✕ / ✓ mark, only on the rows under them. Keep the color coding.
- [x] Remove the Damage, Healing and Damage taken tabs for now (they'll be redone as something else). The raid cooldown panel moved to Survivability.
- [x] Live logging for tonight: raid lead + me (+1 more) watching pull-by-pull recaps as the report updates. (Live button under the sidebar buttons: checks the report every 30s and adds a pull once it's finished; jumps to it if you're on the newest pull.)
- [x] Death cutoff: filter out events after N raid deaths, so wipe chaos isn't audited. (Built: on wipes the Fight audit stops at the Nth player death, default 4, set with a dropdown at the top and saved on this PC. Hides later rows, sets, phases and player mistakes, says how many were hidden; also used for the Overview mistake counts and the progression lists. Kills are always audited in full. Whole-pull totals, like peak venom stacks, aren't cut.)
- [ ] Survivability tab review: tell apart healthstones, combat potions, mana potions and other consumables by spell ID, plus defensives; what's appropriate per fight. Layout: player squares (portrait or class icon + name) that expand below when clicked, not one line per character.
- [ ] Night summary tab per boss (e.g. Coiled Altar, 7 pulls in a night): what's going badly, what's going well, players who stand out for mechanical failures and for great execution, including their NSRT assignments.
- [ ] App name: something more interesting than "WoW Log Analyzer". Ideas wanted.

## 2026-10-15, round 5

- [x] Twin Fangs: green lines that target a player. **Identified as Corrosive Spit** (Spawn of Vexhul adds; 5s aim debuff on the target, then the spit lands). Now its own section; Coiling Ichor is reframed as circles.
- [x] Twin Fangs audit improvements built (matched by spell ID): Boss balance, Eternal Venom budget, Ravenous Feast groups, Tainted Blood founts, Caustic Globule soaks + Barbed Bulwark, Corrosive Spit lines, Coiling Ichor circles, Stone Breaker. Checked on the kill (pull 5).
  - Not flagged: soaking back-to-back sets. The kill had ~15 globules per set for 20 players, so "alternate halves" doesn't fit.
  - To confirm: 12 players hit 7–9 Eternal Venom stacks and lived, so "lethal at 9 on Mythic" may be wrong. Coiling Ichor flags many non-targets (Preheat 8x); the first 1.5s are ignored as spread time.
- Original proposal: Corrosive Spit lines; Coiling Ichor as circles; Caustic Globule one-per-player + alternating halves + Barbed Bulwark pickups; Ravenous Feast 4+ per strike + no repeat soakers (Feasted); Tainted Blood founts (Tainted Burst); Stone Breaker tank soaks; Uncoiled Wrath / boss balance; Eternal Venom plan (stack budget per set). The target isn't at fault (the line moves with them), but anyone else hit by the line made a mistake (it adds Eternal Venom stacks).
- [x] Fixed checks that looked wrong: Phase pushes now compare to the Fangs/Soul Sever that was due; Venomfang only counts the boss's debuff (a player ability shared the name); Spirit Erasure is judged per raid soak round (it's a raid-wide stack).
- [x] Twin Fangs spell names confirmed on a real kill (all 7 found). Tainted Blood is a debuff, not a soak.

## 2026-10-15, round 4 (voice)

- [x] Under each mechanic, emphasize what went wrong in this pull: a quick synopsis people can read, for every mechanic on every boss. (Added a "What went wrong this pull" box under How it works, per phase.)
- Found while doing this: Guillotine "died in the soak" counted anyone who died near the drop, not just soakers. Fixed.
- [x] Remove the counts blurb under "What went wrong" (redundant with it and the table); its definitions moved into How it works.
- [x] Add a "What went great" section to every mechanic (clean results, plus the parts of a problem row that went right).
- [x] Breakdown tables: good rows green with a check, bad rows red with an X (set headers too).
- [x] Interrupts (Wail of Terror): map was off and the section wasn't in any phase. Rebuilt as a regular mechanic split by phase: a set per add, a row per cast (kicked by whom / got off with kickers' distance), new map viewer showing the add.
- [x] Clean results in "What went great" stay simple: "clean" plus the players who did it (e.g. "Dreadmarch #1 (2:39): clean (Telegon, Nutnut, Xyron, Tdyipce)").

## 2026-10-15, round 3 (voice)

- Context: the raid hasn't pulled The Coiled Altar yet; the audit is built from what the guides say.
- [x] Remove every mention of guide names (e.g. Method) from the app; keep wording generic, no author name. A sources/references section may come later.
- [x] Audits must follow what the guides say the strategy requires.
- [x] Each mechanic gets a short "How it works" note (what it does and what the raid should do), so the audit slowly doubles as a light guide.
- [ ] Later: a references section listing where the strategy information came from.

## 2026-10-15, round 2 (voice)

- [x] Phase titles (P1 Zul'jan, P2 Malacrass...) should stand out more than everything else.
- [x] Map buttons: keep them, but open the map right under the row it belongs to, not at the bottom of the section.
- [x] New **Raid audit** tab next to Overview: missing enchants, no flask on the pull, no combat potion on the pull. Use the actual Midnight flasks. Expand later. (Also shows food. Warcraft Logs reports only for now.)
- [x] Wants my feedback on the fight strategies: what to improve, add or clarify. (Answered in chat; open questions below.)

### Open questions for you (from the strategy review)
- Intermission: is the plan really "stop at 4 Spirit Erasure stacks"? Pull 3 flags 19 players at 5.
- Venomfang: dispel on sight, or only assigned dispellers? The 4-second flag may be too strict.
- Dreadmarch: does your raid stack the targets on the edge marker (Method)? If not, that check is noise.
- Spiritcackle adds: is "alive at the next Dreadmarch" acceptable in your strat?

## 2026-10-15, round 1 (voice)

### Maps
- [x] Show success vs failure on the map itself: green ring with a check for someone who did the mechanic right (e.g. in the Guillotine soak), red ring with an X for someone who got it wrong.
- [x] Maps "look pretty good" overall after the switch to Blizzard floor maps.

### Fight audit (all fights)
- [x] Remove the timeline panel at the top of the Fight audit (not needed).
- [x] Segment the Fight audit by phase, so mechanics are organized under each phase.
- [x] Every section collapsible (dropdown), so there's less scrolling at first.
- [ ] Open question: the summary tiles at the top still take a lot of room; remove them now that each mechanic shows its verdict in its collapsed row?

### Earlier notes still open
- Declutter ideas: "Fix these first" box; By mechanic / By player toggle.
- Coiled Altar: Dreadmarch mind-control paths; intermission fragment paths; P3 half-room layout.
- Maps: higher-detail art registered against the exact floor maps (optional).

