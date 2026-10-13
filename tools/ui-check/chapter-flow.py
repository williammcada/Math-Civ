"""Walks chapters 1-4 through the real UI harness (skipping orders) and screenshots each scene that opens."""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = ROOT + '/.test-out/chapters'; os.makedirs(OUT, exist_ok=True)
W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': W, 'height': H}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        st = lambda js: pg.evaluate(js)
        await pg.goto(f'file://{ROOT}/.test-out/app-harness.html#fresh=1'); await pg.wait_for_timeout(2500)
        await pg.click('[data-action="new"]'); await pg.evaluate("document.querySelector('#seed').value='5'"); await pg.click('[data-action="start"]'); await pg.wait_for_timeout(1200)
        seen = []
        for i in range(160):
            if i<0: print(i, await st("app.state.phase+' s'+app.state.commandSeals+' a'+(app.state.activeOrder?.orderId??'-')+' att'+(app.state.activeOrder?.attempts??'')+' scene'+!!document.querySelector('.scene-player')+' dlg'+!!document.querySelector('dialog')"))
            sc = await st("document.querySelector('.scene-player')?.getAttribute('aria-label')||null")
            if sc:
                n = await st("document.querySelectorAll('.scene-dots i').length")
                for k in range(n):
                    if k: await pg.click('[data-scene="next"]'); await pg.wait_for_timeout(700)
                await pg.wait_for_timeout(1500 if 'council' not in sc else 3000)
                await pg.screenshot(path=f'{OUT}/{W}_{len(seen):02d}_{sc[:30].replace(" ","_").replace("·","").replace("’","")}.png'); seen.append(sc)
                await pg.click('[data-scene="next"]'); await pg.wait_for_timeout(700); continue
            phase = await st("(()=>{const t=document.querySelector('.eyebrow')?.textContent||'';return t})()")
            if await st("app.state?.phase==='orders'&&app.state.commandSeals>0"):
                await st("(()=>{const ids=['c1_labor_ledger','c1_tax_register','c1_repair_tokaido','c1_court_letters','c2_march_provisions','c2_reinforce_edo','c2_muster_bands','c2_secure_allies','c3_oyama_march','c3_kiyosu_stores','c3_secure_gifu','c3_home_relief','c4_kobayakawa','c4_forward_granaries','c4_fieldworks','c4_weather_scouts','audit_stores'];for(const id of ids){const n=app.state.eventLog.length;app.dispatch({type:'OPEN_ORDER',id,now:0});if(app.state.activeOrder)break;}if(!app.state.activeOrder){app.dispatch({type:'FORFEIT_SEALS'});window.__last=document.querySelector('.toast')?.textContent;return;}const o=app.state.activeOrder,ans={};for(const f of o.fields)ans[f]=String(o.answer[f]);app.dispatch({type:'ANSWER',answer:ans,now:0});if(app.state.pendingReward!==null)app.dispatch({type:'AUDIT_REWARD',resource:'food'});document.querySelector('dialog')?.remove();app.render();})()"); await pg.wait_for_timeout(500); continue
            if await st("app.state?.phase==='crisis'"): await st("app.dispatch({type:'CRISIS_RESPONSE',response:'accept',now:0})"); await pg.wait_for_timeout(500); continue
            if await st("app.state?.phase==='convoy_briefing'"): await st("app.dispatch({type:'CONVOY',start:false})"); await pg.wait_for_timeout(500); continue
            for sel in ['[data-action^="policy:"]', '[data-action="end"]', '[data-action="advance"]']:
                if await pg.query_selector(sel + ':not([disabled])'):
                    await pg.click(sel + ':not([disabled])'); await pg.wait_for_timeout(700); break
            else:
                dlg = await pg.query_selector('dialog #yes')
                if dlg: await dlg.click(); await pg.wait_for_timeout(600); continue
                await pg.screenshot(path=f'{OUT}/{W}_stuck.png'); print('stuck at', phase); break
            if await pg.query_selector('dialog #yes'): await pg.click('dialog #yes'); await pg.wait_for_timeout(600)
            if 'PREPARATION' in phase: break
        print("toast", await st("window.__last||null")); print("final", await st("app.state.phase+' ch'+app.state.chapterIndex+' seals '+app.state.commandSeals+' '+!!app.state.activeOrder+' dlg '+!!document.querySelector('dialog')")); print("scenes:", seen); print('errors:', errs[:5]); await b.close()
asyncio.run(main())
