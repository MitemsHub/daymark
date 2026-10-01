"use client";

import { useEffect, useState } from "react";
import type { MemberGrade } from "@/data/memberGrades";
import { FieldLabel } from "@/components/ui";

const NUMERIC: { key: keyof Omit<MemberGrade, "id" | "name">; label: string }[] = [
  { key: "creditLimit", label: "Credit limit (₦)" },
  { key: "minContribution", label: "Min. contribution (₦)" },
  { key: "globalLimit", label: "Global limit (₦)" },
  { key: "annualLimit", label: "Annual limit (₦)" },
];

function blank(): MemberGrade {
  return {
    id: `grade-${Date.now()}`,
    name: "",
    creditLimit: 0,
    minContribution: 0,
    globalLimit: 0,
    annualLimit: 0,
  };
}

export function GradesEditor({ rows, onSave }: { rows: MemberGrade[]; onSave(rows: MemberGrade[]): void }) {
  const [draft, setDraft] = useState<MemberGrade[]>(rows);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(rows);
  }, [rows, dirty]);

  function update(id: string, patch: Partial<MemberGrade>) {
    setDirty(true);
    setDraft((ds) => ds.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function addRow() {
    setDirty(true);
    setDraft((ds) => [...ds, blank()]);
  }

  function removeRow(id: string) {
    setDirty(true);
    setDraft((ds) => ds.filter((g) => g.id !== id));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft.filter((g) => g.name.trim() !== ""));
        setDirty(false);
      }}
      className="space-y-4"
    >
      <ul className="space-y-3">
        {draft.map((g) => (
          <li key={g.id} className="border hairline rounded-sm p-3 bg-white/50">
            <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto] gap-3 items-end">
              <div>
                <FieldLabel htmlFor={`g-name-${g.id}`}>Name</FieldLabel>
                <input
                  id={`g-name-${g.id}`}
                  value={g.name}
                  onChange={(e) => update(g.id, { name: e.target.value })}
                  className="w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
                />
              </div>
              {NUMERIC.map((col) => (
                <div key={col.key}>
                  <FieldLabel htmlFor={`g-${col.key}-${g.id}`}>{col.label}</FieldLabel>
                  <input
                    id={`g-${col.key}-${g.id}`}
                    type="number"
                    min={0}
                    value={g[col.key]}
                    onChange={(e) => update(g.id, { [col.key]: Number(e.target.value) || 0 })}
                    className="tnum w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => removeRow(g.id)}
                className="px-2.5 py-1.5 text-sm text-ink-faint hover:text-stamp border hairline rounded-sm"
                aria-label={`Remove ${g.name || "unnamed grade"}`}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button type="button" onClick={addRow} className="border hairline rounded-sm px-4 py-2 text-sm hover:border-stamp hover:text-stamp">
          Add grade
        </button>
        {dirty && (
          <button type="submit" className="bg-ink text-paper rounded-sm px-4 py-2 text-sm font-semibold hover:bg-stamp-deep transition-colors">
            Save grades
          </button>
        )}
      </div>
    </form>
  );
}
