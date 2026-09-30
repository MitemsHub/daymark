# Daymark v1.1.0 — Release Notes (paste-ready)

Copy everything below the line into GitHub Releases. Tag: **v1.1.0**
(select it when drafting). Title suggestion: **Daymark 1.1.0: Call Over**.

---

Daymark 1.1.0 adds **Call Over**, the daily payment reconciliation, on top of
everything 1.0 shipped: the date calculator with + Today and − Today counts,
the printed wall calendar's descending week system, the investment series,
the member grade table, and the in-browser Data page.

**Live site:** https://mitemshub.github.io/daymark/

## Call Over

Upload the bank statement and the payment list (Excel, CSV or PDF; Zenith,
GTB and other layouts are detected automatically) and every payment is
classified against the statement:

- **Paid** went through and stayed. **Reversed** means the money came back,
  partial if only some of it did. **Double posted** means the statement
  charged the payment twice. **Short paid** means a smaller amount left.
  **Not found** means the statement never saw the reference.
- Each payment shows its raw mention count in brackets, in the same
  "Found N times" form as the Excel process this replaces.
- Matching follows the call-over reference rule on any bank:
  ZB/A/006570/5 matches ZBA0065705 but never ZBA00657050.
- Every paid and short paid verdict is cross-checked: the amount and the
  beneficiary name must both appear in the statement narration. A miss adds
  a note to the row; it never changes the status.
- The report also lists **No payment to compare with the following**, the
  statement debits no payment claims, the audit the spreadsheet cannot do.
  The list opens with 5 rows and a Show all button.
- Several statement or payment files can be uploaded at once and are merged,
  with per-file failures reported and skipped. Multi-statement runs get a
  per-bank breakdown, and the results export to CSV.
- Print gives an A4 report, problems first, with the evidence lines under
  each payment.
- Everything runs in the browser. Files never leave the machine, the session
  holds one localStorage copy, and results clear themselves after one hour
  (the page shows the countdown, and Clear now empties everything at once).

## Platform

- Deploys publish the same build to a gh-pages branch as a safety net, so
  the Pages source setting landing on "Deploy from a branch" serves the app
  instead of a Jekyll README page.
- A scheduled Pages watchdog checks the live site every 30 minutes and
  republishes it if the Jekyll page takes over.

## Under the hood

- Static site: Next.js 15, React 19, TypeScript strict, Tailwind 4.
- 86 unit tests, including one that replays a full day's real call-over
  workbook: the engine's mention counts match the spreadsheet formula's
  verdicts on all 578 payment rows.
- New dependencies load only on the Call Over tab: SheetJS (vendored
  tarball from the official CDN) and pdfjs-dist.
- MIT licensed.
