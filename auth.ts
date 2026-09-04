import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { verifyOtp } from '@/lib/auth/otp';
import { ensureCreditAccount } from '@/services/credit.service';

declare module 'next-auth' {
  interface Session {
    user: { id: string; role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' } & DefaultSession['user'];
  }
}

const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
});

/**
 * Session strategy is JWT rather than database-backed: the OTP flow uses a
 * Credentials provider, which NextAuth only supports with JWT sessions. The
 * Prisma adapter still owns user + OAuth account persistence, and the `sessions`
 * table is retained for adapter compatibility and session auditing.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      id: 'email-otp',
      name: 'Email OTP',
      credentials: { email: {}, otp: {} },
      async authorize(raw) {
        const parsed = otpSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, otp } = parsed.data;
        const verdict = await verifyOtp(email, otp);
        if (verdict !== 'valid') return null;

        const normalized = email.toLowerCase();
        const user = await prisma.user.upsert({
          where: { email: normalized },
          update: { emailVerified: new Date(), lastLogin: new Date() },
          create: { email: normalized, emailVerified: new Date(), lastLogin: new Date() },
        });

        if (user.isBlocked) return null;
        await ensureCreditAccount(user.id);

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (existing?.isBlocked) return false;
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.uid = user.id;
      }
      // Refresh role from the database on sign-in and on explicit session update
      // so an admin promotion or block takes effect without a re-login.
      if (user || trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: (token.uid as string) ?? '' },
          select: { role: true, isBlocked: true },
        });
        token.role = dbUser?.role ?? 'USER';
        if (dbUser?.isBlocked) token.blocked = true;
      }
      return token;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (!user.id) return;
      await ensureCreditAccount(user.id);
      await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: isNewUser ? 'auth.signup' : 'auth.signin',
          entityType: 'user',
          entityId: user.id,
        },
      });
    },
  },
});
