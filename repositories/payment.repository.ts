import type { PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const paymentRepository = {
  async create(data: Prisma.PaymentUncheckedCreateInput) {
    return prisma.payment.create({ data });
  },

  async byOrderId(razorpayOrderId: string) {
    return prisma.payment.findUnique({ where: { razorpayOrderId } });
  },

  async listForUser(userId: string, limit = 20) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async list(params: { page?: number; perPage?: number; status?: PaymentStatus }) {
    const { page = 1, perPage = 20, status } = params;
    const where: Prisma.PaymentWhereInput = status ? { status } : {};
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
      prisma.payment.count({ where }),
    ]);
    return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
  },

  async markPaid(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
    method?: string;
  }) {
    return prisma.payment.update({
      where: { razorpayOrderId: params.razorpayOrderId },
      data: {
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.razorpaySignature,
        method: params.method,
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  },

  async markFailed(razorpayOrderId: string, errorCode?: string, errorDescription?: string) {
    return prisma.payment.updateMany({
      where: { razorpayOrderId, status: { in: ['CREATED', 'ATTEMPTED'] } },
      data: { status: 'FAILED', errorCode, errorDescription },
    });
  },
};
