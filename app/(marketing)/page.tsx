import { auth } from '@/auth';
import { siteConfig, EXAM_YEAR } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import { graph, faqSchema, webApplicationSchema } from '@/lib/seo/structured-data';
import { MarketingHeader } from '@/features/landing/components/marketing-header';
import { Hero } from '@/features/landing/components/hero';
import { FeatureCards } from '@/features/landing/components/feature-cards';
import { WhyChoose } from '@/features/landing/components/why-choose';
import { SampleReportCta } from '@/features/landing/components/sample-report-cta';
import { PricingSection } from '@/features/landing/components/pricing-section';
import { FaqSection, faqs } from '@/features/landing/components/faq-section';
import { MarketingFooter } from '@/features/landing/components/marketing-footer';

/**
 * The title leads with the query people actually type, not with the brand.
 * Nobody searches "NextPG Predictor" yet, so spending the first — and most
 * heavily weighted — words of the title on it forfeits the only relevance
 * signal we fully control. The brand still lands via the layout's template.
 */
export const metadata = pageMetadata({
  title: `NEET PG Rank Predictor ${EXAM_YEAR} — Predict Your Rank & Colleges`,
  description:
    `Free NEET PG ${EXAM_YEAR} rank predictor. Enter your expected score to get an estimated ` +
    'All India Rank, then see the MD/MS colleges and branches realistically open to you across ' +
    'AIQ, state and deemed quotas — matched against published closing ranks.',
  path: '/',
  keywords: [
    `NEET PG rank predictor ${EXAM_YEAR}`,
    'NEET PG college predictor',
    'NEET PG marks vs rank',
    'NEET PG cutoff',
    'AIQ counselling',
    'state quota PG seats',
    'MD MS college predictor',
  ],
});

export default async function LandingPage() {
  const session = await auth();

  return (
    <>
      <JsonLd data={graph(webApplicationSchema(), faqSchema(faqs))} />
      <MarketingHeader isLoggedIn={Boolean(session?.user)} />
      <main id="main">
        <Hero />
        <FeatureCards />
        <WhyChoose brand={siteConfig.brand} />
        <SampleReportCta />
        <PricingSection />
        <FaqSection />
      </main>
      <MarketingFooter />
    </>
  );
}
