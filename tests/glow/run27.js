// run27: Debrief Glow 0.2 in a fake WoW. Fake NSRT + fake Cooldown Manager + fake clock (from run25), fake Settings, sounds,
// text to speech, drop-downs and colour picker. Prints what glows (with its style and colour), what plays and what is said, when.
// Also drives the "Your spells" window like a player would. Any "LUA ERROR" or "FAIL" line means something broke.
// Run: npm i fengari, then node tests/glow/run27.js companion/addon/DebriefGlow/DebriefGlow.lua  (run24.js + run25.js hold the fake WoW)
const fs = require('fs');
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = require('fengari');
const r25 = fs.readFileSync(__dirname + '/run25.js', 'utf8');
const base = fs.readFileSync(__dirname + '/run24.js', 'utf8');
let stub = base.slice(base.indexOf('const stub = `') + 14); stub = stub.slice(0, stub.indexOf('\n`;'));
stub = stub.replace('if k == "SetFont" then return function() return true end end',
  'if k == "SetFont" then return function() return true end end\n' +
  '    if k == "SetPoint" then return function(self, p, rel) if type(rel) == "table" then self._anchor = rel end end end\n' +
  '    if k == "ClearAllPoints" then return function(self) self._anchor = nil end end\n' +
  '    if k == "SetAllPoints" then return function(self, rel) if type(rel) == "table" then self._anchor = rel end end end\n' +
  '    if k == "SetVertexColor" then return function(self, r, g, b) self._rgb = { r, g, b } end end\n' +
  '    if k == "SetFrameStrata" then return function(self, v) self._strata = v end end\n' +
  '    if k == "SetFrameLevel" then return function(self, v) self._level = v end end\n' +
  '    if k == "SetChecked" then return function(self, v) self._checked = not not v end end\n' +
  '    if k == "GetChecked" then return function(self) return self._checked end end\n' +
  '    if k == "CreateAnimationGroup" then return function(self) return mk("AnimationGroup") end end\n' +
  '    if k == "CreateAnimation" then return function(self) return mk("Animation") end end');
let extra = r25.slice(r25.indexOf('const extra = `') + 15); extra = extra.slice(0, extra.indexOf('\n`;'));
extra += `
SOUNDKIT.RAID_WARNING = 8959; SOUNDKIT.READY_CHECK = 8960; SOUNDKIT.ALARM_CLOCK_WARNING_3 = 12889
PLAYED = {}; SPOKEN = {}
function PlaySound(id, ch) PLAYED[#PLAYED + 1] = "sound " .. id .. " (" .. tostring(ch) .. ")" end
function PlaySoundFile(p, ch) PLAYED[#PLAYED + 1] = "file " .. p end
C_VoiceChat = { GetTtsVoices = function() return { { voiceID = 0, name = "Microsoft David" }, { voiceID = 1, name = "Microsoft Zira" } } end,
  SpeakText = function(v, t, rate, vol) SPOKEN[#SPOKEN + 1] = '"' .. t .. '" (voice ' .. v .. ')' end }
C_Texture = { GetAtlasInfo = function(a) return { width = 1 } end }
C_AddOns = { IsAddOnLoaded = function() return false end }
SETTINGS = {}
local function obj() return setmetatable({}, { __index = function(t, k) return function() return t end end }) end
Settings = { VarType = { Boolean = "boolean", Number = "number", String = "string" },
  RegisterVerticalLayoutCategory = function(n) local c = obj(); c.GetID = function() return 7 end; return c, obj() end,
  RegisterAddOnSetting = function(cat, var, key, tbl, kind, name, def) SETTINGS[#SETTINGS + 1] = name .. " = " .. tostring(tbl[key]); return obj() end,
  CreateCheckbox = function() end, CreateSlider = function() end, CreateDropdown = function(cat, s, fn) local d = fn() end,
  CreateSliderOptions = function() return obj() end, CreateControlTextContainer = function() local c = { d = {} }; c.Add = function(self, v, l) self.d[#self.d + 1] = { v, l } end; c.GetData = function(self) return self.d end; return c end,
  RegisterCanvasLayoutCategory = function(frame, name) CANVAS_CAT = name; return obj() end, RegisterAddOnCategory = function() end, OpenToCategory = function(id) print("settings opened: " .. id) end, SetOnValueChangedCallback = function(v, fn) CHANGED = CHANGED or {}; CHANGED[v] = fn end }
function CreateSettingsListSectionHeaderInitializer(t) return t end
function CreateSettingsButtonInitializer(n, t, fn) BUTTONS = BUTTONS or {}; BUTTONS[n] = fn; return n end
-- (drop-downs keep their menu so the test can open it; frames remember their parent)
local _cf = CreateFrame
function CreateFrame(kind, name, parent, tpl) local f = _cf(kind, name, parent, tpl); f._parent = parent
  if kind == "DropdownButton" then f.SetupMenu = function(self, gen) self._gen = gen end; f.GenerateMenu = function() end end; return f end
function CHOOSE(dd, text) for _, o in ipairs(dd.options()) do if o[2] == text then dd.choose(o[1]); return end end; print("FAIL: no menu choice " .. text) end
function CHOSEN(dd) local cur = dd.get(); for _, o in ipairs(dd.options()) do if o[1] == cur then return o[2] end end; return "?" end
function CANVAS() return CANVAS_CAT end
PICKED = { 0.1, 0.8, 0.9 }
ColorPickerFrame = { SetupColorPickerAndShow = function(self, info) self.info = info end, GetColorRGB = function() return PICKED[1], PICKED[2], PICKED[3] end }
function IsPlayerSpell(id) return NAMES[id] ~= nil end
C_Spell.GetSpellInfo = function(x) for id, n in pairs(NAMES) do if n == x then return { spellID = id, name = n } end end end
NOTE_TEXT = ""
NSAPI.GetReminderString = function(self) return NOTE_TEXT, "" end
-- (what glows, in which style and colour; the big icon itself isn't a glow)
local CNAMES = { ["0.9,0.71,0.31"] = "gold", ["1,0.25,0.2"] = "red", ["0.3,0.95,0.4"] = "green", ["0.3,0.6,1"] = "blue", ["0.1,0.8,0.9"] = "picked colour" }
local function look(f)
  local st = rawget(f, "drawn"); if not st then return "" end
  local rgb = rawget(f, "tinted")
  local key = rgb and (tostring(rgb[1]) .. "," .. tostring(rgb[2]) .. "," .. tostring(rgb[3]))
  return " (" .. st .. ", " .. (key and (CNAMES[key] or key) or "game colours") .. ")"
end
MISSING = {}
C_Texture = { GetAtlasInfo = function(a) if MISSING[a] then return nil end; return { width = 90, height = 90 } end }
function COUNT() local l = {}; for _, f in ipairs(FRAMES) do if f._shown and rawget(f, "expires") then local up = f._scripts.OnUpdate; if up then up(f, 0) end
    if f._shown and f._anchor then local lb = rawget(f._anchor, "_label"); l[#l + 1] = (type(lb) == "string" and lb or "big icon") .. " " .. rawget(f, "text")._text end end end
  table.sort(l); return #l > 0 and table.concat(l, ", ") or "-" end
function PREVIEW(secs) local f = DebriefGlowPreview; local up = f._scripts.OnUpdate; for i = 1, math.floor(secs * 10 + 0.5) do up(f, 0.1) end
  local g = "no glow"; for _, x in ipairs(FRAMES) do if x._shown and type(rawget(x, "_anchor")) == "table" and rawget(x._anchor, "_label") == "preview" and rawget(x, "drawn") then local c = rawget(x, "tinted"); g = rawget(x, "drawn") .. (c and (" " .. string.format("%.2f,%.2f,%.2f", c[1], c[2], c[3])) or " game colours") end end
  local n = DEBRIEF_PV_NUM(); return string.format("%-28s number %-4s glow %s", rawget(DEBRIEF_PV(), "cap")._text, n, g) end
function GLOWING() local l = {}; for _, f in ipairs(FRAMES) do if f._shown and f._anchor and f._anchor ~= UIParent and rawget(f, "halo") then local lb = rawget(f._anchor, "_label"); l[#l + 1] = (type(lb) == "string" and lb or "big icon") .. look(f) end end; table.sort(l); return #l > 0 and table.concat(l, ", ") or "nothing" end
`;
const NOTE = `EncounterID:3600;Difficulty:Mythic;Name:The Coiled Altar
time:20;ph:1;tag:Flëxørçïst;spellid:31821;
time:45;ph:1;tag:Flëxørçïst;spellid:31884;
time:62;ph:1;tag:Flëxørçïst;spellid:6940;
time:70;ph:1;tag:Flëxørçïst;spellid:1022;
time:30;ph:2;tag:Flëxørçïst;spellid:375576;
time:25;ph:1;tag:Optt;spellid:64843;`;
const L = lauxlib.luaL_newstate(); lualib.luaL_openlibs(L);
function run(chunk, name) { if (lauxlib.luaL_loadbuffer(L, to_luastring(chunk), null, to_luastring(name)) !== 0 || lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0) !== 0) { console.log('LUA ERROR: ' + to_jsstring(lua.lua_tostring(L, -1))); process.exit(1); } }
run(stub + '\n' + extra, 'stub');
const src = fs.readFileSync(process.argv[2], 'utf8');
run('local f = assert(load(' + JSON.stringify(src).replace(/\\u([0-9a-f]{4})/gi, (m, h) => '\\u{' + h + '}') + ', "@DebriefGlow.lua")); f("DebriefGlow")', 'load');
lua.lua_pushstring(L, to_luastring(NOTE)); lua.lua_setglobal(L, to_luastring('NOTE'));
run(`
local ev = DebriefGlowEvents; local fire = ev:GetScript("OnEvent")
fire(ev, "ADDON_LOADED", "DebriefGlow"); fire(ev, "PLAYER_LOGIN")
print("in Options > AddOns as: " .. tostring(CANVAS()))
print("hooked into NSRT: " .. tostring(CB.NSRT_REMINDER_SHOW ~= nil))
local PH = { [1] = 0, [2] = 150 }
-- (a fake NSRT: the player's own lines with a spell, shown 8 s before their time; it stops when the boss is over)
PULL_ID = 0
local function pull()
  local mine = PULL_ID
  for line in NOTE:gmatch("[^\\n]+") do
    local t, ph, tag, sp = line:match("time:([%d.]+);ph:([%d.]+);tag:([^;]+);spellid:(%d+)")
    if t and tag:find(UnitName("player"), 1, true) then local at = PH[tonumber(ph)] + tonumber(t)
      C_Timer.After(at - 8, function() if PULL_ID == mine then CB.NSRT_REMINDER_SHOW("NSRT_REMINDER_SHOW", { spellID = tonumber(sp), dur = 8, expires = GetTime() + 8 }, nil) end end) end
  end
end
local function heard() local s = table.concat(PLAYED, "; ") .. (#SPOKEN > 0 and ((#PLAYED > 0 and "; " or "") .. "says " .. table.concat(SPOKEN, ", ")) or ""); PLAYED = {}; SPOKEN = {}; return s ~= "" and s or "-" end
local function at(t, what) ADVANCE(t); print(string.format("%3d:%04.1f  %-38s number: %-16s glowing: %-34s heard: %s", math.floor(t / 60), t % 60, what, COUNT(), GLOWING(), heard())) end
local function press(id) fire(ev, "UNIT_SPELLCAST_SUCCEEDED", "player", "g", id) end
local function expect(what, got, want) print((got == want and "  ok   " or "  FAIL ") .. what .. ": " .. tostring(got) .. (got == want and "" or ("  (wanted " .. tostring(want) .. ")"))) end
-- (a new pull: the boss is over, every glow from before has stopped, the fake clock starts again)
local function newPull() PULL_ID = PULL_ID + 1; fire(ev, "ENCOUNTER_END"); ADVANCE(NOW + 30); expect("nothing left glowing before the pull", GLOWING(), "nothing"); heard(); NOW = 0; TIMERS = {} end
local styles = { "pulse", "border", "pixel", "sparkle", "proc", "assist", "onebutton", "altglow", "pandemic" }

print("-- defaults: a gold ring on the icon's edge (Border, 2 px, no gap), no sound, no voice")
expect("default style", DebriefGlowDB.style, "border"); expect("ring sits on the edge (no gap)", DebriefGlowDB.pad, 0); expect("ring thickness", DebriefGlowDB.thick, 2)
newPull(); pull(); at(19.9, "just before Aura Mastery"); at(20, "Aura Mastery due"); press(31821); at(20.5, "pressed")

print("-- the countdown on the spell matches NSRT's (NSRT shows Aura Mastery 8 s early)")
newPull(); pull(); at(12, "NSRT's countdown starts"); at(15.5, ""); at(19.2, ""); at(20, "0: the glow takes over")
expect("number gone at 0", COUNT(), "-"); press(31821)
print("-- pressed during the countdown: the number and the glow to come are called off")
newPull(); pull(); at(14, ""); press(31821); at(14.1, "pressed early"); at(20, "nothing glows")
print("-- tenths in the last 3 s, above the icon, gold")
DebriefGlowDB.timerTenths = true; DebriefGlowDB.timerPos = "top"; DebriefGlowDB.timerColor = "gold"
newPull(); pull(); at(16, ""); at(18.5, "")
DebriefGlowDB.timerTenths = false; DebriefGlowDB.timerPos = "middle"; DebriefGlowDB.timerColor = "white"
print("-- countdown turned off")
DebriefGlowDB.timer = false; newPull(); pull(); at(15, "no number"); DebriefGlowDB.timer = true
print("-- a spell that isn't on the Cooldown Manager counts down on the big icon")
newPull(); pull(); at(65, "Blessing of Protection in 5"); at(70, "glow on the big icon"); press(1022); at(70.5, "pressed: big icon gone")
expect("big icon hidden", DebriefGlowIcon._shown, false)

print("-- Raid warning sound, voice \\"Press {spell}\\", 3 2 1 countdown, start 1 s early")
DebriefGlowDB.sound = "raidwarning"; DebriefGlowDB.tts = true; DebriefGlowDB.ttsText = "Press {spell}"; DebriefGlowDB.countdown = 3; DebriefGlowDB.lead = 1; DebriefGlowDB.ttsVoice = 1
newPull(); pull()
at(16.5, "countdown starts"); at(17, ""); at(18, ""); at(19, "glow starts 1 s early"); at(20, "")
at(28.5, "not pressed: 8 s hold over")
at(61, "Blessing of Sacrifice (Utility row)"); press(6940); at(62, "pressed")
at(69, "Blessing of Protection: big icon")
at(179, "Divine Toll (phase 2 + 0:30)")
fire(ev, "ENCOUNTER_END"); at(180, "boss died")

print("-- every style draws without errors")
DebriefGlowDB.sound = "none"; DebriefGlowDB.tts = false; DebriefGlowDB.countdown = 0; DebriefGlowDB.lead = 0
for _, st in ipairs(styles) do DebriefGlowDB.style = st; DebriefGlow_Test(true); expect(st, GLOWING():match("%((%a+),") , st); ADVANCE(NOW + 3.1) end
print("-- game styles in your colour (Game styles keep the game's colours: off)")
DebriefGlowDB.gameColors = false; DebriefGlowDB.style = "assist"; DebriefGlow_Test(true); expect("rotation helper tinted gold", GLOWING():match("Aura Mastery %(([^)]+)%)"), "assist, gold"); ADVANCE(NOW + 3.1)
DebriefGlowDB.gameColors = true
print("-- a game style whose art this game version lacks falls back to Pulse")
MISSING["OneButton_ProcLoop_Flipbook"] = true; DebriefGlowDB.style = "onebutton"; DebriefGlow_Test(true); expect("one-button proc missing", GLOWING():match("Aura Mastery %(([^)]+)%)"), "border, gold"); ADVANCE(NOW + 3.1); MISSING = {}
DebriefGlowDB.style = "pulse"
print("-- the colour list sets the colour (and previews it)")
DebriefGlow_SetColor("red"); expect("red", DebriefGlowDB.r .. ", " .. DebriefGlowDB.g .. ", " .. DebriefGlowDB.b, "1, 0.25, 0.2")
DebriefGlow_SetColor("gold"); ADVANCE(NOW + 3.1)

print("-- off")
DebriefGlowDB.enabled = false; newPull(); pull(); at(20, "Aura Mastery due (addon off)")
DebriefGlowDB.enabled = true

print("-- a wipe 5 s before the press: nothing glows or speaks afterwards")
DebriefGlowDB.tts = true; DebriefGlowDB.countdown = 3
newPull(); pull(); at(15, "NSRT showed Aura Mastery at 0:12"); PULL_ID = PULL_ID + 1; fire(ev, "ENCOUNTER_END"); at(15.1, "wipe"); at(25, "after the press time")
DebriefGlowDB.tts = false; DebriefGlowDB.countdown = 0

print("-- the settings window (the website's look)")
DebriefGlow_Open(); local W = DebriefGlowOptions
expect("opens on When it glows", W.pages.glow._shown, true)
local lead = rawget(W, "lead"); lead.plus:GetScript("OnClick")(); expect("Start early +", DebriefGlowDB.lead, 0.5); expect("shows it", lead.val:GetText(), "0.5 s early"); lead.minus:GetScript("OnClick")()
local sw = rawget(W, "stopOnPress"); sw:GetScript("OnClick")(sw); expect("Stop when I press it, off", DebriefGlowDB.stopOnPress, false); sw:GetScript("OnClick")(sw); expect("and on", DebriefGlowDB.stopOnPress, true)
W.tabs.look:GetScript("OnClick")(); expect("Look tab", W.pages.look._shown and not W.pages.glow._shown, true)
local st = rawget(W, "style"); st:GetScript("OnClick")(st)
local picked = false; for _, b in ipairs(rawget(DebriefGlowMenu, "items")) do if b._shown and rawget(b, "t")._text == "Border" then b:GetScript("OnClick")(b); picked = true end end
expect("Style menu: Border", DebriefGlowDB.style, "border"); expect("menu closed", DebriefGlowMenu._shown, false)
CHOOSE(st, "Game: rotation helper"); expect("Style: game rotation helper", DebriefGlowDB.style, "assist"); CHOOSE(st, "Pulse")
local tc = rawget(W, "timerColor"); tc[2]:GetScript("OnClick")(); expect("Number colour: Gold", DebriefGlowDB.timerColor, "gold"); tc[1]:GetScript("OnClick")()
ADVANCE(NOW + 3.1)

print("-- the preview beside the window (main settings)")
function DEBRIEF_PV() return DebriefGlowPreview end
function DEBRIEF_PV_NUM() local n = rawget(DebriefGlowPreview, "num"); return n._shown and rawget(n, "text")._text or "-" end
expect("preview open beside the window", DebriefGlowPreview._shown, true)
print("  1.0 s  " .. PREVIEW(1)); print("  3.5 s  " .. PREVIEW(2.5)); print("  5.1 s  " .. PREVIEW(1.6)); print("  6.0 s  " .. PREVIEW(0.9))
CHOOSE(rawget(W, "style"), "Sparkles"); print("  style: Sparkles  " .. PREVIEW(0.1)); CHOOSE(rawget(W, "style"), "Pulse")
print("  8.5 s  " .. PREVIEW(2.4)); print("  9.3 s  " .. PREVIEW(0.8)); print("  next loop, 1.0 s  " .. PREVIEW(1))
ADVANCE(NOW + 3.1)

print("-- Your spells")
NOTE_TEXT = NOTE
W:Hide(); DebriefGlow_Spells()
expect("window open on Your spells", W._shown and W.pages.spells._shown, true)
local R, order = {}, {}
for _, f in ipairs(FRAMES) do if rawget(f, "whereText") and f._shown then R[f.id] = f; order[#order + 1] = f end end
table.sort(order, function(a, b) return NAMES[a.id] < NAMES[b.id] end)
for _, r in ipairs(order) do print(string.format("  %-24s %-26s glow %-5s style %-12s colour %-12s sound %-12s words %s", r.name:GetText(), r.where:GetText(), tostring(r.on:GetChecked()), CHOSEN(r.style), CHOSEN(r.color), CHOSEN(r.sound), r.words:GetText() == "" and "(" .. r.words.hint:GetText() .. ")" or r.words:GetText())) end
expect("Divine Hymn (someone else's) not listed", R[64843], nil)
expect("Divine Shield (on the bar) listed", R[642] ~= nil, true)
print("  set: Avenging Wrath red + raid warning + \\"Wings now\\"; Aura Mastery pixel lines; Blessing of Protection the game proc; Blessing of Sacrifice off; Divine Toll any colour")
CHOOSE(R[31884].color, "Red"); CHOOSE(R[31884].sound, "Raid warning")
R[31884].words:SetText("Wings now"); R[31884].words:GetScript("OnEnterPressed")(R[31884].words)
CHOOSE(R[31821].style, "Pixel lines"); CHOOSE(R[1022].style, "Game: action bar proc")
R[6940].on:GetScript("OnClick")(R[6940].on)
CHOOSE(R[375576].color, "Any colour..."); ColorPickerFrame.info.swatchFunc()
heard(); ADVANCE(NOW + 3.1)
expect("Avenging Wrath colour shows", CHOSEN(R[31884].color), "Red")
expect("Avenging Wrath words saved", DebriefGlowDB.spells[31884].words, "Wings now")
expect("Divine Toll colour shows", CHOSEN(R[375576].color), "Your colour")
expect("Blessing of Sacrifice off", DebriefGlowDB.spells[6940].off, true)
print("  add a spell by name: Divine Protection is not a spell here, Lay on Hands is")
NAMES[633] = "Lay on Hands"
local ADD; for _, f in ipairs(FRAMES) do local h = rawget(f, "hint"); if h and h._text == "Its name or spell ID" then ADD = f end end
ADD:SetText("Divine Protection"); ADD:GetScript("OnEnterPressed")(ADD)
ADD:SetText("Lay on Hands"); ADD:GetScript("OnEnterPressed")(ADD)
local found = false; for _, f in ipairs(FRAMES) do if rawget(f, "whereText") and rawget(f, "id") == 633 and f._shown then found = true end end
print("  click Avenging Wrath: the preview shows its own look")
R[31884].hit:GetScript("OnClick")(R[31884].hit); ADVANCE(NOW + 3.1); heard()
expect("preview is Avenging Wrath", rawget(DEBRIEF_PV(), "who")._text, "Avenging Wrath")
print("  5.1 s  " .. PREVIEW(5.1))
R[6940].hit:GetScript("OnClick")(R[6940].hit); print("  Blessing of Sacrifice (off): " .. PREVIEW(5.1))
W.tabs.look:GetScript("OnClick")(); expect("back to the main settings on other tabs", rawget(DEBRIEF_PV(), "who")._text, "Aura Mastery")
W.tabs.spells:GetScript("OnClick")()
expect("Lay on Hands added", found, true)

print("-- the pull with those spell settings (main: pulse, gold, no sound, no voice)")
newPull(); pull()
at(20, "Aura Mastery: pixel lines"); press(31821)
at(45, "Avenging Wrath: red, sound, words"); press(31884)
at(62, "Blessing of Sacrifice: turned off")
at(70, "Blessing of Protection: game proc"); press(1022)
at(180, "Divine Toll: picked colour"); press(375576)
print("-- the x button puts a spell back on the main settings")
R[31884].reset:GetScript("OnClick")(R[31884].reset)
expect("Avenging Wrath back to main", DebriefGlowDB.spells[31884], nil)
newPull(); pull(); at(45, "Avenging Wrath: main look again"); press(31884)
print("-- a custom icon: 52 x 40 at 150% (Edit Mode), a higher strata, its cooldown swipe at level 50, its inner picture moved by a skin")
do
  local ds; for _, f in ipairs(ESS) do if f._label == "Divine Shield" then ds = f end end
  local swipe = CreateFrame("Cooldown"); swipe.GetFrameLevel = function() return 50 end
  ds.GetEffectiveScale = function() return 1.5 end; ds.GetFrameStrata = function() return "DIALOG" end; ds.GetFrameLevel = function() return 12 end
  ds.GetChildren = function() return swipe end
  ds.GetWidth = function() return 52 end; ds.GetHeight = function() return 40 end
  local pic = CreateFrame("Texture"); pic.GetWidth = function() return 30 end; pic.GetHeight = function() return 30 end; pic.IsShown = function() return true end; ds.Icon = pic
  newPull(); DebriefGlow_Test(true)
  local g; for _, f in ipairs(FRAMES) do if f._shown and rawget(f, "_anchor") == ds and rawget(f, "drawn") then g = f end end
  expect("glow box is the icon's slot, not its moved picture", g and rawget(g, "_anchor") == ds, true)
  expect("game glows sized to the slot on screen (52 x 40 at 150%)", g and (rawget(g, "w") .. " x " .. rawget(g, "h")), "78.0 x 60.0")
  local back = g and rawget(g, "back")
  expect("soft halo behind the icon (same strata, one level under)", back and (rawget(back, "_strata") .. " " .. rawget(back, "_level")), "DIALOG 11")
  SlashCmdList.DEBRIEFGLOW("size")
  expect("glow in the icon's higher strata", g and rawget(g, "_strata"), "DIALOG")
  expect("glow above the cooldown swipe", g and rawget(g, "_level") > 50, true)
  local n; for _, f in ipairs(FRAMES) do if f._shown and rawget(f, "expires") and rawget(f, "_anchor") == ds then n = f end end
  expect("number above the glow", n and rawget(n, "_level") > rawget(g, "_level"), true)
  ADVANCE(NOW + 3.1); heard()
  ds.GetEffectiveScale = nil; ds.GetFrameStrata = nil; ds.GetFrameLevel = nil; ds.GetChildren = nil; ds.GetWidth = nil; ds.GetHeight = nil; ds.Icon = nil
end
print("-- /dglow test skips a spell that's off")
newPull(); DebriefGlow_Test(true); expect("Blessing of Sacrifice not in the test", GLOWING():find("Sacrifice") == nil, true); ADVANCE(NOW + 3.1); heard()

print("-- /dglow test, /dglow spells, /dglow move, /dglow")
SlashCmdList.DEBRIEFGLOW("test"); at(NOW + 0.1, "test"); ADVANCE(NOW + 3.1); expect("test glows stop after 3 s", GLOWING(), "nothing")
W:Hide(); SlashCmdList.DEBRIEFGLOW("spells"); expect("/dglow spells opens the window", W._shown, true)
SlashCmdList.DEBRIEFGLOW("move"); SlashCmdList.DEBRIEFGLOW("move")
W:Hide(); SlashCmdList.DEBRIEFGLOW(""); expect("/dglow opens the window", W._shown and W.pages.glow._shown, true)
DebriefGlow_OnAddonCompartmentClick(); expect("the AddOns menu button closes it again", W._shown, false)
`, 'scenario');
