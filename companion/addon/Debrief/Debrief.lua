local detailBtn, PRESET_NAME, render -- (shared by parts below)
local onShow, miniShow, autoLog, mini, big, bigRender
-- Debrief: your pull recap, in game.
-- Debrief Companion (the small app on your PC) reads your combat log when a boss pull ends, shows the recap over the game and saves it
-- into this addon's Pulls.lua, which WoW reads at login or /reload. Nothing is pasted or shared (Oct 24).
-- The addon never reads files or combat data itself (Midnight blocks that in combat); it only shows what the app saved.

local ADDON = ...
local DB

-- ---------- Debrief's colours and type (the same as the website) ----------
local COL = { bg = "171a22", head = "13161d", raised = "1e222c", line = "2a2f3b", line2 = "353b49", text = "ece8df", muted = "98a0ad",
  faint = "6c7381", soft = "d6d1c6", gold = "e6b450", good = "45c15c", goodT = "7ee08f", goodBg = "17301e", bad = "e5534b", badT = "ff8f87", badBg = "3a1d1d", warn = "e8a23a" }
-- (the accent colour: gold like the website, your class colour, or one of these)
local ACCENTS = { gold = "e6b450", frost = "3fc7eb", fel = "45c15c", crimson = "e5534b", violet = "a78bfa" }
local function rgb(hex) return tonumber(hex:sub(1, 2), 16) / 255, tonumber(hex:sub(3, 4), 16) / 255, tonumber(hex:sub(5, 6), 16) / 255 end
local MEDIA = "Interface\\AddOns\\" .. (ADDON or "Debrief") .. "\\"
-- (Barlow Condensed, the website's font and a common WoW UI font (Oct 25, the Design studio's spec))
local FONT = { body = MEDIA .. "Fonts\\BarlowCondensed-Medium.ttf", bold = MEDIA .. "Fonts\\BarlowCondensed-SemiBold.ttf", head = MEDIA .. "Fonts\\BarlowCondensed-Bold.ttf" }
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
  -- (Debrief's own font is condensed: one size up, and nothing under 12 (Oct 25); your Text size still multiplies on top)
  local sz = ((set == FONT) and math.max(12, size + 1) or size) * ((DebriefDB and DebriefDB.fontScale) or 1)
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
  if code:sub(1, 4) ~= "DBF1" then return nil, "That pull couldn't be read." end
  if code:sub(-2) ~= "^Z" then return nil, "That pull was cut off, so it couldn't be read." end
  local m, by = { players = {}, raid = { bad = {}, died = {}, mech = {}, cons = {}, defs = {}, kitd = {}, tiles = {}, good = {}, fixes = {}, ghap = {}, gchg = {}, more = "", next = "", story = "", better = "", worse = "", ghead = "", gnext = "" } }, {}
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
      m.h = { boss = g(2), diff = g(3), pull = g(4), kill = g(5) == "1", pct = g(6), dur = g(7), where = g(8), deaths = g(9), dungeon = g(10) == "1" } -- (a dungeon boss: your Me view only (Oct 24))
    elseif t == "P" then
      local p = { name = g(2), cls = g(3), spec = g(4), role = g(5), unit = g(6), v = g(7), d = tonumber(g(8)), vs = g(9), best = g(10), bp = g(11), rank = g(12), icon = g(13), bt = g(14) == "1", slips = {}, boss = {}, surv = {}, tiles = {}, next = "", next2 = "" }
      m.players[#m.players + 1] = p; by[p.name] = p
    elseif t == "S" and by[g(2)] then add(by[g(2)].slips, { g(3), g(4), g(5) })
    elseif t == "RS" and by[g(2)] then by[g(2)].rs = { score = tonumber(g(3)), good = g(4) ~= "" and split(g(4), ";") or {} }; by[g(2)].rot = by[g(2)].rot or {} -- (your rotation score and what you did well (Oct 24))
    elseif t == "RW" and by[g(2)] then local p = by[g(2)]; local r = p.rot and p.rot[#p.rot] -- (a ramp or burst window of the check just before it (Oct 24))
      if r then r.win = r.win or {}; r.win[#r.win + 1] = { st = g(3), head = g(4), sub = g(5), vals = g(6), chk = g(7), seq = g(8), pre = g(9) == "1", meta = g(10) } end
    elseif t == "RT" and by[g(2)] then local p = by[g(2)]; p.rot = p.rot or {}; p.rot[#p.rot + 1] = { g(3), g(4), g(5), g(6), g(7), g(8), g(9), g(10), g(11), g(12) }; add(p.slips, { g(3), g(4), g(5) .. (g(6) ~= "" and (": " .. g(6)) or "") .. "." }) -- (a fix: flag, icon, name, yours, top, tip, squares, why)
    elseif t == "B" and by[g(2)] then add(by[g(2)].boss, { g(3), g(4), g(5) })
    elseif t == "U" and by[g(2)] then add(by[g(2)].surv, { g(3), g(4), g(5) }) -- (survival: defensives)
    elseif t == "HP" and by[g(2)] then local p = by[g(2)]; p.cons = p.cons or {}; add(p.cons, { g(3), g(4), g(5) }) -- (your Healthstone and potion)
    elseif t == "RH" then add(m.raid.cons, { g(2), g(3), g(4) }) -- (the raid's Healthstones and potions)
    elseif t == "HK" and by[g(2)] then local p = by[g(2)]; p.kitd = p.kitd or {}; add(p.kitd, { g(3), g(4), g(5) }) -- (your deaths with a Healthstone or potion unused)
    elseif t == "RK" then add(m.raid.kitd, { g(2), g(3), g(4) }) -- (the raid's)
    elseif t == "RD" then add(m.raid.defs, { g(2), g(3), g(4) }) -- (the raid's defensives)
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
    elseif t == "V" then m.addonV = g(2); m.appV = g(3) -- (the addon version the PC app that made this carries, and the app's own version)
    -- (Debriefing's coach box, per wipe-filter version)
    elseif t == "CH" then for _, c in ipairs(coaches()) do c.head = g(2) end
    elseif t == "CM" then for _, c in ipairs(coaches()) do c.more = tonumber(g(2)) end -- (smaller mistakes not listed)
    elseif t == "CRC" then for _, c in ipairs(coaches()) do c.root = { cause = g(2), rest = g(3), tr = g(4) } end -- (the raid lead's cards (Oct 23))
    elseif t == "CTE" then for _, c in ipairs(coaches()) do c.cards = true end
    elseif t == "CT" then for _, c in ipairs(coaches()) do c.tr = c.tr or { w = {}, x = {}, b = {} }; local L = c.tr[g(2)]; if L then L[#L + 1] = { nm = g(3), tag = g(4), sub = g(5) } end end
    elseif t == "CF" then for _, c in ipairs(coaches()) do c.focus = g(2); c.focusSame = g(3) == "1"; c.kill = g(4) == "1" end
    elseif t == "CW" then for _, c in ipairs(coaches()) do table.insert(c.wrong, { sev = g(2), id = g(3), label = g(4), tag = g(5), what = g(6), fix = g(7), how = g(8), kb = g(9), tr = g(10), wnn = g(11) }) end
    elseif t == "CR" then for _, c in ipairs(coaches()) do table.insert(c.right, { id = g(2), t = g(3) }) end
    elseif t == "CD" then for _, c in ipairs(coaches()) do table.insert(c.deaths, { t = g(2), who = g(3), cls = g(4), id = g(5), ab = g(6), k = g(7), story = g(8), ready = g(9) }) end
    elseif t == "CN" then for _, c in ipairs(coaches()) do c.dnote = g(2) end
    elseif t == "CL" then for _, c in ipairs(coaches()) do c.dline = g(2) end
    elseif t == "CA" then for _, c in ipairs(coaches()) do table.insert(c.avoid, { id = g(2), k = g(3), who = g(4), cls = g(5), n = g(6), bad = g(7) == "1", story = g(8) }) end
    elseif t == "CV" then for _, c in ipairs(coaches()) do c.aline = g(2) end
    elseif t == "PC" and by[g(2)] then by[g(2)].coach = { head = g(3), focus = g(4) } -- (your own coach line and focus)
    elseif t == "PT" and by[g(2)] then local p = by[g(2)]; p.ctr = p.ctr or { x = {}, b = {} }; local L = p.ctr[g(3)]; if L then L[#L + 1] = { nm = g(4), tag = g(5) } end -- (your worse/better than last pull)
    elseif t == "C" then m.cutN = tonumber(g(2)) -- (the wipe filter: versions 0 to n)
    elseif t == "WC" then m.wc = { at = g(2), txt = g(3) } -- (the wipe call: when and why; then version 1 is up to it (Oct 23))
    elseif t == "RG" then m.grade = { letter = g(2), score = g(3), cats = g(4) } -- (the Report card's grade for the pull)
    elseif t == "X" then if K then m.raid.moreK = m.raid.moreK or {}; table.insert(m.raid.moreK, { K, g(2) }) else m.raid.more = g(2) end
    elseif t == "Q" then if K then m.raid.nextK = m.raid.nextK or {}; table.insert(m.raid.nextK, { K, g(2) }) else m.raid.next = g(2) end
    end
  end
  if not m.h then return nil, "That pull is empty." end
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
local SAMPLE = [==[DBF1^H~The Coiled Altar~Mythic~33~0~57~3:58~Phase 2~20^C~1^P~Ironvow~PALADIN~Protection Paladin~tank~DPS~102k~2~32~100k~32~~ability_paladin_shieldofthetemplar~1^RS~Ironvow~88~Weapon oil or Rite on;Rotation priority;Avenger's Shield on cooldown;Holy Power wasted^RT~Ironvow~warn~ability_paladin_shieldofthetemplar~Opener, step by step~3/4~~Follow the guide opener: Hand of Reckoning, then 3 of Avenger's Shield, Sentinel, Avenging Wrath or Divine Toll, in any order.~~You followed 3 of the 4 steps of the Lightsmith opener, in order. Missed: step 1, Hand of Reckoning (not in your opener).~Both guides' openers: Consecration placed before the pull as close as you safely can, Blessed Hammer before the pull for Holy Power, Hand of Reckoning on the pull, Ardent Defender if you tank first, then Avenger's Shield…~^RT~Ironvow~warn~spell_holy_borrowedtime~Always be casting~63%~63%~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.~~You were casting for 63% of the time you were alive. Your longest stretch with nothing pressed was 6 seconds, at 1:30, while you were moving.~This is the share of your time alive that you spent casting or on a global cooldown. 66% or more is good.~^RT~Ironvow~warn~197277~Judgment on cooldown~40/52~85%~Press Judgment as soon as it comes back. From the start of the pull, it sat ready for 25 seconds.~~You pressed it 40 times out of a possible 52. It sat ready, unused, for 82 seconds in all. It did 1.94M damage in all, 48.6K per cast.~Judgment on cooldown. It builds Holy Power.~^K~0~B~Ironvow~dead~1286918~You died at 3:58 to Eternal Nightfall. The pull was already lost.^B~Ironvow~warn~ability_rogue_sprint~Avoidable damage taken: 2.22m, 1st most in the raid.^B~Ironvow~ok~ability_kick~Interrupts: 4.^U~Ironvow~ok~642~Defensives: Divine Shield 0 of 1, Ardent Defender 2 of 3, Guardian of Ancient Kings 2 of 2, Lay on Hands 0 of 1.^HP~Ironvow~info~inv_stone_04~No Healthstone or potion used.^K~0~HK~Ironvow~bad~inv_stone_04~You died at 3:58 to Eternal Nightfall with your Healthstone and health potion unused, after 7 seconds low. If you're dropping, use them.^N~Ironvow~Follow the guide opener: Hand of Reckoning, then 3 of Avenger's Shield, Sentinel, Avenging Wrath or Divine Toll, in any order.^T~Ironvow~Avoidable damage~2.22m~1st most of 20~warn^T~Ironvow~Interrupts~4~raid: 9~ok^O~Ironvow~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.^K~1~E~Ironvow~Focus next pull: Hand of Reckoning, then 3 of Avenger's Shield, Sentinel, Avenging Wrath or Divine Toll, in any order.^K~0~E~Ironvow~You died at 3:58. Focus next pull: Hand of Reckoning, then 3 of Avenger's Shield, Sentinel, Avenging Wrath or Divine Toll, in any order.^P~Lumenra~WARRIOR~Protection Warrior~tank~DPS~71k~-33~32~105k~32~~ability_warrior_defensivestance~^RS~Lumenra~73~Battle Shout at the pull;Rotation priority;Shield Slam on cooldown;Revenge!^RT~Lumenra~bad~spell_holy_borrowedtime~Always be casting~55%~~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.~~You were casting for 55% of the time you were alive. Your longest stretch with nothing pressed was 10 seconds, at 1:52, while you were moving.~This is the share of your time alive that you spent casting or on a global cooldown. 71% or more is good.~^RT~Lumenra~warn~132404~Shield Block uptime~78%~~Keep Shield Block up. Your longest gap was 13 seconds, from 1:51.~~Shield Block was up 78% of the time you were alive.~Shield Block is your main active mitigation. Keep it up as much as you can while you tank, and spend leftover Rage on Ignore Pain.~^RT~Lumenra~warn~ability_warrior_defensivestance~Opener, step by step~5/6~~Follow the guide opener: Charge, then 2 of Avatar, Thunder Clap or Thunder Blast, in any order, then Shield Block, then Demoralizing Shout and Shield Slam, in any order.~~You followed 5 of the 6 steps of the Mountain Thane opener, in order. Missed: step 6, Demoralizing Shout or Shield Slam (out of order).~Always Charge in, Avatar as you Charge, then Thunder Clap, Shield Block, Shield Slam and Demoralizing Shout, then Demolish (Colossus) and Shield Charge. Other casts in between are fine.~^RT~Lumenra~warn~107574~Avatar uses~4/5~~Press Avatar a little sooner each time it comes back.~~You pressed it 4 times out of a possible 5. It sat ready, unused, for 51 seconds in all.~Avatar on cooldown, about once a minute. 85% or more is good.~^RT~Lumenra~warn~1160~Demoralizing Shout uses~5/7~~Press Demoralizing Shout a little sooner each time it comes back.~~You pressed it 5 times out of a possible 7. It sat ready, unused, for 42 seconds in all.~Demoralizing Shout comes up often. Use it.~^B~Lumenra~bad~1286620~Soul Sever: Died to Soul Sever on stack 2.^B~Lumenra~dead~1286620~You died at 3:38 to Soul Sever. That one was on you.^B~Lumenra~warn~ability_rogue_sprint~Avoidable damage taken: 1.47m, 2nd most in the raid.^U~Lumenra~ok~871~Defensives: Shield Wall 2 of 2, Rallying Cry 1 of 2.^HP~Lumenra~info~inv_stone_04~No Healthstone or potion used.^N~Lumenra~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.^T~Lumenra~Avoidable damage~1.47m~2nd most of 20~warn^T~Lumenra~Interrupts~0~raid: 9~ok^O~Lumenra~Keep Shield Block up. Your longest gap was 13 seconds, from 1:51.^E~Lumenra~You died at 3:38. Focus next pull: On the second stack use a defensive plus two externals, or swap.^P~Thorncall~MONK~Mistweaver Monk~healer~HPS~424k~5~32~406k~32~3rd of 4 healers~spell_monk_mistweaver_spec~1^RS~Thorncall~84~Full mana at the pull;Always be casting;Rotation priority;Renewing Mist on cooldown^RT~Thorncall~bad~116680~Thunder Focus Tea on Renewing Mist~5/11~~After Thunder Focus Tea, press Renewing Mist next.~~5 of your 11 Thunder Focus Teas went on a Renewing Mist.~Both guides, in raid: spend Thunder Focus Tea on Renewing Mist (10 more seconds, and the Haste from Secret Infusion). Enveloping Mist is fine when one player needs a big heal.~^RT~Thorncall~bad~443028~Celestial Conduits into heavy damage~0/2~~Save Celestial Conduit for the damage.~~0 of your 2 Celestial Conduits went out while the raid was taking heavy damage.~Celestial Conduit heals the raid over its channel, then the Celestials heal and shield it. Use it on the damage.~^RT~Thorncall~warn~443028~Celestial Conduits set up~1/2~~Before Celestial Conduit, spend your Renewing Mists and press Rushing Wind Kick. After it, press Rushing Wind Kick every time it comes back.~~1 of your 2 Celestial Conduits had Renewing Mist just before, Rushing Wind Kick just before and 2 or more Rushing Wind Kicks in it.~Then Heart of the Jade Serpent brings your cooldowns back 2.5 times as fast for 8 seconds: press Rushing Wind Kick on cooldown and never let Renewing Mist cap. Each card is one Celestial Conduit, from the press to the end of what it brings.~^RW~Thorncall~warn~1:05–1:14~9 seconds~431.9K HPS · rest of the pull 427.9K~1:2 Rushing Wind Kicks in it;0:Renewing Mist just before;1:Rushing Wind Kick just before;0:1 proc wasted;0:Not into heavy damage~443592;115450;116680;467307;119611;116670;124682;467307~~Mana at the start: 92% · Casting 70% of it^RW~Thorncall~ok~2:51–3:00~9 seconds~511.3K HPS · rest of the pull 427.9K~1:3 Rushing Wind Kicks in it;1:Renewing Mist just before;1:Rushing Wind Kick just before;0:1 proc wasted;0:Not into heavy damage~443592;119611;116680;467307;116670;467307;124682;119611;467307~~Mana at the start: 61% · Casting 100% of it^RT~Thorncall~warn~443028~Celestial Conduit uses~2/3~100%~Press Celestial Conduit a little sooner each time it comes back.~~You pressed it twice out of a possible 3. It sat ready, unused, for 78 seconds in all. It healed for 2.23M in all, 1.12M per cast.~Press Celestial Conduit on cooldown. 80% or more is good.~^RT~Thorncall~warn~31821~Cooldowns on big damage~0/1~~Save your healing cooldowns for the boss's big hits. Learn when they come and press yours as they land.~~Your healing cooldown didn't go out in the heaviest damage of the pull.~Your healing cooldowns are worth the most when the raid takes the most damage, so one sent into a quiet moment is one you don't have when it hurts.~^RW~Thorncall~warn~0:25–0:35~1.6 times the usual damage~Mostly Venom Rupture and Coalesced Venom~0:None of your cooldowns~~~^RW~Thorncall~warn~1:31–1:38~1.5 times the usual damage~Mostly Noxious Ground and Coalesced Venom~0:None of your cooldowns~~~^RW~Thorncall~warn~1:42–1:57~2.0 times the usual damage~Mostly Venom Rupture and Coalesced Venom~0:None of your cooldowns~~~^RW~Thorncall~warn~2:11–2:37~2.5 times the usual damage~Mostly Venom Rupture and Coalesced Venom~0:None of your cooldowns~~~^RT~Thorncall~warn~1260565~Spiritfont~3 wasted~~Spend Spiritfont before the next one comes, because a new one replaces the one you hold. Your first wasted one was at 1:09.~gggbgggbgbgggggggg~You got 20 procs. One ran out unused. 2 were replaced by a new one before you used it.~Spend Spiritfont on Enveloping Mist before a third one would overflow. Thunder Focus Tea gives you one too, so at 2, spend one before you press it.~1:09: wasted;1:27: wasted;1:37: wasted^RT~Thorncall~ok~322118~Celestial windows~2/2 · 78% casting~100%~~~2 of your 2 Yu'lon windows were done right. Inside them you did 573.1K HPS, against 389.0K the rest of the pull. You were casting for 78% of them.~In Yu'lon, cast Enveloping Mist on several players (3 or 4) to spread Renewing Mists, press Rushing Wind Kick whenever it is back to extend them, and fill with Vivify, weaving in an Enveloping Mist every couple of casts. With Chi-Ji…~^RW~Thorncall~ok~0:16–0:41~25 seconds~535.8K HPS · rest of the pull 389.0K~1:7 Enveloping Mists;1:Kept casting;1:Renewing Mist just before;1:Secret Infusion up;1:Rushing Wind Kick just before;1:Potion~124682;119611;467307;116670;124682;124682;124682;124682;467307;116670;116680;119611~~Mana at the start: 83% · Casting 83% of it^RW~Thorncall~ok~2:17–2:42~25 seconds~610.2K HPS · rest of the pull 389.0K~1:6 Enveloping Mists;1:Kept casting;1:Renewing Mist just before;1:Secret Infusion up;1:Rushing Wind Kick just before;1:Into heavy damage~124682;124682;124682;124682;467307;119611;116670;124682;124682;116670;467307;116670~~Mana at the start: 80% · Casting 72% of it^B~Thorncall~warn~1283290~Noxious Ground: Stood in Noxious Ground for 20 s (2.1M), more than 9 in 10 raiders in the fastest kills by then.^K~0~B~Thorncall~dead~1286918~You died at 3:56 to Eternal Nightfall. The pull was already lost.^B~Thorncall~ok~ability_rogue_sprint~Avoidable damage taken: 199k, 14th most in the raid.^B~Thorncall~ok~spell_holy_dispelmagic~Dispels: 1.^U~Thorncall~ok~115203~Defensives: Fortifying Brew 1 of 1.^HP~Thorncall~ok~6262~Healthstone at 2:31. No potion.^N~Thorncall~After Thunder Focus Tea, press Renewing Mist next.^T~Thorncall~Avoidable damage~199k~14th most of 20~ok^T~Thorncall~Dispels~1~raid: 9~ok^O~Thorncall~Save Celestial Conduit for the damage.^K~1~E~Thorncall~Focus next pull: After Thunder Focus Tea, press Renewing Mist next.^K~0~E~Thorncall~You died at 3:56. Focus next pull: After Thunder Focus Tea, press Renewing Mist next.^P~Vexmira~PALADIN~Holy Paladin~healer~HPS~427k~-1~32~430k~32~2nd of 4 healers~spell_holy_holybolt~^RS~Vexmira~74~Weapon oil or rite on;Rotation priority;Holy Shock;Infusion of Light^RT~Vexmira~warn~spell_holy_borrowedtime~Always be casting~73%~87%~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.~~You were casting for 73% of the time you were alive.~This is the share of your time alive that you spent casting or on a global cooldown. A healer can't always be pressing, so the scale is gentle.~^RT~Vexmira~warn~31821~Cooldowns on big damage~0/1~~Save your healing cooldowns for the boss's big hits. Learn when they come and press yours as they land.~~Your healing cooldown didn't go out in the heaviest damage of the pull.~Your healing cooldowns are worth the most when the raid takes the most damage, so one sent into a quiet moment is one you don't have when it hurts.~^RW~Vexmira~warn~0:25–0:31~1.6 times the usual damage~Mostly Venom Rupture and Coalesced Venom~0:None of your cooldowns~~~^RW~Vexmira~warn~1:32–1:38~1.5 times the usual damage~Mostly Noxious Ground and Coalesced Venom~0:None of your cooldowns~~~^RW~Vexmira~warn~1:43–1:56~2.0 times the usual damage~Mostly Venom Rupture and Coalesced Venom~0:None of your cooldowns~~~^RW~Vexmira~warn~2:18–2:37~2.5 times the usual damage~Mostly Venom Rupture and Dreadful Presence~0:None of your cooldowns~~~^RT~Vexmira~warn~156322~Eternal Flame over Light of Dawn~59%~90%~Spend Holy Power on Eternal Flame, and save Light of Dawn for when Eternal Flame would mostly overheal.~wwgggwwgggwwwggggggwwgwgwggwwgggwwwwwwgg~You cast 27 Eternal Flames and 32 Light of Dawns. 8 of those Light of Dawns were the right call, because nobody was hurt enough for an Eternal Flame. The other 24 could have been Eternal Flames, 14 during Beacon of Virtue, where Light of Dawn passes only half as much to your Beacons.~Eternal Flame is your best Holy Power spender. Light of Dawn is only for when an Eternal Flame would overheal a lot.~0:03: Light of Dawn, during Beacon of Virtue.;0:04: Light of Dawn, during Beacon of Virtue.;0:19: Light of Dawn, during Beacon of Virtue.;0:25: Light of Dawn.;0:38: Light of Dawn, during Beacon of Virtue.^RT~Vexmira~ok~200025~Beacon of Virtue windows~97%~95%~~~You spent 97% of each window casting, and the raid took 1.0 times its usual damage during them. They healed 25.18M through your Beacons, about 1.80M each, 25% of your healing.~Each box is one Beacon of Virtue window. Hover it for what it healed, whether Divine Toll went in, how much of it you spent casting, and every spell you cast in it.~^RW~Vexmira~ok~0:01–0:10~Perfect~488.7K HPS · rest of the pull 270.0K, and 1.23M healed through your Beacons~1:Divine Toll with it;1:Potion~31884;375576;415388;415388;415388;415388;415388;415388;85222;85222;19750;19750~~Mana at the start: 96% · Casting 83% of it^RW~Vexmira~ok~0:16–0:25~Good~345.1K HPS · rest of the pull 270.0K, and 736.5K healed through your Beacons~1:Potion~19750;156322;85222;19750;20473;415388;415388;19750;19750~~Mana at the start: 91% · Casting 74% of it^RW~Vexmira~ok~0:31–0:40~Perfect~583.4K HPS · rest of the pull 270.0K, and 1.78M healed through your Beacons~1:Divine Toll with it~375576;415388;415388;415388;415388;415388;415388;156322;156322;20473;415388;415388~~Mana at the start: 92% · Casting 82% of it^RW~Vexmira~ok~0:46–0:55~Good~482.1K HPS · rest of the pull 270.0K, and 1.78M healed through your Beacons~~82326;19750;19750;156322;156322;20473;415388;415388~~Mana at the start: 87% · Casting 73% of it^RT~Vexmira~bad~31821~Aura Mastery inside Beacon of Virtue~1/2~~~~1 of your 2 Aura Masteries went out while Beacon of Virtue was up.~In raid, never press Aura Mastery without Beacon of Virtue up. Press Beacon of Virtue first, then Aura Mastery, so everything that comes with it heals five players.~^RT~Vexmira~bad~375576~Divine Toll inside Beacon of Virtue~1/3~~Press Divine Toll inside Beacon of Virtue, on 1 or 2 Holy Power. Its Holy Shocks then heal everyone with a Beacon too.~www~1 of your 3 Divine Tolls went out inside Beacon of Virtue.~In raid, the guides press Divine Toll while Beacon of Virtue is running. Its 5 Holy Shocks then heal everyone with a Beacon through it too.~0:05: during Beacon of Virtue, nothing wasted;0:37: outside Beacon of Virtue, nothing wasted;1:11: outside Beacon of Virtue, nothing wasted^RT~Vexmira~bad~31884~Casting in Avenging Wrath~59%~~Keep casting all the way through Avenging Wrath.~~You were casting for 59% of your Avenging Wrath window.~Every second of Avenging Wrath with nothing cast is healing you never get back. Keep pressing all the way through it.~^RT~Vexmira~warn~200025~Beacon of Virtue~67%~~Press Beacon of Virtue as the damage goes out, close to every 15 seconds. From 0:19, it sat ready for 8 seconds.~~You cast it 4 times out of a possible 6. It sat ready for 19 seconds. That cost about 1.62M healing, 11% of yours.~Use Beacon of Virtue close to on cooldown (every 15 seconds), as the damage goes out. It costs a lot of mana, so the guides keep it for when healing is needed.~^B~Vexmira~warn~1283290~Noxious Ground: Stood in Noxious Ground for 19 s (2.3M), more than 9 in 10 raiders in the fastest kills by then.^B~Vexmira~warn~1310498~Mutagenic Venom: Stood within 6 yards of a purple orb carrier (Ironvow, Korrith): hit once for 148,902.^B~Vexmira~warn~1282288~Volatile Venom (near a green carrier): Hit by Volatile Venom 2 times (205k), more than 9 in 10 raiders in the fastest kills by then.^B~Vexmira~ok~ability_rogue_sprint~Avoidable damage taken: 705k, 4th most in the raid.^U~Vexmira~ok~642~Defensives: Divine Shield 0 of 1, Divine Protection 3 of 4, Lay on Hands 1 of 1.^HP~Vexmira~ok~6262~Healthstone at 1:48, potion at 3:40.^N~Vexmira~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.^T~Vexmira~Avoidable damage~705k~4th most of 20~ok^T~Vexmira~Dispels~0~raid: 9~ok^O~Vexmira~Save your healing cooldowns for the boss's big hits. Learn when they come and press yours as they land.^E~Vexmira~Focus next pull: Press something every global cooldown. When you have to move, use an instant spell instead of stopping.^P~Brannoc~EVOKER~Preservation Evoker~healer~HPS~496k~8~32~458k~32~1st of 4 healers~classicon_evoker_preservation~1^RS~Brannoc~87~Blessing of the Bronze at the pull;Always be casting;Rotation priority;Temporal Anomaly on cooldown^RT~Brannoc~bad~370537~Stasis uses~0/3~100%~Press Stasis as soon as it comes back. From the start of the pull, it sat ready for 237 seconds.~~You never pressed it, out of a possible 3. It sat ready for 4 minutes in all.~Keep Stasis on cooldown, with both Dream Breath charges ready when it comes back. The top players use 3 or 4 of every 4, so 75% or more is good.~^RT~Brannoc~warn~369299~Essence Burst~5 wasted~6 wasted~Spend Essence Burst before the next one comes. You can hold 2. Your first wasted one was at 0:28.~ggggggggggbggbggggggggggbbgggggggggggggg~You had 61 Essence Bursts, and spent 36 on Emerald Blossom and 18 on Echo. 5 were lost to a new one while you were full (2 stacks).~Essence Burst makes your next Emerald Blossom or Echo free. Never let one run out or arrive while you're full (Essence Attunement holds 2).~0:28: a new one came while you were full, so it was lost;0:38: a new one came while you were full, so it was lost;1:30: a new one came while you were full, so it was lost;1:32: a new one came while you were full, so it was lost;3:45: a new one came while you were full, so it was lost^RT~Brannoc~bad~355936~Ramps started with Dream Breath~7/19~~Start each ramp with Dream Breath, right after your last payoff.~~7 of your 19 ramps had a Dream Breath in them.~Plan each ramp around Dream Breath, because it guarantees Merithra's Blessing. Cast Dream Breath after spending your Echoes, so it starts the next ramp.~^RT~Brannoc~bad~357208~Fire Breath before Inner Flame~1/3~~Cast a max rank Fire Breath just before you press Stasis.~~1 of your 3 Inner Flame windows had a Fire Breath in the 15 seconds before.~Cast a max rank Fire Breath before Stasis, so Leaping Flames gives you Essence Bursts when your procs run dry inside Inner Flame. The times listed are the windows without one.~^RT~Brannoc~warn~1256579~Ramps spent on Merithra's Blessing~14/19~~Spend your Echoes on Merithra's Blessing. Cast Dream Breath first, so you are sure to have it.~~14 of your 19 ramps were spent on Merithra's Blessing.~In raid, almost every ramp is spent on Merithra's Blessing (Reversion in a pinch). 80% or more is good.~^RT~Brannoc~ok~1242747~Emerald Blossoms in Inner Flame~3.3~3.5~~wwg~You cast 3.3 Emerald Blossoms in each Inner Flame window, on average. You healed 26.79M in its windows, or 661.5K a second, against 467.2K a second outside them.~Inner Flame, from Stasis, makes your HoTs heal 50% more for 15 seconds and doubles your chance of Essence Bursts. Spend it on as many Emerald Blossoms as you can (Consume Flame makes them heal even more)…~0:00: 4 Emerald Blossoms in it;1:29: 4 Emerald Blossoms in it^RW~Brannoc~ok~0:00–0:10~4 Emerald Blossoms~376.3K HPS · rest of the pull 467.2K~0:Fire Breath before;0:1 proc wasted~355913;1265991;361500;355913;1265991;358267;364343;1265991;364343;1291894;370553;357208~~Mana at the start: 85% · Casting 86% of it^RW~Brannoc~ok~1:29–1:44~4 Emerald Blossoms~780.0K HPS · rest of the pull 467.2K~1:Fire Breath before;0:2 procs wasted~355936;355936;373862;363916;355913;1265991;355913;1265991;364343;1256579;355913;1265991~~Mana at the start: 84% · Casting 84% of it^RW~Brannoc~warn~3:34–3:49~2 Emerald Blossoms~743.1K HPS · rest of the pull 467.2K~0:Fire Breath before;0:1 proc wasted~355936;355936;355913;373862;1265991;361195;361195;355913;1265991;364343;1265991;1256579~~Mana at the start: 69% · Casting 64% of it^B~Brannoc~warn~1282288~Volatile Venom (near a green carrier): Hit by Volatile Venom 4 times (390k), more than 9 in 10 raiders in the fastest kills by then.^K~0~B~Brannoc~dead~1286918~You died at 3:56 to Eternal Nightfall. The pull was already lost.^B~Brannoc~ok~spell_holy_dispelmagic~Dispels: 5.^U~Brannoc~ok~363916~Defensives: Obsidian Scales 2 of 3.^HP~Brannoc~info~inv_stone_04~No Healthstone or potion used.^N~Brannoc~Press Stasis as soon as it comes back. From the start of the pull, it sat ready for 237 seconds.^T~Brannoc~Avoidable damage~0~Nice dodging~ok^T~Brannoc~Dispels~5~raid: 9~ok^O~Brannoc~Spend Essence Burst before the next one comes. You can hold 2. Your first wasted one was at 0:28.^K~1~E~Brannoc~Focus next pull: Press Stasis as soon as it comes back. From the start of the pull, it sat ready for 237 seconds.^K~0~E~Brannoc~You died at 3:56. Focus next pull: Press Stasis as soon as it comes back. From the start of the pull, it sat ready for 237 seconds.^P~Sylvaris~EVOKER~Preservation Evoker~healer~HPS~406k~12~32~364k~32~4th of 4 healers~classicon_evoker_preservation~1^RS~Sylvaris~72~Blessing of the Bronze at the pull;Always be casting;Dream Breath on cooldown;Tip the Scales uses^RT~Sylvaris~warn~373862~Temporal Anomaly on cooldown~63%~80%~Cast Temporal Anomaly as soon as it comes back. From the start of the pull, it sat ready for 26 seconds.~~You cast it 10 times out of a possible 16. It sat ready for 89 seconds. Its shields absorbed 5.11M in all, 365.1K a cast.~Cast Temporal Anomaly the moment it comes off cooldown. It puts Echoes on several allies and shields them.~^RT~Sylvaris~bad~classicon_evoker_preservation~Essence at full~27%~11%~Spend Essence before you're full, on Echo or Emerald Blossom, so it keeps coming back.~~You sat at full Essence for about 57 seconds, about 14 Essence that never came, against 38 you spent.~Essence keeps coming back on its own, but not while you're full, so time at full is Echoes lost. The log only shows your Essence when you cast, so Debrief works out the rest from your own refill pace.~^RT~Sylvaris~bad~classicon_evoker_preservation~Rotation priority~68%~88%~Cast Temporal Anomaly the moment it comes back. It puts out Echoes and shields.~~~Healing is reactive, so a slip is a moment to look at, not always a mistake. Debrief goes through your casts one at a time.~^RT~Sylvaris~bad~370537~Stasis uses~0/3~100%~Press Stasis as soon as it comes back. From the start of the pull, it sat ready for 237 seconds.~~You never pressed it, out of a possible 3. It sat ready for 4 minutes in all.~Keep Stasis on cooldown, with both Dream Breath charges ready when it comes back. The top players use 3 or 4 of every 4, so 75% or more is good.~^RT~Sylvaris~warn~369299~Essence Burst~4 wasted~6 wasted~Spend Essence Burst before the next one comes. You can hold 2. Your first wasted one was at 0:05.~bgggggggbggggggggggggggggggggbggggggggbg~You had 53 Essence Bursts, and spent 36 on Emerald Blossom, 12 on Echo and 1 on Disintegrate. 4 were lost to a new one while you were full (2 stacks).~Essence Burst makes your next Emerald Blossom or Echo free. Never let one run out or arrive while you're full (Essence Attunement holds 2).~0:05: a new one came while you were full, so it was lost;0:27: a new one came while you were full, so it was lost;2:20: a new one came while you were full, so it was lost;2:43: a new one came while you were full, so it was lost;3:44: spent on Disintegrate^RT~Sylvaris~warn~31821~Cooldowns on big damage~0/1~~Save your healing cooldowns for the boss's big hits. Learn when they come and press yours as they land.~~Your healing cooldown didn't go out in the heaviest damage of the pull.~Your healing cooldowns are worth the most when the raid takes the most damage, so one sent into a quiet moment is one you don't have when it hurts.~^RW~Sylvaris~warn~0:25–0:35~1.6 times the usual damage~Mostly Venom Rupture and Coalesced Venom~0:None of your cooldowns~~~^RW~Sylvaris~warn~1:31–1:38~1.5 times the usual damage~Mostly Noxious Ground and Coalesced Venom~0:None of your cooldowns~~~^RW~Sylvaris~warn~1:42–1:57~2.0 times the usual damage~Mostly Venom Rupture and Coalesced Venom~0:None of your cooldowns~~~^RW~Sylvaris~warn~2:11–2:37~2.5 times the usual damage~Mostly Venom Rupture and Coalesced Venom~0:None of your cooldowns~~~^RT~Sylvaris~warn~1256579~Ramps spent on Merithra's Blessing~13/20~~Spend your Echoes on Merithra's Blessing. Cast Dream Breath first, so you are sure to have it.~~13 of your 20 ramps were spent on Merithra's Blessing.~In raid, almost every ramp is spent on Merithra's Blessing (Reversion in a pinch). 80% or more is good.~^RT~Sylvaris~warn~355936~Dream Breath that used up Echoes~3~2~Cast Dream Breath just after your Echoes are spent, not while they're out.~~3 of your 10 Dream Breaths used up Echoes.~Dream Breath uses up any Echoes you have out, but Merithra's Blessing does far more with them. Cast Dream Breath just after you've spent your Echoes.~^RT~Sylvaris~warn~1242747~Emerald Blossoms in Inner Flame~2.3~3.5~Fit more Emerald Blossoms into each Inner Flame. Save your Essence Bursts for it.~ggg~You cast 2.3 Emerald Blossoms in each Inner Flame window, on average. You healed 21.53M in its windows, or 478.4K a second, against 393.2K a second outside them.~Inner Flame, from Stasis, makes your HoTs heal 50% more for 15 seconds and doubles your chance of Essence Bursts. Spend it on as many Emerald Blossoms as you can (Consume Flame makes them heal even more)…~^RW~Sylvaris~ok~0:04–0:19~3 Emerald Blossoms~298.2K HPS · rest of the pull 393.2K~1:Fire Breath before;1:Potion;0:1 proc wasted~355936;355936;373862;355913;1265991;355913;1265991;364343;1265991;364343;1265991;1291894~~Mana at the start: 100% · Casting 81% of it^RW~Sylvaris~warn~1:45–2:00~2 Emerald Blossoms~704.0K HPS · rest of the pull 393.2K~1:Fire Breath before~355936;1256579;373862;355913;1265991;355913;1265991;364343;1265991;364343;1256579;355936~~Mana at the start: 84% · Casting 77% of it^RW~Sylvaris~warn~3:39–3:54~2 Emerald Blossoms~433.2K HPS · rest of the pull 393.2K~0:Fire Breath before~355936;355936;357214;1265991;356995;358267;1256579;355913;1265991;355913;1265991~~Mana at the start: 85% · Casting 62% of it^B~Sylvaris~warn~1283290~Noxious Ground: Stood in Noxious Ground for 18 s (1.7M), more than 9 in 10 raiders in the fastest kills by then.^K~0~B~Sylvaris~dead~1286918~You died at 3:56 to Eternal Nightfall. The pull was already lost.^B~Sylvaris~ok~ability_rogue_sprint~Avoidable damage taken: 283k, 13th most in the raid.^B~Sylvaris~ok~spell_holy_dispelmagic~Dispels: 1.^U~Sylvaris~ok~363916~Defensives: Obsidian Scales 1 of 3.^HP~Sylvaris~info~inv_stone_04~No Healthstone or potion used.^N~Sylvaris~Cast Temporal Anomaly as soon as it comes back. From the start of the pull, it sat ready for 26 seconds.^T~Sylvaris~Avoidable damage~283k~13th most of 20~ok^T~Sylvaris~Dispels~1~raid: 9~ok^O~Sylvaris~Spend Essence before you're full, on Echo or Emerald Blossom, so it keeps coming back.^K~1~E~Sylvaris~Focus next pull: Spend Essence before you're full, on Echo or Emerald Blossom, so it keeps coming back.^K~0~E~Sylvaris~You died at 3:56. Focus next pull: Spend Essence before you're full, on Echo or Emerald Blossom, so it keeps coming back.^P~Korrith~WARLOCK~Affliction Warlock~dps~DPS~177k~-11~32~198k~32~5th of 14 DPS~spell_shadow_deathcoil~^RS~Korrith~84~Weapon oil on;Opener, step by step;Always be casting;Rotation priority^RT~Korrith~bad~205180~Summon Darkglare windows~2/2 · 65% casting~75%~Keep casting all the way through Summon Darkglare. Use instant spells or your movement spells if you must move.~~2 of your 2 Summon Darkglare windows were done right. Inside them you did 286.9K DPS, against 149.0K the rest of the pull. You were casting for 65% of them.~Summon Darkglare is your main cooldown, every 2 minutes: 20% more damage from your damage over time. Have Agony and Wither up (Agony refreshed in pandemic so it lasts), Malevolence and Dark Harvest with it…~^RW~Korrith~ok~0:06–0:31~25 seconds~352.5K DPS · rest of the pull 149.0K~1:Malevolence;1:Dark Harvest;1:7 Unstable Afflictions;1:Kept casting;1:Potion;1:Damage over time up~1259790;1259790;1259790;1259790;1261153;111400;980;1259790;48181;1261153;1261153;1259790~~Casting 69% of it^RW~Korrith~ok~2:07–2:32~25 seconds~221.3K DPS · rest of the pull 149.0K~1:Malevolence;1:Dark Harvest;1:6 Unstable Afflictions;1:Kept casting;1:Damage over time up~686;1307470;442726;1259790;1259790;1259790;1261153;1261153;980;1259790;1259790;1259790~~Soul Shards at the start: 1/5 · Casting 61% of it^RT~Korrith~warn~48181~Haunt on cooldown~11/16~81%~Press Haunt as soon as it comes back. From 3:28, it sat ready for 18 seconds.~~You pressed it 11 times out of a possible 16. It sat ready, unused, for 61 seconds in all. It did 2.12M damage in all, 193.0K per cast.~Haunt on cooldown. 80% or more is good.~^K~0~B~Korrith~dead~1286918~You died at 3:56 to Eternal Nightfall. The pull was already lost.^B~Korrith~ok~ability_rogue_sprint~Avoidable damage taken: 353k, 11th most in the raid.^U~Korrith~ok~104773~Defensives: Unending Resolve 1 of 2, Dark Pact 4 of 4, Mortal Coil 2 of 6.^HP~Korrith~ok~452930~Healthstone at 0:52, 1:54 and 3:34, potion at 3:38.^N~Korrith~Keep casting all the way through Summon Darkglare. Use instant spells or your movement spells if you must move.^T~Korrith~Avoidable damage~353k~11th most of 20~ok^T~Korrith~Interrupts~0~raid: 9~ok^O~Korrith~Press Haunt as soon as it comes back. From 3:28, it sat ready for 18 seconds.^K~1~E~Korrith~Focus next pull: Keep casting all the way through Summon Darkglare.^K~0~E~Korrith~You died at 3:56. Focus next pull: Keep casting all the way through Summon Darkglare.^P~Elowen~MAGE~Arcane Mage~dps~DPS~154k~-22~32~198k~32~11th of 14 DPS~spell_holy_magicalsentry~^RS~Elowen~89~Arcane Intellect at the pull;Opener, step by step;Always be casting;Rotation priority^RT~Elowen~bad~spell_holy_magicalsentry~Cancelled casts~9~~Finish the casts you start. When you have to move, switch to an instant spell before you start a cast, not halfway through it.~~9 of the 41 casts you started with a cast bar did not finish, about 14 seconds lost. Mostly Prismatic Bolt (9).~A cast you start and then stop, by moving or pressing something else, is time spent with nothing to show for it. Plan your movement and switch to an instant spell before you move.~^RT~Elowen~warn~321507~Touch of the Magi on cooldown~5/6~92%~Press Touch of the Magi a little sooner each time it comes back.~~You pressed it 5 times out of a possible 6. It sat ready, unused, for 20 seconds in all. It did 2.06M damage in all, 412.5K per cast.~Touch of the Magi is a 45-second cooldown; don't sit on it more than a few seconds. Delaying it delays your next Arcane Surge too.~^RT~Elowen~warn~1295924~Prismatic Bolt!~9 wasted~6 wasted~Spend Prismatic Bolt before the next one comes, because a new one replaces the one you hold. Your first wasted one was at 0:50.~ggbgbbgggbbgggggggbbbbg~You got 23 procs. 9 were replaced by a new one before you used it.~Prismatic Bolt, your apex talent, comes from spending Arcane Salvo and does not stack, so cast it quickly. A proc is wasted when it runs out, or when a new one comes before you use the one you have.~0:50: wasted;1:31: wasted;1:38: wasted;2:05: wasted;2:06: wasted^RT~Elowen~ok~365362~Arcane Surge windows~3/3 · 73% casting~100%~~~3 of your 3 Arcane Surge windows were done right. Inside them you did 225.9K DPS, against 134.8K the rest of the pull. You were casting for 73% of them.~Arcane Surge is your burst, every 90 seconds: 35% more spell damage and a flood of mana. Touch of the Magi with it, while your Barrage is in the air.~^RW~Elowen~ok~0:00–0:17~17 seconds~170.1K DPS · rest of the pull 134.8K~1:Touch of the Magi;1:Kept casting;1:Potion~5143;44425;321507;5143;44425;30451;5143;235450;212653;44425;235450;1295924~~Casting 70% of it^RW~Elowen~ok~1:44–2:01~17 seconds~269.6K DPS · rest of the pull 134.8K~1:Touch of the Magi;1:Kept casting;0:1 proc wasted~44425;321507;5143;235450;44425;5143;5143;44425;5143;44425;1295924;5143~~Casting 80% of it^RW~Elowen~ok~3:19–3:36~17 seconds~238.1K DPS · rest of the pull 134.8K~1:Touch of the Magi;1:Kept casting;0:1 proc wasted~44425;321507;5143;44425;5143;44425;5143;1295924;44425;5143;235450;44425~~Casting 71% of it^K~0~B~Elowen~dead~1286918~You died at 3:56 to Eternal Nightfall. The pull was already lost.^B~Elowen~ok~ability_rogue_sprint~Avoidable damage taken: 571k, 6th most in the raid.^U~Elowen~ok~45438~Defensives: Ice Block 0 of 1, Alter Time 4 of 4, Greater Invisibility 2 of 2.^HP~Elowen~ok~1295247~Health potion at 2:58. No Healthstone.^N~Elowen~Finish the casts you start. When you have to move, switch to an instant spell before you start a cast, not halfway through it.^T~Elowen~Avoidable damage~571k~6th most of 20~ok^T~Elowen~Interrupts~0~raid: 9~ok^O~Elowen~Press Touch of the Magi a little sooner each time it comes back.^K~1~E~Elowen~Focus next pull: Finish the casts you start. When you have to move, switch to an instant spell before you start a cast, not halfway through it.^K~0~E~Elowen~You died at 3:56. Focus next pull: Finish the casts you start. When you have to move, switch to an instant spell before you start a cast, not halfway through it.^P~Dravik~DEMONHUNTER~Havoc Demon Hunter~dps~DPS~141k~-17~32~169k~32~14th of 14 DPS~ability_demonhunter_specdps~^RS~Dravik~96~Weapon oil on;Always be casting;Rotation priority;Eye Beam on cooldown^RT~Dravik~warn~ability_demonhunter_specdps~Opener, step by step~3/5~~Follow the guide opener: The Hunt, then Reaver's Glaive, then Eye Beam, then Essence Break, then Death Sweep.~~You followed 3 of the 5 steps of the Aldrachi Reaver opener, in order. Missed: step 4, Essence Break (out of order) and step 5, Death Sweep (out of order).~Both guides' opener, built around Chaotic Transformation: Immolation Aura just before the pull, then (Aldrachi Reaver) The Hunt, Reaver's Glaive, Eye Beam, Essence Break and Death Sweeps…~^RT~Dravik~ok~162264~Metamorphosis windows~2/2 · 76% casting~100%~~~2 of your 2 Metamorphosis windows were done right. Inside them you did 173.6K DPS, against 134.3K the rest of the pull. You were casting for 76% of them.~Metamorphosis turns Chaos Strike into Annihilation and Blade Dance into Death Sweep, and with Chaotic Transformation it resets Eye Beam and Blade Dance. Press it once Eye Beam and Death Sweep are both on cooldown…~^RW~Dravik~ok~0:12–0:52~40 seconds~208.2K DPS · rest of the pull 134.3K~1:25 Annihilations and Death Sweeps;1:Kept casting~444686;198013;201427;210152;210152;201427;201427;201427;213243;258922;444686;201427~~Fury at the start: 120/120 · Casting 79% of it^RW~Dravik~ok~3:48–3:56~8 seconds~0 DPS · rest of the pull 134.3K~1:4 Annihilations and Death Sweeps;1:Kept casting~358733;198013;201427;210152;444686;210152;201427~~Fury at the start: 110/120 · Casting 61% of it^K~0~B~Dravik~dead~1286918~You died at 3:56 to Eternal Nightfall. The pull was already lost.^B~Dravik~ok~ability_rogue_sprint~Avoidable damage taken: 399k, 9th most in the raid.^B~Dravik~ok~ability_kick~Interrupts: 1.^B~Dravik~ok~spell_holy_dispelmagic~Dispels: 1.^U~Dravik~ok~198589~Defensives: Blur 0 of 4, Darkness 1 of 1.^HP~Dravik~info~inv_stone_04~No Healthstone or potion used.^N~Dravik~Follow the guide opener: The Hunt, then Reaver's Glaive, then Eye Beam, then Essence Break, then Death Sweep.^T~Dravik~Avoidable damage~399k~9th most of 20~ok^T~Dravik~Interrupts~1~raid: 9~ok^K~1~E~Dravik~Focus next pull: The Hunt, then Reaver's Glaive, then Eye Beam, then Essence Break, then Death Sweep.^K~0~E~Dravik~You died at 3:56. Focus next pull: The Hunt, then Reaver's Glaive, then Eye Beam, then Essence Break, then Death Sweep.^P~Maelis~MAGE~Frost Mage~dps~DPS~169k~0~32~169k~32~7th of 14 DPS~spell_frost_frostbolt02~^RS~Maelis~88~Arcane Intellect at the pull;Always be casting;Rotation priority;Frozen Orb on cooldown^RT~Maelis~warn~spell_frost_frostbolt02~Opener, step by step~3/4~~Follow the guide opener: Frostbolt, then Flurry, then Frozen Orb, then Ray of Frost.~~You followed 3 of the 4 steps of the Spellslinger opener, in order. Missed: step 4, Ray of Frost (out of order).~Both guides' openers: pre-cast your bolt at 2 seconds on the countdown so it lands on the pull. Frostfire: Ray of Frost, Flurry, Frozen Orb.~^RT~Maelis~warn~44544~Fingers of Frost~2 wasted~~Spend Fingers of Frost before the next one comes, because a new one replaces the one you hold. Your first wasted one was at 3:19.~ggggggggggggggggggggggggggggggbgggbggg~You got 38 procs. 2 were replaced by a new one before you used it.~Fingers of Frost makes Ice Lance Shatter as if the boss had the most Freezing. Spend it on Ice Lance before a third would be lost.~3:19: wasted;3:43: wasted^RT~Maelis~warn~spell_frost_frostbolt02~Cancelled casts~2~~Finish the casts you start. When you have to move, switch to an instant spell before you start a cast, not halfway through it.~~2 of the 26 casts you started with a cast bar did not finish, about 6 seconds lost. Mostly Glacial Spike (2).~A cast you start and then stop, by moving or pressing something else, is time spent with nothing to show for it. Plan your movement and switch to an instant spell before you move.~^K~0~B~Maelis~dead~1288635~You died at 3:55 to Dreadful Presence. The pull was already lost.^B~Maelis~ok~ability_rogue_sprint~Avoidable damage taken: 107k, 15th most in the raid.^U~Maelis~ok~45438~Defensives: Ice Block 0 of 1, Alter Time 2 of 4.^HP~Maelis~ok~6262~Healthstone at 3:47, potion at 2:33.^N~Maelis~Follow the guide opener: Frostbolt, then Flurry, then Frozen Orb, then Ray of Frost.^T~Maelis~Avoidable damage~107k~15th most of 20~ok^T~Maelis~Interrupts~0~raid: 9~ok^O~Maelis~Spend Fingers of Frost before the next one comes, because a new one replaces the one you hold. Your first wasted one was at 3:19.^K~1~E~Maelis~Focus next pull: Frostbolt, then Flurry, then Frozen Orb, then Ray of Frost.^K~0~E~Maelis~You died at 3:55. Focus next pull: Frostbolt, then Flurry, then Frozen Orb, then Ray of Frost.^P~Tarnwick~DRUID~Balance Druid~dps~DPS~172k~-7~32~185k~32~6th of 14 DPS~spell_nature_starfall~^RS~Tarnwick~88~Moonkin Form at the pull;Opener, step by step;Rotation priority;Fury of Elune on cooldown^RT~Tarnwick~bad~102560~Fury of Elune right before Incarnation~1/3~~Press Fury of Elune, then Incarnation on your very next global cooldown.~~1 of your 3 Incarnations came right after a Fury of Elune.~Use Incarnation with the global cooldown after Fury of Elune. Fury of Elune goes out before your big cooldown.~^RT~Tarnwick~warn~1233272~Time in Eclipse~62%~65%~Keep Eclipse up. Your longest gap was 27 seconds, from 3:14.~~You were in Eclipse 62% of the time you were alive.~You can keep Eclipse up, cooldowns included, 65% to 75% of the time. Never sit at 2 charges, and line it up with Fury of Elune or Force of Nature.~^RT~Tarnwick~warn~spell_holy_borrowedtime~Always be casting~78%~86%~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.~~You were casting for 78% of the time you were alive. Your longest stretch with nothing pressed was 6 seconds, at 2:46, while you were moving.~This is the share of your time alive that you spent casting or on a global cooldown. Starsurge and Starfall are instant, so build Astral Power while you can stand still and spend it while you move.~^RT~Tarnwick~warn~102560~Incarnation: Chosen of Elune uses~3/4~100%~Press Incarnation: Chosen of Elune a little sooner each time it comes back.~~You pressed it 3 times out of a possible 4. It sat ready, unused, for 11 seconds in all.~Press your big cooldown as often as the fight allows. 85% or more is good.~^RT~Tarnwick~ok~102560~Incarnation: Chosen of Elune windows~3/3 · 93% casting~100%~~~3 of your 3 Incarnation: Chosen of Elune windows were done right. Inside them you did 374.8K DPS, against 109.0K the rest of the pull. You were casting for 93% of them.~Your big cooldown puts you in both Eclipses. Fury of Elune (or Force of Nature for Keeper of the Grove) goes out right before it, your damage over time is fresh, and you go in with Astral Power to spend.~^RW~Tarnwick~ok~0:10–0:30~20 seconds~386.0K DPS · rest of the pull 109.0K~1:Kept casting;1:Fury of Elune before;1:Damage over time lasted;1:Potion~1271222;1271222;194153;1271222;1271222;191034;1271222;194153;194153;1271222;1271222;93402~~Astral Power at the start: 95/100 · Casting 96% of it^RW~Tarnwick~ok~0:56–1:16~20 seconds~342.4K DPS · rest of the pull 109.0K~1:Kept casting;0:Fury of Elune before;1:Damage over time lasted~1271222;1271222;194153;394111;1271222;194153;1271222;191034;1271222;194153;194153;1271222~~Astral Power at the start: 84/100 · Casting 94% of it^RW~Tarnwick~ok~2:54–3:14~20 seconds~396.0K DPS · rest of the pull 109.0K~1:Kept casting;0:Fury of Elune before;1:Damage over time lasted;0:1 proc wasted~1293316;191034;191034;194153;1271222;191034;194153;194153;191034;191034;394111;194153~~Astral Power at the start: 78/100 · Casting 91% of it^B~Tarnwick~bad~1286620~Soul Sever: Stood in Soul Sever (tank frontal) for 771,882 and picked up its 200% vulnerability.^B~Tarnwick~warn~1310498~Mutagenic Venom: Stood within 6 yards of a purple orb carrier (Ironvow, Korrith): hit once for 150,784.^B~Tarnwick~dead~1297906~You died at 3:49 to Gravebound. That one was on you.^B~Tarnwick~ok~ability_rogue_sprint~Avoidable damage taken: 433k, 8th most in the raid.^U~Tarnwick~ok~22812~Defensives: Barkskin 1 of 4, Frenzied Regeneration 3 of 7.^HP~Tarnwick~ok~6262~Healthstone at 3:45. No potion.^N~Tarnwick~Press Fury of Elune, then Incarnation on your very next global cooldown.^T~Tarnwick~Avoidable damage~433k~8th most of 20~ok^T~Tarnwick~Interrupts~0~raid: 9~ok^O~Tarnwick~Keep Eclipse up. Your longest gap was 27 seconds, from 3:14.^E~Tarnwick~You died at 3:49. Focus next pull: Only the tank belongs in front of the boss.^P~Quillara~DEATHKNIGHT~Unholy Death Knight~dps~DPS~147k~-27~32~201k~32~13th of 14 DPS~spell_deathknight_unholypresence~^RS~Quillara~92~Opener, step by step;Always be casting;Rotation priority;Virulent Plague uptime^RT~Quillara~warn~1233448~Dark Transformation uses~4/5~92%~Press Dark Transformation a little sooner each time it comes back.~~You pressed it 4 times out of a possible 5. It sat ready, unused, for 29 seconds in all.~Dark Transformation every 45 seconds. 85% or more is good.~^RT~Quillara~warn~42650~Army of the Dead uses~2/3~100%~Press Army of the Dead a little sooner each time it comes back.~~You pressed it twice out of a possible 3. It sat ready, unused, for 29 seconds in all.~Army of the Dead every 90 seconds, with Dark Transformation. 80% or more is good.~^RT~Quillara~warn~81340~Sudden Doom~4 wasted~3 wasted~Spend Sudden Doom before the next one comes, because a new one replaces the one you hold. Your first wasted one was at 0:53.~ggggggggggbggggggggggggggggggggbgggbgggg~You got 43 procs, and used 26 on Death Coil and 13 on Necrotic Coil. One ran out unused. 3 were replaced by a new one before you used it.~Sudden Doom is a powerful proc you do not want to waste. Spend it on Death Coil (Epidemic on more targets) right away.~0:53: wasted;2:31: wasted;2:54: wasted;3:27: wasted^RT~Quillara~ok~1233448~Dark Transformation windows~4/4 · 92% casting~~~~4 of your 4 Dark Transformation windows were done right. Inside them you did 269.5K DPS, against 98.4K the rest of the pull. You were casting for 92% of them.~Dark Transformation is your burst, every 45 seconds. Keep it lined up with Army of the Dead (Commander of the Dead), and use Putrefy as much as you can inside it.~^RW~Quillara~ok~0:04–0:27~23 seconds~263.7K DPS · rest of the pull 98.4K~1:Putrefy;1:Kept casting;1:Soul Reaper 8 s in;1:Blightfall at the end;1:Putrefy after Blightfall;2:Blightfall hit for 865.5K~1242174;1242174;1277016;1277016;1242174;433895;343294;1242174;433895;433895;1242174;433895~~Runic Power at the start: 83/100 · Casting 90% of it^RW~Quillara~ok~0:50–1:12~22 seconds~206.6K DPS · rest of the pull 98.4K~1:Putrefy;1:Kept casting;1:Soul Reaper 7 s in;1:Blightfall at the end;1:Putrefy after Blightfall;2:Blightfall hit for 333.6K~1277016;1277016;47541;47541;433895;47541;343294;433895;47541;85948;47541;433895~~Runic Power at the start: 72/100 · Casting 94% of it^RW~Quillara~ok~1:39–1:59~20 seconds~397.5K DPS · rest of the pull 98.4K~1:Putrefy;1:Kept casting;1:Soul Reaper 7 s in;1:Blightfall at the end;1:Putrefy after Blightfall;2:Blightfall hit for 1.43M~1277016;1242174;1242174;433895;1277016;433895;343294;48792;1242174;1242174;85948;1242174~~Runic Power at the start: 100/100 · Casting 94% of it^RW~Quillara~ok~2:33–2:52~19 seconds~214.5K DPS · rest of the pull 98.4K~1:Putrefy;1:Kept casting;1:Soul Reaper 7 s in;1:Blightfall at the end;1:Putrefy after Blightfall;2:Blightfall hit for 801.0K~1277016;47541;47541;433895;433895;47541;343294;1277016;47541;433895;433895;433895~~Runic Power at the start: 100/100 · Casting 92% of it^B~Quillara~bad~1310732~Malevolent Resonance: Your ghost touched another ghost (with Feyleth), causing Malevolent Resonance.^B~Quillara~dead~1312132~You died at 3:29 to Malevolent Resonance. That one was on you.^B~Quillara~ok~ability_rogue_sprint~Avoidable damage taken: 94k, 16th most in the raid.^U~Quillara~ok~48792~Defensives: Icebound Fortitude 1 of 2, Anti-Magic Shell 2 of 4, Lichborne 1 of 2.^HP~Quillara~info~inv_stone_04~No Healthstone or potion used.^N~Quillara~Press Dark Transformation a little sooner each time it comes back.^T~Quillara~Avoidable damage~94k~16th most of 20~ok^T~Quillara~Interrupts~0~raid: 9~ok^O~Quillara~Press Army of the Dead a little sooner each time it comes back.^E~Quillara~You died at 3:29. Focus next pull: Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.^P~Ostrand~DRUID~Balance Druid~dps~DPS~164k~-15~32~192k~32~9th of 14 DPS~spell_nature_starfall~^RS~Ostrand~73~Moonkin Form at the pull;Fury of Elune on cooldown;Touch the Cosmos;Moonfire uptime^RT~Ostrand~warn~102560~Incarnation: Chosen of Elune windows~2/3 · 92% casting~100%~~~2 of your 3 Incarnation: Chosen of Elune windows were done right. Inside them you did 316.3K DPS, against 115.1K the rest of the pull. You were casting for 92% of them.~Your big cooldown puts you in both Eclipses. Fury of Elune (or Force of Nature for Keeper of the Grove) goes out right before it, your damage over time is fresh, and you go in with Astral Power to spend.~^RW~Ostrand~ok~0:02–0:22~20 seconds~307.9K DPS · rest of the pull 115.1K~1:Kept casting;0:Fury of Elune before;1:Damage over time lasted;1:Potion~394111;194153;194153;1271222;1271222;1271222;194153;194153;1271222;194153;1271222;1271222~~Astral Power at the start: 30/100 · Casting 97% of it^RW~Ostrand~ok~0:23–0:43~20 seconds~374.5K DPS · rest of the pull 115.1K~1:Kept casting;0:Fury of Elune before;1:Damage over time lasted;1:Potion~1271222;394111;194153;194153;1271222;1271222;194153;194153;2782;1271222;1271222;1271222~~Astral Power at the start: 76/100 · Casting 96% of it^RW~Ostrand~warn~2:34–2:54~20 seconds~266.5K DPS · rest of the pull 115.1K~1:Kept casting;0:Fury of Elune before;0:Sunfire ran out in it~194153;194153;1271222;1271222;191034;194153;194153;1271222;1271222;29166;194153;394111~~Astral Power at the start: 50/100 · Casting 84% of it^RT~Ostrand~bad~102560~Fury of Elune right before Incarnation~0/3~~Press Fury of Elune, then Incarnation on your very next global cooldown.~~0 of your 3 Incarnations came right after a Fury of Elune.~Use Incarnation with the global cooldown after Fury of Elune. Fury of Elune goes out before your big cooldown.~^RT~Ostrand~warn~spell_nature_starfall~Rotation priority~70%~84%~Inside Eclipse, spend your Astral Power on Starsurge (Starfall on more targets) before you cast Starfire.~~~Debrief goes through your casts one at a time. At each one, it finds the highest spell on your priority list that was ready, with its condition met.~^RT~Ostrand~warn~1233272~Time in Eclipse~62%~65%~Keep Eclipse up. Your longest gap was 34 seconds, from 3:12.~~You were in Eclipse 62% of the time you were alive.~You can keep Eclipse up, cooldowns included, 65% to 75% of the time. Never sit at 2 charges, and line it up with Fury of Elune or Force of Nature.~^RT~Ostrand~warn~spell_nature_starfall~Opener, step by step~5/7~~Follow the guide opener: Wrath, then Moonfire and Sunfire, in any order, then Fury of Elune and Lunar Eclipse, in any order, then Incarnation: Chosen of Elune or Celestial Alignment, then Starsurge.~~You followed 5 of the 7 steps of the Elune's Chosen opener, in order. Missed: step 5, Fury of Elune or Lunar Eclipse (not in your opener) and step 6, Incarnation: Chosen of Elune or Celestial Alignment (out of order).~Both guides give an exact opener. Two Wraths from 4 seconds before the pull, then Moonfire and Sunfire, then Fury of Elune and Lunar Eclipse (the guides order these two differently, so either counts)…~^RT~Ostrand~warn~spell_holy_borrowedtime~Always be casting~80%~86%~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.~~You were casting for 80% of the time you were alive. Your longest stretch with nothing pressed was 6 seconds, at 2:24, while you were moving.~This is the share of your time alive that you spent casting or on a global cooldown. Starsurge and Starfall are instant, so build Astral Power while you can stand still and spend it while you move.~^RT~Ostrand~warn~102560~Incarnation: Chosen of Elune uses~3/4~100%~Press Incarnation: Chosen of Elune a little sooner each time it comes back.~~You pressed it 3 times out of a possible 4. It sat ready, unused, for 2 seconds in all.~Press your big cooldown as often as the fight allows. 85% or more is good.~^RT~Ostrand~warn~spell_nature_starfall~Cancelled casts~7~~Finish the casts you start. When you have to move, switch to an instant spell before you start a cast, not halfway through it.~~7 of the 76 casts you started with a cast bar did not finish, about 11 seconds lost. Mostly Starfire (7).~A cast you start and then stop, by moving or pressing something else, is time spent with nothing to show for it. Plan your movement and switch to an instant spell before you move.~^B~Ostrand~warn~1310498~Mutagenic Venom: Stood within 6 yards of a purple orb carrier (Ironvow, Korrith, Elowen): hit 2 times for 280,046.^K~0~B~Ostrand~dead~1288635~You died at 3:55 to Dreadful Presence. The pull was already lost.^B~Ostrand~ok~ability_rogue_sprint~Avoidable damage taken: 635k, 5th most in the raid.^U~Ostrand~ok~22812~Defensives: Barkskin 3 of 4, Frenzied Regeneration 1 of 7.^HP~Ostrand~ok~1295247~Health potion at 1:04. No Healthstone.^N~Ostrand~Press Fury of Elune, then Incarnation on your very next global cooldown.^T~Ostrand~Avoidable damage~635k~5th most of 20~ok^T~Ostrand~Interrupts~0~raid: 9~ok^O~Ostrand~Inside Eclipse, spend your Astral Power on Starsurge (Starfall on more targets) before you cast Starfire.^K~1~E~Ostrand~Focus next pull: Press Fury of Elune, then Incarnation on your very next global cooldown.^K~0~E~Ostrand~You died at 3:55. Focus next pull: Press Fury of Elune, then Incarnation on your very next global cooldown.^P~Feyleth~EVOKER~Augmentation Evoker~dps~DPS~206k~-23~32~266k~32~2nd of 14 DPS~classicon_evoker_augmentation~^RS~Feyleth~86~Blessing of the Bronze at the pull;Opener, step by step;Rotation priority;Upheaval on cooldown^RT~Feyleth~warn~403631~Breath of Eons windows~3/3 · 64% casting~~Keep casting all the way through Breath of Eons. Use instant spells or your movement spells if you must move.~~3 of your 3 Breath of Eons windows were done right. Inside them you did 406.8K DPS, against 191.2K the rest of the pull. You were casting for 64% of them.~Breath of Eons is your big cooldown, every 2 minutes. For 10 seconds after it lands it stores 15% of the damage your Ebon Might allies deal, then explodes for it, so each window here runs 13 seconds from the press.~^RW~Feyleth~ok~0:04–0:17~13 seconds~817.4K DPS · rest of the pull 191.2K~1:Tip the Scales with it;1:Ebon Might up;2:12 of 12 damage dealers in their big cooldown;1:Prescience on Quillara, Nyssa and Rhakar, all in their cooldown;2:Breath of Eons hit for 1.61M;1:Potion~375234;370553;357208;396286;358267;404977;357208;396286;1297908;409311~~Casting 60% of it^RW~Feyleth~ok~1:28–1:41~13 seconds~204.9K DPS · rest of the pull 191.2K~1:Ebon Might up;2:7 of 12 damage dealers in their big cooldown;1:Prescience on Quillara, Tarnwick, Rhakar and Thorncall, 2 in their cooldown;2:Breath of Eons hit for 888.9K;2:Bloodlust~358267;395160;395160;395160;395160;395160;396286;395160;361195;361195~~Casting 73% of it^RW~Feyleth~ok~3:00–3:13~13 seconds~198.0K DPS · rest of the pull 191.2K~1:Ebon Might up;2:8 of 12 damage dealers in their big cooldown;1:Prescience on Tarnwick and Halbrecht, all in their cooldown;2:Breath of Eons hit for 576.4K;2:Bloodlust~395160;409311;409311;395160;358267;395160;395160~~Casting 58% of it^RT~Feyleth~warn~395152~Ebon Might uptime~85%~93%~Keep Ebon Might up. Your longest gap was 14 seconds, from 2:16.~~Ebon Might was up 85% of the time you were alive.~Ebon Might is your most important buff. Keep it up as long as you can with your empowers and Eruption, and recast it with no more than 3 or 4 seconds left (it pandemics up to 30%).~^RT~Feyleth~warn~spell_holy_borrowedtime~Always be casting~69%~78%~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.~~You were casting for 69% of the time you were alive. Your longest stretch with nothing pressed was 7 seconds, at 3:11, while you were moving.~This is the share of your time alive that you spent casting or on a global cooldown. Use Hover to cast on the move, and fill gaps with Chrono Flame or Azure Strike.~^RT~Feyleth~warn~369299~Essence Burst~3 wasted~5 wasted~Spend Essence Burst before the next one comes, because a new one replaces the one you hold. Your first wasted one was at 1:50.~gggggggbggbbgggg~You got 16 procs. 3 were replaced by a new one before you used it.~Essence Burst stacks to 2. Spend it on Eruption before a third is lost.~1:50: wasted;2:30: wasted;2:35: wasted^B~Feyleth~bad~1310732~Malevolent Resonance: Your ghost touched another ghost (with Quillara), causing Malevolent Resonance.^B~Feyleth~dead~1312132~You died at 3:28 to Malevolent Resonance. That one was on you.^B~Feyleth~ok~ability_rogue_sprint~Avoidable damage taken: 380k, 10th most in the raid.^U~Feyleth~ok~363916~Defensives: Obsidian Scales 1 of 3.^HP~Feyleth~ok~6262~Healthstone at 1:52. No potion.^N~Feyleth~Keep casting all the way through Breath of Eons. Use instant spells or your movement spells if you must move.^T~Feyleth~Avoidable damage~380k~10th most of 20~ok^T~Feyleth~Interrupts~0~raid: 9~ok^O~Feyleth~Keep Ebon Might up. Your longest gap was 14 seconds, from 2:16.^E~Feyleth~You died at 3:28. Focus next pull: Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.^P~Grimvale~WARLOCK~Demonology Warlock~dps~DPS~155k~-12~32~176k~32~10th of 14 DPS~spell_shadow_metamorphosis~^RS~Grimvale~86~Always be casting;Rotation priority;Demonic Core;Ruination^RT~Grimvale~warn~105174~Hand of Gul'dans in each Tyrant~7.0~~Fit more Hand of Gul'dans into each Tyrant. Go in with Soul Shards and Demonic Cores ready, and spend 3 Soul Shards every time you have them.~gwww~You cast 7.0 Hand of Gul'dans in each Tyrant window, on average. You did 21.17M damage in them, 219.5K a second, against 113.9K a second outside them.~With Dominion of Argus your Tyrant window lasts 25 seconds, and every 2 Hand of Gul'dans you cast in it summon an extra demon, so the window is about fitting in as many Hand of Gul'dans as you can. Build 3 Soul Shards, spend them…~1:12: 7 Hand of Gul'dans in it;2:32: 7 Hand of Gul'dans in it;3:34: 6 Hand of Gul'dans in it^RW~Grimvale~ok~0:05–0:30~8 Hand of Gul'dans~318.2K DPS · rest of the pull 113.9K · 7.96M damage, 318.2K a second~1:Dreadstalkers;1:17 demons~~~^RW~Grimvale~warn~1:12–1:37~7 Hand of Gul'dans~211.4K DPS · rest of the pull 113.9K · 5.28M damage, 211.4K a second~1:Dreadstalkers;0:0 Demonic Cores;1:22 demons~~~^RW~Grimvale~warn~2:32–2:57~7 Hand of Gul'dans~238.6K DPS · rest of the pull 113.9K · 5.97M damage, 238.6K a second~1:Dreadstalkers;0:1 Demonic Core;1:20 demons~~~^RW~Grimvale~warn~3:34–3:55~6 Hand of Gul'dans~91.4K DPS · rest of the pull 113.9K · 1.95M damage, 91.4K a second~0:Dreadstalkers;1:2 Demonic Cores;1:19 demons~~~^RT~Grimvale~bad~264173~Demonic Cores held for Tyrant~1/3~~Save 2 Demonic Cores in the last seconds before each Tyrant, so it starts with instant Demonbolts.~~1 of your 3 Tyrants after the opener started with 2 or more Demonic Cores.~Go into each Tyrant with at least 2 Demonic Cores. Their instant Demonbolts give Soul Shards fast, for more Hand of Gul'dans inside it.~^RT~Grimvale~warn~104316~Dreadstalkers out for Tyrant~3/4~~Cast Call Dreadstalkers in the 12 seconds before you summon your Tyrant. The first Tyrant without them was at 3:34.~~3 of your 4 Tyrants had your Dreadstalkers out.~Cast Call Dreadstalkers in the 12 seconds before your Tyrant. They count toward its damage, Reign of Tyranny keeps them out longer, and your globals inside it stay free for Hand of Gul'dan.~^RT~Grimvale~warn~264178~Demonbolt without a Demonic Core~1~~Only cast Demonbolt with a Demonic Core. Without one, cast Shadow Bolt.~~1 of your 41 Demonbolts had no Demonic Core.~Without a Demonic Core, Demonbolt is a long cast for its damage. The guides only cast it with one.~^B~Grimvale~warn~1310498~Mutagenic Venom: Stood within 6 yards of a purple orb carrier (Ironvow, Korrith): hit once for 161,036.^K~0~B~Grimvale~dead~1288635~You died at 3:55 to Dreadful Presence. The pull was already lost.^U~Grimvale~ok~104773~Defensives: Unending Resolve 2 of 2, Dark Pact 4 of 4, Mortal Coil 1 of 6.^HP~Grimvale~ok~452930~Healthstone at 2:26 and 3:46. No potion.^N~Grimvale~Fit more Hand of Gul'dans into each Tyrant. Go in with Soul Shards and Demonic Cores ready, and spend 3 Soul Shards every time you have them.^T~Grimvale~Avoidable damage~0~Nice dodging~ok^T~Grimvale~Interrupts~0~raid: 9~ok^O~Grimvale~Save 2 Demonic Cores in the last seconds before each Tyrant, so it starts with instant Demonbolts.^K~1~E~Grimvale~Focus next pull: Save 2 Demonic Cores in the last seconds before each Tyrant, so it starts with instant Demonbolts.^K~0~E~Grimvale~You died at 3:55. Focus next pull: Save 2 Demonic Cores in the last seconds before each Tyrant, so it starts with instant Demonbolts.^P~Nyssa~WARRIOR~Arms Warrior~dps~DPS~168k~36~32~124k~32~8th of 14 DPS~ability_warrior_savageblow~1^RS~Nyssa~98~Battle Shout at the pull;Opener, step by step;Always be casting;Rotation priority^RT~Nyssa~warn~52437~Sudden Death~3 wasted~2 wasted~Spend Sudden Death before the next one comes, because a new one replaces the one you hold. Your first wasted one was at 1:43.~gggggggggggggggbggggggggggbgggggbggg~You got 36 procs. 3 were replaced by a new one before you used it.~Sudden Death makes your next Execute free and usable at any health. It stacks to 2, so it need not be spent at once, but do not let a third be lost.~1:43: wasted;3:19: wasted;3:49: wasted^RT~Nyssa~ok~167105~Colossus Smash windows~8/8 · 91% casting~100%~~~8 of your 8 Colossus Smash windows were done right. Inside them you did 235.4K DPS, against 132.7K the rest of the pull. You were casting for 91% of them.~Colossus Smash is Arms' main cooldown, every 45 seconds or sooner with Anger Management. Plan to fill every global cooldown inside it.~^RW~Nyssa~ok~0:02–0:13~11 seconds~342.3K DPS · rest of the pull 132.7K~1:Kept casting;1:Potion~446035;12294;12294;12294;281000;12294;7384;1269383;281000~~Casting 87% of it^RW~Nyssa~ok~0:33–0:44~11 seconds~262.6K DPS · rest of the pull 132.7K~1:Kept casting~446035;12294;12294;12294;12294;12294;1269383;281000;12294;7384;845~~Casting 96% of it^RW~Nyssa~ok~1:06–1:16~11 seconds~309.2K DPS · rest of the pull 132.7K~1:Kept casting~7384;446035;12294;12294;12294;12294;12294;1269383;281000;281000;12294~~Casting 95% of it^RW~Nyssa~ok~1:36–1:46~11 seconds~333.2K DPS · rest of the pull 132.7K~1:Kept casting;0:1 proc wasted~281000;446035;12294;12294;12294;12294;12294;1269383;281000;1297761;281000;12294~~Casting 95% of it^K~0~B~Nyssa~dead~1286918~You died at 3:56 to Eternal Nightfall. The pull was already lost.^B~Nyssa~ok~ability_rogue_sprint~Avoidable damage taken: 562k, 7th most in the raid.^U~Nyssa~ok~118038~Defensives: Die by the Sword 1 of 2, Rallying Cry 1 of 2.^HP~Nyssa~ok~6262~Healthstone at 2:32. No potion.^N~Nyssa~Spend Sudden Death before the next one comes, because a new one replaces the one you hold. Your first wasted one was at 1:43.^T~Nyssa~Avoidable damage~562k~7th most of 20~ok^T~Nyssa~Interrupts~0~raid: 9~ok^K~1~E~Nyssa~Focus next pull: Spend Sudden Death before the next one comes, because a new one replaces the one you hold.^K~0~E~Nyssa~You died at 3:56. Focus next pull: Spend Sudden Death before the next one comes, because a new one replaces the one you hold.^P~Halbrecht~HUNTER~Beast Mastery Hunter~dps~DPS~152k~-25~32~204k~32~12th of 14 DPS~ability_hunter_bestialdiscipline~^RS~Halbrecht~94~Always be casting;Rotation priority;Kill Command on cooldown;Focus wasted^RT~Halbrecht~warn~ability_hunter_bestialdiscipline~Opener, step by step~4/5~~Follow the guide opener: Barbed Shot, then Barbed Shot, then Bestial Wrath, then Kill Command, then Cobra Shot.~~You followed 4 of the 5 steps of the Pack Leader opener, in order. Missed: step 3, Bestial Wrath (out of order).~Hunter's Mark on the boss and Misdirection on the tank before the pull. On one boss: Barbed Shot twice, then Bestial Wrath (never first: your pet must be attacking the boss, or Bloodshed doesn't apply), Kill Command and Cobra Shot.~^RT~Halbrecht~ok~19574~Bestial Wrath windows~6/7 · 82% casting~100%~~~6 of your 7 Bestial Wrath windows were done right. Inside them you did 233.3K DPS, against 96.4K the rest of the pull. In 1 of them you cast slower than you do outside it.~Bestial Wrath is your only cooldown, every 30 seconds: 20% more damage for you and your pet, and most of your damage. Bank a second Kill Command charge as it comes back, then fit as many Kill Commands into it as you can…~^RW~Halbrecht~ok~0:01–0:16~15 seconds~278.8K DPS · rest of the pull 96.4K~1:5 Kill Commands;1:Kept casting;1:Potion~34026;246152;34026;1306960;186257;193455;34026;246152;34026;193455;193455;34026~~Focus at the start: 100/100 · Casting 92% of it^RW~Halbrecht~ok~0:31–0:47~15 seconds~208.1K DPS · rest of the pull 96.4K~1:3 Kill Commands;1:Kept casting~246152;1306960;34026;1306960;1306960;246152;193455;34026;193455;246152;193455;34026~~Focus at the start: 63/100 · Casting 92% of it^RW~Halbrecht~ok~1:01–1:16~15 seconds~278.9K DPS · rest of the pull 96.4K~1:4 Kill Commands;1:Kept casting~34026;246152;34026;1306960;246152;1306960;34026;193455;193455;34026;1306960;1306960~~Focus at the start: 99/100 · Casting 85% of it^RW~Halbrecht~warn~2:16–2:31~15 seconds~107.6K DPS · rest of the pull 96.4K~1:2 Kill Commands;0:Slower casting~34026;246152;34026;246152~~Focus at the start: 72/100 · Casting 41% of it^B~Halbrecht~dead~1299838~You died at 1:52 to Venom Rupture. You still had Aspect of the Turtle ready.^B~Halbrecht~warn~ability_rogue_sprint~Avoidable damage taken: 1.1m, 3rd most in the raid.^B~Halbrecht~ok~ability_kick~Interrupts: 1.^U~Halbrecht~ok~186265~Defensives: Aspect of the Turtle 1 of 1, Survival of the Fittest 2 of 2, Exhilaration 1 of 1.^HP~Halbrecht~ok~6262~Healthstone at 2:08, potion at 1:33.^HK~Halbrecht~bad~inv_stone_04~You died at 1:52 to Venom Rupture with your Healthstone unused, after 2 seconds low. If you're dropping, use it.^N~Halbrecht~Follow the guide opener: Barbed Shot, then Barbed Shot, then Bestial Wrath, then Kill Command, then Cobra Shot.^T~Halbrecht~Avoidable damage~1.1m~3rd most of 20~warn^T~Halbrecht~Interrupts~1~raid: 9~ok^E~Halbrecht~You died at 1:52. Focus next pull: When Venom Rupture keeps ticking you down, press Aspect of the Turtle before it's too late.^P~Corvane~SHAMAN~Elemental Shaman~dps~DPS~190k~-9~32~209k~32~3rd of 14 DPS~spell_nature_lightning~^RS~Corvane~90~Skyfury at the pull;Opener, step by step;Always be casting;Rotation priority^RT~Corvane~bad~1219480~Stormkeeper before Ascendance~1/2~~When Ascendance is coming back within 10 seconds, hold Stormkeeper and press it one or two casts before Ascendance.~~1 of your 2 Ascendances came right after a Stormkeeper.~Press Stormkeeper first, then Ascendance, so Stormkeeper's empowered spells get Ascendance's extra overloads. Always after Stormkeeper.~^RT~Corvane~warn~191634~Stormkeeper on cooldown~4/6~85%~Press Stormkeeper a little sooner each time it comes back.~~You pressed it 4 times out of a possible 6. It sat ready, unused, for 2 minutes in all.~Press Stormkeeper on cooldown. Holding it up to 10 seconds for Ascendance is fine.~^RT~Corvane~warn~51505~Maelstrom saved for Ascendance~49/125~~Save up Maelstrom in the seconds before Ascendance, without letting it overflow.~~On average you went into Ascendance with 49 Maelstrom out of 125.~Save Maelstrom and procs for Ascendance, which makes the spells you spend them on overload more. Enough for one Elemental Blast (90) is the bar.~^RT~Corvane~ok~1219480~Ascendance windows~2/2 · 91% casting~100%~~~2 of your 2 Ascendance windows were done right. Inside them you did 316.9K DPS, against 169.4K the rest of the pull. You were casting for 91% of them.~Ascendance puts Flame Shock on its targets, makes every spell that can overload do it one extra time, and makes overloads hit 75% harder. Keep casting all the way through it.~^RW~Corvane~ok~0:00–0:18~18 seconds~391.1K DPS · rest of the pull 169.4K~1:Kept casting;1:Stormkeeper before;1:Ancestral Swiftness with it;1:Potion;0:1 proc wasted~443454;51505;79206;188196;51505;188196;51505;188196;51505;79206;117014;188196~~Maelstrom at the start: 16/125 · Casting 94% of it^RW~Corvane~ok~3:03–3:21~18 seconds~242.6K DPS · rest of the pull 169.4K~1:Kept casting;0:Stormkeeper before;0:Ancestral Swiftness with it~51505;117014;51505;188196;188196;51505;447425;61882;443454;447425;51505;447425~~Maelstrom at the start: 81/125 · Casting 88% of it^K~0~B~Corvane~dead~1286918~You died at 3:56 to Eternal Nightfall. The pull was already lost.^B~Corvane~ok~ability_rogue_sprint~No avoidable damage taken. Nice dodging.^B~Corvane~ok~ability_kick~Interrupts: 2.^U~Corvane~ok~108271~Defensives: Astral Shift 1 of 2.^HP~Corvane~ok~6262~Healthstone at 3:46. No potion.^N~Corvane~When Ascendance is coming back within 10 seconds, hold Stormkeeper and press it one or two casts before Ascendance.^T~Corvane~Avoidable damage~0~Nice dodging~ok^T~Corvane~Interrupts~2~raid: 9~ok^O~Corvane~Press Stormkeeper a little sooner each time it comes back.^K~1~E~Corvane~Focus next pull: When Ascendance is coming back within 10 seconds, hold Stormkeeper and press it one or two casts before Ascendance.^K~0~E~Corvane~You died at 3:56. Focus next pull: When Ascendance is coming back within 10 seconds, hold Stormkeeper and press it one or two casts before Ascendance.^P~Ysolde~HUNTER~Beast Mastery Hunter~dps~DPS~178k~-2~32~181k~32~4th of 14 DPS~ability_hunter_bestialdiscipline~^RS~Ysolde~94~Always be casting;Rotation priority;Kill Command on cooldown;Focus wasted^RT~Ysolde~warn~ability_hunter_bestialdiscipline~Opener, step by step~4/5~~Follow the guide opener: Barbed Shot, then Barbed Shot, then Bestial Wrath, then Kill Command, then Cobra Shot.~~You followed 4 of the 5 steps of the Pack Leader opener, in order. Missed: step 3, Bestial Wrath (out of order).~Hunter's Mark on the boss and Misdirection on the tank before the pull. On one boss: Barbed Shot twice, then Bestial Wrath (never first: your pet must be attacking the boss, or Bloodshed doesn't apply), Kill Command and Cobra Shot.~^RT~Ysolde~ok~19574~Bestial Wrath windows~6/8 · 81% casting~100%~~~6 of your 8 Bestial Wrath windows were done right. Inside them you did 243.0K DPS, against 119.6K the rest of the pull. In 2 of them you cast slower than you do outside it.~Bestial Wrath is your only cooldown, every 30 seconds: 20% more damage for you and your pet, and most of your damage. Bank a second Kill Command charge as it comes back, then fit as many Kill Commands into it as you can…~^RW~Ysolde~ok~0:02–0:17~15 seconds~279.3K DPS · rest of the pull 119.6K~1:5 Kill Commands;1:Kept casting;1:Potion~34026;186257;193455;34026;193455;34026;246152;193455;34026;1306960;193455;193455~~Focus at the start: 100/100 · Casting 94% of it^RW~Ysolde~ok~0:33–0:48~15 seconds~255.6K DPS · rest of the pull 119.6K~1:5 Kill Commands;1:Kept casting~34026;1306960;1306960;246152;34026;193455;34026;193455;246152;34026;1306960;781~~Focus at the start: 93/100 · Casting 93% of it^RW~Ysolde~warn~2:11–2:26~15 seconds~194.7K DPS · rest of the pull 119.6K~1:2 Kill Commands;0:Slower casting~186265;34026;1306960;193455;246152;34026;264735~~Focus at the start: 48/100 · Casting 51% of it^RW~Ysolde~warn~2:41–2:56~15 seconds~209.8K DPS · rest of the pull 119.6K~1:2 Kill Commands;0:Slower casting~34026;193455;193455;34026;246152;193455;193455;246152~~Focus at the start: 96/100 · Casting 70% of it^K~0~B~Ysolde~dead~1286918~You died at 3:56 to Eternal Nightfall. The pull was already lost.^B~Ysolde~ok~ability_rogue_sprint~Avoidable damage taken: 336k, 12th most in the raid.^B~Ysolde~ok~ability_kick~Interrupts: 1.^B~Ysolde~ok~spell_holy_dispelmagic~Dispels: 1.^U~Ysolde~ok~186265~Defensives: Aspect of the Turtle 1 of 2, Survival of the Fittest 2 of 3, Exhilaration 2 of 2.^HP~Ysolde~ok~6262~Healthstone at 1:51, potion at 2:30.^N~Ysolde~Follow the guide opener: Barbed Shot, then Barbed Shot, then Bestial Wrath, then Kill Command, then Cobra Shot.^T~Ysolde~Avoidable damage~336k~12th most of 20~ok^T~Ysolde~Interrupts~1~raid: 9~ok^K~1~E~Ysolde~Focus next pull: Barbed Shot, then Barbed Shot, then Bestial Wrath, then Kill Command, then Cobra Shot.^K~0~E~Ysolde~You died at 3:56. Focus next pull: Barbed Shot, then Barbed Shot, then Bestial Wrath, then Kill Command, then Cobra Shot.^P~Rhakar~ROGUE~Subtlety Rogue~dps~DPS~214k~-25~32~284k~32~1st of 14 DPS~ability_stealth~^RS~Rhakar~95~Stealth at the pull;Opener, step by step;Always be casting;Rotation priority^RT~Rhakar~warn~426591~Goremaw's Bite on cooldown~5/6~91%~Press Goremaw's Bite a little sooner each time it comes back.~~You pressed it 5 times out of a possible 6. It sat ready, unused, for 32 seconds in all. It did 4.13M damage in all, 825.5K per cast.~Goremaw's Bite on cooldown. 85% or more is good.~^RT~Rhakar~ok~121471~Shadow Blades windows~3/3 · 96% casting~100%~~~3 of your 3 Shadow Blades windows were done right. Inside them you did 507.7K DPS, against 141.0K the rest of the pull. You were casting for 96% of them.~Subtlety is a 90-second spec. Every 90 seconds, Shadow Blades with two Shadow Dances.~^RW~Rhakar~ok~0:07–0:23~16 seconds~730.5K DPS · rest of the pull 141.0K~1:Shadow Dance;1:Kept casting;1:Potion~1297761;185422;280719;185438;196819;185438;441776;196819;185438;196819;196819;185422~~Casting 98% of it^RW~Rhakar~ok~1:40–1:56~16 seconds~513.0K DPS · rest of the pull 141.0K~1:Shadow Dance;1:Kept casting~185422;280719;1297761;185438;441776;1966;196819;185438;196819;196819;185438;196819~~Casting 92% of it^RW~Rhakar~ok~3:34–3:50~16 seconds~279.6K DPS · rest of the pull 141.0K~1:Shadow Dance;1:Kept casting~185422;1297761;280719;185438;441776;196819;185438;196819;196819;185438;196819;196819~~Casting 97% of it^K~0~B~Rhakar~dead~1286918~You died at 3:56 to Eternal Nightfall. The pull was already lost.^B~Rhakar~ok~ability_rogue_sprint~No avoidable damage taken. Nice dodging.^U~Rhakar~ok~31224~Defensives: Cloak of Shadows 1 of 2, Evasion 0 of 2, Crimson Vial 2 of 8.^HP~Rhakar~info~inv_stone_04~No Healthstone or potion used.^N~Rhakar~Press Goremaw's Bite a little sooner each time it comes back.^T~Rhakar~Avoidable damage~0~Nice dodging~ok^T~Rhakar~Interrupts~0~raid: 9~ok^K~1~E~Rhakar~Focus next pull: Press Goremaw's Bite a little sooner each time it comes back.^K~1~R~bad~1286620~Soul Sever~Hit @Tarnwick 1.54m and @Lumenra, 2 times each.^K~0~E~Rhakar~You died at 3:56. Focus next pull: Press Goremaw's Bite a little sooner each time it comes back.^K~0~R~bad~1286620~Soul Sever~Hit @Tarnwick 2.21m and @Lumenra (2).^R~warn~1310498~Mutagenic Venom~Hit @Grimvale 630k, @Ostrand 560k and @Tarnwick 302k. Fix: Purple carriers have right of way.^R~bad~1310732~Malevolent Resonance~Missed by @Quillara and @Feyleth, 2 times each. Fix: Only you can see your ghost on Mythic.^R~warn~1283290~Noxious Ground~Hit @Vexmira, @Thorncall and @Sylvaris. Fix: Stay out of the poison pools by the statues.^K~1~R~warn~1282403~Coalesced Venom~Sever popped about 5 orbs at once; the plan was none, into empty ground (2 times). Fix: Each popped orb is a raid-wide stack.^K~0~R~bad~1286918~Eternal Nightfall~Eternal Nightfall finished casting, because the shield wasn't broken in time (2 times). Fix: Save cooldowns and pooled damage for every shield.^D~1:52~Halbrecht~HUNTER~1299838~Venom Rupture (kit ready)^D~3:28~Feyleth~EVOKER~1312132~Malevolent Resonance (own mistake)^D~3:29~Quillara~DEATHKNIGHT~1312132~Malevolent Resonance (own mistake)^D~3:38~Lumenra~WARRIOR~1286620~Soul Sever (own mistake)^D~3:49~Tarnwick~DRUID~1297906~Gravebound (own mistake)^K~1~M~bad~~Tank frontals on non-tanks~1 hit on 1 player. Most: @Tarnwick 1.^K~0~D~3:55~Maelis~MAGE~1288635~Dreadful Presence^K~0~D~3:55~Grimvale~WARLOCK~1288635~Dreadful Presence^K~0~D~3:55~Ostrand~DRUID~1288635~Dreadful Presence^K~0~M~bad~~Tank frontals on non-tanks~5 hits on 1 player. Most: @Tarnwick 5.^M~bad~1285643~Dreadmarch (Stack, then stand still)~1 of 2 failed: 1 ghost collision and 5 ghosts missed by Soul Sever. First: Dreadmarch 2 at 3:27, @Quillara and @Feyleth's ghosts touched.^K~1~M~bad~1286441~Spiteful Soulcoiler (Kick and kill)~1 of 2 failed. Set 2 at 3:15: last set · 5 kicks, 1 Wail got off^K~1~M~bad~1310544~Coalesced Venom (Pop the orbs with the frontals)~1 of 4 failed. Deluge #3 at 1:27: 5, then 5 orbs, too many in Ironvow's frontal.^K~0~M~bad~1286441~Spiteful Soulcoiler (Kick and kill)~1 of 2 failed. Set 2 at 3:15: Wail of Terror at 3:51: got off.^K~0~M~bad~1310544~Coalesced Venom (Pop the orbs with the frontals)~5 of 8 failed. Deluge #3 at 1:27: 5, then 5 orbs, too many in Ironvow's frontal. Soul Sever at 3:40: hit a non-tank (orbs popped @Tarnwick).^M~bad~1286620~Sever (Defensive on the second stack)~1 of 8 failed. @Lumenra at 3:38: nothing up, died.^K~0~M~bad~1286918~Eternal Nightfall (Break and kick)~Shield 1 at 3:39: not broken, the cast finished.^M~warn~1282419~Volatile Venom (near a green carrier)~24 hits on 12 players. Most: @Brannoc 4, @Quillara 3, @Nyssa 3.^M~ok~1310882~Gloombomb (Drop it on the adds)~Both done right.^K~1~M~ok~1282487~Phase changes (Push on time)~Done right. P1 pushed at 2:20 at 10 stacks (plan 9-11).^K~0~M~ok~1282487~Phase changes (Push on time)~Done right. P1 pushed at 2:20 at 10 stacks (plan 9-11), P2 (wiped) began at 3:58.^M~ok~1283489~Guillotine (Soak with 5)~Both soaks had 5 or more (7, 5).^M~ok~1306906~Venomfang (Dispel fast)~All 6 dispelled in time (slowest 2.7 s).^RH~ok~inv_stone_04~Healthstones: 11 of 20 used, health potions: 7 of 20.^K~1~RK~bad~inv_stone_04~1 death with a Healthstone or potion unused: @Halbrecht (1:52).^K~0~RK~bad~inv_stone_04~2 deaths with a Healthstone or potion unused: @Halbrecht (1:52) and @Ironvow (3:58).^RD~ok~spell_holy_divineshield~Defensives: 20 of 20 pressed at least one.^K~0~X~+12 more by 3:58.^Q~Only the tank belongs in front of the boss.^K~1~L~We wiped in P2 at Malacrass 55%, further than last pull. It started at 1:52 when @Halbrecht died to Venom Rupture with Aspect of the Turtle and Healthstone still ready. Mutagenic Venom hit 3 of us: purple carriers have right of way. Malevolent Resonance missed by 2 of us: only you can see your ghost on Mythic. Next pull: Only the tank belongs in front of the boss.^K~1~I~We wiped in P2 at Malacrass 55%, further than last pull. It started at 1:52 when @Halbrecht died to Venom Rupture with Aspect of the Turtle and Healthstone still ready.^K~0~L~We wiped in P2 at Malacrass 55%, further than last pull. It started at 1:52 when @Halbrecht died to Venom Rupture with Aspect of the Turtle and Healthstone still ready. Then 15 of us went down within seconds at 3:55. Mutagenic Venom hit 3 of us: purple carriers have right of way. Malevolent Resonance missed by 2 of us: only you can see your ghost on Mythic. Next pull: Only the tank belongs in front of the boss.^K~0~I~We wiped in P2 at Malacrass 55%, further than last pull. It started at 1:52 when @Halbrecht died to Venom Rupture with Aspect of the Turtle and Healthstone still ready. Then 15 of us went down within seconds at 3:55.^W~We got further than last pull.^W~Nobody died until 1:52.^W~Gloombomb: both done right.^F~bad~Tank frontals on non-tanks hit one of us.^F~bad~Dreadmarch: 1 ghost collision and 5 ghosts missed by Soul Sever.^F~warn~Mutagenic Venom hit 3 of us: purple carriers have right of way.^NX~Only the tank belongs in front of the boss.^GH~info~We wiped in P2 at 55%.^K~1~GH~info~Root cause: Too many deaths.^K~1~GH~info~Three of us died between 3:28 and 3:38, starting with Malevolent Resonance.^K~0~GH~info~Root cause: Spiteful Soulcoiler got Wail of Terror off.^K~0~GH~info~Nobody interrupted it.^K~0~GH~info~It happened at 3:51.^GH~bad~It started at 1:52 when @Halbrecht died to Venom Rupture with Aspect of the Turtle and Healthstone still ready.^GH~ok~Our best pull tonight: P2 at 55%. We're getting closer.^K~1~GH~ok~Spiteful Soulcoiler, Gloombomb, Phase changes and 2 more were done right.^K~1~GH~bad~Dreadmarch: Dreadmarch targets were 23 yards apart instead of stacked on one marker.^K~1~GC~Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.^K~0~GH~ok~Gloombomb, Phase changes, Guillotine and 1 more were done right.^K~0~GC~Kick the Spiteful Soulcoiler's Wail of Terror (a raid-wide fear).^K~0~GC~Eternal Nightfall: save cooldowns and pooled damage for every shield.^GC~If you are targeted, stack on the raid's Dreadmarch marker so the ghosts spawn in one clump the frontal can hit.^K~1~GC~Coalesced Venom: Tanks, take turns and point each frontal at its own orbs: 5 to 6 per frontal (never 8), 2 to 3 on the second-to-last before the push, and the last one into empty ground.^A~Result~P2 · Malacrass 55%~3:58 · wipe~^K~1~A~Deaths~5~first at 1:52 (Halbrecht)~bad^K~1~A~Mechanics~4 clean~1 with mistakes · 5 failed~bad^K~1~A~Raid damage~2.76m~a second~^K~1~CH~We wiped in P2 at 55%. OUR BEST PULL YET! That's the one to copy. Next pull: only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other g….^K~1~CF~Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.~~^K~1~CM~1^K~1~CRC~Too many deaths.~Three of us died between 3:28 and 3:38, starting with Malevolent Resonance.~^K~0~A~Deaths~20~first at 1:52 (Halbrecht)~bad^K~0~A~Mechanics~4 clean~1 with mistakes · 6 failed~bad^K~0~A~Raid damage~2.56m~a second~^K~0~CH~We wiped in P2 at 55%. OUR BEST PULL YET! That's the one to copy. Next pull: kick the Spiteful Soulcoiler's Wail of Terror (a raid-wide fear).^K~0~CF~Kick the Spiteful Soulcoiler's Wail of Terror (a raid-wide fear).~~^K~0~CM~2^K~0~CRC~Spiteful Soulcoiler got Wail of Terror off.~Nobody interrupted it. It happened at 3:51.~^CT~w~Best pull~~P2 at 55%^CT~w~Guillotine~~Soak with 5 · correct^CT~w~Gloombomb~~Drop it on the adds · correct^K~0~CT~x~Coalesced Venom~~Pop the orbs with the frontals · more mistakes than pull 32^CT~x~Sever~~Defensive on the second stack · mistakes this pull, right on pull 32^CTE~1^K~1~CW~bad~1310744~Malevolent Resonance~first time tonight~Lost to Malevolent Resonance at 3:28: Feyleth and Quillara their ghost touched another ghost, causing Malevolent Resonance.~Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.~~~~Lost to Malevolent Resonance at 3:28: 2 players their ghost touched another ghost, causing Malevolent…^K~0~CW~bad~1286399~Wail of Terror~first time tonight caused the wipe~Lost to Wail of Terror at 3:51: Spiteful Soulcoiler got Wail of Terror off. Nobody interrupted it.~Kick the Spiteful Soulcoiler's Wail of Terror (a raid-wide fear).~~~~Lost to Wail of Terror at 3:51: Spiteful Soulcoiler got Wail of Terror off. Nobody interrupted it.^K~0~CW~bad~1310752~Eternal Nightfall (Break and kick)~first time tonight caused the wipe~Eternal Nightfall finished casting, because the shield wasn't broken in time.~Save cooldowns and pooled damage for every shield.~It is the damage check that wipes the raid.~17 of 20 top guilds got this fully right. A top guild gets almost none of it wrong; we got 100% of it wrong.~~Finished casting, because the shield wasn't broken in time.^CW~bad~1285643~Dreadmarch (Stack, then stand still)~first time tonight~Dreadmarch targets were 23 yards apart instead of stacked on one marker.~If you are targeted, stack on the raid's Dreadmarch marker so the ghosts spawn in one clump the frontal can hit.~After your mind control breaks, stand still until your ghost spawns, so all ghosts start together in front of the boss.~About half of top guilds got this fully right (11 of 20). A top guild gets almost none of it wrong; we got 67% of it wrong.~~Targets were 23 yards apart instead of stacked on one marker.^K~1~CW~warn~1282403~Coalesced Venom (Pop the orbs with the frontals)~Second time tonight Top guilds mess this up too~Sever popped about 5 orbs at once; the plan was none, into empty ground.~Tanks, take turns and point each frontal at its own orbs: 5 to 6 per frontal (never 8), 2 to 3 on the second-to-last before the push, and the last one into empty ground.~Toxic Deluge spits venom orbs around the room, and every orb left out pulses raid damage.~Top guilds mess this up too: only 2 of 20 got it fully right. A top guild gets about 13% of it wrong; we got 25%.~~Sever popped about 5 orbs at once; the plan was none, into empty ground.^K~0~CW~bad~1282403~Coalesced Venom (Pop the orbs with the frontals)~Second time tonight Top guilds mess this up too~Sever popped about 5 orbs at once; the plan was none, into empty ground.~Tanks, take turns and point each frontal at its own orbs: 5 to 6 per frontal (never 8), 2 to 3 on the second-to-last before the push, and the last one into empty ground.~Toxic Deluge spits venom orbs around the room, and every orb left out pulses raid damage.~Top guilds mess this up too: only 2 of 20 got it fully right. A top guild gets about 13% of it wrong; we got 63%.~dn~Sever popped about 5 orbs at once; the plan was none, into empty ground.^CR~~Our best pull tonight: P2 at 55%. We're getting closer.^K~1~CR~~Spiteful Soulcoiler, Gloombomb, Phase changes and 2 more were done right.^K~0~CR~~Gloombomb, Phase changes, Guillotine and 1 more were done right.^CD~1:52~Halbrecht~HUNTER~1299838~Venom Rupture~ready~Had a Healthstone and Aspect of the Turtle ready and didn't press them. Next time: Use your Healthstone when you drop under half: it heals about 241k, enough to survive the Venom Rupture that followed.~Aspect of the Turtle;Healthstone^CD~3:28~Feyleth~EVOKER~1312132~Malevolent Resonance~own~Their ghost touched another ghost (Malevolent Resonance). Next time: Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.~^CD~3:29~Quillara~DEATHKNIGHT~1312132~Malevolent Resonance~own~Their ghost touched another ghost (Malevolent Resonance). Next time: Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.~^CD~3:38~Lumenra~WARRIOR~1286620~Soul Sever~own~Died to Soul Sever on stack 2. Next time: On the second stack use a defensive plus two externals, or swap.~^CD~3:49~Tarnwick~DRUID~1297906~Gravebound~own~Stood in Soul Sever (tank frontal). Next time: Only the tank belongs in front of the boss.~^K~1~CD~3:55~Maelis~MAGE~1288635~Dreadful Presence~n~After the pull was lost.~^K~1~CD~3:55~Grimvale~WARLOCK~1288635~Dreadful Presence~n~After the pull was lost.~^K~1~CD~3:55~Ostrand~DRUID~1288635~Dreadful Presence~n~After the pull was lost.~^K~1~CD~3:56~Nyssa~WARRIOR~1286918~Eternal Nightfall~n~After the pull was lost.~^K~1~CD~3:56~Ysolde~HUNTER~1286918~Eternal Nightfall~n~After the pull was lost.~^K~1~CN~5 of 5 deaths on the player (red: their own mistake or a slow death with something ready). 15 more after the wipe filter, not counted.^K~0~CD~3:55~Maelis~MAGE~1288635~Dreadful Presence~mass~3 of us died to Dreadful Presence at once, because eternal Nightfall finished casting, because the shield wasn't broken in time. Next time: Not on you: Dreadful Presence killed 3 of us at once. Fix what set it off as a raid.~^K~0~CD~3:55~Grimvale~WARLOCK~1288635~Dreadful Presence~mass~3 of us died to Dreadful Presence at once, because eternal Nightfall finished casting, because the shield wasn't broken in time. Next time: Not on you: Dreadful Presence killed 3 of us at once. Fix what set it off as a raid.~^K~0~CD~3:55~Ostrand~DRUID~1288635~Dreadful Presence~mass~3 of us died to Dreadful Presence at once, because eternal Nightfall finished casting, because the shield wasn't broken in time. Next time: Not on you: Dreadful Presence killed 3 of us at once. Fix what set it off as a raid.~^K~0~CD~3:56~Nyssa~WARRIOR~1286918~Eternal Nightfall~mass~11 of us died to Eternal Nightfall at once, because eternal Nightfall finished casting, because the shield wasn't broken in time. Next time: Not on you: Eternal Nightfall killed 11 of us at once. Fix what set it off as a raid.~^K~0~CD~3:56~Ysolde~HUNTER~1286918~Eternal Nightfall~mass~11 of us died to Eternal Nightfall at once, because eternal Nightfall finished casting, because the shield wasn't broken in time. Next time: Not on you: Eternal Nightfall killed 11 of us at once. Fix what set it off as a raid.~^K~0~CN~6 of 20 deaths on the player (red: their own mistake or a slow death with something ready; amber: half on them).^K~0~CA~~Tank frontals on non-tanks~Tarnwick~DRUID~5 hits~1~Hit by Soul Sever: a big hit plus a 200% damage-taken debuff. 5 hits, 1.1M damage (73% of their health).^CA~1310744~Malevolent Resonance~Quillara~DEATHKNIGHT~1 hit~1~Died to Malevolent Resonance. 1 hit, 1.2M damage (about 1.5 times their health).^CA~1310744~Malevolent Resonance~Feyleth~EVOKER~1 hit~1~Died to Malevolent Resonance. 1 hit, 1.1M damage (about their whole health).^K~1~CA~~Tank frontals on non-tanks~Tarnwick~DRUID~1 hit~1~Hit by Soul Sever: a big hit plus a 200% damage-taken debuff. 1 hit, 772k damage (51% of their health).^CA~1283290~Noxious Ground~Thorncall~MONK~20 s~~Stood in Noxious Ground for 20 s: a bit more than most raiders in top guilds (16 s or less by this point). In it for 20 s, 2.1M damage (about 2.5 times their health).^CA~1283290~Noxious Ground~Vexmira~PALADIN~19 s~~Stood in Noxious Ground for 19 s: a bit more than most raiders in top guilds (16 s or less by this point). In it for 19 s, 2.3M damage (about 2.5 times their health).^CA~1283290~Noxious Ground~Sylvaris~EVOKER~18 s~~Stood in Noxious Ground for 18 s: a bit more than most raiders in top guilds (16 s or less by this point). In it for 18 s, 1.7M damage (about 2 times their health).^CA~1282419~Volatile Venom (near a green carrier)~Brannoc~EVOKER~4 hits~~Someone else brought it to them: they were standing still. Still, step away when you see it coming. 4 hits, 390k damage (45% of their health).^CA~1310498~Mutagenic Venom (near a purple carrier)~Grimvale~WARLOCK~2 hits~~Someone else brought it to them: they were standing still. Still, step away when you see it coming. 2 hits, 315k damage (33% of their health).^PC~Ironvow~Ironvow, good pull from you, with one thing to sharpen. Your one fix: Hand of Reckoning, then 3 of Avenger's Shield, Sentinel, Avenging Wrath or Divine Toll, in any order.~Hand of Reckoning, then 3 of Avenger's Shield, Sentinel, Avenging Wrath or Divine Toll, in any order.^PT~Ironvow~x~Always be casting~^PT~Ironvow~b~Divine Toll uses~^PC~Lumenra~Lumenra, some good things this pull, and one thing to fix first. Your one fix: On the second stack use a defensive plus two externals, or swap.~On the second stack use a defensive plus two externals, or swap.^PT~Lumenra~x~Dying to Soul Sever~^PT~Lumenra~x~Shield Block uptime~^PT~Lumenra~b~Opener, step by step~^PC~Thorncall~Thorncall, some good things this pull, and one thing to fix first. Your one fix: After Thunder Focus Tea, press Renewing Mist next.~After Thunder Focus Tea, press Renewing Mist next.^PT~Thorncall~x~Celestial Conduits set up~^PT~Thorncall~x~Noxious Ground~^PT~Thorncall~b~Celestial Conduit uses~^PC~Vexmira~Vexmira, good pull from you, with one thing to sharpen. Your one fix: Press something every global cooldown. When you have to move, use an instant spell instead of stopping.~Press something every global cooldown. When you have to move, use an instant spell instead of stopping.^PT~Vexmira~x~Cooldowns on big damage~^PT~Vexmira~x~Noxious Ground~^PT~Vexmira~b~Aura Mastery inside Beacon of Virtue~^PC~Brannoc~Brannoc, some good things this pull, and one thing to fix first. Your one fix: Press Stasis as soon as it comes back. From the start of the pull, it sat ready for 218 seconds.~Press Stasis as soon as it comes back. From the start of the pull, it sat ready for 218 seconds.^PT~Brannoc~x~Ramps started with Dream Breath~^PT~Brannoc~x~Volatile Venom~^PT~Brannoc~b~Rewind uses~^PC~Sylvaris~Sylvaris, some good things this pull, and one thing to fix first. Your one fix: Spend Essence before you're full, on Echo or Emerald Blossom, so it keeps coming back.~Spend Essence before you're full, on Echo or Emerald Blossom, so it keeps coming back.^PT~Sylvaris~x~Essence at full~^PT~Sylvaris~x~Rotation priority~^PT~Sylvaris~b~Dying to Sever~^PT~Sylvaris~b~Stasis uses~^PC~Korrith~Korrith, some good things this pull, and one thing to fix first. Your one fix: Keep casting all the way through Summon Darkglare.~Keep casting all the way through Summon Darkglare.^PT~Korrith~x~Summon Darkglare windows~^PT~Korrith~x~Haunt on cooldown~^PC~Elowen~Elowen, some good things this pull, and one thing to fix first. Your one fix: Finish the casts you start. When you have to move, switch to an instant spell before you start a cast, not halfway through it.~Finish the casts you start. When you have to move, switch to an instant spell before you start a cast, not halfway through it.^PT~Elowen~x~Cancelled casts~^PT~Elowen~x~Prismatic Bolt!~^PT~Elowen~b~Touch of the Magi on cooldown~^PT~Elowen~b~Clearcasting~^PC~Dravik~Dravik, some good things this pull, and one thing to fix first. Your one fix: Press Metamorphosis a little sooner each time it comes back.~Press Metamorphosis a little sooner each time it comes back.^PT~Dravik~b~Axegrinder~^PC~Maelis~Maelis, good pull from you, with one thing to sharpen. Your one fix: Frostbolt, then Flurry, then Frozen Orb, then Ray of Frost.~Frostbolt, then Flurry, then Frozen Orb, then Ray of Frost.^PT~Maelis~x~Ray of Frost on cooldown~^PT~Maelis~b~Dying to Toxic Deluge impacts~^PT~Maelis~b~Frozen Orb on cooldown~^PC~Tarnwick~Tarnwick, some good things this pull, and one thing to fix first. Your one fix: Only the tank belongs in front of the boss.~Only the tank belongs in front of the boss.^PT~Tarnwick~x~Dying to Soul Sever~^PT~Tarnwick~x~Fury of Elune right before Incarnation~^PT~Tarnwick~b~Rotation priority~^PC~Quillara~Quillara, some good things this pull, and one thing to fix first. Your one fix: Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.~Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.^PT~Quillara~x~Dying to Malevolent Resonance~^PT~Quillara~x~Army of the Dead uses~^PC~Ostrand~Ostrand, some good things this pull, and one thing to fix first. Your one fix: Press Fury of Elune, then Incarnation on your very next global cooldown.~Press Fury of Elune, then Incarnation on your very next global cooldown.^PT~Ostrand~x~Incarnation: Chosen of Elune windows~^PT~Ostrand~x~Mutagenic Venom~^PT~Ostrand~b~Opener, step by step~^PC~Feyleth~Feyleth, some good things this pull, and one thing to fix first. Your one fix: Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.~Only you can see your ghost on Mythic. Hold it near the marker for Soul Sever and keep it away from other ghosts.^PT~Feyleth~x~Dying to Malevolent Resonance~^PT~Feyleth~x~Ebon Might uptime~^PT~Feyleth~b~Always be casting~^PC~Grimvale~Grimvale, some good things this pull, and one thing to fix first. Your one fix: Save 2 Demonic Cores in the last seconds before each Tyrant, so it starts with instant Demonbolts.~Save 2 Demonic Cores in the last seconds before each Tyrant, so it starts with instant Demonbolts.^PT~Grimvale~x~Hand of Gul'dans in each Tyrant~^PT~Grimvale~b~Demonic Tyrant on cooldown~^PC~Nyssa~Nyssa, good pull from you, with one thing to sharpen. Your one fix: Press Avatar a little sooner each time it comes back.~Press Avatar a little sooner each time it comes back.^PT~Nyssa~x~Avatar uses~^PT~Nyssa~x~Sudden Death~^PT~Nyssa~b~Dying to Axegrinder~^PC~Halbrecht~Halbrecht, some good things this pull, and one thing to fix first. Your one fix: When Venom Rupture keeps ticking you down, press Aspect of the Turtle before it's too late.~When Venom Rupture keeps ticking you down, press Aspect of the Turtle before it's too late.^PT~Halbrecht~x~Dying slowly to Venom Rupture~^PC~Corvane~Corvane, some good things this pull, and one thing to fix first. Your one fix: When Ascendance is coming back within 10 seconds, hold Stormkeeper and press it one or two casts before Ascendance.~When Ascendance is coming back within 10 seconds, hold Stormkeeper and press it one or two casts before Ascendance.^PT~Corvane~x~Stormkeeper before Ascendance~^PT~Corvane~x~Rotation priority~^PT~Corvane~b~Stormkeeper on cooldown~^PT~Corvane~b~Maelstrom saved for Ascendance~^PC~Ysolde~Ysolde, good pull from you, with one thing to sharpen. Your one fix: Keep casting through Bestial Wrath. Move before or after it, or use your instant spells while you move.~Keep casting through Bestial Wrath. Move before or after it, or use your instant spells while you move.^PT~Ysolde~x~Bestial Wrath windows~^PT~Ysolde~b~Bestial Wrath uses~^PC~Rhakar~Rhakar, clean pull from you. Keep doing exactly this.~Same plan. Execute it.^PT~Rhakar~b~Goremaw's Bite on cooldown~^K~1~Y~We wiped in P2 at Malacrass 55%, further than last pull. In P1, Coalesced Venom had some mistakes. Halbrecht died to Venom Rupture at 1:52. In P2 (from 2:29), Dreadmarch failed, and Sever had some mistakes. 3 of us died, starting with Feyleth to Malevolent Resonance at 3:28. The wipe was called at 3:38 (more dead than any kill survived); the rest isn't counted.^K~1~G~Compared to last pull, we got further, to P2 at Malacrass 55% instead of P1 at Zul'jan 6%, we lost 4 players instead of 13, and the first death came later, at 1:52 instead of 0:05.^K~0~Y~We wiped in P2 at Malacrass 55%, further than last pull. In P1, Coalesced Venom failed. Halbrecht died to Venom Rupture at 1:52. In P2 (from 2:29), Dreadmarch, Coalesced Venom and Eternal Nightfall failed, and Spiteful Soulcoiler and Sever had some mistakes. 19 of us died, starting with Feyleth to Malevolent Resonance at 3:28, and 15 went down within seconds at 3:55.^K~0~G~Compared to last pull, we got further, to P2 at Malacrass 55% instead of P1 at Zul'jan 6%, and the first death came later, at 1:52 instead of 0:05.^J~Compared to last pull, Sever failed after going right last time.^WC~3:38~more dead than any kill survived^RG~C~73~Mechanics F · Avoidable damage C · Survival A · Interrupts S^V~0.5.39~0.6.65^Z]==]

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
-- the card's style: one click sets what the card shows and how much (Oct 24: three, each with its own sections; any change by hand makes it Custom)
PRESET_NAME = { simple = "Simple", standard = "Standard", detailed = "Detailed" }
local PRESETS = {
  -- (a quick look: the raid lead box, your number, your top fix and the next pull tip; nothing else)
  simple = { compact = true, openSecs = true, maxSlips = 1, maxBoss = 1, maxRaid = 1, maxDied = 0, maxMech = 3, width = "normal",
    show = { rank = false, best = false, vs = false, trend = false, surv = false, cons = false, kitd = false, right = false, cdeaths = false, cavoid = false, mechs = false,
      rdefs = false, rcons = false, rkitd = false, chips = false, chartLine = false, chartNight = false, grade = false, story = false } },
  -- (most raiders: your fixes and survival with the small tiles, worse and better than last pull, the raid's deaths and mistakes, your last pulls)
  standard = { compact = false, openSecs = false, maxSlips = 3, maxBoss = 3, maxRaid = 3, maxDied = 3, maxMech = 6, width = "wide", tiles = true,
    show = { mechs = false, chartLine = false, chartNight = false, grade = false } },
  -- (everything: up to 8 rotation tips with their windows, two next pull tips, boss mechanics, the charts and the grade)
  detailed = { compact = false, openSecs = true, maxSlips = 8, maxBoss = 7, maxRaid = 5, maxDied = 6, maxMech = 12, width = "xl", tiles = true, detailed = true,
    show = { mechs = true, chartLine = true, chartNight = true, grade = true } },
}
function Debrief_SetPreset(key)
  local p = PRESETS[key]; if not p or not DB then return end
  DB.compact, DB.maxSlips, DB.maxBoss, DB.maxRaid, DB.maxDied, DB.maxMech, DB.width = p.compact, p.maxSlips, p.maxBoss, p.maxRaid, p.maxDied, p.maxMech, p.width
  DB.detailed = p.detailed or nil; DB.glance = nil; DB.tiles = p.tiles or nil; DB.openSecs = p.openSecs
  DB.show = {}; for k, v in pairs(p.show) do DB.show[k] = v end
  DB.collapsed = nil; DB.coachOpen = nil; DB.preset = key
  if Debrief_RefreshOptions then Debrief_RefreshOptions() end
  if card:IsShown() then render() end
end
-- (a quick fade in when the card opens (Oct 24))
card:HookScript("OnShow", function(self) if Debrief_PreviewFix then Debrief_PreviewFix() end; if UIFrameFadeIn then self:SetAlpha(0); UIFrameFadeIn(self, 0.14, 0, 1) end end)
local close = closeButton(card)
close:SetScript("OnClick", function() card:Hide() end)
-- (the Detail button on the card: Simple, Medium, Heavy, one click each)
detailBtn = CreateFrame("Button", nil, card); detailBtn:SetSize(70, 22); detailBtn:SetPoint("RIGHT", close, "LEFT", -6, 0)
skin(detailBtn, 5, COL.raised, 1, COL.line2, 1)
detailBtn.t = detailBtn:CreateFontString(nil, "OVERLAY"); setFont(detailBtn.t, "bold", 11.5); detailBtn.t:SetPoint("CENTER", 0, 0); detailBtn.t:SetTextColor(rgb(COL.muted)); detailBtn.t:SetText("Standard")
detailBtn:SetScript("OnClick", function() local order = { simple = "standard", standard = "detailed", detailed = "simple" }; Debrief_SetPreset(order[DB.preset] or "standard") end)
detailBtn:SetScript("OnEnter", function() detailBtn.t:SetTextColor(rgb(COL.text)); GameTooltip:SetOwner(detailBtn, "ANCHOR_TOP"); GameTooltip:SetText("How much the card shows: Simple, Standard or Detailed"); GameTooltip:Show() end)
detailBtn:SetScript("OnLeave", function() detailBtn.t:SetTextColor(rgb(COL.muted)); GameTooltip:Hide() end)
-- (the Expand button: the big window, with tonight's pulls and charts)
local bigBtn = CreateFrame("Button", nil, card); bigBtn:SetSize(64, 22); bigBtn:SetPoint("RIGHT", detailBtn, "LEFT", -6, 0)
skin(bigBtn, 5, COL.raised, 1, COL.line2, 1)
bigBtn.t = bigBtn:CreateFontString(nil, "OVERLAY"); setFont(bigBtn.t, "bold", 11.5); bigBtn.t:SetPoint("CENTER", 0, 0); bigBtn.t:SetTextColor(rgb(COL.muted)); bigBtn.t:SetText("Expand")
bigBtn:SetWidth(bigBtn.t:GetStringWidth() + 18)
-- (Oct 24, the user: "the expand button doesnt do anything": the card's drag strip could sit over it and take the click; the header's
-- buttons now sit above it, and Expand closes the settings first and brings the big window to the front)
bigBtn:SetScript("OnClick", function()
  if DebriefOptions and DebriefOptions:IsShown() then Debrief_ToggleOptions() end
  card:Hide(); big:Show(); big:Raise()
  local ok, err = pcall(bigRender); if not ok then say("the big window couldn't open (" .. tostring(err):sub(1, 120) .. "). /debrief big tries again.") end
end)
for _, b0 in ipairs({ close, detailBtn, bigBtn }) do if b0 and b0.SetFrameLevel and top.GetFrameLevel then b0:SetFrameLevel(top:GetFrameLevel() + 3) end end
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
-- (each opening starts on you, on the Me tab (Oct 24, the user: windows "keep switching"): the arrows and the Raid view tab last until
-- the card closes; not while the settings or the setup show the sample)
card:HookScript("OnShow", function() if not (Debrief_PreviewReal and Debrief_PreviewReal()) then view = "me"; if DB then DB.who = nil end end end)
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
foot:SetText("/recap opens this again  ·  /db settings")
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
local pool = { fs = {}, tex = {}, rt = {}, btn = {}, tip = {} }
local used = { fs = 0, tex = 0, rt = 0, btn = 0, tip = 0 }
local EXPANDED = {} -- (lists opened with "Show N more", until the next pull)
local IND = 0 -- (rows sit this far in, inside a section panel)
-- (two columns when the card is long (Oct 24): the right column is its own frame with its own pieces; drawing switches to it at a section edge)
local bodyL, poolL, usedL = body, pool, used
local bodyR = CreateFrame("Frame", nil, body); bodyR:SetSize(10, 10); bodyR:SetPoint("TOPLEFT", body, "TOPLEFT", 0, 0); bodyR:Hide()
local poolR, usedR = { fs = {}, tex = {}, rt = {}, btn = {}, tip = {} }, { fs = 0, tex = 0, rt = 0, btn = 0, tip = 0 }
local function useCol(n) if n == 2 then body, pool, used = bodyR, poolR, usedR else body, pool, used = bodyL, poolL, usedL end end
local function colFrame(on, cw, h)
  bodyR:ClearAllPoints(); bodyR:SetPoint("TOPLEFT", bodyL, "TOPLEFT", cw + 16, 0); bodyR:SetWidth(cw)
  if h then bodyR:SetHeight(math.max(10, h)) end; bodyR:SetShown(on)
end
local function resetPool()
  useCol(1)
  for _, pu in ipairs({ { poolL, usedL }, { poolR, usedR } }) do
    local p0, u0 = pu[1], pu[2]
    u0.fs, u0.tex, u0.rt, u0.btn, u0.ln, u0.tip = 0, 0, 0, 0, 0, 0
    for _, l in pairs(p0) do for _, o in ipairs(l) do o:Hide(); o:ClearAllPoints() end end
  end
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
  -- (a spell or boss ability: WoW's own tooltip when you hover the icon (Oct 24); the click still reaches the row under it)
  local sid = tonumber(id)
  if sid and sid > 0 then
    used.tip = used.tip + 1
    local f = pool.tip[used.tip]
    if not f then
      f = CreateFrame("Frame", nil, body); pool.tip[used.tip] = f
      if f.SetMouseClickEnabled then f:SetMouseClickEnabled(false); f:SetMouseMotionEnabled(true) else f:EnableMouse(true) end
      f:SetScript("OnEnter", function(self) if self.sid and GameTooltip.SetSpellByID then GameTooltip:SetOwner(self, "ANCHOR_RIGHT"); GameTooltip:SetSpellByID(self.sid); GameTooltip:Show() end end)
      f:SetScript("OnLeave", function() GameTooltip:Hide() end)
    end
    f.sid = sid; f:ClearAllPoints(); f:SetPoint("TOPLEFT", x, -y); f:SetSize(size, size); f:SetFrameLevel((body:GetFrameLevel() or 1) + 8); f:Show()
  end
  return t
end
local FLAG = { ok = COL.good, warn = COL.warn, bad = COL.bad, dead = COL.faint }
-- (how far a pull got, in the website's colours (Oct 25): purple from 80% done, blue from 60, green from 40, white from 20, else grey; a kill orange)
local PULL_Q = { { 80, "b25ef5" }, { 60, "2e8cff" }, { 40, "2ee62e" }, { 20, "f2f2f2" }, { 0, "9d9d9d" } }
local function pullQ(h) if h.kill then return "ff8000" end; local left = tonumber(h.pct); if not left then return COL.muted end; for _, q in ipairs(PULL_Q) do if 100 - left >= q[1] then return q[2] end end; return "9d9d9d" end
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
  if not b then b = CreateFrame("Button", nil, body); pool.btn[used.btn] = b
    -- (a soft highlight under your mouse on everything you can click (Oct 24))
    local hl = b:CreateTexture(nil, "HIGHLIGHT"); hl:SetAllPoints(); hl:SetColorTexture(1, 1, 1, 0.045) end
  b:ClearAllPoints(); b:SetScript("OnClick", nil); b:SetScript("OnEnter", nil); b:SetScript("OnLeave", nil); b:Show()
  return b
end
-- a section label: small, uppercase, quiet; click it to fold the section away (or open it again)
local function head(y, text, key, folded, onClick)
  local t = FS("head", 15, COL.text); t:SetPoint("TOPLEFT", IND, -y); t:SetText(text)
  if key then
    local sign = FS("bold", 14, COL.faint); sign:SetJustifyH("RIGHT"); sign:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - IND, -(y - 1)); sign:SetText(folded and "+" or "–")
    local b = BTN(); b:SetPoint("TOPLEFT", 0, -(y - 8)); b:SetSize(CW, 30)
    b:SetScript("OnClick", onClick or function() DB.collapsed = DB.collapsed or {}; DB.collapsed[key] = not DB.collapsed[key] or nil; render() end)
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
-- (a row that shows its first sentence and keeps the rest for hover (Oct 22 audit): "Always be casting: 75%." with
-- "You were casting for 75% of the time you were alive." in the tooltip)
local function rowS(y, r)
  local t = tostring(r[3] or ""); local a, b = t:match("^(.-[%.!%?])%s+(%S.+)$")
  if not a or #t < 60 or #a < 12 or #b < 30 then return row(y, r[1], r[2], t) end -- (a short second sentence stays: "That one was on you.")
  local y2 = row(y, r[1], r[2], a)
  local i = FS("bold", 11, COL.faint); i:SetJustifyH("RIGHT"); i:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - 4, -(y + 3)); i:SetText("?")
  local bt = BTN(); bt:SetPoint("TOPLEFT", 0, -y); bt:SetSize(CW, math.max(16, y2 - y - 6))
  bt:SetScript("OnEnter", function() i:SetTextColor(rgb(COL.gold)); GameTooltip:SetOwner(bt, "ANCHOR_TOP"); GameTooltip:SetText(names(a), 1, 1, 1, 1, true); GameTooltip:AddLine(names(b), 0.8, 0.82, 0.86, true); GameTooltip:Show() end)
  bt:SetScript("OnLeave", function() i:SetTextColor(rgb(COL.faint)); GameTooltip:Hide() end)
  return y2
end
-- (the Wipe call row (Oct 23): "Wipe call  called at 2:39: more dead than any kill survived  [On]"; a click turns it off or on)
local function wipeRow(y, raw, redraw)
  -- (always on, nothing to click (Oct 23): when the pull was lost and why)
  local t = FS("bold", 13, COL.text); t:SetPoint("TOPLEFT", 12, -(y + 2)); t:SetText("Wipe called at " .. raw.wc.at)
  local n2 = FS("body", 12.5, COL.faint); n2:SetText(raw.wc.txt .. ". Nothing after it counts.")
  -- (beside the title when it fits; a longer one, like a mechanic no kill survived (Oct 24), wraps under it and the row grows)
  local room, extra = CW - 24 - t:GetStringWidth() - 10, 0
  if n2:GetStringWidth() <= room then n2:SetPoint("LEFT", t, "RIGHT", 10, 0); n2:SetWordWrap(false); n2:SetWidth(math.max(40, room))
  else n2:SetPoint("TOPLEFT", 12, -(y + 20)); n2:SetWidth(CW - 24); n2:SetWordWrap(true); extra = n2:GetStringHeight() end
  local tb = BTN(); tb:SetPoint("TOPLEFT", 0, -(y - 2)); tb:SetSize(CW, 24 + extra)
  tb:SetScript("OnEnter", function() GameTooltip:SetOwner(tb, "ANCHOR_TOP"); GameTooltip:SetText("The wipe call", 1, 1, 1); GameTooltip:AddLine("When a pull is lost (more dead than any kill survived, a mechanic no kill ever survived, the damage check missed, or half the raid dead), nothing after it counts.", 0.8, 0.82, 0.86, true); GameTooltip:Show() end)
  tb:SetScript("OnLeave", function() GameTooltip:Hide() end)
  return extra
end
-- (the raid lead's four cards (Oct 23), like the website: What wiped us, What we did well, Worse than last pull, Better than last pull;
-- two by two on a wide card, one under the other on a narrow one; an empty card says so)
local function trendCards(y, c, paint)
  local tr = c.tr or { w = {}, x = {}, b = {} }
  local cards = {}
  -- (Oct 24, like the website: no Worse / Better cards; the mistakes carry a small Improving or Worsening tag instead)
  local function lcn(s0) return (tostring(s0 or ""):lower():gsub("%s*%(.*$", "")) end
  local function inL(L, nm) for _, it in ipairs(L or {}) do if lcn(it.nm) ~= "" and lcn(it.nm) == lcn(nm) then return true end end end
  local function tagOf(t0) return t0 == "dn" and "  |cffff8f87Worsening|r" or t0 == "up" and "  |cff5aa9ffImproving|r" or "" end
  local function trName(nm) return inL(tr.x, nm) and "dn" or inL(tr.b, nm) and "up" or "" end
  if c.root then
    -- (Also went wrong: the other big mistakes, five at most, each with its line with no names)
    local also, cz = {}, lcn(c.root.cause)
    for _, w in ipairs(c.wrong or {}) do if w.sev == "bad" and not (lcn(w.label) ~= "" and cz:find(lcn(w.label), 1, true)) then also[#also + 1] = w end end
    cards[#cards + 1] = { "WHAT WIPED US", COL.badT, nil, c.root, nil, also }
  end
  local well = {}; for _, it in ipairs(tr.w or {}) do well[#well + 1] = { nm = it.nm, tag = it.tag, sub = it.sub, tr0 = trName(it.nm) } end
  cards[#cards + 1] = { "WHAT WE DID WELL", COL.goodT, well, nil, "Nothing stood out yet." }
  local two = CW >= 520
  local cw = two and math.floor((CW - 10) / 2) or CW
  local i, top = 1, y
  while i <= #cards do
    local rowH, made = 0, {}
    for col = 0, two and 1 or 0 do
      local cd = cards[i + col]
      if cd then
        local x0, w, yy, parts = col * (cw + 10), cw, 10, {}
        local t = FS("bold", 11.5, cd[2]); t:SetText(cd[1]); parts[#parts + 1] = { t, 12, yy }; yy = yy + 18
        if cd[4] then
          local a = FS("bold", 13.5, COL.text); a:SetWidth(w - 24); a:SetText(paint(cd[4].cause) .. tagOf(cd[4].tr)); parts[#parts + 1] = { a, 12, yy }; yy = yy + a:GetStringHeight() + 4
          if (cd[4].rest or "") ~= "" then local b = FS("body", 12.5, COL.muted); b:SetWidth(w - 24); b:SetText(paint(cd[4].rest)); parts[#parts + 1] = { b, 12, yy }; yy = yy + b:GetStringHeight() + 4 end
          if cd[6] and #cd[6] > 0 then
            local h2 = FS("bold", 10.5, COL.faint); h2:SetText("OTHER BIG MISTAKES"); parts[#parts + 1] = { h2, 12, yy + 4 }; yy = yy + 20
            for k, x in ipairs(cd[6]) do if k > 5 then break end
              local n = FS("bold", 12.5, COL.text); n:SetWidth(w - 24); n:SetText(paint(x.label) .. tagOf(x.tr)); parts[#parts + 1] = { n, 12, yy }; yy = yy + n:GetStringHeight() + 1
              if (x.wnn or "") ~= "" then local s2 = FS("body", 12, COL.faint); s2:SetWidth(w - 24); s2:SetText(x.wnn); parts[#parts + 1] = { s2, 12, yy }; yy = yy + s2:GetStringHeight() + 1 end
              yy = yy + 4
            end
            if #cd[6] > 5 then local mo = FS("body", 12, COL.faint); mo:SetText("+" .. (#cd[6] - 5) .. " more, in Every mistake below"); parts[#parts + 1] = { mo, 12, yy }; yy = yy + 16 end
          end
        elseif #cd[3] == 0 then
          local e = FS("body", 12.5, COL.faint); e:SetWidth(w - 24); e:SetText(cd[5]); parts[#parts + 1] = { e, 12, yy }; yy = yy + e:GetStringHeight() + 4
        else
          for _, it in ipairs(cd[3]) do
            local n = FS("bold", 13, COL.text); n:SetWidth(w - 24); n:SetText(paint(it.nm) .. ((it.tag or "") ~= "" and ("  |cff" .. cd[2] .. it.tag .. "|r") or "") .. tagOf(it.tr0)); parts[#parts + 1] = { n, 12, yy }; yy = yy + n:GetStringHeight() + 2
            if (it.sub or "") ~= "" then local s = FS("body", 12, COL.faint); s:SetWidth(w - 24); s:SetText(paint(it.sub)); parts[#parts + 1] = { s, 12, yy }; yy = yy + s:GetStringHeight() + 2 end
            yy = yy + 4
          end
        end
        made[#made + 1] = { x0, w, parts }; rowH = math.max(rowH, yy + 6)
      end
    end
    for _, m0 in ipairs(made) do
      local bg = RT("BACKGROUND"); bg:SetPoint("TOPLEFT", body, "TOPLEFT", m0[1], -top); bg:SetSize(m0[2], rowH); rounded(bg, "fill", 6, COL.raised, DB.cardStyle == "glass" and 0.55 or 1)
      for _, pt in ipairs(m0[3]) do pt[1]:SetPoint("TOPLEFT", body, "TOPLEFT", m0[1] + pt[2], -(top + pt[3])) end
    end
    top = top + rowH + 10; i = i + (two and 2 or 1)
  end
  return top + 2
end
-- (a Rotation fix, like the website's checklist (Oct 24): the check and your number against the top players' on one line, a square for
-- each moment it happened (green right, orange not), then Next time; hover for why it matters)
local SQC = { g = "45c15c", w = "e8a23a", b = "e5534b" }
-- (a drop-down (Oct 24): closed, the check and your number against the top players'; click it open for why it matters, a square per moment,
-- Next time, how it's judged and the moments you slipped)
-- (one ramp or burst window inside a check's drop-down (Oct 24): when it was and how it went, the checks as ticks and crosses, the numbers,
-- the buttons pressed in it, or for a ramp, the 20 seconds before it)
local WST = { ok = "ok", g3 = "ok", warn = "warn", g2 = "warn", g1 = "warn", bad = "bad", no = "bad", g0 = "bad" }
local function winBlock(y, x0, w)
  local wd = CW - IND - x0 - 4
  local d = TEX("ARTWORK"); d:SetTexture(SLICE .. "dot"); d:SetPoint("TOPLEFT", x0, -(y + 5)); d:SetSize(7, 7); d:SetVertexColor(rgb(FLAG[WST[w.st] or ""] or COL.faint))
  local h = FS("bold", 13, COL.text); h:SetPoint("TOPLEFT", x0 + 13, -y); h:SetWidth(wd - 13); h:SetText((w.head or "") .. (((w.sub or "") ~= "") and ("|cff" .. COL.faint .. "   " .. w.sub .. "|r") or ""))
  local yy = y + h:GetStringHeight() + 3
  local function ln(size, hex, text) local f = FS("body", size, hex); f:SetPoint("TOPLEFT", x0 + 13, -yy); f:SetWidth(wd - 13); f:SetText(text); yy = yy + f:GetStringHeight() + 3 end
  if (w.vals or "") ~= "" then ln(12, COL.muted, w.vals) end
  if (w.chk or "") ~= "" then
    local parts = {}
    for q in w.chk:gmatch("[^;]+") do local k, tx = q:match("^(%d):(.*)$")
      if tx and tx ~= "" then parts[#parts + 1] = k == "1" and ("|TInterface\\RaidFrame\\ReadyCheck-Ready:12|t |cff" .. COL.goodT .. tx .. "|r") or k == "0" and ("|TInterface\\RaidFrame\\ReadyCheck-NotReady:12|t |cff" .. COL.badT .. tx .. "|r") or ("|cff" .. COL.soft .. tx .. "|r") end end
    if #parts > 0 then ln(12.5, COL.soft, table.concat(parts, "     ")) end
  end
  if (w.meta or "") ~= "" then ln(11.5, COL.faint, w.meta) end
  if (w.seq or "") ~= "" then
    if w.pre then ln(11.5, COL.faint, "The 20 seconds before it, in order") end
    local i, per = 0, math.max(4, math.floor((wd - 13) / 22))
    for id in w.seq:gmatch("[^;]+") do icon(x0 + 13 + (i % per) * 22, yy + math.floor(i / per) * 22, 19, id); i = i + 1 end
    yy = yy + math.ceil(i / per) * 22 + 2
  end
  return yy + 7
end
local function rotRow(y, r, open, toggle)
  local flag, ic, label, v, top, tip, strip, why, how, mo = r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10]
  local d = TEX("ARTWORK"); d:SetTexture(SLICE .. "dot"); d:SetPoint("TOPLEFT", IND, -(y + 6)); d:SetSize(8, 8); d:SetVertexColor(rgb(FLAG[flag] or COL.faint))
  local x0 = IND + 46
  local sg = FS("bold", 14, COL.faint); sg:SetJustifyH("RIGHT"); sg:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - IND, -y); sg:SetText(open and "–" or "+")
  local vt = FS("bold", 13.5, flag == "bad" and COL.badT or flag == "warn" and COL.warn or COL.text); vt:SetJustifyH("RIGHT"); vt:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - IND - 18, -y)
  vt:SetText((v or "") .. (((top or "") ~= "") and ("|cff" .. COL.faint .. "  top " .. top .. "|r") or ""))
  local lt = FS("bold", 13.5, COL.text); lt:SetPoint("TOPLEFT", x0, -y); lt:SetWidth(math.max(80, CW - IND - x0 - vt:GetStringWidth() - 30)); lt:SetText(label)
  local yy = y + math.max(18, lt:GetStringHeight()) + 3
  local bt = BTN(); bt:SetPoint("TOPLEFT", 0, -y); bt:SetSize(CW, math.max(18, yy - y))
  if toggle then bt:SetScript("OnClick", toggle) end
  bt:SetScript("OnEnter", function() sg:SetTextColor(rgb(COL.gold)); lt:SetTextColor(rgb(COL.gold)) end); bt:SetScript("OnLeave", function() sg:SetTextColor(rgb(COL.faint)); lt:SetTextColor(rgb(COL.text)) end)
  icon(IND + 16, y, 20, ic, flag) -- (after the row's button, so the icon's tooltip sits on top)
  if open then
    local w = CW - IND - x0 - 4
    local function line(kind, size, hex, text) local f = FS(kind, size, hex); f:SetPoint("TOPLEFT", x0, -yy); f:SetWidth(w); f:SetText(text); yy = yy + f:GetStringHeight() + 4 end
    if (why or "") ~= "" then line("body", 13, COL.soft, names(why)) end
    if (strip or "") ~= "" then
      for i = 1, #strip do local q = TEX("ARTWORK"); q:SetPoint("TOPLEFT", x0 + (i - 1) * 10, -(yy + 1)); q:SetSize(8, 8); fill(q, SQC[strip:sub(i, i)] or COL.faint) end
      yy = yy + 15
    end
    if (tip or "") ~= "" then line("body", 13, COL.soft, "|cff" .. COL.gold .. "Next time:|r " .. names(tip)) end
    if r.win and #r.win > 0 then line("bold", 11.5, COL.muted, "EACH WINDOW"); yy = yy + 2; for _, wv in ipairs(r.win) do yy = winBlock(yy, x0, wv) end -- (the windows say it better than the moments (Oct 24))
    elseif (mo or "") ~= "" then line("bold", 11.5, COL.muted, "WHEN IT SLIPPED"); for m in mo:gmatch("[^;]+") do line("body", 12.5, COL.soft, "•  " .. names(m)) end end
    if (how or "") ~= "" then line("body", 12, COL.faint, "How it's judged: " .. names(how)) end
    yy = yy + 2
  end
  return yy + 6
end
-- (what you did well on your rotation, one green line under the fixes)
local function rotGood(y, rs)
  if not rs or not rs.good or #rs.good == 0 then return y end
  local f = FS("body", 13, COL.goodT); f:SetPoint("TOPLEFT", IND + 4, -(y + 2)); f:SetWidth(CW - IND * 2 - 8); f:SetText("Done right: " .. table.concat(rs.good, ", ") .. ".")
  return y + f:GetStringHeight() + 8
end
local function nextBox(y, text, label)
  local t = FS("body", 14, COL.text); t:SetWidth(CW - 32); t:SetText(names(text))
  local l = FS("bold", 11.5, COL.gold); l:SetText(label or "NEXT PULL") -- ("NEXT TIME" after a dungeon boss (Oct 24))
  local h = 11 + 17 + t:GetStringHeight() + 12
  box(y, h, COL.gold, 0.07, COL.gold, 0.5, COL.gold)
  l:SetPoint("TOPLEFT", 16, -(y + 11)); t:SetPoint("TOPLEFT", 16, -(y + 28))
  return y + h + 4
end
local function chipColors(b, fillHex, lineHex, textHex)
  rounded(b.fillT, "fill", 5, fillHex, 1); rounded(b.lineT, "line", 5, lineHex, 1); b.t:SetTextColor(rgb(textHex))
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
  if not m or not m.cutN or (m.h and m.h.kill) then return 0 end
  if m.wc then return 1 end -- (the wipe call: always on (Oct 23))
  if c > m.cutN then return 0 end
  return c
end
local SEVR = { dead = 0, bad = 0, warn = 1 }
-- (worst first in every list (Oct 24, the user: "Sections should always prioritize the worst mistakes first, including rotation"): red, then
-- amber, then the rest, each keeping the order it came in (rotation: what it cost; deaths: when))
local function worstFirst(list, rankOf)
  if not list or #list < 2 then return list end
  rankOf = rankOf or function(r) return SEVR[r[1]] or 2 end
  local at = {}; for i, r in ipairs(list) do at[r] = i end
  table.sort(list, function(a, b) local x, y = rankOf(a), rankOf(b); if x ~= y then return x < y end; return at[a] < at[b] end)
  return list
end
local KRANK = { own = 0, ready = 0, on = 0, half = 1, nothing = 1 }
local function cutView(m)
  if not m or not m.cutN then return m end
  local c = tostring(cutIdx(m))
  local function keep(list, sort)
    local o, at = {}, {}; for i, r in ipairs(list or {}) do r._i = nil; if not r.k or r.k:find(c, 1, true) then o[#o + 1] = r; at[r] = i end end
    if sort then table.sort(o, function(a, b) local x, y = SEVR[a[1]] or 2, SEVR[b[1]] or 2; if x ~= y then return x < y end; return at[a] < at[b] end) end
    return o
  end
  local function pick(def, kl) if kl then for _, x in ipairs(kl) do if x[1]:find(c, 1, true) then return x[2] end end; return "" end; return def end
  local v = { h = m.h, addonV = m.addonV, cutN = m.cutN, wc = m.wc, coach = (m.coachV and m.coachV[c] and (m.coachV[c].head or "") ~= "" and m.coachV[c]) or m.coach, grade = m.grade, players = {},
    raid = { bad = keep(m.raid.bad, true), died = keep(m.raid.died), mech = keep(m.raid.mech, true), cons = keep(m.raid.cons), defs = keep(m.raid.defs), kitd = keep(m.raid.kitd), more = pick(m.raid.more, m.raid.moreK), next = pick(m.raid.next, m.raid.nextK),
      tiles = keep(m.raid.tiles), story = pick(m.raid.story or "", m.raid.storyK), better = pick(m.raid.better or "", m.raid.betterK), worse = pick(m.raid.worse or "", m.raid.worseK), lead = pick(m.raid.lead or "", m.raid.leadK),
      good = keep(m.raid.good), fixes = keep(m.raid.fixes), ghap = keep(m.raid.ghap), gchg = keep(m.raid.gchg), ghead = pick(m.raid.ghead or "", m.raid.gheadK), gnext = pick(m.raid.gnext or "", m.raid.gnextK) } }
  -- (the coach's lists, worst first: red mistakes, deaths on the player, avoidable damage in red)
  local co = v.coach
  if co then worstFirst(co.wrong, function(x) return x.sev == "bad" and 0 or 1 end); worstFirst(co.deaths, function(d) return KRANK[d.k] or 2 end); worstFirst(co.avoid, function(a) return a.bad and 0 or 1 end) end
  for _, p in ipairs(m.players) do
    local q = {}; for k, x in pairs(p) do q[k] = x end
    q.slips, q.boss, q.surv, q.next, q.cons, q.kitd = keep(p.slips, true), keep(p.boss, true), keep(p.surv, true), pick(p.next, p.nextK), keep(p.cons, true), keep(p.kitd)
    if p.rot then local rc = {}; for i, r in ipairs(p.rot) do rc[i] = r end; q.rot = worstFirst(rc) end
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
  local function mix(i) local f = (i - 1) / math.max(1, #pts - 1); local a1, a2, a3 = rgb(COL.gold); local b1, b2, b3 = rgb("5fdc7a"); return string.format("%02x%02x%02x", math.floor((a1 + (b1 - a1) * f) * 255 + 0.5), math.floor((a2 + (b2 - a2) * f) * 255 + 0.5), math.floor((a3 + (b3 - a3) * f) * 255 + 0.5)) end
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
-- (Standard opens folded (Oct 25, the Design studio's round 3): these four start closed on each new pull, unless "Open the sections by
-- default" is on; an empty one stays open, so its one green line shows)
local SHUT = { rotation = true, boss = true, surv = true, died = true }
local UI = { startsShut = function(key, n) return n > 0 and SHUT[key] and DB.openSecs == false end, rotRow = rotRow, rotGood = rotGood, rowS = rowS, wipeRow = wipeRow, trendCards = trendCards, cardCharts = cardCharts, cardGrade = cardGrade, parseK = parseK, goalFor = goalFor, onlyBad = onlyBad, moreLink = moreLink, nextBox = nextBox, chipColors = chipColors, pickWho = pickWho, ordN = ordN, cutIdx = cutIdx, cutView = cutView, showPull = showPull, resultOf = resultOf, resetPool = resetPool, classHex = classHex, rounded = rounded, pullQ = pullQ, worst = worstFirst, col = useCol, colFrame = colFrame, two = { cols = 1, brk = 0, n = 0, marks = {} } }
local function renderOnce()
  UI.col(1)
  local raw = DB.pulls[DB.cur]; local m = UI.cutView(raw); CUR = m
  if not m then return end
  local T = UI.two; T.n = 0; T.marks = {}; T.total = nil
  -- (two columns side by side when the card is long (Oct 24): CW is one column's width, W the whole card's)
  W = WIDTHS[DB.width or "normal"] or 400; CW = T.cwc or (W - PAD * 2)
  if T.cols == 2 then W = CW * 2 + 16 + PAD * 2 elseif T.cwc then W = CW + PAD * 2 end
  card:SetWidth(W); body:SetWidth(W - PAD * 2); scroller:SetWidth(W - PAD * 2); bossT:SetWidth(W - 230); UI.colFrame(T.cols == 2, CW)
  if detailBtn then detailBtn.t:SetText(PRESET_NAME[DB.preset] or "Custom"); detailBtn:SetWidth(detailBtn.t:GetStringWidth() + 18) end
  for _, c in ipairs(chips) do c:SetShown(false) end
  local h = m.h
  UI.rounded(card.lineT, "line", 8, h.kill and COL.gold or COL.line2, 1) -- (a kill: a gold edge (Oct 25, the Design studio's round 3))
  bossT:SetText(h.boss .. "  ·  " .. h.diff)
  -- chips: this boss and difficulty only (Oct 24: other bosses' pulls read as a second "Pull 1"), as many as fit, around the one on screen
  local IX = {}; for k0, q0 in ipairs(DB.pulls) do if q0.h and q0.h.boss == h.boss and q0.h.diff == h.diff then IX[#IX + 1] = k0 end end
  local pos = #IX; for i0, k0 in ipairs(IX) do if k0 == DB.cur then pos = i0 end end
  local last = math.min(#IX, pos + 1)
  local first = math.max(1, last - #chips + 1)
  local chipsOn = (DB.show or {}).chips ~= false and #IX > 1 -- (one pull of this boss: no row of one button, as in the pop-up (Oct 24))
  if chipsOn then
    local function chipW(q) local rt = UI.resultOf(q.h); chips[1].t:SetText("Pull " .. q.h.pull .. "  ·  " .. rt); return chips[1].t:GetStringWidth() + 20 end
    local total = 0; for j = first, last do total = total + chipW(DB.pulls[IX[j]]) + 6 end
    while first < pos and total - 6 > W - PAD * 2 do total = total - chipW(DB.pulls[IX[first]]) - 6; first = first + 1 end
    while last > pos and total - 6 > W - PAD * 2 do total = total - chipW(DB.pulls[IX[last]]) - 6; last = last - 1 end
  end
  local n = last
  for i = 1, #chips do
    local b, j = chips[i], first + i - 1
    local k = IX[j]
    local q = j <= n and k and DB.pulls[k] or nil
    if q and chipsOn then
      local rt, rc, rb = UI.resultOf(q.h)
      b.t:SetText("Pull " .. q.h.pull .. "  ·  " .. rt)
      UI.chipColors(b, COL.raised, k == DB.cur and COL.gold or COL.line2, UI.pullQ(q.h)) -- (coloured by how far it got; the open one ringed gold (Oct 25))
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
  if DB.detailed and not DB.compact and view == "raid" and #(m.raid.tiles or {}) > 0 then meta = { h.diff, "Pull " .. h.pull } end
  metaT:SetWidth(W - PAD * 2); metaT:SetText(table.concat(meta, "   ·   "))
  -- (tabs and the body sit lower when the pull chips show)
  local coachOn = m.coach and (m.coach.head or "") ~= "" and not m.h.practice and (DB.show or {}).coach ~= false -- (Debriefing's coach box on every style, with the Raid view and You tabs; the style decides how much is open (Oct 22))
  local glanceOn = DB.glance and (m.raid.ghead or "") ~= "" and not coachOn -- (the Glance card: one view, so no tabs; older pulls without it keep the tabs)
  -- (no "Raid view first" any more (Oct 24): the card opens on Me, like the pop-up; Raid view is one click)
  TOPY = (chipsOn and 180 or 150) - (glanceOn and 38 or 0)
  tMe:ClearAllPoints(); tMe:SetPoint("TOPLEFT", card, "TOPLEFT", PAD - 10, -TOPY + 38); tRaid:ClearAllPoints(); tRaid:SetPoint("LEFT", tMe, "RIGHT", 0, 0)
  nextB:ClearAllPoints(); nextB:SetPoint("TOPRIGHT", card, "TOPRIGHT", -PAD, -TOPY + 36)
  tabLine:ClearAllPoints(); tabLine:SetPoint("TOPLEFT", card, "TOPLEFT", 1, -TOPY + 12); tabLine:SetPoint("TOPRIGHT", card, "TOPRIGHT", -1, -TOPY + 12)
  scroller:ClearAllPoints(); scroller:SetPoint("TOPLEFT", card, "TOPLEFT", PAD, -TOPY)
  -- tabs
  local raidOk = not m.h.dungeon -- (the Raid view is everyone's, no raid sharing (Oct 25); a dungeon boss has none (Oct 24))
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
  if P then who:SetWidth(W - PAD * 2 - 190); who:SetText("|cff" .. UI.classHex(P.cls) .. P.name .. "|r"); who:SetWidth(math.min(W - PAD * 2 - 190, math.max(40, who:GetStringWidth() + 4))) end -- (the arrows sit right beside the name (Oct 24))
  local function step(dir)
    local idx = 1; for i, p in ipairs(m.players) do if p == P then idx = i end end
    idx = ((idx - 1 + dir) % #m.players) + 1; DB.who = m.players[idx].name; render()
  end
  prevB:SetScript("OnClick", function() step(-1) end); nextB:SetScript("OnClick", function() step(1) end)

  -- body
  UI.resetPool()
  local y = 2
  local SH = DB.show or {}
  -- (a section edge (Oct 24): noted on every draw; on the two-column draw, the chosen one starts the right column)
  local function brk()
    T.n = T.n + 1; T.marks[T.n] = y
    if T.cols == 2 and T.n == T.brk then T.lh = y; UI.col(2); y = 2 end
  end
  -- a panel behind a section, in the chosen card style: Panels (soft boxes), Glass (see-through) or Flat (a line under)
  local function panel(y0, hh)
    if DB.cardStyle == "flat" then local l = TEX("ARTWORK"); l:SetPoint("TOPLEFT", 0, -(y0 + hh)); l:SetSize(CW, 1); fill(l, COL.line)
    else box(y0, hh, COL.raised, DB.cardStyle == "glass" and 0.55 or 1, COL.line, 1) end
  end
  -- a section: its heading folds it away (+ / -), and a "Show N more" line expands a long list
  local function section(key, title, list, limit, draw, empty, tail)
    if SH[key] == false then return end
    brk()
    -- (closed at first on Standard, the count in the title; a tap opens it for this pull (EXPANDED is cleared with each new pull))
    local shut = UI.startsShut(key, #list)
    local folded = (shut and not EXPANDED["o:" .. key]) or (not shut and DB.collapsed and DB.collapsed[key])
    if shut and folded then title = title .. "  ·  " .. #list .. (key == "rotation" and (#list == 1 and " tip" or " tips") or "") end
    local y0 = y; IND = 12; y = y + 12
    y = head(y, title, key, folded, shut and function() EXPANDED["o:" .. key] = not EXPANDED["o:" .. key] or nil; render() end or nil)
    if not folded then
      if #list == 0 then if empty then y = row(y, "ok", nil, empty) end
      else
        local n = EXPANDED[key] and #list or math.min(#list, limit)
        for i = 1, n do draw(list[i]) end
        if #list > n then y = UI.moreLink(y, key, #list - n) end
      end
      if tail then tail() end
    end
    y = y + 3
    panel(y0, y - y0)
    IND = 0; y = y + 10
  end
  -- (who died, on both views, with the wipe filter on the right: Stop at − n +. On a wipe nothing after that death counts:
  -- mistakes, mechanics, deaths. 0 is off, the whole pull. A kill always counts in full)
  -- (the raid's survival in one section (Oct 22 audit): defensives, Healthstones and potions, deaths with one unused; each keeps its switch)
  local function survRaid()
    local L = {}
    for _, k in ipairs({ { "rdefs", "defs" }, { "rcons", "cons" } }) do --[[ (deaths with a stone unused are in Deaths now (Oct 24)) ]] if SH[k[1]] ~= false then for _, r in ipairs(m.raid[k[2]] or {}) do L[#L + 1] = r end end end
    if #L > 0 then UI.worst(L); section("rsurv", "Survival", L, 4, function(r) y = row(y, r[1], r[2], r[3]) end) end
  end
  local function diedRow()
    if DB.compact then return end
    brk()
    local nd, show, cut = #m.raid.died, DB.maxDied or 3, UI.cutIdx(raw)
    local y0 = y; IND = 12; y = y + 12
    local t = FS("head", 15, COL.text); t:SetPoint("TOPLEFT", IND, -y); t:SetText("Who died")
    local c = FS("body", 12.5, COL.faint); c:SetPoint("BOTTOMLEFT", t, "BOTTOMRIGHT", 8, 1); c:SetText((DB.detailed and view == "raid" and #(m.raid.tiles or {}) > 0) and "" or (h.deaths .. (h.deaths == "1" and " death" or " deaths")))
    -- (closed at first on Standard (Oct 25), like the other sections: a tap opens it for this pull)
    local shut = UI.startsShut("died", nd); local open = not shut or EXPANDED["o:died"]
    if shut then
      local sign = FS("bold", 14, COL.faint); sign:SetJustifyH("RIGHT"); sign:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - IND, -(y - 1)); sign:SetText(open and "–" or "+")
      local b = BTN(); b:SetPoint("TOPLEFT", 0, -(y - 8)); b:SetSize(CW, 30)
      b:SetScript("OnClick", function() EXPANDED["o:died"] = not EXPANDED["o:died"] or nil; render() end)
      b:SetScript("OnEnter", function() t:SetTextColor(rgb(COL.gold)); sign:SetTextColor(rgb(COL.gold)) end); b:SetScript("OnLeave", function() t:SetTextColor(rgb(COL.text)); sign:SetTextColor(rgb(COL.faint)) end)
    end
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
      local l = FS("body", 12.5, COL.faint); l:SetJustifyH("RIGHT"); l:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - IND - (shut and 22 or 0), -(y + 2)); l:SetText("Kill, so all of it counts")
    end
    y = y + (open and 26 or 18)
    if open then
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
    brk()
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
  local function fold(key, title, n, extra, tip)
    DB.coachOpen = DB.coachOpen or {}
    local open = DB.coachOpen[key]; if open == nil then open = DB.preset == "detailed" end
    local t = FS("bold", 12, COL.muted); t:SetPoint("TOPLEFT", 14, -(y + 11)); t:SetText(title .. (n and n > 0 and ("  ·  " .. n) or "") .. ((extra or "") ~= "" and ("  ·  " .. extra) or ""))
    local sign = FS("bold", 14, COL.faint); sign:SetJustifyH("RIGHT"); sign:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - 14, -(y + 9)); sign:SetText(open and "–" or "+")
    local b = BTN(); b:SetPoint("TOPLEFT", 0, -y); b:SetSize(CW, 32)
    b:SetScript("OnClick", function() DB.coachOpen[key] = not open; render() end)
    b:SetScript("OnEnter", function() t:SetTextColor(rgb(COL.gold)); sign:SetTextColor(rgb(COL.gold)); if tip then GameTooltip:SetOwner(b, "ANCHOR_TOP"); GameTooltip:SetText(tip, 0.9, 0.9, 0.9, 1, true); GameTooltip:Show() end end)
    b:SetScript("OnLeave", function() t:SetTextColor(rgb(COL.muted)); sign:SetTextColor(rgb(COL.faint)); GameTooltip:Hide() end)
    return open
  end
  -- (a row in Deaths or Avoidable damage: click it for its short story under it)
  local STORY = CARD_STORY or {}; CARD_STORY = STORY
  -- (cx, cw: a column of a two-column list; grid: the list moves y on and opens the stories itself)
  local function chipRow(key, parts, idv, story, cx, cw, grid)
    cx = cx or 0; cw = cw or CW
    local x = 14 + cx
    for _, pt in ipairs(parts) do
      if pt.icon then icon(x, y + 4, 18, pt.icon); x = x + 24
      elseif pt.dot then local d = TEX("ARTWORK"); d:SetTexture(SLICE .. "dot"); d:SetPoint("TOPLEFT", x, -(y + 9)); d:SetSize(8, 8); d:SetVertexColor(rgb(pt.dot)); x = x + 15
      else local f = FS(pt.bold and "bold" or "body", 13.5, pt.col or COL.soft); f:SetPoint("TOPLEFT", x, -(y + 5)); f:SetWordWrap(false); f:SetText(pt.t)
        local room = cx + cw - 8 - x; if f:GetStringWidth() > room then f:SetWidth(math.max(20, room)) end; x = x + math.min(f:GetStringWidth(), math.max(20, room)) + (pt.gap or 8) end
    end
    local open = STORY[key]
    if story and story ~= "" then
      local b = BTN(); b:SetPoint("TOPLEFT", cx, -y); b:SetSize(cw, 26)
      b:SetScript("OnClick", function() STORY[key] = not STORY[key] or nil; render() end)
      local sg = FS("bold", 13, COL.faint); sg:SetJustifyH("RIGHT"); sg:SetPoint("TOPRIGHT", body, "TOPLEFT", cx + cw - 12, -(y + 5)); sg:SetText(open and "–" or "+")
      b:SetScript("OnEnter", function() sg:SetTextColor(rgb(COL.gold)) end); b:SetScript("OnLeave", function() sg:SetTextColor(rgb(COL.faint)) end)
    end
    if grid then return end
    y = y + 27
    if open and story and story ~= "" then
      local f = FS("body", 13, COL.muted); f:SetPoint("TOPLEFT", 38, -y); f:SetWidth(CW - 52); f:SetText(paint(story)); y = y + f:GetStringHeight() + 10
    end
  end
  -- (a list of rows: one column, or on a wide card two, reading down the left column first; mk(item) gives parts, spell, story)
  local function chipList(pre, list, mk)
    if CW < 520 or #list < 4 then for i, it in ipairs(list) do local p, id, st = mk(it); chipRow(pre .. i, p, id, st) end; return end
    local half, hw = math.ceil(#list / 2), math.floor(CW / 2)
    for r = 1, half do
      local y0 = y
      for col = 0, 1 do local i = r + col * half; local it = list[i]; if it then local p, id, st = mk(it); chipRow(pre .. i, p, id, st, col * hw, col == 0 and hw or CW - hw, true) end end
      y = y0 + 27
      for col = 0, 1 do local i = r + col * half; local it = list[i]
        if it and STORY[pre .. i] then local _, _, st = mk(it); if st and st ~= "" then local f = FS("body", 13, COL.muted); f:SetPoint("TOPLEFT", 38, -y); f:SetWidth(CW - 52); f:SetText(paint(st)); y = y + f:GetStringHeight() + 10 end end end
    end
  end
  -- (Debriefing's coach box, the Raid view)
  local function coachBody()
    local c = m.coach
    local lab = FS("bold", 11.5, COL.gold); lab:SetPoint("TOPLEFT", 2, -y); lab:SetText("YOUR RAID LEAD SAYS"); y = y + 19
    local hd = FS("head", 16.5, COL.text); hd:SetPoint("TOPLEFT", 2, -y); hd:SetWidth(CW - 4); hd:SetText(paint(c.head)); y = y + hd:GetStringHeight() + 12
    -- (like the website (Oct 23): the focus that is a card's fix lives on that card, labelled FOCUS NEXT PULL, with no separate box)
    local focI; if false then local fk = c.focus:gsub("%.$", ""); for i, x in ipairs(c.wrong) do if i <= math.max(1, DB.maxRaid or 3) and ((x.fix or ""):gsub("%.$", "")) == fk then focI = i; break end end end
    if false then -- (no Next pull box, like the website (Oct 23))
      local ft = FS("bold", 14, COL.text); ft:SetWidth(CW - 32); ft:SetText(paint(c.focus))
      local hh = 11 + 18 + ft:GetStringHeight() + 12
      box(y, hh, COL.gold, 0.08, COL.gold, 0.55)
      local l = FS("bold", 11.5, COL.gold); l:SetPoint("TOPLEFT", 16, -(y + 11)); l:SetText(c.kill and "FOCUS NEXT WEEK" or "FOCUS NEXT PULL")
      ft:SetPoint("TOPLEFT", 16, -(y + 29)); y = y + hh + 14
    end
    local cardsOn = c.cards or c.root -- (the website's four cards (Oct 23); older pulls keep the list)
    if cardsOn then y = UI.trendCards(y, c, paint) end
    if #c.wrong > 0 then brk() end
    if #c.wrong > 0 then
      local wOpen = true
      if cardsOn then local y0 = y; wOpen = fold("cwrong", "EVERY MISTAKE, IN DETAIL", #c.wrong + (c.more or 0)); y = y + 34; if not wOpen then y = y - 2 end
      else local l = FS("bold", 11.5, COL.muted); l:SetPoint("TOPLEFT", 2, -y); l:SetText("MISTAKES"); y = y + 20 end
      local cap = #c.wrong -- (every major mistake, like the website (Oct 23))
      for i, x in ipairs(wOpen and c.wrong or {}) do
        if i > cap then
          local mt = FS("body", 12.5, COL.faint); mt:SetPoint("TOPLEFT", 2, -(y + 1)); mt:SetText((#c.wrong - cap) .. " more in the full coaching on the website."); y = y + 20
          break
        end
        if i > 1 then brk() end -- (a long list of mistakes can carry on at the top of the right column)
        local sev = x.sev == "bad" and COL.bad or COL.warn
        local tx, tw = 44, CW - 44 - 14
        -- (like the site's card (Oct 22): closed it is the title, tags and Next time; a click opens What happened, How and Against
        -- top guilds. Detailed opens the first one)
        DB.coachOpen = DB.coachOpen or {}
        local okey = "cw" .. i; local op = DB.coachOpen[okey]; if op == nil then op = DB.preset == "detailed" and i == 1 end
        local more = {}
        if (x.what or "") ~= "" then more[#more + 1] = { "WHAT HAPPENED", x.what } end
        if (x.how or "") ~= "" then more[#more + 1] = { "HOW", x.how } end
        if (x.kb or "") ~= "" then more[#more + 1] = { "AGAINST TOP GUILDS", x.kb } end
        local LW = (op and #more > 0) and 136 or 76; if focI == i then LW = math.max(LW, 124) end
        local lt = FS("bold", 14.5, COL.text); lt:SetWordWrap(false); lt:SetText(x.label)
        local pt; if (x.tag or "") ~= "" then pt = FS("bold", 11.5, x.sev == "bad" and COL.badT or COL.warn); pt:SetWordWrap(false); pt:SetText(x.tag) end
        local nk = FS("bold", 11.5, COL.gold); nk:SetText(focI == i and (c.kill and "FOCUS NEXT WEEK" or "FOCUS NEXT PULL") or "NEXT TIME")
        local fx = FS("body", 13.5, COL.soft); fx:SetWidth(tw - LW); fx:SetText(paint(x.fix))
        local rows = {}
        if op then for _, mr in ipairs(more) do local a = FS("bold", 11.5, COL.muted); a:SetText(mr[1]); local b2 = FS("body", 13, COL.muted); b2:SetWidth(tw - LW); b2:SetText(paint(mr[2])); rows[#rows + 1] = { a, b2 } end end
        local hh = 12 + 22 + math.max(16, fx:GetStringHeight()) + 12
        for _, rw in ipairs(rows) do hh = hh + math.max(16, rw[2]:GetStringHeight()) + 6 end
        box(y, hh, COL.raised, DB.cardStyle == "glass" and 0.55 or 1, COL.line, 1, sev)
        if #more > 0 then
          local bt = BTN(); bt:SetPoint("TOPLEFT", 0, -y); bt:SetSize(CW, hh); bt:SetScript("OnClick", function() DB.coachOpen[okey] = not op; render() end)
          local ch = FS("bold", 14, COL.faint); ch:SetJustifyH("RIGHT"); ch:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - 14, -(y + 13)); ch:SetText(op and "–" or "+")
          bt:SetScript("OnEnter", function() ch:SetTextColor(rgb(COL.gold)) end); bt:SetScript("OnLeave", function() ch:SetTextColor(rgb(COL.faint)) end)
        end
        local d = TEX("ARTWORK"); d:SetTexture(SLICE .. "dot"); d:SetPoint("TOPLEFT", 12, -(y + 13)); d:SetSize(22, 22); d:SetVertexColor(rgb(sev)); d:SetAlpha(0.25)
        local nn = FS("bold", 12.5, sev); nn:SetPoint("CENTER", d, "CENTER", 0, 0); nn:SetText(tostring(i))
        local lx = tx; if (x.id or "") ~= "" then icon(tx, y + 12, 20, x.id); lx = tx + 26 end
        lt:SetPoint("TOPLEFT", lx, -(y + 14)); lt:SetWidth(math.min(lt:GetStringWidth() + 2, tw - (lx - tx) - (pt and 110 or 0) - 20))
        if pt then pt:SetPoint("LEFT", lt, "RIGHT", 10, 0) end
        local yy = y + 12 + 22
        nk:SetPoint("TOPLEFT", tx, -(yy + 2)); fx:SetPoint("TOPLEFT", tx + LW, -yy); yy = yy + math.max(16, fx:GetStringHeight()) + 6
        for _, rw in ipairs(rows) do rw[1]:SetPoint("TOPLEFT", tx, -(yy + 2)); rw[2]:SetPoint("TOPLEFT", tx + LW, -yy); yy = yy + math.max(16, rw[2]:GetStringHeight()) + 6 end
        y = y + hh + 8
      end
      if wOpen and (c.more or 0) > 0 then local mt = FS("body", 12.5, COL.faint); mt:SetPoint("TOPLEFT", 4, -(y - 2)); mt:SetText("+" .. c.more .. (c.more == 1 and " smaller one" or " smaller ones")); y = y + 18 end
      y = y + 4
    end
    for _, x in ipairs((DB.compact or SH.right == false or c.cards or c.root) and {} or c.right) do -- (the What we did well card has these when the cards are on)
      local ok = TEX("ARTWORK"); ok:SetTexture("Interface\\RaidFrame\\ReadyCheck-Ready"); ok:SetPoint("TOPLEFT", 4, -(y + 2)); ok:SetSize(16, 16)
      local f = FS("body", 13.5, COL.goodT); f:SetPoint("TOPLEFT", 26, -(y + 1)); f:SetWidth(CW - 30); f:SetText(paint(x.t)); y = y + math.max(18, f:GetStringHeight()) + 7
    end
    y = y + 6
    -- deaths, folded until clicked
    if SH.cdeaths ~= false and (#c.deaths > 0 or (c.dline or "") ~= "") then
      brk()
      local on = (c.dnote or ""):match("(%d+) of %d+ deaths? on the player"); local aft = (c.dnote or ""):match("(%d+) more after")
      local y0 = y; local open = fold("cdeaths", "DEATHS", #c.deaths, on and (on .. " on the player" .. (aft and ("  ·  " .. aft .. " not counted") or "")) or nil, "Red: on the player (their own mistake, or a slow death with something ready). Amber: half on them. Grey: not on them. Click a death for why."); y = y + 32
      if open then
        if #c.deaths == 0 then local f = FS("body", 13, COL.muted); f:SetPoint("TOPLEFT", 14, -y); f:SetWidth(CW - 28); f:SetText(paint(c.dline)); y = y + f:GetStringHeight() + 8 end
        chipList(m.h.pull .. "d", c.deaths, function(d) local parts = { { t = d.t, col = COL.faint, gap = 6 }, { dot = KCOL[d.k] or COL.faint }, { t = d.who, bold = true, col = UI.classHex(d.cls), gap = 8 }, { icon = d.id }, { t = d.ab } }
          -- (something that could have saved them, still unused (Oct 24): "Healthstone unused", or "3 unused")
          if (d.ready or "") ~= "" then local n, one = 0, nil; for x in d.ready:gmatch("[^;]+") do n = n + 1; one = one or x end; parts[#parts + 1] = { t = one .. (n > 1 and (" +" .. (n - 1)) or "") .. " unused", col = COL.warn } end
          return parts, d.id, d.story end)
        if (c.dnote or "") ~= "" and not on then local f = FS("body", 12, COL.faint); f:SetPoint("TOPLEFT", 14, -(y + 2)); f:SetWidth(CW - 28); f:SetText(c.dnote); y = y + f:GetStringHeight() + 6 end
        -- (no "click" hint line: each row has its + (Oct 22 audit))
        y = y + 4
      end
      panel(y0, y - y0); y = y + 8
    end
    -- avoidable damage, folded until clicked
    if SH.cavoid ~= false and (#c.avoid > 0 or (c.aline or "") ~= "") then
      brk()
      local y0 = y; local open = fold("cavoid", "AVOIDABLE DAMAGE", #c.avoid, nil, "Damage you could have dodged, judged against top guilds. Click one for what happened."); y = y + 32
      if open then
        if #c.avoid == 0 then local f = FS("body", 13, COL.muted); f:SetPoint("TOPLEFT", 14, -y); f:SetWidth(CW - 28); f:SetText(paint(c.aline)); y = y + f:GetStringHeight() + 8 end
        chipList(m.h.pull .. "a", c.avoid, function(a) return { { icon = a.id }, { t = a.k }, { t = a.who, bold = true, col = UI.classHex(a.cls), gap = 6 }, { t = a.n, col = a.bad and COL.badT or COL.warn } }, a.id, a.story end)
        -- (no "click" hint line here either)
        y = y + 4
      end
      panel(y0, y - y0); y = y + 8
    end
    -- (no "full coaching is on the website" line (Oct 22 audit))
  end
  -- (your own coach: the You view opens with it)
  -- (one box (Oct 22 audit): how your pull went in a few words, then your fixes for next pull, numbered; no second Next pull box)
  local coachDrew = false
  local function youCoach(P)
    if not (P and P.coach and (P.coach.head or "") ~= "") then return false end
    local verdict = P.coach.head:match("^(.-)%s*Your one fix:") or P.coach.head
    if verdict:sub(1, #P.name + 2) == P.name .. ", " then verdict = verdict:sub(#P.name + 3) end
    verdict = verdict:gsub("^%l", string.upper); verdict = verdict:gsub(", and one thing to fix first", ""):gsub(", with one thing to sharpen", "") -- (the list below says how many)
    local tips = {}
    -- (the same tip twice, one with an extra sentence, counts once: compared by its first sentence)
    local function first(x) return ((x:match("^(.-)[%.!%?]%s") or x):gsub("[%.!%?]$", "")) end
    local function addTip(s) s = s or ""; if s == "" then return end; local k = first(s); for _, q in ipairs(tips) do if first(q) == k then return end end; tips[#tips + 1] = s end
    addTip(P.coach.focus); if SH.next ~= false then addTip(P.next); if DB.detailed then addTip(P.next2) end end
    local t = FS("body", 13.5, COL.soft); t:SetWidth(CW - 34); t:SetText(paint(verdict))
    local list = {}; for i, s in ipairs(tips) do list[i] = (#tips > 1 and (i .. ". ") or "") .. s end
    local f; if #list > 0 then f = FS("bold", 14, COL.text); f:SetWidth(CW - 34); f:SetText(paint(table.concat(list, "\n"))) end
    local hh = 12 + 17 + t:GetStringHeight() + (f and (12 + 16 + f:GetStringHeight()) or 0) + 12
    box(y, hh, COL.gold, 0.07, COL.gold, 0.5, COL.gold)
    local l = FS("bold", 11.5, COL.gold); l:SetPoint("TOPLEFT", 16, -(y + 11)); l:SetText("YOUR RAID LEAD SAYS")
    t:SetPoint("TOPLEFT", 16, -(y + 28))
    if f then local k = FS("bold", 11.5, COL.gold); k:SetPoint("TOPLEFT", 16, -(y + 28 + t:GetStringHeight() + 12)); k:SetText(m.coach and m.coach.kill and "NEXT WEEK" or "NEXT PULL"); f:SetPoint("TOPLEFT", 16, -(y + 28 + t:GetStringHeight() + 28)) end
    y = y + hh + 12; coachDrew = true
    -- (your worse and better than last pull (Oct 23), like the website's cards for a player)
    if P.ctr and SH.trend ~= false and (#P.ctr.x > 0 or #P.ctr.b > 0) then
      for _, k in ipairs({ { "x", "Worse than last pull", h.kill and COL.muted or COL.warn }, { "b", "Better than last pull", h.kill and COL.muted or "5aa9ff" } }) do -- (quiet on a kill: the gold edge is the loud thing (Oct 25))
        if #P.ctr[k[1]] > 0 then local names = {}; for _, it in ipairs(P.ctr[k[1]]) do names[#names + 1] = it.nm .. ((it.tag or "") ~= "" and (" (" .. it.tag:lower() .. ")") or "") end
          local f = FS("body", 13, COL.soft); f:SetPoint("TOPLEFT", 4, -y); f:SetWidth(CW - 8); f:SetText("|cff" .. k[3] .. k[2] .. ":|r " .. paint(table.concat(names, ", "))); y = y + f:GetStringHeight() + 6 end
      end
      y = y + 6
    end
    return true
  end
  -- (the wipe filter on top of the card (Oct 22): it decides what everything under it counts, the coach box included)
  if raw.cutN and not m.h.practice and (raw.wc or SH.stopat ~= false) then -- (the wipe call line always shows)
    local y0 = y; IND = 12; y = y + 10
    local function stepBtn(lbl, right, d)
      local bt = BTN(); bt:SetSize(22, 22); bt:SetPoint("TOPRIGHT", body, "TOPLEFT", right, -(y - 2))
      local bg = RT("BORDER"); bg:SetAllPoints(bt); UI.rounded(bg, "fill", 5, COL.bg, 1)
      local tx = FS("bold", 12.5, COL.muted); tx:SetPoint("CENTER", bt, "CENTER", 0, 0); tx:SetText(lbl)
      bt:SetScript("OnClick", function() DB.deathCut = math.max(0, math.min(8, (DB.deathCut or 0) + d)); wipe(EXPANDED); if Debrief_RefreshOptions then Debrief_RefreshOptions() end; render(); if big and big:IsShown() and bigRender then bigRender() end end)
      bt:SetScript("OnEnter", function() tx:SetTextColor(rgb(COL.gold)) end); bt:SetScript("OnLeave", function() tx:SetTextColor(rgb(COL.muted)) end)
    end
    local cut = UI.cutIdx(raw)
    if raw.wc then y = y + (UI.wipeRow(y, raw, function() wipe(EXPANDED); if Debrief_RefreshOptions then Debrief_RefreshOptions() end; render(); if big and big:IsShown() and bigRender then bigRender() end end) or 0) else
    local t = FS("bold", 13, COL.text); t:SetPoint("TOPLEFT", IND, -(y + 2)); t:SetText("Stop at death")
    stepBtn("+", CW - IND, 1)
    local v = FS("bold", 13, COL.text); v:SetJustifyH("CENTER"); v:SetWidth(28); v:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - IND - 23, -(y + 2)); v:SetText((DB.deathCut or 0) == 0 and "off" or (DB.deathCut .. ""))
    stepBtn("–", CW - IND - 52, -1)
    -- (one line (Oct 22 audit): what it counts to, beside the name; the explanation on hover)
    local note
    if cut > 0 then local d = raw.raid.died[cut]; note = d and ("counted to " .. d[2] .. ", " .. d[1]) or ("counted to the " .. UI.ordN(cut) .. " death")
    elseif (DB.deathCut or 0) > 0 then note = "fewer deaths, so all of it counts"
    else note = "off, all of it counts" end
    local n2 = FS("body", 12.5, COL.faint); n2:SetPoint("LEFT", t, "RIGHT", 10, 0); n2:SetWordWrap(false); n2:SetWidth(math.max(40, CW - IND * 2 - 120 - t:GetStringWidth())); n2:SetText(note)
    local tb = BTN(); tb:SetPoint("TOPLEFT", 0, -(y - 2)); tb:SetSize(math.max(60, CW - 96), 24)
    tb:SetScript("OnEnter", function() GameTooltip:SetOwner(tb, "ANCHOR_TOP"); GameTooltip:SetText("Stop at death", 1, 1, 1); GameTooltip:AddLine("On a wipe, nothing after this death counts, so the mess at the end isn't held against anyone. Press + or - to change it.", 0.8, 0.82, 0.86, true); GameTooltip:Show() end)
    tb:SetScript("OnLeave", function() GameTooltip:Hide() end)
    end
    y = y + 28
    panel(y0, y - y0); IND = 0; y = y + 10
  end
  -- (the Report card grade and the small charts, when their chips are on in the settings (Oct 22))
  if SH.grade and m.grade and not m.h.practice then y = UI.cardGrade(y, m.grade) end
  if (SH.chartNight or SH.chartLine) and not m.h.practice then y = UI.cardCharts(y, raw, P, SH) end
  if coachOn and view ~= "me" then
    coachBody()
    if SH.mechs and m.raid.mech and #m.raid.mech > 0 and (DB.maxMech or 6) > 0 then section("mech", "Boss mechanics", m.raid.mech, DB.maxMech or 6, function(r) y = row(y, r[1], r[2], r[4], r[3]) end) end
    survRaid()
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
      local s = FS("body", 12.5, COL.faint); s:SetJustifyH("RIGHT"); s:SetPoint("TOPRIGHT", body, "TOPLEFT", CW - 12, -(y + 11)); s:SetWidth(CW - 170); s:SetWordWrap(true) -- (every line shown, none cut off with "…" (Oct 24))
      local lines = {}
      if P.d and SH.vs ~= false then lines[#lines + 1] = (P.d >= 0 and ("|cff7ee08f+" .. P.d .. "%|r") or ("|cffff8f87" .. P.d .. "%|r")) .. " vs pull " .. P.vs end
      if SH.best ~= false then lines[#lines + 1] = (P.bt and ("|cff7ee08fYour best tonight|r" .. (P.best ~= "" and (" (was " .. P.best .. ", pull " .. P.bp .. ")") or "")) or P.best ~= "" and ("Best " .. P.best .. " (pull " .. P.bp .. ")") or "First pull read") end
      if P.rank ~= "" and SH.rank ~= false then lines[#lines + 1] = P.rank end
      s:SetText(table.concat(lines, "\n"))
      local need = 11 + s:GetStringHeight() + 10; if need > th then local bump = need - th; th = need; panel(y, th) end
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
    if (DB.detailed or DB.tiles) and not DB.compact and P.tiles and #P.tiles > 0 then y = tilesRow(y, P.tiles) end
    if not DB.compact then
      local rot = P.rot and function() section("rotation", "Rotation" .. ((P.rs and P.rs.score) and ("  ·  " .. P.rs.score .. "/100") or ""), P.rot, DB.maxSlips or 3, function(r) local k = "rt:" .. (r[3] or ""); local o = STORY[k]; if o == nil then o = DB.preset == "detailed" and r == P.rot[1] end; y = UI.rotRow(y, r, o, function() STORY[k] = not o; render() end) end, "Nothing to fix here.", function() y = UI.rotGood(y, P.rs) end) end
      or function() section("rotation", "Rotation", UI.onlyBad(P.slips), DB.maxSlips or 3, function(r) y = UI.rowS(y, r) end, #P.slips > 0 and "Nothing to fix here." or "No rotation checks for this spec yet.") end
      local bossL = P.boss
      if (DB.detailed or DB.tiles) and P.tiles and #P.tiles > 0 then bossL = {}; for _, r in ipairs(P.boss) do if not ({ ability_rogue_sprint = true, ability_kick = true, spell_holy_dispelmagic = true })[r[2]] then bossL[#bossL + 1] = r end end end
      local bos = function() section("boss", "Boss mechanics", UI.onlyBad(bossL), DB.maxBoss or 2, function(r) y = UI.rowS(y, r) end, "No boss mistakes.") end
      if m.h.practice and #P.boss == 0 then bos = function() end end -- (a training dummy has no boss mechanics)
      if DB.bossFirst then bos(); rot() else rot(); bos() end
      -- (survival: your defensives, Healthstone and health potion)
      do local L = {} -- (one Survival section (Oct 22 audit): defensives, Healthstone and potion, a death with one unused)
        if SH.surv ~= false then for _, r in ipairs(UI.onlyBad(P.surv or {})) do L[#L + 1] = r end end
        if SH.cons ~= false then for _, r in ipairs(P.cons or {}) do L[#L + 1] = r end end
        if #L > 0 then UI.worst(L); section("surv", "Survival", L, 6, function(r) y = UI.rowS(y, r) end) end end
      -- (the Detailed card: the raid's side right here, so nobody has to switch to the Raid view)
      if DB.detailed and not m.h.practice and not m.h.dungeon and not raidOk then
        summary()
        if #m.raid.bad > 0 then section("rbad", "The raid: top mistakes", m.raid.bad, DB.maxRaid or 3, function(r) y = row(y, r[1], r[2], r[4], r[3]) end) end
        if m.raid.mech and #m.raid.mech > 0 and (DB.maxMech or 6) > 0 then section("rmech", "The raid: boss mechanics", m.raid.mech, DB.maxMech or 6, function(r) y = row(y, r[1], r[2], r[4], r[3]) end) end
      end
    end
    if not m.h.practice and not (DB.detailed and raidOk) then diedRow() end -- (the death filter here too: a dummy has no deaths)
    if P.next ~= "" and SH.next ~= false and not coachDrew then y = UI.nextBox(y + 2, (DB.detailed and (P.next2 or "") ~= "") and ("1. " .. P.next .. "\n2. " .. P.next2) or P.next, m.h.dungeon and "NEXT TIME" or nil) end
  else
    leadBox(nil)
    if (DB.detailed or DB.tiles) and not DB.compact and m.raid.tiles and #m.raid.tiles > 0 then y = tilesRow(y, m.raid.tiles) end
    summary()
    section("mistakes", h.kill and "What to clean up" or "Top mistakes", m.raid.bad, DB.compact and 1 or (DB.maxRaid or 3), function(r) y = row(y, r[1], r[2], r[4], r[3]) end, "Nothing big.")
    -- (how each boss mechanic went: done right, some mistakes, or failed; worst first)
    if m.raid.mech and #m.raid.mech > 0 and (DB.maxMech or 6) > 0 then
      section("mech", "Boss mechanics", m.raid.mech, DB.compact and math.min(3, DB.maxMech or 3) or (DB.maxMech or 6), function(r) y = row(y, r[1], r[2], r[4], r[3]) end)
    end
    survRaid()
    diedRow()
    if m.raid.next ~= "" and SH.next ~= false and not ((m.raid.lead or "") ~= "" and SH.lead ~= false) then y = UI.nextBox(y + 2, m.raid.next) end
  end
  if T.cols == 2 then UI.colFrame(true, CW, y); UI.col(1); y = math.max(T.lh or 0, y) end
  body:SetHeight(math.max(10, y))
  -- (never taller than the screen: the rest scrolls, and the footer says so)
  local room = math.max(320, ((UIParent and UIParent.GetHeight and UIParent:GetHeight()) or 768) / math.max(0.5, (card.GetScale and card:GetScale()) or 1) - 60)
  local vh = math.max(10, math.min(y, room - TOPY - 42))
  T.total, T.avail, T.room = y, room - TOPY - 42, room
  scroller:SetSize(W - PAD * 2, vh)
  scroller:SetVerticalScroll(math.min((scroller:GetVerticalScroll() or 0), math.max(0, y - vh)))
  foot:SetText(y > vh + 4 and "Scroll for more  ·  /recap opens this again" or "/recap opens this again  ·  /db settings")
  footLine:ClearAllPoints(); footLine:SetPoint("TOPLEFT", card, "TOPLEFT", 1, -(TOPY + vh + 10)); footLine:SetPoint("TOPRIGHT", card, "TOPRIGHT", -1, -(TOPY + vh + 10))
  foot:ClearAllPoints(); foot:SetPoint("TOPLEFT", card, "TOPLEFT", PAD, -(TOPY + vh + 19)); foot:SetWidth(W - PAD * 2 - 130); foot:SetWordWrap(false)
  logBtn:ClearAllPoints(); logBtn:SetPoint("TOPRIGHT", card, "TOPRIGHT", -PAD, -(TOPY + vh + 15)); Debrief_LogButton()
  card:SetHeight(TOPY + vh + 42)
end
-- (the card in two columns (Oct 24): drawn once as before; then drawn again with the right column starting at the section edge that
-- leaves the two sides closest in height, like the big window's two columns. Detailed always (the user: "the detailed setup should always
-- just be 2 columns"); the other styles once the card is taller than about two-thirds of the screen)
local function renderAll()
  local T = UI.two
  T.cols, T.brk, T.cwc = 1, 0, nil
  renderOnce()
  -- (columns by style (Oct 24, the user: windows "keep switching"): Detailed, or a mix made from it, always two; the others always one;
  -- so the card is the same width every pull)
  local tall = T.total and DB.detailed and not DB.compact
  if DB.twoCol ~= false and tall then
    local cw1 = (WIDTHS[DB.width or "normal"] or 400) - PAD * 2
    local sw = ((UIParent and UIParent.GetWidth and UIParent:GetWidth()) or 1365) / math.max(0.5, (card.GetScale and card:GetScale()) or 1)
    local cwc = math.min(cw1, 452, math.floor((sw - 60 - PAD * 2 - 16) / 2))
    if cwc >= 330 then
      if cwc < cw1 then T.cwc = cwc; renderOnce() end -- (measured again at a column's width)
      local best, bh = 0, T.total or 0
      for i, yb in ipairs(T.marks) do local hh = math.max(yb, (T.total or 0) - yb + 2); if yb > 60 and hh < bh then best, bh = i, hh end end
      T.cols, T.brk = 2, best; renderOnce() -- (nowhere to split: still two columns wide, everything on the left, so the width never changes)
    end
  end
  if Debrief_FitPreview then Debrief_FitPreview() end
end
-- (a problem while drawing is noted, not thrown (Oct 24): the card stays as it was)
function render() local ok, err = pcall(renderAll); if not ok then Debrief_NoteError(err) end; if Debrief_BringShow then Debrief_BringShow() end end

-- ---------- keeping pulls, showing the card ----------
local function sameAs(a, b) return a.h.boss == b.h.boss and a.h.pull == b.h.pull and a.h.dur == b.h.dur end
-- (which copy of the same pull is newer: the addon version its app carried, then the app's own version; a copy without them is oldest)
local function verN(v) local a, b, c = tostring(v or ""):match("(%d+)%.(%d+)%.?(%d*)"); return a and (tonumber(a) * 1000000 + tonumber(b) * 1000 + (tonumber(c) or 0)) or 0 end
local function newerCopy(m, q) local a, b = verN(m.addonV), verN(q.addonV); if a ~= b then return a > b end; return verN(m.appV) > verN(q.appV) end
local function addPull(m, own)
  -- (only your latest practice pull is kept (Oct 24): a new one replaces the one before)
  if m.h and m.h.diff == "Practice" then for i = #DB.pulls, 1, -1 do local q = DB.pulls[i]; if q.h and q.h.diff == "Practice" and not sameAs(q, m) then table.remove(DB.pulls, i) end end end
  for i, q in ipairs(DB.pulls) do if sameAs(q, m) then
    -- (your app saved it again after an update (Oct 24): the newer copy wins, in the same place, so old pulls get the new look)
    if own and newerCopy(m, q) then m.t = q.t; m.own = true; DB.pulls[i] = m; DB.cur = i; wipe(EXPANDED); return false, true end
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
  -- (the card, always (Oct 24, the user: "there is no variation to the recap window"); Expand on it opens the big window)
  if DB.mini then card:Hide(); miniShow()
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
-- (what combat hid stays closed (Oct 24, the user: "no card popping back after combat"): it came back with the previous pull, while the
-- PC pop-up showed the new one; /recap opens it again)
function Debrief_CombatEnd()
  hidCard, hidMini, hidBig = false, false, false
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
  mChip.t:SetText(rt); mChip.t:SetTextColor(rgb(pullQ(m.h))); mChip:SetWidth(mChip.t:GetStringWidth() + 16) -- (by how far the pull got (Oct 25))
  rounded(mChip.fillT, "fill", 5, COL.raised, 1); rounded(mChip.lineT, "line", 5, COL.line2, 1)
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
  for _, k in ipairs({ { "me", "Me" }, { "raid", "Raid view" } }) do
    local b = bBTN(bm); local tt = bFS(bm, "bold", 14, bView == k[1] and COL.text or COL.muted); tt:SetText(k[2])
    b:SetSize(tt:GetStringWidth() + 20, 28); b:SetPoint("TOPLEFT", tx, -y); tt:SetPoint("CENTER", b, "CENTER", 0, 1); tx = tx + tt:GetStringWidth() + 20
    if bView == k[1] then local u = bTEX(bm); u:SetPoint("BOTTOMLEFT", b, "BOTTOMLEFT", 8, 0); u:SetPoint("BOTTOMRIGHT", b, "BOTTOMRIGHT", -8, 0); u:SetHeight(2); fill(u, COL.gold) end
    b:SetScript("OnClick", function() bView = k[1]; bigRender() end)
  end
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
      { "Best tonight", (P.bt or P.best == "") and P.v or P.best, "", (P.bt or P.bp == "") and "this pull" or ("pull " .. P.bp) },
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
  if Debrief_PreviewFix then Debrief_PreviewFix() end
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

-- ---------- settings: the website's look (tabs with a gold underline, rows with a plain line each, slim controls) ----------
-- /debrief options, the AddOns button by the minimap, or Options > AddOns > Debrief. Every change saves and shows at once.
local opt
local refreshers = {}
local FONT_CHOICES = { { "debrief", "Debrief (website)" }, { "wow", "WoW default" }, { "arial", "Arial Narrow" }, { "morpheus", "Morpheus headings" } }
local WIDTH_CHOICES = { { "narrow", "Narrow" }, { "normal", "Normal" }, { "wide", "Wide" }, { "large", "Large" }, { "xl", "Extra wide" } }
function Debrief_FitPreview()
  local host = (opt and opt:IsShown() and opt) or (DebriefTutorial and DebriefTutorial:IsShown() and DebriefTutorial) or nil -- (the settings, or the guided setup (Oct 24))
  if not (host and card:IsShown()) then return end
  local avail = ((UIParent and UIParent:GetWidth()) or 1600) - ((host:GetRight() or 900) * (host:GetEffectiveScale() or 1) / ((UIParent and UIParent:GetEffectiveScale()) or 1)) - 24
  local w = (card:GetWidth() or 400) * (DB.scale or 1)
  card:SetScale((w > avail and avail > 200) and math.max(0.55, (DB.scale or 1) * avail / w) or (DB.scale or 1))
end
local optDirty = false -- (a /db change your PC pop-up sees only after a /reload (Oct 24))
local function applySettings()
  if (opt and opt:IsShown()) or (DebriefTutorial and DebriefTutorial:IsShown()) then
    optDirty = true; if opt and opt.f1 then opt.f1:SetText("Saved  ·  /reload sends it to your PC pop-up") end
  end
  reapplyFonts()
  card:SetScale(DB.scale or 1); big:SetScale(DB.bigScale or 1); mini:SetScale(DB.miniScale or 1)
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
-- (the settings window, sleek like the website (Oct 22); one page since Oct 25 (the Design studio): how much to see, four everyday rows,
-- and the rest in folds under Customize, each with a plain line of what's inside; thin rows, the longer word on the little i, gold for on)
local OW, OH = 430, 680
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
  -- (a soft gold glow from the logo's corner)
  local glow = opt:CreateTexture(nil, "BACKGROUND", nil, -5); glow:SetPoint("TOPLEFT", 1, -1); glow:SetPoint("TOPRIGHT", -1, -1); glow:SetHeight(80)
  if glow.SetGradient and CreateColor then glow:SetColorTexture(1, 1, 1, 1); glow:SetGradient("HORIZONTAL", CreateColor(0.9, 0.7, 0.31, 0.10), CreateColor(0.9, 0.7, 0.31, 0.0)) else glow:SetColorTexture(0, 0, 0, 0) end
  -- the header: the logo, Debrief, "Settings · saves as you go" (it says when to /reload after a change), and a plain ×
  local lg = opt:CreateTexture(nil, "ARTWORK"); lg:SetSize(18, 18); lg:SetPoint("TOPLEFT", 16, -14); lg:SetTexture(MEDIA .. "Media\\logo")
  local tt = opt:CreateFontString(nil, "OVERLAY"); setFont(tt, "head", 16); tt:SetPoint("LEFT", lg, "RIGHT", 7, 0); tt:SetTextColor(rgb(COL.text)); tt:SetText("Debrief")
  local ts = opt:CreateFontString(nil, "OVERLAY"); setFont(ts, "body", 12); ts:SetPoint("LEFT", tt, "RIGHT", 7, -1); ts:SetTextColor(rgb(COL.faint)); ts:SetText("Settings  ·  saves as you go"); opt.f1 = ts
  local clb = CreateFrame("Button", nil, opt); clb:SetSize(24, 24); clb:SetPoint("TOPRIGHT", -10, -10)
  clb.t = clb:CreateFontString(nil, "OVERLAY"); setFont(clb.t, "bold", 16); clb.t:SetPoint("CENTER", 0, 1); clb.t:SetText("×"); clb.t:SetTextColor(rgb(COL.faint))
  clb:SetScript("OnClick", function() opt:Hide() end)
  clb:SetScript("OnEnter", function() clb.t:SetTextColor(rgb(COL.text)) end); clb:SetScript("OnLeave", function() clb.t:SetTextColor(rgb(COL.faint)) end)
  -- (one page that scrolls with the mouse wheel (Oct 25, the Design studio: no Card / Look / More tabs): the style on top, four
  -- everyday rows, and everything else in folds under Customize)
  local PAGE_TOP, FOOT = 46, 30
  local hl = opt:CreateTexture(nil, "ARTWORK"); hl:SetPoint("TOPLEFT", 1, -PAGE_TOP); hl:SetPoint("TOPRIGHT", -1, -PAGE_TOP); hl:SetHeight(1); fill(hl, COL.line)
  local sf = CreateFrame("ScrollFrame", nil, opt); sf:SetPoint("TOPLEFT", 0, -(PAGE_TOP + 1)); sf:SetPoint("BOTTOMRIGHT", 0, FOOT + 1)
  local root = CreateFrame("Frame", nil, sf); root:SetSize(OW, 10); sf:SetScrollChild(root)
  -- (a soft fade at the bottom while there's more below)
  local fade = opt:CreateTexture(nil, "OVERLAY"); fade:SetPoint("BOTTOMLEFT", 1, FOOT + 1); fade:SetPoint("BOTTOMRIGHT", -1, FOOT + 1); fade:SetHeight(28)
  if fade.SetGradient and CreateColor then local fr, fg, fb = rgb("13161d"); fade:SetColorTexture(1, 1, 1, 1); fade:SetGradient("VERTICAL", CreateColor(fr, fg, fb, 1), CreateColor(fr, fg, fb, 0)) else fade:SetColorTexture(0, 0, 0, 0) end
  local function scrollTo(v) local mx = math.max(0, root:GetHeight() - (sf:GetHeight() or 0)); v = math.max(0, math.min(mx, v)); sf:SetVerticalScroll(v); fade:SetShown(mx - v > 4) end
  refreshers[#refreshers + 1] = function() scrollTo(sf:GetVerticalScroll() or 0) end
  sf:EnableMouseWheel(true)
  sf:SetScript("OnMouseWheel", function(self, d) scrollTo((self:GetVerticalScroll() or 0) - d * 40) end)
  -- the small print at the bottom: the command and version left, the setup again right
  local fl = opt:CreateTexture(nil, "ARTWORK"); fl:SetPoint("BOTTOMLEFT", 1, FOOT); fl:SetPoint("BOTTOMRIGHT", -1, FOOT); fl:SetHeight(1); fill(fl, COL.line)
  local f2 = opt:CreateFontString(nil, "OVERLAY"); setFont(f2, "body", 12); f2:SetPoint("BOTTOMLEFT", 16, 10); f2:SetTextColor(rgb(COL.faint))
  f2:SetText("/db opens this  ·  Version " .. ((C_AddOns and C_AddOns.GetAddOnMetadata and C_AddOns.GetAddOnMetadata(ADDON, "Version")) or ""))
  local rs = CreateFrame("Button", nil, opt); rs:SetSize(140, 22); rs:SetPoint("BOTTOMRIGHT", -12, 5)
  rs.t = rs:CreateFontString(nil, "OVERLAY"); setFont(rs.t, "bold", 12); rs.t:SetPoint("RIGHT", -4, 0); rs.t:SetTextColor(rgb(COL.muted)); rs.t:SetText("Run the setup again")
  rs:SetScript("OnEnter", function() rs.t:SetTextColor(rgb(COL.gold)) end); rs:SetScript("OnLeave", function() rs.t:SetTextColor(rgb(COL.muted)) end)
  rs:SetScript("OnClick", function() opt:Hide(); Debrief_Tutorial() end)

  -- ---------- the pieces the page is made of ----------
  local PX = 16
  local P, y, first = root, 6, true
  local inlineSub = false -- (the everyday rows show their plain line under the name, not in a tooltip)
  -- (a small upper-case label over a group: gold for the first one)
  local function section(title, gold, new)
    local h = P:CreateFontString(nil, "OVERLAY"); setFont(h, "bold", 10.5); h:SetPoint("TOPLEFT", PX, -(y + (first and 4 or 16))); h:SetTextColor(rgb(gold and COL.gold or COL.faint)); h:SetText(string.upper(title))
    if new then local n = P:CreateFontString(nil, "OVERLAY"); setFont(n, "bold", 9.5); n:SetPoint("LEFT", h, "RIGHT", 6, 0); n:SetTextColor(rgb(COL.gold)); n:SetText("NEW") end
    y = y + (first and 22 or 34); first = false; P.rowFirst = true
  end
  local function custom() DB.preset = nil; Debrief_RefreshOptions() end
  -- (one thin row: the label left, its control right; the longer word in a tooltip on a small i, or a plain line under it)
  local function rowBase(label, sub)
    if not P.rowFirst then local ln = P:CreateTexture(nil, "ARTWORK"); ln:SetPoint("TOPLEFT", PX, -y); ln:SetPoint("TOPRIGHT", -PX, -y); ln:SetHeight(1); fill(ln, COL.line, 0.8) end
    P.rowFirst = false
    local t = P:CreateFontString(nil, "OVERLAY"); setFont(t, inlineSub and "bold" or "body", 13.5); t:SetPoint("TOPLEFT", PX, -(y + 8)); t:SetTextColor(rgb(COL.text)); t:SetText(label)
    if sub and inlineSub then
      local s = P:CreateFontString(nil, "OVERLAY"); setFont(s, "body", 12); s:SetPoint("TOPLEFT", PX, -(y + 27)); s:SetWidth(OW - PX * 2 - 70); s:SetJustifyH("LEFT"); s:SetTextColor(rgb(COL.faint)); s:SetText(sub)
      local cy = y + 23; y = y + 48
      return cy
    end
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
  -- (a small on/off switch: gold when on)
  local function switch(label, sub, get, set, keepPreset)
    local cy = rowBase(label, sub)
    local b = CreateFrame("Button", nil, P); b:SetSize(28, 16); b:SetPoint("RIGHT", P, "TOPRIGHT", -PX, -cy)
    b.tr = b:CreateTexture(nil, "ARTWORK"); b.tr:SetAllPoints()
    b.k = b:CreateTexture(nil, "OVERLAY"); b.k:SetSize(12, 12); b.k:SetTexture(SLICE .. "dot")
    local function show()
      local on = get()
      rounded(b.tr, "fill", 5, on and COL.gold or "2a2f3b", 1)
      b.k:ClearAllPoints(); b.k:SetPoint("CENTER", b, on and "RIGHT" or "LEFT", on and -8 or 8, 0); b.k:SetVertexColor(rgb(on and "1b1406" or COL.faint))
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
  -- (several counts side by side (Oct 24): two small boxes a row, each its name and – n +, the longer word on hover)
  local function counts(items)
    local colW = math.floor((OW - PX * 2 - 10) / 2)
    for i, it in ipairs(items) do
      local label, sub, minV, maxV, get, set = it[1], it[2], it[3], it[4], it[5], it[6]
      local col = (i - 1) % 2; if col == 0 and i > 1 then y = y + 40 end
      local box = CreateFrame("Frame", nil, P); box:SetSize(colW, 34); box:SetPoint("TOPLEFT", PX + col * (colW + 10), -y); skin(box, 6, COL.raised, 1, COL.line, 1)
      local t = box:CreateFontString(nil, "OVERLAY"); setFont(t, "body", 13); t:SetPoint("LEFT", 10, 0); t:SetTextColor(rgb(COL.text)); t:SetText(label)
      local plus = txtBtn("+"); plus:SetParent(box); plus:ClearAllPoints(); plus:SetPoint("RIGHT", box, "RIGHT", -4, 0)
      local val = box:CreateFontString(nil, "OVERLAY"); setFont(val, "bold", 13); val:SetWidth(24); val:SetJustifyH("CENTER"); val:SetPoint("RIGHT", plus, "LEFT", 0, 0); val:SetTextColor(rgb(COL.text))
      local minus = txtBtn("–"); minus:SetParent(box); minus:ClearAllPoints(); minus:SetPoint("RIGHT", val, "LEFT", 0, 0)
      local function show() val:SetText(tostring(get())) end
      local function go(d) local v = math.max(minV, math.min(maxV, get() + d)); if v ~= get() then if v > get() then DB.compact = false end; set(v); custom(); show(); applySettings() end end
      minus:SetScript("OnClick", function() go(-1) end); plus:SetScript("OnClick", function() go(1) end)
      box:EnableMouse(true)
      box:SetScript("OnEnter", function() GameTooltip:SetOwner(box, "ANCHOR_RIGHT"); GameTooltip:SetText(label, 1, 1, 1); GameTooltip:AddLine(sub .. " Up to " .. maxV .. ".", 0.75, 0.78, 0.82, true); GameTooltip:Show() end)
      box:SetScript("OnLeave", function() GameTooltip:Hide() end)
      refreshers[#refreshers + 1] = show; show()
    end
    y = y + 44; P.rowFirst = true
  end
  -- (a percentage slider: a thin gold line and its number)
  local function pslider(label, sub, minV, maxV, get, set)
    local cy = rowBase(label, sub)
    local vt = P:CreateFontString(nil, "OVERLAY"); setFont(vt, "bold", 11.5); vt:SetWidth(38); vt:SetJustifyH("RIGHT"); vt:SetPoint("RIGHT", P, "TOPRIGHT", -PX, -cy); vt:SetTextColor(rgb(COL.muted))
    local s = CreateFrame("Slider", nil, P); s:SetSize(120, 16); s:SetPoint("RIGHT", vt, "LEFT", -8, 0); s:SetOrientation("HORIZONTAL")
    s:SetMinMaxValues(minV, maxV); s:SetValueStep(0.05); if s.SetObeyStepOnDrag then s:SetObeyStepOnDrag(true) end
    local track = s:CreateTexture(nil, "BACKGROUND"); track:SetPoint("LEFT", 0, 0); track:SetPoint("RIGHT", 0, 0); track:SetHeight(3); fill(track, "2f3542")
    local fillT = s:CreateTexture(nil, "BORDER"); fillT:SetPoint("LEFT", 0, 0); fillT:SetHeight(3); fillT:SetColorTexture(rgb(COL.gold))
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
  -- (a tick-box list in two columns (Oct 24): a small box, ticked in gold when on, and its name; the longer word on hover)
  local function checks(items)
    local colW, rowH = math.floor((OW - PX * 2 - 10) / 2), 24
    for i, it in ipairs(items) do
      local col = (i - 1) % 2; if col == 0 and i > 1 then y = y + rowH end
      local b = CreateFrame("Button", nil, P); b:SetSize(colW, 22); b:SetPoint("TOPLEFT", PX + col * (colW + 10), -y)
      b.bx = b:CreateTexture(nil, "ARTWORK"); b.bx:SetSize(14, 14); b.bx:SetPoint("LEFT", 0, 0)
      b.ck = b:CreateTexture(nil, "OVERLAY"); b.ck:SetSize(12, 12); b.ck:SetPoint("CENTER", b.bx, "CENTER", 0, 0); b.ck:SetTexture("Interface\\RaidFrame\\ReadyCheck-Ready")
      b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "body", 13); b.t:SetPoint("LEFT", b.bx, "RIGHT", 8, 0); b.t:SetWidth(colW - 24); b.t:SetJustifyH("LEFT"); b.t:SetWordWrap(false); b.t:SetText(it[1])
      local function show()
        local on = it[2]()
        rounded(b.bx, "line", 3, on and COL.gold or COL.line2, 1); b.ck:SetShown(on); b.t:SetTextColor(rgb(on and COL.text or COL.faint))
      end
      b:SetScript("OnClick", function() local v = not it[2](); it[3](v); if v then DB.compact = false end; if not it[4] then custom() end; show(); applySettings() end) -- (Simple's short card would hide what you just ticked (Oct 24))
      b:SetScript("OnEnter", function() b.t:SetTextColor(rgb(COL.gold)); if it[5] then GameTooltip:SetOwner(b, "ANCHOR_TOP"); GameTooltip:SetText(it[1], 1, 1, 1); GameTooltip:AddLine(it[5], 0.75, 0.78, 0.82, true); GameTooltip:Show() end end)
      b:SetScript("OnLeave", function() show(); GameTooltip:Hide() end)
      refreshers[#refreshers + 1] = show; show()
    end
    y = y + rowH + 4; P.rowFirst = true
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
  -- (the folds under Customize: a box with its name and a plain line of what's inside, closed until you open it; what's inside is
  -- built once, and the folds below move down when one opens)
  local folds, OPEN, foldTop = {}, {}, 0
  local function relayout()
    local yy = foldTop
    for _, f in ipairs(folds) do
      local on = OPEN[f.key] == true
      f:ClearAllPoints(); f:SetPoint("TOPLEFT", root, "TOPLEFT", 0, -yy)
      local h = f.hh + (on and f.bodyH or 0)
      f:SetHeight(h); f.body:SetShown(on); f.pm:SetText(on and "–" or "+")
      rounded(f.lineT, "line", 6, on and COL.gold or COL.line, on and 0.6 or 1)
      yy = yy + h + 8
    end
    root:SetHeight(yy + 8); scrollTo(sf:GetVerticalScroll() or 0)
  end
  local function fold(key, title, summary, build)
    local f = CreateFrame("Frame", nil, root); f:SetSize(OW, 10); f.key = key
    f.fillT = f:CreateTexture(nil, "BACKGROUND"); f.fillT:SetPoint("TOPLEFT", PX, 0); f.fillT:SetPoint("BOTTOMRIGHT", -PX, 0); rounded(f.fillT, "fill", 6, COL.raised, 0.6)
    f.lineT = f:CreateTexture(nil, "BORDER"); f.lineT:SetPoint("TOPLEFT", PX, 0); f.lineT:SetPoint("BOTTOMRIGHT", -PX, 0)
    local t = f:CreateFontString(nil, "OVERLAY"); setFont(t, "bold", 13.5); t:SetPoint("TOPLEFT", PX + 12, -10); t:SetTextColor(rgb(COL.text)); t:SetText(title)
    local s = f:CreateFontString(nil, "OVERLAY"); setFont(s, "body", 12); s:SetPoint("TOPLEFT", PX + 12, -29); s:SetWidth(OW - PX * 2 - 54); s:SetJustifyH("LEFT"); s:SetTextColor(rgb(COL.muted)); s:SetText(summary)
    f.pm = f:CreateFontString(nil, "OVERLAY"); setFont(f.pm, "bold", 16); f.pm:SetPoint("TOPRIGHT", -(PX + 14), -9); f.pm:SetTextColor(rgb(COL.faint))
    f.hh = 29 + s:GetStringHeight() + 12
    local hb = CreateFrame("Button", nil, f); hb:SetPoint("TOPLEFT", PX, 0); hb:SetPoint("TOPRIGHT", -PX, 0); hb:SetHeight(f.hh); f.hb = hb; f.t = t
    hb:SetScript("OnClick", function() OPEN[key] = not OPEN[key]; relayout() end)
    hb:SetScript("OnEnter", function() t:SetTextColor(rgb(COL.gold)); f.pm:SetTextColor(rgb(COL.gold)) end)
    hb:SetScript("OnLeave", function() t:SetTextColor(rgb(COL.text)); f.pm:SetTextColor(rgb(COL.faint)) end)
    -- (what's inside: the same rows, set in from the box's edges)
    f.body = CreateFrame("Frame", nil, f); f.body:SetSize(OW, 10); f.body:SetPoint("TOPLEFT", 0, -f.hh)
    local sP, sY, sFirst, sPX = P, y, first, PX
    P, y, first, PX = f.body, 0, true, PX + 12
    P.rowFirst = true; build()
    f.bodyH = y + 8; f.body:SetHeight(f.bodyH)
    P, y, first, PX = sP, sY, sFirst, sPX
    folds[#folds + 1] = f
  end

  -- ---------- 1. How much do you want to see: the three styles, and what the chosen one shows ----------
  local PDESC = { simple = "A quick look: the raid lead box, your number, your top fix and the next pull tip.",
    standard = "For most raiders: your fixes and survival, worse and better than last pull, the raid's deaths and mistakes, your last pulls.",
    detailed = "Everything: up to 8 rotation tips with their windows, boss mechanics, the charts and the grade." }
  local PSHORT = { simple = "Quick read.", standard = "Most raiders.", detailed = "Everything." }
  local PSHOWS = { simple = "Simple shows the raid lead box, your number, your top fix and the next pull tip.",
    standard = "Standard shows your fixes and survival, worse and better than last pull, the raid's deaths and mistakes, and your last pulls.",
    detailed = "Detailed shows everything, in two columns: up to 8 rotation tips with their windows, boss mechanics, the charts and the grade." }
  section("How much do you want to see?", true)
  do
    local bw, bs = math.floor((OW - PX * 2 - 16) / 3), {}
    for i, k in ipairs({ "simple", "standard", "detailed" }) do
      local b = CreateFrame("Button", nil, P); b:SetSize(bw, 46); b:SetPoint("TOPLEFT", PX + (i - 1) * (bw + 8), -y)
      b.fillT = b:CreateTexture(nil, "BACKGROUND"); b.fillT:SetAllPoints(); b.lineT = b:CreateTexture(nil, "BORDER"); b.lineT:SetAllPoints()
      b.t = b:CreateFontString(nil, "OVERLAY"); setFont(b.t, "bold", 13.5); b.t:SetPoint("TOPLEFT", 10, -8); b.t:SetText(PRESET_NAME[k])
      b.d = b:CreateFontString(nil, "OVERLAY"); setFont(b.d, "body", 12); b.d:SetPoint("TOPLEFT", 10, -26); b.d:SetWidth(bw - 16); b.d:SetJustifyH("LEFT"); b.d:SetWordWrap(false); b.d:SetText(PSHORT[k])
      b:SetScript("OnClick", function() Debrief_SetPreset(k); applySettings(); Debrief_RefreshOptions() end)
      b:SetScript("OnEnter", function() GameTooltip:SetOwner(b, "ANCHOR_TOP"); GameTooltip:SetText(PRESET_NAME[k], 1, 1, 1); GameTooltip:AddLine(PDESC[k], 0.75, 0.78, 0.82, true); GameTooltip:Show() end)
      b:SetScript("OnLeave", function() GameTooltip:Hide() end)
      bs[k] = b
    end
    refreshers[#refreshers + 1] = function()
      for k, b in pairs(bs) do local on = DB.preset == k
        rounded(b.fillT, "fill", 6, on and COL.gold or COL.raised, on and 0.12 or 0.6); rounded(b.lineT, "line", 6, on and COL.gold or COL.line, 1)
        b.t:SetTextColor(rgb(on and COL.gold or COL.text)); b.d:SetTextColor(rgb(on and COL.soft or COL.faint)) end
    end
    y = y + 54
    -- (what the chosen style shows, in one line; "your own mix" after a change by hand)
    local d = P:CreateFontString(nil, "OVERLAY"); setFont(d, "body", 12.5); d:SetPoint("TOPLEFT", PX, -y); d:SetWidth(OW - PX * 2); d:SetJustifyH("LEFT"); d:SetTextColor(rgb(COL.muted))
    refreshers[#refreshers + 1] = function() d:SetText(DB.preset and PSHOWS[DB.preset] or "Your own mix. Pick a style to start again from it.") end
    y = y + 34
  end

  -- ---------- 2. Everyday: the four things most people change ----------
  local function classCol() local _, c = UnitClass("player"); return classHex(c) end
  section("Everyday")
  inlineSub = true
  switch("Use my class colour", "The card takes the colour of the class you're playing.", function() return DB.classTheme ~= false end, function(v) DB.classTheme = v end, true)
  switch("Hide during a fight", "It stays closed after the fight: /recap opens it again.", function() return DB.hideCombat ~= false end, function(v) DB.hideCombat = v end, true)
  switch("Only the mistakes", "Hide the lines you did right.", function() return DB.onlyBad == true end, function(v) DB.onlyBad = v end, true)
  inlineSub = false
  pslider("Card size", nil, 0.7, 1.5, function() return DB.scale or 1 end, function(v) DB.scale = v end)

  -- ---------- 3. Customize: everything else, in folds ----------
  section("Customize")
  foldTop = y
  fold("card", "What's on your card", "Your number, rotation tips, boss mistakes, survival, the next pull tip, charts, the grade, and how many of each.", function()
    checks({
      { "Your number", function() return S().tile ~= false end, function(v) S().tile = v end },
      { "Rotation tips", function() return S().rotation ~= false end, function(v) S().rotation = v end },
      { "Boss mistakes", function() return S().boss ~= false end, function(v) S().boss = v end },
      { "Survival", function() return S().surv ~= false end, function(v) S().surv = v end, false, "Your defensives, and how many you used." },
      { "Healthstone and potion", function() return S().cons ~= false end, function(v) S().cons = v end, false, "When you used your Healthstone and health potion, or that you didn't." },
      { "Next pull tip", function() return S().next ~= false end, function(v) S().next = v end },
      { "Worse and better", function() return S().trend ~= false end, function(v) S().trend = v end, false, "Worse and better than last pull, under the raid lead box." },
      { "Your last pulls", function() return S().chips ~= false end, function(v) S().chips = v end, false, "Your last pulls along the top. Click one to look at it again." },
      { "Chart: your numbers", function() return S().chartLine == true end, function(v) S().chartLine = v end, true, "Your damage or healing, pull by pull, on this boss tonight." },
      { "Chart: how far", function() return S().chartNight == true end, function(v) S().chartNight = v end, true, "Every pull on this boss tonight, the best one marked." },
      { "Report card grade", function() return S().grade == true end, function(v) S().grade = v end, true, "The pull's grade from the Report card, with mechanics, avoidable damage and survival." },
    })
    switch("Boss mistakes first", "Above your rotation tips.", function() return DB.bossFirst == true end, function(v) DB.bossFirst = v end)
    switch("Open the sections by default", "Off: Rotation, Boss mechanics, Survival and Who died start closed on each pull, with their count; a tap opens one. Standard starts with it off.", function() return DB.openSecs ~= false end, function(v) DB.openSecs = v end, true)
    section("How many")
    counts({
      { "Rotation tips", "Your biggest fixes, the ones that cost you the most first.", 1, 8, function() return DB.maxSlips or 3 end, function(v) DB.maxSlips = v end },
      { "Boss mistakes", "Your mistakes, avoidable damage, kicks and dispels.", 1, 7, function() return DB.maxBoss or 2 end, function(v) DB.maxBoss = v end },
      { "Deaths listed", "Who died first, and to what. 0 hides the list.", 0, 8, function() return DB.maxDied or 3 end, function(v) DB.maxDied = v end },
      { "Boss mechanics", "How many mechanic lines.", 0, 16, function() return DB.maxMech or 6 end, function(v) DB.maxMech = v end },
    })
    note("Up to this many. A pull with fewer shows all it has.")
  end)
  fold("raid", "Raid view", "The raid lead box, deaths, avoidable damage, defensives and more.", function()
    checks({
      { "Raid lead box", function() return S().coach ~= false end, function(v) S().coach = v; S().lead = v end, false, "Your raid lead says: the headline, what wiped us and the other big mistakes." },
      { "What went right", function() return S().right ~= false end, function(v) S().right = v end },
      { "Deaths", function() return S().cdeaths ~= false end, function(v) S().cdeaths = v end },
      { "Avoidable damage", function() return S().cavoid ~= false end, function(v) S().cavoid = v end },
      { "Boss mechanics", function() return S().mechs == true end, function(v) S().mechs = v end, false, "How each mechanic went, worst first." },
      { "Defensives", function() return S().rdefs ~= false end, function(v) S().rdefs = v end, false, "Who pressed a defensive, and who never did." },
      { "Healthstones", function() return S().rcons ~= false end, function(v) S().rcons = v end, false, "Who used a Healthstone or health potion, and who dropped low with one still ready." },
    })
    P.rowFirst = true; y = y + 6
    counts({ { "Raid mistakes", "The raid's biggest mistakes, in the Raid view.", 1, 5, function() return DB.maxRaid or 3 end, function(v) DB.maxRaid = v end } })
  end)
  fold("look", "Colours and look", "Accent, card style, text size, width, font, background, big window size.", function()
    swatches("Accent", "When Use my class colour is off.", {
      { "gold", "Debrief gold", ACCENTS.gold }, { "class", "Your class colour", classCol }, { "frost", "Frost", ACCENTS.frost },
      { "fel", "Fel", ACCENTS.fel }, { "crimson", "Crimson", ACCENTS.crimson }, { "violet", "Void", ACCENTS.violet },
    }, function() return DB.accent or "gold" end, function(v) DB.accent = v; DB.classTheme = false end)
    segment("Card style", "Soft panels, see-through glass, or flat.", { { "panels", "Panels" }, { "glass", "Glass" }, { "flat", "Flat" } },
      function() return DB.cardStyle or "panels" end, function(v) DB.cardStyle = v end, true)
    switch("Colour-blind colours", "Blue for good, orange for bad.", function() return DB.colorblind == true end, function(v) DB.colorblind = v end, true)
    pslider("Text size", nil, 0.85, 1.2, function() return DB.fontScale or 1 end, function(v) DB.fontScale = v end)
    choice("Width", nil, WIDTH_CHOICES, function() return DB.width or "normal" end, function(v) DB.width = v end)
    switch("Two columns with Detailed", "The Detailed card sits in two columns side by side, every pull. The other styles are one column.", function() return DB.twoCol ~= false end, function(v) DB.twoCol = v end, true)
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
    -- (no "/recap opens: Card / Whole night" any more (Oct 24): the card is the one recap window; the big window is Expand on it)
    pslider("Big window size", "The big window you open with Expand on the card: tonight's pulls and charts.", 0.7, 1.3, function() return DB.bigScale or 1 end, function(v) DB.bigScale = v end)
  end)
  fold("when", "When it shows", "Close by itself, lock in place, the chat reminder, combat log.", function()
    segment("Close by itself", "Not while your mouse is on it.", { { 0, "Never" }, { 30, "30 s" }, { 60, "60 s" }, { 120, "2 min" } },
      function() return DB.autoClose or 0 end, function(v) DB.autoClose = v end, true)
    switch("Lock in place", "The card and its window can't be dragged.", function() return DB.lock == true end, function(v) DB.lock = v end, true)
    switch("Remind me in chat", "A line in chat after each boss: your recap is on your PC, and /recap saves it here. Off unless you switch it on.", function() return DB.nudge == true end, function(v) DB.nudge = v end, true)
    switch("Combat log always on", "With Advanced Combat Logging, whenever Debrief is loaded.", function() return DB.autoLog ~= false end, function(v) DB.autoLog = v end, true)
  end)
  fold("goals", "Goals and saved pulls", "A damage or healing goal, and how many pulls to keep.", function()
    local function lastOf(role)
      local R0 = Debrief_PreviewReal and Debrief_PreviewReal(); local L0 = (R0 and R0.pulls) or DB.pulls -- (your own pulls, not the preview's sample)
      for i = #L0, 1, -1 do local p = youIn(L0[i]); if p and ((p.role == "healer") == (role == "healer")) then return parseK(p.v) end end
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
    stepper("Keep my last", "Older pulls drop off as new ones come in.", 10, 100, function() return DB.keep or 30 end, function(v) DB.keep = v end, function(v) return v .. "" end, true, 5)
    local pc = P:CreateFontString(nil, "OVERLAY"); setFont(pc, "body", 12); pc:SetPoint("TOPLEFT", PX, -(y + 4)); pc:SetWidth(OW - PX * 2); pc:SetJustifyH("LEFT"); pc:SetTextColor(rgb(COL.faint))
    refreshers[#refreshers + 1] = function() local R = Debrief_PreviewReal and Debrief_PreviewReal(); local n = #((R and R.pulls) or DB.pulls); pc:SetText(n == 0 and "No pulls saved yet." or (n .. (n == 1 and " pull saved." or " pulls saved."))) end
    y = y + 22
    buttons({ { "Clear saved pulls", function() SlashCmdList.DEBRIEF("clear"); Debrief_RefreshOptions() end } })
  end)
  fold("help", "Help", "The setup again, a sample recap, move the card back, the commands.", function()
    buttons({ { "Run the setup again", function() opt:Hide(); Debrief_Tutorial() end, 150 }, { "Sample recap", function() SlashCmdList.DEBRIEF("demo") end, 110 } })
    y = y - 6
    buttons({ { "Move card back", function() SlashCmdList.DEBRIEF("reset") end, 120 } })
    local HELP = { { "/recap", "show or hide your recap (/dbr, /debrief too)" }, { "/db", "these settings (/dmo too)" }, { "/debrief big", "the big window" },
      { "/debrief setup", "the guided setup again" }, { "/debrief log", "combat logging on or off" }, { "/debrief demo", "a sample recap" } }
    for _, h in ipairs(HELP) do
      local c = P:CreateFontString(nil, "OVERLAY"); setFont(c, "bold", 12.5); c:SetPoint("TOPLEFT", PX, -(y + 4)); c:SetTextColor(rgb(COL.gold)); c:SetText(h[1])
      local d = P:CreateFontString(nil, "OVERLAY"); setFont(d, "body", 12.5); d:SetPoint("TOPLEFT", PX + 104, -(y + 4)); d:SetTextColor(rgb(COL.soft)); d:SetText(h[2])
      y = y + 20
    end
  end)
  relayout()
  opt.folds, opt.openFold = folds, function(k, on) OPEN[k] = on; relayout() end -- (for tests)

  Debrief_RefreshOptions()
end
-- (the settings preview (Oct 24, the user: "the preview should always show everything"): while the settings are open the card shows the
-- built-in sample pull, every section filled, with four earlier pulls on the boss so the charts draw; your own pulls come back when the
-- settings close, and before WoW saves at logout or /reload)
local PREV_REAL, SAMPLE_ME = nil, "Vexmira"
function Debrief_PreviewReal() return PREV_REAL end
local function previewList()
  local m = decode(SAMPLE); if not m then return nil end
  m.demo = true; m.own = true
  local list = {}
  for _, s0 in ipairs({ { 29, "78", 0.84 }, { 30, "70", 0.9 }, { 31, "66", 0.93 }, { 32, "61", 0.97 } }) do
    local c = {}; for k, v in pairs(m) do c[k] = v end
    c.h = {}; for k, v in pairs(m.h) do c.h[k] = v end; c.h.pull = tostring(s0[1]); c.h.pct = s0[2]
    c.players = {}; for i, p in ipairs(m.players) do local q = {}; for k, v in pairs(p) do q[k] = v end; local n = parseK(p.v); if n then q.v = math.floor(n * s0[3] + 0.5) .. "k" end; c.players[i] = q end
    list[#list + 1] = c
  end
  list[#list + 1] = m
  return list
end
function Debrief_PreviewOn()
  if PREV_REAL or not DB then return end
  local list = previewList(); if not list then return end
  PREV_REAL = { pulls = DB.pulls, cur = DB.cur, who = DB.who }
  DB.pulls = list; DB.cur = #list; DB.who = SAMPLE_ME; wipe(EXPANDED)
end
function Debrief_PreviewOff()
  if not PREV_REAL or not DB then return end
  DB.pulls, DB.cur, DB.who = PREV_REAL.pulls, PREV_REAL.cur, PREV_REAL.who; PREV_REAL = nil; wipe(EXPANDED)
end
-- (a safety net (Oct 24, the user: "/recap isnt pulling up my saved puls its pulling up demo pulls"): the sample still in while neither
-- the settings nor the setup is open gives your own pulls, and the card its own place, back)
function Debrief_SettingsClosed()
  if not optDirty then return end
  optDirty = false; if opt and opt.f1 then opt.f1:SetText("Settings  ·  saves as you go") end
  say("saved. Your PC pop-up follows your changes after your next /reload.")
end
function Debrief_PreviewFix()
  if not PREV_REAL or not DB then return end
  if (opt and opt:IsShown()) or (DebriefTutorial and DebriefTutorial:IsShown()) then return end
  Debrief_PreviewOff(); card:SetScale(DB.scale or 1); card:ClearAllPoints()
  if DB.pos then card:SetPoint(DB.pos[1], UIParent, DB.pos[2], DB.pos[3], DB.pos[4]) else card:SetPoint("CENTER", 260, 60) end
end
function Debrief_ToggleOptions()
  if not DB then return end
  if not opt then buildOptions() end
  if opt:IsShown() then opt:Hide(); Debrief_PreviewOff(); Debrief_SettingsClosed(); if card:IsShown() then if #DB.pulls > 0 then render() else card:Hide() end end; return end -- (your own pulls again)
  if DebriefTutorial and DebriefTutorial:IsShown() then DebriefTutorial:Hide(); Debrief_PreviewOff() end
  Debrief_RefreshOptions(); opt:Show()
  if not opt.prev then
    opt.prev = opt:CreateFontString(nil, "OVERLAY"); setFont(opt.prev, "bold", 12.5); opt.prev:SetTextColor(rgb(COL.gold))
    opt.prev:SetText("PREVIEW  ·  changes as you click")
    opt:HookScript("OnHide", function()
      Debrief_PreviewOff(); Debrief_SettingsClosed(); if card:IsShown() then if #DB.pulls > 0 then render() else card:Hide() end end -- (your own pulls again)
      card:SetScale(DB.scale or 1); card:ClearAllPoints()
      if DB.pos then card:SetPoint(DB.pos[1], UIParent, DB.pos[2], DB.pos[3], DB.pos[4]) else card:SetPoint("CENTER", 260, 60) end
    end)
  end
  -- (the card beside it, so every change shows at once: the built-in sample, every section filled (Oct 24); the give-back hook above is
  -- set first, so your own pulls come back however the settings close)
  Debrief_PreviewOn()
  -- (the preview: your recap card, attached to the right of this window, changing as you click; back in its own place when you close)
  mini:Hide(); big:Hide(); card:Show(); pcall(render)
  card:ClearAllPoints(); card:SetPoint("TOPLEFT", opt, "TOPRIGHT", 16, -26)
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
  d:SetText("Your pull recap in game. Choose how much the card shows (Simple, Standard, Detailed or your own mix), the font and sizes, and what happens after a pull.")
  local b = CreateFrame("Button", nil, p, "UIPanelButtonTemplate"); b:SetSize(200, 26); b:SetPoint("TOPLEFT", 16, -80); b:SetText("Open Debrief settings")
  b:SetScript("OnClick", function() if SettingsPanel and SettingsPanel:IsShown() then HideUIPanel(SettingsPanel) end; if not (opt and opt:IsShown()) then Debrief_ToggleOptions() end end)
  local cat = Settings.RegisterCanvasLayoutCategory(p, "Debrief"); Settings.RegisterAddOnCategory(cat)
end

-- ---------- the guided setup: the first time you log in (/debrief setup, or Run the setup again in the settings, shows it again) ----------
-- (Oct 25, the Design studio's redesign of the user's ask "very very very clear and simple ... set it up, customize it, and then use
-- it": 1. a checklist that knows what's working, 2. how much to see, with the sample card beside it, 3. the four everyday switches
-- (the tick boxes live under Customize in /db), 4. how to use it)
do
  local TW = 470
  local tut = CreateFrame("Frame", "DebriefTutorial", UIParent); tut:SetSize(TW, 300); tut:SetPoint("CENTER", -250, 40); tut:SetFrameStrata("DIALOG"); tut:SetClampedToScreen(true); tut:Hide()
  skin(tut, 8, COL.bg, 0.98, COL.line2, 1, true)
  tut:SetMovable(true); tut:EnableMouse(true); tut:RegisterForDrag("LeftButton")
  tut:SetScript("OnDragStart", tut.StartMoving); tut:SetScript("OnDragStop", tut.StopMovingOrSizing)
  tinsert(UISpecialFrames, "DebriefTutorial")
  local lg = tut:CreateTexture(nil, "ARTWORK"); lg:SetSize(20, 20); lg:SetPoint("TOPLEFT", 18, -15); lg:SetTexture(MEDIA .. "Media\\logo")
  local tt = tut:CreateFontString(nil, "OVERLAY"); setFont(tt, "head", 18); tt:SetPoint("LEFT", lg, "RIGHT", 8, 0); tt:SetTextColor(rgb(COL.text)); tt:SetText("Debrief")
  local stepT = tut:CreateFontString(nil, "OVERLAY"); setFont(stepT, "body", 12.5); stepT:SetPoint("LEFT", tt, "RIGHT", 10, -1); stepT:SetTextColor(rgb(COL.muted))
  local cl = closeButton(tut); cl:SetPoint("TOPRIGHT", -10, -12)
  local hl = tut:CreateTexture(nil, "ARTWORK"); hl:SetPoint("TOPLEFT", 1, -50); hl:SetPoint("TOPRIGHT", -1, -50); hl:SetHeight(1); fill(hl, COL.line)
  local title = tut:CreateFontString(nil, "OVERLAY"); setFont(title, "head", 22); title:SetPoint("TOPLEFT", 22, -66); title:SetWidth(TW - 44); title:SetJustifyH("LEFT"); title:SetTextColor(rgb(COL.text))
  local sub = tut:CreateFontString(nil, "OVERLAY"); setFont(sub, "body", 14); sub:SetPoint("TOPLEFT", 22, -98); sub:SetWidth(TW - 44); sub:SetJustifyH("LEFT"); sub:SetJustifyV("TOP"); sub:SetTextColor(rgb(COL.soft))
  if sub.SetSpacing then sub:SetSpacing(3) end
  local PW = TW - 44
  -- (each step's own pieces in a frame under its words)
  local panes = {}
  local function pane(i) local f = CreateFrame("Frame", nil, tut); f:SetSize(PW, 10); f:Hide(); panes[i] = f; return f end
  local function fsOn(f, kind, size, hex) local t = f:CreateFontString(nil, "OVERLAY"); setFont(t, kind, size); t:SetTextColor(rgb(hex)); t:SetJustifyH("LEFT"); return t end

  -- step 1: set it up, a checklist that knows what's working: the addon, Debrief Companion on your PC, the combat log
  local checkRows = {}
  local function ownPulls() local R = Debrief_PreviewReal and Debrief_PreviewReal(); local L = (R and R.pulls) or (DB and DB.pulls) or {}; local last
    for _, q in ipairs(L) do if q.own and not q.demo and (q.t or 0) > (last or 0) then last = q.t end end; return last end
  local function when(t) -- ("at 9:41 PM" today, "on Oct 24" before)
    if not (date and t and t > 0) then return nil end
    if date("%Y%m%d", t) == date("%Y%m%d") then return "at " .. date("%I:%M %p", t):gsub("^0", "") end
    return "on " .. date("%b %d", t):gsub(" 0", " ")
  end
  local STATE = {
    function() return true, "You're reading this, so that's done." end,
    function()
      if not (DEBRIEF_HAS_APP or (DB and DB.hasApp)) then return false, "Not seen yet. It's the small app that reads your combat log: get it on your PC at |cffe6b450debriefme.io/?ingame|r" end
      local w = when(ownPulls())
      return true, w and ("It's working. Your last pull came in " .. w .. ".") or "It's on this PC. Your first recap comes after a boss pull."
    end,
    function()
      if DB and DB.autoLog == false then return false, "Off. Debrief can keep it on for you, with Advanced Combat Logging." end
      return true, "Debrief keeps it on for you, with Advanced Combat Logging."
    end,
  }
  local paint1
  do local f = pane(1); local yy = 0
    for i, name in ipairs({ "The addon is in", "Debrief Companion on your PC", "Combat logging on" }) do
      local r = CreateFrame("Frame", nil, f); r:SetPoint("TOPLEFT", 0, -yy); r:SetWidth(PW); skin(r, 6, COL.raised, 1, COL.line, 1)
      r.c = r:CreateTexture(nil, "ARTWORK"); r.c:SetTexture(SLICE .. "dot"); r.c:SetSize(22, 22); r.c:SetPoint("TOPLEFT", 12, -12)
      r.ck = r:CreateTexture(nil, "OVERLAY"); r.ck:SetSize(14, 14); r.ck:SetPoint("CENTER", r.c, "CENTER", 0, 0); r.ck:SetTexture("Interface\\RaidFrame\\ReadyCheck-Ready")
      r.num = fsOn(r, "head", 13, COL.muted); r.num:SetPoint("CENTER", r.c, "CENTER", 0, 0); r.num:SetText(i)
      r.n = fsOn(r, "bold", 14, COL.text); r.n:SetPoint("TOPLEFT", 46, -10); r.n:SetText(name)
      r.d = fsOn(r, "body", 12.5, COL.muted); r.d:SetPoint("TOPLEFT", 46, -29); r.d:SetWidth(PW - 58)
      if i == 3 then -- (switched off in /db: one click puts it back on)
        r.on = optButton(r, "Turn on", 74, false, 22); r.on:SetPoint("TOPRIGHT", -10, -12)
        r.on:SetScript("OnClick", function() DB.autoLog = true; autoLog(); paint1(); if Debrief_RefreshOptions then Debrief_RefreshOptions() end end)
      end
      checkRows[i] = r; yy = yy + 66
    end
    f.h = yy
  end
  paint1 = function()
    local yy = 0
    for i, r in ipairs(checkRows) do
      local ok, line = STATE[i]()
      r.d:SetText(line); r.ck:SetShown(ok); r.num:SetShown(not ok)
      r.c:SetVertexColor(rgb(ok and COL.good or COL.line2)); r.c:SetAlpha(ok and 0.22 or 1)
      if r.on then r.on:SetShown(not ok) end
      local h = math.max(54, 29 + r.d:GetStringHeight() + 12); r:SetHeight(h); r:ClearAllPoints(); r:SetPoint("TOPLEFT", 0, -yy); yy = yy + h + 8
    end
    panes[1].h = yy
  end

  -- step 2: how much do you want to see, the three styles, each with what it shows; the sample card beside it changes as you click
  local SDESC = { simple = "The raid lead box, your number, your top fix and the next pull tip. Read it between pulls.",
    standard = "Plus your fixes and survival, worse and better than last pull, the raid's deaths and mistakes, your last pulls.",
    detailed = "Everything, in two columns: up to 8 rotation tips with their windows, boss mechanics, the charts and your grade." }
  local styleB = {}
  local function paintStyles()
    for k, b in pairs(styleB) do local on = DB and DB.preset == k
      rounded(b.fillT, "fill", 6, on and "e6b450" or COL.raised, on and 0.12 or 1); rounded(b.lineT, "line", 6, on and "e6b450" or COL.line, 1); b.n:SetTextColor(rgb(on and "e6b450" or COL.text)) end
  end
  do local f = pane(2); local yy = 0
    for _, k in ipairs({ "simple", "standard", "detailed" }) do
      local b = CreateFrame("Button", nil, f); b:SetPoint("TOPLEFT", 0, -yy); b:SetWidth(PW)
      b.fillT = b:CreateTexture(nil, "BACKGROUND"); b.fillT:SetAllPoints(); b.lineT = b:CreateTexture(nil, "BORDER"); b.lineT:SetAllPoints()
      b.n = fsOn(b, "bold", 14.5, COL.text); b.n:SetPoint("TOPLEFT", 14, -10); b.n:SetText(PRESET_NAME[k] .. (k == "standard" and "   |cffe6b450most raiders|r" or ""))
      b.d = fsOn(b, "body", 12.5, COL.muted); b.d:SetPoint("TOPLEFT", 14, -31); b.d:SetWidth(PW - 28); b.d:SetText(SDESC[k])
      local h = 31 + b.d:GetStringHeight() + 11; b:SetHeight(h); yy = yy + h + 8
      local hi = b:CreateTexture(nil, "HIGHLIGHT"); hi:SetAllPoints(); hi:SetColorTexture(1, 1, 1, 0.03)
      b:SetScript("OnClick", function() Debrief_SetPreset(k); applySettings(); paintStyles(); if Debrief_RefreshOptions then Debrief_RefreshOptions() end end)
      styleB[k] = b
    end
    f.h = yy
  end

  -- step 3: make it yours, the same four everyday rows as /db (its switches and slider, drawn here at the setup's width)
  local paint3 = {}
  do local f = pane(3); local yy = 0
    local function rowName(label, line)
      local t = fsOn(f, "bold", 13.5, COL.text); t:SetPoint("TOPLEFT", 0, -(yy + 6)); t:SetText(label)
      if line then local s = fsOn(f, "body", 12, COL.faint); s:SetPoint("TOPLEFT", 0, -(yy + 25)); s:SetWidth(PW - 80); s:SetText(line) end
      return yy + (line and 21 or 14)
    end
    local function rule() local ln = f:CreateTexture(nil, "ARTWORK"); ln:SetPoint("TOPLEFT", 0, -yy); ln:SetPoint("TOPRIGHT", 0, -yy); ln:SetHeight(1); fill(ln, COL.line, 0.8); yy = yy + 1 end
    local function tSwitch(label, line, get, set)
      local cy = rowName(label, line)
      local b = CreateFrame("Button", nil, f); b:SetSize(34, 18); b:SetPoint("RIGHT", f, "TOPRIGHT", 0, -cy)
      b.tr = b:CreateTexture(nil, "ARTWORK"); b.tr:SetAllPoints()
      b.k = b:CreateTexture(nil, "OVERLAY"); b.k:SetSize(14, 14); b.k:SetTexture(SLICE .. "dot")
      local function show() local on = get(); rounded(b.tr, "fill", 6, on and COL.gold or "2a2f3b", 1)
        b.k:ClearAllPoints(); b.k:SetPoint("CENTER", b, on and "RIGHT" or "LEFT", on and -9 or 9, 0); b.k:SetVertexColor(rgb(on and "1b1406" or COL.faint)) end
      b:SetScript("OnClick", function() set(not get()); show(); applySettings(); if Debrief_RefreshOptions then Debrief_RefreshOptions() end end)
      paint3[#paint3 + 1] = show
      yy = yy + (line and 46 or 32); rule()
    end
    tSwitch("Use my class colour", "The card takes the colour of the class you're playing.", function() return DB.classTheme ~= false end, function(v) DB.classTheme = v end)
    tSwitch("Hide during a fight", "It stays closed after the fight: /recap opens it again.", function() return DB.hideCombat ~= false end, function(v) DB.hideCombat = v end)
    tSwitch("Only the mistakes", "Hide the lines you did right.", function() return DB.onlyBad == true end, function(v) DB.onlyBad = v end)
    -- (card size: a thin gold line and its number, like /db)
    local cy = rowName("Card size")
    local vt = fsOn(f, "bold", 12, COL.muted); vt:SetWidth(40); vt:SetJustifyH("RIGHT"); vt:SetPoint("RIGHT", f, "TOPRIGHT", 0, -cy)
    local s = CreateFrame("Slider", nil, f); s:SetSize(130, 16); s:SetPoint("RIGHT", vt, "LEFT", -8, 0); s:SetOrientation("HORIZONTAL")
    s:SetMinMaxValues(0.7, 1.5); s:SetValueStep(0.05); if s.SetObeyStepOnDrag then s:SetObeyStepOnDrag(true) end
    local track = s:CreateTexture(nil, "BACKGROUND"); track:SetPoint("LEFT", 0, 0); track:SetPoint("RIGHT", 0, 0); track:SetHeight(3); fill(track, "2f3542")
    local fillT = s:CreateTexture(nil, "BORDER"); fillT:SetPoint("LEFT", 0, 0); fillT:SetHeight(3); fillT:SetColorTexture(rgb(COL.gold))
    local thumb = s:CreateTexture(nil, "ARTWORK"); thumb:SetTexture(SLICE .. "dot"); thumb:SetSize(12, 12); thumb:SetVertexColor(rgb(COL.text)); s:SetThumbTexture(thumb)
    local busy = false
    local function paint(v) fillT:SetWidth(math.max(1, 130 * (v - 0.7) / 0.8)); vt:SetText(math.floor(v * 100 + 0.5) .. "%") end
    s:SetScript("OnValueChanged", function(self, v) v = math.floor(v * 20 + 0.5) / 20; paint(v); if busy or v == (DB.scale or 1) then return end; DB.scale = v; applySettings(); if Debrief_RefreshOptions then Debrief_RefreshOptions() end end)
    s:EnableMouseWheel(true); s:SetScript("OnMouseWheel", function(self, d) self:SetValue(math.max(0.7, math.min(1.5, self:GetValue() + d * 0.05))) end)
    paint3[#paint3 + 1] = function() busy = true; s:SetValue(DB.scale or 1); paint(DB.scale or 1); busy = false end
    yy = yy + 34
    f.h = yy
  end

  -- step 4: using it, what to type and what to click
  do local f = pane(4); local yy = 0
    for _, w in ipairs({ { "/recap", "Shows or hides your card. When a newer pull isn't here yet, it says so: click Save this pull." },
      { "Me  ·  Raid view", "Your own pull, or the raid's biggest mistakes and who died." }, { "<  name  >", "Look at anyone in the pull." },
      { "Expand", "The whole night in a big window, with charts." }, { "+  and  –", "Open or fold any line for the details." }, { "/db", "These settings, any time." } }) do
      local k = fsOn(f, "bold", 13.5, "e6b450"); k:SetPoint("TOPLEFT", 0, -yy); k:SetText(w[1])
      local d = fsOn(f, "body", 13.5, COL.soft); d:SetPoint("TOPLEFT", 128, -yy); d:SetWidth(PW - 128); d:SetText(w[2])
      yy = yy + math.max(18, d:GetStringHeight()) + 9
    end
    f.h = yy
  end

  -- the bottom: dots, Skip, Back, Next
  local dots = {}
  for i = 1, 4 do local d = tut:CreateTexture(nil, "ARTWORK"); d:SetTexture(SLICE .. "dot"); d:SetSize(8, 8); d:SetPoint("BOTTOMLEFT", 22 + (i - 1) * 14, 25); dots[i] = d end
  local skipB = CreateFrame("Button", nil, tut); skipB:SetSize(70, 22); skipB:SetPoint("BOTTOMLEFT", 82, 18)
  skipB.t = fsOn(skipB, "bold", 12.5, COL.faint); skipB.t:SetPoint("LEFT", 0, 0); skipB.t:SetText("Skip setup")
  skipB:SetScript("OnEnter", function() skipB.t:SetTextColor(rgb(COL.text)) end); skipB:SetScript("OnLeave", function() skipB.t:SetTextColor(rgb(COL.faint)) end)
  local nextB = optButton(tut, "Next", 110, true); nextB:SetPoint("BOTTOMRIGHT", -18, 16)
  local backB = optButton(tut, "Back", 80, false); backB:SetPoint("RIGHT", nextB, "LEFT", -8, 0)
  local STEPS = {
    { "Set it up", "Three things, and your recap shows up after every boss pull." },
    { "How much do you want to see?", "Pick one. The sample card beside this changes as you click. You can switch any time." },
    { "Make it yours", "The four things most people change. Everything else waits in /db under Customize." },
    { "Using it", "After a boss pull, your recap pops up on your PC by itself. In WoW:" },
  }
  -- (from step 2 on, the card sits to the right showing the built-in sample, every section filled, like the settings' preview)
  local prevOn = false
  local function preview(on)
    if on and not prevOn then
      prevOn = true; Debrief_PreviewOn(); mini:Hide(); big:Hide(); card:Show(); render()
      card:ClearAllPoints(); card:SetPoint("TOPLEFT", tut, "TOPRIGHT", 16, 0); Debrief_FitPreview()
    elseif not on and prevOn then
      prevOn = false; Debrief_PreviewOff()
      card:SetScale(DB.scale or 1); card:ClearAllPoints()
      if DB.pos then card:SetPoint(DB.pos[1], UIParent, DB.pos[2], DB.pos[3], DB.pos[4]) else card:SetPoint("CENTER", 260, 60) end
      card:Hide()
    end
  end
  local cur = 1
  local function show(i)
    cur = i
    local st = STEPS[i]
    stepT:SetText("Step " .. i .. " of " .. #STEPS)
    preview(i > 1) -- (first, so step 1's checklist reads your own pulls, not the sample)
    if i == 1 then paint1() elseif i == 2 then paintStyles() elseif i == 3 then for _, p in ipairs(paint3) do p() end end
    title:SetText(st[1]); sub:SetText(st[2])
    local by = 98 + sub:GetStringHeight() + 18
    for k, f in pairs(panes) do f:SetShown(k == i) end
    panes[i]:ClearAllPoints(); panes[i]:SetPoint("TOPLEFT", 22, -by); panes[i]:SetHeight(panes[i].h); by = by + panes[i].h + 8
    for k, d in ipairs(dots) do d:SetVertexColor(rgb(k == i and "e6b450" or COL.line2)) end
    backB:SetShown(i > 1); skipB:SetShown(i < #STEPS)
    nextB.t:SetText(i == #STEPS and "Done" or "Next")
    tut:SetHeight(math.max(260, by + 60))
  end
  -- (closed any way: your own pulls and the card's own place again; said here too, not only in OnHide)
  local wasCard = false -- (the card comes back after only if it was open before)
  local function closed() if DB then DB.tutorialDone = true end; preview(false); if wasCard and DB and #DB.pulls > 0 and not (DebriefOptions and DebriefOptions:IsShown()) then card:Show(); render() end end
  local function finish() closed(); tut:Hide() end
  nextB:SetScript("OnClick", function() if cur >= #STEPS then local ch = optDirty; optDirty = false; finish(); say("all set. /recap shows your recap, /db changes the settings." .. (ch and " Type /reload so your PC pop-up uses your picks too." or "")) else show(cur + 1) end end)
  backB:SetScript("OnClick", function() if cur > 1 then show(cur - 1) end end)
  skipB:SetScript("OnClick", finish); cl:SetScript("OnClick", finish)
  tut:SetScript("OnHide", function() if prevOn then closed() elseif DB then DB.tutorialDone = true end end)
  function Debrief_Tutorial() if not DB then return end; if DebriefOptions and DebriefOptions:IsShown() then DebriefOptions:Hide() end; wasCard = card:IsShown() and not prevOn; show(1); tut:Show() end
end

-- ---------- a newer pull on your PC: Save this pull (Oct 25; called Bring it in, then Import into addon, at first) ----------
-- (WoW reads the saved pulls only at login or /reload, so after a boss fight the newest recap is on the PC pop-up and not yet here. The
-- addon sees the fight end, so the card says so in a gold strip, and Save this pull does the reload on your own click (never by itself,
-- never in a fight); the card opens again after it with every new pull)
local behindN, behindBoss = 0, nil
local bring = CreateFrame("Frame", "DebriefBring", UIParent); bring:SetSize(400, 36); bring:SetFrameStrata("HIGH"); bring:SetClampedToScreen(true); bring:Hide()
skin(bring, 7, "2a2212", 0.97, COL.gold, 0.85)
bring.t = bring:CreateFontString(nil, "OVERLAY"); setFont(bring.t, "bold", 13); bring.t:SetPoint("LEFT", 12, 0); bring.t:SetPoint("RIGHT", -142, 0); bring.t:SetJustifyH("LEFT"); bring.t:SetWordWrap(false); bring.t:SetTextColor(rgb(COL.text))
local bringB = CreateFrame("Button", nil, bring); bringB:SetSize(128, 26); bringB:SetPoint("RIGHT", -6, 0); skin(bringB, 5, COL.gold, 1, COL.gold, 1)
bringB.t = bringB:CreateFontString(nil, "OVERLAY"); setFont(bringB.t, "bold", 13); bringB.t:SetPoint("CENTER", 0, 0); bringB.t:SetTextColor(rgb("1b1406")); bringB.t:SetText("Save this pull")
bringB:SetScript("OnEnter", function() GameTooltip:SetOwner(bringB, "ANCHOR_TOP"); GameTooltip:SetText(bringB.t:GetText(), 1, 1, 1); GameTooltip:AddLine("A quick reload, a few seconds: WoW reads your newest pulls from Debrief Companion, and your card opens again with them.", 0.75, 0.78, 0.82, true); GameTooltip:Show() end)
bringB:SetScript("OnLeave", function() GameTooltip:Hide() end)
bringB:SetScript("OnClick", function()
  if InCombatLockdown() then say("after the fight: then Save this pull."); return end
  DB.openAfter = true
  if C_UI and C_UI.Reload then C_UI.Reload() elseif ReloadUI then ReloadUI() end
end)
-- (shown above the card while it's open, or on its own when there's no card yet)
function Debrief_BringShow(alone)
  if behindN == 0 or not DB or not (DEBRIEF_HAS_APP or DB.hasApp) then bring:Hide(); return end
  bring.t:SetText(behindN == 1 and ("Your newest pull" .. ((behindBoss and behindBoss ~= "") and (" on " .. behindBoss) or "") .. " isn't in the addon yet.") or (behindN .. " newer pulls aren't in the addon yet."))
  bringB.t:SetText(behindN == 1 and "Save this pull" or "Save these pulls")
  bring:ClearAllPoints(); bring.alone = nil
  if card:IsShown() then bring:SetParent(card); bring:SetFrameStrata("HIGH"); bring:SetPoint("BOTTOMLEFT", card, "TOPLEFT", 0, 6); bring:SetPoint("BOTTOMRIGHT", card, "TOPRIGHT", 0, 6); bring:Show()
  elseif alone then bring:SetParent(UIParent); bring:SetFrameStrata("HIGH"); bring:SetSize(400, 36); bring:SetPoint("CENTER", UIParent, "CENTER", 260, 160); bring.alone = true; bring:Show()
  else bring:Hide() end
end
-- (a boss fight ended: its recap is on the PC now, not yet here)
function Debrief_Behind(boss) behindN = behindN + 1; behindBoss = boss; Debrief_BringShow() end
function Debrief_BringIsShown() return bring:IsShown(), behindN end -- (for tests)

-- ---------- opening it: key, slash command ----------
function Debrief_Toggle()
  Debrief_PreviewFix()
  if big:IsShown() then big:Hide(); return end
  if DB and DB.mini and #DB.pulls > 0 and not card:IsShown() then if mini:IsShown() then mini:Hide() else miniShow() end; return end
  if card:IsShown() then card:Hide() elseif DB and DB.pulls and #DB.pulls > 0 then card:Show(); render()
  -- (nothing to show: say where the recaps come from)
  elseif bring.alone and bring:IsShown() then bring:Hide(); bring.alone = nil
  elseif behindN > 0 then Debrief_BringShow(true)
  else say("no pulls here yet. After a boss pull, your recap pops up on your PC, and /recap saves it here.") end
end
BINDING_HEADER_DEBRIEF = "Debrief"
BINDING_NAME_DEBRIEF_TOGGLE = "Show or hide the recap card"

-- (/dmo, "Debrief me open": the settings, in three letters)
SLASH_DEBRIEFMO1 = "/db"; SLASH_DEBRIEFMO2 = "/dmo" -- (/db first (the user, Oct 22); /dmo still works)
SlashCmdList.DEBRIEFMO = function() Debrief_ToggleOptions() end
SLASH_DEBRIEF1 = "/recap"; SLASH_DEBRIEF2 = "/dbr"; SLASH_DEBRIEF3 = "/debrief" -- (/recap first (the user, Oct 22); /dbr and /debrief still work)
SlashCmdList.DEBRIEF = function(msg)
  msg = (msg or ""):lower():gsub("^%s+", ""):gsub("%s+$", "")
  if msg == "options" or msg == "config" or msg == "settings" or msg == "o" then Debrief_ToggleOptions()
  elseif msg == "setup" or msg == "tutorial" or msg == "tour" then Debrief_Tutorial()
  elseif msg == "big" or msg == "b" then Debrief_ToggleBig()
  elseif msg == "mini" then DB.mini = not DB.mini; if DB.mini then DB.bigDefault = false end; say("mini bar " .. (DB.mini and "on: one slim line after each pull, click it for the card." or "off: the card after each pull.")); if DB.mini and #DB.pulls > 0 then card:Hide(); miniShow() else mini:Hide() end
  elseif msg == "reset" then DB.pos = nil; card:ClearAllPoints(); card:SetPoint("CENTER", 260, 60); say("card moved back to the middle.")
  elseif msg == "clear" then if PREV_REAL then PREV_REAL.pulls = {}; PREV_REAL.cur = nil else DB.pulls = {}; DB.cur = nil end; card:Hide(); big:Hide(); mini:Hide(); say("pulls cleared.")
  elseif msg == "demo" then
    -- (the built-in sample pull)
    local m = decode(SAMPLE)
    if m then m.demo = true; addPull(m); showCard(); say("showing a sample Mythic Coiled Altar wipe (made-up names; Vexmira is the Holy Paladin). Use the arrows to see other players.") end
  elseif msg == "log" then Debrief_ToggleLog()
  elseif msg == "help" then say("/db (or /dmo, or /debrief options): your settings. /debrief setup: the guided setup again. /debrief: show or hide the card. /debrief big: the big window. /debrief demo: a sample card. /debrief log: combat logging on or off (or the button on the card, or a key in Keybindings > AddOns > Debrief). /debrief reset: move the card back.")
  else Debrief_Toggle() end
end

local ev = CreateFrame("Frame")
ev:RegisterEvent("ADDON_LOADED"); ev:RegisterEvent("PLAYER_LOGIN"); ev:RegisterEvent("PLAYER_LOGOUT"); ev:RegisterEvent("PLAYER_REGEN_ENABLED"); ev:RegisterEvent("PLAYER_REGEN_DISABLED"); ev:RegisterEvent("ENCOUNTER_END"); ev:RegisterEvent("PLAYER_ENTERING_WORLD"); ev:RegisterEvent("ZONE_CHANGED_NEW_AREA"); ev:RegisterEvent("PLAYER_TARGET_CHANGED")
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
-- (a training dummy: any target named "... Dummy" that isn't a player)
local function isDummy(u) local n = UnitExists and UnitExists(u) and not UnitIsPlayer(u) and UnitName(u); return n and n:find("Dummy") ~= nil end
ev:SetScript("OnEvent", function(self, e, arg, a2, a3, a4)
  if e == "PLAYER_REGEN_DISABLED" then
    Debrief_CombatStart()
  elseif e == "PLAYER_REGEN_ENABLED" then
    Debrief_CombatEnd()
    if pendingShow then pendingShow = false; showCard() end
    if logPending then logPending = false; autoLog() end
  elseif e == "PLAYER_ENTERING_WORLD" then
    if C_Timer then C_Timer.After(2, autoLog) end
  elseif e == "PLAYER_TARGET_CHANGED" then
    -- (practising on a dummy: the combat log goes on, so Debrief Companion can read it)
    if isDummy("target") and DB and DB.autoLog ~= false and DB.hasApp and LoggingCombat and not LoggingCombat() then
      if GetCVar and SetCVar and GetCVar("advancedCombatLogging") ~= "1" then SetCVar("advancedCombatLogging", 1) end
      LoggingCombat(true); say("combat log is on for your practice. Hit the dummy, stop, and Debrief asks \"See your recap?\".")
    end
  elseif e == "ENCOUNTER_END" then
    -- (a nudge after a boss (Oct 24): the recap is on your PC at once; WoW brings it in at /reload. Raid and dungeon bosses)
    local itype = GetInstanceInfo and select(2, GetInstanceInfo()); local raidBoss = itype == "raid" or itype == "party" or a3 == 14 or a3 == 15 or a3 == 16 or a3 == 17 or a3 == 1 or a3 == 2 or a3 == 8 or a3 == 23 -- (and dungeon bosses since Oct 24)
    if DB and raidBoss and (DEBRIEF_HAS_APP or DB.hasApp) then Debrief_Behind(a2) end -- (Save this pull on the card (Oct 25))
    if DB and raidBoss and (DEBRIEF_HAS_APP or DB.hasApp) and DB.nudge == true and C_Timer then -- (off unless you switch it on (Oct 25))
      local boss = a2; C_Timer.After(6, function() say("your recap" .. ((boss and boss ~= "") and (" for " .. boss) or "") .. " is up on your PC. /recap and Save this pull adds it here too.") end)
    end
  elseif e == "PLAYER_LOGOUT" then Debrief_PreviewOff() -- (never save the sample in place of your pulls)
  elseif e == "ZONE_CHANGED_NEW_AREA" then
    if C_Timer then C_Timer.After(2, autoLog) end
  elseif e == "ADDON_LOADED" and arg == ADDON then
    DebriefDB = DebriefDB or {}
    DB = DebriefDB
    DB.pulls = DB.pulls or {}
    if UnitName then local me = UnitName("player"); if me and me ~= "" and me ~= UNKNOWNOBJECT then DB.me = me end end -- (your character, so the PC pop-up opens on your card (Oct 24))
    -- (your pulls from Debrief Companion, saved into Pulls.lua as they happen: added here at login or /reload, no pasting (Oct 22))
    -- (no more sharing (Oct 24): pulls a groupmate's addon sent before are cleared; your own and the sample stay)
    for i = #DB.pulls, 1, -1 do local q = DB.pulls[i]; if not q.own and not q.demo then table.remove(DB.pulls, i) end end
    if DB.cur and DB.cur > #DB.pulls then DB.cur = #DB.pulls > 0 and #DB.pulls or nil end
    if type(DEBRIEF_PULLS) == "table" then
      local n0 = #DB.pulls
      for _, c in ipairs(DEBRIEF_PULLS) do local m = decode(c); if m then addPull(m, true) end end
      DEBRIEF_PULLS = nil
      if #DB.pulls > 0 then DB.cur = #DB.pulls end
      DB.fromApp = #DB.pulls - n0
    end
    if DEBRIEF_HAS_APP then DB.hasApp = true end -- (Debrief Companion is on this PC)
    DB.raidAlways = nil; DB.glowCds = nil -- (no leads-only Raid view and no cooldown glow any more (Oct 25))
    DB.show = DB.show or {}
    if DB.detailed and DB.width == "large" and not DB.xlOnce then DB.width = "xl" end; DB.xlOnce = true
    if not DB.glanceDefault then DB.glanceDefault = true; DB.detailedDefault = true; DB.threeStyles = true; if DB.preset == nil then Debrief_SetPreset("standard") end end -- (new players start on Standard (Oct 24))
    -- (five styles became three (Oct 24): Glance and Medium are Standard now, Heavy is Detailed; Simple and Detailed get their new sections)
    if not DB.noMini then DB.noMini = true; DB.mini = false end -- (the mini bar left the settings (Oct 24))
    DB.who = nil -- (every login and /reload starts on you (Oct 24))
    DB.bigDefault = nil -- (the card is the one recap window (Oct 24): nothing opens the big window by itself)
    if not DB.threeStyles then DB.threeStyles = true; local was = DB.preset
      if was == "glance" or was == "medium" then Debrief_SetPreset("standard") elseif was == "heavy" or was == "detailed" then Debrief_SetPreset("detailed") elseif was == "simple" then Debrief_SetPreset("simple") end end
    if not DB.detailedDefault then DB.detailedDefault = true; if DB.preset == nil or DB.preset == "medium" then Debrief_SetPreset("detailed") end end -- (the Detailed card is the default since Oct 21)
    registerSettings()
    reapplyFonts(); card:SetScale(DB.scale or 1); big:SetScale(DB.bigScale or 1); mini:SetScale(DB.miniScale or 1)
    Debrief_ApplyStyle()
    if DB.openSecs == nil then DB.openSecs = DB.preset ~= "standard" end -- (Standard opens folded since Oct 25)
    if not DB.diedBack then DB.maxDied = 3; DB.diedBack = true end -- (once: the Who died list is shown again; the filter is Stop at)
    autoLog()
    if DB.pos then card:ClearAllPoints(); card:SetPoint(DB.pos[1], UIParent, DB.pos[2], DB.pos[3], DB.pos[4]) end
  elseif e == "PLAYER_LOGIN" then
    Debrief_ApplyStyle()
    -- (Advanced Combat Logging on from the start, so every log Debrief reads has positions and health; the combat log itself goes on in raids and at dummies)
    if DB.autoLog ~= false and GetCVar and SetCVar and GetCVar("advancedCombatLogging") ~= "1" then SetCVar("advancedCombatLogging", 1) end
    -- (the first time: the guided setup, a few seconds after you're in the world)
    if not DB.tutorialDone and C_Timer then C_Timer.After(6, function() if not InCombatLockdown() and not DB.tutorialDone then Debrief_Tutorial() end end) end
    -- (a key to start with: Ctrl+Shift+D shows or hides your recap, if nothing else uses it; it opened the paste box until Oct 24.
    -- Change it in Options > Keybindings > AddOns)
    if not InCombatLockdown() and GetBindingAction and SetBinding then
      local a0 = GetBindingAction("CTRL-SHIFT-D")
      if a0 == "DEBRIEF_PASTE" or (a0 == "" and not DB.keySet) then if SetBinding("CTRL-SHIFT-D", "DEBRIEF_TOGGLE") then SaveBindings(GetCurrentBindingSet()) end end
      DB.keySet = true
    end
    if DB.openAfter then DB.openAfter = nil; if C_Timer and #DB.pulls > 0 then C_Timer.After(1, function() if not InCombatLockdown() then card:Show(); render() end end) end end -- (Save this pull: the card again (Oct 25))
    if DEBRIEF_HAS_APP or DB.hasApp then say("ready. Your recap pops up on your PC after each boss pull." .. ((DB.fromApp or 0) > 0 and (" " .. DB.fromApp .. " new pull" .. (DB.fromApp == 1 and "" or "s") .. " from Debrief Companion: /recap.") or " /recap shows them here too."))
    else say("ready. Your recaps come from Debrief Companion on your PC. /debrief demo shows a sample.") end
  end
end)

-- ---------- problems: noted for "Report a problem" in Debrief Companion, said once, never an error box (Oct 24) ----------
-- (the last 10, the same one counted; WoW's save carries them to the app at /reload or logout. A problem while loading still shows)
local saidProblem = false
function Debrief_NoteError(err)
  if not DB then return end
  local m = tostring(err or "?"):gsub("^.-AddOns[/\\]Debrief[/\\]", ""):gsub("[\r\n]+", " "):sub(1, 300)
  DB.errors = DB.errors or {}
  local hit; for _, e in ipairs(DB.errors) do if e.m == m then hit = e end end
  if hit then hit.n = (hit.n or 1) + 1; hit.t = (time and time()) or 0
  else table.insert(DB.errors, { m = m, n = 1, t = (time and time()) or 0, v = MY_V }); while #DB.errors > 10 do table.remove(DB.errors, 1) end end
  if not saidProblem then saidProblem = true; say("hit a problem and skipped it. It's noted: Report a problem in Debrief Companion sends it to us.") end
end
local function guard(f) return function(...) local ok, err = pcall(f, ...); if not ok then if DB then Debrief_NoteError(err) else error(err, 0) end end end end
do local f = ev:GetScript("OnEvent"); if f then ev:SetScript("OnEvent", guard(f)) end end
SlashCmdList.DEBRIEF = guard(SlashCmdList.DEBRIEF); SlashCmdList.DEBRIEFMO = guard(SlashCmdList.DEBRIEFMO)
do local f = bigRender; bigRender = function() local ok, err = pcall(f); if not ok then Debrief_NoteError(err) end end end
