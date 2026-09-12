/**
 * Public configuration barrel.
 *
 * Server-only configuration is *not* re-exported here: importing this module
 * from a client component must never be able to pull the server schema — or
 * even its variable names — into the browser bundle. Use `./server` directly
 * on the server.
 */
export { isProductionStage, publicEnv } from './public';
export { appStageSchema, publicEnvSchema } from './public-schema';
export type { AppStage, PublicEnv } from './public-schema';
