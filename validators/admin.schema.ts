import { z } from 'zod';
import { INDIAN_STATES } from '@/lib/constants';

export const collegeSchema = z.object({
  name: z.string().trim().min(3).max(160),
  shortName: z.string().trim().max(40).optional(),
  state: z.enum(INDIAN_STATES as unknown as [string, ...string[]]),
  city: z.string().trim().max(80).optional(),
  type: z.enum(['GOVERNMENT', 'PRIVATE', 'DEEMED', 'DNB']),
  university: z.string().trim().max(160).optional(),
  establishedYear: z.coerce.number().int().min(1800).max(2100).optional(),
  website: z.string().url().max(200).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const branchSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().max(20).optional(),
  degree: z.enum(['MD', 'MS', 'DIPLOMA', 'DNB']).default('MD'),
  isClinical: z.boolean().default(true),
  popularity: z.coerce.number().int().min(0).max(100).default(0),
  description: z.string().trim().max(600).optional(),
  isActive: z.boolean().default(true),
});

export const cutoffSchema = z.object({
  collegeId: z.string().cuid(),
  branchId: z.string().cuid(),
  quota: z.enum(['AIQ', 'STATE', 'DEEMED', 'MANAGEMENT', 'NRI', 'INSTITUTIONAL']),
  category: z.enum(['GENERAL', 'EWS', 'OBC', 'SC', 'ST']),
  subCategory: z.enum(['NONE', 'PWD', 'ARMED_FORCES', 'NRI', 'MANAGEMENT', 'MINORITY']).default('NONE'),
  closingRank: z.coerce.number().int().min(1).max(2_000_000),
  openingRank: z.coerce.number().int().min(1).max(2_000_000).optional(),
  seatCount: z.coerce.number().int().min(0).max(2000).default(0),
  round: z.coerce.number().int().min(1).max(6).default(1),
  academicYear: z.coerce.number().int().min(2015).max(2100),
  source: z.string().trim().max(120).optional(),
});

export const quotaRuleSchema = z.object({
  state: z.enum(INDIAN_STATES as unknown as [string, ...string[]]),
  quota: z.enum(['AIQ', 'STATE', 'DEEMED', 'MANAGEMENT', 'NRI', 'INSTITUTIONAL']),
  category: z.enum(['GENERAL', 'EWS', 'OBC', 'SC', 'ST']).optional(),
  reservationPct: z.coerce.number().min(0).max(100).optional(),
  requiresDomicile: z.boolean().default(true),
  seatSharePct: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().trim().max(600).optional(),
  academicYear: z.coerce.number().int().min(2015).max(2100),
  isActive: z.boolean().default(true),
});

export const userAdminSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  isBlocked: z.boolean().optional(),
});

export const creditAdjustSchema = z.object({
  userId: z.string().cuid(),
  delta: z.coerce.number().int().min(-100).max(100).refine((v) => v !== 0, 'Delta cannot be zero'),
  reason: z.string().trim().min(4).max(200),
});

export type CollegeInput = z.infer<typeof collegeSchema>;
export type BranchInput = z.infer<typeof branchSchema>;
export type CutoffInput = z.infer<typeof cutoffSchema>;
export type QuotaRuleInput = z.infer<typeof quotaRuleSchema>;
