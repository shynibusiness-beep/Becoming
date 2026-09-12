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
