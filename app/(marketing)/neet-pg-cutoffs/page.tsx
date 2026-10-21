import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LATEST_CUTOFF_YEAR, EXAM_YEAR } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import { graph, breadcrumbSchema } from '@/lib/seo/structured-data';
import { seoRepository } from '@/repositories/seo.repository';
import { branchLabel, slugify } from '@/lib/utils';

/** Colleges grouped by state, states alphabetical, colleges by name within each. */
function byState<T extends { state: string; name: string }>(colleges: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const c of colleges) groups.set(c.state, [...(groups.get(c.state) ?? []), c]);
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([state, list]) => [state, list.sort((a, b) => a.name.localeCompare(b.name))]);
}

/** One query pair per render, shared by generateMetadata and the page. */
const loadHub = cache(async () => {
  const [colleges, branches] = await Promise.all([
    seoRepository.publishedColleges(),
    seoRepository.publishedBranches(),
  ]);
  return { colleges, branches, hasData: colleges.length > 0 || branches.length > 0 };
});

/**
 * Until verified cutoffs exist this page is a placeholder, and an indexed
 * placeholder is thin content that counts against the whole domain. So it is
 * `noindex` (links still followed) until there is data, and indexable the day
 * the first verified import lands — no code change needed.
 */
export async function generateMetadata(): Promise<Metadata> {
  let hasData = false;
  try {
    ({ hasData } = await loadHub());
  } catch {
    // Database unreachable: the page itself will fail; keep metadata safe.
  }

  return pageMetadata({
    title: `NEET PG Cutoff ${LATEST_CUTOFF_YEAR} — Closing Ranks by College & Branch`,
    description:
      `Published NEET PG ${LATEST_CUTOFF_YEAR} closing ranks for MD and MS seats, broken down by ` +
      'college, branch, quota and category. Every figure is traced to its counselling source.',
    path: '/neet-pg-cutoffs',
    noindex: !hasData,
    keywords: [
      `NEET PG cutoff ${LATEST_CUTOFF_YEAR}`,
      'NEET PG closing rank',
      'MD MS cutoff college wise',
      'AIQ closing rank NEET PG',
    ],
  });
}

/**
 * Revalidated daily. Cutoff data changes only when an admin verifies an import,
 * so a static page regenerated once a day gives crawlers a fast, cacheable
 * response without ever serving a stale counselling season.
 */
export const revalidate = 86400;

export default async function CutoffHubPage() {
  const { colleges, branches, hasData } = await loadHub();

  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: `NEET PG cutoffs ${LATEST_CUTOFF_YEAR}`, path: '/neet-pg-cutoffs' },
          ]),
        )}
      />

      <h1 className="text-[38px] font-normal leading-[1.1] tracking-[-0.025em] text-[#15191a]">
        NEET PG {LATEST_CUTOFF_YEAR} cutoffs
      </h1>
      <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-[#4e5654]">
        Closing ranks from the {LATEST_CUTOFF_YEAR} counselling cycle, by college and by branch,
        split across All India Quota, state, deemed and management seats. Every row below is a
        published figure we have verified against its source — we do not estimate, interpolate or
        fill gaps.
      </p>

      {!hasData ? (
        /* Publishing nothing beats publishing unverified closing ranks: a
           candidate plans a career around these numbers. Pages appear here
           automatically once verified data is imported. */
        <div className="mt-8 rounded-[11px] border border-black/[0.08] bg-[#faf9f6] p-6">
          <h2 className="text-[17px] font-medium text-[#15191a]">Cutoff tables are being verified</h2>
          <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-[#4e5654]">
            We publish a college or branch page only once its closing ranks have been checked
            against the official counselling result. Until then, you can still get a personalised
            estimate from the predictor.
          </p>
          <Link
            href="/predictor"
            className="mt-5 inline-block rounded-[9px] bg-primary px-[22px] py-[13px] text-[14px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Estimate my NEET PG {EXAM_YEAR} rank
          </Link>
        </div>
      ) : (
        <>
          {branches.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[24px] font-normal tracking-[-0.02em] text-[#15191a]">
                Cutoffs by branch
              </h2>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {branches.map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={`/neet-pg-cutoffs/branch/${b.slug}`}
                      className="flex items-center justify-between rounded-[10px] border border-black/[0.08] bg-white px-4 py-3 text-[14px] transition-colors hover:bg-[#faf9f6]"
                    >
                      <span className="font-medium text-[#15191a]">
                        {branchLabel(b)}
                      </span>
                      <span className="text-[12.5px] tabular-nums text-[#6b7472]">
                        {b.rowCount} cutoffs
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {colleges.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[24px] font-normal tracking-[-0.02em] text-[#15191a]">
                Cutoffs by college
              </h2>
              <p className="mt-2 text-[14px] text-[#6b7472]">
                {colleges.length.toLocaleString('en-IN')} colleges. Pick a state to see its colleges.
              </p>
              {/* One link per state rather than per college: a thousand college
                  links on one page weighed over a megabyte. Each state page
                  links on to its colleges, so crawlers still reach every one. */}
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {byState(colleges).map(([state, list]) => (
                  <li key={state}>
                    <Link
                      href={`/neet-pg-cutoffs/state/${slugify(state)}`}
                      className="flex items-center justify-between rounded-[10px] border border-black/[0.08] bg-white px-4 py-3 text-[14px] transition-colors hover:bg-[#faf9f6]"
                    >
                      <span className="font-medium text-[#15191a]">{state}</span>
                      <span className="text-[12.5px] tabular-nums text-[#6b7472]">
                        {list.length} {list.length === 1 ? 'college' : 'colleges'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
