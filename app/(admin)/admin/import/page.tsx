import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/auth/guards';
import { PageHeader } from '@/features/dashboard/components/page-header';
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

export default async function AdminImportPage() {
  await requireAdmin();

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
