export function Footer() {
  return (
    <footer className="border-t hairline mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-sm text-ink-soft flex flex-wrap gap-x-6 gap-y-2 justify-between">
        <p>
          Powered by{" "}
          <a
            href="https://github.com/MitemsHub"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-stamp transition-colors"
          >
            Mitemshub
          </a>
        </p>
      </div>
    </footer>
  );
}
