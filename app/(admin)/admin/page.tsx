import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, TrendingUp } from 'lucide-react';

import { requireAdmin } from '@/lib/auth/guards';
import { analyticsRepository } from '@/repositories/analytics.repository';
import { StatTile } from '@/components/shared/stat-tile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { TrendChart } from '@/features/admin/components/trend-chart';
import { RankedList } from '@/features/admin/components/ranked-list';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = { title: 'Admin analytics' };
export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const [overview, branches, colleges, states, predictionsByDay, revenueByDay, coverage] = await Promise.all([
    analyticsRepository.overview(),
    analyticsRepository.topBranches(),
    analyticsRepository.topColleges(),
    analyticsRepository.topStates(),
    analyticsRepository.predictionsByDay(30),
    analyticsRepository.revenueByDay(30),
    analyticsRepository.dataCoverage(),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader title="Analytics" description="Product and revenue metrics across the whole platform." />

      <section aria-labelledby="core-metrics" className="space-y-4">
        <h2 id="core-metrics" className="sr-only">
          Core metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total users" value={overview.totalUsers} />
          <StatTile label="Paid users" value={overview.paidUsers} tone="primary" />
          <StatTile label="Revenue" value={formatCurrency(overview.revenuePaise)} tone="strong" />
          <StatTile
            label="Conversion rate"
            value={`${overview.conversionRate}%`}
            hint="paid users ÷ total users"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Credits sold" value={overview.creditsSold} />
          <StatTile label="Credits used" value={overview.creditsUsed} />
          <StatTile label="Predictions run" value={overview.predictionVolume} />
          <StatTile
            label="Payment success rate"
            value={`${overview.paymentSuccessRate}%`}
            tone={overview.paymentSuccessRate >= 90 ? 'strong' : 'moderate'}
            hint="paid ÷ attempted"
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
              Prediction volume
            </CardTitle>
            <CardDescription>Last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={predictionsByDay.map((d) => ({ date: d.date, value: d.count }))}
              label="Predictions"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue</CardTitle>
            <CardDescription>Last 30 days, in rupees.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={revenueByDay.map((d) => ({ date: d.date, value: d.revenue }))}
              label="Revenue"
              prefix="₹"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <RankedList title="Most selected branches" items={branches} emptyMessage="No dream branches selected yet." />
        <RankedList title="Most selected colleges" items={colleges} emptyMessage="No dream colleges selected yet." />
        <RankedList title="Top states" items={states} emptyMessage="No predictions yet." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" aria-hidden />
            Data coverage
          </CardTitle>
          <CardDescription>
            Prediction quality is bounded by this. Thin cutoff data lowers every confidence score.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatTile label="Colleges" value={coverage.colleges} />
            <StatTile label="Branches" value={coverage.branches} />
            <StatTile
              label="Cutoff rows"
              value={coverage.cutoffs}
              tone={coverage.cutoffs < 1000 ? 'stretch' : 'strong'}
            />
            <StatTile label="Quota rules" value={coverage.quotaRules} />
            <StatTile label="Latest year" value={coverage.latestYear ?? '—'} />
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/import">Bulk import data</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
