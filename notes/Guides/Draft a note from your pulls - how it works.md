# Draft a note from your pulls: how it works (built Oct 20, 2026, TEST)

A Debrief feature that reads a night of pulls of one boss (or a single kill) and writes an NSRT note of who did which job,
for raids that never wrote a note or to save typing one out. Requested by the user on Oct 20 through the main chat.

## Status
- **Test version, local only.** It shows only on the PC copy (http://localhost:8765 from start.bat), never on the website:
  `NDZ_ON = () => !WCL.HOSTED`. To put it on the site later: change that to `() => true` (only when the user says).
- Only **The Coiled Altar** so far. Bosses with a "For you to fill in" list in `NDZ_FILL` get the button.
- **Not committed yet** (Oct 20): it's only in the working files and the local build, waiting on the user's try. The code and
  the script that adds it to any copy are kept in the shared session notes folder (`draft-note/ndz.js`, `draft-note/apply.js`).
- Where the button is: the Debriefing page's "No NSRT note for … yet" bar, the empty Assignments page, and "No note for this group".
- Test result (Oct 20, guild log 4bh7kdJMZnyrgvBC, 13 Mythic pulls): 4 kickers on the unmarked add, 5 purple carriers
  (13 of 13 pulls), both Guillotine groups (soak 2 = 4 players + the axe's target, as the Mythic plan says), CC order,
  curses, 28 cooldown reminders. Saved, it matched all 13 pulls with no unknown names. Pictures: `notes/Draft note test/`.
- Lessons: immune players soak both Guillotines on purpose, so soak groups are not one-group-per-player; the same
  cooldown pressed 10 s apart on different pulls is one assignment (groups with no pull in common, within 25 s, merge);
  a line is as sure as its least sure name.
- Research behind it: `notes/Guides/NSRT assignments by boss.md` (every boss, the exact note words, what a log shows).

## The user's requirements (keep all of these)
1. Deep research first: what NSRT's boss modules read from a note, boss by boss, and what raid leaders write.
2. **Repeated behaviour is the assignment; a one-off is a mistake or a cover.** Single pulls aren't trusted.
3. Each line carries a confidence in plain words: "kicked this add in 9 of 11 pulls".
4. What the log can't show (positions, marker spots, who calls) is left out of the note and listed for the raid leader.
5. The raid leader reviews it (untick lines), then saves it or copies it for the game. A note naming someone not in the
   pull goes through the existing swap screen, like a pasted note.
6. Test it on the guild's Coiled Altar log first (`window.__wla.openWcl({code:'4bh7kdJMZnyrgvBC'},{id:'',secret:''})`,
   Mythic, 13 pulls). Never type or ask for the Warcraft Logs secret.
7. Not live until the user says so. No guide or site names on the page. Plain, short wording.

## Where the code is (src/ui.js, all names start with `ndz`)
- `NDZ_ON`, `NDZ_FILL`, `ndzPulls`, `ndzLv`, `ndzDraft`, `ndzText`, `ndzStart`, `ndzView`: one block just above `function assign(`.
- `assign()` shows the draft screen when `S.noteDraft` is set (one line after the `capture` check).
- The button (`data-ndz`) sits on the empty Assignments page and on "No note for this group"; a document click listener starts it.
- CSS: `.ndz*` in src/shell.html, just above "Assignments with no note yet".
- The scratch script that adds it all to a clean copy: `apply.js` (in that session's scratchpad); the code itself is `ndz.js`.

## How a job is detected (`ndzDraft`)
- **Roster:** players in at least half of the pulls.
- For each job "slot" (a soak number, an add, a purple orb, a CC turn) Debrief counts, per player, the pulls where the slot
  came up while they were there and alive (`of`), and the pulls where they did it (`got`).
- **Exclusive jobs** (soak 1 or soak 2, unmarked or marked add, which curse) put each player in the one slot they did most.
- A name goes in the note when `got/of` is half or more. Under half, it's shown as "sometimes: …" and left out.
- **Levels:** Sure = 8 in 10 pulls or more (and at least 3 pulls), Likely = half or more, Unsure = less (unticked).
- Kick order: each player's average place among that add's kickers, per set. P3 gets its own pair only when the kickers changed.
- Cooldowns: the raid cooldowns in `RCD_CD`, grouped per player, spell and NSRT phase, within 15 s; kept when pressed in 2+
  pulls; time = the median seconds from the phase start (NSRT phases: 1, 2, 2.5 intermission, 3).

## What it writes (The Coiled Altar)
```
EncounterID:3429;Difficulty:Mythic;Name:The Coiled Altar
intstart
<unmarked add kickers in order>
<marked add kickers in order>
(<P3 unmarked> / <P3 marked> when different)
intend
Guillotine 1: …            Guillotine 2: …        P3 Guillotine 1-3: …
External Guillotine 1: …   Zephyr Guillotine 1: …
Purple Orbs: …
1st CC on Mindcontrol: …   2nd CC on Mindcontrol: …
Curse Unmarked Add: …      Curse Raid-Marked Add: …
time:…;ph:…;tag:Name;spellid:…;text:Spell;
```
These are the words Debrief's Assignments page already reads, so a saved draft checks every pull straight away.

## What it writes (The Twin Fangs, added Oct 20 at the user's request)
NSRT treats Twin Fangs as one phase, so cooldown times count from the pull (`NDZ_ONEPH`). Each section has a heading line
with no names, which is how Debrief's Twin Fangs check finds it:
```
Ravenous Feast Soaks
Group 1: …   Group 2: …   Group 3: …        (one group per strike, same order every Feast)
Broodling Kicks - Area Assign
Left: …      Right: …                         (side = where the Broodling stood at its first kick, module kickSide)
Caustic Deluge Orb CC
Odd sets: …  Even sets: …                     (globule CC per set, module _globSets/_globCC)
time:…;ph:1;tag:Name;spellid:…;text:Spell;
```
Tested on Wolfthorn's night 9DRWhKnZbHtQgf4a (30 Mythic pulls, kill on 30).

The button also shows on the Debriefing note bar when a note is already in use ("Draft a new note").

## Adding another boss
1. Read its row in `NSRT assignments by boss.md` and its guide in `notes/Guides/Bosses/`.
2. Find the fight module's data in engine.js (`build<Boss>` returns `_soaks`, `_feasts`, `_ny`… for the note checks).
3. Add a block in `ndzDraft` per job, using `tally`/`bump`/`pickOne`/`line`, with the label the boss's `…Assign` function reads.
4. Add the boss to `NDZ_FILL` with its "fill in yourself" list (positions and calls).
5. Test on a real log with at least 5 pulls, compare with what the raid's plan really was.

## Same raider on another character (added Oct 20, the user's idea)
Found on Wolfthorn's Twin Fangs note: it named Vandagos (his Protection Warrior), but he played Ironvan (his Protection
Paladin) on the kill. The swap screen now:
- **Spots a likely swap:** a link the user confirmed before; or one missing note player and one new player; or a new player
  with the missing one's role. It asks in a gold box: "Is Ironvan the same raider as Vandagos?" with a big "Yes, same
  player. Remember it" tick. Confirmed links are saved in this browser (`wla-alts`), and next time the box is green and pre-ticked.
- **Class buttons:** a cooldown in the note that the new character's class can't press (Rallying Cry on a Paladin) gets
  its own warning line and is left out of the new note (only reminders for that player alone). The "Saved" box lists what
  was left out. A spell's class comes from whoever pressed it in an opened pull.
- Code: `ndz-alt.js` (altsGet/altOf/altSet, ndzCant, ndzCantH, ndzAltBox, ndzClassCut) above the draft block; small hooks in
  rosterOffer0 (`altQ`), its row, bindSwap's save and noteMadeBox, added by `apply-alt.js`.
- Not the same as a nickname: an NSRT nickname is one name for all of a player's characters (shared by the addon). Debrief's
  nickname box links one name to one character.

## Quick swaps (added Oct 20, the user's ask)
The old "Swap a player" lived inside the note editor, which can't be opened for a saved note since the Oct 19 "delete only"
rule, so nobody could find it. Now: a gold **Swap players** button on the Debriefing note bar (next to Copy for the game)
opens "Swap players in your note": rows of who's out → who's in (missing players pre-filled with a suggestion: a confirmed
alt, else same role, else someone new), each row shows that player's jobs and any class-button warning, "+ Another swap",
then **Save and copy for the game** (saves, copies, and the Saved box says it's copied). Two players trading places works
(names go through a stand-in). One note per group still holds: a swap among players already in the note updates that note;
bringing someone new in saves a note for tonight's group and keeps the original. Code: `ndz-swap.js` (ndzSwapView, ndzJobsOf),
hooks added by `apply-alt.js`. Local only (`NDZ_ON`) like the rest of the test.

## Suggest the rest (added Oct 20, the user's idea, rules OK'd from a mockup)
Step 2 of the draft ("1. What you did" / "2. Suggest the rest" at the top), and a gold **Suggest assignments** button on the
Debriefing note bar that opens straight on step 2. Only The Coiled Altar for now (`NDZ_SUG`). Every job the raid already did
well is **Kept** (green); gaps are **Suggested** (gold) from tonight's classes, specs and roles, each with a reason. Rules:
1. Kicks: unmarked add = melee kickers, marked add = ranged; at least 3 each, short kicks first, orb carriers last; no healers
   except Restoration Shaman (from E.INTERRUPTS). 2. Guillotine 2 (exactly 5 with the target): tanks, immunities (Turtle,
   Divine Shield, Ice Block), then walls. 3. Guillotine 1 (6-7): immunities, then walls. 4. P3 Guillotines: Cloak of Shadows
   counts (magic); no orb carriers; nobody without an immunity who soaked the drop before. 5. Blessing of Protection per drop
   (a Paladin not already used on the other drop: 5-minute cooldown; tanks last); Zephyr from Evokers, taking turns.
6. Purple orbs: Warlocks, Mages, the off-tank, a mobile healer. 7. Mind-control CC up to 4: Monk, Warrior, Druid, DH,
   Shaman, DK, Paladin. 8. Curses: Warlocks. 9. Healing cooldowns: kept as pressed. 10. Nightfall shields: DPS big cooldowns,
   split in two halves (shields are too close for one 2-minute cooldown), as text reminders at the timeline's shield times.
Tested on 4bh7kdJMZnyrgvBC: 41 kept, 8 suggested. Code: `ndz-suggest.js` (ndzSuggest, ndzSugView, ndzSteps).

## Assignments is its own tab again (Oct 20, the user's call; test copy only)
"Assignments is evolving and needs separation." On the test copy (`!WCL.HOSTED`) the Assignments tab ('overview') is back after
Debriefing, with a **Note tools** bar on top (`ndzTools`: Draft a note from your pulls, Suggest assignments, Swap players, Copy
for the game). The Debriefing note bar keeps the note, its score, Copy for the game and "Open Assignments" (it used to be "See
the note"); Swap/Suggest/Draft moved off it. The Debriefing chat was told. Live site unchanged.
Then (Oct 20, "organize assignments better, and a tutorial"): the tool bar became three cards: **Your note** (which note is
checked, Add a note, Copy for the game), **Make a note** (Draft from your pulls, Suggest assignments), **Change it** (Swap
players, greyed out without a note), plus **Show me how**. The tab's page tips (PAGE_TIPS.overview, TIPS_V overview 2 → 3 so
everyone sees them once more) walk through the three cards, Show me how, then the note; Show me how replays them
(`pageTips('overview', true)`).
Then the empty page's how-to (Oct 20, "fix this make it better"): on the test copy it's "How Assignments works" (ndzHow): a short lead, three step cards side by side, Add your NSRT note + Try it with an example only, no outside site named. The site keeps the old one until this goes live.
Then refined (Oct 20, "any way to refine the whole thing"): no note = one box (ndzHow) with two choices, Have a note? (Add your NSRT note) and No note yet? (Draft / Suggest), Show me how + Test tag in its corner, example on the right, Try it with an example as a link. With a note = a slim header (Note tools · Test version · Show me how) over the three cards; the Your note card took over the note row below (why it was picked, Delete note: data-ndzdel clicks the hidden row's own delete twice), and that row is hidden under the cards.
Then (Oct 20): Assignments is for making/importing notes only on the test copy: with a note it shows the cards, a pointer to Debriefing for results (ndz-res), **Who does what** (ndzWho/ndzWhoH: each player's jobs from the note, tanks/healers/DPS) and the saved notes; the results stay on Debriefing. Saved notes are **small boss cards** (ndzBossCards, all 10 bosses, portrait + count); clicking one shows that boss's notes (storedNotes0(pick)). With no note, the saved notes show under the box too.
