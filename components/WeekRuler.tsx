"use client";

import { useEffect, useState } from "react";
import { getYearTimeline, toISODate } from "@/lib/weeks";

export function WeekRuler() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const year = now?.getFullYear() ?? 2026;
  const today = now ? toISODate(now) : "";
  const timeline = getYearTimeline(year);
  const currentIndex = timeline.findIndex(
    (w) => today >= toISODate(w.start) && today <= toISODate(w.end),
  );

  return (
    <section aria-labelledby="ruler-heading" className="reveal delay-1">
      <div className="flex items-baseline justify-between mb-3">
        <h2 id="ruler-heading" className="eyebrow">
          The countdown: {year}
        </h2>
        <p className="text-xs text-ink-faint hidden sm:block">
          Week 52 at the year's opening, down to 1; the final week is unnumbered.
        </p>
      </div>

      {/* Horizontal strip: Week 52 → 1, then the unnumbered stub. */}
      <ol className="flex overflow-x-auto py-1" aria-label={`Descending week ruler for ${year}`}>
        {timeline.map((w, i) => {
          const isCurrent = i === currentIndex;
          return (
            <li
              key={w.week}
              className={`shrink-0 w-11 border-l hairline px-1 pt-1 pb-2 flex flex-col ${
                isCurrent ? "bg-stamp-wash/70" : ""
              }`}
              aria-current={isCurrent ? "date" : undefined}
            >
              <span
                className={`tnum text-[11px] font-semibold ${
                  isCurrent ? "text-stamp" : w.descending === null ? "text-ink-faint" : "text-ink-soft"
                }`}
              >
                {w.descending ?? "·"}
              </span>
              <span
                className={`tnum text-[10px] text-ink-faint mt-auto ${isCurrent ? "pulse" : ""}`}
                aria-hidden="true"
              >
                {isCurrent ? "●" : ""}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Readout under the strip. */}
      <p className="text-sm text-ink-soft mt-2">
        {currentIndex >= 0 ? (
          <>
            Calendar week {timeline[currentIndex].week} of 53
            {timeline[currentIndex].descending !== null
              ? `, running ${timeline[currentIndex].week} of ${timeline.length} weeks elapsed.`
              : ", the unnumbered week after the countdown."}
          </>
        ) : (
          "Today falls outside this year's weeks."
        )}
      </p>
    </section>
  );
}
