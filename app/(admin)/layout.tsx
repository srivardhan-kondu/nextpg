import { requireAdmin } from '@/lib/auth/guards';
import { AppSidebarContent } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { Badge } from '@/components/ui/badge';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Re-verified against the database on every admin page render; the middleware
  // gate is only a fast reject, never the authorization decision.
  const admin = await requireAdmin();

  const sidebar = <AppSidebarContent balance={0} variant="admin" />;

  return (
    <div className="app-canvas min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-background lg:block">
        {sidebar}
      </aside>

      <div className="lg:pl-64">
        <AppHeader user={admin} sidebar={sidebar} />
        <div className="border-b border-border bg-primary-soft/40 px-4 py-2 lg:px-8">
          <p className="mx-auto flex max-w-7xl items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="soft">{admin.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'}</Badge>
            Actions here are audit-logged.
          </p>
        </div>
        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
