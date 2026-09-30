"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runCallOver, type CallOverResult } from "@/lib/callover";
import { buildReportHtml, printReportHtml } from "@/lib/report";
import { CalloverUploader, type CallOverData } from "@/components/CalloverUploader";
import { CalloverResults } from "@/components/CalloverResults";

const SESSION_KEY = "daymark.callover.v2";
const SESSION_TTL_MS = 60 * 60 * 1000; // one hour after results show

interface StoredSession {
  savedAt: number;
  statementFiles: string[];
  paymentsFiles: string[];
  statement: { id: number; dateISO: string; narration: string; debit: number; credit: number }[];
  payments: { id: number; ref: string; beneficiary: string; amount: number; dueDateISO: string }[];
}

export function Callover() {
  const [data, setData] = useState<CallOverData | null>(null);
  const [result, setResult] = useState<CallOverResult | null>(null);
  const [running, setRunning] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSession = useCallback(() => {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Storage unavailable: nothing to clear.
    }
  }, []);

  // Restore a previous session if one exists and it is still fresh.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s: StoredSession = JSON.parse(raw);
        const fresh = Date.now() - s.savedAt < SESSION_TTL_MS;
        if (fresh && s.statement?.length && s.payments?.length) {
          import("@/lib/callover").then(({ toStatementLine, toPaymentRow }) => {
            const statement = s.statement.map((l) => toStatementLine(l.id, { date: l.dateISO, narration: l.narration, debit: l.debit, credit: l.credit }));
            const payments = s.payments.map((p) => toPaymentRow(p.id, { ref: p.ref, beneficiary: p.beneficiary, amount: p.amount, dueDate: p.dueDateISO }));
            setData({
              statement,
              payments,
              statementFiles: s.statementFiles,
              paymentsFiles: s.paymentsFiles,
              statementName: s.statementFiles.join(", "),
              paymentsName: s.paymentsFiles.join(", "),
            });
            setExpiresAt(s.savedAt + SESSION_TTL_MS);
          });
        } else {
          clearSession();
        }
      }
    } catch {
      // A broken session is the same as no session.
    }
    setHydrated(true);
  }, [clearSession]);

  // The countdown ticker, running only while a session is live.
  useEffect(() => {
    if (expiresAt === null) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [expiresAt]);

  const wipe = useCallback(() => {
    setData(null);
    setResult(null);
    setExpiresAt(null);
    clearSession();
  }, [clearSession]);

  // When the hour is up, everything goes.
  useEffect(() => {
    if (expiresAt !== null && now >= expiresAt) wipe();
  }, [now, expiresAt, wipe]);

  const persist = useCallback(
    (d: CallOverData | null) => {
      try {
        if (!d || d.statement.length === 0 || d.payments.length === 0) {
          clearSession();
          return;
        }
        const s: StoredSession = {
          savedAt: Date.now(),
          statementFiles: d.statementFiles,
          paymentsFiles: d.paymentsFiles,
          statement: d.statement.map((l) => ({ id: l.id, dateISO: l.dateISO, narration: l.narration, debit: l.debit, credit: l.credit })),
          payments: d.payments.map((p) => ({ id: p.id, ref: p.ref, beneficiary: p.beneficiary, amount: p.amount, dueDateISO: p.dueDateISO })),
        };
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      } catch {
        // Storage full or unavailable: the session just lives in memory.
      }
    },
    [clearSession],
  );

  const onReady = useCallback(
    (d: CallOverData) => {
      setData(d);
      setResult(null);
      setExpiresAt(null);
      persist(d);
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
      // The hour starts when the results show.
      const at = Date.now() + SESSION_TTL_MS;
      setExpiresAt(at);
      persist({ ...data });
      try {
        const raw = window.localStorage.getItem(SESSION_KEY);
        if (raw) {
          const s: StoredSession = JSON.parse(raw);
          s.savedAt = Date.now();
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
        }
      } catch {
        // ignore
      }
    });
  }, [data, running, persist]);

  const print = useCallback(() => {
    if (!result || !data) return;
    printReportHtml(
      buildReportHtml(result, {
        statementFiles: data.statementFiles.length > 0 ? data.statementFiles : [data.statementName],
        paymentsFiles: data.paymentsFiles.length > 0 ? data.paymentsFiles : [data.paymentsName],
        runDate: new Date(),
      }),
    );
  }, [result, data]);

  const minutesLeft = expiresAt !== null ? Math.max(0, Math.ceil((expiresAt - now) / 60_000)) : null;

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
        <CalloverResults
          result={result}
          statementName={data.statementName}
          paymentsName={data.paymentsName}
          onReset={wipe}
          onPrint={print}
          onClearNow={wipe}
          expiresAt={expiresAt}
        />
      )}

      {minutesLeft !== null && (
        <p className="text-xs text-ink-faint mt-4 print:hidden" role="timer" aria-live="off">
          This session, including the files you uploaded, clears itself in {minutesLeft} minute{minutesLeft === 1 ? "" : "s"}.
        </p>
      )}

      {hydrated && !data && !result && (
        <p className="text-xs text-ink-faint mt-8 print:hidden">
          Files never leave this device or reach any storage. A session clears itself one hour after results show.
        </p>
      )}
    </section>
  );
}
