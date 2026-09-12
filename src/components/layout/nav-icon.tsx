import type { NavItem } from './navigation';

const PATHS: Readonly<Record<NavItem['icon'], string>> = {
  // A day: horizon line with an arc above it.
  today: 'M3 17h18M7.5 17a4.5 4.5 0 0 1 9 0M12 4v2.5M5.6 7.1l1.7 1.7M18.4 7.1l-1.7 1.7',
  // Growth: a rising path with a marker at the end.
  growth: 'M4 18l5-5 3.5 3.5L20 9M20 9h-4.5M20 9v4.5',
  // Self: a head-and-shoulders silhouette, drawn as strokes.
  self: 'M12 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 19.5a7 7 0 0 1 14 0',
};

export function NavIcon({ icon }: { readonly icon: NavItem['icon'] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[icon]} />
    </svg>
  );
}
