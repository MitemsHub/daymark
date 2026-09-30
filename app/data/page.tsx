import type { Metadata } from "next";
import { DataManager } from "@/components/DataManager";

export const metadata: Metadata = {
  title: "Data",
  description: "Edit the investment series and member grade reference data without touching code.",
  robots: { index: false, follow: false },
};

export default function DataPage() {
  return (
    <div className="space-y-10">
      <header className="max-w-2xl reveal">
        <h1 className="display text-4xl sm:text-5xl mb-3">Data</h1>
        <p className="text-ink-soft text-lg">
          Update rates, dates and limits right here. Changes save to this browser and flow
          through every page — no code required.
        </p>
        <p className="text-sm text-ink-faint mt-3 max-w-prose">
          Edits live only on this device (browser storage). Export a JSON backup before clearing
          this browser, and re-import it elsewhere. The shipped defaults live in{" "}
          <code className="tnum">/data</code> and return when you reset.
        </p>
      </header>
      <DataManager />
    </div>
  );
}
