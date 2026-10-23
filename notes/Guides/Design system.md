# Debrief design system

One sleek, consistent look on every page (the user, Oct 22: "yes i want to make it consistent"). Every rule here comes
from the pieces the user already likes. It isn't a new style. Read this before you change how any page looks. Each tab's
owner chat follows it from now on.

**The model pieces** (copy these, don't invent):
- Debriefing's **"This pull, coached"** box: one big answer, a gold Focus panel, numbered cards, tappable chips.
- The **one header** (Header merge A): the boss, a result pill, one quiet line of facts, and the pulls as bars.
- The **Debriefing maps**: spec icons with class-coloured names, a still camera, and + / − only.
- The **front page**: one gold label over each big heading, generous space, one call to action.

The shared style layer lives at the end of `src/shell.html`, under the comment "Design system (Oct 22)". It uses the
`--ds-*` tokens below. New markup uses the `ds-` classes; old classes are mapped onto the same look there.

---

## 1. Colour: when it's allowed

The page is mostly neutral: dark panels and warm white text. Colour always means something:

| Colour | Token | Means | Use it for |
|---|---|---|---|
| Gold `#e6b450` | `--gold` | Debrief talking to you | the main box's label and edge, Focus, primary buttons, "Read more" links, the picked All pulls |
| Green `#45c15c` (text `#7ee08f`) | `--good` | done right | the green flag, ✓ chips, ▲ better |
| Yellow (amber) `#e8a23a` (text `#f3c969`) | `--warn` (= `--lv-min`) | some mistakes | the yellow flag only |
| Red `#e5534b` (text `#ff8f87`) | `--bad` (= `--lv-maj`, `--lv-mod`) | failed (half or more wrong) | the red flag, ▼ worse, a death that was on you |
| Blue `#6aa8ff` | `--blue` | a setting or a filter | the wipe filter, info notes |
| Class colours | (WoW) | a player | player names only |
| Pull quality (grey, white, green, blue, purple, orange) | `PULL_Q` | how far a pull got | pull bars, pull pills, the header's edge |
| Grade quality (the same WoW colours) | | a grade or score | Report card letters and scores, like a parse |

- **Three flags only:** green done right, yellow some mistakes, red failed. No orange "moderate" level, and no
  Major/Moderate words. Since round 3 (Oct 22) the code has exactly these three colours: the old bright alarm red
  (#d4111e/#ff3b46), the orange (#e2540f/#ff7a3d/#f07a3a) and the second yellow (#e8b923/#ffd54a) are gone. Use the tokens.
- Never use colour just to decorate: no coloured headings, no rainbow tiles, and no gradients except the gold Focus tint and
  the header art.

## 2. Type

Two fonts: **Barlow Semi Condensed** (`--head`) for names and big numbers, **Barlow** (`--body`) for everything else.

| Role | Size / weight | Colour | Example |
|---|---|---|---|
| Page title | 29px / 700 head (24px on a phone) | `#f6f8fb` | the boss name |
| Tab title | 22px / 700 head | text | "Rotation", "Your homework" (only when a tab has no main box) |
| Section title | 18px / 600 head | text | "What went well", "Ranked roster" |
| The answer | 18px / 600 body | text | "We wiped at 15%…" |
| Card title | 15px / 700 body | text | "Eternal Venom (Stay under the limit)" |
| Body | 15px / 400 (14px inside cards) | text | sentences |
| Secondary | 13px / 400 | `--muted` `#a4abb8` | "Schooty: Reached 7 stacks" |
| Label | 12px / 700, UPPERCASE, letter-spacing .06em | `--muted` (gold on the main box) | "WHAT WENT WRONG" |
| Big number | 28px / 700 head | text | "2", "4.04M" |
| Chip text | 12.5px / 500 | text | "5:26 Hobbz Melee" |

- **Nothing anyone must read is under 12px.** Map labels and chart axis ticks may be 10 to 11px.
- Headings use sentence case ("What went wrong"). UPPERCASE is only for the small labels.

## 3. Space

A 4px grid: **4, 8, 12, 16, 20, 24, 32**.
- Inside a main box: 16px 20px. Inside a card: 12px 14px. Inside a tile: 14px 16px.
- Between cards in a list: 8px. Between sections: 20px. Between big page blocks: 24 to 32px.
- Phone: 16px side gutters (the site's `--gmin`), with cards full width.

## 4. Surfaces

| Surface | Look | Use |
|---|---|---|
| **Main box** (one per page) | `--panel`, 1px `--line2` border, **4px gold left edge**, radius 12px | the page's answer: the coach, the recap, the guide's Read it |
| **Card** | `rgba(255,255,255,.02)`, 1px `--line2`, 3px left edge in its flag colour, radius 10px | numbered problems, mechanic rows, list items |
| **Tile** | `--panel`, 1px `--line`, radius 10px | a label, one big number and one short line (Deaths, Mechanics, Raid damage) |
| **Focus panel** | gold tint `rgba(230,183,80,.16)→.05`, 1px gold .35 border, radius 10px | the one thing to do next |
| **Plain panel** | `--panel`, 1px `--line`, radius 12px, no coloured edge | everything else |

- **Radius:** 12px for boxes and panels, 10px for cards and tiles, 8px for buttons, 999px for pills, chips and toggles,
  50% for number dots.
- **Shadow:** none on flat panels. Only things that float (pop-ups, tooltips, the pinned tab bar) get a shadow.
- **One coloured edge** per surface at most, and only gold (main box) or a flag colour (card).

## 5. Chips and pills

- **Chip:** pill, 12.5px, padding 3px 9px, `rgba(255,255,255,.05)` with a 1px `--line2` border. A chip you can tap
  brightens its border on hover and opens something in place.
- **Good chip:** green tint (`rgba(95,211,95,.1)`, border .28), text `#a8eaa8`, starts with ✓.
- **Status badge** (a flag's word): pill, 13px / 700, tinted in the flag colour with a 1px inset ring: "Done right",
  "Some mistakes", "Failed".
- **"+3 more" chip:** the same chip in muted text. It opens the rest in place.

## 6. Section headers

- One small label (§2) 8px above the group. No lines across, no icons, no counts in brackets.
- A section that folds uses a **summary row**: title 15px / 600, any status badge on the right, and a ▸ that turns
  when open. Everything below the main box starts **closed**, except a page's first list.

## 7. Buttons and links

- **Button** (an action, `.btn`): 8px corners, 13 to 15px / 600, padding 8px 12px, `--raised` with a 1px `--line2` border.
- **Primary button:** gold with dark ink, the same shape. One per view at most ("Start now", "Load a note").
- **Small button** (`.btn.sm`): 12.5 to 13px, padding 4px 10px, used inside boxes ("Copy for Discord").
- **Toggle or filter** (a choice, not an action): a pill (999px). The picked one is gold-tinted ("Everyone · Tank · Healer",
  the Graphs picker, "All pulls").
- **Link to more:** gold, 14px / 600, ends with › or ▸ ("Read the full coaching ▸").

## 8. Small print and banners

- **At most one line** of small print under a block. Longer "how it works" text folds into a `How it works` summary or a
  ⓘ tooltip. Nothing gets deleted.
- **One banner per page** (beta/Discord, an outage, or a shared night). Others wait or fold into the menu.
- Numbers use tabular figures. Changes since the last pull are small: ▲ green, ▼ red, at 12.5px.

## 9. Maps and charts

- Maps: spec icons with class-coloured names, a still camera, and + / − only (see map-controls).
- Charts: thin lines, neutral grid, flag colours only for good/bad, and a tooltip for detail (like the pull bars).

## 10. Phone

- Judge on desktop first, then keep the phone fully usable: one column, 16px gutters, chips wrap, tiles 2 across.
- Nothing scrolls sideways except the pull bars and wide tables (each in its own scroller).
- Touch targets are at least 32px tall.

## 10b. The automatic design check (Oct 22)

Every build (src/build.ps1) runs src/design-check.ps1 and ends its last line with `design check: OK` or `design check: N
warning(s), see above`. It never stops the build. It warns about:
- a flag colour outside the three (the old alarm red, the orange, the second yellow), with the file and line;
- new text under 12px in shell.html that isn't in src/design-baseline.txt (chart, map and timeline labels may be small).
If the small size is on purpose (a new chart label), run `powershell -File src/design-check.ps1 -update` and commit the
baseline. Small print goes behind the shared ⓘ: `<span class="ds-i" tabindex="0" role="note" data-tt="…">ⓘ</span>`.

## 11. Checklist for any page change

1. Does the page have one main box with the answer at the top?
2. Is every colour one of §1's meanings?
3. Are text sizes from §2's list, with nothing under 12px?
4. Are surfaces one of §4's five kinds, with the right radius?
5. Is long small print folded, and is there only one banner?
6. Does it work at 390px wide with nothing sideways?
7. Before/after pictures: `node tests/shoot.mjs <practice url> <folder> [only=rotation,graphs] [dev=desktop|phone]`.
   It runs a fresh headless Edge with the tour and tips marked done, and saves full-page pictures of every tab.

## 12. Round 1 (Oct 22): what the shared layer lines up

The style layer only normalises what the model pieces already do. Each tab's own layout comes in round 2, with its owner.
- **Small labels:** 5 styles (11.5 to 13px, letter spacing from 0.5 to 1.6px, two greys) become one: 12px / 700 / .08em,
  grey or gold.
- **Titles:** section titles are 18px / 600 everywhere (Report card's were 20px / 700).
- **Corners:** boxes were 10, 12 or 16px and cards 8, 10 or 12px. Now boxes are 12px and cards and tiles 10px.
- **Tiles:** Graphs' tiles get the same uppercase label and 28px number as Debriefing's.
- **Main box:** Rotation's coach and Report card's "The night, in short" get Debriefing's coach look (panel, hairline,
  4px gold edge).
- **Tags:** "Top guilds mess this up too" and the top-guild ranks are never under 12px.
- **Cards:** Homework's and the Rotation coach's cards carry their colour down the left edge (it was across the top).

## 13. Round 2 (proposed, each with its tab's chat): the visible tidy-ups

- **Rotation:** section rows in gold CAPITALS with gold number squares become Debriefing-style rows (sentence-case title,
  status badge, ▸). "Kill, so the whole pull counts" folds into the wipe filter.
- **Report card:** "ranked by grade · click a column…" and the report-card intro become ⓘ tips. The night banner's five
  stat boxes become tiles.
- **Graphs:** "Pick up to 3 graphs…" becomes an ⓘ tip, and the picker uses the toggle-pill style.
- **Homework:** the long hint line under the cards becomes an ⓘ tip, and the empty "Pick a raider" state gets a main box.
- **Debriefing:** "Counted up to 5:26…" folds into the wipe filter's box, and "More from this pull" becomes a summary row.
- **Boss guides:** "The right way / Show a mistake" use the toggle-pill style (gold for the picked one, not green).
- **Plan, Compare, Patch notes, Addon page:** check them against the §11 checklist, with small fixes only.

## 14. Spell icons (Oct 22)

The user: "Any time a spell, or mechanic is listed there should be a corresponding icon."
- Every spell or mechanic name on a page shows its icon in front of it: in sentences, row titles, chips, tooltips, the Rotation tab, Plan and the boss guides.
- One icon per name. A name never shows two icons, and when its icon already sits right in front of it (Rotation's spell rows) it adds none. A name repeated in the same line keeps one icon.
- One size: the site's 20px icon (16px inside tooltips and small print).
- An add named in a row title (like "Spiteful Soulcoiler (Kick and kill)") shows the add's own icon, the one its map marker uses (ADD_LOOK).
- Generic rows (Deaths, Avoidable damage, Pace, Phase changes) keep their fixed icons (NAMED_ICON).
- How it works: spell names are tagged (mech(), linkBossText(), and linkGuideText() for guides and Plan), then iconizeSpells() adds any missing icon and removes doubles. refreshIcons() runs all three, so any page that redraws should call refreshIcons(). Mark a spot that must stay plain with class no-ic.
- Checklist item 8: does every spell name you added show its icon, once?
