import 'server-only';

import { AppError } from '@/lib/errors/app-error';
import { formatEnvIssues } from './format';
import { serverEnvSchema, type ServerEnv } from './server-schema';

let cached: ServerEnv | undefined;

/**
 * Validated server-only configuration.
 *
 * Lazy on purpose: secrets are frequently injected at runtime (not at build
 * time), so validating them while bundling would fail for legitimate setups.
 * The `server-only` import above makes importing this from a client component
 * a build error.
 */
export function getServerEnv(): ServerEnv {
  if (cached) {
    return cached;
  }

  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });

  if (!parsed.success) {
    throw new AppError(
      'ENV_INVALID',
      `Invalid server environment configuration:\n${formatEnvIssues(parsed.error)}`,
    );
  }

  cached = Object.freeze(parsed.data);
  return cached;
}

/** Test seam. Not used by application code. */
export function resetServerEnvCache(): void {
  cached = undefined;
}
