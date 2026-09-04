import { describe, expect, it } from 'vitest';
import { buildPredictionView, toPreviewResult } from '@/services/prediction/prediction.service';
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

  it('keeps the free headline: rank range, confidence and counts', () => {
    const preview = toPreviewResult(fullResult);
    expect(preview.rankMin).toBe(12_000);
    expect(preview.rankMax).toBe(16_500);
    expect(preview.confidence).toBe(78);
    expect(preview.aiqOpportunities).toBe(38);
    expect(preview.stateOpportunities).toBe(64);
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
