'use client';

import * as React from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createOrderAction, verifyPaymentAction, markPaymentDismissedAction } from '@/actions/payment.actions';
import { pricing, siteConfig } from '@/config/site';

/** Minimal shape of the Razorpay checkout global we actually use. */
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface BuyCreditsButtonProps {
  user: { name?: string | null; email?: string | null; phone?: string | null };
  nextPath?: string;
  className?: string;
  label?: string;
}

export function BuyCreditsButton({ user, nextPath, className, label }: BuyCreditsButtonProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [scriptReady, setScriptReady] = React.useState(false);

  async function startCheckout() {
    if (!scriptReady || !window.Razorpay) {
      toast.error('Payment window is still loading. Please try again in a moment.');
      return;
    }

    setPending(true);
    const order = await createOrderAction();

    if (order.status !== 'success') {
      setPending(false);
      toast.error(order.status === 'error' ? order.message : 'Could not start the payment.');
      return;
    }

    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: siteConfig.brand,
      description: pricing.packName,
      order_id: order.orderId,
      prefill: {
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        contact: user.phone ?? undefined,
      },
      theme: { color: '#2563eb' },
      handler: async (response) => {
        // Fast path only — the webhook is authoritative and idempotent, so a
        // failure here still credits the account server-side.
        const verdict = await verifyPaymentAction(response);
        setPending(false);

        if (verdict.status === 'success') {
          toast.success(`${verdict.credits} credits added. You now have ${verdict.balance}.`);
          router.refresh();
          if (nextPath) router.push(nextPath);
        } else if (verdict.status === 'error') {
          toast.error(verdict.message);
        }
      },
      modal: {
        ondismiss: () => {
          setPending(false);
          void markPaymentDismissedAction(order.orderId);
        },
      },
    });

    checkout.open();
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
        onError={() => toast.error('Could not load the payment window. Check your connection.')}
      />
      <Button size="lg" className={className} onClick={startCheckout} loading={pending}>
        <CreditCard aria-hidden />
        {label ?? `Get ${pricing.credits} credits — ${pricing.amountLabel}`}
      </Button>
    </>
  );
}
