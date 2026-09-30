# Daymark — Date & Week Calculator + Co-op Reference

A small, fast, private-feeling utility for day-to-day co-op work: precise date
math, a descending week countdown for the whole year, and quick-reference
tables for investment series and member grades.

No sign-in, no server, no tracking. It feels like a well-kept internal tool
because that is what it is.

---

## What it does

### Calculator (home)

- **Date range calculator** — enter start and end dates and instantly get:
  - **Total days — inclusive**: both endpoints counted (Apr 16 → Sep 29 2026 = **167**)
  - **Total days — exclusive**: elapsed difference (same example = **166**)
  - Weeks + remaining days (`23w 5d`) and a calendar span in months + days
  - The exact start and end dates echoed back
- **Breakdown by month** — how many days each calendar month contributes
  (April 16–30 → 15, May → 31, …, total 167). Adapts to any range.
- **Reverse calculation** — start date + N days with explicit **Add** or
  **Subtract**. Add counts inclusively (start = day 1); subtract moves back
  exactly N elapsed days.
- **Today** button beside every date input — uses your device's local date,
  never a hard-coded one.

### Week of the Year

A **descending week countdown** that mirrors the printed co-op wall calendar
(M T W T F S SU columns, calendar weeks 1–53 down the left, the descending
number down the right):

```
Jan 1 – Jan 4    Week 52   (Jan 1 → first Sunday)
Jan 5 – Jan 11   Week 51   (first full Mon–Sun week)
...
Dec 21 – Dec 27  Week 1    (2026; common years end Week 52 on Dec 27)
Dec 28 – Dec 31  —         (final partial week, unnumbered)
```

- Every year has exactly **53 calendar weeks**. Week 1 runs from **January 1
to the first Sunday** and opens the countdown at **Week 52**; weeks 2–52 are
consecutive Monday–Sunday weeks; **week 53** is the final partial week and
carries **no number**, exactly as the printed calendar leaves its cell blank.
- The descending number is `53 − calendar week`, and it is also the number
of numbered weeks remaining, current week included. Example: **Sep 28 –
Oct 4 2026 = Week 13, 13 weeks remaining**.
- Current week, its date range, weeks remaining, days left in the week —
  all computed live from your device clock.
- A **countdown ruler**: the entire year as a strip from the top week down to
  Week 1, with today marked.
- **Lookup by date** (calendar week, descending week, range, days remaining)
  and **by week number** (1–52).
- **Year timeline**: all 53 calendar weeks of any selected year, current week
  highlighted, the final week shown unnumbered.

### Investment Series

A reference of the co-op's investment products: name, start/end dates,
interest types, rates, periods and penalty charges — searchable (try
`Classic Diamond`, `17.25%`, or `Annual Backend`), filterable by interest
type and status. Selecting a series opens its **anniversary view**: current
status, the current anniversary period, the next anniversary, days until it,
and the full rates table. Anniversary years follow each product's own months
(October → September for Classic Investment Fund, not January → December).

### Member Grade

All grades with their credit limit, minimum contribution, global limit and
annual limit. A quick "Check member grade" selector shows one grade's four
limits prominently; the full table is searchable and sortable, formatted as
₦2,000,000. Values are preserved **exactly** as recorded in the source
document — including the spelling "Assitant Director" and zero limits —
so the table remains a faithful copy of the paper it came from.

### Data page (edit without code)

Rates change; the Data page lets you change them without touching code:

1. Open **Data** in the navigation.
2. Edit series, dates, rates, periods, penalties, or grade limits in place.
   Add or remove series, grades and interest options.
3. **Save** — changes persist in this browser and appear across every page.

Also on that page: **Export JSON** (backup), **Import JSON** (restore on any
device), and **Reset to defaults** (return to the shipped data). Edits live in
your browser's local storage only — nothing is uploaded anywhere. For
permanent, repo-wide changes, edit the files in `/data` directly (below).

---

## Technology

- [Next.js](https://nextjs.org) 15 (App Router) + React 19
- [TypeScript](https://www.typescriptlang.org) (strict)
- [Tailwind CSS](https://tailwindcss.com) 4
- [date-fns](https://date-fns.org) 4 for date/week primitives
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

All date logic lives in `lib/dates.ts` and is unit-tested in `lib/dates.test.ts`.

- Dates are parsed into **local** calendar days (constructed at noon) so
  timezone shifts can never move a day boundary.
- **Inclusive** count = `differenceInCalendarDays(end, start) + 1`
  (both endpoints counted; same day → 1).
- **Exclusive** count = `differenceInCalendarDays(end, start)`
  (elapsed days; same day → 0).
- Weeks + days divide the exclusive count by 7.
- The calendar span uses date-fns' month difference, which clamps the
  calendar way (Jan 31 + 1 month = Feb 28), then counts leftover days.
- Reverse **add** treats the start date as day 1 (start + 1 day = start),
  so an "add 30 days" span matches a 30-day inclusive range. Reverse
  **subtract** moves back exactly N elapsed days.
- The month breakdown walks the range month by month, clamping each segment
  to the range's edges, and its segments sum exactly to the inclusive total.

## How the descending week system works

All week logic lives in `lib/weeks.ts` (tests in `lib/weeks.test.ts`),
implementing the printed wall calendar exactly:

1. Every year has exactly **53 calendar weeks** — no ISO 52/53 rules.
2. **Week 1** runs from **January 1 to the year's first Sunday** (1–7 days)
   and is numbered **52**, the highest number of the countdown.
3. **Weeks 2–52** are consecutive **Monday → Sunday** weeks. Week 2 begins
   the Monday after the first Sunday, anchored to day-of-year, so the same
   Jan-1 weekday and leap pattern always produces the same week map.
4. **Week 53** is the remainder — the Monday after Week 52's Sunday through
   **December 31** (1–8 days). The printed calendar shows the row but leaves
   its WEEKS cell blank, and so does Daymark: week 53 is **unnumbered**.
5. The right-hand WEEKS column is `53 − calendarWeek` for weeks 1–52:
   Week 1 → 52, Week 40 → 13, Week 52 → 1. Every date maps to a week of its
   **own calendar year** — Jan 1 is always Week 1, Dec 31 is always week 53,
   no spillover across year boundaries.

The result is a countdown where the descending number **is** the numbered
weeks remaining, current week included — and Week 53 is the quiet aftermath
after the count reaches 1.

## Updating the reference data (code route)

The shipped defaults are the single source of truth in version control:

- `data/investmentSeries.ts` — one `InvestmentSeries` object per product with
  its `options` array (interest type, rate, period, penalty). Dates are ISO
  strings. A field absent from the source stays `null` and the UI shows
  "Not specified" — never guess.
- `data/memberGrades.ts` — one `MemberGrade` row per grade.

Change a rate, add a series, add a grade, commit — the UI, search, filters
and anniversary views all pick it up automatically. The in-app Data page
writes overrides on top of these defaults per browser; clearing that
override (Reset) reveals the defaults again.

## Deployment

Any Node host or platform that runs Next.js works:

```bash
npm run build
npm start        # serves on $PORT (default 3000)
```

For Vercel: import the repository and deploy — no configuration needed; all
routes are static. The app is fully client-side for data: the localStorage
override travels with the browser, so set repo defaults in `/data` before
deploying if reference data changes.

---

## Project structure

```
app/                 routes (home, week, investments, grades, data) + SEO files
components/          UI components, one concern each
lib/                 pure calculation engine + tests (no UI imports)
  dates.ts           inclusive/exclusive counts, breakdown, reverse calc
  weeks.ts           descending week system
  investments.ts     anniversary/status engine
  grades.ts          grade search/sort
  format.ts          ₦ formatting, rates, query matching
  dataStore.ts       localStorage override layer (Data page)
data/                shipped reference data (types + values)
```

## Testing

Unit tests cover: same-day and one-day ranges, month/year boundaries,
leap years, February 29, 30/31-day months, 365/366-day years, multi-year
spans, the reverse calculator, the 53-week calendar convention (row-by-row
against the printed sheet, including the Jan 1 → first Sunday opening week
and the unnumbered final week), date↔week round-trips, anniversary windows
for every series (including the wrap-around October → September case and the
open-ended COOP fund), and status transitions around start/maturity dates.

```bash
npm test
```
