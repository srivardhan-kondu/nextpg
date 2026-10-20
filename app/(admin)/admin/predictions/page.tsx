import type { Metadata } from 'next';
import Link from 'next/link';
import { Eye } from 'lucide-react';

import { requireAdmin } from '@/lib/auth/guards';
import { predictionRepository } from '@/repositories/prediction.repository';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { AdminSearch } from '@/features/admin/components/admin-search';
import { AdminPagination } from '@/features/admin/components/admin-pagination';
import { StatTile } from '@/components/shared/stat-tile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate, formatRankRange } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { PredictionsFilter } from '@/features/admin/components/predictions-filter';

export const metadata: Metadata = { title: 'Predictions Report | Admin' };
export const dynamic = 'force-dynamic';

const STATUS_BADGE = {
  PREVIEW: 'secondary',
  UNLOCKED: 'strong',
} as const;

export default async function AdminPredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; state?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [data, totalAll, totalUnlocked, topStates] = await Promise.all([
    predictionRepository.adminList({
      page,
      perPage: 25,
      search: params.search,
      status: params.status,
      state: params.state,
    }),
    prisma.prediction.count(),
    prisma.prediction.count({ where: { status: 'UNLOCKED' } }),
    prisma.prediction.groupBy({
      by: ['state'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predictions Report"
        description="Every student prediction with their college recommendations. Click a row to see the full college list."
      />

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total predictions" value={totalAll} />
        <StatTile label="Unlocked (paid)" value={totalUnlocked} tone="primary" />
        <StatTile label="Preview (free)" value={totalAll - totalUnlocked} />
        <StatTile
          label="Unlock rate"
          value={totalAll > 0 ? `${Math.round((totalUnlocked / totalAll) * 100)}%` : '—'}
          tone="strong"
          hint="unlocked ÷ total"
        />
      </div>

      {/* Top states mini-list */}
      {topStates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-muted-foreground self-center">Top states:</span>
          {topStates.map((s) => (
            <Link
              key={s.state}
              href={`/admin/predictions?state=${encodeURIComponent(s.state)}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              {s.state}
              <span className="text-muted-foreground">({s._count.id})</span>
            </Link>
          ))}
          {params.state && (
            <Link
              href="/admin/predictions"
              className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              Clear filter
            </Link>
          )}
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <AdminSearch placeholder="Search by student name or email…" />
        <PredictionsFilter currentStatus={params.status} currentState={params.state} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Candidate name</TableHead>
              <TableHead>State · Category</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Rank range</TableHead>
              <TableHead className="text-right">Colleges</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  No predictions match this search / filter.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((pred) => (
                <TableRow key={pred.id} className="group">
                  <TableCell>
                    <span className="font-medium text-foreground">{pred.user.name ?? '—'}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{pred.user.email}</span>
                  </TableCell>
                  <TableCell className="font-medium">{pred.candidateName}</TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">{pred.state}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {pred.category}
                      {pred.subCategory !== 'NONE' ? ` · ${pred.subCategory}` : ''}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">{pred.expectedScore}</TableCell>
                  <TableCell className="tabular-nums font-mono text-sm">
                    {formatRankRange(pred.rankMin, pred.rankMax)}
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {pred.confidence}% confidence
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {pred.totalOpportunities}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[pred.status]}>
                      {pred.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(pred.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button asChild size="icon" variant="ghost" className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/predictions/${pred.id}`} aria-label="View college predictions">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
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
        basePath="/admin/predictions"
        params={{ search: params.search, status: params.status, state: params.state }}
      />
    </div>
  );
}
