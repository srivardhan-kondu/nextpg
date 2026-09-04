import Link from 'next/link';
import { Download, FileText, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatRankRange } from '@/lib/utils';
import { CATEGORY_LABEL } from '@/lib/constants';
import type { Category, PredictionStatus } from '@prisma/client';

export interface PredictionHistoryItem {
  id: string;
  createdAt: Date;
  rankMin: number;
  rankMax: number;
  state: string;
  category: Category;
  status: PredictionStatus;
  confidence: number;
  reportId?: string | null;
}

export function PredictionHistoryCard({ item }: { item: PredictionHistoryItem }) {
  const unlocked = item.status === 'UNLOCKED';

  return (
    <article className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <time dateTime={new Date(item.createdAt).toISOString()} className="text-xs text-muted-foreground">
            {formatDate(item.createdAt)}
          </time>
          {unlocked ? (
            <Badge variant="strong">Unlocked</Badge>
          ) : (
            <Badge variant="secondary">
              <Lock className="mr-1 h-3 w-3" aria-hidden />
              Preview
            </Badge>
          )}
        </div>

        <p className="mt-1.5 text-lg font-bold tracking-tight">
          {formatRankRange(item.rankMin, item.rankMax)}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {item.state} · {CATEGORY_LABEL[item.category]} · {item.confidence}% confidence
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/predictor/${item.id}`}>
            <FileText aria-hidden />
            View report
          </Link>
        </Button>
        {unlocked && item.reportId ? (
          <Button asChild size="sm">
            {/* Plain anchor: this streams a PDF, so it must not be intercepted by the router. */}
            <a href={`/api/reports/${item.reportId}/download`}>
              <Download aria-hidden />
              Download PDF
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
