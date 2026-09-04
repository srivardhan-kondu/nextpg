import { describe, expect, it } from 'vitest';
import {
  computeConfidence, computeScore, computeUnattempted, rankBand, rankToPercentile, scoreToRank,
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
    expect(computeUnattempted(100, 50)).toBe(50);
  });

  it('never goes negative on impossible input', () => {
    expect(computeUnattempted(150, 100)).toBe(0);
  });
});

describe('scoreToRank', () => {
  it('is monotonically decreasing — a better score never gives a worse rank', () => {
    const scores = [800, 700, 600, 500, 400, 300, 200, 100, 0];
    const ranks = scores.map(scoreToRank);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]!).toBeGreaterThan(ranks[i - 1]!);
    }
  });

  it('returns rank 1 for a perfect score', () => {
    expect(scoreToRank(800)).toBe(1);
  });

  it('interpolates between anchors rather than snapping to them', () => {
    const rank = scoreToRank(420); // between the 440 and 400 anchors
    expect(rank).toBeGreaterThan(scoreToRank(440));
    expect(rank).toBeLessThan(scoreToRank(400));
  });

  it('clamps out-of-range input instead of extrapolating wildly', () => {
    expect(scoreToRank(-500)).toBe(scoreToRank(0));
    expect(scoreToRank(9999)).toBe(scoreToRank(800));
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
    const worst = computeConfidence({ score: 780, correct: 199, wrong: 90, cutoffCoverage: 0 });
    expect(worst).toBeGreaterThanOrEqual(35);
  });

  it('drops when cutoff coverage is thin', () => {
    const full = computeConfidence(base);
    const sparse = computeConfidence({ ...base, cutoffCoverage: 0 });
    expect(sparse).toBeLessThan(full);
  });

  it('penalises an implausible attempt count', () => {
    const normal = computeConfidence(base);
    const impossible = computeConfidence({ ...base, correct: 190, wrong: 50 });
    expect(impossible).toBeLessThan(normal);
  });
});
