'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { BAND_META } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { OpportunityTable } from './opportunity-table';
import type { Band, CollegeOpportunity } from '@/types/prediction';

const ROWS_COLLAPSED = 8;

const accent = {
  STRONG: 'bg-strong',
  MODERATE: 'bg-moderate',
  STRETCH: 'bg-stretch',
} as const;

function BandSection({ band, rows }: { band: Band; rows: CollegeOpportunity[] }) {
  const [expanded, setExpanded] = React.useState(false);
  const meta = BAND_META[band];
  const visible = expanded ? rows : rows.slice(0, ROWS_COLLAPSED);

  return (
    <section aria-labelledby={`band-${band}`} className="space-y-3">
      <div className="flex items-start gap-3">
        <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', accent[band])} aria-hidden />
        <div>
          <h3 id={`band-${band}`} className="text-base font-semibold tracking-tight">
            {meta.title}{' '}
            <span className="font-normal text-muted-foreground">({rows.length})</span>
          </h3>
          <p className="text-sm text-muted-foreground">{meta.caption}</p>
        </div>
      </div>

      <OpportunityTable rows={visible} />

      {rows.length > ROWS_COLLAPSED ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : `Show all ${rows.length}`}
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} aria-hidden />
        </button>
      ) : null}
    </section>
  );
}

export function BandSections({ bands }: { bands: Record<Band, CollegeOpportunity[]> }) {
  return (
    <div className="space-y-8">
      {(['STRONG', 'MODERATE', 'STRETCH'] as const).map((band) => (
        <BandSection key={band} band={band} rows={bands[band]} />
      ))}
    </div>
  );
}
