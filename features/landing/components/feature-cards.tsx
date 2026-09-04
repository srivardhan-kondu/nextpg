import { FileDown, GitCompareArrows, School, TrendingUp } from 'lucide-react';

const features = [
  { icon: TrendingUp, title: 'Rank Prediction', body: 'Get your expected rank range' },
  { icon: School, title: 'College Insights', body: 'Find realistic opportunities' },
  { icon: GitCompareArrows, title: 'Dream Validation', body: 'Check your dream branch & college' },
  { icon: FileDown, title: 'PDF Report', body: 'Download a detailed counseling report' },
];

export function FeatureCards() {
  return (
    <section id="features" className="hero-gradient border-b border-border/60">
      <div className="container grid gap-8 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title}>
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card shadow-card">
              <f.icon className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
