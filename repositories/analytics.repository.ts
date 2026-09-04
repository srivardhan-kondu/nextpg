import { prisma } from '@/lib/prisma';
import { pricing } from '@/config/site';

export interface AnalyticsOverview {
  totalUsers: number;
  paidUsers: number;
  revenuePaise: number;
  creditsSold: number;
  creditsUsed: number;
  conversionRate: number;
  predictionVolume: number;
  unlockedPredictions: number;
  paymentSuccessRate: number;
  reportsGenerated: number;
}

export interface NamedCount {
  name: string;
  count: number;
}

/**
 * Admin analytics. Aggregations run in Postgres rather than in Node — these
 * tables grow without bound and must never be pulled into memory to be counted.
 */
export const analyticsRepository = {
  async overview(): Promise<AnalyticsOverview> {
    const [
      totalUsers,
      paidUsers,
      revenue,
      credits,
      predictionVolume,
      unlockedPredictions,
      paymentsTotal,
      paymentsPaid,
      reportsGenerated,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.payment.findMany({ where: { status: 'PAID' }, select: { userId: true }, distinct: ['userId'] }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true, creditsSold: true } }),
      prisma.predictionCredit.aggregate({ _sum: { purchased: true, used: true } }),
      prisma.prediction.count(),
      prisma.prediction.count({ where: { status: 'UNLOCKED' } }),
      prisma.payment.count({ where: { status: { not: 'CREATED' } } }),
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.report.count({ where: { status: 'READY' } }),
    ]);

    const paidCount = paidUsers.length;

    return {
      totalUsers,
      paidUsers: paidCount,
      revenuePaise: revenue._sum.amount ?? 0,
      creditsSold: revenue._sum.creditsSold ?? credits._sum.purchased ?? 0,
      creditsUsed: credits._sum.used ?? 0,
      conversionRate: totalUsers === 0 ? 0 : Math.round((paidCount / totalUsers) * 1000) / 10,
      predictionVolume,
      unlockedPredictions,
      paymentSuccessRate:
        paymentsTotal === 0 ? 0 : Math.round((paymentsPaid / paymentsTotal) * 1000) / 10,
      reportsGenerated,
    };
  },

  /** Dream Validator is the only place a branch is explicitly *chosen*. */
  async topBranches(limit = 8): Promise<NamedCount[]> {
    const rows = await prisma.dreamValidation.groupBy({
      by: ['dreamBranch'],
      _count: { dreamBranch: true },
      orderBy: { _count: { dreamBranch: 'desc' } },
      take: limit,
    });
    return rows.map((r) => ({ name: r.dreamBranch, count: r._count.dreamBranch }));
  },

  async topColleges(limit = 8): Promise<NamedCount[]> {
    const rows = await prisma.dreamValidation.groupBy({
      by: ['dreamCollege'],
      where: { dreamCollege: { not: null } },
      _count: { dreamCollege: true },
      orderBy: { _count: { dreamCollege: 'desc' } },
      take: limit,
    });
    return rows.map((r) => ({ name: r.dreamCollege ?? 'Unknown', count: r._count.dreamCollege }));
  },

  async topStates(limit = 8): Promise<NamedCount[]> {
    const rows = await prisma.prediction.groupBy({
      by: ['state'],
      _count: { state: true },
      orderBy: { _count: { state: 'desc' } },
      take: limit,
    });
    return rows.map((r) => ({ name: r.state, count: r._count.state }));
  },

  /** Daily prediction counts for the trend chart. */
  async predictionsByDay(days = 30): Promise<{ date: string; count: number }[]> {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM predictions
      WHERE "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;
    return rows.map((r) => ({
      date: r.day.toISOString().slice(0, 10),
      count: Number(r.count),
    }));
  },

  async revenueByDay(days = 30): Promise<{ date: string; revenue: number }[]> {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await prisma.$queryRaw<{ day: Date; total: bigint }[]>`
      SELECT date_trunc('day', "paidAt") AS day, SUM(amount)::bigint AS total
      FROM payments
      WHERE status = 'PAID' AND "paidAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;
    return rows.map((r) => ({ date: r.day.toISOString().slice(0, 10), revenue: Number(r.total) / 100 }));
  },

  async dataCoverage() {
    const [colleges, branches, cutoffs, quotaRules, latestYear] = await Promise.all([
      prisma.college.count({ where: { isActive: true } }),
      prisma.branch.count({ where: { isActive: true } }),
      prisma.historicalCutoff.count(),
      prisma.quotaRule.count({ where: { isActive: true } }),
      prisma.historicalCutoff.aggregate({ _max: { academicYear: true } }),
    ]);
    return { colleges, branches, cutoffs, quotaRules, latestYear: latestYear._max.academicYear };
  },

  /** Expected revenue per credit pack — used to sanity-check the revenue tile. */
  get packAmount() {
    return pricing.amountInPaise;
  },
};
