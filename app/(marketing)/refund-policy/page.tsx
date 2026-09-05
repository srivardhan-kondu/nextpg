import { LegalPage } from '../legal-layout';
import { siteConfig, pricing } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Refund Policy',
  description: `Cancellation and refund terms for ${siteConfig.brand} credits.`,
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" updated="4 September 2026">
      <p>
        We want you to buy credits knowing exactly where you stand. This policy is deliberately short and plain.
      </p>

      <h2>Before you buy</h2>
      <p>
        You can run a prediction and see your estimated rank range, confidence score and opportunity counts{' '}
        <strong>for free</strong>, before paying anything. A{' '}
        <a href="/sample-report" className="text-primary underline underline-offset-2">sample report</a> shows
        exactly what a credit unlocks. Please use both before purchasing.
      </p>

      <h2>Unused credits</h2>
      <p>
        <strong>Fully refundable within 7 days.</strong> If you have bought a pack and not spent any of it, email
        us within 7 days of purchase and we will refund the full {pricing.amountLabel} to the original payment
        method.
      </p>

      <h2>Partially used credits</h2>
      <p>
        We refund on a <strong>pro-rata</strong> basis within 7 days of purchase. Each unlocked report counts as
        one credit consumed; we refund the value of the credits remaining.
      </p>

      <h2>Fully used credits</h2>
      <p>
        Once all credits in a pack have been spent on reports, that pack is not refundable. The reports have been
        generated and remain yours to access permanently.
      </p>

      <h2>Technical failures</h2>
      <p>
        <strong>Always refunded, without a time limit.</strong> If a credit was deducted but no report was
        produced, or a payment succeeded but credits were not added, contact us and we will either restore the
        credit or refund it — whichever you prefer. This is our error, not yours.
      </p>
      <p>
        Credits are never charged for re-opening or re-downloading a report you have already unlocked. If you
        believe you were charged twice for the same report, tell us and we will correct it.
      </p>

      <h2>What is not refundable</h2>
      <p>
        We cannot refund on the basis that a prediction did not match your actual rank or counselling outcome.
        Predictions are estimates presented as ranges with stated confidence, and this is made clear before and
        throughout purchase. The Service provides analysis, not a guaranteed result.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Email{' '}
        <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary underline underline-offset-2">
          {siteConfig.supportEmail}
        </a>{' '}
        from your registered address, with your payment ID (visible on the Credits page) and a one-line reason.
      </p>
      <ul>
        <li>We respond within <strong>1 working day</strong>.</li>
        <li>Approved refunds are initiated within <strong>3 working days</strong>.</li>
        <li>Razorpay typically returns funds to your account within <strong>5–7 working days</strong> after that.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions about this policy:{' '}
        <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary underline underline-offset-2">
          {siteConfig.supportEmail}
        </a>
      </p>
    </LegalPage>
  );
}
