import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils/cn';

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'border-line-subtle bg-surface rounded-[var(--radius-lg)] border p-5',
        'shadow-e1',
        className,
      )}
      {...props}
    />
  );
}
