import type { Metadata } from 'next';
import Link from 'next/link';
import { History } from 'lucide-react';

import { requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { predictionRepository } from '@/repositories/prediction.repository';
import { MainTabs } from '@/components/shared/main-tabs';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { PredictionForm } from '@/features/predictor/components/prediction-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatRankRange } from '@/lib/utils';

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
    <div className="space-y-6">
      <PageHeader
        title="Rank & College Predictor"
        description="Enter your details and expected performance. We estimate your rank and match it against historical closing ranks."
      />

      <MainTabs />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <PredictionForm
          defaults={{
            candidateName: profile?.name ?? '',
            gender: profile?.gender ?? undefined,
            state: profile?.defaultState ?? undefined,
            category: profile?.defaultCategory ?? undefined,
            subCategory: profile?.defaultSubCategory ?? 'NONE',
          }}
        />

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4 text-primary" aria-hidden />
                Recent predictions
              </h2>

              {recent.items.length === 0 ? (
                <p className="mt-2.5 text-sm text-muted-foreground">
                  Your predictions will appear here once you run one.
                </p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {recent.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/predictor/${item.id}`}
                        className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                      >
                        <p className="text-sm font-semibold">{formatRankRange(item.rankMin, item.rankMax)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(item.createdAt)} · {item.status === 'UNLOCKED' ? 'Unlocked' : 'Preview'}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {recent.total > recent.items.length ? (
                <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
                  <Link href="/reports">View all {recent.total}</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-muted/40">
            <CardContent className="p-5 text-sm">
              <h2 className="font-semibold">How the estimate works</h2>
              <ul className="mt-2.5 space-y-2 text-muted-foreground">
                <li>Your score is mapped to a rank using published score-vs-rank data.</li>
                <li>That point estimate is widened into a range — the honest output.</li>
                <li>
                  Every college shown is backed by a real historical closing rank. We never invent cutoffs.
                </li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
