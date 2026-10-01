"use client";

import { useEffect, useRef, useState } from "react";
import { formatDmy, parseDmy, todayISO } from "@/lib/dates";

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

/**
 * Day-first date entry with an optional "Today" button. The native date
 * control renders in the operating system's locale (mm/dd/yyyy on US
 * devices), so typing goes through a text field in dd/mm/yyyy instead,
 * with automatic slashes. The calendar button opens the native picker.
 */
export function DateField({ id, label, value, onChange, withToday = true }: DateFieldProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => formatDmy(value));

  // Outside edits (Today, reset, hydration) refresh the text.
  useEffect(() => {
    setText((t) => (parseDmy(t) === value ? t : formatDmy(value)));
  }, [value]);

  function commit(raw: string) {
    setText(raw);
    if (raw.trim() === "") {
      onChange("");
      return;
    }
    const iso = parseDmy(raw);
    if (iso) onChange(iso);
  }

  return (
    <div>
      <FieldLabel htmlFor={`${id}-display`}>{label}</FieldLabel>
      <div className="flex gap-2">
        <input
          id={`${id}-display`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/yyyy"
          value={text}
          onChange={(e) => {
            // Insert slashes automatically: 01102026 becomes 01/10/2026.
            const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
            let next = digits;
            if (digits.length > 2) next = `${digits.slice(0, 2)}/${digits.slice(2)}`;
            if (digits.length > 4) next = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
            commit(next);
          }}
          className="tnum flex-1 min-w-0 border hairline bg-white rounded-sm px-3 py-2 text-ink"
        />
        <button
          type="button"
          onClick={() => {
            const el = pickerRef.current;
            if (!el) return;
            if (value) el.value = value;
            if (typeof el.showPicker === "function") el.showPicker();
            else el.click();
          }}
          className="border hairline rounded-sm px-3 py-2 text-sm text-ink-soft hover:text-stamp hover:border-stamp transition-colors"
          aria-label={`Open the calendar for ${label.toLowerCase()}`}
        >
          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="2.5" y="4" width="15" height="13.5" rx="1.5" />
            <path d="M2.5 8.5h15M6.5 2v4M13.5 2v4" />
          </svg>
        </button>
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
      {/* Hidden native picker; its choice commits through the same onChange. */}
      <input
        ref={pickerRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
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
