import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { pricing } from '@/config/site';
import { paymentRepository } from '@/repositories/payment.repository';

export class PaymentConfigError extends Error {
  constructor() {
    super('Payments are not configured.');
    this.name = 'PaymentConfigError';
  }
}

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new PaymentConfigError();
  }
  client ??= new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return client;
}

/**
 * Creates a Razorpay order and the matching local Payment row.
 *
 * The amount is taken from server-side config, never from the request — a
 * client that posts its own price must not be able to buy credits cheaply.
 */
export async function createCreditOrder(params: { userId: string; email?: string | null }) {
  const receipt = `pg_${Date.now().toString(36)}_${params.userId.slice(-6)}`;

  const order = await getClient().orders.create({
    amount: pricing.amountInPaise,
    currency: pricing.currency,
    receipt,
    notes: { userId: params.userId, credits: String(pricing.credits) },
  });

  const payment = await paymentRepository.create({
    userId: params.userId,
    razorpayOrderId: order.id,
    amount: pricing.amountInPaise,
    currency: pricing.currency,
    creditsSold: pricing.credits,
    status: 'CREATED',
    receipt,
    notes: { email: params.email ?? null },
  });

  return {
    orderId: order.id,
    amount: pricing.amountInPaise,
    currency: pricing.currency,
    keyId: process.env.RAZORPAY_KEY_ID!,
    paymentId: payment.id,
    receipt,
  };
}

/**
 * Verifies the checkout callback signature: HMAC-SHA256 of "orderId|paymentId"
 * keyed with the secret. Compared in constant time so a timing side channel
 * cannot be used to forge one byte at a time.
 */
export function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');

  return timingSafeEqualHex(expected, params.signature);
}

/** Webhook bodies are signed with a different secret over the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeEqualHex(expected, signature);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function fetchPayment(razorpayPaymentId: string) {
  return getClient().payments.fetch(razorpayPaymentId);
}
