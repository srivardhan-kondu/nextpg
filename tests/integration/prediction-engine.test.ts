import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CutoffWithRefs } from '@/repositories/cutoff.repository';
import type { PredictionInput } from '@/types/prediction';

// The engine is pure logic over repository output, so the data layer is mocked.
// These tests are about banding, probability and honesty guarantees.
vi.mock('@/repositories/cutoff.repository', () => ({
  cutoffRepository: {
    findOpportunities: vi.fn(),
    coverage: vi.fn(),
    findForCollege: vi.fn(),
    findForBranch: vi.fn(),
  },
}));

vi.mock('@/services/prediction/quota.service', () => ({
  resolveEligibleQuotas: vi.fn(async () => ({
    quotas: ['AIQ', 'STATE', 'DEEMED'],
    aiqQuotas: ['AIQ'],
    stateQuotas: ['STATE', 'DEEMED'],
    notes: ['State quota seats are matched against your Telangana domicile.'],
  })),
}));

const { cutoffRepository } = await import('@/repositories/cutoff.repository');
const { RuleBasedPredictionProvider } = await import('@/services/prediction/providers/rule-based.provider');

function cutoff({
  closingRank,
  ...overrides
}: Partial<CutoffWithRefs> & { closingRank: number; quota?: string }): CutoffWithRefs {
  const id = `row-${closingRank}-${overrides.quota ?? 'AIQ'}`;
  return {
    id,
    collegeId: `college-${closingRank}`,
    branchId: 'branch-1',
    quota: 'AIQ',
    category: 'GENERAL',
    subCategory: 'NONE',
    closingRank,
    openingRank: null,
    closingScore: null,
    seatCount: 5,
    round: 1,
    academicYear: 2024,
    state: 'Telangana',
    source: 'test',
    verifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    college: {
      id: `college-${closingRank}`,
      name: `Test College ${closingRank}`,
      shortName: null,
      slug: `test-${closingRank}`,
      state: 'Telangana',
      city: 'Hyderabad',
      type: 'GOVERNMENT',
      tags: [],
      university: null,
      establishedYear: null,
      website: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    branch: {
      id: 'branch-1',
      name: 'General Medicine',
      slug: 'general-medicine',
      code: 'MD-GM',
      degree: 'MD',
      isClinical: true,
      popularity: 96,
      description: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    ...overrides,
  } as CutoffWithRefs;
}

const input: PredictionInput = {
  candidateName: 'Test Candidate',
  gender: 'FEMALE',
  state: 'Telangana',
  category: 'GENERAL',
  subCategory: 'NONE',
  correctAnswers: 120,
  wrongAnswers: 40,
  expectedScore: 440,
  preferredType: 'ANY',
  examYear: 2025,
};

describe('RuleBasedPredictionProvider', () => {
  beforeEach(() => {
    vi.mocked(cutoffRepository.coverage).mockResolvedValue(1);
    vi.mocked(cutoffRepository.findOpportunities).mockResolvedValue([]);
  });

  it('always returns a range, never a single rank', async () => {
    const result = await new RuleBasedPredictionProvider().predict(input);
    expect(result.rankMax).toBeGreaterThan(result.rankMin);
    expect(result.rankMin).toBeGreaterThanOrEqual(1);
  });

  it('never reports full confidence', async () => {
    const result = await new RuleBasedPredictionProvider().predict(input);
    expect(result.confidence).toBeLessThan(100);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('always carries the prediction disclaimer in its notes', async () => {
    const result = await new RuleBasedPredictionProvider().predict(input);
    expect(result.notes.some((n) => n.includes('may vary'))).toBe(true);
  });

  it('returns empty bands rather than inventing colleges when there is no data', async () => {
    const result = await new RuleBasedPredictionProvider().predict(input);
    expect(result.totalOpportunities).toBe(0);
    expect(result.bands.STRONG).toEqual([]);
    expect(result.recommendedColleges).toEqual([]);
  });

  it('bands seats by how they sit against the rank window', async () => {
    const provider = new RuleBasedPredictionProvider();
    const probe = await provider.predict(input);
    const { rankMin, rankMax } = probe;

    vi.mocked(cutoffRepository.findOpportunities).mockResolvedValue([
      cutoff({ closingRank: Math.round(rankMax * 2) }),      // comfortably after → strong
      cutoff({ closingRank: Math.round(rankMin * 1.02) }),   // inside the window → moderate
      cutoff({ closingRank: Math.round(rankMin * 0.4) }),    // closed well before → stretch
    ]);

    const result = await provider.predict(input);
    expect(result.bands.STRONG).toHaveLength(1);
    expect(result.bands.MODERATE).toHaveLength(1);
    expect(result.bands.STRETCH).toHaveLength(1);
  });

  it('keeps probability strictly between 0 and 100 — no certainty either way', async () => {
    const provider = new RuleBasedPredictionProvider();
    const probe = await provider.predict(input);

    vi.mocked(cutoffRepository.findOpportunities).mockResolvedValue([
      cutoff({ closingRank: probe.rankMax * 50 }),
      cutoff({ closingRank: 1 }),
    ]);

    const result = await provider.predict(input);
    const all = [...result.bands.STRONG, ...result.bands.MODERATE, ...result.bands.STRETCH];
    for (const seat of all) {
      expect(seat.probability).toBeGreaterThan(0);
      expect(seat.probability).toBeLessThan(100);
    }
  });

  it('separates AIQ from state quota counts', async () => {
    const provider = new RuleBasedPredictionProvider();
    const probe = await provider.predict(input);

    vi.mocked(cutoffRepository.findOpportunities).mockResolvedValue([
      cutoff({ closingRank: probe.rankMax * 2, quota: 'AIQ' }),
      cutoff({ closingRank: probe.rankMax * 2.1, quota: 'STATE' }),
      cutoff({ closingRank: probe.rankMax * 2.2, quota: 'DEEMED' }),
    ]);

    const result = await provider.predict(input);
    expect(result.aiqOpportunities).toBe(1);
    expect(result.stateOpportunities).toBe(2);
    expect(result.totalOpportunities).toBe(3);
  });

  it('lowers confidence when cutoff coverage is thin, and says so', async () => {
    const provider = new RuleBasedPredictionProvider();
    const full = await provider.predict(input);

    vi.mocked(cutoffRepository.coverage).mockResolvedValue(0.1);
    const sparse = await provider.predict(input);

    expect(sparse.confidence).toBeLessThan(full.confidence);
    expect(sparse.notes.some((n) => n.includes('coverage'))).toBe(true);
  });

  it('stamps the engine version so a report is reproducible', async () => {
    const result = await new RuleBasedPredictionProvider().predict(input);
    expect(result.providerId).toBe('rule-based');
    expect(result.engineVersion).toBe('rule-based-v1');
    expect(new Date(result.generatedAt).toString()).not.toBe('Invalid Date');
  });

  it('falls back to computing the score when none is supplied', async () => {
    const result = await new RuleBasedPredictionProvider().predict({ ...input, expectedScore: 0 });
    expect(result.expectedScore).toBe(120 * 4 - 40); // +4 / −1 marking
  });
});

describe('provider registry', () => {
  it('falls back to the rule-based engine for an unknown provider id', async () => {
    const { getPredictionProvider } = await import('@/services/prediction');
    expect(getPredictionProvider('does-not-exist').id).toBe('rule-based');
  });

  it('resolves the scaffolded providers without breaking the contract', async () => {
    const { getPredictionProvider } = await import('@/services/prediction');
    for (const id of ['rule-based', 'historical', 'ml']) {
      const provider = getPredictionProvider(id);
      expect(provider.id).toBe(id);
      expect(typeof provider.predict).toBe('function');
    }
  });
});
