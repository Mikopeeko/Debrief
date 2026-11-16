# Mythic+ Rotation: how a key is judged

Flex, Nov 14, 2026: "Maybe have another chat start working on the rotation tab, keeping in mind that the logic for rotations is based on mythic+", then "healer DPS vs Healing logic especially needs consideration in keys and its own special logic. DPS specs need to be reviewed to ensure their rotations are being properly evaluated in mythic+ content", and on the plan: "Yes, build it".

Read this before changing the Rotation tab of a key's page, the Companion's Mythic+ rotation rows, or any Rotation check that a key pull runs through.

## In one minute

- A key's pulls run through the raid Rotation checks, one pull at a time. That marked good key play as mistakes.
- A key pull now has its own rules: some rows are shown, not graded; some are amber at most; casting time has a lower bar on trash.
- Two things a single pull can't show are judged once over the whole key: a damage dealer's or tank's big cooldowns on the big pulls, and a healer's damage while the group is healthy.
- The key's Rotation score is 70% the pulls and 30% that whole-key check. The Report card's Performance row reads this score.
- A raid pull is never touched by any of this.

## The evidence

Thirteen fast timed +20 runs from the site's own list of fastest runs, all eight dungeons, plus Flex's +19 Kings' Rest (report `dtMfgnRvDwBLPCKZ`, fight 2). Every row of every player was read pull by pull, 70 players in all. The rule of thumb: a row that players who timed a +20 in a top time fail on a third or more of their pulls is the row's fault.

| What was read | What it showed |
|---|---|
| "Big cooldowns" on every pull | Not fine for fast players on 31% to 75% of pulls (Arcane 58%, Unholy 60%, Vengeance 70%, Demonology 73%, Marksmanship 75%) |
| Unholy Death Knight | A fast +20 player read 83, the same as Flex's: Festering Scythe buff 23 of 26 pulls, Blightfall at the end of the window 10 of 17, Sudden Doom 13 of 26 |
| Mistweaver | A fast +20 player read 67: "Full mana at the pull" red on 9 of 11 pulls, and the priority row read on the raid heal list |
| Restoration Shaman | Five fast players read 67 to 87: the priority row not fine on 25 of 29 pulls with 4 or more enemies, for Chain Lightning while Lava Burst was ready |
| Restoration Druid | Read 99 with 1.7% of the group's damage: nothing looked at a healer's damage |
| Casting time | Not fine on 61 of 274 trash pulls against 9 of 128 boss pulls; casters lose about 8 points on trash (Elemental 90% on bosses, 82% on trash) |
| A key's bosses | The priority row wanted Avatar or Summon Infernal from the boss's first second, though it had just been pressed on the pack before |

Nine helpers then read all 40 specs' rules against their class guides and these numbers. Their full findings are in the shared notes (`mplus-rotation-keys/audit-all-specs.json`).

## A key pull's own rules (src/ui.js, `keyRows`, run by `specPage`)

They act only when every pull on the page is a key's pull (`item.dungeon`).

- **Not graded for any spec** (`KEY_ALL_NA`): Big cooldowns (judged over the whole key instead), Full mana at the pull, Hunter's Mark at the pull, Power Infusion.
- **A healer:** Cancelled casts isn't graded (stopping a cast to heal, move or dispel is right). The healing rows were already off since Nov 9.
- **By spec** (`KEY_ROWS`): `na` = not graded on any key pull, `trashNa` = not graded on a trash pack but graded on bosses, `soft` = amber at most, `trashSoft` = amber at most on trash.
- **Everyone:** Cancelled casts is amber at most (a kick or a dodge cancels a cast). On trash, a wasted-proc row is amber at most (procs come faster on a pack than they can be spent).
- **Casting time on trash:** the bar is 8 points lower (`abcSt`, `KEY_ABC_TRASH`), for the casting row and for casting inside a burst window, on a page of one trash pull. The row's own "X% or more is good" numbers follow, so the Companion's "Aim for" line says the key's bar.
- **The priority row on a key's boss:** a step with a cooldown of 45 seconds or more is wanted only from its first press in that pull.
- **Holy Priest's priority row** has a key bar (`keyBar`): green from 80%, amber from 70%. Five fast timed Holy Priests (+19 and +20) read it not fine on 17 of 51 pulls against the raid bar of 90%; 48 of the 51 pulls read 83% or more, and with the key bar 50 of 51 are green. A raid pull keeps 90%.
- **Outlaw:** Between the Eyes and Roll the Bones stay wanted on trash (`KEY_NOHOLD`); their cooldowns are cut by finishers, so they aren't held.
- **Restoration Shaman:** with 2 or more enemies close, every damage button is right (Chain Lightning, Lava Burst, Flame Shock, Lightning Bolt, Frost Shock, Voltaic Blaze). The class guide gives no order for a shaman's damage on a pack.
- **Mistweaver with Chi-Ji:** the damage list is read all the time (`dmgAlways`). The guide: "Melee heals via Gust of Mists". Its two steps no longer say "nobody needed healing" (the one wording change a raid page sees).

## A healer's damage or heal (src/ui.js `keyHealSplit`, src/mptab.js `mpkHeal`)

- Every press that deals damage or heals counts once. Cast lines within 0.7 seconds of each other are one press (a spread Flame Shock, a Rejuvenation with its Germination, a Twin Flame copy).
- A press on an enemy with a spell that deals damage is damage. A press on a player with a spell that heals is a heal. A press with no target goes by what the spell did on that pull; one that both hits and heals (Holy Nova on a pack) is damage while the group is healthy and a heal while someone needs one. Swings and utility never count.
- **Healthy** is the priority row's own test: nobody under 50% health and at most one player under 70%, over the last 2 seconds.
- Each pull shows two rows, never graded there: "Damage while the group is healthy" and "Heals when someone needs one". One pull is too few presses. They are added before the page's layout pass (`keyHealAdd`), so they sit in the Rotation chapter's Casting block.
- A cast line Warcraft Logs marks as not pressed, and a Tranquility tick, is never a press.
- The whole key's share of healthy presses on damage is graded against healers of the same spec in fast timed keys. Holy Paladin and Restoration Shaman were set from the fast +20 runs, about 5 points under the lowest player. The other five were set on Nov 14 after Flex's "Yes, read them", from 21 more fast timed keys at +16 to +20 (Restoration Druids and Discipline Priests are rare at +20): 5 different players each, green from 5 points under the lowest, amber 10 points under that. A spec needs 3 or more different fast players to be graded.

| Spec | Fast players read | Green from | Amber from |
|---|---|---|---|
| Holy Paladin (4 players) | 66, 73, 73, 74% (Flex: 78%) | 62% | 50% |
| Restoration Shaman (5) | 39, 39, 41, 42, 45% | 34% | 25% |
| Holy Priest (5) | 41, 50, 64, 72, 80% | 36% | 26% |
| Mistweaver (5) | 85, 86, 90, 90, 91% | 80% | 70% |
| Preservation (5) | 53, 53, 56, 62, 65% | 48% | 38% |
| Restoration Druid (5) | 31, 40, 41, 53, 55% | 26% | 16% |
| Discipline (5) | 84, 88, 88, 92, 94% | 79% | 69% |

- "Heals when someone needs one" is shown, never graded: a tank sits low for much of a key. It isn't shown for Mistweaver and Discipline, who heal by dealing damage.
- Overhealing is never a measure (the Mythic+ guide ranks it 1 of 10).

## Cooldowns on the big pulls (src/mptab.js `mpkCd`)

- **A big pull** is a boss, or one of the three trash pulls of 30 seconds or more with the most group damage.
- **A big cooldown** is one from the spec's own list with a cooldown of 60 seconds or more. Its listed length is used, the longest it can be, so "it was ready" is certain.
- Only time it sat ready inside a big pull counts, while the player was alive, and never the pull's last 15 seconds.
- **A hold for Lust is never marked:** a press from 3 seconds before to 6 seconds after a Lust. Flex's group's 59 and 87 second waits (Avatar on the 23-enemy pull, Army of the Dead on King Dazar) both went out with Heroism. A first cut without this rule called them mistakes.
- Bars from 56 fast cooldowns: the longest wait was 24 seconds in the middle, 43 at the 90th percentile and 72 at the most. 45 seconds is amber, 90 red.
- An amber wait costs little (100 points falling to 70 at 90 seconds). Inside a boss fight a hold for its next phase can be right, and the log can't tell; the page says so.
- A healer's cooldowns are drawn but never judged for waiting: they go out when the group needs them.

## The score (src/mptab.js `mpRwSum`)

`pct` = 70% the pulls (each pull's score from its graded rows, longer pulls counting more, as before) + 30% the key's own check (`mpkPart`). Where there is nothing to judge (a spec with no listed big cooldown, a healer spec without a bar) the score is the pulls alone. `pct0` keeps the pulls' number.

On the 14 keys the 70 players went from 67 to 100 (middle 94) to 80 to 100 (middle 98). The ones still under 92 have real marks: a Holy Paladin building at 5 Holy Power on two bosses, a Destruction Warlock whose Infernal waited 72 seconds.

## Against top players (Nov 15)

The fresh reviewers on Flex's Kings' Rest +19 (Ragemaxxing, Arms Warrior, 99): the Trash pulls and Bosses boxes said "1 to fix" and "2 to fix" in red, over rows that said "As good as top players" (Sudden Death 7 wasted, top 9; Always be pressing 82%, top 78%). Flex: "Yes, fix them".

- Each check's whole-key total is set against the top players' (`mpTopGap`, 0 at top or better) and sorted once (`mpTopSide`).
- **At or above top players:** not to fix. A green dot, listed under Done right with its numbers and where it came up (shut until opened). Neither box counts it. A box left with nothing says Clean.
- **Close to top players** (within a tenth of the gap): still to fix, because it is behind them. Amber at most, never red, in the rows and the boxes alike.
- **Further behind, or no top numbers:** as graded.
- One source: `gapOf` in `mpcRotHtml` reads the whole key's own totals (`mpRwSum`'s `tot`). The rows and `mpvSide` (the boxes, and a tapped box's rows) both use it. The score and each pull's own marks don't change.
- The rows count judged pulls and bosses. On the test key that is 10 pulls and 4 bosses: pull 7 lasted 8 seconds. The page says so once above the rows, and each row says where its check came up.
- The checks: `tests/mplus-rotation-top.js` (run by `tests/contradictions.js` on every build) and check 5 of `tests/mplus-rotation-check.js` (in the browser).

## What is still open

- Fire, Frost Mage, Affliction, Devastation, Augmentation, Outlaw, Assassination and Survival are in none of the fast +20 runs: their key rules come from the rules and guides only.
- Pack priority lists the helpers found thin or wrong and that still need a key to prove: Marksmanship (Trick Shots is never read), Arcane (Barrage before Orb), Feral (Apex bite ahead of Primal Wrath), Destruction (Conflagrate at 2 charges), Demonology (Implosion), Fury (Whirlwind buff on small enemies). Their priority rows are amber at most on trash until then.
- Cooldowns carry over from the pull before only for the 45 second rule; a full carry-over (the key is one log) would be more exact.
- Nothing judges a death to healable damage while the healer was casting damage. It is the one case where damage should cost a healer, and it is hard to prove.
- A weaker run than a timed +19 hasn't been read with these rules.

## The review

Four independent reviewers read the change on Nov 14 (the checks' logic, the key's score and page, the words and look, the check itself), and a second reviewer tried to refute each finding. Nineteen findings, eighteen confirmed, none of them a wrong grade on a raid pull: a healer's key rows sat in a stray chapter, Frost Shock and Voltaic Blaze became slips for a Restoration Shaman on a pack, procs counted as presses, six sentences said something the code didn't compute, and the check let about twenty broken rules pass. All fixed; the check's cases marked (review) are theirs.

## The check

`tests/mplus-rotation-keys.js`, run by `tests/contradictions.js` on every build. It fails on the code before this round and whenever one of the rules above moves.
