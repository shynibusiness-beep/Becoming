import Link from 'next/link';

import { StageBadge } from '@/components/ui/stage-badge';
import { SETTINGS_ROUTE } from './navigation';

/**
 * Mobile top bar: wordmark, stage badge and the settings entry point (settings
 * is deliberately not part of the primary navigation).
 *
 * Hidden from `md` up, where the sidebar already carries all three — an empty
 * bar there would cost vertical space and give nothing back.
 */
export function TopBar() {
  return (
    <header className="border-line-subtle bg-canvas/85 pt-safe sticky top-0 z-30 border-b backdrop-blur-sm md:hidden">
      <div className="mx-auto flex h-14 max-w-(--layout-wide-max) items-center justify-between gap-3 px-(--layout-gutter)">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-ink text-heading truncate font-semibold tracking-tight">
            Becoming
          </span>
          <StageBadge />
        </div>

        <Link
          href={SETTINGS_ROUTE}
          className="text-ink-secondary hover:text-ink text-label -mr-2 inline-flex min-h-11 shrink-0 items-center rounded-[var(--radius-md)] px-2 transition-colors duration-(--duration-fast)"
        >
          Einstellungen
        </Link>
      </div>
    </header>
  );
}
