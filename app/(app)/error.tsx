'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Scoped boundary: an error inside a page keeps the sidebar and header alive,
 * so the user can navigate away instead of hitting a dead full-page error.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[app] page error', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-stretch-soft text-stretch">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </div>
      <h1 className="mt-4 text-lg font-semibold">This page could not load</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Something went wrong on our side. Your credits and unlocked reports are unaffected — nothing was
        charged for this.
        {error.digest ? <span className="mt-1 block text-xs">Reference: {error.digest}</span> : null}
      </p>
      <div className="mt-5 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
