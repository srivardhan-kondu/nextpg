import { Building2, GraduationCap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConfidenceRing } from '@/components/shared/confidence-ring';
import { LikelihoodBadge } from '@/components/shared/likelihood-badge';
import { Disclaimer } from '@/components/shared/disclaimer';
import { formatRankRange } from '@/lib/utils';
import type { DreamValidationResult } from '@/types/prediction';
import type { Likelihood } from '@prisma/client';

const ringTone: Record<Likelihood, 'strong' | 'moderate' | 'stretch'> = {
  STRONG: 'strong',
  MODERATE: 'moderate',
  STRETCH: 'stretch',
  VERY_DIFFICULT: 'stretch',
};

export function DreamResult({ result }: { result: DreamValidationResult }) {
  const { branch, college } = result;

  return (
    <div className="space-y-5 animate-fade-up">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <ConfidenceRing
            value={branch.probability}
            tone={ringTone[branch.likelihood]}
            size={96}
            label={`${branch.probability}% chance of ${branch.branch}`}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
                {branch.branch}
              </h2>
              <LikelihoodBadge likelihood={branch.likelihood} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{branch.message}</p>
            {branch.seatsInRange > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {branch.seatsInRange} seat{branch.seatsInRange === 1 ? '' : 's'} within reach in our records.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {college ? (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Building2 className="h-4 w-4 text-primary" aria-hidden />
                  {college.collegeName}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{college.state}</p>
              </div>
              <LikelihoodBadge likelihood={college.likelihood} />
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{college.message}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-medium text-muted-foreground">Required rank range</p>
                <p className="mt-1 text-lg font-bold tracking-tight">
                  {college.requiredRankMin != null && college.requiredRankMax != null
                    ? formatRankRange(college.requiredRankMin, college.requiredRankMax)
                    : 'No data on record'}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-medium text-muted-foreground">Your estimated rank</p>
                <p className="mt-1 text-lg font-bold tracking-tight text-primary">
                  {formatRankRange(college.studentRankMin, college.studentRankMax)}
                </p>
              </div>
            </div>

            {college.eligibleQuotas.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Eligible quotas</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {college.eligibleQuotas.map((quota) => (
                    <Badge key={quota} variant="soft">
                      {quota}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {college.availableBranches.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Branches on record ({college.availableBranches.length})
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {college.availableBranches.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Disclaimer text={result.disclaimer} />
    </div>
  );
}
