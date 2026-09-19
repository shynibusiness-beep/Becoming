import type { Metadata } from 'next';
import Link from 'next/link';

import { SIGN_IN_PATH } from '@/lib/auth/routes';

export const metadata: Metadata = { title: 'Anmeldung nicht abgeschlossen' };

/**
 * Shown when a sign-in link could not be completed.
 *
 * Deliberately says nothing about *why* beyond what helps the person act: the
 * reason is in the server log, under a stable code, without the address.
 */
export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
      <h1 className="text-ink text-title font-semibold text-balance">
        Die Anmeldung wurde nicht abgeschlossen
      </h1>
      <p className="text-ink-secondary text-body text-pretty">
        Der Link ist abgelaufen oder wurde bereits verwendet. Fordere einfach einen neuen
        an — das passiert schnell.
      </p>
      <Link
        href={SIGN_IN_PATH}
        className="bg-accent text-accent-on hover:bg-accent-hover text-label mt-1 inline-flex h-11 items-center rounded-[var(--radius-md)] px-4 font-medium transition-colors duration-(--duration-fast)"
      >
        Neuen Link anfordern
      </Link>
    </main>
  );
}
