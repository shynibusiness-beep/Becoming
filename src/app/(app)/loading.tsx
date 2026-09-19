/**
 * Shared loading state for the app routes.
 *
 * A calm skeleton rather than a spinner: no motion is required to understand
 * it, which keeps it usable under `prefers-reduced-motion`.
 */
export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Inhalt wird geladen</span>

      <div className="space-y-2">
        <div className="bg-sunken h-3 w-20 rounded-[var(--radius-xs)]" />
        <div className="bg-sunken h-7 w-48 rounded-[var(--radius-sm)]" />
        <div className="bg-sunken h-4 w-full max-w-sm rounded-[var(--radius-xs)]" />
      </div>

      <div className="border-line-subtle h-32 rounded-[var(--radius-lg)] border border-dashed" />
    </div>
  );
}
