import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Edge-safe instance: authConfig carries no Prisma/Node dependencies.
const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ['/dashboard', '/predictor', '/dream-validator', '/reports', '/credits', '/profile'];
const ADMIN_PREFIX = '/admin';
const AUTH_PAGES = ['/login', '/register'];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { nextUrl } = req;
  const session = req.auth as { user?: { role?: string } } | null;
  const isLoggedIn = Boolean(session?.user);
  const path = nextUrl.pathname;

  // Signed-in users have no business on the login screen.
  if (isLoggedIn && AUTH_PAGES.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  if (!isLoggedIn && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    const url = new URL('/login', nextUrl);
    url.searchParams.set('callbackUrl', `${path}${nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (path.startsWith(ADMIN_PREFIX)) {
    if (!isLoggedIn) {
      const url = new URL('/login', nextUrl);
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
    const role = session?.user?.role;
    // Coarse gate only — every admin page re-verifies the role against the
    // database via requireAdmin(), because a JWT claim is not authorization.
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)'],
};
