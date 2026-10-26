# Warcraft Logs limits: how Debrief scales (Oct 26, 2026)

Your question: "If my website gets big, would this turn into a regular issue with the Warcraft Logs API?"
**Short answer: yes, unless we change how downloads are paid for.** The fixes are known, and the first two are small.

## How the limit works
- Every request the site makes to Warcraft Logs costs **points**. The site's key gets a fixed number of points **per hour**.
  When they run out, Warcraft Logs refuses everything until the hour resets. That's what happened on Oct 26 at 10:43:
  visitors saw "Warcraft Logs rejected this site's API key (429)" for up to an hour.
- The old default was **3,600 points an hour**. Some keys have more, depending on the owner's Warcraft Logs subscription.
- **Warcraft Logs is changing the system right now** (a test that started Oct 20, running at least to the end of November):
  - **App points:** what every request spends.
  - **Database points:** a smaller pool inside that, spent by **rankings** (parses, top kills, guild and character ranks) and by **searching for reports** (a team's list of nights, "live now").
  - **User points:** spent by requests made **for a signed-in raider**. These come out of that raider's own allowance, not the site's.
  - Limits follow the subscription of the account that owns the key. Per hour, App / Database: no subscription 1,000 / 250; Silver 1,000 / 350; Gold 3,000 / 1,050; Platinum 9,000 / 3,200.
  - Old keys keep the old limits during the test, unless the owner opts in.
  - **Apps that make money will need a new paid "commercial" tier.** No price has been announced yet.
  - These details come from other developers quoting the announcement (sources below). The official pages are behind a "prove you're human" check, so open them yourself to confirm.

## Measured Oct 26 (the /api/ratelimit check, live in 2d0d6b2)
- **The site's key: 9,000 points an hour** since the user bought Warcraft Logs' top (Platinum) plan, $25 a month. It was 3,600.
  The key is still on the old system (one pot). Don't opt into the new App/Database pots without the user.
- **One page of events (10,000 events, ~3 MB) costs 2 points.** A quiet hour's normal site traffic was only tens of points.
- So a raid night (~600 pages) costs about **1,200 points**, and the key opens about **7 new raid nights an hour** site-wide.
  Every raider opening the same night after the first costs nothing (cached).
- Research downloads use at most half the hour (tools in the log library check /api/ratelimit and wait). One downloader at a time.

## What Debrief costs today
- Opening a pull downloads **every event of that pull**, 10,000 events per request. A 20-player Mythic pull logs about 850 events
  a second, so that's **about 1 request for every 12 seconds of pulling**.
  - A Coiled Altar Mythic kill (about 8–10 minutes) is **50–65 requests**.
  - A raid night with about 2 hours of actual pulling is **about 600 requests**.
- On top of that, each kill's parses (rankings) and each team's list of nights cost **Database points**, the smallest pool.
  "Live now" checks every 30 seconds while a team is logging, so many teams logging live at once adds up.
- **What already saves points:** a downloaded night is kept and shared, so the next raider opening the same night costs nothing.
  But that copy is kept per region of the world, not globally. A raider in another region can trigger a second download.
- **Rough capacity.** We don't know the exact price of one download page yet; step 1 below measures it. If a page costs about 1 point:
  - a 3,600-point key opens about **6 new raid nights an hour, site-wide**;
  - a no-subscription key under the new system (1,000 points) opens fewer than 2;
  - so on a busy raid night, **about 10 teams opening logs at the same time would hit the limit**, and 100 teams would be 10× over.

## Options, best first
| # | Fix | What it does | Effort | My take |
|---|---|---|---|---|
| 1 | **Measure the key's real allowance** | One small check reads the key's points per hour, points left and the price of one download. It also confirms which subscription owns the key | tiny | Do first. Everything else depends on these numbers |
| 2 | **Downloads use the raider's own sign-in** | When a raider is signed in with Warcraft Logs, their downloads spend their own User points, not the site's. The site already has the sign-in; today it only uses it for lists of nights and private logs | small–medium | The biggest win: the cost grows with your users instead of landing on one key. Add a gentle "Sign in for faster loading" prompt |
| 3 | **Keep each night once, for everyone, worldwide** | Store a downloaded night in Cloudflare storage (R2), not only the regional cache, so it is never downloaded twice | medium | A big win for guilds where 20 raiders open the same night |
| 4 | **Talk to Warcraft Logs before launch** | Ask about the commercial tier, a higher allowance and their rules for apps like Debrief | an email | Needed anyway if Debrief ever earns money. Better to ask before the test ends in late November |
| 5 | **Push the Companion app** | The PC app reads the raider's own combat log file, so it costs zero Warcraft Logs points | already built | Great for your own guild and power users. Not everyone will install an app |
| 6 | **A separate key for research** | Research chats like me use their own key, so research can never block your raiders | tiny (a second key on the user's account) | Do it. Today's 429 was a research download |
| 7 | **Fewer Database-point calls** | Slow "live now" to 60 s, and load parses only when someone opens them | small | Worth it once the new limits are switched on |
| 8 | **Download only what the checks need** | Ask Warcraft Logs only for the event types the site reads | large (every check must still work) | Later, only if 1–3 aren't enough |

## The first two steps
1. **This week:** add the allowance check, read the numbers once on a quiet day and once on a raid night, and write them into this guide.
   Also open warcraftlogs.com/api/clients and see which subscription the site's key sits under. Don't opt into the new limits yet.
2. **Next:** make signed-in raiders' downloads use their own pass (fall back to the site's key when they aren't signed in, or when their
   pass runs out), and add the "Sign in for faster loading" prompt.
   Owner: whoever owns the Worker and wcl.js. The Main chat routes it.

## Sources (third-party summaries of the official announcement; the official pages need a human check)
- WGA Raid Hub notes on the new App / Database / User points and the tier table (Oct 21, 2026): https://github.com/katogaming88/WGA-Raid-Hub/issues/1592
- Official field list for checking the allowance (limitPerHour, pointsSpentThisHour, pointsResetIn): https://www.warcraftlogs.com/v2-api-docs/warcraft/ratelimitdata.doc.html
- Developers seeing per-key limits of 9,000 and 18,000, and the reset timer being the reliable signal: https://github.com/Erilla/SlashWho/pull/281
- The older 3,600-points-an-hour default: https://forums.combatlogforums.com/t/api-v2-requests-limit-per-second-minute-hour/14659
- Official announcement (behind a human check): https://www.archon.gg/wow/articles/help/archon-api-updates-beta
