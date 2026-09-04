import { describe, expect, it } from 'vitest';
import { createPredictionSchema, dreamValidationSchema } from '@/validators/prediction.schema';
import { emailSchema, otpVerifySchema, profileSchema } from '@/validators/auth.schema';
import { verifyPaymentSchema } from '@/validators/payment.schema';
import { EXAM } from '@/config/site';

const validPrediction = {
  candidateName: 'Aditi Sharma',
  gender: 'FEMALE',
  state: 'Telangana',
  category: 'GENERAL',
  subCategory: 'NONE',
  correctAnswers: 120,
  wrongAnswers: 40,
  expectedScore: 440,
  preferredType: 'ANY',
};

describe('createPredictionSchema', () => {
  it('accepts a well-formed submission', () => {
    expect(createPredictionSchema.safeParse(validPrediction).success).toBe(true);
  });

  it('coerces numeric strings, because FormData only carries strings', () => {
    const result = createPredictionSchema.safeParse({
      ...validPrediction,
      correctAnswers: '120',
      wrongAnswers: '40',
      expectedScore: '440',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.correctAnswers).toBe(120);
  });

  it('rejects attempts exceeding the paper length', () => {
    const result = createPredictionSchema.safeParse({
      ...validPrediction,
      correctAnswers: 150,
      wrongAnswers: 100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('wrongAnswers'))).toBe(true);
    }
  });

  it('rejects a score above the maximum', () => {
    const result = createPredictionSchema.safeParse({ ...validPrediction, expectedScore: EXAM.maxScore + 1 });
    expect(result.success).toBe(false);
  });

  it('rejects a name containing markup', () => {
    const result = createPredictionSchema.safeParse({
      ...validPrediction,
      candidateName: '<script>alert(1)</script>',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown state', () => {
    const result = createPredictionSchema.safeParse({ ...validPrediction, state: 'Atlantis' });
    expect(result.success).toBe(false);
  });

  it('rejects negative attempt counts', () => {
    expect(createPredictionSchema.safeParse({ ...validPrediction, correctAnswers: -1 }).success).toBe(false);
  });
});

describe('dreamValidationSchema', () => {
  it('accepts a branch on its own', () => {
    expect(dreamValidationSchema.safeParse({ dreamBranch: 'Radiology' }).success).toBe(true);
  });

  it('rejects a branch outside the supported list', () => {
    expect(dreamValidationSchema.safeParse({ dreamBranch: 'Astrology' }).success).toBe(false);
  });

  it('rejects a malformed college id', () => {
    const result = dreamValidationSchema.safeParse({
      dreamBranch: 'Radiology',
      dreamCollegeId: 'not-a-cuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('auth schemas', () => {
  it('normalises email to lowercase', () => {
    const result = emailSchema.safeParse({ email: '  Aditi@Example.COM ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('aditi@example.com');
  });

  it('requires exactly six digits for an OTP', () => {
    expect(otpVerifySchema.safeParse({ email: 'a@b.com', otp: '12345' }).success).toBe(false);
    expect(otpVerifySchema.safeParse({ email: 'a@b.com', otp: '1234567' }).success).toBe(false);
    expect(otpVerifySchema.safeParse({ email: 'a@b.com', otp: 'abcdef' }).success).toBe(false);
    expect(otpVerifySchema.safeParse({ email: 'a@b.com', otp: '123456' }).success).toBe(true);
  });

  it('validates Indian mobile numbers', () => {
    expect(profileSchema.safeParse({ phone: '9876543210' }).success).toBe(true);
    expect(profileSchema.safeParse({ phone: '1234567890' }).success).toBe(false);
    expect(profileSchema.safeParse({ phone: '' }).success).toBe(true);
  });
});

describe('verifyPaymentSchema', () => {
  it('requires all three Razorpay fields', () => {
    expect(
      verifyPaymentSchema.safeParse({ razorpay_order_id: 'order_123', razorpay_payment_id: 'pay_123' }).success,
    ).toBe(false);
  });

  it('accepts a complete callback payload', () => {
    expect(
      verifyPaymentSchema.safeParse({
        razorpay_order_id: 'order_MnO123',
        razorpay_payment_id: 'pay_MnO123',
        razorpay_signature: 'a'.repeat(64),
      }).success,
    ).toBe(true);
  });
});
