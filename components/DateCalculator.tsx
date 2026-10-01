"use client";

import { useMemo, useState } from "react";
import {
  calculateDateDifference,
  calculateExclusiveDays,
  calculateInclusiveDays,
  formatLong,
  getMonthBreakdown,
  todayISO,
  validateRange,
} from "@/lib/dates";
import { DateField, StatRow, StatusNote } from "@/components/ui";

export function DateCalculator() {
  const [start, setStart] = useState(todayISO());
  const [end, setEnd] = useState("");

  const result = useMemo(() => {
    if (!start || !end) return null;
    const error = validateRange(start, end);
    if (error) return { error } as const;
    const inclusive = calculateInclusiveDays(start, end);
    const exclusive = calculateExclusiveDays(start, end);
    const weeks = Math.floor(exclusive / 7);
    const restDays = exclusive % 7;
    const diff = calculateDateDifference(start, end);
    const months = diff.years * 12 + diff.months;
    const breakdown = getMonthBreakdown(start, end);
    return { error: null as null, inclusive, exclusive, weeks, restDays, months, diff, breakdown, start, end };
  }, [start, end]);

  const endIsToday = end === todayISO();
  const plusLabel = endIsToday ? "+ Today" : "+ End date";
  const minusLabel = endIsToday ? "\u2212 Today" : "\u2212 End date";

  return (
    <section aria-labelledby="calc-heading" className="reveal delay-1">
      <h2 id="calc-heading" className="sr-only">
        Date range calculator
      </h2>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <DateField id="calc-start" label="Start date" value={start} onChange={setStart} />
        <DateField id="calc-end" label="End date" value={end} onChange={setEnd} />
      </div>

      {end === "" && <StatusNote kind="info">Pick an end date to see the full result.</StatusNote>}
      {result?.error && <StatusNote kind="error">{result.error}</StatusNote>}

      {result && result.error === null && (
        <div key={`${result.start}-${result.end}`} className="grid lg:grid-cols-[1.2fr_1fr] gap-8 swap-in">
          <div>
            <div className="flex flex-wrap items-end gap-x-10 gap-y-4 pb-5 border-b hairline">
              <div title="Both the start date and the end date are counted in this total.">
                <p className="eyebrow mb-1">Total days, {plusLabel}</p>
                <p className="display tnum text-6xl sm:text-7xl text-stamp stamp-in" aria-live="polite">
                  {result.inclusive}
                </p>
              </div>
              <div title="Elapsed days only; the end date itself is not counted.">
                <p className="eyebrow mb-1">Total days, {minusLabel}</p>
                <p className="display tnum text-3xl sm:text-4xl">{result.exclusive}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Weeks + days</p>
                <p className="tnum text-xl font-medium">
                  {result.weeks}w {result.restDays}d
                </p>
              </div>
              <div>
                <p className="eyebrow mb-1">Calendar span</p>
                <p className="tnum text-xl font-medium">
                  {result.months > 0 ? `${result.months}mo ` : ""}
                  {result.diff.days}d
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-faint mb-2 max-w-prose">
              {plusLabel} counts the end date in the total; {minusLabel} stops the day before.
            </p>

            <dl className="mt-2">
              <StatRow label="Start date" value={formatLong(result.start)} />
              <StatRow label="End date" value={formatLong(result.end)} />
            </dl>
          </div>

          <div aria-labelledby="breakdown-heading">
            <h3 id="breakdown-heading" className="eyebrow mb-2">
              Breakdown by month
            </h3>
            <div className="overflow-x-auto">
              <table className="ledger ledger--compact">
              <caption className="sr-only">Days contributed per calendar month</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Days covered</th>
                  <th scope="col" className="!text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {result.breakdown.map((seg) => {
                  const fromDay = Number(seg.fromISO.slice(8));
                  const toDay = Number(seg.toISO.slice(8));
                  return (
                    <tr key={seg.fromISO}>
                      <th scope="row">
                        {seg.monthName}
                        {seg.fromISO.startsWith(String(seg.year)) ? "" : ` ${seg.year}`}
                      </th>
                      <td className="text-ink-soft text-xs">
                        {seg.monthName.slice(0, 3)} {fromDay}
                        {fromDay !== toDay ? `–${toDay}` : ""}
                      </td>
                      <td className="num font-medium">{seg.days}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>Total, {plusLabel}</th>
                  <td className="num text-stamp">{result.inclusive}</td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
