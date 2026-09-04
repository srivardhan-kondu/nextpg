import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/auth/guards';
import { paymentRepository } from '@/repositories/payment.repository';
import { analyticsRepository } from '@/repositories/analytics.repository';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { AdminPagination } from '@/features/admin/components/admin-pagination';
import { StatTile } from '@/components/shared/stat-tile';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { PaymentStatus } from '@prisma/client';

export const metadata: Metadata = { title: 'Payments' };
export const dynamic = 'force-dynamic';

const STATUS_BADGE = {
  PAID: 'strong',
  CREATED: 'secondary',
  ATTEMPTED: 'moderate',
  FAILED: 'destructive',
  REFUNDED: 'secondary',
} as const;

const STATUSES: PaymentStatus[] = ['PAID', 'CREATED', 'ATTEMPTED', 'FAILED', 'REFUNDED'];

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = STATUSES.includes(params.status as PaymentStatus)
    ? (params.status as PaymentStatus)
    : undefined;

  const [data, overview] = await Promise.all([
    paymentRepository.list({ page, perPage: 25, status }),
    analyticsRepository.overview(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Every Razorpay order and its outcome." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Revenue" value={formatCurrency(overview.revenuePaise)} tone="strong" />
        <StatTile label="Credits sold" value={overview.creditsSold} />
        <StatTile label="Paid users" value={overview.paidUsers} />
        <StatTile
          label="Success rate"
          value={`${overview.paymentSuccessRate}%`}
          tone={overview.paymentSuccessRate >= 90 ? 'strong' : 'moderate'}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No payments recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <span className="font-medium text-foreground">{payment.user.name ?? '—'}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{payment.user.email}</span>
                  </TableCell>
                  <TableCell>
                    <code className="font-mono text-xs text-muted-foreground">{payment.razorpayOrderId}</code>
                    {payment.errorDescription ? (
                      <span className="mt-0.5 block text-xs text-destructive">{payment.errorDescription}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{payment.creditsSold}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.method ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[payment.status]}>{payment.status.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(payment.createdAt)}
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
        basePath="/admin/payments"
        params={{ status: params.status }}
      />
    </div>
  );
}
