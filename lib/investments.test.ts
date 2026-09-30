import { describe, expect, it } from "vitest";
import {
  computeAnniversaryNumber,
  endOfAnniversaryWindow,
  getCurrentAnniversary,
  getNextAnniversary,
  getInvestmentStatus,
  startOfAnniversaryWindow,
} from "./investments";
import { investmentSeries } from "@/data/investmentSeries";
import { memberGrades } from "@/data/memberGrades";
import { toISODate } from "./weeks";

const diamond = investmentSeries.find((s) => s.id === "classic-diamond")!;
const fund = investmentSeries.find((s) => s.id === "classic-investment-fund")!;
const coop = investmentSeries.find((s) => s.id === "coop-tripple-plan-2023")!;
const premium = investmentSeries.find((s) => s.id === "premium-classic")!;

describe("getInvestmentStatus", () => {
  it("Diamond is Active today (2026-09-30)", () => {
    expect(getInvestmentStatus(diamond, new Date(2026, 8, 30, 12))).toBe("Active");
  });

  it("PREMIUM CLASSIC is Upcoming until 1 Aug 2026", () => {
    expect(getInvestmentStatus(premium, new Date(2026, 6, 31, 12))).toBe("Upcoming");
    expect(getInvestmentStatus(premium, new Date(2026, 7, 1, 12))).toBe("Active");
  });

  it("COOP Tripple Plan (open-ended) never expires", () => {
    expect(getInvestmentStatus(coop, new Date(2035, 0, 1, 12))).toBe("Active");
  });

  it("Diamond expires after 31 Jan 2028", () => {
    expect(getInvestmentStatus(diamond, new Date(2028, 1, 1, 12))).toBe("Expired");
  });
});

describe("anniversary windows follow each series' own months", () => {
  it("Classic Investment Fund: Oct→Sep window containing late Sep 2026", () => {
    const today = new Date(2026, 8, 29, 12);
    const info = getCurrentAnniversary(fund, today);
    expect(toISODate(info.currentStart)).toBe("2025-10-01");
    expect(toISODate(info.currentEnd)).toBe("2026-09-30");
    expect(toISODate(info.nextStart)).toBe("2026-10-01");
    expect(info.daysUntilNext).toBe(2);
    expect(info.anniversaryNumber).toBe(1);
  });

  it("Classic Diamond: Feb→Jan window containing Sep 2026", () => {
    const info = getCurrentAnniversary(diamond, new Date(2026, 8, 29, 12));
    expect(toISODate(info.currentStart)).toBe("2026-02-01");
    expect(toISODate(info.currentEnd)).toBe("2027-01-31");
    expect(info.anniversaryNumber).toBe(3);
  });

  it("COOP Tripple Plan: Jan→Dec window, clamped start handled", () => {
    const info = getCurrentAnniversary(coop, new Date(2026, 8, 29, 12));
    expect(toISODate(info.currentStart)).toBe("2026-01-01");
    expect(toISODate(info.currentEnd)).toBe("2026-12-31");
    expect(toISODate(getNextAnniversary(coop, new Date(2026, 8, 29, 12)))).toBe("2027-01-01");
    expect(info.anniversaryNumber).toBe(4);
  });

  it("day before a window opens reports the right countdown", () => {
    // Fund window opened 1 Oct 2025; on 30 Sep 2025 the "current" window is the one
    // that ends 30 Sep 2025 and next start is 1 Oct 2025.
    const info = getCurrentAnniversary(fund, new Date(2025, 8, 30, 12));
    expect(toISODate(info.nextStart)).toBe("2025-10-01");
    expect(info.daysUntilNext).toBe(1);
  });
});

describe("window helpers", () => {
  it("startOfAnniversaryWindow / endOfAnniversaryWindow for Oct→Sep", () => {
    expect(toISODate(startOfAnniversaryWindow(fund, 2025))).toBe("2025-10-01");
    expect(toISODate(endOfAnniversaryWindow(fund, 2025))).toBe("2026-09-30");
  });

  it("wrap-around end year", () => {
    expect(endOfAnniversaryWindow(fund, 2029).getFullYear()).toBe(2030);
  });
});
