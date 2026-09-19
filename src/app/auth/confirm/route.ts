import { type EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

import { track } from '@/analytics';
import { toAuthAppError } from '@/features/auth/auth-errors';
import { safeNextPath } from '@/lib/auth/redirect';
import { logger } from '@/lib/logging/logger';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

/** The OTP types this route is willing to verify. Anything else is rejected. */
const ALLOWED_TYPES = new Set<EmailOtpType>(['email', 'magiclink', 'signup', 'recovery']);

function isAllowedType(value: string | null): value is EmailOtpType {
  return value !== null && ALLOWED_TYPES.has(value as EmailOtpType);
}

/**
 * Completes a magic-link / e-mail OTP sign-in.
 *
 * The link is attacker-reachable, so nothing in the query string is trusted:
 * the OTP type is checked against an allowlist, and the destination goes
 * through `safeNextPath` before any redirect.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  const next = safeNextPath(params.get('next'));

  if (!tokenHash || !isAllowedType(type)) {
    logger.warn('auth.confirm_rejected', { reason: 'missing_or_unsupported_parameters' });
    redirect('/auth/auth-code-error');
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // The provider message is logged as a stable code, never shown or echoed.
    logger.exception('auth.confirm_failed', toAuthAppError(error, 'auth.confirm'));
    redirect('/auth/auth-code-error');
  }

  // Provisioning is idempotent; this covers a user whose signup trigger did
  // not run. A failure here must not block sign-in.
  const { error: provisionError } = await supabase.rpc('ensure_profile');
  if (provisionError) {
    logger.exception('auth.confirm_profile_provision_failed', provisionError);
  }

  logger.info('auth.signed_in', { method: 'email_otp' });
  track('sign_in_completed', { method: 'email_otp' });
  redirect(next);
}
