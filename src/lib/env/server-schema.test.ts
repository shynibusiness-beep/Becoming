import { describe, expect, it } from 'vitest';

import { publicEnvSchema } from './public-schema';
import { serverEnvSchema } from './server-schema';

describe('serverEnvSchema', () => {
  it('allows the secret key to be absent (unused in M0)', () => {
    expect(serverEnvSchema.parse({}).SUPABASE_SECRET_KEY).toBeUndefined();
  });

  it('rejects an implausibly short secret key when one is set', () => {
    expect(serverEnvSchema.safeParse({ SUPABASE_SECRET_KEY: 'nope' }).success).toBe(
      false,
    );
  });

  it('accepts a plausible secret key', () => {
    const parsed = serverEnvSchema.parse({
      SUPABASE_SECRET_KEY: 'sb_secret_0123456789abcdef',
    });
    expect(parsed.SUPABASE_SECRET_KEY).toBe('sb_secret_0123456789abcdef');
  });

  it('never declares a NEXT_PUBLIC_ variable', () => {
    expect(
      Object.keys(serverEnvSchema.shape).some((key) => key.startsWith('NEXT_PUBLIC_')),
    ).toBe(false);
  });

  it('shares no variable with the public schema', () => {
    // The two schemas live in separate modules so the server variable names
    // stay out of the browser bundle; overlapping keys would defeat that.
    const publicKeys = new Set(Object.keys(publicEnvSchema.shape));

    expect(
      Object.keys(serverEnvSchema.shape).filter((key) => publicKeys.has(key)),
    ).toEqual([]);
  });
});
