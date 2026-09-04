import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';

import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { ensureCreditAccount } from '@/services/credit.service';

declare module 'next-auth' {
  interface Session {
    user: { id: string; role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' } & DefaultSession['user'];
  }
}

/**
 * Google is the only sign-in method. There is no separate signup: a first
 * Google sign-in creates the account.
 *
 * Session strategy stays JWT even though the Credentials provider is gone.
 * Middleware runs at the edge and cannot query Prisma, so the role has to
 * travel in the token for the /admin gate to work at all. Every admin page then
 * re-reads the role from the database before trusting it.
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
