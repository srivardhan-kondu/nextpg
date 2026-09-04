import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';

import { requireUser } from '@/lib/auth/guards';
import { predictionRepository } from '@/repositories/prediction.repository';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { PredictionHistoryCard } from '@/features/dashboard/components/prediction-history-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Disclaimer } from '@/components/shared/disclaimer';

export const metadata: Metadata = { title: 'My Reports' };

const PER_PAGE = 10;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser('/reports');
  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);

  const history = await predictionRepository.listForUser(user.id, { page: current, perPage: PER_PAGE });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Reports"
        description="Every prediction you have run. Unlocked reports stay available forever — re-opening or re-downloading never costs a credit."
        action={
          <Button asChild>
            <Link href="/predictor">New prediction</Link>
          </Button>
        }
      />

      {history.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Run a prediction to generate your first report. You will be able to download it as a PDF once unlocked."
          action={
            <Button asChild>
              <Link href="/predictor">Start prediction</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {history.items.map((item) => (
              <PredictionHistoryCard
                key={item.id}
                item={{
                  id: item.id,
                  createdAt: item.createdAt,
                  rankMin: item.rankMin,
                  rankMax: item.rankMax,
                  state: item.state,
                  category: item.category,
                  status: item.status,
                  confidence: item.confidence,
                  reportId: item.reports[0]?.id ?? null,
                }}
              />
            ))}
          </div>

          {history.pages > 1 ? (
            <nav className="flex items-center justify-between" aria-label="Pagination">
              <Button asChild variant="outline" size="sm" disabled={current <= 1}>
                <Link href={`/reports?page=${current - 1}`} aria-disabled={current <= 1}>
                  Previous
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Page {current} of {history.pages}
              </p>
              <Button asChild variant="outline" size="sm" disabled={current >= history.pages}>
                <Link href={`/reports?page=${current + 1}`} aria-disabled={current >= history.pages}>
                  Next
                </Link>
              </Button>
            </nav>
          ) : null}
        </>
      )}

      <Disclaimer />
    </div>
  );
}
