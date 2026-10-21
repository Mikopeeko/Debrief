# Debrief in game - how it works (test version 0.1, Oct 21 2026)

Your pull recap inside WoW, after every boss pull. Built for the raid test on Oct 21.

## The parts
- **Debrief Companion** (`companion/`): a small PC app. `Debrief Companion.bat` starts `companion.ps1` (PowerShell, nothing to install,
  port 8772) and opens its window (Edge app mode). The window is `companion.html`; the recap is built in `recap.js`.
  It reads Debrief's own engine and Rotation checks from the app file (`Debrief.html` in the download, `WoW-Log-Analyzer.html` in the project),
  loaded in a hidden frame, so the words are the same as on the website.
- **The Debrief addon** (`companion/addon/Debrief`): Debrief.toc, Debrief.lua, Bindings.xml, the site's Barlow fonts (free to share, OFL) and the shield logo.
- **Download**: `Debrief-in-game-v0.1.zip` in the project folder (both parts plus "How to set it up.txt").

## Why it needs the PC app (your question, Oct 21)
- WoW addons can't read files or the internet while the game runs. The only ways in: something typed or pasted in game,
  messages from other players' addons, or the addon's saved file (read only at login or /reload, and WoW overwrites it when it saves).
- Midnight blocks combat data for addons in combat, so the addon can't build the recap itself.
- Warcraft Logs isn't needed: the app reads your own WoWCombatLog file, which is faster than waiting for an upload.
- Programs that press keys inside WoW are against the rules, so one paste stays.

## The flow
1. The app finds the WoW Logs folder (logs-path.txt, the registry, common install paths, or a folder you paste) and installs/updates the
   addon in `_retail_\Interface\AddOns\Debrief` by itself.
2. It always watches the newest WoWCombatLog file (and switches when a newer one appears). A fast scanner finds the ENCOUNTER_START/END lines.
3. When a pull ends it reads that pull (2-5 s), builds the recap, copies a short code (`DBF1^...^Z`) to the clipboard and plays a chime.
   Tested: a pull written to the log was copied about 15 s after its last line.
4. In WoW the paste box pops up by itself 4 s after each boss pull (for whoever has pasted before). Ctrl+Shift+D opens it too
   (set on first login if the key is free; change it in Options > Keybindings > AddOns). Ctrl+V and the card shows.
5. The addon then sends the code to the group (RAID / INSTANCE_CHAT addon messages, ~230 bytes a part, about 3 parts a second;
   waits out Midnight's lockdown during a boss, code 11, and retries throttles 3/8/9 like BigWigs). Everyone with Debrief gets their
   card by itself, after combat. About 70 parts for a 25-player raid, ~25 s.

## The card (the website's look)
- Header: shield logo, Debrief, boss and difficulty, close. Chips for the last 5 pulls (Kill green, Wipe red, the open one in gold).
- Result: "Kill!" or "Wipe at 39%", time, phase, deaths.
- **Me** (opens on your own character; arrows to look at anyone): a tile with your damage or healing a second, against your last pull and
  your best of the night, and your place among the healers or DPS. **Rotation**: the 3 Rotation checks that cost the most (the website's
  focus list), one line each. **Boss mechanics**: your own mistakes on the pull, then your death. **Next pull**: the top check's tip.
- **Raid view** (on for everyone in this test; `/debrief raid` turns it to leads and assists only): top 3 mistakes with names in class
  colours, who died first and to what, and the Next pull line.
- No guide or site names: "Wowhead:" and "(Wowhead and Icy Veins)" are taken out of the tips.

## Commands
`/debrief` show or hide · `/debrief paste` · `/debrief raid` · `/debrief share` (send your pastes to the group, on by default)
· `/debrief auto` (paste box after each pull) · `/debrief reset` · `/debrief clear`

## Tested
- The Lua runs against a fake WoW (scratchpad luatest/run.js with fengari): load, paste a real 17 KB code, both views, share in 74 parts,
  a second raider rebuilds it, the paste box after ENCOUNTER_END. Not yet seen in the real game.
- Interface 120105 matches the live client (12.1.5.70448); 120107 for the 12.1.7 test realm.
- Screenshots: notes/In-game addon - Oct 21/.

## Next ideas
- Smaller codes (faster sharing), a minimap button, and a real in-game screenshot pass after tonight.

## Version 0.4 (Oct 21, the user's "do whatever you want, make it amazing")
- **Big window** (Expand on the card, `/debrief big`, or Settings > Big window to open it after every pull instead of the card):
  saved pulls on the left grouped by boss (click one to open it); on the right the pull's header, Me / Raid view, three tiles
  (your number vs last pull, your best tonight, your place or your goal %), a line of your numbers pull by pull, Rotation, Boss
  mechanics, Next pull; on the right side "Progress tonight" (a bar per pull, the kill in green, the closest wipe in the accent colour),
  the raid's top mistakes and who died. "Tonight" = the same boss and difficulty within 10 hours of the pull. Post to raid chat sits
  on top for leads and assists.
- **Settings with a side menu**: The card (What it shows, Raid view, Size and font, Style), Other views (Big window, Mini bar),
  Extras (Goals, Raid lead, After a pull, Saved pulls). Simple / Medium / Heavy stays on top of "What it shows".
- **Style**: accent colour (Debrief gold, your class colour, Frost, Fel, Crimson, Void), card style (Panels, Glass, Flat), only what
  went wrong, colour-blind colours (blue good, orange bad), lock in place, hide during combat (on by default; back after the fight),
  close by itself (never, 30 s, 60 s, 2 min; never while the mouse is on it).
- **Mini bar** (`/debrief mini`): one slim line after each pull: pull, result chip, your number with the change, slips, goal %. Click it
  for the card; drag it anywhere.
- **Goals**: a damage and a healing goal in thousands. The first + starts a little above your latest pull. The card gets a goal line
  and a thin bar (green once reached), the mini bar a goal %, the big window a Goal tile. Only on your own numbers.
- **Raid lead**: Post the pull to raid chat (headline, top 3 mistakes, first deaths if wanted, the Next pull line). Can post by itself
  after your own paste, only when you lead or assist (off by default).
- Fixed on the way: "any other key closes the paste box" never worked (a misplaced variable), and `/debrief log` errored.
- New commands: `/debrief big`, `/debrief mini`, `/debrief post`.
- Tested in the fake WoW (every settings button clicked, big window, mini bar, styles, goals, raid chat, combat hiding).
  Not yet seen in the real game. Screenshots 20 and 21 in notes/In-game addon - Oct 21/ (a browser copy of the look).
