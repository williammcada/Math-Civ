"""Checks the owner DEV playtest file (U-13): setup panel, no math dialogs, banner, no saves. Usage: dev-check.py W H"""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = 'file://' + ROOT + '/release/PLAY-SEKIGAHARA-0.5.0-DEV-PLAYTEST.html'
OUT = ROOT + '/.test-out/dev'; os.makedirs(OUT, exist_ok=True)
W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': W, 'height': H}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.screenshot(path=f'{OUT}/{W}_setup.png')
        q = lambda js: pg.evaluate(js)
        async def click(sel, t=700): await pg.click(sel); await pg.wait_for_timeout(t)
        # chapter 1 run: scene, council, policy, issue every order without a math dialog
        await click('[data-action="dev-start"]', 1500); await pg.screenshot(path=f'{OUT}/{W}_start.png')
        math_dialogs = 0; results = 0
        for i in range(60):
            if await q("!!document.querySelector('.scene-player')"): await q("document.querySelector('[data-scene=skip]').click()"); await pg.wait_for_timeout(400); continue
            if await q("!!document.querySelector('dialog.math-dialog')"): math_dialogs += 1
            if await q("!!document.querySelector('dialog [data-action=close-result]')"):
                results += 1
                if results == 1: await pg.screenshot(path=f'{OUT}/{W}_order_result.png')
                await click('dialog [data-action="close-result"]', 400); continue
            if await q("!!document.querySelector('dialog')"):
                for sel in ['dialog #yes', 'dialog [data-action^="open:"]', 'dialog [data-action="close"]']:
                    if await pg.query_selector(sel + ':not([disabled])'): await click(sel + ':not([disabled])', 500); break
                continue
            card = await pg.query_selector('[data-action^="detail:"]:not([disabled])')
            if card and await q("app?.state?.phase")=='orders' if False else card and await q("document.querySelector('.eyebrow')?.textContent.includes('LEFT THIS CHAPTER')"):
                await card.click(); await pg.wait_for_timeout(500); continue
            done = False
            for sel in ['[data-action^="policy:"]', '[data-action="advance"]']:
                if await pg.query_selector(sel + ':not([disabled])'): await click(sel + ':not([disabled])', 500); done = True; break
            if not done: break
        await pg.screenshot(path=f'{OUT}/{W}_after_ch1.png')
        eyebrow = await q("document.querySelector('.eyebrow')?.textContent||''")
        saves = await q("""(async()=>{const names=(await indexedDB.databases()).map(d=>d.name);const out={};for(const n of names){const db=await new Promise((res,rej)=>{const r=indexedDB.open(n);r.onsuccess=()=>res(r.result);r.onerror=rej;});for(const st of db.objectStoreNames){out[n+'/'+st]=await new Promise(res=>{const c=db.transaction(st).objectStore(st).count();c.onsuccess=()=>res(c.result);});}db.close();}out.localStorage=Object.keys(localStorage);return JSON.stringify(out);})()""")
        print('math dialogs seen:', math_dialogs, '· order results seen:', results, '· now at:', eyebrow, '· databases:', saves)
        # battle start
        await click('[data-action="dev-setup"]', 800); await pg.select_option('#dev-start', 'battle'); await click('[data-action="dev-start"]', 1500)
        await pg.screenshot(path=f'{OUT}/{W}_battle_dawn.png'); await q("document.querySelector('[data-scene=skip]')?.click()"); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'{OUT}/{W}_battle_deploy.png')
        await click('[data-action="dev-gallery"]', 600); await pg.screenshot(path=f'{OUT}/{W}_gallery.png')
        await click('[data-action="dev-scene:ch4"]', 1200); await pg.screenshot(path=f'{OUT}/{W}_gallery_ch4.png')
        banner = await q("document.querySelector('.dev-banner')?.textContent")
        print('banner:', banner, '· errors:', errs[:5]); await b.close()
asyncio.run(main())
