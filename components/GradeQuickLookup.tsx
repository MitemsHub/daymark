"use client";

import { useState } from "react";
import type { MemberGrade } from "@/data/memberGrades";
import { formatLimit, formatNaira } from "@/lib/format";

export function GradeQuickLookup({ grades }: { grades: MemberGrade[] }) {
  const [selectedId, setSelectedId] = useState("");
  const selected = grades.find((g) => g.id === selectedId) ?? null;

  return (
    <section aria-labelledby="quick-grade-heading">
      <h2 id="quick-grade-heading" className="eyebrow mb-3">
        Check member grade
      </h2>
      <div className="sm:max-w-sm">
        <label htmlFor="grade-select" className="sr-only">
          Select grade
        </label>
        <select
          id="grade-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full border hairline bg-white rounded-sm px-3 py-2.5 text-sm"
        >
          <option value="">Select grade…</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite" className="mt-5">
        {selected ? (
          <div key={selected.id} className="border-l-4 border-stamp pl-5 swap-in">
            <p className="display text-xl mb-4">{selected.name}</p>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-5">
              <div className="border-t-2 border-ink pt-3">
                <dt className="eyebrow mb-1.5">Credit limit</dt>
                <dd className="tnum text-xl sm:text-3xl font-semibold min-w-0 break-words">{formatLimit(selected.creditLimit)}</dd>
              </div>
              <div className="border-t-2 border-ink pt-3">
                <dt className="eyebrow mb-1.5">Min. contribution</dt>
                <dd className="tnum text-xl sm:text-3xl font-semibold min-w-0 break-words">{formatLimit(selected.minContribution)}</dd>
              </div>
              <div className="border-t-2 border-ink pt-3">
                <dt className="eyebrow mb-1.5">Global limit</dt>
                <dd className="tnum text-xl sm:text-3xl font-semibold min-w-0 break-words">{formatLimit(selected.globalLimit)}</dd>
              </div>
              <div className="border-t-2 border-ink pt-3">
                <dt className="eyebrow mb-1.5">Annual limit</dt>
                <dd className="tnum text-xl sm:text-3xl font-semibold min-w-0 break-words">{formatLimit(selected.annualLimit)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="text-sm text-ink-faint">Select a grade to see its four limits.</p>
        )}
      </div>
    </section>
  );
}
