import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { LATEST_CUTOFF_YEAR, EXAM_YEAR } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import { graph, breadcrumbSchema, cutoffDatasetSchema } from '@/lib/seo/structured-data';
import { COLLEGE_TYPE_LABEL } from '@/lib/constants';
import { seoRepository } from '@/repositories/seo.repository';
import { CutoffTable, SourceNote } from '@/features/content/components/cutoff-table';

export const revalidate = 86400;

/**
 * Only verified colleges are pre-rendered. `dynamicParams` stays on so a newly
 * verified college is served on first request rather than 404ing until the next
 * deploy — the page itself still refuses to render without enough data.
 */
export async function generateStaticParams() {
  try {
    const { colleges } = await seoRepository.publishedSlugs();
    return colleges.map((slug) => ({ slug }));
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
  const data = await seoRepository.publishedCollege(slug);
  // `notFound()` renders this segment's not-found boundary but, in this Next
  // version, the response still carries 200 — a soft 404. These URLs are
  // neither linked nor listed in the sitemap, so a crawler only reaches one by
  // guessing a slug; `noindex` here is what keeps such a guess out of the
  // index, and is the mitigation that actually matters.
  if (!data) return { title: 'Cutoffs not found', robots: { index: false, follow: false } };

  const { college, cutoffs } = data;
  const name = college.shortName ?? college.name;
  const best = Math.min(...cutoffs.map((c) => c.closingRank));

  return pageMetadata({
    title: `${name} NEET PG Cutoff ${LATEST_CUTOFF_YEAR} — Closing Ranks by Branch`,
    description:
      `NEET PG ${LATEST_CUTOFF_YEAR} closing ranks at ${college.name}, ${college.state}. ` +
      `${cutoffs.length} verified cutoffs across branches, quotas and categories, starting from ` +
      `rank ${best.toLocaleString('en-IN')}.`,
    path: `/neet-pg-cutoffs/college/${slug}`,
    keywords: [
      `${name} NEET PG cutoff`,
      `${name} closing rank`,
      `${college.name} MD MS cutoff ${LATEST_CUTOFF_YEAR}`,
    ],
  });
}

export default async function CollegeCutoffPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await seoRepository.publishedCollege(slug);
  if (!data) notFound();

  const { college, cutoffs, academicYear } = data;
  const name = college.shortName ?? college.name;
  const sources = [...new Set(cutoffs.map((c) => c.source).filter((s): s is string => Boolean(s)))];
  const lastVerified = cutoffs.reduce<Date | null>(
    (latest, c) => (c.verifiedAt && (!latest || c.verifiedAt > latest) ? c.verifiedAt : latest),
    null,
  );
  const best = Math.min(...cutoffs.map((c) => c.closingRank));
  const branchCount = new Set(cutoffs.map((c) => c.branch.slug)).size;

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: `NEET PG cutoffs ${academicYear}`, path: '/neet-pg-cutoffs' },
            { name, path: `/neet-pg-cutoffs/college/${slug}` },
          ]),
          cutoffDatasetSchema({
            name: `${college.name} — NEET PG ${academicYear} closing ranks`,
            description:
              `Verified NEET PG ${academicYear} closing ranks at ${college.name} by branch, ` +
              'quota and category.',
            path: `/neet-pg-cutoffs/college/${slug}`,
            academicYear,
            sources,
            lastVerified,
          }),
          {
            '@type': 'CollegeOrUniversity',
            name: college.name,
            ...(college.shortName ? { alternateName: college.shortName } : {}),
            address: {
              '@type': 'PostalAddress',
              ...(college.city ? { addressLocality: college.city } : {}),
              addressRegion: college.state,
              addressCountry: 'IN',
            },
            ...(college.website ? { url: college.website } : {}),
            ...(college.university ? { parentOrganization: { '@type': 'CollegeOrUniversity', name: college.university } } : {}),
            ...(college.establishedYear ? { foundingDate: String(college.establishedYear) } : {}),
          },
        )}
      />

      <nav aria-label="Breadcrumb" className="text-[13px] text-[#6b7472]">
        <Link href="/" className="hover:text-[#15191a]">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/neet-pg-cutoffs" className="hover:text-[#15191a]">NEET PG cutoffs</Link>
        <span aria-hidden> / </span>
        <span className="text-[#15191a]">{name}</span>
      </nav>

      <h1 className="mt-4 text-[34px] font-normal leading-[1.12] tracking-[-0.025em] text-[#15191a]">
        {college.name} — NEET PG {academicYear} cutoff
      </h1>

      <p className="mt-3 text-[14px] text-[#6b7472]">
        {[college.city, college.state].filter(Boolean).join(', ')} ·{' '}
        {COLLEGE_TYPE_LABEL[college.type]}
        {college.tags.length > 0 && ` · ${college.tags.join(', ')}`}
      </p>

      <p className="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-[#4e5654]">
        {cutoffs.length} verified closing ranks across {branchCount}{' '}
        {branchCount === 1 ? 'branch' : 'branches'} at {name} in the {academicYear} counselling
        cycle. The most competitive seat closed at rank {best.toLocaleString('en-IN')}. Ranks below
        are what actually closed in {academicYear}, not a forecast for {EXAM_YEAR}.
      </p>

      <div className="mt-8">
        <CutoffTable
          rows={cutoffs}
          caption={`NEET PG ${academicYear} closing ranks at ${college.name} by branch, quota and category`}
        />
        <SourceNote sources={sources} academicYear={academicYear} />
      </div>

      <section className="mt-12 rounded-[11px] border border-black/[0.08] bg-[#faf9f6] p-6">
        <h2 className="text-[19px] font-normal tracking-[-0.02em] text-[#15191a]">
          Will your rank reach {name}?
        </h2>
        <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-[#4e5654]">
          A closing rank only tells you where the line fell last year. The predictor estimates your
          NEET PG {EXAM_YEAR} rank from your expected score and checks it against every cutoff on
          this page for your category and quota eligibility.
        </p>
        <Link
          href="/predictor"
          className="mt-5 inline-block rounded-[9px] bg-primary px-[22px] py-[13px] text-[14px] font-medium text-white transition-opacity hover:opacity-90"
        >
          Check my chances at {name}
        </Link>
      </section>
    </>
  );
}
