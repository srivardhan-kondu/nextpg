import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-[11px] px-6 py-14 text-center', className)}
         style={{ border: '1.5px dashed rgba(21,25,26,.16)', background: '#faf9f6' }}>
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[#e8f1ef]">
        <Icon className="h-5 w-5 text-primary" aria-hidden />
      </div>
      <h3 className="mt-4 text-[15px] font-medium text-[#15191a]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-[#6b7472]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
