import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { features } from '@/lib/env';
import { siteConfig } from '@/config/site';
import { LoginForm } from '@/features/auth/components/login-form';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Sign in',
  description: `Sign in to ${siteConfig.brand} to predict your NEET PG rank and validate your dream college.`,
  robots: { index: false, follow: false },
};

function LoginSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-4 w-16 mx-auto" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-lift">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in to run predictions, validate your dream college and download your reports.
      </p>

      <div className="mt-6">
        {/* useSearchParams inside LoginForm needs a Suspense boundary to prerender. */}
        <Suspense fallback={<LoginSkeleton />}>
          <LoginForm googleEnabled={features.google} />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        By continuing you agree to our{' '}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        . New here? Signing in creates your account automatically.
      </p>
    </div>
  );
}
