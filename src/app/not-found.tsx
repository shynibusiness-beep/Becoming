import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
      <p className="text-ink-muted text-overline font-medium uppercase">404</p>
      <h1 className="text-ink text-title font-semibold text-balance">
        Diese Seite gibt es nicht
      </h1>
      <p className="text-ink-secondary text-body text-pretty">
        Vielleicht hat sich die Adresse geändert.
      </p>
      <Link
        href="/today"
        className="bg-accent text-accent-on hover:bg-accent-hover text-label mt-1 inline-flex h-11 items-center rounded-[var(--radius-md)] px-4 font-medium transition-colors duration-(--duration-fast)"
      >
        Zurück zu Heute
      </Link>
    </main>
  );
}
