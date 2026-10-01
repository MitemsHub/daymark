"use client";

import { useCallback, useRef, useState } from "react";
import {
  readWorkbook,
  autoExtract,
  findStatementColumns,
  findPaymentColumns,
  statementLinesFromSheet,
  paymentsFromSheet,
  type ParsedWorkbook,
} from "@/lib/tableParse";
import type { StatementLine, PaymentRow } from "@/lib/callover";

export interface CallOverData {
  statement: StatementLine[];
  payments: PaymentRow[];
  statementFiles: string[];
  paymentsFiles: string[];
  /** kept for the localStorage session shape */
  statementName: string;
  paymentsName: string;
}

interface SideState {
  name: string;
  kind: string;
  status: "idle" | "working" | "done" | "error";
  message: string;
}

const emptySide: SideState = { name: "", kind: "", status: "idle", message: "" };

function fmtSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} kB`;
}

function DropZone({
  side,
  state,
  onFiles,
  onClear,
}: {
  side: "statement" | "payments";
  state: SideState;
  onFiles: (files: File[]) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const label = side === "statement" ? "Bank statement" : "Payments";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Upload ${label}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const files = [...(e.dataTransfer.files ?? [])];
        if (files.length > 0) onFiles(files);
      }}
      className={`border border-dashed rounded-md p-5 cursor-pointer transition-colors reveal delay-1 ${
        drag ? "border-stamp bg-stamp-wash" : "hairline hover:border-ink-faint bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".xls,.xlsx,.csv,.pdf"
        className="sr-only"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          if (files.length > 0) onFiles(files);
          e.target.value = "";
        }}
      />
      <div className="flex items-baseline justify-between gap-2">
        <p className="eyebrow">{label}</p>
        {state.status === "done" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="text-xs text-ink-faint hover:text-stamp transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {state.status === "idle" && (
        <p className="text-sm text-ink-soft mt-2">
          Drop {label.toLowerCase()} file(s) here, or click to choose. Excel (.xls, .xlsx), CSV or PDF. Several files are merged.
        </p>
      )}
      {state.status === "working" && <p className="text-sm text-ink-soft mt-2">Reading {state.name}...</p>}
      {state.status === "done" && (
        <div className="mt-2">
          <p className="text-sm font-medium text-ink">{state.name}</p>
          <p className="text-xs text-ink-faint tnum">{state.message}</p>
        </div>
      )}
      {state.status === "error" && (
        <div className="mt-2">
          <p className="text-sm font-medium text-stamp">{state.name}</p>
          <p className="text-xs text-ink-soft mt-1">{state.message}</p>
        </div>
      )}
    </div>
  );
}

export function CalloverUploader({ onReady }: { onReady: (data: CallOverData) => void }) {
  const [statement, setStatement] = useState<SideState>(emptySide);
  const [payments, setPayments] = useState<SideState>(emptySide);
  const [data, setData] = useState<CallOverData | null>(null);

  const parseStatementFiles = useCallback(
    async (files: File[]) => {
      const names = files.map((f) => f.name);
      setStatement({ name: names.join(", "), kind: "", status: "working", message: "" });
      try {
        const { toStatementLine } = await import("@/lib/callover");
        const all: StatementLine[] = [];
        const failures: string[] = [];
        for (const file of files) {
          try {
            const buf = await file.arrayBuffer();
            let lines: StatementLine[] = [];
            const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
            if (isPdf) {
              const { parsePdfRows, bucketRow, boundariesFromHeader } = await import("@/lib/parsePdf");
              const pdf = await parsePdfRows(buf);
              const headerIdx = pdf.rows.findIndex((r) =>
                /(DATE|EFFECTIVE)/i.test(r.line) && /(DEBIT|CREDIT|NARRATION|DESCRIPTION|REMARKS)/i.test(r.line),
              );
              if (headerIdx === -1) throw new Error("no table header found in the PDF; use the Excel export if the bank prints it as an image");
              const header = pdf.rows[headerIdx];
              const { boundaries } = boundariesFromHeader(header);
              const H = header.words.map((w) => w.text.toUpperCase());
              const col = (re: RegExp) => H.findIndex((h) => re.test(h));
              const dateCol = col(/EFFECTIVE|VALUE|TRANS|DATE/);
              const narCol = col(/DESCRIPTION|NARRATION|PAYEE|MEMO|REMARKS/);
              const debCol = col(/DEBIT|WITHDRAW/);
              const creCol = col(/CREDIT|DEPOSIT/);
              for (const row of pdf.rows.slice(headerIdx + 1)) {
                const cells = bucketRow(row, boundaries);
                const debit = debCol >= 0 ? cells[debCol] : "";
                const credit = creCol >= 0 ? cells[creCol] : "";
                if (!cells[narCol]?.trim()) continue;
                if (!debit.trim() && !credit.trim()) continue;
                lines.push(toStatementLine(all.length + lines.length + 1, {
                  date: dateCol >= 0 ? cells[dateCol] : row.line,
                  narration: cells[narCol],
                  debit,
                  credit,
                }));
              }
            } else {
              const wb: ParsedWorkbook = await readWorkbook(buf);
              let parsedAny = false;
              for (const sheetName of wb.statementSheets) {
                const sheet = wb.sheets.find((s) => s.name === sheetName)!;
                const cols = findStatementColumns(sheet);
                if (!cols) continue;
                const parsed = statementLinesFromSheet(sheet, cols, file.name);
                if (parsed.length > 0) {
                  lines.push(...parsed.map((l) => ({ ...l, id: all.length + lines.length + l.id })));
                  parsedAny = true;
                }
              }
              if (!parsedAny) throw new Error("no sheet looked like a statement (needs date, narration and debit/credit columns)");
            }
            if (lines.length === 0) throw new Error("no transaction rows came out of that file");
            all.push(...lines);
          } catch (err) {
            failures.push(`${file.name}: ${err instanceof Error ? err.message : "unreadable"}`);
          }
        }
        if (all.length === 0) throw new Error(failures[0] ?? "None of those files produced statement lines.");
        const okCount = files.length - failures.length;
        const summary = `${all.length.toLocaleString()} statement lines from ${okCount} file${okCount === 1 ? "" : "s"}`;
        setStatement({
          name: names.join(", "),
          kind: "",
          status: failures.length > 0 ? "done" : "done",
          message: failures.length > 0 ? `${summary} (skipped: ${failures.join("; ")})` : summary,
        });
        setData((prev) => {
          const next = {
            statement: all,
            payments: prev?.payments ?? [],
            statementFiles: names,
            paymentsFiles: prev?.paymentsFiles ?? [],
            statementName: names.join(", "),
            paymentsName: prev?.paymentsName ?? "",
          };
          if (next.payments.length > 0) onReady(next);
          return next;
        });
      } catch (e) {
        setStatement({ name: names.join(", "), kind: "", status: "error", message: e instanceof Error ? e.message : "Could not read those files." });
      }
    },
    [onReady],
  );

  const parsePaymentsFiles = useCallback(
    async (files: File[]) => {
      const names = files.map((f) => f.name);
      setPayments({ name: names.join(", "), kind: "", status: "working", message: "" });
      try {
        const rows: PaymentRow[] = [];
        const failures: string[] = [];
        for (const file of files) {
          try {
            const buf = await file.arrayBuffer();
            const wb = await readWorkbook(buf);
            let parsedAny = false;
            for (const name of wb.paymentSheets) {
              const sheet = wb.sheets.find((s) => s.name === name)!;
              const cols = findPaymentColumns(sheet);
              if (!cols) continue;
              const parsed = paymentsFromSheet(sheet, cols);
              if (parsed.length > 0) {
                rows.push(...parsed.map((p) => ({ ...p, id: rows.length + p.id })));
                parsedAny = true;
              }
            }
            if (!parsedAny) throw new Error("no sheet looked like a payment list (needs a reference and an amount column)");
          } catch (err) {
            failures.push(`${file.name}: ${err instanceof Error ? err.message : "unreadable"}`);
          }
        }
        if (rows.length === 0) throw new Error(failures[0] ?? "None of those files produced payment rows.");
        const okCount = files.length - failures.length;
        const summary = `${rows.length.toLocaleString()} payments from ${okCount} file${okCount === 1 ? "" : "s"}`;
        setPayments({ name: names.join(", "), kind: "", status: "done", message: failures.length > 0 ? `${summary} (skipped: ${failures.join("; ")})` : summary });
        setData((prev) => {
          const next = {
            statement: prev?.statement ?? [],
            payments: rows,
            statementFiles: prev?.statementFiles ?? [],
            paymentsFiles: names,
            statementName: prev?.statementName ?? "",
            paymentsName: names.join(", "),
          };
          if (next.statement.length > 0) onReady(next);
          return next;
        });
      } catch (e) {
        setPayments({ name: names.join(", "), kind: "", status: "error", message: e instanceof Error ? e.message : "Could not read those files." });
      }
    },
    [onReady],
  );

  const clear = (side: "statement" | "payments") => {
    if (side === "statement") {
      setStatement(emptySide);
      setData((prev) => {
        const next = prev ? { ...prev, statement: [], statementFiles: [], statementName: "" } : null;
        if (next && next.payments.length === 0) return null;
        return next;
      });
    } else {
      setPayments(emptySide);
      setData((prev) => {
        const next = prev ? { ...prev, payments: [], paymentsFiles: [], paymentsName: "" } : null;
        if (next && next.statement.length === 0) return null;
        return next;
      });
    }
  };

  const ready = data && data.statement.length > 0 && data.payments.length > 0;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DropZone side="statement" state={statement} onFiles={parseStatementFiles} onClear={() => clear("statement")} />
        <DropZone side="payments" state={payments} onFiles={parsePaymentsFiles} onClear={() => clear("payments")} />
      </div>
      <p className="text-xs text-ink-faint mt-3" aria-live="polite">
        {ready
          ? `Ready: ${data.statement.length.toLocaleString()} statement lines against ${data.payments.length.toLocaleString()} payments.`
          : "Upload both files to run the call-over. Nothing leaves your browser."}
      </p>
    </div>
  );
}
