"use client";

import { useEffect, useState } from "react";
import { formatDmy, parseDmy } from "@/lib/dates";

/**
 * Day-first date input for editors: a text field with automatic slashes
 * that commits only real calendar dates. Keeps partial typing local so
 * half-finished text never wipes a stored value.
 */
export function DmyInput({ id, value, onChange }: { id: string; value: string; onChange(iso: string): void }) {
  const [text, setText] = useState(() => formatDmy(value));

  useEffect(() => {
    setText((t) => (parseDmy(t) === value ? t : formatDmy(value)));
  }, [value]);

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="dd/mm/yyyy"
      value={text}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
        let next = digits;
        if (digits.length > 2) next = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        if (digits.length > 4) next = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        setText(next);
        const iso = parseDmy(next);
        if (iso) onChange(iso);
        else if (next === "") onChange("");
      }}
      className="tnum w-full border hairline bg-white rounded-sm px-2.5 py-1.5 text-sm"
    />
  );
}
