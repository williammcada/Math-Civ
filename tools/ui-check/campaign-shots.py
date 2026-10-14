"""Screenshots of every campaign screen in Chapter 1 of the DEV file (v0.5 less-text pass). Usage: campaign-shots.py W H [version]"""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V = sys.argv[3] if len(sys.argv) > 3 else '0.5.1'
START = sys.argv[4] if len(sys.argv) > 4 else 'ch1'
URL = 'file://' + ROOT + f'/release/PLAY-SEKIGAHARA-{V}-DEV-PLAYTEST.html'
OUT = ROOT + '/.test-out/camp'; os.makedirs(OUT, exist_ok=True)
W, H = int(sys.argv[1]), int(sys.argv[2])
# v0.5 R3: the screen's main button must be on screen and not covered, without scrolling anything.
VISIBLE = """(()=>{const root=document.querySelector('dialog[open]')||document.querySelector('.scene-player')||document;const b=root.querySelector('button.primary:not([disabled])');if(!b)return null;
 const r=b.getBoundingClientRect();if(r.bottom>innerHeight||r.top<0||r.right>innerWidth||r.left<0||!r.width)return false;const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!e&&(e===b||b.contains(e));})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': W, 'height': H}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2000)
        q = lambda js: pg.evaluate(js)
        await pg.select_option('#dev-start', START); await pg.click('[data-action="dev-start"]'); await pg.wait_for_timeout(1500)
        seen = {}; n = 0; hidden = []
        for i in range(80):
            if await q("!!document.querySelector('.scene-player')"): await q("document.querySelector('[data-scene=skip]').click()"); await pg.wait_for_timeout(400); continue
            dlg = await q("document.querySelector('dialog h2')?.textContent||''")
            key = (await q("(document.querySelector('.eyebrow')?.textContent||'')+'|'+(document.querySelector('main h2, .frame h2')?.textContent||'')"))
            tag = ('dlg:' + dlg) if dlg else key
            if tag not in seen:
                n += 1; seen[tag] = n
                await pg.screenshot(path=f'{OUT}/{W}_{START}_{n:02d}.png', full_page=W < 600)
                vis = await pg.evaluate(VISIBLE)
                if vis is False: hidden.append(tag[:60])
                print(n, tag[:90], '' if vis is not False else '<< main button not visible')
            if dlg:
                for sel in ['dialog [data-action="close-result"]', 'dialog #yes', 'dialog [data-action^="open:"]', 'dialog [data-action="close"]']:
                    if await pg.query_selector(sel + ':not([disabled])'): await pg.click(sel + ':not([disabled])'); await pg.wait_for_timeout(500); break
                continue
            card = await pg.query_selector('[data-action^="detail:"]:not([disabled])')
            if card and 'LEFT THIS CHAPTER' in key and not key.strip().startswith('0 '): await card.click(); await pg.wait_for_timeout(500); continue
            done = False
            for sel in ['[data-action^="policy:"]', '[data-action="advance"]', '[data-action="end"]']:
                if await pg.query_selector(sel + ':not([disabled])'): await pg.click(sel + ':not([disabled])'); await pg.wait_for_timeout(600); done = True; break
            stop = {'ch1': 'CHAPTER 2 /', 'ch2': 'CHAPTER 3 /', 'ch3': 'CHAPTER 4 /'}.get(START, 'BATTLE PREPARATION')
            if not done or stop in (await q("document.body.innerText")).upper()[:400]: break
        print(W, 'main button hidden on:', hidden or 'none', '· errors:', errs)
asyncio.run(main())
