"use client";

import { useEffect, useState } from "react";
import {
  FINAL_WEEK,
  daysRemainingInWeek,
  getWeekDateRange,
  getWeekForDate,
} from "@/lib/weeks";
import { formatLong } from "@/lib/dates";

export function CurrentWeekCard() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  if (!now) {
    return (
      <div className="border hairline rounded-sm p-6 sm:p-8 animate-pulse" aria-busy="true" aria-label="Loading current week">
        <div className="h-4 w-24 bg-paper-sunken rounded" />
        <div className="h-12 w-48 bg-paper-sunken rounded mt-3" />
        <div className="h-4 w-64 bg-paper-sunken rounded mt-3" />
      </div>
    );
  }

  const w = getWeekForDate(now);
  const range = getWeekDateRange(now);
  const isFinal = w.week === FINAL_WEEK;

  return (
    <section aria-labelledby="current-week-heading" className="border-l-4 border-stamp pl-5 sm:pl-7 reveal">
      <p id="current-week-heading" className="eyebrow mb-2">
        Current week
      </p>
      <p className="display tnum text-6xl sm:text-7xl text-stamp stamp-in" aria-live="polite">
        {isFinal ? "Final week" : `Week ${w.descending}`}
      </p>
      <p className="tnum text-lg mt-2">
        {formatLong(range.start)} – {formatLong(range.end)}
      </p>
      <p className="tnum text-sm text-ink-soft mt-1">
        {isFinal
          ? "After the countdown: no number on the calendar"
          : `${w.descending} weeks remaining · ${daysRemainingInWeek(now)} days left this week`}
      </p>
      <p className="text-xs text-ink-faint mt-1 tnum">
        Calendar week {w.week} of 53 · {w.daysInWeek} days
        {!isFinal && ` · descending number = 53 − ${w.week}`}
      </p>
    </section>
  );
}
