# Fast night loading: how it works

*Oct 25 night. The user's note: "this screen just took 2 minutes to load" (Reading the pulls… 32 of 35).*

## Why it was slow

- The launch changed the checks, so every saved reading was thrown away and the whole night read again.
- The page read one pull at a time, pausing every 30 ms so the dancer could keep dancing. A hidden tab stretches each pause to about a second.
- Once a PC had more than 120 saved readings, every new save loaded all of them just to find the oldest one to delete.
- Measured per pull (35-pull Coiled Altar night, bcA9kw3mxHKzr4fR): download from this PC 0.3 s, writing the log lines 1.2 s, the checks 1.4 s, the rest well under a second.

## What it does now (all in src/ui.js)

1. **Reading workers (`RW`).** Pulls from Warcraft Logs are read by background workers:
   - 4 at once with 12+ cores, 3 with 8+, 2 on a computer with little memory, 1 on a phone. They share the tab's memory: 6 ran a tab out of memory during testing.
   - A worker lets go of the downloaded events before it runs the checks, and is replaced after 6 pulls so its memory is handed back.
   - Each worker downloads its pull (or loads it from this PC), writes the log lines, runs the checks, cuts the reading at the wipe call and saves it, then hands it to the page.
   - The worker's script is built from the page's own scripts: the engine, the translator, the wipe-call lines of ui.js (`WIPE_LINE` up to `keptDeaths`, plus `raidSizeOf`) and `rdStrip`, `rdBake`, `rdOpen`, `rdTrim` and `rdSave`. Those five are plain functions so they can travel as text.
   - **Safety net:** the page checks the worker's cut against its own. If they differ, or workers can't start, or the worker can't read a pull, the page reads that pull itself as before. A download that fails still shows the usual error.
   - Workers only run on the website (hosted). The PC app with its own helper reads on the page.
2. **Saved readings survive updates.**
   - The saved key no longer contains the version.
   - The version is a hash of every character of the engine and the translator. Before, it sampled every 7th character, so a same-length change could keep old readings.
   - A reading from an older version opens at once, marked `_stale`, and is read again in the background: 2 at a time, once the page is up, the pull on screen first.
   - **Memory:** a re-read only saves the new reading on the PC and hands nothing back to the page. The old reading is let go, and the next look loads the new one. A single pull on screen swaps to its new reading right away. All pulls shows the new readings on the next click, because loading them all at once doubled the memory and crashed the tab.
   - If an old reading doesn't fit the new page (drawing it throws), the pull is read again.
   - **Rule for other chats:** a change that renames or removes something the page reads from a reading should still work on an old one (use `(r.x || [])`). The redraw-on-throw is the backstop.
3. **Keeping the newest 120 is cheap.**
   - The database is version 2, with an `at` store (when each reading was saved).
   - Trimming reads only that list, not the readings.
4. **Latest pull first.**
   - A night that isn't read yet opens on its pull: the kill, or the latest pull of the boss you spent the night on.
   - The rest read in the background in two lanes (the line under the boss header). Each lane pauses 3 s after a download, the same pace as before.
   - A short note says "All pulls is ready".
   - A night already read opens on All pulls as before.
5. **Loading tips** now match the page: the wipe call, the pull line at the top, mechanic rows, All pulls.

## Measuring it

- `scratchpad/audit/loadtime.js <url> [profile]` opens a night in a clean headless Edge. It times three cases: first visit, downloads saved but readings cleared, and a reload. With `profile` set to 1 it shows what the page was busy with.
- Set `localStorage['wla-rw-debug'] = '1'` and each worker logs its stage times in the console.

## Left for later

- **Writing the log lines (`translateSteps` in wcl.js) is the biggest single step.** It could be made faster: one time stamp per second instead of per event, and names worked out once per actor. It must stay byte-for-byte the same, so it needs a side-by-side test first.
- **A reload of All pulls with everything saved** still loads every reading of the boss (~25 MB each).
- **Cloud saving** (readings shared across people and PCs) is a later step.
