// Light/dark: follows the device by default ("Auto"); a manual choice is remembered on this device.
(function () {
  const KEY = 'nachhilfe-theme';
  let pref = 'auto';
  try { pref = localStorage.getItem(KEY) || 'auto'; } catch (e) {}
  const apply = p => { if (p === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', p); };
  apply(pref);
  document.addEventListener('DOMContentLoaded', () => {
    const lang = document.querySelector('.langsw');
    if (!lang) return;
    const en = document.documentElement.lang === 'en';
    const box = document.createElement('div'); box.className = 'topctl';
    lang.before(box);
    const sw = document.createElement('div'); sw.className = 'langsw'; sw.setAttribute('role', 'group');
    sw.setAttribute('aria-label', en ? 'Colour mode' : 'Farbmodus');
    const opts = [['auto', 'Auto', en ? 'Like the device' : 'Wie das Gerät'], ['light', '☀', en ? 'Light' : 'Hell'], ['dark', '☾', en ? 'Dark' : 'Dunkel']];
    opts.forEach(([v, t, label]) => {
      const b = document.createElement('a'); b.href = '#'; b.textContent = t; b.title = label; b.setAttribute('aria-label', label); b.dataset.theme = v;
      b.addEventListener('click', e => { e.preventDefault(); pref = v; try { localStorage.setItem(KEY, v); } catch (err) {} apply(v); mark(); });
      sw.append(b);
    });
    const mark = () => sw.querySelectorAll('a').forEach(a => a.toggleAttribute('aria-current', a.dataset.theme === pref));
    mark();
    box.append(sw, lang);
  });
})();
