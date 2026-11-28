"""Check on phone and desktop width: no inline formula broken over two lines, no sideways page overflow."""
import asyncio
import sys
from playwright.async_api import async_playwright

BASE = 'http://localhost:8765'
PAGES = ['/', '/trigonometrie/de.html', '/trigonometrie/', '/trigonometrie/spickzettel.html', '/quadriken/', '/quadriken/en.html',
         '/quadriken/spickzettel.html', '/training/', '/grundlagen/']
JS = """() => {
  const broken = [];
  document.querySelectorAll('.katex').forEach(k => {
    if (k.closest('.katex-display') || !k.offsetParent) return;
    const tops = new Set([...k.querySelector('.katex-html').getClientRects()].filter(r => r.width > 1).map(r => Math.round(r.top / 4)));
    // a formula broken in the middle has its pieces on clearly different lines
    const ys = [...k.querySelector('.katex-html').children].map(c => c.getBoundingClientRect()).filter(r => r.width > 1).map(r => r.bottom);
    if (ys.length > 1 && Math.max(...ys) - Math.min(...ys) > 18) broken.push((k.querySelector('annotation') || {}).textContent);
  });
  return { broken, overflow: document.documentElement.scrollWidth - innerWidth };
}"""


async def check(pg, label):
    r = await pg.evaluate(JS)
    out = []
    if r['broken']:
        out.append(f"broken: {r['broken'][:6]}")
    if r['overflow'] > 1:
        out.append(f"page overflow {r['overflow']}px")
    for fr in pg.frames[1:]:
        try:
            fr_r = await fr.evaluate(JS)
            if fr_r['broken']:
                out.append(f"iframe {fr.url.split('#')[-1]} broken: {fr_r['broken'][:4]}")
        except Exception:
            pass
    print(label, 'OK' if not out else ' | '.join(out))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        errs = []
        for w, h, name in [(390, 844, 'phone'), (1300, 1000, 'desktop')]:
            ctx = await b.new_context(viewport={'width': w, 'height': h})
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e)))
            for path in PAGES:
                await pg.goto(BASE + path)
                await pg.wait_for_timeout(900)
                # open every exercise fully, every folded box and every answer
                await pg.evaluate("""() => { document.querySelectorAll('details').forEach(d => d.open = true);
                  document.querySelectorAll('.ex').forEach(e => { const b = [...e.querySelectorAll('button')].find(x => /Alles zeigen|Show all/.test(x.textContent)); b && b.click(); });
                  document.querySelectorAll('button.reveal').forEach(b => b.click()); }""")
                await pg.wait_for_timeout(600)
                # load lazy iframes
                await pg.evaluate("document.querySelectorAll('iframe').forEach(f => f.loading = 'eager')")
                for i in range(await pg.evaluate("document.querySelectorAll('iframe').length")):
                    await pg.evaluate(f"document.querySelectorAll('iframe')[{i}].scrollIntoView()")
                    await pg.wait_for_timeout(700)
                await check(pg, f'{name:7} {path}')
            # the polar widget with every E9/E10 point
            await pg.goto(BASE + '/trigonometrie/de.html')
            await pg.wait_for_timeout(800)
            await pg.evaluate("document.querySelector('iframe[data-mode=polar]').scrollIntoView()")
            await pg.wait_for_timeout(2000)
            fr = [f for f in pg.frames if f.url.endswith('#polar')][0]
            for sel in ['[data-phi="30"]', '[data-phi="-30"]', '[data-phi="150"]', '[data-phi="1080"]', '[data-c^="A"]', '[data-c^="B"]', '[data-c^="Q"]', '[data-c^="S"]']:
                await fr.click('#chips4 button' + sel)
                await pg.wait_for_timeout(150)
                r = await fr.evaluate("() => [...document.querySelectorAll('#out4 .fl')].filter(e => e.scrollWidth > e.clientWidth + 1).length")
                if r:
                    print(name, 'polar', sel, 'line too wide (scrolls):', r)
            if name == 'phone':
                await fr.click('#chips4 button[data-phi="150"]')
                await pg.evaluate("document.querySelector('iframe[data-mode=polar]').scrollIntoView(); scrollBy(0, 420)")
                await pg.wait_for_timeout(300)
                await pg.screenshot(path='/home/claude/check/wrap_phone_polar.png')
            await ctx.close()
        print('errors', errs)
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())
