"use client";

import { useEffect, useMemo, useState } from "react";
import { getYearTimeline, toISODate, type TimelineWeek } from "@/lib/weeks";
import { formatShort } from "@/lib/dates";

const YEARS_BACK = 3;
const YEARS_FORWARD = 2;

export function YearTimeline() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    setToday(new Date());
  }, []);

  const thisYear = today?.getFullYear() ?? 2026;
  const [year, setYear] = useState<number | null>(null);
  const selected = year ?? thisYear;

  const timeline = useMemo(() => getYearTimeline(selected), [selected]);
  const todayISOStr = today ? toISODate(today) : "";
  const currentWeek =
    todayISOStr
      ? timeline.find((w) => todayISOStr >= toISODate(w.start) && todayISOStr <= toISODate(w.end))
      : null;

  return (
    <section aria-labelledby="timeline-heading" className="reveal delay-2">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <h2 id="timeline-heading" className="eyebrow">
          Year timeline
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="tl-year" className="eyebrow">
            Year
          </label>
          <select
            id="tl-year"
            value={selected}
            onChange={(e) => setYear(Number(e.target.value))}
            className="tnum border hairline bg-white rounded-sm px-2 py-1.5 text-sm"
          >
            {Array.from({ length: YEARS_BACK + 1 + YEARS_FORWARD }, (_, i) => thisYear - YEARS_BACK + i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ),
            )}
          </select>
          <button
            type="button"
            onClick={() => setYear(null)}
            className="text-sm text-ink-soft hover:text-stamp px-2 py-1.5 transition-colors"
          >
            This year
          </button>
        </div>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 border-t-2 border-ink">
        {timeline.map((w: TimelineWeek) => {
          const isCurrent = currentWeek != null && w.week === currentWeek.week;
          return (
            <li
              key={w.week}
              className={`flex items-baseline justify-between gap-3 py-2.5 border-b hairline ${
                isCurrent ? "text-stamp font-semibold bg-stamp-wash/60 -mx-2 px-2" : ""
              }`}
              aria-current={isCurrent ? "date" : undefined}
            >
              <span className="tnum font-semibold shrink-0 w-24">
                {w.descending === null ? "Final week" : `Week ${w.descending}`}
              </span>
              <span className={`tnum text-xs text-right ${isCurrent ? "" : "text-ink-soft"}`}>
                {formatShort(w.start)} – {formatShort(w.end)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
