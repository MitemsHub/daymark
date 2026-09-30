// Builds the printable call-over report as one self-contained HTML string.
// Printed from a hidden iframe, so nothing about the app's own CSS,
// animations or collapsed sections can affect what comes out of the printer.

import type { CallOverResult, PaymentVerdict, RefHit } from "./callover";

export interface ReportMeta {
  statementFiles: string[];
  paymentsFiles: string[];
  runDate: Date;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function naira(n: number): string {
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** The whole report: header, summary, unexplained debits, problems, clean list. */
export function buildReportHtml(result: CallOverResult, meta: ReportMeta): string {
  const { verdicts, unexplainedDebits, totals } = result;
  const run = meta.runDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const order = ["Double posted", "Partial reversal", "Reversed", "Short paid", "Not found", "Paid"];
  const rank = (s: string) => order.indexOf(s);
  const problems = verdicts
    .filter((v) => v.status !== "Paid")
    .sort((a, b) => rank(a.status) - rank(b.status) || a.payment.id - b.payment.id);
  const paid = verdicts.filter((v) => v.status === "Paid");

  const stamp = "#8f3813";
  const ink = "#16302b";
  const faint = "#5d6f6c";
  const line = "#c9c2b4";

  const th = `text-align:left;padding:4px 6px;border-bottom:1.5pt solid ${ink};font-size:8.5pt;letter-spacing:0.06em;color:${ink}`;
  const td = `padding:3.5px 6px;border-bottom:0.5pt solid ${line};font-size:9pt;vertical-align:top`;
  const num = "text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap";

  const summary = [
    ["Payments", totals.payments],
    ["Paid", totals.paid],
    ["Reversed", totals.reversed + totals.partialReversal],
    ["Double posted", totals.doublePosted],
    ["Short paid", totals.shortPaid],
    ["Not found", totals.notFound],
  ]
    .map(
      ([l, v]) =>
        `<div style="border:0.75pt solid ${line};padding:5px 8px;min-width:74px"><div style="font-size:7pt;letter-spacing:0.08em;color:${faint}">${l}</div><div style="font-size:14pt;font-variant-numeric:tabular-nums;color:${ink}">${v}</div></div>`,
    )
    .join("");

  const orphans =
    unexplainedDebits.length > 0
      ? `<h2 style="font-size:10pt;letter-spacing:0.08em;color:${ink};margin:16px 0 4px">STATEMENT DEBITS NO PAYMENT CLAIMS (${unexplainedDebits.length} · ${naira(totals.unexplainedDebitTotal)})</h2>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr><th style="${th}">DATE</th><th style="${th}">NARRATION</th><th style="${th + ";" + num}">DEBIT</th></tr></thead>
    <tbody>${unexplainedDebits
      .map(
        (l) =>
          `<tr><td style="${td};white-space:nowrap">${esc(l.dateISO)}</td><td style="${td}">${esc(l.narration)}</td><td style="${td + ";" + num}">${naira(l.debit)}</td></tr>`,
      )
      .join("")}</tbody>
  </table>`
      : "";

  const evidence = (v: PaymentVerdict) =>
    v.hits.length === 0
      ? `<div style="font-size:8.5pt;color:${faint};padding:3px 6px 7px">No statement line carries this reference.</div>`
      : `<table style="width:100%;border-collapse:collapse;margin:2px 0 8px">
    <tbody>${v.hits
      .map(
        (h: RefHit) =>
          `<tr><td style="${td};white-space:nowrap;font-size:8.5pt">${esc(h.dateISO)}</td><td style="${td};font-size:8.5pt">${esc(h.narration)}</td><td style="${td + ";" + num};font-size:8.5pt">${h.debit > 0 ? naira(h.debit) : ""}</td><td style="${td + ";" + num};font-size:8.5pt">${h.credit > 0 ? naira(h.credit) : ""}</td></tr>`,
      )
      .join("")}</tbody>
  </table>`;

  const problemsHtml =
    problems.length === 0
      ? `<p style="font-size:10pt;color:${ink}">Every payment is accounted for. Nothing to chase.</p>`
      : `<table style="width:100%;border-collapse:collapse">
    <thead><tr><th style="${th}">REFERENCE</th><th style="${th}">NAME</th><th style="${th + ";" + num}">AMOUNT</th><th style="${th}">STATUS</th></tr></thead>
    <tbody>${problems
      .map((v) => {
        const tone = v.status === "Not found" ? faint : stamp;
        return `<tr><td style="${td};font-variant-numeric:tabular-nums">${esc(v.payment.ref)}</td><td style="${td}">${esc(v.payment.beneficiary)}</td><td style="${td + ";" + num}">${naira(v.payment.amount)}</td><td style="${td};color:${tone};font-weight:600">${esc(v.status)} (Found ${v.foundCount} ${v.foundCount === 1 ? "time" : "times"})</td></tr>
      <tr><td></td><td colspan="3" style="padding:0 6px">${v.note ? `<div style="font-size:8pt;color:${faint};padding:2px 0">${esc(v.note)}</div>` : ""}${evidence(v)}</td></tr>`;
      })
      .join("")}</tbody>
  </table>`;

  const paidHtml = `<h2 style="font-size:10pt;letter-spacing:0.08em;color:${ink};margin:18px 0 4px">CLEAN PAYMENTS (${paid.length})</h2>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr><th style="${th}">REFERENCE</th><th style="${th}">NAME</th><th style="${th + ";" + num}">AMOUNT</th><th style="${th}">STATUS</th></tr></thead>
    <tbody>${paid
      .map(
        (v) =>
          `<tr><td style="${td};font-variant-numeric:tabular-nums">${esc(v.payment.ref)}</td><td style="${td}">${esc(v.payment.beneficiary)}</td><td style="${td + ";" + num}">${naira(v.payment.amount)}</td><td style="${td};color:#2e6b4f">Paid (Found ${v.foundCount} ${v.foundCount === 1 ? "time" : "times"})</td></tr>`,
      )
      .join("")}</tbody>
  </table>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Call-over report</title>
<style>
  @page { size: A4; margin: 13mm 11mm; }
  html, body { background: #fff; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: ${ink}; margin: 0; }
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
  h2 { page-break-after: avoid; }
</style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2pt solid ${ink};padding-bottom:6px">
    <div>
      <div style="font-size:16pt;font-weight:700">Call-over report</div>
      <div style="font-size:9pt;color:${faint};margin-top:2px">Run ${esc(run)}</div>
    </div>
    <div style="font-size:8pt;color:${faint};text-align:right;max-width:60%">
      ${esc(meta.statementFiles.join(", "))}<br>against ${esc(meta.paymentsFiles.join(", "))}
    </div>
  </div>

  <div style="display:flex;gap:8px;margin:12px 0 4px;flex-wrap:wrap">${summary}</div>

  ${orphans}

  <h2 style="font-size:10pt;letter-spacing:0.08em;color:${ink};margin:16px 0 4px">PAYMENTS TO LOOK AT (${problems.length})</h2>
  ${problemsHtml}

  ${paidHtml}
</body>
</html>`;
}

/** Open a print dialog on a self-contained document. */
export function printReportHtml(html: string): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    document.body.removeChild(frame);
    // Last resort: a new window.
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const go = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      setTimeout(() => document.body.removeChild(frame), 60_000);
    }
  };
  if (doc.readyState === "complete") setTimeout(go, 50);
  else frame.onload = () => setTimeout(go, 50);
}
