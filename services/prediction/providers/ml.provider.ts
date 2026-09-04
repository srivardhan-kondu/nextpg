import { RuleBasedPredictionProvider } from './rule-based.provider';
import type { PredictionInput, PredictionProvider, PredictionResult } from '@/types/prediction';

/**
 * ML provider (scaffold).
 *
 * Intent: POST the feature vector to a hosted model that returns a rank
 * distribution, then reuse the banding/strategy layer unchanged. The contract is
 * already the same shape, so switching engines is a config change, not a rewrite.
 *
 * Delegates to the rule-based engine until ML_ENDPOINT is configured.
 */
export class FutureMLPredictionProvider implements PredictionProvider {
  readonly id = 'ml';
  readonly version = 'ml-v0-delegating';
  readonly label = 'ML rank distribution engine';

  private readonly fallback = new RuleBasedPredictionProvider();

  async predict(input: PredictionInput): Promise<PredictionResult> {
    const result = await this.fallback.predict(input);
    return {
      ...result,
      providerId: this.id,
      engineVersion: this.version,
      notes: [...result.notes, 'ML scoring is not yet enabled; this estimate uses the rule-based engine.'],
    };
  }
}
