import { publicEnv } from '@/lib/env/public';
import type { AnalyticsClient } from './client';
import type { AnalyticsEvent, AnalyticsEventMap, AnalyticsEventName } from './events';
import { createNoopAnalyticsClient } from './noop-client';

let client: AnalyticsClient | undefined;

/**
 * Resolves the configured analytics client.
 *
 * A provider that fails to initialise must never break the product, so the
 * resolution always has a working fallback (see EDGE CASES: "Analytics
 * Provider nicht erreichbar").
 */
export function getAnalytics(): AnalyticsClient {
  if (client) {
    return client;
  }

  switch (publicEnv.NEXT_PUBLIC_ANALYTICS_PROVIDER) {
    case 'noop':
      client = createNoopAnalyticsClient();
      return client;
  }
}

/** Test/bootstrap seam for injecting a different implementation. */
export function setAnalyticsClient(next: AnalyticsClient): void {
  client = next;
}

export function resetAnalyticsClient(): void {
  client = undefined;
}

/**
 * Convenience wrapper with per-event property typing.
 *
 * `track('goal_paused', { weeksActive: 3 })` compiles; passing a property that
 * does not belong to the event does not.
 */
export function track<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEventMap[Name],
): void {
  getAnalytics().track({ name, properties } as AnalyticsEvent);
}

export type { AnalyticsClient } from './client';
export type {
  AnalyticsEvent,
  AnalyticsEventMap,
  AnalyticsEventName,
  ActionType,
  AuthMethod,
  EmptyPayload,
  EvidenceSource,
  GrowthState,
  RecommendationType,
  ReviewDifficulty,
} from './events';
export { ANALYTICS_EVENT_NAMES } from './events';
export { createNoopAnalyticsClient } from './noop-client';
