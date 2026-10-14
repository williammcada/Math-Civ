"""Plays a bot campaign's battle through the real UI harness and screenshots v0.4 battle scenes. Usage: battle-flow.py W H seed"""
import asyncio, sys, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H, SEED = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]) if len(sys.argv) > 3 else 3
OUT = ROOT + '/.test-out/battle'; os.makedirs(OUT, exist_ok=True)
ANSWER = "(()=>{const a=window.app,o=a.state.activeOrder;const ans={};for(const f of o.fields)ans[f]=String(o.answer[f]);a.dispatch({type:'ANSWER',answer:ans,now:Date.now()});a.root.querySelector('dialog')?.remove();if(a.state.pendingReward!==null)a.dispatch({type:'AUDIT_REWARD',resource:'food'});})()"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': W, 'height': H}); errs = []; seen = {}
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(f'file://{ROOT}/.test-out/app-harness.html#seed={SEED}'); await pg.wait_for_timeout(4000)
        st = lambda js: pg.evaluate(js)
        await pg.screenshot(path=f'{OUT}/{W}_provision.png')
        await st("window.app.dispatch({type:'PREP_PROVISION',rounds:Math.min(12,Math.floor((app.state.resources.food+app.state.playerArmy.protectedBattleRice)/36)),now:Date.now()})"); await st(ANSWER)
        await st("window.app.dispatch({type:'PREP_WARCHEST',equipment:[1,1,1],ammo:6,now:Date.now()})"); await st(ANSWER)
        await st("window.app.closeModal?.();window.app.render()"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{OUT}/{W}_dawn.png'); seen['dawn'] = await st("!!document.querySelector('.scene-player')")
        await st("document.querySelector('[data-scene=skip]')?.click()"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=f'{OUT}/{W}_deploy.png')
        await st("window.app.dispatch({type:'BEGIN_BATTLE'})"); await pg.wait_for_timeout(1200)
        shots = 0
        for i in range(400):
            info = await st("(()=>{const s=app.state,b=s.battle;const sc=document.querySelector('.scene-player');return {phase:s.phase,round:b?.round,scene:sc?sc.getAttribute('aria-label')+'|'+(document.querySelector('.scene-caption')?.textContent||''):null,report:document.querySelector('.battle-report')?.textContent||null,dispatch:!!b?.dispatchPending,active:s.phase==='battle_round'?(b.formations.find(f=>f.id===b.queue?.[b.activeIndex])?.side??null):null}})()")
            if info['scene']:
                k = info['scene'].split('|')[0]
                if seen.get(k, 0) < 2:
                    seen[k] = seen.get(k, 0) + 1; await pg.screenshot(path=f'{OUT}/{W}_scene_{k.replace(" ","_").replace("’","")}_{seen[k]}.png')
                await st("document.querySelector('[data-scene=skip]').click()"); await pg.wait_for_timeout(500); continue
            if info['phase'] != 'battle_round': break
            if info['dispatch']:
                await pg.screenshot(path=f'{OUT}/{W}_dispatch_r{info["round"]}.png'); await st("app.dispatch({type:'ADVANCE'})"); await pg.wait_for_timeout(500); continue
            if info['report'] is not None:
                if shots < 3: shots += 1; await pg.screenshot(path=f'{OUT}/{W}_enemy_{shots}.png'); print('report:', info['report'])
                await pg.wait_for_timeout(1300); continue  # v0.5: the enemy moves by itself
            council = await st("!!app.state.battle.councilPending")
            if council: await st("app.dispatch({type:'BATTLE_COUNCIL',choice:'accept'})"); await pg.wait_for_timeout(500); continue
            await st("(()=>{const s=app.state,b=s.battle,u=b.formations.find(f=>f.id===b.queue[b.activeIndex]);if(!u||u.side!=='east')return;const t=b.formations.filter(f=>f.side==='west'&&!f.routed&&!f.shattered&&!f.exited);for(const k of ['volley','attack']){for(const x of t){const r=window.app; const before=s.eventLog.length; r.dispatch({type:'BATTLE',id:u.id,action:{kind:k,target:x.id}}); if(r.state.eventLog.length>before&&r.state.eventLog.at(-1).type!=='RULE_VIOLATION')return;}} app.dispatch({type:'BATTLE',id:u.id,action:{kind:'defend'}}); if(app.state.battle.formations.find(f=>f.id===u.id)?.ap>0) app.dispatch({type:'BATTLE',id:u.id,action:{kind:'end'}});})()")
            await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{OUT}/{W}_result.png')
        await st("app.dispatch({type:'ADVANCE'})"); await pg.wait_for_timeout(1500)
        for k in range(4):
            await pg.screenshot(path=f'{OUT}/{W}_ending_{k+1}.png')
            if not await st("!!document.querySelector('.scene-player')"): break
            await st("document.querySelector('[data-scene=next]').click()"); await pg.wait_for_timeout(1300)
        await pg.screenshot(path=f'{OUT}/{W}_ending_screen.png')
        print('seen', seen, 'final', await st("app.state.battle.result+' '+app.state.phase"), 'errors', errs[:5]); await b.close()
asyncio.run(main())
