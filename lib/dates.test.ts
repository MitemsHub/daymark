import { describe, expect, it } from "vitest";
import {
  calculateDateDifference,
  calculateExclusiveDays,
  calculateInclusiveDays,
  formatLong,
  getMonthBreakdown,
  parseISODate,
  reverseCalculate,
  todayISO,
  validateRange,
  formatDmy,
  parseDmy,
} from "./dates";

describe("inclusive / exclusive day counts", () => {
  it("same day", () => {
    expect(calculateInclusiveDays("2026-04-16", "2026-04-16")).toBe(1);
    expect(calculateExclusiveDays("2026-04-16", "2026-04-16")).toBe(0);
  });

  it("one-day difference", () => {
    expect(calculateInclusiveDays("2026-04-16", "2026-04-17")).toBe(2);
    expect(calculateExclusiveDays("2026-04-16", "2026-04-17")).toBe(1);
  });

  it("spec example Apr 16 to Sep 29 2026", () => {
    expect(calculateInclusiveDays("2026-04-16", "2026-09-29")).toBe(167);
    expect(calculateExclusiveDays("2026-04-16", "2026-09-29")).toBe(166);
  });

  it("31-day month", () => {
    expect(calculateInclusiveDays("2026-01-01", "2026-01-31")).toBe(31);
    expect(calculateExclusiveDays("2026-01-01", "2026-01-31")).toBe(30);
  });

  it("30-day month", () => {
    expect(calculateInclusiveDays("2026-04-01", "2026-04-30")).toBe(30);
    expect(calculateExclusiveDays("2026-04-01", "2026-04-30")).toBe(29);
  });

  it("February common year", () => {
    expect(calculateInclusiveDays("2026-02-01", "2026-02-28")).toBe(28);
  });

  it("February 29 leap year", () => {
    expect(calculateInclusiveDays("2028-02-01", "2028-02-29")).toBe(29);
    expect(calculateExclusiveDays("2028-02-28", "2028-02-29")).toBe(1);
  });

  it("month boundary", () => {
    expect(calculateInclusiveDays("2026-01-31", "2026-02-01")).toBe(2);
  });

  it("year boundary", () => {
    expect(calculateInclusiveDays("2026-12-31", "2027-01-01")).toBe(2);
  });

  it("365-day common year", () => {
    expect(calculateInclusiveDays("2026-01-01", "2026-12-31")).toBe(365);
  });

  it("366-day leap year", () => {
    expect(calculateInclusiveDays("2028-01-01", "2028-12-31")).toBe(366);
  });

  it("multi-year span", () => {
    expect(calculateInclusiveDays("2024-01-01", "2026-12-31")).toBe(1096);
  });
});

describe("calculateDateDifference", () => {
  it("anchors on the start day-of-month", () => {
    const diff = calculateDateDifference("2026-04-16", "2026-09-29");
    expect(diff.years).toBe(0);
    expect(diff.months).toBe(5);
    expect(diff.days).toBe(13);
  });

  it("handles month-end clamping the calendar way", () => {
    const diff = calculateDateDifference("2026-01-31", "2026-03-01");
    expect(diff.years).toBe(0);
    expect(diff.months).toBe(1);
    expect(diff.days).toBe(1);
  });

  it("multi-year: 2 years 2 months 1 day", () => {
    const diff = calculateDateDifference("2024-01-01", "2026-03-02");
    expect(diff.years).toBe(2);
    expect(diff.months).toBe(2);
    expect(diff.days).toBe(1);
  });
});

describe("getMonthBreakdown", () => {
  it("matches the spec example exactly", () => {
    const segs = getMonthBreakdown("2026-04-16", "2026-09-29");
    expect(segs.map((s) => `${s.monthName} ${s.days}`)).toEqual([
      "April 15",
      "May 31",
      "June 30",
      "July 31",
      "August 31",
      "September 29",
    ]);
    expect(segs.reduce((acc, s) => acc + s.days, 0)).toBe(167);
  });

  it("single-month range", () => {
    const segs = getMonthBreakdown("2026-05-01", "2026-05-31");
    expect(segs).toHaveLength(1);
    expect(segs[0].days).toBe(31);
  });

  it("spans year boundary", () => {
    const segs = getMonthBreakdown("2026-11-15", "2027-02-14");
    expect(segs.map((s) => s.monthName)).toEqual(["November", "December", "January", "February"]);
    expect(segs.reduce((a, s) => a + s.days, 0)).toBe(92);
  });
});

describe("reverseCalculate", () => {
  it("add 1 day lands on start (inclusive counting)", () => {
    expect(reverseCalculate("2026-04-16", 1, "add").resultISO).toBe("2026-04-16");
  });

  it("add 30 days", () => {
    expect(reverseCalculate("2026-04-16", 30, "add").resultISO).toBe("2026-05-15");
  });

  it("subtract 16 days", () => {
    expect(reverseCalculate("2026-04-16", 16, "subtract").resultISO).toBe("2026-03-31");
  });

  it("leap-year arithmetic", () => {
    expect(reverseCalculate("2028-03-01", 29, "subtract").resultISO).toBe("2028-02-01");
  });
});

describe("validateRange", () => {
  it("flags missing inputs", () => {
    expect(validateRange("", "2026-01-02")).toMatch(/both/i);
  });

  it("flags same-day range", () => {
    expect(validateRange("2026-04-16", "2026-04-16")).toMatch(/same day/i);
  });

  it("flags reversed range", () => {
    expect(validateRange("2026-09-29", "2026-04-16")).toMatch(/before/i);
  });

  it("accepts a valid range", () => {
    expect(validateRange("2026-04-16", "2026-09-29")).toBeNull();
  });
});

describe("parse & format", () => {
  it("parses at local noon (timezone-safe)", () => {
    const d = parseISODate("2026-04-16");
    expect(d.getHours()).toBe(12);
  });

  it("rejects impossible dates", () => {
    expect(() => parseISODate("2026-02-30")).toThrow(/Invalid date/);
  });

  it("formats 2026-04-16 as '16 April 2026'", () => {
    expect(formatLong("2026-04-16")).toBe("16 April 2026");
  });

  it("todayISO returns local YYYY-MM-DD", () => {
    const iso = todayISO();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number(iso.slice(0, 4))).toBe(new Date().getFullYear());
  });
});

describe("dd/mm/yyyy helpers", () => {
  it("formats ISO as day-first", () => {
    expect(formatDmy("2026-10-01")).toBe("01/10/2026");
    expect(formatDmy("")).toBe("");
  });

  it("parses day-first text into ISO", () => {
    expect(parseDmy("01/10/2026")).toBe("2026-10-01");
    expect(parseDmy("1/10/26")).toBe("2026-10-01");
    expect(parseDmy("16-04-2026")).toBe("2026-04-16");
  });

  it("rejects impossible dates and foreign shapes", () => {
    expect(parseDmy("13/13/2026")).toBeNull(); // month 13
    expect(parseDmy("31/02/2026")).toBeNull(); // no Feb 31
    expect(parseDmy("2026-10-01")).toBeNull(); // not day-first
    expect(parseDmy("hello")).toBeNull();
  });
});
