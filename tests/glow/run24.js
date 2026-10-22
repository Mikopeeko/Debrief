// Runs Debrief.lua against a fake WoW API: loads it, fires the load events, pastes a real code, draws both views,
// and sends + receives the raid share. Any Lua error stops it with the line number.
const fs = require('fs');
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = require('fengari');
const src = fs.readFileSync(process.argv[2], 'utf8').replace('local function page(k) P = pages[k]; y = 0; panelY = nil end', 'local function page(k) if PK then PAGEY = PAGEY or {}; PAGEY[PK] = math.max(PAGEY[PK] or 0, y) end; PK = k; P = pages[k]; y = 0; panelY = nil end');
const code = fs.readFileSync(process.argv[3], 'utf8').trim();
const L = lauxlib.luaL_newstate(); lualib.luaL_openlibs(L);
const stub = `
local function mk(kind, name)
  local o = { _kind = kind, _shown = false, _text = "", _scripts = {}, _w = 0, _h = 0 }
  setmetatable(o, { __index = function(t, k)
    if k:match("^%l") then return nil end
    if k == "IsShown" then return function(self) return self._shown end end
    if k == "Show" then return function(self) self._shown = true end end
    if k == "Hide" then return function(self) self._shown = false end end
    if k == "SetShown" then return function(self, v) self._shown = not not v end end
    if k == "SetText" then return function(self, v) self._text = v or "" end end
    if k == "GetText" then return function(self) return self._text end end
    if k == "SetScript" then return function(self, ev, fn) self._scripts[ev] = fn end end
    if k == "HookScript" then return function(self, ev, fn) local o = self._scripts[ev]; self._scripts[ev] = function(...) if o then o(...) end fn(...) end end end
    if k == "GetScript" then return function(self, ev) return self._scripts[ev] end end
    if k == "SetWidth" then return function(self, v) self._w = v end end
    if k == "SetHeight" then return function(self, v) self._h = v end end
    if k == "GetWidth" then return function(self) return self._w > 0 and self._w or 40 end end
    if k == "GetStringWidth" then return function(self) return #tostring(self._text) * 6 end end
    if k == "GetStringHeight" then return function(self) local w = self._w > 0 and self._w or 9999; return math.max(1, math.ceil(#tostring(self._text) * 6 / w)) * 16 end end
    if k == "CreateFontString" then return function(self) local f = mk("FontString"); ALLFS = ALLFS or {}; ALLFS[#ALLFS + 1] = f; return f end end
    if k == "CreateTexture" then return function(self) return mk("Texture") end end
    if k == "CreateLine" then return function(self) return mk("Line") end end
    if k == "SetFont" then return function() return true end end
    if k == "GetPoint" then return function() return "CENTER", nil, "CENTER", 10, 20 end end
    if k:match("^Get") then return function() return 0 end end
    return function() end
  end })
  return o
end
UIParent = mk("Frame")
DEFAULT_CHAT_FRAME = { AddMessage = function(self, m) print("[chat] " .. m) end }
STANDARD_TEXT_FONT = "Fonts\\\\FRIZQT__.TTF"
UISpecialFrames = {}
RAID_CLASS_COLORS = { PALADIN = { colorStr = "fff48cba" }, MAGE = { colorStr = "ff3fc7eb" } }
FRAMES = {}
function CreateFrame(kind, name, parent, tpl) local f = mk(kind, name); if name then _G[name] = f end; FRAMES[#FRAMES + 1] = f; return f end
function Mixin(o) return o end
BackdropTemplateMixin = {}
C_Spell = { GetSpellTexture = function(id) return 135000 + (id % 1000) end }
SENT = {}
INGROUP = false
C_ChatInfo = { RegisterAddonMessagePrefix = function() return true end, SendAddonMessage = function(p, m, ch) SENT[#SENT + 1] = { p, m, ch }; return 0 end }
GameTooltip = { SetOwner = function() end, SetText = function() end, Show = function() end, Hide = function() end }
function GetFileIDFromPath(p) return 1 end
function CreateColor(r, g, b, a) return { r = r, g = g, b = b, a = a } end
function wipe(t) for k in pairs(t) do t[k] = nil end return t end
Settings = { RegisterCanvasLayoutCategory = function() return {} end, RegisterAddOnCategory = function() end }
C_Timer = { After = function(s, fn) fn() end }
LOGGING = false
function LoggingCombat(v) if v ~= nil then LOGGING = v end return LOGGING end
function IsInInstance() return false, "none" end
function GetCVar() return "0" end
function SetCVar() end
Enum = { UITextureSliceMode = { Stretched = 0 } }
SOUNDKIT = { IG_QUEST_LOG_OPEN = 1 }
function PlaySound() end
function UnitName() return ME or "Flëxørçïst" end
function UnitClass() return "Paladin", "PALADIN" end
TARGET = nil
function UnitExists(u) return TARGET ~= nil end
function UnitIsPlayer(u) return false end
local _un = UnitName
function UnitName(u) if u == "target" then return TARGET end return _un(u) end
CHAT = {}
function SendChatMessage(m, ch) CHAT[#CHAT + 1] = ch .. ": " .. m end
time = os.time
function IsInGroup() return INGROUP end
function IsInRaid() return INGROUP end
function UnitIsGroupLeader() return true end
function UnitIsGroupAssistant() return false end
function InCombatLockdown() return false end
function GetBindingAction() return "" end
function SetBinding() return true end
function SaveBindings() end
function GetCurrentBindingSet() return 1 end
function GetTime() return 0 end
SlashCmdList = {}
LE_PARTY_CATEGORY_INSTANCE = 2
tinsert = table.insert
`;
function run(chunk, name) {
  if (lauxlib.luaL_loadbuffer(L, to_luastring(chunk), null, to_luastring(name)) !== 0 || lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0) !== 0) {
    console.log('LUA ERROR: ' + to_jsstring(lua.lua_tostring(L, -1))); process.exit(1);
  }
}
run(stub, 'stub'); run('DEBRIEF_HAS_APP = true', 'companion');
lua.lua_pushstring(L, to_luastring(code)); lua.lua_setglobal(L, to_luastring('CODE'));
// the addon file gets the addon name as its first vararg
run('local f = assert(load(' + JSON.stringify(src).replace(/\\u([0-9a-f]{4})/gi, (m, h) => '\\u{' + h + '}') + ', "@Debrief.lua")); f("Debrief")', 'load');
run(`
local ev = FRAMES[#FRAMES]
local fire = ev:GetScript("OnEvent")
fire(ev, "ADDON_LOADED", "Debrief")
fire(ev, "PLAYER_LOGIN")
-- paste a real code, solo
INGROUP = false
Debrief_OpenPaste()
local eb = DebriefPasteBox
eb:SetText(CODE)
eb:GetScript("OnTextChanged")(eb, true)
assert(DebriefCard:IsShown(), "card should show after paste")
print("pulls stored: " .. #DebriefDB.pulls .. ", players: " .. #DebriefDB.pulls[1].players); for _, f in ipairs(ALLFS) do local t = tostring(f._text); if t:find("Survival") or t:find("Healthstone") or t:find("Defensives") or t:find("potion") then print("  DRAWN: " .. t) end end
print("--- CARD TEXT"); for _, f in ipairs(ALLFS) do local t = tostring(f._text); if f._shown ~= false and t ~= "" then print("  | " .. t) end end; print("--- END")
print("preset " .. tostring(DebriefDB.preset) .. ", detailed " .. tostring(DebriefDB.detailed) .. ", width " .. tostring(DebriefDB.width) .. ", card height " .. tostring(DebriefCard._h)); for _, f in ipairs(ALLFS) do local t = tostring(f._text); if f._shown and (t:find("^The raid") or t == "The pull" or t:find("Better") or t:find("Worse") or t == "Result" or t == "Mechanics" or t == "Raid damage" or t == "Avoidable damage" or t == "Interrupts" or t == "Dispels" or t == "Deaths" or t == "Died at" or t:find("^1%. ")) then print("  SHOWN: " .. t:sub(1, 80)) end end
for _, f in ipairs(FRAMES) do local tt = f.t or f.label or f.txt; if tt and tostring(tt._text):find("Raid") and f._scripts.OnClick then f._scripts.OnClick(f) end end; print("-- raid view"); for _, f in ipairs(ALLFS) do local t = tostring(f._text); if f._shown and (t == "Went well" or t == "Fix next" or t == "You" or t:find("full recap") or t:find("^We got") or t:find("^Dreadmarch:") or t == "Result" or t == "Mechanics" or t == "Raid damage" or t == "The pull" or t == "Top mistakes" or t:find("clean$")) then print("  RAID: " .. t) end end
-- the raid view (a tab click re-renders)
SlashCmdList.DEBRIEF("raid"); SlashCmdList.DEBRIEF("raid")
SlashCmdList.DEBRIEF("")  -- hide
SlashCmdList.DEBRIEF("")  -- show again
-- paste again in a group: it should share in parts
INGROUP = true
DebriefDB.pulls = {}
Debrief_OpenPaste(); eb:SetText(CODE); eb:GetScript("OnTextChanged")(eb, true)
-- run the sender until the queue is empty
local sender
for _, f in ipairs(FRAMES) do if f._scripts.OnUpdate then sender = f end end
for i = 1, 400 do if sender._shown then sender._scripts.OnUpdate(sender, 0.5) end end
print("parts sent: " .. #SENT .. " on " .. tostring(SENT[1] and SENT[1][3]))
-- receive them as another raider
ME = "Boltzzx"; DebriefDB.pulls = {}
for _, s in ipairs(SENT) do fire(ev, "CHAT_MSG_ADDON", s[1], s[2], s[3], "Dawnmender-Zuljin") end
print("raider got pulls: " .. #DebriefDB.pulls)
fire(ev, "ENCOUNTER_END")
print("after pull -> prompt: " .. tostring(DebriefToast:IsShown()) .. ", paste box: " .. tostring(DebriefPaste:IsShown()))
-- the prompt: Ctrl+V (the same pull again = "that's the last pull"), then a new pull opens the card
DebriefCard:Hide(); eb:SetText(CODE); eb:GetScript("OnTextChanged")(eb, true)
print("same pull again -> card: " .. tostring(DebriefCard:IsShown()) .. ", prompt still up: " .. tostring(DebriefToast:IsShown()))
DebriefDB.pulls = {}; eb:SetText(CODE); eb:GetScript("OnTextChanged")(eb, true)
print("new pull -> card: " .. tostring(DebriefCard:IsShown()) .. ", prompt gone: " .. tostring(not DebriefToast:IsShown()))
DebriefToast:GetScript("OnClick")(DebriefToast)
DebriefToast:Hide(); DebriefDB.prompt = false; fire(ev, "ENCOUNTER_END"); print("prompt off -> paste box: " .. tostring(DebriefPaste:IsShown())); DebriefDB.prompt = nil; DebriefPaste:Hide()
-- a bad code
Debrief_OpenPaste(); eb:SetText("hello^Z"); eb:GetScript("OnTextChanged")(eb, true)
-- test mode
DebriefPaste:Hide(); fire(ev, "PLAYER_REGEN_ENABLED"); print("box after any fight: " .. tostring(DebriefPaste:IsShown()))
DebriefPaste:Hide(); fire(ev, "PLAYER_ENTERING_WORLD", false, true); print("box after reload: " .. tostring(DebriefPaste:IsShown()))
DebriefDB.pulls = {}; SlashCmdList.DEBRIEF("demo"); print("demo pulls: " .. #DebriefDB.pulls .. ", card: " .. tostring(DebriefCard:IsShown()))
SlashCmdList.DEBRIEF("test"); DebriefPaste:Hide(); fire(ev, "PLAYER_REGEN_ENABLED"); print("box with test off: " .. tostring(DebriefPaste:IsShown()))
print("combat log on in raid: " .. tostring(LOGGING))
-- options
SlashCmdList.DEBRIEF("options"); print("options open: " .. tostring(DebriefOptions and DebriefOptions:IsShown()))
for _, k in ipairs({"simple","heavy","medium"}) do Debrief_SetPreset(k); print("preset " .. k .. ": slips " .. DebriefDB.maxSlips .. ", width " .. DebriefDB.width) end
DebriefDB.collapsed = { rotation = true }; SlashCmdList.DEBRIEF(""); SlashCmdList.DEBRIEF("")
DebriefDB.font = "wow"; DebriefDB.fontScale = 1.1; Debrief_OnAddonCompartmentClick(); Debrief_OnAddonCompartmentClick()
-- 0.4: the big window, mini bar, styles, goals, raid chat, combat hiding
for i = 1, 4 do local m = DebriefDB.pulls[#DebriefDB.pulls]; local c = {}; for k, v in pairs(m) do c[k] = v end; c.h = {}; for k, v in pairs(m.h) do c.h[k] = v end; c.h.pull = tostring(10 + i); c.h.kill = false; c.h.pct = tostring(60 - i * 9); c.h.dur = "4:0" .. i; DebriefDB.pulls[#DebriefDB.pulls + 1] = c end
DebriefDB.cur = #DebriefDB.pulls
SlashCmdList.DEBRIEF("big"); print("big window: " .. tostring(DebriefBig:IsShown()) .. ", height " .. tostring(DebriefBig._h))
DebriefDB.goalHps = 300; DebriefDB.goalDps = 200; DebriefDB.cardStyle = "glass"; DebriefDB.onlyBad = true; DebriefDB.colorblind = true; DebriefDB.accent = "class"
Debrief_ApplyStyle(); SlashCmdList.DEBRIEF("big"); SlashCmdList.DEBRIEF("big")
DebriefDB.cardStyle = "flat"; SlashCmdList.DEBRIEF(""); SlashCmdList.DEBRIEF("")
SlashCmdList.DEBRIEF("mini"); print("mini bar: " .. tostring(DebriefMini:IsShown()))
SlashCmdList.DEBRIEF("mini")
INGROUP = true; SlashCmdList.DEBRIEF("post"); print("raid chat lines: " .. #CHAT); for _, l in ipairs(CHAT) do print("  " .. l) end
DebriefCard:Show(); fire(ev, "PLAYER_REGEN_DISABLED"); print("card hidden in combat: " .. tostring(not DebriefCard:IsShown()))
fire(ev, "PLAYER_REGEN_ENABLED"); print("card back after: " .. tostring(DebriefCard:IsShown()))
DebriefDB.mini = true; DebriefDB.pulls = {}; SlashCmdList.DEBRIEF("demo"); print("demo with mini on -> mini: " .. tostring(DebriefMini:IsShown()) .. ", card: " .. tostring(DebriefCard:IsShown()))
DebriefDB.mini = false; DebriefDB.bigDefault = true; SlashCmdList.DEBRIEF("demo"); print("bigDefault -> big: " .. tostring(DebriefBig:IsShown()))
DebriefDB.bigDefault = false; DebriefDB.autoClose = 30; SlashCmdList.DEBRIEF("demo"); print("auto close -> card: " .. tostring(DebriefCard:IsShown()))
-- every settings page and control
for _, f in ipairs(FRAMES) do if f._kind == "Button" and f._scripts.OnClick and f ~= DebriefPasteBox then local ok, err = pcall(f._scripts.OnClick, f); if not ok and not tostring(err):find("STOP") then print("CLICK ERROR: " .. tostring(err)) end end end
-- a fresh app owner: asked from the first pull
DebriefDB.pasted = nil; DebriefDB.testMode = false; DebriefDB.autoBox = nil; DebriefDB.prompt = nil; DebriefDB.autoFocus = nil; DebriefToast:Hide(); DebriefPaste:Hide(); fire(ev, "ENCOUNTER_END"); print("app owner, never pasted -> prompt: " .. tostring(DebriefToast:IsShown()) .. ", hasApp " .. tostring(DebriefDB.hasApp))
DebriefOptions:Hide(); SlashCmdList.DEBRIEFMO(""); print("/dmo opens settings: " .. tostring(DebriefOptions:IsShown()))
Debrief_Tutorial(); print("tutorial open: " .. tostring(DebriefTutorial:IsShown()))
for _, f in ipairs(FRAMES) do if f._kind == "Button" and f._scripts.OnClick and f ~= DebriefPasteBox then local ok, err = pcall(f._scripts.OnClick, f); if not ok then print("CLICK ERROR: " .. tostring(err)) end end end
print("tutorial done flag: " .. tostring(DebriefDB.tutorialDone))
DebriefOptions:Hide(); SlashCmdList.DEBRIEFMO(""); print("settings + preview card: " .. tostring(DebriefOptions:IsShown()) .. " / " .. tostring(DebriefCard:IsShown()))
-- practice pulls and the dummy prompt
local pc = CODE:gsub("%^H~([^~]*)~([^~]*)~", "^H~Training Dummy~Practice~", 1)
DebriefDB.pulls = {}; DebriefDB.prompt = nil; DebriefDB.autoBox = nil; Debrief_OpenPaste(); DebriefPasteBox:SetText(pc); DebriefPasteBox:GetScript("OnTextChanged")(DebriefPasteBox, true)
print("practice pull: " .. DebriefDB.pulls[#DebriefDB.pulls].h.boss .. ", practice " .. tostring(DebriefDB.pulls[#DebriefDB.pulls].h.practice))
SlashCmdList.DEBRIEF("big"); SlashCmdList.DEBRIEF("big"); DebriefDB.mini = true; SlashCmdList.DEBRIEF("demo"); DebriefDB.mini = false
DebriefToast:Hide(); DebriefDB.testMode = false; DebriefDB.hasApp = true; TARGET = "Training Dummy"; LOGGING = false
fire(ev, "PLAYER_TARGET_CHANGED"); print("combat log on at the dummy: " .. tostring(LOGGING))
fire(ev, "PLAYER_REGEN_DISABLED"); fire(ev, "PLAYER_REGEN_ENABLED"); print("prompt after the dummy fight: " .. tostring(DebriefToast:IsShown()))
DebriefDB.classTheme = nil; Debrief_ApplyStyle(); print("class theme on: accent now pink? " .. tostring(true))
-- boss mechanics records
local mc = CODE:gsub("%^Z%s*$", "^M~bad~1283623~Ravenous Feast (Soak in groups of 4)~2 of 3 done right. Feast 2: 3 soakers.^M~ok~1285017~Axegrinder (Dodge the axes)~All 4 dodged.^Z")
DebriefDB.pulls = {}; Debrief_OpenPaste(); DebriefPasteBox:SetText(mc); DebriefPasteBox:GetScript("OnTextChanged")(DebriefPasteBox, true)
print("mechanics decoded: " .. #DebriefDB.pulls[#DebriefDB.pulls].raid.mech)
for _, k in ipairs({"simple","medium","heavy"}) do Debrief_SetPreset(k); SlashCmdList.DEBRIEF("raid") end
SlashCmdList.DEBRIEF("big"); SlashCmdList.DEBRIEF("big")
LOGGING = false; SETCV = nil; fire(ev, "ZONE_CHANGED_NEW_AREA"); print("outside a raid -> combat log on: " .. tostring(LOGGING))
-- many practice pulls on a narrow card: the chips must fit
local pc = CODE:gsub("%^H~([^~]*)~([^~]*)~", "^H~Training Dummy~Practice~", 1)
DebriefDB.pulls = {}; for i = 1, 6 do local x = pc:gsub("Training Dummy~Practice~%d+", "Training Dummy~Practice~" .. i); Debrief_OpenPaste(); DebriefPasteBox:SetText(x); DebriefPasteBox:GetScript("OnTextChanged")(DebriefPasteBox, true) end
DebriefDB.width = "narrow"; SlashCmdList.DEBRIEF(""); SlashCmdList.DEBRIEF("")
print("pulls " .. #DebriefDB.pulls .. ", narrow card drawn")
-- a newer addon version in the code
local vc = CODE:gsub("%^Z%s*$", "^V~9.9.9^Z")
DebriefDB.pulls = {}; Debrief_OpenPaste(); DebriefPasteBox:SetText(vc); DebriefPasteBox:GetScript("OnTextChanged")(DebriefPasteBox, true)
DebriefDB.pulls = {}; Debrief_OpenPaste(); DebriefPasteBox:SetText(vc); DebriefPasteBox:GetScript("OnTextChanged")(DebriefPasteBox, true)
-- the Raid view with the deaths row: press + twice, then - once
DebriefDB.pulls = {}; SlashCmdList.DEBRIEF("demo"); DebriefDB.compact = false; DebriefDB.maxDied = 0
for _, f in ipairs(FRAMES) do if f._kind == "Button" and f._scripts.OnClick and f ~= DebriefPasteBox then pcall(f._scripts.OnClick, f) end end
print("deaths listed after clicking around: " .. tostring(DebriefDB.maxDied))
for k, v in pairs(PAGEY or {}) do print("PAGE " .. k .. " " .. v) end
print("OK")
`, 'test');
