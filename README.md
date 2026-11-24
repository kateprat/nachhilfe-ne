# Nachhilfe NE – Mathe 2cNP Schritt für Schritt

Static site (no build step), deployed by Cloudflare on every push.

- `index.html` / `en.html` – start page (topics in course order)
- `trigonometrie/` – chapter page (`index.html` EN default, `de.html`), `interaktiv.html` (unit circle, equations, radians + theory), `spickzettel.html` (fill-in cheat sheet)
- `quadriken/` – chapter page (`index.html` DE default, `en.html`), `interaktiv.html` (+ theory), `spickzettel.html`
- `grundlagen/` – algebra toolbox (brackets, binomials, fractions, quadratic formula, completing the square, typical mistakes)
- `training/` – mixed exam training (own exercises), recipe puzzle
- `assets/` – shared CSS, `steps.js` (step reveal, progress, bilingual blocks, gaps, puzzle), `theme.js` (Auto/light/dark), vendored KaTeX

Bilingual single-file pages use `<html data-bilingual>` and `data-l="de|en"` blocks.
