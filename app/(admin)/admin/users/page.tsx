import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/auth/guards';
import { userRepository } from '@/repositories/user.repository';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { AdminSearch } from '@/features/admin/components/admin-search';
import { AdminPagination } from '@/features/admin/components/admin-pagination';
import { UserRowActions } from '@/features/admin/components/user-row-actions';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Manage users' };
export const dynamic = 'force-dynamic';

const ROLE_BADGE = {
  USER: 'secondary',
  ADMIN: 'soft',
  SUPER_ADMIN: 'default',
} as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const data = await userRepository.list({ page, perPage: 20, search: params.search });

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Accounts, credit balances and access control." />

      <AdminSearch placeholder="Search by email or name…" />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Used</TableHead>
              <TableHead className="text-right">Predictions</TableHead>
              <TableHead className="text-right">Payments</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No users match this search.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <span className="font-medium text-foreground">{user.name ?? '—'}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{user.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_BADGE[user.role]}>{user.role.replace('_', ' ').toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{user.credit?.balance ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {user.credit?.used ?? 0}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{user._count.predictions}</TableCell>
                  <TableCell className="text-right tabular-nums">{user._count.payments}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Badge variant="destructive">Blocked</Badge>
                    ) : (
                      <Badge variant="strong">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <UserRowActions
                      user={{ id: user.id, email: user.email, role: user.role, isBlocked: user.isBlocked }}
                      canChangeRole={admin.role === 'SUPER_ADMIN'}
                      isSelf={user.id === admin.id}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPagination
        page={data.page}
        pages={data.pages}
        total={data.total}
        basePath="/admin/users"
        params={{ search: params.search }}
      />
    </div>
  );
}
