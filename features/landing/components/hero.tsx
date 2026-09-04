import Link from 'next/link';
import { ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Hero. The design shows a photographic portrait on the right; we render a
 * self-contained illustrated panel instead so the page ships without depending
 * on a licensed stock image. Drop a real photo into the same slot when you have one.
 */
function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
      <div className="absolute -right-6 -top-6 h-56 w-56 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative rounded-3xl border border-border bg-card/70 p-8 shadow-lift backdrop-blur">
        <div className="mx-auto grid h-40 w-40 place-items-center rounded-full bg-primary-soft">
          <Stethoscope className="h-16 w-16 text-primary" strokeWidth={1.25} />
        </div>

        <div className="mt-7 space-y-2.5">
          <div className="h-2.5 w-3/4 rounded-full bg-secondary" />
          <div className="h-2.5 w-1/2 rounded-full bg-secondary" />
        </div>

        <div className="mt-6 rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Estimated Rank</p>
          <p className="text-2xl font-bold text-primary">12,000 – 16,500</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[78%] rounded-full bg-primary" />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Confidence: 78%</p>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-4 rounded-xl border border-border bg-card px-4 py-3 shadow-lift sm:-left-8">
        <p className="text-sm font-semibold leading-snug">Plan Better</p>
        <p className="text-sm font-semibold leading-snug">Choose Smarter</p>
        <p className="text-sm font-semibold leading-snug text-primary">Go Further</p>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero-gradient">
      <div className="container grid items-center gap-14 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3.5 py-1.5 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Trusted by thousands of PG aspirants
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
            Know Your PG
            <br />
            Possibilities in 60&nbsp;Seconds
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            Get rank estimates, college recommendations, AIQ and state quota insights, and validate your
            dream branch and college.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl">
              <Link href="/predictor">Start Prediction <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/sample-report">View Sample Report</Link>
            </Button>
          </div>
        </div>

        <HeroArt />
      </div>
    </section>
  );
}
