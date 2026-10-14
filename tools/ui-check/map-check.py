"""v0.5 R1: no two map labels overlap, at every map zoom and in the scene maps. Usage: map-check.py W H"""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
OUT = ROOT + '/.test-out/map'; os.makedirs(OUT, exist_ok=True)
OVERLAPS = """(()=>{const svg=[...document.querySelectorAll('svg.geo-map')].pop();if(!svg)return null;
 const els=[...svg.querySelectorAll('text')].filter(t=>{const cs=getComputedStyle(t);let e=t,o=1;while(e&&e!==svg){const c=getComputedStyle(e);if(c.display==='none'||c.visibility==='hidden')return false;o*=parseFloat(c.opacity);e=e.parentElement;}return o>0.3&&t.textContent.trim()&&t.getBoundingClientRect().width>0;});
 const r=els.map(t=>({t:t.textContent.trim(),b:t.getBoundingClientRect()}));const out=[];
 for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){const a=r[i].b,b=r[j].b;const x=Math.min(a.right,b.right)-Math.max(a.left,b.left),y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(x>1&&y>1)out.push(r[i].t+' × '+r[j].t);}return {labels:r.length,overlaps:out};})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': W, 'height': H}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + ROOT + '/release/PLAY-SEKIGAHARA-0.5.1-DEV-PLAYTEST.html'); await pg.wait_for_timeout(2000)
        await pg.select_option('#dev-start', 'ch3'); await pg.click('[data-action="dev-start"]'); await pg.wait_for_timeout(1500)
        results = {}
        # scene maps: step through the chapter 3 scene and measure each map beat
        for i in range(12):
            if not await pg.query_selector('.scene-player'): break
            await pg.wait_for_timeout(1600)
            r = await pg.evaluate(OVERLAPS)
            if r: results[f'scene beat {i+1}'] = r; await pg.screenshot(path=f'{OUT}/{W}_scene_{i+1}.png')
            nx = await pg.query_selector('[data-scene=next]')
            if not nx: break
            await nx.click(); await pg.wait_for_timeout(400)
        if await pg.query_selector('.scene-player'): await pg.evaluate("document.querySelector('[data-scene=skip]')?.click()")
        for i in range(4):
            if await pg.query_selector('[data-action="map"]:not([disabled])') and 'COUNCIL' in (await pg.inner_text('body')).upper(): break
            if await pg.query_selector('[data-action="advance"]'): await pg.click('[data-action="advance"]'); await pg.wait_for_timeout(600)
        await pg.click('[data-action="map"]'); await pg.wait_for_timeout(1500)
        results['map tab, whole map'] = await pg.evaluate(OVERLAPS); await pg.screenshot(path=f'{OUT}/{W}_map_all.png')
        if await pg.query_selector('[data-action="map-zoom"]'):
            await pg.click('[data-action="map-zoom"]'); await pg.wait_for_timeout(1500)
            results['map tab, Mino close-up'] = await pg.evaluate(OVERLAPS); await pg.screenshot(path=f'{OUT}/{W}_map_mino.png')
        bad = {k: v['overlaps'] for k, v in results.items() if v and v['overlaps']}
        print(W, 'views checked:', len(results), '· overlaps:', bad or 'none', '· errors:', errs)
asyncio.run(main())
