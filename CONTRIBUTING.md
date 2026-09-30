# Contributing to Daymark

Thanks for helping. This guide covers the setup, the rules the codebase
follows, and how to propose changes.

## Getting set up

You need Node.js 20 or newer and npm.

```bash
git clone https://github.com/MitemsHub/daymark.git
cd daymark
npm install
npm run dev        # http://localhost:3000
```

Before you open a pull request, run all three:

```bash
npm test           # 61 unit tests
npm run typecheck  # strict TypeScript, no errors allowed
npm run build      # production build must pass
```

If you plan to touch the GitHub Pages build, you can also run
`npm run build:pages` and check the `out/` folder.

## How to propose a change

1. Open an issue first for anything bigger than a typo fix. Use one of the
   templates (bug report or feature request) so it starts with the right
   details.
2. Fork the repo and create a branch from `main`. Name it after the issue,
   for example `fix-week53-label` or `issue-12-lookup-focus`.
3. Make the change, add or update tests when behavior changes, and run the
   three checks above.
4. Open a pull request that references the issue. Describe what changed and
   why in plain sentences.

Small fixes (typos, broken links, docs) can go straight to a pull request
without an issue.

## The rules this codebase follows

**Keep the engine pure.** All calculation logic lives in `lib/` and imports
nothing from `app/` or `components/`. UI components call the engine but
never compute dates themselves. If you add engine behavior, add unit tests
in the matching `lib/*.test.ts` file.

**Dates are built at noon.** The engine constructs dates at 12:00 local
time so timezone shifts can never move a day boundary. Keep that pattern
in new code and tests.

**The week system is fixed by the printed calendar.** Every year has 53
calendar weeks: week 1 runs January 1 to the first Sunday (numbered 52),
weeks 2 to 52 are Monday-Sunday weeks with descending number 53 minus the
week, and week 53 is the unnumbered final partial week. Do not replace this
with ISO week logic. The tests pin the convention row by row.

**Reference data is a faithful copy.** `data/` mirrors the source paper,
including oddities: the "Assitant Director" spelling, zero limits, and the
COOP fund with no end date. Do not "fix" the source. A missing value stays
`null` and the UI shows "Not specified".

**Respect the base path.** GitHub Pages serves the app from `/daymark`. Any
absolute link in JSX must go through `process.env.NEXT_PUBLIC_BASE_PATH`
or Next's `Link` component. A hardcoded `href="/data"` works locally and
breaks on the live site; the audit that caught this exists for a reason.

**No new dependencies without discussion.** The runtime is Next.js, React
and date-fns, nothing else. Open an issue describing the need before adding
a package.

**Write like a person.** In UI copy, comments, commit messages and docs:
no em dashes (use commas, colons or new sentences), sentence-case headings,
short sentences, no "seamless", "robust" or "leverage". See the README for
the voice to match.

**Keep motion accessible.** The CSS motion layer is disabled under
`prefers-reduced-motion`. Any new animation must live in `app/globals.css`
and be covered by that override.

## Reporting bugs

The bug template asks for the page, what you expected, what happened, and
your browser. Screenshots help a lot. If the bug is a wrong number, include
the exact dates or series you entered so a failing test can be written
from your report.

## Suggesting features

Explain the job you need done, not only the UI you imagine. Daymark is a
calculator and reference tool, so the best feature requests start with a
real calculation or lookup that is currently awkward.

## Updating reference data

Two routes, both legitimate:

- In the app: the Data page edits per browser, with Export and Import for
  moving changes between devices.
- In code: edit `data/investmentSeries.ts` or `data/memberGrades.ts` and
  commit. This is the route for changes every user should see. Follow the
  "faithful copy" rule above.

## Commit style

Write what changed and why in one or two sentences, plain voice, no ticket
noise. Example: "Week ruler centers on the current week without locking
scroll".
