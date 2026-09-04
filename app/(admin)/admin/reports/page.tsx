import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { AdminPagination } from '@/features/admin/components/admin-pagination';
import { StatTile } from '@/components/shared/stat-tile';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDateTime, formatRankRange } from '@/lib/utils';

export const metadata: Metadata = { title: 'Reports' };
export const dynamic = 'force-dynamic';

const PER_PAGE = 25;

const STATUS_BADGE = {
  READY: 'strong',
  PENDING: 'secondary',
  GENERATING: 'moderate',
  FAILED: 'destructive',
} as const;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [items, total, ready, downloads] = await Promise.all([
    prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        user: { select: { email: true, name: true } },
        prediction: { select: { rankMin: true, rankMax: true, state: true, category: true } },
      },
    }),
    prisma.report.count(),
    prisma.report.count({ where: { status: 'READY' } }),
    prisma.report.aggregate({ _sum: { downloadCount: true } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generated reports across all users. PDFs render on demand from the prediction snapshot."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total reports" value={total} />
        <StatTile label="Ready" value={ready} tone="strong" />
        <StatTile label="Downloads" value={downloads._sum.downloadCount ?? 0} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Prediction</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Downloads</TableHead>
              <TableHead>Last download</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No reports generated yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <span className="font-medium text-foreground">{report.user.name ?? '—'}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{report.user.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums">
                      {formatRankRange(report.prediction.rankMin, report.prediction.rankMax)}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {report.prediction.state} · {report.prediction.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[report.status]}>{report.status.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{report.downloadCount}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {report.lastDownloadAt ? formatDateTime(report.lastDownloadAt) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(report.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPagination page={page} pages={pages} total={total} basePath="/admin/reports" />
    </div>
  );
}
