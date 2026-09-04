'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Download, ShieldAlert, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  approveCleanRowsAction, decideRowAction, editRowAction, importJobAction,
} from '@/actions/extraction.actions';
import { formatRank } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface ReviewRow {
  id: string;
  pageNumber: number;
  rawText: string;
  rawCollegeName: string;
  rawBranchName: string;
  collegeName: string | null;
  branchName: string | null;
  quota: string | null;
  category: string | null;
  closingRank: number | null;
  seatCount: number | null;
  round: number | null;
  confidence: number;
  issues: string[];
  status: string;
}

const ISSUE_LABELS: Record<string, string> = {
  unreadable: 'Unreadable on the page',
  missing_college: 'No college in the row',
  missing_branch: 'No branch in the row',
  missing_closing_rank: 'No closing rank',
  unmatched_college: 'College not in our database',
  unmatched_branch: 'Branch not in our database',
  unknown_quota: 'Quota not recognised',
  unknown_category: 'Category not recognised',
  implausible_rank: 'Rank outside a plausible range',
  opening_after_closing: 'Opening rank is after closing',
  implausible_seat_count: 'Seat count looks wrong',
  low_model_confidence: 'Model was unsure of its read',
};

function confidenceTone(value: number) {
  if (value >= 85) return 'strong';
  if (value >= 60) return 'moderate';
  return 'stretch';
}

export function ExtractionReview({
  jobId,
  rows,
  pendingCount,
  approvedCount,
  threshold,
}: {
  jobId: string;
  rows: ReviewRow[];
  pendingCount: number;
  approvedCount: number;
  threshold: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function decide(rowId: string, decision: 'APPROVED' | 'REJECTED') {
    setBusy(rowId);
    const result = await decideRowAction({ rowId, decision });
    setBusy(null);
    if (result.status === 'error') toast.error(result.message);
    else router.refresh();
  }

  async function saveRank(rowId: string, value: string) {
    const closingRank = Number(value);
    if (!Number.isFinite(closingRank) || closingRank < 1) {
      toast.error('Enter a valid rank.');
      return;
    }
    setBusy(rowId);
    const result = await editRowAction({ rowId, closingRank });
    setBusy(null);
    if (result.status === 'error') toast.error(result.message);
    else {
      toast.success('Rank corrected.');
      router.refresh();
    }
  }

  async function runAction(fn: () => Promise<{ status: string; message?: string }>, key: string) {
    setBusy(key);
    const result = await fn();
    setBusy(null);
    if (result.status === 'error') toast.error(result.message ?? 'Failed.');
    else {
      toast.success(result.message ?? 'Done.');
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      <Alert variant="info">
        <ShieldAlert aria-hidden />
        <AlertTitle>Nothing here affects predictions yet</AlertTitle>
        <AlertDescription>
          These rows are staged. They reach the prediction engine only when you import approved
          rows. Anything the extractor could not read is left blank rather than guessed — check it
          against the page before approving.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          loading={busy === 'bulk'}
          onClick={() => runAction(() => approveCleanRowsAction(jobId), 'bulk')}
        >
          <Check aria-hidden />
          Approve all clean rows (≥{threshold}%, no issues)
        </Button>
        <Button
          loading={busy === 'import'}
          disabled={approvedCount === 0}
          onClick={() => runAction(() => importJobAction(jobId), 'import')}
        >
          <Download aria-hidden />
          Import {approvedCount} approved row{approvedCount === 1 ? '' : 's'}
        </Button>
        <span className="self-center text-sm text-muted-foreground">
          {pendingCount} still awaiting review
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Pg</TableHead>
              <TableHead>Read from the page</TableHead>
              <TableHead>Matched to</TableHead>
              <TableHead className="text-right">Closing</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No rows awaiting review.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className={cn(row.status === 'REJECTED' && 'opacity-50')}>
                  <TableCell className="text-muted-foreground tabular-nums">{row.pageNumber}</TableCell>

                  <TableCell className="max-w-xs">
                    <p className="font-medium leading-snug">{row.rawCollegeName || '—'}</p>
                    <p className="text-xs text-muted-foreground">{row.rawBranchName || '—'}</p>
                    {/* Verbatim source text: the audit trail against the PDF. */}
                    <p className="mt-1 line-clamp-2 font-mono text-[11px] text-muted-foreground">
                      {row.rawText}
                    </p>
                  </TableCell>

                  <TableCell className="max-w-xs">
                    {row.collegeName ? (
                      <p className="text-sm leading-snug">{row.collegeName}</p>
                    ) : (
                      <Badge variant="stretch">No college match</Badge>
                    )}
                    {row.branchName ? (
                      <p className="text-xs text-muted-foreground">{row.branchName}</p>
                    ) : (
                      <Badge variant="stretch" className="mt-1">No branch match</Badge>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {row.quota ? <Badge variant="secondary">{row.quota}</Badge> : null}
                      {row.category ? <Badge variant="secondary">{row.category}</Badge> : null}
                      {row.round ? <Badge variant="outline">R{row.round}</Badge> : null}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    {row.closingRank === null ? (
                      <Input
                        type="number"
                        placeholder="not read"
                        className="h-8 w-24 text-right"
                        aria-label={`Closing rank for page ${row.pageNumber} row`}
                        onBlur={(e) => e.target.value && saveRank(row.id, e.target.value)}
                      />
                    ) : (
                      <span className="tabular-nums">{formatRank(row.closingRank)}</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant={confidenceTone(row.confidence)}>{row.confidence}%</Badge>
                    {row.issues.length > 0 ? (
                      <ul className="mt-1 space-y-0.5">
                        {row.issues.map((issue) => (
                          <li key={issue} className="text-[11px] leading-tight text-muted-foreground">
                            {ISSUE_LABELS[issue] ?? issue}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </TableCell>

                  <TableCell>
                    {row.status === 'PENDING' ? (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Approve row"
                          disabled={busy === row.id}
                          onClick={() => decide(row.id, 'APPROVED')}
                        >
                          <Check className="text-strong" aria-hidden />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Reject row"
                          disabled={busy === row.id}
                          onClick={() => decide(row.id, 'REJECTED')}
                        >
                          <X className="text-destructive" aria-hidden />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant={row.status === 'APPROVED' ? 'strong' : 'secondary'}>
                        {row.status.toLowerCase()}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
