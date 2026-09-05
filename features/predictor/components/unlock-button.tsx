'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreditCard, Unlock } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { unlockPredictionAction } from '@/actions/prediction.actions';
import { pricing } from '@/config/site';

interface UnlockButtonProps {
  predictionId: string;
  balance: number;
  /** Shown when the user already holds a credit. */
  label?: string;
  /** Shown when they have to buy a pack first. */
  buyLabel?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  className?: string;
}

/**
 * The single unlock control.
 *
 * Extracted so the paywall and the dream-college prompt drive the exact same
 * action from two different pitches — two framings of one offer, not two
 * competing offers. Duplicating the action would let the two drift apart, and
 * the money path is the last place that should happen twice.
 */
export function UnlockButton({
  predictionId,
  balance,
  label = 'Unlock full report',
  buyLabel,
  size = 'lg',
  variant = 'default',
  className,
}: UnlockButtonProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const hasCredits = balance > 0;

  async function unlock() {
    setPending(true);
    const formData = new FormData();
    formData.append('predictionId', predictionId);

    const result = await unlockPredictionAction({ status: 'idle' }, formData);

    if (result.status === 'success') {
      toast.success('Report unlocked. It is yours forever.');
      router.refresh();
      return;
    }

    setPending(false);
    if (result.status === 'error') {
      toast.error(result.message);
      if (result.needsCredits) router.push('/credits');
    }
  }

  if (hasCredits) {
    return (
      <Button size={size} variant={variant} onClick={unlock} loading={pending} className={className}>
        <Unlock aria-hidden />
        {label}
      </Button>
    );
  }

  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link href={`/credits?next=${encodeURIComponent(`/predictor/${predictionId}`)}`}>
        <CreditCard aria-hidden />
        {buyLabel ?? `Unlock for ${pricing.amountLabel}`}
      </Link>
    </Button>
  );
}
