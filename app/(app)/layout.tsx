import { requireUser } from '@/lib/auth/guards';
import { getBalance, ensureCreditAccount } from '@/services/credit.service';
import { AppSidebarContent } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [, credit] = await Promise.all([
    ensureCreditAccount(user.id),
    getBalance(user.id),
  ]);

  const sidebar = <AppSidebarContent balance={credit.balance} />;

  return (
    <div className="app-canvas min-h-dvh">
      {/* Fixed rail on desktop; the same tree is reused inside the mobile sheet. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-black/[0.08] bg-[#faf9f6] lg:block">
        {sidebar}
      </aside>

      <div className="lg:pl-64">
        <AppHeader user={user} sidebar={sidebar} />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
