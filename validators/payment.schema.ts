import { z } from 'zod';

export const createOrderSchema = z.object({
  /** Reserved for future multi-pack pricing; today there is one pack. */
  packId: z.literal('credits-5').default('credits-5'),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(4).max(120),
  razorpay_payment_id: z.string().min(4).max(120),
  razorpay_signature: z.string().min(8).max(256),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
