'use client';

import { useEffect } from 'react';

import { logger } from '@/lib/logging/logger';

import './globals.css';

/**
 * Last resort boundary: catches failures in the root layout itself, so it has
 * to render its own `<html>`/`<body>`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    logger.exception('ui.global_error', error, { digest: error.digest ?? null });
  }, [error]);

  return (
    <html lang="de">
      <body>
        <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
          <h1 className="text-ink text-title font-semibold text-balance">
            Die App konnte nicht geladen werden
          </h1>
          <p className="text-ink-secondary text-body text-pretty">
            Da ist etwas schiefgelaufen. Das liegt nicht an dir.
          </p>
          <button
            type="button"
            onClick={reset}
            className="bg-accent text-accent-on inline-flex h-11 items-center rounded-[var(--radius-md)] px-4 font-medium"
          >
            Neu laden
          </button>
        </main>
      </body>
    </html>
  );
}
