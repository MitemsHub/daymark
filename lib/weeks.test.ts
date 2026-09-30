import { describe, expect, it } from "vitest";
import {
  FINAL_WEEK,
  WEEKS_PER_YEAR,
  daysRemainingInWeek,
  firstSundayOfYear,
  getFinalWeekOfYear,
  getFirstWeekOfYear,
  getLastWeekOfYear,
  getWeekByDescendingNumber,
  getWeekDateRange,
  getWeekForDate,
  getWeeksInYear,
  getYearTimeline,
  toISODate,
  weeksRemainingInYear,
} from "./weeks";
import { parseISODate } from "./dates";

const d = (iso: string) => parseISODate(iso);

describe("the calendar convention itself", () => {
  it("gives every year exactly 53 calendar weeks", () => {
    for (const year of [2020, 2021, 2024, 2025, 2026, 2027, 2028, 2100]) {
      expect(getWeeksInYear(year)).toBe(53);
    }
  });

  it("week 1 runs Jan 1 → first Sunday and opens at Week 52", () => {
    // 2026: Jan 1 is a Thursday → first Sunday is Jan 4 (matches the sheet).
    expect(toISODate(firstSundayOfYear(2026))).toBe("2026-01-04");
    expect(getFirstWeekOfYear(2026).descending).toBe(52);
    expect(getWeeksInYear(2026)).toBe(53);
    expect(toISODate(getFirstWeekOfYear(2026).start)).toBe("2026-01-01");
    expect(toISODate(getFirstWeekOfYear(2026).end)).toBe("2026-01-04");
  });

  it("week 1 is a single day when Jan 1 is a Sunday (e.g. 2023)", () => {
    expect(toISODate(firstSundayOfYear(2023))).toBe("2023-01-01");
    expect(toISODate(getFirstWeekOfYear(2023).end)).toBe("2023-01-01");
    expect(getFirstWeekOfYear(2023).daysInWeek).toBe(1);
  });

  it("weeks 2–52 are Mon→Sun; week 2 starts the Monday after the first Sunday", () => {
    expect(toISODate(getWeekByDescendingNumber(2026, 51).start)).toBe("2026-01-05");
    expect(toISODate(getWeekByDescendingNumber(2026, 51).end)).toBe("2026-01-11");
  });

  it("week 53 is the final partial week with NO descending number", () => {
    const w53 = getFinalWeekOfYear(2026);
    expect(w53.week).toBe(FINAL_WEEK);
    expect(w53.descending).toBeNull();
    expect(toISODate(w53.start)).toBe("2026-12-28");
    expect(toISODate(w53.end)).toBe("2026-12-31");
  });
});

describe("getWeekForDate: spot checks against the printed sheet (Jan 1 Thu)", () => {
  it("2026 matches the wall calendar row for row", () => {
    const cases: [string, number, number | null][] = [
      ["2026-01-01", 1, 52],
      ["2026-01-04", 1, 52],
      ["2026-01-05", 2, 51],
      ["2026-01-11", 2, 51],
      ["2026-02-09", 7, 46],
      ["2026-02-15", 7, 46],
      ["2026-04-06", 15, 38],
      ["2026-04-12", 15, 38],
      ["2026-09-28", 40, 13],
      ["2026-09-30", 40, 13],
      ["2026-10-04", 40, 13],
      ["2026-11-02", 45, 8],
      ["2026-11-08", 45, 8],
      ["2026-11-30", 49, 4],
      ["2026-12-06", 49, 4],
      ["2026-12-21", 52, 1],
      ["2026-12-27", 52, 1],
      ["2026-12-28", 53, null],
      ["2026-12-31", 53, null],
    ];
    for (const [iso, week, descending] of cases) {
      const w = getWeekForDate(d(iso));
      expect(w.week, iso).toBe(week);
      expect(w.descending, iso).toBe(descending);
      expect(w.year, iso).toBe(2026);
    }
  });

  it("the printed sheet's leap-year year (Jan 1 Thu, leap) matches too", () => {
    // 2004 and 2032 are leap years with Jan 1 on a Thursday, like the sheet.
    for (const year of [2004, 2032]) {
      expect(getWeekForDate(d(`${year}-01-01`)).descending).toBe(52);
      expect(getWeekForDate(d(`${year}-02-09`)).descending).toBe(46);
      expect(getWeekForDate(d(`${year}-09-28`)).descending).toBe(13);
      expect(getWeekForDate(d(`${year}-12-26`)).descending).toBe(1);
      expect(getWeekForDate(d(`${year}-12-27`)).descending).toBeNull(); // week 53
    }
  });

  it("Jan 1 is always Week 1→52 and Dec 31 always Week 53, in every year", () => {
    for (const year of [2020, 2021, 2023, 2024, 2025, 2026, 2027, 2028, 2100]) {
      expect(getWeekForDate(d(`${year}-01-01`))).toMatchObject({ week: 1, descending: 52, year });
      expect(getWeekForDate(d(`${year}-12-31`))).toMatchObject({ week: FINAL_WEEK, descending: null });
    }
  });

  it("every date maps into its own year with no gaps (366-day sweep)", () => {
    for (const year of [2020, 2021, 2024, 2025, 2026, 2027]) {
      let lastWeek = 0;
      for (let day = 0; day < 367; day++) {
        const date = new Date(year, 0, 1 + day, 12);
        if (date.getFullYear() !== year) break;
        const w = getWeekForDate(date);
        expect(w.week).toBeGreaterThanOrEqual(lastWeek);
        lastWeek = w.week;
        expect(w.week).toBeLessThanOrEqual(53);
        expect(w.descending === null ? 53 : w.descending).toBeGreaterThanOrEqual(1);
      }
      expect(lastWeek).toBe(53);
      expect(getWeekForDate(new Date(year, 11, 31, 12)).week).toBe(53);
    }
  });
});

describe("getWeekByDescendingNumber", () => {
  it("2026 week 13 is Sep 28 – Oct 4 (the original spec example)", () => {
    const w = getWeekByDescendingNumber(2026, 13);
    expect(toISODate(w.start)).toBe("2026-09-28");
    expect(toISODate(w.end)).toBe("2026-10-04");
    expect(w.week).toBe(40);
  });

  it("round-trips through every numbered week of several years", () => {
    for (const year of [2024, 2025, 2026, 2027]) {
      for (let desc = 1; desc <= 52; desc++) {
        const w = getWeekByDescendingNumber(year, desc);
        expect(w.descending).toBe(desc);
        // Round-trip: the week containing its Monday reports the same number.
        const back = getWeekForDate(addWeekMonday(year, desc));
        expect(back.descending).toBe(desc);
      }
    }
  });

  it("rejects 53 and out-of-range numbers", () => {
    expect(() => getWeekByDescendingNumber(2026, 53)).toThrow(/outside/);
    expect(() => getWeekByDescendingNumber(2026, 0)).toThrow(/outside/);
    expect(() => getWeekByDescendingNumber(2026, 12.5)).toThrow(/outside/);
  });
});

describe("getWeekDateRange / daysRemainingInWeek", () => {
  it("Tue Sep 29 2026 → 5 (Wed–Sun, today excluded)", () => {
    expect(daysRemainingInWeek(d("2026-09-29"))).toBe(5);
  });

  it("Sunday ends the week → 0; Monday starts a new one → 6", () => {
    expect(daysRemainingInWeek(d("2026-10-04"))).toBe(0);
    expect(daysRemainingInWeek(d("2026-10-05"))).toBe(6);
  });

  it("in week 1, days remaining count to the first Sunday", () => {
    // Jan 1 2026 is a Thursday; Wed Jan 1 → 3 (Fri Sat Sun)... Jan 2 Fri → 2.
    expect(daysRemainingInWeek(d("2026-01-01"))).toBe(3);
    expect(daysRemainingInWeek(d("2026-01-02"))).toBe(2);
    expect(daysRemainingInWeek(d("2026-01-04"))).toBe(0);
  });

  it("in week 53, remaining days run to Dec 31", () => {
    expect(daysRemainingInWeek(d("2026-12-28"))).toBe(3);
    expect(daysRemainingInWeek(d("2026-12-31"))).toBe(0);
  });
});

describe("weeksRemainingInYear", () => {
  it("Sep 29 2026 → 13 (Week 13; thirteen numbered weeks incl. current)", () => {
    expect(weeksRemainingInYear(d("2026-09-29"))).toBe(13);
  });

  it("Jan 1 → 52; Dec 27 2026 (last day of Week 1) → 1", () => {
    expect(weeksRemainingInYear(d("2026-01-01"))).toBe(52);
    expect(weeksRemainingInYear(d("2026-12-27"))).toBe(1);
  });

  it("week 53 days still carry the last numbered week (1)", () => {
    expect(weeksRemainingWeek53(d("2026-12-31"))).toBe(1);
  });
});

describe("getYearTimeline", () => {
  it("2026: 53 entries, opens Jan 1 at 52, Week 1 (desc) ends Dec 27, stub ends Dec 31", () => {
    const tl = getYearTimeline(2026);
    expect(tl).toHaveLength(53);
    expect(tl[0].week).toBe(1);
    expect(tl[0].descending).toBe(52);
    expect(toISODate(tl[0].start)).toBe("2026-01-01");
    expect(toISODate(tl[52].start)).toBe("2026-12-28");
    expect(tl[52].descending).toBeNull();
    const w52 = tl.find((w) => w.descending === 1)!;
    expect(toISODate(w52.start)).toBe("2026-12-21");
    expect(toISODate(w52.end)).toBe("2026-12-27");
  });

  it("timeline weeks are contiguous and cover the whole year", () => {
    for (const year of [2024, 2025, 2026, 2027]) {
      const tl = getYearTimeline(year);
      expect(tl).toHaveLength(53);
      expect(toISODate(tl[0].start)).toBe(`${year}-01-01`);
      expect(toISODate(tl[52].end)).toBe(`${year}-12-31`);
      for (let i = 1; i < tl.length; i++) {
        const prev = tl[i - 1];
        const cur = tl[i];
        const gap = (cur.start.getTime() - prev.end.getTime()) / 86400000;
        expect(gap).toBe(1); // cur.start is noon the day after prev.end
      }
      // Weeks 2..52 are exactly 7 days; week 1 is 1–7; week 53 is 1–8.
      expect(tl[0].daysInWeek).toBeLessThanOrEqual(7);
      for (let i = 1; i <= 51; i++) {
        const span = (tl[i].end.getTime() - tl[i].start.getTime()) / 86400000;
        expect(span).toBe(6);
      }
      // Week 53 never runs past Dec 31.
      expect(tl[52].daysInWeek).toBeLessThanOrEqual(8);
    }
  });
});

// Helpers for the tests above.
function addWeekMonday(year: number, descending: number): Date {
  return getWeekByDescendingNumber(year, descending).start;
}

function weeksRemainingWeek53(date: Date): number {
  return weeksRemainingInYear(date);
}
