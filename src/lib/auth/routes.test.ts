import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SIGNED_IN_PATH,
  isAuthFlowPath,
  isAuthPath,
  isProtectedPath,
  PROTECTED_PREFIXES,
} from './routes';

describe('route classification', () => {
  it('protects exactly the four app areas required by M1', () => {
    expect([...PROTECTED_PREFIXES]).toEqual(['/today', '/growth', '/self', '/settings']);
  });

  it('treats each protected prefix and its children as protected', () => {
    for (const prefix of PROTECTED_PREFIXES) {
      expect(isProtectedPath(prefix)).toBe(true);
      expect(isProtectedPath(`${prefix}/nested`)).toBe(true);
    }
  });

  it('does not protect a route that merely shares a prefix', () => {
    expect(isProtectedPath('/todays-plan')).toBe(false);
    expect(isProtectedPath('/selfhood')).toBe(false);
  });

  it('leaves sign-in and the auth flow unprotected', () => {
    expect(isProtectedPath('/login')).toBe(false);
    expect(isProtectedPath('/auth/confirm')).toBe(false);
    expect(isProtectedPath('/auth/callback')).toBe(false);
  });

  it('identifies the sign-in surface', () => {
    expect(isAuthPath('/login')).toBe(true);
    expect(isAuthPath('/auth/confirm')).toBe(false);
  });

  it('identifies the auth flow, which must stay reachable in both states', () => {
    // Redirecting a signed-in user away from /auth/confirm would break the
    // flow that just signed them in — a redirect loop.
    expect(isAuthFlowPath('/auth/confirm')).toBe(true);
    expect(isAuthFlowPath('/auth/callback')).toBe(true);
    expect(isAuthFlowPath('/auth/auth-code-error')).toBe(true);
    expect(isAuthFlowPath('/login')).toBe(false);
  });

  it('never lets the signed-in destination be a protected-path redirect loop', () => {
    // The default destination must itself be protected; otherwise a signed-in
    // user bounced there would be bounced straight back out.
    expect(isProtectedPath(DEFAULT_SIGNED_IN_PATH)).toBe(true);
    expect(isAuthPath(DEFAULT_SIGNED_IN_PATH)).toBe(false);
  });
});
