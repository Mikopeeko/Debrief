# Mythic+ run recap: gameplan (Nov 1)

**Status:** every phase is built and pushed for the next build. The app and addon release is on hold for Flex's review. How it works now: [Mythic+ run recap - how it works.md](Mythic+%20run%20recap%20-%20how%20it%20works.md).
Flex's decisions:
- One tab per pull (not per boss section).
- No boss pop-ups inside a key, then the full recap.

Flex: "I want the dungeon module of this to only show at the end of a dungeon, and i want it to outline the run, and have tabs to look
at each pull to show the mistakes on that given pull, bosses included... DPS, HPS, Defensive usage, interupts, stopping casts with
disrupts, stuns etc." Mythic+ keystone dungeons only.

## What matters after a key (research)
- **Players and M+ tools review the same things:**
  - Deaths first, and why
  - Kicks and stops on the dangerous casts
  - Avoidable damage by mechanic and player
  - Defensives in big pulls
  - Dispels and soothes
  - DPS and HPS
  - Where the time went: pull lengths and the timer
- **What today's M+ addons can't see:**
  - Since Midnight, addons can't read the combat log. They only see Blizzard's damage meter. Examples:
    - MPlusKick (kick counts)
    - M+ Stops (kicks and CC)
    - Pullscope (avoidable damage)
    - Mythic+ Meta Scoreboard (end-of-run table)
  - So none of them can say which dangerous enemy casts got through, or who stunned what.
  - Debrief's PC app reads the full combat log, so it can. That's our edge.
- **Season rules that change the story** (wiki, Feb 2026; recheck in game):
  - Lindormi's Guidance at +2 to +5: deaths cost no time.
  - Xal'atath's Bargain from +5.
  - Tyrannical or Fortified from +7, both from +10.
  - Xal'atath's Guile from +12: deaths cost more time.

## What the logs give us (checked on Flex's Oct 25 +10 Altar of Fangs, 15:24, timed)
- **Key start:** `CHALLENGE_MODE_START`: dungeon, key level, affixes.
- **Key end:** `CHALLENGE_MODE_END`: timed or not, level, total time in ms, and the score change.
- **Inside one key:**
  - 6,553 enemy cast starts
  - 29 kicks, each with who kicked which mob and which spell
  - every death
  - 21 dispels
  - the 3 boss fights
- **Pulls:** a pull starts when new enemies are engaged after the last pack is dead (or after a quiet gap). It gives 8 pulls with what was in each, for example "16 Blade of the Altar, 15 Hatchlings, 6 Living Venoms", and bosses come out as their own pulls. The splitting needs tuning on more keys; chain pulls merge.

## The recap (one per key, at the end)
1. **The run at a glance:**
   - dungeon, level, affixes
   - time against the timer: +1/+2/+3 or over, and time lost to deaths
   - score change
   - four tiles: casts that got through, kicks and stops, avoidable damage, slowest pull
2. **A tab for each pull** (trash and bosses), coloured by how it went: its length, and what was in it.
3. **The pull's mistakes**, in plain lines:
   - Dangerous casts that got through: who could have kicked it, who was in range.
   - Kicks and stops per player (stuns, knocks, disorients, silences: anything that stopped a cast).
   - Avoidable damage by mechanic and player.
   - Deaths, with what was unused (defensives, Healthstone).
   - Dispels and soothes missed.
4. **Per player for that pull and the whole key:** DPS or HPS, kicks, stops, defensives used, avoidable damage. **Me** and **Group** views, like Me and Raid view.

**Where it shows:**
- the PC pop-up the moment the key ends (`CHALLENGE_MODE_END`)
- the in-game card, with Save this pull
- no pop-ups after each boss inside a key

## Build in phases
| Phase | What | Rough size |
|---|---|---|
| 0 | Inside a key: no boss pop-ups. One pop-up when the key ends, built from what we have (the bosses' recaps plus the run outline). | half a day |
| 1 | Engine: split a key into pulls. Per pull: enemies, length, deaths, kicks, stops (a cast that started and never finished while the caster was stunned, knocked or silenced), dispels, defensives, DPS/HPS, avoidable damage hits. | 1–2 days |
| 2 | Knowledge per dungeon (8 in the pool): which casts must be stopped, and which damage is avoidable. From the guides first (Wowhead, Icy Veins), then checked on top keys from Warcraft Logs (the log library). | 2 days |
| 3 | The app's recap model and the in-game record format for a whole key (one recap with many pulls; watch the addon's file size). | 1 day |
| 4 | The look: Design studio designs the pop-up and in-game card (outline, pull tabs, mistakes), and we build it. | 1–2 days |
| 5 | Test on Flex's real keys (Oct 24, 25, 27 and newer), then a practice build. | half a day |

## Decisions for Flex
- Start with Phase 0 (quick, stops the per-boss pop-ups in keys), or wait for the full recap?
- The tabs: one tab per pull, or one tab per boss section (all trash before a boss together)?
