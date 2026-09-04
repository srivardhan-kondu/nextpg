'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, Building2, CreditCard, FileText, GitBranch, LayoutDashboard, ScrollText,
  Shield, Sparkles, Target, Upload, User, Users, Wallet, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavIcon, NavItem } from './nav-items';

/** Resolves the serialisable icon key from nav-items to a real component. */
const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  target: Target,
  sparkles: Sparkles,
  'file-text': FileText,
  'credit-card': CreditCard,
  user: User,
  'bar-chart': BarChart3,
  building: Building2,
  'git-branch': GitBranch,
  scroll: ScrollText,
  shield: Shield,
  users: Users,
  wallet: Wallet,
  upload: Upload,
};

export function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Main">
      {items.map((item) => {
        // Exact match for index routes so /dashboard doesn't stay lit on /admin/*.
        const isActive =
          item.href === '/dashboard' || item.href === '/admin'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        const Icon = ICONS[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-[7px] px-3 py-2.5 text-[13.5px] font-medium leading-none transition-colors',
              isActive
                ? 'bg-[#e8f1ef] text-[#0b544e]'
                : 'text-[#4e5654] hover:bg-[#f0f0ec] hover:text-[#15191a]',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
