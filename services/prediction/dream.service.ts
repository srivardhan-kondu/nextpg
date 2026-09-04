import type { Likelihood } from '@prisma/client';
import { cutoffRepository } from '@/repositories/cutoff.repository';
import { collegeRepository } from '@/repositories/college.repository';
import { resolveEligibleQuotas } from '@/services/prediction/quota.service';
import { LATEST_CUTOFF_YEAR, PREDICTION_DISCLAIMER } from '@/config/site';
import { QUOTA_LABEL } from '@/lib/constants';
import { clamp, formatRank, formatRankRange } from '@/lib/utils';
import type {
  DreamBranchResult,
  DreamCollegeResult,
  DreamValidationInput,
  DreamValidationResult,
} from '@/types/prediction';

function toLikelihood(probability: number): Likelihood {
  if (probability >= 70) return 'STRONG';
  if (probability >= 45) return 'MODERATE';
  if (probability >= 20) return 'STRETCH';
  return 'VERY_DIFFICULT';
}

function probabilityAgainst(closingRank: number, rankMin: number, rankMax: number): number {
  const width = Math.max(1, rankMax - rankMin);
  const raw = (closingRank - rankMin) / width;
  return Math.round(clamp(raw * 0.86 + 0.07, 0.02, 0.96) * 100);
}

/**
 * Validates a dream branch and (optionally) a dream college against the
 * student's estimated rank window. Every statement is grounded in a stored
 * cutoff row — when we have no data we say so instead of guessing.
 */
export async function validateDream(input: DreamValidationInput): Promise<DreamValidationResult> {
  const { rankMin, rankMax, category, subCategory, state, dreamBranch } = input;

  const eligibility = await resolveEligibleQuotas({ state, category, subCategory });

  // ── Branch validation ────────────────────────────────────────────────
  const branchRows = await cutoffRepository.findForBranch({
    branchName: dreamBranch,
    category,
    state,
    quotas: eligibility.quotas,
    academicYear: LATEST_CUTOFF_YEAR,
  });

  let branch: DreamBranchResult;

  if (branchRows.length === 0) {
    branch = {
      branch: dreamBranch,
      probability: 0,
      likelihood: 'VERY_DIFFICULT',
      message: `We do not hold ${LATEST_CUTOFF_YEAR} cutoff data for ${dreamBranch} in the quotas you are eligible for. This is a gap in our data, not proof that no seat exists — check the official seat matrix.`,
      seatsInRange: 0,
      bestClosingRank: null,
    };
  } else {
    // The most forgiving seat (highest closing rank) sets the ceiling of what's
    // reachable for this branch.
    const bestClosingRank = Math.max(...branchRows.map((r) => r.closingRank));
    const reachable = branchRows.filter((r) => r.closingRank >= rankMin);
    const seatsInRange = reachable.reduce((sum, r) => sum + Math.max(1, r.seatCount), 0);
    const probability = probabilityAgainst(bestClosingRank, rankMin, rankMax);
    const likelihood = toLikelihood(probability);

    const messages: Record<Likelihood, string> = {
      STRONG: `You have a strong chance of getting ${dreamBranch} based on your estimated rank. ${seatsInRange} seat${seatsInRange === 1 ? '' : 's'} closed within reach in ${LATEST_CUTOFF_YEAR}.`,
      MODERATE: `You have a moderate chance of getting ${dreamBranch} based on your estimated rank. Consider keeping backup options.`,
      STRETCH: `${dreamBranch} is a stretch at your estimated rank. It closed around ${formatRank(bestClosingRank)} in ${LATEST_CUTOFF_YEAR} — possible in later rounds, but plan alternatives.`,
      VERY_DIFFICULT: `${dreamBranch} is very difficult at your estimated rank. Its most forgiving seat closed near ${formatRank(bestClosingRank)} in ${LATEST_CUTOFF_YEAR}, ahead of your range.`,
    };

    branch = {
      branch: dreamBranch,
      probability,
      likelihood,
      message: messages[likelihood],
      seatsInRange,
      bestClosingRank,
    };
  }

  // ── College validation ───────────────────────────────────────────────
  let college: DreamCollegeResult | null = null;
  const collegeRecord = input.dreamCollegeId
    ? await collegeRepository.byId(input.dreamCollegeId)
    : input.dreamCollegeName
      ? await collegeRepository.byName(input.dreamCollegeName)
      : null;

  if (collegeRecord) {
    const rows = await cutoffRepository.findForCollege(collegeRecord.id, category, LATEST_CUTOFF_YEAR);
    const eligibleRows = rows.filter(
      (r) => eligibility.quotas.includes(r.quota) && (r.quota !== 'STATE' || collegeRecord.state === state),
    );

    if (eligibleRows.length === 0) {
      college = {
        collegeId: collegeRecord.id,
        collegeName: collegeRecord.name,
        collegeType: collegeRecord.type,
        state: collegeRecord.state,
        likelihood: 'VERY_DIFFICULT',
        probability: 0,
        requiredRankMin: null,
        requiredRankMax: null,
        studentRankMin: rankMin,
        studentRankMax: rankMax,
        eligibleQuotas: [],
        availableBranches: [],
        message:
          collegeRecord.state !== state
            ? `${collegeRecord.name} is in ${collegeRecord.state}. Its state quota seats need ${collegeRecord.state} domicile, and we hold no all-India cutoff rows for your category here.`
            : `We hold no ${LATEST_CUTOFF_YEAR} cutoff rows for ${collegeRecord.name} in your category and quotas.`,
      };
    } else {
      const requiredRankMin = Math.min(...eligibleRows.map((r) => r.closingRank));
      const requiredRankMax = Math.max(...eligibleRows.map((r) => r.closingRank));
      const probability = probabilityAgainst(requiredRankMax, rankMin, rankMax);
      const likelihood = toLikelihood(probability);

      const quotas = [...new Set(eligibleRows.map((r) => r.quota))];
      const branches = [...new Set(eligibleRows.map((r) => r.branch.name))];

      // Does the dream branch specifically exist here, and can they reach it?
      const dreamBranchRow = eligibleRows
        .filter((r) => r.branch.name.toLowerCase() === dreamBranch.toLowerCase())
        .sort((a, b) => b.closingRank - a.closingRank)[0];

      const branchClause = dreamBranchRow
        ? ` ${dreamBranch} here closed at ${formatRank(dreamBranchRow.closingRank)} in ${LATEST_CUTOFF_YEAR}.`
        : ` ${dreamBranch} is not in our ${LATEST_CUTOFF_YEAR} records for this college in your category.`;

      const base: Record<Likelihood, string> = {
        STRONG: `${collegeRecord.name} is well within your estimated range.`,
        MODERATE: `${collegeRecord.name} is achievable but not guaranteed at your estimated rank.`,
        STRETCH: `${collegeRecord.name} is a stretch — its seats closed near the top of your range.`,
        VERY_DIFFICULT: `${collegeRecord.name} is very difficult at your estimated rank.`,
      };

      college = {
        collegeId: collegeRecord.id,
        collegeName: collegeRecord.name,
        collegeType: collegeRecord.type,
        state: collegeRecord.state,
        likelihood,
        probability,
        requiredRankMin,
        requiredRankMax,
        studentRankMin: rankMin,
        studentRankMax: rankMax,
        eligibleQuotas: quotas.map((q) => QUOTA_LABEL[q]),
        availableBranches: branches.sort(),
        message:
          `${base[likelihood]} Seats here closed between ${formatRankRange(requiredRankMin, requiredRankMax)} against your ${formatRankRange(rankMin, rankMax)}.` +
          branchClause,
      };
    }
  }

  return { branch, college, disclaimer: PREDICTION_DISCLAIMER };
}
