"""v0.5 touch battle screen check on the DEV file: deployment, ring, move, attack sheet, enemy turn. Usage: battle-v5.py W H"""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = 'file://' + ROOT + '/release/PLAY-SEKIGAHARA-0.5.0-DEV-PLAYTEST.html'
OUT = ROOT + '/.test-out/bv5'; os.makedirs(OUT, exist_ok=True)
W, H = int(sys.argv[1]), int(sys.argv[2])
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': W, 'height': H}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2000)
        await pg.select_option('#dev-start', 'battle'); await pg.click('[data-action="dev-start"]'); await pg.wait_for_timeout(1200)
        await pg.evaluate("document.querySelector('[data-scene=skip]')?.click()"); await pg.wait_for_timeout(600)
        shot = lambda t: pg.screenshot(path=f'{OUT}/{W}_{t}.png', full_page=W < 600)
        await shot('1_deploy')
        await pg.click('[data-action="begin-battle"]'); await pg.wait_for_timeout(600)
        if await pg.query_selector('dialog #yes'): await pg.click('dialog #yes'); await pg.wait_for_timeout(800)
        for i in range(40):
            if await pg.query_selector('.scene-player'): await pg.evaluate("document.querySelector('[data-scene=skip]').click()"); await pg.wait_for_timeout(400); continue
            if await pg.query_selector('.bv5-east'): break
            await pg.wait_for_timeout(700)
        await shot('2_your_turn')
        await pg.click('.bu-active >> xpath=..'); await pg.wait_for_timeout(500); await shot('3_ring')
        await pg.click('[data-action="ring-close"]'); await pg.wait_for_timeout(300)
        tg = await pg.query_selector('.bt-target')
        if tg:
            await tg.click(); await pg.wait_for_timeout(500); await shot('4_attack_sheet'); await pg.click('[data-action="battle-confirm"]'); await pg.wait_for_timeout(1500)
        else:
            mv = await pg.query_selector_all('.bt-move'); await mv[len(mv)//2].click(); await pg.wait_for_timeout(900)
        await shot('5_after_action')
        for i in range(30):
            if await pg.query_selector('.bv5-west'): break
            e = await pg.query_selector('[data-action="tactic:end"]')
            if e: await e.click(); await pg.wait_for_timeout(500)
            if await pg.query_selector('.scene-player'): await pg.evaluate("document.querySelector('[data-scene=skip]').click()"); await pg.wait_for_timeout(300)
        await pg.wait_for_timeout(600); await shot('6_enemy_turn')
        print(W, 'errors:', errs[:5]); await b.close()
asyncio.run(main())
