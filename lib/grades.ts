// ─── Member grade lookup & sorting ───────────────────────────────────────────

import type { MemberGrade } from "@/data/memberGrades";
import { matchesQuery } from "@/lib/format";

export type GradeSortKey =
  | "given"
  | "name"
  | "creditLimit"
  | "minContribution"
  | "globalLimit"
  | "annualLimit";

/**
 * Search across the grade name and all four limit figures. Numbers match in
 * raw form (45000000) or formatted form (45,000,000 / ₦45,000,000).
 */
export function searchGrades(grades: MemberGrade[], query: string): MemberGrade[] {
  const q = query.trim();
  if (!q) return grades;
  return grades.filter((g) => {
    const figures = [
      g.creditLimit,
      g.minContribution,
      g.globalLimit,
      g.annualLimit,
    ]
      .flatMap((n) => [String(n), n.toLocaleString("en-NG"), `₦${n.toLocaleString("en-NG")}`]);
    return matchesQuery(g.name, q) || figures.some((f) => f.includes(q));
  });
}

/**
 * "given" preserves the source order: the co-op's seniority order, exactly
 * as recorded. Other keys sort numerically/name-wise with a stable tiebreak
 * on the given order so equal values never shuffle the hierarchy.
 */
export function sortGrades(
  grades: MemberGrade[],
  key: GradeSortKey,
  dir: "asc" | "desc",
): MemberGrade[] {
  if (key === "given") return grades;
  const withIndex = grades.map((g, i) => ({ g, i }));
  withIndex.sort((a, b) => {
    const cmp =
      key === "name"
        ? a.g.name.localeCompare(b.g.name)
        : a.g[key] - b.g[key];
    return cmp !== 0 ? cmp : a.i - b.i;
  });
  const ordered = withIndex.map((x) => x.g);
  return dir === "asc" ? ordered : ordered.reverse();
}
