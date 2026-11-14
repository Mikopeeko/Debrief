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
| Oct 22, The Coiled Altar Mythic | `bcA9kw3mxHKzr4fR` | 35 wipes (fights 5 to 39): 20 ended in phase 1, 15 in phase 2 |

Oct 22 was added on Nov 13 (Flex: "grow the answer key to two more nights") because every fix of that day was tuned on Nov 11 and Nov 12. It is a night none of them was built on. Oct 21 (`HWFBkCyc6JNazQrK`) is asked for too and waits on a full copy of its log (see "Adding a night").

A second boss of the same night gets its own file (`<code>-<boss>.json`). Ula'tek has the facts every boss has (length, boss health, totals, deaths and killing hits, kicks, potions, flask, food, rune) and each wipe's cause from the Ula'tek chat's proof table, with the deaths re-read here. Its own mechanics are in too (`ulatek` in each pull): who took each Toxic Incubation beam and how many impacts, who each Fester Burst caught (tanks apart), every Blightscale Viper that hatched, each Spectral Coil circle and its soakers (Soul Constrictor), each egg touch and who was in it (Noxious Splash: a touch is the first hit or the debuff landing, never the once-a-second ticks after it, and a first hit for no damage still counts; checked against each carrier's row under Eggs since Nov 13, after the site read ticks as a second touch on pull 12 and this reader had made the same slip), each player's Caustic Waves hits, Rattler Slams, Unchecked Rage and Mother's Wrath. The check compares the beam, the Vipers, the circles, Fester Burst and Noxious Splash; the rest is kept as data. Ula'tek deaths have verdicts too, from the Ula'tek chat's rulings (Nov 13). A player's own there: Caustic Waves they could dodge (not the waves off a beam taken inside the raid), Fester Burst when the Wretch's bubble could be reached (`festerNotReachable` in `roots.js` marks the pulls where it couldn't: the Wretch 25 yd or less from the tail at a Thrash in the 4 s before), Noxious Splash (both carriers), the slam of Mephitic Thrash (a second Thrash hit within half a second; the raid-wide hit never counts) and Rattler Slam for a tank. Never the carried egg's own Noxious Shell, and never a soaker in a full coil soak. A non-tank the beam went through is not counted either (the off tank missed the beam; Main, Nov 13). Still unsure there: pull 2's wave across the coil soak (not ruled).

## The facts, and how each is read from the log
| Fact | How it is read |
|---|---|
| Kill or wipe, length | the report's fight table and the encounter end event |
| Phase reached | phase 2 starts at Malacrass' first cast; the intermission is Zul'jan's Ghastly Regeneration; phase 3 starts when it ends |
| Boss health at the end | each boss's last health reading in the events (Warcraft Logs' own two percentages are kept beside it) |
| What ended the pull | by hand: the last minute of every wipe read event by event (`roots.js` has the sentence and the proof) |
| Damage done | each hit's amount on enemies, pets counted for their owner. An Augmentation Evoker's share of a hit is its own event and comes off the buffed player, as Warcraft Logs does it: both the amount and the part a boss's shield absorbed (the absorbed part was left on both players until Nov 13; the Report card chat found it on Urgdragon, Nov 11 pull 10). Damage a boss's shield absorbed is kept apart (`dmgShield`) and the site's damage done is checked against the two added together |
| Healing done | heals (with the part a heal absorb ate) plus the damage the player's shields absorbed. Shields that only stop a killing blow (Cheat Death, Purgatory) are kept apart as `absorbCheat`: the site leaves them out |
| Time alive | the pull's length less the time between each death and the rez after it |
| Deaths | every death event on a player (a Hunter's Feign Death is marked in the log and left out), the killing hit the log names, the last three hits, health every 2 s for 10 s, seconds at or under 35% before dying, and the defensives pressed so far |
| Kicks | every interrupt event; a Wail of Terror "got off" when the add's cast event of it lands (it then fears) |
| Casts (Rotation) | every cast event a player made, by spell; the key keeps each player's eight most-cast spells (three casts or more) |
| Raid cooldowns (Plan) | every cast of Aura Mastery, Divine Hymn, Rewind, Dream Flight, Spirit Link Totem, Healing Tide Totem, Tranquility, Revival, Restoral, Power Word: Barrier, Darkness, Anti-Magic Zone, Rallying Cry and Zephyr: who and when (a channelled one counts once) |
| Potions, Healthstones | cast events by name: Healthstone, health potions, mana potions, and the combat potions seen on these nights (Potion of Recklessness, Light's Potential, Liquid Luster) |
| Flask, food, rune | the auras in each player's record at the pull's start: "Flask of …", "Well Fed", and the augment rune (Void-Touched, Ethereal Augmentation). "Void-Touched" is two auras: 1264426 is the rune's buff, 97821 is the mark Raise Ally leaves on the player it brought back. The mark is left out (the reader took it for a rune until Oct 22 pull 14 showed it) |
| Tank frontals | each Sever, Soul Sever and Blighted Sever cast and every player its hit damaged; non-tanks are the mistake |
| Ghosts | a Dreadmarch debuff that isn't from a Dreadmarch cast is a ghost that reached its player; Malevolent Resonance on two players at once is two ghosts touching |
| Orb bursts | Venom Rupture stacks landing with no frontal in the 3.5 s before. Who carried: the purple carries around it (start, end, length; a full carry is 5.0 s) and where each carrier stood. Four things Oct 22 taught the reader: (1) a burst can hide behind a Sever: a pop adds one stack per orb, a purple bursting adds about 20, so 3 or more players jumping 8 or more stacks, 0.6 s or more into a Sever's wave, is its own burst (pull 4: stacks 3 to 23, 1.9 s after the Sever). (2) A Sever takes its orbs off the floor: it added N stacks, so the N orbs nearest the line from the boss through the tank are gone. Before, an orb popped minutes ago still read as "on the floor". (3) A carry that ends at the burst drops its orb there, and the dropped orb is a new unit with its own position: that is where the carrier really was. A player's own reading lags a Shimmer or a Demonic Circle (pull 9: 18.5 yd off). (4) A carrier who blinked or teleported in the 1.5 s before the burst and kept the orb is placed at their first reading after it. The bursting purple is not used up: "its carry ended at the burst" only means its carrier died |
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
1. The night's events must be in the log library (`C:\Users\james\DebriefLogs\events`, `reports`) as a FULL copy. Ask Main; one downloader only. A slimmed copy won't do (the index's `full-no-resources` or `slim`): Oct 21's has no gear and aura records, no "whose health and position" field, no tick or overkill, no "which spell was kicked or dispelled", and Augmentation's share can't be told apart. The site never sees a log like that, so a key on it would test the copy, not the site. A quick test: the file has `combatantinfo` events and its damage events have `resourceActor`.
2. `node tests/answer-key/make-key.js <code> --boss "<boss name>"` writes the raw facts.
3. Read every wipe's last minute and add its cause to `roots.js` (the sentence, the events that prove it, `sure: false` when the
   log leaves room for two readings). Run make-key again. The cause's kind uses the site's short names so the two can be compared: guil, orbs,
   kick, shield, frontal, reset, and from Oct 22 push (died to the phase push), mc (Dreadmarch), bombs (Gloombomb), ghosts, dead (worn down by
   several things). `or` lists another kind that says the same thing. For a purple left for the Deluge the key names the last carrier.
4. For a new boss, add its spells and mechanics to `raw-facts.js` (as `coiledAltar` does) and its comparisons to `answer-key.js`.
5. Run the check. Read every new mismatch against the raw events before it goes anywhere: on Oct 22 seven kinds were the key's own gaps, not the
   site's (a burst behind a Sever, popped orbs, blink positions, the rune's namesake, Toxic Deluge's circles as a player's own mistake, axe hits hidden
   behind a soul-fragment death, a low-health verdict on a button never pressed that night). Fix the reader or the rule, rebuild every key, and read
   the diff of the older ones. Then report what is left to Main, worst first; put it in `known.json` only once reported.

## What "sure: false" means
Some things a log can't fully settle (which of two carriers' purple touched first). Those entries say so, give the other
reading (`or`, `byOr`), and never fail a build. They are listed under "to review" with `--list`.

## Deaths (added Nov 13, after the proof-only rule landed in 063567fd)
Every death in the key has: before or after the wipe, the killing hit, and the proof or the plain fact. `tests/answer-key/death-rule.js`
applies the rule to the raw facts (no site code):
- **Before the wipe:** fewer than a quarter of the raid had died before them, and not after the second the pull was lost (`roots.js`).
- **When the raid played on** (Main, Nov 13): if nobody died for 15 s or more after the first deaths and 30 s or more of the pull was left, the pull was not lost yet. The second it was lost in `roots.js` is then the later one, and the cause is what ended it there. Ula'tek pulls 4, 9 and 13 of Nov 12 are the three in the key (pull 9: four dead by 1:00, then 35 s with no death, then Rattler Slam at 1:35). The earlier deaths stay in the sentence as what came first.
- **Proof 1, their own mistake was part of what killed them.** Its hit was the killing hit, or its hits in their last 4 s were damage
  they'd have lived without (more than the killing blow's overkill, and a tenth of their health). In a mass death (3 or more to one hit
  at once) only the killing hit counts. Never while feared or mind controlled.
  What counts as their own on The Coiled Altar: Axegrinder, Noxious Ground, a tank frontal on a non-tank, Widow's Kiss / Death's Embrace,
  Malevolent Resonance, an orb carrier's ring on someone who isn't carrying that colour, their own soul fragments (Gravebound from their
  own Gloombomb or frontal, never from someone else's bomb), and a tank dying to the frontal on their own turn (stack 1), or on a later
  stack they gave themselves by standing in the other tank's frontal.
- **Proof 3, walked off the edge** (Main, Nov 13): no killing hit, past the platform's edge, not feared or mind controlled (nor carried over by one that ended up to 12 s before), and no knockback in their last 3 s. How far out they got is the farthest reading of their last 4 s, not only the last one. Carrying an orb doesn't make it part of the job. Two or more off the edge in control within 3 s of each other is the raid jumping to reset: not counted. A feared, mind-controlled or knocked player is not jumping, so they never make it a group jump (Main, Nov 13: on Nov 11 pull 16 Schooty used Disengage and went off alone, and three more were feared off two seconds later by Wail of Terror, so his death counts).
- **Never:** a death in a reset pull. **Fragments of their own and of someone else's bomb at once:** only their own count (they had 3 a source; a death on the timer is theirs if they picked up fewer than their own, a death to a pickup is theirs if it was one of their own).
- **A death in the very hit that lost the pull counts** when that hit is their own mistake (four players in the Soul Sever, Nov 11 pull 5).
- **Proof 2, sat low with something ready:** 2 s or more at or under 35%. The key lists what wasn't on cooldown, but "would it have
  saved them" needs the site's model of each button, so these are marked "maybe" and never fail a build.
- The raw numbers behind each verdict are in the key for every death before the wipe: `last4` (damage by spell in the last 4 s),
  `overkill`, `maxHp`, `lowFor`, `hp10`, `mass`, `feared`, `mc`, `pos`, `used`.
- A hand correction goes in `roots.js` under `deaths: { <code>: { <fight>: { "<player>@<second>": { verdict, proof or fact } } } }`.

Unsure ones (never fail a build, listed with `--list`): the Guillotine target (that rule is still being written), and "sat low with something ready".

**One line for a whole kind:** `known.json` can hold an id with `*` in it. Two were used on day one: `*:dmgShield:*` (every player's damage into a boss's shield; Main: count it, as Warcraft Logs does) and `*:healCheat:*` (Cheat Death and Purgatory in healing done). The site counts both since Nov 13 (d2cdcf5b), the check called every one of them "now right", and both lines are deleted. The plain damage and healing numbers were checked beside them all along, so a new mistake in either still showed.
