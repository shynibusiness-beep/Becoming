import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

export interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

/**
 * Shared empty state.
 *
 * The copy passed in describes the situation, never the person — see
 * COPY PRINCIPLES. No invented busywork is offered just to fill the screen.
 */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-line-subtle bg-surface/60 rounded-[var(--radius-lg)] border border-dashed',
        'px-5 py-8 text-center',
        className,
      )}
    >
      <p className="text-ink text-heading font-medium text-balance">{title}</p>
      <p className="text-ink-secondary text-label mx-auto mt-2 max-w-[34ch] text-pretty">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
