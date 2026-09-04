'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** URL-driven search box — the page stays a server component and refetches. */
export function AdminSearch({ placeholder = 'Search…' }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(searchParams.get('search') ?? '');

  function apply(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('search', next);
    else params.delete('search');
    params.delete('page'); // a new query invalidates the current page index
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        apply(value.trim());
      }}
      className="flex w-full max-w-sm gap-2"
      role="search"
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="pl-9"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              setValue('');
              apply('');
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}
