/**
 * Keys whose values are never safe to log.
 *
 * Matched case-insensitively as a substring, so `supabaseAccessToken`,
 * `SUPABASE_SECRET_KEY` and `user_email` are all caught.
 */
const SENSITIVE_KEY_PATTERN =
  /(secret|token|password|passwd|credential|cookie|session|authorization|auth|apikey|api_key|key|email|phone|jwt|signature)/i;

/**
 * Keys that carry user written prose. Logging these would put personal
 * content into infrastructure we do not control (see PRIVACY).
 */
const FREE_TEXT_KEY_PATTERN =
  /(title|description|note|notes|body|content|message|text|reason_text|journal|answer)/i;

export const REDACTED = '[redacted]';

export type LogValue = string | number | boolean | null;
export type LogContext = Readonly<Record<string, LogValue>>;

/**
 * Removes sensitive values from a log context.
 *
 * Redaction is a safety net, not the primary control: call sites are expected
 * to pass non-personal fields in the first place.
 */
export function redactContext(context: LogContext): Record<string, LogValue> {
  const result: Record<string, LogValue> = {};

  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEY_PATTERN.test(key) || FREE_TEXT_KEY_PATTERN.test(key)) {
      result[key] = REDACTED;
      continue;
    }
    result[key] = value;
  }

  return result;
}
