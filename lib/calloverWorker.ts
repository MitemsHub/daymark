// Web Worker entry for the Call Over engine. Matching thousands of
// payments against tens of thousands of statement lines stays off the
// main thread, so the upload UI never freezes mid-run.
//
// The engine is pure functions on plain data, so requests and responses
// are structured-cloneable and need no transfer list.

import { runCallOver, type PaymentRow, type StatementLine, type CallOverResult } from "./callover";

export interface CalloverRequest {
  id: number;
  payments: PaymentRow[];
  statement: StatementLine[];
}

export interface CalloverResponse {
  id: number;
  result: CallOverResult;
}

self.onmessage = (e: MessageEvent<CalloverRequest>) => {
  const { id, payments, statement } = e.data;
  const result = runCallOver(payments, statement);
  const response: CalloverResponse = { id, result };
  self.postMessage(response);
};
