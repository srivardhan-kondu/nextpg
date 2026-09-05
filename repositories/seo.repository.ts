import { prisma } from '@/lib/prisma';
import { LATEST_CUTOFF_YEAR } from '@/config/site';

/**
 * Read models for the public, indexable cutoff pages.
 *
 * Publication gate: a row is publishable only when `verifiedAt` is set. Every
 * real ingestion path stamps it (CSV import, admin edit, approved PDF
 * extraction); the seed deliberately does not. That single predicate is what
 * keeps the representative seed data — and any half-reviewed extraction — out
 * of the index. Publishing invented closing ranks would be worse than
 * publishing nothing: it misleads candidates during counselling and is exactly
 * the unverifiable content Google's helpful-content systems demote.
 */

/**
 * Below this many verified rows a page is thin content, and thin programmatic
 * pages drag down the whole domain rather than only failing on their own.
 */
export const MIN_ROWS_TO_PUBLISH = 6;

const publishable = (academicYear: number) => ({
  academicYear,
  verifiedAt: { not: null },
  college: { isActive: true },
  branch: { isActive: true },
});

export const seoRepository = {
  /** Colleges with enough verified rows to carry their own page. */
  async publishedColleges(academicYear = LATEST_CUTOFF_YEAR) {
    const grouped = await prisma.historicalCutoff.groupBy({
      by: ['collegeId'],
      where: publishable(academicYear),
      _count: { _all: true },
      _min: { closingRank: true },
    });

    const eligible = grouped.filter((g) => g._count._all >= MIN_ROWS_TO_PUBLISH);
    if (eligible.length === 0) return [];

    const colleges = await prisma.college.findMany({
      where: { id: { in: eligible.map((g) => g.collegeId) } },
      select: { id: true, name: true, shortName: true, slug: true, state: true, city: true, type: true },
    });

    const byId = new Map(colleges.map((c) => [c.id, c]));

    return eligible
      .flatMap((g) => {
        const college = byId.get(g.collegeId);
        return college ? [{ ...college, rowCount: g._count._all, bestRank: g._min.closingRank }] : [];
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  /** Every verified row for one college, newest-verified first for freshness. */
  async publishedCollege(slug: string, academicYear = LATEST_CUTOFF_YEAR) {
    const college = await prisma.college.findUnique({
      where: { slug },
      select: {
        id: true, name: true, shortName: true, slug: true, state: true, city: true,
        type: true, tags: true, university: true, establishedYear: true, website: true,
        isActive: true,
      },
    });
    if (!college || !college.isActive) return null;

    const cutoffs = await prisma.historicalCutoff.findMany({
      where: { collegeId: college.id, ...publishable(academicYear) },
      select: {
        closingRank: true, openingRank: true, seatCount: true, quota: true,
        category: true, subCategory: true, round: true, source: true, verifiedAt: true,
        branch: { select: { name: true, slug: true, degree: true } },
      },
      orderBy: [{ closingRank: 'asc' }],
    });

    if (cutoffs.length < MIN_ROWS_TO_PUBLISH) return null;
    return { college, cutoffs, academicYear };
  },

  /** Branches with enough verified rows to carry their own page. */
  async publishedBranches(academicYear = LATEST_CUTOFF_YEAR) {
    const grouped = await prisma.historicalCutoff.groupBy({
      by: ['branchId'],
      where: publishable(academicYear),
      _count: { _all: true },
    });

    const eligible = grouped.filter((g) => g._count._all >= MIN_ROWS_TO_PUBLISH);
    if (eligible.length === 0) return [];

    const branches = await prisma.branch.findMany({
      where: { id: { in: eligible.map((g) => g.branchId) } },
      select: { id: true, name: true, slug: true, degree: true, popularity: true, description: true },
    });

    const counts = new Map(eligible.map((g) => [g.branchId, g._count._all]));

    return branches
      .map((b) => ({ ...b, rowCount: counts.get(b.id) ?? 0 }))
      .sort((a, b) => b.popularity - a.popularity);
  },

  /** Every verified row for one branch, across colleges. */
  async publishedBranch(slug: string, academicYear = LATEST_CUTOFF_YEAR) {
    const branch = await prisma.branch.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, degree: true, description: true, isActive: true },
    });
    if (!branch || !branch.isActive) return null;

    const cutoffs = await prisma.historicalCutoff.findMany({
      where: { branchId: branch.id, ...publishable(academicYear) },
      select: {
        closingRank: true, openingRank: true, seatCount: true, quota: true,
        category: true, subCategory: true, round: true, state: true, source: true, verifiedAt: true,
        college: { select: { name: true, shortName: true, slug: true, state: true, type: true } },
      },
      orderBy: [{ closingRank: 'asc' }],
    });

    if (cutoffs.length < MIN_ROWS_TO_PUBLISH) return null;
    return { branch, cutoffs, academicYear };
  },

  /**
   * Slugs for the sitemap and for `generateStaticParams`. Kept as its own
   * lightweight query so building the sitemap never loads full cutoff rows.
   */
  async publishedSlugs(academicYear = LATEST_CUTOFF_YEAR) {
    const [colleges, branches] = await Promise.all([
      this.publishedColleges(academicYear),
      this.publishedBranches(academicYear),
    ]);

    return {
      colleges: colleges.map((c) => c.slug),
      branches: branches.map((b) => b.slug),
    };
  },

  /** Most recent verification stamp — drives honest `lastModified` values. */
  async lastVerifiedAt(academicYear = LATEST_CUTOFF_YEAR): Promise<Date | null> {
    const row = await prisma.historicalCutoff.findFirst({
      where: publishable(academicYear),
      orderBy: { verifiedAt: 'desc' },
      select: { verifiedAt: true },
    });
    return row?.verifiedAt ?? null;
  },
};
