import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { COLLEGE_TYPE_LABEL, QUOTA_LABEL } from '@/lib/constants';
import { formatRank } from '@/lib/utils';
import type { CollegeOpportunity } from '@/types/prediction';

const bandVariant = { STRONG: 'strong', MODERATE: 'moderate', STRETCH: 'stretch' } as const;

/**
 * Opportunity list. Renders as a table on desktop and as stacked cards on
 * mobile — a 5-column table cannot be made readable at 360px, and horizontal
 * scrolling for primary content fails accessibility review.
 */
export function OpportunityTable({ rows }: { rows: CollegeOpportunity[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        No seats in this band for your estimated rank.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>College</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Quota</TableHead>
              <TableHead className="text-right">Closing rank</TableHead>
              <TableHead className="text-right">Seats</TableHead>
              <TableHead className="text-right">Chance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.collegeId}-${row.branchId}-${row.quota}-${index}`}>
                <TableCell>
                  <span className="font-medium text-foreground">{row.collegeName}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {row.state} · {COLLEGE_TYPE_LABEL[row.collegeType]}
                  </span>
                </TableCell>
                <TableCell>{row.branchName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{QUOTA_LABEL[row.quota]}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatRank(row.closingRank)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {row.seatCount || '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={bandVariant[row.band]}>{row.probability}%</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-2.5 md:hidden">
        {rows.map((row, index) => (
          <li
            key={`${row.collegeId}-${row.branchId}-${row.quota}-${index}`}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium leading-snug">{row.collegeName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.state} · {COLLEGE_TYPE_LABEL[row.collegeType]}
                </p>
              </div>
              <Badge variant={bandVariant[row.band]} className="shrink-0">
                {row.probability}%
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-medium">{row.branchName}</span>
              <span className="text-muted-foreground">{QUOTA_LABEL[row.quota]}</span>
              <span className="text-muted-foreground">
                Closed <span className="tabular-nums text-foreground">{formatRank(row.closingRank)}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
