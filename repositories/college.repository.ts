import type { CollegeType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const collegeRepository = {
  async search(term: string, limit = 12) {
    const q = term.trim();
    if (q.length < 2) {
      return prisma.college.findMany({
        where: { isActive: true },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        take: limit,
        select: { id: true, name: true, shortName: true, state: true, type: true },
      });
    }
    return prisma.college.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { shortName: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { state: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ name: 'asc' }],
      take: limit,
      select: { id: true, name: true, shortName: true, state: true, type: true },
    });
  },

  async byId(id: string) {
    return prisma.college.findUnique({ where: { id } });
  },

  async byName(name: string) {
    return prisma.college.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, isActive: true },
    });
  },

  async list(params: { page?: number; perPage?: number; search?: string; state?: string; type?: CollegeType }) {
    const { page = 1, perPage = 20, search, state, type } = params;
    const where: Prisma.CollegeWhereInput = {
      ...(state ? { state } : {}),
      ...(type ? { type } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.college.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { _count: { select: { cutoffs: true } } },
      }),
      prisma.college.count({ where }),
    ]);
    return { items, total, page, perPage, pages: Math.ceil(total / perPage) };
  },
};

export const branchRepository = {
  async listActive() {
    return prisma.branch.findMany({
      where: { isActive: true },
      orderBy: [{ popularity: 'desc' }, { name: 'asc' }],
    });
  },
  async byName(name: string) {
    return prisma.branch.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
  },
};
