import { z } from 'zod';

/**
 * Fail-fast environment validation. Imported by every server entry point so a
 * misconfigured deploy dies at boot rather than at the first user request.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().url('DATABASE_URL must be a valid Postgres URL'),
  DIRECT_URL: z.string().url().optional(),

  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  AUTH_URL: z.string().url().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  PREDICTION_PROVIDER: z.enum(['rule-based', 'historical', 'ml']).default('rule-based'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
});

function format(error: z.ZodError): string {
  return error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
}

function loadServerEnv() {
  // Skip during `next build`'s static analysis pass where secrets aren't present.
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return process.env as unknown as z.infer<typeof serverSchema>;
  }
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server environment variables:\n${format(parsed.error)}`);
  }
  return parsed.data;
}

const clientParsed = clientSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
});

export const clientEnv = clientParsed.success
  ? clientParsed.data
  : { NEXT_PUBLIC_APP_URL: 'http://localhost:3000', NEXT_PUBLIC_RAZORPAY_KEY_ID: undefined };

let cached: z.infer<typeof serverSchema> | undefined;

/** Lazily validated server env. Never import from a Client Component. */
export const env: z.infer<typeof serverSchema> = new Proxy({} as z.infer<typeof serverSchema>, {
  get(_t, prop: string) {
    cached ??= loadServerEnv();
    return cached[prop as keyof typeof cached];
  },
});

/** Feature switches derived from which integrations are actually configured. */
export const features = {
  get google() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  },
  get emailOtp() {
    return Boolean(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_FROM);
  },
  get razorpay() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  },
  get assistant() {
    return Boolean(process.env.OPENAI_API_KEY);
  },
  get distributedRateLimit() {
    return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  },
};
