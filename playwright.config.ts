import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * Supabase Auth is stubbed for the suite (see e2e/support/auth-stub.ts), so the
 * app is built against the stub's URL — NEXT_PUBLIC_* is inlined at build time
 * and cannot be swapped afterwards.
 */
const AUTH_STUB_PORT = Number(process.env.E2E_AUTH_STUB_PORT ?? 54331);
const supabaseUrl = `http://127.0.0.1:${AUTH_STUB_PORT}`;

/**
 * Escape hatch for images that ship their own Chromium (prebuilt CI runners,
 * air-gapped environments) instead of the build Playwright downloads. Unset in
 * normal development, where `npx playwright install chromium` is the path.
 */
const executablePath = process.env.E2E_CHROMIUM_EXECUTABLE;
const launchOptions = executablePath ? { launchOptions: { executablePath } } : {};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Serial in CI for stable timing; Playwright's default locally.
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      // Primary design viewport (~390px wide).
      name: 'mobile',
      use: { ...devices['Pixel 7'], ...launchOptions },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        ...launchOptions,
      },
    },
  ],
  globalSetup: './e2e/global-setup.ts',
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_APP_STAGE: 'development',
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_e2e_stub_key_000000',
      NEXT_PUBLIC_ANALYTICS_PROVIDER: 'noop',
    },
  },
});
