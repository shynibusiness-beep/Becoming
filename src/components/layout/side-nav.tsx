'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { StageBadge } from '@/components/ui/stage-badge';
import { cn } from '@/lib/utils/cn';
import { NavIcon } from './nav-icon';
import { isActiveRoute, PRIMARY_NAV_ITEMS, SETTINGS_ROUTE } from './navigation';

/** Desktop primary navigation. Replaces `BottomNav` from the `md` breakpoint up. */
export function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hauptnavigation"
      className={cn(
        'border-line-subtle bg-surface/60 hidden shrink-0 border-r md:block',
        'sticky top-0 h-dvh w-(--layout-side-nav-width) px-3 py-6',
      )}
    >
      <div className="flex flex-wrap items-center gap-2 px-3 pb-6">
        <span className="text-ink text-heading font-semibold tracking-tight">
          Becoming
        </span>
        <StageBadge />
      </div>

      <ul className="space-y-1">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const active = isActiveRoute(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3',
                  'text-label transition-colors duration-(--duration-fast)',
                  active
                    ? 'bg-accent-soft text-ink-accent font-medium'
                    : 'text-ink-secondary hover:bg-sunken hover:text-ink',
                )}
              >
                <NavIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-line-subtle mt-6 border-t pt-6">
        <Link
          href={SETTINGS_ROUTE}
          aria-current={isActiveRoute(pathname, SETTINGS_ROUTE) ? 'page' : undefined}
          className={cn(
            'text-label flex min-h-11 items-center rounded-[var(--radius-md)] px-3',
            'transition-colors duration-(--duration-fast)',
            isActiveRoute(pathname, SETTINGS_ROUTE)
              ? 'bg-accent-soft text-ink-accent font-medium'
              : 'text-ink-secondary hover:bg-sunken hover:text-ink',
          )}
        >
          Einstellungen
        </Link>
      </div>
    </nav>
  );
}
