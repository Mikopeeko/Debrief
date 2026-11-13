# Answer key: how it works (Nov 13, 2026)

Flex, Nov 13: "they keep coming back seems to be my biggest issue" (fixed bugs returning). The answer key is the fix: real raid
nights whose facts are written down once, from the raw log, and every build is checked against them.

## What it is
- `tests/answer-key/<report code>.json`: one file per night. Each pull has its facts (below).
- `tests/answer-key/raw-facts.js`: the reader that gets those facts from the Warcraft Logs events. **It uses none of the site's
  code** (no engine.js, wcl.js or ui.js), so the key can't repeat a mistake the site makes.
- `tests/answer-key/roots.js`: what ended each pull, judged by hand from the log, with the events that prove it.
- `tests/answer-key/make-key.js`: puts the two together and writes the key file.
- `tests/answer-key.js`: the check. It runs the site's own engine on the same saved pulls and compares every fact.
- `tests/answer-key/known.json`: mismatches already reported, waiting on the chat that owns that tab.

## The nights in it
| Night | Report | Pulls |
|---|---|---|
| Nov 11, The Coiled Altar Mythic | `agt6jMTyZBYvVzAP` | 19 wipes (fights 2 to 20) |
| Nov 12, The Coiled Altar Mythic | `Gax3AkbyFRXmdrgQ` | 6 wipes and the kill (fights 3 to 9) |
| Nov 12, Ula'tek Mythic | `Gax3AkbyFRXmdrgQ-ulatek` | 13 wipes in phase 1 (fights 11 to 23) |

A second boss of the same night gets its own file (`<code>-<boss>.json`). Ula'tek has the facts every boss has (length, boss health, totals, deaths and killing hits, kicks, potions, flask, food, rune) and each wipe's cause from the Ula'tek chat's proof table, with the deaths re-read here. Its mechanics and death verdicts are not in the key yet: `raw-facts.js` and `death-rule.js` need an Ula'tek block first.

## The facts, and how each is read from the log
| Fact | How it is read |
|---|---|
| Kill or wipe, length | the report's fight table and the encounter end event |
| Phase reached | phase 2 starts at Malacrass' first cast; the intermission is Zul'jan's Ghastly Regeneration; phase 3 starts when it ends |
| Boss health at the end | each boss's last health reading in the events (Warcraft Logs' own two percentages are kept beside it) |
| What ended the pull | by hand: the last minute of every wipe read event by event (`roots.js` has the sentence and the proof) |
| Damage done | each hit's amount on enemies, pets counted for their owner. An Augmentation Evoker's share of a hit is its own event and comes off the buffed player, as Warcraft Logs does it. Damage a boss's shield absorbed is kept apart (`dmgShield`) |
| Healing done | heals (with the part a heal absorb ate) plus the damage the player's shields absorbed. Shields that only stop a killing blow (Cheat Death, Purgatory) are kept apart as `absorbCheat`: the site leaves them out |
| Time alive | the pull's length less the time between each death and the rez after it |
| Deaths | every death event on a player (a Hunter's Feign Death is marked in the log and left out), the killing hit the log names, the last three hits, health every 2 s for 10 s, seconds at or under 35% before dying, and the defensives pressed so far |
| Kicks | every interrupt event; a Wail of Terror "got off" when the add's cast event of it lands (it then fears) |
| Potions, Healthstones | cast events by name: Healthstone, health potions, mana potions, and the combat potions seen on these nights (Potion of Recklessness, Light's Potential, Liquid Luster) |
| Flask, food, rune | the auras in each player's record at the pull's start: "Flask of …", "Well Fed", and the augment rune (Void-Touched, Ethereal Augmentation) |
| Tank frontals | each Sever, Soul Sever and Blighted Sever cast and every player its hit damaged; non-tanks are the mistake |
| Ghosts | a Dreadmarch debuff that isn't from a Dreadmarch cast is a ghost that reached its player; Malevolent Resonance on two players at once is two ghosts touching |
| Orb bursts | Venom Rupture stacks landing with no frontal in the 3.5 s before. Who carried: the purple carries around it (start, end, length; a full carry is 5.0 s) and where each carrier stood |
| Gloombomb | each cast's four targets, and anyone else its blast hit |
| Soul fragments | every Gravebound: how many fragments were picked up before it ended |
| Noxious Ground | each player's damage ticks (one a second in a pool) and seconds with the debuff |
| Venomfang | each debuff, who dispelled it (the dispel event) and after how long. **Who was free** when it landed: every poison dispeller (anyone who removed a Venomfang on that night) who was in the pull, alive, not feared or mind controlled, and had made no dispel in the 8 s before |
| Guillotine | each drop's target and the players its hit split on (the soakers); Executions |
| Axegrinder | each time an axe's debuff landed on a player |
| Eternal Nightfall | each shield and how long it stood; whether the cast finished |

## The check (`node tests/answer-key.js`)
- It runs on **every build** (`src/build.ps1`, after the contradiction check). The last line of the build says how it went.
- It takes about a second when nothing in the engine changed (each pull's result is saved under a hash of the code that made
  it) and about a minute when it did.
- **A new mismatch fails**, in red, with the fact, the pull and the two values:
  `Wail of Terror casts that got off: the log says 1 (7:22), the site says 0`.
- **The same fact on every tab:** it also compares the site with itself: the mistakes list (Summary, Debriefing, Report card)
  against the Avoidable damage table (Summary, Graphs), each mechanic's own section, the kick list, the death list and the meters.
  These lines start "two tabs disagree on".
- `--list` prints the known ones too. `--fresh` runs the engine again. `--json <file>` saves every mismatch.

## When the check goes red
1. **You changed the site and a fact that was right is now wrong.** Fix your change. This is the check doing its job.
2. **You fixed a known mismatch.** The check says "Now right, so delete these lines from known.json". Delete them and commit:
   from then on that bug can't come back without a red line.
3. **The site is right and the key is wrong.** Don't edit the key file by hand. Fix `raw-facts.js` or `roots.js`, run
   `node tests/answer-key/make-key.js <code>`, and read the diff: only the fact you meant to change may move.

## Adding a night or a boss
1. The night's events must be in the log library (`C:\Users\james\DebriefLogs\events`, `reports`). Ask Main; one downloader only.
2. `node tests/answer-key/make-key.js <code> --boss "<boss name>"` writes the raw facts.
3. Read every wipe's last minute and add its cause to `roots.js` (the sentence, the events that prove it, `sure: false` when the
   log leaves room for two readings). Run make-key again.
4. For a new boss, add its spells and mechanics to `raw-facts.js` (as `coiledAltar` does) and its comparisons to `answer-key.js`.
5. Run the check. Report every mismatch to Main, worst first; put them in `known.json` only once reported.

## What "sure: false" means
Some things a log can't fully settle (which of two carriers' purple touched first). Those entries say so, give the other
reading (`or`, `byOr`), and never fail a build. They are listed under "to review" with `--list`.

## Deaths (added Nov 13, after the proof-only rule landed in 063567fd)
Every death in the key has: before or after the wipe, the killing hit, and the proof or the plain fact. `tests/answer-key/death-rule.js`
applies the rule to the raw facts (no site code):
- **Before the wipe:** fewer than a quarter of the raid had died before them, and not after the second the pull was lost (`roots.js`).
- **Proof 1, their own mistake was part of what killed them.** Its hit was the killing hit, or its hits in their last 4 s were damage
  they'd have lived without (more than the killing blow's overkill, and a tenth of their health). In a mass death (3 or more to one hit
  at once) only the killing hit counts. Never while feared or mind controlled.
  What counts as their own on The Coiled Altar: Axegrinder, Noxious Ground, a tank frontal on a non-tank, Widow's Kiss / Death's Embrace,
  Malevolent Resonance, an orb carrier's ring on someone who isn't carrying that colour, their own soul fragments (Gravebound from their
  own Gloombomb or frontal, never from someone else's bomb), and a tank dying to the frontal on their own turn (stack 1), or on a later
  stack they gave themselves by standing in the other tank's frontal.
- **Proof 2, sat low with something ready:** 2 s or more at or under 35%. The key lists what wasn't on cooldown, but "would it have
  saved them" needs the site's model of each button, so these are marked "maybe" and never fail a build.
- The raw numbers behind each verdict are in the key for every death before the wipe: `last4` (damage by spell in the last 4 s),
  `overkill`, `maxHp`, `lowFor`, `hp10`, `mass`, `feared`, `mc`, `pos`, `used`.
- A hand correction goes in `roots.js` under `deaths: { <code>: { <fight>: { "<player>@<second>": { verdict, proof or fact } } } }`.

Unsure ones (never fail a build, listed with `--list`): a death in the very hit that lost the pull, a Guillotine soaker or target (those
rules are still being written), fragments from their own bomb and someone else's at once, walking off the platform with no killing hit.
