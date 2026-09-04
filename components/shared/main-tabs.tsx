'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/predictor', label: 'Rank & College Predictor', short: 'Predictor', icon: Target },
  { href: '/dream-validator', label: 'Dream Validator', short: 'Dream', icon: Sparkles },
] as const;

/**
 * The product's two primary tabs. Rendered as links rather than a Radix Tabs
 * widget so each tab is its own route — shareable, bookmarkable, and cheap to
 * render on the server.
 */
export function MainTabs() {
  const pathname = usePathname();

  return (
    <div role="tablist" aria-label="Main sections" className="inline-flex rounded-lg border border-border bg-muted/60 p-1">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors sm:px-4',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.short}</span>
          </Link>
        );
      })}
    </div>
  );
}
