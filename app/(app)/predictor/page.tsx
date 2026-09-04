import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { predictionRepository } from '@/repositories/prediction.repository';
import { MainTabs } from '@/components/shared/main-tabs';
import { PredictionForm } from '@/features/predictor/components/prediction-form';
import { formatDate, formatRankRange } from '@/lib/utils';
import { toDisplayRank } from '@/services/prediction/prediction.service';

export const metadata: Metadata = {
  title: 'Rank & College Predictor',
  description: 'Estimate your NEET PG rank and discover the colleges and branches within reach.',
};

export default async function PredictorPage() {
  const user = await requireUser('/predictor');

  const [profile, recent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, gender: true, defaultState: true, defaultCategory: true, defaultSubCategory: true },
    }),
    predictionRepository.listForUser(user.id, { perPage: 3 }),
  ]);

  return (
    <div className="space-y-0">
      {/* Tab strip — matching design doc 1b */}
      <div className="border-b border-black/[0.08]">
        <MainTabs />
      </div>

      {/* Form panel */}
      <div className="px-0 py-[44px] sm:px-0 lg:px-0">
        {/* Section header */}
        <div className="mb-8 flex flex-col gap-1.5">
          <h1 className="text-[27px] font-normal leading-[1.2] tracking-[-0.02em] text-[#15191a]">
            Let&apos;s estimate your rank
          </h1>
          <p className="text-[14.5px] leading-[1.55] text-[#6b7472]">
            Rough answers are fine — we&apos;ll show you a range, not a false promise.
          </p>
        </div>

        <PredictionForm
          defaults={{
            candidateName: profile?.name ?? '',
            gender: profile?.gender ?? undefined,
            state: profile?.defaultState ?? undefined,
            category: profile?.defaultCategory ?? undefined,
            subCategory: profile?.defaultSubCategory ?? 'NONE',
          }}
        />

        {/* Recent predictions — compact list below form */}
        {recent.items.length > 0 && (
          <div className="mt-10 border-t border-black/[0.08] pt-8">
            <div className="mb-4 flex items-baseline justify-between">
              <span className="text-[14px] font-medium text-[#15191a]">Recent predictions</span>
              {recent.total > recent.items.length && (
                <Link href="/reports" className="text-[13px] text-primary hover:opacity-80">
                  View all {recent.total}
                </Link>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {recent.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/predictor/${item.id}`}
                  className="flex items-center justify-between rounded-[9px] border border-black/[0.08] bg-[#faf9f6] px-4 py-3 transition-colors hover:bg-[#f0f0ec]"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] font-medium tabular-nums text-[#15191a]">
                      {(() => {
                        const rank = toDisplayRank({
                          status: item.status === 'UNLOCKED' ? 'UNLOCKED' : 'PREVIEW',
                          rankMin: item.rankMin,
                          rankMax: item.rankMax,
                        });
                        return formatRankRange(rank.min, rank.max);
                      })()}
                    </span>
                    <span className="text-[12px] text-[#6b7472]">
                      {formatDate(item.createdAt)} · {item.status === 'UNLOCKED' ? 'Unlocked' : 'Preview'}
                    </span>
                  </div>
                  <span className="text-[12px] text-primary">View →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
