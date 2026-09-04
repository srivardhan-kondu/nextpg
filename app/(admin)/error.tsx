'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[admin] page error', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-stretch-soft text-stretch">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </div>
      <h1 className="mt-4 text-lg font-semibold">Admin page failed to load</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        No data was modified. Check the server logs for the full trace.
        {error.digest ? <span className="mt-1 block text-xs">Reference: {error.digest}</span> : null}
      </p>
      <div className="mt-5 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/admin">Back to analytics</Link>
        </Button>
      </div>
    </div>
  );
}
