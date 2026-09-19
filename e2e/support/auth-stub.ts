import { createHmac, randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type Server } from 'node:http';

/**
 * A stand-in for Supabase Auth (GoTrue) used by the end-to-end suite.
 *
 * It stubs the *provider*, never our own code: sign-in still goes through the
 * real route handlers, the real `@supabase/ssr` client and the real cookie
 * handling. What it replaces is the hosted service, which cannot run here —
 * the container images it needs are blocked by this environment's network
 * policy.
 *
 * Only the handful of endpoints `supabase-js` actually calls are implemented.
 */

const JWT_SECRET = 'e2e-stub-secret-not-used-anywhere-else';

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Signs a real HS256 JWT so any local decoding in the client behaves normally. */
function signJwt(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = base64url(
    createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${signature}`;
}

interface StubUser {
  readonly id: string;
  readonly email: string;
}

export interface AuthStub {
  readonly url: string;
  /** Tokens the stub currently accepts. Sign-out and expiry remove them. */
  readonly close: () => Promise<void>;
}

function userPayload(user: StubUser) {
  return {
    id: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  };
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function startAuthStub(port: number): Promise<AuthStub> {
  /** access_token -> user. A token not in here is rejected, like a revoked one. */
  const sessions = new Map<string, StubUser>();

  const issue = (user: StubUser) => {
    const now = Math.floor(Date.now() / 1000);
    const accessToken = signJwt({
      sub: user.id,
      email: user.email,
      role: 'authenticated',
      aud: 'authenticated',
      iat: now,
      exp: now + 60 * 60,
      session_id: randomUUID(),
    });
    sessions.set(accessToken, user);
    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: now + 3600,
      refresh_token: `refresh-${randomUUID()}`,
      user: userPayload(user),
    };
  };

  const server: Server = createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
      const send = (status: number, body: unknown) => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(body));
      };

      // Requesting a sign-in link always "succeeds"; the e2e suite drives the
      // confirmation step directly with a token it chooses.
      if (url.pathname === '/auth/v1/otp' && req.method === 'POST') {
        await readBody(req);
        send(200, {});
        return;
      }

      // verifyOtp: the token_hash doubles as the address to sign in as, so a
      // test can pick which user it becomes.
      if (url.pathname === '/auth/v1/verify' && req.method === 'POST') {
        const body = await readBody(req);
        const hash = typeof body.token_hash === 'string' ? body.token_hash : '';

        if (!hash.startsWith('valid-')) {
          send(403, {
            error: 'invalid_grant',
            error_code: 'otp_expired',
            msg: 'expired',
          });
          return;
        }

        const email = `${hash.slice('valid-'.length)}@example.test`;
        send(200, issue({ id: randomUUID(), email }));
        return;
      }

      if (url.pathname === '/auth/v1/user' && req.method === 'GET') {
        const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '';
        const user = sessions.get(token);

        if (!user) {
          send(401, { error: 'invalid_token', msg: 'invalid claim' });
          return;
        }

        send(200, userPayload(user));
        return;
      }

      if (url.pathname === '/auth/v1/logout' && req.method === 'POST') {
        const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '';
        sessions.delete(token);
        res.writeHead(204).end();
        return;
      }

      // A refresh of a token the stub never issued fails, which is how the
      // suite simulates an expired session.
      if (url.pathname === '/auth/v1/token' && req.method === 'POST') {
        await readBody(req);
        send(400, { error: 'invalid_grant', error_code: 'refresh_token_not_found' });
        return;
      }

      send(404, { msg: `unstubbed: ${req.method} ${url.pathname}` });
    })();
  });

  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
