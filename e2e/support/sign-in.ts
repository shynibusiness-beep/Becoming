import type { Page } from '@playwright/test';

/**
 * Signs in through the real application flow.
 *
 * The confirmation route, the Supabase client and the cookie handling are the
 * production ones; only the provider behind them is stubbed. See
 * e2e/support/auth-stub.ts.
 */
export async function signIn(page: Page, who = 'alice', next = '/today'): Promise<void> {
  await page.goto(
    `/auth/confirm?token_hash=valid-${who}&type=email&next=${encodeURIComponent(next)}`,
  );
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/'));
}
