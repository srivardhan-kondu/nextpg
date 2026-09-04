import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'default' | 'primary' | 'strong' | 'moderate' | 'stretch';
  className?: string;
}

const toneClass = {
  default: 'text-[#15191a]',
  primary: 'text-primary',
  strong: 'text-[#0f766e]',
  moderate: 'text-[#a07520]',
  stretch: 'text-[#8a4a22]',
} as const;

/** Metric cards — matching design doc 1e 4-stat grid style */
export function StatTile({ label, value, hint, tone = 'default', className }: StatTileProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-[7px] rounded-[10px] border border-black/[0.08] bg-[#faf9f6] px-5 py-5',
        className,
      )}
    >
      <p className="text-[12.5px] leading-none text-[#6b7472]">{label}</p>
      <p className={cn('text-[26px] leading-none tabular-nums', toneClass[tone])}>{value}</p>
      {hint ? <p className="text-[12px] leading-relaxed text-[#6b7472]">{hint}</p> : null}
    </div>
  );
}
