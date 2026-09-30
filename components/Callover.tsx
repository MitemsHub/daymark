"use client";

import { useCallback, useEffect, useState } from "react";
import { runCallOver, type CallOverResult } from "@/lib/callover";
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
  const [result, setResult] = useState<CallOverResult | null>(null);
  const [running, setRunning] = useState(false);
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
    if (!data || running) return;
    setRunning(true);
    // A beat of matching animation so short runs are still visible.
    const work = new Promise<CallOverResult>((resolve) => {
      setTimeout(() => resolve(runCallOver(data.payments, data.statement)), 700);
    });
    work.then((r) => {
      setResult(r);
      setRunning(false);
    });
  }, [data, running]);

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

      {!result && (
        <div className="mb-6">
          <CalloverUploader onReady={onReady} />
          <button
            type="button"
            onClick={run}
            disabled={!data || data.statement.length === 0 || data.payments.length === 0 || running}
            className="mt-4 w-full sm:w-auto text-sm px-6 py-2.5 rounded-sm font-semibold border border-stamp bg-stamp text-white hover:bg-stamp-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative overflow-hidden"
          >
            {running && data ? (
              <span className="inline-flex items-center gap-2.5">
                <span className="spinner" aria-hidden="true" />
                Matching {data.payments.length.toLocaleString()} payments against {data.statement.length.toLocaleString()} lines
                <span className="dots" aria-hidden="true" />
              </span>
            ) : (
              "Run call-over"
            )}
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
