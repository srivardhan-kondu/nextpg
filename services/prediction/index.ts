import type { PredictionProvider } from '@/types/prediction';
import { RuleBasedPredictionProvider } from './providers/rule-based.provider';
import { FutureHistoricalProvider } from './providers/historical.provider';
import { FutureMLPredictionProvider } from './providers/ml.provider';

const registry: Record<string, () => PredictionProvider> = {
  'rule-based': () => new RuleBasedPredictionProvider(),
  historical: () => new FutureHistoricalProvider(),
  ml: () => new FutureMLPredictionProvider(),
};

/**
 * Resolves the active engine from PREDICTION_PROVIDER. Unknown values fall back
 * to the rule-based engine rather than throwing — a bad env var must not take
 * down predictions in production.
 */
export function getPredictionProvider(override?: string): PredictionProvider {
  const key = override ?? process.env.PREDICTION_PROVIDER ?? 'rule-based';
  const factory = registry[key] ?? registry['rule-based']!;
  return factory();
}

export { RuleBasedPredictionProvider, FutureHistoricalProvider, FutureMLPredictionProvider };
export * from './scoring';
