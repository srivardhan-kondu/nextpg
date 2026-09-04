'use server';

import { revalidatePath } from 'next/cache';
import { requireUserOrThrow } from '@/lib/auth/guards';
import { enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';
import { audit } from '@/lib/security/audit';
import { prisma } from '@/lib/prisma';
import {
  createCreditOrder,
  verifyCheckoutSignature,
  PaymentConfigError,
} from '@/services/payment/razorpay.service';
import { grantCredits } from '@/services/credit.service';
import { paymentRepository } from '@/repositories/payment.repository';
import { verifyPaymentSchema } from '@/validators/payment.schema';

export type OrderState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | {
      status: 'success';
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
    };

export async function createOrderAction(): Promise<OrderState> {
  let user;
  try {
    user = await requireUserOrThrow();
  } catch {
    return { status: 'error', message: 'Please sign in to buy credits.' };
  }

  try {
    await enforceRateLimit('payment', `user:${user.id}`);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { status: 'error', message: 'Too many payment attempts. Please wait a few minutes.' };
    }
    throw error;
  }

  try {
    const order = await createCreditOrder({ userId: user.id, email: user.email });
    await audit({
      userId: user.id,
      action: 'payment.order.create',
      entityType: 'payment',
      entityId: order.paymentId,
      metadata: { orderId: order.orderId, amount: order.amount },
    });
    return {
      status: 'success',
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
    };
  } catch (error) {
    if (error instanceof PaymentConfigError) {
      return { status: 'error', message: 'Payments are not available right now. Please contact support.' };
    }
    console.error('[payment] order creation failed', error);
    return { status: 'error', message: 'We could not start the payment. Please try again.' };
  }
}

export type VerifyState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; credits: number; balance: number };

/**
 * Client-side checkout callback verification.
 *
 * This is the fast path so the UI can update immediately; the webhook is the
 * authoritative path. Both call grantCredits with the same idempotency key, so
 * whichever arrives second is a no-op rather than a double credit.
 */
export async function verifyPaymentAction(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<VerifyState> {
  let user;
  try {
    user = await requireUserOrThrow();
  } catch {
    return { status: 'error', message: 'Please sign in.' };
  }

  const parsed = verifyPaymentSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', message: 'Invalid payment response.' };

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const payment = await paymentRepository.byOrderId(razorpay_order_id);
  if (!payment) return { status: 'error', message: 'We could not find that order.' };
  // The order must belong to the caller — never credit an account from someone
  // else's payment id.
  if (payment.userId !== user.id) {
    await audit({
      userId: user.id,
      action: 'payment.verify.ownership_mismatch',
      entityType: 'payment',
      entityId: payment.id,
      severity: 'critical',
    });
    return { status: 'error', message: 'That order does not belong to this account.' };
  }

  const valid = verifyCheckoutSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', errorCode: 'SIGNATURE_MISMATCH' },
    });
    await audit({
      userId: user.id,
      action: 'payment.verify.signature_failed',
      entityType: 'payment',
      entityId: payment.id,
      severity: 'critical',
      metadata: { razorpay_order_id },
    });
    return { status: 'error', message: 'Payment verification failed. If you were charged, contact support.' };
  }

  await paymentRepository.markPaid({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  await grantCredits({
    userId: user.id,
    credits: payment.creditsSold,
    paymentId: payment.id,
    description: `${payment.creditsSold} prediction credits purchased`,
  });

  const account = await prisma.predictionCredit.findUnique({ where: { userId: user.id } });

  await audit({
    userId: user.id,
    action: 'payment.verify.success',
    entityType: 'payment',
    entityId: payment.id,
    metadata: { credits: payment.creditsSold, amount: payment.amount },
  });

  revalidatePath('/credits');
  revalidatePath('/dashboard');

  return { status: 'success', credits: payment.creditsSold, balance: account?.balance ?? 0 };
}

/**
 * Records that the user closed the checkout modal without completing payment.
 *
 * The status filter is load-bearing, not defensive: the webhook may mark this
 * order PAID between our read and our write, and downgrading a paid order to
 * ATTEMPTED would misreport revenue. `updateMany` makes the check and the write
 * a single conditional statement, so the race cannot land.
 */
export async function markPaymentDismissedAction(orderId: string) {
  const user = await requireUserOrThrow();
  const payment = await paymentRepository.byOrderId(orderId);
  if (!payment || payment.userId !== user.id) return { ok: false };

  await prisma.payment.updateMany({
    where: { id: payment.id, status: 'CREATED' },
    data: { status: 'ATTEMPTED' },
  });
  return { ok: true };
}
