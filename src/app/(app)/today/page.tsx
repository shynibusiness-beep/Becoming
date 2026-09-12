import type { Metadata } from 'next';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Heute' };

/**
 * M0 placeholder.
 *
 * The real screen (digital self, today's action, completion) lands in M3.
 * Until then this shows the genuine empty state rather than mock data, so the
 * shell is honest about what exists.
 */
export default function TodayPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Heute"
        title="Dein Tag"
        description="Hier steht später genau eine Sache: das, was heute dran ist."
      />

      <EmptyState
        title="Heute ist nichts geplant."
        description="Sobald du einen Fokus gewählt hast, erscheint hier deine nächste Aktivität."
      />
    </div>
  );
}
