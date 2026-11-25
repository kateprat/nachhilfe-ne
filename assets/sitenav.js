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
.navrow{display:flex;align-items:center;gap:10px}.navrow>ul{flex:1;min-width:0}
.navback{display:none;flex:none;white-space:nowrap;padding:5px 12px;border-radius:999px;border:2px solid var(--ink);background:var(--card);color:var(--ink);text-decoration:none;font:700 15px "Bricolage Grotesque",system-ui,sans-serif}
@media(min-width:700px){.navback{display:block}}
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
html.embed,html.embed body{background:transparent!important}
html.embed main{padding:0!important;max-width:none!important}
html.embed .topbar,html.embed .topctl,html.embed .crumb,html.embed .lang,html.embed .langsw,html.embed main>h1,html.embed footer,html.embed .lic,html.embed .chapnav{display:none!important}
html.embed .fig{position:relative!important;top:auto!important;will-change:transform;z-index:3}
html.embed .fig>svg{background:var(--card)}

@media(min-width:900px){iframe.embedded[data-mode]{width:min(1080px,calc(100vw - 2*max(4vw,16px)));margin-left:50%;transform:translateX(-50%)}}
html.embed .ilay,html.embed main>.wrap{margin-top:0}
@media(min-width:821px){html.embed .ilay,html.embed main>.wrap{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:32px!important}html.embed .fig{margin:0!important}}
html.onemode .tabs,html.onemode #theorie,html.onemode .theory,html.onemode main>.lead,html.onemode main>.sub,html.onemode p.more,html.onemode main>p.noprint{display:none!important}
iframe.embedded{display:block;width:100%;height:600px;border:0;margin:8px 0 24px;background:transparent;color-scheme:normal}
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

  const QS = new URLSearchParams(location.search);
  const EMBED = QS.has('embed') && window.parent !== window;
  // Interaktiv and Spickzettel now live as sections 5 and 6 of the chapter page; opening them on their own
  // (old link or bookmark) goes to that section instead. "?solo" keeps the page on its own (used for printing).
  if (!EMBED && !QS.has('solo') && (page === 'inter' || page === 'sheet')) {
    const l = QS.get('lang') || (document.documentElement.lang === 'en' ? 'en' : 'de');
    try { if (location.hash) sessionStorage.setItem('nachhilfe-embedhash', location.hash); } catch (e) {}
    location.replace(N[chap].url[chap === 'trig' && !QS.get('lang') ? 'en' : l] + (page === 'inter' ? '#interaktiv' : '#spickzettel'));
  }
  // printing from inside the chapter page: open the cheat sheet on its own in a new tab, where printing works normally
  if (EMBED && page === 'sheet') document.addEventListener('click', e => {
    const b = e.target.closest('button[onclick*="print"]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    window.open(location.pathname + '?solo=1&lang=' + lang(), '_blank');
  }, true);
  if (EMBED) document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a || a.getAttribute('href').startsWith('#') || e.defaultPrevented) return;
    e.preventDefault();
    const u = new URL(a.href, location.href), m = u.pathname.match(/\/(interaktiv|spickzettel)(\.html)?$/);
    const t = m && parent.document.getElementById(m[1]);
    if (t) t.scrollIntoView({ behavior: 'smooth' }); else parent.location.href = u.href;
  });
  // chapter page: size the embedded frames, and open "Im Bild prüfen" links inside the embedded tool
  addEventListener('message', e => {
    if (e.origin !== location.origin || !e.data || e.data.nachhilfe !== 'height') return;
    document.querySelectorAll('iframe.embedded').forEach(f => { if (f.contentWindow === e.source) f.style.height = e.data.h + 'px'; });
  });
  const frameFor = h => {
    const mode = (h || '').replace(/^#/, '').replace(/-punkt$/, '');
    return document.querySelector(`iframe.embedded[data-mode="${mode}"]`) || document.querySelector('iframe.embedded[data-mode]');
  };
  // scroll to the frame and keep it there while frames above it finish loading and change height
  let keepRun = 0;
  const keepAt = f => {
    const run = ++keepRun; let n = 0;
    const stop = () => { keepRun++; };
    addEventListener('touchstart', stop, { once: true, passive: true }); addEventListener('wheel', stop, { once: true, passive: true });
    const go = () => {
      if (run !== keepRun || n++ > 60) return;
      const nav = document.querySelector('.nav'), d = f.getBoundingClientRect().top - ((nav ? nav.offsetHeight : 0) + 12);
      if (Math.abs(d) > 2) scrollBy(0, d);
      setTimeout(go, 50);
    };
    go();
  };
  // a frame that hasn't loaded yet gets the mode in its address; a loaded one just switches
  const setHash = (f, h) => {
    if (!h) return;
    let loaded = false; try { loaded = /interaktiv/.test(f.contentWindow.location.pathname); } catch (e) {}
    if (loaded) { try { f.contentWindow.location.hash = h; } catch (e) {} }
    else { f.loading = 'eager'; f.src = f.getAttribute('src').replace(/#.*$/, '') + h; }
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a || EMBED) return;
    const m = a.getAttribute('href').match(/^interaktiv\.html(#.*)?$/);
    const f = m && frameFor(m[1]); if (!f) return;
    e.preventDefault();
    setHash(f, m[1]);
    keepAt(f);
  });
  document.addEventListener('DOMContentLoaded', () => {
    let h = null; try { h = sessionStorage.getItem('nachhilfe-embedhash'); sessionStorage.removeItem('nachhilfe-embedhash'); } catch (e) {}
    const f = h && frameFor(h);
    if (f) { setHash(f, h); setTimeout(() => keepAt(f), 300); }
  });

  // laptop: the tool sits in two columns; keep its graph in view next to the controls while the chapter page scrolls
  // (sticky positioning can't reach out of a frame, so the chapter page moves the graph itself)
  const keepGraph = () => document.querySelectorAll('iframe.embedded[data-mode]').forEach(f => {
    let d; try { d = f.contentDocument; } catch (e) { return; }
    const fig = d && d.querySelector('.fig'); if (!fig) return;
    const nav = document.querySelector('.nav'), navh = nav ? nav.offsetHeight : 0;
    const narrow = f.clientWidth <= 820;
    // phone: the controls sit below the graph, so the graph stays pinned (a bit smaller) while you move the sliders
    fig.style.width = narrow ? `min(100%, ${Math.round(Math.max(220, (innerHeight - navh) * 0.46))}px)` : `min(100%, ${Math.max(320, innerHeight - navh - 32)}px)`;
    if (narrow) { fig.style.marginLeft = 'auto'; fig.style.marginRight = 'auto'; fig.style.zIndex = 3; }
    fig.style.transform = '';
    const box = fig.parentElement.getBoundingClientRect(), r = fig.getBoundingClientRect();
    const want = navh + 12 - f.getBoundingClientRect().top;
    const y = Math.max(r.top, Math.min(want, box.bottom - r.height));
    fig.style.transform = `translateY(${y - r.top}px)`;
  });
  if (!EMBED) {
    let kgTick = false;
    addEventListener('scroll', () => { if (!kgTick) { kgTick = true; requestAnimationFrame(() => { kgTick = false; keepGraph(); }); } }, { passive: true });
    addEventListener('resize', keepGraph);
    addEventListener('message', e => { if (e.origin === location.origin && e.data && e.data.nachhilfe === 'height') requestAnimationFrame(keepGraph); });
  }

  let styled = false, observing = false;
  window.siteNav = function () {
    if (!styled) { const s = document.createElement('style'); s.textContent = css; document.head.append(s); styled = true; }
    if (EMBED) return;
    const main = document.querySelector('main');
    if (main && !main.querySelector(':scope > .bc')) {
      const c = crumb(), old = main.querySelector(':scope > .crumb, .topbar > .crumb');
      if (c) { if (old) old.replaceWith(c); else main.prepend(c); }
    }
    document.querySelectorAll('.nav ul').forEach(markOut);
    // laptop: once the page is scrolled, the path at the top is gone; the sticky bar gets its own way back (it stays put,
    // outside the pill row that scrolls sideways)
    document.querySelectorAll('.nav > ul').forEach(ul => {
      if (ul.parentElement.querySelector('.navback')) return;
      const l = lang(), row = document.createElement('div'); row.className = 'navrow';
      ul.before(row);
      row.innerHTML = `<a class="navback" href="${N.home.url[l]}">← ${N.home[l]}</a>`;
      row.append(ul);
    });
    // start page: progress per step and "continue where you were"
    document.querySelectorAll('.path a[data-topic]').forEach(a => {
      const t = a.dataset.topic, box = a.querySelector('.cprog'); if (!box) return;
      let done = 0, total = { '/trigonometrie/': 7, '/quadriken/': 16 }[t] || 0, last = null;
      try { done = JSON.parse(localStorage.getItem('nachhilfe-done:' + t) || '[]').length; total = +localStorage.getItem('nachhilfe-total:' + t) || total; last = JSON.parse(localStorage.getItem('nachhilfe-last:' + t) || 'null'); } catch (e) {}
      if (!total && !last) return;
      const en = document.documentElement.lang === 'en';
      let html = total ? `<i><b style="width:${Math.round(100 * done / total)}%"></b></i>${done}/${total}` : '';
      if (last && last.id) { a.href = a.getAttribute('href').replace(/#.*$/, '') + '#' + last.id; html += ` <span class="go">${en ? 'Continue at' : 'Weiter bei'} ${last.label}</span>`; }
      box.innerHTML = html;
    });
    chapnav();
    if (!observing && (page === 'inter' || page === 'sheet')) {
      observing = true; let last = lang();
      new MutationObserver(() => { if (lang() !== last) { last = lang(); chapnav(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
      addEventListener('resize', () => { const n = document.querySelector('.chapnav'); if (n) document.documentElement.style.setProperty('--chaph', n.offsetHeight + 'px'); });
    }
  };
})();
