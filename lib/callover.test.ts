import { describe, it, expect } from "vitest";
import {
  normalizeRef,
  parseAmount,
  parseDateAny,
  countRefOccurrences,
  toStatementLine,
  toPaymentRow,
  classifyPayment,
  runCallOver,
  type StatementLine,
} from "./callover";

const L = (id: number, narration: string, debit = 0, credit = 0, date = "2026-09-28"): StatementLine =>
  toStatementLine(id, { date, narration, debit, credit });

const P = (id: number, ref: string, beneficiary: string, amount: number, due = "2026-09-28") =>
  toPaymentRow(id, { ref, beneficiary, amount, dueDate: due });

describe("reference normalization", () => {
  it("makes slashed and continuous forms equal", () => {
    expect(normalizeRef("ZB/A/006568/1")).toBe("ZBA0065681");
    expect(normalizeRef("ZBA0065681")).toBe("ZBA0065681");
    expect(normalizeRef("zb-a-006568-1")).toBe("ZBA0065681");
  });

  it("ignores empty refs", () => {
    expect(normalizeRef("")).toBe("");
    expect(normalizeRef("  ")).toBe("");
  });
});

describe("amount and date parsing", () => {
  it("parses naira-formatted, plain and numeric amounts", () => {
    expect(parseAmount("NGN 410,000.00")).toBe(410000);
    expect(parseAmount("150000")).toBe(150000);
    expect(parseAmount("4,599.90")).toBe(4599.9);
    expect(parseAmount(750000.14)).toBe(750000.14);
    expect(parseAmount("")).toBe(0);
  });

  it("parses ISO, day-first and dashed month dates", () => {
    expect(parseDateAny("2026-09-28")).toBe("2026-09-28");
    expect(parseDateAny("28/09/2026")).toBe("2026-09-28");
    expect(parseDateAny("28-Sep-26")).toBe("2026-09-28");
    expect(parseDateAny("5/1/2026")).toBe("2026-01-05");
    expect(parseDateAny("")).toBe("");
  });
});

describe("the boundary rule, faithful to the Excel formula", () => {
  it("counts real refs and rejects longer refs sharing a prefix", () => {
    const narration = "WITHDRAWAL ON SPECIAL SAVINGSZBA0065681CIBNIP TFR TO MOHAMMED MUKHTAR ABDULLAHIFCMB";
    expect(countRefOccurrences(narration, "ZBA0065681")).toBe(1);
    const longer = "WITHDRAWAL ON SPECIAL SAVINGSZBA00656815CIB";
    // the full ref still matches on its own
    expect(countRefOccurrences(longer, "ZBA00656815")).toBe(1);
    // 0065681 sits inside 00656815 without a boundary -> must not count
    expect(countRefOccurrences(longer, "ZBA0065681")).toBe(0);
  });

  it("ZB/A/006570/5 is found as ZBA0065705 but is not ZBA00657050", () => {
    expect(countRefOccurrences("X ZBA0065705CIB Y", "ZBA0065705")).toBe(1);
    expect(countRefOccurrences("X ZBA00657050CIB Y", "ZBA0065705")).toBe(0);
    expect(countRefOccurrences("X ZBA0065705 Y", "ZBA0065705")).toBe(1);
  });

  it("matches at end of string (the formula's RIGHT check)", () => {
    expect(countRefOccurrences("NARRATION ENDS WITH ZBA0065705", "ZBA0065705")).toBe(1);
  });

  it("GTB style: a payment ref can hit a line's own Reference column", () => {
    const line = toStatementLine(1, {
      date: "8/1/26 20:50",
      narration: "Instant Payment Outward 000013260804205029000118142429 COOP/TR/14/1618/7 MEAL SUBSIDY FOR STAFF",
      debit: 17500,
      refField: "'252368145GAP",
    });
    expect(line.refField).toBe("252368145GAP");
    const v = classifyPayment(P(1, "252368145GAP", "AGNES CHIDIMMA NGUMEZI", 17500, "2026-08-04"), [line]);
    expect(v.status).toBe("Paid");
    expect(v.foundCount).toBe(1);
  });

  it("counts two mentions when the charge line repeats the ref", () => {
    const a = L(1, "Withdrawal on Special Savings-ZBA0065681/CIB//NIP TFR TO A/FCMB", 150000);
    const b = L(2, "FGN Stamp Duty//Withdrawal on Special Savings-ZBA0065681/CIB", 50);
    const v = classifyPayment(P(1, "ZB/A/006568/1", "MOHAMMED MUKHTAR ABDULLAHI", 150000), [a, b]);
    expect(v.foundCount).toBe(2);
    expect(v.status).toBe("Paid");
  });
});

describe("classification", () => {
  it("payment below threshold found once is Paid (Found 1 times)", () => {
    const line = L(1, "Withdrawal on Special Savings-ZBA0065671/CIB//NIP TFR TO B/GTB", 2500);
    const v = classifyPayment(P(1, "ZB/A/006567/1", "B", 2500), [line]);
    expect(v.status).toBe("Paid");
    expect(v.foundCount).toBe(1);
  });

  it("payment found only on charge lines is Not found", () => {
    const charge = L(1, "FGN Stamp Duty//Something", 50);
    const v = classifyPayment(P(1, "ZB/A/006567/2", "C", 5000), [charge]);
    expect(v.status).toBe("Not found");
  });

  it("debit then matching credit is Reversed with the raw count in brackets", () => {
    const debit = L(1, "Withdrawal on Special Savings-ZBA00657525/CIB//NIP TFR TO AHMAD/UNITY", 225000);
    const stamp = L(2, "FGN Stamp Duty//Withdrawal on Special Savings-ZBA00657525/CIB", 50);
    const rev = L(3, "***RSVL Withdrawal on Special Savings-ZBA00657525/CIB//NIP TFR TO AHMAD/UNITY", 0, 225000);
    const revStamp = L(4, "***RSVL FGN Stamp Duty//Withdrawal on Special Savings-ZBA00657525/CIB", 0, 50);
    const v = classifyPayment(P(1, "ZB/A/006575/25", "AHMAD BASHIR ALBASU", 225000), [debit, stamp, rev, revStamp]);
    expect(v.status).toBe("Reversed");
    expect(v.foundCount).toBe(4);
    expect(v.amountReturned).toBe(225050);
  });

  it("credit smaller than the debit is a Partial reversal", () => {
    const debit = L(1, "Withdrawal on Special Savings-ZBA00657530/CIB//NIP TFR TO D/FBN", 100000);
    const rev = L(2, "***RSVL Withdrawal on Special Savings-ZBA00657530/CIB//NIP TFR TO D/FBN", 0, 40000);
    const v = classifyPayment(P(1, "ZB/A/006575/30", "D", 100000), [debit, rev]);
    expect(v.status).toBe("Partial reversal");
  });

  it("two payment debits are Double posted", () => {
    const d1 = L(1, "Withdrawal on Special Savings-ZBA00657540/CIB//NIP TFR TO E/GTB", 90000);
    const d2 = L(2, "Withdrawal on Special Savings-ZBA00657540/CIB//NIP TFR TO E/GTB", 90000);
    const v = classifyPayment(P(1, "ZB/A/006575/40", "E", 90000), [d1, d2]);
    expect(v.status).toBe("Double posted");
    expect(v.amountSeen).toBe(180000);
  });

  it("debit smaller than the payment is Short paid", () => {
    const line = L(1, "Withdrawal on Special Savings-ZBA00657550/CIB//NIP TFR TO F/FBN", 3000);
    const v = classifyPayment(P(1, "ZB/A/006575/50", "F", 5000), [line]);
    expect(v.status).toBe("Short paid");
  });

  it("one debit then one credit is Reversed (Found 2 times), no charge lines needed", () => {
    const debit = L(1, "Withdrawal on Special Savings-ZBA00657560/CIB//NIP TFR TO K/GTB", 30000);
    const credit = L(2, "***RSVL Withdrawal on Special Savings-ZBA00657560/CIB//NIP TFR TO K/GTB", 0, 30000);
    const v = classifyPayment(P(1, "ZB/A/006575/60", "K", 30000), [debit, credit]);
    expect(v.status).toBe("Reversed");
    expect(v.foundCount).toBe(2);
  });

  it("a non-reversal credit alone with the ref is still Reversed", () => {
    const credit = L(1, "Withdrawal on Special Savings-ZBA00657565/CIB//NIP TFR TO L/GTB", 0, 15000);
    const v = classifyPayment(P(1, "ZB/A/006575/65", "L", 15000), [credit]);
    expect(v.status).toBe("Reversed");
  });

  it("no trace at all is Not found", () => {
    const v = classifyPayment(P(1, "ZB/A/006575/60", "G", 12000), []);
    expect(v.status).toBe("Not found");
    expect(v.foundCount).toBe(0);
  });
});

describe("runCallOver totals and orphans", () => {
  const lines = [
    L(1, "Withdrawal on Special Savings-ZBA0065681/CIB//NIP TFR TO A/FCMB", 150000),
    L(2, "FGN Stamp Duty//Withdrawal on Special Savings-ZBA0065681/CIB", 50),
    L(3, "Withdrawal on Special Savings-ZBA0065671/CIB//NIP TFR TO B/GTB", 2500),
    L(4, "Withdrawal on Special Savings-ZBA00657540/CIB//NIP TFR TO E/GTB", 90000),
    L(5, "Withdrawal on Special Savings-ZBA00657540/CIB//NIP TFR TO E/GTB", 90000),
    L(6, "TRF TO UNKNOWN PERSON/Withdrawal on Special Savings-ZBA0099999/CIB", 77777),
    L(7, "FGN Stamp Duty//Unrelated charge", 50),
  ];
  const payments = [
    P(1, "ZB/A/006568/1", "A", 150000),
    P(2, "ZB/A/006567/1", "B", 2500),
    P(3, "ZB/A/006575/40", "E", 90000),
    P(4, "ZB/A/006599/99", "NOBODY", 5000),
  ];

  it("classifies all payments and finds the unexplained debit", () => {
    const r = runCallOver(payments, lines);
    expect(r.totals.payments).toBe(4);
    expect(r.totals.paid).toBe(2);
    expect(r.totals.doublePosted).toBe(1);
    expect(r.totals.notFound).toBe(1);
    expect(r.unexplainedDebits.map((l) => l.id)).toEqual([6]);
    expect(r.totals.unexplainedDebitTotal).toBe(77777);
  });

  it("suggests a probable match for a missing reference, never silently", () => {
    const orphan = [P(1, "ZB/A/009999/1", "UNKNOWN PERSON", 77777)];
    const r = runCallOver(orphan, lines);
    expect(r.verdicts[0].status).toBe("Not found");
    expect(r.verdicts[0].probable?.lineId).toBe(6);
  });

  it("totals the Short paid count", () => {
    const short = [P(1, "ZB/A/006575/50", "F", 5000)];
    const shortLines = [L(1, "Withdrawal on Special Savings-ZBA00657550/CIB//NIP TFR TO F/FBN", 3000)];
    const r = runCallOver(short, shortLines);
    expect(r.totals.shortPaid).toBe(1);
    expect(r.totals.paid).toBe(0);
  });

  it("cross-checks a Paid verdict whose amount disagrees with the payment file", () => {
    // Reference matches but the debit is a different amount: the engine
    // keeps Paid (the reference is the bank's own link) and adds a note.
    const line = L(1, "Withdrawal on Special Savings-ZBA00657570/CIB//NIP TFR TO M/GTB", 41000);
    const r = runCallOver([P(1, "ZB/A/006575/70", "M", 40000)], [line]);
    expect(r.verdicts[0].status).toBe("Paid");
    expect(r.verdicts[0].note).toContain("Cross-check");
    expect(r.verdicts[0].note).toContain("not the 40,000");
  });

  it("a clean Paid match gets no cross-check note", () => {
    const line = L(1, "Withdrawal on Special Savings-ZBA00657575/CIB//NIP TFR TO NIAJA NWACHUKWU/GTB", 45000);
    const r = runCallOver([P(1, "ZB/A/006575/75", "NIAJA NWACHUKWU", 45000)], [line]);
    expect(r.verdicts[0].status).toBe("Paid");
    expect(r.verdicts[0].note).toBeUndefined();
  });
});

describe("validation against the real workbook", () => {
  it("matches the Excel formula verdicts on the live file", async () => {
    const fs = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const filePath = fileURLToPath(new URL("../.tmp-parser/statement.xls", import.meta.url));
    if (!fs.existsSync(filePath)) {
      console.warn("workbook copy not present; skipping oracle test");
      return;
    }
    const XLSX = await import("xlsx");
    const buf = fs.readFileSync(filePath);
    const wb = XLSX.read(buf, { type: "buffer" });

    // Statement: first sheet with Effective Date / Description / Debit / Credit.
    const stRows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["Activity_Statement"], { header: 1, raw: false, defval: "" });
    const lines: StatementLine[] = [];
    for (let i = 1; i < stRows.length; i++) {
      const r = stRows[i];
      if (!r || !String(r[3] ?? "").trim()) continue;
      lines.push(toStatementLine(lines.length + 1, { date: r[1], narration: r[3], debit: r[4], credit: r[5] }));
    }
    expect(lines.length).toBeGreaterThan(1000);

    // Payments: every sheet after the first two, result in a column that
    // matches /Found N times|Not found/.
    const payments = [];
    const oracle: string[] = [];
    for (const name of wb.SheetNames.slice(2)) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, raw: false, defval: "" });
      if (!rows.length) continue;
      const header = rows[0].map((c) => String(c).toUpperCase());
      const refCol = header.findIndex((h) => h.includes("TRANSACTION REFERENCE"));
      const nameCol = header.findIndex((h) => h.includes("BENEFICIARY NAME"));
      const amtCol = header.findIndex((h) => h === "AMOUNT");
      const dateCol = header.findIndex((h) => h.includes("PAYMENT DUE DATE"));
      // The result column is headed HELPER; its cells hold "Found N times"
      // or "Not found". Fall back to scanning for the phrase if needed.
      let resCol = header.findIndex((h) => h === "HELPER");
      if (resCol === -1) {
        const counts = new Map<number, number>();
        for (let i = 1; i < rows.length; i++) {
          rows[i]?.forEach((c, j) => {
            if (/Found \d+ times|Not found/i.test(String(c))) counts.set(j, (counts.get(j) ?? 0) + 1);
          });
        }
        if (counts.size > 0) resCol = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      }
      if (refCol === -1 || resCol === -1) continue;
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !String(r[refCol] ?? "").trim()) continue;
        payments.push(toPaymentRow(payments.length + 1, {
          ref: r[refCol],
          beneficiary: nameCol >= 0 ? r[nameCol] : "",
          amount: amtCol >= 0 ? r[amtCol] : 0,
          dueDate: dateCol >= 0 ? r[dateCol] : "",
        }));
        oracle.push(String(r[resCol]).trim());
      }
    }
    expect(payments.length).toBe(oracle.length);
    expect(payments.length).toBeGreaterThan(400);

    const result = runCallOver(payments, lines);
    let agree = 0;
    const disagreements: string[] = [];
    result.verdicts.forEach((v, i) => {
      const oracleCount = /Found (\d+) times/i.exec(oracle[i]);
      const excelFound = oracleCount ? Number(oracleCount[1]) : 0;
      if (v.foundCount === excelFound) agree += 1;
      else disagreements.push(`${v.payment.ref}: engine ${v.foundCount} vs excel ${excelFound} (${oracle[i]})`);
    });

    // The engine must reproduce the Excel mention counts on every row.
    expect(disagreements, disagreements.slice(0, 10).join("; ")).toEqual([]);
    expect(agree).toBe(payments.length);

    // And the statuses must be consistent with the outcome mix the file
    // records: 3 payments are marked "Not found" by the Excel process.
    expect(result.totals.notFound).toBe(3);
    // The workbook records 4 payments found 4 times: reversal pairs.
    const fourTimes = result.verdicts.filter((v) => v.foundCount === 4);
    expect(fourTimes.length).toBe(4);
    fourTimes.forEach((v) => expect(v.status).toBe("Reversed"));
  }, 60_000);

  it("GTB GAPS statement: payments from its own debit rows come back Paid", async () => {
    const fs = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const filePath = fileURLToPath(new URL("../.tmp-parser/gaps.xlsx", import.meta.url));
    if (!fs.existsSync(filePath)) {
      console.warn("gaps.xlsx not present; skipping GTB probe");
      return;
    }
    const XLSX = await import("xlsx");
    const wb = XLSX.read(fs.readFileSync(filePath), { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: "" });

    // Header at index 17: Trans Date, Reference, Value Date, Debit, Credit,
    // Balance, Remarks.
    const lines: StatementLine[] = [];
    for (let i = 18; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      if (String(r[3] ?? "").trim() === "" && String(r[4] ?? "").trim() === "") continue;
      lines.push(toStatementLine(lines.length + 1, { date: r[0], narration: r[6], debit: r[3], credit: r[4], refField: r[1] }));
    }
    expect(lines.length).toBeGreaterThan(1500);

    const withRef = lines.filter((l) => l.debit > 0 && !l.isChargeLine && l.refField.length > 3);
    const payments = withRef.slice(0, 40).map((l, i) =>
      toPaymentRow(i + 1, { ref: l.refField, beneficiary: "", amount: l.debit, dueDate: l.dateISO }),
    );
    const result = runCallOver(payments, lines);
    // Every payment must be found on the statement, and every verdict must
    // be justified: Paid means one debit, Double posted means the extra
    // debit rows really carry the same reference (GTB reuses some refs
    // across days, which is exactly what a call-over should surface).
    for (const v of result.verdicts) {
      expect(v.foundCount).toBeGreaterThanOrEqual(1);
      if (v.status === "Paid") expect(v.paymentDebits.length).toBe(1);
      if (v.status === "Double posted") expect(v.paymentDebits.length).toBeGreaterThanOrEqual(2);
      expect(["Paid", "Double posted"]).toContain(v.status);
    }
  }, 60_000);
});
