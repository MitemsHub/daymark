// ─── Investment series reference data ────────────────────────────────────────
//
// Single source of truth for the Investment Series section. Edit values here
// (or use the in-app Data page, which layers a local override on top of these
// defaults). Conventions:
//
//  • Dates are ISO strings "YYYY-MM-DD". The source document wrote them as
//    DD.MM.YYYY; 01.02.2024 is 1 February 2024 (these products run Feb→Jan).
//  • Rates are plain numbers in percent: 17.25 means 17.25%.
//  • `period` is human-readable text, kept verbatim from the source. The
//    anniversary engine derives its own math from `anniversaryStartMonth` /
//    `anniversaryEndMonth`; the text is for display.
//  • A field that was not specified in the source stays `null`. The UI shows
//    "Not specified"; never guess.

export interface InvestmentOption {
  /** Verbatim interest-type name, e.g. "MONTHLY", "ANNUAL BACKEND". */
  interestType: string;
  /** Rate in percent, e.g. 17.25. */
  rate: number;
  /** Interest / payment period, verbatim from the source. */
  period: string | null;
  /** Penalty charge in percent. */
  penaltyCharge: number;
}

export interface InvestmentSeries {
  id: string;
  name: string;
  /** Series start date, ISO "YYYY-MM-DD". */
  startDate: string;
  /** Maturity date, ISO "YYYY-MM-DD", or null when the source omitted it. */
  endDate: string | null;
  /** Month (1–12) the series' year starts, e.g. 2 = February. */
  anniversaryStartMonth: number;
  /** Month (1–12) the series' year ends (inclusive), e.g. 1 = January. */
  anniversaryEndMonth: number;
  options: InvestmentOption[];
}

export const investmentSeries: InvestmentSeries[] = [
  {
    id: "classic-diamond",
    name: "Classic Diamond",
    startDate: "2024-02-01",
    endDate: "2028-01-31",
    anniversaryStartMonth: 2,
    anniversaryEndMonth: 1,
    options: [
      {
        interestType: "MONTHLY",
        rate: 17.25,
        period: "Day 1 to 30 or 31 days",
        penaltyCharge: 50,
      },
      {
        interestType: "QUARTERLY",
        rate: 17.5,
        period: "FEB to APRIL · MAY to JULY · AUGUST to OCTOBER · NOVEMBER to JANUARY",
        penaltyCharge: 50,
      },
      {
        interestType: "HALF YEARLY",
        rate: 17.75,
        period: "FEB to JULY · AUGUST to JANUARY",
        penaltyCharge: 50,
      },
      {
        interestType: "ANNUAL UPFRONT",
        rate: 17,
        period: "FEB to JANUARY",
        penaltyCharge: 25,
      },
      {
        interestType: "ANNUAL BACKEND",
        rate: 18,
        period: "FEB to JANUARY",
        penaltyCharge: 50,
      },
    ],
  },
  {
    id: "classic-excel-series",
    name: "Classic Excel Series",
    startDate: "2025-02-01",
    endDate: "2029-01-31",
    anniversaryStartMonth: 2,
    anniversaryEndMonth: 1,
    options: [
      {
        interestType: "MONTHLY",
        rate: 17.25,
        period: "Day 1 to 30 or 31 days",
        penaltyCharge: 50,
      },
      {
        interestType: "ANNUAL UPFRONT",
        rate: 17,
        period: "FEB to JANUARY",
        penaltyCharge: 25,
      },
      {
        interestType: "ANNUAL BACKEND",
        rate: 18,
        period: "FEB to JANUARY",
        penaltyCharge: 50,
      },
    ],
  },
  {
    id: "classic-investment-fund",
    name: "Classic Investment Fund",
    startDate: "2025-10-01",
    endDate: "2029-09-30",
    anniversaryStartMonth: 10,
    anniversaryEndMonth: 9,
    options: [
      {
        interestType: "MONTHLY",
        rate: 17.25,
        period: "Day 1 to 30 or 31 days",
        penaltyCharge: 50,
      },
      {
        interestType: "ANNUAL UPFRONT",
        rate: 17,
        period: "OCT to SEPT",
        penaltyCharge: 25,
      },
      {
        interestType: "ANNUAL BACKEND",
        rate: 18,
        period: "OCT to SEPT",
        penaltyCharge: 50,
      },
    ],
  },
  {
    id: "classic-plus",
    name: "CLASSIC PLUS",
    startDate: "2023-09-01",
    endDate: "2027-08-31",
    anniversaryStartMonth: 9,
    anniversaryEndMonth: 8,
    options: [
      {
        interestType: "MONTHLY",
        rate: 17.25,
        period: "Day 1 to 30 or 31 days",
        penaltyCharge: 50,
      },
      {
        interestType: "ANNUAL UPFRONT",
        rate: 17,
        period: "SEPT to AUG",
        penaltyCharge: 25,
      },
      {
        interestType: "ANNUAL BACKEND",
        rate: 18,
        period: "SEPT to AUG",
        penaltyCharge: 50,
      },
    ],
  },
  {
    id: "premium-classic",
    name: "PREMIUM CLASSIC",
    startDate: "2026-08-01",
    endDate: "2030-07-31",
    anniversaryStartMonth: 8,
    anniversaryEndMonth: 7,
    options: [
      {
        interestType: "MONTHLY",
        rate: 17.25,
        period: "Day 1 to 30 or 31 days",
        penaltyCharge: 50,
      },
    ],
  },
  {
    id: "coop-tripple-plan-2023",
    name: "COOP Investment Fund - Tripple Plan - 2023",
    startDate: "2023-01-01",
    endDate: null, // not specified in the source; do not invent one
    anniversaryStartMonth: 1,
    anniversaryEndMonth: 12,
    options: [
      {
        interestType: "QUARTERLY",
        rate: 14.0,
        period: null,
        penaltyCharge: 25,
      },
      {
        interestType: "HALF YEARLY",
        rate: 15.0,
        period: null,
        penaltyCharge: 25,
      },
      {
        interestType: "ANNUAL UPFRONT",
        rate: 16,
        period: null,
        penaltyCharge: 25,
      },
      {
        interestType: "ANNUAL BACKEND",
        rate: 17,
        period: null,
        penaltyCharge: 50,
      },
    ],
  },
];
