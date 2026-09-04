import type { Category, PreferredCollegeType, Prisma, QuotaType, SubCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { LATEST_CUTOFF_YEAR } from '@/config/site';

export interface CutoffQuery {
  category: Category;
  subCategory?: SubCategory;
  state: string;
  quotas: QuotaType[];
  preferredType: PreferredCollegeType;
  /** Only rows whose closingRank falls at or below this bound are relevant. */
  maxClosingRank: number;
  academicYear?: number;
  take?: number;
}

export type CutoffWithRefs = Prisma.HistoricalCutoffGetPayload<{
  include: { college: true; branch: true };
}>;

function collegeTypeFilter(preferred: PreferredCollegeType): Prisma.CollegeWhereInput {
  if (preferred === 'ANY') return {};
  return { type: preferred };
}

export const cutoffRepository = {
  /**
   * Candidate opportunities: every cutoff row the student could plausibly reach.
   * Quota eligibility is decided upstream (quota service) and passed in.
   */
  async findOpportunities(query: CutoffQuery): Promise<CutoffWithRefs[]> {
    const {
      category,
      state,
      quotas,
      preferredType,
      maxClosingRank,
      academicYear = LATEST_CUTOFF_YEAR,
      take = 400,
    } = query;

    return prisma.historicalCutoff.findMany({
      where: {
        academicYear,
        category,
        quota: { in: quotas },
        closingRank: { lte: maxClosingRank },
        college: { isActive: true, ...collegeTypeFilter(preferredType) },
        branch: { isActive: true },
        // State quota rows are only usable in the candidate's own domicile state.
        OR: [{ quota: { not: 'STATE' } }, { quota: 'STATE', state }],
      },
      include: { college: true, branch: true },
      orderBy: [{ closingRank: 'asc' }],
      take,
    });
  },

  async findForCollege(collegeId: string, category: Category, academicYear = LATEST_CUTOFF_YEAR) {
    return prisma.historicalCutoff.findMany({
      where: { collegeId, category, academicYear },
      include: { branch: true, college: true },
      orderBy: { closingRank: 'asc' },
    });
  },

  async findForBranch(params: {
    branchName: string;
    category: Category;
    state: string;
    quotas: QuotaType[];
    academicYear?: number;
  }) {
    const { branchName, category, state, quotas, academicYear = LATEST_CUTOFF_YEAR } = params;
    return prisma.historicalCutoff.findMany({
      where: {
        academicYear,
        category,
        quota: { in: quotas },
        branch: { name: branchName, isActive: true },
        college: { isActive: true },
        OR: [{ quota: { not: 'STATE' } }, { quota: 'STATE', state }],
      },
      include: { college: true, branch: true },
      orderBy: { closingRank: 'asc' },
    });
  },

  /**
   * Data-coverage signal for the confidence score: how many cutoff rows exist
   * for this category/year at all. Thin data must lower stated confidence.
   */
  async coverage(category: Category, academicYear = LATEST_CUTOFF_YEAR): Promise<number> {
    const [rows, total] = await Promise.all([
      prisma.historicalCutoff.count({ where: { category, academicYear } }),
      prisma.historicalCutoff.count({ where: { academicYear } }),
    ]);
    if (total === 0) return 0;
    // Saturates at ~1500 rows for a category — enough to speak with confidence.
    return Math.min(1, rows / 1500);
  },
};
