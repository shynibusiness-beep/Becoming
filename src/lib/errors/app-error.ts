import { ERROR_CODE_MESSAGES, type ErrorCode } from './error-codes';

/**
 * Context attached to an error for diagnostics.
 *
 * Deliberately restricted to primitives and expected to be non-personal:
 * ids, counts, enum values. Never user written text (goal titles, journal
 * entries) — see PRIVACY in the project spec.
 */
export type ErrorContext = Readonly<Record<string, string | number | boolean | null>>;

export interface AppErrorOptions {
  /** Overrides the default user facing copy for the code. */
  readonly userMessage?: string;
  readonly cause?: unknown;
  readonly context?: ErrorContext;
}

/**
 * The single error type crossing layer boundaries.
 *
 * `message` is for developers and logs. `userMessage` is the only string that
 * may be rendered to a user, which keeps internal detail out of the UI.
 *
 * `AppError` is a class instance and therefore does not cross an RSC → client
 * boundary. Two separate mechanisms enforce that:
 *
 * - **Thrown** while rendering on the server: Next.js replaces it with a
 *   generic `Error` carrying only a `digest`, so `userMessage` is lost and
 *   `isAppError` is false in the client error boundary.
 * - **Returned** as a Server Component prop or a Server Action result: React
 *   only serialises plain objects and a handful of built-ins, so a class
 *   instance is rejected outright.
 *
 * A `Result<T, AppError>` is no exception: wrapping the instance in a plain
 * object does not make the error inside it serialisable.
 *
 * So an expected server failure must either be **handled on the server**, or
 * **converted to plain serialisable client-safe data before the boundary** —
 * which is what `toClientSafe()` is for: a plain `{ code, message }` object
 * whose `message` is the user-facing `userMessage`. Never assume an
 * `AppError` — or a `Result` carrying one — arrives on the client as a class
 * object.
 *
 * `Result<T, AppError>` stays the right shape *within* the server (Server
 * Component → service → domain): no boundary is crossed there. Throwing
 * remains for unexpected failures, where generic copy is what we want anyway.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly context: ErrorContext;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.userMessage = options.userMessage ?? ERROR_CODE_MESSAGES[code];
    this.context = options.context ?? {};
  }

  /**
   * Shape that is safe to hand to the logger: no cause chain, no free text
   * beyond the developer message we wrote ourselves.
   */
  toLogSafe(): { code: ErrorCode; message: string; context: ErrorContext } {
    return { code: this.code, message: this.message, context: this.context };
  }

  /** Shape that is safe to send to a browser client. */
  toClientSafe(): { code: ErrorCode; message: string } {
    return { code: this.code, message: this.userMessage };
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/**
 * Normalises anything thrown into an `AppError`.
 *
 * Unknown throwables become `INTERNAL` and keep the original as `cause`, so a
 * `catch` block never has to inspect `unknown` itself.
 */
export function toAppError(
  value: unknown,
  fallbackCode: ErrorCode = 'INTERNAL',
): AppError {
  if (isAppError(value)) {
    return value;
  }

  if (value instanceof Error) {
    return new AppError(fallbackCode, value.message, { cause: value });
  }

  return new AppError(fallbackCode, 'Unknown error thrown', { cause: value });
}
