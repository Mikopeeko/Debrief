-- Debrief (Nov 3, the studio's pop-up-only-brief.md; Flex: "I still want the pop up window, i just dont see the value in the in game addon anylonger,
-- makes it harder than anything"): a small logger with no windows. It keeps WoW's combat log and Advanced Combat Logging on, everywhere and at
-- every login, so Debrief Companion on your PC can read your pulls; it turns the log on when you practise on a training dummy; and it saves your
-- character's name so the PC pop-up opens on you. Your recap and its settings are on your PC now (the recap key, or Debrief Companion). Your old
-- /db settings stay in DebriefDB: the PC app carries them over once.
local ADDON = ...
local DB
local GOLD = "|cffe6b450"
local function say(msg) if DEFAULT_CHAT_FRAME then DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Debrief|r " .. msg) end end

-- (the combat log and Advanced Combat Logging are always on while Debrief is loaded, everywhere, so nobody has to type /combatlog. Never a switch
-- (Oct 26, the user: "combatlogging should not be a toggle"): at login, on every zone change, after every fight and at every ready check, so it's
-- on again even if something else turned it off)
local logPending, logSaid = false, false
local function acl() if GetCVar and SetCVar and GetCVar("advancedCombatLogging") ~= "1" then SetCVar("advancedCombatLogging", 1) end end
local function autoLog()
  if not LoggingCombat then return end
  if InCombatLockdown and InCombatLockdown() then logPending = true; return end
  acl()
  if not LoggingCombat() then
    LoggingCombat(true)
    if not logSaid then logSaid = true; say("combat logging and Advanced Combat Logging are on. Debrief keeps them on for you.") end
  end
end
-- (a training dummy: any target named "... Dummy" that isn't a player. Midnight keeps some names secret, and reading one errors (Oct 27): a secret
-- name just isn't a dummy)
local function isDummy(u) local ok, r = pcall(function() local n = UnitExists and UnitExists(u) and not UnitIsPlayer(u) and UnitName(u); if not n or (issecretvalue and issecretvalue(n)) then return false end; return n:find("Dummy") ~= nil end); return ok and r == true end

-- (the raid note at every pull (Nov 5, the studio's auto-note-brief.md; Flex: "ok make it happen asap!"): the note NSRT or MRT has loaded when a
-- boss is pulled is copied here, so Debriefing uses the exact note each pull had and nobody pastes one. Each note's text is kept once (by its
-- hash); the last 300 pulls. NSRT swaps notes only after a kill, so the note loaded at the pull is the one that pull used)
local function noteHash(s) local h = 5381.0; for i = 1, #s do h = (h * 33.0 + s:byte(i)) % 2147483647.0 end; return string.format("%.0f", h) end
local function loadedNote()
  if type(NSRT) == "table" and type(NSRT.StoredSharedReminder) == "string" and NSRT.StoredSharedReminder ~= "" then return "NSRT", NSRT.StoredSharedReminder, NSRT.ActiveReminder end
  if type(VMRT) == "table" and type(VMRT.Note) == "table" and type(VMRT.Note.Text1) == "string" and VMRT.Note.Text1 ~= "" then return "MRT", VMRT.Note.Text1 end
end
local function saveNote(encID, encName, diff)
  if not DB then return end
  local src, text, name = loadedNote(); if not text then return end
  local sec = function(v) return issecretvalue and issecretvalue(v) end
  if sec(text) then return end
  if sec(encID) then encID = nil end; if sec(encName) then encName = nil end; if sec(diff) then diff = nil end
  local h = noteHash(text)
  DB.notes = DB.notes or {}; DB.noteText = DB.noteText or {}
  DB.noteText[h] = text
  table.insert(DB.notes, { e = encID, b = encName, d = diff, t = (time and time()) or 0, s = src, n = type(name) == "string" and name or nil, h = h })
  while #DB.notes > 300 do table.remove(DB.notes, 1) end
  local used = {}; for _, x in ipairs(DB.notes) do used[x.h] = true end; for k in pairs(DB.noteText) do if not used[k] then DB.noteText[k] = nil end end
end

local ev = CreateFrame("Frame")
for _, e in ipairs({ "ADDON_LOADED", "PLAYER_LOGIN", "PLAYER_ENTERING_WORLD", "ZONE_CHANGED_NEW_AREA", "PLAYER_REGEN_ENABLED", "READY_CHECK", "PLAYER_TARGET_CHANGED", "ENCOUNTER_START" }) do pcall(ev.RegisterEvent, ev, e) end
ev:SetScript("OnEvent", function(self, e, arg, ...)
  if e == "ENCOUNTER_START" then saveNote(arg, ...)
  elseif e == "ADDON_LOADED" and arg == ADDON then
    DebriefDB = DebriefDB or {}; DB = DebriefDB
    -- (the pulls saved for the card in WoW go, so WoW's save of this addon is small again; your settings stay for the PC app's carry-over)
    DB.pulls = nil; DB.cur = nil; DB.who = nil; DB.fromApp = nil
    if UnitName then local me = UnitName("player"); if me and me ~= "" and me ~= UNKNOWNOBJECT then DB.me = me end end -- (your character, so the PC pop-up opens on you (Oct 24))
    autoLog()
  elseif e == "PLAYER_LOGIN" then
    acl()
    if DB then DB.myChars = DB.myChars or {}; local me0 = UnitName and UnitName("player"); if me0 and me0 ~= "" then DB.myChars[me0] = true end end
    -- (the old card's key, Ctrl+Shift+D in WoW, is freed: it's the recap key on your PC now)
    if not (InCombatLockdown and InCombatLockdown()) and GetBindingAction and SetBinding and GetBindingAction("CTRL-SHIFT-D") == "DEBRIEF_TOGGLE" then
      if SetBinding("CTRL-SHIFT-D") and SaveBindings and GetCurrentBindingSet then SaveBindings(GetCurrentBindingSet()) end
    end
    -- (once, on the first login after the update; never again)
    if DB and not DB.pcOnly then DB.pcOnly = true; say("now shows your recaps only on your PC. Nothing to do here: it keeps your combat log on.") end
    autoLog()
  elseif e == "PLAYER_ENTERING_WORLD" or e == "ZONE_CHANGED_NEW_AREA" then
    if C_Timer then C_Timer.After(2, autoLog) else autoLog() end
  elseif e == "PLAYER_REGEN_ENABLED" then logPending = false; autoLog() -- (after every fight, in case anything turned it off)
  elseif e == "READY_CHECK" then autoLog() -- (just before a pull)
  elseif e == "PLAYER_TARGET_CHANGED" then
    -- (practising on a dummy: the combat log goes on, so Debrief Companion can read it and pop your recap up on your PC)
    if isDummy("target") and LoggingCombat and not LoggingCombat() then
      acl(); LoggingCombat(true); say("combat log is on for your practice. Hit the dummy, stop, and your recap pops up on your PC.")
    end
  end
end)

-- (the old commands, for old habits: one line, no windows)
local function onPc() if DEFAULT_CHAT_FRAME then DEFAULT_CHAT_FRAME:AddMessage(GOLD .. "Debrief's|r recap and settings are on your PC now: press your recap key, or open Debrief Companion.") end end
SLASH_DEBRIEF1 = "/recap"; SLASH_DEBRIEF2 = "/debrief"; SlashCmdList.DEBRIEF = onPc
SLASH_DEBRIEFMO1 = "/db"; SlashCmdList.DEBRIEFMO = onPc

-- (a problem is noted for "Report a problem" in Debrief Companion, said once, never an error box (Oct 24); the last 10, the same one counted)
local saidProblem = false
local function noteError(err)
  if not DB then return end
  local m = tostring(err or "?"):gsub("^.-AddOns[/\\]Debrief[/\\]", ""):gsub("[\r\n]+", " "):sub(1, 300)
  DB.errors = DB.errors or {}
  local hit; for _, x in ipairs(DB.errors) do if x.m == m then hit = x end end
  if hit then hit.n = (hit.n or 1) + 1; hit.t = (time and time()) or 0
  else table.insert(DB.errors, { m = m, n = 1, t = (time and time()) or 0 }); while #DB.errors > 10 do table.remove(DB.errors, 1) end end
  if not saidProblem then saidProblem = true; say("hit a problem and skipped it. It's noted: Report a problem in Debrief Companion sends it to us.") end
end
do local f = ev:GetScript("OnEvent"); ev:SetScript("OnEvent", function(...) local ok, err = pcall(f, ...); if not ok then if DB then noteError(err) else error(err, 0) end end end) end
