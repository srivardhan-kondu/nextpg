import { NextResponse } from 'next/server';
import { z } from 'zod';
import { collegeRepository } from '@/repositories/college.repository';
import { requireUserOrThrow, AuthorizationError, AccountBlockedError } from '@/lib/auth/guards';
import { rateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  q: z.string().trim().max(120).default(''),
  limit: z.coerce.number().int().min(1).max(25).default(10),
});

/** Typeahead for the Dream Validator college picker. */
export async function GET(request: Request) {
  try {
    const user = await requireUserOrThrow();

    const verdict = await rateLimit('search', `user:${user.id}`);
    if (!verdict.success) {
      return NextResponse.json(
        { error: 'Too many searches.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((verdict.reset - Date.now()) / 1000)) } },
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      q: searchParams.get('q') ?? '',
      limit: searchParams.get('limit') ?? 10,
    });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid query.' }, { status: 400 });

    const results = await collegeRepository.search(parsed.data.q, parsed.data.limit);
    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof AccountBlockedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }
    console.error('[colleges/search] failed', error);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
