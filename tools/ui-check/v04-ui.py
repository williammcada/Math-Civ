"""v0.4 interface check: drives the offline build in headless Chromium and saves screenshots.
Usage: python3 tools/ui-check/v04-ui.py [width height] -> .test-out/v04/"""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = 'file://' + ROOT + '/release/PLAY-SEKIGAHARA-0.5.1.html'
OUT = ROOT + '/.test-out/v04'
async def run(w, h):
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': w, 'height': h}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        async def shot(tag): await pg.screenshot(path=f'{OUT}/{w}_{tag}.png')
        async def click(sel, t=600): await pg.click(sel); await pg.wait_for_timeout(t)
        await click('[data-action="new"]'); await pg.evaluate("document.querySelector('#seed').value='1'"); await click('[data-action="start"]', 1500)
        await click('[data-action="advance"]', 1200)  # prologue -> chronicle: chapter 1 scene opens
        await shot('ch1_beat1')
        for k in range(2, 5):
            await click('[data-scene="next"]', 1400); await shot(f'ch1_beat{k}')
        await pg.wait_for_timeout(3000); await shot('ch1_map_end')
        await click('[data-scene="next"]', 900); await shot('chronicle_after')
        await click('[data-action="advance"]', 800); await click('[data-action="map"]', 1200); await shot('map_all')
        await pg.click('.geo-map [data-place="osaka"] .hit', force=True); await pg.wait_for_timeout(700); await shot('map_osaka')
        await click('[data-action="map-zoom"]', 1500); await shot('map_mino')
        print(w, 'errors:', errs[:8]); await b.close()
w, h = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
asyncio.run(run(w, h))
