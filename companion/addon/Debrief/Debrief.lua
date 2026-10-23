local detailBtn, PRESET_NAME, render -- (shared by parts below)
local onShow, miniShow, autoLog, mini, big, bigRender, grabbed
-- Debrief: your pull recap, in game.
-- Debrief Companion (the small app on your PC) reads your combat log when a boss pull ends and copies a short code.
-- Press your Debrief key (Ctrl+Shift+D unless you change it) or type /debrief paste, then Ctrl+V: the card shows.
-- The addon never reads files or combat data itself (Midnight blocks that in combat); it only shows what you paste.

local ADDON = ...
local DB

-- ---------- Debrief's colours and type (the same as the website) ----------
local COL = { bg = "171a22", head = "13161d", raised = "1e222c", line = "2a2f3b", line2 = "353b49", text = "ece8df", muted = "98a0ad",
  faint = "6c7381", soft = "d6d1c6", gold = "e6b450", good = "45c15c", goodT = "7ee08f", goodBg = "17301e", bad = "e5534b", badT = "ff8f87", badBg = "3a1d1d", warn = "e8a23a" }
-- (the accent colour: gold like the website, your class colour, or one of these)
local ACCENTS = { gold = "e6b450", frost = "3fc7eb", fel = "45c15c", crimson = "e5534b", violet = "a78bfa" }
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
-- (fonts your other addons share through LibSharedMedia, by name: "lsm:Expressway")
local function lsmFonts() local L = LibStub and LibStub("LibSharedMedia-3.0", true); return L, (L and L.List and L:List("font")) or {} end
local function fontSet(key)
  if type(key) == "string" and key:sub(1, 4) == "lsm:" then
    local L = lsmFonts(); local p = L and L:Fetch("font", key:sub(5), true)
    if p then return { body = p, bold = p, head = p } end
  end
  return FONTSETS[key or "debrief"] or FONT
end
local function setFont(fs, kind, size)
  FONTREG[fs] = { kind, size }
  local set = fontSet(DebriefDB and DebriefDB.font)
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
  local m, by = { players = {}, raid = { bad = {}, died = {}, mech = {}, cons = {}, tiles = {}, good = {}, fixes = {}, ghap = {}, gchg = {}, more = "", next = "", story = "", better = "", worse = "", ghead = "", gnext = "" } }, {}
  for _, r in ipairs(split(code, "^")) do
    local f = split(r, "~")
    -- (the wipe filter: K~versions~line is a line only some "stop at death" numbers have, e.g. K~012~R~... is in 0, 1 and 2)
    local K
    if f[1] == "K" then K = f[2]; table.remove(f, 1); table.remove(f, 1) end
    local t = f[1]
    local function g(i) return f[i] or "" end
    local function add(list, item) item.k = K; list[#list + 1] = item end
    -- (the coach box: one per wipe-filter version on a wipe (Oct 22); m.coach is version 0, the whole pull)
    local function coaches()
      local o = {}
      if not m.cutN then m.coach = m.coach or { wrong = {}, right = {}, deaths = {}, avoid = {} }; o[1] = m.coach; return o end
      m.coachV = m.coachV or {}
      for v = 0, m.cutN do local s = tostring(v); if not K or K:find(s, 1, true) then m.coachV[s] = m.coachV[s] or { wrong = {}, right = {}, deaths = {}, avoid = {} }; o[#o + 1] = m.coachV[s] end end
      m.coach = m.coachV["0"] or m.coach; return o
    end
    if t == "H" then
      m.h = { boss = g(2), diff = g(3), pull = g(4), kill = g(5) == "1", pct = g(6), dur = g(7), where = g(8), deaths = g(9) }
    elseif t == "P" then
      local p = { name = g(2), cls = g(3), spec = g(4), role = g(5), unit = g(6), v = g(7), d = tonumber(g(8)), vs = g(9), best = g(10), bp = g(11), rank = g(12), icon = g(13), slips = {}, boss = {}, surv = {}, tiles = {}, next = "", next2 = "" }
      m.players[#m.players + 1] = p; by[p.name] = p
    elseif t == "S" and by[g(2)] then add(by[g(2)].slips, { g(3), g(4), g(5) })
    elseif t == "B" and by[g(2)] then add(by[g(2)].boss, { g(3), g(4), g(5) })
    elseif t == "U" and by[g(2)] then add(by[g(2)].surv, { g(3), g(4), g(5) }) -- (survival: defensives)
    elseif t == "HP" and by[g(2)] then local p = by[g(2)]; p.cons = p.cons or {}; add(p.cons, { g(3), g(4), g(5) }) -- (your Healthstone and potion)
    elseif t == "RH" then add(m.raid.cons, { g(2), g(3), g(4) }) -- (the raid's Healthstones and potions)
    elseif t == "N" and by[g(2)] then local p = by[g(2)]; if K then p.nextK = p.nextK or {}; table.insert(p.nextK, { K, g(3) }) else p.next = g(3) end
    elseif t == "T" and by[g(2)] then add(by[g(2)].tiles, { g(3), g(4), g(5), g(6) }) -- (the Detailed card's number tiles)
    elseif t == "O" and by[g(2)] then local p = by[g(2)]; if K then p.next2K = p.next2K or {}; table.insert(p.next2K, { K, g(3) }) else p.next2 = g(3) end
    elseif t == "A" then add(m.raid.tiles, { g(2), g(3), g(4), g(5) }) -- (the Debriefing tab's four raid numbers)
    elseif t == "W" then add(m.raid.good, { "ok", nil, g(2) }) -- (the Glance card: went well)
    elseif t == "F" then add(m.raid.fixes, { g(2), nil, g(3) }) -- (and fix next)
    elseif t == "GH" then add(m.raid.ghap, { g(2), nil, g(3) }) -- (the bullet summary: what happened)
    elseif t == "GC" then add(m.raid.gchg, { "next", nil, g(2) }) -- (and what to change next)
    elseif t == "Y" or t == "G" or t == "J" or t == "L" or t == "I" or t == "NX" then local k = ({ Y = "story", G = "better", J = "worse", L = "lead", I = "ghead", NX = "gnext" })[t]; if K then m.raid[k .. "K"] = m.raid[k .. "K"] or {}; table.insert(m.raid[k .. "K"], { K, g(2) }) else m.raid[k] = g(2) end
    elseif t == "E" and by[g(2)] then local p = by[g(2)]; if K then p.leadK = p.leadK or {}; table.insert(p.leadK, { K, g(3) }) else p.lead = g(3) end -- (the raid lead's word to you)
    elseif t == "R" then add(m.raid.bad, { g(2), g(3), g(4), g(5) })
    elseif t == "D" then add(m.raid.died, { g(2), g(3), g(4), g(5), g(6) })
    elseif t == "M" then add(m.raid.mech, { g(2), g(3), g(4), g(5) }) -- (how each boss mechanic went)
    elseif t == "V" then m.addonV = g(2) -- (the addon version the PC app that made this carries)
    -- (Debriefing's coach box, per wipe-filter version)
    elseif t == "CH" then for _, c in ipairs(coaches()) do c.head = g(2) end
    elseif t == "CF" then for _, c in ipairs(coaches()) do c.focus = g(2); c.focusSame = g(3) == "1"; c.kill = g(4) == "1" end
    elseif t == "CW" then for _, c in ipairs(coaches()) do table.insert(c.wrong, { sev = g(2), id = g(3), label = g(4), tag = g(5), what = g(6), fix = g(7) }) end
    elseif t == "CR" then for _, c in ipairs(coaches()) do table.insert(c.right, { id = g(2), t = g(3) }) end
    elseif t == "CD" then for _, c in ipairs(coaches()) do table.insert(c.deaths, { t = g(2), who = g(3), cls = g(4), id = g(5), ab = g(6), k = g(7), story = g(8) }) end
    elseif t == "CN" then for _, c in ipairs(coaches()) do c.dnote = g(2) end
    elseif t == "CL" then for _, c in ipairs(coaches()) do c.dline = g(2) end
    elseif t == "CA" then for _, c in ipairs(coaches()) do table.insert(c.avoid, { id = g(2), k = g(3), who = g(4), cls = g(5), n = g(6), bad = g(7) == "1", story = g(8) }) end
    elseif t == "CV" then for _, c in ipairs(coaches()) do c.aline = g(2) end
    elseif t == "PC" and by[g(2)] then by[g(2)].coach = { head = g(3), focus = g(4) } -- (your own coach line and focus)
    elseif t == "C" then m.cutN = tonumber(g(2)) -- (the wipe filter: versions 0 to n)
    elseif t == "RG" then m.grade = { letter = g(2), score = g(3), cats = g(4) } -- (the Report card's grade for the pull)
    elseif t == "X" then if K then m.raid.moreK = m.raid.moreK or {}; table.insert(m.raid.moreK, { K, g(2) }) else m.raid.more = g(2) end
    elseif t == "Q" then if K then m.raid.nextK = m.raid.nextK or {}; table.insert(m.raid.nextK, { K, g(2) }) else m.raid.next = g(2) end
    end
  end
  if not m.h then return nil, "That code has no pull in it. Copy it again from Debrief Companion." end
  m.h.practice = m.h.diff == "Practice" -- (a training dummy: no kill or wipe)
  return m
end

-- how a pull's result reads (Kill, Wipe at 24%, or Practice), and its colours: text, fill, outline
local function resultOf(h, long)
  if h.practice or h.diff == "Practice" then return "Practice", COL.muted, COL.raised, COL.line2 end
  if h.kill then return "Kill", COL.goodT, COL.goodBg, "2b5a36" end
  if long then return "Wipe" .. (h.pct ~= "" and ("  ·  " .. h.pct .. "%") or ""), COL.badT, COL.badBg, "6a2f2b" end
  return (h.pct ~= "" and (h.pct .. "%") or "Wipe"), COL.badT, COL.badBg, "6a2f2b"
end
-- (a pull to try the card with: a real Heroic Ula'tek kill with made-up names; /debrief demo shows it)
local SAMPLE = [==[DBF1^H~Ula'tek~Heroic~3~1~0~7:30~~6^P~Ironvow~PALADIN~Protection Paladin~tank~DPS~148k~-13~2~171k~2~~ability_paladin_shieldofthetemplar^S~Ironvow~warn~389539~Opener, step by step: 3 of 4. Missed: step 1, Hand of Reckoning (not in your opener).^S~Ironvow~warn~~Stat order: Crit › Mastery › Haste › Vers. Yours: Critical Strike 1,198, then Mastery 1,041, then Haste 979, then Versatility 0.^N~Ironvow~Follow the guide opener: Hand of Reckoning, then 3 of Avenger's Shield, Sentinel, Avenging Wrath or Divine Toll, in any order.^P~Lumensong~PALADIN~Holy Paladin~healer~HPS~333k~5~2~317k~2~1st of 4 healers~spell_holy_holybolt^S~Lumensong~warn~200025~Beacon of Virtue: 63%. It sat ready for 168 seconds.^S~Lumensong~warn~223819~Divine Purpose: 4 wasted. 2 were lost to a Divine Toll pressed while you still held one.^S~Lumensong~bad~82326~Mana at the kill: 60%. About a few more Holy Lights were left in it.^U~Lumensong~ok~498~Defensives: Divine Protection 2 of 4, Lay on Hands 1 of 1.^U~Lumensong~ok~6262~Healthstone: used at 2:10.^U~Lumensong~info~inv_alchemy_70_red~Health potion: not used.^N~Lumensong~Press Beacon of Virtue as the damage goes out, close to every 15 seconds. From 0:52, it sat ready for 36 seconds.^P~Dawnmender~PALADIN~Holy Paladin~healer~HPS~316k~13~2~280k~2~2nd of 4 healers~spell_holy_holybolt^S~Dawnmender~warn~223819~Divine Purpose: 6 wasted. 3 were lost to a Divine Toll pressed while you still held one.^S~Dawnmender~warn~31821~Cooldowns into the big hits: 1 of 3. 1 of your 3 healing cooldowns went out in the heaviest damage of the pull.^S~Dawnmender~warn~31884~Casting in Avenging Wrath: 83%. You were casting for 83% of your Avenging Wrath windows.^B~Dawnmender~dead~1286835~You died at 3:50 to Necrotic Vapors.^N~Dawnmender~Spend Divine Purpose before it runs out, or before a new one replaces it. Your first wasted one was at 2:50.^P~Thornroot~DRUID~Restoration Druid~healer~HPS~281k~-1~2~284k~2~3rd of 4 healers~spell_nature_healingtouch^S~Thornroot~warn~391528~Convoke the Spirits uses: 6 of 8. It sat ready for 2 minutes in all.^S~Thornroot~bad~48438~Mana at the kill: 58%. About 13 more Wild Growths were left in it at the kill.^S~Thornroot~warn~263725~Clearcasting: 11 wasted. 9 were replaced by a new one while you still had it.^N~Thornroot~Press Convoke the Spirits a little sooner each time it comes back.^P~Arcspark~MAGE~Arcane Mage~dps~DPS~275k~31~2~210k~2~3rd of 21 DPS~spell_holy_magicalsentry^S~Arcspark~warn~30451~Rotation priority: 77% of your casts were the best button to press.^S~Arcspark~warn~30451~Always be casting: 72%. Your longest stretch with nothing pressed was 6 seconds, at 3:22, while you were moving.^S~Arcspark~warn~321507~Touch of the Magi on cooldown: 8 of 10. It sat ready, unused, for 2 minutes in all.^N~Arcspark~With Clearcasting and under 12 Arcane Salvo, Arcane Missiles comes first. Not in Arcane Soul, where each Barrage gives you Clearcasting and Salvo back.^P~Frostwhisper~MAGE~Frost Mage~dps~DPS~156k~-36~2~244k~2~17th of 21 DPS~spell_frost_frostbolt02^S~Frostwhisper~bad~116~Always be casting: 70%. Your longest stretch with nothing pressed was 5 seconds, at 1:52, while you were moving.^S~Frostwhisper~bad~190446~Brain Freeze: 3 wasted. You got 24 procs.^S~Frostwhisper~warn~269748~Ray of Frost on cooldown: 6 of 8. It sat ready, unused, for 21 seconds in all.^B~Frostwhisper~dead~1301007~You died at 4:20 to Unchecked Rage.^N~Frostwhisper~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.^R~warn~1292403~Caustic Waves~5 players. @Moonquill, @Mistpalm, @Grimshade, @Voidfang and 1 more. Dodge the venom waves from Ula'tek and her tail.^R~bad~1301007~Unchecked Rage~1 time. Nobody was in melee of Ula'tek, so she hit the raid.^D~2:44~Hawkfeather~HUNTER~6603~Melee^D~2:46~Stonefist~WARRIOR~6603~Melee^D~3:50~Dawnmender~PALADIN~1286835~Necrotic Vapors^D~3:53~Jadewind~MONK~6603~Melee^X~+2 more by 7:30.^Q~Kill! Next time: Dodge the venom waves from Ula'tek and her tail.^Z]==]

-- ---------- small helpers for drawing ----------
local NOICON = { ok = "Interface\\RaidFrame\\ReadyCheck-Ready", bad = "Interface\\RaidFrame\\ReadyCheck-NotReady", dead = "Interface\\RaidFrame\\ReadyCheck-NotReady" }
local function iconPath(x, flag)
  if not x or x == "" then return flag and (NOICON[flag] or "Interface\\RaidFrame\\ReadyCheck-Waiting") or "Interface\\Icons\\INV_Misc_QuestionMark" end
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
local pLogo = paste:CreateTexture(nil, "ARTWORK"); pLogo:SetSize(20, 20); pLogo:SetPoint("TOPLEFT", 14, -12); pLogo:SetTexture(MEDIA .. "Media\\logo")
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

-- ---------- the after-pull prompt: "See your recap? Press Ctrl+V", with no paste box to look at ----------
-- (WoW never lets an addon read the clipboard, so a paste is the only way in: the box is still there, just hidden inside this prompt)
local toast = CreateFrame("Button", "DebriefToast", UIParent)
toast:SetSize(340, 56); toast:SetPoint("TOP", 0, -160); toast:SetFrameStrata("DIALOG"); toast:SetClampedToScreen(true); toast:Hide()
skin(toast, 8, COL.bg, 0.97, COL.gold, 0.55, true)
toast:SetMovable(true); toast:RegisterForDrag("LeftButton")
toast:SetScript("OnDragStart", function() if not DB.lock then toast:StartMoving() end end)
toast:SetScript("OnDragStop", function() toast:StopMovingOrSizing(); local p, _, rp, x, y = toast:GetPoint(); DB.toastPos = { p, rp, x, y } end)
local tLogo = toast:CreateTexture(nil, "ARTWORK"); tLogo:SetSize(22, 22); tLogo:SetPoint("LEFT", 14, 0); tLogo:SetTexture(MEDIA .. "Media\\logo")
local tTitle = toast:CreateFontString(nil, "OVERLAY"); setFont(tTitle, "head", 17); tTitle:SetPoint("TOPLEFT", 42, -10); tTitle:SetTextColor(rgb(COL.text)); tTitle:SetText("See your recap?")
local tSub = toast:CreateFontString(nil, "OVERLAY"); setFont(tSub, "body", 12.5); tSub:SetPoint("TOPLEFT", 42, -31); tSub:SetWidth(214); tSub:SetJustifyH("LEFT"); tSub:SetWordWrap(false); tSub:SetTextColor(rgb(COL.muted))
local tKey = CreateFrame("Frame", nil, toast); tKey:SetSize(62, 26); tKey:SetPoint("RIGHT", -38, 0); skin(tKey, 5, COL.raised, 1, COL.line2, 1)
tKey.t = tKey:CreateFontString(nil, "OVERLAY"); setFont(tKey.t, "bold", 13); tKey.t:SetPoint("CENTER", 0, 0); tKey.t:SetTextColor(rgb(COL.text)); tKey.t:SetText("Ctrl+V")
local tClose = closeButton(toast); tClose:ClearAllPoints(); tClose:SetPoint("RIGHT", -8, 0)
local function toastSay(text, hex) tSub:SetTextColor(rgb(hex or COL.muted)); tSub:SetText(text) end
local function toastReady(on) rounded(tKey.fillT, "fill", 5, on and COL.gold or COL.raised, 1); rounded(tKey.lineT, "line", 5, on and COL.gold or COL.line2, 1); tKey.t:SetTextColor(rgb(on and "1b1406" or COL.text)) end
-- (the box moves into the prompt, out of sight, or back into the paste window)
local function boxIn(host)
  eb:ClearAllPoints()
  if host == toast then eb:SetParent(toast); eb:SetPoint("TOPLEFT", toast, "TOPLEFT", 0, 0); eb:SetSize(1, 1); eb:SetAlpha(0)
  else eb:SetParent(ebBg); eb:SetPoint("TOPLEFT", 10, -2); eb:SetPoint("BOTTOMRIGHT", -10, 2); eb:SetAlpha(1) end
end
local function closeToast() toast:Hide() end
toast:SetScript("OnHide", function() eb:ClearFocus(); boxIn(paste) end)
tinsert(UISpecialFrames, "DebriefToast")
tClose:SetScript("OnClick", closeToast)
-- (clicking the prompt gets it ready again after you moved or typed)
toast:SetScript("OnClick", function() eb:SetText(""); eb:SetFocus(); grabbed = false; toastReady(true); toastSay("Press Ctrl+V now.") end)
eb:SetScript("OnEditFocusLost", function() rounded(ebBg.lineT, "line", 5, COL.line2, 1); if toast:IsShown() then toastReady(false); toastSay("Click here, then Ctrl+V.") end end)
eb:SetScript("OnEscapePressed", function() paste:Hide(); if toast:IsShown() then closeToast() end end)

-- ---------- the card ----------
local W, PAD, TOPY = 400, 14, 172
local CW = W - PAD * 2
local WIDTHS = { narrow = 360, normal = 400, wide = 480, large = 560, xl = 680 }
local card = CreateFrame("Frame", "DebriefCard", UIParent)
card:SetSize(W, 300); card:SetPoint("CENTER", 260, 60); card:SetFrameStrata("HIGH"); card:SetClampedToScreen(true); card:Hide()
skin(card, 8, COL.bg, 0.97, COL.line2, 1, true)
card:SetMovable(true); card:EnableMouse(true)
tinsert(UISpecialFrames, "DebriefCard")

-- the top: drag it to move the card
local top = CreateFrame("Frame", nil, card); top:SetPoint("TOPLEFT", 0, 0); top:SetPoint("TOPRIGHT", -36, 0); top:SetHeight(40)
top:EnableMouse(true); top:RegisterForDrag("LeftButton")
top:SetScript("OnDragStart", function() if not DB.lock then card:StartMoving() end end)
top:SetScript("OnDragStop", function()
  card:StopMovingOrSizing()
  local p, _, rp, x, y = card:GetPoint(); DB.pos = { p, rp, x, y }
end)
local logo = top:CreateTexture(nil, "ARTWORK"); logo:SetSize(20, 20); logo:SetPoint("TOPLEFT", PAD, -12); logo:SetTexture(MEDIA .. "Media\\logo")
local title = top:CreateFontString(nil, "OVERLAY"); setFont(title, "head", 17); title:SetPoint("LEFT", logo, "RIGHT", 7, 0); title:SetTextColor(rgb(COL.text)); title:SetText("Debrief")
local bossT = top:CreateFontString(nil, "OVERLAY"); setFont(bossT, "body", 13); bossT:SetPoint("LEFT", title, "RIGHT", 9, -1); bossT:SetTextColor(rgb(COL.muted)); bossT:SetWidth(250); bossT:SetJustifyH("LEFT"); bossT:SetWordWrap(false)
-- detail presets: one click sets how much the card shows (Simple / Medium / Heavy); any change by hand makes it Custom
PRESET_NAME = { glance = "Glance", simple = "Simple", medium = "Medium", heavy = "Heavy", detailed = "Detailed" }
local PRESETS = {
  simple = { compact = true, maxSlips = 1, maxBoss = 1, maxRaid = 1, maxDied = 0, maxMech = 3, width = "normal", show = { rank = false, best = false } },
  medium = { compact = false, maxSlips = 3, maxBoss = 4, maxRaid = 3, maxDied = 3, maxMech = 6, width = "normal", show = {} },
  heavy = { compact = false, maxSlips = 5, maxBoss = 7, maxRaid = 5, maxDied = 6, maxMech = 12, width = "wide", show = {} },
  -- (the default since Oct 22: the raid lead's quick read, the good and the bad, one view for everyone)
  glance = { compact = false, maxSlips = 3, maxBoss = 4, maxRaid = 3, maxDied = 3, maxMech = 6, width = "wide", glance = true, show = {} },
  -- (a larger card with number tiles, the raid's side on your own view, and two next-pull tips)
  detailed = { compact = false, maxSlips = 4, maxBoss = 5, maxRaid = 5, maxDied = 3, maxMech = 12, width = "xl", detailed = true, show = {} },
}
function Debrief_SetPreset(key)
  local p = PRESETS[key]; if not p or not DB then return end
  DB.compact, DB.maxSlips, DB.maxBoss, DB.maxRaid, DB.maxDied, DB.maxMech, DB.width = p.compact, p.maxSlips, p.maxBoss, p.maxRaid, p.maxDied, p.maxMech, p.width
  DB.detailed = p.detailed or nil; DB.glance = p.glance or nil
  DB.show = {}; for k, v in pairs(p.show) do DB.show[k] = v end
  DB.collapsed = nil; DB.coachOpen = nil; DB.preset = key
  if Debrief_RefreshOptions then Debrief_RefreshOptions() end
  if card:IsShown() then render() end
end
local close = closeButton(card)
close:SetScript("OnClick", function() card:Hide() end)
-- (the Detail button on the card: Simple, Medium, Heavy, one click each)
detailBtn = CreateFrame("Button", nil, card); detailBtn:SetSize(70, 22); detailBtn:SetPoint("RIGHT", close, "LEFT", -6, 0)
skin(detailBtn, 5, COL.raised, 1, COL.line2, 1)
detailBtn.t = detailBtn:CreateFontString(nil, "OVERLAY"); setFont(detailBtn.t, "bold", 11.5); detailBtn.t:SetPoint("CENTER", 0, 0); detailBtn.t:SetTextColor(rgb(COL.muted)); detailBtn.t:SetText("Medium")
detailBtn:SetScript("OnClick", function() local order = { glance = "simple", simple = "medium", medium = "heavy", heavy = "detailed", detailed = "glance" }; Debrief_SetPreset(order[DB.preset] or "glance") end)
detailBtn:SetScript("OnEnter", function() detailBtn.t:SetTextColor(rgb(COL.text)); GameTooltip:SetOwner(detailBtn, "ANCHOR_TOP"); GameTooltip:SetText("How much the card shows: Glance, Simple, Medium, Heavy or Detailed"); GameTooltip:Show() end)
detailBtn:SetScript("OnLeave", function() detailBtn.t:SetTextColor(rgb(COL.muted)); GameTooltip:Hide() end)
-- (the Expand button: the big window, with tonight's pulls and charts)
local bigBtn = CreateFrame("Button", nil, card); bigBtn:SetSize(64, 22); bigBtn:SetPoint("RIGHT", detailBtn, "LEFT", -6, 0)
skin(bigBtn, 5, COL.raised, 1, COL.line2, 1)
bigBtn.t = bigBtn:CreateFontString(nil, "OVERLAY"); setFont(bigBtn.t, "bold", 11.5); bigBtn.t:SetPoint("CENTER", 0, 0); bigBtn.t:SetTextColor(rgb(COL.muted)); bigBtn.t:SetText("Expand")
bigBtn:SetWidth(bigBtn.t:GetStringWidth() + 18)
bigBtn:SetScript("OnClick", function() card:Hide(); big:Show(); bigRender() end)
bigBtn:SetScript("OnEnter", function() bigBtn.t:SetTextColor(rgb(COL.text)); GameTooltip:SetOwner(bigBtn, "ANCHOR_TOP"); GameTooltip:SetText("The big window: tonight's pulls, charts and everything at once"); GameTooltip:Show() end)
bigBtn:SetScript("OnLeave", function() bigBtn.t:SetTextColor(rgb(COL.muted)); GameTooltip:Hide() end)
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
local metaT = card:CreateFontString(nil, "OVERLAY"); setFont(metaT, "body", 13); metaT:SetPoint("TOPLEFT", PAD, -82); metaT:SetTextColor(rgb(COL.muted)); metaT:SetJustifyH("LEFT"); metaT:SetWordWrap(false)

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

-- (the card's body scrolls with the mouse wheel when it's taller than the screen leaves room for (the Detailed card, Oct 21))
local scroller = CreateFrame("ScrollFrame", nil, card); scroller:SetPoint("TOPLEFT", PAD, -TOPY); scroller:SetSize(CW, 10)
local body = CreateFrame("Frame", nil, scroller); body:SetWidth(CW); body:SetHeight(10); scroller:SetScrollChild(body)
scroller:EnableMouseWheel(true)
scroller:SetScript("OnMouseWheel", function(self, d) local mx = math.max(0, (body:GetHeight() or 0) - (self:GetHeight() or 0)); self:SetVerticalScroll(math.min(mx, math.max(0, (self:GetVerticalScroll() or 0) - d * 48))) end)
local foot = card:CreateFontString(nil, "OVERLAY"); setFont(foot, "body", 11.5); foot:SetTextColor(rgb(COL.faint)); foot:SetJustifyH("LEFT")
foot:SetText("/dbr opens this again  ·  /db settings")
local footLine = card:CreateTexture(nil, "ARTWORK"); footLine:SetHeight(1); fill(footLine, COL.line)
-- (combat logging on or off, at the right of the footer: green when it's on, red when it's off)
local logBtn = CreateFrame("Button", nil, card); logBtn:SetSize(120, 20)
logBtn.t = logBtn:CreateFontString(nil, "OVERLAY"); setFont(logBtn.t, "bold", 11.5); logBtn.t:SetPoint("RIGHT", 0, 0); logBtn.t:SetJustifyH("RIGHT")
function Debrief_LogButton()
  local on = LoggingCombat and LoggingCombat()
  logBtn.t:SetText(on and "|cff7ee08fLogging: On|r" or "|cffff8f87Logging: Off|r")
  logBtn:SetWidth(math.max(60, logBtn.t:GetStringWidth() + 4))
end
logBtn:SetScript("OnClick", function() Debrief_ToggleLog() end)
logBtn:SetScript("OnEnter", function() GameTooltip:SetOwner(logBtn, "ANCHOR_TOP"); GameTooltip:SetText("Combat logging, with Advanced Combat Logging. Click to turn it on or off. You can also set a key: Options > Keybindings > AddOns > Debrief."); GameTooltip:Show() end)
logBtn:SetScript("OnLeave", function() GameTooltip:Hide() end)

-- pooled pieces for the body (redrawn each time): text, plain textures, rounded textures
local pool = { fs = {}, tex = {}, rt = {}, btn = {} }
local used = { fs = 0, tex = 0, rt = 0, btn = 0 }
local EXPANDED = {} -- (lists opened with "Show N more", until the next pull)
local IND = 0 -- (rows sit this far in, inside a section panel)
local function resetPool()
  used.fs, used.tex, used.rt, used.btn, used.ln = 0, 0, 0, 0, 0
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
local function icon(x, y, size, id, flag)
  local t = TEX("ARTWORK"); t:SetPoint("TOPLEFT", x, -y); t:SetSize(size, size); t:SetTexture(iconPath(id, flag))
  if id and id ~= "" then t:SetTexCoord(0.08, 0.92, 0.08, 0.92) else t:SetTexCoord(0, 1, 0, 1) end
  return t
end
local FLAG = { ok = COL.good, warn = COL.warn, bad = COL.bad, dead = COL.faint }
local CUR -- the pull on show
-- "333k" -> 333, "1.2m" -> 1200 (thousands), for goals and charts
local function parseK(v)
  local n, u = tostring(v or ""):gsub(",", ""):match("([%d%.]+)%s*([kKmM]?)")
  n = tonumber(n) or 0
  if u == "m" or u == "M" then return n * 1000 elseif u == "k" or u == "K" then return n end
  return n / 1000
end
-- your own line in a pull (nil when you weren't in it, as in the demo)
local function youIn(m)
  local me = UnitName("player")
  for _, p in ipairs(m.players) do if p.name == me or p.name:match("^([^%-]+)") == me then return p end end
end
-- your goal for this role (thousands per second; 0 = none), shown only on your own numbers
local function goalFor(P, m)
  if not P or not DB then return 0 end
  local you = m and youIn(m)
  if you and P ~= you then return 0 end
  if not you and DB.who then return 0 end
  return (P.role == "healer" and DB.goalHps or DB.goalDps) or 0
end
-- leave only what went wrong (Style: "Only what went wrong")
local function onlyBad(list)
  if not DB.onlyBad then return list end
  local o = {}; for _, r in ipairs(list) do if r[1] ~= "ok" and r[1] ~= "info" then o[#o + 1] = r end end
  return o
end
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
  icon(IND + 16, y, 20, ic, flag)
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

-- (the wipe filter: on a wipe, stop counting at this death; 0 is off. A pull with fewer deaths than that counts in full)
local function ordN(n) local s = ({ "st", "nd", "rd" })[n % 10]; if n % 100 >= 11 and n % 100 <= 13 or not s then s = "th" end; return n .. s end
local function cutIdx(m)
  local c = DB.deathCut or 0
  if not m or not m.cutN or (m.h and m.h.kill) or c > m.cutN then return 0 end
  return c
end
local SEVR = { dead = 0, bad = 0, warn = 1 }
local function cutView(m)
  if not m or not m.cutN then return m end
  local c = tostring(cutIdx(m))
  local function keep(list, sort)
    local o, at = {}, {}; for i, r in ipairs(list or {}) do r._i = nil; if not r.k or r.k:find(c, 1, true) then o[#o + 1] = r; at[r] = i end end
    if sort then table.sort(o, function(a, b) local x, y = SEVR[a[1]] or 2, SEVR[b[1]] or 2; if x ~= y then return x < y end; return at[a] < at[b] end) end
    return o
  end
  local function pick(def, kl) if kl then for _, x in ipairs(kl) do if x[1]:find(c, 1, true) then return x[2] end end; return "" end; return def end
  local v = { h = m.h, addonV = m.addonV, cutN = m.cutN, coach = (m.coachV and m.coachV[c] and (m.coachV[c].head or "") ~= "" and m.coachV[c]) or m.coach, grade = m.grade, players = {},
    raid = { bad = keep(m.raid.bad, true), died = keep(m.raid.died), mech = keep(m.raid.mech, true), cons = keep(m.raid.cons), more = pick(m.raid.more, m.raid.moreK), next = pick(m.raid.next, m.raid.nextK),
      tiles = keep(m.raid.tiles), story = pick(m.raid.story or "", m.raid.storyK), better = pick(m.raid.better or "", m.raid.betterK), worse = pick(m.raid.worse or "", m.raid.worseK), lead = pick(m.raid.lead or "", m.raid.leadK),
      good = keep(m.raid.good), fixes = keep(m.raid.fixes), ghap = keep(m.raid.ghap), gchg = keep(m.raid.gchg), ghead = pick(m.raid.ghead or "", m.raid.gheadK), gnext = pick(m.raid.gnext or "", m.raid.gnextK) } }
  for _, p in ipairs(m.players) do
    local q = {}; for k, x in pairs(p) do q[k] = x end
    q.slips, q.boss, q.surv, q.next, q.cons = keep(p.slips), keep(p.boss), keep(p.surv), pick(p.next, p.nextK), keep(p.cons)
    q.tiles, q.next2, q.lead = keep(p.tiles), pick(p.next2 or "", p.next2K), pick(p.lead or "", p.leadK)
    v.players[#v.players + 1] = q
  end
  return v
end

local function showPull(i)
  if not DB.pulls[i] then return end
  DB.cur = i; wipe(EXPANDED); scroller:SetVerticalScroll(0); render()
end
-- (WoW allows a function 60 outside locals: render's small helpers sit in one table so it stays well under (Oct 22))
-- (the card's small charts (Oct 22): every pull on this boss tonight, as a line; the best one marked)
local GRADEC = { S = "ff8000", A = "a335ee", B = "0070dd", C = "1eff00", D = "ece8df", F = "9d9d9d" }
local function cardLine(x1, y1, x2, y2, hex, w)
  if not body.CreateLine then return end
  used.ln = (used.ln or 0) + 1; pool.ln = pool.ln or {}
  local l = pool.ln[used.ln]; if not l then l = body:CreateLine(nil, "ARTWORK"); pool.ln[used.ln] = l end
  l:SetStartPoint("TOPLEFT", body, x1, -y1); l:SetEndPoint("TOPLEFT", body, x2, -y2); l:SetThickness(w or 2); l:SetColorTexture(rgb(hex)); l:Show()
end
local function cardChart(y, title, pts, curPull, fmt)
  local h = 78
  local bg = TEX("BACKGROUND"); bg:SetPoint("TOPLEFT", 0, -y); bg:SetSize(CW, h); rounded(bg, "fill", 8, COL.raised, (DB.cardStyle == "glass") and 0.55 or 1)
  local t = FS("bold", 10.5, COL.faint); t:SetPoint("TOPLEFT", 12, -(y + 9)); t:SetText(string.upper(title))
  if #pts < 2 then local n = FS("body", 12, COL.faint); n:SetPoint("TOPLEFT", 12, -(y + 30)); n:SetWidth(CW - 24); n:SetText("Shows once you have two pulls on this boss tonight."); return y + h + 8 end
  local lo, hi, best = math.huge, -math.huge, 1
  for i, p in ipairs(pts) do lo = math.min(lo, p[2]); hi = math.max(hi, p[2]); if p[2] >= pts[best][2] then best = i end end
  if hi == lo then hi = lo + 1 end
  local x0, x1, y0, y1 = 16, CW - 16, y + 30, y + h - 12
  local function px(i) return x0 + (i - 1) * (x1 - x0) / (#pts - 1) end
  local function py(v) return y1 - (y1 - y0) * (v - lo) / (hi - lo) end
  local function mix(i) local f = (i - 1) / math.max(1, #pts - 1); local a1, a2, a3 = rgb(COL.gold); local b1, b2, b3 = rgb("5fdc7a"); return string.format("%02x%02x%02x", (a1 + (b1 - a1) * f) * 255, (a2 + (b2 - a2) * f) * 255, (a3 + (b3 - a3) * f) * 255) end
  for i = 2, #pts do cardLine(px(i - 1), py(pts[i - 1][2]), px(i), py(pts[i][2]), mix(i), 2) end
  for i, p in ipairs(pts) do
    local d = TEX("OVERLAY"); d:SetTexture(SLICE .. "dot"); local big = p[1] == curPull; d:SetSize(big and 9 or 6, big and 9 or 6); d:SetPoint("CENTER", body, "TOPLEFT", px(i), -py(p[2])); d:SetVertexColor(rgb(big and "5fdc7a" or mix(i)))
  end
  local b = FS("bold", 11, "5fdc7a"); b:SetJustifyH("RIGHT"); b:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - 12, -(y + 9)); b:SetText("Best: pull " .. pts[best][1] .. (fmt and (" · " .. fmt(pts[best][2])) or ""))
  return y + h + 8
end
local function cardCharts(y, raw, P, SH)
  local list = {}; for _, q in ipairs(DB.pulls) do if q.h and q.h.boss == raw.h.boss and q.h.diff == raw.h.diff then list[#list + 1] = q end end
  if SH.chartNight then
    local pts = {}; for _, q in ipairs(list) do local v = q.h.kill and 100 or (tonumber(q.h.pct) and (100 - tonumber(q.h.pct))); if v then pts[#pts + 1] = { q.h.pull, v } end end
    y = cardChart(y, "How far each pull got", pts, raw.h.pull, function(v) return v >= 100 and "kill" or (math.floor(100 - v + 0.5) .. "% left") end)
  end
  if SH.chartLine and P then
    local pts = {}; for _, q in ipairs(list) do for _, p in ipairs(q.players or {}) do if p.name == P.name then local v = parseK(p.v); if v and v > 0 then pts[#pts + 1] = { q.h.pull, v } end end end end
    y = cardChart(y, (P.role == "healer" and "Your healing" or "Your damage") .. " tonight", pts, raw.h.pull, function(v) return v >= 1000 and (string.format("%.2f", v / 1000):gsub("0+$", ""):gsub("%.$", "") .. "M") or (math.floor(v + 0.5) .. "k") end)
  end
  return y
end
local function cardGrade(y, gr)
  local h = 50
  local bg = TEX("BACKGROUND"); bg:SetPoint("TOPLEFT", 0, -y); bg:SetSize(CW, h); rounded(bg, "fill", 8, COL.raised, (DB.cardStyle == "glass") and 0.55 or 1)
  local L = string.sub(gr.letter or "", 1, 1)
  local lt = FS("head", 30, GRADEC[L] or COL.text); lt:SetPoint("TOPLEFT", 14, -(y + 8)); lt:SetText(gr.letter or "")
  local k = FS("bold", 10.5, COL.faint); k:SetPoint("TOPLEFT", 58, -(y + 9)); k:SetText("REPORT CARD  ·  " .. (gr.score or ""))
  local c = FS("body", 12.5, COL.soft); c:SetPoint("TOPLEFT", 58, -(y + 25)); c:SetWidth(CW - 70); c:SetWordWrap(false); c:SetText(gr.cats or "")
  return y + h + 8
end
local UI = { cardCharts = cardCharts, cardGrade = cardGrade, parseK = parseK, goalFor = goalFor, onlyBad = onlyBad, moreLink = moreLink, nextBox = nextBox, chipColors = chipColors, canRaid = canRaid, pickWho = pickWho, ordN = ordN, cutIdx = cutIdx, cutView = cutView, showPull = showPull, resultOf = resultOf, resetPool = resetPool, classHex = classHex, rounded = rounded }
function render()
  local raw = DB.pulls[DB.cur]; local m = UI.cutView(raw); CUR = m
  if not m then return end
  W = WIDTHS[DB.width or "normal"] or 400; CW = W - PAD * 2; card:SetWidth(W); body:SetWidth(CW); scroller:SetWidth(CW); bossT:SetWidth(W - 230)
  if detailBtn then detailBtn.t:SetText(PRESET_NAME[DB.preset] or "Custom"); detailBtn:SetWidth(detailBtn.t:GetStringWidth() + 18) end
  for _, c in ipairs(chips) do c:SetShown(false) end
  local h = m.h
  bossT:SetText(h.boss .. "  ·  " .. h.diff)
  -- chips: the newest ones, as many as fit across the card
  local n = #DB.pulls
  local first = math.max(1, n - #chips + 1)
  if (DB.show or {}).chips ~= false then
    local function chipW(q) local rt = UI.resultOf(q.h); chips[1].t:SetText("Pull " .. q.h.pull .. "  ·  " .. rt); return chips[1].t:GetStringWidth() + 20 end
    local total = 0; for k = first, n do total = total + chipW(DB.pulls[k]) + 6 end
    while first < n and total - 6 > CW do total = total - chipW(DB.pulls[first]) - 6; first = first + 1 end
  end
  for i = 1, #chips do
    local b, k = chips[i], first + i - 1
    local q = k <= n and DB.pulls[k] or nil
    if q and (DB.show or {}).chips ~= false then
      local rt, rc, rb = UI.resultOf(q.h)
      b.t:SetText("Pull " .. q.h.pull .. "  ·  " .. rt)
      UI.chipColors(b, rb, k == DB.cur and COL.gold or rb, rc)
      b:SetWidth(b.t:GetStringWidth() + 20)
      b:ClearAllPoints()
      if i == 1 then b:SetPoint("TOPLEFT", card, "TOPLEFT", PAD, -110) else b:SetPoint("LEFT", chips[i - 1], "RIGHT", 6, 0) end
      b:SetScript("OnClick", function() UI.showPull(k) end)
      b:Show()
    else b:Hide() end
  end
  bossT:SetText("")
  resT:SetText(h.boss); resT:SetWidth(W - PAD * 2 - 110)
  local rt, rc, rb, rl = UI.resultOf(h, true)
  pill.t:SetText(rt); pill.t:SetTextColor(rgb(rc)); pill:SetWidth(pill.t:GetStringWidth() + 22)
  UI.rounded(pill.fillT, "fill", 5, rb, 1); UI.rounded(pill.lineT, "line", 5, rl, 1)
  local meta = { h.diff, "Pull " .. h.pull, h.dur }
  if h.where ~= "" then meta[#meta + 1] = h.where end
  meta[#meta + 1] = h.deaths .. (h.deaths == "1" and " death" or " deaths")
  if DB.detailed and not DB.compact and view == "raid" and UI.canRaid() and #(m.raid.tiles or {}) > 0 then meta = { h.diff, "Pull " .. h.pull } end
  metaT:SetWidth(CW); metaT:SetText(table.concat(meta, "   ·   "))
  -- (tabs and the body sit lower when the pull chips show)
  local coachOn = m.coach and (m.coach.head or "") ~= "" and not m.h.practice and (DB.show or {}).coach ~= false -- (Debriefing's coach box on every style, with the Raid view and You tabs; the style decides how much is open (Oct 22))
  local glanceOn = DB.glance and (m.raid.ghead or "") ~= "" and not coachOn -- (the Glance card: one view, so no tabs; older pulls without it keep the tabs)
  if coachOn and not DB.viewPicked and UI.canRaid() then view = "raid" end -- (the coach box first, until you pick a tab yourself)
  TOPY = (((DB.show or {}).chips ~= false) and 180 or 150) - (glanceOn and 38 or 0)
  tMe:ClearAllPoints(); tMe:SetPoint("TOPLEFT", card, "TOPLEFT", PAD - 10, -TOPY + 38); tRaid:ClearAllPoints(); tRaid:SetPoint("LEFT", tMe, "RIGHT", 0, 0)
  nextB:ClearAllPoints(); nextB:SetPoint("TOPRIGHT", card, "TOPRIGHT", -PAD, -TOPY + 36)
  tabLine:ClearAllPoints(); tabLine:SetPoint("TOPLEFT", card, "TOPLEFT", 1, -TOPY + 12); tabLine:SetPoint("TOPRIGHT", card, "TOPRIGHT", -1, -TOPY + 12)
  scroller:ClearAllPoints(); scroller:SetPoint("TOPLEFT", card, "TOPLEFT", PAD, -TOPY)
  -- tabs
  local raidOk = UI.canRaid()
  tRaid:SetShown(raidOk and not glanceOn); tMe:SetShown(not glanceOn); tabLine:SetShown(not glanceOn)
  if not raidOk then view = "me" end
  for k, b in pairs(tabs) do
    local on = (k == view)
    b.t:SetTextColor(rgb(on and COL.text or COL.muted)); b.u:SetShown(on)
    b:SetScript("OnClick", function() view = k; DB.viewPicked = true; render() end)
  end
  local P = UI.pickWho(m)
  local showWho = (view == "me" and P and #m.players > 1) and not glanceOn
  who:SetShown(showWho); prevB:SetShown(showWho); nextB:SetShown(showWho)
  if P then who:SetWidth(math.max(80, CW - 190)); who:SetText("|cff" .. UI.classHex(P.cls) .. P.name .. "|r") end
  local function step(dir)
    local idx = 1; for i, p in ipairs(m.players) do if p == P then idx = i end end
    idx = ((idx - 1 + dir) % #m.players) + 1; DB.who = m.players[idx].name; render()
  end
  prevB:SetScript("OnClick", function() step(-1) end); nextB:SetScript("OnClick", function() step(1) end)

  -- body
  UI.resetPool()
  local y = 2
  local SH = DB.show or {}
  -- a panel behind a section, in the chosen card style: Panels (soft boxes), Glass (see-through) or Flat (a line under)
  local function panel(y0, hh)
    if DB.cardStyle == "flat" then local l = TEX("ARTWORK"); l:SetPoint("TOPLEFT", 0, -(y0 + hh)); l:SetSize(CW, 1); fill(l, COL.line)
    else box(y0, hh, COL.raised, DB.cardStyle == "glass" and 0.55 or 1, COL.line, 1) end
  end
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
        if #list > n then y = UI.moreLink(y, key, #list - n) end
      end
    end
    y = y + 3
    panel(y0, y - y0)
    IND = 0; y = y + 10
  end
  -- (who died, on both views, with the wipe filter on the right: Stop at − n +. On a wipe nothing after that death counts:
  -- mistakes, mechanics, deaths. 0 is off, the whole pull. A kill always counts in full)
  local function diedRow()
    if DB.compact then return end
    local nd, show, cut = #m.raid.died, DB.maxDied or 3, UI.cutIdx(raw)
    local y0 = y; IND = 12; y = y + 12
    local t = FS("head", 15, COL.text); t:SetPoint("TOPLEFT", IND, -y); t:SetText("Who died")
    local c = FS("body", 12.5, COL.faint); c:SetPoint("BOTTOMLEFT", t, "BOTTOMRIGHT", 8, 1); c:SetText((DB.detailed and view == "raid" and #(m.raid.tiles or {}) > 0) and "" or (h.deaths .. (h.deaths == "1" and " death" or " deaths")))
    if false then
      local function stepBtn(lbl, right, d)
        local bt = BTN(); bt:SetSize(22, 22); bt:SetPoint("TOPRIGHT", body, "TOPLEFT", right, -(y - 3))
        local bg = RT("BORDER"); bg:SetAllPoints(bt); UI.rounded(bg, "fill", 5, COL.bg, 1)
        local tx = FS("bold", 12.5, COL.muted); tx:SetPoint("CENTER", bt, "CENTER", 0, 0); tx:SetText(lbl)
        bt:SetScript("OnClick", function() DB.deathCut = math.max(0, math.min(8, (DB.deathCut or 0) + d)); wipe(EXPANDED); if Debrief_RefreshOptions then Debrief_RefreshOptions() end; render(); if big and big:IsShown() and bigRender then bigRender() end end)
        bt:SetScript("OnEnter", function() tx:SetTextColor(rgb(COL.gold)) end); bt:SetScript("OnLeave", function() tx:SetTextColor(rgb(COL.muted)) end)
      end
      stepBtn("+", CW - IND, 1)
      local v = FS("bold", 13, COL.text); v:SetJustifyH("CENTER"); v:SetWidth(28); v:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - IND - 23, -(y + 1)); v:SetText((DB.deathCut or 0) == 0 and "off" or (DB.deathCut .. ""))
      stepBtn("–", CW - IND - 52, -1)
      local l = FS("body", 12.5, COL.faint); l:SetJustifyH("RIGHT"); l:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - IND - 80, -(y + 2)); l:SetText("Stop at")
    elseif h.kill then
      local l = FS("body", 12.5, COL.faint); l:SetJustifyH("RIGHT"); l:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - IND, -(y + 2)); l:SetText("Kill, so all of it counts")
    end
    y = y + 26
    if cut > 0 and SH.died ~= false then local n2 = FS("body", 12.5, COL.faint); n2:SetPoint("TOPLEFT", IND, -y); n2:SetWidth(CW - IND * 2); n2:SetText("Deaths after the " .. UI.ordN(cut) .. " aren't counted."); y = y + n2:GetStringHeight() + 6 end
    if SH.died ~= false and show > 0 then
      if nd == 0 then y = row(y, "ok", nil, m.raid.more ~= "" and m.raid.more or "Nobody died.")
      else
        for i = 1, math.min(show, nd) do
          local d = m.raid.died[i]
          local tm = FS("body", 13.5, COL.muted); tm:SetPoint("TOPLEFT", IND, -y); tm:SetText(d[1])
          local nm = FS("bold", 13.5, UI.classHex(d[3])); nm:SetPoint("TOPLEFT", IND + 44, -y); nm:SetWidth(124); nm:SetWordWrap(false); nm:SetText(d[2])
          icon(IND + 174, y - 1, 18, d[4])
          local w = FS("body", 13.5, COL.muted); w:SetPoint("TOPLEFT", IND + 200, -y); w:SetWidth(CW - 200 - IND * 2); w:SetWordWrap(false); w:SetText(d[5])
          y = y + 23
        end
        local rest = nd - math.min(show, nd)
        local more = rest > 0 and ("+" .. rest .. " more.") or m.raid.more
        if more ~= "" then local mo = FS("body", 12.5, COL.faint); mo:SetPoint("TOPLEFT", IND, -(y - 2)); mo:SetText(more); y = y + 18 end
      end
    end
    y = y + 3
    panel(y0, y - y0)
    IND = 0; y = y + 10
  end
  -- (a row of small number tiles: a label, a big number, a short line under it)
  local function tilesRow(y0, list)
    local n, gap, th2 = math.min(4, #list), 8, 58
    local tw = math.floor((CW - gap * (n - 1)) / n)
    for i = 1, n do
      local tl, x = list[i], (i - 1) * (tw + gap)
      local f = RT("BACKGROUND"); f:SetPoint("TOPLEFT", x, -y0); f:SetSize(tw, th2); UI.rounded(f, "fill", 5, COL.raised, DB.cardStyle == "glass" and 0.55 or 1)
      local l = RT("BORDER"); l:SetPoint("TOPLEFT", f, "TOPLEFT"); l:SetPoint("BOTTOMRIGHT", f, "BOTTOMRIGHT"); UI.rounded(l, "line", 5, COL.line, 1)
      local a = FS("body", 12, COL.muted); a:SetPoint("TOPLEFT", x + 10, -(y0 + 8)); a:SetWidth(tw - 20); a:SetWordWrap(false); a:SetText(tl[1])
      local v = FS("head", #tostring(tl[2]) > 9 and 15 or 20, tl[4] == "bad" and COL.badT or tl[4] == "warn" and COL.warn or COL.text); v:SetPoint("TOPLEFT", x + 10, -(y0 + 22)); v:SetWidth(tw - 20); v:SetWordWrap(false); v:SetText(tl[2])
      local sb = FS("body", 11.5, COL.faint); sb:SetPoint("TOPLEFT", x + 10, -(y0 + 41)); sb:SetWidth(tw - 20); sb:SetWordWrap(false); sb:SetText(names(tl[3]))
    end
    return y0 + th2 + 14
  end
  -- (the Debriefing tab's summary: the pull phase by phase, then Better and Worse than last pull, each a short paragraph)
  local function summary()
    if not DB.detailed or DB.compact or (m.raid.story or "") == "" or SH.story == false then return end
    local y0 = y; IND = 12; y = y + 12
    y = head(y, "The pull", "story", DB.collapsed and DB.collapsed.story)
    if not (DB.collapsed and DB.collapsed.story) then
      local st = m.raid.story; if (m.raid.lead or "") ~= "" and SH.lead ~= false then st = st:gsub("^[^%.!?]+[%.!?]%s*", "") end
      local t = FS("body", 13.5, COL.soft); t:SetPoint("TOPLEFT", IND, -y); t:SetWidth(CW - IND * 2); t:SetText(names(st)); y = y + t:GetStringHeight() + 8
      for _, bw in ipairs({ { m.raid.better, "Better", COL.goodT or COL.good }, { m.raid.worse, "Worse", COL.warn } }) do
        if (bw[1] or "") ~= "" then
          local k = FS("bold", 12, bw[3]); k:SetPoint("TOPLEFT", IND, -y); k:SetText(bw[2]) --[[ (plain words: the game's fonts may not draw arrows) ]]
          local tx = FS("body", 13, COL.soft); tx:SetPoint("TOPLEFT", IND + 70, -y); tx:SetWidth(CW - IND * 2 - 70); tx:SetText(names(bw[1])); y = y + math.max(18, tx:GetStringHeight()) + 6
        end
      end
    end
    y = y + 3
    panel(y0, y - y0)
    IND = 0; y = y + 10
  end
  -- (the raid lead's word: why we wiped, or the kill, in a few sentences; on your own view a "You" line under it)
  local function leadBox(you)
    if (m.raid.lead or "") == "" or m.h.practice or SH.lead == false then return end
    local t = FS("body", 14, COL.text); t:SetWidth(CW - 34); t:SetText(names(m.raid.lead))
    local u; if you and (you or "") ~= "" then u = FS("body", 13.5, COL.soft); u:SetWidth(CW - 34 - 40); u:SetText(names(you)) end
    local hh = 12 + 17 + t:GetStringHeight() + (u and (8 + u:GetStringHeight()) or 0) + 12
    box(y, hh, COL.gold, 0.07, COL.gold, 0.5, COL.gold)
    local l = FS("bold", 11.5, COL.gold); l:SetPoint("TOPLEFT", 16, -(y + 11)); l:SetText(m.h.kill and "THE KILL" or "WHY WE WIPED")
    t:SetPoint("TOPLEFT", 16, -(y + 28))
    if u then local k = FS("bold", 13.5, COL.gold); k:SetPoint("TOPLEFT", 16, -(y + 28 + t:GetStringHeight() + 8)); k:SetText("You"); u:SetPoint("TOPLEFT", 56, -(y + 28 + t:GetStringHeight() + 8)) end
    y = y + hh + 12
  end
  -- (the Glance card: the raid lead's quick read)
  local function glanceBody()
    local R = m.raid
    -- (the bullet summary (the user's ask, Oct 22: "just a big bullet point summary, explaining what happened and what needs to
    -- change next"): a dot in the line's colour by each point; the changes get gold dots)
    local function bullets(title, list, gold)
      local l = FS("bold", 12, COL.gold); l:SetPoint("TOPLEFT", 2, -y); l:SetText(title); y = y + 22
      for _, r in ipairs(list) do
        local d = TEX("ARTWORK"); d:SetTexture(SLICE .. "dot"); d:SetPoint("TOPLEFT", 4, -(y + 7)); d:SetSize(8, 8); d:SetVertexColor(rgb(gold and COL.gold or FLAG[r[1]] or COL.muted))
        local t = FS("body", 14.5, COL.text); t:SetPoint("TOPLEFT", 22, -y); t:SetWidth(CW - 26); t:SetText(names(r[3]))
        y = y + math.max(18, t:GetStringHeight()) + 8
      end
      y = y + 10
    end
    if #(R.ghap or {}) > 0 then
      bullets("WHAT HAPPENED", R.ghap)
      if #(R.gchg or {}) > 0 then bullets(m.h.kill and "WHAT TO CLEAN UP NEXT TIME" or "WHAT TO CHANGE NEXT", R.gchg, true) end
    else
    -- the raid lead's two sentences
    local t = FS("body", 14.5, COL.text); t:SetWidth(CW - 34); t:SetText(names(R.ghead))
    local hh = 12 + 17 + t:GetStringHeight() + 12
    box(y, hh, COL.gold, 0.07, COL.gold, 0.5, COL.gold)
    local l = FS("bold", 11.5, COL.gold); l:SetPoint("TOPLEFT", 16, -(y + 11)); l:SetText(m.h.kill and "THE KILL" or "WHY WE WIPED")
    t:SetPoint("TOPLEFT", 16, -(y + 28)); y = y + hh + 12
    -- went well, fix next: a tick or a cross by each, the raid lead's words
    if #R.good > 0 then section("ggood", "Went well", R.good, 3, function(r) y = row(y, "ok", nil, r[3]) end) end
    if #R.fixes > 0 then section("gfix", m.h.kill and "Clean up next time" or "Fix next", R.fixes, 3, function(r) y = row(y, r[1], nil, r[3]) end) end
    -- the next pull, and your own line
    if (R.gnext or "") ~= "" then y = UI.nextBox(y + 2, R.gnext) end
    end
    if P and (P.lead or "") ~= "" then
      local k = FS("bold", 13.5, COL.gold); k:SetPoint("TOPLEFT", 4, -(y + 2)); k:SetText("You")
      local u = FS("body", 13.5, COL.soft); u:SetPoint("TOPLEFT", 44, -(y + 2)); u:SetWidth(CW - 48); u:SetText(names(P.lead)); y = y + math.max(18, u:GetStringHeight()) + 12
    end
    -- the full recap, one click away
    local bt = BTN(); bt:SetPoint("TOPLEFT", 0, -(y - 2)); bt:SetSize(CW, 22)
    local lk = FS("bold", 12.5, COL.gold); lk:SetPoint("TOPLEFT", 4, -y); lk:SetText("See the full recap ›")
    bt:SetScript("OnClick", function() card:Hide(); big:Show(); bigRender() end)
    bt:SetScript("OnEnter", function() lk:SetTextColor(rgb(COL.text)) end); bt:SetScript("OnLeave", function() lk:SetTextColor(rgb(COL.gold)) end)
    y = y + 22
  end
  -- (player names in the coach's words, in their class colours)
  local function paint(s0)
    s0 = " " .. names(s0 or "")
    for _, p in ipairs(m.players) do local n = p.name:match("^([^%-]+)") or p.name
      if #n > 2 then s0 = s0:gsub("([^|%w])(" .. n:gsub("(%W)", "%%%1") .. ")", function(a, b2) return a .. "|cff" .. UI.classHex(p.cls) .. b2 .. "|r" end) end end
    return (s0:gsub("^ ", ""))
  end
  local KCOL = { own = COL.bad, ready = COL.bad, on = COL.bad, half = COL.warn, nothing = COL.warn }
  -- (a folding heading for the coach's lists: closed until clicked, then remembered)
  local function fold(key, title, n)
    DB.coachOpen = DB.coachOpen or {}
    local open = DB.coachOpen[key]; if open == nil then open = DB.preset == "heavy" or DB.preset == "detailed" end
    local t = FS("bold", 12, COL.muted); t:SetPoint("TOPLEFT", 14, -(y + 11)); t:SetText(title .. (n and n > 0 and ("  ·  " .. n) or ""))
    local sign = FS("bold", 14, COL.faint); sign:SetJustifyH("RIGHT"); sign:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - 14, -(y + 9)); sign:SetText(open and "–" or "+")
    local b = BTN(); b:SetPoint("TOPLEFT", 0, -y); b:SetSize(CW, 32)
    b:SetScript("OnClick", function() DB.coachOpen[key] = not open; render() end)
    b:SetScript("OnEnter", function() t:SetTextColor(rgb(COL.gold)); sign:SetTextColor(rgb(COL.gold)) end); b:SetScript("OnLeave", function() t:SetTextColor(rgb(COL.muted)); sign:SetTextColor(rgb(COL.faint)) end)
    return open
  end
  -- (a row in Deaths or Avoidable damage: click it for its short story under it)
  local STORY = CARD_STORY or {}; CARD_STORY = STORY
  local function chipRow(key, parts, idv, story)
    local x = 14
    for _, pt in ipairs(parts) do
      if pt.icon then icon(x, y + 4, 18, pt.icon); x = x + 24
      elseif pt.dot then local d = TEX("ARTWORK"); d:SetTexture(SLICE .. "dot"); d:SetPoint("TOPLEFT", x, -(y + 9)); d:SetSize(8, 8); d:SetVertexColor(rgb(pt.dot)); x = x + 15
      else local f = FS(pt.bold and "bold" or "body", 13.5, pt.col or COL.soft); f:SetPoint("TOPLEFT", x, -(y + 5)); f:SetWordWrap(false); f:SetText(pt.t); x = x + f:GetStringWidth() + (pt.gap or 8) end
    end
    local open = STORY[key]
    if story and story ~= "" then
      local b = BTN(); b:SetPoint("TOPLEFT", 0, -y); b:SetSize(CW, 26)
      b:SetScript("OnClick", function() STORY[key] = not STORY[key] or nil; render() end)
    end
    y = y + 27
    if open and story and story ~= "" then
      local f = FS("body", 13, COL.muted); f:SetPoint("TOPLEFT", 38, -y); f:SetWidth(CW - 52); f:SetText(paint(story)); y = y + f:GetStringHeight() + 10
    end
  end
  -- (Debriefing's coach box, the Raid view)
  local function coachBody()
    local c = m.coach
    local lab = FS("bold", 11.5, COL.gold); lab:SetPoint("TOPLEFT", 2, -y); lab:SetText(c.kill and "THE KILL, COACHED" or "THIS PULL, COACHED"); y = y + 19
    local hd = FS("head", 16.5, COL.text); hd:SetPoint("TOPLEFT", 2, -y); hd:SetWidth(CW - 4); hd:SetText(paint(c.head)); y = y + hd:GetStringHeight() + 12
    if not c.focusSame and (c.focus or "") ~= "" then
      local ft = FS("bold", 14, COL.text); ft:SetWidth(CW - 32); ft:SetText(paint(c.focus))
      local hh = 11 + 18 + ft:GetStringHeight() + 12
      box(y, hh, COL.gold, 0.08, COL.gold, 0.55)
      local l = FS("bold", 11.5, COL.gold); l:SetPoint("TOPLEFT", 16, -(y + 11)); l:SetText(c.kill and "FOCUS NEXT WEEK" or "FOCUS NEXT PULL")
      ft:SetPoint("TOPLEFT", 16, -(y + 29)); y = y + hh + 14
    end
    if #c.wrong > 0 then
      local l = FS("bold", 11.5, COL.muted); l:SetPoint("TOPLEFT", 2, -y); l:SetText("WHAT WENT WRONG"); y = y + 20
      local cap = math.max(1, DB.maxRaid or 3)
      for i, x in ipairs(c.wrong) do
        if i > cap then
          local mt = FS("body", 12.5, COL.faint); mt:SetPoint("TOPLEFT", 2, -(y + 1)); mt:SetText((#c.wrong - cap) .. " more in the full coaching on the website."); y = y + 20
          break
        end
        local sev = x.sev == "bad" and COL.bad or COL.warn
        local tx, tw = 44, CW - 44 - 14
        local lt = FS("bold", 14.5, COL.text); lt:SetWordWrap(false); lt:SetText(x.label)
        local pt; if (x.tag or "") ~= "" then pt = FS("bold", 11.5, x.sev == "bad" and COL.badT or COL.warn); pt:SetWordWrap(false); pt:SetText(x.tag) end
        local wt; if (x.what or "") ~= "" then wt = FS("body", 13, COL.muted); wt:SetWidth(tw); wt:SetText(paint(x.what)) end
        local nk = FS("bold", 11.5, COL.gold); nk:SetText("NEXT TIME")
        local fx = FS("body", 13.5, COL.soft); fx:SetWidth(tw - 76); fx:SetText(paint(x.fix))
        local hh = 12 + 22 + (wt and (wt:GetStringHeight() + 6) or 0) + math.max(16, fx:GetStringHeight()) + 12
        box(y, hh, COL.raised, DB.cardStyle == "glass" and 0.55 or 1, COL.line, 1, sev)
        local d = TEX("ARTWORK"); d:SetTexture(SLICE .. "dot"); d:SetPoint("TOPLEFT", 12, -(y + 13)); d:SetSize(22, 22); d:SetVertexColor(rgb(sev)); d:SetAlpha(0.25)
        local nn = FS("bold", 12.5, sev); nn:SetPoint("CENTER", d, "CENTER", 0, 0); nn:SetText(tostring(i))
        local lx = tx; if (x.id or "") ~= "" then icon(tx, y + 12, 20, x.id); lx = tx + 26 end
        lt:SetPoint("TOPLEFT", lx, -(y + 14)); lt:SetWidth(math.min(lt:GetStringWidth() + 2, tw - (lx - tx) - (pt and 110 or 0)))
        if pt then pt:SetPoint("LEFT", lt, "RIGHT", 10, 0) end
        local yy = y + 12 + 22
        if wt then wt:SetPoint("TOPLEFT", tx, -yy); yy = yy + wt:GetStringHeight() + 6 end
        nk:SetPoint("TOPLEFT", tx, -(yy + 2)); fx:SetPoint("TOPLEFT", tx + 76, -yy)
        y = y + hh + 8
      end
      y = y + 4
    end
    for _, x in ipairs((DB.compact or SH.right == false) and {} or c.right) do
      local ok = TEX("ARTWORK"); ok:SetTexture("Interface\\RaidFrame\\ReadyCheck-Ready"); ok:SetPoint("TOPLEFT", 4, -(y + 2)); ok:SetSize(16, 16)
      local f = FS("body", 13.5, COL.goodT); f:SetPoint("TOPLEFT", 26, -(y + 1)); f:SetWidth(CW - 30); f:SetText(paint(x.t)); y = y + math.max(18, f:GetStringHeight()) + 7
    end
    y = y + 6
    -- deaths, folded until clicked
    if SH.cdeaths ~= false and (#c.deaths > 0 or (c.dline or "") ~= "") then
      local y0 = y; local open = fold("cdeaths", "DEATHS", #c.deaths); y = y + 32
      if open then
        if #c.deaths == 0 then local f = FS("body", 13, COL.muted); f:SetPoint("TOPLEFT", 14, -y); f:SetWidth(CW - 28); f:SetText(paint(c.dline)); y = y + f:GetStringHeight() + 8 end
        for i, d in ipairs(c.deaths) do
          chipRow(m.h.pull .. "d" .. i, { { t = d.t, col = COL.faint, gap = 6 }, { dot = KCOL[d.k] or COL.faint }, { t = d.who, bold = true, col = UI.classHex(d.cls), gap = 8 }, { icon = d.id }, { t = d.ab } }, d.id, d.story)
        end
        if (c.dnote or "") ~= "" then local f = FS("body", 12, COL.faint); f:SetPoint("TOPLEFT", 14, -(y + 2)); f:SetWidth(CW - 28); f:SetText(c.dnote); y = y + f:GetStringHeight() + 6 end
        if #c.deaths > 0 then local f = FS("body", 12, COL.faint); f:SetPoint("TOPLEFT", 14, -(y + 2)); f:SetText("Click a death to see what happened."); y = y + 18 end
        y = y + 4
      end
      panel(y0, y - y0); y = y + 8
    end
    -- avoidable damage, folded until clicked
    if SH.cavoid ~= false and (#c.avoid > 0 or (c.aline or "") ~= "") then
      local y0 = y; local open = fold("cavoid", "AVOIDABLE DAMAGE", #c.avoid); y = y + 32
      if open then
        if #c.avoid == 0 then local f = FS("body", 13, COL.muted); f:SetPoint("TOPLEFT", 14, -y); f:SetWidth(CW - 28); f:SetText(paint(c.aline)); y = y + f:GetStringHeight() + 8 end
        for i, a in ipairs(c.avoid) do
          chipRow(m.h.pull .. "a" .. i, { { icon = a.id }, { t = a.k }, { t = a.who, bold = true, col = UI.classHex(a.cls), gap = 6 }, { t = a.n, col = a.bad and COL.badT or COL.warn } }, a.id, a.story)
        end
        if #c.avoid > 0 then local f = FS("body", 12, COL.faint); f:SetPoint("TOPLEFT", 14, -(y + 2)); f:SetText("Click one to see what happened."); y = y + 18 end
        y = y + 4
      end
      panel(y0, y - y0); y = y + 8
    end
    local ft = FS("body", 12.5, COL.faint); ft:SetPoint("TOPLEFT", 2, -(y + 2)); ft:SetWidth(CW - 4); ft:SetText("The full coaching is on the website, in the Debriefing tab."); y = y + ft:GetStringHeight() + 8
  end
  -- (your own coach: the You view opens with it)
  local function youCoach(P)
    if not (P and P.coach and (P.coach.head or "") ~= "") then return false end
    local t = FS("body", 14.5, COL.text); t:SetWidth(CW - 34); t:SetText(paint(P.coach.head))
    local f; if (P.coach.focus or "") ~= "" and not P.coach.head:find(P.coach.focus:gsub("%.$", ""), 1, true) then f = FS("bold", 13.5, COL.text); f:SetWidth(CW - 34); f:SetText(paint(P.coach.focus)) end
    local hh = 12 + 17 + t:GetStringHeight() + (f and (14 + 16 + f:GetStringHeight()) or 0) + 12
    box(y, hh, COL.gold, 0.07, COL.gold, 0.5, COL.gold)
    local l = FS("bold", 11.5, COL.gold); l:SetPoint("TOPLEFT", 16, -(y + 11)); l:SetText("YOUR COACH")
    t:SetPoint("TOPLEFT", 16, -(y + 28))
    if f then local k = FS("bold", 11.5, COL.gold); k:SetPoint("TOPLEFT", 16, -(y + 28 + t:GetStringHeight() + 14)); k:SetText(m.coach and m.coach.kill and "FOCUS NEXT WEEK" or "FOCUS NEXT PULL"); f:SetPoint("TOPLEFT", 16, -(y + 28 + t:GetStringHeight() + 30)) end
    y = y + hh + 12
    return true
  end
  -- (the wipe filter on top of the card (Oct 22): it decides what everything under it counts, the coach box included)
  if raw.cutN and not m.h.practice and SH.stopat ~= false then
    local y0 = y; IND = 12; y = y + 10
    local function stepBtn(lbl, right, d)
      local bt = BTN(); bt:SetSize(22, 22); bt:SetPoint("TOPRIGHT", body, "TOPLEFT", right, -(y - 2))
      local bg = RT("BORDER"); bg:SetAllPoints(bt); UI.rounded(bg, "fill", 5, COL.bg, 1)
      local tx = FS("bold", 12.5, COL.muted); tx:SetPoint("CENTER", bt, "CENTER", 0, 0); tx:SetText(lbl)
      bt:SetScript("OnClick", function() DB.deathCut = math.max(0, math.min(8, (DB.deathCut or 0) + d)); wipe(EXPANDED); if Debrief_RefreshOptions then Debrief_RefreshOptions() end; render(); if big and big:IsShown() and bigRender then bigRender() end end)
      bt:SetScript("OnEnter", function() tx:SetTextColor(rgb(COL.gold)) end); bt:SetScript("OnLeave", function() tx:SetTextColor(rgb(COL.muted)) end)
    end
    local cut = UI.cutIdx(raw)
    local t = FS("bold", 13, COL.text); t:SetPoint("TOPLEFT", IND, -(y + 2)); t:SetText("Stop at death")
    stepBtn("+", CW - IND, 1)
    local v = FS("bold", 13, COL.text); v:SetJustifyH("CENTER"); v:SetWidth(28); v:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - IND - 23, -(y + 2)); v:SetText((DB.deathCut or 0) == 0 and "off" or (DB.deathCut .. ""))
    stepBtn("–", CW - IND - 52, -1)
    y = y + 26
    local note
    if cut > 0 then local d = raw.raid.died[cut]; note = "Counted up to the " .. UI.ordN(cut) .. " death" .. (d and (" (" .. d[2] .. ", " .. d[1] .. ")") or "") .. ". What came after isn't counted."
    elseif (DB.deathCut or 0) > 0 then note = "Fewer than " .. DB.deathCut .. " deaths, so the whole pull counts."
    else note = "The whole pull counts. Press + to stop counting at a death, so the wipe at the end isn't counted." end
    local n2 = FS("body", 12.5, COL.faint); n2:SetPoint("TOPLEFT", IND, -y); n2:SetWidth(CW - IND * 2); n2:SetText(note); y = y + n2:GetStringHeight() + 10
    panel(y0, y - y0); IND = 0; y = y + 10
  end
  -- (the Report card grade and the small charts, when their chips are on in the settings (Oct 22))
  if SH.grade and m.grade and not m.h.practice then y = UI.cardGrade(y, m.grade) end
  if (SH.chartNight or SH.chartLine) and not m.h.practice then y = UI.cardCharts(y, raw, P, SH) end
  if coachOn and view ~= "me" then
    coachBody()
    if SH.mechs and m.raid.mech and #m.raid.mech > 0 and (DB.maxMech or 6) > 0 then section("mech", "Boss mechanics", m.raid.mech, DB.maxMech or 6, function(r) y = row(y, r[1], r[2], r[4], r[3]) end) end
    if SH.rcons ~= false and m.raid.cons and #m.raid.cons > 0 then section("rcons", "Healthstones and potions", m.raid.cons, 2, function(r) y = row(y, r[1], r[2], r[3]) end) end
  elseif glanceOn then
    glanceBody()
  elseif view == "me" and P then
    if not (coachOn and youCoach(P)) then leadBox(P.lead) end
    -- the tile: your damage or healing, against your last pull and your best
    if SH.tile ~= false then
      local th = 62
      local goal = UI.goalFor(P, m)
      if goal > 0 then th = 72 end
      panel(y, th)
      icon(12, y + 13, 36, P.icon)
      local l = FS("body", 12.5, COL.muted); l:SetPoint("TOPLEFT", 60, -(y + 11)); l:SetText(P.role == "healer" and "Your healing" or "Your damage")
      local v = FS("head", 28, COL.text); v:SetPoint("TOPLEFT", 60, -(y + 26)); v:SetText(P.v)
      local u = FS("bold", 12, COL.muted); u:SetPoint("BOTTOMLEFT", v, "BOTTOMRIGHT", 5, 4); u:SetText(P.unit)
      local s = FS("body", 12.5, COL.faint); s:SetJustifyH("RIGHT"); s:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - 12, -(y + 11)); s:SetWidth(CW - 170); s:SetWordWrap(false)
      local lines = {}
      if P.d and SH.vs ~= false then lines[#lines + 1] = (P.d >= 0 and ("|cff7ee08f+" .. P.d .. "%|r") or ("|cffff8f87" .. P.d .. "%|r")) .. " vs pull " .. P.vs end
      if SH.best ~= false then lines[#lines + 1] = (P.best ~= "" and ("Best " .. P.best .. " (pull " .. P.bp .. ")") or "First pull read") end
      if P.rank ~= "" and SH.rank ~= false then lines[#lines + 1] = P.rank end
      s:SetText(table.concat(lines, "\n"))
      -- (your goal: a thin bar along the bottom of the tile, gold until you reach it, then green)
      if goal > 0 then
        local pct = UI.parseK(P.v) / goal
        local gl = FS("bold", 11, pct >= 1 and COL.goodT or COL.muted); gl:SetPoint("TOPLEFT", 60, -(y + 56)); gl:SetText("Goal " .. goal .. "k  ·  " .. math.floor(pct * 100 + 0.5) .. "%")
        local tr = TEX("ARTWORK"); tr:SetPoint("TOPLEFT", 160, -(y + 61)); tr:SetSize(CW - 172, 3); fill(tr, COL.line2)
        local fl = TEX("OVERLAY"); fl:SetPoint("TOPLEFT", 160, -(y + 61)); fl:SetSize(math.max(2, (CW - 172) * math.min(1, pct)), 3); fill(fl, pct >= 1 and COL.good or COL.gold)
      end
      y = y + th + 16
    end
    -- (the Detailed card: three small number tiles under yours: avoidable damage, kicks or dispels, your death)
    if DB.detailed and not DB.compact and P.tiles and #P.tiles > 0 then y = tilesRow(y, P.tiles) end
    if not DB.compact then
      local rot = function() section("rotation", "Rotation", UI.onlyBad(P.slips), DB.maxSlips or 3, function(r) y = row(y, r[1], r[2], r[3]) end, #P.slips > 0 and "Nothing to fix here." or "No rotation checks for this spec yet.") end
      local bossL = P.boss
      if DB.detailed and P.tiles and #P.tiles > 0 then bossL = {}; for _, r in ipairs(P.boss) do if not ({ ability_rogue_sprint = true, ability_kick = true, spell_holy_dispelmagic = true })[r[2]] then bossL[#bossL + 1] = r end end end
      local bos = function() section("boss", "Boss mechanics", UI.onlyBad(bossL), DB.maxBoss or 2, function(r) y = row(y, r[1], r[2], r[3]) end, "No boss mistakes.") end
      if m.h.practice and #P.boss == 0 then bos = function() end end -- (a training dummy has no boss mechanics)
      if DB.bossFirst then bos(); rot() else rot(); bos() end
      -- (survival: your defensives, Healthstone and health potion)
      if P.surv and #P.surv > 0 and SH.surv ~= false then section("surv", "Survival", UI.onlyBad(P.surv), 5, function(r) y = row(y, r[1], r[2], r[3]) end) end
      if P.cons and #P.cons > 0 and SH.cons ~= false then section("cons", "Healthstone and potion", P.cons, 3, function(r) y = row(y, r[1], r[2], r[3]) end) end
      -- (the Detailed card: the raid's side right here, so nobody has to switch to the Raid view)
      if DB.detailed and not m.h.practice and not raidOk then
        summary()
        if #m.raid.bad > 0 then section("rbad", "The raid: top mistakes", m.raid.bad, DB.maxRaid or 3, function(r) y = row(y, r[1], r[2], r[4], r[3]) end) end
        if m.raid.mech and #m.raid.mech > 0 and (DB.maxMech or 6) > 0 then section("rmech", "The raid: boss mechanics", m.raid.mech, DB.maxMech or 6, function(r) y = row(y, r[1], r[2], r[4], r[3]) end) end
      end
    end
    if not m.h.practice and not (DB.detailed and raidOk) then diedRow() end -- (the death filter here too: a dummy has no deaths)
    if P.next ~= "" and SH.next ~= false then y = UI.nextBox(y + 2, (DB.detailed and (P.next2 or "") ~= "") and ("1. " .. P.next .. "\n2. " .. P.next2) or P.next) end
  else
    leadBox(nil)
    if DB.detailed and not DB.compact and m.raid.tiles and #m.raid.tiles > 0 then y = tilesRow(y, m.raid.tiles) end
    summary()
    section("mistakes", h.kill and "What to clean up" or "Top mistakes", m.raid.bad, DB.compact and 1 or (DB.maxRaid or 3), function(r) y = row(y, r[1], r[2], r[4], r[3]) end, "Nothing big.")
    -- (how each boss mechanic went: done right, some mistakes, or failed; worst first)
    if m.raid.mech and #m.raid.mech > 0 and (DB.maxMech or 6) > 0 then
      section("mech", "Boss mechanics", m.raid.mech, DB.compact and math.min(3, DB.maxMech or 3) or (DB.maxMech or 6), function(r) y = row(y, r[1], r[2], r[4], r[3]) end)
    end
    if SH.rcons ~= false and m.raid.cons and #m.raid.cons > 0 then section("rcons", "Healthstones and potions", m.raid.cons, 2, function(r) y = row(y, r[1], r[2], r[3]) end) end
    diedRow()
    if m.raid.next ~= "" and SH.next ~= false and not ((m.raid.lead or "") ~= "" and SH.lead ~= false) then y = UI.nextBox(y + 2, m.raid.next) end
  end
  body:SetHeight(math.max(10, y))
  -- (never taller than the screen: the rest scrolls, and the footer says so)
  local room = math.max(320, ((UIParent and UIParent.GetHeight and UIParent:GetHeight()) or 768) / math.max(0.5, (card.GetScale and card:GetScale()) or 1) - 60)
  local vh = math.max(10, math.min(y, room - TOPY - 42))
  scroller:SetSize(CW, vh)
  scroller:SetVerticalScroll(math.min((scroller:GetVerticalScroll() or 0), math.max(0, y - vh)))
  foot:SetText(y > vh + 4 and "Scroll for more  ·  /dbr opens this again" or "/dbr opens this again  ·  /db settings")
  footLine:ClearAllPoints(); footLine:SetPoint("TOPLEFT", card, "TOPLEFT", 1, -(TOPY + vh + 10)); footLine:SetPoint("TOPRIGHT", card, "TOPRIGHT", -1, -(TOPY + vh + 10))
  foot:ClearAllPoints(); foot:SetPoint("TOPLEFT", card, "TOPLEFT", PAD, -(TOPY + vh + 19)); foot:SetWidth(W - PAD * 2 - 130); foot:SetWordWrap(false)
  logBtn:ClearAllPoints(); logBtn:SetPoint("TOPRIGHT", card, "TOPRIGHT", -PAD, -(TOPY + vh + 15)); Debrief_LogButton()
  card:SetHeight(TOPY + vh + 42)
end

-- ---------- keeping pulls, showing the card ----------
local function sameAs(a, b) return a.h.boss == b.h.boss and a.h.pull == b.h.pull and a.h.dur == b.h.dur end
local function addPull(m, own)
  for i, q in ipairs(DB.pulls) do if sameAs(q, m) then
    -- (your own PC app's copy wins over one a guildmate's app sent first: theirs may be an older version, without the newest lines)
    if own and not q.own then m.t = q.t; m.own = true; DB.pulls[i] = m; DB.cur = i; wipe(EXPANDED); return false, true end
    DB.cur = i; return false
  end end
  m.own = own or nil
  m.t = m.t or (time and time()) or 0
  DB.pulls[#DB.pulls + 1] = m
  while #DB.pulls > (DB.keep or 30) do table.remove(DB.pulls, 1) end
  DB.cur = #DB.pulls; DB.who = nil; wipe(EXPANDED); scroller:SetVerticalScroll(0)
  return true
end
local pendingShow = false
local function showCard()
  -- (never pops up mid-fight: it waits until you're out of combat)
  if InCombatLockdown() then pendingShow = true; return end
  -- (the way you chose: the mini bar, the big window, or the card)
  if DB.mini then card:Hide(); miniShow()
  elseif DB.bigDefault then card:Hide(); big:Show(); bigRender()
  else card:Show(); render() end
  onShow()
  if DB.sound ~= false and SOUNDKIT and SOUNDKIT.IG_QUEST_LOG_OPEN then PlaySound(SOUNDKIT.IG_QUEST_LOG_OPEN) end
end

do
-- ---------- style, goals, combat, the mini bar and the big window ----------
local function accentHex()
  -- (the colour of the class you're playing, unless you turn it off; a Priest's white is softened so text stays readable)
  if DB.classTheme ~= false or DB.accent == "class" then local _, c = UnitClass("player"); if c then local hx = classHex(c); return hx == "ffffff" and "e8e4da" or hx end end
  return ACCENTS[DB.accent or "gold"] or "e6b450"
end
-- (accent colour, colour-blind colours, glass)
function Debrief_ApplyStyle()
  if not DB then return end
  COL.gold = accentHex()
  local cb = DB.colorblind
  FLAG.ok = cb and "4aa3ff" or COL.good; FLAG.bad = cb and "ff9f1a" or COL.bad; FLAG.warn = cb and "f2e35b" or COL.warn
  for _, b in pairs(tabs) do fill(b.u, COL.gold) end
  rounded(paste.lineT, "line", 8, COL.gold, 0.55); rounded(toast.lineT, "line", 8, COL.gold, 0.55)
  rounded(card.fillT, "fill", 8, COL.bg, DB.cardStyle == "glass" and math.min(DB.alpha or 0.97, 0.8) or (DB.alpha or 0.97))
  if big then rounded(big.fillT, "fill", 8, COL.bg, DB.cardStyle == "glass" and 0.86 or 0.98) end
end

-- ---------- hide during combat, close by itself ----------
local hidCard, hidMini, hidBig = false, false, false
function Debrief_CombatStart()
  if DB and DB.hideCombat ~= false then
    if card:IsShown() then card:Hide(); hidCard = true end
    if mini and mini:IsShown() then mini:Hide(); hidMini = true end
    if big and big:IsShown() then big:Hide(); hidBig = true end
  end
end
function Debrief_CombatEnd()
  if hidCard then hidCard = false; card:Show(); render() end
  if hidMini then hidMini = false; mini:Show() end
  if hidBig then hidBig = false; big:Show(); bigRender() end
end
onShow = function()
  if (DB.autoClose or 0) > 0 and C_Timer then
    local tok = {}; card.tok = tok
    -- (not while your mouse is on it: it checks again a few seconds later)
    local function check()
      if card.tok ~= tok then return end
      local f = card:IsShown() and card or (mini:IsShown() and mini) or nil
      if not f then return end
      if f:IsMouseOver() then C_Timer.After(5, check) else f:Hide() end
    end
    C_Timer.After(DB.autoClose, check)
  end
end

-- ---------- the mini bar: one line instead of the card; click it for the full card ----------
mini = CreateFrame("Button", "DebriefMini", UIParent); mini:SetSize(390, 40); mini:SetPoint("CENTER", 0, -220); mini:SetFrameStrata("HIGH"); mini:SetClampedToScreen(true); mini:Hide()
skin(mini, 8, COL.bg, 0.97, COL.line2, 1, true)
mini:SetMovable(true); mini:RegisterForDrag("LeftButton")
mini:SetScript("OnDragStart", function() if not DB.lock then mini:StartMoving() end end)
mini:SetScript("OnDragStop", function() mini:StopMovingOrSizing(); local p, _, rp, x, y = mini:GetPoint(); DB.miniPos = { p, rp, x, y } end)
local mLogo = mini:CreateTexture(nil, "ARTWORK"); mLogo:SetSize(19, 19); mLogo:SetPoint("LEFT", 12, 0); mLogo:SetTexture(MEDIA .. "Media\\logo")
local mT = mini:CreateFontString(nil, "OVERLAY"); setFont(mT, "head", 15); mT:SetPoint("LEFT", mLogo, "RIGHT", 8, 0); mT:SetTextColor(rgb(COL.text))
local mChip = CreateFrame("Frame", nil, mini); mChip:SetSize(50, 20); mChip:SetPoint("LEFT", mT, "RIGHT", 8, 0); skin(mChip, 5, COL.badBg, 1, COL.badBg, 1)
mChip.t = mChip:CreateFontString(nil, "OVERLAY"); setFont(mChip.t, "bold", 11.5); mChip.t:SetPoint("CENTER", 0, 0)
local mN = mini:CreateFontString(nil, "OVERLAY"); setFont(mN, "body", 13); mN:SetPoint("LEFT", mChip, "RIGHT", 10, 0); mN:SetTextColor(rgb(COL.soft)); mN:SetJustifyH("LEFT")
local mGo = mini:CreateFontString(nil, "OVERLAY"); setFont(mGo, "bold", 12.5); mGo:SetPoint("RIGHT", -12, 0); mGo:SetTextColor(rgb(COL.faint)); mGo:SetText("open ›")
mini:SetScript("OnEnter", function() mGo:SetTextColor(rgb(COL.gold)) end); mini:SetScript("OnLeave", function() mGo:SetTextColor(rgb(COL.faint)) end)
mini:SetScript("OnClick", function() mini:Hide(); card:Show(); render() end)
mini:SetScale(1)
miniShow = function()
  local m = cutView(DB.pulls[DB.cur]); if not m then return end
  CUR = m
  local P = pickWho(m)
  mT:SetText("Pull " .. m.h.pull)
  local rt, rc, rb = resultOf(m.h)
  mChip.t:SetText(rt); mChip.t:SetTextColor(rgb(rc)); mChip:SetWidth(mChip.t:GetStringWidth() + 16)
  rounded(mChip.fillT, "fill", 5, rb, 1); rounded(mChip.lineT, "line", 5, rb, 1)
  local parts = {}
  if P then
    local d = P.d and ((P.d >= 0 and ("  |cff7ee08f+" .. P.d .. "%|r") or ("  |cffff8f87" .. P.d .. "%|r"))) or ""
    parts[#parts + 1] = P.v .. " " .. P.unit .. d
    local bad = 0; for _, r in ipairs(P.slips) do if r[1] ~= "ok" then bad = bad + 1 end end
    if bad > 0 then parts[#parts + 1] = "|cff" .. COL.warn .. bad .. (bad == 1 and " slip|r" or " slips|r") end
    local goal = goalFor(P, m)
    if goal > 0 then local pc = math.floor(100 * parseK(P.v) / goal + 0.5); parts[#parts + 1] = (pc >= 100 and "|cff7ee08f" or "") .. "goal " .. pc .. "%" .. (pc >= 100 and "|r" or "") end
  end
  mN:SetText(table.concat(parts, "  ·  "))
  mini:SetWidth(math.max(300, 12 + 15 + 8 + mT:GetStringWidth() + 8 + mChip:GetWidth() + 10 + mN:GetStringWidth() + 70))
  if DB.miniPos then mini:ClearAllPoints(); mini:SetPoint(DB.miniPos[1], UIParent, DB.miniPos[2], DB.miniPos[3], DB.miniPos[4]) end
  mini:Show()
end
end

do
-- ---------- the big window: tonight's pulls on the left; the pull in detail, with the night's charts, on the right ----------
local BW, SIDE, MX = 1000, 220, 20
local MW = BW - SIDE - MX * 2
local COLW = (MW - 18) / 2
big = CreateFrame("Frame", "DebriefBig", UIParent); big:SetSize(BW, 640); big:SetPoint("CENTER", 0, 30); big:SetFrameStrata("HIGH"); big:SetClampedToScreen(true); big:Hide()
skin(big, 8, COL.bg, 0.98, COL.line2, 1, true)
big:SetMovable(true); big:EnableMouse(true)
tinsert(UISpecialFrames, "DebriefBig")
local bTop = CreateFrame("Frame", nil, big); bTop:SetPoint("TOPLEFT"); bTop:SetPoint("TOPRIGHT", -250, 0); bTop:SetHeight(50)
bTop:EnableMouse(true); bTop:RegisterForDrag("LeftButton")
bTop:SetScript("OnDragStart", function() if not DB.lock then big:StartMoving() end end)
bTop:SetScript("OnDragStop", function() big:StopMovingOrSizing(); local p, _, rp, x, y = big:GetPoint(); DB.bigPos = { p, rp, x, y } end)
local bLogo = big:CreateTexture(nil, "ARTWORK"); bLogo:SetSize(22, 22); bLogo:SetPoint("TOPLEFT", 16, -15); bLogo:SetTexture(MEDIA .. "Media\\logo")
local bTitle = big:CreateFontString(nil, "OVERLAY"); setFont(bTitle, "head", 19); bTitle:SetPoint("LEFT", bLogo, "RIGHT", 8, 0); bTitle:SetTextColor(rgb(COL.text)); bTitle:SetText("Debrief")
local bCtx = big:CreateFontString(nil, "OVERLAY"); setFont(bCtx, "body", 13.5); bCtx:SetPoint("LEFT", bTitle, "RIGHT", 10, -1); bCtx:SetTextColor(rgb(COL.muted)); bCtx:SetWidth(BW - 520); bCtx:SetJustifyH("LEFT"); bCtx:SetWordWrap(false)
local bClose = closeButton(big); bClose:SetPoint("TOPRIGHT", -10, -13); bClose:SetScript("OnClick", function() big:Hide() end)
local function topButton(label, w)
  local b = CreateFrame("Button", nil, big); b:SetSize(w, 28); skin(b, 5, COL.raised, 1, COL.line2, 1)
  b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 12.5); b.t:SetPoint("CENTER", 0, 0); b.t:SetTextColor(rgb(COL.text)); b.t:SetText(label)
  b:SetScript("OnEnter", function() rounded(b.lineT, "line", 5, COL.faint, 1) end); b:SetScript("OnLeave", function() rounded(b.lineT, "line", 5, COL.line2, 1) end)
  return b
end
local bCard = topButton("Card view", 92); bCard:SetPoint("RIGHT", bClose, "LEFT", -10, 0)
bCard:SetScript("OnClick", function() big:Hide(); card:Show(); render() end)
local bLine = big:CreateTexture(nil, "ARTWORK"); bLine:SetPoint("TOPLEFT", 1, -50); bLine:SetPoint("TOPRIGHT", -1, -50); bLine:SetHeight(1); fill(bLine, COL.line)
local bSideBg = big:CreateTexture(nil, "BACKGROUND", nil, -5); bSideBg:SetPoint("TOPLEFT", 1, -51); bSideBg:SetPoint("BOTTOMLEFT", 1, 1); bSideBg:SetWidth(SIDE); fill(bSideBg, "13161d", 0.6)
local bSideLine = big:CreateTexture(nil, "ARTWORK"); bSideLine:SetPoint("TOPLEFT", SIDE + 1, -51); bSideLine:SetPoint("BOTTOMLEFT", SIDE + 1, 1); bSideLine:SetWidth(1); fill(bSideLine, COL.line)
local side = CreateFrame("Frame", nil, big); side:SetPoint("TOPLEFT", 8, -60); side:SetSize(SIDE - 14, 560)
-- (the big window scrolls with the mouse wheel when it's taller than the screen leaves room for)
local bscroll = CreateFrame("ScrollFrame", nil, big); bscroll:SetPoint("TOPLEFT", SIDE + MX, -66); bscroll:SetSize(MW, 560)
local bm = CreateFrame("Frame", nil, bscroll); bm:SetSize(MW, 560); bscroll:SetScrollChild(bm)
bscroll:EnableMouseWheel(true)
bscroll:SetScript("OnMouseWheel", function(self, d) local mx = math.max(0, (bm:GetHeight() or 0) - (self:GetHeight() or 0)); self:SetVerticalScroll(math.min(mx, math.max(0, (self:GetVerticalScroll() or 0) - d * 48))) end)

-- pooled pieces (text, plain textures, rounded textures, buttons, chart lines)
local bpool = { fs = {}, tex = {}, rt = {}, btn = {}, ln = {} }
local bused = { fs = 0, tex = 0, rt = 0, btn = 0, ln = 0 }
local function bReset() for k in pairs(bused) do bused[k] = 0 end; for _, l in pairs(bpool) do for _, o in ipairs(l) do o:Hide(); if o.ClearAllPoints then o:ClearAllPoints() end end end end
local function bFS(parent, kind, size, hex)
  bused.fs = bused.fs + 1; local fs = bpool.fs[bused.fs]
  if not fs then fs = big:CreateFontString(nil, "OVERLAY"); bpool.fs[bused.fs] = fs end
  fs:SetParent(parent); setFont(fs, kind, size); fs:SetTextColor(rgb(hex or COL.text)); fs:SetJustifyH("LEFT"); fs:SetJustifyV("TOP"); fs:SetWordWrap(true); fs:SetWidth(0)
  if fs.SetSpacing then fs:SetSpacing(2) end
  fs:Show(); return fs
end
local function bTEX(parent, layer)
  bused.tex = bused.tex + 1; local t = bpool.tex[bused.tex]
  if not t then t = big:CreateTexture(nil, "ARTWORK"); bpool.tex[bused.tex] = t end
  t:SetParent(parent); t:SetDrawLayer(layer or "ARTWORK"); t:SetTexCoord(0, 1, 0, 1); t:SetAlpha(1); t:SetVertexColor(1, 1, 1); t:Show(); return t
end
local function bRT(parent, layer)
  bused.rt = bused.rt + 1; local t = bpool.rt[bused.rt]
  if not t then t = big:CreateTexture(nil, "BACKGROUND"); bpool.rt[bused.rt] = t end
  t:SetParent(parent); t:SetDrawLayer(layer or "BACKGROUND"); t:Show(); return t
end
local function bBTN(parent)
  bused.btn = bused.btn + 1; local b = bpool.btn[bused.btn]
  if not b then b = CreateFrame("Button", nil, big); bpool.btn[bused.btn] = b end
  b:SetParent(parent); b:SetScript("OnClick", nil); b:SetScript("OnEnter", nil); b:SetScript("OnLeave", nil); b:Show(); return b
end
local function bLINE(parent)
  bused.ln = bused.ln + 1; local l = bpool.ln[bused.ln]
  if not l then l = bm:CreateLine(nil, "ARTWORK"); bpool.ln[bused.ln] = l end
  l:Show(); return l
end
local function bBox(parent, x, y, w, h, fillHex, fillA, lineHex)
  local f = bRT(parent, "BACKGROUND"); f:SetPoint("TOPLEFT", x, -y); f:SetSize(w, h); rounded(f, "fill", 5, fillHex, fillA)
  local l = bRT(parent, "BORDER"); l:SetPoint("TOPLEFT", f, "TOPLEFT"); l:SetPoint("BOTTOMRIGHT", f, "BOTTOMRIGHT"); rounded(l, "line", 5, lineHex or COL.line, 1)
end
local function bIcon(parent, x, y, s, id, flag) local t = bTEX(parent); t:SetPoint("TOPLEFT", x, -y); t:SetSize(s, s); t:SetTexture(iconPath(id, flag)); if id and id ~= "" then t:SetTexCoord(0.08, 0.92, 0.08, 0.92) else t:SetTexCoord(0, 1, 0, 1) end; return t end
-- a row inside a panel: dot, icon, an optional bold title, then the text
local function bRow(x, y, w, flag, ic, text, ttl)
  local d = bTEX(bm); d:SetTexture(SLICE .. "dot"); d:SetPoint("TOPLEFT", x, -(y + 6)); d:SetSize(8, 8); d:SetVertexColor(rgb(FLAG[flag] or COL.faint))
  bIcon(bm, x + 16, y, 20, ic, flag)
  local yy = y
  if ttl and ttl ~= "" then local h = bFS(bm, "bold", 13.5, COL.text); h:SetPoint("TOPLEFT", x + 46, -yy); h:SetWidth(w - 46); h:SetText(ttl); yy = yy + h:GetStringHeight() + 2 end
  local t = bFS(bm, "body", 13.5, COL.soft); t:SetPoint("TOPLEFT", x + 46, -yy); t:SetWidth(w - 46); t:SetText(names(text))
  return math.max(y + 21, yy + t:GetStringHeight()) + 9
end
-- a panel: heading and a little note, then whatever draw() puts in it; returns the y under it
local function bPanel(x, y, w, title, note, draw)
  local y0 = y
  local t = bFS(bm, "head", 15, COL.text); t:SetPoint("TOPLEFT", x + 14, -(y + 12)); t:SetText(title)
  if note then local n = bFS(bm, "body", 12.5, COL.faint); n:SetJustifyH("RIGHT"); n:SetPoint("TOPRIGHT", bm, "TOPLEFT", x + w - 14, -(y + 14)); n:SetText(note) end
  y = draw(y + 40)
  if DB.cardStyle ~= "flat" then bBox(bm, x, y0, w, y - y0 + 4, COL.raised, DB.cardStyle == "glass" and 0.55 or 1) end
  return y + 16
end
-- the night's pulls on this boss, oldest first
local function nightOf(m)
  local l = {}
  -- (same boss and difficulty, within 10 hours of this pull: tonight)
  for _, q in ipairs(DB.pulls) do
    if q.h.boss == m.h.boss and q.h.diff == m.h.diff and (not (q.t and m.t) or math.abs(q.t - m.t) < 36000) then l[#l + 1] = q end
  end
  table.sort(l, function(a, b) return (tonumber(a.h.pull) or 0) < (tonumber(b.h.pull) or 0) end)
  return l
end
-- bar chart: how far each pull got (the kill in green, the closest wipe in the accent colour)
local function progressChart(x, y, w, h, list, curM)
  local n = math.max(#list, 1)
  local bw = math.min(26, (w - 40) / n)
  local best, bestI = 101, nil
  for i, q in ipairs(list) do local p = tonumber(q.h.pct) or 100; if not q.h.kill and p < best then best, bestI = p, i end end
  for _, v in ipairs({ 0, 50, 100 }) do
    local yy = y + (h - 16) * (v / 100)
    local g = bTEX(bm); g:SetPoint("TOPLEFT", x + 32, -yy); g:SetSize(w - 32, 1); fill(g, COL.line)
    local lt = bFS(bm, "body", 10.5, COL.faint); lt:SetPoint("TOPLEFT", x, -(yy - 6)); lt:SetText((100 - v) .. "%")
  end
  for i, q in ipairs(list) do
    local done = q.h.kill and 100 or (100 - (tonumber(q.h.pct) or 100))
    local bh = math.max(2, (h - 16) * done / 100)
    local b = bTEX(bm); b:SetPoint("TOPLEFT", x + 36 + (i - 1) * bw, -(y + (h - 16) - bh)); b:SetSize(math.max(2, bw - 3), bh)
    fill(b, q.h.kill and COL.good or (i == bestI and COL.gold or "4a5160"), q == curM and 1 or 0.85)
    if q == curM then local mk = bTEX(bm); mk:SetPoint("TOPLEFT", x + 36 + (i - 1) * bw, -(y + h - 12)); mk:SetSize(math.max(2, bw - 3), 2); fill(mk, COL.text) end
  end
  local lab = bFS(bm, "body", 11.5, COL.faint); lab:SetPoint("TOPLEFT", x + 36, -(y + h - 6))
  lab:SetText("Pull " .. (list[1] and list[1].h.pull or "") .. " to " .. (list[#list] and list[#list].h.pull or "") .. (bestI and ("   ·   closest wipe " .. best .. "%") or ""))
  return y + h + 14
end
-- line chart: one player's number on each pull of the night
local function lineChart(x, y, w, h, list, name)
  local pts = {}
  for _, q in ipairs(list) do for _, p in ipairs(q.players) do if p.name == name then pts[#pts + 1] = { q, parseK(p.v) } end end end
  if #pts < 2 then local t = bFS(bm, "body", 12.5, COL.faint); t:SetPoint("TOPLEFT", x, -y); t:SetText("A line of your numbers shows once you have two pulls on this boss."); return y + 24 end
  local lo, hi = math.huge, 0; for _, p in ipairs(pts) do lo = math.min(lo, p[2]); hi = math.max(hi, p[2]) end
  if hi == lo then hi = lo + 1 end
  local function px(i) return x + 4 + (i - 1) * (w - 8) / (#pts - 1) end
  local function py(v) return y + 4 + (h - 8) * (1 - (v - lo) / (hi - lo)) end
  for i = 2, #pts do
    local l = bLINE(bm); l:SetThickness(2); l:SetColorTexture(rgb(COL.gold))
    l:SetStartPoint("TOPLEFT", bm, px(i - 1), -py(pts[i - 1][2])); l:SetEndPoint("TOPLEFT", bm, px(i), -py(pts[i][2]))
  end
  local bi = 1; for i, p in ipairs(pts) do if p[2] > pts[bi][2] then bi = i end end
  for _, i in ipairs({ bi, #pts }) do local d = bTEX(bm); d:SetTexture(SLICE .. "dot"); d:SetSize(8, 8); d:SetPoint("CENTER", bm, "TOPLEFT", px(i), -py(pts[i][2])); d:SetVertexColor(rgb(i == bi and COL.text or COL.gold)) end
  local lab = bFS(bm, "body", 11.5, COL.faint); lab:SetPoint("TOPLEFT", x, -(y + h + 2))
  lab:SetText("Best " .. math.floor(pts[bi][2] + 0.5) .. "k on pull " .. pts[bi][1].h.pull .. "   ·   low " .. math.floor(lo + 0.5) .. "k")
  return y + h + 20
end

local bView = "me"
bigRender = function()
  local raw = DB.pulls[DB.cur]; local m = cutView(raw); if not m then return end
  CUR = m
  if DB.bigPos then big:ClearAllPoints(); big:SetPoint(DB.bigPos[1], UIParent, DB.bigPos[2], DB.bigPos[3], DB.bigPos[4]) end
  bReset()
  local h = m.h
  bCtx:SetText(h.boss .. "  ·  " .. h.diff)
  -- left: every saved pull, newest first, grouped by boss
  local sy, lastBoss = 0, nil
  local hd = bFS(side, "bold", 11.5, COL.muted); hd:SetPoint("TOPLEFT", 8, -sy); hd:SetText("SAVED PULLS")
  local cnt = bFS(side, "body", 11.5, COL.faint); cnt:SetJustifyH("RIGHT"); cnt:SetPoint("TOPRIGHT", side, "TOPLEFT", SIDE - 22, -sy); cnt:SetText(#DB.pulls .. "")
  sy = sy + 22
  for i = #DB.pulls, 1, -1 do
    if sy > 540 then break end
    local q = DB.pulls[i]
    if q.h.boss ~= lastBoss then
      lastBoss = q.h.boss; sy = sy + 4
      local bt = bFS(side, "head", 14, COL.text); bt:SetPoint("TOPLEFT", 8, -sy); bt:SetWidth(SIDE - 30); bt:SetWordWrap(false); bt:SetText(q.h.boss .. "  |cff6c7381" .. q.h.diff .. "|r"); sy = sy + 22
    end
    local b = bBTN(side); b:SetPoint("TOPLEFT", 0, -sy); b:SetSize(SIDE - 14, 26)
    if i == DB.cur then local hl = bRT(side, "BACKGROUND"); hl:SetPoint("TOPLEFT", 0, -sy); hl:SetSize(SIDE - 14, 26); rounded(hl, "fill", 5, "2a2618", 1); local e = bTEX(side); e:SetPoint("TOPLEFT", 0, -(sy + 3)); e:SetSize(2, 20); fill(e, COL.gold) end
    local n = bFS(side, "body", 13, COL.faint); n:SetPoint("TOPLEFT", 10, -(sy + 6)); n:SetText("Pull " .. q.h.pull)
    local qt, qc, qb = resultOf(q.h)
    local c = bFS(side, "bold", 11.5, qc); c:SetPoint("TOPLEFT", 74, -(sy + 6)); c:SetText(qt)
    local cb = bRT(side, "BORDER"); cb:SetPoint("TOPLEFT", 68, -(sy + 4)); cb:SetSize(c:GetStringWidth() + 12, 18); rounded(cb, "fill", 5, qb, 1)
    local d = bFS(side, "body", 12, COL.muted); d:SetJustifyH("RIGHT"); d:SetPoint("TOPRIGHT", side, "TOPLEFT", SIDE - 26, -(sy + 6)); d:SetText(q.h.dur)
    b:SetScript("OnClick", function() DB.cur = i; DB.who = nil; bigRender(); if card:IsShown() then render() end end)
    b:SetScript("OnEnter", function() n:SetTextColor(rgb(COL.text)) end); b:SetScript("OnLeave", function() n:SetTextColor(rgb(COL.faint)) end)
    sy = sy + 28
  end

  -- right: the fight header
  local y = 0
  local t = bFS(bm, "head", 26, COL.text); t:SetPoint("TOPLEFT", 0, -y); t:SetText("Pull " .. h.pull)
  local pl = bRT(bm, "BACKGROUND"); local ht, hc, hb2 = resultOf(h, true); local pt = bFS(bm, "bold", 13.5, hc); pt:SetText(ht)
  pl:SetPoint("LEFT", t, "RIGHT", 12, -1); pl:SetSize(pt:GetStringWidth() + 24, 26); rounded(pl, "fill", 5, hb2, 1); pt:SetPoint("CENTER", pl, "CENTER", 0, 0)
  local night = nightOf(m)
  local minP = 101; for _, q in ipairs(night) do local p = tonumber(q.h.pct) or 101; if not q.h.kill and p < minP then minP = p end end
  local note = h.kill and "A kill" or ((tonumber(h.pct) or 101) <= minP and "Closest pull tonight" or nil)
  if note then local nt = bFS(bm, "body", 13, COL.muted); nt:SetJustifyH("RIGHT"); nt:SetPoint("TOPRIGHT", bm, "TOPLEFT", MW, -(y + 8)); nt:SetText(note) end
  local meta = { h.dur }; if h.where ~= "" then meta[#meta + 1] = h.where end; meta[#meta + 1] = h.deaths .. " deaths"; meta[#meta + 1] = #m.players .. " players"; meta[#meta + 1] = #night .. " pulls on this boss saved"
  local mt = bFS(bm, "body", 13.5, COL.muted); mt:SetPoint("TOPLEFT", 0, -(y + 34)); mt:SetText(table.concat(meta, "   ·   "))
  y = y + 60
  -- tabs: Me, Raid view; on Me, arrows to look at anyone
  local P = pickWho(m)
  local tx = -10
  for _, k in ipairs(canRaid() and { { "me", "Me" }, { "raid", "Raid view" } } or { { "me", "Me" } }) do
    local b = bBTN(bm); local tt = bFS(bm, "bold", 14, bView == k[1] and COL.text or COL.muted); tt:SetText(k[2])
    b:SetSize(tt:GetStringWidth() + 20, 28); b:SetPoint("TOPLEFT", tx, -y); tt:SetPoint("CENTER", b, "CENTER", 0, 1); tx = tx + tt:GetStringWidth() + 20
    if bView == k[1] then local u = bTEX(bm); u:SetPoint("BOTTOMLEFT", b, "BOTTOMLEFT", 8, 0); u:SetPoint("BOTTOMRIGHT", b, "BOTTOMRIGHT", -8, 0); u:SetHeight(2); fill(u, COL.gold) end
    b:SetScript("OnClick", function() bView = k[1]; bigRender() end)
  end
  if bView == "raid" and not canRaid() then bView = "me" end
  if bView == "me" and P and #m.players > 1 then
    local who = bFS(bm, "bold", 13.5, classHex(P.cls)); who:SetJustifyH("RIGHT"); who:SetText(P.name); who:SetPoint("TOPRIGHT", bm, "TOPLEFT", MW - 32, -(y + 6))
    local function arrow(lbl, dx, dir)
      local b = bBTN(bm); b:SetSize(22, 22); local bg = bRT(bm, "BORDER"); bg:SetAllPoints(b); rounded(bg, "fill", 5, COL.raised, 1)
      local at = bFS(bm, "bold", 11, COL.muted); at:SetText(lbl); at:SetPoint("CENTER", b, "CENTER", 0, 0)
      b:SetScript("OnClick", function() local idx = 1; for ii, p in ipairs(m.players) do if p == P then idx = ii end end; idx = ((idx - 1 + dir) % #m.players) + 1; DB.who = m.players[idx].name; bigRender() end)
      return b
    end
    local nx = arrow(">", 0, 1); nx:SetPoint("TOPRIGHT", bm, "TOPLEFT", MW, -(y + 2))
    local pv = arrow("<", 0, -1); pv:SetPoint("RIGHT", who, "LEFT", -8, 0)
  end
  local tl = bTEX(bm); tl:SetPoint("TOPLEFT", -MX, -(y + 29)); tl:SetSize(MW + MX * 2, 1); fill(tl, COL.line)
  y = y + 44

  local yl, yr = y, y
  local XL, XR = 0, COLW + 18
  if bView == "me" and P then
    -- left column: three tiles, the line of your numbers, rotation, boss mechanics, next pull
    local tw = (COLW - 20) / 3
    local tiles = {
      { P.role == "healer" and "Your healing" or "Your damage", P.v, P.unit, P.d and ((P.d >= 0 and "|cff7ee08f+" or "|cffff8f87") .. P.d .. "%|r vs pull " .. P.vs) or "" },
      { "Best tonight", P.best ~= "" and P.best or P.v, "", P.bp ~= "" and ("pull " .. P.bp) or "this pull" },
      goalFor(P, m) > 0 and { "Goal", math.floor(100 * parseK(P.v) / goalFor(P, m) + 0.5) .. "%", "", "of " .. goalFor(P, m) .. "k" .. (P.role == "healer" and " HPS" or " DPS") }
        or { "Place", (P.rank:match("^(%S+)") or "–"), "", (P.rank:match("^%S+ (.+)$") or "") },
    }
    for i, tdef in ipairs(tiles) do
      local x = XL + (i - 1) * (tw + 10)
      if DB.cardStyle ~= "flat" then bBox(bm, x, yl, tw, 70, COL.raised, DB.cardStyle == "glass" and 0.55 or 1) end
      local l = bFS(bm, "body", 12.5, COL.muted); l:SetPoint("TOPLEFT", x + 12, -(yl + 10)); l:SetText(tdef[1])
      local v = bFS(bm, "head", 26, COL.text); v:SetPoint("TOPLEFT", x + 12, -(yl + 26)); v:SetText(tdef[2])
      if tdef[3] ~= "" then local u = bFS(bm, "bold", 11.5, COL.muted); u:SetPoint("BOTTOMLEFT", v, "BOTTOMRIGHT", 4, 4); u:SetText(tdef[3]) end
      local s = bFS(bm, "body", 12, COL.faint); s:SetPoint("TOPLEFT", x + 12, -(yl + 52)); s:SetWidth(tw - 20); s:SetWordWrap(false); s:SetText(tdef[4])
    end
    yl = yl + 82
    if DB.bigLine ~= false then
      yl = bPanel(XL, yl, COLW, P.role == "healer" and "Your healing tonight" or "Your damage tonight", #night .. " pulls", function(yy) return lineChart(XL + 14, yy, COLW - 28, 70, night, P.name) end)
    end
    local function list(title, rows)
      local shown = {}; for _, r in ipairs(rows) do if not (DB.onlyBad and r[1] == "ok") then shown[#shown + 1] = r end end
      yl = bPanel(XL, yl, COLW, title, #shown > 0 and (#shown .. (#shown == 1 and " line" or " lines")) or nil, function(yy)
        if #shown == 0 then return bRow(XL + 14, yy, COLW - 28, "ok", nil, title == "Rotation" and "Nothing to fix here." or "No boss mistakes.") end
        for _, r in ipairs(shown) do yy = bRow(XL + 14, yy, COLW - 28, r[1], r[2], r[3]) end
        return yy
      end)
    end
    if DB.bossFirst then list("Boss mechanics", P.boss); list("Rotation", P.slips) else list("Rotation", P.slips); list("Boss mechanics", P.boss) end
    if P.surv and #P.surv > 0 and (DB.show or {}).surv ~= false then list("Survival", P.surv) end
    if P.next ~= "" then
      local tx = bFS(bm, "body", 14, COL.text); tx:SetWidth(COLW - 32); tx:SetText(names(P.next))
      local hh = 28 + tx:GetStringHeight() + 12
      bBox(bm, XL, yl, COLW, hh, COL.gold, 0.07, COL.gold); local bar = bTEX(bm); bar:SetPoint("TOPLEFT", XL + 1, -(yl + 6)); bar:SetSize(3, hh - 12); fill(bar, COL.gold)
      local lb = bFS(bm, "bold", 11.5, COL.gold); lb:SetPoint("TOPLEFT", XL + 16, -(yl + 11)); lb:SetText("NEXT PULL"); tx:SetPoint("TOPLEFT", XL + 16, -(yl + 28))
      yl = yl + hh + 12
    end
  else
    if (m.raid.story or "") ~= "" then
      yl = bPanel(XL, yl, COLW, "The pull", nil, function(yy)
        local t = bFS(bm, "body", 13.5, COL.soft); t:SetPoint("TOPLEFT", XL + 14, -yy); t:SetWidth(COLW - 28); t:SetText(names(m.raid.story)); yy = yy + t:GetStringHeight() + 8
        for _, bw in ipairs({ { m.raid.better, "Better", COL.goodT }, { m.raid.worse, "Worse", COL.warn } }) do
          if (bw[1] or "") ~= "" then
            local k = bFS(bm, "bold", 12, bw[3]); k:SetPoint("TOPLEFT", XL + 14, -yy); k:SetText(bw[2])
            local tx = bFS(bm, "body", 13, COL.soft); tx:SetPoint("TOPLEFT", XL + 84, -yy); tx:SetWidth(COLW - 98); tx:SetText(names(bw[1])); yy = yy + math.max(18, tx:GetStringHeight()) + 6
          end
        end
        return yy
      end)
    end
    yl = bPanel(XL, yl, COLW, h.kill and "What to clean up" or "Top mistakes", #m.raid.bad .. " found", function(yy)
      if #m.raid.bad == 0 then return bRow(XL + 14, yy, COLW - 28, "ok", nil, "Nothing big.") end
      for _, r in ipairs(m.raid.bad) do yy = bRow(XL + 14, yy, COLW - 28, r[1], r[2], r[4], r[3]) end
      return yy
    end)
    if m.raid.mech and #m.raid.mech > 0 then
      local ok = 0; for _, r in ipairs(m.raid.mech) do if r[1] == "ok" then ok = ok + 1 end end
      yl = bPanel(XL, yl, COLW, "Boss mechanics", ok .. " of " .. #m.raid.mech .. " done right", function(yy)
        for i, r in ipairs(m.raid.mech) do if i <= (DB.maxMech or 6) then yy = bRow(XL + 14, yy, COLW - 28, r[1], r[2], r[4], r[3]) end end
        return yy
      end)
    end
    if m.raid.next ~= "" then
      local tx = bFS(bm, "body", 14, COL.text); tx:SetWidth(COLW - 32); tx:SetText(names(m.raid.next))
      local hh = 28 + tx:GetStringHeight() + 12
      bBox(bm, XL, yl, COLW, hh, COL.gold, 0.07, COL.gold); local bar = bTEX(bm); bar:SetPoint("TOPLEFT", XL + 1, -(yl + 6)); bar:SetSize(3, hh - 12); fill(bar, COL.gold)
      local lb = bFS(bm, "bold", 11.5, COL.gold); lb:SetPoint("TOPLEFT", XL + 16, -(yl + 11)); lb:SetText("NEXT PULL"); tx:SetPoint("TOPLEFT", XL + 16, -(yl + 28))
      yl = yl + hh + 12
    end
  end
  -- right column: progress tonight, the raid's top mistakes (on Me), who died
  if DB.bigChart ~= false then
    yr = bPanel(XR, yr, COLW, "Progress tonight", "how far each pull got", function(yy) return progressChart(XR + 14, yy, COLW - 28, 130, night, m) end)
  end
  if bView == "me" then
    yr = bPanel(XR, yr, COLW, h.kill and "What to clean up" or "Top mistakes", "raid", function(yy)
      if #m.raid.bad == 0 then return bRow(XR + 14, yy, COLW - 28, "ok", nil, "Nothing big.") end
      for i, r in ipairs(m.raid.bad) do if i <= 3 then yy = bRow(XR + 14, yy, COLW - 28, r[1], r[2], r[4], r[3]) end end
      return yy
    end)
    if m.raid.mech and #m.raid.mech > 0 then
      local ok = 0; for _, r in ipairs(m.raid.mech) do if r[1] == "ok" then ok = ok + 1 end end
      yr = bPanel(XR, yr, COLW, "Boss mechanics", ok .. " of " .. #m.raid.mech .. " done right", function(yy)
        for i, r in ipairs(m.raid.mech) do if i <= 4 then yy = bRow(XR + 14, yy, COLW - 28, r[1], r[2], r[4], r[3]) end end
        return yy
      end)
    end
  end
  if (DB.maxDied or 3) > 0 then
    yr = bPanel(XR, yr, COLW, "Who died", cutIdx(raw) > 0 and (m.h.deaths .. ", counted up to the " .. ordN(cutIdx(raw))) or (m.h.deaths .. ""), function(yy)
      if #m.raid.died == 0 then local tt = bFS(bm, "body", 13, COL.faint); tt:SetPoint("TOPLEFT", XR + 14, -yy); tt:SetText(m.raid.more ~= "" and m.raid.more or "Nobody died."); return yy + 22 end
      for _, d in ipairs(m.raid.died) do
        local tm = bFS(bm, "body", 13.5, COL.muted); tm:SetPoint("TOPLEFT", XR + 14, -yy); tm:SetText(d[1])
        local nm = bFS(bm, "bold", 13.5, classHex(d[3])); nm:SetPoint("TOPLEFT", XR + 58, -yy); nm:SetWidth(120); nm:SetWordWrap(false); nm:SetText(d[2])
        bIcon(bm, XR + 184, yy - 1, 18, d[4])
        local w = bFS(bm, "body", 13.5, COL.muted); w:SetPoint("TOPLEFT", XR + 210, -yy); w:SetWidth(COLW - 224); w:SetWordWrap(false); w:SetText(d[5])
        yy = yy + 24
      end
      if m.raid.more ~= "" then local mo = bFS(bm, "body", 12.5, COL.faint); mo:SetPoint("TOPLEFT", XR + 14, -(yy + 2)); mo:SetText(m.raid.more); yy = yy + 22 end
      return yy
    end)
  end
  local hgt = math.max(yl, yr, sy + 10)
  bm:SetHeight(hgt)
  local room = math.max(400, ((UIParent and UIParent.GetHeight and UIParent:GetHeight()) or 768) / math.max(0.5, (big.GetScale and big:GetScale()) or 1) - 40)
  local bh = math.min(room, 66 + hgt + 14); big:SetHeight(bh); bscroll:SetHeight(math.max(10, bh - 80))
  bscroll:SetVerticalScroll(math.min((bscroll:GetVerticalScroll() or 0), math.max(0, hgt - (bh - 80))))
end
function Debrief_ToggleBig()
  if not DB or #DB.pulls == 0 then say("no pulls yet. /debrief demo shows a sample."); return end
  if big:IsShown() then big:Hide() else big:Show(); bigRender() end
end
end

-- ---------- a newer addon: the PC app put it in WoW (type /reload), or it's out (get it on the website) ----------
local function vnum(v) local a, b, c = tostring(v or ""):match("^(%d+)%.?(%d*)%.?(%d*)"); return (tonumber(a) or 0) * 1e6 + (tonumber(b) or 0) * 1e3 + (tonumber(c) or 0) end
local MY_V = (C_AddOns and C_AddOns.GetAddOnMetadata and C_AddOns.GetAddOnMetadata(ADDON, "Version")) or (GetAddOnMetadata and GetAddOnMetadata(ADDON, "Version")) or "0"
local toldV
local function checkNewer(m, mine)
  if not m.addonV or m.addonV == "" or vnum(m.addonV) <= vnum(MY_V) or toldV == m.addonV then return end
  toldV = m.addonV
  if mine or DB.hasApp then say("|cff" .. COL.goodT .. "Debrief was updated to " .. m.addonV .. ".|r Type /reload when you're ready.")
  else say("a newer Debrief (" .. m.addonV .. ") is out. Get it at debriefme.io/companion.") end
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
  checkNewer(m, false)
  if addPull(m) then
    say("pull " .. m.h.pull .. " of " .. m.h.boss .. " is in, from " .. from .. ".")
    if DB.autoShow ~= false then showCard() else say("type /dbr to see it.") end
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
  if not m then
    if toast:IsShown() then toastSay(err:match("^[^%.]+%.") or err, COL.badT) else pMsg:SetTextColor(rgb(COL.badT)); pMsg:SetText(err) end
    return false
  end
  local new, swapped = addPull(m, true)
  DB.pasted = true
  checkNewer(m, true)
  -- (pressed before the PC app had the new pull ready: that's the last one again, so wait for the chime and try again)
  if not new and not swapped and toast:IsShown() and not DB.testMode then toastSay("That's the last pull. Wait for the chime.", COL.warn); return true end
  paste:Hide(); if toast:IsShown() then closeToast() end
  showCard()
  say("pull " .. m.h.pull .. " of " .. m.h.boss .. " loaded.")
  -- (someone else already sent this pull to the group: don't send it twice)
  if new then share(text) end
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
local WIDTH_CHOICES = { { "narrow", "Narrow" }, { "normal", "Normal" }, { "wide", "Wide" }, { "large", "Large" }, { "xl", "Extra wide" } }
function Debrief_FitPreview()
  if not (opt and opt:IsShown() and card:IsShown()) then return end
  local avail = ((UIParent and UIParent:GetWidth()) or 1600) - ((opt:GetRight() or 900) * (opt:GetEffectiveScale() or 1) / ((UIParent and UIParent:GetEffectiveScale()) or 1)) - 24
  local w = (card:GetWidth() or 400) * (DB.scale or 1)
  card:SetScale((w > avail and avail > 200) and math.max(0.55, (DB.scale or 1) * avail / w) or (DB.scale or 1))
end
local function applySettings()
  reapplyFonts()
  card:SetScale(DB.scale or 1); paste:SetScale(DB.scale or 1); big:SetScale(DB.bigScale or 1); mini:SetScale(DB.miniScale or 1)
  Debrief_FitPreview()
  Debrief_ApplyStyle()
  if card:IsShown() then render() end
  if big:IsShown() then bigRender() end
  if mini:IsShown() then miniShow() end
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
-- (the settings window, sleek like the website (Oct 22): a slim header, three tabs (Card, Look, More), thin rows, explanations in
-- a tooltip on the little i, the card's pieces as chips, and the Companion's colours: green for what's on, gold for your picks)
local OW, OH = 430, 640
local DEEP, PANEL = "0f1117", "171a22"
local EM, EMD = "5fdc7a", "178a3c"
-- (a left-to-right colour fade: the Companion's gold to green, or green shades on a switch)
local function grad(tex, a, b)
  if tex.SetGradient and CreateColor then local r1, g1, b1 = rgb(a); local r2, g2, b2 = rgb(b); tex:SetVertexColor(1, 1, 1, 1); tex:SetGradient("HORIZONTAL", CreateColor(r1, g1, b1, 1), CreateColor(r2, g2, b2, 1))
  else tex:SetVertexColor(rgb(b)) end
end
local function buildOptions()
  opt = CreateFrame("Frame", "DebriefOptions", UIParent)
  opt:SetSize(OW, OH); opt:SetPoint("CENTER", -220, 10); opt:SetFrameStrata("DIALOG"); opt:SetClampedToScreen(true); opt:Hide()
  skin(opt, 8, "13161d", 0.98, COL.line2, 1, true)
  opt:SetMovable(true); opt:EnableMouse(true); opt:RegisterForDrag("LeftButton")
  opt:SetScript("OnDragStart", opt.StartMoving); opt:SetScript("OnDragStop", opt.StopMovingOrSizing)
  tinsert(UISpecialFrames, "DebriefOptions")
  -- (a soft green glow from the logo's corner, like the Companion's window)
  local glow = opt:CreateTexture(nil, "BACKGROUND", nil, -5); glow:SetPoint("TOPLEFT", 1, -1); glow:SetPoint("TOPRIGHT", -1, -1); glow:SetHeight(80)
  if glow.SetGradient and CreateColor then glow:SetColorTexture(1, 1, 1, 1); glow:SetGradient("HORIZONTAL", CreateColor(0.37, 0.86, 0.48, 0.06), CreateColor(0.9, 0.7, 0.31, 0.02)) else glow:SetColorTexture(0, 0, 0, 0) end
  -- the header: the logo, Debrief, Settings, and a plain ×
  local lg = opt:CreateTexture(nil, "ARTWORK"); lg:SetSize(18, 18); lg:SetPoint("TOPLEFT", 16, -14); lg:SetTexture(MEDIA .. "Media\\logo")
  local tt = opt:CreateFontString(nil, "OVERLAY"); setFont(tt, "head", 16); tt:SetPoint("LEFT", lg, "RIGHT", 7, 0); tt:SetTextColor(rgb(COL.text)); tt:SetText("Debrief")
  local ts = opt:CreateFontString(nil, "OVERLAY"); setFont(ts, "body", 12); ts:SetPoint("LEFT", tt, "RIGHT", 7, -1); ts:SetTextColor(rgb(COL.faint)); ts:SetText("Settings")
  local clb = CreateFrame("Button", nil, opt); clb:SetSize(24, 24); clb:SetPoint("TOPRIGHT", -10, -10)
  clb.t = clb:CreateFontString(nil, "OVERLAY"); setFont(clb.t, "bold", 16); clb.t:SetPoint("CENTER", 0, 1); clb.t:SetText("×"); clb.t:SetTextColor(rgb(COL.faint))
  clb:SetScript("OnClick", function() opt:Hide() end)
  clb:SetScript("OnEnter", function() clb.t:SetTextColor(rgb(COL.text)) end); clb:SetScript("OnLeave", function() clb.t:SetTextColor(rgb(COL.faint)) end)
  -- three tabs, plain words with the gold-to-green line under the open one
  local MENU = { { "card", "Card" }, { "look", "Look" }, { "more", "More" } }
  local TAB_Y, PAGE_TOP, FOOT = 40, 74, 30
  local tline = opt:CreateTexture(nil, "ARTWORK"); tline:SetPoint("TOPLEFT", 1, -(TAB_Y + 28)); tline:SetPoint("TOPRIGHT", -1, -(TAB_Y + 28)); tline:SetHeight(1); fill(tline, COL.line)
  local pages, tabBtns, cur = {}, {}, "card"
  local function showPage(k)
    cur = k
    for kk, p in pairs(pages) do p.sf:SetShown(kk == k) end
    for kk, b in pairs(tabBtns) do local on = kk == k; b.t:SetTextColor(rgb(on and COL.text or COL.muted)); b.u:SetShown(on) end
  end
  local tx = 16
  for _, it in ipairs(MENU) do
    local key = it[1]
    local b = CreateFrame("Button", nil, opt); b:SetHeight(28); b:SetPoint("TOPLEFT", tx, -TAB_Y)
    b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 13.5); b.t:SetPoint("CENTER", 0, 1); b.t:SetText(it[2])
    b:SetWidth(b.t:GetStringWidth() + 4); tx = tx + b:GetWidth() + 20
    b.u = b:CreateTexture(nil, "OVERLAY"); b.u:SetPoint("BOTTOMLEFT", 0, 0); b.u:SetPoint("BOTTOMRIGHT", 0, 0); b.u:SetHeight(2); b.u:SetColorTexture(1, 1, 1, 1); grad(b.u, COL.gold, EM)
    b:SetScript("OnClick", function() showPage(key) end)
    b:SetScript("OnEnter", function() if cur ~= key then b.t:SetTextColor(rgb(COL.text)) end end)
    b:SetScript("OnLeave", function() if cur ~= key then b.t:SetTextColor(rgb(COL.muted)) end end)
    tabBtns[key] = b
    -- (each page scrolls with the mouse wheel)
    local sf = CreateFrame("ScrollFrame", nil, opt); sf:SetPoint("TOPLEFT", 0, -PAGE_TOP); sf:SetPoint("BOTTOMRIGHT", 0, FOOT + 1); sf:Hide()
    local p = CreateFrame("Frame", nil, sf); p:SetSize(OW, 10); sf:SetScrollChild(p); p.sf = sf
    sf:EnableMouseWheel(true)
    sf:SetScript("OnMouseWheel", function(self, d) local mx = math.max(0, p:GetHeight() - (self:GetHeight() or 0)); self:SetVerticalScroll(math.max(0, math.min(mx, (self:GetVerticalScroll() or 0) - d * 40))) end)
    pages[key] = p
  end
  refreshers[#refreshers + 1] = function() showPage(cur) end
  -- the small print at the bottom
  local fl = opt:CreateTexture(nil, "ARTWORK"); fl:SetPoint("BOTTOMLEFT", 1, FOOT); fl:SetPoint("BOTTOMRIGHT", -1, FOOT); fl:SetHeight(1); fill(fl, COL.line)
  local f1 = opt:CreateFontString(nil, "OVERLAY"); setFont(f1, "body", 11.5); f1:SetPoint("BOTTOMLEFT", 16, 10); f1:SetTextColor(rgb(COL.faint)); f1:SetText("Saves as you go")
  local f2 = opt:CreateFontString(nil, "OVERLAY"); setFont(f2, "body", 11.5); f2:SetPoint("BOTTOMRIGHT", -16, 10); f2:SetTextColor(rgb(COL.faint))
  f2:SetText("/db  ·  Version " .. ((C_AddOns and C_AddOns.GetAddOnMetadata and C_AddOns.GetAddOnMetadata(ADDON, "Version")) or ""))

  -- ---------- the pieces every page is made of ----------
  local PX = 16
  local P, y, first
  local function page(k) if P then P:SetHeight(y + 14) end; P = k and pages[k]; y = 6; first = true end
  -- (a small upper-case label over a group: gold for the first on a page)
  local function section(title, gold, new)
    local h = P:CreateFontString(nil, "OVERLAY"); setFont(h, "bold", 10.5); h:SetPoint("TOPLEFT", PX, -(y + (first and 4 or 16))); h:SetTextColor(rgb(gold and COL.gold or COL.faint)); h:SetText(string.upper(title))
    if new then local n = P:CreateFontString(nil, "OVERLAY"); setFont(n, "bold", 9.5); n:SetPoint("LEFT", h, "RIGHT", 6, 0); n:SetTextColor(rgb(EM)); n:SetText("NEW") end
    y = y + (first and 22 or 34); first = false; P.rowFirst = true
  end
  local function custom() DB.preset = nil; Debrief_RefreshOptions() end
  -- (one thin row: the label left, its control right; the longer word in a tooltip on a small i)
  local function rowBase(label, sub)
    if not P.rowFirst then local ln = P:CreateTexture(nil, "ARTWORK"); ln:SetPoint("TOPLEFT", PX, -y); ln:SetPoint("TOPRIGHT", -PX, -y); ln:SetHeight(1); fill(ln, COL.line, 0.8) end
    P.rowFirst = false
    local t = P:CreateFontString(nil, "OVERLAY"); setFont(t, "body", 13.5); t:SetPoint("TOPLEFT", PX, -(y + 8)); t:SetTextColor(rgb(COL.text)); t:SetText(label)
    if sub then
      local ring = P:CreateTexture(nil, "ARTWORK"); ring:SetTexture(SLICE .. "dot"); ring:SetSize(12, 12); ring:SetPoint("LEFT", t, "RIGHT", 6, 0); ring:SetVertexColor(rgb(COL.line2))
      local it = P:CreateFontString(nil, "OVERLAY"); setFont(it, "bold", 9); it:SetPoint("CENTER", ring, "CENTER", 0, 0); it:SetTextColor(rgb(COL.muted)); it:SetText("i")
      local hb = CreateFrame("Button", nil, P); hb:SetPoint("TOPLEFT", t, "TOPLEFT", -2, 4); hb:SetPoint("BOTTOMRIGHT", ring, "BOTTOMRIGHT", 2, -4)
      hb:SetScript("OnEnter", function() GameTooltip:SetOwner(hb, "ANCHOR_RIGHT"); GameTooltip:SetText(label, 1, 1, 1); GameTooltip:AddLine(sub, 0.75, 0.78, 0.82, true); GameTooltip:Show() end)
      hb:SetScript("OnLeave", function() GameTooltip:Hide() end)
    end
    local cy = y + 15; y = y + 30
    return cy
  end
  -- (a small on/off switch: the Companion's green when on)
  local function switch(label, sub, get, set, keepPreset)
    local cy = rowBase(label, sub)
    local b = CreateFrame("Button", nil, P); b:SetSize(28, 16); b:SetPoint("RIGHT", P, "TOPRIGHT", -PX, -cy)
    b.tr = b:CreateTexture(nil, "ARTWORK"); b.tr:SetAllPoints()
    b.k = b:CreateTexture(nil, "OVERLAY"); b.k:SetSize(12, 12); b.k:SetTexture(SLICE .. "dot")
    local function show()
      local on = get()
      rounded(b.tr, "fill", 5, on and "ffffff" or "2a2f3b", 1); if on then grad(b.tr, EMD, EM) end
      b.k:ClearAllPoints(); b.k:SetPoint("CENTER", b, on and "RIGHT" or "LEFT", on and -8 or 8, 0); b.k:SetVertexColor(rgb(on and "0f2416" or COL.faint))
    end
    b:SetScript("OnClick", function() set(not get()); if not keepPreset then custom() end; show(); applySettings() end)
    refreshers[#refreshers + 1] = show; show()
  end
  local function txtBtn(label)
    local b = CreateFrame("Button", nil, P); b:SetSize(18, 20)
    b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 13); b.t:SetPoint("CENTER", 0, 0); b.t:SetText(label); b.t:SetTextColor(rgb(COL.faint))
    b:SetScript("OnEnter", function() b.t:SetTextColor(rgb(COL.gold)) end); b:SetScript("OnLeave", function() b.t:SetTextColor(rgb(COL.faint)) end)
    return b
  end
  -- (– 3 + for counts)
  local function stepper(label, sub, minV, maxV, get, set, fmt, keepPreset, step)
    local cy = rowBase(label, sub)
    local plus = txtBtn("+"); plus:SetPoint("RIGHT", P, "TOPRIGHT", -PX + 4, -cy)
    local val = P:CreateFontString(nil, "OVERLAY"); setFont(val, "bold", 13); val:SetWidth(46); val:SetJustifyH("CENTER"); val:SetPoint("RIGHT", plus, "LEFT", 0, 0); val:SetTextColor(rgb(COL.text))
    local minus = txtBtn("–"); minus:SetPoint("RIGHT", val, "LEFT", 0, 0)
    local function show() val:SetText((fmt or tostring)(get())) end
    local function go(d) local v = math.max(minV, math.min(maxV, get() + d)); if v ~= get() then set(v); if not keepPreset then custom() end; show(); applySettings() end end
    minus:SetScript("OnClick", function() go(-(step or 1)) end); plus:SetScript("OnClick", function() go(step or 1) end)
    refreshers[#refreshers + 1] = show; show()
  end
  -- (a percentage slider: a thin gold-to-green line and its number)
  local function pslider(label, sub, minV, maxV, get, set)
    local cy = rowBase(label, sub)
    local vt = P:CreateFontString(nil, "OVERLAY"); setFont(vt, "bold", 11.5); vt:SetWidth(38); vt:SetJustifyH("RIGHT"); vt:SetPoint("RIGHT", P, "TOPRIGHT", -PX, -cy); vt:SetTextColor(rgb(COL.muted))
    local s = CreateFrame("Slider", nil, P); s:SetSize(120, 16); s:SetPoint("RIGHT", vt, "LEFT", -8, 0); s:SetOrientation("HORIZONTAL")
    s:SetMinMaxValues(minV, maxV); s:SetValueStep(0.05); if s.SetObeyStepOnDrag then s:SetObeyStepOnDrag(true) end
    local track = s:CreateTexture(nil, "BACKGROUND"); track:SetPoint("LEFT", 0, 0); track:SetPoint("RIGHT", 0, 0); track:SetHeight(3); fill(track, "2f3542")
    local fillT = s:CreateTexture(nil, "BORDER"); fillT:SetPoint("LEFT", 0, 0); fillT:SetHeight(3); fillT:SetColorTexture(1, 1, 1, 1); grad(fillT, COL.gold, EM)
    local thumb = s:CreateTexture(nil, "ARTWORK"); thumb:SetTexture(SLICE .. "dot"); thumb:SetSize(11, 11); thumb:SetVertexColor(rgb(COL.text)); s:SetThumbTexture(thumb)
    local busy = false
    local function paint(v) fillT:SetWidth(math.max(1, 120 * (v - minV) / (maxV - minV))); vt:SetText(math.floor(v * 100 + 0.5) .. "%") end
    s:SetScript("OnValueChanged", function(self, v) v = math.floor(v * 20 + 0.5) / 20; paint(v); if busy or v == get() then return end; set(v); applySettings() end)
    s:EnableMouseWheel(true); s:SetScript("OnMouseWheel", function(self, d) self:SetValue(math.max(minV, math.min(maxV, self:GetValue() + d * 0.05))) end)
    local function show() busy = true; s:SetValue(get()); paint(get()); busy = false end
    refreshers[#refreshers + 1] = show; show()
  end
  -- (‹ value › through a short list)
  local function choice(label, sub, list, get, set, keepPreset)
    local cy = rowBase(label, sub)
    local nx = txtBtn("›"); nx:SetPoint("RIGHT", P, "TOPRIGHT", -PX + 4, -cy)
    local val = P:CreateFontString(nil, "OVERLAY"); setFont(val, "bold", 12.5); val:SetWidth(120); val:SetJustifyH("CENTER"); val:SetPoint("RIGHT", nx, "LEFT", 0, 0); val:SetTextColor(rgb(COL.text)); val:SetWordWrap(false)
    local pv = txtBtn("‹"); pv:SetPoint("RIGHT", val, "LEFT", 0, 0)
    local function idx() for i, c in ipairs(list) do if c[1] == get() then return i end end return 1 end
    local function show() local c = list[idx()]; val:SetText(c[2]) end
    local function go(d) local i = ((idx() - 1 + d) % #list) + 1; set(list[i][1]); if not keepPreset then custom() end; applySettings(); Debrief_RefreshOptions() end
    pv:SetScript("OnClick", function() go(-1) end); nx:SetScript("OnClick", function() go(1) end)
    refreshers[#refreshers + 1] = show; show()
  end
  -- (a few words side by side; the chosen one in gold)
  local function segment(label, sub, list, get, set, keepPreset)
    local cy = rowBase(label, sub)
    local btns, prev = {}, nil
    for i = #list, 1, -1 do
      local c = list[i]
      local b = CreateFrame("Button", nil, P); b:SetHeight(20)
      b.bg = b:CreateTexture(nil, "BACKGROUND"); b.bg:SetAllPoints()
      b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 12); b.t:SetPoint("CENTER", 0, 0); b.t:SetText(c[2])
      b:SetWidth(b.t:GetStringWidth() + 14)
      if prev then b:SetPoint("RIGHT", prev, "LEFT", -2, 0) else b:SetPoint("RIGHT", P, "TOPRIGHT", -PX + 4, -cy) end
      prev = b; btns[i] = b
      b:SetScript("OnClick", function() set(c[1]); if not keepPreset then custom() end; applySettings(); Debrief_RefreshOptions() end)
      b:SetScript("OnEnter", function() if get() ~= c[1] then b.t:SetTextColor(rgb(COL.text)) end end)
      b:SetScript("OnLeave", function() if get() ~= c[1] then b.t:SetTextColor(rgb(COL.muted)) end end)
    end
    local function show() for i, b in ipairs(btns) do local on = get() == list[i][1]; rounded(b.bg, "fill", 5, COL.gold, on and 0.15 or 0); b.t:SetTextColor(rgb(on and COL.gold or COL.muted)) end end
    refreshers[#refreshers + 1] = show; show()
  end
  -- (small colour dots, a ring round the chosen one)
  local function swatches(label, sub, list, get, set)
    local cy = rowBase(label, sub)
    local dots = {}
    for i = #list, 1, -1 do
      local c = list[i]
      local b = CreateFrame("Button", nil, P); b:SetSize(20, 20)
      if i == #list then b:SetPoint("RIGHT", P, "TOPRIGHT", -PX + 3, -cy) else b:SetPoint("RIGHT", dots[i + 1], "LEFT", -2, 0) end
      b.ring = b:CreateTexture(nil, "BACKGROUND"); b.ring:SetSize(18, 18); b.ring:SetPoint("CENTER"); b.ring:SetTexture(SLICE .. "dot")
      b.dot = b:CreateTexture(nil, "ARTWORK"); b.dot:SetSize(13, 13); b.dot:SetPoint("CENTER"); b.dot:SetTexture(SLICE .. "dot")
      b:SetScript("OnClick", function() set(c[1]); applySettings(); Debrief_RefreshOptions() end)
      b:SetScript("OnEnter", function() GameTooltip:SetOwner(b, "ANCHOR_TOP"); GameTooltip:SetText(c[2]); GameTooltip:Show() end)
      b:SetScript("OnLeave", function() GameTooltip:Hide() end)
      dots[i] = b
    end
    local function show()
      for i, b in ipairs(dots) do
        local hx = list[i][3]; if type(hx) == "function" then hx = hx() end
        b.dot:SetVertexColor(rgb(hx)); local on = get() == list[i][1]
        b.ring:SetVertexColor(rgb(COL.gold)); b.ring:SetAlpha(on and 1 or 0)
      end
    end
    refreshers[#refreshers + 1] = show; show()
  end
  -- (the card's pieces as small rectangles: green with a tick when on, grey when off; click to switch)
  local function chips(items)
    local x, rowH = PX, 28
    for _, it in ipairs(items) do
      local b = CreateFrame("Button", nil, P); b:SetHeight(22)
      b.fillT = b:CreateTexture(nil, "BACKGROUND"); b.fillT:SetAllPoints(); b.lineT = b:CreateTexture(nil, "BORDER"); b.lineT:SetAllPoints()
      b.ck = b:CreateTexture(nil, "OVERLAY"); b.ck:SetSize(11, 11); b.ck:SetPoint("LEFT", 8, 0); b.ck:SetTexture("Interface\\RaidFrame\\ReadyCheck-Ready")
      b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 12); b.t:SetPoint("LEFT", 23, 0); b.t:SetText(it[1])
      b:SetWidth(b.t:GetStringWidth() + 33)
      if x + b:GetWidth() > OW - PX then x = PX; y = y + rowH end
      b:SetPoint("TOPLEFT", x, -y); x = x + b:GetWidth() + 6
      local function show()
        local on = it[2]()
        rounded(b.fillT, "fill", 5, on and EM or COL.raised, on and 0.12 or 0.5); rounded(b.lineT, "line", 5, on and EM or COL.line, on and 0.6 or 1)
        b.t:SetTextColor(rgb(on and COL.text or COL.faint)); b.ck:SetShown(on)
      end
      b:SetScript("OnClick", function() it[3](not it[2]()); if not it[4] then custom() end; show(); applySettings() end)
      if it[5] then b:SetScript("OnEnter", function() GameTooltip:SetOwner(b, "ANCHOR_TOP"); GameTooltip:SetText(it[1], 1, 1, 1); GameTooltip:AddLine(it[5], 0.75, 0.78, 0.82, true); GameTooltip:Show() end); b:SetScript("OnLeave", function() GameTooltip:Hide() end) end
      refreshers[#refreshers + 1] = show; show()
    end
    y = y + rowH + 2
  end
  -- (the card's style: five small rectangles, the chosen one in gold)
  local PDESC = { glance = "The raid lead's quick read: the coach box, folded lists.", simple = "The headline, the focus and your top mistake.", medium = "Up to three mistakes, folded lists.",
    heavy = "Up to five mistakes, Deaths and Avoidable damage open.", detailed = "Everything open, with number tiles." }
  local function styles()
    local x, bs = PX, {}
    for _, k in ipairs({ "simple", "glance", "medium", "heavy", "detailed" }) do
      local b = CreateFrame("Button", nil, P); b:SetHeight(24)
      b.fillT = b:CreateTexture(nil, "BACKGROUND"); b.fillT:SetAllPoints(); b.lineT = b:CreateTexture(nil, "BORDER"); b.lineT:SetAllPoints()
      b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 12.5); b.t:SetPoint("CENTER", 0, 0); b.t:SetText(PRESET_NAME[k])
      b:SetWidth(b.t:GetStringWidth() + 20); b:SetPoint("TOPLEFT", x, -y); x = x + b:GetWidth() + 6
      b:SetScript("OnClick", function() Debrief_SetPreset(k); applySettings() end)
      b:SetScript("OnEnter", function() GameTooltip:SetOwner(b, "ANCHOR_TOP"); GameTooltip:SetText(PRESET_NAME[k], 1, 1, 1); GameTooltip:AddLine(PDESC[k], 0.75, 0.78, 0.82, true); GameTooltip:Show() end)
      b:SetScript("OnLeave", function() GameTooltip:Hide() end)
      bs[k] = b
    end
    refreshers[#refreshers + 1] = function()
      for k, b in pairs(bs) do local on = DB.preset == k
        rounded(b.fillT, "fill", 5, COL.gold, on and 0.12 or 0); rounded(b.lineT, "line", 5, on and COL.gold or COL.line, 1); b.t:SetTextColor(rgb(on and COL.gold or COL.muted)) end
    end
    y = y + 30
  end
  local function note(text)
    local n = P:CreateFontString(nil, "OVERLAY"); setFont(n, "body", 11.5); n:SetPoint("TOPLEFT", PX, -(y + 2)); n:SetWidth(OW - PX * 2); n:SetJustifyH("LEFT"); n:SetTextColor(rgb(COL.faint)); n:SetText(text)
    y = y + n:GetStringHeight() + 8
  end
  local function buttons(list)
    local prev
    for _, b in ipairs(list) do
      local bt = optButton(P, b[1], b[3] or 130, false, 24)
      if prev then bt:SetPoint("LEFT", prev, "RIGHT", 6, 0) else bt:SetPoint("TOPLEFT", PX, -(y + 6)) end
      bt:SetScript("OnClick", b[2]); prev = bt
    end
    y = y + 36
  end
  local function S() DB.show = DB.show or {}; return DB.show end

  -- ---------- Card: the style, and every piece the card can show ----------
  page("card")
  section("Style", true)
  styles()
  note("How much opens by itself. Click a piece below to show or hide it; the card beside this window changes as you click.")
  section("On the card")
  chips({
    { "Stop at death", function() return S().stopat ~= false end, function(v) S().stopat = v end, false, "The wipe filter, on top: on a wipe, nothing after that death counts." },
    { "Coach box", function() return S().coach ~= false end, function(v) S().coach = v end, false, "Debriefing's coach: the headline, the focus and what went wrong." },
    { "What went right", function() return S().right ~= false end, function(v) S().right = v end },
    { "Deaths", function() return S().cdeaths ~= false end, function(v) S().cdeaths = v end },
    { "Avoidable damage", function() return S().cavoid ~= false end, function(v) S().cavoid = v end },
    { "Boss mechanics", function() return S().mechs == true end, function(v) S().mechs = v end, false, "How each mechanic went, worst first." },
    { "Healthstones and potions", function() return S().rcons ~= false end, function(v) S().rcons = v end, false, "Who used a Healthstone or health potion, and who dropped low with one still ready." },
    { "Your last pulls", function() return S().chips ~= false end, function(v) S().chips = v end, false, "Your last pulls along the top. Click one to look at it again." },
  })
  section("Your view")
  chips({
    { "Your damage or healing", function() return S().tile ~= false end, function(v) S().tile = v end },
    { "Rotation tips", function() return S().rotation ~= false end, function(v) S().rotation = v end },
    { "Boss mistakes", function() return S().boss ~= false end, function(v) S().boss = v end },
    { "Survival", function() return S().surv ~= false end, function(v) S().surv = v end, false, "Your defensives, and how many you used." },
    { "Healthstone and potion", function() return S().cons ~= false end, function(v) S().cons = v end, false, "When you used your Healthstone and health potion, or that you didn't." },
    { "Next pull tip", function() return S().next ~= false end, function(v) S().next = v end },
  })
  section("Charts", false, true)
  chips({
    { "Your numbers tonight", function() return S().chartLine == true end, function(v) S().chartLine = v end, true, "Your damage or healing, pull by pull, on this boss tonight." },
    { "How far each pull got", function() return S().chartNight == true end, function(v) S().chartNight = v end, true, "Every pull on this boss tonight, the best one marked." },
  })
  section("From the website", false, true)
  chips({
    { "Report card grade", function() return S().grade == true end, function(v) S().grade = v end, true, "The pull's grade from the Report card, with mechanics, avoidable damage and survival." },
  })
  section("How many")
  stepper("Mistakes", "The raid's biggest mistakes, with names.", 1, 5, function() return DB.maxRaid or 3 end, function(v) DB.maxRaid = v end)
  stepper("Rotation tips", "Your biggest slips, worst first.", 1, 5, function() return DB.maxSlips or 3 end, function(v) DB.maxSlips = v end)
  stepper("Boss mistakes", "Your mistakes, avoidable damage, kicks and dispels.", 1, 7, function() return DB.maxBoss or 2 end, function(v) DB.maxBoss = v end)
  stepper("Deaths listed", "Who died first, and to what. 0 hides the list.", 0, 8, function() return DB.maxDied or 3 end, function(v) DB.maxDied = v end)
  stepper("Boss mechanics", "How many mechanic lines.", 0, 16, function() return DB.maxMech or 6 end, function(v) DB.maxMech = v end)
  stepper("Stop at death", "On a wipe, nothing after this death counts. 0 counts the whole pull.", 0, 8, function() return DB.deathCut or 0 end, function(v) DB.deathCut = v end, function(v) return v == 0 and "off" or tostring(v) end, true)
  switch("Boss mistakes first", "Above your rotation tips.", function() return DB.bossFirst == true end, function(v) DB.bossFirst = v end)

  -- ---------- Look: colour, size and font ----------
  page("look")
  local function classCol() local _, c = UnitClass("player"); return classHex(c) end
  section("Colour", true)
  switch("Match my class colour", "Debrief takes the colour of the class you're playing.", function() return DB.classTheme ~= false end, function(v) DB.classTheme = v end, true)
  swatches("Accent", "When class colours are off.", {
    { "gold", "Debrief gold", ACCENTS.gold }, { "class", "Your class colour", classCol }, { "frost", "Frost", ACCENTS.frost },
    { "fel", "Fel", ACCENTS.fel }, { "crimson", "Crimson", ACCENTS.crimson }, { "violet", "Void", ACCENTS.violet },
  }, function() return DB.accent or "gold" end, function(v) DB.accent = v; DB.classTheme = false end)
  segment("Card style", "Soft panels, see-through glass, or flat.", { { "panels", "Panels" }, { "glass", "Glass" }, { "flat", "Flat" } },
    function() return DB.cardStyle or "panels" end, function(v) DB.cardStyle = v end, true)
  switch("Colour-blind colours", "Blue for good, orange for bad.", function() return DB.colorblind == true end, function(v) DB.colorblind = v end, true)
  section("Size")
  pslider("Card size", nil, 0.7, 1.5, function() return DB.scale or 1 end, function(v) DB.scale = v end)
  pslider("Text size", nil, 0.85, 1.2, function() return DB.fontScale or 1 end, function(v) DB.fontScale = v end)
  choice("Width", nil, WIDTH_CHOICES, function() return DB.width or "normal" end, function(v) DB.width = v end)
  -- (the font: ‹ name › through Debrief's own, the game's, and every font your other addons share)
  do
    local base = { { "debrief", "Debrief" }, { "wow", "WoW" }, { "arial", "Arial Narrow" }, { "morpheus", "Morpheus headings" } }
    local function list() local l = {}; for _, x in ipairs(base) do l[#l + 1] = x end; local _, names = lsmFonts(); local seen = {}
      for _, n in ipairs(names) do if not seen[n] and n ~= "Friz Quadrata TT" and n ~= "Arial Narrow" and n ~= "Morpheus" then seen[n] = true; l[#l + 1] = { "lsm:" .. n, n } end end; return l end
    local cy = rowBase("Font", "Yours from other addons too.")
    local nx = txtBtn("›"); nx:SetPoint("RIGHT", P, "TOPRIGHT", -PX + 4, -cy)
    local val = P:CreateFontString(nil, "OVERLAY"); setFont(val, "bold", 12.5); val:SetWidth(120); val:SetJustifyH("CENTER"); val:SetPoint("RIGHT", nx, "LEFT", 0, 0); val:SetTextColor(rgb(COL.text)); val:SetWordWrap(false)
    local pv = txtBtn("‹"); pv:SetPoint("RIGHT", val, "LEFT", 0, 0)
    local function idx(l) for i, x in ipairs(l) do if x[1] == (DB.font or "debrief") then return i end end; return 1 end
    local function show() local l = list(); val:SetText(l[idx(l)][2]) end
    local function step(d) local l = list(); local i = ((idx(l) - 1 + d) % #l) + 1; DB.font = l[i][1]; applySettings(); show() end
    nx:SetScript("OnClick", function() step(1) end); pv:SetScript("OnClick", function() step(-1) end)
    refreshers[#refreshers + 1] = show; show()
  end
  pslider("Background", "How solid the card is.", 0.6, 1, function() return DB.alpha or 0.97 end, function(v) DB.alpha = v end)

  -- ---------- More: set once and forget ----------
  page("more")
  section("After a pull", true)
  segment("Show it as", "The card, one slim bar, or the big window.", { { "card", "Card" }, { "mini", "Mini bar" }, { "big", "Big" } },
    function() return DB.mini and "mini" or (DB.bigDefault and "big" or "card") end, function(v) DB.mini = (v == "mini"); DB.bigDefault = (v == "big") end, true)
  switch("Open it by itself", "As soon as it arrives.", function() return DB.autoShow ~= false end, function(v) DB.autoShow = v end, true)
  switch("Sound", "A soft sound when it opens.", function() return DB.sound ~= false end, function(v) DB.sound = v end, true)
  switch("Only what went wrong", "Hide the lines you did right.", function() return DB.onlyBad == true end, function(v) DB.onlyBad = v end, true)
  switch("Hide during combat", "Back when the fight ends.", function() return DB.hideCombat ~= false end, function(v) DB.hideCombat = v end, true)
  segment("Close by itself", "Not while your mouse is on it.", { { 0, "Never" }, { 30, "30 s" }, { 60, "60 s" }, { 120, "2 min" } },
    function() return DB.autoClose or 0 end, function(v) DB.autoClose = v end, true)
  switch("Lock in place", "The card and bars can't be dragged.", function() return DB.lock == true end, function(v) DB.lock = v end, true)
  section("Raid")
  switch("Raid view for everyone", "Off: only raid leads and assistants see it.", function() return DB.raidAlways ~= false end, function(v) DB.raidAlways = v end, true)
  switch("Why we wiped", "The raid lead's word at the top of the card, and a line for you.", function() return S().lead ~= false end, function(v) S().lead = v end)
  switch("Glow my NSRT cooldowns", "Your NSRT spells glow on the Cooldown Manager when it's time.", function() return DB.glowCds == true end, function(v) DB.glowCds = v end, true)
  section("Goals")
  local function lastOf(role)
    for i = #DB.pulls, 1, -1 do local p = youIn(DB.pulls[i]); if p and ((p.role == "healer") == (role == "healer")) then return parseK(p.v) end end
  end
  local function goalStep(key, role)
    return function() return DB[key] or 0 end, function(v)
      if (DB[key] or 0) == 0 and v > 0 then local l = lastOf(role); if l and l > 0 then v = math.floor(l * 1.1 / 10 + 0.5) * 10 end end
      DB[key] = v
    end
  end
  local fmtK = function(v) return v == 0 and "off" or (v .. "k") end
  local g1, s1 = goalStep("goalDps", "dps")
  stepper("Damage goal", "Your DPS target, in thousands. The first + starts a little above your latest pull.", 0, 3000, g1, s1, fmtK, true, 10)
  local g2, s2 = goalStep("goalHps", "healer")
  stepper("Healing goal", "Your HPS target, in thousands.", 0, 3000, g2, s2, fmtK, true, 10)
  section("Big window and mini bar")
  switch("Your numbers tonight", "A line of your damage or healing, pull by pull.", function() return DB.bigLine ~= false end, function(v) DB.bigLine = v end, true)
  switch("Progress tonight", "How far each pull got, the closest one marked.", function() return DB.bigChart ~= false end, function(v) DB.bigChart = v end, true)
  pslider("Big window size", nil, 0.7, 1.3, function() return DB.bigScale or 1 end, function(v) DB.bigScale = v end)
  pslider("Mini bar size", nil, 0.7, 1.5, function() return DB.miniScale or 1 end, function(v) DB.miniScale = v end)
  section("Pasting a recap")
  switch("Ask \"See your recap?\"", "After each boss pull, when the PC app copies it for you.", function() return DB.autoBox ~= false end, function(v) DB.autoBox = v end, true)
  switch("Ready for Ctrl+V", "Any other key lets go so you can move.", function() return DB.autoFocus ~= false end, function(v) DB.autoFocus = v end, true)
  switch("Send my recaps to the raid", "Raiders with Debrief get theirs by itself.", function() return DB.share ~= false end, function(v) DB.share = v end, true)
  switch("Combat log always on", "With Advanced Combat Logging, whenever Debrief is loaded.", function() return DB.autoLog ~= false end, function(v) DB.autoLog = v end, true)
  section("Help")
  buttons({ { "Tutorial", function() opt:Hide(); Debrief_Tutorial() end, 74 }, { "Sample recap", function() SlashCmdList.DEBRIEF("demo") end, 96 }, { "Test the glow", function() Debrief_TestGlow() end, 96 }, { "Move card back", function() SlashCmdList.DEBRIEF("reset") end, 108 } })
  local HELP = { { "/db", "these settings (/dmo too)" }, { "/dbr", "show or hide your recap (/debrief too)" }, { "/debrief big", "the big window" }, { "/debrief mini", "the mini bar on or off" },
    { "/dp", "paste a recap" }, { "/debrief log", "combat logging on or off" }, { "/debrief demo", "a sample recap" } }
  for _, h in ipairs(HELP) do
    local c = P:CreateFontString(nil, "OVERLAY"); setFont(c, "bold", 12.5); c:SetPoint("TOPLEFT", PX, -(y + 4)); c:SetTextColor(rgb(COL.gold)); c:SetText(h[1])
    local d = P:CreateFontString(nil, "OVERLAY"); setFont(d, "body", 12.5); d:SetPoint("TOPLEFT", PX + 110, -(y + 4)); d:SetTextColor(rgb(COL.soft)); d:SetText(h[2])
    y = y + 20
  end
  page(nil)

  showPage("card")
  Debrief_RefreshOptions()
end
function Debrief_ToggleOptions()
  if not DB then return end
  if not opt then buildOptions() end
  if opt:IsShown() then opt:Hide(); return end
  Debrief_RefreshOptions(); opt:Show()
  -- (the card beside it, so every change shows at once: the last pull, or the demo when there's none yet)
  if #DB.pulls == 0 then SlashCmdList.DEBRIEF("demo") end
  -- (the preview: your recap card, attached to the right of this window, changing as you click; back in its own place when you close)
  mini:Hide(); big:Hide(); card:Show(); render()
  card:ClearAllPoints(); card:SetPoint("TOPLEFT", opt, "TOPRIGHT", 16, -26)
  if not opt.prev then
    opt.prev = opt:CreateFontString(nil, "OVERLAY"); setFont(opt.prev, "bold", 12.5); opt.prev:SetTextColor(rgb(COL.gold))
    opt.prev:SetText("PREVIEW  ·  changes as you click")
    opt:HookScript("OnHide", function()
      card:SetScale(DB.scale or 1); card:ClearAllPoints()
      if DB.pos then card:SetPoint(DB.pos[1], UIParent, DB.pos[2], DB.pos[3], DB.pos[4]) else card:SetPoint("CENTER", 260, 60) end
    end)
  end
  opt.prev:ClearAllPoints(); opt.prev:SetPoint("BOTTOMLEFT", card, "TOPLEFT", 2, 7)
  Debrief_FitPreview()
end
function Debrief_OnAddonCompartmentClick() Debrief_ToggleOptions() end
-- (in WoW's own Options > AddOns list too)
local function registerSettings()
  if not (Settings and Settings.RegisterCanvasLayoutCategory and Settings.RegisterAddOnCategory) then return end
  local p = CreateFrame("Frame"); p:Hide()
  local t = p:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge"); t:SetPoint("TOPLEFT", 16, -16); t:SetText("Debrief")
  local d = p:CreateFontString(nil, "OVERLAY", "GameFontHighlight"); d:SetPoint("TOPLEFT", 16, -44); d:SetWidth(560); d:SetJustifyH("LEFT")
  d:SetText("Your pull recap in game. Choose how much the card shows (Simple, Medium, Heavy, Detailed or your own mix), the font and sizes, and what happens after a pull.")
  local b = CreateFrame("Button", nil, p, "UIPanelButtonTemplate"); b:SetSize(200, 26); b:SetPoint("TOPLEFT", 16, -80); b:SetText("Open Debrief settings")
  b:SetScript("OnClick", function() if SettingsPanel and SettingsPanel:IsShown() then HideUIPanel(SettingsPanel) end; if not (opt and opt:IsShown()) then Debrief_ToggleOptions() end end)
  local cat = Settings.RegisterCanvasLayoutCategory(p, "Debrief"); Settings.RegisterAddOnCategory(cat)
end

-- ---------- the tutorial: four short steps the first time you log in (/debrief tutorial or Help shows it again) ----------
do
  local TW = 500
  local tut = CreateFrame("Frame", "DebriefTutorial", UIParent); tut:SetSize(TW, 300); tut:SetPoint("CENTER", 0, 60); tut:SetFrameStrata("DIALOG"); tut:SetClampedToScreen(true); tut:Hide()
  skin(tut, 8, COL.bg, 0.98, COL.line2, 1, true)
  tut:SetMovable(true); tut:EnableMouse(true); tut:RegisterForDrag("LeftButton")
  tut:SetScript("OnDragStart", tut.StartMoving); tut:SetScript("OnDragStop", tut.StopMovingOrSizing)
  tinsert(UISpecialFrames, "DebriefTutorial")
  local lg = tut:CreateTexture(nil, "ARTWORK"); lg:SetSize(22, 22); lg:SetPoint("TOPLEFT", 18, -15); lg:SetTexture(MEDIA .. "Media\\logo")
  local tt = tut:CreateFontString(nil, "OVERLAY"); setFont(tt, "head", 19); tt:SetPoint("LEFT", lg, "RIGHT", 8, 0); tt:SetTextColor(rgb(COL.text)); tt:SetText("Debrief")
  local stepT = tut:CreateFontString(nil, "OVERLAY"); setFont(stepT, "body", 13); stepT:SetPoint("LEFT", tt, "RIGHT", 10, -1); stepT:SetTextColor(rgb(COL.muted))
  local cl = closeButton(tut); cl:SetPoint("TOPRIGHT", -10, -12)
  local hl = tut:CreateTexture(nil, "ARTWORK"); hl:SetPoint("TOPLEFT", 1, -50); hl:SetPoint("TOPRIGHT", -1, -50); hl:SetHeight(1); fill(hl, COL.line)
  -- the step's number in a soft gold circle, its title and its words
  local circ = tut:CreateTexture(nil, "ARTWORK"); circ:SetTexture(SLICE .. "dot"); circ:SetSize(44, 44); circ:SetPoint("TOPLEFT", 22, -72)
  local num = tut:CreateFontString(nil, "OVERLAY"); setFont(num, "head", 22); num:SetPoint("CENTER", circ, "CENTER", 0, 0)
  local title = tut:CreateFontString(nil, "OVERLAY"); setFont(title, "head", 22); title:SetPoint("TOPLEFT", 82, -70); title:SetWidth(TW - 104); title:SetJustifyH("LEFT"); title:SetTextColor(rgb(COL.text))
  local body = tut:CreateFontString(nil, "OVERLAY"); setFont(body, "body", 14); body:SetPoint("TOPLEFT", 82, -100); body:SetWidth(TW - 104); body:SetJustifyH("LEFT"); body:SetJustifyV("TOP"); body:SetTextColor(rgb(COL.soft))
  if body.SetSpacing then body:SetSpacing(3) end
  -- step 2's picture: the prompt you'll see after a boss pull
  local demoT = CreateFrame("Frame", nil, tut); demoT:SetSize(300, 50); skin(demoT, 8, COL.bg, 1, COL.gold, 0.55)
  local dl = demoT:CreateTexture(nil, "ARTWORK"); dl:SetSize(20, 20); dl:SetPoint("LEFT", 12, 0); dl:SetTexture(MEDIA .. "Media\\logo")
  local dt = demoT:CreateFontString(nil, "OVERLAY"); setFont(dt, "head", 16); dt:SetPoint("TOPLEFT", 38, -8); dt:SetTextColor(rgb(COL.text)); dt:SetText("See your recap?")
  local ds = demoT:CreateFontString(nil, "OVERLAY"); setFont(ds, "body", 12); ds:SetPoint("TOPLEFT", 38, -28); ds:SetTextColor(rgb(COL.muted)); ds:SetText("Press Ctrl+V after the chime.")
  local dk = CreateFrame("Frame", nil, demoT); dk:SetSize(60, 24); dk:SetPoint("RIGHT", -12, 0); skin(dk, 5, COL.gold, 1, COL.gold, 1)
  dk.t = dk:CreateFontString(nil, "OVERLAY"); setFont(dk.t, "bold", 12.5); dk.t:SetPoint("CENTER", 0, 0); dk.t:SetTextColor(rgb("1b1406")); dk.t:SetText("Ctrl+V")
  -- an extra button inside a step (Show me a sample, Open settings)
  local extra = optButton(tut, "", 170, false)
  -- the bottom: dots, Back, Next
  local dots = {}
  for i = 1, 4 do local d = tut:CreateTexture(nil, "ARTWORK"); d:SetTexture(SLICE .. "dot"); d:SetSize(8, 8); d:SetPoint("BOTTOMLEFT", 22 + (i - 1) * 14, 24); dots[i] = d end
  local nextB = optButton(tut, "Next", 96, true); nextB:SetPoint("BOTTOMRIGHT", -18, 16)
  local backB = optButton(tut, "Back", 80, false); backB:SetPoint("RIGHT", nextB, "LEFT", -8, 0)
  local STEPS = {
    { "Welcome to Debrief", "Your pull recap, right here in WoW, a few seconds after every boss pull: your numbers, your biggest slips, your boss mistakes and one thing to try next pull." },
    { "After a boss pull", "If you run Debrief Companion on your PC, this pops up after each boss pull: press Ctrl+V and your recap opens.\nEveryone else does nothing. Your recap opens by itself.", "prompt" },
    { "Your recap", "Me is your own pull. Raid view shows the raid's biggest mistakes and who died. Use the arrows to look at anyone, and Expand for the big window with the whole night.", "sample" },
    { "Make it yours", "Type /db any time for the settings: Simple, Medium or Heavy, colours and sizes, the mini bar or the big window, and goals.", "settings" },
  }
  local cur = 1
  local function done() DB.tutorialDone = true; tut:Hide() end
  local function show(i)
    cur = i
    local s = STEPS[i]
    stepT:SetText("Step " .. i .. " of " .. #STEPS)
    circ:SetVertexColor(rgb(COL.gold)); circ:SetAlpha(0.16); num:SetTextColor(rgb(COL.gold)); num:SetText(i)
    title:SetText(s[1]); body:SetText(s[2])
    local by = 100 + body:GetStringHeight() + 16
    demoT:SetShown(s[3] == "prompt"); extra:SetShown(s[3] == "sample" or s[3] == "settings")
    if s[3] == "prompt" then demoT:ClearAllPoints(); demoT:SetPoint("TOPLEFT", 82, -by); by = by + 50 + 16 end
    if extra:IsShown() then
      extra.t:SetText(s[3] == "sample" and "Show me a sample" or "Open the settings")
      extra:ClearAllPoints(); extra:SetPoint("TOPLEFT", 82, -by); by = by + 28 + 16
      extra:SetScript("OnClick", function() if s[3] == "sample" then SlashCmdList.DEBRIEF("demo") else done(); Debrief_ToggleOptions() end end)
    end
    for k, d in ipairs(dots) do d:SetVertexColor(rgb(k == i and COL.gold or COL.line2)) end
    backB:SetShown(i > 1); nextB.t:SetText(i == #STEPS and "Done" or "Next")
    tut:SetHeight(math.max(260, by + 56))
  end
  nextB:SetScript("OnClick", function() if cur >= #STEPS then done() else show(cur + 1) end end)
  backB:SetScript("OnClick", function() if cur > 1 then show(cur - 1) end end)
  cl:SetScript("OnClick", done)
  tut:SetScript("OnHide", function() if DB then DB.tutorialDone = true end end)
  function Debrief_Tutorial() if not DB then return end; show(1); tut:Show() end
end

-- ---------- opening it: key, slash command ----------
grabbed = false
function Debrief_OpenPaste(noFocus)
  -- (after a pull: the small prompt, no paste box; /debrief paste and the key still open the full box)
  if noFocus and DB and DB.prompt ~= false then
    paste:Hide(); boxIn(toast); eb:SetText("")
    tTitle:SetText(DB.testMode and "Test mode: see a recap?" or "See your recap?")
    if DB.toastPos then toast:ClearAllPoints(); toast:SetPoint(DB.toastPos[1], UIParent, DB.toastPos[2], DB.toastPos[3], DB.toastPos[4]) end
    toast:Show()
    if DB.autoFocus == false then toastReady(false); toastSay("Click here, then Ctrl+V.")
    else eb:SetFocus(); grabbed = true; toastReady(true); toastSay("Press Ctrl+V after the chime.") end
    return
  end
  if toast:IsShown() then closeToast() end
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
  if big:IsShown() then big:Hide(); return end
  if DB and DB.mini and #DB.pulls > 0 and not card:IsShown() then if mini:IsShown() then mini:Hide() else miniShow() end; return end
  if card:IsShown() then card:Hide() elseif DB and DB.pulls and #DB.pulls > 0 then card:Show(); render() else Debrief_OpenPaste() end
end
BINDING_HEADER_DEBRIEF = "Debrief"
BINDING_NAME_DEBRIEF_PASTE = "Paste a pull recap"
BINDING_NAME_DEBRIEF_TOGGLE = "Show or hide the recap card"

-- (/dmo, "Debrief me open": the settings, in three letters)
-- (/dp: the paste box, for a recap you shared from the app's pop-up)
SLASH_DEBRIEFPASTE1 = "/dp"; SLASH_DEBRIEFPASTE2 = "/dpaste"
SlashCmdList.DEBRIEFPASTE = function() Debrief_OpenPaste() end
SLASH_DEBRIEFMO1 = "/db"; SLASH_DEBRIEFMO2 = "/dmo" -- (/db first (the user, Oct 22); /dmo still works)
SlashCmdList.DEBRIEFMO = function() Debrief_ToggleOptions() end
SLASH_DEBRIEF1 = "/dbr"; SLASH_DEBRIEF2 = "/debrief" -- (/dbr first (the user, Oct 22); /debrief still works)
SlashCmdList.DEBRIEF = function(msg)
  msg = (msg or ""):lower():gsub("^%s+", ""):gsub("%s+$", "")
  if msg == "options" or msg == "config" or msg == "settings" or msg == "o" then Debrief_ToggleOptions()
  elseif msg == "paste" or msg == "p" then Debrief_OpenPaste()
  elseif msg == "tutorial" or msg == "tour" then Debrief_Tutorial()
  elseif msg == "big" or msg == "b" then Debrief_ToggleBig()
  elseif msg == "mini" then DB.mini = not DB.mini; if DB.mini then DB.bigDefault = false end; say("mini bar " .. (DB.mini and "on: one slim line after each pull, click it for the card." or "off: the card after each pull.")); if DB.mini and #DB.pulls > 0 then card:Hide(); miniShow() else mini:Hide() end
  elseif msg == "raid" then DB.raidAlways = not DB.raidAlways; say("Raid view " .. (DB.raidAlways and "always on." or "only when you lead or assist.")); if card:IsShown() then render() end
  elseif msg == "reset" then DB.pos = nil; card:ClearAllPoints(); card:SetPoint("CENTER", 260, 60); say("card moved back to the middle.")
  elseif msg == "clear" then DB.pulls = {}; DB.cur = nil; card:Hide(); big:Hide(); mini:Hide(); say("pulls cleared.")
  elseif msg == "demo" then
    -- (the built-in sample pull: the card with no paste, not sent to the group)
    local m = decode(SAMPLE)
    if m then addPull(m); paste:Hide(); showCard(); say("showing a sample Heroic Ula'tek kill (made-up names). Use the arrows to see other players.") end
  elseif msg == "log" then Debrief_ToggleLog()
  elseif msg == "glow" then Debrief_TestGlow()
  elseif msg == "focus" then DB.autoFocus = (DB.autoFocus == false); say("paste box ready for Ctrl+V after a pull " .. (DB.autoFocus ~= false and "on." or "off: click it first."))
  elseif msg == "test" then DB.testMode = not DB.testMode; say("test mode " .. (DB.testMode and "on: the box pops up after every fight and when you log in." or "off: the box only pops up after boss pulls."))
  elseif msg == "share" then DB.share = (DB.share == false); say("sharing your pastes with the group " .. (DB.share ~= false and "on." or "off."))
  elseif msg == "auto" then DB.autoBox = (DB.autoBox == false); say("paste box after each boss pull " .. (DB.autoBox ~= false and "on." or "off."))
  elseif msg == "help" then say("/db (or /dmo, or /debrief options): your settings. /debrief tutorial: the tutorial again. /debrief: show or hide the card. /debrief big: the big window. /debrief mini: the mini bar on or off. /debrief paste: paste a new pull. /debrief demo: a sample card. /debrief test: test mode on or off. /debrief log: combat logging on or off (or the button on the card, or a key in Keybindings > AddOns > Debrief). /debrief focus: paste box ready for Ctrl+V on or off. /debrief raid: Raid view on or off. /debrief share: send your pastes to the group on or off. /debrief auto: paste box after each pull on or off. /debrief reset: move the card back.")
  else Debrief_Toggle() end
end

-- ---- Glow my cooldowns (the user's ask, Oct 22: "read the NSRT note and glow my cooldown manager icons when i need to use
-- them in raid combat"). Opt-in: /dmo > Raid. When NSRT shows one of YOUR reminders that has a spell, that spell's icon on
-- Blizzard's Cooldown Manager glows at the moment NSRT counts down to, until you press it or 8 s pass. The timing is NSRT's own
-- (its NSRT_REMINDER_SHOW callback), so phases and times match its pop-ups exactly; NSRT only fires it for reminders tagged to you.
-- Debrief only draws its own glow frame on top of the icon: the Cooldown Manager isn't a protected frame, and no combat data is read.
local CDM_VIEWERS = { "EssentialCooldownViewer", "UtilityCooldownViewer" }
local glows, glowPool, nsrtHooked = {}, {}, false
local function secret(x) return issecretvalue and issecretvalue(x) end
local function spellName(id) local n = C_Spell and C_Spell.GetSpellName and C_Spell.GetSpellName(id); if n and not secret(n) then return n end end
-- (every Cooldown Manager icon on screen, with the spell IDs it stands for: base, current and override)
local function cdmItems()
  local out = {}
  for _, vn in ipairs(CDM_VIEWERS) do
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
local function cdmItemFor(spellID)
  local name = spellName(spellID)
  for _, e in ipairs(cdmItems()) do
    for _, x in ipairs(e.ids) do if x == spellID or (name and spellName(x) == name) then return e.frame end end
  end
end
-- (the glow: four gold edges and a soft halo, pulsing; one frame per spell, reused)
local function newGlow()
  local g = table.remove(glowPool)
  if g then return g end
  g = CreateFrame("Frame", nil, UIParent); g:SetFrameStrata("HIGH")
  local r, gg, b = rgb(COL.gold)
  g.halo = g:CreateTexture(nil, "BACKGROUND"); g.halo:SetTexture(SLICE .. "shadow"); g.halo:SetPoint("TOPLEFT", -12, 12); g.halo:SetPoint("BOTTOMRIGHT", 12, -12); g.halo:SetVertexColor(r, gg, b, 0.9)
  local function edge(p1, p2, w, h) local t = g:CreateTexture(nil, "OVERLAY"); t:SetColorTexture(r, gg, b, 1); t:SetPoint(p1); t:SetPoint(p2); if w then t:SetWidth(w) else t:SetHeight(h) end end
  edge("TOPLEFT", "TOPRIGHT", nil, 3); edge("BOTTOMLEFT", "BOTTOMRIGHT", nil, 3); edge("TOPLEFT", "BOTTOMLEFT", 3); edge("TOPRIGHT", "BOTTOMRIGHT", 3)
  g.ag = g:CreateAnimationGroup(); g.ag:SetLooping("BOUNCE")
  local a = g.ag:CreateAnimation("Alpha"); a:SetFromAlpha(1); a:SetToAlpha(0.35); a:SetDuration(0.45)
  return g
end
local function glowStop(id)
  local g = glows[id]; if not g then return end
  glows[id] = nil
  if g.timer then g.timer:Cancel(); g.timer = nil end
  g.ag:Stop(); g:Hide(); g:ClearAllPoints()
  glowPool[#glowPool + 1] = g
end
local function glowStopAll() for id in pairs(glows) do glowStop(id) end end
local function glowStart(id, hold)
  local it = cdmItemFor(id)
  if not it then return false end
  glowStop(id)
  local g = newGlow()
  g:SetPoint("TOPLEFT", it, "TOPLEFT", -2, 2); g:SetPoint("BOTTOMRIGHT", it, "BOTTOMRIGHT", 2, -2)
  g:SetFrameLevel((it.GetFrameLevel and it:GetFrameLevel() or 1) + 10); g:Show(); g.ag:Play()
  glows[id] = g
  g.timer = C_Timer.NewTimer(hold or 8, function() g.timer = nil; glowStop(id) end)
  return true
end
-- (NSRT says a reminder of yours is showing: glow its spell when its countdown ends, the moment to press it)
local function onReminder(_, info)
  if not (DB and DB.glowCds) or type(info) ~= "table" then return end
  if C_AddOns and C_AddOns.IsAddOnLoaded and C_AddOns.IsAddOnLoaded("DebriefGlow") then return end -- (Debrief Glow does it, with its own look: never two glows)
  local id = info.spellID or info.spellid
  if not id or secret(id) then return end
  id = tonumber(id); if not id then return end
  local wait = info.expires and not secret(info.expires) and (info.expires - GetTime()) or (tonumber(info.dur) or 8)
  if wait > 0.05 then C_Timer.After(wait, function() if DB.glowCds then glowStart(id) end end) else glowStart(id) end
end
local function hookNSRT()
  if nsrtHooked or not (NSAPI and NSAPI.RegisterCallback) then return end
  nsrtHooked = true
  pcall(NSAPI.RegisterCallback, "DebriefGlow", "NSRT_REMINDER_SHOW", onReminder)
  pcall(NSAPI.RegisterCallback, "DebriefGlow", "NSRT_ALERT_WOULD_SHOW", onReminder) -- (NSRT's reminders shown on Blizzard's timeline instead)
  pcall(NSAPI.RegisterCallback, "DebriefGlow", "NSRT_HIDE_REMINDERS", glowStopAll)
end
-- (pressing the spell clears its glow)
local function onCast(id)
  if not id or secret(id) or not next(glows) then return end
  if glows[id] then glowStop(id) return end
  local n = spellName(id)
  if n then for g in pairs(glows) do if spellName(g) == n then glowStop(g) end end end
end
-- (/debrief glow, or Test the glow in /dmo: every Cooldown Manager icon glows for 3 s, so you can see it without a raid)
function Debrief_TestGlow()
  if not NSAPI then say("NSRT isn't loaded. The glow follows NSRT's reminders, so it needs NSRT on.") end
  local items, n = cdmItems(), 0
  for _, e in ipairs(items) do if glowStart(e.ids[1], 3) then n = n + 1 end end
  if n == 0 then say("no Cooldown Manager icons found. Turn on Blizzard's Cooldown Manager (Options > Gameplay Enhancements) and add your cooldowns to it.")
  else say(n .. " Cooldown Manager icons glowing for 3 s. In a raid only your own NSRT spells glow, when it's time to press them" .. (DB.glowCds and "." or ". Turn it on in /db > More.")) end
end
local gev = CreateFrame("Frame", "DebriefGlowEvents")
gev:RegisterEvent("PLAYER_LOGIN"); gev:RegisterEvent("ADDON_LOADED"); gev:RegisterEvent("ENCOUNTER_END")
gev:RegisterUnitEvent("UNIT_SPELLCAST_SUCCEEDED", "player")
gev:SetScript("OnEvent", function(_, e, a1, a2, a3)
  if e == "UNIT_SPELLCAST_SUCCEEDED" then onCast(a3)
  elseif e == "ENCOUNTER_END" then glowStopAll()
  else hookNSRT() end
end)

local ev = CreateFrame("Frame")
ev:RegisterEvent("ADDON_LOADED"); ev:RegisterEvent("PLAYER_LOGIN"); ev:RegisterEvent("CHAT_MSG_ADDON"); ev:RegisterEvent("PLAYER_REGEN_ENABLED"); ev:RegisterEvent("PLAYER_REGEN_DISABLED"); ev:RegisterEvent("ENCOUNTER_END"); ev:RegisterEvent("PLAYER_ENTERING_WORLD"); ev:RegisterEvent("ZONE_CHANGED_NEW_AREA"); ev:RegisterEvent("PLAYER_TARGET_CHANGED")
-- (the combat log and Advanced Combat Logging stay on whenever Debrief is loaded, everywhere, so nobody has to type /combatlog.
-- Debrief Companion reads the log. /debrief log or Settings > PC app turns this off.)
local weLog, logPending, logSaid = false, false, false
-- (one press: the button on the card, the key from Options > Keybindings > AddOns > Debrief, or /debrief log. On also turns
-- Advanced Combat Logging on, and Debrief keeps it on; off stays off until it's pressed again)
function Debrief_ToggleLog()
  if not LoggingCombat or not DB then return end
  local on = not LoggingCombat()
  LoggingCombat(on); DB.autoLog = on
  if on and GetCVar and SetCVar and GetCVar("advancedCombatLogging") ~= "1" then pcall(SetCVar, "advancedCombatLogging", 1) end
  say(on and "combat logging is |cff7ee08fon|r, with Advanced Combat Logging. Debrief keeps it on." or "combat logging is |cffff8f87off|r. Press the button on the card, your key or /debrief log to turn it back on.")
  if Debrief_LogButton then Debrief_LogButton() end
end
BINDING_NAME_DEBRIEF_TOGGLELOG = "Combat logging on or off"
autoLog = function()
  if not DB or DB.autoLog == false or not LoggingCombat then return end
  if InCombatLockdown() then logPending = true; return end
  if GetCVar and SetCVar and GetCVar("advancedCombatLogging") ~= "1" then SetCVar("advancedCombatLogging", 1) end
  if not LoggingCombat() then
    LoggingCombat(true); weLog = true
    if not logSaid then logSaid = true; say("combat log and Advanced Combat Logging are on. Debrief keeps them on (/debrief log turns this off).") end
  end
end
-- (test mode: the box also comes up after any fight and when you log in, so the whole thing can be tried on a training dummy)
-- (a training dummy: any target named "... Dummy" that isn't a player)
local onDummy = false
local function isDummy(u) local n = UnitExists and UnitExists(u) and not UnitIsPlayer(u) and UnitName(u); return n and n:find("Dummy") ~= nil end
local function testBox(delay)
  if not (DB and DB.testMode and C_Timer) then return end
  C_Timer.After(delay, function() if not InCombatLockdown() and not paste:IsShown() and not toast:IsShown() then Debrief_OpenPaste(true) end end)
end
ev:SetScript("OnEvent", function(self, e, arg, a2, a3, a4)
  if e == "CHAT_MSG_ADDON" then
    if DB then onAddonMessage(arg, a2, a3, a4) end
  elseif e == "PLAYER_REGEN_DISABLED" then
    Debrief_CombatStart()
    onDummy = isDummy("target")
    if toast:IsShown() then toast:Hide() end -- (a new pull: the prompt for the last one goes away)
  elseif e == "PLAYER_REGEN_ENABLED" then
    Debrief_CombatEnd()
    if pendingShow then pendingShow = false; showCard() end
    testBox(1.5)
    -- (a training dummy fight: whoever runs Debrief Companion gets the prompt too, a few seconds after the last hit)
    if onDummy and DB and (DB.pasted or DB.hasApp) and DB.autoBox ~= false and not DB.testMode and not (DEBRIEF_POPUP ~= nil and not DEBRIEF_AUTOCOPY) and C_Timer then
      onDummy = false
      C_Timer.After(3, function() if not InCombatLockdown() and not paste:IsShown() and not toast:IsShown() then Debrief_OpenPaste(true) end end)
    end
    if logPending then logPending = false; autoLog() end
  elseif e == "PLAYER_ENTERING_WORLD" then
    if arg or a2 then testBox(4) end -- (on login or /reload, not every loading screen)
    if C_Timer then C_Timer.After(2, autoLog) end
  elseif e == "PLAYER_TARGET_CHANGED" then
    if InCombatLockdown() and isDummy("target") then onDummy = true end
    -- (practising on a dummy: the combat log goes on, so Debrief Companion can read it)
    if isDummy("target") and DB and DB.autoLog ~= false and (DB.hasApp or DB.pasted) and LoggingCombat and not LoggingCombat() then
      if GetCVar and SetCVar and GetCVar("advancedCombatLogging") ~= "1" then SetCVar("advancedCombatLogging", 1) end
      LoggingCombat(true); say("combat log is on for your practice. Hit the dummy, stop, and Debrief asks \"See your recap?\".")
    end
  elseif e == "ZONE_CHANGED_NEW_AREA" then
    if C_Timer then C_Timer.After(2, autoLog) end
  elseif e == "ENCOUNTER_END" then
    -- (with the app's recap pop-up on, the PC shows the recap: no prompt here unless the app copies every pull (Oct 22))
    if DEBRIEF_POPUP ~= nil and not DEBRIEF_AUTOCOPY and not DB.testMode then return end -- (nothing was copied: the app copies only when Copy every pull is on)
    -- (for whoever runs Debrief Companion: the paste box comes up by itself a few seconds after a boss pull, ready for Ctrl+V.
    -- Raid bosses only: the app makes no recap for a delve or dungeon boss, so asking there leaves nothing to paste (tester report #6))
    local itype = GetInstanceInfo and select(2, GetInstanceInfo()); local raidBoss = itype == "raid" or a3 == 14 or a3 == 15 or a3 == 16 or a3 == 17
    if DB and (DB.pasted or DB.hasApp or DB.testMode) and (raidBoss or DB.testMode) and DB.autoBox ~= false and C_Timer then
      C_Timer.After(4, function() if not InCombatLockdown() and not paste:IsShown() and not toast:IsShown() then Debrief_OpenPaste(true) end end)
    end
  elseif e == "ADDON_LOADED" and arg == ADDON then
    DebriefDB = DebriefDB or {}
    DB = DebriefDB
    DB.pulls = {}; DB.cur = nil -- (no pulls kept between sessions (the user, Oct 22): your recaps live in the PC app's pop-up)
    if DEBRIEF_HAS_APP then DB.hasApp = true end -- (Debrief Companion is on this PC: ask after every boss pull from the first one)
    if DB.raidAlways == nil then DB.raidAlways = true end
    DB.show = DB.show or {}
    if DB.detailed and DB.width == "large" and not DB.xlOnce then DB.width = "xl" end; DB.xlOnce = true
    if not DB.glanceDefault then DB.glanceDefault = true; DB.detailedDefault = true; if DB.preset == nil or DB.preset == "medium" or DB.preset == "detailed" then Debrief_SetPreset("glance") end end -- (Glance is the default since Oct 22)
    if not DB.detailedDefault then DB.detailedDefault = true; if DB.preset == nil or DB.preset == "medium" then Debrief_SetPreset("detailed") end end -- (the Detailed card is the default since Oct 21)
    registerSettings()
    reapplyFonts(); card:SetScale(DB.scale or 1); paste:SetScale(DB.scale or 1); big:SetScale(DB.bigScale or 1); mini:SetScale(DB.miniScale or 1)
    Debrief_ApplyStyle()
    if DB.testMode == nil then DB.testMode = false end
    if not DB.diedBack then DB.maxDied = 3; DB.diedBack = true end -- (once: the Who died list is shown again; the filter is Stop at)
    autoLog() -- (/debrief test turns it on: the box after every fight)
    if DB.pos then card:ClearAllPoints(); card:SetPoint(DB.pos[1], UIParent, DB.pos[2], DB.pos[3], DB.pos[4]) end
  elseif e == "PLAYER_LOGIN" then
    Debrief_ApplyStyle()
    -- (Advanced Combat Logging on from the start, so every log Debrief reads has positions and health; the combat log itself goes on in raids and at dummies)
    if DB.autoLog ~= false and GetCVar and SetCVar and GetCVar("advancedCombatLogging") ~= "1" then SetCVar("advancedCombatLogging", 1) end
    -- (the first time: the tutorial, a few seconds after you're in the world)
    if not DB.tutorialDone and C_Timer then C_Timer.After(6, function() if not InCombatLockdown() and not DB.tutorialDone then Debrief_Tutorial() end end) end
    -- (a key to start with: Ctrl+Shift+D opens the paste box, if nothing else uses it; change it in Options > Keybindings > AddOns)
    if not DB.keySet and not InCombatLockdown() and GetBindingAction and GetBindingAction("CTRL-SHIFT-D") == "" then
      if SetBinding("CTRL-SHIFT-D", "DEBRIEF_PASTE") then SaveBindings(GetCurrentBindingSet()) end
      DB.keySet = true
    end
    if DEBRIEF_POPUP ~= nil and not DEBRIEF_AUTOCOPY then say("ready. Your recap pops up on your PC after each boss pull. To share a pull with your raid: Send it from the app, then /dp here and Ctrl+V.")
    elseif DB.hasApp or DB.pasted then say("ready. After each boss pull Debrief asks \"See your recap?\": press Ctrl+V." .. (DB.testMode and " Test mode is on: /debrief demo shows a sample card." or ""))
    else say("ready. Your recap opens by itself after boss pulls when someone in your group runs Debrief Companion. /debrief demo shows a sample.") end
  end
end)
