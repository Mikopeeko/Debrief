# Mythic+ run recap: how it works (Nov 1, 2026)

When a Mythic+ key ends, the Debrief app reads the whole key from your combat log and shows one recap on your PC. The recap covers the whole run and every pull. **Save this key** brings the same recap into WoW.

Research and plan: [Mythic+ run recap - gameplan.md](Mythic+%20run%20recap%20-%20gameplan.md). Each dungeon's lists: [Mythic+ must-kick lists.md](Mythic+%20must-kick%20lists.md).

## What Flex asked for
1. Mythic+ keys only: "the ONLY dungeon i want this enabled in is mythic+". No other dungeons, no delves.
2. The recap shows only at the end of the dungeon, never after each boss inside a key.
3. An outline of the run, with a tab for each pull, bosses included.
4. DPS, HPS, defensives, interrupts, and casts stopped with stuns, knockbacks and other crowd control. Flex asked "even if its not a true interupt?", and the answer is yes: those count too.
5. "filter by player too": your own key, and anyone else's.
6. "rotation break down pull by pull".
7. Must-kick lists for each dungeon (the list Flex picked).
8. The timer story: how close the key was to each upgrade, and what the deaths cost.
9. The in-game card.
10. A key you leave early.

## Status
- Everything is pushed for the next build.
- The app and addon release (0.7.3 / 0.5.68 or later) is **on hold** at Flex's word: "need to review the changes".
- Nothing here is live yet.
- Commits: 1763bbc (research) through 97e3e0a, Nov 1.
- The look belongs to the Design studio. Their audits:
  - PC pop-up: restyled (34ac1c3, bda8c4c, 2eca6ee, a568789).
  - In-game card: approved at 9/10 (234bc77).

## Where it shows
- **PC pop-up:** the moment the key ends (CHALLENGE_MODE_END), or the moment the group leaves the dungeon.
  - Keys that were already over when the app opened don't pop up.
  - Inside a key, there are no boss pop-ups.
- **In WoW:** 12 s after the key ends (CHALLENGE_MODE_COMPLETED), the strip says "Your Altar of Fangs key isn't in the addon yet." **Save this key** does one /reload.
  - Bosses inside a key no longer offer Save this pull.
  - In the big window's saved list, a key reads Key · Timed / Over time / Left early. Picking it opens the key's card; the big window is for raid nights.
- **The site:** not on the site.

## What the recap shows
- **Run tab, Me** (opens on you; the arrows step through the group; tap any name to open that player):
  - the Timer
  - your numbers
  - what got through while your kick was ready
  - your deaths
  - avoidable damage
  - rotation across the key
  - your key, pull by pull (tap a pull to open it)
- **Run tab, Group:**
  - the Timer
  - what got through, with whose kick was ready
  - avoidable damage
  - dispels and purges
  - each player's top rotation fix
  - Everyone's numbers
- **A pull, Me:**
  - what got through on your kick (repeats grouped, with times)
  - deaths
  - avoidable damage
  - your rotation fixes and what went well
  - kicks and stops, each with its time
  - defensives
  - dispels
- **A pull, Group:**
  - what got through
  - avoidable damage
  - kicks and stops by player
  - deaths
  - each player's top rotation fix
  - defensives
  - dispels and purges
  - damage and healing
- **Pull buttons:** coloured by what happened in each pull. Red is a death or 3+ casts through, amber is anything else, green is clean.

## How it works (the pipeline)
1. `src/engine.js` `createIndexer({ dungeons: true })`, used by the app only, lists keys.
   - A key ends at CHALLENGE_MODE_END, or at a ZONE_CHANGE out of the dungeon. "UNKNOWN AREA" is a loading screen, not leaving.
   - WoW writes a left key's end line only when the next key starts.
   - The app's scanner (`companion/app/Scan.cs`) passes key and zone lines to the app.
2. `companion/companion.html` `mplusShow(r)`:
   - reads the key's bytes
   - runs `DBF_MPLUS` (`companion/mplus.js`), then `DBF_MPLUS_ROT`
   - posts the result to the pop-up
   - saves `RECAP.encodeMplus(R)` for the addon (`/addonpull`)
3. `companion/popup.html` `renderMplus()` draws the pop-up.
4. `companion/addon/Debrief/Debrief.lua` reads the M lines (`decode`), and `UI.mplus(raw)` draws the key on the card.

## How it decides
- **Pulls:**
  - Each boss is its own pull.
  - Trash starts a new pull when new enemies are engaged after the last pack died, or after a 4 s lull.
  - A lone enemy for under 8 s folds into the pull before.
- **Kicked or stopped:**
  - Kicked: a kick on that enemy and spell within 6 s of the cast starting (8 s for a channel).
  - Stopped: a player's stun, knockback, silence, disorient or fear on the caster from 0.2 s before to 4 s after.
- **Got through:**
  - A cast on the dungeon's must-kick list counts when it finished while someone's kick was off cooldown. With nobody's kick ready, it isn't a mistake.
  - A list entry can name its caster: Light Bolt@Kezkitt.
  - Channels (Ice Shield, Health Funnel, Fel Missiles, Felstorm, Mending Void, Essence Disruption) show only when they start.
  - "Stop with CC" casts count when the enemy gains their result (Evolve, then Evolved).
  - A dungeon without a list falls back to "a spell somebody kicked at least once this key".
- **Avoidable damage:**
  - Only a dodge-list spell's direct hits count, never its damage-over-time.
  - It never counts against a tank.
  - Standing in a beam or breath counts as one hit until you've been out of it for 1.6 s.
  - A puddle (Rotten Ground) counts once each time someone steps in and it ticks.
- **Dispels and purges:**
  - A debuff taken off is a dispel; a buff taken off or stolen is a purge or soothe.
  - Removing a debuff from a friendly NPC counts as a dispel (Altar's Cursed Bones).
- **Deaths:**
  - A UNIT_DIED ending in 1 is Feign Death, not a death.
  - Each death shows the biggest hit in its last 5 s and whether a defensive was used in the 30 s before.
- **The timer:**
  - Timers come from Wowhead. Altar of Fangs is 29:00 from its own page; the season table says 30.
  - Two levels at 80% of the timer, three at 60%.
  - Death cost is measured, not guessed: WoW's final time minus the time that passed (less the 10 s countdown), rounded to 5 s. It's 15 s per death at +12.
  - Checked against Raider.IO's upgrade stars on every key it could see.
- **Rotation:**
  - Each pull is read as its own fight by the website's engine, then run through the website's Rotation checks, with the card's short lines.
  - Potions, raid openers and mana at the end aren't judged.
  - A big cooldown's "uses" counts on bosses only.
  - About 0.2 s a pull.

## Testing
All of this is in the chat's scratchpad, which is temporary: rebuild from these steps if it's gone.
- **Real keys** (archived logs in `Logs/RaiderIOLogsArchive`, never the log WoW is writing):
  - `mp-keys.js` runs every key in a log through the recap and prints a summary.
  - `key-names.js` checks every list name against the keys.
  - `key-trash.js` finds trash that hit only some of the group.
  - `left-test.js` checks where keys end.
- **The pop-up:**
  - `mp-test.js` runs headless Edge through every key, player, view and pull (1,884 views, 0 errors on Nov 1).
  - `pop-test.js` covers the boss card.
- **A look in a browser:** `mplus-preview/mp-serve.js` in the shared notes folder, with sample keys and a README. Run `node mp-serve.js`, then open localhost:8791/?key=4.
- **The addon:**
  - the fake-WoW everything test `run98.js` with `pulls-mplus.lua` (a raid night plus keys)
  - `strict/check.js` (WoW's 60-upvalue rule)
  - `wowdraw.js` with `sc-mplus.lua` and `sc-mpbig.lua` for pictures
- **Finding a key's log:** the Raider.IO public API (`/api/v1/characters/profile?...&fields=mythic_plus_best_runs,mythic_plus_alternate_runs,mythic_plus_recent_runs`) gives each run's date. Don't scan the 74 GB archive.

## Lessons
- **Envenom:** looked like a must-kick because groups kick it, but the guide says dispel it. A "kicked at least once" rule gave 17 false alarms on one key.
- **Look-alike names:** a trash mob casts a spell of the same name as a boss's (Light Bolt). Scope by caster.
- **Hits everyone:** some "dodge" mechanics hit every player on each cast (Hailburst, Cosmic Crash, Dark Bloom, Demonic Rage). Check direct hits per cast before calling one avoidable.
- **Aimed spells:** spells aimed at a player (Laced Edge) can't be dodged. Read each spell's Wowhead text (nether.wowhead.com/tooltip/spell/ID).
- **Wowhead pages:** they need the built-in browser (web fetch gets the page shell only). Warcraft Logs' website shows a human check: don't use it.

## Next season
1. Update `LISTS` and `TIMER` in `companion/mplus.js` from the new Wowhead dungeon pages.
2. Check every name on real keys with key-names.js.
3. Sort trash with key-trash.js and the tooltips.
4. Update the must-kick lists note.
