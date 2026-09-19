/** First tab stop on every page: jumps past the navigation to the content. */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only-focusable bg-surface text-ink border-line focus-visible:ring-accent text-label shadow-e2 absolute top-2 left-2 z-50 rounded-[var(--radius-md)] border px-4 py-2 font-medium"
    >
      Zum Inhalt springen
    </a>
  );
}
