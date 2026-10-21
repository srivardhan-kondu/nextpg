import { EXAM } from '@/config/site';
import { clamp } from '@/lib/utils';
import { SCORE_RANK_2026 } from '@/services/prediction/data/score-rank-2026';

/**
 * Score ↔ rank mapping.
 *
 * Ranks come from NBEMS's official NEET PG 2026 result, which lists every
 * candidate's score and rank. For each score someone achieved, the table holds
 * the best and worst rank given for it (ties are broken by NBEMS's rules), so
 * the lookup is exact rather than fitted. Regenerate the table each year with
 * scripts/build-score-rank-table.ts.
 *
 * This replaced a hand-fitted curve on the old 800-mark scale. NEET PG 2026
 * moved to 180 questions (720 marks), and that curve put most candidates 2–3×
 * ahead of their real rank.
 */
const TABLE = SCORE_RANK_2026;
const ROWS = TABLE.rows; // descending by score
const TOP = ROWS[0]!;
const BOTTOM = ROWS[ROWS.length - 1]!;
const BY_SCORE = new Map(ROWS.map(([score, best, worst]) => [score, { best, worst }]));

/** Candidates ranked in the official result — the denominator for percentiles. */
export const RANKED_CANDIDATES = TABLE.rankedCandidates;

/** The year the score → rank table describes. */
export const SCORE_RANK_YEAR = TABLE.year;

export function computeScore(correct: number, wrong: number): number {
  return correct * EXAM.marksPerCorrect - wrong * EXAM.negativePerWrong;
}

export function computeUnattempted(correct: number, wrong: number): number {
  return Math.max(0, EXAM.totalQuestions - correct - wrong);
}

/**
 * The official rank range for exactly this score, or null when no candidate
 * scored it (or it lies outside the range anyone achieved).
 */
export function officialRankRange(score: number): { best: number; worst: number } | null {
  return BY_SCORE.get(Math.round(score)) ?? null;
}

/**
 * Point rank for a score.
 *
 * An achieved score maps to the middle of its official tie range. A score no
 * one achieved maps to the rank just after everyone who scored higher — which
 * is exactly where such a candidate would have been placed.
 */
export function scoreToRank(score: number): number {
  const s = Math.round(score);
  if (s >= TOP[0]) return TOP[1];
  if (s <= BOTTOM[0]) return BOTTOM[2];

  const exact = BY_SCORE.get(s);
  if (exact) return Math.round((exact.best + exact.worst) / 2);

  // Rows are descending, so the last row scoring above s holds the worst rank
  // any higher scorer received.
  let worstAbove = TOP[2];
  for (const [rowScore, , worst] of ROWS) {
    if (rowScore < s) break;
    worstAbove = worst;
  }
  return worstAbove + 1;
}

export function rankToPercentile(rank: number): number {
  const pct = ((RANKED_CANDIDATES - rank) / RANKED_CANDIDATES) * 100;
  return Math.round(clamp(pct, 0, 100) * 100) / 100;
}

/**
 * Widen the point rank into the matching window.
 *
 * The rank itself is known precisely; the window stands for what is not:
 * closing ranks move from one year to the next, so a seat that closed just
 * past your rank last year may not this year. The spread is proportional
 * (cutoffs drift more in absolute terms further down the list) with a floor so
 * top ranks don't collapse to a false-precision window.
 */
export function rankBand(pointRank: number): { min: number; max: number } {
  const proportional = pointRank <= 1_000 ? 0.35 : pointRank <= 10_000 ? 0.2 : pointRank <= 50_000 ? 0.16 : 0.14;
  const spread = Math.max(150, Math.round(pointRank * proportional));
  return {
    min: Math.max(1, pointRank - Math.round(spread * 0.6)),
    // Never past the last rank anyone received.
    max: Math.min(RANKED_CANDIDATES, Math.max(pointRank, pointRank + Math.round(spread * 0.9))),
  };
}

/**
 * Confidence never reaches 100 — the product promises an estimate, not a fact.
 * Penalties: implausible attempt counts, a score outside anything achieved in
 * the official result, and (added by the engine) sparse cutoff coverage.
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
  if (score > TOP[0] || score < BOTTOM[0]) confidence -= 10; // beyond any real result

  confidence -= Math.round((1 - clamp(cutoffCoverage, 0, 1)) * 22);

  return clamp(Math.round(confidence), 35, 92);
}
