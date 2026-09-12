'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { isAppError } from '@/lib/errors/app-error';
import { ERROR_CODE_MESSAGES } from '@/lib/errors/error-codes';
import { logger } from '@/lib/logging/logger';

/**
 * Route level error boundary.
 *
 * Shows `AppError.userMessage` when we produced the error ourselves, and a
 * neutral fallback otherwise — a raw exception message could contain internal
 * detail and must never reach the UI.
 */
export default function RouteError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    logger.exception('ui.route_error', error, {
      // The digest is Next.js' own opaque id for the server side stack trace.
      digest: error.digest ?? null,
    });
  }, [error]);

  const message = isAppError(error) ? error.userMessage : ERROR_CODE_MESSAGES.INTERNAL;

  return (
    <div className="mx-auto max-w-(--layout-content-max) space-y-5 py-10 text-center">
      <h1 className="text-ink text-title font-semibold text-balance">
        Das hat gerade nicht funktioniert
      </h1>
      <p className="text-ink-secondary text-body text-pretty">{message}</p>
      <div className="flex justify-center">
        <Button onClick={reset}>Erneut versuchen</Button>
      </div>
    </div>
  );
}
