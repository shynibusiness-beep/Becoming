import { resetTestDatabase } from './helpers/db';

/**
 * Rebuilds the test database from bootstrap + migrations before the suite runs.
 * Also the "fresh database migration" check: if a migration is not replayable
 * from an empty database, this fails before a single test executes.
 */
export default async function setup(): Promise<void> {
  await resetTestDatabase();
}
