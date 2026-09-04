import { MobileNav } from './mobile-nav';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { UserMenu } from '@/features/auth/components/user-menu';

interface AppHeaderProps {
  title?: string;
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
  sidebar: React.ReactNode;
}

export function AppHeader({ title, user, sidebar }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur lg:px-6">
      <MobileNav>{sidebar}</MobileNav>
      {title ? <h1 className="truncate text-sm font-semibold lg:hidden">{title}</h1> : null}
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
