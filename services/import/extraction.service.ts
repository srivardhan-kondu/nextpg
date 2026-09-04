import { basename } from 'node:path';
import { stat } from 'node:fs/promises';
import type { QuotaType } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { hashFile, pdfPageCount, renderPdfPages } from './pdf.service';
import { extractPage, PROMPT_VERSION } from './vision.service';
import { REVIEW_THRESHOLD, validateRow, type Reference } from './validation.service';
import { BRANCH_ALIASES, type BranchName } from '@/lib/constants';

export class DuplicateDocumentError extends Error {
  constructor(public readonly jobId: string) {
    super('This exact PDF has already been ingested.');
    this.name = 'DuplicateDocumentError';
  }
}

async function loadReferences(): Promise<{ colleges: Reference[]; branches: Reference[] }> {
  const [colleges, branches] = await Promise.all([
    prisma.college.findMany({
      where: { isActive: true },
      select: { id: true, name: true, shortName: true },
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
    }),
  ]);

  return {
    colleges: colleges.map((c) => ({
      id: c.id,
      name: c.name,
      aliases: c.shortName ? [c.shortName] : [],
    })),
    branches: branches.map((b) => ({
      id: b.id,
      name: b.name,
      // Curated counselling-authority nomenclature, so "MD Radiodiagnosis"
      // resolves to Radiology instead of landing in the review queue.
      aliases: [
        ...(b.code ? [b.code] : []),
        ...(BRANCH_ALIASES[b.name as BranchName] ?? []),
      ],
    })),
  };
}

export interface ExtractionOptions {
  filePath: string;
  sourceLabel: string;
  academicYear: number;
  defaultQuota?: QuotaType | null;
  defaultRound?: number | null;
  userId?: string | null;
  firstPage?: number;
  lastPage?: number;
  onProgress?: (event: { page: number; of: number; rows: number }) => void;
}

/**
 * Ingests one PDF end to end: rasterise → transcribe → validate → stage.
 *
 * Nothing here writes to historical_cutoffs. Every row lands in the staging
 * table with its page number, verbatim source text and confidence, and waits
 * for a human. That separation is the whole safety model: a vision misread is
 * indistinguishable from real data once it reaches the prediction engine.
 */
export async function ingestPdf(options: ExtractionOptions) {
  const { filePath, sourceLabel, academicYear, defaultQuota, defaultRound, userId } = options;

  const [fileHash, fileStat, declaredPages] = await Promise.all([
    hashFile(filePath),
    stat(filePath),
    pdfPageCount(filePath),
  ]);

  // Re-ingesting the same document would duplicate every row through the
  // review queue, so it is refused rather than merged.
  const existing = await prisma.extractionJob.findFirst({
    where: { fileHash, status: { not: 'FAILED' } },
    select: { id: true },
  });
  if (existing) throw new DuplicateDocumentError(existing.id);

  const job = await prisma.extractionJob.create({
    data: {
      userId: userId ?? null,
      fileName: basename(filePath),
      fileHash,
      fileSize: fileStat.size,
      pageCount: declaredPages,
      sourceLabel,
      academicYear,
      defaultQuota: defaultQuota ?? null,
      status: 'PROCESSING',
      promptVersion: PROMPT_VERSION,
      model: process.env.OPENAI_VISION_MODEL ?? 'gpt-4o',
      startedAt: new Date(),
    },
  });

  try {
    const { colleges, branches } = await loadReferences();
    const pages = await renderPdfPages(filePath, {
      firstPage: options.firstPage,
      lastPage: options.lastPage,
    });

    let totalRows = 0;
    let flaggedRows = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    for (const [index, page] of pages.entries()) {
      const { page: result, usage } = await extractPage({
        base64Png: page.base64,
        pageNumber: page.pageNumber,
        hint: `${sourceLabel}, academic year ${academicYear}`,
      });

      promptTokens += usage.promptTokens;
      completionTokens += usage.completionTokens;

      if (!result.isCutoffTable || result.rows.length === 0) {
        await prisma.extractionJob.update({
          where: { id: job.id },
          data: { pagesProcessed: index + 1 },
        });
        options.onProgress?.({ page: page.pageNumber, of: pages.length, rows: 0 });
        continue;
      }

      const staged = result.rows.map((row, rowIndex) => {
        const validated = validateRow({ row, colleges, branches, defaultQuota, academicYear });
        if (!validated.autoApprovable) flaggedRows++;

        return {
          jobId: job.id,
          pageNumber: page.pageNumber,
          rowIndex,
          rawText: row.rawText,
          rawCollegeName: row.collegeName ?? '',
          rawBranchName: row.branchName ?? '',
          rawQuota: row.quota,
          rawCategory: row.category,
          collegeId: validated.collegeId,
          branchId: validated.branchId,
          quota: validated.quota,
          category: validated.category,
          subCategory: validated.subCategory,
          closingRank: validated.closingRank,
          openingRank: validated.openingRank,
          seatCount: validated.seatCount,
          // The document's own round wins; the operator's default only fills a gap.
          round: validated.round ?? defaultRound ?? null,
          academicYear,
          confidence: validated.confidence,
          issues: validated.issues,
        };
      });

      await prisma.extractedCutoff.createMany({ data: staged });
      totalRows += staged.length;

      await prisma.extractionJob.update({
        where: { id: job.id },
        data: { pagesProcessed: index + 1, totalRows, flaggedRows, promptTokens, completionTokens },
      });

      options.onProgress?.({ page: page.pageNumber, of: pages.length, rows: staged.length });
    }

    const completed = await prisma.extractionJob.update({
      where: { id: job.id },
      data: {
        status: 'REVIEW',
        pageCount: pages.length,
        totalRows,
        flaggedRows,
        promptTokens,
        completionTokens,
        completedAt: new Date(),
      },
    });

    return completed;
  } catch (error) {
    await prisma.extractionJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown extraction error',
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Promotes approved rows into historical_cutoffs.
 *
 * Only rows a human marked APPROVED are eligible, and each is re-checked here:
 * approval in the UI is a decision, not a bypass of the completeness rules.
 */
export async function importApprovedRows(jobId: string, adminId: string) {
  const job = await prisma.extractionJob.findUniqueOrThrow({ where: { id: jobId } });

  const rows = await prisma.extractedCutoff.findMany({
    where: { jobId, status: 'APPROVED' },
    include: { college: { select: { state: true } } },
  });

  let imported = 0;
  const skipped: { id: string; reason: string }[] = [];

  for (const row of rows) {
    if (!row.collegeId || !row.branchId || !row.quota || !row.category || row.closingRank === null) {
      skipped.push({ id: row.id, reason: 'incomplete after approval' });
      continue;
    }

    const key = {
      collegeId: row.collegeId,
      branchId: row.branchId,
      quota: row.quota,
      category: row.category,
      subCategory: row.subCategory,
      round: row.round ?? 1,
      academicYear: row.academicYear ?? job.academicYear,
    };

    await prisma.historicalCutoff.upsert({
      where: { collegeId_branchId_quota_category_subCategory_round_academicYear: key },
      create: {
        ...key,
        closingRank: row.closingRank,
        openingRank: row.openingRank,
        seatCount: row.seatCount ?? 0,
        // Denormalised from the college so state-quota filtering stays index-only.
        state: row.college?.state ?? '',
        source: job.sourceLabel,
        verifiedAt: new Date(),
      },
      update: {
        closingRank: row.closingRank,
        openingRank: row.openingRank,
        seatCount: row.seatCount ?? 0,
        source: job.sourceLabel,
        verifiedAt: new Date(),
      },
    });

    await prisma.extractedCutoff.update({
      where: { id: row.id },
      data: { status: 'IMPORTED' },
    });
    imported++;
  }

  const remaining = await prisma.extractedCutoff.count({
    where: { jobId, status: 'PENDING' },
  });

  await prisma.extractionJob.update({
    where: { id: jobId },
    data: {
      importedRows: { increment: imported },
      status: remaining === 0 ? 'COMPLETED' : 'REVIEW',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'admin.extraction.import',
      entityType: 'extraction_job',
      entityId: jobId,
      severity: 'warn',
      metadata: { imported, skipped: skipped.length, source: job.sourceLabel },
    },
  });

  return { imported, skipped };
}

export { REVIEW_THRESHOLD };
