'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, CreditCard, Lock, Unlock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { unlockPredictionAction } from '@/actions/prediction.actions';
import { pricing } from '@/config/site';

const LOCKED_FEATURES = [
  'Detailed college analysis across all bands',
  'AIQ opportunity breakdown',
  'State quota opportunity breakdown',
  'Dream branch validation',
  'Dream college validation',
  'Downloadable PDF report',
  'Counseling strategy for your rank',
];

interface PaywallProps {
  predictionId: string;
  balance: number;
  teaser: {
    aiqOpportunities: number;
    stateOpportunities: number;
    collegeCount: number;
    branchCount: number;
  };
}

/**
 * The unlock gate. Everything behind it is redacted server-side — this component
 * never receives the locked data, so there is nothing to reveal in devtools.
 */
export function Paywall({ predictionId, balance, teaser }: PaywallProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const hasCredits = balance > 0;

  async function unlock() {
    setPending(true);
    const formData = new FormData();
    formData.append('predictionId', predictionId);

    const result = await unlockPredictionAction({ status: 'idle' }, formData);

    if (result.status === 'success') {
      toast.success('Report unlocked. It is yours forever.');
      router.refresh();
      return;
    }

    setPending(false);
    if (result.status === 'error') {
      toast.error(result.message);
      if (result.needsCredits) router.push('/credits');
    }
  }

  return (
    <Card className="border-primary/25 bg-gradient-to-b from-primary-soft/60 to-card">
      <CardContent className="p-6 lg:p-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">
            <Lock className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Unlock your full report</h2>
            <p className="text-sm text-muted-foreground">
              We found {teaser.collegeCount} matching seats — {teaser.aiqOpportunities} AIQ and{' '}
              {teaser.stateOpportunities} state quota — across {teaser.branchCount} branches.
            </p>
          </div>
        </div>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {LOCKED_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-strong" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {hasCredits ? (
              <>
                Uses <span className="font-semibold text-foreground">1 credit</span>. You have{' '}
                <span className="font-semibold text-foreground">{balance}</span>.
              </>
            ) : (
              <>
                {pricing.credits} credits for{' '}
                <span className="font-semibold text-foreground">{pricing.amountLabel}</span>. No subscription.
              </>
            )}
          </p>

          {hasCredits ? (
            <Button size="lg" onClick={unlock} loading={pending}>
              <Unlock aria-hidden />
              Unlock full report
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href={`/credits?next=${encodeURIComponent(`/predictor/${predictionId}`)}`}>
                <CreditCard aria-hidden />
                Get {pricing.credits} credits for {pricing.amountLabel}
              </Link>
            </Button>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          One credit unlocks this report permanently. Re-opening or re-downloading it later is always free.
        </p>
      </CardContent>
    </Card>
  );
}
