import Link from 'next/link';
import { HelpCircle, LogOut } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { SidebarNav } from './sidebar-nav';
import { CreditWidget } from './credit-widget';
import { appNav, adminNav, type NavItem } from './nav-items';
import { SignOutButton } from '@/features/auth/components/sign-out-button';

interface AppSidebarProps {
  balance: number;
  variant?: 'app' | 'admin';
  onNavigate?: () => void;
}

/**
 * Sidebar body, shared by the fixed desktop rail and the mobile sheet.
 * Server component — the interactive bits are their own client islands.
 */
export function AppSidebarContent({ balance, variant = 'app' }: AppSidebarProps) {
  const items: NavItem[] = variant === 'admin' ? adminNav : appNav;

  return (
    <div className="flex h-full flex-col gap-6 px-[18px] py-[26px]">
      <div className="px-[6px]">
        <Logo href={variant === 'admin' ? '/admin' : '/dashboard'} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav items={items} />
        {variant === 'admin' ? (
          <div className="mt-6 border-t border-black/[0.08] pt-4">
            <SidebarNav items={[{ href: '/dashboard', label: 'Back to app', icon: 'dashboard' }]} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {variant === 'app' ? <CreditWidget balance={balance} /> : null}
        <div className="flex flex-col gap-0.5">
          <Link
            href="/support"
            className="flex items-center gap-3 rounded-[7px] px-3 py-2 text-[13px] text-[#6b7472] transition-colors hover:bg-[#f0f0ec] hover:text-[#15191a]"
          >
            <HelpCircle className="h-4 w-4" aria-hidden />
            Help &amp; Support
          </Link>
          <SignOutButton>
            <span className="flex w-full items-center gap-3 rounded-[7px] px-3 py-2 text-[13px] text-[#6b7472] transition-colors hover:bg-[#f0f0ec] hover:text-[#15191a]">
              <LogOut className="h-4 w-4" aria-hidden />
              Log Out
            </span>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
