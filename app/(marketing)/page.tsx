import { auth } from '@/auth';
import { siteConfig } from '@/config/site';
import { MarketingHeader } from '@/features/landing/components/marketing-header';
import { Hero } from '@/features/landing/components/hero';
import { FeatureCards } from '@/features/landing/components/feature-cards';
import { WhyChoose } from '@/features/landing/components/why-choose';
import { SampleReportCta } from '@/features/landing/components/sample-report-cta';
import { PricingSection } from '@/features/landing/components/pricing-section';
import { FaqSection } from '@/features/landing/components/faq-section';
import { MarketingFooter } from '@/features/landing/components/marketing-footer';

export default async function LandingPage() {
  const session = await auth();

  return (
    <>
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
