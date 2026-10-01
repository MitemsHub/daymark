"use client";

// Editable data layer. Defaults live in /data; this adds a localStorage
// override so the user can edit values from the Data page without code.

import { useCallback, useEffect, useState } from "react";
import { investmentSeries as defaultSeries } from "@/data/investmentSeries";
import { memberGrades as defaultGrades } from "@/data/memberGrades";
import { coopAccounts as defaultAccounts } from "@/data/coopAccounts";
import { loanRates as defaultLoanRates, bondRates as defaultBondRates } from "@/data/coopRates";
import type { InvestmentSeries } from "@/data/investmentSeries";
import type { MemberGrade } from "@/data/memberGrades";
import type { CoopAccount } from "@/data/coopAccounts";
import type { LoanRate, BondRate } from "@/data/coopRates";

const KEY = "daymark.overrides.v1";

type Sections = {
  series?: unknown[];
  grades?: unknown[];
  accounts?: unknown[];
  loanRates?: unknown[];
  bondRates?: unknown[];
};

function readSections(): Sections {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Sections;
    return { series: parsed.series, grades: parsed.grades, accounts: parsed.accounts, loanRates: parsed.loanRates, bondRates: parsed.bondRates };
  } catch {
    return {};
  }
}

function writeSections(sections: Sections): void {
  if (typeof window === "undefined") return;
  try {
    const clean: Sections = {};
    if (sections.series) clean.series = sections.series;
    if (sections.grades) clean.grades = sections.grades;
    if (sections.accounts) clean.accounts = sections.accounts;
    if (sections.loanRates) clean.loanRates = sections.loanRates;
    if (sections.bondRates) clean.bondRates = sections.bondRates;
    window.localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    // storage unavailable: edits stay in memory for this session only
  }
}

export interface EditableData<T> {
  rows: T[];
  isEdited: boolean;
  saveAll(rows: T[]): void;
  reset(): void;
}

export function useEditableData<T extends { id: string }>(
  section: "series" | "grades" | "accounts" | "loanRates" | "bondRates",
  defaults: T[],
): EditableData<T> {
  const [rows, setRows] = useState<T[]>(defaults);
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    const stored = readSections()[section];
    if (Array.isArray(stored) && stored.length > 0) {
      setRows(stored as unknown as T[]);
      setIsEdited(true);
    }
  }, [section]);

  const saveAll = useCallback(
    (next: T[]) => {
      setRows(next);
      const sections = readSections();
      sections[section] = next;
      writeSections(sections);
      setIsEdited(true);
    },
    [section],
  );

  const reset = useCallback(() => {
    setRows(defaults);
    const sections = readSections();
    delete sections[section];
    writeSections(sections);
    setIsEdited(false);
  }, [defaults, section]);

  return { rows, isEdited, saveAll, reset };
}

export { defaultSeries, defaultGrades, defaultAccounts, defaultLoanRates, defaultBondRates };
