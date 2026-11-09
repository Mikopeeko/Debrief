// Automatic team setup, chunks 1 to 5 (Nov 9): the Worker's own code against a fake storage, a fake Warcraft Logs and a made-up guild, on this PC only.
//   node tests/team-setup.mjs
// Checks: the guild roster's last good copy, a team's raiders from its raid nights, rank names, which teams an officer can set up,
// the setup save (claimed once, "set up by"), handing over (guild master or site admin only), and the access history.
import fs from 'fs'; import path from 'path'; import os from 'os'; import { pathToFileURL, fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), SRC = path.join(here, '..', 'src', 'worker_template.js');
let code = fs.readFileSync(SRC, 'utf8').replace("import { WorkerEntrypoint } from 'cloudflare:workers';", 'class WorkerEntrypoint {}').replace(/\b__[A-Z_]+__\b/g, '""');
code = code.replace('const NIGHT_Q = "";', 'const NIGHT_Q = "fights(killType";').replace('const TEAM_REPORTS_Q = "";', 'const TEAM_REPORTS_Q = "reports(guildID";')
  .replace('const CHAR_INFO_Q = "";', 'const CHAR_INFO_Q = "characterInfo";').replace('const CHAR_REPORTS_Q = "";', 'const CHAR_REPORTS_Q = "recentReports";').replace('const TEAM_INFO_Q = "";', 'const TEAM_INFO_Q = "guildInfo";');
code += '\nexport { teamPlan, setupRoute, rankSuggest, teamRegs, setupFind, guildRoster, rosterK, guildMockRoster, setupMockRegs, teamAccess, teamRecheck, teamCron, setupRegs, bnetRoute, whoAmIRoute };\n';
const tmp = path.join(os.tmpdir(), 'debrief-team-setup-' + process.pid + '.mjs'); fs.writeFileSync(tmp, code);

// ---- the edge cache, storage (R2), KV and Warcraft Logs, all fake
const C = new Map(); globalThis.caches = { default: { match: async (r) => (C.has(r.url) ? new Response(C.get(r.url)) : undefined), put: async (r, res) => { C.set(r.url, await res.text()); } } };
const R2 = new Map(); let etagN = 0;
const bucket = { get: async (k) => { if (!R2.has(k)) return null; const v = R2.get(k); return { etag: v.etag, body: new Response(v.data).body, json: async () => JSON.parse(new TextDecoder().decode(v.data)) }; },
  put: async (k, data, o) => { if (o && o.onlyIf && o.onlyIf.etagMatches && (!R2.has(k) || R2.get(k).etag !== o.onlyIf.etagMatches)) return null; const buf = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data); const etag = 'e' + ++etagN; R2.set(k, { data: buf, etag }); return { etag }; },
  delete: async (k) => R2.delete(k) };
const KV = new Map(); const kv = { get: async (k, t) => (KV.has(k) ? (t === 'json' ? JSON.parse(KV.get(k)) : KV.get(k)) : null), put: async (k, v) => KV.set(k, v), delete: async (k) => KV.delete(k) };
const env = { debrief_nights: bucket, DEBRIEF_KV: kv, WCL_CLIENT_ID: 'id', WCL_CLIENT_SECRET: 'secret' };
// (Warcraft Logs: a team (id 555, "Testteam") with three raid nights and one Mythic+ key; a player only in trash doesn't count)
const T0 = Date.UTC(2026, 10, 5, 1, 0); const day = 864e5;
const REPS = [{ code: 'n1a', startTime: T0, zone: { name: 'The Venomous Abyss' } }, { code: 'n1b', startTime: T0 + 2 * 3600e3, zone: { name: 'The Venomous Abyss' } }, { code: 'n2', startTime: T0 + day, zone: { name: 'The Venomous Abyss' } },
  { code: 'n3', startTime: T0 + 3 * day, zone: { name: 'The Venomous Abyss' } }, { code: 'mp', startTime: T0 + 4 * day, zone: { name: 'Mythic+ Season 2' } }];
const actors = [{ id: 1, name: 'Leadone', server: "Zul'jin", icon: 'Paladin-Holy' }, { id: 2, name: 'Raidone', server: "Zul'jin", icon: 'Mage-Fire' }, { id: 3, name: 'Pugone', server: 'Illidan', icon: 'Warrior-Arms' }, { id: 4, name: 'Trashonly', server: "Zul'jin", icon: 'Rogue' }];
const NIGHTS = { n1a: [1, 2], n1b: [1, 2, 3], n2: [1, 2], n3: [1, 3] };
globalThis.fetch = async (u, o) => { const url = String(u);
  if (url.includes('/oauth/token')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }));
  if (url.includes('warcraftlogs.com/api/v2')) { const b = JSON.parse(o.body), q = b.query, v = b.variables || {};
    if (q.includes('reports(guildID')) return new Response(JSON.stringify({ data: { reportData: { reports: { data: v.id === 555 || v.id === 556 || v.id === 557 ? REPS : v.id === 777 && o.headers.Authorization === 'Bearer usertok' ? REPS.slice(0, 3) : [] } } } }));
    if (q.includes('fights(killType')) return new Response(JSON.stringify({ data: { reportData: { report: { endTime: T0, fights: [{ id: 1, friendlyPlayers: NIGHTS[v.code] }, { id: 2, friendlyPlayers: [] }], masterData: { actors } } } } }));
    if (q.includes('characterInfo')) return new Response(JSON.stringify({ data: { characterData: { character: v.name === 'Leadone' ? { id: 9001 } : v.name === 'Raidone' ? { id: 9002 } : null } } }));
    if (q.includes('recentReports')) return new Response(JSON.stringify({ data: { characterData: { character: { recentReports: { data: REPS.filter((r) => r.code !== 'mp').map((r) => ({ ...r, guild: { id: 555, name: 'Testteam' } })) } } } } }));
    if (q.includes('guildInfo')) return new Response(JSON.stringify({ data: { guildData: { guild: { id: v.id, type: 1, server: { name: "Zul'jin" } } } } }));
    return new Response(JSON.stringify({ data: {} })); }
  if (url.includes('oauth.battle.net/token')) return new Response(JSON.stringify({ access_token: 'btok', expires_in: 3600 }));
  if (url.includes('api.blizzard.com/data/wow/realm/index')) return new Response(JSON.stringify({ realms: [{ name: "Zul'jin", slug: 'zuljin' }, { name: 'Illidan', slug: 'illidan' }] }));
  if (url.includes('api.blizzard.com/profile/wow/character/')) { const n = decodeURIComponent(url.split('/profile/wow/character/')[1].split('?')[0].split('/')[1] || ''); const gd = !COMMUNITY && { leadone: 1, raidone: 1, newone: 1, gmone: 1 }[n];
    return new Response(JSON.stringify({ name: n, guild: gd ? { name: 'Testguild', realm: { slug: 'zuljin' } } : undefined })); }
  if (url.includes('api.blizzard.com/data/wow/guild/zuljin/testguild/roster')) return BLIZ ? new Response(JSON.stringify({ members: BLIZ.map(([n, slug, rank]) => ({ character: { name: n, realm: { slug } }, rank })) })) : new Response('down', { status: 503 });
  throw new Error('no network in this test: ' + url); };
let BLIZ = null, COMMUNITY = false;
const W = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp);
let bad = 0; const ok = (c, msg) => { console.log((c ? '  ok   ' : '  FAIL ') + msg); if (!c) bad++; };
const SITE = 'https://debriefme.io', PRAC = 'https://setup-debrief.example.workers.dev';
// (a signed-in person: a session in KV and their Battle.net characters in storage)
let sid = 0; const sign = (name, chars, host) => { const bid = 'b-' + name.toLowerCase(), hex = (++sid).toString(16).padStart(48, 'a'); KV.set('sess:' + hex, JSON.stringify({ bid, exp: Date.now() + 3600e3, mock: host === PRAC || undefined }));
  const pre = host === PRAC ? 'practice-bnet/' : 'bnet/'; R2.set(pre + ('b:' + bid).replace(/[^a-z0-9]+/g, '-') + '.json', { data: new TextEncoder().encode(JSON.stringify({ region: 'us', chars, main: chars[0].n.toLowerCase() + '-' + chars[0].slug, mock: host === PRAC || undefined })), etag: 'x' });
  return { cookie: 'dbs=' + hex, host }; };
const call = async (P, path, body) => { const r = await (path.startsWith('/api/teamsetup') ? W.setupRoute : W.teamPlan)(new Request(P.host + path, { method: body ? 'POST' : 'GET', headers: { Cookie: P.cookie, 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.' + Math.floor(Math.random() * 250) }, body: body ? JSON.stringify(body) : undefined }), env, new URL(P.host + path)); return [r.status, await r.json()]; };

console.log('1. The guild roster: the last good copy when Blizzard does not answer');
const TG = { region: 'us', realm: 'zuljin', name: 'Testguild' };
R2.set(W.rosterK(TG, new URL(SITE)), { data: new TextEncoder().encode(JSON.stringify({ at: Date.now() - 3 * day, members: [{ k: 'leadone-zuljin', n: 'Leadone', rank: 1 }, { k: 'raidone-zuljin', n: 'Raidone', rank: 3 }, { k: 'gmone-zuljin', n: 'Gmone', rank: 0 }].concat([...Array(8).keys()].map((i) => ({ k: 'alt' + i + '-zuljin', n: 'Alt' + i, rank: 7 }))) })), etag: 'r' });
{ const r = await W.guildRoster(env, new URL(SITE), TG); ok(r && r.old && r.members.length === 11, 'Blizzard down: the 3-day-old copy is used (' + (r ? r.members.length + ' members' : 'nothing') + ')'); }
{ const g2 = { ...TG, name: 'Oldguild' }; R2.set(W.rosterK(g2, new URL(SITE)), { data: new TextEncoder().encode(JSON.stringify({ at: Date.now() - 20 * day, members: [] })), etag: 'r' }); ok((await W.guildRoster(env, new URL(SITE), g2)) === null, 'a copy older than two weeks is not used'); }

console.log('2. A team\'s raiders, from its raid nights');
const R = await W.teamRegs(env, new URL(SITE), 'team:555', 'us');
ok(R.nights === 3, 'three raid nights (two reports on one night count once, the Mythic+ key is left out): ' + R.nights);
const by = Object.fromEntries(R.list.map((p) => [p.k, p]));
ok(by['leadone-zuljin'] && by['leadone-zuljin'].c === 3 && by['raidone-zuljin'].c === 2 && by['pugone-illidan'].c === 2, 'nights each: Leadone 3, Raidone 2, Pugone 2');
ok(!by['trashonly-zuljin'], 'someone only in trash pulls is not a raider');
ok(by['leadone-zuljin'].cls === 'PALADIN' && by['leadone-zuljin'].spec === 'Holy', 'class and spec from the log: ' + by['leadone-zuljin'].cls + ' ' + by['leadone-zuljin'].spec);

console.log('3. Rank names, from who raids with the team');
const S = W.rankSuggest(W.guildMockRoster(), W.setupMockRegs('guild:6956'), 'Honestly'), rs = Object.fromEntries(S.map((x) => [x.r, x]));
ok(rs[0].name === 'Guild Master' && rs[0].acc === 'edit', 'rank 0: Guild Master, Edit');
ok(rs[1].name === 'Officer' && rs[1].acc === 'edit', 'rank 1: Officer, Edit');
ok(rs[2].name === 'Honestly raider' && rs[2].acc === 'see', 'rank 2: "' + rs[2].name + '", See (' + rs[2].why + ')');
ok(rs[3].name === 'Trial' && rs[3].acc === 'see', 'rank 3: "' + rs[3].name + '", See (' + rs[3].why + ')');
ok(rs[7].name === 'Alt / Social' && rs[7].acc === 'none', 'rank 7: "' + rs[7].name + '", None (' + rs[7].why + ')');

console.log('4. Which teams each person can set up (test copy, made-up guild)');
const P = {}; for (const n of ['Officertest', 'Raidertest', 'Gmtest', 'Pugtest', 'Newtest', 'Twotest', 'Officera', 'Flëxørçïst']) P[n] = sign(n, [{ n, slug: 'thrall', realm: 'Thrall', g: 'Wolfthorn', gs: 'thrall' }], PRAC);
const F = {}; for (const n of Object.keys(P)) F[n] = (await call(P[n], '/api/teamsetup?step=find'))[1];
const tl = (n) => F[n].teams.map((t) => t.name + (t.can ? ' (can)' : '')).join(', ') || 'none';
ok(F.Officertest.can && F.Officertest.teams.length === 1 && F.Officertest.teams[0].can, 'Officertest (rank 1): ' + tl('Officertest'));
ok(F.Gmtest.can && F.Gmtest.teams.length === 1 && F.Gmtest.teams[0].name === 'Lai Dou Lai Le' && F.Gmtest.teams[0].can, 'Gmtest (rank 0): ' + tl('Gmtest'));
ok(!F.Raidertest.can && F.Raidertest.teams.every((t) => !t.can), 'Raidertest (rank 2): sees ' + tl('Raidertest') + ', can set up none');
ok(!F.Pugtest.can, 'Pugtest (not in the guild): can set up none');
ok(F.Newtest.teams.length === 0, 'Newtest (not in the logs): no teams found');
ok(F.Twotest.teams.length === 2 && !F.Twotest.can, 'Twotest (rank 2, two teams): ' + tl('Twotest'));
{ const [st, j] = await call(P.Raidertest, '/api/teamsetup?step=regs&id=guild:6956'); ok(st === 403, 'Raidertest can\'t read a team\'s raiders for setup: ' + j.error); }
{ const [st, j] = await call(P.Officertest, '/api/teamsetup?step=regs&id=guild:6956'); ok(st === 200 && j.list.length > 15 && j.ranks.length > 4, 'Officertest gets Honestly\'s ' + j.list.length + ' raiders over ' + j.nights + ' nights and ' + j.ranks.length + ' ranks named');
  ok(j.list.find((p) => p.n === 'Pugtest').rank === null && j.list.find((p) => p.n === 'Raidertest').rank === 2, 'raiders show their guild rank, and Pugtest shows as not in the guild'); }

{ const lead = sign('Leadone', [{ n: 'Leadone', slug: 'zuljin', realm: "Zul'jin", g: 'Testguild', gs: 'zuljin' }], SITE), raid = sign('Raidone', [{ n: 'Raidone', slug: 'zuljin', realm: "Zul'jin", g: 'Testguild', gs: 'zuljin' }], SITE);
  const [, a] = await call(lead, '/api/teamsetup?step=find'), [, b] = await call(raid, '/api/teamsetup?step=find'), t = (a.teams || [])[0] || {};
  ok(t.id === 'team:555' && t.kind === 'team' && t.n === 3 && t.can, 'the real way (Warcraft Logs, Blizzard roster from its saved copy): Leadone (rank 1) finds Testteam, 3 nights, can set it up');
  ok((b.teams || []).length === 1 && !b.teams[0].can, 'Raidone (rank 3) finds it too, but can\'t set it up'); }

console.log('5. Setting it up: claimed once');
{ const [st, j] = await call(P.Raidertest, '/api/teamplan?id=guild:6956', { op: 'setup', me: 'Raidertest' }); ok(st === 403, 'Raidertest can\'t: ' + j.error); }
{ const [st, j] = await call(P.Officertest, '/api/teamplan?id=guild:6956', { op: 'setup', me: 'Officertest', players: W.setupMockRegs('guild:6956').list.filter((p) => p.n !== 'Social3').map((p) => p.k), names: { 2: 'Honestly raider' }, keys: { 'wla-rosters': '{"list":[],"cur":null}' } });
  ok(st === 200 && j.ok, 'Officertest sets up Honestly'); }
{ const [, j] = await call(P.Officertest, '/api/teamplan?id=guild:6956'); ok(j.setup && j.setup.by === 'Officertest' && j.setup.guild === 'Wolfthorn', '"Set up by ' + (j.setup && j.setup.by) + '" for ' + (j.setup && j.setup.guild));
  ok(j.you && j.you.lead && j.access === 'edit', 'Officertest leads it and edits'); ok(j.regs && j.regs.n === 19, 'the raiders kept: ' + (j.regs && j.regs.n) + ' (Social3 unticked)');
  ok(j.ranks && j.ranks.acc[2] === 'see' && j.ranks.acc[0] === 'edit' && j.ranks.acc[7] === 'none', 'access picked: rank 0 Edit, rank 2 See, rank 7 None');
  ok(j.alog.length === 1 && /set up Honestly for Wolfthorn, with 19 raiders/.test(j.alog[0].sum), 'access history: "' + (j.alog[0] || {}).sum + '"'); }
{ const [st, j] = await call(P.Gmtest, '/api/teamplan?id=guild:6956', { op: 'setup', me: 'Gmtest' }); ok(st === 403 || st === 409, 'a second setup is refused: ' + j.error); }
{ const [, j] = await call(P.Raidertest, '/api/teamplan?id=guild:6956'); ok(j.access === 'see' && j.alog.length === 0, 'Raidertest (rank 2) sees it, without the access history'); }

console.log('6. Handing it over: the guild master or the site admin only');
await call(P.Raidertest, '/api/teamplan?id=guild:6956'); /* (Raidertest has opened it) */
{ const [st, j] = await call(P.Officertest, '/api/teamplan?id=guild:6956', { op: 'handover', to: 'Raidertest', me: 'Officertest' }); ok(st === 403, 'the officer who set it up can\'t: ' + j.error); }
{ const [st, j] = await call(P.Gmtest, '/api/teamplan?id=guild:6956', { op: 'handover', to: 'Newtest', me: 'Gmtest' }); ok(st === 400, 'someone who never opened it: ' + j.error); }
{ const [st] = await call(P.Gmtest, '/api/teamplan?id=guild:6956', { op: 'handover', to: 'Raidertest', me: 'Gmtest' }); const [, j] = await call(P.Raidertest, '/api/teamplan?id=guild:6956');
  ok(st === 200 && j.you.lead && j.lead === 'Raidertest', 'the guild master hands it to Raidertest, who now leads it'); ok(/handed the team from Officertest to Raidertest/.test(j.alog.map((x) => x.sum).join('|')), 'and the access history says so'); }

console.log('7. A team with no guild and the old way still work');
{ const [st, j] = await call(P.Pugtest, '/api/teamplan?id=team:12345', { op: 'create', name: 'Community', me: 'Pugtest' }); ok(st === 403, 'a Warcraft Logs team page with no raid logs can\'t be claimed by just anyone: ' + j.error);
  const [s2] = await call(P['Flëxørçïst'], '/api/teamplan?id=team:12345', { op: 'create', name: 'Community', me: 'Flëxørçïst' }); ok(s2 === 200, 'the site admin can save it (the old way, no setup)'); }
console.log('8. Raiders join (chunk 3)');
{ const [st] = await call(P.Gmtest, '/api/teamplan?id=team:796679', { op: 'setup', me: 'Gmtest' }); ok(st === 200, 'Gmtest sets up Lai Dou Lai Le too'); }
const mine = async (n) => (await call(P[n], '/api/teamsetup?step=mine'))[1], names = (l) => (l || []).map((t) => t.name + (t.joined ? ' (joined)' : t.no ? ' (not me)' : t.asked ? ' (asked)' : '')).join(', ') || 'none';
{ const m = await mine('Raidertest'); ok(m.teams.length === 1 && m.teams[0].name === 'Honestly' && m.teams[0].n === 11 && m.teams[0].joined, 'Raidertest (Honestly\'s lead since the hand-over) isn\'t asked to join their own team: ' + names(m.teams)); }
{ const m = await mine('Officera'); ok(m.teams.length === 1 && m.teams[0].name === 'Honestly' && m.teams[0].n === 12 && !m.teams[0].joined, 'Officera is asked about Honestly (12 nights): ' + names(m.teams)); }
{ const m = await mine('Twotest'); ok(m.teams.length === 2, 'Twotest is asked about both: ' + names(m.teams)); }
{ const m = await mine('Newtest'); ok(m.teams.length === 0 && m.guild.length === 2, 'Newtest (not in the logs): no prompt, and can ask to join ' + names(m.guild)); }
{ const [, a] = await call(P.Pugtest, '/api/teamplan?id=guild:6956'); ok(a.access === 'see' && a.why === 'regular', 'Pugtest (not in the guild, 10 of 12 nights) sees Honestly as a regular, before joining');
  const [st] = await call(P.Pugtest, '/api/teamplan?id=guild:6956', { op: 'member', yes: true, me: 'Pugtest' }); const [, b] = await call(P.Pugtest, '/api/teamplan?id=guild:6956');
  ok(st === 200 && b.access === 'see' && b.why === 'joined' && b.joined, 'Yes, that\'s me: Pugtest joins (in the logs) and can see the plan'); }
{ const [st, j] = await call(P.Newtest, '/api/teamplan?id=guild:6956', { op: 'member', yes: true, me: 'Newtest' }); ok(st === 403, 'Newtest can\'t just join (not in the logs): ' + j.error); }
{ const [st, j] = await call(P.Pugtest, '/api/teamplan?id=team:796679', { op: 'member', yes: true, ask: true, me: 'Pugtest' }); ok(st === 403, 'Pugtest can\'t ask to join a team they don\'t raid with, outside the guild: ' + j.error); }
{ const [st] = await call(P.Newtest, '/api/teamplan?id=guild:6956', { op: 'member', yes: true, ask: true, me: 'Newtest' }); const m = await mine('Newtest'); ok(st === 200 && m.guild.find((t) => t.name === 'Honestly').asked, 'Newtest asks to join Honestly: ' + names(m.guild)); }
{ const [, o] = await call(P.Officertest, '/api/teamplan?id=guild:6956'); const a = (o.asks || [])[0]; ok(a && a.main === 'Newtest', 'the officer sees the request: ' + (a && a.main));
  const [, r] = await call(P.Twotest, '/api/teamplan?id=guild:6956'); ok(r.access === 'see' && (r.asks || []).length === 0, 'a raider (Twotest, See) doesn\'t see requests'); /* (Raidertest leads it since the hand-over above) */
  const [st] = await call(P.Officertest, '/api/teamplan?id=guild:6956', { op: 'okay', uid: a.uid, yes: true, me: 'Officertest' }); const [, n] = await call(P.Newtest, '/api/teamplan?id=guild:6956');
  ok(st === 200 && n.joined, 'the officer okays it in one click: Newtest is on the team');
  const [, h] = await call(P.Officertest, '/api/teamplan?id=guild:6956'); ok(/let Newtest join/.test(h.alog.map((x) => x.sum).join('|')) && /Pugtest/.test(h.alog.map((x) => x.by).join('|')), 'the access history has the joins'); }
{ const [st] = await call(P.Twotest, '/api/teamplan?id=team:796679', { op: 'member', yes: false, me: 'Twotest' }); const m = await mine('Twotest'); ok(st === 200 && m.teams.find((t) => t.name === 'Lai Dou Lai Le').no, 'Not me: Twotest isn\'t asked about Lai Dou Lai Le again: ' + names(m.teams)); }
{ const [st] = await call(P.Raidertest, '/api/teamplan?id=team:12345', { op: 'member', yes: true, me: 'Raidertest' }); ok(st === 400, 'a team saved the old way can\'t be joined like this'); }
console.log('9. Keeping it right (chunk 4)');
P.Officerb = sign('Officerb', [{ n: 'Officerb', slug: 'thrall', realm: 'Thrall', g: 'Wolfthorn', gs: 'thrall' }], PRAC);
{ const [, a] = await call(P.Officerb, '/api/teamplan?id=guild:6956'), [, b] = await call(P.Officerb, '/api/teamplan?id=team:796679');
  ok(a.access === 'see' && a.you.away && b.access === 'edit', 'Officerb (rank 1) edits Lai Dou Lai Le, which they raid with, and only sees Honestly, which they don\'t');
  const [st, j] = await call(P.Officerb, '/api/teamplan?id=guild:6956', { op: 'ranks', names: {}, acc: {}, me: 'Officerb' }); ok(st === 403, '... and can\'t change who can edit Honestly: ' + j.error); }
{ const [, a] = await call(P.Gmtest, '/api/teamplan?id=guild:6956'); ok(a.access === 'edit' && a.why === 'rank' && a.you.rank === 0, 'the guild master (Gmtest) edits Honestly though they don\'t raid with it'); }
// (the real way: Testteam (team:555) in Testguild, with Blizzard and Warcraft Logs faked)
env.BNET_CLIENT_ID = 'b'; env.BNET_CLIENT_SECRET = 's'; const RK = 'https://debrief.cache/guild-roster/us/zuljin/testguild', fresh = () => { C.delete(RK); C.delete('https://debrief.cache/setup/team-reps/555'); };
BLIZ = [['Leadone', 'zuljin', 1], ['Raidone', 'zuljin', 3], ['Gmone', 'zuljin', 0], ['Newone', 'zuljin', 3]].concat([...Array(8).keys()].map((i) => ['Alt' + i, 'zuljin', 7])); fresh();
const S1 = { lead: sign('Leadone', [{ n: 'Leadone', slug: 'zuljin', realm: "Zul'jin", g: 'Testguild', gs: 'zuljin' }], SITE), gm: sign('Gmone', [{ n: 'Gmone', slug: 'zuljin', realm: "Zul'jin", g: 'Testguild', gs: 'zuljin' }], SITE), nw: sign('Newone', [{ n: 'Newone', slug: 'zuljin', realm: "Zul'jin", g: 'Testguild', gs: 'zuljin' }], SITE) };
{ const [st] = await call(S1.lead, '/api/teamplan?id=team:555', { op: 'setup', me: 'Leadone' }); ok(st === 200, 'Leadone (rank 1) sets up Testteam'); }
await call(S1.lead, '/api/teamplan?id=team:555', { op: 'set', keys: { 'wla-rosters': JSON.stringify({ list: [{ id: 'r1', name: 'Testteam', players: [{ n: 'Leadone', cls: 'PALADIN', sid: 65, role: 'healer', bench: false }] }], cur: 'r1' }) }, me: 'Leadone' });
{ const [st] = await call(S1.nw, '/api/teamplan?id=team:555', { op: 'member', yes: true, ask: true, me: 'Newone' }); ok(st === 200, 'Newone (not in the logs yet) asks to join'); }
await call(S1.gm, '/api/teamplan?id=team:555'); /* (the guild master has opened the plan) */
actors.push({ id: 5, name: 'Newone', server: "Zul'jin", icon: 'Priest-Holy' }); NIGHTS.n4 = [1, 2, 5]; REPS.unshift({ code: 'n4', startTime: T0 + 5 * day, zone: { name: 'The Venomous Abyss' } }); /* (a new raid night, Newone in it) */
BLIZ = BLIZ.filter((m) => m[0] !== 'Leadone'); fresh(); /* (and Leadone leaves the guild) */
{ const r = await W.teamRecheck(env, new URL(SITE), 'team:555'); ok(r.saved && r.added.includes('Newone'), 'the daily re-check finds Newone in the new night: ' + r.added.join(', '));
  ok(r.joined.includes('Newone'), 'Newone, who had asked, is let in by themselves'); ok((r.roster || []).includes('Newone'), 'and goes on the roster, from the raid logs'); ok(r.lead === 'Gmone', 'Leadone left the guild, so the guild master leads it now: ' + r.lead); }
{ const [, a] = await call(S1.gm, '/api/teamplan?id=team:555'), [, b] = await call(S1.lead, '/api/teamplan?id=team:555'), [, c] = await call(S1.nw, '/api/teamplan?id=team:555');
  ok(a.you.lead && a.lead === 'Gmone', 'Gmone is the lead'); ok(!b.you.lead && b.access === 'see' && b.why === 'regular', 'Leadone isn\'t the lead any more; still in the logs, they can see it (' + b.why + ')');
  ok(c.joined, 'Newone is on the team'); ok(/left Testguild, so Gmone \(the guild master\) leads Testteam now/.test(a.alog.map((x) => x.sum).join('|')), 'the access history says why'); }
BLIZ = null; fresh(); { const [, a] = await call(S1.gm, '/api/teamplan?id=team:555'); ok(a.access === 'edit', 'Blizzard down: the saved roster keeps the guild master in'); }
{ const before = JSON.parse(new TextDecoder().decode(R2.get('team-list.json').data)); ok(before.some((x) => x.id === 'team:555'), 'the set-up team is on the daily list');
  before.forEach((x) => { x.chk = 0; }); R2.set('team-list.json', { data: new TextEncoder().encode(JSON.stringify(before)), etag: 'l' }); await W.teamCron(env);
  const after = JSON.parse(new TextDecoder().decode(R2.get('team-list.json').data)); ok(after.filter((x) => x.chk > 0).length === 1, 'each 10-minute run re-checks one team that is due'); }
console.log('10. Edge cases (chunk 5)');
{ const R0 = await W.setupRegs(env, new URL(SITE), 'team:777', 'us', { uid: 'b:x' }), R1 = await W.setupRegs(env, new URL(SITE), 'team:777', 'us', { uid: 'b:x', t: 'usertok' });
  ok(R0.nights === 0 && !R0.private, 'a team with private logs shows no nights to everyone'); ok(R1.nights === 2 && R1.private, 'with the officer\'s own Warcraft Logs connection, its private nights are read: ' + R1.nights); }
P.Strangertest = sign('Strangertest', [{ n: 'Strangertest', slug: 'illidan', realm: 'Illidan', g: '', gs: '' }], PRAC);
{ const [, o] = await call(P.Officertest, '/api/teamplan?id=guild:6956'), [, r] = await call(P.Twotest, '/api/teamplan?id=guild:6956');
  ok(/^[a-f0-9]{18}$/.test(o.inv || '') && !r.inv, 'the officers get the invite link; a raider doesn\'t');
  const [s0] = await call(P.Strangertest, '/api/teamplan?id=guild:6956', { op: 'member', yes: true, inv: 'abcdefabcdef', me: 'Strangertest' }); ok(s0 === 403, 'a wrong invite key doesn\'t let anyone in');
  const [, a] = await call(P.Strangertest, '/api/teamplan?id=guild:6956'); ok(a.access === 'none', 'Strangertest (not in the guild, not in the logs) can\'t open Honestly');
  const [s1] = await call(P.Strangertest, '/api/teamplan?id=guild:6956', { op: 'member', yes: true, inv: o.inv, me: 'Strangertest' }); const [, b] = await call(P.Strangertest, '/api/teamplan?id=guild:6956');
  ok(s1 === 200 && b.joined && b.access === 'see', 'the invite link lets Strangertest in at once');
  const [s2] = await call(P.Twotest, '/api/teamplan?id=guild:6956', { op: 'invite', me: 'Twotest' }); ok(s2 === 403, 'a raider can\'t make a new invite link');
  const [s3] = await call(P.Officertest, '/api/teamplan?id=guild:6956', { op: 'invite', me: 'Officertest' }); const [, o2] = await call(P.Officertest, '/api/teamplan?id=guild:6956');
  const [s4, j4] = await call(P.Newtest, '/api/teamplan?id=team:796679', { op: 'member', yes: true, inv: o.inv, me: 'Newtest' });
  ok(s3 === 200 && o2.inv && o2.inv !== o.inv && s4 === 403, 'a new link replaces the old one: ' + j4.error); }
console.log('11. Joining puts you on the roster when the raid logs match (Flex: "If it matches their raid history yes")');
const rosterOf = async (P0, id) => { const [, d] = await call(P0, '/api/teamplan?id=' + id); const o = JSON.parse(((d.keys || {})['wla-rosters'] || {}).v || 'null'); return o ? (o.list.find((x) => x.id === o.cur) || o.list[0]).players.map((p) => p.n) : []; };
await call(P.Gmtest, '/api/teamplan?id=team:796679', { op: 'set', keys: { 'wla-rosters': JSON.stringify({ list: [{ id: 'r1', name: 'Lai Dou Lai Le', players: [{ n: 'Gmtest', cls: 'MONK', sid: 270, role: 'healer', bench: false }] }], cur: 'r1' }) }, me: 'Gmtest' });
P.Raider13 = sign('Raider13', [{ n: 'Raider13', slug: 'thrall', realm: 'Thrall', g: 'Wolfthorn', gs: 'thrall', cls: 'MAGE', sid: 63 }, { n: 'Raider13alt', slug: 'thrall', realm: 'Thrall', g: 'Wolfthorn', gs: 'thrall' }], PRAC);
{ const [st, j] = await call(P.Raider13, '/api/teamplan?id=team:796679', { op: 'member', yes: true, me: 'Raider13' }); const ros = await rosterOf(P.Gmtest, 'team:796679');
  ok(st === 200 && j.roster === 'Raider13' && ros.includes('Raider13') && !ros.includes('Raider13alt'), 'Yes, that\'s me: Raider13 (in the logs) goes on the roster with the character the logs show: ' + ros.join(', '));
  const [, d] = await call(P.Gmtest, '/api/teamplan?id=team:796679'); ok(/Raider13 joined the roster \(in the raid logs\)/.test((d.log || []).map((x) => x.sum).join('|')), 'and the plan\'s change list says so (the lead can undo it)'); }
{ await call(P.Raider13, '/api/teamplan?id=team:796679', { op: 'member', yes: true, me: 'Raider13' }); const ros = await rosterOf(P.Gmtest, 'team:796679'); ok(ros.filter((n) => n === 'Raider13').length === 1, 'saying Yes again doesn\'t add them twice'); }
{ const [, g] = await call(P.Gmtest, '/api/teamplan?id=team:796679'); P.Invitee = sign('Invitee', [{ n: 'Invitee', slug: 'illidan', realm: 'Illidan', g: '', gs: '' }], PRAC);
  const [st] = await call(P.Invitee, '/api/teamplan?id=team:796679', { op: 'member', yes: true, inv: g.inv, me: 'Invitee' }); const ros = await rosterOf(P.Gmtest, 'team:796679');
  ok(st === 200 && !ros.includes('Invitee'), 'someone who joins with the invite link (not in the logs) is on the team but not put on the roster'); }
{ const [st] = await call(P.Newtest, '/api/teamplan?id=team:796679', { op: 'member', yes: true, ask: true, me: 'Newtest' }); const [, o] = await call(P.Gmtest, '/api/teamplan?id=team:796679'); const a = (o.asks || []).find((x) => x.main === 'Newtest');
  await call(P.Gmtest, '/api/teamplan?id=team:796679', { op: 'okay', uid: a && a.uid, yes: true, me: 'Gmtest' }); const ros = await rosterOf(P.Gmtest, 'team:796679'); ok(st === 200 && a && !ros.includes('Newtest'), 'someone an officer lets in (not in the logs) isn\'t put on the roster either'); }
console.log('12. Claiming a Warcraft Logs team page (team:N) follows the guild rule');
BLIZ = [['Raidone', 'zuljin', 3], ['Gmone', 'zuljin', 0], ['Newone', 'zuljin', 3], ['Offtwo', 'zuljin', 1]].concat([...Array(8).keys()].map((i) => ['Alt' + i, 'zuljin', 7])); fresh();
const S2 = { raid: sign('Raidone', [{ n: 'Raidone', slug: 'zuljin', realm: "Zul'jin", g: 'Testguild', gs: 'zuljin' }], SITE), off: sign('Offtwo', [{ n: 'Offtwo', slug: 'zuljin', realm: "Zul'jin", g: 'Testguild', gs: 'zuljin' }], SITE),
  out: sign('Outsider', [{ n: 'Outsider', slug: 'illidan', realm: 'Illidan', g: 'Elsewhere', gs: 'illidan' }], SITE), pug: sign('Pugone', [{ n: 'Pugone', slug: 'illidan', realm: 'Illidan', g: '', gs: '' }], SITE),
  admin: sign('Flëxørçïst', [{ n: 'Flëxørçïst', slug: 'thrall', realm: 'Thrall', g: 'Adequate', gs: 'zuljin' }], SITE) };
{ const [, c] = await call(S2.raid, '/api/teamplan?id=team:556&claim=1'); ok(c.claim === 'Only the guild master or an officer can set up this team.', 'Testguild\'s team page: a raider (rank 3) is told "' + c.claim + '"');
  const [st] = await call(S2.raid, '/api/teamplan?id=team:556', { op: 'create', name: 'Guildteam', me: 'Raidone' }); ok(st === 403, '... and the save is refused by the site, not just hidden');
  const [s2] = await call(S2.out, '/api/teamplan?id=team:556', { op: 'create', name: 'Guildteam', me: 'Outsider' }); ok(s2 === 403, 'someone outside the guild can\'t claim it');
  const [s3] = await call(S2.pug, '/api/teamplan?id=team:556', { op: 'create', name: 'Guildteam', me: 'Pugone' }); ok(s3 === 403, 'a regular from outside the guild (2 nights) can\'t claim a guild\'s team either');
  const [, c2] = await call(S2.off, '/api/teamplan?id=team:556&claim=1'); ok(c2.claim === '', 'an officer (rank 1) of the guild may save it');
  const [s4] = await call(S2.off, '/api/teamplan?id=team:556', { op: 'create', name: 'Guildteam', me: 'Offtwo' }); ok(s4 === 200, '... and does'); }
{ const [, c] = await call(S2.admin, '/api/teamplan?id=team:558&claim=1'); ok(c.claim === '', 'the site admin may save any team page'); }
COMMUNITY = true;
{ const [, a] = await call(S2.pug, '/api/teamplan?id=team:557&claim=1'), [, b] = await call(S2.out, '/api/teamplan?id=team:557&claim=1'), [, c] = await call(S2.raid, '/api/teamplan?id=team:557&claim=1');
  ok(a.claim === '', 'a team with no guild: someone who raids with it on 2 nights (Pugone) may save it');
  ok(b.claim === 'Only someone who raids with this team can set it up.', 'someone who doesn\'t raid with it can\'t: "' + b.claim + '"'); ok(c.claim === '', 'Raidone (3 nights) may too'); }
COMMUNITY = false;
{ const [st] = await call(S2.raid, '/api/teamplan?id=team:555', { op: 'create', name: 'x', me: 'Raidone' }); const [, d] = await call(S2.raid, '/api/teamplan?id=team:555'); ok(st === 409 && d.lead === 'Gmone', 'a team already saved stays as it is: saving over it is refused (409), its lead unchanged'); }
console.log('13. View as a raider: the site admin\'s own switch');
const sw = async (P0, on) => { const r = await W.bnetRoute(new Request(P0.host + '/api/bnet', { method: 'POST', headers: { Cookie: P0.cookie, 'Content-Type': 'application/json', Origin: P0.host }, body: JSON.stringify({ asRaider: on }) }), env, new URL(P0.host + '/api/bnet')); return [r.status, await r.json()]; };
const whoIs = async (P0) => (await W.whoAmIRoute(new Request(P0.host + '/api/whoami', { headers: { Cookie: P0.cookie } }), env, new URL(P0.host + '/api/whoami'))).json();
await call(S2.admin, '/api/teamplan?id=team:558', { op: 'create', name: 'Adminteam', me: 'Flëxørçïst' });
{ const [, a] = await call(S2.admin, '/api/teamplan?id=team:558'); ok(a.you.lead && a.access === 'edit', 'off: the site admin leads their own team and edits it'); ok((await whoIs(S2.admin)).raider === false, 'the switch is offered to the site admin (off)'); }
{ ok((await whoIs(S2.raid)).raider === null, 'nobody else gets the switch'); const [st] = await sw(S2.raid, true); ok(st === 403, '... and nobody else can turn it on'); }
{ const [st, j] = await sw(S2.admin, true); ok(st === 200 && j.asRaider, 'the site admin turns it on');
  const [, a] = await call(S2.admin, '/api/teamplan?id=team:558'); ok(!a.you.lead && a.access === 'see' && a.why === 'member', 'on: not the lead of their own team; they see it as a member, like any raider (' + a.access + ', ' + a.why + ')');
  const [s2] = await call(S2.admin, '/api/teamplan?id=team:558', { op: 'set', keys: { 'wla-alts': '{"a":1}' }, me: 'Flëxørçïst' }); ok(s2 === 403, '... and can\'t edit it');
  const [s3] = await call(S2.admin, '/api/teamplan?id=team:558', { op: 'officer', add: 'Raidone', me: 'Flëxørçïst' }); ok(s3 === 403, '... or add an officer');
  const [, c] = await call(S2.admin, '/api/teamplan?id=team:559&claim=1'); ok(c.claim !== '', 'no site admin: can\'t claim a team page they don\'t raid with');
  const [, x] = await call(S2.admin, '/api/teamplan?id=team:555'); ok(x.access === 'none' && x.why !== 'admin', 'no site admin on other teams either (' + x.access + ', ' + x.why + ')');
  ok((await whoIs(S2.admin)).raider === true, 'whoami says it\'s on (the page shows the strip)'); }
{ const [st, j] = await sw(S2.admin, false); const [, a] = await call(S2.admin, '/api/teamplan?id=team:558'); ok(st === 200 && !j.asRaider && a.you.lead && a.access === 'edit', 'it always turns off again: lead and site admin, and the team\'s owner never changed'); }
console.log(bad ? bad + ' failed' : 'all passed'); process.exit(bad ? 1 : 0);
