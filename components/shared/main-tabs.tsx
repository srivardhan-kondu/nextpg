'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/predictor', label: 'Rank & college predictor', short: 'Predictor' },
  { href: '/dream-validator', label: 'Dream validator', short: 'Dream' },
] as const;

/**
 * The product's two primary tabs — rendered as underline links matching design doc 1b tab strip.
 * Each tab is its own route — shareable and bookmarkable.
 */
export function MainTabs() {
  const pathname = usePathname();

  return (
    <div role="tablist" aria-label="Main sections" className="flex gap-0 px-0">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'mr-[30px] border-b-2 py-[17px] text-[14px] leading-none transition-colors',
              isActive
                ? 'border-primary font-medium text-[#15191a]'
                : 'border-transparent font-normal text-[#6b7472] hover:text-[#15191a]',
            )}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.short}</span>
          </Link>
        );
      })}
    </div>
  );
}
