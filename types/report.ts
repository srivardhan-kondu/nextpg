import type { Category, Gender, Likelihood, PreferredCollegeType, SubCategory } from '@prisma/client';
import type { CollegeOpportunity, BranchRecommendation, StrategyNote } from './prediction';

/** Everything the PDF needs, resolved once so the renderer stays pure. */
export interface ReportData {
  brand: string;
  tagline: string;
  reportId: string;
  generatedAt: string;

  profile: {
    candidateName: string;
    gender: Gender;
    state: string;
    category: Category;
    subCategory: SubCategory;
    preferredType: PreferredCollegeType;
    email?: string | null;
  };

  exam: {
    correctAnswers: number;
    wrongAnswers: number;
    unattempted: number;
    expectedScore: number;
    examYear: number;
  };

  prediction: {
    rankMin: number;
    rankMax: number;
    confidence: number;
    percentile: number;
    aiqOpportunities: number;
    stateOpportunities: number;
    totalOpportunities: number;
  };

  aiqOpportunities: CollegeOpportunity[];
  stateOpportunities: CollegeOpportunity[];
  recommendedBranches: BranchRecommendation[];
  recommendedColleges: CollegeOpportunity[];

  dreamValidations: {
    dreamBranch: string;
    branchProbability: number;
    branchLikelihood: Likelihood;
    branchMessage: string;
    dreamCollege?: string | null;
    collegeLikelihood?: Likelihood | null;
    requiredRankMin?: number | null;
    requiredRankMax?: number | null;
    eligibleQuotas: string[];
    availableBranches: string[];
    collegeMessage?: string | null;
  }[];

  strategy: StrategyNote[];
  notes: string[];
  disclaimer: string;
}
