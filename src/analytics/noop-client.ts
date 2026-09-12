import { logger } from '@/lib/logging/logger';
import type { AnalyticsClient } from './client';
import type { AnalyticsEvent } from './events';

/**
 * Default implementation: records nothing anywhere.
 *
 * The MVP ships without an analytics vendor on purpose. Having the contract in
 * place from M0 means instrumentation can be added as features land, and
 * turning on a real provider later does not require touching feature code.
 *
 * In development it logs the event name so the instrumentation is visible while
 * building; properties are structured and non-personal by construction.
 */
export function createNoopAnalyticsClient(): AnalyticsClient {
  return {
    identify(userId: string): void {
      logger.debug('analytics.identify', { userIdLength: userId.length });
    },

    track(event: AnalyticsEvent): void {
      logger.debug('analytics.track', { event: event.name });
    },

    reset(): void {
      logger.debug('analytics.reset');
    },
  };
}
