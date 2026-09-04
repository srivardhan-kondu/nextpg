import type { Likelihood } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { LIKELIHOOD_META } from '@/lib/constants';

const variantFor: Record<Likelihood, 'strong' | 'moderate' | 'stretch'> = {
  STRONG: 'strong',
  MODERATE: 'moderate',
  STRETCH: 'stretch',
  VERY_DIFFICULT: 'stretch',
};

export function LikelihoodBadge({ likelihood }: { likelihood: Likelihood }) {
  return <Badge variant={variantFor[likelihood]}>{LIKELIHOOD_META[likelihood].label}</Badge>;
}
