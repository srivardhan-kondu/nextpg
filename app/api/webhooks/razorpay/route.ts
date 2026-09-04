import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/services/payment/razorpay.service';
import { grantCredits } from '@/services/credit.service';
import { audit } from '@/lib/security/audit';

export const dynamic = 'force-dynamic';
// Node runtime: signature verification needs node:crypto over the raw body.
export const runtime = 'nodejs';

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        method?: string;
        error_code?: string;
        error_description?: string;
      };
    };
  };
}

/**
 * Razorpay webhook — the authoritative payment path.
 *
 * The client callback in payment.actions.ts is a UX optimisation; if the user
 * closes the tab mid-redirect, this is what still credits their account. Both
 * share an idempotency key, so a double delivery cannot double-credit.
 */
export async function POST(request: Request) {
  const signature = request.headers.get('x-razorpay-signature');
  // Must read the body as raw text: the HMAC is over the exact bytes sent.
  const rawBody = await request.text();

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    await audit({
      action: 'payment.webhook.signature_failed',
      entityType: 'webhook',
      severity: 'critical',
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
  }

  const entity = body.payload?.payment?.entity;
  const eventId = request.headers.get('x-razorpay-event-id') ?? `${body.event}:${entity?.id ?? 'unknown'}`;

  // Persist first, keyed on the delivery id: a retry of an event we already
  // processed short-circuits here instead of re-running the side effects.
  try {
    await prisma.webhookEvent.create({
      data: { provider: 'razorpay', eventId, eventType: body.event, payload: body as object },
    });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (body.event === 'payment.captured' || body.event === 'order.paid') {
      await handlePaymentCaptured(entity);
    } else if (body.event === 'payment.failed') {
      await handlePaymentFailed(entity);
    }

    await prisma.webhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date() },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[webhook] processing failed', body.event, error);
    await prisma.webhookEvent.update({
      where: { eventId },
      data: { error: error instanceof Error ? error.message : 'unknown error' },
    });
    // 500 tells Razorpay to retry; the eventId row is already written, so the
    // retry is caught by the duplicate check unless we clear the error.
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handlePaymentCaptured(entity?: {
  id?: string;
  order_id?: string;
  method?: string;
}) {
  if (!entity?.order_id || !entity.id) return;

  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: entity.order_id } });
  if (!payment) {
    console.warn('[webhook] captured payment for unknown order', entity.order_id);
    return;
  }

  if (payment.status !== 'PAID') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        razorpayPaymentId: entity.id,
        method: entity.method,
        paidAt: new Date(),
      },
    });
  }

  await grantCredits({
    userId: payment.userId,
    credits: payment.creditsSold,
    paymentId: payment.id,
    description: `${payment.creditsSold} prediction credits purchased`,
  });

  await audit({
    userId: payment.userId,
    action: 'payment.webhook.captured',
    entityType: 'payment',
    entityId: payment.id,
    metadata: { orderId: entity.order_id, amount: payment.amount },
  });
}

async function handlePaymentFailed(entity?: {
  order_id?: string;
  error_code?: string;
  error_description?: string;
}) {
  if (!entity?.order_id) return;

  await prisma.payment.updateMany({
    where: { razorpayOrderId: entity.order_id, status: { in: ['CREATED', 'ATTEMPTED'] } },
    data: {
      status: 'FAILED',
      errorCode: entity.error_code,
      errorDescription: entity.error_description,
    },
  });

  await audit({
    action: 'payment.webhook.failed',
    entityType: 'payment',
    severity: 'warn',
    metadata: { orderId: entity.order_id, code: entity.error_code },
  });
}
