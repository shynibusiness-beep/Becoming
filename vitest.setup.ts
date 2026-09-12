/**
 * Placeholder public configuration for unit tests.
 *
 * `src/lib/env/public.ts` validates at module load, so any test that
 * transitively imports it needs a valid configuration present *before* the
 * import happens. Setting it here — rather than per test file — keeps that
 * independent of test ordering. The values point at nothing; no unit test
 * talks to Supabase.
 */
process.env.NEXT_PUBLIC_APP_STAGE ??= 'development';
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://test-placeholder.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= 'sb_publishable_test_placeholder_00';
process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ??= 'noop';
