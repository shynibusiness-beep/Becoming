import type { Route } from 'next';

export interface NavItem {
  readonly href: Route;
  readonly label: string;
  readonly icon: 'today' | 'growth' | 'self';
}

/**
 * Primary navigation (MAIN NAVIGATION in the project spec).
 *
 * Settings is intentionally not part of it — it is reachable from the top bar,
 * so the primary navigation stays at three destinations.
 */
export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { href: '/today', label: 'Heute', icon: 'today' },
  { href: '/growth', label: 'Entwicklung', icon: 'growth' },
  { href: '/self', label: 'Selbst', icon: 'self' },
] as const;

export const SETTINGS_ROUTE = '/settings' satisfies Route;

/** True for the item's own route and anything nested below it. */
export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
