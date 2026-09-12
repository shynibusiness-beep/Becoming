import { publicEnv } from '@/lib/env/public';

/**
 * Shows which backend a non-production build is talking to.
 *
 * Renders nothing in production. Its second job is to make the public env
 * module part of the build graph, so a misconfigured deployment fails at
 * build time instead of on a user's first page view.
 */
export function StageBadge() {
  const stage = publicEnv.NEXT_PUBLIC_APP_STAGE;

  if (stage === 'production') {
    return null;
  }

  return (
    <span
      className="border-line text-ink-muted text-overline rounded-[var(--radius-full)] border px-2 py-0.5 font-medium uppercase"
      title="Diese Umgebung ist keine Produktionsumgebung."
    >
      {stage}
    </span>
  );
}
