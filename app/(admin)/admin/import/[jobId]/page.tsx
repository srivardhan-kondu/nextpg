import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { REVIEW_THRESHOLD } from '@/services/import/validation.service';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { ExtractionReview } from '@/features/admin/components/extraction-review';
import { StatTile } from '@/components/shared/stat-tile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Review extraction' };
export const dynamic = 'force-dynamic';

const MAX_ROWS_SHOWN = 300;

export default async function ExtractionReviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  await requireAdmin();
  const { jobId } = await params;

  const job = await prisma.extractionJob.findUnique({ where: { id: jobId } });
  if (!job) notFound();

  const [rows, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.extractedCutoff.findMany({
      where: { jobId },
      // Least trustworthy first — that is where a reviewer's attention is worth most.
      orderBy: [{ status: 'asc' }, { confidence: 'asc' }, { pageNumber: 'asc' }],
      take: MAX_ROWS_SHOWN,
      include: {
        college: { select: { name: true } },
        branch: { select: { name: true } },
      },
    }),
    prisma.extractedCutoff.count({ where: { jobId, status: 'PENDING' } }),
    prisma.extractedCutoff.count({ where: { jobId, status: 'APPROVED' } }),
    prisma.extractedCutoff.count({ where: { jobId, status: 'REJECTED' } }),
  ]);

  const cost =
    (job.promptTokens / 1000) * 0.0025 + (job.completionTokens / 1000) * 0.01;

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.fileName}
        description={`${job.sourceLabel} · academic year ${job.academicYear} · extracted ${formatDateTime(job.createdAt)}`}
        action={
          <Button asChild variant="outline">
            <Link href="/admin/import">
              <ArrowLeft aria-hidden />
              All imports
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={job.status === 'COMPLETED' ? 'strong' : 'soft'}>
          {job.status.toLowerCase()}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {job.model} · prompt {job.promptVersion} · {job.pageCount} pages · ~${cost.toFixed(2)}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Rows extracted" value={job.totalRows} />
        <StatTile label="Awaiting review" value={pendingCount} tone={pendingCount ? 'moderate' : 'default'} />
        <StatTile label="Approved" value={approvedCount} tone="strong" />
        <StatTile label="Rejected" value={rejectedCount} />
        <StatTile label="Imported" value={job.importedRows} tone="primary" />
      </div>

      {job.error ? (
        <p className="rounded-lg border border-destructive/30 bg-stretch-soft p-4 text-sm text-destructive">
          {job.error}
        </p>
      ) : null}

      <ExtractionReview
        jobId={job.id}
        threshold={REVIEW_THRESHOLD}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        rows={rows.map((row) => ({
          id: row.id,
          pageNumber: row.pageNumber,
          rawText: row.rawText,
          rawCollegeName: row.rawCollegeName,
          rawBranchName: row.rawBranchName,
          collegeName: row.college?.name ?? null,
          branchName: row.branch?.name ?? null,
          quota: row.quota,
          category: row.category,
          closingRank: row.closingRank,
          seatCount: row.seatCount,
          round: row.round,
          confidence: row.confidence,
          issues: row.issues,
          status: row.status,
        }))}
      />

      {job.totalRows > MAX_ROWS_SHOWN ? (
        <p className="text-sm text-muted-foreground">
          Showing the {MAX_ROWS_SHOWN} least confident of {job.totalRows} rows. Approve or reject
          these, then reload for the next batch.
        </p>
      ) : null}
    </div>
  );
}
