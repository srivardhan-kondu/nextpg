import type { BranchRecommendation, CollegeOpportunity, StrategyNote } from '@/types/prediction';

/**
 * Worked example for the public sample report.
 *
 * Explicitly fictional: the candidate does not exist, and the colleges shown
 * carry representative — not published — closing ranks. This never touches the
 * database, so no real user data can leak onto a public page.
 */
const colleges: CollegeOpportunity[] = [
  {
    collegeId: 'sample-1', collegeName: 'Gandhi Medical College', collegeType: 'GOVERNMENT',
    state: 'Telangana', branchId: 'b-1', branchName: 'General Medicine', quota: 'STATE',
    category: 'GENERAL', closingRank: 18_420, seatCount: 12, academicYear: 2024,
    band: 'STRONG', probability: 84,
  },
  {
    collegeId: 'sample-2', collegeName: 'Osmania Medical College', collegeType: 'GOVERNMENT',
    state: 'Telangana', branchId: 'b-2', branchName: 'Anaesthesia', quota: 'STATE',
    category: 'GENERAL', closingRank: 16_980, seatCount: 9, academicYear: 2024,
    band: 'STRONG', probability: 79,
  },
  {
    collegeId: 'sample-3', collegeName: 'Kakatiya Medical College', collegeType: 'GOVERNMENT',
    state: 'Telangana', branchId: 'b-3', branchName: 'Pathology', quota: 'STATE',
    category: 'GENERAL', closingRank: 21_350, seatCount: 7, academicYear: 2024,
    band: 'STRONG', probability: 88,
  },
  {
    collegeId: 'sample-4', collegeName: 'Government Medical College, Nagpur', collegeType: 'GOVERNMENT',
    state: 'Maharashtra', branchId: 'b-4', branchName: 'Emergency Medicine', quota: 'AIQ',
    category: 'GENERAL', closingRank: 15_100, seatCount: 4, academicYear: 2024,
    band: 'MODERATE', probability: 62,
  },
  {
    collegeId: 'sample-5', collegeName: 'Bangalore Medical College', collegeType: 'GOVERNMENT',
    state: 'Karnataka', branchId: 'b-5', branchName: 'Respiratory Medicine', quota: 'AIQ',
    category: 'GENERAL', closingRank: 14_260, seatCount: 3, academicYear: 2024,
    band: 'MODERATE', probability: 54,
  },
  {
    collegeId: 'sample-6', collegeName: 'Deccan College of Medical Sciences', collegeType: 'PRIVATE',
    state: 'Telangana', branchId: 'b-6', branchName: 'Psychiatry', quota: 'MANAGEMENT',
    category: 'GENERAL', closingRank: 24_800, seatCount: 5, academicYear: 2024,
    band: 'STRONG', probability: 91,
  },
  {
    collegeId: 'sample-7', collegeName: 'Maulana Azad Medical College', collegeType: 'GOVERNMENT',
    state: 'Delhi', branchId: 'b-7', branchName: 'Orthopedics', quota: 'AIQ',
    category: 'GENERAL', closingRank: 11_900, seatCount: 3, academicYear: 2024,
    band: 'STRETCH', probability: 28,
  },
];

const branches: BranchRecommendation[] = [
  {
    branchName: 'Pathology', probability: 88, likelihood: 'STRONG', seatsInRange: 34,
    bestClosingRank: 26_400,
    rationale: '9 seat options closed at or after your expected range in 2024.',
  },
  {
    branchName: 'General Medicine', probability: 71, likelihood: 'STRONG', seatsInRange: 22,
    bestClosingRank: 19_800,
    rationale: '4 seat options closed at or after your expected range in 2024.',
  },
  {
    branchName: 'Anaesthesia', probability: 66, likelihood: 'MODERATE', seatsInRange: 28,
    bestClosingRank: 18_100,
    rationale: '5 seat options closed at or after your expected range in 2024.',
  },
  {
    branchName: 'Emergency Medicine', probability: 58, likelihood: 'MODERATE', seatsInRange: 16,
    bestClosingRank: 16_900,
    rationale: 'Options exist but closed near your best-case rank in 2024.',
  },
  {
    branchName: 'Radiology', probability: 12, likelihood: 'VERY_DIFFICULT', seatsInRange: 0,
    bestClosingRank: 2_150,
    rationale: 'Its most forgiving seat closed well ahead of your range in 2024.',
  },
  {
    branchName: 'Dermatology', probability: 9, likelihood: 'VERY_DIFFICULT', seatsInRange: 0,
    bestClosingRank: 1_680,
    rationale: 'Its most forgiving seat closed well ahead of your range in 2024.',
  },
];

const strategy: StrategyNote[] = [
  {
    title: 'Lock your safety options first',
    priority: 'high',
    body: 'You have 4 strong options. Place at least three of them low in your preference list so you are not left without a seat in the final round.',
  },
  {
    title: 'Run AIQ and state counseling in parallel',
    priority: 'high',
    body: 'You have 38 AIQ and 64 Telangana state quota opportunities. Register for both — AIQ rounds run first, and a state seat is a useful fallback if you free-exit AIQ.',
  },
  {
    title: 'Order preferences by ambition, not by safety',
    priority: 'medium',
    body: 'Counseling software allots the highest preference you qualify for, so putting a stretch college first costs you nothing. Sequence: stretch → moderate → strong.',
  },
  {
    title: 'Verify every cutoff before you lock a choice',
    priority: 'low',
    body: 'These figures come from published historical data. Confirm the current year’s seat matrix and fee structure on the official counseling portal before committing.',
  },
];

export const SAMPLE_REPORT = {
  candidateName: 'Sample Candidate',
  state: 'Telangana',
  category: 'General',
  expectedScore: 428,
  rankRange: '12,000 – 16,500',
  confidence: 78,
  aiqCount: 38,
  stateCount: 64,
  colleges,
  branches,
  strategy,
} as const;
