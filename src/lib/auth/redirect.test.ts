import { describe, expect, it } from 'vitest';

import { safeNextPath } from './redirect';

describe('safeNextPath', () => {
  it('keeps a plain same-origin path', () => {
    expect(safeNextPath('/growth')).toBe('/growth');
    expect(safeNextPath('/self/settings')).toBe('/self/settings');
  });

  it('keeps a query string and fragment', () => {
    expect(safeNextPath('/today?from=email')).toBe('/today?from=email');
  });

  it('falls back when nothing is supplied', () => {
    expect(safeNextPath(null)).toBe('/today');
    expect(safeNextPath(undefined)).toBe('/today');
    expect(safeNextPath('')).toBe('/today');
  });

  it('honours an explicit fallback', () => {
    expect(safeNextPath(null, '/self')).toBe('/self');
  });

  describe('rejects open-redirect payloads', () => {
    const attacks = [
      // Absolute URLs to another origin.
      'https://evil.example/steal',
      'http://evil.example',
      '//evil.example',
      '///evil.example',
      // Scheme smuggling.
      'javascript:alert(1)',
      '/javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      // Backslashes, which several browsers normalise to forward slashes.
      '/\\evil.example',
      '\\\\evil.example',
      '/\\/evil.example',
      // Percent-encoded variants of the above.
      '%2F%2Fevil.example',
      '%2f%2fevil.example',
      'https%3A%2F%2Fevil.example',
      // Control characters and whitespace.
      '/today\nSet-Cookie: a=b',
      '/today\r\nLocation: https://evil.example',
      '/ today',
      '\u0000/today',
      // Relative paths that are not anchored to the origin root.
      'today',
      './today',
      '../../etc/passwd',
    ];

    for (const attack of attacks) {
      it(`rejects ${JSON.stringify(attack)}`, () => {
        expect(safeNextPath(attack)).toBe('/today');
      });
    }
  });

  it('rejects a malformed percent-escape instead of throwing', () => {
    expect(safeNextPath('/%E0%A4%A')).toBe('/today');
  });
});
