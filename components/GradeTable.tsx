"use client";

import { useMemo, useState } from "react";
import type { MemberGrade } from "@/data/memberGrades";
import { searchGrades, sortGrades, type GradeSortKey } from "@/lib/grades";
import { formatLimit } from "@/lib/format";

const COLUMNS: { key: GradeSortKey; label: string; numeric: boolean }[] = [
  { key: "creditLimit", label: "Credit limit", numeric: true },
  { key: "minContribution", label: "Min. contribution", numeric: true },
  { key: "globalLimit", label: "Global limit", numeric: true },
  { key: "annualLimit", label: "Annual limit", numeric: true },
];

export function GradeTable({ grades }: { grades: MemberGrade[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<GradeSortKey>("given");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const visible = useMemo(
    () => sortGrades(searchGrades(grades, query), sortKey, sortDir),
    [grades, query, sortKey, sortDir],
  );

  function toggleSort(key: GradeSortKey) {
    if (key === sortKey) {
      if (key !== "given") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const nameSorted = sortKey === "name";

  return (
    <section aria-labelledby="grade-table-heading">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <h2 id="grade-table-heading" className="eyebrow">
          All grades
        </h2>
        <div className="w-full sm:w-72">
          <label htmlFor="grade-search" className="sr-only">
            Search grades
          </label>
          <input
            id="grade-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or amount…"
            className="w-full border hairline bg-white rounded-sm px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Desktop ledger */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="ledger">
          <caption className="sr-only">
            Member grades in seniority order with credit, contribution, global and annual limits
          </caption>
          <thead>
            <tr>
              <th scope="col" aria-sort={sortKey === "given" ? "ascending" : "none"}>
                <button type="button" onClick={() => toggleSort("given")} className="hover:text-stamp transition-colors uppercase tracking-[0.12em]">
                  Rank
                  {sortKey === "given" && <span aria-hidden="true" className="ml-1 text-stamp">↑</span>}
                </button>
              </th>
              <th scope="col" aria-sort={nameSorted ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                <button type="button" onClick={() => toggleSort("name")} className="hover:text-stamp transition-colors uppercase tracking-[0.12em]">
                  Name
                  {nameSorted && <span aria-hidden="true" className="ml-1 text-stamp">{sortDir === "asc" ? "↑" : "↓"}</span>}
                </button>
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className={col.numeric ? "!text-right" : ""}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="hover:text-stamp transition-colors uppercase tracking-[0.12em]"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span aria-hidden="true" className="ml-1 text-stamp">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody key={`${query}-${sortKey}-${sortDir}`}>
            {visible.map((g) => {
              const rank = grades.findIndex((x) => x.id === g.id) + 1;
              return (
                <tr key={g.id}>
                  <td className="rank">{String(rank).padStart(2, "0")}</td>
                  <th scope="row">{g.name}</th>
                  <td className="num">{formatLimit(g.creditLimit)}</td>
                  <td className="num">{formatLimit(g.minContribution)}</td>
                  <td className="num">{formatLimit(g.globalLimit)}</td>
                  <td className="num">{formatLimit(g.annualLimit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p role="status" className="py-6 text-sm text-ink-soft">
            No grades match “{query}”.
          </p>
        )}
      </div>

      {/* Mobile cards */}
      <ul className="sm:hidden divide-y hairline border-t-2 border-ink">
        {visible.map((g) => {
          const rank = grades.findIndex((x) => x.id === g.id) + 1;
          return (
            <li key={g.id} className="py-3">
              <p className="font-semibold mb-1">
                <span className="tnum text-ink-faint text-xs mr-2">{String(rank).padStart(2, "0")}</span>
                {g.name}
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {COLUMNS.map((col) => (
                  <div key={col.key} className="flex justify-between gap-2">
                    <dt className="text-ink-soft">{col.label}</dt>
                    <dd className="tnum font-medium">{formatLimit(g[col.key as keyof MemberGrade] as number)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="py-6 text-sm text-ink-soft" role="status">
            No grades match “{query}”.
          </li>
        )}
      </ul>
    </section>
  );
}
