"""v0.5 touch battle screen check on the DEV file: deployment, ring, move, attack sheet, enemy turn. Usage: battle-v5.py W H"""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = 'file://' + ROOT + '/release/PLAY-SEKIGAHARA-0.5.1-DEV-PLAYTEST.html'
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
        board = lambda: pg.evaluate("document.querySelector('.bv5-grid').innerHTML.length+':'+[...document.querySelectorAll('.bu')].map(e=>e.parentElement.dataset.x+','+e.parentElement.dataset.y).join(';')")
        b0 = await board(); await pg.wait_for_timeout(3000); waits = (await board()) == b0 and bool(await pg.query_selector('.bv5-east'))
        await pg.click('.bu-active >> xpath=..'); await pg.wait_for_timeout(500); await shot('3_ring')
        blocked = await pg.eval_on_selector_all('.bv5-ring-btn.blocked', 'els=>els.map(e=>e.getAttribute("aria-label"))')
        await pg.click('[data-action="ring:move"]'); await pg.wait_for_timeout(400)
        cancel = await pg.query_selector('[data-action="mode-cancel"]'); can = bool(cancel)
        if cancel: await cancel.click(); await pg.wait_for_timeout(300)
        back = not await pg.query_selector('[data-action="mode-cancel"]')
        print(W, 'greyed in ring:', blocked, '· Cancel shown:', can, '· Cancel returns:', back, '· End in banner:', bool(await pg.query_selector('.bv5-banner [data-action="tactic:end"]')))
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
        paused = stepped = None
        if await pg.query_selector('[data-action="enemy-pause"]'):
            await pg.click('[data-action="enemy-pause"]'); await pg.wait_for_timeout(400)
            p0 = await board(); t0 = await pg.inner_text('.bv5-ticker'); await pg.wait_for_timeout(3000)
            paused = (await board()) == p0 and (await pg.inner_text('.bv5-ticker')) == t0
            nx = await pg.query_selector('[data-action="enemy-next"]')
            if nx:
                await nx.click(); await pg.wait_for_timeout(1500); stepped = (await pg.inner_text('.bv5-ticker')) != t0 or (await board()) != p0
            if await pg.query_selector('[data-action="enemy-pause"]'): await pg.click('[data-action="enemy-pause"]')
        print(W, 'player turn waits:', waits, '· pause holds the enemy:', paused, '· next-step works:', stepped)
        print(W, 'errors:', errs[:5]); await b.close()
asyncio.run(main())
