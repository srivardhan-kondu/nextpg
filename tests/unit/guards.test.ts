import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * These cover the rule the whole authorization model rests on: the session
 * token is a routing hint, and the database is the authority. A block or a
 * demotion applied by an admin has to bite on the very next request, not when
 * the 30-day JWT happens to expire.
 */

const authMock = vi.fn();
const findUniqueMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  // Mirrors next/navigation: redirect() never returns.
  throw new Error(`REDIRECT:${url}`);
});

vi.mock('@/auth', () => ({ auth: () => authMock() }));
vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: (args: unknown) => findUniqueMock(args) } },
}));
vi.mock('next/navigation', () => ({ redirect: (url: string) => redirectMock(url) }));

const {
  requireUser,
  requireUserOrThrow,
  requireAdminOrThrow,
  AccountBlockedError,
  AuthorizationError,
} = await import('@/lib/auth/guards');

const signedInAs = (role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' = 'USER') =>
  authMock.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com', role } });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requireUserOrThrow', () => {
  it('rejects a blocked account that still holds a valid session', async () => {
    signedInAs('USER');
    findUniqueMock.mockResolvedValue({ role: 'USER', isBlocked: true });

    await expect(requireUserOrThrow()).rejects.toBeInstanceOf(AccountBlockedError);
  });

  it('is catchable as an AuthorizationError, so existing deny paths still deny', async () => {
    signedInAs('USER');
    findUniqueMock.mockResolvedValue({ role: 'USER', isBlocked: true });

    await expect(requireUserOrThrow()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it('rejects a session whose user row no longer exists', async () => {
    signedInAs('USER');
    findUniqueMock.mockResolvedValue(null);

    await expect(requireUserOrThrow()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it('rejects when signed out', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireUserOrThrow()).rejects.toBeInstanceOf(AuthorizationError);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it('returns the database role, not the token claim', async () => {
    signedInAs('ADMIN'); // stale claim from before a demotion
    findUniqueMock.mockResolvedValue({ role: 'USER', isBlocked: false });

    await expect(requireUserOrThrow()).resolves.toMatchObject({ id: 'u1', role: 'USER' });
  });
});

describe('requireUser', () => {
  it('sends a blocked user to /blocked, not /login', async () => {
    // /login would bounce them straight back to /dashboard via middleware.
    signedInAs('USER');
    findUniqueMock.mockResolvedValue({ role: 'USER', isBlocked: true });

    await expect(requireUser()).rejects.toThrow('REDIRECT:/blocked');
  });

  it('lets an active user through', async () => {
    signedInAs('USER');
    findUniqueMock.mockResolvedValue({ role: 'USER', isBlocked: false });

    await expect(requireUser()).resolves.toMatchObject({ id: 'u1' });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe('requireAdminOrThrow', () => {
  it('refuses a stale ADMIN claim once the database says USER', async () => {
    signedInAs('ADMIN');
    findUniqueMock.mockResolvedValue({ role: 'USER', isBlocked: false });

    await expect(requireAdminOrThrow()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it('honours a promotion the token has not caught up with', async () => {
    signedInAs('USER');
    findUniqueMock.mockResolvedValue({ role: 'ADMIN', isBlocked: false });

    await expect(requireAdminOrThrow()).resolves.toMatchObject({ role: 'ADMIN' });
  });

  it('refuses a blocked admin', async () => {
    signedInAs('SUPER_ADMIN');
    findUniqueMock.mockResolvedValue({ role: 'SUPER_ADMIN', isBlocked: true });

    await expect(requireAdminOrThrow()).rejects.toBeInstanceOf(AccountBlockedError);
  });

  it('resolves status in a single query', async () => {
    signedInAs('ADMIN');
    findUniqueMock.mockResolvedValue({ role: 'ADMIN', isBlocked: false });

    await requireAdminOrThrow();
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });
});
