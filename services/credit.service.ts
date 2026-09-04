import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CREDITS_PER_REPORT } from '@/config/site';

export class InsufficientCreditsError extends Error {
  constructor() {
    super('You do not have enough credits.');
    this.name = 'InsufficientCreditsError';
  }
}

export async function ensureCreditAccount(userId: string) {
  return prisma.predictionCredit.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0, purchased: 0, used: 0 },
  });
}

export async function getBalance(userId: string) {
  const account = await prisma.predictionCredit.findUnique({ where: { userId } });
  return account ?? { balance: 0, purchased: 0, used: 0, userId, id: '', createdAt: new Date(), updatedAt: new Date() };
}

/**
 * Spend one credit and mark a prediction unlocked, atomically.
 *
 * Correctness relies on three things:
 *  1. A single interactive transaction wraps the balance check, the decrement
 *     and the ledger write.
 *  2. The decrement is conditional (`balance: { gte: cost }`) so two concurrent
 *     requests cannot both pass the check — the loser updates zero rows.
 *  3. `idempotencyKey` is unique per prediction, so a retried request cannot
 *     double-charge.
 */
export async function consumeCredit(params: {
  userId: string;
  predictionId: string;
  description?: string;
  cost?: number;
}) {
  const { userId, predictionId, description, cost = CREDITS_PER_REPORT } = params;
  const idempotencyKey = `consume:${predictionId}`;

  return prisma.$transaction(
    async (tx) => {
      // Already paid for? Return the existing ledger row untouched.
      const existing = await tx.creditTransaction.findUnique({ where: { idempotencyKey } });
      if (existing) return { alreadyCharged: true as const, transaction: existing };

      const updated = await tx.predictionCredit.updateMany({
        where: { userId, balance: { gte: cost } },
        data: { balance: { decrement: cost }, used: { increment: cost } },
      });
      if (updated.count === 0) throw new InsufficientCreditsError();

      const account = await tx.predictionCredit.findUniqueOrThrow({ where: { userId } });

      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          type: 'CONSUMPTION',
          amount: -cost,
          balanceAfter: account.balance,
          description: description ?? 'Report unlocked',
          predictionId,
          idempotencyKey,
        },
      });

      await tx.prediction.update({
        where: { id: predictionId },
        data: { status: 'UNLOCKED', unlockedAt: new Date() },
      });

      return { alreadyCharged: false as const, transaction };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}

/**
 * Grant credits after a verified payment. Idempotent on the payment id so a
 * webhook retry (or webhook + client callback racing) credits only once.
 */
export async function grantCredits(params: {
  userId: string;
  credits: number;
  paymentId: string;
  description?: string;
  type?: 'PURCHASE' | 'BONUS' | 'ADMIN_ADJUSTMENT' | 'REFUND';
}) {
  const { userId, credits, paymentId, description, type = 'PURCHASE' } = params;
  const idempotencyKey = `grant:${paymentId}`;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.creditTransaction.findUnique({ where: { idempotencyKey } });
    if (existing) return { alreadyGranted: true as const, transaction: existing };

    await tx.predictionCredit.upsert({
      where: { userId },
      update: {
        balance: { increment: credits },
        purchased: type === 'PURCHASE' ? { increment: credits } : undefined,
      },
      create: {
        userId,
        balance: credits,
        purchased: type === 'PURCHASE' ? credits : 0,
        used: 0,
      },
    });

    const account = await tx.predictionCredit.findUniqueOrThrow({ where: { userId } });

    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        type,
        amount: credits,
        balanceAfter: account.balance,
        description: description ?? `${credits} prediction credits added`,
        paymentId,
        idempotencyKey,
      },
    });

    return { alreadyGranted: false as const, transaction };
  });
}

export async function listTransactions(userId: string, limit = 50) {
  return prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { payment: { select: { id: true, amount: true, status: true } } },
  });
}

/** Admin-only manual adjustment. Always writes an audit trail. */
export async function adjustCredits(params: {
  userId: string;
  delta: number;
  reason: string;
  adminId: string;
}) {
  const { userId, delta, reason, adminId } = params;
  const key = `adjust:${adminId}:${userId}:${Date.now()}`;

  return prisma.$transaction(async (tx) => {
    await tx.predictionCredit.upsert({
      where: { userId },
      update: { balance: { increment: delta } },
      create: { userId, balance: Math.max(0, delta), purchased: 0, used: 0 },
    });
    const account = await tx.predictionCredit.findUniqueOrThrow({ where: { userId } });
    if (account.balance < 0) {
      await tx.predictionCredit.update({ where: { userId }, data: { balance: 0 } });
    }
    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        type: 'ADMIN_ADJUSTMENT',
        amount: delta,
        balanceAfter: Math.max(0, account.balance),
        description: reason,
        idempotencyKey: key,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'admin.credits.adjust',
        entityType: 'user',
        entityId: userId,
        severity: 'warn',
        metadata: { delta, reason },
      },
    });
    return transaction;
  });
}
