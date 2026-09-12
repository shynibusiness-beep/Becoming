import { describe, expect, it } from 'vitest';

import { resetLogSink, setLogSink, type LogRecord } from '@/lib/logging/logger';
import type { AnalyticsClient } from './client';
import { getAnalytics, resetAnalyticsClient, setAnalyticsClient, track } from './index';
import {
  ANALYTICS_EVENT_NAMES,
  type AnalyticsEvent,
  type AnalyticsEventMap,
} from './events';
import { createNoopAnalyticsClient } from './noop-client';

describe('analytics contract', () => {
  it('keeps the exported name list in sync with the event map', () => {
    // `ANALYTICS_EVENT_NAMES` is what a provider adapter iterates over; it
    // drifting away from the typed map would silently drop instrumentation.
    const namesFromMap: readonly (keyof AnalyticsEventMap)[] = [
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
    ];

    expect([...ANALYTICS_EVENT_NAMES].sort()).toEqual([...namesFromMap].sort());
  });

  it('covers every event named in the ANALYTICS CONTRACT', () => {
    expect(ANALYTICS_EVENT_NAMES).toHaveLength(14);
  });

  it('rejects free text on an event that carries no properties', () => {
    // A compile-time regression test: `npm run typecheck` includes this file,
    // so if the payload type ever widens back to something `{}`-like, the
    // expect-error directive below stops matching and the typecheck fails.
    // `Record<never, never>` had exactly that hole.
    // @ts-expect-error — no property may be attached to this event.
    track('onboarding_started', { title: 'Ich möchte ruhiger werden' });

    // The legitimate call still compiles.
    track('onboarding_started', {});

    expect(true).toBe(true);
  });
});

describe('noop analytics client', () => {
  it('implements the full port', () => {
    const client: AnalyticsClient = createNoopAnalyticsClient();

    expect(typeof client.identify).toBe('function');
    expect(typeof client.track).toBe('function');
    expect(typeof client.reset).toBe('function');
  });

  it('sends nothing anywhere and does not throw', () => {
    const client = createNoopAnalyticsClient();

    expect(() =>
      client.track({
        name: 'weekly_review_completed',
        properties: { difficulty: 'too_difficult', plannedCount: 4, completedCount: 1 },
      }),
    ).not.toThrow();
    expect(() => client.identify('u-1')).not.toThrow();
    expect(() => client.reset()).not.toThrow();
  });

  it('never logs event properties, only the event name', () => {
    const records: LogRecord[] = [];
    setLogSink({ write: (record) => void records.push(record) });

    try {
      createNoopAnalyticsClient().track({
        name: 'growth_state_changed',
        properties: { fromState: 'starting', toState: 'building', policyVersion: 1 },
      });

      expect(records[0]?.context).toEqual({ event: 'growth_state_changed' });
    } finally {
      resetLogSink();
    }
  });

  it('never logs the user id itself on identify', () => {
    const records: LogRecord[] = [];
    setLogSink({ write: (record) => void records.push(record) });

    try {
      createNoopAnalyticsClient().identify('8f14e45f-ceea-467a-9c3e-1e2f3a4b5c6d');

      expect(JSON.stringify(records[0])).not.toContain('8f14e45f');
    } finally {
      resetLogSink();
    }
  });
});

describe('analytics module wiring', () => {
  it('resolves the configured provider and memoises it', () => {
    resetAnalyticsClient();

    // Memoised: a provider adapter may register listeners on construction.
    expect(getAnalytics()).toBe(getAnalytics());

    resetAnalyticsClient();
  });

  it('routes track() through the configured client with the event name intact', () => {
    const tracked: AnalyticsEvent[] = [];
    setAnalyticsClient({
      identify: () => undefined,
      track: (event) => void tracked.push(event),
      reset: () => undefined,
    });

    try {
      track('action_completed', { source: 'timer', actionType: 'timed', offline: false });

      expect(tracked).toEqual([
        {
          name: 'action_completed',
          properties: { source: 'timer', actionType: 'timed', offline: false },
        },
      ]);
    } finally {
      resetAnalyticsClient();
    }
  });
});
