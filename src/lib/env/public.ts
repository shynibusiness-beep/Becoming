import { AppError } from '@/lib/errors/app-error';
import { formatEnvIssues } from './format';
import { publicEnvSchema, type PublicEnv } from './public-schema';

/**
 * `process.env.NEXT_PUBLIC_*` is substituted at build time by Next.js only
 * when it is written as a literal member expression. Never iterate over
 * `process.env` here — the values would be `undefined` in the browser.
 */
const rawPublicEnv = {
  NEXT_PUBLIC_APP_STAGE: process.env.NEXT_PUBLIC_APP_STAGE,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_ANALYTICS_PROVIDER: process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER,
};

const parsed = publicEnvSchema.safeParse(rawPublicEnv);

if (!parsed.success) {
  // Fail at build time rather than shipping a bundle that breaks at runtime.
  // Only variable names and rule descriptions are printed, never values.
  throw new AppError(
    'ENV_INVALID',
    `Invalid public environment configuration:\n${formatEnvIssues(parsed.error)}\n` +
      'See .env.example and the README ("Environment") for the expected values.',
  );
}

/** Validated, build-time-inlined public configuration. Safe to read anywhere. */
export const publicEnv: PublicEnv = Object.freeze(parsed.data);

export const isProductionStage = publicEnv.NEXT_PUBLIC_APP_STAGE === 'production';
