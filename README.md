# Daymark

[![Deploy to GitHub Pages](https://github.com/MitemsHub/daymark/actions/workflows/deploy.yml/badge.svg)](https://github.com/MitemsHub/daymark/actions/workflows/deploy.yml) [![Live site](https://img.shields.io/website?url=https%3A%2F%2Fmitemshub.github.io%2Fdaymark%2F&label=live%20site)](https://mitemshub.github.io/daymark/)

**Daymark is live: [https://mitemshub.github.io/daymark/](https://mitemshub.github.io/daymark/)**

A date and week calculator built for day-to-day co-op work. It counts days
between dates, runs a descending week countdown that matches the printed
wall calendar, and keeps the investment series and member grade tables one
click away.

No sign-in, no server, no tracking. Your data edits stay in your browser.

---

## What it does

### Calculator

- **Date range calculator.** Enter two dates and you get:
  - Total days, inclusive: both endpoints counted (Apr 16 to Sep 29 2026 = 167)
  - Total days, exclusive: the elapsed difference (same example = 166)
  - Weeks plus leftover days (`23w 5d`) and a calendar span in months + days
  - Both dates echoed back in full
- **Breakdown by month.** How many days each calendar month contributes
  (April 16-30 = 15, May = 31, and so on; the segments always sum to the
  inclusive total).
- **Reverse calculation.** Start date plus or minus N days. Add counts
  inclusively (the start date is day 1); subtract moves back exactly N
  elapsed days.
- A **Today** button beside every date input. It reads your device's local
  date, never a hard-coded one.

### Week of the Year

A countdown that mirrors the printed co-op wall calendar: M T W T F S SU
columns, calendar weeks 1 to 53 down the left, the descending number down
the right.

```
Jan 1 - Jan 4    Week 52   (Jan 1 to the first Sunday)
Jan 5 - Jan 11   Week 51   (first full Mon-Sun week)
...
Dec 21 - Dec 27  Week 1    (2026; common years end Week 52 on Dec 27)
Dec 28 - Dec 31  (blank)   (final partial week, unnumbered)
```

- Every year has exactly **53 calendar weeks**. Week 1 runs from January 1
  to the first Sunday and holds the top number, 52. Weeks 2 to 52 are
  consecutive Monday-Sunday weeks. Week 53 is the leftover days at the end
  of the year, and the printed calendar leaves its WEEKS cell blank, so
  Daymark shows it unnumbered too.
- The descending number is 53 minus the calendar week. It is also the count
  of numbered weeks remaining, current week included. Example: Sep 28 to
  Oct 4 2026 is Week 13, with 13 weeks remaining.
- The **countdown ruler** lays the whole year out as a strip from Week 52
  down to Week 1. It opens centered on the current week (free scrolling
  still works), with past weeks dimmed and arrow buttons for mouse users.
- **Lookup by date** (calendar week, descending week, range, days left) and
  **by week number** (1 to 52).
- The **year timeline** shows any selected year as paginated week cards,
  nine per page. It opens on the page holding the current week, highlights
  it, dims elapsed weeks, and leaves the final week unnumbered.

A note on the printed sheet: its December labels drift by one day (row 50
says "6DEC-12DEC" while its own day cells read 7-13). The day cells keep the
Monday-Sunday chain unbroken and agree with every other row, so Daymark
follows the cells, not those two labels.

### Investment Series

The co-op's investment products with start and end dates, interest types,
rates, periods and penalty charges. Search picks up names, rates ("17.25%")
and period text. Filter by interest type or status. Selecting a series opens
its anniversary view: current status, the current anniversary period, the
next anniversary, days until it, and the rates table. Anniversary years
follow each product's own months (October to September for Classic
Investment Fund, not January to December).

### Member Grade

All grades with credit limit, minimum contribution, global limit and annual
limit. A quick lookup shows one grade's four limits prominently. The full
table is searchable and sortable, with amounts shown as N2,000,000-style
figures. Values are kept exactly as the source document records them,
including the "Assitant Director" spelling and the zero limits. The table is
a faithful copy of the paper it came from.

### Installable app (PWA)

Daymark is a full PWA. Install it from the browser menu ("Install app" on
desktop Chrome/Edge, "Add to Home Screen" on iOS and Android) and it runs in
its own window with its own icon, offline included:

On your phone, with the live site:

1. Open [https://mitemshub.github.io/daymark/](https://mitemshub.github.io/daymark/)
   once in your phone's browser.
2. **Android (Chrome):** tap the three-dot menu, then "Add to Home screen",
   and confirm. **iPhone (Safari):** tap the Share button, scroll, then
   "Add to Home Screen". (On iOS the install entry lives behind Share; Chrome
   on iPhone cannot install PWAs.)
3. Launch Daymark from your home screen. It opens in its own window, without
   browser bars, with the Daymark icon.
4. Offline test: open the app, visit each tab once, then turn on airplane
   mode and reopen it. Pages you visited keep working; the calculator, week
   countdown and reference tables all run locally, so everything responds
   with no connection. Reconnect before editing reference data on another
   device, since edits live per browser.

- A web app manifest (`app/manifest.ts`) with 192px, 512px and maskable 512px
  icons, standalone display, and the paper theme color. The iOS home-screen
  icon ships as `app/apple-icon.png`.
- A small hand-written service worker (`public/sw.js`, no libraries):
  navigations are network-first with a cached fallback, so the last pages you
  visited stay usable with no connection; static assets are cache-first with
  background refresh.
- The icons are generated from `scripts/generate-icons.mjs` (pure Node, no
  image libraries) so the favicon, manifest icons and apple-touch icon all
  come from one drawing of the daymark mark.

### Data page (edit without code)

Rates change. The Data page lets you change them without touching code:

1. Open **Data** in the navigation.
2. Edit series, dates, rates, periods, penalties, or grade limits in place.
   Add or remove series, grades and interest options.
3. **Save**. Changes persist in this browser and appear on every page.

Also on that page: **Export JSON** (backup), **Import JSON** (restore on any
device), and **Reset to defaults**. Edits live in your browser's local
storage only; nothing is uploaded anywhere. For permanent changes, edit the
files in `/data` and commit.

---

## Technology

- [Next.js](https://nextjs.org) 15 (App Router) + React 19
- [TypeScript](https://www.typescriptlang.org) (strict)
- [Tailwind CSS](https://tailwindcss.com) 4
- [date-fns](https://date-fns.org) 4 for date and week primitives
- [Vitest](https://vitest.dev) for unit tests

No other runtime dependencies.

## Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm start          # serve the production build
npm test           # run the unit tests once
npm run test:watch # tests in watch mode
npm run typecheck  # tsc --noEmit
```

## How the date calculations work

All date logic lives in `lib/dates.ts` and is unit-tested in
`lib/dates.test.ts`.

- Dates are parsed into **local** calendar days (constructed at noon) so
  timezone shifts can never move a day boundary.
- Inclusive count = `differenceInCalendarDays(end, start) + 1`. Both
  endpoints counted; same day = 1.
- Exclusive count = `differenceInCalendarDays(end, start)`. Elapsed days;
  same day = 0.
- Weeks + days divide the exclusive count by 7.
- The calendar span uses date-fns' month difference, which clamps the
  calendar way (Jan 31 + 1 month = Feb 28), then counts leftover days.
- Reverse **add** treats the start date as day 1 (start + 1 day = start),
  so an "add 30 days" span matches a 30-day inclusive range. Reverse
  **subtract** moves back exactly N elapsed days.
- The month breakdown walks the range month by month, clamping each segment
  to the range edges, and its segments sum exactly to the inclusive total.

## How the descending week system works

All week logic lives in `lib/weeks.ts` (tests in `lib/weeks.test.ts`),
implementing the printed wall calendar:

1. Every year has exactly **53 calendar weeks**. There are no ISO 52/53
   rules and no week spillover across year boundaries.
2. **Week 1** runs from **January 1 to the year's first Sunday** (1 to 7
   days) and is numbered **52**, the highest number of the countdown.
3. **Weeks 2 to 52** are consecutive **Monday to Sunday** weeks. Week 2
   begins the Monday after the first Sunday, anchored to day-of-year, so a
   year's week map depends only on its Jan 1 weekday and leap pattern.
4. **Week 53** is the remainder: the Monday after Week 52's Sunday through
   **December 31** (1 to 8 days). The printed calendar shows the row but
   leaves its WEEKS cell blank, and Daymark does the same: week 53 carries
   **no number**.
5. The right-hand WEEKS column is `53 - calendarWeek` for weeks 1 to 52.
   Week 1 = 52, Week 40 = 13, Week 52 = 1. Jan 1 is always Week 1 and Dec 31
   is always week 53, in every year.

The result: the descending number is the count of numbered weeks remaining,
current week included. Week 53 is what is left after the count reaches 1.

## Updating the reference data (code route)

The shipped defaults are the single source of truth in version control:

- `data/investmentSeries.ts` holds one `InvestmentSeries` object per product
  with its `options` array (interest type, rate, period, penalty). Dates are
  ISO strings. A field missing from the source stays `null` and the UI shows
  "Not specified".
- `data/memberGrades.ts` holds one `MemberGrade` row per grade.

Change a rate, add a series or a grade, commit. The UI, search, filters and
anniversary views pick it up automatically. The in-app Data page writes
overrides on top of these defaults per browser; Reset reveals the defaults
again.

## Deployment

Any Node host that runs Next.js works:

```bash
npm run build
npm start        # serves on $PORT (default 3000)
```

For Vercel: import the repository and deploy. No configuration is needed;
all routes are static. The app is fully client-side for data: the localStorage
override travels with the browser, so set repo defaults in `/data` before
deploying if reference data changes.

### GitHub Pages

The repo deploys to Pages by itself. On every push to `main`, a GitHub Actions
workflow runs the tests, builds a static export and publishes it. Nothing to
configure once Pages is on: the live site is
[https://mitemshub.github.io/daymark/](https://mitemshub.github.io/daymark/).

The Pages build differs from a normal build in two ways: every URL carries the
`/daymark` base path (Pages serves project sites from a subfolder), and the
output is plain static files in `out/`. That lives in one script, so local
work stays untouched:

```bash
npm run build:pages   # static export with the /daymark prefix, writes out/
```

`npm run build` and `npm run dev` remain a normal Next.js build with no
prefix, which is what Vercel and `npm start` expect. The manifest, service
worker and sitemap read the base path from the build, so one script covers
both targets.

If you rename the repository, change `/daymark` in two places: the
`build:pages` script in `package.json` and the sitemap URL in `app/sitemap.ts`.
GitHub Actions picks the rest up from the script.

---

## Project structure

```
app/                 routes (home, week, investments, grades, data) + SEO + manifest
components/          UI components, one concern each
lib/                 pure calculation engine + tests (no UI imports)
  dates.ts           inclusive/exclusive counts, breakdown, reverse calc
  weeks.ts           descending week system
  investments.ts     anniversary/status engine
  grades.ts          grade search/sort
  format.ts          naira formatting, rates, query matching
  dataStore.ts       localStorage override layer (Data page)
data/                shipped reference data (types + values)
public/              icons + service worker
scripts/             generate-icons.mjs (PWA icon set, pure Node)
```

## Mobile notes

The layout is responsive throughout: the ledger tables collapse to cards on
small screens, the week ruler scrolls horizontally with edge fades, and the
timeline paginates. On touch devices, form controls render at 16px or larger
so iOS Safari never auto-zooms when an input takes focus. The investments
detail table scrolls horizontally inside its own container rather than
stretching the page.

## Contributing and changes

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, codebase rules and how to
open issues and pull requests. Release history lives in
[CHANGELOG.md](CHANGELOG.md).

## Testing

Unit tests cover: same-day and one-day ranges, month/year boundaries, leap
years, February 29, 30/31-day months, 365/366-day years, multi-year spans,
the reverse calculator, the 53-week calendar convention (checked row by row
against the printed sheet, including the Jan 1 first-Sunday opening week and
the unnumbered final week), date-to-week round-trips, anniversary windows
for every series (including the October-to-September wrap-around and the
open-ended COOP fund), and status transitions around start and maturity
dates.

```bash
npm test
```
