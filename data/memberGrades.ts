// ─── Member grade & limits reference data ────────────────────────────────────
//
// Single source of truth for the Member Grade section. Values are transcribed
// exactly from the source document, including the spelling "Assitant Director",
// so this table stays a faithful copy of the paper it came from.
//
// Amounts are in Naira (₦). A `0` means the source lists zero; do not "fix" it.

export interface MemberGrade {
  id: string;
  /** Grade name, verbatim from the source document. */
  name: string;
  creditLimit: number;
  minContribution: number;
  globalLimit: number;
  annualLimit: number;
}

export const memberGrades: MemberGrade[] = [
  { id: "deputy-governor", name: "Deputy Governor", creditLimit: 0, minContribution: 0, globalLimit: 0, annualLimit: 0 },
  { id: "director", name: "Director", creditLimit: 2_000_000, minContribution: 100_000, globalLimit: 45_000_000, annualLimit: 15_000_000 },
  { id: "deputy-director", name: "Deputy Director", creditLimit: 2_000_000, minContribution: 80_000, globalLimit: 40_000_000, annualLimit: 13_400_000 },
  { id: "assitant-director", name: "Assitant Director", creditLimit: 2_000_000, minContribution: 70_000, globalLimit: 37_000_000, annualLimit: 12_400_000 },
  { id: "principal-manager", name: "Principal Manager", creditLimit: 1_000_000, minContribution: 60_000, globalLimit: 33_000_000, annualLimit: 11_000_000 },
  { id: "senior-manager", name: "Senior Manager", creditLimit: 1_000_000, minContribution: 50_000, globalLimit: 30_000_000, annualLimit: 10_000_000 },
  { id: "manager", name: "Manager", creditLimit: 1_000_000, minContribution: 40_000, globalLimit: 25_000_000, annualLimit: 7_840_000 },
  { id: "deputy-manager", name: "Deputy Manager", creditLimit: 1_000_000, minContribution: 30_000, globalLimit: 22_000_000, annualLimit: 6_720_000 },
  { id: "assistant-manager", name: "Assistant Manager", creditLimit: 1_000_000, minContribution: 20_000, globalLimit: 18_000_000, annualLimit: 5_600_000 },
  { id: "senior-supervisor-1", name: "Senior Supervisor 1", creditLimit: 1_000_000, minContribution: 10_000, globalLimit: 13_000_000, annualLimit: 3_920_000 },
  { id: "senior-supervisor-2", name: "Senior Supervisor 2", creditLimit: 1_000_000, minContribution: 10_000, globalLimit: 12_000_000, annualLimit: 3_360_000 },
  { id: "supervisor", name: "Supervisor", creditLimit: 500_000, minContribution: 10_000, globalLimit: 8_800_000, annualLimit: 2_688_000 },
  { id: "senior-clerk", name: "Senior Clerk", creditLimit: 500_000, minContribution: 10_000, globalLimit: 6_700_000, annualLimit: 2_240_000 },
  { id: "treasury-assistant", name: "Treasury Assistant", creditLimit: 500_000, minContribution: 10_000, globalLimit: 3_200_000, annualLimit: 1_120_000 },
  { id: "clerk", name: "Clerk", creditLimit: 500_000, minContribution: 10_000, globalLimit: 3_800_000, annualLimit: 1_344_000 },
  { id: "treasury-assistant-1", name: "Treasury Assistant 1", creditLimit: 500_000, minContribution: 10_000, globalLimit: 3_200_000, annualLimit: 1_120_000 },
  { id: "drivers", name: "Drivers", creditLimit: 500_000, minContribution: 10_000, globalLimit: 5_500_000, annualLimit: 1_792_000 },
  { id: "pensioner", name: "Pensioner", creditLimit: 500_000, minContribution: 10_000, globalLimit: 0, annualLimit: 0 },
  { id: "retiree", name: "Retiree", creditLimit: 500_000, minContribution: 10_000, globalLimit: 0, annualLimit: 0 },
  { id: "coop-staff", name: "Coop Staff", creditLimit: 500_000, minContribution: 10_000, globalLimit: 0, annualLimit: 0 },
  { id: "undefined", name: "Undefined", creditLimit: 0, minContribution: 0, globalLimit: 0, annualLimit: 0 },
];
