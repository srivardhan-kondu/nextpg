import Link from 'next/link';
import { pricing, PER_REPORT_LABEL } from '@/config/site';

const included = [
  'Rank prediction & confidence band',
  'Branch & college analysis',
  'AIQ + state quota breakdown',
  'Dream branch & college validation',
  'Downloadable PDF report',
];

const bullets = [
  `Works out to about ${PER_REPORT_LABEL} per report`,
  'Reports stay in your account forever',
  'Credits never expire',
  'Unused credits refunded within 7 days',
];

/** Pricing section — 2-column layout matching design doc 1a pricing block */
export function PricingSection() {
  return (
    <section
      id="pricing"
      className="border-b border-black/[0.08] bg-[#faf9f6] px-10 py-[66px]"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_420px]">
        {/* Left — copy */}
        <div className="flex flex-col gap-3.5">
          <h2 className="m-0 text-[32px] font-normal leading-[1.15] tracking-[-0.02em] text-[#15191a]">
            No subscription. Just credits.
          </h2>
          <p className="m-0 max-w-[48ch] text-[15.5px] leading-[1.55] text-[#4e5654]">
            One credit generates a full report — rank analysis, AIQ and state quota opportunities,
            dream validation and a PDF. Reopening old reports is always free.
          </p>
          <ul className="mt-2 flex flex-col gap-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2.5">
                <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-primary" aria-hidden />
                <span className="text-[14.5px] leading-none text-[#4e5654]">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — pricing card */}
        <div className="flex flex-col gap-5 rounded-[12px] border border-black/[0.12] bg-white p-[30px] shadow-[0_4px_20px_rgba(21,25,26,.06)]">
          <span className="text-[12px] font-medium leading-none tracking-[.09em] uppercase text-[#6b7472]">
            Prediction credits
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-[48px] leading-none tracking-[-0.03em] text-[#15191a]">
              {pricing.amountLabel}
            </span>
            <span className="text-[14.5px] leading-none text-[#6b7472]">
              for {pricing.credits} credits
            </span>
          </div>

          <div className="h-px bg-black/[0.08]" />

          <ul className="flex flex-col gap-2.5">
            {included.map((item) => (
              <li key={item} className="text-[14px] leading-relaxed text-[#4e5654]">
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/credits"
            className="block rounded-[9px] bg-primary py-[15px] text-center text-[15px] font-medium leading-none text-white transition-opacity hover:opacity-90"
          >
            Get {pricing.credits} prediction credits
          </Link>

          <p className="text-center text-[12px] leading-relaxed text-[#6b7472]">
            Secure payment via Razorpay · UPI, cards, netbanking
          </p>
        </div>
      </div>
    </section>
  );
}
