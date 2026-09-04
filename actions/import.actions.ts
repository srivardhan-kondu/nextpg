'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Category, CollegeType, QuotaType, SubCategory } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { requireAdminOrThrow } from '@/lib/auth/guards';
import { audit } from '@/lib/security/audit';
import { parseCsvTable } from '@/lib/csv';
import { slugify } from '@/lib/utils';
import { INDIAN_STATES } from '@/lib/constants';

export interface ImportResult {
  status: 'idle' | 'success' | 'error';
  message?: string;
  created?: number;
  updated?: number;
  skipped?: number;
  /** First few problems only — a 5000-row file must not return 5000 errors. */
  errors?: string[];
}

const MAX_ERRORS = 20;
const MAX_ROWS = 20_000;
const MAX_BYTES = 5 * 1024 * 1024;

const collegeRowSchema = z.object({
  name: z.string().trim().min(3).max(160),
  state: z.enum(INDIAN_STATES as unknown as [string, ...string[]]),
  type: z.enum(['GOVERNMENT', 'PRIVATE', 'DEEMED', 'DNB']),
  city: z.string().trim().max(80).optional(),
  short_name: z.string().trim().max(40).optional(),
  university: z.string().trim().max(160).optional(),
});

const cutoffRowSchema = z.object({
  college_name: z.string().trim().min(3).max(160),
  branch_name: z.string().trim().min(2).max(80),
  quota: z.enum(['AIQ', 'STATE', 'DEEMED', 'MANAGEMENT', 'NRI', 'INSTITUTIONAL']),
  category: z.enum(['GENERAL', 'EWS', 'OBC', 'SC', 'ST']),
  sub_category: z.enum(['NONE', 'PWD', 'ARMED_FORCES', 'NRI', 'MANAGEMENT', 'MINORITY']).default('NONE'),
  closing_rank: z.coerce.number().int().min(1).max(2_000_000),
  opening_rank: z.coerce.number().int().min(1).max(2_000_000).optional(),
  seat_count: z.coerce.number().int().min(0).max(2000).default(0),
  round: z.coerce.number().int().min(1).max(6).default(1),
  academic_year: z.coerce.number().int().min(2015).max(2100),
  source: z.string().trim().max(120).optional(),
});

async function readCsv(formData: FormData): Promise<{ text: string } | { error: string }> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a CSV file to upload.' };
  if (file.size > MAX_BYTES) return { error: 'File is too large. Split it into chunks under 5 MB.' };
  return { text: await file.text() };
}

/** Blank optional cells arrive as '' from CSV; Zod wants them absent. */
function optional(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export async function importCollegesAction(
  _prev: ImportResult,
  formData: FormData,
): Promise<ImportResult> {
  const admin = await requireAdminOrThrow();

  const read = await readCsv(formData);
  if ('error' in read) return { status: 'error', message: read.error };

  const { rows } = parseCsvTable(read.text);
  if (rows.length === 0) return { status: 'error', message: 'The file has no data rows.' };
  if (rows.length > MAX_ROWS) {
    return { status: 'error', message: `Too many rows (${rows.length}). Import at most ${MAX_ROWS} at a time.` };
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const parsed = collegeRowSchema.safeParse({
      name: row.name,
      state: row.state,
      type: row.type?.toUpperCase(),
      city: optional(row.city),
      short_name: optional(row.short_name),
      university: optional(row.university),
    });

    if (!parsed.success) {
      if (errors.length < MAX_ERRORS) {
        errors.push(`Row ${index + 2}: ${parsed.error.issues[0]?.message ?? 'invalid'}`);
      }
      continue;
    }

    const data = {
      name: parsed.data.name,
      state: parsed.data.state,
      type: parsed.data.type as CollegeType,
      city: parsed.data.city,
      shortName: parsed.data.short_name,
      university: parsed.data.university,
      slug: slugify(`${parsed.data.name}-${parsed.data.state}`),
      isActive: true,
    };

    const existing = await prisma.college.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (existing) {
      await prisma.college.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.college.create({ data });
      created++;
    }
  }

  await audit({
    userId: admin.id,
    action: 'admin.import.colleges',
    entityType: 'college',
    severity: 'warn',
    metadata: { created, updated, failed: rows.length - created - updated },
  });

  revalidatePath('/admin/colleges');
  return {
    status: 'success',
    message: `Imported ${created} new and updated ${updated} colleges.`,
    created,
    updated,
    skipped: rows.length - created - updated,
    errors,
  };
}

/**
 * Cutoff import. Colleges and branches are matched by name — the CSVs published
 * by counseling authorities carry names, not our ids. Unmatched names are
 * reported rather than silently created, because a typo would otherwise mint a
 * duplicate college that fragments the cutoff data.
 */
export async function importCutoffsAction(
  _prev: ImportResult,
  formData: FormData,
): Promise<ImportResult> {
  const admin = await requireAdminOrThrow();

  const read = await readCsv(formData);
  if ('error' in read) return { status: 'error', message: read.error };

  const { rows } = parseCsvTable(read.text);
  if (rows.length === 0) return { status: 'error', message: 'The file has no data rows.' };
  if (rows.length > MAX_ROWS) {
    return { status: 'error', message: `Too many rows (${rows.length}). Import at most ${MAX_ROWS} at a time.` };
  }

  // Resolve names once; a per-row lookup would be thousands of queries.
  const [colleges, branches] = await Promise.all([
    prisma.college.findMany({ select: { id: true, name: true, state: true } }),
    prisma.branch.findMany({ select: { id: true, name: true } }),
  ]);

  const collegeByName = new Map(colleges.map((c) => [c.name.toLowerCase(), c]));
  const branchByName = new Map(branches.map((b) => [b.name.toLowerCase(), b]));

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const parsed = cutoffRowSchema.safeParse({
      college_name: row.college_name,
      branch_name: row.branch_name,
      quota: row.quota?.toUpperCase(),
      category: row.category?.toUpperCase(),
      sub_category: row.sub_category ? row.sub_category.toUpperCase() : 'NONE',
      closing_rank: row.closing_rank,
      opening_rank: optional(row.opening_rank),
      seat_count: row.seat_count || 0,
      round: row.round || 1,
      academic_year: row.academic_year,
      source: optional(row.source),
    });

    if (!parsed.success) {
      if (errors.length < MAX_ERRORS) {
        const issue = parsed.error.issues[0];
        errors.push(`Row ${index + 2}: ${issue?.path.join('.')} — ${issue?.message}`);
      }
      continue;
    }

    const college = collegeByName.get(parsed.data.college_name.toLowerCase());
    const branch = branchByName.get(parsed.data.branch_name.toLowerCase());

    if (!college) {
      if (errors.length < MAX_ERRORS) errors.push(`Row ${index + 2}: unknown college "${parsed.data.college_name}"`);
      continue;
    }
    if (!branch) {
      if (errors.length < MAX_ERRORS) errors.push(`Row ${index + 2}: unknown branch "${parsed.data.branch_name}"`);
      continue;
    }

    const key = {
      collegeId: college.id,
      branchId: branch.id,
      quota: parsed.data.quota as QuotaType,
      category: parsed.data.category as Category,
      subCategory: parsed.data.sub_category as SubCategory,
      round: parsed.data.round,
      academicYear: parsed.data.academic_year,
    };

    const payload = {
      ...key,
      closingRank: parsed.data.closing_rank,
      openingRank: parsed.data.opening_rank,
      seatCount: parsed.data.seat_count,
      state: college.state,
      source: parsed.data.source,
      verifiedAt: new Date(),
    };

    const existing = await prisma.historicalCutoff.findUnique({
      where: { collegeId_branchId_quota_category_subCategory_round_academicYear: key },
      select: { id: true },
    });

    if (existing) {
      await prisma.historicalCutoff.update({ where: { id: existing.id }, data: payload });
      updated++;
    } else {
      await prisma.historicalCutoff.create({ data: payload });
      created++;
    }
  }

  await audit({
    userId: admin.id,
    action: 'admin.import.cutoffs',
    entityType: 'historical_cutoff',
    severity: 'warn',
    metadata: { created, updated, failed: rows.length - created - updated },
  });

  revalidatePath('/admin/cutoffs');
  revalidatePath('/admin');

  return {
    status: 'success',
    message: `Imported ${created} new and updated ${updated} cutoff rows.`,
    created,
    updated,
    skipped: rows.length - created - updated,
    errors,
  };
}
