"""Student file: Battle Practice asks for the teacher password (default admin123); wrong password refused. Usage: teacher-check.py W H"""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': W, 'height': H}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + ROOT + '/release/PLAY-SEKIGAHARA-0.5.0.html'); await pg.wait_for_timeout(2500)
        await pg.click('[data-action="lab-config"]'); await pg.wait_for_timeout(400)
        asked = bool(await pg.query_selector('#teacher-password'))
        await pg.fill('#teacher-password', 'wrong'); await pg.click('[data-action="teacher-unlock"]'); await pg.wait_for_timeout(1500)
        refused = (await pg.inner_text('#teacher-notice')).strip()
        await pg.fill('#teacher-password', 'admin123'); await pg.click('[data-action="teacher-unlock"]'); await pg.wait_for_timeout(2000)
        opened = not await pg.query_selector('#teacher-password')
        banner = await pg.query_selector('.dev-banner')
        print(W, 'password asked:', asked, '· wrong refused:', repr(refused), '· admin123 opens:', opened, '· DEV banner in student file:', bool(banner), '· errors:', errs)
asyncio.run(main())
