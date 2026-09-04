import Link from 'next/link';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/config/site';

export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center gap-2 rounded-md text-xl font-bold tracking-tight text-primary', className)}
      aria-label={`${siteConfig.brand} home`}
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">
        N
      </span>
      <span>{siteConfig.brand}</span>
    </Link>
  );
}
