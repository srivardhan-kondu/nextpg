import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Controls that used to degrade into no-ops when a config value was missing.
 * Each test asserts the control now refuses rather than waves the request
 * through, because a silently-disabled guard is worse than an absent one.
 */

let requestHeaders: Record<string, string> = {};

vi.mock('next/headers', () => ({
  headers: async () => ({ get: (k: string) => requestHeaders[k.toLowerCase()] ?? null }),
}));

const { assertSameOrigin } = await import('@/lib/security/request');

describe('assertSameOrigin', () => {
  beforeEach(() => {
    requestHeaders = {};
    process.env.NEXT_PUBLIC_APP_URL = 'https://nextpg.in';
  });

  it('accepts a same-origin request', async () => {
    requestHeaders = { origin: 'https://nextpg.in', 'sec-fetch-site': 'same-origin' };
    await expect(assertSameOrigin()).resolves.toBeUndefined();
  });

  it('rejects a foreign origin', async () => {
    requestHeaders = { origin: 'https://evil.example' };
    await expect(assertSameOrigin()).rejects.toThrow(/Cross-origin/);
  });

  it('rejects a cross-site request that carries no Origin header', async () => {
    requestHeaders = { 'sec-fetch-site': 'cross-site' };
    await expect(assertSameOrigin()).rejects.toThrow(/Cross-origin/);
  });

  it('refuses when no allowlist is configured instead of allowing everything', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.AUTH_URL;
    requestHeaders = { origin: 'https://evil.example' };

    await expect(assertSameOrigin()).rejects.toThrow(/not configured/);
  });
});

describe('production environment validation', () => {
  const saved = { ...process.env };

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...saved };
    vi.resetModules();
  });

  async function loadEnvWith(upstash: { url?: string; token?: string }) {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SKIP_ENV_VALIDATION', 'false');
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db');
    vi.stubEnv('AUTH_SECRET', 'a'.repeat(32));

    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    if (upstash.url) process.env.UPSTASH_REDIS_REST_URL = upstash.url;
    if (upstash.token) process.env.UPSTASH_REDIS_REST_TOKEN = upstash.token;

    return import('@/lib/env');
  }

  it('refuses to boot production without a distributed rate limiter', async () => {
    const { env } = await loadEnvWith({});
    // Validation is lazy behind a Proxy, so it surfaces on first read.
    expect(() => env.DATABASE_URL).toThrow(/UPSTASH_REDIS_REST_URL/);
  });

  it('boots production once Upstash is configured', async () => {
    const { env } = await loadEnvWith({
      url: 'https://eu1-example.upstash.io',
      token: 'token_value',
    });
    expect(env.DATABASE_URL).toContain('postgresql://');
  });
});
