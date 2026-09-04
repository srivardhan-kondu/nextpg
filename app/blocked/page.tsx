import type { Metadata } from 'next';
import Link from 'next/link';

import { siteConfig } from '@/config/site';
import { Button, buttonVariants } from '@/components/ui/button';
import { SignOutButton } from '@/features/auth/components/sign-out-button';

export const metadata: Metadata = { title: 'Account suspended', robots: { index: false, follow: false } };

/**
 * Terminus for a blocked account.
 *
 * Deliberately outside every prefix middleware guards: a blocked user is still
 * technically signed in, so sending them to /login would be bounced straight
 * back to /dashboard by the "signed-in users have no business on the login
 * screen" rule, and they would ping-pong forever.
 */
export default function BlockedPage() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Account suspended</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Access to this account has been suspended. If you believe this is a mistake, contact us at{' '}
          <a className="underline underline-offset-4" href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>
          .
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <SignOutButton className={buttonVariants()} />
          <Button asChild variant="outline"><Link href="/">Back to home</Link></Button>
        </div>
      </div>
    </main>
  );
}
