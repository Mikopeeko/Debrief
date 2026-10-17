import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1440,'height':1100}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/web/WoW-Log-Analyzer.html')
        await pg.set_input_files('#fileIn','ca2.log'); await pg.wait_for_selector('.tabs')
        await pg.click('.tab[data-t="audit"]'); await pg.wait_for_timeout(500)
        await pg.eval_on_selector('#sec-push','e=>e.scrollIntoView()'); await pg.wait_for_timeout(200); await pg.screenshot(path='a_push.png')
        await pg.click('#sec-soakq .mmb'); await pg.wait_for_timeout(300)
        await pg.eval_on_selector('#sec-soakq','e=>e.scrollIntoView()'); await pg.wait_for_timeout(200); await pg.screenshot(path='a_soakq.png')
        await pg.click('.tab[data-t="progress"]'); await pg.wait_for_timeout(1200)
        print('errors',errs); await b.close()
asyncio.run(main())
