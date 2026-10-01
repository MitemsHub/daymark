import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { readWorkbook, findStatementColumns, statementLinesFromSheet, findPaymentColumns, paymentsFromSheet } from "./tableParse";

// Build a workbook buffer from rows, the way a bank export arrives.
function workbookFromRows(rows: unknown[][], sheetName = "Sheet1"): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return out as ArrayBuffer;
}

// Guaranty Trust shape: 17 rows of titles, then the real header. The
// header names are the bank's own: Trans Date, Reference, Value Date,
// Debit, Credit, Balance, Remarks.
const GT_ROWS: unknown[][] = [
  ["GUARANTY TRUST BANK LIMITED", "", "", "", "", "", ""],
  ["", "", "", "", "", "", ""],
  ["CUSTOMER STATEMENT", "", "", "", "", "", ""],
  ["", "", "", "", "", "", ""],
  ["Account Name: C.B.N STAFF MULTI-PURPOSE COOP", "", "", "", "", "", ""],
  ["Print Date: 18/Aug/2026 15:12:23", "", "", "", "", "", ""],
  ["", "", "", "", "", "", ""],
  ["Address: Account Address: CBN I & JNA QTRS,GARKI F.C.T ABUJA", "", "", "", "", "", ""],
  ["", "", "", "", "", "", ""],
  ["Account No: 0023723318", "", "", "", "", "", ""],
  ["", "", "", "", "", "", ""],
  ["Currency: NGN", "", "", "", "", "", ""],
  ["", "", "", "", "", "", ""],
  ["Period: 01/Jun/2026 To 30/Jun/2026", "", "", "", "", "", ""],
  ["", "", "", "", "", "", ""],
  ["Opening Balance: 38,687,732.17", "", "", "", "", "", ""],
  ["", "", "", "", "", "", ""],
  ["Trans Date", "Reference", "Value Date", "Debit", "Credit", "Balance", "Remarks"],
  ["6/1/26 7:29", "'10003326060106284501NIP", "6/1/26 0:00", "", "100,000.00", "38,787,732.17", "TRANSFER BETWEEN CUSTOMERS 10003326060106284501-LIQUIDATION-PALMPAY-OLAWALE OLUWADAMILARE SHODE."],
  ["6/1/26 7:50", "'00000626060107502017NIP", "6/1/26 0:00", "10,000.00", "38,797,732.17", "", "MOBILE TRF 00000626060107502017 TO CBN COO-JAIZ-DANJUMA MUHAMMADU IDRIS"],
  ["6/13/26 9:00", "'00237233180551273420GTW", "6/13/26 0:00", "50,000.00", "39,000,282.17", "", "SAVINGS DEPOSIT FOR JUNE 202 FROM VANNI EGUOLO MAYTO"],
  ["PLEASE ADDRESS ALL ENQUIRIES TO", "", "", "", "", "", ""],
  ["GUARANTY TRUST BANK LIMITED", "", "", "", "", "", ""],
];

// Zenith-style shape used before: flat CSV-style header on row one.
const ZENITH_ROWS: unknown[][] = [
  ["Effective Date", "Description/Payee/Memo", "Debit Amount", "Credit Amount"],
  ["28/09/2026", "Withdrawal on Special Savings-ZBA0065705/CIB//NIP TFR TO ALICE JOHNSON/GTB", "45000.00", ""],
  ["28/09/2026", "FGN Stamp Duty//Withdrawal on Special Savings-ZBA0065705/CIB", "50.00", ""],
];

describe("readWorkbook", () => {
  it("finds a statement header buried under a GT title block", async () => {
    const wb = await readWorkbook(workbookFromRows(GT_ROWS));
    expect(wb.statementSheets).toEqual(["Sheet1"]);
    const sheet = wb.sheets[0];
    expect(sheet.headers[0]).toBe("Trans Date");
    expect(sheet.rows[0][6]).toContain("TRANSFER BETWEEN CUSTOMERS");
  });

  it("still detects the flat Zenith-style sheet", async () => {
    const wb = await readWorkbook(workbookFromRows(ZENITH_ROWS));
    expect(wb.statementSheets).toEqual(["Sheet1"]);
  });

  it("does not mistake a payments list for a statement", async () => {
    const rows: unknown[][] = [
      ["TRANSACTION REFERENCE", "BENEFICIARY NAME", "AMOUNT", "PAYMENT DUE DATE"],
      ["ZB/A/006570/5", "ALICE JOHNSON", "45000", "28/09/2026"],
    ];
    const wb = await readWorkbook(workbookFromRows(rows));
    expect(wb.statementSheets).toEqual([]);
    expect(wb.paymentSheets).toEqual(["Sheet1"]);
  });

  it("keeps payment detection when a sheet carries both shapes", async () => {
    const rows: unknown[][] = [
      ["TRANSACTION REFERENCE", "BENEFICIARY NAME", "AMOUNT", "PAYMENT DUE DATE", "VALUE DATE", "DEBIT", "CREDIT"],
      ["ZB/A/006570/5", "ALICE JOHNSON", "45000", "28/09/2026", "28/09/2026", "", ""],
    ];
    const wb = await readWorkbook(workbookFromRows(rows));
    expect(wb.paymentSheets).toEqual(["Sheet1"]);
    expect(wb.statementSheets).toEqual([]);
  });
});

describe("findStatementColumns", () => {
  it("maps GT header names to the right roles", async () => {
    const wb = await readWorkbook(workbookFromRows(GT_ROWS));
    const sheet = wb.sheets[0];
    const cols = findStatementColumns(sheet);
    expect(cols).not.toBeNull();
    expect(cols!.date).toBe(0); // Trans Date
    expect(cols!.narration).toBe(6); // Remarks
    expect(cols!.debit).toBe(3);
    expect(cols!.credit).toBe(4);
    expect(cols!.refField).toBe(1); // Reference
  });

  it("keeps reading the Zenith-style headers", async () => {
    const wb = await readWorkbook(workbookFromRows(ZENITH_ROWS));
    const cols = findStatementColumns(wb.sheets[0]);
    expect(cols).not.toBeNull();
    expect(cols!.date).toBe(0);
    expect(cols!.narration).toBe(1);
    expect(cols!.debit).toBe(2);
    expect(cols!.credit).toBe(3);
  });
});

describe("statementLinesFromSheet on the GT sheet", () => {
  it("parses dated lines with reference and narration", async () => {
    const wb = await readWorkbook(workbookFromRows(GT_ROWS));
    const sheet = wb.sheets[0];
    const cols = findStatementColumns(sheet)!;
    const lines = statementLinesFromSheet(sheet, cols, "gt.xlsb");
    expect(lines).toHaveLength(3); // footer rows carry no amount, so they drop out
    expect(lines[0].credit).toBe(100000);
    expect(lines[0].refField).toBe("10003326060106284501NIP"); // apostrophe stripped
    expect(lines[1].debit).toBe(10000);
    // 6/13/26 proves the file is month-first, so the ambiguous 6/1/26
    // resolves to June first, not January sixth.
    expect(lines[0].dateISO).toBe("2026-06-01");
    expect(lines[2].dateISO).toBe("2026-06-13");
    expect(lines[2].narration).toContain("SAVINGS DEPOSIT");
  });
});

// GAPS vendor payment export: camel-cased headers, a bare Reference
// column, VendorName beside VendorCode. This is the shape the CBN co-op
// uploads four of alongside a GT statement.
const GAPS_PAYMENT_ROWS: unknown[][] = [
  ["PaymentAmount", "PaymentDate", "Reference", "Remark", "VendorCode", "VendorName", "VendorAccount", "BankSortCode"],
  ["120000", "2026-08-20", "GTB/A/008849/1", "PYMT FOR LUNCH ALLOW. TO MCs ", "A20919", "UKEHE THADDEUSSAMUEL", "0136114366", "58152052"],
];

describe("the GAPS vendor payment export", () => {
  it("reads as a payment list, never as a statement", async () => {
    const wb = await readWorkbook(workbookFromRows(GAPS_PAYMENT_ROWS));
    expect(wb.paymentSheets).toEqual(["Sheet1"]);
    expect(wb.statementSheets).toEqual([]);
  });

  it("maps VendorName (not VendorCode) and the ISO payment date", async () => {
    const wb = await readWorkbook(workbookFromRows(GAPS_PAYMENT_ROWS));
    const cols = findPaymentColumns(wb.sheets[0]);
    expect(cols).not.toBeNull();
    expect(cols!.ref).toBe(2);
    expect(cols!.beneficiary).toBe(5); // VendorName, not VendorCode at 4
    expect(cols!.amount).toBe(0);
    expect(cols!.dueDate).toBe(1);
    expect(cols!.remark).toBe(3);
    const payments = paymentsFromSheet(wb.sheets[0], cols!);
    expect(payments).toHaveLength(1);
    expect(payments[0].ref).toBe("GTB/A/008849/1");
    expect(payments[0].beneficiary).toBe("UKEHE THADDEUSSAMUEL");
    expect(payments[0].amount).toBe(120000);
    expect(payments[0].dueDateISO).toBe("2026-08-20");
    expect(payments[0].remark).toContain("LUNCH ALLOW");
  });
});

describe("findPaymentColumns", () => {
  it("resolves the standard payment headers", async () => {
    const rows: unknown[][] = [
      ["TRANSACTION REFERENCE", "BENEFICIARY NAME", "AMOUNT", "PAYMENT DUE DATE"],
      ["ZB/A/006570/5", "ALICE JOHNSON", "45000", "28/09/2026"],
    ];
    const wb = await readWorkbook(workbookFromRows(rows));
    const cols = findPaymentColumns(wb.sheets[0]);
    expect(cols).not.toBeNull();
    expect(cols!.ref).toBe(0);
    expect(cols!.beneficiary).toBe(1);
    expect(cols!.amount).toBe(2);
    expect(cols!.dueDate).toBe(3);
    const payments = paymentsFromSheet(wb.sheets[0], cols!);
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(45000);
  });
});
