"use client";

import { useEffect, useState } from "react";
import { investmentSeries } from "@/data/investmentSeries";
import { getInvestmentStatus } from "@/lib/investments";

export function ActiveSeriesWidget() {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const active = today
    ? investmentSeries.filter((s) => getInvestmentStatus(s, today) === "Active")
    : [];

  return (
    <div>
      <p className="eyebrow mb-1">Active investment series</p>
      <p className="display tnum text-4xl">
        {today ? active.length : "\u00A0"}
      </p>
      <p className="text-sm text-ink-soft mt-1">
        {today ? active.map((s) => s.name).join(" · ") : "Loading…"}
      </p>
    </div>
  );
}
