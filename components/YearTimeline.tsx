"use client";

import { useEffect, useMemo, useState } from "react";
import { getYearTimeline, toISODate, type TimelineWeek } from "@/lib/weeks";

const YEARS_BACK = 3;
const YEARS_FORWARD = 2;
const PER_PAGE = 9; // 53 weeks -> 6 pages (last page holds 8)

/** Compact range that always fits the card: "7 – 13 Sep" or "28 Sep – 4 Oct". */
function compactRange(start: Date, end: Date): string {
  const m = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });
  if (start.getFullYear() !== end.getFullYear()) {
    return `${start.getDate()} ${m(start)} ${start.getFullYear()} – ${end.getDate()} ${m(end)} ${end.getFullYear()}`;
  }
  const y = ` ${String(start.getFullYear()).slice(2)}`;
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()} – ${end.getDate()} ${m(end)}${y}`
    : `${start.getDate()} ${m(start)} – ${end.getDate()} ${m(end)}${y}`;
}

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
    todayISOStr && selected === thisYear
      ? timeline.find((w) => todayISOStr >= toISODate(w.start) && todayISOStr <= toISODate(w.end))
      : null;

  const pageCount = Math.ceil(timeline.length / PER_PAGE);
  const initialPage = currentWeek
    ? Math.floor((currentWeek.week - 1) / PER_PAGE)
    : 0;
  const [page, setPage] = useState(initialPage);

  // Jump to the current week's page when the year changes.
  useEffect(() => {
    setPage(Math.floor(((currentWeek?.week ?? 1) - 1) / PER_PAGE));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, today]);

  const visible = timeline.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

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

      <div className="border-t-2 border-ink pt-5">
        {/* Page content: 3x3 grid of week cards. */}
        <div
          key={page}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 swap-in"
          role="group"
          aria-label={`Weeks ${page * PER_PAGE + 1} to ${Math.min((page + 1) * PER_PAGE, timeline.length)} of ${timeline.length}`}
        >
          {visible.map((w: TimelineWeek) => {
            const isCurrent = currentWeek != null && w.week === currentWeek.week;
            const isPast =
              currentWeek != null && w.week < currentWeek.week;
            return (
              <div
                key={w.week}
                className={`border rounded-sm px-3.5 py-3 min-w-0 transition-colors ${
                  isCurrent
                    ? "border-stamp bg-stamp-wash/50"
                    : isPast
                      ? "border-line bg-transparent opacity-70"
                      : "border-line bg-white/60"
                }`}
                aria-current={isCurrent ? "date" : undefined}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className={`display tnum text-lg ${isCurrent ? "text-stamp" : ""}`}>
                    {w.descending === null ? "Final" : w.descending}
                  </span>
                  <span className="tnum text-[10px] text-ink-faint">wk {w.week}/53</span>
                </div>
                <p className={`tnum text-xs whitespace-nowrap ${isCurrent ? "text-stamp-deep" : "text-ink-soft"}`}>
                  {compactRange(w.start, w.end)}
                </p>
                {isCurrent && (
                  <p className="text-[10px] text-stamp mt-1.5 uppercase tracking-[0.12em] font-semibold">
                    Current week
                  </p>
                )}
                {w.descending === null && (
                  <p className="text-[10px] text-ink-faint mt-1.5 uppercase tracking-[0.12em]">
                    Unnumbered
                  </p>
                )}
                {isPast && (
                  <p className="text-[10px] text-ink-faint mt-1.5 uppercase tracking-[0.12em]">
                    Elapsed
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination footer: prev/next + numbered pages, ledger style. */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t hairline">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-sm text-ink-soft hover:text-stamp transition-colors disabled:opacity-30 disabled:hover:text-ink-soft"
          >
            ← Prev
          </button>

          <div className="flex items-center gap-1" role="group" aria-label="Timeline pages">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}, weeks ${i * PER_PAGE + 1} to ${Math.min((i + 1) * PER_PAGE, timeline.length)}`}
                aria-current={page === i ? "true" : undefined}
                className={`tnum w-7 h-7 text-xs rounded-sm border transition-colors ${
                  page === i
                    ? "border-stamp bg-stamp-wash text-stamp font-semibold"
                    : "hairline text-ink-soft hover:text-stamp hover:border-stamp"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page === pageCount - 1}
            className="text-sm text-ink-soft hover:text-stamp transition-colors disabled:opacity-30 disabled:hover:text-ink-soft"
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}
