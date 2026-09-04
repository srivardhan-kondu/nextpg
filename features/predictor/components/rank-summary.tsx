import { ConfidenceRing } from '@/components/shared/confidence-ring';
import { StatTile } from '@/components/shared/stat-tile';
import { Disclaimer } from '@/components/shared/disclaimer';
import { formatRankRange } from '@/lib/utils';

interface RankSummaryProps {
  expectedScore: number;
  rankMin: number;
  rankMax: number;
  confidence: number;
  percentile: number;
  aiqOpportunities: number;
  stateOpportunities: number;
}

/** The headline block: rank range, confidence, and the opportunity counts. */
export function RankSummary({
  expectedScore,
  rankMin,
  rankMax,
  confidence,
  percentile,
  aiqOpportunities,
  stateOpportunities,
}: RankSummaryProps) {
  const tone = confidence >= 70 ? 'strong' : confidence >= 50 ? 'moderate' : 'stretch';

  return (
    <div className="space-y-4">
      <div className="surface flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Estimated All India Rank</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-primary lg:text-[2.75rem]">
            {formatRankRange(rankMin, rankMax)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Expected score {expectedScore}/800 · {percentile.toFixed(2)} percentile
          </p>
        </div>

        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
          <ConfidenceRing value={confidence} tone={tone} label={`${confidence}% confidence`} size={92} />
          <p className="text-sm font-medium text-muted-foreground">Confidence</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Expected score" value={`${expectedScore}`} hint="out of 800" />
        <StatTile label="Confidence" value={`${confidence}%`} tone={tone} hint="never a guarantee" />
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
