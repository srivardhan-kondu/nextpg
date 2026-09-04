import { MobileNav } from './mobile-nav';
import { UserMenu } from '@/features/auth/components/user-menu';

interface AppHeaderProps {
  title?: string;
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
  sidebar: React.ReactNode;
}

export function AppHeader({ title, user, sidebar }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[64px] items-center gap-2 border-b border-black/[0.08] bg-white px-4 lg:px-6">
      <MobileNav>{sidebar}</MobileNav>
      {title ? (
        <h1 className="truncate text-[13.5px] font-semibold leading-none text-[#15191a] lg:hidden">
          {title}
        </h1>
      ) : null}
      <div className="ml-auto flex items-center gap-[18px]">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
