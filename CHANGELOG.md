# Changelog

## Unreleased

### Call Over

- New tab for the daily payment reconciliation. Upload a bank statement and
  a payment list (Excel, CSV or PDF; Zenith and GTB layouts auto-detected)
  and every payment is classified against the statement: paid, reversed,
  partial reversal, double posted, partial payment, or not found, each with
  its raw mention count in brackets, as in the spreadsheet process this
  replaces.
- Reference matching follows the call-over rule on any bank: ZB/A/006570/5
  matches ZBA0065705 but never ZBA00657050.
- Statement debits that no payment claims are listed separately.
- A4 printable report with the evidence lines under each payment.
- New dependencies: SheetJS (vendored tarball from the official CDN) and
  pdfjs-dist, both loaded only by this tab.
- Engine validated against real workbooks: the engine's mention counts
  match the spreadsheet formula's verdicts on all 578 payment rows of the
  reference call-over file.

## 1.0.0 (30 September 2026)

First release. Everything below ships in it.

### Calculator

- Day counts between two dates in the + Today / − Today form (labels adapt
  to + End date / − End date when the end is not today), with weeks plus
  leftover days and a calendar span in months and days.
- Month-by-month breakdown whose segments sum exactly to the + Today
  total.
- Reverse calculation: start date plus or minus N days.
- Today buttons that read the device's local date.

### Week of the Year

- The printed wall calendar's descending week system: every year has 53
  calendar weeks, week 1 runs January 1 to the first Sunday and holds the
  top number 52, weeks 2 to 52 are Monday-Sunday weeks numbered 53 minus
  the week, and the final partial week is unnumbered.
- Countdown ruler laid out from Week 52 down to Week 1. It opens centered
  on the current week and keeps free scrolling, with arrow buttons and
  dimmed elapsed weeks.
- Lookup by date (calendar week, descending week, range, days left) and by
  week number for any year.
- Year timeline as paginated week cards that open on the current week.

### Investment Series

- All series with rates, periods, penalties and status.
- Anniversary views that follow each product's own months, including the
  October to September wrap-around.

### Member Grade

- Full grade table with credit, contribution, global and annual limits,
  searchable and sortable, values exactly as the source paper records them.

### Data page

- In-browser editing of all reference data, with JSON export, import and
  reset. Edits stay in local storage; nothing is uploaded.

### Platform

- Installable PWA with an offline service worker and a full icon set
  generated from one drawing.
- Responsive layout, iOS zoom-proof inputs, reduced-motion support.
- Automatic deployment to GitHub Pages through GitHub Actions, with the
  base-path aware static build.- 61 unit tests, strict TypeScript, no runtime dependencies beyond Next.js,
React and date-fns.
