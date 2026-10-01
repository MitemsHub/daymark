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
  type DateOrder,
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

/** Words a real header row is made of, across the banks we have seen. */
const HEADER_HINTS = [
  "EFFECTIVE DATE", "VALUE DATE", "TRANS DATE", "TRANSACTION DATE", "POSTED DATE", "POST DATE",
  "DESCRIPTION", "NARRATION", "REMARKS", "PARTICULARS", "PAYEE", "MEMO",
  "DEBIT", "CREDIT", "WITHDRAWAL", "DEPOSIT",
  "TRANSACTION REFERENCE", "REFERENCE", "AMOUNT", "BENEFICIARY",
];

/** A row of column names: several known header words, no data values. */
function looksLikeHeaderRow(cells: string[]): boolean {
  const H = cells.map(normalizeHeader).filter(Boolean);
  if (H.length < 3) return false;
  const hits = H.filter((h) => HEADER_HINTS.some((k) => h === k || h.includes(k))).length;
  return hits >= 3;
}

/**
 * Find the header row of a sheet. Bank exports often carry a title page
 * first: bank name, account name, period, opening balance, blank rows.
 * Guaranty Trust statements, for example, put the real header on row 18.
 * Scan a generous prefix for a row that reads like column names, then fall
 * back to the old loose text match on the first rows, then to row zero.
 */
function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 100); i++) {
    if (looksLikeHeaderRow(rows[i].map((c) => String(c)))) return i;
  }
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const joined = rows[i].map((c) => String(c)).join(" ").toUpperCase();
    if (/EFFECTIVE DATE|TRANSACTION REFERENCE|DEBIT|CREDIT|DESCRIPTION|NARRATION/.test(joined)) return i;
  }
  return 0;
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
    const start = findHeaderRow(rows);
    const headers = (rows[start] ?? []).map((c) => String(c).trim());
    sheets.push({ name, headers, rows: rows.slice(start + 1) });
  }

  const statementSheets: string[] = [];
  const paymentSheets: string[] = [];
  for (const s of sheets) {
    const H = s.headers.map(normalizeHeader);
    // A statement shows dated movements on two sides. Any date column plus
    // any debit/credit-shaped column counts, so GT's "Trans Date" and a
    // bare "Date" both qualify. A payments list has an amount but no
    // two-sided movement columns, so it never reads as a statement.
    const hasDate = H.some((h) => h.includes("DATE"));
    const hasMoneySides = H.some(
      (h) => h.includes("DEBIT") || h.includes("CREDIT") || h.includes("WITHDRAWAL") || h.includes("DEPOSIT"),
    );
    const hasStatementCols = hasDate && hasMoneySides;
    const hasPaymentCols =
      H.some((h) => h.includes("TRANSACTION REFERENCE")) &&
      H.some((h) => h.includes("AMOUNT"));
    if (hasPaymentCols) paymentSheets.push(s.name);
    else if (hasStatementCols) statementSheets.push(s.name);
  }
  return { sheets, statementSheets, paymentSheets };
}

export function findStatementColumns(sheet: TableSheet): StatementColumns | null {
  const H = sheet.headers.map(normalizeHeader);
  const date = H.findIndex(
    (h) =>
      h.includes("EFFECTIVE DATE") ||
      h.includes("TRANS DATE") ||
      h.includes("TRANSACTION DATE") ||
      h.includes("POSTED DATE") ||
      h.includes("POST DATE") ||
      h.includes("VALUE DATE") ||
      h === "DATE",
  );
  const narration = H.findIndex(
    (h) =>
      h.includes("DESCRIPTION") ||
      h.includes("NARRATION") ||
      h.includes("REMARKS") ||
      h.includes("PARTICULARS") ||
      h.includes("PAYEE") ||
      h.includes("MEMO") ||
      h.includes("DETAILS"),
  );
  const debit = H.findIndex((h) => h.includes("DEBIT") || h.includes("WITHDRAWAL"));
  const credit = H.findIndex((h) => h.includes("CREDIT") || h.includes("DEPOSIT"));
  const refField = H.findIndex((h) => h === "REFERENCE" || h.includes("REF NO") || h.includes("CHEQUE NO") || h.includes("CHECK NO"));
  if (narration === -1 || (debit === -1 && credit === -1)) return null;
  return { date: date >= 0 ? date : -1, narration, debit, credit, refField };
}

export function findPaymentColumns(sheet: TableSheet): PaymentColumns | null {
  const H = sheet.headers.map(normalizeHeader);
  const ref = H.findIndex(
    (h) =>
      h.includes("TRANSACTION REFERENCE") ||
      h.includes("REFERENCE") ||
      h.includes("REF NO") ||
      h.includes("REF NUMBER") ||
      h.includes("CHEQUE NO") ||
      h.includes("CHECKER"),
  );
  const beneficiary = H.findIndex((h) => h.includes("BENEFICIARY NAME") || h.includes("BENEFICIARY") || h.includes("PAYEE") || h.includes("NAME"));
  const amount = H.findIndex((h) => h === "AMOUNT" || h.includes("AMOUNT") || h.includes("VALUE"));
  const dueDate = H.findIndex((h) => h.includes("DUE DATE") || h.includes("PAYMENT DATE") || h.includes("VALUE DATE") || h === "DATE");
  if (ref === -1 || amount === -1) return null;
  return { ref, beneficiary, amount, dueDate };
}

/**
 * Detect a file's numeric date order from its own values: a component
 * above 12 can only be a day, so its slot proves the order. GT exports
 * prove month-first with dates like 6/13/26; Nigerian statements prove
 * day-first with 28/09/2026. Returns undefined when nothing proves an
 * order, and the day-first default holds.
 */
function detectDateOrder(values: unknown[]): DateOrder | undefined {
  for (const v of values) {
    const m = /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})/.exec(String(v ?? "").trim());
    if (!m) continue;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a > 12) return "dmy";
    if (b > 12) return "mdy";
  }
  return undefined;
}

/** Pull statement lines from one sheet, tagged with the file they came from. */
export function statementLinesFromSheet(sheet: TableSheet, cols: StatementColumns, source = ""): StatementLine[] {
  const out: StatementLine[] = [];
  const order = detectDateOrder(cols.date >= 0 ? sheet.rows.map((r) => r[cols.date]) : []);
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
      source,
    }, order));
  }
  return out;
}

/** Pull payment rows from one sheet. */
export function paymentsFromSheet(sheet: TableSheet, cols: PaymentColumns): PaymentRow[] {
  const out: PaymentRow[] = [];
  const order = detectDateOrder(cols.dueDate >= 0 ? sheet.rows.map((r) => r[cols.dueDate]) : []);
  for (const r of sheet.rows) {
    const ref = String(r[cols.ref] ?? "").trim();
    if (!ref) continue;
    out.push(
      toPaymentRow(out.length + 1, {
        ref,
        beneficiary: cols.beneficiary >= 0 ? r[cols.beneficiary] : "",
        amount: cols.amount >= 0 ? r[cols.amount] : 0,
        dueDate: cols.dueDate >= 0 ? r[cols.dueDate] : "",
      }, order),
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
