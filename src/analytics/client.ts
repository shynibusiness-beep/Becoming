import type { AnalyticsEvent } from './events';

/**
 * Vendor-neutral analytics port.
 *
 * The app depends on this interface only. Swapping in PostHog later is a new
 * implementation of these three methods and one line in `index.ts` — no call
 * site changes, no vendor lock-in.
 */
export interface AnalyticsClient {
  /**
   * Associates subsequent events with a user.
   *
   * Takes an opaque id only — never an email address, name or any other
   * personal identifier.
   */
  identify(userId: string): void;

  track(event: AnalyticsEvent): void;

  /** Called on logout so a shared device does not merge two people's data. */
  reset(): void;
}
