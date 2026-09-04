'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z" />
    </svg>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: 'That email is already registered through a different sign-in method.',
  AccessDenied: 'This account cannot sign in. If you think that is wrong, contact support.',
  Configuration: 'Sign-in is not configured correctly. Please contact support.',
};

/**
 * Google is the only sign-in method, and it doubles as signup — a first
 * sign-in creates the account. There is deliberately no email/password form.
 */
export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const error = searchParams.get('error');
  const [pending, setPending] = React.useState(false);

  if (!googleEnabled) {
    return (
      <Alert variant="warning">
        <AlertTriangle aria-hidden />
        <AlertTitle>Sign-in is unavailable</AlertTitle>
        <AlertDescription>
          Google sign-in is not configured on this deployment. Set GOOGLE_CLIENT_ID and
          GOOGLE_CLIENT_SECRET to enable it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertTitle>Could not sign you in</AlertTitle>
          <AlertDescription>
            {ERROR_MESSAGES[error] ?? 'Something went wrong. Please try again.'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        loading={pending}
        onClick={() => {
          setPending(true);
          void signIn('google', { callbackUrl });
        }}
      >
        {pending ? null : <GoogleIcon />}
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        No password to remember. Your first sign-in creates your account.
      </p>
    </div>
  );
}
