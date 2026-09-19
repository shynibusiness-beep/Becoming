/**
 * Database types for the `public` schema.
 *
 * Normally produced by `npx supabase gen types typescript`. That command needs
 * a container image which this environment's network policy blocks, so this
 * file is maintained by hand and mirrors
 * `supabase/migrations/20260919090000_profiles.sql` exactly.
 *
 * Drift is caught rather than assumed: the database suite asserts the real
 * column list of `public.profiles` against the shape declared here, so a
 * migration that changes the table fails the tests until this file follows.
 *
 * Regenerate with the CLI wherever Docker is available:
 *   npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type OnboardingStateEnum = 'not_started' | 'in_progress' | 'completed';

/** The columns of `public.profiles`, in the order the migration declares them. */
export const PROFILE_COLUMNS = [
  'id',
  'timezone',
  'locale',
  'onboarding_state',
  'created_at',
  'updated_at',
] as const;

interface ProfilesRow {
  id: string;
  timezone: string;
  locale: string;
  onboarding_state: OnboardingStateEnum;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        /**
         * Only `id` is ever supplied: every other column has a default, and
         * clients hold no INSERT privilege at all — provisioning is
         * server-owned.
         */
        Insert: {
          id: string;
          timezone?: string;
          locale?: string;
          onboarding_state?: OnboardingStateEnum;
          created_at?: string;
          updated_at?: string;
        };
        /**
         * `id` and `created_at` are absent on purpose: they are immutable, and
         * `authenticated` holds no column privilege for them.
         */
        Update: {
          timezone?: string;
          locale?: string;
          onboarding_state?: OnboardingStateEnum;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      /** Takes no arguments: the row is derived from `auth.uid()`. */
      ensure_profile: {
        Args: Record<PropertyKey, never>;
        Returns: ProfilesRow;
      };
    };
    Enums: {
      onboarding_state: OnboardingStateEnum;
    };
    CompositeTypes: Record<never, never>;
  };
}
