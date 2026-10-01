"use client";

import { useEffect, useState } from "react";
import type { BondRate, LoanRate } from "@/data/coopRates";
import { FieldLabel } from "@/components/ui";

function blankLoan(): LoanRate {
  return { id: `loan-${Date.now()}`, name: "", rate: "", group: "loan" };
}

function blankBond(): BondRate {
  return { id: `bond-${Date.now()}`, name: "", rate: 0, group: "1-year" };
}

/** One editor for both datasets: rows of name + rate, plus Add/Remove. */
export function RatesEditor<T extends { id: string; name: string; rate: number | string }>({
  rows,
  onSave,
  kind,
}: {
  rows: T[];
  onSave(rows: T[]): void;
  kind: "loan" | "bond";
}) {
  const [draft, setDraft] = useState<T[]>(rows);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(rows);
  }, [rows, dirty]);

  function update(id: string, patch: Partial<T>) {
    setDirty(true);
    setDraft((ds) => ds.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setDirty(true);
    setDraft((ds) => [...ds, (kind === "loan" ? blankLoan() : blankBond()) as unknown as T]);
  }

  function removeRow(id: string) {
    setDirty(true);
    setDraft((ds) => ds.filter((r) => r.id !== id));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft.filter((r) => r.name.trim() !== ""));
        setDirty(false);
      }}
      className="space-y-5"
    >
      <ul className="space-y-3">
        {draft.map((r) => (
          <li key={r.id} className="grid grid-cols-1 sm:grid-cols-[1.8fr_0.9fr_auto] gap-2 items-end border hairline rounded-sm bg-white/50 p-3">
            <div>
              <FieldLabel htmlFor={`r-name-${r.id}`}>Name</FieldLabel>
              <input
                id={`r-name-${r.id}`}
                value={r.name}
                onChange={(e) => update(r.id, { name: e.target.value } as Partial<T>)}
                className="w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <FieldLabel htmlFor={`r-rate-${r.id}`}>New rate</FieldLabel>
              <input
                id={`r-rate-${r.id}`}
                value={String(r.rate)}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  // Numbers stay numbers; text like "11% FLAT" stays text.
                  const asNum = Number(v);
                  update(r.id, { rate: v !== "" && Number.isFinite(asNum) ? asNum : v } as Partial<T>);
                }}
                className="tnum w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(r.id)}
              className="px-2.5 py-1.5 text-sm text-ink-faint hover:text-stamp border hairline rounded-sm"
              aria-label={`Remove ${r.name || "unnamed rate"}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button type="button" onClick={addRow} className="border hairline rounded-sm px-4 py-2 text-sm hover:border-stamp hover:text-stamp">
          Add rate
        </button>
        {dirty && (
          <button type="submit" className="bg-ink text-paper rounded-sm px-4 py-2 text-sm font-semibold hover:bg-stamp-deep transition-colors">
            Save rates
          </button>
        )}
      </div>
    </form>
  );
}
