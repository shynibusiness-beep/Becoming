import { z } from 'zod';

/**
 * Server-only variables.
 *
 * Kept in its own module, separate from the public schema: the variable names
 * alone would otherwise travel into the browser bundle through any client
 * component that reads public configuration. Only `server.ts` imports this,
 * and that module is `server-only`.
 */
export const serverEnvSchema = z.object({
  /**
   * Secret (`sb_secret_…`) or legacy service-role key. Bypasses RLS, so it is
   * only used by explicitly server-owned operations. Optional in M0: nothing
   * needs it yet, and an absent value must not break local development.
   */
  SUPABASE_SECRET_KEY: z.string().min(20).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
