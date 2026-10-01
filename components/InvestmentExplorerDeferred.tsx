"use client";

import { useEffect, useState } from "react";
import { InvestmentExplorer } from "@/components/InvestmentExplorer";

/**
 * The series explorer sits below the rate tables, so it never blocks the
 * first paint. Mounting it once the browser goes idle keeps its hydration
 * off the page's critical path; a quiet placeholder holds the space
 * meanwhile. Everything is interactive within about a second of load.
 */
export function InvestmentExplorerDeferred() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = () => setReady(true);
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(start, { timeout: 1200 });
      return () => {
        if (typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(start, 250);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <div
        className="min-h-64"
        aria-busy="true"
        aria-label="Loading the investment series reference"
      />
    );
  }
  return <InvestmentExplorer />;
}
