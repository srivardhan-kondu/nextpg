import { headers } from 'next/headers';

/**
 * Best-effort client IP. On Vercel `x-forwarded-for` is set by the edge and the
 * left-most entry is the real client; we never trust it for authorization, only
 * for rate-limit bucketing and audit context.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return h.get('x-real-ip') ?? 'unknown';
}

export async function getUserAgent(): Promise<string> {
  const h = await headers();
  return h.get('user-agent') ?? 'unknown';
}

export async function getRequestContext() {
  const [ipAddress, userAgent] = await Promise.all([getClientIp(), getUserAgent()]);
  return { ipAddress, userAgent };
}

/**
 * Origin check for state-changing route handlers.
 *
 * Next.js Server Actions already carry built-in CSRF protection (origin
 * comparison + non-GET-only invocation), so this exists for our own POST route
 * handlers, which do not.
 */
export async function assertSameOrigin(): Promise<void> {
  const h = await headers();
  const origin = h.get('origin');
  if (!origin) return; // same-origin form posts and server-to-server calls omit it
  const allowed = new Set(
    [process.env.NEXT_PUBLIC_APP_URL, process.env.AUTH_URL].filter(Boolean) as string[],
  );
  if (allowed.size === 0) return;
  const ok = [...allowed].some((a) => {
    try {
      return new URL(a).origin === new URL(origin).origin;
    } catch {
      return false;
    }
  });
  if (!ok) throw new Error('Cross-origin request rejected.');
}
