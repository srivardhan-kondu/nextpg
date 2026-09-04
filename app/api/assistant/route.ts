import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserOrThrow, AuthorizationError } from '@/lib/auth/guards';
import { rateLimit } from '@/lib/security/rate-limit';
import { assertSameOrigin } from '@/lib/security/request';
import { audit } from '@/lib/security/audit';
import {
  askAssistant,
  AssistantLockedError,
  AssistantUnavailableError,
} from '@/services/assistant/assistant.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  predictionId: z.string().cuid(),
  question: z.string().trim().min(3, 'Ask a question').max(1500),
  threadId: z.string().cuid().optional(),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const user = await requireUserOrThrow();

    const verdict = await rateLimit('assistant', `user:${user.id}`);
    if (!verdict.success) {
      return NextResponse.json(
        { error: 'You have reached the assistant limit for this hour.' },
        { status: 429 },
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
    }

    const { threadId, answer } = await askAssistant({
      userId: user.id,
      predictionId: parsed.data.predictionId,
      question: parsed.data.question,
      threadId: parsed.data.threadId,
    });

    await audit({
      userId: user.id,
      action: 'assistant.ask',
      entityType: 'prediction',
      entityId: parsed.data.predictionId,
    });

    return NextResponse.json({ threadId, answer });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }
    if (error instanceof AssistantLockedError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    if (error instanceof AssistantUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error('[assistant] request failed', error);
    return NextResponse.json({ error: 'The assistant could not answer right now.' }, { status: 500 });
  }
}
