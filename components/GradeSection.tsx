"use client";

import { GradeQuickLookup } from "@/components/GradeQuickLookup";
import { GradeTable } from "@/components/GradeTable";
import { defaultGrades, useEditableData } from "@/lib/dataStore";
import { StatusNote } from "@/components/ui";

export function GradeSection() {
  const { rows, isEdited } = useEditableData("grades", defaultGrades);

  return (
    <div className="space-y-10">
      {isEdited && (
        <StatusNote kind="info">Showing your locally edited grades. Manage them on the Data page.</StatusNote>
      )}
      <GradeQuickLookup grades={rows} />
      <GradeTable grades={rows} />
    </div>
  );
}
