// ─── The descending week system ──────────────────────────────────────────────
//
// Daymark counts weeks DOWNWARD, mirroring the printed co-op wall calendar
// (columns M T W T F S SU; left column = calendar week 1–53; right "WEEKS"
// column = the descending number):
//
//   1. Every year has exactly 53 calendar weeks.
//   2. Week 1 runs from January 1 to the year's FIRST SUNDAY (1–7 days long).
//      It opens the countdown at the year's highest number: 52.
//   3. Weeks 2–52 are consecutive Monday→Sunday weeks. Week 2 begins the
//      Monday after the first Sunday; each later week follows in step.
//   4. Week 53 is whatever remains: the Monday after Week 52's Sunday
//      through December 31 (1–8 days). The calendar prints the row but
//      leaves its WEEKS cell blank. It carries no countdown number.
//   5. The right-hand WEEKS column is therefore:
//         descending = 53 − calendarWeek      (weeks 1–52; 53 stays blank)
//      so Week 1 → 52, Week 40 → 13, Week 52 → 1, Week 53 → blank.
//
// Useful consequences:
//   - Every date maps to a week of its OWN calendar year, no ISO spillover.
//     January 1 is always Week 1; December 31 is always Week 53.
//   - The descending number is exactly the number of numbered weeks
//     remaining, current week included. Week 53 is the countdown's aftermath.
//   - Weeks 2–53 are anchored to day-of-year (only Week 1 flexes with the
//     first Sunday), so late-December weeks land on the same dates in every
//     year of the same leap pattern: common years end Week 52 on Dec 27,
//     leap years on Dec 26.
//
// Reference calendar (Jan 1 on a Thursday: the printed sheet, and 2026):
//   Week 1  = Jan 1 – Jan 4    → 52
//   Week 2  = Jan 5 – Jan 11   → 51
//   Week 7  = Feb 9 – Feb 15   → 46
//   Week 15 = Apr 6 – Apr 12   → 38
//   Week 40 = Sep 28 – Oct 4   → 13
//   Week 49 = Nov 30 – Dec 6   → 4
//   Week 52 = Dec 21 – Dec 27  → 1
//   Week 53 = Dec 28 – Dec 31  → (blank)
//
// Pure functions only; unit-tested in lib/weeks.test.ts.

import {
  addDays,
  differenceInCalendarDays,
  isValid,
  parseISO,
} from "date-fns";

/** Calendar week 53: the final partial week, printed without a number. */
export const FINAL_WEEK = 53;

/** Weeks in every calendar year under this convention (never 52). */
export const WEEKS_PER_YEAR = 53;

export interface WeekRef {
  /** The date's own calendar year. Weeks never spill across years. */
  year: number;
  /** Calendar week 1–53 (week 53 is the unnumbered final stub). */
  week: number;
  /** 53 − week for weeks 1–52; null for week 53 (blank WEEKS cell). */
  descending: number | null;
  /** Days in this week: 1–7 for weeks 1–52; 1–8 for week 53. */
  daysInWeek: number;
}

/** Day-of-year (1-based) of a local date. */
function dayOfYear(d: Date): number {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return differenceInCalendarDays(d, jan1) + 1;
}

/** Days in the year (365, or 366 in a leap year). */
function daysInYear(year: number): number {
  return differenceInCalendarDays(new Date(year + 1, 0, 1), new Date(year, 0, 1));
}

/** The year's first Sunday, as a local date (day-of-year 1–7). */
export function firstSundayOfYear(year: number): Date {
  const jan1 = new Date(year, 0, 1, 12);
  return addDays(jan1, (7 - jan1.getDay()) % 7);
}

/** Calendar week (1–53) containing `date`, per the wall-calendar convention. */
export function getWeekForDate(date: Date): WeekRef {
  const year = date.getFullYear();
  const fs = dayOfYear(firstSundayOfYear(year)); // 1..7
  const doy = dayOfYear(date);

  let week: number;
  if (doy <= fs) {
    week = 1;
  } else if (doy >= fs + 1 + 7 * (WEEKS_PER_YEAR - 2)) {
    // The Monday after Week 52's Sunday opens the final stub.
    week = FINAL_WEEK;
  } else {
    week = 2 + Math.floor((doy - fs - 1) / 7);
  }

  const descending = week === FINAL_WEEK ? null : WEEKS_PER_YEAR - week;
  const daysInWeek =
    week === 1 ? fs : week === FINAL_WEEK ? daysInYear(year) - (fs + 7 * (FINAL_WEEK - 2)) : 7;

  return { year, week, descending, daysInWeek };
}

/**
 * Date window for calendar week `week` (1–53) of `year`.
 * Week 1 = Jan 1 → first Sunday; weeks 2–52 = Mon→Sun; week 53 → Dec 31.
 */
export function getWeekRangeByNumber(year: number, week: number): { start: Date; end: Date } {
  if (!Number.isInteger(week) || week < 1 || week > WEEKS_PER_YEAR) {
    throw new RangeError(`Calendar week ${week} is outside 1–${WEEKS_PER_YEAR} for ${year}.`);
  }
  if (week === 1) {
    return { start: new Date(year, 0, 1, 12), end: firstSundayOfYear(year) };
  }
  const fs = dayOfYear(firstSundayOfYear(year));
  const start = addDays(new Date(year, 0, 1, 12), fs + 7 * (week - 2));
  const end = week === FINAL_WEEK ? new Date(year, 11, 31, 12) : addDays(start, 6);
  return { start, end };
}

/** Window of the week containing `date`. */
export function getWeekDateRange(date: Date): { start: Date; end: Date } {
  return getWeekRangeByNumber(date.getFullYear(), getWeekForDate(date).week);
}

function refWithRange(year: number, week: number): WeekRef & { start: Date; end: Date } {
  const { start, end } = getWeekRangeByNumber(year, week);
  const ref = getWeekForDate(start);
  return { ...ref, start, end };
}

/** The year's opening week: Jan 1 → first Sunday, numbered 52. */
export function getFirstWeekOfYear(year: number): WeekRef & { start: Date; end: Date } {
  return refWithRange(year, 1);
}

/** The year's last NUMBERED week: calendar week 52, descending 1. */
export function getLastWeekOfYear(year: number): WeekRef & { start: Date; end: Date } {
  return refWithRange(year, 52);
}

/** The unnumbered final partial week (calendar week 53, through Dec 31). */
export function getFinalWeekOfYear(year: number): WeekRef & { start: Date; end: Date } {
  return refWithRange(year, FINAL_WEEK);
}

/** Every year has exactly 53 calendar weeks under this convention. */
export function getWeeksInYear(_year: number): number {
  return WEEKS_PER_YEAR;
}

export interface TimelineWeek extends WeekRef {
  /** First day of the week. */
  start: Date;
  /** Last day of the week (Dec 31 for week 53). */
  end: Date;
}

/** All 53 calendar weeks of `year` in calendar order, which is countdown order: 52, 51, ... 1, then the unnumbered stub. */
export function getYearTimeline(year: number): TimelineWeek[] {
  return Array.from({ length: WEEKS_PER_YEAR }, (_, i) => {
    const { start, end } = getWeekRangeByNumber(year, i + 1);
    const ref = getWeekForDate(start);
    return { ...ref, start, end };
  });
}

/**
 * Look up a countdown week of `year` by its descending number (1–52).
 * Week 13 of 2026 → Sep 28 – Oct 4. Week 53 is unnumbered and cannot be
 * looked up here; use getFinalWeekOfYear.
 */
export function getWeekByDescendingNumber(
  year: number,
  descending: number,
): WeekRef & { start: Date; end: Date } {
  if (
    !Number.isInteger(descending) ||
    descending < 1 ||
    descending > WEEKS_PER_YEAR - 1
  ) {
    throw new RangeError(`Week ${descending} is outside 1–${WEEKS_PER_YEAR - 1} for ${year}.`);
  }
  return refWithRange(year, WEEKS_PER_YEAR - descending);
}

/**
 * Days left in the week after `date` (today not counted), matching the
 * spec example: Tue Sep 29 2026 in the Sep 28 – Oct 4 week → 5 (Wed–Sun).
 */
export function daysRemainingInWeek(date: Date): number {
  const { end } = getWeekDateRange(date);
  return differenceInCalendarDays(end, date);
}

/**
 * Numbered weeks remaining in the year, current week included, i.e. the
 * descending number. Week 53 has no number; only itself remains, so this
 * returns 1 there (the UI shows the "final week" state instead).
 */
export function weeksRemainingInYear(date: Date): number {
  const w = getWeekForDate(date);
  return w.descending ?? 1;
}

/** ISO "YYYY-MM-DD" for a Date, using local calendar fields. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Parse "YYYY-MM-DD" (or any parseable date) at local noon for safe math. */
export function parseLocalISO(iso: string): Date {
  const d = parseISO(iso);
  if (!isValid(d)) throw new RangeError(`Invalid date: "${iso}"`);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}
