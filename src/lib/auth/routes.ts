/**
 * Route classification for authentication.
 *
 * Framework independent on purpose: the proxy, the server components and a
 * later mobile client all need the same answer to "may an anonymous visitor
 * see this?", and that answer must not live in three places.
 */

/** Everything below these prefixes requires a signed-in user. */
export const PROTECTED_PREFIXES = ['/today', '/growth', '/self', '/settings'] as const;

/** Sign-in surfaces. A signed-in user is sent away from these. */
export const AUTH_PREFIXES = ['/login'] as const;

/**
 * Auth plumbing: callback, confirmation and the error screen.
 *
 * These must stay reachable while signed out *and* while signed in — sending a
 * signed-in user away from `/auth/confirm` would break the very flow that
 * signed them in, which is how redirect loops start.
 */
export const AUTH_FLOW_PREFIXES = ['/auth'] as const;

/** Where a signed-in user lands when no specific destination is known. */
export const DEFAULT_SIGNED_IN_PATH = '/today';

/** Where an anonymous visitor is sent. */
export const SIGN_IN_PATH = '/login';

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isProtectedPath(pathname: string): boolean {
  return matchesPrefix(pathname, PROTECTED_PREFIXES);
}

export function isAuthPath(pathname: string): boolean {
  return matchesPrefix(pathname, AUTH_PREFIXES);
}

export function isAuthFlowPath(pathname: string): boolean {
  return matchesPrefix(pathname, AUTH_FLOW_PREFIXES);
}
