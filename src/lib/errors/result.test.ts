import { describe, expect, it } from 'vitest';

import { AppError, isAppError, toAppError } from './app-error';
import { err, errorResult, isErr, isOk, mapResult, ok, unwrap } from './result';

describe('AppError', () => {
  it('uses the default user message for its code', () => {
    const error = new AppError('UNAUTHENTICATED', 'no session cookie present');

    expect(error.code).toBe('UNAUTHENTICATED');
    expect(error.message).toBe('no session cookie present');
    expect(error.userMessage).toBe('Bitte melde dich an, um fortzufahren.');
  });

  it('lets the caller override the user message', () => {
    const error = new AppError('RULE_VIOLATION', 'second active goal rejected', {
      userMessage: 'Du hast bereits ein aktives Ziel.',
    });

    expect(error.userMessage).toBe('Du hast bereits ein aktives Ziel.');
  });

  it('keeps internal detail out of the client-safe shape', () => {
    const error = new AppError('INTERNAL', 'pg connection pool exhausted', {
      context: { poolSize: 20 },
    });

    expect(error.toClientSafe()).toEqual({
      code: 'INTERNAL',
      message: 'Da ist etwas schiefgelaufen. Das liegt nicht an dir.',
    });
  });

  it('exposes the developer message and context to the logger', () => {
    const error = new AppError('CONFLICT', 'schedule version already closed', {
      context: { actionId: 'a-1' },
    });

    expect(error.toLogSafe()).toEqual({
      code: 'CONFLICT',
      message: 'schedule version already closed',
      context: { actionId: 'a-1' },
    });
  });
});

describe('toAppError', () => {
  it('returns an AppError unchanged', () => {
    const original = new AppError('NOT_FOUND', 'goal missing');
    expect(toAppError(original)).toBe(original);
  });

  it('wraps a plain Error and keeps it as the cause', () => {
    const cause = new TypeError('fetch failed');
    const wrapped = toAppError(cause, 'NETWORK');

    expect(isAppError(wrapped)).toBe(true);
    expect(wrapped.code).toBe('NETWORK');
    expect(wrapped.cause).toBe(cause);
  });

  it('wraps non-Error throwables', () => {
    const wrapped = toAppError('something odd');

    expect(wrapped.code).toBe('INTERNAL');
    expect(wrapped.cause).toBe('something odd');
  });
});

describe('Result', () => {
  it('narrows on ok', () => {
    const result = ok(42);

    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it('narrows on err', () => {
    const result = err(new AppError('FORBIDDEN', 'not the owner'));

    expect(isErr(result)).toBe(true);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });

  it('builds an error result from a code', () => {
    const result = errorResult('VALIDATION_FAILED', 'frequency out of range', {
      context: { frequencyPerWeek: 99 },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.context).toEqual({ frequencyPerWeek: 99 });
    }
  });

  it('maps only the success branch', () => {
    expect(mapResult(ok(2), (n) => n * 2)).toEqual({ ok: true, value: 4 });

    const failure = err(new AppError('INTERNAL', 'boom'));
    expect(mapResult(failure, (n: number) => n * 2)).toBe(failure);
  });

  it('unwrap throws the contained error', () => {
    expect(() => unwrap(err(new AppError('NOT_FOUND', 'gone')))).toThrow(AppError);
    expect(unwrap(ok('value'))).toBe('value');
  });
});
