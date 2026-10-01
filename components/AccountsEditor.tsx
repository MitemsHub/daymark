"use client";

import { useEffect, useState } from "react";
import type { CoopAccount } from "@/data/coopAccounts";
import { FieldLabel } from "@/components/ui";

function blankAccount(): CoopAccount {
  return { id: `acct-${Date.now()}`, code: "", name: "", accountNo: "", purpose: "" };
}

export function AccountsEditor({ rows, onSave }: { rows: CoopAccount[]; onSave(rows: CoopAccount[]): void }) {
  const [draft, setDraft] = useState<CoopAccount[]>(rows);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(rows);
  }, [rows, dirty]);

  function update(id: string, patch: Partial<CoopAccount>) {
    setDirty(true);
    setDraft((ds) => ds.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function addRow() {
    setDirty(true);
    setDraft((ds) => [...ds, blankAccount()]);
  }

  function removeRow(id: string) {
    setDirty(true);
    setDraft((ds) => ds.filter((a) => a.id !== id));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Drop rows with neither a name nor a number; they are placeholders.
        onSave(draft.filter((a) => a.name.trim() !== "" || a.accountNo.trim() !== ""));
        setDirty(false);
      }}
      className="space-y-5"
    >
      <ul className="space-y-3">
        {draft.map((a) => (
          <li key={a.id} className="grid sm:grid-cols-[0.6fr_1.4fr_1.1fr_1.6fr_auto] gap-2 items-end border hairline rounded-sm bg-white/50 p-3">
            <div>
              <FieldLabel htmlFor={`a-code-${a.id}`}>Account code</FieldLabel>
              <input
                id={`a-code-${a.id}`}
                value={a.code}
                onChange={(e) => update(a.id, { code: e.target.value })}
                className="tnum w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <FieldLabel htmlFor={`a-name-${a.id}`}>Name</FieldLabel>
              <input
                id={`a-name-${a.id}`}
                value={a.name}
                onChange={(e) => update(a.id, { name: e.target.value })}
                className="w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <FieldLabel htmlFor={`a-no-${a.id}`}>Account No</FieldLabel>
              <input
                id={`a-no-${a.id}`}
                value={a.accountNo}
                onChange={(e) => update(a.id, { accountNo: e.target.value })}
                className="tnum w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <FieldLabel htmlFor={`a-purpose-${a.id}`}>Purpose</FieldLabel>
              <input
                id={`a-purpose-${a.id}`}
                value={a.purpose}
                onChange={(e) => update(a.id, { purpose: e.target.value })}
                className="w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(a.id)}
              className="px-2.5 py-1.5 text-sm text-ink-faint hover:text-stamp border hairline rounded-sm"
              aria-label={`Remove ${a.name || "unnamed account"}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button type="button" onClick={addRow} className="border hairline rounded-sm px-4 py-2 text-sm hover:border-stamp hover:text-stamp">
          Add account
        </button>
        {dirty && (
          <button type="submit" className="bg-ink text-paper rounded-sm px-4 py-2 text-sm font-semibold hover:bg-stamp-deep transition-colors">
            Save accounts
          </button>
        )}
      </div>
    </form>
  );
}
