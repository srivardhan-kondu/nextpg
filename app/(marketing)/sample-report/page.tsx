import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import { siteConfig, pricing, PREDICTION_DISCLAIMER } from '@/config/site';
import { MarketingHeader } from '@/features/landing/components/marketing-header';
import { MarketingFooter } from '@/features/landing/components/marketing-footer';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/shared/stat-tile';
import { ConfidenceRing } from '@/components/shared/confidence-ring';
import { Disclaimer } from '@/components/shared/disclaimer';
import { OpportunityTable } from '@/features/predictor/components/opportunity-table';
import { BranchRecommendations } from '@/features/predictor/components/branch-recommendations';
import { StrategyNotes } from '@/features/predictor/components/strategy-notes';
import { SAMPLE_REPORT } from '@/features/landing/sample-data';

export const metadata: Metadata = {
  title: 'Sample Report',
  description: `See exactly what a ${siteConfig.brand} report contains before you buy a single credit.`,
};

const SECTIONS = [
  'Profile summary', 'Prediction summary', 'Estimated rank analysis', 'AIQ opportunities',
  'State quota opportunities', 'Dream branch validation', 'Dream college validation',
  'Recommended branches', 'Recommended colleges', 'Counseling strategy', 'Important notes',
];

export default async function SampleReportPage() {
  const session = await auth();

  return (
    <>
      <MarketingHeader isLoggedIn={Boolean(session?.user)} />

      <main id="main" className="mx-auto w-full max-w-5xl px-5 py-12 lg:py-16">
        <div className="text-center">
          <Badge variant="soft">Sample</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
            What your report looks like
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            This is a worked example for a fictional candidate, built with the same engine your report uses.
            Every figure below would come from real historical cutoffs.
          </p>
        </div>

        <Card className="mt-10">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between lg:p-7">
            <div>
              <p className="text-sm text-muted-foreground">
                {SAMPLE_REPORT.candidateName} · {SAMPLE_REPORT.state} · {SAMPLE_REPORT.category}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Estimated All India Rank</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-primary">
                {SAMPLE_REPORT.rankRange}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Expected score {SAMPLE_REPORT.expectedScore}/800
              </p>
            </div>
            <div className="flex items-center gap-4 sm:flex-col sm:items-end">
              <ConfidenceRing value={SAMPLE_REPORT.confidence} tone="strong" size={92} />
              <p className="text-sm font-medium text-muted-foreground">Confidence</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Expected score" value={SAMPLE_REPORT.expectedScore} hint="out of 800" />
          <StatTile label="Confidence" value={`${SAMPLE_REPORT.confidence}%`} tone="strong" />
          <StatTile label="AIQ opportunities" value={SAMPLE_REPORT.aiqCount} tone="primary" />
          <StatTile label="State quota opportunities" value={SAMPLE_REPORT.stateCount} tone="primary" />
        </div>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Recommended colleges</h2>
          <OpportunityTable rows={SAMPLE_REPORT.colleges} />
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Recommended branches</h2>
          <BranchRecommendations branches={SAMPLE_REPORT.branches} />
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Counseling strategy</h2>
          <StrategyNotes notes={SAMPLE_REPORT.strategy} />
        </section>

        <section className="mt-12">
          <Card className="bg-muted/40">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold tracking-tight">Your PDF contains</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {SECTIONS.map((section) => (
                  <li key={section} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-strong" aria-hidden />
                    <span>{section}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <div className="mt-12 rounded-2xl border border-primary/25 bg-primary-soft/50 p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Get your own report</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Run a free prediction to see your estimated rank range. Unlock the full analysis when you are ready —{' '}
            {pricing.credits} credits for {pricing.amountLabel}, no subscription.
          </p>
          <Button asChild size="xl" className="mt-6">
            <Link href="/predictor">
              Start prediction
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        <Disclaimer className="mt-8 justify-center" text={PREDICTION_DISCLAIMER} />
      </main>

      <MarketingFooter />
    </>
  );
}
