import { RuleBasedPredictionProvider } from './rule-based.provider';
import type { PredictionInput, PredictionProvider, PredictionResult } from '@/types/prediction';

/**
 * Multi-year trend provider (scaffold).
 *
 * Intent: instead of reading a single year's closing ranks, fit a per-seat trend
 * across `historical_cutoffs` (year over year drift, round-wise loosening) and
 * project the current year's cutoff before banding.
 *
 * Until the multi-year corpus is loaded it delegates to the rule-based engine so
 * the app behaves identically — flipping PREDICTION_PROVIDER is always safe.
 */
export class FutureHistoricalProvider implements PredictionProvider {
  readonly id = 'historical';
  readonly version = 'historical-v0-delegating';
  readonly label = 'Multi-year historical trend engine';

  private readonly fallback = new RuleBasedPredictionProvider();

  async predict(input: PredictionInput): Promise<PredictionResult> {
    const result = await this.fallback.predict(input);
    return {
      ...result,
      providerId: this.id,
      engineVersion: this.version,
      notes: [
        ...result.notes,
        'Multi-year trend projection is not yet active; this estimate uses the latest available year.',
      ],
    };
  }
}
