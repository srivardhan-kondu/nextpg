import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export class AuthorizationError extends Error {
  constructor(message = 'Not authorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Extends AuthorizationError on purpose: every existing catch site that already
 * treats an authorization failure as "deny" therefore denies a blocked account
 * too, without having to be found and updated first.
 */
export class AccountBlockedError extends AuthorizationError {
  constructor(message = 'This account has been suspended. Contact support if you believe this is a mistake.') {
    super(message);
    this.name = 'AccountBlockedError';
  }
}

export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});

/**
 * Authoritative account state, read from the database on every gated request.
 *
 * The session JWT lives for 30 days and only refreshes its claims at sign-in,
 * so a block or a role change applied by an admin is invisible to the token
 * until it expires. Anything that decides access therefore resolves status
 * here rather than trusting the claim it was handed.
 */
const loadAccountStatus = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isBlocked: true },
  });
});

/**
 * Server-side gate for pages: bounces to login preserving the intended path.
 *
 * A blocked user goes to /blocked, not /login — middleware redirects signed-in
 * users away from /login, so sending them there would bounce them straight back
 * into the app in a loop.
 */
export async function requireUser(returnTo?: string) {
  const user = await getCurrentUser();
  if (!user?.id) {
    redirect(returnTo ? `/login?callbackUrl=${encodeURIComponent(returnTo)}` : '/login');
  }

  const account = await loadAccountStatus(user.id);
  if (!account) redirect('/login');
  if (account.isBlocked) redirect('/blocked');

  return { ...user, role: account.role };
}

/** Gate for server actions / route handlers — throws instead of redirecting. */
export async function requireUserOrThrow() {
  const user = await getCurrentUser();
  if (!user?.id) throw new AuthorizationError('You must be signed in.');

  const account = await loadAccountStatus(user.id);
  if (!account) throw new AuthorizationError('You must be signed in.');
  if (account.isBlocked) throw new AccountBlockedError();

  // The database role, not the token's — callers below build on this.
  return { ...user, role: account.role };
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.id) redirect('/login?callbackUrl=/admin');

  const account = await loadAccountStatus(user.id);
  if (!account) redirect('/login?callbackUrl=/admin');
  if (account.isBlocked) redirect('/blocked');
  if (account.role !== 'ADMIN' && account.role !== 'SUPER_ADMIN') redirect('/dashboard');

  return { ...user, role: account.role };
}

export async function requireAdminOrThrow() {
  // requireUserOrThrow has already resolved the block state and the live role,
  // so this adds no second query.
  const user = await requireUserOrThrow();
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new AuthorizationError('Admin access required.');
  }
  return user;
}
