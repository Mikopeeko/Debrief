-- Debrief Glow: when NSRT (Northern Sky Raid Tools) shows one of YOUR note reminders that has a spell, that spell's icon on
-- Blizzard's Cooldown Manager glows at the moment to press it, until you press it or the hold time runs out. A sound and a voice
-- can go with it. The timing is NSRT's own (its NSRT_REMINDER_SHOW callback), so phases and times match its pop-ups exactly, and
-- NSRT only fires it for reminders tagged to you. Debrief Glow only draws its own frames on top of the icons: the Cooldown Manager
-- isn't a protected frame, and no combat data is read. Settings: /dglow (a window in the website's look), or Esc > Options > AddOns.
-- Each spell can have its own style, colour, sound and words: /dglow spells.
local ADDON = ...
local DB
local DEF = {
  enabled = true, style = "pulse", colorName = "gold", r = 0.90, g = 0.71, b = 0.31, a = 1, thick = 3, pad = 2, speed = 1, lines = 8, scale = 1,
  lead = 0, hold = 8, stopOnPress = true, fallback = true, iconSize = 56,
  gameColors = true, timer = true, timerSize = 22, timerColor = "white", timerPos = "middle", timerTenths = false,
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
-- (our own four styles, then the game's own glows: the same animated art Blizzard uses, asked for by name, never bundled)
local STYLES = { { "pulse", "Pulse (soft glow that breathes)" }, { "border", "Border (solid edge)" }, { "pixel", "Pixel lines (running around the edge)" },
  { "sparkle", "Sparkles (dots circling the icon)" },
  { "proc", "Game: action bar proc (burst, then the swirl)" }, { "assist", "Game: rotation helper (blue ants)" },
  { "onebutton", "Game: one-button proc" }, { "altglow", "Game: soft proc ring" }, { "pandemic", "Game: Cooldown Manager \"ending soon\" pulse" } }
local GAME = { proc = true, assist = true, onebutton = true, altglow = true, pandemic = true }
-- (the game's art for each one; a style whose art the game doesn't have falls back to Pulse)
local ART = {
  proc = { "UI-HUD-ActionBar-Proc-Start-Flipbook", "UI-HUD-ActionBar-Proc-Loop-Flipbook" },
  onebutton = { "OneButton_ProcStart_Flipbook", "OneButton_ProcLoop_Flipbook" },
  assist = { "rotationhelper_ants_flipbook" },
  altglow = { "UI-HUD-RotationHelper-ProcAltGlow" },
  pandemic = { "UI-CooldownManager-PandemicBorder", "UI-CooldownManager-PandemicFX-Icon01", "UI-CooldownManager-PandemicFX-Icon02", "UI-CooldownManager-PandemicFX-Icon03", "UI-CooldownManager-PandemicBorder-Mask" },
}
local function hasAtlas(a) return C_Texture and C_Texture.GetAtlasInfo and C_Texture.GetAtlasInfo(a) and true or false end
local function hasArt(st) for _, a in ipairs(ART[st] or {}) do if not hasAtlas(a) then return false end end; return ART[st] ~= nil end
local HALO = "Interface\\GLUES\\Models\\UI_Draenei\\GenericGlow64"
local WHITE = "Interface\\Buttons\\WHITE8X8"
local glows, pool = {}, {}
local timers, tpool, waiting = {}, {}, {} -- (countdown numbers on the icons, and reminders still counting down)
local timerLook, place, pv -- (shared with the preview below)
-- (a flipbook: a texture that plays the frames of one atlas; once = play through once, else loop)
local function flipbook(g, layer)
  local t = g:CreateTexture(nil, layer or "OVERLAY"); t:Hide()
  t.ag = t:CreateAnimationGroup(); t.fb = t.ag:CreateAnimation("FlipBook")
  return t
end
local function playFlip(t, atlas, rows, cols, frames, dur, once)
  t:SetAtlas(atlas); t.ag:Stop(); t.ag:SetLooping(once and "NONE" or "REPEAT")
  t.fb:SetFlipBookRows(rows); t.fb:SetFlipBookColumns(cols); t.fb:SetFlipBookFrames(frames); t.fb:SetDuration(dur)
  t:Show(); t.ag:Play()
end
local function newGlow()
  local g = table.remove(pool); if g then return g end
  g = CreateFrame("Frame", nil, UIParent); g:SetFrameStrata("HIGH")
  g.halo = g:CreateTexture(nil, "BACKGROUND"); g.halo:SetTexture(HALO); g.halo:SetBlendMode("ADD")
  g.edges = {}; for i = 1, 4 do local t = g:CreateTexture(nil, "OVERLAY"); t:SetTexture(WHITE); g.edges[i] = t end
  g.bits = {}; for i = 1, 16 do local t = g:CreateTexture(nil, "OVERLAY"); t:SetTexture(WHITE); t:Hide(); g.bits[i] = t end
  g.ag = g:CreateAnimationGroup(); g.ag:SetLooping("BOUNCE")
  g.fade = g.ag:CreateAnimation("Alpha"); g.fade:SetFromAlpha(1); g.fade:SetToAlpha(0.3)
  -- (the game's glows: a burst, a loop, a single ring, and the Cooldown Manager's border with three waves inside it)
  g.burst = flipbook(g); g.loop = flipbook(g); g.ring = g:CreateTexture(nil, "OVERLAY"); g.ring:Hide()
  g.burst.ag:SetScript("OnFinished", function() g.burst:Hide(); if g.loop.atlas then playFlip(g.loop, g.loop.atlas, 6, 5, 30, 1 / (DB.speed or 1)) end end)
  g.pborder = g:CreateTexture(nil, "OVERLAY"); g.pborder:Hide()
  g.pmask = g.CreateMaskTexture and g:CreateMaskTexture()
  g.waves = {}
  for i = 1, 3 do
    local t = g:CreateTexture(nil, "ARTWORK"); t:SetAllPoints(); t:Hide()
    if g.pmask and t.AddMaskTexture then t:AddMaskTexture(g.pmask) end
    -- (each wave grows from a quarter to one and a half times the icon and fades in and out; the three take turns every 1.5 s)
    local ag = t:CreateAnimationGroup(); ag:SetLooping("REPEAT")
    local sc = ag:CreateAnimation("Scale"); sc:SetScaleFrom(0.25, 0.25); sc:SetScaleTo(1.5, 1.5); sc:SetSmoothing("IN_OUT")
    local fin = ag:CreateAnimation("Alpha"); fin:SetFromAlpha(0); fin:SetToAlpha(1)
    local hold = ag:CreateAnimation("Alpha"); hold:SetFromAlpha(1); hold:SetToAlpha(1)
    local fout = ag:CreateAnimation("Alpha"); fout:SetFromAlpha(1); fout:SetToAlpha(0)
    local rest = ag:CreateAnimation("Alpha"); rest:SetFromAlpha(0); rest:SetToAlpha(0)
    t.ag, t.parts, t.delay = ag, { sc, fin, fout, rest, hold }, (i - 1) * 1.5
    g.waves[i] = t
  end
  return g
end
-- (sets the pandemic waves' timing for the speed setting: the same 4.5 s cycle as the game at normal speed)
local function timeWaves(g, sp)
  for _, t in ipairs(g.waves) do
    local sc, fin, fout, rest, hold = t.parts[1], t.parts[2], t.parts[3], t.parts[4], t.parts[5]
    local d = t.delay / sp
    sc:SetStartDelay(d); sc:SetDuration(2 / sp)
    fin:SetStartDelay(d); fin:SetDuration(0.5 / sp)
    hold:SetStartDelay(d + 0.5 / sp); hold:SetDuration(1 / sp)
    fout:SetStartDelay(d + 1.5 / sp); fout:SetDuration(0.5 / sp)
    rest:SetStartDelay(d + 2 / sp); rest:SetDuration((4.5 - t.delay - 2) / sp + 0.001)
  end
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
-- (the game's art in its own colours, or turned grey and tinted with yours)
local function tint(t, c)
  if t.SetDesaturated then t:SetDesaturated(c and true or false) end
  if c then t:SetVertexColor(c[1], c[2], c[3]) else t:SetVertexColor(1, 1, 1) end
end
local function quiet(g)
  g.ag:Stop(); g:SetScript("OnUpdate", nil)
  g.halo:Hide(); g.ring:Hide(); g.pborder:Hide(); for _, t in ipairs(g.edges) do t:Hide() end; for _, t in ipairs(g.bits) do t:Hide() end
  for _, t in ipairs({ g.burst, g.loop }) do t.ag:Stop(); t:Hide() end; g.loop.atlas = nil
  for _, t in ipairs(g.waves) do t.ag:Stop(); t:Hide() end
end
local function dress(g, id)
  local p = per(id)
  local r, gg, b, a = DB.r, DB.g, DB.b, DB.a or 1
  if p.color then r, gg, b = p.color[1], p.color[2], p.color[3] end
  local th, st = DB.thick or 3, p.style or DB.style
  local sp = DB.speed or 1
  quiet(g); g:SetAlpha(a)
  if GAME[st] and not hasArt(st) then st = "pulse" end
  g.drawn = st
  if GAME[st] then
    -- (the game's colours unless you've turned that off, or this spell has a colour of its own)
    local c = (p.color or not DB.gameColors) and { r, gg, b } or nil
    g.tinted = c
    local w = g.size or 40
    if st == "proc" or st == "onebutton" then
      local art = ART[st]
      g.burst:ClearAllPoints(); g.burst:SetPoint("CENTER"); g.burst:SetSize(w * (st == "proc" and 150 / 45 or 1.5), w * (st == "proc" and 150 / 45 or 1.5))
      g.loop:ClearAllPoints(); g.loop:SetPoint("CENTER"); g.loop:SetSize(w * (st == "proc" and 1.4 or 1.5), w * (st == "proc" and 1.4 or 1.5))
      tint(g.burst, c); tint(g.loop, c)
      g.loop.atlas = art[2]
      playFlip(g.burst, art[1], 6, 5, 30, 0.7 / sp, true)
    elseif st == "assist" then
      g.loop:ClearAllPoints(); g.loop:SetPoint("CENTER"); g.loop:SetSize(w * 66 / 45, w * 66 / 45); tint(g.loop, c)
      playFlip(g.loop, ART.assist[1], 6, 5, 30, 1 / sp)
    elseif st == "altglow" then
      local info = C_Texture.GetAtlasInfo(ART.altglow[1]) or {}
      local k = w / 45
      g.ring:SetAtlas(ART.altglow[1]); g.ring:ClearAllPoints(); g.ring:SetPoint("CENTER"); g.ring:SetSize((info.width or 64) * k, (info.height or 64) * k); tint(g.ring, c); g.ring:Show()
      g.fade:SetDuration(0.45 / sp); g.ag:Play()
    elseif st == "pandemic" then
      g.pborder:SetAtlas(ART.pandemic[1]); g.pborder:SetAllPoints(); tint(g.pborder, c); g.pborder:Show()
      if g.pmask then g.pmask:SetAtlas(ART.pandemic[5]); g.pmask:SetAllPoints() end
      timeWaves(g, sp)
      for i, t in ipairs(g.waves) do t:SetAtlas(ART.pandemic[i + 1]); tint(t, c); t:SetAlpha(0); t:Show(); t.ag:Play() end
    end
    return
  end
  g.tinted = { r, gg, b }
  if st == "pulse" then
    g.halo:ClearAllPoints(); g.halo:SetPoint("TOPLEFT", -th * 5, th * 5); g.halo:SetPoint("BOTTOMRIGHT", th * 5, -th * 5); g.halo:SetVertexColor(r, gg, b, 1); g.halo:Show()
  end
  if st == "pulse" or st == "border" then
    local e = g.edges
    e[1]:ClearAllPoints(); e[1]:SetPoint("TOPLEFT"); e[1]:SetPoint("TOPRIGHT"); e[1]:SetHeight(th)
    e[2]:ClearAllPoints(); e[2]:SetPoint("BOTTOMLEFT"); e[2]:SetPoint("BOTTOMRIGHT"); e[2]:SetHeight(th)
    e[3]:ClearAllPoints(); e[3]:SetPoint("TOPLEFT"); e[3]:SetPoint("BOTTOMLEFT"); e[3]:SetWidth(th)
    e[4]:ClearAllPoints(); e[4]:SetPoint("TOPRIGHT"); e[4]:SetPoint("BOTTOMRIGHT"); e[4]:SetWidth(th)
    for _, t in ipairs(e) do t:SetVertexColor(r, gg, b, 1); t:Show() end
  end
  if st == "pulse" then g.fade:SetDuration(0.45 / sp); g.ag:Play() end
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
  quiet(g); g:Hide(); g:ClearAllPoints()
  if g.onFloat and float then local busy = false; for _, o in pairs(glows) do if o.onFloat then busy = true end end; for _, f in pairs(timers) do if f.onFloat then busy = true end end; if not busy then float:Hide() end end; g.onFloat = nil
  pool[#pool + 1] = g
end
-- ---- the countdown on the icon: NSRT's own timer (its reminder ends at info.expires), counting down on the spell ----
-- (so it reaches 0 together with NSRT's bar; its length is your NSRT reminder duration)
local function floatBusy() for _, g in pairs(glows) do if g.onFloat then return true end end; for _, f in pairs(timers) do if f.onFloat then return true end end end
local function stopTimer(id)
  local f = timers[id]; if not f then return end
  timers[id] = nil; f:SetScript("OnUpdate", nil); f:Hide(); f:ClearAllPoints(); tpool[#tpool + 1] = f
  if f.onFloat and float and not floatBusy() then float:Hide() end; f.onFloat = nil
end
local function tick(f)
  local left = f.expires - GetTime()
  if left <= 0 then stopTimer(f.id); return end
  f.text:SetText((DB.timerTenths and left < 3) and string.format("%.1f", left) or tostring(math.ceil(left)))
end
local TIMER_COLORS = { white = { 1, 1, 1 }, gold = { 1, 0.82, 0 }, red = { 1, 0.25, 0.2 } }
-- (the number's font, colour and place, from the settings)
function timerLook(f, id)
  f.text:SetFont(STANDARD_TEXT_FONT, DB.timerSize or 22, "THICKOUTLINE")
  local c = TIMER_COLORS[DB.timerColor] or per(id).color or { DB.r, DB.g, DB.b }
  f.text:SetTextColor(c[1], c[2], c[3], 1)
  f.text:ClearAllPoints()
  if DB.timerPos == "top" then f.text:SetPoint("BOTTOM", f, "TOP", 0, 2)
  elseif DB.timerPos == "bottom" then f.text:SetPoint("TOP", f, "BOTTOM", 0, -2)
  else f.text:SetPoint("CENTER", f, "CENTER", 0, 0) end
end
local function showTimer(id, expires, label)
  if not DB.timer then return end
  local it = cdmItemFor(id)
  if not it then
    if not DB.fallback then return end
    placeFloat(); float.tex:SetTexture(spellIcon(id)); float.txt:SetText(label or spellName(id) or ""); float:Show(); it = float
  end
  stopTimer(id)
  local f = table.remove(tpool)
  if not f then f = CreateFrame("Frame", nil, UIParent); f:SetFrameStrata("HIGH"); f.text = f:CreateFontString(nil, "OVERLAY") end
  f:SetAllPoints(it); f:SetFrameLevel((it.GetFrameLevel and it:GetFrameLevel() or 1) + 20)
  timerLook(f, id)
  f.id, f.expires, f.onFloat = id, expires, it == float
  timers[id] = f; f:SetScript("OnUpdate", tick); f:Show(); tick(f)
end

-- (the boss is over or NSRT hid its reminders: every glow stops, and glows, sounds and countdowns still waiting are called off)
local round = 0
local function stopAll() round = round + 1; for id in pairs(glows) do stop(id) end; for id in pairs(timers) do stopTimer(id) end; wipe(waiting) end
-- (glows the icon for this spell: on the Cooldown Manager, or on the big icon of its own when it isn't there)
-- (puts a glow on an icon, sized to it, in the spell's look)
function place(g, it, id)
  local pad = DB.pad or 2
  g:SetScale(DB.scale or 1)
  local w = it.GetWidth and it:GetWidth() or 0; g.size = (w and w > 0) and w or 40
  g:ClearAllPoints(); g:SetPoint("TOPLEFT", it, "TOPLEFT", -pad, pad); g:SetPoint("BOTTOMRIGHT", it, "BOTTOMRIGHT", pad, -pad)
  g:SetFrameLevel((it.GetFrameLevel and it:GetFrameLevel() or 1) + 10); g:Show(); dress(g, id)
end
local function start(id, hold, label)
  local it = cdmItemFor(id)
  if not it and not DB.fallback then return false end
  stop(id)
  local g = newGlow()
  if not it then placeFloat(); float.tex:SetTexture(spellIcon(id)); float.txt:SetText(label or spellName(id) or ""); float:Show(); it = float; g.onFloat = true end
  place(g, it, id)
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
  local lead, my = math.max(0, DB.lead or 0), {}
  local at = math.max(0, wait - lead)
  -- (still on: not called off by the end of the fight, and not pressed early)
  waiting[id] = my
  local function live() return waiting[id] == my end
  if wait > 0.05 then showTimer(id, GetTime() + wait, label) end
  if wordsFor(id, label) and (DB.countdown or 0) > 0 then
    -- (counts to the press moment like the number on the icon; with "start early", numbers after the glow starts are left out)
    for i = DB.countdown, 1, -1 do local t = wait - i; if t >= 0 and t < at - 0.05 then C_Timer.After(t, function() if DB.enabled and live() then speak(tostring(i)) end end) end end
  end
  local function go() if live() then waiting[id] = nil; fire(id, label) end end
  if at > 0.05 then C_Timer.After(at, go) else go() end
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
-- (pressing the spell ends its glow; pressed during NSRT's countdown, the countdown and the glow still to come are called off too)
local function onCast(id)
  if not DB or DB.stopOnPress == false or not id or secret(id) then return end
  local n = spellName(id)
  local function same(x) return x == id or (n and spellName(x) == n) end
  for x in pairs(glows) do if same(x) then stop(x) end end
  for x in pairs(waiting) do if same(x) then waiting[x] = nil; stopTimer(x) end end
end

-- ---- test: every Cooldown Manager icon glows for 3 s with the sound and voice, so you can see your settings without a raid ----
function DebriefGlow_Test(quiet)
  local n = 0
  for _, e in ipairs(cdmItems()) do if spellOn(e.ids[1]) and start(e.ids[1], 3) then n = n + 1; showTimer(e.ids[1], GetTime() + 3) end end
  if n == 0 and DB.fallback then start(31821, 3, "Test"); n = 1 end
  playSound(); if DB.tts and not quiet then speak(ttsFor(31821, "Test")) end
  if not quiet then
    if not NSAPI then say("NSRT isn't loaded. The glows follow NSRT's reminders, so turn NSRT on too.") end
    if #cdmItems() == 0 then say("no Cooldown Manager icons found. Turn on Blizzard's Cooldown Manager (Options > Gameplay Enhancements) and add your cooldowns to it.")
    else say("your Cooldown Manager icons glow for 3 s. In a raid only your own NSRT spells glow, when it's time to press them.") end
  end
end

-- ---- the settings window: the website's look (the same colours, Barlow type and rounded panels as debriefme.io and Debrief) ----
-- (/dglow opens it; WoW's Esc > Options > AddOns > Debrief Glow has a button for it too)
local function color(r, g, b) return { r, g, b } end
local COLORS = { { "gold", "Gold", color(0.90, 0.71, 0.31) }, { "white", "White", color(1, 1, 1) }, { "red", "Red", color(1, 0.25, 0.2) }, { "green", "Green", color(0.3, 0.95, 0.4) },
  { "blue", "Blue", color(0.3, 0.6, 1) }, { "purple", "Purple", color(0.75, 0.4, 1) }, { "cyan", "Cyan", color(0.2, 0.95, 0.95) }, { "pink", "Pink", color(1, 0.45, 0.8) } }
local function preview() if pv and pv.restyle then pv.restyle() end; if DB.enabled then DebriefGlow_Test(true) end end
function DebriefGlow_SetColor(name)
  for _, c in ipairs(COLORS) do if c[1] == name then DB.r, DB.g, DB.b = c[3][1], c[3][2], c[3][3]; DB.colorName = name end end
  preview()
end

local COL = { bg = "171a22", raised = "1e222c", line = "2a2f3b", line2 = "353b49", text = "ece8df", muted = "98a0ad", faint = "6c7381", soft = "d6d1c6", gold = "e6b450", ink = "1b1406" }
local DEEP, PANEL = "0f1117", "171a22"
local function rgb(hex) return tonumber(hex:sub(1, 2), 16) / 255, tonumber(hex:sub(3, 4), 16) / 255, tonumber(hex:sub(5, 6), 16) / 255 end
local MEDIA = "Interface\\AddOns\\" .. (ADDON or "DebriefGlow") .. "\\"
local SLICE = MEDIA .. "Media\\"
local FONT = { body = MEDIA .. "Fonts\\Barlow-Medium.ttf", bold = MEDIA .. "Fonts\\Barlow-SemiBold.ttf", head = MEDIA .. "Fonts\\BarlowSemiCondensed-Bold.ttf" }
local function setFont(fs, kind, size) local ok = fs:SetFont(FONT[kind] or FONT.body, size, ""); if ok == false then fs:SetFont(STANDARD_TEXT_FONT, size, "") end end
local function fill(tex, hex, a) tex:SetColorTexture(rgb(hex)); tex:SetAlpha(a or 1) end
-- (rounded shapes: a white rounded box and its 1px outline, sliced so the corners keep their size, then coloured per use)
local function rounded(tex, kind, r, hex, a)
  if tex.SetTextureSliceMargins then
    tex:SetTexture(SLICE .. "round" .. r .. "_" .. kind)
    tex:SetTextureSliceMargins(r + 1, r + 1, r + 1, r + 1)
    if tex.SetTextureSliceMode and Enum and Enum.UITextureSliceMode then tex:SetTextureSliceMode(Enum.UITextureSliceMode.Stretched) end
  elseif kind == "line" then tex:SetColorTexture(0, 0, 0, 0)
  else tex:SetColorTexture(1, 1, 1, 1) end
  tex:SetVertexColor(rgb(hex)); tex:SetAlpha(a or 1)
end
local function skin(f, r, fillHex, fillA, lineHex, lineA, shadow)
  f.fillT = f.fillT or f:CreateTexture(nil, "BACKGROUND", nil, -6); f.fillT:SetAllPoints(); rounded(f.fillT, "fill", r, fillHex, fillA)
  f.lineT = f.lineT or f:CreateTexture(nil, "BORDER", nil, -6); f.lineT:SetAllPoints(); rounded(f.lineT, "line", r, lineHex, lineA)
  if shadow and not f.shT then
    f.shT = f:CreateTexture(nil, "BACKGROUND", nil, -8); f.shT:SetPoint("TOPLEFT", -14, 12); f.shT:SetPoint("BOTTOMRIGHT", 14, -16)
    f.shT:SetTexture(SLICE .. "shadow"); if f.shT.SetTextureSliceMargins then f.shT:SetTextureSliceMargins(24, 24, 24, 24) end; f.shT:SetAlpha(0.6)
  end
end
local function txt(parent, kind, size, hex) local f = parent:CreateFontString(nil, "OVERLAY"); setFont(f, kind, size); f:SetTextColor(rgb(hex or COL.text)); return f end
local function tip(f, text) f:SetScript("OnEnter", function() GameTooltip:SetOwner(f, "ANCHOR_TOP"); GameTooltip:SetText(text, 1, 1, 1, 1, true); GameTooltip:Show() end); f:SetScript("OnLeave", function() GameTooltip:Hide() end) end
-- (a button: gold for the main action, dark with a thin outline for the rest)
local function button(parent, label, w, primary, h)
  local b = CreateFrame("Button", nil, parent); b:SetSize(w, h or 28)
  skin(b, 5, primary and COL.gold or COL.raised, 1, primary and COL.gold or COL.line2, 1)
  b.t = txt(b, "bold", 13, primary and COL.ink or COL.text); b.t:SetPoint("CENTER", 0, 0); b.t:SetText(label)
  b:SetScript("OnEnter", function() if not primary then rounded(b.lineT, "line", 5, COL.faint, 1) end end)
  b:SetScript("OnLeave", function() if not primary then rounded(b.lineT, "line", 5, COL.line2, 1) end end)
  return b
end
-- (a small down arrow drawn with two short bars, so no art is needed)
local function chevron(b)
  for i, rot in ipairs({ 0.785, -0.785 }) do
    local t = b:CreateTexture(nil, "OVERLAY"); t:SetSize(7, 1.6); fill(t, COL.muted); t:SetPoint("RIGHT", b, "RIGHT", i == 1 and -15 or -10.5, 0); t:SetRotation(rot)
  end
end

-- ---- a drop-down list in the website's look (options: { value, label, colour }) ----
local menuF
local function openMenu(owner, options, get, set)
  if not menuF then
    menuF = CreateFrame("Frame", "DebriefGlowMenu", UIParent); menuF:SetFrameStrata("FULLSCREEN_DIALOG"); menuF:SetClampedToScreen(true); menuF:Hide()
    skin(menuF, 8, DEEP, 0.99, COL.line2, 1, true); menuF:EnableMouse(true)
    menuF.scroll = CreateFrame("ScrollFrame", nil, menuF); menuF.scroll:SetPoint("TOPLEFT", 4, -4); menuF.scroll:SetPoint("BOTTOMRIGHT", -4, 4)
    menuF.list = CreateFrame("Frame", nil, menuF.scroll); menuF.scroll:SetScrollChild(menuF.list)
    menuF.scroll:EnableMouseWheel(true)
    menuF.scroll:SetScript("OnMouseWheel", function(self, d) local m = self:GetVerticalScrollRange() or 0; self:SetVerticalScroll(math.max(0, math.min(m, self:GetVerticalScroll() - d * 52))) end)
    menuF.items = {}
    tinsert(UISpecialFrames, "DebriefGlowMenu")
    -- (a click anywhere else closes it)
    menuF:RegisterEvent("GLOBAL_MOUSE_DOWN")
    menuF:SetScript("OnEvent", function(self) if self:IsShown() and not self:IsMouseOver() and not (self.owner and self.owner:IsMouseOver()) then self:Hide() end end)
  end
  if menuF:IsShown() and menuF.owner == owner then menuF:Hide(); return end
  local opts, cur, IH = options(), get(), 26
  local W = math.max(owner:GetWidth() or 0, 190)
  for i, o in ipairs(opts) do
    local b = menuF.items[i]
    if not b then
      b = CreateFrame("Button", nil, menuF.list); b:SetHeight(IH)
      b.hl = b:CreateTexture(nil, "BACKGROUND"); b.hl:SetAllPoints(); rounded(b.hl, "fill", 5, COL.raised, 0)
      b.dot = b:CreateTexture(nil, "ARTWORK"); b.dot:SetSize(10, 10); b.dot:SetPoint("LEFT", 10, 0); b.dot:SetTexture(SLICE .. "dot")
      b.t = txt(b, "body", 13.5); b.t:SetJustifyH("LEFT"); b.t:SetWordWrap(false)
      b:SetScript("OnEnter", function(self) self.hl:SetAlpha(1) end); b:SetScript("OnLeave", function(self) self.hl:SetAlpha(self.on and 0.6 or 0) end)
      menuF.items[i] = b
    end
    b:ClearAllPoints(); b:SetPoint("TOPLEFT", 0, -(i - 1) * IH); b:SetWidth(W - 8)
    b.on = o[1] == cur; b.hl:SetAlpha(b.on and 0.6 or 0)
    b.t:ClearAllPoints(); b.t:SetPoint("LEFT", o[3] and 28 or 10, 0); b.t:SetPoint("RIGHT", -8, 0); b.t:SetText(o[2]); b.t:SetTextColor(rgb(b.on and COL.gold or COL.text))
    b.dot:SetShown(o[3] ~= nil); if o[3] then b.dot:SetVertexColor(o[3][1], o[3][2], o[3][3]) end
    b:SetScript("OnClick", function() menuF:Hide(); set(o[1]) end)
    b:Show()
  end
  for i = #opts + 1, #menuF.items do menuF.items[i]:Hide() end
  menuF.list:SetSize(W - 8, math.max(1, #opts * IH))
  menuF:SetSize(W, math.min(#opts, 12) * IH + 8)
  menuF:ClearAllPoints(); menuF:SetPoint("TOPLEFT", owner, "BOTTOMLEFT", 0, -4)
  menuF.owner = owner; menuF.scroll:SetVerticalScroll(0); menuF:Show()
end
-- (the box that opens it: the chosen value, its colour dot if it has one, and the arrow)
local function picker(parent, w, options, get, set)
  local b = button(parent, "", w, false, 28)
  b.t:ClearAllPoints(); b.t:SetPoint("LEFT", 10, 0); b.t:SetPoint("RIGHT", -24, 0); b.t:SetJustifyH("LEFT"); b.t:SetWordWrap(false); setFont(b.t, "body", 13)
  b.sw = b:CreateTexture(nil, "ARTWORK"); b.sw:SetSize(10, 10); b.sw:SetPoint("LEFT", 10, 0); b.sw:SetTexture(SLICE .. "dot")
  chevron(b)
  b.options, b.get, b.set = options, get, set
  b.Refresh = function(self)
    local cur, label, col = get(), "", nil
    for _, o in ipairs(options()) do if o[1] == cur then label, col = o[2], o[3] end end
    self.t:SetText(label); self.sw:SetShown(col ~= nil); if col then self.sw:SetVertexColor(col[1], col[2], col[3]) end
    self.t:ClearAllPoints(); self.t:SetPoint("LEFT", col and 26 or 10, 0); self.t:SetPoint("RIGHT", -24, 0)
  end
  b.choose = function(v) set(v); b:Refresh() end
  b:SetScript("OnClick", function(self) openMenu(self, options, get, self.choose) end)
  b:Refresh()
  return b
end
-- (the slim on/off switch)
local function switch(parent, get, set)
  local b = CreateFrame("Button", nil, parent); b:SetSize(40, 22)
  b.tr = b:CreateTexture(nil, "ARTWORK"); b.tr:SetAllPoints()
  b.trL = b:CreateTexture(nil, "OVERLAY"); b.trL:SetAllPoints()
  b.k = b:CreateTexture(nil, "OVERLAY", nil, 2); b.k:SetSize(16, 16); b.k:SetTexture(SLICE .. "dot")
  b.Refresh = function(self)
    local on = get() and true or false
    rounded(self.tr, "fill", 8, on and COL.gold or COL.raised, 1); rounded(self.trL, "line", 8, on and COL.gold or COL.line2, 1)
    self.k:ClearAllPoints(); self.k:SetPoint("CENTER", self, on and "RIGHT" or "LEFT", on and -11 or 11, 0); self.k:SetVertexColor(rgb(on and COL.ink or COL.muted))
  end
  b.GetChecked = function() return get() and true or false end
  b:SetScript("OnClick", function(self) set(not get()); self:Refresh() end)
  b:Refresh()
  return b
end
-- (a text box)
local function inputBox(parent, w, h)
  local bg = CreateFrame("Frame", nil, parent); bg:SetSize(w, h or 28); skin(bg, 5, DEEP, 1, COL.line2, 1)
  local e = CreateFrame("EditBox", nil, bg); e:SetPoint("TOPLEFT", 8, -2); e:SetPoint("BOTTOMRIGHT", -8, 2); e:SetAutoFocus(false)
  setFont(e, "body", 13); e:SetTextColor(rgb(COL.text))
  e.hint = txt(bg, "body", 13, COL.faint); e.hint:SetPoint("LEFT", 9, 0)
  e:SetScript("OnEditFocusGained", function(self) rounded(bg.lineT, "line", 5, COL.gold, 0.9); self.hint:Hide() end)
  e:HookScript("OnEditFocusLost", function(self) rounded(bg.lineT, "line", 5, COL.line2, 1); self.hint:SetShown(self:GetText() == "") end)
  e:SetScript("OnEscapePressed", function(self) self:ClearFocus() end)
  e.bg = bg
  return e
end


-- ---- the preview beside the window: a few of your icons; the middle one counts down like NSRT, then glows, on a loop ----
-- (it uses the same drawing as the real thing, so every setting shows as you click; on Your spells it shows that spell's own look)
pv = { spell = nil, t = 0 }
do
  local W, H, IS = 280, 262, 44
  local LOOP_COUNT, LOOP_GLOW, LOOP_REST = 5, 3, 1.2
  local frame, cap, who, sub, icons, numF, glowG
  local function dueId() if pv.spell then return pv.spell end; local e = cdmItems()[1]; return e and e.ids[1] or 31821 end
  local function sideIds(due)
    local out = {}
    for _, e in ipairs(cdmItems()) do if e.ids[1] ~= due and #out < 2 then out[#out + 1] = e.ids[1] end end
    for _, x in ipairs({ 31884, 375576 }) do if #out < 2 and x ~= due then out[#out + 1] = x end end
    return out
  end
  local function stopGlow() if glowG then quiet(glowG); glowG:Hide(); glowG:ClearAllPoints(); glowG:SetParent(UIParent); pool[#pool + 1] = glowG; glowG = nil end end
  local function startGlow()
    stopGlow()
    glowG = newGlow(); glowG:SetParent(frame); glowG:SetFrameStrata(frame:GetFrameStrata())
    place(glowG, icons[2], pv.spell or 0)
  end
  -- (who the preview is: the main settings, or one spell's own)
  local function label()
    local id = dueId()
    icons[1].tex:SetTexture(spellIcon(sideIds(id)[1])); icons[3].tex:SetTexture(spellIcon(sideIds(id)[2])); icons[2].tex:SetTexture(spellIcon(id))
    who:SetText(spellName(id) or "Your cooldown")
    sub:SetText(pv.spell and "Its own settings (Your spells)" or "Your main settings")
  end
  function pv.restyle()
    if not frame then return end
    label(); timerLook(numF, pv.spell or 0)
    if glowG then place(glowG, icons[2], pv.spell or 0) end
  end
  local function step(_, el)
    pv.t = pv.t + el
    local t, lead = pv.t, math.min(LOOP_COUNT, math.max(0, DB.lead or 0))
    local on = DB.enabled and spellOn(pv.spell or 0)
    local glowAt, glowEnd = LOOP_COUNT - lead, LOOP_COUNT + math.min(DB.hold or 8, LOOP_GLOW)
    if t >= glowEnd + LOOP_REST then pv.t = 0; t = 0; stopGlow() end
    -- (the number: NSRT's countdown, until 0)
    local left = LOOP_COUNT - t
    if on and DB.timer and left > 0 then numF.text:SetText((DB.timerTenths and left < 3) and string.format("%.1f", left) or tostring(math.ceil(left))); numF:Show() else numF:Hide() end
    -- (the glow, from 0 (or earlier with Start early) for the hold, up to 3 s here)
    if on and t >= glowAt and t < glowEnd then if not glowG then startGlow() end elseif glowG then stopGlow() end
    if not on then cap:SetText(DB.enabled and "Turned off for this spell" or "The glow is off"); cap:SetTextColor(rgb(COL.faint))
    elseif left > 0 then cap:SetText("NSRT: " .. (spellName(dueId()) or "your cooldown") .. " in " .. math.ceil(left)); cap:SetTextColor(rgb(COL.muted))
    elseif t < glowEnd then cap:SetText("Press it now"); cap:SetTextColor(rgb(COL.gold))
    else cap:SetText(" ") end
  end
  function pv.build(opt)
    frame = CreateFrame("Frame", "DebriefGlowPreview", opt); frame:SetSize(W, H); frame:SetFrameStrata("HIGH")
    skin(frame, 8, DEEP, 0.98, COL.line2, 1, true)
    local lb = txt(frame, "bold", 12.5, COL.gold); lb:SetPoint("BOTTOMLEFT", frame, "TOPLEFT", 2, 7); lb:SetText("PREVIEW  ·  changes as you click")
    who = txt(frame, "head", 17); who:SetPoint("TOPLEFT", 16, -14); who:SetWidth(W - 32); who:SetJustifyH("LEFT"); who:SetWordWrap(false)
    sub = txt(frame, "body", 12.5, COL.faint); sub:SetPoint("TOPLEFT", 16, -36)
    -- (three icons like a Cooldown Manager row, with room around them for the bigger glows)
    icons = {}
    for i = 1, 3 do
      local f = CreateFrame("Frame", nil, frame); f:SetSize(IS, IS); f:SetPoint("CENTER", frame, "TOP", (i - 2) * (IS + 6), -128)
      f.tex = f:CreateTexture(nil, "ARTWORK"); f.tex:SetAllPoints(); f.tex:SetTexCoord(0.08, 0.92, 0.08, 0.92)
      f._label = "preview"
      icons[i] = f
    end
    numF = CreateFrame("Frame", nil, icons[2]); numF:SetAllPoints(icons[2]); numF:SetFrameLevel(icons[2]:GetFrameLevel() + 30); numF.text = numF:CreateFontString(nil, "OVERLAY")
    cap = txt(frame, "bold", 13.5, COL.muted); cap:SetPoint("BOTTOM", 0, 40)
    local foot = txt(frame, "body", 12, COL.faint); foot:SetPoint("BOTTOM", 0, 16); foot:SetText("Plays again every few seconds")
    frame:SetScript("OnUpdate", step)
    frame:SetScript("OnHide", function() stopGlow() end)
    frame:SetScript("OnShow", function() pv.t = 0; pv.restyle() end)
    pv.frame, frame.cap, frame.num, frame.who = frame, cap, numF, who
  end
  -- (to the right of the window, or the left when the screen has no room there)
  function pv.place(opt)
    if not frame then return end
    frame:ClearAllPoints()
    local right, room = opt:GetRight(), UIParent and UIParent:GetRight()
    if right and room and right + W + 24 > room then frame:SetPoint("TOPRIGHT", opt, "TOPLEFT", -16, -26) else frame:SetPoint("TOPLEFT", opt, "TOPRIGHT", 16, -26) end
    frame:Show(); pv.restyle()
  end
end

-- ---- the spells this player uses: from the NSRT note, the Cooldown Manager, reminders already had, and spells added by hand ----
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
  for id in pairs(noteSpells()) do add(id, "In your NSRT note") end
  for id in pairs(DB.seen) do add(id, "In your NSRT note") end
  for _, e in ipairs(cdmItems()) do add(e.ids[1], "On your Cooldown Manager") end
  for id in pairs(DB.spells) do add(id, "Added by you") end
  for id, where in pairs(src) do list[#list + 1] = { id = id, name = spellName(id), where = where } end
  table.sort(list, function(x, y) return x.name < y.name end)
  return list
end
local function pvFocus(id) pv.spell = id; pv.t = 0; pv.restyle() end
local function testSpell(id)
  pvFocus(id); start(id, 3); showTimer(id, GetTime() + 3); playSound(soundFor(id)); local w = wordsFor(id); if w then speak(w) end
end
local function soundList(first)
  local o = { first or { "none", "No sound" } }
  for _, s in ipairs(SOUNDS) do if s[1] ~= "none" then o[#o + 1] = { s[1], s[2] } end end
  local L = lsm(); if L and L.List then for _, n in ipairs(L:List("sound") or {}) do if n ~= "None" then o[#o + 1] = { "lsm:" .. n, n } end end end
  return o
end
local function styleList(first)
  local o = first and { first } or {}
  for _, s in ipairs(STYLES) do o[#o + 1] = { s[1], (s[2]:gsub(" %(.*", "")) } end
  return o
end

-- ---- the window ----
local OW, OH = 920, 740
local opt, refreshers, showPage = nil, {}, nil
local function refreshAll() for _, f in ipairs(refreshers) do f() end end
local spellsPage -- (filled in below: the Your spells list)
local function buildOptions()
  opt = CreateFrame("Frame", "DebriefGlowOptions", UIParent)
  opt:SetSize(OW, OH); opt:SetPoint("CENTER", -150, 0); opt:SetFrameStrata("HIGH"); opt:SetToplevel(true); opt:SetClampedToScreen(true); opt:Hide()
  skin(opt, 8, DEEP, 0.98, COL.line2, 1, true)
  opt:SetMovable(true); opt:EnableMouse(true); opt:RegisterForDrag("LeftButton")
  opt:SetScript("OnDragStart", opt.StartMoving); opt:SetScript("OnDragStop", opt.StopMovingOrSizing)
  tinsert(UISpecialFrames, "DebriefGlowOptions")
  -- (the header bar, like the website's top bar, with a soft gold glow from the logo side)
  local hb = opt:CreateTexture(nil, "BACKGROUND", nil, -5); hb:SetPoint("TOPLEFT", 1, -1); hb:SetPoint("TOPRIGHT", -1, -1); hb:SetHeight(55); fill(hb, PANEL, 1)
  if hb.SetGradient and CreateColor then hb:SetColorTexture(1, 1, 1, 1); hb:SetGradient("HORIZONTAL", CreateColor(0.15, 0.13, 0.09, 1), CreateColor(0.09, 0.10, 0.13, 1)) end
  local hl = opt:CreateTexture(nil, "ARTWORK"); hl:SetPoint("TOPLEFT", 1, -56); hl:SetPoint("TOPRIGHT", -1, -56); hl:SetHeight(1); fill(hl, COL.line)
  local lg = opt:CreateTexture(nil, "ARTWORK"); lg:SetSize(30, 30); lg:SetPoint("TOPLEFT", 20, -13); lg:SetTexture(SLICE .. "logo")
  local tt = txt(opt, "head", 21); tt:SetPoint("TOPLEFT", 54, -12); tt:SetText("Debrief Glow")
  local ts = txt(opt, "body", 12.5, COL.muted); ts:SetPoint("TOPLEFT", 54, -34); ts:SetText("Your NSRT cooldowns, glowing on time")
  local clb = CreateFrame("Button", nil, opt); clb:SetSize(34, 34); clb:SetPoint("TOPRIGHT", -14, -11); skin(clb, 8, DEEP, 1, COL.line2, 1)
  clb.t = txt(clb, "bold", 17, COL.muted); clb.t:SetPoint("CENTER", 0, 1); clb.t:SetText("×")
  clb:SetScript("OnClick", function() opt:Hide() end)
  clb:SetScript("OnEnter", function() clb.t:SetTextColor(rgb(COL.text)); rounded(clb.lineT, "line", 8, COL.gold, 1) end)
  clb:SetScript("OnLeave", function() clb.t:SetTextColor(rgb(COL.muted)); rounded(clb.lineT, "line", 8, COL.line2, 1) end)
  local ver = txt(opt, "body", 12, COL.faint); ver:SetPoint("RIGHT", clb, "LEFT", -14, 0)
  ver:SetText("Saves as you go  ·  /dglow opens this  ·  Version " .. ((C_AddOns and C_AddOns.GetAddOnMetadata and C_AddOns.GetAddOnMetadata(ADDON, "Version")) or ""))
  local bigT = txt(opt, "head", 30); bigT:SetPoint("TOPLEFT", 24, -70); bigT:SetText("Settings")
  local pNote = txt(opt, "body", 14, COL.muted); pNote:SetPoint("BOTTOMLEFT", bigT, "BOTTOMRIGHT", 14, 4); pNote:SetWidth(OW - 220); pNote:SetJustifyH("LEFT"); pNote:SetWordWrap(false)
  -- (underline tabs, like the website's Boss guides bar)
  local MENU = { { "glow", "When it glows" }, { "look", "Look" }, { "count", "Countdown" }, { "sound", "Sound and voice" }, { "spells", "Your spells" }, { "help", "Help" } }
  local NOTES = { glow = "When the glow starts and stops.", look = "Pick a style and colour. Your Cooldown Manager shows each change.", count = "NSRT's countdown, as a number on the spell.",
    sound = "Off unless you turn it on. NSRT can speak too: use one of them.", spells = "Click a spell to see it in the preview. Give it its own look, sound or words.", help = "How it works, and the commands." }
  local TAB_Y, PAGE_TOP = 114, 164
  local tline = opt:CreateTexture(nil, "ARTWORK"); tline:SetPoint("TOPLEFT", 24, -(TAB_Y + 34)); tline:SetPoint("TOPRIGHT", -24, -(TAB_Y + 34)); tline:SetHeight(1); fill(tline, COL.line)
  local pages, tabs, cur = {}, {}, "glow"
  showPage = function(k)
    cur = k
    for kk, p in pairs(pages) do p:SetShown(kk == k) end
    for kk, b in pairs(tabs) do local on = kk == k; b.t:SetTextColor(rgb(on and COL.text or COL.muted)); b.u:SetShown(on) end
    pNote:SetText(NOTES[k] or "")
    if k == "spells" and spellsPage then spellsPage.fill() end
    if k ~= "spells" and pv.spell then pv.spell = nil; pv.t = 0; pv.restyle() end
  end
  local tx = 16
  for _, it in ipairs(MENU) do
    local key = it[1]
    local b = CreateFrame("Button", nil, opt); b:SetHeight(34); b:SetPoint("TOPLEFT", tx, -TAB_Y)
    b.t = txt(b, "bold", 14.5, COL.muted); b.t:SetPoint("CENTER", 0, 2); b.t:SetText(it[2])
    b:SetWidth(b.t:GetStringWidth() + 22); tx = tx + b:GetWidth()
    b.u = b:CreateTexture(nil, "OVERLAY"); b.u:SetPoint("BOTTOMLEFT", 8, 0); b.u:SetPoint("BOTTOMRIGHT", -8, 0); b.u:SetHeight(2); fill(b.u, COL.gold)
    b:SetScript("OnClick", function() showPage(key) end)
    b:SetScript("OnEnter", function() if cur ~= key then b.t:SetTextColor(rgb(COL.text)) end end)
    b:SetScript("OnLeave", function() if cur ~= key then b.t:SetTextColor(rgb(COL.muted)) end end)
    tabs[key] = b
    local p = CreateFrame("Frame", nil, opt); p:SetPoint("TOPLEFT", 0, -PAGE_TOP); p:SetSize(OW, OH - PAGE_TOP - 10); p:Hide()
    pages[key] = p
  end
  opt.pages, opt.tabs = pages, tabs

  -- (rows live inside rounded panels: a heading with a small grey note, then the rows with thin lines between, the control on the right)
  local PX, LX = 24, 42
  local P, y, panelY, firstRow
  local function page(k) P = pages[k]; y = 0; panelY = nil end
  local function panel(title, note)
    panelY = y; firstRow = true
    local h = txt(P, "head", 17); h:SetPoint("TOPLEFT", LX, -(y + 14)); h:SetText(title)
    if note then local n = txt(P, "body", 12.5, COL.faint); n:SetPoint("BOTTOMLEFT", h, "BOTTOMRIGHT", 10, 1); n:SetText(note) end
    y = y + 44
  end
  local function panelEnd()
    if not panelY then return end
    y = y + 6
    local f = P:CreateTexture(nil, "BACKGROUND"); f:SetPoint("TOPLEFT", PX, -panelY); f:SetSize(OW - PX * 2, y - panelY); rounded(f, "fill", 8, PANEL, 1)
    local l = P:CreateTexture(nil, "BORDER"); l:SetAllPoints(f); rounded(l, "line", 8, COL.line, 1)
    panelY = nil; y = y + 14
  end
  local function rowBase(label, sub)
    local h = sub and 50 or 44
    if not firstRow then local ln = P:CreateTexture(nil, "ARTWORK"); ln:SetPoint("TOPLEFT", LX, -y); ln:SetPoint("TOPRIGHT", -LX, -y); ln:SetHeight(1); fill(ln, COL.line, 0.7) end
    firstRow = false
    local t = txt(P, "bold", 15); t:SetPoint("TOPLEFT", LX, -(y + (sub and 9 or 14))); t:SetText(label)
    if sub then local s2 = txt(P, "body", 13, COL.faint); s2:SetPoint("TOPLEFT", LX, -(y + 28)); s2:SetWidth(540); s2:SetJustifyH("LEFT"); s2:SetWordWrap(false); s2:SetText(sub) end
    local cy = y + h / 2
    y = y + h
    return cy
  end
  local function right(f, cy) f:SetPoint("RIGHT", P, "TOPRIGHT", -LX, -cy) end
  local function switchRow(label, sub, key, after)
    local cy = rowBase(label, sub)
    local b = switch(P, function() return DB[key] end, function(v) DB[key] = v; if after then after() end end); right(b, cy)
    refreshers[#refreshers + 1] = function() b:Refresh() end
    opt[key] = b
  end
  -- (− value + stepper)
  local function stepRow(label, sub, key, lo, hi, step, fmt, after)
    local cy = rowBase(label, sub)
    local plus = button(P, "+", 30, false, 28); right(plus, cy)
    local val = txt(P, "head", 18); val:SetWidth(92); val:SetJustifyH("CENTER"); val:SetPoint("RIGHT", plus, "LEFT", -4, 0)
    local minus = button(P, "–", 30, false, 28); minus:SetPoint("RIGHT", val, "LEFT", -4, 0)
    local function show() val:SetText((fmt or tostring)(DB[key])) end
    local function go(d)
      local v = math.floor((math.max(lo, math.min(hi, (DB[key] or lo) + d))) / step + 0.5) * step
      if v ~= DB[key] then DB[key] = v; show(); if after then after() end end
    end
    minus:SetScript("OnClick", function() go(-step) end); plus:SetScript("OnClick", function() go(step) end)
    refreshers[#refreshers + 1] = show; show()
    opt[key] = { minus = minus, plus = plus, val = val }
  end
  local function pickRow(label, sub, key, w, options, after)
    local cy = rowBase(label, sub)
    local b = picker(P, w or 220, options, function() return DB[key] end, function(v) DB[key] = v; if after then after(v) end end); right(b, cy)
    refreshers[#refreshers + 1] = function() b:Refresh() end
    opt[key] = b
    return b
  end
  -- (a pill switcher, like the website's "Heroic | Mythic")
  local function segRow(label, sub, key, list, after)
    local cy = rowBase(label, sub)
    local box = CreateFrame("Frame", nil, P); box:SetHeight(32); skin(box, 15, DEEP, 1, COL.line2, 1)
    local btns, w = {}, 4
    for i, c in ipairs(list) do
      local b = CreateFrame("Button", nil, box); b:SetHeight(24)
      b.bg = b:CreateTexture(nil, "BACKGROUND"); b.bg:SetAllPoints()
      b.t = txt(b, "bold", 13); b.t:SetPoint("CENTER", 0, 0); b.t:SetText(c[2])
      b:SetWidth(b.t:GetStringWidth() + 26); b:SetPoint("LEFT", box, "LEFT", w, 0); w = w + b:GetWidth() + 2
      b:SetScript("OnClick", function() DB[key] = c[1]; refreshAll(); if after then after() end end)
      btns[i] = b
    end
    box:SetWidth(w + 2); right(box, cy)
    local function show() for i, b in ipairs(btns) do local on = DB[key] == list[i][1]; rounded(b.bg, "fill", 8, COL.gold, on and 1 or 0); b.t:SetTextColor(rgb(on and COL.ink or COL.muted)) end end
    refreshers[#refreshers + 1] = show; show()
    opt[key] = btns
  end
  local function buttons(list)
    local prev
    for i, b in ipairs(list) do
      local bt = button(P, b[1], b[3] or 170, i == 1, 30)
      if prev then bt:SetPoint("LEFT", prev, "RIGHT", 10, 0) else bt:SetPoint("TOPLEFT", PX, -y) end
      bt:SetScript("OnClick", b[2]); prev = bt
    end
    y = y + 44
  end
  local function note(text)
    local n = txt(P, "body", 13, COL.faint); n:SetPoint("TOPLEFT", PX + 2, -y); n:SetWidth(OW - PX * 2 - 4); n:SetJustifyH("LEFT"); n:SetText(text)
    y = y + n:GetStringHeight() + 12
  end
  local sec = function(v) return v == 0 and "On time" or (v .. " s early") end

  -- When it glows
  page("glow")
  panel("When it glows", "NSRT says when; Debrief Glow shows it")
  switchRow("Glow my NSRT cooldowns", "Your own NSRT reminders with a spell make that spell glow on the Cooldown Manager.", "enabled")
  stepRow("Start early", "Seconds before NSRT's countdown ends. On time glows at the moment to press.", "lead", 0, 5, 0.5, sec)
  stepRow("Keep glowing", "If you don't press it, the glow stops after this long.", "hold", 2, 20, 1, function(v) return v .. " s" end)
  switchRow("Stop when I press it", "The glow ends as soon as you cast the spell.", "stopOnPress")
  panelEnd()
  panel("Spells that aren't on your bar")
  switchRow("Show a big icon instead", "A spell that isn't on your Cooldown Manager gets a big icon of its own.", "fallback")
  stepRow("Big icon size", nil, "iconSize", 32, 128, 4, function(v) return v .. " px" end)
  panelEnd()
  buttons({ { "Test the glow", function() DebriefGlow_Test() end }, { "Place the big icon", function() SlashCmdList.DEBRIEFGLOW("move") end } })

  -- Look
  page("look")
  panel("Style and colour", "Each change shows on your Cooldown Manager")
  pickRow("Style", "The \"Game\" ones are the game's own glows.", "style", 300, function() return styleList() end, preview)
  do -- (colour dots, then Any colour for the colour picker)
    local cy = rowBase("Colour", "Eight ready colours, or any colour and how see-through it is.")
    local any = button(P, "Any colour", 104, false, 28); right(any, cy)
    any:SetScript("OnClick", function()
      if not (ColorPickerFrame and ColorPickerFrame.SetupColorPickerAndShow) then return end
      local r0, g0, b0, a0 = DB.r, DB.g, DB.b, DB.a
      ColorPickerFrame:SetupColorPickerAndShow({ r = DB.r, g = DB.g, b = DB.b, opacity = DB.a, hasOpacity = true,
        swatchFunc = function() DB.r, DB.g, DB.b = ColorPickerFrame:GetColorRGB(); DB.colorName = "custom"; refreshAll(); preview() end,
        opacityFunc = function() DB.a = ColorPickerFrame:GetColorAlpha(); refreshAll(); preview() end,
        cancelFunc = function() DB.r, DB.g, DB.b, DB.a = r0, g0, b0, a0; refreshAll() end })
    end)
    local dots, prev = {}, any
    for i = #COLORS, 1, -1 do
      local c = COLORS[i]
      local b = CreateFrame("Button", nil, P); b:SetSize(28, 28); b:SetPoint("RIGHT", prev, "LEFT", i == #COLORS and -14 or -6, 0); prev = b
      b.ring = b:CreateTexture(nil, "BACKGROUND"); b.ring:SetAllPoints(); b.ring:SetTexture(SLICE .. "dot")
      b.dot = b:CreateTexture(nil, "ARTWORK"); b.dot:SetSize(20, 20); b.dot:SetPoint("CENTER"); b.dot:SetTexture(SLICE .. "dot"); b.dot:SetVertexColor(c[3][1], c[3][2], c[3][3])
      b:SetScript("OnClick", function() DebriefGlow_SetColor(c[1]); refreshAll() end)
      tip(b, c[2])
      dots[i] = b
    end
    refreshers[#refreshers + 1] = function() for i, b in ipairs(dots) do local on = DB.colorName == COLORS[i][1]; b.ring:SetVertexColor(rgb(COL.text)); b.ring:SetAlpha(on and 1 or 0) end end
  end
  switchRow("Game styles keep the game's colours", "Off: the game's glows take your colour instead. A spell with its own colour always uses it.", "gameColors", preview)
  panelEnd()
  panel("Shape and speed")
  stepRow("Thickness", nil, "thick", 1, 8, 1, function(v) return v .. " px" end, preview)
  stepRow("Distance from the icon", nil, "pad", 0, 10, 1, function(v) return v .. " px" end, preview)
  stepRow("Size", nil, "scale", 0.5, 2, 0.05, function(v) return math.floor(v * 100 + 0.5) .. "%" end, preview)
  stepRow("Speed", "How fast it pulses, runs or spins.", "speed", 0.25, 3, 0.25, function(v) return v .. "x" end, preview)
  stepRow("Lines or sparkles", "For Pixel lines and Sparkles.", "lines", 1, 16, 1, nil, preview)
  stepRow("Opacity", nil, "a", 0.1, 1, 0.05, function(v) return math.floor(v * 100 + 0.5) .. "%" end, preview)
  panelEnd()

  -- Countdown
  page("count")
  panel("Countdown on the spell", "The same number as NSRT's bar")
  switchRow("Count down on the spell", "Starts with NSRT's countdown and reaches 0 with it. Its length is your NSRT reminder duration.", "timer", preview)
  stepRow("Number size", nil, "timerSize", 12, 48, 2, function(v) return v .. " px" end, preview)
  segRow("Number colour", nil, "timerColor", { { "white", "White" }, { "gold", "Gold" }, { "red", "Red" }, { "glow", "Glow colour" } }, preview)
  segRow("Where", nil, "timerPos", { { "middle", "On the icon" }, { "top", "Above" }, { "bottom", "Below" } }, preview)
  switchRow("Tenths in the last 3 seconds", "2.9, 2.8 ... instead of 3, 2, 1.", "timerTenths", preview)
  panelEnd()
  buttons({ { "Test it", function() DebriefGlow_Test() end } })

  -- Sound and voice
  page("sound")
  panel("Sound", "Plays when the glow starts")
  pickRow("Sound", nil, "sound", 260, function() return soundList() end, function() playSound() end)
  segRow("Sound channel", "Master plays even with game sounds turned down.", "channel", { { "Master", "Master" }, { "SFX", "Effects" }, { "Dialog", "Dialog" }, { "Ambience", "Ambience" } })
  panelEnd()
  panel("Voice", "Text to speech")
  switchRow("Say it out loud", "NSRT can speak its reminders too: turn one of them off so you don't hear it twice.", "tts")
  pickRow("Voice", nil, "ttsVoice", 260, function()
    local o = { { 0, "Default" } }
    for _, v in ipairs((C_VoiceChat and C_VoiceChat.GetTtsVoices and C_VoiceChat.GetTtsVoices()) or {}) do if v.voiceID ~= 0 then o[#o + 1] = { v.voiceID, v.name } end end
    return o end)
  pickRow("What it says", nil, "ttsText", 260, function() return { { "{spell}", "The spell's name" }, { "{spell} now", "\"Aura Mastery now\"" }, { "Press {spell}", "\"Press Aura Mastery\"" }, { "Cooldown", "\"Cooldown\"" }, { "Go", "\"Go\"" } } end)
  stepRow("Voice volume", nil, "ttsVolume", 0, 100, 5, function(v) return v .. "%" end)
  stepRow("Voice speed", nil, "ttsRate", -10, 10, 1, function(v) return v == 0 and "Normal" or (v > 0 and "+" .. v or tostring(v)) end)
  stepRow("Count down out loud", "Says 3, 2, 1 before the moment (with Say it out loud on).", "countdown", 0, 5, 1, function(v) return v == 0 and "Off" or (v .. " s") end)
  panelEnd()
  buttons({ { "Hear it", function() playSound(); if DB.tts then speak(ttsFor(31821, "Aura Mastery")) end end } })

  -- Help
  page("help")
  panel("How it works")
  note("When NSRT (Northern Sky Raid Tools) starts the countdown for one of YOUR note's spells, the same number counts down on that spell's icon on Blizzard's Cooldown Manager. At 0 the icon glows, until you press it or the time runs out. A sound and a voice can go with it.\n\nIt follows NSRT's own timing, so phases and times always match NSRT's pop-ups. Only your own reminders count.")
  panelEnd()
  panel("Commands")
  note("/dglow  opens this window\n/dglow test  every Cooldown Manager icon glows for 3 seconds\n/dglow spells  opens Your spells\n/dglow move  place the big icon\n/dglow on, /dglow off  turn it on or off")
  panelEnd()
  panel("Getting ready")
  note("Turn on Blizzard's Cooldown Manager (Esc > Options > Gameplay Enhancements) and put your cooldowns on it. Load your NSRT note as usual, then press NSRT's Test Active Reminder button to see it work.")
  panelEnd()

  spellsPage.build(pages.spells)
  pv.build(opt)
end

-- ---- Your spells: one row per spell (glow on/off, style, colour, sound, words, Test, and x to go back to the main settings) ----
spellsPage = {}
do
  local L, ROW_H = 24, 46
  local C = { icon = 12, name = 50, on = 200, style = 250, color = 428, sound = 550, words = 680, test = 788, reset = 842 }
  local list, scroll, content, bar, thumb, empty, addBox
  local rows = {}
  local function newRow()
    local r = CreateFrame("Frame", nil, content); r:SetSize(OW - L * 2 - 2, ROW_H)
    r.bg = r:CreateTexture(nil, "BACKGROUND"); r.bg:SetAllPoints(); fill(r.bg, COL.raised, 0.5)
    r.icon = r:CreateTexture(nil, "ARTWORK"); r.icon:SetSize(30, 30); r.icon:SetPoint("LEFT", C.icon, 0); r.icon:SetTexCoord(0.08, 0.92, 0.08, 0.92)
    r.name = txt(r, "bold", 14); r.name:SetPoint("TOPLEFT", C.name, -7); r.name:SetWidth(144); r.name:SetJustifyH("LEFT"); r.name:SetWordWrap(false)
    r.where = txt(r, "body", 11.5, COL.faint); r.where:SetPoint("TOPLEFT", r.name, "BOTTOMLEFT", 0, -2); r.where:SetWidth(144); r.where:SetJustifyH("LEFT")
    r.on = switch(r, function() return not per(r.id).off end, function(v) perSet(r.id, "off", (not v) or nil); r:Refresh(); pvFocus(r.id) end); r.on:SetPoint("LEFT", C.on, 0)
    r.style = picker(r, 172, function() return styleList({ "main", "Main style" }) end,
      function() return per(r.id).style or "main" end, function(v) perSet(r.id, "style", v ~= "main" and v or nil); r:Refresh(); testSpell(r.id) end)
    r.style:SetPoint("LEFT", C.style, 0)
    r.color = picker(r, 116, function()
        local o = { { "main", "Main colour", { DB.r, DB.g, DB.b } } }
        for _, c in ipairs(COLORS) do o[#o + 1] = { c[1], c[2], c[3] } end
        local mine = per(r.id).color; if mine and not mine.preset then o[#o + 1] = { "custom", "Your colour", mine } end
        o[#o + 1] = { "pick", "Any colour..." }; return o end,
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
    r.color:SetPoint("LEFT", C.color, 0)
    r.sound = picker(r, 124, function() return soundList({ "main", "Main sound" }) end, function() return per(r.id).sound or "main" end,
      function(v) perSet(r.id, "sound", v ~= "main" and v or nil); r:Refresh(); pvFocus(r.id); playSound(soundFor(r.id)) end)
    r.sound:SetPoint("LEFT", C.sound, 0)
    r.words = inputBox(r, 100, 28); r.words.bg:SetPoint("LEFT", C.words, 0); r.words:SetMaxLetters(60)
    local function saveWords(self) local t = (self:GetText() or ""):gsub("^%s+", ""):gsub("%s+$", ""); perSet(r.id, "words", t ~= "" and t or nil); r:Refresh(); pvFocus(r.id) end
    r.words:SetScript("OnEnterPressed", function(self) saveWords(self); self:ClearFocus(); local w = wordsFor(r.id); if w then speak(w) end end)
    r.words:HookScript("OnEditFocusLost", saveWords)
    r.test = button(r, "Test", 46, false, 28); r.test:SetPoint("LEFT", C.test, 0); r.test:SetScript("OnClick", function() testSpell(r.id) end)
    r.reset = button(r, "×", 26, false, 28); r.reset:SetPoint("LEFT", C.reset, 0); setFont(r.reset.t, "bold", 16)
    r.reset:SetScript("OnClick", function() DB.spells[r.id] = nil; r:Refresh(); pvFocus(r.id) end)
    -- (click the spell's icon or name to see it in the preview)
    r.hit = CreateFrame("Button", nil, r); r.hit:SetPoint("TOPLEFT", 0, 0); r.hit:SetSize(C.on - 6, ROW_H)
    r.hit:SetScript("OnClick", function() pvFocus(r.id) end); tip(r.hit, "Show it in the preview")
    tip(r.reset, "Back to the main settings")
    r.Refresh = function(self)
      local p = per(self.id)
      self.icon:SetTexture(spellIcon(self.id)); self.name:SetText(spellName(self.id) or ("Spell " .. self.id)); self.where:SetText(self.whereText or "")
      self.icon:SetDesaturated(p.off and true or false); self.name:SetTextColor(rgb(p.off and COL.faint or COL.text))
      self.on:Refresh(); self.style:Refresh(); self.color:Refresh(); self.sound:Refresh()
      for _, f in ipairs({ self.style, self.color, self.sound, self.words.bg, self.test }) do f:SetAlpha(p.off and 0.45 or 1) end
      if not self.words:HasFocus() then self.words:SetText(p.words or "") end
      self.words.hint:SetText(DB.tts and "Main voice" or "No voice"); self.words.hint:SetShown((p.words or "") == "" and not self.words:HasFocus())
      self.reset:SetShown(next(p) ~= nil)
    end
    return r
  end
  -- (the thin scroll bar on the right, like the website's)
  local function paintBar()
    local range = scroll:GetVerticalScrollRange() or 0
    bar:SetShown(range > 0)
    if range > 0 then
      local h = scroll:GetHeight() or 1; local th = math.max(30, h * h / (h + range))
      thumb:SetHeight(th); thumb:ClearAllPoints(); thumb:SetPoint("TOP", bar, "TOP", 0, -((h - th) * (scroll:GetVerticalScroll() or 0) / range))
    end
  end
  function spellsPage.fill()
    if not content then return end
    local l = spellList()
    for i, s in ipairs(l) do
      local r = rows[i] or newRow(); rows[i] = r
      r.id, r.whereText = s.id, s.where
      r:ClearAllPoints(); r:SetPoint("TOPLEFT", content, "TOPLEFT", 0, -(i - 1) * (ROW_H + 4)); r.bg:SetAlpha(i % 2 == 1 and 0.55 or 0.25); r:Show(); r:Refresh()
    end
    for i = #l + 1, #rows do rows[i]:Hide() end
    content:SetHeight(math.max(1, #l * (ROW_H + 4)))
    empty:SetShown(#l == 0)
    paintBar()
  end
  spellsPage.rows = rows
  function spellsPage.build(P)
    local heads = { { "Spell", C.name }, { "Glow", C.on }, { "Style", C.style }, { "Colour", C.color }, { "Sound", C.sound }, { "Words (said out loud)", C.words } }
    for _, h in ipairs(heads) do local t = txt(P, "bold", 12, COL.faint); t:SetPoint("TOPLEFT", L + h[2], -4); t:SetText(h[1]) end
    scroll = CreateFrame("ScrollFrame", nil, P); scroll:SetPoint("TOPLEFT", L, -24); scroll:SetPoint("BOTTOMRIGHT", -L, 58)
    content = CreateFrame("Frame", nil, scroll); content:SetSize(OW - L * 2 - 2, 1); scroll:SetScrollChild(content)
    scroll:EnableMouseWheel(true)
    scroll:SetScript("OnMouseWheel", function(self, d) local m = self:GetVerticalScrollRange() or 0; self:SetVerticalScroll(math.max(0, math.min(m, self:GetVerticalScroll() - d * (ROW_H + 4)))); paintBar() end)
    bar = CreateFrame("Frame", nil, P); bar:SetWidth(4); bar:SetPoint("TOPLEFT", scroll, "TOPRIGHT", 6, 0); bar:SetPoint("BOTTOMLEFT", scroll, "BOTTOMRIGHT", 6, 0)
    local track = bar:CreateTexture(nil, "BACKGROUND"); track:SetAllPoints(); rounded(track, "fill", 5, COL.line, 1)
    thumb = bar:CreateTexture(nil, "ARTWORK"); thumb:SetWidth(4); rounded(thumb, "fill", 5, COL.faint, 1)
    empty = txt(P, "body", 14, COL.muted); empty:SetPoint("TOP", scroll, "TOP", 0, -50); empty:SetWidth(560)
    empty:SetText("No spells yet. Load your NSRT note, put your cooldowns on Blizzard's Cooldown Manager, or add a spell below.")
    local lbl = txt(P, "bold", 14); lbl:SetPoint("BOTTOMLEFT", L + 2, 22); lbl:SetText("Add a spell")
    addBox = inputBox(P, 240, 30); addBox.bg:SetPoint("LEFT", lbl, "RIGHT", 12, 0); addBox.hint:SetText("Its name or spell ID")
    local addB = button(P, "Add", 70, true, 30); addB:SetPoint("LEFT", addBox.bg, "RIGHT", 8, 0)
    local function doAdd()
      local text = (addBox:GetText() or ""):gsub("^%s+", ""):gsub("%s+$", "")
      addBox:SetText(""); addBox:ClearFocus()
      local id = tonumber(text)
      if not id and C_Spell and C_Spell.GetSpellInfo then local info = C_Spell.GetSpellInfo(text); id = info and not secret(info.spellID) and info.spellID end
      if not id or not spellName(id) then say("no spell called \"" .. text .. "\". Type its name exactly, or its spell ID."); return end
      DB.spells[id] = DB.spells[id] or {}; DB.spells[id].added = true
      spellsPage.fill()
    end
    addBox:SetScript("OnEnterPressed", doAdd); addB:SetScript("OnClick", doAdd)
    spellsPage.addBox, spellsPage.addB = addBox, addB
    local n = txt(P, "body", 12.5, COL.faint); n:SetPoint("BOTTOMRIGHT", -L - 2, 28); n:SetText("\"Main\" uses your main settings.  {spell} in Words says its name.")
  end
end

function DebriefGlow_Open(pg)
  if not DB then return end
  if not opt then buildOptions() end
  if SettingsPanel and SettingsPanel.IsShown and SettingsPanel:IsShown() and HideUIPanel then HideUIPanel(SettingsPanel) end
  refreshAll(); opt:Show(); showPage(pg or "glow"); pv.place(opt)
end
function DebriefGlow_Spells() DebriefGlow_Open("spells") end
function DebriefGlow_OnAddonCompartmentClick() if opt and opt:IsShown() then opt:Hide() else DebriefGlow_Open() end end
-- (in WoW's own Options > AddOns list too: a short line and a button that opens the window)
local function registerSettings()
  if not (Settings and Settings.RegisterCanvasLayoutCategory and Settings.RegisterAddOnCategory) then return end
  local p = CreateFrame("Frame"); p:Hide()
  local t = p:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge"); t:SetPoint("TOPLEFT", 16, -16); t:SetText("Debrief Glow")
  local d = p:CreateFontString(nil, "OVERLAY", "GameFontHighlight"); d:SetPoint("TOPLEFT", 16, -44); d:SetWidth(560); d:SetJustifyH("LEFT")
  d:SetText("Your NSRT note's cooldowns count down and glow on Blizzard's Cooldown Manager when it's time to press them. Its settings have their own window.")
  local b = CreateFrame("Button", nil, p, "UIPanelButtonTemplate"); b:SetSize(220, 26); b:SetPoint("TOPLEFT", 16, -80); b:SetText("Open Debrief Glow settings")
  b:SetScript("OnClick", function() DebriefGlow_Open() end)
  local cat = Settings.RegisterCanvasLayoutCategory(p, "Debrief Glow"); Settings.RegisterAddOnCategory(cat)
end

SLASH_DEBRIEFGLOW1 = "/dglow"
SlashCmdList.DEBRIEFGLOW = function(msg)
  msg = (msg or ""):lower():gsub("^%s+", ""):gsub("%s+$", "")
  if msg == "test" then DebriefGlow_Test()
  elseif msg == "spells" then DebriefGlow_Spells()
  elseif msg == "move" then
    placeFloat(); float.tex:SetTexture(spellIcon(31821)); float.txt:SetText("Drag me, then /dglow move again"); float.moving = not float.moving; float:EnableMouse(float.moving)
    if float.moving then float:Show(); say("drag the big icon where you want it, then type /dglow move again.") else float:Hide(); say("big icon placed.") end
  elseif msg == "on" or msg == "off" then DB.enabled = (msg == "on"); say(DB.enabled and "on." or "off."); refreshAll()
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
    registerSettings()
  elseif e == "ADDON_LOADED" or e == "PLAYER_LOGIN" then hookNSRT()
  elseif e == "UNIT_SPELLCAST_SUCCEEDED" then onCast(a3)
  elseif e == "ENCOUNTER_END" then stopAll() end
  if e == "PLAYER_LOGIN" then hookNSRT() end
end)
