import type { Metadata } from "next";
import { InvestmentExplorer } from "@/components/InvestmentExplorer";

export const metadata: Metadata = {
  title: "Investment Series",
  description:
    "Quick reference for co-op investment series: rates, interest periods, penalty charges and anniversary calendars.",
};

export default function InvestmentsPage() {
  return (
    <div className="space-y-10">
      <header className="max-w-2xl reveal">
        <h1 className="display text-4xl sm:text-5xl mb-3">Investment Series</h1>
        <p className="text-ink-soft text-lg">
          Rates, periods and anniversary calendars for every series. Select one to open its details.
        </p>
      </header>
      <InvestmentExplorer />
    </div>
  );
}
