import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { features } from '@/lib/env';

export type RateLimitVerdict = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Sliding-window rate limiter.
 *
 * Uses Upstash Redis when configured (required for correctness across Vercel's
 * many lambda instances). Falls back to an in-process map for local development
 * — that fallback is per-instance and must not be relied on in production.
 */
const memoryStore = new Map<string, { count: number; reset: number }>();

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitVerdict {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.reset < now) {
    memoryStore.set(key, { count: 1, reset: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }
  entry.count += 1;
  const success = entry.count <= limit;
  return { success, limit, remaining: Math.max(0, limit - entry.count), reset: entry.reset };
}

// Periodically drop expired entries so the dev-mode map cannot grow unbounded.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore) if (value.reset < now) memoryStore.delete(key);
  }, 60_000).unref?.();
}

let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, limit: number, window: `${number} ${'s' | 'm' | 'h'}`) {
  if (!features.distributedRateLimit) return null;
  redis ??= new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  if (!limiters.has(name)) {
    limiters.set(
      name,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, window),
        prefix: `nextpg:${name}`,
        analytics: true,
      }),
    );
  }
  return limiters.get(name)!;
}

/** Tuned per surface: OTP is the most abusable, so it is the tightest. */
export const RATE_LIMITS = {
  otpRequest: { limit: 4, window: '10 m', ms: 600_000 },
  otpVerify: { limit: 10, window: '10 m', ms: 600_000 },
  prediction: { limit: 20, window: '1 h', ms: 3_600_000 },
  dreamValidation: { limit: 40, window: '1 h', ms: 3_600_000 },
  payment: { limit: 10, window: '1 h', ms: 3_600_000 },
  assistant: { limit: 30, window: '1 h', ms: 3_600_000 },
  report: { limit: 30, window: '1 h', ms: 3_600_000 },
  search: { limit: 120, window: '1 m', ms: 60_000 },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

export async function rateLimit(name: RateLimitName, identifier: string): Promise<RateLimitVerdict> {
  const config = RATE_LIMITS[name];
  const limiter = getLimiter(name, config.limit, config.window as `${number} m`);

  if (!limiter) return memoryLimit(`${name}:${identifier}`, config.limit, config.ms);

  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export class RateLimitError extends Error {
  constructor(public readonly reset: number) {
    super('Too many requests. Please try again shortly.');
    this.name = 'RateLimitError';
  }
}

export async function enforceRateLimit(name: RateLimitName, identifier: string) {
  const verdict = await rateLimit(name, identifier);
  if (!verdict.success) throw new RateLimitError(verdict.reset);
  return verdict;
}
