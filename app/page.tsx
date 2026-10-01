import type { Metadata } from "next";
import { DateCalculator } from "@/components/DateCalculator";
import { ReverseCalculator } from "@/components/ReverseCalculator";
import { AccountsWidget } from "@/components/AccountsWidget";

export const metadata: Metadata = {
  title: "Date & Week Calculator",
  description:
    "+ Today and − Today day counts, weeks and months between two dates, with the year's descending week countdown alongside.",
};

export default function HomePage() {
  return (
    <div className="space-y-14">
      <header className="max-w-2xl reveal">
        <h1 className="display text-4xl sm:text-5xl mb-3">Date &amp; Week Calculator</h1>
        <p className="text-ink-soft text-lg">
          Calculate dates, durations and weeks instantly.
        </p>
      </header>

      <DateCalculator />
      <ReverseCalculator />

      <section aria-labelledby="quick-heading" className="border-t hairline pt-8 reveal delay-2">
        <h2 id="quick-heading" className="eyebrow mb-5">
          Quick reference
        </h2>
        <AccountsWidget />
      </section>
    </div>
  );
}
