import Link from 'next/link';

/** Minimal sample-report call-to-action — warm neutral style matching design doc. */
export function SampleReportCta() {
  return (
    <section className="border-b border-black/[0.08] bg-white py-14">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 px-10 sm:flex-row">
        <div className="flex flex-col gap-2">
          <h2 className="text-[20px] font-normal leading-[1.2] tracking-[-0.01em] text-[#15191a]">
            See what a full report looks like
          </h2>
          <p className="text-[14px] leading-relaxed text-[#6b7472]">
            Browse a sample prediction before you run your own.
          </p>
        </div>
        <Link
          href="/sample-report"
          className="shrink-0 rounded-[8px] border border-black/[0.14] bg-white px-5 py-3 text-[13.5px] font-medium leading-none text-[#15191a] transition-colors hover:bg-[#faf9f6]"
        >
          View sample report
        </Link>
      </div>
    </section>
  );
}
