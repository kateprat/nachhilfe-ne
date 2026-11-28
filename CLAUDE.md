# Nachhilfe NE: how to work on this site

Static tutoring site for one student (Mathe 2cNP, Kurzzeitgymnasium) following the school scripts
(Blöchliger/Schnürer, fginfo.ksbg.ch). Default language German, every page also in English.

## Content
- Follow the script's order and numbering (15.1–15.4, 17.1–17.5). Use the script's terms.
- Per section: "Das brauchst du für …" with plain explanations, then the exercises, then a closed
  `<details class="more">` "Mehr aus dem Skript" with the formal items (definitions, proofs, script examples, page link).
- Script numbers only as small grey tags (`<span class="tag">15.3.4</span>`), plain titles first.
- Own additions not in the script are marked with the ★ (`.xtra`).
- Each exercise starts with one `<p class="th">` "Brauchst du Hilfe?" link to the plain explanation it needs.
- Step-by-step solutions: one idea per step, a short "why", then the calculation. Never skip how to get there.
- If the script has no model solution, say so in the step.
- Don't overwhelm the student: short, warm, plain German (Swiss spelling, no ß).

## Formulas
- A formula or equation is never broken in the middle of a line. Inline KaTeX gets `nowrap` (steps.js `fitInline`):
  it shrinks a little if needed and scrolls only as a last resort. Long derivations go into display math or are split
  into several lines that each start with "=".
- Dynamic output (interaktiv.html) must do the same: one formula per `.fl` line.

## Checking before every push
- Check both widths: phone (390 px) and laptop browser (1300 px), both languages.
- Run `python3 tools/check_formulas.py` with the site served on localhost:8765 (needs Playwright + Chrome):
  it opens all steps and folded boxes and reports broken formulas and sideways page overflow.
- Look at screenshots of what changed, on both widths.
- Bump `?v=` of a changed asset in every page that loads it.

## Privacy
- The student is a minor: no tracking, nothing stored server-side, no personal data, phone numbers or emails in the code.

## Git
- No Claude co-author or session trailers in commits; the README credits Claude.
