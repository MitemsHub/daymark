// Call Over engine: match payments against a bank statement and classify
// what happened to each payment. Pure functions, no UI, no file access.
//
// The principle (from the printed call-over process): every payment carries
// a TRANSACTION REFERENCE, and the statement repeats that reference inside
// its narration lines. Counting and classifying the statement lines that
// carry a payment's reference tells you what happened to the money.
//
// Domain rule (the VAT/charge rule): payments at or above the charge
// threshold (default 10,000 naira) normally appear on the statement twice,
// once as the payment and once as a bank charge line (stamp duty, NIP
// charge, VAT) carrying the same reference. Payments below it appear once.
//
// Classification shown to the user is "Status (Found N times)" where
// Found N times is the raw mention count, matching the Excel process.

export interface StatementLine {
  id: number;
  dateISO: string;
  narration: string;
  /** lowercase alphanumeric-only form used for reference matching */
  normNarration: string;
  debit: number;
  credit: number;
  isChargeLine: boolean;
  isReversal: boolean;
  /** the bank's own Reference column value, normalized (GTB style); "" if none */
  refField: string;
}

export interface PaymentRow {
  id: number;
  ref: string;
  normRef: string;
  /** every normalized form of the reference worth searching for */
  candidates: string[];
  beneficiary: string;
  amount: number;
  dueDateISO: string;
}

export type CallOverStatus =
  | "Paid"
  | "Reversed"
  | "Partial reversal"
  | "Double posted"
  | "Short paid"
  | "Not found";

export interface RefHit {
  lineId: number;
  dateISO: string;
  narration: string;
  debit: number;
  credit: number;
  isCharge: boolean;
  isReversal: boolean;
}

export interface PaymentVerdict {
  payment: PaymentRow;
  /** every statement line whose narration carries this payment's reference */
  hits: RefHit[];
  /** real payment debits: not charge lines, not reversals */
  paymentDebits: RefHit[];
  /** real credits: refunds/reversal credits aimed at this reference */
  credits: RefHit[];
  /** charge-line debits (stamp duty, NIP charge, VAT) */
  chargeDebits: RefHit[];
  /** raw mention count, same number the Excel process shows */
  foundCount: number;
  status: CallOverStatus;
  /** sum of real payment debits, in naira */
  amountSeen: number;
  /** sum of credits aimed at this reference, in naira */
  amountReturned: number;
  /** a statement line that looks like this payment but lacks the reference */
  probable?: { lineId: number; narration: string; reason: string };
  note?: string;
}

export interface CallOverTotals {
  payments: number;
  paid: number;
  reversed: number;
  partialReversal: number;
  doublePosted: number;
  shortPaid: number;
  notFound: number;
  unexplainedDebits: number;
  unexplainedDebitTotal: number;
}

export interface CallOverResult {
  verdicts: PaymentVerdict[];
  /** statement debits no payment accounts for */
  unexplainedDebits: StatementLine[];
  totals: CallOverTotals;
}

/** Characters stripped when normalizing references and narrations. */
const SEPARATORS = /[\s/\\\-_.+,'’"]/g;

/** "ZB/A/006568/1" and "ZBA0065681" must become the same key. */
export function normalizeRef(raw: string): string {
  return (raw || "").toUpperCase().replace(SEPARATORS, "").trim();
}

/**
 * Reference candidates worth searching for. Real workbooks often carry the
 * reference inside a longer label, e.g. the cell reads
 * "Interest on Special Savings-ZB/A/006568/1" while the statement narration
 * only contains the reference itself. Besides the whole normalized cell we
 * add the segment after the last hyphen when it looks like a reference:
 * at least 6 characters, some letters, at least 4 digits.
 */
export function refCandidates(raw: string): string[] {
  const whole = normalizeRef(raw);
  const out = new Set<string>(whole ? [whole] : []);
  const tail = raw.split("-").pop()?.trim() ?? "";
  if (tail && tail !== raw) {
    const tailNorm = normalizeRef(tail);
    if (
      tailNorm &&
      tailNorm !== whole &&
      tailNorm.length >= 6 &&
      /[A-Z]/.test(tailNorm) &&
      (tailNorm.match(/[0-9]/g) ?? []).length >= 4
    ) {
      out.add(tailNorm);
    }
  }
  // Longest first so classification prefers the most specific candidate.
  return [...out].sort((a, b) => b.length - a.length);
}

/** Parse naira amounts like "NGN 410,000.00", "150000", "4,599.90". */
export function parseAmount(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.round(raw * 100) / 100 : 0;
  const s = String(raw ?? "").replace(/[^0-9.\-]/g, "");
  if (!s || s === "." || s === "-") return 0;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

/** Parse dates: ISO (2026-09-28), day-first (28/09/2026), dashed (28-Sep-26),
 *  and GTB-style datetimes ("8/1/26 17:51", the time part is dropped). */
export function parseDateAny(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const firstToken = s.split(/\s+/)[0] ?? s;
  const dmy = /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})$/.exec(s) ?? /^(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})$/.exec(firstToken);
  if (dmy) {
    const d = Number(dmy[1]);
    const m = Number(dmy[2]);
    let y = Number(dmy[3]);
    if (y < 100) y += 2000;
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  const mon = /^(\d{1,2})[- ]([A-Za-z]{3,})[- ](\d{2,4})$/.exec(s);
  if (mon) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const mi = months.indexOf(mon[2].slice(0, 3).toLowerCase());
    if (mi >= 0) {
      let y = Number(mon[3]);
      if (y < 100) y += 2000;
      return `${y}-${String(mi + 1).padStart(2, "0")}-${String(Number(mon[1])).padStart(2, "0")}`;
    }
  }
  return "";
}

export function isChargeNarration(narration: string): boolean {
  return /stamp\s*duty|nip\s*charge|charge\s*\+|\bvat\b|\bcot\b|sms\s*charge|commission|transfer\s*charge|maintenance\s*fee/i.test(
    narration,
  );
}

export function isReversalNarration(narration: string): boolean {
  return /\*\*\*rsvl|reversal|reverse/i.test(narration);
}

export function toStatementLine(id: number, raw: {
  date?: unknown; narration?: unknown; debit?: unknown; credit?: unknown; refField?: unknown;
}): StatementLine {
  const narration = String(raw.narration ?? "").trim();
  return {
    id,
    dateISO: parseDateAny(raw.date),
    narration,
    normNarration: narration.toUpperCase().replace(SEPARATORS, ""),
    debit: parseAmount(raw.debit),
    credit: parseAmount(raw.credit),
    isChargeLine: isChargeNarration(narration),
    isReversal: isReversalNarration(narration),
    refField: normalizeRef(String(raw.refField ?? "")),
  };
}

export function toPaymentRow(id: number, raw: {
  ref?: unknown; beneficiary?: unknown; amount?: unknown; dueDate?: unknown;
}): PaymentRow {
  const ref = String(raw.ref ?? "").trim();
  const candidates = refCandidates(ref);
  return {
    id,
    ref,
    normRef: candidates[0] ?? "",
    candidates,
    beneficiary: String(raw.beneficiary ?? "").trim(),
    amount: parseAmount(raw.amount),
    dueDateISO: parseDateAny(raw.dueDate),
  };
}

/**
 * The boundary rule, faithful to the Excel call-over formula: a reference
 * counts as present when it is followed by a separator (space, /, -, comma)
 * or sits at the end of the cell, never when a longer reference continues
 * with a digit. In normalized space (separators stripped) that is exactly:
 * the character after the match must not be a digit. This is what keeps
 * ZBA0065705 from matching ZBA00657050. Unlike SEARCH, matching runs on
 * normalized text, so ZB/A/006570/5 and ZBA0065705 behave identically.
 */
export function countRefOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    const after = at + needle.length < haystack.length ? haystack[at + needle.length] : "";
    if (!/[0-9]/.test(after)) count += 1;
    from = at + 1;
  }
  return count;
}

/**
 * Does a statement line carry any of this payment's reference candidates?
 * Two ways, both from the call-over practice: the reference appears inside
 * the narration (the Zenith way), or the line's own Reference column equals
 * the reference (the GTB way).
 */
export function lineCarriesRef(line: StatementLine, candidates: string[]): boolean {
  if (candidates.length === 0) return false;
  return candidates.some(
    (c) =>
      countRefOccurrences(line.normNarration, c) > 0 ||
      (line.refField !== "" && line.refField === c),
  );
}

function dayDistance(a: string, b: string): number {
  if (!a || !b) return 99;
  const da = new Date(`${a}T12:00:00`).getTime();
  const db = new Date(`${b}T12:00:00`).getTime();
  if (!Number.isFinite(da) || !Number.isFinite(db)) return 99;
  return Math.abs(Math.round((da - db) / 86_400_000));
}

/** Name tokens (4+ letters) of the beneficiary, longest first. */
function nameTokens(beneficiary: string): string[] {
  return beneficiary
    .toUpperCase()
    .replace(/[^A-Z ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);
}

/**
 * Classify one payment from the statement lines that carry its reference.
 * Evidence-based: the status comes from debits and credits actually seen,
 * while foundCount is the raw mention count shown in brackets.
 */
export function classifyPayment(payment: PaymentRow, lines: StatementLine[]): PaymentVerdict {
  const hits: RefHit[] = [];
  if (payment.candidates.length > 0) {
    for (const line of lines) {
      if (lineCarriesRef(line, payment.candidates)) {
        hits.push({
          lineId: line.id,
          dateISO: line.dateISO,
          narration: line.narration,
          debit: line.debit,
          credit: line.credit,
          isCharge: line.isChargeLine,
          isReversal: line.isReversal,
        });
      }
    }
  }

  const paymentDebits = hits.filter((h) => h.debit > 0 && !h.isCharge && !h.isReversal);
  const chargeDebits = hits.filter((h) => h.debit > 0 && h.isCharge && !h.isReversal);
  const credits = hits.filter((h) => h.credit > 0 && !h.isReversal);
  const reversalCredits = hits.filter((h) => h.credit > 0 && h.isReversal);
  const reversalDebits = hits.filter((h) => h.debit > 0 && h.isReversal);

  const amountSeen = paymentDebits.reduce((s, h) => s + h.debit, 0);
  const amountReturned = [...credits, ...reversalCredits].reduce((s, h) => s + h.credit, 0);
  const chargeTotal = chargeDebits.reduce((s, h) => s + h.debit, 0);
  const reversalDebitTotal = reversalDebits.reduce((s, h) => s + h.debit, 0);

  let status: CallOverStatus;
  let note: string | undefined;

  if (paymentDebits.length === 0 && credits.length === 0 && reversalCredits.length === 0) {
    status = "Not found";
  } else if (paymentDebits.length === 0) {
    // Reference only on credit lines: the money left no payment footprint.
    status = "Reversed";
    note = "No payment debit on the statement, only credit lines with this reference.";
  } else if (paymentDebits.length === 1) {
    if (credits.length === 0 && reversalCredits.length === 0) {
      status = "Paid";
      if (paymentDebits[0].debit < payment.amount - 0.005) {
        status = "Short paid";
        note = `Statement shows ${paymentDebits[0].debit.toLocaleString("en-NG")} against a payment of ${payment.amount.toLocaleString("en-NG")}.`;
      } else if (paymentDebits[0].debit > payment.amount + 0.005) {
        note = "Statement debit is larger than the payment amount; check for added fees.";
      }
    } else if (amountReturned >= amountSeen - 0.005) {
      status = "Reversed";
      note =
        chargeTotal + reversalDebitTotal > 0
          ? "Payment debit was returned by a matching credit; charge lines with the same reference were also reversed."
          : "Payment debit was returned by a matching credit.";
    } else {
      status = "Partial reversal";
      note = `Only ${amountReturned.toLocaleString("en-NG")} of ${amountSeen.toLocaleString("en-NG")} came back.`;
    }
  } else {
    status = "Double posted";
    note = `${paymentDebits.length} payment debits of ${amountSeen.toLocaleString("en-NG")} in total carry this reference.`;
    if (amountReturned > 0) {
      note += ` ${amountReturned.toLocaleString("en-NG")} was returned.`;
    }
  }

  return {
    payment,
    hits,
    paymentDebits,
    credits,
    chargeDebits,
    foundCount: hits.length,
    status,
    amountSeen,
    amountReturned,
    note,
  };
}

/**
 * The second look, beyond the reference: does the matched debit actually
 * resemble this payment? Amount must agree with the payment file, and the
 * beneficiary's name should appear in the narration. When the line was
 * matched through the bank's own Reference column (GTB style), the bank
 * already ties the line to the payment and the name check is skipped.
 * A miss never changes the status; it adds a cross-check note so a
 * copied-wrong reference cannot hide.
 */
export function crossCheckMatch(payment: PaymentRow, verdict: PaymentVerdict, lineIndex?: Map<number, StatementLine>): string | undefined {
  if (verdict.status !== "Paid" && verdict.status !== "Short paid") return undefined;
  const line = lineIndex?.get(verdict.paymentDebits[0]?.lineId ?? -1);
  if (!line) return undefined;

  const amountOk = Math.abs(line.debit - payment.amount) <= 0.005;

  const matchedViaRefField = payment.candidates.some((c) => line.refField !== "" && line.refField === c);
  const tokens = payment.beneficiary
    .toUpperCase()
    .replace(/[^A-Z ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4);
  const upper = line.narration.toUpperCase();
  const nameOk = matchedViaRefField || tokens.length === 0 || tokens.some((t) => upper.includes(t));

  if (amountOk && nameOk) return undefined;
  const bits: string[] = [];
  if (!amountOk) {
    bits.push(`the matched debit is ${line.debit.toLocaleString("en-NG")}, not the ${payment.amount.toLocaleString("en-NG")} on the payment file`);
  }
  if (!nameOk) {
    bits.push(`the name "${payment.beneficiary}" does not appear in the matched line's narration`);
  }
  return `Cross-check: ${bits.join(" and ")}. The reference matched, but look at this one before trusting it.`;
}

/**
 * For a payment with no reference hit, look for a statement debit with the
 * same amount, a date within a day or two, and the beneficiary's name
 * tokens in the narration. Never changes the status; only suggests.
 */
export function findProbable(
  payment: PaymentRow,
  lines: StatementLine[],
  claimed: Set<number>,
): PaymentVerdict["probable"] {
  if (payment.amount <= 0) return undefined;
  const tokens = nameTokens(payment.beneficiary);
  for (const line of lines) {
    if (claimed.has(line.id)) continue;
    if (line.debit <= 0 || line.isChargeLine || line.isReversal) continue;
    if (Math.abs(line.debit - payment.amount) > 0.005) continue;
    if (dayDistance(line.dateISO, payment.dueDateISO) > 1) continue;
    if (tokens.length === 0) continue;
    const upper = line.narration.toUpperCase();
    const hitTokens = tokens.filter((t) => upper.includes(t));
    if (hitTokens.length >= Math.min(2, tokens.length)) {
      return {
        lineId: line.id,
        narration: line.narration,
        reason: `Same amount (${line.debit.toLocaleString("en-NG")}), date within a day, and the name "${hitTokens.join(" ")}" appears in the narration.`,
      };
    }
  }
  return undefined;
}

/**
 * Run the whole call-over: classify every payment, then list statement
 * debits that no payment's reference accounts for.
 */
export function runCallOver(
  payments: PaymentRow[],
  lines: StatementLine[],
): CallOverResult {
  const verdicts = payments.map((p) => classifyPayment(p, lines));

  // Lines claimed by at least one payment's reference (any hit counts,
  // including charge lines: the reference itself is the claim).
  const claimed = new Set<number>();
  for (const v of verdicts) for (const h of v.hits) claimed.add(h.lineId);

  const unexplainedDebits = lines.filter(
    (l) => !claimed.has(l.id) && l.debit > 0 && !l.isChargeLine && !l.isReversal,
  );

  const totals: CallOverTotals = {
    payments: payments.length,
    paid: verdicts.filter((v) => v.status === "Paid").length,
    reversed: verdicts.filter((v) => v.status === "Reversed").length,
    partialReversal: verdicts.filter((v) => v.status === "Partial reversal").length,
    doublePosted: verdicts.filter((v) => v.status === "Double posted").length,
    shortPaid: verdicts.filter((v) => v.status === "Short paid").length,
    notFound: verdicts.filter((v) => v.status === "Not found").length,
    unexplainedDebits: unexplainedDebits.length,
    unexplainedDebitTotal: unexplainedDebits.reduce((s, l) => s + l.debit, 0),
  };

  const lineIndex = new Map(lines.map((l) => [l.id, l]));
  for (const v of verdicts) {
    if (v.status === "Not found") {
      v.probable = findProbable(v.payment, lines, claimed);
    }
    const cross = crossCheckMatch(v.payment, v, lineIndex);
    if (cross) v.note = v.note ? `${v.note} ${cross}` : cross;
  }

  return { verdicts, unexplainedDebits, totals };
}
