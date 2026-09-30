"use client";

import { useState } from "react";
import type { InvestmentSeries } from "@/data/investmentSeries";
import { formatLong } from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import { formatRate } from "@/lib/format";
import {
  getCurrentAnniversary,
  getInvestmentStatus,
} from "@/lib/investments";

const STATUS_STYLE: Record<string, string> = {
  Active: "text-leaf bg-leaf-wash",
  Expired: "text-ink-faint bg-paper-sunken",
  Upcoming: "text-stamp bg-stamp-wash",
};

export function SeriesDetail({ series, today }: { series: InvestmentSeries; today: Date }) {
  const [open, setOpen] = useState(false);
  const status = getInvestmentStatus(series, today);
  const ann = getCurrentAnniversary(series, today);
  const startMonthName = new Date(2020, series.anniversaryStartMonth - 1, 1).toLocaleDateString(
    "en-GB",
    { month: "long" },
  );
  const endMonthName = new Date(2020, series.anniversaryEndMonth - 1, 1).toLocaleDateString(
    "en-GB",
    { month: "long" },
  );

  return (
    <li className="border-b hairline">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left py-4 grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_1fr_auto] gap-x-4 gap-y-1 items-baseline hover:bg-white/60 transition-colors px-2 -mx-2 rounded-sm"
      >
        <span className="font-semibold">{series.name}</span>
        <span className="tnum text-xs text-ink-soft hidden sm:block">
          {formatLong(series.startDate)} → {series.endDate ? formatLong(series.endDate) : "Not specified"}
        </span>
        <span className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-sm ${STATUS_STYLE[status]}`}>{status}</span>
          <span aria-hidden="true" className={`text-ink-faint text-sm transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
            +
          </span>
        </span>
      </button>

      <div className={`expand ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="expand-inner">
          <div className="pb-6 pt-1 px-2 -mx-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 mb-8 stagger">
          <div className="border-t-2 border-ink/80 pt-2.5">
            <p className="eyebrow mb-1.5">Investment start</p>
            <p className="tnum text-sm font-semibold">{formatLong(series.startDate)}</p>
          </div>
          <div className="border-t-2 border-ink/80 pt-2.5">
            <p className="eyebrow mb-1.5">Maturity / end</p>
            <p className="tnum text-sm font-semibold">
              {series.endDate ? formatLong(series.endDate) : "Not specified"}
            </p>
          </div>
          <div className="border-t-2 border-ink/80 pt-2.5">
            <p className="eyebrow mb-1.5">Current status</p>
            <p className="text-sm font-semibold">{status}</p>
          </div>
          <div className="border-t-2 border-ink/80 pt-2.5">
            <p className="eyebrow mb-1.5">Anniversary year</p>
            <p className="tnum text-sm font-semibold">
              {startMonthName} → {endMonthName}
            </p>
          </div>
          <div className="border-t-2 border-ink/80 pt-2.5">
            <p className="eyebrow mb-1.5">Current anniversary period</p>
            <p className="tnum text-sm font-semibold">
              {formatLong(ann.currentStart)}
              <br />– {formatLong(ann.currentEnd)}
            </p>
          </div>
          <div className="border-t-2 border-ink/80 pt-2.5">
            <p className="eyebrow mb-1.5">Next anniversary</p>
            <p className="tnum text-sm font-semibold">{formatLong(ann.nextStart)}</p>
          </div>
          <div className="border-t-2 border-ink/80 pt-2.5">
            <p className="eyebrow mb-1.5">Days until anniversary</p>
            <p className="tnum text-2xl font-semibold text-stamp">{ann.daysUntilNext}</p>
          </div>
          <div className="border-t-2 border-ink/80 pt-2.5">
            <p className="eyebrow mb-1.5">Anniversary count</p>
            <p className="tnum text-sm font-semibold">
              {ann.anniversaryNumber === null ? "First year" : `#${ann.anniversaryNumber}`}
            </p>
          </div>
        </div>

          <div className="overflow-x-auto">
            <table className="ledger min-w-[560px]">
              <caption className="sr-only">Interest types, rates, periods and penalty charges for {series.name}</caption>
              <thead>
                <tr>
                  <th scope="col">Interest type</th>
                  <th scope="col" className="!text-right">Rate</th>
                  <th scope="col">Period</th>
                  <th scope="col" className="!text-right">Penalty</th>
                </tr>
              </thead>
              <tbody>
                {series.options.map((opt) => (
                  <tr key={opt.interestType}>
                    <th scope="row" className="whitespace-nowrap">{opt.interestType}</th>
                    <td className="num font-semibold">{formatRate(opt.rate)}</td>
                    <td className="text-ink-soft text-xs leading-relaxed">{opt.period ?? "Not specified"}</td>
                    <td className="num">{formatRate(opt.penaltyCharge)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </div>
    </li>
  );
}
