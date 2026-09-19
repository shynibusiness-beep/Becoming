import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

import { track } from '@/analytics';
import { toAuthAppError } from '@/features/auth/auth-errors';
import { safeNextPath } from '@/lib/auth/redirect';
import { logger } from '@/lib/logging/logger';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

/**
 * PKCE code exchange.
 *
 * Used by OAuth providers and by e-mail links when the project is configured
 * for the code flow. No provider is enabled in M1 — this route exists so that
 * turning one on later is a configuration change rather than new code, and so
 * the redirect handling is written once, in one place.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const params = request.nextUrl.searchParams;
  const code = params.get('code');
  const next = safeNextPath(params.get('next'));

  // Providers report a refusal here (for example a cancelled consent screen).
  const providerError = params.get('error');
  if (providerError) {
    logger.warn('auth.callback_provider_error', { provider_error: providerError });
    redirect('/auth/auth-code-error');
  }

  if (!code) {
    logger.warn('auth.callback_rejected', { reason: 'missing_code' });
    redirect('/auth/auth-code-error');
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logger.exception('auth.callback_failed', toAuthAppError(error, 'auth.callback'));
    redirect('/auth/auth-code-error');
  }

  const { error: provisionError } = await supabase.rpc('ensure_profile');
  if (provisionError) {
    logger.exception('auth.callback_profile_provision_failed', provisionError);
  }

  logger.info('auth.signed_in', { method: 'oauth' });
  track('sign_in_completed', { method: 'google' });
  redirect(next);
}
