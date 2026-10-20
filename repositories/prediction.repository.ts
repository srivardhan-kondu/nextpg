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

  /** Admin-only: paginated view of all predictions with user info attached. */
  async adminList(params: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: string;
    state?: string;
  } = {}) {
    const { page = 1, perPage = 25, search, status, state } = params;

    const where: import('@prisma/client').Prisma.PredictionWhereInput = {
      ...(status ? { status: status as import('@prisma/client').PredictionStatus } : {}),
      ...(state ? { state } : {}),
      ...(search
        ? {
            OR: [
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { candidateName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: { select: { id: true, email: true, name: true } },
          reports: { select: { id: true, status: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      prisma.prediction.count({ where }),
    ]);

    return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
  },

  /** Admin-only: full prediction detail with college list from the resultPayload. */
  async adminById(id: string) {
    return prisma.prediction.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true } },
        reports: { orderBy: { createdAt: 'desc' } },
        dreamValidations: { orderBy: { createdAt: 'desc' } },
      },
    });
  },
};

/** Narrow the Json column back to the engine result type at the read boundary. */
export function readPayload(value: Prisma.JsonValue): PredictionResult {
  return value as unknown as PredictionResult;
}
