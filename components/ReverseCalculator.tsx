"use client";

import { useMemo, useState } from "react";
import { formatLong, parseISODate, reverseCalculate } from "@/lib/dates";
import { DateField, FieldLabel, StatusNote } from "@/components/ui";

export function ReverseCalculator() {
  // Same professional look as the top calculator: empty until entered.
  const [start, setStart] = useState("");
  const [days, setDays] = useState("");
  const [mode, setMode] = useState<"add" | "subtract">("add");

  const n = Number(days);
  const result = useMemo(() => {
    if (!start || !Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 365000) {
      return null;
    }
    return reverseCalculate(start, n, mode);
  }, [start, n, mode]);

  // Untouched fields stay quiet; only a half-filled form shows guidance.
  const touched = start !== "" || days !== "";
  const error = !touched
    ? null
    : !start
      ? "Pick a start date."
      : !Number.isInteger(n) || n < 1
        ? "Enter a whole number of days (1 or more)."
        : null;

  return (
    <section aria-labelledby="reverse-heading" className="reveal delay-1">
      <h3 id="reverse-heading" className="eyebrow mb-4">
        Reverse calculation
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end mb-4">
        <DateField id="rev-start" label="Start date" value={start} onChange={setStart} />
        <div>
          <FieldLabel htmlFor="rev-days">Number of days</FieldLabel>
          <input
            id="rev-days"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="e.g. 30"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="tnum w-full border hairline bg-white rounded-sm px-3 py-2"
          />
        </div>
        <fieldset className="flex gap-2">
          <legend className="sr-only">Direction</legend>
          {(
            [
              ["add", "Add days"],
              ["subtract", "Subtract days"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={`px-3 py-2 text-sm border rounded-sm transition-colors ${
                mode === value
                  ? "border-stamp text-stamp bg-stamp-wash font-semibold"
                  : "hairline text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </fieldset>
      </div>

      {error && <StatusNote kind="error">{error}</StatusNote>}

      {result && !error && (
        <div key={`${mode}-${result.resultISO}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 swap-in" aria-live="polite">
          <p className="eyebrow">
            {mode === "add" ? "Counting the end date in (+ Today)" : "Counting elapsed days back (− Today)"}
          </p>
          <p className="display text-3xl sm:text-4xl">{formatLong(result.resultISO)}</p>
          <p className="text-sm text-ink-soft tnum">{parseISODate(result.resultISO).toLocaleDateString("en-GB", { weekday: "long" })}</p>
        </div>
      )}

      <p className="mt-3 text-xs text-ink-faint max-w-prose">
        Add: the start date is day 1 of the count (start + 1 day = start), the same total as{" "}
        <span className="tnum">+ Today</span>. Subtract: exactly <span className="tnum">N</span> elapsed
        days back, the same total as <span className="tnum">− Today</span>.
      </p>
    </section>
  );
}
