import type { Metadata } from 'next';

import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { CsvImportCard } from '@/features/admin/components/csv-import-card';
import { importCollegesAction, importCutoffsAction } from '@/actions/import.actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export const metadata: Metadata = { title: 'Bulk import' };

const COLLEGE_SAMPLE = `name,state,type,city,short_name,university
All India Institute of Medical Sciences Delhi,Delhi,GOVERNMENT,New Delhi,AIIMS Delhi,AIIMS
Osmania Medical College,Telangana,GOVERNMENT,Hyderabad,OMC,KNRUHS`;

const CUTOFF_SAMPLE = `college_name,branch_name,quota,category,sub_category,closing_rank,seat_count,round,academic_year,source
All India Institute of Medical Sciences Delhi,Radiology,AIQ,GENERAL,NONE,142,6,1,2024,MCC 2024 R1
Osmania Medical College,General Medicine,STATE,OBC,NONE,18450,12,2,2024,KNRUHS 2024`;

export const dynamic = 'force-dynamic';

const JOB_BADGE = {
  PENDING: 'secondary',
  PROCESSING: 'moderate',
  REVIEW: 'moderate',
  COMPLETED: 'strong',
  FAILED: 'destructive',
} as const;

export default async function AdminImportPage() {
  await requireAdmin();

  const jobs = await prisma.extractionJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Bulk import"
        description="Load colleges and historical cutoffs from CSV. Every import is audit-logged."
      />

      <Alert variant="info">
        <Info aria-hidden />
        <AlertTitle>Import colleges before cutoffs</AlertTitle>
        <AlertDescription>
          Cutoff rows are matched to colleges and branches by name. Any name we cannot match is reported and
          skipped rather than created, so a typo cannot fragment your data.
        </AlertDescription>
      </Alert>

      <CsvImportCard
        title="Colleges"
        description="Creates new colleges and updates existing ones (matched by name + state)."
        columns={['name', 'state', 'type', 'city', 'short_name', 'university']}
        sample={COLLEGE_SAMPLE}
        action={importCollegesAction}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">PDF extraction</CardTitle>
          <CardDescription>
            Counselling PDFs are read with OpenAI Vision, validated, and staged for review — they
            never reach the prediction engine unapproved. Run from the CLI, since a large document
            takes minutes and is billed per page:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs">
            <code>npm run extract:pdf -- ./mcc-2024-r1.pdf --year 2024 --source &quot;MCC 2024 R1&quot;</code>
          </pre>

          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No PDFs ingested yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {jobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <Link href={`/admin/import/${job.id}`} className="font-medium hover:underline">
                      {job.fileName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {job.sourceLabel} · {job.totalRows} rows · {job.flaggedRows} flagged ·{' '}
                      {job.importedRows} imported · {formatDateTime(job.createdAt)}
                    </p>
                  </div>
                  <Badge variant={JOB_BADGE[job.status]}>{job.status.toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CsvImportCard
        title="Historical cutoffs"
        description="The prediction substrate. Rows matching an existing key are overwritten."
        columns={[
          'college_name', 'branch_name', 'quota', 'category', 'sub_category',
          'closing_rank', 'seat_count', 'round', 'academic_year', 'source',
        ]}
        sample={CUTOFF_SAMPLE}
        action={importCutoffsAction}
      />
    </div>
  );
}
