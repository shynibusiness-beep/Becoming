-- ============================================================================
-- Test-only scaffolding.
--
-- On a real Supabase project these objects already exist — they are managed by
-- the platform, not by us. This file recreates just enough of them so the
-- migrations in supabase/migrations/ can be applied to a bare PostgreSQL and
-- exercised with the same roles and the same auth.uid() resolution that
-- PostgREST sets up per request.
--
-- It is NOT a migration and must never be applied to a real project.
--
-- The auth.uid()/auth.role()/auth.jwt() bodies below mirror Supabase's own
-- definitions: they read the JWT claims that PostgREST puts into the
-- `request.jwt.claims` GUC for the duration of each request.
-- ============================================================================

-- --- Roles -----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    -- Mirrors Supabase: the service role bypasses RLS entirely, which is
    -- exactly why it must never reach a browser.
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin nologin noinherit;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;

-- --- auth schema -----------------------------------------------------------
create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- --- Claim helpers (verbatim shape of Supabase's own) ----------------------
create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

grant execute on function auth.jwt(), auth.uid(), auth.role()
  to anon, authenticated, service_role;
