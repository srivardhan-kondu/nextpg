import { Info } from 'lucide-react';
import { PREDICTION_DISCLAIMER } from '@/config/site';
import { cn } from '@/lib/utils';

/**
 * Required on every surface that shows a rank. The product promise is an
 * estimate, and the UI must never imply certainty.
 */
export function Disclaimer({ className, text = PREDICTION_DISCLAIMER }: { className?: string; text?: string }) {
  return (
    <p className={cn('flex items-start gap-2 text-xs leading-relaxed text-muted-foreground', className)}>
      <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{text}</span>
    </p>
  );
}
