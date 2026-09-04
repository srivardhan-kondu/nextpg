import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { features } from '@/lib/env';
import { getCurrentUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

/**
 * Liveness + dependency probe for uptime monitoring.
 *
 * Must stay reachable without credentials to be useful as a probe, so the
 * public body is only what a probe needs: is the app up, is the database
 * reachable. Which integrations are wired up is a map of the attack surface
 * and is shown only to an admin.
 */
export async function GET() {
  const started = Date.now();
  let database: 'up' | 'down' = 'down';

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'up';
  } catch (error) {
    console.error('[health] database check failed', error);
  }

  // Session claim only: this decides verbosity, not access, and a probe should
  // not pay for a database round-trip to be told it is anonymous.
  const user = await getCurrentUser();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const body = {
    status: database === 'up' ? 'ok' : 'degraded',
    latencyMs: Date.now() - started,
    checks: {
      database,
      ...(isAdmin
        ? {
            google: features.google,
            razorpay: features.razorpay,
            assistant: features.assistant,
            distributedRateLimit: features.distributedRateLimit,
          }
        : {}),
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: database === 'up' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
