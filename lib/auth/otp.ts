import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';

import { OTP_LENGTH, OTP_TTL_MINUTES } from './otp-constants';

export { OTP_LENGTH, OTP_TTL_MINUTES };
export const OTP_MAX_ATTEMPTS = 5;

/** Cryptographically uniform 6-digit code (no modulo bias). */
export function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
}

/** Codes are only ever stored hashed — a database leak must not yield live OTPs. */
export function hashOtp(email: string, otp: string): string {
  const secret = process.env.AUTH_SECRET ?? '';
  return createHash('sha256').update(`${email.toLowerCase()}:${otp}:${secret}`).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function issueOtp(email: string): Promise<string> {
  const identifier = email.toLowerCase();
  // One live code per address: issuing a new one invalidates the old.
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const otp = generateOtp();
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashOtp(identifier, otp),
      expires: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    },
  });
  return otp;
}

export type OtpVerdict = 'valid' | 'invalid' | 'expired' | 'too_many_attempts' | 'not_found';

export async function verifyOtp(email: string, otp: string): Promise<OtpVerdict> {
  const identifier = email.toLowerCase();
  const record = await prisma.verificationToken.findFirst({
    where: { identifier },
    orderBy: { expires: 'desc' },
  });

  if (!record) return 'not_found';

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return 'too_many_attempts';
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return 'expired';
  }

  if (!safeEqual(record.token, hashOtp(identifier, otp))) {
    await prisma.verificationToken.update({
      where: { token: record.token },
      data: { attempts: { increment: 1 } },
    });
    return 'invalid';
  }

  // Single-use: consume on success.
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  return 'valid';
}
