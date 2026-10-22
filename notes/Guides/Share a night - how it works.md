# Share a night from your own log — how it works (Oct 21)

Your ask: "I need a copyable link to share my report from tonight with the officers" (Warcraft Logs was down; the night was read
from your PC through the Debrief app).

## What you see
- A night read from this PC (the Debrief app, or a log dropped on the site) has a **Share** bar under the banner, on every tab.
- Share opens a pop-up: what it does, the link lasts 30 days, and in a gold box **"Anyone with the link can see tonight's raid"**.
- "Share and get the link" saves the pulls (a bar shows how far), then shows the links to copy: the whole night, and this pull
  when one pull is open. The address bar has the link too after that.
- More pulls since? The bar says so; Share adds only the new ones (same link).

## What officers see
- `debriefme.io/?night=<22 letters>` opens on any PC or phone, no app or sign-in: Debriefing, All pulls and every tab.
- A "Shared raid night" bar (who shared it, the date and boss) with Copy link. Mechanic "Copy link" buttons work too.

## Requirements
- Upload only when you press Share. The link must be impossible to guess.
- No Cloudflare extras to turn on: it uses the KV store the Worker already has (DEBRIEF_KV).

## How it's built
- Each pull's log lines (the same bytes the site reads) are gzipped in the browser and sent in parts of up to 20 MB
  (`PUT /api/night/part?id&n&m`), then the list of pulls (`PUT /api/night?id`). Kept 30 days.
- The night's name is the first half of SHA-256 of a random 48-character key that only the sharer's browser keeps
  (localStorage `dbf-shr:<log>:<first pull>`). The Worker checks the key on every write, so only that browser can add to it.
- Opening a link reads the list, then each pull's parts when needed, and reads them exactly like a log on that PC.
- Size: Oct 21's night was 19 pulls, 936 MB of lines, 85 MB packed.
- Code: ui.js (`shrBar`, `shrDlg`, `shrSend`, `openShared`, `shrText`), worker_template.js (`night()`).
