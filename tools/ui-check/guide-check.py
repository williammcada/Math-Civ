"""v0.5 Field Guide check: opens from the title screen and from the battle's More menu, shows all six tabs. Usage: guide-check.py W H [file]"""
import asyncio, sys, os, json
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
        texts = {}
        for t in tabs:
            await pg.click(f'dialog [data-action="{t}"]'); await pg.wait_for_timeout(300)
            texts[t.split(':')[1]] = ' '.join((await pg.inner_text('dialog .gd-body')).split())
            sel = await pg.eval_on_selector('dialog [aria-selected="true"]', 'e=>e.dataset.action')
            assert sel == t, (sel, t)
            await pg.screenshot(path=f'{OUT}/{W}_{t.split(":")[1]}.png', full_page=W < 600)
        await pg.click('dialog [data-action="close"]'); await pg.wait_for_timeout(300)
        # Every number the guide states must equal the rules files (spec §4).
        C = ROOT + '/src/content/'
        r = json.load(open(C + 'rules-v03.json')); bal = json.load(open(C + 'balance.v1.json'))['economy']; bt = r['battle']
        k = r['kobayakawa']; h = r['hidetada']; w = r['edoWatch']
        expect = {
            'resources': [f"{bal['farmRicePer100EffectiveLabor']} Rice per 100 farm workers", f"1 Rice per {bt['rationCapacity']} soldiers", f"up to {bt['provisionMax']} rounds", f"{bt['unsuppliedFactor']//10}% strength", f"loses {bt['unsuppliedMoraleLoss']} morale", f"{bt['equipmentCost']} Treasury per point", f"{bal['workshopMaterialsPer100EffectiveLabor']} Materials per 100", f"{bt['ammoCost']} Materials per Volley charge, up to {bt['ammoMax']}", f"up to {bt['rallyUses']} times"],
            'allies': [f"in round {bt['auxiliaryRound']}", f"by {-k['ishidaLetterPerChapter']} every chapter", f"From Chapter {k['ishidaLettersFromChapter']}", f"{r['gifu']['garrisonTroops']:,}-soldier garrison", f"below {w['threshold']}", f"{w['troopsPerPoint']} soldiers per missing point", f"at most {w['maxTroops']}", f"{h['troops']:,} soldiers", f"round {h['entryRound']}", f"{h['arrivalPerThousand']//10}%", f"{h['arrivalWithRoadPerThousand']//10}%"] + [f"{b['min']}–{b['max']}" for b in k['bands']],
            'battle': [f"end of {bt['captureChecks']} rounds", f"After round {bt['reviewRound']}"],
            'march': [f"{bt['provisionMax']} is the most", f"({bt['equipmentCost']} Treasury)", f"At {k['bands'][1]['min']} support", f"below {k['bands'][2]['min']}"],
        }
        missing = [(tab, x) for tab, xs in expect.items() for x in xs if x not in texts.get(tab, '')]
        print(W, 'guide numbers checked:', sum(len(v) for v in expect.values()), '· missing:', missing)
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
