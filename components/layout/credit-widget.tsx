import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** The "You have N credits / Buy Credits" block pinned above the sidebar footer. */
export function CreditWidget({ balance }: { balance: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-card">
      <p className="text-xs text-muted-foreground">You have</p>
      <p className="text-lg font-bold leading-tight text-foreground">
        {balance} credit{balance === 1 ? '' : 's'}
      </p>
      <Button asChild size="sm" className="mt-2.5 w-full">
        <Link href="/credits">Buy Credits</Link>
      </Button>
    </div>
  );
}
