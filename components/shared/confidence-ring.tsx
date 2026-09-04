import { cn } from '@/lib/utils';

interface ConfidenceRingProps {
  value: number;
  size?: number;
  label?: string;
  tone?: 'strong' | 'moderate' | 'stretch' | 'primary';
  className?: string;
}

const strokeFor = {
  strong: 'hsl(var(--strong))',
  moderate: 'hsl(var(--moderate))',
  stretch: 'hsl(var(--stretch))',
  primary: 'hsl(var(--primary))',
} as const;

/**
 * The donut percentage from the Dream Validator screen. Pure SVG — no chart
 * library, so it renders identically on the server and in the PDF preview.
 */
export function ConfidenceRing({ value, size = 84, label, tone = 'primary', className }: ConfidenceRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${clamped} percent`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeFor[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg font-bold text-foreground">{clamped}%</span>
    </div>
  );
}
