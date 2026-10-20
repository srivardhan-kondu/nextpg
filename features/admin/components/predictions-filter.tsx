'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'UNLOCKED', label: 'Unlocked (paid)' },
  { value: 'PREVIEW', label: 'Preview (free)' },
];

interface PredictionsFilterProps {
  currentStatus?: string;
  currentState?: string;
}

export function PredictionsFilter({ currentStatus, currentState }: PredictionsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasActiveFilters = Boolean(currentStatus || currentState);

  function applyStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) params.set('status', status);
    else params.delete('status');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('status');
    params.delete('state');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filter:
      </span>
      <div className="flex gap-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => applyStatus(opt.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              (currentStatus ?? '') === opt.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
