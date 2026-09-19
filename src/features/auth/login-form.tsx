'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { requestSignInLink, type SignInFormState } from './actions';

const INITIAL: SignInFormState = { status: 'idle' };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? 'Wird gesendet …' : 'Link anfordern'}
    </Button>
  );
}

/**
 * Sign-in form.
 *
 * The three states the form can be in are all rendered — idle, sent and
 * error — and the pending state disables the button so a double submit cannot
 * send two links.
 */
export function LoginForm({ next }: { readonly next?: string | undefined }) {
  const [state, formAction] = useActionState(requestSignInLink, INITIAL);

  if (state.status === 'sent') {
    return (
      <div
        className="border-line-subtle bg-surface rounded-[var(--radius-lg)] border p-5"
        role="status"
        aria-live="polite"
      >
        <p className="text-ink text-heading font-medium">Schau in dein Postfach</p>
        <p className="text-ink-secondary text-label mt-2 text-pretty">
          Wir haben dir einen Anmeldelink an <strong>{state.email}</strong> geschickt. Er
          gilt für kurze Zeit und funktioniert nur einmal.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="space-y-2">
        <label htmlFor="email" className="text-ink text-label block font-medium">
          E-Mail-Adresse
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={state.status === 'error' ? 'email-error' : undefined}
          aria-invalid={state.status === 'error'}
          className="border-line bg-surface text-ink placeholder:text-ink-muted text-body h-12 w-full rounded-[var(--radius-md)] border px-3"
          placeholder="du@beispiel.de"
        />
      </div>

      {state.status === 'error' ? (
        <p
          id="email-error"
          role="alert"
          className="text-critical text-label flex items-start gap-2"
        >
          {/* Colour is never the only signal — the icon and the text carry it too. */}
          <span aria-hidden="true">⚠</span>
          <span>{state.message}</span>
        </p>
      ) : null}

      <SubmitButton />

      <p className="text-ink-muted text-caption text-pretty">
        Kein Passwort nötig. Wir schicken dir jedes Mal einen frischen Link.
      </p>
    </form>
  );
}
