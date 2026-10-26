# Debrief 1.0: release checklist (drafted Oct 24)

The plan for next week: **no new features**, fixes only, sent together in one update, never during raid time.

## 1. Waiting in the next update (built and tested, not released)

- **/reload reminders:** a gold line on the PC pop-up after an update ("Debrief was updated. Type /reload in WoW when you're ready."), gone by itself after the /reload; one chat line after you change /db.
- **Problems get caught:** if the addon hits an error, it notes it (the last 10), says one plain line, and keeps working. **Report a problem** in the app's footer sends your words, the versions and those notes to the project's GitHub.
- **Key levels:** dungeon bosses in a key show "Mythic+ 12", not just "Mythic+".
- **Card and pop-up match:** no lone "Pull 1" button on the card, Simple is the short card in the pop-up too, and Standard's pop-up has Who died like the card.
- **Checked:** the Detailed card fits 4:3, 1080p, 4K at 150% and ultrawide, at card sizes 1.0 and 1.5.

## 2. Fresh-install test (a friend's PC, or a new Windows user)

Tick each one; note anything that feels confusing, not just what breaks.

1. Open the download page on debriefme.io. Download and run the installer. Windows shouldn't warn (the app is signed).
2. The app finds WoW by itself (or asks once, clearly).
3. The app puts the addon into WoW. Log in: the **guided setup** opens by itself after a few seconds.
4. Walk through the setup: pick a style, tick a few things, Done. The chat says "all set".
5. Combat logging shows **Logging: On** at the bottom of the card.
6. Hit a training dummy for 20 seconds, stop. A pop-up appears on the PC with the rotation.
7. Pull a dungeon boss. The pop-up shows the **Me** tab only.
8. Raid boss pull. The pop-up shows the card, on **you**, on **Me**.
9. Type **/reload**, then **/recap**: the same card as the pop-up.
10. Change something in **/db**, close it: one chat line about /reload.
11. Leave the app running for an hour: nothing pops up out of nowhere.
12. **Report a problem** in the app: send a short test, and it lands as a GitHub issue.

## 3. Beta week

- **Who:** 3 to 5 raiders from other guilds: a tank, a healer, a few DPS, at least one who runs keys.
- **What they get:** the download link and three lines: install it, play normally, press Report a problem if anything feels off.
- **Every morning:** read the new GitHub issues, fix the real ones in one batch, send one update before raid time.

## 4. Release notes, 1.0 (draft)

> **Debrief 1.0: your recap after every pull, in game.**
> - After each boss pull, your recap pops up on your PC: what you did well, what to fix first, and one thing to try next pull.
> - Type /reload in WoW and the same card is in game on /recap.
> - Three styles (Simple, Standard, Detailed) or your own mix in /db, with a live preview.
> - Your rotation, worst fix first, with each ramp or burst window; boss mechanics; survival; who died and why.
> - The raid's view for leads: what wiped us, every mistake, deaths and avoidable damage.
> - Dungeon bosses too, with your own view.
> - A guided setup the first time you log in.

## 5. How it works (one page, draft)

1. **Install Debrief Companion** from debriefme.io. It puts the Debrief addon into WoW for you.
2. **Raid or run keys as usual.** When a boss pull ends, your recap pops up on your PC.
3. **Type /reload** in WoW when it suits you. The recap is then in game: **/recap** opens it, **/db** changes what it shows.
4. **Updates arrive by themselves**, between pulls. A gold line tells you when to /reload.

## 6. Privacy (draft, checked against the app's code)

> Debrief reads your combat log **on your own PC** and never uploads it. It goes online only to check for updates (debriefme.io), to show spell icons and tooltips (Wowhead), to load its fonts (Google Fonts), and to send a report when **you** press Report a problem. If you open the website from the app, your browser reads tonight's log from the app on your PC to show the full breakdown; Chrome asks you first.

## 7. Release day

- Version **1.0.0** for the app and the addon, one release, not during raid time.
- A New features card on the Patch notes page; the Discord post goes out the next morning by itself.

## 8. Guild launch and beta (Oct 25)

The user: launch to the guild this week and invite more beta testers. The drafts (guild post, beta forum post, invite message) and the launch-week checklist are in notes/Debrief in game launch - Oct 25/posts.md.
