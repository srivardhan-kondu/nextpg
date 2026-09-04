import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Page header — matching design doc 1e dashboard heading style */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="flex flex-col gap-[6px]">
        <h2 className="m-0 text-[26px] font-normal leading-[1.2] tracking-[-0.02em] text-[#15191a]">
          {title}
        </h2>
        {description ? (
          <p className="m-0 text-[14px] leading-relaxed text-[#6b7472]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
