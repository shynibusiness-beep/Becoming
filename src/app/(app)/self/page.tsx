import type { Metadata } from 'next';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Selbst' };

/** M0 placeholder. Identity, goal, action system and avatar arrive in M2/M6. */
export default function SelfPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Selbst"
        title="Dein digitales Selbst"
        description="Wer du werden möchtest, und der Plan, der dich dorthin bringt."
      />

      <EmptyState
        title="Noch kein Fokus gewählt."
        description="Im Onboarding entscheidest du, wer du werden möchtest. Daraus entsteht ein konkreter Plan."
      />
    </div>
  );
}
