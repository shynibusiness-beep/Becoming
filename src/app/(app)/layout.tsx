import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { SkipLink } from '@/components/layout/skip-link';

export default function AppLayout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <AppShell>{children}</AppShell>
    </>
  );
}
