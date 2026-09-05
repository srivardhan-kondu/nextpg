import Link from 'next/link';
import { CreditCard, HelpCircle, Mail, ShieldQuestion } from 'lucide-react';

import { auth } from '@/auth';
import { MarketingHeader } from '@/features/landing/components/marketing-header';
import { MarketingFooter } from '@/features/landing/components/marketing-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { siteConfig, pricing, PREDICTION_DISCLAIMER } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Help & Support',
  description: `Answers to common questions about ${siteConfig.brand} predictions, credits and reports.`,
  path: '/support',
});

const FAQS = [
  {
    question: 'How accurate is the rank prediction?',
    answer:
      'It is an estimate, presented as a range with a confidence score. Your score is mapped to a rank using published score-vs-rank data, then widened to reflect real uncertainty. Plan against the upper bound of the range.',
  },
  {
    question: 'Does opening an old report cost a credit?',
    answer:
      'No. A credit is spent once, when you unlock a report. After that the report is yours permanently — viewing and downloading it are always free.',
  },
  {
    question: 'Do credits expire?',
    answer: `No. Your ${pricing.credits} credits stay in your account until you use them. There is no subscription and nothing auto-renews.`,
  },
  {
    question: 'Where does the cutoff data come from?',
    answer:
      'Published closing ranks from MCC and state counseling authorities. Every college we show is backed by a stored cutoff row — we never generate or guess a cutoff.',
  },
  {
    question: 'My payment succeeded but I have no credits.',
    answer:
      'Credits are granted by a server-side webhook, which can lag by a minute. Refresh your dashboard first. If they are still missing, email us with your payment ID and we will fix it.',
  },
  {
    question: 'Can I get a refund?',
    answer:
      'Unused credits are fully refundable within 7 days, and partially used packs are refunded pro-rata. If a credit was deducted without producing a report, we always make it right. See the refund policy for details.',
  },
];

/** Public on purpose — it is linked from the marketing footer and from the app sidebar. */
export default async function SupportPage() {
  const session = await auth();

  return (
    <>
      <MarketingHeader isLoggedIn={Boolean(session?.user)} />

      <main id="main" className="mx-auto w-full max-w-3xl px-5 py-12 lg:py-16">
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Help &amp; Support</h1>
        <p className="mt-2 text-muted-foreground">Answers to the questions we get most often.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4 text-primary" aria-hidden />
                Email us
              </CardTitle>
              <CardDescription>We reply within one working day.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" aria-hidden />
                Credits &amp; billing
              </CardTitle>
              <CardDescription>Check your balance and history.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/credits">Open credits</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4 text-primary" aria-hidden />
              Frequently asked questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              {FAQS.map((faq) => (
                <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
                  <dt className="font-medium">{faq.question}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="mt-5 bg-muted/40">
          <CardContent className="flex gap-3 p-5">
            <ShieldQuestion className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-medium">A note on what this tool is</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {PREDICTION_DISCLAIMER} {siteConfig.brand} is an independent planning tool and is not
                affiliated with NBEMS, MCC, or any state counseling authority.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <MarketingFooter />
    </>
  );
}
