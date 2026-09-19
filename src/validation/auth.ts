import { z } from 'zod';

/**
 * Shared validation schemas.
 *
 * Framework independent: the same schema validates the form on the server
 * today and would validate a React Native form later.
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, { error: 'Bitte gib deine E-Mail-Adresse ein.' })
  .max(254, { error: 'Diese E-Mail-Adresse ist zu lang.' })
  .pipe(z.email({ error: 'Diese E-Mail-Adresse sieht nicht gültig aus.' }));

export const signInRequestSchema = z.object({
  email: emailSchema,
});

export type SignInRequest = z.infer<typeof signInRequestSchema>;
