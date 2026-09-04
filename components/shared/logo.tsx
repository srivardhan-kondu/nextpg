import Link from 'next/link';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/config/site';

/** PG Predictor logo — teal rounded-square icon + brand name, matching design doc. */
export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center gap-2.5 rounded-md', className)}
      aria-label={`${siteConfig.brand} home`}
    >
      {/* Teal square with white inner square — exactly per design doc */}
      <span
        className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-primary"
        aria-hidden
      >
        <span className="block h-[10px] w-[10px] rounded-[3px] bg-white" />
      </span>
      <span className="text-[15.5px] font-semibold leading-none tracking-[-0.01em] text-foreground">
        {siteConfig.brand}
      </span>
    </Link>
  );
}
