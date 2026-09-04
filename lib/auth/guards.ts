import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export class AuthorizationError extends Error {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Server-side gate for pages: bounces to login preserving the intended path. */
export async function requireUser(returnTo?: string) {
  const user = await getCurrentUser();
  if (!user?.id) {
    redirect(returnTo ? `/login?callbackUrl=${encodeURIComponent(returnTo)}` : '/login');
  }
  return user;
}

/** Gate for server actions / route handlers — throws instead of redirecting. */
export async function requireUserOrThrow() {
  const user = await getCurrentUser();
  if (!user?.id) throw new AuthorizationError('You must be signed in.');
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.id) redirect('/login?callbackUrl=/admin');
  // Re-read from the database: never trust the role carried in the token alone
  // for privileged pages.
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, isBlocked: true },
  });
  if (!dbUser || dbUser.isBlocked || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN')) {
    redirect('/dashboard');
  }
  return { ...user, role: dbUser.role };
}

export async function requireAdminOrThrow() {
  const user = await requireUserOrThrow();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, isBlocked: true },
  });
  if (!dbUser || dbUser.isBlocked || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN')) {
    throw new AuthorizationError('Admin access required.');
  }
  return { ...user, role: dbUser.role };
}
