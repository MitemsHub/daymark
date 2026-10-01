"use client";

import { useEffect, useMemo, useState } from "react";
import type { InvestmentOption, InvestmentSeries } from "@/data/investmentSeries";
import { useEditableData, defaultSeries } from "@/lib/dataStore";
import { matchesQuery } from "@/lib/format";
import { getInvestmentStatus } from "@/lib/investments";
import { SeriesDetail } from "@/components/SeriesDetail";
import { FieldLabel, StatusNote } from "@/components/ui";
import { formatRate } from "@/lib/format";

const INTEREST_TYPES = ["MONTHLY", "QUARTERLY", "HALF YEARLY", "ANNUAL UPFRONT", "ANNUAL BACKEND"];

export function InvestmentExplorer() {
  const { rows, isEdited } = useEditableData("series", defaultSeries);
  const [today, setToday] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setToday(new Date());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    return rows.filter((s) => {
      if (typeFilter && !s.options.some((o) => o.interestType === typeFilter)) return false;
      if (today && statusFilter && getInvestmentStatus(s, today) !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        s.name,
        s.startDate,
        s.endDate ?? "",
        ...s.options.flatMap((o: InvestmentOption) => [
          o.interestType,
          String(o.rate),
          formatRate(o.rate),
          `${o.rate}%`,
          o.period ?? "",
          formatRate(o.penaltyCharge),
        ]),
      ];
      return haystack.some((v) => matchesQuery(v, q));
    });
  }, [rows, query, typeFilter, statusFilter, today]);

  return (
    <section aria-labelledby="explorer-heading">
      <h2 id="explorer-heading" className="sr-only">
        Investment series reference
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <FieldLabel htmlFor="inv-search">Search</FieldLabel>
          <input
            id="inv-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Classic Diamond, 17.25%, Annual Backend…"
            className="w-full border hairline bg-white rounded-sm px-3 py-2 text-sm"
          />
        </div>
        <div>
          <FieldLabel htmlFor="inv-type">Interest type</FieldLabel>
          <select
            id="inv-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full border hairline bg-white rounded-sm px-3 py-2 text-sm"
          >
            <option value="">All types</option>
            {INTEREST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="inv-status">Status</FieldLabel>
          <select
            id="inv-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border hairline bg-white rounded-sm px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Upcoming">Upcoming</option>
          </select>
        </div>
      </div>

      {isEdited && (
        <StatusNote kind="info">
          Showing your locally edited series. Manage them on the Data page.
        </StatusNote>
      )}

      {today && filtered.length === 0 ? (
        <p role="status" className="text-sm text-ink-soft py-8">
          No series match. Clear the search or filters to see all {rows.length}.
        </p>
      ) : (
        <ul className="mt-4 border-t hairline stagger">
          {today &&
            filtered.map((s: InvestmentSeries) => (
              <SeriesDetail key={s.id} series={s} today={today} />
            ))}
        </ul>
      )}
    </section>
  );
}
