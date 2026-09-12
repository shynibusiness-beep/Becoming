import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

/** Fails the test on any console error, so a broken hydration cannot pass silently. */
function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.describe('application shell', () => {
  test('root redirects to the daily view', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dein Tag');
  });

  test('every primary destination is reachable and titled', async ({ page }) => {
    const errors = trackConsoleErrors(page);

    for (const [path, heading] of [
      ['/today', 'Dein Tag'],
      ['/growth', 'Was sich aufbaut'],
      ['/self', 'Dein digitales Selbst'],
      ['/settings', 'Konto und Darstellung'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('unknown routes render the not-found page', async ({ page }) => {
    const response = await page.goto('/does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Diese Seite gibt es nicht' }),
    ).toBeVisible();
  });

  test('exposes exactly one primary navigation', async ({ page }) => {
    await page.goto('/today');

    // Both navs exist in the DOM; only the one for the current breakpoint is
    // visible, so assistive technology never announces duplicates.
    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toHaveCount(
      1,
    );
  });

  test('marks the current destination for assistive technology', async ({ page }) => {
    await page.goto('/growth');

    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await expect(nav.getByRole('link', { name: 'Entwicklung' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(nav.getByRole('link', { name: 'Heute' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('navigates between destinations by click', async ({ page }) => {
    await page.goto('/today');

    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
    await nav.getByRole('link', { name: 'Selbst' }).click();

    await expect(page).toHaveURL(/\/self$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Dein digitales Selbst',
    );
  });

  test('the skip link is the first tab stop and moves focus to the content', async ({
    page,
  }) => {
    await page.goto('/today');
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: 'Zum Inhalt springen' });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('does not scroll horizontally at the primary design viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/today');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('renders in dark mode without losing contrast on the body', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/today');

    const { background, color } = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return { background: style.backgroundColor, color: style.color };
    });

    expect(background).not.toBe(color);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('sends the baseline security headers', async ({ page }) => {
    const response = await page.goto('/today');
    const headers = response?.headers() ?? {};

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers).not.toHaveProperty('x-powered-by');
  });
});

test.describe('layout adaptation', () => {
  test('mobile shows the bottom navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/today');

    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    // Anchored to the bottom edge of the viewport.
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeGreaterThan(700);
  });

  test('desktop shows the sidebar and a settings entry point', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/today');

    const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
    const box = await nav.boundingBox();
    expect(box?.x).toBeLessThan(50);
    expect(box?.height ?? 0).toBeGreaterThan(400);

    await expect(nav.getByRole('link', { name: 'Einstellungen' })).toBeVisible();
  });
});

test.describe('client bundle safety', () => {
  test('no server secret reaches the browser', async ({ page }) => {
    const scriptBodies: string[] = [];

    page.on('response', async (response) => {
      if (!response.url().includes('/_next/static/')) return;
      if (!response.url().endsWith('.js')) return;
      scriptBodies.push(await response.text().catch(() => ''));
    });

    await page.goto('/today');
    await page.waitForLoadState('networkidle');

    const bundle = scriptBodies.join('\n');

    // No secret value...
    expect(bundle).not.toContain('sb_secret_');
    expect(bundle).not.toContain('service_role');
    // ...and not even the name of a server-only variable, which would mean the
    // server env schema had been pulled into the client module graph.
    expect(bundle).not.toContain('SUPABASE_SECRET_KEY');
  });
});
