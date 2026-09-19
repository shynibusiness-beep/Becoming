import type { Metadata } from 'next';

import { LoginForm } from '@/features/auth/login-form';
import { safeNextPath } from '@/lib/auth/redirect';
import { DEFAULT_SIGNED_IN_PATH } from '@/lib/auth/routes';

export const metadata: Metadata = { title: 'Anmelden' };

/**
 * Sign-in screen.
 *
 * The proxy already sends a signed-in visitor away from here, so this only
 * ever renders for an anonymous one.
 */
export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-(--layout-gutter) py-12">
      <header className="space-y-3">
        <p className="text-ink-muted text-overline font-medium uppercase">Becoming</p>
        <h1 className="text-ink text-display font-semibold text-balance">
          Willkommen zurück
        </h1>
        <p className="text-ink-secondary text-body text-pretty">
          Melde dich mit deiner E-Mail-Adresse an. Wir schicken dir einen Link — kein
          Passwort, das du dir merken musst.
        </p>
      </header>

      <LoginForm next={next === DEFAULT_SIGNED_IN_PATH ? undefined : next} />
    </main>
  );
}
