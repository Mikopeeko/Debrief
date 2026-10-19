# Guide library (what the guides say)

The user's rule: **if a guide says it, it's gospel.** These files are my saved notes on every class guide
(Wowhead + Icy Veins) and every 12.1 / 12.1.5 raid boss guide, so no session has to re-read the sites.
Every session that touches a spec, a rotation check, a boss module or coaching text reads the matching file here first.

- `Classes/<Spec>.md` — one file per spec: rotation (raid first), cooldowns and when to press them, talents and hero
  trees, stats, consumables, tier set, and where the two guides disagree.
- `Bosses/<n> <Boss>.md` — one file per boss (Venomous Abyss 1-8, Kith'ix 9, Nymrissa 0 = unconfirmed): every mechanic on
  Normal/Heroic/Mythic and how the guides solve it. Boss sources: Wowhead (cheat sheet + journal), Icy Veins, Mythic Trap
  (structured page data), and Tactyks' Mythic YouTube guides (read from the auto captions). The older `notes/<Boss> research.md`
  files (Method guides + Wolfthorn's logs: spell IDs, timings, thresholds) are still the detail source for the fight modules.
- How to read YouTube captions: open the video in the built-in browser, wait out the ad, mute, turn captions on through the
  player API, then fetch the `timedtext` URL the player requested (it carries a token; a hand-built URL returns nothing).
- `Shared.md` — facts that are the same for many specs (consumables, stat diminishing returns, Omnium Folio).

Rules for these notes
- Written in my own words (no copied guide text). Spell IDs as `Name#ID` come from Wowhead's page data.
- "Both guides" when they agree; "Wowhead:" / "Icy Veins:" only here, never on the site (see the no-guide-names rule).
- Each file says the patch and the guide's last-updated date, so stale notes are easy to spot.
- When the guides disagree, both views are written down under **Disagreements**; don't pick one silently.
