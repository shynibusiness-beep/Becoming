import 'server-only';

import { toProfile, type Profile, type ProfileRow } from '@/domain/profile/types';
import { AppError, err, ok, type Result } from '@/lib/errors';
import { logger } from '@/lib/logging/logger';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

/**
 * Profile access for the signed-in user.
 *
 * Every query here runs with the user's own JWT, so Row Level Security decides
 * what comes back. No user id is ever accepted as a parameter: it is read from
 * the verified session, which is the only trustworthy source.
 */

/**
 * Reads the caller's profile, provisioning it if it is missing.
 *
 * The database trigger on `auth.users` normally creates the row during signup.
 * `ensure_profile()` is the repair path for a session that predates the
 * migration or whose trigger did not run; it is idempotent and derives the row
 * from `auth.uid()`.
 */
export async function getOrCreateOwnProfile(): Promise<Result<Profile, AppError>> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return err(
      new AppError('UNAUTHENTICATED', 'profile.read: no verified session', {
        cause: userError,
      }),
    );
  }

  const existing = await supabase
    .from('profiles')
    .select('id, timezone, locale, onboarding_state, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle();

  if (existing.error) {
    logger.exception('profile.read_failed', existing.error);
    return err(new AppError('INTERNAL', 'profile.read: query failed'));
  }

  if (existing.data) {
    return fromRow(existing.data as ProfileRow);
  }

  const provisioned = await supabase.rpc('ensure_profile');

  if (provisioned.error) {
    logger.exception('profile.provision_failed', provisioned.error);
    return err(new AppError('INTERNAL', 'profile.provision: rpc failed'));
  }

  const row = Array.isArray(provisioned.data) ? provisioned.data[0] : provisioned.data;

  if (!row) {
    return err(new AppError('INTERNAL', 'profile.provision: rpc returned no row'));
  }

  return fromRow(row as ProfileRow);
}

function fromRow(row: ProfileRow): Result<Profile, AppError> {
  const profile = toProfile(row);

  if (!profile) {
    // Schema drift is a bug, not something to paper over with a default.
    logger.error('profile.row_rejected', { reason: 'unknown_onboarding_state' });
    return err(new AppError('INTERNAL', 'profile.read: row failed domain validation'));
  }

  return ok(profile);
}
