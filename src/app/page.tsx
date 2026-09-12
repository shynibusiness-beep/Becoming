import { redirect } from 'next/navigation';

/**
 * The app has no marketing surface yet, so the root sends people straight to
 * the daily view. Auth-aware routing (onboarding vs. today) arrives in M1/M2.
 */
export default function RootPage() {
  redirect('/today');
}
