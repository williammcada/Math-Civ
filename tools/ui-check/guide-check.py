"""v0.5 Field Guide check: opens from the title screen and from the battle's More menu, shows all six tabs. Usage: guide-check.py W H [file]"""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = int(sys.argv[1]), int(sys.argv[2])
FILE = sys.argv[3] if len(sys.argv) > 3 else 'PLAY-SEKIGAHARA-0.5.0-DEV-PLAYTEST.html'
OUT = ROOT + '/.test-out/guide'; os.makedirs(OUT, exist_ok=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': W, 'height': H}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + ROOT + '/release/' + FILE); await pg.wait_for_timeout(2000)
        await pg.click('[data-action="guide"]'); await pg.wait_for_timeout(500)
        tabs = await pg.eval_on_selector_all('dialog [data-action^="guide:"]', 'els=>els.map(e=>e.dataset.action)')
        for t in tabs:
            await pg.click(f'dialog [data-action="{t}"]'); await pg.wait_for_timeout(300)
            sel = await pg.eval_on_selector('dialog [aria-selected="true"]', 'e=>e.dataset.action')
            assert sel == t, (sel, t)
            await pg.screenshot(path=f'{OUT}/{W}_{t.split(":")[1]}.png', full_page=W < 600)
        await pg.click('dialog [data-action="close"]'); await pg.wait_for_timeout(300)
        opened_in_battle = None
        if 'DEV' in FILE:
            await pg.select_option('#dev-start', 'battle'); await pg.click('[data-action="dev-start"]'); await pg.wait_for_timeout(1200)
            for i in range(5):
                if await pg.evaluate("!!document.querySelector('.scene-player')"): await pg.evaluate("document.querySelector('[data-scene=skip]').click()"); await pg.wait_for_timeout(400)
            await pg.click('[data-action="battle-more"]'); await pg.wait_for_timeout(300)
            await pg.click('dialog [data-action="guide:battle"]'); await pg.wait_for_timeout(400)
            opened_in_battle = await pg.eval_on_selector('dialog [aria-selected="true"]', 'e=>e.dataset.action')
            await pg.screenshot(path=f'{OUT}/{W}_in_battle.png')
        print(W, 'tabs:', len(tabs), '· opened in battle at:', opened_in_battle, '· errors:', errs)
asyncio.run(main())
