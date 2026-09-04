import type { Likelihood } from '@prisma/client';
import { cutoffRepository, type CutoffWithRefs } from '@/repositories/cutoff.repository';
import { resolveEligibleQuotas } from '@/services/prediction/quota.service';
import {
  computeConfidence,
  computeScore,
  rankBand,
  rankToPercentile,
  scoreToRank,
} from '@/services/prediction/scoring';
import type {
  Band,
  BranchRecommendation,
  CollegeOpportunity,
  PredictionInput,
  PredictionProvider,
  PredictionResult,
  StrategyNote,
} from '@/types/prediction';
import { LATEST_CUTOFF_YEAR, PREDICTION_DISCLAIMER } from '@/config/site';
import { clamp, formatRank } from '@/lib/utils';

/**
 * Rule-based engine (v1) — the shipping default.
 *
 * It is deliberately explainable: rank comes from the score curve, and every
 * college shown is backed by a real historical_cutoffs row. Nothing is invented.
 */

/**
 * Band assignment compares a seat's closing rank against the student's window.
 * A seat that closed *well after* your worst-case rank is safe; one that closed
 * before your best-case rank is a stretch.
 */
function assignBand(closingRank: number, rankMin: number, rankMax: number): Band {
  if (closingRank >= rankMax * 1.12) return 'STRONG';
  if (closingRank >= rankMin * 0.92) return 'MODERATE';
  return 'STRETCH';
}

/**
 * Probability that a rank window clears a given closing rank.
 * Models the rank as uniform across [rankMin, rankMax]: the share of that window
 * sitting at or below the closing rank is the hit probability, then softened at
 * the edges because cutoffs themselves drift year to year.
 */
function seatProbability(closingRank: number, rankMin: number, rankMax: number): number {
  const width = Math.max(1, rankMax - rankMin);
  const raw = (closingRank - rankMin) / width;
  const drifted = raw * 0.86 + 0.07; // cutoff drift cushion
  return Math.round(clamp(drifted, 0.02, 0.96) * 100);
}

function toLikelihood(probability: number): Likelihood {
  if (probability >= 70) return 'STRONG';
  if (probability >= 45) return 'MODERATE';
  if (probability >= 20) return 'STRETCH';
  return 'VERY_DIFFICULT';
}

function toOpportunity(row: CutoffWithRefs, rankMin: number, rankMax: number): CollegeOpportunity {
  return {
    collegeId: row.collegeId,
    collegeName: row.college.name,
    collegeType: row.college.type,
    state: row.college.state,
    branchId: row.branchId,
    branchName: row.branch.name,
    quota: row.quota,
    category: row.category,
    closingRank: row.closingRank,
    seatCount: row.seatCount,
    academicYear: row.academicYear,
    band: assignBand(row.closingRank, rankMin, rankMax),
    probability: seatProbability(row.closingRank, rankMin, rankMax),
  };
}

function buildBranchRecommendations(
  opportunities: CollegeOpportunity[],
): BranchRecommendation[] {
  const byBranch = new Map<string, CollegeOpportunity[]>();
  for (const opp of opportunities) {
    const list = byBranch.get(opp.branchName) ?? [];
    list.push(opp);
    byBranch.set(opp.branchName, list);
  }

  const recommendations: BranchRecommendation[] = [];
  for (const [branchName, list] of byBranch) {
    const seatsInRange = list.reduce((sum, o) => sum + Math.max(1, o.seatCount), 0);
    // Best realistic shot at this branch drives the headline probability.
    const probability = Math.max(...list.map((o) => o.probability));
    const bestClosingRank = Math.max(...list.map((o) => o.closingRank));
    const strongCount = list.filter((o) => o.band === 'STRONG').length;

    recommendations.push({
      branchName,
      probability,
      likelihood: toLikelihood(probability),
      seatsInRange,
      bestClosingRank,
      rationale:
        strongCount > 0
          ? `${strongCount} seat option${strongCount > 1 ? 's' : ''} closed at or after your expected range in ${LATEST_CUTOFF_YEAR}.`
          : `Options exist but closed near or before your best-case rank in ${LATEST_CUTOFF_YEAR}.`,
    });
  }

  return recommendations.sort((a, b) => b.probability - a.probability || b.seatsInRange - a.seatsInRange);
}

function buildStrategy(params: {
  rankMin: number;
  rankMax: number;
  bands: Record<Band, CollegeOpportunity[]>;
  aiqCount: number;
  stateCount: number;
  state: string;
}): StrategyNote[] {
  const { rankMin, rankMax, bands, aiqCount, stateCount, state } = params;
  const notes: StrategyNote[] = [];

  notes.push({
    title: 'Lock your safety options first',
    body:
      bands.STRONG.length > 0
        ? `You have ${bands.STRONG.length} strong option${bands.STRONG.length > 1 ? 's' : ''}. Place at least three of them low in your preference list so you are not left without a seat in the final round.`
        : 'No strong options surfaced at this rank. Widen your college type preference or consider non-clinical and DNB seats as a safety net.',
    priority: 'high',
  });

  if (aiqCount > 0 && stateCount > 0) {
    notes.push({
      title: 'Run AIQ and state counseling in parallel',
      body: `You have ${aiqCount} AIQ and ${stateCount} ${state} state quota opportunities. Register for both — AIQ rounds run first, and a state seat is a useful fallback if you free-exit AIQ.`,
      priority: 'high',
    });
  } else if (stateCount > 0) {
    notes.push({
      title: 'State quota is your main route',
      body: `Most of your realistic options are in ${state} state quota. Track the state counseling calendar closely and keep your domicile documents ready.`,
      priority: 'high',
    });
  }

  notes.push({
    title: 'Order preferences by ambition, not by safety',
    body: `Counseling software allots the highest preference you qualify for, so putting a stretch college first costs you nothing. Sequence: stretch → moderate → strong. Your working range is ${formatRank(rankMin)}–${formatRank(rankMax)}.`,
    priority: 'medium',
  });

  if (bands.STRETCH.length > 0) {
    notes.push({
      title: 'Watch round 2 and mop-up movement',
      body: `${bands.STRETCH.length} stretch option${bands.STRETCH.length > 1 ? 's' : ''} may open up in later rounds as higher rankers upgrade or drop out. Closing ranks typically loosen after round 1.`,
      priority: 'medium',
    });
  }

  notes.push({
    title: 'Verify every cutoff before you lock a choice',
    body: 'These figures come from published historical data. Confirm the current year’s seat matrix and fee structure on the official counseling portal before committing.',
    priority: 'low',
  });

  return notes;
}

export class RuleBasedPredictionProvider implements PredictionProvider {
  readonly id = 'rule-based';
  readonly version = 'rule-based-v1';
  readonly label = 'Rule-based engine (historical cutoffs)';

  async predict(input: PredictionInput): Promise<PredictionResult> {
    const expectedScore =
      input.expectedScore || computeScore(input.correctAnswers, input.wrongAnswers);

    const pointRank = scoreToRank(expectedScore);
    const { min: rankMin, max: rankMax } = rankBand(pointRank);

    const eligibility = await resolveEligibleQuotas({
      state: input.state,
      category: input.category,
      subCategory: input.subCategory,
      // Key the lookup to the year we actually hold data for, not to the exam
      // calendar. `examYear - 1` only happened to be right while the exam was
      // one year ahead of the data; at EXAM_YEAR 2026 it asks for 2025 rules,
      // finds none, and falls back to the baseline quotas without an error.
      // Today's rules add nothing beyond that baseline, so nothing observable
      // changes — but the first rule that does matter would be silently
      // ignored, and the failure mode is a quieter prediction, not a crash.
      academicYear: LATEST_CUTOFF_YEAR,
    });

    const coverage = await cutoffRepository.coverage(input.category, LATEST_CUTOFF_YEAR);

    // Pull anything that closed up to ~2.2× the worst-case rank so stretch
    // options above the window are still visible.
    const rows = await cutoffRepository.findOpportunities({
      category: input.category,
      subCategory: input.subCategory,
      state: input.state,
      quotas: eligibility.quotas,
      preferredType: input.preferredType,
      maxClosingRank: Math.round(rankMax * 2.2),
      academicYear: LATEST_CUTOFF_YEAR,
      take: 600,
    });

    const opportunities = rows.map((r) => toOpportunity(r, rankMin, rankMax));

    const bands: Record<Band, CollegeOpportunity[]> = {
      STRONG: opportunities.filter((o) => o.band === 'STRONG'),
      MODERATE: opportunities.filter((o) => o.band === 'MODERATE'),
      STRETCH: opportunities.filter((o) => o.band === 'STRETCH'),
    };

    // Sort each band by the most attractive seat first (lowest closing rank =
    // most competitive = most desirable within a band the student can reach).
    for (const key of Object.keys(bands) as Band[]) {
      bands[key].sort((a, b) => a.closingRank - b.closingRank);
    }

    const aiqOpportunities = opportunities.filter((o) => o.quota === 'AIQ').length;
    const stateOpportunities = opportunities.filter((o) => o.quota !== 'AIQ').length;

    const confidence = computeConfidence({
      score: expectedScore,
      correct: input.correctAnswers,
      wrong: input.wrongAnswers,
      cutoffCoverage: coverage,
    });

    const recommendedBranches = buildBranchRecommendations(opportunities).slice(0, 10);

    // Headline college list: best strong options, topped up with moderates.
    const recommendedColleges = [...bands.STRONG.slice(0, 6), ...bands.MODERATE.slice(0, 4)];

    const notes = [
      PREDICTION_DISCLAIMER,
      `Based on ${LATEST_CUTOFF_YEAR} closing ranks for ${input.category} category.`,
      ...eligibility.notes,
    ];
    if (coverage < 0.5) {
      notes.push(
        'Cutoff coverage for your category is still being expanded, which lowers the confidence score above.',
      );
    }

    return {
      rankMin,
      rankMax,
      confidence,
      percentile: rankToPercentile(pointRank),
      expectedScore,
      aiqOpportunities,
      stateOpportunities,
      totalOpportunities: opportunities.length,
      bands,
      recommendedBranches,
      recommendedColleges,
      strategy: buildStrategy({
        rankMin,
        rankMax,
        bands,
        aiqCount: aiqOpportunities,
        stateCount: stateOpportunities,
        state: input.state,
      }),
      notes,
      engineVersion: this.version,
      providerId: this.id,
      generatedAt: new Date().toISOString(),
    };
  }
}
