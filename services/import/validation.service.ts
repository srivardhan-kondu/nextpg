import type { Category, QuotaType, SubCategory } from '@prisma/client';
import type { ExtractedRow } from './vision.service';

/**
 * Rows scoring below this cannot be auto-approved and must be reviewed by a
 * human. Set deliberately high: a wrong cutoff is worse than a slow import.
 */
export const REVIEW_THRESHOLD = 85;

/** Highest rank we will accept. NEET PG has roughly 2 lakh candidates. */
const MAX_PLAUSIBLE_RANK = 500_000;

export type RowIssue =
  | 'unreadable'
  | 'missing_college'
  | 'missing_branch'
  | 'missing_closing_rank'
  | 'unmatched_college'
  | 'unmatched_branch'
  | 'unknown_quota'
  | 'unknown_category'
  | 'implausible_rank'
  | 'opening_after_closing'
  | 'implausible_seat_count'
  | 'low_model_confidence';

const QUOTA_PATTERNS: [RegExp, QuotaType][] = [
  [/\b(all\s*india|aiq|a\.i\.q)\b/i, 'AIQ'],
  [/\bstate\b/i, 'STATE'],
  [/\bdeemed\b/i, 'DEEMED'],
  [/\b(management|mgmt)\b/i, 'MANAGEMENT'],
  [/\bnri\b/i, 'NRI'],
  [/\b(institutional|inst)\b/i, 'INSTITUTIONAL'],
];

const CATEGORY_PATTERNS: [RegExp, Category][] = [
  // EWS before GENERAL: "GENERAL-EWS" is EWS, and the looser pattern would win.
  [/\bews\b/i, 'EWS'],
  [/\b(obc|bc)\b/i, 'OBC'],
  [/\bsc\b/i, 'SC'],
  [/\bst\b/i, 'ST'],
  [/\b(general|gen|open|ur|unreserved)\b/i, 'GENERAL'],
];

const SUB_CATEGORY_PATTERNS: [RegExp, SubCategory][] = [
  [/\b(pwd|ph|physically\s*handicapped|divyang)\b/i, 'PWD'],
  [/\b(armed\s*forces|cw|ex-?serviceman)\b/i, 'ARMED_FORCES'],
  [/\bnri\b/i, 'NRI'],
  [/\bminority\b/i, 'MINORITY'],
];

export function normaliseQuota(raw: string | null): QuotaType | null {
  if (!raw) return null;
  return QUOTA_PATTERNS.find(([pattern]) => pattern.test(raw))?.[1] ?? null;
}

export function normaliseCategory(raw: string | null): Category | null {
  if (!raw) return null;
  return CATEGORY_PATTERNS.find(([pattern]) => pattern.test(raw))?.[1] ?? null;
}

export function normaliseSubCategory(raw: string | null): SubCategory {
  if (!raw) return 'NONE';
  return SUB_CATEGORY_PATTERNS.find(([pattern]) => pattern.test(raw))?.[1] ?? 'NONE';
}

/** Lowercase, strip punctuation and collapse whitespace, for fuzzy matching. */
export function normaliseName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Drops the degree prefix counselling documents put in front of a speciality,
 * so "MD Radiodiagnosis" is compared as "radiodiagnosis".
 *
 * Applied to branch names only — a college called "MS Ramaiah Medical College"
 * would otherwise lose the "MS" that is part of its actual name.
 */
export function stripDegreePrefix(input: string): string {
  return normaliseName(input).replace(/^(md|ms|dnb|diploma|pg diploma)\s+/, '');
}

/**
 * Token-overlap similarity, 0-1.
 *
 * Chosen over edit distance because counselling documents vary by whole words
 * ("Govt. Medical College, Nagpur" vs "Government Medical College Nagpur"),
 * not by characters.
 */
export function similarity(a: string, b: string): number {
  const left = new Set(normaliseName(a).split(' ').filter((t) => t.length > 2));
  const right = new Set(normaliseName(b).split(' ').filter((t) => t.length > 2));
  if (left.size === 0 || right.size === 0) return 0;

  let shared = 0;
  for (const token of left) if (right.has(token)) shared++;
  return shared / Math.max(left.size, right.size);
}

export interface Reference {
  id: string;
  name: string;
  aliases?: string[];
}

export interface MatchResult {
  id: string | null;
  score: number;
}

/** Only a strong match counts; anything weaker is flagged for a human. */
const MATCH_THRESHOLD = 0.72;

export function matchReference(
  raw: string | null,
  candidates: Reference[],
  options: { stripDegree?: boolean } = {},
): MatchResult {
  if (!raw) return { id: null, score: 0 };

  const needle = options.stripDegree ? stripDegreePrefix(raw) : raw;

  let best: MatchResult = { id: null, score: 0 };
  for (const candidate of candidates) {
    const names = [candidate.name, ...(candidate.aliases ?? [])];
    for (const name of names) {
      const hay = options.stripDegree ? stripDegreePrefix(name) : name;
      // An exact match after normalisation is decisive — curated aliases are
      // equivalences we have asserted, not fuzzy guesses.
      const score = needle === hay ? 1 : similarity(needle, hay);
      if (score > best.score) best = { id: candidate.id, score };
    }
  }

  return best.score >= MATCH_THRESHOLD ? best : { id: null, score: best.score };
}

export interface ValidatedRow {
  collegeId: string | null;
  branchId: string | null;
  quota: QuotaType | null;
  category: Category | null;
  subCategory: SubCategory;
  closingRank: number | null;
  openingRank: number | null;
  seatCount: number | null;
  round: number | null;
  confidence: number;
  issues: RowIssue[];
  autoApprovable: boolean;
}

/**
 * Turns one transcribed row into a validated candidate.
 *
 * Confidence starts at the model's own read certainty and is only ever reduced.
 * Nothing here ever supplies a value the document did not contain — a missing
 * field stays null and becomes an issue, never a default.
 */
export function validateRow(params: {
  row: ExtractedRow;
  colleges: Reference[];
  branches: Reference[];
  defaultQuota?: QuotaType | null;
  /** Carried by the caller for provenance; validation does not branch on it. */
  academicYear?: number;
}): ValidatedRow {
  const { row, colleges, branches, defaultQuota } = params;
  const issues: RowIssue[] = [];
  let confidence = row.confidence;

  if (row.unreadable) {
    issues.push('unreadable');
    confidence = Math.min(confidence, 30);
  }

  if (!row.collegeName) issues.push('missing_college');
  if (!row.branchName) issues.push('missing_branch');
  if (row.closingRank === null) issues.push('missing_closing_rank');

  const collegeMatch = matchReference(row.collegeName, colleges);
  if (row.collegeName && !collegeMatch.id) {
    issues.push('unmatched_college');
    confidence -= 35;
  } else if (collegeMatch.id) {
    // A weak-but-accepted match still lowers confidence proportionally.
    confidence -= Math.round((1 - collegeMatch.score) * 25);
  }

  const branchMatch = matchReference(row.branchName, branches, { stripDegree: true });
  if (row.branchName && !branchMatch.id) {
    issues.push('unmatched_branch');
    confidence -= 25;
  } else if (branchMatch.id) {
    confidence -= Math.round((1 - branchMatch.score) * 15);
  }

  // The document's own quota wins; the operator's default only fills a gap.
  const quota = normaliseQuota(row.quota) ?? defaultQuota ?? null;
  if (!quota) {
    issues.push('unknown_quota');
    confidence -= 20;
  }

  const category = normaliseCategory(row.category);
  if (!category) {
    issues.push('unknown_category');
    confidence -= 20;
  }

  const closingRank = row.closingRank;
  if (closingRank !== null && (closingRank < 1 || closingRank > MAX_PLAUSIBLE_RANK)) {
    issues.push('implausible_rank');
    confidence -= 40;
  }

  const openingRank = row.openingRank;
  if (openingRank !== null && closingRank !== null && openingRank > closingRank) {
    // Opening must precede closing; the pair was probably read swapped.
    issues.push('opening_after_closing');
    confidence -= 25;
  }

  const seatCount = row.seatCount;
  if (seatCount !== null && (seatCount < 0 || seatCount > 500)) {
    issues.push('implausible_seat_count');
    confidence -= 15;
  }

  if (row.confidence < 60) issues.push('low_model_confidence');

  const finalConfidence = Math.max(0, Math.min(100, Math.round(confidence)));

  // Auto-approval demands a complete, matched, plausible row. Everything else
  // waits for a person.
  const complete =
    collegeMatch.id !== null &&
    branchMatch.id !== null &&
    quota !== null &&
    category !== null &&
    closingRank !== null;

  return {
    collegeId: collegeMatch.id,
    branchId: branchMatch.id,
    quota,
    category,
    subCategory: normaliseSubCategory(row.category),
    closingRank,
    openingRank,
    seatCount,
    round: row.round,
    confidence: finalConfidence,
    issues,
    autoApprovable: complete && issues.length === 0 && finalConfidence >= REVIEW_THRESHOLD,
  };
}
