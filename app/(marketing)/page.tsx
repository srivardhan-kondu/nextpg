import { siteConfig, EXAM_YEAR } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import { graph, faqSchema, webApplicationSchema } from '@/lib/seo/structured-data';
import { MarketingHeader } from '@/features/landing/components/marketing-header';
import { CounsellingNotice } from '@/features/landing/components/counselling-notice';
import { Hero } from '@/features/landing/components/hero';
import { FeatureCards } from '@/features/landing/components/feature-cards';
import { WhyChoose } from '@/features/landing/components/why-choose';
import { SampleReportCta } from '@/features/landing/components/sample-report-cta';
import { PricingSection } from '@/features/landing/components/pricing-section';
import { FaqSection, faqs } from '@/features/landing/components/faq-section';
import { MarketingFooter } from '@/features/landing/components/marketing-footer';

/**
 * Static, regenerated hourly so the counselling notice tracks MCC's schedule.
 * Nothing here reads the session: the header resolves login state on the
 * client, which keeps this page cacheable at the CDN.
 */
export const revalidate = 3600;

/**
 * The title leads with the query people actually type, not with the brand.
 * Nobody searches "NextPG Predictor" yet, so spending the first — and most
 * heavily weighted — words of the title on it forfeits the only relevance
 * signal we fully control. The brand still lands via the layout's template.
 *
 * "Counselling" queries belong to /neet-pg-counselling. Targeting them here
 * too would have the two pages compete for the same searches.
 */
export const metadata = pageMetadata({
  title: `NEET PG Rank & College Predictor ${EXAM_YEAR} — AIQ & State Quota`,
  description:
    `Free NEET PG ${EXAM_YEAR} rank predictor and college predictor. Enter your score to get an ` +
    'estimated All India Rank, then see which MD/MS colleges and branches are realistic for your ' +
    'rank, category and quota — across AIQ, state and deemed seats.',
  path: '/',
  keywords: [
    `NEET PG rank predictor ${EXAM_YEAR}`,
    `NEET PG college predictor ${EXAM_YEAR}`,
    'NEET PG marks vs rank',
    'MD MS college predictor',
    'NEET PG expected rank calculator',
    'AIQ and state quota PG seats',
    'best college for NEET PG rank',
  ],
});

export default function LandingPage() {
  return (
    <>
      <JsonLd data={graph(webApplicationSchema(), faqSchema(faqs, '/'))} />
      <MarketingHeader />
      <CounsellingNotice />
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
