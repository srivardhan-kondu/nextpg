import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pricing } from '@/config/site';

const included = [
  'Rank Prediction',
  'Branch Analysis',
  'College Analysis',
  'AIQ Analysis',
  'State Quota Analysis',
  'Dream Branch Validation',
  'Dream College Validation',
  'Downloadable PDF Report',
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-b border-border/60 bg-background py-16">
      <div className="container max-w-3xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Simple, one-time pricing</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          No subscriptions. Buy credits once and use them whenever you like — your reports stay accessible forever.
        </p>

        <div className="mt-10 rounded-2xl border border-primary/25 bg-card p-8 text-left shadow-lift">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">{pricing.packName}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight">{pricing.amountLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                One credit generates one complete report.
              </p>
            </div>
            <Button asChild size="xl">
              <Link href="/credits">Get {pricing.credits} Prediction Credits</Link>
            </Button>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {included.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-strong-soft">
                  <Check className="h-3 w-3 text-strong" aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
