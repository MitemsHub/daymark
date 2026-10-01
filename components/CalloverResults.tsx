"use client";

import { useEffect, useMemo, useState } from "react";
import type { CallOverResult, PaymentVerdict, CallOverStatus } from "@/lib/callover";
import { downloadCsv } from "@/lib/csvExport";

const STATUS_ORDER: CallOverStatus[] = [
  "Double posted",
  "Partial reversal",
  "Reversed",
  "Short paid",
  "Not found",
  "Paid",
];

const STATUS_TONE: Record<CallOverStatus, string> = {
  Paid: "text-leaf",
  Reversed: "text-stamp",
  "Partial reversal": "text-stamp",
  "Double posted": "text-stamp",
  "Short paid": "text-ink",
  "Not found": "text-ink-faint",
};

function naira(n: number): string {
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Tile({ label, value, tone = "" }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="border hairline bg-white rounded-sm px-3 py-2.5">
      <p className="eyebrow text-[10px]">{label}</p>
      <p className={`tnum display text-2xl ${tone || "text-ink"}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

/**
 * The clears-in badge. Ticking is isolated here so the one-second countdown
 * never re-renders the results tree around it. Taps on the table buttons
 * keep landing on the same stable DOM nodes.
 */
function CountdownBadge({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const clamped = Math.max(0, expiresAt - now);
  const mm = Math.floor(clamped / 60_000);
  const ss = String(Math.floor((clamped % 60_000) / 1000)).padStart(2, "0");
  const urgent = clamped <= 5 * 60_000;

  return (
    <span
      role="timer"
      aria-label={`Session clears in ${mm}:${ss}`}
      className={`tnum text-xs px-2 py-1 rounded-sm border ${
        urgent
          ? "border-stamp bg-stamp-wash text-stamp font-semibold"
          : "hairline text-ink-faint"
      }`}
    >
      clears in {mm}:{ss}
    </span>
  );
}

function VerdictRow({ v, defaultOpen }: { v: PaymentVerdict; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const problem = v.status !== "Paid";
  return (
    <>
      <tr
        className={problem ? "bg-stamp-wash/40" : ""}
        onClick={() => setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
      >
        <td className="num">{v.payment.ref || "\u00a0"}</td>
        <td className="whitespace-normal">{v.payment.beneficiary || "\u00a0"}</td>
        <td className="num">{naira(v.payment.amount)}</td>
        <td className={`font-semibold ${STATUS_TONE[v.status]}`}>
          {v.status}{" "}
          <span className="tnum font-normal text-ink-faint sm:whitespace-nowrap">
            (Found {v.foundCount} {v.foundCount === 1 ? "time" : "times"})
          </span>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={4} className="bg-paper-sunken px-3 py-2">
            {v.note && <p className="text-xs text-ink-soft mb-2">{v.note}</p>}
            {v.probable && (
              <p className="text-xs text-ink-soft mb-2">
                <span className="font-semibold">Probable match:</span> line {v.probable.lineId}: {v.probable.narration}
                <br />
                {v.probable.reason}
              </p>
            )}
            {v.hits.length === 0 ? (
              <p className="text-xs text-ink-faint">No statement line carries this reference.</p>
            ) : (
              <table className="ledger ledger--compact w-full">
                <caption className="sr-only">Statement lines carrying reference {v.payment.ref}</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Narration</th>
                    <th scope="col" className="!text-right">Debit</th>
                    <th scope="col" className="!text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {v.hits.map((h) => (
                    <tr key={h.lineId}>
                      <td className="tnum whitespace-nowrap">{h.dateISO || "\u00a0"}</td>
                      <td className="text-xs">{h.narration}</td>
                      <td className="num">{h.debit > 0 ? naira(h.debit) : ""}</td>
                      <td className="num">{h.credit > 0 ? naira(h.credit) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function CalloverResults({
  result,
  statementName,
  paymentsName,
  onReset,
  onPrint,
  onClearNow,
  expiresAt,
}: {
  result: CallOverResult;
  statementName: string;
  paymentsName: string;
  onReset: () => void;
  onPrint: () => void;
  onClearNow: () => void;
  expiresAt: number | null;
}) {
  const [showPaid, setShowPaid] = useState(false);
  const [showAllOrphans, setShowAllOrphans] = useState(false);
  const [query, setQuery] = useState("");
  // Which section a single-table print is targeting, or null for the full
  // report. While set, print CSS hides every other part of the app.
  const [printSection, setPrintSection] = useState<"problems" | "orphans" | "paid" | null>(null);

  const { verdicts, unexplainedDebits, totals } = result;

  const problems = useMemo(() => {
    const q = query.trim().toUpperCase();
    return verdicts
      .filter((v) => v.status !== "Paid")
      .filter((v) => !q || v.payment.ref.toUpperCase().includes(q) || v.payment.beneficiary.toUpperCase().includes(q))
      .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.payment.id - b.payment.id);
  }, [verdicts, query]);

  const paid = useMemo(() => {
    const q = query.trim().toUpperCase();
    return verdicts
      .filter((v) => v.status === "Paid")
      .filter((v) => !q || v.payment.ref.toUpperCase().includes(q) || v.payment.beneficiary.toUpperCase().includes(q));
  }, [verdicts, query]);

  const runDate = useMemo(() => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), []);

  /**
   * Print one section alone: tag the body and the root, let print CSS hide
   * everything else, then clean up when the dialog closes.
   */
  function printSingle(section: "problems" | "orphans" | "paid") {
    setPrintSection(section);
    // Let the re-render land before the print snapshot is taken.
    setTimeout(() => {
      document.body.classList.add("print-one");
      const done = () => {
        document.body.classList.remove("print-one");
        setPrintSection(null);
        window.removeEventListener("afterprint", done);
      };
      window.addEventListener("afterprint", done);
      window.print();
      // Safety net for browsers that never fire afterprint.
      setTimeout(done, 60_000);
    }, 80);
  }

  return (
    <div data-results-root data-print-section={printSection ?? undefined}>
      {/* Printable header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-semibold">Call-over report</h1>
        <p className="text-sm mt-1">
          Run {runDate} · {statementName} against {paymentsName}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 mb-4 print:hidden">
        <h2 className="eyebrow">Results</h2>
        {expiresAt !== null && <CountdownBadge expiresAt={expiresAt} />}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference or name"
            className="border hairline bg-white rounded-sm px-3 py-2 text-sm w-full sm:w-56"
          />
          <button type="button" onClick={onPrint} className="flex-1 sm:flex-none text-sm px-3 py-2 border border-stamp text-stamp rounded-sm hover:bg-stamp hover:text-white transition-colors font-semibold">
            Print report
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(result)}
            className="flex-1 sm:flex-none text-sm px-3 py-2 border hairline text-ink rounded-sm hover:border-stamp hover:text-stamp transition-colors font-semibold"
          >
            Export CSV
          </button>
          <button type="button" onClick={onReset} className="text-sm text-ink-soft hover:text-stamp px-2 py-2 transition-colors">
            New session
          </button>
          <button
            type="button"
            onClick={onClearNow}
            className="text-sm text-stamp hover:text-stamp-deep px-2 py-2 transition-colors font-semibold"
          >
            Clear now
          </button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        <Tile label="Payments" value={totals.payments} />
        <Tile label="Paid" value={totals.paid} tone="text-leaf" />
        <Tile label="Reversed" value={totals.reversed + totals.partialReversal} tone="text-stamp" />
        <Tile label="Double posted" value={totals.doublePosted} tone="text-stamp" />
        <Tile label="Short paid" value={totals.shortPaid} tone="text-ink" />
        <Tile label="Not found" value={totals.notFound} tone="text-stamp" />
      </div>

      {/* Per-bank breakdown: appears when several statement files were merged */}
      {result.banks && result.banks.length > 1 && (
        <section aria-labelledby="banks-heading" className="mb-6">
          <h3 id="banks-heading" className="eyebrow mb-2">
            Statements in this run ({result.banks.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="ledger ledger--compact">
              <thead>
                <tr>
                  <th scope="col">File</th>
                  <th scope="col">Bank</th>
                  <th scope="col" className="!text-right">Lines</th>
                  <th scope="col" className="!text-right">Debits</th>
                  <th scope="col" className="!text-right">Credits</th>
                  <th scope="col" className="!text-right">Debit total</th>
                  <th scope="col">Dates</th>
                </tr>
              </thead>
              <tbody>
                {result.banks.map((b) => (
                  <tr key={b.file}>
                    <td className="text-xs whitespace-nowrap">{b.file}</td>
                    <td className="whitespace-normal">{b.bank}</td>
                    <td className="num">{b.lines.toLocaleString()}</td>
                    <td className="num">{b.debits.toLocaleString()}</td>
                    <td className="num">{b.credits.toLocaleString()}</td>
                    <td className="num">{naira(b.debitTotal)}</td>
                    <td className="text-xs whitespace-nowrap">{b.dateSpan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Order: problems first, then orphans, then successful payments */}
      <section aria-labelledby="problems-heading" data-area="problems" className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 id="problems-heading" className="eyebrow">
            Payments that did Failed/Invalid ({problems.length})
          </h3>
          <button
            type="button"
            onClick={() => printSingle("problems")}
            className="print:hidden text-sm text-ink-soft hover:text-stamp transition-colors shrink-0 py-1 -my-1"
            aria-label="Print only the Payments that did Failed/Invalid table"
          >
            Print
          </button>
        </div>
        {problems.length === 0 ? (
          <p className="text-sm text-leaf">Every payment is accounted for. Nothing to chase.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="ledger">
              <thead>
                <tr>
                  <th scope="col">Reference</th>
                  <th scope="col">Name</th>
                  <th scope="col" className="!text-right">Amount</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((v) => (
                  <VerdictRow key={v.payment.id} v={v} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Unexplained debits: short list by default, full list behind Show all */}
      {unexplainedDebits.length > 0 && (
        <section className="mb-8" aria-labelledby="orphans-heading" data-area="orphans">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 id="orphans-heading" className="eyebrow">
              Please Upload this Payments ({unexplainedDebits.length}, {naira(totals.unexplainedDebitTotal)})
            </h3>
            <span className="flex items-center gap-3 shrink-0">
              {unexplainedDebits.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllOrphans((s) => !s)}
                  className="text-sm text-ink-soft hover:text-stamp transition-colors py-1 -my-1"
                >
                  {showAllOrphans ? "Hide" : `Show all ${unexplainedDebits.length}`}
                </button>
              )}
              <button
                type="button"
                onClick={() => printSingle("orphans")}
                className="print:hidden text-sm text-ink-soft hover:text-stamp transition-colors py-1 -my-1"
                aria-label="Print only the Please Upload this Payments table"
              >
                Print
              </button>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="ledger ledger--compact">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Narration</th>
                  <th scope="col" className="!text-right">Debit</th>
                </tr>
              </thead>
              <tbody>
                {(printSection === "orphans" || showAllOrphans ? unexplainedDebits : unexplainedDebits.slice(0, 5)).map((l) => (
                  <tr key={l.id}>
                    <td className="tnum whitespace-nowrap">{l.dateISO || "\u00a0"}</td>
                    <td className="text-xs">{l.narration}</td>
                    <td className="num">{naira(l.debit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Successful payments: always rendered, screen-only users can collapse it */}
      <section aria-labelledby="paid-heading" data-area="paid" className="print:mt-6">
        <div className="flex items-center justify-between mb-2 print:hidden">
          <h3 id="paid-heading" className="eyebrow">
            Successful payments ({paid.length})
          </h3>
          <span className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => printSingle("paid")}
              className="text-sm text-ink-soft hover:text-stamp transition-colors"
              aria-label="Print only the Successful payments table"
            >
              Print
            </button>
            <button type="button" onClick={() => setShowPaid((s) => !s)} className="text-sm text-ink-soft hover:text-stamp transition-colors">
              {showPaid ? "Hide" : "Show"}
            </button>
          </span>
        </div>
        <h3 id="paid-heading" className="eyebrow mb-2 hidden print:block">
          Successful payments ({paid.length})
        </h3>
        <div className={showPaid ? "" : "hidden print:block"}>
          <table className="ledger ledger--compact">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Name</th>
                <th scope="col" className="!text-right">Amount</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((v) => (
                <tr key={v.payment.id}>
                  <td className="num">{v.payment.ref}</td>
                  <td className="whitespace-normal">{v.payment.beneficiary}</td>
                  <td className="num">{naira(v.payment.amount)}</td>
                  <td className="text-leaf">
                    Paid{" "}
                    <span className="tnum text-ink-faint sm:whitespace-nowrap">
                      (Found {v.foundCount} {v.foundCount === 1 ? "time" : "times"})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
