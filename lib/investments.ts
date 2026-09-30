// ─── Investment series logic ─────────────────────────────────────────────────
// Anniversary / status engine. This is a reference tool, not a returns
// calculator: nothing here computes money, only calendar facts.
//
// A series' year runs anniversaryStartMonth → anniversaryEndMonth (e.g.
// October → September for Classic Investment Fund). The engine derives every
// anniversary from that window, never from January → December.
//
// Anniversary numbering: anniversary window 1 is the first window that starts
// on or after the series' start date (for a series starting mid-window, that
// is the NEXT window). During the initial partial window the number is null —
// the UI shows "First year".

import { differenceInCalendarDays } from "date-fns";
import type { InvestmentSeries } from "@/data/investmentSeries";

export interface AnniversaryInfo {
  /** This anniversary window's first day (e.g. 1 Oct 2025). */
  currentStart: Date;
  /** This anniversary window's last day (e.g. 30 Sep 2026). */
  currentEnd: Date;
  /** The next anniversary's first day = currentEnd + 1 day. */
  nextStart: Date;
  /** Whole days from today (inclusive) until `nextStart`. */
  daysUntilNext: number;
  /** 1-based anniversary window containing today, or null during the first partial window. */
  anniversaryNumber: number | null;
}

function seriesStartDate(series: InvestmentSeries): Date {
  const [y, m, d] = series.startDate.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

function seriesEndDate(series: InvestmentSeries): Date {
  const [y, m, d] = series.endDate!.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

/** First day of the anniversary window whose start calendar-year is `year`. */
export function startOfAnniversaryWindow(series: InvestmentSeries, year: number): Date {
  return new Date(year, series.anniversaryStartMonth - 1, 1, 12);
}

/** Last day of the anniversary window starting in calendar-year `year`. */
export function endOfAnniversaryWindow(series: InvestmentSeries, year: number): Date {
  const endMonth = series.anniversaryEndMonth;
  // Wrap-around windows (e.g. Oct → Sep) end in the following calendar year.
  const endYear = endMonth < series.anniversaryStartMonth ? year + 1 : year;
  const lastDay = new Date(endYear, endMonth, 0).getDate();
  return new Date(endYear, endMonth - 1, lastDay, 12);
}

/** Calendar year in which the anniversary window containing `date` began. */
function windowStartYearFor(series: InvestmentSeries, date: Date): number {
  let year = date.getFullYear();
  if (series.anniversaryStartMonth > date.getMonth() + 1) year -= 1;
  return year;
}

/**
 * The anniversary window containing `today`, plus countdown facts.
 */
export function getCurrentAnniversary(series: InvestmentSeries, today: Date): AnniversaryInfo {
  const currentStart = startOfAnniversaryWindow(series, windowStartYearFor(series, today));
  const currentEnd = endOfAnniversaryWindow(series, windowStartYearFor(series, today));
  const nextStart = new Date(currentEnd.getFullYear(), currentEnd.getMonth(), currentEnd.getDate() + 1, 12);
  const daysUntilNext = differenceInCalendarDays(nextStart, today);
  return {
    currentStart,
    currentEnd,
    nextStart,
    daysUntilNext,
    anniversaryNumber: computeAnniversaryNumber(series, today),
  };
}

/**
 * Which anniversary window contains `today` (1-based), or null when `today`
 * falls inside the series' initial partial window (series starting mid-window)
 * or before the series started.
 */
export function computeAnniversaryNumber(series: InvestmentSeries, today: Date): number | null {
  const start = seriesStartDate(series);
  if (today < start) return null;

  const sm = series.anniversaryStartMonth;
  let firstWindowYear = start.getFullYear();
  if (sm > start.getMonth() + 1) firstWindowYear += 1; // series began mid-window
  const firstFullStart = new Date(firstWindowYear, sm - 1, 1, 12);
  if (today < firstFullStart) return null;

  return windowStartYearFor(series, today) - firstWindowYear + 1;
}

/** "Active", "Expired" or "Upcoming", relative to `today`. */
export function getInvestmentStatus(series: InvestmentSeries, today: Date): "Upcoming" | "Active" | "Expired" {
  const start = seriesStartDate(series);
  if (today < start) return "Upcoming";
  if (series.endDate === null) return "Active"; // open-ended in the source
  return today > seriesEndDate(series) ? "Expired" : "Active";
}

/** The first day of the next anniversary window strictly after `today`. */
export function getNextAnniversary(series: InvestmentSeries, today: Date): Date {
  return getCurrentAnniversary(series, today).nextStart;
}

export { differenceInCalendarDays };
