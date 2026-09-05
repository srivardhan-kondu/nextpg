import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { features } from '@/lib/env';
import { siteConfig } from '@/config/site';
import { Logo } from '@/components/shared/logo';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  description: `Sign in to ${siteConfig.brand} to predict your NEET PG rank and validate your dream college.`,
  robots: { index: false, follow: false },
};

function LoginSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* Test credentials banner skeleton */}
      <div className="h-[88px] rounded-[10px] bg-[#eceae5] animate-pulse" />
      {/* Email field */}
      <div className="h-[44px] rounded-[8px] bg-[#eceae5] animate-pulse" />
      {/* Password field */}
      <div className="h-[44px] rounded-[8px] bg-[#eceae5] animate-pulse" />
      {/* Submit */}
      <div className="h-[46px] rounded-[9px] bg-[#d4e7e3] animate-pulse" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-7">
      {/* Card */}
      <div
        className="rounded-[14px] bg-white p-8"
        style={{ border: '1px solid rgba(21,25,26,.12)', boxShadow: '0 4px 24px rgba(21,25,26,.09)' }}
      >
        {/* Logo + heading */}
        <div className="mb-7 flex flex-col gap-3">
          <Logo />
          <div>
            <h1 className="m-0 text-[22px] font-normal leading-[1.2] tracking-[-0.02em] text-[#15191a]">
              Sign in to {siteConfig.brand}
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6b7472]">
              Predict your rank, validate your dream and download your report.
            </p>
          </div>
        </div>

        {/* Form — needs Suspense because LoginForm reads useSearchParams */}
        <Suspense fallback={<LoginSkeleton />}>
          <LoginForm googleEnabled={features.google} />
        </Suspense>
      </div>

      {/* Footer legal */}
      <p className="text-center text-[12px] leading-relaxed text-[#838c8a]">
        By continuing you agree to our{' '}
        <Link href="/terms" className="underline underline-offset-2 hover:text-[#4e5654]">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-[#4e5654]">
          Privacy Policy
        </Link>
        . New here? Signing in creates your account automatically.
      </p>
    </div>
  );
}
