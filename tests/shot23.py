import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1440,'height':1000}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/web/WoW-Log-Analyzer.html')
        await pg.set_input_files('#fileIn','ca.log'); await pg.wait_for_selector('.tabs')
        await pg.click('.tab[data-t="audit"]'); await pg.wait_for_timeout(500)
        el=await pg.query_selector('#view'); await el.screenshot(path='audit_full.png')
        print('errors',errs); await b.close()
asyncio.run(main())
