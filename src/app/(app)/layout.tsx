import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { SkipLink } from '@/components/layout/skip-link';
import { getSessionUser } from '@/features/auth/session';
import { SIGN_IN_PATH } from '@/lib/auth/routes';

/**
 * Every route in this group requires a signed-in user.
 *
 * The proxy already blocks anonymous requests before they get here. This check
 * is the second layer: if the proxy matcher is ever narrowed by mistake, the
 * pages still refuse to render rather than leaking a shell full of private
 * data.
 */
export default async function AppLayout({ children }: { readonly children: ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    redirect(SIGN_IN_PATH);
  }

  return (
    <>
      <SkipLink />
      <AppShell>{children}</AppShell>
    </>
  );
}
