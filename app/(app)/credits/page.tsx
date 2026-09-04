import type { Metadata } from 'next';
import { Check, Info } from 'lucide-react';

import { requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { getBalance, listTransactions } from '@/services/credit.service';
import { features } from '@/lib/env';
import { pricing, PER_REPORT_LABEL } from '@/config/site';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { BuyCreditsButton } from '@/features/credits/components/buy-credits-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/shared/stat-tile';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Buy Credits',
  description: `${pricing.credits} prediction credits for ${pricing.amountLabel}. No subscription.`,
};

const INCLUDED = [
  'Rank prediction with confidence score',
  'Branch analysis and recommendations',
  'College analysis across all bands',
  'AIQ opportunity analysis',
  'State quota opportunity analysis',
  'Dream branch validation',
  'Dream college validation',
  'Downloadable PDF report',
];

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await requireUser('/credits');
  const { next } = await searchParams;

  const [credit, transactions, profile] = await Promise.all([
    getBalance(user.id),
    listTransactions(user.id, 20),
    prisma.user.findUnique({ where: { id: user.id }, select: { phone: true } }),
  ]);

  // Only allow relative paths back into the app — an open redirect here would
  // let a crafted link bounce a paying user off-site.
  const nextPath = next && next.startsWith('/') && !next.startsWith('//') ? next : undefined;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Buy Credits"
        description="One credit generates one full report. No subscription, no auto-renewal."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Credits remaining" value={credit.balance} tone="primary" />
        <StatTile label="Credits used" value={credit.used} />
        <StatTile label="Credits purchased" value={credit.purchased} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{pricing.packName}</CardTitle>
              <Badge variant="soft">Best value</Badge>
            </div>
            <CardDescription>Everything below, five times over.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">{pricing.amountLabel}</span>
                <span className="text-sm text-muted-foreground">one-time · {pricing.credits} credits</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                About {PER_REPORT_LABEL} per report. No subscription, no auto-renewal.
              </p>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-strong" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {features.razorpay ? (
              <BuyCreditsButton
                user={{ name: user.name, email: user.email, phone: profile?.phone }}
                nextPath={nextPath}
                className="w-full sm:w-auto"
              />
            ) : (
              <Alert variant="warning">
                <Info aria-hidden />
                <AlertTitle>Payments are not configured</AlertTitle>
                <AlertDescription>
                  Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable checkout.
                </AlertDescription>
              </Alert>
            )}

            <p className="text-xs leading-relaxed text-muted-foreground">
              Credits never expire. Unlocked reports stay accessible forever and re-downloading them is always
              free. Payments are processed by Razorpay — we never see your card details.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credit history</CardTitle>
            <CardDescription>Every purchase and every unlock.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No credit activity yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {transactions.map((transaction) => (
                  <li key={transaction.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{transaction.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(transaction.createdAt)}
                        {transaction.payment ? ` · ${formatCurrency(transaction.payment.amount)}` : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        transaction.amount > 0 ? 'text-strong' : 'text-muted-foreground'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {transaction.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
