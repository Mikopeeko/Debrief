# Automatic team setup: the plan (Nov 9)

Flex's goal: teams set themselves up from Battle.net + Warcraft Logs + Blizzard's guild roster, with as little typing as possible,
and no way to abuse it. Build after the Wed Nov 11 raid night. Step 1 (rank 0–1 access, lead by Battle.net/name+realm,
only rank 0–1 can claim) is LIVE (52ddc2ee).

## What each source tells us
- **Battle.net sign-in:** which characters are yours (proof of identity).
- **Blizzard guild roster:** each member's rank NUMBER (no names: the web API never sends rank names; checked Nov 9).
  Rank 0 = Guild Master always. Rank 1 = Officer by default (guilds can change it).
- **Warcraft Logs:** who raids together (the team), and how often.
- **Companion app (bonus):** the real in-game rank names, when anyone in the guild has it.
- NOT used: who uploads logs (Flex uploads Wolfthorn's and isn't an officer; "it could mess it up").

## Officer's first sign-in: guided setup (claimed only once)
1. Debrief sees they're rank 0 or 1 of a guild whose team isn't set up → "Set up your team".
2. It finds the team from Warcraft Logs (who raids together) → the officer checks the list → OK.
3. It names the ranks by cross-referencing: rank 0 Guild Master, rank 1 Officer; a rank where most people raid with this team →
   "<Team> raider"; few nights → "Trial"; never in logs + big rank → "Alt / Social". Officer fixes any name.
4. Sensible access in one click: officers Edit, the team's raider ranks See, everyone else None.
5. Done: "Set up by <name>". Anyone else trying later: "<Team> is already set up. Ask an officer for access."
   Only the GM or the site admin can hand it over. Several teams in one guild: each team set up once.

## Raider's first sign-in (Flex: "They shouldn't need to do anything other than log in and get prompted")
- Debrief checks the logs → one prompt: "You raid with Wolfthorn. Join the team?" [Yes, that's me] [Not me].
- Yes → on the team: plan, jobs, notes. No claiming spots, no picking characters, no setting a main, no approval wait.
- Two teams → both listed, ticked. Not in any logs (new trial) → "Not seeing your team?" asks to join, an officer okays
  in one click; auto-confirmed after their first logged raid. "Not me" → nothing; can join later from the menu.

## Keeping it right over time
- Re-check the Blizzard roster daily and on sign-in: promotions gain rights, guild leavers lose access.
- If Blizzard's data is down, keep the last good copy (nobody locked out mid-raid).
- Officers only edit the teams their characters actually raid with (multi-team guilds).
- Friends/pugs outside the guild who raid regularly can SEE the plan.
- Alts count as you through Battle.net (an alt in the "Alt" rank still counts if your main raids with the team).
- Setup officer leaves the guild → team stays; GM and officers keep control.
- Wrong claim → GM or site admin fixes it in one click. Keep a simple history of access changes.

## Edge cases
- New team with no logs yet → add raiders by hand or an invite link until the first logged raid.
- Private Warcraft Logs reports → the team needs "Connect Warcraft Logs".
- Existing teams (Wolfthorn) keep working as they are; no forced re-setup.
- Roster auto-imported from the guild's recent Warcraft Logs reports the moment a team is set up.

## Before launch, test with
- Wolfthorn, one guild with several teams, and one team with no guild.

Compared with WowUtils (Viserio): they don't use guild ranks at all (creator = owner, invite links, manual roles, team names
not unique). Worth copying: their checklist-style setup.

## Build plan (the build chat, Nov 9)

Five chunks. Each one is tested on the "setup" test copy (https://setup-debrief.james-m-nemecek.workers.dev), pushed to GitHub on its
own, and reported to Main as "Done, pushed <commit>". Nothing goes live without Flex's "push it".

**Ground rules for every chunk**
- Wolfthorn and every team saved before this keep working exactly as they do: no forced setup, their rank picks untouched. The new
  rules (officers edit only teams they raid with, joined raiders see) apply to teams made with the new setup ("set up by").
- No team data without a Battle.net sign-in. Flex as site admin sees and edits every team.
- Warcraft Logs use stays small: a team's raiders are read from its last 12 raid nights once at setup and once a day after,
  and each night is read only once (kept at the edge). No who-uploaded-it anywhere.
- Test people on the test copy (made-up accounts): Gmtest (rank 0), Officertest (rank 1), Raidertest (in the logs),
  Newtest (in the guild, not in the logs), Pugtest (raids with the team, not in the guild), Twotest (raids with two teams).

**Chunk 1: the groundwork (Worker only, nothing new on screen)**
- Keep the last good copy of each guild's Blizzard roster, and use it when Blizzard doesn't answer. Today an outage would lock
  everyone out of a guild team's plan, even mid-raid.
- A team's raiders from Warcraft Logs: who was in its boss pulls over its last 12 raid nights, and how many nights each.
- Which teams an officer can set up: the teams their own characters raid with (from Warcraft Logs), plus the guild's own page.
  Already set up: "<Team> is already set up by <name>. Ask an officer for access."
- The team remembers "set up by <name>, <date>" and keeps a short history of access changes (who set up, ranks changed, handed
  over, joined, asked).
- Handing a team over: only the guild master or the site admin.
- Node tests for all of it.

**Chunk 2: the officer's setup (on screen)**
- Home, for a guild master or officer with a team not set up yet: a "Set up your team" card instead of the sign-in button.
- One sheet, in the style of "Who can edit, who can see", with a checklist down the side:
  1. Your team: the teams found in the logs, with how many nights you were there.
  2. Your raiders: everyone found, with nights played; untick anyone who shouldn't be there.
  3. Ranks and access: each rank named for you (Guild Master, Officer, "<Team> raider", Trial, Alt / Social), with who is in it and
     why, and Edit / See / None picked already. Fix any name; one click to use them.
  4. Done: "Wolfthorn is set up." The roster is made from the raiders, ready on Plan.
- The team pop-up says "Set up by <name>" and the guild master gets "Hand over".

**Chunk 3: raiders join (on screen)**
- A raider's first sign-in: one prompt, "You raid with <Team>. Join the team?" [Yes, that's me] [Not me]. Two teams: both listed,
  both ticked. Yes puts them on the team (plan, jobs, notes) with nothing else to do. Not me: nothing; they can join from the menu later.
- Not in the logs yet: "Not seeing your team?" asks to join a team set up in their guild. An officer okays it in one click in the team
  pop-up, or it okays itself after their first logged raid with the team.

**Chunk 4: keeping it right**
- Once a day (one team per 10-minute run, so Warcraft Logs is never busy): read the team's newest raid nights again, okay waiting
  raiders who showed up, and refresh the guild roster's saved copy. Promotions and leavers already follow the roster within the hour.
- Officers edit only the teams their characters raid with (the guild master edits all of the guild's teams).
- Regular raiders from outside the guild can see the plan. Alts count through Battle.net (your best rank, any of your characters).
- The officer who set it up leaving the guild doesn't strand the team: the guild master and officers keep control, and the lead
  passes to the guild master.
- "Access history" in the team pop-up.

**Chunk 5: edge cases**
- No logs yet: set up with an empty roster and add raiders by hand, or share an invite link until the first logged raid.
- Private Warcraft Logs reports: setup says the team needs "Connect Warcraft Logs" to read them.
- The guild's own page and a separate team page both work; several teams in one guild each set up once.
