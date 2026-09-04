import Link from 'next/link';
import { pricing } from '@/config/site';

/** Credits widget — pinned at bottom of sidebar, matching design doc 1e style */
export function CreditWidget({ balance }: { balance: number }) {
  const maxCredits = pricing.credits; // 5 per pack
  const fillPct = Math.min(100, Math.round((balance / Math.max(balance, maxCredits)) * 100));

  return (
    <div className="rounded-[10px] border border-black/[0.10] bg-white p-4 flex flex-col gap-2.5 shadow-[0_1px_3px_rgba(21,25,26,.04)]">
      <span className="text-[12px] leading-none text-[#6b7472]">Credits remaining</span>
      <span className="text-[28px] leading-none tabular-nums text-[#15191a]">{balance}</span>
      {/* Progress bar */}
      <div className="h-[5px] overflow-hidden rounded-full bg-[#eceae5]">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <Link
        href="/credits"
        className="block rounded-[7px] bg-primary py-[10px] text-center text-[12.5px] font-medium leading-none text-white transition-opacity hover:opacity-90"
      >
        Buy 5 more · {pricing.amountLabel}
      </Link>
    </div>
  );
}
