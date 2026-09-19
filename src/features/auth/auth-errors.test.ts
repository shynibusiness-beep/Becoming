import { describe, expect, it } from 'vitest';

import { toAuthAppError } from './auth-errors';

describe('toAuthAppError', () => {
  it('maps a rate limit to RATE_LIMITED with reassuring copy', () => {
    const error = toAuthAppError(
      { code: 'over_email_send_rate_limit', status: 429 },
      'auth.otp',
    );

    expect(error.code).toBe('RATE_LIMITED');
    expect(error.userMessage).toContain('Moment');
  });

  it('falls back to the status when the code is unknown but the status is 429', () => {
    expect(toAuthAppError({ status: 429 }, 'auth.otp').code).toBe('RATE_LIMITED');
  });

  it('maps an expired link to a validation failure the user can act on', () => {
    const error = toAuthAppError({ code: 'otp_expired', status: 403 }, 'auth.verify');

    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.userMessage).toContain('abgelaufen');
  });

  it('maps a disabled provider to FORBIDDEN', () => {
    expect(toAuthAppError({ code: 'signup_disabled' }, 'auth.otp').code).toBe(
      'FORBIDDEN',
    );
  });

  it('maps a fetch failure to NETWORK', () => {
    expect(toAuthAppError(new TypeError('fetch failed'), 'auth.otp').code).toBe(
      'NETWORK',
    );
  });

  it('maps an unknown provider failure to a generic INTERNAL error', () => {
    const error = toAuthAppError({ code: 'some_new_code', status: 500 }, 'auth.otp');

    expect(error.code).toBe('INTERNAL');
    expect(error.userMessage).toBe(
      'Da ist etwas schiefgelaufen. Das liegt nicht an dir.',
    );
  });

  it('never leaks the provider message into the user-facing copy', () => {
    const raw = 'AuthApiError: invalid JWT signature at /token?grant_type=pkce';
    const error = toAuthAppError(new Error(raw), 'auth.verify');

    expect(error.userMessage).not.toContain('JWT');
    expect(error.userMessage).not.toContain('grant_type');
    expect(error.userMessage).not.toContain(raw);
  });

  it('keeps only non-personal diagnostics in the log context', () => {
    const error = toAuthAppError({ code: 'otp_expired', status: 403 }, 'auth.verify');

    expect(error.context).toEqual({ supabaseCode: 'otp_expired', status: 403 });
    expect(JSON.stringify(error.context)).not.toMatch(/@/);
  });
});
