import { DEFAULT_SIGNED_IN_PATH } from './routes';

/**
 * Turns an untrusted `next` parameter into a path we are willing to redirect to.
 *
 * The parameter travels through the sign-in link and the OAuth callback, so it
 * is fully attacker-controlled. Anything that is not an unambiguous
 * same-origin path falls back to the default destination rather than being
 * "repaired" — a redirect target is not worth guessing at.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_SIGNED_IN_PATH,
): string {
  if (typeof raw !== 'string' || raw.length === 0) {
    return fallback;
  }

  // Percent-encoding can hide every check below (`%2F%2Fevil.example`), and a
  // malformed escape is not something we need to accommodate.
  let candidate: string;
  try {
    candidate = decodeURIComponent(raw);
  } catch {
    return fallback;
  }

  // Control characters and whitespace are used to smuggle past naive parsers
  // and to inject response headers.
  if (/[\u0000-\u001f\u007f\s]/.test(candidate)) {
    return fallback;
  }

  // Must be an absolute path on this origin.
  if (!candidate.startsWith('/')) {
    return fallback;
  }

  // `//evil.example` is protocol-relative; browsers treat it as another origin.
  if (candidate.startsWith('//')) {
    return fallback;
  }

  // Backslashes are normalised to `/` by several browsers, so `/\evil.example`
  // becomes `//evil.example`.
  if (candidate.includes('\\')) {
    return fallback;
  }

  // A scheme anywhere means this was never a plain path.
  if (candidate.includes(':')) {
    return fallback;
  }

  return candidate;
}
