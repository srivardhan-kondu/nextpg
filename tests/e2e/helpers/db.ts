import { PrismaClient, type UserRole } from '@prisma/client';

/**
 * Direct database access for E2E setup and teardown.
 *
 * Its own client instance: the app's singleton in lib/prisma is scoped to the
 * Next server process, and the test runner is a separate process.
 */
export const db = new PrismaClient();

/**
 * Every account this suite creates carries this prefix, so teardown removes
 * exactly the rows the run made and nothing a human created. Running E2E
 * against a shared database is only safe because of this.
 */
export const E2E_PREFIX = 'e2e-';

export function testEmail(label: string): string {
  // Unique per run so parallel workers and repeat runs never collide.
  return `${E2E_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@nextpg.test`;
}

export async function createUser(options: { email: string; role?: UserRole; credits?: number }) {
  const { email, role = 'USER', credits = 0 } = options;

  const user = await db.user.create({
    data: { email, role, emailVerified: new Date(), name: 'E2E User' },
  });

  await db.predictionCredit.create({
    data: { userId: user.id, balance: credits, purchased: credits, used: 0 },
  });

  // A real user arrives via Google, which writes an Account row. Mirroring it
  // keeps test fixtures the same shape as production data.
  await db.account.create({
    data: {
      userId: user.id,
      type: 'oidc',
      provider: 'google',
      providerAccountId: `e2e-${user.id}`,
    },
  });

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    await db.adminUser.create({ data: { userId: user.id, permissions: ['*'] } });
  }

  return user;
}

export async function creditBalance(userId: string): Promise<number> {
  const credit = await db.predictionCredit.findUnique({ where: { userId } });
  return credit?.balance ?? 0;
}

/** Removes every row this suite created. Cascades handle the dependent tables. */
export async function cleanupE2EData(): Promise<number> {
  const { count } = await db.user.deleteMany({ where: { email: { startsWith: E2E_PREFIX } } });
  return count;
}
