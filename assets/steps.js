// Step-by-step reveal for worked (data-mode="worked") and faded (data-mode="faded") exercises,
// KaTeX rendering with colour macros, and the small m/q line playground.
(function () {
  const isEN = () => document.documentElement.lang === 'en';
  // every generated label carries both languages; CSS shows the one matching <html lang>
  const T = {
    show: ['Rechnung zeigen', 'Show working'], next: ['Nächster Schritt', 'Next step'], all: ['Alles zeigen', 'Show all'],
    reset: ['Von vorn', 'Start over'], stamp: ['Geschafft!', 'Done!'], clear: ['Zurücksetzen', 'Reset'],
    predict: ['Was kommt als Nächstes? Erst überlegen, dann klicken.', 'What comes next? Think first, then click.'],
    axis: ['auf einer Achse', 'on an axis'], x: ['x-Koordinate', 'x-coordinate'], y: ['y-Koordinate', 'y-coordinate'],
    slope: ['Steigung', 'slope'], nd: ['nicht definiert', 'not defined']
  };
  const D = k => `<span data-l="de">${T[k][0]}</span><span data-l="en">${T[k][1]}</span>`;
  const of = (a, b) => `<span data-l="de">${a} von ${b} geschafft</span><span data-l="en">${a} of ${b} done</span>`;
  const MACROS = { '\\m': '\\textcolor{#3b7be8}{m}', '\\q': '\\textcolor{#e0475b}{q}' };

  // progress per topic (same for DE and EN), kept only on this device
  const PKEY = 'nachhilfe-done:' + location.pathname.replace(/(index|en|de)\.html$/, '');
  let doneSet = new Set();
  try { doneSet = new Set(JSON.parse(localStorage.getItem(PKEY) || '[]')); } catch (e) {}
  const saveDone = () => { try { localStorage.setItem(PKEY, JSON.stringify([...doneSet])); } catch (e) {} };
  let progressUpdate = () => {};

  // on narrow screens, split display formulas at \qquad into stacked lines so nothing runs off the card
  function splitWide(root) {
    if (window.innerWidth > 700) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (w.nextNode()) if (w.currentNode.nodeValue.includes('$$')) nodes.push(w.currentNode);
    nodes.forEach(n => {
      n.nodeValue = n.nodeValue.replace(/\$\$([\s\S]*?)\$\$/g, (all, tex) => {
        if (/\\begin/.test(tex) || !tex.includes('\\qquad')) return all;
        return tex.split('\\qquad').map(t => t.trim().replace(/^,|,$/g, '').trim()).filter(t => t && t !== '\\Rightarrow').map(t => '$$' + t + '$$').join('');
      });
    });
  }

  function renderMath(root) {
    if (!window.renderMathInElement) return;
    splitWide(root);
    window.renderMathInElement(root, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }],
      macros: MACROS, throwOnError: false
    });
  }

  function setupExercise(ex) {
    const steps = [...ex.querySelectorAll('.step')];
    const done = ex.querySelector('.done');
    const faded = ex.dataset.mode === 'faded';
    let shown = 1;

    // faded mode: each calculation hides behind its own button
    if (faded) steps.forEach(st => {
      const calc = st.querySelector('.calc');
      if (!calc) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'reveal'; b.innerHTML = D('show');
      b.addEventListener('click', () => { calc.hidden = false; b.remove(); });
      calc.before(b);
      st._calcBtn = b;
    });

    const ctrl = document.createElement('div');
    ctrl.className = 'ctrl';
    ctrl.innerHTML = `<button type="button" class="primary" data-a="next">${D('next')}</button>` +
      `<button type="button" data-a="all">${D('all')}</button><button type="button" data-a="reset">${D('reset')}</button>`;
    ex.querySelector('.steps').after(ctrl);
    const pred = document.createElement('p'); pred.className = 'predict'; pred.innerHTML = D('predict');
    if (!faded) ctrl.before(pred);
    const next = ctrl.querySelector('[data-a=next]');

    function update(scroll) {
      steps.forEach((st, i) => { st.hidden = i >= shown; st.classList.toggle('on', i === shown - 1); });
      if (done) done.hidden = shown < steps.length;
      next.hidden = shown >= steps.length; pred.hidden = shown >= steps.length;
      if (scroll) steps[shown - 1].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (scroll && shown >= steps.length && !doneSet.has(ex.id)) { doneSet.add(ex.id); saveDone(); stamp(true); progressUpdate(); }
    }
    function stamp(pop) {
      if (ex.querySelector('.stamp')) return;
      const s = document.createElement('span'); s.className = 'stamp' + (pop ? ' pop' : ''); s.innerHTML = D('stamp');
      ex.prepend(s);
    }
    if (doneSet.has(ex.id)) stamp(false);
    function hideCalcs() {
      if (!faded) return;
      steps.forEach(st => { const c = st.querySelector('.calc'); if (c && st._calcBtn) { c.hidden = true; c.before(st._calcBtn); } });
    }
    ctrl.addEventListener('click', e => {
      const a = (e.target.closest('button') || {}).dataset?.a;
      if (a === 'next') { shown = Math.min(steps.length, shown + 1); update(true); }
      if (a === 'all') { shown = steps.length; steps.forEach(st => { const c = st.querySelector('.calc'); if (c) c.hidden = false; st._calcBtn && st._calcBtn.remove(); }); update(false); steps.forEach(st => st.classList.remove('on')); }
      if (a === 'reset') { shown = 1; hideCalcs(); update(false); ex.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
    });
    hideCalcs();
    update(false);
  }

  // "Antwort zeigen" for small check questions
  function setupReveals(root) {
    root.querySelectorAll('[data-answer]').forEach(el => {
      const ans = document.getElementById(el.dataset.answer);
      ans.hidden = true;
      el.addEventListener('click', () => { ans.hidden = false; el.remove(); });
    });
  }

  // m/q playground
  function setupPlay() {
    const svg = document.getElementById('playSvg');
    if (!svg) return;
    const mS = document.getElementById('mS'), qS = document.getElementById('qS');
    const fmt = v => (v < 0 ? '−' : '') + String(Math.abs(v)).replace('.', isEN() ? '.' : ',');
    function draw() {
      const m = +mS.value, q = +qS.value, R = 5;
      let h = '';
      for (let i = -R; i <= R; i++) h += `<line x1="${i}" y1="${-R}" x2="${i}" y2="${R}" stroke="var(--grid)" stroke-width=".04"/><line x1="${-R}" y1="${i}" x2="${R}" y2="${i}" stroke="var(--grid)" stroke-width=".04"/>`;
      h += `<line x1="${-R}" y1="0" x2="${R}" y2="0" stroke="var(--ink)" stroke-width=".06"/><line x1="0" y1="${-R}" x2="0" y2="${R}" stroke="var(--ink)" stroke-width=".06"/>`;
      h += `<line x1="${-R}" y1="${-(m * -R + q)}" x2="${R}" y2="${-(m * R + q)}" stroke="var(--ink)" stroke-width=".09"/>`;
      // slope triangle: 1 to the right (ink), m up/down (blue)
      h += `<line x1="0" y1="${-q}" x2="1" y2="${-q}" stroke="var(--ink)" stroke-width=".08" stroke-dasharray=".15 .1"/>`;
      h += `<line x1="1" y1="${-q}" x2="1" y2="${-(q + m)}" stroke="var(--m)" stroke-width=".12"/>`;
      h += `<text x=".5" y="${-q + (m > 0 ? .55 : -.25)}" font-size=".5" text-anchor="middle" fill="var(--ink)" font-weight="700">1</text>`;
      h += `<text x="1.2" y="${-(q + m / 2) + .18}" font-size=".55" fill="var(--m)" font-weight="800">m</text>`;
      h += `<circle cx="0" cy="${-q}" r=".2" fill="var(--q)"/><text x="-.3" y="${-q + .18}" font-size=".55" text-anchor="end" fill="var(--q)" font-weight="800">q</text>`;
      svg.innerHTML = h;
      document.getElementById('mV').textContent = fmt(m);
      document.getElementById('qV').textContent = fmt(q);
      document.getElementById('gOut').innerHTML = `g(x) = <span class="mm">${fmt(m)}</span>·x ${q < 0 ? '−' : '+'} <span class="qq">${fmt(Math.abs(q))}</span>`;
    }
    mS.addEventListener('input', draw); qS.addEventListener('input', draw);
    draw();
  }

  // unit circle: cos = x (green), sin = y (orange), tan = slope, drawn on x = 1 (blue, like m)
  function setupCircle() {
    const svg = document.getElementById('ucSvg');
    if (!svg) return;
    const s = document.getElementById('ucS');
    const f = v => (Math.abs(v) < 5e-4 ? '0' : v.toFixed(3).replace('-', '−'));
    function draw() {
      const deg = +s.value, a = deg * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
      const tanOk = Math.abs(c) > 1e-6, t = tanOk ? sn / c : NaN, R = 1.6;
      let h = '';
      for (let i = -1.5; i <= 1.5; i += .5) h += `<line x1="${i}" y1="${-R}" x2="${i}" y2="${R}" stroke="var(--grid)" stroke-width=".01"/><line x1="${-R}" y1="${i}" x2="${R}" y2="${i}" stroke="var(--grid)" stroke-width=".01"/>`;
      h += `<line x1="${-R}" y1="0" x2="${R}" y2="0" stroke="var(--ink)" stroke-width=".015"/><line x1="0" y1="${-R}" x2="0" y2="${R}" stroke="var(--ink)" stroke-width=".015"/>`;
      h += `<circle cx="0" cy="0" r="1" fill="none" stroke="var(--ink)" stroke-width=".02"/>`;
      h += `<line x1="1" y1="${-R}" x2="1" y2="${R}" stroke="var(--mute)" stroke-width=".01" stroke-dasharray=".04 .03"/>`;
      // angle arc
      const ar = .22, large = ((deg % 360) + 360) % 360 > 180 ? 1 : 0, sweep = deg >= 0 ? 0 : 1;
      if (Math.abs(deg) % 360 > .5) h += `<path d="M${ar} 0 A${ar} ${ar} 0 ${deg >= 0 ? large : 1 - large} ${sweep} ${ar * c} ${-ar * sn}" fill="none" stroke="var(--ink)" stroke-width=".015"/>`;
      if (tanOk && Math.abs(t) < 4) h += `<line x1="${-R * 2}" y1="${2 * R * t}" x2="${R * 2}" y2="${-2 * R * t}" stroke="var(--mute)" stroke-width=".012"/>`;
      h += `<line x1="0" y1="0" x2="${c}" y2="${-sn}" stroke="var(--ink)" stroke-width=".02"/>`;
      h += `<line x1="0" y1="0" x2="${c}" y2="0" stroke="var(--cos)" stroke-width=".045"/>`;
      h += `<line x1="${c}" y1="0" x2="${c}" y2="${-sn}" stroke="var(--sin)" stroke-width=".045"/>`;
      if (tanOk && Math.abs(t) < 1.6) h += `<line x1="1" y1="0" x2="1" y2="${-t}" stroke="var(--m)" stroke-width=".045"/>`;
      h += `<circle cx="${c}" cy="${-sn}" r=".045" fill="var(--ink)"/><text x="${c + .07 * Math.sign(c || 1)}" y="${-sn - .06}" font-size=".13" font-weight="700" fill="var(--ink)" text-anchor="${c >= 0 ? 'start' : 'end'}">P</text>`;
      svg.innerHTML = h;
      const k = ((deg % 360) + 360) % 360;
      const quad = [0, 90, 180, 270].includes(k) ? D('axis') : 'Quadrant ' + ['I', 'II', 'III', 'IV'][Math.floor(k / 90)];
      document.getElementById('ucOut').innerHTML =
        `<div><b>α = ${String(deg).replace('-', '−')}°</b> = ${f(a)} rad · ${quad}</div>` +
        `<div style="color:var(--cos)"><b>cos(α) = ${f(c)}</b> (${D('x')})</div>` +
        `<div style="color:var(--sin)"><b>sin(α) = ${f(sn)}</b> (${D('y')})</div>` +
        `<div style="color:var(--m)"><b>tan(α) = ${tanOk ? f(t) : D('nd')}</b> (${D('slope')})</div>`;
    }
    s.addEventListener('input', draw);
    document.querySelectorAll('[data-deg]').forEach(b => b.addEventListener('click', () => { s.value = b.dataset.deg; draw(); }));
    draw();
  }

  // single-file bilingual pages: <html data-bilingual>, buttons with data-setlang
  function setupBilingual() {
    document.querySelectorAll('[data-setlang]').forEach(a => {
      a.toggleAttribute('aria-current', a.dataset.setlang === document.documentElement.lang);
      a.addEventListener('click', e => {
        e.preventDefault();
        document.documentElement.lang = a.dataset.setlang;
        document.querySelectorAll('[data-setlang]').forEach(b => b.toggleAttribute('aria-current', b.dataset.setlang === a.dataset.setlang));
        document.dispatchEvent(new Event('langchange'));
      });
    });
  }

  // fill-in cheat sheet: <span class="gap"><span>answer</span></span>
  function setupGaps() {
    document.querySelectorAll('.gap').forEach(g => {
      g.tabIndex = 0; g.setAttribute('role', 'button');
      const t = () => g.classList.toggle('open');
      g.addEventListener('click', t);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
    });
    document.querySelectorAll('[data-gaps]').forEach(b => b.addEventListener('click', () => {
      const open = !document.body.classList.contains('gaps-open');
      document.body.classList.toggle('gaps-open', open);
      document.querySelectorAll('.gap').forEach(g => g.classList.toggle('open', open));
    }));
  }

  // recipe puzzle: <ol class="puzzle"> items in the right order; shown shuffled, tap them in order
  function setupPuzzles() {
    document.querySelectorAll('ol.puzzle').forEach(ol => {
      const items = [...ol.children]; items.forEach((li, i) => { li.dataset.i = i; });
      let next = 0;
      const msg = ol.nextElementSibling && ol.nextElementSibling.classList.contains('puzzle-msg') ? ol.nextElementSibling : null;
      function shuffle() {
        next = 0; if (msg) msg.hidden = true;
        const arr = items.slice();
        do { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } } while (arr.every((li, i) => +li.dataset.i === i));
        arr.forEach(li => { li.className = ''; li.removeAttribute('data-n'); ol.append(li); });
      }
      items.forEach(li => {
        li.tabIndex = 0; li.setAttribute('role', 'button');
        const pick = () => {
          if (li.classList.contains('ok')) return;
          if (+li.dataset.i === next) {
            li.classList.add('ok'); li.dataset.n = ++next;
            // keep solved ones on top, in order
            const solved = items.filter(x => x.classList.contains('ok')).sort((a, b) => a.dataset.n - b.dataset.n);
            solved.forEach((x, k) => { if (ol.children[k] !== x) ol.insertBefore(x, ol.children[k]); });
            if (next === items.length && msg) msg.hidden = false;
          } else { li.classList.remove('no'); void li.offsetWidth; li.classList.add('no'); clearTimeout(li._t); li._t = setTimeout(() => li.classList.remove('no'), 700); }
        };
        li.addEventListener('click', pick);
        li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });
      const again = ol.parentElement.querySelector('[data-puzzle-again]');
      if (again) again.addEventListener('click', shuffle);
      shuffle();
    });
  }

  // shrink a display formula (down to 70 %) when it is wider than its box, e.g. on phones
  function fitWide() {
    document.querySelectorAll('.katex-display').forEach(d => {
      if (!d.offsetParent) return;
      d.style.fontSize = '';
      if (d.scrollWidth > d.clientWidth + 1) d.style.fontSize = Math.max(.7, d.clientWidth / d.scrollWidth - .01) + 'em';
    });
  }
  const refit = () => requestAnimationFrame(fitWide);
  window.addEventListener('resize', refit);
  document.addEventListener('click', refit);
  document.addEventListener('langchange', refit);

  // init runs on load and again after the language switch swaps the page content in place (see theme.js)
  let pageCtl = null;
  function init(opts = {}) {
    if (pageCtl) pageCtl.abort();
    pageCtl = new AbortController(); const sig = { signal: pageCtl.signal };
    progressUpdate = () => {};
    setupBilingual(); setupGaps(); setupPuzzles();
    document.querySelectorAll('h2').forEach(h => { const sp = document.createElement('span'); sp.className = 'hl'; while (h.firstChild) sp.append(h.firstChild); h.append(sp); });
    const exs = [...document.querySelectorAll('.ex')];
    const nav = document.querySelector('.nav');
    // section pills carry the number of their heading ("1 · Radians" -> pill "1 Radians")
    if (nav) nav.querySelectorAll('a[href^="#"]').forEach(a => {
      const t = document.getElementById(a.getAttribute('href').slice(1));
      const m = t && t.tagName === 'H2' && t.textContent.match(/^\s*(\d+)\s*·/);
      if (m && !a.querySelector('.pn')) a.insertAdjacentHTML('afterbegin', `<span class="pn">${m[1]}</span>`);
    });
    if (nav && exs.length) {
      const pr = document.createElement('div'); pr.className = 'progress';
      pr.innerHTML = '<span class="txt"></span><span class="bar"><i></i></span><button type="button"></button>';
      nav.append(pr);
      const btn = pr.querySelector('button'); btn.innerHTML = D('clear');
      btn.addEventListener('click', () => { doneSet.clear(); saveDone(); document.querySelectorAll('.stamp').forEach(x => x.remove()); progressUpdate(); });
      progressUpdate = () => {
        const n = exs.filter(e => doneSet.has(e.id)).length;
        pr.querySelector('.txt').innerHTML = of(n, exs.length);
        pr.querySelector('i').style.width = (100 * n / exs.length) + '%';
        nav.querySelectorAll('a[href^="#"]').forEach(a => a.classList.toggle('done', doneSet.has(a.getAttribute('href').slice(1))));
      };
    }
    exs.forEach(setupExercise);
    progressUpdate();
    // jump targets land below the sticky nav (its height changes with the progress bar and screen size)
    if (nav) {
      const setNavH = () => document.documentElement.style.setProperty('--navh', (nav.offsetHeight + 16) + 'px');
      setNavH(); window.addEventListener('resize', setNavH, sig);
      if (location.hash && !opts.swap) requestAnimationFrame(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); });
      // scroll spy: highlight the pill of the section currently on screen and keep it visible in the pill row
      const ul = nav.querySelector('ul');
      const links = [...nav.querySelectorAll('a[href^="#"]')].map(a => [a, document.getElementById(a.getAttribute('href').slice(1))]).filter(([, t]) => t);
      let current = null, ticking = false;
      const spy = () => {
        ticking = false;
        const line = nav.offsetHeight + 40;
        let hit = null;
        for (const [a, t] of links) if (t.getBoundingClientRect().top <= line) hit = a;
        if (hit === current) return;
        if (current) current.classList.remove('active');
        current = hit;
        if (hit) {
          hit.classList.add('active');
          const l = hit.offsetLeft - ul.offsetLeft, r = l + hit.offsetWidth;
          if (l < ul.scrollLeft || r > ul.scrollLeft + ul.clientWidth) ul.scrollTo({ left: l - 12, behavior: 'smooth' });
        }
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true, signal: pageCtl.signal });
      spy();
    }
    setupReveals(document);
    setupPlay();
    setupCircle();
    renderMath(document.body);
    refit();
  }
  window.nachhilfeInit = init;
  document.addEventListener('DOMContentLoaded', () => init());
})();
