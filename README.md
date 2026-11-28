# Nachhilfe NE – Mathe 2cNP Schritt für Schritt

Static site (no build step), deployed by Cloudflare on every push.

- `index.html` / `en.html` – start page (topics in course order)
- `trigonometrie/` – chapter page (`index.html` EN default, `de.html`), `interaktiv.html` (unit circle with typeable angle, equations, radians + theory); chapter covers E1–E11 (polar coordinates, rotating points, right triangles; script pages 7–9 / E8 still missing), `spickzettel.html` (fill-in cheat sheet)
- `quadriken/` – chapter page (`index.html` DE default, `en.html`), `interaktiv.html` (+ theory), `spickzettel.html`
- `grundlagen/` – algebra toolbox (brackets, binomials, fractions, quadratic formula, completing the square, typical mistakes)
- `training/` – mixed exam training (own exercises), recipe puzzle
- `assets/` – shared CSS, `steps.js` (step reveal, progress, bilingual blocks, gaps, puzzle), `theme.js` (Auto/light/dark), vendored KaTeX

Bilingual single-file pages use `<html data-bilingual>` and `data-l="de|en"` blocks.

## Credits

Built by kateprat with the help of Claude (Anthropic) as a coding and writing assistant.
