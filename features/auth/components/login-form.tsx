'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AlertTriangle, Eye, EyeOff, ClipboardCopy, Check } from 'lucide-react';
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
  CredentialsSignin: 'Incorrect email or password. Please try again.',
};

const TEST_EMAIL = 'test@nextpg.in';
const TEST_PASSWORD = 'TestUser@2026';

/** One-click copy chip for the test credentials banner */
function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 rounded-[6px] border border-[#cfdedb] bg-white px-2.5 py-[7px] text-[12.5px] font-mono text-[#0b544e] transition-colors hover:bg-[#e8f1ef]"
      title={`Copy ${label}`}
    >
      <span className="select-none text-[10.5px] leading-none text-[#6b7472] mr-0.5">{label}:</span>
      <span className="font-medium">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-[#10736b] shrink-0" />
      ) : (
        <ClipboardCopy className="h-3 w-3 text-[#838c8a] shrink-0" />
      )}
    </button>
  );
}

/**
 * Login form — supports Google OAuth and test credentials (for Razorpay review).
 * The credentials section is shown when `googleEnabled` is true or always.
 */
export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const error = searchParams.get('error');

  const [googlePending, setGooglePending] = React.useState(false);
  const [credPending, setCredPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setCredPending(true);
    await signIn('test-credentials', { email, password, callbackUrl });
    setCredPending(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Error alert ── */}
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertTitle>Could not sign you in</AlertTitle>
          <AlertDescription>
            {ERROR_MESSAGES[error] ?? 'Something went wrong. Please try again.'}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* ── Test credentials banner ── */}
      <div className="flex flex-col gap-2.5 rounded-[10px] border border-[#cfdedb] bg-[#f4f7f6] p-3.5">
        <div className="flex items-center gap-2">
          <span className="h-[6px] w-[6px] rounded-full bg-[#10736b]" aria-hidden />
          <span className="text-[12px] font-medium leading-none text-[#0b544e]">
            Test account — for reviewer access
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyChip label="Email" value={TEST_EMAIL} />
          <CopyChip label="Password" value={TEST_PASSWORD} />
        </div>
        <p className="text-[11.5px] leading-relaxed text-[#6b7472]">
          Comes pre-loaded with 5 credits and a sample prediction.
        </p>
      </div>

      {/* ── Email / Password form ── */}
      <form id="credentials-form" onSubmit={handleCredentials} className="flex flex-col gap-3">
        <div className="flex flex-col gap-[7px]">
          <label htmlFor="login-email" className="text-[13px] font-medium leading-none text-[#2b3332]">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={TEST_EMAIL}
            className="flex h-[44px] w-full rounded-[8px] border border-black/[0.16] bg-white px-[14px] text-[14.5px] leading-none text-[#15191a] placeholder:text-[#838c8a] focus:border-[#10736b] focus:outline-none focus:ring-1 focus:ring-[#10736b]"
          />
        </div>

        <div className="flex flex-col gap-[7px]">
          <label htmlFor="login-password" className="text-[13px] font-medium leading-none text-[#2b3332]">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="flex h-[44px] w-full rounded-[8px] border border-black/[0.16] bg-white px-[14px] pr-10 text-[14.5px] leading-none text-[#15191a] placeholder:text-[#838c8a] focus:border-[#10736b] focus:outline-none focus:ring-1 focus:ring-[#10736b]"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#838c8a] hover:text-[#4e5654]"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          form="credentials-form"
          disabled={credPending}
          className="mt-1 h-[46px] w-full rounded-[9px] bg-[#10736b] text-[14.5px] font-medium leading-none text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {credPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* ── Divider + Google ── */}
      {googleEnabled && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-black/[0.08]" />
            <span className="text-[12px] text-[#838c8a]">or</span>
            <div className="h-px flex-1 bg-black/[0.08]" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            loading={googlePending}
            onClick={() => {
              setGooglePending(true);
              void signIn('google', { callbackUrl });
            }}
          >
            {googlePending ? null : <GoogleIcon />}
            Continue with Google
          </Button>
        </>
      )}
    </div>
  );
}
