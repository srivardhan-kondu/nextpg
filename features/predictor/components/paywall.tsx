import { Check, Infinity as InfinityIcon, Lock, RotateCcw } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { pricing, PER_REPORT_LABEL } from '@/config/site';
import { UnlockButton } from './unlock-button';

const LOCKED_FEATURES = [
  'Every matching college, ranked by reachability',
  'AIQ opportunity breakdown',
  'State quota opportunity breakdown',
  'Branch recommendations for your rank',
  'Dream branch and college validation',
  'Counseling strategy, round by round',
  'Downloadable PDF report',
  'Counseling assistant for follow-up questions',
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
 *
 * The conversion framing is deliberately factual: the seat counts are this
 * user's real numbers, the unit price is derived from what we actually charge,
 * and the refund line matches the published policy. No countdowns, no invented
 * scarcity — a student deciding whether to spend money deserves the real terms.
 */
export function Paywall({ predictionId, balance, teaser }: PaywallProps) {
  const hasCredits = balance > 0;

  return (
    <Card className="overflow-hidden border-primary/25 bg-gradient-to-b from-primary-soft/60 to-card">
      <CardContent className="p-6 lg:p-8">
        {/* Hook: lead with this student's own numbers, not a generic pitch. */}
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Lock className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
              {teaser.collegeCount} seats match your rank
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {teaser.aiqOpportunities} in All India Quota and {teaser.stateOpportunities} in state quota,
              across {teaser.branchCount} branches. Unlock to see exactly which colleges and branches they are.
            </p>
          </div>
        </div>

        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {LOCKED_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-strong" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Price framing: the pack price is the number they pay, the unit price
            is the number that makes the decision feel small. Both are real. */}
        <div className="mt-6 rounded-[10px] border border-primary/20 bg-card/70 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {hasCredits ? (
                <>
                  <p className="text-2xl font-bold tracking-tight">
                    1 credit
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {balance} left in your account
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Already paid for — unlock this report now.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold tracking-tight">
                    {pricing.amountLabel}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      for {pricing.credits} reports
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    About {PER_REPORT_LABEL} per report. No subscription, no auto-renewal.
                  </p>
                </>
              )}
            </div>

            <UnlockButton predictionId={predictionId} balance={balance} className="shrink-0" />
          </div>

          {/* Risk reversal. Both lines match the published refund policy. */}
          <div className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground sm:flex-row sm:gap-6">
            <span className="flex items-center gap-1.5">
              <InfinityIcon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              Yours permanently — re-open and re-download free, forever
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              Unused credits refunded within 7 days
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
