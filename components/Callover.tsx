"use client";

import { useCallback, useEffect, useState } from "react";
import { runCallOver, DEFAULT_CHARGE_THRESHOLD, type CallOverResult } from "@/lib/callover";
import { CalloverUploader, type CallOverData } from "@/components/CalloverUploader";
import { CalloverResults } from "@/components/CalloverResults";

const SESSION_KEY = "daymark.callover.v1";

interface StoredSession {
  statementName: string;
  paymentsName: string;
  statement: { id: number; dateISO: string; narration: string; debit: number; credit: number }[];
  payments: { id: number; ref: string; beneficiary: string; amount: number; dueDateISO: string }[];
}

export function Callover() {
  const [data, setData] = useState<CallOverData | null>(null);
  const [threshold, setThreshold] = useState(DEFAULT_CHARGE_THRESHOLD);
  const [result, setResult] = useState<CallOverResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore a previous session if one exists.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s: StoredSession = JSON.parse(raw);
        if (s.statement?.length && s.payments?.length) {
          import("@/lib/callover").then(({ toStatementLine, toPaymentRow }) => {
            const statement = s.statement.map((l) => toStatementLine(l.id, { date: l.dateISO, narration: l.narration, debit: l.debit, credit: l.credit }));
            const payments = s.payments.map((p) => toPaymentRow(p.id, { ref: p.ref, beneficiary: p.beneficiary, amount: p.amount, dueDate: p.dueDateISO }));
            setData({ statement, payments, statementName: s.statementName, paymentsName: s.paymentsName });
          });
        }
      }
    } catch {
      // A broken session is the same as no session.
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((d: CallOverData | null) => {
    try {
      if (!d || d.statement.length === 0 || d.payments.length === 0) {
        window.localStorage.removeItem(SESSION_KEY);
        return;
      }
      const s: StoredSession = {
        statementName: d.statementName,
        paymentsName: d.paymentsName,
        statement: d.statement.map((l) => ({ id: l.id, dateISO: l.dateISO, narration: l.narration, debit: l.debit, credit: l.credit })),
        payments: d.payments.map((p) => ({ id: p.id, ref: p.ref, beneficiary: p.beneficiary, amount: p.amount, dueDateISO: p.dueDateISO })),
      };
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    } catch {
      // Storage full or unavailable: the session just lives in memory.
    }
  }, []);

  const onReady = useCallback(
    (d: CallOverData) => {
      setData(d);
      persist(d);
      setResult(null);
    },
    [persist],
  );

  const run = useCallback(() => {
    if (!data) return;
    setResult(runCallOver(data.payments, data.statement, threshold));
  }, [data, threshold]);

  const reset = useCallback(() => {
    setData(null);
    setResult(null);
    persist(null);
  }, [persist]);

  return (
    <section aria-labelledby="callover-heading" className="reveal">
      <h1 id="callover-heading" className="sr-only">
        Call over
      </h1>

      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4 print:hidden">
        <p className="text-sm text-ink-soft max-w-prose">
          Upload the statement and the payment list. Every payment is checked against the statement and
          classified: paid, reversed, double posted, partial, or not found. Reference matching follows the
          call-over rule: ZB/A/006570/5 matches ZBA0065705 but never ZBA00657050.
        </p>
        {!result && (
          <label className="text-sm text-ink-soft whitespace-nowrap">
            Charge threshold{" "}
            <input
              type="number"
              min={0}
              step={500}
              value={threshold}
              onChange={(e) => setThreshold(Math.max(0, Number(e.target.value) || 0))}
              className="tnum border hairline bg-white rounded-sm px-2 py-1.5 w-28 ml-1"
            />
          </label>
        )}
      </div>

      {!result && (
        <div className="mb-6">
          <CalloverUploader onReady={onReady} />
          <button
            type="button"
            onClick={run}
            disabled={!data || data.statement.length === 0 || data.payments.length === 0}
            className="mt-4 text-sm px-4 py-2.5 rounded-sm font-semibold border border-stamp bg-stamp text-white hover:bg-stamp-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Run call-over
          </button>
        </div>
      )}

      {result && data && (
        <CalloverResults result={result} statementName={data.statementName} paymentsName={data.paymentsName} onReset={reset} />
      )}

      {hydrated && !data && !result && (
        <p className="text-xs text-ink-faint mt-8 print:hidden">
          Files stay on this device. A session is remembered in this browser until you start a new one.
        </p>
      )}
    </section>
  );
}
