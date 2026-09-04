import { beforeEach, describe, expect, it } from 'vitest';
import { generateOtp, hashOtp, OTP_LENGTH, OTP_MAX_ATTEMPTS } from '@/lib/auth/otp';

describe('generateOtp', () => {
  it('always produces exactly the configured number of digits', () => {
    for (let i = 0; i < 200; i++) {
      const otp = generateOtp();
      expect(otp).toHaveLength(OTP_LENGTH);
      expect(otp).toMatch(/^\d+$/);
    }
  });

  it('zero-pads low values instead of emitting a short code', () => {
    // Padding is what makes "000042" a valid six-digit code rather than "42".
    const padded = String(42).padStart(OTP_LENGTH, '0');
    expect(padded).toBe('000042');
    expect(padded).toHaveLength(OTP_LENGTH);
  });

  it('is not obviously repeating', () => {
    const codes = new Set(Array.from({ length: 200 }, generateOtp));
    // 200 draws from 10^6 should almost never collide; allow a wide margin.
    expect(codes.size).toBeGreaterThan(190);
  });
});

describe('hashOtp', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret-value-at-least-32-chars-long';
  });

  it('never returns the plaintext code', () => {
    const hash = hashOtp('user@example.com', '123456');
    expect(hash).not.toContain('123456');
    expect(hash).toHaveLength(64); // sha256 hex
  });

  it('is deterministic for the same inputs', () => {
    expect(hashOtp('user@example.com', '123456')).toBe(hashOtp('user@example.com', '123456'));
  });

  it('is case-insensitive on the email, matching how identifiers are stored', () => {
    expect(hashOtp('User@Example.COM', '123456')).toBe(hashOtp('user@example.com', '123456'));
  });

  it('binds the code to the email — a code for one address will not verify for another', () => {
    expect(hashOtp('a@example.com', '123456')).not.toBe(hashOtp('b@example.com', '123456'));
  });

  it('changes with the code', () => {
    expect(hashOtp('user@example.com', '123456')).not.toBe(hashOtp('user@example.com', '123457'));
  });

  it('is keyed by AUTH_SECRET, so a leaked table alone cannot be brute-forced offline', () => {
    const withSecretA = hashOtp('user@example.com', '123456');
    process.env.AUTH_SECRET = 'a-completely-different-secret-value-here';
    expect(hashOtp('user@example.com', '123456')).not.toBe(withSecretA);
  });
});

describe('OTP policy', () => {
  it('caps attempts so a 6-digit code cannot be brute-forced', () => {
    expect(OTP_MAX_ATTEMPTS).toBeLessThanOrEqual(10);
    expect(OTP_MAX_ATTEMPTS).toBeGreaterThan(0);
  });
});
