'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { publicEnv } from '@/lib/env/public';
import type { Database } from './database.types';

let client: SupabaseClient<Database> | undefined;

/**
 * Browser Supabase client.
 *
 * Uses the publishable key only: every read and write is still subject to Row
 * Level Security. Memoised so the auth listener is registered exactly once.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  client ??= createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return client;
}
