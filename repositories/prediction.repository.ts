import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { PredictionResult } from '@/types/prediction';

export const predictionRepository = {
  async create(data: Prisma.PredictionUncheckedCreateInput) {
    return prisma.prediction.create({ data });
  },

  /**
   * Scoped by userId on purpose: a prediction id is a cuid, but authorization
   * must never rest on an identifier being hard to guess.
   */
  async byIdForUser(id: string, userId: string) {
    return prisma.prediction.findFirst({
      where: { id, userId },
      include: {
        reports: { orderBy: { createdAt: 'desc' } },
        dreamValidations: { orderBy: { createdAt: 'desc' } },
      },
    });
  },

  async listForUser(userId: string, params: { page?: number; perPage?: number } = {}) {
    const { page = 1, perPage = 10 } = params;
    const [items, total] = await Promise.all([
      prisma.prediction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { reports: { select: { id: true, status: true }, orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      prisma.prediction.count({ where: { userId } }),
    ]);
    return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
  },

  async latestForUser(userId: string) {
    return prisma.prediction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async countForUser(userId: string) {
    return prisma.prediction.count({ where: { userId } });
  },
};

/** Narrow the Json column back to the engine result type at the read boundary. */
export function readPayload(value: Prisma.JsonValue): PredictionResult {
  return value as unknown as PredictionResult;
}
