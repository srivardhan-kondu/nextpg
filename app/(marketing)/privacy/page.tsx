import type { Metadata } from 'next';
import { LegalPage } from '../legal-layout';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${siteConfig.brand} collects, uses and protects your data.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="4 September 2026">
      <p>
        This policy explains what {siteConfig.brand} collects, why, and what control you have over it. We collect
        the minimum needed to run the Service.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>Account data.</strong> Your email address, and your name and profile picture if you sign in with
        Google. Optionally a phone number if you add one.
      </p>
      <p>
        <strong>Prediction inputs.</strong> The name, gender, state, category, sub-category, answer counts and
        expected score you enter. These are stored with each prediction as a snapshot so your past reports never
        change when you edit your profile.
      </p>
      <p>
        <strong>Payment data.</strong> Razorpay order and payment identifiers, amounts and status.{' '}
        <strong>We never receive or store your card details</strong> — those go directly to Razorpay.
      </p>
      <p>
        <strong>Technical data.</strong> IP address and user agent, recorded in audit logs for security and to
        enforce rate limits.
      </p>
      <p>
        <strong>Assistant conversations.</strong> If you use the counseling assistant, your questions and its
        answers are stored so the conversation has continuity.
      </p>

      <h2>What we do with it</h2>
      <ul>
        <li>Generate your predictions, validations and reports</li>
        <li>Maintain your credit balance and payment history</li>
        <li>Authenticate you and keep your account secure</li>
        <li>Detect abuse and enforce rate limits</li>
        <li>Understand aggregate usage — which branches and states are popular — to improve the product</li>
      </ul>
      <p>
        <strong>We do not sell your data.</strong> We do not share it with colleges, coaching institutes, or
        advertisers.
      </p>

      <h2>Who we share it with</h2>
      <p>Only the processors needed to operate:</p>
      <ul>
        <li><strong>Neon</strong> — database hosting</li>
        <li><strong>Vercel</strong> — application hosting</li>
        <li><strong>Razorpay</strong> — payment processing</li>
        <li><strong>Google</strong> — sign-in, only if you use it</li>
        <li><strong>Upstash</strong> — rate limiting (identifiers only, no personal content)</li>
        <li><strong>OpenAI</strong> — only if you use the counseling assistant; see below</li>
      </ul>

      <h2>The counseling assistant</h2>
      <p>
        If you use it, your question and a factual summary of your report (rank range, category, state, and the
        cutoff rows relevant to you) are sent to OpenAI to generate an answer. This is the only feature that
        sends your data to a third-party AI provider, and it is entirely optional — the rest of the Service works
        without it.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li><strong>Predictions and reports</strong> — kept while your account exists. You paid for permanent access, so we do not delete unlocked reports.</li>
        <li><strong>Payment records</strong> — retained as long as required by Indian tax and accounting law.</li>
        <li><strong>Audit logs</strong> — retained for security review.</li>
      </ul>

      <h2>Your rights</h2>
      <p>You can:</p>
      <ul>
        <li><strong>Access</strong> your data — most of it is visible in your dashboard</li>
        <li><strong>Correct</strong> your profile at any time from the profile page</li>
        <li><strong>Delete</strong> your account and all associated data by emailing us</li>
        <li><strong>Export</strong> your data — email us and we will send it in a machine-readable format</li>
      </ul>
      <p>
        Deleting your account removes your predictions, reports and conversations. Payment records are retained
        where the law requires it.
      </p>

      <h2>Security</h2>
      <ul>
        <li>All traffic is encrypted in transit (HTTPS, HSTS enforced)</li>
        <li>Login codes are stored hashed, never in plaintext</li>
        <li>Payment signatures are verified cryptographically in constant time</li>
        <li>Access to your reports is scoped to your account on every request</li>
        <li>Privileged actions are audit-logged</li>
      </ul>
      <p>
        No system is perfectly secure. If you believe your account has been compromised, contact us immediately.
      </p>

      <h2>Cookies</h2>
      <p>
        We use cookies only for authentication — to keep you signed in — and to remember your theme preference.
        We do not use advertising or third-party tracking cookies.
      </p>

      <h2>Children</h2>
      <p>
        The Service is for medical graduates preparing for postgraduate admission and is not directed at children
        under 18.
      </p>

      <h2>Changes</h2>
      <p>
        We will notify you of material changes by email or an in-app notice before they take effect.
      </p>

      <h2>Contact</h2>
      <p>
        For any privacy request or question:{' '}
        <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary underline underline-offset-2">
          {siteConfig.supportEmail}
        </a>
      </p>
    </LegalPage>
  );
}
