/**
 * Type-only barrel.
 *
 * There is deliberately no browser client: every Supabase call in this
 * application runs on the server, which is what lets the session cookie be
 * `httpOnly` (see cookie-options.ts). The server client is imported from
 * `./server-client` directly, which is a `server-only` module, so a wrong-side
 * import is a build error rather than a runtime surprise.
 */
export type { Database, Json, OnboardingStateEnum } from './database.types';
export { PROFILE_COLUMNS } from './database.types';
