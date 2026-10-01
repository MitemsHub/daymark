// ─── Co-op rate reference data ───────────────────────────────────────────────
//
// Single source of truth for the Loan Rates and Investment Bond Rates
// sections on the Rates page. The source sheet shows Old Rate and New Rate
// columns; the co-op resolves that only the NEW RATE applies, so this file
// stores new rates only. Edit values here (or use the in-app Data page,
// which layers a local override on top of these defaults).
//
// Rates are plain numbers in percent: 19 means 19%. A rate that the bank
// quotes as "11% FLAT" stays a text string, never a number.

export interface LoanRate {
  id: string;
  /** Verbatim product name, e.g. "NORMAL LOAN". */
  name: string;
  /** New rate in percent, or a verbatim string like "11% FLAT". */
  rate: number | string;
  /** Grouping as printed: main loan table vs the project table. */
  group: "loan" | "project";
}

export const loanRates: LoanRate[] = [
  { id: "loan-normal", name: "NORMAL LOAN", rate: 11.5, group: "loan" },
  { id: "loan-special", name: "SPECIAL LOAN", rate: 19, group: "loan" },
  { id: "loan-short-1m", name: "SHORT TERM LOAN (1 MONTH)", rate: 9.5, group: "loan" },
  { id: "loan-short-3m", name: "SHORT TERM LOAN (3 MONTHS)", rate: 11.5, group: "loan" },
  { id: "loan-short-6m", name: "SHORT TERM LOAN (6 MONTHS)", rate: 13, group: "loan" },
  { id: "loan-seasonal", name: "SEASONAL SALES LOAN", rate: 19, group: "loan" },
  { id: "loan-investment", name: "INVESTMENT LOAN", rate: 19, group: "loan" },
  { id: "loan-lpo", name: "LPO Finance", rate: "11% FLAT", group: "loan" },
  { id: "loan-project", name: "PROJECT LOAN", rate: 19, group: "project" },
];

export interface BondRate {
  id: string;
  /** Verbatim plan name, e.g. "MONTHLY". */
  name: string;
  /** New rate in percent. */
  rate: number;
  group: "4-years" | "2-years" | "1-year";
}

export const bondRates: BondRate[] = [
  { id: "bond-4y-monthly", name: "MONTHLY", rate: 17.25, group: "4-years" },
  { id: "bond-4y-quarterly", name: "QUARTERLY", rate: 17.5, group: "4-years" },
  { id: "bond-4y-half-yearly", name: "HALF YEARLY", rate: 17.75, group: "4-years" },
  { id: "bond-4y-upfront", name: "Upfront", rate: 17, group: "4-years" },
  { id: "bond-4y-backend", name: "Backend", rate: 18, group: "4-years" },
  { id: "bond-2y-monthly", name: "Monthly", rate: 16.25, group: "2-years" },
  { id: "bond-2y-upfront", name: "Upfront", rate: 16, group: "2-years" },
  { id: "bond-2y-backend", name: "Backend", rate: 17, group: "2-years" },
  { id: "bond-1y-quarterly", name: "QUARTERLY (91 DAYS)", rate: 14, group: "1-year" },
  { id: "bond-1y-semi-annual", name: "SEMI-ANNUAL (182 DAYS)", rate: 15, group: "1-year" },
  { id: "bond-1y-upfront", name: "UPFRONT (ANNUAL, 365 DAYS)", rate: 16, group: "1-year" },
  { id: "bond-1y-backend", name: "BACKEND (ANNUAL, 365 DAYS)", rate: 17, group: "1-year" },
];
