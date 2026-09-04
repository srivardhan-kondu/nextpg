import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { QuotaRuleFormDialog } from '@/features/admin/components/quota-rule-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { CATEGORY_LABEL, QUOTA_LABEL } from '@/lib/constants';
import { Info } from 'lucide-react';

export const metadata: Metadata = { title: 'Quota rules' };
export const dynamic = 'force-dynamic';

export default async function AdminQuotaRulesPage() {
  await requireAdmin();

  const rules = await prisma.quotaRule.findMany({
    orderBy: [{ state: 'asc' }, { quota: 'asc' }],
    take: 500,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quota rules"
        description="Domicile and reservation rules per state. These decide which quotas each candidate competes in."
        action={<QuotaRuleFormDialog />}
      />

      <Alert variant="info">
        <Info aria-hidden />
        <AlertTitle>Rules are additive on top of a national baseline</AlertTitle>
        <AlertDescription>
          Every candidate gets AIQ, deemed and their own state quota by default. Rules here add to that set —
          the engine works on an empty table, and these refine it.
        </AlertDescription>
      </Alert>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>State</TableHead>
              <TableHead>Quota</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Reservation</TableHead>
              <TableHead className="text-right">Seat share</TableHead>
              <TableHead>Domicile</TableHead>
              <TableHead className="text-right">Year</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No quota rules yet — the engine is running on national defaults.
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium text-foreground">{rule.state}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{QUOTA_LABEL[rule.quota]}</Badge>
                  </TableCell>
                  <TableCell>{rule.category ? CATEGORY_LABEL[rule.category] : 'All'}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rule.reservationPct != null ? `${rule.reservationPct}%` : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rule.seatSharePct != null ? `${rule.seatSharePct}%` : '—'}
                  </TableCell>
                  <TableCell>{rule.requiresDomicile ? 'Required' : 'Not required'}</TableCell>
                  <TableCell className="text-right tabular-nums">{rule.academicYear}</TableCell>
                  <TableCell>
                    {rule.isActive ? <Badge variant="strong">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
