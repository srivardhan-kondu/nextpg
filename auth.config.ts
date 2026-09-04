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
    /**
     * Maps JWT claims onto the session. This lives in the edge-safe config, not
     * in auth.ts, because middleware builds its session from this config alone —
     * without it `session.user.role` is undefined in middleware and every /admin
     * route redirects, locking admins out of the panel.
     *
     * Safe at the edge: it only reads already-decoded token claims, no Prisma.
     */
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      session.user.role = (token.role as 'USER' | 'ADMIN' | 'SUPER_ADMIN') ?? 'USER';
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
