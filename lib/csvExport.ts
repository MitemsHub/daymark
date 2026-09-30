// CSV export of the call-over verdicts, one row per payment, Excel-friendly.

import type { CallOverResult } from "./callover";

function csvCell(v: string | number): string {
  const s = String(v);
  // Quoting rule: wrap when the cell contains a comma, quote or newline.
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildVerdictsCsv(result: CallOverResult): string {
  const head = [
    "TRANSACTION REFERENCE",
    "BENEFICIARY NAME",
    "AMOUNT",
    "PAYMENT DUE DATE",
    "STATUS",
    "FOUND (TIMES)",
    "SEEN ON STATEMENT",
    "RETURNED",
    "NOTE",
  ];
  const rows = result.verdicts.map((v) =>
    [
      v.payment.ref,
      v.payment.beneficiary,
      v.payment.amount.toFixed(2),
      v.payment.dueDateISO,
      v.status,
      v.foundCount,
      v.amountSeen.toFixed(2),
      v.amountReturned.toFixed(2),
      v.note ?? "",
    ].map(csvCell).join(","),
  );
  return [head.join(","), ...rows].join("\r\n");
}

export function downloadCsv(result: CallOverResult): void {
  const csv = buildVerdictsCsv(result);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); // BOM so Excel reads UTF-8
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  a.download = `call-over-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
