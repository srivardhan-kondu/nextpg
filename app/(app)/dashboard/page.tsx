import type { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, FileText, Sparkles, Target } from 'lucide-react';

import { requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { getBalance } from '@/services/credit.service';
import { predictionRepository } from '@/repositories/prediction.repository';
import { paymentRepository } from '@/repositories/payment.repository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/shared/stat-tile';
import { EmptyState } from '@/components/shared/empty-state';
import { Disclaimer } from '@/components/shared/disclaimer';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { PredictionHistoryCard } from '@/features/dashboard/components/prediction-history-card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { pricing } from '@/config/site';

export const metadata: Metadata = { title: 'Dashboard' };

const PAYMENT_BADGE = {
  PAID: 'strong',
  CREATED: 'secondary',
  ATTEMPTED: 'moderate',
  FAILED: 'stretch',
  REFUNDED: 'secondary',
} as const;

export default async function DashboardPage() {
  const user = await requireUser('/dashboard');

  const [credit, history, payments, reportCount] = await Promise.all([
    getBalance(user.id),
    predictionRepository.listForUser(user.id, { perPage: 5 }),
    paymentRepository.listForUser(user.id, 5),
    prisma.report.count({ where: { userId: user.id } }),
  ]);

  const firstName = user.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your predictions, credits and reports in one place."
        action={
          <Button asChild size="lg">
            <Link href="/predictor">
              <Target aria-hidden />
              New prediction
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="credits-heading">
        <h2 id="credits-heading" className="sr-only">
          Credit summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Credits remaining"
            value={credit.balance}
            tone={credit.balance > 0 ? 'primary' : 'stretch'}
            hint={credit.balance === 0 ? 'Buy a pack to unlock reports' : '1 credit = 1 full report'}
          />
          <StatTile label="Credits used" value={credit.used} hint="Reports unlocked so far" />
          <StatTile label="Credits purchased" value={credit.purchased} hint="Across all payments" />
          <StatTile label="Reports" value={reportCount} hint="Free to re-download forever" />
        </div>
      </section>

      {credit.balance === 0 ? (
        <Card className="border-primary/30 bg-primary-soft/50">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">You are out of credits</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Get {pricing.credits} prediction credits for {pricing.amountLabel} — no subscription, no renewal.
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/credits">
                <CreditCard aria-hidden />
                Get {pricing.credits} credits
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section aria-labelledby="history-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="history-heading" className="text-lg font-semibold tracking-tight">
            Prediction history
          </h2>
          {history.items.length > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/reports">View all</Link>
            </Button>
          ) : null}
        </div>

        {history.items.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No predictions yet"
            description="Run your first prediction to see your estimated rank, matching colleges and branch options."
            action={
              <Button asChild>
                <Link href="/predictor">Start prediction</Link>
              </Button>
            }
          />
        ) : (
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
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payments</CardTitle>
            <CardDescription>Your credit purchases.</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.creditsSold} credits · {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <Badge variant={PAYMENT_BADGE[payment.status]}>{payment.status.toLowerCase()}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next steps</CardTitle>
            <CardDescription>Get the most out of your credits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/predictor">
                <Target aria-hidden />
                Run a rank &amp; college prediction
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dream-validator">
                <Sparkles aria-hidden />
                Validate your dream branch or college
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/reports">
                <FileText aria-hidden />
                Download a past report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Disclaimer />
    </div>
  );
}
