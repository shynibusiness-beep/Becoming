import type { Metadata } from 'next';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Entwicklung' };

/** M0 placeholder. Growth states, history and timeline arrive in M4. */
export default function GrowthPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Entwicklung"
        title="Was sich aufbaut"
        description="Entwicklung wird aus dem berechnet, was du tatsächlich getan hast — nachvollziehbar, nicht geraten."
      />

      <EmptyState
        title="Noch keine Daten."
        description="Nach den ersten abgeschlossenen Aktivitäten siehst du hier, wie sich deine Routine entwickelt."
      />
    </div>
  );
}
