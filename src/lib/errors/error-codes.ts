/**
 * Stable, machine readable error codes.
 *
 * These are part of the contract between server actions, the UI and (later)
 * the mobile client. They are intentionally coarse: they describe *how* the
 * caller should react, never *what* the user wrote.
 */
export const ERROR_CODES = [
  'ENV_INVALID',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'CONFLICT',
  'RULE_VIOLATION',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'NETWORK',
  'INTERNAL',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/**
 * User facing fallback copy per error code.
 *
 * Follows the COPY PRINCIPLES: it describes the situation, never judges the
 * person. German, because the product surface is German.
 */
export const ERROR_CODE_MESSAGES: Readonly<Record<ErrorCode, string>> = {
  ENV_INVALID: 'Die App ist nicht vollständig konfiguriert.',
  UNAUTHENTICATED: 'Bitte melde dich an, um fortzufahren.',
  FORBIDDEN: 'Dafür fehlt dir die Berechtigung.',
  NOT_FOUND: 'Das konnten wir nicht finden.',
  VALIDATION_FAILED: 'Diese Eingabe passt so noch nicht.',
  CONFLICT: 'Das wurde zwischenzeitlich verändert. Lade die Seite neu.',
  RULE_VIOLATION: 'Das geht mit deinem aktuellen Plan nicht.',
  RATE_LIMITED: 'Einen Moment noch — das war etwas zu schnell.',
  DEPENDENCY_UNAVAILABLE: 'Ein Dienst ist gerade nicht erreichbar.',
  NETWORK: 'Wir konnten dich gerade nicht erreichen. Versuch es noch einmal.',
  INTERNAL: 'Da ist etwas schiefgelaufen. Das liegt nicht an dir.',
};
