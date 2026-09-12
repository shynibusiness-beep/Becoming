# Supabase

The database must be reproducible from migrations alone. Tables are never
created by hand in the Supabase dashboard.

```
supabase/
  migrations/   timestamped SQL migrations — the single source of truth
```

M0 contains no schema: the data model lands with auth and profiles in **M1**
and grows through M2–M6. What is already in place is the client wiring
(`src/lib/supabase/`) and session refresh (`src/proxy.ts`).

## Local workflow (from M1 on)

```bash
npx supabase start                 # local Postgres + Auth + Studio
npx supabase migration new <name>  # create a migration file
npx supabase db reset              # rebuild the local DB from migrations
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

## Rules

- Every user-scoped table gets Row Level Security enabled in the same
  migration that creates it — never in a follow-up.
- Server-owned columns (growth state, unlocks, verified evidence sources,
  subscription state) are not writable by the `authenticated` role. They are
  changed by `SECURITY DEFINER` functions that validate ownership and business
  rules first.
- The one-active-goal rule is a database constraint, not a UI check.
