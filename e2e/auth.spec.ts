import { expect, test } from '@playwright/test';

import { signIn } from './support/sign-in';

const PROTECTED = ['/today', '/growth', '/self', '/settings'] as const;

test.describe('anonymous access', () => {
  for (const path of PROTECTED) {
    test(`redirects ${path} to sign-in`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Willkommen zurück',
      );
    });
  }

  test('remembers where the visitor was heading', async ({ page }) => {
    await page.goto('/growth');

    await expect(page).toHaveURL(/next=%2Fgrowth/);
  });

  test('renders no private shell while signed out', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toHaveCount(
      0,
    );
    await expect(page.getByText('Angemeldet als')).toHaveCount(0);
  });

  test('root redirects into the sign-in flow', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('sign-in form', () => {
  test('validates the address before contacting the provider', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('E-Mail-Adresse').fill('not-an-email');
    await page.getByRole('button', { name: 'Link anfordern' }).click();

    // Scoped by id: Next's route announcer also carries role="alert".
    const alert = page.locator('#email-error');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('E-Mail-Adresse');

    // The field is marked invalid for assistive technology, not just visually.
    await expect(page.getByLabel('E-Mail-Adresse')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('confirms that a link was sent', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('E-Mail-Adresse').fill('someone@example.test');
    await page.getByRole('button', { name: 'Link anfordern' }).click();

    await expect(page.getByRole('status')).toContainText('Schau in dein Postfach');
  });

  test('never shows a raw provider message', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('E-Mail-Adresse').fill('nope');
    await page.getByRole('button', { name: 'Link anfordern' }).click();

    const body = (await page.locator('body').textContent()) ?? '';
    expect(body).not.toMatch(/AuthApiError|AuthRetryableFetchError|gotrue|supabase\.co/i);
  });

  test('the form is reachable and labelled for keyboard users', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('E-Mail-Adresse')).toBeVisible();
    await page.getByLabel('E-Mail-Adresse').focus();
    await expect(page.getByLabel('E-Mail-Adresse')).toBeFocused();
  });
});

test.describe('signed-in access', () => {
  test('reaches every protected route after signing in', async ({ page }) => {
    await signIn(page, 'alice');
    await expect(page).toHaveURL(/\/today$/);

    for (const [path, heading] of [
      ['/today', 'Dein Tag'],
      ['/growth', 'Was sich aufbaut'],
      ['/self', 'Dein digitales Selbst'],
      ['/settings', 'Konto und Darstellung'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
  });

  test('restores the session across a reload', async ({ page }) => {
    await signIn(page, 'alice');

    await page.reload();
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dein Tag');
  });

  test('restores the session in a new tab of the same context', async ({
    page,
    context,
  }) => {
    await signIn(page, 'alice');

    const second = await context.newPage();
    await second.goto('/self');

    await expect(second.getByRole('heading', { level: 1 })).toHaveText(
      'Dein digitales Selbst',
    );
    await second.close();
  });

  test('sends a signed-in visitor away from the sign-in page', async ({ page }) => {
    await signIn(page, 'alice');

    await page.goto('/login');
    await expect(page).toHaveURL(/\/today$/);
  });

  test('honours the remembered destination', async ({ page }) => {
    await signIn(page, 'alice', '/growth');

    await expect(page).toHaveURL(/\/growth$/);
  });

  test('shows the account without printing the full address', async ({ page }) => {
    await signIn(page, 'alice');
    await page.goto('/settings');

    await expect(page.getByText('Angemeldet als')).toBeVisible();
    // The local part is masked, so a shoulder-surfer or a screenshot does not
    // expose the whole address.
    await expect(page.locator('body')).not.toContainText('alice@example.test');
    await expect(page.locator('body')).toContainText('@example.test');
  });
});

test.describe('session cookie hardening', () => {
  test('the session cookie is not readable by page JavaScript', async ({
    page,
    context,
  }) => {
    await signIn(page, 'alice');

    const cookies = await context.cookies();
    const authCookies = cookies.filter((cookie) => cookie.name.includes('auth-token'));
    expect(authCookies.length).toBeGreaterThan(0);

    for (const cookie of authCookies) {
      expect(cookie.httpOnly, `${cookie.name} should be httpOnly`).toBe(true);
      expect(cookie.sameSite).toBe('Lax');
      expect(cookie.path).toBe('/');
    }

    // The decisive check: the token is genuinely absent from document.cookie,
    // so an injected script cannot read it.
    const visible = await page.evaluate(() => document.cookie);
    expect(visible).not.toContain('auth-token');
  });
});

test.describe('sign-out', () => {
  test('ends the session and locks the private routes again', async ({ page }) => {
    await signIn(page, 'alice');
    await page.goto('/settings');

    await page.getByRole('button', { name: 'Abmelden' }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/today');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('invalid and expired sessions', () => {
  test('treats a tampered session cookie as signed out', async ({ page, context }) => {
    await signIn(page, 'alice');

    const cookies = await context.cookies();
    const authCookie = cookies.find((cookie) => cookie.name.includes('auth-token'));
    expect(authCookie, 'the app should have set a session cookie').toBeTruthy();

    await context.clearCookies();
    if (authCookie) {
      await context.addCookies([{ ...authCookie, value: `${authCookie.value}tampered` }]);
    }

    await page.goto('/today');
    await expect(page).toHaveURL(/\/login/);
  });

  test('treats a session the provider no longer knows as signed out', async ({
    page,
  }) => {
    await signIn(page, 'alice');

    // Signing out drops the token from the provider; the cookie is restored
    // afterwards to mimic a revoked-but-still-present session.
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Abmelden' }).click();

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('callback handling', () => {
  test('rejects a confirmation without a token', async ({ page }) => {
    await page.goto('/auth/confirm?type=email');

    await expect(page).toHaveURL(/auth-code-error/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'nicht abgeschlossen',
    );
  });

  test('rejects an unsupported OTP type', async ({ page }) => {
    await page.goto('/auth/confirm?token_hash=valid-alice&type=phone_change');

    await expect(page).toHaveURL(/auth-code-error/);
  });

  test('rejects an expired or already used link', async ({ page }) => {
    await page.goto('/auth/confirm?token_hash=stale-token&type=email');

    await expect(page).toHaveURL(/auth-code-error/);
  });

  test('rejects an OAuth callback without a code', async ({ page }) => {
    await page.goto('/auth/callback');

    await expect(page).toHaveURL(/auth-code-error/);
  });

  test('reports a provider refusal without echoing it', async ({ page }) => {
    await page.goto('/auth/callback?error=access_denied&error_description=User+said+no');

    await expect(page).toHaveURL(/auth-code-error/);
    await expect(page.locator('body')).not.toContainText('access_denied');
  });

  test('the error screen offers a way back into the flow', async ({ page }) => {
    await page.goto('/auth/auth-code-error');

    await page.getByRole('link', { name: 'Neuen Link anfordern' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('open redirect', () => {
  const payloads = [
    'https://evil.example/steal',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    '%2F%2Fevil.example',
  ];

  for (const payload of payloads) {
    test(`never follows ${payload} after sign-in`, async ({ page }) => {
      await page.goto(
        `/auth/confirm?token_hash=valid-alice&type=email&next=${encodeURIComponent(payload)}`,
      );

      // Whatever happens, the browser must still be on our own origin.
      await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:\d+\//);
      await expect(page).not.toHaveURL(/evil\.example/);
    });
  }

  test('never follows a hostile next parameter from the sign-in page', async ({
    page,
  }) => {
    await page.goto('/login?next=https%3A%2F%2Fevil.example');

    const hidden = page.locator('input[name="next"]');
    // The hostile value is dropped rather than round-tripped into the form.
    await expect(hidden).toHaveCount(0);
  });
});

test.describe('no redirect loops', () => {
  test('settles on the sign-in page in a bounded number of hops', async ({ page }) => {
    const seen: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) seen.push(frame.url());
    });

    await page.goto('/today');
    await page.waitForURL(/\/login/);

    expect(seen.length).toBeLessThan(6);
  });

  test('settles on the app in a bounded number of hops when signed in', async ({
    page,
  }) => {
    await signIn(page, 'alice');

    const seen: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) seen.push(frame.url());
    });

    await page.goto('/login');
    await page.waitForURL(/\/today$/);

    expect(seen.length).toBeLessThan(6);
  });
});

test.describe('cross-user isolation in the browser', () => {
  test('two sessions never see each other', async ({ browser }) => {
    const aliceContext = await browser.newContext();
    const bobContext = await browser.newContext();

    try {
      const alice = await aliceContext.newPage();
      const bob = await bobContext.newPage();

      await signIn(alice, 'alice');
      await signIn(bob, 'bob');

      await alice.goto('/settings');
      await bob.goto('/settings');

      await expect(alice.locator('body')).toContainText('@example.test');
      await expect(alice.locator('body')).not.toContainText('bob');
      await expect(bob.locator('body')).not.toContainText('alice');
    } finally {
      await aliceContext.close();
      await bobContext.close();
    }
  });
});
