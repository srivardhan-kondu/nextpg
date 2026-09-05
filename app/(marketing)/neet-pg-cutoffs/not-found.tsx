import Link from 'next/link';

/**
 * `notFound()` looks for the nearest not-found boundary from the segment that
 * threw. Without one here the root boundary does not take over: the response
 * came back 200 with an empty body — a soft 404, which Google treats as a
 * low-quality page and can index. This boundary restores the 404 status and
 * gives the visitor a route back into the data we do have.
 */
export default function CutoffsNotFound() {
  return (
    <div className="py-6">
      <p className="text-[13px] uppercase tracking-[.08em] text-[#6b7472]">404</p>
      <h1 className="mt-3 text-[30px] font-normal tracking-[-0.025em] text-[#15191a]">
        We have no verified cutoffs for that page
      </h1>
      <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-[#4e5654]">
        Either the college or branch does not exist, or we have not yet verified enough of its
        closing ranks to publish a page. We only publish figures we have checked against the
        official counselling result.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          href="/neet-pg-cutoffs"
          className="rounded-[9px] bg-primary px-[22px] py-[13px] text-[14px] font-medium text-white transition-opacity hover:opacity-90"
        >
          Browse all cutoffs
        </Link>
        <Link
          href="/"
          className="rounded-[9px] border border-black/[0.14] bg-white px-[20px] py-[12px] text-[14px] font-medium text-[#15191a] transition-colors hover:bg-[#faf9f6]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
