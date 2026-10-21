import { describe, expect, it } from 'vitest';
import {
  RANKED_CANDIDATES, computeConfidence, computeScore, computeUnattempted, officialRankRange,
  rankBand, rankToPercentile, scoreToRank,
} from '@/services/prediction/scoring';
import { EXAM } from '@/config/site';

describe('computeScore', () => {
  it('applies +4 / −1 marking', () => {
    expect(computeScore(100, 50)).toBe(350);
    expect(computeScore(0, 0)).toBe(0);
  });

  it('can go negative when wrong answers dominate', () => {
    expect(computeScore(0, 40)).toBe(-40);
  });

  it('caps out at the maximum score for a perfect paper', () => {
    expect(computeScore(EXAM.totalQuestions, 0)).toBe(EXAM.maxScore);
  });
});

describe('computeUnattempted', () => {
  it('is the remainder of the paper', () => {
    expect(computeUnattempted(100, 50)).toBe(EXAM.totalQuestions - 150);
  });

  it('never goes negative on impossible input', () => {
    expect(computeUnattempted(150, 100)).toBe(0);
  });
});

describe('exam pattern', () => {
  it('uses the 2026 pattern: 180 questions, 720 marks', () => {
    expect(EXAM.totalQuestions).toBe(180);
    expect(EXAM.maxScore).toBe(720);
  });
});

describe('scoreToRank', () => {
  it('is monotonically decreasing — a better score never gives a worse rank', () => {
    const scores = [641, 600, 500, 400, 300, 200, 100, 0, -59];
    const ranks = scores.map(scoreToRank);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]!).toBeGreaterThan(ranks[i - 1]!);
    }
  });

  it('returns rank 1 for the top score and anything above it', () => {
    expect(scoreToRank(641)).toBe(1);
    expect(scoreToRank(EXAM.maxScore)).toBe(1);
  });

  // Spot checks against NBEMS's published NEET PG 2026 result.
  it.each([
    [600, 101, 114],
    [560, 1_535, 1_647],
    [500, 11_828, 12_111],
    [450, 28_677, 29_130],
    [400, 51_152, 51_729],
    [300, 107_551, 108_332],
    [200, 178_857, 179_840],
  ])('matches the official result: %i marks → rank %i–%i', (score, best, worst) => {
    const rank = scoreToRank(score);
    expect(rank).toBeGreaterThanOrEqual(best);
    expect(rank).toBeLessThanOrEqual(worst);
    expect(officialRankRange(score)).toEqual({ best, worst });
  });

  it('places a score nobody achieved just after everyone who scored higher', () => {
    // 641 → rank 1 and 633 → rank 2; nobody scored 635.
    expect(officialRankRange(635)).toBeNull();
    expect(scoreToRank(635)).toBe(2);
  });

  it('clamps out-of-range input instead of extrapolating wildly', () => {
    expect(scoreToRank(-500)).toBe(RANKED_CANDIDATES);
    expect(scoreToRank(9999)).toBe(1);
  });
});

describe('rankBand', () => {
  it('always contains the point estimate', () => {
    for (const rank of [1, 500, 5_000, 25_000, 120_000]) {
      const band = rankBand(rank);
      expect(band.min).toBeLessThanOrEqual(rank);
      expect(band.max).toBeGreaterThanOrEqual(rank);
    }
  });

  it('never produces a rank below 1', () => {
    expect(rankBand(2).min).toBeGreaterThanOrEqual(1);
  });

  it('never runs past the last rank anyone received', () => {
    expect(rankBand(RANKED_CANDIDATES).max).toBe(RANKED_CANDIDATES);
    expect(rankBand(RANKED_CANDIDATES - 10).max).toBeLessThanOrEqual(RANKED_CANDIDATES);
  });

  it('widens in absolute terms as rank grows', () => {
    const tight = rankBand(1_000);
    const loose = rankBand(100_000);
    expect(loose.max - loose.min).toBeGreaterThan(tight.max - tight.min);
  });
});

describe('rankToPercentile', () => {
  it('puts rank 1 near the top', () => {
    expect(rankToPercentile(1)).toBeGreaterThan(99.9);
  });

  it('stays within 0-100', () => {
    expect(rankToPercentile(10_000_000)).toBe(0);
    expect(rankToPercentile(0)).toBeLessThanOrEqual(100);
  });
});

describe('computeConfidence', () => {
  const base = { score: 400, correct: 120, wrong: 40, cutoffCoverage: 1 };

  it('never claims certainty', () => {
    expect(computeConfidence(base)).toBeLessThanOrEqual(92);
  });

  it('never collapses below the stated floor', () => {
    const worst = computeConfidence({ score: 700, correct: 179, wrong: 90, cutoffCoverage: 0 });
    expect(worst).toBeGreaterThanOrEqual(35);
  });

  it('drops when cutoff coverage is thin', () => {
    const full = computeConfidence(base);
    const sparse = computeConfidence({ ...base, cutoffCoverage: 0 });
    expect(sparse).toBeLessThan(full);
  });

  it('penalises an implausible attempt count', () => {
    const normal = computeConfidence(base);
    const impossible = computeConfidence({ ...base, correct: 160, wrong: 40 });
    expect(impossible).toBeLessThan(normal);
  });
});
