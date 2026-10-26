# Discord bot in its own Worker: what is pushed and the exact cutover steps

Pushed: **d09a0e8** on main (on top of e5b048b). The website is not deployed. The sleeping bot Worker `debrief-discord` IS uploaded (the user said yes, Oct 26; version cfcda716, URL https://debrief-discord.james-m-nemecek.workers.dev, asleep: `/api/gwstatus` answers `{"on":false,...}`, the live site and the old listener are untouched). So step 2 below is already done; Cloudflare accepted the `SITE -> debrief#BotKeys` binding before the site exports `BotKeys`, so no workaround is needed. If the bot code changes before the push, upload again with the same command.

## What changed
- One template (`src/worker_template.js`), two builds. `src/build.ps1` now writes
  - `online/worker.js` = the website's Worker (role `site`): no `DiscordGateway` class, no listener binding. It exports `BotKeys` (hands the bot its keys inside Cloudflare), forwards `/api/discord` and `/api/gwstatus` to the bot (service binding `BOT`), and keeps patch notes (`announcePatch`), feature drafts (`runFeatures`), pace jobs and `fileBug`/`fileIdea`. If `BOT` is not bound it still answers Discord itself.
  - `online/bot.js` = the Discord helper (role `bot`, 178 KB, no app page): `DiscordGateway`, the one-minute run, all Discord jobs, Discord's interactions door and `/api/gwstatus`.
- `wrangler.toml` (site): listener binding gone, crons `*/10` only, `[[services]] BOT -> debrief-discord`, migration `gateway-2` (`deleted_classes = ["DiscordGateway"]`).
- `wrangler.bot.toml` (new, project root): name `debrief-discord`, crons `*/10` and `* * * * *`, the Durable Object + migration `gateway-1`, KV `DEBRIEF_KV` (same namespace), service binding `SITE -> debrief#BotKeys`.
- **No keys are copied or typed.** The bot Worker asks the website's Worker for DISCORD_BOT_TOKEN, GITHUB_TOKEN, WCL_CLIENT_ID and WCL_CLIENT_SECRET through `SITE.keys()` (only a Worker bound to it can call it) and keeps them in memory for 10 minutes. The website keeps its own secrets untouched (do not delete them: `fileBug`, `fileIdea`, the page flags still use them).
- The bot sleeps until the KV key `dc-bot-on` is `1` (the cutover switch), so deploying it early changes nothing. Discord's address stays `https://debriefme.io/api/discord` (the site passes it on), so nothing to change in the Discord portal.

Tested in node on both builds: asleep / awake, keys handed over once, interactions door (bad signature = 401, GET = 405), status door, site passes calls on and runs no Discord/GitHub calls in its ten-minute run, `BotKeys` hands over exactly the four keys. Both pass `wrangler deploy --dry-run`.

## After this commit, `versions upload` of main fails (until cutover)
The config now carries a migration and a service binding to a Worker that does not exist yet. Practice links were already 404 (Durable Object), so nothing real is lost, but "make the build" cannot upload a version of main until the cutover is done. To test the site build first: do step 2 (the sleeping bot Worker), then use the usual `wrangler dev --remote` copy of the config with the two `[[migrations]]` blocks removed from that copy only.

## Cutover (one go, when the user says "push it")
1. Build: `powershell -NoProfile -File src/build.ps1` (writes `online/worker.js` and `online/bot.js`). Do it from a fresh clone of main, as for any build.
2. Upload the sleeping bot Worker first (the site's `BOT` binding needs it to exist):
   `npx wrangler deploy -c wrangler.bot.toml`
   Check: `https://debrief-discord.james-m-nemecek.workers.dev/api/gwstatus` answers `{"on":false,"note":"asleep: dc-bot-on is not set"}`.
   If Cloudflare refuses the `SITE` binding because `debrief` does not export `BotKeys` yet: comment out the `[[services]] SITE` block in `wrangler.bot.toml`, deploy, and after step 3 put the block back and run step 2 again.
3. The website push, as a plain deploy (not `versions deploy`: the migration needs it): `npx wrangler deploy` from the project root with that exact build. This removes the old listener; the bot is silent from here until step 4.
4. Wake the bot straight after: `npx wrangler kv key put dc-bot-on 1 --namespace-id 5f5a92a1ea294fb888dea9dc5d7a2aa8 --remote`
5. Check (within 2 minutes): `https://debriefme.io/api/gwstatus` shows `up: true` and a log with `ready`; press a button in #bug-review (it answers at once, the call goes debriefme.io -> bot Worker); the user tags @Claudette on a message ("tag seen ... filing" in the log). `npx wrangler tail debrief-discord` shows what it does.
6. Practice links are back when `npx wrangler versions upload --preview-alias test` gives a URL that opens (`https://test-debrief.james-m-nemecek.workers.dev`). If `versions upload` complains about the migrations in the config, delete the two applied `[[migrations]]` blocks from `wrangler.toml` and commit "drop applied migrations" (they have done their job).
7. Close GitHub issues 9 and 10 (completed) once the build is live: their fixes (Void-Touched rune, dropdown list) are in bc9a54c; closing them tells the posts and thanks Priegorius.

## Bot-only changes from now on
Build from a clean copy of main (so nobody's unfinished edits get in), then `npx wrangler deploy -c wrangler.bot.toml`. It never touches the website. Do not `deploy` the bot from the shared working copy.

## If something is off
- Bot silent after step 4: `/api/gwstatus` log tells why ("the token was refused" = the keys did not arrive: check `npx wrangler tail debrief-discord` for "Keys from the website Worker"). Setting `dc-bot-on` back to 0 stops its jobs (not the connection, which closes on its own when the Worker restarts).
- The old listener cannot be brought back by a button (its class is deleted), and nothing it held matters (only a Discord session id). A fixed bot Worker deploys on its own.
- Rotating a key: change it on the website's Worker only; the bot picks it up within 10 minutes.
