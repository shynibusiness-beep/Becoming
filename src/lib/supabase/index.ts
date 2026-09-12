/**
 * Type-only barrel.
 *
 * The clients are imported from their own modules on purpose:
 * `browser-client.ts` is a `'use client'` module and `server-client.ts` is
 * `server-only`, so re-exporting either here would let a wrong-side import
 * slip through as a valid module resolution.
 */
export type { Database, Json } from './database.types';
