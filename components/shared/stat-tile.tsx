import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'default' | 'primary' | 'strong' | 'moderate' | 'stretch';
  className?: string;
}

const toneClass = {
  default: 'text-foreground',
  primary: 'text-primary',
  strong: 'text-strong',
  moderate: 'text-moderate',
  stretch: 'text-stretch',
} as const;

/** The metric cards across the results and dashboard screens. */
export function StatTile({ label, value, hint, tone = 'default', className }: StatTileProps) {
  return (
    <div className={cn('stat-tile', className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-1.5 text-2xl font-bold leading-tight tracking-tight', toneClass[tone])}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
