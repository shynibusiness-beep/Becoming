import { publicEnv } from '@/lib/env/public';

/**
 * Cookie settings for the Supabase session.
 *
 * `@supabase/ssr` defaults to `httpOnly: false`, because its browser client
 * reads the session out of `document.cookie`. This application never uses that
 * client — every Supabase call happens on the server, in a Server Component, a
 * Server Action or a route handler — so the session can be kept out of reach of
 * page JavaScript entirely. That turns an XSS from "session stolen" into
 * "session used only while the script runs".
 *
 * If a browser-side Supabase client is ever introduced, `httpOnly` has to come
 * back off; keeping the decision in one named place makes that trade-off
 * visible rather than accidental.
 */
export const SUPABASE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  // Lax rather than Strict on purpose: the sign-in link is a top-level
  // navigation from a mail client, and Strict would drop the cookie there.
  secure: publicEnv.NEXT_PUBLIC_APP_STAGE !== 'development',
  path: '/',
} as const;
