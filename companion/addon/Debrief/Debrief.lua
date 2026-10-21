-- Debrief: your pull recap, in game.
-- Debrief Companion (the small app on your PC) reads your combat log when a boss pull ends and copies a short code.
-- Press your Debrief key (Ctrl+Shift+D unless you change it) or type /debrief paste, then Ctrl+V: the card shows.
-- The addon never reads files or combat data itself (Midnight blocks that in combat); it only shows what you paste.

local ADDON = ...
local DB

-- ---------- Debrief's colours and type (the same as the website) ----------
local COL = { bg = "171a22", head = "13161d", raised = "1e222c", line = "2a2f3b", line2 = "353b49", text = "ece8df", muted = "98a0ad",
  faint = "6c7381", gold = "e6b450", good = "45c15c", goodT = "7ee08f", goodBg = "17301e", bad = "e5534b", badT = "ff8f87", badBg = "3a1d1d", warn = "e8a23a" }
local function rgb(hex) return tonumber(hex:sub(1, 2), 16) / 255, tonumber(hex:sub(3, 4), 16) / 255, tonumber(hex:sub(5, 6), 16) / 255 end
local MEDIA = "Interface\\AddOns\\" .. (ADDON or "Debrief") .. "\\"
local FONT = { body = MEDIA .. "Fonts\\Barlow-Medium.ttf", bold = MEDIA .. "Fonts\\Barlow-SemiBold.ttf", head = MEDIA .. "Fonts\\BarlowSemiCondensed-Bold.ttf" }
local function setFont(fs, kind, size)
  local ok = fs:SetFont(FONT[kind] or FONT.body, size, "")
  if ok == false then fs:SetFont(STANDARD_TEXT_FONT, size, "") end
end
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

-- (a real pull to try the card with: Wolfthorn's Heroic Ula'tek kill, Oct 20, six players; /debrief demo shows it)
local SAMPLE = [==[DBF1^H~Ula'tek~Heroic~3~1~0~7:30~~6^P~Tyralien~PALADIN~Protection Paladin~tank~DPS~148k~-13~2~171k~2~~ability_paladin_shieldofthetemplar^S~Tyralien~warn~389539~Opener, step by step: 3 of 4. Missed: step 1, Hand of Reckoning (not in your opener).^S~Tyralien~warn~~Stat order: Crit › Mastery › Haste › Vers. Yours: Critical Strike 1,198, then Mastery 1,041, then Haste 979, then Versatility 0.^N~Tyralien~Follow the guide opener: Hand of Reckoning, then 3 of Avenger's Shield, Sentinel, Avenging Wrath or Divine Toll, in any order.^P~Eganog~PALADIN~Holy Paladin~healer~HPS~333k~5~2~317k~2~1st of 4 healers~spell_holy_holybolt^S~Eganog~warn~200025~Beacon of Virtue: 63%. It sat ready for 168 seconds.^S~Eganog~warn~223819~Divine Purpose: 4 wasted. 2 were lost to a Divine Toll pressed while you still held one.^S~Eganog~bad~82326~Mana at the kill: 60%. About a few more Holy Lights were left in it.^N~Eganog~Press Beacon of Virtue as the damage goes out, close to every 15 seconds. From 0:52, it sat ready for 36 seconds.^P~Flëxørçïst~PALADIN~Holy Paladin~healer~HPS~316k~13~2~280k~2~2nd of 4 healers~spell_holy_holybolt^S~Flëxørçïst~warn~223819~Divine Purpose: 6 wasted. 3 were lost to a Divine Toll pressed while you still held one.^S~Flëxørçïst~warn~31821~Cooldowns into the big hits: 1 of 3. 1 of your 3 healing cooldowns went out in the heaviest damage of the pull.^S~Flëxørçïst~warn~31884~Casting in Avenging Wrath: 83%. You were casting for 83% of your Avenging Wrath windows.^B~Flëxørçïst~dead~1286835~You died at 3:50 to Necrotic Vapors.^N~Flëxørçïst~Spend Divine Purpose before it runs out, or before a new one replaces it. Your first wasted one was at 2:50.^P~Magnnix~DRUID~Restoration Druid~healer~HPS~281k~-1~2~284k~2~3rd of 4 healers~spell_nature_healingtouch^S~Magnnix~warn~391528~Convoke the Spirits uses: 6 of 8. It sat ready for 2 minutes in all.^S~Magnnix~bad~48438~Mana at the kill: 58%. About 13 more Wild Growths were left in it at the kill.^S~Magnnix~warn~263725~Clearcasting: 11 wasted. 9 were replaced by a new one while you still had it.^N~Magnnix~Press Convoke the Spirits a little sooner each time it comes back.^P~Boltzzx~MAGE~Arcane Mage~dps~DPS~275k~31~2~210k~2~3rd of 21 DPS~spell_holy_magicalsentry^S~Boltzzx~warn~30451~Rotation priority: 77% of your casts were the best button to press.^S~Boltzzx~warn~30451~Always be casting: 72%. Your longest stretch with nothing pressed was 6 seconds, at 3:22, while you were moving.^S~Boltzzx~warn~321507~Touch of the Magi on cooldown: 8 of 10. It sat ready, unused, for 2 minutes in all.^N~Boltzzx~With Clearcasting and under 12 Arcane Salvo, Arcane Missiles comes first. Not in Arcane Soul, where each Barrage gives you Clearcasting and Salvo back.^P~Dragooned~MAGE~Frost Mage~dps~DPS~156k~-36~2~244k~2~17th of 21 DPS~spell_frost_frostbolt02^S~Dragooned~bad~116~Always be casting: 70%. Your longest stretch with nothing pressed was 5 seconds, at 1:52, while you were moving.^S~Dragooned~bad~190446~Brain Freeze: 3 wasted. You got 24 procs.^S~Dragooned~warn~269748~Ray of Frost on cooldown: 6 of 8. It sat ready, unused, for 21 seconds in all.^B~Dragooned~dead~1301007~You died at 4:20 to Unchecked Rage.^N~Dragooned~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.^R~warn~1292403~Caustic Waves~5 players. @Windhat, @Glizzydrizzy, @Adamdlock, @Xastral and 1 more. Dodge the venom waves from Ula'tek and her tail.^R~bad~1301007~Unchecked Rage~1 time. Nobody was in melee of Ula'tek, so she hit the raid.^D~2:44~Wallbears~HUNTER~6603~Melee^D~2:46~Newman~WARRIOR~6603~Melee^D~3:50~Flëxørçïst~PALADIN~1286835~Necrotic Vapors^D~3:53~Phartsy~MONK~6603~Melee^X~+2 more by 7:30.^Q~Kill! Next time: Dodge the venom waves from Ula'tek and her tail.^Z]==]

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
local function backdrop(f, bgHex, edgeHex)
  if not f.SetBackdrop then Mixin(f, BackdropTemplateMixin) end
  f:SetBackdrop({ bgFile = "Interface\\Buttons\\WHITE8X8", edgeFile = "Interface\\Buttons\\WHITE8X8", edgeSize = 1 })
  f:SetBackdropColor(rgb(bgHex)); f:SetBackdropBorderColor(rgb(edgeHex))
end

-- ---------- the paste box ----------
local paste = CreateFrame("Frame", "DebriefPaste", UIParent, "BackdropTemplate")
paste:SetSize(380, 132); paste:SetPoint("CENTER", 0, 140); paste:SetFrameStrata("DIALOG"); paste:Hide()
backdrop(paste, COL.bg, COL.gold)
paste:SetMovable(true); paste:EnableMouse(true); paste:RegisterForDrag("LeftButton")
paste:SetScript("OnDragStart", paste.StartMoving); paste:SetScript("OnDragStop", paste.StopMovingOrSizing)
tinsert(UISpecialFrames, "DebriefPaste")
local pLogo = paste:CreateTexture(nil, "ARTWORK"); pLogo:SetSize(16, 18); pLogo:SetPoint("TOPLEFT", 12, -11); pLogo:SetTexture(MEDIA .. "Media\\logo")
local pTitle = paste:CreateFontString(nil, "OVERLAY"); setFont(pTitle, "head", 17); pTitle:SetPoint("LEFT", pLogo, "RIGHT", 7, 0); pTitle:SetTextColor(rgb(COL.text)); pTitle:SetText("Debrief")
local pText = paste:CreateFontString(nil, "OVERLAY"); setFont(pText, "body", 13); pText:SetPoint("TOPLEFT", 12, -38); pText:SetWidth(356); pText:SetJustifyH("LEFT")
pText:SetTextColor(rgb(COL.muted)); pText:SetText("Press |cffece8dfCtrl+V|r to paste the code Debrief Companion copied.")
local ebBg = CreateFrame("Frame", nil, paste, "BackdropTemplate"); ebBg:SetPoint("TOPLEFT", 12, -62); ebBg:SetPoint("TOPRIGHT", -12, -62); ebBg:SetHeight(32)
backdrop(ebBg, COL.raised, COL.line2)
local eb = CreateFrame("EditBox", "DebriefPasteBox", ebBg)
eb:SetPoint("TOPLEFT", 9, -2); eb:SetPoint("BOTTOMRIGHT", -9, 2); eb:SetAutoFocus(false); eb:SetMultiLine(false)
eb:SetMaxLetters(0); if eb.SetMaxBytes then eb:SetMaxBytes(0) end
setFont(eb, "body", 13); eb:SetTextColor(rgb(COL.text))
local pMsg = paste:CreateFontString(nil, "OVERLAY"); setFont(pMsg, "body", 12); pMsg:SetPoint("TOPLEFT", 12, -102); pMsg:SetWidth(356); pMsg:SetJustifyH("LEFT"); pMsg:SetTextColor(rgb(COL.faint))
pMsg:SetText("Nothing is typed into the game for you. The card opens as soon as you paste.")
local pClose = CreateFrame("Button", nil, paste); pClose:SetSize(22, 22); pClose:SetPoint("TOPRIGHT", -6, -6)
local pX = pClose:CreateFontString(nil, "OVERLAY"); setFont(pX, "bold", 15); pX:SetPoint("CENTER"); pX:SetText("×"); pX:SetTextColor(rgb(COL.faint))
pClose:SetScript("OnEnter", function() pX:SetTextColor(rgb(COL.text)) end); pClose:SetScript("OnLeave", function() pX:SetTextColor(rgb(COL.faint)) end)
pClose:SetScript("OnClick", function() paste:Hide() end)
eb:SetScript("OnEscapePressed", function() paste:Hide() end)

-- ---------- the card ----------
local W, PAD = 400, 12
local CW = W - PAD * 2
local card = CreateFrame("Frame", "DebriefCard", UIParent, "BackdropTemplate")
card:SetSize(W, 300); card:SetPoint("CENTER", 260, 60); card:SetFrameStrata("HIGH"); card:SetClampedToScreen(true); card:Hide()
backdrop(card, COL.bg, COL.line2)
card:SetMovable(true); card:EnableMouse(true)
tinsert(UISpecialFrames, "DebriefCard")

local top = CreateFrame("Frame", nil, card, "BackdropTemplate"); top:SetPoint("TOPLEFT", 1, -1); top:SetPoint("TOPRIGHT", -1, -1); top:SetHeight(34)
backdrop(top, COL.head, COL.head)
local topLine = top:CreateTexture(nil, "ARTWORK"); topLine:SetPoint("BOTTOMLEFT"); topLine:SetPoint("BOTTOMRIGHT"); topLine:SetHeight(1); fill(topLine, COL.line)
top:EnableMouse(true); top:RegisterForDrag("LeftButton")
top:SetScript("OnDragStart", function() card:StartMoving() end)
top:SetScript("OnDragStop", function()
  card:StopMovingOrSizing()
  local p, _, rp, x, y = card:GetPoint(); DB.pos = { p, rp, x, y }
end)
local logo = top:CreateTexture(nil, "ARTWORK"); logo:SetSize(16, 18); logo:SetPoint("LEFT", 11, 0); logo:SetTexture(MEDIA .. "Media\\logo")
local title = top:CreateFontString(nil, "OVERLAY"); setFont(title, "head", 17); title:SetPoint("LEFT", logo, "RIGHT", 7, 0); title:SetTextColor(rgb(COL.text)); title:SetText("Debrief")
local bossT = top:CreateFontString(nil, "OVERLAY"); setFont(bossT, "body", 13); bossT:SetPoint("LEFT", title, "RIGHT", 8, -1); bossT:SetTextColor(rgb(COL.muted)); bossT:SetWidth(270); bossT:SetJustifyH("LEFT"); bossT:SetWordWrap(false)
local close = CreateFrame("Button", nil, top); close:SetSize(24, 24); close:SetPoint("RIGHT", -5, 0)
local closeX = close:CreateFontString(nil, "OVERLAY"); setFont(closeX, "bold", 16); closeX:SetPoint("CENTER"); closeX:SetText("×"); closeX:SetTextColor(rgb(COL.faint))
close:SetScript("OnEnter", function() closeX:SetTextColor(rgb(COL.text)) end); close:SetScript("OnLeave", function() closeX:SetTextColor(rgb(COL.faint)) end)
close:SetScript("OnClick", function() card:Hide() end)

-- pull chips (the last few pulls you pasted)
local chips = {}
for i = 1, 5 do
  local b = CreateFrame("Button", nil, card, "BackdropTemplate"); b:SetSize(70, 20)
  backdrop(b, COL.raised, COL.raised)
  b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "body", 11.5); b.t:SetPoint("CENTER")
  b:SetPoint("TOPLEFT", PAD + (i - 1) * 75, -44); b:Hide()
  chips[i] = b
end
local resT = card:CreateFontString(nil, "OVERLAY"); setFont(resT, "head", 25); resT:SetPoint("TOPLEFT", PAD, -72); resT:SetJustifyH("LEFT")
local metaT = card:CreateFontString(nil, "OVERLAY"); setFont(metaT, "body", 13); metaT:SetPoint("TOPLEFT", PAD, -100); metaT:SetTextColor(rgb(COL.muted)); metaT:SetJustifyH("LEFT")

-- tabs: Me and Raid view, a gold line under the open one; on Me, arrows to look at anyone in the pull
local tabs, view = {}, "me"
local tabLine = card:CreateTexture(nil, "ARTWORK"); tabLine:SetPoint("TOPLEFT", 1, -150); tabLine:SetPoint("TOPRIGHT", -1, -150); tabLine:SetHeight(1); fill(tabLine, COL.line)
local function mkTab(key, label, x)
  local b = CreateFrame("Button", nil, card); b:SetSize(10, 26); b:SetPoint("TOPLEFT", x, -124)
  b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 14); b.t:SetPoint("CENTER"); b.t:SetText(label)
  b:SetWidth(b.t:GetStringWidth() + 18)
  b.u = b:CreateTexture(nil, "OVERLAY"); b.u:SetPoint("BOTTOMLEFT", 0, 0); b.u:SetPoint("BOTTOMRIGHT", 0, 0); b.u:SetHeight(2); fill(b.u, COL.gold)
  b.key = key; tabs[key] = b
  return b
end
local tMe = mkTab("me", "Me", PAD - 6)
local tRaid = mkTab("raid", "Raid view", PAD - 6 + tMe:GetWidth() + 2)
local who = card:CreateFontString(nil, "OVERLAY"); setFont(who, "bold", 13); who:SetJustifyH("RIGHT"); who:SetWordWrap(false)
local nextB = CreateFrame("Button", nil, card); nextB:SetSize(20, 20); nextB:SetPoint("TOPRIGHT", -PAD, -128)
local prevB = CreateFrame("Button", nil, card); prevB:SetSize(20, 20)
who:SetPoint("RIGHT", nextB, "LEFT", -6, 0); prevB:SetPoint("RIGHT", who, "LEFT", -6, 0)
for _, b in ipairs({ prevB, nextB }) do
  backdrop(b, COL.raised, COL.line2)
  b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 10); b.t:SetPoint("CENTER"); b.t:SetTextColor(rgb(COL.muted))
end
prevB.t:SetText("<"); nextB.t:SetText(">")

local body = CreateFrame("Frame", nil, card); body:SetPoint("TOPLEFT", PAD, -160); body:SetWidth(CW); body:SetHeight(10)
local foot = card:CreateFontString(nil, "OVERLAY"); setFont(foot, "body", 11.5); foot:SetTextColor(rgb(COL.faint)); foot:SetJustifyH("LEFT")
foot:SetText("Type /debrief to open this again. /debrief paste for a new pull.")
local footLine = card:CreateTexture(nil, "ARTWORK"); footLine:SetHeight(1); fill(footLine, COL.line)

-- pooled pieces for the body (redrawn each time)
local pool = { fs = {}, tex = {} }
local used = { fs = 0, tex = 0 }
local function resetPool()
  used.fs, used.tex = 0, 0
  for _, l in pairs(pool) do for _, o in ipairs(l) do o:Hide(); o:ClearAllPoints() end end
end
local function FS(kind, size, hex)
  used.fs = used.fs + 1
  local fs = pool.fs[used.fs]
  if not fs then fs = body:CreateFontString(nil, "OVERLAY"); pool.fs[used.fs] = fs end
  setFont(fs, kind, size); fs:SetTextColor(rgb(hex or COL.text)); fs:SetJustifyH("LEFT"); fs:SetJustifyV("TOP"); fs:SetWordWrap(true); fs:SetWidth(0); fs:Show()
  return fs
end
local function TEX(layer)
  used.tex = used.tex + 1
  local t = pool.tex[used.tex]
  if not t then t = body:CreateTexture(nil, "ARTWORK"); pool.tex[used.tex] = t end
  t:SetDrawLayer(layer or "ARTWORK"); t:SetTexCoord(0, 1, 0, 1); t:SetAlpha(1); t:SetVertexColor(1, 1, 1); t:Show()
  return t
end
local function box(y, h, bgHex, edgeHex, goldBar, bgA)
  local bg = TEX("BACKGROUND"); bg:SetPoint("TOPLEFT", 0, -y); bg:SetSize(CW, h); fill(bg, bgHex, bgA)
  local function edge(p1, p2, w, hh) local e = TEX("BORDER"); e:SetPoint(p1, bg, p1); e:SetPoint(p2, bg, p2); if w then e:SetWidth(w) end; if hh then e:SetHeight(hh) end; fill(e, edgeHex) end
  edge("TOPLEFT", "TOPRIGHT", nil, 1); edge("BOTTOMLEFT", "BOTTOMRIGHT", nil, 1); edge("TOPLEFT", "BOTTOMLEFT", 1, nil); edge("TOPRIGHT", "BOTTOMRIGHT", 1, nil)
  if goldBar then local b = TEX("ARTWORK"); b:SetPoint("TOPLEFT", bg, "TOPLEFT"); b:SetPoint("BOTTOMLEFT", bg, "BOTTOMLEFT"); b:SetWidth(4); fill(b, COL.gold) end
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
local function head(y, text, hex)
  local t = FS("head", 14, hex or COL.text); t:SetPoint("TOPLEFT", 0, -y); t:SetText(text)
  return y + 19
end
-- a row: a coloured dot, an icon, then the text (an optional bold title above it)
local function row(y, flag, ic, text, ttl)
  local d = TEX("ARTWORK"); d:SetPoint("TOPLEFT", 1, -(y + 6)); d:SetSize(7, 7); fill(d, FLAG[flag] or COL.faint)
  icon(14, y, 19, ic)
  local x, w, yy = 40, CW - 40, y
  if ttl and ttl ~= "" then local h = FS("bold", 13.5, COL.text); h:SetPoint("TOPLEFT", x, -yy); h:SetWidth(w); h:SetText(ttl); yy = yy + h:GetStringHeight() + 1 end
  local t = FS("body", 13.5, COL.text); t:SetPoint("TOPLEFT", x, -yy); t:SetWidth(w); t:SetText(names(text))
  yy = yy + t:GetStringHeight()
  return math.max(y + 20, yy) + 7
end
local function nextBox(y, text)
  local t = FS("body", 14, COL.text); t:SetWidth(CW - 28); t:SetText(names(text))
  local l = FS("head", 14, COL.gold); l:SetText("Next pull")
  local h = 10 + 18 + t:GetStringHeight() + 10
  box(y, h, COL.gold, COL.gold, true, 0.06)
  -- (the box's fill is the gold at 6%; its edge stays solid gold)
  l:SetPoint("TOPLEFT", 16, -(y + 8)); t:SetPoint("TOPLEFT", 16, -(y + 27))
  return y + h + 4
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

local render
local function showPull(i)
  if not DB.pulls[i] then return end
  DB.cur = i; render()
end
function render()
  local m = DB.pulls[DB.cur]; CUR = m
  if not m then return end
  local h = m.h
  bossT:SetText(h.boss .. "  ·  " .. h.diff)
  -- chips: the newest five
  local n = #DB.pulls
  local first = math.max(1, n - #chips + 1)
  for i = 1, #chips do
    local b, k = chips[i], first + i - 1
    local q = DB.pulls[k]
    if q then
      local kill = q.h.kill
      b.t:SetText("Pull " .. q.h.pull .. "  " .. (kill and "Kill" or (q.h.pct ~= "" and (q.h.pct .. "%") or "Wipe")))
      b.t:SetTextColor(rgb(kill and COL.goodT or COL.badT))
      b:SetBackdropColor(rgb(kill and COL.goodBg or COL.badBg))
      b:SetBackdropBorderColor(rgb(k == DB.cur and COL.gold or (kill and COL.goodBg or COL.badBg)))
      b:SetWidth(b.t:GetStringWidth() + 16)
      b:ClearAllPoints()
      if i == 1 then b:SetPoint("TOPLEFT", card, "TOPLEFT", PAD, -44) else b:SetPoint("LEFT", chips[i - 1], "RIGHT", 5, 0) end
      b:SetScript("OnClick", function() showPull(k) end)
      b:Show()
    else b:Hide() end
  end
  resT:SetText(h.kill and "Kill!" or ("Wipe" .. (h.pct ~= "" and (" at " .. h.pct .. "%") or "")))
  resT:SetTextColor(rgb(h.kill and COL.goodT or COL.badT))
  local meta = { h.dur }
  if h.where ~= "" then meta[#meta + 1] = h.where end
  meta[#meta + 1] = h.deaths .. (h.deaths == "1" and " death" or " deaths")
  metaT:SetText(table.concat(meta, "  ·  "))
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
  local y = 0
  if view == "me" and P then
    -- the tile: your damage or healing, against your last pull and your best
    local th = 56
    box(y, th, COL.raised, COL.line)
    icon(10, y + 12, 32, P.icon)
    local l = FS("body", 13, COL.muted); l:SetPoint("TOPLEFT", 52, -(y + 8)); l:SetText(P.role == "healer" and "Your healing" or "Your damage")
    local v = FS("head", 27, COL.text); v:SetPoint("TOPLEFT", 52, -(y + 23)); v:SetText(P.v)
    local u = FS("bold", 12, COL.muted); u:SetPoint("BOTTOMLEFT", v, "BOTTOMRIGHT", 4, 4); u:SetText(P.unit)
    local s = FS("body", 12.5, COL.faint); s:SetJustifyH("RIGHT"); s:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - 10, -(y + 8))
    local lines = {}
    if P.d then lines[#lines + 1] = (P.d >= 0 and ("|cff7ee08f+" .. P.d .. "%|r") or ("|cffff8f87" .. P.d .. "%|r")) .. " vs pull " .. P.vs end
    lines[#lines + 1] = (P.best ~= "" and ("Best " .. P.best .. " (pull " .. P.bp .. ")") or "First pull read")
    if P.rank ~= "" then lines[#lines + 1] = P.rank end
    s:SetText(table.concat(lines, "\n"))
    y = y + th + 12
    y = head(y, "Rotation")
    if #P.slips == 0 then y = row(y, "ok", nil, "No rotation checks for this spec yet.") end
    for _, r in ipairs(P.slips) do y = row(y, r[1], r[2], r[3]) end
    y = y + 4
    y = head(y, "Boss mechanics")
    if #P.boss == 0 then y = row(y, "ok", nil, "No boss mistakes.") end
    for _, r in ipairs(P.boss) do y = row(y, r[1], r[2], r[3]) end
    if P.next ~= "" then y = nextBox(y + 4, P.next) end
  else
    y = head(y, h.kill and "What to clean up" or "Top mistakes")
    if #m.raid.bad == 0 then y = row(y, "ok", nil, "Nothing big.") end
    for _, r in ipairs(m.raid.bad) do y = row(y, r[1], r[2], r[4], r[3]) end
    y = y + 4
    y = head(y, "Who died")
    if #m.raid.died == 0 then local t = FS("body", 13, COL.faint); t:SetPoint("TOPLEFT", 0, -y); t:SetText("Nobody died."); y = y + 18 end
    for _, d in ipairs(m.raid.died) do
      local t = FS("body", 13.5, COL.muted); t:SetPoint("TOPLEFT", 0, -y); t:SetText(d[1])
      local nm = FS("bold", 13.5, classHex(d[3])); nm:SetPoint("TOPLEFT", 44, -y); nm:SetWidth(130); nm:SetWordWrap(false); nm:SetText(d[2])
      icon(182, y, 17, d[4])
      local w = FS("body", 13.5, COL.muted); w:SetPoint("TOPLEFT", 206, -y); w:SetWidth(CW - 206); w:SetWordWrap(false); w:SetText(d[5])
      y = y + 21
    end
    if m.raid.more ~= "" then local t = FS("body", 13, COL.faint); t:SetPoint("TOPLEFT", 0, -y); t:SetText(m.raid.more); y = y + 18 end
    if m.raid.next ~= "" then y = nextBox(y + 6, m.raid.next) end
  end
  body:SetHeight(math.max(10, y))
  footLine:ClearAllPoints(); footLine:SetPoint("TOPLEFT", card, "TOPLEFT", 1, -(160 + y + 8)); footLine:SetPoint("TOPRIGHT", card, "TOPRIGHT", -1, -(160 + y + 8))
  foot:ClearAllPoints(); foot:SetPoint("TOPLEFT", card, "TOPLEFT", PAD, -(160 + y + 15))
  card:SetHeight(160 + y + 36)
end

-- ---------- keeping pulls, showing the card ----------
local function sameAs(a, b) return a.h.boss == b.h.boss and a.h.pull == b.h.pull and a.h.dur == b.h.dur end
local function addPull(m)
  for i, q in ipairs(DB.pulls) do if sameAs(q, m) then DB.cur = i; return false end end
  DB.pulls[#DB.pulls + 1] = m
  while #DB.pulls > 12 do table.remove(DB.pulls, 1) end
  DB.cur = #DB.pulls; DB.who = nil
  return true
end
local pendingShow = false
local function showCard()
  -- (never pops up mid-fight: it waits until you're out of combat)
  if InCombatLockdown() then pendingShow = true; return end
  card:Show(); render()
  if SOUNDKIT and SOUNDKIT.IG_QUEST_LOG_OPEN then PlaySound(SOUNDKIT.IG_QUEST_LOG_OPEN) end
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
    showCard()
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
  if t and #t > 6 and t:find("%^Z%s*$") then
    if import(t) then self:SetText("") end
  end
end)
eb:SetScript("OnEnterPressed", function(self) local t = self:GetText(); if t ~= "" and import(t) then self:SetText("") end end)

-- ---------- opening it: key, slash command ----------
function Debrief_OpenPaste(noFocus)
  pMsg:SetTextColor(rgb(COL.faint))
  if DB and DB.testMode and noFocus then
    pMsg:SetText("Test mode: click the box, then Ctrl+V. /debrief demo shows a sample. /debrief test turns this off.")
  else
    pMsg:SetText(noFocus and "Pull over. Click the box (or press your Debrief key), then Ctrl+V." or "Nothing is typed into the game for you. The card opens as soon as you paste.")
  end
  eb:SetText(""); paste:Show()
  if noFocus then eb:ClearFocus() else eb:SetFocus() end
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
  if msg == "paste" or msg == "p" then Debrief_OpenPaste()
  elseif msg == "raid" then DB.raidAlways = not DB.raidAlways; say("Raid view " .. (DB.raidAlways and "always on." or "only when you lead or assist.")); if card:IsShown() then render() end
  elseif msg == "reset" then DB.pos = nil; card:ClearAllPoints(); card:SetPoint("CENTER", 260, 60); say("card moved back to the middle.")
  elseif msg == "clear" then DB.pulls = {}; DB.cur = nil; card:Hide(); say("pulls cleared.")
  elseif msg == "demo" then
    -- (the built-in sample pull: the card with no paste, not sent to the group)
    local m = decode(SAMPLE)
    if m then addPull(m); paste:Hide(); showCard(); say("showing a sample: our Heroic Ula'tek kill (Oct 20). Use the arrows to see other players.") end
  elseif msg == "test" then DB.testMode = not DB.testMode; say("test mode " .. (DB.testMode and "on: the box pops up after every fight and when you log in." or "off: the box only pops up after boss pulls."))
  elseif msg == "share" then DB.share = (DB.share == false); say("sharing your pastes with the group " .. (DB.share ~= false and "on." or "off."))
  elseif msg == "auto" then DB.autoBox = (DB.autoBox == false); say("paste box after each boss pull " .. (DB.autoBox ~= false and "on." or "off."))
  elseif msg == "help" then say("/debrief: show or hide the card. /debrief paste: paste a new pull. /debrief demo: a sample card. /debrief test: test mode on or off. /debrief raid: Raid view on or off. /debrief share: send your pastes to the group on or off. /debrief auto: paste box after each pull on or off. /debrief reset: move the card back.")
  else Debrief_Toggle() end
end

local ev = CreateFrame("Frame")
ev:RegisterEvent("ADDON_LOADED"); ev:RegisterEvent("PLAYER_LOGIN"); ev:RegisterEvent("CHAT_MSG_ADDON"); ev:RegisterEvent("PLAYER_REGEN_ENABLED"); ev:RegisterEvent("ENCOUNTER_END"); ev:RegisterEvent("PLAYER_ENTERING_WORLD")
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
  elseif e == "PLAYER_ENTERING_WORLD" then
    if arg or a2 then testBox(4) end -- (on login or /reload, not every loading screen)
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
    if DB.testMode == nil then DB.testMode = true end -- (on while we test; /debrief test turns it off)
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
