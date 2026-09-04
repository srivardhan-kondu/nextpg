import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe slice of the auth config — no Prisma, no Node APIs.
 * middleware.ts imports only this; the full config lives in auth.ts.
 */
export const authConfig = {
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
