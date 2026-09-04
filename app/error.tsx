'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error('[app] unhandled error', error);
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-stretch-soft text-stretch">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We hit an unexpected error. Your credits and saved reports are safe.
          {error.digest ? <span className="mt-1 block text-xs">Reference: {error.digest}</span> : null}
        </p>
        <Button onClick={reset} className="mt-5">Try again</Button>
      </div>
    </main>
  );
}
