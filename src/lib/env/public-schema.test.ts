import { describe, expect, it } from 'vitest';

import { formatEnvIssues } from './format';
import { publicEnvSchema } from './public-schema';

const VALID_PUBLIC = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example-project.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_0123456789abcdef',
};

describe('publicEnvSchema', () => {
  it('applies defaults for optional variables', () => {
    const parsed = publicEnvSchema.parse(VALID_PUBLIC);

    expect(parsed.NEXT_PUBLIC_APP_STAGE).toBe('development');
    expect(parsed.NEXT_PUBLIC_ANALYTICS_PROVIDER).toBe('noop');
  });

  it('rejects a missing Supabase URL', () => {
    const result = publicEnvSchema.safeParse({
      ...VALID_PUBLIC,
      NEXT_PUBLIC_SUPABASE_URL: undefined,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a non-URL Supabase URL', () => {
    const result = publicEnvSchema.safeParse({
      ...VALID_PUBLIC,
      NEXT_PUBLIC_SUPABASE_URL: 'example-project.supabase.co',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an implausibly short publishable key', () => {
    const result = publicEnvSchema.safeParse({
      ...VALID_PUBLIC,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'short',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unknown stage', () => {
    const result = publicEnvSchema.safeParse({
      ...VALID_PUBLIC,
      NEXT_PUBLIC_APP_STAGE: 'qa',
    });

    expect(result.success).toBe(false);
  });

  it('accepts the three deployment stages', () => {
    for (const stage of ['development', 'staging', 'production'] as const) {
      const parsed = publicEnvSchema.parse({
        ...VALID_PUBLIC,
        NEXT_PUBLIC_APP_STAGE: stage,
      });
      expect(parsed.NEXT_PUBLIC_APP_STAGE).toBe(stage);
    }
  });

  it('exposes only NEXT_PUBLIC_ variables', () => {
    // Guards the "no secrets in the client" rule: this schema must not grow a
    // key that would carry a secret into the browser bundle.
    const keys = Object.keys(publicEnvSchema.shape);

    expect(keys.every((key) => key.startsWith('NEXT_PUBLIC_'))).toBe(true);
    expect(keys.some((key) => /secret|service_role/i.test(key))).toBe(false);
  });
});

describe('formatEnvIssues', () => {
  it('names the failing variables without printing their values', () => {
    const result = publicEnvSchema.safeParse({
      ...VALID_PUBLIC,
      NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatEnvIssues(result.error);
      expect(formatted).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(formatted).not.toContain('not-a-url');
    }
  });
});
