import { z } from 'zod';

/**
 * Deployment stage. Distinct from `NODE_ENV`: a staging deployment is a
 * production *build* pointed at a staging Supabase project.
 */
export const appStageSchema = z.enum(['development', 'staging', 'production']);
export type AppStage = z.infer<typeof appStageSchema>;

/**
 * Variables that are inlined into the browser bundle.
 *
 * Anything added here becomes public. Secrets are described in
 * `server-schema.ts`, which is a separate module precisely so that not even
 * the *names* of server variables end up in the client bundle.
 */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_STAGE: appStageSchema.default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    error: 'NEXT_PUBLIC_SUPABASE_URL must be the full https URL of the Supabase project.',
  }),
  /**
   * Publishable (`sb_publishable_…`) or legacy anon key. Both are safe in a
   * browser: they only grant what Row Level Security allows.
   */
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY looks too short to be a real key.'),
  NEXT_PUBLIC_ANALYTICS_PROVIDER: z.enum(['noop']).default('noop'),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
