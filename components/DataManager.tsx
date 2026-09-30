"use client";

import { useEffect, useRef, useState } from "react";
import type { InvestmentSeries } from "@/data/investmentSeries";
import type { MemberGrade } from "@/data/memberGrades";
import { defaultGrades, defaultSeries, useEditableData } from "@/lib/dataStore";
import { StatusNote } from "@/components/ui";
import { GradesEditor } from "@/components/GradesEditor";
import { SeriesEditor } from "@/components/SeriesEditor";

type Tab = "series" | "grades";

export function DataManager() {
  const series = useEditableData<InvestmentSeries>("series", defaultSeries);
  const grades = useEditableData<MemberGrade>("grades", defaultGrades);
  const [tab, setTab] = useState<Tab>("series");
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const isEdited = series.isEdited || grades.isEdited;

  function exportJSON() {
    const payload = {
      exported: new Date().toISOString(),
      series: series.rows,
      grades: grades.rows,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daymark-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Backup exported.");
  }

  function importJSON(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          series?: InvestmentSeries[];
          grades?: MemberGrade[];
        };
        if (Array.isArray(parsed.series)) series.saveAll(parsed.series);
        if (Array.isArray(parsed.grades)) grades.saveAll(parsed.grades);
        setMessage("Backup imported.");
      } catch {
        setMessage("That file didn't look like a Daymark backup.");
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    series.reset();
    grades.reset();
    setMessage("Reset to shipped defaults.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Dataset">
        {(
          [
            ["series", `Investment series (${series.rows.length})`],
            ["grades", `Member grades (${grades.rows.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`px-3 py-2 text-sm border rounded-sm transition-colors ${
              tab === value ? "border-stamp text-stamp bg-stamp-wash font-semibold" : "hairline text-ink-soft hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && <StatusNote kind="info"><span className="swap-in inline-block">{message}</span></StatusNote>}

      {tab === "series" ? (
        <SeriesEditor rows={series.rows} onSave={series.saveAll} />
      ) : (
        <GradesEditor rows={grades.rows} onSave={grades.saveAll} />
      )}

      <section aria-labelledby="backup-heading" className="border-t hairline pt-6">
        <h2 id="backup-heading" className="eyebrow mb-3">
          Backup
        </h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportJSON} className="border hairline rounded-sm px-4 py-2 text-sm hover:border-stamp hover:text-stamp transition-colors">
            Export JSON
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="border hairline rounded-sm px-4 py-2 text-sm hover:border-stamp hover:text-stamp transition-colors">
            Import JSON
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="border border-stamp/40 text-stamp-deep rounded-sm px-4 py-2 text-sm hover:bg-stamp-wash transition-colors"
          >
            Reset to defaults
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Import a Daymark data backup"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJSON(f);
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-xs text-ink-faint mt-3 max-w-prose">
          {isEdited
            ? "This browser currently uses locally edited data."
            : "No local edits yet. Every page is showing the shipped defaults."}
        </p>
      </section>
    </div>
  );
}
