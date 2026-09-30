"use client";

import { useEffect, useRef, useState } from "react";
import { getYearTimeline, toISODate } from "@/lib/weeks";

export function WeekRuler() {
  const [now, setNow] = useState<Date | null>(null);
  const stripRef = useRef<HTMLOListElement>(null);
  const cellRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const year = now?.getFullYear() ?? 2026;
  const today = now ? toISODate(now) : "";
  const timeline = getYearTimeline(year);
  const currentIndex = timeline.findIndex(
    (w) => today >= toISODate(w.start) && today <= toISODate(w.end),
  );

  const current = currentIndex >= 0 ? timeline[currentIndex] : null;

  // Open the strip centered on the current week. Runs once the real date is
  // in; free scrolling still works and is never yanked back afterward.
  useEffect(() => {
    if (now === null) return;
    const cell = cellRefs.current[currentIndex] ?? stripRef.current;
    const strip = stripRef.current;
    if (!cell || !strip) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = cell.offsetLeft - strip.clientWidth / 2 + cell.offsetWidth / 2;
    strip.scrollTo({
      left: Math.max(0, target),
      behavior: reduce ? "auto" : "smooth",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  // Track scroll bounds for the arrow buttons.
  function updateArrows() {
    const strip = stripRef.current;
    if (!strip) return;
    setCanPrev(strip.scrollLeft > 4);
    setCanNext(strip.scrollLeft < strip.scrollWidth - strip.clientWidth - 4);
  }

  useEffect(() => {
    updateArrows();
    const strip = stripRef.current;
    if (!strip) return;
    strip.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      strip.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [year, now]);

  function nudge(direction: 1 | -1) {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: direction * strip.clientWidth * 0.75, behavior: "smooth" });
  }

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

      <div className="relative">
        {/* Edge fades hint that the strip continues past the viewport. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 w-8 z-10 transition-opacity duration-300 ${
            canPrev ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: "linear-gradient(to right, var(--color-paper), transparent)" }}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-0 w-8 z-10 transition-opacity duration-300 ${
            canNext ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: "linear-gradient(to left, var(--color-paper), transparent)" }}
        />

        {/* Horizontal strip: Week 52 to 1, then the unnumbered stub. Opens
            centered on the current week; free scroll, no scrollbar bar. */}
        <ol
          ref={stripRef}
          className="no-scrollbar flex overflow-x-auto py-1"
          aria-label={`Descending week ruler for ${year}`}
          tabIndex={0}
        >
          {timeline.map((w, i) => {
            const isCurrent = i === currentIndex;
            const isPast = currentIndex >= 0 && i < currentIndex;
            return (
              <li
                key={w.week}
                ref={(el) => {
                  cellRefs.current[i] = el;
                }}
                className={`shrink-0 w-11 border-l hairline px-1 pt-1 pb-2 flex flex-col ${
                  isCurrent ? "bg-stamp-wash/70" : ""
                }`}
                aria-current={isCurrent ? "date" : undefined}
              >
                <span
                  className={`tnum text-[11px] font-semibold ${
                    isCurrent
                      ? "text-stamp"
                      : isPast
                        ? "text-ink-faint"
                        : w.descending === null
                          ? "text-ink-faint"
                          : "text-ink-soft"
                  }`}
                >
                  {w.descending ?? "·"}
                </span>
                <span
                  className={`tnum text-[10px] mt-auto ${isCurrent ? "text-stamp pulse" : "text-ink-faint"}`}
                  aria-hidden="true"
                >
                  {isCurrent ? "●" : ""}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex items-center justify-between gap-3 mt-1">
        {/* Readout under the strip. */}
        <p className="text-sm text-ink-soft min-w-0">
          {current ? (
            <>
              <span className="tnum">
                {current.descending === null
                  ? "Final week"
                  : `Week ${current.descending}`}
              </span>
              , {formatRange(current.start, current.end)} · {daysLeftLabel(today, current.end)}
            </>
          ) : (
            "Today falls outside this year's weeks."
          )}
        </p>

        {/* Arrow nudge buttons for mouse users; scroll is still free. */}
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={!canPrev}
            aria-label="Scroll the ruler left"
            className="w-7 h-7 border hairline rounded-sm text-ink-soft text-xs hover:border-stamp hover:text-stamp transition-colors disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink-soft"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            disabled={!canNext}
            aria-label="Scroll the ruler right"
            className="w-7 h-7 border hairline rounded-sm text-ink-soft text-xs hover:border-stamp hover:text-stamp transition-colors disabled:opacity-30 disabled:hover:border-line disabled:hover:text-ink-soft"
          >
            ▶
          </button>
        </div>
      </div>
    </section>
  );
}

function formatRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  const fmt = (d: Date, withMonth: boolean, withYear: boolean) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      ...(withMonth ? { month: "short" } : {}),
      ...(withYear ? { year: "numeric" } : {}),
    });
  return sameYear && sameMonth
    ? `${start.getDate()}–${fmt(end, true, true)}`
    : sameYear
      ? `${fmt(start, true, false)} – ${fmt(end, true, true)}`
      : `${fmt(start, true, true)} – ${fmt(end, true, true)}`;
}

function daysLeftLabel(todayISO: string, end: Date): string {
  if (!todayISO) return "";
  const today = new Date(todayISO + "T12:00:00");
  const days = Math.round((end.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return "week done";
  if (days === 0) return "last day";
  return `${days} day${days === 1 ? "" : "s"} left`;
}
