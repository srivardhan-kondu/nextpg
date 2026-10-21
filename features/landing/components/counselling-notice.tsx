import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { EXAM_YEAR } from '@/config/site';
import { currentStage } from '@/lib/content/counselling';

/**
 * A one-line strip under the header with the current MCC counselling stage.
 * It is the homepage's link into the counselling guide, and the stage text
 * keeps the page current while counselling runs. The page revalidates hourly,
 * so the stage is never more than an hour behind.
 */
export function CounsellingNotice() {
  const stage = currentStage();

  return (
    <div className="border-b border-[#0b544e]/15 bg-[#e8f1ef]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-5 py-2.5 lg:px-10">
        <p className="text-[13px] leading-snug text-[#0b544e]">
          <span className="font-medium">NEET PG {EXAM_YEAR} counselling:</span>{' '}
          {stage ?? 'all MCC rounds for this cycle have closed.'}
        </p>
        <Link
          href="/neet-pg-counselling"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0b544e] underline-offset-2 hover:underline"
        >
          Dates, fees &amp; process
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
