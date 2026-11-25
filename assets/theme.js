// Light/dark: follows the device by default ("Auto"); a manual choice is remembered on this device.
(function () {
  const KEY = 'nachhilfe-theme';
  let pref = 'auto';
  try { pref = localStorage.getItem(KEY) || 'auto'; } catch (e) {}
  const apply = p => { if (p === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', p); };
  apply(pref);
  // embedded as a section of the chapter page (?embed=1&lang=..): no own header, follow the chapter page's colours,
  // and tell the chapter page how tall we are so the frame grows with the content
  const QS = new URLSearchParams(location.search);
  const EMBED = QS.has('embed') && window.parent !== window;
  if (QS.get('lang')) document.documentElement.lang = QS.get('lang');
  if (EMBED) {
    document.documentElement.classList.add('embed');
    if (QS.has('one')) document.documentElement.classList.add('onemode');
    addEventListener('storage', e => { if (e.key === KEY) { pref = e.newValue || 'auto'; apply(pref); } });
    const report = () => parent.postMessage({ nachhilfe: 'height', h: Math.ceil(document.documentElement.getBoundingClientRect().height) }, location.origin);
    document.addEventListener('DOMContentLoaded', () => { new ResizeObserver(report).observe(document.documentElement); report(); });
    addEventListener('load', report);
  }
  function build() {
    if (window.siteNav) window.siteNav();
    if (EMBED) return;
    const lang = document.querySelector('.langsw, main > .lang');
    if (!lang) return;
    // colours and language live in a ⋯ menu: you set them once, so they don't need a whole row on every page
    const L = (de, en) => `<span data-l="de">${de}</span><span data-l="en">${en}</span>`;
    const box = document.createElement('div'); box.className = 'topctl';
    lang.before(box);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'menubtn'; btn.textContent = '⋯';
    btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Colours and language' : 'Farben und Sprache');
    const menu = document.createElement('div'); menu.className = 'tmenu'; menu.hidden = true;
    menu.innerHTML = `<p>${L('Farben', 'Colours')}</p>`;
    const sw = document.createElement('div'); sw.className = 'langsw'; sw.setAttribute('role', 'group');
    [['auto', 'Auto', 'Auto'], ['light', 'Hell', 'Light'], ['dark', 'Dunkel', 'Dark']].forEach(([v, de, en]) => {
      const b = document.createElement('button'); b.type = 'button'; b.innerHTML = L(de, en); b.dataset.theme = v;
      b.addEventListener('click', () => { pref = v; try { localStorage.setItem(KEY, v); } catch (err) {} apply(v); mark(); });
      sw.append(b);
    });
    const mark = () => sw.querySelectorAll('button').forEach(a => a.toggleAttribute('aria-current', a.dataset.theme === pref));
    mark();
    menu.append(sw);
    menu.insertAdjacentHTML('beforeend', `<p>${L('Sprache', 'Language')}</p>`);
    menu.append(lang);
    box.append(btn, menu);
    const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; btn.setAttribute('aria-expanded', String(!menu.hidden)); });
    document.addEventListener('click', e => { if (!menu.hidden && !box.contains(e.target)) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    // standard header row: back link on the left, settings on the right (same row on phone and laptop)
    const main = box.parentElement, crumb = main.querySelector(':scope > .crumb');
    const bar = document.createElement('div'); bar.className = 'topbar';
    main.insertBefore(bar, main.firstChild);
    if (crumb) bar.append(crumb); else bar.append(document.createElement('span'));
    bar.append(box);
  }
  document.addEventListener('DOMContentLoaded', build);

  // DE/EN on pages that exist as two files: load the other file and swap the content in place,
  // so the browser does not reload (Safari would show the address bar again) and the scroll position stays.
  document.addEventListener('click', async e => {
    const a = e.target.closest('.langsw a[href]');
    if (!a || a.hasAttribute('aria-current') || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const url = new URL(a.getAttribute('href'), location.href);
    const nav = document.querySelector('.nav'), line = (nav ? nav.offsetHeight : 0) + 8;
    let anchor = null, off = 0;
    if (scrollY > 0) document.querySelectorAll('main [id]').forEach(el => { const t = el.getBoundingClientRect().top; if (t <= line && !el.closest('svg')) { anchor = el.id; off = t; } });
    try {
      const r = await fetch(url, { credentials: 'same-origin' });
      if (!r.ok || r.redirected) throw 0;
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      if (!doc.body.querySelector('main')) throw 0;
      const y = scrollY;
      document.title = doc.title;
      document.documentElement.lang = doc.documentElement.lang;
      document.body.replaceWith(document.adoptNode(doc.body));
      history.replaceState(history.state, '', url.pathname + location.hash);
      build();
      if (window.nachhilfeInit) window.nachhilfeInit({ swap: true });
      const t = anchor && document.getElementById(anchor);
      if (t) scrollBy(0, t.getBoundingClientRect().top - off); else scrollTo(0, y);
    } catch (err) { location.href = url.pathname + location.hash; }
  });
})();
