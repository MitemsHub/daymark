import type { Metadata } from "next";
import { CurrentWeekCard } from "@/components/CurrentWeekCard";
import { WeekRuler } from "@/components/WeekRuler";
import { WeekLookup } from "@/components/WeekLookup";
import { YearTimeline } from "@/components/YearTimeline";

export const metadata: Metadata = {
  title: "Week of the Year",
  description:
    "Current week in the descending countdown, week lookup by date or number, and the full year timeline from Week 52 down to Week 1.",
};

export default function WeekPage() {
  return (
    <div className="space-y-12">
      <header className="max-w-2xl reveal">
        <h1 className="display text-4xl sm:text-5xl mb-3">Week of the Year</h1>
        <p className="text-ink-soft text-lg">
          One countdown for the whole year. Weeks count down from the top toward Week 1.
        </p>
        <p className="text-sm text-ink-faint mt-3 max-w-prose">
          Convention: the year has 53 calendar weeks. Week 1 runs from January 1 to the first
          Sunday and holds the top number, 52. Weeks 2–52 are consecutive Monday–Sunday weeks,
          counting down 51, 50 and so on to 1; the descending number is simply 53 minus the
          calendar week. Week 53 is the year's final partial week, printed on the calendar
          without a number.
        </p>
      </header>

      <CurrentWeekCard />
      <WeekRuler />
      <WeekLookup />
      <YearTimeline />
    </div>
  );
}
