// Interactive pages: the same sticky pill bar as the chapter pages.
// The widget tabs become numbered pills at the top (1, 2, 3 …), followed by the theory and related pages.
(function () {
  const css = `
.tnav{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 94%,transparent);backdrop-filter:blur(6px);
  border-bottom:2px solid var(--ink);margin:0 calc(-1*max(4vw,16px)) 16px;padding:10px max(4vw,16px)}
.tnav ul{list-style:none;margin:0;padding:0;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.tnav ul::-webkit-scrollbar{display:none}
.tnav li{flex:none}
.tnav a,.tnav button{display:block;white-space:nowrap;padding:5px 12px;border-radius:999px;border:2px solid var(--line);background:var(--card);
  text-decoration:none;color:var(--ink);font:700 15px "Bricolage Grotesque",system-ui,sans-serif;cursor:pointer;margin:0;box-shadow:none;min-height:0;-webkit-tap-highlight-color:transparent}
.tnav .active{background:light-dark(#ffe45c,#7a5c0c)!important;border-color:var(--ink)!important;color:var(--ink)!important}
.tnav .pn,.nav .pn{opacity:.5;margin-right:5px}
.tnav-hide{display:none!important}
html{scroll-padding-top:80px}`;
  document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelector('.tabs[role=tablist]');
    const fig = document.querySelector('.fig');
    if (!tabs || !fig || document.querySelector('.nav,.tnav')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.append(st);
    const block = fig.parentElement;
    const nav = document.createElement('nav'); nav.className = 'tnav';
    const ul = document.createElement('ul'); nav.append(ul);
    const btns = [...tabs.querySelectorAll('[role=tab]')];
    const pills = btns.map((b, i) => {
      const p = document.createElement('button'); p.type = 'button';
      const sync = () => { p.innerHTML = `<span class="pn">${i + 1}</span>` + b.innerHTML; };
      sync(); new MutationObserver(sync).observe(b, { childList: true, characterData: true, subtree: true });
      p.addEventListener('click', () => {
        b.click();
        scrollTo({ top: block.getBoundingClientRect().top + scrollY - nav.offsetHeight - 8, behavior: 'smooth' });
      });
      const li = document.createElement('li'); li.append(p); ul.append(li);
      return p;
    });
    const th = document.getElementById('theorie');
    const extra = [];
    if (th) extra.push(['#theorie', 'Theorie', 'Theory']);
    extra.push(['spickzettel.html', 'Spickzettel', 'Cheat sheet'], ['../training/', 'Prüfungstraining', 'Exam training']);
    const links = extra.map(([h, de, enl]) => {
      const a = document.createElement('a'); a.href = h;
      a.innerHTML = `<span data-l="de">${de}</span><span data-l="en">${enl}</span>`;
      const li = document.createElement('li'); li.append(a); ul.append(li);
      return a;
    });
    block.before(nav);
    tabs.classList.add('tnav-hide');
    // highlight: the selected tab while you are at the widget, "Theorie" once you scroll down to it
    const thLink = th ? links[0] : null;
    const mark = () => {
      const atTheory = th && th.getBoundingClientRect().top <= nav.offsetHeight + 40;
      btns.forEach((b, i) => pills[i].classList.toggle('active', !atTheory && b.getAttribute('aria-selected') === 'true'));
      if (thLink) thLink.classList.toggle('active', !!atTheory);
      const act = ul.querySelector('.active');
      if (act) { const l = act.offsetLeft - ul.offsetLeft, r = l + act.offsetWidth; if (l < ul.scrollLeft || r > ul.scrollLeft + ul.clientWidth) ul.scrollTo({ left: l - 12, behavior: 'smooth' }); }
    };
    btns.forEach(b => new MutationObserver(mark).observe(b, { attributes: true, attributeFilter: ['aria-selected'] }));
    let ticking = false;
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; mark(); }); } }, { passive: true });
    mark();
  });
})();
