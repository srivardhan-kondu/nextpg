'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { COLLEGE_TYPE_LABEL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { CollegeType } from '@prisma/client';

export interface CollegeOption {
  id: string;
  name: string;
  shortName: string | null;
  state: string;
  type: CollegeType;
}

interface CollegeComboboxProps {
  value?: CollegeOption | null;
  onChange: (college: CollegeOption | null) => void;
}

const DEBOUNCE_MS = 250;

export function CollegeCombobox({ value, onChange }: CollegeComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState('');
  const [options, setOptions] = React.useState<CollegeOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  const debouncedTerm = useDebouncedValue(term, DEBOUNCE_MS);
  // Show the spinner from the first keystroke, not only once the fetch starts,
  // so the list never looks stale during the debounce window.
  const settling = term !== debouncedTerm;

  React.useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    void (async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/colleges/search?q=${encodeURIComponent(debouncedTerm)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { results: CollegeOption[] };
        setOptions(data.results);
      } catch {
        // Aborted or offline — leave the last good list in place.
      } finally {
        // An aborted request must not clear the spinner for the one that replaced it.
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedTerm, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ? value.name : 'Search for a college…'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {/* shouldFilter=false: the server already ranked these results. */}
        <Command shouldFilter={false}>
          <CommandInput placeholder="Type a college name…" value={term} onValueChange={setTerm} />
          <CommandList>
            {loading || settling ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Searching…
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <span className="flex items-center justify-center gap-2 text-sm">
                    <Search className="h-4 w-4" aria-hidden />
                    No colleges found.
                  </span>
                </CommandEmpty>
                <CommandGroup>
                  {options.map((college) => (
                    <CommandItem
                      key={college.id}
                      value={college.id}
                      onSelect={() => {
                        onChange(college.id === value?.id ? null : college);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn('mr-2 h-4 w-4', value?.id === college.id ? 'opacity-100' : 'opacity-0')}
                        aria-hidden
                      />
                      <span className="flex-1">
                        <span className="block truncate">{college.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {college.state} · {COLLEGE_TYPE_LABEL[college.type]}
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
