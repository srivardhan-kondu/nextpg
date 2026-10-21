import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { CUTOFF_SOURCE_LABEL, EXAM_YEAR } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import { graph, breadcrumbSchema } from '@/lib/seo/structured-data';
import { COLLEGE_TYPE_LABEL } from '@/lib/constants';
import { seoRepository } from '@/repositories/seo.repository';

/**
 * One page per state: every college there with published closing ranks.
 * It keeps the cutoff hub light (a thousand college links on one page is
 * over a megabyte) and answers the way candidates search — by state first.
 */
export const revalidate = 86400;

export async function generateStaticParams() {
  try {
    const { states } = await seoRepository.publishedSlugs();
    return states.map((state) => ({ state }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: slug } = await params;
  const data = await seoRepository.publishedState(slug);
  if (!data) return { title: 'Cutoffs not found', robots: { index: false, follow: false } };

  const { state, colleges, academicYear } = data;
  const govt = colleges.filter((c) => c.type === 'GOVERNMENT').length;
  return pageMetadata({
    title: `NEET PG Cutoff ${academicYear} ${state} — ${colleges.length} Colleges, Closing Ranks`,
    description:
      `NEET PG ${academicYear} closing ranks at ${colleges.length} colleges in ${state}` +
      `${govt ? ` (${govt} government)` : ''}, by course, quota and category — from MCC's official allotment result.`,
    path: `/neet-pg-cutoffs/state/${slug}`,
    keywords: [`NEET PG cutoff ${state}`, `${state} PG medical colleges cutoff`, `MD MS cutoff ${state} ${academicYear}`],
  });
}

export default async function StateCutoffPage({ params }: { params: Promise<{ state: string }> }) {
  const { state: slug } = await params;
  const data = await seoRepository.publishedState(slug);
  if (!data) notFound();

  const { state, colleges, academicYear } = data;
  const order = ['GOVERNMENT', 'DEEMED', 'PRIVATE', 'DNB'] as const;
  const groups = order
    .map((type) => [type, colleges.filter((c) => c.type === type).sort((a, b) => a.name.localeCompare(b.name))] as const)
    .filter(([, list]) => list.length > 0);

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: `NEET PG cutoffs ${academicYear}`, path: '/neet-pg-cutoffs' },
            { name: state, path: `/neet-pg-cutoffs/state/${slug}` },
          ]),
        )}
      />

      <nav aria-label="Breadcrumb" className="text-[13px] text-[#6b7472]">
        <Link href="/" className="hover:text-[#15191a]">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/neet-pg-cutoffs" className="hover:text-[#15191a]">NEET PG cutoffs</Link>
        <span aria-hidden> / </span>
        <span className="text-[#15191a]">{state}</span>
      </nav>

      <h1 className="mt-4 text-[34px] font-normal leading-[1.12] tracking-[-0.025em] text-[#15191a]">
        NEET PG {academicYear} cutoffs in {state}
      </h1>
      <p className="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-[#4e5654]">
        Closing ranks at {colleges.length} {colleges.length === 1 ? 'college' : 'colleges'} in {state},
        from {CUTOFF_SOURCE_LABEL}&apos;s official allotment result — every seat MCC allotted and the rank
        it went to. Open a college for its course-wise and category-wise closing ranks. These are
        MCC seats (All India Quota, deemed, DNB); {state}&apos;s state quota is counselled separately.
      </p>

      {groups.map(([type, list]) => (
        <section key={type} className="mt-10" aria-labelledby={`type-${type}`}>
          <h2 id={`type-${type}`} className="text-[22px] font-normal tracking-[-0.02em] text-[#15191a]">
            {COLLEGE_TYPE_LABEL[type]} <span className="text-[#6b7472]">· {list.length}</span>
          </h2>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {list.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/neet-pg-cutoffs/college/${c.slug}`}
                  className="flex flex-col gap-1 rounded-[10px] border border-black/[0.08] bg-white px-4 py-3 transition-colors hover:bg-[#faf9f6]"
                >
                  <span className="text-[14px] font-medium text-[#15191a]">{c.name}</span>
                  <span className="text-[12.5px] tabular-nums text-[#6b7472]">
                    {c.rowCount} cutoffs · best closing rank {c.bestRank?.toLocaleString('en-IN') ?? '—'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-12 rounded-[11px] border border-black/[0.08] bg-[#faf9f6] p-6">
        <h2 className="text-[19px] font-normal tracking-[-0.02em] text-[#15191a]">
          Which of these can your rank reach?
        </h2>
        <p className="mt-2 max-w-[58ch] text-[14px] leading-relaxed text-[#4e5654]">
          Enter your NEET PG {EXAM_YEAR} score. The predictor finds your rank in the official result and
          matches it against every closing rank on these pages for your category.
        </p>
        <Link
          href="/predictor"
          className="mt-5 inline-block rounded-[9px] bg-primary px-[22px] py-[13px] text-[14px] font-medium text-white transition-opacity hover:opacity-90"
        >
          Check my colleges
        </Link>
      </section>
    </>
  );
}
