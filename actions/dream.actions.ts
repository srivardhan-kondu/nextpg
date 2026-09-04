'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUserOrThrow, AccountBlockedError } from '@/lib/auth/guards';
import { enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';
import { audit } from '@/lib/security/audit';
import { validateDream } from '@/services/prediction/dream.service';
import { collegeRepository } from '@/repositories/college.repository';
import { dreamValidationSchema } from '@/validators/prediction.schema';
import { sanitizeText } from '@/lib/security/sanitize';
import type { DreamValidationResult } from '@/types/prediction';
import type { Prisma } from '@prisma/client';

export type DreamActionState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string[]> }
  | { status: 'success'; result: DreamValidationResult; validationId: string };

/**
 * Validates a dream branch/college against the user's latest prediction.
 *
 * The rank window always comes from a stored prediction, never from the form —
 * otherwise anyone could ask "am I getting AIIMS at rank 1" for free.
 */
export async function validateDreamAction(
  _prev: DreamActionState,
  formData: FormData,
): Promise<DreamActionState> {
  let user;
  try {
    user = await requireUserOrThrow();
  } catch (error) {
    if (error instanceof AccountBlockedError) return { status: 'error', message: error.message };
    return { status: 'error', message: 'Please sign in to validate your dream.' };
  }

  const parsed = dreamValidationSchema.safeParse({
    predictionId: formData.get('predictionId') || undefined,
    dreamBranch: formData.get('dreamBranch'),
    dreamCollegeId: formData.get('dreamCollegeId') || undefined,
    dreamCollegeName: formData.get('dreamCollegeName') || undefined,
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please choose a dream branch.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await enforceRateLimit('dreamValidation', `user:${user.id}`);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { status: 'error', message: 'Too many validations. Please try again later.' };
    }
    throw error;
  }

  const prediction = parsed.data.predictionId
    ? await prisma.prediction.findFirst({ where: { id: parsed.data.predictionId, userId: user.id } })
    : await prisma.prediction.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });

  if (!prediction) {
    return {
      status: 'error',
      message: 'Run a rank prediction first — the validator needs your estimated rank to work.',
    };
  }

  // Dream validation reads premium data, so it sits behind the same paywall.
  if (prediction.status !== 'UNLOCKED') {
    return {
      status: 'error',
      message: 'Unlock your prediction report to use the Dream Validator.',
    };
  }

  try {
    const result = await validateDream({
      predictionId: prediction.id,
      rankMin: prediction.rankMin,
      rankMax: prediction.rankMax,
      category: prediction.category,
      subCategory: prediction.subCategory,
      state: prediction.state,
      dreamBranch: parsed.data.dreamBranch,
      dreamCollegeId: parsed.data.dreamCollegeId,
      dreamCollegeName: parsed.data.dreamCollegeName
        ? sanitizeText(parsed.data.dreamCollegeName, 160)
        : undefined,
    });

    const saved = await prisma.dreamValidation.create({
      data: {
        userId: user.id,
        predictionId: prediction.id,
        dreamBranch: parsed.data.dreamBranch,
        dreamCollege: result.college?.collegeName ?? parsed.data.dreamCollegeName ?? null,
        collegeId: result.college?.collegeId ?? null,
        branchProbability: result.branch.probability,
        branchLikelihood: result.branch.likelihood,
        branchMessage: result.branch.message,
        collegeLikelihood: result.college?.likelihood ?? null,
        requiredRankMin: result.college?.requiredRankMin ?? null,
        requiredRankMax: result.college?.requiredRankMax ?? null,
        studentRankMin: prediction.rankMin,
        studentRankMax: prediction.rankMax,
        eligibleQuotas: result.college?.eligibleQuotas ?? [],
        availableBranches: result.college?.availableBranches ?? [],
        collegeMessage: result.college?.message ?? null,
        resultPayload: result as unknown as Prisma.InputJsonValue,
      },
    });

    await audit({
      userId: user.id,
      action: 'dream.validate',
      entityType: 'dream_validation',
      entityId: saved.id,
      metadata: { branch: parsed.data.dreamBranch, college: result.college?.collegeName ?? null },
    });

    revalidatePath('/dream-validator');
    return { status: 'success', result, validationId: saved.id };
  } catch (error) {
    console.error('[dream] validation failed', error);
    return { status: 'error', message: 'We could not validate that right now. Please try again.' };
  }
}

/**
 * Autocomplete backing the dream college combobox.
 *
 * Rate-limited on the same bucket as GET /api/colleges/search, which runs the
 * identical multi-column `contains` query. An exported server action is
 * directly invocable whether or not the UI happens to call it, so leaving this
 * one unmetered would be a way around that route's limiter.
 */
export async function searchCollegesAction(term: string) {
  const user = await requireUserOrThrow();
  await enforceRateLimit('search', `user:${user.id}`);
  return collegeRepository.search(sanitizeText(term, 120), 10);
}
