-- Debrief Glow: when NSRT (Northern Sky Raid Tools) shows one of YOUR note reminders that has a spell, that spell's icon on
-- Blizzard's Cooldown Manager glows at the moment to press it, until you press it or the hold time runs out. A sound and a voice
-- can go with it. The timing is NSRT's own (its NSRT_REMINDER_SHOW callback), so phases and times match its pop-ups exactly, and
-- NSRT only fires it for reminders tagged to you. Debrief Glow only draws its own frames on top of the icons: the Cooldown Manager
-- isn't a protected frame, and no combat data is read. Settings: Esc > Options > AddOns > Debrief Glow, or /dglow.
-- Each spell can have its own style, colour, sound and words: /dglow spells.
local ADDON = ...
local DB
local DEF = {
  enabled = true, style = "pulse", colorName = "gold", r = 0.90, g = 0.71, b = 0.31, a = 1, thick = 3, pad = 2, speed = 1, lines = 8, scale = 1,
  lead = 0, hold = 8, stopOnPress = true, fallback = true, iconSize = 56,
  sound = "none", channel = "Master",
  tts = false, ttsText = "{spell}", ttsVoice = 0, ttsVolume = 100, ttsRate = 0, countdown = 0,
}
local function say(m) DEFAULT_CHAT_FRAME:AddMessage("|cffe6b450Debrief Glow|r " .. m) end
local function secret(x) return issecretvalue and issecretvalue(x) end
local function spellName(id) local n = C_Spell and C_Spell.GetSpellName and C_Spell.GetSpellName(id); if n and not secret(n) then return n end end
local function spellIcon(id) local t = C_Spell and C_Spell.GetSpellTexture and C_Spell.GetSpellTexture(id); if t and not secret(t) then return t end; return 134400 end
-- (each spell can have its own style, colour, sound and words: DB.spells[id]; a missing field means "use the main setting")
local NONE = {}
local function per(id) return DB and DB.spells and id and DB.spells[id] or NONE end
local function perSet(id, k, v)
  DB.spells[id] = DB.spells[id] or {}; DB.spells[id][k] = v
  if next(DB.spells[id]) == nil then DB.spells[id] = nil end
end
local function spellOn(id) return not per(id).off end

-- ---- the Cooldown Manager: every icon on screen and the spell IDs it stands for (base, current and override) ----
local VIEWERS = { "EssentialCooldownViewer", "UtilityCooldownViewer" }
local function cdmItems()
  local out = {}
  for _, vn in ipairs(VIEWERS) do
    local v = _G[vn]
    if v and v.GetItemFrames then
      local ok, items = pcall(v.GetItemFrames, v)
      if ok and type(items) == "table" then
        for _, it in ipairs(items) do
          local ids = {}
          for _, fn in ipairs({ "GetSpellID", "GetBaseSpellID" }) do
            if it[fn] then local ok2, x = pcall(it[fn], it); if ok2 and x and not secret(x) then ids[#ids + 1] = x end end
          end
          local ci = it.cooldownInfo
          if type(ci) == "table" then for _, k in ipairs({ "spellID", "overrideSpellID", "overrideTooltipSpellID" }) do local x = ci[k]; if x and not secret(x) then ids[#ids + 1] = x end end end
          if #ids > 0 then out[#out + 1] = { frame = it, ids = ids } end
        end
      end
    end
  end
  return out
end
local function cdmItemFor(id)
  local name = spellName(id)
  for _, e in ipairs(cdmItems()) do
    for _, x in ipairs(e.ids) do if x == id or (name and spellName(x) == name) then return e.frame end end
  end
end

-- ---- the glows: one frame per spell, drawn in the chosen style ----
local STYLES = { { "pulse", "Pulse (soft glow that breathes)" }, { "border", "Border (solid edge)" }, { "pixel", "Pixel lines (running around the edge)" },
  { "sparkle", "Sparkles (dots circling the icon)" }, { "proc", "Proc (like a spell proc on your action bar)" } }
local HALO = "Interface\\GLUES\\Models\\UI_Draenei\\GenericGlow64"
local WHITE = "Interface\\Buttons\\WHITE8X8"
local glows, pool = {}, {}
local function newGlow()
  local g = table.remove(pool); if g then return g end
  g = CreateFrame("Frame", nil, UIParent); g:SetFrameStrata("HIGH")
  g.halo = g:CreateTexture(nil, "BACKGROUND"); g.halo:SetTexture(HALO); g.halo:SetBlendMode("ADD")
  g.edges = {}; for i = 1, 4 do local t = g:CreateTexture(nil, "OVERLAY"); t:SetTexture(WHITE); g.edges[i] = t end
  g.bits = {}; for i = 1, 16 do local t = g:CreateTexture(nil, "OVERLAY"); t:SetTexture(WHITE); t:Hide(); g.bits[i] = t end
  g.proc = g:CreateTexture(nil, "OVERLAY")
  g.ag = g:CreateAnimationGroup(); g.ag:SetLooping("BOUNCE")
  g.fade = g.ag:CreateAnimation("Alpha"); g.fade:SetFromAlpha(1); g.fade:SetToAlpha(0.3)
  g.pag = g.proc.CreateAnimationGroup and g.proc:CreateAnimationGroup(); if g.pag then g.pag:SetLooping("REPEAT"); g.flip = g.pag:CreateAnimation("FlipBook") end
  return g
end
-- (places each part for the style; pixel lines and sparkles move on every frame, around the edge of the icon)
local function perimeter(w, h, p) p = p % 1; local L = 2 * (w + h); local d = p * L
  if d < w then return d, 0 elseif d < w + h then return w, -(d - w) elseif d < 2 * w + h then return w - (d - w - h), -h else return 0, -(h - (d - 2 * w - h)) end end
local function animate(g, elapsed)
  g.t = (g.t or 0) + elapsed * (DB.speed or 1)
  local w, h = g:GetWidth(), g:GetHeight(); if not w or w <= 0 then return end
  local n = math.max(1, math.min(16, DB.lines or 8))
  for i = 1, n do
    local b = g.bits[i]; local x, y = perimeter(w, h, g.t * 0.25 + (i - 1) / n)
    b:ClearAllPoints(); b:SetPoint("CENTER", g, "TOPLEFT", x, y)
  end
end
local function dress(g, id)
  local p = per(id)
  local r, gg, b, a = DB.r, DB.g, DB.b, DB.a or 1
  if p.color then r, gg, b = p.color[1], p.color[2], p.color[3] end
  local th, st = DB.thick or 3, p.style or DB.style
  g.ag:Stop(); if g.pag then g.pag:Stop() end; g:SetScript("OnUpdate", nil); g:SetAlpha(a)
  g.halo:Hide(); g.proc:Hide(); for _, t in ipairs(g.edges) do t:Hide() end; for _, t in ipairs(g.bits) do t:Hide() end
  if st == "proc" and g.flip and C_Texture and C_Texture.GetAtlasInfo and C_Texture.GetAtlasInfo("UI-HUD-ActionBar-Proc-Loop-Flipbook") then
    g.proc:SetAtlas("UI-HUD-ActionBar-Proc-Loop-Flipbook"); g.proc:ClearAllPoints(); g.proc:SetPoint("TOPLEFT", -th * 4, th * 4); g.proc:SetPoint("BOTTOMRIGHT", th * 4, -th * 4)
    g.proc:SetVertexColor(r, gg, b); g.proc:Show()
    g.flip:SetFlipBookRows(6); g.flip:SetFlipBookColumns(5); g.flip:SetFlipBookFrames(30); g.flip:SetDuration(1 / (DB.speed or 1)); g.pag:Play()
    return
  end
  if st == "pulse" or st == "proc" then
    g.halo:ClearAllPoints(); g.halo:SetPoint("TOPLEFT", -th * 5, th * 5); g.halo:SetPoint("BOTTOMRIGHT", th * 5, -th * 5); g.halo:SetVertexColor(r, gg, b, 1); g.halo:Show()
  end
  if st == "pulse" or st == "border" or st == "proc" then
    local e = g.edges
    e[1]:ClearAllPoints(); e[1]:SetPoint("TOPLEFT"); e[1]:SetPoint("TOPRIGHT"); e[1]:SetHeight(th)
    e[2]:ClearAllPoints(); e[2]:SetPoint("BOTTOMLEFT"); e[2]:SetPoint("BOTTOMRIGHT"); e[2]:SetHeight(th)
    e[3]:ClearAllPoints(); e[3]:SetPoint("TOPLEFT"); e[3]:SetPoint("BOTTOMLEFT"); e[3]:SetWidth(th)
    e[4]:ClearAllPoints(); e[4]:SetPoint("TOPRIGHT"); e[4]:SetPoint("BOTTOMRIGHT"); e[4]:SetWidth(th)
    for _, t in ipairs(e) do t:SetVertexColor(r, gg, b, 1); t:Show() end
  end
  if st == "pulse" or st == "proc" then g.fade:SetDuration(0.45 / (DB.speed or 1)); g.ag:Play() end
  if st == "pixel" or st == "sparkle" then
    local n = math.max(1, math.min(16, DB.lines or 8))
    for i = 1, n do local t = g.bits[i]; t:SetVertexColor(r, gg, b, 1)
      if st == "pixel" then t:SetSize(th * 3, th) else t:SetSize(th * 1.6, th * 1.6) end; t:Show() end
    if st == "sparkle" then g.halo:ClearAllPoints(); g.halo:SetPoint("TOPLEFT", -th * 3, th * 3); g.halo:SetPoint("BOTTOMRIGHT", th * 3, -th * 3); g.halo:SetVertexColor(r, gg, b, 0.5); g.halo:Show() end
    g:SetScript("OnUpdate", animate)
  end
end

-- (a big icon of its own, for a spell that isn't on your Cooldown Manager; drag it with /dglow move)
local float
local function floatIcon()
  if float then return float end
  float = CreateFrame("Frame", "DebriefGlowIcon", UIParent); float:SetFrameStrata("HIGH"); float:SetMovable(true); float:SetClampedToScreen(true)
  float.tex = float:CreateTexture(nil, "ARTWORK"); float.tex:SetAllPoints(); float.tex:SetTexCoord(0.08, 0.92, 0.08, 0.92)
  float.txt = float:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge"); float.txt:SetPoint("TOP", float, "BOTTOM", 0, -4)
  float:SetScript("OnMouseDown", function(self) if self.moving then self:StartMoving() end end)
  float:SetScript("OnMouseUp", function(self) self:StopMovingOrSizing(); local p, _, rp, x, y = self:GetPoint(); DB.floatPos = { p, rp, x, y } end)
  float:Hide()
  return float
end
local function placeFloat()
  local f = floatIcon(); f:ClearAllPoints(); local p = DB.floatPos
  if p then f:SetPoint(p[1], UIParent, p[2], p[3], p[4]) else f:SetPoint("CENTER", UIParent, "CENTER", 0, 180) end
  f:SetSize(DB.iconSize or 56, DB.iconSize or 56)
end

local function stop(id)
  local g = glows[id]; if not g then return end
  glows[id] = nil
  if g.timer then g.timer:Cancel(); g.timer = nil end
  g.ag:Stop(); if g.pag then g.pag:Stop() end; g:SetScript("OnUpdate", nil); g:Hide(); g:ClearAllPoints()
  if g.onFloat and float then float:Hide() end; g.onFloat = nil
  pool[#pool + 1] = g
end
-- (the boss is over or NSRT hid its reminders: every glow stops, and glows, sounds and countdowns still waiting are called off)
local round = 0
local function stopAll() round = round + 1; for id in pairs(glows) do stop(id) end end
-- (glows the icon for this spell: on the Cooldown Manager, or on the big icon of its own when it isn't there)
local function start(id, hold, label)
  local it = cdmItemFor(id)
  if not it and not DB.fallback then return false end
  stop(id)
  local g = newGlow(); local pad = DB.pad or 2
  if not it then placeFloat(); float.tex:SetTexture(spellIcon(id)); float.txt:SetText(label or spellName(id) or ""); float:Show(); it = float; g.onFloat = true end
  g:SetScale(DB.scale or 1)
  g:SetPoint("TOPLEFT", it, "TOPLEFT", -pad, pad); g:SetPoint("BOTTOMRIGHT", it, "BOTTOMRIGHT", pad, -pad)
  g:SetFrameLevel((it.GetFrameLevel and it:GetFrameLevel() or 1) + 10); g:Show(); dress(g, id)
  glows[id] = g
  g.timer = C_Timer.NewTimer(hold or DB.hold or 8, function() g.timer = nil; stop(id) end)
  return true
end

-- ---- sound and voice ----
local SOUNDS = { { "none", "No sound" }, { "raidwarning", "Raid warning", "RAID_WARNING" }, { "readycheck", "Ready check", "READY_CHECK" },
  { "alarm", "Alarm clock", "ALARM_CLOCK_WARNING_3" }, { "whisper", "Boss whisper", "UI_RAID_BOSS_WHISPER_WARNING" }, { "bell", "Bell (invite)", "IG_PLAYER_INVITE" },
  { "tell", "Whisper ping", "TELL_MESSAGE" }, { "quest", "Quest complete", "IG_QUEST_LIST_COMPLETE" } }
local function lsm() return LibStub and LibStub("LibSharedMedia-3.0", true) end
local function playSound(key)
  key = key or DB.sound
  if not key or key == "none" then return end
  if key:sub(1, 4) == "lsm:" then local L = lsm(); local path = L and L:Fetch("sound", key:sub(5), true); if path then PlaySoundFile(path, DB.channel or "Master") end; return end
  for _, s in ipairs(SOUNDS) do if s[1] == key and s[3] and SOUNDKIT and SOUNDKIT[s[3]] then PlaySound(SOUNDKIT[s[3]], DB.channel or "Master") end end
end
local function speak(text)
  if not text or text == "" or not (C_VoiceChat and C_VoiceChat.SpeakText) then return end
  local voice = DB.ttsVoice or 0
  local ok = false; for _, v in ipairs((C_VoiceChat.GetTtsVoices and C_VoiceChat.GetTtsVoices()) or {}) do if v.voiceID == voice then ok = true end end
  if not ok then voice = 0 end
  pcall(C_VoiceChat.SpeakText, voice, text, DB.ttsRate or 0, DB.ttsVolume or 100, true)
end
local function ttsFor(id, label) return ((DB.ttsText or "{spell}"):gsub("{spell}", label or spellName(id) or "your cooldown")) end
-- (what this spell says out loud: its own words if it has some, even with the main voice off; else the main wording when the voice is on)
local function wordsFor(id, label)
  local w = per(id).words
  if w and w ~= "" then return (w:gsub("{spell}", label or spellName(id) or "your cooldown")) end
  if DB.tts then return ttsFor(id, label) end
end
local function soundFor(id) return per(id).sound or DB.sound end

-- ---- the moment: glow, sound and voice together, a countdown before it if you want one ----
local function fire(id, label)
  if not (DB and DB.enabled) or not spellOn(id) then return end
  local ok = start(id, nil, label)
  if ok or DB.fallback then playSound(soundFor(id)); local w = wordsFor(id, label); if w then speak(w) end end
end
local function schedule(id, wait, label)
  if not spellOn(id) then return end
  local lead, my = math.max(0, DB.lead or 0), round
  local at = math.max(0, wait - lead)
  if wordsFor(id, label) and (DB.countdown or 0) > 0 then
    for i = DB.countdown, 1, -1 do local t = at - i; if t >= 0 then C_Timer.After(t, function() if DB.enabled and round == my then speak(tostring(i)) end end) end end
  end
  if at > 0.05 then C_Timer.After(at, function() if round == my then fire(id, label) end end) else fire(id, label) end
end

-- ---- NSRT: it says a reminder of yours is showing; its countdown ends at the moment to press ----
local hooked = false
local function onReminder(_, info)
  if not (DB and DB.enabled) or type(info) ~= "table" then return end
  local id = info.spellID or info.spellid
  if not id or secret(id) then return end
  id = tonumber(id); if not id then return end
  DB.seen[id] = true -- (so it shows in the Your spells window)
  local wait = info.expires and not secret(info.expires) and (info.expires - GetTime()) or (tonumber(info.dur) or 8)
  schedule(id, wait)
end
local function hookNSRT()
  if hooked or not (NSAPI and NSAPI.RegisterCallback) then return end
  hooked = true
  pcall(NSAPI.RegisterCallback, "DebriefGlow", "NSRT_REMINDER_SHOW", onReminder)
  pcall(NSAPI.RegisterCallback, "DebriefGlow", "NSRT_ALERT_WOULD_SHOW", onReminder) -- (NSRT's reminders shown on Blizzard's timeline instead)
  pcall(NSAPI.RegisterCallback, "DebriefGlow", "NSRT_HIDE_REMINDERS", stopAll)
end
local function onCast(id)
  if not DB or DB.stopOnPress == false or not id or secret(id) or not next(glows) then return end
  if glows[id] then stop(id) return end
  local n = spellName(id); if n then for g in pairs(glows) do if spellName(g) == n then stop(g) end end end
end

-- ---- test: every Cooldown Manager icon glows for 3 s with the sound and voice, so you can see your settings without a raid ----
function DebriefGlow_Test(quiet)
  local n = 0
  for _, e in ipairs(cdmItems()) do if spellOn(e.ids[1]) and start(e.ids[1], 3) then n = n + 1 end end
  if n == 0 and DB.fallback then start(31821, 3, "Test"); n = 1 end
  playSound(); if DB.tts and not quiet then speak(ttsFor(31821, "Test")) end
  if not quiet then
    if not NSAPI then say("NSRT isn't loaded. The glows follow NSRT's reminders, so turn NSRT on too.") end
    if #cdmItems() == 0 then say("no Cooldown Manager icons found. Turn on Blizzard's Cooldown Manager (Options > Gameplay Enhancements) and add your cooldowns to it.")
    else say("your Cooldown Manager icons glow for 3 s. In a raid only your own NSRT spells glow, when it's time to press them.") end
  end
end

-- ---- settings: Esc > Options > AddOns > Debrief Glow ----
local category
local function color(r, g, b) return { r, g, b } end
local COLORS = { { "gold", "Gold", color(0.90, 0.71, 0.31) }, { "white", "White", color(1, 1, 1) }, { "red", "Red", color(1, 0.25, 0.2) }, { "green", "Green", color(0.3, 0.95, 0.4) },
  { "blue", "Blue", color(0.3, 0.6, 1) }, { "purple", "Purple", color(0.75, 0.4, 1) }, { "cyan", "Cyan", color(0.2, 0.95, 0.95) }, { "pink", "Pink", color(1, 0.45, 0.8) } }
local function preview() if DB.enabled then DebriefGlow_Test(true) end end
local function buildSettings()
  if not (Settings and Settings.RegisterVerticalLayoutCategory and Settings.RegisterAddOnSetting) then return end
  local cat, layout = Settings.RegisterVerticalLayoutCategory("Debrief Glow")
  category = cat
  local V = Settings.VarType
  local function reg(key, kind, name, default) local s = Settings.RegisterAddOnSetting(cat, "DebriefGlow_" .. key, key, DB, kind, name, default); return s end
  local function header(t) if CreateSettingsListSectionHeaderInitializer then layout:AddInitializer(CreateSettingsListSectionHeaderInitializer(t)) end end
  local function check(key, name, tip) Settings.CreateCheckbox(cat, reg(key, V.Boolean, name, DEF[key]), tip) end
  local function slider(key, name, tip, lo, hi, step, fmt)
    local s = reg(key, V.Number, name, DEF[key]); local o = Settings.CreateSliderOptions(lo, hi, step)
    if MinimalSliderWithSteppersMixin and o.SetLabelFormatter then o:SetLabelFormatter(MinimalSliderWithSteppersMixin.Label.Right, fmt or function(v) return tostring(v) end) end
    Settings.CreateSlider(cat, s, o, tip); return s
  end
  local function list(key, name, tip, kind, options)
    local s = reg(key, kind or V.String, name, DEF[key])
    Settings.CreateDropdown(cat, s, function() local c = Settings.CreateControlTextContainer(); for _, o in ipairs(options()) do c:Add(o[1], o[2]) end; return c:GetData() end, tip); return s
  end
  local function button(name, text, fn, tip) if CreateSettingsButtonInitializer then layout:AddInitializer(CreateSettingsButtonInitializer(name, text, fn, tip, true)) end end
  local function watch(key) if Settings.SetOnValueChangedCallback then Settings.SetOnValueChangedCallback("DebriefGlow_" .. key, preview) end end

  header("When it glows")
  check("enabled", "Glow my NSRT cooldowns", "Your own NSRT reminders with a spell make that spell glow on the Cooldown Manager.")
  slider("lead", "Start early", "Seconds before NSRT's countdown ends. 0 glows at the moment to press.", 0, 5, 0.5, function(v) return v == 0 and "On time" or (v .. " s early") end)
  slider("hold", "Keep glowing", "If you don't press it, the glow stops after this long.", 2, 20, 1, function(v) return v .. " s" end)
  check("stopOnPress", "Stop when I press it", "The glow ends as soon as you cast the spell.")
  check("fallback", "Big icon when it isn't on the bar", "A spell that isn't on your Cooldown Manager gets a big icon of its own (move it with /dglow move).")
  slider("iconSize", "Big icon size", nil, 32, 128, 4, function(v) return v .. " px" end)

  header("How it looks")
  list("style", "Style", "Changing it shows a quick preview on your Cooldown Manager.", V.String, function() return STYLES end); watch("style")
  list("colorName", "Colour", "Pick a colour, or Custom for any colour.", V.String, function() local o = {}; for _, c in ipairs(COLORS) do o[#o + 1] = { c[1], c[2] } end; o[#o + 1] = { "custom", "Custom (pick below)" }; return o end)
  if Settings.SetOnValueChangedCallback then Settings.SetOnValueChangedCallback("DebriefGlow_colorName", function(_, s, v) for _, c in ipairs(COLORS) do if c[1] == v then DB.r, DB.g, DB.b = c[3][1], c[3][2], c[3][3] end end; preview() end) end
  button("Custom colour", "Pick a colour", function()
    if not ColorPickerFrame or not ColorPickerFrame.SetupColorPickerAndShow then return end
    local r0, g0, b0, a0 = DB.r, DB.g, DB.b, DB.a
    ColorPickerFrame:SetupColorPickerAndShow({ r = DB.r, g = DB.g, b = DB.b, opacity = DB.a, hasOpacity = true,
      swatchFunc = function() DB.r, DB.g, DB.b = ColorPickerFrame:GetColorRGB(); DB.colorName = "custom"; preview() end,
      opacityFunc = function() DB.a = ColorPickerFrame:GetColorAlpha(); preview() end,
      cancelFunc = function() DB.r, DB.g, DB.b, DB.a = r0, g0, b0, a0 end })
  end, "Any colour and how see-through it is.")
  slider("thick", "Thickness", nil, 1, 8, 1, function(v) return v .. " px" end); watch("thick")
  slider("pad", "Distance from the icon", nil, 0, 10, 1, function(v) return v .. " px" end); watch("pad")
  slider("scale", "Size", nil, 0.5, 2, 0.05, function(v) return math.floor(v * 100 + 0.5) .. "%" end); watch("scale")
  slider("speed", "Speed", "How fast it pulses, runs or spins.", 0.25, 3, 0.25, function(v) return v .. "x" end); watch("speed")
  slider("lines", "Lines or sparkles", "For the Pixel lines and Sparkles styles.", 1, 16, 1); watch("lines")
  slider("a", "Opacity", nil, 0.1, 1, 0.05, function(v) return math.floor(v * 100 + 0.5) .. "%" end); watch("a")

  header("Sound")
  list("sound", "Sound", "Plays when the glow starts.", V.String, function()
    local o = {}; for _, s in ipairs(SOUNDS) do o[#o + 1] = { s[1], s[2] } end
    local L = lsm(); if L and L.List then for _, n in ipairs(L:List("sound") or {}) do if n ~= "None" then o[#o + 1] = { "lsm:" .. n, n } end end end
    return o end)
  if Settings.SetOnValueChangedCallback then Settings.SetOnValueChangedCallback("DebriefGlow_sound", function() playSound() end) end
  list("channel", "Sound channel", "Master plays even with game sounds turned down.", V.String, function() return { { "Master", "Master" }, { "SFX", "Effects" }, { "Dialog", "Dialog" }, { "Ambience", "Ambience" } } end)

  header("Voice")
  check("tts", "Say it out loud", "Text to speech when the glow starts. NSRT can speak its reminders too: turn one of them off so you don't hear it twice.")
  list("ttsVoice", "Voice", nil, V.Number, function() local o = { { 0, "Default" } }; for _, v in ipairs((C_VoiceChat and C_VoiceChat.GetTtsVoices and C_VoiceChat.GetTtsVoices()) or {}) do o[#o + 1] = { v.voiceID, v.name } end; return o end)
  list("ttsText", "What it says", nil, V.String, function() return { { "{spell}", "The spell's name" }, { "{spell} now", "\"Aura Mastery now\"" }, { "Press {spell}", "\"Press Aura Mastery\"" }, { "Cooldown", "\"Cooldown\"" }, { "Go", "\"Go\"" } } end)
  slider("ttsVolume", "Voice volume", nil, 0, 100, 5, function(v) return v .. "%" end)
  slider("ttsRate", "Voice speed", nil, -10, 10, 1, function(v) return v == 0 and "Normal" or (v > 0 and "+" .. v or tostring(v)) end)
  slider("countdown", "Count down first", "Says 3, 2, 1 before the moment (with Say it out loud on).", 0, 5, 1, function(v) return v == 0 and "Off" or (v .. " s") end)

  header("Each spell")
  button("Your spells", "Colour, sound and words per spell", function() DebriefGlow_Spells() end, "Give each spell its own style, colour, sound or words, or turn one off.")

  header("Try it")
  button("Test", "Test the glow", function() DebriefGlow_Test() end, "Every Cooldown Manager icon glows for 3 s with your sound and voice.")
  Settings.RegisterAddOnCategory(cat)
end

-- ---- Your spells: a window with one row per spell (from your NSRT note, your Cooldown Manager, and reminders you've had) ----
-- (each row: glow on/off, style, colour, sound, words and a Test button; "Main" means the main setting is used)
local function noteSpells()
  local out = {}
  if not (NSAPI and NSAPI.GetReminderString) then return out end
  local ok, a, b = pcall(NSAPI.GetReminderString, NSAPI)
  if not ok then return out end
  local me = UnitName("player")
  for _, s in ipairs({ a, b }) do
    if type(s) == "string" and not secret(s) then
      for line in s:gmatch("[^\r\n]+") do
        local id = tonumber(line:match("spellid:(%d+)"))
        if id and ((me and line:find(me, 1, true)) or (IsPlayerSpell and IsPlayerSpell(id))) then out[id] = true end
      end
    end
  end
  return out
end
local function spellList()
  local src, list = {}, {}
  local function add(id, where) if id and spellName(id) then src[id] = src[id] or where end end
  for id in pairs(noteSpells()) do add(id, "in your NSRT note") end
  for id in pairs(DB.seen) do add(id, "in your NSRT note") end
  for _, e in ipairs(cdmItems()) do add(e.ids[1], "on your Cooldown Manager") end
  for id in pairs(DB.spells) do add(id, "added by you") end
  for id, where in pairs(src) do list[#list + 1] = { id = id, name = spellName(id), where = where } end
  table.sort(list, function(x, y) return x.name < y.name end)
  return list
end
local function testSpell(id)
  start(id, 3); playSound(soundFor(id)); local w = wordsFor(id); if w then speak(w) end
end
local function colorText(c, text) return string.format("|cff%02x%02x%02x%s|r", math.floor(c[1] * 255 + 0.5), math.floor(c[2] * 255 + 0.5), math.floor(c[3] * 255 + 0.5), text) end
local function soundOptions()
  local o = { { "main", "Main sound" } }
  for _, s in ipairs(SOUNDS) do o[#o + 1] = { s[1], s[2] } end
  local L = lsm(); if L and L.List then for _, n in ipairs(L:List("sound") or {}) do if n ~= "None" then o[#o + 1] = { "lsm:" .. n, n } end end end
  return o
end
-- (a drop-down: Blizzard's menu button when the game has it; else a button that steps through the choices)
local function pick(parent, w, options, get, set)
  local ok, dd = pcall(CreateFrame, "DropdownButton", nil, parent, "WowStyle1DropdownTemplate")
  if ok and dd and dd.SetupMenu then
    dd:SetWidth(w)
    dd:SetupMenu(function(_, root)
      if root.SetScrollMode then root:SetScrollMode(360) end
      for _, o in ipairs(options()) do root:CreateRadio(o[2], function() return get() == o[1] end, function() set(o[1]) end) end
    end)
    dd.Refresh = function(self) if self.GenerateMenu then self:GenerateMenu() end end
    return dd
  end
  local b = CreateFrame("Button", nil, parent, "UIPanelButtonTemplate"); b:SetSize(w, 22)
  b.Refresh = function(self) local cur = get(); for _, o in ipairs(options()) do if o[1] == cur then self:SetText(o[2]) end end end
  b:SetScript("OnClick", function(self)
    local opts, cur = options(), get(); local nxt = opts[1][1]
    for i, o in ipairs(opts) do if o[1] == cur then nxt = (opts[i + 1] or opts[1])[1] end end
    set(nxt); self:Refresh()
  end)
  return b
end

local win, rows = nil, {}
local ROW_H, COLS = 40, { icon = 6, name = 42, on = 196, style = 226, color = 372, sound = 494, words = 640, test = 778, reset = 836 }
local function newRow(parent)
  local r = CreateFrame("Frame", nil, parent); r:SetSize(860, ROW_H)
  r.bg = r:CreateTexture(nil, "BACKGROUND"); r.bg:SetAllPoints(); r.bg:SetColorTexture(1, 1, 1, 0.03)
  r.icon = r:CreateTexture(nil, "ARTWORK"); r.icon:SetSize(30, 30); r.icon:SetPoint("LEFT", COLS.icon, 0); r.icon:SetTexCoord(0.08, 0.92, 0.08, 0.92)
  r.name = r:CreateFontString(nil, "OVERLAY", "GameFontHighlight"); r.name:SetPoint("TOPLEFT", COLS.name, -6); r.name:SetWidth(150); r.name:SetJustifyH("LEFT")
  r.where = r:CreateFontString(nil, "OVERLAY", "GameFontDisableSmall"); r.where:SetPoint("TOPLEFT", r.name, "BOTTOMLEFT", 0, -2); r.where:SetWidth(150); r.where:SetJustifyH("LEFT")
  r.on = CreateFrame("CheckButton", nil, r, "UICheckButtonTemplate"); r.on:SetPoint("LEFT", COLS.on, 0); r.on:SetSize(26, 26)
  r.on:SetScript("OnClick", function(self) perSet(r.id, "off", (not self:GetChecked()) or nil); r:Refresh() end)
  r.style = pick(r, 136, function() local o = { { "main", "Main style" } }; for _, s in ipairs(STYLES) do o[#o + 1] = { s[1], (s[2]:gsub(" %(.*", "")) } end; return o end,
    function() return per(r.id).style or "main" end, function(v) perSet(r.id, "style", v ~= "main" and v or nil); testSpell(r.id) end)
  r.style:SetPoint("LEFT", COLS.style, 0)
  r.color = pick(r, 112, function()
      local o = { { "main", colorText({ DB.r, DB.g, DB.b }, "Main colour") } }
      for _, c in ipairs(COLORS) do o[#o + 1] = { c[1], colorText(c[3], c[2]) } end
      local mine = per(r.id).color; if mine and not mine.preset then o[#o + 1] = { "custom", colorText(mine, "Your colour") } end
      o[#o + 1] = { "pick", "Pick any colour..." }; return o end,
    function() local c = per(r.id).color; return not c and "main" or c.preset or "custom" end,
    function(v)
      if v == "main" then perSet(r.id, "color", nil)
      elseif v == "pick" then
        if not (ColorPickerFrame and ColorPickerFrame.SetupColorPickerAndShow) then return end
        local id, old = r.id, per(r.id).color; local c0 = old or { DB.r, DB.g, DB.b }
        ColorPickerFrame:SetupColorPickerAndShow({ r = c0[1], g = c0[2], b = c0[3],
          swatchFunc = function() local cr, cg, cb = ColorPickerFrame:GetColorRGB(); perSet(id, "color", { cr, cg, cb }); r:Refresh() end,
          cancelFunc = function() perSet(id, "color", old); r:Refresh() end })
        return
      else for _, c in ipairs(COLORS) do if c[1] == v then perSet(r.id, "color", { c[3][1], c[3][2], c[3][3], preset = c[1] }) end end end
      r:Refresh(); testSpell(r.id)
    end)
  r.color:SetPoint("LEFT", COLS.color, 0)
  r.swatch = r:CreateTexture(nil, "OVERLAY"); r.swatch:SetSize(10, 22); r.swatch:SetPoint("RIGHT", r.color, "LEFT", -3, 0)
  r.sound = pick(r, 136, soundOptions, function() return per(r.id).sound or "main" end,
    function(v) perSet(r.id, "sound", v ~= "main" and v or nil); playSound(soundFor(r.id)) end)
  r.sound:SetPoint("LEFT", COLS.sound, 0)
  r.words = CreateFrame("EditBox", nil, r, "InputBoxTemplate"); r.words:SetSize(126, 22); r.words:SetPoint("LEFT", COLS.words + 6, 0); r.words:SetAutoFocus(false); r.words:SetMaxLetters(60)
  r.words.hint = r.words:CreateFontString(nil, "OVERLAY", "GameFontDisableSmall"); r.words.hint:SetPoint("LEFT", 2, 0)
  local function saveWords(self) local t = (self:GetText() or ""):gsub("^%s+", ""):gsub("%s+$", ""); perSet(r.id, "words", t ~= "" and t or nil); r:Refresh() end
  r.words:SetScript("OnEnterPressed", function(self) saveWords(self); self:ClearFocus(); local w = wordsFor(r.id); if w then speak(w) end end)
  r.words:SetScript("OnEditFocusLost", saveWords)
  r.words:SetScript("OnEscapePressed", function(self) self:ClearFocus() end)
  r.words:SetScript("OnTextChanged", function(self) self.hint:SetShown(self:GetText() == "" and not self:HasFocus()) end)
  r.test = CreateFrame("Button", nil, r, "UIPanelButtonTemplate"); r.test:SetSize(52, 22); r.test:SetPoint("LEFT", COLS.test, 0); r.test:SetText("Test")
  r.test:SetScript("OnClick", function() testSpell(r.id) end)
  r.reset = CreateFrame("Button", nil, r, "UIPanelButtonTemplate"); r.reset:SetSize(24, 22); r.reset:SetPoint("LEFT", COLS.reset, 0); r.reset:SetText("x")
  r.reset:SetScript("OnClick", function() DB.spells[r.id] = nil; r:Refresh() end)
  r.reset:SetScript("OnEnter", function(self) GameTooltip:SetOwner(self, "ANCHOR_RIGHT"); GameTooltip:SetText("Back to the main settings"); GameTooltip:Show() end)
  r.reset:SetScript("OnLeave", function() GameTooltip:Hide() end)
  r.Refresh = function(self)
    local p = per(self.id)
    self.icon:SetTexture(spellIcon(self.id)); self.name:SetText(spellName(self.id) or ("Spell " .. self.id)); self.where:SetText(self.whereText or "")
    self.on:SetChecked(not p.off); self.icon:SetDesaturated(p.off and true or false); self:SetAlpha(p.off and 0.55 or 1)
    self.style:Refresh(); self.color:Refresh(); self.sound:Refresh()
    local c = p.color or { DB.r, DB.g, DB.b }; self.swatch:SetColorTexture(c[1], c[2], c[3], 1)
    if not self.words:HasFocus() then self.words:SetText(p.words or "") end
    self.words.hint:SetText(DB.tts and "Main voice" or "No voice"); self.words.hint:SetShown((p.words or "") == "" and not self.words:HasFocus())
    self.reset:SetShown(next(p) ~= nil)
  end
  return r
end
local function fillWin()
  local list = spellList()
  for i, s in ipairs(list) do
    local r = rows[i] or newRow(win.content); rows[i] = r
    r.id, r.whereText = s.id, s.where
    r:ClearAllPoints(); r:SetPoint("TOPLEFT", win.content, "TOPLEFT", 0, -(i - 1) * (ROW_H + 2)); r.bg:SetShown(i % 2 == 1); r:Show(); r:Refresh()
  end
  for i = #list + 1, #rows do rows[i]:Hide() end
  win.content:SetHeight(math.max(1, #list * (ROW_H + 2)))
  win.empty:SetShown(#list == 0)
end
local function addSpell(text)
  text = (text or ""):gsub("^%s+", ""):gsub("%s+$", "")
  local id = tonumber(text)
  if not id and C_Spell and C_Spell.GetSpellInfo then local info = C_Spell.GetSpellInfo(text); id = info and not secret(info.spellID) and info.spellID end
  if not id or not spellName(id) then say("no spell called \"" .. text .. "\". Type its name exactly, or its spell ID."); return end
  DB.spells[id] = DB.spells[id] or {}; DB.spells[id].added = true
  fillWin()
end
function DebriefGlow_Spells()
  if not win then
    win = CreateFrame("Frame", "DebriefGlowSpells", UIParent, "BasicFrameTemplateWithInset")
    win:SetSize(906, 520); win:SetPoint("CENTER"); win:SetFrameStrata("HIGH"); win:SetToplevel(true)
    win:SetMovable(true); win:EnableMouse(true); win:RegisterForDrag("LeftButton"); win:SetClampedToScreen(true)
    win:SetScript("OnDragStart", win.StartMoving); win:SetScript("OnDragStop", win.StopMovingOrSizing)
    tinsert(UISpecialFrames, "DebriefGlowSpells")
    win.title = win:CreateFontString(nil, "OVERLAY", "GameFontHighlight"); win.title:SetPoint("TOP", 0, -5); win.title:SetText("Debrief Glow: your spells")
    win.help = win:CreateFontString(nil, "OVERLAY", "GameFontNormal"); win.help:SetPoint("TOPLEFT", 14, -32); win.help:SetWidth(870); win.help:SetJustifyH("LEFT")
    win.help:SetText("Give a spell its own look, sound or words. \"Main\" uses your main settings. Words are said out loud when it glows (\"{spell}\" says its name).")
    local heads = { { "Spell", COLS.name }, { "Glow", COLS.on }, { "Style", COLS.style }, { "Colour", COLS.color }, { "Sound", COLS.sound }, { "Words", COLS.words + 6 } }
    for _, h in ipairs(heads) do local t = win:CreateFontString(nil, "OVERLAY", "GameFontDisable"); t:SetPoint("TOPLEFT", 14 + h[2], -58); t:SetText(h[1]) end
    win.scroll = CreateFrame("ScrollFrame", nil, win, "UIPanelScrollFrameTemplate")
    win.scroll:SetPoint("TOPLEFT", 14, -76); win.scroll:SetPoint("BOTTOMRIGHT", -32, 48)
    win.content = CreateFrame("Frame", nil, win.scroll); win.content:SetSize(860, 1); win.scroll:SetScrollChild(win.content)
    win.empty = win:CreateFontString(nil, "OVERLAY", "GameFontDisable"); win.empty:SetPoint("TOP", win.scroll, "TOP", 0, -40); win.empty:SetWidth(600)
    win.empty:SetText("No spells yet. Load your NSRT note, put your cooldowns on Blizzard's Cooldown Manager, or add a spell below.")
    win.addLabel = win:CreateFontString(nil, "OVERLAY", "GameFontNormal"); win.addLabel:SetPoint("BOTTOMLEFT", 16, 18); win.addLabel:SetText("Add a spell:")
    win.add = CreateFrame("EditBox", nil, win, "InputBoxTemplate"); win.add:SetSize(200, 22); win.add:SetPoint("LEFT", win.addLabel, "RIGHT", 10, 0); win.add:SetAutoFocus(false)
    local function doAdd() addSpell(win.add:GetText()); win.add:SetText(""); win.add:ClearFocus() end
    win.add:SetScript("OnEnterPressed", doAdd); win.add:SetScript("OnEscapePressed", function(self) self:ClearFocus() end)
    win.addBtn = CreateFrame("Button", nil, win, "UIPanelButtonTemplate"); win.addBtn:SetSize(60, 22); win.addBtn:SetPoint("LEFT", win.add, "RIGHT", 6, 0); win.addBtn:SetText("Add")
    win.addBtn:SetScript("OnClick", doAdd)
    win.main = CreateFrame("Button", nil, win, "UIPanelButtonTemplate"); win.main:SetSize(140, 22); win.main:SetPoint("BOTTOMRIGHT", -16, 14); win.main:SetText("Main settings")
    win.main:SetScript("OnClick", function() win:Hide(); DebriefGlow_Open() end)
    win:SetScript("OnShow", fillWin)
  end
  if SettingsPanel and SettingsPanel.IsShown and SettingsPanel:IsShown() and HideUIPanel then HideUIPanel(SettingsPanel) end
  win:Show(); fillWin()
end

function DebriefGlow_Open() if category and Settings.OpenToCategory then Settings.OpenToCategory(category:GetID()) else say("settings: /dglow test, /dglow move.") end end
function DebriefGlow_OnAddonCompartmentClick() DebriefGlow_Open() end

SLASH_DEBRIEFGLOW1 = "/dglow"
SlashCmdList.DEBRIEFGLOW = function(msg)
  msg = (msg or ""):lower():gsub("^%s+", ""):gsub("%s+$", "")
  if msg == "test" then DebriefGlow_Test()
  elseif msg == "spells" then DebriefGlow_Spells()
  elseif msg == "move" then
    placeFloat(); float.tex:SetTexture(spellIcon(31821)); float.txt:SetText("Drag me, then /dglow move again"); float.moving = not float.moving; float:EnableMouse(float.moving)
    if float.moving then float:Show(); say("drag the big icon where you want it, then type /dglow move again.") else float:Hide(); say("big icon placed.") end
  elseif msg == "on" or msg == "off" then DB.enabled = (msg == "on"); say(DB.enabled and "on." or "off.")
  else DebriefGlow_Open() end
end

local ev = CreateFrame("Frame", "DebriefGlowEvents")
ev:RegisterEvent("ADDON_LOADED"); ev:RegisterEvent("PLAYER_LOGIN"); ev:RegisterEvent("ENCOUNTER_END")
ev:RegisterUnitEvent("UNIT_SPELLCAST_SUCCEEDED", "player")
ev:SetScript("OnEvent", function(_, e, a1, a2, a3)
  if e == "ADDON_LOADED" and a1 == ADDON then
    DebriefGlowDB = DebriefGlowDB or {}; DB = DebriefGlowDB
    for k, v in pairs(DEF) do if DB[k] == nil then DB[k] = v end end
    DB.spells = DB.spells or {}; DB.seen = DB.seen or {}
    if DB.colorName == nil then DB.colorName = "gold" end
    buildSettings()
  elseif e == "ADDON_LOADED" or e == "PLAYER_LOGIN" then hookNSRT()
  elseif e == "UNIT_SPELLCAST_SUCCEEDED" then onCast(a3)
  elseif e == "ENCOUNTER_END" then stopAll() end
  if e == "PLAYER_LOGIN" then hookNSRT() end
end)
