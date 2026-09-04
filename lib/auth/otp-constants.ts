/**
 * Client-safe OTP constants. Kept out of lib/auth/otp.ts so importing them into
 * a Client Component never pulls in node:crypto or Prisma.
 */
export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
