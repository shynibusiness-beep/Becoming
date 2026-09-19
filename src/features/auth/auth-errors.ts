import { AppError, type ErrorCode } from '@/lib/errors';

/**
 * Translates a Supabase auth failure into an `AppError`.
 *
 * Supabase messages are written for developers, are not localised, and
 * occasionally name internal detail. None of them may reach a user, so this is
 * the single place where a provider failure becomes product copy — anything
 * unrecognised becomes a neutral internal error rather than being passed
 * through.
 */

/** The subset of `AuthError` we rely on. Structural, so no SDK type is needed. */
export interface SupabaseAuthErrorLike {
  readonly code?: string | undefined;
  readonly status?: number | undefined;
  readonly name?: string | undefined;
}

interface Mapping {
  readonly code: ErrorCode;
  readonly userMessage: string;
}

/**
 * Keyed by Supabase's stable `code`. The copy follows the project's COPY
 * PRINCIPLES: it describes the situation, never judges the person.
 */
const BY_SUPABASE_CODE: Readonly<Record<string, Mapping>> = {
  over_email_send_rate_limit: {
    code: 'RATE_LIMITED',
    userMessage:
      'Wir haben gerade schon eine E-Mail geschickt. Bitte warte einen Moment.',
  },
  over_request_rate_limit: {
    code: 'RATE_LIMITED',
    userMessage: 'Einen Moment noch — das war etwas zu schnell.',
  },
  otp_expired: {
    code: 'VALIDATION_FAILED',
    userMessage: 'Dieser Link ist abgelaufen. Fordere einen neuen an.',
  },
  otp_disabled: {
    code: 'FORBIDDEN',
    userMessage: 'Die Anmeldung per E-Mail ist gerade nicht verfügbar.',
  },
  email_address_invalid: {
    code: 'VALIDATION_FAILED',
    userMessage: 'Diese E-Mail-Adresse sieht nicht gültig aus.',
  },
  validation_failed: {
    code: 'VALIDATION_FAILED',
    userMessage: 'Diese Eingabe passt so noch nicht.',
  },
  signup_disabled: {
    code: 'FORBIDDEN',
    userMessage: 'Neue Registrierungen sind derzeit geschlossen.',
  },
  email_provider_disabled: {
    code: 'FORBIDDEN',
    userMessage: 'Die Anmeldung per E-Mail ist gerade nicht verfügbar.',
  },
  flow_state_not_found: {
    code: 'VALIDATION_FAILED',
    userMessage: 'Dieser Link gilt nicht mehr. Fordere einen neuen an.',
  },
  flow_state_expired: {
    code: 'VALIDATION_FAILED',
    userMessage: 'Dieser Link ist abgelaufen. Fordere einen neuen an.',
  },
  bad_code_verifier: {
    code: 'VALIDATION_FAILED',
    userMessage:
      'Bitte öffne den Link in demselben Browser, in dem du ihn angefordert hast.',
  },
};

const RATE_LIMIT_MESSAGE: Mapping = {
  code: 'RATE_LIMITED',
  userMessage: 'Einen Moment noch — das war etwas zu schnell.',
};

function isNetworkFailure(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error && error.name === 'AuthRetryableFetchError')
  );
}

/**
 * Builds the `AppError` for a failed auth call.
 *
 * `event` is a short, stable, non-personal identifier for the logger — never
 * the email address or the token.
 */
export function toAuthAppError(error: unknown, event: string): AppError {
  if (isNetworkFailure(error)) {
    return new AppError('NETWORK', `${event}: network failure reaching Supabase Auth`, {
      cause: error,
    });
  }

  const candidate = error as SupabaseAuthErrorLike | null;
  const supabaseCode = typeof candidate?.code === 'string' ? candidate.code : undefined;
  const status = typeof candidate?.status === 'number' ? candidate.status : undefined;

  const mapping =
    (supabaseCode ? BY_SUPABASE_CODE[supabaseCode] : undefined) ??
    (status === 429 ? RATE_LIMIT_MESSAGE : undefined);

  if (mapping) {
    return new AppError(mapping.code, `${event}: ${supabaseCode ?? `status ${status}`}`, {
      userMessage: mapping.userMessage,
      cause: error,
      // Non-personal diagnostics only: a stable code and an HTTP status.
      context: { supabaseCode: supabaseCode ?? null, status: status ?? null },
    });
  }

  // Deliberately generic: an unrecognised provider message is never shown.
  return new AppError('INTERNAL', `${event}: unmapped auth failure`, {
    cause: error,
    context: { supabaseCode: supabaseCode ?? null, status: status ?? null },
  });
}
