import Link from 'next/link';

/** Sample output card — right side of hero, exactly matching design doc 1a */
function SampleOutputCard() {
  return (
    <div className="rounded-[12px] border border-black/[0.10] bg-white shadow-[0_8px_28px_rgba(21,25,26,.07)] p-[26px] flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium leading-none tracking-[.09em] uppercase text-[#6b7472]">
          Sample output
        </span>
        <span className="text-[12px] leading-none text-[#6b7472]">Telangana · OBC-NCL</span>
      </div>

      {/* Rank */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[12.5px] leading-none text-[#6b7472]">Estimated all-India rank</span>
        <span className="text-[42px] leading-none tracking-[-0.03em] tabular-nums text-[#15191a]">
          12,000 – 16,500
        </span>
      </div>

      {/* Confidence bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] leading-none text-[#6b7472]">Confidence</span>
          <span className="text-[13px] font-medium leading-none tabular-nums text-[#0b544e]">78%</span>
        </div>
        <div className="h-[6px] overflow-hidden rounded-full bg-[#eceae5]">
          <div className="h-full w-[78%] rounded-full bg-primary" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5 rounded-[9px] border border-black/[0.07] bg-[#faf9f6] p-[14px]">
          <span className="text-[12px] leading-none text-[#6b7472]">AIQ opportunities</span>
          <span className="text-[24px] leading-none tabular-nums text-[#15191a]">64</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[9px] border border-black/[0.07] bg-[#faf9f6] p-[14px]">
          <span className="text-[12px] leading-none text-[#6b7472]">State quota</span>
          <span className="text-[24px] leading-none tabular-nums text-[#15191a]">28</span>
        </div>
      </div>

      {/* Strong possibilities */}
      <div className="flex flex-col gap-2.5 border-t border-black/[0.08] pt-[14px]">
        <span className="text-[12px] font-medium leading-none tracking-[.09em] uppercase text-[#6b7472]">
          Strong possibilities
        </span>
        <div className="flex flex-col gap-[7px]">
          {[
            { label: 'Pathology · Govt, State', badge: 'Strong', badgeColor: '#0f766e' },
            { label: 'Community Medicine · Govt, AIQ', badge: 'Strong', badgeColor: '#0f766e' },
            { label: 'Anaesthesia · Deemed', badge: 'Moderate', badgeColor: '#a07520' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[13.5px] leading-none text-[#15191a]">{row.label}</span>
              <span className="text-[13px] leading-none" style={{ color: row.badgeColor }}>
                {row.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11.5px] leading-relaxed text-[#6b7472]">
        Illustrative sample. Predictions are estimates based on historical trends.
      </p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="border-b border-black/[0.08] bg-[#faf9f6]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-16 px-10 pb-[68px] pt-[76px] lg:grid-cols-2">
        {/* Left column */}
        <div className="flex flex-col items-start gap-6 pt-3">
          {/* Badge pill */}
          <div className="flex items-center gap-2 rounded-full bg-[#e8f1ef] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            <span className="text-[12px] font-medium leading-none tracking-[.01em] text-[#0b544e]">
              NEET-PG 2026 · trends updated for the current cycle
            </span>
          </div>

          {/* Headline */}
          <h1 className="m-0 max-w-[15ch] text-[54px] font-normal leading-[1.06] tracking-[-0.028em] text-[#15191a]">
            Know your PG possibilities in 60 seconds
          </h1>

          {/* Sub-copy */}
          <p className="m-0 max-w-[46ch] text-[17.5px] leading-[1.55] text-[#4e5654]">
            Rank estimates, branch validation, college recommendations, AIQ insight and state quota
            opportunities — from the score you already have in your head.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center gap-3 mt-1.5">
            <Link
              href="/predictor"
              className="rounded-[9px] bg-primary px-[26px] py-[15px] text-[15px] font-medium leading-none text-white transition-opacity hover:opacity-90"
            >
              Start prediction
            </Link>
            <Link
              href="/sample-report"
              className="rounded-[9px] border border-black/[0.14] bg-white px-[24px] py-[14px] text-[15px] font-medium leading-none text-[#15191a] transition-colors hover:bg-[#faf9f6]"
            >
              View sample report
            </Link>
          </div>

          <p className="mt-0.5 text-[13px] leading-relaxed text-[#6b7472]">
            Free rank estimate. No card needed to see your range.
          </p>
        </div>

        {/* Right column — sample output card */}
        <SampleOutputCard />
      </div>
    </section>
  );
}
