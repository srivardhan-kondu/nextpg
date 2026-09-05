import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { LATEST_CUTOFF_YEAR, EXAM_YEAR } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import { graph, breadcrumbSchema, cutoffDatasetSchema } from '@/lib/seo/structured-data';
import { seoRepository } from '@/repositories/seo.repository';
import { CutoffTable, SourceNote } from '@/features/content/components/cutoff-table';

export const revalidate = 86400;

export async function generateStaticParams() {
  try {
    const { branches } = await seoRepository.publishedSlugs();
    return branches.map((slug) => ({ slug }));
  } catch {
    // Prerendering is an optimisation, not a correctness requirement: without a
    // database at build time we fall back to rendering these on first request.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await seoRepository.publishedBranch(slug);
  // `notFound()` renders this segment's not-found boundary but, in this Next
  // version, the response still carries 200 — a soft 404. These URLs are
  // neither linked nor listed in the sitemap, so a crawler only reaches one by
  // guessing a slug; `noindex` here is what keeps such a guess out of the
  // index, and is the mitigation that actually matters.
  if (!data) return { title: 'Cutoffs not found', robots: { index: false, follow: false } };

  const { branch, cutoffs } = data;
  const label = `${branch.degree} ${branch.name}`;
  const best = Math.min(...cutoffs.map((c) => c.closingRank));
  const collegeCount = new Set(cutoffs.map((c) => c.college.slug)).size;

  return pageMetadata({
    title: `${label} NEET PG Cutoff ${LATEST_CUTOFF_YEAR} — Rank Needed by College`,
    description:
      `What rank you need for ${label} in NEET PG. ${cutoffs.length} verified ` +
      `${LATEST_CUTOFF_YEAR} closing ranks across ${collegeCount} colleges, from rank ` +
      `${best.toLocaleString('en-IN')}, split by AIQ, state and deemed quota.`,
    path: `/neet-pg-cutoffs/branch/${slug}`,
    keywords: [
      `${branch.name} NEET PG cutoff`,
      `rank required for ${label}`,
      `${label} closing rank ${LATEST_CUTOFF_YEAR}`,
      `${branch.name} college wise cutoff`,
    ],
  });
}

export default async function BranchCutoffPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await seoRepository.publishedBranch(slug);
  if (!data) notFound();

  const { branch, cutoffs, academicYear } = data;
  const label = `${branch.degree} ${branch.name}`;
  const sources = [...new Set(cutoffs.map((c) => c.source).filter((s): s is string => Boolean(s)))];
  const lastVerified = cutoffs.reduce<Date | null>(
    (latest, c) => (c.verifiedAt && (!latest || c.verifiedAt > latest) ? c.verifiedAt : latest),
    null,
  );
  const ranks = cutoffs.map((c) => c.closingRank);
  const best = Math.min(...ranks);
  const worst = Math.max(...ranks);
  const collegeCount = new Set(cutoffs.map((c) => c.college.slug)).size;
  const states = [...new Set(cutoffs.map((c) => c.college.state))].sort();

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: `NEET PG cutoffs ${academicYear}`, path: '/neet-pg-cutoffs' },
            { name: label, path: `/neet-pg-cutoffs/branch/${slug}` },
          ]),
          cutoffDatasetSchema({
            name: `${label} — NEET PG ${academicYear} closing ranks by college`,
            description:
              `Verified NEET PG ${academicYear} closing ranks for ${label} across ` +
              `${collegeCount} colleges, by quota and category.`,
            path: `/neet-pg-cutoffs/branch/${slug}`,
            academicYear,
            sources,
            lastVerified,
          }),
        )}
      />

      <nav aria-label="Breadcrumb" className="text-[13px] text-[#6b7472]">
        <Link href="/" className="hover:text-[#15191a]">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/neet-pg-cutoffs" className="hover:text-[#15191a]">NEET PG cutoffs</Link>
        <span aria-hidden> / </span>
        <span className="text-[#15191a]">{label}</span>
      </nav>

      <h1 className="mt-4 text-[34px] font-normal leading-[1.12] tracking-[-0.025em] text-[#15191a]">
        {label} — NEET PG {academicYear} cutoff by college
      </h1>

      <p className="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-[#4e5654]">
        Across {collegeCount} {collegeCount === 1 ? 'college' : 'colleges'} in{' '}
        {states.length === 1 ? states[0] : `${states.length} states`}, {label} seats closed between
        rank {best.toLocaleString('en-IN')} and {worst.toLocaleString('en-IN')} in {academicYear}.
        The spread is what matters: the same branch is a different proposition at a top government
        institute than at a deemed university, and the table below separates them by quota and
        category.
      </p>

      {branch.description && (
        <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-[#4e5654]">
          {branch.description}
        </p>
      )}

      <div className="mt-8">
        <CutoffTable
          rows={cutoffs}
          caption={`NEET PG ${academicYear} closing ranks for ${label} by college, quota and category`}
        />
        <SourceNote sources={sources} academicYear={academicYear} />
      </div>

      <section className="mt-12 rounded-[11px] border border-black/[0.08] bg-[#faf9f6] p-6">
        <h2 className="text-[19px] font-normal tracking-[-0.02em] text-[#15191a]">
          Is {branch.name} realistic for your rank?
        </h2>
        <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-[#4e5654]">
          The Dream Validator takes {branch.name} as your target, estimates your NEET PG{' '}
          {EXAM_YEAR} rank, and reports the probability, the rank range you would need, and which
          quotas you are actually eligible for.
        </p>
        <Link
          href="/dream-validator"
          className="mt-5 inline-block rounded-[9px] bg-primary px-[22px] py-[13px] text-[14px] font-medium text-white transition-opacity hover:opacity-90"
        >
          Validate {branch.name} for my rank
        </Link>
      </section>
    </>
  );
}
