// ─── Formatting & small utilities ────────────────────────────────────────────

/** ₦2,000,000: Naira, grouping commas, never decimals. */
export function formatNaira(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

/** ₦2,000,000: Naira, grouping commas, never decimals. Zeros stay ₦0: the
 * source lists them, and "no access" is a real value. Use "Not specified"
 * text (not a dash) for genuinely missing fields. */
export function formatLimit(n: number): string {
  return formatNaira(n);
}

/** "17.25%" without trailing-zero noise (17 → "17%", 17.5 → "17.5%"). */
export function formatRate(rate: number): string {
  const s = String(rate);
  return `${s}%`;
}

/** "50%" penalty charge. */
export function formatPenalty(p: number): string {
  return `${p}%`;
}

/** True when `value` contains every whitespace-separated token in `query`. */
export function matchesQuery(value: string, query: string): boolean {
  const v = value.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => v.includes(token));
}
