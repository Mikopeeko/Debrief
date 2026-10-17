import asyncio
from playwright.async_api import async_playwright
NOTE = """EncounterID:3600;Difficulty:Mythic;Name:The Coiled Altar;
time:95;ph:1;tag:Dps6;spellid:196718;
time:96;ph:1;tag:Mendy;spellid:98008;
time:3;ph:3;tag:Mendy;spellid:2825;
Guillotine 1: Dps0 Dps2 Dps4 Dps7 Tanktwo Healy
Grim Guillotine 1: Dps0 Dps1 Dps3 Dps5 Tankone Tanktwo
{skull} Kicks: Tankone Dps9 Dps10
Purple orbs: Dps3 Dps8 Dps11
Healers: Healy Mendy Fixer Leafy Glow Nickname"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1440,'height':1300}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/web/WoW-Log-Analyzer.html')
        await pg.set_input_files('#fileIn','ca2.log'); await pg.wait_for_selector('.tabs')
        await pg.click('.tab[data-t="assign"]'); await pg.wait_for_timeout(300)
        await pg.fill('#noteBox', NOTE); await pg.click('#noteSave'); await pg.wait_for_timeout(500)
        el=await pg.query_selector('#view'); await el.screenshot(path='assign.png')
        await pg.click('.tab[data-t="mistakes"]'); await pg.wait_for_timeout(300)
        html = await pg.inner_html("#view"); print("assignment mistakes in tab:", html.count("assignment") + html.count("Assigned cooldown"))
        print('errors',errs); await b.close()
asyncio.run(main())
