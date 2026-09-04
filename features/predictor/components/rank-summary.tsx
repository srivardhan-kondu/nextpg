import { Lock } from 'lucide-react';

import { ConfidenceRing } from '@/components/shared/confidence-ring';
import { StatTile } from '@/components/shared/stat-tile';
import { Disclaimer } from '@/components/shared/disclaimer';
import { formatRankRange } from '@/lib/utils';

interface RankSummaryProps {
  expectedScore: number;
  rankMin: number;
  rankMax: number;
  /** The range shown is a coarse bucket, not the computed one. */
  banded?: boolean;
  /** Null while the prediction is locked. */
  confidence: number | null;
  percentile: number | null;
  aiqOpportunities: number;
  stateOpportunities: number;
}

/**
 * The headline block: rank, confidence, and the opportunity counts.
 *
 * Takes already-redacted values — it never decides what a locked user may see,
 * it only renders what buildPredictionView handed it.
 */
export function RankSummary({
  expectedScore,
  rankMin,
  rankMax,
  banded = false,
  confidence,
  percentile,
  aiqOpportunities,
  stateOpportunities,
}: RankSummaryProps) {
  const tone = confidence === null ? 'moderate' : confidence >= 70 ? 'strong' : confidence >= 50 ? 'moderate' : 'stretch';

  return (
    <div className="space-y-4">
      <div className="surface flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {banded ? 'Estimated rank band' : 'Estimated All India Rank'}
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-primary lg:text-[2.75rem]">
            {formatRankRange(rankMin, rankMax)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Expected score {expectedScore}/800
            {percentile !== null ? ` · ${percentile.toFixed(2)} percentile` : null}
          </p>
          {banded ? (
            <p className="mt-1 text-sm font-medium text-primary">
              Unlock to see your exact range and confidence.
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
          {confidence === null ? (
            <>
              <span
                className="grid h-[92px] w-[92px] place-items-center rounded-full border-2 border-dashed border-border text-muted-foreground"
                aria-label="Confidence score locked"
              >
                <Lock className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-medium text-muted-foreground">Confidence locked</p>
            </>
          ) : (
            <>
              <ConfidenceRing value={confidence} tone={tone} label={`${confidence}% confidence`} size={92} />
              <p className="text-sm font-medium text-muted-foreground">Confidence</p>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Expected score" value={`${expectedScore}`} hint="out of 800" />
        <StatTile
          label="Confidence"
          value={confidence === null ? '—' : `${confidence}%`}
          tone={confidence === null ? undefined : tone}
          hint={confidence === null ? 'unlock to view' : 'never a guarantee'}
        />
        <StatTile label="AIQ opportunities" value={aiqOpportunities} tone="primary" hint="All India Quota seats" />
        <StatTile
          label="State quota opportunities"
          value={stateOpportunities}
          tone="primary"
          hint="Domicile, deemed & private"
        />
      </div>

      <Disclaimer />
    </div>
  );
}
