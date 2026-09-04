import { BadgeIndianRupee, Database, ShieldCheck, Timer } from 'lucide-react';
import { pricing } from '@/config/site';

const reasons = [
  { icon: Database, title: 'Data-Driven Insights', body: 'Based on past trends and counseling data' },
  { icon: Timer, title: 'Simple & Fast', body: 'Get results in minutes' },
  { icon: BadgeIndianRupee, title: 'Affordable', body: `Just ${pricing.amountLabel} for ${pricing.credits} predictions` },
  { icon: ShieldCheck, title: 'Trusted', body: 'Designed for PG aspirants' },
];

export function WhyChoose({ brand }: { brand: string }) {
  return (
    <section id="how-it-works" className="border-b border-border/60 bg-background py-16">
      <div className="container">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Why Choose {brand}?</h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r) => (
            <div key={r.title}>
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card shadow-card">
                <r.icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <h3 className="mt-4 text-base font-semibold">{r.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
