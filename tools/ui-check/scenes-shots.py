"""Screenshots every beat of every v0.4 scene from the harness. Usage: python3 tools/ui-check/scenes-shots.py W H [phone]"""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = 'file://' + ROOT + '/.test-out/scene-harness.html#'
OUT = ROOT + '/.test-out/scenes'; os.makedirs(OUT, exist_ok=True)
W, H = int(sys.argv[1]), int(sys.argv[2]); PHONE = len(sys.argv) > 3
CASES = ['ch1', 'ch2', 'ch3', 'ch4&gifu=1&koba=80', 'ch4&gifu=0&koba=30', 'dawn', 'koba_east&side=east', 'koba_west&side=west', 'koba_hold&side=inactive', 'west',
         'ending&side=east&result=victory&reason=core_rout&tier=good', 'ending&side=west&result=defeat&reason=camp_held&tier=normal']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        for case in CASES:
            pg = await b.new_page(viewport={'width': W, 'height': H}); pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL + case + ('&phone=1' if PHONE else '')); await pg.wait_for_timeout(1500)
            n = await pg.evaluate("document.querySelectorAll('.scene-dots i').length")
            tag = case.replace('&', '_').replace('=', '')
            for k in range(n):
                if k: await pg.click('[data-scene="next"]'); await pg.wait_for_timeout(1300)
                is_map = await pg.evaluate("!!document.querySelector('.scene-frame.on.map-frame')")
                if is_map: await pg.wait_for_timeout(13000)
                await pg.screenshot(path=f'{OUT}/{W}_{tag}_{k+1}.png', full_page=PHONE)
            await pg.close()
        print('pages:', len(CASES), 'errors:', errs[:5]); await b.close()
asyncio.run(main())
