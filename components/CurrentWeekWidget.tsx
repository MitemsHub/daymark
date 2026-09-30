"use client";

import { useEffect, useState } from "react";
import {
  FINAL_WEEK,
  daysRemainingInWeek,
  getWeekDateRange,
  getWeekForDate,
  weeksRemainingInYear,
} from "@/lib/weeks";
import { formatLong } from "@/lib/dates";

export function CurrentWeekWidget() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  if (!now) {
    return (
      <div>
        <p className="eyebrow mb-1">Current week</p>
        <div className="tnum text-4xl text-ink-faint" aria-hidden="true">
          {"\u00A0"}
        </div>
      </div>
    );
  }

  const w = getWeekForDate(now);
  const range = getWeekDateRange(now);
  const isFinal = w.week === FINAL_WEEK;
  return (
    <div className="reveal delay-1">
      <p className="eyebrow mb-1">Current week</p>
      <p className="display tnum text-4xl text-stamp stamp-in">
        {isFinal ? "Final week" : `Week ${w.descending}`}
      </p>
      <p className="tnum text-sm mt-1">
        {formatLong(range.start)} – {formatLong(range.end)}
      </p>
      <p className="text-sm text-ink-soft mt-0.5 tnum">
        {isFinal
          ? "The calendar's last, unnumbered week"
          : `${weeksRemainingInYear(now)} weeks remaining · ${daysRemainingInWeek(now)} days left this week`}
      </p>
    </div>
  );
}
