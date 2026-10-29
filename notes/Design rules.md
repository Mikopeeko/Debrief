# Debrief design rules (Oct 28)

The site keeps its layout and its font. These rules are about finishes: how every piece is drawn, so the whole site reads as one tool.
The user's words: "clean and refined, but I don't want to lose my own vision", "same layout, different theme", "my font stays".

## Keep (the vision)
- Layout as it is: header, boss banner, tabs, the panels on each tab. Nothing moves.
- Font: Barlow Condensed everywhere, as before. Weights 600 for bold, 700 for headings, 800 only for the biggest numbers.
- The Forged logo, gold as Debrief's mark, the boss art banners, class colours on names, the vertical timelines, mistakes on the press.

## Colour means something
- Greys for everything that is structure: backgrounds, lines, labels, body text.
- Red = serious / a mistake. Amber = moderate / could be better. Green = done well. Blue = defensives, utility, people.
- Gold only for: the brand, the active tab, big cooldowns, and the one thing on a page that is the point ("Fix first").
- Nothing else is coloured. No coloured edge bars, no coloured headings, no glows except on big cooldowns and mistakes.

## One of everything
- Panel: 1px line (var(--line2)), 4px corners, flat panel background, no shadow, no inner glow.
- Row: 36px tall, hairline between rows, hover = one shade lighter. Icon 22px, text 13.5px, number right-aligned.
- Tag (severity, status): small caps 10px, 1px outline in its colour, no fill, 2px corners. SERIOUS / MODERATE / MINOR / DONE RIGHT.
- Chip (a fact, a filter): 24px tall, grey outline, no fill, 4px corners. Never a coloured pill.
- Label (section kicker): 11.5px, uppercase, grey, letter-spacing .04em at most (the user, Oct 28: wide-spaced capitals "look weird"). Tabs and headings in normal case. The only decoration is a 6px square dot before it when it has a verdict colour.
- Button: 30px, grey outline, 4px corners. The one main button on a page may be gold-filled.
- Dropdown: same frame and corners as a chip; its menu is a panel (same rules). Always check it after restyling.

## Numbers
- Big numbers in the code font (JetBrains Mono), 600 weight, tabular. Small numbers in body text stay in Barlow Condensed but tabular.
- Numbers lead, labels follow, in tiles and stat strips.

## Depth
- Flat. One background shade for the page, one for panels, one for a raised row. A faint 28px grid on the page background.
- No gradients on panels, no drop shadows, no text shadows. Shadows only on floating things (hover notes, menus).

## Don't
- Don't put a red/pink/gold bar down the left edge of anything.
- Don't fill chips with colour. Don't colour whole headings. Don't glow what isn't a cooldown or a mistake.
- Don't mix corner sizes on one page. Don't add a second font for reading text.

## Scores (Oct 28)
- A score row is its dot and its number, no bar under it (the user's call, "A everywhere": when scores sit between 80% and 100% the bars all look the same).
- Bars are only for splitting real data: where healing came from, Gained from, stat order, meters.
