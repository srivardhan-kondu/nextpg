'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUserOrThrow, AuthorizationError } from '@/lib/auth/guards';
import { enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';
import { getClientIp } from '@/lib/security/request';
import { audit } from '@/lib/security/audit';
import { createPrediction } from '@/services/prediction/prediction.service';
import { consumeCredit, InsufficientCreditsError } from '@/services/credit.service';
import { ensureReport } from '@/services/report/report.service';
import { createPredictionSchema, unlockPredictionSchema } from '@/validators/prediction.schema';

export type PredictionActionState =
  | { status: 'idle' }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string[]> }
  | { status: 'success'; predictionId: string };

/**
 * Runs the engine and stores a PREVIEW prediction. Free — the paywall sits at
 * unlock, not here, so the user sees a real rank range before paying.
 */
export async function createPredictionAction(
  _prev: PredictionActionState,
  formData: FormData,
): Promise<PredictionActionState> {
  let user;
  try {
    user = await requireUserOrThrow();
  } catch {
    return { status: 'error', message: 'Please sign in to run a prediction.' };
  }

  const parsed = createPredictionSchema.safeParse({
    candidateName: formData.get('candidateName'),
    gender: formData.get('gender'),
    state: formData.get('state'),
    category: formData.get('category'),
    subCategory: formData.get('subCategory') ?? 'NONE',
    correctAnswers: formData.get('correctAnswers'),
    wrongAnswers: formData.get('wrongAnswers'),
    expectedScore: formData.get('expectedScore'),
    preferredType: formData.get('preferredType') ?? 'ANY',
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await enforceRateLimit('prediction', `user:${user.id}`);
    await enforceRateLimit('prediction', `ip:${await getClientIp()}`);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { status: 'error', message: 'You have run a lot of predictions recently. Please try again later.' };
    }
    throw error;
  }

  try {
    const { prediction } = await createPrediction(user.id, parsed.data);

    await audit({
      userId: user.id,
      action: 'prediction.create',
      entityType: 'prediction',
      entityId: prediction.id,
      metadata: {
        state: prediction.state,
        category: prediction.category,
        expectedScore: prediction.expectedScore,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/predictor');
    return { status: 'success', predictionId: prediction.id };
  } catch (error) {
    console.error('[prediction] engine failed', error);
    return { status: 'error', message: 'We could not generate a prediction right now. Please try again.' };
  }
}

export type UnlockState =
  | { status: 'idle' }
  | { status: 'error'; message: string; needsCredits?: boolean }
  | { status: 'success'; predictionId: string; reportId: string };

/**
 * Spends one credit to unlock a prediction and materialise its report.
 *
 * Ordering matters: the credit is consumed inside a transaction that also flips
 * the prediction to UNLOCKED, so a failure after payment cannot leave a charged
 * user with a locked report.
 */
export async function unlockPredictionAction(
  _prev: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  let user;
  try {
    user = await requireUserOrThrow();
  } catch {
    return { status: 'error', message: 'Please sign in to unlock this report.' };
  }

  const parsed = unlockPredictionSchema.safeParse({ predictionId: formData.get('predictionId') });
  if (!parsed.success) return { status: 'error', message: 'That prediction could not be found.' };

  const { predictionId } = parsed.data;

  const prediction = await prisma.prediction.findFirst({
    where: { id: predictionId, userId: user.id },
    select: { id: true, status: true },
  });
  if (!prediction) return { status: 'error', message: 'That prediction could not be found.' };

  try {
    await consumeCredit({ userId: user.id, predictionId, description: 'Full report unlocked' });

    const report = await ensureReport({ predictionId, userId: user.id });

    await audit({
      userId: user.id,
      action: 'prediction.unlock',
      entityType: 'prediction',
      entityId: predictionId,
      metadata: { reportId: report.id },
    });

    revalidatePath('/dashboard');
    revalidatePath('/reports');
    revalidatePath(`/predictor/${predictionId}`);

    return { status: 'success', predictionId, reportId: report.id };
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return {
        status: 'error',
        message: 'You have no credits left. Buy a pack to unlock this report.',
        needsCredits: true,
      };
    }
    if (error instanceof AuthorizationError) {
      return { status: 'error', message: error.message };
    }
    console.error('[prediction] unlock failed', error);
    return { status: 'error', message: 'We could not unlock this report. Please try again.' };
  }
}

export async function deletePredictionAction(predictionId: string) {
  const user = await requireUserOrThrow();

  const prediction = await prisma.prediction.findFirst({
    where: { id: predictionId, userId: user.id },
    select: { id: true, status: true },
  });
  if (!prediction) return { ok: false, message: 'Not found.' };
  // Unlocked reports were paid for — "access forever" means we do not delete them.
  if (prediction.status === 'UNLOCKED') {
    return { ok: false, message: 'Unlocked reports are kept permanently and cannot be deleted.' };
  }

  await prisma.prediction.delete({ where: { id: predictionId } });
  await audit({ userId: user.id, action: 'prediction.delete', entityType: 'prediction', entityId: predictionId });
  revalidatePath('/dashboard');
  return { ok: true };
}
