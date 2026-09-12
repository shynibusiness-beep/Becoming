'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { isAppError } from '@/lib/errors/app-error';
import { ERROR_CODE_MESSAGES } from '@/lib/errors/error-codes';
import { logger } from '@/lib/logging/logger';

/**
 * Route level error boundary.
 *
 * The `isAppError` branch only ever matches errors thrown in *client*
 * components: Next.js sanitises anything thrown while rendering on the server
 * before it crosses to this boundary, so the prototype and `userMessage` are
 * gone and only a generic message plus `digest` survive. Server failures
 * therefore always render the neutral fallback, which is the correct outcome —
 * a raw exception message could carry internal detail and must never reach the
 * UI.
 *
 * This is why expected server-side failures are *returned* as
 * `Result<T, AppError>` rather than thrown: a thrown one cannot carry its copy
 * to the user. Throwing stays reserved for genuinely unexpected failures.
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
