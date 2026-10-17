import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1400,'height':900})
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('console:'+m.text) if m.type=='error' else None)
        await pg.goto('file:///home/claude/web/WoW-Log-Analyzer.html')
        await pg.set_input_files('#fileIn','test.log')
        await pg.wait_for_selector('.tabs', timeout=8000)
        # select first raid pull
        await pg.click('.pull >> nth=0'); await pg.wait_for_timeout(500)
        for t in ['overview','mistakes','damage','healing','taken','surv','deaths','player']:
            await pg.click(f'.tab[data-t="{t}"]'); await pg.wait_for_timeout(250)
            await pg.screenshot(path=f'shot_{t}.png')
        await pg.click('.pull >> nth=2'); await pg.wait_for_timeout(500)
        await pg.click('.tab[data-t="overview"]'); await pg.wait_for_timeout(250)
        await pg.screenshot(path='shot_run.png')
        print('errors:', [e for e in errs if 'zamimg' not in e and 'fonts' not in e and 'ERR_' not in e])
        await b.close()
asyncio.run(main())
