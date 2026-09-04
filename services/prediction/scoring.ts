import { EXAM } from '@/config/site';
import { clamp } from '@/lib/utils';

/**
 * Score ↔ rank mapping.
 *
 * NEET PG rank is a function of the whole cohort, which we cannot know in
 * advance. We model the published score→rank distribution as a piecewise curve
 * anchored on historically released marks-vs-rank data, then widen the result
 * into a band. Anchors live in one place so they can be re-fitted each year
 * without touching the engine.
 */

/** [score, approximate all-India rank] anchors, descending by score. */
const SCORE_RANK_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [800, 1],
  [700, 60],
  [650, 250],
  [600, 800],
  [560, 1800],
  [520, 3600],
  [480, 6500],
  [440, 11000],
  [400, 18000],
  [360, 27000],
  [320, 39000],
  [280, 54000],
  [240, 72000],
  [200, 95000],
  [160, 120000],
  [120, 150000],
  [80, 180000],
  [0, 220000],
];

const TOTAL_CANDIDATES = 220_000;

export function computeScore(correct: number, wrong: number): number {
  return correct * EXAM.marksPerCorrect - wrong * EXAM.negativePerWrong;
}

export function computeUnattempted(correct: number, wrong: number): number {
  return Math.max(0, EXAM.totalQuestions - correct - wrong);
}

/**
 * Log-linear interpolation between anchors — rank grows geometrically as score
 * falls, so interpolating in log space tracks the real curve far better than a
 * straight line.
 */
export function scoreToRank(score: number): number {
  const s = clamp(score, 0, EXAM.maxScore);

  for (let i = 0; i < SCORE_RANK_ANCHORS.length - 1; i++) {
    const upper = SCORE_RANK_ANCHORS[i]!;
    const lower = SCORE_RANK_ANCHORS[i + 1]!;
    const [hiScore, hiRank] = upper;
    const [loScore, loRank] = lower;

    if (s <= hiScore && s >= loScore) {
      const span = hiScore - loScore;
      if (span === 0) return hiRank;
      const t = (hiScore - s) / span; // 0 at hiScore → 1 at loScore
      const interpolated = Math.exp(Math.log(hiRank) + t * (Math.log(loRank) - Math.log(hiRank)));
      return Math.round(interpolated);
    }
  }
  return TOTAL_CANDIDATES;
}

export function rankToPercentile(rank: number): number {
  const pct = ((TOTAL_CANDIDATES - rank) / TOTAL_CANDIDATES) * 100;
  return Math.round(clamp(pct, 0, 100) * 100) / 100;
}

/**
 * Widen a point estimate into an honest range.
 *
 * The spread is proportional (higher ranks are far less certain in absolute
 * terms) with a floor so top ranks don't collapse to a false-precision window.
 */
export function rankBand(pointRank: number): { min: number; max: number } {
  const proportional = pointRank <= 1_000 ? 0.35 : pointRank <= 10_000 ? 0.2 : pointRank <= 50_000 ? 0.16 : 0.14;
  const spread = Math.max(150, Math.round(pointRank * proportional));
  return {
    min: Math.max(1, pointRank - Math.round(spread * 0.6)),
    max: pointRank + Math.round(spread * 0.9),
  };
}

/**
 * Confidence never reaches 100 — the product promises an estimate, not a fact.
 * Penalties: implausible attempt counts, extreme scores where anchors are thin,
 * and (added by the engine) sparse cutoff coverage.
 */
export function computeConfidence(params: {
  score: number;
  correct: number;
  wrong: number;
  cutoffCoverage: number; // 0-1: share of relevant cutoff rows we actually hold
}): number {
  const { score, correct, wrong, cutoffCoverage } = params;
  let confidence = 88;

  const attempted = correct + wrong;
  if (attempted > EXAM.totalQuestions) confidence -= 25;
  if (attempted < 60) confidence -= 12; // very low attempts → unstable estimate
  if (score > 680 || score < 120) confidence -= 10; // sparse anchor region

  confidence -= Math.round((1 - clamp(cutoffCoverage, 0, 1)) * 22);

  return clamp(Math.round(confidence), 35, 92);
}
