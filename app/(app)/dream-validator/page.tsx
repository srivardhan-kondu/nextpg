import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Sparkles, Target } from 'lucide-react';

import { requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { MainTabs } from '@/components/shared/main-tabs';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { DreamValidatorForm } from '@/features/dream/components/dream-validator-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { LikelihoodBadge } from '@/components/shared/likelihood-badge';
import { formatDate, formatRankRange } from '@/lib/utils';
import { CATEGORY_LABEL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Dream Validator',
  description: 'Check whether your dream branch and dream college are realistic at your estimated rank.',
};

export default async function DreamValidatorPage({
  searchParams,
}: {
  searchParams: Promise<{ predictionId?: string }>;
}) {
  const user = await requireUser('/dream-validator');
  const { predictionId } = await searchParams;

  // Prefer an explicitly requested prediction; otherwise fall back to the most
  // recent unlocked one, since the validator needs premium data.
  const prediction = predictionId
    ? await prisma.prediction.findFirst({ where: { id: predictionId, userId: user.id } })
    : await prisma.prediction.findFirst({
        where: { userId: user.id, status: 'UNLOCKED' },
        orderBy: { createdAt: 'desc' },
      });

  const anyPrediction =
    prediction ??
    (await prisma.prediction.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }));

  const history = prediction
    ? await prisma.dreamValidation.findMany({
        where: { userId: user.id, predictionId: prediction.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
      })
    : [];

  const header = (
    <>
      <PageHeader
        title="Dream Validator"
        description="Test your dream branch and dream college against your estimated rank — grounded in historical closing ranks."
      />
      <MainTabs />
    </>
  );

  if (!anyPrediction) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={Target}
          title="Run a prediction first"
          description="The validator needs your estimated rank range before it can tell you anything useful about a dream branch or college."
          action={
            <Button asChild>
              <Link href="/predictor">Start prediction</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!prediction || prediction.status !== 'UNLOCKED') {
    const target = prediction ?? anyPrediction;
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={Lock}
          title="Unlock your report to validate a dream"
          description="Dream validation reads the same premium cutoff analysis as your full report. Unlocking that report enables it."
          action={
            <Button asChild>
              <Link href={`/predictor/${target.id}`}>View prediction &amp; unlock</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <Card className="bg-muted/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Validating against</p>
            <p className="mt-0.5 font-semibold">
              {formatRankRange(prediction.rankMin, prediction.rankMax)}
            </p>
            <p className="text-xs text-muted-foreground">
              {prediction.candidateName} · {prediction.state} · {CATEGORY_LABEL[prediction.category]} ·{' '}
              {formatDate(prediction.createdAt)}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/predictor/${prediction.id}`}>View full report</Link>
          </Button>
        </CardContent>
      </Card>

      <DreamValidatorForm predictionId={prediction.id} />

      {history.length > 0 ? (
        <section aria-labelledby="dream-history" className="space-y-3">
          <h2 id="dream-history" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            Previous validations
          </h2>
          <ul className="space-y-2.5">
            {history.map((item) => (
              <li key={item.id} className="surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {item.dreamBranch}
                      {item.dreamCollege ? (
                        <span className="text-muted-foreground"> · {item.dreamCollege}</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{item.branchProbability}%</Badge>
                    <LikelihoodBadge likelihood={item.branchLikelihood} />
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.branchMessage}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
