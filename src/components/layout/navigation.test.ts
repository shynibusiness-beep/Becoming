import { describe, expect, it } from 'vitest';

import { isActiveRoute, PRIMARY_NAV_ITEMS, SETTINGS_ROUTE } from './navigation';

describe('primary navigation', () => {
  it('has exactly the three destinations from the spec', () => {
    expect(PRIMARY_NAV_ITEMS.map((item) => item.href)).toEqual([
      '/today',
      '/growth',
      '/self',
    ]);
  });

  it('keeps settings out of the primary navigation', () => {
    expect(PRIMARY_NAV_ITEMS.some((item) => item.href === SETTINGS_ROUTE)).toBe(false);
  });

  it('labels every destination', () => {
    for (const item of PRIMARY_NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });
});

describe('isActiveRoute', () => {
  it('matches the exact route', () => {
    expect(isActiveRoute('/today', '/today')).toBe(true);
  });

  it('matches nested routes', () => {
    expect(isActiveRoute('/growth/timeline', '/growth')).toBe(true);
  });

  it('does not match a route that merely shares a prefix', () => {
    expect(isActiveRoute('/selfhood', '/self')).toBe(false);
  });

  it('does not match a different route', () => {
    expect(isActiveRoute('/self', '/today')).toBe(false);
  });
});
