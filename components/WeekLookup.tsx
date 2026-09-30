"use client";

import { useEffect, useMemo, useState } from "react";
import {
  WEEKS_PER_YEAR,
  daysRemainingInWeek,
  getWeekByDescendingNumber,
  getWeekDateRange,
  getWeekForDate,
} from "@/lib/weeks";
import { formatLong } from "@/lib/dates";
import { DateField, FieldLabel, StatusNote } from "@/components/ui";

export function WeekLookup() {
  const [dateISO, setDateISO] = useState("");
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const date = dateISO ? new Date(dateISO + "T12:00:00") : null;

  const byDate = useMemo(() => {
    if (!date) return null;
    const w = getWeekForDate(date);
    const range = getWeekDateRange(date);
    return {
      week: w,
      start: range.start,
      end: range.end,
      daysRemaining: daysRemainingInWeek(date),
    };
  }, [dateISO]); // eslint-disable-line react-hooks/exhaustive-deps

  const [year, setYear] = useState(today?.getFullYear() ?? 2026);
  const [weekNum, setWeekNum] = useState<number | null>(null);
  const numberedWeeks = WEEKS_PER_YEAR - 1; // 52; week 53 is unnumbered

  const byWeek = useMemo(() => {
    if (weekNum === null) return null;
    try {
      return getWeekByDescendingNumber(year, weekNum);
    } catch {
      return null;
    }
  }, [year, weekNum]);

  return (
    <section aria-labelledby="lookup-heading" className="grid md:grid-cols-2 gap-10">
      <div>
        <h2 id="lookup-heading" className="eyebrow mb-4">
          Look up a date
        </h2>
        <DateField id="wl-date" label="Date" value={dateISO} onChange={setDateISO} withToday />

        {byDate && (
          <dl className="mt-4 text-sm" aria-live="polite">
            {[
              ["Date", formatLong(date!)],
              ["Calendar week", `Week ${byDate.week.week} of 53`],
              ["Descending week", byDate.week.descending === null ? "Final week — unnumbered" : `Week ${byDate.week.descending}`],
              [
                "Week range",
                `${formatLong(byDate.start)} – ${formatLong(byDate.end)}`,
              ],
              ["Days remaining in the week", String(byDate.daysRemaining)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2 border-b hairline">
                <dt className="text-ink-soft">{k}</dt>
                <dd className="tnum text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div>
        <h2 className="eyebrow mb-4">Look up a week number</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="wl-year">Year</FieldLabel>
            <input
              id="wl-year"
              type="number"
              value={year}
              min={1900}
              max={2200}
              onChange={(e) => setYear(Number(e.target.value) || 2026)}
              className="tnum w-full border hairline bg-white rounded-sm px-3 py-2"
            />
          </div>
          <div>
            <FieldLabel htmlFor="wl-week">Week (1–{numberedWeeks})</FieldLabel>
            <input
              id="wl-week"
              type="number"
              min={1}
              max={numberedWeeks}
              value={weekNum ?? ""}
              onChange={(e) =>
                setWeekNum(e.target.value === "" ? null : Number(e.target.value))
              }
              className="tnum w-full border hairline bg-white rounded-sm px-3 py-2"
            />
          </div>
        </div>

        {byWeek ? (
          <div className="mt-4" aria-live="polite">
            <p className="display tnum text-4xl text-stamp">Week {byWeek.descending}</p>
            <p className="tnum text-sm mt-1">
              {formatLong(byWeek.start)} – {formatLong(byWeek.end)}
            </p>
            <p className="text-xs text-ink-faint tnum mt-1">
              Calendar week {byWeek.week} of 53 · {numberedWeeks} numbered weeks in {year}
            </p>
          </div>
        ) : (
          <StatusNote kind="info">
            Enter a week number between 1 and {numberedWeeks}. The calendar's final week is unnumbered.
          </StatusNote>
        )}
        {weekNum !== null && !byWeek && (
          <StatusNote kind="error">
            Week {weekNum} is outside 1–{numberedWeeks} for {year}.
          </StatusNote>
        )}
      </div>
      <span className="sr-only">{today ? "" : ""}</span>
    </section>
  );
}
