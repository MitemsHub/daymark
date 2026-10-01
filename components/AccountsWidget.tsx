"use client";

import { useEffect, useRef, useState } from "react";
import { useEditableData, defaultAccounts } from "@/lib/dataStore";
import type { CoopAccount } from "@/data/coopAccounts";

/**
 * The Quick reference accounts table. Reads the editable accounts dataset,
 * so changes made on the Data page show here immediately. Account numbers
 * are tap-to-copy with a brief inline confirmation.
 */
export function AccountsWidget() {
  const accounts = useEditableData<CoopAccount>("accounts", defaultAccounts);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function copyAccount(a: CoopAccount) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(a.accountNo);
      ok = true;
    } catch {
      // Clipboard API unavailable (insecure context, old browser): fall
      // back to a temporary textarea and the legacy copy command.
      try {
        const ta = document.createElement("textarea");
        ta.value = a.accountNo;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch {
        ok = false;
      }
    }
    if (!ok) return;
    setCopiedId(a.id);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopiedId(null), 1600);
  }

  return (
    <div>
      <p className="eyebrow mb-1">Co-op accounts</p>
      <span className="sr-only" role="status">
        {copiedId ? "Account number copied" : ""}
      </span>
      <div className="overflow-x-auto">
        <table className="ledger ledger--compact w-full">
        <caption className="sr-only">Co-operative bank accounts. Account numbers tap to copy.</caption>
        <thead>
          <tr>
            <th scope="col" className="!text-right">Account Code</th>
            <th scope="col">Name</th>
            <th scope="col">Account No</th>
            <th scope="col">Purpose</th>
          </tr>
        </thead>
        <tbody>
          {accounts.rows.map((a) => (
            <tr key={a.id}>
              <td className="num">{a.code}</td>
              <td className="whitespace-normal">{a.name}</td>
              <td className="num">
                <button
                  type="button"
                  onClick={() => copyAccount(a)}
                  className="tnum whitespace-nowrap rounded-sm px-1.5 py-1.5 -my-1.5 -mx-1 transition-colors hover:text-stamp active:bg-stamp-wash"
                  aria-label={`Copy the account number for ${a.name}`}
                >
                  {copiedId === a.id ? "Copied ✓" : a.accountNo}
                </button>
              </td>
              <td className="whitespace-normal">{a.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
