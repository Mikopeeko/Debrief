// run25: "Glow my cooldowns" in a fake WoW. A fake NSRT reads a Coiled Altar note and fires NSRT_REMINDER_SHOW for the player's
// own lines (as NSRT does), on a fake clock; a fake Cooldown Manager holds the Holy Paladin cooldowns. Prints what glows when.
const fs = require('fs');
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = require('fengari');
const base = fs.readFileSync(__dirname + '/run24.js', 'utf8');
let stub = base.slice(base.indexOf('const stub = `') + 14); stub = stub.slice(0, stub.indexOf('\n`;'));
// (frames remember what they're anchored to; animation groups exist; a fake clock runs timers)
stub = stub.replace('if k == "SetFont" then return function() return true end end',
  'if k == "SetFont" then return function() return true end end\n' +
  '    if k == "SetPoint" then return function(self, p, rel) if type(rel) == "table" then self._anchor = rel end end end\n' +
  '    if k == "ClearAllPoints" then return function(self) self._anchor = nil end end\n' +
  '    if k == "CreateAnimationGroup" then return function(self) return mk("AnimationGroup") end end\n' +
  '    if k == "CreateAnimation" then return function(self) return mk("Animation") end end');
const extra = `
NOW = 0; TIMERS = {}
function GetTime() return NOW end
C_Timer = { After = function(s, fn) TIMERS[#TIMERS + 1] = { at = NOW + s, fn = fn } end,
  NewTimer = function(s, fn) local t = { at = NOW + s, fn = fn }; t.Cancel = function(self) self.dead = true end; TIMERS[#TIMERS + 1] = t; return t end }
function ADVANCE(to) while true do local best; for i, t in ipairs(TIMERS) do if not t.dead and t.at <= to and (not best or t.at < TIMERS[best].at) then best = i end end
  if not best then break end; local t = table.remove(TIMERS, best); NOW = t.at; t.fn() end; NOW = to end
function issecretvalue() return false end
NAMES = { [31821] = "Aura Mastery", [31884] = "Avenging Wrath", [6940] = "Blessing of Sacrifice", [375576] = "Divine Toll", [642] = "Divine Shield", [1022] = "Blessing of Protection" }
C_Spell.GetSpellName = function(id) return NAMES[id] end
local function item(id) local f = mk("Frame"); f._label = NAMES[id]; f.GetSpellID = function() return id end; f.GetBaseSpellID = function() return id end; f.cooldownInfo = { spellID = id }; return f end
ESS = { item(31821), item(31884), item(375576), item(642) }; UTIL = { item(6940) }
EssentialCooldownViewer = { GetItemFrames = function() return ESS end }
UtilityCooldownViewer = { GetItemFrames = function() return UTIL end }
CB = {}
NSAPI = { RegisterCallback = function(target, event, fn) CB[event] = fn end }
function GLOWING() local l = {}; for _, f in ipairs(FRAMES) do if f._shown and f._anchor then local lb = rawget(f._anchor, "_label"); l[#l + 1] = type(lb) == "string" and lb or "big icon" end end; table.sort(l); return #l > 0 and table.concat(l, ", ") or "nothing" end
`;
const NOTE = `EncounterID:3600;Difficulty:Mythic;Name:The Coiled Altar
time:20;ph:1;tag:Flëxørçïst;spellid:31821;
time:45;ph:1;tag:Flëxørçïst;spellid:31884;
time:62;ph:1;tag:Flëxørçïst;spellid:6940;
time:30;ph:2;tag:Flëxørçïst;spellid:375576;
time:70;ph:1;tag:Flëxørçïst;spellid:1022;
time:25;ph:1;tag:Optt;spellid:64843;
time:40;ph:1;tag:everyone;text:Healthstone;`;
const L = lauxlib.luaL_newstate(); lualib.luaL_openlibs(L);
function run(chunk, name) { if (lauxlib.luaL_loadbuffer(L, to_luastring(chunk), null, to_luastring(name)) !== 0 || lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0) !== 0) { console.log('LUA ERROR: ' + to_jsstring(lua.lua_tostring(L, -1))); process.exit(1); } }
run(stub + '\n' + extra, 'stub');
const src = fs.readFileSync(process.argv[2], 'utf8');
run('local f = assert(load(' + JSON.stringify(src).replace(/\\u([0-9a-f]{4})/gi, (m, h) => '\\u{' + h + '}') + ', "@Debrief.lua")); f("Debrief")', 'load');
lua.lua_pushstring(L, to_luastring(NOTE)); lua.lua_setglobal(L, to_luastring('NOTE'));
run(`
local ev = FRAMES[#FRAMES]; local fire = ev:GetScript("OnEvent")
fire(ev, "ADDON_LOADED", "Debrief"); fire(ev, "PLAYER_LOGIN")
local gev = DebriefGlowEvents; local gfire = gev:GetScript("OnEvent"); gfire(gev, "PLAYER_LOGIN")
print("hooked into NSRT: " .. tostring(CB.NSRT_REMINDER_SHOW ~= nil))
-- a fake NSRT: the player's own lines with a spell, shown 8 s before their time (phase 2 starts at 2:30)
local PH = { [1] = 0, [2] = 150 }
local function pull()
  for line in NOTE:gmatch("[^\\n]+") do
    local t, ph, tag, sp = line:match("time:([%d.]+);ph:([%d.]+);tag:([^;]+);spellid:(%d+)")
    if t and tag:find(UnitName("player"), 1, true) then
      local at = PH[tonumber(ph)] + tonumber(t)
      C_Timer.After(at - 8, function() CB.NSRT_REMINDER_SHOW("NSRT_REMINDER_SHOW", { spellID = tonumber(sp), dur = 8, expires = GetTime() + 8 }, nil) end)
    end
  end
end
local function at(t, what) ADVANCE(t); print(string.format("%3d:%04.1f  %-44s glowing: %s", math.floor(t / 60), t % 60, what, GLOWING())) end
local function press(id) gfire(gev, "UNIT_SPELLCAST_SUCCEEDED", "player", "cast-guid", id) end

print("-- setting OFF")
NOW = 0; TIMERS = {}; pull(); at(25, "Aura Mastery was due at 0:20")
gfire(gev, "ENCOUNTER_END")

print("-- setting ON (/dmo > Raid > Glow my cooldowns)")
DebriefDB.glowCds = true
NOW = 0; TIMERS = {}; pull()
at(12, "NSRT pops up Aura Mastery (8 s early)")
at(19.9, "just before 0:20")
at(20, "Aura Mastery due")
press(31821); at(21, "you pressed Aura Mastery")
at(45, "Avenging Wrath due")
at(52.9, "not pressed yet")
at(53.1, "8 s later")
at(62, "Blessing of Sacrifice due (Utility row)")
press(6940); at(63, "you pressed Blessing of Sacrifice")
at(70, "Blessing of Protection due (not on the bar)")
at(180, "Divine Toll due (phase 2 + 0:30)")
gfire(gev, "ENCOUNTER_END"); at(181, "boss died (ENCOUNTER_END)")
print("-- /debrief glow (test)")
SlashCmdList.DEBRIEF("glow"); at(182, "test glow")
at(185.1, "3 s later")
`, 'scenario');
