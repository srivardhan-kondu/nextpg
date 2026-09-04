'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdminOrThrow } from '@/lib/auth/guards';
import { audit } from '@/lib/security/audit';
import { adjustCredits } from '@/services/credit.service';
import { slugify } from '@/lib/utils';
import {
  branchSchema,
  collegeSchema,
  creditAdjustSchema,
  cutoffSchema,
  quotaRuleSchema,
  userAdminSchema,
} from '@/validators/admin.schema';

export type AdminState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string[]> }
  | { status: 'success'; message: string };

function fail(error: unknown, fallback: string): AdminState {
  console.error('[admin]', fallback, error);
  return { status: 'error', message: fallback };
}

// ─────────────────────────── Colleges ───────────────────────────

export async function upsertCollegeAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireAdminOrThrow();
  const id = (formData.get('id') as string) || undefined;

  const parsed = collegeSchema.safeParse({
    name: formData.get('name'),
    shortName: formData.get('shortName') || undefined,
    state: formData.get('state'),
    city: formData.get('city') || undefined,
    type: formData.get('type'),
    university: formData.get('university') || undefined,
    establishedYear: formData.get('establishedYear') || undefined,
    website: formData.get('website') || undefined,
    isActive: formData.get('isActive') !== 'false',
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Check the form.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const data = { ...parsed.data, slug: slugify(`${parsed.data.name}-${parsed.data.state}`) };
    const college = id
      ? await prisma.college.update({ where: { id }, data })
      : await prisma.college.create({ data });

    await audit({
      userId: admin.id,
      action: id ? 'admin.college.update' : 'admin.college.create',
      entityType: 'college',
      entityId: college.id,
      severity: 'warn',
      metadata: { name: college.name },
    });

    revalidatePath('/admin/colleges');
    return { status: 'success', message: id ? 'College updated.' : 'College created.' };
  } catch (error) {
    return fail(error, 'Could not save the college. A college with this name and state may already exist.');
  }
}

export async function deleteCollegeAction(id: string): Promise<AdminState> {
  const admin = await requireAdminOrThrow();
  try {
    // Soft delete: cutoff rows reference this college and reports snapshot it.
    await prisma.college.update({ where: { id }, data: { isActive: false } });
    await audit({
      userId: admin.id,
      action: 'admin.college.deactivate',
      entityType: 'college',
      entityId: id,
      severity: 'warn',
    });
    revalidatePath('/admin/colleges');
    return { status: 'success', message: 'College deactivated.' };
  } catch (error) {
    return fail(error, 'Could not deactivate the college.');
  }
}

// ─────────────────────────── Branches ───────────────────────────

export async function upsertBranchAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireAdminOrThrow();
  const id = (formData.get('id') as string) || undefined;

  const parsed = branchSchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code') || undefined,
    degree: formData.get('degree') ?? 'MD',
    isClinical: formData.get('isClinical') !== 'false',
    popularity: formData.get('popularity') ?? 0,
    description: formData.get('description') || undefined,
    isActive: formData.get('isActive') !== 'false',
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Check the form.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const data = { ...parsed.data, slug: slugify(parsed.data.name) };
    const branch = id
      ? await prisma.branch.update({ where: { id }, data })
      : await prisma.branch.create({ data });

    await audit({
      userId: admin.id,
      action: id ? 'admin.branch.update' : 'admin.branch.create',
      entityType: 'branch',
      entityId: branch.id,
      severity: 'warn',
    });

    revalidatePath('/admin/branches');
    return { status: 'success', message: id ? 'Branch updated.' : 'Branch created.' };
  } catch (error) {
    return fail(error, 'Could not save the branch. That name may already be taken.');
  }
}

// ─────────────────────────── Cutoffs ───────────────────────────

export async function upsertCutoffAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireAdminOrThrow();

  const parsed = cutoffSchema.safeParse({
    collegeId: formData.get('collegeId'),
    branchId: formData.get('branchId'),
    quota: formData.get('quota'),
    category: formData.get('category'),
    subCategory: formData.get('subCategory') ?? 'NONE',
    closingRank: formData.get('closingRank'),
    openingRank: formData.get('openingRank') || undefined,
    seatCount: formData.get('seatCount') ?? 0,
    round: formData.get('round') ?? 1,
    academicYear: formData.get('academicYear'),
    source: formData.get('source') || undefined,
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Check the form.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const college = await prisma.college.findUnique({
      where: { id: parsed.data.collegeId },
      select: { state: true },
    });
    if (!college) return { status: 'error', message: 'That college does not exist.' };

    const row = await prisma.historicalCutoff.upsert({
      where: {
        collegeId_branchId_quota_category_subCategory_round_academicYear: {
          collegeId: parsed.data.collegeId,
          branchId: parsed.data.branchId,
          quota: parsed.data.quota,
          category: parsed.data.category,
          subCategory: parsed.data.subCategory,
          round: parsed.data.round,
          academicYear: parsed.data.academicYear,
        },
      },
      // state is denormalised from the college so state-quota filtering stays index-only.
      create: { ...parsed.data, state: college.state, verifiedAt: new Date() },
      update: { ...parsed.data, state: college.state, verifiedAt: new Date() },
    });

    await audit({
      userId: admin.id,
      action: 'admin.cutoff.upsert',
      entityType: 'historical_cutoff',
      entityId: row.id,
      severity: 'warn',
      metadata: { closingRank: row.closingRank, year: row.academicYear },
    });

    revalidatePath('/admin/cutoffs');
    return { status: 'success', message: 'Cutoff saved.' };
  } catch (error) {
    return fail(error, 'Could not save the cutoff.');
  }
}

export async function deleteCutoffAction(id: string): Promise<AdminState> {
  const admin = await requireAdminOrThrow();
  try {
    await prisma.historicalCutoff.delete({ where: { id } });
    await audit({
      userId: admin.id,
      action: 'admin.cutoff.delete',
      entityType: 'historical_cutoff',
      entityId: id,
      severity: 'warn',
    });
    revalidatePath('/admin/cutoffs');
    return { status: 'success', message: 'Cutoff deleted.' };
  } catch (error) {
    return fail(error, 'Could not delete the cutoff.');
  }
}

// ─────────────────────────── Quota rules ───────────────────────────

export async function upsertQuotaRuleAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireAdminOrThrow();

  const parsed = quotaRuleSchema.safeParse({
    state: formData.get('state'),
    quota: formData.get('quota'),
    category: formData.get('category') || undefined,
    reservationPct: formData.get('reservationPct') || undefined,
    requiresDomicile: formData.get('requiresDomicile') !== 'false',
    seatSharePct: formData.get('seatSharePct') || undefined,
    notes: formData.get('notes') || undefined,
    academicYear: formData.get('academicYear'),
    isActive: formData.get('isActive') !== 'false',
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Check the form.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    // Not an upsert: `category` is nullable, and Prisma's compound-unique input
    // does not accept null, so the "rule applies to every category" row can only
    // be matched with findFirst.
    const existing = await prisma.quotaRule.findFirst({
      where: {
        state: parsed.data.state,
        quota: parsed.data.quota,
        category: parsed.data.category ?? null,
        academicYear: parsed.data.academicYear,
      },
      select: { id: true },
    });

    const rule = existing
      ? await prisma.quotaRule.update({ where: { id: existing.id }, data: parsed.data })
      : await prisma.quotaRule.create({ data: parsed.data });

    await audit({
      userId: admin.id,
      action: 'admin.quota_rule.upsert',
      entityType: 'quota_rule',
      entityId: rule.id,
      severity: 'warn',
    });

    revalidatePath('/admin/quota-rules');
    return { status: 'success', message: 'Quota rule saved.' };
  } catch (error) {
    return fail(error, 'Could not save the quota rule.');
  }
}

// ─────────────────────────── Users ───────────────────────────

export async function updateUserAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireAdminOrThrow();

  const parsed = userAdminSchema.safeParse({
    userId: formData.get('userId'),
    role: formData.get('role') || undefined,
    isBlocked: formData.get('isBlocked') ? formData.get('isBlocked') === 'true' : undefined,
  });

  if (!parsed.success) return { status: 'error', message: 'Invalid request.' };

  // Only a SUPER_ADMIN may mint admins — otherwise an ADMIN could self-escalate.
  if (parsed.data.role && admin.role !== 'SUPER_ADMIN') {
    return { status: 'error', message: 'Only a super admin can change roles.' };
  }
  if (parsed.data.userId === admin.id && parsed.data.isBlocked) {
    return { status: 'error', message: 'You cannot block your own account.' };
  }

  try {
    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        ...(parsed.data.role ? { role: parsed.data.role } : {}),
        ...(parsed.data.isBlocked !== undefined ? { isBlocked: parsed.data.isBlocked } : {}),
      },
    });

    await audit({
      userId: admin.id,
      action: 'admin.user.update',
      entityType: 'user',
      entityId: parsed.data.userId,
      severity: 'critical',
      metadata: { role: parsed.data.role, isBlocked: parsed.data.isBlocked },
    });

    revalidatePath('/admin/users');
    return { status: 'success', message: 'User updated.' };
  } catch (error) {
    return fail(error, 'Could not update the user.');
  }
}

export async function adjustCreditsAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireAdminOrThrow();

  const parsed = creditAdjustSchema.safeParse({
    userId: formData.get('userId'),
    delta: formData.get('delta'),
    reason: formData.get('reason'),
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Check the form.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await adjustCredits({ ...parsed.data, adminId: admin.id });
    revalidatePath('/admin/users');
    return { status: 'success', message: `Adjusted by ${parsed.data.delta} credits.` };
  } catch (error) {
    return fail(error, 'Could not adjust credits.');
  }
}
