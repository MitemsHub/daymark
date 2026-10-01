"use client";

import { useEffect, useState } from "react";
import type { InvestmentOption, InvestmentSeries } from "@/data/investmentSeries";
import { FieldLabel } from "@/components/ui";
import { DmyInput } from "@/components/DmyInput";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function blankOption(): InvestmentOption {
  return { interestType: "MONTHLY", rate: 17.25, period: "", penaltyCharge: 50 };
}

function blankSeries(): InvestmentSeries {
  return {
    id: `series-${Date.now()}`,
    name: "",
    startDate: "2026-01-01",
    endDate: null,
    anniversaryStartMonth: 1,
    anniversaryEndMonth: 12,
    options: [blankOption()],
  };
}

export function SeriesEditor({ rows, onSave }: { rows: InvestmentSeries[]; onSave(rows: InvestmentSeries[]): void }) {
  const [draft, setDraft] = useState<InvestmentSeries[]>(rows);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(rows);
  }, [rows, dirty]);

  function update(id: string, patch: Partial<InvestmentSeries>) {
    setDirty(true);
    setDraft((ds) => ds.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function updateOption(seriesId: string, index: number, patch: Partial<InvestmentOption>) {
    setDirty(true);
    setDraft((ds) =>
      ds.map((s) =>
        s.id === seriesId
          ? { ...s, options: s.options.map((o, i) => (i === index ? { ...o, ...patch } : o)) }
          : s,
      ),
    );
  }

  function addOption(seriesId: string) {
    setDirty(true);
    setDraft((ds) =>
      ds.map((s) => (s.id === seriesId ? { ...s, options: [...s.options, blankOption()] } : s)),
    );
  }

  function removeOption(seriesId: string, index: number) {
    setDirty(true);
    setDraft((ds) =>
      ds.map((s) =>
        s.id === seriesId ? { ...s, options: s.options.filter((_, i) => i !== index) } : s,
      ),
    );
  }

  function addSeries() {
    setDirty(true);
    setDraft((ds) => [...ds, blankSeries()]);
  }

  function removeSeries(id: string) {
    setDirty(true);
    setDraft((ds) => ds.filter((s) => s.id !== id));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft.filter((s) => s.name.trim() !== ""));
        setDirty(false);
      }}
      className="space-y-5"
    >
      <ul className="space-y-4">
        {draft.map((s) => (
          <li key={s.id} className="border hairline rounded-sm bg-white/50">
            <div className="p-3 grid sm:grid-cols-[1.5fr_1fr_1fr_auto_auto] gap-3 items-end border-b hairline">
              <div>
                <FieldLabel htmlFor={`s-name-${s.id}`}>Series name</FieldLabel>
                <input
                  id={`s-name-${s.id}`}
                  value={s.name}
                  onChange={(e) => update(s.id, { name: e.target.value })}
                  className="w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
                />
              </div>
              <div>
                <FieldLabel htmlFor={`s-start-${s.id}`}>Start date</FieldLabel>
                <DmyInput
                  id={`s-start-${s.id}`}
                  value={s.startDate}
                  onChange={(iso) => update(s.id, { startDate: iso || s.startDate })}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`s-end-${s.id}`}>End date (blank = not specified)</FieldLabel>
                <DmyInput
                  id={`s-end-${s.id}`}
                  value={s.endDate ?? ""}
                  onChange={(iso) => update(s.id, { endDate: iso || null })}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`s-asm-${s.id}`}>Anniv. starts</FieldLabel>
                <select
                  id={`s-asm-${s.id}`}
                  value={s.anniversaryStartMonth}
                  onChange={(e) => update(s.id, { anniversaryStartMonth: Number(e.target.value) })}
                  className="w-full border hairline bg-white rounded-sm px-2 py-1.5 text-sm"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor={`s-aem-${s.id}`}>Anniv. ends</FieldLabel>
                <select
                  id={`s-aem-${s.id}`}
                  value={s.anniversaryEndMonth}
                  onChange={(e) => update(s.id, { anniversaryEndMonth: Number(e.target.value) })}
                  className="w-full border hairline bg-white rounded-sm px-2 py-1.5 text-sm"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeSeries(s.id)}
                className="px-2.5 py-1.5 text-sm text-ink-faint hover:text-stamp border hairline rounded-sm"
                aria-label={`Remove ${s.name || "unnamed series"}`}
              >
                Remove
              </button>
            </div>

            <div className="p-3 space-y-2">
              <p className="eyebrow">Interest options</p>
              {s.options.map((o, i) => (
                <div key={i} className="grid sm:grid-cols-[1.2fr_0.7fr_1.6fr_0.7fr_auto] gap-2 items-end">
                  <div>
                    <FieldLabel htmlFor={`o-type-${s.id}-${i}`}>Type</FieldLabel>
                    <input
                      id={`o-type-${s.id}-${i}`}
                      value={o.interestType}
                      onChange={(e) => updateOption(s.id, i, { interestType: e.target.value })}
                      className="w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`o-rate-${s.id}-${i}`}>Rate %</FieldLabel>
                    <input
                      id={`o-rate-${s.id}-${i}`}
                      type="number"
                      step="0.01"
                      min={0}
                      value={o.rate}
                      onChange={(e) => updateOption(s.id, i, { rate: Number(e.target.value) })}
                      className="tnum w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`o-period-${s.id}-${i}`}>Period</FieldLabel>
                    <input
                      id={`o-period-${s.id}-${i}`}
                      value={o.period ?? ""}
                      onChange={(e) => updateOption(s.id, i, { period: e.target.value || null })}
                      className="w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`o-pen-${s.id}-${i}`}>Penalty %</FieldLabel>
                    <input
                      id={`o-pen-${s.id}-${i}`}
                      type="number"
                      step="0.01"
                      min={0}
                      value={o.penaltyCharge}
                      onChange={(e) => updateOption(s.id, i, { penaltyCharge: Number(e.target.value) })}
                      className="tnum w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOption(s.id, i)}
                    className="px-2 py-1.5 text-sm text-ink-faint hover:text-stamp"
                    aria-label={`Remove ${o.interestType} option from ${s.name || "series"}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(s.id)}
                className="text-sm text-ink-soft hover:text-stamp underline underline-offset-2"
              >
                Add interest option
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button type="button" onClick={addSeries} className="border hairline rounded-sm px-4 py-2 text-sm hover:border-stamp hover:text-stamp">
          Add series
        </button>
        {dirty && (
          <button type="submit" className="bg-ink text-paper rounded-sm px-4 py-2 text-sm font-semibold hover:bg-stamp-deep transition-colors">
            Save series
          </button>
        )}
      </div>
    </form>
  );
}
