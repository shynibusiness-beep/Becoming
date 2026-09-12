'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils/cn';
import { NavIcon } from './nav-icon';
import { isActiveRoute, PRIMARY_NAV_ITEMS } from './navigation';

/**
 * Mobile primary navigation.
 *
 * Hidden from the accessibility tree above the `md` breakpoint, where
 * `SideNav` takes over, so assistive technology never announces two
 * navigations for the same destinations.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hauptnavigation"
      className={cn(
        'border-line-subtle bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t',
        'pb-safe backdrop-blur-sm md:hidden',
      )}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const active = isActiveRoute(pathname, item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 px-2 py-2',
                  'text-caption transition-colors duration-(--duration-fast)',
                  active ? 'text-ink-accent font-medium' : 'text-ink-muted',
                )}
              >
                <NavIcon icon={item.icon} />
                <span>{item.label}</span>
                {/* Active state is carried by an underline as well as by colour,
                    so colour is never the only signal. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-0.5 w-6 rounded-full transition-opacity duration-(--duration-fast)',
                    active ? 'bg-accent opacity-100' : 'opacity-0',
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
