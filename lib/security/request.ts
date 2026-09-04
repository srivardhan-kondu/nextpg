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

  const allowed = new Set(
    [process.env.NEXT_PUBLIC_APP_URL, process.env.AUTH_URL].filter(Boolean) as string[],
  );
  // Fail closed. An empty allowlist means the app is misconfigured, not that
  // every origin is welcome — waving requests through here is exactly how a
  // CSRF guard silently stops guarding.
  if (allowed.size === 0) {
    throw new Error('Cross-origin check is not configured (set NEXT_PUBLIC_APP_URL).');
  }

  // Browsers attach Sec-Fetch-Site to every request, including ones that carry
  // no Origin, so a cross-site POST is rejected here even when Origin is absent.
  const fetchSite = h.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    throw new Error('Cross-origin request rejected.');
  }

  const origin = h.get('origin');
  // No Origin and no cross-site signal: a non-browser caller, which carries no
  // ambient cookie for an attacker to ride. Authentication still gates it.
  if (!origin) return;

  const ok = [...allowed].some((a) => {
    try {
      return new URL(a).origin === new URL(origin).origin;
    } catch {
      return false;
    }
  });
  if (!ok) throw new Error('Cross-origin request rejected.');
}
