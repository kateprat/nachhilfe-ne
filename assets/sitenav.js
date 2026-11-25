// Site navigation, the same on every page:
// 1. a path at the top left (Start › Trigonometrie › Interaktiv), every part tappable;
// 2. on Interaktiv and Spickzettel pages, the chapter's own sticky bar (sections, exercises, Interaktiv, Spickzettel),
//    with the current page highlighted;
// 3. in every chapter bar, links that leave the chapter (Algebra, Prüfungstraining) sit behind a divider and carry ↗;
// 4. Prüfungstraining / Algebra remember which chapter you came from ("← zurück zu Trigonometrie").
(function () {
  const N = {
    home: { de: 'Start', en: 'Home', url: { de: '/', en: '/en.html' } },
    trig: { de: 'Trigonometrie', en: 'Trigonometry', url: { de: '/trigonometrie/de.html', en: '/trigonometrie/' } },
    quad: { de: 'Quadriken', en: 'Conics', url: { de: '/quadriken/', en: '/quadriken/en.html' } },
    inter: { de: 'Interaktiv', en: 'Interactive', file: 'interaktiv.html' },
    sheet: { de: 'Spickzettel', en: 'Cheat sheet', file: 'spickzettel.html' },
    train: { de: 'Prüfungstraining', en: 'Exam training', url: { de: '/training/', en: '/training/' } },
    alg: { de: 'Werkzeugkasten Algebra', en: 'Algebra toolbox', url: { de: '/grundlagen/', en: '/grundlagen/' } }
  };
  const css = `
html,body{touch-action:manipulation}
.bc{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 6px;margin:0;font:700 15px/1.35 "Bricolage Grotesque",system-ui,sans-serif;min-width:0}
.bc a{color:light-dark(#1e5e4f,#7ed9b4);text-decoration:underline;text-underline-offset:3px}
.bc .sep{color:var(--mute);font-weight:400}
.bc .here{color:var(--mute)}
.bc .back{flex-basis:100%;font-weight:400;font-size:14px;margin-top:2px}
html[lang=de] .bc [data-l=en],html[lang=en] .bc [data-l=de],html[lang=de] .chapnav [data-l=en],html[lang=en] .chapnav [data-l=de]{display:none!important}
.chapnav{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 94%,transparent);backdrop-filter:blur(6px);
  border-bottom:2px solid var(--ink);margin:18px calc(-1*max(4vw,16px)) 18px;padding:10px max(4vw,16px)}
.chapnav ul{list-style:none;margin:0;padding:0;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.chapnav ul::-webkit-scrollbar{display:none}
.chapnav li{flex:none}
.chapnav a{display:block;white-space:nowrap;padding:5px 12px;border-radius:999px;border:2px solid var(--line);background:var(--card);text-decoration:none;color:var(--ink);font:700 15px "Bricolage Grotesque",system-ui,sans-serif}
.chapnav a.done{background:light-dark(#8ee6c0,#2fae7d);border-color:light-dark(#8ee6c0,#2fae7d);color:#10241b}
.chapnav a.done::after{content:" ✓"}
.chapnav a.active{background:light-dark(#ffe45c,#7a5c0c);border-color:var(--ink);color:var(--ink)}
.chapnav .pn,.nav .pn{opacity:.5;margin-right:5px}
.nav li.div,.chapnav li.div{width:2px;align-self:stretch;margin:4px 6px;background:var(--line);border-radius:2px}
.nav a.out,.chapnav a.out{border-style:dashed}
html.has-chapnav{scroll-padding-top:calc(var(--chaph,64px) + 12px)}
html .topctl .langsw button{border:0;border-radius:0;box-shadow:none;margin:0;min-height:0;padding:6px 11px;background:transparent;color:var(--ink);font:700 14px "Bricolage Grotesque",system-ui,sans-serif;cursor:pointer}
html .topctl .langsw button[aria-current]{background:var(--ink);color:var(--bg)}
@media(max-width:520px){html .topctl .langsw button{padding:5px 8px;font-size:13px}}
@media(min-width:821px){html.has-chapnav .fig{top:calc(var(--chaph,64px) + 12px)!important}}`;

  const P = location.pathname;
  const chap = P.includes('/trigonometrie/') ? 'trig' : P.includes('/quadriken/') ? 'quad' : null;
  const page = /interaktiv/.test(P) ? 'inter' : /spickzettel/.test(P) ? 'sheet' : /\/training\//.test(P) ? 'train' : /\/grundlagen\//.test(P) ? 'alg' : chap ? 'chap' : 'home';
  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'de');
  const urlOf = (k, l) => N[k].url ? N[k].url[l] : N[chap].url[l].replace(/[^/]*$/, '') + N[k].file;
  const both = f => `<span data-l="de">${f('de')}</span><span data-l="en">${f('en')}</span>`;

  // remember where you left a chapter for Prüfungstraining / Algebra (chapter + exercise), so "zurück" lands on that spot
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a || !chap) return;
    const m = new URL(a.href, location.href).pathname.match(/\/(training|grundlagen)\//); if (!m) return;
    const act = document.querySelector('.nav a.active');
    const sec = act && (act.getAttribute('href') || '').startsWith('#') ? act.getAttribute('href') : '';
    const label = sec ? act.textContent.replace(/^\d+/, '').trim() : '';
    try { sessionStorage.setItem('nachhilfe-from:' + (m[1] === 'training' ? 'train' : 'alg'), JSON.stringify({ c: chap, url: location.pathname + sec, label })); } catch (err) {}
  });
  // arriving from the start page (or anywhere outside a chapter) forgets the old way back
  if (page === 'train' || page === 'alg') {
    try {
      const r = document.referrer && new URL(document.referrer);
      if (r && r.origin === location.origin && !/\/(trigonometrie|quadriken|training|grundlagen)\//.test(r.pathname)) sessionStorage.removeItem('nachhilfe-from:' + page);
    } catch (e) {}
  }

  function crumb() {
    if (page === 'home') return null;
    const chain = ['home'];
    if (chap) chain.push(chap);
    if (page === 'train' || page === 'alg') chain.push(page); // Interaktiv and Spickzettel are part of the chapter, not a level below it
    const el = document.createElement('nav');
    el.className = 'crumb bc'; el.setAttribute('aria-label', 'Pfad / path');
    el.innerHTML = chain.map((k, i) => {
      const last = i === chain.length - 1 && (page === 'chap' || page === 'train' || page === 'alg' || page === 'home');
      return (i ? '<span class="sep" aria-hidden="true">›</span>' : '') +
        (last ? `<span class="here" aria-current="page">${both(l => N[k][l])}</span>`
              : both(l => `<a href="${urlOf(k, l)}">${N[k][l]}</a>`));
    }).join('');
    let from = null; try { from = JSON.parse(sessionStorage.getItem('nachhilfe-from:' + page)); } catch (e) {}
    if (from && N[from.c]) el.insertAdjacentHTML('beforeend', `<span class="back">${both(l => `<a href="${from.url}">← ${l === 'de' ? 'zurück zu' : 'back to'} ${N[from.c][l]}${from.label ? ' · ' + from.label : ''}</a>`)}</span>`);
    return el;
  }

  // links that leave the chapter: divider + ↗
  function markOut(ul) {
    if (!ul || ul.dataset.out || !chap) return; ul.dataset.out = 1;
    const outs = [...ul.querySelectorAll('a')].filter(a => /\/(training|grundlagen)\//.test(new URL(a.href, location.href).pathname));
    if (!outs.length) return;
    outs.forEach(a => { a.classList.add('out'); if (!a.textContent.includes('↗')) a.append(' ↗'); });
    const d = document.createElement('li'); d.className = 'div'; d.setAttribute('aria-hidden', 'true');
    outs[0].closest('li').before(d);
  }

  // the chapter bar on Interaktiv / Spickzettel: taken from the chapter page itself, so it always matches
  let gen = 0;
  async function chapnav() {
    if (!(page === 'inter' || page === 'sheet')) return;
    const my = ++gen, l = lang(), base = N[chap].url[l];
    let doc;
    try { const r = await fetch(base, { credentials: 'same-origin' }); if (!r.ok) return; doc = new DOMParser().parseFromString(await r.text(), 'text/html'); } catch (e) { return; }
    if (my !== gen) return;
    const src = doc.querySelector('.nav ul'); if (!src) return;
    const baseURL = new URL(base, location.href);
    const ul = document.createElement('ul');
    let done = new Set(); try { done = new Set(JSON.parse(localStorage.getItem('nachhilfe-done:' + baseURL.pathname.replace(/(index|en|de)(\.html)?$/, '')) || '[]')); } catch (e) {}
    src.querySelectorAll('li').forEach(li => {
      const a = li.querySelector('a'); if (!a) return;
      const href = a.getAttribute('href'), abs = new URL(href, baseURL);
      const n = document.createElement('a'); n.textContent = a.textContent; n.href = abs.pathname + abs.hash;
      if (href.startsWith('#')) {
        const t = doc.getElementById(href.slice(1));
        const m = t && t.tagName === 'H2' && t.textContent.match(/^\s*(\d+)\s*·/);
        if (m) n.insertAdjacentHTML('afterbegin', `<span class="pn">${m[1]}</span>`);
        if (done.has(href.slice(1))) n.classList.add('done');
      }
      const norm = u => u.replace(/\.html$/, '').replace(/\/index$/, '/');
      if (norm(abs.pathname) === norm(location.pathname)) { n.classList.add('active'); n.setAttribute('aria-current', 'page'); }
      const nl = document.createElement('li'); nl.append(n); ul.append(nl);
    });
    markOut(ul);
    const old = document.querySelector('.chapnav');
    const nav = document.createElement('nav'); nav.className = 'chapnav'; nav.setAttribute('aria-label', l === 'en' ? 'Chapter' : 'Kapitel'); nav.append(ul);
    if (old) old.replaceWith(nav);
    else { const h1 = document.querySelector('main h1'); const after = h1 && h1.nextElementSibling && /^(P)$/.test(h1.nextElementSibling.tagName) ? h1.nextElementSibling : h1; (after || document.querySelector('main').firstChild).after(nav); }
    document.documentElement.classList.add('has-chapnav');
    const setH = () => document.documentElement.style.setProperty('--chaph', nav.offsetHeight + 'px'); setH();
    const act = ul.querySelector('.active'); if (act) ul.scrollLeft = act.offsetLeft - ul.offsetLeft - (ul.clientWidth - act.offsetWidth) / 2;
  }

  let styled = false, observing = false;
  window.siteNav = function () {
    if (!styled) { const s = document.createElement('style'); s.textContent = css; document.head.append(s); styled = true; }
    const main = document.querySelector('main');
    if (main && !main.querySelector(':scope > .bc')) {
      const c = crumb(), old = main.querySelector(':scope > .crumb, .topbar > .crumb');
      if (c) { if (old) old.replaceWith(c); else main.prepend(c); }
    }
    document.querySelectorAll('.nav ul').forEach(markOut);
    chapnav();
    if (!observing && (page === 'inter' || page === 'sheet')) {
      observing = true; let last = lang();
      new MutationObserver(() => { if (lang() !== last) { last = lang(); chapnav(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
      addEventListener('resize', () => { const n = document.querySelector('.chapnav'); if (n) document.documentElement.style.setProperty('--chaph', n.offsetHeight + 'px'); });
    }
  };
})();
