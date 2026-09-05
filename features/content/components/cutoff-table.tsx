import Link from 'next/link';
import type { Category, CollegeType, QuotaType, SubCategory } from '@prisma/client';
import { CATEGORY_LABEL, COLLEGE_TYPE_LABEL, QUOTA_LABEL } from '@/lib/constants';

export interface CutoffRow {
  closingRank: number;
  openingRank: number | null;
  seatCount: number;
  quota: QuotaType;
  category: Category;
  subCategory: SubCategory;
  round: number;
  source: string | null;
  /** Present on branch pages, absent on college pages, and vice versa. */
  college?: { name: string; shortName: string | null; slug: string; state: string; type: CollegeType };
  branch?: { name: string; slug: string; degree: string };
}

const fmt = (n: number) => n.toLocaleString('en-IN');

/**
 * The closing-rank table. Rendered as real server HTML — no client-side
 * fetching — because a table a crawler cannot read is worth nothing, and the
 * whole point of these pages is that the numbers are in the initial payload.
 *
 * `overflow-x-auto` keeps the page body from scrolling sideways on mobile,
 * which is what Google actually measures for mobile usability.
 */
export function CutoffTable({ rows, caption }: { rows: CutoffRow[]; caption: string }) {
  const showCollege = rows.some((r) => r.college);

  return (
    <div className="overflow-x-auto rounded-[11px] border border-black/[0.08] bg-white">
      <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-black/[0.08] bg-[#faf9f6] text-left text-[12px] uppercase tracking-[.07em] text-[#6b7472]">
            <th scope="col" className="px-4 py-3 font-medium">{showCollege ? 'College' : 'Branch'}</th>
            <th scope="col" className="px-4 py-3 font-medium">Quota</th>
            <th scope="col" className="px-4 py-3 font-medium">Category</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Closing rank</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Seats</th>
            <th scope="col" className="px-4 py-3 font-medium">Round</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={`${r.college?.slug ?? r.branch?.slug}-${r.quota}-${r.category}-${r.subCategory}-${r.round}-${i}`}
              className="border-b border-black/[0.06] last:border-0"
            >
              <td className="px-4 py-3 text-[#15191a]">
                {r.college ? (
                  <>
                    <Link
                      href={`/neet-pg-cutoffs/college/${r.college.slug}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {r.college.shortName ?? r.college.name}
                    </Link>
                    <span className="block text-[12px] text-[#6b7472]">
                      {r.college.state} · {COLLEGE_TYPE_LABEL[r.college.type]}
                    </span>
                  </>
                ) : r.branch ? (
                  <>
                    <Link
                      href={`/neet-pg-cutoffs/branch/${r.branch.slug}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {r.branch.name}
                    </Link>
                    <span className="block text-[12px] text-[#6b7472]">{r.branch.degree}</span>
                  </>
                ) : null}
              </td>
              <td className="px-4 py-3 text-[#4e5654]">{QUOTA_LABEL[r.quota]}</td>
              <td className="px-4 py-3 text-[#4e5654]">
                {CATEGORY_LABEL[r.category]}
                {r.subCategory !== 'NONE' && (
                  <span className="text-[#6b7472]"> · {r.subCategory.replace('_', ' ')}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-[#15191a]">
                {fmt(r.closingRank)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-[#4e5654]">
                {r.seatCount > 0 ? fmt(r.seatCount) : '—'}
              </td>
              <td className="px-4 py-3 text-[#4e5654]">R{r.round}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Provenance strip. Naming the counselling source under every table is the
 * cheapest E-E-A-T signal available to us and the one aggregators skip.
 */
export function SourceNote({ sources, academicYear }: { sources: string[]; academicYear: number }) {
  if (sources.length === 0) return null;

  return (
    <p className="mt-3 text-[12.5px] leading-relaxed text-[#6b7472]">
      <span className="font-medium text-[#4e5654]">Source:</span>{' '}
      {sources.join(' · ')} — {academicYear} counselling. Figures are the published closing ranks
      for that round and are not a prediction of {academicYear + 1} cutoffs.
    </p>
  );
}
