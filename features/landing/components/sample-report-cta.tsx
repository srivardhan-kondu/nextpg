import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** Mini page-preview strip, mirroring the "See a Sample Report" row in the design. */
function PagePreview({ accent = false }: { accent?: boolean }) {
  return (
    <div className="w-28 shrink-0 rounded-md border border-border bg-background p-2 shadow-card sm:w-32">
      <div className={`h-1.5 w-10 rounded-full ${accent ? 'bg-primary' : 'bg-secondary'}`} />
      <div className="mt-2 space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-1 rounded-full bg-secondary" style={{ width: `${95 - i * 9}%` }} />
        ))}
      </div>
      <div className="mt-2 h-6 rounded bg-primary-soft" />
      <div className="mt-2 space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-1 rounded-full bg-secondary" style={{ width: `${80 - i * 14}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SampleReportCta() {
  return (
    <section className="border-b border-border/60 bg-canvas py-14">
      <div className="container flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">See a Sample Report</h2>

        <div className="flex gap-3 overflow-x-auto pb-2" aria-hidden>
          <PagePreview accent />
          <PagePreview />
          <PagePreview />
          <PagePreview />
        </div>

        <Button asChild variant="outline" size="lg" className="shrink-0">
          <Link href="/sample-report">View Sample Report</Link>
        </Button>
      </div>
    </section>
  );
}
