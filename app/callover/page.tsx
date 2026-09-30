import type { Metadata } from "next";
import { Callover } from "@/components/Callover";

export const metadata: Metadata = {
  title: "Call Over",
  description:
    "Match a payment list against a bank statement and classify every payment: paid, reversed, double posted, partial, or not found. Printable call-over report.",
};

export default function CalloverPage() {
  return (
    <div className="space-y-8">
      <header className="hidden print:block">
        <p className="eyebrow">Daymark</p>
      </header>
      <Callover />
    </div>
  );
}
