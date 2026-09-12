import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
}

const VARIANT_CLASSES: Readonly<Record<ButtonVariant, string>> = {
  primary:
    'bg-accent text-accent-on hover:bg-accent-hover disabled:hover:bg-accent shadow-e1',
  secondary:
    'bg-surface text-ink border border-line hover:border-line-strong disabled:hover:border-line',
  ghost: 'bg-transparent text-ink-secondary hover:bg-sunken hover:text-ink',
};

/** Comfortable touch targets: 44px and 52px tall (see ACCESSIBILITY). */
const SIZE_CLASSES: Readonly<Record<ButtonSize, string>> = {
  md: 'h-11 px-4 text-label',
  lg: 'h-13 px-5 text-body',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)]',
        'font-medium transition-colors duration-(--duration-fast) ease-(--ease-standard)',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
}
