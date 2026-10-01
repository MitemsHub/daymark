// Client side of the engine worker. Runs the call-over matching inside a
// Web Worker where supported, and falls back to the main thread (same
// result, just on the UI thread) when workers are unavailable.

import { runCallOver, type CallOverResult, type PaymentRow, type StatementLine } from "./callover";
import type { CalloverRequest, CalloverResponse } from "./calloverWorker";

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (r: CallOverResult) => void; req: CalloverRequest }>();

function getWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./calloverWorker.ts", import.meta.url));
    worker.onmessage = (e: MessageEvent<CalloverResponse>) => {
      const entry = pending.get(e.data.id);
      if (entry) {
        pending.delete(e.data.id);
        entry.resolve(e.data.result);
      }
    };
    worker.onerror = () => {
      // A broken worker falls back to the main thread: recompute every
      // pending run from its original inputs, and never spawn again.
      const entries = [...pending.values()];
      pending.clear();
      for (const { resolve, req } of entries) {
        resolve(runCallOver(req.payments, req.statement));
      }
      worker?.terminate();
      worker = null;
    };
    return worker;
  } catch {
    return null;
  }
}

/**
 * Run the call-over matching, off the main thread when the browser allows.
 * The 700ms beat is applied by the caller; this only does the compute.
 */
export function runCallOverAsync(payments: PaymentRow[], statement: StatementLine[]): Promise<CallOverResult> {
  const w = getWorker();
  if (!w) {
    return Promise.resolve(runCallOver(payments, statement));
  }
  const id = nextId++;
  const req: CalloverRequest = { id, payments, statement };
  return new Promise<CallOverResult>((resolve) => {
    pending.set(id, { resolve, req });
    w.postMessage(req);
  });
}
