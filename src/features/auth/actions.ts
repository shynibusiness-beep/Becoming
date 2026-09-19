'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { track } from '@/analytics';
import { safeNextPath } from '@/lib/auth/redirect';
import { SIGN_IN_PATH } from '@/lib/auth/routes';
import { AppError, isAppError } from '@/lib/errors';
import { logger } from '@/lib/logging/logger';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { signInRequestSchema } from '@/validation/auth';
import { toAuthAppError } from './auth-errors';

/**
 * Result of the sign-in form.
 *
 * Plain serialisable data, not an `AppError` instance: this crosses the
 * server → client boundary, where React only serialises plain objects (see the
 * note on `AppError`). `message` is always user-facing copy.
 */
export type SignInFormState =
  | { readonly status: 'idle' }
  | { readonly status: 'sent'; readonly email: string }
  | { readonly status: 'error'; readonly code: string; readonly message: string };

function toFormError(error: unknown, event: string): SignInFormState {
  const appError = isAppError(error) ? error : toAuthAppError(error, event);
  logger.exception(event, appError);
  // The event carries the failure *code*, never the address or the provider's
  // message — the contract in src/analytics makes anything else uncompilable.
  track('sign_in_failed', { method: 'email_otp', errorCode: appError.code });
  const safe = appError.toClientSafe();
  return { status: 'error', code: safe.code, message: safe.message };
}

/**
 * Builds the absolute URL the magic link returns to.
 *
 * Derived from the request's own origin rather than from user input, so the
 * link can never be pointed at another host.
 */
async function callbackUrl(nextPath: string): Promise<string> {
  const headerList = await headers();
  const forwardedHost = headerList.get('x-forwarded-host');
  const host = forwardedHost ?? headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';

  if (!host) {
    throw new AppError('INTERNAL', 'auth.callback_url: request carried no host header');
  }

  const url = new URL('/auth/confirm', `${protocol}://${host}`);
  url.searchParams.set('next', nextPath);
  return url.toString();
}

/** Sends a magic link / one-time code to the address in the form. */
export async function requestSignInLink(
  _previous: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const parsed = signInRequestSchema.safeParse({ email: formData.get('email') });

  if (!parsed.success) {
    track('sign_in_failed', { method: 'email_otp', errorCode: 'VALIDATION_FAILED' });
    return {
      status: 'error',
      code: 'VALIDATION_FAILED',
      message: parsed.error.issues[0]?.message ?? 'Diese Eingabe passt so noch nicht.',
    };
  }

  const nextPath = safeNextPath(formData.get('next')?.toString());

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: { emailRedirectTo: await callbackUrl(nextPath) },
    });

    if (error) {
      return toFormError(error, 'auth.sign_in_link_failed');
    }

    // The address is never logged: the log line records only that a link went out.
    logger.info('auth.sign_in_link_sent');
    track('sign_in_requested', { method: 'email_otp' });
    return { status: 'sent', email: parsed.data.email };
  } catch (error) {
    return toFormError(error, 'auth.sign_in_link_failed');
  }
}

/** Ends the session and returns to the sign-in screen. */
export async function signOut(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    // A failed sign-out must still clear the UI, so this is logged and the
    // redirect happens anyway; the cookie is cleared by the client library.
    logger.exception('auth.sign_out_failed', error);
  } else {
    logger.info('auth.signed_out');
  }

  track('sign_out_completed', { reason: 'user_initiated' });

  redirect(SIGN_IN_PATH);
}
