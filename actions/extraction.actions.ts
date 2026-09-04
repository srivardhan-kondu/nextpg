'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { requireAdminOrThrow } from '@/lib/auth/guards';
import { audit } from '@/lib/security/audit';
import { importApprovedRows } from '@/services/import/extraction.service';
import { REVIEW_THRESHOLD } from '@/services/import/validation.service';

export type ExtractionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string };

const rowDecisionSchema = z.object({
  rowId: z.string().cuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().trim().max(300).optional(),
});

/** A reviewer may correct a misread before approving it. */
const rowEditSchema = z.object({
  rowId: z.string().cuid(),
  collegeId: z.string().cuid().nullable().optional(),
  branchId: z.string().cuid().nullable().optional(),
  quota: z.enum(['AIQ', 'STATE', 'DEEMED', 'MANAGEMENT', 'NRI', 'INSTITUTIONAL']).nullable().optional(),
  category: z.enum(['GENERAL', 'EWS', 'OBC', 'SC', 'ST']).nullable().optional(),
  closingRank: z.coerce.number().int().min(1).max(500_000).nullable().optional(),
  seatCount: z.coerce.number().int().min(0).max(500).nullable().optional(),
  round: z.coerce.number().int().min(1).max(6).nullable().optional(),
});

export async function decideRowAction(input: z.input<typeof rowDecisionSchema>): Promise<ExtractionState> {
  const admin = await requireAdminOrThrow();
  const parsed = rowDecisionSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', message: 'Invalid request.' };

  const row = await prisma.extractedCutoff.findUnique({
    where: { id: parsed.data.rowId },
    select: { id: true, status: true, jobId: true },
  });
  if (!row) return { status: 'error', message: 'Row not found.' };
  // An imported row is already in historical_cutoffs; re-deciding it here would
  // be misleading, since it would not undo the import.
  if (row.status === 'IMPORTED') {
    return { status: 'error', message: 'That row has already been imported.' };
  }

  await prisma.extractedCutoff.update({
    where: { id: row.id },
    data: {
      status: parsed.data.decision,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
      reviewNote: parsed.data.note,
    },
  });

  revalidatePath(`/admin/import/${row.jobId}`);
  return { status: 'success', message: `Row ${parsed.data.decision.toLowerCase()}.` };
}

/** Corrects a transcription before approval, recording who changed what. */
export async function editRowAction(input: z.input<typeof rowEditSchema>): Promise<ExtractionState> {
  const admin = await requireAdminOrThrow();
  const parsed = rowEditSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', message: 'Check the values.' };

  const { rowId, ...fields } = parsed.data;
  const row = await prisma.extractedCutoff.findUnique({ where: { id: rowId } });
  if (!row) return { status: 'error', message: 'Row not found.' };
  if (row.status === 'IMPORTED') {
    return { status: 'error', message: 'That row has already been imported.' };
  }

  await prisma.extractedCutoff.update({
    where: { id: rowId },
    data: { ...fields, reviewedBy: admin.id, reviewedAt: new Date() },
  });

  await audit({
    userId: admin.id,
    action: 'admin.extraction.row.edit',
    entityType: 'extracted_cutoff',
    entityId: rowId,
    severity: 'warn',
    metadata: { before: { closingRank: row.closingRank, quota: row.quota }, after: fields },
  });

  revalidatePath(`/admin/import/${row.jobId}`);
  return { status: 'success', message: 'Row updated.' };
}

/**
 * Bulk-approves the rows the validator found no fault with.
 *
 * Scoped deliberately narrowly: complete, matched, above the confidence
 * threshold and carrying zero issues. Anything else still needs a person to
 * look at the page.
 */
export async function approveCleanRowsAction(jobId: string): Promise<ExtractionState> {
  const admin = await requireAdminOrThrow();

  const { count } = await prisma.extractedCutoff.updateMany({
    where: {
      jobId,
      status: 'PENDING',
      confidence: { gte: REVIEW_THRESHOLD },
      issues: { isEmpty: true },
      collegeId: { not: null },
      branchId: { not: null },
      quota: { not: null },
      category: { not: null },
      closingRank: { not: null },
    },
    data: { status: 'APPROVED', reviewedBy: admin.id, reviewedAt: new Date() },
  });

  await audit({
    userId: admin.id,
    action: 'admin.extraction.bulk_approve',
    entityType: 'extraction_job',
    entityId: jobId,
    severity: 'warn',
    metadata: { count },
  });

  revalidatePath(`/admin/import/${jobId}`);
  return { status: 'success', message: `Approved ${count} clean row${count === 1 ? '' : 's'}.` };
}

export async function importJobAction(jobId: string): Promise<ExtractionState> {
  const admin = await requireAdminOrThrow();

  try {
    const { imported, skipped } = await importApprovedRows(jobId, admin.id);
    revalidatePath(`/admin/import/${jobId}`);
    revalidatePath('/admin/cutoffs');
    revalidatePath('/admin');

    return {
      status: 'success',
      message:
        `Imported ${imported} row${imported === 1 ? '' : 's'} into historical cutoffs.` +
        (skipped.length ? ` ${skipped.length} skipped as incomplete.` : ''),
    };
  } catch (error) {
    console.error('[extraction] import failed', error);
    return { status: 'error', message: 'Could not import the approved rows.' };
  }
}

export async function deleteJobAction(jobId: string): Promise<ExtractionState> {
  const admin = await requireAdminOrThrow();

  const imported = await prisma.extractedCutoff.count({ where: { jobId, status: 'IMPORTED' } });
  // Deleting the job would erase the provenance of rows now in the live table.
  if (imported > 0) {
    return {
      status: 'error',
      message: `This job has ${imported} imported rows. Delete those cutoffs first if you need to undo it.`,
    };
  }

  await prisma.extractionJob.delete({ where: { id: jobId } });
  await audit({
    userId: admin.id,
    action: 'admin.extraction.delete',
    entityType: 'extraction_job',
    entityId: jobId,
    severity: 'warn',
  });

  revalidatePath('/admin/import');
  return { status: 'success', message: 'Extraction job deleted.' };
}
