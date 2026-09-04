import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPredictionProvider } from '@/services/prediction';
import { computeScore, computeUnattempted } from '@/services/prediction/scoring';
import { predictionRepository } from '@/repositories/prediction.repository';
import { sanitizeText } from '@/lib/security/sanitize';
import { EXAM_YEAR } from '@/config/site';
import type { PredictionInput, PredictionResult } from '@/types/prediction';
import type { CreatePredictionInput } from '@/validators/prediction.schema';

/**
 * Orchestrates a prediction: run the engine, snapshot inputs + outputs.
 *
 * Every prediction is stored as PREVIEW. A credit is only spent when the user
 * explicitly unlocks — running the engine is free, reading the full result is not.
 */
export async function createPrediction(userId: string, input: CreatePredictionInput) {
  const expectedScore =
    input.expectedScore || computeScore(input.correctAnswers, input.wrongAnswers);

  const engineInput: PredictionInput = {
    candidateName: sanitizeText(input.candidateName, 80),
    gender: input.gender,
    state: input.state,
    category: input.category,
    subCategory: input.subCategory,
    correctAnswers: input.correctAnswers,
    wrongAnswers: input.wrongAnswers,
    expectedScore,
    preferredType: input.preferredType,
    examYear: EXAM_YEAR,
  };

  const provider = getPredictionProvider();
  const result = await provider.predict(engineInput);

  const prediction = await predictionRepository.create({
    userId,
    candidateName: engineInput.candidateName,
    gender: engineInput.gender,
    state: engineInput.state,
    category: engineInput.category,
    subCategory: engineInput.subCategory,
    correctAnswers: engineInput.correctAnswers,
    wrongAnswers: engineInput.wrongAnswers,
    unattempted: computeUnattempted(engineInput.correctAnswers, engineInput.wrongAnswers),
    expectedScore: result.expectedScore,
    preferredType: engineInput.preferredType,
    rankMin: result.rankMin,
    rankMax: result.rankMax,
    confidence: result.confidence,
    percentile: result.percentile,
    aiqOpportunities: result.aiqOpportunities,
    stateOpportunities: result.stateOpportunities,
    totalOpportunities: result.totalOpportunities,
    resultPayload: result as unknown as Prisma.InputJsonValue,
    engineVersion: result.engineVersion,
    providerId: result.providerId,
    status: 'PREVIEW',
    examYear: EXAM_YEAR,
  });

  // Remember the profile so the next prediction pre-fills.
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: engineInput.candidateName,
      gender: engineInput.gender,
      defaultState: engineInput.state,
      defaultCategory: engineInput.category,
      defaultSubCategory: engineInput.subCategory,
    },
  });

  return { prediction, result };
}

/**
 * What a locked prediction is allowed to expose.
 *
 * Redaction happens on the server: the premium payload must never reach the
 * client for a PREVIEW prediction, because hiding it in CSS is not a paywall.
 */
export function toPreviewResult(result: PredictionResult): PredictionResult {
  return {
    ...result,
    bands: { STRONG: [], MODERATE: [], STRETCH: [] },
    recommendedBranches: [],
    recommendedColleges: [],
    strategy: [],
  };
}

export interface PredictionView {
  id: string;
  status: 'PREVIEW' | 'UNLOCKED';
  locked: boolean;
  result: PredictionResult;
  /** Counts survive redaction — they are the teaser that motivates the unlock. */
  teaser: {
    aiqOpportunities: number;
    stateOpportunities: number;
    totalOpportunities: number;
    branchCount: number;
    collegeCount: number;
  };
}

export function buildPredictionView(prediction: {
  id: string;
  status: 'PREVIEW' | 'UNLOCKED';
  resultPayload: Prisma.JsonValue;
}): PredictionView {
  const full = prediction.resultPayload as unknown as PredictionResult;
  const locked = prediction.status !== 'UNLOCKED';

  return {
    id: prediction.id,
    status: prediction.status,
    locked,
    result: locked ? toPreviewResult(full) : full,
    teaser: {
      aiqOpportunities: full.aiqOpportunities,
      stateOpportunities: full.stateOpportunities,
      totalOpportunities: full.totalOpportunities,
      branchCount: full.recommendedBranches?.length ?? 0,
      collegeCount:
        (full.bands?.STRONG?.length ?? 0) +
        (full.bands?.MODERATE?.length ?? 0) +
        (full.bands?.STRETCH?.length ?? 0),
    },
  };
}
