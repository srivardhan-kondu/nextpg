import { Progress } from '@/components/ui/progress';
import { LikelihoodBadge } from '@/components/shared/likelihood-badge';
import { formatRank } from '@/lib/utils';
import type { BranchRecommendation } from '@/types/prediction';

export function BranchRecommendations({ branches }: { branches: BranchRecommendation[] }) {
  if (branches.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        No branch recommendations for this rank range yet.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {branches.map((branch) => (
        <li key={branch.branchName} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold leading-snug">{branch.branchName}</p>
            <LikelihoodBadge likelihood={branch.likelihood} />
          </div>

          <Progress value={branch.probability} className="mt-3 h-1.5" />
          <p className="mt-2 text-xs text-muted-foreground">
            {branch.probability}% chance · {branch.seatsInRange} seat{branch.seatsInRange === 1 ? '' : 's'} in range
            {branch.bestClosingRank ? ` · best closed at ${formatRank(branch.bestClosingRank)}` : ''}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{branch.rationale}</p>
        </li>
      ))}
    </ul>
  );
}
