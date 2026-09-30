# Daymark v1.0.0 — Release Notes (paste-ready)

Copy everything below the line into GitHub Releases. Tag: **v1.0.0**
(already pushed; select it when drafting). Title suggestion: **Daymark 1.0.0**.

---

Daymark is a date and week calculator for day-to-day co-op work: count days
between dates, follow the year with a descending week countdown that matches
the printed wall calendar, and keep the investment series and member grade
tables one click away. No sign-in, no server, no tracking.

**Live site:** https://mitemshub.github.io/daymark/

## Highlights

**Date calculator.** Two dates in, and you get both day counts in plain
language: "+ Today" counts the end date in the total, "− Today" stops the
day before. The labels adapt to "+ End date" and "− End date" when the end
date is in the future, so they always tell the truth. Weeks and leftover
days, a calendar span in months and days, a month-by-month breakdown whose
segments sum exactly to the full total, and a reverse calculator round it
out.

**Week of the Year.** The printed wall calendar's own system, digitized.
Every year has 53 calendar weeks: week 1 runs January 1 to the first Sunday
and holds the top number, 52; weeks 2 to 52 are Monday–Sunday weeks numbered
53 minus the week; the final partial week stays unnumbered, exactly like the
blank cell on the paper. Sep 28 to Oct 4 2026 is Week 13 with 13 weeks
remaining, and the countdown ruler opens centered on the current week.

**Investment Series and Member Grade.** Rates, periods, penalties and
status for every series, with anniversary views that follow each product's
own year (October to September where it should). All grades with their
credit, contribution, global and annual limits, values exactly as the
source paper records them.

**Data page.** Edit any rate, date or limit right in the app. Changes stay
in your browser, with JSON export and import to move them between devices.
Reset brings the shipped defaults back.

**Installable app.** Full PWA: add it to your phone's home screen or install
it from the browser menu, and the pages you visited keep working offline.

## Under the hood

- Static site: Next.js 15, React 19, TypeScript strict, Tailwind 4, and no
  runtime dependency beyond date-fns.
- 61 unit tests covering the date engine, the 53-week calendar convention
  (checked row by row against the printed sheet), and anniversary windows.
- Automatic deploys to GitHub Pages on every push, handled by GitHub
  Actions with a base-path aware static build.
- Accessible: reduced-motion support, live regions on results, keyboard
  navigable throughout.
- MIT licensed.
