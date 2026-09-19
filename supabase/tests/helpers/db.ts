import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';

/**
 * Connection to the PostgreSQL the database suite runs against.
 *
 * These tests deliberately do NOT mock the database: Row Level Security is a
 * PostgreSQL feature, and a mock would only ever prove that our mock behaves
 * the way we imagined. Everything here runs against a real server.
 */
export const ADMIN_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres@127.0.0.1:54399/postgres';

export const TEST_DATABASE = process.env.TEST_DATABASE ?? 'becoming_test';

export function testDatabaseUrl(): string {
  const url = new URL(ADMIN_URL);
  url.pathname = `/${TEST_DATABASE}`;
  return url.toString();
}

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'supabase', 'migrations');
const BOOTSTRAP_SQL = path.join(REPO_ROOT, 'supabase', 'tests', 'bootstrap.sql');

async function run(url: string, sql: string): Promise<void> {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

/** Every migration file, in the order Supabase would apply them. */
export async function migrationFiles(): Promise<string[]> {
  const entries = await readdir(MIGRATIONS_DIR);
  return entries.filter((name) => name.endsWith('.sql')).sort();
}

/**
 * Drops and recreates the test database, then applies the platform scaffolding
 * and every migration in order.
 *
 * Rebuilding from scratch is the point: it proves the schema is reproducible
 * from migrations alone, which is the rule in supabase/README.md.
 */
export async function resetTestDatabase(): Promise<void> {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  try {
    await admin.query(`drop database if exists ${TEST_DATABASE} with (force)`);
    await admin.query(`create database ${TEST_DATABASE}`);
  } finally {
    await admin.end();
  }

  const url = testDatabaseUrl();
  await run(url, await readFile(BOOTSTRAP_SQL, 'utf8'));

  for (const file of await migrationFiles()) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await run(url, sql);
    } catch (cause) {
      throw new Error(`Migration ${file} failed to apply`, { cause });
    }
  }
}

export interface TestUser {
  readonly id: string;
  readonly email: string;
}

/** Creates a user the way signup does, so the provisioning trigger fires. */
export async function createAuthUser(client: Client, email: string): Promise<TestUser> {
  const { rows } = await client.query<{ id: string }>(
    'insert into auth.users (email) values ($1) returning id',
    [email],
  );
  const id = rows[0]?.id;
  if (!id) {
    throw new Error(`Could not create auth user ${email}`);
  }
  return { id, email };
}

export type PostgrestRole = 'anon' | 'authenticated' | 'service_role';

export interface ActAsOptions {
  readonly role: PostgrestRole;
  /** The `sub` claim. Omit for an anonymous request. */
  readonly userId?: string;
}

/**
 * Runs a callback the way PostgREST runs a request: inside a transaction, with
 * the request's role set and the JWT claims placed in `request.jwt.claims`,
 * which is where `auth.uid()` reads them from.
 *
 * The transaction is always rolled back, so tests cannot leak state into each
 * other.
 */
export async function actAs<T>(
  client: Client,
  options: ActAsOptions,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const claims =
    options.userId === undefined
      ? { role: options.role }
      : { sub: options.userId, role: options.role };

  await client.query('begin');
  try {
    await client.query('select set_config($1, $2, true)', [
      'request.jwt.claims',
      JSON.stringify(claims),
    ]);
    await client.query(`set local role ${options.role}`);
    return await fn(client);
  } finally {
    await client.query('rollback');
  }
}

/** Connects to the prepared test database. */
export async function connect(): Promise<Client> {
  const client = new Client({ connectionString: testDatabaseUrl() });
  await client.connect();
  return client;
}
