import type { Metadata } from 'next';

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Einstellungen' };

interface SettingsRow {
  readonly label: string;
  readonly value: string;
  readonly milestone: string;
}

/**
 * M0 placeholder.
 *
 * Listing what is not wired up yet — instead of showing controls that silently
 * do nothing — keeps the shell honest while auth (M1) and the account screens
 * (M8) are still ahead.
 */
const PLANNED_SETTINGS: readonly SettingsRow[] = [
  { label: 'Konto', value: 'Noch nicht verfügbar', milestone: 'M1' },
  { label: 'Zeitzone', value: 'Automatisch erkannt', milestone: 'M1' },
  { label: 'Darstellung', value: 'Folgt dem System', milestone: 'M1' },
  { label: 'Daten löschen', value: 'Noch nicht verfügbar', milestone: 'M8' },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Einstellungen"
        title="Konto und Darstellung"
        description="Deine Daten gehören dir. Was hier noch fehlt, kommt in den nächsten Schritten."
      />

      <Card className="p-0">
        <dl className="divide-line-subtle divide-y">
          {PLANNED_SETTINGS.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 px-5 py-4"
            >
              <dt className="text-ink text-label font-medium">{row.label}</dt>
              <dd className="text-ink-muted text-caption text-right">
                {row.value}
                <span className="sr-only"> (geplant für {row.milestone})</span>
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
