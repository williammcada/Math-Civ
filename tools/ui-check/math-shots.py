"""v0.5 M: opens every order's math dialog in the real interface (student behaviour) and screenshots it. Usage: math-shots.py W H"""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
OUT = ROOT + '/.test-out/math'; os.makedirs(OUT, exist_ok=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': W, 'height': H}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(f'file://{ROOT}/.test-out/app-harness.html#seed=4'); await pg.wait_for_timeout(4000)
        bad = []
        for ch in [1, 2, 3, 4]:
            await pg.evaluate(f"(()=>{{const s=app.state;s.phase='orders';s.chapterIndex={ch};s.commandSeals=3;s.usedOrders=[];s.activeOrder=null;s.pendingReward=null;s.variants={{}};s.resources.food=2000;s.resources.currency=2000;s.resources.materials=2000;s.resources.authority=90;s.diplomacy.coalitionCohesion=60;app.view='play';app.tab='Realm';app.family='all';app.render();}})()")
            await pg.wait_for_timeout(400)
            ids = await pg.eval_on_selector_all('[data-action^="detail:"]', 'els=>els.map(e=>e.dataset.action.slice(7))')
            for oid in ids:
                await pg.evaluate("document.querySelector('dialog')?.remove()")
                await pg.click(f'[data-action="detail:{oid}"]'); await pg.wait_for_timeout(300)
                plan = await pg.query_selector(f'dialog [data-action="open:{oid}"]:not([disabled])')
                if not plan: bad.append(oid + ' (cannot open)'); continue
                await plan.click(); await pg.wait_for_timeout(500)
                txt = await pg.inner_text('dialog') if await pg.query_selector('dialog') else ''
                if 'undefined' in txt or 'NaN' in txt or '[object' in txt or '?' in txt.split('Your figures')[0][-5:]: bad.append(oid + ' (bad text)')
                await pg.screenshot(path=f'{OUT}/{W}_ch{ch}_{oid}.png')
                await pg.evaluate("app.dispatch({type:'CLOSE_ORDER'});document.querySelector('dialog')?.remove()"); await pg.wait_for_timeout(200)
        print(W, 'problems shown:', len(os.listdir(OUT)), '· problems with display issues:', bad or 'none', '· errors:', errs[:3])
asyncio.run(main())
