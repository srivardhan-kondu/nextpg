import type { Metadata } from 'next';
import { Pencil } from 'lucide-react';

import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { BranchFormDialog } from '@/features/admin/components/branch-form-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export const metadata: Metadata = { title: 'Manage branches' };
export const dynamic = 'force-dynamic';

export default async function AdminBranchesPage() {
  await requireAdmin();

  const branches = await prisma.branch.findMany({
    orderBy: [{ popularity: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { cutoffs: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Specialities offered across all colleges. Popularity drives dropdown ordering."
        action={<BranchFormDialog />}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Degree</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Popularity</TableHead>
              <TableHead className="text-right">Cutoffs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No branches yet. Run the seed script or add one manually.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium text-foreground">{branch.name}</TableCell>
                  <TableCell className="text-muted-foreground">{branch.code ?? '—'}</TableCell>
                  <TableCell>{branch.degree}</TableCell>
                  <TableCell>
                    <Badge variant={branch.isClinical ? 'soft' : 'secondary'}>
                      {branch.isClinical ? 'Clinical' : 'Non-clinical'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{branch.popularity}</TableCell>
                  <TableCell className="text-right tabular-nums">{branch._count.cutoffs}</TableCell>
                  <TableCell>
                    {branch.isActive ? (
                      <Badge variant="strong">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <BranchFormDialog
                      branch={branch}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Edit ${branch.name}`}>
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
    </div>
  );
}
