import Link from 'next/link';
import { Download, Lock } from 'lucide-react';
import { formatDate, formatRankRange } from '@/lib/utils';
import { toDisplayRank } from '@/services/prediction/prediction.service';
import { CATEGORY_LABEL } from '@/lib/constants';
import type { Category, PredictionStatus } from '@prisma/client';

export interface PredictionHistoryItem {
  id: string;
  createdAt: Date;
  rankMin: number;
  rankMax: number;
  state: string;
  category: Category;
  status: PredictionStatus;
  confidence: number;
  reportId?: string | null;
}

/** History row — matching design doc 1e prediction history layout */
export function PredictionHistoryCard({ item }: { item: PredictionHistoryItem }) {
  const unlocked = item.status === 'UNLOCKED';
  // A locked row shows the coarse band, same as the detail page.
  const rank = toDisplayRank({
    status: unlocked ? 'UNLOCKED' : 'PREVIEW',
    rankMin: item.rankMin,
    rankMax: item.rankMax,
  });

  return (
    <article className="grid grid-cols-1 items-center gap-5 rounded-[11px] border border-black/[0.10] bg-white p-[20px] sm:grid-cols-[1.1fr_.9fr_.8fr_.8fr_auto]">
      {/* Date */}
      <div className="flex flex-col gap-[5px]">
        <span className="text-[12px] leading-none text-[#6b7472]">Prediction date</span>
        <time
          dateTime={new Date(item.createdAt).toISOString()}
          className="text-[14.5px] leading-none text-[#15191a]"
        >
          {formatDate(item.createdAt)}
        </time>
      </div>

      {/* Rank */}
      <div className="flex flex-col gap-[5px]">
        <span className="text-[12px] leading-none text-[#6b7472]">
          {rank.banded ? 'Rank band' : 'Estimated rank'}
        </span>
        <span className="text-[14.5px] leading-none tabular-nums text-[#15191a]">
          {formatRankRange(rank.min, rank.max)}
        </span>
      </div>

      {/* State */}
      <div className="flex flex-col gap-[5px]">
        <span className="text-[12px] leading-none text-[#6b7472]">State</span>
        <span className="text-[14.5px] leading-none text-[#15191a]">{item.state}</span>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-[5px]">
        <span className="text-[12px] leading-none text-[#6b7472]">Category</span>
        <span className="text-[14.5px] leading-none text-[#15191a]">
          {CATEGORY_LABEL[item.category]}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 gap-[9px]">
        <Link
          href={`/predictor/${item.id}`}
          className="rounded-[8px] border border-black/[0.14] bg-white px-4 py-2.5 text-[13px] font-medium leading-none text-[#15191a] transition-colors hover:bg-[#faf9f6]"
        >
          View report
        </Link>
        {unlocked && item.reportId ? (
          <a
            href={`/api/reports/${item.reportId}/download`}
            className="flex items-center gap-1.5 rounded-[8px] border border-[#cfdedb] bg-[#f4f7f6] px-4 py-2.5 text-[13px] font-medium leading-none text-[#0b544e] transition-colors hover:bg-[#e8f1ef]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Download PDF
          </a>
        ) : (
          <span className="flex items-center gap-1 rounded-[8px] border border-black/[0.10] bg-[#faf9f6] px-3 py-2.5 text-[12px] leading-none text-[#6b7472]">
            <Lock className="h-3 w-3" aria-hidden />
            Preview
          </span>
        )}
      </div>
    </article>
  );
}
