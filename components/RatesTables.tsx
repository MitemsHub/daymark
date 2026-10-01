"use client";

import type { BondRate, LoanRate } from "@/data/coopRates";
import { formatRate } from "@/lib/format";

const GROUP_LABEL: Record<LoanRate["group"], string> = {
  loan: "Loan rates",
  project: "Project rate",
};

export function LoanRatesTable({ rows }: { rows: LoanRate[] }) {
  const loan = rows.filter((r) => r.group === "loan");
  const project = rows.filter((r) => r.group === "project");
  return (
    <div className="space-y-6">
      <RatesGroup heading={GROUP_LABEL.loan} rows={loan} />
      <RatesGroup heading={GROUP_LABEL.project} rows={project} />
    </div>
  );
}

function RatesGroup({ heading, rows }: { heading: string; rows: LoanRate[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="ledger">
        <caption className="eyebrow sr-only">{heading}</caption>
        <thead>
          <tr>
            <th scope="col" className="!text-left">{heading}</th>
            <th scope="col" className="!text-right">New rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row" className="whitespace-nowrap">{r.name}</th>
              <td className="num font-semibold">
                {typeof r.rate === "number" ? `${formatRate(r.rate)}` : r.rate}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BOND_GROUP_LABEL: Record<BondRate["group"], string> = {
  "4-years": "4 years",
  "2-years": "2 years",
  "1-year": "1 year (Tripple Plan)",
};

export function BondRatesTable({ rows }: { rows: BondRate[] }) {
  const groups: BondRate["group"][] = ["4-years", "2-years", "1-year"];
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g} className="overflow-x-auto">
          <table className="ledger">
            <caption className="eyebrow sr-only">Investment bond rates: {BOND_GROUP_LABEL[g]}</caption>
            <thead>
              <tr>
                <th scope="col" className="!text-left">{BOND_GROUP_LABEL[g]}</th>
                <th scope="col" className="!text-right">New rate</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => r.group === g)
                .map((r) => (
                  <tr key={r.id}>
                    <th scope="row" className="whitespace-nowrap">{r.name}</th>
                    <td className="num font-semibold">{formatRate(r.rate)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
