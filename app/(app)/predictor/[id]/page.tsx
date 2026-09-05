import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download, MessageCircle, Sparkles } from 'lucide-react';

import { requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { getBalance } from '@/services/credit.service';
import { buildPredictionView } from '@/services/prediction/prediction.service';
import { features } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/features/dashboard/components/page-header';
import { RankSummary } from '@/features/predictor/components/rank-summary';
import { BandSections } from '@/features/predictor/components/band-sections';
import { BranchRecommendations } from '@/features/predictor/components/branch-recommendations';
import { StrategyNotes } from '@/features/predictor/components/strategy-notes';
import { OpportunityTable } from '@/features/predictor/components/opportunity-table';
import { Paywall } from '@/features/predictor/components/paywall';
import { DreamTeaser } from '@/features/predictor/components/dream-teaser';
import { CounselingAssistant } from '@/features/assistant/components/counseling-assistant';
import { CATEGORY_LABEL } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Prediction result' };

export default async function PredictionResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/predictor/${id}`);

  const prediction = await prisma.prediction.findFirst({
    where: { id, userId: user.id },
    include: { reports: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!prediction) notFound();

  const credit = await getBalance(user.id);
  // Redaction happens here: a locked view never carries the premium payload.
  const view = buildPredictionView(prediction);
  const { result } = view;

  const aiqRows = view.locked
    ? []
    : [...result.bands.STRONG, ...result.bands.MODERATE, ...result.bands.STRETCH]
        .filter((o) => o.quota === 'AIQ')
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 15);

  const stateRows = view.locked
    ? []
    : [...result.bands.STRONG, ...result.bands.MODERATE, ...result.bands.STRETCH]
        .filter((o) => o.quota !== 'AIQ')
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 15);

  const report = prediction.reports[0];

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Prediction for ${prediction.candidateName}`}
        description={`${prediction.state} · ${CATEGORY_LABEL[prediction.category]} · Generated ${formatDateTime(prediction.createdAt)}`}
        action={
          view.locked ? (
            <Badge variant="secondary">Preview</Badge>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/dream-validator?predictionId=${prediction.id}`}>
                  <Sparkles aria-hidden />
                  Validate a dream
                </Link>
              </Button>
              {report ? (
                <Button asChild>
                  {/* Streams a PDF — must not be a client-side navigation. */}
                  <a href={`/api/reports/${report.id}/download`}>
                    <Download aria-hidden />
                    Download PDF
                  </a>
                </Button>
              ) : null}
            </div>
          )
        }
      />

      <RankSummary
        expectedScore={prediction.expectedScore}
        rankMin={prediction.rankMin}
        rankMax={prediction.rankMax}
        confidence={prediction.confidence}
        percentile={prediction.percentile ?? result.percentile}
        aiqOpportunities={prediction.aiqOpportunities}
        stateOpportunities={prediction.stateOpportunities}
      />

      {view.locked ? (
        <>
          <Paywall predictionId={prediction.id} balance={credit.balance} teaser={view.teaser} />
          <DreamTeaser predictionId={prediction.id} locked balance={credit.balance} />
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">College possibilities</CardTitle>
              <CardDescription>
                Grouped by how reachable each seat is at your estimated rank. Chance percentages are estimates,
                not guarantees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BandSections bands={result.bands} />
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AIQ analysis</CardTitle>
                <CardDescription>
                  {prediction.aiqOpportunities} All India Quota seats matched. No domicile requirement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpportunityTable rows={aiqRows} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">State quota analysis</CardTitle>
                <CardDescription>
                  {prediction.stateOpportunities} seats via {prediction.state} domicile, deemed and private quotas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpportunityTable rows={stateRows} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommended branches</CardTitle>
              <CardDescription>Ranked by how reachable they are at your estimated rank.</CardDescription>
            </CardHeader>
            <CardContent>
              <BranchRecommendations branches={result.recommendedBranches} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommended colleges</CardTitle>
              <CardDescription>Your strongest realistic seats, best options first.</CardDescription>
            </CardHeader>
            <CardContent>
              <OpportunityTable rows={result.recommendedColleges} />
            </CardContent>
          </Card>

          <DreamTeaser predictionId={prediction.id} locked={false} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Counseling strategy</CardTitle>
              <CardDescription>How to sequence your choices during counseling.</CardDescription>
            </CardHeader>
            <CardContent>
              <StrategyNotes notes={result.strategy} />
            </CardContent>
          </Card>

          {features.assistant ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-4 w-4 text-primary" aria-hidden />
                  Counseling assistant
                </CardTitle>
                <CardDescription>
                  Ask about your results. The assistant only uses the data in this report — it will tell you when
                  it does not know something.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CounselingAssistant predictionId={prediction.id} />
              </CardContent>
            </Card>
          ) : null}
        </>
      )}

      <Card className="bg-muted/40">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold">Important notes</h2>
          <ul className="mt-2 space-y-1.5">
            {result.notes.map((note, index) => (
              <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                <span aria-hidden className="text-primary">
                  •
                </span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
