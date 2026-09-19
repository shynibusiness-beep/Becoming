import { describe, expect, it } from 'vitest';

import { isOnboardingState, toProfile, type ProfileRow } from './types';

const row: ProfileRow = {
  id: '8f14e45f-ceea-467a-9c3e-1e2f3a4b5c6d',
  timezone: 'Europe/Berlin',
  locale: 'de-DE',
  onboarding_state: 'not_started',
  created_at: '2026-09-19T08:00:00.000Z',
  updated_at: '2026-09-19T08:00:00.000Z',
};

describe('isOnboardingState', () => {
  it('accepts the three states the database enum allows', () => {
    expect(isOnboardingState('not_started')).toBe(true);
    expect(isOnboardingState('in_progress')).toBe(true);
    expect(isOnboardingState('completed')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isOnboardingState('done')).toBe(false);
    expect(isOnboardingState(null)).toBe(false);
    expect(isOnboardingState(3)).toBe(false);
  });
});

describe('toProfile', () => {
  it('maps a row to the domain shape', () => {
    expect(toProfile(row)).toEqual({
      id: row.id,
      timezone: 'Europe/Berlin',
      locale: 'de-DE',
      onboardingState: 'not_started',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  });

  it('rejects a row whose state is outside the enum instead of trusting it', () => {
    // Server data is not trusted blindly: a schema drift must surface as a
    // failure, not as an invalid value flowing into the UI.
    expect(toProfile({ ...row, onboarding_state: 'whatever' })).toBeNull();
  });

  it('carries no email or other personal field', () => {
    const profile = toProfile(row);

    expect(Object.keys(profile ?? {}).sort()).toEqual([
      'createdAt',
      'id',
      'locale',
      'onboardingState',
      'timezone',
      'updatedAt',
    ]);
  });
});
