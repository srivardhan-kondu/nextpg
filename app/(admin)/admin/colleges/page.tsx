import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil } from 'lucide-react';

import { requireAdmin } from '@/lib/auth/guards';
import { collegeRepository } from '@/repositories/college.repository';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { AdminSearch } from '@/features/admin/components/admin-search';
import { AdminPagination } from '@/features/admin/components/admin-pagination';
import { CollegeFormDialog } from '@/features/admin/components/college-form-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { COLLEGE_TYPE_LABEL } from '@/lib/constants';
import type { CollegeType } from '@prisma/client';

export const metadata: Metadata = { title: 'Manage colleges' };
export const dynamic = 'force-dynamic';

export default async function AdminCollegesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; state?: string; type?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const data = await collegeRepository.list({
    page,
    perPage: 20,
    search: params.search,
    state: params.state,
    type: params.type as CollegeType | undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colleges"
        description="The institution master list. Cutoff rows reference these, so deactivate instead of deleting."
        action={<CollegeFormDialog />}
      />

      <AdminSearch placeholder="Search colleges…" />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Cutoffs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No colleges found.{' '}
                  <Link href="/admin/import" className="text-primary underline underline-offset-2">
                    Bulk import
                  </Link>{' '}
                  to get started.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((college) => (
                <TableRow key={college.id}>
                  <TableCell>
                    <span className="font-medium text-foreground">{college.name}</span>
                    {college.city ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">{college.city}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{college.state}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{COLLEGE_TYPE_LABEL[college.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{college._count.cutoffs}</TableCell>
                  <TableCell>
                    {college.isActive ? (
                      <Badge variant="strong">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <CollegeFormDialog
                      college={college}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Edit ${college.name}`}>
                          <Pencil aria-hidden />
                        </Button>
                      }
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
        basePath="/admin/colleges"
        params={{ search: params.search }}
      />
    </div>
  );
}
