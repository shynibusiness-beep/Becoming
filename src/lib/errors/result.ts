import { AppError } from './app-error';
import type { ErrorCode } from './error-codes';

/**
 * Explicit success/failure value for domain and service functions.
 *
 * Domain code returns `Result` instead of throwing so that every caller — a
 * React Server Component today, a React Native screen later — has to deal
 * with the failure case. Framework independent on purpose.
 */
export type Result<T, E = AppError> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function errorResult(
  code: ErrorCode,
  message: string,
  options?: ConstructorParameters<typeof AppError>[2],
): Result<never, AppError> {
  return err(new AppError(code, message, options));
}

export function isOk<T, E>(
  result: Result<T, E>,
): result is { readonly ok: true; readonly value: T } {
  return result.ok;
}

export function isErr<T, E>(
  result: Result<T, E>,
): result is { readonly ok: false; readonly error: E } {
  return !result.ok;
}

/** Unwraps a result, throwing the error. Only for call sites that truly cannot continue. */
export function unwrap<T>(result: Result<T, AppError>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}
