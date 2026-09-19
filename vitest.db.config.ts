import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Database + Row Level Security suite.
 *
 * Separate from the default config because it needs a real PostgreSQL. RLS is
 * the release gate for M1, and it is only meaningful when tested against the
 * engine that enforces it — see supabase/tests/helpers/db.ts.
 *
 * Point it at a server with DATABASE_URL; it creates and drops its own
 * database, so it never touches anything else on that server.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['supabase/tests/**/*.test.ts'],
    globalSetup: ['./supabase/tests/global-setup.ts'],
    // Policies are shared state; running files in parallel against one
    // database would make failures hard to attribute.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
