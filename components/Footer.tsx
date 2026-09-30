export function Footer() {
  return (
    <footer className="border-t hairline mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-sm text-ink-soft flex flex-wrap gap-x-6 gap-y-2 justify-between">
        <p>Daymark — a quiet instrument for dates, weeks and co-op reference.</p>
        <p className="tnum">
          Reference data lives in <code className="text-ink">/data</code>; edit it on the{" "}
          <a href="/data" className="underline underline-offset-2 hover:text-stamp">
            Data page
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
