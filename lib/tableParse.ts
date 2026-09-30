// Excel/CSV parsing for the Call Over tab. Turns a workbook buffer into
// statement lines or payment rows, finding the right sheets and columns
// automatically. SheetJS is imported dynamically so only the Call Over
// page ever loads it.

import {
  toStatementLine,
  toPaymentRow,
  isChargeNarration,
  isReversalNarration,
  type StatementLine,
  type PaymentRow,
} from "./callover";

export interface TableSheet {
  name: string;
  headers: string[];
  rows: unknown[][];
}

export interface ParsedWorkbook {
  sheets: TableSheet[];
  /** sheets that look like bank statements */
  statementSheets: string[];
  /** sheets that look like payment lists */
  paymentSheets: string[];
}

/** Column roles we care about, in either file kind. */
export interface StatementColumns {
  date: number;
  narration: number;
  debit: number;
  credit: number;
  /** the bank's own Reference column (GTB style); -1 when absent */
  refField: number;
}

export interface PaymentColumns {
  ref: number;
  beneficiary: number;
  amount: number;
  dueDate: number;
}

function normalizeHeader(h: string): string {
  return h.toUpperCase().replace(/[^A-Z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

/** Read every sheet of a workbook buffer as header + rows. */
export async function readWorkbook(buf: ArrayBuffer): Promise<ParsedWorkbook> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buf, { type: "array" });
  const sheets: TableSheet[] = [];
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], {
      header: 1,
      raw: false,
      defval: "",
    });
    if (rows.length === 0) continue;
    const headerRow = rows[0] ?? [];
    // Skip leading non-header rows (some exports have titles on top).
    let start = 0;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const joined = rows[i].map((c) => String(c)).join(" ").toUpperCase();
      if (/EFFECTIVE DATE|TRANSACTION REFERENCE|DEBIT|CREDIT|DESCRIPTION|NARRATION/.test(joined)) {
        start = i;
        break;
      }
    }
    const headers = (rows[start] ?? []).map((c) => String(c).trim());
    sheets.push({ name, headers, rows: rows.slice(start + 1) });
  }

  const statementSheets: string[] = [];
  const paymentSheets: string[] = [];
  for (const s of sheets) {
    const H = s.headers.map(normalizeHeader);
    const hasStatementCols =
      H.some((h) => h.includes("EFFECTIVE DATE") || h.includes("VALUE DATE")) &&
      H.some((h) => h.includes("DEBIT")) &&
      H.some((h) => h.includes("CREDIT"));
    const hasPaymentCols =
      H.some((h) => h.includes("TRANSACTION REFERENCE")) &&
      H.some((h) => h.includes("AMOUNT"));
    // A sheet can be both in odd workbooks; prefer payment when refs exist.
    if (hasPaymentCols) paymentSheets.push(s.name);
    else if (hasStatementCols) statementSheets.push(s.name);
  }
  return { sheets, statementSheets, paymentSheets };
}

export function findStatementColumns(sheet: TableSheet): StatementColumns | null {
  const H = sheet.headers.map(normalizeHeader);
  const date = H.findIndex((h) => h.includes("EFFECTIVE DATE") || h.includes("VALUE DATE") || h.includes("TRANS DATE") || h === "DATE" || h.includes("POST DATE"));
  const narration = H.findIndex((h) => h.includes("DESCRIPTION") || h.includes("NARRATION") || h.includes("PAYEE") || h.includes("MEMO") || h.includes("REMARKS"));
  const debit = H.findIndex((h) => h.includes("DEBIT") || h.includes("WITHDRAWAL"));
  const credit = H.findIndex((h) => h.includes("CREDIT") || h.includes("DEPOSIT"));
  const refField = H.findIndex((h) => h === "REFERENCE" || h.includes("REF NO") || h.includes("CHEQUE NO") || h.includes("CHECK NO"));
  if (narration === -1 || (debit === -1 && credit === -1)) return null;
  return { date: date >= 0 ? date : -1, narration, debit, credit, refField };
}

export function findPaymentColumns(sheet: TableSheet): PaymentColumns | null {
  const H = sheet.headers.map(normalizeHeader);
  const ref = H.findIndex((h) => h.includes("TRANSACTION REFERENCE") || h.includes("REFERENCE") || h.includes("CHEQUE NO") || h.includes("CHECKER"));
  const beneficiary = H.findIndex((h) => h.includes("BENEFICIARY NAME") || h.includes("BENEFICIARY") || h.includes("PAYEE") || h.includes("NAME"));
  const amount = H.findIndex((h) => h === "AMOUNT" || h.includes("AMOUNT") || h.includes("VALUE"));
  const dueDate = H.findIndex((h) => h.includes("DUE DATE") || h.includes("PAYMENT DATE") || h.includes("VALUE DATE") || h === "DATE");
  if (ref === -1 || amount === -1) return null;
  return { ref, beneficiary, amount, dueDate };
}

/** Pull statement lines from one sheet. */
export function statementLinesFromSheet(sheet: TableSheet, cols: StatementColumns): StatementLine[] {
  const out: StatementLine[] = [];
  for (const r of sheet.rows) {
    const narration = String(r[cols.narration] ?? "").trim();
    const refRaw = cols.refField >= 0 ? String(r[cols.refField] ?? "").trim() : "";
    if (!narration && !refRaw) continue;
    // A real statement row has an amount on one side. Skip totals rows.
    const debit = cols.debit >= 0 ? r[cols.debit] : "";
    const credit = cols.credit >= 0 ? r[cols.credit] : "";
    const hasAmount = String(debit).trim() !== "" || String(credit).trim() !== "";
    if (!hasAmount) continue;
    out.push(toStatementLine(out.length + 1, {
      date: cols.date >= 0 ? r[cols.date] : "",
      narration: narration || refRaw,
      debit,
      credit,
      refField: refRaw.replace(/^'+/, ""), // GTB exports prefix with an apostrophe
    }));
  }
  return out;
}

/** Pull payment rows from one sheet. */
export function paymentsFromSheet(sheet: TableSheet, cols: PaymentColumns): PaymentRow[] {
  const out: PaymentRow[] = [];
  for (const r of sheet.rows) {
    const ref = String(r[cols.ref] ?? "").trim();
    if (!ref) continue;
    out.push(
      toPaymentRow(out.length + 1, {
        ref,
        beneficiary: cols.beneficiary >= 0 ? r[cols.beneficiary] : "",
        amount: cols.amount >= 0 ? r[cols.amount] : 0,
        dueDate: cols.dueDate >= 0 ? r[cols.dueDate] : "",
      }),
    );
  }
  return out;
}

/**
 * Full auto-parse: pick the biggest statement sheet and all payment sheets.
 * Returns null for whichever side fails; the UI offers manual sheet choice.
 */
export function autoExtract(wb: ParsedWorkbook): {
  statement: StatementLine[];
  payments: PaymentRow[];
  statementSheet?: string;
  paymentSheets: string[];
  errors: string[];
} {
  const errors: string[] = [];
  let statement: StatementLine[] = [];
  let statementSheet: string | undefined;

  for (const name of wb.statementSheets) {
    const sheet = wb.sheets.find((s) => s.name === name)!;
    const cols = findStatementColumns(sheet);
    if (!cols) continue;
    const lines = statementLinesFromSheet(sheet, cols);
    if (lines.length > statement.length) {
      statement = lines;
      statementSheet = name;
    }
  }
  if (!statementSheet) errors.push("No sheet looked like a bank statement (needs date, narration, debit and credit columns).");

  const payments: PaymentRow[] = [];
  const paymentSheets: string[] = [];
  for (const name of wb.paymentSheets) {
    const sheet = wb.sheets.find((s) => s.name === name)!;
    const cols = findPaymentColumns(sheet);
    if (!cols) continue;
    payments.push(...paymentsFromSheet(sheet, cols));
    paymentSheets.push(name);
  }
  if (paymentSheets.length === 0) errors.push("No sheet looked like a payment list (needs transaction reference and amount columns).");

  return { statement, payments, statementSheet, paymentSheets, errors };
}

/** CSV / Excel to rows for the payments side when the user picks manually. */
export function sheetByName(wb: ParsedWorkbook, name: string): TableSheet | undefined {
  return wb.sheets.find((s) => s.name === name);
}

export { isChargeNarration, isReversalNarration };
