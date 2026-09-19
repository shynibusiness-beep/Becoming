import type { Metadata } from 'next';

import { signOut } from '@/features/auth/actions';
import { getSessionUser } from '@/features/auth/session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getOrCreateOwnProfile } from '@/services/profiles/profile-service';

export const metadata: Metadata = { title: 'Einstellungen' };

/** Shows only the part of an address needed to recognise the account. */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return 'Unbekannt';
  }
  const head = local.slice(0, 2);
  return `${head}${'•'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export default async function SettingsPage() {
  // Defence in depth: the proxy already blocks anonymous access, but the page
  // does not assume that and reads the verified session itself.
  const user = await getSessionUser();
  const profileResult = user ? await getOrCreateOwnProfile() : null;
  const profile = profileResult?.ok ? profileResult.value : null;

  return (
    <div className="space-y-6">
      <PageHeader
        overline="Einstellungen"
        title="Konto und Darstellung"
        description="Deine Daten gehören dir. Was hier noch fehlt, kommt in den nächsten Schritten."
      />

      <Card className="p-0">
        <dl className="divide-line-subtle divide-y">
          <div className="flex items-baseline justify-between gap-4 px-5 py-4">
            <dt className="text-ink text-label font-medium">Angemeldet als</dt>
            <dd className="text-ink-muted text-caption text-right break-all">
              {user?.email ? maskEmail(user.email) : 'Unbekannt'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-5 py-4">
            <dt className="text-ink text-label font-medium">Zeitzone</dt>
            <dd className="text-ink-muted text-caption text-right">
              {profile?.timezone ?? 'Noch nicht gesetzt'}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-5 py-4">
            <dt className="text-ink text-label font-medium">Sprache</dt>
            <dd className="text-ink-muted text-caption text-right">
              {profile?.locale ?? 'Noch nicht gesetzt'}
            </dd>
          </div>
        </dl>
      </Card>

      {profileResult && !profileResult.ok ? (
        <p role="alert" className="text-ink-secondary text-label">
          {profileResult.error.userMessage}
        </p>
      ) : null}

      <Card className="space-y-4">
        <div>
          <h2 className="text-ink text-heading font-medium">Abmelden</h2>
          <p className="text-ink-secondary text-label mt-1 text-pretty">
            Du kannst dich jederzeit wieder mit deiner E-Mail-Adresse anmelden.
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary">
            Abmelden
          </Button>
        </form>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-ink text-heading font-medium">Konto löschen</h2>
        <p className="text-ink-secondary text-label text-pretty">
          Wenn du gehst, gehen deine Daten mit. Die vollständige Löschung bauen wir vor
          der Beta — dann entfernt sie Profil und Verlauf in einem Schritt.
        </p>
        <p className="text-ink-muted text-caption">Noch nicht verfügbar.</p>
      </Card>
    </div>
  );
}
