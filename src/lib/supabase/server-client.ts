import 'server-only';

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { publicEnv } from '@/lib/env/public';
import { logger } from '@/lib/logging/logger';
import { SUPABASE_COOKIE_OPTIONS } from './cookie-options';
import type { Database } from './database.types';

/**
 * Request-scoped Supabase client for Server Components, Route Handlers and
 * Server Actions.
 *
 * Still uses the publishable key — the user's session cookie is what grants
 * access, and RLS is what limits it. A new client is created per request
 * because the cookie store is request-scoped; do not hoist it to a module
 * level singleton.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: SUPABASE_COOKIE_OPTIONS,
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot mutate cookies. This is expected and
            // harmless: `src/proxy.ts` refreshes the session on every request,
            // so the rotated tokens still reach the browser.
            logger.debug('supabase.server.cookie_write_skipped', {
              reason: 'readonly_cookie_store',
            });
          }
        },
      },
    },
  );
}
