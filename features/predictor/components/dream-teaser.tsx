import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UnlockButton } from './unlock-button';

/** Concrete enough to make the question feel personal, generic enough to be true for anyone. */
const EXAMPLES = ['Radiology at AIIMS Delhi', 'General Medicine at Osmania', 'Dermatology in my state'];

interface DreamTeaserProps {
  predictionId: string;
  locked: boolean;
  /** Only needed while locked — drives the unlock CTA. */
  balance?: number;
}

/**
 * Surfaces the Dream Validator inside the prediction result, where the question
 * "can I actually get X?" is already in the student's head.
 *
 * It was previously reachable only from a sidebar item and a small header
 * button, so the most emotionally motivating thing the product does was also
 * the least discoverable. While locked this is a second pitch for the same
 * unlock — aspiration rather than completeness — which catches the people the
 * seat-count framing does not.
 */
export function DreamTeaser({ predictionId, locked, balance = 0 }: DreamTeaserProps) {
  return (
    <Card className={locked ? 'border-primary/20 bg-primary-soft/25' : undefined}>
      <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
        <div className="max-w-[62ch]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <h2 className="text-base font-semibold tracking-tight">
              {locked ? 'Have a dream college in mind?' : 'Check a dream college'}
            </h2>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {locked ? (
              <>
                Name the branch and college you actually want. We check it against your rank and last
                year&apos;s closing ranks, and tell you plainly whether it is realistic, a stretch, or out
                of reach this year — no false hope.
              </>
            ) : (
              <>
                Your report is unlocked, so this is free and unlimited. Try any branch and college
                combination against your rank.
              </>
            )}
          </p>

          <ul className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <li
                key={example}
                className="rounded-full border border-black/[0.08] bg-card px-3 py-1 text-xs text-muted-foreground"
              >
                {example}
              </li>
            ))}
          </ul>
        </div>

        <div className="shrink-0">
          {locked ? (
            <UnlockButton
              predictionId={predictionId}
              balance={balance}
              label="Validate my dream college"
              buyLabel="Unlock my dream colleges"
            />
          ) : (
            <Button asChild size="lg" variant="outline">
              <Link href={`/dream-validator?predictionId=${predictionId}`}>
                Open Dream Validator
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
