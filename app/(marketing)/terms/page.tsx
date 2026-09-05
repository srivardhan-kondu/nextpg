import { LegalPage } from '../legal-layout';
import { siteConfig, pricing, PREDICTION_DISCLAIMER } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description: `Terms governing your use of ${siteConfig.brand}.`,
  path: '/terms',
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="4 September 2026">
      <p>
        These terms govern your use of {siteConfig.brand} (&ldquo;the Service&rdquo;). By creating an account
        you agree to them. If you do not agree, please do not use the Service.
      </p>

      <h2>1. What the Service is — and is not</h2>
      <p>
        {siteConfig.brand} is an <strong>independent planning tool</strong> for NEET PG aspirants. It estimates
        a likely rank range from your expected score and matches that range against historical closing ranks to
        show which colleges and branches may be within reach.
      </p>
      <p>
        We are <strong>not affiliated with</strong> NBEMS, the Medical Counselling Committee (MCC), any State
        counselling authority, or any medical college. We do not allot seats, influence counselling, or have
        access to official results.
      </p>

      <h2>2. Predictions are estimates</h2>
      <p>{PREDICTION_DISCLAIMER}</p>
      <p>
        Every rank we show is a <strong>range</strong> with a stated confidence figure, never a guarantee. Actual
        ranks depend on the whole candidate cohort, the final answer key and normalisation — none of which are
        knowable in advance. Cutoffs shift year to year.
      </p>
      <p>
        <strong>You are responsible for your counselling decisions.</strong> Always verify seat matrices,
        cutoffs, fees and eligibility on the official counselling portal before locking any choice.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>You must provide an accurate email address and keep access to it secure.</li>
        <li>One account per person. Do not share credentials.</li>
        <li>You must be legally eligible to appear for NEET PG or be acting on behalf of someone who is.</li>
        <li>We may suspend an account that abuses the Service, attempts to circumvent payment, or attacks our infrastructure.</li>
      </ul>

      <h2>4. Credits and payments</h2>
      <ul>
        <li>The Service uses credits. There is no subscription and nothing auto-renews.</li>
        <li>One pack costs {pricing.amountLabel} and contains {pricing.credits} credits.</li>
        <li><strong>One credit unlocks one report.</strong> Viewing or re-downloading an unlocked report is free, permanently.</li>
        <li>Credits do not expire.</li>
        <li>Credits have no cash value and are not transferable between accounts.</li>
        <li>Payments are processed by Razorpay. We never see or store your card details.</li>
      </ul>
      <p>
        See our <a href="/refund-policy" className="text-primary underline underline-offset-2">Refund Policy</a>{' '}
        for cancellations and refunds.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Scrape, bulk-download or resell our cutoff data or predictions</li>
        <li>Attempt to access reports, accounts or data that are not yours</li>
        <li>Circumvent credit deduction, rate limits or the paywall</li>
        <li>Automate account creation or use the Service through unauthorised clients</li>
        <li>Upload content that is unlawful, or attempt to manipulate our systems through crafted input</li>
      </ul>

      <h2>6. Intellectual property</h2>
      <p>
        The Service, its interface, prediction methodology and generated reports are our property. Your report
        is yours to use personally; you may not republish it commercially or present our analysis as your own
        product.
      </p>

      <h2>7. Availability</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted service. Counselling season brings
        traffic spikes, and maintenance may occasionally be necessary. We are not liable for losses arising from
        downtime.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, our total liability to you for any claim relating to the Service
        is limited to the amount you paid us in the twelve months preceding the claim.
      </p>
      <p>
        <strong>We are not liable for counselling outcomes.</strong> This includes seats not obtained, choices
        made or not made, or decisions taken in reliance on a prediction. The Service is informational.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these terms. Material changes will be notified by email or an in-app notice. Continued use
        after a change constitutes acceptance.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the
        courts of India.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms:{' '}
        <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary underline underline-offset-2">
          {siteConfig.supportEmail}
        </a>
      </p>
    </LegalPage>
  );
}
