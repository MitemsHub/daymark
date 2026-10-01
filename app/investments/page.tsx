import type { Metadata } from "next";
import { InvestmentExplorer } from "@/components/InvestmentExplorer";
import { LoanRatesTable, BondRatesTable } from "@/components/RatesTables";
import { bondRates, loanRates } from "@/data/coopRates";

export const metadata: Metadata = {
  title: "Rates",
  description:
    "Co-op loan rates, investment bond rates and investment series: new rates, periods, penalty charges and anniversary calendars.",
};

export default function InvestmentsPage() {
  return (
    <div className="space-y-12">
      <header className="max-w-2xl reveal">
        <h1 className="display text-4xl sm:text-5xl mb-3">Rates</h1>
        <p className="text-ink-soft text-lg">
          Loan rates, investment bond rates and the investment series reference. The tables show
          the new rates; select a series to open its details.
        </p>
      </header>

      {/* Two columns on large screens so the short rate tables share the
          width instead of stacking; they fold back to one column on phones. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-12 items-start">
        <section aria-labelledby="loan-rates-heading">
          <h2 id="loan-rates-heading" className="eyebrow mb-3">
            Loan rates
          </h2>
          <LoanRatesTable rows={loanRates} />
        </section>

        <section aria-labelledby="bond-rates-heading">
          <h2 id="bond-rates-heading" className="eyebrow mb-3">
            Investment bond rates
          </h2>
          <BondRatesTable rows={bondRates} />
        </section>
      </div>

      <section aria-labelledby="series-heading">
        <h2 id="series-heading" className="eyebrow mb-3">
          Investment series
        </h2>
        <InvestmentExplorer />
      </section>
    </div>
  );
}
