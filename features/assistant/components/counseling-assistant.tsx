'use client';

import * as React from 'react';
import { Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Which branch should I prioritise at my rank?',
  'Should I choose AIQ or state quota?',
  'How should I order my preference list?',
  'What are my realistic backup options?',
];

export function CounselingAssistant({ predictionId }: { predictionId: string }) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [threadId, setThreadId] = React.useState<string | undefined>();
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, pending]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 3 || pending) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setPending(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predictionId, question: trimmed, threadId }),
      });

      const data = (await response.json()) as { answer?: string; threadId?: string; error?: string };

      if (!response.ok) {
        toast.error(data.error ?? 'The assistant could not answer.');
        // Drop the optimistic user message so the transcript stays truthful.
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      if (data.threadId) setThreadId(data.threadId);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer ?? '' }]);
    } catch {
      toast.error('Network error. Please try again.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="max-h-96 space-y-3 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="Counseling assistant conversation"
      >
        {messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              Ask anything about your report
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'max-w-[90%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm leading-relaxed',
                message.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {message.content}
            </div>
          ))
        )}

        {pending ? (
          <div className="flex w-fit gap-1 rounded-lg bg-muted px-4 py-3" aria-label="Assistant is typing">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void ask(input);
        }}
        className="flex items-end gap-2"
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends; Shift+Enter is a newline.
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void ask(input);
            }
          }}
          placeholder="Ask about branches, quotas or your preference order…"
          rows={2}
          maxLength={1500}
          className="resize-none"
          aria-label="Your question"
        />
        <Button type="submit" size="icon" loading={pending} disabled={input.trim().length < 3} aria-label="Send">
          {pending ? null : <Send aria-hidden />}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        The assistant works only from your report data and historical records. It never invents cutoffs, and its
        guidance is not a substitute for official counseling information.
      </p>
    </div>
  );
}
