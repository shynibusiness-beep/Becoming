import { startAuthStub } from './support/auth-stub';

export const AUTH_STUB_PORT = Number(process.env.E2E_AUTH_STUB_PORT ?? 54331);

/**
 * Starts the Supabase Auth stub for the duration of the suite.
 *
 * The app is built against this URL (NEXT_PUBLIC_* is inlined at build time),
 * so the port has to match what playwright.config.ts passes to the web server.
 */
export default async function globalSetup(): Promise<() => Promise<void>> {
  const stub = await startAuthStub(AUTH_STUB_PORT);
  return () => stub.close();
}
