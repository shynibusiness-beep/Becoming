import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { publicEnv } from '@/lib/env/public';
import { logger } from '@/lib/logging/logger';
import type { Database } from './database.types';

/**
 * Refreshes the Supabase session on every matched request and forwards the
 * rotated auth cookies to the browser.
 *
 * Called from `src/proxy.ts`. M0 deliberately does not redirect: route
 * protection arrives with auth in M1. Keeping the refresh here from the start
 * means sessions never silently expire mid-session once auth does land.
 */
export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
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
  // Auth, so a revoked session cannot be replayed from a cookie.
  const { error } = await supabase.auth.getUser();

  if (error && error.name !== 'AuthSessionMissingError') {
    // An anonymous visitor is normal; anything else is worth knowing about.
    logger.warn('supabase.session.refresh_failed', { errorName: error.name });
  }

  return response;
}
