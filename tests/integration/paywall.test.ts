import { describe, expect, it } from 'vitest';
import {
  buildPredictionView,
  toDisplayRank,
  toPreviewResult,
  toRankBand,
} from '@/services/prediction/prediction.service';
import type { CollegeOpportunity, PredictionResult } from '@/types/prediction';

function seat(name: string, band: 'STRONG' | 'MODERATE' | 'STRETCH'): CollegeOpportunity {
  return {
    collegeId: `c-${name}`,
    collegeName: name,
    collegeType: 'GOVERNMENT',
    state: 'Telangana',
    branchId: 'b-1',
    branchName: 'General Medicine',
    quota: 'AIQ',
    category: 'GENERAL',
    closingRank: 15_000,
    seatCount: 4,
    academicYear: 2024,
    band,
    probability: 70,
  };
}

const fullResult: PredictionResult = {
  rankMin: 12_000,
  rankMax: 16_500,
  confidence: 78,
  percentile: 93.5,
  expectedScore: 440,
  aiqOpportunities: 38,
  stateOpportunities: 64,
  totalOpportunities: 102,
  bands: {
    STRONG: [seat('Gandhi Medical College', 'STRONG'), seat('Osmania Medical College', 'STRONG')],
    MODERATE: [seat('BMCRI', 'MODERATE')],
    STRETCH: [seat('MAMC', 'STRETCH')],
  },
  recommendedBranches: [
    {
      branchName: 'Pathology',
      probability: 88,
      likelihood: 'STRONG',
      seatsInRange: 34,
      bestClosingRank: 26_400,
      rationale: 'Several options closed after your range.',
    },
  ],
  recommendedColleges: [seat('Gandhi Medical College', 'STRONG')],
  strategy: [{ title: 'Lock safety options', body: 'Place three strong options low.', priority: 'high' }],
  notes: ['Predictions are based on historical trends and available data.'],
  engineVersion: 'rule-based-v1',
  providerId: 'rule-based',
  generatedAt: new Date().toISOString(),
};

describe('toPreviewResult', () => {
  it('strips every premium section', () => {
    const preview = toPreviewResult(fullResult);
    expect(preview.bands.STRONG).toEqual([]);
    expect(preview.bands.MODERATE).toEqual([]);
    expect(preview.bands.STRETCH).toEqual([]);
    expect(preview.recommendedBranches).toEqual([]);
    expect(preview.recommendedColleges).toEqual([]);
    expect(preview.strategy).toEqual([]);
  });

  it('bands the rank instead of carrying the precise range', () => {
    // Product decision: the exact range is what a credit buys. The preview
    // proves the engine ran without handing over the number itself.
    const preview = toPreviewResult(fullResult);
    expect(preview.rankMin).toBe(10_000);
    expect(preview.rankMax).toBe(25_000);
  });

  it('keeps the seat counts, which are the free teaser', () => {
    const preview = toPreviewResult(fullResult);
    expect(preview.aiqOpportunities).toBe(38);
    expect(preview.stateOpportunities).toBe(64);
    expect(preview.totalOpportunities).toBe(102);
  });

  it('does not mutate the source payload', () => {
    toPreviewResult(fullResult);
    expect(fullResult.bands.STRONG).toHaveLength(2);
  });
});

describe('buildPredictionView', () => {
  it('redacts a PREVIEW prediction so no college name reaches the client', () => {
    const view = buildPredictionView({
      id: 'pred-1',
      status: 'PREVIEW',
      resultPayload: fullResult as never,
    });

    expect(view.locked).toBe(true);
    expect(JSON.stringify(view.result)).not.toContain('Gandhi Medical College');
    expect(JSON.stringify(view.result)).not.toContain('Pathology');
  });

  it('still exposes counts, so the paywall can show what is behind it', () => {
    const view = buildPredictionView({
      id: 'pred-1',
      status: 'PREVIEW',
      resultPayload: fullResult as never,
    });

    expect(view.teaser.aiqOpportunities).toBe(38);
    expect(view.teaser.stateOpportunities).toBe(64);
    expect(view.teaser.collegeCount).toBe(4);
    expect(view.teaser.branchCount).toBe(1);
  });

  it('returns the full payload once unlocked', () => {
    const view = buildPredictionView({
      id: 'pred-1',
      status: 'UNLOCKED',
      resultPayload: fullResult as never,
    });

    expect(view.locked).toBe(false);
    expect(view.result.bands.STRONG).toHaveLength(2);
    expect(view.result.strategy).toHaveLength(1);
  });
});

describe('toRankBand', () => {
  it('widens a range to the bucket that contains it', () => {
    // Real range 12,000-16,500 must not be recoverable from the band.
    expect(toRankBand(12_000, 16_500)).toEqual({ min: 10_000, max: 25_000 });
  });

  it('always fully contains the true range', () => {
    for (const [lo, hi] of [[1, 50], [900, 1_100], [4_999, 5_001], [148_000, 191_000]]) {
      const band = toRankBand(lo!, hi!);
      expect(band.min).toBeLessThanOrEqual(lo!);
      expect(band.max).toBeGreaterThanOrEqual(hi!);
    }
  });

  it('is strictly wider than the range it hides', () => {
    const band = toRankBand(12_000, 16_500);
    expect(band.max - band.min).toBeGreaterThan(16_500 - 12_000);
  });

  it('handles a top rank without collapsing to the exact value', () => {
    const band = toRankBand(142, 300);
    expect(band).toEqual({ min: 1, max: 1_000 });
  });
});

describe('toDisplayRank', () => {
  it('bands a locked prediction', () => {
    expect(toDisplayRank({ status: 'PREVIEW', rankMin: 12_000, rankMax: 16_500 })).toEqual({
      min: 10_000,
      max: 25_000,
      banded: true,
    });
  });

  it('shows the true range once unlocked', () => {
    expect(toDisplayRank({ status: 'UNLOCKED', rankMin: 12_000, rankMax: 16_500 })).toEqual({
      min: 12_000,
      max: 16_500,
      banded: false,
    });
  });
});

describe('buildPredictionView headline', () => {
  const row = (status: 'PREVIEW' | 'UNLOCKED') => ({
    id: 'p1',
    status,
    resultPayload: fullResult as never,
  });

  it('withholds the exact rank, confidence and percentile while locked', () => {
    const view = buildPredictionView(row('PREVIEW'));

    expect(view.headline.banded).toBe(true);
    expect(view.headline.confidence).toBeNull();
    expect(view.headline.percentile).toBeNull();
    expect(view.headline.rankMin).not.toBe(fullResult.rankMin);
    expect(view.headline.rankMax).not.toBe(fullResult.rankMax);
  });

  it('keeps the seat counts, which are the teaser', () => {
    const view = buildPredictionView(row('PREVIEW'));
    expect(view.teaser.totalOpportunities).toBe(fullResult.totalOpportunities);
    expect(view.teaser.aiqOpportunities).toBe(fullResult.aiqOpportunities);
  });

  it('reveals everything once unlocked', () => {
    const view = buildPredictionView(row('UNLOCKED'));
    expect(view.headline).toMatchObject({
      rankMin: fullResult.rankMin,
      rankMax: fullResult.rankMax,
      banded: false,
      confidence: fullResult.confidence,
      percentile: fullResult.percentile,
    });
  });

  it('does not leave the precise rank in the redacted payload', () => {
    const view = buildPredictionView(row('PREVIEW'));
    expect(view.result.rankMin).not.toBe(fullResult.rankMin);
    expect(view.result.rankMax).not.toBe(fullResult.rankMax);
  });
});
