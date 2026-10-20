import type { Prisma, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const userRepository = {
  async byId(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { credit: true },
    });
  },

  /** Admin detail view — user + credits + predictions + payments. */
  async byIdWithDetails(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        credit: true,
        predictions: {
          orderBy: { createdAt: 'desc' },
          include: {
            reports: { select: { id: true, status: true }, take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            creditsSold: true,
            status: true,
            paidAt: true,
            createdAt: true,
            method: true,
          },
        },
        _count: { select: { predictions: true, payments: true, dreamValidations: true } },
      },
    });
  },

  async byEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  async list(params: { page?: number; perPage?: number; search?: string; role?: UserRole }) {
    const { page = 1, perPage = 20, search, role } = params;
    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          credit: true,
          _count: { select: { predictions: true, payments: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
  },

  async setRole(userId: string, role: UserRole) {
    return prisma.user.update({ where: { id: userId }, data: { role } });
  },

  async setBlocked(userId: string, isBlocked: boolean) {
    return prisma.user.update({ where: { id: userId }, data: { isBlocked } });
  },
};
