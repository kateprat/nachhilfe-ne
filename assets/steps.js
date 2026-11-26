// Step-by-step reveal for worked (data-mode="worked") and faded (data-mode="faded") exercises,
// KaTeX rendering with colour macros, and the small m/q line playground.
(function () {
  const isEN = () => document.documentElement.lang === 'en';
  // every generated label carries both languages; CSS shows the one matching <html lang>
  const T = {
    show: ['Rechnung zeigen', 'Show working'], next: ['Nächster Schritt', 'Next step'], all: ['Alles zeigen', 'Show all'],
    reset: ['Von vorn', 'Start over'], stamp: ['Geschafft!', 'Done!'], clear: ['Zurücksetzen', 'Reset'],
    predict: ['Was kommt als Nächstes? Erst überlegen, dann klicken.', 'What comes next? Think first, then click.'],
    start: ['Wie würdest du anfangen? Erst überlegen, dann klicken.', 'How would you start? Think first, then click.'],
    axis: ['auf einer Achse', 'on an axis'], x: ['x-Koordinate', 'x-coordinate'], y: ['y-Koordinate', 'y-coordinate'],
    slope: ['Steigung', 'slope'], nd: ['nicht definiert', 'not defined'],
    check: ['Prüfen', 'Check'], showstep: ['Schritt zeigen', 'Show the step'], right: ['Richtig!', 'Correct!'],
    empty: ['Gib zuerst eine Antwort ein, auch wenn du unsicher bist.', 'Type an answer first, even if you are unsure.'],
    unread: ['Das kann ich nicht lesen. Schreib zum Beispiel 3, −7, 1.5 oder √5.', 'I can’t read that. Write for example 3, −7, 1.5 or √5.'],
    again: ['Noch nicht. Ändere deine Antwort und prüf nochmals, oder lass dir den Schritt zeigen.', 'Not yet. Change your answer and check again, or open the step.'],
    mine: ['Deine Antwort:', 'Your answer:']
  };
  const D = k => `<span data-l="de">${T[k][0]}</span><span data-l="en">${T[k][1]}</span>`;
  const of = (a, b) => `<span data-l="de">${a} von ${b} geschafft</span><span data-l="en">${a} of ${b} done</span>`;
  const firstTry = (a, b) => `<span data-l="de">Beim 1. Versuch richtig: ${a} von ${b}</span><span data-l="en">Right on the first try: ${a} of ${b}</span>`;
  // read what she typed: 3, -7, 1,5, 1/2, √5, √(5), √√5, 5^(1/4), π
  function num(str) {
    let t = String(str).trim().toLowerCase().replace(/[−–]/g, '-').replace(/,/g, '.').replace(/\s+/g, '').replace(/π|pi/g, '(Math.PI)').replace(/\^/g, '**').replace(/wurzel|sqrt/g, '√');
    if (!t) return NaN;
    for (let k = 0; k < 6 && t.includes('√'); k++) t = t.replace(/√(\d+(?:\.\d+)?|\(\Math\.PI\)|Math\.sqrt\([^()]*\)|\([^()]*\))/, 'Math.sqrt($1)');
    if (t.includes('√') || /[^0-9.+\-*/()]/.test(t.replace(/Math\.(sqrt|PI)/g, ''))) return NaN;
    try { const v = Function('"use strict";return (' + t + ')')(); return typeof v === 'number' && isFinite(v) ? v : NaN; } catch (e) { return NaN; }
  }
  const same = (a, b) => Math.abs(a - b) <= 0.01 * Math.max(1, Math.abs(b));
  const MACROS = { '\\m': '\\textcolor{#3b7be8}{m}', '\\q': '\\textcolor{#e0475b}{q}' };

  // progress per topic (same for DE and EN), kept only on this device
  const TOPIC = location.pathname.replace(/(index|en|de)(\.html)?$/, '');
  const PKEY = 'nachhilfe-done:' + TOPIC;
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
    const faded = false; // all exercises use the same flow: step by step with "Next step"
    let shown = 0; // no step open at first: the student opens them one by one

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

    // "try first" questions: a step with <div class="ask"> opens only after she has answered (right or wrong)
    const asks = steps.map(st => { const a = st.querySelector(':scope > .ask'); if (a) a.remove(); return a; });
    const askCount = asks.filter(Boolean).length;
    let right1 = 0;
    const ctrl = document.createElement('div');
    ctrl.className = 'ctrl';
    ctrl.innerHTML = `<button type="button" class="primary" data-a="next">${D('next')}</button>` +
      `<button type="button" data-a="all">${D('all')}</button><button type="button" data-a="reset">${D('reset')}</button>`;
    ex.querySelector('.steps').after(ctrl);
    const pred = document.createElement('p'); pred.className = 'predict'; pred.innerHTML = D('predict');
    if (!faded) ctrl.before(pred);
    const next = ctrl.querySelector('[data-a=next]');
    if (askCount) ctrl.querySelector('[data-a=all]').remove(); // no skipping past the questions
    asks.forEach((a, i) => { if (a) { pred.before(a); setupAsk(a, i); } });
    const tally = document.createElement('p'); tally.className = 'tally';
    if (askCount && done) done.append(tally);

    function setupAsk(a, i) {
      const hint = document.createElement('p'); hint.className = 'hintmsg'; hint.hidden = true;
      const showBtn = document.createElement('button'); showBtn.type = 'button'; showBtn.className = 'showstep'; showBtn.innerHTML = D('showstep'); showBtn.hidden = true;
      let tries = 0, answer = '';
      const own = [...a.querySelectorAll(':scope > .hint')]; own.forEach(h => { h.hidden = true; }); // stay in the page so KaTeX renders them; copied when needed
      const say = (html, cls) => { hint.innerHTML = html; hint.className = 'hintmsg ' + (cls || ''); hint.hidden = false; if (hint.textContent.includes('\\(')) renderMath(hint); };
      const resolve = ok => {
        a._resolved = true; if (ok && tries === 0) right1++;
        const st = steps[i], m = document.createElement('p'); m.className = 'mine' + (ok ? ' ok' : '');
        const q = a.querySelector('.q'); m.innerHTML = (q ? `<span class="mq">${q.innerHTML}</span>` : '') + `<span class="ma">${D('mine')} ${answer}${ok ? ' ✓' : ''}</span>`; st.querySelector('.mine')?.remove(); st.querySelector('.nr').after(m);
        const y0 = ctrl.getBoundingClientRect().top; shown = Math.min(steps.length, i + 1); update(true, y0);
      };
      const wrong = vals => {
        tries++;
        const h = own.find(h => h.dataset.when && h.dataset.when.split('|').every((w, k) => same(vals[k], num(w)))) || own.find(h => !h.dataset.when);
        say(h ? h.innerHTML : D('again'), 'warn'); showBtn.hidden = false;
      };
      a._reset = () => { a._resolved = false; tries = 0; answer = ''; hint.hidden = true; showBtn.hidden = true; a.querySelectorAll('input').forEach(x => { x.value = ''; }); a.querySelectorAll('.opt').forEach(o => o.classList.remove('picked')); };
      showBtn.addEventListener('click', () => resolve(false));
      if (a.dataset.type === 'choice') {
        a.querySelectorAll('.opt').forEach(o => {
          o.type = 'button'; const oh = o.querySelector('.oh'); if (oh) oh.hidden = true;
          o.addEventListener('click', () => {
            const c = o.cloneNode(true); c.querySelector('.oh')?.remove(); answer = '«' + c.innerHTML + '»'; a.querySelectorAll('.opt').forEach(x => x.classList.toggle('picked', x === o));
            if (o.hasAttribute('data-ok')) { resolve(true); return; }
            tries++; say(oh ? oh.innerHTML : D('again'), 'warn'); showBtn.hidden = false;
          });
        });
      } else {
        // data-form="M = (_, _)" → one field per _
        const form = document.createElement('div'); form.className = 'form';
        form.innerHTML = (a.dataset.form || '_').split('_').map((part, k, arr) => `<span>${part}</span>` + (k < arr.length - 1 ? `<input type="text" name="antwort-${i}-${k}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-1p-ignore enterkeyhint="done" aria-label="${k + 1}">` : '')).join('');
        const go = document.createElement('button'); go.type = 'button'; go.className = 'primary'; go.innerHTML = D('check');
        form.append(go);
        if (a.dataset.keys) { const kb = document.createElement('span'); kb.className = 'keys'; a.dataset.keys.split(' ').forEach(k => { const b = document.createElement('button'); b.type = 'button'; b.textContent = k; b.addEventListener('pointerdown', e => e.preventDefault()); b.addEventListener('click', () => { const f = form.querySelector('input:focus') || a._last || form.querySelector('input'); const p0 = f.selectionStart ?? f.value.length; f.value = f.value.slice(0, p0) + k + f.value.slice(p0); f.focus(); f.setSelectionRange(p0 + k.length, p0 + k.length); }); kb.append(b); }); form.append(kb); }
        a.append(form);
        const ins = [...form.querySelectorAll('input')];
        ins.forEach(x => { x.addEventListener('focus', () => { a._last = x; }); x.addEventListener('input', () => { if (hint.classList.contains('err')) hint.hidden = true; }); x.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); }); });
        const want = (a.dataset.ans || '').split('|').map(num);
        go.addEventListener('click', () => {
          if (ins.some(x => !x.value.trim())) { say(D('empty'), 'err'); return; }
          const vals = ins.map(x => num(x.value));
          if (vals.some(isNaN)) { say(D('unread'), 'err'); return; }
          answer = (a.dataset.form || '_').split('_').map((part, k, arr) => part + (k < arr.length - 1 ? ins[k].value.trim() : '')).join('');
          if (vals.every((v, k) => same(v, want[k]))) resolve(true); else wrong(vals);
        });
      }
      a.append(hint, showBtn);
    }

    function update(scroll, y0) {
      steps.forEach((st, i) => { st.hidden = i >= shown; st.classList.toggle('on', i === shown - 1); });
      if (done) done.hidden = shown < steps.length;
      const pending = asks[shown] && !asks[shown]._resolved;
      asks.forEach((a, i) => { if (a) a.hidden = i !== shown || a._resolved; });
      next.hidden = shown >= steps.length || pending; pred.hidden = shown >= steps.length || pending;
      if (askCount) tally.innerHTML = firstTry(right1, askCount);
      // the new step opens above the buttons; keep the buttons where they were, so the thumb stays on "Next step"
      pred.innerHTML = D(shown === 0 ? 'start' : 'predict');
      if (scroll && y0 != null) scrollBy({ top: ctrl.getBoundingClientRect().top - y0, behavior: 'instant' });
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
      if (a === 'next') { const y0 = ctrl.getBoundingClientRect().top; shown = Math.min(steps.length, shown + 1); update(true, y0); }
      if (a === 'all') { shown = steps.length; steps.forEach(st => { const c = st.querySelector('.calc'); if (c) c.hidden = false; st._calcBtn && st._calcBtn.remove(); }); update(false); steps.forEach(st => st.classList.remove('on')); }
      if (a === 'reset') { shown = 0; right1 = 0; asks.forEach(q => q && q._reset()); steps.forEach(st => st.querySelector('.mine')?.remove()); hideCalcs(); update(false); if (doneSet.has(ex.id)) { doneSet.delete(ex.id); saveDone(); progressUpdate(); } const sp = ex.querySelector('.stamp'); if (sp) sp.remove(); ex.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
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
  if (window.visualViewport) {
    let t = 0;
    const keep = () => {
      const f = document.activeElement;
      if (!f || !f.closest || !f.closest('.ask')) return;
      clearTimeout(t);
      t = setTimeout(() => {
        const vv = visualViewport, r = f.getBoundingClientRect(), top = r.top - vv.offsetTop, bottom = r.bottom - vv.offsetTop;
        const room = vv.height, want = Math.max(16, room * 0.3);
        if (bottom > room - 16 || top < 16) scrollBy(0, top - want);
      }, 120);
    };
    visualViewport.addEventListener('resize', keep);
  }
  const refit = () => requestAnimationFrame(fitWide);
  window.addEventListener('resize', refit);
  document.addEventListener('click', refit);
  document.addEventListener('langchange', refit);
  document.addEventListener('langchange', () => requestAnimationFrame(() => unorphan(document)));

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
    // the bar in three phases: understand → practise → consolidate
    if (nav && !nav.querySelector('.ph') && nav.querySelector('a[href="#e1"], a[href="#a1"]')) {
      const en = document.documentElement.lang === 'en';
      const mark = (sel, de, enl) => { const a = nav.querySelector(sel); if (!a) return; const li = document.createElement('li'); li.className = 'ph'; li.textContent = en ? enl : de; a.closest('li').before(li); };
      mark('a[href^="#"]', 'Verstehen', 'Understand');
      mark('a[href="#aufgaben"], a[href="#e1"], a[href="#a1"]', 'Üben', 'Practise');
      mark('a[href="#spickzettel"]', 'Festigen', 'Consolidate');
    }
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
    try { if (exs.length) localStorage.setItem('nachhilfe-total:' + TOPIC, exs.length); } catch (e) {}
    progressUpdate();
    // jump targets land below the sticky nav (its height changes with the progress bar and screen size)
    if (nav) {
      const setNavH = () => document.documentElement.style.setProperty('--navh', (nav.offsetHeight + (parseFloat(getComputedStyle(nav).top) || 0) + 16) + 'px');
      setNavH(); window.addEventListener('resize', setNavH, sig);
      // jump to a section and keep it in place for a moment: on a fresh visit, fonts and formulas finish loading after
      // the jump and push the content down (Safari doesn't compensate), so the jump would land one section too early
      let pinRun = 0;
      const pin = t => {
        const run = ++pinRun; let n = 0;
        const stop = () => { pinRun++; };
        addEventListener('touchstart', stop, { once: true, passive: true }); addEventListener('wheel', stop, { once: true, passive: true });
        const go = () => {
          if (run !== pinRun || n++ > 40) return;
          const d = t.getBoundingClientRect().top - (nav.offsetHeight + (parseFloat(getComputedStyle(nav).top) || 0) + 16);
          if (Math.abs(d) > 2) scrollBy(0, d);
          setTimeout(go, 50);
        };
        go();
      };
      nav.addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]'); if (!a) return;
        const t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
        e.preventDefault(); history.replaceState(history.state, '', '#' + t.id); pin(t);
      }, sig);
      if (location.hash && !opts.swap) requestAnimationFrame(() => { const t = document.getElementById(location.hash.slice(1)); if (t) pin(t); });
      // scroll spy: highlight the pill of the section currently on screen and keep it visible in the pill row
      const ul = nav.querySelector('ul');
      const links = [...nav.querySelectorAll('a[href^="#"]')].map(a => [a, document.getElementById(a.getAttribute('href').slice(1))]).filter(([, t]) => t);
      let current = null, ticking = false;
      const spy = () => {
        ticking = false;
        const line = nav.offsetHeight + (parseFloat(getComputedStyle(nav).top) || 0) + 40;
        let hit = null;
        for (const [a, t] of links) if (t.getBoundingClientRect().top <= line) hit = a;
        if (hit === current) return;
        if (hit) try { localStorage.setItem('nachhilfe-last:' + TOPIC, JSON.stringify({ id: hit.getAttribute('href').slice(1), label: hit.textContent.replace(/^\d+/, '').replace(/ ✓$/, '').trim() })); } catch (e) {}
        if (current) current.classList.remove('active');
        current = hit;
        if (hit) {
          hit.classList.add('active');
          // keep the current pill in the middle of the row, so you see what comes before and after
          ul.scrollTo({ left: hit.offsetLeft - ul.offsetLeft - (ul.clientWidth - hit.offsetWidth) / 2, behavior: 'smooth' });
        }
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true, signal: pageCtl.signal });
      spy();
    }
    // test simulation: rate yourself per task, results add up in "Bilanz"
    const SKEY = 'nachhilfe-self:' + TOPIC;
    let self = {}; try { self = JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch (e) {}
    const en = () => document.documentElement.lang === 'en';
    const OPTS = [['ok', 'Richtig', 'Right'], ['part', 'Teilweise', 'Partly'], ['no', 'Falsch', 'Wrong']];
    const bilanz = () => {
      const box = document.getElementById('bilanzbox'); if (!box) return;
      const sims = [...document.querySelectorAll('.ex[data-selfcheck]')];
      const name = ex => ex.querySelector('h3').innerHTML;
      const by = k => sims.filter(x => self[x.id] === k);
      const rated = sims.filter(x => self[x.id]).length;
      const redo = [...by('no'), ...by('part')];
      box.innerHTML = rated === 0
        ? `<p style="margin:0"><span data-l="de">Noch keine Aufgabe bewertet. Bewerte dich nach jeder Aufgabe der Simulation.</span><span data-l="en">No task rated yet. Rate yourself after each task of the simulation.</span></p>`
        : `<p style="margin:0 0 8px"><b>${by('ok').length}</b> <span data-l="de">richtig</span><span data-l="en">right</span> · <b>${by('part').length}</b> <span data-l="de">teilweise</span><span data-l="en">partly</span> · <b>${by('no').length}</b> <span data-l="de">falsch</span><span data-l="en">wrong</span> · ${rated}/${sims.length}</p>` +
          (redo.length ? `<p style="margin:0"><span data-l="de">Nochmals üben:</span><span data-l="en">Practise again:</span> ${redo.map(x => `<a href="#${x.id}">${name(x)}</a>`).join(', ')}</p>`
                       : `<p style="margin:0"><span data-l="de">Alles richtig bewertet. Stark!</span><span data-l="en">Everything rated right. Great!</span></p>`) +
          `<p style="margin:10px 0 0"><button type="button" data-selfreset><span data-l="de">Bewertung löschen</span><span data-l="en">Clear ratings</span></button></p>`;
      const r = box.querySelector('[data-selfreset]');
      if (r) r.addEventListener('click', () => { self = {}; try { localStorage.removeItem(SKEY); } catch (e) {} document.querySelectorAll('.selfcheck button').forEach(b => b.removeAttribute('aria-pressed')); bilanz(); });
    };
    document.querySelectorAll('.ex[data-selfcheck]').forEach(ex => {
      if (ex.querySelector('.selfcheck')) return;
      const d = document.createElement('div'); d.className = 'selfcheck';
      d.innerHTML = `<span><span data-l="de">Wie lief es?</span><span data-l="en">How did it go?</span></span>` +
        OPTS.map(([k, de, enl]) => `<button type="button" data-k="${k}"${self[ex.id] === k ? ' aria-pressed="true"' : ''}><span data-l="de">${de}</span><span data-l="en">${enl}</span></button>`).join('');
      d.addEventListener('click', e => {
        const b = e.target.closest('[data-k]'); if (!b) return;
        self[ex.id] = b.dataset.k; try { localStorage.setItem(SKEY, JSON.stringify(self)); } catch (err) {}
        d.querySelectorAll('[data-k]').forEach(x => x.toggleAttribute('aria-pressed', x === b)); bilanz();
      });
      ex.append(d);
    });
    bilanz();
    setupReveals(document);
    setupPlay();
    setupCircle();
    renderMath(document.body);
    unorphan(document);
    refit();
  }

  // no lonely last words: glue the last short words (or a trailing "(17.1.2)." to its formula) with non-breaking spaces
  function unorphan(root) {
    const glue = el => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('.katex, .katex-display, button, script, style') ? 2 : 1 });
      let last = null, n; while ((n = w.nextNode())) if (n.nodeValue.trim()) last = n;
      if (!last || last.parentElement.closest('[data-l]') !== el.closest('[data-l]') && el.querySelector('[data-l]')) return;
      let v = last.nodeValue;
      // glue up to two spaces at the end while the glued tail stays short
      for (let k = 0; k < 2; k++) {
        const i = v.search(/\s(?=\S*$)/); if (i < 0) break;
        if (v.length - i > 22) break;
        v = v.slice(0, i) + '\u00A0' + v.slice(i + 1);
      }
      // text that starts with a space right after a formula ("x = 1 (17.1.2).") sticks to the formula
      if (/^\s\S{1,14}$/.test(v) && last.previousSibling && last.previousSibling.nodeType === 1) v = '\u00A0' + v.slice(1);
      last.nodeValue = v;
      // ends with a formula plus a little punctuation ("… O = (0, 0)."): keep the word before the formula with it
      const prev = last.previousSibling;
      if (/^[\s.,;:!?)]{0,4}$/.test(last.nodeValue) && prev && prev.nodeType === 1 && prev.classList.contains('katex')) {
        const t = prev.previousSibling;
        if (t && t.nodeType === 3) t.nodeValue = t.nodeValue.replace(/\s+$/, '\u00A0');
      }
    };
    // short inline formulas never break in the middle ("g(x) =" / "y"); long ones still may, so nothing runs off a phone
    root.querySelectorAll('.katex').forEach(k => { if (k.closest('.katex-display') || !k.offsetParent) return; const box = k.closest('p, li, td, th, div, span[data-l]') || k.parentElement; const w = [...k.querySelector('.katex-html').getClientRects()].reduce((a, r) => a + r.width, 0); if (w < Math.min(220, box.clientWidth * 0.55)) k.classList.add('nw'); });
    root.querySelectorAll('main p, main li, .lead, .task, .done, .why').forEach(el => {
      if (el.closest('.nav')) return;
      const parts = el.querySelectorAll(':scope > [data-l]');
      if (parts.length) parts.forEach(glue); else glue(el);
    });
  }
  window.nachhilfeInit = init;
  document.addEventListener('DOMContentLoaded', () => init());
})();
