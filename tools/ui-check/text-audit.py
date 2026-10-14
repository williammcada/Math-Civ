"""v0.5 repeated-text audit: walks Chapters 1-4 and battle preparation in the DEV file (scenes on), saves the text of every
screen, dialog and scene caption in order, then lists sentences that repeat or nearly repeat. Usage: text-audit.py [W H]"""
import asyncio, sys, os, re, json, difflib
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (1180, 820)
OUT = ROOT + '/.test-out/text-audit'; os.makedirs(OUT, exist_ok=True)
JS = """(()=>{const pick=s=>[...document.querySelectorAll(s)].map(e=>e.innerText).join('\\n');
 const sc=document.querySelector('.scene-player');if(sc)return 'SCENE|'+(sc.getAttribute('aria-label')||'')+'|'+pick('.scene-caption');
 const d=document.querySelector('dialog[open]');if(d)return 'DIALOG|'+(d.querySelector('h2')?.innerText||'')+'|'+d.innerText;
 return 'SCREEN|'+(document.querySelector('.eyebrow')?.innerText||'')+'|'+pick('#game > *:not(.top):not(.bottom):not(.dev-banner)');})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': W, 'height': H})
        await pg.goto('file://' + ROOT + '/release/PLAY-SEKIGAHARA-0.5.1-DEV-PLAYTEST.html'); await pg.wait_for_timeout(2000)
        await pg.click('[data-action="dev-start"]'); await pg.wait_for_timeout(1500)
        log = []; last = None
        for i in range(400):
            t = await pg.evaluate(JS)
            if t != last: log.append(t); last = t
            if t.startswith('SCENE'):
                if await pg.query_selector('[data-scene=next]'): await pg.evaluate("document.querySelector('[data-scene=next]').click()")
                else: await pg.evaluate("document.querySelector('[data-scene=skip]').click()")
                await pg.wait_for_timeout(700); continue
            if t.startswith('DIALOG'):
                for sel in ['dialog [data-action^="audit:"]', 'dialog [data-action="close-result"]', 'dialog #yes', 'dialog [data-action^="open:"]', 'dialog [data-action="close"]']:
                    if await pg.query_selector(sel + ':not([disabled])'): await pg.click(sel + ':not([disabled])'); await pg.wait_for_timeout(500); break
                continue
            key = t.split('|')[1]
            card = await pg.query_selector('[data-action^="detail:"]:not([disabled])')
            if card and 'LEFT THIS CHAPTER' in key and not key.strip().startswith('0 '): await card.click(); await pg.wait_for_timeout(500); continue
            done = False
            for sel in ['[data-action^="policy:"]', '[data-action="convoy:skip"]', '[data-action="advance"]', '[data-action="end"]']:
                if await pg.query_selector(sel + ':not([disabled])'): await pg.click(sel + ':not([disabled])'); await pg.wait_for_timeout(700); done = True; break
            if not done or 'BATTLE PREPARATION' in key: break
        json.dump(log, open(OUT + '/screens.json', 'w'), ensure_ascii=False, indent=1)
        # sentence-level repeats
        sents = []
        for n, t in enumerate(log):
            kind, title, body = t.split('|', 2)
            for s in re.split(r'(?<=[.!?])\s+|\n', body):
                s = s.strip()
                if len(s) > 40: sents.append((n, kind + ' ' + title[:40], s))
        hits = []
        for i in range(len(sents)):
            for j in range(i + 1, len(sents)):
                a, b2 = sents[i], sents[j]
                if a[0] == b2[0] and a[2] == b2[2]: continue
                r = difflib.SequenceMatcher(None, a[2].lower(), b2[2].lower()).ratio()
                if r > 0.6: hits.append((round(r, 2), a, b2))
        seen = set(); out = []
        for r, a, b2 in sorted(hits, key=lambda h: -h[0]):
            k = (a[2], b2[2])
            if k in seen: continue
            seen.add(k); out.append({'similar': r, 'first': f'#{a[0]} {a[1]}: {a[2]}', 'again': f'#{b2[0]} {b2[1]}: {b2[2]}'})
        json.dump(out, open(OUT + '/repeats.json', 'w'), ensure_ascii=False, indent=1)
        print('screens:', len(log), '· repeated sentence pairs:', len(out))
asyncio.run(main())
