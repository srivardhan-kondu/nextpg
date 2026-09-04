import { describe, expect, it } from 'vitest';
import {
  matchReference, normaliseCategory, normaliseQuota, normaliseSubCategory,
  REVIEW_THRESHOLD, similarity, stripDegreePrefix, validateRow, type Reference,
} from '@/services/import/validation.service';
import type { ExtractedRow } from '@/services/import/vision.service';

const COLLEGES: Reference[] = [
  { id: 'c1', name: 'All India Institute of Medical Sciences Delhi', aliases: ['AIIMS Delhi'] },
  { id: 'c2', name: 'Osmania Medical College', aliases: ['OMC'] },
  { id: 'c3', name: 'Maulana Azad Medical College', aliases: ['MAMC'] },
];

const BRANCHES: Reference[] = [
  { id: 'b1', name: 'Radiology', aliases: ['Radiodiagnosis', 'Radio Diagnosis'] },
  { id: 'b2', name: 'General Medicine', aliases: ['Internal Medicine'] },
  { id: 'b3', name: 'Orthopedics', aliases: ['Orthopaedics'] },
];

function row(overrides: Partial<ExtractedRow> = {}): ExtractedRow {
  return {
    rawText: 'AIIMS Delhi | MD Radiodiagnosis | AIQ | General | 142',
    collegeName: 'All India Institute of Medical Sciences Delhi',
    branchName: 'MD Radiodiagnosis',
    quota: 'All India Quota',
    category: 'General',
    closingRank: 142,
    openingRank: null,
    seatCount: 6,
    round: 1,
    confidence: 95,
    unreadable: false,
    ...overrides,
  };
}

const base = { colleges: COLLEGES, branches: BRANCHES, academicYear: 2024 };

describe('normalisation', () => {
  it('reads the quota names counselling documents actually use', () => {
    expect(normaliseQuota('All India Quota')).toBe('AIQ');
    expect(normaliseQuota('AIQ')).toBe('AIQ');
    expect(normaliseQuota('State Quota')).toBe('STATE');
    expect(normaliseQuota('Deemed/Paid Seats')).toBe('DEEMED');
    expect(normaliseQuota('Management Quota')).toBe('MANAGEMENT');
  });

  it('returns null rather than guessing an unknown quota', () => {
    expect(normaliseQuota('Something Else')).toBeNull();
    expect(normaliseQuota(null)).toBeNull();
  });

  it('reads EWS before GENERAL, since "GENERAL-EWS" contains both', () => {
    expect(normaliseCategory('GENERAL-EWS')).toBe('EWS');
    expect(normaliseCategory('EWS')).toBe('EWS');
    expect(normaliseCategory('Open')).toBe('GENERAL');
    expect(normaliseCategory('UR')).toBe('GENERAL');
  });

  it('defaults sub-category to NONE rather than inventing one', () => {
    expect(normaliseSubCategory('General')).toBe('NONE');
    expect(normaliseSubCategory('OBC PwD')).toBe('PWD');
    expect(normaliseSubCategory(null)).toBe('NONE');
  });

  it('strips the degree prefix from a speciality', () => {
    expect(stripDegreePrefix('MD Radiodiagnosis')).toBe('radiodiagnosis');
    expect(stripDegreePrefix('MS Orthopaedics')).toBe('orthopaedics');
    // A college whose real name starts with MS must keep it.
    expect(stripDegreePrefix('Radiology')).toBe('radiology');
  });
});

describe('matchReference', () => {
  it('matches on a curated alias', () => {
    expect(matchReference('MD Radiodiagnosis', BRANCHES, { stripDegree: true }).id).toBe('b1');
    expect(matchReference('MS Orthopaedics', BRANCHES, { stripDegree: true }).id).toBe('b3');
  });

  it('tolerates the wording differences between documents', () => {
    expect(matchReference('Osmania Medical College, Hyderabad', COLLEGES).id).toBe('c2');
  });

  it('refuses a weak match rather than picking the nearest', () => {
    const result = matchReference('Some Unknown Institute of Health', COLLEGES);
    expect(result.id).toBeNull();
  });

  it('scores identical strings highest', () => {
    expect(similarity('Osmania Medical College', 'Osmania Medical College')).toBe(1);
  });
});

describe('validateRow — the never-invent guarantee', () => {
  it('accepts a clean, fully matched row', () => {
    const result = validateRow({ row: row(), ...base });
    expect(result.collegeId).toBe('c1');
    expect(result.branchId).toBe('b1');
    expect(result.closingRank).toBe(142);
    expect(result.issues).toEqual([]);
    expect(result.autoApprovable).toBe(true);
  });

  it('never substitutes a value for a missing closing rank', () => {
    const result = validateRow({ row: row({ closingRank: null }), ...base });
    expect(result.closingRank).toBeNull();
    expect(result.issues).toContain('missing_closing_rank');
    expect(result.autoApprovable).toBe(false);
  });

  it('never auto-approves an unmatched college', () => {
    const result = validateRow({ row: row({ collegeName: 'Nowhere Medical College' }), ...base });
    expect(result.collegeId).toBeNull();
    expect(result.issues).toContain('unmatched_college');
    expect(result.autoApprovable).toBe(false);
  });

  it('flags an implausible rank instead of clamping it', () => {
    const result = validateRow({ row: row({ closingRank: 9_999_999 }), ...base });
    expect(result.closingRank).toBe(9_999_999);
    expect(result.issues).toContain('implausible_rank');
    expect(result.autoApprovable).toBe(false);
  });

  it('catches an opening rank after the closing rank', () => {
    const result = validateRow({ row: row({ openingRank: 5000, closingRank: 142 }), ...base });
    expect(result.issues).toContain('opening_after_closing');
    expect(result.autoApprovable).toBe(false);
  });

  it('collapses confidence for a row the model could not read', () => {
    const result = validateRow({ row: row({ unreadable: true, confidence: 95 }), ...base });
    expect(result.confidence).toBeLessThanOrEqual(30);
    expect(result.issues).toContain('unreadable');
    expect(result.autoApprovable).toBe(false);
  });

  it('never raises confidence above what the model reported', () => {
    const result = validateRow({ row: row({ confidence: 70 }), ...base });
    expect(result.confidence).toBeLessThanOrEqual(70);
  });

  it('lets the document override the operator default quota', () => {
    const result = validateRow({
      row: row({ quota: 'State Quota' }),
      ...base,
      defaultQuota: 'AIQ',
    });
    expect(result.quota).toBe('STATE');
  });

  it('uses the operator default only when the document says nothing', () => {
    const result = validateRow({ row: row({ quota: null }), ...base, defaultQuota: 'AIQ' });
    expect(result.quota).toBe('AIQ');
  });

  it('flags rather than defaults when neither document nor operator gives a quota', () => {
    const result = validateRow({ row: row({ quota: null }), ...base });
    expect(result.quota).toBeNull();
    expect(result.issues).toContain('unknown_quota');
  });

  it('holds the review threshold high enough to matter', () => {
    // A low bar here would let uncertain reads into the prediction engine.
    expect(REVIEW_THRESHOLD).toBeGreaterThanOrEqual(80);
  });
});
