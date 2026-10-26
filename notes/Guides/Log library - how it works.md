# Log library: how it works (Oct 26, 2026)

The user: "gather the saved logs into one organized library and only download what's missing."
Every Warcraft Logs fight any chat has downloaded now lives in one place, with one index. Chats look there first and download
only what's missing, slowly, through one downloader.

## Where it lives
`C:\Users\james\DebriefLogs`. It's outside TEMP (which Windows can clean) and outside OneDrive (too big to sync).
- `events\<code>_<fight>.json`: one fight's raw Warcraft Logs events (every event, with positions and resources).
- `reports\rep_<code>.json`: the report each fight belongs to (fights, players, abilities). The engine needs both files.
- `lists\top_<encounter>_<difficulty>[_pN].json`: speed rankings pages (guild, speed rank, roster, code and fight).
- `nights\<tag>\`: whole nights already in the site's own log format (shared-night pages or one .log per pull), e.g. Wolfthorn's
  Oct 21 Coiled Altar night.
- `index.json` / `index.csv`: one row per fight (below). `gaps.json`: what's missing against the target.
- `tools\`: index.js (rebuild the index and links), gaps.js (the gap list), gather.js (the ONE downloader), light.js (finds
  mid-pack guilds' first kills), metrics.js (runs the live engine on library fights; an example).
- `part\`: half-finished downloads (resumable).

**Hard links, not copies.** Each library file is a second name for the same file a chat saved in its own scratchpad.
- It costs no extra space, and old scripts keep working from their old paths.
- If Windows cleans a TEMP folder, the library copy survives.
- **Never edit a library file in place:** every name for it would change. Write a new file instead.
- Hard links only work on the same drive (C:). Don't move the library to another drive.
- Note: chats run inside the Claude app, and the app quietly redirects new folders under `AppData\Local` into its own package
  storage, which a reset would delete. That's why the library is in `C:\Users\james`, not AppData.

## The index (index.json → fights[])
| Field | Meaning |
|---|---|
| key, code, fight | report code and fight id (`code:fight`) |
| boss, enc, diff, kill, date, dur | from the report |
| afterNerf | the fight is on or after that boss's last real tuning (dates in tools/index.js `BOSS`) |
| speedRank, guild, gid, region | from the saved speed rankings, when the kill is in one |
| worldRank, firstKill | for strictness Light kills: the guild's world progress rank, and this is its first kill after the nerf |
| kind | `full` (events with resources), `full-no-resources`, `slim` (some fields dropped) |
| cover | how much of the fight the file holds (1 = the whole fight) |
| size, copies, src, alsoAt, lib | file size, how many chats had it, the copy linked, the other copies, the library path |

## How a chat finds and uses a kill
1. Read `C:\Users\james\DebriefLogs\index.json` and filter, e.g. `boss === "The Coiled Altar" && diff === "Mythic" && kill && afterNerf
   && speedRank <= 20`.
2. Load `events\<code>_<fight>.json` and `reports\rep_<code>.json`.
3. Run the engine as metrics.js does: `W.translate(item, events)`, then `E.analyze(item, text, {})`, with `item` built from the report's fight.
4. Missing a kill? Don't download it yourself. Ask the Main chat, and the library owner adds it to the downloader's queue.

## The one downloader (tools/gather.js)
- **The allowance:** since Oct 26 the site's Warcraft Logs key has **9,000 points an hour** (the user's Platinum plan; it was 3,600).
  One page of events (10,000 events, ~3 MB) costs **2 points**. A 20-player Mythic pull is about 1 page per 12 s of fighting.
- **Research takes at most half the hour.** gather.js checks `/api/ratelimit` every 25 requests and waits for the reset when the
  key has already spent half. It sends one request every 4 s (about 1,800 points an hour) and pauses an hour on any 429.
- **Only one downloader at a time.** On Oct 26 two ran together (strictness and Rotation's top players) and the site's key hit its
  limit for visitors. If a chat needs data, the request goes through the library owner.
- Usage: `node tools/gather.js code:fight,code:fight,...`. Then rebuild: `node tools/index.js --link` and `node tools/gaps.js`.

## Refreshing after a nerf or a new tier
1. Update the boss's last real tuning date in `tools/index.js` (`BOSS`), then run `node tools/index.js --link`. Older fights show
   `afterNerf: false` and stop counting toward the targets.
2. Fetch fresh speed rankings for that boss (`/api/topkills?e=<enc>&d=5&p=1…`, slowly) into `lists\`.
3. Run `node tools/gaps.js` and queue the gaps with gather.js.
New tier: add the new encounters to `BOSS` in index.js and `ENC` in gaps.js. Old fights stay in the library; just filter by date.

## The target and the counts (Oct 26)
Mythic first:
- per boss, the 20 fastest kills after the nerf;
- the strictness bands: Severe = top-100 guilds' fastest kills (today: the same 20); Light = 12 first kills by world #300–1,000 guilds;
- per spec, top players (Rotation's list).
Heroic: the 20 fastest per boss are already saved.

| Boss (Mythic) | 20 fastest saved | Mythic fights saved | Light (12 first kills) |
|---|---|---|---|
| Nymrissa Wavecaller | 20/20 | 37 | 0/12 |
| Nek'zali the Soulcoiler | 20/20 | 35 | 0/12 |
| Entombed Sentinels | 15/20 | 23 | 0/12 |
| The Lost Explorers | 20/20 | 27 | 0/12 |
| Vashnik the Malignant | 14/20 | 27 | 0/12 |
| Sszorak | 14/20 | 26 | 0/12 |
| The Twin Fangs | 19/20 | 23 | 0/12 |
| The Coiled Altar | 19/20 | 61 | downloading now |
| Ula'tek | 19/20 | 19 | 0/12 |
| Kith'ix | 19/20 | 19 | 0/12 |

- **In the library now:** 524 fights (41 GB): every boss, Heroic and Mythic, all after their nerfs, all complete. Also 1,056 reports,
  61 nights and 45 ranking lists. 12 fights have no report saved yet (one request each).
- **Rotation's top players:** 213 picked kills, 68 saved, 145 missing. Thinnest specs: Fire Mage, Outlaw Rogue, Feral, Survival, Protection Warrior.
- **Download queue, in order:**
  1. Coiled Altar Light (running);
  2. the 21 missing fastest kills;
  3. Rotation's 145 picks;
  4. Light bands for the other 9 bosses (needs a finder per boss first: speed rankings pages, world ranks, first kills).
- **How long:** about 9,000 pages at one every 4 s, about 10 hours spread over the evening. That stays under half the hour's points the whole time.
