/**
 * Analytics contract.
 *
 * Two hard rules, enforced by the types below:
 *
 * 1. No free text. Every property is a number, a boolean or a value from a
 *    closed union. A goal title or journal entry can therefore not be sent to
 *    an analytics vendor even by accident (PRIVACY in the project spec).
 *    Events without properties use `EmptyPayload`, not `{}` or
 *    `Record<never, never>` — those are assignable from *any* object, so
 *    `track('onboarding_started', { title: 'private text' })` would compile
 *    and the guarantee would be void.
 * 2. Event names are a closed union, so renaming one is a compile error rather
 *    than a silently broken dashboard.
 */

export type GrowthState = 'starting' | 'building' | 'stable';
export type ActionType = 'check_in' | 'timed';
export type ReviewDifficulty = 'too_easy' | 'about_right' | 'too_difficult';
export type RecommendationType =
  'KEEP' | 'REDUCE_FREQUENCY' | 'INCREASE_FREQUENCY' | 'CHANGE_DAY' | 'PAUSE';
export type EvidenceSource = 'manual' | 'timer';
export type AuthMethod = 'email_otp' | 'google' | 'apple';

/**
 * Avatar milestones that can currently be unlocked.
 *
 * A closed union, not a free string: the key travels to an analytics vendor,
 * so it must not be able to carry anything the user wrote. The two values are
 * the growth states that produce an unlock in the MVP (AVATAR MVP in the
 * project spec) — new milestones are added here when they actually exist.
 */
export type AvatarMilestoneKey = 'growth_building' | 'growth_stable';

/** Property values an event is allowed to carry. */
export type AnalyticsPropertyValue = string | number | boolean;

/**
 * Payload for an event that carries no properties.
 *
 * `Record<string, never>` rejects every property, because each value would
 * have to be `never`. `Record<never, never>` resolves to `{}`, which accepts
 * any object — see the privacy rule above.
 */
export type EmptyPayload = Record<string, never>;

export interface AnalyticsEventMap {
  signup_completed: { method: AuthMethod };
  onboarding_started: EmptyPayload;
  onboarding_completed: { stepCount: number };
  focus_created: { actionType: ActionType; frequencyPerWeek: number };
  first_action_completed: { source: EvidenceSource };
  action_completed: { source: EvidenceSource; actionType: ActionType; offline: boolean };
  weekly_review_opened: { weeksSinceStart: number };
  weekly_review_completed: {
    difficulty: ReviewDifficulty;
    plannedCount: number;
    completedCount: number;
  };
  recommendation_shown: { recommendationType: RecommendationType };
  recommendation_accepted: { recommendationType: RecommendationType };
  recommendation_rejected: { recommendationType: RecommendationType };
  goal_paused: { weeksActive: number };
  growth_state_changed: {
    fromState: GrowthState;
    toState: GrowthState;
    policyVersion: number;
  };
  avatar_milestone_unlocked: { milestoneKey: AvatarMilestoneKey };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

/**
 * A single event, tied to its own property shape.
 *
 * Modelled as a distributed union so `track({ name: 'goal_paused', properties: { … } })`
 * only accepts the properties that belong to `goal_paused`.
 */
export type AnalyticsEvent = {
  [Name in AnalyticsEventName]: {
    readonly name: Name;
    readonly properties: AnalyticsEventMap[Name];
  };
}[AnalyticsEventName];

export const ANALYTICS_EVENT_NAMES = [
  'signup_completed',
  'onboarding_started',
  'onboarding_completed',
  'focus_created',
  'first_action_completed',
  'action_completed',
  'weekly_review_opened',
  'weekly_review_completed',
  'recommendation_shown',
  'recommendation_accepted',
  'recommendation_rejected',
  'goal_paused',
  'growth_state_changed',
  'avatar_milestone_unlocked',
] as const satisfies readonly AnalyticsEventName[];
