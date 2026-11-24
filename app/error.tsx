"use client";

/**
 * Next renders this inside the root layout whenever a client component
 * throws during render, instead of its bare "Application error" screen.
 * A full reload is the dependable way out: the state and handlers that led
 * to the failure are rebuilt from scratch, and nothing stored on the device
 * is touched.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-xl py-10 reveal">
      <p className="eyebrow text-stamp mb-3">Something went wrong</p>
      <h1 className="display text-4xl sm:text-5xl mb-4">The page hit a snag</h1>
      <p className="text-ink-soft text-lg mb-6">
        A calculation or a saved value stopped this screen from drawing. Nothing on this device was
        changed; reloading the page usually clears it.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-stamp text-white rounded-sm px-4 py-2 text-sm font-medium hover:bg-stamp-deep transition-colors"
        >
          Reload the page
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="border hairline rounded-sm px-4 py-2 text-sm text-ink-soft hover:text-stamp hover:border-stamp transition-colors"
        >
          Try again
        </button>
      </div>
      {error.digest && (
        <p className="tnum text-xs text-ink-faint mt-6">Reference {error.digest}</p>
      )}
    </div>
  );
}
