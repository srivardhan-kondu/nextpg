import type {
  Category,
  CollegeType,
  Likelihood,
  PreferredCollegeType,
  QuotaType,
  SubCategory,
} from '@prisma/client';

export type Band = 'STRONG' | 'MODERATE' | 'STRETCH';

export interface PredictionInput {
  candidateName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  state: string;
  category: Category;
  subCategory: SubCategory;
  correctAnswers: number;
  wrongAnswers: number;
  expectedScore: number;
  preferredType: PreferredCollegeType;
  examYear: number;
}

/** A single college × branch × quota opportunity surfaced to the user. */
export interface CollegeOpportunity {
  collegeId: string;
  collegeName: string;
  collegeType: CollegeType;
  state: string;
  branchId: string;
  branchName: string;
  quota: QuotaType;
  category: Category;
  closingRank: number;
  seatCount: number;
  academicYear: number;
  band: Band;
  /** 0-100 — how likely this seat is, given the rank range. */
  probability: number;
}

export interface BranchRecommendation {
  branchName: string;
  probability: number;
  likelihood: Likelihood;
  seatsInRange: number;
  bestClosingRank: number | null;
  rationale: string;
}

export interface RankBands {
  strong: number;
  moderate: number;
  stretch: number;
}

export interface PredictionResult {
  /** Inclusive estimated rank window. Never a single number — always a range. */
  rankMin: number;
  rankMax: number;
  /** 0-100. Reflects data coverage + score plausibility, never certainty. */
  confidence: number;
  percentile: number;
  expectedScore: number;

  aiqOpportunities: number;
  stateOpportunities: number;
  totalOpportunities: number;

  bands: Record<Band, CollegeOpportunity[]>;
  recommendedBranches: BranchRecommendation[];
  recommendedColleges: CollegeOpportunity[];

  strategy: StrategyNote[];
  notes: string[];

  engineVersion: string;
  providerId: string;
  generatedAt: string;
}

export interface StrategyNote {
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Provider contract. Swapping in an ML or pure-historical engine must never
 * require a change outside services/prediction/providers.
 */
export interface PredictionProvider {
  readonly id: string;
  readonly version: string;
  readonly label: string;
  predict(input: PredictionInput): Promise<PredictionResult>;
}

export interface DreamValidationInput {
  predictionId?: string;
  rankMin: number;
  rankMax: number;
  category: Category;
  subCategory: SubCategory;
  state: string;
  dreamBranch: string;
  dreamCollegeId?: string;
  dreamCollegeName?: string;
}

export interface DreamBranchResult {
  branch: string;
  probability: number;
  likelihood: Likelihood;
  message: string;
  seatsInRange: number;
  bestClosingRank: number | null;
}

export interface DreamCollegeResult {
  collegeId: string;
  collegeName: string;
  collegeType: CollegeType;
  state: string;
  likelihood: Likelihood;
  probability: number;
  requiredRankMin: number | null;
  requiredRankMax: number | null;
  studentRankMin: number;
  studentRankMax: number;
  eligibleQuotas: string[];
  availableBranches: string[];
  message: string;
}

export interface DreamValidationResult {
  branch: DreamBranchResult;
  college: DreamCollegeResult | null;
  disclaimer: string;
}
