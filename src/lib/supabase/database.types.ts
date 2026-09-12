/**
 * Generated database types.
 *
 * M0 has no schema yet, so this is an empty but correctly shaped placeholder.
 * From M1 on it is regenerated from the migrations with:
 *
 *   npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
 *
 * Keeping the generic parameter wired up now means adding the real schema
 * later is a type-only change, not a refactor of every call site.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
