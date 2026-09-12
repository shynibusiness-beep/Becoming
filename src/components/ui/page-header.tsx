import { cn } from '@/lib/utils/cn';

export interface PageHeaderProps {
  readonly overline?: string;
  readonly title: string;
  readonly description?: string;
  readonly className?: string;
}

export function PageHeader({ overline, title, description, className }: PageHeaderProps) {
  return (
    <header className={cn('space-y-2', className)}>
      {overline ? (
        <p className="text-ink-muted text-overline font-medium uppercase">{overline}</p>
      ) : null}
      <h1 className="text-ink text-title font-semibold text-balance">{title}</h1>
      {description ? (
        <p className="text-ink-secondary text-body max-w-prose">{description}</p>
      ) : null}
    </header>
  );
}
