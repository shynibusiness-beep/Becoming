import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export interface SessionUser {
  readonly id: string;
  readonly email: string | null;
}

/**
 * The signed-in user, or null.
 *
 * Uses `getUser()`, which revalidates the token against Supabase Auth, rather
 * than `getSession()`, which would trust whatever the cookie claims. Never
 * derive authorization from anything but this.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { id: user.id, email: user.email ?? null };
}
