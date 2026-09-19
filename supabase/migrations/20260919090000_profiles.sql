-- ============================================================================
-- M1 — profiles, Row Level Security and idempotent provisioning
--
-- Design rules this migration enforces (see README "Sicherheit"):
--   * A profile holds no unnecessary personal data. No email, no name — the
--     email lives in auth.users and is never copied here.
--   * Ownership is derived from the JWT via auth.uid(), never from a value the
--     client sends.
--   * Defence in depth: column-level GRANTs first, RLS policies second. Even a
--     mistaken policy could not let `authenticated` write `id`.
--   * Provisioning is server-owned: clients have no INSERT and no DELETE path.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Onboarding state
-- ---------------------------------------------------------------------------
create type public.onboarding_state as enum (
  'not_started',
  'in_progress',
  'completed'
);

comment on type public.onboarding_state is
  'Progress through the M2 onboarding flow. Kept minimal on purpose.';

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'UTC',
  locale text not null default 'de',
  onboarding_state public.onboarding_state not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- An IANA zone name; bounded so a client cannot store arbitrary text here.
  constraint profiles_timezone_length check (
    char_length(btrim(timezone)) between 1 and 64
  ),
  -- BCP-47 subset: "de" or "de-DE".
  constraint profiles_locale_format check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

comment on table public.profiles is
  'One private row per authenticated user. Never publicly readable.';
comment on column public.profiles.id is
  'Same value as auth.users.id. The only source of ownership.';

-- ---------------------------------------------------------------------------
-- updated_at maintenance and immutable columns
-- ---------------------------------------------------------------------------
create function public.profiles_handle_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Identity and creation time are not the client's to change. The column
  -- grants below already prevent it; this keeps the guarantee even for a
  -- future server-side caller that holds broader privileges.
  new.id := old.id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_before_update
before update on public.profiles
for each row
execute function public.profiles_handle_update();

-- ---------------------------------------------------------------------------
-- Privileges — the first layer, applied before any policy is considered
-- ---------------------------------------------------------------------------
revoke all on public.profiles from anon, authenticated;

-- Anonymous visitors get nothing at all: no SELECT, so private profile data is
-- unreachable even if a policy were later written carelessly.
grant select on public.profiles to authenticated;

-- The only columns a user may ever write. `id` and `created_at` are absent by
-- design, so an UPDATE touching them fails with "permission denied for column".
grant update (timezone, locale, onboarding_state) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security — the second layer
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Deliberately no INSERT and no DELETE policy:
--   * INSERT — provisioning is server-owned (see below).
--   * DELETE — account deletion is a server-side flow, scheduled for M8.
-- Without a policy, both are denied for every non-bypassing role.

-- ---------------------------------------------------------------------------
-- Provisioning — idempotent, race-safe, server-owned
-- ---------------------------------------------------------------------------

-- Runs as part of the signup transaction in auth.users.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Repair path for a session whose profile is missing — a user created before
-- this migration, or a trigger that did not run. Callable by the signed-in
-- user only, and the row it touches is derived from auth.uid(): passing an id
-- is impossible, so it cannot provision or read someone else's profile.
create function public.ensure_profile()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  result public.profiles;
  attempt int := 0;
begin
  if caller is null then
    raise exception 'ensure_profile requires an authenticated session'
      using errcode = '28000';
  end if;

  -- Retry loop rather than a single insert-then-select: under concurrent
  -- calls one transaction takes the ON CONFLICT path while the other is still
  -- uncommitted, and the follow-up read can come up empty. Two attempts are
  -- enough — after the conflicting transaction settles the row is visible.
  loop
    attempt := attempt + 1;

    insert into public.profiles (id)
    values (caller)
    on conflict (id) do nothing;

    select * into result from public.profiles where id = caller;

    exit when result.id is not null or attempt >= 3;
  end loop;

  if result.id is null then
    raise exception 'could not provision profile' using errcode = '40001';
  end if;

  return result;
end;
$$;

revoke all on function public.ensure_profile() from public, anon;
grant execute on function public.ensure_profile() to authenticated;
