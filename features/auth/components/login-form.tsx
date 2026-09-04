'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { requestOtpAction, type ActionState } from '@/actions/auth.actions';
import { OTP_LENGTH } from '@/lib/auth/otp-constants';

const initialState: ActionState = { ok: false };

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

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [state, formAction, isPending] = useActionState(requestOtpAction, initialState);
  const [stage, setStage] = React.useState<'email' | 'otp'>('email');
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);
  const [otpError, setOtpError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message);
      setStage('otp');
    } else if (!state.ok && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setOtpError(null);
    setVerifying(true);

    const result = await signIn('email-otp', { email, otp, redirect: false });

    setVerifying(false);
    if (result?.error) {
      setOtpError('That code is incorrect or has expired. Request a new one if needed.');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  if (stage === 'otp') {
    return (
      <form onSubmit={verify} className="space-y-4">
        <button
          type="button"
          onClick={() => { setStage('email'); setOtp(''); setOtpError(null); }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Use a different email
        </button>

        <div className="space-y-2">
          <Label htmlFor="otp">Enter the {OTP_LENGTH}-digit code</Label>
          <Input
            id="otp"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            required
            autoFocus
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            aria-invalid={Boolean(otpError)}
            aria-describedby={otpError ? 'otp-error' : 'otp-hint'}
            className="text-center text-lg font-semibold tracking-[0.5em]"
            placeholder="000000"
          />
          {otpError ? (
            <p id="otp-error" role="alert" className="text-sm text-destructive">{otpError}</p>
          ) : (
            <p id="otp-hint" className="text-sm text-muted-foreground">
              Sent to <span className="font-medium text-foreground">{email}</span>
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={verifying} disabled={otp.length !== OTP_LENGTH}>
          Verify &amp; continue
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {googleEnabled ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => signIn('google', { callbackUrl })}
          >
            <GoogleIcon /> Continue with Google
          </Button>
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              or
            </span>
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
          />
          {state.fieldErrors?.email ? (
            <p id="email-error" role="alert" className="text-sm text-destructive">
              {state.fieldErrors.email[0]}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isPending}>
          <Mail /> Send login code
        </Button>
      </form>
    </div>
  );
}
