"use client";

import Link from "next/link";
import { useEditableData, defaultAccounts } from "@/lib/dataStore";
import type { CoopAccount } from "@/data/coopAccounts";

/**
 * The Quick reference accounts table. Reads the editable accounts dataset,
 * so changes made on the Data page show here immediately.
 */
export function AccountsWidget() {
  const accounts = useEditableData<CoopAccount>("accounts", defaultAccounts);

  return (
    <div>
      <p className="eyebrow mb-1">Co-op accounts</p>
      <table className="ledger ledger--compact w-full">
        <caption className="sr-only">Co-operative bank accounts</caption>
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
              <td className="num">{a.accountNo}</td>
              <td className="whitespace-normal">{a.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-ink-faint mt-2">
        <Link href="/data" className="underline underline-offset-2 hover:text-stamp">
          Edit on the Data page
        </Link>
      </p>
    </div>
  );
}
