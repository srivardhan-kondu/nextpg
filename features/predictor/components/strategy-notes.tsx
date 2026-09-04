import { AlertTriangle, Info, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StrategyNote } from '@/types/prediction';

const priorityMeta = {
  high: { icon: AlertTriangle, className: 'border-l-primary', label: 'Do this first' },
  medium: { icon: Lightbulb, className: 'border-l-moderate', label: 'Worth doing' },
  low: { icon: Info, className: 'border-l-border', label: 'Good to know' },
} as const;

export function StrategyNotes({ notes }: { notes: StrategyNote[] }) {
  if (notes.length === 0) return null;

  return (
    <ul className="space-y-3">
      {notes.map((note, index) => {
        const meta = priorityMeta[note.priority];
        const Icon = meta.icon;
        return (
          <li
            key={index}
            className={cn('rounded-lg border border-l-4 border-border bg-card p-4', meta.className)}
          >
            <div className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="font-semibold leading-snug">{note.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{note.body}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
