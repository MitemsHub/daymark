// ─── Date arithmetic ─────────────────────────────────────────────────────────
// Pure date calculation helpers. No React, no browser APIs: everything here
// is deterministic and unit-tested in lib/dates.test.ts.
//
// Conventions used across the app:
//  • "Inclusive" day counts count BOTH the start and end dates (same day = 1).
//  • "Exclusive" day counts are the elapsed difference (same date = 0).
//  • Dates are local calendar days. Helpers that accept ISO strings build the
//    Date at LOCAL noon so timezone shifts can never move a calendar day.

import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInMonths,
  endOfMonth,
  isValid,
  max,
  min,
  parseISO,
} from "date-fns";

/** Parse an ISO "YYYY-MM-DD" string into a local calendar Date (at noon). */
export function parseISODate(iso: string): Date {
  const d = parseISO(iso);
  if (!isValid(d)) throw new RangeError(`Invalid date: "${iso}"`);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

/** Format an ISO string or Date as "16 April 2026". */
export function formatLong(date: string | Date): string {
  const d = typeof date === "string" ? parseISODate(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Format an ISO string or Date as "Wed 16 Apr 2026". */
export function formatShort(date: string | Date): string {
  const d = typeof date === "string" ? parseISODate(date) : date;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Today's date as an ISO "YYYY-MM-DD" string, in the user's local time. */
export function todayISO(): string {
  const n = new Date();
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const dd = String(n.getDate()).padStart(2, "0");
  return `${n.getFullYear()}-${mm}-${dd}`;
}

/**
 * Validate a date range for the calculator. Returns a friendly error message
 * (for direct display) or null when the range is usable.
 */
export function validateRange(startISO: string, endISO: string): string | null {
  if (!startISO || !endISO) return "Pick both a start and an end date.";
  let s: Date;
  let e: Date;
  try {
    s = parseISODate(startISO);
    e = parseISODate(endISO);
  } catch {
    return "One of those dates doesn't exist on the calendar. Check day and month.";
  }
  if (e.getTime() === s.getTime()) {
    return "Start and end are the same day. The + Today count is 1 and the − Today count is 0. Pick a later end date to see a full breakdown.";
  }
  if (e < s) return "The end date is before the start date. Swap them or pick a later end date.";
  return null;
}

/** Total days counting BOTH endpoints. Same day → 1. */
export function calculateInclusiveDays(startISO: string, endISO: string): number {
  return differenceInCalendarDays(parseISODate(endISO), parseISODate(startISO)) + 1;
}

/** Elapsed days between the two dates. Same day → 0. */
export function calculateExclusiveDays(startISO: string, endISO: string): number {
  return differenceInCalendarDays(parseISODate(endISO), parseISODate(startISO));
}

export interface DateDifference {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

/**
 * Calendar difference as whole years + months + days.
 * Uses date-fns' clamping month difference (Jan 31 + 1 month = Feb 28), then
 * counts remaining days from the anchored date: Apr 16 → Sep 29 2026 is
 * 5 months 13 days.
 */
export function calculateDateDifference(startISO: string, endISO: string): DateDifference {
  const s = parseISODate(startISO);
  const e = parseISODate(endISO);
  const totalMonths = differenceInMonths(e, s);
  const anchor = addMonths(s, totalMonths);
  const days = differenceInCalendarDays(e, anchor);
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days,
    totalDays: calculateInclusiveDays(startISO, endISO),
  };
}

export interface ReverseResult {
  /** The resulting date, ISO "YYYY-MM-DD". */
  resultISO: string;
  /** Result as a Date (local noon). */
  result: Date;
  /** True when days were subtracted. */
  isSubtract: boolean;
}

/**
 * Reverse calculation. Convention, stated in the UI:
 *  • Add: moves (days − 1) past the start → the start date itself is day 1 of
 *    the count, so start + 1 day = start. (Inclusive span of `days` days.)
 *  • Subtract: moves back exactly `days` elapsed days, and the result is NOT
 *    itself counted (exclusive convention).
 */
export function reverseCalculate(startISO: string, days: number, mode: "add" | "subtract"): ReverseResult {
  const s = parseISODate(startISO);
  const n = Math.trunc(days);
  const shifted = mode === "add" ? addDays(s, n - 1) : addDays(s, -n);
  const resultISO = `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(
    shifted.getDate(),
  ).padStart(2, "0")}`;
  return { resultISO, result: shifted, isSubtract: mode === "subtract" };
}

export interface MonthSegment {
  /** Calendar month label, e.g. "April". */
  monthName: string;
  year: number;
  /** First day of the range within this month, ISO. */
  fromISO: string;
  /** Last day of the range within this month, ISO. */
  toISO: string;
  /** Inclusive day count within this month. */
  days: number;
}

/** Split a range into per-month segments; each counts inclusively. */
export function getMonthBreakdown(startISO: string, endISO: string): MonthSegment[] {
  const s = parseISODate(startISO);
  const e = parseISODate(endISO);
  if (e < s) return [];

  const segments: MonthSegment[] = [];
  let cursor = s;
  while (cursor <= e) {
    const monthEnd = endOfMonth(cursor);
    const segEnd = min([monthEnd, e]);
    const fromISO = toISODate(cursor);
    const toISODateStr = toISODate(segEnd);
    segments.push({
      monthName: cursor.toLocaleDateString("en-GB", { month: "long" }),
      year: cursor.getFullYear(),
      fromISO,
      toISO: toISODateStr,
      days: calculateInclusiveDays(fromISO, toISODateStr),
    });
    cursor = addDays(segEnd, 1);
  }
  return segments;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
