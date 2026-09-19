import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Domain + library logic is framework independent and runs in Node.
    // UI behaviour is covered by Playwright (see e2e/), which keeps the
    // dependency surface small and the tests closer to reality.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
    // supabase/tests needs a real PostgreSQL and runs via vitest.db.config.ts.
    exclude: ['node_modules/**', '.next/**', 'e2e/**', 'supabase/**'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/domain/**', 'src/lib/**', 'src/analytics/**', 'src/validation/**'],
    },
  },
});
