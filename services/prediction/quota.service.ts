import type { Category, QuotaType, SubCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { LATEST_CUTOFF_YEAR } from '@/config/site';

/**
 * Decides which counseling quotas a candidate can actually compete in.
 * Rules come from the quota_rules table when present; the static baseline below
 * encodes the national defaults so the engine still works on a fresh database.
 */

const BASELINE_QUOTAS: QuotaType[] = ['AIQ', 'DEEMED'];

export interface QuotaEligibility {
  quotas: QuotaType[];
  aiqQuotas: QuotaType[];
  stateQuotas: QuotaType[];
  notes: string[];
}

export async function resolveEligibleQuotas(params: {
  state: string;
  category: Category;
  subCategory: SubCategory;
  academicYear?: number;
}): Promise<QuotaEligibility> {
  const { state, category, subCategory, academicYear = LATEST_CUTOFF_YEAR } = params;
  const notes: string[] = [];

  const rules = await prisma.quotaRule.findMany({
    where: {
      state,
      academicYear,
      isActive: true,
      OR: [{ category }, { category: null }],
    },
  });

  const quotas = new Set<QuotaType>(BASELINE_QUOTAS);

  // 50% of PG seats go to AIQ; the rest are state quota, open to domicile holders.
  quotas.add('STATE');
  notes.push(`State quota seats are matched against your ${state} domicile.`);

  for (const rule of rules) {
    if (rule.requiresDomicile && rule.state !== state) continue;
    quotas.add(rule.quota);
  }

  if (subCategory === 'NRI') {
    quotas.add('NRI');
    notes.push('NRI quota included — these seats carry substantially higher fees.');
  }
  if (subCategory === 'MANAGEMENT') {
    quotas.add('MANAGEMENT');
    notes.push('Management quota included — closing ranks are lower but fees are higher.');
  }

  const all = [...quotas];
  return {
    quotas: all,
    aiqQuotas: all.filter((q) => q === 'AIQ'),
    stateQuotas: all.filter((q) => q !== 'AIQ'),
    notes,
  };
}
