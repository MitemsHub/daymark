import type { Metadata } from "next";
import { GradeSection } from "@/components/GradeSection";

export const metadata: Metadata = {
  title: "Member Grade",
  description:
    "Member grade limits at a glance: credit limit, minimum contribution, global limit and annual limit for every grade.",
};

export default function GradesPage() {
  return (
    <div className="space-y-10">
      <header className="max-w-2xl reveal">
        <h1 className="display text-4xl sm:text-5xl mb-3">Member Grade</h1>
        <p className="text-ink-soft text-lg">
          Credit, contribution and limit reference for every grade — values as recorded in the source document.
        </p>
      </header>
      <GradeSection />
    </div>
  );
}
