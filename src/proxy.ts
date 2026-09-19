import type { NextRequest, NextResponse } from 'next/server';

import { updateSupabaseSession } from '@/lib/supabase/session';

/**
 * Runs before every matched request (the convention formerly called
 * `middleware`). Its only job in M0 is keeping the Supabase session fresh;
 * route protection arrives with auth in M1.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    /*
     * Every path except static assets and image files — those never carry a
     * session and refreshing on them would only add latency.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)',
  ],
};
