import type { Metadata } from 'next';
import Link from 'next/link';

import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { AdminSearch } from '@/features/admin/components/admin-search';
import { AdminPagination } from '@/features/admin/components/admin-pagination';
import { CutoffFormDialog } from '@/features/admin/components/cutoff-form-dialog';
import { DeleteCutoffButton } from '@/features/admin/components/delete-cutoff-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { CATEGORY_LABEL, QUOTA_LABEL } from '@/lib/constants';
import { formatRank } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

export const metadata: Metadata = { title: 'Historical cutoffs' };
export const dynamic = 'force-dynamic';

const PER_PAGE = 25;

export default async function AdminCutoffsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; year?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const year = Number(params.year) || undefined;

  const where: Prisma.HistoricalCutoffWhereInput = {
    ...(year ? { academicYear: year } : {}),
    ...(params.search
      ? {
          OR: [
            { college: { name: { contains: params.search, mode: 'insensitive' } } },
            { branch: { name: { contains: params.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [items, total, colleges, branches] = await Promise.all([
    prisma.historicalCutoff.findMany({
      where,
      orderBy: [{ academicYear: 'desc' }, { closingRank: 'asc' }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { college: { select: { name: true, state: true } }, branch: { select: { name: true } } },
    }),
    prisma.historicalCutoff.count({ where }),
    // Dropdown sources for the create dialog. Capped: a select with 5000 items
    // is unusable, and the CSV importer is the path for bulk work.
    prisma.college.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 500,
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historical cutoffs"
        description="The substrate every prediction is built on. Nothing is shown to a user that is not backed by a row here."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/import">Bulk import</Link>
            </Button>
            <CutoffFormDialog colleges={colleges} branches={branches} />
          </div>
        }
      />

      <AdminSearch placeholder="Search by college or branch…" />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>College</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Quota</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Closing</TableHead>
              <TableHead className="text-right">Seats</TableHead>
              <TableHead className="text-right">Round</TableHead>
              <TableHead className="text-right">Year</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No cutoff rows found.{' '}
                  <Link href="/admin/import" className="text-primary underline underline-offset-2">
                    Import a CSV
                  </Link>{' '}
                  to populate the engine.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="font-medium text-foreground">{row.college.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{row.college.state}</span>
                  </TableCell>
                  <TableCell>{row.branch.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{QUOTA_LABEL[row.quota]}</Badge>
                  </TableCell>
                  <TableCell>
                    {CATEGORY_LABEL[row.category]}
                    {row.subCategory !== 'NONE' ? (
                      <span className="ml-1 text-xs text-muted-foreground">({row.subCategory})</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatRank(row.closingRank)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.seatCount || '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.round}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.academicYear}</TableCell>
                  <TableCell>
                    <DeleteCutoffButton id={row.id} label={`${row.college.name} — ${row.branch.name}`} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPagination
        page={page}
        pages={pages}
        total={total}
        basePath="/admin/cutoffs"
        params={{ search: params.search, year: params.year }}
      />
    </div>
  );
}
