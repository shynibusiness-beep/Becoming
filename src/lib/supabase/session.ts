import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { safeNextPath } from '@/lib/auth/redirect';
import {
  DEFAULT_SIGNED_IN_PATH,
  isAuthFlowPath,
  isAuthPath,
  isProtectedPath,
  SIGN_IN_PATH,
} from '@/lib/auth/routes';
import { publicEnv } from '@/lib/env/public';
import { logger } from '@/lib/logging/logger';
import { SUPABASE_COOKIE_OPTIONS } from './cookie-options';
import type { Database } from './database.types';

/**
 * Refreshes the Supabase session on every matched request and enforces which
 * routes an anonymous visitor may reach.
 *
 * Called from `src/proxy.ts`. Doing the check here as well as in the pages
 * means an expired session cannot leave a protected page rendered: the request
 * never reaches it.
 */
export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: SUPABASE_COOKIE_OPTIONS,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // `getUser()` (not `getSession()`) revalidates the token against Supabase
  // Auth, so a revoked or forged session cannot be replayed from a cookie.
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error && error.name !== 'AuthSessionMissingError') {
    // An anonymous visitor is normal; anything else is worth knowing about.
    logger.warn('supabase.session.refresh_failed', { errorName: error.name });
  }

  const { pathname } = request.nextUrl;

  // The auth flow itself stays reachable in both states. Redirecting a
  // signed-in user away from /auth/confirm would break the very request that
  // signs them in — that is how redirect loops start.
  if (isAuthFlowPath(pathname)) {
    return response;
  }

  if (!user && isProtectedPath(pathname)) {
    return redirectWithCookies(request, response, SIGN_IN_PATH, pathname);
  }

  if (user && isAuthPath(pathname)) {
    return redirectWithCookies(request, response, DEFAULT_SIGNED_IN_PATH);
  }

  return response;
}

/**
 * Redirects while preserving the cookies the refresh just rotated.
 *
 * Returning a bare `NextResponse.redirect` would drop them and the session
 * would be lost on the very next request.
 */
function redirectWithCookies(
  request: NextRequest,
  refreshed: NextResponse,
  pathname: string,
  next?: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';

  if (next !== undefined) {
    // Sanitised even though it comes from our own request: the pathname is
    // still attacker-shaped input.
    const target = safeNextPath(next);
    if (target !== DEFAULT_SIGNED_IN_PATH) {
      url.searchParams.set('next', target);
    }
  }

  const redirect = NextResponse.redirect(url);

  for (const cookie of refreshed.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }

  return redirect;
}
