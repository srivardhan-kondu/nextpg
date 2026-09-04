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
/**
 * Bucket edges for the locked rank band.
 *
 * Wide and coarse on purpose. The precise range is the single number a student
 * would screenshot and leave with, so a locked view shows only the bucket it
 * falls in — enough to prove the engine ran, not enough to substitute for the
 * report. Edges are denser at the top because a 500-rank difference decides a
 * seat there and is noise at rank 150,000.
 */
const RANK_BANDS = [
  1, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000,
];

/** Widens a computed range to the coarse bucket that fully contains it. */
export function toRankBand(rankMin: number, rankMax: number): { min: number; max: number } {
  const min = [...RANK_BANDS].reverse().find((edge) => edge <= rankMin) ?? RANK_BANDS[0]!;
  const max = RANK_BANDS.find((edge) => edge > rankMax) ?? Math.max(rankMax, min * 2);
  return { min, max };
}

/**
 * The rank a given surface is allowed to display.
 *
 * Every list and detail view goes through this rather than reading rankMin and
 * rankMax off the row, so the paywall cannot be forgotten on one screen while
 * being honoured on another.
 */
export function toDisplayRank(params: {
  status: 'PREVIEW' | 'UNLOCKED';
  rankMin: number;
  rankMax: number;
}): { min: number; max: number; banded: boolean } {
  if (params.status === 'UNLOCKED') {
    return { min: params.rankMin, max: params.rankMax, banded: false };
  }
  const band = toRankBand(params.rankMin, params.rankMax);
  return { ...band, banded: true };
}

export function toPreviewResult(result: PredictionResult): PredictionResult {
  const band = toRankBand(result.rankMin, result.rankMax);
  return {
    ...result,
    // Band the range here too: the payload itself must not carry the precise
    // numbers, not just the components that happen to render it today.
    rankMin: band.min,
    rankMax: band.max,
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
  /**
   * What the headline block may display. The detail page renders this rather
   * than the prediction row's own columns — reading those directly is how the
   * precise rank leaked past the paywall before.
   */
  headline: {
    rankMin: number;
    rankMax: number;
    /** True when the range shown is a coarse bucket, not the computed range. */
    banded: boolean;
    /** Null while locked: both narrow the rank far enough to substitute for it. */
    confidence: number | null;
    percentile: number | null;
  };
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

  const rank = toDisplayRank({ status: prediction.status, rankMin: full.rankMin, rankMax: full.rankMax });

  return {
    id: prediction.id,
    status: prediction.status,
    locked,
    result: locked ? toPreviewResult(full) : full,
    headline: {
      rankMin: rank.min,
      rankMax: rank.max,
      banded: rank.banded,
      confidence: locked ? null : full.confidence,
      percentile: locked ? null : full.percentile,
    },
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
