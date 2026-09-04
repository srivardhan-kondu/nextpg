import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { features } from '@/lib/env';

export const dynamic = 'force-dynamic';

/** Liveness + dependency probe for uptime monitoring. */
export async function GET() {
  const started = Date.now();
  let database: 'up' | 'down' = 'down';

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'up';
  } catch (error) {
    console.error('[health] database check failed', error);
  }

  const body = {
    status: database === 'up' ? 'ok' : 'degraded',
    latencyMs: Date.now() - started,
    checks: {
      database,
      google: features.google,
      razorpay: features.razorpay,
      assistant: features.assistant,
      distributedRateLimit: features.distributedRateLimit,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: database === 'up' ? 200 : 503 });
}
