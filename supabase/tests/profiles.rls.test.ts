import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  PROFILE_COLUMNS,
  type OnboardingStateEnum,
} from '../../src/lib/supabase/database.types';
import { actAs, connect, createAuthUser, type TestUser } from './helpers/db';

/**
 * Cross-user isolation for `public.profiles`, executed against a real
 * PostgreSQL with the real policies.
 *
 * Each case runs the way PostgREST runs a request: role set, JWT claims in
 * `request.jwt.claims`, everything inside a rolled-back transaction.
 */
describe('profiles — Row Level Security', () => {
  let db: Client;
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    db = await connect();
    alice = await createAuthUser(db, 'alice@example.test');
    bob = await createAuthUser(db, 'bob@example.test');
  });

  afterAll(async () => {
    await db?.end();
  });

  // --- The gate itself ----------------------------------------------------

  it('has RLS enabled on the table', async () => {
    const { rows } = await db.query<{ relrowsecurity: boolean }>(
      `select relrowsecurity from pg_class
       where oid = 'public.profiles'::regclass`,
    );

    expect(rows[0]?.relrowsecurity).toBe(true);
  });

  it('exposes no INSERT or DELETE policy to clients', async () => {
    const { rows } = await db.query<{ cmd: string }>(
      `select cmd from pg_policies where schemaname = 'public' and tablename = 'profiles'`,
    );
    const commands = rows.map((row) => row.cmd).sort();

    // Provisioning and deletion are server-owned; a client has no path to either.
    expect(commands).toEqual(['SELECT', 'UPDATE']);
  });

  it('grants authenticated no INSERT or DELETE privilege either', async () => {
    const { rows } = await db.query<{ privilege_type: string }>(
      `select privilege_type from information_schema.table_privileges
       where table_schema = 'public' and table_name = 'profiles'
         and grantee = 'authenticated'`,
    );
    const privileges = rows.map((row) => row.privilege_type).sort();

    expect(privileges).not.toContain('INSERT');
    expect(privileges).not.toContain('DELETE');
  });

  // --- Provisioning -------------------------------------------------------

  it('provisions a profile automatically when a user signs up', async () => {
    const { rows } = await db.query('select id from public.profiles where id = $1', [
      alice.id,
    ]);

    expect(rows).toHaveLength(1);
  });

  it('provisioning survives a repeated signup insert (idempotent)', async () => {
    // Re-running the trigger's body must not raise or duplicate.
    await db.query(
      `insert into public.profiles (id) values ($1) on conflict (id) do nothing`,
      [alice.id],
    );

    const { rows } = await db.query(
      'select count(*)::int as count from public.profiles where id = $1',
      [alice.id],
    );
    expect(rows[0]).toEqual({ count: 1 });
  });

  it('ensure_profile() is idempotent and repairs a missing profile', async () => {
    const carol = await createAuthUser(db, 'carol@example.test');
    await db.query('delete from public.profiles where id = $1', [carol.id]);

    await actAs(db, { role: 'authenticated', userId: carol.id }, async (client) => {
      const first = await client.query('select id from public.ensure_profile()');
      const second = await client.query('select id from public.ensure_profile()');

      expect(first.rows[0]).toEqual({ id: carol.id });
      expect(second.rows[0]).toEqual({ id: carol.id });
    });
  });

  it('ensure_profile() refuses an anonymous caller', async () => {
    await expect(
      actAs(db, { role: 'anon' }, (client) =>
        client.query('select public.ensure_profile()'),
      ),
    ).rejects.toThrow();
  });

  it('ensure_profile() derives its row from the JWT, so it cannot target another user', async () => {
    // The function takes no arguments at all — ownership can only come from
    // auth.uid(). Passing an id is a syntax error, not an authorization bug.
    await actAs(db, { role: 'authenticated', userId: alice.id }, async (client) => {
      await expect(
        client.query('select public.ensure_profile($1)', [bob.id]),
      ).rejects.toThrow();
    });
  });

  // --- Read isolation -----------------------------------------------------

  it('lets a user read their own profile', async () => {
    await actAs(db, { role: 'authenticated', userId: alice.id }, async (client) => {
      const { rows } = await client.query('select id from public.profiles');

      expect(rows).toEqual([{ id: alice.id }]);
    });
  });

  it("never lets a user read another user's profile", async () => {
    await actAs(db, { role: 'authenticated', userId: alice.id }, async (client) => {
      const { rows } = await client.query(
        'select id from public.profiles where id = $1',
        [bob.id],
      );

      // RLS filters rather than errors: the row simply does not exist for Alice.
      expect(rows).toEqual([]);
    });
  });

  it('never lets an anonymous visitor read private profile data', async () => {
    await actAs(db, { role: 'anon' }, async (client) => {
      await expect(client.query('select id from public.profiles')).rejects.toThrow(
        /permission denied/i,
      );
    });
  });

  // --- Write isolation ----------------------------------------------------

  it('lets a user change their own allowed fields', async () => {
    await actAs(db, { role: 'authenticated', userId: alice.id }, async (client) => {
      const { rowCount } = await client.query(
        `update public.profiles set timezone = 'Europe/Berlin', locale = 'de-DE' where id = $1`,
        [alice.id],
      );

      expect(rowCount).toBe(1);
    });
  });

  it("never lets a user update another user's profile", async () => {
    await actAs(db, { role: 'authenticated', userId: alice.id }, async (client) => {
      const { rowCount } = await client.query(
        `update public.profiles set timezone = 'Pacific/Auckland' where id = $1`,
        [bob.id],
      );

      // No row is visible to Alice, so nothing is updated.
      expect(rowCount).toBe(0);
    });

    const { rows } = await db.query(
      'select timezone from public.profiles where id = $1',
      [bob.id],
    );
    expect(rows[0]?.timezone).toBe('UTC');
  });

  it('never lets a user reassign their profile to another user', async () => {
    await actAs(db, { role: 'authenticated', userId: alice.id }, async (client) => {
      // `authenticated` holds UPDATE on (timezone, locale, onboarding_state)
      // only, so touching `id` is refused by the grant before any policy is
      // consulted. PostgreSQL reports this as a table-level denial.
      await expect(
        client.query('update public.profiles set id = $1 where id = $2', [
          bob.id,
          alice.id,
        ]),
      ).rejects.toThrow(/permission denied/i);
    });

    // The property that matters: both rows still belong to who they did.
    const { rows } = await db.query<{ id: string }>(
      'select id from public.profiles where id in ($1, $2) order by id',
      [alice.id, bob.id],
    );
    expect(rows.map((row) => row.id).sort()).toEqual([alice.id, bob.id].sort());
  });

  it("never lets a user delete another user's profile", async () => {
    await actAs(db, { role: 'authenticated', userId: alice.id }, async (client) => {
      await expect(
        client.query('delete from public.profiles where id = $1', [bob.id]),
      ).rejects.toThrow(/permission denied/i);
    });

    const { rows } = await db.query('select id from public.profiles where id = $1', [
      bob.id,
    ]);
    expect(rows).toHaveLength(1);
  });

  it('never lets a user delete their own profile from the client', async () => {
    await actAs(db, { role: 'authenticated', userId: alice.id }, async (client) => {
      await expect(
        client.query('delete from public.profiles where id = $1', [alice.id]),
      ).rejects.toThrow(/permission denied/i);
    });
  });

  it('never lets a user insert a profile for someone else', async () => {
    const dave = await createAuthUser(db, 'dave@example.test');
    await db.query('delete from public.profiles where id = $1', [dave.id]);

    await actAs(db, { role: 'authenticated', userId: alice.id }, async (client) => {
      await expect(
        client.query('insert into public.profiles (id) values ($1)', [dave.id]),
      ).rejects.toThrow(/permission denied/i);
    });
  });

  // --- Forged identity ----------------------------------------------------

  it('ignores a forged user_id in the request payload', async () => {
    // Alice's session, Bob's id in the WHERE clause: ownership comes from the
    // JWT, so the forged value changes nothing.
    await actAs(db, { role: 'authenticated', userId: alice.id }, async (client) => {
      const { rows } = await client.query(
        'select id from public.profiles where id = $1 or id = $2',
        [bob.id, alice.id],
      );

      expect(rows).toEqual([{ id: alice.id }]);
    });
  });

  it('treats a claim without a sub as unauthenticated', async () => {
    await actAs(db, { role: 'authenticated' }, async (client) => {
      const { rows } = await client.query('select id from public.profiles');

      expect(rows).toEqual([]);
    });
  });

  it('does not let the anon role escalate by claiming the authenticated role', async () => {
    // A forged `role` claim in the token body cannot help: PostgREST sets the
    // database role, and the anon role has no SELECT privilege at all.
    await db.query('begin');
    try {
      await db.query('select set_config($1, $2, true)', [
        'request.jwt.claims',
        JSON.stringify({ sub: alice.id, role: 'authenticated' }),
      ]);
      await db.query('set local role anon');

      await expect(db.query('select id from public.profiles')).rejects.toThrow(
        /permission denied/i,
      );
    } finally {
      await db.query('rollback');
    }
  });

  // --- Immutable columns --------------------------------------------------

  it('keeps created_at immutable and refreshes updated_at on write', async () => {
    const before = await db.query<{ created_at: Date; updated_at: Date }>(
      'select created_at, updated_at from public.profiles where id = $1',
      [alice.id],
    );

    await db.query(
      `update public.profiles set timezone = 'Europe/Lisbon' where id = $1`,
      [alice.id],
    );

    const after = await db.query<{ created_at: Date; updated_at: Date }>(
      'select created_at, updated_at from public.profiles where id = $1',
      [alice.id],
    );

    expect(after.rows[0]?.created_at).toEqual(before.rows[0]?.created_at);
    expect(after.rows[0]?.updated_at.getTime()).toBeGreaterThanOrEqual(
      before.rows[0]?.updated_at.getTime() ?? 0,
    );
  });

  it('removes the profile when the auth user is deleted', async () => {
    const erin = await createAuthUser(db, 'erin@example.test');
    await db.query('delete from auth.users where id = $1', [erin.id]);

    const { rows } = await db.query('select id from public.profiles where id = $1', [
      erin.id,
    ]);
    expect(rows).toEqual([]);
  });

  // --- Stored data --------------------------------------------------------

  it('stores no email or other unnecessary personal data', async () => {
    const { rows } = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles'`,
    );
    const columns = rows.map((row) => row.column_name).sort();

    expect(columns).toEqual([
      'created_at',
      'id',
      'locale',
      'onboarding_state',
      'timezone',
      'updated_at',
    ]);
  });

  it('matches the hand-maintained TypeScript Database type', async () => {
    // database.types.ts cannot be generated here (the CLI needs a blocked
    // container image), so this is what keeps it honest: change the migration
    // without updating the type and this fails.
    const { rows } = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles'`,
    );

    expect(rows.map((row) => row.column_name).sort()).toEqual(
      [...PROFILE_COLUMNS].sort(),
    );
  });

  it('matches the enum values declared in the TypeScript Database type', async () => {
    const { rows } = await db.query<{ enumlabel: string }>(
      `select enumlabel from pg_enum
       join pg_type on pg_type.oid = pg_enum.enumtypid
       where pg_type.typname = 'onboarding_state'
       order by enumsortorder`,
    );

    const declared: OnboardingStateEnum[] = ['not_started', 'in_progress', 'completed'];
    expect(rows.map((row) => row.enumlabel)).toEqual(declared);
  });
});
