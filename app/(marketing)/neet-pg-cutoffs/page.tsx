import Link from 'next/link';
import { LATEST_CUTOFF_YEAR, EXAM_YEAR } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import { graph, breadcrumbSchema } from '@/lib/seo/structured-data';
import { COLLEGE_TYPE_LABEL } from '@/lib/constants';
import { seoRepository } from '@/repositories/seo.repository';

export const metadata = pageMetadata({
  title: `NEET PG Cutoff ${LATEST_CUTOFF_YEAR} — Closing Ranks by College & Branch`,
  description:
    `Published NEET PG ${LATEST_CUTOFF_YEAR} closing ranks for MD and MS seats, broken down by ` +
    'college, branch, quota and category. Every figure is traced to its counselling source.',
  path: '/neet-pg-cutoffs',
  keywords: [
    `NEET PG cutoff ${LATEST_CUTOFF_YEAR}`,
    'NEET PG closing rank',
    'MD MS cutoff college wise',
    'AIQ closing rank NEET PG',
  ],
});

/**
 * Revalidated daily. Cutoff data changes only when an admin verifies an import,
 * so a static page regenerated once a day gives crawlers a fast, cacheable
 * response without ever serving a stale counselling season.
 */
export const revalidate = 86400;

export default async function CutoffHubPage() {
  const [colleges, branches] = await Promise.all([
    seoRepository.publishedColleges(),
    seoRepository.publishedBranches(),
  ]);

  const hasData = colleges.length > 0 || branches.length > 0;

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
                        {b.degree} {b.name}
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
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {colleges.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/neet-pg-cutoffs/college/${c.slug}`}
                      className="flex flex-col gap-1 rounded-[10px] border border-black/[0.08] bg-white px-4 py-3 transition-colors hover:bg-[#faf9f6]"
                    >
                      <span className="text-[14px] font-medium text-[#15191a]">{c.name}</span>
                      <span className="text-[12.5px] text-[#6b7472]">
                        {[c.city, c.state].filter(Boolean).join(', ')} ·{' '}
                        {COLLEGE_TYPE_LABEL[c.type]} · {c.rowCount} cutoffs
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
