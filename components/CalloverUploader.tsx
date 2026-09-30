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
  onFile,
  onClear,
}: {
  side: "statement" | "payments";
  state: SideState;
  onFile: (f: File) => void;
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
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`border border-dashed rounded-md p-5 cursor-pointer transition-colors reveal delay-1 ${
        drag ? "border-stamp bg-stamp-wash" : "hairline hover:border-ink-faint bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx,.csv,.pdf"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
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
            Remove
          </button>
        )}
      </div>

      {state.status === "idle" && (
        <p className="text-sm text-ink-soft mt-2">
          Drop the {label.toLowerCase()} file here, or click to choose. Excel (.xls, .xlsx), CSV or PDF.
        </p>
      )}
      {state.status === "working" && <p className="text-sm text-ink-soft mt-2">Reading {state.name}...</p>}
      {state.status === "done" && (
        <div className="mt-2">
          <p className="text-sm font-medium text-ink">{state.name}</p>
          <p className="text-xs text-ink-faint tnum">
            {state.kind} · {state.message}
          </p>
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

  const parseStatement = useCallback(
    async (file: File) => {
      setStatement({ name: file.name, kind: fmtSize(file.size), status: "working", message: "" });
      try {
        const buf = await file.arrayBuffer();
        let lines: StatementLine[] = [];
        const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
        if (isPdf) {
          const { parsePdfRows, bucketRow, boundariesFromHeader } = await import("@/lib/parsePdf");
          const pdf = await parsePdfRows(buf);
          // Find a header row: contains a date-ish and a debit/credit word.
          const headerIdx = pdf.rows.findIndex((r) =>
            /(DATE|EFFECTIVE)/i.test(r.line) && /(DEBIT|CREDIT|NARRATION|DESCRIPTION|REMARKS)/i.test(r.line),
          );
          if (headerIdx === -1) {
            throw new Error(
              `No table header found in the PDF (${pdf.pageCount} pages, ${pdf.rows.length} rows). If the bank prints this as an image, use the Excel export instead.`,
            );
          }
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
            lines.push(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await import("@/lib/callover").then((m) =>
                m.toStatementLine(lines.length + 1, {
                  date: dateCol >= 0 ? cells[dateCol] : row.line,
                  narration: cells[narCol],
                  debit,
                  credit,
                }),
              ),
            );
          }
        } else {
          const wb: ParsedWorkbook = await readWorkbook(buf);
          const sheetName = wb.statementSheets[0];
          if (!sheetName) throw new Error("No sheet looked like a statement (needs date, narration and debit/credit columns).");
          const sheet = wb.sheets.find((s) => s.name === sheetName)!;
          const cols = findStatementColumns(sheet);
          if (!cols) throw new Error(`Could not map columns on sheet "${sheetName}".`);
          lines = statementLinesFromSheet(sheet, cols);
        }
        if (lines.length === 0) throw new Error("No transaction rows came out of that file.");
        setStatement({ name: file.name, kind: fmtSize(file.size), status: "done", message: `${lines.length.toLocaleString()} statement lines` });
        setData((prev) => {
          const next = { statement: lines, payments: prev?.payments ?? [], statementName: file.name, paymentsName: prev?.paymentsName ?? "" };
          if (next.payments.length > 0) onReady(next);
          return next;
        });
      } catch (e) {
        setStatement({ name: file.name, kind: fmtSize(file.size), status: "error", message: e instanceof Error ? e.message : "Could not read that file." });
      }
    },
    [onReady],
  );

  const parsePayments = useCallback(
    async (file: File) => {
      setPayments({ name: file.name, kind: fmtSize(file.size), status: "working", message: "" });
      try {
        const buf = await file.arrayBuffer();
        const wb = await readWorkbook(buf);
        const rows: PaymentRow[] = [];
        for (const name of wb.paymentSheets) {
          const sheet = wb.sheets.find((s) => s.name === name)!;
          const cols = findPaymentColumns(sheet);
          if (cols) rows.push(...paymentsFromSheet(sheet, cols));
        }
        if (rows.length === 0) throw new Error("No sheet looked like a payment list (needs a reference and an amount column).");
        setPayments({ name: file.name, kind: fmtSize(file.size), status: "done", message: `${rows.length.toLocaleString()} payments from ${wb.paymentSheets.join(", ")}` });
        setData((prev) => {
          const next = { statement: prev?.statement ?? [], payments: rows, statementName: prev?.statementName ?? "", paymentsName: file.name };
          if (next.statement.length > 0) onReady(next);
          return next;
        });
      } catch (e) {
        setPayments({ name: file.name, kind: fmtSize(file.size), status: "error", message: e instanceof Error ? e.message : "Could not read that file." });
      }
    },
    [onReady],
  );

  const clear = (side: "statement" | "payments") => {
    if (side === "statement") {
      setStatement(emptySide);
      setData((prev) => {
        const next = prev ? { ...prev, statement: [], statementName: "" } : null;
        if (next && next.payments.length === 0) return null;
        return next;
      });
    } else {
      setPayments(emptySide);
      setData((prev) => {
        const next = prev ? { ...prev, payments: [], paymentsName: "" } : null;
        if (next && next.statement.length === 0) return null;
        return next;
      });
    }
  };

  const ready = data && data.statement.length > 0 && data.payments.length > 0;

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <DropZone side="statement" state={statement} onFile={parseStatement} onClear={() => clear("statement")} />
        <DropZone side="payments" state={payments} onFile={parsePayments} onClear={() => clear("payments")} />
      </div>
      <p className="text-xs text-ink-faint mt-3" aria-live="polite">
        {ready
          ? `Ready: ${data.statement.length.toLocaleString()} statement lines against ${data.payments.length.toLocaleString()} payments.`
          : "Upload both files to run the call-over. Nothing leaves your browser."}
      </p>
    </div>
  );
}
