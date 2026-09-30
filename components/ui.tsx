"use client";

import { useId } from "react";
import { todayISO } from "@/lib/dates";

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="eyebrow block mb-1.5">
      {children}
    </label>
  );
}

export interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange(iso: string): void;
  withToday?: boolean;
}

/** Native date input with an optional "Today" button that fills the local date. */
export function DateField({ id, label, value, onChange, withToday = true }: DateFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex gap-2">
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="tnum flex-1 min-w-0 border hairline bg-white rounded-sm px-3 py-2 text-ink"
        />
        {withToday && (
          <button
            type="button"
            onClick={() => onChange(todayISO())}
            className="border hairline rounded-sm px-3 py-2 text-sm text-ink-soft hover:text-stamp hover:border-stamp transition-colors"
          >
            Today
          </button>
        )}
      </div>
    </div>
  );
}

export function StatRow({
  label,
  value,
  muted = false,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-2.5 border-b hairline last:border-b-0 ${
        accent ? "text-stamp" : ""
      }`}
    >
      <span className={`text-sm ${muted ? "text-ink-faint" : "text-ink-soft"}`}>{label}</span>
      <span className={`tnum ${accent ? "font-semibold" : "font-medium"} text-right`}>{value}</span>
    </div>
  );
}

export function StatusNote({ kind, children }: { kind: "error" | "info"; children: React.ReactNode }) {
  const cls =
    kind === "error"
      ? "text-stamp-deep bg-stamp-wash border-stamp/30"
      : "text-ink-soft bg-paper-sunken border-line";
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`text-sm px-3 py-2.5 border rounded-sm ${cls}`}>
      {children}
    </p>
  );
}
