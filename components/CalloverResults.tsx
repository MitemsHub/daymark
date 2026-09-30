"use client";

import { useMemo, useState } from "react";
import type { CallOverResult, PaymentVerdict, CallOverStatus } from "@/lib/callover";

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
}: {
  result: CallOverResult;
  statementName: string;
  paymentsName: string;
  onReset: () => void;
}) {
  const [showPaid, setShowPaid] = useState(false);
  const [query, setQuery] = useState("");

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

  return (
    <div>
      {/* Printable header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-semibold">Call-over report</h1>
        <p className="text-sm mt-1">
          Run {runDate} · {statementName} against {paymentsName}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 mb-4 print:hidden">
        <h2 className="eyebrow">Results</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference or name"
            className="border hairline bg-white rounded-sm px-3 py-2 text-sm w-full sm:w-56"
          />
          <button type="button" onClick={() => window.print()} className="flex-1 sm:flex-none text-sm px-3 py-2 border border-stamp text-stamp rounded-sm hover:bg-stamp hover:text-white transition-colors font-semibold">
            Print report
          </button>
          <button type="button" onClick={onReset} className="text-sm text-ink-soft hover:text-stamp px-2 py-2 transition-colors">
            New session
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

      {/* Unexplained debits */}
      {unexplainedDebits.length > 0 && (
        <section className="mb-6" aria-labelledby="orphans-heading">
          <h3 id="orphans-heading" className="eyebrow mb-2">
            Statement debits no payment claims ({unexplainedDebits.length}, {naira(totals.unexplainedDebitTotal)})
          </h3>
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
                {unexplainedDebits.slice(0, 50).map((l) => (
                  <tr key={l.id}>
                    <td className="tnum whitespace-nowrap">{l.dateISO || "\u00a0"}</td>
                    <td className="text-xs">{l.narration}</td>
                    <td className="num">{naira(l.debit)}</td>
                  </tr>
                ))}
                {unexplainedDebits.length > 50 && (
                  <tr>
                    <td colSpan={3} className="text-xs text-ink-faint">
                      ...and {unexplainedDebits.length - 50} more.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Problems first */}
      <section aria-labelledby="problems-heading" className="mb-8">
        <h3 id="problems-heading" className="eyebrow mb-2">
          Payments to look at ({problems.length})
        </h3>
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

      {/* Clean payments: always rendered, screen-only users can collapse it */}
      <section aria-labelledby="paid-heading" className="print:mt-6">
        <div className="flex items-center justify-between mb-2 print:hidden">
          <h3 id="paid-heading" className="eyebrow">
            Clean payments ({paid.length})
          </h3>
          <button type="button" onClick={() => setShowPaid((s) => !s)} className="text-sm text-ink-soft hover:text-stamp transition-colors">
            {showPaid ? "Hide" : "Show"}
          </button>
        </div>
        <h3 id="paid-heading" className="eyebrow mb-2 hidden print:block">
          Clean payments ({paid.length})
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
