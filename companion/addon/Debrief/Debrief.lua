local detailBtn, PRESET_NAME, render -- (shared by parts below)
-- Debrief: your pull recap, in game.
-- Debrief Companion (the small app on your PC) reads your combat log when a boss pull ends and copies a short code.
-- Press your Debrief key (Ctrl+Shift+D unless you change it) or type /debrief paste, then Ctrl+V: the card shows.
-- The addon never reads files or combat data itself (Midnight blocks that in combat); it only shows what you paste.

local ADDON = ...
local DB

-- ---------- Debrief's colours and type (the same as the website) ----------
local COL = { bg = "171a22", head = "13161d", raised = "1e222c", line = "2a2f3b", line2 = "353b49", text = "ece8df", muted = "98a0ad",
  faint = "6c7381", soft = "d6d1c6", gold = "e6b450", good = "45c15c", goodT = "7ee08f", goodBg = "17301e", bad = "e5534b", badT = "ff8f87", badBg = "3a1d1d", warn = "e8a23a" }
local function rgb(hex) return tonumber(hex:sub(1, 2), 16) / 255, tonumber(hex:sub(3, 4), 16) / 255, tonumber(hex:sub(5, 6), 16) / 255 end
local MEDIA = "Interface\\AddOns\\" .. (ADDON or "Debrief") .. "\\"
local FONT = { body = MEDIA .. "Fonts\\Barlow-Medium.ttf", bold = MEDIA .. "Fonts\\Barlow-SemiBold.ttf", head = MEDIA .. "Fonts\\BarlowSemiCondensed-Bold.ttf" }
local FONTSETS = {
  debrief = FONT,
  wow = { body = STANDARD_TEXT_FONT, bold = STANDARD_TEXT_FONT, head = STANDARD_TEXT_FONT },
  arial = { body = "Fonts\\ARIALN.TTF", bold = "Fonts\\ARIALN.TTF", head = "Fonts\\ARIALN.TTF" },
  morpheus = { body = STANDARD_TEXT_FONT, bold = STANDARD_TEXT_FONT, head = "Fonts\\MORPHEUS.TTF" },
}
local FONTREG = setmetatable({}, { __mode = "k" })
local function setFont(fs, kind, size)
  FONTREG[fs] = { kind, size }
  local set = FONTSETS[DebriefDB and DebriefDB.font or "debrief"] or FONT
  local sz = size * ((DebriefDB and DebriefDB.fontScale) or 1)
  local ok = fs:SetFont(set[kind] or set.body or FONT.body, sz, "")
  if ok == false then fs:SetFont(STANDARD_TEXT_FONT, sz, "") end
end
local function reapplyFonts() for fs, v in pairs(FONTREG) do setFont(fs, v[1], v[2]) end end
local CLASS_FALLBACK = { WARRIOR = "c69b6d", PALADIN = "f48cba", HUNTER = "aad372", ROGUE = "fff468", PRIEST = "ffffff", DEATHKNIGHT = "c41e3a",
  SHAMAN = "0070dd", MAGE = "3fc7eb", WARLOCK = "8788ee", MONK = "00ff98", DRUID = "ff7c0a", DEMONHUNTER = "a330c9", EVOKER = "33937f" }
local function classHex(cls)
  local c = RAID_CLASS_COLORS and cls and RAID_CLASS_COLORS[cls]
  if c and c.colorStr and #c.colorStr == 8 then return c.colorStr:sub(3) end
  return CLASS_FALLBACK[cls or ""] or COL.text
end
local function say(msg) DEFAULT_CHAT_FRAME:AddMessage("|cffe6b450Debrief|r " .. msg) end

-- ---------- reading the code ----------
local function split(s, sep)
  local out, i = {}, 1
  while true do
    local j = string.find(s, sep, i, true)
    if not j then out[#out + 1] = string.sub(s, i); break end
    out[#out + 1] = string.sub(s, i, j - 1); i = j + #sep
  end
  return out
end
local function decode(code)
  code = (code or ""):gsub("^%s+", ""):gsub("%s+$", "")
  code = code:gsub("||", "|")
  if code:sub(1, 4) ~= "DBF1" then return nil, "That isn't a Debrief code. Copy it again from Debrief Companion." end
  if code:sub(-2) ~= "^Z" then return nil, "The code got cut off. Copy it again from Debrief Companion." end
  local m, by = { players = {}, raid = { bad = {}, died = {}, more = "", next = "" } }, {}
  for _, r in ipairs(split(code, "^")) do
    local f = split(r, "~")
    local t = f[1]
    local function g(i) return f[i] or "" end
    if t == "H" then
      m.h = { boss = g(2), diff = g(3), pull = g(4), kill = g(5) == "1", pct = g(6), dur = g(7), where = g(8), deaths = g(9) }
    elseif t == "P" then
      local p = { name = g(2), cls = g(3), spec = g(4), role = g(5), unit = g(6), v = g(7), d = tonumber(g(8)), vs = g(9), best = g(10), bp = g(11), rank = g(12), icon = g(13), slips = {}, boss = {}, next = "" }
      m.players[#m.players + 1] = p; by[p.name] = p
    elseif t == "S" and by[g(2)] then table.insert(by[g(2)].slips, { g(3), g(4), g(5) })
    elseif t == "B" and by[g(2)] then table.insert(by[g(2)].boss, { g(3), g(4), g(5) })
    elseif t == "N" and by[g(2)] then by[g(2)].next = g(3)
    elseif t == "R" then table.insert(m.raid.bad, { g(2), g(3), g(4), g(5) })
    elseif t == "D" then table.insert(m.raid.died, { g(2), g(3), g(4), g(5), g(6) })
    elseif t == "X" then m.raid.more = g(2)
    elseif t == "Q" then m.raid.next = g(2)
    end
  end
  if not m.h then return nil, "That code has no pull in it. Copy it again from Debrief Companion." end
  return m
end

-- (a pull to try the card with: a real Heroic Ula'tek kill with made-up names; /debrief demo shows it)
local SAMPLE = [==[DBF1^H~Ula'tek~Heroic~3~1~0~7:30~~6^P~Ironvow~PALADIN~Protection Paladin~tank~DPS~148k~-13~2~171k~2~~ability_paladin_shieldofthetemplar^S~Ironvow~warn~389539~Opener, step by step: 3 of 4. Missed: step 1, Hand of Reckoning (not in your opener).^S~Ironvow~warn~~Stat order: Crit › Mastery › Haste › Vers. Yours: Critical Strike 1,198, then Mastery 1,041, then Haste 979, then Versatility 0.^N~Ironvow~Follow the guide opener: Hand of Reckoning, then 3 of Avenger's Shield, Sentinel, Avenging Wrath or Divine Toll, in any order.^P~Lumensong~PALADIN~Holy Paladin~healer~HPS~333k~5~2~317k~2~1st of 4 healers~spell_holy_holybolt^S~Lumensong~warn~200025~Beacon of Virtue: 63%. It sat ready for 168 seconds.^S~Lumensong~warn~223819~Divine Purpose: 4 wasted. 2 were lost to a Divine Toll pressed while you still held one.^S~Lumensong~bad~82326~Mana at the kill: 60%. About a few more Holy Lights were left in it.^N~Lumensong~Press Beacon of Virtue as the damage goes out, close to every 15 seconds. From 0:52, it sat ready for 36 seconds.^P~Dawnmender~PALADIN~Holy Paladin~healer~HPS~316k~13~2~280k~2~2nd of 4 healers~spell_holy_holybolt^S~Dawnmender~warn~223819~Divine Purpose: 6 wasted. 3 were lost to a Divine Toll pressed while you still held one.^S~Dawnmender~warn~31821~Cooldowns into the big hits: 1 of 3. 1 of your 3 healing cooldowns went out in the heaviest damage of the pull.^S~Dawnmender~warn~31884~Casting in Avenging Wrath: 83%. You were casting for 83% of your Avenging Wrath windows.^B~Dawnmender~dead~1286835~You died at 3:50 to Necrotic Vapors.^N~Dawnmender~Spend Divine Purpose before it runs out, or before a new one replaces it. Your first wasted one was at 2:50.^P~Thornroot~DRUID~Restoration Druid~healer~HPS~281k~-1~2~284k~2~3rd of 4 healers~spell_nature_healingtouch^S~Thornroot~warn~391528~Convoke the Spirits uses: 6 of 8. It sat ready for 2 minutes in all.^S~Thornroot~bad~48438~Mana at the kill: 58%. About 13 more Wild Growths were left in it at the kill.^S~Thornroot~warn~263725~Clearcasting: 11 wasted. 9 were replaced by a new one while you still had it.^N~Thornroot~Press Convoke the Spirits a little sooner each time it comes back.^P~Arcspark~MAGE~Arcane Mage~dps~DPS~275k~31~2~210k~2~3rd of 21 DPS~spell_holy_magicalsentry^S~Arcspark~warn~30451~Rotation priority: 77% of your casts were the best button to press.^S~Arcspark~warn~30451~Always be casting: 72%. Your longest stretch with nothing pressed was 6 seconds, at 3:22, while you were moving.^S~Arcspark~warn~321507~Touch of the Magi on cooldown: 8 of 10. It sat ready, unused, for 2 minutes in all.^N~Arcspark~With Clearcasting and under 12 Arcane Salvo, Arcane Missiles comes first. Not in Arcane Soul, where each Barrage gives you Clearcasting and Salvo back.^P~Frostwhisper~MAGE~Frost Mage~dps~DPS~156k~-36~2~244k~2~17th of 21 DPS~spell_frost_frostbolt02^S~Frostwhisper~bad~116~Always be casting: 70%. Your longest stretch with nothing pressed was 5 seconds, at 1:52, while you were moving.^S~Frostwhisper~bad~190446~Brain Freeze: 3 wasted. You got 24 procs.^S~Frostwhisper~warn~269748~Ray of Frost on cooldown: 6 of 8. It sat ready, unused, for 21 seconds in all.^B~Frostwhisper~dead~1301007~You died at 4:20 to Unchecked Rage.^N~Frostwhisper~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.^R~warn~1292403~Caustic Waves~5 players. @Moonquill, @Mistpalm, @Grimshade, @Voidfang and 1 more. Dodge the venom waves from Ula'tek and her tail.^R~bad~1301007~Unchecked Rage~1 time. Nobody was in melee of Ula'tek, so she hit the raid.^D~2:44~Hawkfeather~HUNTER~6603~Melee^D~2:46~Stonefist~WARRIOR~6603~Melee^D~3:50~Dawnmender~PALADIN~1286835~Necrotic Vapors^D~3:53~Jadewind~MONK~6603~Melee^X~+2 more by 7:30.^Q~Kill! Next time: Dodge the venom waves from Ula'tek and her tail.^Z]==]

-- ---------- small helpers for drawing ----------
local function iconPath(x)
  if not x or x == "" then return "Interface\\Icons\\INV_Misc_QuestionMark" end
  local id = tonumber(x)
  if id then
    local tex = C_Spell and C_Spell.GetSpellTexture and C_Spell.GetSpellTexture(id)
    if not tex and GetSpellTexture then tex = GetSpellTexture(id) end
    return tex or "Interface\\Icons\\INV_Misc_QuestionMark"
  end
  return "Interface\\Icons\\" .. x
end
local function fill(tex, hex, a) tex:SetColorTexture(rgb(hex)); tex:SetAlpha(a or 1) end
-- rounded shapes (the website's look): a white rounded box and its 1px outline, sliced so the corners keep their size,
-- then coloured per use. An older client without slicing gets plain boxes.
local SLICE = MEDIA .. "Media\\"
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
  f.fillT = f.fillT or f:CreateTexture(nil, "BACKGROUND", nil, -6)
  f.fillT:SetAllPoints(); rounded(f.fillT, "fill", r, fillHex, fillA)
  f.lineT = f.lineT or f:CreateTexture(nil, "BORDER", nil, -6)
  f.lineT:SetAllPoints(); rounded(f.lineT, "line", r, lineHex, lineA)
  if shadow and not f.shT then
    f.shT = f:CreateTexture(nil, "BACKGROUND", nil, -8)
    f.shT:SetPoint("TOPLEFT", -14, 12); f.shT:SetPoint("BOTTOMRIGHT", 14, -16)
    f.shT:SetTexture(SLICE .. "shadow")
    if f.shT.SetTextureSliceMargins then f.shT:SetTextureSliceMargins(24, 24, 24, 24) end
    f.shT:SetAlpha(0.6)
  end
end
local function closeButton(parent)
  local b = CreateFrame("Button", nil, parent); b:SetSize(24, 24); b:SetPoint("TOPRIGHT", -8, -8)
  local x = b:CreateFontString(nil, "OVERLAY"); setFont(x, "bold", 17); x:SetPoint("CENTER", 0, 1); x:SetText("×"); x:SetTextColor(rgb(COL.faint))
  b:SetScript("OnEnter", function() x:SetTextColor(rgb(COL.text)) end); b:SetScript("OnLeave", function() x:SetTextColor(rgb(COL.faint)) end)
  return b
end

-- ---------- the paste box ----------
local paste = CreateFrame("Frame", "DebriefPaste", UIParent)
paste:SetSize(384, 140); paste:SetPoint("CENTER", 0, 150); paste:SetFrameStrata("DIALOG"); paste:Hide()
skin(paste, 8, COL.bg, 0.98, COL.gold, 0.55, true)
paste:SetMovable(true); paste:EnableMouse(true); paste:RegisterForDrag("LeftButton"); paste:SetClampedToScreen(true)
paste:SetScript("OnDragStart", paste.StartMoving); paste:SetScript("OnDragStop", paste.StopMovingOrSizing)
tinsert(UISpecialFrames, "DebriefPaste")
local pLogo = paste:CreateTexture(nil, "ARTWORK"); pLogo:SetSize(16, 18); pLogo:SetPoint("TOPLEFT", 14, -12); pLogo:SetTexture(MEDIA .. "Media\\logo")
local pTitle = paste:CreateFontString(nil, "OVERLAY"); setFont(pTitle, "head", 17); pTitle:SetPoint("LEFT", pLogo, "RIGHT", 7, 0); pTitle:SetTextColor(rgb(COL.text)); pTitle:SetText("Debrief")
local pText = paste:CreateFontString(nil, "OVERLAY"); setFont(pText, "body", 13.5); pText:SetPoint("TOPLEFT", 14, -42); pText:SetWidth(356); pText:SetJustifyH("LEFT")
pText:SetTextColor(rgb(COL.muted)); pText:SetText("Press |cffece8dfCtrl+V|r to paste your pull from Debrief Companion.")
local ebBg = CreateFrame("Frame", nil, paste); ebBg:SetPoint("TOPLEFT", 14, -66); ebBg:SetPoint("TOPRIGHT", -14, -66); ebBg:SetHeight(34)
skin(ebBg, 5, COL.raised, 1, COL.line2, 1)
local eb = CreateFrame("EditBox", "DebriefPasteBox", ebBg)
eb:SetPoint("TOPLEFT", 10, -2); eb:SetPoint("BOTTOMRIGHT", -10, 2); eb:SetAutoFocus(false); eb:SetMultiLine(false)
eb:SetMaxLetters(0); if eb.SetMaxBytes then eb:SetMaxBytes(0) end
setFont(eb, "body", 13); eb:SetTextColor(rgb(COL.text))
eb:SetScript("OnEditFocusGained", function() rounded(ebBg.lineT, "line", 5, COL.gold, 0.9) end)
eb:SetScript("OnEditFocusLost", function() rounded(ebBg.lineT, "line", 5, COL.line2, 1) end)
local pMsg = paste:CreateFontString(nil, "OVERLAY"); setFont(pMsg, "body", 12); pMsg:SetPoint("TOPLEFT", 14, -110); pMsg:SetWidth(356); pMsg:SetJustifyH("LEFT"); pMsg:SetTextColor(rgb(COL.faint))
pMsg:SetText("Nothing is typed into the game for you. The card opens as soon as you paste.")
local pClose = closeButton(paste)
pClose:SetScript("OnClick", function() paste:Hide() end)
eb:SetScript("OnEscapePressed", function() paste:Hide() end)
local PASTE_KEYS = { LCTRL = true, RCTRL = true, LMETA = true, RMETA = true, V = true }
eb:SetScript("OnKeyDown", function(self, key) if grabbed and not PASTE_KEYS[key] then grabbed = false; self:ClearFocus() end end)

-- ---------- the card ----------
local W, PAD, TOPY = 400, 14, 172
local CW = W - PAD * 2
local WIDTHS = { narrow = 360, normal = 400, wide = 480 }
local card = CreateFrame("Frame", "DebriefCard", UIParent)
card:SetSize(W, 300); card:SetPoint("CENTER", 260, 60); card:SetFrameStrata("HIGH"); card:SetClampedToScreen(true); card:Hide()
skin(card, 8, COL.bg, 0.97, COL.line2, 1, true)
card:SetMovable(true); card:EnableMouse(true)
tinsert(UISpecialFrames, "DebriefCard")

-- the top: drag it to move the card
local top = CreateFrame("Frame", nil, card); top:SetPoint("TOPLEFT", 0, 0); top:SetPoint("TOPRIGHT", -36, 0); top:SetHeight(40)
top:EnableMouse(true); top:RegisterForDrag("LeftButton")
top:SetScript("OnDragStart", function() card:StartMoving() end)
top:SetScript("OnDragStop", function()
  card:StopMovingOrSizing()
  local p, _, rp, x, y = card:GetPoint(); DB.pos = { p, rp, x, y }
end)
local logo = top:CreateTexture(nil, "ARTWORK"); logo:SetSize(16, 18); logo:SetPoint("TOPLEFT", PAD, -12); logo:SetTexture(MEDIA .. "Media\\logo")
local title = top:CreateFontString(nil, "OVERLAY"); setFont(title, "head", 17); title:SetPoint("LEFT", logo, "RIGHT", 7, 0); title:SetTextColor(rgb(COL.text)); title:SetText("Debrief")
local bossT = top:CreateFontString(nil, "OVERLAY"); setFont(bossT, "body", 13); bossT:SetPoint("LEFT", title, "RIGHT", 9, -1); bossT:SetTextColor(rgb(COL.muted)); bossT:SetWidth(250); bossT:SetJustifyH("LEFT"); bossT:SetWordWrap(false)
-- detail presets: one click sets how much the card shows (Simple / Medium / Heavy); any change by hand makes it Custom
PRESET_NAME = { simple = "Simple", medium = "Medium", heavy = "Heavy" }
local PRESETS = {
  simple = { compact = true, maxSlips = 1, maxBoss = 1, maxRaid = 1, maxDied = 2, width = "normal", show = { rank = false, best = false } },
  medium = { compact = false, maxSlips = 3, maxBoss = 2, maxRaid = 3, maxDied = 4, width = "normal", show = {} },
  heavy = { compact = false, maxSlips = 5, maxBoss = 3, maxRaid = 5, maxDied = 8, width = "wide", show = {} },
}
function Debrief_SetPreset(key)
  local p = PRESETS[key]; if not p or not DB then return end
  DB.compact, DB.maxSlips, DB.maxBoss, DB.maxRaid, DB.maxDied, DB.width = p.compact, p.maxSlips, p.maxBoss, p.maxRaid, p.maxDied, p.width
  DB.show = {}; for k, v in pairs(p.show) do DB.show[k] = v end
  DB.collapsed = nil; DB.preset = key
  if Debrief_RefreshOptions then Debrief_RefreshOptions() end
  if card:IsShown() then render() end
end
local close = closeButton(card)
close:SetScript("OnClick", function() card:Hide() end)
-- (the Detail button on the card: Simple, Medium, Heavy, one click each)
detailBtn = CreateFrame("Button", nil, card); detailBtn:SetSize(70, 22); detailBtn:SetPoint("RIGHT", close, "LEFT", -6, 0)
skin(detailBtn, 5, COL.raised, 1, COL.line2, 1)
detailBtn.t = detailBtn:CreateFontString(nil, "OVERLAY"); setFont(detailBtn.t, "bold", 11.5); detailBtn.t:SetPoint("CENTER", 0, 0); detailBtn.t:SetTextColor(rgb(COL.muted)); detailBtn.t:SetText("Medium")
detailBtn:SetScript("OnClick", function() local order = { simple = "medium", medium = "heavy", heavy = "simple" }; Debrief_SetPreset(order[DB.preset] or "medium") end)
detailBtn:SetScript("OnEnter", function() detailBtn.t:SetTextColor(rgb(COL.text)); GameTooltip:SetOwner(detailBtn, "ANCHOR_TOP"); GameTooltip:SetText("How much the card shows: Simple, Medium or Heavy"); GameTooltip:Show() end)
detailBtn:SetScript("OnLeave", function() detailBtn.t:SetTextColor(rgb(COL.muted)); GameTooltip:Hide() end)
local topLine = card:CreateTexture(nil, "ARTWORK"); topLine:SetPoint("TOPLEFT", 1, -40); topLine:SetPoint("TOPRIGHT", -1, -40); topLine:SetHeight(1); fill(topLine, COL.line)

-- pull chips (the last few pulls), soft pills
local chips = {}
for i = 1, 5 do
  local b = CreateFrame("Button", nil, card); b:SetSize(70, 22)
  skin(b, 5, COL.raised, 1, COL.raised, 1)
  b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 11.5); b.t:SetPoint("CENTER", 0, 0)
  b:Hide(); chips[i] = b
end
local resT = card:CreateFontString(nil, "OVERLAY"); setFont(resT, "head", 22); resT:SetPoint("TOPLEFT", PAD, -53); resT:SetJustifyH("LEFT"); resT:SetWordWrap(false); resT:SetTextColor(rgb(COL.text))
-- (the result as a pill, the way the website shows Kill and Wipe)
local pill = CreateFrame("Frame", nil, card); pill:SetSize(60, 24); pill:SetPoint("TOPRIGHT", -PAD, -52); skin(pill, 5, COL.goodBg, 1, COL.goodBg, 1)
pill.t = pill:CreateFontString(nil, "OVERLAY"); setFont(pill.t, "bold", 13); pill.t:SetPoint("CENTER", 0, 0)
local metaT = card:CreateFontString(nil, "OVERLAY"); setFont(metaT, "body", 13); metaT:SetPoint("TOPLEFT", PAD, -82); metaT:SetTextColor(rgb(COL.muted)); metaT:SetJustifyH("LEFT")

-- tabs: Me and Raid view, a gold line under the open one; on Me, arrows to look at anyone in the pull
local tabs, view = {}, "me"
local tabLine = card:CreateTexture(nil, "ARTWORK"); tabLine:SetPoint("TOPLEFT", 1, -TOPY + 12); tabLine:SetPoint("TOPRIGHT", -1, -TOPY + 12); tabLine:SetHeight(1); fill(tabLine, COL.line)
local function mkTab(key, label, x)
  local b = CreateFrame("Button", nil, card); b:SetSize(10, 26); b:SetPoint("TOPLEFT", x, -TOPY + 38)
  b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 14); b.t:SetPoint("CENTER", 0, 1); b.t:SetText(label)
  b:SetWidth(b.t:GetStringWidth() + 20)
  b.u = b:CreateTexture(nil, "OVERLAY"); b.u:SetPoint("BOTTOMLEFT", 6, 0); b.u:SetPoint("BOTTOMRIGHT", -6, 0); b.u:SetHeight(2); fill(b.u, COL.gold)
  b:SetScript("OnEnter", function() if view ~= key then b.t:SetTextColor(rgb(COL.text)) end end)
  b:SetScript("OnLeave", function() if view ~= key then b.t:SetTextColor(rgb(COL.muted)) end end)
  b.key = key; tabs[key] = b
  return b
end
local tMe = mkTab("me", "Me", PAD - 10)
local tRaid = mkTab("raid", "Raid view", PAD - 10 + tMe:GetWidth())
local who = card:CreateFontString(nil, "OVERLAY"); setFont(who, "bold", 13); who:SetJustifyH("RIGHT"); who:SetWordWrap(false)
local nextB = CreateFrame("Button", nil, card); nextB:SetSize(22, 22); nextB:SetPoint("TOPRIGHT", -PAD, -TOPY + 36)
local prevB = CreateFrame("Button", nil, card); prevB:SetSize(22, 22)
who:SetPoint("RIGHT", nextB, "LEFT", -7, 0); prevB:SetPoint("RIGHT", who, "LEFT", -7, 0)
for _, b in ipairs({ prevB, nextB }) do
  skin(b, 5, COL.raised, 1, COL.line2, 1)
  b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 11); b.t:SetPoint("CENTER", 0, 0); b.t:SetTextColor(rgb(COL.muted))
  b:SetScript("OnEnter", function() b.t:SetTextColor(rgb(COL.text)) end); b:SetScript("OnLeave", function() b.t:SetTextColor(rgb(COL.muted)) end)
end
prevB.t:SetText("<"); nextB.t:SetText(">")

local body = CreateFrame("Frame", nil, card); body:SetPoint("TOPLEFT", PAD, -TOPY); body:SetWidth(CW); body:SetHeight(10)
local foot = card:CreateFontString(nil, "OVERLAY"); setFont(foot, "body", 11.5); foot:SetTextColor(rgb(COL.faint)); foot:SetJustifyH("LEFT")
foot:SetText("/debrief opens this again  ·  /debrief paste for a new pull")
local footLine = card:CreateTexture(nil, "ARTWORK"); footLine:SetHeight(1); fill(footLine, COL.line)

-- pooled pieces for the body (redrawn each time): text, plain textures, rounded textures
local pool = { fs = {}, tex = {}, rt = {}, btn = {} }
local used = { fs = 0, tex = 0, rt = 0, btn = 0 }
local EXPANDED = {} -- (lists opened with "Show N more", until the next pull)
local IND = 0 -- (rows sit this far in, inside a section panel)
local function resetPool()
  used.fs, used.tex, used.rt, used.btn = 0, 0, 0, 0
  for _, l in pairs(pool) do for _, o in ipairs(l) do o:Hide(); o:ClearAllPoints() end end
end
local function FS(kind, size, hex)
  used.fs = used.fs + 1
  local fs = pool.fs[used.fs]
  if not fs then fs = body:CreateFontString(nil, "OVERLAY"); pool.fs[used.fs] = fs end
  setFont(fs, kind, size); fs:SetTextColor(rgb(hex or COL.text)); fs:SetJustifyH("LEFT"); fs:SetJustifyV("TOP"); fs:SetWordWrap(true); fs:SetWidth(0)
  if fs.SetSpacing then fs:SetSpacing(2) end
  fs:Show()
  return fs
end
local function TEX(layer)
  used.tex = used.tex + 1
  local t = pool.tex[used.tex]
  if not t then t = body:CreateTexture(nil, "ARTWORK"); pool.tex[used.tex] = t end
  t:SetDrawLayer(layer or "ARTWORK"); t:SetTexCoord(0, 1, 0, 1); t:SetAlpha(1); t:SetVertexColor(1, 1, 1); t:Show()
  return t
end
local function RT(layer)
  used.rt = used.rt + 1
  local t = pool.rt[used.rt]
  if not t then t = body:CreateTexture(nil, "BACKGROUND"); pool.rt[used.rt] = t end
  t:SetDrawLayer(layer or "BACKGROUND"); t:Show()
  return t
end
-- a soft rounded box in the body; an optional gold bar down its left side
local function box(y, h, fillHex, fillA, lineHex, lineA, bar)
  local f = RT("BACKGROUND"); f:SetPoint("TOPLEFT", 0, -y); f:SetSize(CW, h); rounded(f, "fill", 5, fillHex, fillA)
  local l = RT("BORDER"); l:SetPoint("TOPLEFT", f, "TOPLEFT"); l:SetPoint("BOTTOMRIGHT", f, "BOTTOMRIGHT"); rounded(l, "line", 5, lineHex, lineA)
  if bar then local b = TEX("ARTWORK"); b:SetPoint("TOPLEFT", f, "TOPLEFT", 1, -6); b:SetPoint("BOTTOMLEFT", f, "BOTTOMLEFT", 1, 6); b:SetWidth(3); fill(b, bar) end
end
local function icon(x, y, size, id)
  local t = TEX("ARTWORK"); t:SetPoint("TOPLEFT", x, -y); t:SetSize(size, size); t:SetTexture(iconPath(id)); t:SetTexCoord(0.08, 0.92, 0.08, 0.92)
  return t
end
local FLAG = { ok = COL.good, warn = COL.warn, bad = COL.bad, dead = COL.faint }
local CUR -- the pull on show
local function names(s)
  if not CUR then return s end
  return (s:gsub("@([^%s,%.!%?;:%(%)]+)", function(n)
    local cls; for _, p in ipairs(CUR.players) do if p.name == n then cls = p.cls end end
    return "|cff" .. classHex(cls) .. n .. "|r"
  end))
end
-- a section label: small, uppercase, quiet
local function BTN()
  used.btn = used.btn + 1
  local b = pool.btn[used.btn]
  if not b then b = CreateFrame("Button", nil, body); pool.btn[used.btn] = b end
  b:ClearAllPoints(); b:SetScript("OnClick", nil); b:SetScript("OnEnter", nil); b:SetScript("OnLeave", nil); b:Show()
  return b
end
-- a section label: small, uppercase, quiet; click it to fold the section away (or open it again)
local function head(y, text, key, folded)
  local t = FS("head", 15, COL.text); t:SetPoint("TOPLEFT", IND, -y); t:SetText(text)
  if key then
    local sign = FS("bold", 14, COL.faint); sign:SetJustifyH("RIGHT"); sign:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - IND, -(y - 1)); sign:SetText(folded and "+" or "–")
    local b = BTN(); b:SetPoint("TOPLEFT", 0, -(y - 8)); b:SetSize(CW, 30)
    b:SetScript("OnClick", function() DB.collapsed = DB.collapsed or {}; DB.collapsed[key] = not DB.collapsed[key] or nil; render() end)
    b:SetScript("OnEnter", function() t:SetTextColor(rgb(COL.gold)); sign:SetTextColor(rgb(COL.gold)) end)
    b:SetScript("OnLeave", function() t:SetTextColor(rgb(COL.text)); sign:SetTextColor(rgb(COL.faint)) end)
  end
  return y + (folded and 18 or 27)
end
-- "Show 2 more"
local function moreLink(y, key, n)
  local t = FS("bold", 12.5, COL.gold); t:SetPoint("TOPLEFT", IND + 46, -(y - 2)); t:SetText("Show " .. n .. " more")
  local b = BTN(); b:SetPoint("TOPLEFT", IND + 40, -(y - 5)); b:SetSize(140, 20)
  b:SetScript("OnClick", function() EXPANDED[key] = true; render() end)
  b:SetScript("OnEnter", function() t:SetTextColor(rgb(COL.text)) end); b:SetScript("OnLeave", function() t:SetTextColor(rgb(COL.gold)) end)
  return y + 20
end
-- a row: a round status dot, an icon, then the text (an optional bold title above it)
local function row(y, flag, ic, text, ttl)
  local d = TEX("ARTWORK"); d:SetTexture(SLICE .. "dot"); d:SetPoint("TOPLEFT", IND, -(y + 6)); d:SetSize(8, 8); d:SetVertexColor(rgb(FLAG[flag] or COL.faint))
  icon(IND + 16, y, 20, ic)
  local x, w, yy = IND + 46, CW - 46 - IND * 2, y
  if ttl and ttl ~= "" then local h = FS("bold", 13.5, COL.text); h:SetPoint("TOPLEFT", x, -yy); h:SetWidth(w); h:SetText(ttl); yy = yy + h:GetStringHeight() + 2 end
  local t = FS("body", 13.5, COL.soft); t:SetPoint("TOPLEFT", x, -yy); t:SetWidth(w); t:SetText(names(text))
  yy = yy + t:GetStringHeight()
  return math.max(y + 21, yy) + 9
end
local function nextBox(y, text)
  local t = FS("body", 14, COL.text); t:SetWidth(CW - 32); t:SetText(names(text))
  local l = FS("bold", 11.5, COL.gold); l:SetText("NEXT PULL")
  local h = 11 + 17 + t:GetStringHeight() + 12
  box(y, h, COL.gold, 0.07, COL.gold, 0.5, COL.gold)
  l:SetPoint("TOPLEFT", 16, -(y + 11)); t:SetPoint("TOPLEFT", 16, -(y + 28))
  return y + h + 4
end
local function chipColors(b, fillHex, lineHex, textHex)
  rounded(b.fillT, "fill", 5, fillHex, 1); rounded(b.lineT, "line", 5, lineHex, 1); b.t:SetTextColor(rgb(textHex))
end

local function canRaid()
  if DB.raidAlways then return true end
  return not IsInGroup() or UnitIsGroupLeader("player") or UnitIsGroupAssistant("player")
end
local function meName()
  local n = UnitName("player"); return n
end
local function pickWho(m)
  if DB.who then for _, p in ipairs(m.players) do if p.name == DB.who then return p end end end
  local me = meName()
  for _, p in ipairs(m.players) do if p.name == me or p.name:match("^([^%-]+)") == me then return p end end
  return m.players[1]
end

local function showPull(i)
  if not DB.pulls[i] then return end
  DB.cur = i; wipe(EXPANDED); render()
end
function render()
  local m = DB.pulls[DB.cur]; CUR = m
  if not m then return end
  W = WIDTHS[DB.width or "normal"] or 400; CW = W - PAD * 2; card:SetWidth(W); body:SetWidth(CW); bossT:SetWidth(W - 230)
  if detailBtn then detailBtn.t:SetText(PRESET_NAME[DB.preset] or "Custom"); detailBtn:SetWidth(detailBtn.t:GetStringWidth() + 18) end
  for _, c in ipairs(chips) do c:SetShown(false) end
  local h = m.h
  bossT:SetText(h.boss .. "  ·  " .. h.diff)
  -- chips: the newest five
  local n = #DB.pulls
  local first = math.max(1, n - #chips + 1)
  for i = 1, #chips do
    local b, k = chips[i], first + i - 1
    local q = DB.pulls[k]
    if q and (DB.show or {}).chips ~= false then
      local kill = q.h.kill
      b.t:SetText("Pull " .. q.h.pull .. "  ·  " .. (kill and "Kill" or (q.h.pct ~= "" and (q.h.pct .. "%") or "Wipe")))
      chipColors(b, kill and COL.goodBg or COL.badBg, k == DB.cur and COL.gold or (kill and COL.goodBg or COL.badBg), kill and COL.goodT or COL.badT)
      b:SetWidth(b.t:GetStringWidth() + 20)
      b:ClearAllPoints()
      if i == 1 then b:SetPoint("TOPLEFT", card, "TOPLEFT", PAD, -110) else b:SetPoint("LEFT", chips[i - 1], "RIGHT", 6, 0) end
      b:SetScript("OnClick", function() showPull(k) end)
      b:Show()
    else b:Hide() end
  end
  bossT:SetText("")
  resT:SetText(h.boss); resT:SetWidth(W - PAD * 2 - 110)
  pill.t:SetText(h.kill and "Kill" or ("Wipe" .. (h.pct ~= "" and ("  ·  " .. h.pct .. "%") or "")))
  pill.t:SetTextColor(rgb(h.kill and COL.goodT or COL.badT)); pill:SetWidth(pill.t:GetStringWidth() + 22)
  rounded(pill.fillT, "fill", 5, h.kill and COL.goodBg or COL.badBg, 1); rounded(pill.lineT, "line", 5, h.kill and "2b5a36" or "6a2f2b", 1)
  local meta = { h.diff, "Pull " .. h.pull, h.dur }
  if h.where ~= "" then meta[#meta + 1] = h.where end
  meta[#meta + 1] = h.deaths .. (h.deaths == "1" and " death" or " deaths")
  metaT:SetText(table.concat(meta, "   ·   "))
  -- (tabs and the body sit lower when the pull chips show)
  TOPY = ((DB.show or {}).chips ~= false) and 180 or 150
  tMe:ClearAllPoints(); tMe:SetPoint("TOPLEFT", card, "TOPLEFT", PAD - 10, -TOPY + 38); tRaid:ClearAllPoints(); tRaid:SetPoint("LEFT", tMe, "RIGHT", 0, 0)
  nextB:ClearAllPoints(); nextB:SetPoint("TOPRIGHT", card, "TOPRIGHT", -PAD, -TOPY + 36)
  tabLine:ClearAllPoints(); tabLine:SetPoint("TOPLEFT", card, "TOPLEFT", 1, -TOPY + 12); tabLine:SetPoint("TOPRIGHT", card, "TOPRIGHT", -1, -TOPY + 12)
  body:ClearAllPoints(); body:SetPoint("TOPLEFT", card, "TOPLEFT", PAD, -TOPY)
  -- tabs
  local raidOk = canRaid()
  tRaid:SetShown(raidOk)
  if not raidOk then view = "me" end
  for k, b in pairs(tabs) do
    local on = (k == view)
    b.t:SetTextColor(rgb(on and COL.text or COL.muted)); b.u:SetShown(on)
    b:SetScript("OnClick", function() view = k; render() end)
  end
  local P = pickWho(m)
  local showWho = (view == "me" and P and #m.players > 1)
  who:SetShown(showWho); prevB:SetShown(showWho); nextB:SetShown(showWho)
  if P then who:SetText("|cff" .. classHex(P.cls) .. P.name .. "|r") end
  local function step(dir)
    local idx = 1; for i, p in ipairs(m.players) do if p == P then idx = i end end
    idx = ((idx - 1 + dir) % #m.players) + 1; DB.who = m.players[idx].name; render()
  end
  prevB:SetScript("OnClick", function() step(-1) end); nextB:SetScript("OnClick", function() step(1) end)

  -- body
  resetPool()
  local y = 2
  local SH = DB.show or {}
  -- a section: its heading folds it away (+ / -), and a "Show N more" line expands a long list
  local function section(key, title, list, limit, draw, empty)
    if SH[key] == false then return end
    local folded = DB.collapsed and DB.collapsed[key]
    local y0 = y; IND = 12; y = y + 12
    y = head(y, title, key, folded)
    if not folded then
      if #list == 0 then if empty then y = row(y, "ok", nil, empty) end
      else
        local n = EXPANDED[key] and #list or math.min(#list, limit)
        for i = 1, n do draw(list[i]) end
        if #list > n then y = moreLink(y, key, #list - n) end
      end
    end
    y = y + 3
    box(y0, y - y0, COL.raised, 1, COL.line, 1)
    IND = 0; y = y + 10
  end
  if view == "me" and P then
    -- the tile: your damage or healing, against your last pull and your best
    if SH.tile ~= false then
      local th = 62
      box(y, th, COL.raised, 1, COL.line, 1)
      icon(12, y + 13, 36, P.icon)
      local l = FS("body", 12.5, COL.muted); l:SetPoint("TOPLEFT", 60, -(y + 11)); l:SetText(P.role == "healer" and "Your healing" or "Your damage")
      local v = FS("head", 28, COL.text); v:SetPoint("TOPLEFT", 60, -(y + 26)); v:SetText(P.v)
      local u = FS("bold", 12, COL.muted); u:SetPoint("BOTTOMLEFT", v, "BOTTOMRIGHT", 5, 4); u:SetText(P.unit)
      local s = FS("body", 12.5, COL.faint); s:SetJustifyH("RIGHT"); s:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - 12, -(y + 11))
      local lines = {}
      if P.d and SH.vs ~= false then lines[#lines + 1] = (P.d >= 0 and ("|cff7ee08f+" .. P.d .. "%|r") or ("|cffff8f87" .. P.d .. "%|r")) .. " vs pull " .. P.vs end
      if SH.best ~= false then lines[#lines + 1] = (P.best ~= "" and ("Best " .. P.best .. " (pull " .. P.bp .. ")") or "First pull read") end
      if P.rank ~= "" and SH.rank ~= false then lines[#lines + 1] = P.rank end
      s:SetText(table.concat(lines, "\n"))
      y = y + th + 16
    end
    if not DB.compact then
      local rot = function() section("rotation", "Rotation", P.slips, DB.maxSlips or 3, function(r) y = row(y, r[1], r[2], r[3]) end, "No rotation checks for this spec yet.") end
      local bos = function() section("boss", "Boss mechanics", P.boss, DB.maxBoss or 2, function(r) y = row(y, r[1], r[2], r[3]) end, "No boss mistakes.") end
      if DB.bossFirst then bos(); rot() else rot(); bos() end
    end
    if P.next ~= "" and SH.next ~= false then y = nextBox(y + 2, P.next) end
  else
    section("mistakes", h.kill and "What to clean up" or "Top mistakes", m.raid.bad, DB.compact and 1 or (DB.maxRaid or 3), function(r) y = row(y, r[1], r[2], r[4], r[3]) end, "Nothing big.")
    if not DB.compact then
      section("died", "Who died", m.raid.died, DB.maxDied or 4, function(d)
        local t = FS("body", 13.5, COL.muted); t:SetPoint("TOPLEFT", IND, -y); t:SetText(d[1])
        local nm = FS("bold", 13.5, classHex(d[3])); nm:SetPoint("TOPLEFT", IND + 44, -y); nm:SetWidth(124); nm:SetWordWrap(false); nm:SetText(d[2])
        icon(IND + 174, y - 1, 18, d[4])
        local w = FS("body", 13.5, COL.muted); w:SetPoint("TOPLEFT", IND + 200, -y); w:SetWidth(CW - 200 - IND * 2); w:SetWordWrap(false); w:SetText(d[5])
        y = y + 23
      end, "Nobody died.")
      if m.raid.more ~= "" and SH.died ~= false and not (DB.collapsed and DB.collapsed.died) then local t = FS("body", 12.5, COL.faint); t:SetPoint("TOPLEFT", 2, -(y - 2)); t:SetText(m.raid.more); y = y + 20 end
    end
    if m.raid.next ~= "" and SH.next ~= false then y = nextBox(y + 2, m.raid.next) end
  end
  body:SetHeight(math.max(10, y))
  footLine:ClearAllPoints(); footLine:SetPoint("TOPLEFT", card, "TOPLEFT", 1, -(TOPY + y + 10)); footLine:SetPoint("TOPRIGHT", card, "TOPRIGHT", -1, -(TOPY + y + 10))
  foot:ClearAllPoints(); foot:SetPoint("TOPLEFT", card, "TOPLEFT", PAD, -(TOPY + y + 19))
  card:SetHeight(TOPY + y + 42)
end

-- ---------- keeping pulls, showing the card ----------
local function sameAs(a, b) return a.h.boss == b.h.boss and a.h.pull == b.h.pull and a.h.dur == b.h.dur end
local function addPull(m)
  for i, q in ipairs(DB.pulls) do if sameAs(q, m) then DB.cur = i; return false end end
  DB.pulls[#DB.pulls + 1] = m
  while #DB.pulls > (DB.keep or 30) do table.remove(DB.pulls, 1) end
  DB.cur = #DB.pulls; DB.who = nil; wipe(EXPANDED)
  return true
end
local pendingShow = false
local function showCard()
  -- (never pops up mid-fight: it waits until you're out of combat)
  if InCombatLockdown() then pendingShow = true; return end
  card:Show(); render()
  if DB.sound ~= false and SOUNDKIT and SOUNDKIT.IG_QUEST_LOG_OPEN then PlaySound(SOUNDKIT.IG_QUEST_LOG_OPEN) end
end

-- ---------- sharing with the raid: one person pastes, everyone with Debrief gets their card ----------
local PREFIX = "DebriefR"
if C_ChatInfo and C_ChatInfo.RegisterAddonMessagePrefix then C_ChatInfo.RegisterAddonMessagePrefix(PREFIX) end
local function groupChannel()
  if not IsInGroup() then return nil end
  return IsInGroup(2) and "INSTANCE_CHAT" or "RAID" -- (as boss mods do: RAID also reaches a party)
end
local outQ = {}
local sender = CreateFrame("Frame"); sender:Hide()
local wait = 0
sender:SetScript("OnUpdate", function(self, el)
  wait = wait - el
  if wait > 0 then return end
  local m = outQ[1]
  if not m then self:Hide(); return end
  local res = C_ChatInfo.SendAddonMessage(PREFIX, m[1], m[2])
  -- (about 3 parts a second, under the game's limit. Midnight blocks addon messages during a boss (code 11): those wait
  -- for the fight to end. Throttled ones (3, 8, 9) wait a second and go again; anything else is dropped.)
  if type(res) == "number" and res > 0 then
    if res == 11 then wait = 3
    elseif res == 3 or res == 8 or res == 9 then m[3] = (m[3] or 0) + 1; wait = 1; if m[3] > 30 then table.remove(outQ, 1) end
    else table.remove(outQ, 1); wait = 0.34 end
  elseif res == false then m[3] = (m[3] or 0) + 1; wait = 1.5; if m[3] > 30 then table.remove(outQ, 1) end
  else table.remove(outQ, 1); wait = 0.34 end
end)
local function share(code)
  if DB.share == false then return end
  local ch = groupChannel(); if not ch then return end
  local id, at, n, parts = string.format("%04x", math.random(0, 65535)), 1, 0, {}
  while at <= #code do
    local e = math.min(#code, at + 229)
    -- (never cut a letter like ë in half)
    while e < #code and e > at do local b = code:byte(e + 1); if b and b >= 128 and b < 192 then e = e - 1 else break end end
    parts[#parts + 1] = code:sub(at, e); at = e + 1
  end
  n = #parts
  for i, p in ipairs(parts) do outQ[#outQ + 1] = { id .. ":" .. i .. "/" .. n .. ":" .. p, ch } end
  sender:Show()
  say("sending this pull to your group (" .. n .. " parts, about " .. math.ceil(n * 0.34) .. " s). Raiders with Debrief get their card by itself.")
end
local inbox = {}
local function receive(code, from)
  local m = decode(code)
  if not m then return end
  if addPull(m) then
    say("pull " .. m.h.pull .. " of " .. m.h.boss .. " is in, from " .. from .. ".")
    if DB.autoShow ~= false then showCard() else say("type /debrief to see it.") end
  end
end
local function onAddonMessage(prefix, text, channel, from)
  if prefix ~= PREFIX or not text then return end
  local short = from and from:match("^([^%-]+)") or from or "?"
  if short == UnitName("player") then return end
  local id, i, n, chunk = text:match("^(%x+):(%d+)/(%d+):(.*)$")
  if not id then return end
  i, n = tonumber(i), tonumber(n)
  local key = (from or "?") .. id
  local box = inbox[key]
  if not box then box = { n = n, got = 0, parts = {} }; inbox[key] = box end
  if not box.parts[i] then box.parts[i] = chunk; box.got = box.got + 1 end
  if box.got >= box.n then inbox[key] = nil; receive(table.concat(box.parts), short) end
end

-- ---------- import (your own paste) ----------
local function import(text)
  local m, err = decode(text)
  if not m then pMsg:SetTextColor(rgb(COL.badT)); pMsg:SetText(err); return false end
  addPull(m)
  DB.pasted = true
  paste:Hide(); showCard()
  say("pull " .. m.h.pull .. " of " .. m.h.boss .. " loaded.")
  share(text)
  return true
end
eb:SetScript("OnTextChanged", function(self, userInput)
  local t = self:GetText()
  if grabbed and userInput and t ~= "" and t:sub(1, 1) ~= "D" then grabbed = false; self:SetText(""); self:ClearFocus(); return end
  if t and #t > 6 and t:find("%^Z%s*$") then
    if import(t) then self:SetText("") end
  end
end)
eb:SetScript("OnEnterPressed", function(self) local t = self:GetText(); if t ~= "" and import(t) then self:SetText("") end end)

-- ---------- settings: the website's look (tabs with a gold underline, rows with a plain line each, slim controls) ----------
-- /debrief options, the AddOns button by the minimap, or Options > AddOns > Debrief. Every change saves and shows at once.
local opt
local refreshers = {}
local FONT_CHOICES = { { "debrief", "Debrief (website)" }, { "wow", "WoW default" }, { "arial", "Arial Narrow" }, { "morpheus", "Morpheus headings" } }
local WIDTH_CHOICES = { { "narrow", "Narrow" }, { "normal", "Normal" }, { "wide", "Wide" } }
local function applySettings()
  reapplyFonts()
  card:SetScale(DB.scale or 1); paste:SetScale(DB.scale or 1)
  rounded(card.fillT, "fill", 8, COL.bg, DB.alpha or 0.97)
  if card:IsShown() then render() end
end
function Debrief_RefreshOptions() for _, f in ipairs(refreshers) do f() end end
local function optButton(parent, label, w, primary, h)
  local b = CreateFrame("Button", nil, parent); b:SetSize(w, h or 28)
  skin(b, 5, primary and COL.gold or COL.raised, 1, primary and COL.gold or COL.line2, 1)
  b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 13); b.t:SetPoint("CENTER", 0, 0); b.t:SetText(label)
  b.t:SetTextColor(rgb(primary and "1b1406" or COL.text))
  b.primary = primary
  b:SetScript("OnEnter", function() if not b.primary then rounded(b.lineT, "line", 5, COL.faint, 1) end end)
  b:SetScript("OnLeave", function() if not b.primary then rounded(b.lineT, "line", 5, COL.line2, 1) end end)
  return b
end
local OW, OP = 540, 22 -- (window width, side padding)
local function buildOptions()
  opt = CreateFrame("Frame", "DebriefOptions", UIParent)
  opt:SetSize(OW, 560); opt:SetPoint("CENTER", -250, 20); opt:SetFrameStrata("DIALOG"); opt:SetClampedToScreen(true); opt:Hide()
  skin(opt, 8, COL.bg, 0.98, COL.line2, 1, true)
  opt:SetMovable(true); opt:EnableMouse(true); opt:RegisterForDrag("LeftButton")
  opt:SetScript("OnDragStart", opt.StartMoving); opt:SetScript("OnDragStop", opt.StopMovingOrSizing)
  tinsert(UISpecialFrames, "DebriefOptions")
  -- the top: logo, name, close
  local lg = opt:CreateTexture(nil, "ARTWORK"); lg:SetSize(18, 20); lg:SetPoint("TOPLEFT", OP, -16); lg:SetTexture(MEDIA .. "Media\\logo")
  local tt = opt:CreateFontString(nil, "OVERLAY"); setFont(tt, "head", 20); tt:SetPoint("LEFT", lg, "RIGHT", 9, 0); tt:SetTextColor(rgb(COL.text)); tt:SetText("Debrief")
  local ts = opt:CreateFontString(nil, "OVERLAY"); setFont(ts, "body", 14); ts:SetPoint("LEFT", tt, "RIGHT", 8, -1); ts:SetTextColor(rgb(COL.muted)); ts:SetText("Settings")
  local cl = closeButton(opt); cl:SetScript("OnClick", function() opt:Hide() end)

  -- how much the card shows: one segmented control, always in view
  local seg = CreateFrame("Frame", nil, opt); seg:SetPoint("TOPLEFT", OP, -56); seg:SetSize(OW - OP * 2, 34); skin(seg, 5, "13161d", 1, COL.line2, 1)
  local SW = (OW - OP * 2 - 8) / 3
  local pbs = {}
  for i, k in ipairs({ "simple", "medium", "heavy" }) do
    local b = CreateFrame("Button", nil, seg); b:SetSize(SW, 26); b:SetPoint("TOPLEFT", 4 + (i - 1) * SW, -4)
    skin(b, 5, COL.gold, 1, COL.gold, 1)
    b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 13.5); b.t:SetPoint("CENTER", 0, 0); b.t:SetText(PRESET_NAME[k])
    b:SetScript("OnClick", function() Debrief_SetPreset(k); applySettings() end)
    b:SetScript("OnEnter", function() if DB.preset ~= k then b.t:SetTextColor(rgb(COL.text)) end end)
    b:SetScript("OnLeave", function() if DB.preset ~= k then b.t:SetTextColor(rgb(COL.muted)) end end)
    pbs[k] = b
  end
  local qs = opt:CreateFontString(nil, "OVERLAY"); setFont(qs, "body", 12.5); qs:SetPoint("TOPLEFT", OP, -98); qs:SetWidth(OW - OP * 2); qs:SetJustifyH("LEFT"); qs:SetTextColor(rgb(COL.faint))
  local DESC = { simple = "Your numbers, your top slip and the next pull. Quick to read between pulls.",
    medium = "Your numbers, 3 rotation slips, your boss mistakes and the next pull. The everyday choice.",
    heavy = "Everything, on a wider card: 5 slips, 3 boss lines, 5 raid mistakes and 8 deaths." }
  refreshers[#refreshers + 1] = function()
    for k, b in pairs(pbs) do
      local on = DB.preset == k
      rounded(b.fillT, "fill", 5, COL.gold, on and 1 or 0); rounded(b.lineT, "line", 5, COL.gold, on and 1 or 0)
      b.t:SetTextColor(rgb(on and "1b1406" or COL.muted))
    end
    qs:SetText(DB.preset and DESC[DB.preset] or "Your own mix, from the settings below.")
  end

  -- tabs, the website's way: a gold line under the open one
  local TABS = { { "card", "Card" }, { "raid", "Raid view" }, { "look", "Look" }, { "after", "After a pull" }, { "pulls", "Saved pulls" } }
  local tabY = 124
  local tl = opt:CreateTexture(nil, "ARTWORK"); tl:SetPoint("TOPLEFT", 1, -(tabY + 30)); tl:SetPoint("TOPRIGHT", -1, -(tabY + 30)); tl:SetHeight(1); fill(tl, COL.line)
  local pages, tabBtns, cur = {}, {}, "card"
  local function showTab(k)
    cur = k
    for kk, p in pairs(pages) do p:SetShown(kk == k) end
    for kk, b in pairs(tabBtns) do local on = kk == k; b.t:SetTextColor(rgb(on and COL.text or COL.muted)); b.u:SetShown(on) end
  end
  local tx = OP - 10
  for _, t in ipairs(TABS) do
    local b = CreateFrame("Button", nil, opt); b:SetHeight(30); b:SetPoint("TOPLEFT", tx, -tabY)
    b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 14); b.t:SetPoint("CENTER", 0, 1); b.t:SetText(t[2])
    b:SetWidth(b.t:GetStringWidth() + 20); tx = tx + b:GetWidth()
    b.u = b:CreateTexture(nil, "OVERLAY"); b.u:SetPoint("BOTTOMLEFT", 8, 0); b.u:SetPoint("BOTTOMRIGHT", -8, 0); b.u:SetHeight(2); fill(b.u, COL.gold)
    b:SetScript("OnClick", function() showTab(t[1]) end)
    b:SetScript("OnEnter", function() if cur ~= t[1] then b.t:SetTextColor(rgb(COL.text)) end end)
    b:SetScript("OnLeave", function() if cur ~= t[1] then b.t:SetTextColor(rgb(COL.muted)) end end)
    tabBtns[t[1]] = b
    local p = CreateFrame("Frame", nil, opt); p:SetPoint("TOPLEFT", 0, -(tabY + 31)); p:SetPoint("TOPRIGHT", 0, -(tabY + 31)); p:SetHeight(360); p:Hide()
    pages[t[1]] = p
  end

  -- a settings row: the name, a plain line under it, the control at the right; thin lines between rows
  local P, y
  local function page(k) P = pages[k]; y = 8 end
  local function custom() DB.preset = nil; Debrief_RefreshOptions() end
  local function rowBase(label, sub)
    local h = sub and 52 or 40
    local t = P:CreateFontString(nil, "OVERLAY"); setFont(t, "bold", 14); t:SetPoint("TOPLEFT", OP, -(y + (sub and 9 or 12))); t:SetTextColor(rgb(COL.text)); t:SetText(label)
    if sub then local s2 = P:CreateFontString(nil, "OVERLAY"); setFont(s2, "body", 12.5); s2:SetPoint("TOPLEFT", OP, -(y + 28)); s2:SetWidth(300); s2:SetJustifyH("LEFT"); s2:SetWordWrap(false); s2:SetTextColor(rgb(COL.faint)); s2:SetText(sub) end
    local ln = P:CreateTexture(nil, "ARTWORK"); ln:SetPoint("TOPLEFT", OP, -(y + h)); ln:SetPoint("TOPRIGHT", -OP, -(y + h)); ln:SetHeight(1); fill(ln, COL.line, 0.6)
    local cy = y + h / 2
    y = y + h
    return cy
  end
  -- slim on/off switch
  local function switch(label, sub, get, set, keepPreset)
    local cy = rowBase(label, sub)
    local b = CreateFrame("Button", nil, P); b:SetSize(36, 20); b:SetPoint("RIGHT", P, "TOPRIGHT", -OP, -cy)
    b.tr = b:CreateTexture(nil, "ARTWORK"); b.tr:SetAllPoints()
    b.trL = b:CreateTexture(nil, "OVERLAY"); b.trL:SetAllPoints()
    b.k = b:CreateTexture(nil, "OVERLAY", nil, 2); b.k:SetSize(14, 14); b.k:SetTexture(SLICE .. "dot")
    local function show()
      local on = get()
      rounded(b.tr, "fill", 8, on and COL.gold or COL.raised, 1); rounded(b.trL, "line", 8, on and COL.gold or COL.line2, 1)
      b.k:ClearAllPoints(); b.k:SetPoint("CENTER", b, on and "RIGHT" or "LEFT", on and -10 or 10, 0); b.k:SetVertexColor(rgb(on and "1b1406" or COL.muted))
    end
    b:SetScript("OnClick", function() set(not get()); if not keepPreset then custom() end; show(); applySettings() end)
    refreshers[#refreshers + 1] = show; show()
  end
  -- − 3 + stepper for counts
  local function stepper(label, sub, minV, maxV, get, set, fmt, keepPreset, step)
    local cy = rowBase(label, sub)
    local plus = optButton(P, "+", 28, false, 26); plus:SetPoint("RIGHT", P, "TOPRIGHT", -OP, -cy)
    local val = P:CreateFontString(nil, "OVERLAY"); setFont(val, "head", 17); val:SetWidth(54); val:SetJustifyH("CENTER"); val:SetPoint("RIGHT", plus, "LEFT", -4, 0); val:SetTextColor(rgb(COL.text))
    local minus = optButton(P, "–", 28, false, 26); minus:SetPoint("RIGHT", val, "LEFT", -4, 0)
    local function show() val:SetText((fmt or tostring)(get())) end
    local function go(d) local v = math.max(minV, math.min(maxV, get() + d)); if v ~= get() then set(v); if not keepPreset then custom() end; show(); applySettings() end end
    minus:SetScript("OnClick", function() go(-(step or 1)) end); plus:SetScript("OnClick", function() go(step or 1) end)
    refreshers[#refreshers + 1] = show; show()
  end
  -- percentage slider with its value in a small chip
  local function pslider(label, sub, minV, maxV, get, set)
    local cy = rowBase(label, sub)
    local chip = CreateFrame("Frame", nil, P); chip:SetSize(52, 24); chip:SetPoint("RIGHT", P, "TOPRIGHT", -OP, -cy); skin(chip, 5, "13161d", 1, COL.line2, 1)
    chip.t = chip:CreateFontString(nil, "OVERLAY"); setFont(chip.t, "bold", 12.5); chip.t:SetPoint("CENTER", 0, 0); chip.t:SetTextColor(rgb(COL.text))
    local s = CreateFrame("Slider", nil, P); s:SetSize(150, 16); s:SetPoint("RIGHT", chip, "LEFT", -12, 0); s:SetOrientation("HORIZONTAL")
    s:SetMinMaxValues(minV, maxV); s:SetValueStep(0.05); if s.SetObeyStepOnDrag then s:SetObeyStepOnDrag(true) end
    local track = s:CreateTexture(nil, "BACKGROUND"); track:SetPoint("LEFT", 0, 0); track:SetPoint("RIGHT", 0, 0); track:SetHeight(4); fill(track, COL.line2)
    local fillT = s:CreateTexture(nil, "BORDER"); fillT:SetPoint("LEFT", 0, 0); fillT:SetHeight(4); fill(fillT, COL.gold)
    local thumb = s:CreateTexture(nil, "ARTWORK"); thumb:SetTexture(SLICE .. "dot"); thumb:SetSize(14, 14); thumb:SetVertexColor(rgb(COL.text)); s:SetThumbTexture(thumb)
    local busy = false
    local function paint(v) fillT:SetWidth(math.max(1, 150 * (v - minV) / (maxV - minV))); chip.t:SetText(math.floor(v * 100 + 0.5) .. "%") end
    s:SetScript("OnValueChanged", function(self, v) v = math.floor(v * 20 + 0.5) / 20; paint(v); if busy or v == get() then return end; set(v); applySettings() end)
    s:EnableMouseWheel(true); s:SetScript("OnMouseWheel", function(self, d) self:SetValue(math.max(minV, math.min(maxV, self:GetValue() + d * 0.05))) end)
    local function show() busy = true; s:SetValue(get()); paint(get()); busy = false end
    refreshers[#refreshers + 1] = show; show()
  end
  -- a choice from a short list: < value >
  local function choice(label, sub, list, get, set, keepPreset)
    local cy = rowBase(label, sub)
    local nx = optButton(P, ">", 28, false, 26); nx:SetPoint("RIGHT", P, "TOPRIGHT", -OP, -cy)
    local val = P:CreateFontString(nil, "OVERLAY"); setFont(val, "bold", 13.5); val:SetWidth(130); val:SetJustifyH("CENTER"); val:SetPoint("RIGHT", nx, "LEFT", -4, 0); val:SetTextColor(rgb(COL.text))
    local pv = optButton(P, "<", 28, false, 26); pv:SetPoint("RIGHT", val, "LEFT", -4, 0)
    local function idx() for i, c in ipairs(list) do if c[1] == get() then return i end end return 1 end
    local function show() val:SetText(list[idx()][2]) end
    local function go(d) local i = ((idx() - 1 + d) % #list) + 1; set(list[i][1]); if not keepPreset then custom() end; show(); applySettings() end
    pv:SetScript("OnClick", function() go(-1) end); nx:SetScript("OnClick", function() go(1) end)
    refreshers[#refreshers + 1] = show; show()
  end
  local function S() DB.show = DB.show or {}; return DB.show end

  page("card")
  switch("Compact", "Just your numbers and the next pull.", function() return DB.compact == true end, function(v) DB.compact = v end)
  switch("Your damage or healing", "With vs last pull, your best and your place.", function() return S().tile ~= false end, function(v) S().tile = v end)
  stepper("Rotation lines", "Your biggest slips, worst first. 0 hides them.", 0, 5, function() return S().rotation == false and 0 or (DB.maxSlips or 3) end, function(v) S().rotation = v > 0; if v > 0 then DB.maxSlips = v end end)
  stepper("Boss mechanics lines", "Your own mistakes on the pull. 0 hides them.", 0, 3, function() return S().boss == false and 0 or (DB.maxBoss or 2) end, function(v) S().boss = v > 0; if v > 0 then DB.maxBoss = v end end)
  switch("Boss mechanics first", "Show them above your rotation.", function() return DB.bossFirst == true end, function(v) DB.bossFirst = v end)
  switch("Next pull", "One thing to try next time.", function() return S().next ~= false end, function(v) S().next = v end)
  switch("Pull chips", "Your last pulls along the top of the card.", function() return S().chips ~= false end, function(v) S().chips = v end)

  page("raid")
  switch("Raid view for everyone", "Off: only raid leads and assistants see it.", function() return DB.raidAlways ~= false end, function(v) DB.raidAlways = v end, true)
  stepper("Raid mistakes", "The biggest ones, with names.", 1, 5, function() return DB.maxRaid or 3 end, function(v) DB.maxRaid = v end)
  stepper("Deaths listed", "Who died first, and to what.", 1, 8, function() return DB.maxDied or 4 end, function(v) DB.maxDied = v end)
  switch("Send my pastes to my group", "Raiders with Debrief get their card by itself.", function() return DB.share ~= false end, function(v) DB.share = v end, true)

  page("look")
  choice("Card width", nil, WIDTH_CHOICES, function() return DB.width or "normal" end, function(v) DB.width = v end)
  choice("Font", nil, FONT_CHOICES, function() return DB.font or "debrief" end, function(v) DB.font = v end, true)
  pslider("Text size", nil, 0.85, 1.2, function() return DB.fontScale or 1 end, function(v) DB.fontScale = v end)
  pslider("Card size", nil, 0.7, 1.5, function() return DB.scale or 1 end, function(v) DB.scale = v end)
  pslider("Background", "How solid the card is.", 0.6, 1, function() return DB.alpha or 0.97 end, function(v) DB.alpha = v end)

  page("after")
  switch("Open the card by itself", "When your pull arrives from the group.", function() return DB.autoShow ~= false end, function(v) DB.autoShow = v end, true)
  switch("Paste box after boss pulls", "For whoever runs Debrief Companion.", function() return DB.autoBox ~= false end, function(v) DB.autoBox = v end, true)
  switch("Ready for Ctrl+V", "Any other key closes it so you can move.", function() return DB.autoFocus ~= false end, function(v) DB.autoFocus = v end, true)
  switch("Sound", "A soft sound when a card arrives.", function() return DB.sound ~= false end, function(v) DB.sound = v end, true)
  switch("Combat log in raids", "Turns on by itself, so nobody forgets.", function() return DB.autoLog ~= false end, function(v) DB.autoLog = v end, true)

  page("pulls")
  stepper("Keep", "Older pulls drop off as new ones come in.", 10, 100, function() return DB.keep or 30 end, function(v) DB.keep = v end, function(v) return v .. "" end, true, 5)
  y = y + 18
  local b1 = optButton(P, "Show a demo", 150, true); b1:SetPoint("TOPLEFT", OP, -y); b1:SetScript("OnClick", function() SlashCmdList.DEBRIEF("demo") end)
  local b2 = optButton(P, "Move card back", 150); b2:SetPoint("LEFT", b1, "RIGHT", 10, 0); b2:SetScript("OnClick", function() SlashCmdList.DEBRIEF("reset") end)
  local b3 = optButton(P, "Clear saved pulls", 150); b3:SetPoint("LEFT", b2, "RIGHT", 10, 0); b3:SetScript("OnClick", function() SlashCmdList.DEBRIEF("clear") end)

  local ft = opt:CreateFontString(nil, "OVERLAY"); setFont(ft, "body", 11.5); ft:SetPoint("BOTTOMLEFT", OP, 14); ft:SetTextColor(rgb(COL.faint))
  ft:SetText("Saves as you go  ·  Click a heading on the card to fold it  ·  Version " .. ((C_AddOns and C_AddOns.GetAddOnMetadata and C_AddOns.GetAddOnMetadata(ADDON, "Version")) or ""))
  opt:SetHeight(tabY + 31 + 380 + 40)
  showTab("card")
  Debrief_RefreshOptions()
end
function Debrief_ToggleOptions()
  if not DB then return end
  if not opt then buildOptions() end
  if opt:IsShown() then opt:Hide(); return end
  Debrief_RefreshOptions(); opt:Show()
  -- (the card beside it, so every change shows at once: the last pull, or the demo when there's none yet)
  if #DB.pulls == 0 then SlashCmdList.DEBRIEF("demo") else card:Show(); render() end
end
function Debrief_OnAddonCompartmentClick() Debrief_ToggleOptions() end
-- (in WoW's own Options > AddOns list too)
local function registerSettings()
  if not (Settings and Settings.RegisterCanvasLayoutCategory and Settings.RegisterAddOnCategory) then return end
  local p = CreateFrame("Frame"); p:Hide()
  local t = p:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge"); t:SetPoint("TOPLEFT", 16, -16); t:SetText("Debrief")
  local d = p:CreateFontString(nil, "OVERLAY", "GameFontHighlight"); d:SetPoint("TOPLEFT", 16, -44); d:SetWidth(560); d:SetJustifyH("LEFT")
  d:SetText("Your pull recap in game. Choose how much the card shows (Simple, Medium, Heavy or your own mix), the font and sizes, and what happens after a pull.")
  local b = CreateFrame("Button", nil, p, "UIPanelButtonTemplate"); b:SetSize(200, 26); b:SetPoint("TOPLEFT", 16, -80); b:SetText("Open Debrief settings")
  b:SetScript("OnClick", function() if SettingsPanel and SettingsPanel:IsShown() then HideUIPanel(SettingsPanel) end; if not (opt and opt:IsShown()) then Debrief_ToggleOptions() end end)
  local cat = Settings.RegisterCanvasLayoutCategory(p, "Debrief"); Settings.RegisterAddOnCategory(cat)
end

-- ---------- opening it: key, slash command ----------
local grabbed = false
function Debrief_OpenPaste(noFocus)
  pMsg:SetTextColor(rgb(COL.faint))
  if DB and DB.testMode and noFocus then
    pMsg:SetText("Test mode: click the box, then Ctrl+V. /debrief demo shows a sample. /debrief test turns this off.")
  else
    pMsg:SetText(noFocus and "Pull over: press Ctrl+V now. Any other key closes this so you can move." or "Nothing is typed into the game for you. The card opens as soon as you paste.")
  end
  eb:SetText(""); paste:Show()
  -- (after a pull it comes up ready for Ctrl+V; any other key lets go at once, so you can move again)
  if noFocus and DB and DB.autoFocus == false then eb:ClearFocus() else eb:SetFocus(); grabbed = noFocus and true or false end
end
function Debrief_Toggle()
  if card:IsShown() then card:Hide() elseif DB and DB.pulls and #DB.pulls > 0 then card:Show(); render() else Debrief_OpenPaste() end
end
BINDING_HEADER_DEBRIEF = "Debrief"
BINDING_NAME_DEBRIEF_PASTE = "Paste a pull recap"
BINDING_NAME_DEBRIEF_TOGGLE = "Show or hide the recap card"

SLASH_DEBRIEF1 = "/debrief"
SlashCmdList.DEBRIEF = function(msg)
  msg = (msg or ""):lower():gsub("^%s+", ""):gsub("%s+$", "")
  if msg == "options" or msg == "config" or msg == "settings" or msg == "o" then Debrief_ToggleOptions()
  elseif msg == "paste" or msg == "p" then Debrief_OpenPaste()
  elseif msg == "raid" then DB.raidAlways = not DB.raidAlways; say("Raid view " .. (DB.raidAlways and "always on." or "only when you lead or assist.")); if card:IsShown() then render() end
  elseif msg == "reset" then DB.pos = nil; card:ClearAllPoints(); card:SetPoint("CENTER", 260, 60); say("card moved back to the middle.")
  elseif msg == "clear" then DB.pulls = {}; DB.cur = nil; card:Hide(); say("pulls cleared.")
  elseif msg == "demo" then
    -- (the built-in sample pull: the card with no paste, not sent to the group)
    local m = decode(SAMPLE)
    if m then addPull(m); paste:Hide(); showCard(); say("showing a sample Heroic Ula'tek kill (made-up names). Use the arrows to see other players.") end
  elseif msg == "log" then DB.autoLog = (DB.autoLog == false); say("combat log in raids " .. (DB.autoLog ~= false and "turns on by itself." or "is up to you (/combatlog).")); autoLog()
  elseif msg == "focus" then DB.autoFocus = (DB.autoFocus == false); say("paste box ready for Ctrl+V after a pull " .. (DB.autoFocus ~= false and "on." or "off: click it first."))
  elseif msg == "test" then DB.testMode = not DB.testMode; say("test mode " .. (DB.testMode and "on: the box pops up after every fight and when you log in." or "off: the box only pops up after boss pulls."))
  elseif msg == "share" then DB.share = (DB.share == false); say("sharing your pastes with the group " .. (DB.share ~= false and "on." or "off."))
  elseif msg == "auto" then DB.autoBox = (DB.autoBox == false); say("paste box after each boss pull " .. (DB.autoBox ~= false and "on." or "off."))
  elseif msg == "help" then say("/debrief options: your settings. /debrief: show or hide the card. /debrief paste: paste a new pull. /debrief demo: a sample card. /debrief test: test mode on or off. /debrief log: combat log in raids on or off. /debrief focus: paste box ready for Ctrl+V on or off. /debrief raid: Raid view on or off. /debrief share: send your pastes to the group on or off. /debrief auto: paste box after each pull on or off. /debrief reset: move the card back.")
  else Debrief_Toggle() end
end

local ev = CreateFrame("Frame")
ev:RegisterEvent("ADDON_LOADED"); ev:RegisterEvent("PLAYER_LOGIN"); ev:RegisterEvent("CHAT_MSG_ADDON"); ev:RegisterEvent("PLAYER_REGEN_ENABLED"); ev:RegisterEvent("ENCOUNTER_END"); ev:RegisterEvent("PLAYER_ENTERING_WORLD"); ev:RegisterEvent("ZONE_CHANGED_NEW_AREA")
-- (combat logging on in raids, so nobody has to type /combatlog; Advanced Combat Logging too. Debrief Companion reads the log)
local weLog, logPending = false, false
local function autoLog()
  if not DB or DB.autoLog == false or not LoggingCombat then return end
  if InCombatLockdown() then logPending = true; return end
  local inInst, kind = IsInInstance()
  if inInst and kind == "raid" then
    if not LoggingCombat() then
      if GetCVar and SetCVar and GetCVar("advancedCombatLogging") ~= "1" then SetCVar("advancedCombatLogging", 1) end
      LoggingCombat(true); weLog = true
      say("combat log is on for this raid. /debrief log turns this off.")
    end
  elseif weLog and LoggingCombat() then LoggingCombat(false); weLog = false end
end
-- (test mode: the box also comes up after any fight and when you log in, so the whole thing can be tried on a training dummy)
local function testBox(delay)
  if not (DB and DB.testMode and C_Timer) then return end
  C_Timer.After(delay, function() if not InCombatLockdown() and not paste:IsShown() then Debrief_OpenPaste(true) end end)
end
ev:SetScript("OnEvent", function(self, e, arg, a2, a3, a4)
  if e == "CHAT_MSG_ADDON" then
    if DB then onAddonMessage(arg, a2, a3, a4) end
  elseif e == "PLAYER_REGEN_ENABLED" then
    if pendingShow then pendingShow = false; showCard() end
    testBox(1.5)
    if logPending then logPending = false; autoLog() end
  elseif e == "PLAYER_ENTERING_WORLD" then
    if arg or a2 then testBox(4) end -- (on login or /reload, not every loading screen)
    if C_Timer then C_Timer.After(2, autoLog) end
  elseif e == "ZONE_CHANGED_NEW_AREA" then
    if C_Timer then C_Timer.After(2, autoLog) end
  elseif e == "ENCOUNTER_END" then
    -- (for whoever runs Debrief Companion: the paste box comes up by itself a few seconds after a boss pull, ready for Ctrl+V)
    if DB and (DB.pasted or DB.testMode) and DB.autoBox ~= false and C_Timer then
      C_Timer.After(4, function() if not InCombatLockdown() and not paste:IsShown() then Debrief_OpenPaste(true) end end)
    end
  elseif e == "ADDON_LOADED" and arg == ADDON then
    DebriefDB = DebriefDB or {}
    DB = DebriefDB
    DB.pulls = DB.pulls or {}
    if DB.raidAlways == nil then DB.raidAlways = true end
    DB.show = DB.show or {}
    if DB.preset == nil and DB.maxSlips == nil and DB.compact == nil then DB.preset = "medium" end
    registerSettings()
    reapplyFonts(); card:SetScale(DB.scale or 1); paste:SetScale(DB.scale or 1); rounded(card.fillT, "fill", 8, COL.bg, DB.alpha or 0.97)
    if DB.testMode == nil then DB.testMode = false end -- (/debrief test turns it on: the box after every fight)
    if DB.pos then card:ClearAllPoints(); card:SetPoint(DB.pos[1], UIParent, DB.pos[2], DB.pos[3], DB.pos[4]) end
  elseif e == "PLAYER_LOGIN" then
    -- (a key to start with: Ctrl+Shift+D opens the paste box, if nothing else uses it; change it in Options > Keybindings > AddOns)
    if not DB.keySet and not InCombatLockdown() and GetBindingAction and GetBindingAction("CTRL-SHIFT-D") == "" then
      if SetBinding("CTRL-SHIFT-D", "DEBRIEF_PASTE") then SaveBindings(GetCurrentBindingSet()) end
      DB.keySet = true
    end
    say("ready. After a pull: press Ctrl+Shift+D (or /debrief paste), then Ctrl+V." .. (DB.testMode and " Test mode is on: /debrief demo shows a sample card." or ""))
  end
end)
