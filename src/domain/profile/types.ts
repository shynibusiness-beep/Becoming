/**
 * Profile domain types.
 *
 * Mirrors `public.profiles`. No React, no Next, no Supabase — the same shape a
 * mobile client would consume.
 */

export const ONBOARDING_STATES = ['not_started', 'in_progress', 'completed'] as const;
export type OnboardingState = (typeof ONBOARDING_STATES)[number];

export interface Profile {
  readonly id: string;
  readonly timezone: string;
  readonly locale: string;
  readonly onboardingState: OnboardingState;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * The row shape as it comes back from PostgREST.
 *
 * Kept separate from `Profile` so the snake_case boundary is crossed exactly
 * once, in `toProfile`.
 */
export interface ProfileRow {
  readonly id: string;
  readonly timezone: string;
  readonly locale: string;
  readonly onboarding_state: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export function isOnboardingState(value: unknown): value is OnboardingState {
  return (
    typeof value === 'string' && (ONBOARDING_STATES as readonly string[]).includes(value)
  );
}

/** Narrows a database row to the domain type, rejecting anything unexpected. */
export function toProfile(row: ProfileRow): Profile | null {
  if (!isOnboardingState(row.onboarding_state)) {
    return null;
  }

  return {
    id: row.id,
    timezone: row.timezone,
    locale: row.locale,
    onboardingState: row.onboarding_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
