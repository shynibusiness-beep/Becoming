import { describe, expect, it } from 'vitest';

import { signInRequestSchema } from './auth';

describe('signInRequestSchema', () => {
  it('accepts a normal address and trims surrounding whitespace', () => {
    const parsed = signInRequestSchema.parse({ email: '  someone@example.com  ' });

    expect(parsed.email).toBe('someone@example.com');
  });

  it('rejects an empty address with actionable copy', () => {
    const result = signInRequestSchema.safeParse({ email: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('E-Mail-Adresse');
    }
  });

  it('rejects a malformed address', () => {
    expect(signInRequestSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects an implausibly long address', () => {
    const long = `${'a'.repeat(250)}@example.com`;

    expect(signInRequestSchema.safeParse({ email: long }).success).toBe(false);
  });
});
